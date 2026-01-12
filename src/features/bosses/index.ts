/**
 * Bosses Feature
 *
 * Public API for weekly boss tracking
 */

// Components
export { default as WeeklyBossTracker } from './components/WeeklyBossTracker';

// Domain
export {
  WEEKLY_BOSSES,
  WEEKLY_BOSS_MAP,
  DISCOUNTED_RESIN_COST,
  REGULAR_RESIN_COST,
  MAX_DISCOUNTED_CLAIMS,
  getNextWeeklyReset,
  getCurrentWeekStart,
  formatTimeUntilReset,
  type WeeklyBoss,
} from './domain/weeklyBossData';
