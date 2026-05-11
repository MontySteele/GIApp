/**
 * E2E Tests: Campaign Planning Flows
 * Smoke tests for the campaign-centered dashboard loop.
 */

import { expect, type Page, test } from '@playwright/test';
import { waitForAppReady } from '../fixtures/test-data';

const DB_NAME = 'GenshinTracker';
const NOW = '2026-05-11T12:00:00.000Z';
const FUTURE_DEADLINE = '2099-06-01';

type StoreSeed = Record<string, Array<Record<string, unknown>>>;

async function putRecords(page: Page, recordsByStore: StoreSeed): Promise<void> {
  await page.evaluate(async ({ dbName, recordsByStore }) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error(`Unable to open ${dbName}`));
    });

    const storeNames = Object.keys(recordsByStore).filter((storeName) => recordsByStore[storeName].length > 0);
    if (storeNames.length === 0) {
      db.close();
      return;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeNames, 'readwrite');
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Failed to seed IndexedDB'));

        for (const [storeName, records] of Object.entries(recordsByStore)) {
          const store = transaction.objectStore(storeName);
          for (const record of records) {
            store.put(record);
          }
        }
      });
    } finally {
      db.close();
    }
  }, { dbName: DB_NAME, recordsByStore });
}

async function loadSeededApp(page: Page, recordsByStore: StoreSeed): Promise<void> {
  await page.goto('/');
  await waitForAppReady(page);
  await putRecords(page, {
    appMeta: [
      { key: 'schemaVersion', value: 5 },
      { key: 'createdAt', value: NOW },
      { key: 'lastBackupAt', value: NOW },
    ],
    ...recordsByStore,
  });
  await page.reload();
  await waitForAppReady(page);
}

function freshImport() {
  return {
    id: 'import-fresh',
    source: 'GOOD',
    importedAt: NOW,
  };
}

function staleImport() {
  return {
    id: 'import-stale',
    source: 'GOOD',
    importedAt: '2026-04-01T12:00:00.000Z',
  };
}

function pullResourceSnapshot(pulls: number) {
  return {
    id: `snapshot-${pulls}`,
    timestamp: NOW,
    primogems: pulls * 160,
    genesisCrystals: 0,
    intertwined: 0,
    acquaint: 0,
    starglitter: 0,
    stardust: 0,
    createdAt: NOW,
  };
}

