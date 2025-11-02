# Feature Test Guide: Wallet Setup

**Feature Area:** Wallet Setup & Import
**Test Cases:** 15 tests
**Time to Execute:** 2-2.5 hours
**Priority:** P0 (Critical - Core Functionality)

---

## Overview

This feature validates wallet creation and import workflows, including seed phrase generation, password setup, seed phrase confirmation, and wallet import from existing seed phrases. The wallet setup is the first critical user experience and must be rock-solid.

**Why this matters:** Wallet setup is where users create or import their Bitcoin wallets. Errors here can lead to lost funds, poor UX, or security vulnerabilities.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Fresh browser session (clear extension storage between tests)
- [ ] No existing wallet (or ability to clear wallet data)
- [ ] Test seed phrases prepared (valid 12-word BIP39 phrases)
- [ ] BIP39 tool available: https://iancoleman.io/bip39/

---

## Test Cases

### WS-001: Wallet Setup Flow - First Launch

**Priority:** P0
**Time:** 3 minutes

**Purpose:** Verify wallet setup flow displays correctly on first launch

**Steps:**
1. Install extension fresh (no existing wallet data)
2. Click extension icon in Chrome toolbar
3. Observe initial screen

**Expected Results:**
- ✅ Tab opens (not popup)
- ✅ Wallet setup screen displayed
- ✅ Two tabs visible: "Create New Wallet" and "Import Existing Wallet"
- ✅ "Create New Wallet" tab active by default
- ✅ Clean, clear UI with no errors
- ✅ Bitcoin logo and branding visible
- ✅ No console errors (F12)

**Visual Checkpoints:**
- [ ] Logo at top center
- [ ] Tab switcher with orange active state
- [ ] Instructions clear and readable
- [ ] Dark theme applied (gray-900 background)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-002: Create Wallet - Password Requirements

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify password validation enforces security requirements

**Steps:**
1. Open wallet setup → "Create New Wallet" tab
2. Select "Native SegWit (Recommended)" address type
3. Test various passwords:
   - Test 1: Enter "abc" → Too short
   - Test 2: Enter "abcdefgh" → No number, no special char
   - Test 3: Enter "abcdefgh1" → No special char
   - Test 4: Enter "Abcd123!" → Valid, meets requirements
4. Enter valid password: "TestPassword123!"
5. Confirm password: "TestPassword123!"
6. Observe validation feedback

**Expected Results:**
- ✅ Password must be 8+ characters
- ✅ Password must contain uppercase letter
- ✅ Password must contain lowercase letter
- ✅ Password must contain number
- ✅ Password must contain special character
- ✅ Real-time validation feedback shown
- ✅ Clear error messages for invalid passwords
- ✅ Confirm password must match
- ✅ Mismatch error displayed if passwords don't match
- ✅ "Create Wallet" button disabled until valid

