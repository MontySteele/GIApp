import Dexie from 'dexie';
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { GenshinTrackerDB } from './schema';
import { CHARACTER_KEY_FIX_META_KEY, normalizeStoredCharacterKeys, runPendingDataFixes } from './dataFixes';
import { STORAGE_KEYS } from '@/lib/constants/storageKeys';
import type { Character } from '@/types';

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.map((name) => Dexie.delete(name)));
  created.length = 0;
});

function makeDb(): GenshinTrackerDB {
  const name = `DataFixTest-${crypto.randomUUID()}`;
  created.push(name);
  return new GenshinTrackerDB(name);
}

function character(overrides: Partial<Character> & Pick<Character, 'id' | 'key' | 'level'>): Character {
  return {
    ascension: 6,
    constellation: 0,
    talent: { auto: 1, skill: 1, burst: 1 },
    weapon: { key: 'DullBlade', level: 1, ascension: 0, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'unbuilt',
    teamIds: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  } as Character;
}

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(key: string) { return this.map.get(key) ?? null; }
  key(index: number) { return [...this.map.keys()][index] ?? null; }
  removeItem(key: string) { this.map.delete(key); }
  setItem(key: string, value: string) { this.map.set(key, value); }
}

describe('normalizeStoredCharacterKeys', () => {
  it('merges the same character stored under three spellings into one canonical row', async () => {
    const db = makeDb();
    await db.open();
    await db.characters.bulkAdd([
      character({ id: 'a', key: 'Ayaka', level: 80, teamIds: ['t1'] }),
      character({ id: 'b', key: 'Kamisato Ayaka', level: 90, teamIds: ['t2'] }),
      character({ id: 'c', key: 'KamisatoAyaka', level: 20 }),
      character({ id: 'd', key: 'Furina', level: 90 }),
    ]);
    await db.teams.add({
      id: 't1',
      name: 'Freeze',
      characterKeys: ['Ayaka', 'Kamisato Ayaka', 'Furina'],
      memberBuildTemplates: { Ayaka: 'tpl-1' },
      rotationNotes: '',
      tags: [],
      createdAt: '',
      updatedAt: '',
    });

    const result = await normalizeStoredCharacterKeys(db, undefined);

    const rows = await db.characters.toArray();
    expect(rows.map((r) => r.key).sort()).toEqual(['Furina', 'KamisatoAyaka']);
    const ayaka = rows.find((r) => r.key === 'KamisatoAyaka')!;
    expect(ayaka.level).toBe(90); // highest level survives
    expect(ayaka.teamIds.sort()).toEqual(['t1', 't2']); // team memberships unioned
    expect(result.charactersMerged).toBe(2);

    const team = await db.teams.get('t1');
    expect(team?.characterKeys).toEqual(['KamisatoAyaka', 'Furina']);
    expect(team?.memberBuildTemplates).toEqual({ KamisatoAyaka: 'tpl-1' });
    expect(await db.appMeta.get(CHARACTER_KEY_FIX_META_KEY)).toBeDefined();
    db.close();
  });

  it('normalises planned banners, build templates, campaign targets and the persisted wishlist', async () => {
    const db = makeDb();
    await db.open();
    await db.plannedBanners.add({
      id: 'pb1', characterKey: 'Hu Tao', expectedStartDate: '', expectedEndDate: '', priority: 1,
      maxPullBudget: null, isConfirmed: false, notes: '', createdAt: '', updatedAt: '',
    } as never);
    await db.buildTemplates.add({ id: 'bt1', characterKey: 'Raiden Shogun' } as never);
    await db.campaigns.add({
      id: 'c1', type: 'character-acquisition', status: 'active', name: 'x',
      pullTargets: [{ id: 'p1', itemKey: 'Kazuha', itemType: 'character', bannerType: 'character', desiredCopies: 1, maxPullBudget: null, isConfirmed: false }],
      characterTargets: [{ id: 'ct1', characterKey: 'Kokomi', ownership: 'owned', buildGoal: 'comfortable' }],
      createdAt: '', updatedAt: '',
    } as never);
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEYS.WISHLIST,
      JSON.stringify({ state: { characters: [{ key: 'Ayaka', addedAt: 1 }, { key: 'KamisatoAyaka', addedAt: 2 }, { key: 'Furina', addedAt: 3 }] }, version: 0 })
    );

    const result = await normalizeStoredCharacterKeys(db, storage);

    expect((await db.plannedBanners.get('pb1'))?.characterKey).toBe('HuTao');
    expect((await db.buildTemplates.get('bt1'))?.characterKey).toBe('RaidenShogun');
    const campaign = await db.campaigns.get('c1');
    expect(campaign?.pullTargets[0]?.itemKey).toBe('KaedeharaKazuha');
    expect(campaign?.characterTargets[0]?.characterKey).toBe('SangonomiyaKokomi');
    const wishlist = JSON.parse(storage.getItem(STORAGE_KEYS.WISHLIST)!);
    expect(wishlist.state.characters.map((c: { key: string }) => c.key)).toEqual(['KamisatoAyaka', 'Furina']);
    expect(result).toMatchObject({ plannedBannersUpdated: 1, buildTemplatesUpdated: 1, campaignsUpdated: 1, wishlistUpdated: true });
    db.close();
  });

  it('is idempotent and runPendingDataFixes only runs once', async () => {
    const db = makeDb();
    await db.open();
    await db.characters.add(character({ id: 'a', key: 'Hu Tao', level: 90 }));

    await runPendingDataFixes(db);
    expect((await db.characters.get('a'))?.key).toBe('HuTao');

    await db.characters.add(character({ id: 'b', key: 'Ayaka', level: 1 }));
    await runPendingDataFixes(db); // flag set: does not run again
    expect((await db.characters.get('b'))?.key).toBe('Ayaka');

    const second = await normalizeStoredCharacterKeys(db, undefined);
    expect(second.charactersRenamed).toBe(1);
    const third = await normalizeStoredCharacterKeys(db, undefined);
    expect(third).toMatchObject({ charactersRenamed: 0, charactersMerged: 0, teamsUpdated: 0 });
    db.close();
  });
});
