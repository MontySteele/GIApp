/**
 * Error Message Constants
 *
 * User-facing error messages for consistent error handling.
 */

export const ERROR_MESSAGES = {
  // Generic errors
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',

  // Form validation
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_NUMBER: 'Please enter a valid number.',
  VALUE_TOO_LOW: 'Value is too low.',
  VALUE_TOO_HIGH: 'Value is too high.',

  // Character related
  CHARACTER_NOT_FOUND: 'Character not found in your roster.',
  CHARACTER_ALREADY_EXISTS: 'This character is already in your roster.',
  INVALID_LEVEL: 'Level must be between 1 and 90.',
  INVALID_ASCENSION: 'Ascension must be between 0 and 6.',
  INVALID_CONSTELLATION: 'Constellation must be between 0 and 6.',

  // Team related
  TEAM_NOT_FOUND: 'Team not found.',
  TEAM_FULL: 'Teams are limited to four characters.',
  TEAM_EMPTY: 'Please select at least one character for the team.',
  INVALID_TEAM_NAME: 'Team name is required.',

  // Wish/Gacha related
  INVALID_PITY: 'Pity count must be a positive number.',
  INVALID_PULLS: 'Number of pulls must be a positive number.',
  IMPORT_FAILED: 'Failed to import wish data. Please check the format.',

  // Database errors
  DB_SAVE_FAILED: 'Failed to save data. Please try again.',
  DB_LOAD_FAILED: 'Failed to load data. Please refresh the page.',
  DB_DELETE_FAILED: 'Failed to delete data. Please try again.',

  // Import/Export
  EXPORT_FAILED: 'Failed to export data. Please try again.',
  IMPORT_PARSE_ERROR: 'Failed to parse import data. Please check the format.',
  INVALID_BACKUP: 'Invalid backup file format.',

  // External services
  ENKA_FETCH_FAILED: 'Failed to fetch data from Enka.network.',
  ENKA_UID_INVALID: 'Please enter a valid UID (9 digits).',
  ENKA_RATE_LIMITED: 'Rate limited. Please wait a moment before trying again.',
} as const;

export type ErrorMessage = typeof ERROR_MESSAGES[keyof typeof ERROR_MESSAGES];
