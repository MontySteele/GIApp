/**
 * Import Service - Handles backup restore with merge strategies
 */
import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION } from '@/lib/constants';
import type {
  Character,
  Team,
  WishRecord,
  PrimogemEntry,
  FateEntry,
  ResourceSnapshot,
  Goal,
  Note,
  PlannedBanner,
  CalculatorScenario,
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
    // Intentionally not importing: externalCache, appMeta
  };
}

export interface ImportResult {
  success: boolean;
  stats: {
    characters: { created: number; updated: number; skipped: number };
    teams: { created: number; updated: number; skipped: number };
    wishRecords: { created: number; skipped: number };
    primogemEntries: { created: number; updated: number; skipped: number };
    fateEntries: { created: number; updated: number; skipped: number };
    resourceSnapshots: { created: number; updated: number; skipped: number };
    goals: { created: number; updated: number; skipped: number };
    notes: { created: number; updated: number; skipped: number };
    plannedBanners: { created: number; updated: number; skipped: number };
    calculatorScenarios: { created: number; updated: number; skipped: number };
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

  if (!backup.data || typeof backup.data !== 'object') {
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

  // Count records
  const dataPayload = backup.data as Record<string, unknown[]>;
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

type TableStats = { created: number; updated: number; skipped: number };

async function mergeTable<T extends { id: string; updatedAt?: string }>(
  tableName: string,
  incoming: T[],
  strategy: MergeStrategy,
  keyField: keyof T = 'id'
): Promise<TableStats> {
  const stats: TableStats = { created: 0, updated: 0, skipped: 0 };
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
  const stats: TableStats = { created: 0, updated: 0, skipped: 0 };

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

// ----- MAIN IMPORT FUNCTION -----

export async function importBackup(
  backup: BackupData,
  strategy: MergeStrategy,
  onProgress?: (stage: string, progress: number) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    stats: {
      characters: { created: 0, updated: 0, skipped: 0 },
      teams: { created: 0, updated: 0, skipped: 0 },
      wishRecords: { created: 0, skipped: 0 },
      primogemEntries: { created: 0, updated: 0, skipped: 0 },
      fateEntries: { created: 0, updated: 0, skipped: 0 },
      resourceSnapshots: { created: 0, updated: 0, skipped: 0 },
      goals: { created: 0, updated: 0, skipped: 0 },
      notes: { created: 0, updated: 0, skipped: 0 },
      plannedBanners: { created: 0, updated: 0, skipped: 0 },
      calculatorScenarios: { created: 0, updated: 0, skipped: 0 },
    },
    warnings: [],
    errors: [],
  };

  const { data } = backup;
  const stages = [
    'characters',
    'teams',
    'wishRecords',
    'primogemEntries',
    'fateEntries',
    'resourceSnapshots',
    'goals',
    'notes',
    'plannedBanners',
    'calculatorScenarios',
  ];
  let stageIndex = 0;

  try {
    // Use transaction for atomicity
    await db.transaction('rw', db.tables, async () => {
      // Characters (special handling)
      if (data.characters?.length) {
        onProgress?.('Importing characters...', (stageIndex / stages.length) * 100);
        result.stats.characters = await importCharacters(data.characters, strategy);
      }
      stageIndex++;

      // Teams
      if (data.teams?.length) {
        onProgress?.('Importing teams...', (stageIndex / stages.length) * 100);
        result.stats.teams = await mergeTable('teams', data.teams, strategy);
      }
      stageIndex++;

      // Wish Records (dedup by gachaId, no merge strategy)
      if (data.wishRecords?.length) {
        onProgress?.('Importing wish records...', (stageIndex / stages.length) * 100);
        result.stats.wishRecords = await importWishRecords(data.wishRecords);
      }
      stageIndex++;

      // Primogem Entries
      if (data.primogemEntries?.length) {
        onProgress?.('Importing primogem entries...', (stageIndex / stages.length) * 100);
        result.stats.primogemEntries = await mergeTable('primogemEntries', data.primogemEntries, strategy);
      }
      stageIndex++;

      // Fate Entries
      if (data.fateEntries?.length) {
        onProgress?.('Importing fate entries...', (stageIndex / stages.length) * 100);
        result.stats.fateEntries = await mergeTable('fateEntries', data.fateEntries, strategy);
      }
      stageIndex++;

      // Resource Snapshots
      if (data.resourceSnapshots?.length) {
        onProgress?.('Importing resource snapshots...', (stageIndex / stages.length) * 100);
        result.stats.resourceSnapshots = await mergeTable('resourceSnapshots', data.resourceSnapshots, strategy);
      }
      stageIndex++;

      // Goals
      if (data.goals?.length) {
        onProgress?.('Importing goals...', (stageIndex / stages.length) * 100);
        result.stats.goals = await mergeTable('goals', data.goals, strategy);
      }
      stageIndex++;

      // Notes
      if (data.notes?.length) {
        onProgress?.('Importing notes...', (stageIndex / stages.length) * 100);
        result.stats.notes = await mergeTable('notes', data.notes, strategy);
      }
      stageIndex++;

      // Planned Banners
      if (data.plannedBanners?.length) {
        onProgress?.('Importing planned banners...', (stageIndex / stages.length) * 100);
        result.stats.plannedBanners = await mergeTable('plannedBanners', data.plannedBanners, strategy);
      }
      stageIndex++;

      // Calculator Scenarios
      if (data.calculatorScenarios?.length) {
        onProgress?.('Importing calculator scenarios...', (stageIndex / stages.length) * 100);
        result.stats.calculatorScenarios = await mergeTable('calculatorScenarios', data.calculatorScenarios, strategy);
      }
    });

    onProgress?.('Complete', 100);
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
  const stats: Partial<ImportResult['stats']> = {};
  const { data } = backup;

  await db.transaction('rw', db.tables, async () => {
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
