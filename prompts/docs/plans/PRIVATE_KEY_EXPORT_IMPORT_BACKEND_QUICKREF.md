# Private Key Export/Import - Backend Quick Reference

**One-page cheat sheet for backend implementation**

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  NEW MODULE                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ WIFManager.ts                                            │  │
│  │  - validateFormat()      // Base58, length check        │  │
│  │  - detectNetwork()       // testnet vs mainnet          │  │
│  │  - validateNetwork()     // Enforce testnet             │  │
│  │  - deriveFirstAddress()  // Preview address             │  │
│  │  - validateWIF()         // Complete validation         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  MESSAGE HANDLERS (in index.ts)                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ EXPORT_PRIVATE_KEY                                       │  │
│  │  1. Validate wallet unlocked                             │  │
│  │  2. Get account                                          │  │
│  │  3. Extract private key (HD or imported)                 │  │
│  │  4. Convert to WIF                                       │  │
│  │  5. Optionally encrypt                                   │  │
│  │  6. Return with metadata                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ IMPORT_PRIVATE_KEY                                       │  │
│  │  1. Rate limit check                                     │  │
│  │  2. Validate WIF format                                  │  │
│  │  3. Check network (reject mainnet)                       │  │
│  │  4. Check duplicate                                      │  │
│  │  5. Create account                                       │  │
│  │  6. Encrypt & store WIF                                  │  │
│  │  7. Add to wallet                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ VALIDATE_WIF                                             │  │
│  │  - Real-time validation                                  │  │
│  │  - Returns: network, address, addressType, error        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  EXISTING MODULES (REUSE - NO CHANGES)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ KeyManager                                               │  │
│  │  - privateKeyToWIF()  ✅                                 │  │
│  │  - decodeWIF()        ✅                                 │  │
│  │  - validateWIF()      ✅                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CryptoUtils                                              │  │
│  │  - encrypt()          ✅                                 │  │
│  │  - decrypt()          ✅                                 │  │
│  │  - encryptWithKey()   ✅                                 │  │
│  │  - decryptWithKey()   ✅                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ WalletStorage                                            │  │
│  │  - storeImportedKey() ✅                                 │  │
│  │  - getImportedKey()   ✅                                 │  │
│  │  - addAccount()       ✅                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## WIF Format Quick Reference

```
TESTNET WIF PREFIXES (ACCEPT)
  9  → Uncompressed testnet private key (52 chars)
  c  → Compressed testnet private key (52 chars)

MAINNET WIF PREFIXES (REJECT)
  5  → Uncompressed mainnet private key
  K  → Compressed mainnet private key
  L  → Compressed mainnet private key

EXAMPLE TESTNET WIF:
  cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
  └┬┘ └──────────────────────────────────────────────┘
   │                      │
Prefix            Base58Check encoded
(network +        (private key + checksum)
compression)
```

---

## Encryption Parameters

```
FILE ENCRYPTION (Optional Password Protection)
  Algorithm:    AES-256-GCM
  Key Derivation: PBKDF2-HMAC-SHA256
  Iterations:   100,000 (same as wallet unlock)
  Salt:         32 bytes (unique per export)
  IV:           12 bytes (unique per export)
  Format:       {salt}:{iv}:{authTag}:{ciphertext} (all base64)

STORAGE ENCRYPTION (Imported Keys)
  Use:          state.encryptionKey (pre-derived from wallet password)
  Method:       CryptoUtils.encryptWithKey()
  Storage:      WalletStorage.storeImportedKey()
```

---

## Network Validation Flow

