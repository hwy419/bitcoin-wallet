# Priority Test Execution Guide (P0 Critical Path)

**Purpose:** Essential smoke tests that MUST pass before any release
**Time to Execute:** 30-45 minutes (smoke test) or 2-3 hours (full P0 suite)
**When to Use:**
- After every build
- Before starting feature testing
- Before releases
- After critical bug fixes

---

## Overview

This guide contains **40 P0 (critical path) test cases** that validate the wallet's core functionality and security. These tests represent the absolute minimum quality bar - if any fail, the wallet should not be released.

**Test Organization:**
1. **Quick Smoke Test** (20 tests, 30 min) - Absolute essentials
2. **Full P0 Suite** (40 tests, 2-3 hours) - Complete critical path

---

## Quick Smoke Test (30 Minutes)

**Execute these 20 tests for rapid validation:**

### Prerequisites
- [ ] Extension installed (v0.10.0)
- [ ] Testnet Bitcoin available (≥0.005 BTC)
- [ ] DevTools open (F12)
- [ ] Fresh wallet state (or documented starting state)

---

## Section 1: Extension & Tab Architecture (5 tests)

### TEST-01: Extension Loads Successfully

**Priority:** P0
**Time:** 2 minutes

**Steps:**
1. Navigate to `chrome://extensions/`
2. Verify "Bitcoin Wallet" extension card visible
3. Check version shows "0.10.0"
4. No errors in extension card
5. Click Bitcoin ₿ icon in toolbar

**Expected Results:**
- ✅ Extension opens in NEW TAB (not popup)
- ✅ URL: `chrome-extension://[id]/index.html`
- ✅ Wallet interface loads
- ✅ No console errors (F12)

**What to Check:**
- Console shows no red errors
- Extension icon clickable
- Tab opens within 500ms

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-02: Single Tab Enforcement

**Priority:** P0 (Security Critical)
**Time:** 3 minutes

**Steps:**
1. Open wallet in tab (if not already open)
2. Unlock wallet with password
3. Note the active wallet tab
4. **Duplicate tab** using Ctrl+Shift+D (or Cmd+Shift+D on Mac)
5. Observe both tabs

**Expected Results:**
- ✅ First tab shows "Wallet Tab Closed" message with orange "Return to Wallet" button
- ✅ Second tab now has active wallet session
- ✅ Only ONE tab can access wallet at a time
- ✅ Console shows "[TAB SESSION]" logs

**What to Check:**
- Session transferred to new tab
- Old tab cannot access wallet
- No way to bypass (try clicking buttons on old tab - should do nothing)

**Security Impact:** If this fails, multiple tabs could access same wallet simultaneously, causing race conditions and security issues.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 BLOCKER)

---

### TEST-03: Clickjacking Prevention

**Priority:** P0 (Security Critical)
**Time:** 5 minutes

**Preparation:**
Create a test HTML file: `clickjacking-test.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>Clickjacking Test</title>
</head>
<body>
    <h1>Clickjacking Prevention Test</h1>
    <p>If you can see the wallet interface below, clickjacking prevention is BROKEN.</p>
    <iframe src="chrome-extension://[YOUR-EXTENSION-ID]/index.html" width="600" height="400"></iframe>
</body>
</html>
```

**Steps:**
1. Replace `[YOUR-EXTENSION-ID]` with actual extension ID from chrome://extensions/
2. Open `clickjacking-test.html` in browser
3. Observe iframe content

**Expected Results:**
- ✅ Iframe shows security error message OR blank screen
- ✅ Wallet does NOT initialize in iframe
- ✅ Console shows security error about iframe detection
- ✅ Cannot interact with wallet in iframe

**What to Check:**
- React app does not render in iframe
- No wallet UI visible in iframe
- Error message clear

**Security Impact:** If this fails, attackers can embed wallet in malicious sites and trick users into signing transactions.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL SECURITY ISSUE)

---

### TEST-04: Tab Nabbing Detection

**Priority:** P0 (Security Critical)
**Time:** 2 minutes

**Steps:**
1. Open wallet and unlock
2. Open browser console (F12)
3. Paste and execute: `window.location.href = 'https://evil.com';`
4. Observe wallet response (should happen within 1 second)

