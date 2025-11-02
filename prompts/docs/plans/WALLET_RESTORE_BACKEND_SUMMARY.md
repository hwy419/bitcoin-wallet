# Wallet Restore from Private Key - Backend Summary

**Quick Reference Guide for Implementation**

**Related Documents**:
- **Full Plan**: [WALLET_RESTORE_BACKEND_PLAN.md](./WALLET_RESTORE_BACKEND_PLAN.md) (26,000+ words)
- **PRD**: [WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md](./WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md)
- **Blockchain Review**: [WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md](./WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md)

---

## 1-Minute Overview

**What**: Allow users to create a wallet from a private key backup (WIF) during setup.

**Why**: Users who exported their private keys cannot currently restore their wallet without a seed phrase.

**How**: Create a non-HD wallet (no seed phrase) with a single imported account.

---

## Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Non-HD wallet marker** | `encryptedSeed = ''` (empty string) | Type-safe sentinel value |
| **Change address strategy** | Reuse same address | Simplest for MVP, acceptable privacy tradeoff |
| **Address type selection** | User must specify | Cannot auto-detect reliably |
| **Wallet version** | Keep v2 (no bump) | No breaking schema changes |
| **Transaction signing** | Conditional branching on `importType` | Clean separation of HD vs non-HD |
| **Rate limiting** | 3 attempts / 15 minutes | Prevents brute force attacks |

---

## Files to Modify

**Core Files** (5 total):
1. `src/background/index.ts` - Add message handler + helpers
2. `src/background/wallet/WIFManager.ts` - Add `deriveAddress()` method
3. `src/background/bitcoin/TransactionBuilder.ts` - Conditional signing (optional, can be in index.ts)
4. `src/shared/types/index.ts` - Add message types and error codes
5. `src/background/wallet/WalletStorage.ts` - Optional validation helpers

---

## Implementation Checklist

### 1. Add Message Type

**File**: `src/shared/types/index.ts`

```typescript
export enum MessageType {
  // ... existing ...
  CREATE_WALLET_FROM_PRIVATE_KEY = 'CREATE_WALLET_FROM_PRIVATE_KEY',
}

export interface CreateWalletFromPrivateKeyRequest {
  wif: string;
  addressType: AddressType;
  accountName: string;
  password: string;
}

export enum WalletCreationErrorCode {
  INVALID_WIF = 'INVALID_WIF',
  WRONG_NETWORK = 'WRONG_NETWORK',
  INCOMPATIBLE_ADDRESS_TYPE = 'INCOMPATIBLE_ADDRESS_TYPE',
  WALLET_ALREADY_EXISTS = 'WALLET_ALREADY_EXISTS',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  // ...
}
```

### 2. Add Message Handler

**File**: `src/background/index.ts`

**Steps**:
1. Check rate limit (3 attempts / 15 min)
2. Check if wallet already exists
3. Validate WIF (format, network, checksum)
4. Validate address type compatibility
5. Derive first address
6. Validate password strength
7. Encrypt WIF
8. Create non-HD wallet structure
9. Validate wallet structure
10. Save to storage

**Key Code**:
```typescript
case MessageType.CREATE_WALLET_FROM_PRIVATE_KEY: {
  const rateLimitCheck = checkWalletCreationRateLimit();
  if (!rateLimitCheck.allowed) return { success: false, error: ... };

  const wallet: StoredWalletV2 = {
    version: 2,
    encryptedSeed: '',  // ← Empty = non-HD
    // ...
    accounts: [{
      importType: 'private-key',  // ← Mark as imported
      // ...
    }],
    importedKeys: {
      0: { encryptedData: encryptedWIF, ... }
    },
  };

  validateWalletStructure(wallet);
  await WalletStorage.saveWallet(wallet);
  return { success: true, data: { firstAddress, ... } };
}
```

### 3. Add WIFManager Method