```
┌────────────────────────────────────────────────────────────┐
│ CRITICAL: Network Validation (FIRST CHECK)                │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ 1. Detect Network from WIF Prefix                         │
│    ┌─────────────────────────────────────────────┐        │
│    │ const network = WIFManager.detectNetwork(wif)│        │
│    │   → '9' or 'c' → testnet                    │        │
│    │   → '5', 'K', 'L' → mainnet                 │        │
│    │   → other → invalid                         │        │
│    └─────────────────────────────────────────────┘        │
│                                                            │
│ 2. Validate Network (ENFORCE TESTNET)                     │
│    ┌─────────────────────────────────────────────┐        │
│    │ if (network !== 'testnet') {                │        │
│    │   throw 'REJECTED: mainnet key'             │        │
│    │ }                                            │        │
│    └─────────────────────────────────────────────┘        │
│                                                            │
│ 3. Validate Checksum (ONLY IF TESTNET)                    │
│    ┌─────────────────────────────────────────────┐        │
│    │ if (!KeyManager.validateWIF(wif, 'testnet')) │        │
│    │   throw 'Invalid checksum'                  │        │
│    └─────────────────────────────────────────────┘        │
│                                                            │
└────────────────────────────────────────────────────────────┘

❌ NEVER process mainnet keys beyond network detection
❌ NEVER decode mainnet WIF
❌ NEVER derive addresses from mainnet keys
```

---

## Security Checklist

```
MEMORY CLEANUP
  ✅ Use finally blocks for cleanup
  ✅ Clear variables: privateKey = '0'.repeat(length)
  ✅ Set to null: privateKey = null
  ✅ Clear on error: finally { cleanup() }

LOGGING RULES
  ❌ NEVER log: private keys, WIF, passwords
  ✅ Log: operation names, account indices, error types

VALIDATION
  ✅ Check wallet unlocked before export
  ✅ Validate network BEFORE any processing
  ✅ Check duplicates before import
  ✅ Enforce rate limits (5 imports/minute)

ERROR MESSAGES
  ❌ NEVER include: WIF, private key, password
  ✅ Generic errors: "Decryption failed"
  ✅ Clear errors: "Wrong network: mainnet"
```

---

## Code Snippets

### Export Private Key

```typescript
// Extract private key from account
let privateKeyHex: string | null = null;
let wif: string | null = null;

try {
  // Get private key (HD or imported)
  privateKeyHex = await extractPrivateKey(account, state);

  // Convert to WIF (always compressed)
  wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

  // Clear private key immediately
  privateKeyHex = '0'.repeat(privateKeyHex.length);
  privateKeyHex = null;

  // Optionally encrypt
  const encrypted = await CryptoUtils.encrypt(wif, password);

  return { success: true, data: encrypted };

} finally {
  if (privateKeyHex) privateKeyHex = '0'.repeat(privateKeyHex.length);
  if (wif) wif = '0'.repeat(wif.length);
}
```

### Validate WIF

```typescript
// Complete WIF validation
const result = WIFManager.validateWIF(wif, 'testnet');

if (!result.valid) {
  throw new Error(result.error);
}

// Result contains:
// - valid: boolean
// - network: 'testnet' | 'mainnet'
// - firstAddress: string
// - addressType: 'legacy' | 'segwit' | 'native-segwit'
// - compressed: boolean
```

### Import Private Key

```typescript
// 1. Validate WIF
const validation = WIFManager.validateWIF(wif, 'testnet');
if (!validation.valid) {
  throw new Error(validation.error);
}

// 2. Check duplicate
const duplicate = await checkDuplicateWIF(wif, wallet.accounts);
if (duplicate.isDuplicate) {
  throw new Error(`Already imported as "${duplicate.existingAccountName}"`);
}

// 3. Create account
const account = {
  index: wallet.accounts.length,
  name: 'Imported Account',
  addressType: validation.addressType,
  imported: true,
  addresses: [{ address: validation.firstAddress, ... }]
};

// 4. Encrypt and store WIF
const encrypted = await CryptoUtils.encryptWithKey(wif, state.encryptionKey);
await WalletStorage.storeImportedKey(account.index, {
  encryptedData: encrypted.encryptedData,
  iv: encrypted.iv,
  type: 'wif'
});

// 5. Add account
await WalletStorage.addAccount(account);
```

### Check Duplicate

