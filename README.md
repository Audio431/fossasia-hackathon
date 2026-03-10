# Privacy Shadow

> **Child safety without surveillance.**
> A browser extension that protects kids from sharing personal information online — warning them in the moment, not spying on them afterward.

---

## The Problem

A 12-year-old sends a DM on Instagram to someone they met in a game:
> *"my address is 47 Oak Street, I'm usually home alone after 3pm"*

That message is sent. The parent never sees it. The stranger now knows exactly where to find a child who is home alone.

This happens millions of times a day, across Instagram, TikTok, Discord, Snapchat, and every other platform kids use. Children don't share this information out of recklessness — they share it because:

- They genuinely trust the person they're talking to
- They don't recognize the risk in the moment
- No one ever told them *why* their address combined with their school schedule is dangerous
- The platforms don't stop them

**The scale of the problem:**
- ~40% of children report sharing personal information with strangers online
- 1 in 5 children receives unwanted sexual solicitation online
- Grooming typically starts with small, harmless-seeming information requests
- The average time from first contact to abuse attempt is ~24 days

---

## Why Existing Solutions Fail

### Parental monitoring apps — surveillance, not protection

Apps like Life360, mSpy, and built-in screen time tools give parents full access to their children's messages, location, and activity. The problems:

- **They destroy trust.** Children who discover they're being monitored lose trust in their parents. The relationship becomes adversarial.
- **Kids bypass them.** A monitored child will use a friend's phone, a secret account, or a different app. Surveillance pushes risky behavior underground.
- **They're reactive, not preventive.** By the time a parent reads a flagged message, the information has already been sent.
- **They don't teach anything.** A child who is simply watched learns nothing about online risk. A child who is warned learns to recognize danger.

### Platform-level filters — too blunt, too late

Instagram's content moderation catches illegal content but does nothing about a child typing their home address into a DM. The platform has no context about what is personally sensitive to this specific child.

### Digital literacy education — necessary but insufficient

Teaching kids about online safety is essential, but knowledge doesn't automatically translate to behavior in the moment. Teenagers know smoking is bad; they still smoke. The same gap exists with online habits.

---

## The Privacy Shadow Approach

Privacy Shadow is a **Chrome extension that intercepts at the point of sharing** — the moment before a message is sent. It doesn't read messages afterward. It doesn't log conversations. It warns the child *first*, in real time, and only notifies parents that *something concerning happened*.

This is the core distinction: **intervention, not surveillance.**

```
Child types "my address is 47 Oak Street, home alone until 5pm"
                        |
          Privacy Shadow detects: address + daily routine
                        |
          Child sees a fullscreen overlay:
          "STOP — you're about to share your home address
           and when you're home alone. This can put you
           in real danger. Think twice."
                        |
          Child chooses:   [<- Nevermind]   [Send Anyway]
                        |
          Parent notified: "Your child was about to share their
                            home address and daily routine on
                            Instagram. They saw a warning."
                            (No message content. No transcript.)
```

The child retains autonomy. The warning is educational, not punitive. The parent is informed of the category of risk — not given a transcript of their child's private conversations.

---

## How We Protect Privacy *and* Safety

This is the hardest design question. Most tools pick one or the other. Privacy Shadow separates **what the child sees** from **what the parent sees**, so neither is sacrificed.

### What the child sees
- A fullscreen overlay with a clear, age-appropriate explanation of the risk
- The specific type of information detected (e.g., "home address", "daily routine")
- An educational tip explaining *why* that information is dangerous
- A genuine choice — they can still send if they choose to

### What the parent sees
- That a detection occurred
- The risk category (address, phone number, stranger contact, etc.)
- The platform it happened on
- The time

### What no one sees
- The actual message content (never stored, never transmitted)
- A log of the child's conversations
- Who the child was talking to
- Their browsing history

**This design means:**
- A teenager with a good reason to share their number with a trusted friend can override the warning
- A parent isn't reading their teenager's private messages
- The educational moment happens at the right time — before sending, not after
- The child knows the extension exists — there is no hidden surveillance

