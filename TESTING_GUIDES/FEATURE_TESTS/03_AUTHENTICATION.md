# Feature Test Guide: Authentication & Locking

**Feature Area:** Authentication & Security
**Test Cases:** 10 tests
**Time to Execute:** 1-1.5 hours
**Priority:** P0 (Critical - Security)

---

## Overview

This feature validates wallet authentication, locking/unlocking mechanisms, auto-lock timers, and password verification. Authentication is a critical security layer that protects user funds from unauthorized access.

**Why this matters:** Proper authentication prevents unauthorized access to the wallet. Auto-lock features ensure that even if a user walks away from their computer, the wallet automatically locks to protect funds.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet already created with known password (use: "TestPassword123!")
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Fresh browser session
- [ ] Timer or stopwatch for auto-lock tests

---

## Test Cases

### AUTH-001: Unlock Wallet - Correct Password

**Priority:** P0
**Time:** 3 minutes

**Purpose:** Verify wallet unlocks with correct password

**Steps:**
1. Open extension (wallet is locked by default)
2. Observe unlock screen
3. Enter correct password: "TestPassword123!"
4. Click "Unlock" button
5. Observe wallet unlocking

**Expected Results:**
- ✅ Unlock screen displays clearly
- ✅ Password field visible and focused
- ✅ "Unlock" button enabled after typing
- ✅ Password masked (••••••) by default
- ✅ Clicking "Unlock" unlocks wallet
- ✅ Dashboard displayed within 1 second
- ✅ Balance and account data loaded
- ✅ No errors in console
- ✅ Smooth transition to dashboard

**Visual Checkpoints:**
```
Unlock Screen:
┌─────────────────────────┐
│   🔒 Bitcoin Wallet     │
│                         │
│   Wallet is Locked      │
│                         │
│   Password:             │
│   [••••••••••] [👁️]    │
│                         │
│   [Unlock Wallet]       │
└─────────────────────────┘
```

**Performance Check:**
- Unlock time: _____ ms (should be < 1 second)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-002: Unlock Wallet - Incorrect Password

**Priority:** P0
**Time:** 3 minutes

**Purpose:** Verify wallet rejects incorrect password

**Steps:**
1. Open extension (wallet is locked)
2. Enter WRONG password: "WrongPassword123!"
3. Click "Unlock"
4. Observe error message
5. Try again with correct password
6. Verify unlock works

**Expected Results:**
- ✅ Error message displayed: "Incorrect password"
- ✅ Error is red/orange color (danger indication)
- ✅ Wallet remains locked
- ✅ Password field cleared or highlighted for retry
- ✅ Can retry with correct password
- ✅ No rate limiting on first few attempts
- ✅ Console shows NO sensitive data (no password logged)

**Security Validation:**
- Check console (F12) - password should NOT appear in logs
- Error message should be generic (not "wrong password character 3")

**Edge Case:**
Try empty password:
- Expected: Button disabled or error "Password required"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-003: Manual Lock Wallet

**Priority:** P0
**Time:** 2 minutes

**Purpose:** Verify user can manually lock wallet

**Steps:**
1. Unlock wallet
2. Navigate to dashboard
3. Look for Lock button (in sidebar or header)
4. Click Lock button
5. Observe wallet locks immediately

**Expected Results:**
- ✅ Lock button visible and accessible
- ✅ Lock icon (🔒) clearly indicates function
- ✅ Clicking lock immediately locks wallet
- ✅ Returns to unlock screen
- ✅ Dashboard data cleared from view
- ✅ Must re-enter password to access
- ✅ Transition smooth (no errors)

**Lock Button Location:**
- Where is lock button? _______________
- Icon used: 🔒 or other? _______________

