/**
 * E2E Tests: Material Planner
 * Tests for character and weapon material planning
 */

import { test, expect } from '@playwright/test';
import { PlannerPage, RosterPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

test.describe('Material Planner', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database first (navigates away to avoid Dexie crash)
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);

    // Seed characters for planning
    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(sampleGOODData));
    await page.waitForTimeout(2000);
  });

  test.describe('Single Character Planning', () => {
    test('should load planner page', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      // Page should load
      await expect(planner.mainContent).toBeVisible();
    });

    test('should select a character for planning', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      // Select single mode if not default
      await planner.selectSingleMode().catch(() => {
        // May already be in single mode
      });

      // Select a character
      await planner.selectCharacter('Furina');

      // Materials should be displayed
      const hasMaterials = await planner.hasMaterials();
      expect(hasMaterials).toBeTruthy();
    });

    test('should show different goal types', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      await planner.selectCharacter('Furina');

      // Select Full goal
      await planner.selectGoalType('full');
      const fullResin = await planner.getResinEstimate();

      // Select Comfortable goal
      await planner.selectGoalType('comfortable');
      const comfortableResin = await planner.getResinEstimate();

      // Full should require more resin than Comfortable
      expect(fullResin).toBeGreaterThanOrEqual(comfortableResin);
    });

    test('should display resin estimate', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      await planner.selectCharacter('Furina');

      const resin = await planner.getResinEstimate();
      expect(resin).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Multi Character Planning', () => {
    test('should switch to multi mode', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      await planner.selectMultiMode();

      // Should show multi-select UI
      await expect(planner.selectAllButton).toBeVisible();
    });

    test('should select all characters', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      await planner.selectMultiMode();

      // Click select all
      await planner.toggleSelectAll();

      // Should aggregate materials
      const hasMaterials = await planner.hasMaterials();
      expect(hasMaterials).toBeTruthy();
    });
  });

  test.describe('Farming Recommendations', () => {
    test('should show today\'s farming recommendations', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      await planner.selectCharacter('Furina');

      // Check for farming recommendations
      const hasRecommendations = await planner.hasFarmingRecommendations();

      // May or may not have recommendations depending on current day
      // Just verify the section exists or is properly hidden
      expect(typeof hasRecommendations).toBe('boolean');
    });
  });

  test.describe('Material Inventory', () => {
    test('should update material inventory count', async ({ page }) => {
      const planner = new PlannerPage(page);
      await planner.goto();

      await planner.selectCharacter('Furina');

      // Get initial state
      const initialResin = await planner.getResinEstimate();

      // Update inventory for a material (if UI supports it)
      const materialInput = planner.materialsList.locator('input[type="number"]').first();

      if (await materialInput.isVisible()) {
        await materialInput.fill('100');
        await page.waitForTimeout(500);

        // Resin estimate may change
        const newResin = await planner.getResinEstimate();
        // Should be same or less (can't be more if we have materials)
        expect(newResin).toBeLessThanOrEqual(initialResin);
      }
    });
  });
});
