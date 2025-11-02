# Wallet Restore from Private Key - Blockchain Expert Technical Review

**Version**: 1.0
**Date**: 2025-10-22
**Reviewer**: Blockchain Expert
**Status**: Technical Review Complete
**Related PRD**: [WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md](./WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md)

---

## Executive Summary

**Review Verdict**: ✅ **APPROVED WITH RECOMMENDATIONS**

The Product Manager's technical approach for wallet restore from private key is **architecturally sound and Bitcoin-protocol compliant**. The proposed non-HD wallet structure is valid, secure, and follows established wallet patterns. However, several critical implementation details require attention.

**Key Findings**:
- ✅ Non-HD wallet structure is valid (empty `encryptedSeed` is acceptable)
- ✅ WIF import and validation implementation is correct
- ⚠️ Change address strategy requires privacy tradeoff decision
- ⚠️ Address type detection from WIF has limitations
- ✅ Transaction signing approach is correct
- ⚠️ No new wallet version needed, but validation rules must be added

**Critical Recommendations**:
1. Use **same address for change** (simpler, acceptable privacy tradeoff for MVP)
2. **Require user to specify address type** for compressed keys (cannot auto-detect reliably)
3. Add **wallet structure validation** to prevent HD/non-HD conflicts
4. Implement **migration path** for users to eventually move to HD wallet
5. Show **clear privacy warnings** about address reuse

---

## Question 1: Non-HD Wallet Architecture

### Q: Can we create a wallet with ONLY an imported private key (no HD seed)?

**Answer**: ✅ **YES - This is valid and well-established**

### Technical Validation

**Bitcoin Protocol Perspective**:
- Non-HD wallets are the **original Bitcoin wallet format** (Bitcoin Core v0.1-v0.12)
- Single private key wallets are **fully Bitcoin-protocol compliant**
- Many wallets support this: Electrum (watching only), Mycelium (cold storage), Bitcoin Core (importprivkey)

**Implementation Pattern**:
```typescript
interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;  // EMPTY STRING for non-HD wallet
  salt: string;           // Wallet encryption salt
  iv: string;             // Wallet encryption IV
  accounts: WalletAccount[];
  importedKeys: { [accountIndex: number]: ImportedKeyData };
  // Account 0 is the imported key account
}
```

### Architectural Soundness

**✅ Recommended Approach**:
- Set `encryptedSeed = ''` (empty string) to indicate non-HD wallet
- Store imported private key in `importedKeys[0]` with own encryption
- Mark account with `importType: 'private-key'`
- Account index 0 is the single imported account

**Why Empty String?**:
- Type safety: `encryptedSeed: string` expects a string (not null/undefined)
- Consistent with TypeScript strict mode
- Easy to validate: `if (wallet.encryptedSeed === '')`
- No need for optional field or union types

**Precedent**: This mirrors Bitcoin Core's approach where `hdseed` field is empty for non-HD wallets.

### Alternative Considered (Rejected)

**❌ NOT Recommended**: New wallet version (v3)

**Why Not**:
- No breaking changes to structure (same fields)
- Version bump would require migration code
- Empty string is semantically clear
- No benefit to version increment

### Validation Requirements

**CRITICAL**: Add validation to prevent HD/non-HD conflicts:

```typescript
// Validation function (add to WalletStorage or KeyManager)
function validateWalletStructure(wallet: StoredWalletV2): void {
  const isNonHD = wallet.encryptedSeed === '';
  const hasImportedKeys = wallet.importedKeys && Object.keys(wallet.importedKeys).length > 0;

  if (isNonHD) {
    // Non-HD wallet validations
    if (!hasImportedKeys) {
      throw new Error('Non-HD wallet must have imported keys');
    }

    if (wallet.accounts.length === 0) {
      throw new Error('Non-HD wallet must have at least one account');
    }

    // Verify all accounts are imported type
    const allImported = wallet.accounts.every(
      (acc) => acc.accountType === 'single' && acc.importType === 'private-key'
    );
    if (!allImported) {
      throw new Error('Non-HD wallet cannot have HD-derived accounts');
    }
  } else {
    // HD wallet validations (existing logic)
    if (wallet.encryptedSeed.length < 64) {
      throw new Error('HD wallet must have valid encrypted seed');
    }
  }
}
```

### Answer Summary

| Question | Answer |
|----------|--------|
| Can we create non-HD wallet? | ✅ YES - Valid Bitcoin wallet type |
| Empty string for `encryptedSeed`? | ✅ YES - Type-safe and clear |
| Need wallet version 3? | ❌ NO - v2 structure is sufficient |
| Need validation? | ✅ YES - Add structure validation |

---

## Question 2: Change Address Generation

### Q: How do we generate change addresses without HD derivation?

**Answer**: ⚠️ **Use Same Address (Recommended for MVP)**

### The Problem

Non-HD wallets face a fundamental limitation:
- **HD wallets**: Can derive infinite addresses from seed
- **Non-HD wallets**: Have only ONE private key

### Option Analysis

#### Option A: Reuse Same Address for Change ✅ RECOMMENDED

**Implementation**:
```typescript
async function generateChangeAddress(
  account: Account,
  accountIndex: number
): Promise<string> {
  if (account.importType === 'private-key') {
    // Non-HD: Return the single address
    return account.addresses[0].address;
  } else {
    // HD: Derive new change address
    return deriveHDChangeAddress(account, accountIndex);
  }
}
```

**Pros**:
- ✅ Simple implementation (no complex derivation)
- ✅ Guaranteed to work (always have the key)
- ✅ No risk of key loss (single key to backup)
- ✅ Bitcoin-protocol compliant (address reuse is allowed)
- ✅ Common pattern (Bitcoin Core importprivkey does this)

**Cons**:
- ❌ **Privacy concern**: Address reuse links transactions
- ❌ Users can see all transactions to this address
- ❌ Chain analysis easier (all activity linked)

**Privacy Impact**:
- **Low** if user only sends to themselves or trusted parties
- **High** if user receives from multiple sources
- **Mitigated** by clear user warnings

**Precedent**:
- Bitcoin Core's `importprivkey` reuses the same address for change
- Many hardware wallets use address reuse for imported keys
- Electrum allows this with appropriate warnings

---

#### Option B: Derive Change Addresses from Private Key ❌ NOT RECOMMENDED

**Implementation** (using BIP32 from private key):
```typescript
// Convert private key to BIP32 node
const keyPair = ECPair.fromPrivateKey(privateKeyBuffer);
const node = BIP32.fromPrivateKey(
  privateKeyBuffer,
  Buffer.alloc(32), // PROBLEM: No chain code!
  network
);

// Attempt derivation (WILL FAIL)
const childNode = node.derive(0); // Cannot derive without chain code
```

**Why This Fails**:
- ❌ **BIP32 requires chain code** (256 bits) in addition to private key
- ❌ WIF format **only contains private key** (256 bits), no chain code
- ❌ Cannot derive child keys without chain code
- ❌ Would need to generate random chain code (defeats determinism)

**Theoretical Workaround** (NOT RECOMMENDED):
- Generate pseudo-random chain code from private key hash
- Derive child addresses using this synthetic chain code
- **Problem**: Non-standard, not compatible with any other wallet

---

#### Option C: Generate Random New Private Keys ❌ NOT RECOMMENDED

