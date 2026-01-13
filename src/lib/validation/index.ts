/**
 * Validation Schemas
 *
 * Barrel export for all Zod validation schemas.
 */

// Character validation
export {
  characterSchema,
  characterObjectSchema,
  validateCharacterForm,
  CHARACTER_PRIORITIES,
  type CharacterFormData,
  type CharacterObjectData,
} from './characterSchema';

// Team validation
export {
  teamSchema,
  tagInputSchema,
  validateTeamForm,
  parseTagInput,
  type TeamFormData,
} from './teamSchema';

// Build template validation
export {
  buildTemplateFormSchema,
  validateBuildTemplateForm,
  getValidationErrors,
  CHARACTER_ROLES,
  BUILD_DIFFICULTIES,
  BUILD_BUDGETS,
  TALENT_TYPES,
  type BuildTemplateFormData,
} from './buildTemplateSchema';
