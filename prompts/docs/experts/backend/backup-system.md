# Backup System - Complete Wallet Backup and Restore

**Last Updated**: November 1, 2025 (v0.12.1)
**Module**: `src/background/wallet/BackupManager.ts`
**Status**: Production-ready with transaction metadata support

---

## Overview

The Backup System provides secure, encrypted wallet backups with complete state preservation including:
- Wallet seed phrase (encrypted with wallet password)
- All accounts (single-sig and multisig) with complete address state
- All contacts with encryption
- **Transaction metadata (tags, categories, notes)** - Added v0.12.1
- Imported private keys/seeds
- Pending multisig transactions (PSBTs)
- Wallet settings

### Key Features

- **Two-layer encryption** (defense in depth)
- **File integrity verification** (SHA-256 checksum)
- **Network validation** (prevents testnet/mainnet mix-ups)
- **Backward compatibility** (supports old backups without transaction metadata)
- **Version migration support** (future-proof format)
- **BIP44 gap limit preservation** (CRITICAL - prevents fund loss)

---

## Security Architecture

### Two-Layer Encryption (Defense in Depth)

```
┌─────────────────────────────────────────────────────────────┐
│                   Encrypted Backup File                     │
│                                                              │
│  Layer 1 (Inner): Wallet Password Encryption                │
│  ├─ Seed phrase (AES-256-GCM, PBKDF2 100K iterations)      │
│  ├─ Contacts (AES-256-GCM per contact)                      │
│  └─ Transaction metadata (AES-256-GCM per transaction)      │
│                                                              │
│  Layer 2 (Outer): Backup Password Encryption                │
│  ├─ Complete payload (AES-256-GCM, PBKDF2 600K iterations)  │
│  └─ SHA-256 checksum for integrity verification             │
│                                                              │
│  Plaintext Header:                                           │
│  ├─ Magic bytes: "BTCWALLET"                                │
│  ├─ Version: 1                                               │
│  ├─ Network: testnet|mainnet                                │
│  └─ Metadata: Created timestamp, app version                │
└─────────────────────────────────────────────────────────────┘
```

### Why Two Layers?

1. **Inner Layer** (Wallet Password):
   - Protects sensitive data at rest in browser storage
   - Used for normal wallet operations
   - 100K PBKDF2 iterations

2. **Outer Layer** (Backup Password):
   - Protects the backup file itself
   - MUST be different from wallet password (enforced)
   - 600K PBKDF2 iterations (6x stronger for file protection)
   - Allows sharing/storing backup without exposing wallet password

### Password Requirements

```typescript
// Backup password requirements (stricter than wallet password)
const BACKUP_PASSWORD_MIN_LENGTH = 12;
const BACKUP_PBKDF2_ITERATIONS = 600000; // 6x wallet password

// Enforced rules:
// 1. Backup password != Wallet password (defense in depth)
// 2. Minimum 12 characters
// 3. Cannot be empty
```

---

## Data Included in Backups

### Complete Backup Manifest

| Data Type | Encrypted (Inner) | Encrypted (Outer) | Version Added | Optional |
|-----------|-------------------|-------------------|---------------|----------|
| **Wallet seed phrase** | ✅ Wallet password | ✅ Backup password | v0.10.0 | No |
| **Accounts** | ❌ (plaintext in payload) | ✅ Backup password | v0.10.0 | No |
| **Address indices** | ❌ | ✅ Backup password | v0.10.0 | No |
| **Contacts** | ✅ Wallet password | ✅ Backup password | v0.10.0 | Yes |
| **Transaction metadata** | ✅ Wallet password | ✅ Backup password | v0.12.1 | Yes |
| **Imported keys** | ✅ Wallet password | ✅ Backup password | v0.10.0 | Yes |
| **Pending multisig TXs** | ❌ | ✅ Backup password | v0.10.0 | Yes |
| **Wallet settings** | ❌ | ✅ Backup password | v0.10.0 | No |

### Critical Data Preservation

#### 1. Address Indices (BIP44 Gap Limit)

**CRITICAL**: Failure to preserve address indices results in LOSS OF FUNDS.

