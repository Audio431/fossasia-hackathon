# Claude.md - SafeChild Browser Extension

## Project Overview
A Plasmo-based browser extension that protects children on social media by:
- Detecting personally identifiable information (PII) shared in chat messages in real-time
- Scoring harm level of detected information (name, address, phone, email, school, age)
- Displaying warnings/overlays when children attempt to share sensitive data
- Providing a dashboard showing risk scores and detected events

## Tech Stack
- **Framework**: Plasmo (browser extension framework)
- **Language**: TypeScript + React
- **Target**: Chrome (Manifest V3)
- **Architecture**: Content Scripts + Background Service Worker + Popup UI

## Project Structure
```
src/
  contents/       # Content scripts injected into social media pages
    chat-monitor.tsx    # MutationObserver-based real-time chat detection
  background/
    index.ts      # Background service worker for state & event management
  popup/
    index.tsx     # Extension popup with harm score dashboard
  components/
    WarningOverlay.tsx  # Warning overlay shown on detected PII
    HarmScoreCard.tsx   # Risk score display component
    DetectionLog.tsx    # Log of detected events
  lib/
    pii-detector.ts     # PII detection engine with regex + heuristics
    harm-scorer.ts      # Harm scoring algorithm
    social-media-selectors.ts  # DOM selectors for supported platforms
    storage.ts          # Plasmo storage helpers
    types.ts            # Shared TypeScript types
assets/
  icon.png        # Extension icon
```

## Conventions
- Use functional React components with hooks
- Use Plasmo's `@plasmohq/storage` for extension storage
- Content scripts use PlasmoCSConfig for URL matching
- All PII detection runs client-side only (no data sent externally)
- Harm scores: 0-100 scale (0=safe, 100=critical)

## Supported Social Media Platforms
- Instagram DMs
- Facebook Messenger
- TikTok DMs
- WhatsApp Web
- Discord

## PII Categories & Risk Weights
| Category     | Weight | Examples                        |
|-------------|--------|---------------------------------|
| Full Name   | 20     | First + Last name               |
| Address     | 30     | Street, city, zip code          |
| Phone       | 25     | Phone numbers                   |
| Email       | 15     | Email addresses                 |
| School      | 25     | School name mentions            |
| Age/DOB     | 20     | Age, birthday, date of birth    |
| Location    | 20     | GPS coords, "I'm at..."        |

## Commands
- `npm run dev` - Start Plasmo dev server
- `npm run build` - Build for production
- `npm run package` - Package for Chrome Web Store
