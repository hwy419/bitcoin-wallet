# Account Management QA Test Plan
## Create Account & Import Account Features - v0.10.0

**Feature:** Enhanced Account Dropdown with Single-Sig Creation/Import
**Version:** v0.10.0
**Created:** October 18, 2025
**QA Engineer:** Manual Testing Team
**Priority:** P0 (Critical)
**Status:** Ready for Testing

---

## Table of Contents

1. [Test Plan Overview](#test-plan-overview)
2. [Feature Scope](#feature-scope)
3. [Test Environment Setup](#test-environment-setup)
4. [Test Data Preparation](#test-data-preparation)
5. [Test Cases - Create Account](#test-cases---create-account)
6. [Test Cases - Import Private Key](#test-cases---import-private-key)
7. [Test Cases - Import Seed Phrase](#test-cases---import-seed-phrase)
8. [Test Cases - UI/UX](#test-cases---uiux)
9. [Test Cases - Security](#test-cases---security)
10. [Test Cases - Integration](#test-cases---integration)
11. [Edge Cases & Error Scenarios](#edge-cases--error-scenarios)
12. [Accessibility Testing](#accessibility-testing)
13. [Performance Testing](#performance-testing)
14. [Regression Testing](#regression-testing)
15. [Release Readiness Checklist](#release-readiness-checklist)
16. [Bug Reporting Template](#bug-reporting-template)

---

## Test Plan Overview

### Purpose

This test plan provides comprehensive testing procedures for the new account management features:
- **Create Account** - Create HD-derived accounts from existing wallet seed
- **Import Account (Private Key)** - Import single-signature account from WIF private key
- **Import Account (Seed Phrase)** - Import account from external BIP39 seed phrase

### Objectives

1. Verify all account management workflows function correctly
2. Ensure UI/UX meets design specifications
3. Validate security controls and error handling
4. Confirm integration with existing wallet functionality
5. Test accessibility and performance requirements
6. Assess release readiness

### Test Strategy

- **Manual functional testing** of all workflows
- **Security-focused testing** for imported accounts
- **Real testnet validation** with actual transactions
- **Accessibility compliance** (WCAG 2.1 AA)
- **Performance benchmarking**
- **Regression testing** to ensure no existing features broken

### Entry Criteria

- [x] Frontend implementation complete
- [x] Backend message handlers implemented
- [x] Security audit approved (with critical fixes applied)
- [x] Unit tests passing
- [x] Extension builds successfully
- [x] Deployed to Chrome for testing

### Exit Criteria

- [ ] All P0 test cases passed
- [ ] All P1 test cases passed or documented
- [ ] No P0 or P1 bugs open
- [ ] Security tests passed
- [ ] Testnet validation completed
- [ ] Accessibility tests passed
- [ ] Performance benchmarks met
- [ ] Release readiness assessment approved

---

## Feature Scope

### What's Being Tested

**1. Enhanced Account Dropdown (Dashboard)**
- Three action buttons in correct order:
  1. "Create Account" (Primary - Bitcoin Orange)
  2. "Import Account" (Secondary - Gray)
  3. "Create Multisig Account" (Secondary - Gray with external link)
- Import badges displayed on imported accounts
- Button styling and visual hierarchy
- Click handlers and modal triggers

**2. Create Account Modal**
- Account name input (1-30 characters)
- Address type selector (Legacy/SegWit/Native SegWit)
- Character counter with color coding
- Form validation (real-time and on submit)
- HD derivation info box
- Success flow with toast notification

**3. Import Account Modal - Private Key**
- WIF format validation (testnet: starts with 'c')
- Account name input
- Security warning banner
- Real-time validation feedback
- Success flow with import badge

**4. Import Account Modal - Seed Phrase**
- BIP39 seed phrase validation (12 or 24 words)
- Word count indicator with checksum validation
- Account index selector (0-2,147,483,647)
- Address type dropdown
- Account name input
- Security warning banner
- Success flow with import badge

**5. Backend Operations**
- CREATE_ACCOUNT message handler
- IMPORT_ACCOUNT_PRIVATE_KEY message handler
- IMPORT_ACCOUNT_SEED message handler
- Rate limiting (5 operations per minute)
- Account limit enforcement (100 accounts)
- Entropy validation for weak seeds
- Memory cleanup for sensitive data

### What's Out of Scope

- Mainnet operations (testnet only)
- Hardware wallet integration
- Account deletion (future enhancement)
- Account export (future enhancement)
- Batch import operations
- Custom derivation paths

---

## Test Environment Setup

### Prerequisites

1. **Chrome Browser**
   - Version: Latest stable (Chrome 118+)
   - Extensions enabled
   - Developer mode enabled

2. **Extension Build**
   ```bash
   cd /home/michael/code_projects/bitcoin_wallet
   npm run build
   ```
   - Verify build succeeds without errors
   - Check `dist/` folder contains all files

3. **Extension Installation**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)
   - Click "Load unpacked"
   - Select `dist/` folder
   - Extension should appear with Bitcoin Wallet icon
   - Pin extension to toolbar for easy access

4. **Wallet Setup**
   - Create initial wallet OR use existing test wallet
   - Unlock wallet with password
   - Verify wallet is on testnet (not mainnet)
   - Have at least one existing account to test dropdown

5. **Testnet Resources**
   - **Faucet**: https://testnet-faucet.mempool.co/
   - **Block Explorer**: https://blockstream.info/testnet/
   - **Alternative Faucet**: https://bitcoinfaucet.uo1.net/

### Browser Console Setup

**Open DevTools:**
- Press F12 or Ctrl+Shift+I (Windows/Linux)
- Press Cmd+Option+I (Mac)

**Filter Console Logs:**
- Type "[ACCOUNT]" in console filter to see account-related logs
- Monitor for error messages during testing
- Check for security warnings

### Clean Test Environment

Before each major test session:

1. **Clear Extension State** (if needed):
   - Go to `chrome://extensions/`
   - Remove Bitcoin Wallet extension
   - Reinstall from `dist/` folder
   - Recreate test wallet

2. **Clear Browser Cache** (optional):
   - Settings → Privacy and Security → Clear browsing data
   - Select "Cached images and files"
   - Time range: All time
   - Click "Clear data"

3. **Reset Test Data**:
   - Delete any test accounts created in previous session
   - Use fresh testnet addresses for testing
   - Document test wallet seed phrase for reproducibility

---

## Test Data Preparation

### Test Wallets

**Primary Test Wallet:**
- Type: Native SegWit (recommended)
- Seed Phrase: [Document in secure location]
- Password: TestPassword123! (for testing only)
- First Address: [To be filled]
- Balance: [To be filled]

### Test Private Keys (WIF Format)

**Valid Testnet Private Key (Compressed):**
```
Purpose: Import as single account
Network: Testnet
Format: Compressed WIF (starts with 'c')
Key: [Obtain from testnet wallet or generate]
Expected Address: [To be filled]
```

**Valid Testnet Private Key (Uncompressed):**
```
Purpose: Test legacy address type
Network: Testnet
Format: Uncompressed WIF (starts with '9')
Key: [Obtain from testnet wallet or generate]
Expected Address: [To be filled]
```

**Invalid Test Cases:**
- Mainnet WIF (starts with '5', 'K', or 'L') - Should be rejected
- Malformed WIF (invalid checksum) - Should be rejected
- Random string - Should be rejected

### Test Seed Phrases

**Valid 12-Word Seed (Good Entropy):**
```
Purpose: Import seed phrase
Words: [Generate using BIP39 tool]
Network: Testnet
Account Index: 0
Expected Address: [To be filled]
```

**Valid 24-Word Seed (Good Entropy):**
```
Purpose: Test 24-word seed support
Words: [Generate using BIP39 tool]
Network: Testnet
Account Index: 0
Expected Address: [To be filled]
```

**Weak/Known Seeds (Should be Rejected):**
- `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`
- `zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong`
- `bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin`

**Invalid Test Cases:**
- 11 words - Should be rejected (invalid length)
- 13 words - Should be rejected (invalid length)
- 12 words with bad checksum - Should be rejected
- Seed with high word repetition - Should be rejected

### Test Account Names

**Valid Names:**
- "My Savings Account" (18 characters)
- "Test" (4 characters)
- "A" (1 character - minimum)
- "Exactly Thirty Characters!!" (30 characters - maximum)
- "Account with Emoji 💰" (Unicode characters)

**Invalid Names:**
- "" (empty string) - Should be rejected
- "This name is way too long and exceeds the limit" (50+ characters) - Should be rejected

### Testnet Bitcoin

**Funding Test Accounts:**
1. Generate receiving address in test wallet
2. Request testnet BTC from faucet (usually 0.01 BTC)
3. Wait for confirmation (~10-30 minutes)
4. Verify balance appears in wallet
5. Use funded accounts for testing imports

---

## Test Cases - Create Account

### TC-ACC-001: Create Account with Native SegWit (Recommended)

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, on Assets tab

**Test Steps:**
1. Open wallet and unlock
2. Navigate to Assets tab (Dashboard)
3. Click account dropdown (top of screen)
4. Verify "Create Account" button visible (orange, primary position)
5. Click "Create Account"
6. Modal opens with "Create New Account" title
7. Enter account name: "My Savings Account"
8. Observe character counter (18/30)
9. Address type defaults to "Native SegWit (Recommended)"
10. Review HD derivation info box
11. Click "Create Account" button
12. Wait for account creation

**Expected Results:**
- ✅ Modal opens in center of screen (800px wide)
- ✅ Account name field focused automatically
- ✅ Character counter displays correctly (18/30)
- ✅ Native SegWit pre-selected with "Recommended" badge
- ✅ Info box explains BIP44 derivation
- ✅ "Create Account" button enabled (form valid)
- ✅ Account created within 1 second
- ✅ Success toast appears: "Account 'My Savings Account' created successfully"
- ✅ Modal closes automatically
- ✅ New account appears in dropdown
- ✅ New account automatically selected
- ✅ Dashboard updates to show new account (balance 0 BTC)
- ✅ First address generated (starts with "tb1")
- ✅ **No import badge** displayed (HD-derived account)
- ✅ Account index incremented correctly (e.g., Account 1 → Account 2)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Tester:** _________________
**Date:** _________________
**Notes:** _________________

---

### TC-ACC-002: Create Account with SegWit (P2SH-P2WPKH)

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open account dropdown
2. Click "Create Account"
3. Enter name: "Business Account"
4. Change address type to "SegWit (P2SH-P2WPKH)"
5. Review benefits: "Moderate fees, good compatibility"
6. Click "Create Account"

**Expected Results:**
- ✅ SegWit option available in dropdown
- ✅ Description explains "Moderate fees"
- ✅ Derivation path shows BIP49 (m/49'/1'/N'/0/0)
- ✅ Account created successfully
- ✅ First address starts with "2" (testnet)
- ✅ No import badge displayed

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-ACC-003: Create Account with Legacy (P2PKH)

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open account dropdown
2. Click "Create Account"
3. Enter name: "Legacy Test"
4. Change address type to "Legacy (P2PKH)"
5. Review warning: "Higher fees, widest compatibility"
6. Click "Create Account"

**Expected Results:**
- ✅ Legacy option available
- ✅ Warning about higher fees displayed
- ✅ Derivation path shows BIP44 (m/44'/1'/N'/0/0)
- ✅ Account created successfully
- ✅ First address starts with "m" or "n" (testnet)
- ✅ No import badge displayed

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-ACC-004: Create Account - Character Counter Near Limit

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Enter name with 20 characters: "Account with Twenty!"
3. Observe character counter (20/30) - gray color
4. Add 8 more characters: "Account with Twenty Eight!!" (28 characters)
5. Observe character counter (28/30) - amber color
6. Add 2 more characters to reach limit: "Account with Exactly Thirty!" (30)
7. Observe character counter (30/30) - red color
8. Attempt to type 31st character
9. Click "Create Account"

**Expected Results:**
- ✅ Counter shows "20/30" in gray
- ✅ Counter shows "28/30" in amber (warning near limit)
- ✅ Counter shows "30/30" in red (at limit)
- ✅ Cannot type beyond 30 characters (hard limit)
- ✅ Account created successfully with 30-character name
- ✅ Full name displayed in dropdown (no truncation needed)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-ACC-005: Create Account - Empty Name Validation

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Leave account name field empty
3. Click "Create Account" button

**Expected Results:**
- ✅ "Create Account" button disabled (form invalid)
- ✅ OR error message displayed: "Account name is required"
- ✅ Cannot submit form with empty name
- ✅ Focus returns to name field

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-ACC-006: Create Account - Rate Limiting

**Priority:** P1 (High - Security)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Create 5 accounts rapidly (within 1 minute):
   - Account 1: "Test Account 1"
   - Account 2: "Test Account 2"
   - Account 3: "Test Account 3"
   - Account 4: "Test Account 4"
   - Account 5: "Test Account 5"
2. Immediately attempt to create 6th account
3. Observe error message

**Expected Results:**
- ✅ First 5 accounts created successfully
- ✅ 6th attempt blocked by rate limit
- ✅ Error message: "Too many import attempts. Please wait [X] seconds before trying again."
- ✅ Wait time displayed (e.g., "wait 45 seconds")
- ✅ After waiting, can create account again
- ✅ Rate limit counter resets after 60 seconds

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Notes:** Rate limit should allow 5 operations per 60-second window

---

### TC-ACC-007: Create Account - Account Limit (100 Max)

**Priority:** P2 (Medium - Security)
**Prerequisites:** Wallet with 99 accounts

**Test Steps:**
1. Create wallet with 99 existing accounts (use automated script if available)
2. Create 100th account normally
3. Verify 100th account created successfully
4. Attempt to create 101st account

**Expected Results:**
- ✅ 100th account created successfully
- ✅ 101st attempt blocked
- ✅ Error message: "Maximum number of accounts (100) reached. Please delete unused accounts."
- ✅ Clear explanation of limit
- ✅ Cannot create more than 100 accounts

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Notes:** May need special test setup to reach 99 accounts

---

### TC-ACC-008: Create Account - Modal Close Behavior

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Enter partial account name: "Test"
3. Click backdrop (outside modal)
4. Verify modal closes
5. Reopen "Create Account" modal
6. Verify form is empty (no data persistence)
7. Enter account name: "Test Account"
8. Press ESC key
9. Verify modal closes

**Expected Results:**
- ✅ Clicking backdrop closes modal
- ✅ Form data not saved when closed without submitting
- ✅ Reopening shows empty form
- ✅ ESC key closes modal
- ✅ No account created when modal closed without submitting

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Test Cases - Import Private Key

### TC-IMP-001: Import Valid Testnet Private Key (Compressed)

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, valid testnet WIF available

**Test Steps:**
1. Obtain valid testnet WIF private key (compressed, starts with 'c')
2. Open account dropdown
3. Click "Import Account" button (gray, second position)
4. Modal opens with tabs: [Private Key] [Seed Phrase]
5. Verify "Private Key" tab active by default
6. Observe security warning banner (amber background)
7. Read warning: "Imported accounts are NOT backed up by your wallet's main seed phrase..."
8. Paste WIF private key into textarea
9. Observe real-time validation (green border if valid)
10. Enter account name: "Imported Paper Wallet"
11. Click "Import Account" button
12. Wait for import

**Expected Results:**
- ✅ Modal opens with tabbed interface
- ✅ "Private Key" tab active by default
- ✅ Security warning displayed prominently (amber banner)
- ✅ Warning text clear and understandable
- ✅ Textarea accepts paste operation
- ✅ Real-time validation shows green border for valid WIF
- ✅ "Import Account" button enabled after name entered
- ✅ Import completes within 1 second
- ✅ Success toast: "Account 'Imported Paper Wallet' imported successfully"
- ✅ Additional toast/warning: "Remember to back up this key!"
- ✅ Modal closes automatically
- ✅ Imported account appears in dropdown
- ✅ **Import badge displayed** (blue download arrow icon)
- ✅ Tooltip on import badge: "Imported account - Back up separately"
- ✅ Address matches expected address for WIF
- ✅ Balance displayed correctly (if funded)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**WIF Used:** _________________
**Expected Address:** _________________
**Actual Address:** _________________

---

### TC-IMP-002: Import Valid Testnet Private Key (Uncompressed)

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, uncompressed testnet WIF available

**Test Steps:**
1. Obtain valid testnet WIF (uncompressed, starts with '9')
2. Open "Import Account" → "Private Key" tab
3. Paste uncompressed WIF
4. Enter name: "Legacy Imported"
5. Click "Import Account"

**Expected Results:**
- ✅ Uncompressed WIF accepted
- ✅ Address type auto-detected as Legacy (P2PKH)
- ✅ Address starts with "m" or "n" (testnet legacy)
- ✅ Import successful
- ✅ Import badge displayed

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-IMP-003: Reject Invalid WIF Format

**Priority:** P0 (Critical - Security)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" → "Private Key" tab
2. Enter invalid WIF: "this is not a valid WIF key"
3. Observe validation error (red border)
4. Click "Import Account" (if enabled)

**Expected Results:**
- ✅ Real-time validation shows red border
- ✅ Error message: "Invalid WIF private key format. Expected testnet key starting with 'c'."
- ✅ "Import Account" button disabled OR shows error on click
- ✅ Import rejected
- ✅ Clear guidance on correct format

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-IMP-004: Reject Mainnet Private Key

**Priority:** P0 (Critical - Security)
**Prerequisites:** Wallet unlocked, mainnet WIF available

**Test Steps:**
1. Open "Import Account" → "Private Key" tab
2. Paste mainnet WIF (starts with '5', 'K', or 'L')
3. Click "Import Account"

**Expected Results:**
- ✅ Network validation fails
- ✅ Error message: "This appears to be a MAINNET private key. This wallet only supports TESTNET. Do NOT import mainnet keys."
- ✅ Import rejected
- ✅ Strong warning about network mismatch
- ✅ User educated on correct network

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Mainnet WIF Used (Test Only):** _________________

---

### TC-IMP-005: Reject Duplicate Private Key

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, account already imported from specific WIF

**Test Steps:**
1. Import account from WIF (e.g., "First Import")
2. Verify import successful
3. Attempt to import same WIF again with different name ("Second Import")
4. Observe duplicate detection

**Expected Results:**
- ✅ First import successful
- ✅ Second import blocked
- ✅ Error message: "This private key has already been imported as 'First Import'"
- ✅ Existing account name shown in error
- ✅ Cannot create duplicate account
- ✅ User guided to use existing account

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-IMP-006: Import Private Key - Rate Limiting

**Priority:** P1 (High - Security)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Import 5 private keys rapidly (within 1 minute)
2. Attempt 6th import immediately
3. Observe rate limit enforcement

**Expected Results:**
- ✅ First 5 imports successful
- ✅ 6th attempt blocked
- ✅ Error: "Too many import attempts. Please wait [X] seconds before trying again."
- ✅ Wait time displayed
- ✅ After 60 seconds, can import again

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Test Cases - Import Seed Phrase

### TC-SEED-001: Import Valid 12-Word Seed Phrase

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, valid 12-word BIP39 seed available

**Test Steps:**
1. Generate valid 12-word BIP39 seed phrase (good entropy)
2. Open "Import Account" modal
3. Click "Seed Phrase" tab
4. Observe security warning (amber banner)
5. Read warning: "This account uses a different seed phrase. Back it up separately..."
6. Paste 12-word seed into textarea
7. Observe word counter: "Words: 12/12 ✓"
8. Observe checksum validation: "Valid checksum ✓"
9. Account Index defaults to 0 (leave as is)
10. Address Type defaults to "Native SegWit (Recommended)"
11. Enter account name: "Imported from Electrum"
12. Click "Import Account"

**Expected Results:**
- ✅ "Seed Phrase" tab switches correctly
- ✅ Security warning displayed (different from private key warning)
- ✅ Textarea accepts multi-line paste
- ✅ Word counter shows "12/12 ✓" (green checkmark)
- ✅ Checksum validates correctly: "Valid checksum ✓"
- ✅ Account index field defaults to 0
- ✅ Can modify account index (test with 0)
- ✅ Address type dropdown functional
- ✅ Import completes within 2 seconds
- ✅ Success toast: "Account 'Imported from Electrum' imported successfully"
- ✅ Reminder toast: "Remember to back up this seed!"
- ✅ Modal closes
- ✅ Imported account in dropdown
- ✅ **Import badge displayed**
- ✅ Address derived correctly (account index 0)
- ✅ Balance displayed if funded

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Seed Used:** _________________ (first 4 words only for documentation)
**Account Index:** 0
**Expected Address:** _________________
**Actual Address:** _________________

---

### TC-SEED-002: Import Valid 24-Word Seed Phrase

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, valid 24-word seed available

**Test Steps:**
1. Generate valid 24-word BIP39 seed
2. Open "Import Account" → "Seed Phrase" tab
3. Paste 24-word seed
4. Observe word counter: "Words: 24/24 ✓"
5. Verify checksum valid
6. Enter name: "24-Word Import"
7. Click "Import Account"

**Expected Results:**
- ✅ Word counter shows "24/24 ✓"
- ✅ Checksum valid
- ✅ Import successful
- ✅ Import badge displayed
- ✅ Address derived correctly

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEED-003: Reject Known Weak Seed Phrase

**Priority:** P0 (Critical - Security)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" → "Seed Phrase" tab
2. Paste known weak seed: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
3. Observe validation error
4. Click "Import Account" (if enabled)

**Expected Results:**
- ✅ Word counter shows "12/12" (correct count)
- ✅ Checksum shows valid (technically valid BIP39)
- ✅ **Entropy validation triggers**
- ✅ Error message: "This seed phrase is publicly known and insecure. Please use a different seed."
- ✅ Import rejected
- ✅ Cannot proceed with known weak seed
- ✅ User protected from using test vectors

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Notes:** Tests backend entropy validation

---

### TC-SEED-004: Reject Seed with High Word Repetition

**Priority:** P1 (High - Security)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" → "Seed Phrase" tab
2. Create seed with high repetition: "bitcoin bitcoin bitcoin abandon abandon abandon ability ability ability able able above"
3. Paste into textarea
4. Attempt to import

**Expected Results:**
- ✅ Word counter shows "12/12"
- ✅ Checksum may be invalid (reject) OR entropy validation triggers
- ✅ Error: "This seed phrase has too much word repetition and may be weak. Please use a different seed."
- ✅ Import rejected
- ✅ Threshold: <75% unique words triggers rejection

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEED-005: Invalid Word Count (11 Words)

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" → "Seed Phrase" tab
2. Paste 11-word phrase (remove last word from valid 12-word seed)
3. Observe validation

**Expected Results:**
- ✅ Word counter shows "11/12" (amber or red, not green)
- ✅ Checksum shows invalid
- ✅ Error message: "Expected 12 or 24 words"
- ✅ "Import Account" button disabled
- ✅ Cannot import with wrong word count

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEED-006: Invalid Checksum

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" → "Seed Phrase" tab
2. Take valid 12-word seed
3. Change last word to break checksum (e.g., change "about" to "abandon")
4. Paste modified seed
5. Attempt to import

**Expected Results:**
- ✅ Word counter shows "12/12"
- ✅ Checksum shows "Invalid checksum" (red, with X icon)
- ✅ Error message: "Invalid BIP39 seed phrase. Please check and try again."
- ✅ "Import Account" button disabled
- ✅ Cannot import with invalid checksum

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEED-007: Different Account Indices

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, valid seed phrase

**Test Steps:**
1. Import seed with account index 0 (name: "Seed Index 0")
2. Verify import successful, note first address
3. Import SAME seed with account index 1 (name: "Seed Index 1")
4. Verify different address generated
5. Import SAME seed with account index 10 (name: "Seed Index 10")
6. Verify different address again

**Expected Results:**
- ✅ Can import same seed with different account indices
- ✅ Each index generates different address
- ✅ Addresses follow BIP44 derivation (m/84'/1'/N'/0/0 where N = index)
- ✅ All three imports successful
- ✅ All three show import badge
- ✅ Duplicate detection doesn't trigger (different addresses)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Index 0 Address:** _________________
**Index 1 Address:** _________________
**Index 10 Address:** _________________

---

### TC-SEED-008: Account Index - Edge Cases

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked, valid seed phrase

**Test Steps:**
1. Attempt to import with account index: 0 (minimum) - Should succeed
2. Attempt to import with account index: 100 - Should succeed
3. Attempt to import with account index: 2147483647 (maximum, BIP44 hardened limit) - Should succeed
4. Attempt to import with account index: -1 (negative) - Should fail
5. Attempt to import with account index: 2147483648 (exceeds limit) - Should fail

**Expected Results:**
- ✅ Index 0: Success
- ✅ Index 100: Success (with warning: "Using large account index. This is uncommon.")
- ✅ Index 2147483647: Success (with warning)
- ✅ Index -1: Error: "Must be between 0 and 2,147,483,647"
- ✅ Index 2147483648: Error: "Must be between 0 and 2,147,483,647"

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEED-009: Import Seed - Different Address Types

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, valid seed phrase

**Test Steps:**
1. Import seed with Native SegWit (P2WPKH) - account index 0
   - Name: "Seed Native SegWit"
   - Note address (should start with "tb1")
2. Import SAME seed with SegWit (P2SH-P2WPKH) - account index 0
   - Name: "Seed SegWit"
   - Note address (should start with "2")
3. Import SAME seed with Legacy (P2PKH) - account index 0
   - Name: "Seed Legacy"
   - Note address (should start with "m" or "n")

**Expected Results:**
- ✅ All three imports successful
- ✅ Same seed, same index, different address types generate different addresses
- ✅ Derivation paths correct:
  - Native SegWit: m/84'/1'/0'/0/0
  - SegWit: m/49'/1'/0'/0/0
  - Legacy: m/44'/1'/0'/0/0
- ✅ All show import badge
- ✅ Duplicate detection doesn't trigger (different addresses)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Native SegWit Address:** _________________
**SegWit Address:** _________________
**Legacy Address:** _________________

---

## Test Cases - UI/UX

### TC-UI-001: Account Dropdown Button Hierarchy

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open account dropdown (click account selector)
2. Scroll to bottom of dropdown
3. Observe three action buttons

**Expected Results:**
- ✅ Three buttons visible in correct order (top to bottom):
  1. "Create Account" - Primary (Bitcoin Orange #F7931A)
  2. "Import Account" - Secondary (Gray #1E1E1E with border)
  3. "Create Multisig Account" - Secondary (Gray with external link icon)
- ✅ "Create Account" button has orange background
- ✅ "Import Account" and "Create Multisig" have gray background
- ✅ All buttons full width
- ✅ All buttons same height (48px)
- ✅ Consistent padding and spacing
- ✅ Icons displayed correctly:
  - Plus icon (+) for "Create Account"
  - Download arrow (↓) for "Import Account"
  - Plus and external link for "Create Multisig Account"

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-002: Import Badge Display

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, at least one imported account

**Test Steps:**
1. Import account (either private key or seed)
2. Verify import successful
3. Open account dropdown
4. Locate imported account in list
5. Observe import badge

**Expected Results:**
- ✅ Blue download arrow icon (↓) displayed next to account name
- ✅ Icon color: #60A5FA (blue-400)
- ✅ Icon size: 16px
- ✅ Icon positioned after account name, before address type badge
- ✅ Hover over icon shows tooltip
- ✅ Tooltip text: "Imported account - Back up separately"
- ✅ Tooltip appears within 300ms of hover
- ✅ Badge NOT displayed on HD-derived accounts

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-003: Modal Appearance and Layout

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Measure modal width (use browser DevTools)
3. Verify modal centered on screen
4. Check header, content, footer sections
5. Close modal
6. Open "Import Account" modal
7. Repeat measurements and observations

**Expected Results:**
- ✅ Modal width: 800px
- ✅ Modal centered horizontally and vertically
- ✅ Backdrop: Dark overlay (70% opacity) with blur
- ✅ Header: Title, close button (X)
- ✅ Content: Form fields with proper spacing
- ✅ Footer: Cancel and primary action buttons
- ✅ Modal has rounded corners (16px border radius)
- ✅ Box shadow visible (elevation effect)
- ✅ Scrollable content if needed (max-height 90vh)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-004: Form Validation - Real-Time Feedback

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Click in account name field (focus)
3. Observe focus state (orange border)
4. Type name: "Test"
5. Observe character counter updating
6. Clear name field (delete all text)
7. Click outside field (blur)
8. Observe validation error appears
9. Re-enter name
10. Observe error disappears

**Expected Results:**
- ✅ Focus state: Orange border (#F7931A) appears
- ✅ Character counter updates in real-time (4/30)
- ✅ Blur with empty field shows error: "Account name is required"
- ✅ Error message in red (#EF4444)
- ✅ Alert icon displayed next to error
- ✅ Re-entering text clears error immediately
- ✅ "Create Account" button disabled when error present

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-005: Security Warning Banner Visibility

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" modal
2. Observe "Private Key" tab (default)
3. Read security warning banner
4. Switch to "Seed Phrase" tab
5. Read different security warning
6. Compare warning content

**Expected Results:**
- ✅ **Private Key Tab Warning:**
  - Amber background with left border
  - Warning triangle icon (⚠️)
  - Text: "Imported accounts are NOT backed up by your wallet's main seed phrase. You must back up this private key separately or risk losing access to these funds."
  - Bold text on critical parts
- ✅ **Seed Phrase Tab Warning:**
  - Same amber styling
  - Text: "This account uses a different seed phrase than your main wallet. Back it up separately from your main wallet seed."
  - Clear and understandable

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-006: Toast Notification Display

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Create new account successfully
2. Observe success toast notification
3. Note toast position, duration, and styling
4. Wait for toast to auto-dismiss
5. Attempt operation that fails (e.g., empty name)
6. Observe error toast (if applicable)

**Expected Results:**
- ✅ Success toast appears in top-right corner
- ✅ Green checkmark icon
- ✅ Message: "Account '[name]' created successfully"
- ✅ Auto-dismisses after 3 seconds
- ✅ Slide-in animation from right
- ✅ Can manually dismiss with X button
- ✅ Error toasts have red styling (if errors show as toasts)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-007: Tab Navigation in Import Modal

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Import Account" modal
2. Verify "Private Key" tab active (orange underline)
3. Click "Seed Phrase" tab
4. Observe tab switch animation
5. Verify "Seed Phrase" tab now active
6. Click "Private Key" tab again
7. Verify content switches correctly

**Expected Results:**
- ✅ Active tab has orange underline (#F7931A)
- ✅ Active tab text is orange
- ✅ Inactive tab text is gray
- ✅ Smooth transition when switching tabs
- ✅ Content area updates to show correct form
- ✅ Form data NOT persisted when switching tabs
- ✅ Security warning updates for each tab

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-UI-008: Responsive Layout (Window Resize)

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Resize browser window to various widths:
   - 1920px (large desktop)
   - 1280px (small desktop)
   - 1024px (tablet landscape)
   - 800px (tablet portrait)
3. Observe modal behavior at each size

**Expected Results:**
- ✅ Modal maintains 800px width at larger sizes
- ✅ Modal scales down appropriately at smaller sizes (max-width: 90vw)
- ✅ Content remains readable at all sizes
- ✅ No horizontal scrolling within modal
- ✅ Buttons remain accessible
- ✅ Form layout adapts gracefully

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Test Cases - Security

### TC-SEC-001: Password Required for Operations

**Priority:** P0 (Critical)
**Prerequisites:** Wallet locked

**Test Steps:**
1. Lock wallet (click lock icon or wait for auto-lock)
2. Attempt to open account dropdown
3. Observe behavior

**Expected Results:**
- ✅ Cannot open account dropdown when locked
- ✅ OR dropdown opens but buttons disabled
- ✅ User must unlock wallet first
- ✅ Unlock screen displayed
- ✅ After unlocking, can access account management

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEC-002: Entropy Validation - Weak Seeds Rejected

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Attempt to import each known weak seed:
   - "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
   - "zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong"
   - "bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin"
2. Observe rejection for each

**Expected Results:**
- ✅ All weak seeds rejected
- ✅ Error message clear: "This seed phrase is publicly known and insecure. Please use a different seed."
- ✅ User cannot proceed with any weak seed
- ✅ Import blocked before any account created

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEC-003: Network Validation - Mainnet Keys Rejected

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, mainnet WIF key available

**Test Steps:**
1. Attempt to import mainnet WIF (starts with '5', 'K', or 'L')
2. Observe network validation error
3. Verify no account created

**Expected Results:**
- ✅ Mainnet key detected
- ✅ Error: "This appears to be a MAINNET private key. This wallet only supports TESTNET. Do NOT import mainnet keys."
- ✅ Import blocked
- ✅ Strong warning displayed
- ✅ User educated about network mismatch

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-SEC-004: Error Messages - No Sensitive Data Leaked

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, browser console open

**Test Steps:**
1. Attempt invalid import (e.g., malformed WIF)
2. Observe error message in UI
3. Check browser console for logs
4. Attempt import with weak seed
5. Observe error message
6. Check console again

**Expected Results:**
- ✅ Error messages generic and safe
- ✅ NO private keys in error messages
- ✅ NO seed phrases in error messages
- ✅ Console logs do NOT contain sensitive data
- ✅ Error: "Invalid private key format" (not "Invalid key: cVhT8DRG...")
- ✅ No payload data logged to console

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Console Review:** _________________

---

### TC-SEC-005: Memory Cleanup (Manual DevTools Inspection)

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, Chrome DevTools open

**Test Steps:**
1. Open DevTools → Memory tab
2. Take heap snapshot (baseline)
3. Import account from private key
4. Wait 5 seconds after import completes
5. Take second heap snapshot
6. Search for WIF pattern in memory (regex: /c[0-9A-Za-z]{51}/)
7. Search for seed phrase words in memory

**Expected Results:**
- ✅ No WIF private key found in memory after import
- ✅ No seed phrase words found in memory after import
- ✅ Sensitive data cleared from memory
- ✅ Only encrypted data persists in storage
- ✅ Memory cleanup happens in finally blocks

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Notes:** Advanced test - may require developer assistance

---

## Test Cases - Integration

### TC-INT-001: Create Account - End-to-End Workflow

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, funded test wallet

**Test Steps:**
1. Create new account: "E2E Test Account"
2. Verify account created and selected
3. Navigate to Receive screen
4. Generate receiving address
5. Send testnet BTC to this address (from external faucet)
6. Wait for confirmation
7. Verify balance updates
8. Navigate to Send screen
9. Create send transaction to another address
10. Sign and broadcast transaction
11. Verify transaction appears in history

**Expected Results:**
- ✅ Account created successfully
- ✅ Address generated (correct format for address type)
- ✅ Can receive Bitcoin to new account
- ✅ Balance displays correctly after confirmation
- ✅ Can send Bitcoin from new account
- ✅ Transaction signs successfully
- ✅ Transaction broadcasts successfully
- ✅ Transaction appears in history
- ✅ Full wallet functionality works with created account

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Account Address:** _________________
**Receive TX:** _________________
**Send TX:** _________________

---

### TC-INT-002: Import Private Key - End-to-End Workflow

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, funded WIF private key

**Test Steps:**
1. Import account from WIF (funded with testnet BTC)
2. Verify import badge displayed
3. Check balance displays correctly
4. Navigate to Send screen
5. Create transaction to send all funds
6. Sign with password
7. Broadcast transaction
8. Verify transaction successful

**Expected Results:**
- ✅ Import successful with badge
- ✅ Balance detected and displayed
- ✅ Can create transaction from imported account
- ✅ Signing works (password required)
- ✅ Transaction broadcasts
- ✅ Transaction confirmed on block explorer
- ✅ Imported account fully functional

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**WIF Address:** _________________
**Transaction:** _________________

---

### TC-INT-003: Import Seed Phrase - End-to-End Workflow

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked, funded seed phrase

**Test Steps:**
1. Import account from seed phrase (account index 0, funded)
2. Verify import badge displayed
3. Check balance
4. Generate new receiving address (index 1)
5. Send funds to new address
6. Create outgoing transaction
7. Sign and broadcast

**Expected Results:**
- ✅ Import successful with badge
- ✅ Balance detected
- ✅ Can generate additional addresses
- ✅ Derivation path correct for account index
- ✅ Can send and receive
- ✅ Full HD wallet functionality works

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-INT-004: Account Switching After Creation/Import

**Priority:** P1 (High)
**Prerequisites:** Wallet with 3+ accounts (HD, imported key, imported seed)

**Test Steps:**
1. Verify 3 accounts exist:
   - Account 1 (HD-derived, no badge)
   - Imported Key (import badge)
   - Imported Seed (import badge)
2. Open account dropdown
3. Click Account 1 → Verify switch
4. Dashboard updates to show Account 1 balance
5. Click Imported Key → Verify switch
6. Dashboard shows Imported Key balance
7. Click Imported Seed → Verify switch
8. Dashboard shows Imported Seed balance

**Expected Results:**
- ✅ All three accounts listed in dropdown
- ✅ Import badges displayed correctly (2 of 3)
- ✅ Can switch between all accounts
- ✅ Dashboard updates immediately on switch
- ✅ Balance, address, and transaction history update
- ✅ No errors during switching
- ✅ Selected account persists after page refresh

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-INT-005: Wallet Lock/Unlock with Imported Accounts

**Priority:** P1 (High)
**Prerequisites:** Wallet with imported account

**Test Steps:**
1. Import account (note name and address)
2. Lock wallet (manual lock or wait for auto-lock)
3. Unlock wallet with password
4. Open account dropdown
5. Verify imported account still present
6. Verify import badge still displayed
7. Select imported account
8. Verify balance displays correctly

**Expected Results:**
- ✅ Imported account persists after lock
- ✅ Import badge still shown after unlock
- ✅ Account data intact (name, address, balance)
- ✅ Can access imported account after unlock
- ✅ No data loss during lock/unlock cycle

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-INT-006: Extension Reload Persistence

**Priority:** P1 (High)
**Prerequisites:** Wallet with created and imported accounts

**Test Steps:**
1. Create 1 new account and import 1 account
2. Note account names and addresses
3. Go to chrome://extensions/
4. Click "Reload" button for Bitcoin Wallet extension
5. Reopen wallet and unlock
6. Open account dropdown
7. Verify both accounts present

**Expected Results:**
- ✅ Both accounts persist after extension reload
- ✅ Import badge still displayed on imported account
- ✅ Account names unchanged
- ✅ Balances reload correctly
- ✅ Can switch between accounts normally
- ✅ No data corruption

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Edge Cases & Error Scenarios

### TC-EDGE-001: Create Account While Wallet Locking

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked, 15-minute auto-lock enabled

**Test Steps:**
1. Unlock wallet
2. Open "Create Account" modal
3. Enter account name
4. Wait for wallet to auto-lock (15 minutes of inactivity)
5. Attempt to submit form

**Expected Results:**
- ✅ Form submission fails
- ✅ Error: "Wallet has been locked. Please unlock to continue."
- ✅ OR modal closes and unlock screen shown
- ✅ Form data preserved (nice to have)
- ✅ After unlocking, can retry

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-EDGE-002: Rapid Button Clicking (Double Submit)

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Enter valid name
3. Click "Create Account" button rapidly multiple times (3-5 clicks)
4. Observe behavior

**Expected Results:**
- ✅ Only one account created (no duplicates)
- ✅ Button disabled after first click
- ✅ Loading state prevents multiple submissions
- ✅ Rate limiting may trigger if extremely fast
- ✅ No duplicate accounts with same name

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-EDGE-003: Very Long Account Name (Unicode, Emoji)

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Enter name with emoji: "My Bitcoin Wallet 💰🚀"
3. Observe character counter
4. Create account
5. Verify account name displays correctly in dropdown

**Expected Results:**
- ✅ Emoji accepted in account name
- ✅ Character counter counts correctly (Unicode-aware)
- ✅ Name displays correctly in dropdown
- ✅ Name truncated with ellipsis if too long
- ✅ No encoding issues

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-EDGE-004: Import During Network Interruption

**Priority:** P2 (Medium)
**Prerequisites:** Wallet unlocked, ability to disable network

**Test Steps:**
1. Open "Import Account" modal
2. Enter valid WIF or seed
3. Disable network (airplane mode or DevTools offline)
4. Click "Import Account"
5. Observe behavior

**Expected Results:**
- ✅ Import may succeed (local operation)
- ✅ OR error displayed: "Network error, please try again"
- ✅ Account created locally even without network
- ✅ Balance may show 0 until network restored
- ✅ No data corruption

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### TC-EDGE-005: Maximum Name Length with Multibyte Characters

**Priority:** P3 (Low)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal
2. Enter 30 characters including emoji and Chinese characters
3. Example: "Bitcoin钱包💰🚀💎📈🔒🌙" (test exact byte count)
4. Verify character counter
5. Attempt to exceed limit

**Expected Results:**
- ✅ Counter counts characters, not bytes
- ✅ Maximum 30 characters enforced
- ✅ Multibyte characters handled correctly
- ✅ Storage handles Unicode properly

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Accessibility Testing

### ACC-001: Keyboard Navigation - Create Account Modal

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Open "Create Account" modal (via dropdown or keyboard shortcut if available)
2. Press Tab → Verify focus moves to account name field
3. Press Tab → Verify focus moves to address type dropdown
4. Press Tab → Verify focus moves to "Create Account" button
5. Press Tab → Verify focus moves to "Cancel" button
6. Press Tab → Verify focus wraps to close button (X) or cycles
7. Press Shift+Tab → Verify reverse tab order
8. Press Escape → Verify modal closes

**Expected Results:**
- ✅ Logical tab order (name → type → create → cancel → close)
- ✅ Focus visible on all elements (orange ring or outline)
- ✅ No keyboard traps
- ✅ Tab wraps appropriately
- ✅ Shift+Tab works in reverse
- ✅ Escape closes modal
- ✅ Focus returns to trigger button after close

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### ACC-002: Screen Reader - Form Labels

**Priority:** P1 (High)
**Prerequisites:** Screen reader installed (NVDA, JAWS, or VoiceOver)

**Test Steps:**
1. Enable screen reader
2. Open "Create Account" modal
3. Navigate to account name field
4. Listen to screen reader announcement
5. Navigate to address type dropdown
6. Listen to announcement
7. Trigger error (empty name, blur)
8. Listen to error announcement

**Expected Results:**
- ✅ Label announced: "Account name, required, text input"
- ✅ Helper text announced: "Enter a name for this account"
- ✅ Address type announced: "Address type, dropdown"
- ✅ Error announced: "Error, Account name is required"
- ✅ Required fields clearly indicated
- ✅ Button purposes announced

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Screen Reader Used:** _________________

---

### ACC-003: Color Contrast

**Priority:** P1 (High)
**Prerequisites:** Color contrast checker tool

**Test Steps:**
1. Measure color contrast ratios:
   - Orange button text (#FFFFFF) on orange background (#F7931A)
   - Gray button text (#D1D5DB) on gray background (#1E1E1E)
   - Error text (#EF4444) on dark background (#1A1A1A)
   - Import badge blue (#60A5FA) on dark background
2. Verify all ratios meet WCAG 2.1 AA (4.5:1 for text)

**Expected Results:**
- ✅ All text contrast ratios ≥ 4.5:1
- ✅ Icon colors meet contrast requirements
- ✅ Error messages clearly visible
- ✅ Security warnings readable
- ✅ No color-only information (icons + text)

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Contrast Ratios:**
- Orange button: _________
- Gray button: _________
- Error text: _________
- Import badge: _________

---

## Performance Testing

### PERF-001: Account Creation Speed

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked, performance profiling enabled

**Test Steps:**
1. Open Chrome DevTools → Performance tab
2. Start recording
3. Open "Create Account" modal
4. Enter name: "Performance Test"
5. Click "Create Account"
6. Wait for toast notification
7. Stop recording
8. Measure time from button click to toast appearance

**Expected Results:**
- ✅ Account creation completes in <1 second
- ✅ 95th percentile under 1 second (test 10 times)
- ✅ UI remains responsive during creation
- ✅ No noticeable lag

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED
**Average Time:** _________ ms
**95th Percentile:** _________ ms

---

### PERF-002: Import Account Speed

**Priority:** P1 (High)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Measure time for private key import (10 iterations)
2. Measure time for seed phrase import (10 iterations)
3. Calculate averages

**Expected Results:**
- ✅ Private key import: <1 second average
- ✅ Seed phrase import: <2 seconds average
- ✅ No performance degradation over multiple imports
- ✅ UI responsive throughout

**Actual Results:** _________________
**Private Key Avg:** _________ ms
**Seed Phrase Avg:** _________ ms

---

### PERF-003: Dropdown Performance with Many Accounts

**Priority:** P2 (Medium)
**Prerequisites:** Wallet with 50+ accounts

**Test Steps:**
1. Create/import 50 accounts (use script if available)
2. Open account dropdown
3. Measure dropdown render time
4. Scroll through account list
5. Observe scrolling performance

**Expected Results:**
- ✅ Dropdown opens in <500ms even with 50 accounts
- ✅ Scrolling smooth (60fps)
- ✅ No lag when hovering over accounts
- ✅ Render time acceptable

**Actual Results:** _________________
**Dropdown Open Time:** _________ ms
**Scrolling:** [ ] Smooth [ ] Laggy

---

## Regression Testing

### REG-001: Existing Account Creation Still Works

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Verify existing account creation method still works
2. Create account through any existing flow (if different from new dropdown)
3. Verify no regression

**Expected Results:**
- ✅ All existing account creation methods work
- ✅ No functionality lost
- ✅ Existing accounts unaffected

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### REG-002: Multisig Account Creation Unchanged

**Priority:** P0 (Critical)
**Prerequisites:** Wallet unlocked

**Test Steps:**
1. Click "Create Multisig Account" in dropdown
2. Verify wizard opens in new tab
3. Complete multisig setup
4. Verify multisig badge displayed (not import badge)

**Expected Results:**
- ✅ Multisig wizard opens correctly
- ✅ Multisig creation unchanged
- ✅ Multisig badge displayed (not import badge)
- ✅ No regression in multisig functionality

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

### REG-003: Send/Receive Functions Unchanged

**Priority:** P0 (Critical)
**Prerequisites:** Wallet with created or imported account

**Test Steps:**
1. Select created account
2. Navigate to Send screen → Create transaction
3. Navigate to Receive screen → Generate address
4. Verify all functions work normally

**Expected Results:**
- ✅ Send screen functional
- ✅ Receive screen functional
- ✅ Transaction creation works
- ✅ Address generation works
- ✅ No regression

**Actual Results:** _________________
**Status:** [ ] PASS [ ] FAIL [ ] BLOCKED

---

## Release Readiness Checklist

### Functionality

- [ ] All P0 test cases executed and passed
- [ ] All P1 test cases executed and passed or documented
- [ ] P2 test cases executed (best effort)
- [ ] No P0 or P1 bugs open
- [ ] P2/P3 bugs documented for future releases

### Security

- [ ] All security test cases passed (TC-SEC-001 through TC-SEC-005)
- [ ] Entropy validation working (weak seeds rejected)
- [ ] Network validation working (mainnet keys rejected)
- [ ] Rate limiting enforced (5 operations per minute)
- [ ] Account limit enforced (100 accounts max)
- [ ] No sensitive data in console logs
- [ ] Error messages sanitized
- [ ] Memory cleanup verified (manual inspection)

### Integration

- [ ] Created accounts fully functional (send/receive)
- [ ] Imported accounts fully functional (send/receive)
- [ ] Account switching works correctly
- [ ] Import badges display consistently
- [ ] Wallet lock/unlock preserves account data
- [ ] Extension reload preserves accounts
- [ ] No data corruption observed

### User Experience

- [ ] Modal layouts correct (800px centered)
- [ ] Button hierarchy clear (orange primary, gray secondary)
- [ ] Character counters accurate
- [ ] Security warnings visible and clear
- [ ] Toast notifications display correctly
- [ ] Tab navigation smooth (import modal)
- [ ] Form validation provides good feedback
- [ ] Error messages helpful and actionable

### Accessibility

- [ ] Keyboard navigation working (all modals)
- [ ] Screen reader labels correct
- [ ] Color contrast meets WCAG 2.1 AA
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Error messages announced by screen readers

### Performance

- [ ] Account creation <1 second (95th percentile)
- [ ] Private key import <1 second average
- [ ] Seed phrase import <2 seconds average
- [ ] Dropdown responsive with 50+ accounts
- [ ] No memory leaks observed
- [ ] UI remains responsive throughout

### Testnet Validation

- [ ] At least one HD account created on testnet
- [ ] At least one private key imported on testnet
- [ ] At least one seed phrase imported on testnet
- [ ] Transactions successful from all account types
- [ ] Balances display correctly
- [ ] Addresses verified on block explorer

### Documentation

- [ ] Test results documented in this plan
- [ ] Bugs filed with reproduction steps
- [ ] Known issues documented
- [ ] Release notes drafted
- [ ] User guide updated (if applicable)

### Sign-Off

**QA Engineer:** _________________ **Date:** _________________

**Product Manager:** _________________ **Date:** _________________

**Security Expert:** _________________ **Date:** _________________

**READY FOR RELEASE:** [ ] YES [ ] NO

**Blocker Issues (if any):** _________________

---

## Bug Reporting Template

Use this template when filing bugs during testing.

---

**Bug ID:** BUG-ACC-XXX

**Title:** [Short description]

**Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low

**Priority:** [ ] P0 [ ] P1 [ ] P2 [ ] P3

**Feature Area:** [ ] Create Account [ ] Import Private Key [ ] Import Seed [ ] UI/UX [ ] Security [ ] Integration

**Reproducibility:** [ ] Always [ ] Sometimes [ ] Once

**Environment:**
- Browser: Chrome [version]
- Extension Version: v0.10.0
- OS: [Windows/Mac/Linux]
- Date: [YYYY-MM-DD]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [Third step]
...

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Videos:**
[Attach if available]

**Console Errors:**
```
[Paste console errors if any]
```

**Additional Notes:**
[Any other relevant information]

**Workaround (if any):**
[Temporary solution]

---

## Test Execution Log

| Date | Tester | Test Cases | Passed | Failed | Blocked | Notes |
|------|--------|------------|--------|--------|---------|-------|
| | | | | | | |
| | | | | | | |
| | | | | | | |

---

## Summary and Recommendations

### Test Coverage Summary

**Total Test Cases:** 60+
- **P0 (Critical):** 25 test cases
- **P1 (High):** 20 test cases
- **P2 (Medium):** 12 test cases
- **P3 (Low):** 3 test cases

**Test Areas:**
- Create Account: 8 test cases
- Import Private Key: 6 test cases
- Import Seed Phrase: 9 test cases
- UI/UX: 8 test cases
- Security: 5 test cases
- Integration: 6 test cases
- Edge Cases: 5 test cases
- Accessibility: 3 test cases
- Performance: 3 test cases
- Regression: 3 test cases

### Critical Test Priorities

**Must Pass Before Release (P0):**
1. All account creation workflows (create, import key, import seed)
2. Security validations (weak seeds, mainnet keys, rate limiting)
3. Import badge display
4. Integration with existing wallet functions
5. Accessibility basics (keyboard navigation, screen reader)
6. No data corruption or loss

**Should Pass Before Release (P1):**
1. All address types working
2. All security warnings visible
3. Performance benchmarks met
4. Error handling comprehensive
5. Testnet validation successful

### Known Limitations

1. **Testnet Only** - Feature tested only on testnet, mainnet support future
2. **100 Account Limit** - Hard limit may be too low for some power users (documented)
3. **No Account Deletion** - Cannot delete imported accounts yet (future enhancement)
4. **No Address Preview** - Cannot preview address before importing seed (future enhancement)

### Recommendations for Release

**If All P0 Tests Pass:**
- ✅ **APPROVE FOR RELEASE** with documentation of known limitations

**If Any P0 Test Fails:**
- ❌ **BLOCK RELEASE** until fixed

**If P1 Tests Fail:**
- ⚠️ **CONDITIONAL RELEASE** - Document issues, plan for v0.10.1 hotfix

---

**END OF TEST PLAN**

**Document Version:** 1.0
**Created:** October 18, 2025
**Last Updated:** October 18, 2025
**QA Engineer:** Bitcoin Wallet Testing Team
