/**
 * Build Template Form Validation Schema
 *
 * Zod schema for validating build template creation/editing forms.
 */

import { z } from 'zod';

// Role options
export const CHARACTER_ROLES = ['dps', 'sub-dps', 'support', 'healer', 'shielder'] as const;

// Difficulty levels
export const BUILD_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

// Budget categories
export const BUILD_BUDGETS = ['f2p', '4-star', 'mixed', 'whale'] as const;

// Talent priority order
export const TALENT_TYPES = ['auto', 'skill', 'burst'] as const;

/**
 * Schema for internal form data (simplified types for form handling)
 */
export const buildTemplateFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name is too long'),

  characterKey: z
    .string()
    .min(1, 'Character is required')
    .max(100, 'Character name is too long'),

  description: z
    .string()
    .max(500, 'Description is too long')
    .optional()
    .default(''),

  role: z.enum(['dps', 'sub-dps', 'support', 'healer', 'shielder']),

  notes: z
    .string()
    .max(5000, 'Notes are too long')
    .optional()
    .default(''),

  weapons: z.object({
    primary: z.array(z.string()).default([]),
    alternatives: z.array(z.string()).default([]),
  }),

  artifacts: z.object({
    sets: z.array(z.string()).max(3, 'Maximum 3 artifact sets').default([]),
    mainStats: z.object({
      sands: z.array(z.string()).default([]),
      goblet: z.array(z.string()).default([]),
      circlet: z.array(z.string()).default([]),
    }),
    substats: z.array(z.string()).default([]),
  }),

  leveling: z.object({
    targetLevel: z
      .number()
      .int()
      .min(1, 'Target level must be at least 1')
      .max(90, 'Target level cannot exceed 90')
      .default(90),
    targetAscension: z
      .number()
      .int()
      .min(0, 'Target ascension must be at least 0')
      .max(6, 'Target ascension cannot exceed 6')
      .default(6),
    talentPriority: z
      .array(z.enum(['auto', 'skill', 'burst']))
      .max(3)
      .default(['burst', 'skill', 'auto']),
  }),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),

  budget: z.enum(['f2p', '4-star', 'mixed', 'whale']).default('mixed'),

  source: z.string().max(200, 'Source is too long').optional().default(''),

  isOfficial: z.boolean().default(false),

  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags').default([]),

  gameVersion: z.string().max(20).optional().default(''),
});

export type BuildTemplateFormData = z.infer<typeof buildTemplateFormSchema>;

/**
 * Validate build template form data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateBuildTemplateForm(data: unknown): {
  success: boolean;
  data?: BuildTemplateFormData;
  errors?: z.ZodIssue[];
} {
  const result = buildTemplateFormSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

/**
 * Get error messages from validation result as a flat object
 */
export function getValidationErrors(errors: z.ZodIssue[]): Record<string, string> {
  const errorMap: Record<string, string> = {};
  for (const error of errors) {
    const path = error.path.join('.');
    errorMap[path] = error.message;
  }
  return errorMap;
}
