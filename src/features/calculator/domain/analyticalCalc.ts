import { calculateDistribution, pullsForProbability } from './pityEngine';
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
  rules: GachaRules
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
  const requiredPullsPerDay = totalPullsNeeded / daysAvailable;
  const requiredPrimosPerDay = requiredPullsPerDay * 160;

  // Compare to benchmarks
  const F2P_INCOME = 60; // primos/day
  const WELKIN_INCOME = 150;
  const WELKIN_BP_INCOME = 170;

  const comparedToF2P = requiredPrimosPerDay / F2P_INCOME;
  const comparedToWelkin = requiredPrimosPerDay / WELKIN_INCOME;
  const comparedToWelkinBP = requiredPrimosPerDay / WELKIN_BP_INCOME;

  let feasibility: 'easy' | 'possible' | 'difficult' | 'unlikely';
  if (requiredPrimosPerDay <= F2P_INCOME) {
    feasibility = 'easy';
  } else if (requiredPrimosPerDay <= WELKIN_INCOME) {
    feasibility = 'possible';
  } else if (requiredPrimosPerDay <= WELKIN_BP_INCOME * 1.5) {
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
