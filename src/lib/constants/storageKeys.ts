/**
 * LocalStorage Key Constants
 *
 * The single source of truth for every localStorage key the app reads or
 * writes (including Zustand `persist` names). `storageKeys.test.ts` scans the
 * source tree and fails if a key is typed inline anywhere else, or if a key
 * listed here has no usage.
 *
 * When adding a key, decide whether it holds product data (belongs in
 * `BACKED_UP_LOCAL_STATE_KEYS`, travels with backups) or device-local
 * preference (stays out of backups but is still wiped by "Reset all data").
 */

export const STORAGE_KEYS = {
  /** Zustand persist name for the character wishlist (drives Targets). */
  WISHLIST: 'genshin-character-wishlist',
  /** Zustand persist name for UI preferences (theme, section defaults, cadence). */
  UI_SETTINGS: 'giapp-ui-settings',
  /** Planner tab/goal selections. */
  PLANNER_STATE: 'plannerState',
  /** Resin budget and last-updated timestamp. */
  RESIN_BUDGET: 'resinBudget',
  /** Weekly boss kill progress for the current reset. */
  WEEKLY_BOSS_STATE: 'weeklyBossState',
  /** Daily campaign action done/skipped/snoozed states. */
  CAMPAIGN_ACTION_STATES: 'campaignActionStates:v1',
  /** Multi-target calculator form state. */
  MULTI_TARGET_CALCULATOR: 'multi-target-calculator-state',
  /** Summary of the most recent roster/wish import. */
  LAST_IMPORT_SUMMARY: 'giapp:last-import-summary',
  /** Dashboard getting-started checklist dismissed flag. */
  CHECKLIST_DISMISSED: 'checklist_dismissed',
  /** Onboarding tour completed flag. */
  ONBOARDING_COMPLETED: 'onboarding_completed',
  /** Onboarding checklist progress. */
  ONBOARDING_CHECKLIST: 'onboarding_checklist',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/**
 * Keys whose values are product data and are included in backups under
 * `localState`, then restored verbatim (only these keys are ever written back).
 * UI preferences are deliberately excluded: they describe a device, not the
 * player's data.
 */
export const BACKED_UP_LOCAL_STATE_KEYS: readonly StorageKey[] = [
  STORAGE_KEYS.WISHLIST,
  STORAGE_KEYS.PLANNER_STATE,
  STORAGE_KEYS.RESIN_BUDGET,
  STORAGE_KEYS.WEEKLY_BOSS_STATE,
  STORAGE_KEYS.CAMPAIGN_ACTION_STATES,
  STORAGE_KEYS.MULTI_TARGET_CALCULATOR,
  STORAGE_KEYS.LAST_IMPORT_SUMMARY,
  STORAGE_KEYS.CHECKLIST_DISMISSED,
  STORAGE_KEYS.ONBOARDING_COMPLETED,
  STORAGE_KEYS.ONBOARDING_CHECKLIST,
];

/** Every key the app owns; "Reset all data" removes all of them. */
export const ALL_APP_STORAGE_KEYS: readonly StorageKey[] = Object.values(STORAGE_KEYS);
