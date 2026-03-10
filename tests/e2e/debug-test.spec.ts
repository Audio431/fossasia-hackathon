/**
 * Debug test to check if extension is working
 */

import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../build/chrome-mv3-prod');

test('debug: check if extension content scripts are loaded', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Create test page with textarea
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <body>
      <textarea id="test-input" rows="4" cols="50" placeholder="Type here..."></textarea>
      <div id="console-output"></div>
      <script>
        // Intercept console.log to display on page
        const originalLog = console.log;
        const output = document.getElementById('console-output');
        console.log = function(...args) {
          originalLog(...args);
          output.innerHTML += '<div>' + args.join(' ') + '</div>';
        };
      </script>
    </body>
    </html>
  `);

  // Check if Privacy Shadow logs anything
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('Privacy Shadow')) {
      logs.push(msg.text());
      console.log('🔍 Extension log:', msg.text());
    }
  });

  // Type PII and blur
  const input = page.locator('#test-input');
  await input.fill('my address is 123 main street');
  await page.keyboard.press('Tab');

  // Wait for alert
  await page.waitForTimeout(2000);

  console.log('📊 Extension logs found:', logs.length);
  logs.forEach(log => console.log('  -', log));

  // Check if overlay appeared
  const overlay = page.locator('#privacy-shadow-overlay').count();
  console.log('🎯 Overlays found:', overlay);

  // Check if content scripts are loaded
  const contentScripts = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts.map(s => s.src || s.textContent?.substring(0, 100));
  });

  console.log('📜 Scripts on page:', contentScripts.length);

  // Check for data-ps-monitoring attribute
  const hasMonitoring = await input.evaluate(el =>
    el.hasAttribute('data-ps-monitoring')
  );
  console.log('🔒 Input has monitoring attribute:', hasMonitoring);

  // Get all Privacy Shadow related elements
  const psElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('[data-ps-monitoring]');
    return Array.from(elements).map(el => ({
      tag: el.tagName,
      monitoring: el.getAttribute('data-ps-monitoring')
    }));
  });
  console.log('🏷️ Elements with monitoring:', psElements);

  await context.close();
});

test('debug: test PII detection directly', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Go to the actual demo page
  await page.goto('file://' + path.join(__dirname, '../../demo-pages/test.html'));

  // Wait for page to load
  await page.waitForTimeout(2000);

  // Try typing in one of the demo scenarios
  const scenarioInput = page.locator('textarea[placeholder*="Type here"]').first();
  const inputCount = await page.locator('textarea').count();
  console.log('📝 Textareas found:', inputCount);

  // Check extension logs
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('Privacy Shadow')) {
      logs.push(msg.text());
    }
  });

  // Type in first textarea
  if (await scenarioInput.count() > 0) {
    await scenarioInput.fill('my email is test@example.com');
    await page.keyboard.press('Tab');
    await page.waitForTimeout(2000);

    console.log('📊 Extension logs:', logs);

    const alertVisible = await page.locator('#privacy-shadow-overlay').isVisible({ timeout: 1000 }).catch(() => false);
    console.log('🚨 Alert visible:', alertVisible);
  }

  await context.close();
});
