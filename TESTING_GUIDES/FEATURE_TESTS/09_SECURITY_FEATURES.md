# Feature Test Guide: Security Features

**Feature Area:** Security, Encryption, & Data Protection
**Test Cases:** 17 tests (14 core + 3 edge cases)
**Time to Execute:** 2-3 hours
**Priority:** P0 (Critical - Security)

---

## Overview

This feature validates security-critical functionality including encryption, sensitive data handling, console log safety, memory management, and protection against common attack vectors. Security is paramount in a Bitcoin wallet.

**Why this matters:** Security vulnerabilities can lead to stolen funds, exposed private keys, or compromised user data. These tests verify the wallet protects user funds and sensitive information.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Fresh browser session
- [ ] **IMPORTANT:** Take screenshots of any security issues found

---

## Test Cases

### SEC-001: No Sensitive Data in Console Logs

**Priority:** P0 (Critical Security)
**Time:** 15 minutes

**Purpose:** Verify private keys, seed phrases, and passwords are NEVER logged to console

**Steps:**
1. Open Chrome DevTools (F12) → Console tab
2. Clear console
3. Create new wallet (observe seed phrase display)
4. Complete wallet creation
5. Unlock wallet with password
6. Create account
7. Send transaction (enter password)
8. Review ALL console logs

**Expected Results:**
- ✅ NO seed phrase in console
- ✅ NO private keys in console
- ✅ NO passwords in console
- ✅ NO encryption keys in console
- ✅ NO xprv (extended private keys) in console
- ✅ Xpub (extended public keys) may be logged (safe)
- ✅ Addresses may be logged (safe)
- ✅ Transaction IDs may be logged (safe)

**Search Console For (These should NOT appear):**
```
❌ "abandon abandon abandon" (seed phrase)
❌ "cU8Q2jGeX3GNK" (private key WIF)
❌ "TestPassword123!" (password)
❌ "xprv" (extended private key prefix)
❌ "encryption key"
❌ "master seed"
```

**Allowed in Console:**
```
✅ "tpub" (extended public key)
✅ "tb1q..." (address)
✅ "a3f5d2e8b9..." (transaction ID)
✅ "[WALLET] Unlocked successfully"
✅ "[WALLET] Transaction signed"
```

**If ANY sensitive data found:**
🚨 **CRITICAL SECURITY BUG**
- Take screenshot of console immediately
- File GitHub issue: https://github.com/[REPOSITORY]/issues
- Mark as P0 CRITICAL SECURITY VULNERABILITY
- Include exact log line and when it appeared

**Screenshot Points:**
- Console logs showing NO sensitive data
- If bug found: Screenshot of sensitive data in console

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-002: Wallet Data Encrypted in Storage

**Priority:** P0 (Critical Security)
**Time:** 10 minutes

**Purpose:** Verify wallet data is encrypted in chrome.storage.local

