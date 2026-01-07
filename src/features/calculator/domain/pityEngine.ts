import type { GachaRules } from '@/types';

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
 * Calculate featured character probability (50/50 or Capturing Radiance)
 * Base rate is 55% (not 50%), with 100% guarantee after 3 consecutive losses
 */
export function getFeaturedProbability(radiantStreak: number, rules: GachaRules): number {
  if (!rules.hasCapturingRadiance) return 0.5;

  // Capturing Radiance activates after losing 50/50 three times consecutively
  if (radiantStreak >= (rules.radianceThreshold || 3)) {
    return 1.0; // Guaranteed featured after 3 losses
  }

  return 0.55; // Base 55% win rate (not 50%)
}

/**
 * Simulate a single pull on character banner
 */
export function simulatePull(
  currentPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  rules: GachaRules,
  rng: () => number = Math.random
): {
  got5Star: boolean;
  wasFeatured: boolean;
  newPity: number;
  newGuaranteed: boolean;
  newRadiantStreak: number;
  triggeredRadiance: boolean;
} {
  const pullProb = getPullProbability(currentPity, rules);
  const got5Star = rng() < pullProb;

  if (!got5Star) {
    return {
      got5Star: false,
      wasFeatured: false,
      newPity: currentPity + 1,
      newGuaranteed: isGuaranteed,
      newRadiantStreak: radiantStreak,
      triggeredRadiance: false,
    };
  }

  // Got a 5-star!
  if (isGuaranteed) {
    // Guaranteed featured
    return {
      got5Star: true,
      wasFeatured: true,
      newPity: 0,
      newGuaranteed: false,
      newRadiantStreak: 0,
      triggeredRadiance: false,
    };
  }

  // 50/50 or Capturing Radiance
  const featuredProb = getFeaturedProbability(radiantStreak, rules);
  const triggeredRadiance = radiantStreak >= (rules.radianceThreshold || 2);
  const wasFeatured = rng() < featuredProb;

  return {
    got5Star: true,
    wasFeatured,
    newPity: 0,
    newGuaranteed: !wasFeatured,
    newRadiantStreak: wasFeatured ? 0 : radiantStreak + 1,
    triggeredRadiance,
  };
}

/**
 * Calculate cumulative probability distribution for getting featured character
 * Returns array of { pulls, probability } for each pull count
 */
export function calculateDistribution(
  startPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  maxPulls: number,
  rules: GachaRules
): Array<{ pulls: number; probability: number }> {
  // Dynamic programming approach
  // State: (pity, guaranteed, radiantStreak) -> probability

  interface State {
    pity: number;
    guaranteed: boolean;
    radiantStreak: number;
  }

  const stateKey = (s: State) => `${s.pity}-${s.guaranteed ? 1 : 0}-${s.radiantStreak}`;

  // Map of state -> probability of being in that state
  let currentStates = new Map<string, number>();
  currentStates.set(stateKey({ pity: startPity, guaranteed: isGuaranteed, radiantStreak }), 1.0);

  let cumulativeProbability = 0;
  const distribution: Array<{ pulls: number; probability: number }> = [];

  for (let pullCount = 1; pullCount <= maxPulls; pullCount++) {
    const nextStates = new Map<string, number>();

    for (const [key, prob] of currentStates) {
      const [pityStr, guaranteedStr, radiantStreakStr] = key.split('-');
      const state = {
        pity: parseInt(pityStr ?? '0'),
        guaranteed: guaranteedStr === '1',
        radiantStreak: parseInt(radiantStreakStr ?? '0'),
      };

      const pullProb = getPullProbability(state.pity, rules);

      // Case 1: Don't get 5-star
      if (pullProb < 1.0) {
        const noStarProb = 1 - pullProb;
        const nextState = {
          pity: state.pity + 1,
          guaranteed: state.guaranteed,
          radiantStreak: state.radiantStreak,
        };
        const nextKey = stateKey(nextState);
        nextStates.set(nextKey, (nextStates.get(nextKey) || 0) + prob * noStarProb);
      }

      // Case 2: Get 5-star
      if (pullProb > 0) {
        if (state.guaranteed) {
          // Got featured character - success!
          cumulativeProbability += prob * pullProb;
        } else {
          // 50/50 or Capturing Radiance
          const featuredProb = getFeaturedProbability(state.radiantStreak, rules);

          // Got featured
          cumulativeProbability += prob * pullProb * featuredProb;

          // Lost 50/50
          const nextState = {
            pity: 0,
            guaranteed: true,
            radiantStreak: state.radiantStreak + 1,
          };
          const nextKey = stateKey(nextState);
          nextStates.set(nextKey, (nextStates.get(nextKey) || 0) + prob * pullProb * (1 - featuredProb));
        }
      }
    }

    distribution.push({
      pulls: pullCount,
      probability: cumulativeProbability,
    });

    currentStates = nextStates;

    // Early exit if we've reached near certainty
    if (cumulativeProbability > 0.9999) break;
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
  rules: GachaRules
): number {
  const distribution = calculateDistribution(startPity, isGuaranteed, radiantStreak, 300, rules);

  for (const point of distribution) {
    if (point.probability >= targetProb) {
      return point.pulls;
    }
  }

  return 300; // Maximum searched
}
