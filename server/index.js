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
  res.json({
    status: 'ok',
    service: 'whatsapp-notifier',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Privacy Shadow WhatsApp Notifier',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      send: '/api/send-whatsapp',
      test: '/api/test-whatsapp'
    }
  });
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
        error: 'Phone number must be in E.164 format (+country code). Example: +1234567890'
      });
    }

    console.log('📱 Sending WhatsApp message...');
    console.log('To:', to);
    console.log('Message:', message.substring(0, 100) + '...');

    // Send WhatsApp message
    const response = await client.messages.create({
      from: 'whatsapp:+14155238886', // Twilio WhatsApp sandbox number
      to: `whatsapp:${to}`,
      body: message
    });

    console.log('✅ WhatsApp sent! SID:', response.sid);
    console.log('Status:', response.status);

    res.json({
      success: true,
      messageId: response.sid,
      status: response.status,
      to: to,
      messagePreview: message.substring(0, 50) + '...',
      timestamp: new Date().toISOString()
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
    const testNumber = process.env.TEST_PHONE_NUMBER;

    if (!testNumber) {
      return res.status(400).json({
        success: false,
        error: 'TEST_PHONE_NUMBER not set in environment variables'
      });
    }

    const testMessage = `🛡️ Privacy Shadow Test Alert

This is a test message from the Privacy Shadow browser extension.

If you receive this, WhatsApp integration is working correctly!

Timestamp: ${new Date().toISOString()}

Platform: Test
Risk Level: LOW
PII Type: Test Message`;

    const response = await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${testNumber}`,
      body: testMessage
    });

    console.log('✅ Test WhatsApp sent! SID:', response.sid);

    res.json({
      success: true,
      messageId: response.sid,
      message: 'Test WhatsApp sent successfully!',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test WhatsApp error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🚀 WhatsApp Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log(`  📱 Health check: http://localhost:${PORT}/health`);
  console.log(`  🔗 Send endpoint: http://localhost:${PORT}/api/send-whatsapp`);
  console.log(`  🧪 Test endpoint: http://localhost:${PORT}/api/test-whatsapp`);
  console.log('');
  console.log('  ⚡  Ready to send real WhatsApp messages!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
});