```typescript
// MUST preserve for each account:
interface WalletAccount {
  externalIndex: number;    // Last used external address index
  internalIndex: number;    // Last used change address index
  addresses: Array<{
    address: string;
    derivationPath: string;
    used: boolean;          // CRITICAL: Must preserve 'used' flags
  }>;
}
```

**Why this matters:**
- BIP44 gap limit is 20 addresses
- Wallet only scans 20 consecutive unused addresses
- If indices are reset, wallet may not find previously received funds
- `used` flags prevent gap limit violations

#### 2. Transaction Metadata (Added v0.12.1)

Transaction metadata includes user-added organizational data:

```typescript
interface TransactionMetadata {
  tags: string[];           // e.g., ["invoice-2024-001", "client-acme"]
  category: string;         // e.g., "Business Expense"
  notes: string;            // User notes
  updatedAt: number;        // Timestamp
}

// Storage format (encrypted with wallet password)
interface TransactionMetadataStorage {
  version: 1;
  metadata: {
    [txid: string]: EncryptedTransactionMetadata;
  };
  salt: string;             // Shared with wallet/contacts
}
```

**Encryption:**
- Each transaction's metadata encrypted individually with AES-256-GCM
- Unique IV per transaction
- Shared salt with wallet and contacts (same PBKDF2 key derivation)
- 100K PBKDF2 iterations

**Integration with Backup:**
```typescript
// Lines 275-282: Export - Retrieve transaction metadata
let transactionMetadata: TransactionMetadataStorage | undefined;
try {
  transactionMetadata = await TransactionMetadataStorage.getRawStorage();
} catch (error) {
  // Transaction metadata is optional - if it doesn't exist, skip it
  console.log('No transaction metadata found, skipping in backup');
}

// Lines 316-319: Export - Include in payload
if (transactionMetadata) {
  payload.transactionMetadata = transactionMetadata;
}

// Lines 533-543: Import - Restore transaction metadata
if (payload.transactionMetadata) {
  onProgress?.(91, 'Restoring transaction metadata...');
  try {
    await TransactionMetadataStorage.restoreFromBackup(
      payload.transactionMetadata
    );
  } catch (error) {
    console.error('Failed to restore transaction metadata:', error);
    // Don't fail the entire import if transaction metadata fails
  }
}
```

#### 3. Contacts (v2 with Encryption)

```typescript
interface ContactsData {
  version: 2;
  contacts: EncryptedContact[];  // Each contact encrypted individually
  salt: string;                  // Shared with wallet
}

interface EncryptedContact {
  id: string;
  // Plaintext fields (for lookup):
  address?: string;
  xpubFingerprint?: string;
  cachedAddresses?: string[];

  // Encrypted fields (with wallet password):
  encryptedData: string;  // Contains: name, email, notes, category, xpub, color
  iv: string;
  createdAt: number;
  updatedAt: number;
}
```

**Backup behavior:**
```typescript
// Lines 260-273: Retrieve contacts data
const hasContacts = await ContactsStorage.hasContacts();
let contactsData: any;

if (hasContacts) {
  contactsData = await ContactsStorage.getContactsData();
} else {
  // Create empty contacts structure if none exist
  contactsData = {
    version: 1,
    contacts: [],
    salt: wallet.salt, // Reuse wallet salt
  };
}
```

---

## Backup File Format

### File Structure (JSON)

```typescript
interface EncryptedBackupFile {
  // Plaintext header (for version detection and network validation)
  header: {
    magicBytes: 'BTCWALLET';          // File type identifier
    version: number;                   // Backup format version (1, 2, 3, etc.)
    created: number;                   // Unix timestamp (ms)
    network: 'testnet' | 'mainnet';   // Network type
    appVersion: string;                // Extension version (e.g., "0.12.1")
  };

  // Encryption metadata (plaintext)
  encryption: {
    algorithm: 'AES-256-GCM';
    pbkdf2Iterations: 600000;          // Stronger than wallet password (100K)
    salt: string;                      // Base64 encoded salt (32 bytes)
    iv: string;                        // Base64 encoded IV (12 bytes)
  };

  // Encrypted payload (encrypted with backup password)
  encryptedData: string;               // Base64 encoded encrypted JSON

  // Integrity verification (plaintext)
  checksum: {
    algorithm: 'SHA-256';
    hash: string;                      // SHA-256 hash of encryptedData (hex)
  };
}
```

