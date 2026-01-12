import Dexie, { type EntityTable } from 'dexie';
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
  ExternalCache,
  AppMeta,
  CalculatorScenario,
  InventoryArtifact,
  InventoryWeapon,
  MaterialInventory,
  ImportRecord,
  BuildTemplate,
} from '@/types';

export const SCHEMA_STORES = {
  characters: 'id, key, priority, updatedAt',
  teams: 'id, updatedAt',
  wishRecords:
    'id, gachaId, bannerType, timestamp, rarity, itemKey, [bannerType+timestamp], [rarity+timestamp]',
  primogemEntries: 'id, timestamp, source, [source+timestamp]',
  fateEntries: 'id, timestamp',
  resourceSnapshots: 'id, timestamp',
  abyssRuns: 'id, cycleStart, floor, [cycleStart+floor+chamber]',
  goals: 'id, status, category, updatedAt',
  notes: 'id, *tags, updatedAt, pinned',
  plannedBanners: 'id, characterKey, expectedStartDate, priority',
  externalCache: 'id, cacheKey, expiresAt',
  appMeta: 'key',
};

export const SCHEMA_STORES_V2 = {
  ...SCHEMA_STORES,
  calculatorScenarios: 'id, name, updatedAt',
};

// V3: Add inventory tables for Irminsul/GOOD imports
export const SCHEMA_STORES_V3 = {
  ...SCHEMA_STORES_V2,
  // Standalone artifacts (can be equipped or unequipped)
  // Indexed by location for quick character lookups
  inventoryArtifacts: 'id, setKey, slotKey, location, rarity, updatedAt',
  // Standalone weapons (can be equipped or unequipped)
  inventoryWeapons: 'id, key, location, updatedAt',
  // Material counts (singleton document)
  materialInventory: 'id',
  // Import history for tracking data sources
  importRecords: 'id, source, importedAt',
};

// V4: Add build templates
export const SCHEMA_STORES_V4 = {
  ...SCHEMA_STORES_V3,
  // Build templates for characters
  // Indexed for filtering by character, role, difficulty, budget
  buildTemplates: 'id, characterKey, role, difficulty, budget, isOfficial, updatedAt, *tags',
};

export class GenshinTrackerDB extends Dexie {
  characters!: EntityTable<Character, 'id'>;
  teams!: EntityTable<Team, 'id'>;
  wishRecords!: EntityTable<WishRecord, 'id'>;
  primogemEntries!: EntityTable<PrimogemEntry, 'id'>;
  fateEntries!: EntityTable<FateEntry, 'id'>;
  resourceSnapshots!: EntityTable<ResourceSnapshot, 'id'>;
  abyssRuns!: EntityTable<AbyssRun, 'id'>;
  goals!: EntityTable<Goal, 'id'>;
  notes!: EntityTable<Note, 'id'>;
  plannedBanners!: EntityTable<PlannedBanner, 'id'>;
  externalCache!: EntityTable<ExternalCache, 'id'>;
  appMeta!: EntityTable<AppMeta, 'key'>;
  calculatorScenarios!: EntityTable<CalculatorScenario, 'id'>;
  // V3 tables
  inventoryArtifacts!: EntityTable<InventoryArtifact, 'id'>;
  inventoryWeapons!: EntityTable<InventoryWeapon, 'id'>;
  materialInventory!: EntityTable<MaterialInventory, 'id'>;
  importRecords!: EntityTable<ImportRecord, 'id'>;
  // V4 tables
  buildTemplates!: EntityTable<BuildTemplate, 'id'>;

  constructor(databaseName = 'GenshinTracker') {
    super(databaseName);

    this.version(1).stores(SCHEMA_STORES);
    this.version(2).stores(SCHEMA_STORES_V2);
    this.version(3).stores(SCHEMA_STORES_V3);
    this.version(4).stores(SCHEMA_STORES_V4);
  }
}

export const db = new GenshinTrackerDB();