**Visual Checkpoints:**
```
Password Requirements (shown below password field):
✓ At least 8 characters
✓ Uppercase letter
✓ Lowercase letter
✓ Number
✓ Special character (!@#$%^&*)

Confirm Password:
✓ Matches password above
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-003: Create Wallet - Native SegWit (Recommended)

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify wallet creation with Native SegWit address type

**Steps:**
1. Open wallet setup → "Create New Wallet"
2. Verify "Native SegWit (tb1...)" is selected by default
3. Observe "Recommended" badge
4. Enter password: "TestPassword123!"
5. Confirm password: "TestPassword123!"
6. Click "Create Wallet"
7. Observe seed phrase screen

**Expected Results:**
- ✅ Native SegWit selected by default
- ✅ "Recommended" badge visible
- ✅ Description explains lowest fees
- ✅ Seed phrase displayed (12 words)
- ✅ Words are valid BIP39 words
- ✅ Words numbered 1-12
- ✅ Security warning: "Write this down on paper"
- ✅ Warning: "Never share with anyone"
- ✅ Warning: "Store in secure location"
- ✅ Checkbox: "I have written down my seed phrase"
- ✅ "Continue" button disabled until checkbox checked

**Seed Phrase Validation:**
1. Copy seed phrase (write down on paper for testing)
2. Verify each word is a valid BIP39 word
3. Use BIP39 tool (https://iancoleman.io/bip39/) to verify:
   - Paste seed phrase
   - Select BIP39 mnemonic
   - Select "Bitcoin Testnet"
   - Verify derivation path: m/84'/1'/0'/0/0
   - Note first address (should start with "tb1")

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-004: Seed Phrase Confirmation Flow

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify seed phrase confirmation before wallet creation

**Steps:**
1. After viewing seed phrase, check "I have written down my seed phrase"
2. Click "Continue"
3. Observe confirmation screen
4. Note which words are requested (e.g., "Word #3", "Word #7", "Word #11")
5. Enter correct words from your written copy
6. Click "Confirm"
7. Observe wallet creation completion

**Expected Results:**
- ✅ Confirmation screen asks for 3 random words
- ✅ Word numbers displayed (e.g., "Word #3")
- ✅ Input fields accept text
- ✅ Can submit after all 3 words entered
- ✅ Correct words accepted
- ✅ Incorrect words rejected with error
- ✅ Wallet created successfully after confirmation
- ✅ Dashboard displayed
- ✅ Account 1 visible
- ✅ Balance shows 0.00000000 BTC

**Edge Case Test:**
1. Intentionally enter WRONG word
2. Click "Confirm"
3. Expected: Error message "Incorrect seed phrase. Please try again."
4. Can retry with correct words

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-005: Create Wallet - SegWit (P2SH-P2WPKH)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify wallet creation with SegWit (wrapped) address type

**Steps:**
1. Clear extension data (reset to fresh state)
2. Open wallet setup → "Create New Wallet"
3. Click on "SegWit (2...)" option
4. Observe description and badge
5. Enter password: "TestPassword123!"
6. Confirm password: "TestPassword123!"
7. Click "Create Wallet"
8. Complete seed phrase backup and confirmation
9. Verify dashboard and first address

**Expected Results:**
- ✅ SegWit option selectable
- ✅ Description: "Wrapped SegWit, good compatibility"
- ✅ Fee estimate: "Medium fees"
- ✅ Wallet created successfully
- ✅ First address starts with "2" (testnet SegWit)
- ✅ Derivation path: m/49'/1'/0'/0/0 (verify with BIP39 tool)

**BIP39 Tool Verification:**
1. Paste seed phrase into https://iancoleman.io/bip39/
2. Select "BIP49" tab
3. Coin: Bitcoin Testnet
4. First address should match wallet's displayed address
5. Both start with "2"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-006: Create Wallet - Legacy (P2PKH)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify wallet creation with Legacy address type

**Steps:**
1. Clear extension data (reset to fresh state)
2. Open wallet setup → "Create New Wallet"
3. Click on "Legacy (m/n...)" option
4. Observe description and badge
5. Note warning about higher fees
6. Enter password: "TestPassword123!"
7. Confirm password: "TestPassword123!"
8. Click "Create Wallet"
9. Complete seed phrase backup and confirmation
10. Verify dashboard and first address

**Expected Results:**
- ✅ Legacy option selectable
- ✅ Description: "Original Bitcoin addresses"
- ✅ Warning badge: "Highest fees"
- ✅ Fee estimate explanation visible
- ✅ Wallet created successfully
- ✅ First address starts with "m" or "n" (testnet Legacy)
- ✅ Derivation path: m/44'/1'/0'/0/0 (verify with BIP39 tool)

**BIP39 Tool Verification:**
1. Paste seed phrase into https://iancoleman.io/bip39/
2. Select "BIP44" tab
3. Coin: Bitcoin Testnet
4. First address should match wallet's displayed address
5. Both start with "m" or "n"

**Visual Note:**
Legacy addresses are longer (~34 characters) vs Native SegWit (~42 characters)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-007: Import Wallet - Valid 12-Word Seed

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify wallet import from existing seed phrase

**Preparation:**
Use a known test seed phrase (TESTNET ONLY - DO NOT USE REAL FUNDS):
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

**Steps:**
1. Clear extension data (reset to fresh state)
2. Open wallet setup → "Import Existing Wallet" tab
3. Observe import form
4. Paste test seed phrase into text area
5. Select "Native SegWit" address type
6. Enter password: "TestPassword123!"
7. Confirm password: "TestPassword123!"
8. Click "Import Wallet"
9. Observe wallet creation

**Expected Results:**
- ✅ Import tab displays correctly
- ✅ Text area accepts 12 words
- ✅ Address type selector present
- ✅ Password requirements same as create flow
- ✅ Wallet imported successfully
- ✅ Dashboard displayed
- ✅ Account 1 visible
- ✅ First address matches expected (verify with BIP39 tool)

**BIP39 Tool Verification:**
1. Open https://iancoleman.io/bip39/
2. Paste: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
3. Select BIP84 (Native SegWit)
4. Coin: Bitcoin Testnet
5. First address: tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7
6. Verify wallet shows SAME address

**Security Check:**
- Console logs should NOT display seed phrase
- Seed phrase should be encrypted in storage immediately

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-008: Import Wallet - Invalid Seed Phrase Rejection

**Priority:** P0
**Time:** 8 minutes

**Purpose:** Verify wallet rejects invalid seed phrases

**Test 1: Invalid Word**
**Steps:**
1. Open wallet setup → "Import Existing Wallet"
2. Enter seed with invalid word:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invalid
   ```
