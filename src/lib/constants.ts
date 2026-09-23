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

// Income benchmarks (approximate primos/day, averaged over a 42-day patch).
// F2P counts commissions (60), Abyss, Imaginarium Theater, events, codes and
// Stardust shop fates, but not one-off exploration rewards.
export const INCOME_F2P = 210;
export const INCOME_WELKIN = INCOME_F2P + 90;
// Gnostic Hymn: 680 primos + 4 fates (640) per ~42-day season
export const INCOME_WELKIN_BP = INCOME_WELKIN + 31;

// Gacha Rules by Banner Type
export const GACHA_RULES: Record<string, GachaRules> = {
  character: {
    version: '5.0+',
    softPityStart: 73, // Pull 74 is first soft pity (pity = 73)
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: true,
    radianceThreshold: 3,
  },
  weapon: {
    version: '5.0+',
    softPityStart: 62, // Pull 63 is first soft pity (pity = 62)
    hardPity: 77,
    baseRate: 0.007,
    softPityRateIncrease: 0.07,
    hasCapturingRadiance: false,
    hasFatePoints: true,
    maxFatePoints: 1, // Epitomized Path needs 1 point since 5.0
  },
  standard: {
    version: '1.0+',
    softPityStart: 73, // Pull 74 is first soft pity (pity = 73)
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: false,
  },
  chronicled: {
    version: '4.5+',
    softPityStart: 73, // Pull 74 is first soft pity (pity = 73)
    hardPity: 90,
    baseRate: 0.006,
    softPityRateIncrease: 0.06,
    hasCapturingRadiance: false,
  },
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
export const APP_SCHEMA_VERSION = 5;
export const BACKUP_REMINDER_DAYS = 7;
