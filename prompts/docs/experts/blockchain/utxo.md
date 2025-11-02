# UTXO Management & Coin Selection

**Last Updated**: October 22, 2025

This document covers UTXO (Unspent Transaction Output) management and coin selection algorithms.

---

## Table of Contents
1. [UTXO Data Structure](#utxo-data-structure)
2. [Coin Selection Algorithms](#coin-selection-algorithms)
3. [UTXO Best Practices](#utxo-best-practices)
4. [Selection Examples](#selection-examples)

---

## UTXO Data Structure

```typescript
interface UTXO {
  txid: string;              // Transaction ID
  vout: number;              // Output index
  value: number;             // Amount in satoshis
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  address: string;           // Address that owns this UTXO
  scriptPubKey: string;      // Hex-encoded script
  derivationPath?: string;   // Our derivation path for this address
}
```

---

## Coin Selection Algorithms

### 1. Largest First (Current Implementation - MVP)

**Strategy**: Select largest UTXOs until target amount + fee is met

```typescript
const selectUTXOs_LargestFirst = (
  utxos: UTXO[],
  targetAmount: number,
  feeRate: number
): { selected: UTXO[]; fee: number; change: number } => {
  const sorted = [...utxos].sort((a, b) => b.value - a.value);

  const selected: UTXO[] = [];
  let total = 0;

  for (const utxo of sorted) {
    selected.push(utxo);
    total += utxo.value;

    // Estimate fee with current inputs + 2 outputs
    const estimatedSize = estimateTxSize(selected.length, 2);
    const fee = estimatedSize * feeRate;

    if (total >= targetAmount + fee) {
      const change = total - targetAmount - fee;
      return { selected, fee, change };
    }
  }

  throw new Error('Insufficient funds');
};
```

**Pros**: Simple, fast
**Cons**: May not be optimal, can select more UTXOs than needed

---

### 2. Randomized Largest-First (Current for Privacy)

**Strategy**: Sort UTXOs by value, randomize top 50%, then select

**Privacy Enhancement**: Prevents transaction graph analysis

**Algorithm**:
```
1. Sort UTXOs by value (descending)
2. Randomize the top 50% of UTXOs
3. Select from randomized set until target + fee is met
4. Minimizes change output when possible
```

**Benefits**:
- Breaks deterministic UTXO selection patterns
- Makes chain analysis harder
- Still relatively efficient

**See**: [PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md](../../plans/PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md) for full details

---

### 3. Branch and Bound (Optimal - Future)

**Strategy**: Find exact match or minimize change

**Algorithm**:
- Try to find exact match (no change output needed)
- If no exact match, minimize change
- Uses backtracking search

**References**: Bitcoin Core implementation (wallet/coinselection.cpp)

**Benefits**:
- Reduces UTXO set bloat
- Lower fees (fewer outputs)
- Better privacy

**Complexity**: O(2^n) worst case, but with pruning is practical

**TODO**: Implement post-MVP for optimization

---

### 4. Smallest First (Privacy-focused - Future)

**Strategy**: Use smallest UTXOs first to consolidate

**Use case**: When consolidating UTXOs during low-fee periods

**Benefits**:
- Reduces total UTXO count
- Good for wallet maintenance
- Lower overall wallet fees

---

## UTXO Best Practices

1. **Avoid dust**: Don't create outputs < 546 satoshis
2. **Consolidation**: Combine small UTXOs when fees are low
3. **Privacy**: Avoid linking addresses unnecessarily
4. **Confirmation depth**: Prefer confirmed UTXOs for spending
5. **Change outputs**: Always generate new address for change

### Dust Handling

```typescript
const DUST_LIMIT = 546; // satoshis

if (change < DUST_LIMIT) {
  fee += change;
  change = 0;
  // Don't add change output
}
```

### Confirmation Depth

**Problem**: Building transaction on unconfirmed parent
**Solution**: Prefer confirmed UTXOs, warn user if using unconfirmed

```typescript
// Filter for confirmed UTXOs
const confirmedUTXOs = utxos.filter(u => u.status.confirmed);

// Fall back to unconfirmed only if necessary
const selectedUTXOs = confirmedUTXOs.length > 0 
  ? selectFromConfirmed(confirmedUTXOs)
  : selectFromAll(utxos);
```

---

## Selection Examples

### Example 1: Simple Selection

**Available UTXOs**:
```
UTXO 1: 50,000 sats (Native SegWit)
UTXO 2: 30,000 sats (Native SegWit)
UTXO 3: 20,000 sats (Native SegWit)
UTXO 4: 10,000 sats (Native SegWit)
Total: 110,000 sats
```

**Target**: Send 40,000 sats at 5 sat/vB

**Selection Process**:

**Iteration 1**: Select UTXO 1 (50,000 sats)
- Inputs: 1, Outputs: 2 (recipient + change)
- Estimated size: 10 + 68 + 62 = 140 vBytes
- Fee: 140 * 5 = 700 sats
- Total needed: 40,000 + 700 = 40,700 sats
- Have: 50,000 sats ✅
- Change: 50,000 - 40,700 = 9,300 sats
- Change >= dust (546)? ✅

**Result**: Use 1 input (UTXO 1)
- Input: 50,000 sats
- Output 1 (recipient): 40,000 sats
- Output 2 (change): 9,300 sats
- Fee: 700 sats
- Total: 40,000 + 9,300 + 700 = 50,000 ✅

---

### Example 2: Multiple Inputs Required

**Available UTXOs**:
```
UTXO 1: 25,000 sats
UTXO 2: 20,000 sats
UTXO 3: 15,000 sats
Total: 60,000 sats
```

**Target**: Send 50,000 sats at 5 sat/vB

**Selection Process**:

**Iteration 1**: Select UTXO 1 (25,000 sats)
- Total: 25,000 sats
- Estimated fee: ~700 sats
- Needed: 50,000 + 700 = 50,700 sats
- Have: 25,000 sats ❌ (insufficient)

**Iteration 2**: Add UTXO 2 (20,000 sats)
- Total: 45,000 sats
- Estimated fee (2 inputs, 2 outputs): ~1,100 sats
- Needed: 50,000 + 1,100 = 51,100 sats
- Have: 45,000 sats ❌ (insufficient)

**Iteration 3**: Add UTXO 3 (15,000 sats)
- Total: 60,000 sats
- Estimated fee (3 inputs, 2 outputs): ~1,400 sats
- Needed: 50,000 + 1,400 = 51,400 sats
- Have: 60,000 sats ✅
- Change: 60,000 - 51,400 = 8,600 sats ✅

**Result**: Use 3 inputs
- Inputs: 60,000 sats
- Output 1: 50,000 sats
- Output 2 (change): 8,600 sats
- Fee: 1,400 sats

---

### Example 3: Dust Handling

**Scenario**: Change would be dust

**Available**: 50,500 sats UTXO
**Target**: Send 50,000 sats at 5 sat/vB

**Calculation with change**:
- Input: 50,500 sats
- Output: 50,000 sats
- Fee (1 input, 2 outputs): 700 sats
- Change: 50,500 - 50,000 - 700 = -200 sats ❌

**Try without change**:
- Fee (1 input, 1 output): 545 sats
- Change: 50,500 - 50,000 - 545 = -45 sats ❌

**Both scenarios fail - need more funds**

**If we had 51,000 sats**:
- Input: 51,000 sats
- Fee (1 input, 2 outputs): 700 sats
- Change: 51,000 - 50,000 - 700 = 300 sats
- Change < dust (546)? ✅ (is dust)

**Solution**: Don't create change output, add to fee
- Input: 51,000 sats
- Output: 50,000 sats
- Fee: 1,000 sats (includes would-be change)
- No change output

---

## Implementation in TransactionBuilder

The `selectUTXOs()` method in `TransactionBuilder` class implements the largest-first algorithm with these features:

1. **Sort by value** (descending)
2. **Iteratively add UTXOs** to selection
3. **Recalculate fee** after each addition
4. **Check coverage**: total >= target + fee
5. **Handle change**:
   - If change >= dust threshold: create change output
   - If change < dust threshold: add to fee (no change output)
6. **Return selection** when criteria met

**Returns**:
```typescript
interface UTXOSelectionResult {
  selectedUtxos: SelectedUTXO[];
  totalInput: number;
  fee: number;
  change: number;
}
```

---

## Future Enhancements

### Advanced Coin Control

**Features**:
- Manual UTXO selection UI
- UTXO tagging and labeling
- Privacy-focused coin management
- Consolidation scheduling during low-fee periods

### Intelligent Selection

**Features**:
- Branch and Bound optimization
- Privacy-preserving selection
- Fee-minimizing strategies
- Consolidation recommendations

### UTXO Management Tools

**Features**:
- UTXO consolidation wizard
- Dust cleanup tools
- Privacy analysis
- Fee optimization suggestions

---

## Privacy Considerations

### Address Reuse Detection

When selecting UTXOs, avoid:
- Combining UTXOs from different accounts unnecessarily
- Revealing address ownership through input clustering
- Creating predictable spending patterns

### Change Address Rotation

**Critical**: Always use a new change address for each transaction

**Why**: Reusing change addresses leaks privacy and links transactions

**Implementation**: Automatically increment `internalIndex` after each transaction

### Round Number Avoidance

**Problem**: Sending exact round numbers (1.0 BTC, 0.5 BTC) reveals user behavior

**Solution**: Add small random amounts to break round numbers (see privacy enhancement plan)

---

## References

### Bitcoin Core
- **Coin Selection**: https://github.com/bitcoin/bitcoin/blob/master/src/wallet/coinselection.cpp
- **Branch and Bound**: https://github.com/bitcoin/bitcoin/pull/10637

### Privacy Resources
- **Bitcoin Privacy Wiki**: https://en.bitcoin.it/wiki/Privacy
- **Wallet Privacy Best Practices**: https://bitcoin.org/en/protect-your-privacy

---

## Related Documentation

- [architecture.md](./architecture.md) - BIP standards, HD wallet structure
- [transactions.md](./transactions.md) - Transaction building, PSBT, fee estimation
- [../../plans/PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md](../../plans/PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md) - Privacy enhancements including randomized UTXO selection
