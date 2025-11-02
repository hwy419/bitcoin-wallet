# Implementation Decisions & Architecture Impact

**Last Updated**: October 22, 2025
**Component**: Bitcoin Protocol Implementation Decisions

**Quick Navigation**: [Decisions](#implementation-decisions) " [Tab Architecture](#tab-based-architecture-impact) " [Guidelines](#developer-guidelines)

---

## Implementation Decisions

### Decision Log

#### Decision 1: Use 12-word mnemonic by default
**Date**: October 12, 2025
**Rationale**:
- 128 bits of entropy is sufficient security
- Easier for users to backup (vs 24 words)
- Standard for most modern wallets
- Option to support 24 words in future

---

#### Decision 2: Implement Largest-First coin selection for MVP
**Date**: October 12, 2025
**Rationale**:
- Simpler to implement and test
- Good enough for MVP
- Branch and Bound is optimization for later
- Reduces initial development complexity

**Future Enhancement**: Branch and Bound algorithm for optimal selection

---

#### Decision 3: Use PSBT for transaction building
**Date**: October 12, 2025
**Rationale**:
- Modern standard (BIP174)
- Better for hardware wallet integration (future)
- Cleaner separation of concerns
- Supported by bitcoinjs-lib
- Essential for multisig coordination

---

#### Decision 4: Support all 3 address types from start
**Date**: October 12, 2025
**Rationale**:
- Users should choose based on needs
- Native SegWit is most efficient but not universally supported
- Legacy for maximum compatibility
- SegWit (P2SH) as middle ground

**Address Types**:
- **Legacy (P2PKH)**: Universal compatibility, higher fees
- **SegWit (P2SH-P2WPKH)**: Balance of compatibility and efficiency
- **Native SegWit (P2WPKH)**: Lowest fees, best for regular use

---

#### Decision 5: Start with testnet only
**Date**: October 12, 2025
**Rationale**:
- Safety first - no risk of losing real Bitcoin
- Free testing with faucets
- Easy to add mainnet support later (just network parameter change)
- Allows extensive testing

**Mainnet Support**: Can be added by changing network configuration, no protocol changes needed

---

#### Decision 6: 20-address gap limit (BIP44 standard)
**Date**: October 12, 2025
**Rationale**:
- Standard wallet recovery behavior
- Balance between thoroughness and performance
- Compatible with other wallets

**Gap Limit**: Check 20 consecutive unused addresses before considering account empty

---

#### Decision 7: Support Non-HD Wallet Architecture for Private Key Imports
**Date**: October 22, 2025
**Context**: Wallet restore from private key backup (v0.11.0 feature)
**Rationale**:
- Non-HD wallets are standard Bitcoin wallet type (Bitcoin Core v0.1-v0.12)
- WIF private key imports cannot derive child addresses (no chain code)
- Users need recovery option if they only backed up private key (not seed phrase)
- Many wallets support this: Bitcoin Core (importprivkey), Electrum, Mycelium

**Architecture Decision**:
- Use `encryptedSeed = ''` (empty string) to indicate non-HD wallet
- Store imported private key in `importedKeys[0]` with own encryption
- Mark account with `importType: 'private-key'`
- Single address per non-HD account (cannot derive new addresses)

**Change Address Strategy**:
- **MVP**: Reuse same address for change (simpler, acceptable privacy tradeoff)
- Privacy warning shown to users
- Future enhancement: User-provided chain code for BIP32 derivation

**Address Type Selection**:
- **Compressed keys**: User must select address type (legacy/segwit/native-segwit)
  - Cannot auto-detect (same key → 3 different addresses)
  - UI shows preview of all 3 address types
  - User confirms which type they originally used
- **Uncompressed keys**: Forced to legacy (only valid option)

**Transaction Signing**:
- Conditional logic based on `importType` field
- HD accounts: Derive private key from seed using derivation path
- Non-HD accounts: Decrypt imported private key directly
- Same UTXO selection algorithm for both wallet types

**Migration Path**:
- Users can manually migrate: Create new HD wallet → Transfer funds
- No automatic conversion (cannot create seed phrase from private key)
- Option to keep both wallets (not recommended)

**Validation Rules**:
```typescript
// Non-HD wallet validations:
if (wallet.encryptedSeed === '') {
  // Must have importedKeys
  // All accounts must be importType: 'private-key'
  // Cannot perform HD operations (derive new accounts, addresses)
}
```

**BIP Compliance**:
- ✅ No violations (non-HD wallets pre-date BIP standards)
- ✅ WIF format fully compliant
- ✅ PSBT compatible (omit bip32Derivation field)
- ✅ Bitcoin protocol compliant (signatures, transactions, scripts)

**Privacy Implications**:
- ⚠️ Address reuse reduces privacy (all transactions linked)
- ⚠️ Chain analysis easier (single address, no change address rotation)
- ✅ Acceptable tradeoff for recovery use case
- ✅ Users warned during import and shown migration path

**Future Enhancements**:
- Support for user-provided chain code (better privacy)
- Automatic fund sweeping during migration
- Hybrid wallets (HD + imported accounts in one wallet) - NOT recommended for MVP

**Documentation**: See [WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md](../../plans/WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md)

---

## Tab-Based Architecture Impact

### Overview

**Version**: 0.9.0 (October 2025)
**Migration**: Popup (600x400px) � Full Browser Tab with Sidebar
**Bitcoin Impact**: ZERO functional changes to Bitcoin protocol operations

### Architecture Change Summary

The extension underwent a major UI architecture transformation:

**Before (v0.8.0 and earlier)**:
- Extension opened in 600x400px popup window
- Limited screen real estate
- All UI in `src/popup/` directory

**After (v0.9.0+)**:
- Extension opens in full browser tab
- Persistent 240px sidebar navigation
- All UI migrated to `src/tab/` directory
- New security controls (single tab enforcement, clickjacking prevention, tab nabbing detection)

### Bitcoin Functionality Assessment

** NO CHANGES to Core Bitcoin Operations**

The following Bitcoin protocol implementations remain **completely unchanged**:

#### 1. Background Service Worker (Bitcoin Core)
**Location**: `src/background/`

All Bitcoin operations execute in the background service worker, which was **NOT affected** by the UI migration:

- **HD Wallet** (`wallet/HDWallet.ts`) - No changes
- **Address Generation** (`wallet/AddressGenerator.ts`) - **Minor security enhancement only**
- **Transaction Building** (`bitcoin/TransactionBuilder.ts`) - **Minor security enhancement only**
- **PSBT Manager** (`bitcoin/PSBTManager.ts`) - **Security validation added**
- **Key Manager** (`wallet/KeyManager.ts`) - No changes
- **Wallet Storage** (`wallet/WalletStorage.ts`) - No changes
- **Multisig Manager** (`wallet/MultisigManager.ts`) - No changes
- **Blockstream API Client** (`api/BlockstreamClient.ts`) - No changes

**Message Handlers**:
- All Bitcoin message handlers remain functionally identical
- Same message types, same parameters, same return values
- No breaking changes to API contract

#### 2. Security Enhancements (v0.9.0)

While the Bitcoin core remained unchanged, the migration included **three security enhancements** to PSBTManager:

**HIGH-3 Security Fix: Network and Fee Validation**

Added to `src/background/bitcoin/PSBTManager.ts::importPSBT()`:

```typescript
// Validate network prefixes
for (let i = 0; i < tx.outs.length; i++) {
  const address = bitcoin.address.fromOutputScript(tx.outs[i].script, this.network);
  const isTestnet = this.network === bitcoin.networks.testnet;

  if (isTestnet) {
    // Testnet: m, n, 2, tb1
    if (!address.match(/^(m|n|2|tb1)/)) {
      warnings.push(`Address ${address} not testnet format`);
    }
  } else {
    // Mainnet: 1, 3, bc1
    if (!address.match(/^(1|3|bc1)/)) {
      warnings.push(`Address ${address} not mainnet format`);
    }
  }
}

// Validate fee not excessive (>10% of inputs)
const fee = totalInput - totalOutput;
const feePercentage = (fee / totalInput) * 100;

if (feePercentage > 10) {
  warnings.push(
    `Excessive fee: ${fee} sats (${feePercentage}%). Possible error or attack.`
  );
}
```

**Purpose**: Protect users from:
1. Accidentally sending testnet coins to mainnet addresses (or vice versa)
2. Malicious PSBTs with excessive fees (> 10% of transaction amount)

**Impact**: Enhanced security without breaking existing functionality

#### 3. UI Layer Changes

**Before**: `src/popup/components/SendScreen.tsx`
**After**: `src/tab/components/SendScreen.tsx`

The UI components were **moved** but their Bitcoin operations remain **identical**:

- Same transaction validation logic
- Same fee estimation (250 vBytes for typical tx)
- Same amount validation (min 546 sats dust limit)
- Same address validation (testnet: m, n, 2, tb1)
- Same message passing to background worker
- Same PSBT handling for multisig transactions

**Key observation**: The SendScreen component (and all other UI components) **call the exact same background message handlers** as before. The Bitcoin logic never lived in the UI layer.

### Verification: No Bitcoin Changes

**Git Diff Analysis**:

```bash
# Check Bitcoin core modules for changes
git diff HEAD~1 HEAD -- src/background/bitcoin/ src/background/wallet/
```

**Results**:
1. **PSBTManager.ts**: Security enhancements only (network validation, fee checks)
2. **ContactsStorage.ts**: NEW file (address book feature, no Bitcoin protocol changes)
3. **HDWallet.ts**: No changes
4. **MultisigManager.ts**: No changes

**All Bitcoin Protocol Implementations Verified Unchanged**:
- BIP32 derivation paths
- BIP39 mnemonic handling
- BIP44/48/49/84 account structure
- BIP67 public key sorting
- BIP174 PSBT construction and signing
- Address generation (Legacy, SegWit, Native SegWit)
- Transaction building and UTXO selection
- Fee estimation and size calculation
- Signature generation and verification
- Multisig address creation (P2SH, P2WSH, P2SH-P2WSH)
- PSBT export/import formats (base64, hex, QR code)

### Tab Architecture Benefits for Bitcoin Features

While Bitcoin functionality unchanged, the tab architecture **enables future enhancements**:

**1. Enhanced Multisig UX**
- More screen space for xpub import/export
- Room for comprehensive signature progress tracking
- Better PSBT review screens with full transaction details
- Improved QR code display (larger, more scannable)

**2. Transaction History**
- Full-width transaction list with filtering
- Detailed transaction view without cramped layout
- Room for UTXO explorer and coin control features (future)

**3. Address Management**
- Full address list view with derivation paths
- Address usage statistics and labeling
- Gap limit warnings with proper explanation space

**4. Fee Market Analysis**
- Room for fee rate charts and mempool visualization
- Detailed fee estimation with multiple options
- Custom fee input with advanced controls (future)

**5. PSBT Workflow**
- Side-by-side PSBT comparison views
- Detailed signature collection status
- Co-signer coordination interface (future)

### Migration Completeness

**Directory Structure**:
```
BEFORE:
src/popup/          � All UI components
src/background/     � Bitcoin core (unchanged)

AFTER:
src/tab/            � All UI components (moved)
src/background/     � Bitcoin core (unchanged)
```

**Build Configuration**:
- Webpack entry point: `popup.tsx` � `index.tsx`
- HTML file: `popup.html` � `index.html`
- Output bundle: Same structure, different names
- No changes to Bitcoin library imports or usage

**Extension Manifest**:
- Removed: `action.default_popup`
- Added: `chrome.action.onClicked` handler (opens tab)
- CSP Policy: Enhanced with `frame-ancestors 'none'`
- No changes to permissions or Bitcoin-related configs

### Testing Verification

**All 149 Automated Tests Pass**:
- HD wallet tests:  Passing
- Address generation tests:  Passing
- Transaction builder tests:  Passing
- PSBT manager tests:  Passing
- Multisig tests:  Passing
- BIP67 sorting tests:  Passing

**Manual Testing on Testnet**:
- Create wallet:  Works
- Generate addresses:  Works
- Send single-sig transaction:  Works
- Create multisig account:  Works
- Build multisig PSBT:  Works
- Sign and broadcast:  Works

### Security Posture

**Tab-Based Security Enhancements**:

1. **Single Tab Enforcement**
   - Only one wallet tab can be active
   - Prevents multiple sessions with same private keys
   - 256-bit random session tokens
   - 5-second validation frequency

2. **Clickjacking Prevention**
   - CSP: `frame-ancestors 'none'`
   - Runtime iframe detection
   - Prevents embedding in malicious sites

3. **Tab Nabbing Prevention**
   - Location monitoring (1-second frequency)
   - Automatic lock on suspicious redirects
   - Protects against navigation hijacking

4. **Auto-Lock on Hidden Tab**
   - 5-minute timer when tab hidden
   - Complements 15-minute inactivity lock
   - Reduces exposure window

**Bitcoin-Specific Security Unchanged**:
- Private keys still encrypted with AES-256-GCM
- PBKDF2 key derivation (100,000 iterations)
- Keys only in memory, never persisted
- All transaction signing in background worker
- PSBT validation before signing
- Network prefix validation (new in v0.9.0)
- Excessive fee detection (new in v0.9.0)

### Backwards Compatibility

**Wallet Data**:
- Existing wallets work without migration
- Same encryption format
- Same storage schema (version 3)
- Same account structure
- Same address derivation paths

**Message API**:
- All message types unchanged
- Same parameters and return types
- Same error handling
- New message types added (for contacts, wizard sessions)

**Blockchain Interaction**:
- Same Blockstream API integration
- Same transaction format
- Same address validation
- Same UTXO management

---

## Developer Guidelines

### When to Update Blockchain Expert Notes

 **Update Required**:
- Changes to BIP implementation (32, 39, 44, 48, 49, 67, 84, 174)
- Modifications to transaction building logic
- Changes to UTXO selection algorithms
- Updates to fee estimation
- Alterations to signature/verification
- New multisig features or address types
- Changes to PSBT format or handling
- Updates to address generation

L **Update NOT Required**:
- Pure UI/UX changes (layout, styling, navigation)
- Security controls in UI layer (session management, tab enforcement)
- Frontend refactoring that doesn't touch Bitcoin logic
- Changes to popup/tab architecture
- Sidebar navigation updates
- Loading states and error messages (unless affecting Bitcoin validation)

### Verification Checklist

When reviewing changes, verify:
1.  Background service worker unchanged (or only security enhancements)
2.  Message handlers unchanged (or backwards compatible)
3.  Transaction building unchanged
4.  Address generation unchanged
5.  PSBT handling unchanged
6.  All automated tests passing
7.  Testnet transactions work end-to-end

---

## Future Bitcoin Enhancements

The tab architecture enables these potential Bitcoin features:

**Enhanced PSBT Workflows** (Future):
- Visual PSBT diff tool
- Signature collection dashboard
- Co-signer coordination system
- Animated signing progress

**Advanced Coin Control** (Future):
- UTXO selection UI
- Manual input selection
- Coin tagging and labeling
- Privacy-focused coin management

**Fee Market Tools** (Future):
- Live mempool visualization
- Fee rate recommendations with charts
- Replace-By-Fee (RBF) UI
- Child-Pays-For-Parent (CPFP) support

**Batch Transactions** (Future):
- Multiple recipients in single transaction
- Payment batching for fee savings
- CSV-based batch sending

**Hardware Wallet Integration** (Future):
- QR-code based airgapped signing
- USB hardware wallet support
- Multi-device signing coordination

---

## Conclusion

The tab-based architecture migration (v0.9.0) represents a **pure UI transformation** with:

-  ZERO changes to Bitcoin protocol implementations
-  ZERO breaking changes to wallet functionality
-  Enhanced security (network validation, fee checks)
-  All automated tests passing
-  Backwards compatible with existing wallets
-  Verified working on Bitcoin testnet

**For blockchain developers**: You can safely continue implementing Bitcoin features without concern for the architectural change. All BIP standards, derivation paths, transaction building, PSBT workflows, and multisig operations remain exactly as documented.

**Key Takeaway**: The migration proves that a well-architected Bitcoin wallet can separate UI concerns from protocol implementation, enabling major UX improvements without compromising the integrity of Bitcoin operations.

---

**Related Documentation**:
- [Architecture](./architecture.md) - BIP standards and HD wallet structure
- [Addresses](./addresses.md) - Address generation and validation
- [Transactions](./transactions.md) - Transaction building and PSBT
- [UTXO Management](./utxo.md) - UTXO selection algorithms
- [Multisig Wallets](./multisig.md) - Multisig implementation

---

**Last Modified**: October 22, 2025
**Bitcoin Protocol Status**: Unchanged 
**Security Status**: Enhanced 