3. Click "Import Wallet"

**Expected Results:**
- ✅ Error displayed: "Invalid seed phrase"
- ✅ Specific error: "Word 'invalid' is not in BIP39 word list"
- ✅ Wallet NOT created
- ✅ User can correct and retry

**Test 2: Wrong Word Count**
**Steps:**
1. Enter only 11 words:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon
   ```
2. Click "Import Wallet"

**Expected Results:**
- ✅ Error: "Seed phrase must be 12 words"
- ✅ Wallet NOT created

**Test 3: Invalid Checksum**
**Steps:**
1. Enter 12 valid words but wrong checksum:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon
   ```
2. Click "Import Wallet"

**Expected Results:**
- ✅ Error: "Invalid seed phrase checksum"
- ✅ Explanation that seed phrase is corrupted or incorrect
- ✅ Wallet NOT created

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-009: Address Type Selection - Visual Validation

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify address type selector UI and descriptions

**Steps:**
1. Open wallet setup → "Create New Wallet"
2. Observe address type options
3. Click each option and review descriptions
4. Verify recommended badge placement
5. Check fee estimates shown

**Expected Results:**

**Native SegWit (tb1...):**
- ✅ "Recommended" badge visible (green)
- ✅ Description: "Lowest fees, modern format"
- ✅ Prefix: "tb1..." shown
- ✅ Selected by default

**SegWit (2...):**
- ✅ Description: "Wrapped SegWit, good compatibility"
- ✅ Fee estimate: "Medium fees"
- ✅ Prefix: "2..." shown
- ✅ No "Recommended" badge

**Legacy (m/n...):**
- ✅ Description: "Original Bitcoin addresses"
- ✅ Warning badge: "Highest fees" (amber/orange)
- ✅ Prefix: "m/n..." shown
- ✅ Visual warning about compatibility

**Visual Validation:**
```
Address Type Selection:

◉ Native SegWit (tb1...) [Recommended]
  Lowest fees, modern format
  Ideal for most users

○ SegWit (2...)
  Wrapped SegWit, good compatibility
  Medium fees

○ Legacy (m/n...)
  Original Bitcoin addresses
  ⚠️ Highest fees - only use if required
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-010: Seed Phrase Security Warnings

**Priority:** P0 (Security)
**Time:** 3 minutes

**Purpose:** Verify security warnings are prominent and clear

**Steps:**
1. Create new wallet
2. Reach seed phrase display screen
3. Observe all security warnings
4. Verify visual hierarchy and emphasis

**Expected Results:**
- ✅ Large warning icon (⚠️) visible
- ✅ Warning: "Write this down on paper - DO NOT take screenshot"
- ✅ Warning: "Never share with anyone"
- ✅ Warning: "Anyone with this phrase can access your funds"
- ✅ Warning: "Store in a secure, offline location"
- ✅ Warnings use high-contrast colors (orange/red for danger)
- ✅ Checkbox required: "I have written down my seed phrase"
- ✅ Cannot continue without checking box

**Visual Hierarchy:**
```
⚠️ IMPORTANT - WRITE THIS DOWN

Your 12-Word Seed Phrase
[12 words displayed]

🔒 Security Warnings:
• Write this on paper - DO NOT screenshot
• Never share with anyone - not even support
• Anyone with these words can steal your Bitcoin
• Store in a secure, offline location

☐ I have written down my seed phrase and understand
  that I cannot recover my wallet without it

[Continue] (disabled until checkbox checked)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-011: Password Visibility Toggle

**Priority:** P2
**Time:** 2 minutes

**Purpose:** Verify password visibility toggle works

**Steps:**
1. Open wallet setup → "Create New Wallet"
2. Enter password in password field
3. Observe password is masked (••••••)
4. Look for "Show/Hide" toggle icon (👁️)
5. Click toggle
6. Observe password becomes visible
7. Click toggle again
8. Observe password masked again

**Expected Results:**
- ✅ Password masked by default (•••)
- ✅ Toggle icon visible (👁️ or similar)
- ✅ Clicking toggle shows password in plaintext
- ✅ Clicking again hides password
- ✅ Toggle works on both password and confirm password fields
- ✅ Icon changes to indicate state (👁️ vs 👁️‍🗨️)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-012: Back Navigation During Setup

