# 👻 Privacy Shadow

![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-56%20passing-brightgreen)
![TypeScript](https://img.shields.io/badge/Code-TypeScript-3178C6?logo=typescript)
![React](https://img.shields.io/badge/UI-React-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

> **🛡️ Real-Time Privacy Protection for Kids Online**

**Privacy Shadow** is a Chrome extension that watches for personal information (PII) and grooming patterns in real time — alerting kids before they share something they shouldn't, and notifying parents when something worrying happens.

---

## 🚀 Quick Start

```bash
git clone https://github.com/Audio431/fossasia-hackathon.git
cd privacy-shadow
npm install
npm run build
```

**Load in Chrome**:
1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select `build/chrome-mv3-dev`

**Try the Demo**: Open `demos/index.html` or `demos/showcase.html` in your browser.

📖 See [Quick Start Guide](./docs/QUICKSTART.md) for a detailed walkthrough.

---

## 📚 Documentation

- **[Quick Start](./docs/QUICKSTART.md)** — Get running in 3 minutes
- **[Demo Instructions](./docs/DEMO_INSTRUCTIONS.md)** — 10-minute judge demo script
- **[Features](./docs/FEATURES.md)** — Full feature list and status
- **[Architecture](./docs/ARCHITECTURE.md)** — Technical deep-dive

---

## 🎯 Key Features

### 🔒 PII Detection Engine
- **7 categories**: birth date/age, location, contact info, home address, school/team, financial data, government ID
- Detects common obfuscation (written-out phone numbers, shorthand ages)
- Context-aware: stricter on public posts vs. DMs
- Platform-specific Instagram bio/location scraping

### 🚨 Stranger Danger Monitor
- **7 grooming pattern categories**: secrecy requests, meeting solicitations, personal info harvesting, age-inappropriate content, gift/bribe offers, isolation tactics, pressure/urgency
- Accumulates conversation context across messages
- Risk levels: `watch` → `warning` → `danger`
- Shows a red overlay warning kids to stop and tell a trusted adult

### 🛡️ Multi-Platform Support
Instagram · Twitter/X · Facebook · TikTok · YouTube · Discord · Snapchat

### 👨‍👩‍👧 Parent Popup Dashboard
- Persistent alert history (survives browser restarts)
- Separate PII vs. Stranger alert counts
- 4-stat header: today / this week / PII blocked / stranger flags
- Unread badge counter on extension icon
- Master on/off toggle
- Sensitivity levels (Low / Medium / High)
- Quiet hours (pause alerts during sleep)
- Educational tips toggle

---

## 🎬 Demo

- **[Interactive Demo](./test.html)** — Fill PII and grooming scenarios, see the logger
- **[Visual Showcase](./demos/showcase.html)** — Hackathon judge presentation

---

## 📊 Detection Coverage

| Category | Examples Detected |
|----------|------------------|
| Birth date & age | "I'm turning 14", "born 03/15/2010", "7th grader" |
| Location | "I live in Springfield, IL", GPS coordinates |
| Contact info | Phone numbers, email addresses |
| Home address | "123 Main St", street + city combos |
| School / team | "I go to Lincoln Middle School", team names |
| Financial | Credit card numbers, SSNs, bank accounts |
| Government ID | Passport numbers, license plates |
| Secrecy | "Don't tell your parents about us" |
| Meeting | "Can we meet up in person?" |
| Gift / Bribe | "I'll buy you a gift card" |
| Age-inappropriate | Sexual content directed at minors |
| Isolation | "Your friends don't understand you like I do" |

---

## 🏗️ Tech Stack

- **Framework**: [Plasmo](https://plasmo.com) (Chrome MV3 extension)
- **UI**: React + TypeScript + Tailwind CSS
- **Detection**: Custom heuristic engine (rule-based, no external API)
- **Storage**: `chrome.storage.local` (alerts) + `chrome.storage.sync` (settings)
- **Testing**: Jest (56 unit tests) + Playwright (21 E2E tests)
- **Platforms**: Chrome, Edge

---

## 📁 Project Structure

```
privacy-shadow/
├── background.ts              # Service worker — alert storage, badge, message routing
├── content.ts                 # Content script entry — imports all monitors
├── popup.tsx                  # Extension popup — Parent/Kid/Settings tabs
├── test.html                  # Interactive demo page
├── extension/
│   ├── detection/
│   │   ├── pii-detector.ts    # PII detection engine (7 categories, 30+ patterns)
│   │   └── stranger-detector.ts # Grooming pattern detector (7 categories)
│   ├── contents/
│   │   ├── form-monitor.ts    # Real-time input monitoring
│   │   ├── stranger-monitor.ts # DM/chat grooming detection
│   │   └── image-monitor.ts   # EXIF GPS detection on image uploads
│   └── utils/
│       └── settings.ts        # Settings storage and defaults
├── docs/                      # Documentation
├── demos/                     # Showcase pages
└── tests/                     # Playwright E2E tests
```

---

## 🧪 Tests

```bash
npm test                  # 56 unit tests (Jest)
npm run test:e2e          # 21 E2E tests (Playwright)
```

---

## 🤝 Contributing

Issues and PRs welcome! See [Architecture](./docs/ARCHITECTURE.md) for the codebase map.

---

## 📜 License

MIT — see [LICENSE](./LICENSE)

---

## 🙏 Acknowledgments

Built for **FOSSASIA 2026 Hackathon**  
Powered by [Plasmo Framework](https://plasmo.com), React, and a lot of care for kids' safety online.

---

**👻 Protecting young users online, one alert at a time.**

