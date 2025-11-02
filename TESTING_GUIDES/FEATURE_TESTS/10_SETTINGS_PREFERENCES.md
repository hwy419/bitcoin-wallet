# Feature Test Guide: Settings & Preferences

**Feature Area:** Settings, Preferences, & Account List
**Test Cases:** 8 tests
**Time to Execute:** 1 hour
**Priority:** P1 (Important UX)

---

## Overview

This feature validates the Settings screen, account management interface, preferences, and configuration options. Settings provide users with control over their wallet behavior and account organization.

**Why this matters:** Settings must be intuitive, persistent, and accurately reflect wallet state. Users rely on settings to manage accounts, view balances, and configure preferences.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Multiple accounts created (at least 3)
- [ ] Chrome DevTools open (F12) for all tests
- [ ] **Take screenshots of any UI issues found**

---

## Test Cases

### SET-001: Navigate to Settings Screen

**Priority:** P1
**Time:** 2 minutes

**Purpose:** Verify Settings screen is accessible

**Steps:**
1. Unlock wallet
2. Look for Settings navigation (sidebar or menu)
3. Click Settings (⚙️ icon or "Settings" link)
4. Observe Settings screen loads

**Expected Results:**
- ✅ Settings icon visible in sidebar/navigation
- ✅ Settings screen loads within 500ms
- ✅ Settings title displayed
- ✅ Multiple sections visible:
  - Account Management
  - Security
  - Preferences (if applicable)
  - About/Version
- ✅ Clean, organized layout
- ✅ No console errors

**Visual Layout:**
```
Settings
┌────────────────────────────────┐
│ Account Management             │
│ ───────────────────────        │
│ [Account List...]              │
│                                │
│ Security                       │
│ ───────────────────────        │
│ [Lock Wallet] [Change Pass...] │
│                                │
│ About                          │
│ ───────────────────────        │
│ Version: 0.10.0                │
└────────────────────────────────┘
```

**Screenshot Points:**
- Settings screen overview

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-002: Account List Display

**Priority:** P0
**Time:** 5 minutes

**Prerequisites:** Have 3+ accounts (HD, imported key, imported seed, multisig)

**Purpose:** Verify account list displays all accounts correctly

**Steps:**
1. Navigate to Settings → Account Management
2. Observe account list
3. Verify all accounts shown
4. Check account details displayed

**Expected Results:**
- ✅ All accounts listed
- ✅ Each account shows:
  - Account name
  - Balance (BTC)
  - Address type badge (Native SegWit, SegWit, Legacy)
  - Account type badge (HD, Imported, Multisig)
- ✅ Current account highlighted or marked
- ✅ Accounts ordered (e.g., creation order or alphabetical)
- ✅ Account avatars/icons visible

**Account List Example:**
```
Account Management
┌─────────────────────────────────────┐
│ ✓ Account 1                         │ ← Current
│   0.05234567 BTC                    │
│   [HD] [Native SegWit]              │
├─────────────────────────────────────┤
│   Savings                           │
│   0.001 BTC                         │
│   [HD] [SegWit]                     │
├─────────────────────────────────────┤
│   Imported Key                      │
│   0.0001 BTC                        │
│   [Imported 🔑] [Native SegWit]     │
├─────────────────────────────────────┤
│   Business                          │
│   0.01 BTC                          │
│   [🔐 2-of-3] [P2WSH]               │
└─────────────────────────────────────┘
```

**Screenshot Points:**
- Complete account list with all types

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-003: Account Actions - Rename

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify account can be renamed

**Steps:**
1. In account list, find account to rename
2. Look for "Rename" button, edit icon (✏️), or click account name
3. Click rename option
4. Change name from "Account 1" to "Test Account"
5. Save changes
6. Observe updated name

**Expected Results:**
- ✅ Rename option accessible (button, icon, or inline edit)
- ✅ Modal or inline edit field opens
- ✅ Current name pre-filled
- ✅ Can edit name
- ✅ Validation:
  - Empty name rejected
  - Very long name truncated or rejected
- ✅ Name saves successfully
- ✅ Updated name shows in:
  - Settings account list
  - Account switcher
  - Dashboard
