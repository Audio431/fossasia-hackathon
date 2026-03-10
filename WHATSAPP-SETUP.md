# 📱 WhatsApp Parent Alerts - Setup Guide

## Quick Setup (5 minutes)

### Option 1: Demo Mode (No API Required)

For hackathon demo/testing without real WhatsApp messages:

1. **Load the extension in Chrome:**
   ```
   1. Open chrome://extensions/
   2. Enable "Developer mode" (toggle in top right)
   3. Click "Load unpacked"
   4. Select: /Users/nat/privacy-shadow/build/chrome-mv3-prod
   ```

2. **Test PII Detection:**
   - Go to any social media site (Instagram, Twitter, etc.)
   - Type: `my address is 123 main street`
   - Click outside the textarea (blur)
   - **Alert appears to child** ✅
   - **WhatsApp message logs to console** ✅

3. **View WhatsApp Messages:**
   - Open browser console (F12 or Cmd+Option+J)
   - Look for: `📱 WhatsApp Alert (Demo Mode)`
   - You'll see the exact message that would be sent

**Demo mode works immediately!** No configuration needed.

---

### Option 2: Real WhatsApp Messages (Requires Twilio)

For actual WhatsApp notifications to parents:

## Step 1: Get Twilio Account

1. **Sign up for Twilio:**
   - Go to: https://www.twilio.com/try-twilio
   - Create free account (includes $15 credit)
   - Verify your phone number

2. **Get WhatsApp Sandbox:**
   - In Twilio console, go to "Messaging" → "Try it out" → "Send a WhatsApp message"
   - You'll get a sandbox number and join code
   - Send the join code from your phone to the sandbox number
   - Your WhatsApp is now connected!

## Step 2: Get Your Credentials

From Twilio Console:
1. **Account SID**: Dashboard → Show API Credentials
2. **Auth Token**: Dashboard → Show API Credentials (click to reveal)
3. **WhatsApp Sandbox Number**: Found in WhatsApp sandbox setup

## Step 3: Configure Extension

### Option A: Simple Backend (Recommended)

Create a simple server to handle WhatsApp sending:

```bash
# In your project directory
mkdir server
cd server
npm init -y
npm install express twilio cors
```

Create `server/index.js`:
```javascript
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Your Twilio credentials
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

app.post('/send-whatsapp', async (req, res) => {
  const { to, message } = req.body;

  try {
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886', // Your Twilio WhatsApp number
      to: `whatsapp:${to}`,
      body: message
    });

    console.log('WhatsApp sent:', response.sid);
    res.json({ success: true, messageId: response.sid });
  } catch (error) {
    console.error('WhatsApp error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

Set your environment variables:
```bash
export TWILIO_ACCOUNT_SID="your_account_sid"
export TWILIO_AUTH_TOKEN="your_auth_token"
node server/index.js
```

### Option B: Direct Integration (Not Recommended)

Update the extension code to call Twilio directly (NOT secure - API keys exposed):

**⚠️ Warning:** This exposes your API keys! Only use for testing, never for production.

## Step 4: Update Extension Settings

1. **Open extension settings:**
   - Click extension icon in browser toolbar
   - Click "Settings" or go to extension popup

2. **Configure WhatsApp:**
   - Enable "WhatsApp Alerts" toggle
   - Enter your phone number in E.164 format: `+1234567890`
   - Choose alert level: "High & Critical" (recommended)
   - Click "Save Settings"

3. **Test it:**
   - Click "Send Test Alert" button
   - Check your WhatsApp for the test message!

## Step 5: Full End-to-End Test

1. **Configure parent phone:**
   - Open extension settings
   - Add your WhatsApp number
   - Enable alerts

2. **Simulate child sharing PII:**
   - Open Instagram/Twitter/Facebook
   - Go to DM or post
   - Type: `my address is 123 main street`
   - Click outside (blur)

3. **What happens:**
   - ✅ Child sees alert overlay
   - ✅ Parent receives WhatsApp message
   - ✅ Console logs show details

## Testing Checklist

- [ ] Extension loaded in Chrome
- [ ] WhatsApp alerts enabled in settings
- [ ] Parent phone number added (+country code)
- [ ] Test PII triggers alert
- [ ] Check browser console for WhatsApp log
- [ ] If using real Twilio: check WhatsApp for message
- [ ] Test rate limiting (try 6+ times quickly)

## Troubleshooting

### No Alert Appearing?
1. Check extension is enabled: `chrome://extensions/`
2. Reload the extension: Click 🔄 button
3. Make sure you blur (click outside textarea)
4. Check console for errors

### WhatsApp Not Sending?
1. **Demo Mode**: Check console (F12) for logs
2. **Real WhatsApp**:
   - Verify Twilio credentials
   - Check phone number format (+1234567890)
   - Ensure server is running
   - Check Twilio console for errors

### Phone Number Format
- ✅ Correct: `+14155551234`
- ❌ Wrong: `415-555-1234` or `(415) 555-1234`

Always include `+` and country code!

## Demo for Hackathon

**Quick Setup (No API):**
```bash
# 1. Build and load extension
npm run build
# Load build/chrome-mv3-prod in Chrome

# 2. Test on any site
# Type PII, blur, see alert

# 3. Check console (F12)
# See WhatsApp message logged
```

**With Real WhatsApp:**
```bash
# 1. Get Twilio account (5 minutes)
# 2. Run server (above)
# 3. Configure extension with your phone
# 4. Test - real WhatsApp message arrives!
```

## Expected WhatsApp Message

```
🛡️ ⚠️ Privacy Shadow Alert

Your child just shared sensitive information on Instagram:

📍 What was detected: Address, Location
⚠️ Risk level: HIGH

💬 Message: "my address is 123 main street springfield"

🕐 2:34 PM

Talk to your child about online safety. This alert was sent by Privacy Shadow browser extension.
```

## Cost Estimate

- **Twilio Free Tier**: $15 credit (enough for ~500 messages)
- **After Free Tier**: ~$0.05 per message
- **Typical Usage**: 5 alerts/day = ~150/month = $7.50/month

## Production Deployment

For production use:
1. Host the server on Heroku/Vercel/AWS
2. Use environment variables for API keys
3. Add authentication to your server endpoint
4. Implement rate limiting on server
5. Add parent verification (opt-in flow)

## Support

- Twilio docs: https://www.twilio.com/docs/whatsapp
- Extension repo: /Users/nat/privacy-shadow
- Test page: file:///Users/nat/privacy-shadow/test-whatsapp-demo.html

---

**🎯 For Hackathon Demo:**
Use **Option 1 (Demo Mode)** - it works immediately and shows all features!

**🚀 For Real Implementation:**
Use **Option 2** with the simple server - secure and scalable!