---

## What Privacy Shadow Detects

### PII Categories

| Category | Examples |
|----------|----------|
| **Full name** | "My name is Sarah Johnson", "I'm Alex Chen" |
| **Birth date / age** | "turning 13", "born 03/15", "7th grader", "I'm 14f" |
| **Location** | "I live in Springfield IL", GPS coordinates, "meet me at the Westfield mall" |
| **Home address** | "47 Oak Street", zip codes, apartment numbers |
| **Daily routine** | "home alone until 5pm", "I walk home at 3:15", "parents aren't home" |
| **Contact info** | Phone numbers, email addresses, social handles |
| **School / team** | "I go to Lincoln Middle School", team mascots |
| **Financial** | Credit card numbers, SSNs |
| **Government ID** | Passport numbers, license plates |

### Stranger Danger Patterns

Beyond static PII, Privacy Shadow also watches for grooming patterns — the conversational tactics used by predators to manipulate children:

| Pattern | Example |
|---------|---------|
| Secrecy requests | "Don't tell your parents about this" |
| Meeting solicitations | "We should meet up in person" |
| Gift / bribe offers | "I'll buy you a gift card" |
| Isolation tactics | "Your friends don't understand you like I do" |
| Personal info harvesting | Progressive questions that each seem innocent |
| Age-inappropriate content | Sexual content directed at minors |
| Pressure / urgency | "You have to decide right now" |

These patterns are scored and accumulated across the conversation. A single message might be borderline; the same message as part of a pattern triggers a warning.

---

## Technical Implementation

### Architecture

