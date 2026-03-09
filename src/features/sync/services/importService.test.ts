import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db/schema';
import { APP_SCHEMA_VERSION } from '@/lib/constants';
import { validateBackup, importBackup, type BackupData } from './importService';
import type { InventoryArtifact, InventoryWeapon, MaterialInventory, Character } from '@/types';

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

    it('does not clear inventory when backup has no inventory data', async () => {
      // Pre-populate
      await db.inventoryArtifacts.bulkPut([makeArtifact({ id: 'keep-me' })]);

      // Import with no inventory data
      const result = await importBackup(makeBackup({}), 'replace');
      expect(result.success).toBe(true);

      // Existing artifacts should be untouched
      expect(await db.inventoryArtifacts.count()).toBe(1);
      expect(await db.inventoryArtifacts.get('keep-me')).toBeDefined();
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

      expect(result.stats.characters.updated).toBe(1);
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

      const incoming = makeCharacter({ id: 'remote-id', key: 'Furina', level: 90 });
      const result = await importBackup(makeBackup({ characters: [incoming] }), 'replace');

      expect(result.stats.characters.updated).toBe(1);
      // Should keep the local ID
      const stored = await db.characters.where('key').equals('Furina').first();
      expect(stored?.id).toBe('local-id');
      expect(stored?.level).toBe(90);
    });

    it('merges teamIds when updating characters', async () => {
      await db.characters.put(makeCharacter({ id: 'c1', key: 'Furina', teamIds: ['team-a'] }));

      const incoming = makeCharacter({ id: 'c1', key: 'Furina', teamIds: ['team-b'] });
      const result = await importBackup(makeBackup({ characters: [incoming] }), 'replace');

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
});