### Decrypted Payload Structure

```typescript
interface BackupPayload {
  // Wallet data (StoredWallet structure)
  wallet: {
    version: 1 | 2;
    encryptedSeed: string;             // Encrypted with wallet password
    salt: string;
    iv: string;
    accounts: WalletAccount[];         // Includes externalIndex, internalIndex, addresses[]
    settings: WalletSettings;
    importedKeys?: { [accountIndex: number]: ImportedKeyData };
    pendingMultisigTxs?: PendingMultisigTx[];
  };

  // Contacts data (from ContactsStorage)
  contacts: {
    version: number;
    contacts: Contact[];
    salt: string;
  };

  // Transaction metadata (from TransactionMetadataStorage) - Optional for backward compatibility
  transactionMetadata?: TransactionMetadataStorage;

  // Metadata (for validation and display)
  metadata: {
    totalAccounts: number;
    totalContacts: number;
    totalTransactionMetadata?: number;  // Optional for backward compatibility
    hasMultisig: boolean;
    hasImportedKeys: boolean;
    exportedBy: string;                 // Extension version
  };
}
```

### Filename Convention

```typescript
// Generated filename pattern:
// btcwallet-backup-{network}-{timestamp}.json

// Example:
// btcwallet-backup-testnet-1730476800000.json
```

---

## Export Process

### Export Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Verify wallet password (0-20%)                          │
│     └─ WalletStorage.verifyPassword()                       │
├─────────────────────────────────────────────────────────────┤
│  2. Gather wallet data (21-35%)                             │
│     └─ WalletStorage.getWallet()                            │
├─────────────────────────────────────────────────────────────┤
│  3. Gather contacts data (36-50%)                           │
│     ├─ ContactsStorage.hasContacts()                        │
│     └─ ContactsStorage.getContactsData()                    │
├─────────────────────────────────────────────────────────────┤
│  4. Gather transaction metadata (optional)                  │
│     └─ TransactionMetadataStorage.getRawStorage()           │
├─────────────────────────────────────────────────────────────┤
│  5. Build payload (51-60%)                                  │
│     └─ Serialize to JSON                                    │
├─────────────────────────────────────────────────────────────┤
│  6. Derive backup encryption key (61-85%) [SLOWEST STEP]   │
│     └─ CryptoUtils.deriveKey(600K iterations)               │
├─────────────────────────────────────────────────────────────┤
│  7. Encrypt payload (86-95%)                                │
│     └─ CryptoUtils.encryptWithKey()                         │
├─────────────────────────────────────────────────────────────┤
│  8. Generate checksum (96-100%)                             │
│     └─ SHA-256 hash of encryptedData                        │
└─────────────────────────────────────────────────────────────┘
```

### Code Example: Export

```typescript
// Basic export
const backupFile = await BackupManager.exportWallet(
  walletPassword,
  backupPassword,
  (progress, step) => {
    console.log(`${step} - ${progress}%`);
  }
);

// Download as JSON file
const blob = new Blob([JSON.stringify(backupFile, null, 2)], {
  type: 'application/json'
});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `btcwallet-backup-${backupFile.header.network}-${Date.now()}.json`;
a.click();
```

### Transaction Metadata Export Logic

```typescript
// Lines 275-282: Optional transaction metadata retrieval
let transactionMetadata: TransactionMetadataStorage | undefined;
try {
  transactionMetadata = await TransactionMetadataStorage.getRawStorage();
} catch (error) {
  // Transaction metadata is optional - if it doesn't exist, skip it
  console.log('No transaction metadata found, skipping in backup');
}

// Lines 300-302: Include metadata count in payload metadata
metadata: {
  totalAccounts: wallet.accounts.length,
  totalContacts: contactsData.contacts.length,
  totalTransactionMetadata: transactionMetadata
    ? Object.keys(transactionMetadata.metadata).length
    : undefined,  // Undefined if no metadata exists
  // ...
}

