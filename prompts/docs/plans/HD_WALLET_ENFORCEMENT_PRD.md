# HD Wallet Enforcement & Account Segregation PRD

**Version:** 1.1 [UPDATED - Backup Restoration]
**Status:** Draft
**Created:** 2025-10-27
**Last Updated:** 2025-10-27
**Author:** Bitcoin Wallet Product Manager

---

## Executive Summary [UPDATED - Backup Restoration]

This PRD addresses three critical UX and data integrity issues in the Bitcoin wallet, with an important addition for backup restoration:

1. **HD-Only Initial Creation**: Users MUST create an HD wallet (from seed phrase) on first use—no option to create non-HD wallets as the first action
2. **Account Segregation**: HD-derived accounts and imported accounts (from private keys) must be visually grouped and segregated in the UI
3. **Button Visibility Fix**: Export Xpub button should ONLY appear for HD-derived accounts, not for imported accounts
4. **[NEW] Encrypted Backup Restoration**: Users can restore their entire wallet from an encrypted .dat backup file during initial setup

**Current Issues:**
- Users can bypass HD wallet creation by importing a private key during initial setup
- All accounts (HD and imported) are mixed together in account switcher and Settings
- Export Xpub button incorrectly appears for imported accounts (e.g., "Hello" imported account)

**[NEW] Backup Restoration Addition:**
- The wallet already supports "Export Encrypted Backup" in Settings
- This PRD adds the corresponding "Restore from Backup" option during initial wallet setup
- Provides complete migration path: Export on old device → Restore on new device
- Includes all wallet data: accounts (HD + imported), contacts, settings, multisig config
- Rate-limited password attempts (5 per 15 min) for security
- Comprehensive error handling: corrupted files, wrong password, version mismatches, non-HD wallets