**File**: `src/background/wallet/WIFManager.ts`

```typescript
static deriveAddress(
  wif: string,
  addressType: AddressType,
  network: 'testnet' | 'mainnet' = 'testnet'
): { address: string; compressed: boolean } {
  const decoded = KeyManager.decodeWIF(wif, network);

  // Validate: Uncompressed keys can only use legacy
  if (!decoded.compressed && addressType !== 'legacy') {
    throw new Error('Uncompressed keys require legacy addresses');
  }

  // Generate address based on type
  const keyPair = ECPair.fromWIF(wif, networkObj);
  switch (addressType) {
    case 'legacy': return p2pkh address;
    case 'segwit': return p2sh-p2wpkh address;
    case 'native-segwit': return p2wpkh address;
  }
}
```

### 4. Add Wallet Validation

**File**: `src/background/index.ts` (or new `WalletValidator.ts`)

```typescript
function validateWalletStructure(wallet: StoredWalletV2): void {
  const isNonHD = wallet.encryptedSeed === '';

  if (isNonHD) {
    // Must have imported keys
    if (!wallet.importedKeys || Object.keys(wallet.importedKeys).length === 0) {
      throw new Error('Non-HD wallet must have imported keys');
    }

    // All accounts must be imported type
    const allImported = wallet.accounts.every(
      acc => acc.accountType === 'single' && acc.importType === 'private-key'
    );
    if (!allImported) {
      throw new Error('Non-HD wallet cannot have HD accounts');
    }
  } else {
    // HD wallet must have valid seed
    if (wallet.encryptedSeed.length < 64) {
      throw new Error('HD wallet must have encrypted seed');
    }
  }
}
```

**Call validation**:
- On wallet creation
- On wallet unlock
- Before critical operations (optional)

### 5. Add Conditional Signing

**File**: `src/background/index.ts` (SEND_TRANSACTION handler)

```typescript
async function getPrivateKeyForSigning(
  account: WalletAccount,
  password: string,
  derivationPath?: string
): Promise<Buffer> {
  if (account.importType === 'private-key') {
    // Non-HD: Decrypt imported key
    const wallet = await WalletStorage.getWallet();
    const importedKeyData = wallet.importedKeys[account.index];
    const decryptedWIF = await CryptoUtils.decryptData(...);
    const keyInfo = KeyManager.decodeWIF(decryptedWIF, network);
    return Buffer.from(keyInfo.privateKey, 'hex');
  } else {
    // HD: Derive from seed
    const node = state.hdWallet.derivePath(derivationPath);
    return node.privateKey;
  }
}
```

**In SEND_TRANSACTION**:
```typescript
for (const utxo of selectedUtxos) {
  const privateKey = await getPrivateKeyForSigning(account, password, utxo.derivationPath);
  const keyPair = ECPair.fromPrivateKey(privateKey, { network });
  psbt.signInput(i, keyPair);
  privateKey.fill(0);  // Clear memory
}
```

### 6. Add Change Address Handling

**File**: `src/background/index.ts`

```typescript
async function getChangeAddressForAccount(account: WalletAccount): Promise<string> {
  if (account.importType === 'private-key') {
    // Non-HD: Reuse same address
    const importedAddress = account.addresses.find(a => !a.isChange);
    return importedAddress.address;
  } else {
    // HD: Generate new change address
    return await getOrGenerateChangeAddress(account.index);
  }
}
```

### 7. Block Account Creation

**File**: `src/background/index.ts` (CREATE_ACCOUNT handler)

```typescript
case MessageType.CREATE_ACCOUNT: {
  const wallet = await WalletStorage.getWallet();

  if (wallet.encryptedSeed === '') {
    return {
      success: false,
      error: 'Cannot create accounts in non-HD wallet. Import additional private keys using Settings → Import Account.',
      code: 'NON_HD_WALLET_LIMITATION',
    };
  }

  // Proceed with account creation...
}
```