**Steps:**
1. Create wallet with known seed phrase:
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
   ```
2. Unlock wallet
3. Open Chrome DevTools (F12) → Application tab
4. Navigate to: Storage → Local Storage → chrome-extension://[id]
5. OR: Storage → Extension Storage
6. Search for "abandon" or any seed phrase word
7. Search for private key patterns

**Expected Results:**
- ✅ Seed phrase NOT stored in plaintext
- ✅ Private keys NOT stored in plaintext
- ✅ Storage shows encrypted blob (gibberish/base64)
- ✅ Cannot find "abandon" or seed words
- ✅ Cannot find WIF private keys
- ✅ Encryption format: AES-256-GCM or similar
- ✅ Encrypted data looks like: "U2FsdGVkX19..." or similar

**Storage Inspection:**
```
Key: wallet_data
Value: {
  "version": 1,
  "encrypted": "U2FsdGVkX19fY3J5cHRvZ3JhcGh5...", ← Encrypted
  "iv": "a3f5d2e8b9c4d5e6f7a8b9c0",
  "salt": "c4d5e6f7a8b9c0d1e2f3a4b5"
}
```

**If seed phrase found in plaintext:**
🚨 **CRITICAL SECURITY BUG**
- Do not share screenshot publicly (contains seed)
- File private security report
- Mark as CRITICAL

**Screenshot Points:**
- Storage view showing encrypted data (NO plaintext)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-003: Password Strength Enforcement

**Priority:** P0
**Time:** 8 minutes

**Purpose:** Verify strong password requirements enforced

**Steps:**
1. Start wallet creation
2. Test various passwords:
   - Test 1: "abc" (too short)
   - Test 2: "abcdefgh" (no number, no special)
   - Test 3: "abcdefgh1" (no special char)
   - Test 4: "ABCDEFGH1!" (no lowercase)
   - Test 5: "abcdefgh1!" (no uppercase)
   - Test 6: "Abcd123!" (meets all requirements)

**Expected Results:**
- ✅ Minimum 8 characters required
- ✅ Must contain uppercase letter
- ✅ Must contain lowercase letter
- ✅ Must contain number
- ✅ Must contain special character
- ✅ Real-time validation feedback
- ✅ Cannot proceed with weak password
- ✅ Clear error messages

**Validation UI:**
```
Password Requirements:
✓ At least 8 characters
✓ Uppercase letter (A-Z)
✓ Lowercase letter (a-z)
✓ Number (0-9)
✓ Special character (!@#$%^&*)
```

**Screenshot Points:**
- Password validation errors
- Requirements checklist

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-004: Encryption Key Derivation (PBKDF2)

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify password is properly derived using PBKDF2

**Note:** This requires code inspection or developer knowledge

**Steps:**
1. Review encryption implementation in code (if accessible)
2. OR: Check console logs for encryption initialization
3. OR: Consult development team

**Expected Results:**
- ✅ PBKDF2 used for key derivation
- ✅ Iteration count: 100,000+ (recommended)
- ✅ Salt: Unique per wallet
- ✅ Key size: 256 bits (32 bytes)
- ✅ Hash function: SHA-256 or SHA-512

**Console Logs (Development Mode):**
```
[CRYPTO] Deriving encryption key...
[CRYPTO] PBKDF2 iterations: 100000
[CRYPTO] Key derived successfully
```

**If different parameters:**
- Document actual implementation
- Verify meets industry standards

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-005: Memory Cleanup After Lock

**Priority:** P0 (Security)
**Time:** 10 minutes

**Purpose:** Verify sensitive data cleared from memory when wallet locks

**Steps:**
1. Unlock wallet
2. Open Chrome DevTools (F12) → Memory tab
3. Take heap snapshot (Snapshot 1)
4. Navigate through wallet, view balances, transactions
5. Manually lock wallet
6. Take heap snapshot (Snapshot 2)
7. Compare snapshots
8. Search for "seed", "private", "mnemonic" in Snapshot 2

**Expected Results:**
- ✅ Sensitive data NOT retained in memory after lock
- ✅ Heap snapshot shows data cleared
- ✅ Cannot find seed phrase in memory
- ✅ Cannot find private keys in memory
- ✅ Wallet state reset to locked

**Advanced (Optional):**
- Use Memory Profiler to detect memory leaks
- Verify garbage collection clears sensitive data

**Note:** This is an advanced test. If unsure, document observations and consult security team.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-006: No Sensitive Data in Error Messages

**Priority:** P0 (Security)
**Time:** 15 minutes

**Purpose:** Verify errors don't expose sensitive information

**Steps:**
1. Trigger various errors intentionally:
   - Enter wrong password
   - Enter invalid seed phrase
   - Send transaction with insufficient funds
   - Import invalid private key
   - Create transaction with invalid address
2. Observe ALL error messages
3. Check console for error details

**Expected Results:**
- ✅ Error messages are generic
- ✅ No seed phrase in error messages
- ✅ No private keys in error messages
- ✅ No partial private key hints
- ✅ Error: "Invalid seed phrase" (not "Word #7 is wrong")
- ✅ Error: "Incorrect password" (not "Password character 5 is wrong")
- ✅ Error: "Invalid private key" (not showing partial key)

**Bad Error Examples (Should NOT see):**
```
❌ "Seed phrase word #7 'invalid' is incorrect"
❌ "Private key starts with 'cU8Q2j' which is invalid"
❌ "Password 'TestPass' is incorrect"
❌ "Decryption failed: key mismatch at byte 15"
```

**Good Error Examples (Should see):**
```
✅ "Invalid seed phrase. Please check and try again."
✅ "Incorrect password."
✅ "Invalid private key format."
✅ "Insufficient balance."
```

**Screenshot Points:**
- Error messages (verify generic, not exposing data)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-007: Clipboard Cleared After Sensitive Data Copy

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify clipboard cleared after copying sensitive data

**Steps:**
1. Export private key (if feature exists)
2. Click "Copy Private Key"
3. Wait 30-60 seconds
4. Paste clipboard (Ctrl+V) into text editor
5. Observe if clipboard still contains private key

**Expected Results:**

**Option A: Auto-clear clipboard**
- ✅ Clipboard contains private key immediately after copy
- ✅ After 30-60 seconds, clipboard cleared automatically
- ✅ Pasting after timeout shows empty or different content
- ✅ User notification: "Clipboard will be cleared in 30 seconds"

**Option B: No auto-clear (acceptable but less secure)**
- ✅ Clipboard remains with private key
- ✅ Warning shown: "Remember to clear clipboard after use"

**Document which approach is used:**
- Approach: [ ] Auto-clear [ ] No auto-clear

**Screenshot Points:**
- Clipboard warning/notification

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-008: No Network Requests with Sensitive Data

**Priority:** P0 (Critical Security)
**Time:** 15 minutes

**Purpose:** Verify sensitive data never sent over network

**Steps:**
1. Open Chrome DevTools (F12) → Network tab
2. Clear network log
3. Create new wallet
4. View seed phrase
5. Unlock wallet
6. Send transaction
7. Review ALL network requests
8. Search request payloads for sensitive data

**Expected Results:**
- ✅ NO seed phrase in network requests
- ✅ NO private keys in network requests
- ✅ NO passwords in network requests
- ✅ NO encryption keys in network requests
- ✅ Signed transactions OK (contains signatures, not private keys)
- ✅ Addresses OK (public information)

**Network Requests to Check:**
- API calls to Blockstream
- Any analytics/telemetry (should not include sensitive data)
- Error reporting (should not include sensitive data)

**Allowed in Network Requests:**
```
✅ GET /address/tb1qrp33g0q5c5txsp9arysrx... (address)
✅ POST /tx (signed transaction hex)
✅ GET /fee-estimates
```

**NOT Allowed:**
```
❌ Any request containing seed phrase
❌ Any request containing private key
❌ Any request containing password
```

**If sensitive data found in network:**
🚨 **CRITICAL SECURITY BUG**
- Screenshot network request
- File immediately
- Mark as P0 CRITICAL

**Screenshot Points:**
- Network tab showing safe requests only

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-009: Content Security Policy (CSP) Headers

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify CSP headers prevent inline scripts and XSS

**Steps:**
1. Open Chrome DevTools (F12) → Console tab
2. Try to execute inline script:
   ```javascript
   eval('console.log("XSS test")');
   ```
3. Observe if blocked by CSP
4. Check manifest.json for CSP configuration

**Expected Results:**
- ✅ Inline scripts blocked
- ✅ eval() blocked by CSP
- ✅ Console shows CSP violation error
- ✅ CSP header includes: `script-src 'self'`
- ✅ CSP header includes: `object-src 'none'`
- ✅ Frame ancestors: `frame-ancestors 'none'` (prevents clickjacking)

**Console Expected:**
```
Refused to evaluate a string as JavaScript because 'unsafe-eval' is not an allowed source...
```

**Manifest.json CSP (Expected):**
```json
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'none'; frame-ancestors 'none'"
}
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-010: Rate Limiting on Authentication Attempts

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify rate limiting prevents brute-force password attacks