**Expected Results:**
- ✅ Wallet detects location change immediately
- ✅ Shows "Tab Nabbing Detected" alert or locks wallet
- ✅ Cannot access wallet after location change
- ✅ Must unlock again to use wallet

**What to Check:**
- Detection happens within 1 second
- Wallet locked immediately
- Cannot bypass by pressing back button

**Security Impact:** If this fails, attackers can redirect users to fake wallet sites.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL SECURITY ISSUE)

---

### TEST-05: Session Token Validation

**Priority:** P0 (Security Critical)
**Time:** 2 minutes

**Steps:**
1. Open wallet and unlock
2. Open console (F12)
3. Watch console for "[TAB SESSION]" logs
4. Wait 5-10 seconds
5. Should see session validation logs every 5 seconds

**Expected Results:**
- ✅ Console shows: "[TAB SESSION] Validated: true" every ~5 seconds
- ✅ Session continuously monitored
- ✅ If validation fails, wallet locks

**What to Check:**
- Regular validation logs (every 5 seconds)
- No errors during validation

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 SECURITY ISSUE)

---

## Section 2: Wallet Creation & Setup (5 tests)

### TEST-06: Create Wallet (Native SegWit)

**Priority:** P0
**Time:** 5 minutes

**Steps:**
1. Click "Create New Wallet" tab
2. Enter password: `TestWallet123`
3. Confirm password: `TestWallet123`
4. Select address type: "Native SegWit (Recommended)"
5. View seed phrase (12 words displayed)
6. Write down or screenshot seed phrase
7. Click "I've backed up my seed phrase"
8. Complete seed phrase confirmation (select words in correct order)
9. Click "Create Wallet"

**Expected Results:**
- ✅ Seed phrase is 12 valid BIP39 words
- ✅ Seed phrase confirmation required
- ✅ Cannot skip confirmation
- ✅ Wallet created successfully
- ✅ Redirected to unlock screen

**What to Check:**
- Seed phrase only shown once
- Confirmation words must be in correct order
- Password meets strength requirements

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-07: Seed Phrase Security

**Priority:** P0 (Security Critical)
**Time:** 3 minutes

**Steps:**
1. After creating wallet (TEST-06)
2. Unlock wallet
3. Open DevTools → Application → Storage → Local Storage
4. Inspect stored data
5. Search for seed phrase words

**Expected Results:**
- ✅ Seed phrase NOT visible in plain text
- ✅ All data encrypted (looks like random characters)
- ✅ No private keys visible
- ✅ Storage contains encrypted blob only

**What to Check:**
```
chrome.storage.local:
{
  "wallet": "[encrypted gibberish...]",
  "session": "[session data...]"
}
```

**Security Impact:** If seed phrase visible in storage, anyone with access to browser can steal funds.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL)

---

### TEST-08: Import Seed Phrase

**Priority:** P0
**Time:** 4 minutes

**Steps:**
1. Lock current wallet (or use fresh extension)
2. Click "Import Seed Phrase" tab
3. Enter valid 12-word seed: `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`
4. Enter password: `TestWallet123`
5. Confirm password: `TestWallet123`
6. Select address type: "Native SegWit"
7. Click "Import Wallet"

**Expected Results:**
- ✅ Wallet imported successfully
- ✅ Redirected to unlock screen
- ✅ Can unlock with password
- ✅ First address matches expected (tb1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu for this seed on testnet)

**What to Check:**
- Invalid seed phrases rejected
- Seed phrase validation works
- Account discovery runs (checks for existing funds)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-09: Password Validation

**Priority:** P0
**Time:** 3 minutes

**Steps:**
1. Start wallet creation
2. **Test 1:** Enter password: `123` (too short)
3. **Test 2:** Enter password: `12345678` (8 chars minimum)
4. **Test 3:** Enter password: `MyStr0ngP@ss!` (strong)

**Expected Results:**
- ✅ Test 1: Rejected (< 8 characters)
- ✅ Test 2: Accepted (meets minimum)
- ✅ Test 3: Accepted (strong password)
- ✅ Password strength meter shows feedback
- ✅ Confirm password must match

**What to Check:**
- Strength meter updates in real-time
- Mismatched passwords rejected
- Error messages clear

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-10: Wallet Persistence

**Priority:** P0
**Time:** 2 minutes

