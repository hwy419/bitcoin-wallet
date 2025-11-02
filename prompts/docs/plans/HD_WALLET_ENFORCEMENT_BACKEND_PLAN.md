# HD Wallet Enforcement Backend Implementation Plan

**Purpose**: Enforce HD-only wallet creation at initial setup, while allowing private key imports only as account-level operations after an HD wallet exists.

**Created**: 2025-10-27
**Status**: Implementation-Ready

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Problem Definition](#2-problem-definition)
3. [Proposed Architecture Changes](#3-proposed-architecture-changes)
4. [Handler Modifications](#4-handler-modifications)
5. [Storage Schema Changes](#5-storage-schema-changes)
6. [Validation Logic Specifications](#6-validation-logic-specifications)
7. [Migration Strategy](#7-migration-strategy)
8. [Error Messages and User Feedback](#8-error-messages-and-user-feedback)
9. [Testing Requirements](#9-testing-requirements)
10. [Implementation Checklist](#10-implementation-checklist)

---

## 1. Current State Analysis

### 1.1 Current Wallet Creation Paths

The extension currently supports **THREE** ways to create a wallet:

| Method | Message Type | Handler | HD Wallet? | Storage Structure |
|--------|-------------|---------|------------|-------------------|
| **Create New** | `CREATE_WALLET` | `handleCreateWallet()` | ✅ Yes | HD wallet (seed phrase) |
| **Import Seed** | `IMPORT_WALLET` | `handleImportWallet()` | ✅ Yes | HD wallet (seed phrase) |
| **Import Private Key** | `CREATE_WALLET_FROM_PRIVATE_KEY` | `handleCreateWalletFromPrivateKey()` | ❌ No | Non-HD wallet (WIF) |

### 1.2 How Non-HD Wallets Are Created

**File**: `/home/michael/code_projects/bitcoin_wallet/src/background/index.ts`
**Handler**: `handleCreateWalletFromPrivateKey()` (lines 850-998)

**Current Behavior**:
```typescript
// Creates a non-HD wallet structure
const wallet = {
  version: 2 as const,
  encryptedSeed: '', // ❌ Empty string = non-HD wallet
  salt: wifEncryptionResult.salt,
  iv: wifEncryptionResult.iv,
  accounts: [firstAccount],
  pendingMultisigTxs: [],
  importedKeys: {
    0: {
      encryptedData: wifEncryptionResult.encryptedData,
      salt: wifEncryptionResult.salt,
      iv: wifEncryptionResult.iv,
      type: 'private-key' as const
    }
  },
  settings: { ... }
};
```

**Problem**: This handler allows creating a wallet WITHOUT a seed phrase, resulting in a non-HD wallet that:
- Cannot derive new addresses hierarchically
- Cannot generate change addresses properly
- Cannot export a seed phrase for backup
- Has limited recovery options

### 1.3 When `state.hdWallet` Gets Set to `null`

**File**: `/home/michael/code_projects/bitcoin_wallet/src/background/index.ts`

**Scenario 1: Wallet Lock** (line 1151)
```typescript
async function handleLockWallet(): Promise<MessageResponse> {
  // Clear sensitive data from memory
  state.hdWallet = null; // ⬅️ Set to null on lock
  state.addressGenerator = null;
  state.isUnlocked = false;
  // ...
}
```

**Scenario 2: Unlock Non-HD Wallet** (line 1033)
```typescript
async function handleUnlockWallet(payload: any): Promise<MessageResponse> {
  const isNonHDWallet = wallet.encryptedSeed === '';

  let hdWallet: HDWallet | null = null; // ⬅️ Set to null for non-HD wallets

  if (isNonHDWallet) {
    // hdWallet remains null
  } else {
    // Create HD wallet from seed
    const seed = KeyManager.mnemonicToSeed(mnemonic);
    hdWallet = new HDWallet(seed, 'testnet');
  }

  state.hdWallet = hdWallet; // ⬅️ Set to null if non-HD wallet
}
```

**Impact**: When `state.hdWallet` is `null`, many HD-specific operations fail or have undefined behavior.

### 1.4 Storage Structure Support for HD-Only Wallets

**File**: `/home/michael/code_projects/bitcoin_wallet/src/shared/types/index.ts`

**Current Storage Types**:
```typescript
// Wallet storage (v2 - supports multisig)
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string; // ⚠️ Can be empty string for non-HD wallets
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData }; // ⚠️ Allows imported keys
  settings: WalletSettings;
}
```

**Current Validation Logic** (`WalletStorage.ts`, lines 574-594):
```typescript
// Check non-empty encrypted fields
const isNonHDWallet = wallet.version === 2 && wallet.encryptedSeed.length === 0;

if (!isNonHDWallet) {
  // For HD wallets, all encryption fields must be non-empty
  if (wallet.encryptedSeed.length === 0 || wallet.salt.length === 0 || wallet.iv.length === 0) {
    return false;
  }
} else {
  // ⚠️ For non-HD wallets, only salt and IV must be non-empty
  if (wallet.salt.length === 0 || wallet.iv.length === 0) {
    return false;
  }
}
```

**Analysis**: The storage layer CURRENTLY supports non-HD wallets by allowing empty `encryptedSeed`.

### 1.5 Account-Level Private Key Import

**File**: `/home/michael/code_projects/bitcoin_wallet/src/background/index.ts`
**Handler**: `handleImportAccountPrivateKey()` (lines 1430-1642)

**Current Behavior**:
```typescript
async function handleImportAccountPrivateKey(payload: any): Promise<MessageResponse> {
  // ✅ Check if wallet is unlocked (ensures HD wallet exists)
  if (!isWalletUnlocked()) {
    return {
      success: false,
      error: 'Wallet is locked. Please unlock first.',
    };
  }

  // ✅ Get current wallet to determine next account index
  const wallet = await WalletStorage.getWallet();
  const nextAccountIndex = wallet.accounts.length;

  // ✅ Create imported key data
  const importedKeyData: ImportedKeyData = { ... };

  // ✅ Create account object
  const newAccount: Account = {
    accountType: 'single',
    index: nextAccountIndex,
    name,
    addressType,
    importType: 'private-key', // ⬅️ Marks as imported
    // ...
  };

  // ✅ Add account and store imported key
  await WalletStorage.addAccount(newAccount);
  await WalletStorage.storeImportedKey(nextAccountIndex, importedKeyData);
}
```

**Analysis**: This handler is CORRECT. It:
- Requires wallet to be unlocked (HD wallet must exist)
- Adds as a NEW account (doesn't replace wallet)
- Stores imported key separately in `importedKeys` map
- Marks account with `importType: 'private-key'`

**Problem**: This is the RIGHT way to import private keys, but `CREATE_WALLET_FROM_PRIVATE_KEY` bypasses this by creating a non-HD wallet from scratch.

---

## 2. Problem Definition

### 2.1 Current Issues

1. **Non-HD Wallets Can Be Created at Initial Setup**
   - `CREATE_WALLET_FROM_PRIVATE_KEY` allows creating a wallet without a seed phrase
   - Results in a wallet with `encryptedSeed: ''`
   - `state.hdWallet` remains `null` when unlocked
   - Limited functionality and poor UX

2. **Inconsistent Wallet Structure**
   - Some wallets have HD root, others don't
   - Different code paths based on `wallet.encryptedSeed === ''`
   - Validation logic must handle both HD and non-HD wallets
   - Increased complexity and maintenance burden

3. **Poor User Experience**
   - Users who import private key at setup get a crippled wallet
   - No clear path to "upgrade" to HD wallet later
   - Cannot generate new addresses or change addresses
   - Seed phrase backup is impossible

4. **Security and Recovery Concerns**
   - Non-HD wallets have no seed phrase backup
   - Recovery requires storing the exact WIF private key
   - Higher risk of fund loss if private key is lost

### 2.2 Desired Behavior

**Initial Wallet Creation** (WalletSetup screen):
- ✅ **CREATE_WALLET**: Generate new HD wallet from mnemonic
- ✅ **IMPORT_WALLET**: Import HD wallet from existing mnemonic
- ❌ **CREATE_WALLET_FROM_PRIVATE_KEY**: BLOCKED at wallet creation

**After HD Wallet Exists** (Account Management):
- ✅ **IMPORT_ACCOUNT_PRIVATE_KEY**: Import private key as a new account
- ✅ **IMPORT_ACCOUNT_SEED**: Import seed phrase as a new account

**Validation Rules**:
1. Wallet MUST have a seed phrase (`encryptedSeed` cannot be empty)
2. Private key import ONLY allowed when HD wallet exists
3. All wallets are HD wallets (no special cases)

---

## 3. Proposed Architecture Changes

### 3.1 Remove Non-HD Wallet Support

**Goal**: Eliminate all code paths that allow creating or maintaining non-HD wallets.

**Changes**:
1. **Remove Handler**: Delete `handleCreateWalletFromPrivateKey()`
2. **Remove Message Type**: Remove `CREATE_WALLET_FROM_PRIVATE_KEY` from `MessageType` enum
3. **Simplify Validation**: Remove non-HD wallet checks from `WalletStorage.isValidStoredWallet()`
4. **Simplify Unlock**: Remove non-HD wallet code paths from `handleUnlockWallet()`

### 3.2 Add Wallet Initialization Flag

**Purpose**: Track whether an HD wallet has been initialized, preventing private key imports during setup.

**Storage Changes**:
```typescript
// NEW: Add to WalletSettings
export interface WalletSettings {
  autoLockMinutes: number;
  network: 'testnet' | 'mainnet';
  hdWalletInitialized: boolean; // ⬅️ NEW: Always true for HD wallets
}
```

**Benefits**:
- Explicit flag that wallet is HD-based
- Prevents accidental non-HD wallet creation
- Can be used for migration detection
- Clear indicator for validation logic

### 3.3 Enforce HD Wallet Requirement

**Validation Logic**:
```typescript
// WalletStorage.ts
private static isValidStoredWallet(wallet: any): wallet is StoredWallet {
  // ...existing checks...

  // ⬅️ NEW: Require non-empty encryptedSeed (no more non-HD wallets)
  if (wallet.encryptedSeed.length === 0) {
    console.error('[WalletStorage] Validation failed: encryptedSeed is empty (non-HD wallet not supported)');
    return false;
  }

  // ⬅️ NEW: Require hdWalletInitialized flag
  if (!wallet.settings.hdWalletInitialized) {
    console.warn('[WalletStorage] Validation warning: hdWalletInitialized flag is missing (legacy wallet)');
    // Allow for migration, but log warning
  }

  return true;
}
```

---

## 4. Handler Modifications

### 4.1 DELETE: `handleCreateWalletFromPrivateKey()`

**Action**: Remove entire handler (lines 850-998 in `index.ts`)

**Reason**: This handler is the root cause of non-HD wallet creation. It should not exist.

**Impact**:
- Frontend must remove corresponding UI (private key import option during wallet setup)
- Error handling for `CREATE_WALLET_FROM_PRIVATE_KEY` message type no longer needed
- Simplified code paths in wallet creation logic

**Code Removal**:
```typescript
// ❌ DELETE THIS ENTIRE HANDLER
async function handleCreateWalletFromPrivateKey(payload: any): Promise<MessageResponse> {
  // ... 148 lines of code ...
}
```

**Message Handler Removal**:
```typescript
// src/background/index.ts - handleMessage() function
case MessageType.CREATE_WALLET_FROM_PRIVATE_KEY:
  return handleCreateWalletFromPrivateKey(message.payload); // ❌ DELETE THIS CASE
```

---

### 4.2 UPDATE: `handleCreateWallet()`

**Current Implementation** (lines 664-740):
```typescript
async function handleCreateWallet(payload: any): Promise<MessageResponse> {
  // ... validation ...

  // Generate new mnemonic
  const mnemonic = generateMnemonic(128); // 12 words

  // Create wallet in storage
  const wallet = await WalletStorage.createWallet(
    mnemonic,
    password,
    firstAccount,
    { network: 'testnet', autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES }
  );

  // ... unlock wallet ...
}
```

**Proposed Changes**:
```typescript
async function handleCreateWallet(payload: any): Promise<MessageResponse> {
  // ... existing validation ...

  // ✅ EXISTING: Generate new mnemonic
  const mnemonic = generateMnemonic(128); // 12 words

  // ✅ NEW: Add hdWalletInitialized flag to settings
  const settings = {
    network: 'testnet' as const,
    autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
    hdWalletInitialized: true // ⬅️ NEW: Mark as HD wallet
  };

  // ✅ UPDATED: Create wallet with new settings
  const wallet = await WalletStorage.createWallet(
    mnemonic,
    password,
    firstAccount,
    settings
  );

  // ... rest of implementation unchanged ...
}
```

**Changes Summary**:
- ✅ Add `hdWalletInitialized: true` to settings
- ✅ No other changes needed (already creates HD wallet)

---

### 4.3 UPDATE: `handleImportWallet()`

**Current Implementation** (lines 748-828):
```typescript
async function handleImportWallet(payload: any): Promise<MessageResponse> {
  // ... validation ...

  // Validate mnemonic
  if (!validateMnemonic(mnemonic)) {
    return {
      success: false,
      error: 'Invalid mnemonic phrase. Please check your words and try again.',
    };
  }

  // Create wallet in storage
  const wallet = await WalletStorage.createWallet(
    mnemonic,
    password,
    firstAccount,
    { network: 'testnet', autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES }
  );

  // ... unlock wallet ...
}
```

**Proposed Changes**:
```typescript
async function handleImportWallet(payload: any): Promise<MessageResponse> {
  // ... existing validation ...

  // ✅ EXISTING: Validate mnemonic
  if (!validateMnemonic(mnemonic)) {
    return {
      success: false,
      error: 'Invalid mnemonic phrase. Please check your words and try again.',
    };
  }

  // ✅ NEW: Add hdWalletInitialized flag to settings
  const settings = {
    network: 'testnet' as const,
    autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
    hdWalletInitialized: true // ⬅️ NEW: Mark as HD wallet
  };

  // ✅ UPDATED: Create wallet with new settings
  const wallet = await WalletStorage.createWallet(
    mnemonic,
    password,
    firstAccount,
    settings
  );

  // ... rest of implementation unchanged ...
}
```

**Changes Summary**:
- ✅ Add `hdWalletInitialized: true` to settings
- ✅ No other changes needed (already imports HD wallet)

---

### 4.4 UPDATE: `handleUnlockWallet()`

**Current Implementation** (lines 1006-1132):
```typescript
async function handleUnlockWallet(payload: any): Promise<MessageResponse> {
  // Get wallet to access salt
  const wallet = await WalletStorage.getWallet();

  // Derive encryption key from password
  const encryptionKey = await CryptoUtils.deriveKey(password, saltBuffer);

  // ❌ REMOVE: Check if this is a non-HD wallet
  const isNonHDWallet = wallet.encryptedSeed === '';

  let mnemonic: string;
  let seed: Uint8Array;
  let hdWallet: HDWallet | null = null;

  if (isNonHDWallet) {
    // ❌ REMOVE: Non-HD wallet code path (lines 1035-1062)
    // Validate password by decrypting imported private key
    // ...
  } else {
    // ✅ KEEP: HD wallet code path
    // Decrypt seed phrase
    mnemonic = await WalletStorage.unlockWallet(password);
    seed = KeyManager.mnemonicToSeed(mnemonic);
    hdWallet = new HDWallet(seed, 'testnet');
  }

  // Update state
  state.hdWallet = hdWallet; // ⬅️ Could be null for non-HD wallets

  // ... rest of implementation ...
}
```

**Proposed Changes**:
```typescript
async function handleUnlockWallet(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.password) {
      return {
        success: false,
        error: 'Password is required',
      };
    }

    const { password } = payload;

    // ✅ Get wallet to access salt
    const wallet = await WalletStorage.getWallet();

    // ✅ NEW: Validate that wallet is HD-based
    if (!wallet.encryptedSeed || wallet.encryptedSeed.length === 0) {
      // This should never happen with new validation, but handle gracefully
      console.error('[CRITICAL] Non-HD wallet detected during unlock');
      return {
        success: false,
        error: 'Invalid wallet structure detected. Please contact support.',
        code: 'NON_HD_WALLET_DETECTED'
      };
    }

    // ✅ Derive encryption key from password for imported key encryption
    const saltBuffer = new Uint8Array(
      CryptoUtils.base64ToArrayBuffer(wallet.salt) as ArrayBuffer
    );
    const encryptionKey = await CryptoUtils.deriveKey(password, saltBuffer);

    // ✅ SIMPLIFIED: Always decrypt seed phrase (HD wallet only)
    const mnemonic = await WalletStorage.unlockWallet(password);
    const seed = KeyManager.mnemonicToSeed(mnemonic);
    const hdWallet = new HDWallet(seed, 'testnet');

    // ✅ Create address generator
    const addressGenerator = new AddressGenerator('testnet');

    // ✅ Update in-memory state
    state.isUnlocked = true;
    state.decryptedSeed = mnemonic;
    state.encryptionKey = encryptionKey;
    state.hdWallet = hdWallet; // ⬅️ ALWAYS non-null for HD wallets
    state.addressGenerator = addressGenerator;
    state.lastActivity = Date.now();

    // ✅ Persist unlock session
    try {
      const encryptionKeyBuffer = await crypto.subtle.exportKey('raw', encryptionKey);
      const sessionData = {
        encryptionKey: CryptoUtils.arrayBufferToBase64(encryptionKeyBuffer),
        decryptedSeed: mnemonic,
        lastActivity: state.lastActivity,
        timestamp: Date.now()
      };
      await chrome.storage.session.set({ unlockSession: sessionData });
      console.log('Unlock session persisted to session storage');
    } catch (error) {
      console.warn('Failed to persist unlock session:', error);
    }

    // ✅ Start auto-lock timer
    startAutoLock();

    // ✅ Return wallet state
    return {
      success: true,
      data: {
        accounts: wallet.accounts,
        settings: wallet.settings,
        balance: { confirmed: 0, unconfirmed: 0 }
      }
    };
  } catch (error) {
    console.error('Failed to unlock wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to unlock wallet',
    };
  }
}
```

**Changes Summary**:
- ❌ **REMOVE**: Non-HD wallet detection (`isNonHDWallet` check)
- ❌ **REMOVE**: Non-HD wallet code path (lines 1035-1062)
- ✅ **ADD**: Validation that `encryptedSeed` is non-empty
- ✅ **ADD**: Error handling for non-HD wallet detection
- ✅ **SIMPLIFY**: Always create `hdWallet` (never `null`)
- ✅ **GUARANTEE**: `state.hdWallet` is always non-null after unlock

---

### 4.5 UPDATE: `handleImportAccountPrivateKey()`

**Current Implementation** (lines 1430-1642):
```typescript
async function handleImportAccountPrivateKey(payload: any): Promise<MessageResponse> {
  // ✅ Check if wallet is unlocked
  if (!isWalletUnlocked()) {
    return {
      success: false,
      error: 'Wallet is locked. Please unlock first.',
    };
  }

  // ... rest of implementation ...
}
```

**Proposed Changes**:
```typescript
async function handleImportAccountPrivateKey(payload: any): Promise<MessageResponse> {
  // Extract private key for cleanup
  let privateKey: string | null = null;

  try {
    // ✅ Check rate limit first (before unlocking check to prevent enumeration)
    const rateLimitCheck = checkImportRateLimit('import-private-key');
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded',
      };
    }

    // ✅ EXISTING: Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // ✅ NEW: Double-check that HD wallet exists (defensive programming)
    if (!state.hdWallet) {
      console.error('[CRITICAL] HD wallet not available during private key import');
      return {
        success: false,
        error: 'HD wallet not initialized. Please create or import a wallet first.',
        code: 'HD_WALLET_NOT_INITIALIZED'
      };
    }

    // ✅ NEW: Validate wallet structure has seed phrase
    const wallet = await WalletStorage.getWallet();
    if (!wallet.encryptedSeed || wallet.encryptedSeed.length === 0) {
      console.error('[CRITICAL] Non-HD wallet detected during account import');
      return {
        success: false,
        error: 'Cannot import private key to non-HD wallet. Please create or import an HD wallet first.',
        code: 'NON_HD_WALLET_DETECTED'
      };
    }

    // ... rest of implementation unchanged ...
  } catch (error) {
    // ... existing error handling ...
  } finally {
    // ... existing cleanup ...
  }
}
```

**Changes Summary**:
- ✅ **ADD**: Check that `state.hdWallet` is non-null
- ✅ **ADD**: Check that wallet has `encryptedSeed`
- ✅ **ADD**: Error codes for HD wallet validation failures
- ✅ **KEEP**: All existing functionality unchanged

---

### 4.6 UPDATE: `isWalletUnlocked()`

**Current Implementation** (lines 147-166):
```typescript
function isWalletUnlocked(): boolean {
  // For HD wallets: must have decryptedSeed and hdWallet
  // For non-HD wallets: must have encryptionKey (no hdWallet required)

  if (state.decryptedSeed && state.hdWallet) {
    return true; // HD wallet unlocked
  }

  if (state.encryptionKey && !state.hdWallet) {
    return true; // Non-HD wallet unlocked
  }

  return false;
}
```

**Proposed Changes**:
```typescript
/**
 * Check if wallet is unlocked
 *
 * For HD wallets (all wallets after this change):
 * - Must have decryptedSeed (mnemonic)
 * - Must have hdWallet instance
 * - Must have encryptionKey (for imported key encryption)
 *
 * @returns true if wallet is unlocked and HD wallet is initialized
 */
function isWalletUnlocked(): boolean {
  // ✅ SIMPLIFIED: HD wallet only (all three must be present)
  return !!(
    state.isUnlocked &&
    state.decryptedSeed &&
    state.hdWallet &&
    state.encryptionKey
  );
}
```

**Changes Summary**:
- ❌ **REMOVE**: Non-HD wallet check (`encryptionKey && !hdWallet`)
- ✅ **REQUIRE**: All three fields must be present
- ✅ **SIMPLIFY**: Single code path for HD wallets
- ✅ **DOCUMENT**: Clear requirements in JSDoc comment

---

### 4.7 UPDATE: `restoreUnlockSession()`

**Current Implementation** (lines 80-145):
```typescript
async function restoreUnlockSession() {
  try {
    // ... retrieve session ...

    // Check if this is a non-HD wallet
    const wallet = await WalletStorage.getWallet();
    const isNonHDWallet = wallet.encryptedSeed === '';

    let decryptedSeed: string | null = null;
    let hdWallet: HDWallet | null = null;

    if (!isNonHDWallet && session.decryptedSeed) {
      // Restore HD wallet from seed
      decryptedSeed = session.decryptedSeed;
      const seed = KeyManager.mnemonicToSeed(decryptedSeed);
      hdWallet = new HDWallet(seed, 'testnet');
    }

    // Update state
    state.hdWallet = hdWallet; // Could be null for non-HD wallets

    // ...
  } catch (error) {
    // ...
  }
}
```

**Proposed Changes**:
```typescript
/**
 * Restore unlock session from session storage
 *
 * Service workers can be terminated at any time. This function restores
 * the unlocked wallet state from chrome.storage.session, which persists
 * across service worker restarts.
 *
 * Only called for HD wallets (all wallets after this change).
 */
async function restoreUnlockSession() {
  try {
    // ✅ Retrieve session from storage
    const result = await chrome.storage.session.get('unlockSession');
    const session = result.unlockSession;

    if (!session || !session.encryptionKey || !session.decryptedSeed) {
      console.log('No valid unlock session found');
      return;
    }

    // ✅ Check if session is expired (15 minutes default)
    const wallet = await WalletStorage.getWallet();
    const autoLockMs = wallet.settings.autoLockMinutes * 60 * 1000;
    const now = Date.now();

    if (now - session.lastActivity > autoLockMs) {
      console.log('Unlock session expired');
      await chrome.storage.session.remove('unlockSession');
      return;
    }

    // ✅ NEW: Validate that wallet is HD-based
    if (!wallet.encryptedSeed || wallet.encryptedSeed.length === 0) {
      console.error('[CRITICAL] Non-HD wallet detected during session restore');
      await chrome.storage.session.remove('unlockSession');
      throw new Error('Non-HD wallet detected. Cannot restore session.');
    }

    // ✅ Import encryption key
    const encryptionKeyBuffer = CryptoUtils.base64ToArrayBuffer(session.encryptionKey);
    const encryptionKey = await crypto.subtle.importKey(
      'raw',
      encryptionKeyBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    // ✅ SIMPLIFIED: Always restore HD wallet (no non-HD check)
    const decryptedSeed = session.decryptedSeed;
    const seed = KeyManager.mnemonicToSeed(decryptedSeed);
    const hdWallet = new HDWallet(seed, 'testnet');

    // ✅ Create address generator
    const addressGenerator = new AddressGenerator('testnet');

    // ✅ Update state
    state.isUnlocked = true;
    state.decryptedSeed = decryptedSeed;
    state.encryptionKey = encryptionKey;
    state.hdWallet = hdWallet; // ⬅️ ALWAYS non-null for HD wallets
    state.addressGenerator = addressGenerator;
    state.lastActivity = session.lastActivity || Date.now();

    // ✅ Start auto-lock timer
    startAutoLock();

    console.log('Unlock session restored successfully');
  } catch (error) {
    console.error('Failed to restore unlock session:', error);
    // Clear session on error
    try {
      await chrome.storage.session.remove('unlockSession');
    } catch (cleanupError) {
      console.warn('Failed to clear session during error cleanup:', cleanupError);
    }
    throw error;
  }
}
```

**Changes Summary**:
- ❌ **REMOVE**: Non-HD wallet detection (`isNonHDWallet` check)
- ✅ **ADD**: Validation that `encryptedSeed` is non-empty
- ✅ **SIMPLIFY**: Always restore HD wallet (no conditional)
- ✅ **GUARANTEE**: `state.hdWallet` is always non-null after restore
- ✅ **IMPROVE**: Clear session on error for security

---

## 5. Storage Schema Changes

### 5.1 Update `WalletSettings` Interface

**File**: `/home/michael/code_projects/bitcoin_wallet/src/shared/types/index.ts`

**Current Definition** (lines 113-116):
```typescript
export interface WalletSettings {
  autoLockMinutes: number;
  network: 'testnet' | 'mainnet';
}
```

**Proposed Definition**:
```typescript
export interface WalletSettings {
  autoLockMinutes: number;
  network: 'testnet' | 'mainnet';
  hdWalletInitialized: boolean; // ⬅️ NEW: Always true for HD wallets, used for validation
}
```

**Benefits**:
- Explicit flag that wallet is HD-based
- Can be checked during validation
- Useful for migration detection
- Clear indicator for debugging

---

### 5.2 Update Storage Validation

**File**: `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/WalletStorage.ts`

**Current Validation** (lines 554-623):
```typescript
private static isValidStoredWallet(wallet: any): wallet is StoredWallet {
  // ... existing checks ...

  // Check non-empty encrypted fields
  const isNonHDWallet = wallet.version === 2 && wallet.encryptedSeed.length === 0;

  if (!isNonHDWallet) {
    // For HD wallets, all encryption fields must be non-empty
    if (
      wallet.encryptedSeed.length === 0 ||
      wallet.salt.length === 0 ||
      wallet.iv.length === 0
    ) {
      return false;
    }
  } else {
    // For non-HD wallets, only salt and IV must be non-empty
    if (
      wallet.salt.length === 0 ||
      wallet.iv.length === 0
    ) {
      return false;
    }
  }

  // ... rest of validation ...
}
```

**Proposed Validation**:
```typescript
/**
 * Validates StoredWallet structure
 *
 * All wallets must be HD-based with a valid seed phrase.
 * Non-HD wallets are no longer supported.
 *
 * @param wallet - Object to validate
 * @returns true if valid HD wallet, false otherwise
 */
private static isValidStoredWallet(wallet: any): wallet is StoredWallet {
  if (!wallet || typeof wallet !== 'object') {
    console.error('[WalletStorage] Validation failed: wallet is not an object');
    return false;
  }

  // Check version (support v1 and v2)
  if (wallet.version !== 1 && wallet.version !== 2) {
    console.error('[WalletStorage] Validation failed: invalid version', wallet.version);
    return false;
  }

  // ✅ NEW: Check encrypted seed fields (MUST be non-empty for HD wallets)
  if (
    typeof wallet.encryptedSeed !== 'string' ||
    typeof wallet.salt !== 'string' ||
    typeof wallet.iv !== 'string'
  ) {
    console.error('[WalletStorage] Validation failed: encryption fields are not strings');
    return false;
  }

  // ✅ NEW: Require non-empty encryptedSeed (HD wallet only)
  if (wallet.encryptedSeed.length === 0) {
    console.error('[WalletStorage] Validation failed: encryptedSeed is empty (non-HD wallet not supported)');
    return false;
  }

  // ✅ NEW: Require non-empty salt and IV
  if (wallet.salt.length === 0 || wallet.iv.length === 0) {
    console.error('[WalletStorage] Validation failed: salt or IV is empty');
    return false;
  }

  // Check accounts array
  if (!Array.isArray(wallet.accounts)) {
    console.error('[WalletStorage] Validation failed: accounts is not an array');
    return false;
  }

  // Validate each account
  for (const account of wallet.accounts) {
    if (!this.isValidAccount(account)) {
      console.error('[WalletStorage] Validation failed: invalid account', account);
      return false;
    }
  }

  // Check settings object
  if (!wallet.settings || typeof wallet.settings !== 'object') {
    console.error('[WalletStorage] Validation failed: settings is not an object');
    return false;
  }

  // Validate settings
  if (
    typeof wallet.settings.autoLockMinutes !== 'number' ||
    (wallet.settings.network !== 'testnet' &&
      wallet.settings.network !== 'mainnet')
  ) {
    console.error('[WalletStorage] Validation failed: invalid settings', wallet.settings);
    return false;
  }

  // ✅ NEW: Check hdWalletInitialized flag (warn if missing, allow for migration)
  if (typeof wallet.settings.hdWalletInitialized !== 'boolean') {
    console.warn('[WalletStorage] Validation warning: hdWalletInitialized flag is missing (legacy wallet)');
    // Don't fail validation - allow migration to add this flag
  } else if (!wallet.settings.hdWalletInitialized) {
    console.error('[WalletStorage] Validation failed: hdWalletInitialized is false');
    return false;
  }

  return true;
}
```

**Changes Summary**:
- ❌ **REMOVE**: Non-HD wallet check (`isNonHDWallet`)
- ✅ **REQUIRE**: `encryptedSeed` must be non-empty
- ✅ **CHECK**: `hdWalletInitialized` flag (warn if missing for migration)
- ✅ **IMPROVE**: Better error logging for debugging

---

### 5.3 Remove Non-HD Wallet Support from Types

**File**: `/home/michael/code_projects/bitcoin_wallet/src/shared/types/index.ts`

**Current Type Definition** (lines 98-108):
```typescript
// Wallet storage (v2 - supports multisig)
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string; // ⚠️ Can be empty string for non-HD wallets
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData }; // ⚠️ Allows imported keys
  settings: WalletSettings;
}
```

**Proposed Type Definition**:
```typescript
/**
 * Wallet storage (v2 - supports multisig and imported accounts)
 *
 * All wallets are HD-based with a seed phrase. Non-HD wallets are no longer supported.
 *
 * The `importedKeys` field stores encrypted private keys for accounts created via
 * IMPORT_ACCOUNT_PRIVATE_KEY. These are ADDITIONAL accounts, not replacements for the HD wallet.
 */
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string; // ✅ Encrypted BIP39 mnemonic (REQUIRED, cannot be empty)
  salt: string;           // ✅ PBKDF2 salt for seed encryption (REQUIRED)
  iv: string;             // ✅ AES-GCM IV for seed encryption (REQUIRED)
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData }; // ✅ Imported keys for ADDITIONAL accounts (optional)
  settings: WalletSettings;
}
```

**Changes Summary**:
- ✅ **UPDATE**: Comments to clarify HD-only support
- ✅ **DOCUMENT**: `encryptedSeed` cannot be empty
- ✅ **CLARIFY**: `importedKeys` are for additional accounts, not wallet creation

---

### 5.4 Remove `CREATE_WALLET_FROM_PRIVATE_KEY` Message Type

**File**: `/home/michael/code_projects/bitcoin_wallet/src/shared/types/index.ts`

**Current Message Types** (lines 346-354):
```typescript
export enum MessageType {
  // Wallet management
  CREATE_WALLET = 'CREATE_WALLET',
  IMPORT_WALLET = 'IMPORT_WALLET',
  CREATE_WALLET_FROM_PRIVATE_KEY = 'CREATE_WALLET_FROM_PRIVATE_KEY', // ❌ REMOVE THIS
  UNLOCK_WALLET = 'UNLOCK_WALLET',
  LOCK_WALLET = 'LOCK_WALLET',
  GET_WALLET_STATE = 'GET_WALLET_STATE',
  // ...
}
```

**Proposed Message Types**:
```typescript
export enum MessageType {
  // Wallet management
  CREATE_WALLET = 'CREATE_WALLET',                    // ✅ Create HD wallet from generated mnemonic
  IMPORT_WALLET = 'IMPORT_WALLET',                    // ✅ Import HD wallet from existing mnemonic
  // ❌ REMOVED: CREATE_WALLET_FROM_PRIVATE_KEY
  UNLOCK_WALLET = 'UNLOCK_WALLET',
  LOCK_WALLET = 'LOCK_WALLET',
  GET_WALLET_STATE = 'GET_WALLET_STATE',

  // Account management
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',                  // ✅ Create new HD-derived account
  UPDATE_ACCOUNT_NAME = 'UPDATE_ACCOUNT_NAME',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  GENERATE_ADDRESS = 'GENERATE_ADDRESS',
  IMPORT_ACCOUNT_PRIVATE_KEY = 'IMPORT_ACCOUNT_PRIVATE_KEY', // ✅ Import private key as additional account (requires HD wallet)
  IMPORT_ACCOUNT_SEED = 'IMPORT_ACCOUNT_SEED',        // ✅ Import seed phrase as additional account (requires HD wallet)
  // ...
}
```

**Changes Summary**:
- ❌ **REMOVE**: `CREATE_WALLET_FROM_PRIVATE_KEY`
- ✅ **CLARIFY**: Comments on wallet vs account operations
- ✅ **DOCUMENT**: Account imports require existing HD wallet

---

### 5.5 Remove Related Request/Response Types

**File**: `/home/michael/code_projects/bitcoin_wallet/src/shared/types/index.ts`

**Types to Remove** (lines 538-552):
```typescript
// ❌ REMOVE: Create Wallet from Private Key Request/Response
export interface CreateWalletFromPrivateKeyRequest {
  wif: string;              // Decrypted WIF string
  addressType: AddressType; // User-selected address type
  accountName?: string;     // Account name (default "Account 1")
  password: string;         // New wallet password
}

export interface CreateWalletFromPrivateKeyResponse {
  success: true;
  data: {
    account: WalletAccount;
    firstAddress: string;
  };
}
```

**Reason**: These types are only used by `handleCreateWalletFromPrivateKey()`, which is being removed.

---

## 6. Validation Logic Specifications

### 6.1 Wallet Creation Validation

**Location**: `handleCreateWallet()` and `handleImportWallet()`

**Rules**:
1. ✅ Password must be at least 8 characters
2. ✅ Mnemonic must be valid BIP39 (for import)
3. ✅ No wallet must already exist
4. ✅ Seed phrase must be non-empty
5. ✅ `hdWalletInitialized` flag must be set to `true`

**Implementation**:
```typescript
// In handleCreateWallet() and handleImportWallet()
const settings = {
  network: 'testnet' as const,
  autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
  hdWalletInitialized: true // ⬅️ REQUIRED
};

const wallet = await WalletStorage.createWallet(
  mnemonic,
  password,
  firstAccount,
  settings
);
```

---

### 6.2 Wallet Unlock Validation

**Location**: `handleUnlockWallet()` and `restoreUnlockSession()`

**Rules**:
1. ✅ Wallet must exist
2. ✅ `encryptedSeed` must be non-empty
3. ✅ Password must decrypt seed successfully
4. ✅ HD wallet must be created from seed
5. ✅ `state.hdWallet` must be non-null after unlock

**Implementation**:
```typescript
// In handleUnlockWallet()
const wallet = await WalletStorage.getWallet();

// Validate HD wallet structure
if (!wallet.encryptedSeed || wallet.encryptedSeed.length === 0) {
  console.error('[CRITICAL] Non-HD wallet detected during unlock');
  return {
    success: false,
    error: 'Invalid wallet structure detected. Please contact support.',
    code: 'NON_HD_WALLET_DETECTED'
  };
}

// Always decrypt seed and create HD wallet
const mnemonic = await WalletStorage.unlockWallet(password);
const seed = KeyManager.mnemonicToSeed(mnemonic);
const hdWallet = new HDWallet(seed, 'testnet');

// Update state (hdWallet is ALWAYS non-null)
state.hdWallet = hdWallet;
```

---

### 6.3 Account Import Validation

**Location**: `handleImportAccountPrivateKey()`

**Rules**:
1. ✅ Wallet must be unlocked
2. ✅ `state.hdWallet` must be non-null
3. ✅ Wallet must have `encryptedSeed`
4. ✅ WIF must be valid testnet key
5. ✅ Address must not already exist
6. ✅ Max 100 accounts limit

**Implementation**:
```typescript
// In handleImportAccountPrivateKey()

// Check if wallet is unlocked
if (!isWalletUnlocked()) {
  return {
    success: false,
    error: 'Wallet is locked. Please unlock first.',
  };
}

// Double-check HD wallet exists (defensive programming)
if (!state.hdWallet) {
  console.error('[CRITICAL] HD wallet not available during private key import');
  return {
    success: false,
    error: 'HD wallet not initialized. Please create or import a wallet first.',
    code: 'HD_WALLET_NOT_INITIALIZED'
  };
}

// Validate wallet structure has seed phrase
const wallet = await WalletStorage.getWallet();
if (!wallet.encryptedSeed || wallet.encryptedSeed.length === 0) {
  console.error('[CRITICAL] Non-HD wallet detected during account import');
  return {
    success: false,
    error: 'Cannot import private key to non-HD wallet. Please create or import an HD wallet first.',
    code: 'NON_HD_WALLET_DETECTED'
  };
}
```

---

### 6.4 Storage Validation

**Location**: `WalletStorage.isValidStoredWallet()`

**Rules**:
1. ✅ `version` must be 1 or 2
2. ✅ `encryptedSeed` must be non-empty string
3. ✅ `salt` must be non-empty string
4. ✅ `iv` must be non-empty string
5. ✅ `accounts` must be valid array
6. ✅ `settings` must have valid structure
7. ✅ `settings.hdWalletInitialized` should be `true` (warn if missing)

**Implementation**: See section 5.2 for full code.

---

## 7. Migration Strategy

### 7.1 Existing Non-HD Wallets

**Problem**: Users who created wallets using `CREATE_WALLET_FROM_PRIVATE_KEY` have non-HD wallets with:
- `encryptedSeed: ''` (empty string)
- Single account with imported private key
- No seed phrase backup
- Limited functionality

**Migration Options**:

#### Option A: BLOCK Non-HD Wallets (Recommended)

**Behavior**:
1. On extension load, check if wallet is non-HD
2. If non-HD wallet detected, show blocking modal
3. User must choose:
   - **Export Private Key** → Delete wallet → Import as account to new HD wallet
   - **Contact Support** → Get help with migration

**Implementation**:
```typescript
// In WalletStorage.getWallet()
static async getWallet(): Promise<StoredWallet> {
  const result = await chrome.storage.local.get(WALLET_STORAGE_KEY);
  const wallet = result[WALLET_STORAGE_KEY];

  if (!wallet) {
    throw new Error('Wallet not found. Create or import a wallet first.');
  }

  // ✅ NEW: Check for non-HD wallet
  if (wallet.encryptedSeed === '') {
    console.error('[MIGRATION] Non-HD wallet detected');
    throw new Error('NON_HD_WALLET_DETECTED');
  }

  // Validate wallet structure
  if (!this.isValidStoredWallet(wallet)) {
    throw new Error('Invalid wallet data in storage. Wallet may be corrupted.');
  }

  return wallet as StoredWallet;
}
```

**Frontend Handling**:
```typescript
// In App.tsx or wallet initialization
try {
  const wallet = await WalletStorage.getWallet();
  // Normal flow
} catch (error) {
  if (error.message === 'NON_HD_WALLET_DETECTED') {
    // Show migration modal
    setShowNonHDMigrationModal(true);
  }
}
```

**Migration Modal UI**:
```
┌─────────────────────────────────────────────────────────┐
│                    ⚠️  Wallet Upgrade Required           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Your wallet was created using an older method that     │
│ is no longer supported. To continue using this wallet, │
│ you must migrate to an HD (Hierarchical Deterministic) │
│ wallet.                                                 │
│                                                         │
│ WHAT YOU NEED TO DO:                                    │
│                                                         │
│ 1. Export your private key                             │
│ 2. Create a NEW HD wallet                              │
│ 3. Import your private key as an account               │
│                                                         │
│ ⚠️  WARNING: You will need to write down a new seed    │
│    phrase for the HD wallet. This is critical for      │
│    backup and recovery.                                │
│                                                         │
│ [Export Private Key & Start Migration]                 │
│ [Contact Support]                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Pros**:
- ✅ Forces all users to HD wallets
- ✅ Clean break from legacy code
- ✅ Clear upgrade path
- ✅ No technical debt

**Cons**:
- ❌ Requires user action
- ❌ Risk of fund loss if user ignores migration
- ❌ Support burden for confused users

---

#### Option B: Auto-Migrate to HD Wallet (Complex)

**Behavior**:
1. On extension load, detect non-HD wallet
2. Generate new HD wallet automatically
3. Import existing private key as account 0
4. Show seed phrase to user (must confirm backup)

**Implementation Complexity**: HIGH
- Need to generate mnemonic without user input
- Must force user to backup new seed phrase
- Risk of users not understanding change
- Complex state management during migration

**Recommendation**: NOT recommended due to complexity and UX concerns.

---

#### Option C: Allow Non-HD Wallets Indefinitely (Not Recommended)

**Behavior**: Keep all non-HD wallet code paths and validation logic.

**Cons**:
- ❌ Defeats the purpose of this plan
- ❌ Maintains technical debt
- ❌ Poor user experience
- ❌ Increased complexity

**Recommendation**: NOT recommended.

---

### 7.2 Recommended Migration Approach

**RECOMMENDED: Option A (Block Non-HD Wallets)**

**Timeline**:
1. **Phase 1** (Week 1): Backend changes
   - Remove `handleCreateWalletFromPrivateKey()`
   - Update validation logic
   - Add non-HD wallet detection

2. **Phase 2** (Week 2): Frontend changes
   - Remove private key import option from WalletSetup
   - Add migration modal for existing non-HD wallets
   - Update UI to show only Create/Import seed options

3. **Phase 3** (Week 3): Testing
   - Test migration flow
   - Test new wallet creation
   - Test account-level private key import
   - Verify all edge cases

4. **Phase 4** (Week 4): Release
   - Announce migration in release notes
   - Provide support documentation
   - Monitor for migration issues

**Migration Detection**:
```typescript
// Add to background/index.ts startup code
async function detectAndHandleNonHDWallet() {
  try {
    const hasWallet = await WalletStorage.hasWallet();
    if (!hasWallet) {
      return; // No wallet exists
    }

    const wallet = await WalletStorage.getWallet();

    if (wallet.encryptedSeed === '') {
      console.warn('[MIGRATION] Non-HD wallet detected - blocking wallet access');
      // Set flag in storage to show migration modal
      await chrome.storage.local.set({ needsHDMigration: true });
    }
  } catch (error) {
    console.error('[MIGRATION] Error checking wallet type:', error);
  }
}

// Call on service worker startup
chrome.runtime.onStartup.addListener(detectAndHandleNonHDWallet);
chrome.runtime.onInstalled.addListener(detectAndHandleNonHDWallet);
```

---

### 7.3 Adding `hdWalletInitialized` Flag to Existing HD Wallets

**Problem**: Existing HD wallets (created before this change) won't have the `hdWalletInitialized` flag.

**Solution**: Auto-add flag during validation if missing.

**Implementation**:
```typescript
// In WalletStorage.getWallet()
static async getWallet(): Promise<StoredWallet> {
  const result = await chrome.storage.local.get(WALLET_STORAGE_KEY);
  let wallet = result[WALLET_STORAGE_KEY];

  if (!wallet) {
    throw new Error('Wallet not found. Create or import a wallet first.');
  }

  // ✅ NEW: Check for non-HD wallet
  if (wallet.encryptedSeed === '') {
    console.error('[MIGRATION] Non-HD wallet detected');
    throw new Error('NON_HD_WALLET_DETECTED');
  }

  // ✅ NEW: Auto-migrate legacy HD wallets (add hdWalletInitialized flag)
  if (typeof wallet.settings.hdWalletInitialized !== 'boolean') {
    console.log('[MIGRATION] Adding hdWalletInitialized flag to legacy HD wallet');
    wallet.settings.hdWalletInitialized = true;

    // Save updated wallet
    await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });

    console.log('[MIGRATION] Legacy HD wallet migrated successfully');
  }

  // Validate wallet structure
  if (!this.isValidStoredWallet(wallet)) {
    throw new Error('Invalid wallet data in storage. Wallet may be corrupted.');
  }

  return wallet as StoredWallet;
}
```

**Benefits**:
- ✅ Automatic, transparent migration
- ✅ No user action required
- ✅ Happens on first load after update
- ✅ One-time operation

---

## 8. Error Messages and User Feedback

### 8.1 Error Codes

**New Error Codes**:
```typescript
export enum WalletErrorCode {
  // ... existing codes ...

  // ✅ NEW: HD Wallet enforcement errors
  NON_HD_WALLET_DETECTED = 'NON_HD_WALLET_DETECTED',
  HD_WALLET_NOT_INITIALIZED = 'HD_WALLET_NOT_INITIALIZED',
  PRIVATE_KEY_IMPORT_AT_SETUP_BLOCKED = 'PRIVATE_KEY_IMPORT_AT_SETUP_BLOCKED',
}
```

---

### 8.2 Error Messages

**Non-HD Wallet Detected**:
```typescript
{
  success: false,
  error: 'Your wallet was created using an older method that is no longer supported. Please export your private key and create a new HD wallet.',
  code: 'NON_HD_WALLET_DETECTED'
}
```

**HD Wallet Not Initialized**:
```typescript
{
  success: false,
  error: 'HD wallet not initialized. Please create or import a wallet first.',
  code: 'HD_WALLET_NOT_INITIALIZED'
}
```

**Private Key Import at Setup Blocked**:
```typescript
{
  success: false,
  error: 'Private key import is only available after creating an HD wallet. Please create or import a wallet first, then import private keys as additional accounts.',
  code: 'PRIVATE_KEY_IMPORT_AT_SETUP_BLOCKED'
}
```

---

### 8.3 User-Facing Messages

**Frontend Migration Modal**:
```typescript
// NonHDMigrationModal.tsx
const NonHDMigrationModal: React.FC = () => {
  return (
    <Modal>
      <h2>⚠️ Wallet Upgrade Required</h2>
      <p>
        Your wallet was created using an older method that is no longer supported.
        To continue using this wallet, you must migrate to an HD (Hierarchical Deterministic) wallet.
      </p>

      <h3>What you need to do:</h3>
      <ol>
        <li>Export your private key (we'll guide you through this)</li>
        <li>Create a NEW HD wallet with a seed phrase</li>
        <li>Import your private key as an account in the new wallet</li>
      </ol>

      <div className="warning">
        <strong>⚠️ IMPORTANT:</strong> You will need to write down a new 12-word seed phrase
        for the HD wallet. This is critical for backup and recovery.
      </div>

      <div className="actions">
        <button onClick={startMigration}>
          Export Private Key & Start Migration
        </button>
        <button onClick={contactSupport}>
          Contact Support
        </button>
      </div>
    </Modal>
  );
};
```

**WalletSetup Screen (Remove Private Key Import)**:
```typescript
// Before:
<Tabs>
  <Tab label="Create New" /> {/* ✅ Keep */}
  <Tab label="Import Seed" /> {/* ✅ Keep */}
  <Tab label="Import Private Key" /> {/* ❌ REMOVE THIS */}
</Tabs>

// After:
<Tabs>
  <Tab label="Create New" /> {/* ✅ Create HD wallet from generated mnemonic */}
  <Tab label="Import Seed" /> {/* ✅ Import HD wallet from existing mnemonic */}
</Tabs>

{/* Add info box */}
<InfoBox>
  <p>
    <strong>Want to import a private key?</strong><br/>
    You can import private keys as additional accounts AFTER creating or importing a wallet.
    Go to Account Management → Import Private Key.
  </p>
</InfoBox>
```

---

## 9. Testing Requirements

### 9.1 Unit Tests

**File**: `src/background/__tests__/HDWalletEnforcement.test.ts`

**Test Cases**:

```typescript
describe('HD Wallet Enforcement', () => {
  describe('Wallet Creation', () => {
    it('should create HD wallet with hdWalletInitialized flag', async () => {
      const response = await handleCreateWallet({
        password: 'testpassword123',
        addressType: 'native-segwit'
      });

      expect(response.success).toBe(true);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.encryptedSeed).not.toBe('');
      expect(wallet.settings.hdWalletInitialized).toBe(true);
    });

    it('should import HD wallet with hdWalletInitialized flag', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      const response = await handleImportWallet({
        mnemonic,
        password: 'testpassword123',
        addressType: 'native-segwit'
      });

      expect(response.success).toBe(true);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.encryptedSeed).not.toBe('');
      expect(wallet.settings.hdWalletInitialized).toBe(true);
    });

    it('should reject wallet with empty encryptedSeed', async () => {
      const invalidWallet = {
        version: 2,
        encryptedSeed: '',
        salt: 'somesalt',
        iv: 'someiv',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet',
          hdWalletInitialized: false
        }
      };

      await chrome.storage.local.set({ wallet: invalidWallet });

      await expect(WalletStorage.getWallet()).rejects.toThrow('NON_HD_WALLET_DETECTED');
    });
  });

  describe('Wallet Unlock', () => {
    it('should unlock HD wallet and set state.hdWallet', async () => {
      // Create HD wallet
      await handleCreateWallet({
        password: 'testpassword123',
        addressType: 'native-segwit'
      });

      // Lock wallet
      await handleLockWallet();
      expect(state.hdWallet).toBe(null);

      // Unlock wallet
      const response = await handleUnlockWallet({ password: 'testpassword123' });

      expect(response.success).toBe(true);
      expect(state.hdWallet).not.toBe(null);
      expect(state.decryptedSeed).not.toBe(null);
      expect(state.encryptionKey).not.toBe(null);
    });

    it('should reject non-HD wallet during unlock', async () => {
      const invalidWallet = {
        version: 2,
        encryptedSeed: '',
        salt: 'somesalt',
        iv: 'someiv',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet'
        }
      };

      await chrome.storage.local.set({ wallet: invalidWallet });

      const response = await handleUnlockWallet({ password: 'testpassword123' });

      expect(response.success).toBe(false);
      expect(response.code).toBe('NON_HD_WALLET_DETECTED');
    });
  });

  describe('Account Import', () => {
    beforeEach(async () => {
      // Create and unlock HD wallet
      await handleCreateWallet({
        password: 'testpassword123',
        addressType: 'native-segwit'
      });
    });

    it('should import private key as account when HD wallet exists', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';

      const response = await handleImportAccountPrivateKey({
        privateKey: wif,
        name: 'Imported Account'
      });

      expect(response.success).toBe(true);
      expect(response.data.account.importType).toBe('private-key');
    });

    it('should reject private key import when wallet is locked', async () => {
      await handleLockWallet();

      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';

      const response = await handleImportAccountPrivateKey({
        privateKey: wif,
        name: 'Imported Account'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('locked');
    });

    it('should reject private key import when state.hdWallet is null', async () => {
      // Manually set state.hdWallet to null (simulate corruption)
      state.hdWallet = null;

      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';

      const response = await handleImportAccountPrivateKey({
        privateKey: wif,
        name: 'Imported Account'
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('HD_WALLET_NOT_INITIALIZED');
    });
  });

  describe('Storage Validation', () => {
    it('should validate HD wallet with all required fields', () => {
      const validWallet = {
        version: 2,
        encryptedSeed: 'encrypted_seed_here',
        salt: 'salt_here',
        iv: 'iv_here',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet',
          hdWalletInitialized: true
        }
      };

      expect(WalletStorage['isValidStoredWallet'](validWallet)).toBe(true);
    });

    it('should reject wallet with empty encryptedSeed', () => {
      const invalidWallet = {
        version: 2,
        encryptedSeed: '',
        salt: 'salt_here',
        iv: 'iv_here',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet',
          hdWalletInitialized: false
        }
      };

      expect(WalletStorage['isValidStoredWallet'](invalidWallet)).toBe(false);
    });

    it('should warn about missing hdWalletInitialized flag but still validate', () => {
      const legacyWallet = {
        version: 2,
        encryptedSeed: 'encrypted_seed_here',
        salt: 'salt_here',
        iv: 'iv_here',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet'
          // hdWalletInitialized missing (legacy wallet)
        }
      };

      const consoleSpy = jest.spyOn(console, 'warn');
      expect(WalletStorage['isValidStoredWallet'](legacyWallet)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('hdWalletInitialized flag is missing')
      );
    });
  });

  describe('Migration', () => {
    it('should auto-add hdWalletInitialized flag to legacy HD wallets', async () => {
      // Create legacy HD wallet without hdWalletInitialized flag
      const legacyWallet = {
        version: 2,
        encryptedSeed: 'encrypted_seed_here',
        salt: 'salt_here',
        iv: 'iv_here',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet'
        }
      };

      await chrome.storage.local.set({ wallet: legacyWallet });

      const wallet = await WalletStorage.getWallet();

      expect(wallet.settings.hdWalletInitialized).toBe(true);
    });

    it('should detect non-HD wallet and throw error', async () => {
      const nonHDWallet = {
        version: 2,
        encryptedSeed: '',
        salt: 'salt_here',
        iv: 'iv_here',
        accounts: [],
        pendingMultisigTxs: [],
        importedKeys: {
          0: {
            encryptedData: 'encrypted_wif',
            salt: 'wif_salt',
            iv: 'wif_iv',
            type: 'private-key'
          }
        },
        settings: {
          autoLockMinutes: 15,
          network: 'testnet'
        }
      };

      await chrome.storage.local.set({ wallet: nonHDWallet });

      await expect(WalletStorage.getWallet()).rejects.toThrow('NON_HD_WALLET_DETECTED');
    });
  });

  describe('isWalletUnlocked()', () => {
    it('should return true when HD wallet is unlocked', async () => {
      await handleCreateWallet({
        password: 'testpassword123',
        addressType: 'native-segwit'
      });

      expect(isWalletUnlocked()).toBe(true);
      expect(state.hdWallet).not.toBe(null);
    });

    it('should return false when wallet is locked', async () => {
      await handleCreateWallet({
        password: 'testpassword123',
        addressType: 'native-segwit'
      });

      await handleLockWallet();

      expect(isWalletUnlocked()).toBe(false);
      expect(state.hdWallet).toBe(null);
    });

    it('should return false when any required field is missing', () => {
      state.isUnlocked = true;
      state.decryptedSeed = 'mnemonic';
      state.hdWallet = null; // Missing
      state.encryptionKey = {} as CryptoKey;

      expect(isWalletUnlocked()).toBe(false);
    });
  });
});
```

---

### 9.2 Integration Tests

**File**: `src/__tests__/integration/HDWalletEnforcement.integration.test.ts`

**Test Cases**:

```typescript
describe('HD Wallet Enforcement Integration Tests', () => {
  describe('Wallet Creation Flow', () => {
    it('should create HD wallet and unlock successfully', async () => {
      // 1. Create wallet
      const createResponse = await chrome.runtime.sendMessage({
        type: MessageType.CREATE_WALLET,
        payload: {
          password: 'testpassword123',
          addressType: 'native-segwit'
        }
      });

      expect(createResponse.success).toBe(true);
      expect(createResponse.data.mnemonic).toBeDefined();

      // 2. Lock wallet
      await chrome.runtime.sendMessage({ type: MessageType.LOCK_WALLET });

      // 3. Unlock wallet
      const unlockResponse = await chrome.runtime.sendMessage({
        type: MessageType.UNLOCK_WALLET,
        payload: { password: 'testpassword123' }
      });

      expect(unlockResponse.success).toBe(true);

      // 4. Verify wallet state
      const stateResponse = await chrome.runtime.sendMessage({
        type: MessageType.GET_WALLET_STATE
      });

      expect(stateResponse.data.isUnlocked).toBe(true);
      expect(stateResponse.data.accounts).toHaveLength(1);
    });

    it('should import HD wallet and unlock successfully', async () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      // 1. Import wallet
      const importResponse = await chrome.runtime.sendMessage({
        type: MessageType.IMPORT_WALLET,
        payload: {
          mnemonic,
          password: 'testpassword123',
          addressType: 'native-segwit'
        }
      });

      expect(importResponse.success).toBe(true);

      // 2. Verify wallet state
      const stateResponse = await chrome.runtime.sendMessage({
        type: MessageType.GET_WALLET_STATE
      });

      expect(stateResponse.data.isUnlocked).toBe(true);
      expect(stateResponse.data.accounts).toHaveLength(1);
    });
  });

  describe('Account Import Flow', () => {
    beforeEach(async () => {
      // Create HD wallet
      await chrome.runtime.sendMessage({
        type: MessageType.CREATE_WALLET,
        payload: {
          password: 'testpassword123',
          addressType: 'native-segwit'
        }
      });
    });

    it('should import private key as account after HD wallet creation', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';

      const response = await chrome.runtime.sendMessage({
        type: MessageType.IMPORT_ACCOUNT_PRIVATE_KEY,
        payload: {
          privateKey: wif,
          name: 'Imported Account'
        }
      });

      expect(response.success).toBe(true);
      expect(response.data.account.importType).toBe('private-key');

      // Verify account was added
      const stateResponse = await chrome.runtime.sendMessage({
        type: MessageType.GET_WALLET_STATE
      });

      expect(stateResponse.data.accounts).toHaveLength(2);
    });
  });

  describe('Migration Detection', () => {
    it('should detect and block non-HD wallet', async () => {
      // Manually create non-HD wallet in storage
      const nonHDWallet = {
        version: 2,
        encryptedSeed: '',
        salt: 'salt_here',
        iv: 'iv_here',
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet'
        }
      };

      await chrome.storage.local.set({ wallet: nonHDWallet });

      // Try to unlock
      const response = await chrome.runtime.sendMessage({
        type: MessageType.UNLOCK_WALLET,
        payload: { password: 'testpassword123' }
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe('NON_HD_WALLET_DETECTED');
    });

    it('should auto-migrate legacy HD wallet', async () => {
      // Create legacy HD wallet without hdWalletInitialized flag
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const password = 'testpassword123';

      // Manually create wallet without hdWalletInitialized
      const encryptionResult = await CryptoUtils.encrypt(mnemonic, password);
      const legacyWallet = {
        version: 2,
        encryptedSeed: encryptionResult.encryptedData,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        accounts: [],
        pendingMultisigTxs: [],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet'
          // No hdWalletInitialized flag
        }
      };

      await chrome.storage.local.set({ wallet: legacyWallet });

      // Get wallet (should auto-migrate)
      const response = await chrome.runtime.sendMessage({
        type: MessageType.GET_WALLET_STATE
      });

      // Retrieve wallet to verify migration
      const wallet = await WalletStorage.getWallet();
      expect(wallet.settings.hdWalletInitialized).toBe(true);
    });
  });
});
```

---

### 9.3 Manual Testing Checklist

**Wallet Creation**:
- [ ] Create new HD wallet with password
- [ ] Verify seed phrase is displayed
- [ ] Lock and unlock wallet successfully
- [ ] Verify `state.hdWallet` is non-null after unlock
- [ ] Verify `settings.hdWalletInitialized` is `true`

**Wallet Import**:
- [ ] Import wallet from 12-word seed phrase
- [ ] Import wallet from 24-word seed phrase
- [ ] Lock and unlock wallet successfully
- [ ] Verify `state.hdWallet` is non-null after unlock
- [ ] Verify `settings.hdWalletInitialized` is `true`

**Account Import**:
- [ ] Create HD wallet
- [ ] Import private key as account
- [ ] Verify account is created with `importType: 'private-key'`
- [ ] Verify imported key is stored in `importedKeys` map
- [ ] Sign transaction with imported account

**Non-HD Wallet Detection**:
- [ ] Manually create non-HD wallet in storage
- [ ] Verify error on unlock attempt
- [ ] Verify migration modal is shown (frontend)
- [ ] Export private key from non-HD wallet
- [ ] Create new HD wallet
- [ ] Import private key as account in new wallet

**Migration**:
- [ ] Create legacy HD wallet (no `hdWalletInitialized` flag)
- [ ] Load wallet
- [ ] Verify flag is auto-added
- [ ] Verify wallet works normally

**Error Handling**:
- [ ] Attempt private key import when wallet is locked → Error
- [ ] Attempt private key import when `state.hdWallet` is null → Error
- [ ] Attempt to unlock non-HD wallet → Error
- [ ] Attempt to create wallet with empty seed → Validation error

---

## 10. Implementation Checklist

### 10.1 Backend Changes

**Phase 1: Remove Non-HD Wallet Support**
- [ ] Delete `handleCreateWalletFromPrivateKey()` function (lines 850-998)
- [ ] Remove `CREATE_WALLET_FROM_PRIVATE_KEY` message handler case
- [ ] Remove `CREATE_WALLET_FROM_PRIVATE_KEY` from `MessageType` enum
- [ ] Remove `CreateWalletFromPrivateKeyRequest` type
- [ ] Remove `CreateWalletFromPrivateKeyResponse` type

**Phase 2: Update Wallet Creation Handlers**
- [ ] Update `handleCreateWallet()` to add `hdWalletInitialized: true` to settings
- [ ] Update `handleImportWallet()` to add `hdWalletInitialized: true` to settings
- [ ] Add validation for `encryptedSeed` non-empty in both handlers

**Phase 3: Update Unlock Logic**
- [ ] Update `handleUnlockWallet()` to remove non-HD wallet code path
- [ ] Add validation that `encryptedSeed` is non-empty
- [ ] Add error handling for non-HD wallet detection
- [ ] Ensure `state.hdWallet` is always non-null after successful unlock

**Phase 4: Update Session Restore**
- [ ] Update `restoreUnlockSession()` to remove non-HD wallet code path
- [ ] Add validation that `encryptedSeed` is non-empty
- [ ] Ensure `state.hdWallet` is always non-null after restore

**Phase 5: Update Helper Functions**
- [ ] Update `isWalletUnlocked()` to remove non-HD wallet check
- [ ] Require all three fields: `decryptedSeed`, `hdWallet`, `encryptionKey`

**Phase 6: Update Account Import**
- [ ] Update `handleImportAccountPrivateKey()` to check `state.hdWallet` is non-null
- [ ] Add validation that wallet has `encryptedSeed`
- [ ] Add error codes for HD wallet validation failures

**Phase 7: Storage Layer Changes**
- [ ] Update `WalletSettings` interface to include `hdWalletInitialized` flag
- [ ] Update `WalletStorage.isValidStoredWallet()` to reject empty `encryptedSeed`
- [ ] Add check for `hdWalletInitialized` flag (warn if missing)
- [ ] Update `StoredWalletV2` comments to clarify HD-only support

**Phase 8: Migration Support**
- [ ] Add non-HD wallet detection in `WalletStorage.getWallet()`
- [ ] Throw `NON_HD_WALLET_DETECTED` error for non-HD wallets
- [ ] Add auto-migration for legacy HD wallets (add `hdWalletInitialized` flag)
- [ ] Add startup detection for non-HD wallets

**Phase 9: Error Handling**
- [ ] Add `NON_HD_WALLET_DETECTED` error code
- [ ] Add `HD_WALLET_NOT_INITIALIZED` error code
- [ ] Add user-friendly error messages
- [ ] Update error response types

---

### 10.2 Testing Tasks

**Unit Tests**:
- [ ] Write tests for wallet creation with `hdWalletInitialized` flag
- [ ] Write tests for wallet import with `hdWalletInitialized` flag
- [ ] Write tests for unlock validation (reject empty `encryptedSeed`)
- [ ] Write tests for account import validation (require HD wallet)
- [ ] Write tests for storage validation (reject non-HD wallets)
- [ ] Write tests for migration (auto-add flag to legacy HD wallets)
- [ ] Write tests for `isWalletUnlocked()` (require all fields)

**Integration Tests**:
- [ ] Write integration test for full wallet creation flow
- [ ] Write integration test for full wallet import flow
- [ ] Write integration test for account import flow
- [ ] Write integration test for non-HD wallet detection
- [ ] Write integration test for legacy HD wallet migration

**Manual Tests**:
- [ ] Test wallet creation and unlock
- [ ] Test wallet import and unlock
- [ ] Test account-level private key import
- [ ] Test non-HD wallet detection and error
- [ ] Test migration flow for legacy HD wallets
- [ ] Test error handling for edge cases

---

### 10.3 Documentation Tasks

- [ ] Update `ARCHITECTURE.md` to reflect HD-only wallet structure
- [ ] Update `CHANGELOG.md` with migration notice
- [ ] Update `README.md` with wallet creation instructions
- [ ] Update backend-developer-notes.md with changes
- [ ] Update security-expert-notes.md with validation changes
- [ ] Create migration guide for users with non-HD wallets
- [ ] Update API documentation for removed message types

---

### 10.4 Frontend Tasks (Separate Plan Required)

**Note**: These tasks require a separate frontend implementation plan.

- [ ] Remove private key import option from WalletSetup screen
- [ ] Update WalletSetup to show only Create/Import seed options
- [ ] Add info box explaining account-level private key import
- [ ] Create migration modal for non-HD wallet users
- [ ] Add migration flow (export → create → import)
- [ ] Update error handling for new error codes
- [ ] Update tests for removed functionality

---

---

## Section 10: Backup Restoration During Initial Setup

### 10.1 Current Implementation Analysis

**Handler Location**: `/home/michael/code_projects/bitcoin_wallet/src/background/index.ts`
**Handler Function**: `handleImportWalletBackup()` (lines 5607-5676)
**Backup Module**: `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/BackupManager.ts`

#### Handler Flow

```typescript
async function handleImportWalletBackup(payload: any): Promise<MessageResponse> {
  // 1. Validate payload (backupFile, backupPassword required)

  // 2. If replacing existing wallet (replaceExisting: true):
  //    - Check wallet is unlocked
  //    - Verify wallet password before destructive operation

  // 3. Call BackupManager.importWallet()

  // 4. Lock wallet after import (for security)

  // 5. Return result
}
```

#### BackupManager.importWallet() Flow

**File**: `BackupManager.ts` (lines 400-524)

```typescript
static async importWallet(
  backupFile: EncryptedBackupFile,
  backupPassword: string,
  onProgress?: ProgressCallback
): Promise<ImportResult> {
  // Step 1: Validate file structure (0-10%)
  // Step 2: Verify checksum (11-20%)
  // Step 3: Derive decryption key (21-40%)
  // Step 4: Decrypt payload (41-50%)
  // Step 5: Validate decrypted data (51-60%)

  // Step 6: Delete existing wallet if any (61-80%)
  const hasExistingWallet = await WalletStorage.hasWallet();
  if (hasExistingWallet) {
    await WalletStorage.deleteWallet(); // ⬅️ KEY LINE
  }

  // Step 7: Restore wallet data (61-80%)
  await chrome.storage.local.set({ wallet: restoredWallet });

  // Step 8: Restore contacts (81-95%)
  await chrome.storage.local.set({ contacts: payload.contacts });

  // Step 9: Return result
}
```

### 10.2 Compatibility with Initial Setup

**VERDICT: ✅ FULLY COMPATIBLE** - The handler is already designed to work during initial setup.

#### Key Design Features

1. **No Wallet Existence Check**
   - `BackupManager.importWallet()` does NOT require an existing wallet
   - It checks if a wallet exists: `await WalletStorage.hasWallet()`
   - If wallet exists → deletes it first
   - If no wallet exists → proceeds directly to restoration

2. **Optional Replace Mode**
   - `replaceExisting` flag controls safety checks in handler
   - When `replaceExisting: false` (initial setup):
     - No wallet unlock check
     - No wallet password verification
     - Directly calls `BackupManager.importWallet()`
   - When `replaceExisting: true` (replace existing):
     - Requires unlocked wallet
     - Verifies wallet password
     - Then calls `BackupManager.importWallet()`

3. **Self-Contained Restoration**
   - `BackupManager.importWallet()` writes directly to chrome.storage.local
   - Does not depend on `state.hdWallet` or any in-memory state
   - Creates complete wallet structure from backup payload

4. **Backup File Format**
   - Contains complete wallet data:
     - Encrypted seed phrase (encrypted with wallet password)
     - All accounts (single-sig and multisig) with complete state
     - All contacts (encrypted with wallet password)
     - Wallet settings
     - Imported keys (if any)
     - Pending multisig transactions (if any)
   - Two-layer encryption:
     - Inner layer: Wallet password (existing encryption)
     - Outer layer: Backup password (600K PBKDF2)

### 10.3 Required Modifications

**ANSWER: NO MODIFICATIONS NEEDED** ✅

The handler is already designed to work in both scenarios:

| Scenario | `replaceExisting` | Wallet Exists? | Handler Behavior |
|----------|-------------------|----------------|------------------|
| **Initial Setup** | `false` | No | Skip unlock check → Import backup → Done |
| **Replace Wallet** | `true` | Yes | Verify unlock → Verify password → Import backup → Done |

### 10.4 Current Usage Example

#### Initial Setup (No Wallet Exists)

```typescript
// Frontend call during WalletSetup screen
const response = await chrome.runtime.sendMessage({
  type: MessageType.IMPORT_WALLET_BACKUP,
  payload: {
    backupFile: encryptedBackupFile,  // EncryptedBackupFile object
    backupPassword: 'user_backup_password',
    replaceExisting: false,           // ⬅️ Initial setup mode
    onProgress: (progress, step) => {
      console.log(`${progress}%: ${step}`);
    }
  }
});

// Result:
// - Backup is decrypted and validated
// - Wallet is created in storage
// - Contacts are restored
// - User must unlock wallet with wallet password (not backup password)
```

#### Replace Existing Wallet

```typescript
// Frontend call from Settings screen
const response = await chrome.runtime.sendMessage({
  type: MessageType.IMPORT_WALLET_BACKUP,
  payload: {
    backupFile: encryptedBackupFile,
    backupPassword: 'user_backup_password',
    walletPassword: 'current_wallet_password', // ⬅️ Required for verification
    replaceExisting: true,                      // ⬅️ Replace mode
    onProgress: (progress, step) => {
      console.log(`${progress}%: ${step}`);
    }
  }
});

// Result:
// - Current wallet password is verified
// - Existing wallet is deleted
// - Backup is imported
// - Wallet is locked (user must unlock)
```

### 10.5 Security Considerations

#### Rate Limiting

**Current Status**: ❌ NOT IMPLEMENTED

**Recommendation**: Add rate limiting to prevent brute-force attacks on backup password.

```typescript
// Add to index.ts
const backupImportAttempts: number[] = [];
const BACKUP_IMPORT_RATE_LIMIT = 5;
const BACKUP_IMPORT_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes

async function handleImportWalletBackup(payload: any): Promise<MessageResponse> {
  // ✅ NEW: Rate limiting check
  const now = Date.now();
  const recentAttempts = backupImportAttempts.filter(
    time => now - time < BACKUP_IMPORT_RATE_WINDOW
  );

  if (recentAttempts.length >= BACKUP_IMPORT_RATE_LIMIT) {
    return {
      success: false,
      error: `Too many backup import attempts. Please wait ${Math.ceil(BACKUP_IMPORT_RATE_WINDOW / 60000)} minutes.`,
      code: 'RATE_LIMIT_EXCEEDED'
    };
  }

  // Record attempt
  backupImportAttempts.push(now);
  // Clean old attempts
  backupImportAttempts.splice(0, backupImportAttempts.length - recentAttempts.length - 1);

  // ... existing implementation ...
}
```

#### Memory Safety

**Current Status**: ✅ IMPLEMENTED

- `BackupManager.importWallet()` clears sensitive data:
  ```typescript
  // Step 9: Clear sensitive data from memory
  CryptoUtils.clearSensitiveData(decryptedJSON);
  ```
- Wallet is locked after import:
  ```typescript
  // 5. Lock wallet after import (for security)
  await lockWallet();
  ```

#### Validation

**Current Status**: ✅ COMPREHENSIVE

The backup restoration process includes:
1. ✅ File structure validation (magic bytes, version, network)
2. ✅ Checksum verification (SHA-256 of encrypted data)
3. ✅ Decryption with backup password (600K PBKDF2)
4. ✅ Payload structure validation (wallet, contacts, metadata)
5. ✅ Network consistency validation (header vs payload)
6. ✅ Address validation (all addresses match network)
7. ✅ WIF validation (all imported keys match network)

### 10.6 Integration with HD Wallet Enforcement

#### Compatibility Check

**Question**: Does backup restoration create HD wallets?

**Answer**: ✅ YES - Backups always contain HD wallets (after enforcement)

**Reasoning**:
1. Backup is created from existing wallet structure
2. After HD enforcement, all wallets have `encryptedSeed` (non-empty)
3. Backup payload includes:
   ```typescript
   wallet: {
     encryptedSeed: string;  // ✅ Always present (HD wallet seed)
     accounts: WalletAccount[];
     settings: WalletSettings; // ✅ Includes hdWalletInitialized flag
     // ...
   }
   ```
4. Restored wallet is validated by `WalletStorage.isValidStoredWallet()`
5. Validation rejects wallets with empty `encryptedSeed`

#### Migration Path

**Scenario**: User has a backup created BEFORE HD enforcement (non-HD wallet backup)

**Behavior**:
1. User attempts to restore backup during initial setup
2. Backup file is valid (passes structure validation)
3. Backup is decrypted successfully
4. `BackupManager.importWallet()` writes wallet to storage
5. Wallet validation fails (empty `encryptedSeed`)
6. Error is thrown: `NON_HD_WALLET_DETECTED`

**Recommendation**: Add backup version check to detect legacy backups.

```typescript
// Add to BackupManager.importWallet()
async importWallet(...): Promise<ImportResult> {
  // ... existing validation ...

  // ✅ NEW: Check if backup contains HD wallet
  if (!payload.wallet.encryptedSeed || payload.wallet.encryptedSeed.length === 0) {
    throw new Error(
      'This backup was created with an older version and cannot be restored. ' +
      'Please export the private key from the old wallet and import it as an account in a new HD wallet.'
    );
  }

  // ... rest of implementation ...
}
```

### 10.7 Testing Requirements

#### Unit Tests

**File**: `src/background/wallet/__tests__/BackupManager.test.ts`

```typescript
describe('BackupManager - Initial Setup', () => {
  it('should restore backup when no wallet exists', async () => {
    // Ensure no wallet exists
    await WalletStorage.deleteWallet();

    // Create backup file
    const backupFile = createTestBackupFile();

    // Import backup
    const result = await BackupManager.importWallet(
      backupFile,
      'backup_password'
    );

    expect(result.success).toBe(true);
    expect(result.accountCount).toBeGreaterThan(0);

    // Verify wallet was created
    const wallet = await WalletStorage.getWallet();
    expect(wallet.encryptedSeed).not.toBe('');
    expect(wallet.settings.hdWalletInitialized).toBe(true);
  });

  it('should reject non-HD wallet backup', async () => {
    // Create backup with empty encryptedSeed
    const legacyBackup = createLegacyBackupFile(); // encryptedSeed: ''

    await expect(
      BackupManager.importWallet(legacyBackup, 'backup_password')
    ).rejects.toThrow('older version');
  });
});
```

#### Integration Tests

**File**: `src/__tests__/integration/BackupRestoration.integration.test.ts`

```typescript
describe('Backup Restoration - Initial Setup', () => {
  it('should restore backup during initial wallet setup', async () => {
    // 1. Delete any existing wallet
    await WalletStorage.deleteWallet();

    // 2. Create backup file
    const backupFile = createTestBackupFile();

    // 3. Call handler (replaceExisting: false)
    const response = await chrome.runtime.sendMessage({
      type: MessageType.IMPORT_WALLET_BACKUP,
      payload: {
        backupFile,
        backupPassword: 'backup_password',
        replaceExisting: false
      }
    });

    // 4. Verify success
    expect(response.success).toBe(true);
    expect(response.data.accountCount).toBeGreaterThan(0);

    // 5. Verify wallet state
    const state = await chrome.runtime.sendMessage({
      type: MessageType.GET_WALLET_STATE
    });

    expect(state.data.isInitialized).toBe(true);
    expect(state.data.isLocked).toBe(true); // Locked after import
  });

  it('should require unlock after backup restoration', async () => {
    // ... import backup ...

    // Wallet should be locked
    const state1 = await chrome.runtime.sendMessage({
      type: MessageType.GET_WALLET_STATE
    });
    expect(state1.data.isLocked).toBe(true);

    // Unlock with wallet password (NOT backup password)
    const unlockResponse = await chrome.runtime.sendMessage({
      type: MessageType.UNLOCK_WALLET,
      payload: { password: 'wallet_password' } // From backup
    });

    expect(unlockResponse.success).toBe(true);
  });
});
```

#### Manual Testing Checklist

**Initial Setup**:
- [ ] Delete wallet from extension
- [ ] Open WalletSetup screen
- [ ] Select "Restore from Backup" option (if implemented)
- [ ] Upload encrypted backup file
- [ ] Enter backup password
- [ ] Verify restoration progress is shown
- [ ] Verify success message
- [ ] Verify wallet is locked after restoration
- [ ] Unlock wallet with wallet password (not backup password)
- [ ] Verify accounts are restored correctly
- [ ] Verify contacts are restored correctly
- [ ] Verify transactions are visible
- [ ] Send a test transaction to verify wallet works

**Replace Existing Wallet**:
- [ ] Create or import a wallet
- [ ] Unlock wallet
- [ ] Go to Settings → Backup & Restore
- [ ] Select "Restore from Backup"
- [ ] Upload backup file
- [ ] Enter current wallet password for verification
- [ ] Enter backup password
- [ ] Confirm replacement warning
- [ ] Verify restoration succeeds
- [ ] Verify wallet is locked after restoration
- [ ] Unlock wallet
- [ ] Verify wallet was replaced (different accounts)

**Rate Limiting** (if implemented):
- [ ] Attempt to restore backup with wrong password 5 times
- [ ] Verify 6th attempt is blocked with rate limit error
- [ ] Wait 15 minutes
- [ ] Verify can attempt again

**Legacy Backup** (if check implemented):
- [ ] Create backup file with empty `encryptedSeed`
- [ ] Attempt to restore backup
- [ ] Verify clear error message about legacy backup
- [ ] Verify instructions to export private key instead

### 10.8 Documentation Requirements

#### User Documentation

**Location**: `README.md` or help documentation

```markdown
## Restoring Wallet from Backup

### During Initial Setup

You can restore your wallet from a backup file during initial setup:

1. Open the extension and click "Restore from Backup"
2. Select your encrypted backup file (.dat or .json)
3. Enter your backup password (NOT your wallet password)
4. Wait for restoration to complete
5. Unlock your wallet using your wallet password (from the backup)

**IMPORTANT**:
- The backup password is used to decrypt the backup file
- Your wallet password (inside the backup) is used to unlock the wallet
- These are two different passwords

### Replacing Existing Wallet

To replace your current wallet with a backup:

1. Unlock your current wallet
2. Go to Settings → Backup & Restore
3. Click "Restore from Backup"
4. Enter your current wallet password (for verification)
5. Select your backup file
6. Enter your backup password
7. Confirm replacement

**WARNING**: This will delete your current wallet and replace it with the backup.
Make sure you have backed up your current wallet before proceeding.
```

#### Technical Documentation

**Location**: `prompts/docs/backend-developer-notes.md`

Add section:

```markdown
## Wallet Backup Restoration

### IMPORT_WALLET_BACKUP Handler

**Purpose**: Import and restore complete wallet from encrypted backup file.

**Handler**: `handleImportWalletBackup()` (src/background/index.ts)
**Backup Module**: `BackupManager.importWallet()` (src/background/wallet/BackupManager.ts)

**Supports Two Modes**:
1. **Initial Setup** (`replaceExisting: false`)
   - No wallet exists
   - No unlock check
   - No wallet password verification
   - Directly imports backup

2. **Replace Existing** (`replaceExisting: true`)
   - Wallet exists and is unlocked
   - Verifies current wallet password
   - Deletes existing wallet
   - Imports backup

**Payload**:
```typescript
{
  backupFile: EncryptedBackupFile;
  backupPassword: string;
  walletPassword?: string;        // Required only if replaceExisting: true
  replaceExisting: boolean;
  onProgress?: (progress, step) => void;
}
```

**Security Features**:
- Two-layer encryption (wallet password + backup password)
- Checksum verification (SHA-256)
- Structure validation before decryption
- Rate limiting (recommended: 5 attempts per 15 minutes)
- Memory safety (clears sensitive data after import)
- Wallet locked after import

**Compatibility**: Fully compatible with initial wallet setup (no modifications needed).
```

### 10.9 Summary

**Key Findings**:

1. ✅ **Already Compatible**: The handler works perfectly during initial setup
2. ✅ **No Changes Needed**: Implementation is correct as-is
3. ✅ **Security**: Comprehensive validation and encryption
4. ⚠️ **Rate Limiting**: Should be added (recommended)
5. ⚠️ **Legacy Backups**: Should add version check for non-HD wallet backups

**Recommendations**:

1. **Add Rate Limiting** (HIGH PRIORITY)
   - Prevent brute-force attacks on backup password
   - 5 attempts per 15 minutes
   - Simple implementation (similar to existing rate limits)

2. **Add Legacy Backup Detection** (MEDIUM PRIORITY)
   - Check if `payload.wallet.encryptedSeed` is empty
   - Throw clear error with migration instructions
   - Prevents confusing validation errors

3. **Update Documentation** (LOW PRIORITY)
   - Add user guide for backup restoration
   - Update technical docs with backup restore flow
   - Add testing documentation

4. **Frontend Integration** (SEPARATE PLAN)
   - Add "Restore from Backup" option to WalletSetup screen
   - Implement file upload and progress tracking
   - Handle errors gracefully

---

## Conclusion

This plan provides a comprehensive, implementation-ready roadmap for enforcing HD-only wallet creation in the Bitcoin wallet extension. The key changes are:

1. **Remove** `handleCreateWalletFromPrivateKey()` handler
2. **Update** wallet creation handlers to set `hdWalletInitialized: true`
3. **Simplify** unlock logic by removing non-HD wallet code paths
4. **Add** validation to reject non-HD wallets
5. **Implement** auto-migration for legacy HD wallets
6. **Provide** clear migration path for existing non-HD wallet users
7. **✅ VERIFIED**: Backup restoration already supports initial setup (no changes needed)

The migration strategy balances user experience with technical cleanliness by:
- Blocking non-HD wallets with clear error messages
- Auto-migrating legacy HD wallets transparently
- Providing guided migration flow for non-HD wallet users
- Supporting backup restoration during initial setup (already works)

All changes maintain backwards compatibility for HD wallets while preventing new non-HD wallet creation.
