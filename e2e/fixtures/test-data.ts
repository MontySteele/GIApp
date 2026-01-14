/**
 * E2E Test Data Fixtures
 * Provides test data and database seeding utilities for E2E tests
 */

import { Page } from '@playwright/test';

/**
 * Sample character data for testing
 */
export const sampleCharacters = {
  furina: {
    name: 'Furina',
    key: 'furina',
    element: 'Hydro',
    weapon: 'Sword',
    rarity: 5,
    level: 90,
    constellation: 2,
    talents: { auto: 6, skill: 9, burst: 10 },
  },
  kazuha: {
    name: 'Kaedehara Kazuha',
    key: 'kazuha',
    element: 'Anemo',
    weapon: 'Sword',
    rarity: 5,
    level: 90,
    constellation: 0,
    talents: { auto: 1, skill: 9, burst: 9 },
  },
  bennett: {
    name: 'Bennett',
    key: 'bennett',
    element: 'Pyro',
    weapon: 'Sword',
    rarity: 4,
    level: 80,
    constellation: 6,
    talents: { auto: 1, skill: 6, burst: 10 },
  },
  xiangling: {
    name: 'Xiangling',
    key: 'xiangling',
    element: 'Pyro',
    weapon: 'Polearm',
    rarity: 4,
    level: 80,
    constellation: 6,
    talents: { auto: 1, skill: 6, burst: 10 },
  },
};

/**
 * Sample team data for testing
 */
export const sampleTeams = {
  national: {
    name: 'National Team',
    members: ['xiangling', 'bennett', 'kazuha', 'furina'],
    tags: ['abyss', 'meta'],
  },
};

/**
 * Sample GOOD format export data
 */
export const sampleGOODData = {
  format: 'GOOD',
  version: 2,
  source: 'GIApp E2E Test',
  characters: [
    {
      key: 'Furina',
      level: 90,
      constellation: 2,
      ascension: 6,
      talent: { auto: 6, skill: 9, burst: 10 },
    },
    {
      key: 'KaedeharaKazuha',
      level: 90,
      constellation: 0,
      ascension: 6,
      talent: { auto: 1, skill: 9, burst: 9 },
    },
  ],
  weapons: [
    {
      key: 'SplendorOfTranquilWaters',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'Furina',
    },
  ],
  artifacts: [],
};

/**
 * Sample Enka.network UID for testing
 * Note: This should be a real UID with public showcase for testing
 */
export const sampleEnkaUID = '123456789';

/**
 * Database name used by the app (matches GenshinTrackerDB in schema.ts)
 */
export const DB_NAME = 'GenshinTracker';

/**
 * Clear IndexedDB databases for clean test state.
 *
 * IMPORTANT: This function should be called BEFORE navigating to the app,
 * ideally in a fresh browser context. Deleting IndexedDB while Dexie.js
 * has active connections will crash the browser tab.
 *
 * Preferred approach: Use browser context isolation (each test gets fresh context)
 * Alternative: Navigate away, clear DB, then navigate back
 */
export async function clearDatabase(page: Page): Promise<void> {
  // Navigate to about:blank first to ensure no Dexie connections are open
  const currentUrl = page.url();
  const wasOnApp = currentUrl.includes('localhost') && !currentUrl.includes('about:blank');

  if (wasOnApp) {
    // Navigate away from the app to close Dexie connections
    await page.goto('about:blank');
    // Wait for navigation to complete
    await page.waitForLoadState('domcontentloaded');
  }

  try {
    await page.evaluate((dbName) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        request.onblocked = () => {
          // Database is blocked by open connections - this shouldn't happen
          // after navigating away, but resolve anyway
          resolve();
        };
      });
    }, DB_NAME);
  } catch {
    // Ignore errors - database might not exist
  }
}

/**
 * Seed the database with sample characters via the app's dev tools
 */
export async function seedCharacters(page: Page): Promise<void> {
  await page.evaluate(async () => {
    // Access the app's dev tools if available
    const devTools = (window as unknown as { devTools?: { seedSampleCharacters: () => Promise<void> } }).devTools;
    if (devTools?.seedSampleCharacters) {
      await devTools.seedSampleCharacters();
    }
  });
}

/**
 * Wait for the app to fully load (IndexedDB ready, initial data loaded)
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Wait for the main content to be visible
  await page.waitForSelector('[data-testid="app-ready"], main', { timeout: 10000 });
  // Wait for any loading skeletons to disappear
  await page.locator('[data-testid="loading-skeleton"], .animate-pulse').first()
    .waitFor({ state: 'hidden', timeout: 5000 })
    .catch(() => {}); // Ignore if no skeleton was ever visible
}

/**
 * Get the current toast notification text
 */
export async function getToastMessage(page: Page): Promise<string | null> {
  const toast = page.locator('[role="alert"]').first();
  if (await toast.isVisible()) {
    return await toast.textContent();
  }
  return null;
}

/**
 * Wait for a toast notification to appear
 */
export async function waitForToast(page: Page, textMatch?: string | RegExp): Promise<void> {
  const toast = page.locator('[role="alert"]');
  await toast.first().waitFor({ state: 'visible', timeout: 5000 });

  if (textMatch) {
    if (typeof textMatch === 'string') {
      await toast.filter({ hasText: textMatch }).first().waitFor({ timeout: 5000 });
    } else {
      await toast.filter({ hasText: textMatch }).first().waitFor({ timeout: 5000 });
    }
  }
}

/**
 * Dismiss any visible toast notifications
 */
export async function dismissToasts(page: Page): Promise<void> {
  const toasts = page.locator('[role="alert"]');
  const count = await toasts.count();

  for (let i = 0; i < count; i++) {
    const closeButton = toasts.nth(i).locator('button');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }
}
