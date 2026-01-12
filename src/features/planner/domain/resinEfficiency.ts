/**
 * Resin Efficiency Calculator
 *
 * Compares resin efficiency across different farming activities
 * to help players optimize their daily resin usage
 */

import { RESIN_COSTS, DOMAIN_DROPS_PER_RUN, RESIN_REGEN } from './materialConstants';
import type { MaterialRequirement } from './ascensionCalculator';
import type { GroupedMaterials } from './multiCharacterCalculator';

export interface FarmingActivity {
  name: string;
  type: 'talent' | 'weapon' | 'artifact' | 'boss' | 'weekly' | 'exp' | 'mora';
  resinCost: number;
  description: string;
  dropsPerRun: string;
  efficiencyScore: number;
  relevantDeficit: number;
  runsNeeded: number;
  resinNeeded: number;
  daysNeeded: number;
  isAvailableToday: boolean;
  recommendation: string;
}

export interface ResinAllocation {
  activity: FarmingActivity;
  suggestedRuns: number;
  resinToSpend: number;
  reason: string;
}

export interface ResinEfficiencySummary {
  activities: FarmingActivity[];
  dailyResin: number;
  recommendations: ResinAllocation[];
  optimalActivity: FarmingActivity | null;
  totalResinNeeded: number;
  totalDaysNeeded: number;
}

/**
 * Calculate drops per resin for talent domains
 * Returns "purple equivalent" books per resin
 */
function calculateTalentDomainEfficiency(): number {
  const purpleEquivPerRun =
    DOMAIN_DROPS_PER_RUN.talentBooks.green / 9 +
    DOMAIN_DROPS_PER_RUN.talentBooks.blue / 3 +
    DOMAIN_DROPS_PER_RUN.talentBooks.purple;

  return purpleEquivPerRun / RESIN_COSTS.domainRun;
}

/**
 * Calculate drops per resin for weapon domains
 * Returns "orange (gold) equivalent" materials per resin
 */
export function calculateWeaponDomainEfficiency(): number {
  const orangeEquivPerRun =
    DOMAIN_DROPS_PER_RUN.weaponMats.green / 27 +
    DOMAIN_DROPS_PER_RUN.weaponMats.blue / 9 +
    DOMAIN_DROPS_PER_RUN.weaponMats.purple / 3 +
    DOMAIN_DROPS_PER_RUN.weaponMats.orange;

  return orangeEquivPerRun / RESIN_COSTS.domainRun;
}

/**
 * Calculate talent book deficit in purple equivalent
 */
function calculateTalentDeficit(materials: MaterialRequirement[]): number {
  let purpleEquiv = 0;

  for (const mat of materials) {
    if (mat.deficit <= 0) continue;
    if (mat.category !== 'talent') continue;

    // Convert to purple equivalent based on tier
    const tier = mat.tier ?? 2;
    if (tier === 1) {
      purpleEquiv += mat.deficit / 9;
    } else if (tier === 2) {
      purpleEquiv += mat.deficit / 3;
    } else {
      purpleEquiv += mat.deficit;
    }
  }

  return purpleEquiv;
}

/**
 * Calculate boss material deficit
 */
function calculateBossDeficit(materials: MaterialRequirement[]): number {
  let total = 0;
  for (const mat of materials) {
    if (mat.deficit <= 0) continue;
    if (mat.category === 'boss') {
      total += mat.deficit;
    }
  }
  return total;
}

/**
 * Calculate weekly boss deficit
 */
function calculateWeeklyDeficit(materials: MaterialRequirement[]): number {
  let total = 0;
  for (const mat of materials) {
    if (mat.deficit <= 0) continue;
    if (mat.category === 'weekly') {
      total += mat.deficit;
    }
  }
  return total;
}

/**
 * Calculate EXP deficit in Hero's Wit equivalent
 */
function calculateExpDeficit(materials: MaterialRequirement[]): number {
  let total = 0;
  for (const mat of materials) {
    if (mat.deficit <= 0) continue;
    if (mat.category === 'exp') {
      // Normalize to Hero's Wit (20,000 EXP)
      // Assume name contains tier info or use raw count
      total += mat.deficit;
    }
  }
  return total;
}

/**
 * Calculate Mora deficit
 */
function calculateMoraDeficit(materials: MaterialRequirement[]): number {
  let total = 0;
  for (const mat of materials) {
    if (mat.deficit <= 0) continue;
    if (mat.category === 'mora') {
      total += mat.deficit;
    }
  }
  return total;
}

/**
 * Get today's day name for domain schedule
 */
function getTodayName(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()] ?? 'Sunday';
}

