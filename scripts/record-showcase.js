#!/usr/bin/env node

/**
 * Record showcase.html as a video
 * Scrolls through the page and captures it as MP4
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordShowcase() {
  console.log('🎬 Recording showcase.html as video...\n');

  const showcasePath = path.join(__dirname, '../demos/showcase.html');

  if (!fs.existsSync(showcasePath)) {
    console.error('❌ showcase.html not found at:', showcasePath);
    process.exit(1);
  }

  console.log('📄 Showcase file:', showcasePath);
  console.log('');

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

  // Load the showcase file
  const fileUrl = `file://${showcasePath}`;
  console.log('🌐 Loading:', fileUrl);

  await page.goto(fileUrl, {
    waitUntil: 'networkidle',
    timeout: 10000
  });

  console.log('✅ Page loaded');
  console.log('📜 Starting scroll animation...');
  console.log('');

  // Wait for animations to start
  await page.waitForTimeout(1500);

  // Smooth scroll through the page
  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportHeight = 1080;
  const scrollSteps = 15;
  const stepSize = (scrollHeight - viewportHeight) / scrollSteps;
  const scrollDelay = 800; // ms per step

  for (let i = 0; i <= scrollSteps; i++) {
    const scrollPosition = i * stepSize;
    await page.evaluate((pos) => {
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }, scrollPosition);

    console.log(`📍 Scrolled to step ${i + 1}/${scrollSteps + 1} (${Math.round(scrollPosition)}px)`);

    // Wait at each section
    await page.waitForTimeout(scrollDelay);
  }

  // Scroll back to top slowly
  console.log('');
  console.log('⬆️  Scrolling back to top...');

  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  await page.waitForTimeout(2000);

  // Close browser to save video
  await context.close();
  await browser.close();

  console.log('');
  console.log('✅ Recording complete!');
  console.log('');
  console.log('📹 Video saved to: recordings/');
  console.log('');

  // Find the video file
  const recordingsDir = path.join(__dirname, '../recordings');
  if (fs.existsSync(recordingsDir)) {
    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm'));

    if (videoFile) {
      const videoPath = path.join(recordingsDir, videoFile);
      console.log('📼 Video file:', videoPath);
      console.log('');

      // Convert to MP4 if ffmpeg is available
      console.log('🔄 Converting to MP4...');

      try {
        const { execSync } = require('child_process');
        const outputPath = videoPath.replace('.webm', '.mp4');

        execSync(`ffmpeg -i "${videoPath}" -c:v libx264 -c:a aac -movflags +faststart "${outputPath}"`, {
          stdio: 'inherit',
          timeout: 30000
        });

        console.log('');
        console.log('✅ MP4 video created:', outputPath);
        console.log('');

        // Optionally remove the webm file
        fs.unlinkSync(videoPath);
        console.log('🗑️  Removed temporary WebM file');
      } catch (error) {
        console.log('');
        console.log('⚠️  ffmpeg not available or conversion failed');
        console.log('💡 Install ffmpeg: brew install ffmpeg');
        console.log('');
        console.log('📼 WebM video still available:', videoPath);
      }
    }
  }

  console.log('');
  console.log('🎉 Done! You can now use the video for your hackathon demo.');
}

// Run the recorder
recordShowcase().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