### 8. Add Rate Limiting

**File**: `src/background/index.ts`

```typescript
const walletCreationRateLimits = new Map<string, { attempts: number[] }>();
const WALLET_CREATION_RATE_LIMIT = 3;
const WALLET_CREATION_RATE_LIMIT_WINDOW = 15 * 60 * 1000;

function checkWalletCreationRateLimit(): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = 'wallet-creation';
  let entry = walletCreationRateLimits.get(key) || { attempts: [] };

  // Remove old attempts
  entry.attempts = entry.attempts.filter(t => now - t < WALLET_CREATION_RATE_LIMIT_WINDOW);

  // Check limit
  if (entry.attempts.length >= WALLET_CREATION_RATE_LIMIT) {
    const waitTime = Math.ceil((WALLET_CREATION_RATE_LIMIT_WINDOW - (now - entry.attempts[0])) / 60000);
    return { allowed: false, error: `Wait ${waitTime} minutes` };
  }

  entry.attempts.push(now);
  walletCreationRateLimits.set(key, entry);
  return { allowed: true };
}
```

---

## Testing Checklist

### Unit Tests
- [ ] WIF validation (format, network, checksum)
- [ ] Address derivation (all 3 types)
- [ ] Wallet structure validation
- [ ] Rate limiting logic
- [ ] Private key signing logic

### Integration Tests
- [ ] Full import flow (WIF → create → unlock → send)
- [ ] Encrypted WIF import
- [ ] Change address reuse
- [ ] Account creation blocking

### Manual Tests
- [ ] Import compressed WIF (native-segwit)
- [ ] Import uncompressed WIF (legacy)
- [ ] Import encrypted WIF
- [ ] Wrong network WIF (should fail)
- [ ] Send transaction from non-HD account
- [ ] Verify change to same address
- [ ] Rate limiting (4th attempt blocked)

---

## Security Checklist

- [ ] WIF encrypted with AES-256-GCM
- [ ] PBKDF2 with 100,000 iterations
- [ ] Private keys cleared from memory (buffer.fill(0))
- [ ] Network validation enforced
- [ ] Address type compatibility validated
- [ ] Rate limiting prevents brute force
- [ ] No private keys logged
- [ ] Wallet structure validated

---

## Error Codes Reference

| Code | Meaning | User Action |
|------|---------|-------------|
| `INVALID_WIF` | Malformed WIF | Check WIF string |
| `WRONG_NETWORK` | Mainnet key on testnet | Use testnet key |
| `INCOMPATIBLE_ADDRESS_TYPE` | Uncompressed + SegWit | Use legacy type |
| `WALLET_ALREADY_EXISTS` | Wallet exists | Use Import Account |
| `RATE_LIMIT_EXCEEDED` | Too many attempts | Wait 15 minutes |
| `WEAK_PASSWORD` | Weak password | Use stronger password |

---

## Non-HD Wallet Example

```json
{
  "version": 2,
  "encryptedSeed": "",  // ← Empty = non-HD
  "salt": "...",
  "iv": "...",
  "accounts": [
    {
      "accountType": "single",
      "index": 0,
      "name": "Imported Account",
      "addressType": "native-segwit",
      "importType": "private-key",  // ← Imported marker
      "externalIndex": 0,
      "internalIndex": 0,
      "addresses": [
        {
          "address": "tb1q...",
          "derivationPath": "imported",
          "index": 0,
          "isChange": false,
          "used": false
        }
      ]
    }
  ],
  "importedKeys": {
    "0": {
      "encryptedData": "...",  // ← Encrypted WIF
      "salt": "...",
      "iv": "...",
      "type": "private-key"
    }
  },
  "pendingMultisigTxs": [],
  "settings": {
    "autoLockMinutes": 15,
    "network": "testnet"
  }
}
```

---

## Key Implementation Details