Privacy Shadow is a Chrome MV3 extension built with [Plasmo](https://plasmo.com), React, and TypeScript. All detection runs locally in the browser — no message content ever leaves the device.

```
Browser
  |
  +-- Content Script (runs on every page)
  |     |
  |     +-- form-monitor.ts          Generic sites, triggers on blur
  |     +-- instagram-form-monitor.ts Instagram DMs, intercepts Enter key
  |     +-- stranger-monitor.ts      Grooming patterns, all chat platforms
  |     +-- dom-monitor.ts           DOM mutations for posted content
  |     +-- image-monitor.ts         EXIF GPS on photo uploads
  |     |
  |     +-- pii-detector.ts          Detection engine (runs locally)
  |     +-- stranger-detector.ts     Grooming pattern engine (runs locally)
  |     +-- alert-overlay.ts         Fullscreen warning modal
  |
  +-- Background Service Worker
  |     Alert storage, badge counter, message routing
  |
  +-- Popup (React)
  |     Parent dashboard, alert history, settings
  |
  +-- LINE Notification (optional)
        Backend proxy -> parent's phone
        Sends category only, never message content
```

### Detection Engine

The PII detector uses heuristic regex patterns — no machine learning, no cloud API. This is a deliberate design choice:

- **Fast**: runs synchronously with no network latency
- **Private**: no text is ever sent to an external service
- **Transparent**: the rules can be read and audited by anyone
- **Explainable**: when an alert fires, we can tell the child exactly what triggered it

Each pattern is weighted by severity. Multiple detections in the same message trigger combo bonuses (a name + address + daily routine together is far more dangerous than any single item). The risk score determines the alert level: `low` → `medium` → `high` → `critical`.

### Intervention Timing

There are two philosophically different moments to check for PII:

1. **While typing** — catches the problem earliest, but constantly interrupts with false positives
2. **On blur / before send** — checks when the user is done composing, before they commit

Privacy Shadow uses the second approach. On regular inputs and forms, it fires on `blur`. On Instagram DMs (which use `contenteditable` divs), it intercepts the `keydown` event before Enter sends the message. This gives the child a natural decision point: they've written what they want to say, and now they're asked to reconsider before committing.

### Parent Notifications

When a warning fires, a notification is sent to parents via LINE Messaging API. It includes:
- Which platform (Instagram, TikTok, etc.)
- What category of information was detected
- The time
- Whether the child chose to send anyway

It does **not** include the message text. The notification is informational, not a surveillance feed.

### Platform Support

| Platform | PII Detection | Stranger Patterns | Input Type |
|----------|:---:|:---:|---|
| Instagram DMs | Yes | Yes | contenteditable (Enter intercept) |
| Instagram comments | Yes | — | textarea (blur) |
| TikTok | Yes | Yes | contenteditable |
| Discord | Yes | Yes | contenteditable |
| Facebook Messenger | Yes | Yes | contenteditable |
| Twitter / X DMs | Yes | Yes | contenteditable |
| YouTube comments | Yes | — | textarea |
| Generic web forms | Yes | — | any input / textarea |

---

## Getting Started

```bash
git clone https://github.com/Audio431/fossasia-hackathon.git
cd privacy-shadow
npm install
npm run build
```

Load in Chrome:
1. Go to `chrome://extensions/`
2. Enable Developer mode (top right)
3. Click "Load unpacked" and select `build/chrome-mv3-prod`

Try the demo: open `demo-enhanced-notification.html` in your browser for an interactive walkthrough without needing any social media account.

---

## Testing

```bash
npm test              # 56 unit tests (Jest)
npm run test:e2e      # 21 E2E tests (Playwright)
npm run test:cdp      # Live Chrome CDP test against Instagram
```

For the CDP test, create `.env.test` (gitignored) with test credentials:
```
IG_USERNAME=your_test_account
IG_PASSWORD=your_password
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension framework | Plasmo (Chrome MV3) |
| UI | React 18 + TypeScript + Tailwind CSS |
| Detection | Custom heuristic engine, local only |
| Storage | chrome.storage.local / sync |
| Notifications | LINE Messaging API (optional backend) |
| Testing | Jest + Playwright + Chrome CDP |

---

## Project Structure

```
privacy-shadow/
|-- background.ts                    Service worker: alerts, badge, routing
|-- content.ts                       Content script entry: loads all monitors
|-- popup.tsx                        Popup: parent dashboard + settings
|-- extension/
|   |-- detection/
|   |   |-- pii-detector.ts          PII engine: 10 categories, risk scoring
|   |   `-- stranger-detector.ts     Grooming pattern engine: 7 categories
|   |-- contents/
|   |   |-- form-monitor.ts          Generic sites (blur)
|   |   |-- instagram-form-monitor.ts Instagram DMs (Enter intercept)
|   |   |-- stranger-monitor.ts      Grooming detection, all chat platforms
|   |   |-- dom-monitor.ts           DOM observer for posted content
|   |   `-- image-monitor.ts         EXIF GPS on image uploads
|   `-- utils/
|       |-- alert-overlay.ts         Fullscreen warning modal
|       |-- line-notifier.ts         Parent notification via LINE
|       |-- notification-simulator.ts Demo mode visual notifications
|       `-- settings.ts              Settings storage and defaults
|-- scripts/
|   `-- test-instagram-cdp.js        Automated Chrome CDP test runner
`-- docs/                            Architecture, quickstart, features
```

---

## Design Principles

1. **Warn, don't surveil.** The child receives every alert first. Parents are informed that something happened, not given a transcript.

2. **Intervene at the moment of sharing.** Not after the fact — at the exact moment the child is about to send. That's when a warning is actionable.

3. **Educate, not just block.** Every alert explains why the information is sensitive. The goal is to build intuition over time, not just prevent one specific action.

4. **Respect autonomy.** Children can override any warning. This is a speed bump and a teachable moment, not a lock.

5. **Local by default.** No message content leaves the device. The detection engine is auditable code, not a black-box cloud service.

---

Built for the FOSSASIA 2026 Hackathon.

Privacy Shadow argues that you don't have to choose between protecting children and respecting their privacy — but you do have to think carefully about where to draw the line.
