#!/usr/bin/env node

/**
 * Join the 4 individual scenario videos into a single showcase MP4
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function joinScenarioVideos() {
  console.log('🎬 Joining ML Scenario Videos into Showcase');
  console.log('='.repeat(80));

  const recordingsDir = path.join(__dirname, '../recordings');

  // Video files in order
  const videos = [
    '05-safe-conversation.mp4',
    '06-stranger-danger.mp4',
    '07-grooming-pattern.mp4',
    '08-group-chat.mp4'
  ];

  // Check all videos exist
  console.log('\n📋 Checking video files...\n');
  for (const video of videos) {
    const videoPath = path.join(recordingsDir, video);
    if (!fs.existsSync(videoPath)) {
      console.error(`❌ Missing: ${video}`);
      process.exit(1);
    }
    const stats = fs.statSync(videoPath);
    console.log(`✅ ${video} (${Math.round(stats.size / 1024)} KB)`);
  }

  // Create file list for ffmpeg
  const listPath = path.join(recordingsDir, 'concat-list.txt');
  const listContent = videos.map(v => `file '${path.join(recordingsDir, v)}'`).join('\n');
  fs.writeFileSync(listPath, listContent);

  console.log('\n🔄 Joining videos with ffmpeg...\n');

  const outputPath = path.join(recordingsDir, '09-ml-stranger-showcase.mp4');

  try {
    // Use ffmpeg concat demuxer
    execSync(
      `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outputPath}"`,
      {
        stdio: 'inherit',
        timeout: 60000
      }
    );

    console.log('\n✅ Videos joined successfully!\n');

    // Get file size
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('📁 Output: recordings/09-ml-stranger-showcase.mp4');
    console.log(`📊 Size: ${sizeMB} MB\n`);

    console.log('🎬 Showcase contains all 4 scenarios:');
    console.log('   1. 🛡️ Safe Conversation (Low Risk)');
    console.log('   2. ⚠️ Stranger Danger (High Risk)');
    console.log('   3. 🚨 Grooming Pattern (Critical Risk)');
    console.log('   4. 👥 Group Chat (Medium Risk)\n');

    // Clean up temp file
    fs.unlinkSync(listPath);

    return outputPath;
  } catch (error) {
    console.error('\n❌ Error joining videos:', error.message);

    // Try alternative method with re-encoding
    console.log('\n🔄 Trying alternative method (re-encoding)...');

    try {
      execSync(
        `ffmpeg -y -i "${path.join(recordingsDir, videos[0])}" ` +
        `-i "${path.join(recordingsDir, videos[1])}" ` +
        `-i "${path.join(recordingsDir, videos[2])}" ` +
        `-i "${path.join(recordingsDir, videos[3])}" ` +
        `-filter_complex "[0:v][0:a][1:v][1:a][2:v][2:a][3:v][3:a]concat=n=4:v=1:a=1[outv][outa]" ` +
        `-map "[outv]" -map "[outa]" "${outputPath}"`,
        {
          stdio: 'inherit',
          timeout: 120000
        }
      );

      console.log('\n✅ Videos joined successfully (re-encoded)!\n');
      fs.unlinkSync(listPath);
      return outputPath;
    } catch (error2) {
      console.error('\n❌ Alternative method also failed:', error2.message);
      fs.unlinkSync(listPath);
      process.exit(1);
    }
  }
}

joinScenarioVideos();
