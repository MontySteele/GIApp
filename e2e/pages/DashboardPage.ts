/**
 * Dashboard Page Object Model
 * Interactions with the main dashboard/home page
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  readonly statsGrid: Locator;
  readonly notesWidget: Locator;
  readonly quickActions: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.statsGrid = page.locator('[data-testid="stats-grid"], .grid').first();
    this.notesWidget = page.locator('[data-testid="notes-widget"]').or(page.locator('text=Notes').locator('..'));
    this.quickActions = page.locator('[data-testid="quick-actions"]');
    this.emptyState = page.locator('[data-testid="empty-state"]').or(page.locator('text=Get Started'));
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  /**
   * Get all stat card values from the dashboard
   */
  async getStatValues(): Promise<Record<string, string>> {
    const stats: Record<string, string> = {};
    const statCards = this.statsGrid.locator('.text-2xl, .text-3xl, [data-testid="stat-value"]');
    const count = await statCards.count();

    for (let i = 0; i < count; i++) {
      const value = await statCards.nth(i).textContent();
      const label = await statCards.nth(i).locator('..').locator('p, span').first().textContent();
      if (label && value) {
        stats[label.trim()] = value.trim();
      }
    }

    return stats;
  }

  /**
   * Check if the dashboard shows the empty state (no data)
   */
  async hasEmptyState(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Click on a quick action button
   */
  async clickQuickAction(actionName: string): Promise<void> {
    await this.page.getByRole('link', { name: actionName })
      .or(this.page.getByRole('button', { name: actionName }))
      .click();
  }

  /**
   * Get the character count displayed on dashboard
   */
  async getCharacterCount(): Promise<number> {
    const text = await this.page.locator('text=/\\d+ Characters?/i').first().textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Navigate to Roster from dashboard
   */
  async goToRoster(): Promise<void> {
    await this.navigateToTab('Roster');
  }

  /**
   * Navigate to Teams from dashboard
   */
  async goToTeams(): Promise<void> {
    await this.navigateToTab('Teams');
  }

  /**
   * Navigate to Pulls from dashboard
   */
  async goToPulls(): Promise<void> {
    await this.navigateToTab('Pulls');
  }

  /**
   * Navigate to Planner from dashboard
   */
  async goToPlanner(): Promise<void> {
    await this.navigateToTab('Planner');
  }
}
