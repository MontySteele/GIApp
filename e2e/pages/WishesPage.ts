/**
 * Pulls Page Object Model (renamed from Wishes)
 * Interactions with pull tracking, budget, and calculator
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PullsPage extends BasePage {
  readonly calculatorTab: Locator;
  readonly budgetTab: Locator;
  readonly historyTab: Locator;
  readonly bannersTab: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    super(page);
    // Sub-navigation tabs/links
    this.calculatorTab = page.getByRole('link', { name: /^calculator$/i });
    this.budgetTab = page.getByRole('link', { name: /^budget$/i });
    this.historyTab = page.getByRole('link', { name: /^history$/i });
    this.bannersTab = page.getByRole('link', { name: /^banners$/i });
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
   * Select a banner summary on the history page.
   */
  async selectBanner(type: 'character' | 'weapon' | 'standard' | 'chronicled'): Promise<void> {
    const labels = {
      character: 'Character',
      weapon: 'Weapon',
      standard: 'Standard',
      chronicled: 'Chronicled',
    };
    const banner = this.page.getByText(new RegExp(`^${labels[type]}$`, 'i')).first();
    await expect(banner).toBeVisible();
    await banner.click();
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
 * Tab buttons: "Single Target" (Target icon), "Multi-Target" (Calculator icon), "Reverse Calculator" (TrendingUp icon)
 */
export class CalculatorPage extends BasePage {
  // Tab buttons - these are buttons, not role="tab"
  readonly singleTargetTab: Locator;
  readonly multiTargetTab: Locator;
  readonly reverseTab: Locator;

  // Single target form inputs
  readonly currentPityInput: Locator;
  readonly availablePullsInput: Locator;
  readonly pityInput: Locator;
  readonly primogemInput: Locator;
  readonly guaranteeStatusSelect: Locator;
  readonly radiantStreakInput: Locator;
  readonly useCurrentPityButton: Locator;

  // Calculate button and results
  readonly calculateButton: Locator;
  readonly resultSection: Locator;
  readonly probabilityDisplay: Locator;
  readonly confidenceLevels: Locator;
  readonly probabilityChart: Locator;

  constructor(page: Page) {
    super(page);
    // Tab buttons with specific text
    this.singleTargetTab = page.getByRole('button', { name: /single target/i });
    this.multiTargetTab = page.getByRole('button', { name: /multi-target/i });
    this.reverseTab = page.getByRole('button', { name: /reverse calculator/i });

    // Form inputs - exact names avoid hidden multi-target controls in strict mode.
    this.currentPityInput = page.getByRole('spinbutton', { name: /^current pity$/i }).first();
    this.availablePullsInput = page.getByRole('spinbutton', { name: /^event pulls$/i }).first();
    this.pityInput = this.currentPityInput;
    this.primogemInput = this.availablePullsInput;
    this.guaranteeStatusSelect = page.getByRole('combobox', { name: /^guarantee status$/i }).first();
    this.radiantStreakInput = page.getByRole('spinbutton', { name: /^radiant streak$/i }).first();
    this.useCurrentPityButton = page.getByRole('button', { name: /use current pity/i });

    // Results
    this.calculateButton = page.getByRole('button', { name: /calculate probability/i });
    this.resultSection = page.locator('text=/probability with/i').locator('..');
    this.probabilityDisplay = page.locator('text=/\\d+\\.?\\d*%/').first();
    this.confidenceLevels = page.locator('text=/confidence/i').locator('..');
    this.probabilityChart = page.locator('canvas').or(page.locator('.recharts-wrapper'));
  }

  async goto(): Promise<void> {
    await this.page.goto('/pulls/calculator');
    await this.waitForLoad();
  }

  /**
   * Calculate probability for a single target
   */
  async calculateSingleTarget(data: {
    pulls?: number;
    primogems?: number;
    pity: number;
    guaranteed?: boolean;
  }): Promise<void> {
    const pulls = data.pulls ?? Math.floor((data.primogems ?? 0) / 160);

    // Fill pity
    await this.currentPityInput.fill(String(data.pity));

    // Fill available pulls
    await this.availablePullsInput.fill(String(pulls));

    // Set guarantee status if needed
    if (data.guaranteed) {
      await this.guaranteeStatusSelect.selectOption('guaranteed');
    }

    // Click calculate
    await this.calculateButton.click();

    // Wait for results
    await this.resultSection.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Get the calculated probability percentage
   */
  async getProbability(): Promise<number> {
    const text = await this.probabilityDisplay.textContent();
    const match = text?.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  /**
   * Switch to Single Target calculator tab
   */
  async switchToSingleTarget(): Promise<void> {
    await this.singleTargetTab.click();
  }

  /**
   * Switch to Multi-Target calculator tab
   */
  async switchToMultiTarget(): Promise<void> {
    await this.multiTargetTab.click();
  }

  /**
   * Switch to Reverse calculator tab
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

  /**
   * Set current pity value
   */
  async setPity(value: number): Promise<void> {
    await this.currentPityInput.fill(String(value));
    await expect(this.currentPityInput).toHaveValue(String(value));
  }

  /**
   * Set available pulls value
   */
  async setPulls(value: number): Promise<void> {
    await this.availablePullsInput.fill(String(value));
    await expect(this.availablePullsInput).toHaveValue(String(value));
  }

  /**
   * Get confidence level pulls (50%, 80%, 90%, 99%)
   */
  async getConfidenceLevel(percentage: 50 | 80 | 90 | 99): Promise<number> {
    const confidenceText = await this.page
      .locator(`text=/${percentage}% confidence/i`)
      .locator('..')
      .locator('text=/\\d+ pulls/i')
      .textContent();
    const match = confidenceText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

// Keep WishesPage as alias for backwards compatibility
export { PullsPage as WishesPage };
