/**
 * Planner Page Object Model
 * Interactions with material planning
 * Title: "Ascension Planner"
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlannerPage extends BasePage {
  // Mode switcher - buttons with User/Users icons
  readonly singleModeButton: Locator;
  readonly multiModeButton: Locator;

  // Single mode controls
  readonly characterSelect: Locator;
  readonly goalSelect: Locator;

  // Multi mode controls
  readonly charactersTab: Locator;
  readonly weaponsTab: Locator;
  readonly selectAllButton: Locator;
  readonly deselectAllButton: Locator;
  readonly characterCheckboxes: Locator;

  // Results displays
  readonly materialsList: Locator;
  readonly resinEstimate: Locator;
  readonly farmingRecommendations: Locator;
  readonly goalSummary: Locator;

  constructor(page: Page) {
    super(page);
    // Mode switcher - buttons in flex container (bg-slate-800)
    // Single button has User icon, Multi has Users icon
    this.singleModeButton = page.getByRole('button').filter({ has: page.locator('svg') })
      .locator('xpath=..').locator('button').first();
    this.multiModeButton = page.getByRole('button').filter({ has: page.locator('svg') })
      .locator('xpath=..').locator('button').last();

    // Single mode - selects with labels
    this.characterSelect = page.getByLabel(/^character$/i)
      .or(page.locator('select').filter({ hasText: /select a character/i }));
    this.goalSelect = page.getByLabel(/^goal$/i)
      .or(page.locator('select').filter({ hasText: /next ascension|functional|comfortable|full/i }));

    // Multi mode - tabs for Characters/Weapons
    this.charactersTab = page.getByRole('button', { name: /characters/i });
    this.weaponsTab = page.getByRole('button', { name: /weapons/i });
    this.selectAllButton = page.getByRole('button', { name: /select all/i });
    this.deselectAllButton = page.getByRole('button', { name: /deselect all/i });
    this.characterCheckboxes = page.locator('input[type="checkbox"]');

    // Results
    this.materialsList = page.locator('text=/materials/i').locator('..');
    this.resinEstimate = page.locator('text=/resin/i');
    this.farmingRecommendations = page.locator('text=/today|farming|recommend/i').locator('..');
    this.goalSummary = page.locator('text=/goal summary/i').locator('..');
  }

  async goto(): Promise<void> {
    await this.page.goto('/planner');
    await this.waitForLoad();
  }

  /**
   * Select single character planning mode
   */
  async selectSingleMode(): Promise<void> {
    // Click the first mode button (User icon = single mode)
    const modeButtons = this.page.locator('button').filter({
      has: this.page.locator('svg')
    });
    // Find buttons in the mode switcher container
    const switcher = this.page.locator('.bg-slate-800').filter({
      has: modeButtons
    }).first();
    await switcher.locator('button').first().click();
  }

  /**
   * Select multi-character planning mode
   */
  async selectMultiMode(): Promise<void> {
    // Click the second mode button (Users icon = multi mode)
    const modeButtons = this.page.locator('button').filter({
      has: this.page.locator('svg')
    });
    const switcher = this.page.locator('.bg-slate-800').filter({
      has: modeButtons
    }).first();
    await switcher.locator('button').last().click();
  }

  /**
   * Select a character for planning (single mode)
   * Character select shows "Character (Lv. X)" format
   */
  async selectCharacter(name: string): Promise<void> {
    const select = this.page.locator('select').first();
    // Find option containing the character name
    await select.selectOption({ label: new RegExp(name, 'i') });
    // Wait for calculation
    await this.page.waitForTimeout(500);
  }

  /**
   * Select a goal type
   * Options: "Next Ascension", "Functional (80/1/6/6)", "Comfortable (80/8/8/8)", "Full Build (90/10/10/10)"
   */
  async selectGoalType(type: 'full' | 'comfortable' | 'functional' | 'next'): Promise<void> {
    const goalLabels = {
      full: /full build/i,
      comfortable: /comfortable/i,
      functional: /functional/i,
      next: /next ascension/i,
    };

    // Goal is the second select on the page
    const select = this.page.locator('select').nth(1);
    await select.selectOption({ label: goalLabels[type] });
    // Wait for recalculation
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the total resin estimate
   */
  async getResinEstimate(): Promise<number> {
    const resinText = await this.resinEstimate.first().textContent();
    const match = resinText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if materials list is visible
   */
  async hasMaterials(): Promise<boolean> {
    return await this.materialsList.isVisible();
  }

  /**
   * Get the count of materials needed
   */
  async getMaterialCount(): Promise<number> {
    const items = this.materialsList.locator('li, tr, .grid > div');
    return await items.count();
  }

  /**
   * Toggle select all characters (multi mode)
   */
  async toggleSelectAll(): Promise<void> {
    await this.selectAllButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Deselect all characters (multi mode)
   */
  async deselectAll(): Promise<void> {
    await this.deselectAllButton.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Check if farming recommendations are displayed
   */
  async hasFarmingRecommendations(): Promise<boolean> {
    return await this.farmingRecommendations.isVisible();
  }

  /**
   * Get today's recommended domains
   */
  async getRecommendedDomains(): Promise<string[]> {
    const domains: string[] = [];
    const domainElements = this.farmingRecommendations.locator('text=/freedom|resistance|ballad|prosperity|diligence|gold|elegance|light|transience/i');
    const count = await domainElements.count();

    for (let i = 0; i < count; i++) {
      const text = await domainElements.nth(i).textContent();
      if (text) domains.push(text.trim());
    }

    return domains;
  }

  /**
   * Update material inventory count
   */
  async setMaterialInventory(materialName: string, count: number): Promise<void> {
    const materialRow = this.materialsList.locator(`text=${materialName}`).locator('..');
    const input = materialRow.locator('input[type="number"]');
    await input.fill(String(count));
    await expect(input).toHaveValue(String(count));
  }

  /**
   * Switch to Characters tab in multi mode
   */
  async switchToCharactersTab(): Promise<void> {
    await this.charactersTab.click();
  }

  /**
   * Switch to Weapons tab in multi mode
   */
  async switchToWeaponsTab(): Promise<void> {
    await this.weaponsTab.click();
  }

  /**
   * Get selected character count in multi mode
   */
  async getSelectedCount(): Promise<number> {
    return await this.characterCheckboxes.filter({ checked: true }).count();
  }

  /**
   * Select a specific character by checkbox in multi mode
   */
  async selectCharacterCheckbox(name: string): Promise<void> {
    const row = this.page.locator('text=' + name).locator('..');
    await row.locator('input[type="checkbox"]').check();
  }
}
