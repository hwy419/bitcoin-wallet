# Feature Test Guide: Send Transactions

**Feature Area:** Send Bitcoin Transactions
**Test Cases:** 12 tests
**Time to Execute:** 2 hours
**Priority:** P0 (Critical - Funds Movement)

---

## Overview

This feature validates the complete send transaction flow including recipient input, amount selection, fee tier selection, transaction preview, signing, and broadcasting. This is the most critical feature as it involves moving user funds.

**Why this matters:** Send functionality must be accurate and secure. Errors can lead to lost funds, incorrect amounts sent, or transactions stuck due to inadequate fees.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Account funded with testnet Bitcoin (minimum 0.01 BTC recommended)
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Test recipient addresses prepared (testnet addresses)
- [ ] Block explorer ready: https://blockstream.info/testnet/

---

## Test Cases

### SEND-001: Send Screen - UI Validation

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify send screen displays correctly

**Steps:**
1. Unlock wallet
2. Navigate to Send screen (from dashboard or sidebar)
3. Observe all UI elements

**Expected Results:**
- ✅ Send screen title: "Send Bitcoin"
- ✅ Recipient address input field visible
- ✅ Amount input field visible
- ✅ Fee selection buttons (Slow, Medium, Fast)
- ✅ Current balance displayed
- ✅ "Max" button to send all
- ✅ "Preview Transaction" or "Send" button
- ✅ All fields have labels
- ✅ Dark theme consistent
- ✅ No console errors

**Visual Layout:**
```
Send Bitcoin
┌─────────────────────────────────┐
│ Recipient Address               │
│ [____________________________] │
│                                 │
│ Amount (BTC)                    │
│ [______________] [Max]          │
│ Available: 0.05234567 BTC       │
│                                 │
│ Fee Selection                   │
│ [Slow]  [Medium]  [Fast]       │
│ ~0.00001 BTC (~5 min)          │
│                                 │
│      [Preview Transaction]      │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-002: Send Transaction - Slow Fee

**Priority:** P0
**Time:** 15-30 minutes (including confirmation wait)

**Purpose:** Verify transaction with slow fee sends successfully

**Preparation:**
- Test recipient address: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx (testnet burn address)
- Amount to send: 0.0001 BTC

**Steps:**
1. Navigate to Send screen
2. Enter recipient: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
3. Enter amount: 0.0001
4. Select fee: "Slow"
5. Click "Preview Transaction"
6. Review transaction preview modal
7. Verify all details correct
8. Enter password to confirm
9. Click "Send Transaction"
10. Wait for broadcast confirmation
11. Note transaction ID
12. Check on block explorer

**Expected Results:**
- ✅ Address validation passes (valid testnet address)
- ✅ Amount validation passes
- ✅ Fee estimate shown (e.g., "0.00000141 BTC, ~30-60 min")
- ✅ Transaction preview modal shows:
  - Recipient address
  - Amount: 0.0001 BTC
  - Fee: ~0.0000014 BTC
  - Total: 0.0001014 BTC (amount + fee)
- ✅ Password required to sign
- ✅ Transaction signed successfully
- ✅ Transaction broadcast to network
- ✅ Transaction ID displayed (64-character hex)
- ✅ Success message shown
- ✅ Balance updates (deducted immediately)
- ✅ Transaction appears in history
- ✅ Status: "Pending" or "Unconfirmed"

**Block Explorer Validation:**
1. Open: https://blockstream.info/testnet/
2. Search transaction ID
3. Verify:
   - Transaction found
   - Amount correct
   - Recipient correct
   - Fee approximately as estimated
   - Status: Unconfirmed → Confirming → Confirmed

**Timing:**
- Broadcast time: _____ seconds
- First confirmation: _____ minutes
- Target: 30-60 minutes for slow fee

**Transaction Log:**
- TX ID: ________________________________
- Amount: 0.0001 BTC
- Fee: _________ BTC
- Confirmations: ____ / 6

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-003: Send Transaction - Medium Fee

**Priority:** P0
**Time:** 10-15 minutes

**Purpose:** Verify transaction with medium fee

**Steps:**
1. Navigate to Send screen
2. Enter recipient: (use your own testnet address for receiving back)
3. Enter amount: 0.0002 BTC
4. Select fee: "Medium"
5. Preview and send transaction

**Expected Results:**
- ✅ Fee estimate: ~0.000002 BTC, ~10-20 min
- ✅ Transaction sent successfully
- ✅ Faster confirmation than slow fee

**Transaction Log:**
- TX ID: ________________________________
- Confirmation time: _____ minutes

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-004: Send Transaction - Fast Fee

**Priority:** P0
**Time:** 5-10 minutes

**Purpose:** Verify transaction with fast fee

**Steps:**
1. Navigate to Send screen
2. Enter recipient: (use your own testnet address)
3. Enter amount: 0.0003 BTC
4. Select fee: "Fast"
5. Preview and send transaction

**Expected Results:**
- ✅ Fee estimate: ~0.000004 BTC, ~5-10 min
- ✅ Transaction sent successfully
- ✅ Fastest confirmation (typically next block)

**Transaction Log:**
- TX ID: ________________________________
- Confirmation time: _____ minutes

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-005: Send Max - Full Balance

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify "Send Max" sends entire balance

**Steps:**
1. Note current balance: _________ BTC
2. Navigate to Send screen
3. Enter recipient address
4. Click "Max" button
5. Observe amount field auto-fills
6. Observe fee deducted from total
7. Preview transaction
8. Verify math: Amount + Fee ≈ Total Balance

**Expected Results:**
- ✅ "Max" button fills amount field
- ✅ Amount = Balance - Fee
- ✅ Transaction preview shows:
  - Amount to recipient: (Balance - Fee)
  - Fee: ~0.000002 BTC
  - Total: Entire balance
- ✅ After sending, balance = 0.00000000 BTC
- ✅ No "dust" left behind (<546 satoshis)

**Math Verification:**
```
Starting Balance:  0.05234567 BTC
Fee (medium):     -0.00000212 BTC
─────────────────────────────────
Amount Sent:       0.05234355 BTC
Remaining:         0.00000000 BTC
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-006: Address Validation - Invalid Address Rejection

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify wallet rejects invalid Bitcoin addresses

