# Feature Test Guide: Account Management

**Feature Area:** Account Management (Create, Import, Switch)
**Test Cases:** 18 tests
**Time to Execute:** 2-3 hours
**Priority:** P0-P1 (Core Functionality)

---

## Overview

This feature validates account creation, private key import, seed phrase import, account switching, and account management UI. The wallet supports multiple accounts within a single wallet, similar to MetaMask.

**Why this matters:** Multi-account functionality allows users to organize their Bitcoin holdings, separate funds for different purposes, and import accounts from other wallets.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Test private keys prepared (WIF format, testnet only)
- [ ] Test seed phrases prepared (12-word BIP39)
- [ ] Access to Settings screen

---

## Test Cases

### ACC-001: Create New Account - Native SegWit

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify user can create additional accounts

**Steps:**
1. Unlock wallet (existing wallet with Account 1)
2. Navigate to Settings
3. Find account management section
4. Click "Create Account" or "+" button
5. Enter account name: "Savings Account"
6. Select "Native SegWit" address type
7. Click "Create"
8. Observe new account creation

**Expected Results:**
- ✅ "Create Account" button visible and functional
- ✅ Modal/form opens for account creation
- ✅ Account name field accepts input
- ✅ Address type selector available
- ✅ Native SegWit selected by default
- ✅ Account created successfully
- ✅ New account appears in account list
- ✅ Account shows name "Savings Account"
- ✅ Balance shows 0.00000000 BTC
- ✅ First address starts with "tb1"

**Derivation Path Verification:**
- Account 1: m/84'/1'/0'/0/0
- Account 2: m/84'/1'/1'/0/0
- Account index increments correctly

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-002: Switch Between Accounts

**Priority:** P0
**Time:** 3 minutes

**Prerequisites:** At least 2 accounts exist

**Steps:**
1. Wallet unlocked, viewing Account 1
2. Locate account switcher (sidebar or dropdown)
3. Click account switcher
4. Observe dropdown menu with all accounts
5. Click "Savings Account" (Account 2)
6. Observe switch to Account 2
7. Switch back to Account 1

**Expected Results:**
- ✅ Account switcher shows current account
- ✅ Dropdown displays all accounts
- ✅ Current account has checkmark (✓)
- ✅ Each account shows:
  - Account name
  - Balance
  - Address type badge
- ✅ Clicking account switches immediately
- ✅ Dashboard updates with selected account data
- ✅ Receive address updates
- ✅ Transaction history updates
- ✅ No errors during switch

