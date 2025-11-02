# Message Handlers

**Last Updated**: October 22, 2025
**Related**: [service-worker.md](./service-worker.md) | [storage.md](./storage.md) | [api.md](./api.md) | [_INDEX.md](./_INDEX.md)

---

## Quick Navigation

- [Message Passing Pattern](#message-passing-pattern)
- [Core Wallet Handlers](#core-wallet-handlers)
- [Account Management Handlers](#account-management-handlers)
- [Transaction Handlers](#transaction-handlers)
- [Multisig Handlers](#multisig-handlers)
- [Single Tab Enforcement](#single-tab-enforcement)

---

## Message Passing Pattern

All communication between tab UI and background service worker uses Chrome's runtime messaging API:

```typescript
// Tab → Background (request-response pattern)
const response = await chrome.runtime.sendMessage({
  type: MessageType.CREATE_WALLET,
  payload: { password: 'secret', addressType: 'native-segwit' }
});

// Background handler
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
    // sender.tab.id is available with tab architecture (not available with popup)
    console.log('Message from tab:', sender.tab?.id);

    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Required for async responses
  }
);
```

**Note**: The message passing API is identical to the previous popup architecture, but `sender.tab.id` is now available, enabling background-to-tab push messaging.

---

## Core Wallet Handlers

### 1. GET_WALLET_STATE

**Purpose**: Check if wallet exists and is unlocked

**Payload**: None

**Returns**:
```typescript
{
  isInitialized: boolean,  // Wallet exists in storage
  isLocked: boolean        // Wallet is locked (no decrypted seed in memory)
}
```

**Implementation**: Uses `WalletStorage.hasWallet()` to check existence

---

### 2. CREATE_WALLET

**Purpose**: Generate new wallet with 12-word seed phrase

**Payload**:
```typescript
{
  password: string,
  addressType?: AddressType  // Default: 'native-segwit'
}
```

**Returns**:
```typescript
{
  mnemonic: string,         // 12-word BIP39 seed phrase (SHOW ONCE!)
  firstAddress: string      // First receiving address (tb1...)
}
```

**Implementation Flow**:

1. **Validate** - Check password, ensure no existing wallet
2. **Generate Mnemonic** - `KeyManager.generateMnemonic(128)` → 12 words
3. **Derive Seed** - `KeyManager.mnemonicToSeed(mnemonic)` → 64-byte seed
4. **Create HD Wallet** - `new HDWallet(seed, 'testnet')`
5. **Create First Account** - `hdWallet.createAccount(addressType, 0, 'Account 1')`
6. **Generate First Address** - Derive `m/84'/1'/0'/0/0` (for native-segwit testnet)
7. **Encrypt & Store** - `WalletStorage.createWallet(mnemonic, password, account)`

**Security Notes**:
- Mnemonic shown ONCE in response (never logged)
- User must back it up during onboarding
- Encrypted before storage with AES-256-GCM
- New salt + IV generated for encryption

---

### 3. IMPORT_WALLET

**Purpose**: Import existing wallet from seed phrase

**Payload**:
```typescript
{
  mnemonic: string,
  password: string,
  addressType?: AddressType  // Default: 'native-segwit'
}
```

**Returns**:
```typescript
{
  firstAddress: string      // First receiving address (tb1...)
}
```

**Implementation Flow**:

1. **Validate Mnemonic** - `KeyManager.validateMnemonic(mnemonic)` (checksum + word list)
2. **Check No Existing Wallet** - Prevent accidental overwrite
3. **Derive Seed** - Convert mnemonic to 64-byte seed
4. **Create HD Wallet** - Same as CREATE_WALLET
5. **Create First Account** - Generate account 0 with first address
6. **Encrypt & Store** - Save encrypted mnemonic

**Security Notes**:
- Mnemonic validated before storage (BIP39 checksum)
- Cannot import if wallet already exists (safety)
- Mnemonic never logged in error messages

---

### 4. UNLOCK_WALLET

**Purpose**: Decrypt seed and load HD wallet into memory

**Payload**:
```typescript
{
  password: string
}
```

**Returns**:
```typescript
{
  accounts: Account[],      // All accounts with addresses
  balance: Balance          // Real balance from API
}
```

**Implementation Flow**:

1. **Decrypt Seed** - `WalletStorage.unlockWallet(password)` → mnemonic
2. **Derive HD Wallet** - `KeyManager.mnemonicToSeed()` + `new HDWallet()`
3. **Initialize Address Generator** - `new AddressGenerator('testnet')`
4. **Update In-Memory State** - Store seed, hdWallet, addressGenerator
5. **Start Auto-Lock Timer** - Begin 15-minute inactivity countdown
6. **Load Accounts** - Retrieve from storage
7. **Fetch Balance** - Get balance from API for all addresses

**Security Notes**:
- Decrypted seed exists ONLY in memory (state.decryptedSeed)
- Wrong password → generic error (don't reveal if wallet exists)
- Auto-lock starts immediately after unlock

---

### 5. LOCK_WALLET

**Purpose**: Clear sensitive data from memory

**Payload**: None

**Returns**:
```typescript
{
  message: 'Wallet locked'
}
```

**Implementation**:

1. Clear decrypted seed (overwrite then null)
2. Clear HDWallet instance
3. Clear AddressGenerator instance
4. Set isUnlocked = false
5. Stop auto-lock timer

**Security Notes**:
- Best-effort memory clearing (JavaScript limitation)
- Called on: manual lock, auto-lock, service worker termination
- State persists in storage (encrypted)

---

## Account Management Handlers

### 6. CREATE_ACCOUNT

**Purpose**: Add new BIP44 account (MetaMask-style multi-account)

**Payload**:
```typescript
{
  name?: string,              // Default: 'Account N'
  addressType?: AddressType   // Default: 'native-segwit'
}
```

**Returns**:
```typescript
{
  account: Account,
  firstAddress: string
}
```

**Implementation Flow**:

1. **Check Unlocked** - Require wallet to be unlocked
2. **Determine Account Index** - `accounts.length` (0-indexed)
3. **Create Account** - `hdWallet.createAccount(type, index, name)`
4. **Generate First Address** - Derive `m/84'/1'/index'/0/0`
5. **Save to Storage** - `WalletStorage.addAccount(account)`

**BIP44 Account Derivation**:
- Account 0: `m/84'/1'/0'/0/0`, `m/84'/1'/0'/0/1`, ...
- Account 1: `m/84'/1'/1'/0/0`, `m/84'/1'/1'/0/1`, ...
- Account 2: `m/84'/1'/2'/0/0`, `m/84'/1'/2'/0/1`, ...

**Security Notes**:
- Requires unlocked wallet (needs seed for key derivation)
- Each account is independent (BIP44 standard)
- All accounts share same seed phrase

---

### 7. UPDATE_ACCOUNT_NAME

**Purpose**: Rename an existing account

**Payload**:
```typescript
{
  accountIndex: number,
  name: string
}
```

**Returns**:
```typescript
{
  account: Account
}
```

**Implementation**:

1. Validate account exists
2. Update name in memory
3. Save to storage via `WalletStorage.updateAccount()`

**Notes**:
- Requires unlocked wallet
- Only updates metadata (no cryptographic operations)

---

### 8. GENERATE_ADDRESS

**Purpose**: Generate new receiving or change address

**Payload**:
```typescript
{
  accountIndex: number,
  isChange?: boolean        // Default: false (receiving address)
}
```

**Returns**:
```typescript
{
  address: Address          // Full address object with metadata
}
```

**Implementation Flow**:

1. **Check Unlocked** - Need HD wallet for derivation
2. **Find Account** - Lookup by accountIndex
3. **Determine Next Index** - `account.externalIndex` or `account.internalIndex`
4. **Derive Address Node** - `hdWallet.deriveAddressNode(type, account, change, index)`
5. **Build Derivation Path** - e.g., `m/84'/1'/0'/0/5`
6. **Generate Address** - `addressGenerator.generateAddressWithMetadata()`
7. **Update Account** - Increment index, add address to list
8. **Save to Storage** - Persist updated account

**BIP44 Address Types**:
- External (receiving): `change = 0`, index tracked by `externalIndex`
- Internal (change): `change = 1`, index tracked by `internalIndex`

**Address Gap Limit** (BIP44):
- Standard: 20 unused addresses
- We track indices but don't enforce gap limit yet
- TODO: Implement address discovery with gap limit

**Security Notes**:
- Requires unlocked wallet (key derivation needed)
- Addresses are public data (safe to expose)
- Derivation path included in metadata for debugging

---

## Transaction Handlers

### 9. GET_BALANCE

**Purpose**: Fetch confirmed and unconfirmed balance for all addresses in account

**Payload**:
```typescript
{
  accountIndex: number
}
```

**Returns**:
```typescript
{
  confirmed: number,      // Confirmed balance in satoshis
  unconfirmed: number     // Unconfirmed balance in satoshis
}
```

**Implementation Flow**:

1. **Validate Payload** - Check accountIndex is provided and valid
2. **Find Account** - Lookup account by index in storage
3. **Get All Addresses** - Extract all addresses from account
4. **Fetch Balances** - Call `blockstreamClient.getBalance()` for each address in parallel
5. **Aggregate** - Sum confirmed and unconfirmed balances across all addresses
6. **Return Total** - Return aggregated balance

**API Integration**:
```typescript
const balancePromises = addresses.map(addr => blockstreamClient.getBalance(addr));
const balances = await Promise.all(balancePromises);

const totalBalance = balances.reduce(
  (acc, balance) => ({
    confirmed: acc.confirmed + balance.confirmed,
    unconfirmed: acc.unconfirmed + balance.unconfirmed,
  }),
  { confirmed: 0, unconfirmed: 0 }
);
```

**Error Handling**:
- Account not found → `Account with index N not found`
- API errors → Propagated from BlockstreamClient
- No addresses → Returns zero balance (not an error)

**Performance Notes**:
- Parallel fetching for all addresses (Promise.all)
- No caching implemented yet (future enhancement)

---

### 10. GET_TRANSACTIONS

**Purpose**: Fetch transaction history for all addresses in account

**Payload**:
```typescript
{
  accountIndex: number,
  limit?: number          // Optional: limit number of transactions
}
```

**Returns**:
```typescript
{
  transactions: Transaction[]  // Sorted by timestamp (newest first)
}
```

**Implementation Flow**:

1. **Validate Payload** - Check accountIndex is provided
2. **Find Account** - Lookup account by index
3. **Get All Addresses** - Extract all addresses from account
4. **Fetch Transactions** - Call `blockstreamClient.getTransactions()` for each address in parallel
5. **Deduplicate** - Use Map to deduplicate by txid (same tx can involve multiple addresses)
6. **Sort** - Sort by timestamp (newest first)
7. **Apply Limit** - If limit provided, slice array
8. **Return Results** - Return deduplicated, sorted transactions

**Deduplication Logic**:
```typescript
const txMap = new Map<string, Transaction>();
for (const txArray of txArrays) {
  for (const tx of txArray) {
    if (!txMap.has(tx.txid)) {
      txMap.set(tx.txid, tx);
    }
  }
}
```

**Why Deduplication is Needed**:
- A transaction can involve multiple addresses in the same account
- Example: Send from address A to address B (both in account)
- Without deduplication: Transaction appears twice
- With deduplication: Transaction appears once

**Sorting**:
```typescript
transactions.sort((a, b) => b.timestamp - a.timestamp)
```

**Error Handling**:
- Account not found → Error
- API errors → Propagated from BlockstreamClient
- No addresses → Returns empty array (not an error)

**Performance Notes**:
- Parallel fetching for all addresses
- Deduplication in O(n) time using Map
- Sorting in O(n log n) time

---

### 11. GET_FEE_ESTIMATES

**Purpose**: Get current fee estimates from Bitcoin network

**Payload**: None

**Returns**:
```typescript
{
  slow: number,    // sat/vB - Low priority (10+ blocks)
  medium: number,  // sat/vB - Medium priority (3-6 blocks)
  fast: number     // sat/vB - High priority (1-2 blocks)
}
```

**Implementation**:

Simple wrapper around `blockstreamClient.getFeeEstimates()`:

```typescript
const feeEstimates = await blockstreamClient.getFeeEstimates();
return { success: true, data: feeEstimates };
```

**Fee Rate Mapping** (in BlockstreamClient):
- Fast: Block target 1-2 (next 1-2 blocks)
- Medium: Block target 3-6 (3-6 blocks)
- Slow: Block target 10-12 (10+ blocks)

**Error Handling**:
- API errors → Propagated from BlockstreamClient
- Fallback: If API fails, could use default rates (not implemented)

**Usage Example**:
```typescript
// User selects fee speed
const fees = await getFeeEstimates();
const selectedFeeRate = fees.fast; // or fees.medium, fees.slow
```

---

### 12. SEND_TRANSACTION

**Purpose**: Build, sign, and broadcast a Bitcoin transaction

**Payload**:
```typescript
{
  accountIndex: number,
  toAddress: string,      // Recipient Bitcoin address
  amount: number,         // Amount in satoshis
  feeRate: number         // Fee rate in sat/vB
}
```

**Returns**:
```typescript
{
  txid: string,          // Transaction ID (hash)
  fee: number,           // Actual fee paid in satoshis
  size: number           // Virtual size in vBytes
}
```

**Implementation Flow**:

1. **Check Wallet Unlocked** - Require wallet to be unlocked (need seed for signing)
2. **Validate Payload** - Check all required fields (accountIndex, toAddress, amount, feeRate)
3. **Find Account** - Lookup account by index
4. **Get All Addresses** - Extract all addresses from account
5. **Fetch UTXOs** - Call `blockstreamClient.getUTXOs()` for each address in parallel
6. **Flatten UTXOs** - Merge UTXO arrays from all addresses
7. **Check UTXO Availability** - Error if no UTXOs available
8. **Get Change Address** - Use first address in account (could be improved)
9. **Build Transaction** - Call `transactionBuilder.buildTransaction()` with:
   - UTXOs to spend from
   - Output (recipient address + amount)
   - Change address
   - Fee rate
   - Callback functions for key derivation
10. **Broadcast Transaction** - Call `blockstreamClient.broadcastTransaction()` with signed tx hex
11. **Return Result** - Return txid, fee, and size

**Callback Functions**:

The TransactionBuilder needs three callbacks to derive keys and metadata:

```typescript
getPrivateKey: (derivationPath: string) => {
  // Derive private key from HD wallet using derivation path
  const node = state.hdWallet!.derivePath(derivationPath);
  if (!node.privateKey) {
    throw new Error(`Failed to derive private key for path: ${derivationPath}`);
  }
  return node.privateKey;
}
```

```typescript
getAddressType: (address: string) => {
  // All addresses in account have same type
  return account.addressType;
}
```

```typescript
getDerivationPath: (address: string) => {
  // Find address in account to get its derivation path
  const addrObj = account.addresses.find(a => a.address === address);
  if (!addrObj) {
    throw new Error(`Address ${address} not found in account`);
  }
  return addrObj.derivationPath;
}
```

**TransactionBuilder Integration**:

The TransactionBuilder handles:
- UTXO selection (greedy algorithm)
- Fee calculation
- Change output creation
- PSBT construction
- Input signing (Legacy, SegWit, Native SegWit)
- Transaction finalization
- Transaction verification

See `src/background/bitcoin/TransactionBuilder.ts` for full implementation.

**Error Handling**:
- Wallet locked → `Wallet is locked. Please unlock first.`
- Invalid payload → Specific validation errors
- Account not found → `Account with index N not found`
- No addresses → `No addresses found in account`
- No UTXOs → `No UTXOs available for spending`
- Insufficient funds → Thrown by TransactionBuilder
- Invalid recipient address → Thrown by TransactionBuilder
- Broadcast failure → Propagated from BlockstreamClient

**Security Notes**:
- Requires unlocked wallet (private keys needed)
- Private keys derived on-demand (not stored)
- Transaction verified before broadcast
- All amounts in satoshis (no floating point)

**Performance Notes**:
- UTXO fetching is parallel (Promise.all)
- Transaction building is synchronous (fast)
- Broadcast is network-bound (1-3 seconds)

**Future Enhancements**:
- UTXO caching (reduce API calls)
- Better change address selection (unused address)
- RBF (Replace-By-Fee) support
- Transaction preview before signing
- Multiple outputs (batch payments)

---

### 13. GET_BTC_PRICE

**Purpose**: Get current BTC/USD price from CoinGecko API

**Payload**: None

**Returns**:
```typescript
{
  usd: number,         // Bitcoin price in USD
  lastUpdated: number  // Timestamp when price was fetched
}
```

**Implementation**:

```typescript
async function handleGetBtcPrice(): Promise<MessageResponse> {
  try {
    const price = await priceService.getPrice();
    return { success: true, data: price };
  } catch (error) {
    console.error('[Background] Failed to get BTC price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get BTC price',
    };
  }
}
```

**Features**:
- 5-minute price caching (reduces API calls)
- 10-second timeout per request
- Single retry on network failure
- Non-blocking (failures don't affect wallet operations)

**See Also**: [api.md](./api.md) for detailed PriceService documentation

---

## Multisig Handlers

### 1. CREATE_MULTISIG_ACCOUNT

**Purpose**: Create a new multi-signature account with M-of-N configuration

**Message**: `MessageType.CREATE_MULTISIG_ACCOUNT`

**Payload**:
```typescript
{
  config: MultisigConfig,          // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType, // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  name: string,
  cosignerXpubs: Array<{
    name: string,
    xpub: string,
    fingerprint: string
  }>
}
```

**Returns**: `{ account: MultisigAccount }`

**Implementation Details**:
- Requires wallet to be unlocked
- Validates all cosigner xpubs
- Automatically exports our xpub using MultisigManager
- Creates BIP48-compliant account structure
- Stores in WalletStorage as type-cast to Account (StoredWalletV2 supports both types)

**Security Notes**:
- Only public keys (xpubs) are handled
- Validates number of cosigners matches M-of-N configuration
- Uses BIP48 derivation paths

---

### 2. EXPORT_OUR_XPUB

**Purpose**: Export our extended public key for sharing with co-signers

**Message**: `MessageType.EXPORT_OUR_XPUB`

**Payload**:
```typescript
{
  config: MultisigConfig,
  addressType: MultisigAddressType,
  accountIndex?: number  // Default: 0
}
```

**Returns**: `{ xpub: string, fingerprint: string }`

**Implementation Details**:
- Requires wallet to be unlocked
- Derives BIP48 path from config, addressType, and accountIndex
- Uses MultisigManager.exportOurXpub()
- Returns neutered (public-only) extended key
- Includes 4-byte fingerprint for verification

**Security Notes**:
- Never exposes private keys
- Xpub is safe to share with co-signers
- Fingerprint should be verified in person

---

### 3. IMPORT_COSIGNER_XPUB

**Purpose**: Import and validate a co-signer's extended public key

**Message**: `MessageType.IMPORT_COSIGNER_XPUB`

**Payload**:
```typescript
{
  xpub: string,
  name: string
}
```

**Returns**: `{ cosigner: Partial<Cosigner> }`

**Implementation Details**:
- Validates xpub format and network
- Extracts fingerprint from xpub
- Returns cosigner data without derivationPath (set by caller)
- Does not require wallet to be unlocked

**Security Notes**:
- Validates xpub is public key (not private)
- Checks network prefix matches wallet network
- Rejects invalid or malformed xpubs

---

### 4. BUILD_MULTISIG_TRANSACTION

**Purpose**: Create unsigned PSBT for a multisig transaction

**Message**: `MessageType.BUILD_MULTISIG_TRANSACTION`

**Payload**:
```typescript
{
  accountIndex: number,
  toAddress: string,
  amount: number,        // Satoshis
  feeRate: number        // Sat/vB
}
```

**Returns**: `{ psbtBase64: string, txid: string }`

**Implementation Details**:
- Requires wallet to be unlocked
- Fetches UTXOs from all addresses in multisig account
- Uses TransactionBuilder.buildMultisigPSBT()
- Includes appropriate redeem/witness scripts
- Exports PSBT in base64 format for sharing
- Does NOT sign the transaction (returns unsigned PSBT)

**Process**:
1. Validate account is multisig type
2. Fetch all UTXOs for account addresses
3. Select UTXOs based on amount + fee
4. Build PSBT with inputs/outputs
5. Add multisig scripts to each input
6. Export PSBT for distribution

**Security Notes**:
- Validates recipient address
- Checks for dust outputs
- Verifies sufficient funds before building

---

### 5. SIGN_MULTISIG_TRANSACTION

**Purpose**: Sign a PSBT with our private key

**Message**: `MessageType.SIGN_MULTISIG_TRANSACTION`

**Payload**:
```typescript
{
  psbtBase64: string,
  accountIndex: number
}
```

**Returns**: `{ psbtBase64: string, signaturesAdded: number }`

**Implementation Details**:
- Requires wallet to be unlocked
- Imports and validates PSBT
- Derives all cosigner public keys
- Finds our private key from account
- Signs all inputs using TransactionBuilder.signMultisigPSBT()
- Validates signatures after signing
- Exports updated PSBT with our signatures

**Process**:
1. Import PSBT and validate structure
2. Get multisig account and config
3. Derive public keys for all cosigners (BIP67 sorted)
4. Derive our private key from HD wallet
5. Sign each input with our key
6. Validate signatures
7. Count total signatures
8. Export signed PSBT

**Security Notes**:
- Private key only used for signing, never exposed
- Validates each signature after adding
- Supports partially-signed PSBTs (adds our signature to existing ones)

---

### 6. EXPORT_PSBT

**Purpose**: Export PSBT in various formats (base64, hex, QR chunks)

**Message**: `MessageType.EXPORT_PSBT`

**Payload**:
```typescript
{
  psbtBase64: string,
  format?: 'base64' | 'hex' | 'qr'  // Default: 'base64'
}
```

**Returns**: `{ export: PSBTExport }`

**Implementation Details**:
- Imports and validates PSBT
- For 'base64' or 'hex': Returns full PSBTExport with metadata
- For 'qr': Includes PSBTChunk[] array for QR code display
- Chunks are ~2500 bytes each (fits in standard QR)

**PSBTExport Structure**:
```typescript
{
  base64: string,
  hex: string,
  txid: string,
  numInputs: number,
  numOutputs: number,
  totalOutput: number,
  fee: number,
  signatures: number[],  // Per-input signature counts
  finalized: boolean,
  chunks?: PSBTChunk[]   // Only for 'qr' format
}
```

---

### 7. IMPORT_PSBT

**Purpose**: Import and validate PSBT from external source

**Message**: `MessageType.IMPORT_PSBT`

**Payload**:
```typescript
{
  psbtString: string  // Base64 or hex
}
```

**Returns**: `{ psbt: PSBTImportResult }`

**Implementation Details**:
- Accepts base64 or hex format
- Validates PSBT structure
- Checks for required UTXO data
- Returns warnings for missing data
- Does not modify PSBT

**PSBTImportResult**:
```typescript
{
  txid: string,
  isValid: boolean,
  warnings: string[]
}
```

---

### 8. GET_PENDING_MULTISIG_TXS

**Purpose**: Retrieve all pending multisig transactions

**Message**: `MessageType.GET_PENDING_MULTISIG_TXS`

**Payload**:
```typescript
{
  accountIndex?: number  // Optional filter
}
```

**Returns**: `{ pendingTxs: PendingMultisigTx[] }`

**Implementation Details**:
- Reads from StoredWalletV2.pendingMultisigTxs
- Filters by accountIndex if provided
- Returns empty array for v1 wallets
- Does not require wallet to be unlocked

---

### 9. SAVE_PENDING_MULTISIG_TX

**Purpose**: Save PSBT for later signing/broadcasting

**Message**: `MessageType.SAVE_PENDING_MULTISIG_TX`

**Payload**:
```typescript
{
  psbtBase64: string,
  accountIndex: number,
  metadata: {
    amount: number,
    recipient: string,
    fee: number
  }
}
```

**Returns**: `{ pendingTx: PendingMultisigTx }`

**Implementation Details**:
- Validates PSBT and account
- Creates PendingMultisigTx record
- Tracks signature status per cosigner
- Sets 7-day expiration
- Stores in StoredWalletV2
- Updates existing if txid matches

**PendingMultisigTx Structure**:
```typescript
{
  id: string,                    // txid
  accountId: number,
  psbtBase64: string,
  created: number,
  expiresAt: number,
  multisigConfig: MultisigConfig,
  signaturesCollected: number,
  signaturesRequired: number,
  signatureStatus: {
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

---

### 10. DELETE_PENDING_MULTISIG_TX

**Purpose**: Remove pending transaction from storage

**Message**: `MessageType.DELETE_PENDING_MULTISIG_TX`

**Payload**:
```typescript
{
  txid: string
}
```

**Returns**: `{ success: boolean }`

**Implementation Details**:
- Removes transaction by txid
- Returns error if not found
- Updates StoredWalletV2 in chrome.storage

---

### 11. BROADCAST_MULTISIG_TRANSACTION

**Purpose**: Broadcast finalized transaction to network

**Message**: `MessageType.BROADCAST_MULTISIG_TRANSACTION`

**Payload**:
```typescript
{
  txHex: string  // Fully signed transaction
}
```

**Returns**: `{ txid: string }`

**Implementation Details**:
- Uses BlockstreamClient.broadcastTransaction()
- Returns confirmed txid
- Does not validate signatures (assumes finalized)
- Network will reject if invalid

**Process**:
1. Receive finalized transaction hex
2. POST to Blockstream API
3. Return txid on success
4. Propagate network errors

---

### Multisig Handler Summary

| Handler | Unlock Required | Returns | Side Effects |
|---------|----------------|---------|--------------|
| CREATE_MULTISIG_ACCOUNT | ✅ Yes | MultisigAccount | Adds account to storage |
| EXPORT_OUR_XPUB | ✅ Yes | xpub, fingerprint | None |
| IMPORT_COSIGNER_XPUB | ❌ No | Partial<Cosigner> | None |
| BUILD_MULTISIG_TRANSACTION | ✅ Yes | PSBT (unsigned) | None |
| SIGN_MULTISIG_TRANSACTION | ✅ Yes | PSBT (signed) | None |
| EXPORT_PSBT | ❌ No | PSBTExport | None |
| IMPORT_PSBT | ❌ No | PSBTImportResult | None |
| GET_PENDING_MULTISIG_TXS | ❌ No | PendingMultisigTx[] | None |
| SAVE_PENDING_MULTISIG_TX | ❌ No | PendingMultisigTx | Adds/updates in storage |
| DELETE_PENDING_MULTISIG_TX | ❌ No | success: boolean | Removes from storage |
| BROADCAST_MULTISIG_TRANSACTION | ❌ No | txid | Broadcasts to network |

---

## Single Tab Enforcement

### Overview

**Security Requirement**: Only ONE wallet tab can access the unlocked wallet at any given time.

**Why This Matters**:
- Multiple tabs = multiple attack surfaces
- Prevents session confusion and state synchronization issues
- Reduces risk of session hijacking or phishing attacks
- Ensures consistent user experience

### Architecture

The single tab enforcement system uses cryptographically secure session tokens managed by the background service worker.

**Components**:
1. **Session Token Generation** - Cryptographically random 32-byte tokens
2. **Token Validation** - Validate token every 5 seconds from tab
3. **Session Revocation** - Revoke old session when new tab requests token
4. **Tab Communication** - Push notifications to revoked tabs

**Implementation**: `/src/background/index.ts` (lines 3018-3167)

### Data Structures

```typescript
interface TabSession {
  tabId: number;          // Chrome tab ID
  token: string;          // 64-character hex token (32 bytes)
  issuedAt: number;       // Timestamp when token was issued
  lastValidated: number;  // Timestamp of last validation
}

// Global state in background service worker
let activeTabSession: TabSession | null = null;
```

**Design Decision**: Only ONE `activeTabSession` at a time (enforces single tab)

### Token Generation

```typescript
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);  // Cryptographically secure random
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

**Security Properties**:
- 256 bits of entropy (2^256 possible tokens)
- Cryptographically secure random source
- Hex-encoded for easy transmission
- Unpredictable (cannot be guessed or forged)

### Tab Session Lifecycle

#### 1. Tab Requests Token (On Load or Visibility Change)

**Tab Side**:
```typescript
async function requestSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({
    type: 'REQUEST_TAB_TOKEN'
  });

  if (response.granted && response.token) {
    sessionToken = response.token;
    sessionValid = true;
    return true;
  }
  return false;
}
```

**Background Side**:
```typescript
function requestTabToken(tabId: number): { token: string; granted: boolean } {
  // If there's an active session for a different tab, invalidate it
  if (activeTabSession && activeTabSession.tabId !== tabId) {
    // Notify the old tab that it's been superseded
    chrome.tabs.sendMessage(activeTabSession.tabId, {
      type: 'SESSION_REVOKED',
      reason: 'Another wallet tab was opened'
    });
  }

  // Generate new token for requesting tab
  const token = generateSessionToken();
  activeTabSession = {
    tabId,
    token,
    issuedAt: Date.now(),
    lastValidated: Date.now()
  };

  return { token, granted: true };
}
```

**Flow**:
```
Tab A loads and requests token
  ↓
Background grants token to Tab A
  ↓
Tab A starts validation loop (every 5s)
  ↓
User opens Tab B (manually or via extension icon)
  ↓
Tab B requests token
  ↓
Background revokes Tab A's session
Background sends SESSION_REVOKED to Tab A
Background grants new token to Tab B
  ↓
Tab A receives SESSION_REVOKED
Tab A shows "Wallet Tab Closed" message
Tab A locks wallet
  ↓
Only Tab B has valid session
```

#### 2. Tab Validates Token (Every 5 Seconds)

**Tab Side**:
```typescript
async function validateSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({
    type: 'VALIDATE_TAB_TOKEN',
    token: sessionToken
  });

  if (response.valid) {
    sessionValid = true;
    return true;
  } else {
    sessionValid = false;
    handleSessionRevoked(response.reason);
    return false;
  }
}

// Validation loop
setInterval(() => {
  validateSessionToken();
}, 5000);
```

**Background Side**:
```typescript
function validateTabToken(tabId: number, token: string): { valid: boolean; reason?: string } {
  if (!activeTabSession) {
    return { valid: false, reason: 'No active session' };
  }
  if (activeTabSession.tabId !== tabId) {
    return { valid: false, reason: 'Token belongs to different tab' };
  }
  if (activeTabSession.token !== token) {
    return { valid: false, reason: 'Invalid token' };
  }

  // Token is valid - update last validated time
  activeTabSession.lastValidated = Date.now();
  return { valid: true };
}
```

**Validation Checks**:
1. Does an active session exist? (No → invalid)
2. Is the tab ID correct? (No → invalid)
3. Does the token match? (No → invalid)
4. All checks pass → valid, update `lastValidated`

#### 3. Session Revocation

**Trigger Events**:
- Another tab requests a token
- Tab is closed (`chrome.tabs.onRemoved`)
- Manual revocation (future: admin lock feature)

**Background Revocation**:
```typescript
function revokeTabToken(tabId: number): void {
  if (activeTabSession && activeTabSession.tabId === tabId) {
    console.log(`[TAB SESSION] Revoked token for tab ${tabId}`);
    activeTabSession = null;
  }
}

// Listen for tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  revokeTabToken(tabId);
});
```

**Tab Handles Revocation**:
```typescript
function handleSessionRevoked(reason: string): void {
  // Lock wallet
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });

  // Show revocation UI
  document.body.innerHTML = `
    <div style="...">
      <h1>🔒 Wallet Tab Closed</h1>
      <p>${reason}</p>
      <button onclick="window.close()">Close This Tab</button>
    </div>
  `;
}

// Listen for revocation messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SESSION_REVOKED') {
    handleSessionRevoked(message.reason);
  }
});
```

### Security Properties

**Token-Based Security**:
- Tokens are cryptographically random (cannot be guessed)
- Tokens are single-use per session (not reusable)
- Validation happens server-side (background) - tabs cannot forge validity
- Revocation is immediate and enforced by background

**Defense-in-Depth**:
1. **Tab-level**: Clickjacking, tab nabbing, visibility monitoring
2. **Background-level**: Session tokens, single active session enforcement
3. **CSP-level**: `frame-ancestors 'none'` prevents embedding
4. **Storage-level**: Encrypted wallet data, activity tracking

**Attack Scenarios Mitigated**:
- User opens duplicate tabs → Only latest tab works, others show revocation message
- Malicious page tries to embed wallet in iframe → Blocked by iframe detection + CSP
- Malicious script tries to redirect wallet tab → Detected within 1 second, wallet locked
- User leaves tab open and walks away → Auto-locks after 5 minutes (tab) or 15 minutes (inactivity)
- Attacker tries to reuse old session token → Validation fails (token rotated)

---

## Contact Management Handlers

### ADD_CONTACT

**Purpose**: Add a new contact to the address book (Contacts v2.0 with hybrid model)

**Payload**:
```typescript
{
  name: string,              // Required: Contact name (1-50 chars)
  address?: string,          // Optional: Single Bitcoin address
  xpub?: string,             // Optional: Extended public key
  email?: string,            // Optional: Email address
  notes?: string,            // Optional: Notes (max 500 chars)
  category?: string,         // Optional: Category (max 30 chars)
  color?: ContactColor       // Optional: Avatar color (default: 'blue')
}
```

**Note**: At least one of `address` OR `xpub` must be provided (hybrid model)

**Returns**:
```typescript
{
  contact: Contact  // Newly created contact with generated ID and metadata
}
```

**Implementation Flow**:

1. **Validate payload** - Name required, at least one of address/xpub required
2. **Check wallet unlocked** - Password required for v2 encryption
3. **Get network** - From wallet settings (testnet/mainnet)
4. **Call ContactsStorage.addContact()** - Validates and stores contact
   - If xpub provided: Derives initial 20 addresses
   - Encrypts contact with AES-256-GCM (v2)
   - Generates unique ID and timestamps
5. **Return contact** - With all metadata populated

**Validation Rules**:
- Name: 1-50 chars, no HTML/CSV injection
- Address (if provided): Valid Bitcoin address for network
- Xpub (if provided): Valid BIP32 extended public key for network
- Email (if provided): Valid email format
- Notes (if provided): Max 500 chars
- Category (if provided): Max 30 chars

**Error Cases**:
- Missing name: "Contact name is required"
- Missing both address and xpub: "Either address or xpub is required"
- Invalid address: "Invalid Bitcoin address"
- Invalid xpub: "[XpubValidator error message]"
- Wallet locked: "Wallet must be unlocked to add contacts"
- Contact limit reached: "Contact limit reached (1000 contacts maximum)"

**Security Notes**:
- All contacts encrypted with AES-256-GCM in v2
- Validation prevents CSV injection, XSS, and formula injection
- Xpub fingerprint stored for verification
- Initial 20 addresses cached for quick lookups

**Related Handlers**: UPDATE_CONTACT, GET_CONTACTS, DELETE_CONTACT

**Bug Fix (2025-10-22)**:

**Issue**: Backend validation required BOTH name AND address, preventing xpub-only contacts even though ContactsStorage and validation utilities supported the hybrid model (address OR xpub).

**Root Cause**: Three issues found:
1. Backend handler validation (line 3222): `if (!payload.name || !payload.address)` - required address
2. Backend addContact call (lines 3252-3260): Only passed `address`, ignored `xpub`, `email`, `color`
3. Frontend hook (lines 138-145): Only sent `address`, didn't send `xpub`, `email`, `color` to backend

**Fix Applied**:
1. **Backend validation** (`src/background/index.ts` lines 3221-3234):
   - Changed to validate name separately
   - Added hybrid validation: `if (!payload.address && !payload.xpub)`
   - Extracts all v2.0 fields: `{ name, address, xpub, email, notes, category, color }`

2. **Backend ContactsStorage call** (lines 3252-3264):
   - Pass all v2.0 fields to ContactsStorage.addContact()
   - Make address/xpub optional: `address: address ? String(address) : undefined`
   - Default color to 'blue' if not provided
   - Updated console log to show address OR xpub

3. **Frontend hook** (`src/tab/hooks/useContacts.ts` lines 138-148):
   - Added all v2.0 fields to message payload: `xpub`, `email`, `color`
   - Frontend modal already collected these fields correctly

**Result**: Users can now create contacts with:
- Name + address only
- Name + xpub only (NEW - now working!)
- Name + address + xpub (both)
- All combinations with optional email, notes, category, color

**Tests**: All 65 ContactsStorage tests pass, including "should require at least one address method (address or xpub)"

---

## See Also

- [service-worker.md](./service-worker.md) - Service worker architecture
- [storage.md](./storage.md) - Chrome storage patterns
- [api.md](./api.md) - API integration
- [decisions.md](./decisions.md) - Backend ADRs
