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
} from '@/types';

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

  constructor() {
    super('GenshinTracker');

    this.version(1).stores({
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
    });
  }
}

export const db = new GenshinTrackerDB();