// Lines 316-319: Add transaction metadata to payload if it exists
if (transactionMetadata) {
  payload.transactionMetadata = transactionMetadata;
}
```

**Design Decisions:**
- Transaction metadata is **optional** (graceful degradation)
- Export succeeds even if no transaction metadata exists
- `getRawStorage()` returns encrypted metadata (no password needed for export)
- Count included in metadata for validation/display purposes

---

## Import Process

### Import Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  1. Validate file structure (0-10%)                         │
│     └─ validateBackupFile()                                 │
├─────────────────────────────────────────────────────────────┤
│  2. Verify checksum (11-20%)                                │
│     └─ Compare SHA-256 hashes                               │
├─────────────────────────────────────────────────────────────┤
│  3. Derive decryption key (21-40%) [SLOWEST STEP]          │
│     └─ CryptoUtils.deriveKey(backup password)               │
├─────────────────────────────────────────────────────────────┤
│  4. Decrypt payload (41-50%)                                │
│     └─ CryptoUtils.decryptWithKey()                         │
├─────────────────────────────────────────────────────────────┤
│  5. Validate decrypted data (51-60%)                        │
│     ├─ Parse JSON                                           │
│     ├─ Validate payload structure                           │
│     └─ Validate network consistency                         │
├─────────────────────────────────────────────────────────────┤
│  6. Delete existing wallet (if any)                         │
│     └─ WalletStorage.deleteWallet()                         │
├─────────────────────────────────────────────────────────────┤
│  7. Restore wallet accounts (61-80%)                        │
│     └─ chrome.storage.local.set({ wallet })                 │
├─────────────────────────────────────────────────────────────┤
│  8. Restore contacts (81-90%)                               │
│     └─ chrome.storage.local.set({ contacts })               │
├─────────────────────────────────────────────────────────────┤
│  9. Restore transaction metadata (91-95%) [OPTIONAL]       │
│     └─ TransactionMetadataStorage.restoreFromBackup()       │
├─────────────────────────────────────────────────────────────┤
│  10. Clear sensitive data and finalize (96-100%)            │
│      └─ CryptoUtils.clearSensitiveData()                    │
└─────────────────────────────────────────────────────────────┘
```

### Code Example: Import

```typescript
// Import backup file
const importResult = await BackupManager.importWallet(
  backupFile,
  backupPassword,
  (progress, step) => {
    console.log(`${step} - ${progress}%`);
  }
);

// Check result
console.log(`Restored ${importResult.accountCount} accounts`);
console.log(`Restored ${importResult.contactCount} contacts`);
console.log(`Restored ${importResult.transactionMetadataCount} transaction metadata`);
console.log(`Network: ${importResult.network}`);
console.log(`Backup created: ${new Date(importResult.backupCreated)}`);
console.log(`Has multisig: ${importResult.hasMultisig}`);
console.log(`Has imported keys: ${importResult.hasImportedKeys}`);
```

### Transaction Metadata Import Logic

```typescript
// Lines 533-543: Optional transaction metadata restoration
if (payload.transactionMetadata) {
  onProgress?.(91, 'Restoring transaction metadata...');
  try {
    await TransactionMetadataStorage.restoreFromBackup(
      payload.transactionMetadata
    );
  } catch (error) {
    console.error('Failed to restore transaction metadata:', error);
    // Don't fail the entire import if transaction metadata fails
  }
}

// Lines 556-557: Include in import result
return {
  success: true,
  accountCount: payload.metadata.totalAccounts,
  contactCount: payload.metadata.totalContacts,
  transactionMetadataCount: payload.metadata.totalTransactionMetadata,
  // ...
};
```

**Design Decisions:**
- Transaction metadata restoration is **optional** (backward compatibility)
- Import succeeds even if `transactionMetadata` field is missing (old backups)
- Import does NOT fail if transaction metadata restoration fails (graceful degradation)
- Error logged to console but not thrown
- `restoreFromBackup()` saves encrypted metadata directly to chrome.storage

### Import Result

```typescript
interface ImportResult {
  success: boolean;
  accountCount: number;
  contactCount: number;
  transactionMetadataCount?: number;  // Optional (undefined for old backups)
  network: 'testnet' | 'mainnet';
  backupCreated: number;
  hasMultisig: boolean;
  hasImportedKeys: boolean;
}
```