**Steps:**
1. Lock wallet
2. Attempt to unlock with WRONG password 10 times rapidly
3. Observe behavior after multiple failures

**Expected Results:**

**Option A: Temporary lockout**
- ✅ After 5 failed attempts, temporary lockout
- ✅ Lockout duration: 1-5 minutes
- ✅ Message: "Too many failed attempts. Try again in 3 minutes."
- ✅ Cannot attempt password during lockout

**Option B: Increasing delays**
- ✅ After each failure, delay increases
- ✅ Attempt 1-3: Instant retry
- ✅ Attempt 4-5: 5-second delay
- ✅ Attempt 6+: 30-second delay

**Option C: No rate limiting (LESS SECURE)**
- ✅ Can retry indefinitely
- ✅ Document this as potential security improvement

**Document which approach is used:**
- Approach: [ ] Lockout [ ] Increasing delays [ ] No limiting

**Screenshot Points:**
- Lockout or delay message (if applicable)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

---

### SEC-011: Privacy Balance Hiding (Click-to-Toggle)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify balance hiding feature (Privacy Mode) works correctly

**Steps:**
1. Unlock wallet
2. Navigate to Dashboard
3. Observe balance display (should show actual amount)
4. Click on the balance amount
5. Observe balance becomes hidden ("•••••")
6. Click balance again
7. Observe balance becomes visible again
8. Lock wallet, then unlock
9. Verify privacy preference persisted

