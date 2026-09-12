import type { GachaRules } from '../../../types';
import { getRadianceFeaturedRate, isRadianceGuaranteed } from '../../../lib/gacha/radiance';

/**
 * Calculate 5-star pull probability at a given pity count
 */
export function getPullProbability(pity: number, rules: GachaRules): number {
  // Hard pity - guaranteed
  if (pity >= rules.hardPity) return 1.0;

  // Before soft pity - base rate
  if (pity < rules.softPityStart) return rules.baseRate;

  // Soft pity - increasing rate
  const softPityPulls = pity - rules.softPityStart + 1;
  return Math.min(1.0, rules.baseRate + softPityPulls * rules.softPityRateIncrease);
}

/**
 * Probability that a non-guaranteed 5★ is the featured (rate-up) item.
 * Character banner: Capturing Radiance state machine (see lib/gacha/radiance.ts).
 * Other banners: the banner's featuredRate (0.75 weapon, 0.5 chronicled, 1.0 standard = "any 5★").
 */
export function getFeaturedProbability(radiantStreak: number, rules: GachaRules): number {
  return getRadianceFeaturedRate(radiantStreak, rules);
}

export interface PullState {
  pity: number;
  /** Character/chronicled: featured guaranteed. Weapon: rate-up guaranteed (75/25 lost). */
  guaranteed: boolean;
  radiantStreak: number;
  /** Weapon banner Epitomized Path fate points. */
  fatePoints: number;
}

function maxFatePoints(rules: GachaRules): number {
  return rules.maxFatePoints ?? 1;
}

/**
 * Probability that a 5★ obtained in this state is the *target* item
 * (featured character, or the charted weapon on the weapon banner).
 */
export function getTargetProbability(state: PullState, rules: GachaRules): number {
  if (rules.hasFatePoints) {
    if (state.fatePoints >= maxFatePoints(rules)) return 1.0;
    const rateUp = state.guaranteed ? 1.0 : (rules.featuredRate ?? 0.75);
    return rateUp * (rules.chartedShare ?? 0.5);
  }
  if (state.guaranteed) return 1.0;
  return getRadianceFeaturedRate(state.radiantStreak, rules);
}

export interface PullOutcome {
  got5Star: boolean;
  /** True when the 5★ was the target item (featured character / charted weapon). */
  wasFeatured: boolean;
  newPity: number;
  newGuaranteed: boolean;
  newRadiantStreak: number;
  newFatePoints: number;
  triggeredRadiance: boolean;
}

/**
 * Simulate a single pull on any banner.
 */
export function simulatePull(
  currentPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  rules: GachaRules,
  rng: () => number = Math.random,
  fatePoints: number = 0
): PullOutcome {
  const pullProb = getPullProbability(currentPity, rules);
  const got5Star = rng() < pullProb;

  if (!got5Star) {
    return {
      got5Star: false,
      wasFeatured: false,
      newPity: currentPity + 1,
      newGuaranteed: isGuaranteed,
      newRadiantStreak: radiantStreak,
      newFatePoints: fatePoints,
      triggeredRadiance: false,
    };
  }

  // --- Weapon banner: 75/25 + Epitomized Path ---
  if (rules.hasFatePoints) {
    if (fatePoints >= maxFatePoints(rules)) {
      return {
        got5Star: true,
        wasFeatured: true,
        newPity: 0,
        newGuaranteed: false,
        newRadiantStreak: 0,
        newFatePoints: 0,
        triggeredRadiance: false,
      };
    }
    const isRateUp = isGuaranteed || rng() < (rules.featuredRate ?? 0.75);
    if (!isRateUp) {
      // Off-banner weapon: rate-up guaranteed next time, +1 fate point
      return {
        got5Star: true,
        wasFeatured: false,
        newPity: 0,
        newGuaranteed: true,
        newRadiantStreak: 0,
        newFatePoints: Math.min(maxFatePoints(rules), fatePoints + 1),
        triggeredRadiance: false,
      };
    }
    const isCharted = rng() < (rules.chartedShare ?? 0.5);
    return {
      got5Star: true,
      wasFeatured: isCharted,
      newPity: 0,
      newGuaranteed: false,
      newRadiantStreak: 0,
      newFatePoints: isCharted ? 0 : Math.min(maxFatePoints(rules), fatePoints + 1),
      triggeredRadiance: false,
    };
  }

  // --- Character / chronicled / standard ---
  if (isGuaranteed) {
    return {
      got5Star: true,
      wasFeatured: true,
      newPity: 0,
      newGuaranteed: false,
      newRadiantStreak: radiantStreak, // Guaranteed pulls do not touch the radiance streak
      newFatePoints: 0,
      triggeredRadiance: false,
    };
  }

  const featuredProb = getRadianceFeaturedRate(radiantStreak, rules);
  const triggeredRadiance = isRadianceGuaranteed(radiantStreak, rules);
  const wasFeatured = rng() < featuredProb;

  return {
    got5Star: true,
    wasFeatured,
    newPity: 0,
    newGuaranteed: !wasFeatured,
    newRadiantStreak: wasFeatured ? 0 : radiantStreak + 1,
    newFatePoints: 0,
    triggeredRadiance,
  };
}

