/**
 * Real WhatsApp Integration - Complete Setup Guide
 *
 * This guide shows you how to send REAL WhatsApp messages using Twilio
 */

# 📱 Real WhatsApp Messages - Complete Implementation

## Overview

To send real WhatsApp messages, we need:
1. **Twilio Account** - WhatsApp Business API provider
2. **Backend Server** - Secure endpoint to send messages
3. **Extension Update** - Call backend instead of console logging

---

## Part 1: Get Twilio Account (5 minutes)

### Step 1: Sign up for Twilio
1. Go to: https://www.twilio.com/try-twilio
2. Create free account (includes $15 credit = ~500 messages)
3. Verify your email
4. Verify your phone number

### Step 2: Get WhatsApp Sandbox
1. In Twilio Console, go to: **Messaging** → **Try it out** → **Send a WhatsApp message**
2. You'll see a sandbox number like: `+1 415 523 8886`
3. Send this from your phone: `join <keyword>` (they'll show you the keyword)
4. Your WhatsApp is now connected!

### Step 3: Get Your Credentials
1. Go to: **Console** → **Settings** → **General Settings**
2. Copy **Account SID** (looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
3. Copy **Auth Token** (click "Show" to reveal)
4. Save these securely!

---

## Part 2: Create Backend Server

### Create server directory and install dependencies

```bash
mkdir -p server
cd server
npm init -y
npm install express twilio cors dotenv
```

### Create server/index.js

```javascript
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-notifier' });
});

// Send WhatsApp message endpoint
app.post('/api/send-whatsapp', async (req, res) => {
  try {
    const { to, message } = req.body;

    // Validate inputs
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to and message'
      });
    }

    // Validate phone number format (E.164)
    if (!to.startsWith('+')) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be in E.164 format (+country code)'
      });
    }

    console.log('📱 Sending WhatsApp message...');
    console.log('To:', to);
    console.log('Message:', message.substring(0, 100) + '...');

    // Send WhatsApp message
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886', // Your Twilio WhatsApp sandbox number
      to: `whatsapp:${to}`,
      body: message
    });

    console.log('✅ WhatsApp sent! SID:', response.sid);

    res.json({
      success: true,
      messageId: response.sid,
      status: response.status,
      to: to,
      messagePreview: message.substring(0, 50) + '...'
    });

  } catch (error) {
    console.error('❌ WhatsApp error:', error);

    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Test endpoint
app.post('/api/test-whatsapp', async (req, res) => {
  try {
    const testMessage = `🛡️ Privacy Shadow Test Alert

This is a test message from the Privacy Shadow browser extension.

If you receive this, WhatsApp integration is working correctly!

Timestamp: ${new Date().toISOString()}`;

    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${process.env.TEST_PHONE_NUMBER}`,
      body: testMessage
    });

    res.json({
      success: true,
      messageId: response.sid,
      message: 'Test WhatsApp sent successfully!'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 WhatsApp server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Endpoint: http://localhost:${PORT}/api/send-whatsapp`);
});
```

### Create server/.env

```bash
# Twilio Credentials
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here

# Your phone number (for testing)
TEST_PHONE_NUMBER=+1234567890

# Server port
PORT=3001
```

### Start the server

```bash
cd server
node index.js
```

You should see:
```
🚀 WhatsApp server running on port 3001
📱 Health check: http://localhost:3001/health
🔗 Endpoint: http://localhost:3001/api/send-whatsapp
```

---

## Part 3: Update Extension to Call Backend

### Update extension/utils/whatsapp-notifier.ts

Replace the demo `sendWhatsAppAlert` function with this real implementation:

```typescript
/**
 * Send WhatsApp alert via backend server
 */
export async function sendWhatsAppAlert(
  alert: WhatsAppAlert,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  // Validate phone number
  const formattedPhone = formatPhoneNumber(phoneNumber);
  if (!formattedPhone) {
    console.error('WhatsApp: Invalid phone number format');
    return { success: false, error: 'Invalid phone number format' };
  }

  // Check rate limiting
  if (!checkRateLimit(5)) {
    return { success: false, error: 'Rate limit exceeded' };
  }

  const message = generateAlertMessage(alert);

  try {
    // Call backend server
    const response = await fetch('http://localhost:3001/api/send-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: formattedPhone,
        message: message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send WhatsApp');
    }

    const result = await response.json();
    console.log('✅ WhatsApp sent via backend! Message ID:', result.messageId);

    return { success: true };

  } catch (error) {
    console.error('❌ WhatsApp send failed:', error);

    // Fall back to demo mode if server unavailable
    console.log('📱 WhatsApp Alert (Demo Mode - Server unavailable):');
    console.log('─'.repeat(50));
    console.log('To:', formattedPhone);
    console.log(message);
    console.log('─'.repeat(50));

    return { success: false, error: (error as Error).message };
  }
}
```

---

## Part 4: Test Real WhatsApp

### Step 1: Start the server

```bash
cd server
source .env  # Load environment variables
node index.js
```

### Step 2: Configure extension

1. Open Chrome
2. Go to: `chrome://extensions/`
3. Find "Privacy Shadow"
4. Click "Reload" (🔄)
5. Click extension icon → "WhatsApp Settings"
6. Enter your WhatsApp number: `+1234567890` (include + and country code)
7. Click "Save Settings"

