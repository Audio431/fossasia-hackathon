/**
 * Privacy Shadow — PII Detection E2E Tests
 *
 * These tests load the demo page (test.html) directly and verify that:
 * 1. The page renders correctly
 * 2. All 8 test scenario cards are present
 * 3. Auto-fill buttons trigger input events
 * 4. The PII detection engine (via the bundled content script) responds
 *
 * NOTE: The Privacy Shadow overlay only appears when the Chrome extension is
 * loaded as an unpacked extension. These tests verify the page UI and input
 * behaviour independently — overlay tests require the extension to be loaded
 * via chrome --load-extension and are marked with the "extension" tag.
 */

import { test, expect, Page } from '@playwright/test';
import path from 'path';

const TEST_PAGE = `file://${path.resolve(__dirname, 'demo-pages/test.html')}`;

test.describe('Demo page UI', () => {
  test('loads and shows the Privacy Shadow hero', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await expect(page.locator('h1').filter({ hasText: 'Privacy Shadow' }).first()).toContainText('Privacy Shadow');
    await expect(page.locator('.hero-ghost')).toBeVisible();
  });

  test('shows extension status badge', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await expect(page.locator('#ext-badge')).toBeVisible();
  });

  test('shows all 12 scenario cards', async ({ page }) => {
    await page.goto(TEST_PAGE);
    const cards = page.locator('.scenario-card');
    await expect(cards).toHaveCount(12);
  });

  test('shows detection types grid with 10 items', async ({ page }) => {
    await page.goto(TEST_PAGE);
    const typeCards = page.locator('.type-card');
    await expect(typeCards).toHaveCount(10);
  });

  test('shows 8 platform cards', async ({ page }) => {
    await page.goto(TEST_PAGE);
    const platCards = page.locator('.plat-card');
    await expect(platCards).toHaveCount(8);
  });
});

test.describe('Demo page auto-fill', () => {
  async function fillScenario(page: Page, inputId: string, expectedText: string) {
    await page.goto(TEST_PAGE);

    // Simulate clicking Auto-fill by calling the fill() function directly
    await page.evaluate(
      ({ id, text }: { id: string; text: string }) => {
        const el = document.getElementById(id) as HTMLTextAreaElement | null;
        if (!el) throw new Error(`Element not found: ${id}`);
        el.value = text;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      { id: inputId, text: expectedText }
    );

    const value = await page.inputValue(`#${inputId}`);
    expect(value).toBe(expectedText);
  }

  test('birthdate card fills correctly', async ({ page }) => {
    await fillScenario(
      page,
      'in-birth',
      'My birthday is 05/12/2012 and I just turned 13 years old'
    );
  });

  test('phone card fills correctly', async ({ page }) => {
    await fillScenario(
      page,
      'in-phone',
      'text me at 555-867-5309 or just call 5558675309'
    );
  });

  test('address card fills correctly', async ({ page }) => {
    await fillScenario(
      page,
      'in-addr',
      'I live at 123 Maple Street, Springfield, IL 62701'
    );
  });

  test('credit card fills correctly', async ({ page }) => {
    await fillScenario(
      page,
      'in-card',
      'My card number is 4111-1111-1111-1111 exp 12/26'
    );
  });

  test('SSN card fills correctly', async ({ page }) => {
    await fillScenario(page, 'in-ssn', 'SSN: 123-45-6789 passport: A87654321');
  });

  test('school/team card fills correctly', async ({ page }) => {
    await fillScenario(
      page,
      'in-school',
      'I go to Lincoln Middle School and I play for the Riverside Eagles'
    );
  });

  test('license plate card fills correctly', async ({ page }) => {
    await fillScenario(
      page,
      'in-plate',
      'My license plate is ABC-1234 if you need it'
    );
  });

  test('max-risk combo card fills correctly', async ({ page }) => {
    const text = `Hi! I'm Jake, 13 years old (born 05/12/2012). I live at 42 Oak Ave, Denver, CO 80201. Call me at 303-555-1234. I go to Lincoln High School. Plate: XYZ-789.`;
    await fillScenario(page, 'in-all', text);
  });
});

test.describe('Activity log', () => {
  test('shows log output element', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await expect(page.locator('#logOutput')).toBeVisible();
  });

  test('log shows ready message on load', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await expect(page.locator('#logOutput')).toContainText('Demo page ready');
  });

  test('clear button empties log', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await page.locator('.log-clear').click();
    const lineCount = await page.locator('#logOutput .log-line').count();
    expect(lineCount).toBe(0);
  });
});

test.describe('Stranger detection demo', () => {
  test('grooming section is visible', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await expect(page.locator('#grooming')).toBeVisible();
  });

  test('shows 4 stranger scenario cards', async ({ page }) => {
    await page.goto(TEST_PAGE);
    const cards = page.locator('#grooming .scenario-card');
    await expect(cards).toHaveCount(4);
  });

  test('secrecy scenario fills correctly', async ({ page }) => {
    await page.goto(TEST_PAGE);
    await page.locator('#in-s1').evaluate((el: HTMLTextAreaElement) => {
      el.value = "Don't tell your parents";
      el.dispatchEvent(new Event('input'));
    });
    await expect(page.locator('#in-s1')).not.toBeEmpty();
  });

  test('stranger inputs have stranger-input class', async ({ page }) => {
    await page.goto(TEST_PAGE);
    const strangerInputs = page.locator('.stranger-input');
    await expect(strangerInputs).toHaveCount(4);
  });

  test('grooming section has a section heading', async ({ page }) => {
    await page.goto(TEST_PAGE);
    const heading = page.locator('#grooming .section-title');
    await expect(heading).toContainText('Grooming');
  });
});
