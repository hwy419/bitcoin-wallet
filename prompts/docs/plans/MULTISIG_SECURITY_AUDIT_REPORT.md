# Multi-Signature Wallet Security Audit Report

**Audit Date**: October 13, 2025
**Auditor**: Security Expert
**Project**: Bitcoin Wallet Chrome Extension - Multi-Signature Features
**Audit Scope**: Complete multi-signature implementation (v0.8.0)
**Audit Duration**: Comprehensive review

---

## Executive Summary

**OVERALL SECURITY RATING**: ✅ **GOOD** with **CRITICAL UI/UX SECURITY ISSUES**

**Findings Summary**:
- **Critical**: 1 (Address verification UI placeholder)
- **High**: 3 (Key management, PSBT validation, storage security)
- **Medium**: 4 (Error handling, PSBT integrity, signature tracking, rate limiting)
- **Low**: 2 (Logging, documentation)
- **Total**: 10 security issues identified

**Recommendation**: **CONDITIONAL APPROVAL** - Address Critical and High severity issues before production release.

---

## 1. Key Management Security Review

### 1.1 Private Key Handling During PSBT Signing

**File**: `src/background/index.ts` (Lines 1398-1509)
**Handler**: `handleSignMultisigTransaction()`

#### Security Analysis

**✅ GOOD PRACTICES IDENTIFIED**:
1. **Wallet Lock Check**: Verifies wallet is unlocked before signing (Line 1403-1406)
2. **Private Key Derivation**: Uses standard BIP48 derivation path (Line 1471-1476)
3. **Signature Validation**: Validates signatures after signing (Line 1515-1027)

**❌ HIGH SEVERITY ISSUE #1: Private Key Memory Management**

```typescript
// Line 1471-1477: Private key derived but not explicitly cleared
const ourNode = state.hdWallet!.derivePath(ourCosigner.derivationPath);
if (!ourNode.privateKey) {
  return { success: false, error: 'Failed to derive private key' };
}

// Line 1481-1485: Private key used for signing
const signedPsbt = await transactionBuilder.signMultisigPSBT(
  psbt,
  cosignerPubkeys,
  ourNode.privateKey  // ← Private key passed as Buffer
);
```

**Issue**: The derived private key (`ourNode.privateKey`) is:
- Not explicitly cleared from memory after signing
- Remains in `ourNode` object until garbage collected
- Could persist in memory after transaction signing

**Attack Vector**:
```
1. User signs multisig transaction
2. Private key derived into ourNode.privateKey
3. Signing completes successfully
4. Private key still in memory (not cleared)
5. Attacker with memory access could extract key
6. Service worker terminated but memory not wiped
```

**Risk**: **HIGH**
- **Likelihood**: Low (requires local memory access)
- **Impact**: Critical (permanent fund loss if key extracted)

**Recommended Fix**:
```typescript
// After signing, explicitly clear the private key
const ourNode = state.hdWallet!.derivePath(ourCosigner.derivationPath);
if (!ourNode.privateKey) {
  return { success: false, error: 'Failed to derive private key' };
}

try {
  const signedPsbt = await transactionBuilder.signMultisigPSBT(
    psbt,
    cosignerPubkeys,
    ourNode.privateKey
  );

  // ... rest of signing logic ...

  return { success: true, data: { psbtBase64, signaturesAdded } };
} finally {
  // CRITICAL: Clear private key from memory
  if (ourNode.privateKey) {
    ourNode.privateKey.fill(0);
  }
}
```

---

**❌ HIGH SEVERITY ISSUE #2: Private Key in TransactionBuilder**

**File**: `src/background/bitcoin/TransactionBuilder.ts` (Lines 983-1042)
**Method**: `signMultisigPSBT()`

```typescript
// Line 986: Private key passed as parameter
async signMultisigPSBT(
  psbt: bitcoin.Psbt,
  publicKeys: Buffer[],
  privateKey: Buffer  // ← Remains in memory
): Promise<bitcoin.Psbt> {
  // ...
  const keyPair = ECPair.fromPrivateKey(privateKey, {
    network: this.network,
  });
  // ... signing logic ...
  return psbt;
}
```

**Issue**:
- Private key buffer is never explicitly cleared
- Remains in function scope until garbage collected
- No guarantee of when/if memory is zeroed

**Recommended Fix**:
```typescript
async signMultisigPSBT(
  psbt: bitcoin.Psbt,
  publicKeys: Buffer[],
  privateKey: Buffer
): Promise<bitcoin.Psbt> {
  try {
    // Sort public keys per BIP67
    const sortedPubkeys = sortPublicKeys(publicKeys);

    // Create ECPair from private key
    const keyPair = ECPair.fromPrivateKey(privateKey, {
      network: this.network,
    });

    // ... signing logic ...

    return psbt;
  } finally {
    // CRITICAL: Zero out private key parameter
    // Note: This modifies caller's buffer, which is intentional
    privateKey.fill(0);
  }
}
```

---

### 1.2 Auto-Lock and Memory Clearing

**Status**: ✅ **PARTIALLY IMPLEMENTED**

**Review**: `src/background/index.ts` (Lines 460-493)

```typescript
async function handleLockWallet(): Promise<MessageResponse> {
  try {
    // Clear sensitive data from memory
    if (state.decryptedSeed) {
      state.decryptedSeed = '';  // ✅ Cleared
      state.decryptedSeed = null;
    }

    state.isUnlocked = false;
    state.hdWallet = null;  // ✅ HDWallet reference cleared
    state.addressGenerator = null;

    // ...
  }
}
```

**Assessment**:
- ✅ Seed phrase is cleared on lock
- ✅ HDWallet instance reference cleared
- ⚠️ **BUT**: Any derived private keys in transaction signing are NOT cleared
- ⚠️ **BUT**: No explicit zeroization of HDWallet internal buffers

**Recommendation**: Implement comprehensive memory clearing utility:

```typescript
/**
 * Recursively clear sensitive data from BIP32 nodes
 */
function clearBIP32Node(node: BIP32Interface | null): void {
  if (!node) return;

  // Clear private key if present
  if (node.privateKey) {
    node.privateKey.fill(0);
    delete (node as any).privateKey;
  }

  // Clear chain code (also sensitive)
  if ((node as any).chainCode) {
    (node as any).chainCode.fill(0);
  }
}

async function handleLockWallet(): Promise<MessageResponse> {
  try {
    // Clear sensitive data from memory
    if (state.decryptedSeed) {
      state.decryptedSeed = '';
      state.decryptedSeed = null;
    }

    // ENHANCED: Clear HDWallet internals
    if (state.hdWallet) {
      try {
        const masterNode = (state.hdWallet as any).masterNode;
        clearBIP32Node(masterNode);
      } catch (e) {
        console.warn('Failed to clear HDWallet internals');
      }
    }

    state.isUnlocked = false;
    state.hdWallet = null;
    state.addressGenerator = null;

    // ... rest of lock logic ...
  }
}
```

---

## 2. Xpub Exchange Security Review

### 2.1 Xpub Validation

**File**: `src/background/wallet/MultisigManager.ts` (Lines 215-243)
**Method**: `validateXpub()`

#### Security Analysis

**✅ EXCELLENT - All Critical Checks Present**:

1. **Private Key Detection** (Lines 221-224):
```typescript
if (node.privateKey) {
  throw new Error('Provided key is a private key (xprv), not a public key (xpub)');
}
```
✅ **Prevents accidental xprv sharing** - Critical for security

2. **Network Prefix Validation** (Lines 227-235):
```typescript
const expectedPrefix = this.networkName === 'testnet'
  ? ['tpub', 'vpub', 'upub']
  : ['xpub', 'ypub', 'zpub'];

if (!hasCorrectPrefix) {
  throw new Error(
    `Extended public key has wrong network prefix. ` +
    `Expected ${expectedPrefix.join('/')}, got ${xpub.substring(0, 4)}`
  );
}
```
✅ **Prevents mainnet/testnet mixing** - Critical for fund safety

3. **Format Validation** (Line 219):
```typescript
const node = bip32.fromBase58(xpub, this.network);
```
✅ **Validates Base58 encoding and checksum** - bitcoinjs-lib handles this

**Risk Assessment**: ✅ **LOW RISK** - Comprehensive validation implemented

---

### 2.2 Fingerprint Verification

**File**: `src/background/wallet/MultisigManager.ts` (Lines 295-318)
**Method**: `exportOurXpub()`

```typescript
// Line 311: Fingerprint generation
const fingerprint = accountNode.fingerprint.toString('hex').toUpperCase();

return { xpub, fingerprint };
```

**✅ GOOD**: Uses bitcoinjs-lib's built-in fingerprint calculation (HASH160 of public key)

**❌ MEDIUM SEVERITY ISSUE #3: No Checksum for Fingerprint**

**Issue**:
- Fingerprint is 8 hex characters (4 bytes)
- No checksum or validation mechanism
- Typos during manual verification could go undetected

**Attack Scenario**:
```
1. Attacker performs MITM during xpub exchange
2. Changes last character of fingerprint (F3 → F2)
3. User reads fingerprint aloud over phone: "A1B2C3F2"
4. Co-signer mishears as "A1B2C3F3" and confirms
5. Attacker's malicious xpub accepted
```

**Recommended Enhancement**:
```typescript
/**
 * Generate fingerprint with checksum for verbal verification
 * Format: XXXX-XXXX-CC where CC is checksum
 */
export function generateVerifiableFingerprint(
  fingerprint: string
): { fingerprint: string; displayFormat: string; checksum: string } {
  // Calculate checksum (last 2 hex chars of SHA256)
  const hash = crypto.subtle.digest(
    'SHA-256',
    Buffer.from(fingerprint, 'hex')
  );
  const checksum = Buffer.from(hash).toString('hex').slice(-2).toUpperCase();

  // Format for display: XXXX-XXXX-CC
  const formatted =
    `${fingerprint.slice(0, 4)}-${fingerprint.slice(4, 8)}-${checksum}`;

  return {
    fingerprint,
    displayFormat: formatted,
    checksum
  };
}
```

---

### 2.3 Cosigner Import Validation

**File**: `src/background/index.ts` (Lines 1219-1248)
**Handler**: `handleImportCosignerXpub()`

**✅ GOOD PRACTICES**:
1. Validates xpub is present (Line 1224-1228)
2. Validates name is present (Line 1224-1228)
3. Calls `multisigManager.importCosignerXpub()` which validates xpub

**⚠️ MISSING**: No duplicate detection at import time

**Recommended Enhancement**:
```typescript
async function handleImportCosignerXpub(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.xpub || !payload.name) {
      return { success: false, error: 'xpub and name are required' };
    }

    const { xpub, name } = payload;

    // ENHANCEMENT: Check for duplicate xpub in session
    // (This is validated again during account creation, but early detection helps UX)
    if (sessionStorage.has(xpub)) {
      return {
        success: false,
        error: 'This xpub has already been imported. Each co-signer must use a unique key.'
      };
    }

    // Import and validate the xpub
    const cosignerData = multisigManager.importCosignerXpub(xpub, name);

    console.log(`Imported cosigner xpub: ${name} (${cosignerData.fingerprint})`);

    return { success: true, data: { cosigner: cosignerData } };
  } catch (error) {
    console.error('Failed to import cosigner xpub:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import cosigner xpub',
    };
  }
}
```

---

## 3. PSBT Security Review

### 3.1 PSBT Import and Validation

**File**: `src/background/bitcoin/PSBTManager.ts` (Lines 168-232)
**Method**: `importPSBT()`

#### Security Analysis

**✅ EXCELLENT VALIDATIONS**:

1. **Format Validation** (Lines 174-180):
```typescript
if (/^[A-Za-z0-9+/=]+$/.test(psbtString)) {
  psbt = bitcoin.Psbt.fromBase64(psbtString, { network: this.network });
} else if (/^[0-9a-fA-F]+$/.test(psbtString)) {
  psbt = bitcoin.Psbt.fromHex(psbtString, { network: this.network });
}
```
✅ **Regex validation before parsing** - Prevents injection attacks