**Console Verification:**
```
Expected console log:
[WALLET] Manual lock triggered
[WALLET] Wallet locked
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-004: Auto-Lock After 15 Minutes Inactivity

**Priority:** P1
**Time:** 20 minutes (can run in background)

**Purpose:** Verify wallet auto-locks after 15 minutes of inactivity

**Steps:**
1. Unlock wallet
2. Navigate to dashboard
3. Keep tab VISIBLE and ACTIVE
4. Do NOT interact with wallet (no mouse, no keyboard)
5. Wait 15 minutes
6. Observe wallet state after 15 minutes

**Expected Results:**
- ✅ After 15 minutes of inactivity, wallet auto-locks
- ✅ Unlock screen displayed
- ✅ Must re-enter password
- ✅ Console shows: "[AUTO-LOCK] Inactivity timer expired"
- ✅ Timing accurate (±30 seconds tolerance)

**Timing Measurement:**
- Start time: _____:_____
- Expected lock: _____:_____ (15 min later)
- Actual lock time: _____:_____
- Difference: _____ seconds

**Interaction Reset Test:**
1. Unlock wallet
2. Wait 10 minutes
3. Click anywhere in wallet (reset timer)
4. Wait another 10 minutes (total 20 min elapsed)

**Expected:** Wallet still unlocked (timer reset at 10 min mark)

**Note:** This test can run while you do other testing tasks

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-005: Auto-Lock When Tab Hidden (5 Minutes)

**Priority:** P1 (Security)
**Time:** 10 minutes (can run in background)

**Purpose:** Verify wallet auto-locks after 5 minutes when tab is hidden

**Steps:**
1. Unlock wallet
2. Navigate to dashboard
3. Open console (F12) and filter for "[VISIBILITY LOCK]"
4. Switch to different tab (wallet tab is now hidden)
5. Observe console log: "Timer started - will lock in 5 minutes"
6. Wait 5 minutes
7. Switch back to wallet tab
8. Observe wallet state

**Expected Results:**
- ✅ Console shows timer start when tab hidden
- ✅ After 5 minutes, wallet locks
- ✅ Unlock screen displayed when returning to tab
- ✅ Must re-enter password
- ✅ Console shows: "[VISIBILITY LOCK] Timer expired - locking wallet"

**Timer Reset Test:**
1. Unlock wallet
2. Hide tab (switch to different tab)
3. Wait 4 minutes
4. Return to wallet tab (tab visible again)
5. Observe console: "Timer cancelled - tab is visible"
6. Hide tab again
7. Wait 5 more minutes

**Expected:** Total 9 minutes needed (timer reset when tab became visible)

**Timing Measurement:**
- Tab hidden at: _____:_____
- Tab shown at: _____:_____ (should cancel timer)
- Tab hidden again at: _____:_____
- Expected lock at: _____:_____ (5 min from second hide)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-006: Password Visibility Toggle

**Priority:** P2
**Time:** 2 minutes

**Purpose:** Verify password can be shown/hidden during unlock

**Steps:**
1. Open wallet (locked state)
2. Enter password in password field
3. Observe password is masked (••••••)
4. Look for "Show/Hide" icon (👁️)
5. Click icon
6. Observe password becomes visible
7. Click icon again
8. Observe password masked again

**Expected Results:**
- ✅ Password masked by default (•••)
- ✅ Toggle icon visible (👁️)
- ✅ Clicking toggle shows password in plaintext
- ✅ Password field changes from type="password" to type="text"
- ✅ Clicking again hides password
- ✅ Icon changes to indicate state (open eye vs closed eye)

**Visual States:**
```
Hidden (default):
Password: [••••••••••] [👁️]

Visible (after click):
Password: [TestPassword123!] [👁️‍🗨️]
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-007: Session Persistence After Refresh

**Priority:** P0 (Security)
**Time:** 2 minutes

**Purpose:** Verify wallet does NOT stay unlocked after browser refresh

**Steps:**
1. Unlock wallet with correct password
2. Navigate to dashboard
3. Press F5 (refresh browser)
4. Observe wallet state after refresh

**Expected Results:**
- ✅ After refresh, wallet is LOCKED
- ✅ Shows unlock screen
- ✅ User must re-enter password
- ✅ Session token invalidated
- ✅ No sensitive data persists in memory

**Security Reasoning:**
Refresh should clear in-memory session for security. User must unlock again.

**Console Verification:**
```
Expected console output:
[SESSION] Page refreshed - invalidating session
[WALLET] Wallet locked
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-008: Lock on Extension Reload

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify wallet locks when extension is reloaded

**Steps:**
1. Unlock wallet
2. Navigate to dashboard
3. Go to chrome://extensions/
4. Find Bitcoin Wallet extension
5. Click "Reload" button (circular arrow)
6. Return to wallet tab
7. Observe wallet state

**Expected Results:**
- ✅ Wallet tab reloads
- ✅ Shows unlock screen
- ✅ Must re-enter password
- ✅ Data persists (wallet not lost)
- ✅ No corruption of stored data

**Data Persistence Check:**
After reloading and unlocking:
- Balance still correct: [ ] Yes [ ] No
- Account names unchanged: [ ] Yes [ ] No
- Transaction history intact: [ ] Yes [ ] No

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-009: Password Strength Indicator During Setup

**Priority:** P2
**Time:** 3 minutes

**Purpose:** Verify password strength indicator provides feedback

**Steps:**
1. Create new wallet (or observe during wallet setup)
2. Enter various passwords and observe strength indicator:
   - Test 1: "abc" → Very Weak
   - Test 2: "abcdefgh" → Weak
   - Test 3: "Abcdefgh1" → Moderate
   - Test 4: "Abcdefgh1!" → Strong
   - Test 5: "P@ssw0rd!2024Secure" → Very Strong

**Expected Results:**
- ✅ Strength indicator visible below password field
- ✅ Visual bar showing strength (color-coded)
- ✅ Text label: "Weak", "Moderate", "Strong", etc.
- ✅ Color coding:
  - Red: Weak
  - Orange: Moderate
  - Green: Strong
  - Dark Green: Very Strong
- ✅ Updates in real-time as user types

**Visual Example:**
```
Password: [••••••••••]
Strength: [========== ] Very Strong (green bar)

