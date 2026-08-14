import { describe, it, expect } from 'vitest';
import type { Character } from '@/types';
import type { TheaterSeason } from '../data/theaterSeasons';
import {
  DIFFICULTY_RULES,
  computeSeasonReadiness,
  countByReason,
  getDifficultyRule,
  type DifficultyReadiness,
  type TheaterDifficulty,
} from './readiness';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    id: 'test-id-1',
    key: 'Furina',
    level: 90,
    ascension: 6,
    constellation: 0,
    talent: { auto: 1, skill: 1, burst: 1 },
    weapon: { key: 'SplendorOfTranquilWaters', level: 90, ascension: 6, refinement: 1 },
    artifacts: [],
    notes: '',
    priority: 'main',
    teamIds: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Hydro/Electro/Cryo season with openers and guests drawn from other elements
// so element matching and season membership stay independently observable.
const SEASON: TheaterSeason = {
  id: '2026-08',
  startDate: '2026-08-01',
  elements: ['Hydro', 'Electro', 'Cryo'],
  openingCharacters: ['Yelan', 'Aino', 'Flins', 'Ororon', 'Skirk', 'Layla'],
  specialGuests: ['Arlecchino', 'Chevreuse', 'KaedeharaKazuha', 'Tighnari'],
  source: 'official',
};

/** Hydro/Electro/Cryo characters that are neither openers nor guests. */
const FEATURED_FILLERS = [
  'Xingqiu',
  'Mona',
  'Barbara',
  'Candace',
  'Nilou',
  'Fischl',
  'Beidou',
  'Lisa',
  'Razor',
  'Keqing',
  'Cyno',
  'Dori',
  'Kaeya',
  'Diona',
  'Chongyun',
  'Qiqi',
  'Rosaria',
  'Ganyu',
  'Eula',
  'Shenhe',
  'Mika',
  'Charlotte',
  'Sigewinne',
  'Clorinde',
  'Neuvillette',
  'Furina',
  'Citlali',
  'Escoffier',
];

function makeFeaturedRoster(count: number, level = 90): Character[] {
  return FEATURED_FILLERS.slice(0, count).map((key, index) =>
    makeCharacter({ id: `filler-${index}`, key, level })
  );
}

function readinessFor(
  result: { difficulties: DifficultyReadiness[] },
  difficulty: TheaterDifficulty
): DifficultyReadiness {
  const match = result.difficulties.find((entry) => entry.difficulty === difficulty);
  if (!match) throw new Error(`missing difficulty ${difficulty}`);
  return match;
}

describe('DIFFICULTY_RULES', () => {
  it('should be ordered easy -> lunar with the documented thresholds', () => {
    expect(DIFFICULTY_RULES.map((rule) => [rule.difficulty, rule.minRoster, rule.minLevel])).toEqual([
      ['easy', 8, 60],
      ['normal', 12, 60],
      ['hard', 16, 70],
      ['visionary', 22, 70],
      ['lunar', 28, 70],
    ]);
  });

  it('should chain the unlock requirements visionary -> hard and lunar -> visionary', () => {
    expect(getDifficultyRule('visionary')?.requiresClear).toBe('hard');
    expect(getDifficultyRule('lunar')?.requiresClear).toBe('visionary');
  });
});

