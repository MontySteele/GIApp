import { APP_VERSION, CACHE_PREFIX } from '@/lib/pwa';

const precachePrefix = `${CACHE_PREFIX}-precache`;

async function getMatchingCaches() {
  if (typeof caches === 'undefined') {
    return [];
  }

  const keys = await caches.keys();
  return keys.filter((key) => key.startsWith(CACHE_PREFIX) || key.startsWith(precachePrefix) || key.includes('workbox-precache'));
}

export async function listCaches() {
  const keys = await getMatchingCaches();

  return {
    version: APP_VERSION,
    caches: keys,
  };
}

export async function clearCaches() {
  const keys = await getMatchingCaches();

  await Promise.all(keys.map((key) => caches.delete(key)));

  return keys.length;
}
