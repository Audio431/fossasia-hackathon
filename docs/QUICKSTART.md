# ⚡ Quick Start — Privacy Shadow

Get Privacy Shadow running in your browser in about 3 minutes.

---

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Google Chrome** (or any Chromium-based browser)

---

## 1. Install

```bash
git clone https://github.com/Audio431/fossasia-hackathon.git
cd privacy-shadow
npm install
```

## 2. Build

```bash
npm run build
```

This outputs the extension to `build/chrome-mv3-dev/`.

## 3. Load in Chrome

1. Open **chrome://extensions/**
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `build/chrome-mv3-dev` folder
5. The 👻 Privacy Shadow icon appears in your toolbar

## 4. Try the Demo

Open `test.html` in your browser (drag it into a Chrome tab):

```
privacy-shadow/test.html
```

The demo page lets you:
- Auto-fill PII scenarios (phone, address, SSN, credit card…)
- Auto-fill grooming pattern scenarios
- Watch the activity log update in real time

> **Note:** The extension overlay alerts only appear on actual websites (the content scripts require a real page origin). The demo page is designed for structure verification and E2E testing.

---

## Development Workflow

```bash
npm run dev         # Watch mode — rebuilds on file changes
npm test            # Unit tests (56 tests, ~2s)
npm run test:e2e    # E2E tests with Playwright (21 tests)
npx tsc --noEmit    # Type-check only
```

---

## What Happens When It Runs

Once loaded, Privacy Shadow:

1. **`form-monitor.ts`** — attaches to every text input and textarea on every website. On each keystroke (debounced 600ms), runs PII detection. If PII is found above the sensitivity threshold, shows a kid-friendly alert overlay.

2. **`stranger-monitor.ts`** — attaches specifically to DM/chat inputs on Instagram, TikTok, Snapchat, Discord, and similar. Accumulates conversation context and scans for grooming patterns. Shows a red "Stranger Danger" overlay if the score reaches `warning` or `danger`.

3. **`image-monitor.ts`** — intercepts image uploads and scans EXIF data for GPS coordinates. Blocks uploads that would reveal location.

4. **Background service worker** — routes alerts from content scripts → persistent storage → popup badge counter.

5. **Popup** — open by clicking the extension icon. Shows Parent view (alert history), Kid view (privacy score), and Settings.

---

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| Protection | On | Master kill-switch for all monitoring |
| Sensitivity | Medium | Score threshold to show alerts |
| Quiet Hours | Off | Pause alerts during sleep hours |
| Educational Tips | On | Show safety tips inside alert overlays |

---

## Troubleshooting

**Extension not showing alerts on a website?**
- Make sure the extension is enabled in `chrome://extensions/`
- Make sure Protection is **On** in the Settings tab of the popup
- Try reloading the page after installing

**Build errors?**
- Run `npx tsc --noEmit` to see TypeScript errors
- Check Node version: `node --version` (need 18+)

**Tests failing?**
- `npm test` — Jest unit tests should all pass
- `npx playwright install chromium` if E2E tests can't find a browser

---

*[← Back to docs](./README.md)*
