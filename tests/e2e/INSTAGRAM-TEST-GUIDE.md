# 📱 Testing Privacy Shadow on Real Instagram

## Quick Start Guide

### Step 1: Ensure Extension is Loaded
1. Open `chrome://extensions/`
2. Find "Privacy Shadow"
3. Make sure it's **enabled** ✅
4. Click **reload** 🔄 if needed

---

### Step 2: Open Instagram
Go to: **https://www.instagram.com/**

**Login required** to access DMs

---

### Step 3: Test in Instagram DMs

#### Navigate to DMs:
- Click the **Messenger icon** (✈️) in top right
- Or go to: `instagram.com/direct/inbox/`

#### Test PII Detection:

**Test 1: Address**
```
Type: my address is 123 main street springfield illinois
Action: Click outside the textarea (blur)
Expected: ⚠️ Alert appears!
```

**Test 2: Email**
```
Type: my email is myname@gmail.com
Action: Click outside
Expected: ⚠️ Alert appears!
```

**Test 3: Phone**
```
Type: call me at 555-123-4567
Action: Click outside
Expected: ⚠️ Alert appears!
```

**Test 4: Safe Message** (should NOT alert)
```
Type: hey whats up
Action: Click outside
Expected: No alert ✅
```

---

## What You Should See

### Alert Appearance:
```
┌─────────────────────────────────────┐
│         ⚠️                           │
│         Wait!                        │
│                                      │
│  Privacy Shadow detected            │
│  sensitive info                      │
│                                      │
│  You're about to share:             │
│  • Location information             │
│                                      │
│  This info can be seen by           │
│  people you don't know...           │
│                                      │
│  [← Nevermind]  [Send Anyway]      │
└─────────────────────────────────────┘
```

---

## 🔍 Verify It's Working

### Check Browser Console:
1. Right-click → **Inspect**
2. Go to **Console** tab
3. Look for logs:
```
Privacy Shadow: Form monitor active
Privacy Shadow: Form monitor ready
Privacy Shadow: Stranger monitor active
```

### Check Monitored Elements:
In console, type:
```javascript
document.querySelectorAll('[data-ps-monitoring]')
```
Should show: `1` element (not 3!)

---

## ⚠️ Known Limitations

### Instagram Requires Login
- DMs are only accessible when logged in
- Automated testing can't bypass login
- **Manual testing is required**

### Instagram's Dynamic UI
- Instagram changes DOM elements frequently
- Selectors may break
- Extension uses generic fallbacks to work

---

## 🎯 Success Criteria

✅ **Extension loads** on instagram.com
✅ **No errors** in browser console
✅ **DM inputs are monitored** (check console logs)
✅ **Alerts appear** for PII
✅ **No duplicate alerts**
✅ **Alerts don't appear while typing**

---

## 🚨 Troubleshooting

### No Alert Appearing?

1. **Check extension is enabled**
   ```
   chrome://extensions/ → Privacy Shadow → Enable
   ```

2. **Reload the extension**
   - Click 🔄 reload button

3. **Make sure you blur (click away)**
   - Alerts only appear AFTER you click outside
   - Not while typing

4. **Check browser console**
   - Look for "Privacy Shadow" logs
   - Check for errors

5. **Try a shorter test**
   ```
   Type: my address is 123 main st
   Click away
   ```

---

## 📊 Expected Behavior

| Input Type | Should Alert? | Alert Title | Risk Level |
|-----------|-------------|-------------|------------|
| Safe message | ❌ No | - | - |
| Address | ✅ Yes | Wait! | High (30/100) |
| Email | ✅ Yes | Wait! | High (30/100) |
| Phone | ✅ Yes | Wait! | High (30/100) |
| Birthday | ✅ Yes | Wait! | High (30/100) |
| School name | ✅ Yes | Wait! | Medium (20/100) |

---

## 💡 Pro Tips

### Test Multiple Times
1. Type PII → Alert appears
2. Click "Send Anyway"
3. Type SAME PII → No alert (remembered) ✅

### Test Different Platforms
- ✅ Instagram DMs (textarea elements)
- ✅ Instagram Comments (textarea elements)
- ✅ Instagram Bio (div elements)

---

## 🎉 Manual Testing Checklist

- [ ] Extension loads on instagram.com
- [ ] Console shows "Privacy Shadow" logs
- [ ] Type address → Alert appears
- [ ] Type email → Alert appears
- [ ] Type phone → Alert appears
- [ ] Type safe message → No alert
- [ ] Only ONE alert appears (not duplicates)
- [ ] Alert doesn't appear while typing
- [ ] "Send Anyway" remembers acknowledgment
- [ ] Can dismiss alert with "Nevermind"

---

**Happy Testing! 🚀**

The extension works on the real Instagram - just need to login and test manually!
