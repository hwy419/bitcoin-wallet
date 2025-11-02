# Wallet Restore from Private Key - Backend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-22
**Target Release**: v0.11.0
**Status**: Implementation Ready
**Document Type**: Technical Implementation Guide

---

## Executive Summary

This document provides a complete, implementation-ready backend plan for restoring a wallet from a private key backup (WIF format) during initial wallet setup. This addresses a critical recovery gap where users who exported their private keys cannot restore their wallet without a seed phrase.

**What Changed**: Users can now create a **non-HD wallet** from a private key, enabling recovery from exported keys alone.

**Backend Scope**:
1. New message handler: `CREATE_WALLET_FROM_PRIVATE_KEY`
2. Non-HD wallet structure support
3. Enhanced WIFManager methods
4. Conditional transaction signing logic
5. Wallet structure validation
6. Rate limiting for wallet creation

**Key Technical Decisions** (from Blockchain Expert Review):
- ✅ Use empty string `''` for `encryptedSeed` (non-HD wallet sentinel)
- ✅ Reuse same address for change (acceptable privacy tradeoff for MVP)
- ✅ Require user to select address type (cannot auto-detect)
- ✅ Implement wallet structure validation
- ✅ Support both HD and non-HD wallets in same codebase

**Security Considerations** (from Security Expert):
- ✅ Same encryption method as HD wallets (PBKDF2 + AES-256-GCM)
- ✅ Rate limiting on wallet creation (3 attempts per 15 minutes)
- ✅ Clear private keys from memory immediately after use
- ✅ Validate wallet structure on unlock

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Message Handler Implementation](#2-message-handler-implementation)
3. [Non-HD Wallet Structure](#3-non-hd-wallet-structure)
4. [WIFManager Enhancements](#4-wifmanager-enhancements)
5. [Wallet Structure Validation](#5-wallet-structure-validation)
6. [Transaction Signing - Conditional Logic](#6-transaction-signing---conditional-logic)
7. [Change Address Handling](#7-change-address-handling)
8. [Account Creation Restrictions](#8-account-creation-restrictions)
9. [Storage Schema Documentation](#9-storage-schema-documentation)
10. [Rate Limiting Implementation](#10-rate-limiting-implementation)
11. [Error Handling and Codes](#11-error-handling-and-codes)
12. [Migration Support](#12-migration-support)
13. [Testing Requirements](#13-testing-requirements)
14. [Security Checklist](#14-security-checklist)
15. [Integration Points](#15-integration-points)

---

## 1. Architecture Overview

### 1.1 Conceptual Architecture

**Non-HD Wallet vs HD Wallet:**

```
HD Wallet:
┌──────────────────────────────────┐
│ Encrypted Seed (BIP39 mnemonic)  │  ← Derives all keys
├──────────────────────────────────┤
│ HD Wallet (BIP32)                │
│   ├─ Account 0                   │
│   │   ├─ Address 0               │
│   │   ├─ Address 1               │
│   │   └─ ...                     │
│   ├─ Account 1                   │
│   └─ ...                         │
└──────────────────────────────────┘

Non-HD Wallet:
┌──────────────────────────────────┐
│ Encrypted Seed = '' (EMPTY)      │  ← No seed phrase
├──────────────────────────────────┤
│ Imported Keys:                   │
│   [0]: Encrypted WIF             │  ← Single private key
├──────────────────────────────────┤
│ Account 0                        │
│   └─ Single Address              │  ← Cannot derive more
└──────────────────────────────────┘
```

### 1.2 Data Flow

**Wallet Creation from Private Key:**

```
User provides WIF
      ↓
Validate WIF format & network
      ↓
User selects address type
      ↓
Generate first address
      ↓
Encrypt WIF with wallet password
      ↓
Create non-HD wallet structure
      ↓
Store to chrome.storage.local
      ↓
Redirect to unlock screen
```

### 1.3 Files Modified

**New Files:**
- None (all changes in existing files)

**Modified Files:**
1. `src/background/index.ts` - Add `CREATE_WALLET_FROM_PRIVATE_KEY` handler
2. `src/background/wallet/WIFManager.ts` - Add `deriveAddress()` method
3. `src/background/wallet/WalletStorage.ts` - Add validation helpers (optional)
4. `src/background/bitcoin/TransactionBuilder.ts` - Add conditional signing logic
5. `src/shared/types/index.ts` - Update JSDoc comments (no structural changes)

---

## 2. Message Handler Implementation

### 2.1 New Message Type

**Add to `src/shared/types/index.ts`:**

```typescript
export enum MessageType {
  // ... existing types ...
  CREATE_WALLET_FROM_PRIVATE_KEY = 'CREATE_WALLET_FROM_PRIVATE_KEY',
}
```

### 2.2 Request/Response Interfaces

**Add to `src/shared/types/index.ts`:**

```typescript
/**
 * Request to create wallet from imported private key
 */
export interface CreateWalletFromPrivateKeyRequest {
  wif: string;                  // Decrypted WIF (plaintext)
  addressType: AddressType;     // User-selected address type
  accountName: string;          // Account name (default: "Imported Account")
  password: string;             // New wallet password
}

/**
 * Response from wallet creation
 */
export interface CreateWalletFromPrivateKeyResponse {
  success: true;
  data: {
    firstAddress: string;
    addressType: AddressType;
    network: 'testnet' | 'mainnet';
  };
}

/**
 * Error codes specific to wallet creation from private key
 */
export enum WalletCreationErrorCode {
  INVALID_WIF = 'INVALID_WIF',
  WRONG_NETWORK = 'WRONG_NETWORK',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INCOMPATIBLE_ADDRESS_TYPE = 'INCOMPATIBLE_ADDRESS_TYPE',
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  STORAGE_FAILED = 'STORAGE_FAILED',
}
```

### 2.3 Message Handler Implementation

**Add to `src/background/index.ts`:**

```typescript
/**
 * CREATE_WALLET_FROM_PRIVATE_KEY
 *
 * Creates a new non-HD wallet from an imported private key (WIF format).
 * This wallet does NOT have a seed phrase backup - only the private key.
 *
 * Security Notes:
 * - Rate limited to 3 attempts per 15 minutes
 * - WIF must match network (testnet-only for testnet wallet)
 * - Private key encrypted with same method as HD seed
 * - Address type must be compatible with key compression
 *
 * @param payload - WIF, address type, account name, wallet password
 * @returns First address and metadata
 */
case MessageType.CREATE_WALLET_FROM_PRIVATE_KEY: {
  try {
    console.log('CREATE_WALLET_FROM_PRIVATE_KEY request received');

    const { wif, addressType, accountName, password } = msg.payload as CreateWalletFromPrivateKeyRequest;

    // ──────────────────────────────────────────────────────────
    // Step 1: Rate Limiting
    // ──────────────────────────────────────────────────────────
    const rateLimitCheck = checkWalletCreationRateLimit();
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded',
        code: WalletCreationErrorCode.RATE_LIMIT_EXCEEDED,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 2: Check if Wallet Already Exists
    // ──────────────────────────────────────────────────────────
    const existingWallet = await WalletStorage.getWallet();
    if (existingWallet) {
      return {
        success: false,
        error: 'Wallet already exists. Use Settings → Import Account to add private keys to existing wallet.',
        code: WalletCreationErrorCode.WALLET_ALREADY_EXISTS,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 3: Validate WIF
    // ──────────────────────────────────────────────────────────
    const network = 'testnet'; // TODO: Support mainnet when ready
    const wifValidation = WIFManager.validateWIF(wif, network);

    if (!wifValidation.valid) {
      return {
        success: false,
        error: wifValidation.error || 'Invalid WIF format',
        code: WalletCreationErrorCode.INVALID_WIF,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 4: Validate Address Type Compatibility
    // ──────────────────────────────────────────────────────────
    // Uncompressed keys can ONLY use legacy addresses
    if (!wifValidation.compressed && addressType !== 'legacy') {
      return {
        success: false,
        error: `Address type '${addressType}' requires compressed key. Uncompressed keys can only use 'legacy' addresses.`,
        code: WalletCreationErrorCode.INCOMPATIBLE_ADDRESS_TYPE,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 5: Derive First Address
    // ──────────────────────────────────────────────────────────
    const addressInfo = WIFManager.deriveAddress(wif, addressType, network);

    console.log('Derived first address:', addressInfo.address);

    // ──────────────────────────────────────────────────────────
    // Step 6: Validate Password Strength
    // ──────────────────────────────────────────────────────────
    const passwordValidation = KeyManager.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error || 'Password does not meet security requirements',
        code: WalletCreationErrorCode.WEAK_PASSWORD,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 7: Generate Encryption Parameters
    // ──────────────────────────────────────────────────────────
    // Wallet-level encryption (for consistency, even though seed is empty)
    const walletSalt = CryptoUtils.generateRandomBytes(32);
    const walletIv = CryptoUtils.generateRandomBytes(16);

    // Imported key encryption (separate salt/IV for defense-in-depth)
    const keySalt = CryptoUtils.generateRandomBytes(32);
    const keyIv = CryptoUtils.generateRandomBytes(16);

    // ──────────────────────────────────────────────────────────
    // Step 8: Encrypt Private Key (WIF)
    // ──────────────────────────────────────────────────────────
    const encryptedWIF = await CryptoUtils.encryptData(
      wif,
      password,
      CryptoUtils.bufferToHex(keySalt),
      CryptoUtils.bufferToHex(keyIv)
    );

    // SECURITY: Clear sensitive data from memory
    // Note: JavaScript strings are immutable, but we can dereference
    let wifCopy = wif;
    wifCopy = ''; // Dereference to allow garbage collection

    // ──────────────────────────────────────────────────────────
    // Step 9: Create Non-HD Wallet Structure
    // ──────────────────────────────────────────────────────────
    const wallet: StoredWalletV2 = {
      version: 2,
      encryptedSeed: '', // ✅ EMPTY STRING = Non-HD wallet
      salt: CryptoUtils.bufferToHex(walletSalt),
      iv: CryptoUtils.bufferToHex(walletIv),
      accounts: [
        {
          accountType: 'single',
          index: 0,
          name: accountName || 'Imported Account',
          addressType: addressType,
          importType: 'private-key', // ✅ Mark as imported
          externalIndex: 0,
          internalIndex: 0,
          addresses: [
            {
              address: addressInfo.address,
              derivationPath: 'imported', // No derivation path
              index: 0,
              isChange: false,
              used: false,
            },
          ],
        },
      ],
      importedKeys: {
        0: {
          encryptedData: encryptedWIF,
          salt: CryptoUtils.bufferToHex(keySalt),
          iv: CryptoUtils.bufferToHex(keyIv),
          type: 'private-key',
        },
      },
      pendingMultisigTxs: [],
      settings: {
        autoLockMinutes: 15,
        network: network,
      },
    };

    // ──────────────────────────────────────────────────────────
    // Step 10: Validate Wallet Structure
    // ──────────────────────────────────────────────────────────
    try {
      validateWalletStructure(wallet);
    } catch (validationError) {
      console.error('Wallet structure validation failed:', validationError);
      return {
        success: false,
        error: `Wallet structure validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown error'}`,
        code: WalletCreationErrorCode.STORAGE_FAILED,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 11: Save to Storage
    // ──────────────────────────────────────────────────────────
    try {
      await WalletStorage.saveWallet(wallet);
      console.log('Non-HD wallet created and saved successfully');
    } catch (storageError) {
      console.error('Failed to save wallet:', storageError);
      return {
        success: false,
        error: `Failed to save wallet: ${storageError instanceof Error ? storageError.message : 'Unknown error'}`,
        code: WalletCreationErrorCode.STORAGE_FAILED,
      } as MessageResponse;
    }

    // ──────────────────────────────────────────────────────────
    // Step 12: Return Success
    // ──────────────────────────────────────────────────────────
    return {
      success: true,
      data: {
        firstAddress: addressInfo.address,
        addressType: addressType,
        network: network,
      },
    } as MessageResponse;

  } catch (error) {
    console.error('CREATE_WALLET_FROM_PRIVATE_KEY error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet from private key',
      code: WalletCreationErrorCode.STORAGE_FAILED,
    } as MessageResponse;
  }
}
```

### 2.4 Rate Limiting Helper

**Add to `src/background/index.ts` (after existing rate limit code):**

```typescript
// Rate limiting for wallet creation operations
interface WalletCreationRateLimitEntry {
  attempts: number[];
}

const walletCreationRateLimits: Map<string, WalletCreationRateLimitEntry> = new Map();
const WALLET_CREATION_RATE_LIMIT = 3; // Maximum 3 attempts per 15 minutes
const WALLET_CREATION_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Check rate limit for wallet creation operations
 *
 * Prevents brute force attacks by limiting wallet creation attempts.
 * Rate limit: 3 attempts per 15 minutes.
 *
 * @returns Object with allowed flag and optional error message
 */
function checkWalletCreationRateLimit(): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = 'wallet-creation'; // Single global key

  // Get or create rate limit entry
  let entry = walletCreationRateLimits.get(key);
  if (!entry) {
    entry = { attempts: [] };
    walletCreationRateLimits.set(key, entry);
  }

  // Remove attempts older than the rate limit window
  entry.attempts = entry.attempts.filter(
    timestamp => now - timestamp < WALLET_CREATION_RATE_LIMIT_WINDOW
  );

  // Check if rate limit exceeded
  if (entry.attempts.length >= WALLET_CREATION_RATE_LIMIT) {
    const oldestAttempt = entry.attempts[0];
    const waitTime = Math.ceil((WALLET_CREATION_RATE_LIMIT_WINDOW - (now - oldestAttempt)) / 60000);
    return {
      allowed: false,
      error: `Too many wallet creation attempts. Please wait ${waitTime} minutes before trying again.`,
    };
  }

  // Add current attempt
  entry.attempts.push(now);

  return { allowed: true };
}
```

---

## 3. Non-HD Wallet Structure

### 3.1 Sentinel Value for Non-HD Wallet

**Empty String Convention:**

```typescript
// HD Wallet
const hdWallet: StoredWalletV2 = {
  encryptedSeed: 'U2FsdGVkX1...',  // Populated with encrypted seed
  // ...
};

// Non-HD Wallet
const nonHDWallet: StoredWalletV2 = {
  encryptedSeed: '',  // EMPTY STRING = No HD seed
  importedKeys: {
    0: { /* encrypted WIF */ }
  },
  // ...
};
```

**Rationale** (from Blockchain Expert):
- Type-safe (string type, not null/undefined)
- Easy validation: `wallet.encryptedSeed === ''`
- No TypeScript type changes needed
- Clear semantic meaning

### 3.2 Example Non-HD Wallet

**Complete example:**

```typescript
const nonHDWallet: StoredWalletV2 = {
  version: 2,

  // ✅ EMPTY = Non-HD wallet
  encryptedSeed: '',

  // Wallet-level encryption parameters (consistent with HD wallets)
  salt: '6a3f7c8e9d4b2a1f8c5e3d9a7b6c4e2a1f9d8c7b6a5e4d3c2b1a0f9e8d7c6b5a',
  iv: '9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b',

  // Single account (cannot create more)
  accounts: [
    {
      accountType: 'single',
      index: 0,
      name: 'Imported Account',
      addressType: 'native-segwit',
      importType: 'private-key',  // ✅ Mark as imported
      externalIndex: 0,
      internalIndex: 0,
      addresses: [
        {
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          derivationPath: 'imported',  // No real derivation
          index: 0,
          isChange: false,
          used: false,
        },
      ],
    },
  ],

  // ✅ Imported key stored separately
  importedKeys: {
    0: {
      encryptedData: 'U2FsdGVkX1+EWif...',  // Encrypted WIF
      salt: '4d3c2b1a0f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3',
      iv: '7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a',
      type: 'private-key',
    },
  },

  pendingMultisigTxs: [],

  settings: {
    autoLockMinutes: 15,
    network: 'testnet',
  },
};
```

### 3.3 Type Safety

**No TypeScript Changes Needed:**

The existing `StoredWalletV2` interface already supports non-HD wallets:

```typescript
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;  // ✅ Can be empty string
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData };  // ✅ Optional
  settings: WalletSettings;
}
```

**Optional Enhancement** (add JSDoc comment):

```typescript
export interface StoredWalletV2 {
  version: 2;
  /**
   * Encrypted seed phrase for HD wallets.
   * Empty string ('') for non-HD wallets (private key imports).
   */
  encryptedSeed: string;
  // ...
}
```

---

## 4. WIFManager Enhancements

### 4.1 New Method: `deriveAddress()`

**Problem**: Current `deriveFirstAddress()` assumes a default address type (native-segwit for compressed, legacy for uncompressed). User must specify which address type they originally used.

**Solution**: Add method that accepts user-specified address type.

**Add to `src/background/wallet/WIFManager.ts`:**

```typescript
/**
 * Derives address from WIF for specified address type
 *
 * This method generates an address of the user's chosen type.
 * CRITICAL: User must select the address type they originally used,
 * as a single private key can generate 3 different addresses.
 *
 * @param wif - WIF private key
 * @param addressType - Desired address type ('legacy', 'segwit', 'native-segwit')
 * @param network - Network ('testnet' or 'mainnet')
 * @returns Object with address and compression flag
 * @throws {Error} If address type is incompatible with key (e.g., SegWit with uncompressed key)
 */
static deriveAddress(
  wif: string,
  addressType: AddressType,
  network: 'testnet' | 'mainnet' = 'testnet'
): {
  address: string;
  compressed: boolean;
} {
  const networkObj = network === 'testnet'
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

  // Decode WIF to check compression
  const decoded = KeyManager.decodeWIF(wif, network);
  const keyPair = ECPair.fromWIF(wif, networkObj);

  // ──────────────────────────────────────────────────────────
  // CRITICAL VALIDATION: Address Type Compatibility
  // ──────────────────────────────────────────────────────────
  // Uncompressed keys can ONLY use legacy addresses
  if (!decoded.compressed && addressType !== 'legacy') {
    throw new Error(
      `Address type '${addressType}' requires compressed key. ` +
      `Uncompressed keys can only use 'legacy' addresses.`
    );
  }

  // ──────────────────────────────────────────────────────────
  // Generate Address Based on Type
  // ──────────────────────────────────────────────────────────
  let address: string;

  switch (addressType) {
    case 'legacy': {
      // P2PKH (Pay-to-Public-Key-Hash)
      const payment = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj,
      });
      address = payment.address!;
      break;
    }

    case 'segwit': {
      // P2SH-P2WPKH (SegWit wrapped in P2SH)
      const payment = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: networkObj,
        }),
        network: networkObj,
      });
      address = payment.address!;
      break;
    }

    case 'native-segwit': {
      // P2WPKH (Native SegWit)
      const payment = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj,
      });
      address = payment.address!;
      break;
    }

    default:
      throw new Error(`Unsupported address type: ${addressType}`);
  }

  return {
    address,
    compressed: decoded.compressed,
  };
}
```

### 4.2 Helper Method: `getAvailableAddressTypes()`

**Optional but recommended** - helps frontend show only compatible address types:

```typescript
/**
 * Gets available address types for a WIF key
 *
 * Uncompressed keys can only use legacy addresses.
 * Compressed keys can use all three address types.
 *
 * @param wif - WIF private key
 * @param network - Network ('testnet' or 'mainnet')
 * @returns Array of compatible address types
 */
static getAvailableAddressTypes(
  wif: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): AddressType[] {
  try {
    const decoded = KeyManager.decodeWIF(wif, network);

    if (!decoded.compressed) {
      // Uncompressed keys: Legacy only
      return ['legacy'];
    } else {
      // Compressed keys: All types
      return ['legacy', 'segwit', 'native-segwit'];
    }
  } catch (error) {
    // If decoding fails, return empty array
    return [];
  }
}
```

### 4.3 Helper Method: `generateAddressPreview()`

**Optional** - generates address previews for all 3 types (for compressed keys):

```typescript
/**
 * Generates address previews for all compatible address types
 *
 * Helps user identify which address type they originally used.
 * Only generates previews for compatible types (e.g., legacy only for uncompressed).
 *
 * @param wif - WIF private key
 * @param network - Network ('testnet' or 'mainnet')
 * @returns Map of address type to address string
 */
static generateAddressPreview(
  wif: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): Map<AddressType, string> {
  const availableTypes = this.getAvailableAddressTypes(wif, network);
  const preview = new Map<AddressType, string>();

  for (const type of availableTypes) {
    try {
      const { address } = this.deriveAddress(wif, type, network);
      preview.set(type, address);
    } catch (error) {
      // Skip if derivation fails
      console.warn(`Failed to generate ${type} address preview:`, error);
    }
  }

  return preview;
}
```

---

## 5. Wallet Structure Validation

### 5.1 Validation Function

**Add to `src/background/index.ts` or create new `WalletValidator.ts`:**

```typescript
/**
 * Validates wallet structure to ensure consistency
 *
 * Prevents invalid states:
 * - Non-HD wallet without imported keys
 * - Non-HD wallet with HD accounts
 * - HD wallet with invalid seed
 *
 * @param wallet - Wallet to validate
 * @throws {Error} If wallet structure is invalid
 */
function validateWalletStructure(wallet: StoredWalletV2): void {
  const isNonHD = wallet.encryptedSeed === '';
  const hasImportedKeys = wallet.importedKeys && Object.keys(wallet.importedKeys).length > 0;

  if (isNonHD) {
    // ──────────────────────────────────────────────────────────
    // Non-HD Wallet Validations
    // ──────────────────────────────────────────────────────────

    // Must have imported keys
    if (!hasImportedKeys) {
      throw new Error(
        'Invalid wallet structure: Non-HD wallet must have imported keys. ' +
        'encryptedSeed is empty but no importedKeys found.'
      );
    }

    // Must have at least one account
    if (wallet.accounts.length === 0) {
      throw new Error(
        'Invalid wallet structure: Non-HD wallet must have at least one account.'
      );
    }

    // All accounts must be imported type
    const allImported = wallet.accounts.every(
      (acc) => {
        if (acc.accountType === 'multisig') {
          // Multisig accounts are not supported in non-HD wallets (MVP)
          return false;
        }
        return acc.importType === 'private-key';
      }
    );

    if (!allImported) {
      throw new Error(
        'Invalid wallet structure: Non-HD wallet cannot have HD-derived accounts. ' +
        'All accounts must have importType: "private-key".'
      );
    }

    // Verify imported key exists for each account
    for (const account of wallet.accounts) {
      if (account.accountType === 'single') {
        const hasImportedKey = wallet.importedKeys?.[account.index];
        if (!hasImportedKey) {
          throw new Error(
            `Invalid wallet structure: Non-HD wallet account ${account.index} missing imported key.`
          );
        }
      }
    }
  } else {
    // ──────────────────────────────────────────────────────────
    // HD Wallet Validations
    // ──────────────────────────────────────────────────────────

    // Must have valid encrypted seed (at least 64 chars for AES-256-GCM)
    if (wallet.encryptedSeed.length < 64) {
      throw new Error(
        'Invalid wallet structure: HD wallet must have valid encrypted seed. ' +
        `Seed length: ${wallet.encryptedSeed.length}, expected >= 64.`
      );
    }

    // Note: HD wallets CAN have importedKeys (imported accounts into HD wallet)
    // This is valid and supported by the existing IMPORT_ACCOUNT_PRIVATE_KEY handler
  }

  // ──────────────────────────────────────────────────────────
  // Common Validations (Both HD and Non-HD)
  // ──────────────────────────────────────────────────────────

  // Version must be 2
  if (wallet.version !== 2) {
    throw new Error(
      `Invalid wallet structure: Expected version 2, got ${wallet.version}.`
    );
  }

  // Must have salt and IV
  if (!wallet.salt || wallet.salt.length === 0) {
    throw new Error('Invalid wallet structure: Missing wallet salt.');
  }

  if (!wallet.iv || wallet.iv.length === 0) {
    throw new Error('Invalid wallet structure: Missing wallet IV.');
  }

  // Must have settings
  if (!wallet.settings || !wallet.settings.network) {
    throw new Error('Invalid wallet structure: Missing wallet settings.');
  }

  console.log('Wallet structure validation passed');
}
```

### 5.2 When to Run Validation

**Add validation calls at these points:**

```typescript
// 1. On wallet creation
case MessageType.CREATE_WALLET_FROM_PRIVATE_KEY: {
  // ... create wallet ...
  validateWalletStructure(wallet);
  await WalletStorage.saveWallet(wallet);
}

// 2. On wallet unlock
case MessageType.UNLOCK_WALLET: {
  const wallet = await WalletStorage.getWallet();
  validateWalletStructure(wallet);  // ✅ Add this
  // ... proceed with unlock ...
}

// 3. Before critical operations (optional but recommended)
case MessageType.SEND_TRANSACTION: {
  const wallet = await WalletStorage.getWallet();
  validateWalletStructure(wallet);
  // ... proceed with transaction ...
}
```

---

## 6. Transaction Signing - Conditional Logic

### 6.1 Problem Statement

**Challenge**: Non-HD accounts don't have derivation paths. We cannot derive private keys from seed.

**Solution**: Check `account.importType` and branch signing logic:
- HD accounts → Derive from seed
- Non-HD accounts → Decrypt imported key

### 6.2 Signing Logic Location

**Primary Location**: `src/background/bitcoin/TransactionBuilder.ts`

**Secondary Location**: `src/background/index.ts` (SEND_TRANSACTION handler)

### 6.3 Implementation Strategy

**Add helper function to get private key for signing:**

```typescript
/**
 * Gets private key for signing based on account type
 *
 * Handles both HD and non-HD accounts:
 * - HD accounts: Derive private key from seed using derivation path
 * - Non-HD accounts: Decrypt imported private key from storage
 *
 * @param account - Account to sign for
 * @param password - Wallet password
 * @param derivationPath - Derivation path (only for HD accounts)
 * @returns Private key as Buffer
 * @throws {Error} If private key cannot be retrieved
 */
async function getPrivateKeyForSigning(
  account: WalletAccount,
  password: string,
  derivationPath?: string
): Promise<Buffer> {
  // Check if this is a non-HD account
  if (account.accountType === 'single' && account.importType === 'private-key') {
    // ──────────────────────────────────────────────────────────
    // NON-HD ACCOUNT: Decrypt imported private key
    // ──────────────────────────────────────────────────────────
    console.log(`Signing with imported private key for account ${account.index}`);

    // Get wallet and imported key data
    const wallet = await WalletStorage.getWallet();
    const importedKeyData = wallet.importedKeys?.[account.index];

    if (!importedKeyData) {
      throw new Error(
        `Imported key not found for account ${account.index}. ` +
        `This account is marked as imported but no key data exists.`
      );
    }

    if (importedKeyData.type !== 'private-key') {
      throw new Error(
        `Invalid imported key type for account ${account.index}. ` +
        `Expected 'private-key', got '${importedKeyData.type}'.`
      );
    }

    // Decrypt WIF
    const decryptedWIF = await CryptoUtils.decryptData(
      importedKeyData.encryptedData,
      password,
      importedKeyData.salt,
      importedKeyData.iv
    );

    // Decode WIF to get private key
    const network = wallet.settings.network;
    const keyInfo = KeyManager.decodeWIF(decryptedWIF, network);
    const privateKey = Buffer.from(keyInfo.privateKey, 'hex');

    // SECURITY: Clear sensitive data
    let wifCopy = decryptedWIF;
    wifCopy = '';

    console.log(`Retrieved imported private key for account ${account.index}`);
    return privateKey;
  } else {
    // ──────────────────────────────────────────────────────────
    // HD ACCOUNT: Derive private key from seed
    // ──────────────────────────────────────────────────────────
    if (!state.hdWallet) {
      throw new Error('HD wallet not initialized. Cannot derive private key.');
    }

    if (!derivationPath) {
      throw new Error('Derivation path required for HD account signing.');
    }

    const node = state.hdWallet.derivePath(derivationPath);
    if (!node.privateKey) {
      throw new Error(`Failed to derive private key for path: ${derivationPath}`);
    }

    console.log(`Derived private key for path: ${derivationPath}`);
    return node.privateKey;
  }
}
```

### 6.4 Transaction Builder Integration

**Modify transaction signing in SEND_TRANSACTION handler:**

```typescript
case MessageType.SEND_TRANSACTION: {
  // ... existing code to build transaction ...

  // Get account
  const account = wallet.accounts[accountIndex];

  // Build PSBT
  const psbt = new bitcoin.Psbt({ network: transactionBuilder['network'] });

  // Add inputs
  for (let i = 0; i < selectedUtxos.length; i++) {
    const utxo = selectedUtxos[i];
    // ... add input to PSBT ...
  }

  // Add outputs
  for (const output of outputs) {
    psbt.addOutput({ address: output.address, value: output.amount });
  }

  // Add change output
  if (change > DUST_THRESHOLD) {
    const changeAddress = await getChangeAddressForAccount(account);
    psbt.addOutput({ address: changeAddress, value: change });
  }

  // ──────────────────────────────────────────────────────────
  // SIGN INPUTS (Conditional Logic)
  // ──────────────────────────────────────────────────────────
  for (let i = 0; i < selectedUtxos.length; i++) {
    const utxo = selectedUtxos[i];

    // Get private key (handles both HD and non-HD)
    const privateKey = await getPrivateKeyForSigning(
      account,
      password,
      utxo.derivationPath
    );

    // Create key pair
    const keyPair = ECPair.fromPrivateKey(privateKey, {
      network: transactionBuilder['network'],
      compressed: true,
    });

    // Sign input
    psbt.signInput(i, keyPair);

    // SECURITY: Clear private key from memory
    privateKey.fill(0);
  }

  // Finalize and extract transaction
  psbt.finalizeAllInputs();
  const tx = psbt.extractTransaction();

  // ... broadcast transaction ...
}
```

### 6.5 Multiple UTXOs on Same Address

**Scenario**: Non-HD account has multiple UTXOs on the same address (common).

**Handling**: Use the same private key for all inputs.

```typescript
// Non-HD account with 3 UTXOs on same address
const privateKey = await getPrivateKeyForSigning(account, password);
const keyPair = ECPair.fromPrivateKey(privateKey, { network });

// Sign all inputs with the same key
psbt.signInput(0, keyPair); // UTXO 1
psbt.signInput(1, keyPair); // UTXO 2
psbt.signInput(2, keyPair); // UTXO 3

// SECURITY: Clear key once after all signatures
privateKey.fill(0);
```

**No special handling required** - bitcoinjs-lib handles this correctly.

---

## 7. Change Address Handling

### 7.1 Strategy for Non-HD Accounts

**Decision** (from Blockchain Expert Review): **Reuse same address for change** (MVP)

**Rationale**:
- Simplest implementation
- No derivation needed (no seed)
- Bitcoin-protocol compliant
- Privacy tradeoff acceptable for MVP (with warnings)

### 7.2 Implementation

**Add helper function:**

```typescript
/**
 * Gets change address for an account
 *
 * For HD accounts: Generates new change address (BIP44 internal chain)
 * For non-HD accounts: Reuses the same address (MVP approach)
 *
 * @param account - Account to get change address for
 * @returns Change address string
 */
async function getChangeAddressForAccount(
  account: WalletAccount
): Promise<string> {
  if (account.accountType === 'single' && account.importType === 'private-key') {
    // ──────────────────────────────────────────────────────────
    // NON-HD ACCOUNT: Reuse same address for change
    // ──────────────────────────────────────────────────────────
    console.log(`Reusing address for change (non-HD account ${account.index})`);

    // Get the single imported address
    const importedAddress = account.addresses.find(addr => !addr.isChange);
    if (!importedAddress) {
      throw new Error(
        `No imported address found for account ${account.index}. ` +
        `Non-HD accounts must have at least one address.`
      );
    }

    return importedAddress.address;
  } else if (account.accountType === 'single') {
    // ──────────────────────────────────────────────────────────
    // HD ACCOUNT: Generate new change address
    // ──────────────────────────────────────────────────────────
    return await getOrGenerateChangeAddress(account.index);
  } else {
    // ──────────────────────────────────────────────────────────
    // MULTISIG ACCOUNT: Generate multisig change address
    // ──────────────────────────────────────────────────────────
    return await getOrGenerateMultisigChangeAddress(account.index);
  }
}
```

### 7.3 Privacy Warning

**When reusing address, log a warning:**

```typescript
if (account.importType === 'private-key') {
  console.warn(
    `PRIVACY: Account ${account.index} is reusing address for change. ` +
    `This reduces privacy by linking transactions to the same address. ` +
    `Consider migrating to an HD wallet for better privacy.`
  );
}
```

---

## 8. Account Creation Restrictions

### 8.1 Problem

**Non-HD wallets cannot create additional accounts** (no seed to derive from).

### 8.2 Validation

**Add validation to CREATE_ACCOUNT handler:**

```typescript
case MessageType.CREATE_ACCOUNT: {
  // ... existing code ...

  // Get wallet
  const wallet = await WalletStorage.getWallet();

  // ──────────────────────────────────────────────────────────
  // VALIDATION: Prevent account creation in non-HD wallet
  // ──────────────────────────────────────────────────────────
  if (wallet.encryptedSeed === '') {
    return {
      success: false,
      error: 'Cannot create new accounts in non-HD wallet. This wallet was imported from a private key and does not have a seed phrase. To create additional accounts, create a new HD wallet from a seed phrase or import additional private keys using Settings → Import Account.',
      code: 'NON_HD_WALLET_LIMITATION',
    } as MessageResponse;
  }

  // ... proceed with account creation ...
}
```

### 8.3 Frontend Handling

**Frontend should disable "Create Account" button for non-HD wallets:**

```typescript
// In Dashboard or Settings component
const canCreateAccount = wallet.encryptedSeed !== '';

<button
  onClick={handleCreateAccount}
  disabled={!canCreateAccount}
  title={!canCreateAccount ? 'Cannot create accounts in non-HD wallet' : ''}
>
  Create Account
</button>
```

---

## 9. Storage Schema Documentation

### 9.1 No Schema Changes Needed

**Existing `StoredWalletV2` interface supports non-HD wallets:**

```typescript
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;  // ✅ Empty string for non-HD
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData };  // ✅ Required for non-HD
  settings: WalletSettings;
}
```

### 9.2 Non-HD Wallet Example (Complete)

**Save this as documentation comment in types file:**

```typescript
/**
 * Example: Non-HD Wallet (Imported from Private Key)
 *
 * This wallet does NOT have a seed phrase. It was created by importing
 * a private key (WIF format) during wallet setup.
 *
 * Key characteristics:
 * - encryptedSeed = '' (empty string sentinel)
 * - Single account with importType: 'private-key'
 * - Encrypted WIF stored in importedKeys[0]
 * - Cannot create additional accounts (no seed to derive from)
 * - Change address reuses the same address (privacy tradeoff)
 *
 * Example structure:
 *
 * {
 *   version: 2,
 *   encryptedSeed: '',  // ← Empty string = non-HD wallet
 *   salt: '...',
 *   iv: '...',
 *   accounts: [
 *     {
 *       accountType: 'single',
 *       index: 0,
 *       name: 'Imported Account',
 *       addressType: 'native-segwit',
 *       importType: 'private-key',  // ← Marks as imported
 *       externalIndex: 0,
 *       internalIndex: 0,
 *       addresses: [
 *         {
 *           address: 'tb1q...',
 *           derivationPath: 'imported',  // ← No real derivation
 *           index: 0,
 *           isChange: false,
 *           used: false
 *         }
 *       ]
 *     }
 *   ],
 *   importedKeys: {
 *     0: {
 *       encryptedData: '...',  // ← Encrypted WIF
 *       salt: '...',
 *       iv: '...',
 *       type: 'private-key'
 *     }
 *   },
 *   pendingMultisigTxs: [],
 *   settings: {
 *     autoLockMinutes: 15,
 *     network: 'testnet'
 *   }
 * }
 */
