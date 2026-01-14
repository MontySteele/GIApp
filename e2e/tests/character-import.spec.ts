/**
 * E2E Tests: Character Import Flows
 * Tests for importing characters from various sources
 */

import { test, expect } from '@playwright/test';
import { RosterPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

test.describe('Character Import', () => {
  test.beforeEach(async ({ page }) => {
    // Clear database first (navigates away to avoid Dexie crash)
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test.describe('GOOD Format Import', () => {
    test('should import characters from GOOD JSON', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      const initialCount = await roster.getCharacterCount();

      // Open import modal
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');

      // Paste GOOD JSON data
      await roster.importFromGOOD(JSON.stringify(sampleGOODData));

      // Wait for import to complete by checking for success or modal closing
      await Promise.race([
        expect(page.locator('[role="alert"], text=/imported|success/i').first()).toBeVisible({ timeout: 10000 }),
        expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 }),
      ]).catch(() => {});

      // Modal should close
      const modalClosed = await page.locator('[role="dialog"]').isHidden().catch(() => true);
      expect(modalClosed).toBeTruthy();

      // Character count should increase
      const newCount = await roster.getCharacterCount();
      expect(newCount).toBeGreaterThan(initialCount);

      // Imported characters should be visible
      const hasFurina = await roster.hasCharacter('Furina');
      expect(hasFurina).toBeTruthy();
    });

    test('should handle invalid GOOD JSON gracefully', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');

      // Try to import invalid JSON
      await roster.importFromGOOD('{ invalid json }');

      // Should show error
      const hasError = await page.locator('text=/invalid|error|failed/i').isVisible();
      expect(hasError).toBeTruthy();

      // Modal should stay open or show error state
      const modal = page.locator('[role="dialog"]');
      const isOpen = await modal.isVisible();
      expect(isOpen).toBeTruthy();
    });

    test('should validate GOOD format version', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');

      // Import with unsupported format
      const invalidFormat = {
        format: 'INVALID',
        version: 1,
        characters: [],
      };

      await roster.importFromGOOD(JSON.stringify(invalidFormat));

      // Should show validation error
      const hasError = await page.locator('text=/invalid|unsupported|format/i').isVisible();
      expect(hasError).toBeTruthy();
    });

    test('should merge with existing characters on re-import', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // First import
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');
      await roster.importFromGOOD(JSON.stringify(sampleGOODData));

      // Wait for import to complete
      await Promise.race([
        expect(page.locator('[role="alert"], text=/imported|success/i').first()).toBeVisible({ timeout: 10000 }),
        expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 }),
      ]).catch(() => {});

      const countAfterFirst = await roster.getCharacterCount();

      // Import again with same data
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');
      await roster.importFromGOOD(JSON.stringify(sampleGOODData));

      // Wait for second import to complete
      await Promise.race([
        expect(page.locator('[role="alert"], text=/imported|success/i').first()).toBeVisible({ timeout: 10000 }),
        expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 10000 }),
      ]).catch(() => {});

      // Should not duplicate characters
      const countAfterSecond = await roster.getCharacterCount();
      expect(countAfterSecond).toBe(countAfterFirst);
    });
  });

  test.describe('Enka.network Import', () => {
    // Note: These tests may fail if Enka.network is unavailable or rate-limited
    test.skip('should show UID input field', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('enka');

      // Should show UID input
      const uidInput = page.getByLabel(/uid/i);
      await expect(uidInput).toBeVisible();
    });

    test.skip('should validate UID format', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('enka');

      // Try invalid UID (too short)
      await roster.importFromEnka('123');

      // Should show validation error
      const hasError = await page.locator('text=/invalid|9 digits/i').isVisible();
      expect(hasError).toBeTruthy();
    });

    // Skip network-dependent tests in CI
    test.skip('should import characters from Enka.network', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('enka');

      // Use a known test UID (would need a real public showcase)
      await roster.importFromEnka('800000001');

      // Wait for result to appear
      await expect(page.locator('text=/imported|no showcase|error/i')).toBeVisible({ timeout: 10000 });

      // Check for success or appropriate error
      const hasResult = await page.locator('text=/imported|no showcase|error/i').isVisible();
      expect(hasResult).toBeTruthy();
    });
  });

  test.describe('Import Modal Navigation', () => {
    test('should navigate between import options', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();

      // Should show import options
      const modal = page.locator('[role="dialog"]');

      // Click on GOOD format
      await roster.selectImportMethod('good');

      // Should show GOOD import UI
      await expect(modal.locator('textarea')).toBeVisible();

      // Go back to options
      await modal.getByRole('button', { name: /back|cancel/i }).click();

      // Should return to options menu
      await expect(modal.getByRole('button', { name: /enka/i })).toBeVisible();
    });

    test('should close modal on successful import', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');
      await roster.importFromGOOD(JSON.stringify(sampleGOODData));

      // Wait for import to complete
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeHidden({ timeout: 10000 });
    });

    test('should allow modal close via escape key', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.openAddCharacterModal();

      // Press Escape
      await page.keyboard.press('Escape');

      // Modal should close
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeHidden();
    });
  });
});