**Visual Verification:**
```
Account Switcher:
┌─────────────────────┐
│ ✓ Account 1         │ ← Selected
│   0.05234567 BTC    │
│   [Native SegWit]   │
├─────────────────────┤
│   Savings Account   │
│   0.00000000 BTC    │
│   [Native SegWit]   │
└─────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-003: Rename Account

**Priority:** P1
**Time:** 3 minutes

**Steps:**
1. Navigate to Settings → Account Management
2. Find account in list
3. Click "Rename" or edit icon
4. Change name from "Savings Account" to "Business Account"
5. Save changes
6. Observe updated name

**Expected Results:**
- ✅ Rename option available
- ✅ Modal/inline edit opens
- ✅ Current name pre-filled
- ✅ Can edit and save
- ✅ Name updates immediately
- ✅ New name shows in account switcher
- ✅ New name shows in settings
- ✅ Name persists after lock/unlock

**Name Validation:**
- Empty name: Should reject
- Very long name (100+ chars): Should truncate or reject
- Special characters: Should accept

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-004: Create Account with Different Address Types

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify all 3 address types can be created

**Test 1: SegWit Account**
**Steps:**
1. Create new account
2. Name: "SegWit Account"
3. Select "SegWit (2...)" address type
4. Create account

**Expected:**
- ✅ Account created
- ✅ First address starts with "2"
- ✅ Derivation path: m/49'/1'/X'/0/0

**Test 2: Legacy Account**
**Steps:**
1. Create new account
2. Name: "Legacy Account"
3. Select "Legacy (m/n...)" address type
4. Create account

**Expected:**
- ✅ Account created
- ✅ First address starts with "m" or "n"
- ✅ Derivation path: m/44'/1'/X'/0/0

**Test 3: Native SegWit Account**
**Steps:**
1. Create new account
2. Name: "Native SegWit Account"
3. Select "Native SegWit (tb1...)" address type
4. Create account

**Expected:**
- ✅ Account created
- ✅ First address starts with "tb1"
- ✅ Derivation path: m/84'/1'/X'/0/0

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-005: Account Limit Enforcement

**Priority:** P1
**Time:** 10 minutes (if testing limit)

**Purpose:** Verify wallet enforces maximum account limit

**Steps:**
1. Create accounts until limit reached (likely 100 accounts)
2. Attempt to create one more account
3. Observe behavior

**Expected Results:**
- ✅ Wallet allows creation up to limit (e.g., 100 accounts)
- ✅ Attempting to exceed limit shows error
- ✅ Error message: "Maximum number of accounts reached (100)"
- ✅ "Create Account" button disabled when at limit
- ✅ Existing accounts still functional

**Note:** Creating 100 accounts is time-consuming. You may test up to 10-20 accounts and verify the limit logic exists in code/UI.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-006: Import Private Key - Valid WIF (Compressed)

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify private key import functionality

**Preparation:**
Use a test private key (WIF format, testnet, compressed):
```
cU8Q2jGeX3GNKNa5etiC8mgEgFSeVUTRQfWE2ZCzszyqYNK4Mepy
```

**Corresponding address (P2WPKH, Native SegWit):**
```
tb1qfuv9a3p7kk8r7zqxzz2ykzxxzzywvq6rchh8dg
```

**Steps:**
1. Navigate to Settings → Account Management
2. Click "Import Account" or "Import Private Key"
3. Select import method: "Private Key (WIF)"
4. Paste private key: cU8Q2jGeX3GNKNa5etiC8mgEgFSeVUTRQfWE2ZCzszyqYNK4Mepy
5. Enter account name: "Imported Account"
6. Click "Import"
7. Observe import success

**Expected Results:**
- ✅ Import option visible
- ✅ WIF private key accepted
- ✅ Network validation: Testnet key accepted
- ✅ Mainnet key rejected (if tested)
- ✅ Account created successfully
- ✅ Account name: "Imported Account"
- ✅ Badge shows "Imported" or "Private Key"
- ✅ Address matches expected: tb1qfuv9a3p7kk8r7zqxzz2ykzxxzzywvq6rchh8dg
- ✅ Can receive Bitcoin to this address
- ✅ Can spend from this account

**Security Validation:**
- Console should NOT log private key
- Private key encrypted in storage

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-007: Import Private Key - Invalid Format Rejection

**Priority:** P0
**Time:** 8 minutes

**Purpose:** Verify wallet rejects invalid private keys

**Test 1: Invalid WIF Format**
**Steps:**
1. Attempt to import: "ThisIsNotAValidPrivateKey123"
2. Click "Import"

**Expected:**
- ✅ Error: "Invalid private key format"
- ✅ Import rejected

**Test 2: Mainnet Private Key (should reject on testnet)**
**Steps:**
1. Attempt to import mainnet private key:
   ```
   L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ
   ```
2. Click "Import"

**Expected:**
- ✅ Error: "Invalid network - this key is for mainnet"
- ✅ Import rejected

**Test 3: Empty Input**
**Steps:**
1. Leave private key field empty
2. Click "Import"

**Expected:**
- ✅ Button disabled or error: "Private key required"

**Test 4: Public Key Instead of Private**
**Steps:**
1. Attempt to import public key (if distinguishable)
2. Expected: Error message

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-008: Import Seed Phrase - Valid 12-Word

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify seed phrase import as new account

**Preparation:**
Use test seed phrase:
```
abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

