# Bitcoin Privacy Enhancement - Backend Implementation Plan

**Version:** 1.0
**Created:** October 21, 2025
**Status:** Implementation-Ready
**Owner:** Backend Developer
**Related Documents:**
- `BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md` - Technical overview
- `PRIVACY_ENHANCEMENT_PRD.md` - Product requirements
- `PRIVACY_AUDIT_REPORT.md` - Blockchain Expert audit findings
- `PRIVACY_UI_UX_DESIGN_SPEC.md` - UI/UX design specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Phase 2: Critical Privacy Fixes](#phase-2-critical-privacy-fixes)
4. [Phase 3: Optional Privacy Mode Settings](#phase-3-optional-privacy-mode-settings)
5. [Message Handler Specifications](#message-handler-specifications)
6. [Storage Schema Updates](#storage-schema-updates)
7. [Testing Strategy](#testing-strategy)
8. [Migration Plan](#migration-plan)
9. [Implementation Checklist](#implementation-checklist)
10. [Dependencies and Risks](#dependencies-and-risks)

---

## Executive Summary

### Backend Implementation Scope

This plan covers **all backend/service worker changes** required to implement privacy enhancements for the Bitcoin wallet. The frontend team will handle UI components separately based on the design specification.

### Critical Changes (P0 - Must Fix)

1. **Fix Change Address Reuse** - Lines 1766 & 2147 in `src/background/index.ts`
2. **Fix Contacts Address Reuse Tracking** - Add `lastUsedAddressIndex` and `reusageCount` to Contact type
3. **Contacts Privacy Backend** - Track contact usage, support rotation

### High Priority Changes (P1)

4. **Randomized UTXO Selection** - Replace greedy with Fisher-Yates shuffle in `TransactionBuilder.ts`
5. **Support Auto-Generation** - Ensure `handleGenerateAddress` works efficiently for repeated calls

### Optional Changes (P2 - Phase 3)

6. **Privacy Settings Storage** - Store and retrieve `PrivacySettings`
7. **Round Number Randomization** - Create `PrivacyUtils` module
8. **API Timing Delays** - Update `BlockstreamClient` with privacy mode
9. **Broadcast Delays** - Add delayed broadcast support

### Implementation Timeline

- **Phase 2 (P0 + P1):** 7 days development + 3 days testing = **10 days total**
- **Phase 3 (Optional Features):** 5 days development + 2 days testing = **7 days total**
- **Total:** 17 days (~3.5 weeks)

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Background Service Worker                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Message Handlers                       │  │
│  │  (src/background/index.ts)                                │  │
│  │                                                           │  │
│  │  • handleSendTransaction (MODIFIED - change address)     │  │
│  │  • handleBuildMultisigTransaction (MODIFIED - change)    │  │
│  │  • handleGenerateAddress (REVIEW - already works)        │  │
│  │  • handleGetPrivacySettings (NEW)                        │  │
│  │  • handleUpdatePrivacySettings (NEW)                     │  │
│  │  • handleGetNextContactAddress (NEW)                     │  │
│  │  • handleIncrementContactUsage (NEW)                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Transaction Builder Module                   │  │
│  │  (src/background/bitcoin/TransactionBuilder.ts)           │  │
│  │                                                           │  │
│  │  • selectUTXOs() - MODIFIED (randomized selection)       │  │
│  │  • selectUTXOsGreedy() - NEW (fallback)                  │  │
│  │  • shuffleArray() - NEW (Fisher-Yates)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Privacy Utils Module                     │  │
│  │  (src/background/privacy/PrivacyUtils.ts) - NEW           │  │
│  │                                                           │  │
│  │  • detectRoundNumber() - Phase 3                         │  │
│  │  • randomizeAmount() - Phase 3                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Blockstream API Client                       │  │
│  │  (src/background/api/BlockstreamClient.ts)                │  │
│  │                                                           │  │
│  │  • getUTXOs() - MODIFIED (privacy mode delays)           │  │
│  │  • broadcastTransaction() - MODIFIED (optional delay)    │  │
│  │  • delayBetweenRequests() - NEW (Phase 3)                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Wallet Storage                           │  │
│  │  (chrome.storage.local)                                   │  │
│  │                                                           │  │
│  │  • wallet.accounts[].internalIndex - INCREMENTED          │  │
│  │  • contacts[].lastUsedAddressIndex - NEW                 │  │
│  │  • contacts[].reusageCount - NEW                         │  │
│  │  • privacySettings - NEW (Phase 3)                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow - Send Transaction (Enhanced)

```
┌──────────────┐
│   Frontend   │
│  SendScreen  │
└──────┬───────┘
       │
       │ chrome.runtime.sendMessage({ type: 'SEND_TRANSACTION', ... })
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    handleSendTransaction                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Get wallet state & account                                  │
│  2. Get all external addresses                                  │
│  3. Fetch UTXOs from Blockstream API                            │
│     (PHASE 3: Apply privacy timing delays if enabled)           │
│                                                                  │
│  4. ⚠️ CRITICAL FIX: Generate change address                     │
│     OLD: const changeAddress = account.addresses[0].address     │
│     NEW: const changeAddress = await getOrGenerateChangeAddress │
│                                                                  │
│  5. Build transaction with TransactionBuilder                   │
│     • selectUTXOs() - NOW RANDOMIZED (Phase 2)                  │
│     • buildTransaction() - sign inputs                          │
│                                                                  │
│  6. Broadcast transaction                                       │
│     (PHASE 3: Apply broadcast delay if enabled)                 │
│                                                                  │
│  7. Save wallet state (internal index incremented)              │
│                                                                  │
│  8. Return { success: true, txid, fee, size }                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow - Contact Address Rotation

```
┌──────────────┐
│   Frontend   │
│  SendScreen  │
└──────┬───────┘
       │
       │ User selects xpub contact "Alice"
       │
       │ chrome.runtime.sendMessage({ type: 'GET_NEXT_CONTACT_ADDRESS', contactId: '...' })
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│              handleGetNextContactAddress                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Get contact from contacts array                             │
│  2. Verify contact has xpub and cachedAddresses                 │
│  3. Get next index: (lastUsedAddressIndex ?? -1) + 1            │
│  4. Check if index < cachedAddresses.length                     │
│     • If yes: return cachedAddresses[index]                     │
│     • If no: return error (cache exhausted)                     │
│  5. Return { address, addressIndex }                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
       │
       │ Frontend shows address in SendScreen
       │
       │ User confirms send
       │
       │ chrome.runtime.sendMessage({ type: 'SEND_TRANSACTION', ... })
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  handleSendTransaction                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Normal send transaction flow...]                              │
│                                                                  │
│  AFTER successful broadcast:                                    │
│                                                                  │
│  • If recipientContactId provided:                              │
│    - Increment contact.lastUsedAddressIndex OR                  │
│    - Increment contact.reusageCount (single-address contact)    │
│    - Save contacts to storage                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Critical Privacy Fixes

### 2.1 Fix Change Address Reuse (P0 - CRITICAL)

**Issue:** Lines 1766 and 2147 in `src/background/index.ts` hardcode change address to `account.addresses[0].address`, causing 100% transaction linkability.

**Files to Modify:**
- `src/background/index.ts`

---

#### Implementation: Change Address Helper Function

**Location:** `src/background/index.ts` (add near top, after imports)

```typescript
/**
 * Generate or get next change address for an account.
 * Uses BIP44 internal chain (m/.../1/index).
 *
 * PRIVACY: Every transaction must use a UNIQUE change address to prevent
 * transaction linking and wallet graph reconstruction.
 *
 * @param accountIndex - Index of account
 * @returns Change address for this transaction
 * @throws Error if generation fails
 */
async function getOrGenerateChangeAddress(accountIndex: number): Promise<string> {
  try {
    // Generate next internal (change) address
    const response = await handleGenerateAddress({
      accountIndex,
      isChange: true,  // ✅ Use internal chain (m/.../1/index)
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to generate change address');
    }

    console.log(`Generated change address for account ${accountIndex}: ${response.data.address}`);

    return response.data.address;
  } catch (error) {
    console.error('Error generating change address:', error);
    throw new Error(`Failed to generate change address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

---

#### Update handleSendTransaction (Single-Sig)

**Location:** `src/background/index.ts`, line ~1766

**BEFORE:**
```typescript
// Get change address (use first address)
const changeAddress = account.addresses[0].address;
```

**AFTER:**
```typescript
// PRIVACY FIX: Generate unique change address for this transaction
// Uses internal chain (m/.../1/x) to prevent transaction linking
const changeAddress = await getOrGenerateChangeAddress(accountIndex);
```

**Full Context (lines 1750-1805):**

```typescript
async function handleSendTransaction(payload: {
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
}): Promise<MessageResponse> {
  try {
    const { accountIndex, toAddress, amount, feeRate } = payload;

    // Validate inputs
    if (!state.isUnlocked || !state.hdWallet) {
      return { success: false, error: 'Wallet is locked' };
    }

    // Validate account
    const account = state.accounts[accountIndex];
    if (!account) {
      return { success: false, error: 'Account not found' };
    }

    // Verify single-sig account
    if (account.type === 'multisig') {
      return {
        success: false,
        error: 'Use BUILD_MULTISIG_TRANSACTION for multisig accounts',
      };
    }

    // Get all external addresses (receiving addresses)
    const addresses = account.addresses
      .filter(addr => !addr.isChange)
      .map(addr => addr.address);

    console.log(`Fetching UTXOs for ${addresses.length} addresses...`);
    const utxoArrays = await Promise.all(
      addresses.map(addr => blockstreamClient.getUTXOs(addr))
    );
    const allUtxos = utxoArrays.flat();

    console.log(`Found ${allUtxos.length} UTXOs`);

    if (allUtxos.length === 0) {
      return {
        success: false,
        error: 'No UTXOs available for spending',
      };
    }

    // PRIVACY FIX: Generate unique change address for this transaction
    // Uses internal chain (m/.../1/x) to prevent transaction linking
    const changeAddress = await getOrGenerateChangeAddress(accountIndex);

    // Build and sign transaction
    console.log(`Building transaction: ${amount} sats to ${toAddress}, fee rate: ${feeRate} sat/vB`);
    console.log(`Change address: ${changeAddress} (internal chain)`);

    // Track private key buffers for cleanup
    const privateKeyBuffers: Buffer[] = [];

    try {
      const result = await transactionBuilder.buildTransaction({
        utxos: allUtxos,
        outputs: [{ address: toAddress, amount }],
        changeAddress,
        feeRate,
        getPrivateKey: (derivationPath: string) => {
          // Derive private key from HD wallet
          const node = state.hdWallet!.derivePath(derivationPath);
          if (!node.privateKey) {
            throw new Error(`Failed to derive private key for path: ${derivationPath}`);
          }
          // Track for cleanup
          privateKeyBuffers.push(node.privateKey);
          return node.privateKey;
        },
        getAddressType: (address: string) => {
          // All addresses in the account use the same address type
          return account.addressType as AddressType;
        },
        getDerivationPath: (address: string) => {
          // Find derivation path for address
          const addrObj = account.addresses.find(a => a.address === address);
          if (!addrObj) {
            throw new Error(`Address ${address} not found in account`);
          }
          return addrObj.derivationPath;
        },
      });

      console.log(`Transaction built successfully: ${result.txid}, fee: ${result.fee} sats`);

      // Broadcast transaction
      console.log('Broadcasting transaction...');
      const txid = await blockstreamClient.broadcastTransaction(result.txHex);

      console.log(`Transaction broadcast successful: ${txid}`);

      return {
        success: true,
        data: {
          txid,
          fee: result.fee,
          size: result.virtualSize,
        },
      };
    } finally {
      // SECURITY: Clear private keys from memory
      for (const keyBuffer of privateKeyBuffers) {
        if (keyBuffer) {
          keyBuffer.fill(0);
        }
      }
      privateKeyBuffers.length = 0;
    }
  } catch (error) {
    console.error('Failed to send transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send transaction',
    };
  }
}
```

---

#### Update handleBuildMultisigTransaction

**Location:** `src/background/index.ts`, line ~2147

**BEFORE:**
```typescript
// Get change address (use first address)
const changeAddress = multisigAccount.addresses[0].address;
```

**AFTER:**
```typescript
// PRIVACY FIX: Generate unique change address for this transaction
// Uses internal chain (m/.../1/x) to prevent transaction linking
const changeAddress = await getOrGenerateChangeAddress(accountIndex);
```

**Full Context (lines 2130-2180):**

```typescript
async function handleBuildMultisigTransaction(payload: {
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
}): Promise<MessageResponse> {
  try {
    const { accountIndex, toAddress, amount, feeRate } = payload;

    // Validate inputs
    if (!state.isUnlocked || !state.hdWallet) {
      return { success: false, error: 'Wallet is locked' };
    }

    // Validate account
    const multisigAccount = state.accounts[accountIndex];
    if (!multisigAccount) {
      return { success: false, error: 'Account not found' };
    }

    // Verify multisig account
    if (multisigAccount.type !== 'multisig') {
      return {
        success: false,
        error: 'Use SEND_TRANSACTION for single-sig accounts',
      };
    }

    // Get all external addresses
    const addresses = multisigAccount.addresses
      .filter(addr => !addr.isChange)
      .map(addr => addr.address);

    // Fetch UTXOs for all addresses
    console.log(`Fetching UTXOs for ${addresses.length} multisig addresses...`);
    const utxoArrays = await Promise.all(
      addresses.map(addr => blockstreamClient.getUTXOs(addr))
    );
    const allUtxos = utxoArrays.flat();

    console.log(`Found ${allUtxos.length} UTXOs`);

    if (allUtxos.length === 0) {
      return {
        success: false,
        error: 'No UTXOs available for spending',
      };
    }

    // PRIVACY FIX: Generate unique change address for this transaction
    // Uses internal chain (m/.../1/x) for multisig (BIP48)
    const changeAddress = await getOrGenerateChangeAddress(accountIndex);

    // Get M and N from config
    const configDetails = multisigManager.getConfigDetails(multisigAccount.multisigConfig);

    // Build unsigned PSBT
    console.log(`Building multisig transaction: ${amount} sats to ${toAddress}, fee rate: ${feeRate} sat/vB`);
    console.log(`Change address: ${changeAddress} (internal chain)`);

    const psbt = await transactionBuilder.buildMultisigPSBT({
      multisigAddresses: multisigAccount.addresses,
      utxos: allUtxos,
      outputs: [{ address: toAddress, amount }],
      changeAddress,
      feeRate,
      m: configDetails.m,
      n: configDetails.n,
      addressType: multisigAccount.addressType,
    });

    // Export PSBT
    const exported = psbtManager.exportPSBT(psbt);

    console.log(`Built multisig PSBT: ${exported.txid}, fee: ${exported.fee} sats`);

    return {
      success: true,
      data: {
        psbtBase64: exported.base64,
        txid: exported.txid,
      },
    };
  } catch (error) {
    console.error('Failed to build multisig transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build multisig transaction',
    };
  }
}
```

---

#### Testing Requirements

**Unit Tests:**

```typescript
// src/background/__tests__/privacy-change-address.test.ts

describe('Change Address Privacy', () => {
  it('should generate unique change address for each transaction', async () => {
    const changeAddresses: string[] = [];

    // Simulate 10 transactions
    for (let i = 0; i < 10; i++) {
      const changeAddr = await getOrGenerateChangeAddress(0);
      changeAddresses.push(changeAddr);
    }

    // Verify all addresses are unique
    const uniqueAddresses = new Set(changeAddresses);
    expect(uniqueAddresses.size).toBe(10);
  });

  it('should use internal chain for change addresses', async () => {
    const changeAddr = await getOrGenerateChangeAddress(0);
    const account = state.accounts[0];

    // Find address in internal addresses
    const addrObj = account.addresses.find(a => a.address === changeAddr && a.isChange);
    expect(addrObj).toBeDefined();
    expect(addrObj?.isChange).toBe(true);

    // Verify derivation path uses internal chain (1)
    expect(addrObj?.derivationPath).toMatch(/\/1\/\d+$/);
  });

  it('should increment internalIndex after generating change address', async () => {
    const account = state.accounts[0];
    const initialIndex = account.internalIndex || 0;

    await getOrGenerateChangeAddress(0);

    expect(account.internalIndex).toBe(initialIndex + 1);
  });

  it('should work for multisig accounts (BIP48)', async () => {
    // Create multisig account
    const multisigAccountIndex = await createMultisigAccount();

    const changeAddr = await getOrGenerateChangeAddress(multisigAccountIndex);
    const account = state.accounts[multisigAccountIndex];

    // Verify multisig change address
    const addrObj = account.addresses.find(a => a.address === changeAddr && a.isChange);
    expect(addrObj).toBeDefined();
    expect(addrObj?.derivationPath).toMatch(/^m\/48'\/1'\/\d+'\/\d+'\/1\/\d+$/);
  });
});
```

**Integration Tests:**

```typescript
describe('Send Transaction Privacy Integration', () => {
  it('should use unique change addresses in actual transactions', async () => {
    // Send 3 transactions
    const tx1 = await handleSendTransaction({
      accountIndex: 0,
      toAddress: 'tb1q...',
      amount: 10000,
      feeRate: 1,
    });

    const tx2 = await handleSendTransaction({
      accountIndex: 0,
      toAddress: 'tb1q...',
      amount: 20000,
      feeRate: 1,
    });

    const tx3 = await handleSendTransaction({
      accountIndex: 0,
      toAddress: 'tb1q...',
      amount: 30000,
      feeRate: 1,
    });

    // Extract change addresses from built transactions
    // (Would need to mock TransactionBuilder to capture change addresses)
    const changeAddresses = [
      extractChangeAddress(tx1.data.txid),
      extractChangeAddress(tx2.data.txid),
      extractChangeAddress(tx3.data.txid),
    ];

    // Verify all unique
    const uniqueAddresses = new Set(changeAddresses);
    expect(uniqueAddresses.size).toBe(3);
  });
});
```

**Testnet Validation:**

```bash
# Manual testnet testing steps:
1. Send 3 real testnet transactions
2. Use Blockstream explorer to view transaction details
3. Identify change outputs (non-recipient outputs)
4. Verify:
   - All 3 change addresses are different
   - Change addresses are NOT in the external receive address list
   - Change addresses use internal chain (check derivation path if visible)
```

---

### 2.2 Randomized UTXO Selection (P1 - HIGH)

**Issue:** Line 289 in `src/background/bitcoin/TransactionBuilder.ts` uses greedy (largest-first) selection, creating 0% entropy and enabling wallet fingerprinting.

**Files to Modify:**
- `src/background/bitcoin/TransactionBuilder.ts`

---

#### Implementation: Fisher-Yates Shuffle

**Location:** `src/background/bitcoin/TransactionBuilder.ts`, add helper function

```typescript
/**
 * Fisher-Yates shuffle - Unbiased random array shuffle.
 *
 * PRIVACY: Randomizing UTXO order prevents wallet fingerprinting through
 * predictable selection patterns. Achieves 50-70% of theoretical maximum
 * entropy.
 *
 * Time complexity: O(n)
 * Space complexity: O(1) (in-place shuffle)
 *
 * @param array - Array to shuffle (mutated in-place)
 * @returns The shuffled array (same reference)
 */
private shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    // Random index from 0 to i (inclusive)
    const j = Math.floor(Math.random() * (i + 1));

    // Swap elements
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}
```

---

#### Update selectUTXOs Method

**Location:** `src/background/bitcoin/TransactionBuilder.ts`, line ~274-350

**BEFORE:**
```typescript
// Sort by value (largest first) for greedy selection
const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
```

**AFTER:**
```typescript
// PRIVACY: Randomize UTXO order to prevent fingerprinting
// Fisher-Yates shuffle provides uniform distribution
const shuffledUtxos = this.shuffleArray([...utxos]);
```

**Full Updated Method:**

```typescript
/**
 * Select UTXOs to cover target amount + fees.
 *
 * PRIVACY ENHANCEMENT: Uses randomized selection (Fisher-Yates shuffle)
 * instead of greedy (largest-first) to prevent wallet fingerprinting.
 *
 * Achieves 50-70% of theoretical maximum entropy while maintaining
 * efficiency and respecting dust limits.
 *
 * Algorithm:
 * 1. Shuffle UTXOs randomly
 * 2. Select in randomized order until target met
 * 3. Estimate fees dynamically as inputs are added
 * 4. Return selection with sufficient funds for target + fees + change
 *
 * Fallback: If randomization fails (rare edge case), falls back to greedy.
 *
 * @param params - UTXO selection parameters
 * @returns Selected UTXOs, fee, and change amount
 * @throws {Error} If insufficient funds
 */
selectUTXOs(params: {
  utxos: SelectedUTXO[];
  targetAmount: number;
  feeRate: number;
  changeAddress: string;
}): UTXOSelectionResult {
  try {
    const { utxos, targetAmount, feeRate, changeAddress } = params;

    // Validate we have UTXOs
    if (!utxos || utxos.length === 0) {
      throw new Error('No UTXOs available');
    }

    // PRIVACY: Randomize UTXO order to prevent fingerprinting
    // Fisher-Yates shuffle provides uniform distribution
    const shuffledUtxos = this.shuffleArray([...utxos]);

    const selected: SelectedUTXO[] = [];
    let totalInput = 0;

    // Determine change address type
    const changeAddressType = this.addressGenerator.getAddressType(changeAddress);
    if (!changeAddressType) {
      throw new Error('Invalid change address type');
    }

    // Iteratively select UTXOs in randomized order
    for (const utxo of shuffledUtxos) {
      selected.push(utxo);
      totalInput += utxo.value;

      // Estimate transaction size with current inputs
      // Try with 2 outputs (recipient + change)
      const sizeWithChange = this.estimateSize({
        numInputs: selected.length,
        numOutputs: 2,
        inputTypes: selected.map((u) => u.addressType),
      });

      const feeWithChange = Math.ceil(sizeWithChange.virtualSize * feeRate);
      const changeWithChange = totalInput - targetAmount - feeWithChange;

      // If change is above dust threshold, we're done
      if (changeWithChange >= DUST_THRESHOLD) {
        console.log(`UTXO selection: ${selected.length} inputs (randomized), fee: ${feeWithChange} sats, change: ${changeWithChange} sats`);
        return {
          selectedUtxos: selected,
          totalInput,
          fee: feeWithChange,
          change: changeWithChange,
        };
      }

      // Try with 1 output (no change) if change would be dust
      const sizeNoChange = this.estimateSize({
        numInputs: selected.length,
        numOutputs: 1,
        inputTypes: selected.map((u) => u.addressType),
      });

      const feeNoChange = Math.ceil(sizeNoChange.virtualSize * feeRate);
      const changeNoChange = totalInput - targetAmount - feeNoChange;

      // If we have exact amount (no change needed), we're done
      if (changeNoChange >= 0 && changeNoChange < DUST_THRESHOLD) {
        console.log(`UTXO selection: ${selected.length} inputs (randomized, no change), fee: ${feeNoChange} sats`);
        return {
          selectedUtxos: selected,
          totalInput,
          fee: feeNoChange,
          change: 0,
        };
      }
    }

    // If we got here, we don't have enough funds
    throw new Error(
      `Insufficient funds. Have ${totalInput} sats, need ${targetAmount + Math.ceil(this.estimateSize({
        numInputs: selected.length,
        numOutputs: 2,
        inputTypes: selected.map((u) => u.addressType),
      }).virtualSize * feeRate)} sats (including fees)`
    );
  } catch (error) {
    // Log error but don't expose internal details
    console.error('UTXO selection failed:', error);
    throw error;
  }
}
```

---

#### Add Greedy Fallback (Optional)

**If randomization consistently fails in edge cases, add greedy fallback:**

```typescript
/**
 * Greedy UTXO selection (largest first).
 *
 * FALLBACK ONLY: Used if randomized selection fails.
 * Should be rare (<1% of transactions).
 *
 * @param params - UTXO selection parameters
 * @returns Selected UTXOs, fee, and change amount
 */
private selectUTXOsGreedy(params: {
  utxos: SelectedUTXO[];
  targetAmount: number;
  feeRate: number;
  changeAddress: string;
}): UTXOSelectionResult {
  const { utxos, targetAmount, feeRate, changeAddress } = params;

  // Sort by value (largest first)
  const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);

  // [Same logic as randomized, but with sorted UTXOs]
  // ...

  console.warn('Used greedy UTXO selection fallback (privacy reduced)');
  return result;
}
```

**Usage in selectUTXOs:**

```typescript
selectUTXOs(params: ...): UTXOSelectionResult {
  try {
    // Try randomized selection
    return this.selectUTXOsRandomized(params);
  } catch (error) {
    // Fallback to greedy if randomization fails
    console.warn('Randomized selection failed, falling back to greedy:', error);
    return this.selectUTXOsGreedy(params);
  }
}
```

**Note:** Greedy fallback is optional. If randomized selection has same success rate as greedy, fallback is unnecessary.

---

#### Testing Requirements

**Unit Tests:**

```typescript
// src/background/bitcoin/__tests__/utxo-selection-privacy.test.ts

describe('UTXO Selection Privacy', () => {
  it('should produce non-deterministic selection', () => {
    const utxos = createTestUTXOs(10); // 10 test UTXOs
    const params = {
      utxos,
      targetAmount: 50000,
      feeRate: 1,
      changeAddress: 'tb1q...',
    };

    const selections: string[] = [];

    // Run selection 100 times
    for (let i = 0; i < 100; i++) {
      const result = transactionBuilder.selectUTXOs(params);

      // Create unique signature of selected UTXOs
      const signature = result.selectedUtxos
        .map(u => u.txid)
        .sort()
        .join(',');

      selections.push(signature);
    }

    // Count unique selections
    const uniqueSelections = new Set(selections);

    // Expect significant variation (>10% of runs produce different results)
    expect(uniqueSelections.size).toBeGreaterThan(10);
  });

  it('should achieve >50% entropy', () => {
    const utxos = createTestUTXOs(10);
    const params = {
      utxos,
      targetAmount: 50000,
      feeRate: 1,
      changeAddress: 'tb1q...',
    };

    const selectionCounts = new Map<string, number>();
    const runs = 1000;

    // Run selection 1000 times
    for (let i = 0; i < runs; i++) {
      const result = transactionBuilder.selectUTXOs(params);
      const key = result.selectedUtxos.map(u => u.txid).sort().join(',');
      selectionCounts.set(key, (selectionCounts.get(key) || 0) + 1);
    }

    // Calculate Shannon entropy
    let entropy = 0;
    selectionCounts.forEach(count => {
      const p = count / runs;
      entropy -= p * Math.log2(p);
    });

    // Calculate theoretical maximum entropy
    const theoreticalMax = Math.log2(selectionCounts.size);
    const entropyPercent = (entropy / theoreticalMax) * 100;

    console.log(`UTXO Selection Entropy: ${entropyPercent.toFixed(2)}% of theoretical maximum`);
    expect(entropyPercent).toBeGreaterThan(50);
  });

  it('should still select sufficient UTXOs despite randomization', () => {
    const utxos = createTestUTXOs(10);
    const params = {
      utxos,
      targetAmount: 50000,
      feeRate: 1,
      changeAddress: 'tb1q...',
    };

    // Run 100 times to ensure consistency
    for (let i = 0; i < 100; i++) {
      const result = transactionBuilder.selectUTXOs(params);

      // Verify sufficient funds
      expect(result.totalInput).toBeGreaterThanOrEqual(params.targetAmount + result.fee);

      // Verify change is either 0 or above dust
      expect(result.change === 0 || result.change >= DUST_THRESHOLD).toBe(true);
    }
  });

  it('should respect dust limit', () => {
    const utxos = createTestUTXOs(10);
    const params = {
      utxos,
      targetAmount: 50000,
      feeRate: 1,
      changeAddress: 'tb1q...',
    };

    const result = transactionBuilder.selectUTXOs(params);

    // Change should never be between 1 and DUST_THRESHOLD-1
    if (result.change > 0) {
      expect(result.change).toBeGreaterThanOrEqual(DUST_THRESHOLD);
    }
  });
});

describe('Fisher-Yates Shuffle', () => {
  it('should shuffle array uniformly', () => {
    const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const positions = new Map<number, number[]>();

    // Track positions of each element across 10000 shuffles
    for (let run = 0; run < 10000; run++) {
      const shuffled = transactionBuilder['shuffleArray']([...array]);

      shuffled.forEach((value, index) => {
        if (!positions.has(value)) {
          positions.set(value, []);
        }
        positions.get(value)!.push(index);
      });
    }

    // Each element should appear in each position roughly 1000 times (10000 / 10)
    // Allow 20% deviation (800-1200)
    positions.forEach((indices, value) => {
      const distribution = new Array(array.length).fill(0);
      indices.forEach(idx => distribution[idx]++);

      distribution.forEach(count => {
        expect(count).toBeGreaterThan(800);
        expect(count).toBeLessThan(1200);
      });
    });
  });
});
```

---

### 2.3 Contacts Privacy Backend (P0 - CRITICAL)

**Issue:** Contact type lacks `lastUsedAddressIndex` and `reusageCount` fields, preventing address rotation tracking and privacy warnings.

**Files to Modify:**
- `src/shared/types/index.ts`
- `src/background/index.ts` (add message handlers)

---

#### Update Contact Type

**Location:** `src/shared/types/index.ts`, line ~211-239

**ADD after line 226 (after `addressesLastUpdated`):**

```typescript
// Privacy Tracking (Optional)
lastUsedAddressIndex?: number;          // For xpub contacts: tracks last used cached address index (PLAINTEXT)
reusageCount?: number;                  // For single-address contacts: counts sends to same address (PLAINTEXT)
```

**Full Updated Interface:**

```typescript
// Contact v2.0 - Enhanced with encryption and xpub support
export interface Contact {
  // Core Fields (Required)
  id: string;                             // UUID v4
  name: string;                           // 1-50 chars (ENCRYPTED)
  createdAt: number;                      // Unix timestamp ms
  updatedAt: number;                      // Unix timestamp ms

  // Address Fields (At least ONE required: address OR xpub)
  address?: string;                       // Single Bitcoin address (PLAINTEXT)
  addressType?: AddressType | MultisigAddressType; // Detected type (PLAINTEXT)

  xpub?: string;                          // Extended public key (ENCRYPTED)
  xpubFingerprint?: string;               // 8-char hex fingerprint (PLAINTEXT)
  xpubDerivationPath?: string;            // e.g., "m/48'/1'/0'/2'" (PLAINTEXT)
  cachedAddresses?: string[];             // First 20-100 derived addresses (PLAINTEXT)
  addressesLastUpdated?: number;          // Unix timestamp of last address cache update (PLAINTEXT)

  // Privacy Tracking (Optional)
  lastUsedAddressIndex?: number;          // For xpub contacts: tracks last used cached address index (PLAINTEXT)
  reusageCount?: number;                  // For single-address contacts: counts sends to same address (PLAINTEXT)

  // Enhanced Fields (Optional)
  email?: string;                         // Email address, 0-100 chars (ENCRYPTED)
  notes?: string;                         // Notes, max 500 chars (ENCRYPTED)
  category?: string;                      // Category, max 30 chars (ENCRYPTED)

  // Visual Customization (Optional)
  color?: ContactColor;                   // Contact color (ENCRYPTED)

  // Analytics (Optional)
  transactionCount?: number;              // Cached transaction count (PLAINTEXT)
  lastTransactionDate?: number;           // Unix timestamp of last tx (PLAINTEXT)
}
```

---

#### Add Message Handler: GET_NEXT_CONTACT_ADDRESS

**Location:** `src/background/index.ts`, add new handler function

```typescript
/**
 * GET_NEXT_CONTACT_ADDRESS - Get next unused address for xpub contact.
 *
 * PRIVACY: For xpub contacts, automatically rotates through cached addresses
 * to prevent address reuse. Increments lastUsedAddressIndex.
 *
 * Payload: { contactId: string }
 * Returns: { address: string, addressIndex: number }
 *
 * @throws Error if contact not found, not xpub, or cache exhausted
 */
async function handleGetNextContactAddress(payload: {
  contactId: string;
}): Promise<MessageResponse> {
  try {
    if (!state.isUnlocked) {
      return { success: false, error: 'Wallet is locked' };
    }

    const { contactId } = payload;

    // Get contacts
    const contactsData = await chrome.storage.local.get('contacts');
    const contacts: Contact[] = contactsData.contacts || [];

    // Find contact
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) {
      return { success: false, error: 'Contact not found' };
    }

    // Verify xpub contact
    if (!contact.xpub || !contact.cachedAddresses) {
      return {
        success: false,
        error: 'Contact does not support address rotation (not an xpub contact)',
      };
    }

    // Get next index
    const nextIndex = (contact.lastUsedAddressIndex ?? -1) + 1;

    // Check cache bounds
    if (nextIndex >= contact.cachedAddresses.length) {
      return {
        success: false,
        error: `Address cache exhausted. Cached ${contact.cachedAddresses.length} addresses, need address #${nextIndex + 1}. Please regenerate cache.`,
      };
    }

    // Get next address
    const nextAddress = contact.cachedAddresses[nextIndex];

    console.log(`Next address for contact "${contact.name}": ${nextAddress} (index ${nextIndex})`);

    return {
      success: true,
      data: {
        address: nextAddress,
        addressIndex: nextIndex,
      },
    };
  } catch (error) {
    console.error('Failed to get next contact address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next contact address',
    };
  }
}
```

---

#### Add Message Handler: INCREMENT_CONTACT_USAGE

**Location:** `src/background/index.ts`, add new handler function

```typescript
/**
 * INCREMENT_CONTACT_USAGE - Increment contact usage tracking.
 *
 * PRIVACY: Tracks address reuse for privacy warnings.
 *
 * For xpub contacts: Increments lastUsedAddressIndex.
 * For single-address contacts: Increments reusageCount.
 *
 * Called after successful transaction to track privacy impact.
 *
 * Payload: { contactId: string, isXpub: boolean }
 * Returns: { success: boolean }
 */
async function handleIncrementContactUsage(payload: {
  contactId: string;
  isXpub: boolean;
}): Promise<MessageResponse> {
  try {
    if (!state.isUnlocked) {
      return { success: false, error: 'Wallet is locked' };
    }

    const { contactId, isXpub } = payload;

    // Get contacts
    const contactsData = await chrome.storage.local.get('contacts');
    const contacts: Contact[] = contactsData.contacts || [];

    // Find contact
    const contactIndex = contacts.findIndex(c => c.id === contactId);
    if (contactIndex === -1) {
      return { success: false, error: 'Contact not found' };
    }

    const contact = contacts[contactIndex];

    if (isXpub) {
      // Increment lastUsedAddressIndex for xpub contacts
      contact.lastUsedAddressIndex = (contact.lastUsedAddressIndex ?? -1) + 1;
      console.log(`Incremented lastUsedAddressIndex for contact "${contact.name}" to ${contact.lastUsedAddressIndex}`);
    } else {
      // Increment reusageCount for single-address contacts
      contact.reusageCount = (contact.reusageCount ?? 0) + 1;
      console.log(`Incremented reusageCount for contact "${contact.name}" to ${contact.reusageCount}`);
    }

    // Update timestamp
    contact.updatedAt = Date.now();

    // Save contacts
    await chrome.storage.local.set({ contacts });

    return { success: true };
  } catch (error) {
    console.error('Failed to increment contact usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to increment contact usage',
    };
  }
}
```

---

#### Update Message Router

**Location:** `src/background/index.ts`, in `chrome.runtime.onMessage.addListener`

**ADD cases:**

```typescript
case 'GET_NEXT_CONTACT_ADDRESS':
  sendResponse(await handleGetNextContactAddress(message.payload));
  break;

case 'INCREMENT_CONTACT_USAGE':
  sendResponse(await handleIncrementContactUsage(message.payload));
  break;
```

---

#### Integration with Send Transaction

**Option 1: Frontend calls INCREMENT_CONTACT_USAGE after send**

Frontend responsibility (simpler backend, more flexible).

**Option 2: Backend auto-increments after broadcast**

Modify `handleSendTransaction` to accept optional `recipientContactId`:

```typescript
async function handleSendTransaction(payload: {
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
  recipientContactId?: string;  // NEW: Optional contact tracking
}): Promise<MessageResponse> {
  try {
    // [Existing transaction logic...]

    // Broadcast transaction
    const txid = await blockstreamClient.broadcastTransaction(result.txHex);

    // PRIVACY: Track contact usage if provided
    if (payload.recipientContactId) {
      await handleIncrementContactUsage({
        contactId: payload.recipientContactId,
        isXpub: false,  // Determine from contacts lookup
      });
    }

    return {
      success: true,
      data: {
        txid,
        fee: result.fee,
        size: result.virtualSize,
      },
    };
  } catch (error) {
    // [Error handling...]
  }
}
```

**Recommendation:** Use Option 1 (frontend calls). Cleaner separation of concerns.

---

#### Testing Requirements

```typescript
describe('Contacts Privacy Backend', () => {
  it('should get next address for xpub contact', async () => {
    // Create xpub contact with 10 cached addresses
    const contact = await createXpubContact('Alice', 10);

    // Get first address
    const addr1 = await handleGetNextContactAddress({ contactId: contact.id });
    expect(addr1.success).toBe(true);
    expect(addr1.data.addressIndex).toBe(0);
    expect(addr1.data.address).toBe(contact.cachedAddresses[0]);

    // Increment usage
    await handleIncrementContactUsage({ contactId: contact.id, isXpub: true });

    // Get second address
    const addr2 = await handleGetNextContactAddress({ contactId: contact.id });
    expect(addr2.data.addressIndex).toBe(1);
    expect(addr2.data.address).toBe(contact.cachedAddresses[1]);
  });

  it('should increment reusageCount for single-address contact', async () => {
    const contact = await createSingleAddressContact('Bob', 'tb1q...');

    // Send 3 transactions
    for (let i = 0; i < 3; i++) {
      await handleIncrementContactUsage({ contactId: contact.id, isXpub: false });
    }

    // Verify count
    const updatedContact = await getContact(contact.id);
    expect(updatedContact.reusageCount).toBe(3);
  });

  it('should fail gracefully when cache exhausted', async () => {
    const contact = await createXpubContact('Charlie', 5);

    // Use all 5 addresses
    for (let i = 0; i < 5; i++) {
      await handleGetNextContactAddress({ contactId: contact.id });
      await handleIncrementContactUsage({ contactId: contact.id, isXpub: true });
    }

    // Try to get 6th address
    const result = await handleGetNextContactAddress({ contactId: contact.id });
    expect(result.success).toBe(false);
    expect(result.error).toContain('cache exhausted');
  });
});
```

---

## Phase 3: Optional Privacy Mode Settings

### 3.1 Privacy Settings Storage (P2)

**Implementation:** Store privacy settings in `chrome.storage.local`.

**Files to Modify:**
- `src/shared/types/index.ts`
- `src/background/index.ts`

---

#### Define PrivacySettings Type

**Location:** `src/shared/types/index.ts`, add new interface

```typescript
/**
 * Privacy Mode Settings
 *
 * Optional privacy features with performance/UX trade-offs.
 * All features disabled by default.
 *
 * Stored in chrome.storage.local under 'privacySettings' key.
 */
export interface PrivacySettings {
  // Round Number Randomization
  // Add ±0.1% variance to round amounts (0.1 BTC → 0.10023 BTC)
  // Prevents change detection heuristics
  randomizeRoundAmounts: boolean;

  // API Request Timing Randomization
  // Add 1-5s delays between blockchain queries
  // Prevents timing-based address clustering
  // Trade-off: 5-20s slower balance updates
  randomizeApiTiming: boolean;

  // Transaction Broadcast Delay
  // Wait 5-30s before broadcasting transaction
  // Prevents timing correlation and IP linking
  // Trade-off: 5-30s slower transaction sending
  delayBroadcast: boolean;
}

/**
 * Default privacy settings (all disabled)
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  randomizeRoundAmounts: false,
  randomizeApiTiming: false,
  delayBroadcast: false,
};
```

---

#### Add Message Handler: GET_PRIVACY_SETTINGS

```typescript
/**
 * GET_PRIVACY_SETTINGS - Get current privacy settings.
 *
 * Payload: none
 * Returns: PrivacySettings
 */
async function handleGetPrivacySettings(): Promise<MessageResponse> {
  try {
    const data = await chrome.storage.local.get('privacySettings');
    const settings: PrivacySettings = data.privacySettings || DEFAULT_PRIVACY_SETTINGS;

    return {
      success: true,
      data: settings,
    };
  } catch (error) {
    console.error('Failed to get privacy settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get privacy settings',
    };
  }
}
```

---

#### Add Message Handler: UPDATE_PRIVACY_SETTINGS

```typescript
/**
 * UPDATE_PRIVACY_SETTINGS - Update privacy settings.
 *
 * Payload: Partial<PrivacySettings>
 * Returns: { success: boolean }
 */
async function handleUpdatePrivacySettings(payload: Partial<PrivacySettings>): Promise<MessageResponse> {
  try {
    // Get current settings
    const data = await chrome.storage.local.get('privacySettings');
    const currentSettings: PrivacySettings = data.privacySettings || DEFAULT_PRIVACY_SETTINGS;

    // Merge with new settings
    const updatedSettings: PrivacySettings = {
      ...currentSettings,
      ...payload,
    };

    // Save
    await chrome.storage.local.set({ privacySettings: updatedSettings });

    console.log('Privacy settings updated:', updatedSettings);

    return {
      success: true,
      data: updatedSettings,
    };
  } catch (error) {
    console.error('Failed to update privacy settings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update privacy settings',
    };
  }
}
```

---

#### Update Message Router

```typescript
case 'GET_PRIVACY_SETTINGS':
  sendResponse(await handleGetPrivacySettings());
  break;

case 'UPDATE_PRIVACY_SETTINGS':
  sendResponse(await handleUpdatePrivacySettings(message.payload));
  break;
```

---

### 3.2 Round Number Randomization (P2 - Optional)

**Implementation:** Create utility module to detect and randomize round amounts.

**Files to Create:**
- `src/background/privacy/PrivacyUtils.ts` (NEW)

---

#### Create PrivacyUtils Module

**Location:** `src/background/privacy/PrivacyUtils.ts` (NEW FILE)

```typescript
/**
 * Privacy Utility Functions
 *
 * Helpers for optional privacy enhancements.
 */

/**
 * Detect if an amount is a "round number".
 *
 * Round numbers are common transaction amounts that make it easy to
 * identify which output is change vs. recipient.
 *
 * Examples of round numbers:
 * - 0.1 BTC (10,000,000 sats)
 * - 0.5 BTC (50,000,000 sats)
 * - 1.0 BTC (100,000,000 sats)
 * - 0.01 BTC (1,000,000 sats)
 *
 * Detection: Number ends in multiple zeros (>= 3 trailing zeros in satoshis)
 *
 * @param amountSats - Amount in satoshis
 * @returns True if amount is round, false otherwise
 */
export function detectRoundNumber(amountSats: number): boolean {
  if (amountSats <= 0) {
    return false;
  }

  // Convert to string to count trailing zeros
  const amountStr = amountSats.toString();

  // Count trailing zeros
  let trailingZeros = 0;
  for (let i = amountStr.length - 1; i >= 0; i--) {
    if (amountStr[i] === '0') {
      trailingZeros++;
    } else {
      break;
    }
  }

  // Round if >= 3 trailing zeros
  // Examples: 1000, 10000, 100000, 1000000, etc.
  return trailingZeros >= 3;
}

/**
 * Randomize a round amount by adding small variance.
 *
 * PRIVACY: Adding ±0.1% variance prevents change detection heuristics
 * that rely on round number identification.
 *
 * Algorithm:
 * 1. Generate random variance between -0.1% and +0.1%
 * 2. Add variance to amount (in satoshis)
 * 3. Round to nearest satoshi
 * 4. Ensure result > 0
 *
 * @param amountSats - Original amount in satoshis
 * @param variancePercent - Variance percentage (default 0.1%)
 * @returns Randomized amount in satoshis
 */
export function randomizeAmount(
  amountSats: number,
  variancePercent: number = 0.001  // 0.1% = 0.001
): number {
  if (amountSats <= 0) {
    return amountSats;
  }

  // Generate random variance: -0.1% to +0.1%
  const variance = (Math.random() * 2 - 1) * variancePercent;

  // Apply variance
  const randomized = Math.round(amountSats * (1 + variance));

  // Ensure positive
  return Math.max(1, randomized);
}

/**
 * Example usage:
 *
 * const amount = 10000000; // 0.1 BTC
 *
 * if (detectRoundNumber(amount)) {
 *   const randomized = randomizeAmount(amount);
 *   console.log(`Original: ${amount} sats`);
 *   console.log(`Randomized: ${randomized} sats`);
 *   console.log(`Difference: ${randomized - amount} sats (${((randomized - amount) / amount * 100).toFixed(4)}%)`);
 * }
 *
 * // Output example:
 * // Original: 10000000 sats
 * // Randomized: 10002347 sats
 * // Difference: +2347 sats (+0.0235%)
 */
```

---

#### Integration with Send Transaction

**Modify `handleSendTransaction` to check privacy setting:**

```typescript
async function handleSendTransaction(payload: {
  accountIndex: number;
  toAddress: string;
  amount: number;  // Original amount from user
  feeRate: number;
  recipientContactId?: string;
}): Promise<MessageResponse> {
  try {
    let finalAmount = payload.amount;

    // PRIVACY: Check if round number randomization is enabled
    const privacySettings = await handleGetPrivacySettings();
    if (privacySettings.success && privacySettings.data.randomizeRoundAmounts) {
      if (detectRoundNumber(payload.amount)) {
        const originalAmount = payload.amount;
        finalAmount = randomizeAmount(payload.amount);
        console.log(`Randomized round amount: ${originalAmount} → ${finalAmount} sats (+${finalAmount - originalAmount} sats)`);
      }
    }

    // [Continue with transaction building using finalAmount...]

    // Build and sign transaction
    const result = await transactionBuilder.buildTransaction({
      utxos: allUtxos,
      outputs: [{ address: toAddress, amount: finalAmount }],  // Use randomized amount
      changeAddress,
      feeRate,
      // ...
    });

    // [Rest of handler...]
  } catch (error) {
    // [Error handling...]
  }
}
```

**Note:** Frontend can also apply randomization and display to user before sending. Backend randomization is a fallback/enforcement layer.

---

#### Testing Requirements

```typescript
describe('Round Number Detection', () => {
  it('should detect round numbers', () => {
    expect(detectRoundNumber(10000000)).toBe(true);   // 0.1 BTC
    expect(detectRoundNumber(50000000)).toBe(true);   // 0.5 BTC
    expect(detectRoundNumber(100000000)).toBe(true);  // 1.0 BTC
    expect(detectRoundNumber(1000000)).toBe(true);    // 0.01 BTC
    expect(detectRoundNumber(1000)).toBe(true);       // 1000 sats
  });

  it('should not detect non-round numbers', () => {
    expect(detectRoundNumber(10234567)).toBe(false);  // Random amount
    expect(detectRoundNumber(50010000)).toBe(false);  // Slightly off
    expect(detectRoundNumber(123)).toBe(false);       // Small amount
    expect(detectRoundNumber(999)).toBe(false);       // 2 trailing zeros
  });
});

describe('Amount Randomization', () => {
  it('should randomize within ±0.1% by default', () => {
    const amount = 10000000; // 0.1 BTC
    const results: number[] = [];

    // Run 1000 times
    for (let i = 0; i < 1000; i++) {
      const randomized = randomizeAmount(amount);
      results.push(randomized);
    }

    // Check min and max
    const min = Math.min(...results);
    const max = Math.max(...results);

    // Should be within ±0.1% (±10,000 sats for 0.1 BTC)
    expect(min).toBeGreaterThanOrEqual(amount - 10000);
    expect(max).toBeLessThanOrEqual(amount + 10000);

    // Should have variation (not all same)
    const unique = new Set(results);
    expect(unique.size).toBeGreaterThan(100);
  });

  it('should return positive values', () => {
    for (let i = 0; i < 100; i++) {
      const randomized = randomizeAmount(100);
      expect(randomized).toBeGreaterThan(0);
    }
  });

  it('should handle custom variance', () => {
    const amount = 10000000;
    const variance = 0.01; // 1%

    const results: number[] = [];
    for (let i = 0; i < 1000; i++) {
      results.push(randomizeAmount(amount, variance));
    }

    const min = Math.min(...results);
    const max = Math.max(...results);

    // Should be within ±1%
    expect(min).toBeGreaterThanOrEqual(amount - 100000);
    expect(max).toBeLessThanOrEqual(amount + 100000);
  });
});
```

---

### 3.3 API Request Timing Randomization (P2 - Optional)

**Implementation:** Add privacy mode to `BlockstreamClient` with random delays between requests.

**Files to Modify:**
- `src/background/api/BlockstreamClient.ts`
- `src/background/index.ts` (pass privacy setting to client)

---

#### Update BlockstreamClient

**Location:** `src/background/api/BlockstreamClient.ts`

**ADD constructor parameter:**

```typescript
export class BlockstreamClient {
  private baseURL: string;
  private privacyMode: boolean;  // NEW

  constructor(network: 'mainnet' | 'testnet' = 'testnet', privacyMode: boolean = false) {
    this.baseURL =
      network === 'mainnet'
        ? 'https://blockstream.info/api'
        : 'https://blockstream.info/testnet/api';
    this.privacyMode = privacyMode;
  }

  // ...
}
```

**ADD helper method:**

```typescript
/**
 * Add random delay between API requests (privacy mode).
 *
 * PRIVACY: Prevents timing-based address clustering by network observers.
 * Randomizes query timing to make it harder to correlate requests to same wallet.
 *
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Promise that resolves after random delay
 */
private async delayBetweenRequests(minMs: number = 1000, maxMs: number = 5000): Promise<void> {
  if (!this.privacyMode) {
    return; // No delay if privacy mode disabled
  }

  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  console.log(`Privacy mode: Waiting ${delay}ms before next API request`);

  return new Promise(resolve => setTimeout(resolve, delay));
}
```

**UPDATE methods to use delay:**

```typescript
/**
 * Get address info.
 *
 * PRIVACY MODE: If enabled, adds 1-5s random delay before request.
 */
async getAddressInfo(address: string): Promise<AddressInfo> {
  await this.delayBetweenRequests();  // Privacy delay

  const response = await fetch(`${this.baseURL}/address/${address}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch address info: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Get UTXOs for address.
 *
 * PRIVACY MODE: If enabled, adds 1-5s random delay before request.
 */
async getUTXOs(address: string): Promise<UTXO[]> {
  await this.delayBetweenRequests();  // Privacy delay

  const response = await fetch(`${this.baseURL}/address/${address}/utxo`);
  if (!response.ok) {
    throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
  }
  return response.json();
}

// Apply same pattern to all API methods...
```

---

#### Update handleSendTransaction to Pass Privacy Setting

```typescript
async function handleSendTransaction(payload: {
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
}): Promise<MessageResponse> {
  try {
    // Get privacy settings
    const privacyResponse = await handleGetPrivacySettings();
    const privacyMode = privacyResponse.success && privacyResponse.data.randomizeApiTiming;

    // Create API client with privacy mode
    const client = new BlockstreamClient('testnet', privacyMode);

    // Fetch UTXOs (with privacy delays if enabled)
    const utxoArrays = await Promise.all(
      addresses.map(addr => client.getUTXOs(addr))
    );

    // [Rest of transaction building...]
  } catch (error) {
    // [Error handling...]
  }
}
```

**Alternative:** Store `blockstreamClient` instance in state and recreate when privacy settings change.

---

#### Testing Requirements

```typescript
describe('API Privacy Mode', () => {
  it('should add delays when privacy mode enabled', async () => {
    const client = new BlockstreamClient('testnet', true);

    const start = Date.now();

    // Fetch 5 addresses
    for (let i = 0; i < 5; i++) {
      await client.getUTXOs(`tb1q...${i}`);
    }

    const elapsed = Date.now() - start;

    // Should take at least 4 seconds (5-1 delays, minimum 1s each)
    expect(elapsed).toBeGreaterThan(4000);
  });

  it('should not add delays when privacy mode disabled', async () => {
    const client = new BlockstreamClient('testnet', false);

    const start = Date.now();

    // Fetch 5 addresses
    for (let i = 0; i < 5; i++) {
      await client.getUTXOs(`tb1q...${i}`);
    }

    const elapsed = Date.now() - start;

    // Should be fast (<1 second for mocked requests)
    expect(elapsed).toBeLessThan(1000);
  });

  it('should delay within expected range', async () => {
    const client = new BlockstreamClient('testnet', true);

    const delays: number[] = [];

    // Measure 100 delays
    for (let i = 0; i < 100; i++) {
      const start = Date.now();
      await client['delayBetweenRequests'](1000, 5000);
      delays.push(Date.now() - start);
    }

    // All delays should be 1000-5000ms
    delays.forEach(delay => {
      expect(delay).toBeGreaterThanOrEqual(1000);
      expect(delay).toBeLessThanOrEqual(5100); // +100ms tolerance
    });
  });
});
```

---

### 3.4 Transaction Broadcast Delay (P2 - Optional)

**Implementation:** Add optional delay before broadcasting transaction.

**Files to Modify:**
- `src/background/api/BlockstreamClient.ts`
- `src/background/index.ts`

---

#### Update BlockstreamClient

**ADD method:**

```typescript
/**
 * Broadcast transaction with optional delay.
 *
 * PRIVACY: Delays broadcast to prevent timing correlation between
 * transaction creation and broadcasting (IP linking attack).
 *
 * @param txHex - Raw transaction hex
 * @param delayMs - Optional delay in milliseconds (0 = no delay)
 * @returns Transaction ID (txid)
 */
async broadcastTransaction(txHex: string, delayMs: number = 0): Promise<string> {
  // Apply delay if specified
  if (delayMs > 0) {
    console.log(`Privacy mode: Delaying broadcast for ${delayMs}ms...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  const response = await fetch(`${this.baseURL}/tx`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: txHex,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to broadcast transaction: ${errorText}`);
  }

  const txid = await response.text();
  console.log(`Transaction broadcast successful: ${txid}`);

  return txid;
}
```

---

#### Update handleSendTransaction

```typescript
async function handleSendTransaction(payload: {
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
}): Promise<MessageResponse> {
  try {
    // [Build transaction...]

    // Get privacy settings
    const privacyResponse = await handleGetPrivacySettings();
    const privacySettings = privacyResponse.data;

    // Calculate broadcast delay
    let broadcastDelay = 0;
    if (privacySettings && privacySettings.delayBroadcast) {
      // Random delay: 5-30 seconds
      broadcastDelay = Math.floor(Math.random() * 25000) + 5000;
      console.log(`Broadcast will be delayed by ${broadcastDelay}ms for privacy`);
    }

    // Broadcast transaction (with delay if enabled)
    const txid = await blockstreamClient.broadcastTransaction(result.txHex, broadcastDelay);

    console.log(`Transaction broadcast successful: ${txid}`);

    return {
      success: true,
      data: {
        txid,
        fee: result.fee,
        size: result.virtualSize,
        broadcastDelay,  // NEW: Return delay to frontend for countdown UI
      },
    };
  } catch (error) {
    // [Error handling...]
  }
}
```

---

#### Testing Requirements

```typescript
describe('Broadcast Privacy Delay', () => {
  it('should delay broadcast when specified', async () => {
    const client = new BlockstreamClient('testnet');
    const delay = 2000; // 2 seconds

    const start = Date.now();
    await client.broadcastTransaction('rawTxHex...', delay);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(2000);
    expect(elapsed).toBeLessThan(2500); // +500ms tolerance
  });

  it('should broadcast immediately when delay is 0', async () => {
    const client = new BlockstreamClient('testnet');

    const start = Date.now();
    await client.broadcastTransaction('rawTxHex...', 0);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(500); // Should be fast
  });
});
```

---

## Message Handler Specifications

### Complete Message Handler Summary

| Message Type | Payload | Response | Phase | Priority |
|-------------|---------|----------|-------|----------|
| **GET_NEXT_CONTACT_ADDRESS** | `{ contactId: string }` | `{ address: string, addressIndex: number }` | 2 | P0 |
| **INCREMENT_CONTACT_USAGE** | `{ contactId: string, isXpub: boolean }` | `{ success: boolean }` | 2 | P0 |
| **GET_PRIVACY_SETTINGS** | none | `PrivacySettings` | 3 | P2 |
| **UPDATE_PRIVACY_SETTINGS** | `Partial<PrivacySettings>` | `PrivacySettings` | 3 | P2 |

---

### GET_NEXT_CONTACT_ADDRESS

**Purpose:** Get next unused address for xpub contact rotation.

**Request:**
```typescript
{
  type: 'GET_NEXT_CONTACT_ADDRESS',
  payload: {
    contactId: string  // UUID of contact
  }
}
```

**Success Response:**
```typescript
{
  success: true,
  data: {
    address: string,      // Next cached address
    addressIndex: number  // Index in cachedAddresses array
  }
}
```

**Error Responses:**
```typescript
// Contact not found
{
  success: false,
  error: 'Contact not found'
}

// Not an xpub contact
{
  success: false,
  error: 'Contact does not support address rotation (not an xpub contact)'
}

// Cache exhausted
{
  success: false,
  error: 'Address cache exhausted. Cached 50 addresses, need address #51. Please regenerate cache.'
}

// Wallet locked
{
  success: false,
  error: 'Wallet is locked'
}
```

---

### INCREMENT_CONTACT_USAGE

**Purpose:** Track contact usage for privacy warnings.

**Request:**
```typescript
{
  type: 'INCREMENT_CONTACT_USAGE',
  payload: {
    contactId: string,  // UUID of contact
    isXpub: boolean     // true = xpub contact, false = single-address contact
  }
}
```

**Success Response:**
```typescript
{
  success: true
}
```

**Error Responses:**
```typescript
// Contact not found
{
  success: false,
  error: 'Contact not found'
}

// Wallet locked
{
  success: false,
  error: 'Wallet is locked'
}
```

**Behavior:**
- If `isXpub = true`: Increments `contact.lastUsedAddressIndex`
- If `isXpub = false`: Increments `contact.reusageCount`
- Updates `contact.updatedAt` timestamp
- Saves contacts to storage

---

### GET_PRIVACY_SETTINGS

**Purpose:** Retrieve current privacy settings.

**Request:**
```typescript
{
  type: 'GET_PRIVACY_SETTINGS',
  payload: {}  // No payload
}
```

**Success Response:**
```typescript
{
  success: true,
  data: {
    randomizeRoundAmounts: boolean,
    randomizeApiTiming: boolean,
    delayBroadcast: boolean
  }
}
```

**Default Values:** All `false` if settings not yet saved.

---

### UPDATE_PRIVACY_SETTINGS

**Purpose:** Update privacy settings (partial or full update).

**Request:**
```typescript
{
  type: 'UPDATE_PRIVACY_SETTINGS',
  payload: {
    randomizeRoundAmounts?: boolean,  // Optional
    randomizeApiTiming?: boolean,     // Optional
    delayBroadcast?: boolean          // Optional
  }
}
```

**Success Response:**
```typescript
{
  success: true,
  data: {
    randomizeRoundAmounts: boolean,  // Updated settings
    randomizeApiTiming: boolean,
    delayBroadcast: boolean
  }
}
```

**Behavior:**
- Merges provided settings with existing settings
- Saves to `chrome.storage.local`
- Returns full updated settings

---

## Storage Schema Updates

### contacts (MODIFIED)

**Before:**
```typescript
interface Contact {
  id: string;
  name: string;
  address?: string;
  xpub?: string;
  cachedAddresses?: string[];
  // ... other fields
}
```

**After:**
```typescript
interface Contact {
  id: string;
  name: string;
  address?: string;
  xpub?: string;
  cachedAddresses?: string[];
  lastUsedAddressIndex?: number;  // NEW: For xpub rotation tracking
  reusageCount?: number;           // NEW: For single-address reuse tracking
  // ... other fields
}
```

**Migration:** Existing contacts work without changes (fields are optional).

---

### privacySettings (NEW)

**Key:** `'privacySettings'`

**Schema:**
```typescript
{
  privacySettings: {
    randomizeRoundAmounts: boolean,  // Default: false
    randomizeApiTiming: boolean,     // Default: false
    delayBroadcast: boolean          // Default: false
  }
}
```

**Default:** If not present, all values default to `false`.

---

### wallet.accounts[].internalIndex (INCREMENTED)

**Before:** `internalIndex` may not increment (if change addresses not generated).

**After:** `internalIndex` increments with every transaction that has change.

**No Schema Change:** Field already exists, just usage changes.

---

## Testing Strategy

### Unit Tests

**Coverage Target:** 95% for privacy-critical code

**Test Files:**
- `src/background/__tests__/privacy-change-address.test.ts`
- `src/background/__tests__/privacy-utxo-selection.test.ts`
- `src/background/__tests__/privacy-contacts.test.ts`
- `src/background/__tests__/privacy-utils.test.ts`
- `src/background/__tests__/privacy-settings.test.ts`
- `src/background/api/__tests__/BlockstreamClient-privacy.test.ts`

**Key Test Cases:**

1. **Change Address Generation:**
   - Generates unique addresses
   - Uses internal chain (m/.../1/x)
   - Increments internalIndex
   - Works for multisig (BIP48)

2. **UTXO Selection:**
   - Non-deterministic (>10% variation over 100 runs)
   - Achieves >50% entropy
   - Respects dust limits
   - Selects sufficient funds

3. **Contacts Privacy:**
   - Xpub rotation increments lastUsedAddressIndex
   - Single-address increments reusageCount
   - Cache exhaustion handled gracefully
   - Contact matching works for all cached addresses

4. **Privacy Utils:**
   - Detects round numbers correctly
   - Randomizes within ±0.1%
   - Returns positive values
   - Custom variance works

5. **Privacy Settings:**
   - GET returns defaults when not set
   - UPDATE merges partial settings
   - Settings persist across restarts

6. **API Privacy Mode:**
   - Adds delays when enabled
   - No delays when disabled
   - Delays within expected range

---

### Integration Tests

**Test Files:**
- `src/background/__tests__/integration-privacy-transactions.test.ts`

**Key Test Flows:**

1. **End-to-End Transaction Privacy:**
   - Send 10 transactions
   - Verify 10 unique change addresses
   - Verify randomized UTXO selection (different UTXOs selected)
   - Verify internal index increments correctly

2. **Contacts Privacy Flow:**
   - Create xpub contact
   - Send 5 transactions
   - Verify 5 different addresses used
   - Verify lastUsedAddressIndex = 4 (after 5 sends)

3. **Privacy Settings Flow:**
   - Update settings
   - Send transaction
   - Verify round number randomization applied (if enabled)
   - Verify API delays applied (if enabled)
   - Verify broadcast delay applied (if enabled)

---

### Testnet Validation

**Manual Testing Checklist:**

- [ ] Send 3 real testnet transactions
- [ ] Use Blockstream explorer to view transaction details
- [ ] Identify change outputs (non-recipient outputs)
- [ ] Verify all 3 change addresses are different
- [ ] Verify change addresses NOT in receive address list
- [ ] Verify UTXO selection varies across transactions
- [ ] Test xpub contact rotation (send 5 times, verify 5 addresses)
- [ ] Test single-address contact counter (verify reusageCount increments)
- [ ] Test privacy mode delays (observe timing)

---

### Privacy Metrics Validation

**Automated Metrics:**

```typescript
// Privacy metric tracking for regression testing

describe('Privacy Metrics Regression', () => {
  it('should maintain 0% change address reuse', async () => {
    const changeAddresses = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const tx = await sendTestTransaction();
      const changeAddr = extractChangeAddress(tx);
      changeAddresses.add(changeAddr);
    }

    // 100 transactions = 100 unique change addresses
    expect(changeAddresses.size).toBe(100);
  });

  it('should maintain >50% UTXO selection entropy', () => {
    const entropy = measureUTXOEntropy(1000); // 1000 runs
    expect(entropy).toBeGreaterThan(50);
  });
});
```

---

## Migration Plan

### Storage Migrations

**No Breaking Changes Required:**

All new fields are optional and backwards-compatible:
- `Contact.lastUsedAddressIndex` (optional)
- `Contact.reusageCount` (optional)
- `privacySettings` (new key, defaults applied)

**Existing Wallets:**
- Contacts work without changes (new fields undefined initially)
- Privacy settings default to `false` (disabled)
- Change address generation works immediately (existing `handleGenerateAddress`)

---

### Deployment Strategy

**Phase 2 Deployment:**

1. **Deploy backend changes:**
   - Change address fix
   - UTXO randomization
   - Contacts privacy backend

2. **Test thoroughly:**
   - Unit tests
   - Integration tests
   - Testnet validation

3. **Frontend can deploy UI in parallel** (independent changes)

**Phase 3 Deployment:**

1. **Deploy backend:**
   - Privacy settings storage
   - Privacy utils module
   - API timing delays
   - Broadcast delays

2. **Deploy frontend:**
   - Settings UI
   - Round number indicator
   - Broadcast countdown

**Rollback Plan:**

If critical issues found:
- Revert to previous version (contacts still work)
- Privacy settings disabled (safe default)
- Change address generation reverts to first address (privacy leak, but functional)

---

### User Communication

**Release Notes (v0.11.0):**

```markdown
## [0.11.0] - Privacy Enhancement Release - 2025-11-XX

### CRITICAL Privacy Fixes
- **Fixed change address reuse** - Every transaction now uses a unique change
  address, preventing transaction graph analysis
- **Randomized UTXO selection** - Prevents wallet fingerprinting through
  predictable selection patterns

### Privacy Enhancements
- **Contacts privacy tracking** - Warns when reusing addresses, supports xpub
  rotation
- **Auto-generated receive addresses** - Fresh address created each time you
  view the receive screen
- **Optional Privacy Mode settings** - Advanced features for power users
  (round number randomization, API timing delays, broadcast delays)

### Breaking Changes
None - All changes are backwards-compatible.

### Migration
No action required - existing wallets work without changes.
```

---

## Implementation Checklist

### Phase 2: Critical Privacy Fixes (10 days)

#### 2.1 Change Address Fix (2 days)

- [ ] Add `getOrGenerateChangeAddress()` helper function
- [ ] Update `handleSendTransaction` (line 1766)
- [ ] Update `handleBuildMultisigTransaction` (line 2147)
- [ ] Add logging for change address generation
- [ ] Write unit tests (change address uniqueness, internal chain, index increment)
- [ ] Write integration tests (real transactions, testnet validation)
- [ ] Test multisig change addresses (BIP48 compliance)
- [ ] Code review by Blockchain Expert
- [ ] Testnet validation (manual testing)

#### 2.2 UTXO Randomization (1 day)

- [ ] Add `shuffleArray()` helper (Fisher-Yates)
- [ ] Update `selectUTXOs()` method (replace greedy with randomized)
- [ ] Add logging for selection algorithm
- [ ] (Optional) Add `selectUTXOsGreedy()` fallback
- [ ] Write unit tests (non-determinism, entropy >50%, dust limits)
- [ ] Write integration tests (vary across transactions)
- [ ] Measure entropy (1000 runs, verify >50%)
- [ ] Code review by Blockchain Expert
- [ ] Performance testing (compare fees: randomized vs greedy)

#### 2.3 Contacts Privacy Backend (2 days)

- [ ] Update `Contact` type (add `lastUsedAddressIndex`, `reusageCount`)
- [ ] Add `handleGetNextContactAddress` message handler
- [ ] Add `handleIncrementContactUsage` message handler
- [ ] Update message router (add new cases)
- [ ] Write unit tests (address rotation, usage tracking, cache exhaustion)
- [ ] Write integration tests (full contact send flow)
- [ ] Test backwards compatibility (existing contacts)
- [ ] Code review by Backend Developer

#### 2.4 Testing & Validation (3 days)

- [ ] Run full unit test suite
- [ ] Run integration test suite
- [ ] Testnet validation (send 10 transactions, verify privacy)
- [ ] Measure privacy metrics (0% change reuse, >50% entropy)
- [ ] Performance testing (no regressions)
- [ ] User acceptance testing (privacy features work correctly)
- [ ] Documentation review (code comments, inline docs)

---

### Phase 3: Optional Privacy Features (7 days)

#### 3.1 Privacy Settings Storage (1 day)

- [ ] Define `PrivacySettings` type in `shared/types`
- [ ] Add `DEFAULT_PRIVACY_SETTINGS` constant
- [ ] Add `handleGetPrivacySettings` message handler
- [ ] Add `handleUpdatePrivacySettings` message handler
- [ ] Update message router
- [ ] Write unit tests (get defaults, update partial, persistence)
- [ ] Test storage migrations (existing wallets)

#### 3.2 Round Number Randomization (1 day)

- [ ] Create `src/background/privacy/PrivacyUtils.ts` module
- [ ] Implement `detectRoundNumber()` function
- [ ] Implement `randomizeAmount()` function
- [ ] Update `handleSendTransaction` to check privacy setting
- [ ] Apply randomization if enabled
- [ ] Write unit tests (detection, randomization, variance)
- [ ] Test integration with send transaction

#### 3.3 API Timing Delays (2 days)

- [ ] Update `BlockstreamClient` constructor (add `privacyMode` param)
- [ ] Add `delayBetweenRequests()` helper method
- [ ] Update all API methods to call delay before request
- [ ] Update transaction handlers to pass privacy mode to client
- [ ] Write unit tests (delays applied, delays within range)
- [ ] Test with real API calls (measure timing)
- [ ] Verify no timeout errors with delays

#### 3.4 Broadcast Delays (1 day)

- [ ] Update `broadcastTransaction()` to accept optional `delayMs` param
- [ ] Implement delay before broadcast
- [ ] Update `handleSendTransaction` to calculate random delay if enabled
- [ ] Return `broadcastDelay` in response (for frontend countdown)
- [ ] Write unit tests (delay applied, immediate broadcast)
- [ ] Test transaction still broadcasts if wallet closed during delay

#### 3.5 Testing & Validation (2 days)

- [ ] Run full unit test suite
- [ ] Run integration test suite
- [ ] Test privacy settings UI integration
- [ ] Test round number randomization (frontend + backend)
- [ ] Test API delays (measure timing impact)
- [ ] Test broadcast delays (countdown UI)
- [ ] Performance testing (ensure delays don't cause errors)
- [ ] Documentation review

---

### Documentation (Parallel to Development)

- [ ] Update `prompts/docs/backend-developer-notes.md`
  - [ ] Document change address implementation
  - [ ] Document UTXO randomization algorithm
  - [ ] Document contacts privacy tracking
  - [ ] Document privacy settings storage
  - [ ] Document privacy utils module
  - [ ] Document API privacy mode

- [ ] Update code comments (inline documentation)
  - [ ] `getOrGenerateChangeAddress()` function
  - [ ] `selectUTXOs()` method
  - [ ] Privacy message handlers
  - [ ] Privacy utils functions

- [ ] Create API documentation for frontend team
  - [ ] Message handler specifications
  - [ ] Request/response formats
  - [ ] Error handling patterns

---

## Dependencies and Risks

### External Dependencies

| Dependency | Usage | Version | Risk Level |
|------------|-------|---------|------------|
| **bitcoinjs-lib** | HD wallet, transaction building | 6.1.5 | ✅ Low - Stable API |
| **bip32** | Key derivation (internal chain) | 4.0.0 | ✅ Low - Standard BIP |
| **bip39** | Mnemonic handling | 3.1.0 | ✅ Low - Standard BIP |
| **chrome.storage.local** | Settings persistence | Built-in | ✅ Low - Browser API |
| **Math.random()** | UTXO shuffling | Built-in | ⚠️ Medium - See note below |

**Note on Math.random():**
- **Risk:** `Math.random()` is not cryptographically secure
- **Impact:** UTXO randomization uses it for privacy, not security
- **Mitigation:** For privacy purposes, `Math.random()` provides sufficient entropy (50-70% achieved)
- **Future Enhancement:** Could use `crypto.getRandomValues()` for true randomness, but not required for MVP

---

### Technical Risks

#### Risk 1: Change Address Generation Performance

**Risk:** Generating change address on every transaction may slow down send flow.

**Likelihood:** Low
**Impact:** Medium (user experience)
**Mitigation:**
- `handleGenerateAddress` is already fast (<100ms)
- Address generation is async, doesn't block UI
- Can pre-generate internal addresses in background (future optimization)

**Contingency:**
- If performance issue: Batch-generate internal addresses on wallet unlock
- Maintain buffer of 5 pre-generated internal addresses

---

#### Risk 2: UTXO Randomization Increases Fees

**Risk:** Randomized selection may select more/larger UTXOs than greedy, increasing fees.

**Likelihood:** Low
**Impact:** Low (fee increase <10% expected)
**Mitigation:**
- Randomization still selects UTXOs in order until target met (same as greedy)
- Only difference is the order, not the total selected
- Greedy fallback available if needed

**Contingency:**
- Monitor average fees: randomized vs greedy
- If fees increase >10%: Refine algorithm or add greedy fallback
- User can still use coin control (future feature)

---

#### Risk 3: Contacts Cache Exhaustion

**Risk:** Xpub contact sends exhaust cached addresses, blocking sends.

**Likelihood:** Medium (for high-volume users)
**Impact:** Medium (user cannot send until cache regenerated)
**Mitigation:**
- Cache size: 50 addresses (reasonable for most users)
- Frontend warns when 80% exhausted
- User can regenerate cache manually

**Contingency:**
- Auto-regenerate cache when 90% exhausted (future feature)
- Allow manual cache size configuration (advanced setting)

---

#### Risk 4: Privacy Mode API Delays Cause Timeouts

**Risk:** 1-5s delays between requests may cause API timeout errors.

**Likelihood:** Low
**Impact:** Medium (balance refresh fails)
**Mitigation:**
- Delays are only 1-5 seconds (well below typical timeout of 30s)
- Delays applied per-request, not total time
- Test with real API to verify no timeouts

**Contingency:**
- Reduce max delay to 3 seconds
- Make delay configurable (advanced setting)
- Provide "Skip Delay" option in frontend

---

#### Risk 5: Broadcast Delay User Impatience

**Risk:** Users close wallet during broadcast delay, thinking transaction failed.

**Likelihood:** Medium
**Impact:** Low (transaction still broadcasts in background)
**Mitigation:**
- Frontend shows countdown UI
- "Broadcast Now" override button
- Clear messaging: "Transaction will broadcast even if you close this screen"

**Contingency:**
- Reduce max delay to 15 seconds
- Add persistent notification in background worker
- Show pending transaction in transaction history immediately

---

### Breaking Changes

**None.** All changes are backwards-compatible:
- Existing contacts work without new fields
- Privacy settings default to disabled
- Change address generation uses existing `handleGenerateAddress`
- UTXO randomization is internal (no API change)

---

### Performance Considerations

**Expected Impact:**

| Feature | Performance Impact | Mitigation |
|---------|-------------------|------------|
| Change address generation | +50-100ms per transaction | Acceptable (already async) |
| UTXO randomization | Negligible (same algorithm, shuffled) | None needed |
| Contacts privacy tracking | +10ms per send | Acceptable (single storage write) |
| API timing delays (optional) | +5-20s per balance refresh | User-controlled (opt-in) |
| Broadcast delay (optional) | +5-30s per send | User-controlled (opt-in) |

**Overall:** Phase 2 features have minimal performance impact. Phase 3 features are opt-in with clear trade-offs.

---

## Conclusion

This backend implementation plan provides **complete specifications** for all privacy enhancement features. The plan is:

✅ **Implementation-ready** - Detailed code examples and specifications
✅ **Testable** - Comprehensive testing strategy with specific test cases
✅ **Backwards-compatible** - No breaking changes, graceful migrations
✅ **Risk-mitigated** - Identified risks with mitigation strategies
✅ **Privacy-focused** - Addresses all P0/P1 vulnerabilities from audit report

**Next Steps:**

1. ✅ **Product Manager** reviews and approves plan
2. **Backend Developer** begins Phase 2 implementation
3. **Frontend Developer** implements UI components (parallel work)
4. **Blockchain Expert** reviews change address and UTXO code
5. **Security Expert** reviews privacy settings and API delays
6. **QA Engineer** executes testnet validation
7. **All team** collaborates on final release testing

**Estimated Timeline:**
- **Phase 2 (Critical Fixes):** 10 days
- **Phase 3 (Optional Features):** 7 days
- **Total:** 17 days (~3.5 weeks)

**Ready for implementation.** 🚀

---

**Document Owner:** Backend Developer
**Last Updated:** October 21, 2025
**Version:** 1.0
**Status:** ✅ Implementation-Ready
