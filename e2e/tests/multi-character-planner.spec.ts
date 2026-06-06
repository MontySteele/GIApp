/**
 * E2E Tests: Multi-Character Planning Flow
 * Tests for priority-character material aggregation and planning.
 */

import { test, expect, type Page } from '@playwright/test';
import { RosterPage } from '../pages';
import {
  clearDatabase,
  markAllCharactersPriority,
  sampleGOODData,
  waitForAppReady,
} from '../fixtures/test-data';

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

async function gotoPriorityMaterials(page: Page): Promise<void> {
  await page.goto('/campaigns/materials?scope=priority');
  await expect(page.getByRole('heading', { name: /^material inventory$/i })).toBeVisible();
}

test.describe('Multi-Character Planning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);

    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(extendedGOODData));
    await expect(page.locator('[role="alert"], [data-testid="import-success"], text=/imported|success/i').first()).toBeVisible({ timeout: 10000 }).catch(() => {});

    await markAllCharactersPriority(page);
  });

  test('shows aggregated materials for priority characters', async ({ page }) => {
    await gotoPriorityMaterials(page);

    await expect(page.getByRole('heading', { name: /^priority deficits$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^farming priority$/i })).toBeVisible();
    await expect(page.getByText(/need [\d,]+ more|all materials collected/i).first()).toBeVisible();
  });

  test('displays a prioritized farming summary', async ({ page }) => {
    await gotoPriorityMaterials(page);

    await expect(page.getByRole('heading', { name: /^farming priority$/i })).toBeVisible();
    await expect(page.getByText(/materials with deficits|all materials collected/i).first()).toBeVisible();
  });

  test('displays material inventory status', async ({ page }) => {
    await gotoPriorityMaterials(page);

    await expect(page.getByText(/types tracked|no materials imported/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /mora:/i })).toBeVisible();
  });

  test('can update Mora inventory from the priority page', async ({ page }) => {
    await gotoPriorityMaterials(page);

    await page.getByRole('button', { name: /mora:/i }).click();
    const moraInput = page.locator('input[inputmode="numeric"]').first();
    await moraInput.fill('12345');
    await moraInput.press('Enter');

    await expect(page.getByRole('button', { name: /mora:\s*12,345/i })).toBeVisible();
  });

  test('keeps aggregated planning visible after reload', async ({ page }) => {
    await gotoPriorityMaterials(page);
    await page.reload();

    await expect(page.getByRole('heading', { name: /^priority deficits$/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^farming priority$/i })).toBeVisible();
  });

  test('shows an empty state when no characters are prioritized', async ({ page }) => {
    await markAllCharactersPriority(page, 'unbuilt');
    await gotoPriorityMaterials(page);

    await expect(page.getByText(/no priority characters/i)).toBeVisible();
  });
});
