/**
 * Planner Page Object Model
 * Interactions with material planning
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PlannerPage extends BasePage {
  readonly singleModeTab: Locator;
  readonly multiModeTab: Locator;
  readonly characterSelect: Locator;
  readonly goalTypeSelect: Locator;
  readonly materialsList: Locator;
  readonly resinEstimate: Locator;
  readonly farmingRecommendations: Locator;
  readonly deficitPriority: Locator;
  readonly selectAllButton: Locator;

  constructor(page: Page) {
    super(page);
    this.singleModeTab = page.getByRole('tab', { name: /single/i });
    this.multiModeTab = page.getByRole('tab', { name: /multi/i });
    this.characterSelect = page.getByLabel(/character/i).or(page.locator('select').first());
    this.goalTypeSelect = page.getByLabel(/goal/i).or(page.locator('[data-testid="goal-type"]'));
    this.materialsList = page.locator('[data-testid="materials-list"]').or(page.locator('text=/materials needed/i').locator('..'));
    this.resinEstimate = page.locator('[data-testid="resin-estimate"]').or(page.locator('text=/resin/i'));
    this.farmingRecommendations = page.locator('[data-testid="farming-recommendations"]').or(page.locator('text=/today.*farming/i').locator('..'));
    this.deficitPriority = page.locator('[data-testid="deficit-priority"]').or(page.locator('text=/deficit|priority/i').locator('..'));
    this.selectAllButton = page.getByRole('button', { name: /select all/i });
  }

  async goto(): Promise<void> {
    await this.page.goto('/teams/planner');
    await this.waitForLoad();
  }

  /**
   * Select single character planning mode
   */
  async selectSingleMode(): Promise<void> {
    await this.singleModeTab.click();
  }

  /**
   * Select multi-character planning mode
   */
  async selectMultiMode(): Promise<void> {
    await this.multiModeTab.click();
  }

  /**
   * Select a character for planning
   */
  async selectCharacter(name: string): Promise<void> {
    await this.characterSelect.click();
    await this.page.getByRole('option', { name: new RegExp(name, 'i') }).click();
    await this.page.waitForTimeout(500); // Wait for calculation
  }

  /**
   * Select a goal type
   */
  async selectGoalType(type: 'full' | 'comfortable' | 'functional' | 'next'): Promise<void> {
    const goalLabels = {
      full: /full|max/i,
      comfortable: /comfortable/i,
      functional: /functional/i,
      next: /next/i,
    };

    await this.goalTypeSelect.click();
    await this.page.getByRole('option', { name: goalLabels[type] }).click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Get the total resin estimate
   */
  async getResinEstimate(): Promise<number> {
    const text = await this.resinEstimate.textContent();
    const match = text?.match(/(\d+)/);
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
    const items = this.materialsList.locator('[data-testid="material-item"]').or(
      this.materialsList.locator('li, tr')
    );
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
    await this.page.waitForTimeout(300);
  }
}
