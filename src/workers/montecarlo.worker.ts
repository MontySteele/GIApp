import { expose } from 'comlink';
import { simulatePull } from '../features/calculator/domain/pityEngine';
import type { BannerType, GachaRules } from '../types';
// Import GACHA_RULES inline to avoid path resolution issues in worker context
const GACHA_RULES: Record<string, GachaRules> = {
  character: {
    version: '5.0+',
    softPityStart: 74,
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: true,
    radianceThreshold: 2,
  },
  weapon: {
    version: '5.0+',
    softPityStart: 63,
    hardPity: 80,
    baseRate: 0.007,
    softPityRateIncrease: 0.07,
    hasCapturingRadiance: false,
    hasFatePoints: true,
    maxFatePoints: 2,
  },
  standard: {
    version: '5.0+',
    softPityStart: 74,
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: false,
  },
  chronicled: {
    version: '5.0+',
    softPityStart: 74,
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: false,
  },
};

export interface SimulationConfig {
  iterations: number;
  seed?: number;
  chunkSize?: number;
}

export interface TargetPityState {
  pity: number | null; // null means inherit from previous target
  guaranteed: boolean | null;
  radiantStreak: number | null;
  fatePoints: number | null;
}

// Extended PlannedBanner for multi-banner support
export interface SimulationTarget {
  id: string;
  characterKey: string;
  expectedStartDate: string;
  expectedEndDate: string;
  priority: 1 | 2 | 3 | 4 | 5;
  maxPullBudget: number | null;
  isConfirmed: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // Extended fields
  bannerType?: BannerType;
  copiesNeeded?: number; // How many copies to get (1 = C0, 7 = C6)
}

export interface SimulationInput {
  targets: SimulationTarget[];
  startingPity: number;
  startingGuaranteed: boolean;
  startingRadiantStreak: number;
  startingFatePoints?: number;
  startingPulls: number;
  incomePerDay: number;
  config: SimulationConfig;
  perTargetStates?: TargetPityState[];
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

// Per-banner pity state tracking
interface BannerPityState {
  pity: number;
  guaranteed: boolean;
  radiantStreak: number;
  fatePoints: number;
}

/**
 * Run Monte Carlo simulation for multi-target planning
 */
export async function runSimulation(
  input: SimulationInput,
  reportProgress?: (progress: number) => void
): Promise<SimulationResult> {
  const {
    targets,
    startingPity,
    startingGuaranteed,
    startingRadiantStreak,
    startingFatePoints = 0,
    startingPulls,
    incomePerDay,
    config,
    perTargetStates,
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
  const chunkSize = Math.max(1, config.chunkSize ?? 1000);

  // Run simulations
  for (let sim = 0; sim < config.iterations; sim++) {
    const rng = config.seed !== undefined ? seededRandom(config.seed + sim) : Math.random;

    // Track pity state separately for each banner type
    const bannerStates: Record<string, BannerPityState> = {
      character: { pity: startingPity, guaranteed: startingGuaranteed, radiantStreak: startingRadiantStreak, fatePoints: 0 },
      weapon: { pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: startingFatePoints },
      standard: { pity: 0, guaranteed: false, radiantStreak: 0, fatePoints: 0 },
    };

    let availablePulls = startingPulls;
    const now = new Date();
    let allMustHavesSucceeded = true;

    for (let targetIndex = 0; targetIndex < sortedTargets.length; targetIndex++) {
      const target = sortedTargets[targetIndex]!;
      const bannerType = target.bannerType || 'character';
      const rules = GACHA_RULES[bannerType];
      if (!rules) continue;

      const targetDate = new Date(target.expectedStartDate);
      const daysUntil = Math.max(0, (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const earnedPulls = Math.floor(daysUntil * incomePerDay);
      availablePulls += earnedPulls;

      // Get current banner state
      let state = bannerStates[bannerType]!;

      // Apply per-target pity overrides if provided (null means inherit from previous)
      const targetState = perTargetStates?.[targetIndex];
      if (targetState) {
        if (targetState.pity !== null) state.pity = targetState.pity;
        if (targetState.guaranteed !== null) state.guaranteed = targetState.guaranteed;
        if (targetState.radiantStreak !== null) state.radiantStreak = targetState.radiantStreak;
        if (targetState.fatePoints !== null) state.fatePoints = targetState.fatePoints;
      }

      const maxBudget = target.maxPullBudget ?? Infinity;
      // Clamp budget to zero - can't use negative pulls
      const budgetForThis = Math.max(0, Math.min(availablePulls, maxBudget));
      const copiesNeeded = target.copiesNeeded || 1;

      let pullsUsed = 0;
      let copiesObtained = 0;

      // Simulate pulling until we get all copies or run out of budget
      while (pullsUsed < budgetForThis && copiesObtained < copiesNeeded) {
        const result = simulatePull(state.pity, state.guaranteed, state.radiantStreak, rules, rng);

        state.pity = result.newPity;
        state.guaranteed = result.newGuaranteed;
        state.radiantStreak = result.newRadiantStreak;
        pullsUsed++;

        if (result.got5Star && result.wasFeatured) {
          copiesObtained++;
        }
      }

      availablePulls -= pullsUsed;

      const stats = characterStats.get(target.characterKey)!;
      if (copiesObtained >= copiesNeeded) {
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

    if ((sim + 1) % chunkSize === 0 || sim === config.iterations - 1) {
      const progressValue = Math.min(1, (sim + 1) / config.iterations);
      if (reportProgress) {
        try {
          await reportProgress(progressValue);
        } catch {
          // Ignore progress callback errors
        }
      }
      // Yield control to keep the worker responsive during long runs
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  // Calculate results
  const perCharacter = sortedTargets.map((target) => {
    const stats = characterStats.get(target.characterKey)!;
    const probability = stats.successes / config.iterations;

    const sortedPulls = stats.totalPullsUsed.sort((a, b) => a - b);
    const medianIndex = Math.floor(sortedPulls.length / 2);
    const medianPullsUsed =
      sortedPulls.length > 0
        ? sortedPulls[medianIndex] ?? 0
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
    let totalPullsAvailable = startingPulls;
    for (let i = 0; i <= index; i++) {
      const prevTarget = sortedTargets[i];
      if (!prevTarget) continue;

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

  const result = {
    perCharacter,
    allMustHavesProbability: allMustHavesSuccesses / config.iterations,
    pullTimeline,
  };

  return result;
}

function ping(): string {
  return 'pong';
}

const workerApi = {
  runSimulation,
  ping,
};

expose(workerApi);
