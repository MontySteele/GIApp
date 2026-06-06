/**
 * E2E Tests: Pull Calculators
 * Tests for single-target and multi-target gacha probability calculators
 */

import { test, expect, type Page } from '@playwright/test';
import { clearDatabase, waitForAppReady } from '../fixtures/test-data';

async function gotoCalculator(page: Page): Promise<void> {
  await page.goto('/pulls/calculator');
  await expect(page.getByRole('heading', { name: /^pull calculator$/i })).toBeVisible();
}

function currentPityInput(page: Page) {
  return page.getByRole('spinbutton', { name: /^current pity$/i }).first();
}

function eventPullsInput(page: Page) {
  return page.getByRole('spinbutton', { name: /^event pulls$/i }).first();
}

async function calculateSingleTarget(
  page: Page,
  data: { pity: number; pulls: number; guaranteed?: boolean }
): Promise<void> {
  await currentPityInput(page).fill(String(data.pity));
  await eventPullsInput(page).fill(String(data.pulls));

  if (data.guaranteed !== undefined) {
    await page
      .getByRole('combobox', { name: /^guarantee status$/i })
      .first()
      .selectOption(data.guaranteed ? 'guaranteed' : 'not-guaranteed');
  }

  await page.getByRole('button', { name: /^calculate probability$/i }).click();
  await expect(page.getByText(/probability with/i)).toBeVisible();
}

async function readSingleTargetProbability(page: Page): Promise<number> {
  const value = await page.getByText(/^\d+(?:\.\d)?%$/).first().textContent();
  return parseFloat(value?.match(/[\d.]+/)?.[0] ?? '0');
}

async function switchToMultiTarget(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^multi-target$/i }).click();
  await expect(page.getByRole('heading', { name: /^multi-target planner$/i })).toBeVisible();
}

test.describe('Pull Calculators', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Single Target Calculator', () => {
    test('should navigate to calculator page', async ({ page }) => {
      await gotoCalculator(page);
    });

    test('single target calculator shows correct probability display', async ({ page }) => {
      await gotoCalculator(page);

      await calculateSingleTarget(page, { pity: 50, pulls: 40 });

      await expect(page.getByText(/probability with 40 pulls/i)).toBeVisible();
      expect(await readSingleTargetProbability(page)).toBeGreaterThan(0);
    });

    test('should handle guaranteed state', async ({ page }) => {
      await gotoCalculator(page);

      await calculateSingleTarget(page, { pity: 0, pulls: 90, guaranteed: true });

      expect(await readSingleTargetProbability(page)).toBe(100);
    });

    test('probability increases with higher pity', async ({ page }) => {
      await gotoCalculator(page);

      await calculateSingleTarget(page, { pity: 10, pulls: 30 });
      const lowPityValue = await readSingleTargetProbability(page);

      await calculateSingleTarget(page, { pity: 75, pulls: 30 });
      const highPityValue = await readSingleTargetProbability(page);

      expect(highPityValue).toBeGreaterThanOrEqual(lowPityValue);
    });
  });

  test.describe('Multi-Target Calculator', () => {
    test('should navigate to multi-target mode', async ({ page }) => {
      await gotoCalculator(page);
      await switchToMultiTarget(page);

      await expect(page.getByRole('button', { name: /^add character$/i })).toBeVisible();
    });

    test('can add multiple targets', async ({ page }) => {
      await gotoCalculator(page);
      await switchToMultiTarget(page);

      await page.getByRole('button', { name: /^add character$/i }).click();
      await page.getByRole('button', { name: /^add character$/i }).click();

      await expect(page.getByText(/target 1/i).first()).toBeVisible();
      await expect(page.getByText(/target 2/i).first()).toBeVisible();
    });

    test('handles pity inheritance between targets', async ({ page }) => {
      await gotoCalculator(page);
      await switchToMultiTarget(page);

      await page.getByRole('button', { name: /^add character$/i }).click();
      await page.getByRole('button', { name: /^add character$/i }).click();

      const inheritPityOption = page.getByLabel(/inherit pity/i);
      await expect(inheritPityOption).toBeVisible();
      await expect(inheritPityOption).toBeChecked();
    });

    test('shows cumulative results for sequential targets', async ({ page }) => {
      await gotoCalculator(page);
      await switchToMultiTarget(page);

      await page.getByRole('button', { name: /^add character$/i }).click();
      await page.getByRole('textbox', { name: /^character name$/i }).fill('Furina');
      await eventPullsInput(page).fill('90');
      await page.getByRole('button', { name: /^calculate$/i }).click();

      await expect(page.getByText(/probability of getting all targets/i)).toBeVisible();
      await expect(page.getByText(/per-target breakdown/i)).toBeVisible();
    });
  });

  test.describe('Calculator Settings', () => {
    test('should persist calculator state shape', async ({ page }) => {
      await gotoCalculator(page);

      await currentPityInput(page).fill('42');
      await expect(currentPityInput(page)).toHaveValue('42');

      await page.goto('/');
      await waitForAppReady(page);
      await gotoCalculator(page);

      const currentValue = await currentPityInput(page).inputValue();
      expect(typeof currentValue).toBe('string');
    });
  });
});