**Expected Results:**
- ✅ Balance shows actual amount by default: "0.12345678 BTC"
- ✅ Click balance: changes to "••••• BTC" with eye-off icon
- ✅ Visual indicator: Eye icon with slash (🚫👁️) when hidden
- ✅ Click again: toggles back to actual amount
- ✅ Smooth transition animation
- ✅ Privacy state persists across:
  - Page refresh
  - Lock/unlock
  - Tab close/reopen
  - Extension reload
- ✅ Privacy applies to ALL balance displays:
  - Dashboard main balance
  - Account balances in sidebar
  - Transaction amounts (if implemented)
- ✅ USD equivalent also hidden: "$ •••••"
- ✅ Keyboard accessible: Enter/Space keys toggle privacy

**Visual States:**
```
Balance Visible (Default):
┌─────────────────────────────┐
│ Total Balance               │
│ 0.12345678 BTC              │
│ ≈ $3,500.00                 │
└─────────────────────────────┘

Balance Hidden (Privacy On):
┌─────────────────────────────┐
│ Total Balance        🚫👁️   │
│ ••••• BTC                   │
│ $ •••••                     │
└─────────────────────────────┘
```

**Privacy Context Storage:**
1. Open Chrome DevTools (F12) → Application tab
2. Navigate to: Storage → Local Storage → chrome-extension://[id]
3. Look for key: `privacy_settings`
4. Verify value: `{"balancesHidden": true}` or `false`

**Keyboard Testing:**
1. Click balance to focus
2. Press Enter key
3. Verify balance toggles
4. Press Space key
5. Verify balance toggles again

**Multi-Tab Sync:**
1. Open wallet in two tabs
2. Toggle privacy in tab 1
3. Switch to tab 2
4. Verify privacy state synced automatically

**Screenshot Points:**
- Balance visible state
- Balance hidden state (with eye icon)
- Privacy settings in storage

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-012: Transaction Metadata Encryption

**Priority:** P0 (Critical Security)
**Time:** 15 minutes

**Purpose:** Verify transaction metadata (tags, category, notes) is encrypted when wallet is locked

**Steps:**
1. Unlock wallet
2. Navigate to transaction history
3. Add metadata to 2-3 transactions:
   - Transaction A: Category="Business", Tags=#payment, #sensitive, Notes="Confidential payment info"
   - Transaction B: Category="Personal", Tags=#private, Notes="Personal notes here"
4. Verify metadata displays correctly when unlocked
5. Open Chrome DevTools (F12) → Application tab
6. Navigate to Storage → Local Storage → chrome-extension://[id]
7. Find key: `transaction_metadata`
8. Observe encrypted blob (should NOT be readable)
9. Lock wallet
10. Return to transaction history
11. Click on transaction with metadata
12. Verify metadata NOT accessible (lock icon or "Unlock to view" message)
13. Inspect storage again
14. Verify metadata still encrypted
15. Unlock wallet
16. Verify metadata accessible again and displays correctly

**Expected Results:**
- ✅ Metadata displays correctly when wallet unlocked
- ✅ Storage inspection shows encrypted data:
  - `transaction_metadata` key contains encrypted blob
  - Format: `{"encrypted": "U2FsdGVk...", "iv": "...", "salt": "..."}`
  - NO plaintext category, tags, or notes visible
  - Cannot read "#payment", "#sensitive", "Business", etc. in storage
- ✅ Lock wallet → metadata section shows lock icon
- ✅ Locked state message: "Unlock wallet to view metadata"
- ✅ Cannot edit metadata when locked
- ✅ Metadata remains encrypted in storage when locked
- ✅ Unlock wallet → metadata decrypted and displayed correctly
- ✅ All metadata values match original (no data loss)

