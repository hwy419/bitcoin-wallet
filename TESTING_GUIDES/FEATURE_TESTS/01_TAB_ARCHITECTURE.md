# Feature Test Guide: Tab Architecture & Security

**Feature Area:** Tab Architecture
**Test Cases:** 16 tests
**Time to Execute:** 1-2 hours
**Priority:** P0 (Critical - Security)

---

## Overview

This feature validates the wallet's tab-based architecture and critical security controls. The wallet operates in a full browser tab (not a popup) with stringent security measures including single tab enforcement, clickjacking prevention, and tab nabbing detection.

**Why this matters:** These security controls prevent attackers from stealing funds through interface manipulation or session hijacking.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Fresh browser session
- [ ] Test HTML file prepared for clickjacking test

---

## Test Cases

### TAB-001: Tab Opening and Focus

**Priority:** P0
**Time:** 2 minutes

**Purpose:** Verify extension opens in new tab (not popup)

**Steps:**
1. Open Chrome
2. Navigate to any website
3. Click Bitcoin ₿ icon in Chrome toolbar
4. Observe what opens

**Expected Results:**
- ✅ New browser TAB opens (not popup window)
- ✅ URL: `chrome-extension://[random-id]/index.html`
- ✅ Tab title: "Bitcoin Wallet"
- ✅ Extension UI loads within 500ms
- ✅ No console errors (F12)

**Visual Checkpoints:**
- [ ] Full browser tab (not small popup)
- [ ] URL bar shows extension URL
- [ ] Sidebar visible (240px wide)
- [ ] Main content area centered (800px max)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-002: Single Tab Enforcement

**Priority:** P0 (Security Critical)
**Time:** 5 minutes

**Purpose:** Verify only ONE wallet tab can be active at a time

**Setup:**
1. Open wallet in Tab A
2. Unlock wallet with password
3. Note this is the active wallet tab

**Test 1: Duplicate Tab (Ctrl+Shift+D)**
**Steps:**
1. With Tab A active, press Ctrl+Shift+D (Cmd+Shift+D on Mac)
2. Observe both tabs

**Expected Results:**
- ✅ Tab A shows: "Wallet Tab Closed - Another tab is now active"
- ✅ Tab A displays orange "Return to Wallet" button
- ✅ Tab B (new tab) now has active wallet session
- ✅ Can interact with wallet in Tab B only
- ✅ Clicking buttons in Tab A does nothing

**Test 2: Copy-Paste URL**
**Steps:**
1. Copy URL from active wallet tab
2. Open new tab (Ctrl+T)
3. Paste URL and press Enter
4. Observe both tabs

**Expected Results:**
- ✅ First tab loses session
- ✅ Second tab gets session
- ✅ Only one tab active at a time

**Test 3: Bookmark and Reopen**
**Steps:**
1. Bookmark wallet URL (Ctrl+D)
2. Close all wallet tabs
3. Open bookmark
4. Open bookmark again in new tab

**Expected Results:**
- ✅ First bookmark opens wallet normally
- ✅ Second bookmark triggers session transfer
- ✅ Single tab enforcement still works

**What to Check in Console:**
```
[TAB SESSION] Created new session: [token]
[TAB SESSION] Validated: true
[TAB SESSION] Session transferred to new tab
[TAB SESSION] Old tab invalidated
```

**Security Impact:** If this fails, multiple tabs could access wallet simultaneously, causing race conditions and potential fund loss.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 BLOCKER)

---

### TAB-003: Clickjacking Prevention

**Priority:** P0 (Security Critical)
**Time:** 10 minutes

**Purpose:** Verify wallet cannot be embedded in iframe

**Preparation:**
Create file `clickjacking-test.html`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Clickjacking Prevention Test</title>
    <style>
        iframe { border: 2px solid red; }
    </style>
</head>
<body>
    <h1>Clickjacking Prevention Test</h1>
    <p>If you can see the wallet interface below, clickjacking prevention is BROKEN.</p>
    <p>Expected: Security error or blank iframe</p>

    <iframe
        src="chrome-extension://[YOUR-EXTENSION-ID]/index.html"
        width="800"
        height="600">
    </iframe>

    <p>Check console for errors (F12)</p>
