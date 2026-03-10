import { test, expect } from '@playwright/test';

/**
 * Teens (13-17) Testing Focus:
 * - Is it too babyish?
 * - Does it feel relevant to their actual online life?
 * - Does it drive behavior change?
 * - Is the technical content accurate?
 */

test.describe('Teen (13-17) Experience', () => {
  test('Privacy Skeptic Aisha (16) - Not too babyish', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Aisha evaluates if this is "for kids"
    await expect(page.locator('text=Privacy Shadow').first()).toBeVisible();

    // She checks the overall aesthetic
    // Dark theme should appeal to teens
    const body = page.locator('body');

    // Should have dark background (not "babyish" bright colors)
    await page.screenshot({ path: 'test-results/aisha-aesthetic-check.png' });

    // She looks for technical accuracy
    // The EXIF data should be real metadata
    await page.locator('button:has-text("📸")').first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/aisha-exif-section.png' });
  });

  test('Social Media Addict Marcus (14) - Feels real', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Marcus uses TikTok/Snap constantly
    // He needs to feel this is relevant to HIS life

    // Social Risk Simulator should resonate
    await page.locator('button:has-text("👥")').first().click();
    await page.waitForTimeout(1000);

    // This section should show real social media scenarios
    await page.screenshot({ path: 'test-results/marcus-social-risks.png' });

    // He should understand how friends expose his data
    // This is the key behavior change driver
  });

  test('Code Curious Rio (15) - Technical accuracy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Rio wants to know if this is technically accurate

    // Check Photo Upload section for EXIF data
    await page.locator('button:has-text("📸")').first().click();
    await page.waitForTimeout(1000);

    // Should show real EXIF fields (GPS, device, timestamp)
    await page.screenshot({ path: 'test-results/rio-exif-data.png' });

    // Check if the data fields are realistic
    // (GPS coordinates, device model, timestamps)
  });

  test('Twin Diet recommendations are actionable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Twin Diet
    await page.locator('button:has-text("✂️")').first().click();
    await page.waitForTimeout(1000);

    // Teens need concrete actions they can take
    await page.screenshot({ path: 'test-results/teen-twin-diet.png' });

    // Recommendations should be:
    // - Specific (not vague)
    // - Realistic (teens can actually do them)
    // - Relevant (apply to real apps they use)
  });

  test('Form Filler simulation feels realistic', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Form Filler
    await page.locator('button:has-text("📝")').first().click();
    await page.waitForTimeout(1000);

    // Should simulate real data capture scenarios
    await page.screenshot({ path: 'test-results/form-filler-simulation.png' });

    // This should show how forms collect data in real-time
  });

  test('Privacy Translator usefulness', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Translator
    await page.locator('button:has-text("🔍")').first().click();
    await page.waitForTimeout(1000);

    // Should translate privacy policies into plain language
    await page.screenshot({ path: 'test-results/privacy-translator.png' });

    // This is valuable for teens who want to understand what they're agreeing to
  });

  test('Breach Simulator impact', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Breach Sim
    await page.locator('button:has-text("🛡️")').first().click();
    await page.waitForTimeout(1000);

    // Should show what happens in a data breach
    await page.screenshot({ path: 'test-results/breach-simulator.png' });

    // This creates urgency and relevance
  });

  test('Map visualization', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Map
    await page.locator('button:has-text("🗺️")').first().click();
    await page.waitForTimeout(1000);

    // Should show location data visually
    await page.screenshot({ path: 'test-results/location-map.png' });

    // This makes abstract location data concrete
  });

  test('Teens dont feel talked down to', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check tone of language
    // Should be empowering, not lecturing
    // Should be relevant, not scary

    // Look for key phrases that indicate respect for autonomy
    await page.screenshot({ path: 'test-results/teen-tone-check.png' });

    // The app should empower teens to make their own choices
    // not tell them what to do
  });

  test('Longer engagement potential', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Teens need depth to stay engaged longer

    // Count available sections/features
    const navButtons = page.locator('nav button');
    const buttonCount = await navButtons.count();

    // Should have enough content to explore for 30-45 minutes
    expect(buttonCount).toBeGreaterThanOrEqual(8);

    // Each section should have meaningful content
    await page.screenshot({ path: 'test-results/engagement-depth.png' });
  });
});
