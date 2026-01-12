/**
 * Resin Calculator
 *
 * Calculates resin requirements for farming goals
 * and estimates time to completion
 */

import {
  RESIN_REGEN,
  RESIN_COSTS,
  DOMAIN_DROPS_PER_RUN,
} from './materialConstants';

export interface FarmingGoal {
  id: string;
  type: 'domain' | 'boss' | 'leyline' | 'weekly';
  name: string;
  targetAmount: number;
  currentAmount: number;
  dropsPerRun: number;
  resinCost: number;
}

export interface ResinBudget {
  currentResin: number;
  maxResin: number;
  fragileResin: number;
  condensedResin: number;
  lastUpdated: string;
}

export interface FarmingSummary {
  totalResinNeeded: number;
  runsNeeded: Record<string, number>;
  daysNeeded: number;
  resinPerDay: number;
  canComplete: boolean;
  breakdown: FarmingBreakdown[];
}

export interface FarmingBreakdown {
  goal: FarmingGoal;
  runsNeeded: number;
  resinNeeded: number;
  estimatedDays: number;
}

// Default resin budget
export const DEFAULT_RESIN_BUDGET: ResinBudget = {
  currentResin: 160,
  maxResin: 200,
  fragileResin: 0,
  condensedResin: 0,
  lastUpdated: new Date().toISOString(),
};

// Daily resin regeneration
export const DAILY_RESIN_REGEN = Math.floor(24 * 60 / RESIN_REGEN.minutesPerResin);

/**
 * Calculate current resin based on last update time
 */
export function calculateCurrentResin(budget: ResinBudget): number {
  const now = new Date();
  const lastUpdate = new Date(budget.lastUpdated);
  const minutesElapsed = (now.getTime() - lastUpdate.getTime()) / 60000;
  const resinGained = Math.floor(minutesElapsed / RESIN_REGEN.minutesPerResin);
  return Math.min(budget.maxResin, budget.currentResin + resinGained);
}

/**
 * Calculate time until resin is full
 */
export function timeUntilFull(currentResin: number, maxResin: number): number {
  if (currentResin >= maxResin) return 0;
  const needed = maxResin - currentResin;
  return needed * RESIN_REGEN.minutesPerResin;
}

/**
 * Format time in minutes to readable string
 */
export function formatTime(minutes: number): string {
  if (minutes <= 0) return 'Now';

  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }

  return `${mins}m`;
}

/**
 * Create a talent book farming goal
 */
export function createTalentBookGoal(
  name: string,
  targetBooks: number,
  currentBooks: number,
  tier: 'green' | 'blue' | 'purple'
): FarmingGoal {
  const dropsPerRun = tier === 'purple'
    ? DOMAIN_DROPS_PER_RUN.talentBooks.purple
    : tier === 'blue'
      ? DOMAIN_DROPS_PER_RUN.talentBooks.blue
      : DOMAIN_DROPS_PER_RUN.talentBooks.green;

  return {
    id: `talent-${name}-${tier}`,
    type: 'domain',
    name: `${name} (${tier})`,
    targetAmount: targetBooks,
    currentAmount: currentBooks,
    dropsPerRun,
    resinCost: RESIN_COSTS.domainRun,
  };
}

/**
 * Create a world boss farming goal
 */
export function createBossGoal(
  name: string,
  targetDrops: number,
  currentDrops: number
): FarmingGoal {
  return {
    id: `boss-${name}`,
    type: 'boss',
    name,
    targetAmount: targetDrops,
    currentAmount: currentDrops,
    dropsPerRun: 2.5, // Average drops per world boss run
    resinCost: RESIN_COSTS.worldBoss,
  };
}

/**
 * Create a weekly boss farming goal
 */
export function createWeeklyBossGoal(
  name: string,
  targetDrops: number,
  currentDrops: number
): FarmingGoal {
  return {
    id: `weekly-${name}`,
    type: 'weekly',
    name,
    targetAmount: targetDrops,
    currentAmount: currentDrops,
    dropsPerRun: 1, // Guaranteed 1 selected material per run with dream solvent
    resinCost: RESIN_COSTS.weeklyBoss,
  };
}

/**
 * Create a mora ley line goal
 */
export function createMoraGoal(targetMora: number, currentMora: number): FarmingGoal {
  return {
    id: 'mora-leyline',
    type: 'leyline',
    name: 'Mora (Ley Line)',
    targetAmount: targetMora,
    currentAmount: currentMora,
    dropsPerRun: 60000, // Average mora per ley line
    resinCost: RESIN_COSTS.leyLine,
  };
}

