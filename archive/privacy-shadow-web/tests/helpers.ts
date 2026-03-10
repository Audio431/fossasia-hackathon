import { Page, Locator } from '@playwright/test';

export class TestHelpers {
  constructor(private page: Page) {}

  async waitForAppLoad() {
    // Wait for the app to be fully loaded
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(1000); // Extra wait for React to render
  }

  async navigateToSection(icon: string) {
    const button = this.page.locator(`button:has-text("${icon}")`).first();
    await button.click();
    await this.page.waitForTimeout(1000); // Wait for transition
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500);
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({
      path: `test-results/${name}.png`,
      fullPage: true
    });
  }

  async waitForText(text: string, timeout = 5000) {
    await this.page.waitForSelector(`text="${text}"`, { timeout });
  }

  async isVisible(locator: Locator): Promise<boolean> {
    try {
      await locator.waitFor({ timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }
}
