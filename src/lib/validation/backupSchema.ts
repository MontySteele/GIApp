/**
 * Backup Validation Schemas
 *
 * One Zod schema per table that appears in an exported backup. These are
 * deliberately permissive on optional fields (values are not range-checked)
 * and strict on `id` plus each table's required keys and enums, so a
 * malformed row is rejected before it can be persisted and crash a page
 * later on.
 *
 * Rows are persisted verbatim after validation (not the parsed output), so
 * the schemas use `looseObject` and never strip or transform data.
 */

import { z } from 'zod';

// ----- SHARED PRIMITIVES -----

const id = z.string().min(1);
const str = z.string();
const num = z.number();
const bool = z.boolean();
const strArray = z.array(z.string());

const bannerType = z.enum(['character', 'weapon', 'standard', 'chronicled']);
const itemType = z.enum(['character', 'weapon']);
const slotKey = z.enum(['flower', 'plume', 'sands', 'goblet', 'circlet']);
const characterPriority = z.enum(['main', 'secondary', 'bench', 'unbuilt']);
const goalCategory = z.enum(['character', 'team', 'abyss', 'exploration', 'pull', 'other']);
const goalStatus = z.enum(['active', 'completed', 'abandoned']);
const primogemSource = z.enum([
  'daily_commission',
  'welkin',
  'event',
  'exploration',
  'abyss',
  'quest',
  'achievement',
  'maintenance',
  'codes',
  'battle_pass',
  'purchase',
  'wish_conversion',
  'cosmetic',
  'other',
]);
const fateSource = z.enum([
  'primogem_conversion',
  'battle_pass',
  'paimon_shop',
  'event',
  'ascension',
  'other',
]);
const fateType = z.enum(['intertwined', 'acquaint']);
const characterRole = z.enum(['dps', 'sub-dps', 'support', 'healer', 'shielder']);
const buildDifficulty = z.enum(['beginner', 'intermediate', 'advanced']);
const buildBudget = z.enum(['f2p', '4-star', 'mixed', 'whale']);
const talentType = z.enum(['auto', 'skill', 'burst']);
const campaignType = z.enum(['character-acquisition', 'character-polish', 'team-polish']);
const campaignStatus = z.enum(['active', 'paused', 'completed', 'archived']);
const priorityRank = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

// ----- PER-TABLE SCHEMAS -----

export const backupCharacterSchema = z.looseObject({
  id,
  key: str.min(1),
  level: num,
  ascension: num,
  constellation: num,
  talent: z.looseObject({ auto: num, skill: num, burst: num }),
  weapon: z.looseObject({ key: str, level: num, ascension: num, refinement: num }),
  artifacts: z.array(z.looseObject({})),
  notes: str,
  priority: characterPriority,
  teamIds: strArray,
  avatarId: num.optional(),
  createdAt: str,
  updatedAt: str,
});

export const backupTeamSchema = z.looseObject({
  id,
  name: str,
  characterKeys: strArray,
  rotationNotes: str,
  tags: strArray,
  memberBuildTemplates: z.record(z.string(), z.string()).optional(),
  createdAt: str,
  updatedAt: str,
});

export const backupWishRecordSchema = z.looseObject({
  id,
  gachaId: str.min(1),
  bannerType,
  bannerVersion: str,
  timestamp: str,
  itemType,
  itemKey: str,
  rarity: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  isFeatured: bool.optional(),
  chartedWeapon: str.nullish(),
  createdAt: str,
  updatedAt: str,
});

export const backupPrimogemEntrySchema = z.looseObject({
  id,
  timestamp: str,
  amount: num,
  source: primogemSource,
  notes: str,
  createdAt: str,
  updatedAt: str,
});

export const backupFateEntrySchema = z.looseObject({
  id,
  timestamp: str,
  amount: num,
  fateType,
  source: fateSource,
  createdAt: str,
  updatedAt: str,
});

export const backupResourceSnapshotSchema = z.looseObject({
  id,
  timestamp: str,
  primogems: num,
  genesisCrystals: num,
  intertwined: num,
  acquaint: num,
  starglitter: num,
  stardust: num,
  createdAt: str,
});

export const backupGoalSchema = z.looseObject({
  id,
  title: str,
  description: str,
  category: goalCategory,
  linkedCharacterKey: str.optional(),
  linkedTeamId: str.optional(),
  status: goalStatus,
  checklist: z.array(z.looseObject({ id: str, text: str, completed: bool })),
  createdAt: str,
  updatedAt: str,
  completedAt: str.optional(),
});

export const backupNoteSchema = z.looseObject({
  id,
  title: str,
  content: str,
  tags: strArray,
  linkedCharacterKey: str.optional(),
  linkedTeamId: str.optional(),
  pinned: bool,
  createdAt: str,
  updatedAt: str,
  deletedAt: str.optional(),
});

export const backupPlannedBannerSchema = z.looseObject({
  id,
  characterKey: str,
  expectedStartDate: str,
  expectedEndDate: str,
  priority: priorityRank,
  maxPullBudget: num.nullable(),
  isConfirmed: bool,
  notes: str,
  createdAt: str,
  updatedAt: str,
});

export const backupCalculatorScenarioSchema = z.looseObject({
  id,
  name: str,
  targets: z.array(z.looseObject({ bannerType })),
  availablePulls: num,
  iterations: num,
  resultProbability: num.optional(),
  createdAt: str,
  updatedAt: str,
});

