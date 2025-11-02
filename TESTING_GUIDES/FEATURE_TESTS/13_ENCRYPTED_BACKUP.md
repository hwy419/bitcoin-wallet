# Feature Test Guide: Encrypted Wallet Backup & Restore

**Feature Area:** Wallet Backup, Encrypted Export/Import, Data Migration
**Test Cases:** 36 tests (30 core + 6 edge cases)
**Time to Execute:** 45-60 minutes
**Priority:** P0 (Critical - Data Integrity & Security)
**Version:** v0.12.1+

---

## Overview

This feature validates the complete encrypted wallet backup and restore system. Users can export their entire wallet (accounts, contacts, transaction metadata, settings, multisig configs) to an encrypted file and restore it on another device or after data loss.

**Why this matters:** Complete wallet backups protect users from data loss due to browser corruption, device failure, or accidental deletion. Unlike seed phrase backups, this preserves ALL wallet data including contacts, transaction metadata, imported keys, and multisig configurations.

**What Gets Backed Up:**
- ✅ Wallet seed phrase (encrypted)
- ✅ All accounts (HD-derived, imported keys, multisig)
- ✅ Account indices (externalIndex, internalIndex) - CRITICAL for BIP44 gap limit
- ✅ All addresses with derivation paths
- ✅ Contacts (with tags field) - encrypted
- ✅ Transaction metadata (tags, categories, notes) - encrypted
- ✅ Wallet settings (network, auto-lock timeout)
- ✅ Pending multisig PSBTs

---

## Prerequisites

- [ ] Extension installed (v0.12.1+)
- [ ] Chrome DevTools open (F12) for debugging if needed
- [ ] Two browser profiles OR two browsers (for cross-device testing)
- [ ] Testnet Bitcoin for transaction testing
- [ ] Screenshots folder ready for results
- [ ] **IMPORTANT:** Backup your test wallet before testing restore functionality

---

## Pre-Test Setup: Create Comprehensive Test Wallet

Before testing export/import, create a wallet with diverse data to verify complete restoration.

### Setup Steps

1. **Create New Wallet**
   - Launch extension
   - Create wallet with known seed phrase (for verification)
   - Set wallet password: `TestWallet123!`

2. **Create Multiple Accounts (3+)**
   - Account 1: "Main Account" - Native SegWit (HD-derived)
   - Account 2: "Savings" - SegWit (HD-derived)
   - Account 3: "Legacy Vault" - Legacy (HD-derived)

3. **Import Private Key Account (1+)**
   - Import a testnet private key (WIF format)
   - Name it: "Imported Key 1"
   - Address type: Native SegWit

4. **Create Multisig Account (Optional but recommended)**
   - Configuration: 2-of-3 multisig
   - Name it: "Multisig Vault"
   - Address type: P2WSH

5. **Add Contacts (5+)**
   - Contact 1: "Alice" - tb1q... (category: Friend, tags: company:Acme, role:developer)
   - Contact 2: "Bob's Exchange" - tb1q... (category: Business, tags: type:exchange)
   - Contact 3: "Charlie" - 2... (category: Friend, no tags)
   - Contact 4: "Mining Pool" - tb1q... (category: Service, tags: service:mining)
   - Contact 5: "Satoshi" - m... (category: Other, tags: legendary:true)

6. **Create Transaction History (10+ transactions)**
   - Send 0.001 BTC to Alice
   - Receive from faucet
   - Send to Bob's Exchange
   - Generate multiple addresses across accounts

7. **Add Transaction Metadata (10+ entries)**
   - Tag transactions: "payment", "test", "exchange", "gift"
   - Categorize: "Personal", "Business", "Investment", "Testing"
   - Add notes: "Payment for consulting", "Test transaction", etc.