**Test 1: Invalid Format**
**Steps:**
1. Enter: "ThisIsNotABitcoinAddress"
2. Try to preview transaction

**Expected:**
- ✅ Error: "Invalid Bitcoin address"
- ✅ Cannot proceed
- ✅ Field highlighted in red

**Test 2: Mainnet Address (on testnet wallet)**
**Steps:**
1. Enter mainnet address: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
2. Try to preview

**Expected:**
- ✅ Error: "Invalid address - mainnet address detected, this wallet uses testnet"
- ✅ Cannot proceed

**Test 3: Wrong Network Address Type**
**Steps:**
1. Enter Litecoin address (if detectable): "LQT...xyz"
2. Try to preview

**Expected:**
- ✅ Error: "Invalid Bitcoin address format"
- ✅ Cannot proceed

**Test 4: Empty Address**
**Steps:**
1. Leave address field empty
2. Try to preview

**Expected:**
- ✅ Button disabled or error: "Recipient address required"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-007: Amount Validation

**Priority:** P0
**Time:** 8 minutes

**Purpose:** Verify amount validation works correctly

**Test 1: Insufficient Balance**
**Steps:**
1. Current balance: 0.01 BTC
2. Try to send: 1.0 BTC
3. Preview transaction

**Expected:**
- ✅ Error: "Insufficient balance"
- ✅ Cannot proceed
- ✅ Suggests maximum sendable amount

**Test 2: Zero Amount**
**Steps:**
1. Enter amount: 0
2. Try to preview

**Expected:**
- ✅ Error: "Amount must be greater than 0"
- ✅ Button disabled

**Test 3: Negative Amount**
**Steps:**
1. Enter amount: -0.001
2. Try to preview

**Expected:**
- ✅ Error: "Invalid amount"
- ✅ OR: Field rejects negative input

**Test 4: Invalid Characters**
**Steps:**
1. Enter: "abc" in amount field
2. Observe behavior

**Expected:**
- ✅ Field rejects non-numeric input
- ✅ OR: Shows error "Invalid amount format"

