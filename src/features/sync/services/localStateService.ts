/**
 * Local State Service - localStorage-held product data in backups (D-04)
 *
 * Several features keep product data in localStorage rather than Dexie
 * (wishlist, planner selections, resin budget, weekly boss progress, campaign
 * action states, calculator state, onboarding flags). This module snapshots
 * those entries as raw `{ key, value }` strings for export and writes them
 * back on restore, so the backup needs no schema knowledge of each feature.
 *
 * Only keys in `BACKED_UP_LOCAL_STATE_KEYS` are ever read or written.
 */
import { BACKED_UP_LOCAL_STATE_KEYS, STORAGE_KEYS } from '@/lib/constants/storageKeys';
import type { BackupLocalStateEntry } from '@/lib/validation/backupSchema';
import { useWishlistStore } from '@/stores/wishlistStore';

export type { BackupLocalStateEntry };

export interface LocalStateRestoreStats {
  /** Entries written to localStorage. */
  created: number;
  /** Entries ignored because their key is not in the allowlist. */
  skipped: number;
}

function getStorage(storage?: Storage): Storage | null {
  if (storage) return storage;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    // Accessing localStorage can throw (privacy mode, blocked storage).
    return null;
  }
}

/** Snapshot every allowlisted key that currently has a value. */
export function collectLocalState(storage?: Storage): BackupLocalStateEntry[] {
  const store = getStorage(storage);
  if (!store) return [];

  const entries: BackupLocalStateEntry[] = [];
  for (const key of BACKED_UP_LOCAL_STATE_KEYS) {
    const value = store.getItem(key);
    if (typeof value === 'string') {
      entries.push({ key, value });
    }
  }
  return entries;
}

/**
 * Write allowlisted entries back to localStorage (last-write-wins, regardless
 * of the table merge strategy). Unknown keys are counted as skipped and never
 * written. When the wishlist key is restored the in-memory Zustand store is
 * rehydrated so Targets pick the change up without a reload; other features
 * read localStorage on mount.
 */
export async function restoreLocalState(
  entries: readonly BackupLocalStateEntry[] | undefined,
  storage?: Storage
): Promise<LocalStateRestoreStats> {
  const stats: LocalStateRestoreStats = { created: 0, skipped: 0 };
  if (!entries?.length) return stats;

  const store = getStorage(storage);
  if (!store) {
    stats.skipped = entries.length;
    return stats;
  }

  const allowed = new Set<string>(BACKED_UP_LOCAL_STATE_KEYS);
  let wishlistRestored = false;

  for (const entry of entries) {
    if (!allowed.has(entry.key)) {
      stats.skipped++;
      continue;
    }
    store.setItem(entry.key, entry.value);
    stats.created++;
    if (entry.key === STORAGE_KEYS.WISHLIST) wishlistRestored = true;
  }

  if (wishlistRestored && !storage) {
    try {
      await useWishlistStore.persist.rehydrate();
    } catch {
      // A malformed persisted blob only affects the in-memory copy; the
      // next page load will fall back to the store defaults.
    }
  }

  return stats;
}
