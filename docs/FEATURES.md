# ✨ Features — Privacy Shadow

Complete feature list with implementation status.

---

## PII Detection

| Feature | Status | Notes |
|---------|--------|-------|
| Birth date / age patterns | ✅ Done | MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, age expressions, grade level |
| Location information | ✅ Done | City+state, GPS coords, "I live in…", school references |
| Phone numbers | ✅ Done | (555) 867-5309, 555-867-5309, +1 formats, written numbers |
| Email addresses | ✅ Done | Standard email regex |
| Home address | ✅ Done | Street number + road type combos |
| School / team names | ✅ Done | "I go to", "I attend", team name context clues |
| Credit card numbers | ✅ Done | 13–19 digit patterns with card context words |
| Social Security Number | ✅ Done | XXX-XX-XXXX with SSN context, excludes invalid ranges |
| Bank account numbers | ✅ Done | Account number with context clues |
| Passport numbers | ✅ Done | US format: letter + 8 digits with context |
| License plates | ✅ Done | Common US plate patterns |
| Instagram bio/location scraping | ✅ Done | Platform-specific DOM selector |
| Obfuscation detection | ✅ Done | Written-out numbers, shorthand ages |
| Context-aware scoring | ✅ Done | Stricter on public posts; combines multiple PII types |
| Combo escalation | ✅ Done | Financial + birthdate, financial + address = critical |

---

## Stranger / Grooming Detection

| Feature | Status | Notes |
|---------|--------|-------|
| Secrecy requests | ✅ Done | "Don't tell your parents", "keep it secret", weight 25 |
| Meeting solicitation | ✅ Done | "Can we meet", "in person", weight 30 (highest single) |
| Personal info harvesting | ✅ Done | Asking for address, phone, school, weight 20 |
| Age-inappropriate content | ✅ Done | Sexual language directed at minors, weight 35 |
| Gift / bribe offers | ✅ Done | "I'll buy you", "gift card", weight 20 |
| Isolation tactics | ✅ Done | "Your friends don't understand", "only I care", weight 20 |
| Urgency / pressure | ✅ Done | "Right now", "don't wait", weight 15 |
| Conversation accumulation | ✅ Done | Context buffer last ~500 chars across messages |
| Multi-category escalation | ✅ Done | Bonus +15 at 3+ categories, +20 at 4+, cap 100 |
| Risk levels | ✅ Done | safe / watch / warning / danger |
| Red overlay warning | ✅ Done | Full-screen overlay with flags list, Go Back / Continue buttons |
| STRANGER_RISK_DETECTED message | ✅ Done | Sent to background → popup alert card |

---

## Platform Support

| Platform | Form / Input Monitor | Stranger Monitor | Notes |
|----------|---------------------|-----------------|-------|
| Instagram | ✅ | ✅ | Includes bio/location, DM inputs |
| Twitter / X | ✅ | ✅ | Tweet compose, DMs |
| Facebook | ✅ | ✅ | Posts, comments |
| TikTok | ✅ | ✅ | Comments, DMs |
| YouTube | ✅ | ✅ | Comments |
| Discord | ✅ | ✅ | Message inputs |
| Snapchat | ✅ | ✅ | Chat textarea |
| Generic fallback | ✅ | ✅ | Any textarea/input on any site |

---

## Popup / Dashboard

| Feature | Status | Notes |
|---------|--------|-------|
| Parent view — alert history | ✅ Done | Last 20 alerts, most recent first |
| 🔒 PII vs 🚨 Stranger badge on cards | ✅ Done | Color-coded per type |
| 4-stat header | ✅ Done | Today / This Week / PII count / Stranger count |
| Clear all alerts button | ✅ Done | Wipes storage + resets stats |
| Kid view — privacy score | ✅ Done | 100 - (weekAlerts × 8), encouraging message |
| Kid safety tips | ✅ Done | 4 tips, always visible |
| Settings — master on/off | ✅ Done | Instantly pauses all monitoring |
| Settings — sensitivity levels | ✅ Done | Low / Medium / High with score thresholds |
| Settings — quiet hours | ✅ Done | Time range picker, overnight range supported |
| Settings — educational tips toggle | ✅ Done | Controls tips inside alert overlays |
| Extension icon badge counter | ✅ Done | Red badge, clears on popup open, persists to 99+ |
| Settings persist across sessions | ✅ Done | `chrome.storage.sync` (follow user across devices) |

---

## Storage & Reliability

| Feature | Status | Notes |
|---------|--------|-------|
| Alerts persist across browser restart | ✅ Done | `chrome.storage.local` — survives SW termination |
| Settings sync across devices | ✅ Done | `chrome.storage.sync` |
| Alert cap | ✅ Done | Keeps last 50 alerts |
| Enabled flag respected by all monitors | ✅ Done | form-monitor, stranger-monitor, background handlers |

---

## Image Monitoring

| Feature | Status | Notes |
|---------|--------|-------|
| EXIF GPS detection | ✅ Done | Intercepts file inputs, reads EXIF coords |
| Block image upload | ✅ Done | Alerts before upload proceeds |

---

## Testing

| Feature | Status | Notes |
|---------|--------|-------|
| PII detector unit tests | ✅ Done | 25 tests |
| Stranger detector unit tests | ✅ Done | 18 tests |
| Risk scoring unit tests | ✅ Done | 13 tests |
| Playwright E2E — demo page UI | ✅ Done | 5 tests |
| Playwright E2E — auto-fill scenarios | ✅ Done | 8 tests |
| Playwright E2E — activity log | ✅ Done | 3 tests |
| Playwright E2E — stranger section | ✅ Done | 5 tests |
| **Total** | **56 unit + 21 E2E** | All passing |

---

## Planned / Future

| Feature | Priority | Notes |
|---------|----------|-------|
| ML-based risk scoring | High | TensorFlow.js integration, train on grooming conversation dataset |
| Parent email notifications | Medium | Backend API + email delivery for critical alerts |
| Conversation timeline analytics | Medium | Visual trend charts in popup |
| Browser extension for Firefox | Low | Plasmo supports Firefox; needs manifest adjustments |
| Parental controls PIN lock | Low | Prevent kids from disabling the extension |

---

*[← Back to docs](./README.md)*