**Steps:**
1. Navigate to Settings → Account Management
2. Click "Import Account" → "Seed Phrase"
3. Paste seed phrase
4. Select address type: "Native SegWit"
5. Enter account name: "Imported Seed Account"
6. Click "Import"
7. Observe import success

**Expected Results:**
- ✅ Seed phrase import option available
- ✅ 12-word phrase accepted
- ✅ Valid BIP39 words validated
- ✅ Checksum validation passes
- ✅ Account created successfully
- ✅ Badge shows "Imported" or "Seed Phrase"
- ✅ First address matches BIP39 tool derivation
- ✅ Can generate additional addresses
- ✅ Can receive and send Bitcoin

**BIP39 Tool Verification:**
1. Open https://iancoleman.io/bip39/
2. Paste seed phrase
3. Select BIP84 (Native SegWit)
4. Coin: Bitcoin Testnet
5. First address: tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7
6. Verify wallet shows SAME address

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-009: Import Seed Phrase - Invalid Rejection

**Priority:** P0
**Time:** 8 minutes

**Purpose:** Verify wallet rejects invalid seed phrases

**Test 1: Invalid BIP39 Word**
**Steps:**
1. Import seed phrase with invalid word:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon invalidword
   ```
2. Click "Import"

**Expected:**
- ✅ Error: "Invalid seed phrase - word 'invalidword' not in BIP39 word list"
- ✅ Import rejected

**Test 2: Wrong Word Count**
**Steps:**
1. Import only 11 words:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon
   ```
2. Click "Import"

**Expected:**
- ✅ Error: "Seed phrase must be 12, 15, 18, 21, or 24 words"
- ✅ Import rejected

**Test 3: Invalid Checksum**
**Steps:**
1. Import 12 valid words with wrong checksum:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon
   ```
2. Click "Import"

**Expected:**
- ✅ Error: "Invalid seed phrase checksum"
- ✅ Import rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-010: Account Badges Display

**Priority:** P1
**Time:** 3 minutes

**Prerequisites:** Have HD accounts, imported key account, and imported seed account

**Steps:**
1. Navigate to Settings → Account Management
2. Observe account list
3. Verify badges displayed correctly

**Expected Results:**

**HD Wallet Accounts:**
- ✅ Badge: "HD" or "Native SegWit/SegWit/Legacy"
- ✅ Badge color: Blue

**Imported Private Key Accounts:**
- ✅ Badge: "Imported" or "Private Key"
- ✅ Badge color: Amber/Orange

**Imported Seed Accounts:**
- ✅ Badge: "Imported" or "Seed Phrase"
- ✅ Badge color: Amber/Orange

**Visual Example:**
```
Account List:
┌───────────────────────────────┐
│ Account 1     [HD] [Native ⚡]│
│ 0.05 BTC                      │
├───────────────────────────────┤
│ Imported Key  [Imported 🔑]   │
│ 0.001 BTC                     │
├───────────────────────────────┤
│ Imported Seed [Imported 🌱]   │
│ 0.0001 BTC                    │
└───────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-011: Delete/Hide Account (if implemented)

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify account deletion or hiding

**Note:** Some wallets don't allow deletion for safety. Verify expected behavior.

**Steps:**
1. Navigate to Settings → Account Management
2. Select account to delete
3. Click "Delete" or "Hide" option
4. Confirm deletion/hiding
5. Observe account removed from list

**Expected Results (if deletion allowed):**
- ✅ Confirmation warning shown
- ✅ Warning explains: "This will not delete funds, only remove from wallet"
- ✅ If account has balance, show stronger warning
- ✅ Account removed from list
- ✅ Cannot be recovered without re-import

**Alternative (if hiding):**
- ✅ Account hidden but recoverable
- ✅ Can unhide from settings

**Alternative (if not allowed):**
- ✅ No delete option (by design)
- ✅ Accounts remain permanently

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___) OR [ ] N/A (Not Implemented)