</body>
</html>
```

**Steps:**
1. Get extension ID from chrome://extensions/
2. Replace `[YOUR-EXTENSION-ID]` in HTML file
3. Open `clickjacking-test.html` in browser
4. Observe iframe content
5. Check browser console (F12)

**Expected Results:**
- ✅ Iframe shows security error OR blank screen
- ✅ Wallet UI does NOT render in iframe
- ✅ Cannot interact with wallet in iframe
- ✅ Console shows error about iframe detection
- ✅ React app does not initialize

**Actual Result to Document:**
- What appears in iframe: _______________
- Console error message: _______________

**Security Impact:** If wallet loads in iframe, attackers can embed wallet in malicious sites and trick users into signing fraudulent transactions.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL SECURITY ISSUE)

---

### TAB-004: Tab Nabbing Detection

**Priority:** P0 (Security Critical)
**Time:** 3 minutes

**Purpose:** Verify wallet detects and prevents tab nabbing attacks

**Background:** Tab nabbing is when JavaScript changes `window.location` to redirect user to fake wallet site.

**Steps:**
1. Open wallet and unlock
2. Open browser console (F12)
3. Paste this command:
   ```javascript
   window.location.href = 'https://evil.com';
   ```
4. Press Enter
5. Observe wallet response (should be within 1 second)

**Expected Results:**
- ✅ Wallet detects location change immediately (<1 second)
- ✅ Shows "Tab Nabbing Detected" alert OR locks wallet
- ✅ Cannot access wallet after detection
- ✅ Must unlock again to use wallet
- ✅ Console shows: "[TAB NABBING] Detected location change"

**Alternative Test:**
Try to change location via:
```javascript
window.location.replace('https://phishing-site.com');
```

**Expected:** Same detection and lockout

**What to Check:**
- Detection speed: ___ seconds (should be <1 second)
- Wallet locked: Yes / No
- Can access funds after detection: Yes / No (should be No)

**Security Impact:** If this fails, attackers can redirect users to fake wallet sites that steal credentials.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL)

---

### TAB-005: Auto-Lock on Hidden Tab

**Priority:** P1
**Time:** 5-10 minutes

**Purpose:** Verify wallet auto-locks after 5 minutes when tab is hidden

**Steps:**
1. Open wallet and unlock
2. Note current time: ___:___
3. Switch to different tab (wallet tab now hidden)
4. Wait 5 minutes
5. Return to wallet tab
6. Observe wallet state

**Expected Results:**
- ✅ After 5 minutes hidden, wallet shows lock screen
- ✅ Must re-enter password to access
- ✅ Timer resets if you switch back before 5 min
- ✅ Console shows: "[AUTO-LOCK] Hidden tab timer expired"

**Variation Test:**
1. Unlock wallet
2. Switch to different tab
3. Wait 4 minutes
4. Switch back to wallet (reset timer)
5. Switch away again
6. Wait 5 more minutes
7. Return

**Expected:** Timer reset, so total 9 minutes needed

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-006: Sidebar Navigation

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify sidebar navigation works correctly

**Steps:**
1. Unlock wallet
2. Click each navigation item:
   - Assets (₿)
   - Multi-sig Wallets (🔐)
   - Contacts (👥)
   - Settings (⚙️)

**Expected Results:**
- ✅ Clicking each item navigates to correct screen
- ✅ Active item shows orange left border (4px)
- ✅ Active item has gray-800 background
- ✅ Inactive items have no background
- ✅ Icons are 20×20px, properly aligned
- ✅ Text is 16px, white for active, gray for inactive

**Visual Checkpoints:**
```
Active item:
├─ 4px orange left border
├─ Gray-800 background
├─ White text
└─ Icon: Orange

Inactive item (hover):
├─ No border
├─ Gray-850 background
├─ Gray-200 text
└─ Icon: Gray-400
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-007: Account Switcher UI

**Priority:** P1
**Time:** 3 minutes

**Prerequisites:**
- Have 2+ accounts created

**Steps:**
1. Look at sidebar bottom section
2. Click on account switcher (shows current account)
3. Observe dropdown menu

**Expected Results:**
- ✅ Dropdown opens showing all accounts
- ✅ Current account has checkmark (✓)
- ✅ Each account shows:
  - Account name
  - Balance (BTC)
  - Address type badge
- ✅ "+ Create Account" option at bottom
- ✅ Clicking account switches to that account
- ✅ Dropdown closes after selection

