import { describe, it, expect } from 'vitest';
import fixture from './__fixtures__/rolecombat-sample.json';
import { THEATER_SEASONS } from './theaterSeasons';
import { getKeyForAvatarId, inferSeasonMonth, parseRoleCombat } from './parseRoleCombat';

const FIXTURE_JSON = JSON.stringify(fixture);

describe('inferSeasonMonth', () => {
  it('should anchor season 28 to 2026-08', () => {
    expect(inferSeasonMonth(28)).toBe('2026-08');
  });

  it('should advance one month per season id', () => {
    expect(inferSeasonMonth(29)).toBe('2026-09');
    expect(inferSeasonMonth(30)).toBe('2026-10');
    expect(inferSeasonMonth(31)).toBe('2026-11');
  });

  it('should roll over the year boundary', () => {
    expect(inferSeasonMonth(32)).toBe('2026-12');
    expect(inferSeasonMonth(33)).toBe('2027-01');
  });
});

describe('getKeyForAvatarId', () => {
  it('should prefer the ALL_CHARACTERS spelling over map aliases', () => {
    expect(getKeyForAvatarId(10000047)).toBe('KaedeharaKazuha');
    expect(getKeyForAvatarId(10000105)).toBe('Ororon');
  });

  it('should return undefined for an unmapped id', () => {
    expect(getKeyForAvatarId(10000150)).toBeUndefined();
  });
});

