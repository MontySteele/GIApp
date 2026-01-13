/**
 * E2E Tests: Data Export
 * Tests for exporting data in various formats
 */

import { test, expect } from '@playwright/test';
import { RosterPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

test.describe('Data Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();
    await waitForAppReady(page);

    // Seed data for export
    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(sampleGOODData));
    await page.waitForTimeout(2000);
  });

  test.describe('GOOD Format Export', () => {
    test('should open export modal', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();

      // Modal should be visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    });

    test('should show JSON preview', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();

      const modal = page.locator('[role="dialog"]');

      // Should show JSON content
      const jsonContent = modal.locator('pre, code, textarea');
      await expect(jsonContent).toBeVisible();

      // Content should be valid JSON
      const text = await jsonContent.textContent();
      expect(() => JSON.parse(text || '')).not.toThrow();
    });

    test('should have GOOD format structure', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();

      const modal = page.locator('[role="dialog"]');
      const jsonContent = modal.locator('pre, code, textarea');
      const text = await jsonContent.textContent();

      const data = JSON.parse(text || '{}');

      // Check GOOD format structure
      expect(data).toHaveProperty('format', 'GOOD');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('characters');
      expect(Array.isArray(data.characters)).toBeTruthy();
    });

    test('should include imported characters in export', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();

      const modal = page.locator('[role="dialog"]');
      const jsonContent = modal.locator('pre, code, textarea');
      const text = await jsonContent.textContent();

      const data = JSON.parse(text || '{}');

      // Should have the characters we imported
      const characterKeys = data.characters.map((c: { key: string }) => c.key);
      expect(characterKeys).toContain('Furina');
    });

    test('should copy export data to clipboard', async ({ page, context }) => {
      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();
      await roster.copyExportData();

      // Should show success feedback
      const toast = page.locator('[role="alert"]');
      const toastVisible = await toast.isVisible().catch(() => false);

      const modal = page.locator('[role="dialog"]');
      const copySuccess = await modal.locator('text=/copied|success/i').isVisible().catch(() => false);

      expect(toastVisible || copySuccess).toBeTruthy();
    });

    test('should close modal after export', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();

      const modal = page.locator('[role="dialog"]');

      // Close the modal
      await modal.getByRole('button', { name: /close|done|cancel/i }).click();

      // Modal should close
      await expect(modal).toBeHidden();
    });
  });

  test.describe('Export with Inventory', () => {
    test('should toggle inventory inclusion', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      await roster.exportRoster();

      const modal = page.locator('[role="dialog"]');

      // Look for inventory toggle
      const inventoryToggle = modal.locator('text=/inventory|include inventory/i')
        .or(modal.getByLabel(/inventory/i));

      if (await inventoryToggle.isVisible()) {
        // Toggle inventory on
        await inventoryToggle.click();

        // Export should now include inventory
        const jsonContent = modal.locator('pre, code, textarea');
        const text = await jsonContent.textContent();
        const data = JSON.parse(text || '{}');

        // May have artifacts or weapons
        expect(data).toHaveProperty('artifacts');
        expect(data).toHaveProperty('weapons');
      }
    });
  });

  test.describe('Round-Trip Export/Import', () => {
    test('should be able to re-import exported data', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Export current data
      await roster.exportRoster();

      const modal = page.locator('[role="dialog"]');
      const jsonContent = modal.locator('pre, code, textarea');
      const exportedData = await jsonContent.textContent() || '{}';

      // Close export modal
      await modal.getByRole('button', { name: /close|done/i }).click();

      // Clear database
      await clearDatabase(page);
      await page.reload();
      await waitForAppReady(page);

      // Re-import the exported data
      await roster.goto();
      await roster.openAddCharacterModal();
      await roster.selectImportMethod('good');
      await roster.importFromGOOD(exportedData);

      await page.waitForTimeout(2000);

      // Should have characters again
      const count = await roster.getCharacterCount();
      expect(count).toBeGreaterThan(0);

      // Should have Furina
      const hasFurina = await roster.hasCharacter('Furina');
      expect(hasFurina).toBeTruthy();
    });
  });
});
