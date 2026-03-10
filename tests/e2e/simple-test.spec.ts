/**
 * Simple E2E test with built-in HTTP server
 */

import { test, expect, chromium } from '@playwright/test';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import path from 'path';

const EXTENSION_PATH = path.join(__dirname, '../../build/chrome-mv3-prod');

// Simple HTML pages for testing
const INSTAGRAM_DM_PAGE = `
<!DOCTYPE html>
<html>
<head><title>Instagram DM Test</title>
<style>
  body { font-family: sans-serif; padding: 20px; }
  textarea { width: 100%; height: 100px; padding: 10px; margin: 10px 0; }
</style>
</head>
<body>
  <h1>Instagram DM</h1>
  <textarea id="message-input" placeholder="Message..."></textarea>
  <button onclick="sendMessage()">Send</button>
  <div id="messages"></div>
  <script>
    function sendMessage() {
      const input = document.getElementById('message-input');
      const msg = input.value;
      if (msg) {
        document.getElementById('messages').innerHTML += '<p>' + msg + '</p>';
        input.value = '';
      }
    }
  </script>
</body>
</html>
`;

test('extension works on http://localhost', async () => {
  // Start a simple HTTP server
  const server = createServer((req, res) => {
    if (req.url === '/' || req.url === '/instagram-dm') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(INSTAGRAM_DM_PAGE);
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  console.log('🚀 Test server running on:', baseUrl);

  // Launch browser with extension
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  // Collect extension logs
  const logs: string[] = [];
  const page = await context.newPage();
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Privacy Shadow') || text.includes('privacy')) {
      logs.push(text);
      console.log('📋 Extension log:', text);
    }
  });

  // Navigate to test page
  await page.goto(baseUrl + '/instagram-dm');

  // Wait for extension to load
  await page.waitForTimeout(2000);

  console.log('📊 Initial logs:', logs.length);
  logs.forEach(l => console.log('  -', l));

  // Test 1: Type safe message
  console.log('\n🧪 Test 1: Type safe message');
  await page.locator('#message-input').fill('hey whats up');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000);

  let alertVisible = await page.locator('#privacy-shadow-overlay').isVisible({ timeout: 500 }).catch(() => false);
  console.log('  Alert visible:', alertVisible);
  expect(alertVisible).toBe(false);

  // Test 2: Type PII (address)
  console.log('\n🧪 Test 2: Type PII (address)');
  await page.locator('#message-input').fill('my address is 123 main street');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(1000);

  alertVisible = await page.locator('#privacy-shadow-overlay').isVisible({ timeout: 1000 }).catch(() => false);
  console.log('  Alert visible:', alertVisible);

  if (alertVisible) {
    console.log('  ✅ SUCCESS: Alert shown for PII!');
    const alertText = await page.locator('#privacy-shadow-overlay').textContent();
    console.log('  Alert text:', alertText?.substring(0, 200));
  } else {
    console.log('  ❌ FAIL: No alert shown for PII!');
    console.log('  Logs after PII:', logs.length);
    logs.forEach(l => console.log('    -', l));
  }

  expect(alertVisible).toBe(true);

  // Cleanup
  await context.close();
  server.close();
});

test('check if content scripts are actually injected', async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(INSTAGRAM_DM_PAGE);
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Enable Playwright to see all console messages
  page.on('console', msg => console.log('Page console:', msg.text()));

  await page.goto(baseUrl);

  // Wait a bit for scripts to load
  await page.waitForTimeout(3000);

  // Check for our monitoring attribute
  const monitoredElements = await page.evaluate(() => {
    const monitored = document.querySelectorAll('[data-ps-monitoring]');
    return {
      count: monitored.length,
      elements: Array.from(monitored).map(el => ({
        tag: el.tagName,
        monitoring: el.getAttribute('data-ps-monitoring')
      }))
    };
  });

  console.log('🔍 Monitored elements:', monitoredElements);

  // Check extension logs
  const logs: string[] = [];
  page.on('console', msg => {
    if (msg.text().includes('Privacy Shadow')) {
      logs.push(msg.text());
    }
  });

  await page.waitForTimeout(1000);

  console.log('📋 Extension console logs:', logs);

  await context.close();
  server.close();
});
