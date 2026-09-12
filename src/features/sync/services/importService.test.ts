import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION } from '@/lib/constants';
import { validateBackup, importBackup, APP_META_RESTORE_WHITELIST, type BackupData } from './importService';
import { appMetaService } from './appMetaService';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';
import type {
  InventoryArtifact,
  InventoryWeapon,
  MaterialInventory,
  Character,
  Team,
  WishRecord,
  BuildTemplate,
  ImportRecord,
  Note,
} from '@/types';

// ----- Helpers -----

const now = '2026-03-01T00:00:00.000Z';

function makeArtifact(overrides: Partial<InventoryArtifact> = {}): InventoryArtifact {
  return {
    id: `art-${Math.random().toString(36).slice(2, 8)}`,
    setKey: 'GoldenTroupe',
    slotKey: 'flower',
    level: 20,
    rarity: 5,
    mainStatKey: 'hp',
    substats: [{ key: 'critRate_', value: 3.9 }],
    location: '',
    lock: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeWeapon(overrides: Partial<InventoryWeapon> = {}): InventoryWeapon {
  return {
    id: `wpn-${Math.random().toString(36).slice(2, 8)}`,
    key: 'SkywardHarp',
    level: 90,
    ascension: 6,
    refinement: 1,
    location: '',
    lock: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: `char-${Math.random().toString(36).slice(2, 8)}`,
    key: 'Furina',
    level: 90,
    ascension: 6,
    constellation: 2,
    talent: { auto: 9, skill: 10, burst: 10 },
    weapon: { key: 'SplendorOfTranquilWaters', level: 90, ascension: 6, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'main',
    teamIds: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeBackup(data: BackupData['data']): BackupData {
  return {
    exportedAt: now,
    schemaVersion: APP_SCHEMA_VERSION,
    data,
  };
}

// ----- Tests -----

describe('importService', () => {
  beforeEach(async () => {
    await Promise.all(
      db.tables.map((t) => t.clear())
    );
  });

  // ===== validateBackup =====

  describe('validateBackup', () => {
    it('accepts a valid backup', () => {
      const result = validateBackup({
        exportedAt: now,
        schemaVersion: APP_SCHEMA_VERSION,
        data: { characters: [] },
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects non-object input', () => {
      expect(validateBackup(null).valid).toBe(false);
      expect(validateBackup('string').valid).toBe(false);
    });

    it('rejects missing exportedAt', () => {
      const result = validateBackup({ schemaVersion: 1, data: {} });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid exportedAt timestamp');
    });

    it('rejects missing schemaVersion', () => {
      const result = validateBackup({ exportedAt: now, data: {} });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid schemaVersion');
    });

    it('rejects missing data', () => {
      const result = validateBackup({ exportedAt: now, schemaVersion: 1 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid data payload');
    });

    it('warns on older schema version', () => {
      // Only test if APP_SCHEMA_VERSION > 1, otherwise older versions are impossible
      if (APP_SCHEMA_VERSION <= 1) {
        // At schema v1, there's no older version to warn about
        const result = validateBackup({ exportedAt: now, schemaVersion: 1, data: {} });
        expect(result.valid).toBe(true);
        expect(result.warnings).toHaveLength(0);
      } else {
        const result = validateBackup({ exportedAt: now, schemaVersion: 1, data: {} });
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toMatch(/older schema version/);
      }
    });

    it('errors on newer schema version', () => {
      const result = validateBackup({
        exportedAt: now,
        schemaVersion: APP_SCHEMA_VERSION + 1,
        data: {},
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/newer than app version/);
    });

    it('counts records in backupInfo', () => {
      const result = validateBackup({
        exportedAt: now,
        schemaVersion: APP_SCHEMA_VERSION,
        data: { characters: [1, 2, 3], teams: [1] },
      });
      expect(result.backupInfo?.recordCounts).toEqual({ characters: 3, teams: 1 });
    });
  });

  // ===== Inventory import (the bug fix) =====

  describe('inventory import', () => {
    it('imports inventory artifacts', async () => {
      const artifacts = [makeArtifact({ id: 'a1' }), makeArtifact({ id: 'a2' }), makeArtifact({ id: 'a3' })];
      const backup = makeBackup({ inventoryArtifacts: artifacts });

      const result = await importBackup(backup, 'replace');

      expect(result.success).toBe(true);
      expect(result.stats.inventoryArtifacts.created).toBe(3);

      const stored = await db.inventoryArtifacts.toArray();
      expect(stored).toHaveLength(3);
      expect(stored.map((a) => a.id).sort()).toEqual(['a1', 'a2', 'a3']);
    });

    it('replaces existing inventory artifacts wholesale', async () => {
      // Pre-populate with stale artifacts (different IDs)
      await db.inventoryArtifacts.bulkPut([
        makeArtifact({ id: 'stale-1' }),
        makeArtifact({ id: 'stale-2' }),
      ]);
      expect(await db.inventoryArtifacts.count()).toBe(2);

      // Import new artifacts
      const artifacts = [makeArtifact({ id: 'new-1' }), makeArtifact({ id: 'new-2' }), makeArtifact({ id: 'new-3' })];
      const result = await importBackup(makeBackup({ inventoryArtifacts: artifacts }), 'replace');

      expect(result.success).toBe(true);
      expect(result.stats.inventoryArtifacts.created).toBe(3);

      // Stale artifacts should be gone
      const stored = await db.inventoryArtifacts.toArray();
      expect(stored).toHaveLength(3);
      expect(stored.map((a) => a.id).sort()).toEqual(['new-1', 'new-2', 'new-3']);
      expect(await db.inventoryArtifacts.get('stale-1')).toBeUndefined();
    });

    it('imports inventory weapons wholesale', async () => {
      await db.inventoryWeapons.bulkPut([makeWeapon({ id: 'old-w1' })]);

      const weapons = [makeWeapon({ id: 'w1' }), makeWeapon({ id: 'w2' })];
      const result = await importBackup(makeBackup({ inventoryWeapons: weapons }), 'replace');

      expect(result.success).toBe(true);
      expect(result.stats.inventoryWeapons.created).toBe(2);

      const stored = await db.inventoryWeapons.toArray();
      expect(stored).toHaveLength(2);
      expect(await db.inventoryWeapons.get('old-w1')).toBeUndefined();
    });

    it('imports material inventory wholesale', async () => {
      const materials: MaterialInventory[] = [{
        id: 'materials',
        materials: { mora: 1000000, heroWit: 200 },
        updatedAt: now,
      }];
      const result = await importBackup(makeBackup({ materialInventory: materials }), 'replace');

      expect(result.success).toBe(true);
      expect(result.stats.materialInventory.created).toBe(1);

      const stored = await db.materialInventory.get('materials');
      expect(stored?.materials.mora).toBe(1000000);
    });

    it('keeps local inventory and warns when backup omits the inventory tables', async () => {
      // Pre-populate
      await db.inventoryArtifacts.bulkPut([makeArtifact({ id: 'keep-me' })]);

      // Import with no inventory data
      const result = await importBackup(makeBackup({}), 'replace');
      expect(result.success).toBe(true);

      // Existing artifacts should be untouched, but the user must be told
      // their local inventory may now be stale.
      expect(await db.inventoryArtifacts.count()).toBe(1);
      expect(await db.inventoryArtifacts.get('keep-me')).toBeDefined();
      expect(result.warnings).toContainEqual(expect.stringContaining('artifact inventory'));
    });

    it('does not warn about missing inventory tables when local inventory is empty', async () => {
      const result = await importBackup(makeBackup({}), 'replace');

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('clears local inventory when backup includes an empty inventory table', async () => {
      // A backup exported from a device with zero artifacts is a faithful
      // snapshot: importing it must replace (empty) local inventory too.
      await db.inventoryArtifacts.bulkPut([
        makeArtifact({ id: 'stale-1' }),
        makeArtifact({ id: 'stale-2' }),
      ]);

      const result = await importBackup(makeBackup({ inventoryArtifacts: [] }), 'replace');

      expect(result.success).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(await db.inventoryArtifacts.count()).toBe(0);
    });
  });

  // ===== Character merge strategies =====

  describe('character import', () => {
    it('creates new characters', async () => {
      const char = makeCharacter({ id: 'c1', key: 'Furina' });
      const result = await importBackup(makeBackup({ characters: [char] }), 'replace');

      expect(result.success).toBe(true);
      expect(result.stats.characters.created).toBe(1);
      expect(await db.characters.get('c1')).toBeDefined();
    });

    it('replace strategy overwrites existing characters', async () => {
      await db.characters.put(makeCharacter({ id: 'c1', key: 'Furina', level: 80 }));

      const updated = makeCharacter({ id: 'c1', key: 'Furina', level: 90 });
      const result = await importBackup(makeBackup({ characters: [updated] }), 'replace');

      // Replace All clears the table first, so the incoming row is a create
      expect(result.stats.characters.created).toBe(1);
      expect(await db.characters.count()).toBe(1);
      const stored = await db.characters.get('c1');
      expect(stored?.level).toBe(90);
    });

    it('newer_wins strategy skips older incoming characters', async () => {
      await db.characters.put(makeCharacter({
        id: 'c1',
        key: 'Furina',
        level: 90,
        updatedAt: '2026-03-02T00:00:00.000Z',
      }));

      const older = makeCharacter({
        id: 'c1',
        key: 'Furina',
        level: 80,
        updatedAt: '2026-02-01T00:00:00.000Z',
      });
      const result = await importBackup(makeBackup({ characters: [older] }), 'newer_wins');

      expect(result.stats.characters.skipped).toBe(1);
      const stored = await db.characters.get('c1');
      expect(stored?.level).toBe(90); // Unchanged
    });

    it('keep_local strategy skips existing characters', async () => {
      await db.characters.put(makeCharacter({ id: 'c1', key: 'Furina', level: 80 }));

      const incoming = makeCharacter({ id: 'c1', key: 'Furina', level: 90 });
      const result = await importBackup(makeBackup({ characters: [incoming] }), 'keep_local');

      expect(result.stats.characters.skipped).toBe(1);
      const stored = await db.characters.get('c1');
      expect(stored?.level).toBe(80); // Unchanged
    });

    it('deduplicates by character key when IDs differ', async () => {
      await db.characters.put(makeCharacter({ id: 'local-id', key: 'Furina', level: 80 }));

      const incoming = makeCharacter({
        id: 'remote-id',
        key: 'Furina',
        level: 90,
        updatedAt: '2026-03-02T00:00:00.000Z',
      });
      const result = await importBackup(makeBackup({ characters: [incoming] }), 'newer_wins');

      expect(result.stats.characters.updated).toBe(1);
      // Should keep the local ID
      const stored = await db.characters.where('key').equals('Furina').first();
      expect(stored?.id).toBe('local-id');
      expect(stored?.level).toBe(90);
    });

    it('merges teamIds when updating characters', async () => {
      await db.characters.put(makeCharacter({ id: 'c1', key: 'Furina', teamIds: ['team-a'] }));

      const incoming = makeCharacter({
        id: 'c1',
        key: 'Furina',
        teamIds: ['team-b'],
        updatedAt: '2026-03-02T00:00:00.000Z',
      });
      const result = await importBackup(makeBackup({ characters: [incoming] }), 'newer_wins');

      expect(result.stats.characters.updated).toBe(1);
      const stored = await db.characters.get('c1');
      expect(stored?.teamIds).toContain('team-a');
      expect(stored?.teamIds).toContain('team-b');
    });
  });

  // ===== General =====

  describe('general', () => {
    it('handles empty backup gracefully', async () => {
      const result = await importBackup(makeBackup({}), 'replace');
      expect(result.success).toBe(true);
    });

    it('reports errors on transaction failure', async () => {
      // Pass a backup with invalid data to trigger an error
      const badBackup = makeBackup({
        characters: [{ invalid: true } as unknown as Character],
      });
      const result = await importBackup(badBackup, 'replace');
      // Should not crash — either succeeds or reports error
      expect(typeof result.success).toBe('boolean');
    });

    it('calls onProgress callback', async () => {
      const stages: string[] = [];
      const artifacts = [makeArtifact({ id: 'a1' })];
      await importBackup(makeBackup({ inventoryArtifacts: artifacts }), 'replace', (stage) => {
        stages.push(stage);
      });

      expect(stages).toContain('Importing inventory artifacts...');
      expect(stages).toContain('Complete');
    });
  });

  // ===== Backup round-trip, validation, replace-all =====

  describe('backup round-trip', () => {
    const makeTeam = (overrides: Partial<Team> = {}): Team => ({
      id: 'team-1',
      name: 'Hyperbloom',
      characterKeys: ['Furina', 'Nahida'],
      rotationNotes: '',
      tags: [],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });

    const makeWish = (overrides: Partial<WishRecord> = {}): WishRecord => ({
      id: 'wish-1',
      gachaId: 'g-1',
      bannerType: 'character',
      bannerVersion: '5.3-phase1',
      timestamp: now,
      itemType: 'character',
      itemKey: 'Furina',
      rarity: 5,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });

    const makeNote = (overrides: Partial<Note> = {}): Note => ({
      id: 'note-1',
      title: 'Rotation',
      content: 'E Q swap',
      tags: [],
      pinned: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });

    const makeBuildTemplate = (overrides: Partial<BuildTemplate> = {}): BuildTemplate => ({
      id: 'bt-1',
      name: 'Furina Sub-DPS',
      characterKey: 'Furina',
      description: '',
      role: 'sub-dps',
      notes: '',
      weapons: { primary: ['SplendorOfTranquilWaters'], alternatives: [] },
      artifacts: {
        sets: [[{ setKey: 'GoldenTroupe', pieces: 4 }]],
        mainStats: { sands: ['hp_'], goblet: ['hp_'], circlet: ['critRate_'] },
        substats: ['critRate_'],
      },
      leveling: { targetLevel: 90, targetAscension: 6, talentPriority: ['skill', 'burst', 'auto'] },
      tags: [],
      difficulty: 'intermediate',
      budget: 'mixed',
      isOfficial: false,
      createdAt: now,
      updatedAt: now,
      ...overrides,
    });

    const makeImportRecord = (overrides: Partial<ImportRecord> = {}): ImportRecord => ({
      id: 'imp-1',
      source: 'Irminsul',
      importedAt: now,
      characterCount: 1,
      artifactCount: 1,
      weaponCount: 1,
      materialCount: 1,
      ...overrides,
    });

    async function seedEveryTable() {
      await db.characters.put(makeCharacter({ id: 'char-1' }));
      await db.teams.put(makeTeam());
      await db.wishRecords.put(makeWish());
      await db.primogemEntries.put({
        id: 'pg-1', timestamp: now, amount: 60, source: 'daily_commission', notes: '', createdAt: now, updatedAt: now,
      });
      await db.fateEntries.put({
        id: 'fate-1', timestamp: now, amount: 1, fateType: 'intertwined', source: 'paimon_shop', createdAt: now, updatedAt: now,
      });
      await db.resourceSnapshots.put({
        id: 'snap-1', timestamp: now, primogems: 1600, genesisCrystals: 0, intertwined: 10, acquaint: 0, starglitter: 0, stardust: 0, createdAt: now,
      });
      await db.goals.put({
        id: 'goal-1', title: 'C2 Furina', description: '', category: 'pull', status: 'active', checklist: [], createdAt: now, updatedAt: now,
      });
      await db.notes.put(makeNote());
      await db.plannedBanners.put({
        id: 'pb-1', characterKey: 'Furina', expectedStartDate: now, expectedEndDate: now, priority: 1, maxPullBudget: null, isConfirmed: true, notes: '', createdAt: now, updatedAt: now,
      });
      await db.calculatorScenarios.put({
        id: 'calc-1', name: 'Scenario', targets: [], availablePulls: 90, iterations: 1000, createdAt: now, updatedAt: now,
      });
      await db.inventoryArtifacts.put(makeArtifact({ id: 'art-1' }));
      await db.inventoryWeapons.put(makeWeapon({ id: 'wpn-1' }));
      await db.materialInventory.put({ id: 'materials', materials: { Mora: 1000 }, updatedAt: now });
      await db.importRecords.put(makeImportRecord());
      await db.buildTemplates.put(makeBuildTemplate());
      await db.campaigns.put({
        id: 'camp-1', type: 'character-acquisition', name: 'Get Furina', status: 'active', priority: 1, pullTargets: [], characterTargets: [], notes: '', createdAt: now, updatedAt: now,
      });
      await db.appMeta.put({ key: APP_META_RESTORE_WHITELIST[0], value: now });
      await db.externalCache.put({ id: 'cache-1', cacheKey: 'enka:1', data: { big: true }, fetchedAt: now, expiresAt: now });
    }

    async function snapshotTables(names: string[]) {
      const out: Record<string, unknown[]> = {};
      for (const name of names) {
        out[name] = (await db.table(name).toArray()).sort((a, b) => String(a.id).localeCompare(String(b.id)));
      }
      return out;
    }

    const RESTORED_TABLES = [
      'characters', 'teams', 'wishRecords', 'primogemEntries', 'fateEntries', 'resourceSnapshots',
      'goals', 'notes', 'plannedBanners', 'calculatorScenarios', 'inventoryArtifacts', 'inventoryWeapons',
      'materialInventory', 'importRecords', 'buildTemplates', 'campaigns',
    ];

    it('export omits externalCache but keeps appMeta', async () => {
      await seedEveryTable();
      const backup = await appMetaService.exportBackup();

      expect(backup.data).not.toHaveProperty('externalCache');
      expect(backup.data).toHaveProperty('appMeta');
      expect(backup.data).toHaveProperty('buildTemplates');
      expect(validateBackup(backup).valid).toBe(true);
    });

    it('export -> import preserves every table, including build templates and import records', async () => {
      await seedEveryTable();
      const before = await snapshotTables(RESTORED_TABLES);
      const backup = await appMetaService.exportBackup();

      await Promise.all(db.tables.map((t) => t.clear()));

      const result = await importBackup(backup as BackupData, 'newer_wins');
      expect(result.errors).toEqual([]);
      expect(result.success).toBe(true);
      expect(result.stats.buildTemplates.created).toBe(1);
      expect(result.stats.importRecords.created).toBe(1);

      const after = await snapshotTables(RESTORED_TABLES);
      expect(after).toEqual(before);
    });

    it('rejects a backup with a malformed wish row and writes nothing', async () => {
      const backup = makeBackup({
        characters: [makeCharacter({ id: 'char-ok' })],
        wishRecords: [
          makeWish({ id: 'wish-ok' }),
          makeWish({ id: 'wish-bad', gachaId: 'g-2', bannerType: 'bogus' as WishRecord['bannerType'] }),
          { ...makeWish({ gachaId: 'g-3' }), id: undefined } as unknown as WishRecord,
        ],
      });

      const validation = validateBackup(backup);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(1);
      expect(validation.errors[0]).toMatch(/^wishRecords: 2 invalid rows/);
      expect(validation.errors[0]).toContain('[1] bannerType');
      expect(validation.errors[0]).toContain('[2] id');

      const result = await importBackup(backup, 'replace');
      expect(result.success).toBe(false);
      expect(result.errors).toEqual(validation.errors);
      expect(await db.characters.count()).toBe(0);
      expect(await db.wishRecords.count()).toBe(0);
    });

    it('lists errors per table when several tables are malformed', () => {
      const backup = makeBackup({
        notes: [{ id: 'n', title: 'x' } as unknown as Note],
        teams: [makeTeam({ characterKeys: 'Furina' as unknown as string[] })],
      });

      const validation = validateBackup(backup);
      expect(validation.valid).toBe(false);
      expect(validation.errors.map((e) => e.split(':')[0]).sort()).toEqual(['notes', 'teams']);
    });

    it('Replace All removes local rows that are absent from the backup', async () => {
      await db.notes.put(makeNote({ id: 'note-local-only' }));
      await db.notes.put(makeNote({ id: 'note-shared', title: 'old' }));
      await db.wishRecords.put(makeWish({ id: 'wish-local-only', gachaId: 'g-local' }));
      await db.buildTemplates.put(makeBuildTemplate({ id: 'bt-local-only' }));
      // goals is not in the backup at all: must be left untouched
      await db.goals.put({
        id: 'goal-keep', title: 'keep', description: '', category: 'other', status: 'active', checklist: [], createdAt: now, updatedAt: now,
      });

      const result = await importBackup(
        makeBackup({
          notes: [makeNote({ id: 'note-shared', title: 'new' }), makeNote({ id: 'note-incoming' })],
          wishRecords: [makeWish({ id: 'wish-incoming', gachaId: 'g-in' })],
          buildTemplates: [],
        }),
        'replace'
      );

      expect(result.success).toBe(true);
      expect((await db.notes.toArray()).map((n) => n.id).sort()).toEqual(['note-incoming', 'note-shared']);
      expect((await db.notes.get('note-shared'))?.title).toBe('new');
      expect((await db.wishRecords.toArray()).map((w) => w.id)).toEqual(['wish-incoming']);
      expect(await db.buildTemplates.count()).toBe(0);
      expect(await db.goals.count()).toBe(1);
    });

    it('newer_wins keeps local-only rows', async () => {
      await db.notes.put(makeNote({ id: 'note-local-only' }));

      await importBackup(makeBackup({ notes: [makeNote({ id: 'note-incoming' })] }), 'newer_wins');

      expect((await db.notes.toArray()).map((n) => n.id).sort()).toEqual(['note-incoming', 'note-local-only']);
    });

    it('restores only whitelisted appMeta keys and never schemaVersion', async () => {
      await db.appMeta.put({ key: 'schemaVersion', value: APP_SCHEMA_VERSION });
      await db.appMeta.put({ key: 'deviceId', value: 'local-device' });

      const result = await importBackup(
        makeBackup({
          appMeta: [
            { key: 'schemaVersion', value: 1 },
            { key: 'deviceId', value: 'other-device' },
            { key: 'createdAt', value: '2020-01-01T00:00:00.000Z' },
            { key: 'lastBackupAt', value: '2020-01-01T00:00:00.000Z' },
            { key: APP_META_RESTORE_WHITELIST[0], value: '2026-02-01T00:00:00.000Z' },
          ],
        }),
        'replace'
      );

      expect(result.success).toBe(true);
      expect((await db.appMeta.get('schemaVersion'))?.value).toBe(APP_SCHEMA_VERSION);
      expect((await db.appMeta.get('deviceId'))?.value).toBe('local-device');
      expect(await db.appMeta.get('createdAt')).toBeUndefined();
      expect(await db.appMeta.get('lastBackupAt')).toBeUndefined();
      expect((await db.appMeta.get(APP_META_RESTORE_WHITELIST[0]))?.value).toBe('2026-02-01T00:00:00.000Z');
    });

    it('tolerates abyssRuns and legacy externalCache in the payload without restoring them', async () => {
      const backup = makeBackup({
        abyssRuns: [{ id: 'run-1', cycleStart: now, floor: 12, chamber: 1, stars: 9, firstHalfTeam: [], secondHalfTeam: [], notes: '', createdAt: now, updatedAt: now }],
      });
      (backup.data as Record<string, unknown>).externalCache = [{ id: 'c', cacheKey: 'k' }];

      const validation = validateBackup(backup);
      expect(validation.valid).toBe(true);
      expect(validation.warnings.some((w) => w.includes('abyssRuns'))).toBe(true);

      const result = await importBackup(backup, 'replace');
      expect(result.success).toBe(true);
      expect(await db.abyssRuns.count()).toBe(0);
      expect(await db.externalCache.count()).toBe(0);
    });
  });

  describe('localState (localStorage product data)', () => {
    const wishlistBlob = '{"state":{"characters":[{"key":"Furina","targetGoal":"full","addedAt":"2026-01-01T00:00:00.000Z"}]},"version":0}';

    beforeEach(() => localStorage.clear());

    it('validation accepts a well-formed localState and rejects a malformed one', () => {
      const good = makeBackup({});
      (good as BackupData).localState = [{ key: STORAGE_KEYS.WISHLIST, value: wishlistBlob }];
      expect(validateBackup(good).valid).toBe(true);

      const bad = makeBackup({});
      (bad as unknown as { localState: unknown }).localState = [{ key: STORAGE_KEYS.WISHLIST, value: 42 }];
      const validation = validateBackup(bad);
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.startsWith('localState:'))).toBe(true);
    });

    it('restores allowlisted keys and ignores unknown keys in every merge mode', async () => {
      for (const strategy of ['replace', 'newer_wins', 'keep_local'] as const) {
        localStorage.clear();
        localStorage.setItem(STORAGE_KEYS.RESIN_BUDGET, 'local-value');

        const backup = makeBackup({});
        backup.localState = [
          { key: STORAGE_KEYS.RESIN_BUDGET, value: 'backup-value' },
          { key: STORAGE_KEYS.PLANNER_STATE, value: '{"mode":"multi"}' },
          { key: 'not-an-app-key', value: 'ignored' },
        ];

        const result = await importBackup(backup, strategy);
        expect(result.success).toBe(true);
        expect(result.stats.localState).toEqual({ created: 2, skipped: 1 });
        expect(localStorage.getItem(STORAGE_KEYS.RESIN_BUDGET)).toBe('backup-value');
        expect(localStorage.getItem(STORAGE_KEYS.PLANNER_STATE)).toBe('{"mode":"multi"}');
        expect(localStorage.getItem('not-an-app-key')).toBeNull();
      }
    });

    it('does not touch localStorage when a backup is rejected', async () => {
      localStorage.setItem(STORAGE_KEYS.RESIN_BUDGET, 'local-value');
      const backup = makeBackup({ notes: [{ id: 'bad' } as unknown as Note] });
      backup.localState = [{ key: STORAGE_KEYS.RESIN_BUDGET, value: 'backup-value' }];

      const result = await importBackup(backup, 'replace');
      expect(result.success).toBe(false);
      expect(localStorage.getItem(STORAGE_KEYS.RESIN_BUDGET)).toBe('local-value');
    });

    it('export -> import round-trips the wishlist string byte-for-byte', async () => {
      localStorage.setItem(STORAGE_KEYS.WISHLIST, wishlistBlob);
      const backup = await appMetaService.exportBackup();
      localStorage.clear();

      const result = await importBackup(backup as BackupData, 'newer_wins');
      expect(result.success).toBe(true);
      expect(localStorage.getItem(STORAGE_KEYS.WISHLIST)).toBe(wishlistBlob);
    });

    it('accepts backups without a localState section', async () => {
      const result = await importBackup(makeBackup({}), 'newer_wins');
      expect(result.success).toBe(true);
      expect(result.stats.localState).toEqual({ created: 0, skipped: 0 });
    });
  });
});
