import { expose } from 'comlink';
import { simulatePull } from '@/features/calculator/domain/pityEngine';
import type { GachaRules, PlannedBanner } from '@/types';

export interface SimulationConfig {
  iterations: number;
  seed?: number;
}

export interface SimulationInput {
  targets: PlannedBanner[];
  startingPity: number;
  startingGuaranteed: boolean;
  startingRadiantStreak: number;
  startingPulls: number;
  incomePerDay: number;
  rules: GachaRules;
  config: SimulationConfig;
}

export interface SimulationResult {
  perCharacter: Array<{
    characterKey: string;
    probability: number;
    averagePullsUsed: number;
    medianPullsUsed: number;
  }>;
  allMustHavesProbability: number;
  pullTimeline: Array<{
    date: string;
    event: string;
    projectedPulls: number;
  }>;
}

// Seeded RNG for reproducibility
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/**
 * Run Monte Carlo simulation for multi-target planning
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  const {
    targets,
    startingPity,
    startingGuaranteed,
    startingRadiantStreak,
    startingPulls,
    incomePerDay,
    rules,
    config,
  } = input;

  // Sort targets by expected start date
  const sortedTargets = [...targets].sort(
    (a, b) => new Date(a.expectedStartDate).getTime() - new Date(b.expectedStartDate).getTime()
  );

  const characterStats = new Map<
    string,
    {
      successes: number;
      totalPullsUsed: number[];
    }
  >();

  for (const target of sortedTargets) {
    characterStats.set(target.characterKey, {
      successes: 0,
      totalPullsUsed: [],
    });
  }

  let allMustHavesSuccesses = 0;

  // Run simulations
  for (let sim = 0; sim < config.iterations; sim++) {
    const rng = config.seed !== undefined ? seededRandom(config.seed + sim) : Math.random;

    let pity = startingPity;
    let guaranteed = startingGuaranteed;
    let radiantStreak = startingRadiantStreak;
    let availablePulls = startingPulls;

    const now = new Date();
    let allMustHavesSucceeded = true;

    for (const target of sortedTargets) {
      const targetDate = new Date(target.expectedStartDate);
      const daysUntil = Math.max(0, (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const earnedPulls = Math.floor(daysUntil * incomePerDay);
      availablePulls += earnedPulls;

      const maxBudget = target.maxPullBudget ?? Infinity;
      const budgetForThis = Math.min(availablePulls, maxBudget);

      let pullsUsed = 0;
      let gotCharacter = false;

      // Simulate pulling until we get the character or run out of budget
      while (pullsUsed < budgetForThis && !gotCharacter) {
        const result = simulatePull(pity, guaranteed, radiantStreak, rules, rng);

        pity = result.newPity;
        guaranteed = result.newGuaranteed;
        radiantStreak = result.newRadiantStreak;
        pullsUsed++;

        if (result.got5Star && result.wasFeatured) {
          gotCharacter = true;
        }
      }

      availablePulls -= pullsUsed;

      const stats = characterStats.get(target.characterKey)!;
      if (gotCharacter) {
        stats.successes++;
        stats.totalPullsUsed.push(pullsUsed);
      } else {
        stats.totalPullsUsed.push(budgetForThis);
        if (target.priority === 1) {
          allMustHavesSucceeded = false;
        }
      }
    }

    if (allMustHavesSucceeded) {
      allMustHavesSuccesses++;
    }
  }

  // Calculate results
  const perCharacter = sortedTargets.map((target) => {
    const stats = characterStats.get(target.characterKey)!;
    const probability = stats.successes / config.iterations;

    const sortedPulls = stats.totalPullsUsed.sort((a, b) => a - b);
    const medianPullsUsed =
      sortedPulls.length > 0
        ? sortedPulls[Math.floor(sortedPulls.length / 2)]
        : 0;

    const averagePullsUsed =
      stats.totalPullsUsed.reduce((sum, p) => sum + p, 0) / stats.totalPullsUsed.length || 0;

    return {
      characterKey: target.characterKey,
      probability,
      averagePullsUsed,
      medianPullsUsed,
    };
  });

  // Build timeline
  const pullTimeline = sortedTargets.map((target, index) => {
    const targetDate = new Date(target.expectedStartDate);
    const daysUntil = Math.max(0, (targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    const earnedPulls = Math.floor(daysUntil * incomePerDay);

    let totalPullsAvailable = startingPulls;
    for (let i = 0; i <= index; i++) {
      const prevTarget = sortedTargets[i];
      const prevDate = new Date(prevTarget.expectedStartDate);
      const prevDays = Math.max(0, (prevDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      totalPullsAvailable += Math.floor(prevDays * incomePerDay);

      // Subtract average pulls used for previous targets
      if (i < index) {
        const prevStats = perCharacter.find((p) => p.characterKey === prevTarget.characterKey);
        if (prevStats) {
          totalPullsAvailable -= prevStats.averagePullsUsed;
        }
      }
    }

    return {
      date: target.expectedStartDate,
      event: `${target.characterKey} banner`,
      projectedPulls: Math.max(0, Math.floor(totalPullsAvailable)),
    };
  });

  return {
    perCharacter,
    allMustHavesProbability: allMustHavesSuccesses / config.iterations,
    pullTimeline,
  };
}

const workerApi = {
  runSimulation,
};

expose(workerApi);

// Expose functions to main thread
export type { SimulationInput, SimulationResult, SimulationConfig };
