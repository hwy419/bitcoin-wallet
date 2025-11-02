# Chrome Storage Patterns

**Last Updated**: October 22, 2025
**Related**: [service-worker.md](./service-worker.md) | [messages.md](./messages.md) | [api.md](./api.md) | [_INDEX.md](./_INDEX.md)

---

## Quick Navigation

- [Storage Schema](#storage-schema)
- [Storage Operations](#storage-operations)
- [Encryption](#encryption)
- [Storage Size Considerations](#storage-size-considerations)

---

## Storage Schema

### Chrome Storage Schema

```typescript
interface StoredWallet {
  version: 1,                       // Schema version (for migrations)
  encryptedSeed: string,            // Base64 encoded ciphertext
  salt: string,                     // Base64 encoded PBKDF2 salt
  iv: string,                       // Base64 encoded AES IV
  accounts: Account[],              // All accounts with addresses
  settings: WalletSettings          // User preferences
}

interface WalletSettings {
  autoLockMinutes: number,          // Auto-lock timeout (default: 15)
  network: 'testnet' | 'mainnet'    // Bitcoin network (default: 'testnet')
}

interface Account {
  index: number,                    // BIP44 account index (0, 1, 2, ...)
  name: string,                     // User-friendly name ('Account 1', ...)
  addressType: AddressType,         // 'legacy' | 'segwit' | 'native-segwit'
  externalIndex: number,            // Next external (receiving) address index
  internalIndex: number,            // Next internal (change) address index
  addresses: Address[]              // All generated addresses
}

interface Address {
  address: string,                  // Bitcoin address (tb1q..., 2..., m/n...)
  derivationPath: string,           // Full BIP44 path (m/84'/1'/0'/0/0)
  index: number,                    // Address index in account
  isChange: boolean,                // true for change addresses
  used: boolean                     // true if address has transactions (TODO)
}
```

### StoredWalletV2 (Multisig Support)

**Added in v0.8.0** to support multi-signature accounts:

```typescript
interface StoredWalletV2 {
  version: 2,                       // Schema version 2
  encryptedSeed: string,            // Base64 encoded ciphertext
  salt: string,                     // Base64 encoded PBKDF2 salt
  iv: string,                       // Base64 encoded AES IV
  accounts: WalletAccount[],        // Union type: Account | MultisigAccount
  settings: WalletSettings,
  pendingMultisigTxs: PendingMultisigTx[]  // NEW: Pending multisig transactions
}

type WalletAccount = Account | MultisigAccount;

interface MultisigAccount {
  accountType: 'multisig',
  index: number,
  name: string,
  config: MultisigConfig,           // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType, // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  ourXpub: string,                  // Our extended public key
  ourFingerprint: string,           // Our key fingerprint (4 bytes hex)
  cosigners: Cosigner[],            // Other co-signers' xpubs
  externalIndex: number,            // Next external address index
  internalIndex: number,            // Next internal address index
  addresses: MultisigAddress[]      // Generated multisig addresses
}

interface Cosigner {
  name: string,
  xpub: string,
  fingerprint: string,
  derivationPath: string            // BIP48 path
}

interface PendingMultisigTx {
  id: string,                       // Transaction ID (txid)
  accountId: number,                // Account index
  psbtBase64: string,               // PSBT with signatures
  created: number,                  // Creation timestamp
  expiresAt: number,                // Expiration (7 days)
  multisigConfig: MultisigConfig,
  signaturesCollected: number,      // Current signature count
  signaturesRequired: number,       // Required signature count (M)
  signatureStatus: {                // Per-cosigner status
    [fingerprint: string]: {
      signed: boolean,
      timestamp?: number,
      cosignerName: string
    }
  },
  metadata: {
    amount: number,
    recipient: string,
    fee: number
  }
}
```

### Migration Path (v1 → v2)

**When a user upgrades from single-sig to multisig-enabled wallet:**

1. StoredWalletV1 → StoredWalletV2:
   - Version: 1 → 2
   - accounts: Account[] → WalletAccount[] (compatible)
   - Add: pendingMultisigTxs: [] (empty array)

2. Backward Compatibility:
   - v2 wallets can still have only single-sig accounts
   - All existing Account objects work unchanged
   - No data migration needed for upgrade

3. Forward Compatibility:
   - v1 wallet cannot read MultisigAccount objects
   - Opening v2 wallet with v1 code will fail validation
   - Downgrade not supported (one-way migration)

**Implementation**: Automatic migration on first multisig account creation

---

## Storage Operations

### Read Wallet

```typescript
const wallet = await WalletStorage.getWallet();
// Returns StoredWallet (seed is encrypted)
```

**Location**: `src/background/wallet/WalletStorage.ts`

**Returns**: `StoredWallet` object with encrypted seed and all accounts

**Error Handling**: Returns null if no wallet exists

---

### Create Wallet

```typescript
await WalletStorage.createWallet(mnemonic, password, firstAccount);
// Encrypts mnemonic, creates wallet structure
```

**Parameters**:
- `mnemonic`: BIP39 seed phrase (12 words)
- `password`: User's password for encryption
- `firstAccount`: First account object (Account 1)

**Process**:
1. Generate random salt (32 bytes)
2. Derive encryption key from password using PBKDF2 (100,000 iterations)
3. Generate random IV (12 bytes for GCM)
4. Encrypt mnemonic with AES-256-GCM
5. Create StoredWallet object with encrypted data
6. Save to chrome.storage.local

**Security**:
- New salt generated for each wallet (prevents rainbow tables)
- New IV for each encryption (prevents pattern analysis)
- PBKDF2 with 100k iterations (OWASP minimum recommendation)
- AES-GCM provides both encryption and authentication

---

### Unlock Wallet

```typescript
const mnemonic = await WalletStorage.unlockWallet(password);
// Decrypts and returns seed phrase (handle with care!)
```

**Parameters**:
- `password`: User's password for decryption

**Returns**: Decrypted mnemonic (12-word seed phrase)

**Process**:
1. Retrieve wallet from storage
2. Get salt and IV
3. Derive encryption key from password using PBKDF2
4. Decrypt mnemonic using AES-256-GCM
5. Return decrypted mnemonic

**Error Handling**:
- Wrong password → Decryption fails (GCM auth tag mismatch)
- Corrupted data → Decryption fails
- Generic error message (security: don't reveal specific failure)

**Security Notes**:
- Decrypted mnemonic is returned to caller (must handle securely)
- Never log the returned mnemonic
- Keep in memory only, never persist
- Clear from memory after use

---

### Update Account

```typescript
await WalletStorage.updateAccount(accountIndex, updatedAccount);
// Saves updated account to storage
```

**Parameters**:
- `accountIndex`: Account index to update (0-based)
- `updatedAccount`: Updated Account object

**Process**:
1. Retrieve wallet from storage
2. Find account by index
3. Replace account with updated version
4. Save wallet back to storage

**Use Cases**:
- Adding new addresses to account
- Updating address indices (externalIndex, internalIndex)
- Renaming account
- Marking addresses as used

**Note**: Does NOT re-encrypt seed (only account metadata changed)

---

### Add Account

```typescript
await WalletStorage.addAccount(newAccount);
// Appends new account to accounts array
```

**Parameters**:
- `newAccount`: New Account object

**Process**:
1. Retrieve wallet from storage
2. Append account to accounts array
3. Save wallet back to storage

**Validation**:
- Account index should be sequential (current count)
- Account name should be unique (not enforced, but recommended)

**Note**: Does NOT re-encrypt seed (only adding account metadata)

---

### Storage Keys

The following keys are used in `chrome.storage.local`:

```
walletData:          StoredWallet - Main wallet data (encrypted)
walletState:         { isLocked: boolean, lastActivity: number }
contacts:            Contact[] - User's contact list
settings:            UserSettings - UI preferences
wizardSession:       WizardSessionData - Multisig wizard state
```

**Separation of Concerns**:
- `walletData`: Sensitive encrypted data (seed, accounts)
- `walletState`: Temporary session state
- `contacts`: User data (names, addresses)
- `settings`: UI preferences (theme, units)
- `wizardSession`: Temporary wizard progress

---

## Encryption

### Algorithm: AES-256-GCM

**Why AES-GCM?**
- Industry standard authenticated encryption
- Provides both confidentiality and integrity
- Fast hardware acceleration on most platforms
- Widely tested and reviewed
- Recommended by NIST

**Key Properties**:
- Key size: 256 bits (32 bytes)
- IV size: 12 bytes (96 bits) - GCM recommended size
- Auth tag: 16 bytes (128 bits) - appended to ciphertext
- Mode: Galois/Counter Mode (GCM)

### Key Derivation: PBKDF2-HMAC-SHA256

**Parameters**:
```typescript
{
  algorithm: 'PBKDF2',
  hash: 'SHA-256',
  salt: crypto.getRandomValues(new Uint8Array(32)),  // 32 bytes
  iterations: 100000,                                  // OWASP minimum
  keyLength: 256                                       // 256-bit key
}
```

**Why PBKDF2?**
- Built into WebCrypto API (no dependencies)
- OWASP recommended for password-based encryption
- 100,000 iterations slow down brute force attacks
- Salting prevents rainbow table attacks

**Security Properties**:
- Unique salt per wallet (prevents pre-computation)
- High iteration count (slows down brute force)
- SHA-256 hash function (collision resistant)
- Output directly usable as AES key

### Encryption Flow

**Encryption (CREATE_WALLET / IMPORT_WALLET)**:
```
Password + Random Salt (32 bytes)
  ↓
PBKDF2-HMAC-SHA256 (100k iterations)
  ↓
256-bit Encryption Key
  ↓
AES-256-GCM with Random IV (12 bytes)
  ↓
Ciphertext + Auth Tag
  ↓
Base64 Encode
  ↓
Store: { encryptedSeed, salt, iv }
```

**Decryption (UNLOCK_WALLET)**:
```
Password + Stored Salt
  ↓
PBKDF2-HMAC-SHA256 (100k iterations)
  ↓
256-bit Encryption Key
  ↓
AES-256-GCM with Stored IV
  ↓
Verify Auth Tag (integrity check)
  ↓
Plaintext Mnemonic (if tag valid)
```

### Implementation Details

**File**: `src/background/wallet/CryptoUtils.ts`

**Key Methods**:

1. **encrypt(plaintext: string, password: string)**
   - Generates random salt and IV
   - Derives key using PBKDF2
   - Encrypts with AES-GCM
   - Returns: `{ ciphertext, salt, iv }` (all base64)

2. **decrypt(ciphertext: string, password: string, salt: string, iv: string)**
   - Decodes base64 inputs
   - Derives key using PBKDF2 with stored salt
   - Decrypts with AES-GCM using stored IV
   - Returns: plaintext string (or throws on failure)

3. **deriveKey(password: string, salt: Uint8Array)**
   - Uses PBKDF2 to derive 256-bit key
   - Returns: CryptoKey for AES-GCM

**Example Usage**:
```typescript
// Encryption
const { ciphertext, salt, iv } = await CryptoUtils.encrypt(mnemonic, password);

// Storage
await chrome.storage.local.set({
  walletData: {
    version: 1,
    encryptedSeed: ciphertext,
    salt: salt,
    iv: iv,
    accounts: [/* ... */]
  }
});

// Decryption
const wallet = await chrome.storage.local.get('walletData');
const mnemonic = await CryptoUtils.decrypt(
  wallet.encryptedSeed,
  password,
  wallet.salt,
  wallet.iv
);
```

### Security Considerations

**Never Reuse IV**:
- New random IV generated for EVERY encryption
- IV must be unique per encryption with same key
- IV is stored alongside ciphertext (not secret)
- Reusing IV breaks GCM security

**Salt Uniqueness**:
- New random salt generated for each wallet
- Salt prevents rainbow table attacks on passwords
- Salt is stored alongside ciphertext (not secret)
- Same salt used for all decryptions of that wallet

**Auth Tag Validation**:
- GCM automatically validates auth tag on decryption
- Wrong password → auth tag mismatch → decryption fails
- Tampered ciphertext → auth tag mismatch → decryption fails
- Provides both confidentiality and integrity

**Key Derivation Time**:
- 100,000 PBKDF2 iterations takes ~100-200ms on modern hardware
- Intentional: slows down brute force attacks
- User experience: Noticeable but acceptable delay on unlock

**Memory Security**:
- Plaintext mnemonic only in memory after decryption
- JavaScript cannot guarantee memory clearing
- Best-effort: Overwrite buffer, set to null
- Service worker termination clears memory

---

## Storage Size Considerations

Chrome storage has a 10 MB quota for `chrome.storage.local`.

### Size Estimates

**Per-Wallet Data**:
- Encrypted seed: ~200 bytes (base64 encoded ciphertext)
- Salt: ~44 bytes (32 bytes base64 encoded)
- IV: ~16 bytes (12 bytes base64 encoded)
- Account metadata: ~100 bytes per account
- Address metadata: ~150 bytes per address

**Example Calculations**:

Single account with 100 addresses:
```
Wallet overhead:  260 bytes
Account:          100 bytes
Addresses:     15,000 bytes (100 × 150)
Total:        ~15.4 KB
```

10 accounts with 100 addresses each:
```
Wallet overhead:  260 bytes
Accounts:       1,000 bytes (10 × 100)
Addresses:    150,000 bytes (1000 × 150)
Total:        ~151 KB
```

**Estimated Capacity**:
- ~60,000 addresses before hitting 10 MB limit
- ~600 accounts with 100 addresses each
- Typical user: 5-10 accounts with 10-50 addresses each (~50-100 KB)

**Conclusion**: Storage is not a concern for typical usage patterns.

### Storage Growth Patterns

**What Grows Over Time**:
1. Number of addresses (as user generates new receiving addresses)
2. Number of accounts (if user creates many accounts)
3. Pending multisig transactions (if using multisig)
4. Transaction history (future: if cached locally)

**What Stays Constant**:
- Encrypted seed (never changes)
- Salt and IV (generated once at wallet creation)
- Account metadata (mostly static)

**Future Optimizations** (if needed):
- Prune old addresses (keep only last N used + gap limit)
- Compress address storage (derivation path instead of full object)
- Cleanup expired pending transactions automatically
- Implement pagination for large address lists

---

## See Also

- [service-worker.md](./service-worker.md) - In-memory state management
- [messages.md](./messages.md) - Message handlers that use storage
- [api.md](./api.md) - API integration
- [decisions.md](./decisions.md) - Storage-related architectural decisions
