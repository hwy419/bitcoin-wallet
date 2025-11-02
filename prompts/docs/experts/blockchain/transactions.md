# Transaction Building & PSBT

**Last Updated**: October 22, 2025

This document covers Bitcoin transaction building, PSBT workflows, signature generation, and fee estimation.

---

## Table of Contents
1. [Transaction Structure](#transaction-structure)
2. [Transaction Building Process](#transaction-building-process)
3. [PSBT (BIP174)](#psbt-bip174)
4. [Signature & Verification](#signature--verification)
5. [Fee Estimation](#fee-estimation)
6. [Transaction Size Estimation](#transaction-size-estimation)
7. [TransactionBuilder Class](#transactionbuilder-class)

---

## Transaction Structure

```typescript
interface Transaction {
  version: number;          // Usually 2
  inputs: TxInput[];
  outputs: TxOutput[];
  locktime: number;         // Usually 0 (immediate)
}

interface TxInput {
  hash: Buffer;             // Previous transaction ID (reversed)
  index: number;            // Output index (vout)
  script: Buffer;           // scriptSig (signature script)
  sequence: number;         // Usually 0xffffffff
  witness?: Buffer[];       // For SegWit transactions
}

interface TxOutput {
  value: number;            // Amount in satoshis
  script: Buffer;           // scriptPubKey (locking script)
}
```

---

## Transaction Building Process

**Step-by-step**:
1. Fetch UTXOs for account
2. Select UTXOs (coin selection - see [utxo.md](./utxo.md))
3. Calculate fee based on transaction size
4. Create PSBT (Partially Signed Bitcoin Transaction)
5. Add inputs with witness/redeem scripts
6. Add outputs (recipient + change)
7. Sign inputs
8. Finalize transaction
9. Extract hex for broadcast

---

## PSBT (BIP174)

### Using PSBT (Preferred Method)

```typescript
import * as bitcoin from 'bitcoinjs-lib';

const psbt = new bitcoin.Psbt({ network: bitcoin.networks.testnet });

// Add input (Native SegWit example)
psbt.addInput({
  hash: utxo.txid,
  index: utxo.vout,
  witnessUtxo: {
    script: Buffer.from(utxo.scriptPubKey, 'hex'),
    value: utxo.value,
  },
});

// For P2SH-P2WPKH (SegWit wrapped), also need redeemScript:
psbt.addInput({
  hash: utxo.txid,
  index: utxo.vout,
  witnessUtxo: {
    script: Buffer.from(utxo.scriptPubKey, 'hex'),
    value: utxo.value,
  },
  redeemScript: p2wpkh.output,  // Redeem script for P2SH
});

// Add outputs
psbt.addOutput({
  address: recipientAddress,
  value: amountSatoshis,
});

// Add change output (if needed)
if (changeAmount > DUST_LIMIT) {
  psbt.addOutput({
    address: changeAddress,
    value: changeAmount,
  });
}

// Sign
psbt.signInput(0, keyPair);

// Finalize
psbt.finalizeAllInputs();

// Extract
const txHex = psbt.extractTransaction().toHex();
```

---

## Signature & Verification

### ECDSA Signature (Bitcoin)

**Curve**: secp256k1
**Hash**: SHA-256 (double SHA-256 for transactions)

### Signature Hash Types

```typescript
enum SigHashType {
  ALL = 0x01,              // Sign all inputs and outputs (default)
  NONE = 0x02,             // Sign all inputs, no outputs
  SINGLE = 0x03,           // Sign all inputs, one output
  ANYONECANPAY = 0x80      // Modifier: sign only one input
}
```

**Most Common**: SIGHASH_ALL (sign everything)

### Signing Process

```typescript
// For each input
const signInput = (
  psbt: bitcoin.Psbt,
  inputIndex: number,
  keyPair: bitcoin.ECPairInterface
) => {
  psbt.signInput(inputIndex, keyPair);

  // Verify signature was added correctly
  const validated = psbt.validateSignaturesOfInput(inputIndex);
  if (!validated) {
    throw new Error('Signature validation failed');
  }
};

// Finalize (convert PSBT to final transaction)
psbt.finalizeAllInputs();

// Extract transaction
const tx = psbt.extractTransaction();
const txHex = tx.toHex();
const txId = tx.getId();
```

### Transaction Verification Before Broadcast

```typescript
const verifyTransaction = (psbt: bitcoin.Psbt): boolean => {
  const tx = psbt.extractTransaction();

  // 1. Verify outputs
  let outputSum = 0;
  for (const output of tx.outs) {
    outputSum += output.value;

    // Verify no dust outputs
    if (output.value < 546) {
      throw new Error('Dust output detected');
    }
  }

  // 2. Verify inputs (if we have UTXO data)
  let inputSum = 0;
  for (const input of tx.ins) {
    // Check we have UTXO data for fee verification
    // inputSum += utxo.value;
  }

  // 3. Verify fee is reasonable
  const fee = inputSum - outputSum;
  if (fee < 0) {
    throw new Error('Negative fee (output > input)');
  }

  // 4. Verify no duplicate inputs
  const inputSet = new Set();
  for (const input of tx.ins) {
    const key = `${input.hash.toString('hex')}:${input.index}`;
    if (inputSet.has(key)) {
      throw new Error('Duplicate input');
    }
    inputSet.add(key);
  }

  return true;
};
```

---

## Fee Estimation

### Fee Rates Explained

**Unit**: satoshis per virtual byte (sat/vB)

**Virtual Bytes (vBytes)**:
- For legacy transactions: vBytes = bytes
- For SegWit: vBytes = weight / 4
- Accounts for witness discount

### Fee Categories

```typescript
interface FeeEstimates {
  slow: number;      // 6+ blocks (~1 hour) - 1-2 sat/vB typical
  medium: number;    // 3-6 blocks (~30-60 min) - 3-5 sat/vB typical
  fast: number;      // 1-2 blocks (~10-20 min) - 10+ sat/vB typical
}
```

### Blockstream API Response

```
GET https://blockstream.info/testnet/api/fee-estimates

Response:
{
  "1": 5.5,    // Next block
  "2": 5.0,
  "3": 4.5,
  "6": 3.0,
  "12": 2.0,
  "24": 1.5
}
```

**Mapping**:
- fast = block target 1
- medium = block target 3-6
- slow = block target 6-12

### Fee Calculation

```typescript
const calculateFee = (txSizeVBytes: number, feeRate: number): number => {
  return Math.ceil(txSizeVBytes * feeRate);
};

// Example:
// Transaction: 250 vBytes
// Fee rate: 5 sat/vB
// Total fee: 1,250 satoshis (0.00001250 BTC)
```

### Fee Safety Checks

1. **Minimum fee**: At least 1 sat/vB
2. **Maximum fee**: Warn if > 10% of transaction amount
3. **Dust check**: Ensure change output > dust limit (546 sats)
4. **Fee spike protection**: Warn if fee rate > 100 sat/vB

---

## Transaction Size Estimation

### Size Formula

**Legacy**:
```
Base size: 10 bytes
Input: 148 bytes each
Output: 34 bytes each
Total ≈ 10 + (inputs × 148) + (outputs × 34)
```

**SegWit (P2SH-P2WPKH)**:
```
vBytes ≈ 10 + (inputs × 91) + (outputs × 32)
```

**Native SegWit (P2WPKH)**:
```
vBytes ≈ 10 + (inputs × 68) + (outputs × 31)
```

### Weight Units (for SegWit)

```
vBytes = weight / 4
weight = (base_size × 3) + total_size
```

### Detailed Size Breakdown

#### Legacy (P2PKH) Transaction Size

**Structure**:
```
Version: 4 bytes
Input count: 1 byte
Per input:
  - Previous txid: 32 bytes
  - Previous vout: 4 bytes
  - Script length: 1 byte
  - Script signature: ~107 bytes (signature ~72 + pubkey 33 + opcodes)
  - Sequence: 4 bytes
  Total per input: ~148 bytes

Output count: 1 byte
Per output:
  - Value: 8 bytes
  - Script length: 1 byte
  - Script pubkey: 25 bytes (P2PKH)
  Total per output: 34 bytes

Locktime: 4 bytes

Base overhead: 10 bytes
```

**Formula**: `size = 10 + (inputs * 148) + (outputs * 34)`

**Example**: 1 input, 2 outputs = 10 + 148 + 68 = **226 bytes**

#### Native SegWit (P2WPKH) Transaction Size

**Weight Calculation**:
```
base_size = 10 + (inputs * 41) + (outputs * 31)
witness_size = inputs * 108
total_size = base_size + witness_size
weight = base_size * 3 + total_size
vBytes = ceil(weight / 4)
```

**Example**: 1 input, 2 outputs
- base_size = 10 + 41 + 62 = 113
- witness_size = 108
- total_size = 221
- weight = 113 * 3 + 221 = 560
- vBytes = ceil(560 / 4) = **140 vBytes**

### Fee Comparison Example

**Scenario**: Send 0.001 BTC with 1 input, 2 outputs (recipient + change)
**Fee Rate**: 5 sat/vB

**Legacy**:
- Size: 226 bytes
- Fee: 226 * 5 = **1,130 sats** (0.00001130 BTC)

**SegWit (P2SH)**:
- vBytes: 165
- Fee: 165 * 5 = **825 sats** (0.00000825 BTC)
- Savings: 27% vs Legacy

**Native SegWit**:
- vBytes: 140
- Fee: 140 * 5 = **700 sats** (0.00000700 BTC)
- Savings: 38% vs Legacy, 15% vs SegWit

---

## TransactionBuilder Class

**File**: `src/background/bitcoin/TransactionBuilder.ts`

**Purpose**: Build, sign, and finalize Bitcoin transactions for all address types

**Implemented**: October 12, 2025

### Constructor

```typescript
new TransactionBuilder(network: 'testnet' | 'mainnet' = 'testnet')
```

### Key Features

1. **UTXO Selection**: Greedy algorithm (largest-first)
2. **Size Estimation**: Accurate vBytes calculation for all address types
3. **Fee Calculation**: Dynamic fee based on transaction size and fee rate
4. **PSBT Building**: Full PSBT construction with proper witness data
5. **Multi-input Signing**: Supports Legacy, SegWit, and Native SegWit
6. **Transaction Verification**: Pre-broadcast validation

---

### Core Methods

#### buildTransaction()

**Purpose**: Main entry point - builds and signs complete transaction

**Parameters**:
```typescript
interface BuildTransactionParams {
  utxos: UTXO[];                              // Available UTXOs
  outputs: { address: string; amount: number }[];  // Recipients
  changeAddress: string;                       // Change address
  feeRate: number;                            // sat/vB
  getPrivateKey: (path: string) => Buffer;    // Key retrieval
  getAddressType: (addr: string) => AddressType;   // Address type detector
  getDerivationPath: (addr: string) => string;     // Path lookup
}
```

**Returns**:
```typescript
interface BuildTransactionResult {
  txHex: string;          // Ready for broadcast
  txid: string;           // Transaction ID
  fee: number;            // Fee in satoshis
  size: number;           // Size in bytes
  virtualSize: number;    // vBytes (for SegWit)
  inputs: SelectedUTXO[]; // UTXOs used
  outputs: TxOutput[];    // All outputs (including change)
}
```

**Process Flow**:
1. Validate all parameters and addresses
2. Calculate total output amount
3. Enrich UTXOs with derivation paths and address types
4. Select UTXOs to cover amount + estimated fee
5. Build PSBT with inputs and outputs
6. Sign all inputs with correct method per address type
7. Finalize PSBT and extract transaction
8. Verify transaction integrity
9. Return complete transaction data

---

#### estimateSize()

**Purpose**: Calculate transaction size and virtual size

**Method**:
```typescript
estimateSize(params: {
  numInputs: number;
  numOutputs: number;
  inputTypes: AddressType[];
}): SizeEstimate
```

**Returns**:
- `size`: Raw size in bytes
- `virtualSize`: vBytes (weight / 4) for SegWit, same as size for Legacy

**Accuracy**: Within ±5% of actual transaction size

---

#### estimateFee()

**Purpose**: Calculate fee in satoshis

**Formula**:
```
fee = ceil(virtualSize * feeRate)
fee = max(fee, MIN_RELAY_FEE * virtualSize)
```

**Minimum Fee**: Enforces minimum relay fee (1 sat/vB)

---

### Dust Handling Example

**Scenario**: Send 49,500 sats from 50,000 sats UTXO at 5 sat/vB

**Calculation**:
- Input: 50,000 sats
- Output: 49,500 sats
- Estimated fee (with change): 700 sats
- Change: 50,000 - 49,500 - 700 = -200 sats ❌ (not enough)

**Try without change output**:
- Inputs: 1, Outputs: 1 (recipient only)
- Estimated size: 10 + 68 + 31 = 109 vBytes
- Fee: 109 * 5 = 545 sats
- Change: 50,000 - 49,500 - 545 = -45 sats ❌

**Need more funds**: Select another UTXO

**With UTXO 2 added** (30,000 sats):
- Total input: 80,000 sats
- Estimated size (2 inputs, 2 outputs): 10 + 136 + 62 = 208 vBytes
- Fee: 208 * 5 = 1,040 sats
- Change: 80,000 - 49,500 - 1,040 = 29,460 sats ✅
- Change >= dust? ✅

---

## Security Considerations

1. **Private Key Exposure**:
   - Keys only in memory during signing
   - Never logged or persisted
   - Cleared immediately after use

2. **Address Validation**:
   - All recipient addresses validated before building
   - Change address validated
   - Network mismatch detected (testnet/mainnet)

3. **Amount Validation**:
   - Check for dust outputs
   - Verify amounts are positive
   - Ensure sufficient funds

4. **Fee Validation**:
   - Minimum relay fee enforced
   - Maximum fee rate check (>1000 sat/vB warning)
   - Fee reasonableness check (warns if >10% of amount)

5. **Transaction Verification**:
   - No duplicate inputs
   - Input sum = output sum + fee
   - No negative fees
   - Signatures validated before finalization

---

## Common Error Scenarios

**Insufficient Funds**:
```
Error: Insufficient funds. Have 30000 satoshis, need 50000 satoshis plus fees
```

**Invalid Address**:
```
Error: Invalid recipient address: invalid_address_here
```

**Dust Output**:
```
Error: Output amount 300 is below dust threshold (546 satoshis)
```

**Fee Too High**:
```
Error: Fee rate too high (>1000 sat/vB) - possible mistake
```

**Signature Validation Failed**:
```
Error: Signature validation failed for input 0
```

---

## Testing

### Unit Tests

1. ✅ UTXO selection with sufficient funds
2. ✅ UTXO selection with insufficient funds (should throw)
3. ✅ Size estimation for Legacy
4. ✅ Size estimation for SegWit
5. ✅ Size estimation for Native SegWit
6. ✅ Fee calculation for different sizes
7. ✅ Dust handling (change < dust threshold)
8. ✅ Change output creation (change >= dust threshold)
9. ✅ Multiple inputs selection
10. ✅ Transaction verification checks

### Integration Tests

1. Build transaction with Legacy inputs
2. Build transaction with SegWit inputs
3. Build transaction with Native SegWit inputs
4. Build transaction with mixed input types
5. Build transaction with multiple outputs
6. Sign transaction with correct keys
7. Finalize and extract transaction hex

### Testnet Tests

1. Build real transaction on testnet
2. Sign transaction
3. Broadcast transaction
4. Verify transaction in explorer
5. Check correct fee calculation
6. Verify UTXO selection efficiency

---

## References

### Official Specifications
- **BIP174**: PSBT Format - https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki
- **BIP141**: SegWit Specification - https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki
- **BIP143**: SegWit Transaction Signing - https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki

### Tools
- **Testnet Explorer**: https://blockstream.info/testnet/
- **Bitcoin Developer Guide**: https://developer.bitcoin.org/devguide/
- **Blockstream Esplora API**: https://github.com/Blockstream/esplora/blob/master/API.md

---

## Related Documentation

- [architecture.md](./architecture.md) - BIP standards, HD wallet structure
- [addresses.md](./addresses.md) - Address generation and validation
- [utxo.md](./utxo.md) - UTXO selection algorithms
- [multisig.md](./multisig.md) - Multisig PSBT workflows
