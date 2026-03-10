/**
 * Privacy Shadow Extension - End-to-End Persona Tests
 *
 * Tests the extension with virtual personas in a real Chrome browser
 * using Playwright with Chrome DevTools Protocol (CDP)
 */

import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const EXTENSION_PATH = path.join(__dirname, '../../build/chrome-mv3-prod');

/**
 * Virtual Personas for Testing
 */
const PERSONAS = {
  kid: {
    name: 'Alex',
    age: 12,
    bio: 'Curious kid who loves chatting with friends online',
    behaviors: {
      typesFast: true,
      tendsToSharePersonalInfo: true,
      clicksThroughWarnings: false,
      asksParentsForPermission: false
    }
  },

  cautiousTeen: {
    name: 'Jordan',
    age: 15,
    bio: 'Careful teenager who thinks before sharing',
    behaviors: {
      typesFast: false,
      tendsToSharePersonalInfo: false,
      clicksThroughWarnings: true,
      asksParentsForPermission: true
    }
  },

  parent: {
    name: 'Sam',
    age: 35,
    bio: 'Protective parent monitoring child\'s online activity',
    behaviors: {
      checksDashboard: true,
      reviewsAlerts: true,
      adjustsSettings: true
    }
  }
};

/**
 * Test Scenarios
 */
const SCENARIOS = {
  instagramDM: {
    platform: 'Instagram',
    context: 'Direct Message chat with stranger',
    input: 'div[contenteditable="true"], textarea[placeholder*="Message"]',
    testMessages: [
      { text: 'hey whats up', shouldAlert: false },
      { text: 'my name is alex and i live at 123 main street', shouldAlert: true },
      { text: 'my birthday is january 1 2012', shouldAlert: true },
      { text: 'call me at 555-123-4567', shouldAlert: true }
    ]
  },

  commentSection: {
    platform: 'Instagram',
    context: 'Public comment section',
    input: 'textarea[placeholder*="comment"], textarea[placeholder*="Comment"]',
    testMessages: [
      { text: 'nice photo!', shouldAlert: false },
      { text: 'my school is Lincoln Middle School in Portland', shouldAlert: true },
      { text: 'my email is alex@gmail.com', shouldAlert: true }
    ]
  },

  websiteForm: {
    platform: 'Generic Website',
    context: 'Newsletter signup form',
    input: 'input[type="text"], input[type="email"]',
    testMessages: [
      { text: 'alex@example.com', shouldAlert: true },
      { text: 'John Smith', shouldAlert: false }
    ]
  }
};

/**
 * Helper: Load extension in Chrome
 */
