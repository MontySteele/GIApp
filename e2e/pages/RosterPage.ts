/**
 * Roster Page Object Model
 * Interactions with character roster management
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class RosterPage extends BasePage {
  readonly characterGrid: Locator;
  readonly addCharacterButton: Locator;
  readonly exportRosterButton: Locator;
  readonly searchInput: Locator;
  readonly filterButton: Locator;
  readonly sortSelect: Locator;
  readonly gridViewButton: Locator;
  readonly listViewButton: Locator;
  readonly characterCards: Locator;
  readonly emptyState: Locator;
  readonly weaponsTab: Locator;
  readonly artifactsTab: Locator;
  readonly filterPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.characterGrid = page.locator('.grid').first();
    // Header has "Add Character" button with Plus icon
    this.addCharacterButton = page.getByRole('button', { name: /add character/i }).first();
    this.exportRosterButton = page.getByRole('button', { name: /export roster/i });
    // Search input has specific placeholder and aria-label
    this.searchInput = page.getByPlaceholder('Search characters...');
    // Filter button has aria-expanded attribute
    this.filterButton = page.getByRole('button').filter({ has: page.locator('text=/filter/i') })
      .or(page.locator('button[aria-controls="character-filters"]'));
    this.sortSelect = page.getByRole('combobox').filter({ hasText: /sort|name|priority|level/i });
    // View toggle buttons
    this.gridViewButton = page.getByRole('button', { name: /grid view/i });
    this.listViewButton = page.getByRole('button', { name: /list view/i });
    // Character cards - cards with h3 character name and edit/delete buttons
    this.characterCards = page.locator('[class*="cursor-pointer"]').filter({
      has: page.locator('h3'),
    }).filter({
      has: page.getByRole('button', { name: /edit character/i }),
    });
    this.emptyState = page.locator('text=/no characters/i');
    this.weaponsTab = page.getByRole('link', { name: /weapons/i });
    this.artifactsTab = page.getByRole('link', { name: /artifacts/i });
    this.filterPanel = page.locator('#character-filters');
  }

  async goto(): Promise<void> {
    await this.page.goto('/roster');
    await this.waitForLoad();
  }

  /**
   * Get the count of character cards displayed
   */
  async getCharacterCount(): Promise<number> {
    // Wait for page content to stabilize
    await this.page.waitForTimeout(500);
    return await this.characterCards.count();
  }

  /**
   * Search for a character by name
   */
  async searchCharacter(name: string): Promise<void> {
    await this.searchInput.fill(name);
    await expect(this.searchInput).toHaveValue(name);
    // Wait for filter to apply
    await this.page.waitForTimeout(300);
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();
    await expect(this.searchInput).toHaveValue('');
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
   * Methods: "Manual Entry", "Import from Enka.network", "Import GOOD Format (JSON)", "Import from Irminsul"
   */
  async selectImportMethod(method: 'manual' | 'enka' | 'good' | 'irminsul'): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');

    const methodText = {
      manual: /manual entry/i,
      enka: /enka\.network/i,
      good: /good format|json/i,
      irminsul: /irminsul/i,
    };

    await modal.getByRole('button', { name: methodText[method] }).click();
  }

  /**
   * Fill the manual character form
   * Note: Character name is a text input with placeholder "e.g., Furina, Neuvillette"
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

    // Character name is a text input
    const nameInput = modal.getByPlaceholder(/furina|neuvillette/i)
      .or(modal.locator('input').first());
    await nameInput.fill(data.name);

    // Fill level - use first spinbutton with name "Level" (character level, not weapon level)
    if (data.level) {
      const levelInput = modal.getByRole('spinbutton', { name: /^level$/i }).first();
      await levelInput.fill(String(data.level));
    }

    // Fill constellation - it's a select dropdown (C0-C6)
    if (data.constellation !== undefined) {
      const constellationSelect = modal.getByLabel(/constellation/i);
      await constellationSelect.selectOption(`C${data.constellation}`);
    }

    // Fill talents
    if (data.talents) {
      await modal.getByLabel(/auto|normal/i).fill(String(data.talents.auto));
      await modal.getByLabel(/skill/i).fill(String(data.talents.skill));
      await modal.getByLabel(/burst/i).fill(String(data.talents.burst));
    }

    // Fill weapon if provided
    if (data.weapon) {
      const weaponInput = modal.getByLabel(/weapon name/i)
        .or(modal.getByPlaceholder(/weapon/i));
      await weaponInput.fill(data.weapon);
    }

    if (data.weaponLevel) {
      const weaponLevelInput = modal.getByLabel(/weapon level/i);
      await weaponLevelInput.fill(String(data.weaponLevel));
    }
  }

  /**
   * Submit the character form
   * Submit button text is "Add Character" or "Save"
   */
  async submitCharacterForm(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    // The submit button is at the bottom of the form content area
    // Use exact match for "Add Character" button, or find the last button matching save/add
    const submitButton = modal.getByRole('button', { name: /^add character$/i })
      .or(modal.getByRole('button', { name: /^save$/i }));
    await submitButton.click();
    // Wait for modal to close
    await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
  }

  /**
   * Import characters using Enka UID
   */
  async importFromEnka(uid: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    await modal.getByLabel(/uid/i).fill(uid);
    // Click the import button (starts with "Import", not "Back to import options")
    await modal.getByRole('button', { name: /^import/i }).click();
  }

  /**
   * Import characters using GOOD JSON format
   * The import button text is "Import (Preview: X chars)" after filling textarea
   */
  async importFromGOOD(jsonData: string): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    const textarea = modal.locator('textarea');
    await textarea.fill(jsonData);
    // Wait for preview to update, then click import button
    // Button text is like "Import (Preview: 402 chars)"
    const importButton = modal.getByRole('button', { name: /^import \(/i })
      .or(modal.getByRole('button', { name: /^import$/i }));
    await importButton.click();
    // Wait for modal to close on successful import
    await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
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
   * Edit a character from the roster grid (hover to reveal edit button)
   */
  async editCharacter(characterName: string): Promise<void> {
    const card = this.characterCards.filter({ hasText: characterName }).first();
    await card.hover();
    await card.getByRole('button', { name: /edit character/i })
      .or(card.locator('[aria-label="Edit character"]'))
      .click();
  }

  /**
   * Delete a character from the detail page
   */
  async deleteCharacter(): Promise<void> {
    // Click delete button (appears on hover or in detail view)
    await this.page.getByRole('button', { name: /delete/i })
      .or(this.page.locator('[aria-label="Delete character"]'))
      .click();
    // Confirm deletion in the modal
    const confirmModal = this.page.locator('[role="dialog"]');
    await confirmModal.getByRole('button', { name: /delete|confirm|yes/i }).click();
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
   * Open the filter panel
   */
  async openFilters(): Promise<void> {
    const isExpanded = await this.filterButton.getAttribute('aria-expanded');
    if (isExpanded !== 'true') {
      await this.filterButton.click();
      await this.filterPanel.waitFor({ state: 'visible' });
    }
  }

  /**
   * Apply a filter
   */
  async applyFilter(filterType: 'element' | 'weapon' | 'rarity' | 'priority', value: string): Promise<void> {
    await this.openFilters();

    // Filter panel has select dropdowns for each filter type
    const filterSelect = this.filterPanel.locator('select').filter({ hasText: new RegExp(filterType, 'i') })
      .or(this.filterPanel.getByRole('combobox').nth(
        filterType === 'element' ? 0 :
        filterType === 'weapon' ? 1 :
        filterType === 'rarity' ? 2 : 3
      ));

    await filterSelect.selectOption(value);
  }

  /**
   * Check if a character exists in the roster
   */
  async hasCharacter(name: string): Promise<boolean> {
    await this.page.waitForTimeout(300); // Wait for any filtering
    return await this.characterCards.filter({ hasText: name }).count() > 0;
  }

  /**
   * Export roster to GOOD format
   */
  async exportRoster(): Promise<void> {
    await this.exportRosterButton.click();
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
