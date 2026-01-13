/**
 * Wishes Page Object Model
 * Interactions with wish tracking and calculator
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class WishesPage extends BasePage {
  readonly wishHistory: Locator;
  readonly pityHeader: Locator;
  readonly calculatorTab: Locator;
  readonly budgetTab: Locator;
  readonly importButton: Locator;
  readonly bannerTabs: Locator;
  readonly wishList: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.wishHistory = page.locator('[data-testid="wish-history"]').or(page.locator('main'));
    this.pityHeader = page.locator('[data-testid="pity-header"]').or(page.locator('text=/pity/i').locator('..'));
    this.calculatorTab = page.getByRole('link', { name: /calculator/i });
    this.budgetTab = page.getByRole('link', { name: /budget/i });
    this.importButton = page.getByRole('button', { name: /import/i });
    this.bannerTabs = page.locator('[data-testid="banner-tabs"]').or(
      page.locator('text=/character|weapon|standard/i').locator('..')
    );
    this.wishList = page.locator('[data-testid="wish-list"]').or(page.locator('ul, table').first());
    this.emptyState = page.locator('text=/no wishes/i');
  }

  async goto(): Promise<void> {
    await this.page.goto('/wishes');
    await this.waitForLoad();
  }

  /**
   * Get the current pity count for a banner type
   */
  async getPityCount(bannerType: 'character' | 'weapon' | 'standard'): Promise<number> {
    const pityText = await this.pityHeader
      .locator(`text=/${bannerType}/i`)
      .locator('..')
      .locator('text=/\\d+/')
      .first()
      .textContent();
    const match = pityText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Navigate to Calculator sub-tab
   */
  async goToCalculator(): Promise<void> {
    await this.calculatorTab.click();
    await this.page.waitForURL(/\/wishes\/calculator/);
  }

  /**
   * Navigate to Budget sub-tab
   */
  async goToBudget(): Promise<void> {
    await this.budgetTab.click();
    await this.page.waitForURL(/\/wishes\/budget/);
  }

  /**
   * Open the wish import modal
   */
  async openImportModal(): Promise<Locator> {
    await this.importButton.click();
    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Import wishes from UIGF JSON format
   */
  async importWishes(jsonData: string): Promise<void> {
    const modal = await this.openImportModal();
    await modal.locator('textarea').fill(jsonData);
    await modal.getByRole('button', { name: /import/i }).click();
  }

  /**
   * Select a banner tab
   */
  async selectBanner(type: 'character' | 'weapon' | 'standard' | 'chronicled'): Promise<void> {
    await this.bannerTabs.getByRole('button', { name: new RegExp(type, 'i') })
      .or(this.page.getByRole('tab', { name: new RegExp(type, 'i') }))
      .click();
  }

  /**
   * Get the total wish count
   */
  async getWishCount(): Promise<number> {
    const countText = await this.page.locator('text=/\\d+ wishes?|total:? \\d+/i').first().textContent();
    const match = countText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Check if there are any wishes displayed
   */
  async hasWishes(): Promise<boolean> {
    return !(await this.emptyState.isVisible());
  }
}

/**
 * Calculator Page Object Model (Wishes sub-page)
 */
export class CalculatorPage extends BasePage {
  readonly singleTargetTab: Locator;
  readonly multiTargetTab: Locator;
  readonly reverseTab: Locator;
  readonly primogemInput: Locator;
  readonly pityInput: Locator;
  readonly guaranteedToggle: Locator;
  readonly calculateButton: Locator;
  readonly resultSection: Locator;
  readonly probabilityChart: Locator;

  constructor(page: Page) {
    super(page);
    this.singleTargetTab = page.getByRole('tab', { name: /single/i });
    this.multiTargetTab = page.getByRole('tab', { name: /multi/i });
    this.reverseTab = page.getByRole('tab', { name: /reverse/i });
    this.primogemInput = page.getByLabel(/primogem|primo|gems/i);
    this.pityInput = page.getByLabel(/pity/i);
    this.guaranteedToggle = page.getByLabel(/guaranteed/i);
    this.calculateButton = page.getByRole('button', { name: /calculate/i });
    this.resultSection = page.locator('[data-testid="result"]').or(page.locator('text=/probability|chance/i').locator('..'));
    this.probabilityChart = page.locator('[data-testid="probability-chart"]').or(page.locator('.recharts-wrapper'));
  }

  async goto(): Promise<void> {
    await this.page.goto('/wishes/calculator');
    await this.waitForLoad();
  }

  /**
   * Calculate probability for a single target
   */
  async calculateSingleTarget(data: {
    primogems: number;
    pity: number;
    guaranteed?: boolean;
  }): Promise<void> {
    await this.primogemInput.fill(String(data.primogems));
    await this.pityInput.fill(String(data.pity));

    if (data.guaranteed) {
      await this.guaranteedToggle.check();
    }

    await this.calculateButton.click();
    await this.resultSection.waitFor({ state: 'visible' });
  }

  /**
   * Get the calculated probability
   */
  async getProbability(): Promise<number> {
    const resultText = await this.resultSection.locator('text=/\\d+(\\.\\d+)?%/').first().textContent();
    const match = resultText?.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Switch to Multi-Target calculator
   */
  async switchToMultiTarget(): Promise<void> {
    await this.multiTargetTab.click();
  }

  /**
   * Switch to Reverse calculator
   */
  async switchToReverse(): Promise<void> {
    await this.reverseTab.click();
  }

  /**
   * Check if the probability chart is displayed
   */
  async hasChart(): Promise<boolean> {
    return await this.probabilityChart.isVisible();
  }
}
