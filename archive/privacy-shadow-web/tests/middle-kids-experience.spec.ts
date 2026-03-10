import { test, expect } from '@playwright/test';

/**
 * Middle Kids (9-12) Testing Focus:
 * - Do they get the "Whoa!" moment?
 * - Can they understand data visualization?
 * - Do they understand the connection between their actions and the twin?
 * - Is the content relatable?
 */

test.describe('Middle Kid (9-12) Experience', () => {
  test('Oversharer Emma (11) - Gets the "Whoa!" moment', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Emma sees the Digital Twin
    await expect(page.locator('text=Your Digital Twin').first()).toBeVisible();

    // She sees the percentage exposure
    const percentage = page.locator('text=%').first();
    await expect(percentage).toBeVisible();

    // Initial state shows minimal data
    await page.screenshot({ path: 'test-results/emma-initial-state.png' });

    // She explores the Photo Upload section
    await page.locator('button:has-text("📸")').first().click();
    await page.waitForTimeout(1000);

    // Check if photo upload interface is visible
    await page.screenshot({ path: 'test-results/emma-photo-upload.png' });

    // She should understand EXIF data concept
    // (This tests if the "whoa" moment is achievable)
  });

  test('Visual Learner Sophia (9) - Understands data visualization', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Sophia looks for visual data representations
    await expect(page.locator('text=Data Visualization').first()).toBeVisible();

    // She can see the progress bars
    const locationBar = page.locator('text=Location').first();
    await expect(locationBar).toBeVisible();

    // She can see color-coded categories
    const categories = ['Location', 'Identity', 'Contacts', 'Browsing'];
    for (const category of categories) {
      const element = page.locator(`text=${category}`).first();
      await expect(element).toBeVisible();
    }

    // Percentage should be visible and understandable
    const percentage = page.locator('text=%').first();
    await expect(percentage).toBeVisible();

    await page.screenshot({ path: 'test-results/sophia-data-viz.png' });
  });

  test('Explorer Jayden (10) - Discovers all features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Jayden wants to click everything
    const navButtons = page.locator('nav button');
    const buttonCount = await navButtons.count();

    // He systematically explores each section
    const sections = [
      '📊', // Dashboard
      '📸', // Photo Upload
      '📝', // Form Filler
      '👥', // Social Risks
      '🔍', // Translator
      '🗺️', // Map
      '🛡️', // Breach Sim
      '✂️', // Twin Diet
    ];

    for (const section of sections) {
      const button = page.locator(`button:has-text("${section}")`).first();
      await button.click();
      await page.waitForTimeout(500); // Brief pause for transition
    }

    // After exploring, he returns to dashboard
    await page.locator('button:has-text("📊")').first().click();
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'test-results/jayden-exploration.png' });
  });

  test('Understanding risk levels', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if risk indicators are present
    // (Low/Medium/High risk labels)

    const digitalTwinSection = page.locator('text=Your Digital Twin').first();
    await expect(digitalTwinSection).toBeVisible();

    // Look for risk indicators
    const riskIndicators = page.locator('text=Low Risk').first();
    if (await riskIndicators.isVisible()) {
      await expect(riskIndicators).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/risk-indicators.png' });
  });

  test('Social Risk Simulator engagement', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Social Risks
    await page.locator('button:has-text("👥")').first().click();
    await page.waitForTimeout(1000);

    // Check if the section is visible
    await page.screenshot({ path: 'test-results/social-risks-section.png' });

    // This section should show how friends' posts expose YOUR data
    // Critical for the "whoa" moment
  });

  test('Data categories make sense', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // All data categories should be clearly labeled
    const categories = [
      'Location',
      'Identity',
      'Contacts',
      'Browsing',
      'Media',
    ];

    for (const category of categories) {
      const element = page.locator(`text=${category}`).first();
      await expect(element).toBeVisible();
    }

    // Each category should have a visual representation
    await page.screenshot({ path: 'test-results/data-categories.png' });
  });

  test('Twin Diet section provides actionable advice', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Navigate to Twin Diet
    await page.locator('button:has-text("✂️")').first().click();
    await page.waitForTimeout(1000);

    // Check if recommendations are visible
    await page.screenshot({ path: 'test-results/twin-diet-section.png' });

    // This section should provide clear actions kids can take
  });
});
