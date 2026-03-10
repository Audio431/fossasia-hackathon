#!/usr/bin/env node

/**
 * Record showcase.html and then follow and record each demo link
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordShowcaseAndDemos() {
  console.log('🎬 Privacy Shadow - Showcase & Demos Recording');
  console.log('='.repeat(80));

  const showcasePath = path.join(__dirname, '../demos/showcase.html');

  if (!fs.existsSync(showcasePath)) {
    console.error('❌ showcase.html not found at:', showcasePath);
    process.exit(1);
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

  // First, record the showcase page
  console.log('\n📄 Part 1: Recording showcase.html');
  console.log('-'.repeat(80));

  const page = await context.newPage();
  const showcaseUrl = `file://${showcasePath}`;

  await page.goto(showcaseUrl, {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  console.log('✅ Showcase loaded');
  await page.waitForTimeout(2000);

  // Smooth scroll through showcase
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const scrollSteps = 15;
  const stepSize = (scrollHeight - 1080) / scrollSteps;

  for (let i = 0; i <= scrollSteps; i++) {
    const scrollPosition = i * stepSize;
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }, scrollPosition);
    await page.waitForTimeout(700);
  }

  // Scroll back to top
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await page.waitForTimeout(1500);

  // Save showcase video
  await context.close();
  await browser.close();

  console.log('✅ Showcase recording complete');

  // Convert showcase video
  const recordingsDir = path.join(__dirname, '../recordings');
  const files = fs.readdirSync(recordingsDir);
  const showcaseVideo = files.find(f => f.endsWith('.webm'));

  if (showcaseVideo) {
    const videoPath = path.join(recordingsDir, showcaseVideo);
    const newWebmPath = path.join(recordingsDir, 'showcase.webm');
    const newMp4Path = path.join(recordingsDir, 'showcase.mp4');

    fs.renameSync(videoPath, newWebmPath);

    console.log('🔄 Converting showcase to MP4...');
    try {
      const { execSync } = require('child_process');
      execSync(`ffmpeg -i "${newWebmPath}" -c:v libx264 -c:a aac -movflags +faststart "${newMp4Path}"`, {
        stdio: 'inherit',
        timeout: 30000
      });
      fs.unlinkSync(newWebmPath);
      console.log('✅ Showcase MP4 created');
    } catch (error) {
      console.log('⚠️  ffmpeg conversion failed');
    }
  }

  // Now record each interactive demo
  console.log('\n📄 Part 2: Recording interactive demos');
  console.log('-'.repeat(80));

  const demos = [
    { name: 'ML Stranger Demo', file: 'ML_STRANGER_DEMO.html', filename: 'ml-stranger-demo' },
    { name: 'Analytics Dashboard', file: 'ML_ANALYTICS_DASHBOARD.html', filename: 'analytics-dashboard' },
    { name: 'Parent Dashboard', file: 'PARENT_DASHBOARD_PREVIEW.html', filename: 'parent-dashboard' }
  ];

  for (const demo of demos) {
    console.log(`\n🎬 Recording: ${demo.name}`);

    const browser2 = await chromium.launch({ headless: true });
    const context2 = await browser2.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: path.join(__dirname, '../recordings'),
        size: { width: 1920, height: 1080 }
      }
    });

    const page2 = await context2.newPage();
    const demoPath = path.join(__dirname, `../tests/demo-pages/${demo.file}`);

    if (!fs.existsSync(demoPath)) {
      console.log(`⚠️  Demo not found: ${demo.file}`);
      await browser2.close();
      continue;
    }

    await page2.goto(`file://${demoPath}`, {
      waitUntil: 'networkidle',
      timeout: 10000
    });

    console.log(`✅ ${demo.name} loaded`);
    await page2.waitForTimeout(2000);

    // Scroll through demo
    const demoScrollHeight = await page2.evaluate(() => document.body.scrollHeight);
    const demoScrollSteps = Math.max(5, Math.ceil((demoScrollHeight - 1080) / 300));

    for (let i = 0; i <= demoScrollSteps; i++) {
      const scrollPos = i * ((demoScrollHeight - 1080) / demoScrollSteps);
      await page2.evaluate((pos) => {
        window.scrollTo({ top: pos, behavior: 'smooth' });
      }, scrollPos);
      await page2.waitForTimeout(600);
    }

    await page2.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await page2.waitForTimeout(1000);

    await context2.close();
    await browser2.close();

    // Convert demo video
    const demoFiles = fs.readdirSync(recordingsDir);
    const demoVideo = demoFiles.find(f => f.endsWith('.webm'));

    if (demoVideo) {
      const videoPath = path.join(recordingsDir, demoVideo);
      const newWebmPath = path.join(recordingsDir, `${demo.filename}.webm`);
      const newMp4Path = path.join(recordingsDir, `${demo.filename}.mp4`);

      fs.renameSync(videoPath, newWebmPath);

      console.log(`🔄 Converting ${demo.filename} to MP4...`);
      try {
        const { execSync } = require('child_process');
        execSync(`ffmpeg -y -i "${newWebmPath}" -c:v libx264 -c:a aac -movflags +faststart "${newMp4Path}"`, {
          stdio: 'inherit',
          timeout: 30000
        });
        fs.unlinkSync(newWebmPath);
        console.log(`✅ ${demo.filename} MP4 created`);
      } catch (error) {
        console.log(`⚠️  Conversion failed for ${demo.filename}`);
      }
    }

    console.log(`✅ ${demo.name} complete`);
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 RECORDING SUMMARY');
  console.log('='.repeat(80));
  console.log('');
  console.log('Recorded videos:');
  console.log('  📄 showcase.mp4 - Main showcase page');
  console.log('  🎬 ml-stranger-demo.mp4 - ML Stranger Detection Demo');
  console.log('  📊 analytics-dashboard.mp4 - Analytics Dashboard');
  console.log('  👨‍👩‍👧 parent-dashboard.mp4 - Parent Dashboard');
  console.log('');
  console.log(`📂 All videos saved to: ${recordingsDir}/`);
  console.log('');
  console.log('🎉 All recordings complete! Ready for hackathon demo.');
}

recordShowcaseAndDemos().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