```

---

## 10. Rate Limiting Implementation

### 10.1 Rate Limit Configuration

**Constants** (already added in message handler section):

```typescript
const WALLET_CREATION_RATE_LIMIT = 3;  // Maximum attempts
const WALLET_CREATION_RATE_LIMIT_WINDOW = 15 * 60 * 1000;  // 15 minutes
```

### 10.2 Attack Scenarios Prevented

**Scenario 1: Brute Force WIF Import**
- Attacker tries multiple WIF strings rapidly
- Rate limit prevents rapid attempts
- After 3 attempts, user must wait 15 minutes

**Scenario 2: Password Brute Force**
- Attacker tries multiple wallet passwords
- Rate limit slows down attack significantly
- Makes brute force impractical

**Scenario 3: Resource Exhaustion**
- Attacker creates many wallets rapidly
- Rate limit prevents storage exhaustion
- Protects against DoS attacks

### 10.3 User Experience Considerations

**Good User Experience:**
- 3 attempts allows for typos/mistakes
- 15-minute lockout is reasonable
- Clear error message shows wait time

**Error Message Example:**
```
Too many wallet creation attempts.
Please wait 12 minutes before trying again.
```

### 10.4 Rate Limit Storage

**In-Memory Only** (MVP):
- Stored in `walletCreationRateLimits` Map
- Resets on service worker restart
- Acceptable for MVP (DoS protection is primary goal)

**Optional Enhancement** (Post-MVP):
- Persist to chrome.storage.local
- Survives service worker restarts
- Stricter rate limiting

---

## 11. Error Handling and Codes

### 11.1 Error Code Enum

**Already defined in Message Handler section:**

```typescript
export enum WalletCreationErrorCode {
  INVALID_WIF = 'INVALID_WIF',
  WRONG_NETWORK = 'WRONG_NETWORK',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INCOMPATIBLE_ADDRESS_TYPE = 'INCOMPATIBLE_ADDRESS_TYPE',
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  STORAGE_FAILED = 'STORAGE_FAILED',
}
```

### 11.2 Error Messages Matrix

| Error Code | User Message | Recovery Action |
|-----------|--------------|----------------|
| `INVALID_WIF` | "Invalid WIF format. Please check your private key." | "Verify you copied the entire WIF string" |
| `WRONG_NETWORK` | "Wrong network: This is a mainnet key, testnet required." | "Use a testnet private key (starts with 9 or c)" |
| `WEAK_PASSWORD` | "Password does not meet security requirements." | "Use at least 8 chars, uppercase, lowercase, number" |
| `INCOMPATIBLE_ADDRESS_TYPE` | "Address type 'segwit' requires compressed key. Uncompressed keys can only use 'legacy' addresses." | "Select Legacy address type" |
| `WALLET_ALREADY_EXISTS` | "Wallet already exists." | "Use Settings → Import Account to add private keys" |
| `RATE_LIMIT_EXCEEDED` | "Too many wallet creation attempts. Please wait 12 minutes before trying again." | "Wait before trying again" |
| `STORAGE_FAILED` | "Failed to save wallet to storage." | "Check browser storage permissions and try again" |

### 11.3 Logging Strategy

**Console Logging:**

```typescript
// Success
console.log('Non-HD wallet created successfully:', {
  accountIndex: 0,
  addressType: addressType,
  firstAddress: addressInfo.address,
});

