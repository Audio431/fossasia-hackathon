# 🧪 Privacy Shadow Testing Guide

## Quick Start

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- tests/young-kids-experience.spec.ts
npm test -- tests/middle-kids-experience.spec.ts
npm test -- tests/teens-experience.spec.ts

# Run with UI (interactive)
npm run test:ui

# View HTML report
npm run test:report

# Run in headed mode (see browser)
npm run test:headed
```

---

## Test Structure

```
tests/
├── young-kids-experience.spec.ts    # 6-8 year olds
├── middle-kids-experience.spec.ts   # 9-12 year olds
├── teens-experience.spec.ts         # 13-17 year olds
├── core-functionality.spec.ts       # Technical tests
├── emotional-journey.spec.ts        # UX flow tests
├── smoke.spec.ts                    # Basic sanity checks
└── helpers.ts                       # Reusable utilities
```

---

## Kid Personas

### Young Kids (6-8)
- **Maya (7)** - Tablet Native, explores without reading
- **Noah (6)** - Needs clear instructions
- **Zoe (8)** - Gamer, understands customization

### Middle Kids (9-12)
- **Emma (11)** - Oversharer, needs "Whoa!" moment
- **Sophia (9)** - Visual learner, likes charts
- **Jayden (10)** - Explorer, clicks everything

### Teens (13-17)
- **Aisha (16)** - Privacy skeptic, technical
- **Marcus (14)** - Social media addict
- **Rio (15)** - Code curious, wants accuracy

---

## Key Test Metrics

| Metric | Value |
|--------|-------|
| Total Tests | 132 |
| Passed | 101 |
| Failed | 31 |
| Pass Rate | 76% |
| Duration | 3.1 min |
| Devices | 3 |

---

## Common Issues & Fixes

### Issue: "strict mode violation"
**Cause:** Multiple elements match selector
**Fix:** Use `.first()` or more specific selectors

```typescript
// ❌ Bad
await expect(page.locator('text=👻')).toBeVisible();

// ✅ Good
await expect(page.locator('text=👻').first()).toBeVisible();
```

### Issue: "element not enabled"
**Cause:** Button not ready when clicked
**Fix:** Wait for button to be enabled

```typescript
// ✅ Good
await button.waitFor({ state: 'attached' });
await button.click();
```

### Issue: "element not visible"
**Cause:** 3D canvas takes time to render
**Fix:** Add longer wait times

```typescript
// ✅ Good
await page.waitForLoadState('networkidle');
await page.waitForTimeout(2000);
```

---

## Adding New Tests

1. Create test file in `tests/`
2. Import test utilities:

```typescript
import { test, expect } from '@playwright/test';
import { TestHelpers } from './helpers';
```

3. Write test:

```typescript
test('my new test', async ({ page }) => {
  const helpers = new TestHelpers(page);
  await page.goto('/');
  await helpers.waitForAppLoad();

  // Your test code here
});
```

---

## Viewing Results

```bash
# Open HTML report
npm run test:report

# View screenshots
open test-results/*.png

# Check specific test failure
cat test-results/[test-name]/error-context.md
```

---

## Debugging Tips

1. **Run single test:**
   ```bash
   npm test -- -g "test name"
   ```

2. **Run with headed mode:**
   ```bash
   npm run test:headed -- -g "test name"
   ```

3. **Use Playwright Inspector:**
   ```bash
   npm run test:ui
   ```

4. **Check screenshots:**
   - Screenshots automatically saved on failure
   - Located in `test-results/`

---

## Continuous Integration

Add to your CI pipeline:

```yaml
- name: Run tests
  run: npm test

- name: Upload test results
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

---

## Best Practices

1. ✅ **Use specific selectors** - Avoid duplicate matches
2. ✅ **Wait for app load** - Add proper wait times
3. ✅ **Take screenshots** - Document visual state
4. ✅ **Test on real devices** - Use mobile/tablet viewports
5. ✅ **Keep tests independent** - Each test should work alone
6. ✅ **Use helpers** - Reusable utilities in `helpers.ts`
7. ✅ **Add descriptions** - Explain what you're testing
8. ✅ **Handle flakiness** - Retry failed tests if needed

---

## Troubleshooting

### Tests timeout
- Increase timeout: `test.setTimeout(60000)`
- Check if server is running on port 3001
- Verify network connection

### Screenshots not saving
- Check write permissions
- Verify `test-results/` directory exists
- Check disk space

### Server not starting
- Kill existing process: `lsof -ti:3001 | xargs kill`
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `npm install`

---

## Resources

- **Playwright Docs:** https://playwright.dev
- **Playwright GitHub:** https://github.com/microsoft/playwright
- **Test Report:** `npx playwright show-report`
- **Project README:** `README.md`

---

**Happy Testing!** 🧪✨
