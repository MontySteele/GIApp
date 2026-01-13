/**
 * Team Form Validation Schema
 *
 * Zod schema for validating team creation/editing forms.
 */

import { z } from 'zod';

/**
 * Schema for team form data
 */
export const teamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .max(50, 'Team name cannot exceed 50 characters'),

  characterKeys: z
    .array(z.string().min(1, 'Character key cannot be empty'))
    .min(1, 'At least one character is required')
    .max(4, 'Teams are limited to four characters'),

  tags: z
    .array(z.string().max(30, 'Tag is too long'))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  rotationNotes: z
    .string()
    .max(2000, 'Rotation notes are too long')
    .optional()
    .default(''),
});

/**
 * Schema for tag input (comma-separated string)
 */
export const tagInputSchema = z
  .string()
  .transform((val) =>
    val
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  )
  .pipe(
    z.array(z.string().max(30)).max(10)
  );

export type TeamFormData = z.infer<typeof teamSchema>;

/**
 * Validate team form data
 * Returns { success: true, data } or { success: false, errors }
 */
export function validateTeamForm(data: unknown): {
  success: boolean;
  data?: TeamFormData;
  errors?: z.ZodIssue[];
} {
  const result = teamSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error.issues };
}

/**
 * Parse and validate tag input string
 */
export function parseTagInput(input: string): {
  success: boolean;
  tags?: string[];
  error?: string;
} {
  const result = tagInputSchema.safeParse(input);
  if (result.success) {
    return { success: true, tags: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message };
}