// Error
console.error('CREATE_WALLET_FROM_PRIVATE_KEY failed:', {
  error: error.message,
  code: errorCode,
});

// Security: NEVER log sensitive data
// ❌ console.log('WIF:', wif);  // NEVER DO THIS
// ❌ console.log('Password:', password);  // NEVER DO THIS
```

---

## 12. Migration Support

### 12.1 Future Migration Path

**MVP**: No automatic migration (manual fund transfer required)

**User Flow** (Post-MVP):
1. User has non-HD wallet with funds
2. User initiates "Migrate to HD Wallet" from Settings
3. System creates NEW HD wallet (generates seed phrase)
4. User backs up seed phrase
5. System offers to transfer all funds
6. User confirms transfer transaction
7. Funds transferred to first HD address
8. After confirmation, user can delete old non-HD wallet

### 12.2 Migration Helper Functions

**Add these helpers for future use:**

```typescript
/**
 * Checks if wallet can be migrated to HD wallet
 *
 * @param wallet - Wallet to check
 * @returns true if wallet is non-HD and has funds
 */
function canMigrateToHD(wallet: StoredWalletV2): boolean {
  // Must be non-HD wallet
  if (wallet.encryptedSeed !== '') {
    return false;
  }

  // Must have at least one account
  if (wallet.accounts.length === 0) {
    return false;
  }

  // Ready for migration
  return true;
}