### WIF Format
- **Testnet compressed**: Starts with `c` (52 chars)
- **Testnet uncompressed**: Starts with `9` (51 chars)
- **Mainnet compressed**: Starts with `K` or `L` (52 chars)
- **Mainnet uncompressed**: Starts with `5` (51 chars)

### Address Type Compatibility
| Key Type | Legacy | SegWit | Native SegWit |
|----------|--------|--------|---------------|
| Compressed | ✅ | ✅ | ✅ |
| Uncompressed | ✅ | ❌ | ❌ |

### Change Address Strategy
- **HD accounts**: Generate new change address (BIP44 internal chain)
- **Non-HD accounts**: Reuse same address (privacy tradeoff for MVP)

---

## Common Pitfalls

❌ **DON'T**:
- Log WIF or private keys to console
- Allow mainnet WIF on testnet wallet
- Allow SegWit with uncompressed keys
- Create accounts in non-HD wallet without validation
- Skip wallet structure validation

✅ **DO**:
- Clear private keys from memory immediately
- Validate network before importing
- Check address type compatibility
- Show privacy warnings for address reuse
- Validate wallet structure on creation and unlock

---

## Development Workflow

**Step-by-step implementation order**:

1. **Day 1**: Message handler + types
   - Add message type and interfaces
   - Implement message handler skeleton
   - Add rate limiting

2. **Day 2**: WIFManager + validation
   - Add `deriveAddress()` method
   - Add wallet structure validation
   - Test WIF parsing and address generation

3. **Day 3**: Transaction signing
   - Add conditional signing logic
   - Add change address handling
   - Test transaction building

4. **Day 4**: Testing
   - Write unit tests
   - Write integration tests
   - Manual testing on testnet

5. **Day 5**: Polish + documentation
   - Fix bugs from testing
   - Update developer notes
   - Code review

---

## Integration with Frontend

**Message Flow**:

```typescript
// Frontend → Backend
{
  type: 'CREATE_WALLET_FROM_PRIVATE_KEY',
  payload: {
    wif: 'cT1Y2Y...',
    addressType: 'native-segwit',
    accountName: 'Imported Account',
    password: 'SecurePassword123!'
  }
}

// Backend → Frontend (Success)
{
  success: true,
  data: {
    firstAddress: 'tb1qw508d6qejxtdg...',
    addressType: 'native-segwit',
    network: 'testnet'
  }
}

// Backend → Frontend (Error)
{
  success: false,
  error: 'Invalid WIF format',
  code: 'INVALID_WIF'
}
```

---

## Quick Reference

**Identify Non-HD Wallet**:
```typescript
const isNonHD = wallet.encryptedSeed === '';
```

**Get Imported Key**:
```typescript
const importedKey = wallet.importedKeys[accountIndex];
const decryptedWIF = await CryptoUtils.decryptData(
  importedKey.encryptedData,
  password,
  importedKey.salt,
  importedKey.iv
);
```

**Sign with Imported Key**:
```typescript
const keyInfo = KeyManager.decodeWIF(decryptedWIF, network);
const privateKey = Buffer.from(keyInfo.privateKey, 'hex');
const keyPair = ECPair.fromPrivateKey(privateKey, { network });
psbt.signInput(i, keyPair);
privateKey.fill(0);  // Clear memory
```

---

## Estimated Time

**Implementation**: 3-5 days (1 sprint)
- Backend code: 2-3 days
- Testing: 1-2 days

**Lines of Code**: ~500-600 LOC
- Message handler: ~200 LOC
- WIFManager: ~100 LOC
- Validation: ~100 LOC
- Helpers: ~100-200 LOC

---

**Status**: ✅ Ready for Implementation
**Next Steps**: Frontend implementation → Backend implementation → Testing → Release

---

**For full details, see**: [WALLET_RESTORE_BACKEND_PLAN.md](./WALLET_RESTORE_BACKEND_PLAN.md)
