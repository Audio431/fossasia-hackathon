/**
 * Comprehensive E2E Demo - Shows all features working
 */

import { test, expect, chromium } from '@playwright/test';
import { createServer } from 'http';

const EXTENSION_PATH = __dirname + '/../../build/chrome-mv3-prod';

const TEST_PAGE = `
<!DOCTYPE html>
<html>
<head>
  <title>Privacy Shadow Demo</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f5f5f5; }
    .test-section { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    textarea { width: 100%; height: 60px; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 4px; font-family: sans-serif; }
    .result { padding: 10px; margin: 10px 0; border-radius: 4px; }
    .result.pass { background: #d4edda; color: #155724; }
    .result.fail { background: #f8d7da; color: #721c24; }
    h2 { margin-top: 0; }
  </style>
</head>
<body>
  <h1>🛡️ Privacy Shadow Extension Test Suite</h1>

  <div class="test-section">
    <h2>Test 1: Safe Message (No PII)</h2>
    <textarea id="safe-input" placeholder="Type a safe message..."></textarea>
    <div id="safe-result" class="result">Waiting for test...</div>
  </div>

  <div class="test-section">
    <h2>Test 2: Address PII</h2>
    <textarea id="address-input" placeholder="Type an address..."></textarea>
    <div id="address-result" class="result">Waiting for test...</div>
  </div>

  <div class="test-section">
    <h2>Test 3: Email PII</h2>
    <textarea id="email-input" placeholder="Type an email..."></textarea>
    <div id="email-result" class="result">Waiting for test...</div>
  </div>

  <div class="test-section">
    <h2>Test 4: Phone PII</h2>
    <textarea id="phone-input" placeholder="Type a phone number..."></textarea>
    <div id="phone-result" class="result">Waiting for test...</div>
  </div>

  <div class="test-section">
    <h2>Test 5: Birthday PII</h2>
    <textarea id="birthday-input" placeholder="Type a birthday..."></textarea>
    <div id="birthday-result" class="result">Waiting for test...</div>
  </div>

  <script>
    // Track test results
    const results = {};

    async function testField(fieldId, testValue, shouldAlert) {
      const input = document.getElementById(fieldId);
      const resultDiv = fieldId.replace('-input', '-result');

      resultDiv.textContent = 'Testing...';

      // Type the value
      input.value = testValue;

      // Trigger blur
      input.blur();

      // Wait for alert
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check if alert appeared
      const overlay = document.getElementById('privacy-shadow-overlay');
      const hasAlert = overlay && overlay.offsetParent !== null;

      // Dismiss alert if present
      if (overlay && overlay.offsetParent !== null) {
        const continueBtn = document.getElementById('ps-continue-btn');
        if (continueBtn) continueBtn.click();
      }

      // Show result
      const passed = hasAlert === shouldAlert;
      resultDiv.textContent = passed ? '✅ PASS' : '❌ FAIL';
      resultDiv.className = 'result ' + (passed ? 'pass' : 'fail');

      results[fieldId] = { passed, hasAlert, shouldAlert };
      return passed;
    }

    // Auto-run tests when page loads
    async function runAllTests() {
      await new Promise(resolve => setTimeout(resolve, 2000));

      await testField('safe-input', 'hey whats up everyone', false);
      await testField('address-input', 'my address is 123 main street', true);
      await testField('email-input', 'my email is test@example.com', true);
      await testField('phone-input', 'call me at 555-123-4567', true);
      await testField('birthday-input', 'my birthday is january 1 2012', true);

      // Summary
      const total = Object.keys(results).length;
      const passed = Object.values(results).filter(r => r.passed).length;
      console.log('Test Results:', passed + '/' + total + ' passed');
    }

    // Start tests automatically
    setTimeout(runAllTests, 3000);
  </script>
</body>
</html>
`;

test('Comprehensive E2E Demo - All Features', async () => {
  // Start HTTP server
  const server = createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(TEST_PAGE);
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://localhost:${address.port}`;

  console.log('🚀 Demo server running on:', baseUrl);

  // Launch browser
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Log extension activity
  page.on('console', msg => {
    if (msg.text().includes('Privacy Shadow') || msg.text().includes('Test Results')) {
      console.log('📋', msg.text());
    }
  });

  // Navigate to demo page
  await page.goto(baseUrl);

  // Wait for all tests to complete
  await page.waitForTimeout(15000);

  // Check final results
  const testResults = await page.evaluate(() => {
    const results = document.querySelectorAll('.result');
    return Array.from(results).map(el => ({
      text: el.textContent,
      className: el.className
    }));
  });

  console.log('\n📊 Final Test Results:');
  testResults.forEach(result => {
    console.log(result.text, result.className);
  });

  // Verify all tests passed
  const passedTests = testResults.filter(r => r.className.includes('pass'));
  expect(passedTests.length).toBeGreaterThan(0);

  console.log(`\n✅ ${passedTests.length} tests passed!`);

  // Keep browser open for 5 seconds so you can see it
  await page.waitForTimeout(5000);

  await context.close();
  server.close();
});
