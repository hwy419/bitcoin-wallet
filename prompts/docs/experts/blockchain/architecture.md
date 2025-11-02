# HD Wallet Architecture

**Last Updated**: October 22, 2025

This document covers BIP standards implementation, HD wallet architecture, and derivation paths.

---

## Table of Contents
1. [BIP Standards Implementation](#bip-standards-implementation)
2. [HD Wallet Architecture](#hd-wallet-architecture)
3. [Network Configuration](#network-configuration)
4. [Bitcoin Protocol Constants](#bitcoin-protocol-constants)

---

## BIP Standards Implementation

### BIP39 - Mnemonic Seed Phrases

**Purpose**: Human-readable backup of wallet seeds

**Implementation Details**:
- **Entropy**: 128 bits (12 words) or 256 bits (24 words)
- **Wordlist**: English BIP39 wordlist (2048 words)
- **Checksum**: Last word contains checksum bits
- **Passphrase**: Optional 25th word (not implementing in MVP)

**Key Functions**:
```typescript
// Generate new mnemonic
bip39.generateMnemonic(128)  // 12 words
bip39.generateMnemonic(256)  // 24 words

// Validate mnemonic
bip39.validateMnemonic(mnemonic)  // Returns boolean

// Convert to seed (512 bits)
bip39.mnemonicToSeedSync(mnemonic, passphrase?)
```

**Security Notes**:
- Never display seed phrase in logs
- Always validate before import
- Seed phrase must be backed up offline
- Consider implementing BIP39 passphrase for advanced users (post-MVP)

**Test Vector** (from BIP39 spec):
```
Mnemonic: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
Seed: 5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4
```

---

### BIP32 - Hierarchical Deterministic Wallets

**Purpose**: Derive unlimited keys from single seed

**Key Derivation**:
- **Normal derivation**: Public key derivation possible
- **Hardened derivation**: Requires private key (marked with ')
- **Chain code**: Additional 256 bits for derivation

**Master Key Generation**:
```
Seed (512 bits) -> HMAC-SHA512("Bitcoin seed") -> Master Private Key (256 bits) + Chain Code (256 bits)
```

**Derivation Function**:
```
Parent Key + Index -> Child Key
```

**Notation**:
- `m` = master private key
- `M` = master public key
- `'` or `h` = hardened derivation (e.g., m/0')
- Numbers without ' = normal derivation

**Key Format** (Extended Keys):
- **xprv**: Extended private key (Base58, starts with "xprv")
- **xpub**: Extended public key (Base58, starts with "xpub")
- **tprv/tpub**: Testnet versions

---

### BIP44 - Multi-Account Hierarchy

**Purpose**: Standard derivation path structure

**Path Structure**:
```
m / purpose' / coin_type' / account' / change / address_index
```

**Levels Explained**:
1. **Purpose**: Address type (44 for legacy, 49 for SegWit, 84 for Native SegWit)
2. **Coin Type**: 0 = Bitcoin mainnet, 1 = Testnet, 2 = Litecoin, etc.
3. **Account**: Account index (0, 1, 2...) - user-facing accounts
4. **Change**: 0 = external (receive), 1 = internal (change addresses)
5. **Address Index**: Address index within account (0, 1, 2...)

**All levels except address_index use hardened derivation** for security.

---

## HD Wallet Architecture

### Derivation Paths by Address Type

#### Legacy (P2PKH) - BIP44
```
Purpose: 44'
Testnet Path: m/44'/1'/account'/change/index
Mainnet Path: m/44'/0'/account'/change/index

Examples:
- First receive address, Account 0: m/44'/1'/0'/0/0
- First change address, Account 0:  m/44'/1'/0'/1/0
- Second receive address, Account 1: m/44'/1'/1'/0/1
```

#### SegWit (P2SH-P2WPKH) - BIP49
```
Purpose: 49'
Testnet Path: m/49'/1'/account'/change/index
Mainnet Path: m/49'/0'/account'/change/index

Examples:
- First receive address, Account 0: m/49'/1'/0'/0/0
- First change address, Account 0:  m/49'/1'/0'/1/0
```

#### Native SegWit (P2WPKH) - BIP84
```
Purpose: 84'
Testnet Path: m/84'/1'/account'/change/index
Mainnet Path: m/84'/0'/account'/change/index

Examples:
- First receive address, Account 0: m/84'/1'/0'/0/0
- First change address, Account 0:  m/84'/1'/0'/1/0
```

### Coin Type Constants
```typescript
const COIN_TYPE = {
  BITCOIN_MAINNET: 0,
  TESTNET: 1,        // For all testnet coins
  LITECOIN: 2,
  DOGECOIN: 3,
  // ... see SLIP-0044 for full list
};
```

### Implementation Strategy

**Account Structure**:
```typescript
interface Account {
  index: number;              // Account index (0, 1, 2...)
  name: string;               // User-friendly name ("Account 1", "Savings")
  addressType: AddressType;   // 'legacy' | 'segwit' | 'native-segwit'
  externalIndex: number;      // Last used receive address index
  internalIndex: number;      // Last used change address index
  addresses: Address[];       // Cached addresses
}
```

**Address Gap Limit**:
- Standard: 20 (BIP44)
- Check 20 consecutive unused addresses before considering account empty
- Important for wallet recovery/import

---

## Network Configuration

```typescript
// Testnet configuration
const TESTNET_CONFIG = {
  network: bitcoin.networks.testnet,
  coinType: 1,
  addressPrefixes: {
    legacy: ['m', 'n'],
    segwit: ['2'],
    nativeSegwit: ['tb1']
  },
  apiUrl: 'https://blockstream.info/testnet/api',
  explorer: 'https://blockstream.info/testnet/'
};

// Mainnet configuration (future)
const MAINNET_CONFIG = {
  network: bitcoin.networks.bitcoin,
  coinType: 0,
  addressPrefixes: {
    legacy: ['1'],
    segwit: ['3'],
    nativeSegwit: ['bc1']
  },
  apiUrl: 'https://blockstream.info/api',
  explorer: 'https://blockstream.info/'
};
```

---

## Bitcoin Protocol Constants

```typescript
// Amount conversions
const SATOSHIS_PER_BTC = 100_000_000;
const satoshisToBTC = (sats: number) => sats / SATOSHIS_PER_BTC;
const btcToSatoshis = (btc: number) => Math.round(btc * SATOSHIS_PER_BTC);

// Dust limit (minimum economical output)
const DUST_LIMIT = 546; // satoshis

// Transaction limits
const MAX_TX_SIZE = 100_000; // bytes
const MAX_STANDARD_TX_WEIGHT = 400_000; // weight units

// Block times
const AVERAGE_BLOCK_TIME = 10 * 60; // 10 minutes in seconds

// Address gap limit
const GAP_LIMIT = 20; // BIP44 standard

// Confirmations
const CONFIRMATIONS_SECURE = 6;
const CONFIRMATIONS_FAST = 1;

// Sequence
const SEQUENCE_FINAL = 0xffffffff;
```

---

## Implementation Classes

### KeyManager Class (`src/background/wallet/KeyManager.ts`)

**Purpose**: BIP39 mnemonic phrase generation, validation, and seed derivation

**Key Methods**:
- `generateMnemonic(strength: number = 128): string`
  - Generates 12-word (128-bit) or 24-word (256-bit) mnemonic
  - Uses crypto.getRandomValues via bip39 library
  - Default: 12 words for MVP

- `validateMnemonic(mnemonic: string): boolean`
  - Validates word list membership and checksum
  - Returns true/false (no exceptions)
  - Normalizes whitespace automatically

- `mnemonicToSeed(mnemonic: string, passphrase: string = ''): Buffer`
  - Converts mnemonic to 512-bit seed using PBKDF2-HMAC-SHA512
  - 2048 iterations per BIP39 standard
  - Passphrase support for optional "25th word"
  - Returns 64-byte Buffer ready for BIP32 derivation

- `mnemonicToEntropy(mnemonic: string): string`
  - Extracts hex entropy from mnemonic (for testing/verification)

- `entropyToMnemonic(entropy: string | Buffer): string`
  - Converts entropy to mnemonic (for advanced use cases)

- `getWordList(): string[]`
  - Returns BIP39 English word list (2048 words)

**Implementation Notes**:
- All methods handle whitespace normalization
- Comprehensive error messages for debugging
- No private keys handled at this level (security by design)
- Ready for integration with HDWallet class

---

### HDWallet Class (`src/background/wallet/HDWallet.ts`)

**Purpose**: BIP32 hierarchical deterministic wallet with BIP44/49/84 derivation path support

**Constructor**:
```typescript
new HDWallet(seed: Buffer, network: 'testnet' | 'mainnet' = 'testnet')
```
- Takes 64-byte seed from KeyManager
- Initializes BIP32 master node
- Validates seed length (must be exactly 64 bytes)

**Key Methods**:

- `derivePath(path: string): BIP32Interface`
  - Derives BIP32 node at any path (e.g., "m/44'/1'/0'/0/0")
  - Validates path format
  - Returns BIP32 node with private/public keys

- `deriveAccountNode(addressType: AddressType, accountIndex: number): BIP32Interface`
  - Derives account-level node per BIP44/49/84
  - Automatically selects correct purpose based on address type:
    - Legacy: m/44'/coin'/account'
    - SegWit: m/49'/coin'/account'
    - Native SegWit: m/84'/coin'/account'
  - Uses hardened derivation for security

- `deriveAddressNode(addressType, accountIndex, change: 0|1, addressIndex): BIP32Interface`
  - Derives full address-level key
  - change: 0 = receiving, 1 = change addresses
  - Returns node ready for address generation

- `createAccount(addressType, accountIndex, name?): Account`
  - Creates account metadata structure
  - Validates derivation is possible
  - Returns Account object for storage

- `getExtendedPublicKey(): string`
  - Exports master xpub (Base58-encoded)
  - Useful for watch-only wallets

- `getAccountExtendedPublicKey(addressType, accountIndex): string`
  - Exports account-level xpub (safer than master xpub)
  - Better privacy - only exposes one account

- `static isValidPath(path: string): boolean`
  - Validates BIP32 path format
  - Regex: `^m(\/\d+'?)*$`

**Implementation Notes**:
- Uses tiny-secp256k1 via BIP32Factory
- Supports both testnet (coin type 1) and mainnet (coin type 0)
- References DERIVATION_PATHS from shared/constants.ts
- All derivations validated before execution
- Clear error messages for debugging
- Follows BIP44 standard strictly (hardened account level)

---

## Integration Example

**KeyManager → HDWallet**:
```typescript
const mnemonic = KeyManager.generateMnemonic(128);
const seed = KeyManager.mnemonicToSeed(mnemonic);
const wallet = new HDWallet(seed, 'testnet');
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

## Common Pitfalls & Solutions

### Pitfall 1: Floating Point Arithmetic
**Problem**: JavaScript floating point can cause rounding errors
**Solution**: Always use integers (satoshis) internally, convert to BTC only for display

```typescript
// ❌ Bad
const amount = 0.1 + 0.2; // 0.30000000000000004

// ✅ Good
const amountSats = 10_000_000 + 20_000_000; // 30,000,000 sats
const amountBTC = satoshisToBTC(amountSats); // Convert only for display
```

---

### Pitfall 2: Address Reuse
**Problem**: Using same address reduces privacy
**Solution**: Generate new address for each receive, use HD wallet properly

```typescript
// Track address index per account
account.externalIndex++; // Increment after each use
```

---

### Pitfall 5: Wrong Network
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
- **BIP32**: HD Wallets - https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- **BIP39**: Mnemonic Code - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- **BIP44**: Multi-Account Hierarchy - https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
- **BIP49**: SegWit Derivation - https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki
- **BIP84**: Native SegWit Derivation - https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki

### Libraries Documentation
- **bitcoinjs-lib**: https://github.com/bitcoinjs/bitcoinjs-lib
- **bip32**: https://github.com/bitcoinjs/bip32
- **bip39**: https://github.com/bitcoinjs/bip39
- **tiny-secp256k1**: https://github.com/bitcoinjs/tiny-secp256k1

### Tools
- **BIP39 Tool**: https://iancoleman.io/bip39/ (test derivation paths)
- **Bitcoin Developer Guide**: https://developer.bitcoin.org/devguide/

---

## Related Documentation

- [addresses.md](./addresses.md) - Address generation, validation, all address types
- [transactions.md](./transactions.md) - Transaction building, signing, PSBT, fee estimation
- [multisig.md](./multisig.md) - Multisig wallet implementation, PSBT coordination
