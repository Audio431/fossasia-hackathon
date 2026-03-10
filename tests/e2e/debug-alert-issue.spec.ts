/**
 * Quick debug test to check why alerts aren't showing
 */

import { test, expect, chromium } from '@playwright/test';
import { createServer } from 'http';

const EXTENSION_PATH = __dirname + '/../../build/chrome-mv3-prod';

const TEST_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <title>Debug Test</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    textarea { width: 100%; height: 80px; padding: 10px; font-size: 16px; border: 2px solid #333; }
    .status { padding: 10px; margin: 10px 0; border-radius: 4px; font-weight: bold; }
    .status.info { background: #d1ecf1; color: #0c5460; }
    .status.success { background: #d4edda; color: #155724; }
    .status.error { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>🔍 Privacy Shadow Debug Test</h1>

  <div>
    <label>Type PII and press Tab:</label><br><br>
    <textarea id="test-input" placeholder="Type here..."></textarea>
  </div>

  <div id="status" class="status info">Waiting for test...</div>

  <div id="console-output"></div>

  <script>
    // Intercept all console logs
    const originalLog = console.log;
    const output = document.getElementById('console-output');
    console.log = function(...args) {
      originalLog(...args);
      const line = document.createElement('div');
      line.textContent = '📋 ' + args.join(' ');
      output.appendChild(line);
    };

    // Test function
    async function runTest() {
      const status = document.getElementById('status');
      const input = document.getElementById('test-input');

      // Wait for extension to fully initialize
      await new Promise(r => setTimeout(r, 3000));

      // Check if element is monitored
      const isMonitored = input.hasAttribute('data-ps-monitoring');
      console.log('🔍 Element monitored?', isMonitored);

      status.textContent = 'Typing PII...';
      status.className = 'status info';

      // Type PII
      input.value = 'my address is 123 main street';
      console.log('📝 Value set:', input.value);

      // Wait and blur
      await new Promise(r => setTimeout(r, 500));
      console.log('🔍 About to blur...');

      // Try both blur() and dispatchEvent
      input.blur();
      input.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));
      console.log('✅ Blur called and event dispatched');

      status.textContent = 'Waiting for alert...';
      await new Promise(r => setTimeout(r, 4000));

      // Check for alert
      const overlay = document.getElementById('privacy-shadow-overlay');
      console.log('🔍 Alert element:', overlay ? 'exists' : 'missing');
      console.log('🔍 offsetParent:', overlay?.offsetParent);
      console.log('🔍 display:', overlay?.style?.display);

      // For position: fixed elements, check getBoundingClientRect instead of offsetParent
      const isVisible = overlay && overlay.getBoundingClientRect().width > 0;
      console.log('🔍 visible:', isVisible);

      await new Promise(r => setTimeout(r, 100)); // Small delay to ensure DOM updates

      if (isVisible) {
        status.textContent = '✅ SUCCESS: Alert appeared!';
        status.className = 'status success';
        console.log('✅ Status updated to SUCCESS');
      } else {
        status.textContent = '❌ FAIL: No alert appeared';
        status.className = 'status error';
        console.log('❌ Status updated to FAIL');
      }
    }

    // Auto-run test after extension loads
    setTimeout(runTest, 3000);
  </script>
</body>
</html>
`;

test('Debug: Check why alerts stopped working', async () => {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(TEST_PAGE);
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  console.log('🚀 Debug server running on:', baseUrl);

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Collect ALL logs
  const allLogs: string[] = [];
  page.on('console', msg => {
    allLogs.push(msg.text());
    console.log('Browser console:', msg.text());
  });

  await page.goto(baseUrl);

  // Wait for test to complete
  await page.waitForTimeout(12000);

  // Check final status
  const status = await page.locator('#status').textContent();
  const consoleOutput = await page.locator('#console-output').textContent();

  console.log('\n📊 Final Status:', status);
  console.log('📋 Console Output:', consoleOutput);
  console.log('📋 All Extension Logs:', allLogs.filter(l => l.includes('Privacy')));

  // Look for issues
  console.log('\n🔍 Checking for issues...');

  const issues = [];

  // Check if extension loaded
  const privacyLogs = allLogs.filter(l => l.includes('Privacy Shadow'));
  if (privacyLogs.length === 0) {
    issues.push('❌ Extension not loading');
  } else {
    console.log('✅ Extension loaded:', privacyLogs.length, 'logs');
  }

  // Check for monitored element
  const monitoredElements = await page.evaluate(() => {
    const monitored = document.querySelectorAll('[data-ps-monitoring]');
    return {
      count: monitored.length,
      details: Array.from(monitored).map(el => ({
        tag: el.tagName,
        monitoring: el.getAttribute('data-ps-monitoring')
      }))
    };
  });

  console.log('🔍 Monitored elements:', monitoredElements);
  if (monitoredElements.count === 0) {
    issues.push('❌ No elements being monitored');
  }

  // Check if alert exists
  const alertExists = await page.evaluate(() => {
    const overlay = document.getElementById('privacy-shadow-overlay');
    return overlay !== null;
  });

  console.log('🎯 Alert element exists:', alertExists);

  // Summary
  if (issues.length > 0) {
    console.log('\n⚠️ Issues Found:');
    issues.forEach(issue => console.log(issue));
  } else {
    console.log('\n✅ Everything looks correct!');
  }

  await page.waitForTimeout(5000);
  await context.close();
  server.close();
});
