/**
 * LocalStorage Key Constants
 *
 * Centralized constants for all localStorage keys used in the application.
 * Using constants prevents typos and makes it easier to track storage usage.
 */

export const STORAGE_KEYS = {
  // Theme and UI preferences
  THEME: 'gi-tracker-theme',

  // Weekly boss tracker
  WEEKLY_BOSS_STATE: 'weeklyBossState',

  // Calculator state
  MULTI_TARGET_CALCULATOR: 'multi-target-calculator-state',
  CALCULATOR_SCENARIOS: 'calculator-scenarios',

  // Resource tracking
  RESIN_BUDGET: 'resinBudget',
  PRIMOGEM_RATE_WINDOW: 'primogem-rate-window',

  // App preferences
  BACKUP_REMINDER: 'backup-reminder-last',
  SIDEBAR_COLLAPSED: 'sidebar-collapsed',

  // Enka integration
  ENKA_UID: 'enka-uid',
  ENKA_LAST_SYNC: 'enka-last-sync',
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