**Storage Inspection (Chrome DevTools):**
```
CORRECT (Encrypted):
Key: transaction_metadata
Value: {
  "version": 1,
  "encrypted": "U2FsdGVkX19fY3J5cHRvZ3JhcGh5IGVuY3J5cHRpb24=",
  "iv": "a3f5d2e8b9c4d5e6f7a8b9c0",
  "salt": "c4d5e6f7a8b9c0d1e2f3a4b5",
  "transactions": {
    "txid123": {
      "encryptedData": "X1pZcnB0b2dyYXBoeSBlbmNyeXB0aW9u..."
    }
  }
}

INCORRECT (Plaintext - BUG!):
Key: transaction_metadata
Value: {
  "txid123": {
    "category": "Business",      ← ❌ Visible in plaintext
    "tags": ["#payment", "#sensitive"],  ← ❌ Visible
    "notes": "Confidential payment info"  ← ❌ Visible
  }
}
```

**Locked State Visual:**
```
Transaction Detail Pane (Wallet Locked):
┌─────────────────────────────────┐
│ Transaction Details             │
│ ...                             │
│                                 │
│ Tags & Notes           🔒       │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │      🔒 Locked              │ │
│ │                             │ │
│ │ Unlock wallet to view       │ │
│ │ transaction metadata        │ │
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**If plaintext metadata found in storage:**
🚨 **CRITICAL SECURITY BUG**
- Screenshot storage (blur sensitive data before sharing)
- File immediately as P0 CRITICAL
- Metadata must ALWAYS be encrypted
- This exposes user's transaction tagging and notes

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-013: Contact Tags Encryption

**Priority:** P0 (Critical Security)
**Time:** 15 minutes

**Purpose:** Verify contact custom tags (key-value pairs) are encrypted

**Steps:**
1. Unlock wallet
2. Navigate to Contacts screen
3. Create/edit contact with sensitive tags:
   - Name: "Exchange Wallet"
   - Tags:
     - key="account_id", value="USER123456"
     - key="api_key", value="sk_test_secret_key_here"
     - key="internal_id", value="CONF-2025-001"
4. Save contact
5. Verify tags display correctly in ContactDetailPane
6. Open Chrome DevTools (F12) → Application tab
7. Navigate to Storage → Local Storage
8. Find key: `contacts`
9. Observe contact data structure
10. Verify tags are in `encryptedData` field (NOT plaintext)
11. Lock wallet
12. Open Contacts screen
13. Verify contact list still shows names (names not encrypted for usability)
14. Click on contact with tags
15. Verify tags section shows lock icon or "Unlock to view tags"
16. Inspect storage again - tags still encrypted
17. Unlock wallet
18. Verify tags decrypted and display correctly

**Expected Results:**
- ✅ Contact tags save successfully
- ✅ Tags display correctly when unlocked
- ✅ Storage shows encrypted tags:
  - Contact object has `encryptedData` field
  - Tag key-value pairs NOT visible in plaintext
  - Cannot read "api_key", "sk_test_secret_key_here", etc.
- ✅ Contact name visible when locked (for usability)
- ✅ Contact tags NOT visible when locked
- ✅ Lock icon shown in contact detail when locked
- ✅ Unlock → tags decrypted correctly
- ✅ No data loss after encrypt/decrypt cycle

**Storage Structure (Chrome DevTools):**
```
CORRECT (Encrypted Tags):
Key: contacts
Value: [
  {
    "id": "contact_1",
    "address": "tb1qexample...",
    "name": "Exchange Wallet",  ← Name visible (usability)
    "category": "Exchange",
    "encryptedData": "U2FsdGVkX1...",  ← Tags encrypted ✅
    "createdAt": 1698765432000
  }
]

INCORRECT (Plaintext Tags - BUG!):
Key: contacts
Value: [
  {
    "id": "contact_1",
    "name": "Exchange Wallet",
    "tags": [  ← ❌ Tags in plaintext!
      {"key": "api_key", "value": "sk_test_secret_key_here"},
      {"key": "account_id", "value": "USER123456"}
    ]
  }
]
```

**ContactDetailPane (Locked State):**
```
┌─────────────────────────────────┐
│ Exchange Wallet          🔒     │
├─────────────────────────────────┤
│ Address: tb1qexample...         │
│ Category: Exchange              │
│                                 │
│ Custom Tags             🔒      │
│ ┌─────────────────────────────┐ │
│ │   Unlock wallet to view     │ │
│ │   contact tags              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Security Note:**
Contact tags may contain sensitive information like:
- API keys
- Account IDs
- Internal reference numbers
- Private notes
- Account numbers
All must be encrypted at rest.

