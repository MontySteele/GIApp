/**
 * Import Service - Handles backup restore with merge strategies
 *
 * Every restore goes through `validateBackup` (envelope + per-table Zod
 * validation) before a single row is written. Invalid files are rejected
 * with a per-table error list.
 */
import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION } from '@/lib/constants';
import { validateBackupTables, validateBackupLocalState, type BackupLocalStateEntry } from '@/lib/validation/backupSchema';
import { restoreLocalState } from './localStateService';
import { ensurePersistentStorage } from './storageHealth';
import { WISH_HISTORY_IMPORTED_AT_KEY } from '@/features/wishes/services/wishDataFreshness';
import type {
  Character,
  Team,
  WishRecord,
  PrimogemEntry,
  FateEntry,
  ResourceSnapshot,
  AbyssRun,
  Goal,
  Note,
  PlannedBanner,
  CalculatorScenario,
  InventoryArtifact,
  InventoryWeapon,
  MaterialInventory,
  ImportRecord,
  BuildTemplate,
  Campaign,
  AppMeta,
} from '@/types';

// ----- TYPES -----

export type MergeStrategy = 'replace' | 'newer_wins' | 'keep_local';

export interface BackupData {
  exportedAt: string;
  schemaVersion: number;
  data: {
    characters?: Character[];
    teams?: Team[];
    wishRecords?: WishRecord[];
    primogemEntries?: PrimogemEntry[];
    fateEntries?: FateEntry[];
    resourceSnapshots?: ResourceSnapshot[];
    goals?: Goal[];
    notes?: Note[];
    plannedBanners?: PlannedBanner[];
    calculatorScenarios?: CalculatorScenario[];
    inventoryArtifacts?: InventoryArtifact[];
    inventoryWeapons?: InventoryWeapon[];
    materialInventory?: MaterialInventory[];
    importRecords?: ImportRecord[];
    buildTemplates?: BuildTemplate[];
    campaigns?: Campaign[];
    /** Exported for completeness; only whitelisted keys are restored. */
    appMeta?: AppMeta[];
    /** Exported but not restored (no UI consumes it yet). */
    abyssRuns?: AbyssRun[];
  };
  /**
   * localStorage-held product data (wishlist, planner state, resin budget,
   * weekly boss progress, campaign action states, calculator state, onboarding
   * flags) as raw serialized strings. Restored last-write-wins for allowlisted
   * keys only. Absent from backups made before this section existed.
   */
  localState?: BackupLocalStateEntry[];
}

type TableStats = { created: number; updated: number; skipped: number };

export interface ImportResult {
  success: boolean;
  stats: {
    characters: TableStats;
    teams: TableStats;
    wishRecords: { created: number; skipped: number };
    primogemEntries: TableStats;
    fateEntries: TableStats;
    resourceSnapshots: TableStats;
    goals: TableStats;
    notes: TableStats;
    plannedBanners: TableStats;
    calculatorScenarios: TableStats;
    inventoryArtifacts: TableStats;
    inventoryWeapons: TableStats;
    materialInventory: TableStats;
    importRecords: TableStats;
    buildTemplates: TableStats;
    campaigns: TableStats;
    /** localStorage entries written (created) or ignored as non-allowlisted (skipped). */
    localState: { created: number; skipped: number };
  };
  warnings: string[];
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  backupInfo: {
    exportedAt: string;
    schemaVersion: number;
    recordCounts: Record<string, number>;
  } | null;
}

/**
 * `appMeta` keys that are restored from a backup. Everything else in the
 * exported `appMeta` table is device-local bookkeeping and is skipped:
 * - `schemaVersion` is owned by the running app and must never be overwritten
 * - `deviceId`, `createdAt`, `lastBackupAt` describe the source device
 */
export const APP_META_RESTORE_WHITELIST: readonly string[] = [WISH_HISTORY_IMPORTED_AT_KEY];

/** Tables restored with a merge strategy (id-keyed, have updatedAt). */
const MERGE_TABLES = [
  'teams',
  'primogemEntries',
  'fateEntries',
  'resourceSnapshots',
  'goals',
  'notes',
  'plannedBanners',
  'calculatorScenarios',
  'importRecords',
  'buildTemplates',
  'campaigns',
] as const;

type MergeTableName = (typeof MERGE_TABLES)[number];