**Implementation**:
```typescript
// Generate new random private key for change
const newKeyPair = ECPair.makeRandom({ network });
const changeAddress = getAddressFromKeyPair(newKeyPair);

// Store new private key
await storeAdditionalImportedKey(accountIndex, newKeyPair.privateKey);
```

**Why This Fails**:
- ❌ **Breaks backup model**: User backed up ONE key, now has MULTIPLE keys
- ❌ **Recovery impossible**: If user loses wallet, they lose the random change keys
- ❌ **Defeats purpose**: User wanted simple single-key wallet
- ❌ **Increases complexity**: Now managing multiple keys per account

---

### Recommended Approach for MVP

**Use Option A: Reuse Same Address**

**Implementation**:
```typescript
// In TransactionBuilder or WalletManager

async function getChangeAddress(
  accountIndex: number,
  account: Account
): Promise<string> {
  if (account.importType === 'private-key') {
    // Non-HD wallet: Reuse the imported address
    const importedAddress = account.addresses.find(addr => !addr.isChange);
    if (!importedAddress) {
      throw new Error('Imported account must have at least one address');
    }
    return importedAddress.address;
  } else {
    // HD wallet: Generate new change address
    const changeIndex = account.internalIndex;
    return await generateNewAddress(accountIndex, true, changeIndex);
  }
}
```

**User Warnings to Display**:

1. **During Import**:
   ```
   ⚠️ Privacy Notice

   Wallets imported from private keys will reuse the same address for change
   transactions, which may reduce privacy. For better privacy, consider
   creating a wallet with a seed phrase.

   [Learn More] [Continue]
   ```

2. **In Dashboard** (dismissible banner):
   ```
   ℹ️ This wallet uses a single address

   For better privacy, you may want to migrate to a seed phrase wallet.
   [Migrate Now] [Dismiss]
   ```

3. **Before Sending** (if address has been used):
   ```
   ⚠️ Address Reuse Warning

   This transaction will send change back to an address that has been used
   before. This may reduce your privacy.

   [Continue Anyway] [Cancel]
   ```

### Future Enhancement (Post-MVP)

**Option D: BIP32 Derivation from Private Key + User-Provided Chain Code**

If users want better privacy without migrating to HD wallet:
1. User provides additional 32-byte chain code (or password to derive it)
2. Combine imported private key + chain code → BIP32 node
3. Derive change addresses deterministically
4. User must backup BOTH private key AND chain code

**Complexity**: High
**User Experience**: Poor (two things to backup)
**Recommendation**: Do NOT implement unless strongly requested

---

### Answer Summary

| Option | Feasible? | Recommended? | Privacy | Complexity |
|--------|-----------|--------------|---------|------------|
| **A: Reuse Address** | ✅ Yes | ✅ **YES (MVP)** | Low | Low |
| **B: BIP32 Derivation** | ❌ No | ❌ No | N/A | High |
| **C: Random Keys** | ⚠️ Yes | ❌ No | High | High |
| **D: User Chain Code** | ⚠️ Yes | ⏳ Future | High | Very High |

**MVP Decision**: **Option A - Reuse same address with clear privacy warnings**

---

## Question 3: Transaction Signing

### Q: What's the correct approach for signing transactions with non-HD accounts?

**Answer**: ✅ **Direct Private Key Signing (Conditionally Branch Based on importType)**

### Current HD Wallet Signing Flow

```typescript
// HD wallet signing (existing code)
const accountNode = hdWallet.deriveAccountNode(addressType, accountIndex);
const addressNode = accountNode.derive(change).derive(addressIndex);
const privateKey = addressNode.privateKey; // Derived from seed

// Sign transaction input
psbt.signInput(inputIndex, ECPair.fromPrivateKey(privateKey, { network }));
```

### Non-HD Wallet Signing Flow

```typescript
// Non-HD wallet signing (new code)
const importedKeyData = wallet.importedKeys[accountIndex];
const decryptedWIF = await decryptData(
  importedKeyData.encryptedData,
  password,
  importedKeyData.salt,
  importedKeyData.iv
);

const keyInfo = KeyManager.decodeWIF(decryptedWIF, network);
const privateKey = Buffer.from(keyInfo.privateKey, 'hex');

// Sign transaction input (same signing logic)
psbt.signInput(inputIndex, ECPair.fromPrivateKey(privateKey, { network }));
```

### Unified Implementation

**Add to TransactionBuilder or WalletManager**:

```typescript
/**
 * Get private key for signing (supports both HD and non-HD accounts)
 */
async function getPrivateKeyForSigning(
  accountIndex: number,
  derivationPath: string, // e.g., "m/84'/1'/0'/0/0" or "imported"
  account: Account,
  walletPassword: string
): Promise<Buffer> {
  if (account.importType === 'private-key') {
    // NON-HD WALLET: Decrypt and return imported private key

    const importedKeyData = await WalletStorage.getImportedKey(accountIndex);
    if (!importedKeyData) {
      throw new Error(`Imported key not found for account ${accountIndex}`);
    }

    // Decrypt WIF
    const decryptedWIF = await CryptoUtils.decryptData(
      importedKeyData.encryptedData,
      walletPassword,
      importedKeyData.salt,
      importedKeyData.iv
    );

    // Decode WIF to get private key
    const keyInfo = KeyManager.decodeWIF(decryptedWIF, state.network);
    const privateKey = Buffer.from(keyInfo.privateKey, 'hex');

    // SECURITY: Clear sensitive data
    CryptoUtils.clearSensitiveData(decryptedWIF);

    return privateKey;

  } else {
    // HD WALLET: Derive private key from seed using derivation path

    if (!state.hdWallet) {
      throw new Error('HD wallet not initialized');
    }

    const node = state.hdWallet.derivePath(derivationPath);
    if (!node.privateKey) {
      throw new Error('Failed to derive private key');
    }

    return node.privateKey;
  }
}
```

### Transaction Builder Integration

**Modify `buildTransaction` to handle both wallet types**:

```typescript
// In TransactionBuilder.buildTransaction()

// Build PSBT
const psbt = new bitcoin.Psbt({ network: this.network });

// Add inputs
for (const utxo of selection.selectedUtxos) {
  // ... add input to PSBT
}

// Add outputs
for (const output of params.outputs) {
  psbt.addOutput({ address: output.address, value: output.amount });
}

// Add change output
if (selection.change > DUST_THRESHOLD) {
  psbt.addOutput({ address: params.changeAddress, value: selection.change });
}

// SIGN INPUTS
for (let i = 0; i < selection.selectedUtxos.length; i++) {
  const utxo = selection.selectedUtxos[i];

  // Get private key (works for both HD and non-HD)
  const privateKey = await params.getPrivateKey(utxo.derivationPath);

  // Create key pair
  const keyPair = ECPair.fromPrivateKey(privateKey, {
    network: this.network,
    compressed: true // Assume compressed (validated during import)
  });

  // Sign input
  psbt.signInput(i, keyPair);

  // SECURITY: Clear private key from memory
  CryptoUtils.clearSensitiveData(privateKey);
}

// Finalize and extract transaction
psbt.finalizeAllInputs();
const tx = psbt.extractTransaction();
```

### UTXO Selection Considerations

**Question**: Do we need different UTXO selection logic for non-HD accounts?

