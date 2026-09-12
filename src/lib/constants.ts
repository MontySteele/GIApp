import type { GachaRules } from '@/types';

// Gacha System Constants
export const PRIMOS_PER_PULL = 160;
export const PULLS_PER_PITY = 90; // Hard pity
export const STARGLITTER_PER_4STAR = 2;
export const STARGLITTER_PER_5STAR = 10;
export const STARGLITTER_PER_4STAR_DUPE = 5;
export const STARGLITTER_PER_5STAR_DUPE = 25;
export const PULLS_FROM_STARGLITTER = 5; // Cost in shop

// Character/Weapon max level by ascension phase (0-6)
// Ascension 0: 20, 1: 40, 2: 50, 3: 60, 4: 70, 5: 80, 6: 90
export const MAX_LEVEL_BY_ASCENSION = [20, 40, 50, 60, 70, 80, 90] as const;

// Income benchmarks (approximate primos/day)
export const INCOME_F2P = 60; // Commissions only
export const INCOME_WELKIN = 150; // Commissions + Welkin
export const INCOME_WELKIN_BP = 170; // + Battle Pass amortized
export const INCOME_WITH_EVENTS = 200; // Realistic active player

// Gacha Rules by Banner Type.
// This is the single source of truth; the Monte Carlo worker imports it too.
export const GACHA_RULES: Record<string, GachaRules> = {
  character: {
    version: '5.0+',
    softPityStart: 73, // Pull 74 is first soft pity (pity = 73)
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: true,
    radianceThreshold: 3,
    featuredRate: 0.5,
  },
  weapon: {
    version: '5.0+',
    softPityStart: 62, // Pull 63 is first soft pity (pity = 62)
    hardPity: 80,
    baseRate: 0.007,
    softPityRateIncrease: 0.07, // Ramp reaches 100% at pull 77, before the formal hard pity of 80
    hasCapturingRadiance: false,
    featuredRate: 0.75,
    chartedShare: 0.5,
    hasFatePoints: true,
    maxFatePoints: 1, // Epitomized Path: 1 fate point since Version 5.0
  },
  standard: {
    version: '1.0+',
    softPityStart: 73, // Pull 74 is first soft pity (pity = 73)
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: false,
    featuredRate: 1, // No rate-up on the standard banner: a "target" here means any 5★
  },
  chronicled: {
    version: '4.5+',
    softPityStart: 73, // Pull 74 is first soft pity (pity = 73)
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: false,
    featuredRate: 0.5,
  },
};

/** Worst-case pulls to obtain one copy from a fresh state (lose the 50/50 or 75/25 and hit hard pity twice). */
export const WORST_CASE_PULLS_PER_COPY: Record<'character' | 'weapon' | 'standard' | 'chronicled', number> = {
  character: 180,
  weapon: 160,
  standard: 90,
  chronicled: 180,
};

// App Navigation
export const TABS = [
  { id: 'dashboard', label: 'Dashboard', path: '/' },
  { id: 'campaigns', label: 'Targets', path: '/campaigns' },
  { id: 'roster', label: 'Roster', path: '/roster' },
  { id: 'pulls', label: 'Pulls', path: '/pulls' },
  { id: 'settings', label: 'Settings', path: '/settings' },
] as const;

// App Metadata
export { SCHEMA_VERSION as APP_SCHEMA_VERSION } from '@/db/schemaVersion';
export const BACKUP_REMINDER_DAYS = 7;
