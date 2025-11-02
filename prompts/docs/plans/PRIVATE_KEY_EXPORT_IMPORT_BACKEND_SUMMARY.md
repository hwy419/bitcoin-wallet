# Private Key Export/Import - Backend Implementation Summary

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Implementation Ready
**Full Plan**: See `PRIVATE_KEY_EXPORT_IMPORT_BACKEND_PLAN.md`

---

## Quick Overview

This feature allows users to export individual account private keys in WIF (Wallet Import Format) with optional password protection, and import them into new or existing wallets.

### Key Features

- ✅ Export HD account private keys as WIF
- ✅ Export imported account private keys as WIF
- ✅ Optional password protection for exported files (AES-256-GCM, 100K PBKDF2)
- ✅ Import WIF private keys to create new accounts
- ✅ Real-time WIF validation with preview
- ✅ Strict testnet enforcement (reject mainnet keys)
- ✅ Duplicate detection to prevent key collisions
- ✅ Rate limiting for import operations (5 per minute)

---

## Architecture Summary

### New Components

**WIFManager Module** (`src/background/wallet/WIFManager.ts`):
- WIF format validation (Base58Check, length, checksum)
- Network detection from WIF prefix (testnet vs mainnet)
- Network validation (enforce testnet only)
- Address derivation from WIF for preview
- Complete validation with error messages

**Message Handlers** (in `src/background/index.ts`):
- `EXPORT_PRIVATE_KEY` - Extract private key and convert to WIF
- `IMPORT_PRIVATE_KEY` - Parse WIF and create account
- `VALIDATE_WIF` - Real-time validation with preview

### Existing Components (Reused)

**KeyManager** (existing):
- `privateKeyToWIF()` - Convert hex to WIF ✅
- `decodeWIF()` - Convert WIF to hex ✅
- `validateWIF()` - Validate checksum ✅

**CryptoUtils** (existing):
- `encrypt()` - File encryption with password ✅
- `encryptWithKey()` - Storage encryption with pre-derived key ✅
- `decrypt()` / `decryptWithKey()` - Decryption ✅

**WalletStorage** (existing):
- `storeImportedKey()` - Store encrypted imported key ✅
- `getImportedKey()` - Retrieve encrypted imported key ✅
- `addAccount()` - Add account to wallet ✅

---

## Implementation Checklist

### Phase 1: WIFManager Module
- [ ] Create `src/background/wallet/WIFManager.ts`
- [ ] Implement `validateFormat(wif)` - Base58 and length checks
- [ ] Implement `detectNetwork(wif)` - Detect testnet vs mainnet
- [ ] Implement `validateNetwork(wif, requiredNetwork)` - Enforce network
- [ ] Implement `deriveFirstAddress(wif, network)` - Preview address
- [ ] Implement `validateWIF(wif, requiredNetwork)` - Complete validation
- [ ] Write unit tests for all WIFManager methods

### Phase 2: Message Type Definitions
- [ ] Add `EXPORT_PRIVATE_KEY` to MessageType enum
- [ ] Add `IMPORT_PRIVATE_KEY` to MessageType enum
- [ ] Add `VALIDATE_WIF` to MessageType enum
- [ ] Define `ExportPrivateKeyRequest` interface
- [ ] Define `ExportPrivateKeyResponse` interface
- [ ] Define `ImportPrivateKeyRequest` interface
- [ ] Define `ImportPrivateKeyResponse` interface
- [ ] Define `ValidateWIFRequest` interface
- [ ] Define `ValidateWIFResponse` interface
- [ ] Define `PrivateKeyErrorCode` enum

### Phase 3: Helper Functions
- [ ] Implement `extractHDAccountPrivateKey()` - Extract from HD wallet
- [ ] Implement `extractImportedAccountPrivateKey()` - Extract from storage
- [ ] Implement `extractPrivateKey()` - Unified extraction
- [ ] Implement `encryptWIF()` - Optional password protection
- [ ] Implement `decryptWIF()` - Decrypt password-protected WIF
- [ ] Implement `determineAddressType()` - From WIF compression
- [ ] Implement `createImportedAccount()` - Account object creation
- [ ] Implement `storeImportedWIF()` - Encrypt and store
- [ ] Implement `checkDuplicateWIF()` - Duplicate detection
- [ ] Add unit tests for all helper functions

