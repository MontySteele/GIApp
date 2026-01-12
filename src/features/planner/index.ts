/**
 * Planner Feature
 *
 * Public API for character and weapon material planning
 */

// Pages
export { default as PlannerPage } from './pages/PlannerPage';

// Hooks
export { useMaterials } from './hooks/useMaterials';
export { useMultiCharacterPlan, type GoalType } from './hooks/useMultiCharacterPlan';
export { useWeaponPlan } from './hooks/useWeaponPlan';

// Domain - Ascension Calculator
export {
  calculateAscensionSummary,
  calculateAscensionMaterials,
  calculateTalentMaterials,
  calculateExpNeeded,
  getAscensionPhase,
  createGoalFromCharacter,
  createComfortableBuildGoal,
  createFunctionalBuildGoal,
  createNextAscensionGoal,
  type AscensionGoal,
  type AscensionSummary,
  type MaterialRequirement,
  type ResinBreakdown,
} from './domain/ascensionCalculator';

// Domain - Multi-Character Calculator
export {
  calculateMultiCharacterSummary,
  createGoalsFromCharacters,
  calculateFromRoster,
  aggregateMaterialRequirements,
  groupMaterialsByCategory,
  type MultiCharacterGoal,
  type AggregatedMaterialSummary,
  type GroupedMaterials,
} from './domain/multiCharacterCalculator';

// Domain - Resin Calculator
export {
  calculateCurrentResin,
  timeUntilFull,
  formatTime,
  calculateFarmingSummary,
  createTalentBookGoal,
  createBossGoal,
  createWeeklyBossGoal,
  createMoraGoal,
  createExpGoal,
  prioritizeGoals,
  estimateFarmingDays,
  isDomainAvailableToday,
  getNextDomainDay,
  DAILY_RESIN_REGEN,
  DEFAULT_RESIN_BUDGET,
  DOMAIN_SCHEDULE,
  type FarmingGoal,
  type ResinBudget,
  type FarmingSummary,
  type FarmingBreakdown,
} from './domain/resinCalculator';

// Domain - Weapon Calculator
export {
  calculateWeaponAscensionSummary,
  type WeaponAscensionGoal,
  type WeaponAscensionSummary,
} from './domain/weaponCalculator';

// Domain - Deficit Priority
export {
  analyzeDeficitPriority,
  analyzeSimpleDeficitPriority,
  getDeficitRecommendation,
  type MaterialPriority,
  type DeficitPrioritySummary,
} from './domain/deficitPriority';

// Domain - Resin Efficiency
export {
  calculateWeaponDomainEfficiency,
  analyzeResinEfficiency,
  getEfficiencySummary,
  type FarmingActivity,
  type ResinAllocation,
  type ResinEfficiencySummary,
} from './domain/resinEfficiency';

// Domain - Farming Schedule
export {
  extractBookSeries,
  getTodayName,
  getNextFarmingDay,
  daysUntil,
  analyzeFarmingSchedule,
  getFarmingSummary,
  TALENT_BOOK_REGIONS,
  type DayName,
  type FarmingRecommendation,
  type FarmingScheduleSummary,
} from './domain/farmingSchedule';

// Domain - Constants
export {
  CHARACTER_ASCENSION_COSTS,
  TALENT_LEVEL_COSTS,
  EXP_BOOK_VALUES,
  CHARACTER_EXP_REQUIREMENTS,
  RESIN_COSTS,
  DOMAIN_DROPS_PER_RUN,
  MATERIAL_CONVERSION_RATE,
  RESIN_REGEN,
} from './domain/materialConstants';

// Components
export { default as ResinTracker } from './components/ResinTracker';
export { default as DeficitPriorityCard } from './components/DeficitPriorityCard';
export { default as ResinEfficiencyCard } from './components/ResinEfficiencyCard';
export { default as TodaysFarmingRecommendations } from './components/TodaysFarmingRecommendations';