/**
 * Gets migration instructions for non-HD wallet
 *
 * @param wallet - Wallet to migrate
 * @returns Instruction string
 */
function getMigrationInstructions(wallet: StoredWalletV2): string {
  if (wallet.encryptedSeed !== '') {
    return 'This wallet already has a seed phrase. No migration needed.';
  }

  return (
    'To migrate this wallet to an HD wallet:\n\n' +
    '1. Create a new wallet with a seed phrase (Settings → Create HD Wallet)\n' +
    '2. Back up your new seed phrase securely\n' +
    '3. Transfer all funds from this imported account to the new HD wallet\n' +
    '4. After funds are confirmed, you can delete this imported wallet\n\n' +
    'Note: Keep your private key backup until you confirm funds are safely transferred.'
  );
}
```

### 12.3 Dashboard Banner for Non-HD Wallets

**Detection logic:**

```typescript
// In Dashboard component or backend status check
function isNonHDWallet(wallet: StoredWalletV2): boolean {
  return wallet.encryptedSeed === '';
}

// Show banner if non-HD
if (isNonHDWallet(wallet)) {
  showMigrationBanner();
}
```

---

## 13. Testing Requirements

### 13.1 Unit Tests

**Test File**: `src/background/__tests__/CreateWalletFromPrivateKey.test.ts`

**Test Cases:**

```typescript
describe('CREATE_WALLET_FROM_PRIVATE_KEY', () => {
  describe('Validation', () => {
    test('should reject invalid WIF format', async () => {
      // Test with malformed WIF
    });

    test('should reject mainnet WIF on testnet wallet', async () => {
      // Test network mismatch
    });

    test('should reject weak password', async () => {
      // Test password strength validation
    });

    test('should reject incompatible address type for uncompressed key', async () => {
      // Test uncompressed key with segwit address type
    });

    test('should reject if wallet already exists', async () => {
      // Test WALLET_ALREADY_EXISTS error
    });
  });

  describe('Non-HD Wallet Creation', () => {
    test('should create non-HD wallet with correct structure', async () => {
      // Test wallet structure matches spec
    });

    test('should store imported key encrypted', async () => {
      // Test encryption of WIF
    });

    test('should set encryptedSeed to empty string', async () => {
      // Test non-HD sentinel value
    });

    test('should mark account as imported', async () => {
      // Test importType: 'private-key'
    });
  });

  describe('Address Generation', () => {
    test('should generate legacy address for uncompressed key', async () => {
      // Test uncompressed key → legacy address
    });

    test('should generate selected address type for compressed key', async () => {
      // Test user address type selection
    });

    test('should generate correct address for all 3 types', async () => {
      // Test legacy, segwit, native-segwit
    });
  });

  describe('Rate Limiting', () => {
    test('should allow 3 attempts within 15 minutes', async () => {
      // Test rate limit allows 3 attempts
    });

    test('should block 4th attempt within 15 minutes', async () => {
      // Test rate limit blocks excess attempts
    });

    test('should reset after 15 minutes', async () => {
      // Test rate limit window expiration
    });
  });
});
```

### 13.2 Integration Tests

**Test File**: `src/__tests__/integration/NonHDWalletFlow.test.ts`

**Test Scenarios:**

```typescript
describe('Non-HD Wallet Integration', () => {
  test('Full import flow: WIF → Create Wallet → Unlock → Send Transaction', async () => {
    // 1. Create wallet from WIF
    // 2. Unlock wallet
    // 3. Send transaction
    // 4. Verify transaction signed correctly
  });

  test('Import from encrypted WIF file', async () => {
    // 1. Create encrypted WIF export
    // 2. Import during setup
    // 3. Verify wallet created
  });

  test('Change address reuse in non-HD wallet', async () => {
    // 1. Create non-HD wallet
    // 2. Send transaction
    // 3. Verify change sent to same address
  });

  test('Cannot create additional accounts in non-HD wallet', async () => {
    // 1. Create non-HD wallet
    // 2. Attempt to create account
    // 3. Verify error: NON_HD_WALLET_LIMITATION
  });
});
```

### 13.3 Manual Testing Checklist

**Testnet Testing:**

- [ ] Import plaintext WIF (compressed key, native-segwit)
- [ ] Import plaintext WIF (uncompressed key, legacy)
- [ ] Import encrypted WIF with correct password
- [ ] Import encrypted WIF with wrong password (should fail)
- [ ] Import mainnet WIF into testnet wallet (should fail)
- [ ] Select wrong address type for compressed key
- [ ] Send transaction from non-HD account
- [ ] Verify change address reuses same address
- [ ] Attempt to create second account (should fail)
- [ ] Unlock wallet after service worker restart
- [ ] Verify balance fetching works
- [ ] Test rate limiting (3 attempts, then lockout)

---

## 14. Security Checklist

### 14.1 Encryption

- [ ] WIF encrypted with AES-256-GCM (same as HD seed)
- [ ] PBKDF2 with 100,000 iterations for key derivation
- [ ] Separate salt and IV for imported key (defense-in-depth)
- [ ] Wallet password meets strength requirements

### 14.2 Memory Handling

- [ ] Private keys cleared from memory immediately after use
- [ ] Buffers zeroed with `buffer.fill(0)`
- [ ] WIF strings dereferenced (best effort for garbage collection)
- [ ] No private keys logged to console

### 14.3 Validation

- [ ] WIF format validated (Base58Check, length, checksum)
- [ ] Network validated (testnet-only for testnet wallet)
- [ ] Address type compatibility validated (uncompressed → legacy only)
- [ ] Wallet structure validated on creation and unlock
- [ ] Password strength validated

### 14.4 Rate Limiting

- [ ] Wallet creation rate limited (3 attempts per 15 minutes)
- [ ] Clear error message shows wait time
- [ ] Rate limit prevents brute force and DoS attacks

### 14.5 Attack Prevention

- [ ] Network mismatch blocked (mainnet key cannot be imported into testnet wallet)
- [ ] Wallet already exists check prevents overwriting
- [ ] Address type mismatch blocked (uncompressed + segwit = error)
- [ ] Invalid WIF rejected early (no partial wallet creation)

---

## 15. Integration Points

### 15.1 Frontend Integration

**New Frontend Components** (from UX spec):
- `PrivateKeyImportTab` - Main component
- `WIFTextarea` - WIF input with validation
- `FileUpload` - File upload with encryption detection
- `AddressTypeSelector` - Radio cards for address type selection
- `PrivacyAcknowledgment` - Warning before import

**Message Passing:**

```typescript
// Frontend sends message
const response = await chrome.runtime.sendMessage({
  type: MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
  payload: {
    wif: decryptedWIF,
    addressType: 'native-segwit',
    accountName: 'Imported Account',
    password: walletPassword,
  },
});

