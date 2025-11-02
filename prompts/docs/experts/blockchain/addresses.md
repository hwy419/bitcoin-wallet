# Address Generation & Validation

**Last Updated**: October 22, 2025

This document covers Bitcoin address generation, validation, and all supported address types.

---

## Table of Contents
1. [Address Types & Formats](#address-types--formats)
2. [Address Generation](#address-generation)
3. [Address Validation](#address-validation)
4. [AddressGenerator Class](#addressgenerator-class)

---

## Address Types & Formats

### 1. Legacy (P2PKH) - Pay-to-PubKey-Hash

**Script**: `OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG`

**Testnet Prefix**: 'm' or 'n' (Base58Check)
**Mainnet Prefix**: '1' (Base58Check)

**Generation**:
```typescript
import * as bitcoin from 'bitcoinjs-lib';

const { address } = bitcoin.payments.p2pkh({
  pubkey: node.publicKey,
  network: bitcoin.networks.testnet
});
```

**Characteristics**:
- Oldest format
- Largest transaction size
- Highest fees
- Universal compatibility
- ~180 bytes per input

**Example**: `mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn` (testnet)

---

### 2. SegWit (P2SH-P2WPKH) - Pay-to-Script-Hash wrapping Pay-to-Witness-PubKey-Hash

**Script**: `OP_HASH160 <redeemScriptHash> OP_EQUAL`
**Redeem Script**: `OP_0 <pubKeyHash>`

**Testnet Prefix**: '2' (Base58Check)
**Mainnet Prefix**: '3' (Base58Check)

**Generation**:
```typescript
const p2wpkh = bitcoin.payments.p2wpkh({
  pubkey: node.publicKey,
  network: bitcoin.networks.testnet
});

const { address } = bitcoin.payments.p2sh({
  redeem: p2wpkh,
  network: bitcoin.networks.testnet
});
```

**Characteristics**:
- Backward compatible with legacy wallets
- ~30% smaller than legacy
- Witness data stored separately
- ~100 vBytes per input

**Example**: `2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc` (testnet)

---

### 3. Native SegWit (P2WPKH) - Pay-to-Witness-PubKey-Hash

**Script**: `OP_0 <pubKeyHash>`

**Testnet Prefix**: 'tb1' (Bech32)
**Mainnet Prefix**: 'bc1' (Bech32)

**Generation**:
```typescript
const { address } = bitcoin.payments.p2wpkh({
  pubkey: node.publicKey,
  network: bitcoin.networks.testnet
});
```

**Characteristics**:
- Most efficient format
- Lowest fees (~40% reduction vs legacy)
- Case-insensitive Bech32 encoding
- Better error detection
- Not supported by all exchanges (improving)
- ~68 vBytes per input

**Example**: `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx` (testnet)

---

## Address Generation

### Address Prefixes (Testnet)

| Type | Prefix | Example |
|------|--------|---------|
| Legacy | m, n | `mzBc4XEFSdzCDcTx...` |
| SegWit | 2 | `2MzQwSSnBHWH...` |
| Native SegWit | tb1 | `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx` |

**Mainnet:** 1, 3, bc1

---

## Address Validation

```typescript
const validateBitcoinAddress = (
  address: string,
  network: bitcoin.Network = bitcoin.networks.testnet
): boolean => {
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch (e) {
    return false;
  }
};

// Detect address type
const detectAddressType = (address: string): AddressType | null => {
  // Testnet
  if (address.startsWith('m') || address.startsWith('n')) return 'legacy';
  if (address.startsWith('2')) return 'segwit';
  if (address.startsWith('tb1')) return 'native-segwit';

  // Mainnet
  if (address.startsWith('1')) return 'legacy';
  if (address.startsWith('3')) return 'segwit';
  if (address.startsWith('bc1')) return 'native-segwit';

  return null;
};
```

---

## AddressGenerator Class

**File**: `src/background/wallet/AddressGenerator.ts`

**Purpose**: Generate and validate Bitcoin addresses for all three address types

### Constructor

```typescript
new AddressGenerator(network: 'testnet' | 'mainnet' = 'testnet')
```
- Configures network for address generation
- Loads bitcoinjs-lib network parameters

### Key Methods

#### generateAddress()
```typescript
generateAddress(node: BIP32Interface, addressType: AddressType): string
```
- Main address generation method
- Routes to specific generator based on type
- Returns Bitcoin address string

#### generateLegacyAddress() (private)
```typescript
generateLegacyAddress(node): string
```
- P2PKH address generation
- Testnet prefix: 'm' or 'n'
- Mainnet prefix: '1'
- Uses bitcoin.payments.p2pkh()

#### generateSegWitAddress() (private)
```typescript
generateSegWitAddress(node): string
```
- P2SH-P2WPKH address generation (BIP49)
- Testnet prefix: '2'
- Mainnet prefix: '3'
- Wraps P2WPKH in P2SH for compatibility
- Uses bitcoin.payments.p2sh({ redeem: p2wpkh })

#### generateNativeSegWitAddress() (private)
```typescript
generateNativeSegWitAddress(node): string
```
- P2WPKH address generation (BIP84)
- Testnet prefix: 'tb1'
- Mainnet prefix: 'bc1'
- Bech32 encoding
- Uses bitcoin.payments.p2wpkh()

#### generateAddressWithMetadata()
```typescript
generateAddressWithMetadata(
  node: BIP32Interface,
  addressType: AddressType,
  path: string,
  index: number,
  isChange: boolean
): Address
```
- Generates address + full metadata object
- Returns Address interface for storage
- Includes derivation path, index, change flag, used status

#### validateAddress()
```typescript
validateAddress(address: string): boolean
```
- Validates address format, checksum, and network
- Uses bitcoin.address.toOutputScript()
- Returns true/false

#### getAddressType()
```typescript
getAddressType(address: string): AddressType | null
```
- Detects address type from prefix
- Returns 'legacy', 'segwit', 'native-segwit', or null

#### getScriptPubKey()
```typescript
getScriptPubKey(address: string): string
```
- Returns hex-encoded locking script
- Needed for transaction building (PSBT witnessUtxo)

#### getPayment()
```typescript
getPayment(address: string): bitcoin.Payment
```
- Returns full payment object for address
- Useful for transaction construction

### Implementation Notes

- All three address types fully implemented and tested
- Correct network parameters from shared/constants.ts
- Validates generated addresses before returning
- Comprehensive error handling with clear messages
- Ready for transaction building integration
- Supports both external (receive) and internal (change) addresses

---

## Integration with HDWallet

**HDWallet → AddressGenerator**:
```typescript
const addressGen = new AddressGenerator('testnet');
const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
const address = addressGen.generateAddress(node, 'native-segwit');
// address: "tb1q..." (first receiving address, account 0)
```

**Complete Flow**:
```typescript
// 1. Generate wallet
const mnemonic = KeyManager.generateMnemonic();
const seed = KeyManager.mnemonicToSeed(mnemonic);

// 2. Create HD wallet
const wallet = new HDWallet(seed, 'testnet');

// 3. Create account
const account = wallet.createAccount('native-segwit', 0, 'Main Account');

// 4. Generate first receiving address
const addressGen = new AddressGenerator('testnet');
const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
const addressObj = addressGen.generateAddressWithMetadata(
  node,
  'native-segwit',
  "m/84'/1'/0'/0/0",
  0,
  false
);

console.log(addressObj.address); // tb1q...
```

---

## Testing

### Unit Test Coverage

**AddressGenerator Tests**:
- [x] Generate Legacy addresses (testnet)
- [x] Generate SegWit addresses (testnet)
- [x] Generate Native SegWit addresses (testnet)
- [x] Validate all address types
- [x] Detect address types from prefix
- [x] Get scriptPubKey from address
- [x] Test mainnet vs testnet prefixes

### Testnet Verification

- [x] Generate testnet addresses
- [x] Verify on block explorer
- [x] Receive testnet BTC
- [x] Verify balance updates
- [x] Use addresses in transactions

---

## Common Pitfalls

### Address Reuse
**Problem**: Using same address reduces privacy
**Solution**: Generate new address for each receive, use HD wallet properly

```typescript
// Track address index per account
account.externalIndex++; // Increment after each use
```

### Wrong Network
**Problem**: Using testnet address on mainnet or vice versa
**Solution**: Strict network validation, UI indicators

```typescript
const validateAddressForNetwork = (
  address: string,
  network: bitcoin.Network
): boolean => {
  try {
    bitcoin.address.toOutputScript(address, network);
    return true;
  } catch {
    return false;
  }
};
```

---

## References

### Official Specifications
- **BIP141**: SegWit Specification - https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
- **BIP143**: SegWit Transaction Signing - https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki
- **BIP173**: Bech32 Address Format - https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki

### Tools
- **BIP39 Tool**: https://iancoleman.io/bip39/ (test derivation paths)
- **Testnet Explorer**: https://blockstream.info/testnet/
- **Bitcoin Developer Guide**: https://developer.bitcoin.org/devguide/

---

## Related Documentation

- [architecture.md](./architecture.md) - BIP standards, HD wallet structure, derivation paths
- [transactions.md](./transactions.md) - Transaction building, signing, PSBT, fee estimation
- [multisig.md](./multisig.md) - Multisig address generation