**Answer**: ⚠️ **Minimal changes, but consider limitations**

**Differences**:
- Non-HD accounts have **fewer UTXOs** (single address vs multiple)
- Non-HD accounts **cannot split funds** easily (all UTXOs on one address)
- UTXO selection algorithm **remains the same** (largest-first, randomization, etc.)

**Special Case Handling**:
```typescript
function selectUTXOs(params: UTXOSelectionParams): UTXOSelectionResult {
  // Same algorithm for both HD and non-HD wallets
  const sorted = sortUTXOsByValue(params.utxos, 'desc');
  const randomized = randomizeTopHalf(sorted); // Privacy enhancement

  // Select UTXOs
  let selectedUtxos: SelectedUTXO[] = [];
  let totalInput = 0;

  for (const utxo of randomized) {
    selectedUtxos.push(utxo);
    totalInput += utxo.value;

    const estimatedFee = estimateFee(selectedUtxos.length, outputCount, feeRate);
    const totalNeeded = targetAmount + estimatedFee;

    if (totalInput >= totalNeeded) {
      break;
    }
  }

  // No special logic needed for non-HD accounts
  return { selectedUtxos, totalInput, fee, change };
}
```

**Recommendation**: ✅ **No changes needed to UTXO selection algorithm**

### Multiple UTXOs on Same Address

**Question**: How do we handle multiple UTXOs on the same imported address?

**Answer**: ✅ **Same signing key for all inputs (simpler)**

**Scenario**:
```
User has 3 UTXOs on the same imported address:
- UTXO 1: 0.01 BTC (txid: abc...123)
- UTXO 2: 0.02 BTC (txid: def...456)
- UTXO 3: 0.05 BTC (txid: ghi...789)
```

**Signing**:
```typescript
// All three inputs use the SAME private key
const privateKey = await getPrivateKeyForSigning(accountIndex, 'imported', account);
const keyPair = ECPair.fromPrivateKey(privateKey, { network });

psbt.signInput(0, keyPair); // UTXO 1
psbt.signInput(1, keyPair); // UTXO 2
psbt.signInput(2, keyPair); // UTXO 3 (same key)
```

**No special handling required** - bitcoinjs-lib handles this correctly.

### Bitcoin Protocol Considerations

**Question**: Any Bitcoin protocol considerations we're missing?

**Answer**: ⚠️ **Consider these edge cases**

1. **Signature Hash Type**:
   - Use `SIGHASH_ALL` (default) for all signatures
   - Non-HD wallets follow same rules as HD wallets
   - No protocol-level differences

2. **SegWit Signing** (BIP143):
   - Non-HD wallets can use SegWit addresses (compressed keys only)
   - Same signing algorithm (witnessUtxo, amount, scriptPubKey)
   - **Validation**: Ensure imported key is compressed if using SegWit

3. **Legacy vs SegWit Mixing**:
   - Transaction can mix legacy and SegWit inputs
   - Non-HD account may have only legacy OR only SegWit UTXOs
   - TransactionBuilder already handles mixed inputs correctly

4. **RBF (Replace-By-Fee)**:
   - Non-HD wallets can use RBF (sequence number < 0xfffffffe)
   - No special handling needed

5. **Locktime**:
   - Non-HD wallets follow same locktime rules
   - Default locktime = 0 (immediate)

**Recommendation**: ✅ **No protocol changes needed, follow existing patterns**

---

### Answer Summary

| Aspect | Approach | Status |
|--------|----------|--------|
| **Signing Method** | Direct private key (no derivation) | ✅ Correct |
| **UTXO Selection** | Same algorithm as HD wallets | ✅ No changes |
| **Multiple UTXOs** | Reuse same private key | ✅ Standard |
| **SegWit Support** | Same as HD (compressed keys only) | ✅ Supported |
| **Implementation** | Conditional branching on `importType` | ✅ Clean |

**MVP Decision**: ✅ **Conditional signing logic based on `importType` field**

---

## Question 4: Address Type Detection

### Q: How do we determine the address type from a WIF private key?

**Answer**: ⚠️ **CANNOT AUTO-DETECT RELIABLY - Require User Input**

### The Problem

**WIF provides limited information**:
```
WIF Format: [version][private_key][compression_flag]?[checksum]

Example Testnet WIF (compressed):
cT1Y2Y... (52 chars)
         ↑
         Tells us: Compressed = true

What we DON'T know:
- ❌ Was this used for Legacy (P2PKH)?
- ❌ Was this used for SegWit (P2SH-P2WPKH)?
- ❌ Was this used for Native SegWit (P2WPKH)?
```

### WIF Compression Flag Mapping

| WIF Length | Compression Flag | Address Types Possible |
|------------|------------------|------------------------|
| **51 chars** | ❌ Uncompressed | **Legacy ONLY** (P2PKH) |
| **52 chars** | ✅ Compressed | **Legacy, SegWit, OR Native SegWit** |

### Why Auto-Detection Fails

**Compressed keys can generate 3 different addresses**:

```typescript
const keyPair = ECPair.fromWIF(compressedWIF, network);

// SAME public key → DIFFERENT addresses
const legacyAddr = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address;
// → testnet: mzBc4XEFSdzCDcTx...

const segwitAddr = bitcoin.payments.p2sh({
  redeem: bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey })
}).address;
// → testnet: 2MzQwSSnBHWH...

const nativeSegwitAddr = bitcoin.payments.p2wpkh({ pubkey: keyPair.publicKey }).address;
// → testnet: tb1qw508d6qejxtdg...

// ALL THREE ARE VALID!
// Which one did the user actually use?
```

**Problem**: We have **no way to know** which address type the user's funds are on.

### Attempted Solutions (All Fail)

#### ❌ Option 1: Check Blockchain for Balance

```typescript
// Try all 3 address types, check which has balance
const addresses = [legacyAddr, segwitAddr, nativeSegwitAddr];
for (const addr of addresses) {
  const balance = await blockstream.getBalance(addr);
  if (balance > 0) {
    // Found it!
    return addressType;
  }
}
```

**Why This Fails**:
- ❌ **Slow**: 3 API calls per import (rate limits, latency)
- ❌ **Unreliable**: What if balance is 0? (user spent everything)
- ❌ **Wrong assumption**: Empty address ≠ wrong address type
- ❌ **Privacy leak**: Queries all 3 addresses to blockchain

---

#### ❌ Option 2: Derive All 3 and Let User Choose

```typescript
// Show user all 3 addresses
const preview = {
  legacy: legacyAddr,
  segwit: segwitAddr,
  nativeSegwit: nativeSegwitAddr
};

// User picks: "Which address has your funds?"
```

**Why This Fails**:
- ❌ **Confusing UX**: Most users don't understand address types
- ❌ **Error-prone**: User may pick wrong one
- ❌ **Validation problem**: How do we know they picked correctly?

---

#### ❌ Option 3: Default to Native SegWit

```typescript
// Always assume compressed keys = Native SegWit
const addressType = compressed ? 'native-segwit' : 'legacy';
```

**Why This Fails**:
- ❌ **Wrong assumption**: User may have used Legacy or SegWit
- ❌ **Funds inaccessible**: Import succeeds but shows 0 balance
- ❌ **Silent failure**: No error, just wrong address

---

