/**
 * Builds Feature
 *
 * Public API for character build templates
 */

// Pages
export { default as BuildTemplatesPage } from './pages/BuildTemplatesPage';

// Components
export { default as BuildTemplateCard } from './components/BuildTemplateCard';

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
