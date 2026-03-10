/**
 * E2E Test for WhatsApp Parent Alert Integration
 * Demonstrates the complete flow from PII detection to WhatsApp notification
 */

import { test, expect, chromium } from '@playwright/test';
import { createServer } from 'http';

const EXTENSION_PATH = __dirname + '/../../build/chrome-mv3-prod';

const TEST_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <title>WhatsApp Integration Test</title>
  <style>
    body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    textarea { width: 100%; height: 80px; padding: 10px; font-size: 16px; border: 2px solid #333; margin-bottom: 10px; }
    .log { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px; font-family: monospace; font-size: 12px; }
    .log-entry { margin: 5px 0; padding: 5px; border-left: 3px solid #3b82f6; padding-left: 10px; }
    .success { border-left-color: #22c55e; background: #dcfce7; }
    .alert { border-left-color: #ef4444; background: #fef2f2; }
  </style>
</head>
<body>
  <h1>📱 WhatsApp Parent Alert Test</h1>

  <div>
    <label><strong>Test PII Detection:</strong></label>
    <textarea id="test-input" placeholder="Type: my address is 123 main street"></textarea>
    <button onclick="testHighAlert()">Test High Alert</button>
    <button onclick="testCriticalAlert()">Test Critical Alert</button>
    <button onclick="clearLogs()">Clear Logs</button>
  </div>

  <div id="logs" class="log"></div>

  <script>
    // Intercept console.log to display on page
    const originalLog = console.log;
    const logsDiv = document.getElementById('logs');

    console.log = function(...args) {
      originalLog(...args);

      const message = args.join(' ');
      const isWhatsApp = message.includes('WhatsApp');
      const isSuccess = message.includes('success') || message.includes('sent');

      const entry = document.createElement('div');
      entry.className = 'log-entry' + (isWhatsApp ? ' alert' : '') + (isSuccess ? ' success' : '');
      entry.textContent = '📋 ' + message;
      logsDiv.appendChild(entry);

      // Auto-scroll
      logsDiv.scrollTop = logsDiv.scrollHeight;
    };

    async function testHighAlert() {
      const input = document.getElementById('test-input');
      input.value = 'my address is 123 main street';

      // Trigger blur
      input.blur();
      input.dispatchEvent(new Event('blur', { bubbles: true }));

      await new Promise(r => setTimeout(r, 1000));
    }

    async function testCriticalAlert() {
      const input = document.getElementById('test-input');
      input.value = 'my ssn is 123-45-6789 and I live at 123 main street';

      // Trigger blur
      input.blur();
      input.dispatchEvent(new Event('blur', { bubbles: true }));

      await new Promise(r => setTimeout(r, 1000));
    }

    function clearLogs() {
      logsDiv.innerHTML = '';
    }
  </script>
</body>
</html>
`;

test('WhatsApp Parent Alert Integration', async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(TEST_PAGE);
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  console.log('🚀 Test server running on:', baseUrl);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Collect WhatsApp-related logs
  const whatsappLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('WhatsApp') || text.includes('whatsapp')) {
      whatsappLogs.push(text);
      console.log('📱 WhatsApp Log:', text);
    }
  });

  await page.goto(baseUrl);

  console.log('📋 Testing WhatsApp Integration...');

  // Test 1: High alert
  console.log('\n🧪 Test 1: High Alert (address)');
  await page.click('button:text("Test High Alert")');
  await page.waitForTimeout(2000);

  // Check for WhatsApp logs
  const highAlertLogs = whatsappLogs.filter(log =>
    log.includes('Alert') || log.includes('Demo')
  );

  console.log('High Alert Logs:', highAlertLogs.length);
  expect(highAlertLogs.length).toBeGreaterThan(0);

  // Test 2: Critical alert
  console.log('\n🧪 Test 2: Critical Alert (SSN + address)');
  await page.click('button:text("Test Critical Alert")');
  await page.waitForTimeout(2000);

  const criticalAlertLogs = whatsappLogs.filter(log =>
    log.includes('critical') || log.includes('🚨')
  );

  console.log('Critical Alert Logs:', criticalAlertLogs.length);
  expect(criticalAlertLogs.length).toBeGreaterThan(0);

  // Summary
  console.log('\n📊 WhatsApp Integration Test Results:');
  console.log('Total WhatsApp logs:', whatsappLogs.length);
  console.log('High alerts detected:', highAlertLogs.length);
  console.log('Critical alerts detected:', criticalAlertLogs.length);

  // Keep browser open for manual inspection
  console.log('\n🔍 Browser will stay open for 10 seconds for manual inspection...');
  await page.waitForTimeout(10000);

  await context.close();
  server.close();
});