**Test 5: Too Many Decimals**
**Steps:**
1. Enter: 0.123456789 (9 decimals, Bitcoin uses max 8)
2. Observe behavior

**Expected:**
- ✅ Rounds to 8 decimals: 0.12345678
- ✅ OR: Error "Maximum 8 decimal places"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-008: Transaction Preview Modal

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify transaction preview displays all critical information

**Steps:**
1. Fill send form:
   - Recipient: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
   - Amount: 0.001 BTC
   - Fee: Medium
2. Click "Preview Transaction"
3. Observe preview modal

**Expected Results:**
- ✅ Modal title: "Confirm Transaction"
- ✅ Recipient address displayed (full, not truncated)
- ✅ Amount displayed: 0.001 BTC
- ✅ Fee displayed: ~0.000002 BTC
- ✅ Total displayed: 0.001002 BTC
- ✅ Fee rate shown: "Medium (~10-20 min)"
- ✅ Satoshi values shown (optional)
- ✅ USD values shown (if enabled)
- ✅ Password input field
- ✅ "Cancel" button
- ✅ "Send Transaction" button (disabled until password entered)

**Visual Example:**
```
┌────────────────────────────────┐
│   Confirm Transaction          │
├────────────────────────────────┤
│ Sending to:                    │
│ tb1qw508d6qejxtdg4y5r3zar... │
│                                │
│ Amount:       0.001 BTC        │
│ Fee:          0.000002 BTC     │
│ Total:        0.001002 BTC     │
│                                │
│ Fee Rate: Medium (~10-20 min)  │
│                                │
│ Password: [______________]     │
│                                │
│ [Cancel]  [Send Transaction]   │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-009: Password Required for Sending

**Priority:** P0 (Security)
**Time:** 5 minutes

**Purpose:** Verify password required to sign transactions

**Steps:**
1. Fill send form
2. Click "Preview Transaction"
3. Attempt to send WITHOUT entering password
4. Enter WRONG password
5. Enter CORRECT password

**Expected Results:**
- ✅ "Send" button disabled without password
- ✅ Wrong password shows error: "Incorrect password"
- ✅ Transaction NOT signed with wrong password
- ✅ Correct password required to sign
- ✅ Password field cleared after error
- ✅ Can retry with correct password

**Security Validation:**
- Password not logged to console
- Transaction signing happens only after correct password

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-010: Change Address Generation

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify change is sent to new change address

**Prerequisites:** Understanding of UTXO and change

**Steps:**
1. Have account with 0.01 BTC (single UTXO)
2. Send 0.001 BTC
3. After transaction confirms, check transaction details
4. Verify change address is different from sender

**Expected Results:**
- ✅ Transaction has 2 outputs:
  - Output 1: 0.001 BTC to recipient
  - Output 2: ~0.008998 BTC to change address (0.01 - 0.001 - fee)
- ✅ Change address is NOT the original receiving address
- ✅ Change address follows same derivation path convention (m/84'/1'/0'/1/X)
- ✅ Change balance added to account balance

**Block Explorer Verification:**
1. View transaction on Blockstream
2. Outputs section shows 2 addresses
3. One is recipient, one is change
4. Change goes back to wallet

**Privacy Note:**
Change address should be NEW address (not reused) for privacy

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-011: Fee Estimation Accuracy

**Priority:** P1
**Time:** 15 minutes

**Purpose:** Verify fee estimates are reasonably accurate

**Steps:**
1. Create transaction with Medium fee
2. Note estimated fee: __________ BTC
3. Broadcast transaction
4. After confirmation, check actual fee on block explorer
5. Compare estimated vs actual

**Expected Results:**
- ✅ Estimated fee within 10-20% of actual
- ✅ Estimated time approximately correct
- ✅ Fee not wildly overestimated (no overpayment)
- ✅ Fee not underestimated (no stuck transaction)

**Comparison:**
```
Estimated Fee:  0.00000212 BTC
Actual Fee:     0.00000198 BTC
Difference:     -6.6% (acceptable)

Estimated Time: 10-20 min
Actual Time:    12 min
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-012: Transaction Broadcast Confirmation

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify transaction broadcast provides clear feedback