/**
 * Analyze resin efficiency for all farming activities
 */
export function analyzeResinEfficiency(
  groupedMaterials: GroupedMaterials
): ResinEfficiencySummary {
  const today = getTodayName();
  const isSunday = today === 'Sunday';

  const activities: FarmingActivity[] = [];

  // Talent Domain
  const talentDeficit = calculateTalentDeficit(groupedMaterials.talent);
  if (talentDeficit > 0) {
    const purpleEquivPerRun =
      DOMAIN_DROPS_PER_RUN.talentBooks.green / 9 +
      DOMAIN_DROPS_PER_RUN.talentBooks.blue / 3 +
      DOMAIN_DROPS_PER_RUN.talentBooks.purple;

    const runsNeeded = Math.ceil(talentDeficit / purpleEquivPerRun);
    const resinNeeded = runsNeeded * RESIN_COSTS.domainRun;
    const daysNeeded = Math.ceil(resinNeeded / RESIN_REGEN.perDay);

    activities.push({
      name: 'Talent Domain',
      type: 'talent',
      resinCost: RESIN_COSTS.domainRun,
      description: 'Farm talent books for character skills',
      dropsPerRun: `~${DOMAIN_DROPS_PER_RUN.talentBooks.purple.toFixed(1)} purple + ${DOMAIN_DROPS_PER_RUN.talentBooks.blue.toFixed(1)} blue + ${DOMAIN_DROPS_PER_RUN.talentBooks.green.toFixed(1)} green`,
      efficiencyScore: calculateTalentDomainEfficiency() * 100,
      relevantDeficit: Math.ceil(talentDeficit),
      runsNeeded,
      resinNeeded,
      daysNeeded,
      isAvailableToday: true, // Some domain is always available
      recommendation: talentDeficit > 20
        ? 'High priority - significant talent book deficit'
        : 'Standard priority',
    });
  }

  // World Boss
  const bossDeficit = calculateBossDeficit(groupedMaterials.boss);
  if (bossDeficit > 0) {
    const dropsPerRun = 2.5; // Average boss drops
    const runsNeeded = Math.ceil(bossDeficit / dropsPerRun);
    const resinNeeded = runsNeeded * RESIN_COSTS.worldBoss;
    const daysNeeded = Math.ceil(resinNeeded / RESIN_REGEN.perDay);

    activities.push({
      name: 'World Boss',
      type: 'boss',
      resinCost: RESIN_COSTS.worldBoss,
      description: 'Farm boss materials for ascension',
      dropsPerRun: '~2-3 boss materials + gems',
      efficiencyScore: (dropsPerRun / RESIN_COSTS.worldBoss) * 100,
      relevantDeficit: bossDeficit,
      runsNeeded,
      resinNeeded,
      daysNeeded,
      isAvailableToday: true,
      recommendation: bossDeficit > 10
        ? 'High priority - boss materials limit ascension'
        : 'Farm as needed',
    });
  }

  // Weekly Boss
  const weeklyDeficit = calculateWeeklyDeficit(groupedMaterials.weekly);
  if (weeklyDeficit > 0) {
    const dropsPerRun = 2.5; // Average with dream solvent consideration
    const runsNeeded = Math.ceil(weeklyDeficit / dropsPerRun);
    // First 3 weekly bosses cost 30 resin (discounted)
    const resinNeeded = Math.min(runsNeeded, 3) * 30 + Math.max(0, runsNeeded - 3) * 60;
    const daysNeeded = Math.ceil(runsNeeded / 3) * 7; // Weekly reset

    activities.push({
      name: 'Weekly Boss',
      type: 'weekly',
      resinCost: RESIN_COSTS.weeklyBoss,
      description: 'Farm weekly boss for talent materials',
      dropsPerRun: '1-2 talent materials + billets',
      efficiencyScore: (dropsPerRun / RESIN_COSTS.weeklyBoss) * 50, // Lower base efficiency
      relevantDeficit: weeklyDeficit,
      runsNeeded,
      resinNeeded,
      daysNeeded,
      isAvailableToday: true,
      recommendation: 'Do all 3 discounted bosses weekly',
    });
  }

  // EXP Ley Line
  const expDeficit = calculateExpDeficit(groupedMaterials.exp);
  if (expDeficit > 0) {
    const witsPerRun = 4.5; // Average Hero's Wit per run at AR55+
    const runsNeeded = Math.ceil(expDeficit / witsPerRun);
    const resinNeeded = runsNeeded * RESIN_COSTS.leyLine;
    const daysNeeded = Math.ceil(resinNeeded / RESIN_REGEN.perDay);

    activities.push({
      name: 'Blossoms of Revelation',
      type: 'exp',
      resinCost: RESIN_COSTS.leyLine,
      description: 'Farm character EXP materials',
      dropsPerRun: "~4-5 Hero's Wit equivalent",
      efficiencyScore: (witsPerRun / RESIN_COSTS.leyLine) * 80,
      relevantDeficit: expDeficit,
      runsNeeded,
      resinNeeded,
      daysNeeded,
      isAvailableToday: true,
      recommendation: 'Lower priority - can use event rewards',
    });
  }

  // Mora Ley Line
  const moraDeficit = calculateMoraDeficit(groupedMaterials.mora);
  if (moraDeficit > 0) {
    const moraPerRun = 60000; // Average at AR55+
    const runsNeeded = Math.ceil(moraDeficit / moraPerRun);
    const resinNeeded = runsNeeded * RESIN_COSTS.leyLine;
    const daysNeeded = Math.ceil(resinNeeded / RESIN_REGEN.perDay);

    activities.push({
      name: 'Blossoms of Wealth',
      type: 'mora',
      resinCost: RESIN_COSTS.leyLine,
      description: 'Farm Mora',
      dropsPerRun: '~60,000 Mora',
      efficiencyScore: (60000 / RESIN_COSTS.leyLine) * 0.001, // Normalize
      relevantDeficit: moraDeficit,
      runsNeeded,
      resinNeeded,
      daysNeeded,
      isAvailableToday: true,
      recommendation: 'Lower priority - many passive sources',
    });
  }

  // Sort by efficiency score (highest first)
  activities.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

  // Generate recommendations
  const recommendations: ResinAllocation[] = [];
  let remainingDailyResin = RESIN_REGEN.perDay;

  // Prioritize weekly bosses (time-gated)
  const weeklyActivity = activities.find((a) => a.type === 'weekly');
  if (weeklyActivity && weeklyActivity.relevantDeficit > 0) {
    const runs = Math.min(3, weeklyActivity.runsNeeded);
    const resin = runs * 30; // Discounted rate
    recommendations.push({
      activity: weeklyActivity,
      suggestedRuns: runs,
      resinToSpend: resin,
      reason: 'Weekly reset - do discounted bosses first',
    });
    remainingDailyResin -= resin;
  }

  // Then prioritize talent domains (schedule-dependent)
  const talentActivity = activities.find((a) => a.type === 'talent');
  if (talentActivity && talentActivity.relevantDeficit > 0 && remainingDailyResin > 0) {
    const maxRuns = Math.floor(remainingDailyResin / RESIN_COSTS.domainRun);
    const runs = Math.min(maxRuns, talentActivity.runsNeeded);
    if (runs > 0) {
      recommendations.push({
        activity: talentActivity,
        suggestedRuns: runs,
        resinToSpend: runs * RESIN_COSTS.domainRun,
        reason: isSunday ? 'Sunday - all books available!' : 'Time-gated by schedule',
      });
      remainingDailyResin -= runs * RESIN_COSTS.domainRun;
    }
  }

  // Then world bosses if needed
  const bossActivity = activities.find((a) => a.type === 'boss');
  if (bossActivity && bossActivity.relevantDeficit > 0 && remainingDailyResin >= RESIN_COSTS.worldBoss) {
    const maxRuns = Math.floor(remainingDailyResin / RESIN_COSTS.worldBoss);
    const runs = Math.min(maxRuns, bossActivity.runsNeeded);
    if (runs > 0) {
      recommendations.push({
        activity: bossActivity,
        suggestedRuns: runs,
        resinToSpend: runs * RESIN_COSTS.worldBoss,
        reason: 'Boss materials for ascension',
      });
    }
  }

  // Calculate totals
  const totalResinNeeded = activities.reduce((sum, a) => sum + a.resinNeeded, 0);
  const totalDaysNeeded = Math.ceil(totalResinNeeded / RESIN_REGEN.perDay);

  return {
    activities,
    dailyResin: RESIN_REGEN.perDay,
    recommendations,
    optimalActivity: activities[0] ?? null,
    totalResinNeeded,
    totalDaysNeeded,
  };
}

/**
 * Get a simple efficiency summary string
 */
export function getEfficiencySummary(summary: ResinEfficiencySummary): string {
  if (summary.activities.length === 0) {
    return 'No farming needed - all materials collected!';
  }

  const optimal = summary.optimalActivity;
  if (!optimal) return 'Check your material needs.';

  return `Best use of resin: ${optimal.name} (${optimal.resinNeeded} resin, ~${optimal.daysNeeded} days)`;
}