2. **UTXO Data Check** (Lines 189-195):
```typescript
if (!input.witnessUtxo && !input.nonWitnessUtxo) {
  warnings.push(`Input ${i}: Missing UTXO data (witnessUtxo or nonWitnessUtxo)`);
}
```
✅ **Ensures fee calculation possible** - Prevents fee manipulation

3. **Output Validation** (Lines 207-215):
```typescript
if (tx.outs.length === 0) {
  warnings.push('Transaction has no outputs');
}

for (let i = 0; i < tx.outs.length; i++) {
  if (tx.outs[i].value <= 0) {
    warnings.push(`Output ${i}: Invalid value (${tx.outs[i].value})`);
  }
}
```
✅ **Prevents zero/negative outputs** - Protects against donation attacks

---

**❌ HIGH SEVERITY ISSUE #3: Incomplete PSBT Validation**

**Missing Validations**:

1. **No Maximum Fee Check**:
```typescript
// MISSING: Check if fee is reasonable
const totalInput = calculateTotalInput(psbt);
const totalOutput = calculateTotalOutput(psbt);
const fee = totalInput - totalOutput;

// This check is MISSING
if (fee > totalOutput * 0.5) {  // Fee > 50% of output
  warnings.push(`WARNING: Fee is extremely high (${fee} sats, ${(fee/totalOutput*100).toFixed(1)}% of output)`);
}
```

2. **No Address Network Validation**:
```typescript
// MISSING: Verify all addresses match wallet network
for (const output of tx.outs) {
  try {
    const address = bitcoin.address.fromOutputScript(output.script, this.network);
    // Validate address is for correct network
    const isTestnet = address.startsWith('tb1') || address.startsWith('2') || address.startsWith('m') || address.startsWith('n');
    const isMainnet = address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3');

    if (this.networkName === 'testnet' && !isTestnet) {
      warnings.push(`Output address ${address} appears to be mainnet, but wallet is on testnet!`);
    }
    if (this.networkName === 'mainnet' && !isMainnet) {
      warnings.push(`Output address ${address} appears to be testnet, but wallet is on mainnet!`);
    }
  } catch (e) {
    // Invalid output script - already handled
  }
}
```

**Recommended Fix**: See file `src/background/bitcoin/PSBTManager.ts`, enhance `importPSBT()`:

```typescript
importPSBT(psbtString: string): PSBTImportResult {
  const warnings: string[] = [];
  let psbt: bitcoin.Psbt;

  // ... existing format validation ...

  // Validate PSBT structure
  try {
    // ... existing UTXO validation ...

    // NEW: Validate fee reasonability
    const tx = psbt.extractTransaction(true);
    let totalInput = 0;
    let totalOutput = 0;

    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const input = psbt.data.inputs[i];
      if (input.witnessUtxo) {
        totalInput += input.witnessUtxo.value;
      } else if (input.nonWitnessUtxo) {
        const inputTx = bitcoin.Transaction.fromBuffer(input.nonWitnessUtxo);
        const prevOut = inputTx.outs[psbt.txInputs[i].index];
        totalInput += prevOut.value;
      }
    }

    for (const output of tx.outs) {
      totalOutput += output.value;
    }

    const fee = totalInput - totalOutput;

    // CRITICAL: Check for excessive fees
    if (fee < 0) {
      warnings.push(`ERROR: Negative fee (${fee} sats) - outputs exceed inputs!`);
    }

    if (totalOutput > 0 && fee > totalOutput * 0.5) {
      warnings.push(
        `WARNING: Fee is extremely high (${fee} sats, ${(fee/totalOutput*100).toFixed(1)}% of output). ` +
        `This may indicate a transaction manipulation attack.`
      );
    }

    // NEW: Validate address network
    for (let i = 0; i < tx.outs.length; i++) {
      try {
        const address = bitcoin.address.fromOutputScript(tx.outs[i].script, this.network);

        // Check network match
        const addressNetwork = this.detectAddressNetwork(address);
        if (addressNetwork !== this.networkName) {
          warnings.push(
            `CRITICAL: Output ${i} address ${address} is for ${addressNetwork}, ` +
            `but wallet is on ${this.networkName}! DO NOT SIGN!`
          );
        }
      } catch (e) {
        // Cannot parse address - already warned about
      }
    }

    return {
      psbt,
      txid: tx.getId(),
      warnings,
      isValid: warnings.filter(w => w.startsWith('ERROR') || w.startsWith('CRITICAL')).length === 0,
    };
  } catch (error) {
    warnings.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      psbt,
      txid: 'unknown',
      warnings,
      isValid: false,
    };
  }
}

/**
 * Detect network from address format
 */
private detectAddressNetwork(address: string): 'testnet' | 'mainnet' {
  if (address.startsWith('tb1') || address.startsWith('2') ||
      address.startsWith('m') || address.startsWith('n')) {
    return 'testnet';
  }
  if (address.startsWith('bc1') || address.startsWith('1') ||
      address.startsWith('3')) {
    return 'mainnet';
  }
  throw new Error('Unknown address format');
}
```

---

### 3.2 Multisig PSBT Validation

**File**: `src/background/bitcoin/PSBTManager.ts` (Lines 422-513)
**Method**: `validateMultisigPSBT()`

**✅ EXCELLENT VALIDATIONS**:

1. **Script Parameter Validation** (Lines 458-468):
```typescript
const m = bitcoin.script.number.decode(decompiled[0] as Buffer);
const n = bitcoin.script.number.decode(decompiled[decompiled.length - 2] as Buffer);

if (m !== expectedM) {
  errors.push(`Input ${i}: Expected M=${expectedM}, got M=${m}`);
}

if (n !== expectedN) {
  errors.push(`Input ${i}: Expected N=${expectedN}, got N=${n}`);
}
```
✅ **Prevents M-of-N parameter manipulation** - Critical security check

2. **Address Validation** (Lines 476-502):
```typescript
if (expectedAddresses && expectedAddresses.length > 0) {
  // Validates inputs come from expected addresses
}
```
✅ **Prevents wrong wallet spending** - Good optional check

