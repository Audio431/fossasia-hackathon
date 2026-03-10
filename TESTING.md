# Testing Privacy Shadow Extension

## Quick Start

### 1. Verify Extension is Loaded

1. Open Chrome and navigate to `chrome://extensions/`
2. Find "Privacy Shadow: Protect Kids Online" in the list
3. Make sure it's **enabled** (toggle switch is blue)
4. Click the **Refresh** icon if needed

### 2. Open the Test Page

Open the test page created for you:
```
file:///Users/nat/privacy-shadow/test.html
```

Or navigate to it via: **File > Open File > test.html**

### 3. Check Extension Status

On the test page, click the **"Check Extension"** button. You should see:
- ✅ **Green status**: Extension is active!
- ❌ **Red status**: Extension not loaded (enable it in chrome://extensions/)

### 4. Test PII Detection

Try these tests on the test page:

#### Test 1: Birthdate
- Enter: `05/12/2012`
- Click: **Submit Birthdate**
- Expected: Console shows birthdate detected

#### Test 2: Phone Number
- Enter: `123-456-7890`
- Click: **Submit Phone**
- Expected: Console shows phone detected

#### Test 3: Location
- Enter: `I live in Springfield, IL`
- Click: **Submit Location**
- Expected: Console shows location detected

#### Test 4: Combined PII
- Enter: `My name is John, I'm 13 years old, I live in Springfield, IL, and you can call me at 123-456-7890`
- Click: **Submit Bio**
- Expected: Console shows multiple PII types detected

### 5. Check Extension Popup

1. Click the **Privacy Shadow icon** in Chrome toolbar (ghost emoji 👻)
2. You should see:
   - Quick stats (Today, This Week, High Risk)
   - Recent Activity section
   - Parent View / Kid View toggle

**If PII was detected**, you'll see alert cards instead of "No alerts yet!"

---

## Testing on Instagram

### Option 1: Using the Instagram DM You Already Have Open

1. Navigate to the Instagram DM you have open: `https://www.instagram.com/direct/t/18041840711558078/`
2. Open Chrome DevTools: **Right-click > Inspect** or press `Cmd+Option+I` (Mac)
3. Go to the **Console** tab
4. Look for messages starting with `👻 Privacy Shadow:`

### Option 2: Test PII Detection in Instagram

1. Navigate to any Instagram post or DM
2. Open Chrome DevTools (Cmd+Option+I)
3. In the Console tab, look for:
   - `👻 Privacy Shadow: Social media monitor active`
   - `👻 Privacy Shadow: Instagram-specific monitoring active`

4. **Try typing PII in a comment or DM:**
   - Type: `My birthday is 05/12/2012`
   - Or: `I am 13 years old`
   - Or: `Call me at 123-456-7890`

5. **Watch the Console:**
   - You should see: `👻 Social post PII detected`
   - You should see: `👻 Alert stored`

### Option 3: Check Content Script is Injected

In the Chrome DevTools Console, paste this code:

```javascript
// Check if content script loaded
console.log('Content script check:');
console.log('- URL:', window.location.href);
console.log('- Chrome API available:', typeof chrome !== 'undefined');
console.log('- Content script markers:', document.querySelectorAll('[data-privacy-shadow-risk]').length);

// Test manual detection
chrome.runtime.sendMessage(
  { type: 'DETECT_PII', text: 'My birthday is 05/12/2012' },
  (response) => {
    console.log('Manual detection result:', response);
  }
);
```

---

## Manual Verification Script

We've created a verification script for you. To use it:

1. Open any webpage (e.g., your test.html or Instagram)
2. Open Chrome DevTools (Cmd+Option+I)
3. Go to the **Console** tab
4. Open the file: `/Users/nat/privacy-shadow/verify-extension.js`
5. **Copy all the code** from that file
6. **Paste it into the Console** and press Enter

The script will:
- ✅ Check if the extension is loaded
- ✅ Test PII detection patterns
- ✅ Test communication with background script
- ✅ List all forms on the page
- ✅ List all input fields
- ✅ Check for Instagram-specific elements

---

## What to Expect

### Working Extension
- ✅ Console shows: `👻 Privacy Shadow: Starting...`
- ✅ Console shows: `👻 Privacy Shadow: Ready!`
- ✅ Content scripts log: `Form monitor active`, `Social media monitor active`
- ✅ Test page shows green "Extension is Active!" status
- ✅ Typing PII in forms triggers detection
- ✅ Extension popup shows alerts when PII is detected

### Broken Extension
- ❌ Console shows errors (red text)
- ❌ Test page shows red "Extension not responding"
- ❌ No `👻 Privacy Shadow` messages in console
- ❌ Extension popup shows "No alerts yet!" even after testing

---

## Troubleshooting

### Extension Not Loading

1. Go to `chrome://extensions/`
2. Find "Privacy Shadow"
3. Click **"Remove"** if it exists
4. In the terminal, navigate to `/Users/nat/privacy-shadow`
5. Make sure Plasmo dev server is running:
   ```bash
   npm run dev
   ```
6. In Chrome, go to `chrome://extensions/`
7. Turn on **Developer mode** (toggle in top right)
8. Click **"Load unpacked"**
9. Select: `/Users/nat/privacy-shadow/build/chrome-mv3-dev`

### Content Script Not Injecting

1. Check Chrome DevTools Console for errors
2. Refresh the page (Cmd+R)
3. Check if the URL matches content script matches:
   - Instagram: `https://www.instagram.com/*`
   - Twitter: `https://twitter.com/*`, `https://x.com/*`
   - Generic: All URLs (`<all_urls>`)

### PII Not Being Detected

1. Open Chrome DevTools Console
2. Look for `👻 Privacy Shadow` messages
3. If you see errors, report them
4. Try the manual verification script (see above)
5. Check the Background Script console:
   - Go to `chrome://extensions/`
   - Find "Privacy Shadow"
   - Click **"Service worker"** link
   - Check that console for errors

---

## Success Criteria

✅ Extension loads without errors
✅ Content scripts inject into pages
✅ PII detection works (birthdate, phone, email, location)
✅ Alerts are stored and shown in popup
✅ Instagram monitoring works (comments, DMs, bio)
✅ Form submission interception works

---

## Next Steps After Testing

If everything works:
1. 🎉 You have a working extension!
2. Test on more platforms (Twitter, Facebook, TikTok)
3. Try uploading an image with GPS data
4. Check if parent notifications work (if backend is set up)

If something doesn't work:
1. Check the Console for errors
2. Report the specific error message
3. Try the manual verification script
4. Check if the extension is enabled in `chrome://extensions/`
