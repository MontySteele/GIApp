/**
 * Storage Health - durable storage and full reset (D-05, D-15)
 *
 * - `requestPersistentStorage` asks the browser to exempt this origin from
 *   storage eviction (Safari evicts script-writable storage after 7 days
 *   without interaction). The result is memoized: browsers answer the same
 *   for the lifetime of the page and repeated prompts are annoying.
 * - `getStorageEstimate` surfaces usage/quota for the settings UI.
 * - `resetAllLocalData` deletes the Dexie database and every app-owned
 *   localStorage key, then reloads so the app boots fresh.
 */
import Dexie from 'dexie';
import { db } from '@/db/schema';
import { ALL_APP_STORAGE_KEYS } from '@/lib/constants/storageKeys';

export interface StorageEstimate {
  /** Bytes currently used by this origin. */
  usage: number;
  /** Bytes the browser is willing to grant this origin. */
  quota: number;
  /** Whether the origin's storage is protected from automatic eviction. */
  persisted: boolean;
}

function getStorageManager(): StorageManager | null {
  if (typeof navigator === 'undefined') return null;
  const manager = (navigator as Navigator & { storage?: StorageManager }).storage;
  return manager ?? null;
}

let persistRequest: Promise<boolean> | null = null;

/**
 * Request persistent storage once. Resolves `true` when the origin is (now or
 * already) persisted, `false` when denied or unsupported. Never throws.
 */
export function requestPersistentStorage(): Promise<boolean> {
  if (persistRequest) return persistRequest;

  persistRequest = (async () => {
    const manager = getStorageManager();
    if (!manager || typeof manager.persist !== 'function') return false;
    try {
      if (typeof manager.persisted === 'function' && (await manager.persisted())) {
        return true;
      }
      return await manager.persist();
    } catch {
      return false;
    }
  })();

  // A rejected/false answer caused by a transient error should not be sticky.
  persistRequest.then((granted) => {
    if (!granted && getStorageManager() === null) persistRequest = null;
  });

  return persistRequest;
}

/**
 * Fire-and-forget wrapper for call sites that should never fail because of
 * storage permissions (app shell, after a successful import or backup).
 */
export function ensurePersistentStorage(): void {
  void requestPersistentStorage().catch(() => false);
}

/** Usage/quota/persisted snapshot, or `null` when the API is unavailable. */
export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  const manager = getStorageManager();
  if (!manager || typeof manager.estimate !== 'function') return null;

  try {
    const [estimate, persisted] = await Promise.all([
      manager.estimate(),
      typeof manager.persisted === 'function' ? manager.persisted().catch(() => false) : Promise.resolve(false),
    ]);
    return {
      usage: estimate.usage ?? 0,
      quota: estimate.quota ?? 0,
      persisted,
    };
  } catch {
    return null;
  }
}

/** Remove every app-owned localStorage key (never touches keys we do not own). */
export function clearAppLocalStorage(storage?: Storage): void {
  let store: Storage | null = storage ?? null;
  if (!store) {
    try {
      store = typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
      store = null;
    }
  }
  if (!store) return;

  for (const key of ALL_APP_STORAGE_KEYS) {
    store.removeItem(key);
  }
}

export interface ResetAllLocalDataOptions {
  /** Injectable for tests; defaults to a full page reload. */
  reload?: () => void;
  /** Injectable for tests; defaults to `localStorage`. */
  storage?: Storage;
}

/**
 * Delete the Dexie database and all app localStorage, then reload. The DB is
 * closed first so the delete is not blocked by our own connection.
 */
export async function resetAllLocalData(options: ResetAllLocalDataOptions = {}): Promise<void> {
  const reload = options.reload ?? (() => window.location.reload());

  db.close();
  await Dexie.delete(db.name);
  clearAppLocalStorage(options.storage);
  reload();
}

/** Human-readable byte count for the settings card. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value >= 100 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

export const __testUtils = {
  resetPersistMemo() {
    persistRequest = null;
  },
};