**Steps:**
1. Create or import wallet
2. Unlock wallet
3. Note wallet state (balance, addresses)
4. **Refresh browser tab** (F5)
5. Observe wallet state

**Expected Results:**
- ✅ Wallet redirects to unlock screen
- ✅ Must enter password again
- ✅ After unlock, wallet state same as before
- ✅ Balance, accounts, settings persist

**What to Check:**
- No data loss on refresh
- Password still required
- Extension reload doesn't corrupt data

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Section 3: Authentication & Locking (4 tests)

### TEST-11: Unlock with Correct Password

**Priority:** P0
**Time:** 1 minute

**Steps:**
1. Ensure wallet is locked
2. Enter correct password
3. Click "Unlock"

**Expected Results:**
- ✅ Wallet unlocks immediately
- ✅ Dashboard displays
- ✅ Balance visible
- ✅ Navigation works

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-12: Unlock with Incorrect Password

**Priority:** P0
**Time:** 1 minute

**Steps:**
1. Ensure wallet is locked
2. Enter incorrect password: `WrongPassword123`
3. Click "Unlock"

**Expected Results:**
- ✅ Error message: "Incorrect password"
- ✅ Wallet remains locked
- ✅ Cannot access wallet
- ✅ Can retry with correct password

**What to Check:**
- Error message clear and helpful
- No password retry limit (testnet only)
- Input field shakes or shows red border

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-13: Manual Lock

**Priority:** P0
**Time:** 1 minute

**Steps:**
1. Unlock wallet
2. Navigate to Settings
3. Click "Lock Wallet" button
4. Observe result

**Expected Results:**
- ✅ Wallet locks immediately
- ✅ Redirects to unlock screen
- ✅ Balance/data cleared from view
- ✅ Must re-enter password

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-14: Auto-Lock Inactive Timer

**Priority:** P0
**Time:** 15 minutes (can be tested async)

**Steps:**
1. Unlock wallet
2. Leave tab open and active (visible)
3. Do not interact with wallet for 15 minutes
4. After 15 minutes, try to interact

**Expected Results:**
- ✅ After 15 minutes, wallet auto-locks
- ✅ Shows unlock screen or lock overlay
- ✅ Must re-enter password
- ✅ Timer resets on any interaction

**What to Check:**
- Timer accuracy (should lock at ~15 minutes)
- Any interaction resets timer (click, scroll, keyboard)

**Note:** This test can run in background while you do other tests

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Section 4: Send Transactions (4 tests)

### TEST-15: Send Transaction (Medium Fee)

**Priority:** P0
**Time:** 5 minutes

**Prerequisites:**
- Wallet has ≥0.001 BTC
- Have recipient address ready (from Wallet B or test address)

**Steps:**
1. Unlock wallet
2. Click "Send" button
3. Enter recipient address: `[tb1q... or other testnet address]`
4. Enter amount: `0.0001` BTC
5. Select "Medium" fee
6. Click "Review Transaction"
7. Verify transaction details in preview
8. Click "Confirm"
9. Enter password
10. Wait for transaction broadcast

**Expected Results:**
- ✅ Transaction ID (txid) returned
- ✅ Success message displays
- ✅ Balance decrements by (amount + fee)
- ✅ Transaction appears in history as "Pending"
- ✅ Transaction visible on Blockstream: https://blockstream.info/testnet/tx/[TXID]

**What to Verify on Block Explorer:**
- Transaction exists
- Recipient address correct
- Amount correct (0.0001 BTC = 10,000 sats)
- Fee reasonable (0.00001 - 0.00005 BTC)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)
**TXID:** _______________

---

### TEST-16: Send Max (Entire Balance)

**Priority:** P0
**Time:** 5 minutes

**Prerequisites:**
- Wallet has some balance
- Have recipient address ready

**Steps:**
1. Click "Send" button
2. Enter recipient address
3. Click "Send Max" button
4. Observe amount auto-filled
5. Review transaction (should show NO change output)
6. Confirm and sign

**Expected Results:**
- ✅ Amount = Balance - Fee
- ✅ Transaction has no change output
- ✅ All UTXOs consumed
- ✅ Wallet balance becomes 0.00000000 after confirmation

**What to Verify on Explorer:**
- Only 1 output (to recipient)
- No change output back to sender
- All UTXOs from address spent

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-17: Invalid Address Rejection

