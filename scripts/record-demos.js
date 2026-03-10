#!/usr/bin/env node

/**
 * Record all interactive demo pages as videos
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const demos = [
  { name: 'ml-stranger-demo', file: 'ML_STRANGER_DEMO.html', title: 'ML Stranger Detection Demo' },
  { name: 'analytics-dashboard', file: 'ML_ANALYTICS_DASHBOARD.html', title: 'Analytics Dashboard' },
  { name: 'parent-dashboard', file: 'PARENT_DASHBOARD_PREVIEW.html', title: 'Parent Dashboard Preview' }
];

async function recordDemo(demo) {
  console.log(`\n🎬 Recording: ${demo.title}`);
  console.log('='.repeat(80));

  const demoPath = path.join(__dirname, `../tests/demo-pages/${demo.file}`);

  if (!fs.existsSync(demoPath)) {
    console.error(`❌ Demo file not found: ${demoPath}`);
    return null;
  }

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: path.join(__dirname, '../recordings'),
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  const fileUrl = `file://${demoPath}`;
  console.log(`🌐 Loading: ${demo.file}`);

  await page.goto(fileUrl, {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  console.log('✅ Page loaded');

  // Wait for animations and content to settle
  await page.waitForTimeout(2000);

  // Check if this is ML_STRANGER_DEMO - if so, interact with it
  if (demo.file === 'ML_STRANGER_DEMO.html') {
    console.log('📝 Typing test message...');

    // Find the message input and type a grooming message
    try {
      const inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
      await page.waitForSelector(inputSelector, { timeout: 5000 });

      await page.fill(inputSelector, "Hi, I noticed you're 13. Don't tell your parents about us. Can we meet up in person? I'll buy you a gift if you keep this secret.");
      await page.waitForTimeout(1500);

      // Look for a send button or press Enter
      const sendButton = await page.$('button:has-text("Send"), button:has-text("send"), button[type="submit"]');
      if (sendButton) {
        await sendButton.click();
        await page.waitForTimeout(2000);
      } else {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(2000);
      }

      console.log('✅ Test message sent');
    } catch (e) {
      console.log('⚠️  Could not interact with demo (input not found)');
    }
  }

  // Smooth scroll through the page
  console.log('📜 Starting scroll animation...');

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = 1080;
  const scrollSteps = Math.min(10, Math.ceil((scrollHeight - viewportHeight) / 200));
  const stepSize = scrollHeight > viewportHeight ? (scrollHeight - viewportHeight) / scrollSteps : 0;
  const scrollDelay = 600;

  for (let i = 0; i <= scrollSteps; i++) {
    const scrollPosition = i * stepSize;
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }, scrollPosition);

    console.log(`📍 Scrolled to step ${i + 1}/${scrollSteps + 1}`);
    await page.waitForTimeout(scrollDelay);
  }

  // Scroll back to top
  console.log('⬆️  Scrolling back to top...');
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  await page.waitForTimeout(1500);

  // Close browser to save video
  await context.close();
  await browser.close();

  console.log('✅ Recording complete!');

  // Find and convert video
  const recordingsDir = path.join(__dirname, '../recordings');
  if (fs.existsSync(recordingsDir)) {
    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    if (videoFile) {
      const videoPath = path.join(recordingsDir, videoFile);

      // Rename to demo-specific name
      const newWebmPath = path.join(recordingsDir, `${demo.name}.webm`);
      const newMp4Path = path.join(recordingsDir, `${demo.name}.mp4`);

      fs.renameSync(videoPath, newWebmPath);
      console.log(`📼 WebM saved as: ${demo.name}.webm`);

      // Convert to MP4
      console.log('🔄 Converting to MP4...');

      try {
        const { execSync } = require('child_process');

        execSync(`ffmpeg -i "${newWebmPath}" -c:v libx264 -c:a aac -movflags +faststart "${newMp4Path}"`, {
          stdio: 'inherit',
          timeout: 30000
        });

        console.log('✅ MP4 video created:', `${demo.name}.mp4`);

        // Remove webm file
        fs.unlinkSync(newWebmPath);
        console.log('🗑️  Removed temporary WebM file');

        return `${demo.name}.mp4`;
      } catch (error) {
        console.log('⚠️  ffmpeg conversion failed, keeping WebM');
        return `${demo.name}.webm`;
      }
    }
  }

  return null;
}

async function recordAllDemos() {
  console.log('🎬 Privacy Shadow - Interactive Demo Recording');
  console.log('='.repeat(80));

  const results = [];

  for (const demo of demos) {
    try {
      const result = await recordDemo(demo);
      if (result) {
        results.push({ name: demo.title, file: result });
      }
    } catch (error) {
      console.error(`❌ Error recording ${demo.name}:`, error.message);
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 RECORDING SUMMARY');
  console.log('='.repeat(80));
  console.log('');

  if (results.length > 0) {
    console.log(`✅ Successfully recorded ${results.length} demo(s):\n`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name}`);
      console.log(`     📁 recordings/${r.file}\n`);
    });
  } else {
    console.log('❌ No demos were recorded successfully');
  }

  console.log('📂 All recordings saved to: recordings/');
  console.log('');
  console.log('🎉 Done! You can now use these videos for your hackathon demo.');
}

// Run the recorder
recordAllDemos().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