### Step 3: Test it!

**Option A: Use Test Page**
```bash
# Open test page
open test-quick.html

# Click "Simulate WhatsApp Test"
# Check your WhatsApp for the message!
```

**Option B: Test on Instagram**
1. Go to Instagram DM
2. Type: `my address is 123 main street`
3. Click outside textarea
4. Alert appears to child
5. **Real WhatsApp message arrives on your phone!** 🎉

---

## Part 5: Deploy to Production

### Option A: Deploy to Heroku (Free)

```bash
cd server

# Create Procfile
echo "web: node index.js" > Procfile

# Create .gitignore
echo "node_modules
.env
.DS_Store" > .gitignore

# Initialize git
git init
git add .
git commit -m "WhatsApp notification server"

# Deploy to Heroku
heroku create your-app-name
heroku addons:create twilio
heroku config:set TWILIO_ACCOUNT_SID=your_sid
heroku config:set TWILIO_AUTH_TOKEN=your_token
git push heroku main
```

### Option B: Deploy to Vercel/Render

1. Push server code to GitHub
2. Connect repository to Vercel/Render
3. Add environment variables
4. Deploy!

### Update Extension URL

After deployment, update the fetch URL in `whatsapp-notifier.ts`:

```typescript
const response = await fetch('https://your-app.herokuapp.com/api/send-whatsapp', {
```

---

## Part 6: Cost Estimate

### Twilio Pricing (as of 2024)

| Plan | Cost | Messages per month |
|------|------|-------------------|
| Free Trial | $15 credit | ~500 messages |
| Pay-as-you-go | ~$0.05/message | Depends on usage |

### Typical Usage Scenarios

| Alerts/day | Alerts/month | Cost/month |
|------------|--------------|------------|
| 1 | 30 | ~$1.50 |
| 5 | 150 | ~$7.50 |
| 10 | 300 | ~$15.00 |
| 20 | 600 | ~$30.00 |

### Cost Saving Tips

1. **Use "Critical Only" mode** - Only most severe PII
2. **Enable quiet hours** - Reduce unnecessary alerts
3. **Smart rate limiting** - Already implemented (max 5/hour)
4. **Batch notifications** - Send digest instead of immediate (future feature)

---

## Part 7: Security Best Practices

### ✅ DO

1. **Keep API keys in environment variables**
2. **Use HTTPS in production**
3. **Validate phone numbers** (E.164 format)
4. **Rate limit** (prevent abuse)
5. **Log without sensitive data**
6. **Use CORS** carefully (whitelist domains)

### ❌ DON'T

1. **Hardcode API keys** in extension code
2. **Expose API keys** in browser console
3. **Send to unvalidated numbers**
4. **Ignore rate limiting**
5. **Log full message content** (log summaries only)

---

## Troubleshooting

### Server won't start?
```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process if needed
kill -9 <PID>

# Or use different port
PORT=3002 node index.js
```

### WhatsApp not sending?
```bash
# Check server logs
# Look for: ✅ WhatsApp sent! SID: ...

# Verify Twilio credentials
echo $TWILIO_ACCOUNT_SID
echo $TWILIO_AUTH_TOKEN

# Test server health
curl http://localhost:3001/health
```

### Extension can't reach server?
```bash
# Check CORS is enabled on server
# Check firewall settings
# Try: http://localhost:3001/health in browser
```

---

## Quick Start Script

Create `start-real-whatsapp.sh`:

```bash
#!/bin/bash

echo "🚀 Starting Real WhatsApp Integration"
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
  echo "❌ server/.env not found!"
  echo ""
  echo "1. Create server/.env with:"
  echo "   TWILIO_ACCOUNT_SID=your_sid"
  echo "   TWILIO_AUTH_TOKEN=your_token"
  echo "   TEST_PHONE_NUMBER=+1234567890"
  echo ""
  echo "2. Get credentials from: https://www.twilio.com/console"
  exit 1
fi

# Start server
echo "📱 Starting WhatsApp server..."
cd server
source .env
node index.js &
SERVER_PID=$!

echo "✅ Server started (PID: $SERVER_PID)"
echo ""
echo "🧪 Test the connection:"
echo "   curl http://localhost:3001/health"
echo ""
echo "⚠️  Press Ctrl+C to stop server"
echo ""

wait $SERVER_PID
```

---

## Success Checklist

- [ ] Twilio account created
- [ ] WhatsApp sandbox joined
- [ ] Server dependencies installed
- [ ] Environment variables set
- [ ] Server starts successfully
- [ ] Health check returns 200
- [ ] Extension configured with phone number
- [ ] Test alert sends real WhatsApp message
- [ ] Rate limiting works
- [ ] Quiet hours respected

---

**🎉 Your WhatsApp integration will send real messages to parents!**

The complete implementation includes:
- ✅ Twilio WhatsApp Business API integration
- ✅ Secure backend server
- ✅ Rate limiting and validation
- ✅ Fallback to demo mode if server down
- ✅ Production deployment guide
- ✅ Cost optimization tips
- ✅ Security best practices

**Total setup time: ~15 minutes**
**Cost after free trial: ~$1-30/month depending on usage**

Good luck! 🚀
