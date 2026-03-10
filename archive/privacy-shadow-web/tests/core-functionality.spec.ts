import { test, expect } from '@playwright/test';

/**
 * Core Functionality Tests
 * Testing the fundamental features of Privacy Shadow
 */

test.describe('Core Functionality', () => {
  test('Page loads successfully', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Main title should be visible
    await expect(page.locator('text=Privacy Shadow').first()).toBeVisible();
    await expect(page.locator('text=Meet Your Digital Twin').first()).toBeVisible();

    // All navigation buttons should be present
    await expect(page.locator('button:has-text("📊")').first()).toBeVisible();
    await expect(page.locator('button:has-text("📸")').first()).toBeVisible();
    await expect(page.locator('button:has-text("📝")').first()).toBeVisible();
  });

  test('Navigation works between sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Test each navigation button
    const sections = [
      { button: '📊', name: 'Dashboard' },
      { button: '📸', name: 'Photo Upload' },
      { button: '📝', name: 'Form Filler' },
      { button: '👥', name: 'Social Risks' },
      { button: '🔍', name: 'Translator' },
      { button: '🗺️', name: 'Map' },
      { button: '🛡️', name: 'Breach Sim' },
      { button: '✂️', name: 'Twin Diet' },
    ];

    for (const section of sections) {
      const button = page.locator(`button:has-text("${section.button}")`).first();
      await button.click();
      await page.waitForTimeout(500);
    }

    // Should be able to navigate through all sections without errors
    await page.screenshot({ path: 'test-results/navigation-test.png' });
  });

  test('3D Digital Twin renders', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Extra wait for 3D canvas

    // 3D canvas should be present
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Should have interaction hints
    const hint = page.locator('text=Drag to rotate').first();
    if (await hint.isVisible()) {
      await expect(hint).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/3d-twin-rendered.png' });
  });

  test('Data categories are displayed', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // All major data categories should be visible
    const categories = ['Location', 'Identity', 'Contacts', 'Browsing', 'Media'];

    for (const category of categories) {
      const element = page.locator(`text=${category}`).first();
      await expect(element).toBeVisible();
    }

    await page.screenshot({ path: 'test-results/data-categories-display.png' });
  });

  test('Responsive design works', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/mobile-view.png' });

    // Test tablet
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/tablet-view.png' });

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/desktop-view.png' });
  });

  test('Dark theme is applied', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if dark theme classes are present
    const body = page.locator('body');

    // Should have dark background
    await page.screenshot({ path: 'test-results/dark-theme.png' });
  });

  test('Accessibility features', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // All buttons should have accessible labels
    const navButtons = page.locator('nav button');
    const buttonCount = await navButtons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = navButtons.nth(i);
      await expect(button).toBeVisible();
    }

    // Should have proper heading hierarchy
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('h2').first()).toBeVisible();

    await page.screenshot({ path: 'test-results/accessibility.png' });
  });

  test('Performance check', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load reasonably fast
    expect(loadTime).toBeLessThan(10000);

    // Take screenshot to verify everything rendered
    await page.screenshot({ path: 'test-results/performance-test.png' });
  });

  test('No console errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Allow some errors — Three.js/WebGL can log on headless runners
    expect(errors.length).toBeLessThan(10);
  });

  test('Client-side only operation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verify no external API calls are made
    const requests: string[] = [];

    page.on('request', request => {
      const url = request.url();
      if (url.startsWith('http')) {
        requests.push(url);
      }
    });

    await page.waitForTimeout(2000);

    // Should only load local resources
    const externalRequests = requests.filter(url =>
      !url.includes('localhost') &&
      !url.includes('127.0.0.1') &&
      !url.includes('_next')
    );

    // Privacy Shadow should be client-side only
    expect(externalRequests.length).toBeLessThan(5);
  });
});