### ✅ Recommended Solution: Explicit User Selection

**Implementation**:

```typescript
// Step 1: Validate WIF and detect compression
const validation = WIFManager.validateWIF(wif, 'testnet');
if (!validation.valid) {
  throw new Error(validation.error);
}

// Step 2: Determine available address types
const compressed = validation.compressed!;
const availableTypes: AddressType[] = compressed
  ? ['legacy', 'segwit', 'native-segwit'] // All 3 options
  : ['legacy']; // Only legacy for uncompressed

// Step 3: Ask user to specify address type
if (compressed) {
  // Show UI: "Which address type did you use?"
  const userSelection = await promptUserForAddressType();
  return userSelection; // 'legacy' | 'segwit' | 'native-segwit'
} else {
  // Automatically force legacy (no choice)
  return 'legacy';
}
```

**UI Flow**:

```
┌────────────────────────────────────────────┐
│ Import Private Key                          │
├────────────────────────────────────────────┤
│                                             │
│ WIF Private Key: ✓ Valid (Compressed)      │
│                                             │
│ Address Type:                               │
│   ○ Legacy (P2PKH)                          │
│       First address: mzBc4XEFSdzCDcTx...    │
│                                             │
│   ○ SegWit (P2SH-P2WPKH)                    │
│       First address: 2MzQwSSnBHWH...        │
│                                             │
│   ● Native SegWit (P2WPKH) - Recommended    │
│       First address: tb1qw508d6qejxtdg...   │
│                                             │
│ ℹ️ Select the address type you originally   │
│    used when creating this key. If unsure,  │
│    check your backup or transaction history.│
│                                             │
│ [Continue]                                  │
└────────────────────────────────────────────┘
```

**Validation Hint**:
```
If you're not sure which address type you used:
1. Check your backup file (may include first address)
2. Look at your transaction history (address format)
3. Check your original wallet's settings
```

### Uncompressed Key Handling

**Simpler case**:

```typescript
if (!compressed) {
  // Force legacy - no user input needed
  addressType = 'legacy';

  showWarning(`
    ⚠️ Uncompressed Private Key Detected

    This key can only be used with Legacy (P2PKH) addresses.
    SegWit addresses require compressed keys.

    First address: ${legacyAddr}
  `);
}
```

**Reasoning**:
- Uncompressed keys **cannot** generate SegWit addresses
- Only one valid option: Legacy (P2PKH)
- No user selection needed

### Validation After Import

**Recommended**: Show first address and suggest verification

```
✅ Wallet imported successfully!

First address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx

⚠️ Please verify this address matches your backup or transaction history.
If the address is different, you may have selected the wrong address type.

[View Wallet] [Import Different Address Type]
```

---

### Answer Summary

| Question | Answer |
|----------|--------|
| Can we auto-detect address type? | ❌ NO - Not reliable |
| Should we try blockchain lookup? | ❌ NO - Slow and unreliable |
| Should we ask user? | ✅ YES - Only reliable method |
| Uncompressed keys? | ✅ Force legacy (no choice) |
| Compressed keys? | ⚠️ User must select type |

**MVP Decision**: ✅ **Require user to select address type for compressed keys**

---

## Question 5: Future HD Migration

### Q: If user later wants to convert from non-HD to HD wallet, what's the migration path?

**Answer**: ⚠️ **Manual Fund Transfer (No Automatic Migration)**

### Why Automatic Migration is Not Possible

**Fundamental incompatibility**:
```
Non-HD Wallet Structure:
- Private key (256 bits)
- No chain code
- No derivation path
- Cannot generate child keys

HD Wallet Structure:
- Seed phrase (512 bits)
- Master chain code (256 bits)
- Derivation paths
- Can generate infinite child keys

Conversion: IMPOSSIBLE
Cannot create seed phrase from private key
```

**You CANNOT**:
- ❌ Convert private key → seed phrase
- ❌ Generate seed phrase that derives the same private key
- ❌ Merge non-HD and HD wallets into one structure
- ❌ Preserve derivation compatibility

**You CAN**:
- ✅ Create new HD wallet
- ✅ Transfer funds from non-HD to HD wallet
- ✅ Keep both wallets (not recommended)

### Recommended Migration Path

**Step-by-step user flow**:

```
1. User has non-HD wallet with funds
   ├─ Account: "Imported Account" (0.5 BTC)
   └─ Address: tb1q... (imported from WIF)

2. User initiates migration
   ├─ Dashboard shows: "Migrate to Seed Phrase Wallet"
   └─ User clicks "Migrate"

3. System creates NEW HD wallet
   ├─ Generate new seed phrase (12 words)
   ├─ User backs up seed phrase
   └─ HD wallet created (separate from non-HD wallet)

4. System offers to transfer funds
   ├─ "Transfer all funds to new HD wallet?"
   ├─ Shows: Amount, Fee, Destination address
   └─ User confirms

5. Transaction created
   ├─ Input: All UTXOs from non-HD wallet
   ├─ Output: First address in new HD wallet
   └─ Broadcast transaction

6. User waits for confirmation
   └─ Shows: Pending transaction, confirmations

7. After confirmation, offer cleanup
   ├─ "Funds successfully transferred!"
   ├─ "Delete old non-HD wallet?"
   └─ User confirms or keeps both

8. Migration complete
   └─ User now has HD wallet with full features
```

### Implementation Sketch

```typescript
/**
 * Migration flow (simplified)
 */
async function migrateNonHDtoHD(): Promise<void> {
  // Step 1: Verify current wallet is non-HD
  const currentWallet = await WalletStorage.getWallet();
  if (currentWallet.encryptedSeed !== '') {
    throw new Error('Current wallet is already HD');
  }

  // Step 2: Create new HD wallet (in memory, not saved yet)
  const newMnemonic = KeyManager.generateMnemonic();
  const newSeed = KeyManager.mnemonicToSeed(newMnemonic);
  const newHDWallet = new HDWallet(newSeed, 'testnet');

  // Step 3: Show seed phrase to user for backup
  await showSeedPhraseBackupModal(newMnemonic);

  // Step 4: User confirms backup
  const confirmed = await verifySeedPhraseBackup(newMnemonic);
  if (!confirmed) {
    throw new Error('User did not confirm seed phrase backup');
  }

  // Step 5: Calculate transfer amount
  const balance = await getAccountBalance(0); // Non-HD account
  const feeEstimate = await estimateTransferFee(balance.confirmed);
  const transferAmount = balance.confirmed - feeEstimate.medium;

  if (transferAmount <= 0) {
    throw new Error('Insufficient funds to cover transfer fee');
  }

  // Step 6: Get destination address (first HD address)
  const destAccount = newHDWallet.createAccount('native-segwit', 0, 'Main Account');
  const destNode = newHDWallet.deriveAddressNode('native-segwit', 0, 0, 0);
  const destAddress = AddressGenerator.generateAddress(destNode, 'native-segwit');

  // Step 7: Build transfer transaction
  const utxos = await getAccountUTXOs(0);
  const tx = await TransactionBuilder.buildTransaction({
    utxos,
    outputs: [{ address: destAddress.address, amount: transferAmount }],
    changeAddress: destAddress.address, // No change (sweep all)
    feeRate: feeEstimate.medium,
    // ... signing params
  });

  // Step 8: Broadcast transaction
  const txid = await broadcastTransaction(tx.txHex);

  // Step 9: Save new HD wallet (AFTER successful broadcast)
  await saveHDWallet(newHDWallet, newSeed, password);

  // Step 10: Optionally delete old non-HD wallet
  const deleteOld = await confirmDeletion();
  if (deleteOld) {
    await WalletStorage.deleteWallet(); // Delete non-HD wallet
  }

  return { success: true, txid, newWallet: newHDWallet };
}
```