---

## Validation

### Pre-Decryption Validation

Validation happens **before** decryption to fail fast and avoid expensive operations:

```typescript
// Lines 582-696: validateBackupFile()
static async validateBackupFile(
  backupFile: any
): Promise<ValidationResult> {
  // 1. Check file is object
  if (!backupFile || typeof backupFile !== 'object') {
    return { valid: false, error: 'Invalid file format' };
  }

  // 2. Check header
  if (backupFile.header.magicBytes !== 'BTCWALLET') {
    return { valid: false, error: 'Invalid file type' };
  }

  // 3. Check version
  if (backupFile.header.version > 1) {
    return {
      valid: false,
      error: `Backup version ${backupFile.header.version} is not supported`
    };
  }

  // 4. Check network
  if (backupFile.header.network !== 'testnet' &&
      backupFile.header.network !== 'mainnet') {
    return { valid: false, error: 'Invalid network in backup file' };
  }

  // 5. Check encryption metadata
  if (!backupFile.encryption.salt ||
      !backupFile.encryption.iv ||
      typeof backupFile.encryption.pbkdf2Iterations !== 'number') {
    return { valid: false, error: 'Missing encryption parameters' };
  }

  // 6. Check checksum
  if (!backupFile.checksum.hash) {
    return { valid: false, error: 'Invalid checksum format' };
  }

  return { valid: true };
}
```

### Post-Decryption Validation

```typescript
// Lines 761-811: isValidBackupPayload()
private static isValidBackupPayload(payload: any): payload is BackupPayload {
  // Check wallet data
  if (!payload.wallet ||
      (payload.wallet.version !== 1 && payload.wallet.version !== 2) ||
      typeof payload.wallet.encryptedSeed !== 'string' ||
      typeof payload.wallet.salt !== 'string' ||
      typeof payload.wallet.iv !== 'string' ||
      !Array.isArray(payload.wallet.accounts) ||
      !payload.wallet.settings) {
    return false;
  }

  // Check contacts data
  if (!payload.contacts ||
      !Array.isArray(payload.contacts.contacts)) {
    return false;
  }

  // Check metadata
  if (!payload.metadata) {
    return false;
  }

  // Check transaction metadata (optional - for backward compatibility)
  if (payload.transactionMetadata !== undefined) {
    if (typeof payload.transactionMetadata !== 'object' ||
        payload.transactionMetadata === null ||
        payload.transactionMetadata.version !== 1 ||
        typeof payload.transactionMetadata.metadata !== 'object' ||
        typeof payload.transactionMetadata.salt !== 'string') {
      return false;
    }
  }

  return true;
}
```

**Validation for Transaction Metadata (Lines 797-808):**
- Only validates if `transactionMetadata` field is present
- Checks version is 1 (current schema)
- Checks metadata is an object (map of txid → encrypted metadata)
- Checks salt is present (for decryption)
- Returns `false` if validation fails (invalid structure)
- **Allows undefined** for backward compatibility (old backups without this field)

### Network Consistency Check

```typescript
// Lines 485-490: Network mismatch validation
if (backupFile.header.network !== payload.wallet.settings.network) {
  throw new Error(
    'Network mismatch in backup file. The backup may be corrupted.'
  );
}
```

---

## Backward Compatibility

### Version Support Matrix

| Backup Version | Extension Version | Transaction Metadata | Contacts | Notes |
|----------------|-------------------|---------------------|----------|-------|
| **v1.0** | v0.10.0 - v0.12.0 | ❌ Not included | ✅ Included | Old backups |
| **v1.1** | v0.12.1+ | ✅ Optional field | ✅ Included | Current backups |

### Backward Compatibility Strategy

**Problem**: v0.12.1 adds transaction metadata, but older backups don't have this field.

**Solution**: Transaction metadata is **optional** in the backup payload:

1. **Export (v0.12.1+)**:
   ```typescript
   // Transaction metadata is optional
   transactionMetadata?: TransactionMetadataStorage;

   // Only include if it exists
   if (transactionMetadata) {
     payload.transactionMetadata = transactionMetadata;
   }
   ```

