/**
 * Character Form Validation Schema
 *
 * Zod schema for validating character creation/editing forms.
 */

import { z } from 'zod';

// Character priority enum values
export const CHARACTER_PRIORITIES = ['main', 'secondary', 'bench', 'unbuilt'] as const;

/**
 * Schema for character form data
 */
export const characterSchema = z.object({
  key: z
    .string()
    .min(1, 'Character name is required')
    .max(100, 'Character name is too long'),

  level: z
    .number()
    .int('Level must be a whole number')
    .min(1, 'Level must be at least 1')
    .max(90, 'Level cannot exceed 90'),

  ascension: z
    .number()
    .int('Ascension must be a whole number')
    .min(0, 'Ascension must be at least 0')
    .max(6, 'Ascension cannot exceed 6'),

  constellation: z
    .number()
    .int('Constellation must be a whole number')
    .min(0, 'Constellation must be at least 0')
    .max(6, 'Constellation cannot exceed 6'),

  talentAuto: z
    .number()
    .int('Talent level must be a whole number')
    .min(1, 'Normal Attack level must be at least 1')
    .max(15, 'Normal Attack level cannot exceed 15'),

  talentSkill: z
    .number()
    .int('Talent level must be a whole number')
    .min(1, 'Elemental Skill level must be at least 1')
    .max(15, 'Elemental Skill level cannot exceed 15'),

  talentBurst: z
    .number()
    .int('Talent level must be a whole number')
    .min(1, 'Elemental Burst level must be at least 1')
    .max(15, 'Elemental Burst level cannot exceed 15'),

  weaponKey: z
    .string()
    .min(1, 'Weapon name is required')
    .max(100, 'Weapon name is too long'),

  weaponLevel: z
    .number()
    .int('Weapon level must be a whole number')
    .min(1, 'Weapon level must be at least 1')
    .max(90, 'Weapon level cannot exceed 90'),

  weaponAscension: z
    .number()
    .int('Weapon ascension must be a whole number')
    .min(0, 'Weapon ascension must be at least 0')
    .max(6, 'Weapon ascension cannot exceed 6'),

  weaponRefinement: z
    .number()
    .int('Refinement must be a whole number')
    .min(1, 'Refinement must be at least 1')
    .max(5, 'Refinement cannot exceed 5'),

  priority: z.enum(['main', 'secondary', 'bench', 'unbuilt']),

  notes: z.string().max(2000, 'Notes are too long').optional().default(''),
});

/**
 * Schema for the full character object (including weapon and talents nested)
 */
export const characterObjectSchema = z.object({
  key: z.string().min(1, 'Character name is required'),
  level: z.number().int().min(1).max(90),
  ascension: z.number().int().min(0).max(6),
  constellation: z.number().int().min(0).max(6),
  talent: z.object({
    auto: z.number().int().min(1).max(15),
    skill: z.number().int().min(1).max(15),
    burst: z.number().int().min(1).max(15),
  }),
  weapon: z.object({
    key: z.string().min(1),
    level: z.number().int().min(1).max(90),
    ascension: z.number().int().min(0).max(6),
    refinement: z.number().int().min(1).max(5),
  }),
  artifacts: z.array(z.any()).optional().default([]),
  notes: z.string().optional().default(''),
  priority: z.enum(['main', 'secondary', 'bench', 'unbuilt']),
  teamIds: z.array(z.string()).optional().default([]),
});

export type CharacterFormData = z.infer<typeof characterSchema>;
export type CharacterObjectData = z.infer<typeof characterObjectSchema>;

/**
 * Validate character form data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateCharacterForm(data: unknown): {
  success: boolean;
  data?: CharacterFormData;
  errors?: z.ZodIssue[];
} {
  const result = characterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}
