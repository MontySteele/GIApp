import type { MergeStrategy } from '../services/importService';

/**
 * User state kept in localStorage rather than IndexedDB. Backups carry these
 * keys so the wishlist, target progress and planner settings survive a device
 * move. Credentials (HoYoLAB cookie, wish authkey) are deliberately excluded.
 */
export const BACKED_UP_LOCAL_STORAGE_KEYS = [
  'genshin-character-wishlist',
  'campaignActionStates:v1',
  'plannerState',
  'resinBudget',
  'weeklyBossState',
  'multi-target-calculator-state',
  'giapp:last-import-summary',
  'giapp-ui-settings',
  'onboarding_completed',
  'onboarding_checklist',
  'checklist_dismissed',
] as const;

const BACKED_UP_KEYS = new Set<string>(BACKED_UP_LOCAL_STORAGE_KEYS);

export function readLocalState(): Record<string, string> {
  const state: Record<string, string> = {};
  try {
    for (const key of BACKED_UP_LOCAL_STORAGE_KEYS) {
      const value = localStorage.getItem(key);
      if (value !== null) state[key] = value;
    }
  } catch {
    // Storage unavailable (private mode, blocked site data): back up nothing
  }
  return state;
}

/**
 * Restore backed-up local state. Unknown keys are ignored, so a crafted
 * backup can't write arbitrary storage. `keep_local` only fills keys that
 * are missing locally. Returns the keys that were written.
 */
export function restoreLocalState(state: unknown, strategy: MergeStrategy): string[] {
  if (!state || typeof state !== 'object') return [];

  const written: string[] = [];
  try {
    for (const [key, value] of Object.entries(state as Record<string, unknown>)) {
      if (!BACKED_UP_KEYS.has(key) || typeof value !== 'string') continue;
      if (strategy === 'keep_local' && localStorage.getItem(key) !== null) continue;
      localStorage.setItem(key, value);
      written.push(key);
    }
  } catch {
    // Storage unavailable: nothing more we can restore
  }
  return written;
}
