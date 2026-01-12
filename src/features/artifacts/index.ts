/**
 * Artifacts Feature
 *
 * Public API for artifact management and scoring
 */

// Pages
export { default as ArtifactsPage } from './pages/ArtifactsPage';

// Hooks
export { useArtifacts } from './hooks/useArtifacts';

// Repository
export { artifactRepo } from './repo/artifactRepo';

// Domain - Scoring
export {
  calculateCritValue,
  calculateRollEfficiency,
  getGrade,
  scoreInventoryArtifact,
  scoreEquippedArtifact,
  calculateCharacterArtifactScore,
  getGradeColor,
  getGradeBgColor,
  type ArtifactScore,
} from './domain/artifactScoring';

// Domain - Set Recommendations
export {
  getCharacterBuild,
  isRecommendedSet,
  isRecommendedMainStat,
  findCharactersForArtifact,
  calculateCharacterFitScore,
  CHARACTER_BUILDS,
  type CharacterRole,
  type MainStatKey,
  type SlotKey,
  type SetRecommendation,
  type CharacterBuild,
} from './domain/setRecommendations';

// Domain - Constants
export {
  MAX_SUBSTAT_ROLLS,
  normalizeStatKey,
  DPS_SUBSTATS,
  SUPPORT_SUBSTATS,
  BAD_MAIN_STATS_FOR_DPS,
  OBSOLETE_SETS,
  VALUABLE_SETS,
  SLOT_NAMES,
} from './domain/artifactConstants';

// Components
export { default as BuildRecommendations } from './components/BuildRecommendations';
