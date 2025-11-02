# Blockchain Expert - Quick Reference

**Last Updated**: October 22, 2025
**Role**: Blockchain Expert
**Purpose**: Bitcoin protocol implementations, BIP standards, HD wallets, transactions

---

## Current Status

### Implemented ✅
- BIP39 mnemonic seed phrase generation & validation (12/24 words)
- BIP32 hierarchical deterministic wallet derivation
- BIP44/49/84 derivation paths for all address types
- BIP48 multisig derivation paths (2-of-2, 2-of-3, 3-of-5)
- BIP67 deterministic key sorting for multisig
- BIP174 PSBT (Partially Signed Bitcoin Transactions)
- Address generation: Legacy (P2PKH), SegWit (P2SH-P2WPKH), Native SegWit (P2WPKH)
- Multisig addresses: P2SH, P2WSH, P2SH-P2WSH
- Transaction building with PSBT
- UTXO management and coin selection
- Fee estimation (Blockstream API)
- WIF private key import/export
- Extended public key (xpub/ypub/zpub) import for multisig coordination

### In Progress ⏳
- Privacy enhancements (randomized UTXO selection, change address rotation)

### Planned 📋
- RBF (Replace-By-Fee) transaction replacement
- Advanced coin control UI
- Custom fee estimation algorithms
- Hardware wallet integration

---

## Documentation Map

### Core Architecture
- [**architecture.md**](./architecture.md) - BIP standards, HD wallet structure, derivation paths
- [**addresses.md**](./addresses.md) - Address generation, validation, all address types
- [**transactions.md**](./transactions.md) - Transaction building, signing, PSBT, fee estimation
- [**utxo.md**](./utxo.md) - UTXO selection algorithms, coin control
- [**multisig.md**](./multisig.md) - Multisig wallet implementation, PSBT coordination
- [**decisions.md**](./decisions.md) - Architectural Decision Records (ADRs)

---

## Recent Changes (Last 5)

1. **2025-10-29**: BIP39 compliance audit - APPROVED (full 2^128/2^256 entropy, protocol correctness 5/5)
2. **2025-10-22**: Non-HD wallet architecture for private key imports (wallet restore feature)
3. **2025-10-22**: Privacy audit and randomized UTXO selection implementation plan
4. **2025-10-18**: WIF private key export/import with encryption support
5. **2025-10-15**: BIP174 PSBT support for multisig coordination

---

## Quick Reference

### Derivation Paths (Testnet, coin type = 1)

**Single-Sig Accounts:**
```
Legacy (P2PKH):      m/44'/1'/account'/change/index
SegWit (P2SH-P2WPKH): m/49'/1'/account'/change/index
Native SegWit (P2WPKH): m/84'/1'/account'/change/index
```

**Multisig Accounts (BIP48):**
```
Format: m/48'/1'/account'/script_type'

Script types:
  1' = P2SH (Legacy multisig)
  2' = P2WSH (Native SegWit multisig)
  1' = P2SH-P2WSH (Wrapped SegWit multisig)

Then: /change/index for specific addresses
```

**Mainnet:** Replace coin type `1'` with `0'`

### Address Prefixes (Testnet)

| Type | Prefix | Example |
|------|--------|---------|
| Legacy | m, n | `mzBc4XEFSdzCDcTx...` |
| SegWit | 2 | `2MzQwSSnBHWH...` |
| Native SegWit | tb1 | `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx` |

**Mainnet:** 1, 3, bc1

### Transaction Size Estimation

```
Legacy P2PKH:
  Input: ~148 vbytes
  Output: ~34 vbytes

SegWit P2WPKH:
  Input: ~68 vbytes (witness discount)
  Output: ~31 vbytes

Formula: (inputs × input_size) + (outputs × output_size) + 10
```

### UTXO Selection

**Current Algorithm:** Largest-first with randomization
- Sorts UTXOs by value (descending)
- Randomizes top 50% for privacy
- Selects until target + fee is met
- Minimizes change output when possible

See [utxo.md](./utxo.md#selection-algorithm) for details.

---

## Critical Implementation Files

| File | Purpose |
|------|---------|
| `src/background/wallet/KeyManager.ts` | HD wallet, key derivation |
| `src/background/bitcoin/TransactionBuilder.ts` | Transaction construction |
| `src/background/bitcoin/AddressGenerator.ts` | Address generation |
| `src/background/bitcoin/PSBTManager.ts` | PSBT creation & signing |
| `src/background/bitcoin/XpubValidator.ts` | Extended key validation |

---

## Testing

**Test Coverage:** 85% (target: 90%)

**Key Test Files:**
- `src/background/wallet/__tests__/KeyManager.test.ts`
- `src/background/bitcoin/__tests__/TransactionBuilder.test.ts`
- `src/background/bitcoin/__tests__/PSBTManager.test.ts`

**BIP Test Vectors:** All tests use official BIP39/32/44 test vectors

**Latest Audit:** BIP39 Compliance Audit (Oct 29, 2025) - ✅ APPROVED
- See: `prompts/docs/plans/BIP39_COMPLIANCE_AUDIT_REPORT.md`
- Verdict: Full protocol compliance, 5/5 rating, production-ready

---

## External Resources

- [BIP39 Spec](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP32 Spec](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP44 Spec](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [BIP48 Spec](https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki)
- [BIP174 (PSBT) Spec](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki)
- [Blockstream Testnet API](https://blockstream.info/testnet/api)

---

## Next Steps

1. Complete privacy enhancement implementation (see [PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md](../../plans/PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md))
2. Implement change address rotation
3. Add coin control UI for advanced users
4. Research RBF implementation

---

**Need detailed information?** Navigate to the specific documentation files linked above.

**Making changes?** Update the relevant segmented file AND this index's "Recent Changes" section.
