# Privacy Shadow Browser Extension - Implementation Guide

## Overview

**Privacy Shadow** is a Chrome/Edge browser extension that provides real-time protection for young users sharing sensitive information online.

**Pivot From**: Educational Next.js web app → Active browser extension with real-time intervention

## Tech Stack

### Extension
- **Framework**: Plasmo (Modern browser extension framework)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ML**: TensorFlow.js (for stranger detection)
- **Image Analysis**: exif-js (GPS metadata detection)

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Email**: Nodemailer (SMTP)
- **Authentication**: API keys (JWT future enhancement)

## Project Structure

```
privacy-shadow/
├── extension/                    # Browser extension code
│   ├── background.ts            # Service worker (main coordinator)
│   ├── popup.tsx                # Main extension popup
│   ├── detection/               # Detection engines
│   │   ├── pii-detector.ts      # Pattern matching for sensitive data
│   │   ├── ml-model.ts          # ML-based stranger detection
│   │   └── risk-scoring.ts      # Risk calculation algorithm
│   ├── content-scripts/         # Page monitoring scripts
│   │   ├── form-monitor.ts      # Form submission interception
│   │   ├── dom-monitor.ts       # Social media monitoring
│   │   └── image-monitor.ts     # Image upload & EXIF checking
│   ├── components/              # React components
│   │   ├── KidAlert.tsx         # Real-time warning for kids
│   │   └── ParentPopup.tsx      # Parent dashboard
│   └── utils/                   # Utility functions
├── backend/                     # Node.js API server
│   ├── src/
│   │   ├── server.js            # Express server
│   │   ├── routes/              # API endpoints
│   │   │   ├── alerts.ts        # Alert delivery
│   │   │   ├── parents.ts       # Parent registration
│   │   │   └── feedback.ts      # ML feedback loop
│   │   ├── services/            # Business logic
│   │   │   └── email.ts         # Email notifications
│   │   └── db/
│   │       └── schema.sql       # Database schema
│   └── package.json
├── archive/                     # Archived Next.js app
│   └── privacy-shadow-web/
└── package.json                 # Root package file
```

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Chrome/Edge browser

### Extension Setup

```bash
# Install dependencies
npm install

# Development mode (auto-reload)
npm run dev

# Build for production
npm run build

# Package for Chrome Web Store
npm run package
```

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL, SMTP settings, etc.

# Run database migrations
psql -U your_user -d privacy_shadow -f src/db/schema.sql

# Start server
npm start
# or for development
npm run dev
```

## Core Components

### 1. Detection Engine

#### PII Detector (`extension/detection/pii-detector.ts`)
Detects sensitive information using regex patterns:
- Birthdates and age
- Location information
- Contact details (phone, email)
- Home addresses
- School information

**Instagram Priority**: Enhanced detection for Instagram-specific patterns (bio, comments, location tags)

#### ML Model (`extension/detection/ml-model.ts`)
For hackathon MVP: Rule-based scoring with factors:
- Account age
- Follower/following ratio
- Mutual connections
- Previous interactions
- Red flags (asks for personal info, pressure tactics)

**Future Enhancement**: Replace with trained TensorFlow.js model

#### Risk Scoring (`extension/detection/risk-scoring.ts`)
Calculates comprehensive risk assessment:
- **Score**: 0-100
- **Levels**: low, medium, high, critical
- **Factors**: PII detected, stranger probability, context (public/private)
- **Actions**: Kid alerts, parent notifications

### 2. Content Scripts

#### Form Monitor (`extension/content-scripts/form-monitor.ts`)
- Intercepts form submissions
- Extracts form data
- Detects PII before submission
- Blocks or allows based on risk level

#### DOM Monitor (`extension/content-scripts/dom-monitor.ts`)
- Uses MutationObserver for new content
- Platform-specific selectors (Instagram, Twitter, Facebook, TikTok, Discord, YouTube)
- Real-time PII detection in posts and comments
- **Instagram Priority**: Monitors comment boxes, bio edits, story replies

#### Image Monitor (`extension/content-scripts/image-monitor.ts`)
- Detects image uploads
- Checks EXIF metadata for GPS coordinates
- Warns about location data in photos
- Drag-and-drop support

### 3. Background Service Worker

Coordinates all detection engines:
- Receives events from content scripts
- Calculates risk scores
- Stores alerts locally
- Sends to backend for parent notification
- Manages extension state

### 4. UI Components

#### Kid Alert (`extension/components/KidAlert.tsx`)
Age-appropriate warning popup:
- Risk level indicator (emoji + color)
- Clear explanation of what's being shared
- Actionable recommendations
- "Nevermind" vs "I Understand" buttons

#### Parent Popup (`extension/components/ParentPopup.tsx`)
Parent dashboard showing:
- Recent alerts with risk levels
- Filtering (all, new, high risk)
- Feedback mechanism for ML training
- Link to full dashboard

### 5. Backend API

#### Endpoints

**Alerts**
- `POST /v1/alerts` - Receive alert from extension
- `GET /v1/alerts/:parentId` - Get parent's alerts
- `PATCH /v1/alerts/:alertId/acknowledge` - Acknowledge alert

**Parents**
- `POST /v1/parents/register` - Register parent, get API key
- `GET /v1/parents/:apiKey` - Get parent info
- `PATCH /v1/parents/:apiKey` - Update preferences

**Feedback**
- `POST /v1/feedback` - Submit stranger/known feedback
- `GET /v1/feedback/training` - Get training data (protected)

#### Email Service
- HTML email templates with risk level styling
- Automatic delivery on high/critical alerts
- Configurable via parent preferences

## Database Schema

### Tables
- **parents**: Parent accounts, API keys, preferences
- **children**: Child devices linked to parents
- **alerts**: Privacy alerts with full context
- **feedback**: ML training feedback from parents
- **notification_deliveries**: Email/push tracking
- **training_data**: Anonymized ML training data

## Instagram Support (Hackathon Priority)

### Enhanced Features
1. **Comment Box Monitoring**: Real-time PII detection in comments
2. **Bio Section Scanning**: Detects location, school, contact info
3. **Story Reply Detection**: Monitors story interactions
4. **Location Tag Warnings**: Alerts on geographic tags

### Platform-Specific Selectors
```typescript
const INSTAGRAM_SELECTORS = {
  posts: [
    'div[data-testid="post-comment-root"]',
    'textarea[placeholder*="Comment"]',
  ],
  bio: [
    'div.-qQT3', // Instagram bio class
    'header section ul li span',
  ],
  messages: [
    'div[data-testid="conversation-panel-messages"]',
  ],
};
```

## Development Workflow

### Adding New Detection Patterns

1. Update `extension/detection/pii-detector.ts`
2. Add regex patterns to `PATTERNS` array
3. Test with sample text
4. Update risk scoring if needed

### Adding New Platform Support

1. Add selectors to `extension/content-scripts/dom-monitor.ts`
2. Update platform detection logic
3. Test on actual platform
4. Add platform trust score to ML model

### Testing

```bash
# Unit tests (Jest)
npm test

