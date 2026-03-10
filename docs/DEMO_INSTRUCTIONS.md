# 🎬 Demo Instructions — Privacy Shadow

A complete 10-minute walkthrough for hackathon judges and reviewers.

---

## Setup (Before You Begin)

1. Build and load the extension (see [Quick Start](./QUICKSTART.md))
2. Open `test.html` in Chrome (drag the file into a tab, or use `file://` URL)
3. Click the 👻 extension icon to open the popup — keep it pinned

---

## Part 1 — PII Detection (4 minutes)

### 1a. Show the Demo Page

Point out the page structure:
- **Status badge** — shows "Privacy Shadow: Active ✓"
- **8 PII scenario cards** — each auto-fills a realistic privacy risk
- **10 detection type badges** — what the engine can identify
- **8 platform logos** — supported sites

### 1b. Trigger PII Alerts

Click **Auto-fill** on each card in order. For each one, describe what's being detected:

| Card | What to say |
|------|-------------|
| 📅 Birth Date | "A kid types their birthday in a profile form — Privacy Shadow catches the date pattern before it's submitted." |
| 📍 Location | "Mentioning your city and state in a post. The engine matches location indicators like 'I live in…'" |
| 📞 Phone Number | "Even formatted numbers like (555) 867-5309 are detected — common in Instagram bios." |
| 🏠 Home Address | "Street address with house number — Privacy Shadow blocks this across all platforms." |
| 💳 Credit Card | "Four groups of digits matching card number patterns — detected in real time as you type." |
| 🔑 SSN | "Social Security Number — high severity. Immediate alert." |
| 🏫 School/Team | "School or team name with context clues ('I go to Lincoln Middle'). Kids often share this without thinking." |
| ⚠️ Max Risk Combo | "Name + phone + birthday in one message — critical risk score, strongest alert." |

### 1c. Show the Activity Log

Scroll to the bottom of the demo page. The log shows every fill event with color-coded entries. Click **Clear** to reset.

---

## Part 2 — Stranger Detection (3 minutes)

Scroll to the **Grooming Pattern Detection** section (red banner).

Explain: *"This monitors DM-style chat inputs on Instagram, TikTok, Snapchat, Discord. It accumulates conversation context and scores against 7 grooming pattern categories."*

Click **Auto-fill** on each grooming card:

| Card | Category | What to say |
|------|----------|-------------|
| 🔒 Secrecy Request | secrecy (25pts) | "Classic grooming opener — asking a child to hide the conversation." |
| 📍 Meeting Request | meeting (30pts) | "Attempting to move contact offline. Highest-risk single category." |
| 🎁 Gift/Bribe | gift_bribe (20pts) | "Offering gifts or money in exchange for personal info or meetings." |
| 💬 Full Combo | all categories | "This triggers secrecy + meeting + isolation + bribe simultaneously — score goes critical (danger level), which would show the red overlay in a real DM." |

---

## Part 3 — Parent Popup (2 minutes)

Click the 👻 extension icon.

Walk through each tab:

**Parent tab:**
- Show the 4-stat header: today's alerts / this week / PII blocked / stranger flags
- If you triggered alerts in Parts 1 & 2, they appear here as cards
- Each card has a 🔒 PII or 🚨 Stranger badge
- "Alerts persist across browser restarts — stored in `chrome.storage.local`"

**Kid tab:**
- Privacy score (100 minus weekly alerts × 8)
- Encouraging message
- Quick safety tips

**Settings tab:**
- Show the master 🛡️ Protection toggle — "Parents can pause all monitoring at any time"
- Sensitivity: Low / Medium / High
- Quiet Hours — "Don't alert during 10pm–7am, for example"
- Educational Tips — "Whether to show safety guidance inside the alert overlays"

---

## Part 4 — Architecture Highlight (1 minute)

*"Everything runs 100% locally — no data leaves the device. The detection engine is a custom rule-based system with 30+ regex patterns and 7 grooming categories. No external API, no telemetry."*

Open `extension/detection/pii-detector.ts` briefly to show the pattern structure, then `stranger-detector.ts` to show the scoring system.

*"56 unit tests, 21 Playwright E2E tests — everything green."*

---

## Q&A Talking Points

**"Why not use an ML model?"**
> We designed the heuristic engine to be transparent, auditable, and fast. Every detection decision can be explained with a specific rule. An ML model is a planned next step — the architecture is ready for it.

**"What about false positives?"**
> Sensitivity settings let parents tune the threshold. Medium (default) requires a confirmed pattern match before alerting. Low only fires on high-risk combos like SSN + address together.

**"How do you handle new platforms?"**
> Platform support is driven by CSS selectors in `CHAT_SELECTORS` (stranger monitor) and the `detectPlatform()` function (PII monitor). Adding a new platform is a one-line change.

**"Is user data shared with anyone?"**
> No. All detection runs in the browser. Alert data is stored in `chrome.storage.local` on the user's device only.

---

*[← Back to docs](./README.md)*
