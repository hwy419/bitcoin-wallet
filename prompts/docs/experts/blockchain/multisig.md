# Multisig Wallet Implementation

**Last Updated**: October 22, 2025
**Component**: Multi-Signature Wallets
**Status**: Production Ready 

**Quick Navigation**: [BIP Standards](#bip-standards) " [Address Types](#multisig-address-types) " [Configurations](#multisig-configurations) " [PSBT Workflow](#psbt-workflow) " [Testing](#testing)

---

## Overview

Comprehensive multi-signature wallet support with 2-of-2, 2-of-3, and 3-of-5 configurations. Full implementation includes BIP48 derivation paths, BIP67 deterministic key sorting, BIP174 PSBT workflow, and all three multisig address types (P2SH, P2WSH, P2SH-P2WSH).

**Implemented**: October 12, 2025
**Compliance Review**: October 13, 2025
**Review Status**:  COMPLIANT with BIP48, BIP67, BIP174

---

## BIP Standards

### BIP48 - Multisig Derivation Paths

**Purpose**: Standardized derivation path structure for multisig wallets

**Path Format**:
```
m/48'/coin_type'/account'/script_type'
```

**Path Levels**:
1. **Purpose**: 48' (hardened) - Indicates multisig wallet
2. **Coin Type**: 0' (mainnet) or 1' (testnet) - Per BIP44
3. **Account**: 0', 1', 2'... - Account index (hardened)
4. **Script Type**:
   - 1' = P2SH (legacy multisig)
   - 2' = P2WSH (native SegWit multisig)
   - 1' = P2SH-P2WSH (wrapped SegWit multisig - uses same as P2SH)

**Examples**:
```
Testnet P2SH multisig, Account 0:     m/48'/1'/0'/1'
Testnet P2WSH multisig, Account 0:    m/48'/1'/0'/2'
Mainnet P2WSH multisig, Account 1:    m/48'/0'/1'/2'
```

**Reference**: https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki

**Implementation**: `MultisigManager.getDerivationPath()`

**Compliance Notes**:
-  All derivation levels are hardened (use apostrophe notation)
-  Correct coin_type for testnet (1) and mainnet (0)
-  Script types match BIP48 specification
-  Derivation paths are consistent across all co-signers

---

### BIP67 - Deterministic Key Sorting

**Purpose**: Ensure all co-signers generate identical multisig addresses

**Key Principle**:
Public keys in a multisig redeem script MUST be sorted in lexicographic order (ascending byte-by-byte comparison). This eliminates the need for coordination on key ordering.

**Benefits**:
1. **Deterministic**: All parties independently generate the same address
2. **No Coordination**: No need to communicate key ordering
3. **Verification**: All co-signers can independently verify the multisig address
4. **Security**: Prevents attacks based on key position manipulation

**Algorithm**:
```typescript
// 1. Convert public keys to hex strings
const hexKeys = publicKeys.map(key => key.toString('hex'));

// 2. Sort lexicographically (string comparison)
hexKeys.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);

// 3. Convert back to Buffers
const sortedKeys = hexKeys.map(hex => Buffer.from(hex, 'hex'));
```

**Validation**:
- All public keys must be compressed (33 bytes) or uncompressed (65 bytes)
- Compressed keys start with 0x02 or 0x03
- Uncompressed keys start with 0x04
- No duplicate keys allowed
- Minimum 2 keys, maximum 15 keys (Bitcoin protocol limit)

**Reference**: https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki

**Implementation**: `src/background/wallet/utils/bip67.ts`

**Key Functions**:
```typescript
// Sort public keys per BIP67
sortPublicKeys(publicKeys: Buffer[]): Buffer[]

// Check if keys are already sorted
areKeysSorted(publicKeys: Buffer[]): boolean

// Verify two key sets match (regardless of order)
publicKeysMatch(keys1: Buffer[], keys2: Buffer[]): boolean

// Get position of key in sorted order
getKeyPosition(publicKey: Buffer, allPublicKeys: Buffer[]): number

// Validate keys for multisig use
validateMultisigKeys(publicKeys: Buffer[], minKeys?: number, maxKeys?: number): void
```

**Compliance Notes**:
-  Follows BIP67 specification exactly
-  Sorting is deterministic (same input always produces same output)
-  Does not modify original array
-  All address generation uses sorted keys

---

### BIP174 - PSBT (Partially Signed Bitcoin Transactions)

**Purpose**: Enable multi-party transaction construction and signing

**PSBT Workflow**:
```
1. Initiator creates unsigned PSBT
   “
2. Export PSBT (base64/hex/file/QR)
   “
3. Share with co-signers
   “
4. Each co-signer:
   - Import PSBT
   - Sign with their key
   - Export signed PSBT
   “
5. Merge all signed PSBTs
   “
6. Verify M signatures present
   “
7. Finalize PSBT
   “
8. Extract transaction hex
   “
9. Broadcast to network
```

**PSBT Advantages**:
- **Separation of Concerns**: Construction separate from signing
- **Hardware Wallet Support**: Air-gapped signing devices
- **Multi-Party**: Multiple signers can contribute independently
- **Flexibility**: Sign offline, merge online
- **Standard Format**: Interoperable across wallets

**Reference**: https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki

**Implementation**: `src/background/bitcoin/PSBTManager.ts`

**PSBT Structure** (per BIP174):
- **Global Data**: Unsigned transaction
- **Input Data**:
  - `witnessUtxo`: UTXO value and script (for SegWit)
  - `redeemScript`: P2SH redeem script (for P2SH, P2SH-P2WSH)
  - `witnessScript`: P2WSH witness script (for P2WSH, P2SH-P2WSH)
  - `partialSig`: Array of signatures from co-signers
- **Output Data**: Output scripts

**Script Requirements by Address Type**:
- **P2SH**: Requires `redeemScript` (multisig script)
- **P2WSH**: Requires `witnessScript` (multisig script)
- **P2SH-P2WSH**: Requires both `redeemScript` (P2WSH script) and `witnessScript` (multisig script)

---

## Multisig Address Types

All three address types are fully supported with proper script construction:

### 1. P2SH Multisig (Legacy)

**Format**: Pay-to-Script-Hash (wrapped multisig)

**Testnet Prefix**: '2'
**Mainnet Prefix**: '3'

**Generation Process**:
```typescript
// 1. Sort public keys per BIP67
const sortedKeys = sortPublicKeys(publicKeys);

// 2. Create multisig redeem script
// Script: OP_M <pubkey1> <pubkey2> ... <pubkeyN> OP_N OP_CHECKMULTISIG
const p2ms = bitcoin.payments.p2ms({
  m: 2,
  pubkeys: sortedKeys,
  network
});

// 3. Wrap in P2SH
const p2sh = bitcoin.payments.p2sh({
  redeem: p2ms,
  network
});

const address = p2sh.address; // e.g., "2MzQw..."
```

**Script Structure**:
- **ScriptPubKey**: `OP_HASH160 <20-byte-script-hash> OP_EQUAL`
- **RedeemScript**: `OP_M <pubkey1> <pubkey2> ... <pubkeyN> OP_N OP_CHECKMULTISIG`

**Transaction Spending**:
- Provide M signatures in scriptSig
- Provide redeemScript to reveal multisig configuration

**Characteristics**:
- Largest transaction size (no SegWit discount)
- Universal compatibility
- Higher fees than SegWit variants
- ~200+ bytes per input (depending on M and N)

**Example Address**: `2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc` (testnet)

---

### 2. P2WSH Multisig (Native SegWit)

**Format**: Pay-to-Witness-Script-Hash (native SegWit multisig)

**Testnet Prefix**: 'tb1'
**Mainnet Prefix**: 'bc1'

**Generation Process**:
```typescript
// 1. Sort public keys per BIP67
const sortedKeys = sortPublicKeys(publicKeys);

// 2. Create multisig witness script
const p2ms = bitcoin.payments.p2ms({
  m: 2,
  pubkeys: sortedKeys,
  network
});

// 3. Create P2WSH
const p2wsh = bitcoin.payments.p2wsh({
  redeem: p2ms,
  network
});

const address = p2wsh.address; // e.g., "tb1q..."
```

**Script Structure**:
- **ScriptPubKey**: `OP_0 <32-byte-script-hash>`
- **WitnessScript**: `OP_M <pubkey1> <pubkey2> ... <pubkeyN> OP_N OP_CHECKMULTISIG`

**Transaction Spending**:
- Empty scriptSig
- Witness data contains M signatures + witnessScript
- Uses SHA256 hash (32 bytes) instead of Hash160 (20 bytes)

**Characteristics**:
- Most efficient (SegWit discount)
- Lowest fees (~40% reduction vs P2SH)
- Bech32 encoding (better error detection)
- Not supported by all exchanges (improving)
- ~100-150 vBytes per input (depending on M and N)

**Example Address**: `tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7` (testnet)

---

### 3. P2SH-P2WSH Multisig (Wrapped SegWit)

**Format**: P2WSH wrapped in P2SH for compatibility

**Testnet Prefix**: '2'
**Mainnet Prefix**: '3'

**Generation Process**:
```typescript
// 1. Sort public keys per BIP67
const sortedKeys = sortPublicKeys(publicKeys);

// 2. Create multisig witness script
const p2ms = bitcoin.payments.p2ms({
  m: 2,
  pubkeys: sortedKeys,
  network
});

// 3. Create P2WSH
const p2wsh = bitcoin.payments.p2wsh({
  redeem: p2ms,
  network
});

// 4. Wrap P2WSH in P2SH
const p2sh = bitcoin.payments.p2sh({
  redeem: p2wsh,
  network
});

const address = p2sh.address; // e.g., "2N..."
```

**Script Structure**:
- **ScriptPubKey**: `OP_HASH160 <20-byte-script-hash> OP_EQUAL`
- **RedeemScript**: `OP_0 <32-byte-witness-script-hash>` (P2WSH)
- **WitnessScript**: `OP_M <pubkey1> <pubkey2> ... <pubkeyN> OP_N OP_CHECKMULTISIG`

**Transaction Spending**:
- ScriptSig contains redeemScript (P2WSH script)
- Witness data contains M signatures + witnessScript
- Two-layer wrapping: P2SH ’ P2WSH ’ Multisig

**Characteristics**:
- Balance of efficiency and compatibility
- SegWit benefits with P2SH compatibility
- Accepted by all wallets/exchanges
- ~120-180 vBytes per input (depending on M and N)

**Example Address**: `2NEqFP4XqmKT9QjkEZC3U2yJHp9peCpkD6j` (testnet)

---

## Multisig Configurations

Three configurations are supported with varying security/usability tradeoffs:

### 2-of-2: Personal Security

**Configuration**: Requires both signatures to spend

**Use Cases**:
- Personal backup (phone + hardware wallet)
- Shared account between 2 parties (both must agree)

**Risk Level**: High

**Characteristics**:
- **Pros**:
  - Simple coordination (only 2 parties)
  - Clear responsibility (both must participate)
  - Smallest transaction size for multisig
- **Cons**:
  - Single point of failure (if one key lost, funds permanently locked)
  - No redundancy
  - Both parties must be available to spend

**Recommended For**: Advanced users with robust backup strategies

---

### 2-of-3: Shared Account (Recommended)

**Configuration**: Any 2 of 3 signatures required

**Use Cases**:
- Personal wallet with backup (daily device + hardware wallet + paper backup)
- Shared account between partners/friends
- Small business (e.g., 2 of 3 founders)

**Risk Level**: Low

**Characteristics**:
- **Pros**:
  - One key can be lost without losing funds
  - Redundancy and security balance
  - Most common multisig configuration
  - Flexible spending (any 2 parties)
- **Cons**:
  - Slightly larger transactions than 2-of-2
  - More coordination needed

**Recommended For**: Most users seeking enhanced security

---

### 3-of-5: Organization

**Configuration**: Any 3 of 5 signatures required

**Use Cases**:
- Business treasury (requires majority of executives)
- DAO/organization funds
- Large shared accounts

**Risk Level**: Very Low

**Characteristics**:
- **Pros**:
  - Up to 2 keys can be lost without losing funds
  - Highest security and redundancy
  - Requires majority consensus
  - Resistant to single-party compromise
- **Cons**:
  - Largest transaction size
  - Most coordination required
  - Slower to execute transactions

**Recommended For**: Organizations and high-value accounts

---

## Implementation Classes

### MultisigManager Class

**File**: `src/background/wallet/MultisigManager.ts`

**Purpose**: Manage multisig account creation and co-signer coordination

**Constructor**:
```typescript
new MultisigManager(network: 'testnet' | 'mainnet')
```

**Key Methods**:

#### createMultisigAccount()
```typescript
createMultisigAccount(params: {
  config: MultisigConfig;              // '2-of-2', '2-of-3', '3-of-5'
  addressType: MultisigAddressType;    // 'p2sh', 'p2wsh', 'p2sh-p2wsh'
  name: string;                        // Account name
  accountIndex: number;                // BIP48 account index
  ourXpub: string;                     // Our extended public key
  ourFingerprint: string;              // Our master key fingerprint
  cosignerXpubs: Array<{               // Co-signer info
    name: string;
    xpub: string;
    fingerprint: string;
  }>;
}): MultisigAccount
```

**Validation**:
- Verifies correct number of co-signers for configuration
- Validates all xpubs are public keys (not private)
- Checks network prefix matches
- Ensures no duplicate xpubs

**Returns**: `MultisigAccount` object ready for storage

---

#### exportOurXpub()
```typescript
exportOurXpub(
  masterNode: BIP32Interface,
  config: MultisigConfig,
  addressType: MultisigAddressType,
  accountIndex: number
): { xpub: string; fingerprint: string }
```

**Purpose**: Generate xpub for sharing with co-signers

**Process**:
1. Derive BIP48 account-level node
2. Export neutered (public-only) key
3. Calculate fingerprint from public key

**Security**: Only exports public key, never exposes private key

---

### AddressGenerator Multisig Extensions

**File**: `src/background/wallet/AddressGenerator.ts`

Extended to support multisig address generation with BIP67 integration.

#### generateMultisigAddress()
```typescript
generateMultisigAddress(
  publicKeys: Buffer[],
  m: number,
  addressType: MultisigAddressType
): string
```

**Process**:
1. Validate M value (1 d M d N)
2. Validate public keys (BIP67 validation)
3. **Sort keys per BIP67** (critical for determinism)
4. Generate address based on type (P2SH/P2WSH/P2SH-P2WSH)

**Returns**: Bitcoin multisig address

---

#### generateMultisigAddressWithMetadata()
```typescript
generateMultisigAddressWithMetadata(
  publicKeys: Buffer[],
  m: number,
  addressType: MultisigAddressType,
  derivationPath: string,
  addressIndex: number,
  isChange: boolean
): MultisigAddress
```

**Returns**: Complete `MultisigAddress` object with:
- `address`: Bitcoin multisig address
- `derivationPath`: BIP48 path
- `index`: Address index
- `isChange`: Whether this is a change address
- `used`: Usage status
- `redeemScript`: Hex script (for P2SH and P2SH-P2WSH)
- `witnessScript`: Hex script (for P2WSH and P2SH-P2WSH)

**Script Storage**:
- **P2SH**: Stores redeemScript only
- **P2WSH**: Stores witnessScript only
- **P2SH-P2WSH**: Stores both redeemScript and witnessScript

These scripts are essential for spending and must be provided in PSBTs.

---

## PSBT Workflow

### TransactionBuilder Multisig Extensions

**File**: `src/background/bitcoin/TransactionBuilder.ts`

Extended to support multisig transaction building and PSBT workflows.

#### buildMultisigPSBT()
```typescript
async buildMultisigPSBT(params: {
  multisigAddresses: MultisigAddress[];
  utxos: UTXO[];
  outputs: { address: string; amount: number }[];
  changeAddress: string;
  feeRate: number;
  m: number;
  n: number;
  addressType: MultisigAddressType;
}): Promise<bitcoin.Psbt>
```

**Purpose**: Create unsigned PSBT for multisig transaction

**Process**:
1. Calculate total output amount
2. Validate all addresses and amounts
3. Select UTXOs using multisig size estimation
4. Create PSBT with proper witness/redeem scripts
5. Add inputs with appropriate script data
6. Add recipient and change outputs

**Returns**: Unsigned PSBT ready for co-signer distribution

---

#### signMultisigPSBT()
```typescript
async signMultisigPSBT(
  psbt: bitcoin.Psbt,
  publicKeys: Buffer[],
  privateKey: Buffer
): Promise<bitcoin.Psbt>
```

**Purpose**: Add signatures from one co-signer

**Process**:
1. Sort public keys per BIP67
2. Create ECPair from private key
3. Find which public key corresponds to this private key
4. Sign all inputs
5. Validate signatures

**Returns**: PSBT with added signatures

**Note**: Does not finalize - can be signed by multiple parties

---

#### mergePSBTs() (Static)
```typescript
static mergePSBTs(psbts: bitcoin.Psbt[]): bitcoin.Psbt
```

**Purpose**: Combine signatures from multiple co-signers

**Process**:
1. Start with first PSBT
2. Use `psbt.combine()` to merge each subsequent PSBT
3. Return combined PSBT with all signatures

**Validation**: All PSBTs must be for the same transaction

---

#### finalizeMultisigPSBT()
```typescript
async finalizeMultisigPSBT(psbt: bitcoin.Psbt, m: number): Promise<string>
```

**Purpose**: Finalize PSBT and extract transaction hex

**Process**:
1. Verify M signatures present on all inputs
2. Finalize all inputs (convert PSBT to final transaction)
3. Extract transaction
4. Return hex for broadcasting

**Throws**: Error if insufficient signatures

---

### PSBTManager Class

**File**: `src/background/bitcoin/PSBTManager.ts`

**Purpose**: PSBT lifecycle management (export, import, merge, track)

#### exportPSBT()
```typescript
exportPSBT(psbt: bitcoin.Psbt): PSBTExport
```

**Returns**:
```typescript
{
  base64: string;           // Base64-encoded PSBT (standard)
  hex: string;              // Hex-encoded PSBT (alternative)
  txid: string;             // Transaction ID
  numInputs: number;        // Input count
  numOutputs: number;       // Output count
  totalOutput: number;      // Total output value (satoshis)
  fee: number;              // Fee (satoshis)
  signatures: number[];     // Signature count per input
  finalized: boolean;       // Finalization status
}
```

**Use Cases**:
- Export for file sharing
- Export for QR code display
- Metadata for UI display

---

#### importPSBT()
```typescript
importPSBT(psbtString: string): PSBTImportResult
```

**Accepts**: Base64 or hex encoded PSBT

**Returns**:
```typescript
{
  psbt: bitcoin.Psbt;       // Parsed PSBT object
  txid: string;             // Transaction ID
  warnings: string[];       // Validation warnings
  isValid: boolean;         // Overall validity
}
```

**Validation**:
- Format validation (base64/hex)
- UTXO data presence
- Output validity
- Script completeness

---

#### createPSBTChunks()
```typescript
createPSBTChunks(psbt: bitcoin.Psbt): PSBTChunk[]
```

**Purpose**: Split PSBT for QR code sharing

**Parameters**:
- Chunk size: 2500 bytes (fits in standard QR code)

**Returns**: Array of chunks with metadata:
```typescript
{
  index: number;       // Chunk number (1-based)
  total: number;       // Total chunks
  data: string;        // Base64 chunk
  txid: string;        // For reassembly
}
```

**Use Cases**:
- Air-gapped hardware wallets
- QR code-based signing
- Mobile wallet integration

---

## Complete Workflow Example

**Complete 2-of-3 Multisig Transaction**:

```typescript
// ============================================================
// SETUP PHASE (One-time)
// ============================================================

// Each co-signer exports their xpub
const alice = multisigManager.exportOurXpub(aliceMasterNode, '2-of-3', 'p2wsh', 0);
const bob = multisigManager.exportOurXpub(bobMasterNode, '2-of-3', 'p2wsh', 0);
const charlie = multisigManager.exportOurXpub(charlieMasterNode, '2-of-3', 'p2wsh', 0);

// Alice creates the multisig account (all co-signers do the same)
const account = multisigManager.createMultisigAccount({
  config: '2-of-3',
  addressType: 'p2wsh',
  name: 'Shared Savings',
  accountIndex: 0,
  ourXpub: alice.xpub,
  ourFingerprint: alice.fingerprint,
  cosignerXpubs: [
    { name: 'Bob', xpub: bob.xpub, fingerprint: bob.fingerprint },
    { name: 'Charlie', xpub: charlie.xpub, fingerprint: charlie.fingerprint }
  ]
});

// Derive public keys at index 0 for first receiving address
const alicePubkey = aliceMasterNode.derivePath("m/48'/1'/0'/2'/0/0").publicKey;
const bobPubkey = bobMasterNode.derivePath("m/48'/1'/0'/2'/0/0").publicKey;
const charliePubkey = charlieMasterNode.derivePath("m/48'/1'/0'/2'/0/0").publicKey;

// Generate multisig address (all co-signers get same address)
const addressGen = new AddressGenerator('testnet');
const multisigAddr = addressGen.generateMultisigAddressWithMetadata(
  [alicePubkey, bobPubkey, charliePubkey],
  2,
  'p2wsh',
  "m/48'/1'/0'/2'/0/0",
  0,
  false
);

console.log('Multisig Address:', multisigAddr.address);
// All three co-signers independently verify they get the same address

// ============================================================
// TRANSACTION PHASE
// ============================================================

// 1. Alice initiates transaction (creates unsigned PSBT)
const txBuilder = new TransactionBuilder('testnet');
const unsignedPsbt = await txBuilder.buildMultisigPSBT({
  multisigAddresses: [multisigAddr],
  utxos: [...],
  outputs: [{ address: 'recipient_address', amount: 100000 }],
  changeAddress: multisigChangeAddr.address,
  feeRate: 5,
  m: 2,
  n: 3,
  addressType: 'p2wsh'
});

// 2. Alice exports PSBT for sharing
const psbtManager = new PSBTManager(NETWORKS.testnet);
const exported = psbtManager.exportPSBT(unsignedPsbt);

console.log('Share this with co-signers:', exported.base64);

// 3. Alice signs with her key
const aliceSignedPsbt = await txBuilder.signMultisigPSBT(
  unsignedPsbt,
  [alicePubkey, bobPubkey, charliePubkey],
  alicePrivateKey
);

const aliceExported = psbtManager.exportPSBT(aliceSignedPsbt);
console.log('Alice signatures:', aliceExported.signatures); // [1, 1, ...]

// 4. Bob imports, signs, and exports
const bobImported = psbtManager.importPSBT(exported.base64);
const bobSignedPsbt = await txBuilder.signMultisigPSBT(
  bobImported.psbt,
  [alicePubkey, bobPubkey, charliePubkey],
  bobPrivateKey
);

const bobExported = psbtManager.exportPSBT(bobSignedPsbt);
console.log('Bob signatures:', bobExported.signatures); // [1, 1, ...]

// 5. Alice merges signatures from herself and Bob
const mergedPsbt = TransactionBuilder.mergePSBTs([aliceSignedPsbt, bobSignedPsbt]);

const mergedExported = psbtManager.exportPSBT(mergedPsbt);
console.log('Merged signatures:', mergedExported.signatures); // [2, 2, ...]

// 6. Check if we have enough signatures (2-of-3)
const hasEnough = TransactionBuilder.hasEnoughSignatures(mergedPsbt, 2);
console.log('Can finalize?', hasEnough); // true

// 7. Finalize and extract transaction hex
const txHex = await txBuilder.finalizeMultisigPSBT(mergedPsbt, 2);
console.log('Transaction hex:', txHex);

// 8. Broadcast transaction
await blockstreamClient.broadcastTransaction(txHex);
console.log('Transaction broadcasted!');
```

---

## Security Considerations

### Key Security
- Only public keys (xpubs) are shared between co-signers
- Private keys never leave their respective wallets
- Fingerprints should be verified in person or through trusted channel
- BIP48 derivation prevents key reuse across account types

### Address Generation Security
- BIP67 sorting ensures deterministic address generation
- All co-signers independently verify addresses match
- No coordination needed on key ordering (prevents manipulation)
- Scripts stored with addresses for spending verification

### PSBT Security
- PSBTs can be safely shared (contain no private data)
- Each co-signer validates PSBT before signing
- Signature validation ensures correct keys used
- Finalization only possible with M valid signatures

### Network Security
- Testnet/mainnet xpub prefixes prevent network mixing
- Address validation checks network compatibility
- PSBT network parameter enforced throughout

---

## Testing

### Unit Test Checklist

**BIP67 Tests**:
- [x] Sort 2 public keys
- [x] Sort 3 public keys
- [x] Sort 5 public keys
- [x] Detect already sorted keys
- [x] Compare key sets
- [x] Find key position
- [x] Validate multisig keys
- [x] Reject invalid keys
- [x] Reject duplicate keys

**MultisigManager Tests**:
- [x] Create 2-of-2 account
- [x] Create 2-of-3 account
- [x] Create 3-of-5 account
- [x] Validate xpub formats
- [x] Reject private keys
- [x] Reject wrong network xpubs
- [x] Export our xpub
- [x] Import co-signer xpubs
- [x] Generate BIP48 derivation paths

**AddressGenerator Multisig Tests**:
- [x] Generate P2SH multisig address
- [x] Generate P2WSH multisig address
- [x] Generate P2SH-P2WSH multisig address
- [x] Verify BIP67 key sorting
- [x] Verify deterministic address generation
- [x] Extract redeem scripts
- [x] Extract witness scripts

**TransactionBuilder Multisig Tests**:
- [x] Build unsigned multisig PSBT
- [x] Add multisig inputs (P2SH)
- [x] Add multisig inputs (P2WSH)
- [x] Add multisig inputs (P2SH-P2WSH)
- [x] Sign multisig PSBT
- [x] Merge multiple signed PSBTs
- [x] Count signatures
- [x] Detect enough signatures
- [x] Finalize multisig PSBT
- [x] Estimate multisig transaction size

**PSBTManager Tests**:
- [x] Export PSBT to base64
- [x] Export PSBT to hex
- [x] Import PSBT from base64
- [x] Import PSBT from hex
- [x] Create PSBT chunks for QR
- [x] Reassemble PSBT from chunks
- [x] Validate multisig PSBT
- [x] Track pending transactions

### Integration Test Scenarios

**Testnet Verification**:
1. Create 2-of-3 multisig account (3 separate wallet instances)
2. Each wallet exports xpub
3. All wallets import co-signer xpubs
4. Generate multisig address (verify all get same address)
5. Receive testnet BTC to multisig address
6. Create transaction spending multisig UTXO
7. First co-signer signs PSBT
8. Second co-signer signs PSBT
9. Merge PSBTs
10. Finalize and broadcast
11. Verify on block explorer

**Cross-Wallet Compatibility**:
1. Generate multisig address with Electrum
2. Import co-signer xpubs from our wallet
3. Verify address matches
4. Send testnet BTC to address
5. Create PSBT in Electrum
6. Sign PSBT in our wallet
7. Merge and broadcast in Electrum
8. Verify transaction confirms

---

## Future Enhancements

### Potential Improvements
1. **Descriptor Support**: Implement output descriptors (BIP380-386) for better compatibility
2. **Timelock Multisig**: Add support for CSV/CLTV timelocks
3. **Taproot Multisig**: Implement MuSig2 for P2TR addresses (BIP340-342)
4. **PSBT URs**: Support Uniform Resources for air-gapped QR workflows
5. **Hardware Wallet Integration**: Direct integration with Ledger/Trezor for multisig
6. **Co-signer Discovery**: Protocol for co-signer coordination and xpub exchange
7. **Multisig Templates**: Pre-configured setups for common use cases
8. **Emergency Recovery**: Time-based fallback for lost co-signer keys

---

## References

**BIP Standards**:
- BIP48: Multisig Derivation - https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki
- BIP67: Deterministic Key Sorting - https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
- BIP174: PSBT - https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki

**Implementation Guides**:
- Bitcoin Core Multisig - https://developer.bitcoin.org/examples/transactions.html#multisig
- bitcoinjs-lib PSBT Guide - https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/transactions.spec.ts

---

**Related Documentation**:
- [Architecture](./architecture.md) - BIP standards and HD wallet structure
- [Addresses](./addresses.md) - Address generation and validation
- [Transactions](./transactions.md) - Transaction building and PSBT for single-sig
- [UTXO Management](./utxo.md) - UTXO selection for multisig

---

**Last Modified**: October 22, 2025
**Status**: Production Ready 
**Compliance**: BIP48, BIP67, BIP174 
