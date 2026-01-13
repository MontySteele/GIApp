/**
 * Base Page Object Model
 * Common functionality shared across all page objects
 */

import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly header: Locator;
  readonly tabNav: Locator;
  readonly mainContent: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator('header');
    this.tabNav = page.locator('nav[aria-label="Main navigation"], nav').first();
    this.mainContent = page.locator('main');
    this.loadingIndicator = page.locator('[data-testid="loading"], .animate-pulse').first();
  }

  /**
   * Navigate to this page
   */
  abstract goto(): Promise<void>;

  /**
   * Wait for the page to be fully loaded
   */
  async waitForLoad(): Promise<void> {
    await this.mainContent.waitFor({ state: 'visible' });
    // Wait for skeleton loaders to disappear
    await this.page.waitForFunction(() => {
      const skeletons = document.querySelectorAll('.animate-pulse');
      return skeletons.length === 0;
    }, { timeout: 10000 }).catch(() => {
      // Ignore timeout - some pages may not have skeletons
    });
  }

  /**
   * Navigate to a tab by clicking on the tab navigation
   */
  async navigateToTab(tabName: string): Promise<void> {
    await this.tabNav.getByRole('link', { name: tabName }).click();
    await this.waitForLoad();
  }

  /**
   * Get the current page title from the header or main content
   */
  async getPageTitle(): Promise<string> {
    const title = this.mainContent.locator('h1, h2').first();
    return await title.textContent() || '';
  }

  /**
   * Check if the page is currently active (URL matches)
   */
  async isActive(pathPattern: string | RegExp): Promise<boolean> {
    const url = this.page.url();
    if (typeof pathPattern === 'string') {
      return url.includes(pathPattern);
    }
    return pathPattern.test(url);
  }

  /**
   * Wait for and get a toast notification
   */
  async waitForToast(options?: { text?: string | RegExp; type?: 'success' | 'error' | 'warning' | 'info' }): Promise<Locator> {
    const toast = this.page.locator('[role="alert"]').first();
    await toast.waitFor({ state: 'visible', timeout: 5000 });

    if (options?.text) {
      await expect(toast).toContainText(options.text);
    }

    return toast;
  }

  /**
   * Dismiss all visible toasts
   */
  async dismissToasts(): Promise<void> {
    const toasts = this.page.locator('[role="alert"]');
    const count = await toasts.count();

    for (let i = 0; i < count; i++) {
      const toast = toasts.nth(i);
      if (await toast.isVisible()) {
        const closeButton = toast.locator('button[aria-label*="close"], button[aria-label*="dismiss"]').or(toast.locator('button').first());
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  }

  /**
   * Open a modal by clicking a trigger button
   */
  async openModal(triggerText: string): Promise<Locator> {
    await this.page.getByRole('button', { name: triggerText }).click();
    const modal = this.page.locator('[role="dialog"]');
    await modal.waitFor({ state: 'visible' });
    return modal;
  }

  /**
   * Close the currently open modal
   */
  async closeModal(): Promise<void> {
    const modal = this.page.locator('[role="dialog"]');
    if (await modal.isVisible()) {
      // Try close button first
      const closeButton = modal.locator('button[aria-label*="close"], button[aria-label*="Close"]').or(
        modal.locator('button:has-text("Cancel")').or(modal.locator('button:has-text("Close")'))
      );

      if (await closeButton.first().isVisible()) {
        await closeButton.first().click();
      } else {
        // Press Escape as fallback
        await this.page.keyboard.press('Escape');
      }

      await modal.waitFor({ state: 'hidden' });
    }
  }

  /**
   * Fill a form field by label
   */
  async fillField(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Select an option from a dropdown by label
   */
  async selectOption(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).selectOption(value);
  }

  /**
   * Click a button by its text
   */
  async clickButton(text: string): Promise<void> {
    await this.page.getByRole('button', { name: text }).click();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Get the count of elements matching a selector
   */
  async getCount(selector: string): Promise<number> {
    return await this.page.locator(selector).count();
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `playwright-report/screenshots/${name}.png` });
  }
}
