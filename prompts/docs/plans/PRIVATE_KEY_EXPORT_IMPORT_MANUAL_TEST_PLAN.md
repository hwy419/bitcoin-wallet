# Private Key Export and Import - Manual Testing Plan

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Ready for QA Execution
**Owner**: QA Engineer

---

## Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Test Data Preparation](#test-data-preparation)
3. [Happy Path Test Cases](#happy-path-test-cases)
4. [Security Test Cases](#security-test-cases)
5. [Error Handling Test Cases](#error-handling-test-cases)
6. [UI/UX Test Cases](#uiux-test-cases)
7. [PDF Export Test Cases](#pdf-export-test-cases)
8. [Cross-Browser Test Cases](#cross-browser-test-cases)
9. [Edge Case Test Cases](#edge-case-test-cases)
10. [Regression Test Cases](#regression-test-cases)
11. [Test Execution Tracking](#test-execution-tracking)
12. [Bug Report Template](#bug-report-template)
13. [Release Readiness Checklist](#release-readiness-checklist)

---

## Test Environment Setup

### 1.1 Browsers to Test

| Browser | Minimum Version | Priority | Notes |
|---------|----------------|----------|-------|
| **Chrome** | 120+ | P0 (Critical) | Primary target browser |
| **Edge** | 120+ | P0 (Critical) | Chromium-based, high compatibility |
| **Brave** | 1.60+ | P1 (High) | Privacy-focused, popular with crypto users |

### 1.2 Operating Systems

| OS | Version | Priority | Test Environment |
|----|---------|----------|-----------------|
| **Windows** | 10/11 | P0 (Critical) | Local machine or VM |
| **macOS** | Monterey+ | P0 (Critical) | Local machine |
| **Linux** | Ubuntu 22.04+ | P1 (High) | VM or container |

### 1.3 Test Wallets Setup

**Wallet 1: Empty Wallet**
- Purpose: Test initial wallet setup with import
- Setup: Create new wallet with seed phrase backup
- Accounts: None initially

**Wallet 2: Single HD Account**
- Purpose: Test export from HD account
- Setup: Create wallet with 1 native-segwit account
- Accounts:
  - Account 0: "Main Account" (native-segwit)
  - Balance: 0.001 tBTC (get from faucet)

**Wallet 3: Multiple Accounts**
- Purpose: Test export from multiple account types
- Setup: Create wallet with 3 accounts
- Accounts:
  - Account 0: "Legacy Account" (legacy)
  - Account 1: "SegWit Account" (segwit)
  - Account 2: "Native SegWit Account" (native-segwit)
- Balance: 0.0005 tBTC in each account

**Wallet 4: Imported Accounts**
- Purpose: Test export from previously imported accounts
- Setup: Create wallet, import 2 private keys
- Accounts:
  - Account 0: "First Import" (imported)
  - Account 1: "Second Import" (imported)

**Wallet 5: Mixed Accounts**
- Purpose: Test mixed HD + imported + multisig
- Setup: Create wallet with all account types
- Accounts:
  - Account 0: "HD Account" (HD native-segwit)
  - Account 1: "Imported Account" (imported)
  - Account 2: "Multisig 2-of-3" (multisig)

### 1.4 Test Files Preparation

Create the following test files in a dedicated folder:

**plaintext-wif-valid.txt**
```
Bitcoin Account Private Key
===========================
Account: Test Account
Address Type: Native SegWit
First Address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
Network: Testnet

Private Key (WIF):
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy

SECURITY WARNING:
- This private key provides full access to this account's funds
- Never share this key with anyone

Generated: 2025-10-19T14:30:00.000Z
```

**encrypted-wif-valid.txt**
```
Bitcoin Account Private Key (Encrypted)
=======================================
Account: Test Account
Address Type: Native SegWit
First Address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
Network: Testnet

Encrypted Private Key:
[encryption_format]:[encrypted_data]

Encryption: AES-256-GCM
Format: base64

TO DECRYPT:
Use this wallet's "Import Private Key" feature and provide the password
you used during export.

Generated: 2025-10-19T14:30:00.000Z
```

**invalid-wif-format.txt**
```
This is not a valid WIF file format
```

**mainnet-wif.txt**
```
Bitcoin Account Private Key
===========================
Account: Mainnet Account
Network: Mainnet

Private Key (WIF):
L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ

Generated: 2025-10-19T14:30:00.000Z
```

**corrupted-encrypted-wif.txt**
```
Bitcoin Account Private Key (Encrypted)
=======================================
Encrypted Private Key:
CORRUPTED_DATA_INVALID_BASE64!!!

Generated: 2025-10-19T14:30:00.000Z
```

**large-file.txt**
- Create a >10MB text file with random data to test size limits

### 1.5 Required Tools

- **Testnet Faucet**: https://testnet-faucet.mempool.co/
- **Testnet Explorer**: https://blockstream.info/testnet/
- **QR Code Scanner**: Mobile app (for PDF QR code testing)
- **Screen Recording**: For reproducing bugs
- **PDF Reader**: For verifying PDF exports
- **Text Editor**: For viewing exported files
- **Developer Tools**: Browser DevTools for console monitoring

---

## Test Data Preparation

### 2.1 Valid Test WIF Strings

**Testnet Compressed WIF:**
```
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
```
- Network: Testnet
- Type: Compressed
- Expected Address: tb1q... (native-segwit)

**Testnet Uncompressed WIF:**
```
92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc
```
- Network: Testnet
- Type: Uncompressed
- Expected Address: m... or n... (legacy)

**Mainnet Compressed WIF (Should Reject):**
```
L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ
```
- Network: Mainnet
- Expected: REJECTION with clear error

### 2.2 Test Passwords

**Weak Passwords (8-11 chars):**
- `password`
- `12345678`
- `abcdefgh`

**Medium Passwords (12-15 chars, mixed):**
- `Password123`
- `MyTestKey456`
- `WalletPass99`

**Strong Passwords (16+ chars, complex):**
- `MyS3cur3!Backup@2025`
- `Str0ng#Password$Key`
- `VeryS3cure!Pass#123`

**Special Character Passwords:**
- `!@#$%^&*()_+-=[]{}|`
- `Pass用户名🔐` (Unicode)

**Common Passwords (Should Warn/Reject):**
- `password123`
- `qwerty`
- `letmein`

### 2.3 Test Account Names

**Valid Names:**
- `Test Account`
- `Savings Account`
- `Trading Wallet`
- `My Bitcoin Account`

**Edge Case Names:**
- `A` (single character)
- `Account with a Very Long Name That Exceeds Normal Length` (50+ chars)
- `账户名称` (Chinese characters)
- `Ñame Ü Öumlaut` (accented characters)
- `💰 Emoji Wallet 🚀` (emojis)

**Invalid Names:**
- Empty string
- Whitespace only `   `
- Special chars: `<script>alert("xss")</script>`

---

## Happy Path Test Cases

### HP-001: Export HD Account as Plaintext File

**Objective:** Verify user can export an HD account private key as plaintext file

**Preconditions:**
- Wallet unlocked
- At least one HD account exists with balance
- Account is NOT multisig

**Test Steps:**
1. Navigate to Settings → Account Management
2. Locate the account to export (e.g., "Main Account")
3. Click "Export Private Key" button
4. Verify export dialog opens with:
   - Account name displayed
   - Address type displayed
   - First receiving address shown
   - Security warning visible (cannot be dismissed)
   - "Password Protection" checkbox (unchecked by default)
   - "Export as File" button
   - "Export as PDF" button
   - "Cancel" button
5. **DO NOT** check "Password Protection"
6. Acknowledge security warning checkbox
7. Click "Export as File"
8. Observe file download

**Expected Results:**
- ✅ Export dialog displays correct account information
- ✅ Security warning is prominent and clear
- ✅ File downloads successfully
- ✅ Filename format: `bitcoin-account-{name}-{timestamp}.txt`
- ✅ Success notification appears
- ✅ Dialog remains open (allows PDF export)

**Verification Steps:**
1. Open downloaded file in text editor
2. Verify file contains:
   - Header: "Bitcoin Account Private Key"
   - Account name matches
   - Address type matches
   - First address matches
   - Network: Testnet
   - WIF string (52 chars, starts with 'c' or '9')
   - Security warnings present
   - ISO timestamp
3. Verify WIF format:
   - Length: 51-52 characters
   - Starts with 'c' (compressed) or '9' (uncompressed)
   - Contains only Base58 characters (no 0, O, I, l)

**Pass Criteria:**
- All expected results met
- File format correct
- WIF string valid

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### HP-002: Export HD Account with Password Protection

**Objective:** Verify user can export an HD account private key with password encryption

**Preconditions:**
- Wallet unlocked
- At least one HD account exists

**Test Steps:**
1. Navigate to Settings → Account Management
2. Click "Export Private Key" for target account
3. In export dialog, CHECK "Password Protection" checkbox
4. Observe password fields appear:
   - Password input field
   - Confirm password input field
   - Password strength meter
5. Enter password: `MyS3cur3!Backup@2025`
6. Re-enter same password in confirm field
7. Observe password strength meter shows "Strong"
8. Acknowledge security warning checkbox
9. Click "Export as File"
10. Wait for download (may take 1-2 seconds for encryption)

**Expected Results:**
- ✅ Password fields appear when checkbox checked
- ✅ Password strength meter updates in real-time
- ✅ Shows "Strong" for strong password
- ✅ "Export as File" button enabled when passwords match
- ✅ File downloads successfully
- ✅ Filename format: `bitcoin-account-{name}-{timestamp}.txt`
- ✅ Success notification appears

**Verification Steps:**
1. Open downloaded file
2. Verify file contains:
   - Header: "Bitcoin Account Private Key (Encrypted)"
   - Account metadata (name, address type, first address)
   - "Encrypted Private Key:" section
   - Encrypted data in format: `salt:iv:authTag:ciphertext`
   - Encryption method: AES-256-GCM
   - Decryption instructions
   - NO plaintext WIF visible
3. Verify encrypted data format:
   - 4 base64 strings separated by colons
   - Each component appears random (not readable text)

**Pass Criteria:**
- Password protection works
- File contains encrypted data only
- No plaintext WIF in file
- Encryption format correct

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### HP-003: Export Account as PDF

**Objective:** Verify user can export private key as PDF with QR code

**Preconditions:**
- Wallet unlocked
- At least one HD account exists

**Test Steps:**
1. Navigate to Settings → Account Management
2. Click "Export Private Key" for target account
3. In export dialog, acknowledge security warning
4. Click "Export as PDF" button
5. Wait for PDF generation (3-5 seconds)
6. Observe PDF download

**Expected Results:**
- ✅ PDF generates without errors
- ✅ Filename format: `bitcoin-account-{name}-backup-{timestamp}.pdf`
- ✅ Success notification appears
- ✅ Dialog remains open

**Verification Steps:**
1. Open PDF in PDF reader
2. Verify PDF contains:
   - Header: "Bitcoin Account Private Key Backup"
   - Account Information section:
     - Account name
     - Address type
     - First receiving address
     - Network (Testnet)
     - Generated date/time
   - Private Key section:
     - Label "Private Key (WIF Format)"
     - WIF string in monospace font
     - QR code (200x200px minimum)
   - Security Warning box (highlighted):
     - "⚠️ CRITICAL SECURITY INFORMATION" header
     - Multiple bullet points on security
   - Import Instructions section
   - Footer with timestamp
3. Verify QR code:
   - Open QR scanner app on mobile device
   - Scan QR code from printed PDF or screen
   - Verify scanned result matches WIF string exactly
4. Verify PDF printability:
   - Print PDF to physical printer (or PDF printer)
   - Verify all text readable
   - Verify QR code scannable from printout

**Pass Criteria:**
- PDF generates successfully
- All required elements present
- QR code scannable
- Print quality acceptable

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### HP-004: Import Plaintext WIF via File Upload

**Objective:** Verify user can import a private key from plaintext file

**Preconditions:**
- Wallet unlocked with existing accounts
- Plaintext WIF export file prepared (from HP-001)

**Test Steps:**
1. Navigate to Settings → Account Management
2. Click "Import Account" button
3. Select "Import Private Key" tab/option
4. In import form:
   - Click "Choose File" or drag-and-drop
   - Select plaintext WIF file from HP-001
5. Observe file parsing:
   - File content read
   - WIF detected and validated
   - Account metadata extracted
6. Verify preview section shows:
   - "✓ Valid testnet private key detected"
   - First address displayed
   - Network: Testnet confirmed
7. Enter account name: `Imported Test Account`
8. Click "Import Account" button
9. Wait for import processing

**Expected Results:**
- ✅ File uploads successfully
- ✅ WIF validated in real-time
- ✅ Preview shows correct first address
- ✅ Import succeeds
- ✅ Success notification appears
- ✅ Account list updates with new account
- ✅ New account marked as "imported"

**Verification Steps:**
1. Navigate to Dashboard
2. Verify new account appears in account list
3. Verify account details:
   - Name: "Imported Test Account"
   - Type: Imported (should show indicator)
   - Address type: Matches WIF (compressed → native-segwit)
   - First address matches preview
4. Check account balance (if WIF had funds)
5. Attempt to send transaction from imported account (verify signing works)

**Pass Criteria:**
- Import successful
- Account created correctly
- First address matches original export
- Account fully functional (can send/receive)

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### HP-005: Import Encrypted WIF with Correct Password

**Objective:** Verify user can import password-protected WIF file

**Preconditions:**
- Wallet unlocked
- Encrypted WIF export file prepared (from HP-002)
- Remember export password: `MyS3cur3!Backup@2025`

**Test Steps:**
1. Navigate to Settings → Account Management
2. Click "Import Account" → "Import Private Key"
3. Upload encrypted WIF file from HP-002
4. Observe:
   - System detects file is encrypted
   - "File Password" input field appears
   - Help text: "Enter the password used when exporting this key"
5. Enter file password: `MyS3cur3!Backup@2025`
6. Observe:
   - Decryption occurs (may take 1-2 seconds)
   - "✓ Decryption successful" message appears
   - First address preview displayed
7. Enter account name: `Decrypted Import`
8. Click "Import Account"

**Expected Results:**
- ✅ System detects encrypted file
- ✅ Password field appears
- ✅ Decryption succeeds with correct password
- ✅ First address matches original export
- ✅ Import completes successfully
- ✅ Account created and functional

**Verification Steps:**
1. Verify imported account appears in account list
2. Verify first address matches original account
3. Compare with HP-004 imported account:
   - Both should have same first address (if same WIF)
   - OR different addresses if different accounts

**Pass Criteria:**
- Decryption successful
- Import successful
- Account functional

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### HP-006: Import via Manual WIF Entry

**Objective:** Verify user can import by pasting WIF directly (no file)

**Preconditions:**
- Wallet unlocked
- Valid testnet WIF string copied: `cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy`

**Test Steps:**
1. Navigate to Settings → Account Management
2. Click "Import Account" → "Import Private Key"
3. Select "Enter WIF" tab/option (vs "Upload File")
4. Paste WIF string into textarea:
   `cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy`
5. Observe real-time validation:
   - "✓ Valid WIF detected" appears
   - Network: Testnet confirmed
   - First address displayed
6. Enter account name: `Manual Import`
7. Click "Import Account"

**Expected Results:**
- ✅ WIF validates in real-time as typed/pasted
- ✅ Validation feedback immediate
- ✅ First address preview shows
- ✅ Import succeeds
- ✅ Account created

**Verification Steps:**
1. Verify account appears in account list
2. Verify first address matches preview
3. Verify account type: Imported
4. Test sending/receiving functionality

**Pass Criteria:**
- Manual entry works
- Validation accurate
- Import successful

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### HP-007: Export-Import Roundtrip (Same Wallet)

**Objective:** Verify account can be exported and re-imported with matching address

**Preconditions:**
- Wallet unlocked
- One HD account with known first address

**Test Steps:**
1. **Record Original Data:**
   - Note account name
   - Note first address: `_______________________`
   - Note address type
2. **Export:**
   - Export account as plaintext file
   - Save downloaded file
3. **Import:**
   - Import the exported file
   - Name it: `Roundtrip Test`
4. **Compare:**
   - Compare first address of new imported account to original
   - Verify they match EXACTLY

**Expected Results:**
- ✅ Export successful
- ✅ Import successful
- ✅ First addresses MATCH
- ✅ Address type matches

**Verification Steps:**
1. Side-by-side comparison:
   - Original account first address
   - Imported account first address
2. Both addresses should be identical
3. Both accounts should be able to receive funds at same address
4. Sending from either account should work

**Pass Criteria:**
- Addresses match exactly
- Both accounts functional
- No data loss in roundtrip

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**
- Original Address: `_________________________________`
- Imported Address: `_________________________________`
- Match: ☐ Yes | ☐ No

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## Security Test Cases

### SEC-001: Multisig Export Blocked

**Objective:** Verify multisig accounts cannot be exported

**Preconditions:**
- Wallet has at least one multisig account (2-of-2, 2-of-3, or 3-of-5)

**Test Steps:**
1. Navigate to Settings → Account Management
2. Locate multisig account in account list
3. Observe "Export Private Key" button state

**Expected Results:**
- ✅ Export button is HIDDEN for multisig account
- OR
- ✅ Export button is DISABLED with tooltip explaining why

**If button is disabled with tooltip:**
1. Hover over disabled button
2. Verify tooltip text appears:
   - "Multisig accounts cannot be exported as a single private key"
   - "Export co-signer xpubs instead"

**If button is hidden:**
1. Verify no export option visible for multisig account
2. Verify export option IS visible for non-multisig accounts

**Pass Criteria:**
- Multisig accounts cannot be exported
- Clear explanation provided (if button visible but disabled)
- User cannot bypass restriction

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### SEC-002: Network Validation - Mainnet Key Rejected

**Objective:** Verify mainnet private keys are rejected on testnet wallet

**Preconditions:**
- Wallet is configured for testnet
- Mainnet WIF test file prepared

**Test Steps:**
1. Navigate to Import Private Key screen
2. Upload mainnet WIF file (or paste mainnet WIF)
   - Mainnet WIF: `L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ`
3. Observe validation

**Expected Results:**
- ✅ Import immediately BLOCKED
- ✅ Clear error message appears:
   - "REJECTED: This is a mainnet key"
   - "This wallet requires testnet keys"
   - "DO NOT import mainnet keys on testnet wallet"
- ✅ Import button disabled/blocked
- ✅ No account created
- ✅ No mainnet key processed beyond validation

**Verification Steps:**
1. Open browser DevTools → Console
2. Verify NO errors related to key processing
3. Verify account list unchanged (no new account)
4. Attempt to proceed (should not be possible)

**Pass Criteria:**
- Mainnet key rejected immediately
- Error message clear and accurate
- No account created
- User cannot bypass restriction

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### SEC-003: Duplicate Import Detection

**Objective:** Verify duplicate private keys cannot be imported twice

**Preconditions:**
- Wallet unlocked
- One WIF already imported (from HP-004)

**Test Steps:**
1. Note name of existing imported account: `_________________`
2. Note first address: `_________________`
3. Attempt to import THE SAME WIF again:
   - Use same WIF file from HP-004
   - OR paste same WIF string
4. Observe validation

**Expected Results:**
- ✅ System detects duplicate
- ✅ Error message appears:
   - "This account is already imported as '{existing_name}'"
   - Suggests checking existing accounts
- ✅ Import blocked
- ✅ No duplicate account created

**Verification Steps:**
1. Verify account list shows only ONE account with that WIF
2. Verify no duplicate addresses
3. Verify clear error message names existing account

**Pass Criteria:**
- Duplicate detected
- Import blocked
- Error message helpful
- No duplicate created

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### SEC-004: No Sensitive Data in Console Logs

**Objective:** Verify private keys never logged to browser console

**Preconditions:**
- Browser DevTools open
- Console tab visible

**Test Steps:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console logs
4. **Export Test:**
   - Export a private key (plaintext)
   - Download file
   - Observe console during export
5. **Import Test:**
   - Import the same private key
   - Observe console during import
6. **Search Console:**
   - Use console search (Ctrl+F)
   - Search for patterns:
     - `cVt4o7BGAig` (start of WIF)
     - Private key phrases: `private key`, `WIF`

**Expected Results:**
- ✅ NO WIF strings appear in console
- ✅ NO private keys logged
- ✅ Only generic messages appear:
   - "Exporting account..."
   - "Import successful"
   - NO actual key values

**Verification Steps:**
1. Review ALL console logs during export/import
2. Verify no sensitive data patterns:
   - No WIF strings (52 chars, starts with c/9/5/K/L)
   - No hex private keys (64 hex characters)
   - No passwords or seeds
3. Verify error messages (if any) do not contain sensitive data

**Pass Criteria:**
- Zero sensitive data in console
- Only generic operational messages
- No WIF or private key strings found

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**
- Console search for WIF: ☐ Not Found | ☐ FOUND (FAIL)
- Console search for private key patterns: ☐ Not Found | ☐ FOUND (FAIL)

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### SEC-005: Password Strength Validation

**Objective:** Verify password strength requirements enforced

**Preconditions:**
- Export dialog open with "Password Protection" enabled

**Test Steps:**

**Test 5.1: Weak Password (too short)**
1. Enter password: `short` (5 chars)
2. Observe password strength meter

**Expected Results 5.1:**
- ✅ Password strength shows "Too Weak" or "Weak"
- ✅ Export button disabled
- ✅ Error message: "Password must be at least 8 characters"

**Test 5.2: Minimum Length**
1. Enter password: `12345678` (exactly 8 chars)
2. Observe password strength meter

**Expected Results 5.2:**
- ✅ Password accepted (meets minimum)
- ✅ Strength shows "Weak"
- ✅ Export button enabled
- ✅ Warning: "Consider using a stronger password"

**Test 5.3: Medium Strength**
1. Enter password: `Password123`
2. Observe password strength meter

**Expected Results 5.3:**
- ✅ Strength shows "Medium"
- ✅ Export button enabled
- ✅ Visual indicator: Yellow/orange

**Test 5.4: Strong Password**
1. Enter password: `MyS3cur3!Backup@2025`
2. Observe password strength meter

**Expected Results 5.4:**
- ✅ Strength shows "Strong"
- ✅ Export button enabled
- ✅ Visual indicator: Green
- ✅ Positive feedback message

**Test 5.5: Password Mismatch**
1. Enter password: `Password123`
2. Enter confirm: `Password456` (different)
3. Observe validation

**Expected Results 5.5:**
- ✅ Error appears: "Passwords do not match"
- ✅ Export button disabled
- ✅ Error clears when passwords match

**Pass Criteria:**
- Minimum length enforced (8 chars)
- Strength meter accurate
- Mismatch detected
- Export blocked for invalid passwords

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## Error Handling Test Cases

### ERR-001: Import with Wrong Password (Encrypted File)

**Objective:** Verify clear error when wrong password provided for encrypted file

**Preconditions:**
- Encrypted WIF file available (from HP-002)
- Correct password: `MyS3cur3!Backup@2025`

**Test Steps:**
1. Navigate to Import Private Key screen
2. Upload encrypted WIF file
3. System detects encryption, shows password field
4. Enter WRONG password: `WrongPassword123`
5. Click "Import Account"
6. Observe error handling

**Expected Results:**
- ✅ Decryption fails
- ✅ Error message appears:
   - "Incorrect file password or corrupted file"
   - "Please check your password and try again"
- ✅ Import blocked
- ✅ No account created
- ✅ User can retry with different password

**Verification Steps:**
1. Verify error message clear and helpful
2. Verify no partial account created
3. Retry with correct password → should succeed

**Pass Criteria:**
- Wrong password detected
- Clear error message
- User can retry
- No data corruption

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### ERR-002: Import Invalid WIF Format

**Objective:** Verify invalid WIF strings rejected with clear error

**Preconditions:**
- Import screen open

**Test Cases:**

**Test 2.1: Random String**
1. Paste: `this-is-not-a-valid-wif-string`
2. Observe validation

**Expected Results 2.1:**
- ✅ Error: "Invalid WIF format"
- ✅ Import blocked

**Test 2.2: Wrong Length**
1. Paste: `cVt4o7BGAig1UXywgGSmARhx` (truncated, too short)
2. Observe validation

**Expected Results 2.2:**
- ✅ Error: "Invalid WIF length"
- ✅ Import blocked

**Test 2.3: Invalid Characters**
1. Paste: `0VtO0OBGAigIUXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy` (contains 0, O, I)
2. Observe validation

**Expected Results 2.3:**
- ✅ Error: "Invalid WIF format (contains invalid characters)"
- ✅ Import blocked

**Test 2.4: Invalid Checksum**
1. Paste: `cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpx` (wrong checksum)
2. Observe validation

**Expected Results 2.4:**
- ✅ Error: "Invalid WIF checksum"
- ✅ Import blocked

**Pass Criteria:**
- All invalid formats detected
- Specific error messages
- Import blocked for all invalid inputs

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### ERR-003: Corrupt File Upload

**Objective:** Verify corrupted files handled gracefully

**Preconditions:**
- Corrupted file prepared (binary data, not text)

**Test Steps:**
1. Navigate to Import Private Key screen
2. Upload corrupted-encrypted-wif.txt (or other corrupt file)
3. Observe file parsing

**Expected Results:**
- ✅ System detects corruption
- ✅ Error message appears:
   - "Unable to read file"
   - "File may be corrupted or in wrong format"
- ✅ Import blocked
- ✅ No crash or freeze

**Verification Steps:**
1. Verify wallet remains functional
2. Verify no partial data imported
3. Retry with valid file → should work

**Pass Criteria:**
- Corruption detected
- Graceful error handling
- No crash
- User can retry

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### ERR-004: Very Large File Upload

**Objective:** Verify file size limits enforced

**Preconditions:**
- Large file prepared (>10MB)

**Test Steps:**
1. Navigate to Import Private Key screen
2. Attempt to upload large-file.txt (>10MB)
3. Observe validation

**Expected Results:**
- ✅ File size validated before upload
- ✅ Error appears:
   - "File too large"
   - "Maximum file size: 1MB"
- ✅ Upload blocked
- ✅ No browser freeze/hang

**Pass Criteria:**
- Size limit enforced
- Clear error message
- No performance issues

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### ERR-005: Export While Wallet Locked

**Objective:** Verify export blocked when wallet is locked

**Preconditions:**
- Wallet has accounts
- Wallet is LOCKED (not unlocked)

**Test Steps:**
1. Lock wallet (if unlocked):
   - Wait for auto-lock timeout (15 min)
   - OR manually lock wallet
2. Navigate to Settings → Account Management
3. Attempt to click "Export Private Key"

**Expected Results:**
- ✅ Export button disabled or hidden
- OR
- ✅ Click prompts unlock screen:
   - "Wallet is locked. Unlock to export private keys."
   - Shows unlock password prompt
- ✅ Cannot export while locked

**Verification Steps:**
1. Unlock wallet
2. Retry export → should work

**Pass Criteria:**
- Export blocked while locked
- Clear message to user
- Unlock required

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### ERR-006: Special Characters in Account Name

**Objective:** Verify special characters handled or sanitized in account names

**Preconditions:**
- Import screen open

**Test Cases:**

**Test 6.1: HTML/Script Tags**
1. Import valid WIF
2. Enter account name: `<script>alert("xss")</script>`
3. Complete import

**Expected Results 6.1:**
- ✅ Import succeeds
- ✅ Name is sanitized or escaped:
   - Stored as plain text (no HTML)
   - Displayed safely (no script execution)
   - OR rejected with error

**Test 6.2: SQL Injection Attempt**
1. Import valid WIF
2. Enter account name: `'; DROP TABLE accounts; --`
3. Complete import

**Expected Results 6.2:**
- ✅ Import succeeds (no SQL injection possible)
- ✅ Name stored as-is (harmless string)

**Test 6.3: Path Traversal**
1. Import valid WIF
2. Enter account name: `../../etc/passwd`
3. Complete import

**Expected Results 6.3:**
- ✅ Import succeeds
- ✅ Name treated as plain string (no file access)

**Pass Criteria:**
- No security vulnerabilities
- Special characters handled safely
- No XSS, SQL injection, or path traversal possible

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## UI/UX Test Cases

### UX-001: Export Modal Layout and Content

**Objective:** Verify export modal displays correctly and is user-friendly

**Preconditions:**
- Wallet unlocked

**Test Steps:**
1. Open export dialog for any account
2. Inspect modal visually

**Checklist:**
- ☐ Modal centered on screen
- ☐ Dark overlay behind modal (dims background)
- ☐ Modal has clear title: "Export Private Key: {AccountName}"
- ☐ Account details section visible:
  - ☐ Address type
  - ☐ First receiving address
- ☐ Security warning section prominent:
  - ☐ Warning icon (⚠️)
  - ☐ Warning text in red/orange
  - ☐ Multiple bullet points
  - ☐ Cannot be dismissed
- ☐ Acknowledgment checkbox present
- ☐ Password protection section:
  - ☐ Checkbox to enable
  - ☐ Password fields hidden by default
  - ☐ Show/hide toggles (👁️) for password fields
- ☐ Action buttons:
  - ☐ "Export as File"
  - ☐ "Export as PDF"
  - ☐ "Cancel"
  - ☐ Buttons properly spaced
- ☐ Responsive layout (no overflow or cutoff)

**Pass Criteria:**
- All elements present
- Layout clean and professional
- Easy to understand
- Security warning prominent

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### UX-002: Import Screen Layout and Flow

**Objective:** Verify import screen is intuitive and well-designed

**Preconditions:**
- Import private key screen open

**Test Steps:**
1. Navigate to Import Private Key screen
2. Inspect UI elements

**Checklist:**
- ☐ Clear title: "Import Private Key"
- ☐ Two input methods clearly distinguished:
  - ☐ Tab 1: "Upload File"
  - ☐ Tab 2: "Enter WIF"
- ☐ Upload File tab:
  - ☐ Drag-and-drop area visible
  - ☐ "Choose File" button
  - ☐ Accepted file types noted (.txt)
- ☐ Enter WIF tab:
  - ☐ Large textarea for WIF input
  - ☐ Placeholder text helpful
  - ☐ Character limit noted (if any)
- ☐ Real-time validation feedback:
  - ☐ Green checkmark for valid WIF
  - ☐ Red X for invalid WIF
  - ☐ Network detected and shown
- ☐ Preview section (when valid):
  - ☐ First address displayed
  - ☐ Address type shown
- ☐ Account name input field
- ☐ Help/info sections:
  - ☐ "What is WIF?" expandable help
  - ☐ Security notice visible
- ☐ Action buttons:
  - ☐ "Import Account" (disabled until valid)
  - ☐ "Cancel"

**Pass Criteria:**
- Layout intuitive
- All elements functional
- Help text available
- Validation clear

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### UX-003: Password Strength Meter Behavior

**Objective:** Verify password strength meter provides real-time feedback

**Preconditions:**
- Export dialog open with password protection enabled

**Test Steps:**
1. Focus on password field
2. Type password character by character: `M` `y` `P` `a` `s` `s` `1` `2` `3` `!`
3. Observe strength meter updates

**Test Cases:**

**Weak (1-7 chars):**
- Input: `Pass`
- Expected: Red bar, "Too Weak" label

**Weak (8-11 chars, simple):**
- Input: `Password`
- Expected: Yellow bar, "Weak" label

**Medium (12+ chars, some complexity):**
- Input: `Password123`
- Expected: Orange bar, "Medium" label

**Strong (16+ chars, mixed case, numbers, symbols):**
- Input: `MyPass123!`
- Expected: Green bar, "Strong" label

**Very Strong (20+ chars, high complexity):**
- Input: `VeryStr0ng!Pass@word#2025`
- Expected: Dark green bar, "Very Strong" label

**Expected Behavior:**
- ✅ Meter updates in real-time (no delay)
- ✅ Color changes match strength (red → yellow → orange → green)
- ✅ Label text updates
- ✅ Visual bar fills proportionally
- ✅ Smooth transitions (no flickering)

**Pass Criteria:**
- Real-time updates
- Accurate strength assessment
- Visual feedback clear
- No bugs or glitches

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### UX-004: File Upload Drag-and-Drop

**Objective:** Verify drag-and-drop file upload works smoothly

**Preconditions:**
- Import screen open on "Upload File" tab
- Test WIF file ready

**Test Steps:**
1. Drag file from file explorer
2. Hover over upload area
3. Observe hover state
4. Drop file
5. Observe file processing

**Expected Results:**
- ✅ Drag hover state activates:
  - Upload area highlights (border/background changes)
  - Cursor shows drop indicator
- ✅ File drop accepted
- ✅ File content read immediately
- ✅ Success feedback visible
- ✅ File name displayed

**Test Edge Cases:**
1. Drag wrong file type (.pdf, .jpg)
   - Expected: Rejection or warning
2. Drag multiple files
   - Expected: Only first file accepted, or error
3. Drag very large file
   - Expected: Size validation before processing

**Pass Criteria:**
- Drag-and-drop functional
- Visual feedback present
- Edge cases handled

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### UX-005: Success/Error Notifications

**Objective:** Verify success and error notifications display correctly

**Preconditions:**
- Wallet unlocked

**Test Success Notifications:**

**Export Success:**
1. Export private key successfully
2. Observe notification

**Expected:**
- ✅ Notification appears (top-right or center)
- ✅ Green background or checkmark icon
- ✅ Message: "Private key exported successfully"
- ✅ Auto-dismisses after 5 seconds
- ✅ Can be manually dismissed (X button)

**Import Success:**
1. Import private key successfully
2. Observe notification

**Expected:**
- ✅ Notification appears
- ✅ Message: "Account imported successfully"
- ✅ Includes account name
- ✅ Auto-dismisses or requires acknowledgment

**Test Error Notifications:**

**Network Error:**
1. Trigger mainnet key rejection
2. Observe notification

**Expected:**
- ✅ Notification appears
- ✅ Red background or error icon
- ✅ Clear error message
- ✅ Stays visible until dismissed (no auto-dismiss for errors)

**Duplicate Error:**
1. Trigger duplicate import
2. Observe notification

**Expected:**
- ✅ Error notification
- ✅ Message includes existing account name
- ✅ Helpful suggestion provided

**Pass Criteria:**
- Notifications visible
- Correct colors/icons
- Messages clear
- Timing appropriate
- Dismissible

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## PDF Export Test Cases

### PDF-001: PDF Content Verification

**Objective:** Verify PDF contains all required elements

**Preconditions:**
- PDF exported successfully (from HP-003)
- PDF opened in PDF reader

**Checklist:**

**Header Section:**
- ☐ Title: "Bitcoin Account Private Key Backup"
- ☐ Large, bold font
- ☐ Centered

**Account Information:**
- ☐ Label: "Account Information"
- ☐ Account name displayed
- ☐ Address type (e.g., "Native SegWit")
- ☐ First receiving address (full address)
- ☐ Network: "Testnet"
- ☐ Generated date/time (ISO format)

**Private Key Section:**
- ☐ Label: "Private Key (WIF Format)"
- ☐ WIF string displayed
- ☐ Monospace font used (for readability)
- ☐ WIF on single line (no wrapping)
- ☐ QR code present
- ☐ QR code size adequate (200x200px+)
- ☐ QR code clear (not pixelated)

**Security Warning:**
- ☐ Red or orange bordered box
- ☐ Warning icon (⚠️)
- ☐ Header: "CRITICAL SECURITY INFORMATION"
- ☐ Multiple bullet points:
  - ☐ Never share warning
  - ☐ Secure storage guidance
  - ☐ Theft warning

**Import Instructions:**
- ☐ Section present
- ☐ Step-by-step instructions
- ☐ Clear and concise

**Footer:**
- ☐ Generated timestamp
- ☐ Wallet version (optional)
- ☐ Small, gray text

**Pass Criteria:**
- All sections present
- Content accurate
- Layout professional
- Readable when printed

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### PDF-002: QR Code Scanability

**Objective:** Verify QR code can be scanned and decodes to correct WIF

**Preconditions:**
- PDF exported with QR code
- Mobile device with QR scanner app

**Test Steps:**
1. Display PDF on computer screen at 100% zoom
2. Open QR scanner app on mobile device
3. Point camera at QR code
4. Scan QR code
5. Copy scanned result
6. Compare to WIF in PDF text

**Expected Results:**
- ✅ QR code scans successfully on first attempt
- ✅ Scanned result is plain text WIF
- ✅ Scanned WIF MATCHES text WIF in PDF exactly
- ✅ No extra characters or formatting

**Test Printed QR Code:**
1. Print PDF to paper (home/office printer)
2. Scan QR code from printed page
3. Verify scanability

**Expected:**
- ✅ Printed QR code scans successfully
- ✅ Result matches original WIF

**Test Various Distances:**
1. Scan from 6 inches away
2. Scan from 12 inches away
3. Scan from 18 inches away

**Expected:**
- ✅ QR code scannable from all reasonable distances

**Pass Criteria:**
- QR code scans reliably
- Decoded text matches WIF exactly
- Works on screen and printed

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**
- Screen scan: ☐ Success | ☐ Fail
- Print scan: ☐ Success | ☐ Fail
- Decoded WIF matches: ☐ Yes | ☐ No

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### PDF-003: PDF Printing Quality

**Objective:** Verify PDF prints clearly and readably

**Preconditions:**
- PDF exported
- Printer available (inkjet or laser)

**Test Steps:**
1. Open PDF in PDF reader
2. Select Print
3. Print settings:
   - Paper size: Letter or A4
   - Orientation: Portrait
   - Scale: 100% (no fit to page)
4. Print to physical printer
5. Inspect printout

**Quality Checklist:**
- ☐ All text readable (no blur)
- ☐ QR code printed clearly
- ☐ QR code black and white (high contrast)
- ☐ No cutoff text or elements
- ☐ Margins appropriate (1 inch)
- ☐ Security warning box visible
- ☐ WIF string legible (monospace font helps)

**QR Code Print Quality:**
- ☐ QR code edges sharp
- ☐ QR code modules distinct (not merged)
- ☐ Scannable from printout (test with phone)

**Pass Criteria:**
- Print quality acceptable
- All content readable
- QR code scannable from print
- Professional appearance

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### PDF-004: Password-Protected PDF Export

**Objective:** Verify encrypted private key PDF format is correct

**Preconditions:**
- Export account with password protection
- Export as PDF

**Test Steps:**
1. Export with password: `TestPassword123!`
2. Click "Export as PDF"
3. Open downloaded PDF

**Expected PDF Content:**

**Should CONTAIN:**
- ☐ Header: "Bitcoin Account Private Key Backup (Encrypted)"
- ☐ Account metadata (name, type, address, network)
- ☐ Label: "Encrypted Private Key:"
- ☐ Encrypted data string (base64 with colons)
- ☐ Encryption method: "AES-256-GCM"
- ☐ Key derivation: "PBKDF2 (100,000 iterations)"
- ☐ Decryption instructions:
  - How to decrypt
  - Password requirement warning
- ☐ Security warning box

**Should NOT contain:**
- ☐ NO QR code (encrypted data too long)
- ☐ NO plaintext WIF
- ☐ NO password

**Pass Criteria:**
- PDF contains encrypted data only
- No plaintext WIF visible
- Instructions clear
- No QR code present (correct behavior)

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## Cross-Browser Test Cases

### XB-001: Chrome Browser Testing

**Objective:** Verify all features work in Google Chrome

**Preconditions:**
- Chrome browser 120+
- Extension installed

**Test Matrix:**

| Test Case | Result | Notes |
|-----------|--------|-------|
| HP-001: Export plaintext | ☐ Pass ☐ Fail | |
| HP-002: Export encrypted | ☐ Pass ☐ Fail | |
| HP-003: Export PDF | ☐ Pass ☐ Fail | |
| HP-004: Import file | ☐ Pass ☐ Fail | |
| HP-005: Import encrypted | ☐ Pass ☐ Fail | |
| HP-006: Manual WIF entry | ☐ Pass ☐ Fail | |
| SEC-001: Multisig blocked | ☐ Pass ☐ Fail | |
| SEC-002: Network validation | ☐ Pass ☐ Fail | |
| UX-001: Export modal | ☐ Pass ☐ Fail | |
| UX-004: Drag-and-drop | ☐ Pass ☐ Fail | |
| PDF-002: QR scanability | ☐ Pass ☐ Fail | |

**Chrome-Specific Checks:**
- ☐ File downloads work without extra prompts
- ☐ PDF generation works
- ☐ Chrome storage.local accessible
- ☐ No console errors
- ☐ DevTools accessible

**Pass Criteria:**
- All test cases pass
- No Chrome-specific bugs
- Performance acceptable

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### XB-002: Edge Browser Testing

**Objective:** Verify all features work in Microsoft Edge

**Preconditions:**
- Edge browser 120+
- Extension installed

**Test Matrix:**

| Test Case | Result | Notes |
|-----------|--------|-------|
| HP-001: Export plaintext | ☐ Pass ☐ Fail | |
| HP-002: Export encrypted | ☐ Pass ☐ Fail | |
| HP-003: Export PDF | ☐ Pass ☐ Fail | |
| HP-004: Import file | ☐ Pass ☐ Fail | |
| HP-005: Import encrypted | ☐ Pass ☐ Fail | |
| SEC-002: Network validation | ☐ Pass ☐ Fail | |

**Edge-Specific Checks:**
- ☐ Edge download manager works
- ☐ Edge enhanced security mode doesn't block feature
- ☐ Extension loads correctly
- ☐ No Edge-specific warnings

**Pass Criteria:**
- All test cases pass
- Compatible with Edge features
- No Edge-specific issues

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### XB-003: Brave Browser Testing

**Objective:** Verify all features work in Brave browser

**Preconditions:**
- Brave browser 1.60+
- Extension installed
- Brave Shields configured (test both on/off)

**Test Matrix:**

| Test Case | Shields ON | Shields OFF | Notes |
|-----------|-----------|-------------|-------|
| HP-001: Export | ☐ Pass ☐ Fail | ☐ Pass ☐ Fail | |
| HP-003: PDF | ☐ Pass ☐ Fail | ☐ Pass ☐ Fail | |
| HP-004: Import | ☐ Pass ☐ Fail | ☐ Pass ☐ Fail | |
| UX-004: Drag-drop | ☐ Pass ☐ Fail | ☐ Pass ☐ Fail | |

**Brave-Specific Checks:**
- ☐ Brave Shields doesn't block downloads
- ☐ Brave ad/tracker blocking doesn't interfere
- ☐ Web Crypto API accessible in Brave
- ☐ IPFS features don't conflict

**Pass Criteria:**
- All test cases pass with Shields ON and OFF
- No Brave-specific blocks
- Feature fully functional

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## Edge Case Test Cases

### EDGE-001: Very Long Account Name Export

**Objective:** Verify export works with very long account names

**Test Steps:**
1. Create or rename account with very long name:
   `This Is A Very Long Account Name That Exceeds Normal Length And Tests Truncation Behavior`
2. Export account as file
3. Observe filename

**Expected Results:**
- ✅ Export succeeds
- ✅ Filename truncated to reasonable length (~50 chars before timestamp)
- ✅ Full name appears in file content
- ✅ No errors or crashes

**Pass Criteria:**
- Export successful
- Filename reasonable
- Full name preserved in content

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**
- Filename: `_________________________________`
- Length: _____ chars

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### EDGE-002: Unicode Characters in Account Name

**Objective:** Verify unicode/emoji account names work

**Test Steps:**
1. Import WIF with unicode account name:
   - Name: `账户 🔐 Wallet`
2. Complete import
3. Verify account created
4. Export account
5. Verify exported file

**Expected Results:**
- ✅ Import succeeds with unicode name
- ✅ Name displays correctly in UI
- ✅ Export succeeds
- ✅ Filename handles unicode (or sanitizes safely)
- ✅ File content shows full unicode name

**Pass Criteria:**
- Unicode supported
- No encoding errors
- Export/import roundtrip works

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### EDGE-003: Multiple Rapid Exports

**Objective:** Verify rapid consecutive exports work without issues

**Test Steps:**
1. Open export dialog for Account 0
2. Export as file (plaintext)
3. Immediately export again
4. Repeat 5 times rapidly
5. Check all 5 files downloaded

**Expected Results:**
- ✅ All 5 exports succeed
- ✅ All 5 files downloaded
- ✅ Filenames unique (timestamps differentiate)
- ✅ All files contain correct WIF
- ✅ No errors or crashes

**Pass Criteria:**
- Rapid exports work
- No conflicts
- All files valid

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**
- Files downloaded: ____ / 5
- All unique: ☐ Yes | ☐ No

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### EDGE-004: Import During Wallet Auto-Lock

**Objective:** Test import behavior when wallet auto-locks mid-import

**Test Steps:**
1. Unlock wallet
2. Navigate to import screen
3. Upload WIF file
4. Fill in account name
5. **Wait for auto-lock** (15 minutes, or reduce timeout for testing)
6. Attempt to complete import

**Expected Results:**
- ✅ Import blocked
- ✅ Message: "Wallet locked. Please unlock to continue."
- ✅ No partial import
- ✅ Data preserved (can retry after unlock)

**Pass Criteria:**
- Import blocked when locked
- Clear message
- No data loss

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### EDGE-005: Uncompressed vs Compressed WIF Import

**Objective:** Verify both compressed and uncompressed WIF types work

**Test Steps:**

**Compressed WIF Test:**
1. Import compressed WIF: `cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy`
2. Observe address type derived

**Expected:**
- ✅ Import succeeds
- ✅ Address type: Native SegWit (tb1...)
- ✅ Account functional

**Uncompressed WIF Test:**
1. Import uncompressed WIF: `92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc`
2. Observe address type derived

**Expected:**
- ✅ Import succeeds
- ✅ Address type: Legacy (m... or n...)
- ✅ Account functional
- ✅ Warning shown: "Uncompressed keys use legacy addresses only"

**Pass Criteria:**
- Both WIF types supported
- Correct address types derived
- Clear communication to user

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## Regression Test Cases

### REG-001: Existing Account Functionality

**Objective:** Verify existing account features still work after adding export/import

**Preconditions:**
- Wallet with existing accounts

**Test Cases:**

**Create New HD Account:**
- ☐ Can create new account
- ☐ Account appears in list
- ☐ Derivation path correct

**Send Transaction:**
- ☐ Can send from HD account
- ☐ Can send from imported account
- ☐ Fee estimation works

**Receive Transaction:**
- ☐ Can generate receive address
- ☐ QR code displays
- ☐ Copy address works

**Account Switching:**
- ☐ Can switch between accounts
- ☐ Balance updates correctly
- ☐ Transaction history loads

**Wallet Lock/Unlock:**
- ☐ Can lock wallet
- ☐ Can unlock wallet
- ☐ Auto-lock works (15 min)

**Settings:**
- ☐ Can change account names
- ☐ Can delete accounts
- ☐ Settings persist

**Pass Criteria:**
- All existing features work
- No regressions introduced
- User experience unchanged

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

### REG-002: Multisig Account Functionality

**Objective:** Verify multisig features unaffected by export/import feature

**Preconditions:**
- Wallet with multisig account (2-of-2, 2-of-3, or 3-of-5)

**Test Cases:**

**Multisig Account Creation:**
- ☐ Can create new multisig account
- ☐ Wizard flow works
- ☐ Co-signer xpubs accepted

**PSBT Operations:**
- ☐ Can create PSBT for multisig transaction
- ☐ Can export PSBT
- ☐ Can import PSBT
- ☐ Can sign PSBT

**Multisig Receiving:**
- ☐ Can generate multisig receive address
- ☐ Address verification works

**Multisig Export Blocked:**
- ☐ Export button hidden/disabled for multisig accounts
- ☐ Tooltip explains why (if button present)

**Pass Criteria:**
- Multisig features intact
- Export correctly blocked for multisig
- No functionality lost

**Status:** ☐ Not Run | ☐ Pass | ☐ Fail | ☐ Blocked

**Actual Results:**

**Notes/Comments:**

**Tester:** _________________ **Date:** _________________

---

## Test Execution Tracking

### Test Run Summary

**Test Run ID:** TR-____________________
**Date Started:** ____________________
**Date Completed:** ____________________
**Tester:** ____________________
**Environment:** Chrome ____ / Edge ____ / Brave ____ on ____________ OS

---

### Test Case Execution Status

| Test ID | Test Name | Status | P/F | Notes |
|---------|-----------|--------|-----|-------|
| **Happy Path** |
| HP-001 | Export HD plaintext | ☐ Run ☐ Skip | ☐ P ☐ F | |
| HP-002 | Export encrypted | ☐ Run ☐ Skip | ☐ P ☐ F | |
| HP-003 | Export PDF | ☐ Run ☐ Skip | ☐ P ☐ F | |
| HP-004 | Import plaintext file | ☐ Run ☐ Skip | ☐ P ☐ F | |
| HP-005 | Import encrypted file | ☐ Run ☐ Skip | ☐ P ☐ F | |
| HP-006 | Import manual WIF | ☐ Run ☐ Skip | ☐ P ☐ F | |
| HP-007 | Roundtrip test | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **Security** |
| SEC-001 | Multisig blocked | ☐ Run ☐ Skip | ☐ P ☐ F | |
| SEC-002 | Network validation | ☐ Run ☐ Skip | ☐ P ☐ F | |
| SEC-003 | Duplicate detection | ☐ Run ☐ Skip | ☐ P ☐ F | |
| SEC-004 | No console logs | ☐ Run ☐ Skip | ☐ P ☐ F | |
| SEC-005 | Password strength | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **Error Handling** |
| ERR-001 | Wrong password | ☐ Run ☐ Skip | ☐ P ☐ F | |
| ERR-002 | Invalid WIF format | ☐ Run ☐ Skip | ☐ P ☐ F | |
| ERR-003 | Corrupt file | ☐ Run ☐ Skip | ☐ P ☐ F | |
| ERR-004 | Large file | ☐ Run ☐ Skip | ☐ P ☐ F | |
| ERR-005 | Wallet locked | ☐ Run ☐ Skip | ☐ P ☐ F | |
| ERR-006 | Special characters | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **UI/UX** |
| UX-001 | Export modal layout | ☐ Run ☐ Skip | ☐ P ☐ F | |
| UX-002 | Import screen layout | ☐ Run ☐ Skip | ☐ P ☐ F | |
| UX-003 | Password meter | ☐ Run ☐ Skip | ☐ P ☐ F | |
| UX-004 | Drag-and-drop | ☐ Run ☐ Skip | ☐ P ☐ F | |
| UX-005 | Notifications | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **PDF Export** |
| PDF-001 | PDF content | ☐ Run ☐ Skip | ☐ P ☐ F | |
| PDF-002 | QR scanability | ☐ Run ☐ Skip | ☐ P ☐ F | |
| PDF-003 | Print quality | ☐ Run ☐ Skip | ☐ P ☐ F | |
| PDF-004 | Encrypted PDF | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **Cross-Browser** |
| XB-001 | Chrome testing | ☐ Run ☐ Skip | ☐ P ☐ F | |
| XB-002 | Edge testing | ☐ Run ☐ Skip | ☐ P ☐ F | |
| XB-003 | Brave testing | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **Edge Cases** |
| EDGE-001 | Long account name | ☐ Run ☐ Skip | ☐ P ☐ F | |
| EDGE-002 | Unicode characters | ☐ Run ☐ Skip | ☐ P ☐ F | |
| EDGE-003 | Rapid exports | ☐ Run ☐ Skip | ☐ P ☐ F | |
| EDGE-004 | Auto-lock during import | ☐ Run ☐ Skip | ☐ P ☐ F | |
| EDGE-005 | Compressed vs uncompressed | ☐ Run ☐ Skip | ☐ P ☐ F | |
| **Regression** |
| REG-001 | Existing account features | ☐ Run ☐ Skip | ☐ P ☐ F | |
| REG-002 | Multisig functionality | ☐ Run ☐ Skip | ☐ P ☐ F | |

---

### Summary Statistics

**Total Test Cases:** 39
**Executed:** _____
**Passed:** _____
**Failed:** _____
**Blocked:** _____
**Skipped:** _____

**Pass Rate:** _____% (Passed / Executed)

**Critical Bugs Found:** _____
**Major Bugs Found:** _____
**Minor Bugs Found:** _____

**Overall Status:** ☐ Pass | ☐ Fail | ☐ Blocked

---

## Bug Report Template

**Bug ID:** BUG-PK-____
**Reported By:** ________________
**Date:** ________________
**Test Case:** ________________

---

### Bug Details

**Title:** [Short descriptive title]

**Severity:**
- ☐ Critical (P0): Feature unusable, data loss, security issue
- ☐ Major (P1): Feature broken, poor UX, no workaround
- ☐ Minor (P2): Cosmetic, minor inconvenience, has workaround
- ☐ Trivial (P3): Typo, minor visual issue

**Priority:**
- ☐ High: Fix before release
- ☐ Medium: Fix if time allows
- ☐ Low: Fix in future release

**Component:**
- ☐ Export (File)
- ☐ Export (PDF)
- ☐ Import (File)
- ☐ Import (Manual)
- ☐ Encryption/Decryption
- ☐ Validation
- ☐ UI/UX
- ☐ Other: ________________

---

### Environment

**Browser:** ________________
**Version:** ________________
**OS:** ________________
**Extension Version:** ________________

---

### Steps to Reproduce

1.
2.
3.
4.

---

### Expected Behavior

What should happen:

---

### Actual Behavior

What actually happens:

---

### Screenshots/Video

Attach screenshots or screen recording:

---

### Console Errors

Copy console errors (if any):

```

```

---

### Additional Notes

Any other relevant information:

---

### Impact Assessment

**User Impact:**
- Who is affected:
- How often:
- Workaround available:

**Business Impact:**
- Release blocker: ☐ Yes | ☐ No
- Security concern: ☐ Yes | ☐ No
- Data loss risk: ☐ Yes | ☐ No

---

## Release Readiness Checklist

### Pre-Release Testing Completion

**QA Sign-Off**

- ☐ All P0 (Critical) test cases executed and passed
- ☐ All P1 (High priority) test cases executed and passed
- ☐ All critical bugs resolved and verified
- ☐ All major bugs resolved or documented (with workarounds)
- ☐ Regression tests passed (existing features work)
- ☐ Cross-browser testing completed (Chrome, Edge, Brave)
- ☐ Security test cases passed (no sensitive data leaks)
- ☐ Export/Import roundtrip verified (data integrity confirmed)

---

### Feature Verification

**Export Functionality:**
- ☐ HD accounts can be exported as plaintext
- ☐ HD accounts can be exported with password protection
- ☐ HD accounts can be exported as PDF with QR code
- ☐ Multisig accounts correctly blocked from export
- ☐ Exported files have correct format and content
- ☐ Security warnings display correctly

**Import Functionality:**
- ☐ Can import plaintext WIF files
- ☐ Can import password-protected WIF files
- ☐ Can import via manual WIF entry
- ☐ Mainnet keys rejected on testnet wallet
- ☐ Duplicate keys detected and blocked
- ☐ Imported accounts functional (send/receive work)

**PDF Export:**
- ☐ PDF generates successfully
- ☐ PDF contains all required elements
- ☐ QR code is scannable
- ☐ PDF prints clearly

**Security:**
- ☐ No WIF strings in console logs
- ☐ No sensitive data in error messages
- ☐ Network validation works (mainnet blocked)
- ☐ Password strength requirements enforced
- ☐ Duplicate detection works

**UI/UX:**
- ☐ Export modal displays correctly
- ☐ Import screen intuitive and clear
- ☐ Password strength meter accurate
- ☐ Drag-and-drop file upload works
- ☐ Success/error notifications appropriate

---

### Documentation & Communication

- ☐ User documentation updated (if needed)
- ☐ Help content reviewed and accurate
- ☐ Security warnings reviewed by security team
- ☐ Release notes prepared
- ☐ Known issues documented

---

### Performance & Reliability

- ☐ Export completes in < 2 seconds (encrypted)
- ☐ Import completes in < 3 seconds (encrypted)
- ☐ PDF generation completes in < 5 seconds
- ☐ No memory leaks observed
- ☐ No browser crashes or freezes
- ☐ Tested with 100+ accounts (scalability)

---

### Security Audit

- ☐ Security expert reviewed implementation
- ☐ Blockchain expert reviewed WIF handling
- ☐ No private keys logged anywhere
- ☐ Encryption uses Web Crypto API (audited)
- ☐ Network validation prevents mainnet key import
- ☐ All security test cases passed

---

### Browser Compatibility

- ☐ Chrome 120+ tested and working
- ☐ Edge 120+ tested and working
- ☐ Brave 1.60+ tested and working
- ☐ No browser-specific bugs found
- ☐ Extensions permissions adequate

---

### Edge Cases & Error Handling

- ☐ Long account names handled
- ☐ Unicode characters supported
- ☐ Rapid operations work smoothly
- ☐ Wallet lock/unlock edge cases covered
- ☐ Corrupt file upload handled gracefully
- ☐ Large file upload rejected appropriately

---

### Final Approval

**QA Engineer Approval:**

I have completed all required testing. All P0 and P1 test cases have passed. All critical and major bugs have been resolved. The feature is ready for release.

**Signature:** ______________________
**Date:** ______________________

---

**Security Expert Approval:**

I have reviewed the implementation and security test results. No security vulnerabilities found. The feature meets security requirements.

**Signature:** ______________________
**Date:** ______________________

---

**Product Manager Approval:**

The feature meets all acceptance criteria and is ready for release.

**Signature:** ______________________
**Date:** ______________________

---

**Release Status:** ☐ APPROVED | ☐ REJECTED | ☐ NEEDS REVISION

**Release Date:** ______________________

---

**END OF MANUAL TEST PLAN**

---

## Appendix: Quick Reference

### Test Credentials

**Wallet Passwords:**
- Test Wallet 1: `TestPassword123!`
- Test Wallet 2: `SecureWallet456`

**Export Passwords:**
- Weak: `password` (should trigger warning)
- Medium: `Password123`
- Strong: `MyS3cur3!Backup@2025`

### Valid Test WIF Strings

**Testnet Compressed:**
```
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
```

**Testnet Uncompressed:**
```
92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc
```

**Mainnet (Should Reject):**
```
L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ
```

### Useful Commands

**Get Testnet Faucet:**
```
https://testnet-faucet.mempool.co/
```

**Check Transaction:**
```
https://blockstream.info/testnet/tx/[txid]
```

**Check Address:**
```
https://blockstream.info/testnet/address/[address]
```

### Contact Information

**QA Lead:** ________________
**Security Expert:** ________________
**Product Manager:** ________________
**Development Team:** ________________

---

**Document Version:** 1.0
**Last Updated:** 2025-10-19
**Next Review:** [After first test run]