**Priority:** P0
**Time:** 2 minutes

**Steps:**
1. Click "Send" button
2. **Test 1:** Enter `not_a_valid_address`
3. **Test 2:** Enter `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` (mainnet address)
4. **Test 3:** Enter `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4` (mainnet Native SegWit)

**Expected Results:**
- ✅ Test 1: Error "Invalid Bitcoin address"
- ✅ Test 2: Error "Mainnet address not supported" or "Invalid address"
- ✅ Test 3: Error "Mainnet address not supported"
- ✅ Cannot proceed with invalid address
- ✅ Send button disabled or shows error

**What to Check:**
- Error messages clear and helpful
- Red border on input field
- Network validation working (testnet only)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-18: Insufficient Funds Error

**Priority:** P0
**Time:** 2 minutes

**Steps:**
1. Note current balance (e.g., 0.001 BTC)
2. Click "Send" button
3. Enter valid testnet address
4. Enter amount larger than balance (e.g., 0.01 BTC)
5. Observe error

**Expected Results:**
- ✅ Error: "Insufficient funds" or "Insufficient balance"
- ✅ Shows how much more needed (optional but nice)
- ✅ Cannot create transaction
- ✅ Send button disabled or error shown

**What to Check:**
- Error appears before clicking Review
- Clear message explaining the issue

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Section 5: Receive Transactions (2 tests)

### TEST-19: Display Receiving Address

**Priority:** P0
**Time:** 2 minutes

**Steps:**
1. Unlock wallet
2. Click "Receive" button
3. Observe displayed information

**Expected Results:**
- ✅ Receiving address displayed (starts with `tb1q` for Native SegWit)
- ✅ QR code generated and visible
- ✅ "Copy Address" button works (copies to clipboard)
- ✅ Address format correct for selected address type

**What to Check:**
- Address matches account's address type
- QR code scannable
- Copy feedback shown (toast or checkmark)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-20: Balance Updates After Receive

**Priority:** P0
**Time:** Variable (depends on testnet block time)

**Prerequisites:**
- Use testnet faucet to send BTC to wallet

**Steps:**
1. Note current balance
2. Copy receiving address
3. Send testnet BTC from faucet: https://testnet-faucet.mempool.co/
4. Wait 30-60 seconds
5. Check wallet balance
6. Check transaction history

**Expected Results:**
- ✅ Balance updates within 1-2 minutes
- ✅ Shows unconfirmed balance separately (optional)
- ✅ Transaction appears in history as "Pending"
- ✅ After 1 block confirmation, shows as "Confirmed"
- ✅ Confirmed balance increases

**What to Check:**
- No manual refresh needed (auto-updates)
- Transaction history shows received transaction
- Explorer shows same balance

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)
**Faucet TXID:** _______________

---

## End of Quick Smoke Test

**If all 20 tests passed → Proceed with full testing**
**If any P0 test failed → STOP, report bug, wait for fix**

---

# Full P0 Test Suite (40 Tests Total)

**The 20 additional P0 tests below provide complete critical path coverage:**

## Section 6: Account Management (5 tests)

### TEST-21: Account Balance Display Accuracy

**Priority:** P0
**Time:** 3 minutes

**Steps:**
1. Unlock wallet
2. Note wallet balance
3. Open Blockstream explorer for your address
4. Compare balances

**Expected Results:**
- ✅ Wallet balance matches explorer balance
- ✅ Confirmed vs unconfirmed shown (if different)
- ✅ Balance in BTC with 8 decimal places
- ✅ USD equivalent shown (if enabled)

**What to Check:**
- Within 0.00000001 BTC tolerance
- Updates when transactions confirm

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-22: Network Validation (Mainnet Rejection)

**Priority:** P0 (Security)
**Time:** 2 minutes

**Steps:**
1. Go to Settings → Import Account
2. Try to import mainnet WIF key: `L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ`
3. Observe error

**Expected Results:**
- ✅ Error: "Mainnet key not supported" or "Network mismatch"
- ✅ Cannot import mainnet keys
- ✅ Import blocked before key saved

**Security Impact:** Prevents users from accidentally importing valuable mainnet keys into testnet wallet.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-23: Export Private Key Security Warnings

**Priority:** P0 (Security)
**Time:** 3 minutes