/** Tables cleared before writing when strategy is 'replace' and the backup includes them. */
const REPLACE_CLEARABLE_TABLES = ['characters', 'wishRecords', ...MERGE_TABLES] as const;

// ----- VALIDATION -----

export function validateBackup(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: ['Invalid backup format - expected object'],
      warnings: [],
      backupInfo: null,
    };
  }

  const backup = data as Record<string, unknown>;

  // Check required fields
  if (typeof backup.exportedAt !== 'string') {
    errors.push('Missing or invalid exportedAt timestamp');
  }

  if (typeof backup.schemaVersion !== 'number') {
    errors.push('Missing or invalid schemaVersion');
  }

  if (!backup.data || typeof backup.data !== 'object' || Array.isArray(backup.data)) {
    errors.push('Missing or invalid data payload');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      warnings,
      backupInfo: null,
    };
  }

  // Schema version compatibility
  const schemaVersion = backup.schemaVersion as number;
  if (schemaVersion > APP_SCHEMA_VERSION) {
    errors.push(
      `Backup schema version (${schemaVersion}) is newer than app version (${APP_SCHEMA_VERSION}). Please update the app.`
    );
  } else if (schemaVersion < APP_SCHEMA_VERSION) {
    warnings.push(
      `Backup from older schema version (${schemaVersion}). Some data may need migration.`
    );
  }

  // Per-table row validation
  const dataPayload = backup.data as Record<string, unknown>;
  errors.push(...validateBackupTables(dataPayload));
  errors.push(...validateBackupLocalState(backup.localState));

  if (Array.isArray(dataPayload.abyssRuns) && dataPayload.abyssRuns.length > 0) {
    warnings.push('Backup contains abyssRuns, which this version does not restore.');
  }

  // Count records
  const recordCounts: Record<string, number> = {};
  for (const [key, value] of Object.entries(dataPayload)) {
    if (Array.isArray(value)) {
      recordCounts[key] = value.length;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    backupInfo: {
      exportedAt: backup.exportedAt as string,
      schemaVersion,
      recordCounts,
    },
  };
}

// ----- MERGE HELPERS -----

function isNewer(incoming: string | undefined, existing: string | undefined): boolean {
  if (!incoming) return false;
  if (!existing) return true;
  return new Date(incoming).getTime() > new Date(existing).getTime();
}

function emptyStats(): TableStats {
  return { created: 0, updated: 0, skipped: 0 };
}

async function mergeTable<T extends { id: string; updatedAt?: string }>(
  tableName: MergeTableName,
  incoming: T[],
  strategy: MergeStrategy,
  keyField: keyof T = 'id'
): Promise<TableStats> {
  const stats = emptyStats();
  const table = db.table(tableName);

  for (const item of incoming) {
    const key = item[keyField] as string;
    const existing = await table.get(key);

    if (!existing) {
      // New record - always create
      await table.put(item);
      stats.created++;
    } else if (strategy === 'replace') {
      // Replace existing
      await table.put(item);
      stats.updated++;
    } else if (strategy === 'newer_wins') {
      // Update only if incoming is newer
      if (isNewer(item.updatedAt, (existing as T).updatedAt)) {
        await table.put(item);
        stats.updated++;
      } else {
        stats.skipped++;
      }
    } else {
      // keep_local - skip existing
      stats.skipped++;
    }
  }

  return stats;
}

// ----- IMPORT FUNCTIONS -----

async function importCharacters(
  characters: Character[],
  strategy: MergeStrategy
): Promise<TableStats> {
  const stats = emptyStats();

  for (const char of characters) {
    const existing = await db.characters.get(char.id);

    if (!existing) {
      // Also check by key (character name) for smarter dedup
      const existingByKey = await db.characters.where('key').equals(char.key).first();
      if (existingByKey) {
        // Character exists with different ID - update based on strategy
        if (strategy === 'replace' || (strategy === 'newer_wins' && isNewer(char.updatedAt, existingByKey.updatedAt))) {
          await db.characters.update(existingByKey.id, {
            ...char,
            id: existingByKey.id, // Keep existing ID
            teamIds: [...new Set([...existingByKey.teamIds, ...char.teamIds])], // Merge team associations
          });
          stats.updated++;
        } else {
          stats.skipped++;
        }
      } else {
        await db.characters.put(char);
        stats.created++;
      }
    } else if (strategy === 'replace') {
      await db.characters.put({
        ...char,
        teamIds: [...new Set([...existing.teamIds, ...char.teamIds])],
      });
      stats.updated++;
    } else if (strategy === 'newer_wins') {
      if (isNewer(char.updatedAt, existing.updatedAt)) {
        await db.characters.put({
          ...char,
          teamIds: [...new Set([...existing.teamIds, ...char.teamIds])],
        });
        stats.updated++;
      } else {
        stats.skipped++;
      }
    } else {
      stats.skipped++;
    }
  }

  return stats;
}