Password: [••••]
Strength: [==        ] Weak (red bar)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-010: Account Data Cleared on Lock

**Priority:** P0 (Security)
**Time:** 3 minutes

**Purpose:** Verify sensitive data is cleared when wallet locks

**Steps:**
1. Unlock wallet
2. Open console (F12)
3. Navigate to dashboard (load balance, transactions)
4. Manually lock wallet
5. Check console for data clearing logs
6. Check if balance still visible in UI

**Expected Results:**
- ✅ Locking wallet clears UI immediately
- ✅ Balance not visible after lock
- ✅ Account names not visible after lock
- ✅ Transaction history not visible
- ✅ Console shows: "[WALLET] Clearing sensitive data"
- ✅ No sensitive data remains in DOM

**Security Validation:**
After locking:
1. Open Chrome DevTools → Elements tab
2. Search for account balance in HTML
3. Search for transaction details
4. Verify: Should NOT find sensitive data

**Console Expected:**
```
[WALLET] Lock triggered
[WALLET] Clearing balance data
[WALLET] Clearing transaction history
[WALLET] Clearing account information
[WALLET] Wallet locked
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### AUTH-EDGE-01: Rapid Lock/Unlock Cycles

**Priority:** P2
**Time:** 3 minutes

**Steps:**
1. Unlock wallet
2. Immediately lock wallet
3. Immediately unlock wallet
4. Repeat 10 times rapidly
5. Observe wallet stability

**Expected:**
- ✅ No errors during rapid cycling
- ✅ Wallet responds correctly each time
- ✅ No memory leaks
- ✅ No UI glitches

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-EDGE-02: Multiple Failed Unlock Attempts

**Priority:** P1 (Security)
**Time:** 5 minutes

**Steps:**
1. Wallet is locked
2. Enter wrong password 5 times
3. Observe behavior

**Expected:**
- ✅ Error message shown each time
- ✅ Rate limiting may apply after multiple attempts
- ✅ No account lockout (user can retry indefinitely)
- ✅ OR: Account locks for 1-5 minutes after 5 failures

**Security Note:**
Document the actual behavior:
- Rate limiting implemented? [ ] Yes [ ] No
- Temporary lockout after ___ failed attempts
- Lockout duration: _____ minutes

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### AUTH-EDGE-03: Browser Close Without Lock

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Unlock wallet
2. Close browser completely (X button)
3. Reopen browser
4. Open extension
5. Observe wallet state

**Expected:**
- ✅ Wallet is locked
- ✅ Must re-enter password
- ✅ Session not persisted across browser closes

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Test Summary

**Total Tests:** 10 core + 3 edge cases = 13 tests
**P0 Tests:** 5 (AUTH-001, AUTH-002, AUTH-003, AUTH-007, AUTH-010)
**P1 Tests:** 3 (AUTH-004, AUTH-005, AUTH-008, AUTH-EDGE-02)
**P2 Tests:** 5 (AUTH-006, AUTH-009, AUTH-EDGE-01, AUTH-EDGE-03)

**Critical Security Tests:**
- AUTH-001: Correct password unlocks
- AUTH-002: Incorrect password rejected
- AUTH-007: Session cleared on refresh
- AUTH-010: Data cleared on lock
- AUTH-005: Auto-lock on hidden tab

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Wallet does not auto-lock after 15 minutes
**Cause:** Inactivity timer not working
**Solution:** Check timer implementation and reset logic
**Report As:** P0 bug (security issue)

### Issue: Password visible in console logs
**Cause:** Logging sensitive data
**Solution:** Remove password from all console.log statements
**Report As:** P0 critical security bug

### Issue: Wallet stays unlocked after refresh
**Cause:** Session persistence issue
**Solution:** Session should be invalidated on page load
**Report As:** P0 critical security bug

### Issue: Cannot unlock with correct password
**Cause:** Encryption key derivation mismatch
**Solution:** Check PBKDF2 implementation and parameters
**Report As:** P0 blocker bug

### Issue: Auto-lock timer doesn't reset on interaction
**Cause:** Event listeners not resetting timer
**Solution:** Verify mouse/keyboard events reset timer
**Report As:** P1 bug

---

## Timer Testing Tips

**Long-Running Tests:**
- AUTH-004 (15 min) and AUTH-005 (5 min) can run in background
- Set timer/alarm to check wallet at expected lock time
- Do other testing tasks while waiting
- Document exact timing for accuracy

**Console Monitoring:**
Filter console logs for:
- `[AUTO-LOCK]` - Inactivity timer logs
- `[VISIBILITY LOCK]` - Hidden tab timer logs
- `[WALLET]` - General wallet state logs
- `[SESSION]` - Session management logs

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