### Phase 4: Message Handlers
- [ ] Implement `handleExportPrivateKey()` - Export handler
- [ ] Implement `handleImportPrivateKey()` - Import handler
- [ ] Implement `handleValidateWIF()` - Validation handler
- [ ] Add handlers to `handleMessage()` switch statement
- [ ] Write integration tests for all handlers
- [ ] Test export-import roundtrip (plaintext)
- [ ] Test export-import roundtrip (password-protected)

### Phase 5: Security & Error Handling
- [ ] Add memory cleanup after private key operations
- [ ] Verify no logging of sensitive data (private keys, WIF, passwords)
- [ ] Test wallet unlock state validation
- [ ] Test multisig account rejection
- [ ] Test mainnet key rejection
- [ ] Test duplicate detection
- [ ] Test rate limiting (5 imports per minute)
- [ ] Test all error codes and messages

### Phase 6: Testing
- [ ] Unit tests for WIFManager (100% coverage)
- [ ] Unit tests for helper functions
- [ ] Integration tests for message handlers
- [ ] Export-import roundtrip tests
- [ ] Security tests (no logging, memory cleanup)
- [ ] Manual testing on testnet

### Phase 7: Documentation
- [ ] Update backend-developer-notes.md
- [ ] Document WIF encoding/decoding patterns
- [ ] Document security considerations
- [ ] Document integration points
- [ ] Add troubleshooting guide

---

## Key Implementation Details

### WIF Format

**Testnet WIF Prefixes:**
- `9` - Uncompressed private key (52 characters)
- `c` - Compressed private key (52 characters)

**Mainnet WIF Prefixes (REJECTED):**
- `5` - Uncompressed private key
- `K` or `L` - Compressed private key

**Example Testnet WIF:**
```
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
```

### Encryption Parameters

**File Encryption (Optional Password Protection):**
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2-HMAC-SHA256
- Iterations: 100,000 (same as wallet unlock)
- Salt: 32 bytes (unique per export)
- IV: 12 bytes (unique per export)
- Format: `{salt}:{iv}:{authTag}:{ciphertext}` (all base64)

**Storage Encryption (Imported Keys):**
- Use pre-derived encryption key from wallet unlock
- Use `CryptoUtils.encryptWithKey()` / `decryptWithKey()`
- Store in `WalletStorage.importedKeys` map

### Network Validation

**CRITICAL: Strict testnet enforcement**

```typescript
// 1. Detect network from WIF prefix
const network = WIFManager.detectNetwork(wif);

// 2. Reject mainnet keys IMMEDIATELY
if (network !== 'testnet') {
  throw new Error(
    `REJECTED: This is a ${network} private key. ` +
    `This wallet only accepts testnet keys.`
  );
}

// 3. Validate checksum
if (!KeyManager.validateWIF(wif, 'testnet')) {
  throw new Error('Invalid WIF checksum.');
}
```

### Duplicate Detection

**Compare by first derived address:**

```typescript
// 1. Derive first address from WIF
const addressInfo = WIFManager.deriveFirstAddress(wif, 'testnet');

// 2. Check all existing accounts for matching address
for (const account of wallet.accounts) {
  if (account.addresses[0]?.address === addressInfo.address) {
    throw new Error(`Already imported as "${account.name}"`);
  }
}
```

### Memory Cleanup

**Always cleanup sensitive data:**

```typescript
let privateKeyHex: string | null = null;
let wif: string | null = null;

try {
  // Sensitive operations
  privateKeyHex = await extractPrivateKey(account, state);
  wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

  // Use WIF
  return { success: true, data: { wif } };

} finally {
  // ALWAYS cleanup
  if (privateKeyHex) {
    privateKeyHex = '0'.repeat(privateKeyHex.length);
  }
  if (wif) {
    wif = '0'.repeat(wif.length);
  }
}
```

---

## Error Codes

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

---

## Testing Strategy

### Unit Tests