8. **Create Pending Multisig PSBT (Optional)**
   - Initiate multisig transaction (don't broadcast)
   - Leave as pending

**Estimated Setup Time:** 15-20 minutes

---

## Test Cases

### Section 1: Export Flow Testing

#### EXP-001: Basic Export Flow

**Priority:** P0 (Critical)
**Time:** 5 minutes

**Purpose:** Verify complete export flow from Settings screen to successful backup file download

**Steps:**
1. Open Settings screen (click Settings in sidebar)
2. Scroll to "Security" section
3. Click "Export Encrypted Backup" button
4. **Warning Modal** should appear:
   - [ ] Title: "Export Encrypted Wallet Backup"
   - [ ] Shows security warnings about file protection
   - [ ] Shows what's included in backup (accounts, contacts, etc.)
   - [ ] Has "Cancel" and "Continue" buttons
5. Click "Continue"
6. **Wallet Password Modal** should appear:
   - [ ] Prompts for current wallet password
   - [ ] Has "Back" and "Confirm" buttons
7. Enter wallet password: `TestWallet123!`
8. Click "Confirm"
9. **Backup Password Modal** should appear:
   - [ ] Prompts for new backup password (different from wallet password)
   - [ ] Shows password strength indicator
   - [ ] Has confirmation field
   - [ ] Has "Back" and "Create Backup" buttons
10. Enter backup password: `BackupPass123456` (min 12 chars)
11. Confirm backup password: `BackupPass123456`
12. Click "Create Backup"
13. **Progress Modal** should appear:
    - [ ] Shows progress bar
    - [ ] Shows status text: "Starting export..." → "Export complete!"
    - [ ] Progress reaches 100%
14. **Success Modal** should appear:
    - [ ] Green checkmark icon
    - [ ] Success message
    - [ ] Backup details card showing:
      - [ ] Filename (format: `btcwallet-backup-testnet-YYYY-MM-DD-HHMMSS.json`)
      - [ ] File size (e.g., "24.3 KB")
      - [ ] SHA-256 checksum (truncated with copy button)
      - [ ] Created date/time
    - [ ] Security reminders section
15. File should download automatically to Downloads folder

**Expected Results:**
- ✅ Export completes without errors
- ✅ File downloads with correct naming convention
- ✅ Success modal shows accurate metadata counts
- ✅ All modals display correctly with proper styling

**Screenshot Points:**
- Warning modal
- Backup password modal with strength indicator
- Success modal with backup details

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EXP-002: Export Validation - Wrong Wallet Password

**Priority:** P0 (Critical Security)
**Time:** 2 minutes

**Purpose:** Verify export fails gracefully with incorrect wallet password

**Steps:**
1. Open Settings → "Export Encrypted Backup"
2. Click "Continue" past warning modal
3. Enter WRONG wallet password: `WrongPassword123!`
4. Click "Confirm"

**Expected Results:**
- ✅ Error message appears: "Incorrect password"
- ✅ Modal stays open (doesn't advance to next step)
- ✅ User can retry with correct password
- ✅ No backup file created

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EXP-003: Export Validation - Same Passwords

**Priority:** P0 (Critical Security)
**Time:** 2 minutes

**Purpose:** Verify export fails if backup password matches wallet password (defense in depth)

**Steps:**
1. Open Settings → "Export Encrypted Backup"
2. Click "Continue" past warning modal
3. Enter correct wallet password: `TestWallet123!`
4. Click "Confirm"
5. In backup password modal:
   - Enter backup password: `TestWallet123!` (SAME as wallet password)
   - Confirm: `TestWallet123!`
6. Click "Create Backup"

**Expected Results:**
- ✅ Error message appears: "Backup password must be different from wallet password"
- ✅ Export does not proceed
- ✅ User forced to choose different password

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EXP-004: Export Validation - Weak Backup Password

**Priority:** P1 (High Security)
**Time:** 2 minutes

**Purpose:** Verify backup password strength requirements enforced (min 12 characters)

**Steps:**
1. Open Settings → "Export Encrypted Backup"
2. Proceed through warning and wallet password modals
3. In backup password modal:
   - Enter backup password: `Short1!` (less than 12 chars)
   - Confirm: `Short1!`
4. Attempt to click "Create Backup"

**Expected Results:**
- ✅ Error message: "Password must be at least 12 characters"
- ✅ "Create Backup" button disabled OR validation error shown
- ✅ Password strength indicator shows "Weak" or "Too Short"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EXP-005: Export Validation - Password Mismatch

**Priority:** P1 (High)
**Time:** 2 minutes

**Purpose:** Verify password confirmation field validation

**Steps:**
1. Open Settings → "Export Encrypted Backup"
2. Proceed through warning and wallet password modals
3. In backup password modal:
   - Enter backup password: `BackupPass123456`
   - Confirm: `DifferentPass123456` (doesn't match)
4. Click "Create Backup"

**Expected Results:**
- ✅ Error message: "Passwords do not match"
- ✅ Export does not proceed
- ✅ Validation happens before attempting export

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EXP-006: Backup File Contents Validation

**Priority:** P0 (Critical)
**Time:** 5 minutes

**Purpose:** Verify backup file structure and contents are correct

**Steps:**
1. Complete a successful export (use EXP-001 steps)
2. Locate backup file in Downloads folder
3. Open file in text editor (VS Code, Sublime, Notepad++)
4. Verify JSON structure

**Expected JSON Structure:**
```json
{
  "header": {
    "magicBytes": "BTCWALLET",
    "version": 1,
    "created": 1234567890000,
    "network": "testnet",
    "appVersion": "0.12.1"
  },
  "encryption": {
    "algorithm": "AES-256-GCM",
    "pbkdf2Iterations": 600000,
    "salt": "base64_string...",
    "iv": "base64_string..."
  },
  "encryptedData": "base64_encoded_encrypted_json...",
  "checksum": {
    "algorithm": "SHA-256",
    "hash": "hex_string..."
  }
}
```

**Expected Results:**
- ✅ File is valid JSON (no syntax errors)
- ✅ `header.magicBytes` = "BTCWALLET"
- ✅ `header.version` = 1 (or higher)
- ✅ `header.network` = "testnet" (matches wallet network)
- ✅ `header.appVersion` matches extension version (e.g., "0.12.1")
- ✅ `encryption.algorithm` = "AES-256-GCM"
- ✅ `encryption.pbkdf2Iterations` = 600000 (6x wallet password iterations)
- ✅ `encryption.salt` is Base64 string
- ✅ `encryption.iv` is Base64 string
- ✅ `encryptedData` is Base64 encoded string (encrypted payload)
- ✅ `checksum.algorithm` = "SHA-256"
- ✅ `checksum.hash` is 64-character hex string
- ✅ **CRITICAL:** Seed phrase NOT visible in plaintext
- ✅ **CRITICAL:** Private keys NOT visible in plaintext
- ✅ **CRITICAL:** Passwords NOT visible in plaintext

**Security Check - Search File For (These should NOT appear in plaintext):**
```
❌ Seed phrase words (e.g., "abandon abandon abandon")
❌ Private keys (e.g., "cU8Q2jGeX3GNK...")
❌ WIF keys (starting with 'c' or 'K')
❌ xprv (extended private keys)
❌ Wallet password
❌ Contact names/addresses in plaintext
```

**Allowed in Plaintext:**
```
✅ "testnet" (network type)
✅ "BTCWALLET" (magic bytes)
✅ Encryption metadata (salt, IV, iterations)
✅ Version numbers
✅ Timestamps
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

**🚨 If ANY sensitive data found in plaintext:** CRITICAL SECURITY BUG - Stop testing and report immediately

---

#### EXP-007: Backup File Naming Convention

**Priority:** P2 (Medium)
**Time:** 2 minutes

**Purpose:** Verify backup filename follows consistent naming pattern

**Steps:**
1. Export backup (use EXP-001 steps)
2. Check downloaded filename

**Expected Filename Format:**
```
btcwallet-backup-testnet-YYYY-MM-DD-HHMMSS.json

Examples:
btcwallet-backup-testnet-2025-11-01-143045.json
btcwallet-backup-testnet-2025-11-01-091530.json
```

**Expected Results:**
- ✅ Prefix: `btcwallet-backup-`
- ✅ Network: `testnet` (or `mainnet` if on mainnet)
- ✅ Date: `YYYY-MM-DD` format (current date)
- ✅ Time: `HHMMSS` format (current time)
- ✅ Extension: `.json`
- ✅ Filename is unique (timestamp ensures no collisions)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EXP-008: Multiple Exports - File Uniqueness

**Priority:** P2 (Medium)
**Time:** 3 minutes

**Purpose:** Verify multiple exports create unique files with different checksums

**Steps:**
1. Export first backup (save as Backup1)
2. Wait 2 minutes
3. Export second backup (save as Backup2)
4. Compare files:
   - Filenames
   - Checksums
   - File sizes
   - Timestamps

**Expected Results:**
- ✅ Filenames are different (different timestamps)
- ✅ Checksums are different (different salt/IV each export)
- ✅ File sizes are similar (within 5%)
- ✅ `header.created` timestamps differ
- ✅ Each backup is independently valid

**Note:** Files will differ even with identical wallet state due to:
- Unique salt for backup password encryption
- Unique IV (Initialization Vector)
- Different timestamp

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### Section 2: Import Flow Testing - Fresh Install

#### IMP-001: Fresh Import - Basic Restore

**Priority:** P0 (Critical)
**Time:** 8 minutes

**Purpose:** Verify complete wallet restoration from backup on fresh browser profile (primary use case)

**Setup:**
- Export backup from test wallet (save file)
- Open extension in NEW browser profile OR incognito window
- Extension should show "Welcome" / wallet setup screen

**Steps:**
1. On wallet setup screen, look for "Import Encrypted Backup" option
2. Click "Import Encrypted Backup"
3. **File Selection Modal** should appear:
   - [ ] Shows file upload area (drag-and-drop or click to select)
   - [ ] Instructions text
4. Select backup file (exported in EXP-001)
5. **Backup Password Modal** should appear:
   - [ ] Prompts for backup password
   - [ ] Has "Back" and "Import" buttons
6. Enter backup password: `BackupPass123456`
7. Click "Import"
8. **Progress Modal** should appear:
   - [ ] Shows decryption progress
   - [ ] Shows import progress
   - [ ] Status text updates: "Decrypting..." → "Restoring accounts..." → "Complete!"
9. **Set Wallet Password Modal** should appear:
   - [ ] Prompts to create NEW wallet password
   - [ ] Explanation: "This password will unlock your wallet"
   - [ ] Password strength indicator
   - [ ] Confirmation field
10. Enter NEW wallet password: `NewWalletPass123!`
11. Confirm: `NewWalletPass123!`
12. Click "Set Password"
13. **Success Modal** should appear:
    - [ ] Success message
    - [ ] Shows counts:
      - Accounts restored: X
      - Contacts restored: X
      - Transaction metadata: X
    - [ ] Shows network type (testnet)
    - [ ] Shows backup created date
14. Click "Done"
15. Wallet should be LOCKED initially (security)

**Expected Results:**
- ✅ Import completes without errors
- ✅ Success modal shows correct counts (match export counts)
- ✅ Wallet is locked after import (requires unlock)
- ✅ No errors in console (F12)

**Screenshot Points:**
- File selection modal
- Success modal with restored data counts

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-002: Fresh Import - Unlock and Verify Accounts

**Priority:** P0 (Critical)
**Time:** 5 minutes

**Purpose:** Verify all accounts restored correctly after import

**Prerequisites:** Complete IMP-001 first

**Steps:**
1. Wallet should be locked (requires password)
2. Enter ORIGINAL wallet password: `TestWallet123!` (from exported wallet)
3. Click "Unlock"
4. Navigate to Dashboard
5. **Verify All Accounts Restored:**
   - [ ] Account 1: "Main Account" - Native SegWit
   - [ ] Account 2: "Savings" - SegWit
   - [ ] Account 3: "Legacy Vault" - Legacy
   - [ ] Imported account: "Imported Key 1"
   - [ ] Multisig account: "Multisig Vault" (if created)
6. For each account, verify:
   - [ ] Account name matches exactly
   - [ ] Address type matches
   - [ ] First address matches (compare to original wallet)
7. Open Settings → Check account list
   - [ ] All accounts present
   - [ ] Account types correct (HD-derived vs Imported Key badges)
   - [ ] Multisig accounts show correct configuration

**Expected Results:**
- ✅ Wallet unlocks with ORIGINAL password (not new backup password)
- ✅ All accounts present with correct names
- ✅ Account types (Legacy, SegWit, Native SegWit) match
- ✅ HD-derived accounts show "HD-derived" badge
- ✅ Imported accounts show "Imported Key" badge
- ✅ First address of each account matches original
- ✅ Account count matches export count

**⚠️ IMPORTANT:** User unlocks with ORIGINAL wallet password, NOT backup password. The backup password only protects the backup file.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-003: Fresh Import - Verify Contacts

**Priority:** P0 (Critical)
**Time:** 4 minutes

**Purpose:** Verify all contacts restored with tags and metadata

**Prerequisites:** Complete IMP-001 and IMP-002 first

**Steps:**
1. Ensure wallet is unlocked
2. Navigate to Dashboard → Contacts tab
3. Verify all contacts present:
   - [ ] Alice (category: Friend, tags: company:Acme, role:developer)
   - [ ] Bob's Exchange (category: Business, tags: type:exchange)
   - [ ] Charlie (category: Friend, no tags)
   - [ ] Mining Pool (category: Service, tags: service:mining)
   - [ ] Satoshi (category: Other, tags: legendary:true)
4. For each contact, verify:
   - [ ] Name matches exactly
   - [ ] Address matches exactly
   - [ ] Category matches
   - [ ] Tags match (v0.12.0+)
   - [ ] Notes/email preserved (if any)
5. Click on a contact to open ContactDetailPane
6. Verify all fields editable and functional
7. Try filtering by contact tags (if contacts have tags)

**Expected Results:**
- ✅ All contacts present (count matches export)
- ✅ Contact names match exactly
- ✅ Contact addresses match exactly
- ✅ Contact categories preserved
- ✅ Contact tags preserved (v0.12.0+)
- ✅ Contact colors/categories work correctly
- ✅ ContactDetailPane opens and displays all data
- ✅ Tag filtering works (if applicable)

**Backward Compatibility Check (v0.11.0 backups):**
- If importing v0.11.0 backup (before contact tags):
  - ✅ Contacts restore successfully
  - ✅ Tags field is undefined (not error)
  - ✅ Wallet functions normally

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-004: Fresh Import - Verify Transaction Metadata

**Priority:** P1 (High)
**Time:** 4 minutes

**Purpose:** Verify transaction metadata (tags, categories, notes) restored correctly

**Prerequisites:** Complete IMP-001 and IMP-002 first

**Steps:**
1. Ensure wallet is unlocked
2. Navigate to Dashboard → Transaction History tab
3. Locate transactions that had metadata in original wallet
4. For each transaction, verify:
   - [ ] Category badge visible (if transaction had category)
   - [ ] Tag icon visible (if transaction had tags)
   - [ ] Note icon visible (if transaction had notes)
5. Click on a transaction to open TransactionDetailPane
6. Verify metadata section shows:
   - [ ] Tags match original (e.g., "payment", "test", "exchange")
   - [ ] Category matches original (e.g., "Personal", "Business")
   - [ ] Notes match original text
7. Try filtering transactions by:
   - [ ] Tag (multi-select)
   - [ ] Category (multi-select)
8. Verify autocomplete suggestions work:
   - [ ] Tag autocomplete shows existing tags
   - [ ] Category autocomplete shows existing categories

**Expected Results:**
- ✅ All transaction metadata restored (tags, categories, notes)
- ✅ Metadata count matches export count
- ✅ Visual indicators display correctly in transaction list
- ✅ TransactionDetailPane shows full metadata
- ✅ Filtering by tags/categories works
- ✅ Autocomplete suggestions populated from restored data

**Backward Compatibility Check (v0.11.0 backups):**
- If importing v0.11.0 backup (before transaction metadata):
  - ✅ Import succeeds
  - ✅ Transaction metadata section empty (not error)
  - ✅ Wallet functions normally

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-005: Fresh Import - Verify Multisig Accounts

**Priority:** P1 (High)
**Time:** 4 minutes

**Purpose:** Verify multisig accounts and pending PSBTs restored correctly

**Prerequisites:**
- Complete IMP-001 and IMP-002 first
- Original wallet had multisig account(s)

**Steps:**
1. Ensure wallet is unlocked
2. Navigate to Settings → Accounts
3. Locate multisig account: "Multisig Vault"
4. Verify multisig badge and configuration:
   - [ ] Shows "Multisig" type
   - [ ] Configuration correct (e.g., 2-of-3)
   - [ ] Address type correct (e.g., P2WSH)
5. Open multisig account details
6. Verify co-signer information:
   - [ ] All co-signers present
   - [ ] xpub keys match original
   - [ ] Derivation paths correct
7. Check for pending PSBTs:
   - [ ] Pending transactions restored (if any existed)
   - [ ] PSBT data intact
8. Generate new multisig address
9. Verify address generation works correctly

**Expected Results:**
- ✅ Multisig accounts restored with full configuration
- ✅ Co-signer xpubs preserved
- ✅ Pending PSBTs restored
- ✅ Address generation works (matches original wallet derivation)
- ✅ Can view multisig addresses
- ✅ Can sign transactions (if co-signer)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-006: Fresh Import - Verify Wallet Settings

**Priority:** P2 (Medium)
**Time:** 2 minutes

**Purpose:** Verify wallet settings preserved (network, auto-lock timeout)

**Prerequisites:** Complete IMP-001 and IMP-002 first

**Steps:**
1. Ensure wallet is unlocked
2. Navigate to Settings → About section
3. Verify network setting:
   - [ ] Network shows "Testnet" (matches original)
4. Navigate to Settings → Security section
5. Verify auto-lock timeout:
   - [ ] Shows "15 minutes" (default setting)
6. Test wallet lock/unlock
7. Verify wallet auto-locks after inactivity (if configured)

**Expected Results:**
- ✅ Network setting preserved (testnet/mainnet)
- ✅ Auto-lock timeout preserved
- ✅ Lock/unlock functionality works
- ✅ Settings match original wallet

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-007: Fresh Import - Functional Verification

**Priority:** P0 (Critical)
**Time:** 10 minutes

**Purpose:** Verify wallet is fully functional after restore (not just data present)

**Prerequisites:** Complete IMP-001 through IMP-006 first

**Steps:**
1. **Test Address Generation:**
   - [ ] Select an account
   - [ ] Click "Generate New Address"
   - [ ] New address appears
   - [ ] Address type correct (tb1, 2, m/n prefixes)

2. **Test Send Transaction:**
   - [ ] Navigate to Send screen
   - [ ] Enter recipient address (use testnet faucet address)
   - [ ] Enter amount: 0.0001 BTC
   - [ ] Select fee rate
   - [ ] Click "Review Transaction"
   - [ ] Click "Send"
   - [ ] Enter wallet password
   - [ ] Transaction broadcasts successfully

3. **Test Receive Transaction:**
   - [ ] Navigate to Receive screen
   - [ ] Copy address
   - [ ] Address is valid testnet address
   - [ ] QR code displays (if implemented)

4. **Test Contact Creation:**
   - [ ] Click "Add Contact"
   - [ ] Enter name: "Test Contact"
   - [ ] Enter address
   - [ ] Add tag: "test:restore"
   - [ ] Save contact
   - [ ] Contact appears in list

5. **Test Transaction Metadata:**
   - [ ] Find a transaction
   - [ ] Add tag: "restored-wallet-test"
   - [ ] Add category: "Testing"
   - [ ] Add note: "Verified after restore"
   - [ ] Save metadata
   - [ ] Metadata displays correctly

6. **Test Account Creation:**
   - [ ] Navigate to Settings
   - [ ] Click "Create Account"
   - [ ] Name: "Post-Restore Account"
   - [ ] Address type: Native SegWit
   - [ ] Create account
   - [ ] Account appears in list

**Expected Results:**
- ✅ Can generate new addresses (indices continue from restored state)
- ✅ Can send transactions (wallet is unlocked and signing works)
- ✅ Can receive transactions (addresses are valid)
- ✅ Can add new contacts (contacts storage functional)
- ✅ Can add transaction metadata (metadata storage functional)
- ✅ Can create new accounts (account derivation works)
- ✅ NO errors in console during any operations

**⚠️ CRITICAL:** If address generation fails or sends fail, this indicates incomplete restore (address indices may be corrupt)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### Section 3: Import Flow Testing - Wrong Password / Invalid File

#### IMP-008: Import - Wrong Backup Password

**Priority:** P0 (Critical Security)
**Time:** 2 minutes

**Purpose:** Verify import fails gracefully with incorrect backup password

**Steps:**
1. Fresh browser profile (no wallet)
2. Click "Import Encrypted Backup"
3. Select valid backup file
4. Enter WRONG backup password: `WrongBackupPassword123`
5. Click "Import"

**Expected Results:**
- ✅ Error message: "Incorrect backup password" or "Decryption failed"
- ✅ Modal stays on password entry screen
- ✅ User can retry with correct password
- ✅ No wallet created
- ✅ No partial data imported

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-009: Import - Corrupted Backup File

**Priority:** P1 (High)
**Time:** 3 minutes

**Purpose:** Verify import rejects corrupted or invalid backup files

**Setup:**
1. Take a valid backup file
2. Open in text editor
3. Modify `encryptedData` field (change 10 characters)
4. Save as `corrupted-backup.json`

**Steps:**
1. Fresh browser profile
2. Click "Import Encrypted Backup"
3. Select corrupted backup file
4. Enter correct backup password
5. Click "Import"

**Expected Results:**
- ✅ Validation error: "Backup file is corrupted or invalid"
- ✅ Import aborts before decryption attempt
- ✅ Clear error message to user
- ✅ No wallet created

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-010: Import - Non-JSON File

**Priority:** P1 (High)
**Time:** 2 minutes

**Purpose:** Verify import rejects non-JSON files

**Setup:**
1. Create a text file: `fake-backup.json`
2. Content: "This is not a valid backup file"

**Steps:**
1. Fresh browser profile
2. Click "Import Encrypted Backup"
3. Select fake backup file
4. Attempt import

**Expected Results:**
- ✅ Validation error: "Invalid file format"
- ✅ Clear error message before password prompt
- ✅ User can select different file

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-011: Import - Wrong File Format (Missing Fields)

**Priority:** P1 (High)
**Time:** 3 minutes

**Purpose:** Verify import validates required fields in backup file

**Setup:**
1. Create JSON file with missing `header.magicBytes`:
```json
{
  "header": {
    "version": 1,
    "created": 1234567890000,
    "network": "testnet"
  },
  "encryption": {},
  "encryptedData": "fake_data",
  "checksum": {}
}
```

**Steps:**
1. Fresh browser profile
2. Click "Import Encrypted Backup"
3. Select invalid backup file
4. Attempt import

**Expected Results:**
- ✅ Validation error: "Invalid backup file format"
- ✅ Import aborts early (before password prompt)
- ✅ Error specifies what's wrong (e.g., "Missing magic bytes")

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### IMP-012: Import - Network Mismatch Warning

**Priority:** P0 (Critical Security)
**Time:** 3 minutes

**Purpose:** Verify import warns/blocks when backup network doesn't match wallet network

**Setup:**
- Wallet configured for testnet
- Backup file from mainnet wallet (or vice versa)

**Note:** Since we're on testnet, simulate by editing backup file:
1. Export testnet backup
2. Open in text editor
3. Change `header.network` from "testnet" to "mainnet"
4. Save as `mainnet-backup.json`

**Steps:**
1. Fresh browser profile
2. Click "Import Encrypted Backup"
3. Select mainnet backup file
4. Enter backup password
5. Attempt import

**Expected Results:**
- ✅ **Network Mismatch Warning Modal** appears
- ✅ Warning explains: "This backup is from mainnet but wallet is configured for testnet"
- ✅ Options: "Cancel Import" and "Continue Anyway" (or block entirely)
- ✅ If allowed to continue, user must acknowledge risk
- ✅ Import should ideally be BLOCKED (network mismatch is dangerous)

**Security Note:** Network mismatch can lead to loss of funds if mainnet keys used on testnet or vice versa.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### Section 4: Backward Compatibility Testing

#### BC-001: Import v0.12.0 Backup (No Transaction Metadata)

**Priority:** P1 (High)
**Time:** 5 minutes

**Purpose:** Verify wallet can import backups from v0.12.0 (before transaction metadata feature)

**Setup:**
- Obtain backup file from v0.12.0 wallet (before transaction metadata)
- Or manually edit backup file to remove `transactionMetadata` field

**Steps:**
1. Fresh browser profile
2. Import v0.12.0 backup file
3. Enter backup password
4. Complete import
5. Unlock wallet
6. Verify:
   - [ ] Accounts restored
   - [ ] Contacts restored
   - [ ] Transaction history present
   - [ ] Transaction metadata section shows empty (not error)
   - [ ] Can add NEW transaction metadata to existing transactions
   - [ ] Wallet fully functional

**Expected Results:**
- ✅ Import succeeds without errors
- ✅ Missing `transactionMetadata` field doesn't cause error
- ✅ Wallet treats missing field as "no metadata" (graceful degradation)
- ✅ User can start adding metadata to transactions
- ✅ All other features work normally

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### BC-002: Import v0.11.0 Backup (No Contact Tags)

**Priority:** P1 (High)
**Time:** 5 minutes

**Purpose:** Verify wallet can import backups from v0.11.0 (before contact tags feature)

**Setup:**
- Obtain backup file from v0.11.0 wallet (before contact tags)
- Or manually edit backup to remove `tags` field from contacts

**Steps:**
1. Fresh browser profile
2. Import v0.11.0 backup file
3. Enter backup password
4. Complete import
5. Unlock wallet
6. Verify:
   - [ ] Contacts restored
   - [ ] Contact tags field undefined (not error)
   - [ ] Can view contact details
   - [ ] Can add NEW tags to existing contacts
   - [ ] Contact filtering works (no tags shown for old contacts)

**Expected Results:**
- ✅ Import succeeds without errors
- ✅ Contacts without tags field work normally
- ✅ User can add tags to old contacts
- ✅ Tag filtering doesn't break with undefined tags
- ✅ All other features work normally

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### Section 5: Round-Trip Testing

#### RT-001: Export → Import → Export (Data Preservation)

**Priority:** P0 (Critical)
**Time:** 10 minutes

**Purpose:** Verify data is preserved across multiple export/import cycles (no data degradation)

**Steps:**
1. **First Export:**
   - Export backup from test wallet
   - Save as `backup1.json`
   - Note checksum, file size, account count

2. **Import to New Profile:**
   - Fresh browser profile
   - Import `backup1.json`
   - Unlock wallet

3. **Second Export:**
   - Export backup from restored wallet
   - Save as `backup2.json`
   - Note checksum, file size, account count

4. **Compare Backups:**
   - Account counts should match
   - Contact counts should match
   - Transaction metadata counts should match
   - File sizes should be similar (within 5%)
   - Checksums will differ (different salt/IV)

5. **Verify Data:**
   - Import `backup2.json` to another fresh profile
   - Verify all accounts match original
   - Verify all contacts match original
   - Verify all metadata matches original

**Expected Results:**
- ✅ Account count preserved (backup1 == backup2)
- ✅ Contact count preserved
- ✅ Transaction metadata count preserved
- ✅ Account names identical
- ✅ Contact data identical
- ✅ No data loss across cycles
- ✅ File sizes similar (metadata growth should be minimal)

**⚠️ CRITICAL:** If counts decrease or data is lost, this indicates data corruption during import/export cycle

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### RT-002: Round-Trip with New Data Added

**Priority:** P1 (High)
**Time:** 8 minutes

**Purpose:** Verify wallet can export after import (indices preserved correctly)

**Steps:**
1. Import backup to fresh profile
2. Unlock wallet
3. **Add New Data:**
   - Create new account: "New Account Post-Import"
   - Add new contact: "New Contact Post-Import"
   - Generate 5 new addresses
   - Send 1 test transaction
   - Add transaction metadata to new transaction
4. **Export Second Backup:**
   - Export wallet backup
   - Save as `backup-with-additions.json`
5. **Verify Second Backup:**
   - Account count increased by 1
   - Contact count increased by 1
   - Transaction metadata count increased
   - File size larger (more data)

**Expected Results:**
- ✅ Can export after import (no state corruption)
- ✅ New data included in export
- ✅ Old data still present
- ✅ Address indices incremented correctly
- ✅ Export successful with no errors

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### Section 6: Edge Cases & Stress Testing

#### EDGE-001: Large Wallet Backup (Performance)

**Priority:** P2 (Medium)
**Time:** 10 minutes

**Purpose:** Verify export/import handles large wallets without performance issues

**Setup:**
1. Create wallet with large dataset:
   - 20+ accounts
   - 100+ contacts
   - 500+ transaction metadata entries (if possible)
2. Or simulate by duplicating data in backup file JSON

**Steps:**
1. Export large wallet backup
2. Time export operation (should complete in < 30 seconds)
3. Note file size
4. Import to fresh profile
5. Time import operation (should complete in < 60 seconds)
6. Verify all data imported correctly

**Expected Results:**
- ✅ Export completes (even if takes longer)
- ✅ Import completes (may show progress longer)
- ✅ All accounts imported
- ✅ All contacts imported
- ✅ All metadata imported
- ✅ File size reasonable (< 10 MB for 20 accounts + 100 contacts)
- ✅ No browser timeout errors

**Performance Benchmarks:**
- Export: < 30 seconds (target)
- Import: < 60 seconds (target)
- File size: ~1-2 MB per 10 accounts + 50 contacts

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EDGE-002: Empty Wallet Backup

**Priority:** P2 (Medium)
**Time:** 4 minutes

**Purpose:** Verify export/import works with minimal wallet data

**Setup:**
1. Create new wallet
2. Do NOT create accounts, contacts, or metadata
3. Wallet has only default account

**Steps:**
1. Export backup (only default account)
2. Verify export succeeds
3. Import to fresh profile
4. Verify import succeeds
5. Check:
   - [ ] Default account present
   - [ ] No contacts (empty list, not error)
   - [ ] No transaction metadata (empty, not error)
   - [ ] Wallet functional

**Expected Results:**
- ✅ Export succeeds with minimal data
- ✅ Import succeeds
- ✅ Wallet functional after import
- ✅ File size small (~5-10 KB)
- ✅ No errors with empty data structures

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EDGE-003: Import Hangs or Times Out

**Priority:** P1 (High)
**Time:** 5 minutes

**Purpose:** Verify behavior if import takes longer than expected (key derivation)

**Note:** Key derivation can be slow for wallets with many accounts (BIP32 computation)

**Steps:**
1. Import large backup (20+ accounts)
2. Observe progress modal
3. Wait up to 2 minutes for completion
4. If progress modal shows "Deriving keys..." for extended time, this is NORMAL

**Expected Results:**
- ✅ Progress modal shows status: "Deriving keys for account X of Y"
- ✅ Import completes eventually (may take 1-2 minutes)
- ✅ Progress bar or spinner indicates ongoing work (not frozen)
- ✅ User can cancel import if desired
- ✅ Import doesn't timeout or crash browser

**Acceptable Timeouts:**
- 10 accounts: < 30 seconds
- 20 accounts: < 60 seconds
- 50 accounts: < 2 minutes

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EDGE-004: Special Characters in Account Names / Contact Names

**Priority:** P2 (Medium)
**Time:** 5 minutes

**Purpose:** Verify export/import preserves special characters, unicode, emojis

**Setup:**
1. Create accounts with special names:
   - "Bitcoin 🚀 Account"
   - "Épargne Française"
   - "账户 (Chinese)"
   - "Special !@#$%^&*() Chars"
2. Create contacts with unicode names:
   - "José García"
   - "Satoshi 中本哲史"

**Steps:**
1. Export backup
2. Import to fresh profile
3. Verify names preserved exactly:
   - [ ] Emojis intact
   - [ ] Accented characters intact (é, ñ, ü)
   - [ ] Chinese/Japanese characters intact
   - [ ] Special characters intact (!@#$%^&*())

**Expected Results:**
- ✅ All unicode characters preserved
- ✅ Emojis displayed correctly
- ✅ Accented characters correct
- ✅ No character encoding corruption
- ✅ Names match exactly (byte-for-byte)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EDGE-005: Import After Browser Restart

**Priority:** P1 (High)
**Time:** 4 minutes

**Purpose:** Verify import works after browser restart (no session state issues)

**Steps:**
1. Open fresh browser profile
2. Click "Import Encrypted Backup"
3. **BEFORE selecting file:** Close browser completely
4. Reopen browser
5. Navigate to extension tab
6. Click "Import Encrypted Backup" again
7. Select backup file
8. Complete import

**Expected Results:**
- ✅ Import flow restarts cleanly after browser restart
- ✅ No session state corruption
- ✅ Import completes successfully
- ✅ Wallet functional after import

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### EDGE-006: Multiple Import Attempts (Retry After Failure)

**Priority:** P2 (Medium)
**Time:** 4 minutes

**Purpose:** Verify user can retry import after entering wrong password

**Steps:**
1. Fresh browser profile
2. Click "Import Encrypted Backup"
3. Select backup file
4. Enter WRONG password (first attempt)
5. Import fails
6. Click "Retry" or "Back"
7. Enter CORRECT password (second attempt)
8. Import succeeds

**Expected Results:**
- ✅ Failed import doesn't corrupt state
- ✅ User can retry with same file
- ✅ Second attempt succeeds
- ✅ No errors from first failed attempt
- ✅ Wallet data intact after retry

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Section 7: Security Verification

#### SEC-001: Backup Password Must Differ from Wallet Password

**Priority:** P0 (Critical Security)
**Time:** 2 minutes

**Purpose:** Verify defense-in-depth: backup password MUST be different from wallet password

**Steps:**
1. Export backup
2. Enter wallet password: `TestWallet123!`
3. Try to set backup password to SAME value: `TestWallet123!`
4. Attempt export

**Expected Results:**
- ✅ Export BLOCKED with error: "Backup password must be different from wallet password"
- ✅ User cannot proceed
- ✅ Clear explanation why (defense in depth)

**Security Rationale:**
- Separate passwords ensure compromise of one doesn't compromise both
- Backup file can be stored separately from wallet
- Two-layer encryption for maximum security

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### SEC-002: Backup File Encrypted (Cannot Read Sensitive Data)

**Priority:** P0 (Critical Security)
**Time:** 3 minutes

**Purpose:** Verify backup file protects sensitive data from file inspection

**Steps:**
1. Export backup
2. Open backup file in text editor
3. Search for sensitive data (use Ctrl+F):
   - Seed phrase words (e.g., "abandon", "able", "about")
   - Contact names (e.g., "Alice", "Bob")
   - Private keys (WIF format starting with 'c' or 'K')
   - xprv (extended private key prefix)

**Expected Results:**
- ✅ NO seed phrase visible in plaintext
- ✅ NO contact names visible in plaintext
- ✅ NO private keys visible in plaintext
- ✅ NO xprv keys visible in plaintext
- ✅ `encryptedData` field is Base64-encoded ciphertext (unreadable)
- ✅ Only encryption metadata visible (salt, IV, iterations)

**🚨 If ANY sensitive data found in plaintext:** CRITICAL SECURITY VULNERABILITY - Stop testing and report immediately!

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### SEC-003: Checksum Verification Prevents File Tampering

**Priority:** P1 (High Security)
**Time:** 3 minutes

**Purpose:** Verify checksum validation detects file tampering

**Setup:**
1. Export backup
2. Open in text editor
3. Change ONE character in `encryptedData` field
4. Save modified file

**Steps:**
1. Fresh browser profile
2. Import tampered backup file
3. Enter correct backup password
4. Attempt import

**Expected Results:**
- ✅ Checksum validation fails BEFORE decryption attempt
- ✅ Error: "Backup file integrity check failed" or "Checksum mismatch"
- ✅ Import aborted
- ✅ No decryption attempted (prevents oracle attacks)

**Security Note:** Checksum verification prevents:
- File corruption detection
- Tampering detection
- Man-in-the-middle modifications

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

#### SEC-004: Password Strength Indicator Works

**Priority:** P2 (Medium Security)
**Time:** 3 minutes

**Purpose:** Verify password strength indicator guides users to strong passwords

**Steps:**
1. Export backup
2. Proceed to backup password creation modal
3. Test various passwords and observe strength indicator:
   - [ ] "weak" → Shows weak/red
   - [ ] "Weak123!" → Shows weak/orange
   - [ ] "Medium1234!" → Shows medium/yellow
   - [ ] "StrongPassword123!" → Shows strong/green
   - [ ] "VeryStr0ng!P@ssw0rd2024" → Shows very strong/green

**Expected Results:**
- ✅ Strength indicator updates in real-time
- ✅ Color coding matches strength (red→orange→yellow→green)
- ✅ Minimum length enforced (12 chars)
- ✅ User guided to choose strong password
- ✅ Recommendations shown (e.g., "Add numbers and symbols")

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Section 8: Test Data Tracking

Use this table to track test execution results:

| Test ID | Description | Status | Notes | Tester | Date |
|---------|-------------|--------|-------|--------|------|
| **Section 1: Export Flow** |
| EXP-001 | Basic Export Flow | ☐ Pass ☐ Fail | | | |
| EXP-002 | Wrong Wallet Password | ☐ Pass ☐ Fail | | | |
| EXP-003 | Same Passwords | ☐ Pass ☐ Fail | | | |
| EXP-004 | Weak Backup Password | ☐ Pass ☐ Fail | | | |
| EXP-005 | Password Mismatch | ☐ Pass ☐ Fail | | | |
| EXP-006 | File Contents Validation | ☐ Pass ☐ Fail | | | |
| EXP-007 | File Naming Convention | ☐ Pass ☐ Fail | | | |
| EXP-008 | Multiple Exports | ☐ Pass ☐ Fail | | | |
| **Section 2: Fresh Import** |
| IMP-001 | Basic Restore | ☐ Pass ☐ Fail | | | |
| IMP-002 | Verify Accounts | ☐ Pass ☐ Fail | | | |
| IMP-003 | Verify Contacts | ☐ Pass ☐ Fail | | | |
| IMP-004 | Verify Metadata | ☐ Pass ☐ Fail | | | |
| IMP-005 | Verify Multisig | ☐ Pass ☐ Fail | | | |
| IMP-006 | Verify Settings | ☐ Pass ☐ Fail | | | |
| IMP-007 | Functional Verification | ☐ Pass ☐ Fail | | | |
| **Section 3: Invalid Import** |
| IMP-008 | Wrong Password | ☐ Pass ☐ Fail | | | |
| IMP-009 | Corrupted File | ☐ Pass ☐ Fail | | | |
| IMP-010 | Non-JSON File | ☐ Pass ☐ Fail | | | |
| IMP-011 | Wrong Format | ☐ Pass ☐ Fail | | | |
| IMP-012 | Network Mismatch | ☐ Pass ☐ Fail | | | |
| **Section 4: Backward Compatibility** |
| BC-001 | v0.12.0 Backup | ☐ Pass ☐ Fail | | | |
| BC-002 | v0.11.0 Backup | ☐ Pass ☐ Fail | | | |
| **Section 5: Round-Trip** |
| RT-001 | Export→Import→Export | ☐ Pass ☐ Fail | | | |
| RT-002 | Round-Trip + New Data | ☐ Pass ☐ Fail | | | |
| **Section 6: Edge Cases** |
| EDGE-001 | Large Wallet | ☐ Pass ☐ Fail | | | |
| EDGE-002 | Empty Wallet | ☐ Pass ☐ Fail | | | |
| EDGE-003 | Import Timeout | ☐ Pass ☐ Fail | | | |
| EDGE-004 | Special Characters | ☐ Pass ☐ Fail | | | |
| EDGE-005 | Browser Restart | ☐ Pass ☐ Fail | | | |
| EDGE-006 | Multiple Attempts | ☐ Pass ☐ Fail | | | |
| **Section 7: Security** |
| SEC-001 | Different Passwords | ☐ Pass ☐ Fail | | | |
| SEC-002 | File Encrypted | ☐ Pass ☐ Fail | | | |
| SEC-003 | Checksum Validation | ☐ Pass ☐ Fail | | | |
| SEC-004 | Password Strength | ☐ Pass ☐ Fail | | | |

**Test Summary:**
- Total Tests: 36
- Passed: ___
- Failed: ___
- Pass Rate: ___%
- Critical Bugs (P0): ___
- High Priority Bugs (P1): ___
- Medium Priority Bugs (P2): ___

---

## Known Limitations & Expected Behavior

### Expected Behavior

**Backup File Network Specificity:**
- ✅ Testnet backups ONLY work on testnet wallets
- ✅ Mainnet backups ONLY work on mainnet wallets
- ✅ Cross-network import should be blocked or heavily warned

**Password Requirements:**
- ✅ Wallet password: Minimum 8 characters (existing requirement)
- ✅ Backup password: Minimum 12 characters (stricter for file protection)
- ✅ Backup password MUST differ from wallet password (defense in depth)

**Unlock Password:**
- ✅ After import, user unlocks with ORIGINAL wallet password (not backup password)
- ✅ Backup password ONLY protects the backup file, not the wallet itself

**Transaction History NOT Backed Up:**
- ✅ Transaction history is NOT included in backups (too large, fetched from blockchain)
- ✅ Transaction METADATA (tags, categories, notes) IS backed up
- ✅ Wallet will re-fetch transaction history from Blockstream API after import

**UTXO States NOT Backed Up:**
- ✅ UTXO states (spent/unspent) are NOT backed up
- ✅ Wallet will re-sync UTXOs from Blockstream API after import
- ✅ Balance may temporarily show 0 until sync completes

### Known Issues (If Any)

*Document any known issues discovered during testing here:*

1. **Issue:** _____________
   - **Severity:** P0 / P1 / P2 / P3
   - **Steps to Reproduce:** _____________
   - **Expected:** _____________
   - **Actual:** _____________
   - **Workaround:** _____________

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue: "Incorrect password" during import**
- **Cause:** Using wallet password instead of backup password, or typo
- **Solution:** Use the backup password you set during export (not wallet password)
- **Verify:** Try exporting a new backup and immediately importing it

**Issue: "Network mismatch" error**
- **Cause:** Trying to import testnet backup to mainnet wallet or vice versa
- **Solution:** Cannot import cross-network. Use same network as backup
- **Workaround:** None - this is a security feature

**Issue: "Corrupted file" error**
- **Cause:** Backup file was modified or corrupted during download/transfer
- **Solution:** Re-download backup file from secure location, verify checksum
- **Verify:** Compare SHA-256 checksum to original export checksum

**Issue: Import hangs at "Deriving keys..."**
- **Cause:** Large wallet with many accounts (BIP32 derivation is CPU-intensive)
- **Expected:** Normal for 20+ accounts, may take 1-2 minutes
- **Solution:** Wait patiently, import WILL complete
- **Max Time:** 2 minutes for 50 accounts (acceptable)

**Issue: Balance shows 0 after import**
- **Cause:** Wallet needs to re-sync UTXOs from blockchain
- **Expected:** Temporary, balance will update within 30-60 seconds
- **Solution:** Wait for blockchain sync, refresh Dashboard
- **Verify:** Check account addresses on Blockstream Explorer

**Issue: Transaction history empty after import**
- **Cause:** Transaction history is NOT included in backups (fetched from blockchain)
- **Expected:** History will populate after blockchain sync
- **Solution:** Wait 30-60 seconds, refresh page
- **Note:** Transaction metadata (tags, notes) IS preserved

**Issue: "File too large" (>10 MB)**
- **Cause:** Extremely large wallet (hundreds of accounts/contacts)
- **Expected:** Rare, but possible for power users
- **Solution:** Import should still work, may take longer
- **Performance:** May need to optimize for very large wallets

---

## Security Checklist

Before approving this feature for production, verify:

- [ ] **NO sensitive data in console logs** (seed phrases, private keys, passwords)
- [ ] **Backup file encrypted** (seed phrase not visible in plaintext)
- [ ] **Checksum validation works** (detects file tampering)
- [ ] **Password requirements enforced** (12 char min, different from wallet password)
- [ ] **Network validation works** (prevents cross-network imports)
- [ ] **File format validation** (rejects invalid JSON, missing fields)
- [ ] **Backward compatibility tested** (v0.11.0 and v0.12.0 backups import successfully)
- [ ] **Round-trip tested** (export→import→export preserves all data)
- [ ] **Functional after restore** (can send/receive, generate addresses, add contacts)
- [ ] **No memory leaks** (sensitive data cleared after operations)
- [ ] **Error handling graceful** (clear messages, no crashes)
- [ ] **Performance acceptable** (export <30s, import <60s for normal wallets)

---

## Test Environment Details

**Fill out before testing:**

| Item | Details |
|------|---------|
| Extension Version | v_______ |
| Chrome Version | _______ |
| Operating System | _______ |
| Network | Testnet / Mainnet |
| Test Date | _______ |
| Tester Name | _______ |
| Browser Profile | Fresh / Existing |
| Test Wallet Seed | (For verification only - keep secure) |

---

## Appendix: Test Data Examples

### Sample Backup File Structure (Plaintext Header)

```json
{
  "header": {
    "magicBytes": "BTCWALLET",
    "version": 1,
    "created": 1730476800000,
    "network": "testnet",
    "appVersion": "0.12.1"
  },
  "encryption": {
    "algorithm": "AES-256-GCM",
    "pbkdf2Iterations": 600000,
    "salt": "5FZj8KxW/gH3mPq2vNbL9A==",
    "iv": "rT8x2YdK5wQ3=="
  },
  "encryptedData": "aGVsbG8gd29ybGQgdGhpcyBpcyBmYWtlIGVuY3J5cHRlZCBkYXRhLi4u",
  "checksum": {
    "algorithm": "SHA-256",
    "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  }
}
```

### Sample Contact Data (For Verification)

| Contact Name | Address | Category | Tags |
|--------------|---------|----------|------|
| Alice | tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx | Friend | company:Acme, role:developer |
| Bob's Exchange | tb1q3j4k5l6m7n8p9qrstuv0wxyz1234567890abcd | Business | type:exchange |
| Charlie | 2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc | Friend | (no tags) |

### Sample Transaction Metadata (For Verification)

| TxID (First 10 chars) | Tags | Category | Notes |
|-----------------------|------|----------|-------|
| a1b2c3d4e5... | payment, consulting | Business | Payment for web development work |
| f6g7h8i9j0... | test, faucet | Testing | Testnet faucet transaction |
| k1l2m3n4o5... | exchange, withdrawal | Investment | Withdrawal from Bob's Exchange |

---

## Sign-Off

**QA Engineer Sign-Off:**

I have completed testing of the Encrypted Wallet Backup & Restore feature and confirm:

- [ ] All P0 (Critical) tests executed and passed
- [ ] All P1 (High) tests executed and passed
- [ ] Security checklist verified
- [ ] No critical bugs found
- [ ] Feature ready for production release

**Signature:** _____________
**Date:** _____________
**Pass Rate:** ____%

**Blocker Bugs (P0):** ___ (List bug IDs: _____________)
**High Priority Bugs (P1):** ___ (List bug IDs: _____________)

---

**End of Test Guide**