**Impact:** Medium-High Priority
**Estimated Effort:** 5.5-6 days (frontend + backend changes, +1.5 days for backup restoration)

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [User Stories & Acceptance Criteria](#2-user-stories--acceptance-criteria)
3. [User Journeys](#3-user-journeys)
4. [Edge Cases & Migration](#4-edge-cases--migration)
5. [UI/UX Specifications](#5-uiux-specifications)
6. [Technical Requirements](#6-technical-requirements)
7. [Success Metrics](#7-success-metrics)
8. [Testing Plan](#8-testing-plan)
9. [Expert Handoffs](#9-expert-handoffs)

---

## 1. Problem Statement

### 1.1 Current Behavior (Problematic)

**Issue 1: Non-HD Wallet Creation on First Use**

Users can currently create a wallet in three ways during initial setup (WalletSetup.tsx):

```
Tab 1: Create (HD wallet) ✅
Tab 2: Seed (Import HD wallet from seed) ✅
Tab 3: Key (Import from private key) ❌ SHOULD NOT BE AVAILABLE INITIALLY
Tab 4: Backup (Restore from .dat file) ✅
```

**Problem:** Tab 3 (Import Private Key) creates a **non-HD wallet** with only a single imported account. This violates the principle that all wallets should have an HD foundation.

**Example Bad Flow:**
```
1. User opens wallet for first time
2. User clicks "Key" tab
3. User pastes WIF private key
4. User sets password
5. ❌ Wallet created WITHOUT HD seed phrase
6. ❌ User has no backup seed phrase
7. ❌ User can only export individual private keys
```

**Issue 2: Account Mixing in UI**

All accounts are displayed together in the account switcher and Settings screen, regardless of whether they're HD-derived or imported:

```
Account Switcher (Current - BAD):
┌─────────────────────────┐
│ ₿ Account 1 (HD)       │  ← HD-derived
│ ₿ Trading (HD)         │  ← HD-derived
│ ₿ Hello (Imported)     │  ← Imported private key
│ ₿ Savings (HD)         │  ← HD-derived
└─────────────────────────┘
```

**Problem:** No visual distinction or grouping. Users can't quickly identify which accounts require separate backup.

**Issue 3: Export Xpub Button on Imported Accounts**

The "Export Xpub" button appears for ALL accounts, including imported private key accounts:

```typescript
// SettingsScreen.tsx line 359 (CURRENT - INCORRECT)
{account.importType !== 'private-key' && (
  <button onClick={() => openExportXpubModal(account)}>
    Export Xpub
  </button>
)}
```

**Problem:** Logic is correct in code BUT `importType` field may not be properly set for all imported accounts, causing the button to appear incorrectly.

### 1.2 Desired Behavior

**Fix 1: HD-Only Initial Setup**

```
First-time wallet creation options:
┌─────────────────────────────────────┐
│ Tab 1: Create (Generate new seed)  │ ✅ Available
│ Tab 2: Seed (Import existing seed) │ ✅ Available
│ Tab 3: Backup (Restore .dat file)  │ ✅ Available
│ Tab 4: Key (Import private key)    │ ❌ REMOVED
└─────────────────────────────────────┘

After HD wallet exists:
- Import Account action available in Settings
- Import Account action available in Sidebar dropdown
```

**Fix 2: Account Segregation**

```
Account Switcher (NEW - GOOD):
┌──────────────────────────────────────┐
│ HD Accounts                          │
│ ─────────────────────────────────────│
│ ₿ Account 1 (Native SegWit)         │
│ ₿ Trading (Native SegWit)            │
│ ₿ Savings (Legacy)                   │
│                                      │
│ Imported Accounts                    │
│ ─────────────────────────────────────│
│ ₿ Hello [Key]                        │
│ ₿ Old Wallet [Key]                   │
│                                      │
│ Multisig Accounts                    │
│ ─────────────────────────────────────│
│ 🔐 Joint Account (2-of-3)            │
└──────────────────────────────────────┘
```

**Fix 3: Correct Export Button Visibility**

```typescript
// Export Xpub: Only for HD accounts
{account.accountType === 'single' &&
 (account.importType === 'hd' || account.importType === undefined) && (
  <button>Export Xpub</button>
)}

// Export Private Key: For all single-sig accounts
{account.accountType === 'single' && (
  <button>Export Key</button>
)}
```

---

## 2. User Stories & Acceptance Criteria

### Story 1: HD-Only Initial Wallet Creation [UPDATED - Backup Restoration]

**As a** new user
**I want to** be forced to create or import an HD wallet first
**So that** I always have a secure backup seed phrase

**Acceptance Criteria:**

- [P0] ✅ WalletSetup component MUST NOT show "Key" tab during initial setup
- [P0] ✅ Only "Create", "Seed", and "Backup" tabs are available on first run
- [P0] ✅ All three flows create/import an HD wallet with a seed phrase
- [P0] ✅ "Create" tab generates new 12-word seed phrase
- [P0] ✅ "Seed" tab imports existing seed phrase (12-24 words)
- [P0] ✅ "Backup" tab restores from encrypted .dat backup file (contains seed + all accounts)
- [P0] ✅ Backend MUST reject CREATE_WALLET_FROM_PRIVATE_KEY if no wallet exists
- [P0] ✅ User can only import private keys AFTER HD wallet exists

**Edge Cases:**

- [P1] If user has no wallet, direct navigation to import key URL should redirect to main setup
- [P2] Developer mode (.env.local) can override for testing purposes
- [P0] Backup file validation (magic bytes, version check, size limit)
- [P0] Backup password validation with rate limiting
- [P1] Corrupted backup file handling with clear error messages
- [P2] Backup from newer version (incompatible) warning

**Success Metric:** 100% of new wallets have an HD seed phrase

---

### Story 2: Import Account as Secondary Action

**As a** user with an existing HD wallet
**I want to** import accounts from private keys or other seeds
**So that** I can consolidate multiple wallets into one interface

**Acceptance Criteria:**

- [P0] ✅ "Import Account" button available in Settings screen
- [P0] ✅ "Import Account" button available in Sidebar account dropdown
- [P0] ✅ Import modal supports WIF private key import
- [P0] ✅ Import modal supports seed phrase import (different from main wallet seed)
- [P0] ✅ Backend validates that wallet exists before allowing import
- [P0] ✅ Imported accounts are marked with `importType: 'private-key'` or `'seed'`
- [P1] ✅ Success message clearly states "Account imported" (not "Wallet created")

**Edge Cases:**

- [P0] Cannot import duplicate private keys (same WIF)
- [P1] Cannot import private key that matches any HD-derived account
- [P2] Limit on number of imported accounts (e.g., 20 max)

**Success Metric:** <5% of support tickets about account import confusion

---

### Story 3: Account Segregation in UI

**As a** user with mixed account types
**I want to** see HD and imported accounts grouped separately
**So that** I understand which accounts share a backup and which need separate backups

**Acceptance Criteria:**

**Sidebar Account Switcher:**

- [P0] ✅ Accounts grouped into 3 sections: "HD Accounts", "Imported Accounts", "Multisig Accounts"
- [P0] ✅ Each section has a header label
- [P0] ✅ HD accounts show address type (e.g., "Native SegWit")
- [P0] ✅ Imported accounts show `[Key]` or `[Seed]` badge
- [P0] ✅ Sections separated by dividers
- [P1] ✅ Empty sections are hidden (if no imported accounts, don't show "Imported Accounts" section)
- [P2] Collapse/expand sections for better organization (optional)

**Settings Screen:**

- [P0] ✅ Accounts grouped into 3 sections with headers
- [P0] ✅ Import badges visible for each imported account
- [P0] ✅ Export Xpub button ONLY shows for HD accounts
- [P0] ✅ Export Key button shows for all single-sig accounts
- [P1] ✅ Dividers between sections for visual clarity

**Visual Design:**

- [P0] Section headers: 12px uppercase gray text, 8px bottom margin
- [P0] Dividers: 1px solid gray-700, 12px top/bottom margin
- [P0] Import badges: Small chip-style badges (e.g., `[Key]` `[Seed]`)

**Success Metric:** 90%+ of users correctly identify which accounts need separate backups

---

### Story 4: Export Button Visibility Rules

**As a** user managing multiple account types
**I want to** see only relevant export options for each account
**So that** I don't get confused or make mistakes

**Acceptance Criteria:**

- [P0] ✅ Export Xpub button: ONLY visible for HD-derived single-sig accounts
- [P0] ✅ Export Xpub button: HIDDEN for imported accounts (`importType === 'private-key'`)
- [P0] ✅ Export Xpub button: HIDDEN for multisig accounts
- [P0] ✅ Export Private Key button: Visible for ALL single-sig accounts
- [P0] ✅ Export Private Key button: HIDDEN for multisig accounts
- [P1] ✅ Tooltip on disabled/hidden buttons explains why they're not available

**Implementation Notes:**

```typescript
// Settings Screen Button Visibility Logic (CORRECT)

// Export Xpub: HD single-sig only
const showExportXpub =
  account.accountType === 'single' &&
  (account.importType === 'hd' || account.importType === undefined);

// Export Key: All single-sig
const showExportKey =
  account.accountType === 'single';

// Multisig accounts: No individual key export
```

**Edge Cases:**

- [P0] Accounts without `importType` field (legacy) default to `'hd'`
- [P1] Tooltip on hover: "Imported accounts don't have extended public keys"

**Success Metric:** Zero reports of "Export Xpub" button appearing on imported accounts

---

### Story 1.5: Restore Wallet from Encrypted Backup [NEW - Backup Restoration]

**As a** user with an existing wallet backup
**I want to** restore my entire wallet from an encrypted .dat backup file during initial setup
**So that** I can migrate to a new device or recover from data loss

**Acceptance Criteria:**

**File Selection:**
- [P0] ✅ "Backup" tab shows file upload area (drag-and-drop + file picker)
- [P0] ✅ Only .dat files are accepted (file type validation)
- [P0] ✅ File size limit: 10MB max (prevents abuse)
- [P0] ✅ File validation before password prompt (magic bytes check)
- [P1] ✅ Visual feedback during file upload (loading state)

**Password Validation:**
- [P0] ✅ Password input field with show/hide toggle
- [P0] ✅ Rate limiting: Max 5 attempts per 15 minutes
- [P0] ✅ Clear error message on wrong password (don't leak backup structure)
- [P0] ✅ Lockout message if rate limit exceeded
- [P1] ✅ Password strength indicator (info only, not enforced)

**Backup Decryption & Import:**
- [P0] ✅ Backend validates backup file format and version
- [P0] ✅ Backend decrypts wallet data with provided password
- [P0] ✅ Backend imports: encryptedSeed, accounts, contacts, settings, multisig
- [P0] ✅ All imported accounts retain importType field (hd, private-key, seed)
- [P0] ✅ Success message shows: "X accounts, Y contacts restored"
- [P1] ✅ Preview of restored data before final confirmation

**Error Handling:**
- [P0] ✅ Corrupted file: "Backup file is corrupted or invalid"
- [P0] ✅ Wrong password: "Incorrect password. X attempts remaining"
- [P0] ✅ Version mismatch: "Backup from newer version (vX.X). Please update extension."
- [P0] ✅ Network errors: "Failed to read backup file. Please try again."
- [P1] ✅ Partial import failures: "Some data could not be restored. See details..."

**Edge Cases:**

- [P0] Backup contains non-HD wallet data (no encryptedSeed)
  - **Behavior:** Show warning: "This backup doesn't contain a seed phrase. We recommend creating a new HD wallet instead."
  - **Option:** Allow import anyway OR force HD wallet creation
- [P0] Backup contains 50+ accounts
  - **Behavior:** Import all, but show warning about performance
- [P1] Backup contains duplicate account names
  - **Behavior:** Auto-rename with suffix (e.g., "Account 1 (2)")
- [P2] Backup from much older version (v1 format)
  - **Behavior:** Show upgrade instructions or auto-migrate if possible

**Success Metrics:**
- 100% of valid backups successfully restored
- <1% of users report backup restoration failures
- Zero password leaks or security incidents

---

## 3. User Journeys

### Journey 1: New User - First Time Setup (Happy Path)

**Scenario:** User installs extension, creates HD wallet for the first time

```
Step 1: Install extension
  ↓
Step 2: Open popup → WalletSetup screen
  ↓
Step 3: See 3 tabs:
  - "Create" (selected by default)
  - "Seed"
  - "Backup"
  ↓
Step 4: User clicks "Create" → Generates seed phrase
  ↓
Step 5: User backs up 12-word seed phrase
  ↓
Step 6: User confirms backup checkbox
  ↓
Step 7: ✅ Wallet created with Account 1 (HD-derived)
  ↓
Step 8: User can now:
  - Create more HD accounts (Settings → Create Account)
  - Import accounts (Settings → Import Account)
```

**Result:** User has HD wallet with seed phrase backup

---

### Journey 2: Existing User - Import Private Key Account

**Scenario:** User with HD wallet wants to import a private key from old wallet

```
Step 1: User has existing HD wallet (e.g., 2 accounts)
  ↓
Step 2: Navigate to Settings screen
  ↓
Step 3: Click "Import Account" button (top-right)
  ↓
Step 4: Import Account Modal opens
  ↓
Step 5: User pastes WIF private key
  ↓
Step 6: User selects address type (Legacy/SegWit/Native SegWit)
  ↓
Step 7: User enters account name (e.g., "Old Wallet")
  ↓
Step 8: User clicks "Import Account"
  ↓
Step 9: ✅ Account imported successfully
  ↓
Step 10: User sees updated account list:

Settings Screen:
┌──────────────────────────────────────┐
│ HD Accounts                          │
│ ─────────────────────────────────────│
│ Account 1 (Native SegWit)            │
│ Trading (Legacy)                     │
│                                      │
│ Imported Accounts                    │
│ ─────────────────────────────────────│
│ Old Wallet [Key]                     │
└──────────────────────────────────────┘

Step 11: User notes:
  - "Old Wallet" shows [Key] badge
  - "Old Wallet" has NO "Export Xpub" button
  - "Old Wallet" has "Export Key" button ✅
```

**Result:** User successfully imports account and understands it needs separate backup

---

### Journey 2.5: New User - Restore from Encrypted Backup [NEW - Backup Restoration]

**Scenario:** User reinstalls extension on new device, restores from previous backup

```
Step 1: Install extension on new device
  ↓
Step 2: Open popup → WalletSetup screen
  ↓
Step 3: See 3 tabs:
  - "Create"
  - "Seed"
  - "Backup" ← User clicks this
  ↓
Step 4: Backup tab shows:
  - File upload area with drag-and-drop zone
  - "Choose .dat backup file" button
  - Info text: "Restore your entire wallet from an encrypted backup"
  ↓
Step 5: User drags bitcoin_wallet_backup_20251027.dat file
  ↓
Step 6: File validates successfully (magic bytes, size check)
  ↓
Step 7: Password input appears with:
  - "Enter Backup Password" field
  - Show/hide password toggle
  - "Restore Wallet" button
  ↓
Step 8: User enters backup password
  ↓
Step 9: User clicks "Restore Wallet"
  ↓
Step 10: Backend processes:
  - Validates file format and version
  - Decrypts backup with 600K PBKDF2
  - Imports encryptedSeed, accounts, contacts, settings, multisig
  ↓
Step 11: ✅ Success message appears:
  "Wallet restored successfully!
   - 5 accounts restored
   - 3 contacts restored
   - 1 multisig wallet restored"
  ↓
Step 12: User sees Dashboard with all accounts:

Sidebar Account Switcher:
┌──────────────────────────────────────┐
│ HD Accounts (3)                      │
│ ─────────────────────────────────────│
│ ₿ Account 1 (Native SegWit)         │
│ ₿ Trading (Legacy)                   │
│ ₿ Savings (Native SegWit)            │
│                                      │
│ Imported Accounts (1)                │
│ ─────────────────────────────────────│
│ ₿ Old Wallet [Key]                   │
│                                      │
│ Multisig Accounts (1)                │
│ ─────────────────────────────────────│
│ 🔐 Joint Account (2-of-3)            │
└──────────────────────────────────────┘

Step 13: User verifies:
  - All accounts restored with correct names
  - Contacts visible in Contacts screen
  - Settings preferences retained
  - Transaction history loads from blockchain
```

**Result:** User successfully migrates entire wallet to new device with one backup file

**Error Path - Wrong Password:**

```
Step 8: User enters WRONG password
  ↓
Step 9: User clicks "Restore Wallet"
  ↓
Step 10: ❌ Error message: "Incorrect password. 4 attempts remaining"
  ↓
Step 11: User tries 4 more times with wrong password
  ↓
Step 12: ❌ Lockout message:
  "Too many failed attempts. Please wait 15 minutes before trying again."
  ↓
Step 13: User waits or contacts support
```

**Error Path - Corrupted File:**

```
Step 5: User uploads corrupted .dat file
  ↓
Step 6: ❌ Error message:
  "Backup file is corrupted or invalid. Please check the file and try again."
  ↓
Step 7: User re-downloads backup from secure storage
  ↓
Step 8: Retry with valid file
```

**Error Path - Version Mismatch:**

```
Step 10: Backend detects backup version > current extension version
  ↓
Step 11: ❌ Error message:
  "This backup was created with a newer version of the wallet (v0.14.0).
   Please update the extension to v0.14.0 or later to restore this backup."
  ↓
Step 12: User updates extension from Chrome Web Store
  ↓
Step 13: Retry restore with updated extension
```

---

### Journey 3: User Tries to Import Key on First Run (Error Path)

**Scenario:** User tries to create non-HD wallet (should be blocked)

```
Step 1: User installs extension
  ↓
Step 2: Open popup → WalletSetup screen
  ↓
Step 3: User looks for "Import Private Key" tab
  ↓
Step 4: ❌ Tab is NOT visible (only Create/Seed/Backup)
  ↓
Step 5: User clicks "Seed" tab (thinking it's for private keys)
  ↓
Step 6: User sees seed phrase input (12-24 words)
  ↓
Step 7: User realizes this is for seed phrases, not private keys
  ↓
Step 8: User contacts support: "Where do I import my private key?"
  ↓
Step 9: Support response: "Create HD wallet first, then use Settings → Import Account"
```

**Result:** User understands HD wallet requirement, creates proper backup

---

### Journey 4: User Reviews Account Types in Settings

**Scenario:** User with mixed accounts wants to understand backup requirements

```
Step 1: User opens Settings screen
  ↓
Step 2: User sees account list grouped by type:

┌──────────────────────────────────────┐
│ HD Accounts (3)                      │
│ ─────────────────────────────────────│
│ ₿ Account 1 [Export Xpub] [Export Key] [Rename] [Delete] │
│ ₿ Trading   [Export Xpub] [Export Key] [Rename] [Delete] │
│ ₿ Savings   [Export Xpub] [Export Key] [Rename] [Delete] │
│                                      │
│ Imported Accounts (2)                │
│ ─────────────────────────────────────│
│ ₿ Hello [Key]      [Export Key] [Rename] [Delete] │
│ ₿ Old Wallet [Key] [Export Key] [Rename] [Delete] │
└──────────────────────────────────────┘

Step 3: User hovers over [Key] badge
  ↓
Step 4: Tooltip: "Imported from private key. Export key for backup."
  ↓
Step 5: User hovers over missing "Export Xpub" on "Hello" account
  ↓
Step 6: Tooltip: "Imported accounts don't have extended public keys"
  ↓
Step 7: User understands:
  - HD accounts share one seed phrase backup
  - Imported accounts need individual key exports
```

**Result:** User correctly identifies backup requirements for all accounts

---

## 4. Edge Cases & Migration

### 4.1 Edge Case: User with Existing Non-HD Wallet

**Scenario:** User created wallet via "Key" tab BEFORE this update

**Current State:**
```json
{
  "version": 2,
  "encryptedSeed": "",  // Empty for non-HD wallets
  "accounts": [
    {
      "index": 0,
      "name": "Account 1",
      "importType": "private-key",
      "accountType": "single"
    }
  ]
}
```

**Questions:**

1. **Should we force migration to HD wallet?**
   **Answer:** ❌ NO - Too disruptive. Existing non-HD wallets are allowed.

2. **Should we show seed phrase creation prompt?**
   **Answer:** ✅ YES - Show one-time banner: "Upgrade to HD wallet for better security"

3. **Should we block new account creation?**
   **Answer:** ❌ NO - Allow importing more private keys, but encourage HD upgrade

**Migration Strategy:**

**Detection Logic:**
```typescript
// Check if wallet is non-HD (no seed phrase)
const isNonHDWallet = wallet.version === 2 && wallet.encryptedSeed === '';

// Check if all accounts are imported
const allAccountsImported = wallet.accounts.every(
  acc => acc.importType === 'private-key'
);

// Show upgrade banner if both conditions true
if (isNonHDWallet && allAccountsImported) {
  showHDUpgradeBanner();
}
```

**Upgrade Banner (Settings Screen):**
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Your wallet doesn't have a seed phrase backup   │
│                                                     │
│ For better security, we recommend creating an HD   │
│ wallet with a seed phrase. This allows you to      │
│ backup all accounts with 12 words.                 │
│                                                     │
│ [Upgrade to HD Wallet] [Dismiss]                   │
└─────────────────────────────────────────────────────┘
```

**Upgrade Flow:**
```
1. User clicks "Upgrade to HD Wallet"
2. Modal opens: "Create HD Wallet"
3. User generates new 12-word seed phrase
4. User backs up seed phrase
5. New HD Account 1 created (index 0)
6. Existing imported accounts renumbered (index 1, 2, ...)
7. wallet.encryptedSeed updated with seed phrase
8. Success message: "HD wallet created! You now have a seed phrase backup."
```

**Post-Upgrade State:**
```json
{
  "version": 2,
  "encryptedSeed": "base64...",  // Now has seed
  "accounts": [
    {
      "index": 0,
      "name": "Account 1",
      "importType": "hd",  // New HD account
      "accountType": "single"
    },
    {
      "index": 1,
      "name": "Old Account",
      "importType": "private-key",  // Preserved
      "accountType": "single"
    }
  ]
}
```

---

### 4.2 Edge Case: Multiple Imported Accounts Limit

**Question:** Should there be a limit on imported accounts?

**Answer:** ✅ YES - Limit to 20 imported accounts total

**Rationale:**
- Each imported account requires separate backup
- Too many imported accounts = poor UX (user forgets which keys to backup)
- 20 accounts is reasonable for power users

**Implementation:**
```typescript
// Settings Screen - Import Account button
const importedAccounts = accounts.filter(
  acc => acc.importType === 'private-key' || acc.importType === 'seed'
);

const canImportMore = importedAccounts.length < 20;

<button
  onClick={() => setShowImportModal(true)}
  disabled={!canImportMore}
  title={!canImportMore ? 'Maximum 20 imported accounts reached' : 'Import account from private key or seed'}
>
  + Import Account
</button>
```

**Error Message (if limit reached):**
```
┌─────────────────────────────────────────────────────┐
│ ⚠️ Import Limit Reached                            │
│                                                     │
│ You've reached the maximum of 20 imported accounts.│
│ For better organization, consider using HD wallet  │
│ accounts instead (unlimited).                      │
│                                                     │
│ [OK]                                                │
└─────────────────────────────────────────────────────┘
```

---

### 4.3 Edge Case: Multisig Accounts in Grouping

**Question:** Where do multisig accounts appear?

**Answer:** Separate "Multisig Accounts" section (3rd group)

**Account Groups (Final):**

```
1. HD Accounts (single-sig, importType: 'hd' or undefined)
2. Imported Accounts (single-sig, importType: 'private-key' or 'seed')
3. Multisig Accounts (accountType: 'multisig')
```

**Example:**
```
┌──────────────────────────────────────┐
│ HD Accounts (3)                      │
│ ─────────────────────────────────────│
│ ₿ Account 1                          │
│ ₿ Trading                            │
│ ₿ Savings                            │
│                                      │
│ Imported Accounts (2)                │
│ ─────────────────────────────────────│
│ ₿ Hello [Key]                        │
│ ₿ Old Wallet [Seed]                  │
│                                      │
│ Multisig Accounts (1)                │
│ ─────────────────────────────────────│
│ 🔐 Joint Account (2-of-3)            │
└──────────────────────────────────────┘
```

---

### 4.4 Edge Case: Backup Restoration Edge Cases [NEW - Backup Restoration]

**Edge Case 4.4.1: Backup File Size Limit**

**Question:** What if user tries to upload very large backup file?

**Answer:** Enforce 10MB size limit with clear error message

**Implementation:**
```typescript
// File upload validation
const MAX_BACKUP_SIZE = 10 * 1024 * 1024; // 10MB

if (file.size > MAX_BACKUP_SIZE) {
  return {
    success: false,
    error: 'Backup file is too large. Maximum size: 10MB',
    code: 'FILE_TOO_LARGE'
  };
}
```

**Error Message:**
```
❌ Backup file is too large
Maximum file size: 10MB
Your file: 15.3MB

Please contact support if you have a legitimate backup larger than 10MB.
```

---

**Edge Case 4.4.2: Corrupted Backup File**

**Question:** What if backup file is corrupted or modified?

**Answer:** Validate magic bytes and structure before password prompt

**Detection Logic:**
```typescript
// Validate backup file structure
const BACKUP_MAGIC_BYTES = 'BTWL'; // Bitcoin Wallet Backup

function validateBackupFile(fileData: ArrayBuffer): boolean {
  const header = new Uint8Array(fileData.slice(0, 4));
  const magic = String.fromCharCode(...header);

  if (magic !== BACKUP_MAGIC_BYTES) {
    throw new Error('INVALID_BACKUP_FORMAT');
  }

  // Check version field
  const version = new Uint8Array(fileData.slice(4, 8));
  // ... additional validation
}
```

**Error Messages:**
- Invalid format: "This doesn't appear to be a valid wallet backup file"
- Corrupted data: "Backup file is corrupted or incomplete"
- Truncated file: "Backup file appears to be incomplete. Please check the file."

---

**Edge Case 4.4.3: Wrong Backup Password with Rate Limiting**

**Question:** How do we prevent brute-force password attacks?

**Answer:** Rate limit to 5 attempts per 15 minutes

**Implementation:**
```typescript
interface RateLimitState {
  attempts: number;
  firstAttempt: number; // timestamp
  lockedUntil?: number; // timestamp
}

const RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

function checkRateLimit(state: RateLimitState): boolean {
  const now = Date.now();

  // Check if locked
  if (state.lockedUntil && now < state.lockedUntil) {
    const minutesLeft = Math.ceil((state.lockedUntil - now) / 60000);
    throw new Error(`Too many failed attempts. Wait ${minutesLeft} minutes.`);
  }

  // Reset window if expired
  if (now - state.firstAttempt > RATE_LIMIT.windowMs) {
    state.attempts = 0;
    state.firstAttempt = now;
  }

  // Check attempt count
  if (state.attempts >= RATE_LIMIT.maxAttempts) {
    state.lockedUntil = now + RATE_LIMIT.windowMs;
    throw new Error('Too many failed attempts. Wait 15 minutes.');
  }

  return true;
}
```

**Error Messages:**
- Wrong password: "Incorrect password. 4 attempts remaining"
- Locked out: "Too many failed attempts. Please wait 15 minutes before trying again."

---

**Edge Case 4.4.4: Backup from Newer Version**

**Question:** What if backup was created with newer wallet version?

**Answer:** Check version compatibility and show upgrade message

**Version Check Logic:**
```typescript
interface BackupHeader {
  magic: string;        // 'BTWL'
  version: number;      // e.g., 12 for v0.12.0
  minVersion: number;   // Minimum version required to restore
}

function checkVersionCompatibility(backup: BackupHeader): void {
  const CURRENT_VERSION = 11; // v0.11.0

  if (backup.version > CURRENT_VERSION) {
    throw new Error(
      `This backup requires wallet version ${backup.minVersion/10}.${backup.minVersion%10}.0 or later. ` +
      `You are currently using v${CURRENT_VERSION/10}.${CURRENT_VERSION%10}.0. ` +
      `Please update the extension.`
    );
  }
}
```

**Error Message:**
```
❌ Wallet Update Required

This backup was created with a newer version of the wallet (v0.14.0).
You are currently using v0.11.0.

Please update the extension to v0.14.0 or later to restore this backup.

[Update Extension]  [Cancel]
```

---

**Edge Case 4.4.5: Backup Contains Non-HD Wallet**

**Question:** What if restored backup contains a non-HD wallet (no seed)?

**Answer:** Show warning and offer to upgrade during restore

**Detection:**
```typescript
interface WalletBackup {
  wallet: {
    version: number;
    encryptedSeed: string; // Empty if non-HD
    accounts: Account[];
    // ...
  };
}

function checkHDWallet(backup: WalletBackup): void {
  if (!backup.wallet.encryptedSeed || backup.wallet.encryptedSeed === '') {
    // Non-HD wallet detected
    showNonHDWarning();
  }
}
```

**Warning Dialog:**
```
⚠️ Non-HD Wallet Detected

This backup doesn't contain a seed phrase. This means:
- No 12-word recovery phrase
- Each account needs separate backup
- Less secure than HD wallets

We recommend creating a new HD wallet and transferring funds.

[Import Anyway]  [Create HD Wallet Instead]
```

**Behavior if "Import Anyway" clicked:**
- Restore all accounts as imported accounts
- Show upgrade banner in Settings (same as 4.1)
- Allow user to upgrade later

---

**Edge Case 4.4.6: Backup Contains 50+ Accounts**

**Question:** What if backup contains many accounts (performance concern)?

**Answer:** Allow import but show warning about performance

**Detection:**
```typescript
const accountCount = backup.wallet.accounts.length;

if (accountCount > 50) {
  showPerformanceWarning(accountCount);
}
```

**Warning Dialog:**
```
⚠️ Large Wallet Detected

This backup contains 73 accounts, which may affect performance.

We recommend:
- Archiving unused accounts
- Keeping active accounts under 20

[Continue Anyway]  [Cancel]
```

---

**Edge Case 4.4.7: Duplicate Account Names in Backup**

**Question:** What if backup contains accounts with duplicate names?

**Answer:** Auto-rename with numeric suffix

**Implementation:**
```typescript
function deduplicateAccountNames(accounts: Account[]): Account[] {
  const nameCount = new Map<string, number>();

  return accounts.map(account => {
    let name = account.name;
    const count = nameCount.get(name) || 0;

    if (count > 0) {
      name = `${account.name} (${count + 1})`;
    }

    nameCount.set(account.name, count + 1);

    return { ...account, name };
  });
}
```

**Example:**
```
Original backup:
- Account 1
- Trading
- Account 1  ← Duplicate
- Trading    ← Duplicate

After import:
- Account 1
- Trading
- Account 1 (2)
- Trading (2)
```

**Notification:**
```
ℹ️ Some accounts were renamed to avoid duplicates:
- "Account 1" → "Account 1 (2)"
- "Trading" → "Trading (2)"
```

---

### 4.5 Edge Case: Imported Seed Phrase Accounts

**Question:** Where do accounts imported from a different seed phrase appear?

**Answer:** "Imported Accounts" section with `[Seed]` badge

**Rationale:**
- They're not derived from the main wallet seed
- They require separate backup (the imported seed phrase)
- They're functionally similar to imported private keys (different backup requirement)

**Example:**
```
Imported Accounts
─────────────────
₿ Old Wallet [Seed]  ← Imported from different 12-word phrase
₿ Hardware Wallet [Key]  ← Imported from WIF private key
```

**Badge Logic:**
```typescript
// ImportBadge component
interface ImportBadgeProps {
  type: 'private-key' | 'seed';
  size?: 'sm' | 'md';
}

const ImportBadge: React.FC<ImportBadgeProps> = ({ type, size = 'md' }) => {
  const label = type === 'private-key' ? 'Key' : 'Seed';
  const bgColor = type === 'private-key' ? 'bg-amber-500/15' : 'bg-purple-500/15';
  const textColor = type === 'private-key' ? 'text-amber-300' : 'text-purple-300';
  const borderColor = type === 'private-key' ? 'border-amber-500/30' : 'border-purple-500/30';

  return (
    <span className={`px-2 py-0.5 text-xs font-semibold ${bgColor} ${textColor} border ${borderColor} rounded`}>
      [{label}]
    </span>
  );
};
```

---

## 5. UI/UX Specifications

### 5.1 WalletSetup Component Changes

**Current Tabs (4):**
```tsx
<div className="flex border-b border-gray-800 mb-6">
  <button>Create</button>
  <button>Seed</button>
  <button>Key</button>      ← REMOVE THIS
  <button>Backup</button>
</div>
```

**New Tabs (3):**
```tsx
<div className="flex border-b border-gray-800 mb-6">
  <button>Create</button>   ← Generate new seed
  <button>Seed</button>     ← Import existing seed
  <button>Backup</button>   ← Restore from .dat file
</div>
```

**Component Changes:**
```typescript
// Remove import
- import ImportPrivateKey from './WalletSetup/ImportPrivateKey';

// Remove tab state
- type SetupTab = 'create' | 'import' | 'import-key' | 'import-backup';
+ type SetupTab = 'create' | 'import' | 'import-backup';

// Remove tab button
- <button onClick={() => setActiveTab('import-key')}>Key</button>

// Remove tab content
- {activeTab === 'import-key' && (
-   <ImportPrivateKey onSetupComplete={onSetupComplete} />
- )}
```

---

### 5.1.5 Backup Tab UI Specification [NEW - Backup Restoration]

**Backup Tab Layout:**

```tsx
{activeTab === 'import-backup' && (
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Restore from Backup
      </h2>
      <p className="text-sm text-gray-400">
        Import your entire wallet from an encrypted backup file (.dat)
      </p>
    </div>

    {/* File Upload Area */}
    {!selectedFile && (
      <div
        className={`
          border-2 border-dashed rounded-lg p-8
          ${isDragging ? 'border-bitcoin bg-bitcoin/10' : 'border-gray-700 bg-gray-800/50'}
          transition-colors cursor-pointer
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-center space-y-4">
          {/* Upload Icon */}
          <div className="w-16 h-16 mx-auto rounded-full bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" /* upload icon SVG */>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-white font-semibold mb-1">
              Drag and drop backup file
            </p>
            <p className="text-sm text-gray-400">
              or click to browse for .dat file
            </p>
          </div>

          {/* File Requirements */}
          <div className="text-xs text-gray-500">
            Maximum file size: 10MB
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".dat"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    )}

    {/* File Selected - Password Input */}
    {selectedFile && !isRestoring && (
      <div className="space-y-4">
        {/* Selected File Info */}
        <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bitcoin/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-bitcoin" /* file icon */>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">
                {selectedFile.name}
              </p>
              <p className="text-xs text-gray-400">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" /* X icon */>
          </button>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Backup Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter the password used to encrypt this backup"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {rateLimitError && (
            <p className="text-xs text-red-400 mt-2">
              {rateLimitError}
            </p>
          )}
        </div>

        {/* Restore Button */}
        <button
          onClick={handleRestore}
          disabled={!password || isRateLimited}
          className="w-full py-3 bg-bitcoin hover:bg-bitcoin-dark text-white font-semibold rounded-lg"
        >
          Restore Wallet
        </button>

        {/* Security Note */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" /* warning icon */>
            <div className="text-xs text-amber-200">
              <p className="font-semibold mb-1">Security Note</p>
              <p>
                You have 5 password attempts per 15 minutes to prevent brute-force attacks.
              </p>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Restoring State */}
    {isRestoring && (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 mx-auto">
          <LoadingSpinner />
        </div>
        <div>
          <p className="text-white font-semibold mb-1">
            Restoring wallet...
          </p>
          <p className="text-sm text-gray-400">
            This may take a few moments
          </p>
        </div>
      </div>
    )}

    {/* Error Message */}
    {error && (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" /* error icon */>
          <div className="text-sm text-red-200">
            <p className="font-semibold mb-1">Restore Failed</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    )}
  </div>
)}
```

**Component States:**

1. **Initial State** (no file selected)
   - Drag-and-drop upload area
   - File picker button
   - Upload instructions

2. **File Selected State** (awaiting password)
   - File info card with name and size
   - Password input with show/hide toggle
   - Restore button
   - Security note about rate limiting

3. **Restoring State** (processing)
   - Loading spinner
   - "Restoring wallet..." message
   - Disabled all inputs

4. **Error State**
   - Red error box with icon
   - Clear error message
   - Option to retry

5. **Success State**
   - Automatic redirect to Dashboard
   - Success toast notification with account count

**Visual Design:**

- **Upload Area**: Dashed border, gray-800 background, hover state with bitcoin color
- **File Info Card**: gray-800 background, bitcoin/20 icon background
- **Password Input**: gray-800 background, border-gray-700, white text
- **Security Note**: amber-500/10 background, amber-500/30 border
- **Error Box**: red-500/10 background, red-500/30 border
- **Spacing**: 6-unit spacing between sections (space-y-6)

---

### 5.2 Sidebar Account Switcher Changes

**Current Structure (Flat):**
```tsx
<div className="max-h-[320px] overflow-y-auto py-2">
  {accounts.map((account, index) => (
    <button key={account.index}>
      {account.name}
    </button>
  ))}
</div>
```

**New Structure (Grouped):**
```tsx
<div className="max-h-[320px] overflow-y-auto py-2">
  {/* HD Accounts */}
  {hdAccounts.length > 0 && (
    <div className="mb-4">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        HD Accounts
      </div>
      {hdAccounts.map((account, index) => (
        <button key={account.index} className="...">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">
                  {account.name}
                </span>
              </div>
              <div className="text-xs text-gray-400 capitalize">
                {account.addressType.replace('-', ' ')}
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )}

  {/* Imported Accounts */}
  {importedAccounts.length > 0 && (
    <div className="mb-4">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Imported Accounts
      </div>
      {importedAccounts.map((account, index) => (
        <button key={account.index} className="...">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm truncate">
                  {account.name}
                </span>
                <ImportBadge type={account.importType} size="sm" />
              </div>
              <div className="text-xs text-gray-400">
                Single address
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )}

  {/* Multisig Accounts */}
  {multisigAccounts.length > 0 && (
    <div className="mb-4">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Multisig Accounts
      </div>
      {multisigAccounts.map((account, index) => (
        <button key={account.index} className="...">
          {/* Same structure as above */}
        </button>
      ))}
    </div>
  )}
</div>
```

**Account Grouping Logic:**
```typescript
// Sidebar.tsx
const hdAccounts = accounts.filter(
  acc => acc.accountType === 'single' && (acc.importType === 'hd' || acc.importType === undefined)
);

const importedAccounts = accounts.filter(
  acc => acc.accountType === 'single' && (acc.importType === 'private-key' || acc.importType === 'seed')
);

const multisigAccounts = accounts.filter(
  acc => acc.accountType === 'multisig'
);
```

---

### 5.3 Settings Screen Changes

**Current Structure (Flat List):**
```tsx
<div className="space-y-3">
  {accounts.map((account) => (
    <div key={account.index} className="...">
      <div>
        <p>{account.name}</p>
        <p>{getAddressTypeLabel(account.addressType)}</p>
      </div>
      <div className="flex space-x-2">
        {account.importType !== 'private-key' && (
          <button>Export Xpub</button>
        )}
        {account.accountType !== 'multisig' && (
          <button>Export Key</button>
        )}
        <button>Rename</button>
        <button>Delete</button>
      </div>
    </div>
  ))}
</div>
```

**New Structure (Grouped):**
```tsx
<div className="space-y-6">
  {/* HD Accounts */}
  {hdAccounts.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        HD Accounts ({hdAccounts.length})
      </h3>
      <div className="space-y-3">
        {hdAccounts.map((account) => (
          <div key={account.index} className="...">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-white">{account.name}</p>
              </div>
              <p className="text-sm text-gray-500">
                {getAddressTypeLabel(account.addressType)}
              </p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openExportXpubModal(account)}>
                Export Xpub
              </button>
              <button onClick={() => openExportModal(account)}>
                Export Key
              </button>
              <button onClick={() => openRenameModal(account)}>
                Rename
              </button>
              <button onClick={() => openDeleteModal(account)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Divider */}
  {hdAccounts.length > 0 && importedAccounts.length > 0 && (
    <div className="border-t border-gray-700"></div>
  )}

  {/* Imported Accounts */}
  {importedAccounts.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Imported Accounts ({importedAccounts.length})
      </h3>
      <div className="space-y-3">
        {importedAccounts.map((account) => (
          <div key={account.index} className="...">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-white">{account.name}</p>
                <ImportBadge type={account.importType} size="sm" />
              </div>
              <p className="text-sm text-gray-500">
                Single address wallet
              </p>
            </div>
            <div className="flex space-x-2">
              {/* NO Export Xpub button */}
              <button onClick={() => openExportModal(account)}>
                Export Key
              </button>
              <button onClick={() => openRenameModal(account)}>
                Rename
              </button>
              <button onClick={() => openDeleteModal(account)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  {/* Multisig Accounts (similar structure) */}
</div>
```

---

## 6. Technical Requirements

### 6.1 Frontend Changes

**Files to Modify:**

1. **WalletSetup.tsx** (Remove "Key" tab)
   - Remove `import-key` from `SetupTab` type
   - Remove tab button UI
   - Remove `<ImportPrivateKey>` component render
   - Remove ImportPrivateKey import

2. **Sidebar.tsx** (Add account grouping)
   - Add account grouping logic (hdAccounts, importedAccounts, multisigAccounts)
   - Add section headers
   - Add dividers between sections
   - Add ImportBadge component for imported accounts

3. **SettingsScreen.tsx** (Add account grouping + fix Export Xpub)
   - Add account grouping logic
   - Add section headers and dividers
   - Fix Export Xpub button visibility logic
   - Add Import Account button (if not already present)

4. **ImportBadge.tsx** (New component)
   - Create reusable badge component
   - Support `'private-key'` and `'seed'` types
   - Support `'sm'` and `'md'` sizes

5. **WalletSetup/ImportBackup.tsx** [NEW - Backup Restoration]
   - File upload component with drag-and-drop
   - File validation (type, size, magic bytes)
   - Password input with show/hide toggle
   - Rate limiting state management
   - Error handling and display
   - Success state with account count
   - Restore progress indicator

**New Component:**

```typescript
// src/tab/components/shared/ImportBadge.tsx
import React from 'react';

interface ImportBadgeProps {
  type: 'private-key' | 'seed';
  size?: 'sm' | 'md';
}

export const ImportBadge: React.FC<ImportBadgeProps> = ({ type, size = 'md' }) => {
  const label = type === 'private-key' ? 'Key' : 'Seed';

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-2.5 py-1 text-sm';

  const colorClasses = type === 'private-key'
    ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    : 'bg-purple-500/15 text-purple-300 border-purple-500/30';

  return (
    <span
      className={`${sizeClasses} ${colorClasses} font-semibold border rounded`}
      title={type === 'private-key' ? 'Imported from private key' : 'Imported from seed phrase'}
    >
      [{label}]
    </span>
  );
};
```

---

### 6.2 Backend Changes

**Files to Modify:**

1. **index.ts** (Message handler validation)
   - Add validation to CREATE_WALLET_FROM_PRIVATE_KEY handler
   - Reject if no wallet exists (force HD wallet first)

2. **BackupManager.ts** [NEW - Backup Restoration]
   - Enhance IMPORT_WALLET_BACKUP handler for initial setup
   - Add file size validation (10MB max)
   - Add magic bytes validation
   - Add version compatibility check
   - Add rate limiting for password attempts
   - Add non-HD wallet detection and warning
   - Add duplicate account name handling
   - Return detailed restoration summary (account count, contacts, etc.)

3. **types/index.ts** [NEW - Backup Restoration]
   - Add backup restoration error codes
   - Add rate limit state interface
   - Add backup header interface
   - Add restoration result interface

**Validation Logic:**

```typescript
// src/background/index.ts

// CREATE_WALLET_FROM_PRIVATE_KEY handler (add validation)
case MessageType.CREATE_WALLET_FROM_PRIVATE_KEY: {
  try {
    const { wif, addressType, password, accountName } = payload;

    // CRITICAL: Check if wallet already exists
    const walletExists = await WalletStorage.hasWallet();

    if (!walletExists) {
      // REJECT: No wallet exists - must create HD wallet first
      return {
        success: false,
        error: 'You must create an HD wallet before importing private keys. Click "Create" or "Seed" to get started.',
        code: 'HD_WALLET_REQUIRED'
      };
    }

    // Wallet exists - proceed with import as secondary account
    // ... existing import logic ...

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import private key'
    };
  }
}
```

**Error Code:**

```typescript
// src/shared/types/index.ts

export enum PrivateKeyErrorCode {
  // ... existing codes ...
  HD_WALLET_REQUIRED = 'HD_WALLET_REQUIRED',  // NEW
}
```

---

### 6.3 Type Safety Improvements

**Ensure `importType` is always set:**

```typescript
// All account creation paths must set importType

// CREATE_WALLET handler
firstAccount.importType = 'hd';  // ✅ Already done

// IMPORT_WALLET handler
firstAccount.importType = 'hd';  // ✅ Already done

// CREATE_ACCOUNT handler
newAccount.importType = 'hd';  // ✅ Already done

// IMPORT_ACCOUNT_PRIVATE_KEY handler
newAccount.importType = 'private-key';  // ✅ Already done

// IMPORT_ACCOUNT_SEED handler
newAccount.importType = 'seed';  // ✅ Already done
```

---

## 7. Success Metrics [UPDATED - Backup Restoration]

### Primary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **New wallets with HD seed** | 100% | Count wallets with encryptedSeed !== '' |
| **Export Xpub button accuracy** | 100% | Zero reports of button on imported accounts |
| **User confusion reduction** | 50% | Support tickets about account types |
| **Backup comprehension** | 90% | User survey: "Do you know which accounts need separate backups?" |
| **Backup restoration success rate** [NEW] | 98% | Successful restorations / Total attempts |
| **Backup restoration security** [NEW] | 100% | Zero password leaks or brute-force incidents |

### Secondary Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **HD wallet upgrade adoption** | 30% | Users with non-HD wallets who upgrade |
| **Imported account usage** | <20% | Percentage of users with imported accounts |
| **Account segregation clarity** | 95% | User survey: "Can you identify HD vs imported accounts?" |
| **Backup restoration usage** [NEW] | 15% | Percentage of new wallets restored from backup |
| **Backup file error rate** [NEW] | <2% | Corrupted/invalid files / Total uploads |
| **Rate limit effectiveness** [NEW] | 100% | Zero brute-force attacks succeed |

---

## 8. Testing Plan

### 8.1 Unit Tests

**Frontend Tests:**

```typescript
// WalletSetup.test.tsx
describe('WalletSetup - HD Enforcement', () => {
  it('should NOT show "Key" tab during initial setup', () => {
    render(<WalletSetup onSetupComplete={jest.fn()} />);
    expect(screen.queryByText('Key')).not.toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Seed')).toBeInTheDocument();
    expect(screen.getByText('Backup')).toBeInTheDocument();
  });

  it('should only show 3 tabs (Create, Seed, Backup)', () => {
    render(<WalletSetup onSetupComplete={jest.fn()} />);
    const tabs = screen.getAllByRole('button', { name: /create|seed|backup/i });
    expect(tabs).toHaveLength(3);
  });
});

// Sidebar.test.tsx
describe('Sidebar - Account Grouping', () => {
  it('should group HD accounts separately from imported accounts', () => {
    const accounts = [
      { index: 0, name: 'Account 1', importType: 'hd', accountType: 'single' },
      { index: 1, name: 'Hello', importType: 'private-key', accountType: 'single' },
    ];
    render(<Sidebar accounts={accounts} currentAccountIndex={0} {...otherProps} />);

    expect(screen.getByText('HD Accounts')).toBeInTheDocument();
    expect(screen.getByText('Imported Accounts')).toBeInTheDocument();
  });

  it('should show import badge for imported accounts', () => {
    const accounts = [
      { index: 0, name: 'Hello', importType: 'private-key', accountType: 'single' },
    ];
    render(<Sidebar accounts={accounts} currentAccountIndex={0} {...otherProps} />);

    expect(screen.getByText('[Key]')).toBeInTheDocument();
  });

  it('should hide empty sections', () => {
    const accounts = [
      { index: 0, name: 'Account 1', importType: 'hd', accountType: 'single' },
    ];
    render(<Sidebar accounts={accounts} currentAccountIndex={0} {...otherProps} />);

    expect(screen.getByText('HD Accounts')).toBeInTheDocument();
    expect(screen.queryByText('Imported Accounts')).not.toBeInTheDocument();
  });
});

// SettingsScreen.test.tsx
describe('SettingsScreen - Export Button Visibility', () => {
  it('should show Export Xpub for HD accounts only', () => {
    const hdAccount = {
      index: 0,
      name: 'Account 1',
      importType: 'hd',
      accountType: 'single'
    };
    const importedAccount = {
      index: 1,
      name: 'Hello',
      importType: 'private-key',
      accountType: 'single'
    };

    render(<SettingsScreen accounts={[hdAccount, importedAccount]} {...otherProps} />);

    const exportXpubButtons = screen.getAllByText('Export Xpub');
    expect(exportXpubButtons).toHaveLength(1); // Only for HD account
  });

  it('should show Export Key for all single-sig accounts', () => {
    const hdAccount = {
      index: 0,
      name: 'Account 1',
      importType: 'hd',
      accountType: 'single'
    };
    const importedAccount = {
      index: 1,
      name: 'Hello',
      importType: 'private-key',
      accountType: 'single'
    };

    render(<SettingsScreen accounts={[hdAccount, importedAccount]} {...otherProps} />);

    const exportKeyButtons = screen.getAllByText('Export Key');
    expect(exportKeyButtons).toHaveLength(2); // For both accounts
  });

  it('should NOT show export buttons for multisig accounts', () => {
    const multisigAccount = {
      index: 0,
      name: 'Joint',
      accountType: 'multisig'
    };

    render(<SettingsScreen accounts={[multisigAccount]} {...otherProps} />);

    expect(screen.queryByText('Export Xpub')).not.toBeInTheDocument();
    expect(screen.queryByText('Export Key')).not.toBeInTheDocument();
  });
});
```

**Backend Tests:**

```typescript
// messageHandlers.test.ts
describe('CREATE_WALLET_FROM_PRIVATE_KEY - HD Enforcement', () => {
  it('should reject if no wallet exists', async () => {
    // Ensure no wallet exists
    await WalletStorage.deleteWallet();

    const message = {
      type: MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
      payload: {
        wif: 'cT1Y2Y...',
        addressType: 'native-segwit',
        password: 'Test1234',
        accountName: 'Test'
      }
    };

    const response = await handleMessage(message);

    expect(response.success).toBe(false);
    expect(response.error).toContain('HD wallet');
    expect(response.code).toBe('HD_WALLET_REQUIRED');
  });

  it('should succeed if wallet exists (import as secondary account)', async () => {
    // Create HD wallet first
    await createTestWallet();

    const message = {
      type: MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
      payload: {
        wif: 'cT1Y2Y...',
        addressType: 'native-segwit',
        password: 'Test1234',
        accountName: 'Imported'
      }
    };

    const response = await handleMessage(message);

    expect(response.success).toBe(true);
    expect(response.data.account.importType).toBe('private-key');
  });
});
```

---

### 8.2 Integration Tests

**Scenario 1: New User Flow**

```typescript
describe('Integration: New User HD Wallet Creation', () => {
  it('should enforce HD wallet creation on first run', async () => {
    // 1. Open extension (no wallet)
    const hasWallet = await WalletStorage.hasWallet();
    expect(hasWallet).toBe(false);

    // 2. Try to import private key (should fail)
    const importResponse = await chrome.runtime.sendMessage({
      type: MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
      payload: { wif: 'cT1Y2Y...', addressType: 'native-segwit', password: 'Test1234' }
    });
    expect(importResponse.success).toBe(false);
    expect(importResponse.code).toBe('HD_WALLET_REQUIRED');

    // 3. Create HD wallet instead
    const createResponse = await chrome.runtime.sendMessage({
      type: MessageType.CREATE_WALLET,
      payload: { password: 'Test1234', addressType: 'native-segwit' }
    });
    expect(createResponse.success).toBe(true);
    expect(createResponse.mnemonic).toBeDefined();

    // 4. Verify wallet has seed phrase
    const wallet = await WalletStorage.getWallet();
    expect(wallet.encryptedSeed).not.toBe('');
  });
});
```

**Scenario 2: Imported Account Segregation**

```typescript
describe('Integration: Account Segregation in UI', () => {
  it('should display HD and imported accounts in separate sections', async () => {
    // 1. Create HD wallet with 2 accounts
    await createTestWallet();
    await createTestAccount('Trading');

    // 2. Import private key account
    await importPrivateKey('Hello');

    // 3. Render Sidebar
    render(<Sidebar accounts={mockAccounts} {...otherProps} />);

    // 4. Verify grouping
    expect(screen.getByText('HD Accounts')).toBeInTheDocument();
    expect(screen.getByText('Imported Accounts')).toBeInTheDocument();

    // 5. Verify account placement
    const hdSection = screen.getByText('HD Accounts').closest('div');
    expect(within(hdSection).getByText('Account 1')).toBeInTheDocument();
    expect(within(hdSection).getByText('Trading')).toBeInTheDocument();

    const importedSection = screen.getByText('Imported Accounts').closest('div');
    expect(within(importedSection).getByText('Hello')).toBeInTheDocument();
    expect(within(importedSection).getByText('[Key]')).toBeInTheDocument();
  });
});
```

---

**Scenario 3: Backup Restoration [NEW - Backup Restoration]**

```typescript
describe('Integration: Backup Restoration on First Run', () => {
  it('should restore wallet from encrypted backup during initial setup', async () => {
    // 1. Ensure no wallet exists
    await WalletStorage.deleteWallet();
    const hasWallet = await WalletStorage.hasWallet();
    expect(hasWallet).toBe(false);

    // 2. Create mock backup file
    const backupData = createMockBackup({
      accounts: 3,
      contacts: 2,
      multisig: 1
    });

    // 3. Send restore message
    const restoreResponse = await chrome.runtime.sendMessage({
      type: MessageType.IMPORT_WALLET_BACKUP,
      payload: {
        backupData: backupData,
        password: 'BackupPassword123'
      }
    });

    expect(restoreResponse.success).toBe(true);
    expect(restoreResponse.summary.accountsRestored).toBe(3);
    expect(restoreResponse.summary.contactsRestored).toBe(2);
    expect(restoreResponse.summary.multisigRestored).toBe(1);

    // 4. Verify wallet structure
    const wallet = await WalletStorage.getWallet();
    expect(wallet.encryptedSeed).not.toBe('');
    expect(wallet.accounts).toHaveLength(3);

    // 5. Verify contacts
    const contacts = await ContactsStorage.getContacts();
    expect(contacts).toHaveLength(2);
  });

  it('should enforce rate limiting on wrong password', async () => {
    const backupData = createMockBackup();

    // Attempt 1-5: Wrong password
    for (let i = 0; i < 5; i++) {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.IMPORT_WALLET_BACKUP,
        payload: { backupData, password: 'WrongPassword' }
      });
      expect(response.success).toBe(false);
      expect(response.attemptsRemaining).toBe(4 - i);
    }

    // Attempt 6: Should be rate limited
    const response = await chrome.runtime.sendMessage({
      type: MessageType.IMPORT_WALLET_BACKUP,
      payload: { backupData, password: 'WrongPassword' }
    });
    expect(response.success).toBe(false);
    expect(response.code).toBe('RATE_LIMITED');
    expect(response.error).toContain('15 minutes');
  });
});
```

---

### 8.3 Manual Testing Checklist

**Test Case 1: First-Time Setup**

- [ ] Open wallet with no existing data
- [ ] Verify only 3 tabs visible (Create, Seed, Backup)
- [ ] Verify "Key" tab is NOT visible
- [ ] Click "Create" → Generate seed phrase
- [ ] Backup seed phrase and confirm
- [ ] Verify Account 1 created with importType: 'hd'
- [ ] Open Settings → Verify "Export Xpub" button visible for Account 1

**Test Case 1.5: Backup Restoration on First Run [NEW - Backup Restoration]**

- [ ] Open wallet with no existing data
- [ ] Click "Backup" tab
- [ ] Verify file upload area visible with drag-and-drop zone
- [ ] Drag valid .dat backup file onto upload area
- [ ] Verify file name and size displayed
- [ ] Verify password input appears
- [ ] Enter correct backup password
- [ ] Click "Restore Wallet"
- [ ] Verify loading state with spinner
- [ ] Verify success message with count: "X accounts, Y contacts restored"
- [ ] Verify redirect to Dashboard
- [ ] Verify all accounts visible in Sidebar (HD, Imported, Multisig sections)
- [ ] Verify contacts restored in Contacts screen
- [ ] Verify settings preferences retained

**Test Case 1.6: Backup Restoration Error Handling [NEW - Backup Restoration]**

**Wrong Password:**
- [ ] Select valid backup file
- [ ] Enter WRONG password
- [ ] Click "Restore Wallet"
- [ ] Verify error: "Incorrect password. 4 attempts remaining"
- [ ] Try wrong password 4 more times
- [ ] Verify lockout message: "Too many failed attempts. Wait 15 minutes."
- [ ] Verify restore button disabled

**Corrupted File:**
- [ ] Upload corrupted .dat file
- [ ] Verify error before password prompt: "Backup file is corrupted or invalid"
- [ ] Verify clear button to remove file

**File Too Large:**
- [ ] Attempt to upload 15MB file
- [ ] Verify error: "Backup file is too large. Maximum size: 10MB"

**Version Mismatch:**
- [ ] Upload backup from newer version (simulate)
- [ ] Verify error: "This backup requires wallet version vX.X. Please update extension."

**Non-HD Wallet in Backup:**
- [ ] Upload backup containing non-HD wallet (no seed)
- [ ] Verify warning dialog: "This backup doesn't contain a seed phrase..."
- [ ] Verify options: "Import Anyway" or "Create HD Wallet Instead"
- [ ] Click "Import Anyway"
- [ ] Verify accounts imported as "Imported Accounts"
- [ ] Verify upgrade banner in Settings

**Test Case 2: Import Account as Secondary Action**

- [ ] Create HD wallet first (from Test Case 1)
- [ ] Navigate to Settings screen
- [ ] Click "Import Account" button
- [ ] Paste WIF private key
- [ ] Select address type
- [ ] Enter account name "Imported"
- [ ] Click "Import Account"
- [ ] Verify success message: "Account imported"
- [ ] Verify account list shows:
  - "HD Accounts" section with Account 1
  - "Imported Accounts" section with "Imported [Key]"
- [ ] Verify "Export Xpub" button ONLY on Account 1
- [ ] Verify "Export Key" button on BOTH accounts

**Test Case 3: Account Grouping in Sidebar**

- [ ] Create HD wallet with 2 accounts
- [ ] Import 1 private key account
- [ ] Open Sidebar account dropdown
- [ ] Verify 2 sections:
  - "HD Accounts" (2 accounts)
  - "Imported Accounts" (1 account with [Key] badge)
- [ ] Verify divider between sections
- [ ] Verify section headers are uppercase gray text

**Test Case 4: Multisig Account Grouping**

- [ ] Create HD wallet
- [ ] Create 2-of-3 multisig account
- [ ] Import 1 private key account
- [ ] Open Sidebar account dropdown
- [ ] Verify 3 sections:
  - "HD Accounts"
  - "Imported Accounts"
  - "Multisig Accounts"
- [ ] Verify multisig account shows 2-of-3 badge

**Test Case 5: Migration - Existing Non-HD Wallet**

- [ ] Manually create non-HD wallet (wallet.encryptedSeed = '')
- [ ] Open Settings screen
- [ ] Verify upgrade banner shows: "Your wallet doesn't have a seed phrase backup"
- [ ] Click "Upgrade to HD Wallet"
- [ ] Generate new seed phrase
- [ ] Verify new HD Account 1 created
- [ ] Verify old accounts renumbered and marked as imported
- [ ] Verify wallet.encryptedSeed now has value

---

## 9. Expert Handoffs

### 9.1 UI/UX Designer

**Deliverables Needed:**

1. **Account Grouping Visual Design**
   - Section header styling (font, size, color, spacing)
   - Divider styling (thickness, color, margin)
   - Import badge design (color palette, border, size variants)
   - Empty state designs (if no imported accounts)

2. **Import Badge Component**
   - `[Key]` badge color scheme
   - `[Seed]` badge color scheme
   - Hover states and tooltips
   - Size variants (sm, md)

3. **Upgrade Banner Design** (for non-HD wallet migration)
   - Banner layout and positioning
   - Warning icon and color scheme
   - Button styling
   - Dismiss interaction

4. **Backup Restoration UI Design** [NEW - Backup Restoration]
   - File upload drag-and-drop area styling
   - File info card design (name, size, clear button)
   - Password input field with show/hide toggle
   - Loading state spinner and message
   - Success notification design
   - Error message styling (corrupted, wrong password, rate limit, version mismatch)
   - Security note banner design

**Questions for Designer:**

1. Should empty sections be hidden or collapsed?
2. Should we add icons next to section headers?
3. Should multisig accounts have a different visual treatment?
4. Should we add tooltips explaining account types?
5. [NEW] Should backup restoration show a preview of accounts before final restore?
6. [NEW] Should we animate the file upload drag-and-drop zone?
7. [NEW] Should the success message show a breakdown (accounts, contacts, multisig)?

**Handoff Document:** See `prompts/docs/plans/HD_WALLET_ENFORCEMENT_UX_DESIGN_SPEC.md` (to be created by UI/UX Designer)

---

### 9.2 Frontend Developer

**Implementation Checklist:**

1. **WalletSetup.tsx**
   - [ ] Remove "Key" tab from setup flow
   - [ ] Remove ImportPrivateKey component import and render
   - [ ] Update SetupTab type (remove 'import-key')
   - [ ] Test: Only 3 tabs visible on first run

2. **Sidebar.tsx**
   - [ ] Add account grouping logic (hdAccounts, importedAccounts, multisigAccounts)
   - [ ] Add section headers with styling
   - [ ] Add dividers between sections
   - [ ] Add ImportBadge component for imported accounts
   - [ ] Hide empty sections
   - [ ] Test: Accounts grouped correctly

3. **SettingsScreen.tsx**
   - [ ] Add account grouping logic (same as Sidebar)
   - [ ] Add section headers and dividers
   - [ ] Fix Export Xpub button visibility (HD accounts only)
   - [ ] Add Import Account button (if missing)
   - [ ] Test: Export buttons show/hide correctly

4. **ImportBadge.tsx** (New Component)
   - [ ] Create reusable badge component
   - [ ] Support 'private-key' and 'seed' types
   - [ ] Support 'sm' and 'md' sizes
   - [ ] Add tooltips
   - [ ] Test: Badge renders correctly in Sidebar and Settings

5. **WalletSetup/ImportBackup.tsx** (New Component) [NEW - Backup Restoration]
   - [ ] Implement file upload with drag-and-drop
   - [ ] File validation (type, size, magic bytes)
   - [ ] Password input with show/hide toggle
   - [ ] Rate limiting state management (5 attempts per 15 min)
   - [ ] Error handling (corrupted, wrong password, version mismatch, non-HD)
   - [ ] Loading state with spinner
   - [ ] Success state with account count
   - [ ] Test: File upload, validation, restore flow
   - [ ] Test: Rate limiting enforcement
   - [ ] Test: Error messages display correctly

**Handoff Document:** This PRD + `prompts/docs/plans/HD_WALLET_ENFORCEMENT_FRONTEND_PLAN.md` (to be created by Frontend Developer)

---

### 9.3 Backend Developer

**Implementation Checklist:**

1. **Message Handler Validation**
   - [ ] Add wallet existence check to CREATE_WALLET_FROM_PRIVATE_KEY
   - [ ] Return error if no wallet exists: `HD_WALLET_REQUIRED`
   - [ ] Test: Import private key fails on first run
   - [ ] Test: Import private key succeeds after HD wallet created

2. **Error Code Addition**
   - [ ] Add `HD_WALLET_REQUIRED` to PrivateKeyErrorCode enum
   - [ ] Update error messages for clarity

3. **Type Safety Audit**
   - [ ] Verify all account creation paths set importType
   - [ ] Add migration logic for accounts missing importType (default to 'hd')

4. **Backup Restoration Enhancements** [NEW - Backup Restoration]
   - [ ] Enhance IMPORT_WALLET_BACKUP to work during initial setup
   - [ ] Add file size validation (10MB max)
   - [ ] Add magic bytes validation ('BTWL' header)
   - [ ] Add version compatibility check
   - [ ] Implement rate limiting (5 attempts per 15 min)
   - [ ] Add non-HD wallet detection and warning
   - [ ] Implement duplicate account name handling
   - [ ] Return detailed restoration summary
   - [ ] Test: File validation logic
   - [ ] Test: Rate limiting enforcement
   - [ ] Test: Version compatibility checks
   - [ ] Test: Non-HD wallet handling
   - [ ] Test: Duplicate name resolution

**Handoff Document:** This PRD + `prompts/docs/plans/HD_WALLET_ENFORCEMENT_BACKEND_PLAN.md` (to be created by Backend Developer)

---

### 9.4 Security Expert [UPDATED - Backup Restoration]

**Security Review Questions:**

1. **Non-HD Wallet Migration:**
   - Is it safe to allow existing non-HD wallets to continue operating?
   - Should we force upgrade after a certain date/version?
   - What happens if user loses imported private keys?

2. **Account Type Validation:**
   - Should we validate importType on every account operation?
   - How do we handle corrupted importType data?
   - Should we add checksums to imported keys?

3. **Backup Requirements:**
   - Should we warn users when importing >10 private keys?
   - Should we block importing more than 20 accounts?
   - How do we educate users about backup requirements?

4. **Backup Restoration Security** [NEW - Backup Restoration]
   - Is 5 attempts per 15 minutes sufficient rate limiting?
   - Should we implement exponential backoff instead?
   - How do we prevent timing attacks on password validation?
   - Should backup files include additional integrity checks (HMAC)?
   - What's the security impact of allowing non-HD wallet imports?
   - Should we log restoration attempts for audit purposes?
   - How do we handle backup decryption in memory (wipe after use)?
   - Should we validate the backup password strength before accepting?
   - What happens if user forgets backup password (no recovery)?
   - Should we implement 2FA or additional verification for large backups?

**Handoff Document:** This PRD + Security Expert will create `prompts/docs/plans/HD_WALLET_ENFORCEMENT_SECURITY_REVIEW.md`

---

### 9.5 Blockchain Expert

**Bitcoin Protocol Review Questions:**

1. **Non-HD Wallet Architecture:**
   - Is our non-HD wallet implementation Bitcoin-compliant?
   - Are there any BIPs related to private key imports we should follow?

2. **Account Type Handling:**
   - Should multisig accounts be considered "imported" if created from imported xpubs?
   - How do we handle watch-only accounts in the future?

3. **UTXO Selection:**
   - Should we segregate UTXOs by account type (HD vs imported)?
   - Any privacy implications of mixing HD and imported accounts?

**Handoff Document:** This PRD + Blockchain Expert will create `prompts/docs/plans/HD_WALLET_ENFORCEMENT_BLOCKCHAIN_REVIEW.md`

---

### 9.6 Testing Expert

**Test Coverage Requirements:**

1. **Unit Tests**
   - [ ] WalletSetup: Tab visibility
   - [ ] Sidebar: Account grouping logic
   - [ ] SettingsScreen: Export button visibility
   - [ ] ImportBadge: Component rendering

2. **Integration Tests**
   - [ ] First-time setup flow (HD enforcement)
   - [ ] Import account after HD wallet created
   - [ ] Account segregation in UI
   - [ ] Export button accuracy

3. **Manual Test Cases**
   - [ ] All test cases from Section 8.3
   - [ ] Edge cases (migration, limits, multisig)

**Handoff Document:** This PRD + Testing Expert will create `prompts/docs/plans/HD_WALLET_ENFORCEMENT_TEST_PLAN.md`

---

## 10. Implementation Timeline [UPDATED - Backup Restoration]

### Phase 1: Backend Changes (1.5 days) [UPDATED]

**Tasks:**
- Add wallet existence check to CREATE_WALLET_FROM_PRIVATE_KEY
- Add HD_WALLET_REQUIRED error code
- **[NEW]** Enhance IMPORT_WALLET_BACKUP for initial setup
- **[NEW]** Add file validation (size, magic bytes, version)
- **[NEW]** Implement rate limiting for backup password attempts
- **[NEW]** Add non-HD wallet detection and warning
- **[NEW]** Implement duplicate account name handling
- Write backend unit tests
- Code review with Security Expert

**Deliverables:**
- Backend changes merged
- Backend tests passing
- Security review approved

---

### Phase 2: Frontend UI Changes (2.5 days) [UPDATED]

**Tasks:**
- Remove "Key" tab from WalletSetup
- Add account grouping to Sidebar
- Add account grouping to SettingsScreen
- Create ImportBadge component
- Fix Export Xpub button visibility
- **[NEW]** Create ImportBackup component with file upload
- **[NEW]** Implement drag-and-drop file upload
- **[NEW]** Add password input with rate limiting UI
- **[NEW]** Add error handling for all backup restoration edge cases
- **[NEW]** Add success state with account count display
- Write frontend unit tests

**Deliverables:**
- Frontend changes merged
- Frontend tests passing
- UI/UX Designer review approved

---

### Phase 3: Integration Testing (1.5 days) [UPDATED]

**Tasks:**
- Write integration tests
- Manual testing of all user flows
- Edge case testing (migration, limits)
- **[NEW]** Test backup restoration happy path
- **[NEW]** Test rate limiting enforcement
- **[NEW]** Test all error scenarios (corrupted, wrong password, version mismatch)
- **[NEW]** Test non-HD wallet import warning
- **[NEW]** Test large backup files (50+ accounts)
- Cross-browser testing

**Deliverables:**
- All tests passing
- Manual test checklist completed
- Bug fixes merged

---

### Phase 4: Documentation & Release (0.5 days)

**Tasks:**
- Update README with new flow
- Update CHANGELOG
- Create migration guide for existing users
- **[NEW]** Document backup restoration process
- Prepare release notes

**Deliverables:**
- Documentation updated
- Release notes published
- Version bumped to v0.11.0

**Total Timeline:** 5.5-6 days (increased from 4.5 days due to backup restoration feature)

---

## 11. Open Questions

### Question 1: Should we force upgrade for non-HD wallets?

**Options:**

A. **Allow indefinitely** - Users can continue using non-HD wallets
B. **Soft deprecation** - Show banner but don't force
C. **Hard deprecation** - Force upgrade after 30 days

**Recommendation:** Option B (Soft deprecation)

**Rationale:** Forcing upgrade is too disruptive. Show banner and encourage, but don't force.

---

### Question 2: Should we add account type icons?

**Current:** Text labels ("HD Accounts", "Imported Accounts")

**Proposed:** Icons next to labels

```
🔐 HD Accounts
📥 Imported Accounts
🔒 Multisig Accounts
```

**Recommendation:** Add icons (low effort, improves scannability)

---

### Question 3: Should we add tooltips to section headers?

**Proposed Tooltips:**

- **HD Accounts:** "Derived from your 12-word seed phrase. All backed up together."
- **Imported Accounts:** "Imported from external sources. Require separate backups."
- **Multisig Accounts:** "Require multiple signatures to spend."

**Recommendation:** Add tooltips (improves user education)

---

## 12. Appendix

### A. Related Documents

- `ARCHITECTURE.md` - System architecture
- `WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md` - Related to private key imports
- `SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md` - Sidebar design reference

### B. Mockups

See `prompts/docs/plans/HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md` (to be created by UI/UX Designer)

### C. API Changes

**New Error Code:**

```typescript
export enum PrivateKeyErrorCode {
  // ... existing codes ...
  HD_WALLET_REQUIRED = 'HD_WALLET_REQUIRED',
}
```

**No Breaking Changes:** All existing APIs remain compatible.

---

## 13. Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | Product Manager | Initial PRD |
| 1.1 | 2025-10-27 | Product Manager | **[UPDATED - Backup Restoration]** Added encrypted backup restoration as third wallet creation option: User Story 1.5 (restore from backup), Journey 2.5 (backup restoration flow with error paths), Edge Cases 4.4.1-4.4.7 (file validation, rate limiting, version compatibility, non-HD wallets, duplicate names), UI/UX Spec 5.1.5 (Backup tab design), Technical Requirements (ImportBackup component, BackupManager enhancements), Testing Plan (integration tests, manual test cases), Success Metrics (restoration rate, security), Expert Handoffs (UI/UX backup design, frontend/backend implementation, security review), Implementation Timeline (updated phases with +1.5 days). Total: 7 new edge cases, 3 new user journeys, comprehensive backup restoration coverage. |

---

## 14. Approval

**Product Manager:** [Pending]
**UI/UX Designer:** [Pending]
**Frontend Developer:** [Pending]
**Backend Developer:** [Pending]
**Security Expert:** [Pending]
**Blockchain Expert:** [Pending]

---

**End of Document**
