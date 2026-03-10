#!/usr/bin/env node

/**
 * Record ML Stranger Detection demo with all scenarios
 * Clicks through each demo scenario to show full functionality
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordMLStrangerScenarios() {
  console.log('🎬 Recording ML Stranger Detection - All Scenarios');
  console.log('='.repeat(80));

  const demoPath = path.join(__dirname, '../tests/demo-pages/ML_STRANGER_DEMO.html');

  if (!fs.existsSync(demoPath)) {
    console.error('❌ ML_STRANGER_DEMO.html not found');
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 500
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: path.join(__dirname, '../recordings'),
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log('\n🌐 Loading ML Stranger Detection Demo...\n');
  await page.goto(`file://${demoPath}`, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Wait for React to fully load
  console.log('⏳ Waiting for React app to load...');
  await page.waitForTimeout(3000);
  console.log('✅ Demo loaded\n');

  // Define the scenarios
  const scenarios = [
    { title: 'Safe Conversation', icon: '🛡️', id: 'safe-conversation' },
    { title: 'Stranger Danger', icon: '⚠️', id: 'stranger-danger' },
    { title: 'Grooming Pattern', icon: '🚨', id: 'grooming-pattern' },
    { title: 'Group Chat', icon: '👥', id: 'group-chat' }
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];

    console.log(`📹 Scenario ${i + 1}/${scenarios.length}: ${scenario.icon} ${scenario.title}`);
    console.log('-'.repeat(60));

    try {
      // Wait for buttons to be visible
      await page.waitForTimeout(1000);

      // Click the scenario button
      const buttonClicked = await page.evaluate((scenarioTitle) => {
        // Find all buttons
        const buttons = Array.from(document.querySelectorAll('button'));

        // Find button with the scenario title
        const targetButton = buttons.find(btn => {
          const text = btn.textContent || '';
          return text.includes(scenarioTitle) && text.trim().length > 0;
        });

        if (targetButton) {
          targetButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetButton.click();
          return true;
        }
        return false;
      }, scenario.title);

      if (buttonClicked) {
        console.log(`✅ Clicked "${scenario.title}" button`);

        // Wait for simulation to start
        await page.waitForTimeout(2000);

        // Wait for conversation simulation to complete
        // Check for messages appearing
        console.log('⏳ Waiting for conversation simulation...');

        let messageCount = 0;
        let lastCount = 0;
        let noChangeCount = 0;

        // Wait up to 15 seconds for messages, checking every 500ms
        for (let wait = 0; wait < 30; wait++) {
          await page.waitForTimeout(500);

          messageCount = await page.evaluate(() => {
            // Count messages in the conversation
            const messages = document.querySelectorAll('[class*="message"], [class*="Message"]');
            return messages.length;
          });

          if (messageCount > lastCount) {
            lastCount = messageCount;
            noChangeCount = 0;
          } else {
            noChangeCount++;
          }

          // If no new messages for 3 seconds (6 checks), simulation is done
          if (noChangeCount >= 6 && messageCount > 0) {
            console.log(`✅ Conversation complete (${messageCount} messages)`);
            break;
          }
        }

        // Wait for the alert/analysis to appear
        await page.waitForTimeout(2000);

        // Check if there's an alert overlay
        const hasAlert = await page.evaluate(() => {
          const alerts = document.querySelectorAll('[class*="alert"], [class*="Alert"]');
          return alerts.length > 0;
        });

        if (hasAlert) {
          console.log('✅ Risk alert displayed');

          // Wait a bit to see the alert details
          await page.waitForTimeout(3000);
        }

        // Look for feature breakdown
        const hasFeatures = await page.evaluate(() => {
          const features = document.querySelectorAll('[class*="feature"], [class*="Feature"]');
          return features.length > 0;
        });

        if (hasFeatures) {
          console.log('✅ Feature breakdown displayed');
          await page.waitForTimeout(2000);
        }

      } else {
        console.log(`⚠️  Could not find "${scenario.title}" button`);
      }

    } catch (error) {
      console.log(`⚠️  Error with "${scenario.title}":`, error.message);
    }

    // Go back to scenarios (unless it's the last one)
    if (i < scenarios.length - 1) {
      console.log('⬅️  Returning to scenario selection...');

      const wentBack = await page.evaluate(() => {
        // Find "Back to scenarios" or similar button
        const buttons = Array.from(document.querySelectorAll('button'));
        const backButton = buttons.find(btn =>
          btn.textContent?.includes('Back') ||
          btn.textContent?.includes('←')
        );

        if (backButton) {
          backButton.click();
          return true;
        }
        return false;
      });

      if (wentBack) {
        await page.waitForTimeout(1500);
      }
    }

    console.log('');
  }

  // Final pause and scroll
  console.log('📜 Final scroll through demo...\n');
  await page.waitForTimeout(2000);

  // Small scroll to show more content if available
  await page.evaluate(() => {
    window.scrollTo({ top: 300, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // Close browser to save video
  await context.close();
  await browser.close();

  console.log('✅ Recording complete!\n');

  // Convert video
  const recordingsDir = path.join(__dirname, '../recordings');
  const files = fs.readdirSync(recordingsDir);
  const videoFile = files.find(f => f.endsWith('.webm'));

  if (videoFile) {
    const videoPath = path.join(recordingsDir, videoFile);
    const newWebmPath = path.join(recordingsDir, '02-ml-stranger-detection.webm');
    const newMp4Path = path.join(recordingsDir, '02-ml-stranger-detection.mp4');

    // Remove old MP4 if exists
    if (fs.existsSync(newMp4Path)) {
      fs.unlinkSync(newMp4Path);
    }

    fs.renameSync(videoPath, newWebmPath);
    console.log('🔄 Converting to MP4...');

    try {
      const { execSync } = require('child_process');
      execSync(`ffmpeg -y -i "${newWebmPath}" -c:v libx264 -c:a aac -movflags +faststart "${newMp4Path}"`, {
        stdio: 'inherit',
        timeout: 60000
      });

      fs.unlinkSync(newWebmPath);
      console.log('\n✅ MP4 created successfully\n');
      console.log('📁 Video: recordings/02-ml-stranger-detection.mp4');
      console.log('');
      console.log('🎉 Complete! All 4 scenarios recorded:');
      console.log('   1. 🛡️ Safe Conversation - Low risk, known friend');
      console.log('   2. ⚠️ Stranger Danger - Medium risk, personal info requests');
      console.log('   3. 🚨 Grooming Pattern - Critical risk, manipulation tactics');
      console.log('   4. 👥 Group Chat - Medium risk, unknown person in group');
    } catch (error) {
      console.log('\n⚠️  ffmpeg conversion failed');
      console.log('📁 WebM saved as: recordings/02-ml-stranger-detection.webm');
    }
  }
}

recordMLStrangerScenarios().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