- ✅ Name persists after lock/unlock

**Screenshot Points:**
- Rename interface
- Updated account name

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-004: Account Actions - View Details

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify account details can be viewed

**Steps:**
1. Click on an account in the list
2. OR: Click "View Details" button
3. Observe account detail view

**Expected Results:**
- ✅ Detail view opens (modal or expanded section)
- ✅ Shows account information:
  - Account name
  - Account type (HD, Imported, Multisig)
  - Address type (Native SegWit, SegWit, Legacy)
  - Balance (BTC and USD if enabled)
  - First receiving address
  - Derivation path (for HD accounts)
  - Fingerprint (for HD accounts)
- ✅ Action buttons:
  - Rename
  - Export (xpub for HD, private key for imported)
  - View on dashboard
- ✅ For multisig: Shows co-signer information
- ✅ Can close detail view

**Screenshot Points:**
- Account detail view

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-005: Export Options Per Account Type

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify export options are appropriate for each account type

**Test 1: HD Account - Export Xpub**
**Steps:**
1. View HD account details
2. Look for "Export" button
3. Click export options
4. Observe available options

**Expected:**
- ✅ "Export Extended Public Key (xpub)" option
- ✅ Warning: "Safe to share - cannot spend funds"
- ✅ Password NOT required for xpub export
- ✅ Can copy xpub
- ✅ Can view QR code

**Test 2: Imported Private Key Account - Export Private Key**
**Steps:**
1. View imported key account details
2. Click "Export Private Key"

**Expected:**
- ✅ "Export Private Key (WIF)" option
- ✅ ⚠️ WARNING: "This reveals your private key - anyone with this can steal funds"
- ✅ Password REQUIRED for export
- ✅ Can copy WIF private key
- ✅ Can view QR code

**Test 3: Multisig Account - Export Xpub**
**Steps:**
1. View multisig account details
2. Export options

**Expected:**
- ✅ "Export Your Xpub" (for this co-signer)
- ✅ Cannot export private key (multisig policy)
- ✅ Can view all co-signer xpubs

**Screenshot Points:**
- Export options for each account type
- Security warnings

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-006: Security Settings - Lock Wallet

**Priority:** P1
**Time:** 2 minutes

**Purpose:** Verify manual lock from Settings

**Steps:**
1. Navigate to Settings → Security section
2. Find "Lock Wallet" button
3. Click "Lock Wallet"
4. Observe wallet locks

**Expected Results:**
- ✅ "Lock Wallet" button visible
- ✅ Clicking immediately locks wallet
- ✅ Returns to unlock screen
- ✅ Must re-enter password
- ✅ Same behavior as lock button in sidebar

**Screenshot Points:**
- Lock wallet button

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-007: About Section - Version Information

**Priority:** P2
**Time:** 2 minutes

**Purpose:** Verify version and about information displayed

**Steps:**
1. Navigate to Settings → About section
2. Observe version information

**Expected Results:**
- ✅ "About" or "Version" section visible
- ✅ Extension version displayed: "v0.10.0"
- ✅ Optional information:
  - Build number
  - Last updated date
  - License information
  - GitHub repository link
  - Support/Help link
- ✅ Links functional (open in new tab)

**Version Display Example:**
```
About Bitcoin Wallet
────────────────────
Version: 0.10.0
Build: 2025.10.29
Network: Bitcoin Testnet

[View on GitHub]
[Report Bug]
[Documentation]
```

**Screenshot Points:**
- About/Version section

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-008: Settings Persistence Across Sessions

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify settings persist after lock/unlock and browser restart

**Steps:**
1. Make settings changes:
   - Rename an account to "Persistence Test"
   - Note current settings state
2. Lock wallet
3. Unlock wallet
4. Verify account name persisted
5. Close browser completely
6. Reopen browser and wallet
7. Unlock wallet
8. Verify account name still "Persistence Test"

**Expected Results:**
- ✅ Account names persist after lock/unlock
- ✅ Account names persist after browser restart
- ✅ Preferences persist (if any)
- ✅ No data loss
- ✅ No corruption

