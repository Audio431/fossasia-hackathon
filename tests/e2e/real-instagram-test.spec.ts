/**
 * Test Privacy Shadow against REAL Instagram
 */

import { test, expect, chromium } from '@playwright/test';

const EXTENSION_PATH = __dirname + '/../../build/chrome-mv3-prod';

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  // Make sure extension is built
  const { execSync } = require('child_process');
  try {
    execSync('npm run build', { cwd: __dirname + '/../..' });
  } catch (e) {
    console.log('Build already done or failed, continuing...');
  }
});

test('Instagram DM - Real Website Test', async () => {
  console.log('🚀 Launching Chrome with Privacy Shadow extension...');

  const context = await chromium.launchPersistentContext('', {
    headless: false, // Show browser
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Collect extension logs
  const logs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Privacy Shadow') || text.includes('privacy')) {
      logs.push(text);
      console.log('📋 Extension:', text);
    }
  });

  console.log('🌐 Navigating to Instagram...');

  // Navigate to Instagram
  try {
    await page.goto('https://www.instagram.com/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    console.log('✅ Instagram loaded');

    // Wait for page to stabilize
    await page.waitForTimeout(3000);

    // Check if extension is active
    console.log('🔍 Checking extension status...');
    console.log('📊 Extension logs collected:', logs.length);
    console.log('Logs:', logs);

    // Look for Instagram DM input
    console.log('🔍 Looking for Instagram DM elements...');

    // Instagram DM button in top nav
    const dmButtonSelectors = [
      'a[href="/direct/t/"]',
      'svg[aria-label="Messenger"]',
      'a[href*="direct"]'
    ];

    let dmButtonFound = false;
    for (const selector of dmButtonSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Found DM button with selector: ${selector}`);
          dmButtonFound = true;
          break;
        }
      } catch (e) {
        // Selector not found, try next
      }
    }

    if (!dmButtonFound) {
      console.log('⚠️  DM button not found (might need to login)');
      console.log('📝 Note: Instagram requires login to access DMs');
    } else {
      console.log('💡 You would need to login to Instagram to test DMs');
    }

    // Check if any inputs are being monitored
    const monitoredInfo = await page.evaluate(() => {
      const inputs = document.querySelectorAll('textarea, input[type="text"], div[contenteditable="true"]');
      const monitored = Array.from(inputs).filter(el =>
        el instanceof HTMLElement && el.hasAttribute('data-ps-monitoring')
      );

      return {
        totalInputs: inputs.length,
        monitoredCount: monitored.length,
        monitoredDetails: Array.from(monitored).map(el => ({
          tag: el.tagName,
          monitoring: el.getAttribute('data-ps-monitoring')
        }))
      };
    });

    console.log('🔍 Input monitoring status:');
    console.log(`   Total inputs found: ${monitoredInfo.totalInputs}`);
    console.log(`   Monitored inputs: ${monitoredInfo.monitoredCount}`);
    console.log(`   Details:`, monitoredInfo.monitoredDetails);

    // Check for textareas (Instagram uses these for DMs)
    const textareas = await page.locator('textarea').count();
    console.log(`📝 Textareas found: ${textareas}`);

    if (textareas > 0) {
      console.log('✅ Found textarea inputs (Instagram DMs use textareas)');

      // Try to find and interact with a textarea
      const firstTextarea = page.locator('textarea').first();

      if (await firstTextarea.isVisible()) {
        console.log('🧪 Testing PII detection on Instagram textarea...');

        // Type PII and trigger blur
        await firstTextarea.fill('my address is 123 main street springfield illinois');
        await page.waitForTimeout(500);
        await firstTextarea.blur(); // Trigger blur
        await page.waitForTimeout(2000); // Wait for alert

        // Check if alert appeared
        const alertVisible = await page.locator('#privacy-shadow-overlay').isVisible({ timeout: 1000 }).catch(() => false);

        if (alertVisible) {
          console.log('✅ SUCCESS! Alert appeared on real Instagram!');

          const alertText = await page.locator('#privacy-shadow-overlay').textContent();
          console.log('Alert text preview:', alertText?.substring(0, 200));
        } else {
          console.log('⚠️  No alert appeared - might need to be logged in');
        }
      } else {
        console.log('⚠️  Textarea found but not visible (might need login)');
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Extension logs: ${logs.length}`);
    console.log(`   Content scripts loaded: ${logs.filter(l => l.includes('active')).length}`);
    console.log(`   Inputs monitored: ${monitoredInfo.monitoredCount}/${monitoredInfo.totalInputs}`);

  } catch (error) {
    console.error('❌ Error navigating to Instagram:', error);
    console.log('💡 Note: Instagram might be blocking automated access');
    console.log('💡 Try manually: Go to instagram.com and test in person');
  }

  // Keep browser open for manual testing
  console.log('\n🔍 Browser will stay open for 30 seconds for manual testing...');
  console.log('💡 Try: Navigate to DMs and type "my address is 123 main street"');

  await page.waitForTimeout(30000);

  await context.close();
});