---

### ACC-012: Account Creation Performance

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify account creation is fast

**Steps:**
1. Time account creation process:
   - Start timer
   - Create new account
   - Stop timer when account appears

**Expected Results:**
- ✅ Account creation: < 1 second
- ✅ No UI freezing
- ✅ Smooth animation/transition
- ✅ Immediate update in account list

**Performance Measurements:**
- Trial 1: _____ ms
- Trial 2: _____ ms
- Trial 3: _____ ms
- Average: _____ ms (should be < 1000ms)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-013: Import Account - Security Warnings

**Priority:** P0 (Security)
**Time:** 3 minutes

**Purpose:** Verify security warnings when importing private keys

**Steps:**
1. Navigate to import private key screen
2. Observe security warnings
3. Verify warning content

**Expected Results:**
- ✅ Warning: "Private keys grant full access to funds"
- ✅ Warning: "Only import keys you trust"
- ✅ Warning: "Never share private keys"
- ✅ Warning: "Imported keys are not backed up by seed phrase"
- ✅ Checkbox: "I understand the risks"
- ✅ Cannot import without acknowledging checkbox

**Visual Example:**
```
⚠️ Security Warning

Importing a private key grants full access to
those funds. Only import keys from sources you
trust.

⚠️ Important:
• Imported keys are NOT backed up by your seed phrase
• You must back up imported keys separately
• Never share your private keys with anyone

☐ I understand the risks and want to continue

[Cancel] [Import]
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-014: Account Export Options

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify user can export account details

**Steps:**
1. Navigate to Settings → Account Management
2. Select an account
3. Look for export options:
   - Export Private Key
   - Export Extended Public Key (xpub)
   - Export Seed Phrase (for seed-based accounts)

**Expected Results:**
- ✅ Export options visible
- ✅ Password required to export private data
- ✅ Warning shown before export
- ✅ Can copy private key to clipboard (WIF format)
- ✅ Can view QR code for private key
- ✅ Can export xpub (for HD accounts)

**Security Validation:**
- Private key export requires password
- Warning: "Anyone with this key can steal your funds"
- Option to show/hide key
- QR code generation for mobile import

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-015: Imported Account - Cannot Derive New Addresses

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify imported private key accounts cannot generate new addresses

**Steps:**
1. Switch to imported private key account
2. Navigate to Receive screen
3. Look for "Generate New Address" option
4. Observe behavior

**Expected Results:**
- ✅ "Generate New Address" button disabled or hidden
- ✅ Explanation: "Imported accounts have a single address"
- ✅ Only one address shown (the imported key's address)
- ✅ Can still receive to this address multiple times
- ✅ UTXO management works normally

**Contrast with HD Accounts:**
- HD accounts CAN generate new addresses
- Imported accounts CANNOT

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-016: Account Switching Persists

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify selected account persists across lock/unlock

**Steps:**
1. Unlock wallet (Account 1 active)
2. Switch to Account 2 (Savings Account)
3. Lock wallet
4. Unlock wallet
5. Observe which account is active

**Expected Results:**
- ✅ After unlock, Account 2 still selected
- ✅ Dashboard shows Account 2 data
- ✅ Account selection persisted in storage
- ✅ No reset to Account 1

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-017: Account Balances Independent

**Priority:** P0
**Time:** 10 minutes

**Prerequisites:** Testnet Bitcoin available

**Steps:**
1. Create Account 1, receive 0.01 BTC
2. Create Account 2, receive 0.001 BTC
3. Switch between accounts
4. Verify balances independent

**Expected Results:**
- ✅ Account 1 shows 0.01 BTC only
- ✅ Account 2 shows 0.001 BTC only
- ✅ Total wallet balance: 0.011 BTC (sum of all)
- ✅ Transaction history separate per account
- ✅ Sending from Account 1 doesn't affect Account 2
- ✅ Each account has its own UTXO set

**Verification:**
1. Send from Account 1 (0.005 BTC)
2. Account 1 balance decreases
3. Account 2 balance unchanged

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-018: Duplicate Account Name Handling

**Priority:** P2
**Time:** 3 minutes

**Purpose:** Verify handling of duplicate account names

**Steps:**
1. Create account named "Test Account"
2. Create another account with same name "Test Account"
3. Observe behavior

**Expected Results (two valid approaches):**

**Option A: Allow Duplicates**
- ✅ Both accounts created
- ✅ Names identical
- ✅ Distinguished by balance or other identifier

**Option B: Prevent Duplicates**
- ✅ Error: "Account name already exists"
- ✅ Suggest alternative: "Test Account 2"
- ✅ Force unique names

**Document which approach is used:**
- Approach: [ ] Allow Duplicates [ ] Prevent Duplicates

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### ACC-EDGE-01: Maximum Account Name Length

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Create account with very long name (200 characters)
2. Observe behavior

**Expected:**
- ✅ Name truncated to max length (e.g., 50 characters)
- ✅ Error message if too long
- ✅ UI doesn't break with long name

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-EDGE-02: Special Characters in Account Name

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Create account with special characters: "Test!@#$%^&*()"
2. Observe handling

**Expected:**
- ✅ Special characters accepted
- ✅ OR: Sanitized to alphanumeric only
- ✅ No XSS vulnerabilities

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### ACC-EDGE-03: Import Same Private Key Twice

**Priority:** P1
**Time:** 3 minutes

**Steps:**
1. Import private key as "Account A"
2. Attempt to import SAME private key as "Account B"
3. Observe behavior

**Expected:**
- ✅ Error: "This private key is already imported"
- ✅ Duplicate detection works
- ✅ Prevents duplicate imports

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Test Summary

**Total Tests:** 18 core + 3 edge cases = 21 tests
**P0 Tests:** 8 (ACC-001, ACC-002, ACC-006, ACC-007, ACC-008, ACC-009, ACC-013, ACC-017)
**P1 Tests:** 7 (ACC-003, ACC-004, ACC-005, ACC-010, ACC-014, ACC-015, ACC-016, ACC-EDGE-03)
**P2 Tests:** 6 (ACC-011, ACC-012, ACC-018, ACC-EDGE-01, ACC-EDGE-02)

**Critical Tests:**
- ACC-001: Create new account
- ACC-002: Switch accounts
- ACC-006: Import private key (valid)
- ACC-007: Reject invalid private key
- ACC-008: Import seed phrase
- ACC-017: Independent balances

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Cannot create new accounts
**Cause:** Derivation path calculation error
**Solution:** Check account index incrementing
**Report As:** P0 blocker bug

### Issue: Imported account shows wrong address
**Cause:** Address derivation mismatch or wrong network
**Solution:** Verify WIF decoding and network validation
**Report As:** P0 bug

### Issue: Account balance shows incorrectly after switch
**Cause:** Balance not updating or caching issue
**Solution:** Check balance refresh on account switch
**Report As:** P0 bug

### Issue: Duplicate account names cause confusion
**Cause:** No name uniqueness enforcement
**Solution:** Implement duplicate name validation
**Report As:** P1 UX bug

---

## WIF Private Key Test Resources

**Testnet WIF Private Keys for Testing:**

**NEVER USE WITH REAL FUNDS - TESTNET ONLY**

```
Example 1 (compressed):
cU8Q2jGeX3GNKNa5etiC8mgEgFSeVUTRQfWE2ZCzszyqYNK4Mepy
Address: tb1qfuv9a3p7kk8r7zqxzz2ykzxxzzywvq6rchh8dg

Example 2 (compressed):
cTz8Y6H3wvj4kkQwkjqj8M7qzaWtF7j6E4Y7nU5dkV3j6C8fY6H3
(Generate your own for testing)
```

**Generate Test Keys:**
Use: https://www.bitaddress.org/?testnet=true

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