### Better Migration Option: Support Both Wallet Types

**Alternative approach** (more flexible):

```typescript
// Allow user to have BOTH non-HD and HD wallets

// Option 1: Keep as separate extension instances
// User can have both wallets, switch between them

// Option 2: Support hybrid wallet (NOT RECOMMENDED for MVP)
// Single wallet with both HD accounts and imported accounts
interface StoredWalletV2 {
  encryptedSeed: string; // Can be empty OR populated
  accounts: WalletAccount[]; // Can mix HD and imported accounts
  importedKeys: { [accountIndex: number]: ImportedKeyData };
}

// If encryptedSeed is populated AND importedKeys exist:
// → Hybrid wallet (some accounts HD, some imported)
```

**Hybrid Wallet Concerns**:
- ⚠️ Complex validation logic
- ⚠️ Confusing UX (which accounts are HD? which are imported?)
- ⚠️ Backup complexity (need BOTH seed phrase AND private keys)
- ⚠️ Migration becomes ambiguous

**Recommendation**: ❌ **Do NOT implement hybrid wallets in MVP**

### Fund Sweeping vs Manual Transfer

**Option A: Automatic Sweep** (Recommended)

```typescript
// Sweep ALL funds from non-HD to HD wallet
const utxos = await getAllUTXOs();
const balance = sumUTXOs(utxos);
const fee = estimateSweepFee(utxos.length);
const transferAmount = balance - fee;

buildTransaction({
  utxos: utxos, // ALL UTXOs
  outputs: [{ address: hdWalletAddress, amount: transferAmount }],
  changeAddress: hdWalletAddress, // No change (sweep)
  feeRate
});
```

**Pros**:
- ✅ Simple (one transaction)
- ✅ Clean migration (no leftover funds)
- ✅ User-friendly (automated)

**Cons**:
- ⚠️ Must wait for confirmation before deleting old wallet
- ⚠️ If transaction fails, user is stuck

---

**Option B: Manual Transfer** (Safer)

```typescript
// User manually sends funds to HD wallet
// No automation, just provide destination address

showMigrationHelper({
  message: 'Send funds to your new HD wallet',
  destinationAddress: hdWalletAddress,
  balance: currentBalance,
  suggestedAmount: currentBalance - estimatedFee
});

// User uses normal send flow
```

**Pros**:
- ✅ User has full control
- ✅ Can transfer in multiple transactions
- ✅ No risk of automated failure

**Cons**:
- ❌ Manual process (user must initiate send)
- ❌ User might forget or make mistakes

---

**Recommendation**: ✅ **Option A (Automatic Sweep) with safeguards**

### Recommended User Guidance

**Migration Banner** (in non-HD wallet dashboard):

```
┌────────────────────────────────────────────┐
│ ℹ️ Upgrade to Seed Phrase Wallet            │
├────────────────────────────────────────────┤
│ Get better privacy and more features with   │
│ a seed phrase wallet.                       │
│                                             │
│ • Generate new receiving addresses          │
│ • Better privacy (no address reuse)         │
│ • Easier backup (12-word seed phrase)       │
│                                             │
│ [Migrate Now] [Learn More] [Dismiss]        │
└────────────────────────────────────────────┘
```

**Migration Wizard**:

```
Step 1: Create Seed Phrase Wallet
  → Generate new seed phrase
  → User backs up seed phrase
  → Verify backup

Step 2: Transfer Funds
  → Show source (non-HD) balance
  → Show destination (HD) address
  → Calculate fee
  → User confirms transfer

Step 3: Wait for Confirmation
  → Monitor transaction
  → Show progress (0/6 confirmations)

Step 4: Cleanup (Optional)
  → Offer to delete old wallet
  → Warn: "Only delete if transfer confirmed and funds received"
  → User confirms deletion

Step 5: Complete
  → Show success message
  → User now has HD wallet
```

---

### Answer Summary

| Question | Answer |
|----------|--------|
| Can we auto-migrate? | ❌ NO - Impossible |
| Automatic sweep? | ✅ YES - Recommended |
| Support both wallets? | ⚠️ Possible, but confusing |
| Hybrid wallet? | ❌ NO - Too complex for MVP |
| Recommended path? | ✅ New HD wallet + fund transfer |

**MVP Decision**: ✅ **Manual migration: Create new HD wallet → Transfer funds → Delete old wallet**

---

## Question 6: BIP Standards Compliance

### Q: Are we violating any BIP standards with non-HD wallets?

**Answer**: ✅ **NO VIOLATIONS - Non-HD wallets pre-date BIP standards**

### BIP Compliance Analysis

#### BIP32 (HD Wallets)

**Status**: ✅ **NOT APPLICABLE (Not Violated)**

- BIP32 is **OPTIONAL** (defines HD wallet standard)
- Non-HD wallets existed before BIP32 (Bitcoin v0.1-v0.12)
- Not using BIP32 ≠ violation
- **Verdict**: Compliant (by not claiming to be HD)

#### BIP39 (Mnemonic Phrases)

**Status**: ✅ **NOT APPLICABLE (Not Violated)**

- BIP39 is **OPTIONAL** (defines seed phrase format)
- Non-HD wallets don't use seed phrases
- Not using BIP39 ≠ violation
- **Verdict**: Compliant (by not using seed phrases)

#### BIP44/49/84 (Derivation Paths)

**Status**: ✅ **NOT APPLICABLE (Not Violated)**

- These BIPs **require BIP32** (HD wallets)
- Non-HD wallets have no derivation paths
- Not using derivation paths ≠ violation
- **Verdict**: Compliant (no derivation paths to validate)

#### BIP174 (PSBT)

**Status**: ✅ **COMPLIANT**

- PSBT works with **ANY** Bitcoin transaction
- Non-HD wallets can use PSBT (for signing coordination)
- PSBT metadata may include derivation paths (optional for non-HD)
- **Verdict**: Fully compliant

**Implementation**:
```typescript
// PSBT for non-HD wallet (derivation path omitted)
const psbt = new bitcoin.Psbt({ network });

psbt.addInput({
  hash: utxo.txid,
  index: utxo.vout,
  witnessUtxo: {
    script: Buffer.from(utxo.scriptPubKey, 'hex'),
    value: utxo.value
  },
  // NO bip32Derivation field (not applicable for non-HD)
});

psbt.signInput(0, keyPair);
```

**Deviation**: Omit `bip32Derivation` field (optional in BIP174)

#### WIF (Wallet Import Format)

**Status**: ✅ **FULLY COMPLIANT**

- WIF is **standard Bitcoin format** (pre-dates BIPs)
- Defined in Bitcoin Core documentation
- All major wallets support WIF import/export
- **Verdict**: Fully compliant

**Standards**:
- Base58Check encoding
- Version byte (0x80 mainnet, 0xEF testnet)
- Compression flag (optional 0x01 byte)
- 4-byte checksum

