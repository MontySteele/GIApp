/**
 * Builds Feature
 *
 * Public API for character build templates
 */

// Pages
export { default as BuildTemplatesPage } from './pages/BuildTemplatesPage';

// Components
export { default as BuildTemplateCard } from './components/BuildTemplateCard';
export {
  default as BuildGapDisplay,
  analyzeGap,
  type BuildGapAnalysis,
  type GapItem,
} from './components/BuildGapDisplay';
export { default as ApplyTemplateModal } from './components/ApplyTemplateModal';

// Hooks
export {
  useBuildTemplates,
  useCharacterBuildTemplates,
  useBuildTemplate,
  type BuildTemplateQuery,
} from './hooks/useBuildTemplates';

// Repository
export {
  buildTemplateRepo,
  type BuildTemplateFilters,
} from './repo/buildTemplateRepo';