**Steps:**
1. Go to Settings
2. Find non-multisig account
3. Click "Export Key" button
4. Count number of security warnings shown

**Expected Results:**
- ✅ At least 2 security warnings displayed
- ✅ Warnings explain risks ("anyone with key can steal funds")
- ✅ Password required to export
- ✅ User must acknowledge risks (checkbox or similar)

**What to Check:**
- Warnings are prominent (red/orange)
- Clear language about risks
- Cannot export without acknowledging

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-24: Account Switching Updates Balance

**Priority:** P0
**Time:** 2 minutes

**Prerequisites:**
- Have 2 accounts with different balances

**Steps:**
1. Note Account 1 balance
2. Switch to Account 2 (using account switcher)
3. Note Account 2 balance
4. Switch back to Account 1

**Expected Results:**
- ✅ Balance changes when switching accounts
- ✅ Each account shows its own balance
- ✅ Switching is immediate (<1 second)
- ✅ Correct account name displayed

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-25: Account Persistence After Lock

**Priority:** P0
**Time:** 2 minutes

**Steps:**
1. Create or switch to Account 2
2. Note current account name
3. Lock wallet
4. Unlock wallet
5. Check which account is active

**Expected Results:**
- ✅ Same account selected after unlock
- ✅ Account selection persists
- ✅ Balance correct for selected account

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Section 7: Security Features (10 tests)

### TEST-26: Private Keys Never Logged to Console

**Priority:** P0 (Security Critical)
**Time:** 5 minutes

**Steps:**
1. Open DevTools console (F12)
2. Clear console
3. Perform these operations:
   - Create transaction
   - Sign transaction
   - Import private key
   - Export private key
4. Search console for: "priv", "wif", "cVt", "cU", "L", "K"

**Expected Results:**
- ✅ NO private keys logged to console
- ✅ NO WIF strings logged
- ✅ Only public information logged (addresses, txids, amounts)

**Security Impact:** If private keys logged, anyone viewing DevTools can steal funds.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL)

---

### TEST-27: Seed Phrases Never Logged to Console

**Priority:** P0 (Security Critical)
**Time:** 3 minutes

**Steps:**
1. Clear console
2. Create wallet (or import seed)
3. Search console for seed phrase words (e.g., "abandon", "ability", etc.)

**Expected Results:**
- ✅ NO seed phrase words logged
- ✅ NO mnemonic logged
- ✅ Only encrypted data references

**Security Impact:** Seed phrase exposure = total wallet compromise

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL)

---

### TEST-28: Password Never Stored Plaintext

**Priority:** P0 (Security Critical)
**Time:** 3 minutes

**Steps:**
1. Create wallet with password
2. Open DevTools → Application → Local Storage
3. Search for password string
4. Check Network tab for password in requests

**Expected Results:**
- ✅ Password NOT in local storage
- ✅ Password NOT in network requests
- ✅ Only derived keys stored (encrypted)

