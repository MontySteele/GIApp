/**
 * Pulls Page Object Model (renamed from Wishes)
 * Interactions with pull tracking, budget, and calculator
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PullsPage extends BasePage {
  readonly budgetSection: Locator;
  readonly pityHeader: Locator;
  readonly calculatorTab: Locator;
  readonly budgetTab: Locator;
  readonly historyTab: Locator;
  readonly bannersTab: Locator;
  readonly bannerTabs: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    this.budgetSection = page.locator('[data-testid="budget-section"]').or(page.locator('main'));
    this.pityHeader = page.locator('[data-testid="pity-header"]').or(page.locator('text=/pity/i').locator('..'));
    this.calculatorTab = page.getByRole('link', { name: /calculator/i });
    this.budgetTab = page.getByRole('link', { name: /budget/i });
    this.historyTab = page.getByRole('link', { name: /history/i });
    this.bannersTab = page.getByRole('link', { name: /banners/i });
    this.bannerTabs = page.locator('[data-testid="banner-tabs"]').or(
      page.locator('[role="tablist"]')
    );
    this.emptyState = page.locator('text=/no pulls|no wishes|get started/i');
  }

  async goto(): Promise<void> {
    await this.page.goto('/pulls');
    await this.waitForLoad();
  }

  /**
   * Navigate to Calculator sub-tab
   */
  async goToCalculator(): Promise<void> {
    await this.calculatorTab.click();
    await this.page.waitForURL(/\/pulls\/calculator/);
  }

  /**
   * Navigate to Budget sub-tab (default view)
   */
  async goToBudget(): Promise<void> {
    await this.budgetTab.click();
    await this.page.waitForURL(/\/pulls$/);
  }

  /**
   * Navigate to History sub-tab
   */
  async goToHistory(): Promise<void> {
    await this.historyTab.click();
    await this.page.waitForURL(/\/pulls\/history/);
  }

  /**
   * Navigate to Banners sub-tab
   */
  async goToBanners(): Promise<void> {
    await this.bannersTab.click();
    await this.page.waitForURL(/\/pulls\/banners/);
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
   * Check if there are any pulls displayed
   */
  async hasPulls(): Promise<boolean> {
    return !(await this.emptyState.isVisible());
  }
}

/**
 * Calculator Page Object Model (Pulls sub-page)
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
    this.primogemInput = page.getByLabel(/primogem|primo|gems|pulls/i);
    this.pityInput = page.getByLabel(/pity/i);
    this.guaranteedToggle = page.getByLabel(/guaranteed/i);
    this.calculateButton = page.getByRole('button', { name: /calculate/i });
    this.resultSection = page.locator('[data-testid="result"]').or(page.locator('text=/probability|chance/i').locator('..'));
    this.probabilityChart = page.locator('[data-testid="probability-chart"]').or(page.locator('.recharts-wrapper, canvas'));
  }

  async goto(): Promise<void> {
    await this.page.goto('/pulls/calculator');
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

// Keep WishesPage as alias for backwards compatibility
export { PullsPage as WishesPage };