#### Address Generation

**Status**: ✅ **FULLY COMPLIANT**

- Addresses follow standard Bitcoin formats:
  - **Legacy (P2PKH)**: Compliant with Bitcoin v0.1+
  - **SegWit (P2SH-P2WPKH)**: Compliant with BIP141 + BIP143
  - **Native SegWit (P2WPKH)**: Compliant with BIP141 + BIP173

**No deviations** from address generation standards.

### Standard Bitcoin Wallet Behaviors

#### Bitcoin Core Compatibility

**Bitcoin Core's `importprivkey` command**:
```bash
# Bitcoin Core supports importing private keys (non-HD)
bitcoin-cli importprivkey "cT1Y2Y..." "Imported Account"

# Behavior:
# - Stores private key in wallet.dat
# - No seed phrase backup
# - Reuses address for change
# - Must be backed up separately
```

**Our Implementation**: ✅ **Matches Bitcoin Core behavior**

#### Electrum Compatibility

**Electrum's "Import Bitcoin Addresses or Private Keys"**:
- Supports WIF import (non-HD)
- Creates watch-only wallet OR spending wallet
- Warns about lack of seed phrase
- Allows mixing imported keys with HD accounts

**Our Implementation**: ✅ **Similar to Electrum's approach**

#### Mycelium Compatibility

**Mycelium's "Cold Storage" feature**:
- Import private key for single-use spending
- No change address generation (sends all)
- Deletes key after spending

**Our Implementation**: ⚠️ **Different (we keep the key), but valid**

### Deviations from HD Wallet Behavior

**Documented Deviations** (not violations):

| Behavior | HD Wallet | Non-HD Wallet | Standard? |
|----------|-----------|---------------|-----------|
| **Seed Phrase Backup** | ✅ 12 words | ❌ WIF only | ✅ Both valid |
| **Address Derivation** | ✅ Infinite | ❌ Single address | ✅ Both valid |
| **Change Addresses** | ✅ New per tx | ❌ Reuse same | ⚠️ Discouraged, not invalid |
| **Account Creation** | ✅ Unlimited | ❌ Cannot create | ✅ Limitation, not violation |
| **Backup Frequency** | ✅ Once (seed) | ⚠️ Per import | ✅ Trade-off, not violation |

**Privacy Consideration**:
- Address reuse **discouraged** (not forbidden)
- Bitcoin Privacy Wiki recommends fresh addresses
- BUT: Not a protocol violation, just privacy tradeoff

### Documentation Requirements

**Recommended Disclosures**:

```markdown
## Non-HD Wallet Limitations

This wallet was imported from a private key and has the following limitations:

### Derivation
- **No seed phrase**: This wallet does not have a 12-word seed phrase
- **Single address**: Only one receiving address is available
- **No account creation**: Cannot create additional accounts without importing more keys

### Privacy
- **Address reuse**: Change transactions will reuse the same address
- **Transaction linkability**: All transactions are linked to the same address
- **Privacy recommendation**: Consider migrating to a seed phrase wallet for better privacy

### Backup
- **Backup method**: Export the private key (WIF format)
- **No seed phrase**: Cannot recover using seed phrase
- **Critical**: Keep your private key backup secure

### Compatibility
- **BIP Standards**: This wallet does not use BIP32/39/44 (HD wallet standards)
- **PSBT**: Partially Signed Bitcoin Transactions (BIP174) are supported
- **Transaction Signing**: Fully compatible with all Bitcoin nodes and explorers
```

### Security Considerations

**Bitcoin Protocol Perspective**:

1. **Signature Validation**: ✅ Compliant
   - ECDSA signatures follow Bitcoin standards
   - No custom signature schemes
   - Passes consensus rules

2. **Transaction Format**: ✅ Compliant
   - Standard transaction structure
   - Valid inputs/outputs
   - Correct serialization

3. **Script Validation**: ✅ Compliant
   - P2PKH, P2WPKH, P2SH-P2WPKH scripts are standard
   - No custom scripts
   - Passes IsStandard() checks

4. **Fee Calculation**: ✅ Compliant
   - Same fee estimation as HD wallets
   - Respects dust threshold
   - Meets relay fee requirements

**Verdict**: ✅ **Fully Bitcoin-protocol compliant**

---

### Answer Summary

| BIP Standard | Compliance | Notes |
|--------------|------------|-------|
| **BIP32 (HD Wallets)** | ✅ N/A | Optional, not used |
| **BIP39 (Seed Phrases)** | ✅ N/A | Optional, not used |
| **BIP44/49/84 (Derivation)** | ✅ N/A | Requires BIP32 |
| **BIP174 (PSBT)** | ✅ Compliant | Works with non-HD |
| **WIF Format** | ✅ Compliant | Standard Bitcoin |
| **Address Types** | ✅ Compliant | All types supported |
| **Bitcoin Protocol** | ✅ Compliant | No violations |

**MVP Decision**: ✅ **No BIP violations, no new standards to document**

---

## Question 7: Technical Implementation Review

### File Review Summary

#### 1. `/src/shared/types/index.ts`

**Current Structure**:
```typescript
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;  // ← Can be empty for non-HD
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData };
  settings: WalletSettings;
}

export interface Account {
  accountType: 'single';
  index: number;
  name: string;
  addressType: AddressType;
  importType?: 'hd' | 'private-key' | 'seed';  // ← Used to detect non-HD
  externalIndex: number;
  internalIndex: number;
  addresses: Address[];
}
```

**Validation**: ✅ **Structure is correct**

**Recommendations**:
1. ✅ Keep `encryptedSeed: string` (no change to type)
2. ✅ Use empty string `''` for non-HD wallets
3. ✅ `importType: 'private-key'` correctly identifies non-HD accounts
4. ⚠️ Add JSDoc comment explaining empty seed:
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

#### 2. `/src/background/wallet/KeyManager.ts`

**Current WIF Implementation**:
```typescript
static validateWIF(wif: string, network: 'testnet' | 'mainnet'): boolean
static decodeWIF(wif: string, network: 'testnet' | 'mainnet'): {
  privateKey: string;
  publicKey: string;
  compressed: boolean;
}
static privateKeyToWIF(privateKeyHex: string, network: 'testnet' | 'mainnet', compressed: boolean = true): string
```

**Validation**: ✅ **WIF methods are correct and complete**

**Recommendations**:
1. ✅ Existing methods are sufficient for non-HD wallet support
2. ✅ `decodeWIF` correctly returns compression flag
3. ⚠️ Add helper method for address type determination:
   ```typescript
   /**
    * Gets available address types for a WIF key
    *
    * @param wif - WIF private key
    * @param network - Network ('testnet' or 'mainnet')
    * @returns Array of address types that can be used
    */
   static getAvailableAddressTypes(
     wif: string,
     network: 'testnet' | 'mainnet' = 'testnet'
   ): AddressType[] {
     const decoded = this.decodeWIF(wif, network);

     if (!decoded.compressed) {
       // Uncompressed keys: Legacy only
       return ['legacy'];
     } else {
       // Compressed keys: All types
       return ['legacy', 'segwit', 'native-segwit'];
     }
   }
   ```

#### 3. `/src/background/wallet/WIFManager.ts`

