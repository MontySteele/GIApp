import { describe, expect, it } from 'vitest';
import { GACHA_RULES } from '@/lib/constants';
import {
  calculateDistribution,
  getPullProbability,
  getTargetProbability,
  pullsForProbability,
  simulatePull,
} from './pityEngine';

const character = GACHA_RULES.character!;
const weapon = GACHA_RULES.weapon!;

/** Expected pulls per 5★ from zero pity, computed from the per-pull rate table. */
function expectedPullsPerFiveStar(rules: typeof character): number {
  let survive = 1;
  let expectation = 0;
  for (let pity = 0; pity < rules.hardPity; pity++) {
    const p = getPullProbability(pity, rules);
    expectation += survive * p * (pity + 1);
    survive *= 1 - p;
  }
  return expectation;
}

function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

describe('known gacha numbers (character banner)', () => {
  it('expected pulls per 5★ is ~62.3 with the 0.6% / +6% from pull 74 model', () => {
    expect(expectedPullsPerFiveStar(character)).toBeCloseTo(62.3, 0);
  });

  it('a 5★ is certain by pull 90 and the featured 5★ by pull 180', () => {
    const anyFiveStar = calculateDistribution(0, true, 0, 90, character);
    expect(anyFiveStar[89]!.probability).toBeCloseTo(1, 9);

    const featured = calculateDistribution(0, false, 0, 180, character);
    expect(featured[featured.length - 1]!.probability).toBeCloseTo(1, 9);
    expect(featured[featured.length - 1]!.pulls).toBeLessThanOrEqual(180);
  });

  it('P(featured within 90) from zero lies strictly between 50% and 100%', () => {
    // Losing the 50/50 early still leaves room to win the guarantee inside the same 90 pulls,
    // so it must exceed one half, but it cannot reach the certainty of a guaranteed run.
    const featured = calculateDistribution(0, false, 0, 90, character)[89]!.probability;
    expect(featured).toBeGreaterThan(0.5);
    expect(featured).toBeLessThan(1);
    // The first 5★ itself is a coin flip at streak 0.
    expect(calculateDistribution(89, false, 0, 1, character)[0]!.probability).toBeCloseTo(0.5, 9);
  });

  it('a radiance streak of 2 raises the first-5★ featured odds to 75%, and 3 to 100%', () => {
    const streak2 = calculateDistribution(89, false, 2, 1, character)[0]!.probability;
    const streak3 = calculateDistribution(89, false, 3, 1, character)[0]!.probability;
    expect(streak2).toBeCloseTo(0.75, 9);
    expect(streak3).toBeCloseTo(1, 9);
  });

  it('long-run featured rate of the radiance chain is ~55.2%', () => {
    const rng = lcg(12345);
    let pity = 0;
    let guaranteed = false;
    let streak = 0;
    let fiftyFifties = 0;
    let wins = 0;
    let fiveStars = 0;
    while (fiveStars < 200_000) {
      const r = simulatePull(pity, guaranteed, streak, character, rng);
      pity = r.newPity;
      if (r.got5Star) {
        fiveStars++;
        if (!guaranteed) {
          fiftyFifties++;
          if (r.wasFeatured) wins++;
        }
        guaranteed = r.newGuaranteed;
        streak = r.newRadiantStreak;
      }
    }
    expect(wins / fiftyFifties).toBeGreaterThan(0.542);
    expect(wins / fiftyFifties).toBeLessThan(0.562);
  });

  it('median pulls for the featured character from zero is in the 75-90 band', () => {
    const p50 = pullsForProbability(0.5, 0, false, 0, character);
    expect(p50).toBeGreaterThanOrEqual(75);
    expect(p50).toBeLessThanOrEqual(90);
  });
});

describe('known gacha numbers (weapon banner)', () => {
  it('rules reflect Version 5.0: 80 hard pity, 1 fate point, 75/25, two rate-up weapons', () => {
    expect(weapon.hardPity).toBe(80);
    expect(weapon.maxFatePoints).toBe(1);
    expect(weapon.featuredRate).toBe(0.75);
    expect(weapon.chartedShare).toBe(0.5);
  });

  it('a 5★ is certain by pull 80 (the ramp reaches 100% at pull 77)', () => {
    expect(getPullProbability(76, weapon)).toBe(1);
    expect(getPullProbability(79, weapon)).toBe(1);
    expect(expectedPullsPerFiveStar(weapon)).toBeGreaterThan(52);
    expect(expectedPullsPerFiveStar(weapon)).toBeLessThan(55);
  });

  it('charted weapon odds per 5★ are 37.5% fresh, 50% after losing the 75/25, 100% with a fate point', () => {
    expect(getTargetProbability({ pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: 0 }, weapon)).toBeCloseTo(0.375, 9);
    expect(getTargetProbability({ pity: 0, guaranteed: true, radiantStreak: 0, fatePoints: 0 }, weapon)).toBeCloseTo(0.5, 9);
    expect(getTargetProbability({ pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: 1 }, weapon)).toBe(1);
  });

  it('the charted weapon is certain within 160 pulls (two 5★s) and within 80 with a fate point', () => {
    const fresh = calculateDistribution(0, false, 0, 160, weapon);
    expect(fresh[fresh.length - 1]!.probability).toBeCloseTo(1, 9);
    expect(fresh[fresh.length - 1]!.pulls).toBeLessThanOrEqual(160);

    const withPoint = calculateDistribution(0, false, 0, 80, weapon, 1);
    expect(withPoint[withPoint.length - 1]!.probability).toBeCloseTo(1, 9);
    expect(withPoint[withPoint.length - 1]!.pulls).toBeLessThanOrEqual(80);
  });

  it('simulatePull applies fate points: the second 5★ is always the charted weapon', () => {
    const rng = lcg(777);
    let worstSecondFive = 0;
    for (let run = 0; run < 2000; run++) {
      let pity = 0;
      let guaranteed = false;
      let fatePoints = 0;
      let fiveStars = 0;
      let got = false;
      while (!got) {
        const r = simulatePull(pity, guaranteed, 0, weapon, rng, fatePoints);
        pity = r.newPity;
        guaranteed = r.newGuaranteed;
        fatePoints = r.newFatePoints;
        if (r.got5Star) {
          fiveStars++;
          got = r.wasFeatured;
        }
      }
      worstSecondFive = Math.max(worstSecondFive, fiveStars);
    }
    expect(worstSecondFive).toBe(2);
  });

  it('Monte Carlo and the analytic distribution agree on P(charted within 80) from zero', () => {
    const analytic = calculateDistribution(0, false, 0, 80, weapon)[79]!.probability;
    const rng = lcg(4242);
    const runs = 40_000;
    let successes = 0;
    for (let run = 0; run < runs; run++) {
      let pity = 0;
      let guaranteed = false;
      let fatePoints = 0;
      for (let pull = 0; pull < 80; pull++) {
        const r = simulatePull(pity, guaranteed, 0, weapon, rng, fatePoints);
        pity = r.newPity;
        guaranteed = r.newGuaranteed;
        fatePoints = r.newFatePoints;
        if (r.got5Star && r.wasFeatured) {
          successes++;
          break;
        }
      }
    }
    expect(successes / runs).toBeCloseTo(analytic, 1);
  });
});