**What to Check:**
```
❌ BAD:  {"password": "TestWallet123"}
✅ GOOD: {"encryptedWallet": "a3f5d..."}
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL)

---

### TEST-29: Memory Cleanup on Lock

**Priority:** P0 (Security)
**Time:** 3 minutes

**Steps:**
1. Unlock wallet (seed decrypted in memory)
2. View dashboard (balance visible)
3. Lock wallet manually
4. Check that wallet state cleared

**Expected Results:**
- ✅ Balance disappears from UI
- ✅ Wallet redirects to unlock screen
- ✅ No sensitive data visible in UI
- ✅ Must re-decrypt to access wallet

**What to Check:**
- React state cleared
- No residual data in components
- Complete re-authentication required

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-30: No Sensitive Data in Network Requests

**Priority:** P0 (Security Critical)
**Time:** 5 minutes

**Steps:**
1. Open DevTools → Network tab
2. Filter: "Fetch/XHR"
3. Create and send a transaction
4. Inspect all network requests
5. Check request payloads for sensitive data

**Expected Results:**
- ✅ NO private keys in requests
- ✅ NO seed phrases in requests
- ✅ NO passwords in requests
- ✅ Only signed transactions sent (public data)

**What to Check:**
- Blockstream API requests contain only: addresses, txids, signed transactions
- No sensitive data in headers or payloads

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0 CRITICAL)

---

### TEST-31: Session Token Security

**Priority:** P0 (Security)
**Time:** 3 minutes

**Steps:**
1. Unlock wallet
2. Open DevTools → Console
3. Look for session token logs
4. Verify token format

**Expected Results:**
- ✅ Session token is cryptographically random (256-bit)
- ✅ Token validated every 5 seconds
- ✅ Token unique per session
- ✅ Token cleared on lock

**What to Check:**
- Token looks random (not predictable)
- Validation happens regularly

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-32: Address Format Validation

**Priority:** P0
**Time:** 3 minutes

**Steps:**
1. Go to Receive screen
2. Copy receiving address
3. Verify format matches address type:
   - Native SegWit: starts with `tb1q`
   - SegWit: starts with `2`
   - Legacy: starts with `m` or `n`

**Expected Results:**
- ✅ Address format correct for type selected
- ✅ Address is valid Bitcoin testnet address
- ✅ Can verify on Ian Coleman BIP39 tool

**Cross-Verification:**
1. Go to https://iancoleman.io/bip39/
2. Enter your seed phrase (testnet wallets only!)
3. Select "BTC - Bitcoin Testnet"
4. Select BIP84 (Native SegWit) or BIP49 (SegWit) or BIP44 (Legacy)
5. Compare first address with wallet

**Expected:** Addresses match exactly

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-33: State Clears on Lock

**Priority:** P0 (Security)
**Time:** 2 minutes

**Steps:**
1. Unlock wallet
2. Navigate to various screens (send, receive, settings)
3. Note what's visible (balance, addresses, account names)
4. Lock wallet
5. Check what's still visible

**Expected Results:**
- ✅ Balance hidden/cleared
- ✅ Addresses hidden/cleared
- ✅ Account names hidden/cleared
- ✅ Only unlock screen visible
- ✅ No residual sensitive data

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-34: Password Required for Sensitive Operations

**Priority:** P0 (Security)
**Time:** 3 minutes

**Steps:**
Test that password is required for:
1. Exporting private key
2. Signing transactions
3. Viewing seed phrase (if implemented)

**Expected Results:**
- ✅ Each sensitive operation requires password re-entry
- ✅ Cannot bypass password requirement
- ✅ Wrong password rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

### TEST-35: PBKDF2 Iteration Count

**Priority:** P0 (Security)
**Time:** 2 minutes (requires code inspection)

**Steps:**
1. Open background/wallet/CryptoUtils.ts
2. Find PBKDF2 key derivation
3. Check iteration count

**Expected Results:**
- ✅ Iteration count ≥ 100,000 (recommended: 100,000-600,000)
- ✅ Uses PBKDF2-HMAC-SHA512 or PBKDF2-HMAC-SHA256
- ✅ Salt is unique per wallet

**What to Check:**
```typescript
// Good
crypto.subtle.deriveBits({
  name: "PBKDF2",
  iterations: 100000, // ✅ Meets minimum
  ...
})
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - P0)

---

## Section 8: Transaction Validation (5 tests)

### TEST-36: Fee Calculation Accuracy

**Priority:** P0
**Time:** 5 minutes

**Steps:**
1. Create a send transaction
2. Note estimated fee
3. Broadcast transaction
4. Check actual fee on Blockstream

**Expected Results:**
- ✅ Actual fee within 10% of estimate
- ✅ Fee is reasonable (not 10x expected)
- ✅ Fee rate matches selected tier (slow/medium/fast)

**What to Check on Explorer:**
- Fee = Sum(inputs) - Sum(outputs)
- Fee rate (sat/vB) matches expectation:
  - Slow: 1-5 sat/vB
  - Medium: 10-20 sat/vB
  - Fast: 25+ sat/vB

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-37: UTXO Selection Correctness

**Priority:** P0
**Time:** 5 minutes

**Prerequisites:**
- Wallet has multiple UTXOs (use faucet 3-4 times to create multiple)

**Steps:**
1. Send amount larger than any single UTXO
2. Check transaction on explorer
3. Verify UTXO selection

**Expected Results:**
- ✅ Wallet selects sufficient UTXOs to cover amount + fee
- ✅ No insufficient funds error
- ✅ Transaction includes multiple inputs (if needed)
- ✅ Change output created (if applicable)