async function loadExtension() {
  const context = await chromium.launchPersistentContext('', {
    headless: false, // Show browser for debugging
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`
    ]
  });

  // Wait for extension to load
  await context.waitForEvent('page', { timeout: 5000 }).catch(() => {
    // No page created yet, but extension should be loaded
  });

  return { context };
}

/**
 * Helper: Create test page with specific input types
 * Uses HTTP server instead of file:// for extension compatibility
 */
async function createTestPage(context: BrowserContext, scenario: keyof typeof SCENARIOS) {
  const page = await context.newPage();

  const pageContent = generateTestPage(scenario);

  // Create a simple data URL to serve the content
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(pageContent)}`;
  await page.goto(dataUrl);

  return page;
}

/**
 * Helper: Generate test page HTML
 */
function generateTestPage(scenario: keyof typeof SCENARIOS): string {
  const scenarios = {
    instagramDM: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Instagram DM - Test</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; background: #fafafa; }
          .chat-container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 20px; }
          .message-list { height: 400px; overflow-y: auto; border: 1px solid #dbdbdb; margin-bottom: 20px; padding: 10px; }
          .message { margin: 10px 0; padding: 10px; border-radius: 8px; }
          .message.received { background: #efefef; }
          .message.sent { background: #0095f6; color: white; margin-left: auto; }
          .input-area { display: flex; gap: 10px; }
          textarea { flex: 1; padding: 12px; border: 1px solid #dbdbdb; border-radius: 22px; resize: none; font-family: -apple-system, sans-serif; }
          button { padding: 10px 20px; background: #0095f6; color: white; border: none; border-radius: 22px; font-weight: 600; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="chat-container">
          <h2>Instagram DM</h2>
          <div class="message-list">
            <div class="message received">Hey! I'm a stranger from the internet 😊</div>
          </div>
          <div class="input-area">
            <textarea id="message-input" placeholder="Message..." rows="2"></textarea>
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
        <script>
          function sendMessage() {
            const input = document.getElementById('message-input');
            const text = input.value.trim();
            if (text) {
              const list = document.querySelector('.message-list');
              const msg = document.createElement('div');
              msg.className = 'message sent';
              msg.textContent = text;
              list.appendChild(msg);
              input.value = '';
              list.scrollTop = list.scrollHeight;
            }
          }

          // Allow Enter to send
          document.getElementById('message-input').addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          });
        </script>
      </body>
      </html>
    `,

    commentSection: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Instagram Post - Test</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 20px; background: #fafafa; }
          .post { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .post-image { height: 400px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
          .post-actions { padding: 15px; border-bottom: 1px solid #efefef; }
          .post-actions button { background: none; border: none; font-size: 24px; margin-right: 15px; cursor: pointer; }
          .comments { padding: 15px; }
          .comment-input { display: flex; gap: 10px; margin-top: 15px; }
          textarea { flex: 1; padding: 10px; border: 1px solid #dbdbdb; border-radius: 22px; resize: none; font-family: -apple-system, sans-serif; }
          button { padding: 8px 16px; background: #0095f6; color: white; border: none; border-radius: 22px; font-weight: 600; cursor: pointer; }
        </style>
      </head>
      <body>
        <div class="post">
          <div class="post-image"></div>
          <div class="post-actions">
            <button>♡</button>
            <button>💬</button>
            <button>✈</button>
          </div>
          <div class="comments">
            <p><strong>cool_user</strong> Nice photo! 📸</p>
            <div class="comment-input">
              <textarea id="comment-input" placeholder="Add a comment..." rows="2"></textarea>
              <button onclick="postComment()">Post</button>
            </div>
          </div>
        </div>
        <script>
          function postComment() {
            const input = document.getElementById('comment-input');
            const text = input.value.trim();
            if (text) {
              const comments = document.querySelector('.comments');
              const comment = document.createElement('p');
              comment.innerHTML = '<strong>you</strong> ' + text;
              comments.insertBefore(comment, input.parentElement);
              input.value = '';
            }
          }
        </script>
      </body>
      </html>
    `,

    websiteForm: `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Newsletter Signup - Test</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 40px; background: #f0f0f0; }
          .form-container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          h1 { margin-top: 0; color: #333; }
          .form-group { margin-bottom: 20px; }
          label { display: block; margin-bottom: 8px; font-weight: 600; color: #555; }
          input[type="text"], input[type="email"] { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
          button { width: 100%; padding: 14px; background: #0095f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; }
          button:hover { background: #0081d6; }
        </style>
      </head>
      <body>
        <div class="form-container">
          <h1>🎉 Subscribe to Our Newsletter</h1>
          <p style="color: #666; margin-bottom: 30px;">Get the latest updates delivered to your inbox!</p>
          <form id="signup-form" onsubmit="handleSubmit(event)">
            <div class="form-group">
              <label for="name">Your Name</label>
              <input type="text" id="name" name="name" placeholder="Enter your name" required>
            </div>
            <div class="form-group">
              <label for="email">Email Address</label>
              <input type="email" id="email" name="email" placeholder="you@example.com" required>
            </div>
            <button type="submit">Subscribe Now</button>
          </form>
        </div>
        <script>
          function handleSubmit(e) {
            e.preventDefault();
            alert('Form submitted! In real app, data would be sent to server.');
          }
        </script>
      </body>
      </html>
    `
  };

  return scenarios[scenario] || scenarios.instagramDM;
}

/**
 * Helper: Simulate typing with human-like patterns
 */
async function simulateTyping(page: any, selector: string, text: string, persona: keyof typeof PERSONAS = 'kid') {
  const input = page.locator(selector);
  await input.focus();

  // Typing speed based on persona
  const typingSpeed = PERSONAS[persona].behaviors.typesFast ? 30 : 80;

  for (const char of text) {
    await input.type(char, { delay: Math.random() * typingSpeed });
  }

  // Small pause after typing
  await page.waitForTimeout(Math.random() * 500 + 200);
}

/**
 * Helper: Check if privacy alert is visible
 */
async function isPrivacyAlertVisible(page: any): Promise<boolean> {
  try {
    const overlay = page.locator('#privacy-shadow-overlay');
    return await overlay.isVisible({ timeout: 1000 });
  } catch {
    return false;
  }
}

/**
 * Helper: Get alert details
 */
async function getAlertDetails(page: any) {
  const overlay = page.locator('#privacy-shadow-overlay');
  const visible = await overlay.isVisible({ timeout: 2000 }).catch(() => false);

  if (!visible) {
    return null;
  }

  const title = await overlay.locator('h2').textContent().catch(() => '');
  const reasons = await overlay.locator('ul li').allTextContents().catch(() => []);

  return { visible: true, title: title?.trim() || '', reasons };
}

/**
 * Helper: Click "Send Anyway" button
 */
async function clickSendAnyway(page: any) {
  const continueBtn = page.locator('#ps-continue-btn');
  await continueBtn.click();
  await page.waitForTimeout(500); // Wait for overlay to disappear
}

/**
 * Helper: Click "Nevermind" button
 */
async function clickNevermind(page: any) {
  const cancelBtn = page.locator('#ps-cancel-btn');
  await cancelBtn.click();
  await page.waitForTimeout(500);
}

test.describe.configure({ mode: 'serial' });

test.describe('Extension E2E Tests with Virtual Personas', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    // Check if extension is built
    if (!fs.existsSync(EXTENSION_PATH)) {
      console.log('Extension not built. Building now...');
      const { execSync } = require('child_process');
      execSync('npm run build', { cwd: path.join(__dirname, '../..') });
    }
  });

  test.beforeEach(async () => {
    const result = await loadExtension();
    context = result.context;
  });

  test.afterEach(async () => {
    await context.close();
  });

  test.describe('Persona: Alex (Kid) - Instagram DM', () => {
    test('should warn when sharing personal info in DM', async () => {
      const page = await createTestPage(context, 'instagramDM');

      // Test 1: Safe message - no warning
      await simulateTyping(page, '#message-input', 'hey whats up', 'kid');
      await page.keyboard.press('Tab'); // Trigger blur

      let alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(false);

      // Test 2: Share address - should trigger warning
      await simulateTyping(page, '#message-input', 'my name is alex and i live at 123 main street', 'kid');
      await page.keyboard.press('Tab'); // Trigger blur

      alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);

      const alertDetails = await getAlertDetails(page);
      expect(alertDetails?.reasons).toContain('Home address detected');

      // Test 3: Click "Send Anyway" and verify acknowledgment
      await clickSendAnyway(page);

      // Type the same thing again - should NOT warn (acknowledged)
      await simulateTyping(page, '#message-input', 'my name is alex and i live at 123 main street', 'kid');
      await page.keyboard.press('Tab');

      alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(false); // Should not warn again for same content

      // Test 4: Type different PII - should warn again
      await simulateTyping(page, '#message-input', 'my birthday is january 1 2012', 'kid');
      await page.keyboard.press('Tab');

      alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);
    });

    test('should not show popup while typing', async () => {
      const page = await createTestPage(context, 'instagramDM');

      // Start typing PII
      const input = page.locator('#message-input');
      await input.focus();

      // Type character by character and check no popup appears
      const text = 'my phone number is 555-123-4567';
      for (let i = 0; i < text.length; i++) {
        await input.type(text[i]);
        await page.waitForTimeout(50); // Small delay between keystrokes

        // No alert should be visible while typing
        const alertVisible = await isPrivacyAlertVisible(page);
        expect(alertVisible).toBe(false);
      }

      // Only when we blur (click away) should the alert appear
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      const alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);
    });

    test('should only show ONE popup, not duplicates', async () => {
      const page = await createTestPage(context, 'instagramDM');

      // Type PII content
      await simulateTyping(page, '#message-input', 'my email is alex@gmail.com', 'kid');
      await page.keyboard.press('Tab');

      await page.waitForTimeout(1000);

      // Count how many overlays exist
      const overlays = await page.locator('div[id*="privacy-shadow"]').count();
      expect(overlays).toBeLessThanOrEqual(1); // Should be exactly 1 overlay

      // Check only one is visible
      const visibleOverlays = await page.locator('div[id*="privacy-shadow"]:not([style*="display: none"])').count();
      expect(visibleOverlays).toBe(1);
    });
  });

  test.describe('Persona: Jordan (Cautious Teen) - Comment Section', () => {
    test('should warn about public PII in comments', async () => {
      const page = await createTestPage(context, 'commentSection');

      // Try to post comment with school name
      await simulateTyping(page, '#comment-input', 'my school is Lincoln Middle School in Portland', 'cautiousTeen');
      await page.keyboard.press('Tab');

      const alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);

      const alertDetails = await getAlertDetails(page);
      expect(alertDetails?.reasons.some(r => r.includes('school') || r.includes('location'))).toBe(true);

      // Jordan clicks "Nevermind" - clears the input
      await clickNevermind(page);

      const inputValue = await page.locator('#comment-input').inputValue();
      expect(inputValue).toBe(''); // Should be cleared
    });
  });

  test.describe('Persona: Parent - Dashboard', () => {
    test('should capture and store alerts for parent review', async () => {
      const page = await createTestPage(context, 'instagramDM');

      // Simulate kid triggering multiple alerts
      const piiExamples = [
        'my address is 123 main street',
        'call me at 555-123-4567',
        'my birthday is january 1 2012'
      ];

      for (const pii of piiExamples) {
        await simulateTyping(page, '#message-input', pii, 'kid');
        await page.keyboard.press('Tab');

        if (await isPrivacyAlertVisible(page)) {
          await clickSendAnyway(page);
        }

        await page.waitForTimeout(500);
      }

      // Check chrome.storage for stored alerts
      const alerts = await page.evaluate(async () => {
        return new Promise((resolve) => {
          chrome.storage.local.get(['privacyShadowAlerts'], (result) => {
            resolve(result.privacyShadowAlerts || []);
          });
        });
      });

      // Should have stored the alerts
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeGreaterThan(0);
    });
  });

  test.describe('Regression Tests', () => {
    test('regression: typing interruption - should not interrupt while typing', async () => {
      const page = await createTestPage(context, 'instagramDM');

      const input = page.locator('#message-input');
      await input.focus();

      // Type as fast as possible
      const text = 'my name is alex and i live at 123 main street springfield illinois';
      await input.type(text, { delay: 10 }); // Very fast typing

      // Check no alert appeared during typing
      let alertAppeared = false;
      try {
        alertAppeared = await page.locator('#privacy-shadow-overlay').isVisible({ timeout: 100 });
      } catch {}

      expect(alertAppeared).toBe(false);

      // Now blur - alert should appear
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      const alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);
    });

    test('regression: duplicate popups - should only show one', async () => {
      const page = await createTestPage(context, 'instagramDM');

      // Rapidly trigger multiple blur events
      await simulateTyping(page, '#message-input', 'my phone is 555-123-4567', 'kid');

      // Press Tab multiple times rapidly
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab'); // Back to input
      await page.keyboard.press('Tab'); // Away again

      await page.waitForTimeout(1000);

      // Count overlays
      const overlayCount = await page.locator('#privacy-shadow-overlay').count();
      expect(overlayCount).toBeLessThanOrEqual(1);
    });

    test('regression: acknowledgment persistence - should remember I Understand', async () => {
      const page = await createTestPage(context, 'instagramDM');

      const pii = 'my email is alex.kid2024@gmail.com';

      // First time - should alert
      await simulateTyping(page, '#message-input', pii, 'kid');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      expect(await isPrivacyAlertVisible(page)).toBe(true);

      // Click Send Anyway
      await clickSendAnyway(page);

      // Clear and type same thing again - should NOT alert
      await page.locator('#message-input').fill('');
      await simulateTyping(page, '#message-input', pii, 'kid');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      expect(await isPrivacyAlertVisible(page)).toBe(false);

      // Type different PII - should alert
      await page.locator('#message-input').fill('');
      await simulateTyping(page, '#message-input', 'my social security number is 123-45-6789', 'kid');
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);

      expect(await isPrivacyAlertVisible(page)).toBe(true);
    });
  });

  test.describe('Platform-Specific Tests', () => {
    test('website form: should detect email in newsletter signup', async () => {
      const page = await createTestPage(context, 'websiteForm');

      // Fill in form with PII
      await page.locator('#name').fill('Alex Johnson');
      await page.locator('#email').fill('alex.johnson@gmail.com');
      await page.locator('#email').blur(); // Trigger blur

      await page.waitForTimeout(500);

      // Should show alert about email
      const alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);

      const alertDetails = await getAlertDetails(page);
      expect(alertDetails?.reasons.some(r => r.includes('email') || r.includes('E-mail'))).toBe(true);
    });

    test('comment section: should warn about public location sharing', async () => {
      const page = await createTestPage(context, 'commentSection');

      await simulateTyping(page, '#comment-input', 'im from new york city, brooklyn!', 'kid');
      await page.keyboard.press('Tab');

      await page.waitForTimeout(500);

      const alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle very long text without performance issues', async () => {
      const page = await createTestPage(context, 'instagramDM');

      // Type a very long message with PII
      const longText = 'hi '.repeat(100) + 'my address is 123 main street anywhere usa 12345';
      await page.locator('#message-input').fill(longText);
      await page.keyboard.press('Tab');

      await page.waitForTimeout(1000);

      // Should still detect PII even in long text
      const alertVisible = await isPrivacyAlertVisible(page);
      expect(alertVisible).toBe(true);
    });

    test('should handle rapid editing gracefully', async () => {
      const page = await createTestPage(context, 'instagramDM');

      const input = page.locator('#message-input');

      // Type PII
      await input.fill('my phone is 555-123-4567');

      // Immediately edit it
      await input.fill('my phone is 555-123-4567 lol');

      // Blur
      await page.keyboard.press('Tab');

      await page.waitForTimeout(500);

      // Should only show one alert
      const overlayCount = await page.locator('#privacy-shadow-overlay').count();
      expect(overlayCount).toBeLessThanOrEqual(1);
    });

    test('should handle special characters and formatting', async () => {
      const page = await createTestPage(context, 'instagramDM');

      const specialCases = [
        'my phone is (555) 123-4567',
        'email: test.user+tag@example.com',
        'address: 123 Main St, Apt 4B, NYC, NY 10001'
      ];

      for (const testCase of specialCases) {
        await page.locator('#message-input').fill('');
        await simulateTyping(page, '#message-input', testCase, 'kid');
        await page.keyboard.press('Tab');

        await page.waitForTimeout(500);

        if (await isPrivacyAlertVisible(page)) {
          await clickSendAnyway(page);
        }

        await page.waitForTimeout(200);
      }

      // Should complete without errors or hanging
      expect(true).toBe(true);
    });
  });
});