```typescript
async function checkDuplicateWIF(
  wif: string,
  accounts: WalletAccount[]
): Promise<{ isDuplicate: boolean; existingAccountName?: string }> {
  // Derive first address from WIF
  const addressInfo = WIFManager.deriveFirstAddress(wif, 'testnet');

  // Check all accounts for matching address
  for (const account of accounts) {
    if (account.addresses[0]?.address === addressInfo.address) {
      return {
        isDuplicate: true,
        existingAccountName: account.name
      };
    }
  }

  return { isDuplicate: false };
}
```

---

## Error Codes Reference

```typescript
export enum PrivateKeyErrorCode {
  // Export
  WALLET_LOCKED           = 'WALLET_LOCKED',
  ACCOUNT_NOT_FOUND       = 'ACCOUNT_NOT_FOUND',
  MULTISIG_NOT_SUPPORTED  = 'MULTISIG_NOT_SUPPORTED',
  EXPORT_FAILED           = 'EXPORT_FAILED',

  // Import
  INVALID_WIF_FORMAT      = 'INVALID_WIF_FORMAT',
  INVALID_WIF_CHECKSUM    = 'INVALID_WIF_CHECKSUM',
  WRONG_NETWORK           = 'WRONG_NETWORK',
  DUPLICATE_KEY           = 'DUPLICATE_KEY',
  IMPORT_FAILED           = 'IMPORT_FAILED',
  RATE_LIMIT_EXCEEDED     = 'RATE_LIMIT_EXCEEDED',
}
```

---

## Testing Quick Checklist

```
UNIT TESTS
  □ WIF format validation (Base58, length)
  □ Network detection (testnet, mainnet, invalid)
  □ Network validation (enforce testnet)
  □ Checksum validation
  □ Address derivation (compressed, uncompressed)
  □ Duplicate detection

INTEGRATION TESTS
  □ Export HD account (plaintext)
  □ Export HD account (password-protected)
  □ Export imported account
  □ Import valid testnet WIF
  □ Reject mainnet WIF
  □ Reject duplicate WIF
  □ Export-import roundtrip

SECURITY TESTS
  □ No logging of sensitive data
  □ Memory cleanup after operations
  □ Wallet unlock validation
  □ Rate limiting enforcement
```

---

## File Checklist

```
NEW FILES TO CREATE
  □ src/background/wallet/WIFManager.ts

FILES TO MODIFY
  □ src/background/index.ts (add message handlers)
  □ src/shared/types/index.ts (add message types)

FILES TO TEST
  □ src/background/wallet/__tests__/WIFManager.test.ts
  □ src/background/__tests__/privateKeyExportImport.test.ts
```

---

## Implementation Order

```
1. WIFManager Module (1-2 hours)
   ✓ Create WIFManager.ts
   ✓ Implement validation methods
   ✓ Write unit tests

2. Type Definitions (30 mins)
   ✓ Add message types to enum
   ✓ Define request/response interfaces
   ✓ Add error codes

3. Helper Functions (1-2 hours)
   ✓ extractPrivateKey()
   ✓ encryptWIF() / decryptWIF()
   ✓ checkDuplicateWIF()
   ✓ createImportedAccount()

4. Message Handlers (2-3 hours)
   ✓ handleExportPrivateKey()
   ✓ handleImportPrivateKey()
   ✓ handleValidateWIF()
   ✓ Integration into handleMessage()

5. Testing (2-3 hours)
   ✓ Unit tests for WIFManager
   ✓ Integration tests for handlers
   ✓ Security tests
   ✓ Manual testing on testnet

Total: 6-10 hours
```

---

**Quick Links:**
- Full Plan: `PRIVATE_KEY_EXPORT_IMPORT_BACKEND_PLAN.md`
- Summary: `PRIVATE_KEY_EXPORT_IMPORT_BACKEND_SUMMARY.md`
- Security Spec: `PRIVATE_KEY_EXPORT_IMPORT_SECURITY_SPEC.md`