describe('parseRoleCombat', () => {
  it('should parse season 28 into exactly the hand-seeded August 2026 season', () => {
    const { seasons } = parseRoleCombat(FIXTURE_JSON);
    const august = seasons.find((season) => season.id === '2026-08');
    const seeded = THEATER_SEASONS[0];

    expect(august).toBeDefined();
    expect(august?.elements).toEqual(seeded?.elements);
    expect(august?.openingCharacters).toEqual(seeded?.openingCharacters);
    expect(august?.specialGuests).toEqual(seeded?.specialGuests);
    expect(august?.source).toBe('official');
    expect(august?.startDate).toBe('2026-08-01');
  });

  it('should mark season 29 official from its live_begin date', () => {
    const { seasons } = parseRoleCombat(FIXTURE_JSON);
    const september = seasons.find((season) => season.id === '2026-09');

    expect(september).toMatchObject({
      id: '2026-09',
      startDate: '2026-09-01',
      source: 'official',
      elements: ['Hydro', 'Electro', 'Dendro'],
      openingCharacters: ['Columbina', 'Xingqiu', 'Cyno', 'KukiShinobu', 'Lauma', 'Kaveh'],
    });
  });

  it('should infer season 30 as beta 2026-10 when live dates are absent', () => {
    const { seasons } = parseRoleCombat(FIXTURE_JSON);
    const october = seasons.find((season) => season.id === '2026-10');

    expect(october).toMatchObject({
      id: '2026-10',
      startDate: '2026-10-01',
      source: 'beta',
      elements: ['Hydro', 'Cryo', 'Anemo'],
      specialGuests: ['Ineffa', 'YaeMiko', 'Thoma', 'Chiori'],
    });
  });

  it('should sort seasons by id ascending', () => {
    const { seasons } = parseRoleCombat(FIXTURE_JSON);

    expect(seasons.map((season) => season.id)).toEqual([
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
    ]);
  });

  it('should ignore the trailing 0 element slot', () => {
    const { seasons } = parseRoleCombat(FIXTURE_JSON);

    for (const season of seasons) {
      expect(season.elements).toHaveLength(3);
    }
  });

  it('should omit unmapped avatar ids from a season but still emit the season', () => {
    const { seasons, unknownAvatarIds } = parseRoleCombat(FIXTURE_JSON);
    const september = seasons.find((season) => season.id === '2026-09');

    // Season 29's invite list contains two ids with no repo mapping.
    expect(september?.specialGuests).toEqual(['Sucrose', 'Lohen']);
    expect(unknownAvatarIds).toContain(10000150);
    expect(unknownAvatarIds).toEqual([...unknownAvatarIds].sort((a, b) => a - b));
    expect(new Set(unknownAvatarIds).size).toBe(unknownAvatarIds.length);
  });

  it('should report each unknown id once even across seasons', () => {
    const json = JSON.stringify({
      28: { element: [3, 5, 6, 0], invite: [10000150], buff: [10000150] },
      29: { element: [3, 5, 6, 0], invite: [10000150], buff: [] },
    });

    expect(parseRoleCombat(json).unknownAvatarIds).toEqual([10000150]);
  });

  it('should skip entries below minSeasonId', () => {
    const defaultResult = parseRoleCombat(FIXTURE_JSON);
    expect(defaultResult.seasons).toHaveLength(4);

    const filtered = parseRoleCombat(FIXTURE_JSON, { minSeasonId: 30 });
    expect(filtered.seasons.map((season) => season.id)).toEqual(['2026-10', '2026-11']);

    const none = parseRoleCombat(FIXTURE_JSON, { minSeasonId: 99 });
    expect(none.seasons).toEqual([]);
    expect(none.unknownAvatarIds).toEqual([]);
  });

  it('should include older entries when minSeasonId is lowered', () => {
    const json = JSON.stringify({
      27: { element: [2, 3, 4, 0], invite: [10000043], buff: [10000025] },
    });

    expect(parseRoleCombat(json).seasons).toEqual([]);
    expect(parseRoleCombat(json, { minSeasonId: 27 }).seasons).toHaveLength(1);
    expect(parseRoleCombat(json, { minSeasonId: 27 }).seasons[0]?.id).toBe('2026-07');
  });

  it('should return an empty result for invalid JSON', () => {
    expect(parseRoleCombat('not json at all')).toEqual({ seasons: [], unknownAvatarIds: [] });
    expect(parseRoleCombat('')).toEqual({ seasons: [], unknownAvatarIds: [] });
    expect(parseRoleCombat('[1,2,3]')).toEqual({ seasons: [], unknownAvatarIds: [] });
    expect(parseRoleCombat('null')).toEqual({ seasons: [], unknownAvatarIds: [] });
    expect(parseRoleCombat('"a string"')).toEqual({ seasons: [], unknownAvatarIds: [] });
  });

  it('should skip malformed entries without throwing', () => {
    const json = JSON.stringify({
      28: { invite: [10000096], buff: [10000060] }, // no element
      29: { element: [3, 5, 6, 0], buff: [10000060] }, // no invite
      30: { element: [3, 5, 6, 0], invite: [10000096] }, // no buff
      31: { element: [3, 5, 99, 0], invite: [10000096], buff: [10000060] }, // bad code
      32: { element: [3, 5, 0], invite: [10000096], buff: [10000060] }, // only 2 elements
      33: 'not an object',
      34: { element: [3, 5, 6, 0], invite: [10000096], buff: [10000060] }, // valid
    });

    const result = parseRoleCombat(json);

    expect(result.seasons.map((season) => season.id)).toEqual(['2027-02']);
    expect(result.unknownAvatarIds).toEqual([]);
  });

  it('should not leak unknown ids from a skipped malformed entry', () => {
    const json = JSON.stringify({
      28: { element: [3, 5, 99, 0], invite: [10000150], buff: [10000150] },
    });

    expect(parseRoleCombat(json)).toEqual({ seasons: [], unknownAvatarIds: [] });
  });

  it('should ignore non-numeric season keys and non-numeric avatar ids', () => {
    const json = JSON.stringify({
      latest: { element: [3, 5, 6, 0], invite: [10000096], buff: [10000060] },
      28: { element: [3, 5, 6, 0], invite: ['10000096', 10000090], buff: [10000060] },
    });

    const result = parseRoleCombat(json);

    expect(result.seasons).toHaveLength(1);
    expect(result.seasons[0]?.specialGuests).toEqual(['Chevreuse']);
    expect(result.unknownAvatarIds).toEqual([]);
  });
});
