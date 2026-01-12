/**
 * Farming Schedule Utilities
 *
 * Cross-references material requirements with domain schedules
 * to provide daily farming recommendations
 */

import { DOMAIN_SCHEDULE } from './materialConstants';
import type { MaterialRequirement } from './ascensionCalculator';

// Day name type
export type DayName =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

// Talent book series to days mapping (inverted from DOMAIN_SCHEDULE)
const BOOK_SERIES_SCHEDULE: Record<string, DayName[]> = {};
for (const [series, days] of Object.entries(DOMAIN_SCHEDULE)) {
  BOOK_SERIES_SCHEDULE[series.toLowerCase()] = days as DayName[];
}

// Region grouping for talent materials
export const TALENT_BOOK_REGIONS: Record<string, string[]> = {
  Mondstadt: ['Freedom', 'Resistance', 'Ballad'],
  Liyue: ['Prosperity', 'Diligence', 'Gold'],
  Inazuma: ['Transience', 'Elegance', 'Light'],
  Sumeru: ['Admonition', 'Ingenuity', 'Praxis'],
  Fontaine: ['Equity', 'Justice', 'Order'],
  Natlan: ['Contention', 'Kindling', 'Conflict'],
};

// Reverse lookup: book series to region
const SERIES_TO_REGION: Record<string, string> = {};
for (const [region, series] of Object.entries(TALENT_BOOK_REGIONS)) {
  for (const s of series) {
    SERIES_TO_REGION[s.toLowerCase()] = region;
  }
}

/**
 * Extract talent book series from material name
 * Handles names like "Guide to Freedom", "Philosophies of Diligence", etc.
 */
export function extractBookSeries(materialName: string): string | null {
  const lowerName = materialName.toLowerCase();

  // Try to match known series names
  for (const series of Object.keys(DOMAIN_SCHEDULE)) {
    const lowerSeries = series.toLowerCase();
    if (
      lowerName.includes(lowerSeries) ||
      lowerName.includes(`of ${lowerSeries}`) ||
      lowerName.includes(`to ${lowerSeries}`)
    ) {
      return series;
    }
  }

  return null;
}

/**
 * Get today's day name
 */
export function getTodayName(): DayName {
  const days: DayName[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[new Date().getDay()] ?? 'Sunday';
}

/**
 * Get next available farming day for a material series
 */
export function getNextFarmingDay(series: string, today: DayName): DayName | null {
  const schedule = DOMAIN_SCHEDULE[series];
  if (!schedule) return null;

  // Sunday always has all materials
  if (today === 'Sunday') return 'Sunday';

  // Check if available today
  if (schedule.includes(today)) return today;

  // Find next available day
  const dayOrder: DayName[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const todayIndex = dayOrder.indexOf(today);

  // Check remaining days this week, then wrap to next week
  for (let i = 1; i <= 7; i++) {
    const checkDay = dayOrder[(todayIndex + i) % 7];
    if (checkDay && schedule.includes(checkDay)) {
      return checkDay;
    }
  }

  return null;
}

/**
 * Calculate days until a specific day
 */
export function daysUntil(targetDay: DayName, fromDay: DayName): number {
  const dayOrder: DayName[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const fromIndex = dayOrder.indexOf(fromDay);
  const targetIndex = dayOrder.indexOf(targetDay);

  if (fromIndex === targetIndex) return 0;

  const diff = targetIndex - fromIndex;
  return diff > 0 ? diff : diff + 7;
}

export interface FarmingRecommendation {
  material: MaterialRequirement;
  series: string;
  region: string;
  availableToday: boolean;
  nextAvailableDay: DayName;
  daysUntilAvailable: number;
  priority: 'high' | 'medium' | 'low';
}

export interface FarmingScheduleSummary {
  farmToday: FarmingRecommendation[];
  waitFor: Record<DayName, FarmingRecommendation[]>;
  dayName: DayName;
  totalDeficit: number;
}

/**
 * Analyze talent materials and generate farming recommendations
 */
export function analyzeFarmingSchedule(
  talentMaterials: MaterialRequirement[]
): FarmingScheduleSummary {
  const today = getTodayName();
  const recommendations: FarmingRecommendation[] = [];

  // Filter to only materials with deficits
  const materialsWithDeficit = talentMaterials.filter((m) => m.deficit > 0);

  for (const material of materialsWithDeficit) {
    const series = extractBookSeries(material.name);
    if (!series) continue;

    const region = SERIES_TO_REGION[series.toLowerCase()] ?? 'Unknown';
    const schedule = DOMAIN_SCHEDULE[series];
    const availableToday = today === 'Sunday' || (schedule?.includes(today) ?? false);
    const nextDay = getNextFarmingDay(series, today) ?? today;
    const daysUntil_ = daysUntil(nextDay, today);

    // Priority based on deficit size and tier
    let priority: 'high' | 'medium' | 'low' = 'medium';
    if (material.deficit >= 10 || (material.tier && material.tier >= 3)) {
      priority = 'high';
    } else if (material.deficit <= 3) {
      priority = 'low';
    }

    recommendations.push({
      material,
      series,
      region,
      availableToday,
      nextAvailableDay: nextDay,
      daysUntilAvailable: daysUntil_,
      priority,
    });
  }

  // Separate into today vs wait
  const farmToday = recommendations
    .filter((r) => r.availableToday)
    .sort((a, b) => {
      // Sort by priority then deficit
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.material.deficit - a.material.deficit;
    });

  // Group wait items by day
  const waitFor: Record<DayName, FarmingRecommendation[]> = {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  for (const rec of recommendations.filter((r) => !r.availableToday)) {
    waitFor[rec.nextAvailableDay].push(rec);
  }

  // Sort each day's recommendations
  for (const day of Object.keys(waitFor) as DayName[]) {
    waitFor[day].sort((a, b) => b.material.deficit - a.material.deficit);
  }

  const totalDeficit = materialsWithDeficit.reduce((sum, m) => sum + m.deficit, 0);

  return {
    farmToday,
    waitFor,
    dayName: today,
    totalDeficit,
  };
}

/**
 * Get a friendly summary of what to farm today
 */
export function getFarmingSummary(schedule: FarmingScheduleSummary): string {
  if (schedule.farmToday.length === 0) {
    return 'No talent materials available to farm today.';
  }

  const series = [...new Set(schedule.farmToday.map((r) => r.series))];
  const regions = [...new Set(schedule.farmToday.map((r) => r.region))];

  if (schedule.dayName === 'Sunday') {
    return `All domains available! Focus on: ${series.slice(0, 3).join(', ')}`;
  }

  return `Farm ${series.join(', ')} (${regions.join(', ')}) today.`;
}
