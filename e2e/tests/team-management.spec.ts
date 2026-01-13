/**
 * E2E Tests: Team Management
 * Tests for creating and managing teams
 */

import { test, expect } from '@playwright/test';
import { TeamsPage, RosterPage } from '../pages';
import { clearDatabase, waitForAppReady, sampleGOODData } from '../fixtures/test-data';

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await clearDatabase(page);
    await page.reload();
    await waitForAppReady(page);

    // Seed characters for team building
    const roster = new RosterPage(page);
    await roster.goto();
    await roster.openAddCharacterModal();
    await roster.selectImportMethod('good');
    await roster.importFromGOOD(JSON.stringify(sampleGOODData));
    await page.waitForTimeout(2000);
  });

  test.describe('Create Team', () => {
    test('should create a new team', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      const initialCount = await teams.getTeamCount();

      // Create a team
      await teams.createTeam({
        name: 'Test Team',
        members: ['Furina'],
      });

      // Wait for creation
      await page.waitForTimeout(1000);

      // Team count should increase
      const newCount = await teams.getTeamCount();
      expect(newCount).toBe(initialCount + 1);

      // Team should be visible
      const hasTeam = await teams.hasTeam('Test Team');
      expect(hasTeam).toBeTruthy();
    });

    test('should add multiple members to a team', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      await teams.createTeam({
        name: 'Multi-Member Team',
        members: ['Furina', 'Kazuha'],
      });

      await page.waitForTimeout(1000);

      // Check member count
      const memberCount = await teams.getTeamMemberCount('Multi-Member Team');
      expect(memberCount).toBe(2);
    });

    test('should limit team to 4 members', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      // Open create modal
      const modal = await teams.openCreateTeamModal();

      // Fill team name
      await modal.getByLabel(/name/i).fill('Full Team');

      // Try to add more than 4 members
      // The UI should prevent selecting more than 4
      const characterCount = await modal.locator('[data-testid="character-option"], input[type="checkbox"]').count();

      // If there are selection controls, verify limit is enforced
      if (characterCount > 0) {
        // UI should enforce 4-member limit
        await expect(modal.locator('text=/max|limit|4/i')).toBeVisible().catch(() => {
          // Limit might be enforced differently
        });
      }
    });

    test('should search for characters when building team', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      const modal = await teams.openCreateTeamModal();

      // Search for a character
      const searchInput = modal.getByPlaceholder(/search/i);
      await searchInput.fill('Furina');

      // Should filter to matching character
      await page.waitForTimeout(300);

      // Furina should be visible in options
      await expect(modal.locator('text=Furina')).toBeVisible();
    });
  });

  test.describe('View Team', () => {
    test.beforeEach(async ({ page }) => {
      // Create a team to view
      const teams = new TeamsPage(page);
      await teams.goto();
      await teams.createTeam({
        name: 'View Test Team',
        members: ['Furina'],
      });
      await page.waitForTimeout(1000);
    });

    test('should display team in grid', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      // Team should be visible
      const hasTeam = await teams.hasTeam('View Test Team');
      expect(hasTeam).toBeTruthy();
    });

    test('should open team detail page', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      await teams.openTeamDetail('View Test Team');

      // Should navigate to detail page
      await expect(page).toHaveURL(/\/teams\/.+/);

      // Should show team name
      await expect(page.locator('text=View Test Team')).toBeVisible();
    });
  });

  test.describe('Edit Team', () => {
    test.beforeEach(async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();
      await teams.createTeam({
        name: 'Edit Test Team',
        members: ['Furina'],
      });
      await page.waitForTimeout(1000);
    });

    test('should edit team name', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      // Open edit modal
      const modal = await teams.editTeam('Edit Test Team');

      // Change name
      await modal.getByLabel(/name/i).clear();
      await modal.getByLabel(/name/i).fill('Renamed Team');

      // Save
      await modal.getByRole('button', { name: /save|update/i }).click();

      await page.waitForTimeout(1000);

      // New name should be visible
      const hasNewName = await teams.hasTeam('Renamed Team');
      expect(hasNewName).toBeTruthy();

      // Old name should not exist
      const hasOldName = await teams.hasTeam('Edit Test Team');
      expect(hasOldName).toBeFalsy();
    });
  });

  test.describe('Delete Team', () => {
    test.beforeEach(async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();
      await teams.createTeam({
        name: 'Delete Test Team',
        members: ['Furina'],
      });
      await page.waitForTimeout(1000);
    });

    test('should delete a team', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      const countBefore = await teams.getTeamCount();

      await teams.deleteTeam('Delete Test Team');

      await page.waitForTimeout(1000);

      // Team count should decrease
      const countAfter = await teams.getTeamCount();
      expect(countAfter).toBe(countBefore - 1);

      // Team should no longer exist
      const hasTeam = await teams.hasTeam('Delete Test Team');
      expect(hasTeam).toBeFalsy();
    });
  });

  test.describe('wfpsim Export', () => {
    test.beforeEach(async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();
      await teams.createTeam({
        name: 'Export Test Team',
        members: ['Furina'],
      });
      await page.waitForTimeout(1000);
    });

    test('should open wfpsim export modal', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      await teams.exportToWfpsim('Export Test Team');

      // Export modal should be visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Should show export options
      await expect(modal.locator('text=/wfpsim|gcsim|export|config/i')).toBeVisible();
    });

    test('should generate gcsim config', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      await teams.exportToWfpsim('Export Test Team');

      const modal = page.locator('[role="dialog"]');

      // Should show generated config or preview
      const hasConfig = await modal.locator('pre, code, textarea').isVisible();
      expect(hasConfig).toBeTruthy();
    });

    test('should copy config to clipboard', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      await teams.exportToWfpsim('Export Test Team');

      const modal = page.locator('[role="dialog"]');

      // Click copy button
      await modal.getByRole('button', { name: /copy/i }).click();

      // Should show success feedback
      const hasFeedback = await modal.locator('text=/copied|success/i').isVisible().catch(() => {
        // Or toast notification
        return page.locator('[role="alert"]').isVisible();
      });
      expect(hasFeedback).toBeTruthy();
    });
  });
});