2. **Import (v0.12.1+)**:
   ```typescript
   // Only restore if present in backup
   if (payload.transactionMetadata) {
     await TransactionMetadataStorage.restoreFromBackup(
       payload.transactionMetadata
     );
   }
   ```

3. **Validation (v0.12.1+)**:
   ```typescript
   // Allow undefined for backward compatibility
   if (payload.transactionMetadata !== undefined) {
     // If present, validate structure
     if (/* validation checks */) {
       return false;
     }
   }
   // If undefined, skip validation (old backup)
   ```

**Result**:
- ✅ v0.12.1 can import v0.10.0 backups (without transaction metadata)
- ✅ v0.12.1 can import v0.12.1 backups (with transaction metadata)
- ✅ No data loss for old backups
- ✅ Transaction metadata preserved in new backups

### Forward Compatibility

For future versions (v2, v3, etc.):

```typescript
// Version check (Line 618-624)
if (backupFile.header.version > 1) {
  return {
    valid: false,
    error: `Backup version ${backupFile.header.version} is not supported. Please update the extension.`
  };
}
```

**Strategy for Future Versions:**
1. Increment backup format version in header
2. Add migration logic in `importWallet()`
3. Maintain backward compatibility with old formats
4. Validate version before attempting import

---

## Error Handling

### Graceful Degradation

```typescript
// Example: Transaction metadata (optional data)
try {
  transactionMetadata = await TransactionMetadataStorage.getRawStorage();
} catch (error) {
  // Don't fail export - transaction metadata is optional
  console.log('No transaction metadata found, skipping in backup');
}

// Example: Contacts (optional data)
const hasContacts = await ContactsStorage.hasContacts();
if (hasContacts) {
  contactsData = await ContactsStorage.getContactsData();
} else {
  // Create empty structure
  contactsData = { version: 1, contacts: [], salt: wallet.salt };
}
```

### Critical Errors (Fail Fast)

```typescript
// Password validation
if (walletPassword === backupPassword) {
  throw new Error(
    'Backup password must be different from wallet password for security'
  );
}

// Password strength
if (backupPassword.length < BACKUP_PASSWORD_MIN_LENGTH) {
  throw new Error(
    `Backup password must be at least ${BACKUP_PASSWORD_MIN_LENGTH} characters`
  );
}

// Wallet password verification
const isValid = await WalletStorage.verifyPassword(walletPassword);
if (!isValid) {
  throw new Error('Incorrect wallet password');
}

// Checksum verification
if (calculatedChecksum !== backupFile.checksum.hash) {
  throw new Error(
    'Backup file is corrupted. Checksum mismatch.'
  );
}
```

### Import Error Handling

```typescript
// Non-critical errors (logged but don't fail import)
if (payload.transactionMetadata) {
  try {
    await TransactionMetadataStorage.restoreFromBackup(
      payload.transactionMetadata
    );
  } catch (error) {
    console.error('Failed to restore transaction metadata:', error);
    // Don't fail the entire import if transaction metadata fails
  }
}

// Critical errors (fail import)
const validation = await this.validateBackupFile(backupFile);
if (!validation.valid) {
  throw new Error(validation.error || 'Invalid backup file');
}
```

**Decision Matrix:**

| Error Type | Behavior | Example |
|------------|----------|---------|
| **Critical (Security)** | Fail fast, throw error | Wrong password, checksum mismatch |
| **Critical (Data)** | Fail fast, throw error | Invalid wallet structure, missing seed |
| **Non-critical (Optional)** | Log warning, continue | Missing transaction metadata |
| **Non-critical (Empty)** | Create empty structure | No contacts exist |

---

## Security Considerations

### Critical Security Rules

```typescript
/**
 * CRITICAL SECURITY REQUIREMENTS:
 * - NEVER log backup password, wallet password, or decrypted data
 * - Validate file structure before decryption
 * - Verify checksum before decryption
 * - Clear sensitive data from memory after use
 * - Enforce separate backup password (different from wallet password)
 */
```

### Memory Cleanup

```typescript
// Lines 387-388: Clear sensitive data after export
CryptoUtils.clearSensitiveData(payloadJSON);

// Lines 548-549: Clear sensitive data after import
CryptoUtils.clearSensitiveData(decryptedJSON);
```

