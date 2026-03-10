# 🔧 Instagram Integration Troubleshooting Guide

## Problem: Extension never alerts on Instagram.com

If you're experiencing issues where Privacy Shadow doesn't alert on Instagram, follow these steps:

---

## ✅ Step 1: Verify Extension is Built

**The most common issue is using an old build!**

```bash
# Make sure you're using the latest build with Instagram support
npm run build

# Verify the build completed successfully
# You should see: "DONE | Finished in XXXms!"
```

**Then reload the extension:**
1. Go to `chrome://extensions/`
2. Find "Privacy Shadow"
3. Click the reload icon 🔄
4. Or remove and re-add it from `build/chrome-mv3-prod`

---

## ✅ Step 2: Verify Content Scripts Load

**Open Instagram.com and check the console:**

1. Go to `instagram.com` (must be logged in)
2. Press `F12` to open DevTools
3. Go to the **Console** tab
4. Look for these messages:

```
✅ Expected Console Output:
Privacy Shadow: Instagram form monitor active
Privacy Shadow: Form monitor active
Privacy Shadow: Initializing Instagram form monitor
Privacy Shadow: Monitoring Instagram DMs
```

**If you DON'T see these messages:**
- The extension wasn't built correctly
- The extension isn't loaded in Chrome
- Content scripts are blocked (check extension permissions)

**Solution:**
```bash
# Rebuild completely
rm -rf build
npm run build

# Reload extension in Chrome
chrome://extensions/ → Remove extension → Load unpacked → build/chrome-mv3-prod
```

---

## ✅ Step 3: Verify You're on a DM Page

**The Instagram monitor ONLY works on DM conversations!**

- ✅ **Works:** `instagram.com/direct/t/1234567890/` (conversation)
- ✅ **Works:** `instagram.com/messages/` (any message view)
- ❌ **Doesn't work:** `instagram.com/` (home page)
- ❌ **Doesn't work:** `instagram.com/p/ABC123/` (post page)
- ❌ **Doesn't work:** `instagram.com/direct/inbox/` (inbox list - no open conversation)

**To test:**
1. Go to `instagram.com/direct/inbox/`
2. Click on ANY conversation
3. The URL should change to include `/t/` or conversation ID
4. Now check console for "Found X potential input elements"

---

## ✅ Step 4: Check Input Detection

**Look for this message in console:**

```
Privacy Shadow: Found X potential input elements
Privacy Shadow: Attaching monitor to input 1
```

**If X = 0:**
- No inputs were found on the page
- You might not be on a DM conversation
- Instagram's DOM changed and selectors need updating

**Solution:**
1. Make sure you're on a DM conversation (click on a message thread)
2. Refresh the page after opening the conversation
3. Check if the message input field is visible on screen

---

## ✅ Step 5: Test PII Detection Manually

**In the Instagram DM input, type:**

```
my address is 123 main street
```

**Then click OUTSIDE the input field (blur it).**

**Check console for:**

```
Privacy Shadow: Checking Instagram message: my address is 123 main street
Privacy Shadow: PII detected in Instagram DM [{ type: 'address', ... }]
Privacy Shadow: Showing alert - Level: high Score: 75
```

**If no console logs appear:**
- The blur event didn't fire
- The monitor didn't attach to the input
- Instagram uses a different element type

**Debugging:**
```javascript
// In Chrome DevTools Console on Instagram:
// Check if we can find the input
document.querySelectorAll('textarea, div[contenteditable], input[type="text"]')
// This should show you all potential inputs
```

---

## ✅ Step 6: Verify Alert Settings

**The extension might be disabled or in quiet hours!**

1. Click the Privacy Shadow extension icon
2. Go to **"Parent Dashboard"** tab
3. Check these settings:

```
✅ Master toggle: ON (enabled)
✅ Sensitivity: Medium or Low (easier to trigger)
✅ Quiet Hours: Make sure current time isn't in quiet period
✅ WhatsApp Alerts: Can be OFF (alerts still show to child)
```

**If extension is disabled:**
- Toggle the master switch to ON
- Refresh Instagram page
- Try again

---

## ✅ Step 7: Check for Console Errors

**Look for red error messages in console:**

Common errors:

### Error: "Extension context invalidated"
**Cause:** Extension was reloaded
**Solution:** Refresh the Instagram page

### Error: "Cannot read property of undefined"
**Cause:** Missing settings or utils
**Solution:** Rebuild extension (`npm run build`)

### Error: "WhatsApp notification failed"
**Cause:** Notification simulator has issues
**Solution:** This is OK, it falls back to console logs
The alert to child should still work!

---

## 🎯 Quick Test Checklist

Use this checklist to verify everything is working:

- [ ] Extension rebuilt: `npm run build` completed successfully
- [ ] Extension loaded in Chrome: Visible in `chrome://extensions/`
- [ ] Console shows "Instagram form monitor active"
- [ ] On DM conversation page: URL includes `/t/` or conversation ID
- [ ] Console shows "Found X potential input elements" where X > 0
- [ ] Console shows "Attaching monitor to input"
- [ ] Typed "my address is 123 main street" in DM input
- [ ] Clicked outside input (blur)
- [ ] Console shows "Checking Instagram message"
- [ ] Console shows "PII detected in Instagram DM"
- [ ] Alert overlay appears on screen
- [ ] WhatsApp notification slides in from right

---

## 🚨 Still Not Working?

### Advanced Debugging:

**1. Check content script injection:**
```javascript
// In Chrome DevTools Console on Instagram:
chrome.runtime.sendMessage({ type: 'CHECK_FORMS' }, (response) => {
    console.log('Extension response:', response);
});
```

**2. Manually test PII detector:**
```javascript
// This won't work in console (imports), but proves the concept
// If the extension loaded, the detector should work
```

**3. Check Instagram's actual input elements:**
```javascript
// In Chrome DevTools Console on Instagram:
// Find what Instagram actually uses for message input
const inputs = document.querySelectorAll('*');
let inputCount = 0;
inputs.forEach(el => {
  if (el.getAttribute('contenteditable') === 'true') {
    console.log('Content editable:', el);
    inputCount++;
  }
});
console.log('Total contenteditable elements:', inputCount);
```

**4. Force reload content scripts:**
```javascript
// In Chrome DevTools Console on Instagram:
location.reload();
// Then immediately check console for Privacy Shadow messages
```

---

## 📱 Video Demo Walkthrough

If text instructions aren't clear, here's what to do:

1. **Open Chrome** and go to `chrome://extensions/`
2. **Find Privacy Shadow** and click the reload icon 🔄
3. **Open Instagram** and log in
4. **Go to DMs** (messenger icon top-right)
5. **Click any conversation** to open it
6. **Open DevTools** (F12) → Console tab
7. **Look for** "Privacy Shadow: Instagram form monitor active"
8. **Type in DM:** "my address is 123 main street"
9. **Click outside** the input field
10. **Watch for** alert overlay and green notification

---

## 💡 Pro Tips

### Tip 1: Use Test Page First
Before testing on Instagram, verify detection works:
```bash
open test-instagram.html
```
This tests the PII detection engine without Instagram complexity.

### Tip 2: Check Network Tab
Sometimes Instagram loads content dynamically:
1. Open DevTools → Network tab
2. Look for failed requests
3. Check if content scripts are blocked by CSP

### Tip 3: Try Incognito Mode
Sometimes other extensions interfere:
1. Open Incognito window
2. Enable Privacy Shadow in incognito
3. Test on Instagram

### Tip 4: Clear Cache
Old versions might be cached:
1. `chrome://extensions/`
2. Remove Privacy Shadow
3. Clear browser cache
4. Rebuild: `npm run build`
5. Re-add extension

---

## 🔍 Expected Behavior (What Success Looks Like)

When everything works correctly:

1. **Console Output:**
```
Privacy Shadow: Instagram form monitor active
Privacy Shadow: Initializing Instagram form monitor
Privacy Shadow: Monitoring Instagram DMs
Privacy Shadow: Found 2 potential input elements
Privacy Shadow: Attaching monitor to input 1
```

2. **When you type PII:**
```
Privacy Shadow: Checking Instagram message: my address is 123 main street
Privacy Shadow: PII detected in Instagram DM
Privacy Shadow: Showing alert - Level: high Score: 75
```

3. **Visual Alerts:**
   - ⚠️ Alert overlay appears with "Wait! Before you send..."
   - 📱 Green WhatsApp notification slides in from right
   - Both animations are smooth

4. **User Actions:**
   - User can click "Nevermind" (clears input)
   - User can click "I Understand" (allows sending)
   - Console logs show user's choice

---

## 📞 Still Need Help?

If you've tried everything and it still doesn't work:

1. **Check the build output:**
   ```bash
   ls -la build/chrome-mv3-prod/contents/
   # You should see instagram-form-monitor.js
   ```

2. **Verify imports:**
   ```bash
   grep -r "instagram-form-monitor" build/
   # Should show it's imported in content.js
   ```

3. **Test in a clean Chrome profile:**
   - Create new Chrome profile
   - Install only Privacy Shadow
   - Test on Instagram

---

## ✅ Final Verification

**The ULTIMATE test:**

```bash
# 1. Clean rebuild
rm -rf build
npm run build

# 2. Fresh Chrome
# Open chrome://extensions/
# Remove Privacy Shadow
# Add fresh from build/chrome-mv3-prod

# 3. Test on Instagram
# Go to instagram.com/direct/t/ANY_ID/
# Open console (F12)
# Type: "my address is 123 main street"
# Click outside input
# Watch for magic!
```

If this doesn't work, there might be a deeper issue with the Instagram integration that requires updating the CSS selectors (Instagram changes their DOM frequently).

---

**Good luck! The extension works when built and loaded correctly! 🚀**
