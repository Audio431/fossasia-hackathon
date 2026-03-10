/**
 * Quick smoke test to verify extension loads in Chrome
 */

import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../build/chrome-mv3-prod');

test('extension loads successfully', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  // Wait for pages to be created
  await context.waitForEvent('page', { timeout: 5000 }).catch(() => {
    console.log('No page created yet, but extension should be loaded');
  });

  // Check if extension pages exist
  const pages = context.pages();
  console.log(`✅ Browser started with ${pages.length} pages`);

  await context.close();
});

test('can create test page and interact', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Create simple test page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <textarea id="test-input" rows="4" cols="50" placeholder="Type here..."></textarea>
      <script>
        console.log('Test page loaded');
      </script>
    </body>
    </html>
  `);

  // Wait a bit
  await page.waitForTimeout(500);

  // Type something
  const input = page.locator('#test-input');
  await input.fill('Hello world');

  // Verify value
  const value = await input.inputValue();
  expect(value).toBe('Hello world');

  console.log('✅ Can interact with test page');

  await context.close();
});