**If plaintext tags found:**
🚨 **CRITICAL SECURITY BUG**
- Contact tags contain sensitive user data
- Must be encrypted when wallet locked
- File as P0 CRITICAL immediately

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-014: Encryption Verification - Detailed Inspection

**Priority:** P1
**Time:** 20 minutes

**Purpose:** Comprehensive verification that all sensitive data is encrypted correctly

**Steps:**
1. Unlock wallet
2. Create test data:
   - Add transaction metadata to 3 transactions
   - Create 2 contacts with custom tags
   - Ensure variety of sensitive data
3. Lock wallet
4. Open Chrome DevTools (F12)
5. Application tab → Storage → Local Storage → Extension ID
6. Inspect ALL storage keys thoroughly

**Test 1: Transaction Metadata Storage**
1. Find key: `transaction_metadata`
2. Expand value
3. Verify structure uses encryption:
   - Has `encrypted` field
   - Has `iv` (initialization vector)
   - Has `salt`
   - NO plaintext transaction metadata

**Test 2: Contacts Storage**
1. Find key: `contacts`
2. Expand value (array of contacts)
3. For each contact, verify:
   - Name visible (usability feature)
   - Address visible (public data)
   - Has `encryptedData` field
   - Tags NOT in plaintext
   - Notes NOT in plaintext

**Test 3: Search for Sensitive Patterns**
1. Use DevTools search (Ctrl+F in Storage tab)
2. Search for patterns that should NOT appear:
   - Search: "#payment" → Should NOT find in plaintext
   - Search: "Business" (category) → Should NOT find in plaintext
   - Search: "api_key" → Should NOT find in plaintext
   - Search: specific tag values from test data → NOT found
3. Verify all searches return no results OR only encrypted blobs

**Test 4: Wallet State**
1. Find key: `wallet` or `wallet_data`
2. Verify seed phrase NOT in plaintext
3. Verify private keys NOT in plaintext
4. Should see encrypted blob only

**Expected Results:**
- ✅ `transaction_metadata`: Fully encrypted structure
- ✅ `contacts`: Names/addresses visible, tags encrypted
- ✅ `wallet_data`: Seed and keys encrypted
- ✅ Search for sensitive patterns returns no plaintext matches
- ✅ All encryption uses proper structure (encrypted, iv, salt)
- ✅ Encryption algorithm: AES-256-GCM (check in code if possible)
- ✅ Each encrypted field has unique IV (initialization vector)
- ✅ Salt stored alongside encrypted data

**Storage Keys to Inspect:**
```
Required Keys (with encryption):
✅ wallet_data (seed, keys)
✅ transaction_metadata
✅ contacts (tags in encryptedData)

Optional Keys (OK if present):
✅ preferences (non-sensitive settings)
✅ network (testnet/mainnet)
✅ accounts (xpubs OK, no xprivs)
✅ address_labels (may be plaintext - just labels)
```

**Search Test Results:**
```
Test: Search for "#payment"
Expected: 0 plaintext results (may appear in encrypted blobs)
Actual: [Document your findings]

Test: Search for "Business"
Expected: 0 results in transaction_metadata plaintext
Actual: [Document your findings]

Test: Search for "api_key"
Expected: 0 results in contacts plaintext
Actual: [Document your findings]
```

**If ANY sensitive data found in plaintext:**
🚨 **SECURITY VULNERABILITY**
- Document exact storage key and field
- Screenshot (blur actual sensitive values)
- File bug with severity based on data type:
  - Seed phrase / private keys: P0 CRITICAL
  - Transaction metadata: P0 HIGH
  - Contact tags: P0 HIGH
  - Other metadata: P1

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Edge Case Tests

### SEC-EDGE-01: Extension Reload Clears Memory

**Priority:** P1
**Time:** 5 minutes

**Steps:**
1. Unlock wallet
2. Go to chrome://extensions/
3. Click "Reload" on Bitcoin Wallet extension
4. Return to wallet tab
5. Observe wallet state

**Expected:**
- ✅ Wallet locked after reload
- ✅ Must re-enter password
- ✅ Sensitive data cleared from memory

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-EDGE-02: Copy-Paste Seed Phrase Disabled

**Priority:** P1
**Time:** 3 minutes

**Steps:**
1. View seed phrase during wallet creation
2. Try to select text with mouse
3. Try Ctrl+C to copy

**Expected (Implementation-Dependent):**

