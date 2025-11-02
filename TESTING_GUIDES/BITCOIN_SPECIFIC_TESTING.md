# Bitcoin-Specific Testing Guide

**Purpose:** Bitcoin protocol validation for testers without deep Bitcoin expertise
**Use when:** Testing transactions, addresses, UTXO management, or any Bitcoin-specific functionality
**Reference document:** Use alongside feature test guides for Bitcoin protocol validation

---

## Table of Contents

1. [Critical Bitcoin Validations](#critical-bitcoin-validations)
2. [Address Type Testing](#address-type-testing)
3. [Transaction Testing Scenarios](#transaction-testing-scenarios)
4. [Multisig Testing](#multisig-testing)
5. [Testnet Workflows](#testnet-workflows)
6. [Common Pitfalls](#common-pitfalls)

---

## Critical Bitcoin Validations

### What MUST Be Tested?

**Address Derivation (BIP32/44/49/84)**

**Why it matters:** If addresses are wrong, users lose funds permanently.

**Observable behaviors a non-expert can verify:**
- Legacy addresses start with `m` or `n` (testnet)
- SegWit addresses start with `2` (testnet)
- Native SegWit addresses start with `tb1` (testnet)
- Each account generates unique addresses
- Same seed phrase always generates same addresses

**Test procedure:**
1. Create wallet with seed phrase
2. Note first address for each account
3. Delete wallet, restore from same seed phrase
4. Verify same addresses generated
5. **Cross-check with Ian Coleman BIP39 tool:** https://iancoleman.io/bip39/

**Cross-Verification Steps:**
1. Go to https://iancoleman.io/bip39/
2. Enter your **testnet seed phrase** (test wallets only!)
3. Select "BTC - Bitcoin Testnet" from coin dropdown
4. Select derivation path:
   - BIP84 for Native SegWit (m/84'/1'/0')
   - BIP49 for SegWit (m/49'/1'/0')
   - BIP44 for Legacy (m/44'/1'/0')
5. Compare first address with wallet address
6. **Expected:** Addresses match exactly

**What could go wrong:**
- Wrong derivation path = incompatible with other wallets
- Wrong address type = funds sent to unrecoverable address
- Non-deterministic generation = can't restore wallet

---

### Transaction Signing (ECDSA + secp256k1)

**Why it matters:** Invalid signatures = transactions rejected by network.

**Observable behaviors:**
- Transaction successfully broadcasts
- Transaction appears on block explorer
- Correct amount deducted from wallet
- Network confirmations accumulate

**Test procedure:**
1. Send small amount (0.001 BTC) to another address
2. Check transaction ID returned
3. Verify on Blockstream explorer within 30 seconds
4. Confirm transaction has valid signature
5. Wait for 1+ confirmations

**What could go wrong:**
- Wrong signature algorithm = invalid transaction
- Unsigned inputs = transaction rejected
- Wrong sighash type = unintended behavior

---

### UTXO Selection

**Why it matters:** Wrong UTXO selection = overpaying fees or failed transactions.

**Observable behaviors:**
- Wallet selects sufficient UTXOs to cover amount + fee
- Change address receives leftover amount
- No "dust" outputs created (< 546 sats)

**Test procedure:**
1. Fund wallet with multiple small UTXOs (use faucet 3-4 times)
2. Send transaction larger than single UTXO
3. Verify on explorer: Multiple inputs used
4. Verify: Change output created with correct amount
5. Verify: No outputs below 546 satoshis (dust threshold)

**What could go wrong:**
- Insufficient UTXOs selected = transaction fails
- No change output = overpay fees
- Dust output created = unspendable change

---

### Fee Estimation

**Why it matters:** Too low = transaction stuck, too high = overpay.

**Observable fee rates:**
- Slow: 1-5 sat/vB (testnet), confirmation ~60 min
- Medium: 10-20 sat/vB, confirmation ~30 min
- Fast: 25+ sat/vB, confirmation ~10 min

**Test procedure:**
1. Check Blockstream fee estimates: `https://blockstream.info/testnet/api/fee-estimates`
2. Create transaction with "Medium" fee
3. Note estimated fee (e.g., 0.00001200 BTC)
4. Calculate fee rate: fee ÷ transaction_size_vBytes
5. Verify fee rate matches medium estimate ±20%

**What could go wrong:**
- Fee too low = stuck in mempool for days
- Fee calculation error = transaction rejected
- No fee = transaction invalid

---

## Address Type Testing

### Address Format Validation Matrix

| Address Type | Testnet Prefix | Derivation Path | Transaction Size | Fee Cost | Compatibility |
|--------------|----------------|-----------------|------------------|----------|---------------|
| **Legacy (P2PKH)** | m, n | m/44'/1'/0'/0/0 | ~180 vBytes/input | Highest | Maximum (all wallets) |
| **SegWit (P2SH-P2WPKH)** | 2 | m/49'/1'/0'/0/0 | ~100 vBytes/input | Medium | High (most wallets) |
| **Native SegWit (P2WPKH)** | tb1 | m/84'/1'/0'/0/0 | ~68 vBytes/input | Lowest | Modern wallets only |

### Testing Each Address Type

**For each address type:**

1. **Create Account**
   - Click "Create Account" or during wallet setup
   - Select address type (Legacy/SegWit/Native SegWit)
   - Name account (e.g., "Test Legacy")

2. **Verify Address Format**
   - Go to Receive screen
   - Check address prefix matches expected:
     - Legacy: `m` or `n`
     - SegWit: `2`
     - Native SegWit: `tb1`

3. **Cross-Reference with BIP39 Tool**
   - Open https://iancoleman.io/bip39/
   - Enter your test seed phrase
   - Select "BTC Testnet" coin
   - Select appropriate BIP tab (44/49/84)
   - Compare address at index 0 with wallet
   - **Must match exactly**

4. **Send/Receive Test**
   - Get testnet BTC from faucet to this address
   - Send from this account to another address
   - Verify transaction succeeds
   - Check fee cost matches expectations (Native SegWit = lowest)

---

## Transaction Testing Scenarios

### Scenario A: Standard Send Transaction

**Purpose:** Verify basic transaction flow

**Steps:**
1. Unlock wallet
2. Navigate to Send screen
3. Enter valid testnet address
4. Enter amount: 0.001 BTC
5. Select "Medium" fee
6. Click "Review"
7. Verify transaction details
8. Click "Confirm"
9. Enter password
10. Wait for transaction ID

**Validation on Block Explorer:**
```
URL: https://blockstream.info/testnet/tx/[TXID]

Check:
✓ Transaction exists
✓ Status: Unconfirmed → Confirmed (after 1 block)
✓ Inputs: From your address(es)
✓ Outputs: Recipient + change (if applicable)
✓ Fee: Reasonable (0.00001-0.00005 BTC for testnet)
✓ No outputs < 546 sats (dust)
```

**Expected Timeline:**
- Transaction broadcast: 1-5 seconds
- Appears on explorer: 10-30 seconds
- First confirmation: 10-60 minutes (testnet varies)

---

### Scenario B: Send Max (Sweep Entire Balance)

**Purpose:** Verify wallet can sweep all funds

**Steps:**
1. Click "Send Max" button
2. Enter recipient address
3. Review details
4. Verify: Amount = Balance - Fee (no change output)
5. Confirm transaction

**Validation on Explorer:**
```
Check:
✓ Transaction has NO change output
✓ Wallet balance becomes 0.00000000 BTC
✓ All UTXOs from address consumed
✓ Only 1 output (to recipient)
```

---

### Scenario C: Invalid Address Rejection

**Purpose:** Verify address validation

**Test Cases:**

| Input | Expected Result |
|-------|-----------------|
| `not_an_address` | ❌ Error: "Invalid Bitcoin address" |
| `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` | ❌ Error: "Mainnet address (testnet wallet)" |
| `bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4` | ❌ Error: "Mainnet address" |
| `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx` | ✅ Valid (testnet Native SegWit) |
| `mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn` | ✅ Valid (testnet Legacy) |
| `2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc` | ✅ Valid (testnet SegWit) |

---

### Scenario D: Fee Speed Comparison

**Purpose:** Verify fee estimation accuracy

**Steps:**
1. Create 3 identical transactions (same amount, recipient)
2. Transaction 1: Select "Slow" fee → Note fee amount
3. Transaction 2: Select "Medium" fee → Note fee amount
4. Transaction 3: Select "Fast" fee → Note fee amount

**Expected Results:**
```
Fast fee > Medium fee > Slow fee

Typical testnet ranges:
- Slow: 5-10 sat/vB
- Medium: 10-20 sat/vB
- Fast: 25-50 sat/vB

All fees reasonable: < 0.0001 BTC for testnet
```

---

### Transaction Verification Checklist

**For EVERY transaction, verify on Blockstream Explorer:**

```
1. Transaction Status
   URL: https://blockstream.info/testnet/tx/[TXID]
   ✓ Status: "Unconfirmed" or "Confirmed"
   ✓ If confirmed: Shows block height

2. Inputs
   ✓ Inputs match your wallet addresses
   ✓ Input amounts match your UTXOs
   ✓ Input count matches expectations

3. Outputs
   ✓ Output 0: Recipient address + amount
   ✓ Output 1 (if exists): Change address (YOUR address)
   ✓ No output < 546 sats (dust threshold)

4. Fee
   ✓ Displayed as "Fee: X satoshis"
   ✓ Calculate fee rate: Fee ÷ Size (vBytes)
   ✓ Compare to selected fee speed

5. Size & Weight
   ✓ Legacy tx: Size ≈ 180 × inputs + 34 × outputs + 10
   ✓ SegWit tx: Weight used (witness discount)
   ✓ vBytes = Weight ÷ 4
```

---

## Multisig Testing

### Why Multisig is Complex

**Key Challenges:**
- Requires coordination between multiple devices/wallets
- Address generation MUST match across all co-signers
- PSBT (Partially Signed Bitcoin Transaction) workflow
- BIP48 derivation paths (different from single-sig)
- BIP67 key sorting (deterministic order)

---

### Multisig Configuration Testing

**Test Setup: 2-of-3 Multisig (Recommended)**

**Preparation:**
1. Create 3 Chrome profiles: "Co-signer A", "Co-signer B", "Co-signer C"
2. Install wallet extension in each profile
3. Create wallet in each profile (different seed phrases)

---

**Phase 1: Account Creation (Each Co-Signer)**

**Co-signer A:**
1. Create multisig account
2. Select "2-of-3" configuration
3. Select "Native SegWit" (P2WSH) address type
4. Enter co-signer names: "Alice", "Bob", "Charlie"
5. **Export xpub** for account:
   - Click "Export Xpub" button
   - Copy xpub string (starts with `tpub` for testnet)
   - Note fingerprint (8 hex characters, e.g., `a1b2c3d4`)
6. Save xpub + fingerprint to notepad

**Repeat for Co-signers B and C** - get 3 xpubs total

---

**Phase 2: Xpub Exchange (All Co-Signers)**

1. Return to multisig setup
2. Import other co-signers' xpubs:
   - Paste xpub from Co-signer A
   - Verify fingerprint matches
   - Assign name "Alice"
   - Repeat for other co-signers
3. Complete multisig account creation

---

**Phase 3: Address Verification (CRITICAL)**

**All Co-Signers:**
1. Navigate to Receive screen
2. View first receive address
3. **Compare addresses across all 3 wallets**
4. **ALL MUST MATCH EXACTLY**

**Critical Verification:**
```
Co-signer A first address: tb1q...abc123
Co-signer B first address: tb1q...abc123  ✓ MATCH
Co-signer C first address: tb1q...abc123  ✓ MATCH

If ANY address doesn't match → STOP
- Check: All used same configuration (2-of-3)
- Check: All used same address type (P2WSH)
- Check: All imported correct xpubs
- Check: Fingerprints match exactly
```

**If addresses don't match:** DO NOT fund the address - debug first!

---

**Phase 4: Multisig Transaction (End-to-End)**

**Step 1: Funding**
1. All co-signers verify first address matches
2. Send testnet BTC to multisig address (from faucet or other wallet)
3. Wait for 1 confirmation
4. All wallets should show balance

**Step 2: Create PSBT (Co-signer A initiates)**
1. Co-signer A: Navigate to Send screen
2. Enter recipient address
3. Enter amount: 0.001 BTC
4. Select "Medium" fee
5. Review transaction
6. **Click "Create PSBT"** (not "Confirm")
7. PSBT created - shows "0 of 2 signatures"
8. **Export PSBT**:
   - Copy Base64 string, OR
   - Export as QR code, OR
   - Download PSBT file
9. Share PSBT with Co-signer B

**Step 3: Sign PSBT (Co-signer B)**
1. Co-signer B: Navigate to multisig account
2. Click "Import PSBT"
3. Paste Base64 PSBT or upload file
4. Review transaction details
5. **Click "Sign PSBT"**
6. Enter password
7. PSBT now has "1 of 2 signatures"
8. **Export signed PSBT**
9. Share back to Co-signer A

**Step 4: Finalize & Broadcast (Co-signer A)**
1. Co-signer A: Import signed PSBT from B
2. Verify: "1 of 2 signatures" present
3. **Click "Finalize & Broadcast"**
4. Transaction sent to network
5. Transaction ID returned

**Step 5: Validation**
- Check Blockstream explorer: https://blockstream.info/testnet/tx/[TXID]
- Verify multisig address as input
- Verify recipient address as output
- Verify 2 signatures present in transaction
- Wait for confirmation

---

### BIP Compliance Checklist

**BIP48 (Multisig Derivation):**
- [ ] Derivation path format: `m/48'/1'/account'/script_type'`
- [ ] For P2WSH: `m/48'/1'/0'/2'`
- [ ] For P2SH: `m/48'/1'/0'/1'`

**BIP67 (Key Sorting):**
- [ ] Public keys sorted lexicographically (automatic)
- [ ] All co-signers generate same address (verified)

**BIP174 (PSBT):**
- [ ] PSBT created for unsigned transactions
- [ ] PSBT exported as Base64 or Hex
- [ ] Each co-signer signs PSBT
- [ ] Once M signatures collected, PSBT finalized and broadcast

---

## Testnet Workflows

### How to Get Testnet Bitcoin

**Primary Faucet: Testnet Faucet Mempool**
- URL: https://testnet-faucet.mempool.co/
- Amount: 0.001-0.01 BTC per request
- Wait time: Instant
- Rate limit: 1 request/24 hours per address

**Procedure:**
1. Copy receiving address from wallet (tb1q...)
2. Open faucet website
3. Paste address into form
4. Complete CAPTCHA
5. Click "Send"
6. Wait 30-60 seconds
7. Check wallet balance (should auto-update)

**If faucet empty:**
- Try https://coinfaucet.eu/en/btc-testnet/ (backup)
- Try https://bitcoinfaucet.uo1.net/ (backup)
- Generate new address and try again
- Ask development team for testnet BTC

---

### How to Verify Transactions on Explorer

**1. Get Transaction ID (TXID)**
- From wallet after sending
- Format: 64-character hex string
- Example: `a1b2c3d4e5f6...`

**2. Open Explorer**
- Navigate to: `https://blockstream.info/testnet/tx/[TXID]`
- Replace `[TXID]` with your transaction ID

**3. Check Transaction Status**
```
Unconfirmed: In mempool, waiting for block
1 Confirmation: Included in 1 block
6+ Confirmations: Generally considered final
```

**4. Verify Transaction Details**
```
Inputs: Your addresses (should match wallet)
Outputs: Recipient + change (if any)
Fee: Should match your selection
Size: Transaction size in bytes/vBytes
```

---

### How to Verify Address Balance

**1. Copy Address** from wallet Receive screen

**2. Open Explorer**
- Navigate to: `https://blockstream.info/testnet/address/[ADDRESS]`
- Replace `[ADDRESS]` with your address

**3. Check Balance**
```
Confirmed: Balance in confirmed transactions
Unconfirmed: Pending transactions
Total Received: All-time received amount
Total Sent: All-time sent amount
```

**4. View UTXOs**
- Scroll to "Unspent Outputs" section
- Each UTXO shows:
  - Transaction ID
  - Output index (vout)
  - Amount
  - Confirmations

---

### Testnet-Specific Quirks

**1. Slow Confirmations**
- Testnet has less mining power than mainnet
- Blocks can be 10-30 minutes apart (vs 10 min average on mainnet)
- Sometimes hours between blocks
- **Solution:** Be patient, testnet is unpredictable

**2. Fee Estimates Can Be Wrong**
- Testnet fee market is unpredictable
- Sometimes suggests 1 sat/vB (too low)
- **Solution:** Use minimum 5 sat/vB on testnet

**3. Faucets Run Out**
- Popular faucets get depleted
- **Solution:** Try backup faucets, generate new address, ask dev team

**4. Chain Reorganizations (Reorgs)**
- Testnet can have chain reorganizations
- Transactions with 1-2 confirmations may become unconfirmed
- **Solution:** Wait for 6+ confirmations for critical tests

**5. Testnet "Resets" Periodically**
- Entire testnet chain restarted every ~2-3 years
- All testnet Bitcoin lost when this happens
- **Solution:** Don't worry - it's testnet! Get new coins from faucet

---

## Common Pitfalls

### Pitfall 1: Using Mainnet Instead of Testnet

**Risk:** Losing real money

**Prevention:**
- ALWAYS verify address prefix (m/n/2/tb1 for testnet)
- Check Blockstream URLs contain `/testnet/`
- Use seed phrases generated in testnet wallets only
- Never test with real BTC

**If you accidentally sent real Bitcoin to testnet address:**
- Funds are LOST (unrecoverable)
- Testnet addresses don't exist on mainnet
- No way to recover funds

---

### Pitfall 2: Not Waiting for Confirmations

**Risk:** False negative test results

**Problem:** Transaction appears successful but later disappears (reorg)

**Solution:**
- Wait for at least 1 confirmation before next test
- For critical tests, wait for 6+ confirmations
- Check transaction status on explorer, not just wallet UI

---

### Pitfall 3: Reusing Seed Phrases

**Risk:** Privacy leaks, address confusion

**Problem:** Testing with same seed phrase across multiple wallets

**Solution:**
- Generate new seed phrase for each test wallet
- Document which seed phrase for which test
- Never reuse production seed phrases for testing

---

### Pitfall 4: Ignoring Fee Market

**Risk:** Transactions stuck or overpaying

**Problem:** Using same fee rate regardless of network conditions

**Solution:**
- Check current testnet mempool before tests
- Adjust fee expectations based on congestion
- Verify fees on explorer match wallet estimates

---

### Pitfall 5: Not Verifying on Explorer

**Risk:** Missing bugs in transaction construction

**Problem:** Trusting wallet UI without external verification

**Solution:**
- ALWAYS verify transactions on Blockstream explorer
- Check inputs, outputs, fees, signatures
- Don't assume "success" message means transaction is correct

---

### Pitfall 6: Multisig Address Mismatch

**Risk:** Funds sent to unrecoverable address

**Problem:** Not verifying all co-signers generate same address

**Solution:**
- ALWAYS verify first address matches across ALL co-signers before funding
- Check fingerprints match exactly
- If mismatch, STOP and debug before funding

---

### Pitfall 7: Insufficient UTXO Diversity

**Risk:** Not testing UTXO selection properly

**Problem:** Testing with only 1 UTXO (doesn't test selection algorithm)

**Solution:**
- Request testnet BTC multiple times to create multiple UTXOs
- Test with 3-5 small UTXOs
- Verify wallet selects correct UTXOs for transaction

---

## Quick Reference

### Address Prefixes (Testnet)

```
Legacy (P2PKH):       m, n
SegWit (P2SH-P2WPKH): 2
Native SegWit (P2WPKH): tb1q
Multisig P2SH:        2
Multisig P2WSH:       tb1q
```

### Derivation Paths (Testnet, coin_type = 1)

```
Legacy:       m/44'/1'/account'/change/index
SegWit:       m/49'/1'/account'/change/index
Native SegWit: m/84'/1'/account'/change/index
Multisig:     m/48'/1'/account'/script_type'
```

### Transaction Size Estimates

```
Legacy input:      ~148 vBytes
SegWit input:      ~100 vBytes
Native SegWit input: ~68 vBytes
Output (any type):  ~34 vBytes
```

### Fee Recommendations (Testnet)

```
Minimum:  5 sat/vB
Slow:     5-10 sat/vB (~60 min)
Medium:   10-20 sat/vB (~30 min)
Fast:     25-50 sat/vB (~10 min)
```

### Testnet Resources

```
Faucet:    https://testnet-faucet.mempool.co/
Explorer:  https://blockstream.info/testnet/
BIP39 Tool: https://iancoleman.io/bip39/
Fee API:   https://blockstream.info/testnet/api/fee-estimates
```

### Critical Checks Before Releasing

- [ ] All address types tested (Legacy, SegWit, Native SegWit)
- [ ] ≥5 successful send transactions on testnet
- [ ] ≥5 successful receive transactions
- [ ] ≥1 successful multisig transaction (if multisig implemented)
- [ ] Address validation prevents mainnet addresses
- [ ] UTXO selection works with multiple UTXOs
- [ ] Change addresses generated correctly
- [ ] Fee estimation accurate (within 20%)
- [ ] Transaction signing creates valid signatures
- [ ] All transactions confirm on testnet
- [ ] Balance updates correctly after transactions
- [ ] No private keys or seed phrases logged to console

---

**Use this guide alongside feature test guides for Bitcoin protocol validation!**

**Return to [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md) for testing workflow.**