**Priority:** P2
**Time:** 3 minutes

**Purpose:** Verify user can go back during setup without losing progress

**Steps:**
1. Create new wallet
2. Complete password entry
3. Click "Create Wallet"
4. View seed phrase
5. Look for "Back" or "Cancel" button
6. Click back button
7. Observe return to password screen
8. Verify password fields are cleared for security

**Expected Results:**
- ✅ Back/Cancel button visible
- ✅ Clicking back returns to previous screen
- ✅ Password fields cleared when going back
- ✅ Can restart wallet creation process
- ✅ No errors when navigating back
- ✅ Seed phrase not stored if user goes back

**Security Note:**
If user goes back after viewing seed phrase, the seed should NOT be used (new seed generated on next attempt)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-013: Wallet Setup Performance

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify wallet creation is performant

**Steps:**
1. Open wallet setup
2. Complete password entry
3. Click "Create Wallet"
4. Measure time to seed phrase display
5. Complete seed phrase backup
6. Measure time to dashboard display

**Expected Results:**
- ✅ Seed phrase generation: < 1 second
- ✅ Seed phrase encryption: < 500ms
- ✅ Wallet creation total: < 3 seconds
- ✅ Dashboard load: < 1 second
- ✅ No UI freezing or lag
- ✅ Smooth transitions between screens

**Performance Measurements:**
- Seed generation time: _____ ms (measure in console if possible)
- Encryption time: _____ ms
- Total setup time: _____ seconds

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### WS-EDGE-01: Browser Refresh During Setup

**Priority:** P2
**Time:** 3 minutes

**Steps:**
1. Start wallet creation
2. Enter password
3. Click "Create Wallet"
4. Seed phrase displayed
5. Press F5 (refresh browser)
6. Observe wallet state

**Expected:**
- ✅ Wallet NOT created (setup incomplete)
- ✅ Returns to wallet setup screen
- ✅ No partial wallet data stored
- ✅ User must start over

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-EDGE-02: Empty Password Submission

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Open wallet setup
2. Leave password fields empty
3. Attempt to click "Create Wallet"

**Expected:**
- ✅ Button disabled (cannot click)
- ✅ Validation error shown
- ✅ Clear message: "Password required"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### WS-EDGE-03: Seed Phrase Copy Protection

**Priority:** P1 (Security)
**Time:** 3 minutes

**Steps:**
1. Create new wallet
2. View seed phrase
3. Attempt to select seed phrase text with mouse
4. Attempt to right-click → Copy
5. Try Ctrl+C keyboard shortcut

**Expected:**
- ✅ Seed phrase NOT selectable with mouse
- ✅ Right-click disabled or shows no copy option
- ✅ Ctrl+C does not copy seed phrase
- ✅ User must manually write down (cannot copy/paste)

**Alternative Implementation:**
Some wallets allow copy but show warning. Verify expected behavior matches design spec.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Test Summary

**Total Tests:** 15
**P0 Tests:** 8 (WS-001, WS-002, WS-003, WS-004, WS-007, WS-008, WS-010)
**P1 Tests:** 4 (WS-005, WS-006, WS-009, WS-EDGE-03)
**P2 Tests:** 3 (WS-011, WS-012, WS-013, WS-EDGE-01, WS-EDGE-02)

**Critical Tests:**
- WS-002: Password validation (security)
- WS-003: Native SegWit wallet creation (most common path)
- WS-004: Seed phrase confirmation (fund protection)
- WS-007: Import wallet (recovery)
- WS-008: Invalid seed rejection (security)
- WS-010: Security warnings (user education)

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Seed phrase words not in BIP39 list
**Cause:** Random word generation instead of BIP39 standard
**Solution:** Verify `bip39` library is used correctly
**Report As:** P0 bug

### Issue: Imported wallet shows different address than BIP39 tool
**Cause:** Wrong derivation path or address type mismatch
**Solution:** Check derivation path matches address type
**Report As:** P0 bug

### Issue: Password validation not enforcing requirements
**Cause:** Validation regex or logic error
**Solution:** Review password validation code
**Report As:** P0 bug

### Issue: Cannot go back during setup
**Cause:** Navigation not implemented
**Solution:** Verify back button exists and works
**Report As:** P1 bug (UX issue)

---

## BIP39 Test Seed Phrases

**For Testing Only (TESTNET ONLY):**

```
12-word (most common):
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about

24-word (some wallets use):
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art
```

**NEVER use these seeds with real funds. TESTNET ONLY.**

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
