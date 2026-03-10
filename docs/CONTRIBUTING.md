# Contributing to Privacy Shadow

Thank you for helping make the internet safer for kids! 🛡️

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Adding Detection Patterns](#adding-detection-patterns)
- [Running Tests](#running-tests)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/privacy-shadow.git
   cd privacy-shadow
   npm install
   ```

2. **Create a branch** for your change:
   ```bash
   git checkout -b feat/my-improvement
   ```

3. **Build and verify** everything works before you start:
   ```bash
   npm run build
   npm test
   ```

---

## Development Setup

### Requirements

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| Chrome | ≥ 120 (for extension testing) |

### Key commands

```bash
npm run dev          # Watch mode — Plasmo rebuilds on save
npm run build        # Production build → build/chrome-mv3-prod/
npm test             # Unit tests (Jest)
npx playwright test  # E2E tests (requires built extension)
```

### Loading the extension in Chrome

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** → select `build/chrome-mv3-dev/`
5. Navigate to Instagram, Twitter, Discord etc. to test

---

## Project Structure

```
privacy-shadow/
├── background.ts                     # Service worker: alert storage, badge, message routing
├── content.ts                        # Entry point: imports all content scripts
├── popup.tsx                         # Extension popup UI
├── extension/
│   ├── contents/
│   │   ├── form-monitor.ts           # Monitors text inputs for PII
│   │   ├── image-classifier.ts       # Checks image uploads
│   │   └── stranger-monitor.ts       # Detects grooming patterns in DMs
│   ├── detection/
│   │   ├── pii-detector.ts           # PII pattern matching engine
│   │   └── stranger-detector.ts      # Grooming/stranger risk scoring
│   └── utils/
│       └── settings.ts               # Settings schema, storage helpers
├── tests/                            # Playwright E2E tests
├── test.html                         # Interactive demo for manual testing
└── demos/
    ├── showcase.html                 # Hackathon judge showcase page
    └── index.html                    # Demo hub
```

---

## Adding Detection Patterns

### PII patterns (`extension/detection/pii-detector.ts`)

Each pattern group has a `type`, `severity`, `description`, and an array of `regex`:

```typescript
{
  type: 'contact',          // One of the PIIPattern types
  regex: [
    /my email is [\w.]+@[\w.]+\.\w{2,}/gi,
  ],
  severity: 'high',
  description: 'Email address'
}
```

**Types**: `location` | `birthdate` | `contact` | `image` | `address` | `school` | `financial` | `identity`

**Severity guide**:
- `high` — directly identifies/locates a person (phone, address, SSN, card number)
- `medium` — narrows identity with context (school name, team name)
- `low` — minor information leak on its own

**Testing your pattern** — add a unit test in `tests/`:

```typescript
import { detectPII } from '../extension/detection/pii-detector';

test('detects new pattern', () => {
  const result = detectPII('my example text here');
  expect(result.some(p => p.type === 'contact')).toBe(true);
});
```

### Stranger/grooming patterns (`extension/detection/stranger-detector.ts`)

Each rule group has a `category`, `weight`, and `patterns` array of RegExps:

```typescript
{
  category: 'secrecy',   // One of the 7 categories
  weight: 25,             // 0–35 points per firing category
  patterns: [
    /don't tell anyone/gi,
    /keep this between us/gi,
  ]
}
```

**Categories and weights**:
| Category | Weight | Description |
|----------|--------|-------------|
| `secrecy` | 25 | Requests to hide communication |
| `meeting` | 30 | Attempts to meet in person |
| `personal_info` | 20 | Soliciting private details |
| `age_inappropriate` | 35 | Sexual or adult content |
| `gift_bribe` | 20 | Offering gifts or money |
| `isolation` | 20 | Trying to separate from family/friends |
| `pressure` | 15 | Urgency or manipulation tactics |

Bonus: +15 if ≥3 categories fire, +20 if ≥4. Threshold: score ≥ 35 shows a warning overlay.

---

## Running Tests

### Unit tests

```bash
npm test                    # Run all 56 unit tests
npm test -- --watch         # Watch mode
npm test -- pii-detector    # Run a specific test file
```

Tests live in `tests/*.test.ts` and use Jest + ts-jest.

### E2E tests

```bash
npm run build               # Must build first
npx playwright test         # Run all 21 E2E tests
npx playwright test --ui    # Interactive UI mode
```

E2E tests load `test.html` in a real browser and verify the extension intercepts inputs.

### Before submitting

Ensure all tests pass and TypeScript compiles clean:

```bash
npx tsc --noEmit && npm test && npx playwright test
```

---

## Submitting a Pull Request

1. Keep changes focused — one feature/fix per PR
2. Add or update tests for any new detection patterns
3. Update `docs/FEATURES.md` if adding a new capability
4. Run the full test suite before pushing
5. Write a clear PR description: what problem does this solve? How did you test it?

### Commit message format

```
type: short description

Optional longer explanation.
```

**Types**: `feat` | `fix` | `test` | `docs` | `refactor` | `perf`

Examples:
```
feat: add TikTok comment monitoring
fix: handle obfuscated phone numbers with unicode spaces
test: add E2E test for form submission on Discord
docs: update QUICKSTART with Windows-specific steps
```

---

## Reporting Issues

Found a false positive? A pattern that should be detected but isn't? Please open an issue with:

- **Platform**: Instagram / Twitter / Discord / etc.
- **Input text** (redact any real personal info): e.g. `"my team the [Eagles]"`
- **Expected behavior**: should/shouldn't trigger
- **Actual behavior**: what happened

For security vulnerabilities, please email the maintainers directly rather than opening a public issue.

---

## Code Style

- TypeScript everywhere — no plain `.js` files in `extension/`
- No comments for obvious code; comments for non-obvious regex or algorithm choices
- Detection engines (`pii-detector.ts`, `stranger-detector.ts`) are pure functions — no side effects, no DOM access
- Content scripts are thin: detect → message → done

Thank you for contributing! 🙏
