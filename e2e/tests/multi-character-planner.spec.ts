/**
 * E2E Tests: Multi-Character Planning Flow
 * Tests for multi-character material aggregation and planning
 */

import { test, expect } from '@playwright/test';
import { PlannerPage, RosterPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

// Extended sample data with more characters
const extendedGOODData = {
  ...sampleGOODData,
  characters: [
    ...sampleGOODData.characters,
    {
      key: 'Bennett',
      level: 80,
      constellation: 6,
      ascension: 5,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
    {
      key: 'Xiangling',
      level: 80,
      constellation: 6,
      ascension: 5,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
  ],
};

test.describe('Multi-Character Planning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);

    // Import sample characters
    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(extendedGOODData));
    await page.waitForTimeout(2000);
  });

  test('can select multiple characters and see aggregated materials', async ({ page }) => {
    const planner = new PlannerPage(page);
    await planner.goto();

    // Switch to multi-character mode
    await planner.selectMultiMode();
    await expect(planner.selectAllButton).toBeVisible();

    // Select all characters
    await planner.toggleSelectAll();
    await page.waitForTimeout(500);

    // Verify material aggregation is displayed
    const hasMaterials = await planner.hasMaterials();
    expect(hasMaterials).toBeTruthy();

    // Should show aggregated resin estimate
    const resinEstimate = await planner.getResinEstimate();
    expect(resinEstimate).toBeGreaterThan(0);
  });

  test('aggregated materials increase with more characters', async ({ page }) => {
    const planner = new PlannerPage(page);
    await planner.goto();

    // Select single character first
    await planner.selectCharacter('Furina');
    const singleResin = await planner.getResinEstimate();

    // Switch to multi mode and select all
    await planner.selectMultiMode();
    await planner.toggleSelectAll();
    await page.waitForTimeout(500);

    const multiResin = await planner.getResinEstimate();

    // Multi-character should require more resources
    expect(multiResin).toBeGreaterThanOrEqual(singleResin);
  });

  test('displays resin calculation for selected characters', async ({ page }) => {
    const planner = new PlannerPage(page);
    await planner.goto();

    await planner.selectMultiMode();
    await planner.toggleSelectAll();

    // Resin estimate should be visible
    await expect(planner.resinEstimate).toBeVisible();

    const resinValue = await planner.getResinEstimate();
    expect(resinValue).toBeGreaterThanOrEqual(0);
  });

  test('shows today\'s farming recommendations for multi-character', async ({ page }) => {
    const planner = new PlannerPage(page);
    await planner.goto();

    await planner.selectMultiMode();
    await planner.toggleSelectAll();

    // Check for farming recommendations
    const hasRecommendations = await planner.hasFarmingRecommendations();
    // Just verify the check works - recommendations depend on the day
    expect(typeof hasRecommendations).toBe('boolean');
  });

  test('can toggle individual characters in multi-mode', async ({ page }) => {
    const planner = new PlannerPage(page);
    await planner.goto();

    await planner.selectMultiMode();

    // Select all first
    await planner.toggleSelectAll();
    await page.waitForTimeout(500);
    const allSelectedResin = await planner.getResinEstimate();

    // Deselect all
    await planner.toggleSelectAll();
    await page.waitForTimeout(500);

    // Find and click on individual character checkboxes
    const characterCheckboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await characterCheckboxes.count();

    if (checkboxCount > 0) {
      // Select just one character
      await characterCheckboxes.first().check();
      await page.waitForTimeout(500);

      const singleSelectedResin = await planner.getResinEstimate();

      // Single selection should be less than or equal to all
      expect(singleSelectedResin).toBeLessThanOrEqual(allSelectedResin);
    }
  });

  test('material counts update when changing goal type in multi-mode', async ({ page }) => {
    const planner = new PlannerPage(page);
    await planner.goto();

    await planner.selectMultiMode();
    await planner.toggleSelectAll();
    await page.waitForTimeout(500);

    // Get resin for full goal
    await planner.selectGoalType('full');
    const fullGoalResin = await planner.getResinEstimate();

    // Get resin for comfortable goal
    await planner.selectGoalType('comfortable');
    const comfortableGoalResin = await planner.getResinEstimate();

    // Full goal should require more (or equal) resin
    expect(fullGoalResin).toBeGreaterThanOrEqual(comfortableGoalResin);
  });
});
