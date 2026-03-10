#!/usr/bin/env node

/**
 * Record each ML Stranger Detection scenario as a separate video
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const scenarios = [
  { id: 'safe-conversation', title: 'Safe Conversation', icon: '🛡️', filename: '05-safe-conversation.mp4' },
  { id: 'stranger-danger', title: 'Stranger Danger', icon: '⚠️', filename: '06-stranger-danger.mp4' },
  { id: 'grooming-pattern', title: 'Grooming Pattern', icon: '🚨', filename: '07-grooming-pattern.mp4' },
  { id: 'group-chat', title: 'Group Chat', icon: '👥', filename: '08-group-chat.mp4' }
];

async function recordScenario(scenario) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎬 Recording: ${scenario.icon} ${scenario.title}`);
  console.log(`${'='.repeat(80)}\n`);

  const demoPath = path.join(__dirname, '../tests/demo-pages/ML_STRANGER_DEMO.html');

  if (!fs.existsSync(demoPath)) {
    console.error('❌ ML_STRANGER_DEMO.html not found');
    return null;
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 800
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: path.join(__dirname, '../recordings'),
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  console.log('🌐 Loading demo page...');
  await page.goto(`file://${demoPath}`, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  // Wait for React to load
  console.log('⏳ Waiting for app to load...');
  await page.waitForTimeout(5000);
  console.log('✅ App loaded');

  // Click the scenario button
  console.log(`🔍 Looking for "${scenario.title}" button...`);

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
    await browser.close();
    return null;
  }

  console.log(`✅ Clicked "${scenario.title}"`);

  // Wait for transition
  await page.waitForTimeout(3000);

  // Wait for conversation simulation
  console.log('⏳ Waiting for conversation simulation...');

  let prevMessageCount = 0;
  let stableCount = 0;

  for (let w = 0; w < 20; w++) {
    await page.waitForTimeout(1000);

    const messageCount = await page.evaluate(() => {
      const bubbles = document.querySelectorAll('[class*="bg-"], [class*="rounded"]');
      return Array.from(bubbles).filter(b => b.textContent && b.textContent.trim().length > 5).length;
    });

    if (messageCount === prevMessageCount && messageCount > 0) {
      stableCount++;
      if (stableCount >= 3) {
        console.log('✅ Conversation complete');
        break;
      }
    } else {
      stableCount = 0;
      prevMessageCount = messageCount;
    }
  }

  // Wait for alert
  await page.waitForTimeout(3000);
  console.log('⏳ Waiting for risk analysis...');

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

  // Small pause at end
  await page.waitForTimeout(2000);

  // Close browser
  await context.close();
  await browser.close();

  console.log('✅ Recording complete');

  // Convert video
  const recordingsDir = path.join(__dirname, '../recordings');
  const files = fs.readdirSync(recordingsDir);
  const videoFile = files.find(f => f.endsWith('.webm'));

  if (videoFile) {
    const videoPath = path.join(recordingsDir, videoFile);
    const webmFilename = scenario.filename.replace('.mp4', '.webm');
    const newWebmPath = path.join(recordingsDir, webmFilename);
    const newMp4Path = path.join(recordingsDir, scenario.filename);

    // Remove old files if exist
    if (fs.existsSync(newMp4Path)) fs.unlinkSync(newMp4Path);
    if (fs.existsSync(newWebmPath)) fs.unlinkSync(newWebmPath);

    fs.renameSync(videoPath, newWebmPath);

    console.log('🔄 Converting to MP4...');

    try {
      const { execSync } = require('child_process');
      execSync(`ffmpeg -y -i "${newWebmPath}" -c:v libx264 -c:a aac -movflags +faststart "${newMp4Path}"`, {
        stdio: 'inherit',
        timeout: 60000
      });

      fs.unlinkSync(newWebmPath);
      console.log(`✅ Created: ${scenario.filename}\n`);
      return scenario.filename;
    } catch (error) {
      console.log(`⚠️ Conversion failed for ${scenario.filename}`);
      return null;
    }
  }

  return null;
}

async function recordAllScenarios() {
  console.log('🎬 Privacy Shadow - Individual Scenario Recordings');
  console.log('='.repeat(80));
  console.log(`Recording ${scenarios.length} individual scenario videos\n`);

  const results = [];

  for (const scenario of scenarios) {
    try {
      const result = await recordScenario(scenario);
      if (result) {
        results.push({ title: scenario.title, file: result, icon: scenario.icon });
      }
    } catch (error) {
      console.error(`❌ Error recording "${scenario.title}":`, error.message);
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 RECORDING SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  if (results.length > 0) {
    console.log(`✅ Successfully recorded ${results.length} scenario(s):\n`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.icon} ${r.title}`);
      console.log(`     📁 recordings/${r.file}\n`);
    });

    console.log('All individual scenario videos saved to: recordings/');
  } else {
    console.log('❌ No scenarios were recorded');
  }

  console.log('\n🎉 Done!');
}

recordAllScenarios().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