**Current Implementation**:
```typescript
class WIFManager {
  static validateFormat(wif: string): string | null
  static detectNetwork(wif: string): 'testnet' | 'mainnet' | 'invalid'
  static validateNetwork(wif: string, requiredNetwork: 'testnet' | 'mainnet'): string | null
  static validateChecksum(wif: string, network: 'testnet' | 'mainnet'): boolean
  static deriveFirstAddress(wif: string, network: 'testnet' | 'mainnet'): {
    address: string;
    addressType: AddressType;
    compressed: boolean;
  }
  static validateWIF(wif: string, requiredNetwork: 'testnet' | 'mainnet'): WIFValidationResult
}
```

**Validation**: ✅ **Implementation is excellent**

**Issues Found**:
1. ⚠️ `deriveFirstAddress` assumes address type (native-segwit for compressed)
   - **Problem**: User may have used different address type
   - **Fix**: Add parameter to specify desired address type

**Recommended Enhancement**:
```typescript
/**
 * Derives address from WIF for specified address type
 *
 * @param wif - WIF private key
 * @param addressType - Desired address type
 * @param network - Network ('testnet' or 'mainnet')
 * @returns Address and metadata
 *
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

  const decoded = KeyManager.decodeWIF(wif, network);
  const keyPair = ECPair.fromWIF(wif, networkObj);

  // Validate address type compatibility
  if (!decoded.compressed && addressType !== 'legacy') {
    throw new Error(
      `Address type '${addressType}' requires compressed key. ` +
      `Uncompressed keys can only use 'legacy' addresses.`
    );
  }

  // Generate address based on specified type
  let address: string;

  switch (addressType) {
    case 'legacy':
      address = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj
      }).address!;
      break;

    case 'segwit':
      address = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: networkObj
        }),
        network: networkObj
      }).address!;
      break;

    case 'native-segwit':
      address = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj
      }).address!;
      break;

    default:
      throw new Error(`Unsupported address type: ${addressType}`);
  }

  return {
    address,
    compressed: decoded.compressed
  };
}
```

### Security Review

**Critical Security Checks**:

1. ✅ **Private Key Handling**: Existing code clears sensitive data
2. ✅ **Encryption**: ImportedKeyData uses proper encryption
3. ✅ **Network Validation**: WIFManager enforces network checks
4. ⚠️ **Rate Limiting**: Import operations should have rate limits (already exists in code)

**Additional Security Recommendations**:

1. **Add wallet structure validation on unlock**:
   ```typescript
   async function unlockWallet(password: string): Promise<boolean> {
     const wallet = await WalletStorage.getWallet();

     // VALIDATE STRUCTURE
     validateWalletStructure(wallet); // ← Add this

     // Proceed with unlock
     // ...
   }
   ```

2. **Prevent accidental HD operations on non-HD wallets**:
   ```typescript
   async function deriveNewAddress(accountIndex: number): Promise<string> {
     const account = state.accounts[accountIndex];

     if (account.importType === 'private-key') {
       // PREVENT DERIVATION
       throw new Error(
         'Cannot derive new addresses for accounts imported from private keys. ' +
         'Create a seed phrase wallet for this feature.'
       );
     }

     // Continue with HD derivation
     // ...
   }
   ```

3. **Add validation to CREATE_WALLET_FROM_PRIVATE_KEY handler**:
   ```typescript
   async function handleCreateWalletFromPrivateKey(payload: any): Promise<MessageResponse> {
     // 1. Check if wallet already exists
     const existingWallet = await WalletStorage.getWallet();
     if (existingWallet) {
       return {
         success: false,
         error: 'Wallet already exists. Use Import Account to add private keys to existing wallet.',
         code: 'WALLET_EXISTS'
       };
     }

     // 2. Validate WIF
     const validation = WIFManager.validateWIF(payload.wif, 'testnet');
     if (!validation.valid) {
       return {
         success: false,
         error: validation.error || 'Invalid WIF format',
         code: 'INVALID_WIF_FORMAT'
       };
     }

     // 3. Require address type selection (from user)
     if (!payload.addressType) {
       return {
         success: false,
         error: 'Address type must be specified',
         code: 'ADDRESS_TYPE_REQUIRED'
       };
     }

     // 4. Validate address type compatibility
     if (!validation.compressed && payload.addressType !== 'legacy') {
       return {
         success: false,
         error: 'Uncompressed keys can only use legacy addresses',
         code: 'INCOMPATIBLE_ADDRESS_TYPE'
       };
     }

     // Continue with wallet creation...
   }
   ```

---

### Implementation Warnings and Gotchas

#### 1. Change Address Handling

**Warning**: ⚠️ **Must handle change address correctly**

```typescript
// WRONG: Assuming HD wallet
const changeAddress = await deriveChangeAddress(accountIndex);

// CORRECT: Check account type
const changeAddress = account.importType === 'private-key'
  ? account.addresses[0].address  // Reuse imported address
  : await deriveChangeAddress(accountIndex);  // Derive new change address
```

#### 2. Address Generation

**Warning**: ⚠️ **Cannot generate new addresses for non-HD accounts**

```typescript
// In Dashboard "Receive" screen
async function generateNewReceiveAddress(accountIndex: number): Promise<string> {
  const account = state.accounts[accountIndex];

  if (account.importType === 'private-key') {
    // Show warning instead of generating
    showWarning('This account uses a single address. Cannot generate new receiving addresses.');
    return account.addresses[0].address;  // Return existing address
  }

  // Generate new HD address
  return await deriveNextAddress(accountIndex, false);
}
```

#### 3. Account Creation

**Warning**: ⚠️ **Cannot create additional accounts in non-HD wallet**

```typescript
// In Settings "Create Account" button
function canCreateAccount(): boolean {
  const wallet = getWallet();

  if (wallet.encryptedSeed === '') {
    // Non-HD wallet: Cannot create accounts
    showError('Cannot create new accounts in a non-HD wallet. Import additional private keys or migrate to seed phrase wallet.');
    return false;
  }

  return true;
}
```

#### 4. Backup Warnings

**Warning**: ⚠️ **Must warn user about backup differences**

```typescript
// Show different backup instructions
function showBackupInstructions(accountIndex: number): void {
  const account = state.accounts[accountIndex];

  if (account.importType === 'private-key') {
    showModal({
      title: 'Backup Your Private Key',
      message: `
        This account does NOT have a seed phrase backup.

        To backup this account, you must export and securely store the private key.

        ⚠️ WARNING: Losing your private key means losing access to your funds!
      `,
      actions: [
        { label: 'Export Private Key', onClick: () => exportPrivateKey(accountIndex) },
        { label: 'Cancel', onClick: () => {} }
      ]
    });
  } else {
    showSeedPhraseBackup();  // Standard HD wallet backup
  }
}
```

---

### Answer Summary

| File | Status | Changes Needed |
|------|--------|----------------|
| **types/index.ts** | ✅ Correct | ⚠️ Add JSDoc comment |
| **KeyManager.ts** | ✅ Correct | ⚠️ Add `getAvailableAddressTypes()` |
| **WIFManager.ts** | ⚠️ Issue found | ⚠️ Add `deriveAddress(addressType)` |
| **TransactionBuilder.ts** | ✅ Will work | ⚠️ Add conditional signing |
| **Message Handlers** | ⏳ Not implemented | ⚠️ Add CREATE_WALLET_FROM_PRIVATE_KEY |

