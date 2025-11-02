# Complete Wallet Backup and Restore - Product Requirements Document

**Feature:** Complete Wallet Backup and Restore System
**Version:** 2.0
**Date:** October 26, 2025
**Status:** Ready for Implementation
**Product Manager:** Product Manager Agent

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals and Non-Goals](#3-goals-and-non-goals)
4. [User Stories](#4-user-stories)
5. [Complete Feature Scope](#5-complete-feature-scope)
6. [Encrypted Backup File Format](#6-encrypted-backup-file-format)
7. [Export Flow](#7-export-flow)
8. [Import/Restore Flow](#8-importrestore-flow)
9. [Edge Cases and Conflict Resolution](#9-edge-cases-and-conflict-resolution)
10. [Security Requirements](#10-security-requirements)
11. [Integration Points](#11-integration-points)
12. [User Education Requirements](#12-user-education-requirements)
13. [Success Metrics](#13-success-metrics)
14. [MVP vs Post-MVP](#14-mvp-vs-post-mvp)
15. [Implementation Phases](#15-implementation-phases)
16. [Handoff Documentation](#16-handoff-documentation)

---

## 1. Executive Summary

### 1.1 Overview

This feature provides complete wallet backup and restore functionality, allowing users to:
- Export their entire wallet (accounts, contacts, settings) to an encrypted file
- Import/restore a wallet backup on another device or after browser corruption
- Protect against data loss from browser storage issues
- Safely migrate wallets between devices

### 1.2 Key Differentiators from Existing Export Features

| Feature | Seed Phrase Export | Private Key Export | **Complete Backup** |
|---------|-------------------|-------------------|-------------------|
| **What's Included** | Just seed phrase | Single account key | EVERYTHING |
| **Accounts** | Can regenerate | One account only | All accounts |
| **Contacts** | Lost | Lost | Preserved |
| **Settings** | Lost | Lost | Preserved |
| **Multisig** | Co-signer data lost | Not supported | Full multisig config |
| **Imported Keys** | Lost | One key only | All imported keys |
| **Use Case** | Manual recovery | Account migration | Complete migration |

### 1.3 Primary Use Cases

**UC1: Device Migration**
- User gets new computer
- Exports backup from old computer
- Imports backup on new computer
- Everything works exactly the same

**UC2: Browser Corruption**
- Chrome storage gets corrupted
- User lost all data (but has backup file)
- Imports backup file
- Wallet restored to exact previous state

**UC3: Preventive Backup**
- User creates regular backups
- Stores encrypted files in secure locations
- Peace of mind for disaster recovery

---

## 2. Problem Statement

### 2.1 Current State Problems

**P1: Incomplete Recovery Options**
- Seed phrase export only recovers HD wallet accounts
- Imported private keys are lost
- Contacts are lost
- Multisig co-signer configurations are lost
- Settings (auto-lock, network) are lost

**P2: Manual Reconstruction Required**
- User must manually re-import all private keys
- User must manually re-enter all contacts
- User must manually reconfigure all multisig accounts
- User must manually recreate account names
- This takes hours and is error-prone

**P3: No Protection Against Browser Storage Corruption**
- Chrome storage can be wiped by browser issues
- No way to recover exact wallet state
- Users forced to manually rebuild everything

### 2.2 User Impact

**Without Complete Backup:**
- "I have my seed phrase but all my contacts are gone"
- "I had 15 accounts with custom names, now I have to recreate them"
- "My multisig wallet is lost, I can't remember all the co-signer xpubs"
- "I spent hours setting this up perfectly, now it's all gone"

**With Complete Backup:**
- "I imported my backup and everything is exactly as it was"
- "All my contacts, accounts, and settings are preserved"
- "Moving to a new computer took 2 minutes"

---

## 3. Goals and Non-Goals

### 3.1 Goals

**G1: Complete Data Preservation**
- ✓ Backup and restore 100% of wallet data
- ✓ No data loss during migration
- ✓ Exact state reconstruction

**G2: Maximum Security**
- ✓ Backup encrypted with separate password (not wallet password)
- ✓ Strong encryption (AES-256-GCM, 600K PBKDF2)
- ✓ File integrity verification (SHA-256 checksum)
- ✓ Clear security warnings and education

**G3: Simple User Experience**
- ✓ One-click export, one-click import
- ✓ Clear progress indicators
- ✓ Obvious conflict resolution
- ✓ Works cross-device

**G4: Version Compatibility**
- ✓ Support future wallet upgrades
- ✓ Migrate old backup formats to new versions
- ✓ Never break existing backups

### 3.2 Non-Goals

**NG1: Cloud Backup (Post-MVP)**
- Not implementing automatic cloud sync
- Not integrating with cloud storage providers
- File-based export/import only for MVP

**NG2: Selective Restore (Post-MVP)**
- Cannot restore only contacts or only accounts
- All-or-nothing restore for MVP
- Selective restore is a future enhancement

**NG3: Backup Scheduling (Post-MVP)**
- No automatic periodic backups
- No backup reminders
- Manual export only for MVP

**NG4: Multi-Wallet Support (Out of Scope)**
- Extension still supports one wallet at a time
- Importing backup replaces current wallet
- Multi-wallet is a separate feature

---

## 4. User Stories

### 4.1 Export User Stories

**US-E1: Export Complete Wallet**
```
As a Bitcoin wallet user
I want to export my complete wallet to an encrypted file
So that I can restore it later or move it to another device

Acceptance Criteria:
- ✓ Export button available in Settings > Security
- ✓ Exported file includes: wallet seed, all accounts, all contacts, all settings, all imported keys, all multisig data
- ✓ File is encrypted with user-chosen password (separate from wallet password)
- ✓ File download completes successfully
- ✓ File size is reasonable (< 1MB for typical wallets)
- ✓ SHA-256 checksum is displayed for verification
- ✓ Export completes in < 30 seconds

Priority: P0 (MVP Critical)
```

**US-E2: Create Strong Backup Password**
```
As a security-conscious user
I want to create a strong, separate password for my backup file
So that my backup is secure even if my wallet password is compromised

Acceptance Criteria:
- ✓ Backup password must be different from wallet password
- ✓ Minimum 12 characters required
- ✓ Must contain uppercase, lowercase, and numbers
- ✓ Real-time password strength meter
- ✓ Requirements checklist shows what's missing
- ✓ Cannot proceed with weak password
- ✓ Confirm password must match

Priority: P0 (MVP Critical)
```

**US-E3: Understand What's Being Backed Up**
```
As a user
I want to clearly understand what data is included in my backup
So that I know what I'm protecting

Acceptance Criteria:
- ✓ Warning modal shows explicit list of what's included
- ✓ Mentions accounts, contacts, settings, seed phrase, imported keys
- ✓ Explains this is a complete wallet backup
- ✓ Shows security warnings about file protection
- ✓ User must acknowledge warnings before proceeding

Priority: P0 (MVP Critical)
```

**US-E4: Verify Backup Integrity**
```
As a technical user
I want to verify my backup file hasn't been corrupted
So that I can trust it will work when needed

Acceptance Criteria:
- ✓ SHA-256 checksum displayed in success modal
- ✓ Checksum is copyable to clipboard
- ✓ User can record checksum for later verification
- ✓ Filename includes timestamp for identification

Priority: P1 (Important)
```

### 4.2 Import/Restore User Stories

**US-I1: Import Backup into Empty Wallet**
```
As a new user on a fresh device
I want to import my wallet backup file
So that I can access my wallet with all my data

Acceptance Criteria:
- ✓ Import option available on wallet setup screen
- ✓ User can select .dat backup file
- ✓ User enters backup password (the one created during export)
- ✓ File is decrypted and validated
- ✓ Wallet is created with all backed-up data
- ✓ All accounts, contacts, and settings restored
- ✓ User can unlock wallet with NEW wallet password
- ✓ Import completes in < 30 seconds

Priority: P0 (MVP Critical)
```

**US-I2: Import Backup When Wallet Exists**
```
As a user who already has a wallet
I want to know what will happen if I import a backup
So that I don't accidentally lose my current wallet

Acceptance Criteria:
- ✓ Clear warning shown: "This will REPLACE your current wallet"
- ✓ Must confirm current wallet will be overwritten
- ✓ Option to export current wallet first (before import)
- ✓ Must enter current wallet password to confirm
- ✓ Cannot proceed without explicit confirmation
- ✓ After import, old wallet is gone, backup wallet is active

Priority: P0 (MVP Critical)
```

**US-I3: Detect Invalid or Corrupted Backup**
```
As a user trying to import a backup
I want to know immediately if my backup file is invalid
So that I don't waste time troubleshooting

Acceptance Criteria:
- ✓ File format validation before password entry
- ✓ Clear error if file is not a valid backup
- ✓ Clear error if file is corrupted (checksum mismatch)
- ✓ Clear error if password is incorrect
- ✓ Clear error if backup version is incompatible
- ✓ Helpful suggestions for each error type
- ✓ Option to retry with different file/password

Priority: P0 (MVP Critical)
```

**US-I4: Migrate Old Backup Versions**
```
As a user with an old backup file
I want to import my backup even if it was created on an older version
So that my old backups don't become useless

Acceptance Criteria:
- ✓ Backup file includes version number
- ✓ Newer wallet versions can import older backups
- ✓ Migration logic upgrades old format to new format
- ✓ User notified if migration occurs
- ✓ All data preserved during migration
- ✓ Checksum verified before migration

Priority: P1 (Important)
```

**US-I5: Understand Import Progress**
```
As a user importing a large backup
I want to see what's happening during import
So that I know the process is working

Acceptance Criteria:
- ✓ Progress modal shows decryption progress
- ✓ Step-by-step status updates
- ✓ Progress bar shows percentage
- ✓ Non-dismissible during import (prevents corruption)
- ✓ Clear success or error message at end

Priority: P1 (Important)
```

### 4.3 Edge Case User Stories

**US-EC1: Handle Network Mismatch**
```
As a user importing a testnet backup
I want to be warned if my backup is for a different network
So that I don't accidentally mix testnet and mainnet funds

Acceptance Criteria:
- ✓ Backup includes network information (testnet/mainnet)
- ✓ Warning shown if backup network differs from current setting
- ✓ User can choose to proceed or cancel
- ✓ Network setting updated to match backup (if user confirms)

Priority: P1 (Important)
```

**US-EC2: Handle File Download Blocked**
```
As a user whose browser blocks downloads
I want to retry the export
So that I can get my backup file

Acceptance Criteria:
- ✓ Detect when browser blocks download
- ✓ Show clear error message
- ✓ Provide retry button
- ✓ Link to browser help documentation
- ✓ Encrypted data retained in memory for retry

Priority: P2 (Nice to Have)
```

**US-EC3: Handle Large Wallet Backup**
```
As a user with many accounts and contacts
I want my backup export to complete successfully
So that all my data is backed up

Acceptance Criteria:
- ✓ Backup supports up to 1000 contacts
- ✓ Backup supports up to 100 accounts
- ✓ File size warning if backup > 5MB
- ✓ Export completes even for large wallets (< 60 sec)
- ✓ Progress updates for large exports

Priority: P1 (Important)
```

---

## 5. Complete Feature Scope

### 5.1 Data Included in Backup

**Complete Backup Includes (ALL of the following):**

1. **Wallet Seed Phrase** (Encrypted)
   - BIP39 mnemonic (12 or 24 words)
   - Empty if wallet created from private key (non-HD)

2. **All Accounts** (COMPLETE STATE - CRITICAL!)
   - Account type (single-sig or multisig)
   - Account index (for HD derivation)
   - Account name (custom user-defined names)
   - Address type (determines BIP44/48 derivation path)
   - Import type (hd, private-key, seed)
   - 🔴 **CRITICAL**: Address indices for exact state restoration:
     * externalIndex: Next receive address index (prevents BIP44 gap limit issues)
     * internalIndex: Next change address index
   - 🔴 **CRITICAL**: All generated addresses with COMPLETE metadata:
     * address: Full Bitcoin address string
     * derivationPath: Full BIP32 path (e.g., "m/84'/1'/0'/0/5")
     * index: Address index (0, 1, 2, ...)
     * isChange: Boolean (receive vs change chain)
     * used: Boolean (has received funds - prevents gap limit issues)
   - For multisig accounts:
     * All cosigner xpubs with fingerprints and derivation paths
     * Redeem scripts and witness scripts for all generated addresses

3. **Multisig Account Data** (Full Configuration)
   - Multisig configuration (2-of-2, 2-of-3, 3-of-5)
   - All co-signer information (name, xpub, fingerprint, derivation path)
   - Redeem scripts and witness scripts
   - Pending multisig transactions (PSBTs)
   - Signature status for pending transactions

4. **Imported Private Keys** (Encrypted)
   - All imported private keys (WIF format, encrypted)
   - All imported seed phrases (encrypted)
   - Associated account indices

5. **All Contacts** (Encrypted)
   - Contact names (encrypted)
   - Bitcoin addresses (plaintext for lookup)
   - Extended public keys (encrypted)
   - Notes, categories, email (encrypted)
   - Contact colors (encrypted)
   - Transaction counts and metadata
   - Privacy tracking data (reusage count, last used index)

6. **Wallet Settings**
   - Auto-lock timeout
   - Network (testnet/mainnet)

7. **Metadata**
   - Backup version number
   - Creation timestamp
   - Network type
   - Total accounts count
   - Total contacts count
   - Wallet version (v1 or v2)

### 5.2 Data NOT Included in Backup

**Excluded from Backup (for good reasons):**

1. **Transaction History**
   - Not stored in chrome.storage (fetched from Blockstream API)
   - Will be refetched after import/restore
   - No data loss (public blockchain data)

2. **Balance Information**
   - Calculated from UTXOs (fetched from API)
   - Will be recalculated after import/restore
   - No data loss (public blockchain data)

3. **Cached API Data**
   - Temporary data, not critical
   - Will be refetched after import/restore

4. **Session State**
   - Unlock status, current account, etc.
   - Ephemeral data, not needed for backup

### 5.8 Address Discovery Strategy (CRITICAL)

**Why This Matters**: BIP44 defines an "address gap limit" of 20. If a wallet has generated 100 addresses but only used addresses 0, 5, 10, and 95, blockchain scanning will STOP at address 30 (20 unused addresses after index 10) and NEVER find address 95. **Funds would be lost.**

**Our Solution**: Store exact address indices (`externalIndex`, `internalIndex`) and full address list in backup.

#### Address Indices (REQUIRED)

For each account, backup MUST include:

1. **externalIndex**: Index of the next receive address to generate
   - Example: If user has generated addresses 0-24, `externalIndex = 25`
   - After restore: Next generated address is index 25

2. **internalIndex**: Index of the next change address to generate
   - Example: If wallet has used 10 change addresses, `internalIndex = 10`
   - After restore: Next change output uses index 10

#### Address List (REQUIRED for Verification)

Backup MUST include ALL generated addresses with:
- `address`: Full Bitcoin address string
- `derivationPath`: Full BIP32 path (e.g., "m/84'/1'/0'/0/5")
- `index`: Address index within chain (0, 1, 2, ...)
- `isChange`: Boolean (false = receive, true = change)
- `used`: Boolean (true if address has received funds)

#### Restoration Process

1. **Regenerate addresses 0 to externalIndex-1** (receive chain)
2. **Regenerate addresses 0 to internalIndex-1** (change chain)
3. **Verify each regenerated address matches backup**
   - If mismatch: Abort with error (seed phrase wrong!)
4. **Restore `used` flags** for UI display
5. **Resume address generation** from `externalIndex`/`internalIndex`

#### Why NOT Use Blockchain Scanning?

| Method | Speed | Completeness | Verdict |
|--------|-------|--------------|---------|
| Store indices | Instant | 100% | ✅ CORRECT |
| Blockchain scan (gap 20) | Slow | Incomplete | ❌ WRONG |
| Blockchain scan (gap 100) | Very slow | Still incomplete | ❌ WRONG |

**Conclusion**: Storing indices is the ONLY reliable method for Bitcoin wallet backup.

---

## 6. Encrypted Backup File Format

### 6.1 File Format Specification

**File Extension:** `.dat` (binary data file)

**Filename Format:** `bitcoin-wallet-backup-YYYY-MM-DD-HHMMSS.dat`

**Example:** `bitcoin-wallet-backup-2025-10-26-143022.dat`

### 6.2 File Structure (Encrypted Container)

```typescript
interface EncryptedBackupFile {
  // === PLAINTEXT HEADER (for version detection) ===
  // First 512 bytes: JSON header (plaintext)
  header: {
    magicBytes: 'BTCWALLET';     // File type identifier
    version: number;              // Backup format version (1, 2, 3, etc.)
    created: number;              // Unix timestamp (ms)
    network: 'testnet' | 'mainnet';
    appVersion: string;           // Extension version (e.g., "0.10.0")
  };

  // === ENCRYPTION METADATA ===
  encryption: {
    algorithm: 'AES-256-GCM';     // Always this for now
    pbkdf2Iterations: 600000;     // Key derivation iterations
    salt: string;                 // Base64 encoded salt (32 bytes)
    iv: string;                   // Base64 encoded IV (12 bytes)
  };

  // === ENCRYPTED PAYLOAD ===
  // Encrypted with AES-256-GCM using backup password
  encryptedData: string;          // Base64 encoded encrypted JSON

  // === INTEGRITY VERIFICATION ===
  checksum: {
    algorithm: 'SHA-256';
    hash: string;                 // SHA-256 hash of encryptedData
  };
}
```

### 6.3 Decrypted Payload Structure

```typescript
interface BackupPayload {
  // === WALLET DATA (Complete StoredWallet structure) ===
  wallet: {
    version: 1 | 2;               // Wallet schema version
    encryptedSeed: string;        // BIP39 seed encrypted with WALLET password
    salt: string;                 // Wallet encryption salt
    iv: string;                   // Wallet encryption IV

    // 🔴 CRITICAL: All accounts with COMPLETE state
    accounts: WalletAccount[];    // StoredWalletV2.accounts[] includes:
                                  // For ALL account types:
                                  //   - index, name, addressType, importType
                                  //   - externalIndex (REQUIRED for BIP44 gap limit)
                                  //   - internalIndex (REQUIRED for change addresses)
                                  //   - addresses[] array with:
                                  //       * address, derivationPath, index, isChange, used
                                  // For multisig accounts (MultisigAccount):
                                  //   - multisigConfig ('2-of-2' | '2-of-3' | '3-of-5')
                                  //   - cosigners[] (name, xpub, fingerprint, derivationPath)
                                  //   - addresses include redeemScript and witnessScript

    settings: WalletSettings;     // { autoLockMinutes, network }

    // Imported private keys/seeds (already encrypted with wallet password)
    importedKeys?: {
      [accountIndex: number]: ImportedKeyData; // { encryptedData, salt, iv, type }
    };

    // Pending multisig transactions (PSBTs)
    pendingMultisigTxs?: PendingMultisigTx[]; // { psbtBase64, signatureStatus, ... }
  };

  // === CONTACTS DATA (ContactsData structure) ===
  contacts: {
    version: 1 | 2;               // Contacts schema version
    contacts: EncryptedContact[]; // All contacts (encrypted)
    salt: string;                 // Contacts encryption salt (shares wallet salt)
  };

  // === BACKUP METADATA ===
  metadata: {
    totalAccounts: number;
    totalContacts: number;
    hasMultisig: boolean;
    hasImportedKeys: boolean;
    exportedBy: string;           // Extension version
  };
}
```

### 6.4 Encryption Details

**Two Layers of Encryption:**

1. **Inner Layer (Wallet Password)**
   - Seed phrase encrypted with wallet password (already encrypted in storage)
   - Contacts encrypted with wallet password (already encrypted in storage)
   - Imported keys encrypted with wallet password (already encrypted in storage)

2. **Outer Layer (Backup Password)**
   - Entire BackupPayload encrypted with backup password
   - Separate password from wallet password (security best practice)
   - 600K PBKDF2 iterations (stronger than wallet password's 100K)

**Why Two Layers?**
- Backup file can be stored less securely (encrypted USB, password manager)
- If backup password is compromised, seed/contacts still protected by wallet password
- Defense in depth

### 6.5 File Size Estimates

| Wallet Size | Backup File Size |
|-------------|------------------|
| 1 account, 0 contacts | ~2 KB |
| 5 accounts, 10 contacts | ~5 KB |
| 20 accounts, 100 contacts | ~20 KB |
| 100 accounts, 1000 contacts | ~100 KB |

**Typical Size:** 5-20 KB for most users

### 6.6 Version Compatibility Matrix

| Backup Version | Can Import From Version | Migration Required? |
|----------------|------------------------|---------------------|
| 1 | 1 | No |
| 2 | 1, 2 | Yes (v1 → v2) |
| 3 (future) | 1, 2, 3 | Yes (v1 → v3, v2 → v3) |

**Forward Compatibility:**
- New versions MUST support importing old backups
- Migration logic upgrades old format to new format
- Never break existing backups

**Backward Compatibility:**
- Old versions CANNOT import new backups (graceful error)
- User prompted to upgrade extension

---

## 7. Export Flow

### 7.1 Export Flow Diagram

```
Settings Screen (Security Section)
    │
    ▼
[Export Complete Wallet Backup] Button
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 1: Warning                       │
│ ⚠️  What's Included in Backup          │
│ • All accounts and private keys        │
│ • All contacts                         │
│ • All settings                         │
│ • Multisig configurations              │
│ • Imported keys                        │
│                                        │
│ Security Warnings:                     │
│ • Create SEPARATE backup password      │
│ • Store file in SECURE location        │
│ • NEVER share file or password         │
│                                        │
│ [Cancel] [I Understand, Continue →]   │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 2: Wallet Password               │
│ 🔐 Confirm Your Wallet Password        │
│ For security, re-authenticate          │
│                                        │
│ Password: [••••••••••] [👁]           │
│                                        │
│ [Cancel] [Confirm →]                   │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 3: Backup Password               │
│ 🔑 Create Backup Password              │
│ This is SEPARATE from wallet password  │
│                                        │
│ Password: [••••••••••] [👁]           │
│ Strength: [████████░░] Strong          │
│ ✓ 12+ characters                       │
│ ✓ Uppercase letters                    │
│ ✓ Lowercase letters                    │
│ ✓ Numbers                              │
│                                        │
│ Confirm:  [••••••••••] [👁]           │
│                                        │
│ [Back] [Cancel] [Create Backup →]     │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 4: Progress (Non-dismissible)    │
│ 🔐 Creating Encrypted Backup...        │
│                                        │
│ [Spinner Animation]                    │
│                                        │
│ Progress: [████████░░░░] 65%          │
│                                        │
│ Current step:                          │
│ "Deriving backup encryption key..."    │
│                                        │
│ ⚠️  Do not close this window           │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 5: Success                       │
│ ✅ Backup Successfully Created         │
│                                        │
│ Your wallet backup has been saved to   │
│ your Downloads folder.                 │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 📄 Filename:                     │  │
│ │    bitcoin-wallet-backup-...dat  │  │
│ │                                  │  │
│ │ 📊 Size: 24.3 KB                │  │
│ │                                  │  │
│ │ 🔐 SHA-256 Checksum:            │  │
│ │    a3f5c89d2e... [Copy]         │  │
│ │                                  │  │
│ │ 📅 Created: Oct 26, 2025        │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 🛡️  SECURITY REMINDERS           │  │
│ │ ✓ Store in secure location       │  │
│ │ ✓ Keep password safe & separate  │  │
│ │ ✓ Test by importing on test env  │  │
│ │ ✓ Never share file or password   │  │
│ │ ✓ Keep multiple backups          │  │
│ └──────────────────────────────────┘  │
│                                        │
│           [Done]                       │
└────────────────────────────────────────┘
```

### 7.2 Export Process Steps (Backend)

```
1. Verify wallet password (re-authentication)
2. Retrieve wallet data from chrome.storage.local
3. Retrieve contacts data from chrome.storage.local
4. Build BackupPayload structure
5. Serialize payload to JSON
6. Derive backup encryption key (PBKDF2, 600K iterations)
7. Encrypt payload with backup password (AES-256-GCM)
8. Generate SHA-256 checksum of encrypted data
9. Build EncryptedBackupFile structure
10. Serialize to JSON (or binary format)
11. Convert to Blob
12. Trigger browser download
13. Return success with metadata
```

### 7.3 Export Progress Steps (Shown to User)

| Progress % | Step Description | Backend Operation |
|-----------|-----------------|-------------------|
| 0-20% | "Gathering wallet data..." | Retrieve from storage |
| 21-35% | "Gathering contacts data..." | Retrieve contacts |
| 36-50% | "Serializing backup data..." | JSON serialization |
| 51-75% | "Deriving backup encryption key..." | PBKDF2 (600K iterations - slowest step) |
| 76-90% | "Encrypting backup..." | AES-256-GCM encryption |
| 91-95% | "Generating checksum..." | SHA-256 hash |
| 96-100% | "Preparing download..." | Blob creation + download |

**Total Time:** 10-30 seconds (depends on PBKDF2 iterations)

---

## 8. Import/Restore Flow

### 8.1 Import Flow Diagram (No Existing Wallet)

```
Wallet Setup Screen
    │
    ▼
[Import from Backup File] Tab/Button
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 1: Select Backup File            │
│ 📁 Select Your Wallet Backup File      │
│                                        │
│ Drag & drop your .dat file here        │
│ or                                     │
│ [Browse Files]                         │
│                                        │
│ Supported: .dat files only             │
│                                        │
│ [Cancel] [Continue →]                  │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 2: Backup Password               │
│ 🔑 Enter Backup Password               │
│ Enter the password you created when    │
│ exporting this backup.                 │
│                                        │
│ Password: [••••••••••] [👁]           │
│                                        │
│ [Back] [Cancel] [Decrypt & Import →]  │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 3: Progress (Non-dismissible)    │
│ 🔐 Importing Wallet Backup...          │
│                                        │
│ [Spinner Animation]                    │
│                                        │
│ Progress: [█████████░░] 75%           │
│                                        │
│ Current step:                          │
│ "Restoring contacts..."                │
│                                        │
│ ⚠️  Do not close this window           │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 4: Set Wallet Password           │
│ 🔐 Create New Wallet Password          │
│ This will be your password to unlock   │
│ the wallet (can be different from      │
│ backup password).                      │
│                                        │
│ Password: [••••••••] [👁]             │
│ Confirm:  [••••••••] [👁]             │
│                                        │
│ [Cancel] [Create Wallet →]             │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 5: Success                       │
│ ✅ Wallet Successfully Restored        │
│                                        │
│ Your wallet has been restored from     │
│ the backup file.                       │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 📊 Restored:                     │  │
│ │    • 5 Accounts                  │  │
│ │    • 12 Contacts                 │  │
│ │    • 2 Multisig Accounts         │  │
│ │    • All Settings                │  │
│ │                                  │  │
│ │ 🌐 Network: Testnet             │  │
│ │ 📅 Backup Created: Oct 20, 2025 │  │
│ └──────────────────────────────────┘  │
│                                        │
│ You can now unlock your wallet with    │
│ the password you just created.         │
│                                        │
│           [Get Started]                │
└────────────────────────────────────────┘
```

### 8.2 Import Flow Diagram (Existing Wallet)

```
Settings Screen or Wallet Setup
    │
    ▼
[Import from Backup File] Button
    │
    ▼
┌────────────────────────────────────────┐
│ ⚠️  WARNING: Replace Existing Wallet  │
│                                        │
│ Importing a backup will PERMANENTLY   │
│ replace your current wallet.           │
│                                        │
│ Your current wallet has:               │
│ • 3 Accounts                           │
│ • 8 Contacts                           │
│ • Created: Oct 15, 2025                │
│                                        │
│ ⚠️  This action CANNOT be undone!     │
│                                        │
│ Recommended: Export your current       │
│ wallet before importing a backup.      │
│                                        │
│ [Export Current Wallet First]          │
│ [Cancel]                               │
│ [I Understand, Replace Wallet →]      │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 🔐 Confirm Current Wallet Password     │
│ To prevent accidental deletion, please │
│ confirm your current wallet password.  │
│                                        │
│ Password: [••••••••••] [👁]           │
│                                        │
│ [Cancel] [Confirm →]                   │
└────────────────────────────────────────┘
    │
    ▼
[Continue with same flow as "No Existing Wallet"]
```

### 8.3 Import Process Steps (Backend)

```
1. Validate backup file format
2. Parse header (plaintext)
3. Verify version compatibility
4. Verify checksum integrity
5. Prompt for backup password
6. Derive decryption key (PBKDF2, 600K iterations)
7. Decrypt backup payload (AES-256-GCM)
8. Validate decrypted JSON structure
9. Migrate backup format if needed (v1 → v2)
10. Clear existing wallet (if exists)
11. Restore wallet data to chrome.storage.local
12. Restore contacts data to chrome.storage.local
13. Prompt for new wallet password
14. Re-encrypt seed with new wallet password
15. Save restored wallet
16. Return success with metadata
```

### 8.4 Import Progress Steps (Shown to User)

| Progress % | Step Description | Backend Operation |
|-----------|-----------------|-------------------|
| 0-10% | "Validating backup file..." | File validation, checksum |
| 11-25% | "Deriving decryption key..." | PBKDF2 (600K iterations) |
| 26-40% | "Decrypting backup..." | AES-256-GCM decryption |
| 41-50% | "Validating backup data..." | JSON validation |
| 51-60% | "Migrating backup format..." | Version migration (if needed) |
| 61-75% | "Restoring accounts..." | Write accounts to storage |
| 76-90% | "Restoring contacts..." | Write contacts to storage |
| 91-100% | "Finalizing restore..." | Complete setup |

**Total Time:** 10-30 seconds

---

## 9. Edge Cases and Conflict Resolution

### 9.1 Import Scenarios

| Scenario | User Action | System Behavior |
|----------|------------|----------------|
| **Fresh install, no wallet** | Import backup | Direct import, no conflicts |
| **Existing wallet, import backup** | Import backup | REPLACE existing wallet (after confirmation) |
| **Backup with large address gap** | Import backup | Restore exact indices, regenerate ALL addresses deterministically (no blockchain scanning) |
| **Backup from different network** | Import backup | Warning modal, allow user to proceed or cancel |
| **Corrupted backup file** | Import backup | Error: "Backup file is corrupted. Checksum mismatch." |
| **Wrong backup password** | Import backup | Error: "Incorrect password. Please try again." |
| **Old backup version** | Import backup | Auto-migrate, notify user |
| **Future backup version** | Import backup | Error: "Please update extension to import this backup." |
| **Large backup file (> 5MB)** | Import backup | Warning: "Large backup detected. Import may take longer." |

### 9.2 Conflict Resolution Policies

**Policy 1: All-or-Nothing Import**
- Cannot selectively import accounts or contacts
- Import REPLACES entire wallet
- No merge functionality in MVP
- User must choose: keep current wallet OR import backup

**Policy 2: Network Mismatch Handling**
```
If backup network != current setting:
  Show warning modal:
  ⚠️  "This backup is for {backup network} but your wallet is set to {current network}.
      Importing will change your network setting to {backup network}.

      Continue?"

  [Cancel] [Change to {backup network} & Import]
```

**Policy 3: Version Migration**
```
If backup version < current version:
  Automatically migrate to current version
  Show notification: "Backup upgraded from v{old} to v{new}"
  Log migration details for debugging

If backup version > current version:
  Error: "This backup was created with a newer version.
          Please update the extension to import this backup."
  Provide link to extension update
```

### 9.3 Error Handling

**Error Types and User-Facing Messages:**

| Error Code | User Message | Recovery Action |
|-----------|-------------|----------------|
| `INVALID_FILE_FORMAT` | "This file is not a valid wallet backup. Please select a .dat backup file." | Select different file |
| `CHECKSUM_MISMATCH` | "Backup file is corrupted. The file may have been modified or damaged." | Try different backup file |
| `WRONG_PASSWORD` | "Incorrect backup password. Please try again." | Re-enter password |
| `VERSION_TOO_NEW` | "This backup requires a newer version of the extension. Please update." | Update extension |
| `DECRYPTION_FAILED` | "Failed to decrypt backup. The password may be incorrect or the file is corrupted." | Check password or file |
| `MIGRATION_FAILED` | "Failed to upgrade old backup format. Please contact support." | Contact support |
| `STORAGE_QUOTA_EXCEEDED` | "Not enough storage space to import backup. Please free up space." | Clear browser data |

---

## 10. Security Requirements

### 10.1 Encryption Specifications

**Backup Encryption (Outer Layer):**
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2-SHA256
- Iterations: 600,000 (stronger than wallet password)
- Salt: 32 bytes (random, unique per backup)
- IV: 12 bytes (random, unique per backup)
- Authentication Tag: 16 bytes (GCM mode)

**Wallet Encryption (Inner Layer):**
- Seed phrase: Already encrypted with wallet password (100K PBKDF2)
- Contacts: Already encrypted with wallet password (100K PBKDF2)
- Imported keys: Already encrypted with wallet password (100K PBKDF2)

**Why 600K iterations for backup?**
- Backup files are persistent (stored on disk)
- More vulnerable to offline brute-force attacks
- Stronger protection than live wallet (which has auto-lock)

### 10.2 Security Requirements

**SR-1: Separate Backup Password**
- MUST be different from wallet password
- MUST be minimum 12 characters
- MUST contain uppercase, lowercase, and numbers
- SHOULD contain special characters (recommended but not required)
- User MUST confirm password (matching validation)

**SR-2: Password Strength Enforcement**
- Cannot proceed with weak password
- Real-time strength meter
- Requirements checklist
- Clear visual feedback

**SR-3: Checksum Verification**
- SHA-256 checksum of encrypted data
- Verified on import (before decryption)
- Displayed to user for manual verification
- Copyable to clipboard

**SR-4: No Sensitive Data in Logs**
- NEVER log backup password
- NEVER log wallet password
- NEVER log seed phrase
- NEVER log private keys
- NEVER log decrypted contacts
- Error messages MUST NOT reveal sensitive info

**SR-5: Secure Memory Handling**
- Clear decrypted data from memory after use
- Use CryptoUtils.clearSensitiveData() for all sensitive strings
- No sensitive data in error stack traces

**SR-6: File Integrity**
- Tamper detection via checksum
- Version verification
- Format validation before decryption

### 10.4 Network Validation

**Requirement**: Backup network MUST match imported wallet network OR user must explicitly confirm network change.

**Network Detection Strategy**:

1. **In Backup File Header** (Plaintext):
   - `network: 'testnet' | 'mainnet'` field in header
   - Checked BEFORE decryption for quick validation

2. **Network Consistency Checks**:
   - Validate backup network matches wallet settings network
   - Validate all addresses in backup match declared network
   - Validate all WIF keys match declared network
   - Validate all xpubs match declared network

3. **Network Mismatch Handling**:

   **Scenario A: Fresh Install (No Existing Wallet)**
   ```
   Backup network: mainnet
   Extension setting: testnet (default)
   Action: Show warning modal
   Message: "This backup is for MAINNET. Your wallet will be set to MAINNET. Continue?"
   Options: [Cancel] [Change to Mainnet & Import]
   ```

   **Scenario B: Existing Wallet, Network Mismatch**
   ```
   Backup network: mainnet
   Current wallet: testnet
   Action: Show DOUBLE WARNING modal
   Message: "WARNING: This backup is for MAINNET.
            Your current wallet is TESTNET.
            Importing will DELETE your testnet wallet and switch to mainnet.
            This action CANNOT be undone."
   Options: [Cancel] [Export Testnet Wallet First] [DELETE Testnet & Import Mainnet]
   ```

4. **Network Validation Failures**:
   - If address prefixes don't match backup network: REJECT import with error
   - If WIF keys don't match backup network: REJECT import with error
   - If settings network doesn't match header network: REJECT import with error
   - No mixed-network wallets allowed (security risk)

5. **Post-Import Network Verification**:
   - Regenerate first address from seed
   - Verify regenerated address matches backed-up address
   - Verify address prefix matches network (tb1/bc1, 2/3, m,n/1)
   - If mismatch: ABORT and show error

### 10.5 Threat Model

**Threat 1: Stolen Backup File**
- **Risk:** Attacker gets backup file
- **Mitigation:** File encrypted with strong password (600K PBKDF2)
- **Residual Risk:** Weak backup password (user education required)

**Threat 2: Brute Force Attack on Backup**
- **Risk:** Attacker tries to crack backup password offline
- **Mitigation:** 600K PBKDF2 iterations, 12+ char password requirement
- **Residual Risk:** Long-term attack with powerful hardware

**Threat 3: Backup File Corruption**
- **Risk:** File gets corrupted, user loses all data
- **Mitigation:** SHA-256 checksum, user advised to keep multiple backups
- **Residual Risk:** All backup copies corrupted simultaneously

**Threat 4: Phishing Attack**
- **Risk:** User tricked into importing malicious backup
- **Mitigation:** File format validation, checksum verification, warnings
- **Residual Risk:** Sophisticated phishing with valid file format

**Threat 5: Man-in-the-Middle**
- **Risk:** Attacker modifies backup during transfer
- **Mitigation:** Checksum verification, user can compare checksum
- **Residual Risk:** User doesn't verify checksum

---

## 11. Integration Points

### 11.1 Export Integration

**Location:** Settings Screen → Security Section

**Button Placement:**
```
┌─────────────────────────────────────┐
│ Security                             │
├─────────────────────────────────────┤
│                                      │
│ Auto-lock Timer: [15 minutes ▼]    │
│                                      │
│ [🔒 Lock Wallet]                    │
│                                      │
│ [💾 Export Complete Wallet Backup]  │  ← NEW
│                                      │
└─────────────────────────────────────┘
```

**Button Style:**
- Same styling as "Lock Wallet" button
- Icon: 💾 or download icon
- Full width
- Gray background (not primary orange - less prominent than Lock)

### 11.2 Import Integration

**Location 1:** Wallet Setup Screen (No Wallet Exists)

**New Tab:**
```
┌──────────────────────────────────────────┐
│  [Create] [Import from Seed] [Import from Backup] │  ← NEW TAB
├──────────────────────────────────────────┤
│                                          │
│  Import from Backup File                 │
│                                          │
│  Restore your wallet from an encrypted   │
│  backup file.                            │
│                                          │
│  [Select Backup File (.dat)]            │
│                                          │
└──────────────────────────────────────────┘
```

**Location 2:** Settings Screen (Wallet Exists)

**Button in Advanced Section:**
```
┌─────────────────────────────────────┐
│ Advanced                             │
├─────────────────────────────────────┤
│                                      │
│ [📥 Import Backup & Replace Wallet] │  ← NEW
│                                      │
│ [🗑️ Delete Wallet]                  │
│                                      │
└─────────────────────────────────────┘
```

### 11.3 Backend Integration

**New Message Types:**
```typescript
export enum MessageType {
  // ... existing types ...

  // Wallet backup/restore
  EXPORT_WALLET_BACKUP = 'EXPORT_WALLET_BACKUP',
  IMPORT_WALLET_BACKUP = 'IMPORT_WALLET_BACKUP',
  VALIDATE_BACKUP_FILE = 'VALIDATE_BACKUP_FILE',
  VERIFY_BACKUP_PASSWORD = 'VERIFY_BACKUP_PASSWORD',
}
```

**New Files to Create:**
```
src/background/wallet/BackupManager.ts        # Main backup logic
src/background/wallet/__tests__/BackupManager.test.ts
src/tab/components/modals/ExportBackupModals.tsx
src/tab/components/modals/ImportBackupModals.tsx
```

---

## 12. User Education Requirements

### 12.1 Educational Content Needed

**EC-1: What is a Complete Backup?**
- Explain difference between seed phrase export and complete backup
- When to use each type of export
- Visual diagram showing what's included

**EC-2: Backup Password Best Practices**
- Why backup password must be different
- How to create strong passwords
- Where to store backup password (password manager, encrypted USB)
- Never reuse backup password

**EC-3: Backup Storage Best Practices**
- Where to store backup files (secure locations)
- Why not to store file and password together
- Multiple backups in different locations
- Testing backup by restoring in test environment

**EC-4: Recovery Workflow**
- Step-by-step guide for restoring from backup
- What to expect during import
- How to verify backup integrity (checksum)

### 12.2 Warning Messages Required

**Export Warnings:**
1. Pre-export: What's included, security responsibilities
2. Backup password creation: Why separate password matters
3. Post-export: Storage recommendations, test restore

**Import Warnings:**
1. Replace existing wallet: Cannot be undone
2. Network mismatch: Will change network setting
3. Version migration: Backup will be upgraded

### 12.3 Help Documentation

**Help Topics to Create:**
- "How to back up your wallet"
- "How to restore from backup"
- "Backup security best practices"
- "Troubleshooting backup import"
- "Difference between seed phrase and complete backup"

---

## 13. Success Metrics

### 13.1 Adoption Metrics

**M1: Export Usage**
- Target: 60% of users create at least one backup within 30 days
- Measurement: Track EXPORT_WALLET_BACKUP message count
- Goal: High adoption indicates users value backup feature

**M2: Import Success Rate**
- Target: >95% of import attempts succeed
- Measurement: Success vs error rate for IMPORT_WALLET_BACKUP
- Goal: Low friction import process

### 13.2 Quality Metrics

**M3: Export Completion Rate**
- Target: >90% of users who start export complete it
- Measurement: Started vs completed export flows
- Goal: Flow is clear and non-frustrating

**M4: Password Strength**
- Target: >80% of backup passwords rated "Strong" or better
- Measurement: Track password strength distribution
- Goal: Users creating secure backup passwords

**M5: Error Rate**
- Target: <5% of exports/imports encounter errors
- Measurement: Error count / total attempts
- Goal: Reliable, bug-free implementation

### 13.3 User Experience Metrics

**M6: Average Export Time**
- Target: <30 seconds from button click to file download
- Measurement: Timestamp tracking
- Goal: Fast, non-blocking export

**M7: Average Import Time**
- Target: <30 seconds from file selection to wallet ready
- Measurement: Timestamp tracking
- Goal: Fast restore experience

**M8: User Confidence**
- Target: >85% of users feel confident about backup security
- Measurement: Post-export survey (optional)
- Goal: Trust in backup system

---

## 14. MVP vs Post-MVP

### 14.1 MVP Features (Must Have)

**Included in MVP:**
- ✓ Complete wallet export to encrypted .dat file
- ✓ Separate backup password with strength enforcement
- ✓ Import/restore from backup file
- ✓ Replace existing wallet workflow
- ✓ Progress indicators for export/import
- ✓ SHA-256 checksum verification
- ✓ Version migration (v1 → v2 backups)
- ✓ Network mismatch warning
- ✓ Error handling for all scenarios
- ✓ Security warnings and education
- ✓ Integration into Settings screen
- ✓ Integration into Wallet Setup screen

**MVP Timeline:** 3-4 weeks (see Implementation Phases)

### 14.2 Post-MVP Features (Nice to Have)

**Phase 2 (Future Enhancements):**
- ⏳ Automatic periodic backups
- ⏳ Backup reminders ("Last backup was 30 days ago")
- ⏳ Cloud storage integration (encrypted upload to Dropbox, Google Drive)
- ⏳ Selective restore (import only contacts, only accounts)
- ⏳ Backup encryption with hardware key (YubiKey)
- ⏳ Multi-device sync
- ⏳ Backup history (track multiple backup versions)
- ⏳ Backup verification tool (test restore without importing)
- ⏳ Export to physical backup (print QR codes)

---

## 15. Implementation Phases

### 15.1 Phase 1: Backend Foundation (Week 1)

**Deliverables:**
- [ ] BackupManager.ts class with export/import logic
- [ ] Encrypted file format implementation
- [ ] PBKDF2 key derivation (600K iterations)
- [ ] AES-256-GCM encryption/decryption
- [ ] SHA-256 checksum generation/verification
- [ ] Version migration logic (v1 → v2)
- [ ] Message handlers (EXPORT_WALLET_BACKUP, IMPORT_WALLET_BACKUP)
- [ ] Unit tests for all backup logic
- [ ] File format specification documented

**Acceptance Criteria:**
- Can export wallet to encrypted .dat file
- Can import .dat file and restore wallet
- All tests pass
- Encryption verified secure

### 15.2 Phase 2: Export UI (Week 2)

**Deliverables:**
- [ ] Export warning modal
- [ ] Wallet password confirmation modal
- [ ] Backup password creation modal (with strength meter)
- [ ] Export progress modal
- [ ] Export success modal (with checksum)
- [ ] Settings screen integration
- [ ] Export button styling
- [ ] All modals responsive (mobile/desktop)
- [ ] Accessibility compliance (WCAG AA)

**Acceptance Criteria:**
- User can complete export flow from Settings
- Progress updates shown during export
- File downloads successfully
- Checksum displayed and copyable

### 15.3 Phase 3: Import UI (Week 2-3)

**Deliverables:**
- [ ] File selection modal
- [ ] Backup password entry modal
- [ ] Import progress modal
- [ ] Wallet password setup modal (for new wallet)
- [ ] Import success modal
- [ ] Replace wallet warning modal
- [ ] Wallet Setup screen integration
- [ ] Settings screen integration (advanced section)
- [ ] Error handling UI for all scenarios
- [ ] All modals responsive

**Acceptance Criteria:**
- User can import backup from Setup screen
- User can replace wallet from Settings
- Clear warnings for destructive actions
- All error scenarios handled gracefully

### 15.4 Phase 4: Testing & Polish (Week 3-4)

**Deliverables:**
- [ ] Integration tests (full export/import flow)
- [ ] Manual testing on testnet
- [ ] Security audit by security expert
- [ ] Bitcoin protocol review by blockchain expert
- [ ] UX review by UI/UX designer
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Performance testing (large wallets)
- [ ] Error scenario testing
- [ ] Help documentation

**Acceptance Criteria:**
- All tests pass (unit + integration)
- Security audit approved
- Blockchain expert approved
- No critical bugs
- Performance acceptable (<30 sec)

### 15.5 Phase 5: Documentation & Release (Week 4)

**Deliverables:**
- [ ] User documentation (how-to guides)
- [ ] Help content in extension
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] Expert notes updated
- [ ] Release notes
- [ ] Version bump (v0.11.0 or v0.12.0)

**Acceptance Criteria:**
- All documentation complete
- Release notes published
- Version tagged in git
- Ready for deployment

---

## 16. Handoff Documentation

### 16.1 Handoff to Blockchain Expert

**Review Status**: ✅ **COMPLETE - APPROVED WITH CONDITIONS MET**

**Review Document**: `prompts/docs/plans/WALLET_BACKUP_BITCOIN_REVIEW.md`

**Critical Findings Addressed**:

🔴 **BLOCKER #1 - RESOLVED**: Missing address indices
- **Finding**: `externalIndex` and `internalIndex` were mentioned in Section 5.1 but not explicit in BackupPayload
- **Impact**: Without these, address discovery fails and funds can be lost due to BIP44 gap limit
- **Resolution**:
  - Updated Section 5.1 with explicit requirements and red flag warnings
  - Updated Section 6.3 with detailed comments explaining CRITICAL fields
  - Added Section 5.8 documenting address discovery strategy
  - Confirmed WalletAccount[] TypeScript interface already includes these fields

🟡 **WARNING #1 - DOCUMENTED**: Multisig script type encoding
- **Finding**: BIP48 script type encoding needs clarification for P2SH-P2WSH
- **Resolution**: Documented in blockchain expert review; backend developer must verify KeyManager.ts implementation

🟡 **WARNING #2 - RESOLVED**: Network validation strategy
- **Finding**: Network mismatch handling was ambiguous
- **Resolution**: Added Section 10.4 with explicit network validation requirements and mismatch handling scenarios

**Questions for Blockchain Expert (ANSWERED):**

1. ✅ **ANSWERED**: Is the backup file format complete for HD wallets (BIP32/39/44)?
   - **Answer**: YES, if `externalIndex`, `internalIndex`, and `addresses[]` are stored
   - **Action**: Updated Sections 5.1, 5.8, and 6.3 to make these fields explicit and required

2. ✅ **ANSWERED**: Is the backup file format complete for multisig wallets (BIP48/67/174)?
   - **Answer**: YES, MultisigAccount interface is complete
   - **Caveat**: Backend developer must verify P2SH-P2WSH script type encoding in KeyManager.ts
   - **Reference**: See blockchain expert review Section 2 for details

3. ✅ **ANSWERED**: Are there any Bitcoin-specific data structures we're missing?
   - **Answer**: Address indices (externalIndex/internalIndex) were implied but not explicit
   - **Action**: Now explicitly documented in Sections 5.1, 5.8, and 6.3

4. ✅ **ANSWERED**: Is the version migration logic safe for Bitcoin data?
   - **Answer**: YES, as long as derivation paths and address indices are preserved during migration
   - **Requirement**: Migration logic must preserve externalIndex, internalIndex, and addresses[] for all account types

5. ✅ **ANSWERED**: Should we include any additional metadata?
   - **Answer**: Current metadata is sufficient
   - **Action**: Gap limit strategy documented in Section 5.8

6. ✅ **ANSWERED**: Are there any security concerns with storing scripts?
   - **Answer**: NO, redeem scripts and witness scripts are not sensitive data (public information)
   - **Confirmation**: Safe to store in backup

**Blockchain Expert Approval**: ✅ **APPROVED**

**Conditions for Implementation**:
- ✅ All required fields (externalIndex, internalIndex, addresses[]) explicitly documented in PRD
- ⏳ Backend Developer must verify address regeneration logic matches backup specification
- ⏳ Test Scenario 1 (Large Address Gap) must pass before release
- ⏳ Backend Developer must verify BIP48 script type encoding for P2SH-P2WSH in KeyManager.ts

**References**:
- Full blockchain expert review: `prompts/docs/plans/WALLET_BACKUP_BITCOIN_REVIEW.md`
- BIP44 gap limit specification: See Appendix A in review document
- Test vectors: See Section 12 in review document

### 16.2 Handoff to Security Expert

**Review Required:**
- Encryption implementation: PBKDF2 (600K iterations), AES-256-GCM
- Backup password requirements: 12+ chars, complexity enforcement
- Two-layer encryption: Backup password + wallet password
- Checksum verification: SHA-256 integrity check
- Memory handling: Are sensitive strings cleared after use?
- Error messages: Do they leak sensitive information?
- Attack surface: What are the threat vectors?

**Security Questions:**
1. Is 600K PBKDF2 iterations sufficient for backup file protection?
2. Should we enforce longer backup password (16+ chars instead of 12+)?
3. Is AES-256-GCM the right algorithm, or should we use something else?
4. Should we implement additional tamper detection (HMAC)?
5. Are there any side-channel attack vectors we should mitigate?
6. Should we implement rate limiting for import attempts?
7. Should we add a "password hint" feature (encrypted with wallet password)?

**Expected Deliverable:**
- Security audit report
- Threat model analysis
- Approval or list of required security enhancements
- Penetration testing recommendations

### 16.3 Handoff to Frontend Developer

**Implementation Guide:**
- See existing design docs:
  - ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md
  - ENCRYPTED_BACKUP_EXPORT_VISUAL_GUIDE.md
  - ENCRYPTED_BACKUP_EXPORT_SUMMARY.md
- Additional requirements from this PRD:
  - Import flow (8 modals total: 5 export + 3 import)
  - Replace wallet warning modal
  - Wallet Setup screen integration
  - Settings screen integration (two locations: Security + Advanced)

**New Components to Build:**
1. ExportBackupModals.tsx (5 modals from existing design)
2. ImportBackupModals.tsx (3 new modals)
3. ReplaceWalletWarningModal.tsx (destructive action warning)
4. BackupFileSelector.tsx (drag-drop file selector)

**State Management:**
- Export flow state machine
- Import flow state machine
- File upload handling
- Progress tracking

**Expected Deliverable:**
- All UI components implemented
- Responsive design (mobile + desktop)
- Accessibility compliant (WCAG AA)
- Integration with backend message handlers

### 16.4 Handoff to Backend Developer

**Implementation Guide:**
- Create BackupManager.ts (main backup logic)
- Implement export/import methods
- Integrate with WalletStorage.ts and ContactsStorage.ts
- Create message handlers (EXPORT_WALLET_BACKUP, IMPORT_WALLET_BACKUP)
- Implement version migration logic

**Key Methods to Implement:**
```typescript
class BackupManager {
  static async exportWallet(walletPassword: string, backupPassword: string): Promise<BackupResult>;
  static async importWallet(backupFile: File, backupPassword: string, newWalletPassword: string): Promise<ImportResult>;
  static async validateBackupFile(file: File): Promise<ValidationResult>;
  static async migrateBackupVersion(payload: BackupPayload): Promise<BackupPayload>;
}
```

**Integration Points:**
- WalletStorage.ts (retrieve/store wallet data)
- ContactsStorage.ts (retrieve/store contacts data)
- CryptoUtils.ts (encryption/decryption)
- messageHandlers.ts (add new handlers)

**Expected Deliverable:**
- BackupManager.ts fully implemented
- Unit tests with >90% coverage
- Integration tests for full export/import flow
- Error handling for all edge cases

### 16.5 Handoff to UI/UX Designer

**Design Requirements:**
- Import flow design (3 new modals)
- Replace wallet warning design (high-severity warning)
- File selector design (drag-drop UX)
- Error state designs for all import errors
- Success state design for import

**Existing Designs to Reference:**
- ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md (export flow)
- ENCRYPTED_BACKUP_EXPORT_VISUAL_GUIDE.md (visual reference)

**New Designs Needed:**
1. File selection modal (drag-drop area, file browser button)
2. Backup password entry modal (for import)
3. Import progress modal (similar to export progress)
4. Replace wallet warning modal (destructive action warning)
5. Import success modal (show what was restored)
6. All import error states

**Expected Deliverable:**
- Complete UX specification for import flow
- ASCII wireframes for all new modals
- Visual design guide for new components
- Error message copy for all scenarios

### 16.6 Handoff to Testing Expert

**Testing Requirements:**
- Unit tests for BackupManager.ts
- Unit tests for all UI components
- Integration tests for export/import flow
- Error scenario tests
- Performance tests (large wallets)
- Security tests (encryption verification)

**Test Scenarios to Cover:**
1. Export wallet (all account types, all data)
2. Import backup (fresh install, no existing wallet)
3. Import backup (replace existing wallet)
4. Network mismatch handling
5. Version migration (v1 → v2)
6. Corrupted file detection
7. Wrong password handling
8. Large wallet export/import
9. Memory leak testing (sensitive data cleared)
10. Concurrent export attempts (race conditions)

**Expected Deliverable:**
- Comprehensive test suite
- >90% code coverage
- Integration test scenarios
- Performance benchmarks
- Security test results

### 16.7 Handoff to QA Engineer

**Manual Testing Plan:**
- Test on testnet with real wallet
- Create backup, delete wallet, restore backup
- Verify all accounts restored correctly
- Verify all contacts restored correctly
- Verify settings restored correctly
- Test on different browsers (Chrome, Edge, Brave)
- Test on different OS (Windows, Mac, Linux)
- Test all error scenarios
- Verify security warnings are clear

**Test Cases:**
- See Testing Expert test scenarios
- Additional UX testing:
  - Are warnings clear and understandable?
  - Is progress feedback helpful?
  - Are error messages actionable?
  - Is the flow intuitive?

**Expected Deliverable:**
- Manual test report
- Bug reports for any issues
- UX feedback and recommendations
- Release readiness assessment

---

## 17. Open Questions

**Q1: Backup Password vs Wallet Password**
- Should we allow users to use the same password? (Currently: No)
- Should we detect and block password reuse? (Currently: Yes)

**Q2: Backup File Naming**
- Should we allow custom filenames?
- Should we include wallet identifier in filename?

**Q3: Multiple Backups**
- Should we track backup history (which backups exist)?
- Should we warn if last backup is old (>30 days)?

**Q4: Backup Encryption Algorithm**
- Is AES-256-GCM sufficient, or should we use XChaCha20-Poly1305?
- Should we support multiple algorithms for future-proofing?

**Q5: Import Conflict Resolution**
- Should we support merging backups (not MVP)?
- Should we support partial restore (not MVP)?

---

## 18. Dependencies

**Technical Dependencies:**
- CryptoUtils.ts (encryption/decryption)
- WalletStorage.ts (wallet data access)
- ContactsStorage.ts (contacts data access)
- Browser File API (file download/upload)

**Design Dependencies:**
- Existing export designs (ENCRYPTED_BACKUP_EXPORT_*.md)
- Design system (Tailwind CSS)
- Modal component (existing shared component)

**Expert Dependencies:**
- Security Expert review (encryption verification)
- Blockchain Expert review (Bitcoin data completeness)
- Frontend Developer (UI implementation)
- Backend Developer (backup logic implementation)
- UI/UX Designer (import flow design)
- Testing Expert (test suite)
- QA Engineer (manual testing)

---

## 19. Success Criteria for MVP

**MVP is successful if:**
- ✓ User can export complete wallet to encrypted file
- ✓ User can import backup and restore exact wallet state
- ✓ All accounts restored correctly (single-sig + multisig)
- ✓ All contacts restored correctly
- ✓ All settings restored correctly
- ✓ Backup password enforces strong security
- ✓ Checksum verification prevents corrupted imports
- ✓ Replace wallet workflow has clear warnings
- ✓ Export completes in <30 seconds
- ✓ Import completes in <30 seconds
- ✓ Security expert approves encryption implementation
- ✓ Blockchain expert approves Bitcoin data preservation
- ✓ All tests pass (unit + integration)
- ✓ No critical or high-severity bugs
- ✓ User documentation complete

---

## 20. Release Plan

**Target Version:** v0.11.0 or v0.12.0
**Target Timeline:** 3-4 weeks from start
**Release Type:** Feature release (non-breaking)

**Pre-Release Checklist:**
- [ ] All MVP features implemented
- [ ] Security audit approved
- [ ] Blockchain expert review approved
- [ ] All tests passing
- [ ] Manual testing complete
- [ ] Documentation complete
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Git tag created

**Post-Release Plan:**
- Monitor error rates
- Gather user feedback
- Iterate on UX improvements
- Plan Post-MVP features (Phase 2)

---

**Document Status:** ✅ Ready for Implementation - All Blockchain Blockers Resolved

**Recent Updates (October 26, 2025):**
- ✅ Added Section 5.8: Address Discovery Strategy (explains BIP44 gap limit problem)
- ✅ Updated Section 5.1: Explicit requirements for address indices with red flag warnings
- ✅ Updated Section 6.3: Detailed comments on BackupPayload structure showing CRITICAL fields
- ✅ Added Section 10.4: Explicit network validation requirements and mismatch handling
- ✅ Updated Section 16.1: Blockchain expert questions answered, review marked as APPROVED

**Next Steps:**
1. ✅ Product Manager: PRD updated with blockchain expert requirements
2. ✅ Blockchain Expert: Review complete - APPROVED with conditions documented
3. ⏳ Security Expert: Review security requirements (Section 10)
4. ⏳ UI/UX Designer: Design import flow modals (Section 8)
5. ⏳ Frontend Developer: Implement UI (Section 7, 8, 11)
6. ⏳ Backend Developer: Implement BackupManager (Section 6, 7.2, 8.3) - Must verify address regeneration logic
7. ⏳ Testing Expert: Create test plan (Section 13, 16.6) - Must include Test Scenario 1 (Large Address Gap)
8. ⏳ QA Engineer: Manual testing plan (Section 16.7)

---

**End of Product Requirements Document**