async function importWishRecords(wishRecords: WishRecord[]): Promise<{ created: number; skipped: number }> {
  const stats = { created: 0, skipped: 0 };

  for (const wish of wishRecords) {
    // Dedup by gachaId (original game API ID)
    const existing = await db.wishRecords.where('gachaId').equals(wish.gachaId).first();
    if (existing) {
      stats.skipped++;
    } else {
      await db.wishRecords.put(wish);
      stats.created++;
    }
  }

  return stats;
}

async function importAppMeta(entries: AppMeta[]): Promise<number> {
  let restored = 0;
  for (const entry of entries) {
    if (!APP_META_RESTORE_WHITELIST.includes(entry.key)) continue;
    await db.appMeta.put({ key: entry.key, value: entry.value });
    restored++;
  }
  return restored;
}

/**
 * Inventory tables represent a point-in-time snapshot, not individually
 * authored records, so the merge strategy does not apply: whenever the
 * backup includes the table (even empty), replace local data wholesale.
 * A backup that omits the table entirely leaves local data untouched,
 * with a warning so stale inventories can't linger silently.
 */
async function importSnapshotTable<T>(
  table: { clear(): Promise<void>; bulkPut(items: T[]): Promise<unknown>; count(): Promise<number> },
  incoming: T[] | undefined,
  missingWarning: string,
  warnings: string[]
): Promise<TableStats | null> {
  if (incoming) {
    await table.clear();
    await table.bulkPut(incoming);
    return { created: incoming.length, updated: 0, skipped: 0 };
  }

  if ((await table.count()) > 0) {
    warnings.push(missingWarning);
  }
  return null;
}

// ----- MAIN IMPORT FUNCTION -----