**Option A: Copy disabled**
- ✅ Cannot select seed phrase text
- ✅ Ctrl+C does nothing
- ✅ Must write down manually

**Option B: Copy allowed with warning**
- ✅ Can copy but warning shown
- ✅ "Writing down on paper is more secure than copy/paste"

**Document approach:**
- Approach: [ ] Copy disabled [ ] Copy allowed with warning

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### SEC-EDGE-03: Screenshot Detection (Advanced)

**Priority:** P2
**Time:** 5 minutes (if implemented)

**Steps:**
1. View seed phrase
2. Take screenshot (Print Screen or Snipping Tool)
3. Observe if wallet detects screenshot

**Expected (Advanced Feature - May Not Be Implemented):**
- ✅ Warning: "Screenshot detected - writing on paper is safer"
- ✅ OR: No detection (acceptable, hard to implement in browser)

**Note:** Screenshot detection is difficult in browser extensions. Document if implemented.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐) OR [ ] N/A

---

## Test Summary

**Total Tests:** 14 core + 3 edge cases = 17 tests
**P0 Tests:** 8 (SEC-001, SEC-002, SEC-003, SEC-005, SEC-006, SEC-008, SEC-012, SEC-013)
**P1 Tests:** 7 (SEC-004, SEC-007, SEC-009, SEC-010, SEC-011, SEC-014, SEC-EDGE-01, SEC-EDGE-02)
**P2 Tests:** 2 (SEC-EDGE-03)

**Critical Security Tests:**
- SEC-001: No sensitive data in console
- SEC-002: Wallet data encrypted
- SEC-006: No sensitive data in errors
- SEC-008: No sensitive data in network requests

**New Feature Security Tests:**
- SEC-012: Transaction metadata encryption (tags, category, notes)
- SEC-013: Contact tags encryption (key-value pairs)
- SEC-014: Encryption verification - detailed inspection

**If ANY P0 test fails:**
🚨 **STOP IMMEDIATELY**
- File critical security bug report
- Do not use wallet with real funds
- Notify development team urgently

---

## Common Security Issues

### Issue: Seed phrase logged to console
**Severity:** CRITICAL
**Impact:** Anyone with DevTools access can steal wallet
**Report As:** P0 CRITICAL SECURITY VULNERABILITY
**Action:** File private security report immediately

### Issue: Data not encrypted in storage
**Severity:** CRITICAL
**Impact:** Malware or other extensions can steal wallet
**Report As:** P0 CRITICAL SECURITY VULNERABILITY

### Issue: Weak password accepted
**Severity:** HIGH
**Impact:** Brute-force attacks easier
**Report As:** P0 bug

### Issue: Sensitive data in error messages
**Severity:** HIGH
**Impact:** Information disclosure
**Report As:** P0 bug

---

## Filing Security Bug Reports

**For ANY security issue found:**

1. **Assess Severity:**
   - CRITICAL: Exposes private keys, seed phrase, or passwords
   - HIGH: Weak encryption, no rate limiting, memory leaks
   - MEDIUM: UI shows sensitive data temporarily
   - LOW: Minor information disclosure

2. **Gather Evidence:**
   - Screenshot of issue (be careful not to expose real keys publicly)
   - Console logs (redact any real sensitive data before sharing)
   - Steps to reproduce
   - Impact assessment

3. **File GitHub Issue:**
   - Go to: https://github.com/[REPOSITORY]/issues
   - For CRITICAL issues: Consider private security report
   - Title: "[SECURITY] Brief description - P0 CRITICAL"
   - Include screenshots and steps
   - Tag with "security" label

4. **Example Security Bug Report:**
```
Title: [SECURITY] Seed phrase logged to console during wallet creation - P0 CRITICAL

Severity: CRITICAL
Test Case: SEC-001

Description:
When creating a new wallet, the seed phrase is logged to the browser console in plaintext.

Steps to Reproduce:
1. Open Chrome DevTools (F12)
2. Create new wallet
3. Observe console during seed phrase display
4. See: "[WALLET] Generated seed: abandon abandon abandon..."

Impact:
- Anyone with DevTools access can steal the wallet
- Seed phrase exposed to console recording tools
- Violates fundamental security principle

Expected Behavior:
- Seed phrase should NEVER appear in console logs
- No sensitive data should be logged

Screenshot: [attached - showing console with seed phrase]

Environment:
- Extension version: 0.10.0
- Browser: Chrome 120
- OS: Windows 11
```

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