### Checksum Verification

```typescript
// Lines 709-718: SHA-256 checksum generation
private static async generateChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  return this.arrayBufferToHex(hashBuffer);
}

// Lines 442-450: Checksum verification before decryption
const calculatedChecksum = await this.generateChecksum(
  backupFile.encryptedData
);
if (calculatedChecksum !== backupFile.checksum.hash) {
  throw new Error(
    'Backup file is corrupted. Checksum mismatch.'
  );
}
```

**Why checksum on encrypted data?**
- Detects tampering or corruption before expensive decryption
- Does not reveal information about plaintext
- Fast verification (SHA-256 is faster than decryption)

### Password Separation

```typescript
// Lines 232-237: Enforce separate passwords
if (walletPassword === backupPassword) {
  throw new Error(
    'Backup password must be different from wallet password for security'
  );
}
```

**Why separate passwords?**
- **Defense in depth**: Compromise of one password doesn't expose both layers
- **Use case separation**: Wallet password for daily use, backup password for long-term storage
- **Sharing scenario**: Can share backup file without exposing wallet password
- **Password strength**: Backup password has stricter requirements (12+ chars, 600K iterations)

---

## Integration with Other Storage Modules

### WalletStorage Integration

```typescript
// Verify wallet password before export
const isValid = await WalletStorage.verifyPassword(walletPassword);

// Get wallet data for backup
const wallet = await WalletStorage.getWallet();

// Get wallet salt for contacts/metadata encryption
const wallet = await WalletStorage.getWallet();
const salt = wallet.salt;

// Delete existing wallet before restore
await WalletStorage.deleteWallet();
```

**File**: `src/background/wallet/WalletStorage.ts`

### ContactsStorage Integration

```typescript
// Check if contacts exist
const hasContacts = await ContactsStorage.hasContacts();

// Get raw contacts data (encrypted structure)
const contactsData = await ContactsStorage.getContactsData();

// Restore contacts from backup
await chrome.storage.local.set({ contacts: payload.contacts });
```

**File**: `src/background/wallet/ContactsStorage.ts`
**Notes**:
- Returns encrypted v2 contacts (each contact encrypted individually)
- No password needed for backup (already encrypted)
- Backup preserves encryption metadata

### TransactionMetadataStorage Integration

```typescript
// Get raw transaction metadata (encrypted structure)
const transactionMetadata = await TransactionMetadataStorage.getRawStorage();

// Restore transaction metadata from backup
await TransactionMetadataStorage.restoreFromBackup(
  payload.transactionMetadata
);
```

**File**: `src/background/wallet/TransactionMetadataStorage.ts`
**Methods**:
- `getRawStorage()`: Returns encrypted metadata without decryption (Lines 410-420)
- `restoreFromBackup()`: Saves encrypted metadata to chrome.storage (Lines 427-439)

**Notes**:
- Returns encrypted metadata (each transaction encrypted individually)
- No password needed for backup (already encrypted)
- Backup preserves encryption metadata (version, salt, per-transaction IVs)

**Storage Structure**:
```typescript
interface TransactionMetadataStorage {
  version: 1;
  metadata: {
    [txid: string]: {
      encryptedData: string;  // AES-256-GCM encrypted metadata
      iv: string;              // Unique IV per transaction
      updatedAt: number;       // Plaintext timestamp
    };
  };
  salt: string;  // Shared with wallet/contacts (same PBKDF2 key)
}
```

---

## Performance Considerations

### Bottlenecks

1. **PBKDF2 Key Derivation** (61-85% of export time)
   - 600,000 iterations for backup password
   - CPU-intensive, blocks UI thread
   - **Mitigation**: Use progress callbacks to show activity

2. **Encryption** (86-95% of export time)
   - AES-256-GCM encryption of payload
   - Payload size depends on account/contact count
   - **Mitigation**: Use Web Crypto API (hardware accelerated)

3. **Decryption** (21-50% of import time)
   - Key derivation + payload decryption
   - **Mitigation**: Same as export

### Performance Tips

