#!/usr/bin/env node

/**
 * Record ML Stranger Detection demo properly
 * Actually captures each scenario's conversation simulation and alerts
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordMLDemoProperly() {
  console.log('🎬 Recording ML Stranger Detection Demo - Proper Version');
  console.log('='.repeat(80));

  const demoPath = path.join(__dirname, '../tests/demo-pages/ML_STRANGER_DEMO.html');

  if (!fs.existsSync(demoPath)) {
    console.error('❌ ML_STRANGER_DEMO.html not found');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: false, // Run non-headless to see what's happening
    slowMo: 1000 // Slow down significantly
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: path.join(__dirname, '../recordings'),
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Track console messages
  page.on('console', msg => {
    if (msg.text().includes('scenario') || msg.text().includes('Scenario')) {
      console.log('📱', msg.text());
    }
  });

  console.log('\n🌐 Loading ML Stranger Detection Demo...\n');
  await page.goto(`file://${demoPath}`, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Wait for React to load
  console.log('⏳ Waiting for React app to fully load (10 seconds)...');
  await page.waitForTimeout(10000);
  console.log('✅ App loaded\n');

  // Take a screenshot of initial state
  await page.screenshot({ path: 'recordings/ml-demo-initial.png' });
  console.log('📸 Screenshot: ml-demo-initial.png');

  // Define scenarios in order
  const scenarios = [
    { title: 'Safe Conversation', description: 'Chatting with known friend' },
    { title: 'Stranger Danger', description: 'New follower asking for info' },
    { title: 'Grooming Pattern', description: 'Escalating inappropriate requests' },
    { title: 'Group Chat', description: 'Unknown person in group' }
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📹 SCENARIO ${i + 1}/${scenarios.length}: ${scenario.title}`);
    console.log(`${'='.repeat(80)}\n`);

    try {
      // Look for and click the scenario button
      console.log(`🔍 Looking for "${scenario.title}" button...`);

      const found = await page.locator('button', { hasText: scenario.title }).first().isVisible({ timeout: 5000 });

      if (!found) {
        console.log('⚠️ Button not visible, trying alternative approach...');

        // Try to find button via JavaScript
        const clicked = await page.evaluate((title) => {
          const buttons = Array.from(document.querySelectorAll('button, div[role="button"]'));
          for (const btn of buttons) {
            if (btn.textContent && btn.textContent.includes(title)) {
              btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => btn.click(), 500);
              return true;
            }
          }
          return false;
        }, scenario.title);

        if (!clicked) {
          console.log(`❌ Could not find "${scenario.title}" button`);
          continue;
        }
      } else {
        // Use Playwright's click
        await page.locator('button', { hasText: scenario.title }).first().click();
      }

      console.log(`✅ Clicked "${scenario.title}"`);

      // Wait for transition
      await page.waitForTimeout(3000);

      // Take screenshot after clicking
      await page.screenshot({ path: `recordings/ml-scenario-${i+1}-clicked.png` });
      console.log(`📸 Screenshot: ml-scenario-${i+1}-clicked.png`);

      // Now wait for conversation to play out
      console.log('⏳ Waiting for conversation simulation (20 seconds)...');

      // Wait for messages to appear and complete
      let prevMessageCount = 0;
      let stableCount = 0;

      for (let w = 0; w < 20; w++) { // Wait up to 20 seconds
        await page.waitForTimeout(1000);

        const messageCount = await page.evaluate(() => {
          // Count message bubbles
          const bubbles = document.querySelectorAll('[class*="bg-"], [class*="rounded"]');
          return Array.from(bubbles).filter(b => b.textContent && b.textContent.trim().length > 5).length;
        });

        console.log(`   Messages: ${messageCount}`);

        if (messageCount === prevMessageCount && messageCount > 0) {
          stableCount++;
          if (stableCount >= 3) {
            console.log('✅ Conversation appears complete');
            break;
          }
        } else {
          stableCount = 0;
          prevMessageCount = messageCount;
        }
      }

      // Wait for alert/analysis to appear
      await page.waitForTimeout(3000);

      // Take screenshot of the alert
      await page.screenshot({ path: `recordings/ml-scenario-${i+1}-alert.png` });
      console.log(`📸 Screenshot: ml-scenario-${i+1}-alert.png`);

      // Wait to see the analysis
      console.log('⏳ Waiting for risk analysis to display...');
      await page.waitForTimeout(5000);

      // Check for action buttons
      const hasActions = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(btn =>
          btn.textContent?.includes('Block') ||
          btn.textContent?.includes('Report') ||
          btn.textContent?.includes('Know Them')
        );
      });

      if (hasActions) {
        console.log('✅ Action buttons detected');
        await page.waitForTimeout(3000);
      }

    } catch (error) {
      console.log(`❌ Error with "${scenario.title}":`, error.message);
    }

    // Go back to scenario selection (except for last scenario)
    if (i < scenarios.length - 1) {
      console.log('\n⬅️ Returning to scenario selection...');

      try {
        // Try multiple selectors for back button
        const wentBack = await page.evaluate(() => {
          // Look for back button with arrow
          const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
          for (const btn of buttons) {
            if (btn.textContent?.includes('Back') ||
                btn.textContent?.includes('←') ||
                btn.textContent?.includes('scenarios')) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        if (wentBack) {
          console.log('✅ Returned to scenario selection');
          await page.waitForTimeout(3000);
        } else {
          console.log('⚠️ Could not find back button');
        }
      } catch (e) {
        console.log('⚠️ Error going back:', e.message);
      }
    }
  }

  // Final pause
  console.log('\n⏳ Final pause before ending recording...');
  await page.waitForTimeout(3000);

  await context.close();
  await browser.close();

  console.log('\n✅ Recording complete!\n');

  // Convert video
  const recordingsDir = path.join(__dirname, '../recordings');
  const files = fs.readdirSync(recordingsDir);
  const videoFile = files.find(f => f.endsWith('.webm'));

  if (videoFile) {
    const videoPath = path.join(recordingsDir, videoFile);
    const newWebmPath = path.join(recordingsDir, '02-ml-stranger-detection.webm');
    const newMp4Path = path.join(recordingsDir, '02-ml-stranger-detection.mp4');

    if (fs.existsSync(newMp4Path)) {
      fs.unlinkSync(newMp4Path);
    }

    fs.renameSync(videoPath, newWebmPath);
    console.log('🔄 Converting to MP4...');

    try {
      const { execSync } = require('child_process');
      execSync(`ffmpeg -y -i "${newWebmPath}" -c:v libx264 -c:a aac -movflags +faststart "${newMp4Path}"`, {
        stdio: 'inherit',
        timeout: 90000
      });

      fs.unlinkSync(newWebmPath);
      console.log('\n✅ MP4 created successfully');
      console.log('\n📁 Videos and screenshots:');
      console.log('   📹 recordings/02-ml-stranger-detection.mp4');
      console.log('   📸 recordings/ml-demo-initial.png');
      console.log('   📸 recordings/ml-scenario-*-clicked.png');
      console.log('   📸 recordings/ml-scenario-*-alert.png');
    } catch (error) {
      console.log('\n⚠️ ffmpeg conversion failed');
      console.log('📁 WebM: recordings/02-ml-stranger-detection.webm');
    }
  }
}

recordMLDemoProperly().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