export const backupInventoryArtifactSchema = z.looseObject({
  id,
  setKey: str,
  slotKey,
  level: num,
  rarity: num,
  mainStatKey: str,
  substats: z.array(z.looseObject({ key: str, value: num })),
  location: str,
  lock: bool,
  createdAt: str,
  updatedAt: str,
});

export const backupInventoryWeaponSchema = z.looseObject({
  id,
  key: str,
  level: num,
  ascension: num,
  refinement: num,
  location: str,
  lock: bool,
  createdAt: str,
  updatedAt: str,
});

export const backupMaterialInventorySchema = z.looseObject({
  id,
  materials: z.record(z.string(), z.number()),
  updatedAt: str,
});

export const backupImportRecordSchema = z.looseObject({
  id,
  source: str,
  filename: str.optional(),
  importedAt: str,
  characterCount: num,
  artifactCount: num,
  weaponCount: num,
  materialCount: num,
});

export const backupBuildTemplateSchema = z.looseObject({
  id,
  name: str,
  characterKey: str,
  description: str,
  role: characterRole,
  notes: str,
  weapons: z.looseObject({ primary: strArray, alternatives: strArray }),
  artifacts: z.looseObject({
    sets: z.array(z.array(z.looseObject({}))),
    mainStats: z.looseObject({ sands: strArray, goblet: strArray, circlet: strArray }),
    substats: strArray,
  }),
  leveling: z.looseObject({
    targetLevel: num,
    targetAscension: num,
    talentPriority: z.array(talentType),
  }),
  tags: strArray,
  difficulty: buildDifficulty,
  budget: buildBudget,
  source: str.optional(),
  gameVersion: str.optional(),
  isOfficial: bool,
  createdAt: str,
  updatedAt: str,
});

export const backupCampaignSchema = z.looseObject({
  id,
  type: campaignType,
  name: str,
  status: campaignStatus,
  priority: priorityRank,
  deadline: str.optional(),
  pullTargets: z.array(z.looseObject({ id: str, itemKey: str, itemType, bannerType })),
  characterTargets: z.array(z.looseObject({ id: str, characterKey: str })),
  teamTarget: z.looseObject({ memberKeys: strArray }).optional(),
  notes: str,
  createdAt: str,
  updatedAt: str,
});

export const backupAppMetaSchema = z.looseObject({
  key: str.min(1),
  value: z.unknown(),
});

/**
 * Every table the restore path knows how to validate. Tables absent from this
 * map (e.g. `abyssRuns`, legacy `externalCache`) are ignored by validation.
 */
export const BACKUP_TABLE_SCHEMAS = {
  characters: backupCharacterSchema,
  teams: backupTeamSchema,
  wishRecords: backupWishRecordSchema,
  primogemEntries: backupPrimogemEntrySchema,
  fateEntries: backupFateEntrySchema,
  resourceSnapshots: backupResourceSnapshotSchema,
  goals: backupGoalSchema,
  notes: backupNoteSchema,
  plannedBanners: backupPlannedBannerSchema,
  calculatorScenarios: backupCalculatorScenarioSchema,
  inventoryArtifacts: backupInventoryArtifactSchema,
  inventoryWeapons: backupInventoryWeaponSchema,
  materialInventory: backupMaterialInventorySchema,
  importRecords: backupImportRecordSchema,
  buildTemplates: backupBuildTemplateSchema,
  campaigns: backupCampaignSchema,
  appMeta: backupAppMetaSchema,
} as const;

export type BackupTableName = keyof typeof BACKUP_TABLE_SCHEMAS;

const MAX_ROW_ERRORS_PER_TABLE = 5;

function formatIssuePath(path: PropertyKey[]): string {
  return path.length > 0 ? path.map(String).join('.') : '(row)';
}

/**
 * Validate every known table in a backup payload.
 *
 * Returns one human-readable error string per offending table, listing the
 * first few bad rows (index + field + message). An empty array means every
 * known table is well-formed. Unknown tables are ignored.
 */
export function validateBackupTables(payload: Record<string, unknown>): string[] {
  const errors: string[] = [];

  for (const [tableName, schema] of Object.entries(BACKUP_TABLE_SCHEMAS)) {
    if (!(tableName in payload)) continue;

    const rows = payload[tableName];
    if (rows === undefined || rows === null) continue;

    if (!Array.isArray(rows)) {
      errors.push(`${tableName}: expected an array of records`);
      continue;
    }

    const rowErrors: string[] = [];
    let invalidRows = 0;

    rows.forEach((row, index) => {
      const result = schema.safeParse(row);
      if (result.success) return;

      invalidRows++;
      if (rowErrors.length < MAX_ROW_ERRORS_PER_TABLE) {
        const issue = result.error.issues[0];
        const detail = issue ? `${formatIssuePath(issue.path)} - ${issue.message}` : 'invalid row';
        rowErrors.push(`[${index}] ${detail}`);
      }
    });

    if (invalidRows > 0) {
      const overflow = invalidRows - rowErrors.length;
      const suffix = overflow > 0 ? `; and ${overflow} more invalid row${overflow === 1 ? '' : 's'}` : '';
      errors.push(`${tableName}: ${invalidRows} invalid row${invalidRows === 1 ? '' : 's'} (${rowErrors.join('; ')}${suffix})`);
    }
  }

  return errors;
}