test('Instagram - Manual Testing Guide', async () => {
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  const page = await context.newPage();

  // Create a helpful guide page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Privacy Shadow - Instagram Test Guide</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .container { max-width: 800px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 40px; border-radius: 20px; backdrop-filter: blur(10px); }
        h1 { font-size: 2.5em; margin-bottom: 20px; }
        .step { background: rgba(255,255,255,0.15); padding: 20px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #fff; }
        .step h3 { margin-top: 0; }
        code { background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px; }
        .test-box { background: #fff; color: #333; padding: 20px; border-radius: 8px; margin: 20px 0; }
        textarea { width: 100%; height: 60px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
        .button { display: inline-block; padding: 12px 24px; background: #0095f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🛡️ Privacy Shadow - Instagram Test Guide</h1>

        <div class="step">
          <h3>Step 1: Open Instagram</h3>
          <p>Click the button below to open Instagram in a new tab:</p>
          <a href="https://www.instagram.com/" target="_blank" class="button">🚀 Open Instagram</a>
          <p><strong>⚠️ Note:</strong> You'll need to login to access DMs</p>
        </div>

        <div class="step">
          <h3>Step 2: Navigate to DMs</h3>
          <p>Click the Messenger icon (✈️) in the top right corner</p>
          <p>Or go directly to: <code>instagram.com/direct/inbox/</code></p>
        </div>

        <div class="step">
          <h3>Step 3: Test PII Detection</h3>
          <p>In any DM chat, try typing:</p>
          <div class="test-box">
            <p><strong>Test 1 - Address:</strong></p>
            <textarea readonly>my address is 123 main street springfield illinois 62701</textarea>
            <p><em>Copy this, paste in DM, then click outside</em></p>
          </div>

          <div class="test-box">
            <p><strong>Test 2 - Email:</strong></p>
            <textarea readonly>my email is myname@gmail.com</textarea>
            <p><em>Copy this, paste in DM, then click outside</em></p>
          </div>

          <div class="test-box">
            <p><strong>Test 3 - Phone:</strong></p>
            <textarea readonly>call me at 555-123-4567</textarea>
            <p><em>Copy this, paste in DM, then click outside</em></p>
          </div>
        </div>

        <div class="step">
          <h3>What Should Happen</h3>
          <ul>
            <li>✅ Alert appears with ⚠️ icon</li>
            <li>✅ Shows "Wait!" or "Stop!" title</li>
            <li>✅ Lists detected PII type</li>
            <li>✅ Has "Send Anyway" and "Nevermind" buttons</li>
          </ul>
        </div>

        <div class="step">
          <h3>Expected Alerts</h3>
          <table style="width: 100%; border-collapse: collapse; background: rgba(255,255,255,0.1);">
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.3);">
              <th style="padding: 10px; text-align: left;">PII Type</th>
              <th style="padding: 10px; text-align: left;">Alert Title</th>
              <th style="padding: 10px; text-align: left;">Risk Level</th>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.3);">
              <td style="padding: 10px;">Address</td>
              <td style="padding: 10px;">Wait!</td>
              <td style="padding: 10px;">High (30/100)</td>
            </tr>
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.3);">
              <td style="padding: 10px;">Email</td>
              <td style="padding: 10px;">Wait!</td>
              <td style="padding: 10px;">High (30/100)</td>
            </tr>
            <tr>
              <td style="padding: 10px;">Phone</td>
              <td style="padding: 10px;">Wait!</td>
              <td style="padding: 10px;">High (30/100)</td>
            </tr>
          </table>
        </div>

        <div class="step">
          <h3>💡 Troubleshooting</h3>
          <p><strong>No alert appearing?</strong></p>
          <ul>
            <li>Make sure extension is enabled in chrome://extensions/</li>
            <li>Reload the extension (click 🔄)</li>
            <li>Make sure you click OUTSIDE the textarea (blur)</li>
            <li>Check browser console for "Privacy Shadow" logs</li>
          </ul>
        </div>
      </div>

      <script>
        // Auto-redirect after 10 seconds
        setTimeout(() => {
          console.log('📝 You can now test manually on Instagram');
          console.log('💡 The extension should be active and monitoring');
        }, 10000);
      </script>
    </body>
    </html>
  `);

  console.log('📖 Manual testing guide loaded');
  console.log('🔍 Browser will stay open for manual testing');

  // Keep open for manual testing
  await page.waitForTimeout(60000);

  await context.close();
});
