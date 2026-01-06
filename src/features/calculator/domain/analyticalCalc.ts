import { calculateDistribution, pullsForProbability } from './pityEngine';
import { INCOME_F2P, INCOME_WELKIN, INCOME_WELKIN_BP, PRIMOS_PER_PULL } from '@/lib/constants';
import type { GachaRules } from '@/types';

export interface AnalyticalResult {
  probabilityWithCurrentPulls: number;
  pullsFor50: number;
  pullsFor80: number;
  pullsFor90: number;
  pullsFor99: number;
  distribution: Array<{ pulls: number; cumulativeProbability: number }>;
}

/**
 * Calculate exact probabilities for getting a single target character
 * Uses dynamic programming for precise results
 */
export function calculateSingleTarget(
  currentPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  availablePulls: number,
  rules: GachaRules
): AnalyticalResult {
  // Calculate full distribution
  const distribution = calculateDistribution(
    currentPity,
    isGuaranteed,
    radiantStreak,
    Math.min(availablePulls, 300),
    rules
  );

  // Get probability with current pulls
  const probabilityWithCurrentPulls =
    distribution.find((d) => d.pulls === availablePulls)?.probability ||
    distribution[distribution.length - 1]?.probability ||
    0;

  // Calculate pulls needed for different confidence levels
  const pullsFor50 = pullsForProbability(0.50, currentPity, isGuaranteed, radiantStreak, rules);
  const pullsFor80 = pullsForProbability(0.80, currentPity, isGuaranteed, radiantStreak, rules);
  const pullsFor90 = pullsForProbability(0.90, currentPity, isGuaranteed, radiantStreak, rules);
  const pullsFor99 = pullsForProbability(0.99, currentPity, isGuaranteed, radiantStreak, rules);

  return {
    probabilityWithCurrentPulls,
    pullsFor50,
    pullsFor80,
    pullsFor90,
    pullsFor99,
    distribution: distribution.map((d) => ({
      pulls: d.pulls,
      cumulativeProbability: d.probability,
    })),
  };
}

/**
 * Reverse calculator: find required daily income for target probability
 */
export function calculateRequiredIncome(
  targetCharacters: number,
  targetProbability: number,
  daysAvailable: number,
  currentPity: number,
  isGuaranteed: boolean,
  radiantStreak: number,
  rules: GachaRules,
  currentAvailablePulls: number,
  customDailyPrimogemIncome: number
): {
  requiredPullsPerDay: number;
  requiredPrimosPerDay: number;
  comparedToF2P: number;
  comparedToWelkin: number;
  comparedToWelkinBP: number;
  feasibility: 'easy' | 'possible' | 'difficult' | 'unlikely';
} {
  // Estimate pulls needed (rough approximation for multiple targets)
  const avgPullsPerTarget = pullsForProbability(
    targetProbability,
    currentPity,
    isGuaranteed,
    radiantStreak,
    rules
  );

  const totalPullsNeeded = avgPullsPerTarget * targetCharacters;
  const pullsCoveredByCustomIncome = (customDailyPrimogemIncome * daysAvailable) / PRIMOS_PER_PULL;
  const remainingPullsNeeded = Math.max(totalPullsNeeded - currentAvailablePulls - pullsCoveredByCustomIncome, 0);
  const requiredPullsPerDay = remainingPullsNeeded / daysAvailable;
  const requiredPrimosPerDay = requiredPullsPerDay * PRIMOS_PER_PULL;

  // Compare to benchmarks
  const comparedToF2P = requiredPrimosPerDay / INCOME_F2P;
  const comparedToWelkin = requiredPrimosPerDay / INCOME_WELKIN;
  const comparedToWelkinBP = requiredPrimosPerDay / INCOME_WELKIN_BP;
  const effectiveDailyRequirement = customDailyPrimogemIncome + requiredPrimosPerDay;

  let feasibility: 'easy' | 'possible' | 'difficult' | 'unlikely';
  if (requiredPrimosPerDay <= 0) {
    feasibility = 'easy';
  } else if (effectiveDailyRequirement <= INCOME_F2P) {
    feasibility = 'easy';
  } else if (effectiveDailyRequirement <= INCOME_WELKIN) {
    feasibility = 'possible';
  } else if (effectiveDailyRequirement <= INCOME_WELKIN_BP * 1.5) {
    feasibility = 'difficult';
  } else {
    feasibility = 'unlikely';
  }

  return {
    requiredPullsPerDay,
    requiredPrimosPerDay,
    comparedToF2P,
    comparedToWelkin,
    comparedToWelkinBP,
    feasibility,
  };
}