/**
 * Cumulative probability of obtaining the target item within N pulls, by exact
 * dynamic programming over (pity, guaranteed, radiantStreak, fatePoints).
 */
export function calculateDistribution(
  startPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  maxPulls: number,
  rules: GachaRules,
  startFatePoints: number = 0
): Array<{ pulls: number; probability: number }> {
  const stateKey = (s: PullState) =>
    `${s.pity}-${s.guaranteed ? 1 : 0}-${s.radiantStreak}-${s.fatePoints}`;
  const parseKey = (key: string): PullState => {
    const [p, g, r, f] = key.split('-');
    return {
      pity: parseInt(p ?? '0', 10),
      guaranteed: g === '1',
      radiantStreak: parseInt(r ?? '0', 10),
      fatePoints: parseInt(f ?? '0', 10),
    };
  };
  const fpMax = maxFatePoints(rules);
  const streakCap = rules.radianceThreshold ?? 3;

  let currentStates = new Map<string, number>();
  currentStates.set(
    stateKey({ pity: startPity, guaranteed: isGuaranteed, radiantStreak, fatePoints: startFatePoints }),
    1.0
  );

  let cumulativeProbability = 0;
  const distribution: Array<{ pulls: number; probability: number }> = [];
  const add = (map: Map<string, number>, s: PullState, mass: number) => {
    if (mass <= 0) return;
    const k = stateKey(s);
    map.set(k, (map.get(k) || 0) + mass);
  };

  for (let pullCount = 1; pullCount <= maxPulls; pullCount++) {
    const nextStates = new Map<string, number>();

    for (const [key, prob] of currentStates) {
      const state = parseKey(key);
      const pullProb = getPullProbability(state.pity, rules);

      // Case 1: no 5★
      if (pullProb < 1.0) {
        add(nextStates, { ...state, pity: state.pity + 1 }, prob * (1 - pullProb));
      }
      if (pullProb <= 0) continue;

      const mass5 = prob * pullProb;

      if (rules.hasFatePoints) {
        // Weapon banner
        if (state.fatePoints >= fpMax) {
          cumulativeProbability += mass5;
          continue;
        }
        const rateUp = state.guaranteed ? 1.0 : (rules.featuredRate ?? 0.75);
        const charted = rules.chartedShare ?? 0.5;
        cumulativeProbability += mass5 * rateUp * charted;
        // Rate-up but not charted
        add(
          nextStates,
          { pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: Math.min(fpMax, state.fatePoints + 1) },
          mass5 * rateUp * (1 - charted)
        );
        // Off-banner
        add(
          nextStates,
          { pity: 0, guaranteed: true, radiantStreak: 0, fatePoints: Math.min(fpMax, state.fatePoints + 1) },
          mass5 * (1 - rateUp)
        );
        continue;
      }

      // Character / chronicled / standard
      if (state.guaranteed) {
        cumulativeProbability += mass5;
        continue;
      }
      const featuredProb = getRadianceFeaturedRate(state.radiantStreak, rules);
      cumulativeProbability += mass5 * featuredProb;
      add(
        nextStates,
        {
          pity: 0,
          guaranteed: true,
          radiantStreak: Math.min(streakCap, state.radiantStreak + 1),
          fatePoints: 0,
        },
        mass5 * (1 - featuredProb)
      );
    }

    distribution.push({ pulls: pullCount, probability: Math.min(1, cumulativeProbability) });
    currentStates = nextStates;

    // Stop once the target is certain (hard pity makes this exact, not asymptotic).
    if (cumulativeProbability >= 1 - 1e-12 || nextStates.size === 0) break;
  }

  return distribution;
}

/**
 * Find pulls needed for target probability
 */
export function pullsForProbability(
  targetProb: number,
  startPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  rules: GachaRules,
  startFatePoints: number = 0
): number {
  const distribution = calculateDistribution(startPity, isGuaranteed, radiantStreak, 300, rules, startFatePoints);

  for (const point of distribution) {
    if (point.probability >= targetProb) {
      return point.pulls;
    }
  }

  return 300; // Maximum searched
}
