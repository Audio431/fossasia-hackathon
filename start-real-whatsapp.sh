#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 Real WhatsApp Integration - Quick Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ ! -f "server/.env" ]; then
  echo "📋 Creating server/.env from template..."
  cp server/.env.example server/.env

  echo ""
  echo "⚠️  IMPORTANT: Update server/.env with your Twilio credentials:"
  echo ""
  echo "1. Get Twilio account: https://www.twilio.com/try-twilio"
  echo "2. Join WhatsApp sandbox (follow the instructions)"
  echo "3. Copy your Account SID and Auth Token"
  echo "4. Update server/.env:"
  echo ""
  echo "   TWILIO_ACCOUNT_SID=your_actual_sid"
  echo "   TWILIO_AUTH_TOKEN=your_actual_token"
  echo "   TEST_PHONE_NUMBER=+1234567890"
  echo ""
  echo "5. Run this script again when done!"
  echo ""

  # Open Twilio signup page
  open https://www.twilio.com/try-twilio

  exit 1
fi

# Load environment variables
source server/.env

# Validate credentials
if [[ "$TWILIO_ACCOUNT_SID" == "your_account_sid_here" ]] || [[ "$TWILIO_AUTH_TOKEN" == "your_auth_token_here" ]]; then
  echo "❌ Please update server/.env with your actual Twilio credentials first!"
  echo ""
  echo "1. Go to: https://www.twilio.com/console"
  echo "2. Copy your Account SID"
  echo "3. Reveal and copy your Auth Token"
  echo "4. Update server/.env with real values"
  echo ""
  exit 1
fi

echo "✅ Twilio credentials found!"
echo ""

# Install dependencies
if [ ! -d "server/node_modules" ]; then
  echo "📦 Installing server dependencies..."
  cd server
  npm install
  cd ..
  echo ""
fi

echo "🚀 Starting WhatsApp server..."
echo ""

# Start server in background
cd server
node index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test server health
if curl -s http://localhost:3001/health > /dev/null; then
  echo "✅ Server is running!"
  echo ""
  echo "📱 Server endpoints:"
  echo "   Health: http://localhost:3001/health"
  echo "   Send:   http://localhost:3001/api/send-whatsapp"
  echo "   Test:   http://localhost:3001/api/test-whatsapp"
  echo ""

  # Test WhatsApp if test number is configured
  if [[ "$TEST_PHONE_NUMBER" != "+1234567890" ]] && [[ -n "$TEST_PHONE_NUMBER" ]]; then
    echo "🧪 Sending test WhatsApp to: $TEST_PHONE_NUMBER"
    echo ""

    curl -X POST http://localhost:3001/api/test-whatsapp \
      -H "Content-Type: application/json" \
      2>/dev/null | python3 -m json.tool

    echo ""
    echo "✅ Check your WhatsApp for the test message!"
    echo ""
  fi

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ⚠️  Server is running (PID: $SERVER_PID)"
  echo "  Press Ctrl+C to stop"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Wait for user to stop
  wait $SERVER_PID

else
  echo "❌ Server failed to start!"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check if port 3001 is available: lsof -i :3001"
  echo "  2. Check server logs: cd server && node index.js"
  echo "  3. Verify .env file exists and is correct"
  echo ""

  kill $SERVER_PID 2>/dev/null
  exit 1
fi