**What to Check on Explorer:**
- Inputs: Should be multiple UTXOs from your addresses
- Outputs: Recipient + change (back to you)
- No outputs below 546 sats (dust threshold)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-38: Change Address Generation

**Priority:** P0
**Time:** 3 minutes

**Steps:**
1. Send amount that requires change (not Send Max)
2. View transaction on Blockstream explorer
3. Identify change output
4. Verify change address

**Expected Results:**
- ✅ Change output exists (if transaction creates change)
- ✅ Change goes to an address in your wallet
- ✅ Change address uses same derivation (BIP44/49/84)
- ✅ Change balance reflects in wallet

**What to Check:**
- Change output is second output (standard)
- Change address belongs to your wallet
- Change index increments (internal chain: m/.../1/index)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-39: Transaction Signing Correctness

**Priority:** P0
**Time:** 5 minutes

**Steps:**
1. Create and sign a transaction
2. Check transaction on Blockstream after broadcast
3. Verify signature validity

**Expected Results:**
- ✅ Transaction accepted by network (appears on explorer)
- ✅ Signature valid (transaction included in block)
- ✅ Correct signature algorithm (ECDSA secp256k1)
- ✅ All inputs properly signed

**What to Check on Explorer:**
- Transaction status: "Confirmed" (after 1 block)
- No "Invalid signature" errors
- Transaction structure valid

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### TEST-40: Balance Updates After Transaction Confirmation

**Priority:** P0
**Time:** Variable (10-30 minutes for testnet confirmation)

**Steps:**
1. Note balance before sending
2. Send transaction
3. Note balance immediately after (should decrement)
4. Wait for 1 confirmation
5. Check final balance

**Expected Results:**
- ✅ Balance decreases immediately (optimistic update)
- ✅ After confirmation, balance matches expected
- ✅ Balance on explorer matches wallet
- ✅ No discrepancy between wallet and blockchain

**What to Check:**
- Before: X BTC
- After send: X - amount - fee
- After confirmation: Same as "After send"
- Explorer balance matches wallet

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## End of Full P0 Test Suite

---

## Test Results Summary

**Execution Date:** _______________
**Tester:** _______________
**Build Version:** v0.10.0

### Quick Stats

| Category | Tests | Passed | Failed | Blocked |
|----------|-------|--------|--------|---------|
| Quick Smoke (20) | 20 | ___ | ___ | ___ |
| Full P0 (40) | 40 | ___ | ___ | ___ |

### Pass/Fail Criteria

**Release Readiness:**
- ✅ **READY:** 40/40 passed (100%)
- ⚠️ **CONDITIONAL:** 38-39/40 passed (95-97%) - Review failed tests
- ❌ **NOT READY:** <38/40 passed (<95%) - Critical issues present

**If any P0 tests failed:**
1. Document bug with complete details
2. Mark as P0 blocker
3. Report to development team immediately
4. Do NOT proceed with feature testing
5. Wait for fix and retest

### Critical Bugs Found

**P0 Bugs:**
- BUG-___: [Title]
- BUG-___: [Title]

**Next Steps:**
- [ ] All P0 tests passed → Proceed to feature testing
- [ ] P0 failures documented and reported
- [ ] Waiting for fixes to retest

---

## Regression Test Checklist

**Use this checklist before releases to verify no functionality lost:**

### Core Functionality
- [ ] Wallet creation works (all address types)
- [ ] Seed phrase import works
- [ ] Lock/unlock reliable
- [ ] Send transactions successful
- [ ] Receive transactions successful
- [ ] Balance displays correctly
- [ ] Transaction history shows all transactions

### Security Controls
- [ ] Single tab enforcement active
- [ ] Clickjacking prevention working
- [ ] Tab nabbing detection working
- [ ] Auto-lock timers functional
- [ ] No private keys logged
- [ ] Network validation (testnet only)

### User Interface
- [ ] Extension opens in tab (not popup)
- [ ] Sidebar navigation works
- [ ] All buttons clickable
- [ ] Forms validate input
- [ ] Error messages display
- [ ] Success confirmations show

### Data Persistence
- [ ] Wallet data persists after lock/unlock
- [ ] Settings persist
- [ ] Account selection persists
- [ ] No data corruption on refresh
- [ ] No data loss on extension reload

---

**All P0 tests complete! Return to [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md) for next steps.**
