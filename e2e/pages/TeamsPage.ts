/**
 * Teams Page Object Model
 * Interactions with team management
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TeamsPage extends BasePage {
  readonly teamGrid: Locator;
  readonly createTeamButton: Locator;
  readonly teamCards: Locator;
  readonly plannerTab: Locator;
  readonly templatesTab: Locator;
  readonly bossesTab: Locator;
  readonly searchInput: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.teamGrid = page.locator('[data-testid="team-grid"], .grid').first();
    this.createTeamButton = page.getByRole('button', { name: /create team|new team|add team/i });
    this.teamCards = page.locator('[data-testid="team-card"]').or(
      page.locator('.cursor-pointer').filter({ has: page.locator('text=/\\d+ members?/i') })
    );
    this.plannerTab = page.getByRole('link', { name: /planner/i });
    this.templatesTab = page.getByRole('link', { name: /templates|builds/i });
    this.bossesTab = page.getByRole('link', { name: /boss/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.emptyState = page.locator('text=/no teams/i');
  }

  async goto(): Promise<void> {
    await this.page.goto('/teams');
    await this.waitForLoad();
  }

  /**
   * Get the count of team cards displayed
   */
  async getTeamCount(): Promise<number> {
    // Wait for grid to stabilize
    await this.teamGrid.or(this.emptyState).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    return await this.teamCards.count();
  }

  /**
   * Open the Create Team modal
   */
  async openCreateTeamModal(): Promise<Locator> {
    await this.createTeamButton.click();
    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Create a new team with the given data
   */
  async createTeam(data: {
    name: string;
    members: string[];
    tags?: string[];
    notes?: string;
  }): Promise<void> {
    const modal = await this.openCreateTeamModal();

    // Fill team name
    await modal.getByLabel(/name/i).fill(data.name);

    // Add team members
    for (const member of data.members) {
      // Search for character
      const searchInput = modal.getByPlaceholder(/search character/i)
        .or(modal.locator('input[type="search"]'))
        .or(modal.getByPlaceholder(/search/i));

      await searchInput.fill(member);
      // Wait for search to filter
      await expect(searchInput).toHaveValue(member);

      // Click on the character to select
      await modal.getByRole('option', { name: new RegExp(member, 'i') })
        .or(modal.locator(`text=${member}`).first())
        .click();
    }

    // Add tags if provided
    if (data.tags) {
      const tagsInput = modal.getByLabel(/tags/i);
      for (const tag of data.tags) {
        await tagsInput.fill(tag);
        await tagsInput.press('Enter');
      }
    }

    // Add notes if provided
    if (data.notes) {
      await modal.getByLabel(/notes|rotation/i).fill(data.notes);
    }

    // Submit the form
    await modal.getByRole('button', { name: /create|save|add/i }).click();
  }

  /**
   * Open a team's detail page
   */
  async openTeamDetail(teamName: string): Promise<void> {
    await this.teamCards
      .filter({ hasText: teamName })
      .first()
      .click();
    await this.page.waitForURL(/\/teams\/.+/);
  }

  /**
   * Delete a team
   */
  async deleteTeam(teamName: string): Promise<void> {
    await this.openTeamDetail(teamName);
    await this.page.getByRole('button', { name: /delete/i }).click();
    await this.page.getByRole('button', { name: /confirm|yes/i }).click();
  }

  /**
   * Edit an existing team
   */
  async editTeam(teamName: string): Promise<Locator> {
    await this.teamCards
      .filter({ hasText: teamName })
      .getByRole('button', { name: /edit/i })
      .click();
    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Export a team to wfpsim format
   */
  async exportToWfpsim(teamName: string): Promise<void> {
    const teamCard = this.teamCards.filter({ hasText: teamName });
    await teamCard.getByRole('button', { name: /wfpsim|export|zap/i })
      .or(teamCard.locator('[data-testid="wfpsim-export"]'))
      .click();

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to Planner sub-tab
   */
  async goToPlanner(): Promise<void> {
    await this.plannerTab.click();
    await this.page.waitForURL(/\/teams\/planner|\/planner/);
  }

  /**
   * Navigate to Build Templates sub-tab
   */
  async goToTemplates(): Promise<void> {
    await this.templatesTab.click();
    await this.page.waitForURL(/\/teams\/templates|\/templates/);
  }

  /**
   * Navigate to Weekly Bosses sub-tab
   */
  async goToBosses(): Promise<void> {
    await this.bossesTab.click();
    await this.page.waitForURL(/\/teams\/bosses|\/bosses/);
  }

  /**
   * Check if a team exists
   */
  async hasTeam(name: string): Promise<boolean> {
    return await this.teamCards.filter({ hasText: name }).count() > 0;
  }

  /**
   * Get the member count for a team
   */
  async getTeamMemberCount(teamName: string): Promise<number> {
    const teamCard = this.teamCards.filter({ hasText: teamName });
    const memberText = await teamCard.locator('text=/\\d+ members?/i').textContent();
    const match = memberText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Fill in the team name in an open modal
   */
  async fillTeamName(name: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByLabel(/name/i).fill(name);
    await expect(modal.getByLabel(/name/i)).toHaveValue(name);
  }

  /**
   * Save/submit the team form
   */
  async saveTeam(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByRole('button', { name: /create|save|add/i }).click();
  }
}