**Steps:**
1. Send transaction successfully
2. Observe success screen/message
3. Check transaction appears in history

**Expected Results:**
- ✅ Success message displayed: "Transaction sent successfully!"
- ✅ Transaction ID shown (full 64-character hex)
- ✅ "Copy TX ID" button available
- ✅ "View on Block Explorer" link available
- ✅ Link opens Blockstream with correct TX ID
- ✅ Balance updates immediately (deducted)
- ✅ Transaction appears in history with "Pending" status
- ✅ Can continue using wallet (not locked)

**Visual Example:**
```
┌──────────────────────────────────┐
│ ✅ Transaction Sent Successfully │
├──────────────────────────────────┤
│ Transaction ID:                  │
│ a3f5d2e8b9...c4d5e6f7 [Copy]   │
│                                  │
│ [View on Block Explorer]         │
│                                  │
│ Your transaction has been        │
│ broadcast to the network and     │
│ will be confirmed soon.          │
│                                  │
│        [Close]                   │
└──────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### SEND-EDGE-01: Send to Own Address

**Priority:** P2
**Time:** 5 minutes

**Steps:**
1. Get your own receiving address
2. Try to send Bitcoin to yourself
3. Observe behavior

**Expected:**
- ✅ Warning: "Sending to your own address - this will consolidate UTXOs"
- ✅ Transaction allowed (valid use case)
- ✅ OR: Transaction blocked with explanation

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-EDGE-02: Rapid Sequential Sends

**Priority:** P2
**Time:** 10 minutes

**Steps:**
1. Send transaction 1
2. Immediately send transaction 2 (before TX1 confirms)
3. Observe behavior

**Expected:**
- ✅ Both transactions broadcast successfully
- ✅ UTXO selection handles correctly
- ✅ No double-spend attempt
- ✅ Balances update correctly

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### SEND-EDGE-03: Cancel Transaction Before Broadcast

**Priority:** P2
**Time:** 2 minutes

**Steps:**
1. Fill send form
2. Click "Preview Transaction"
3. In preview modal, click "Cancel"
4. Observe no transaction broadcast

**Expected:**
- ✅ Modal closes
- ✅ No transaction sent
- ✅ Balance unchanged
- ✅ Can start over

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Test Summary

**Total Tests:** 12 core + 3 edge cases = 15 tests
**P0 Tests:** 9 (SEND-001 to SEND-009, SEND-012)
**P1 Tests:** 2 (SEND-010, SEND-011)
**P2 Tests:** 4 (SEND-EDGE-01, SEND-EDGE-02, SEND-EDGE-03)

**Critical Tests:**
- SEND-002/003/004: Fee tier transactions
- SEND-005: Send Max
- SEND-006: Address validation
- SEND-007: Amount validation
- SEND-009: Password security

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Transaction not appearing in mempool
**Cause:** Broadcast failed or very low fee
**Solution:** Check network connection, try higher fee
**Report As:** P0 bug if broadcast claims success

### Issue: Transaction stuck (unconfirmed for hours)
**Cause:** Fee too low for current network conditions
**Solution:** Wait longer or implement RBF (Replace-By-Fee)
**Report As:** P1 bug (fee estimation needs improvement)

### Issue: Incorrect fee calculation
**Cause:** UTXO selection or fee estimation bug
**Solution:** Review transaction builder code
**Report As:** P0 bug

### Issue: Change not returned to wallet
**Cause:** Change address derivation or UTXO tracking bug
**Solution:** Check change address generation
**Report As:** P0 critical bug (funds loss)

---

## Testnet Transaction Log Template

Use this template to document test transactions:

```
Test: SEND-002 (Slow Fee)
─────────────────────────────
Date/Time:    2025-10-29 14:30:00
From Account: Account 1
To Address:   tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
Amount:       0.0001 BTC
Fee:          0.00000141 BTC
Fee Rate:     Slow
TX ID:        a3f5d2e8b9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9
Broadcast:    Success ✅
Explorer:     https://blockstream.info/testnet/tx/[TX_ID]
Confirmations: 0 → 1 → 2 → ... → 6
Confirm Time: 32 minutes
Status:       PASS ✅
Notes:        Fee estimate accurate, confirmed within expected time
```

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