describe('computeSeasonReadiness', () => {
  it('should count only the six opener trials for an empty roster', () => {
    const result = computeSeasonReadiness(SEASON, []);

    expect(result.seasonId).toBe('2026-08');
    expect(result.difficulties).toHaveLength(5);

    for (const difficulty of result.difficulties) {
      expect(difficulty.eligibleCount).toBe(6);
      expect(difficulty.ready).toBe(false);
      expect(difficulty.nearMiss).toEqual([]);
      expect(countByReason(difficulty).openingTrial).toBe(6);
    }

    expect(readinessFor(result, 'easy').shortfall).toBe(2);
    expect(readinessFor(result, 'lunar').shortfall).toBe(22);
  });

  it('should report ready exactly at a threshold and short one below it', () => {
    const atThreshold = computeSeasonReadiness(SEASON, makeFeaturedRoster(2));
    expect(readinessFor(atThreshold, 'easy').eligibleCount).toBe(8);
    expect(readinessFor(atThreshold, 'easy').ready).toBe(true);
    expect(readinessFor(atThreshold, 'easy').shortfall).toBe(0);

    const belowThreshold = computeSeasonReadiness(SEASON, makeFeaturedRoster(1));
    expect(readinessFor(belowThreshold, 'easy').eligibleCount).toBe(7);
    expect(readinessFor(belowThreshold, 'easy').ready).toBe(false);
    expect(readinessFor(belowThreshold, 'easy').shortfall).toBe(1);
  });

  it('should stay ready above a threshold', () => {
    const result = computeSeasonReadiness(SEASON, makeFeaturedRoster(10));

    expect(readinessFor(result, 'easy').ready).toBe(true);
    expect(readinessFor(result, 'normal').eligibleCount).toBe(16);
    expect(readinessFor(result, 'normal').ready).toBe(true);
    expect(readinessFor(result, 'hard').ready).toBe(true);
    expect(readinessFor(result, 'visionary').ready).toBe(false);
  });

  it('should let unowned opener trials push a short roster over a threshold', () => {
    // Six owned featured characters alone are short of Easy's eight.
    const result = computeSeasonReadiness(SEASON, makeFeaturedRoster(6));
    const easy = readinessFor(result, 'easy');

    expect(countByReason(easy).element).toBe(6);
    expect(countByReason(easy).openingTrial).toBe(6);
    expect(easy.eligibleCount).toBe(12);
    expect(easy.ready).toBe(true);
  });

  it('should count owned special guests and ignore unowned ones', () => {
    const withGuest = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'guest', key: 'Tighnari', level: 90 }),
    ]);
    const easy = readinessFor(withGuest, 'easy');

    expect(countByReason(easy).specialGuest).toBe(1);
    expect(easy.eligible).toContainEqual({ key: 'Tighnari', reason: 'specialGuest', level: 90 });

    const withoutGuest = computeSeasonReadiness(SEASON, []);
    expect(countByReason(readinessFor(withoutGuest, 'easy')).specialGuest).toBe(0);
  });

  it('should ignore the element restriction for owned guests', () => {
    // Tighnari is Dendro, which is not featured this season.
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'guest', key: 'Tighnari', level: 70 }),
    ]);

    expect(readinessFor(result, 'hard').eligibleCount).toBe(7);
  });

  it('should apply the level floor at 59/60 and populate nearMiss', () => {
    const belowFloor = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Xingqiu', level: 59 }),
    ]);
    const easyBelow = readinessFor(belowFloor, 'easy');
    expect(easyBelow.eligibleCount).toBe(6);
    expect(easyBelow.nearMiss).toEqual([{ key: 'Xingqiu', level: 59, levelsNeeded: 1 }]);

    const atFloor = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Xingqiu', level: 60 }),
    ]);
    const easyAt = readinessFor(atFloor, 'easy');
    expect(easyAt.eligibleCount).toBe(7);
    expect(easyAt.nearMiss).toEqual([]);
  });

  it('should apply the level floor at 69/70 for hard and above', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Xingqiu', level: 69 }),
      makeCharacter({ id: 'b', key: 'Fischl', level: 70 }),
    ]);

    const hard = readinessFor(result, 'hard');
    expect(hard.eligibleCount).toBe(7);
    expect(hard.nearMiss).toEqual([{ key: 'Xingqiu', level: 69, levelsNeeded: 1 }]);

    // Both clear the lower Normal floor.
    expect(readinessFor(result, 'normal').eligibleCount).toBe(8);
    expect(readinessFor(result, 'normal').nearMiss).toEqual([]);
  });

  it('should sort nearMiss by levels needed ascending', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Xingqiu', level: 40 }),
      makeCharacter({ id: 'b', key: 'Fischl', level: 69 }),
      makeCharacter({ id: 'c', key: 'Kaeya', level: 55 }),
    ]);

    expect(readinessFor(result, 'hard').nearMiss).toEqual([
      { key: 'Fischl', level: 69, levelsNeeded: 1 },
      { key: 'Kaeya', level: 55, levelsNeeded: 15 },
      { key: 'Xingqiu', level: 40, levelsNeeded: 30 },
    ]);
  });

  it('should count an owned but underleveled opener via its trial and keep it out of nearMiss', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Yelan', level: 20 }),
    ]);
    const hard = readinessFor(result, 'hard');

    expect(hard.eligibleCount).toBe(6);
    expect(hard.nearMiss).toEqual([]);
    expect(hard.eligible).toContainEqual({ key: 'Yelan', reason: 'openingOwned', level: 20 });
  });

  it('should never double-count an owned opener', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Yelan', level: 90 }),
    ]);
    const easy = readinessFor(result, 'easy');
    const counts = countByReason(easy);

    expect(easy.eligibleCount).toBe(6);
    expect(counts.openingOwned).toBe(1);
    expect(counts.openingTrial).toBe(5);
    expect(easy.eligible.filter((entry) => entry.key === 'Yelan')).toHaveLength(1);
  });

  it('should report specialGuest for a guest that also matches a featured element', () => {
    // Chevreuse is Pyro (not featured), so use an Electro-matching guest case:
    // KaedeharaKazuha is Anemo, Arlecchino is Pyro, Tighnari is Dendro.
    // Build a season whose guest is also element-eligible to exercise priority.
    const season: TheaterSeason = { ...SEASON, specialGuests: ['Xingqiu', 'Arlecchino', 'Chevreuse', 'Tighnari'] };
    const result = computeSeasonReadiness(season, [
      makeCharacter({ id: 'a', key: 'Xingqiu', level: 90 }),
    ]);
    const easy = readinessFor(result, 'easy');

    expect(easy.eligible.filter((entry) => entry.key === 'Xingqiu')).toEqual([
      { key: 'Xingqiu', reason: 'specialGuest', level: 90 },
    ]);
    expect(countByReason(easy).element).toBe(0);
  });

  it('should silently skip characters whose key has no metadata', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'NotARealCharacter', level: 90 }),
      makeCharacter({ id: 'b', key: 'Xingqiu', level: 90 }),
    ]);
    const easy = readinessFor(result, 'easy');

    expect(easy.eligibleCount).toBe(7);
    expect(easy.eligible.some((entry) => entry.key === 'NotARealCharacter')).toBe(false);
    expect(easy.nearMiss.some((entry) => entry.key === 'NotARealCharacter')).toBe(false);
  });

  it('should skip owned characters whose element is not featured', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Zhongli', level: 90 }),
    ]);

    expect(readinessFor(result, 'easy').eligibleCount).toBe(6);
    expect(readinessFor(result, 'easy').nearMiss).toEqual([]);
  });

  it('should block lunar through the visionary -> hard chain', () => {
    const empty = computeSeasonReadiness(SEASON, []);
    expect(readinessFor(empty, 'hard').ready).toBe(false);
    expect(readinessFor(empty, 'visionary').blockedByUnlock).toBe(true);
    expect(readinessFor(empty, 'lunar').blockedByUnlock).toBe(true);
    // Easy/normal/hard have no prerequisite.
    expect(readinessFor(empty, 'easy').blockedByUnlock).toBe(false);
    expect(readinessFor(empty, 'hard').blockedByUnlock).toBe(false);
  });

  it('should unblock visionary once hard is ready and leave lunar blocked until visionary is', () => {
    const result = computeSeasonReadiness(SEASON, makeFeaturedRoster(10, 90));

    expect(readinessFor(result, 'hard').ready).toBe(true);
    expect(readinessFor(result, 'visionary').blockedByUnlock).toBe(false);
    expect(readinessFor(result, 'visionary').ready).toBe(false);
    expect(readinessFor(result, 'lunar').blockedByUnlock).toBe(true);
  });

  it('should unblock lunar once visionary is ready', () => {
    const result = computeSeasonReadiness(SEASON, makeFeaturedRoster(16, 90));

    expect(readinessFor(result, 'visionary').ready).toBe(true);
    expect(readinessFor(result, 'lunar').blockedByUnlock).toBe(false);
    expect(readinessFor(result, 'lunar').eligibleCount).toBe(22);
    expect(readinessFor(result, 'lunar').shortfall).toBe(6);
  });

  it('should reach lunar with a full roster', () => {
    const result = computeSeasonReadiness(SEASON, makeFeaturedRoster(22, 90));

    expect(readinessFor(result, 'lunar').eligibleCount).toBe(28);
    expect(readinessFor(result, 'lunar').ready).toBe(true);
    expect(readinessFor(result, 'lunar').blockedByUnlock).toBe(false);
  });

  it('should count a character only once when the roster holds duplicates', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'Xingqiu', level: 50 }),
      makeCharacter({ id: 'b', key: 'Xingqiu', level: 90 }),
    ]);
    const easy = readinessFor(result, 'easy');

    expect(easy.eligibleCount).toBe(7);
    expect(easy.nearMiss).toEqual([]);
  });

  it('should match roster keys regardless of spacing and casing', () => {
    const result = computeSeasonReadiness(SEASON, [
      makeCharacter({ id: 'a', key: 'kaedehara kazuha', level: 90 }),
    ]);

    expect(countByReason(readinessFor(result, 'easy')).specialGuest).toBe(1);
  });
});