function furinaCharacter(overrides: Record<string, unknown> = {}) {
  return {
    id: 'character-furina',
    key: 'Furina',
    level: 90,
    ascension: 6,
    constellation: 0,
    talent: {
      auto: 9,
      skill: 10,
      burst: 10,
    },
    weapon: {
      key: 'Splendor of Tranquil Waters',
      level: 90,
      ascension: 6,
      refinement: 1,
    },
    artifacts: [],
    notes: '',
    priority: 'main',
    teamIds: [],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function pullCampaign() {
  return {
    id: 'campaign-pull-furina',
    type: 'character-acquisition',
    name: 'Pull Furina by deadline',
    status: 'active',
    priority: 1,
    deadline: FUTURE_DEADLINE,
    pullTargets: [
      {
        id: 'pull-furina',
        itemKey: 'Furina',
        itemType: 'character',
        bannerType: 'character',
        desiredCopies: 1,
        expectedStartDate: '2099-05-12',
        expectedEndDate: FUTURE_DEADLINE,
        maxPullBudget: 80,
        isConfirmed: true,
        notes: '',
      },
    ],
    characterTargets: [
      {
        id: 'target-furina',
        characterKey: 'Furina',
        ownership: 'wishlist',
        buildGoal: 'functional',
      },
    ],
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildCampaign() {
  return {
    id: 'campaign-build-furina',
    type: 'character-polish',
    name: 'Build Furina',
    status: 'active',
    priority: 1,
    deadline: FUTURE_DEADLINE,
    pullTargets: [],
    characterTargets: [
      {
        id: 'target-build-furina',
        characterKey: 'Furina',
        ownership: 'owned',
        buildGoal: 'comfortable',
      },
    ],
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function readyReviewCampaign() {
  return {
    id: 'campaign-ready-review',
    type: 'character-polish',
    name: 'Ready Review Campaign',
    status: 'active',
    priority: 1,
    deadline: FUTURE_DEADLINE,
    pullTargets: [],
    characterTargets: [],
    notes: '',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

test.describe('Campaign flow smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('onboarding_completed', 'true');
      window.localStorage.setItem('checklist_dismissed', 'true');
    });
  });

  test('manual dashboard target wizard creates a target without imports', async ({ page }) => {
    await loadSeededApp(page, {});

    await page.getByRole('button', { name: 'Get', exact: true }).click();
    await page.getByLabel('Target character').fill('Furina');
    await page.getByRole('option', { name: /Furina/i }).click();
    await page.getByLabel('Pulls saved').fill('42');
    await page.getByLabel('Current pity').fill('10');
    await page.getByRole('spinbutton', { name: 'Target C' }).fill('1');
    await page.getByRole('button', { name: 'Next' }).click();

    await expect(page.getByRole('heading', { name: 'Get Furina' })).toBeVisible();
    await expect(page.getByText(/more pulls before the banner target/i)).toBeVisible();

    await page.getByRole('link', { name: /create target/i }).nth(1).click();
    await expect(page).toHaveURL(/\/campaigns\?/);
    await expect(page.getByText('Chase C1 Furina')).toBeVisible();

    await page.getByRole('button', { name: /create target/i }).click();
    await expect(page).toHaveURL(/\/campaigns\/.+/);
    await expect(page.getByRole('heading', { name: /Chase C1 Furina/i })).toBeVisible();
  });

  test('pull campaign routes the dashboard action into a campaign-aware calculator', async ({ page }) => {
    await loadSeededApp(page, {
      campaigns: [pullCampaign()],
      importRecords: [freshImport()],
      resourceSnapshots: [pullResourceSnapshot(20)],
    });

    await expect(page.getByRole('heading', { name: "Today's Plan" })).toBeVisible();
    await expect(page.getByText('Save 60 more pulls')).toBeVisible();

    await page.getByRole('link', { name: /open calculator/i }).click();

    await expect(page).toHaveURL(/\/pulls\/calculator\?/);
    await expect(page).toHaveURL(/mode=multi/);
    await expect(page).toHaveURL(/campaign=campaign-pull-furina/);
    await expect(page.getByText('Pull Furina by deadline pull plan loaded')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Campaign Pull Decision' })).toBeVisible();
  });

  test('owned build campaign routes material work into the campaign-aware planner', async ({ page }) => {
    await loadSeededApp(page, {
      campaigns: [buildCampaign()],
      characters: [
        furinaCharacter({
          level: 40,
          ascension: 1,
          talent: { auto: 1, skill: 4, burst: 4 },
          weapon: {
            key: 'Favonius Sword',
            level: 20,
            ascension: 1,
            refinement: 1,
          },
        }),
      ],
      importRecords: [freshImport()],
      materialInventory: [{ id: 'materials', materials: {}, updatedAt: NOW }],
    });

    await expect(page.getByRole('heading', { name: "Today's Plan" })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Farm / })).toBeVisible({ timeout: 15000 });

    await page.getByRole('link', { name: /open materials/i }).click();

    await expect(page).toHaveURL(/\/planner\/materials\?/);
    await expect(page).toHaveURL(/campaign=campaign-build-furina/);
    await expect(page.getByText('Target material plan for Build Furina')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Target Deficits' })).toBeVisible();
  });

  test('stale imports become the next action when one active campaign is otherwise ready', async ({ page }) => {
    await loadSeededApp(page, {
      campaigns: [readyReviewCampaign()],
      importRecords: [staleImport()],
    });

    await expect(page.getByRole('heading', { name: "Today's Plan" })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Refresh account data' })).toBeVisible();
    await expect(page.getByText(/Last GOOD import was \d+ days ago/)).toBeVisible();

    await page.getByRole('link', { name: /refresh import/i }).first().click();

    await expect(page).toHaveURL(/\/roster$/);
    await expect(page.getByRole('dialog', { name: /import from irminsul/i })).toBeVisible();
  });
});