// Backend responds
if (response.success) {
  // Redirect to unlock screen
  navigate('/unlock');
} else {
  // Show error
  setError(response.error);
}
```

### 15.2 Backend Integration Points

**Files Modified:**
1. `src/background/index.ts` - Add message handler
2. `src/background/wallet/WIFManager.ts` - Add `deriveAddress()` method
3. `src/background/bitcoin/TransactionBuilder.ts` - Add conditional signing

**Functions Added:**
- `checkWalletCreationRateLimit()` - Rate limiting
- `validateWalletStructure()` - Wallet validation
- `getPrivateKeyForSigning()` - Conditional key retrieval
- `getChangeAddressForAccount()` - Change address logic

### 15.3 Storage Integration

**No Schema Changes:**
- Existing `StoredWalletV2` interface supports non-HD wallets
- `encryptedSeed = ''` is the sentinel value
- `importedKeys` field already exists (optional)

**Storage Operations:**
- `WalletStorage.saveWallet(wallet)` - Save non-HD wallet
- `WalletStorage.getWallet()` - Retrieve wallet
- No migration code needed (v2 schema already supports this)

### 15.4 Transaction Builder Integration

**Changes Required:**

```typescript
// In TransactionBuilder or signing logic
if (account.importType === 'private-key') {
  // Non-HD: Decrypt imported key
  const privateKey = await getPrivateKeyForSigning(account, password);
} else {
  // HD: Derive from seed
  const privateKey = await hdWallet.derivePrivateKey(derivationPath);
}
```

**No Changes to UTXO Selection:**
- Same algorithm works for both HD and non-HD accounts
- Non-HD accounts simply have fewer UTXOs (single address)

---

## Summary and Next Steps

### Implementation Checklist

**Phase 1: Backend Core (Sprint 1)**
- [ ] Add `CREATE_WALLET_FROM_PRIVATE_KEY` message type
- [ ] Implement message handler with validation
- [ ] Add rate limiting helper
- [ ] Add `WIFManager.deriveAddress()` method
- [ ] Add `validateWalletStructure()` function
- [ ] Add `getPrivateKeyForSigning()` helper
- [ ] Add `getChangeAddressForAccount()` helper
- [ ] Update error code enums

**Phase 2: Transaction Signing (Sprint 1)**
- [ ] Modify SEND_TRANSACTION handler for conditional signing
- [ ] Add imported key decryption logic
- [ ] Add memory clearing for private keys
- [ ] Test signing with non-HD accounts

**Phase 3: Account Management (Sprint 1)**
- [ ] Add validation to CREATE_ACCOUNT handler
- [ ] Test account creation blocking

**Phase 4: Testing (Sprint 2)**
- [ ] Write unit tests for wallet creation
- [ ] Write unit tests for WIFManager methods
- [ ] Write integration tests for full flow
- [ ] Manual testing on testnet

**Phase 5: Documentation (Sprint 2)**
- [ ] Update backend developer notes
- [ ] Add code comments
- [ ] Document non-HD wallet architecture
- [ ] Update CHANGELOG

### Estimated Implementation Time

**Backend Development**: 2-3 days
- Message handler: 1 day
- WIFManager enhancements: 0.5 day
- Transaction signing: 1 day
- Validation and helpers: 0.5 day

**Testing**: 1-2 days
- Unit tests: 1 day
- Integration tests: 0.5 day
- Manual testing: 0.5 day

**Total**: 3-5 days (1 sprint)

### Success Criteria

**Feature is ready when:**
- [ ] Can import plaintext WIF during wallet setup
- [ ] Can import encrypted WIF during wallet setup
- [ ] Non-HD wallet created with correct structure
- [ ] Wallet can be unlocked and used normally
- [ ] Transactions can be sent from imported account
- [ ] Change addresses handled correctly (reuse same address)
- [ ] All validation works (network, address type, password)
- [ ] Rate limiting prevents brute force
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] Manual testing complete on testnet
- [ ] Security checklist complete
- [ ] Documentation updated

---

**Document Version**: 1.0
**Status**: ✅ Ready for Implementation
**Next Review**: Security Expert (if not already approved)
**Implementation Start**: After frontend implementation complete

---

**END OF BACKEND IMPLEMENTATION PLAN**
