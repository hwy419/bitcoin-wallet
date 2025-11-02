# Test Xpub Files for Multisig Wallet Testing

This directory contains test extended public key (xpub) files for testing multisig wallet import functionality in the Bitcoin Wallet Chrome Extension.

## ⚠️ SECURITY WARNING

**These xpubs are generated from well-known BIP39 test vectors and should ONLY be used for testing purposes. NEVER use these for real Bitcoin transactions!**

## Overview

All xpubs are generated for Bitcoin testnet using:
- **BIP48 derivation path**: `m/48'/1'/0'/2'`
- **Address type**: P2WSH (Native SegWit)
- **Network**: Bitcoin Testnet (coin_type = 1)

## Available Test Files

### 2-of-2 Multisig Configuration
To test 2-of-2 multisig, you need 2 xpubs total (yours + 1 cosigner):
- `cosigner-1-2of2-p2wsh.json` - Fingerprint: 73C5DA0A

### 2-of-3 Multisig Configuration
To test 2-of-3 multisig, you need 3 xpubs total (yours + 2 cosigners):
- `cosigner-1-2of3-p2wsh.json` - Fingerprint: 73C5DA0A
- `cosigner-2-2of3-p2wsh.json` - Fingerprint: B8688DF1

### 3-of-5 Multisig Configuration
To test 3-of-5 multisig, you need 5 xpubs total (yours + 4 cosigners):
- `cosigner-1-3of5-p2wsh.json` - Fingerprint: 73C5DA0A
- `cosigner-2-3of5-p2wsh.json` - Fingerprint: B8688DF1
- `cosigner-3-3of5-p2wsh.json` - Fingerprint: 28645006
- `cosigner-4-3of5-p2wsh.json` - Fingerprint: 3F635A63

## JSON File Format

Each file contains:
```json
{
  "xpub": "xpub6EuX7TBE...",           // Extended public key (testnet)
  "fingerprint": "73C5DA0A",           // Master key fingerprint
  "configuration": "2-of-3",           // Multisig configuration
  "addressType": "p2wsh",              // Address type (Native SegWit)
  "derivationPath": "m/48'/1'/0'/2'",  // BIP48 derivation path
  "createdAt": "2025-10-13T..."        // ISO timestamp
}
```

## How to Use for Testing

### Testing Multisig Wallet Import

1. **Create your own multisig account** in the wallet with matching configuration (e.g., 2-of-3)
2. **Export your xpub** from the wallet (it will generate a similar JSON file)
3. **Import cosigner xpubs** using the files from this directory:
   - For 2-of-2: Import 1 file
   - For 2-of-3: Import 2 files
   - For 3-of-5: Import 4 files

### Testing Xpub Export/Import Flow

1. Navigate to multisig wallet setup in the extension
2. Select configuration (e.g., "2-of-3")
3. Select address type (P2WSH - Native SegWit)
4. Export your xpub (Download as JSON)
5. Import cosigner xpubs from this directory
6. Verify fingerprints match the files
7. Complete multisig wallet setup

### Verifying Fingerprints

Always verify fingerprints with cosigners via a secure channel. The test fingerprints are:
- **73C5DA0A**: Cosigner 1 (from "abandon abandon..." mnemonic)
- **B8688DF1**: Cosigner 2 (from "legal winner..." mnemonic)
- **28645006**: Cosigner 3 (from "letter advice..." mnemonic)
- **3F635A63**: Cosigner 4 (from "zoo zoo..." mnemonic)

## Regenerating Test Files

To regenerate these test files with different configurations:

```bash
node scripts/generate-test-xpubs.js
```

The script uses deterministic BIP39 test vectors, so regeneration will produce identical xpubs.

## Source Mnemonics (For Reference)

These xpubs were generated from the following test mnemonics:

1. **Cosigner 1** (73C5DA0A):
   ```
   abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
   ```

2. **Cosigner 2** (B8688DF1):
   ```
   legal winner thank year wave sausage worth useful legal winner thank yellow
   ```

3. **Cosigner 3** (28645006):
   ```
   letter advice cage absurd amount doctor acoustic avoid letter advice cage above
   ```

4. **Cosigner 4** (3F635A63):
   ```
   zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong
   ```

**Remember**: These are well-known BIP39 test vectors. Anyone can derive private keys from these mnemonics. Use ONLY for testing!

## BIP Standards Reference

- **BIP32**: Hierarchical Deterministic Wallets
- **BIP39**: Mnemonic code for generating deterministic keys
- **BIP48**: Multi-signature derivation paths
  - Format: `m/48'/coin_type'/account'/script_type'`
  - Script type 2 = P2WSH (Native SegWit)
- **BIP67**: Deterministic key sorting for multisig

## Technical Details

### Derivation Path Breakdown

`m/48'/1'/0'/2'`

- `48'`: BIP48 (multisig standard) - hardened
- `1'`: Testnet coin type - hardened
- `0'`: Account index (0 = first account) - hardened
- `2'`: Script type (2 = P2WSH Native SegWit) - hardened

### Address Type: P2WSH

- **Name**: Pay to Witness Script Hash (Native SegWit)
- **Testnet prefix**: `tb1` (Bech32 encoding)
- **Benefits**: Lowest fees, native SegWit support
- **BIP**: BIP141, BIP173

## Testing Scenarios

### Basic Import Test
1. Import cosigner-1-2of3-p2wsh.json
2. Verify fingerprint displays correctly
3. Verify xpub displays correctly
4. Verify configuration matches (2-of-3)

### Multiple Cosigner Test
1. Import cosigner-1-2of3-p2wsh.json
2. Import cosigner-2-2of3-p2wsh.json
3. Verify both are listed with different fingerprints
4. Complete multisig setup

### Configuration Mismatch Test
1. Try importing cosigner-1-2of2-p2wsh.json for a 2-of-3 wallet
2. Verify error handling and validation

### Fingerprint Verification Test
1. Import xpub file
2. Verify fingerprint matches file (73C5DA0A)
3. Test copy-to-clipboard functionality

## Support

For issues or questions about test data generation, see:
- Generation script: `/scripts/generate-test-xpubs.js`
- Extension documentation: `/CLAUDE.md`
- Blockchain expert notes: `/prompts/docs/blockchain-expert-notes.md`
