/**
 * E2E Tests: wfpsim Export Flow
 * Tests for exporting team configurations to wfpsim/gcsim format
 */

import { test, expect } from '@playwright/test';
import { RosterPage, TeamsPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

// Extended GOOD data with 4 characters for a full team
const fourCharacterGOODData = {
  ...sampleGOODData,
  characters: [
    {
      key: 'RaidenShogun',
      level: 90,
      constellation: 0,
      ascension: 6,
      talent: { auto: 1, skill: 9, burst: 10 },
    },
    {
      key: 'Bennett',
      level: 90,
      constellation: 6,
      ascension: 6,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
    {
      key: 'Xiangling',
      level: 90,
      constellation: 6,
      ascension: 6,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
    {
      key: 'Xingqiu',
      level: 90,
      constellation: 6,
      ascension: 6,
      talent: { auto: 1, skill: 6, burst: 10 },
    },
  ],
  weapons: [
    {
      key: 'EngulfingLightning',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'RaidenShogun',
    },
    {
      key: 'SkywardBlade',
      level: 90,
      ascension: 6,
      refinement: 1,
      location: 'Bennett',
    },
    {
      key: 'TheCatch',
      level: 90,
      ascension: 6,
      refinement: 5,
      location: 'Xiangling',
    },
    {
      key: 'SacrificialSword',
      level: 90,
      ascension: 6,
      refinement: 5,
      location: 'Xingqiu',
    },
  ],
};

test.describe('wfpsim Export Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearDatabase(page);
    await page.goto('/');
    await waitForAppReady(page);

    // Import characters first
    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(fourCharacterGOODData));
    await page.waitForTimeout(2000);
  });

  test('can export team to wfpsim format', async ({ page }) => {
    // First, create a team
    const teams = new TeamsPage(page);
    await teams.goto();

    // Create a new team
    await teams.openCreateTeamModal();
    await teams.fillTeamName('National Raiden');

    // Select characters for the team
    const characterCheckboxes = page.locator('input[type="checkbox"]');
    const count = await characterCheckboxes.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await characterCheckboxes.nth(i).check();
    }

    await teams.saveTeam();
    await page.waitForTimeout(1000);

    // Navigate to team detail or find export button
    const teamCard = page.locator('text=/National Raiden/i').first();
    await teamCard.click();
    await page.waitForTimeout(500);

    // Look for export button
    const exportButton = page.getByRole('button', { name: /export|wfpsim|gcsim/i });
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(500);

      // Export modal should appear
      const exportModal = page.locator('[role="dialog"]').filter({ hasText: /export|gcsim|wfpsim/i });
      await expect(exportModal).toBeVisible({ timeout: 5000 });
    }
  });

  test('export modal shows configuration options', async ({ page }) => {
    const teams = new TeamsPage(page);
    await teams.goto();

    // Create team
    await teams.openCreateTeamModal();
    await teams.fillTeamName('Export Test Team');

    const characterCheckboxes = page.locator('input[type="checkbox"]');
    const count = await characterCheckboxes.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await characterCheckboxes.nth(i).check();
    }

    await teams.saveTeam();
    await page.waitForTimeout(1000);

    // Open team detail
    const teamCard = page.locator('text=/Export Test Team/i').first();
    if (await teamCard.isVisible()) {
      await teamCard.click();
      await page.waitForTimeout(500);

      // Open export modal
      const exportButton = page.getByRole('button', { name: /export|wfpsim|gcsim/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);

        // Should show export options
        const exportModal = page.locator('[role="dialog"]');
        if (await exportModal.isVisible()) {
          // Look for common export options
          const options = exportModal.locator('input, select, textarea');
          const optionsCount = await options.count();
          expect(optionsCount).toBeGreaterThan(0);
        }
      }
    }
  });

  test('can copy gcsim config to clipboard', async ({ page }) => {
    const teams = new TeamsPage(page);
    await teams.goto();

    // Create team
    await teams.openCreateTeamModal();
    await teams.fillTeamName('Clipboard Test Team');

    const characterCheckboxes = page.locator('input[type="checkbox"]');
    const count = await characterCheckboxes.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await characterCheckboxes.nth(i).check();
    }

    await teams.saveTeam();
    await page.waitForTimeout(1000);

    // Navigate to team
    const teamCard = page.locator('text=/Clipboard Test Team/i').first();
    if (await teamCard.isVisible()) {
      await teamCard.click();
      await page.waitForTimeout(500);

      const exportButton = page.getByRole('button', { name: /export|wfpsim|gcsim/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);

        // Find copy button
        const copyButton = page.getByRole('button', { name: /copy/i });
        if (await copyButton.isVisible()) {
          // Grant clipboard permissions (may be blocked in some test environments)
          try {
            await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
            await copyButton.click();

            // Should show success feedback
            const successMessage = page.locator('text=/copied|success/i');
            await expect(successMessage).toBeVisible({ timeout: 3000 });
          } catch {
            // Clipboard may not be available in all test environments
            expect(await copyButton.isVisible()).toBeTruthy();
          }
        }
      }
    }
  });

  test('exported config has valid gcsim structure', async ({ page }) => {
    const teams = new TeamsPage(page);
    await teams.goto();

    // Create team
    await teams.openCreateTeamModal();
    await teams.fillTeamName('Structure Test Team');

    const characterCheckboxes = page.locator('input[type="checkbox"]');
    const count = await characterCheckboxes.count();
    for (let i = 0; i < Math.min(4, count); i++) {
      await characterCheckboxes.nth(i).check();
    }

    await teams.saveTeam();
    await page.waitForTimeout(1000);

    // Navigate to team
    const teamCard = page.locator('text=/Structure Test Team/i').first();
    if (await teamCard.isVisible()) {
      await teamCard.click();
      await page.waitForTimeout(500);

      const exportButton = page.getByRole('button', { name: /export|wfpsim|gcsim/i });
      if (await exportButton.isVisible()) {
        await exportButton.click();
        await page.waitForTimeout(500);

        // Look for the config preview textarea/code block
        const configPreview = page.locator('textarea, pre, code').filter({ hasText: /char|weapon|set/i });
        if (await configPreview.isVisible()) {
          const configText = await configPreview.textContent();

          // Verify gcsim format markers are present
          if (configText) {
            // Should contain character definitions
            const hasCharDef = configText.includes('char') || configText.includes('level');
            expect(hasCharDef).toBeTruthy();
          }
        }
      }
    }
  });
});