**Visual Verification:**
```
Account Switcher (Closed):
┌─────────────┐
│ [👤] ▼     │
│ Account 1   │
│ 0.05 BTC    │
└─────────────┘

Account Switcher (Open):
┌─────────────┐
│ [👤] ▲     │
│ Account 1   │
├─────────────┤
│ ✓ Account 1 │ ← Selected
│   0.05 BTC  │
│   Account 2 │
│   0.001 BTC │
├─────────────┤
│ + Create... │
└─────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-008: Session Token Validation

**Priority:** P0 (Security)
**Time:** 2 minutes

**Purpose:** Verify session tokens are validated regularly

**Steps:**
1. Unlock wallet
2. Open console (F12)
3. Filter console for: "TAB SESSION"
4. Observe logs for 30 seconds

**Expected Results:**
- ✅ Console shows: "[TAB SESSION] Validated: true" every ~5 seconds
- ✅ Validation happens automatically
- ✅ No errors during validation
- ✅ Token is 256-bit random string

**What to Check:**
```
Expected console output pattern:
[TAB SESSION] Created session: a3f5d7b9c2e4...
[TAB SESSION] Validated: true (0ms)
[TAB SESSION] Validated: true (0ms)  ← ~5 seconds later
[TAB SESSION] Validated: true (0ms)  ← ~5 seconds later
```

**Validation Interval:**
- Time between validations: ___ seconds (should be ~5)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TAB-009: Visibility Lock Timer

**Priority:** P1
**Time:** 15-20 minutes

**Purpose:** Verify inactivity auto-lock timer (15 minutes)

**Steps:**
1. Unlock wallet
2. Keep tab ACTIVE and VISIBLE
3. Do NOT interact with wallet for 15 minutes
4. After 15 minutes, try to click something

**Expected Results:**
- ✅ After ~15 minutes, wallet auto-locks
- ✅ Shows lock screen or overlay
- ✅ Must re-enter password
- ✅ Any interaction resets timer (mouse move, click, keyboard)

**Interaction Reset Test:**
1. Unlock wallet
2. Wait 10 minutes
3. Click anywhere in wallet
4. Wait another 10 minutes (total 20 min)

**Expected:** Wallet still unlocked (timer reset at 10 min mark)

**Note:** This test can run in background while you do other tests

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-010: Full Viewport Layout

**Priority:** P1
**Time:** 2 minutes

**Purpose:** Verify layout uses full browser tab correctly

**Steps:**
1. Open wallet in tab
2. Measure layout elements using DevTools (F12 → Elements → Inspect)

**Expected Results:**
- ✅ Sidebar: Exactly 240px wide, full height
- ✅ Main content: Max 800px wide, centered
- ✅ No wasted space
- ✅ Responsive to window resize (within limits)

**Measurement Verification:**
```
Use DevTools to measure:
1. Right-click sidebar → Inspect
2. Check computed width: Should be 240px
3. Right-click main content → Inspect
4. Check max-width: Should be 800px
5. Check margin: Should be "0 auto" (centered)
```

**Visual Checkpoints:**
- [ ] Sidebar fixed 240px
- [ ] Content centered
- [ ] No horizontal scroll at 1024px+ width
- [ ] Layout doesn't break at 1920×1080

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### TAB-EDGE-01: Duplicate Tab via Copy URL

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Open wallet, unlock
2. Copy URL from address bar
3. Open new tab, paste URL, Enter
4. Observe session transfer

**Expected:** Session moves to new tab, old tab invalidated

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-EDGE-02: Browser Refresh

**Priority:** P2
**Time:** 1 minute

**Steps:**
1. Unlock wallet
2. Press F5 (or Ctrl+R)

**Expected:**
- ✅ Wallet shows unlock screen
- ✅ Data persists (no corruption)
- ✅ Must re-enter password

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-EDGE-03: Extension Reload

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Unlock wallet
2. Go to chrome://extensions/
3. Click "Reload" button for Bitcoin Wallet
4. Return to wallet tab

**Expected:**
- ✅ Wallet reloads
- ✅ Shows unlock screen
- ✅ Data persists

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-EDGE-04: Multiple Windows

**Priority:** P2
**Time:** 3 minutes

**Steps:**
1. Open wallet in Window 1, unlock
2. Open new browser window (Ctrl+N)
3. Click extension icon in Window 2

**Expected:**
- ✅ Single tab enforcement works across windows
- ✅ New tab in Window 2 gets session
- ✅ Old tab in Window 1 invalidated

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-EDGE-05: Back/Forward Navigation

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Open wallet, unlock
2. Navigate to Settings
3. Press browser Back button
4. Press Forward button

**Expected:**
- ✅ Navigation works
- ✅ Wallet state maintains
- ✅ No errors

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TAB-EDGE-06: Tab Close and Reopen

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Unlock wallet
2. Close tab completely (Ctrl+W)
3. Click extension icon to reopen

**Expected:**
- ✅ Shows unlock screen
- ✅ Data not lost
- ✅ Can unlock and continue

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Test Summary

**Total Tests:** 16
**P0 Tests:** 6 (TAB-001 to TAB-004, TAB-008)
**P1 Tests:** 4 (TAB-005 to TAB-007, TAB-009, TAB-010)
**P2 Tests:** 6 (TAB-EDGE-01 to TAB-EDGE-06)

**Critical Security Tests:**
- TAB-002: Single Tab Enforcement
- TAB-003: Clickjacking Prevention
- TAB-004: Tab Nabbing Detection
- TAB-008: Session Token Validation

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Extension opens popup instead of tab
**Cause:** Manifest v3 configuration issue
**Solution:** Check manifest.json action configuration
**Report As:** P0 bug

### Issue: Multiple tabs can access wallet simultaneously
**Cause:** Session token not enforcing single tab
**Solution:** Check session validation logic
**Report As:** P0 critical security bug

### Issue: Wallet loads in iframe
**Cause:** Clickjacking prevention not working
**Solution:** Check CSP headers and iframe detection
**Report As:** P0 critical security bug

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
