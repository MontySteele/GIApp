/**
 * Teams Page Object Model
 * Interactions with team management
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class TeamsPage extends BasePage {
  readonly teamGrid: Locator;
  readonly newTeamButton: Locator;
  readonly teamCards: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.teamGrid = page.locator('.grid').first();
    // Button text is "New Team" with Plus icon
    this.newTeamButton = page.getByRole('button', { name: /new team/i });
    // Team cards - cards in the grid with team info
    this.teamCards = page.locator('.grid > div').filter({
      has: page.locator('h3, text=/\\d+ member/i')
    });
    // Empty state shows "No teams yet"
    this.emptyState = page.locator('text=/no teams yet/i');
  }

  async goto(): Promise<void> {
    await this.page.goto('/teams');
    await this.waitForLoad();
  }

  /**
   * Get the count of team cards displayed
   */
  async getTeamCount(): Promise<number> {
    // Wait for page to stabilize
    await this.page.waitForTimeout(500);
    const emptyVisible = await this.emptyState.isVisible().catch(() => false);
    if (emptyVisible) return 0;
    return await this.teamCards.count();
  }

  /**
   * Open the Create Team modal
   */
  async openCreateTeamModal(): Promise<Locator> {
    // Try the header button first, then empty state button
    const headerButton = this.newTeamButton;
    const emptyStateButton = this.page.getByRole('button', { name: /create team/i });

    if (await headerButton.isVisible()) {
      await headerButton.click();
    } else {
      await emptyStateButton.click();
    }

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Create a new team with the given data
   * Team form has: name input, tags input, rotation notes textarea, character search
   */
  async createTeam(data: {
    name: string;
    members: string[];
    tags?: string[];
    notes?: string;
  }): Promise<void> {
    const modal = await this.openCreateTeamModal();

    // Fill team name - placeholder is "e.g., Hyperbloom Raiden"
    const nameInput = modal.getByPlaceholder(/hyperbloom|raiden/i)
      .or(modal.getByLabel(/team name/i))
      .or(modal.locator('input').first());
    await nameInput.fill(data.name);

    // Add team members by searching and clicking
    for (const member of data.members) {
      // Search for character - placeholder is "Search characters..."
      const searchInput = modal.getByPlaceholder(/search characters/i)
        .or(modal.getByPlaceholder(/search/i));

      await searchInput.fill(member);
      await this.page.waitForTimeout(300); // Wait for filter

      // Click on the character in the available list to add them
      await modal.locator('text=' + member).first().click();
      await searchInput.clear();
    }

    // Add tags if provided - placeholder is "Comma separated e.g., abyss, bloom"
    if (data.tags && data.tags.length > 0) {
      const tagsInput = modal.getByPlaceholder(/comma separated|abyss/i)
        .or(modal.getByLabel(/tags/i));
      await tagsInput.fill(data.tags.join(', '));
    }

    // Add rotation notes if provided
    if (data.notes) {
      const notesInput = modal.locator('textarea')
        .or(modal.getByLabel(/rotation|notes/i));
      await notesInput.fill(data.notes);
    }

    // Submit the form - button has Save icon
    await modal.getByRole('button', { name: /save|create/i }).click();
  }

  /**
   * Open a team's detail page by clicking "View Details"
   */
  async openTeamDetail(teamName: string): Promise<void> {
    const teamCard = this.teamCards.filter({ hasText: teamName }).first();
    // Click the "View Details" link
    await teamCard.getByRole('link', { name: /view details/i })
      .or(teamCard.locator('a'))
      .click();
    await this.page.waitForURL(/\/teams\/.+/);
  }

  /**
   * Delete a team from the team card (hover for delete button)
   */
  async deleteTeam(teamName: string): Promise<void> {
    const teamCard = this.teamCards.filter({ hasText: teamName }).first();
    await teamCard.hover();

    // Click delete button (Trash2 icon, aria-label="Delete team")
    await teamCard.locator('[aria-label="Delete team"]')
      .or(teamCard.getByRole('button').filter({ has: this.page.locator('svg') }).last())
      .click();

    // Confirm in the delete modal
    const confirmModal = this.page.locator('[role="dialog"]');
    await confirmModal.waitFor({ state: 'visible' });
    await confirmModal.getByRole('button', { name: /^delete$/i }).click();
  }

  /**
   * Edit an existing team (hover for edit button)
   */
  async editTeam(teamName: string): Promise<Locator> {
    const teamCard = this.teamCards.filter({ hasText: teamName }).first();
    await teamCard.hover();

    // Click edit button (Edit2 icon, aria-label="Edit team")
    await teamCard.locator('[aria-label="Edit team"]')
      .or(teamCard.getByRole('button').filter({ has: this.page.locator('svg') }).nth(1))
      .click();

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Export a team to wfpsim format (hover for export button)
   */
  async exportToWfpsim(teamName: string): Promise<void> {
    const teamCard = this.teamCards.filter({ hasText: teamName }).first();
    await teamCard.hover();

    // Click export button (Zap icon, yellow, aria-label="Export to wfpsim")
    await teamCard.locator('[aria-label="Export to wfpsim"]')
      .or(teamCard.getByRole('button').filter({ has: this.page.locator('svg') }).first())
      .click();

    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
  }

  /**
   * Navigate to Planner (top-level route)
   */
  async goToPlanner(): Promise<void> {
    await this.page.getByRole('link', { name: /planner/i }).click();
    await this.page.waitForURL(/\/planner/);
  }

  /**
   * Navigate to Build Templates (under Roster)
   */
  async goToTemplates(): Promise<void> {
    await this.page.goto('/roster/builds');
    await this.page.waitForURL(/\/roster\/builds/);
  }

  /**
   * Check if a team exists
   */
  async hasTeam(name: string): Promise<boolean> {
    await this.page.waitForTimeout(300);
    return await this.teamCards.filter({ hasText: name }).count() > 0;
  }

  /**
   * Get the member count for a team from the subtitle
   */
  async getTeamMemberCount(teamName: string): Promise<number> {
    const teamCard = this.teamCards.filter({ hasText: teamName }).first();
    const memberText = await teamCard.locator('text=/\\d+ member/i').textContent();
    const match = memberText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Fill in the team name in an open modal
   */
  async fillTeamName(name: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    const nameInput = modal.getByPlaceholder(/hyperbloom|raiden/i)
      .or(modal.getByLabel(/team name/i))
      .or(modal.locator('input').first());
    await nameInput.fill(name);
    await expect(nameInput).toHaveValue(name);
  }

  /**
   * Save/submit the team form
   */
  async saveTeam(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByRole('button', { name: /save|create/i }).click();
  }

  /**
   * Select a team member in the create/edit form
   */
  async selectTeamMember(characterName: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    const searchInput = modal.getByPlaceholder(/search characters/i)
      .or(modal.getByPlaceholder(/search/i));

    await searchInput.fill(characterName);
    await this.page.waitForTimeout(300);
    await modal.locator('text=' + characterName).first().click();
    await searchInput.clear();
  }
}
