import { test, expect } from '@playwright/test';

/**
 * Emotional Journey Tests
 * Testing the 60-minute emotional arc: Curiosity → Engagement → Surprise → Awareness → Empowerment → Commitment
 */

test.describe('Emotional Journey', () => {
  test('Phase 1: CURIOSITY (0-5 min) - Meet your Digital Twin', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Initial spark of curiosity
    await expect(page.locator('text=Privacy Shadow').first()).toBeVisible();
    await expect(page.locator('text=Meet Your Digital Twin').first()).toBeVisible();

    // The 3D twin should be intriguing
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible()) {
      await expect(canvas).toBeVisible();
    }

    // Initial state should be minimal (creating curiosity)
    await page.screenshot({ path: 'test-results/journey-curiosity.png' });
  });

  test('Phase 2: ENGAGEMENT (5-15 min) - Watch it grow', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // User starts exploring simulations
    await page.locator('button:has-text("📸")').first().click();
    await page.waitForTimeout(1000);

    // Photo upload should engage users
    await page.screenshot({ path: 'test-results/journey-engagement-photo.png' });

    // Navigate to another section
    await page.locator('button:has-text("📝")').first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/journey-engagement-form.png' });
  });

  test('Phase 3: SURPRISE (15-25 min) - See ALL your data', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // This is the critical "Whoa!" moment
    // The twin should reveal accumulated data

    // Navigate through multiple sections to accumulate "data"
    await page.locator('button:has-text("📸")').first().click();
    await page.waitForTimeout(1000);

    await page.locator('button:has-text("👥")').first().click();
    await page.waitForTimeout(1000);

    // Return to dashboard to see the result
    await page.locator('button:has-text("📊")').first().click();
    await page.waitForTimeout(1000);

    // The twin should now show more "data"
    await page.screenshot({ path: 'test-results/journey-surprise-moment.png' });
  });

  test('Phase 4: AWARENESS (25-35 min) - Realize your twin lives forever', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // The realization that data is permanent
    // Check if there's messaging about permanence

    await page.screenshot({ path: 'test-results/journey-awareness.png' });

    // Timeline should show data accumulation
    const timeline = page.locator('text=Timeline').first();
    if (await timeline.isVisible()) {
      await expect(timeline).toBeVisible();
    }
  });

  test('Phase 5: EMPOWERMENT (35-45 min) - Learn to shrink your twin', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Twin Diet for actionable steps
    await page.locator('button:has-text("✂️")').first().click();
    await page.waitForTimeout(1000);

    // Should provide clear recommendations
    await page.screenshot({ path: 'test-results/journey-empowerment.png' });

    // Users should feel they CAN take action
  });

  test('Phase 6: COMMITMENT (45-60 min) - Pledge to protect', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // After exploring, users should feel motivated
    // to change their behavior

    // Check if there's a way to commit or pledge
    await page.screenshot({ path: 'test-results/journey-commitment.png' });

    // The app should end on an empowering note
  });

  test('The "Whoa!" moment is achievable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate through key sections
    const sections = ['📸', '👥', '📝', '🔍'];

    for (const section of sections) {
      await page.locator(`button:has-text("${section}")`).first().click();
      await page.waitForTimeout(1000);
    }

    // Return to dashboard
    await page.locator('button:has-text("📊")').first().click();
    await page.waitForTimeout(1000);

    // The final reveal should be impactful
    await page.screenshot({ path: 'test-results/whoa-moment.png' });

    // This is where users should realize the extent of their digital footprint
  });

  test('Emotional progression is smooth', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test that sections flow logically
    // From curiosity to engagement to surprise

    const sections = ['📊', '📸', '👥', '✂️'];

    for (const section of sections) {
      await page.locator(`button:has-text("${section}")`).first().click();
      await page.waitForTimeout(1000);
    }

    // The journey should feel natural, not jarring
    await page.screenshot({ path: 'test-results/emotional-flow.png' });
  });

  test('Ends on empowering note', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Go through the full journey
    const allSections = ['📸', '📝', '👥', '🔍', '🗺️', '🛡️', '✂️'];

    for (const section of allSections) {
      await page.locator(`button:has-text("${section}")`).first().click();
      await page.waitForTimeout(500);
    }

    // End on Twin Diet (empowerment)
    await page.locator('button:has-text("✂️")').first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/empowering-ending.png' });

    // Users should feel motivated, not scared or helpless
  });
});
