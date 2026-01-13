/**
 * E2E Tests: Character CRUD Operations
 * Tests for creating, reading, updating, and deleting characters
 */

import { test, expect } from '@playwright/test';
import { RosterPage, DashboardPage } from '../pages';
import { clearDatabase, waitForAppReady } from '../fixtures/test-data';

test.describe('Character CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database for clean state
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();
    await waitForAppReady(page);
  });

  test.describe('Create Character (Manual)', () => {
    test('should add a character via manual entry', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Initial count
      const initialCount = await roster.getCharacterCount();

      // Open add character modal
      await roster.openAddCharacterModal();

      // Select manual entry
      await roster.selectImportMethod('manual');

      // Fill the form
      await roster.fillManualCharacterForm({
        name: 'Furina',
        level: 90,
        constellation: 2,
        talents: { auto: 6, skill: 9, burst: 10 },
      });

      // Submit
      await roster.submitCharacterForm();

      // Wait for toast or modal close
      await page.waitForTimeout(1000);

      // Verify character was added
      const newCount = await roster.getCharacterCount();
      expect(newCount).toBe(initialCount + 1);

      // Verify character is visible in grid
      const hasCharacter = await roster.hasCharacter('Furina');
      expect(hasCharacter).toBeTruthy();
    });

    test('should validate required fields', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('manual');

      // Try to submit without filling required fields
      await roster.submitCharacterForm();

      // Should show validation error or stay in modal
      const modal = page.locator('[role="dialog"]');
      const isStillOpen = await modal.isVisible();
      const hasError = await page.locator('text=/required|select a character/i').isVisible().catch(() => false);

      expect(isStillOpen || hasError).toBeTruthy();
    });
  });

  test.describe('Read Character', () => {
    test('should display character list on roster page', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Page should load without errors
      await expect(roster.mainContent).toBeVisible();

      // Either shows characters or empty state
      const hasCharacters = await roster.getCharacterCount() > 0;
      const hasEmptyState = await roster.emptyState.isVisible().catch(() => false);

      expect(hasCharacters || hasEmptyState).toBeTruthy();
    });

    test('should search characters by name', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Add a character first
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('manual');
      await roster.fillManualCharacterForm({ name: 'Kazuha', level: 90 });
      await roster.submitCharacterForm();
      await page.waitForTimeout(1000);

      // Search for the character
      await roster.searchCharacter('Kazuha');

      // Should find the character
      const count = await roster.getCharacterCount();
      expect(count).toBeGreaterThanOrEqual(1);

      // Search for non-existent character
      await roster.searchCharacter('NonExistent');
      const noResults = await roster.getCharacterCount();
      expect(noResults).toBe(0);
    });

    test('should open character detail page', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Add a character first
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('manual');
      await roster.fillManualCharacterForm({ name: 'Bennett', level: 80 });
      await roster.submitCharacterForm();
      await page.waitForTimeout(1000);

      // Click on the character
      await roster.openCharacterDetail('Bennett');

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/roster\/.+/);

      // Should display character info
      await expect(page.locator('text=Bennett')).toBeVisible();
    });
  });

  test.describe('Update Character', () => {
    test('should edit character from detail page', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Add a character
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('manual');
      await roster.fillManualCharacterForm({ name: 'Xiangling', level: 70 });
      await roster.submitCharacterForm();
      await page.waitForTimeout(1000);

      // Open character detail
      await roster.openCharacterDetail('Xiangling');

      // Click edit button
      await page.getByRole('button', { name: /edit/i }).click();

      // Update level
      const levelInput = page.getByLabel(/level/i).first();
      await levelInput.clear();
      await levelInput.fill('80');

      // Save changes
      await page.getByRole('button', { name: /save|update/i }).click();

      // Verify changes persisted
      await expect(page.locator('text=/80|Lv\\.? ?80/i')).toBeVisible();
    });
  });

  test.describe('Delete Character', () => {
    test('should delete character from detail page', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Add a character
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('manual');
      await roster.fillManualCharacterForm({ name: 'Amber', level: 20 });
      await roster.submitCharacterForm();
      await page.waitForTimeout(1000);

      const countBefore = await roster.getCharacterCount();

      // Open character detail
      await roster.openCharacterDetail('Amber');

      // Delete the character
      await roster.deleteCharacter();

      // Should redirect back to roster
      await expect(page).toHaveURL(/\/roster$/);

      // Character count should decrease
      const countAfter = await roster.getCharacterCount();
      expect(countAfter).toBe(countBefore - 1);

      // Character should no longer exist
      const hasCharacter = await roster.hasCharacter('Amber');
      expect(hasCharacter).toBeFalsy();
    });

    test('should require confirmation before delete', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Add a character
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('manual');
      await roster.fillManualCharacterForm({ name: 'Lisa', level: 40 });
      await roster.submitCharacterForm();
      await page.waitForTimeout(1000);

      // Open character detail
      await roster.openCharacterDetail('Lisa');

      // Click delete
      await page.getByRole('button', { name: /delete/i }).click();

      // Confirmation modal should appear
      const confirmModal = page.locator('[role="dialog"]').or(page.locator('[role="alertdialog"]'));
      await expect(confirmModal.or(page.locator('text=/confirm|are you sure/i'))).toBeVisible();

      // Cancel deletion
      await page.getByRole('button', { name: /cancel|no/i }).click();

      // Should still be on detail page
      await expect(page.locator('text=Lisa')).toBeVisible();
    });
  });

  test.describe('Character Filtering', () => {
    test('should filter characters by element', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Add multiple characters of different elements
      const characters = [
        { name: 'Furina', level: 90 },
        { name: 'Bennett', level: 80 },
      ];

      for (const char of characters) {
        await roster.openAddCharacterModal();
        await roster.selectImportMethod('manual');
        await roster.fillManualCharacterForm(char);
        await roster.submitCharacterForm();
        await page.waitForTimeout(500);
      }

      // Apply element filter (Hydro)
      await roster.applyFilter('element', 'Hydro');

      // Should only show Hydro characters
      const hasHydro = await roster.hasCharacter('Furina');
      expect(hasHydro).toBeTruthy();

      // Pyro character should be filtered out
      const hasPyro = await roster.hasCharacter('Bennett');
      expect(hasPyro).toBeFalsy();
    });
  });
});
