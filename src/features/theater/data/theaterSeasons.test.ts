import { describe, it, expect, afterEach, vi } from 'vitest';
import { ALL_CHARACTERS } from '@/lib/constants/characterList';
import {
  THEATER_SEASONS,
  getAllSeasons,
  getCurrentSeason,
  getSeasonById,
  type TheaterSeason,
} from './theaterSeasons';

describe('THEATER_SEASONS', () => {
  it('should seed the August 2026 season exactly', () => {
    expect(THEATER_SEASONS[0]).toMatchObject({
      id: '2026-08',
      startDate: '2026-08-01',
      elements: ['Hydro', 'Electro', 'Cryo'],
      openingCharacters: ['Yelan', 'Aino', 'Flins', 'Ororon', 'Skirk', 'Layla'],
      specialGuests: ['Arlecchino', 'Chevreuse', 'KaedeharaKazuha', 'Tighnari'],
      source: 'official',
    });
  });

  it('should use only keys that exist in ALL_CHARACTERS', () => {
    const known = new Set(ALL_CHARACTERS.map((entry) => entry.key));

    for (const season of THEATER_SEASONS) {
      for (const key of [...season.openingCharacters, ...season.specialGuests]) {
        expect(known.has(key)).toBe(true);
      }
    }
  });

  it('should have 6 openers, 4 guests, and 3 elements per season', () => {
    for (const season of THEATER_SEASONS) {
      expect(season.openingCharacters).toHaveLength(6);
      expect(season.specialGuests).toHaveLength(4);
      expect(season.elements).toHaveLength(3);
    }
  });
});

describe('getSeasonById', () => {
  it('should return the matching season', () => {
    expect(getSeasonById('2026-08')?.id).toBe('2026-08');
  });

  it('should return undefined for an unknown id', () => {
    expect(getSeasonById('1999-01')).toBeUndefined();
  });
});

describe('getCurrentSeason', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return the season whose month is in progress', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-15T12:00:00Z'));

    expect(getCurrentSeason(new Date())?.id).toBe('2026-08');
  });

  it('should return the season on the first instant of its start date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-01T00:00:00Z'));

    expect(getCurrentSeason(new Date())?.id).toBe('2026-08');
  });

  it('should return undefined before the season starts', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-31T23:59:59Z'));

    expect(getCurrentSeason(new Date())).toBeUndefined();
  });

  it('should return undefined once the season month has elapsed', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T00:00:00Z'));

    expect(getCurrentSeason(new Date())).toBeUndefined();
  });
});

describe('getAllSeasons', () => {
  const betaSeason: TheaterSeason = {
    id: '2026-10',
    startDate: '2026-10-01',
    elements: ['Hydro', 'Cryo', 'Anemo'],
    openingCharacters: ['Neuvillette', 'Barbara', 'Citlali', 'Kaeya', 'Wanderer', 'Prune'],
    specialGuests: ['Ineffa', 'YaeMiko', 'Thoma', 'Chiori'],
    source: 'beta',
  };

  it('should return the hand-seeded seasons when nothing is parsed', () => {
    expect(getAllSeasons().map((season) => season.id)).toEqual(['2026-08']);
  });

  it('should merge parsed seasons and sort by id ascending', () => {
    expect(getAllSeasons([betaSeason]).map((season) => season.id)).toEqual([
      '2026-08',
      '2026-10',
    ]);
  });

  it('should prefer the hand-seeded entry over a parsed beta entry for the same month', () => {
    const conflicting: TheaterSeason = { ...betaSeason, id: '2026-08', source: 'beta' };
    const merged = getAllSeasons([conflicting]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.openingCharacters).toEqual(THEATER_SEASONS[0]?.openingCharacters);
  });

  it('should prefer an official parsed entry over a beta parsed entry', () => {
    const official: TheaterSeason = { ...betaSeason, source: 'official' };
    const merged = getAllSeasons([betaSeason, official]);

    expect(merged.find((season) => season.id === '2026-10')?.source).toBe('official');
  });

  it('should not mutate THEATER_SEASONS', () => {
    const before = THEATER_SEASONS.length;
    getAllSeasons([betaSeason]);
    expect(THEATER_SEASONS).toHaveLength(before);
  });
});