/**
 * Create an EXP book ley line goal
 */
export function createExpGoal(targetExp: number, currentExp: number): FarmingGoal {
  return {
    id: 'exp-leyline',
    type: 'leyline',
    name: "EXP (Ley Line)",
    targetAmount: targetExp,
    currentAmount: currentExp,
    dropsPerRun: 4.5, // Average Hero's Wit per run
    resinCost: RESIN_COSTS.leyLine,
  };
}

/**
 * Calculate runs needed for a goal
 */
export function calculateRunsNeeded(goal: FarmingGoal): number {
  const needed = goal.targetAmount - goal.currentAmount;
  if (needed <= 0) return 0;
  return Math.ceil(needed / goal.dropsPerRun);
}

/**
 * Calculate farming summary for multiple goals
 */
export function calculateFarmingSummary(
  goals: FarmingGoal[],
  budget: ResinBudget,
  dailyResinBudget: number = DAILY_RESIN_REGEN
): FarmingSummary {
  const breakdown: FarmingBreakdown[] = [];
  const runsNeeded: Record<string, number> = {};
  let totalResinNeeded = 0;

  for (const goal of goals) {
    const runs = calculateRunsNeeded(goal);
    const resin = runs * goal.resinCost;

    runsNeeded[goal.id] = runs;
    totalResinNeeded += resin;

    breakdown.push({
      goal,
      runsNeeded: runs,
      resinNeeded: resin,
      estimatedDays: Math.ceil(resin / dailyResinBudget),
    });
  }

  // Calculate available resin from budget
  const currentResin = calculateCurrentResin(budget);
  const totalAvailableResin =
    currentResin +
    budget.fragileResin * RESIN_REGEN.fragileResin +
    budget.condensedResin * 40;

  const daysNeeded = Math.ceil(
    Math.max(0, totalResinNeeded - totalAvailableResin) / dailyResinBudget
  );

  return {
    totalResinNeeded,
    runsNeeded,
    daysNeeded,
    resinPerDay: dailyResinBudget,
    canComplete: totalResinNeeded <= totalAvailableResin,
    breakdown,
  };
}

/**
 * Calculate optimal farming route for mixed goals
 * Prioritizes weekly bosses (time-gated), then domains, then ley lines
 */
export function prioritizeGoals(goals: FarmingGoal[]): FarmingGoal[] {
  const priority: Record<FarmingGoal['type'], number> = {
    weekly: 0,
    boss: 1,
    domain: 2,
    leyline: 3,
  };

  return [...goals].sort((a, b) => {
    // First by type priority
    const typeDiff = priority[a.type] - priority[b.type];
    if (typeDiff !== 0) return typeDiff;

    // Then by efficiency (resin per item needed)
    const effA = a.resinCost / a.dropsPerRun;
    const effB = b.resinCost / b.dropsPerRun;
    return effA - effB;
  });
}

/**
 * Estimate days to farm all materials for a character
 */
export function estimateFarmingDays(
  totalResinNeeded: number,
  dailyResinBudget: number = DAILY_RESIN_REGEN
): number {
  return Math.ceil(totalResinNeeded / dailyResinBudget);
}

/**
 * Common domain schedules (day of week)
 */
export const DOMAIN_SCHEDULE: Record<string, number[]> = {
  // Monday/Thursday/Sunday
  monday: [1, 4, 0],
  // Tuesday/Friday/Sunday
  tuesday: [2, 5, 0],
  // Wednesday/Saturday/Sunday
  wednesday: [3, 6, 0],
};

/**
 * Check if a domain is available today
 */
export function isDomainAvailableToday(schedule: 'monday' | 'tuesday' | 'wednesday'): boolean {
  const today = new Date().getDay();
  return DOMAIN_SCHEDULE[schedule]?.includes(today) ?? false;
}

/**
 * Get next available day for a domain
 */
export function getNextDomainDay(schedule: 'monday' | 'tuesday' | 'wednesday'): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const availableDays = DOMAIN_SCHEDULE[schedule] ?? [];

  // Find next available day
  for (let i = 0; i <= 7; i++) {
    const checkDay = (dayOfWeek + i) % 7;
    if (availableDays.includes(checkDay)) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      return nextDate;
    }
  }

  return today;
}