**Overall Assessment**: ✅ **Architecture is sound, minor enhancements needed**

---

## Handoff to Security Expert

### Security Questions Requiring Expert Review

The following security aspects need review by the Security Expert before implementation:

#### 1. Non-HD Wallet Encryption

**Question**: Should non-HD wallets use the same encryption approach as HD wallets?

**Current Approach**:
- HD wallet: `encryptedSeed` encrypted with wallet password (PBKDF2 + AES-256-GCM)
- Non-HD wallet: `importedKeys[0]` encrypted with wallet password (same encryption)

**Considerations**:
- ✅ Consistent encryption (users remember one password)
- ⚠️ If wallet password is compromised, both seed and imported keys are exposed
- ⚠️ No defense-in-depth for imported keys

**Security Expert should validate**:
1. Is single-password encryption acceptable for non-HD wallets?
2. Should imported keys use a separate password?
3. Should we enforce stronger passwords for non-HD wallets?

#### 2. Wallet Structure Validation

**Question**: What validations should we perform on wallet structure?

**Proposed Validations**:
```typescript
// Prevent invalid states
validateWalletStructure({
  isNonHD: wallet.encryptedSeed === '',
  hasImportedKeys: Object.keys(wallet.importedKeys || {}).length > 0,
  accountImportTypes: wallet.accounts.map(acc => acc.importType)
});

// Validation rules:
// 1. Non-HD wallet MUST have importedKeys
// 2. Non-HD wallet MUST have at least one account
// 3. Non-HD wallet CANNOT have HD-derived accounts
// 4. HD wallet SHOULD have encryptedSeed (unless all accounts are imported)
```

**Security Expert should validate**:
1. Are these validation rules sufficient?
2. Are there edge cases we're missing?
3. Should we perform validation on every unlock?

#### 3. Migration Security

**Question**: How do we securely handle the migration from non-HD to HD wallet?

**Concerns**:
- ⚠️ User has TWO wallets temporarily (non-HD + HD)
- ⚠️ Funds are in-flight during migration
- ⚠️ What if migration fails mid-process?
- ⚠️ Should we delete non-HD wallet automatically or require user confirmation?

**Security Expert should validate**:
1. Is automatic fund sweeping safe?
2. How do we handle failed migration transactions?
3. Should we keep non-HD wallet until user manually confirms deletion?
4. What happens if user loses HD seed phrase during migration?

#### 4. Rate Limiting for Wallet Creation

**Question**: Should we rate-limit CREATE_WALLET_FROM_PRIVATE_KEY?

**Current State**:
- `IMPORT_ACCOUNT_PRIVATE_KEY` has rate limiting (existing code)
- `CREATE_WALLET` likely has rate limiting

**Proposed**:
- Add same rate limiting to `CREATE_WALLET_FROM_PRIVATE_KEY`
- Limit: 3 attempts per 15 minutes
- Reset on successful wallet creation

**Security Expert should validate**:
1. Is rate limiting necessary for wallet creation?
2. What's the appropriate rate limit?
3. Should failed attempts lock the user out?

#### 5. Address Reuse Privacy Warning

**Question**: How strongly should we warn users about address reuse?

**Options**:
- **Option A**: Soft warning (dismissible banner)
- **Option B**: Mandatory warning (must click "I Understand")
- **Option C**: Repeated warnings (every time user sends transaction)

**Security Expert should recommend**:
1. Which warning level is appropriate?
2. Should we prevent users from using non-HD wallets entirely?
3. How do we balance usability vs privacy?

---

## Final Recommendations

### Summary of Technical Decisions

| Decision | Recommendation | Confidence |
|----------|----------------|------------|
| **Non-HD wallet structure** | ✅ Use empty `encryptedSeed` | High |
| **Wallet version** | ✅ Keep v2 (no version bump) | High |
| **Change address strategy** | ✅ Reuse same address | Medium |
| **Address type detection** | ⚠️ Require user selection | High |
| **Transaction signing** | ✅ Conditional branching on `importType` | High |
| **Migration path** | ✅ Manual fund transfer | Medium |
| **BIP compliance** | ✅ No violations | High |

### Implementation Checklist

**Backend Changes**:
- [ ] Add `CREATE_WALLET_FROM_PRIVATE_KEY` message handler
- [ ] Add wallet structure validation
- [ ] Implement conditional signing logic in TransactionBuilder
- [ ] Add change address handling for non-HD accounts
- [ ] Enhance WIFManager with address type selection
- [ ] Add migration helper functions

**Frontend Changes**:
- [ ] Add "Import Private Key" tab to WalletSetup
- [ ] Add address type selection UI (for compressed keys)
- [ ] Add privacy warnings for non-HD wallets
- [ ] Update Dashboard to handle single-address accounts
- [ ] Add migration wizard UI
- [ ] Update backup instructions for non-HD accounts

**Testing Requirements**:
- [ ] Unit tests for non-HD wallet creation
- [ ] Unit tests for WIF validation and address derivation
- [ ] Integration tests for transaction signing (non-HD accounts)
- [ ] Integration tests for migration flow
- [ ] Manual testing on testnet (import WIF → send transaction)

**Documentation Updates**:
- [ ] Update blockchain expert notes with non-HD architecture
- [ ] Document address reuse privacy implications
- [ ] Add migration guide for users
- [ ] Update README with import-from-private-key feature

### Security Expert Review Required

**MANDATORY**: The following must be reviewed by Security Expert before merging:

1. ✅ Wallet encryption approach for non-HD wallets
2. ✅ Wallet structure validation rules
3. ✅ Migration security (fund transfer safety)
4. ✅ Rate limiting for wallet creation operations
5. ✅ Privacy warning severity and presentation

**Expected Output from Security Expert**:
- Security audit report
- Approved encryption specifications
- Threat model for non-HD wallets
- Recommendations for user warnings
- Testing requirements for security validation

---

## Conclusion

**Overall Assessment**: ✅ **APPROVED WITH RECOMMENDATIONS**

The Product Manager's technical approach for wallet restore from private key is **solid, Bitcoin-protocol compliant, and implementable**. The proposed non-HD wallet architecture is valid and follows established wallet patterns (Bitcoin Core, Electrum).

**Key Strengths**:
- ✅ Correct understanding of Bitcoin wallet types
- ✅ Proper WIF validation and encryption approach
- ✅ Realistic MVP scope (no over-engineering)
- ✅ Clear identification of technical limitations

**Areas Requiring Attention**:
- ⚠️ Address type selection must be user-driven (not auto-detected)
- ⚠️ Change address reuse has privacy implications (needs clear warnings)
- ⚠️ Migration path should be well-documented and tested
- ⚠️ Security Expert review is mandatory before implementation

**Confidence Level**: **HIGH** - This feature can be implemented successfully with the recommended changes.

**Next Steps**:
1. Implement recommended enhancements to WIFManager
2. Add wallet structure validation
3. Get Security Expert approval
4. Proceed with implementation per PRD

---

**Document Version**: 1.0
**Review Status**: ✅ Complete
**Reviewer**: Blockchain Expert
**Date**: 2025-10-22
**Next Review**: Security Expert

---

**END OF TECHNICAL REVIEW**
