# Private Key Export/Import - Backend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Implementation Ready
**Audience**: Backend Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Module Architecture](#module-architecture)
3. [Private Key Extraction](#private-key-extraction)
4. [WIF Encoding Implementation](#wif-encoding-implementation)
5. [Optional File Encryption](#optional-file-encryption)
6. [WIF Parsing and Validation](#wif-parsing-and-validation)
7. [Message Handlers](#message-handlers)
8. [Account Creation from WIF](#account-creation-from-wif)
9. [Duplicate Detection](#duplicate-detection)
10. [Network Validation](#network-validation)
11. [Error Handling](#error-handling)
12. [Security Implementation](#security-implementation)
13. [TypeScript Interfaces](#typescript-interfaces)
14. [Integration with Existing Code](#integration-with-existing-code)
15. [Testing Strategy](#testing-strategy)
16. [Implementation Examples](#implementation-examples)

---

## Executive Summary

This document provides a complete, implementation-ready backend plan for per-account private key export and import functionality. The feature allows users to export individual account private keys in WIF (Wallet Import Format) with optional password protection, and import them into new or existing wallets.

### Key Deliverables

- **3 new message handlers**: EXPORT_PRIVATE_KEY, IMPORT_PRIVATE_KEY, VALIDATE_WIF
- **1 new utility module**: WIFManager for WIF encoding/decoding and validation
- **TypeScript type definitions**: Message types, request/response interfaces, error codes
- **Security enhancements**: Memory cleanup, input validation, network enforcement
- **Integration points**: KeyManager, WalletStorage, CryptoUtils

### Architecture Decisions

1. **WIF Encoding**: Use existing KeyManager.privateKeyToWIF() and decodeWIF() methods
2. **Encryption**: Extend CryptoUtils with 100K iterations (vs 100K for wallet)
3. **File Format**: Simple text format with metadata headers
4. **Network Validation**: Strict testnet-only enforcement (reject mainnet keys immediately)
5. **Duplicate Detection**: Compare by first derived address
6. **Memory Management**: Clear sensitive data immediately after use

---

## Module Architecture

### New Files

```
src/background/
├── wallet/
│   └── WIFManager.ts              NEW - WIF validation and utilities
│
└── index.ts                        MODIFY - Add message handlers

src/shared/
└── types/
    └── index.ts                    MODIFY - Add message types and interfaces
```

### Existing Files to Modify

```
src/background/wallet/KeyManager.ts     - Already has WIF methods (reuse)
src/background/wallet/CryptoUtils.ts    - Already has encryption (reuse)
src/background/wallet/WalletStorage.ts  - Use storeImportedKey for imported accounts
src/background/index.ts                 - Add 3 new message handlers
src/shared/types/index.ts               - Add new message types
```

### Module Responsibilities

**WIFManager** (New):
- WIF format validation (Base58Check, length, checksum)
- Network detection from WIF prefix
- Network validation (enforce testnet)
- Address derivation from WIF
- Error message generation

**KeyManager** (Existing - Reuse):
- Private key to WIF conversion (`privateKeyToWIF`)
- WIF to private key conversion (`decodeWIF`)
- WIF validation (`validateWIF`)

**CryptoUtils** (Existing - Reuse):
- AES-256-GCM encryption
- PBKDF2 key derivation (100K iterations)
- Base64 encoding/decoding

**WalletStorage** (Existing - Reuse):
- Store imported key data (`storeImportedKey`)
- Retrieve imported key data (`getImportedKey`)
- Add account to wallet (`addAccount`)

---

## Private Key Extraction

### Overview

Extract private key from HD wallet or imported account and convert to WIF format.

### HD Account Private Key Extraction

```typescript
/**
 * Extracts private key for an HD account
 *
 * @param accountIndex - Account index
 * @param addressType - Address type (legacy/segwit/native-segwit)
 * @param decryptedSeed - Decrypted seed phrase (from unlocked wallet)
 * @returns Private key in hex format
 */
async function extractHDAccountPrivateKey(
  accountIndex: number,
  addressType: AddressType,
  decryptedSeed: string
): Promise<string> {
  // 1. Convert seed phrase to seed buffer
  const seed = KeyManager.mnemonicToSeed(decryptedSeed);

  // 2. Create HD wallet from seed
  const hdWallet = new HDWallet(seed);

  // 3. Derive account private key based on address type
  let derivationPath: string;

  switch (addressType) {
    case 'legacy':
      derivationPath = `m/44'/1'/${accountIndex}'`;
      break;
    case 'segwit':
      derivationPath = `m/49'/1'/${accountIndex}'`;
      break;
    case 'native-segwit':
      derivationPath = `m/84'/1'/${accountIndex}'`;
      break;
    default:
      throw new Error(`Unsupported address type: ${addressType}`);
  }

  // 4. Derive private key at derivation path
  const node = hdWallet.derive(derivationPath);

  if (!node.privateKey) {
    throw new Error('Failed to derive private key');
  }

  // 5. Return private key as hex string
  return node.privateKey.toString('hex');
}
```

### Imported Account Private Key Extraction

```typescript
/**
 * Extracts private key for an imported account
 *
 * @param accountIndex - Account index
 * @param password - User's wallet password (for decryption)
 * @returns Private key in hex or WIF format (depending on import source)
 */
async function extractImportedAccountPrivateKey(
  accountIndex: number,
  password: string
): Promise<string> {
  // 1. Retrieve encrypted imported key data from storage
  const importedData = await WalletStorage.getImportedKey(accountIndex);

  if (!importedData) {
    throw new Error(`No imported key found for account ${accountIndex}`);
  }

  // 2. Decrypt imported key using wallet password
  const decrypted = await CryptoUtils.decrypt(
    importedData.encryptedData,
    password,
    importedData.salt,
    importedData.iv
  );

  // 3. Return decrypted private key
  // Note: This could be WIF or hex depending on import source
  return decrypted;
}
```

### Complete Extraction Function

```typescript
/**
 * Extracts private key for any account type
 *
 * @param account - Account to export
 * @param state - In-memory wallet state
 * @param password - Wallet password (for imported accounts)
 * @returns Private key in hex format
 */
async function extractPrivateKey(
  account: WalletAccount,
  state: InMemoryState,
  password?: string
): Promise<string> {
  // 1. Check account type
  if (account.accountType === 'multisig') {
    throw new Error('Cannot export multisig accounts. Multisig accounts have multiple co-signer keys.');
  }

  // 2. Extract based on import status
  if (account.imported) {
    // Imported account - retrieve from encrypted storage
    if (!password) {
      throw new Error('Password required to export imported account');
    }

    const importedKey = await extractImportedAccountPrivateKey(account.index, password);

    // If imported key is already WIF, decode to hex
    if (KeyManager.validateWIF(importedKey, 'testnet')) {
      const decoded = KeyManager.decodeWIF(importedKey, 'testnet');
      return decoded.privateKey; // Hex format
    }

    return importedKey; // Already hex
  } else {
    // HD account - derive from seed
    if (!state.decryptedSeed) {
      throw new Error('Wallet is locked. Please unlock to export private keys.');
    }

    return await extractHDAccountPrivateKey(
      account.index,
      account.addressType as AddressType,
      state.decryptedSeed
    );
  }
}
```

### Security Notes

- ✅ Private key exists in memory for minimal time (seconds)
- ✅ Clear private key variable after WIF conversion
- ✅ Never log private keys or WIF strings
- ✅ Validate wallet is unlocked before extraction
- ✅ Support both HD and imported accounts

---

## WIF Encoding Implementation

### Using Existing KeyManager Methods

The `KeyManager` class already provides WIF encoding/decoding methods. **No new implementation needed** - just use existing methods:

```typescript
// Convert private key (hex) to WIF format
const wif = KeyManager.privateKeyToWIF(
  privateKeyHex,
  'testnet',      // network
  true            // compressed (always use compressed for modern wallets)
);

// Convert WIF to private key (hex)
const decoded = KeyManager.decodeWIF(wif, 'testnet');
// Returns: { privateKey: string, publicKey: string, compressed: boolean }
```

### WIF Format Reference

**Testnet WIF Prefixes:**
- `9` - Uncompressed private key (52 characters)
- `c` - Compressed private key (52 characters)

**Mainnet WIF Prefixes:**
- `5` - Uncompressed private key (51 characters)
- `K` or `L` - Compressed private key (52 characters)

**Example Testnet WIF:**
```
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
```

### Implementation Example

```typescript
/**
 * Exports account private key as WIF
 *
 * @param account - Account to export
 * @param state - In-memory wallet state
 * @param password - Wallet password (for imported accounts)
 * @returns WIF format private key
 */
async function exportAccountAsWIF(
  account: WalletAccount,
  state: InMemoryState,
  password?: string
): Promise<string> {
  let privateKeyHex: string | null = null;
  let wif: string | null = null;

  try {
    // 1. Extract private key (hex format)
    privateKeyHex = await extractPrivateKey(account, state, password);

    // 2. Convert to WIF format (always use compressed)
    wif = KeyManager.privateKeyToWIF(
      privateKeyHex,
      'testnet',
      true // compressed
    );

    // 3. Clear private key hex from memory
    privateKeyHex = '0'.repeat(privateKeyHex.length);
    privateKeyHex = null;

    return wif;

  } finally {
    // Cleanup in case of error
    if (privateKeyHex) {
      privateKeyHex = '0'.repeat(privateKeyHex.length);
    }
  }
}
```

### Address Type Considerations

**Compressed vs Uncompressed:**
- **Modern wallets**: Always use compressed (52 chars)
- **Legacy compatibility**: Support uncompressed on import only
- **Export**: Always export as compressed WIF

**Address Type Mapping:**
```typescript
// All address types use compressed WIF format
const addressType = account.addressType;

// WIF compression flag
const compressed = true; // Always true for exports

// When importing, detect from WIF:
const decoded = KeyManager.decodeWIF(wif, 'testnet');
const isCompressed = decoded.compressed;

// Determine address type from compression:
if (!isCompressed) {
  // Uncompressed keys can only use legacy addresses
  addressType = 'legacy';
} else {
  // Compressed keys default to native-segwit (most efficient)
  addressType = 'native-segwit';
}
```

---

## Optional File Encryption

### Encryption Parameters

**When password protection is ENABLED:**
- Algorithm: AES-256-GCM (same as wallet encryption)
- Key Derivation: PBKDF2-HMAC-SHA256
- Iterations: **100,000** (vs 100,000 for wallet - consistency)
- Salt: 32 bytes (256 bits), unique per export
- IV: 12 bytes (96 bits), unique per export
- Output: `{salt}:{iv}:{authTag}:{ciphertext}` (all base64)

**Rationale for 100K iterations:**
- ✅ **Consistency**: Same as wallet unlock (users familiar with delay)
- ✅ **Security**: Sufficient for per-account encryption (not full wallet)
- ✅ **Performance**: ~500ms encryption time (acceptable UX)
- ✅ **OWASP Compliant**: Meets minimum 100K requirement
- ⚠️ **Trade-off**: Lower than full wallet backup (600K) but proportional to scope

### Using Existing CryptoUtils

**No new encryption code needed** - use existing `CryptoUtils.encrypt()`:

```typescript
/**
 * Encrypts WIF private key with optional password protection
 *
 * @param wif - WIF format private key
 * @param password - Optional password for encryption
 * @returns Encrypted WIF or plaintext WIF
 */
async function encryptWIF(
  wif: string,
  password?: string
): Promise<{
  encrypted: boolean;
  wif?: string;           // If plaintext
  encryptedData?: string; // If encrypted
  salt?: string;
  iv?: string;
}> {
  if (!password) {
    // No encryption - return plaintext
    return {
      encrypted: false,
      wif: wif
    };
  }

  // Encrypt WIF using existing CryptoUtils
  // This uses 100,000 PBKDF2 iterations automatically
  const encryptionResult = await CryptoUtils.encrypt(wif, password);

  return {
    encrypted: true,
    encryptedData: encryptionResult.encryptedData,
    salt: encryptionResult.salt,
    iv: encryptionResult.iv
  };
}
```

### Decryption Implementation

```typescript
/**
 * Decrypts password-protected WIF
 *
 * @param encryptedData - Base64 encrypted WIF
 * @param salt - Base64 salt
 * @param iv - Base64 IV
 * @param password - Password used for encryption
 * @returns Decrypted WIF string
 */
async function decryptWIF(
  encryptedData: string,
  salt: string,
  iv: string,
  password: string
): Promise<string> {
  try {
    // Decrypt using existing CryptoUtils
    const decrypted = await CryptoUtils.decrypt(
      encryptedData,
      password,
      salt,
      iv
    );

    return decrypted;

  } catch (error) {
    // Generic error - don't leak whether password was wrong vs other error
    throw new Error('Decryption failed. Check password and file integrity.');
  }
}
```

### Encrypted File Format

**Format String:**
```
{salt_base64}:{iv_base64}:{authTag_base64}:{ciphertext_base64}
```

**Note**: GCM mode returns ciphertext with auth tag appended (last 16 bytes). CryptoUtils handles this automatically.

**Example Encrypted WIF:**
```
dGVzdHNhbHQxMjM0NTY3ODkwYWJjZGVm:aXZleGFtcGxl:YXV0aHRhZ2V4YW1wbGU=:Y2lwaGVydGV4dGV4YW1wbGU=
```

### Integration with CryptoUtils

**No modifications needed** to CryptoUtils. Use existing methods:

```typescript
// Encryption (uses 100,000 iterations automatically)
const result = await CryptoUtils.encrypt(wif, password);
// Returns: { encryptedData, salt, iv }

// Decryption
const wif = await CryptoUtils.decrypt(
  result.encryptedData,
  password,
  result.salt,
  result.iv
);
```

---

## WIF Parsing and Validation

### New WIFManager Module

Create `src/background/wallet/WIFManager.ts`:

```typescript
/**
 * WIFManager - WIF (Wallet Import Format) Validation and Utilities
 *
 * This module provides WIF validation, network detection, and address derivation.
 * Complements KeyManager's WIF encoding/decoding methods.
 */

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { KeyManager } from './KeyManager';

const ECPair = ECPairFactory(ecc);

export interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: 'legacy' | 'segwit' | 'native-segwit';
  compressed?: boolean;
  error?: string;
}

export class WIFManager {
  /**
   * Validates WIF format (Base58Check, length, checksum)
   *
   * @param wif - WIF string to validate
   * @returns Error message if invalid, null if valid
   */
  static validateFormat(wif: string): string | null {
    // Must be Base58Check format
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(wif)) {
      return 'Invalid WIF format. Must be Base58-encoded.';
    }

    // Must be correct length (51-52 chars)
    if (wif.length < 51 || wif.length > 52) {
      return 'Invalid WIF length. Must be 51-52 characters.';
    }

    return null;
  }

  /**
   * Detects network from WIF prefix
   *
   * @param wif - WIF string
   * @returns Network type or 'invalid' if unknown prefix
   */
  static detectNetwork(wif: string): 'testnet' | 'mainnet' | 'invalid' {
    const firstChar = wif[0];

    // Testnet prefixes
    if (firstChar === '9' || firstChar === 'c') {
      return 'testnet';
    }

    // Mainnet prefixes
    if (firstChar === '5' || firstChar === 'K' || firstChar === 'L') {
      return 'mainnet';
    }

    return 'invalid';
  }

  /**
   * Validates WIF network matches required network
   *
   * @param wif - WIF string
   * @param requiredNetwork - Network to enforce ('testnet' or 'mainnet')
   * @returns Error message if wrong network, null if correct
   */
  static validateNetwork(
    wif: string,
    requiredNetwork: 'testnet' | 'mainnet' = 'testnet'
  ): string | null {
    const network = this.detectNetwork(wif);

    if (network === 'invalid') {
      return 'Invalid WIF prefix. Unrecognized network.';
    }

    if (network !== requiredNetwork) {
      return `Wrong network: This is a ${network} key, but wallet requires ${requiredNetwork} keys.`;
    }

    return null;
  }

  /**
   * Validates WIF checksum using KeyManager
   *
   * @param wif - WIF string
   * @param network - Network to validate against
   * @returns true if checksum valid, false otherwise
   */
  static validateChecksum(wif: string, network: 'testnet' | 'mainnet'): boolean {
    return KeyManager.validateWIF(wif, network);
  }

  /**
   * Derives first receiving address from WIF
   *
   * @param wif - WIF private key
   * @param network - Network ('testnet' or 'mainnet')
   * @returns Object with address and address type
   */
  static deriveFirstAddress(
    wif: string,
    network: 'testnet' | 'mainnet' = 'testnet'
  ): {
    address: string;
    addressType: 'legacy' | 'segwit' | 'native-segwit';
    compressed: boolean;
  } {
    const networkObj = network === 'testnet'
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;

    // Decode WIF to get key pair
    const decoded = KeyManager.decodeWIF(wif, network);
    const keyPair = ECPair.fromWIF(wif, networkObj);

    // Determine address type based on compression
    if (!decoded.compressed) {
      // Uncompressed keys can only use legacy addresses
      const { address } = bitcoin.payments.p2pkh({
        pubkey: keyPair.publicKey,
        network: networkObj
      });

      return {
        address: address!,
        addressType: 'legacy',
        compressed: false
      };
    } else {
      // Compressed keys default to native-segwit (most efficient)
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: keyPair.publicKey,
        network: networkObj
      });

      return {
        address: address!,
        addressType: 'native-segwit',
        compressed: true
      };
    }
  }

  /**
   * Complete WIF validation with all checks
   *
   * @param wif - WIF string to validate
   * @param requiredNetwork - Network to enforce (default: 'testnet')
   * @returns Validation result with network, address, and error info
   */
  static validateWIF(
    wif: string,
    requiredNetwork: 'testnet' | 'mainnet' = 'testnet'
  ): WIFValidationResult {
    // Step 1: Format validation
    const formatError = this.validateFormat(wif);
    if (formatError) {
      return {
        valid: false,
        error: formatError
      };
    }

    // Step 2: Network detection
    const network = this.detectNetwork(wif);
    if (network === 'invalid') {
      return {
        valid: false,
        error: 'Invalid WIF prefix. Unrecognized network.'
      };
    }

    // Step 3: Network validation (CRITICAL for testnet wallet)
    const networkError = this.validateNetwork(wif, requiredNetwork);
    if (networkError) {
      return {
        valid: false,
        network: network,
        error: networkError
      };
    }

    // Step 4: Checksum validation
    const checksumValid = this.validateChecksum(wif, network);
    if (!checksumValid) {
      return {
        valid: false,
        network: network,
        error: 'Invalid WIF checksum.'
      };
    }

    // Step 5: Derive first address for preview
    try {
      const addressInfo = this.deriveFirstAddress(wif, network);

      return {
        valid: true,
        network: network,
        firstAddress: addressInfo.address,
        addressType: addressInfo.addressType,
        compressed: addressInfo.compressed
      };
    } catch (error) {
      return {
        valid: false,
        network: network,
        error: 'Failed to derive address from WIF.'
      };
    }
  }
}
```

### Validation Flow

```
1. Format Validation
   ├─ Base58Check characters only
   ├─ Length: 51-52 characters
   └─ Error: "Invalid WIF format"

2. Network Detection
   ├─ Prefix '9' or 'c' → testnet
   ├─ Prefix '5', 'K', 'L' → mainnet
   └─ Error: "Invalid WIF prefix"

3. Network Validation (CRITICAL)
   ├─ Require testnet for testnet wallet
   ├─ Reject mainnet keys immediately
   └─ Error: "Wrong network: mainnet key, testnet required"

4. Checksum Validation
   ├─ Use KeyManager.validateWIF()
   ├─ Validates Base58Check checksum
   └─ Error: "Invalid WIF checksum"

5. Address Derivation (Preview)
   ├─ Derive first receiving address
   ├─ Detect address type from compression
   └─ Return for user verification
```

---

## Message Handlers

### New Message Types

Add to `src/shared/types/index.ts`:

```typescript
export enum MessageType {
  // ... existing types ...

  // Private Key Export/Import
  EXPORT_PRIVATE_KEY = 'EXPORT_PRIVATE_KEY',
  IMPORT_PRIVATE_KEY = 'IMPORT_PRIVATE_KEY',
  VALIDATE_WIF = 'VALIDATE_WIF',
}
```

### EXPORT_PRIVATE_KEY Handler

```typescript
/**
 * Exports account private key in WIF format with optional encryption
 *
 * Request:
 * {
 *   accountIndex: number;
 *   password?: string;  // If password protection desired
 * }
 *
 * Response:
 * {
 *   success: true;
 *   data: {
 *     wif?: string;             // If plaintext
 *     encryptedData?: string;   // If encrypted
 *     salt?: string;
 *     iv?: string;
 *     metadata: {
 *       accountName: string;
 *       addressType: string;
 *       firstAddress: string;
 *       network: 'testnet' | 'mainnet';
 *       timestamp: number;
 *       encrypted: boolean;
 *     };
 *   };
 * }
 */
async function handleExportPrivateKey(
  payload: {
    accountIndex: number;
    password?: string;
  }
): Promise<MessageResponse> {
  let privateKeyHex: string | null = null;
  let wif: string | null = null;

  try {
    // 1. Validate wallet is unlocked
    if (!isWalletUnlocked()) {
      throw new Error('Wallet is locked. Please unlock to export private keys.');
    }

    // 2. Get wallet and account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts[payload.accountIndex];

    if (!account) {
      throw new Error(`Account with index ${payload.accountIndex} not found.`);
    }

    // 3. Validate account type (no multisig)
    if (account.accountType === 'multisig') {
      throw new Error(
        'Cannot export multisig accounts. Multisig accounts have multiple co-signer keys. ' +
        'Export co-signer xpubs instead.'
      );
    }

    // 4. Extract private key
    privateKeyHex = await extractPrivateKey(account, state, payload.password);

    // 5. Convert to WIF (always compressed)
    wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

    // 6. Clear private key hex from memory
    privateKeyHex = '0'.repeat(privateKeyHex.length);
    privateKeyHex = null;

    // 7. Optionally encrypt WIF
    const encrypted = await encryptWIF(wif, payload.password);

    // 8. Clear WIF from memory if encrypted
    if (encrypted.encrypted && wif) {
      wif = '0'.repeat(wif.length);
      wif = null;
    }

    // 9. Build metadata
    const metadata = {
      accountName: account.name,
      addressType: account.addressType,
      firstAddress: account.addresses[0]?.address || '',
      network: 'testnet' as const,
      timestamp: Date.now(),
      encrypted: encrypted.encrypted
    };

    // 10. Return result
    return {
      success: true,
      data: {
        wif: encrypted.wif,
        encryptedData: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        metadata
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EXPORT_PRIVATE_KEY] Error:', message);

    return {
      success: false,
      error: message
    };

  } finally {
    // Cleanup sensitive data
    if (privateKeyHex) {
      privateKeyHex = '0'.repeat(privateKeyHex.length);
    }
    if (wif) {
      wif = '0'.repeat(wif.length);
    }
  }
}
```

### IMPORT_PRIVATE_KEY Handler

```typescript
/**
 * Imports WIF private key as a new account
 *
 * Request:
 * {
 *   wif: string;               // Decrypted WIF
 *   name: string;              // Account name
 *   walletPassword?: string;   // Only for initial wallet setup
 * }
 *
 * Response:
 * {
 *   success: true;
 *   data: {
 *     account: WalletAccount;
 *     firstAddress: string;
 *   };
 * }
 */
async function handleImportPrivateKey(
  payload: {
    wif: string;
    name: string;
    walletPassword?: string;
  }
): Promise<MessageResponse> {
  let privateKeyHex: string | null = null;

  try {
    // 1. Rate limit check
    const rateLimitCheck = checkImportRateLimit('import-private-key');
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.error!);
    }

    // 2. Validate WIF
    const validation = WIFManager.validateWIF(payload.wif, 'testnet');
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid private key');
    }

    // 3. Check for duplicate
    const walletExists = await WalletStorage.hasWallet();
    if (walletExists) {
      const wallet = await WalletStorage.getWallet();
      const duplicate = await checkDuplicateWIF(payload.wif, wallet.accounts);
      if (duplicate.isDuplicate) {
        throw new Error(
          `This account is already imported as "${duplicate.existingAccountName}"`
        );
      }
    }

    // 4. Decode WIF to private key
    const decoded = KeyManager.decodeWIF(payload.wif, 'testnet');
    privateKeyHex = decoded.privateKey;

    // 5. Create new account
    const isInitialSetup = !walletExists;

    if (isInitialSetup) {
      // Creating new wallet with imported key as first account
      if (!payload.walletPassword) {
        throw new Error('Wallet password required for initial setup');
      }

      // Create wallet with dummy seed (not used for imported account)
      // Note: Could use a marker seed phrase like "imported imported imported..."
      const dummySeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      await WalletStorage.createWallet(
        dummySeed,
        payload.walletPassword,
        undefined, // No initial account
        { network: 'testnet', autoLockMinutes: 15 }
      );
    }

    // 6. Create account object
    const wallet = await WalletStorage.getWallet();
    const nextIndex = wallet.accounts.length;

    const account: WalletAccount = {
      index: nextIndex,
      name: payload.name,
      addressType: validation.addressType!,
      accountType: 'single',
      externalIndex: 0,
      internalIndex: 0,
      addresses: [
        {
          address: validation.firstAddress!,
          derivationPath: 'imported', // Mark as imported
          index: 0,
          isChange: false,
          used: false
        }
      ],
      imported: true, // Mark as imported account
      balance: { confirmed: 0, unconfirmed: 0, total: 0 }
    };

    // 7. Encrypt and store imported private key
    if (!state.encryptionKey) {
      throw new Error('Wallet must be unlocked to import private key');
    }

    const encryptedImportedKey = await CryptoUtils.encryptWithKey(
      payload.wif,
      state.encryptionKey
    );

    const importedKeyData: ImportedKeyData = {
      encryptedData: encryptedImportedKey.encryptedData,
      salt: '', // Not used with encryptWithKey
      iv: encryptedImportedKey.iv,
      type: 'wif'
    };

    await WalletStorage.storeImportedKey(nextIndex, importedKeyData);

    // 8. Add account to wallet
    await WalletStorage.addAccount(account);

    // 9. Clear private key from memory
    privateKeyHex = '0'.repeat(privateKeyHex.length);
    privateKeyHex = null;

    return {
      success: true,
      data: {
        account,
        firstAddress: validation.firstAddress!
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[IMPORT_PRIVATE_KEY] Error:', message);

    return {
      success: false,
      error: message
    };

  } finally {
    // Cleanup sensitive data
    if (privateKeyHex) {
      privateKeyHex = '0'.repeat(privateKeyHex.length);
    }
  }
}
```

### VALIDATE_WIF Handler

```typescript
/**
 * Validates WIF format and returns preview information
 *
 * Request:
 * {
 *   wif: string;
 * }
 *
 * Response:
 * {
 *   success: true;
 *   data: {
 *     valid: boolean;
 *     network?: 'testnet' | 'mainnet';
 *     firstAddress?: string;
 *     addressType?: string;
 *     compressed?: boolean;
 *     error?: string;
 *   };
 * }
 */
async function handleValidateWIF(
  payload: {
    wif: string;
  }
): Promise<MessageResponse> {
  try {
    // Validate WIF
    const validation = WIFManager.validateWIF(payload.wif, 'testnet');

    return {
      success: true,
      data: validation
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VALIDATE_WIF] Error:', message);

    return {
      success: false,
      error: message
    };
  }
}
```

### Integration into handleMessage

```typescript
async function handleMessage(message: Message): Promise<MessageResponse> {
  updateActivity();

  switch (message.type) {
    // ... existing cases ...

    case MessageType.EXPORT_PRIVATE_KEY:
      return handleExportPrivateKey(message.payload);

    case MessageType.IMPORT_PRIVATE_KEY:
      return handleImportPrivateKey(message.payload);

    case MessageType.VALIDATE_WIF:
      return handleValidateWIF(message.payload);

    // ... rest of cases ...
  }
}
```

---

## Account Creation from WIF

### Determining Address Type

```typescript
/**
 * Determines address type from WIF compression
 *
 * @param wif - WIF private key
 * @param network - Network
 * @returns Address type and first address
 */
function determineAddressType(
  wif: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): {
  addressType: 'legacy' | 'segwit' | 'native-segwit';
  firstAddress: string;
  compressed: boolean;
} {
  const decoded = KeyManager.decodeWIF(wif, network);
  const networkObj = network === 'testnet'
    ? bitcoin.networks.testnet
    : bitcoin.networks.bitcoin;

  const keyPair = ECPair.fromWIF(wif, networkObj);

  if (!decoded.compressed) {
    // Uncompressed keys → Legacy addresses only
    const { address } = bitcoin.payments.p2pkh({
      pubkey: keyPair.publicKey,
      network: networkObj
    });

    return {
      addressType: 'legacy',
      firstAddress: address!,
      compressed: false
    };
  } else {
    // Compressed keys → Native SegWit (most efficient)
    const { address } = bitcoin.payments.p2wpkh({
      pubkey: keyPair.publicKey,
      network: networkObj
    });

    return {
      addressType: 'native-segwit',
      firstAddress: address!,
      compressed: true
    };
  }
}
```

### Creating Imported Account

```typescript
/**
 * Creates account object for imported WIF
 *
 * @param wif - WIF private key
 * @param name - Account name
 * @param accountIndex - Account index
 * @param network - Network
 * @returns Account object
 */
function createImportedAccount(
  wif: string,
  name: string,
  accountIndex: number,
  network: 'testnet' | 'mainnet' = 'testnet'
): WalletAccount {
  const addressInfo = determineAddressType(wif, network);

  const account: WalletAccount = {
    index: accountIndex,
    name: name,
    addressType: addressInfo.addressType,
    accountType: 'single',
    externalIndex: 0,
    internalIndex: 0,
    addresses: [
      {
        address: addressInfo.firstAddress,
        derivationPath: 'imported', // Mark as imported (not derived)
        index: 0,
        isChange: false,
        used: false
      }
    ],
    imported: true, // Flag to identify imported accounts
    balance: {
      confirmed: 0,
      unconfirmed: 0,
      total: 0
    }
  };

  return account;
}
```

### Storing Imported Private Key

```typescript
/**
 * Encrypts and stores imported private key
 *
 * @param accountIndex - Account index
 * @param wif - WIF private key
 * @param encryptionKey - Password-derived encryption key (from state)
 */
async function storeImportedWIF(
  accountIndex: number,
  wif: string,
  encryptionKey: CryptoKey
): Promise<void> {
  // Encrypt WIF with password-derived key
  const encrypted = await CryptoUtils.encryptWithKey(wif, encryptionKey);

  // Create imported key data
  const importedKeyData: ImportedKeyData = {
    encryptedData: encrypted.encryptedData,
    salt: '', // Not used with encryptWithKey (key already derived)
    iv: encrypted.iv,
    type: 'wif'
  };

  // Store in wallet storage
  await WalletStorage.storeImportedKey(accountIndex, importedKeyData);
}
```

---

## Duplicate Detection

### Implementation

```typescript
/**
 * Checks if WIF private key is already imported
 *
 * @param wif - WIF private key to check
 * @param accounts - Existing wallet accounts
 * @returns Duplicate check result
 */
async function checkDuplicateWIF(
  wif: string,
  accounts: WalletAccount[]
): Promise<{
  isDuplicate: boolean;
  existingAccountName?: string;
  existingAccountIndex?: number;
}> {
  try {
    // Derive first address from WIF
    const addressInfo = WIFManager.deriveFirstAddress(wif, 'testnet');
    const derivedAddress = addressInfo.address;

    // Check all accounts for matching first address
    for (const account of accounts) {
      // Skip multisig accounts
      if (account.accountType === 'multisig') {
        continue;
      }

      // For imported accounts, check first address
      if (account.imported && account.addresses.length > 0) {
        if (account.addresses[0].address === derivedAddress) {
          return {
            isDuplicate: true,
            existingAccountName: account.name,
            existingAccountIndex: account.index
          };
        }
      }

      // For HD accounts, check all addresses (defensive - should never match)
      for (const addr of account.addresses) {
        if (addr.address === derivedAddress) {
          return {
            isDuplicate: true,
            existingAccountName: account.name,
            existingAccountIndex: account.index
          };
        }
      }
    }

    return { isDuplicate: false };

  } catch (error) {
    // If we can't derive address, allow import (user will notice if duplicate)
    console.error('[checkDuplicateWIF] Error:', error);
    return { isDuplicate: false };
  }
}
```

### Why Compare by First Address?

- ✅ **Deterministic**: Same private key always produces same first address
- ✅ **Unique**: First address is unique per private key
- ✅ **Fast**: No need to derive multiple addresses
- ✅ **Reliable**: Works for both HD and imported accounts

### Edge Cases

**Case 1: Re-importing after deletion**
- Allowed
- Creates new account with new index
- Lost transaction history remains lost

**Case 2: Importing HD-derived private key**
- Defensive check includes HD account addresses
- Should never happen (user exports from other wallet)
- If it does happen, blocked with clear error message

---

## Network Validation

### Strict Enforcement

```typescript
/**
 * CRITICAL: Strict network validation
 *
 * This function enforces testnet-only imports.
 * Mainnet keys are REJECTED IMMEDIATELY.
 */
function enforceNetwork(wif: string): void {
  const network = WIFManager.detectNetwork(wif);

  if (network === 'invalid') {
    throw new Error('Invalid WIF prefix. Unrecognized network.');
  }

  if (network !== 'testnet') {
    throw new Error(
      `REJECTED: This is a ${network} private key. ` +
      `This wallet only accepts testnet keys. ` +
      `DO NOT import mainnet keys on a testnet wallet.`
    );
  }
}
```

### Network Detection Logic

```typescript
/**
 * Detects network from WIF prefix
 */
export function detectNetwork(wif: string): 'testnet' | 'mainnet' | 'invalid' {
  const firstChar = wif[0];

  // Testnet WIF prefixes
  if (firstChar === '9') {
    return 'testnet'; // Uncompressed testnet private key
  }
  if (firstChar === 'c') {
    return 'testnet'; // Compressed testnet private key
  }

  // Mainnet WIF prefixes
  if (firstChar === '5') {
    return 'mainnet'; // Uncompressed mainnet private key
  }
  if (firstChar === 'K' || firstChar === 'L') {
    return 'mainnet'; // Compressed mainnet private key
  }

  // Unknown prefix
  return 'invalid';
}
```

### Error Messages

```typescript
// Clear, user-friendly error messages

// Wrong network
"REJECTED: This is a mainnet private key. This wallet only accepts testnet keys. DO NOT import mainnet keys on a testnet wallet."

// Invalid prefix
"Invalid WIF prefix. Unrecognized network."

// Generic validation failure
"Invalid private key format. Please check the WIF string."
```

### Security Notes

- ❌ **NEVER** process mainnet keys beyond initial validation
- ❌ **NEVER** decode mainnet keys
- ❌ **NEVER** store mainnet keys
- ✅ **ALWAYS** validate network before any other operation
- ✅ **ALWAYS** reject mainnet keys with clear error message

---

## Error Handling

### Error Codes Enum

```typescript
export enum PrivateKeyErrorCode {
  // Export errors
  WALLET_LOCKED = 'WALLET_LOCKED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  MULTISIG_NOT_SUPPORTED = 'MULTISIG_NOT_SUPPORTED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',

  // Import errors
  INVALID_WIF_FORMAT = 'INVALID_WIF_FORMAT',
  INVALID_WIF_CHECKSUM = 'INVALID_WIF_CHECKSUM',
  WRONG_NETWORK = 'WRONG_NETWORK',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}
```

### Error Response Structure

```typescript
interface ErrorResponse {
  success: false;
  error: string;        // User-friendly error message
  code?: string;        // Error code for specific handling
  details?: any;        // Optional additional error details
}
```

### Error Handling Examples

```typescript
// Export - Wallet locked
if (!isWalletUnlocked()) {
  return {
    success: false,
    error: 'Wallet is locked. Please unlock to export private keys.',
    code: PrivateKeyErrorCode.WALLET_LOCKED
  };
}

// Export - Account not found
if (!account) {
  return {
    success: false,
    error: `Account with index ${accountIndex} not found.`,
    code: PrivateKeyErrorCode.ACCOUNT_NOT_FOUND
  };
}

// Export - Multisig not supported
if (account.accountType === 'multisig') {
  return {
    success: false,
    error: 'Cannot export multisig accounts. Multisig accounts have multiple co-signer keys. Export co-signer xpubs instead.',
    code: PrivateKeyErrorCode.MULTISIG_NOT_SUPPORTED
  };
}

// Import - Invalid WIF format
const formatError = WIFManager.validateFormat(wif);
if (formatError) {
  return {
    success: false,
    error: formatError,
    code: PrivateKeyErrorCode.INVALID_WIF_FORMAT
  };
}

// Import - Wrong network
const networkError = WIFManager.validateNetwork(wif, 'testnet');
if (networkError) {
  return {
    success: false,
    error: networkError,
    code: PrivateKeyErrorCode.WRONG_NETWORK
  };
}

// Import - Duplicate key
const duplicate = await checkDuplicateWIF(wif, wallet.accounts);
if (duplicate.isDuplicate) {
  return {
    success: false,
    error: `This account is already imported as "${duplicate.existingAccountName}"`,
    code: PrivateKeyErrorCode.DUPLICATE_KEY,
    details: {
      existingAccountIndex: duplicate.existingAccountIndex
    }
  };
}

// Import - Decryption failed
catch (error) {
  if (error.message.includes('Decryption failed')) {
    return {
      success: false,
      error: 'Incorrect file password or corrupted file.',
      code: PrivateKeyErrorCode.DECRYPTION_FAILED
    };
  }
}

// Import - Rate limit exceeded
const rateLimitCheck = checkImportRateLimit('import-private-key');
if (!rateLimitCheck.allowed) {
  return {
    success: false,
    error: rateLimitCheck.error!,
    code: PrivateKeyErrorCode.RATE_LIMIT_EXCEEDED
  };
}
```

### Generic Error Handling

```typescript
// Catch-all error handler
catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error('[HANDLER_NAME] Error:', message);

  // Never include sensitive data in error messages
  return {
    success: false,
    error: 'Operation failed. Please try again.',
    code: PrivateKeyErrorCode.EXPORT_FAILED // or IMPORT_FAILED
  };
}
```

---

## Security Implementation

### Memory Cleanup

```typescript
/**
 * Secure memory cleanup for sensitive data
 */

// Pattern 1: Clear string variables
let privateKey: string | null = 'sensitive data';

// Use the variable
await processPrivateKey(privateKey);

// Clear from memory
privateKey = '0'.repeat(privateKey.length);
privateKey = null;

// Pattern 2: Use finally block
let wif: string | null = null;

try {
  wif = await exportAccountAsWIF(account, state);
  await processWIF(wif);
} finally {
  // Always cleanup, even on error
  if (wif) {
    wif = '0'.repeat(wif.length);
    wif = null;
  }
}

// Pattern 3: Immediate cleanup after use
const privateKeyHex = await extractPrivateKey(account, state);
const wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

// Clear immediately after conversion
privateKeyHex = '0'.repeat(privateKeyHex.length);
```

### Never Log Sensitive Data

```typescript
// ❌ WRONG - NEVER DO THIS
console.log('Exporting WIF:', wif);
console.log('Private key:', privateKeyHex);
throw new Error(`Failed to export: ${wif}`);

// ✅ CORRECT
console.log('Exporting private key for account', accountIndex);
console.error('[EXPORT_PRIVATE_KEY] Error:', error.message);
throw new Error('Export failed. Please try again.');
```

### Validate Wallet Unlock State

```typescript
// Always check wallet is unlocked before sensitive operations
if (!isWalletUnlocked()) {
  throw new Error('Wallet is locked. Please unlock to export private keys.');
}

// Check decrypted seed exists
if (!state.decryptedSeed) {
  throw new Error('Wallet seed not available. Please unlock wallet.');
}

// Check encryption key exists (for imported keys)
if (!state.encryptionKey) {
  throw new Error('Wallet must be unlocked to import private keys.');
}
```

### Clear Sensitive Data on Errors

```typescript
// Pattern: Always cleanup in finally block
let privateKey: string | null = null;
let wif: string | null = null;

try {
  // Sensitive operations
  privateKey = await extractPrivateKey(account, state);
  wif = KeyManager.privateKeyToWIF(privateKey, 'testnet', true);

  return { success: true, data: { wif } };

} catch (error) {
  console.error('Export error:', error.message);
  throw error;

} finally {
  // ALWAYS cleanup sensitive data
  if (privateKey) {
    privateKey = '0'.repeat(privateKey.length);
    privateKey = null;
  }
  if (wif) {
    wif = '0'.repeat(wif.length);
    wif = null;
  }
}
```

### Secure Error Messages

```typescript
// Never leak sensitive information in errors

// ❌ WRONG
throw new Error(`Decryption failed for WIF: ${wif}`);
throw new Error(`Password "${password}" is incorrect`);

// ✅ CORRECT
throw new Error('Decryption failed. Check password and file integrity.');
throw new Error('Incorrect password or corrupted data.');
```

### Input Validation

```typescript
// Validate all inputs before processing

// WIF validation
if (!wif || typeof wif !== 'string') {
  throw new Error('Invalid input: WIF must be a non-empty string');
}

// Account index validation
if (typeof accountIndex !== 'number' || accountIndex < 0) {
  throw new Error('Invalid account index');
}

// Password validation (if required)
if (password !== undefined && typeof password !== 'string') {
  throw new Error('Invalid password type');
}

// Account name validation
if (!name || name.trim().length === 0) {
  throw new Error('Account name cannot be empty');
}
```

---

## TypeScript Interfaces

### Message Type Definitions

```typescript
// Add to src/shared/types/index.ts

export enum MessageType {
  // ... existing types ...

  EXPORT_PRIVATE_KEY = 'EXPORT_PRIVATE_KEY',
  IMPORT_PRIVATE_KEY = 'IMPORT_PRIVATE_KEY',
  VALIDATE_WIF = 'VALIDATE_WIF',
}
```

### Request/Response Interfaces

```typescript
// Export Private Key
export interface ExportPrivateKeyRequest {
  accountIndex: number;
  password?: string; // Optional password for encryption
}

export interface ExportPrivateKeyResponse {
  success: true;
  data: {
    wif?: string;             // If plaintext
    encryptedData?: string;   // If encrypted
    salt?: string;
    iv?: string;
    metadata: {
      accountName: string;
      addressType: string;
      firstAddress: string;
      network: 'testnet' | 'mainnet';
      timestamp: number;
      encrypted: boolean;
    };
  };
}

// Import Private Key
export interface ImportPrivateKeyRequest {
  wif: string;               // Decrypted WIF
  name: string;              // Account name
  walletPassword?: string;   // Only for initial wallet setup
}

export interface ImportPrivateKeyResponse {
  success: true;
  data: {
    account: WalletAccount;
    firstAddress: string;
  };
}

// Validate WIF
export interface ValidateWIFRequest {
  wif: string;
}

export interface ValidateWIFResponse {
  success: true;
  data: {
    valid: boolean;
    network?: 'testnet' | 'mainnet';
    firstAddress?: string;
    addressType?: 'legacy' | 'segwit' | 'native-segwit';
    compressed?: boolean;
    error?: string;
  };
}
```

### Error Response Interface

```typescript
export interface PrivateKeyErrorResponse {
  success: false;
  error: string;
  code?: PrivateKeyErrorCode;
  details?: {
    existingAccountIndex?: number;
    existingAccountName?: string;
  };
}
```

### Internal Data Structures

```typescript
// WIF Validation Result
export interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: 'legacy' | 'segwit' | 'native-segwit';
  compressed?: boolean;
  error?: string;
}

// Duplicate Check Result
export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingAccountName?: string;
  existingAccountIndex?: number;
}

// Encrypted WIF Result
export interface EncryptedWIFResult {
  encrypted: boolean;
  wif?: string;           // If plaintext
  encryptedData?: string; // If encrypted
  salt?: string;
  iv?: string;
}
```

---

## Integration with Existing Code

### KeyManager Integration

**No modifications needed** - use existing methods:

```typescript
// Already exists in KeyManager
KeyManager.privateKeyToWIF(privateKeyHex, network, compressed);
KeyManager.decodeWIF(wif, network);
KeyManager.validateWIF(wif, network);
```

**What we're using:**
- ✅ `privateKeyToWIF()` - Convert hex to WIF
- ✅ `decodeWIF()` - Convert WIF to hex + get compression info
- ✅ `validateWIF()` - Validate WIF checksum

**No changes needed** - already implemented and tested.

### WalletStorage Integration

**Use existing imported key methods:**

```typescript
// Already exists in WalletStorage
await WalletStorage.storeImportedKey(accountIndex, importedKeyData);
await WalletStorage.getImportedKey(accountIndex);
await WalletStorage.unlockImportedKey(accountIndex, password);
```

**Integration pattern:**

```typescript
// 1. Encrypt WIF with password-derived key
const encrypted = await CryptoUtils.encryptWithKey(wif, state.encryptionKey);

// 2. Create ImportedKeyData
const importedKeyData: ImportedKeyData = {
  encryptedData: encrypted.encryptedData,
  salt: '', // Not used with encryptWithKey
  iv: encrypted.iv,
  type: 'wif'
};

// 3. Store in wallet
await WalletStorage.storeImportedKey(accountIndex, importedKeyData);
```

**No modifications needed** - WalletStorage v2 already supports this.

### CryptoUtils Integration

**Use existing encryption methods:**

```typescript
// For file encryption (with password)
const encrypted = await CryptoUtils.encrypt(wif, password);
// Returns: { encryptedData, salt, iv }

// For storage encryption (with pre-derived key)
const encrypted = await CryptoUtils.encryptWithKey(wif, state.encryptionKey);
// Returns: { encryptedData, iv, salt: '' }

// For decryption (with password)
const wif = await CryptoUtils.decrypt(encryptedData, password, salt, iv);

// For decryption (with pre-derived key)
const wif = await CryptoUtils.decryptWithKey(encryptedData, state.encryptionKey, iv);
```

**No modifications needed** - all methods already exist.

### Background Index Integration

**Add to `src/background/index.ts`:**

```typescript
// Import new WIFManager
import { WIFManager } from './wallet/WIFManager';

// Add message handlers to handleMessage switch
case MessageType.EXPORT_PRIVATE_KEY:
  return handleExportPrivateKey(message.payload);

case MessageType.IMPORT_PRIVATE_KEY:
  return handleImportPrivateKey(message.payload);

case MessageType.VALIDATE_WIF:
  return handleValidateWIF(message.payload);
```

**File structure after changes:**

```typescript
// src/background/index.ts

import { WIFManager } from './wallet/WIFManager'; // NEW

// ... existing imports ...

// ... existing state and helpers ...

// NEW: Extract private key function
async function extractPrivateKey(...) { ... }

// NEW: Encrypt WIF function
async function encryptWIF(...) { ... }

// NEW: Decrypt WIF function
async function decryptWIF(...) { ... }

// NEW: Check duplicate WIF function
async function checkDuplicateWIF(...) { ... }

// NEW: Message handlers
async function handleExportPrivateKey(payload) { ... }
async function handleImportPrivateKey(payload) { ... }
async function handleValidateWIF(payload) { ... }

// Modify handleMessage
async function handleMessage(message: Message): Promise<MessageResponse> {
  // ... existing cases ...

  case MessageType.EXPORT_PRIVATE_KEY:
    return handleExportPrivateKey(message.payload);

  case MessageType.IMPORT_PRIVATE_KEY:
    return handleImportPrivateKey(message.payload);

  case MessageType.VALIDATE_WIF:
    return handleValidateWIF(message.payload);

  // ... rest of cases ...
}
```

### No Breaking Changes

- ✅ All changes are additive (new handlers, new module)
- ✅ No modifications to existing functions
- ✅ No changes to existing message types
- ✅ No changes to storage schema (uses existing v2 format)
- ✅ Backward compatible with existing wallets

---

## Testing Strategy

### Unit Tests

**Test File: `src/background/wallet/__tests__/WIFManager.test.ts`**

```typescript
describe('WIFManager', () => {
  describe('validateFormat', () => {
    it('accepts valid testnet WIF (compressed)', () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      expect(WIFManager.validateFormat(wif)).toBeNull();
    });

    it('accepts valid testnet WIF (uncompressed)', () => {
      const wif = '92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc';
      expect(WIFManager.validateFormat(wif)).toBeNull();
    });

    it('rejects invalid Base58 characters', () => {
      const wif = 'invalid-wif-with-dashes';
      expect(WIFManager.validateFormat(wif)).toContain('Base58');
    });

    it('rejects incorrect length', () => {
      const wif = 'cVt4o7BGAig'; // Too short
      expect(WIFManager.validateFormat(wif)).toContain('length');
    });
  });

  describe('detectNetwork', () => {
    it('detects testnet compressed', () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      expect(WIFManager.detectNetwork(wif)).toBe('testnet');
    });

    it('detects testnet uncompressed', () => {
      const wif = '92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc';
      expect(WIFManager.detectNetwork(wif)).toBe('testnet');
    });

    it('detects mainnet compressed', () => {
      const wif = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';
      expect(WIFManager.detectNetwork(wif)).toBe('mainnet');
    });

    it('detects mainnet uncompressed', () => {
      const wif = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';
      expect(WIFManager.detectNetwork(wif)).toBe('mainnet');
    });

    it('returns invalid for unknown prefix', () => {
      const wif = 'xVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      expect(WIFManager.detectNetwork(wif)).toBe('invalid');
    });
  });

  describe('validateNetwork', () => {
    it('accepts testnet WIF when testnet required', () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      expect(WIFManager.validateNetwork(wif, 'testnet')).toBeNull();
    });

    it('rejects mainnet WIF when testnet required', () => {
      const wif = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';
      const error = WIFManager.validateNetwork(wif, 'testnet');
      expect(error).toContain('mainnet');
      expect(error).toContain('testnet');
    });

    it('rejects invalid prefix', () => {
      const wif = 'xVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      const error = WIFManager.validateNetwork(wif, 'testnet');
      expect(error).toContain('Invalid');
    });
  });

  describe('deriveFirstAddress', () => {
    it('derives native-segwit address for compressed key', () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      const result = WIFManager.deriveFirstAddress(wif, 'testnet');

      expect(result.addressType).toBe('native-segwit');
      expect(result.compressed).toBe(true);
      expect(result.address).toMatch(/^tb1/); // Testnet bech32
    });

    it('derives legacy address for uncompressed key', () => {
      const wif = '92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc';
      const result = WIFManager.deriveFirstAddress(wif, 'testnet');

      expect(result.addressType).toBe('legacy');
      expect(result.compressed).toBe(false);
      expect(result.address).toMatch(/^[mn]/); // Testnet P2PKH
    });
  });

  describe('validateWIF', () => {
    it('validates complete testnet WIF successfully', () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      const result = WIFManager.validateWIF(wif, 'testnet');

      expect(result.valid).toBe(true);
      expect(result.network).toBe('testnet');
      expect(result.firstAddress).toBeDefined();
      expect(result.addressType).toBe('native-segwit');
      expect(result.error).toBeUndefined();
    });

    it('rejects mainnet WIF on testnet wallet', () => {
      const wif = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';
      const result = WIFManager.validateWIF(wif, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.network).toBe('mainnet');
      expect(result.error).toContain('Wrong network');
    });

    it('rejects invalid checksum', () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpx'; // Wrong checksum
      const result = WIFManager.validateWIF(wif, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('checksum');
    });
  });
});
```

**Test File: `src/background/__tests__/privateKeyExportImport.test.ts`**

```typescript
describe('Private Key Export/Import', () => {
  describe('Export', () => {
    it('exports HD account as WIF', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: undefined // No encryption
      });

      expect(response.success).toBe(true);
      expect(response.data.wif).toBeDefined();
      expect(response.data.encrypted).toBe(false);
      expect(response.data.metadata.network).toBe('testnet');
    });

    it('exports with password protection', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: 'SecurePassword123!'
      });

      expect(response.success).toBe(true);
      expect(response.data.encryptedData).toBeDefined();
      expect(response.data.salt).toBeDefined();
      expect(response.data.iv).toBeDefined();
      expect(response.data.metadata.encrypted).toBe(true);
    });

    it('rejects export when wallet locked', async () => {
      state.isUnlocked = false;

      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('locked');
    });

    it('rejects export of multisig account', async () => {
      // Assume account index 1 is multisig
      const response = await handleExportPrivateKey({
        accountIndex: 1
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('multisig');
    });
  });

  describe('Import', () => {
    it('imports valid testnet WIF', async () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

      const response = await handleImportPrivateKey({
        wif,
        name: 'Imported Account'
      });

      expect(response.success).toBe(true);
      expect(response.data.account.name).toBe('Imported Account');
      expect(response.data.account.imported).toBe(true);
      expect(response.data.firstAddress).toBeDefined();
    });

    it('rejects mainnet WIF', async () => {
      const wif = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';

      const response = await handleImportPrivateKey({
        wif,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('mainnet');
    });

    it('detects duplicate import', async () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

      // Import once
      await handleImportPrivateKey({ wif, name: 'First Import' });

      // Try to import again
      const response = await handleImportPrivateKey({
        wif,
        name: 'Second Import'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('already imported');
    });

    it('enforces rate limit', async () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

      // Import 5 times (rate limit)
      for (let i = 0; i < 5; i++) {
        await handleImportPrivateKey({ wif: generateRandomWIF(), name: `Account ${i}` });
      }

      // 6th import should fail
      const response = await handleImportPrivateKey({ wif, name: 'Too Many' });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Too many');
    });
  });

  describe('Validate', () => {
    it('validates testnet WIF', async () => {
      const wif = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

      const response = await handleValidateWIF({ wif });

      expect(response.success).toBe(true);
      expect(response.data.valid).toBe(true);
      expect(response.data.network).toBe('testnet');
      expect(response.data.firstAddress).toBeDefined();
    });

    it('validates mainnet WIF (but marks as wrong network)', async () => {
      const wif = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';

      const response = await handleValidateWIF({ wif });

      expect(response.success).toBe(true);
      expect(response.data.valid).toBe(false);
      expect(response.data.network).toBe('mainnet');
      expect(response.data.error).toContain('Wrong network');
    });
  });
});
```

### Integration Tests

**Test: Export-Import Roundtrip**

```typescript
describe('Export-Import Roundtrip', () => {
  it('successfully exports and imports same account (plaintext)', async () => {
    // 1. Export account
    const exportResponse = await handleExportPrivateKey({
      accountIndex: 0,
      password: undefined
    });

    expect(exportResponse.success).toBe(true);
    const wif = exportResponse.data.wif!;

    // 2. Import to new wallet
    const importResponse = await handleImportPrivateKey({
      wif,
      name: 'Imported Account'
    });

    expect(importResponse.success).toBe(true);

    // 3. Verify same first address
    expect(importResponse.data.firstAddress).toBe(
      exportResponse.data.metadata.firstAddress
    );
  });

  it('successfully exports and imports with password protection', async () => {
    const password = 'SecureExportPassword123!';

    // 1. Export with password
    const exportResponse = await handleExportPrivateKey({
      accountIndex: 0,
      password
    });

    expect(exportResponse.success).toBe(true);

    // 2. Decrypt exported data
    const wif = await CryptoUtils.decrypt(
      exportResponse.data.encryptedData!,
      password,
      exportResponse.data.salt!,
      exportResponse.data.iv!
    );

    // 3. Import decrypted WIF
    const importResponse = await handleImportPrivateKey({
      wif,
      name: 'Imported Account'
    });

    expect(importResponse.success).toBe(true);

    // 4. Verify same address
    expect(importResponse.data.firstAddress).toBe(
      exportResponse.data.metadata.firstAddress
    );
  });

  it('fails import with wrong password', async () => {
    const correctPassword = 'CorrectPassword';
    const wrongPassword = 'WrongPassword';

    // Export with password
    const exportResponse = await handleExportPrivateKey({
      accountIndex: 0,
      password: correctPassword
    });

    // Try to decrypt with wrong password
    await expect(
      CryptoUtils.decrypt(
        exportResponse.data.encryptedData!,
        wrongPassword,
        exportResponse.data.salt!,
        exportResponse.data.iv!
      )
    ).rejects.toThrow('Decryption failed');
  });
});
```

### Manual Testing Checklist

- [ ] Export HD account (plaintext) → file downloads
- [ ] Export HD account (password) → encrypted file downloads
- [ ] Export imported account (plaintext) → file downloads
- [ ] Export imported account (password) → encrypted file downloads
- [ ] Import valid testnet WIF → account created
- [ ] Import mainnet WIF → rejected with error
- [ ] Import duplicate WIF → rejected with error
- [ ] Import corrupted WIF → rejected with error
- [ ] Validate valid WIF → shows preview
- [ ] Validate invalid WIF → shows error
- [ ] Export when wallet locked → error
- [ ] Export multisig account → error
- [ ] Import rate limit → 6th import fails

---

## Implementation Examples

### Complete EXPORT_PRIVATE_KEY Handler

```typescript
async function handleExportPrivateKey(
  payload: {
    accountIndex: number;
    password?: string;
  }
): Promise<MessageResponse> {
  let privateKeyHex: string | null = null;
  let wif: string | null = null;

  try {
    // 1. Validate wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock to export private keys.',
        code: PrivateKeyErrorCode.WALLET_LOCKED
      };
    }

    // 2. Get wallet and account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts[payload.accountIndex];

    if (!account) {
      return {
        success: false,
        error: `Account with index ${payload.accountIndex} not found.`,
        code: PrivateKeyErrorCode.ACCOUNT_NOT_FOUND
      };
    }

    // 3. Validate account type
    if (account.accountType === 'multisig') {
      return {
        success: false,
        error: 'Cannot export multisig accounts. Multisig accounts have multiple co-signer keys. Export co-signer xpubs instead.',
        code: PrivateKeyErrorCode.MULTISIG_NOT_SUPPORTED
      };
    }

    // 4. Extract private key (hex format)
    if (account.imported) {
      // Imported account - retrieve from storage
      const importedKey = await extractImportedAccountPrivateKey(
        account.index,
        wallet.settings.network
      );

      // If already WIF, decode to hex
      if (KeyManager.validateWIF(importedKey, 'testnet')) {
        const decoded = KeyManager.decodeWIF(importedKey, 'testnet');
        privateKeyHex = decoded.privateKey;
      } else {
        privateKeyHex = importedKey;
      }
    } else {
      // HD account - derive from seed
      privateKeyHex = await extractHDAccountPrivateKey(
        account.index,
        account.addressType as AddressType,
        state.decryptedSeed!
      );
    }

    // 5. Convert to WIF (always compressed)
    wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

    // 6. Clear private key hex from memory
    privateKeyHex = '0'.repeat(privateKeyHex.length);
    privateKeyHex = null;

    // 7. Optionally encrypt WIF
    const encrypted = await encryptWIF(wif, payload.password);

    // 8. Clear WIF from memory if encrypted
    if (encrypted.encrypted && wif) {
      wif = '0'.repeat(wif.length);
      wif = null;
    }

    // 9. Build metadata
    const metadata = {
      accountName: account.name,
      addressType: account.addressType,
      firstAddress: account.addresses[0]?.address || '',
      network: 'testnet' as const,
      timestamp: Date.now(),
      encrypted: encrypted.encrypted
    };

    // 10. Return result
    return {
      success: true,
      data: {
        wif: encrypted.wif,
        encryptedData: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        metadata
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EXPORT_PRIVATE_KEY] Error:', message);

    return {
      success: false,
      error: message,
      code: PrivateKeyErrorCode.EXPORT_FAILED
    };

  } finally {
    // Cleanup sensitive data
    if (privateKeyHex) {
      privateKeyHex = '0'.repeat(privateKeyHex.length);
    }
    if (wif) {
      wif = '0'.repeat(wif.length);
    }
  }
}
```

### Complete IMPORT_PRIVATE_KEY Handler

```typescript
async function handleImportPrivateKey(
  payload: {
    wif: string;
    name: string;
    walletPassword?: string;
  }
): Promise<MessageResponse> {
  let privateKeyHex: string | null = null;

  try {
    // 1. Rate limit check
    const rateLimitCheck = checkImportRateLimit('import-private-key');
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error!,
        code: PrivateKeyErrorCode.RATE_LIMIT_EXCEEDED
      };
    }

    // 2. Validate WIF
    const validation = WIFManager.validateWIF(payload.wif, 'testnet');
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Invalid private key',
        code: validation.error?.includes('network')
          ? PrivateKeyErrorCode.WRONG_NETWORK
          : PrivateKeyErrorCode.INVALID_WIF_FORMAT
      };
    }

    // 3. Check for duplicate
    const walletExists = await WalletStorage.hasWallet();
    if (walletExists) {
      const wallet = await WalletStorage.getWallet();
      const duplicate = await checkDuplicateWIF(payload.wif, wallet.accounts);

      if (duplicate.isDuplicate) {
        return {
          success: false,
          error: `This account is already imported as "${duplicate.existingAccountName}"`,
          code: PrivateKeyErrorCode.DUPLICATE_KEY,
          details: {
            existingAccountIndex: duplicate.existingAccountIndex
          }
        };
      }
    }

    // 4. Decode WIF to private key
    const decoded = KeyManager.decodeWIF(payload.wif, 'testnet');
    privateKeyHex = decoded.privateKey;

    // 5. Create new account
    const isInitialSetup = !walletExists;

    if (isInitialSetup) {
      if (!payload.walletPassword) {
        return {
          success: false,
          error: 'Wallet password required for initial setup',
          code: PrivateKeyErrorCode.IMPORT_FAILED
        };
      }

      // Create wallet with dummy seed
      const dummySeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      await WalletStorage.createWallet(
        dummySeed,
        payload.walletPassword,
        undefined,
        { network: 'testnet', autoLockMinutes: 15 }
      );

      // Unlock wallet to get encryption key
      state.decryptedSeed = dummySeed;
      state.isUnlocked = true;

      // Derive encryption key from password
      const salt = crypto.getRandomValues(new Uint8Array(32));
      state.encryptionKey = await CryptoUtils.deriveKey(
        payload.walletPassword,
        salt,
        100000
      );
    }

    // 6. Create account object
    const wallet = await WalletStorage.getWallet();
    const nextIndex = wallet.accounts.length;

    const account: WalletAccount = {
      index: nextIndex,
      name: payload.name,
      addressType: validation.addressType!,
      accountType: 'single',
      externalIndex: 0,
      internalIndex: 0,
      addresses: [
        {
          address: validation.firstAddress!,
          derivationPath: 'imported',
          index: 0,
          isChange: false,
          used: false
        }
      ],
      imported: true,
      balance: { confirmed: 0, unconfirmed: 0, total: 0 }
    };

    // 7. Encrypt and store imported WIF
    if (!state.encryptionKey) {
      return {
        success: false,
        error: 'Wallet must be unlocked to import private key',
        code: PrivateKeyErrorCode.WALLET_LOCKED
      };
    }

    const encrypted = await CryptoUtils.encryptWithKey(
      payload.wif,
      state.encryptionKey
    );

    const importedKeyData: ImportedKeyData = {
      encryptedData: encrypted.encryptedData,
      salt: '',
      iv: encrypted.iv,
      type: 'wif'
    };

    await WalletStorage.storeImportedKey(nextIndex, importedKeyData);

    // 8. Add account to wallet
    await WalletStorage.addAccount(account);

    // 9. Clear private key from memory
    privateKeyHex = '0'.repeat(privateKeyHex.length);
    privateKeyHex = null;

    return {
      success: true,
      data: {
        account,
        firstAddress: validation.firstAddress!
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[IMPORT_PRIVATE_KEY] Error:', message);

    return {
      success: false,
      error: message,
      code: PrivateKeyErrorCode.IMPORT_FAILED
    };

  } finally {
    if (privateKeyHex) {
      privateKeyHex = '0'.repeat(privateKeyHex.length);
    }
  }
}
```

---

## Summary

This backend implementation plan provides:

✅ **Complete architecture** with new WIFManager module
✅ **Integration with existing code** (KeyManager, CryptoUtils, WalletStorage)
✅ **3 message handlers** with full implementations
✅ **Security-first design** with memory cleanup and input validation
✅ **Network validation** with strict testnet enforcement
✅ **Duplicate detection** to prevent key collisions
✅ **Error handling** with specific error codes
✅ **TypeScript interfaces** for type safety
✅ **Testing strategy** with unit and integration tests
✅ **Implementation examples** with complete code

**Ready for implementation** - all code patterns, security considerations, and integration points are specified.

**Next Steps:**
1. Create `WIFManager.ts` module
2. Add message handlers to `index.ts`
3. Add TypeScript types to `types/index.ts`
4. Write unit tests for `WIFManager`
5. Write integration tests for message handlers
6. Manual testing on testnet
7. Security review by security expert
8. Code review and merge

---

**Document Status**: Implementation Ready ✅
**Last Updated**: 2025-10-19
**Maintained By**: Backend Development Team
