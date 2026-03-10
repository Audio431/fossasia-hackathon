#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  📱 Privacy Shadow - WhatsApp Setup & Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if extension is built
if [ ! -d "build/chrome-mv3-prod" ]; then
  echo "📦 Building extension..."
  npm run build
  echo ""
fi

echo "Choose testing mode:"
echo "  1) Demo Mode (Console logs - No API needed)"
echo "  2) Real WhatsApp (Requires Twilio setup)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
  1)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🧪 Demo Mode - Quick Test"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "✅ Extension built and ready!"
    echo ""
    echo "📋 Steps to test:"
    echo "  1. Open Chrome"
    echo "  2. Go to: chrome://extensions/"
    echo "  3. Enable 'Developer mode' (top right)"
    echo "  4. Click 'Load unpacked'"
    echo "  5. Select: $(pwd)/build/chrome-mv3-prod"
    echo ""
    echo "🧪 Test PII Detection:"
    echo "  1. Open Instagram/Twitter/Facebook"
    echo "  2. Type: my address is 123 main street"
    echo "  3. Click outside the textarea (blur)"
    echo "  4. Alert appears to child ✅"
    echo "  5. Check console (F12) for WhatsApp log ✅"
    echo ""
    echo "🌐 Open demo page in browser?"
    read -p "Open demo page? (y/n): " open_demo

    if [ "$open_demo" = "y" ]; then
      open file://$(pwd)/test-whatsapp-demo.html
      echo "✅ Demo page opened in browser!"
      echo ""
      echo "📝 In the demo page:"
      echo "  - Click 'Test High Alert' or 'Test Critical Alert'"
      echo "  - Check browser console (F12) for WhatsApp message"
    fi
    ;;

  2)
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  📱 Real WhatsApp - Twilio Setup"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📋 Setup Steps:"
    echo ""
    echo "1️⃣  Get Twilio Account:"
    echo "   - Go to: https://www.twilio.com/try-twilio"
    echo "   - Sign up (free \$15 credit)"
    echo "   - Verify your phone number"
    echo ""
    echo "2️⃣  Get WhatsApp Sandbox:"
    echo "   - In Twilio console: Messaging → Try it out → WhatsApp"
    echo "   - Join the sandbox with your phone"
    echo "   - You'll get a sandbox number"
    echo ""
    echo "3️⃣  Get Credentials:"
    echo "   - Account SID: Dashboard → Show API Credentials"
    echo "   - Auth Token: Dashboard → Show API Credentials"
    echo "   - WhatsApp Number: From sandbox setup"
    echo ""
    echo "4️⃣  Set up simple server:"
    echo ""

    # Check if server directory exists
    if [ ! -d "server" ]; then
      echo "   Creating server directory..."
      mkdir -p server
      cd server

      echo "   Initializing server..."
      npm init -y > /dev/null 2>&1
      npm install express twilio cors > /dev/null 2>&1

      echo "   ✅ Server dependencies installed"
      cd ..
    fi

    echo ""
    echo "5️⃣  Set environment variables:"
    echo "   export TWILIO_ACCOUNT_SID='your_account_sid'"
    echo "   export TWILIO_AUTH_TOKEN='your_auth_token'"
    echo ""
    echo "6️⃣  Run server:"
    echo "   cd server && node index.js"
    echo ""
    echo "7️⃣  Configure Extension:"
    echo "   - Add your WhatsApp number: +1234567890"
    echo "   - Enable WhatsApp alerts"
    echo "   - Click 'Send Test Alert'"
    echo ""
    echo "📖 Full guide: $(pwd)/WHATSAPP-SETUP.md"
    echo ""

    read -p "Have you set up Twilio and want to test? (y/n): " test_real

    if [ "$test_real" = "y" ]; then
      # Check if credentials are set
      if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ]; then
        echo ""
        echo "⚠️  Twilio credentials not set!"
        echo ""
        echo "Please set them first:"
        echo "  export TWILIO_ACCOUNT_SID='your_account_sid'"
        echo "  export TWILIO_AUTH_TOKEN='your_auth_token'"
        echo ""
        echo "Then run this script again."
      else
        echo "✅ Credentials found!"
        echo ""
        echo "🚀 Starting server..."
        cd server
        node index.js &
        SERVER_PID=$!
        echo "✅ Server started (PID: $SERVER_PID)"
        echo ""
        echo "🧪 Now:"
        echo "  1. Load extension in Chrome"
        echo "  2. Configure with your WhatsApp number"
        echo "  3. Test PII detection"
        echo "  4. Check your WhatsApp for message!"
        echo ""
        echo "Press Ctrl+C to stop server when done testing"
        wait $SERVER_PID
      fi
    fi
    ;;

  *)
    echo "❌ Invalid choice. Please run again and select 1 or 2."
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💡 Tips:"
echo "    - Demo mode works immediately (no API needed)"
echo "    - Real WhatsApp requires Twilio setup (~5 min)"
echo "    - Check console (F12) to see WhatsApp logs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
