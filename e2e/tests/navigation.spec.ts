/**
 * E2E Tests: Navigation Flows
 * Tests for app-wide navigation and routing
 */

import { test, expect } from '@playwright/test';
import { DashboardPage, RosterPage, TeamsPage, PullsPage } from '../pages';

test.describe('Navigation', () => {
  test.describe('Main Tab Navigation', () => {
    test('should navigate between all main tabs', async ({ page }) => {
      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      // Navigate to Roster
      await dashboard.navigateToTab('Roster');
      await expect(page).toHaveURL(/\/roster/);

      // Navigate to Teams
      await page.getByRole('link', { name: /teams/i }).click();
      await expect(page).toHaveURL(/\/teams/);

      // Navigate to Pulls (renamed from Wishes)
      await page.getByRole('link', { name: /pulls/i }).click();
      await expect(page).toHaveURL(/\/pulls/);

      // Navigate to Planner (now top-level)
      await page.getByRole('link', { name: /planner/i }).click();
      await expect(page).toHaveURL(/\/planner/);

      // Navigate to Settings
      await page.getByRole('link', { name: /settings/i }).click();
      await expect(page).toHaveURL(/\/settings/);

      // Return to Dashboard
      await page.getByRole('link', { name: /dashboard|home/i }).click();
      await expect(page).toHaveURL(/:\d+\/?$/);
    });

    test('should highlight active tab', async ({ page }) => {
      // Ensure viewport is large enough to show desktop navigation (TabNav is md:block)
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto('/roster');

      // TabNav uses text-primary-400 for active tabs
      const rosterTab = page.getByRole('link', { name: /roster/i }).first();
      await expect(rosterTab).toHaveClass(/text-primary-400|border-primary|active/);
    });
  });

  test.describe('Roster Sub-Navigation', () => {
    test('should navigate between Roster sub-tabs', async ({ page }) => {
      const roster = new RosterPage(page);
      await roster.goto();

      // Default to Characters
      await expect(page).toHaveURL(/\/roster$/);

      // Navigate to Weapons
      await roster.goToWeapons();
      await expect(page).toHaveURL(/\/roster\/weapons/);

      // Navigate to Artifacts
      await roster.goToArtifacts();
      await expect(page).toHaveURL(/\/roster\/artifacts/);

      // Return to Characters
      await page.getByRole('link', { name: /characters/i }).click();
      await expect(page).toHaveURL(/\/roster$/);
    });
  });

  test.describe('Teams Sub-Navigation', () => {
    test('should navigate between Teams sub-tabs', async ({ page }) => {
      const teams = new TeamsPage(page);
      await teams.goto();

      // Navigate to Bosses (only sub-tab under Teams now)
      await teams.goToBosses();
      await expect(page).toHaveURL(/\/teams\/bosses/);

      // Navigate to Planner (now top-level)
      await teams.goToPlanner();
      await expect(page).toHaveURL(/\/planner/);

      // Navigate to Templates (now under Roster)
      await teams.goToTemplates();
      await expect(page).toHaveURL(/\/roster\/builds/);
    });
  });

  test.describe('Pulls Sub-Navigation', () => {
    test('should navigate between Pulls sub-tabs', async ({ page }) => {
      const pulls = new PullsPage(page);
      await pulls.goto();

      // Default is Budget tab
      await expect(page).toHaveURL(/\/pulls$/);

      // Navigate to Calculator
      await pulls.goToCalculator();
      await expect(page).toHaveURL(/\/pulls\/calculator/);

      // Navigate to History
      await pulls.goToHistory();
      await expect(page).toHaveURL(/\/pulls\/history/);

      // Navigate to Banners
      await pulls.goToBanners();
      await expect(page).toHaveURL(/\/pulls\/banners/);
    });
  });

  test.describe('Browser Navigation', () => {
    test('should support browser back/forward buttons', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /roster/i }).click();
      await expect(page).toHaveURL(/\/roster/);

      await page.getByRole('link', { name: /teams/i }).click();
      await expect(page).toHaveURL(/\/teams/);

      // Go back
      await page.goBack();
      await expect(page).toHaveURL(/\/roster/);

      // Go back again to root
      await page.goBack();
      await expect(page).toHaveURL(/:\d+\/?$/);

      // Go forward
      await page.goForward();
      await expect(page).toHaveURL(/\/roster/);
    });

    test('should handle direct URL navigation', async ({ page }) => {
      // Navigate directly to a nested route
      await page.goto('/pulls/calculator');
      await expect(page).toHaveURL(/\/pulls\/calculator/);

      // Should show calculator content
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle legacy routes with redirects', async ({ page }) => {
      // Old /wishes route should redirect to /pulls
      await page.goto('/wishes');
      await expect(page).toHaveURL(/\/pulls/);

      // Old /wishes/calculator route should redirect to /pulls/calculator
      await page.goto('/wishes/calculator');
      await expect(page).toHaveURL(/\/pulls\/calculator/);

      // Old /calendar route should redirect to /planner/domains
      await page.goto('/calendar');
      await expect(page).toHaveURL(/\/planner\/domains/);
    });

    test('should handle invalid routes gracefully', async ({ page }) => {
      await page.goto('/invalid-route');

      // Should redirect to dashboard or show 404
      const url = page.url();
      const is404 = await page.locator('text=/not found|404/i').isVisible().catch(() => false);
      const isRedirected = url.includes('/') && !url.includes('/invalid-route');

      expect(is404 || isRedirected).toBeTruthy();
    });
  });

  test.describe('Deep Linking', () => {
    test('should support deep links to character details', async ({ page }) => {
      // First create a character to have a valid ID
      const roster = new RosterPage(page);
      await roster.goto();

      // Check if there are any characters
      const count = await roster.getCharacterCount();

      if (count > 0) {
        // Click first character
        await roster.characterCards.first().click();

        // Should navigate to detail page
        await expect(page).toHaveURL(/\/roster\/.+/);

        // Verify we can bookmark and return to this URL
        const detailUrl = page.url();
        await page.goto('/');
        await page.goto(detailUrl);

        // Should show character detail
        await expect(page.locator('main')).toBeVisible();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support skip link for accessibility', async ({ page }) => {
      await page.goto('/');

      // Press Tab to focus skip link
      await page.keyboard.press('Tab');

      // Skip link should be visible when focused
      const skipLink = page.locator('a:has-text("Skip to main content")');
      const isVisible = await skipLink.isVisible().catch(() => false);

      if (isVisible) {
        await skipLink.click();
        // Focus should move to main content
        const mainContent = page.locator('#main-content, main');
        await expect(mainContent).toBeFocused();
      }
    });
  });
});