export async function importBackup(
  backup: BackupData,
  strategy: MergeStrategy,
  onProgress?: (stage: string, progress: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    stats: {
      characters: emptyStats(),
      teams: emptyStats(),
      wishRecords: { created: 0, skipped: 0 },
      primogemEntries: emptyStats(),
      fateEntries: emptyStats(),
      resourceSnapshots: emptyStats(),
      goals: emptyStats(),
      notes: emptyStats(),
      plannedBanners: emptyStats(),
      calculatorScenarios: emptyStats(),
      inventoryArtifacts: emptyStats(),
      inventoryWeapons: emptyStats(),
      materialInventory: emptyStats(),
      importRecords: emptyStats(),
      buildTemplates: emptyStats(),
      campaigns: emptyStats(),
      localState: { created: 0, skipped: 0 },
    },
    warnings: [],
    errors: [],
  };

  // Validate the whole file before touching the database.
  const validation = validateBackup(backup);
  result.warnings.push(...validation.warnings);
  if (!validation.valid) {
    result.success = false;
    result.errors.push(...validation.errors);
    return result;
  }

  const { data } = backup;

  type MergeStage = { table: MergeTableName; label: string };
  const mergeStages: MergeStage[] = [
    { table: 'teams', label: 'Importing teams...' },
    { table: 'primogemEntries', label: 'Importing primogem entries...' },
    { table: 'fateEntries', label: 'Importing fate entries...' },
    { table: 'resourceSnapshots', label: 'Importing resource snapshots...' },
    { table: 'goals', label: 'Importing goals...' },
    { table: 'notes', label: 'Importing notes...' },
    { table: 'plannedBanners', label: 'Importing planned banners...' },
    { table: 'calculatorScenarios', label: 'Importing calculator scenarios...' },
    { table: 'importRecords', label: 'Importing import history...' },
    { table: 'buildTemplates', label: 'Importing build templates...' },
    { table: 'campaigns', label: 'Importing targets...' },
  ];

  // characters + wishRecords + merge tables + 3 inventory tables + appMeta + localState
  const totalStages = 2 + mergeStages.length + 3 + 1 + 1;
  let stageIndex = 0;
  const report = (label: string) => onProgress?.(label, (stageIndex / totalStages) * 100);

  try {
    // Use transaction for atomicity
    await db.transaction('rw', db.tables, async () => {
      // "Replace All": drop local rows for every table the backup includes so
      // rows that exist only locally do not survive the restore. Tables the
      // backup omits entirely are left alone.
      if (strategy === 'replace') {
        for (const tableName of REPLACE_CLEARABLE_TABLES) {
          if (Array.isArray(data[tableName])) {
            await db.table(tableName).clear();
          }
        }
      }

      // Characters (special handling)
      if (data.characters?.length) {
        report('Importing characters...');
        result.stats.characters = await importCharacters(data.characters, strategy);
      }
      stageIndex++;

      // Wish Records (dedup by gachaId, no merge strategy)
      if (data.wishRecords?.length) {
        report('Importing wish records...');
        result.stats.wishRecords = await importWishRecords(data.wishRecords);
      }
      stageIndex++;

      for (const stage of mergeStages) {
        const rows = data[stage.table] as Array<{ id: string; updatedAt?: string }> | undefined;
        if (rows?.length) {
          report(stage.label);
          result.stats[stage.table] = await mergeTable(stage.table, rows, strategy);
        }
        stageIndex++;
      }

      report('Importing inventory artifacts...');
      const artifactStats = await importSnapshotTable(
        db.inventoryArtifacts,
        data.inventoryArtifacts,
        'Backup did not include artifact inventory - existing local artifacts were kept and may be stale.',
        result.warnings
      );
      if (artifactStats) result.stats.inventoryArtifacts = artifactStats;
      stageIndex++;

      report('Importing inventory weapons...');
      const weaponStats = await importSnapshotTable(
        db.inventoryWeapons,
        data.inventoryWeapons,
        'Backup did not include weapon inventory - existing local weapons were kept and may be stale.',
        result.warnings
      );
      if (weaponStats) result.stats.inventoryWeapons = weaponStats;
      stageIndex++;

      report('Importing material inventory...');
      const materialStats = await importSnapshotTable(
        db.materialInventory,
        data.materialInventory,
        'Backup did not include material inventory - existing local materials were kept and may be stale.',
        result.warnings
      );
      if (materialStats) result.stats.materialInventory = materialStats;
      stageIndex++;

      // App metadata: whitelisted keys only, regardless of strategy
      if (data.appMeta?.length) {
        report('Importing metadata...');
        await importAppMeta(data.appMeta);
      }
      stageIndex++;
    });

    // localStorage product data: written only after the DB transaction has
    // committed so a failed restore leaves local state untouched. Allowlisted
    // keys only, last-write-wins in every merge mode.
    if (backup.localState?.length) {
      report('Restoring local settings...');
      result.stats.localState = await restoreLocalState(backup.localState);
    }
    stageIndex++;

    onProgress?.('Complete', 100);

    // First successful restore is a good moment to ask for durable storage.
    ensurePersistentStorage();
  } catch (error) {
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error during import');
  }

  return result;
}

// ----- PARTIAL IMPORT (specific tables only) -----

export type ImportableTable = 'wishRecords' | 'characters' | 'teams' | 'goals' | 'notes';

export async function importPartial(
  backup: BackupData,
  tables: ImportableTable[],
  strategy: MergeStrategy
): Promise<Partial<ImportResult['stats']>> {
  const validation = validateBackup(backup);
  if (!validation.valid) {
    throw new Error(`Backup failed validation: ${validation.errors.join('; ')}`);
  }

  const stats: Partial<ImportResult['stats']> = {};
  const { data } = backup;

  await db.transaction('rw', db.tables, async () => {
    if (strategy === 'replace') {
      for (const tableName of tables) {
        if (Array.isArray(data[tableName])) {
          await db.table(tableName).clear();
        }
      }
    }

    if (tables.includes('characters') && data.characters?.length) {
      stats.characters = await importCharacters(data.characters, strategy);
    }

    if (tables.includes('teams') && data.teams?.length) {
      stats.teams = await mergeTable('teams', data.teams, strategy);
    }

    if (tables.includes('wishRecords') && data.wishRecords?.length) {
      stats.wishRecords = await importWishRecords(data.wishRecords);
    }

    if (tables.includes('goals') && data.goals?.length) {
      stats.goals = await mergeTable('goals', data.goals, strategy);
    }

    if (tables.includes('notes') && data.notes?.length) {
      stats.notes = await mergeTable('notes', data.notes, strategy);
    }
  });

  return stats;
}
