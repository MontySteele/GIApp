/**
 * Ask the browser to keep IndexedDB/localStorage from being evicted.
 * Without this, Safari clears site data after ~7 days without a visit
 * unless the app is installed. Resolves true when storage is persistent.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

/**
 * Remove the runtime cache that older builds used for import API responses,
 * which could hold wish-history authkey URLs.
 */
export async function removeLegacyImportCache(): Promise<void> {
  try {
    if (typeof caches !== 'undefined') {
      await caches.delete('imports-network-first');
    }
  } catch {
    // Cache Storage unavailable: nothing to clean up
  }
}