# E2E tests (Playwright)
npm run test:e2e

# Manual testing
npm run dev
# Load unpacked extension in Chrome
# Test on target platforms
```

## Deployment

### Chrome Web Store

```bash
# Build extension
npm run build

# Package
cd build/chrome-mv3
zip -r privacy-shadow.zip .

# Upload to: https://chrome.google.com/webstore/devconsole
```

### Backend (Production)

- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Configure SMTP service (SendGrid, Mailgun, AWS SES)
- Set up reverse proxy (nginx)
- Enable HTTPS (Let's Encrypt)
- Configure CORS for extension origin

## Security Considerations

### Extension
- All PII processing done locally
- No data sent to backend without parent registration
- API keys stored in Chrome storage
- Content Security Policy enforced

### Backend
- API key authentication
- Input validation (Joi schemas)
- SQL injection prevention (parameterized queries)
- Rate limiting (future enhancement)
- HTTPS only in production

## Privacy by Design

- **Zero data collection** without parent consent
- **Anonymized training data** only
- **Local processing** for detection
- **Transparent** about what data is collected
- **Parent control** over data retention
- **COPPA compliant** for under-13s

## Performance Metrics

### Targets
- **Detection accuracy**: 90%+ PII detection
- **False positive rate**: <10%
- **Alert latency**: <500ms
- **Extension overhead**: <5% CPU, <50MB memory
- **Parent notification**: 99%+ delivery rate

### Monitoring
- Alert volume by platform
- Risk level distribution
- Parent engagement (acknowledgment rate)
- Feedback submission rate
- ML model accuracy over time

## Troubleshooting

### Extension Not Loading
- Check browser console for errors
- Verify Plasmo is installed: `npm list plasmo`
- Try `npm run dev` for detailed error messages

### Content Scripts Not Working
- Check host permissions in manifest
- Verify selectors match current platform DOM
- Check browser console for script errors

### Backend Connection Issues
- Verify API key in extension storage
- Check backend server is running
- Review CORS settings
- Check network tab in browser DevTools

## Future Enhancements

1. **ML Model Training**: Train on collected feedback data
2. **Mobile App**: React Native parent dashboard
3. **Web Dashboard**: Full-featured parent portal
4. **Push Notifications**: Real-time alerts via FCM
5. **Multi-language**: Thai language support
6. **Teacher Dashboard**: Classroom management
7. **Advanced ML**: Image recognition for school logos, etc.
8. **Browser Fingerprinting**: Detection across browsers

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see LICENSE file

## Contact

- **GitHub**: https://github.com/privacy-shadow
- **Issues**: https://github.com/privacy-shadow/issues

---

**Built for FOSSASIA Hackathon 2026**
**Theme**: "Secure by Design: Privacy-First Digital Safety for Young Users"
**Date**: March 10, 2026