**Risk Assessment**: ✅ **LOW RISK** - Comprehensive validation for multisig parameters

---

### 3.3 PSBT Signing Security

**File**: `src/background/bitcoin/TransactionBuilder.ts` (Lines 983-1042)
**Method**: `signMultisigPSBT()`

**✅ GOOD PRACTICES**:
1. **BIP67 Key Sorting** (Line 990): Ensures deterministic signing
2. **Signature Validation** (Lines 1015-1027): Validates each signature after signing
3. **Duplicate Signing Prevention** (Lines 1028-1034): Skips already-signed inputs

**⚠️ POTENTIAL ISSUE**: Private key handling (see Issue #2 above)

---

## 4. Address Generation Security Review

### 4.1 BIP48 Derivation Path Implementation

**File**: `src/background/wallet/MultisigManager.ts` (Lines 260-284)
**Method**: `getDerivationPath()`

```typescript
getDerivationPath(
  config: MultisigConfig,
  addressType: MultisigAddressType,
  accountIndex: number
): string {
  const coinType = this.networkName === 'mainnet' ? 0 : 1;

  // Determine script type
  let scriptType: number;
  switch (addressType) {
    case 'p2sh':
      scriptType = 1;
      break;
    case 'p2wsh':
      scriptType = 2;
      break;
    case 'p2sh-p2wsh':
      scriptType = 1;  // P2SH wrapped
      break;
    default:
      throw new Error(`Unsupported address type: ${addressType}`);
  }

  return `m/48'/${coinType}'/${accountIndex}'/${scriptType}'`;
}
```

**✅ EXCELLENT**:
- Correct BIP48 format: `m/48'/coin_type'/account'/script_type'`
- Correct coin type: 1 for testnet, 0 for mainnet
- Correct script type mapping:
  - P2SH = 1
  - P2WSH = 2
  - P2SH-P2WSH = 1 (wrapped)

**Risk Assessment**: ✅ **NO ISSUES** - BIP48 correctly implemented

---

### 4.2 BIP67 Key Sorting

**File**: `src/background/wallet/utils/bip67.ts` (Lines 49-260)

**✅ EXCELLENT IMPLEMENTATION**:

1. **Lexicographic Sorting** (Lines 106-115):
```typescript
keysWithHex.sort((a, b) => {
  if (a.hex < b.hex) return -1;
  if (a.hex > b.hex) return 1;
  return 0;
});
```
✅ **Deterministic** - Always produces same result

2. **Public Key Validation** (Lines 61-97):
```typescript
// Validates compressed (33 bytes) and uncompressed (65 bytes) keys
// Validates prefix bytes (0x02, 0x03 for compressed, 0x04 for uncompressed)
```
✅ **Comprehensive** - Rejects invalid keys

3. **Duplicate Detection** (Lines 252-260):
```typescript
const hexSet = new Set<string>();
for (const key of publicKeys) {
  const hex = key.toString('hex');
  if (hexSet.has(hex)) {
    throw new Error('Duplicate public key detected');
  }
  hexSet.add(hex);
}
```
✅ **Critical Security Check** - Prevents duplicate key attacks

**Risk Assessment**: ✅ **NO ISSUES** - BIP67 correctly implemented

---

### 4.3 Address Verification Flow

**File**: `src/popup/components/MultisigSetup/AddressVerification.tsx`

**⚠️ CRITICAL SEVERITY ISSUE #1: Address Generation is Placeholder**

```typescript
// Lines 96-98: THIS IS A PLACEHOLDER!
const address = `tb1qrp33g0q5c5txsp9arj34r4mf8d9gf8d9gf8d9gf`;  // Placeholder
const path = `m/48'/1'/0'/${addressType === 'p2wsh' ? '2' : addressType === 'p2sh-p2wsh' ? '1' : '0'}'/0/0`;
```

**CRITICAL FLAW**:
- Address is HARDCODED, not actually generated from xpubs
- All users will see the SAME placeholder address
- Address verification ceremony will falsely succeed (all parties see same placeholder)
- Funds sent to this address are LOST (no one has private keys)

**Attack Vector**:
```
1. Users complete multisig setup with placeholder address
2. All parties see same address (hardcoded placeholder)
3. Verification appears to succeed (all match!)
4. User sends real funds to placeholder address
5. NO ONE has private keys for placeholder address
6. Funds are PERMANENTLY LOST
```

**Risk**: **CRITICAL**
- **Likelihood**: HIGH (code is shipped as-is)
- **Impact**: CRITICAL (complete and permanent fund loss)

**REQUIRED FIX** (BEFORE PRODUCTION RELEASE):

```typescript
// Generate REAL first multisig address from xpubs
useEffect(() => {
  const generateAddress = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build sorted public keys from all cosigners
      const allCosigners = [
        { name: 'You', xpub: myXpub, fingerprint: myFingerprint, isSelf: true },
        ...cosigners
      ];

      // Derive first public key (0/0) from each xpub
      const publicKeys: Buffer[] = [];
      for (const cosigner of allCosigners) {
        const xpubNode = bip32.fromBase58(cosigner.xpub, network);
        const childNode = xpubNode.derive(0).derive(0);  // m/48'/1'/0'/2'/0/0
        publicKeys.push(childNode.publicKey);
      }

      // Sort keys per BIP67
      const sortedKeys = sortPublicKeys(publicKeys);

      // Create multisig payment
      const configDetails = getConfigDetails(config);  // Get M and N
      const payment = bitcoin.payments.p2wsh({  // Or p2sh based on addressType
        redeem: bitcoin.payments.p2ms({
          m: configDetails.m,
          pubkeys: sortedKeys,
          network,
        }),
        network,
      });

      if (!payment.address) {
        throw new Error('Failed to generate multisig address');
      }

      const address = payment.address;
      const derivationPath = `m/48'/1'/0'/${addressType === 'p2wsh' ? '2' : '1'}'/0/0`;

      setFirstAddress(address);
      setDerivationPath(derivationPath);
      onAddressGenerated(address);

      // Generate QR code
      await generateQR(address, { width: 200 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate address');
    } finally {
      setIsLoading(false);
    }
  };

  generateAddress();
}, [config, addressType, myXpub, cosigners, network, generateQR, onAddressGenerated]);
```

**THIS MUST BE FIXED BEFORE ANY PRODUCTION RELEASE**

---

## 5. Storage Security Review

### 5.1 Pending PSBT Storage

**File**: `src/background/index.ts` (Lines 1681-1804)
**Handler**: `handleSavePendingMultisigTx()`

**✅ GOOD PRACTICES**:
1. **PSBT Validation Before Storage** (Lines 1702-1709): Validates PSBT is valid
2. **Account Validation** (Lines 1712-1728): Ensures account exists and is multisig
3. **Signature Status Tracking** (Lines 1732-1741): Tracks who has signed

**❌ HIGH SEVERITY ISSUE #4: Pending PSBTs Stored Unencrypted**

```typescript
// Lines 1790: Stored in plaintext in chrome.storage.local
await chrome.storage.local.set({ wallet: walletV2 });
```

**Issue**:
- Pending PSBTs contain:
  - UTXO information (reveals balance)
  - Destination addresses (reveals transaction intent)
  - Transaction amounts (reveals spending patterns)
- All stored in PLAINTEXT in chrome.storage.local
- Accessible to malware or physical attacks

**Privacy Risk**: **HIGH**
- **Likelihood**: Medium (malware or physical access)
- **Impact**: High (privacy loss, transaction intent revealed)

**Recommended Fix**:
```typescript
/**
 * Encrypt pending multisig transaction before storage
 */
async function encryptPendingTx(
  pendingTx: PendingMultisigTx,
  password: string
): Promise<EncryptedPendingTx> {
  // Encrypt PSBT and metadata
  const data = JSON.stringify({
    psbtBase64: pendingTx.psbtBase64,
    metadata: pendingTx.metadata,
  });

  const encrypted = await CryptoUtils.encrypt(data, password);

  return {
    id: pendingTx.id,
    accountId: pendingTx.accountId,
    created: pendingTx.created,
    expiresAt: pendingTx.expiresAt,
    multisigConfig: pendingTx.multisigConfig,
    signaturesCollected: pendingTx.signaturesCollected,
    signaturesRequired: pendingTx.signaturesRequired,
    signatureStatus: pendingTx.signatureStatus,
    encrypted: encrypted.encryptedData,
    salt: encrypted.salt,
    iv: encrypted.iv,
  };
}

/**
 * Decrypt pending multisig transaction
 */
async function decryptPendingTx(
  encrypted: EncryptedPendingTx,
  password: string
): Promise<PendingMultisigTx> {
  const decrypted = await CryptoUtils.decrypt(
    encrypted.encrypted,
    password,
    encrypted.salt,
    encrypted.iv
  );

  const data = JSON.parse(decrypted);

  return {
    id: encrypted.id,
    accountId: encrypted.accountId,
    created: encrypted.created,
    expiresAt: encrypted.expiresAt,
    multisigConfig: encrypted.multisigConfig,
    signaturesCollected: encrypted.signaturesCollected,
    signaturesRequired: encrypted.signaturesRequired,
    signatureStatus: encrypted.signatureStatus,
    psbtBase64: data.psbtBase64,
    metadata: data.metadata,
  };
}
```

---

### 5.2 Multisig Account Storage

**File**: `src/background/wallet/WalletStorage.ts` (Lines 370-395)
**Method**: `addAccount()`

**✅ GOOD**:
- Validates account structure (Lines 372-377)
- Checks for duplicate accounts (Lines 381-384)
- Type-safe storage operations

**✅ NO ISSUES**: Multisig accounts stored safely (xpubs are public data)

---

## 6. UI Security Review

### 6.1 Address Verification UI

**File**: `src/popup/components/MultisigSetup/AddressVerification.tsx`

**✅ GOOD SECURITY PRACTICES**:

1. **Verification Checklist** (Lines 241-307):
```typescript
<label className="flex items-start gap-3 cursor-pointer">
  <input
    type="checkbox"
    checked={checklist.fingerprintsVerified}
    onChange={(e) => setChecklist({ ...checklist, fingerprintsVerified: e.target.checked })}
  />
  <span>Verified all fingerprints match via phone/video call</span>
</label>
```
✅ **Forces conscious verification** - User must check boxes

2. **Critical Warnings** (Lines 169-181):
```typescript
<div className="p-4 bg-red-500/15 border-2 border-red-500 rounded-lg">
  <p className="font-bold text-lg text-red-400 mb-2">CRITICAL STEP</p>
  <p className="text-sm text-red-300">
    All co-signers MUST see the <strong>EXACT SAME address</strong>.
  </p>
</div>
```
✅ **Clear security warnings** - Prominent and serious

3. **Final Confirmation** (Lines 342-353):
```typescript
<label className="flex items-start gap-3 p-4 bg-gray-850 border-2 border-bitcoin">
  <input type="checkbox" checked={finalConfirmation} />
  <span className="text-sm font-medium text-white">
    I have verified this address matches with all co-signers
  </span>
</label>
```
✅ **Explicit confirmation required** - Cannot proceed without checking

**❌ BUT**: See Critical Issue #1 above - actual address generation is placeholder

---

**⚠️ MEDIUM SEVERITY ISSUE #4: Verification Can Be Skipped**

**Issue**: While the UI has checkboxes, there's no backend validation that verification actually occurred.

**Attack Vector**:
```
1. Malicious user modifies frontend code
2. Removes checkbox requirements
3. Proceeds without verification
4. Creates insecure multisig wallet
```

**Recommended Fix**:
```typescript
// In backend handler for CREATE_MULTISIG_ACCOUNT
async function handleCreateMultisigAccount(payload: any): Promise<MessageResponse> {
  // ... existing validation ...

  // NEW: Require verification flag
  if (!payload.addressVerified) {
    return {
      success: false,
      error: 'Address verification is required. Please verify the first address with all co-signers before creating the multisig account.',
    };
  }

  // ... rest of account creation ...
}
```

---

## 7. Threat Modeling for Multisig

### 7.1 Social Engineering Attacks

**Threat**: Attacker tricks user during setup

**Attack Vectors**:
1. **Fake xpub** - Attacker provides their own xpub
2. **Fingerprint forgery** - Attacker provides fake fingerprint
3. **MITM xpub exchange** - Attacker intercepts xpub exchange

**Mitigations**:
- ✅ Fingerprint verification ceremony (if users follow process)
- ✅ Address verification (if users follow process)
- ⚠️ No enforcement of verification in backend

**Risk**: **MEDIUM** (depends heavily on user education)

---

### 7.2 Co-signer Impersonation

**Threat**: Attacker impersonates legitimate co-signer

**Attack Scenario**:
```
1. Alice, Bob, and Charlie plan 2-of-3 multisig
2. Attacker pretends to be Charlie
3. Provides attacker's xpub instead of Charlie's
4. If Alice and Bob don't verify out-of-band, wallet created with attacker
5. Attacker + Alice OR Attacker + Bob can steal funds (2-of-3 becomes 2-of-2)
```

**Mitigations**:
- ✅ UI warnings to verify fingerprints out-of-band
- ✅ Checklist requiring confirmation
- ⚠️ No cryptographic proof of identity

**Risk**: **MEDIUM** (depends on user following verification process)

---

### 7.3 Transaction Substitution

**Threat**: Attacker modifies PSBT before signing

**Attack Vectors**:
1. **Output address swap** - Change recipient address
2. **Amount modification** - Increase amount
3. **Fee manipulation** - Increase fee to extract more funds

**Mitigations**:
- ✅ PSBT validation on import
- ✅ M-of-N parameter validation
- ⚠️ Missing: Excessive fee detection (see Issue #3)
- ⚠️ Missing: Address network validation

**Risk**: **MEDIUM** (partially mitigated, but gaps exist)

---

### 7.4 Key Loss Scenarios

**Threat**: Loss of (N-M+1) keys makes funds unrecoverable

**Example**: 2-of-3 multisig, lose 2 keys → funds lost forever

**Mitigations**:
- ⚠️ User education (UI warnings present)
- ⚠️ No automated backup verification
- ⚠️ No liveness testing

**Risk**: **HIGH** (user responsibility, common failure mode)

**Recommendation**: Add backup verification flow:
```typescript
/**
 * Verify user has backed up seed phrase
 */
async function verifyBackup(accountIndex: number): Promise<boolean> {
  // 1. Display 3 random words from seed phrase
  // 2. Ask user to enter those words
  // 3. Verify correctness
  // 4. Mark account as "backup verified"
  // 5. Remind users to verify backup quarterly
}
```

---

## 8. Security Best Practices Review

### 8.1 Input Validation and Sanitization

**✅ GOOD**:
- Bitcoin address validation (AddressGenerator)
- Amount validation (positive, numeric)
- PSBT format validation (base64/hex regex)
- xpub validation (network prefix, format)

**⚠️ MISSING**:
- Message payload size limits (DoS prevention)
- Rate limiting on PSBT imports (spam prevention)

---

### 8.2 Error Handling

**✅ GOOD**:
- Generic error messages (no info leakage)
- Try-catch blocks around all operations
- Validation before operations

**⚠️ MEDIUM SEVERITY ISSUE #5: Some Error Messages Too Detailed**

**Example** (`src/background/wallet/MultisigManager.ts`, Line 191):
```typescript
throw new Error(`Failed to create multisig account: ${message}`);
```

**Issue**: If `message` comes from cryptographic library, it might reveal:
- Implementation details
- Key formats
- Internal state

**Recommended Fix**:
```typescript
// Log detailed error internally
console.error('Multisig account creation failed:', error);

// Return generic error to user
throw new Error('Failed to create multisig account. Please check your configuration and try again.');
```

---

### 8.3 Rate Limiting

**❌ MISSING**: No rate limiting on any multisig operations

**Attack Vector**: Attacker could spam:
- PSBT imports (DoS)
- xpub imports (resource exhaustion)
- Address generation (storage exhaustion)

**Recommended Implementation**:
```typescript
/**
 * Simple rate limiter for expensive operations
 */
class RateLimiter {
  private operations: Map<string, number[]> = new Map();

  /**
   * Check if operation is allowed
   * @param operation Operation identifier
   * @param maxPerMinute Maximum operations per minute
   */
  isAllowed(operation: string, maxPerMinute: number): boolean {
    const now = Date.now();
    const timestamps = this.operations.get(operation) || [];

    // Remove timestamps older than 1 minute
    const recent = timestamps.filter(t => now - t < 60000);

    if (recent.length >= maxPerMinute) {
      return false;
    }

    recent.push(now);
    this.operations.set(operation, recent);
    return true;
  }
}

const rateLimiter = new RateLimiter();

// In message handlers
async function handleImportPSBT(payload: any): Promise<MessageResponse> {
  if (!rateLimiter.isAllowed('IMPORT_PSBT', 10)) {  // 10 per minute
    return {
      success: false,
      error: 'Rate limit exceeded. Please wait before importing more PSBTs.',
    };
  }
  // ... rest of handler ...
}
```

---

### 8.4 Logging Security

**✅ GOOD**: No sensitive data logged
- No private keys in logs
- No seed phrases in logs
- No passwords in logs

**Review of key handlers**:
```typescript
// Line 1400: ✅ No sensitive data logged
console.log('handleSignMultisigTransaction called');

// Line 1090: ✅ No sensitive data in log
console.log('handleCreateMultisigAccount called with payload:', payload);
// NOTE: payload contains xpubs (public data), which is safe to log

// Line 1198: ✅ Truncated xpub in log
console.log(`Exported xpub for ${config} account ${accountIndex}: ${xpub.substring(0, 20)}...`);
```

**Risk Assessment**: ✅ **LOW RISK** - Good logging hygiene

---

## 9. Specific Findings Summary

### Critical Severity Issues

#### CRITICAL-1: Address Verification UI Uses Placeholder Address
- **File**: `src/popup/components/MultisigSetup/AddressVerification.tsx`
- **Lines**: 96-98
- **Issue**: Hardcoded placeholder address instead of real multisig address
- **Impact**: Users will lose ALL funds sent to this address (no one has private keys)
- **Likelihood**: HIGH (will happen if shipped as-is)
- **Remediation**: Implement real address generation from xpubs (code provided above)
- **Priority**: **P0 - MUST FIX BEFORE RELEASE**

---

### High Severity Issues

#### HIGH-1: Private Key Not Cleared After Multisig Signing
- **File**: `src/background/index.ts`
- **Lines**: 1471-1485
- **Issue**: Derived private key remains in memory after PSBT signing
- **Impact**: Private key could be extracted from memory by attacker
- **Likelihood**: LOW (requires memory access)
- **Remediation**: Explicitly zero out private key buffer in finally block
- **Priority**: **P0 - FIX BEFORE RELEASE**

#### HIGH-2: Private Key Memory Management in TransactionBuilder
- **File**: `src/background/bitcoin/TransactionBuilder.ts`
- **Lines**: 983-1042
- **Issue**: Private key parameter not cleared after signing
- **Impact**: Private key persists in memory until garbage collection
- **Likelihood**: LOW (requires memory access)
- **Remediation**: Zero out privateKey buffer in finally block
- **Priority**: **P0 - FIX BEFORE RELEASE**

#### HIGH-3: Incomplete PSBT Validation
- **File**: `src/background/bitcoin/PSBTManager.ts`
- **Lines**: 168-232
- **Issue**: Missing excessive fee check and address network validation
- **Impact**: Users could sign transactions with wrong network or excessive fees
- **Likelihood**: MEDIUM (malicious PSBT)
- **Remediation**: Add fee reasonability check and network validation
- **Priority**: **P0 - FIX BEFORE RELEASE**

#### HIGH-4: Pending PSBTs Stored Unencrypted
- **File**: `src/background/index.ts`
- **Lines**: 1681-1804
- **Issue**: Pending PSBTs stored in plaintext in chrome.storage.local
- **Impact**: Privacy loss - transaction details visible to malware/physical attacks
- **Likelihood**: MEDIUM (malware or physical access)
- **Remediation**: Encrypt pending PSBTs before storage
- **Priority**: **P1 - FIX SOON**

---

### Medium Severity Issues

#### MEDIUM-1: No Checksum for Fingerprint
- **File**: `src/background/wallet/MultisigManager.ts`
- **Lines**: 295-318
- **Issue**: Fingerprint has no checksum, typos during verification could go undetected
- **Impact**: Wrong fingerprint could be accepted due to miscommunication
- **Likelihood**: LOW (verbal communication errors)
- **Remediation**: Add checksum to fingerprint display format
- **Priority**: **P2 - NICE TO HAVE**

#### MEDIUM-2: Address Verification Not Enforced in Backend
- **File**: `src/background/index.ts`
- **Lines**: 1088-1156
- **Issue**: No backend validation that address verification was completed
- **Impact**: User could skip verification by modifying frontend
- **Likelihood**: LOW (malicious user)
- **Remediation**: Add `addressVerified` flag validation in backend
- **Priority**: **P1 - RECOMMENDED**

#### MEDIUM-3: Error Messages Too Detailed
- **File**: Multiple files
- **Issue**: Some error messages include too much detail from underlying libraries
- **Impact**: Potential information leakage about implementation details
- **Likelihood**: LOW (depends on specific error)
- **Remediation**: Sanitize error messages, log details internally only
- **Priority**: **P2 - RECOMMENDED**

#### MEDIUM-4: No Rate Limiting
- **File**: `src/background/index.ts`
- **Issue**: No rate limiting on multisig operations
- **Impact**: Potential DoS or resource exhaustion
- **Likelihood**: LOW (requires malicious intent)
- **Remediation**: Implement rate limiter for expensive operations
- **Priority**: **P2 - RECOMMENDED**

---

### Low Severity Issues

#### LOW-1: PSBT Chunk Integrity
- **File**: `src/background/bitcoin/PSBTManager.ts`
- **Lines**: 243-278
- **Issue**: PSBT chunks have no integrity check (HMAC)
- **Impact**: Chunks could be tampered with during QR transfer
- **Likelihood**: VERY LOW (air-gapped signing scenario, physical access required)
- **Remediation**: Add HMAC tag to each chunk
- **Priority**: **P3 - FUTURE ENHANCEMENT**

#### LOW-2: Duplicate Signer Detection
- **File**: `src/background/bitcoin/PSBTManager.ts`
- **Lines**: 137-142
- **Issue**: Signature count tracked, but not validated against unique signers
- **Impact**: Could miss duplicate signature from same party
- **Likelihood**: VERY LOW (bitcoinjs-lib may already prevent this)
- **Remediation**: Track pubkeys of signers, detect duplicates
- **Priority**: **P3 - FUTURE ENHANCEMENT**

---

## 10. Security Recommendations

### Priority 0 (MUST FIX BEFORE RELEASE)

1. **Fix Address Verification Placeholder** (CRITICAL-1)
   - Implement real address generation from xpubs
   - Test extensively on testnet
   - Verify all co-signers see same address

2. **Fix Private Key Memory Management** (HIGH-1, HIGH-2)
   - Zero out private keys in finally blocks
   - Test memory clearing with browser DevTools
   - Document memory management patterns

3. **Enhance PSBT Validation** (HIGH-3)
   - Add excessive fee detection
   - Add address network validation
   - Add comprehensive test cases

---

### Priority 1 (FIX SOON)

4. **Encrypt Pending PSBTs** (HIGH-4)
   - Implement PSBT encryption before storage
   - Use same password as wallet encryption
   - Test encryption/decryption flow

5. **Enforce Address Verification** (MEDIUM-2)
   - Add backend validation for verification flag
   - Prevent account creation without verification
   - Log verification attempts

---

### Priority 2 (RECOMMENDED)

6. **Add Fingerprint Checksum** (MEDIUM-1)
   - Implement checksum for fingerprints
   - Update UI to display checksummed format
   - Update user documentation

7. **Sanitize Error Messages** (MEDIUM-3)
   - Review all error messages
   - Log details internally
   - Return generic messages to user

8. **Implement Rate Limiting** (MEDIUM-4)
   - Add rate limiter utility
   - Apply to expensive operations
   - Log rate limit violations

---

### Priority 3 (FUTURE ENHANCEMENTS)

9. **Add PSBT Chunk Integrity** (LOW-1)
   - Implement HMAC tagging for chunks
   - Verify HMAC on reassembly
   - Document HMAC key derivation

10. **Improve Signature Tracking** (LOW-2)
    - Track unique signers by pubkey
    - Detect duplicate signatures
    - Enhance UI display of signature status

---

## 11. Testing Recommendations

### Unit Tests Required

1. **Private Key Clearing**:
   ```typescript
   test('private key is cleared after multisig signing', async () => {
     const privateKey = Buffer.from('test key');
     await signMultisigPSBT(psbt, pubkeys, privateKey);

     // Verify key is zeroed
     expect(privateKey.every(byte => byte === 0)).toBe(true);
   });
   ```

2. **PSBT Validation**:
   ```typescript
   test('rejects PSBT with excessive fee', async () => {
     const maliciousPsbt = createPSBTWithHighFee();
     const result = importPSBT(maliciousPsbt);

     expect(result.isValid).toBe(false);
     expect(result.warnings).toContain('excessive fee');
   });
   ```

3. **Address Generation**:
   ```typescript
   test('generates correct multisig address from xpubs', () => {
     const address1 = generateMultisigAddress(xpubs);
     const address2 = generateMultisigAddress(xpubs);

     expect(address1).toBe(address2);  // Deterministic
     expect(address1).toMatch(/^tb1/);  // Testnet address
   });
   ```

---

### Integration Tests Required

1. **Complete Multisig Setup Flow**:
   - Create account with 3 xpubs
   - Verify all parties generate same address
   - Create and sign PSBT
   - Verify transaction broadcasts successfully

2. **Memory Clearing on Lock**:
   - Unlock wallet
   - Sign multisig transaction
   - Lock wallet
   - Verify no private keys in memory dump

3. **PSBT Malicious Input**:
   - Import PSBT with wrong network
   - Import PSBT with excessive fee
   - Import PSBT with wrong M-of-N parameters
   - Verify all rejected correctly

---

### Manual Testing Required

1. **Address Verification Ceremony**:
   - Set up 2-of-3 multisig on 3 separate devices
   - Verify all devices show same first address
   - Send test transaction
   - Verify all devices see transaction

2. **PSBT Coordination**:
   - Create unsigned PSBT
   - Export via base64
   - Import on second device
   - Sign on second device
   - Import signed PSBT on first device
   - Finalize and broadcast

3. **User Education Flow**:
   - Follow setup wizard as first-time user
   - Verify all warnings are clear
   - Verify checklist forces verification
   - Verify cannot skip critical steps

---

## 12. Conclusion

### Overall Security Assessment

The multi-signature wallet implementation demonstrates **good security architecture** with proper use of BIP standards (BIP48, BIP67, BIP174) and comprehensive validation throughout. However, several critical and high-severity issues must be addressed before production release.

**Strengths**:
- ✅ Excellent xpub validation (prevents xprv sharing)
- ✅ Correct BIP67 implementation (deterministic address generation)
- ✅ Comprehensive PSBT validation (M-of-N parameters checked)
- ✅ Good UI warnings and verification checklists
- ✅ No sensitive data logged

**Critical Gaps**:
- ❌ Address verification uses placeholder (CRITICAL - fund loss)
- ❌ Private keys not cleared from memory
- ❌ Incomplete PSBT validation (missing fee/network checks)
- ❌ Pending PSBTs stored unencrypted

---

### Release Readiness

**Current Status**: **NOT READY FOR PRODUCTION**

**Blockers**:
1. Fix CRITICAL-1 (address generation placeholder)
2. Fix HIGH-1 and HIGH-2 (private key memory management)
3. Fix HIGH-3 (PSBT validation gaps)

**Estimated Effort**: 2-3 days to address all P0 issues

---

### Final Recommendation

**DO NOT RELEASE TO MAINNET** until:
1. All CRITICAL and HIGH severity issues resolved
2. Unit tests implemented for key security features
3. Integration tests verify complete multisig flow
4. Manual testing on testnet with real co-signers
5. Security review of fixes completed

**TESTNET RELEASE**: CONDITIONAL APPROVAL after P0 fixes

The implementation shows strong architectural security decisions, but execution gaps (especially the placeholder address) create unacceptable risk. With the recommended fixes, this would be a secure multisig wallet implementation.

---

## Appendix A: Security Audit Checklist Status

### Cryptography
- [x] xpub validation implemented correctly
- [x] BIP67 key sorting implemented correctly
- [x] No weak cryptographic algorithms
- [x] Proper random number generation
- [ ] Private key memory clearing (NEEDS FIX)

### Key Management
- [x] No private keys logged
- [x] No seed phrases logged
- [x] Auto-lock functionality present
- [ ] Private keys cleared after signing (NEEDS FIX)
- [x] No hardcoded secrets

### Input Validation
- [x] Bitcoin address validation
- [x] xpub format validation
- [x] PSBT format validation
- [ ] Fee reasonability checking (NEEDS FIX)
- [ ] Address network validation (NEEDS FIX)

### Storage Security
- [x] Seed phrase encrypted
- [x] xpubs stored (public data, safe)
- [ ] Pending PSBTs encrypted (NEEDS FIX)
- [x] Proper cleanup on deletion

### UI/UX Security
- [x] Clear warnings displayed
- [x] Verification checklists present
- [ ] Address generation working (NEEDS FIX)
- [ ] Backend verification enforcement (RECOMMENDED)

---

**END OF SECURITY AUDIT REPORT**

**Next Steps**:
1. Development team to review findings
2. Create tickets for all P0 and P1 issues
3. Implement fixes
4. Security review of fixes
5. Re-test complete multisig flow
6. Update documentation with security notes
