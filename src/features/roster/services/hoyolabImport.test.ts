import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/db/schema';
import type { Character } from '@/types';
import { importHoyolabCharacters } from './hoyolabImport';

const now = '2026-05-11T00:00:00.000Z';

const imported = (
  overrides: Partial<Omit<Character, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Omit<Character, 'id' | 'createdAt' | 'updatedAt'> => ({
  key: 'Furina',
  level: 90,
  ascension: 6,
  constellation: 2,
  talent: { auto: 6, skill: 10, burst: 10 },
  weapon: { key: 'SplendorOfTranquilWaters', level: 90, ascension: 6, refinement: 1 },
  artifacts: [
    {
      setKey: 'GoldenTroupe',
      slotKey: 'flower',
      level: 20,
      rarity: 5,
      mainStatKey: 'hp',
      substats: [{ key: 'critRate_', value: 3.9 }],
    },
  ],
  notes: '',
  priority: 'unbuilt',
  teamIds: [],
  avatarId: 10000089,
  ...overrides,
});

const stored = (overrides: Partial<Character> = {}): Character => ({
  id: 'existing-id',
  key: 'Furina',
  level: 80,
  ascension: 5,
  constellation: 1,
  talent: { auto: 6, skill: 8, burst: 8 },
  weapon: { key: 'FleuveCendreFerryman', level: 80, ascension: 5, refinement: 5 },
  artifacts: [],
  notes: 'my hyperbloom pivot',
  priority: 'main',
  teamIds: ['team-1'],
  avatarId: 10000089,
  createdAt: now,
  updatedAt: now,
  ...overrides,
});

describe('importHoyolabCharacters', () => {
  beforeEach(async () => {
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it('creates new characters and records the import', async () => {
    const result = await importHoyolabCharacters([imported()]);

    expect(result).toEqual({ created: 1, updated: 0 });

    const chars = await db.characters.toArray();
    expect(chars).toHaveLength(1);
    expect(chars[0].key).toBe('Furina');
    expect(chars[0].level).toBe(90);

    const records = await db.importRecords.toArray();
    expect(records).toHaveLength(1);
    expect(records[0].source).toBe('HoYoLAB');
    expect(records[0].characterCount).toBe(1);
    expect(records[0].artifactCount).toBe(1);
  });

  it('updates existing characters while preserving notes, priority, and teams', async () => {
    await db.characters.add(stored());

    const result = await importHoyolabCharacters([imported()]);

    expect(result).toEqual({ created: 0, updated: 1 });

    const chars = await db.characters.toArray();
    expect(chars).toHaveLength(1);
    expect(chars[0].level).toBe(90);
    expect(chars[0].constellation).toBe(2);
    expect(chars[0].weapon.key).toBe('SplendorOfTranquilWaters');
    // User metadata preserved
    expect(chars[0].notes).toBe('my hyperbloom pivot');
    expect(chars[0].priority).toBe('main');
    expect(chars[0].teamIds).toEqual(['team-1']);
  });

  it('keeps a higher local ascension when the level is unchanged', async () => {
    await db.characters.add(stored({ level: 80, ascension: 6 }));

    await importHoyolabCharacters([imported({ level: 80, ascension: 5 })]);

    expect((await db.characters.get('existing-id'))?.ascension).toBe(6);
  });

  it('takes the imported ascension when the level changed', async () => {
    await db.characters.add(stored({ level: 70, ascension: 5 }));

    await importHoyolabCharacters([imported({ level: 80, ascension: 5 })]);

    const updated = await db.characters.get('existing-id');
    expect(updated?.level).toBe(80);
    expect(updated?.ascension).toBe(5);
  });

  it('matches spaced legacy keys from Enka imports without duplicating', async () => {
    await db.characters.add(
      stored({ id: 'enka-id', key: 'Kamisato Ayaka', avatarId: 10000002 })
    );

    const result = await importHoyolabCharacters([
      imported({ key: 'KamisatoAyaka', avatarId: 10000002 }),
    ]);

    expect(result).toEqual({ created: 0, updated: 1 });
    const chars = await db.characters.toArray();
    expect(chars).toHaveLength(1);
    expect(chars[0].level).toBe(90);
  });
});
