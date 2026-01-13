/**
 * Roster Page Object Model
 * Interactions with character roster management
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RosterPage extends BasePage {
  readonly characterGrid: Locator;
  readonly addCharacterButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly sortSelect: Locator;
  readonly viewToggle: Locator;
  readonly characterCards: Locator;
  readonly emptyState: Locator;
  readonly weaponsTab: Locator;
  readonly artifactsTab: Locator;

  constructor(page: Page) {
    super(page);
    this.characterGrid = page.locator('[data-testid="character-grid"], .grid').first();
    this.addCharacterButton = page.getByRole('button', { name: /add character/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.filterButton = page.getByRole('button', { name: /filter/i });
    this.sortSelect = page.getByLabel(/sort/i);
    this.viewToggle = page.locator('[data-testid="view-toggle"]');
    this.characterCards = page.locator('[data-testid="character-card"], .cursor-pointer').filter({ has: page.locator('img') });
    this.emptyState = page.locator('text=/no characters/i').or(page.locator('[data-testid="empty-roster"]'));
    this.weaponsTab = page.getByRole('link', { name: /weapons/i });
    this.artifactsTab = page.getByRole('link', { name: /artifacts/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/roster');
    await this.waitForLoad();
  }

  /**
   * Get the count of character cards displayed
   */
  async getCharacterCount(): Promise<number> {
    await this.page.waitForTimeout(500); // Wait for grid to populate
    return await this.characterCards.count();
  }

  /**
   * Search for a character by name
   */
  async searchCharacter(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(300); // Debounce
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await this.page.waitForTimeout(300);
  }

  /**
   * Open the Add Character modal
   */
  async openAddCharacterModal(): Promise<Locator> {
    await this.addCharacterButton.click();
    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Select an import method from the Add Character modal
   */
  async selectImportMethod(method: 'manual' | 'enka' | 'good' | 'irminsul'): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');

    const methodText = {
      manual: /manual/i,
      enka: /enka/i,
      good: /good|json/i,
      irminsul: /irminsul/i,
    };

    await modal.getByRole('button', { name: methodText[method] })
      .or(modal.locator(`text=${methodText[method]}`))
      .click();
  }

  /**
   * Fill the manual character form
   */
  async fillManualCharacterForm(data: {
    name: string;
    level?: number;
    constellation?: number;
    talents?: { auto: number; skill: number; burst: number };
    weapon?: string;
    weaponLevel?: number;
  }): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');

    // Select character from dropdown
    await modal.getByLabel(/character/i).first().click();
    await this.page.getByRole('option', { name: data.name }).click();

    // Fill level
    if (data.level) {
      await modal.getByLabel(/level/i).first().fill(String(data.level));
    }

    // Fill constellation
    if (data.constellation !== undefined) {
      await modal.getByLabel(/constellation/i).fill(String(data.constellation));
    }

    // Fill talents
    if (data.talents) {
      await modal.getByLabel(/auto|normal/i).fill(String(data.talents.auto));
      await modal.getByLabel(/skill/i).fill(String(data.talents.skill));
      await modal.getByLabel(/burst/i).fill(String(data.talents.burst));
    }
  }

  /**
   * Submit the character form
   */
  async submitCharacterForm(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByRole('button', { name: /save|add|create|submit/i }).click();
  }

  /**
   * Import characters using Enka UID
   */
  async importFromEnka(uid: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByLabel(/uid/i).fill(uid);
    await modal.getByRole('button', { name: /import/i }).click();
  }

  /**
   * Import characters using GOOD JSON format
   */
  async importFromGOOD(jsonData: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    const textarea = modal.locator('textarea');
    await textarea.fill(jsonData);
    await modal.getByRole('button', { name: /import/i }).click();
  }

  /**
   * Click on a character card to view details
   */
  async openCharacterDetail(characterName: string): Promise<void> {
    await this.characterCards
      .filter({ hasText: characterName })
      .first()
      .click();
    await this.page.waitForURL(/\/roster\/.+/);
  }

  /**
   * Delete a character from the detail page
   */
  async deleteCharacter(): Promise<void> {
    await this.page.getByRole('button', { name: /delete/i }).click();
    // Confirm deletion
    await this.page.getByRole('button', { name: /confirm|yes|delete/i }).click();
  }

  /**
   * Navigate to weapons sub-tab
   */
  async goToWeapons(): Promise<void> {
    await this.weaponsTab.click();
    await this.page.waitForURL(/\/roster\/weapons/);
  }

  /**
   * Navigate to artifacts sub-tab
   */
  async goToArtifacts(): Promise<void> {
    await this.artifactsTab.click();
    await this.page.waitForURL(/\/roster\/artifacts/);
  }

  /**
   * Apply a filter
   */
  async applyFilter(filterType: 'element' | 'weapon' | 'rarity', value: string): Promise<void> {
    // Open filter panel if not visible
    if (!(await this.page.locator('[data-testid="filter-panel"]').isVisible())) {
      await this.filterButton.click();
    }

    const filterLabel = {
      element: /element/i,
      weapon: /weapon/i,
      rarity: /rarity|star/i,
    };

    await this.page.getByLabel(filterLabel[filterType]).selectOption(value);
  }

  /**
   * Check if a character exists in the roster
   */
  async hasCharacter(name: string): Promise<boolean> {
    return await this.characterCards.filter({ hasText: name }).count() > 0;
  }

  /**
   * Export roster to GOOD format
   */
  async exportRoster(): Promise<void> {
    await this.page.getByRole('button', { name: /export/i }).click();
    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
  }

  /**
   * Copy export data to clipboard
   */
  async copyExportData(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByRole('button', { name: /copy/i }).click();
  }
}