```typescript
// Use progress callbacks for UX
const backupFile = await BackupManager.exportWallet(
  walletPassword,
  backupPassword,
  (progress, step) => {
    updateProgressBar(progress);
    updateStatusText(step);
  }
);

// Show loading indicator during slow operations
showLoader('Deriving encryption key... (this may take 10-15 seconds)');
```

### Expected Timing

| Operation | Time (average) | Notes |
|-----------|---------------|-------|
| Export (small wallet) | 10-15 seconds | 1-2 accounts, no contacts |
| Export (large wallet) | 15-25 seconds | 10+ accounts, 100+ contacts |
| Import (any size) | 8-12 seconds | Decryption faster than encryption |
| Key derivation | 5-8 seconds | 600K PBKDF2 iterations |
| Validation | <1 second | Pre-decryption checks |

---

## Testing Checklist

### Export Testing

- [ ] Export with valid wallet password and backup password
- [ ] Export fails with incorrect wallet password
- [ ] Export fails with same wallet/backup password
- [ ] Export fails with weak backup password (<12 chars)
- [ ] Export includes all accounts
- [ ] Export includes all contacts
- [ ] Export includes transaction metadata (if present)
- [ ] Export succeeds without transaction metadata (graceful degradation)
- [ ] Export includes imported keys
- [ ] Export includes pending multisig transactions
- [ ] Export preserves address indices (BIP44)
- [ ] Export checksum is valid
- [ ] Export progress callbacks work

### Import Testing

- [ ] Import with correct backup password
- [ ] Import fails with incorrect backup password
- [ ] Import fails with corrupted file
- [ ] Import fails with modified checksum
- [ ] Import fails with unsupported version
- [ ] Import fails with network mismatch
- [ ] Import restores all accounts
- [ ] Import restores all contacts
- [ ] Import restores transaction metadata (if present)
- [ ] Import succeeds without transaction metadata (old backups)
- [ ] Import succeeds if transaction metadata restoration fails
- [ ] Import restores imported keys
- [ ] Import restores pending multisig transactions
- [ ] Import preserves address indices
- [ ] Import progress callbacks work
- [ ] Import deletes existing wallet

### Backward Compatibility Testing

- [ ] v0.12.1 can import v0.10.0 backups (no transaction metadata)
- [ ] v0.12.1 can import v0.11.0 backups (no transaction metadata)
- [ ] v0.12.1 can import v0.12.0 backups (no transaction metadata)
- [ ] v0.12.1 can import v0.12.1 backups (with transaction metadata)
- [ ] Old backups without transaction metadata validate correctly
- [ ] New backups with transaction metadata validate correctly

### Security Testing

- [ ] Backup password must differ from wallet password
- [ ] Backup password requires 12+ characters
- [ ] Checksum prevents tampering
- [ ] Network validation prevents testnet/mainnet mix
- [ ] Sensitive data cleared from memory
- [ ] No passwords logged
- [ ] No decrypted data logged

---

## Future Improvements

### Planned

1. **Incremental Backups** (v0.13.0+)
   - Only backup changed data since last backup
   - Reduce backup file size
   - Faster backup/restore for large wallets

2. **Compressed Backups** (v0.13.0+)
   - gzip compression of payload before encryption
   - Reduce file size by 60-80%
   - Maintain compatibility with uncompressed backups

3. **Encrypted Cloud Sync** (v0.14.0+)
   - Auto-backup to encrypted cloud storage
   - Google Drive, Dropbox integration
   - End-to-end encryption (zero-knowledge)

### Considered (Not Planned)

1. **Multi-file Backups**
   - Split large backups into chunks
   - Complexity outweighs benefits for current use case

2. **Differential Backups**
   - Store only changes from previous backup
   - Requires backup chain management (complexity)

---

## Related Documentation

- **Architecture**: `prompts/docs/plans/ARCHITECTURE.md` - Overall system design
- **Wallet Storage**: `prompts/docs/experts/backend/storage.md` - Chrome storage patterns
- **Security Expert**: `prompts/docs/experts/security/_INDEX.md` - Security architecture
- **Blockchain Expert**: `prompts/docs/experts/blockchain/_INDEX.md` - BIP44 gap limit details
- **Backend Developer**: `prompts/docs/experts/backend/_INDEX.md` - Backend overview