**Persistence Checklist:**
```
After Lock/Unlock:
- Account name: [ ] Persisted [ ] Lost
- Account balances: [ ] Persisted [ ] Lost
- Account order: [ ] Persisted [ ] Lost

After Browser Restart:
- Account name: [ ] Persisted [ ] Lost
- Account balances: [ ] Persisted [ ] Lost
- Account order: [ ] Persisted [ ] Lost
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Edge Case Tests

### SET-EDGE-01: Maximum Account Name Length

**Priority:** P2
**Time:** 3 minutes

**Steps:**
1. Try to rename account with very long name (200 characters)
2. Observe behavior

**Expected:**
- ✅ Name truncated to maximum length (e.g., 50 chars)
- ✅ Error message if too long
- ✅ UI doesn't break with long name

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-EDGE-02: Special Characters in Account Name

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Rename account with special characters: "Test!@#$%^&*()"
2. Save

**Expected:**
- ✅ Special characters accepted
- ✅ OR: Sanitized to alphanumeric
- ✅ No XSS vulnerability

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SET-EDGE-03: Settings Screen with No Accounts

**Priority:** P2
**Time:** 2 minutes (if testable)

**Steps:**
1. Hypothetical: If all accounts deleted
2. Navigate to Settings

**Expected:**
- ✅ Settings loads without errors
- ✅ Empty state message: "No accounts"
- ✅ "Create Account" button visible

**Note:** May not be testable (cannot delete all accounts). Document expected behavior.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐) OR [ ] N/A

---

## Test Summary

**Total Tests:** 8 core + 3 edge cases = 11 tests
**P0 Tests:** 1 (SET-002)
**P1 Tests:** 6 (SET-001, SET-003, SET-004, SET-005, SET-006, SET-008)
**P2 Tests:** 4 (SET-007, SET-EDGE-01, SET-EDGE-02, SET-EDGE-03)

**Critical Tests:**
- SET-002: Account list display
- SET-005: Export options per account type
- SET-008: Settings persistence

**If any P0 test fails:** STOP, report as blocker bug

---

## Common Issues & Troubleshooting

### Issue: Account list doesn't show all accounts
**Cause:** Rendering bug or data sync issue
**Solution:** Check account loading logic
**Report As:** P0 bug

### Issue: Renamed account reverts after lock
**Cause:** Settings not persisting to storage
**Solution:** Verify chrome.storage.local.set() calls
**Report As:** P1 bug

### Issue: Export button missing or broken
**Cause:** UI rendering or permission issue
**Solution:** Check component implementation
**Report As:** P1 bug

### Issue: Settings screen slow to load
**Cause:** Performance issue loading many accounts
**Solution:** Implement virtualization or pagination
**Report As:** P2 bug

---

## Filing Bug Reports for Settings Issues

**When you find a bug in Settings:**

1. **Take Screenshots:**
   - Settings screen showing issue
   - Account list with problem
   - Error messages

2. **Gather Information:**
   - Test case number (e.g., SET-003)
   - Exact steps
   - Expected vs actual behavior
   - Number of accounts in wallet
   - Account types involved

3. **File GitHub Issue:**
   - Go to: https://github.com/[REPOSITORY]/issues
   - Title: "[Settings] Brief description (Test SET-XXX)"
   - Include screenshots
   - Describe impact on user

**Example Bug Report:**
```
Title: [Settings] Renamed account reverts to original name after lock (Test SET-008)

Priority: P1
Test Case: SET-008

Description:
When renaming an account in Settings, the new name is lost after locking and unlocking the wallet.

Steps to Reproduce:
1. Navigate to Settings → Account Management
2. Rename "Account 1" to "Persistence Test"
3. Lock wallet
4. Unlock wallet
5. Check account name in Settings

Expected Behavior:
- Account name should remain "Persistence Test"

Actual Behavior:
- Account name reverts to "Account 1"

Screenshot: [attached - showing reverted name]

Impact:
- Users cannot customize account names
- Poor UX, confusing for users with multiple accounts

Environment:
- Extension version: 0.10.0
- Browser: Chrome 120
- Number of accounts: 5
```

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
