# 🏗️ Architecture — Privacy Shadow

Technical deep-dive into how Privacy Shadow works.

---

## Overview

Privacy Shadow is a **Chrome MV3 extension** built with [Plasmo](https://plasmo.com). It runs entirely in the browser — no external API calls, no telemetry.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Tab (any site)                │
│                                                         │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │ form-monitor │  │stranger-monitor│  │image-monitor│ │
│  │   (input,    │  │ (chat/DM       │  │  (EXIF GPS  │ │
│  │   textarea)  │  │  inputs)       │  │   in files) │ │
│  └──────┬───────┘  └───────┬────────┘  └──────┬──────┘ │
│         │                  │                   │        │
└─────────┼──────────────────┼───────────────────┼────────┘
          │  chrome.runtime.sendMessage           │
          ▼                  ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│               Background Service Worker                  │
│                  (background.ts)                        │
│                                                         │
│  • Routes messages from all content scripts             │
│  • Stores alerts → chrome.storage.local (persist)       │
│  • Updates badge counter                                │
│  • Checks enabled flag + sensitivity threshold          │
└───────────────────────────┬─────────────────────────────┘
                            │  chrome.runtime.sendMessage
                            ▼
              ┌─────────────────────────┐
              │   Popup (popup.tsx)      │
              │                         │
              │  Parent / Kid / Settings│
              │  tabs — React UI        │
              └─────────────────────────┘
```

---

## Content Scripts

### `extension/contents/form-monitor.ts`

Attached to **all URLs** at `document_idle`.

**Flow:**
1. Scans for all `input[type=text]`, `input[type=email]`, `input[type=tel]`, `textarea`, and `div[contenteditable]` elements.
2. Attaches a debounced (600ms) `input` event listener to each.
3. On each keystroke, calls `detectPII(value, context)`.
4. If PII is detected above the sensitivity threshold (and not quiet hours, and protection is enabled):
   - Sends `FORM_SUBMISSION` to background
   - Calls `showPrivacyAlert()` — displays the kid-friendly overlay
5. Uses a `MutationObserver` to attach monitors to dynamically added inputs (SPAs).

**Platform detection:** `detectPlatform(url)` maps hostname → `instagram | twitter | facebook | tiktok | youtube | discord | generic`. Used to set `isPublic` and `isDirectMessage` context for the PII detector.

---

### `extension/contents/stranger-monitor.ts`

Targets DM/chat inputs specifically, using a list of platform-specific CSS selectors (`CHAT_SELECTORS`).

**Flow:**
1. Attaches a debounced (800ms) `input` listener to every matched element.
2. Appends each new value to a `conversationBuffer` (last ~500 chars).
3. Calls `detectStrangerRisk(buffer)`.
4. If `level === 'warning' || 'danger'`:
   - Shows `ps-stranger-overlay` (full-screen red warning)
   - Sends `STRANGER_RISK_DETECTED` to background
5. On Enter key: keeps last 200 chars of buffer (context fades, not wiped).

---

### `extension/contents/image-monitor.ts`

Intercepts `<input type="file">` change events. Uses the `exifr` library to extract GPS coordinates from image EXIF data. If coordinates are found, blocks the upload and sends `IMAGE_UPLOAD` to background.

---

## Detection Engine

### `extension/detection/pii-detector.ts`

```
detectPII(text, context) → DetectedPII[]
```

Uses an array of `PIIPattern` objects. Each pattern has:
- `type`: one of 7 categories
- `regex[]`: one or more RegExp patterns
- `severity`: low / medium / high
- `description`: human-readable label

Special logic:
- `combineResults()` deduplicates overlapping matches
- `applyContextFilters()` elevates severity based on context (public post, DM, platform)
- `checkDangerousCombinations()` escalates score when e.g. financial + birthdate appear together

### `extension/detection/stranger-detector.ts`

```
detectStrangerRisk(text) → StrangerRisk { score, level, flags, categories }
```

Uses 7 `RULE_GROUPS`, each with:
- `category`: e.g. `secrecy`, `meeting`, `gift_bribe`
- `weight`: contribution to total score (15–35)
- `patterns[]`: RegExp patterns

Scoring algorithm:
1. Each category fires at most once (regardless of how many patterns match).
2. `score = sum of weights of triggered categories`
3. Multi-category bonus: +15 if ≥3 categories, +20 if ≥4
4. Capped at 100
5. Level: `safe` (0–14) / `watch` (15–34) / `warning` (35–59) / `danger` (60+)

---

## Background Service Worker

### `background.ts`

**Message handlers:**

| Message | Handler |
|---------|---------|
| `GET_ALERTS` | Returns `cachedAlerts` + `piiCount` + `strangerCount` |
| `FORM_SUBMISSION` | Scores PII, checks threshold + enabled, calls `storeAlert()` |
| `SOCIAL_POST_DETECTED` | Same as FORM_SUBMISSION |
| `IMAGE_UPLOAD` | Fixed medium risk score, calls `storeAlert()` |
| `STRANGER_RISK_DETECTED` | Stores as `stranger_risk` type alert |
| `DETECT_PII` | Ad-hoc PII check, returns results (used by demo page) |
| `GET_SETTINGS` | Calls `loadSettings()` |
| `SAVE_SETTINGS` | Calls `saveSettings()` |
| `CLEAR_BADGE` | Resets `unreadCount` to 0 |
| `DISMISS_ALERT` | Removes one alert by ID |
| `CLEAR_ALL_ALERTS` | Wipes all alerts |

**Storage:**
- `chrome.storage.local` → `ps_alerts` (array), `ps_unread` (int)
- Loaded on service worker start. Persisted after every mutation.
- Cap: 50 alerts.

**Badge:**
- `updateBadge()` calls `chrome.action.setBadgeText` + `setBadgeBackgroundColor('#ef4444')`
- Shows count up to 99, then "99+"
- Cleared when popup opens (`CLEAR_BADGE`)

---

## Settings

### `extension/utils/settings.ts`

Stored in `chrome.storage.sync` (follows user across devices).

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `true` | Master kill-switch |
| `sensitivity` | `low\|medium\|high` | `medium` | Alert threshold |
| `quietHours.enabled` | boolean | `false` | Pause during sleep |
| `quietHours.start` | string HH:MM | `"21:00"` | Quiet start time |
| `quietHours.end` | string HH:MM | `"07:00"` | Quiet end time |
| `showTips` | boolean | `true` | Tips in alert overlays |

Sensitivity thresholds (min score to trigger alert):
- `high` → 1 (any match)
- `medium` → 25
- `low` → 50

---

## Alert Overlay UI

### `extension/utils/alert-overlay.ts`

Injects a full-page overlay DOM element with:
- Risk level emoji + heading
- Detected PII list
- Educational tip (if `showTips` enabled)
- **Stop & Fix it** button (clears the input)
- **Continue Anyway** button

### `extension/contents/stranger-monitor.ts` → `showStrangerWarning()`

Injects a similar overlay styled red with:
- "Stranger Danger Alert" heading
- List of triggered warning flags
- Safety tip
- **← Go Back** (clears input + focuses it)
- **Continue Anyway**

---

## Testing

```
tests/
├── pii-detection.spec.ts     # Playwright E2E (21 tests)

extension/detection/__tests__/
├── pii-detector.test.ts      # Jest unit (25 tests)
├── stranger-detector.test.ts # Jest unit (18 tests)
└── risk-scoring.test.ts      # Jest unit (13 tests)
```

Run:
```bash
npm test               # Jest (56 tests, ~2s)
npm run test:e2e       # Playwright (21 tests, ~10s)
```

---

## Build System

Plasmo handles:
- TypeScript compilation
- React JSX transform
- Content script injection manifest
- Service worker bundling
- Output to `build/chrome-mv3-dev/`

```bash
npm run build   # Production build
npm run dev     # Watch mode
```

---

*[← Back to docs](./README.md)*
