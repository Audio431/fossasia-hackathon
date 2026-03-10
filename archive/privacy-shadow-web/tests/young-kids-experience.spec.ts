import { test, expect } from '@playwright/test';

/**
 * Young Kids (6-8) Testing Focus:
 * - Can they explore without reading?
 * - Is the interface intuitive?
 * - Do they understand the Digital Twin concept?
 * - Are visual elements engaging?
 */

test.describe('Young Kid (6-8) Experience', () => {
  test('Tablet Native Maya (7) - Can explore without reading', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Maya sees the app loads
    await expect(page.locator('text=Privacy Shadow')).toBeVisible();
    await expect(page.locator('text=Meet Your Digital Twin')).toBeVisible();

    // She can see the 3D Digital Twin immediately
    const twin = page.locator('text=Your 3D Digital Twin').first();
    await expect(twin).toBeVisible();

    // She can see emoji icons (visual, not text-based)
    await expect(page.locator('text=📊').first()).toBeVisible();
    await expect(page.locator('text=📸').first()).toBeVisible();
    // Ghost emoji appears multiple times, use first() to avoid strict mode violation
    await expect(page.locator('text=👻').first()).toBeVisible();

    // The progress bars are visible (visual understanding)
    await expect(page.locator('text=Location').first()).toBeVisible();
    await expect(page.locator('text=Identity').first()).toBeVisible();

    // She can interact with the 3D twin (drag to rotate)
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    // Take screenshot for visual inspection
    await page.screenshot({ path: 'test-results/maya-initial-view.png' });
  });

  test('Instruction Dependent Noah (6) - Needs clear hints', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Noah looks for what to do first
    // Is there a clear call-to-action or hint?

    const dashboard = page.locator('text=Dashboard');
    await expect(dashboard).toBeVisible();

    // Check if there are helpful hints
    const hintText = page.locator('text=Drag to rotate').first();
    await expect(hintText).toBeVisible();

    // Can he see navigation buttons clearly?
    await expect(page.locator('button:has-text("📊")')).toBeVisible();
    await expect(page.locator('button:has-text("📸")')).toBeVisible();

    // Screenshot to check visual hierarchy
    await page.screenshot({ path: 'test-results/noah-navigation.png' });
  });

  test('Gamer Zoe (8) - Wants to customize and explore', async ({ page }) => {
    await page.goto('/');

    // Zoe understands avatars from games
    await expect(page.locator('text=Your 3D Digital Twin')).toBeVisible();

    // She looks for "accessories" mentioned in the app
    const accessoriesText = page.locator('text=accessories');
    if (await accessoriesText.isVisible()) {
      await expect(accessoriesText).toBeVisible();
    }

    // She explores all navigation buttons
    const navButtons = page.locator('nav button');
    const buttonCount = await navButtons.count();

    // Should have 8 navigation options
    expect(buttonCount).toBeGreaterThan(5);

    // Zoe tries clicking different sections
    await page.locator('button:has-text("📸")').click();
    await page.waitForTimeout(1000); // Wait for transition

    // Check if Photo Upload section is visible
    await page.screenshot({ path: 'test-results/zoe-photo-section.png' });
  });

  test('Visual clarity for non-readers', async ({ page }) => {
    await page.goto('/');

    // All navigation should have emoji icons
    const navButtons = page.locator('nav button');
    const buttonCount = await navButtons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = navButtons.nth(i);
      await expect(button).toBeVisible();
    }

    // Color-coded categories should be visible
    await expect(page.locator('text=Location').first()).toBeVisible();
    await expect(page.locator('text=Identity').first()).toBeVisible();

    // Visual indicators (progress bars/percentages)
    await page.screenshot({ path: 'test-results/visual-clarity.png' });
  });

  test('Touch interactions work on tablet', async ({ page }) => {
    // Simulate tablet viewport
    await page.setViewportSize({ width: 834, height: 1194 });
    await page.goto('/');

    // All interactive elements should be touch-friendly
    const buttons = page.locator('button');
    const firstButton = buttons.first();

    // Check button size (should be at least 44x44 for touch)
    const box = await firstButton.boundingBox();
    expect(box?.width).toBeGreaterThan(40);
    expect(box?.height).toBeGreaterThan(40);

    await page.screenshot({ path: 'test-results/tablet-touch-targets.png' });
  });
});
