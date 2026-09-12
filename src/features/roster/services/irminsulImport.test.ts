import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/schema';
import type { InventoryWeapon } from '@/types';
import { importIrminsul } from './irminsulImport';
import type { IrminsulFormat, IrminsulWeapon } from '@/mappers/irminsul';

const now = '2026-05-11T00:00:00.000Z';

const weapon = (overrides: Partial<IrminsulWeapon> = {}): IrminsulWeapon => ({
  key: 'PrimordialJadeWingedSpear',
  level: 1,
  ascension: 0,
  refinement: 1,
  location: '',
  lock: true,
  ...overrides,
});

const storedWeapon = (overrides: Partial<InventoryWeapon> = {}): InventoryWeapon => ({
  id: 'stale-index-based-id',
  key: 'PrimordialJadeWingedSpear',
  level: 1,
  ascension: 0,
  refinement: 1,
  location: '',
  lock: true,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

const exportWithWeapons = (weapons: IrminsulWeapon[]): IrminsulFormat => ({
  format: 'GOOD',
  version: 3,
  source: 'Irminsul',
  characters: [],
  artifacts: [],
  weapons,
  materials: {},
});

describe('importIrminsul weapon inventory', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it('reconciles repeated weapon snapshots instead of appending duplicates', async () => {
    await db.inventoryWeapons.bulkPut([
      storedWeapon({ id: 'weapon:PrimordialJadeWingedSpear:1:1:unequipped:0' }),
      storedWeapon({ id: 'weapon:PrimordialJadeWingedSpear:1:1:unequipped:1' }),
    ]);

    const jadeSpear = weapon();
    const duplicateJadeSpear = weapon();
    const gravestone = weapon({
      key: "Wolf's Gravestone",
      level: 20,
      ascension: 1,
    });

    const firstResult = await importIrminsul(
      exportWithWeapons([jadeSpear, duplicateJadeSpear, gravestone]),
      {
        importCharacters: false,
        importArtifacts: false,
        importWeapons: true,
        importMaterials: false,
      }
    );
    const secondResult = await importIrminsul(
      exportWithWeapons([gravestone, jadeSpear, duplicateJadeSpear]),
      {
        importCharacters: false,
        importArtifacts: false,
        importWeapons: true,
        importMaterials: false,
      }
    );

    expect(firstResult.success).toBe(true);
    expect(secondResult.success).toBe(true);
    expect(firstResult.weaponsImported).toBe(3);
    expect(secondResult.weaponsImported).toBe(3);

    const stored = await db.inventoryWeapons.toArray();
    expect(stored).toHaveLength(3);
    expect(stored.map((item) => item.id).sort()).toEqual([
      "weapon:PrimordialJadeWingedSpear:1:0:1:unequipped:locked",
      "weapon:PrimordialJadeWingedSpear:1:0:1:unequipped:locked:1",
      "weapon:Wolf's Gravestone:20:1:1:unequipped:locked",
    ]);
  });

  it('does not wipe the weapon inventory when a file carries an empty weapons array', async () => {
    // A character-only GOOD export (e.g. from a roster tool) commonly includes
    // `weapons: []`. That is not a weapon scan and must not reconcile the
    // existing inventory away, matching the `length > 0` guard on artifacts.
    await db.inventoryWeapons.bulkPut([
      storedWeapon({ id: 'weapon:PrimordialJadeWingedSpear:1:0:1:unequipped:locked' }),
      storedWeapon({
        id: "weapon:Wolf's Gravestone:20:1:1:unequipped:locked",
        key: "Wolf's Gravestone",
        level: 20,
        ascension: 1,
      }),
    ]);

    const result = await importIrminsul(
      {
        ...exportWithWeapons([]),
        characters: [
          {
            key: 'Furina',
            level: 90,
            constellation: 0,
            ascension: 6,
            talent: { auto: 10, skill: 10, burst: 10 },
          },
        ],
      },
      { importWeapons: true }
    );

    expect(result.success).toBe(true);
    expect(result.weaponsImported).toBe(0);
    expect(result.charactersImported).toBe(1);

    const stored = await db.inventoryWeapons.toArray();
    expect(stored.map((item) => item.id).sort()).toEqual([
      'weapon:PrimordialJadeWingedSpear:1:0:1:unequipped:locked',
      "weapon:Wolf's Gravestone:20:1:1:unequipped:locked",
    ]);
  });
});