**WIFManager Tests:**
- ✅ Format validation (Base58, length)
- ✅ Network detection (testnet, mainnet, invalid)
- ✅ Network validation (enforce testnet)
- ✅ Checksum validation
- ✅ Address derivation (compressed, uncompressed)
- ✅ Complete validation (all checks)

**Helper Function Tests:**
- ✅ HD account private key extraction
- ✅ Imported account private key extraction
- ✅ WIF encryption/decryption
- ✅ Address type determination
- ✅ Duplicate detection

### Integration Tests

**Message Handler Tests:**
- ✅ Export HD account (plaintext)
- ✅ Export HD account (password-protected)
- ✅ Export imported account
- ✅ Import valid testnet WIF
- ✅ Reject mainnet WIF
- ✅ Reject duplicate WIF
- ✅ Reject when wallet locked
- ✅ Reject multisig account export
- ✅ Export-import roundtrip

### Security Tests

- ✅ No logging of private keys or WIF
- ✅ Memory cleanup after operations
- ✅ Wallet unlock state validation
- ✅ Rate limiting enforcement
- ✅ Network validation enforcement

---

## Security Considerations

### Critical Security Rules

1. ❌ **NEVER** log private keys, WIF, or passwords
2. ❌ **NEVER** process mainnet keys beyond initial validation
3. ❌ **NEVER** store unencrypted private keys
4. ✅ **ALWAYS** validate wallet is unlocked before export
5. ✅ **ALWAYS** clear sensitive data from memory immediately
6. ✅ **ALWAYS** use finally blocks for cleanup
7. ✅ **ALWAYS** validate network before any other operation
8. ✅ **ALWAYS** check for duplicates before import

### Memory Management

- Use local variables for sensitive data
- Clear variables with `'0'.repeat(length)` after use
- Set to `null` to allow garbage collection
- Use `finally` blocks to ensure cleanup on errors
- Never pass sensitive data in error messages

### Network Validation

- Detect network from WIF prefix first
- Reject mainnet keys immediately (before decoding)
- Never decode or derive from mainnet keys
- Clear error messages about network mismatch

---

## Integration Points

### KeyManager (Existing - Reuse)
```typescript
KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);
KeyManager.decodeWIF(wif, 'testnet');
KeyManager.validateWIF(wif, 'testnet');
```

### CryptoUtils (Existing - Reuse)
```typescript
// File encryption
await CryptoUtils.encrypt(wif, password);
await CryptoUtils.decrypt(encryptedData, password, salt, iv);

// Storage encryption
await CryptoUtils.encryptWithKey(wif, state.encryptionKey);
await CryptoUtils.decryptWithKey(encryptedData, state.encryptionKey, iv);
```

### WalletStorage (Existing - Reuse)
```typescript
await WalletStorage.storeImportedKey(accountIndex, importedKeyData);
await WalletStorage.getImportedKey(accountIndex);
await WalletStorage.addAccount(account);
```

---

## Next Steps

1. **Create WIFManager module** with validation logic
2. **Add message type definitions** to `types/index.ts`
3. **Implement helper functions** in `index.ts`
4. **Implement message handlers** in `index.ts`
5. **Write unit tests** for WIFManager and helpers
6. **Write integration tests** for message handlers
7. **Manual testing** on testnet with real WIF keys
8. **Security review** by security expert
9. **Update backend-developer-notes.md** with patterns
10. **Code review and merge**

---

## Related Documents

- **Full Implementation Plan**: `PRIVATE_KEY_EXPORT_IMPORT_BACKEND_PLAN.md`
- **Product Requirements**: `PRIVATE_KEY_EXPORT_IMPORT_PRD.md`
- **Security Specification**: `PRIVATE_KEY_EXPORT_IMPORT_SECURITY_SPEC.md`
- **UX Design**: `PRIVATE_KEY_EXPORT_IMPORT_UX_SPEC.md`
- **Frontend Plan**: `PRIVATE_KEY_EXPORT_IMPORT_FRONTEND_PLAN.md`

---

**Status**: Implementation Ready ✅
**Last Updated**: 2025-10-19
**Maintained By**: Backend Development Team
