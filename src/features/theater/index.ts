/**
 * Theater Feature
 *
 * Public API for Imaginarium Theatre season data and readiness planning.
 */

// Pages
export { default as TheaterTab } from './pages/TheaterTab';

// Components
export { default as DifficultyReadinessCard } from './components/DifficultyReadinessCard';
export { default as LevelingPlanPanel } from './components/LevelingPlanPanel';

// Hooks
export { useTheaterReadiness, type UseTheaterReadinessResult } from './hooks/useTheaterReadiness';

// Data
export {
  THEATER_SEASONS,
  getAllSeasons,
  getCurrentSeason,
  getSeasonById,
  type TheaterElement,
  type TheaterSeason,
} from './data/theaterSeasons';
export {
  parseRoleCombat,
  getKeyForAvatarId,
  inferSeasonMonth,
  type ParsedSeasonResult,
  type ParseRoleCombatOptions,
} from './data/parseRoleCombat';

// Domain
export {
  DIFFICULTY_LABELS,
  DIFFICULTY_RULES,
  computeSeasonReadiness,
  countByReason,
  getDifficultyRule,
  type DifficultyReadiness,
  type DifficultyRule,
  type EligibilityReason,
  type EligibleCharacter,
  type NearMissCharacter,
  type SeasonReadiness,
  type TheaterDifficulty,
} from './domain/readiness';
export {
  aggregateLevelingPlan,
  buildLevelingGoal,
  computeLevelingPlan,
  defaultSelection,
  selectLevelingCandidates,
  type LevelingCandidate,
  type LevelingPlan,
} from './domain/levelingPlan';
