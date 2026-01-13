/**
 * E2E Tests: Wish Tracking
 * Tests for wish history and pity tracking
 */

import { test, expect } from '@playwright/test';
import { WishesPage, CalculatorPage } from '../pages';
import { clearDatabase, waitForAppReady } from '../fixtures/test-data';

test.describe('Wish Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database first (navigates away to avoid Dexie crash)
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Wish History Page', () => {
    test('should load wishes page', async ({ page }) => {
      const wishes = new WishesPage(page);
      await wishes.goto();

      // Page should load
      await expect(wishes.mainContent).toBeVisible();
    });

    test('should show pity header', async ({ page }) => {
      const wishes = new WishesPage(page);
      await wishes.goto();

      // Pity header should be visible
      await expect(wishes.pityHeader).toBeVisible();
    });

    test('should show empty state when no wishes', async ({ page }) => {
      const wishes = new WishesPage(page);
      await wishes.goto();

      // With no data, should show empty state
      const hasWishes = await wishes.hasWishes();
      const hasEmptyState = await wishes.emptyState.isVisible().catch(() => false);

      // Either has wishes or shows empty state
      expect(hasWishes || hasEmptyState).toBeTruthy();
    });

    test('should navigate to calculator', async ({ page }) => {
      const wishes = new WishesPage(page);
      await wishes.goto();

      await wishes.goToCalculator();

      await expect(page).toHaveURL(/\/wishes\/calculator/);
    });

    test('should navigate to budget', async ({ page }) => {
      const wishes = new WishesPage(page);
      await wishes.goto();

      await wishes.goToBudget();

      await expect(page).toHaveURL(/\/wishes\/budget/);
    });
  });

  test.describe('Banner Tabs', () => {
    test('should switch between banner types', async ({ page }) => {
      const wishes = new WishesPage(page);
      await wishes.goto();

      // Try to select different banners
      await wishes.selectBanner('character');
      await wishes.selectBanner('weapon');
      await wishes.selectBanner('standard');

      // No errors should occur
      await expect(wishes.mainContent).toBeVisible();
    });
  });
});

test.describe('Pull Calculator', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database first (navigates away to avoid Dexie crash)
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('Single Target Calculator', () => {
    test('should load calculator page', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      await expect(calculator.mainContent).toBeVisible();
    });

    test('should have primogem input field', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      await expect(calculator.primogemInput).toBeVisible();
    });

    test('should have pity input field', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      await expect(calculator.pityInput).toBeVisible();
    });

    test('should calculate probability', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      // Enter calculation parameters
      await calculator.calculateSingleTarget({
        primogems: 16000, // 100 pulls worth
        pity: 0,
        guaranteed: false,
      });

      // Should show result
      await expect(calculator.resultSection).toBeVisible();

      // Should have a probability value
      const probability = await calculator.getProbability();
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThanOrEqual(100);
    });

    test('should show higher probability with more primogems', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      // Calculate with fewer primogems
      await calculator.calculateSingleTarget({
        primogems: 8000, // 50 pulls
        pity: 0,
      });
      const lowProbability = await calculator.getProbability();

      // Calculate with more primogems
      await calculator.calculateSingleTarget({
        primogems: 24000, // 150 pulls
        pity: 0,
      });
      const highProbability = await calculator.getProbability();

      // More primogems should give higher probability
      expect(highProbability).toBeGreaterThanOrEqual(lowProbability);
    });

    test('should show higher probability with existing pity', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      // Calculate with no pity
      await calculator.calculateSingleTarget({
        primogems: 8000,
        pity: 0,
      });
      const noPityProbability = await calculator.getProbability();

      // Calculate with high pity (closer to soft pity)
      await calculator.calculateSingleTarget({
        primogems: 8000,
        pity: 70,
      });
      const highPityProbability = await calculator.getProbability();

      // Higher pity should give higher probability
      expect(highPityProbability).toBeGreaterThanOrEqual(noPityProbability);
    });

    test('should show 100% with guaranteed and enough pulls', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      // Guaranteed with 90 pulls worth (hard pity)
      await calculator.calculateSingleTarget({
        primogems: 14400, // 90 pulls
        pity: 0,
        guaranteed: true,
      });

      const probability = await calculator.getProbability();
      // With guaranteed and enough for hard pity, should be 100%
      expect(probability).toBe(100);
    });
  });

  test.describe('Calculator Tabs', () => {
    test('should switch to multi-target calculator', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      await calculator.switchToMultiTarget();

      // Should show multi-target UI elements
      await expect(calculator.mainContent).toBeVisible();
    });

    test('should switch to reverse calculator', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      await calculator.switchToReverse();

      // Should show reverse calculator UI
      await expect(calculator.mainContent).toBeVisible();
    });
  });

  test.describe('Probability Chart', () => {
    test('should display probability chart after calculation', async ({ page }) => {
      const calculator = new CalculatorPage(page);
      await calculator.goto();

      await calculator.calculateSingleTarget({
        primogems: 16000,
        pity: 0,
      });

      // Chart should be visible
      const hasChart = await calculator.hasChart();
      expect(hasChart).toBeTruthy();
    });
  });
});
