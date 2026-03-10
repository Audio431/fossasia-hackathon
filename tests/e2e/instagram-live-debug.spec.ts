import { test, expect, chromium } from '@playwright/test';

/**
 * LIVE DEBUG TEST - Opens Chrome with the extension and lets you interact with Instagram
 * This test keeps the browser open so you can manually test and see console logs
 */

test.extend({
  context: async ({ }, use) => {
    const pathToExtension = require('path').join(__dirname, '../../build/chrome-mv3-prod');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
});

test('Instagram Live Debug - Manual Testing', async ({ page, context }) => {
  console.log('🚀 Launching Chrome with Privacy Shadow extension...');

  // Set up console logging to capture extension messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);

    // Highlight Privacy Shadow messages
    if (text.includes('Privacy Shadow')) {
      console.log('📱 EXTENSION:', text);
    }
  });

  // Navigate to Instagram
  console.log('📸 Navigating to Instagram...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle' });

  console.log('⏸️  Browser is now open and waiting for you to interact!');
  console.log('');
  console.log('📋 INSTRUCTIONS:');
  console.log('1. Log in to Instagram if needed');
  console.log('2. Navigate to DMs (click messenger icon)');
  console.log('3. Click on ANY conversation to open it');
  console.log('4. Open DevTools (F12) → Console tab');
  console.log('5. Type in the message input: "my address is 123 main street"');
  console.log('6. Click outside the input field');
  console.log('7. Watch for Privacy Shadow alerts in console and on screen');
  console.log('');
  console.log('⏳ Waiting 5 minutes for manual testing...');
  console.log('🔍 Checking console for Privacy Shadow messages every 10 seconds...');
  console.log('');

  // Keep checking console logs
  let lastLogCount = 0;
  for (let i = 0; i < 30; i++) { // 5 minutes of checking
    await page.waitForTimeout(10000); // Wait 10 seconds

    const newLogs = consoleLogs.slice(lastLogCount);
    if (newLogs.length > 0) {
      console.log(`📊 Console update (${new Date().toLocaleTimeString()}):`);

      // Show Privacy Shadow logs
      const psLogs = newLogs.filter(log => log.includes('Privacy Shadow'));
      if (psLogs.length > 0) {
        console.log('✨ Privacy Shadow activity detected!');
        psLogs.forEach(log => console.log('   ', log));
      }

      lastLogCount = consoleLogs.length;
    }
  }

  console.log('✅ Test session complete!');
  console.log('');
  console.log('📈 SUMMARY:');
  console.log('Total console messages:', consoleLogs.length);
  console.log('Privacy Shadow messages:', consoleLogs.filter(l => l.includes('Privacy Shadow')).length);
});
