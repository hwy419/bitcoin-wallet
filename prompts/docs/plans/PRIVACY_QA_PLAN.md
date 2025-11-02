# Privacy Enhancement - QA Manual Testing Plan & Release Checklist

**Version:** 1.0
**Created:** October 22, 2025
**Status:** Implementation-Ready
**Owner:** QA Engineer
**Related Documents:**
- `BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md` - Technical plan
- `PRIVACY_ENHANCEMENT_PRD.md` - Product requirements (success metrics page 8)
- `PRIVACY_AUDIT_REPORT.md` - Privacy audit findings
- `PRIVACY_UI_UX_DESIGN_SPEC.md` - UI/UX design specifications
- `PRIVACY_SECURITY_REVIEW.md` - Security review and threat model
- `PRIVACY_TESTING_PLAN.md` - Automated testing strategy (124 tests)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Manual Testing Strategy](#manual-testing-strategy)
3. [Testnet Validation Test Cases](#testnet-validation-test-cases)
4. [User Acceptance Testing Plan](#user-acceptance-testing-plan)
5. [Exploratory Testing Checklist](#exploratory-testing-checklist)
6. [Regression Test Suite](#regression-test-suite)
7. [Performance Benchmarks](#performance-benchmarks)
8. [Accessibility Checklist](#accessibility-checklist)
9. [Release Readiness Checklist](#release-readiness-checklist)
10. [Bug Severity Classification](#bug-severity-classification)
11. [Testnet Resources & Setup](#testnet-resources--setup)
12. [Testing Timeline & Execution Plan](#testing-timeline--execution-plan)

---

## Executive Summary

### Testing Scope

This manual testing plan covers **all Privacy Enhancement features** across Phase 2 (Default Privacy) and Phase 3 (Optional Privacy Mode), focusing on:

1. **Testnet validation** - Real Bitcoin testnet transactions to verify privacy features work correctly on-chain
2. **User acceptance testing** - Real user scenarios to validate comprehension and usability
3. **Exploratory testing** - Edge cases, unexpected behaviors, and creative testing scenarios
4. **Regression testing** - Ensure privacy changes don't break existing features
5. **Performance testing** - User-observable performance impact validation
6. **Accessibility testing** - WCAG AA compliance verification

### Testing Goals

**Primary Objectives:**
1. ✅ Validate **0% change address reuse** on real testnet transactions (100% unique)
2. ✅ Verify **UTXO randomization** is observable across 10+ testnet transactions
3. ✅ Confirm **receive address auto-generation** creates fresh addresses each time
4. ✅ Validate **contacts privacy warnings** are clear and actionable
5. ✅ Verify **xpub contact rotation** works across 5+ sends
6. ✅ Ensure **80% user comprehension** of privacy features (survey target)
7. ✅ Confirm **no performance regressions** (existing features remain fast)

### Manual Test Metrics

| Category | Test Cases | Priority | Estimated Time |
|----------|-----------|----------|----------------|
| **Testnet Validation** | 35 test cases | P0/P1 | 2 days |
| **User Acceptance Testing** | 15 scenarios | P0/P1 | 1 day |
| **Exploratory Testing** | 25 edge cases | P1/P2 | 1 day |
| **Regression Testing** | 20 test cases | P0 | 1 day |
| **Performance Testing** | 10 benchmarks | P1 | 0.5 days |
| **Accessibility Testing** | 15 checks | P1 | 0.5 days |
| **TOTAL** | **120 test cases** | - | **6 days** |

### Success Metrics

**Privacy Metrics (from PRD page 8):**
- **Change Address Reuse Rate**: 0% (currently 100%) ✅ CRITICAL
- **UTXO Selection Entropy**: >50% (currently 0%) ✅ CRITICAL
- **Receive Address Reuse Rate**: <10% (currently ~80%) ✅ TARGET
- **Contacts Privacy Warning Display**: 100% coverage ✅ TARGET

**User Behavior Metrics:**
- **Privacy Mode Adoption**: Track % users enabling optional features
- **Receive Address Generation**: Fresh address creation rate
- **Contacts Xpub Usage**: Track xpub vs single-address contacts
- **User Comprehension**: 80% correctly answer privacy concept questions (survey)

**Quality Metrics:**
- **Zero Privacy Regressions**: Automated tests prevent reintroduction
- **Documentation Coverage**: 100% of privacy features documented
- **User Complaints**: <1% privacy-related support tickets

---

## Manual Testing Strategy

### 1. Testing Environment Setup

#### Testnet Wallet Configuration

**Prerequisites:**
1. Bitcoin wallet extension installed in Chrome (development build)
2. Wallet created with testnet mode enabled
3. At least 0.5 tBTC (testnet Bitcoin) in wallet for transaction testing
4. Multiple accounts created (test multi-account privacy)
5. Contacts with both single-address and xpub types

**Test Environment:**
- **Browser**: Chrome 120+ (latest stable)
- **Network**: Bitcoin Testnet
- **API**: Blockstream Testnet API (`https://blockstream.info/testnet/api`)
- **Explorer**: Blockstream Testnet Explorer for transaction verification
- **Faucet**: https://testnet-faucet.mempool.co/ (for obtaining testnet BTC)

#### Test Data Preparation

**Accounts Needed:**
- Account 1: 10+ UTXOs (mix of sizes: 0.001, 0.01, 0.1 tBTC)
- Account 2: 5+ UTXOs (for regression testing)
- Multisig Account: 2-of-3 setup (test multisig change addresses)

**Contacts Needed:**
- Single-address contact: "Alice" (reusage testing)
- Xpub contact: "Bob" (rotation testing, 50+ cached addresses)
- Single-address contact: "Charlie" (high reusage, 10+ sends)

**Addresses Needed:**
- 20+ receive addresses generated (for gap limit testing)
- 10+ used addresses (for "Previously Used" badge testing)

---

### 2. Testing Approach

#### Test Execution Order

**Phase 1: Critical Path Testing (Day 1)**
1. Change address privacy validation (P0 - CRITICAL)
2. UTXO randomization observation (P0 - CRITICAL)
3. Gap limit enforcement (P0 - CRITICAL)
4. Contacts xpub rotation (P0 - CRITICAL)

**Phase 2: High Priority Testing (Day 2)**
5. Receive address auto-generation
6. Contacts privacy warnings
7. Privacy settings UI
8. Core wallet regression testing

**Phase 3: Optional Features & Edge Cases (Day 3)**
9. Round number randomization
10. API timing delays
11. Broadcast delays
12. Exploratory edge case testing

**Phase 4: UAT, Performance, Accessibility (Day 4)**
13. User acceptance testing scenarios
14. Performance benchmarks
15. Accessibility compliance checks

**Phase 5: Final Validation & Sign-Off (Day 5)**
16. Full regression suite
17. Release readiness checklist
18. Bug triage and fixes
19. Final privacy metrics validation

#### Test Execution Strategy

**For Each Test Case:**
1. **Pre-condition setup**: Ensure wallet state matches test requirements
2. **Execute test steps**: Follow detailed procedure
3. **Verify expected results**: Check all success criteria
4. **Document results**: Pass/Fail, screenshots, transaction IDs
5. **Blockchain verification**: For testnet tests, verify on explorer
6. **Log issues**: Create bug tickets for failures (see Bug Classification)

**Pass Criteria:**
- All expected results verified
- No unexpected errors or warnings
- User experience is smooth and intuitive
- Privacy metrics meet targets
- Blockchain analysis confirms privacy (for testnet tests)

**Fail Criteria:**
- Any expected result not met
- Critical errors or exceptions
- Privacy metrics don't meet targets (e.g., change address reuse detected)
- UX is confusing or blocks user workflow
- Blockchain analysis reveals privacy leak

---

## Testnet Validation Test Cases

### 3.1 Change Address Privacy (P0 - CRITICAL)

**Objective:** Verify that every transaction uses a unique change address, preventing transaction linkability.

**Pre-conditions:**
- Wallet unlocked with Account 1 active
- Account 1 has 10+ UTXOs (total ~0.5 tBTC)
- Fresh wallet state (internalIndex = 0 or low)

---

#### TC-TESTNET-001: Single Transaction Change Address Uniqueness

**Priority:** P0 - CRITICAL
**Type:** Functional, Privacy
**Estimated Time:** 10 minutes

**Test Steps:**
1. Note current `internalIndex` for Account 1
2. Navigate to SendScreen
3. Enter recipient address: `tb1qtest1234...` (use faucet return address)
4. Enter amount: 0.01 tBTC
5. Select fee rate: Medium
6. Review transaction summary
7. Send transaction
8. Wait for transaction broadcast confirmation
9. Copy transaction ID (txid)

**Expected Results:**
- ✅ Transaction broadcasts successfully
- ✅ Transaction confirmation shows success
- ✅ `internalIndex` incremented by 1

**Blockchain Verification:**
1. Open Blockstream Testnet Explorer: `https://blockstream.info/testnet/tx/{txid}`
2. Identify transaction outputs:
   - Output 1: Recipient address (0.01 tBTC)
   - Output 2: Change address
3. Verify change address:
   - ✅ Change address is NOT the first receive address (`account.addresses[0]`)
   - ✅ Change address is NOT in receive address list (external chain)
   - ✅ Change address format matches account type (Native SegWit: `tb1q...`)

**Success Criteria:**
- Change address is unique (not reused)
- Change address is on internal chain (not in receive list)
- Privacy indicator showed "Using unique change address for privacy" in SendScreen

**Bug Classification if Failed:**
- CRITICAL - Blocks release if change address reused

---

#### TC-TESTNET-002: Multiple Transactions Change Address Uniqueness (10 Transactions)

**Priority:** P0 - CRITICAL
**Type:** Functional, Privacy
**Estimated Time:** 45 minutes

**Test Steps:**
1. Record starting `internalIndex`
2. Send 10 separate transactions:
   - Transaction 1: 0.01 tBTC to `tb1qaddr1...`
   - Transaction 2: 0.02 tBTC to `tb1qaddr2...`
   - Transaction 3: 0.015 tBTC to `tb1qaddr3...`
   - Transaction 4: 0.03 tBTC to `tb1qaddr4...`
   - Transaction 5: 0.005 tBTC to `tb1qaddr5...`
   - Transaction 6: 0.025 tBTC to `tb1qaddr6...`
   - Transaction 7: 0.01 tBTC to `tb1qaddr7...`
   - Transaction 8: 0.02 tBTC to `tb1qaddr8...`
   - Transaction 9: 0.015 tBTC to `tb1qaddr9...`
   - Transaction 10: 0.01 tBTC to `tb1qaddr10...`
3. Record each transaction ID
4. Verify `internalIndex` incremented by 10

**Expected Results:**
- ✅ All 10 transactions broadcast successfully
- ✅ `internalIndex` increased by exactly 10

**Blockchain Verification:**
1. For each transaction, extract change address using explorer
2. Create list of 10 change addresses
3. Verify:
   - ✅ All 10 change addresses are different (100% unique)
   - ✅ No change address appears in receive address list
   - ✅ No change address is `account.addresses[0]`

**Privacy Metric Calculation:**
```
Change Address Reuse Rate = (10 transactions - 10 unique addresses) / 10 × 100%
Expected: 0%
```

**Success Criteria:**
- **0% change address reuse** (10/10 unique)
- All change addresses use internal chain
- No transaction graph linkage via change addresses

**Bug Classification if Failed:**
- CRITICAL - Blocks release immediately

---

#### TC-TESTNET-003: Multisig Change Address Uniqueness

**Priority:** P0 - CRITICAL
**Type:** Functional, Privacy (Multisig)
**Estimated Time:** 20 minutes

**Test Steps:**
1. Switch to multisig account (2-of-3 or 2-of-2)
2. Send 3 multisig transactions:
   - Transaction 1: Build → Sign → Broadcast (0.01 tBTC)
   - Transaction 2: Build → Sign → Broadcast (0.02 tBTC)
   - Transaction 3: Build → Sign → Broadcast (0.015 tBTC)
3. Record transaction IDs

**Expected Results:**
- ✅ All multisig transactions broadcast successfully
- ✅ Multisig `internalIndex` incremented by 3

**Blockchain Verification:**
1. Extract change addresses from all 3 transactions
2. Verify:
   - ✅ All 3 change addresses are different
   - ✅ Change addresses match multisig script type (P2SH, P2WSH, or P2SH-P2WSH)
   - ✅ Change addresses use BIP48 internal chain (m/48'/1'/account'/script_type'/1/index)

**Success Criteria:**
- 0% multisig change address reuse
- BIP48 compliance maintained
- Multisig change addresses distinct from single-sig

**Bug Classification if Failed:**
- CRITICAL - Multisig privacy broken

---

#### TC-TESTNET-004: Change Address Not in Receive List

**Priority:** P0
**Type:** Functional, Privacy
**Estimated Time:** 15 minutes

**Test Steps:**
1. Send 1 transaction from Account 1
2. Extract change address from blockchain
3. Navigate to ReceiveScreen
4. Expand address history (show all addresses)
5. Search for change address in receive address list

**Expected Results:**
- ✅ Change address does NOT appear in receive address list
- ✅ Receive list shows only external chain addresses (index 0)

**Success Criteria:**
- Internal chain addresses never shown in receive UI
- User cannot accidentally share change address as receive address

**Bug Classification if Failed:**
- HIGH - Privacy leak (change address exposed)

---

### 3.2 UTXO Randomization Validation (P0 - CRITICAL)

**Objective:** Verify that UTXO selection varies across transactions, preventing wallet fingerprinting.

---

#### TC-TESTNET-005: UTXO Selection Variation Across Identical Transactions

**Priority:** P0 - CRITICAL
**Type:** Functional, Privacy
**Estimated Time:** 30 minutes

**Pre-conditions:**
- Account 1 has 10 UTXOs of varying sizes:
  - 5 × 0.01 tBTC
  - 3 × 0.05 tBTC
  - 2 × 0.1 tBTC

**Test Steps:**
1. Send 5 transactions with identical parameters:
   - Amount: 0.08 tBTC (same for all)
   - Fee rate: 1 sat/vbyte (same for all)
   - Recipient: Different addresses (to avoid linkage)
2. Record transaction IDs
3. Wait for all confirmations

**Expected Results:**
- ✅ All 5 transactions broadcast successfully

**Blockchain Verification:**
1. For each transaction, identify which UTXOs were used as inputs
2. Create matrix:
   ```
   Tx1: UTXOs [A, B, C]
   Tx2: UTXOs [D, E]
   Tx3: UTXOs [A, F]
   Tx4: UTXOs [G, H]
   Tx5: UTXOs [B, I]
   ```
3. Count unique UTXO selection patterns
4. Calculate:
   ```
   Unique Selections / Total Transactions × 100%
   Target: >40% unique patterns (at least 2 different selections out of 5)
   ```

**Expected Observation:**
- ✅ At least 2 different UTXO selection patterns observed
- ✅ Selection is NOT consistently largest-first
- ✅ Selection is NOT consistently smallest-first
- ✅ Selection appears random/unpredictable

**Success Criteria:**
- Non-deterministic UTXO selection demonstrated
- No consistent greedy or smallest-first pattern
- Evidence of randomization (varied selections)

**Bug Classification if Failed:**
- CRITICAL - UTXO fingerprinting vulnerability

---

#### TC-TESTNET-006: UTXO Entropy Observation (Manual Analysis)

**Priority:** P0
**Type:** Privacy, Analytics
**Estimated Time:** 20 minutes

**Test Steps:**
1. Use results from TC-TESTNET-005 (5 transactions)
2. Analyze UTXO selection patterns:
   - Did largest UTXOs always get selected first? (greedy pattern)
   - Did smallest UTXOs always get selected first? (smallest-first pattern)
   - Was there variation in UTXO order?
3. Document observations

**Expected Observations:**
- ✅ No consistent largest-first selection
- ✅ No consistent smallest-first selection
- ✅ Selection order varies across transactions
- ✅ Observer cannot predict next UTXO selection

**Entropy Assessment:**
- **LOW ENTROPY (FAIL)**: Same UTXO selection every time
- **MEDIUM ENTROPY (PASS)**: 2-3 different patterns out of 5 transactions
- **HIGH ENTROPY (EXCELLENT)**: 4-5 different patterns out of 5 transactions

**Success Criteria:**
- Medium or High entropy observed
- No wallet fingerprinting pattern detected

**Bug Classification if Failed:**
- HIGH - UTXO selection still predictable

---

### 3.3 Receive Address Auto-Generation (P1 - HIGH)

---

#### TC-TESTNET-007: Fresh Address Generated on ReceiveScreen Mount

**Priority:** P1
**Type:** Functional, Privacy
**Estimated Time:** 10 minutes

**Test Steps:**
1. Note current `externalIndex` for Account 1
2. Navigate to Dashboard (or any screen other than Receive)
3. Click "Receive" button
4. Observe ReceiveScreen loads

**Expected Results:**
- ✅ Loading indicator briefly appears ("Generating address...")
- ✅ Green privacy banner displays: "✓ New address generated for privacy"
- ✅ Banner auto-dismisses after 3 seconds
- ✅ QR code displays new address
- ✅ Address displayed is fresh (not previously shown)
- ✅ `externalIndex` incremented by 1

**Success Criteria:**
- Fresh address auto-generated without user action
- Privacy banner educates user about why address was generated
- UX is smooth (no errors, fast generation <1 second)

**Bug Classification if Failed:**
- HIGH - Auto-generation not working (privacy feature disabled)

---

#### TC-TESTNET-008: Fresh Address Each Time ReceiveScreen Opened (10 Opens)

**Priority:** P1
**Type:** Functional, Privacy
**Estimated Time:** 15 minutes

**Test Steps:**
1. Record starting `externalIndex`
2. Open ReceiveScreen 10 times (close and re-open each time):
   - Open 1: Record address A
   - Close screen, return to Dashboard
   - Open 2: Record address B
   - (Repeat 8 more times)
3. Verify `externalIndex` increased by 10
4. Compare all 10 addresses

**Expected Results:**
- ✅ All 10 addresses are different (100% unique)
- ✅ Privacy banner appeared 10 times
- ✅ `externalIndex` = starting + 10

**Success Criteria:**
- Fresh address generated every time
- No address reuse
- User encouraged to use new address each time

**Estimated Address Reuse Reduction:**
- Before: ~80% users reused addresses
- After: <10% users reuse (target met)

**Bug Classification if Failed:**
- HIGH - Auto-generation inconsistent

---

#### TC-TESTNET-009: Gap Limit Warning (15 Unused Addresses)

**Priority:** P0 - CRITICAL (Security)
**Type:** Functional, Security
**Estimated Time:** 20 minutes

**Pre-conditions:**
- Account has 10 unused addresses already

**Test Steps:**
1. Generate 5 more addresses (open ReceiveScreen 5 times without receiving funds)
2. Total unused addresses: 15
3. Open ReceiveScreen again (16th address attempt)

**Expected Results:**
- ✅ Address generation succeeds (gap < 20)
- ✅ Amber warning box displays:
   ```
   ⚠️ Approaching Gap Limit
   You have 15 unused addresses. Consider using existing addresses.
   ```
- ✅ Warning is dismissible but re-appears on next open
- ✅ Address still generated successfully

**Success Criteria:**
- Warning educates user about gap limit
- User not blocked (can still generate)
- Warning is clear and non-technical

**Bug Classification if Failed:**
- HIGH - Gap limit warning not implemented (security risk)

---

#### TC-TESTNET-010: Gap Limit Enforcement (20 Unused Addresses)

**Priority:** P0 - CRITICAL (Security)
**Type:** Functional, Security
**Estimated Time:** 15 minutes

**Pre-conditions:**
- Account has 15 unused addresses (from TC-TESTNET-009)

**Test Steps:**
1. Generate 5 more addresses (total 20 unused)
2. Attempt to generate 21st address (open ReceiveScreen again)

**Expected Results:**
- ✅ Error message displays (red error box):
   ```
   ❌ Gap Limit Reached
   Cannot generate more addresses until existing addresses are used.
   You have 20 unused addresses (BIP44 gap limit).
   ```
- ✅ Address generation BLOCKED (no new address created)
- ✅ `externalIndex` does NOT increment
- ✅ Most recent address displayed as fallback
- ✅ "Try Again" button present (but fails again if clicked)

**Success Criteria:**
- Gap limit strictly enforced at 20
- User cannot exceed gap limit
- Error message explains why generation blocked
- Wallet recovery from seed remains possible

**Bug Classification if Failed:**
- CRITICAL - Gap limit not enforced (wallet recovery risk)

---

### 3.4 Contacts Privacy - Xpub Rotation (P0 - CRITICAL)

---

#### TC-TESTNET-011: Xpub Contact Address Rotation (5 Sends)

**Priority:** P0 - CRITICAL
**Type:** Functional, Privacy
**Estimated Time:** 30 minutes

**Pre-conditions:**
- Contact "Bob" created with xpub
- Bob has 50+ cached addresses
- Bob's `lastUsedAddressIndex` = undefined (never used)

**Test Steps:**
1. Navigate to SendScreen
2. Select contact "Bob" from dropdown
3. Observe address auto-populated
4. Record address: `addr_bob_1`
5. Send 0.01 tBTC to Bob
6. Wait for confirmation
7. Repeat steps 1-6 four more times (total 5 sends)
8. Record all 5 addresses used

**Expected Results:**
- ✅ Send 1 uses cached address index 0: `addr_bob_1`
- ✅ Send 2 uses cached address index 1: `addr_bob_2`
- ✅ Send 3 uses cached address index 2: `addr_bob_3`
- ✅ Send 4 uses cached address index 3: `addr_bob_4`
- ✅ Send 5 uses cached address index 4: `addr_bob_5`
- ✅ All 5 addresses are different (0% reuse)
- ✅ Bob's `lastUsedAddressIndex` = 4 after 5 sends
- ✅ Green success indicator shown: "✓ Privacy Active: Address Rotation"

**Blockchain Verification:**
1. For each of 5 transactions, verify recipient address
2. Confirm all 5 recipient addresses are different
3. Verify addresses match Bob's cached addresses

**Success Criteria:**
- 100% address rotation (0% reuse)
- User sees positive privacy indicator
- Transparent which address index is being used

**Bug Classification if Failed:**
- CRITICAL - Xpub rotation not working

---

#### TC-TESTNET-012: Xpub Contact Transaction History Matching

**Priority:** P1
**Type:** Functional, Privacy
**Estimated Time:** 10 minutes

**Pre-conditions:**
- TC-TESTNET-011 completed (5 sends to Bob)

**Test Steps:**
1. Navigate to Dashboard
2. View transaction history
3. Locate all 5 sends to Bob

**Expected Results:**
- ✅ All 5 transactions display contact name: "Bob"
- ✅ All 5 transactions show privacy badge: "✓" (green checkmark)
- ✅ Tooltip on badge: "Sent to Bob using address rotation (privacy enabled)"
- ✅ Transaction details show which cached address was used (e.g., "Address #1")

**Success Criteria:**
- Contact matching works for all cached addresses
- User can see privacy was protected
- Transaction history is informative

**Bug Classification if Failed:**
- MEDIUM - Contact matching broken (UX issue, privacy still works)

---

### 3.5 Contacts Privacy - Single Address Warnings (P1)

---

#### TC-TESTNET-013: Single-Address Contact Reusage Warning

**Priority:** P1
**Type:** Functional, Privacy
**Estimated Time:** 25 minutes

**Pre-conditions:**
- Contact "Alice" created with single address
- Alice's `reusageCount` = 0 (never sent to)

**Test Steps:**
1. Navigate to SendScreen
2. Select contact "Alice"
3. Observe warning message
4. Send 0.01 tBTC to Alice
5. Wait for confirmation
6. Repeat 4 more times (total 5 sends to Alice)
7. After 5 sends, view Alice's contact card

**Expected Results:**

**Send 1:**
- ✅ Amber warning displays:
   ```
   ⚠️ Privacy Notice: Address Reuse
   This contact uses a single address. Sent 0 times before.

   Why this matters: Reusing addresses links all your payments to this
   contact publicly on the blockchain.

   💡 Tip: Ask Alice for an xpub to enable automatic address rotation.
   ```
- ✅ Warning is informative, not blocking
- ✅ User can still send (privacy choice)

**Sends 2-4:**
- ✅ Warning updates counter: "Sent 1 time before", "Sent 2 times", etc.

**Send 5:**
- ✅ Warning emphasizes high reusage:
   ```
   ⚠️ Sent 4 times — high privacy risk
   Consider upgrading to xpub contact for address rotation.
   ```

**Contact Card After 5 Sends:**
- ✅ Badge displays: "⚠️ Reuses Address"
- ✅ Reusage counter: "Sent 5 times to this address"
- ✅ Suggestion: "💡 Consider upgrading to xpub contact"

**Success Criteria:**
- User educated about privacy risk
- Counter accurately tracks reusage
- Warning doesn't block workflow (inform, don't prevent)

**Bug Classification if Failed:**
- MEDIUM - Privacy warnings not educating users

---

### 3.6 Optional Privacy Mode Features (P2)

---

#### TC-TESTNET-014: Round Number Randomization

**Priority:** P2
**Type:** Functional, Privacy
**Estimated Time:** 15 minutes

**Pre-conditions:**
- Privacy Settings: "Randomize Round Amounts" = ON

**Test Steps:**
1. Navigate to SendScreen
2. Enter round amount: 0.1 tBTC
3. Observe randomization indicator

**Expected Results:**
- ✅ Blue info box displays:
   ```
   ℹ️ Amount randomized for privacy: 0.10023 BTC

   Small variance (+0.1%) added to prevent change detection.

   [Use exact amount instead]
   ```
- ✅ Randomized amount shown in monospace font
- ✅ Original amount (0.1) vs randomized (0.10023) both visible
- ✅ User can click "Use exact amount instead" to disable for this transaction

**Blockchain Verification:**
1. Send transaction and extract txid
2. View on explorer, verify recipient received randomized amount
3. Confirm randomized amount is within ±0.1% of 0.1 BTC
   - Min: 0.0999 BTC
   - Max: 0.1001 BTC

**Success Criteria:**
- Round numbers detected correctly
- Randomization applied (±0.1% variance)
- User can override if needed

**Bug Classification if Failed:**
- MEDIUM - Optional feature not working (not blocking)

---

#### TC-TESTNET-015: API Request Timing Delays

**Priority:** P2
**Type:** Functional, Performance
**Estimated Time:** 10 minutes

**Pre-conditions:**
- Privacy Settings: "Randomize API Request Timing" = ON

**Test Steps:**
1. Navigate to Dashboard
2. Click "Refresh Balance" button
3. Start timer
4. Observe balance update

**Expected Results:**
- ✅ Loading spinner displays
- ✅ Message shows: "Refreshing with privacy mode (5s delay per address)"
- ✅ Balance update takes noticeably longer than normal
   - Normal refresh: ~2-5 seconds
   - Privacy mode refresh: ~10-30 seconds (depends on number of addresses)
- ✅ Balance eventually updates successfully

**Performance Measurement:**
- Record time for balance refresh
- Expected: 1-5 second delay per address queried
- For 10 addresses: 10-50 seconds total

**Success Criteria:**
- Delays applied (observable slower refresh)
- User informed about privacy mode (loading message)
- Balance still updates correctly (no timeout errors)

**Bug Classification if Failed:**
- LOW - Optional feature performance issue

---

#### TC-TESTNET-016: Transaction Broadcast Delay

**Priority:** P2
**Type:** Functional, Performance
**Estimated Time:** 15 minutes

**Pre-conditions:**
- Privacy Settings: "Delay Transaction Broadcast" = ON

**Test Steps:**
1. Navigate to SendScreen
2. Send transaction (0.01 tBTC to any address)
3. After clicking "Send", observe countdown UI

**Expected Results:**
- ✅ Countdown modal displays:
   ```
   Broadcasting in 12 seconds...

   [Broadcast Now]  [Cancel]
   ```
- ✅ Countdown decrements every second
- ✅ User can click "Broadcast Now" to skip delay
- ✅ User can click "Cancel" to abort transaction
- ✅ After countdown completes, transaction broadcasts
- ✅ Transaction confirmation shown

**Edge Case: Close Popup During Delay**
- ✅ Close popup during countdown
- ✅ Re-open wallet
- ✅ Dashboard shows "Transaction pending..." indicator
- ✅ Transaction broadcasts after delay expires (even though popup was closed)
- ✅ Service worker handled broadcast via chrome.alarms

**Success Criteria:**
- Delay works as designed (5-30 seconds random)
- User has control (skip or cancel)
- Transaction still broadcasts if popup closed

**Bug Classification if Failed:**
- MEDIUM - Optional feature UX issue

---

## User Acceptance Testing Plan

### 4.1 UAT Overview

**Objective:** Validate that real users can understand and use privacy features effectively.

**Target:** **80% user comprehension** of privacy concepts (success metric from PRD)

**Participants:**
- 5-10 users (mix of technical and non-technical)
- Users unfamiliar with privacy features (fresh perspective)
- Users familiar with Bitcoin basics but not privacy specifics

**Testing Format:**
- **Guided scenarios**: Users complete tasks while thinking aloud
- **Comprehension survey**: Users answer questions after completing scenarios
- **Feedback collection**: Open-ended questions about usability

---

### 4.2 UAT Scenarios

#### UAT-001: First-Time User - Wallet Creation & First Receive

**User Persona:** Sarah - Non-technical user, first Bitcoin wallet

**Scenario:**
> "You've just installed the Bitcoin wallet extension. Create a new wallet and receive your first Bitcoin payment."

**Tasks:**
1. Create new wallet with seed phrase
2. Navigate to Receive screen
3. Observe privacy banner
4. Copy address to share with sender
5. (Simulation: Funds received)
6. View transaction in history

**Observation Points:**
- Does user notice privacy banner?
- Does user understand why new address was generated?
- Is user confused by "Fresh" vs "Previously Used" badges?

**Comprehension Questions (After Scenario):**
1. **Q:** "Why did the wallet generate a new address for you?"
   - **Correct Answer:** "For privacy" or "To prevent address reuse" or "To protect my financial privacy"
   - **Incorrect Answer:** "I don't know" or "Because the old one expired" or other wrong reasons

2. **Q:** "What happens if you use the same address multiple times?"
   - **Correct Answer:** "It reduces privacy" or "Transactions can be linked" or "People can see my transaction history"
   - **Incorrect Answer:** "Nothing" or "It's faster" or wrong answers

3. **Q:** "What does the green banner 'New address generated for privacy' mean?"
   - **Correct Answer:** "The wallet created a fresh address to protect my privacy"
   - **Incorrect Answer:** "I don't know" or incorrect interpretations

**Success Metric:**
- **Target:** 80% of users answer all 3 questions correctly

---

#### UAT-002: Contacts User - Address Reuse Education

**User Persona:** Mike - Moderate technical knowledge, uses contacts feature

**Scenario:**
> "You want to send Bitcoin to your friend Alice. You've saved Alice's address in your contacts."

**Tasks:**
1. Navigate to Contacts screen
2. Create contact "Alice" with single address
3. Navigate to SendScreen
4. Select Alice from contacts
5. Observe privacy warning
6. Read warning message
7. Send 0.01 tBTC to Alice

**Observation Points:**
- Does user read privacy warning?
- Does user understand why address reuse is a risk?
- Does user know what an "xpub" is?
- Is warning helpful or annoying?

**Comprehension Questions:**
1. **Q:** "What did the orange warning tell you about sending to Alice?"
   - **Correct:** "It warned that reusing her address reduces privacy"
   - **Incorrect:** "It said the transaction would fail" or "I didn't read it"

2. **Q:** "What is an 'xpub contact' and why is it better?"
   - **Correct:** "It lets the wallet use different addresses for each payment, protecting privacy"
   - **Incorrect:** "I don't know" or wrong answer

3. **Q:** "Would you consider asking Alice for an xpub instead of a single address?"
   - **Desired:** "Yes" or "Maybe" (shows user is considering privacy)
   - **Concerning:** "No, too complicated" (shows UX issue)

**Success Metric:**
- 80% understand address reuse risk
- 60% willing to use xpub contacts (behavior metric)

---

#### UAT-003: Privacy-Conscious User - Optional Privacy Mode

**User Persona:** Alex - Technical user, cares about privacy

**Scenario:**
> "You're concerned about network-level surveillance. Explore the Privacy Mode settings and enable features you think are important."

**Tasks:**
1. Navigate to Settings
2. Expand Privacy Mode section
3. Read descriptions of all 3 toggles
4. Enable 1 or more privacy features
5. Send a transaction with privacy mode enabled

**Observation Points:**
- Does user understand trade-offs (privacy vs. speed)?
- Does user find settings discoverable?
- Does user know which features to enable?
- Is help content useful?

**Comprehension Questions:**
1. **Q:** "What does 'Randomize API Request Timing' do?"
   - **Correct:** "Adds delays to prevent network observers from linking my addresses"
   - **Incorrect:** "Makes transactions faster" or "I don't know"

2. **Q:** "What is the trade-off of enabling this feature?"
   - **Correct:** "Slower balance updates (5-20 seconds)"
   - **Incorrect:** "No trade-off" or wrong answer

3. **Q:** "When would you enable 'Delay Transaction Broadcast'?"
   - **Correct:** "If I'm worried about IP-based tracking" or "For maximum privacy"
   - **Incorrect:** "Always" or "Never" or "I don't know"

**Success Metric:**
- 80% understand trade-offs clearly
- 90% can enable/disable settings successfully

---

### 4.3 UAT Comprehension Survey

**Administered After All Scenarios:**

**Section 1: Privacy Feature Awareness**

1. **Q:** "Which privacy features does this wallet provide by default (without you enabling anything)?"
   - **Options (select all that apply):**
     - [ ] Unique change addresses for every transaction ✅ CORRECT
     - [ ] Randomized UTXO selection ✅ CORRECT
     - [ ] Fresh receive addresses ✅ CORRECT
     - [ ] Tor network routing ❌ INCORRECT
     - [ ] Automatic mixing (CoinJoin) ❌ INCORRECT
   - **Target:** 80% select all 3 correct options

2. **Q:** "What is the main privacy benefit of using a new receive address for each transaction?"
   - **Options:**
     - [ ] It prevents transaction linking ✅ CORRECT
     - [ ] It makes transactions faster ❌
     - [ ] It reduces fees ❌
     - [ ] It encrypts the transaction ❌
   - **Target:** 80% select correct answer

**Section 2: Contacts Privacy Understanding**

3. **Q:** "What does the '⚠️ Reuses Address' badge on a contact mean?"
   - **Open-ended answer**
   - **Correct Answer Criteria:** Mentions privacy risk, address reuse, or transaction linking
   - **Target:** 80% provide correct answer

4. **Q:** "What does the '✓ Privacy: Rotation' badge on a contact mean?"
   - **Open-ended answer**
   - **Correct Answer Criteria:** Mentions address rotation, different addresses per payment, or enhanced privacy
   - **Target:** 80% provide correct answer

**Section 3: Privacy Trade-offs**

5. **Q:** "Optional privacy features (like API timing delays) have trade-offs. What is the main trade-off mentioned in the settings?"
   - **Options:**
     - [ ] Slower wallet operations (balance updates, transactions) ✅ CORRECT
     - [ ] Higher transaction fees ❌
     - [ ] Less security ❌
     - [ ] Incompatibility with other wallets ❌
   - **Target:** 80% select correct answer

**Section 4: Usability Feedback**

6. **Q:** "Rate your understanding of the privacy features:" (1-5 scale)
   - 1 = Very Confused
   - 5 = Very Clear
   - **Target:** Average rating ≥ 4.0

7. **Q:** "Did the privacy warnings/tips help you understand the risks?" (Yes/No/Unsure)
   - **Target:** >70% answer "Yes"

8. **Q:** "Would you recommend this wallet to someone who cares about privacy?" (Yes/No/Maybe)
   - **Target:** >80% answer "Yes" or "Maybe"

**Section 5: Open Feedback**

9. **Q:** "What was confusing or unclear about the privacy features?" (Open-ended)
   - Use feedback to identify UX improvements

10. **Q:** "What did you like most about the privacy features?" (Open-ended)
   - Use feedback to identify strengths

**UAT Success Criteria:**
- **Overall Comprehension:** ≥80% of users answer questions 1-5 correctly
- **Usability Rating:** Average ≥4.0 on question 6
- **Usefulness:** ≥70% find warnings helpful (question 7)
- **Recommendation:** ≥80% would recommend (question 8)

---

## Exploratory Testing Checklist

### 5.1 Edge Cases - Change Address Generation

**EC-001: Rapid Transaction Sending (Concurrency)**
- **Test:** Send 5 transactions as fast as possible (<10 seconds)
- **Expected:** All 5 use different change addresses, no race conditions
- **Verify:** internalIndex increments correctly (by 5)

**EC-002: Transaction Failure After Change Address Generated**
- **Test:** Build transaction (change address generated) → Simulate network error → Transaction fails
- **Expected:** Change address still consumed (internalIndex incremented), no reuse on retry
- **Verify:** Retry transaction uses NEW change address

**EC-003: Insufficient Funds (No Change Output)**
- **Test:** Send transaction where UTXO amount exactly matches target + fee (no change)
- **Expected:** No change output created, internalIndex does NOT increment
- **Verify:** Next transaction with change uses correct next index

**EC-004: Service Worker Termination During Transaction**
- **Test:** Start transaction build → Terminate service worker → Restart extension
- **Expected:** Transaction state lost OR properly resumed, no partial state corruption
- **Verify:** internalIndex remains consistent

**EC-005: Import Wallet with Existing Change Addresses**
- **Test:** Import seed phrase from wallet that already has change addresses (internalIndex > 0)
- **Expected:** Wallet scans and finds existing change addresses, internalIndex restored correctly
- **Verify:** Next transaction uses correct next change address (no duplication)

---

### 5.2 Edge Cases - UTXO Randomization

**EC-006: Single UTXO (No Randomization Possible)**
- **Test:** Wallet has only 1 UTXO, send transaction
- **Expected:** Algorithm selects the only UTXO (no randomization needed)
- **Verify:** Transaction succeeds, no errors

**EC-007: Exact Match UTXO (No Change)**
- **Test:** Wallet has UTXO that exactly covers target + fee
- **Expected:** That UTXO selected (most efficient), no change output
- **Verify:** Transaction succeeds, change = 0

**EC-008: Fragmented UTXOs (Many Small UTXOs)**
- **Test:** Wallet has 20 small UTXOs (0.001 tBTC each), send 0.015 tBTC
- **Expected:** Randomized selection picks ~16 UTXOs (sufficient for target + fees)
- **Verify:** Transaction succeeds, fees reasonable (<10% more than greedy)

**EC-009: Mixed UTXO Sizes (1 Large, 10 Small)**
- **Test:** Wallet has 1×0.5 tBTC and 10×0.01 tBTC, send 0.05 tBTC
- **Expected:** Sometimes selects large UTXO, sometimes multiple small UTXOs (randomization)
- **Verify:** Selection varies across multiple sends

**EC-010: All UTXOs Below Dust Threshold After Fee**
- **Test:** Wallet has UTXOs that would create dust change, send transaction
- **Expected:** Selection algorithm avoids dust change (combines UTXOs or adds UTXO to avoid dust)
- **Verify:** Change output ≥546 sats OR change = 0

---

### 5.3 Edge Cases - Receive Address Auto-Generation

**EC-011: Slow Network During Generation**
- **Test:** Throttle network to 3G speeds, open ReceiveScreen
- **Expected:** Loading spinner displays, generation completes within 5 seconds
- **Verify:** No timeout errors, address generated successfully

**EC-012: Generation Failure (Mock Error)**
- **Test:** Mock handleGenerateAddress to return error
- **Expected:** Red error box displays with clear message, fallback to most recent address
- **Verify:** "Try Again" button allows retry

**EC-013: Open ReceiveScreen, Close Before Generation Completes**
- **Test:** Open ReceiveScreen → Immediately close (within 500ms)
- **Expected:** No partial state update, generation cancelled cleanly
- **Verify:** externalIndex doesn't increment if address not displayed

**EC-014: Gap Limit Edge - Exactly 20 Unused Addresses**
- **Test:** Generate 20 unused addresses, open ReceiveScreen
- **Expected:** Error message blocks generation, explains gap limit
- **Verify:** User can still view existing unused addresses

**EC-015: Gap Limit Edge - Receive Funds to 1 Address, Then Generate 20 More**
- **Test:** 20 unused addresses → Receive funds to address #5 (now 19 unused) → Generate 1 more
- **Expected:** Generation succeeds (gap < 20)
- **Verify:** Gap calculated correctly (ignores used addresses)

---

### 5.4 Edge Cases - Contacts Privacy

**EC-016: Xpub Contact with Exhausted Cache**
- **Test:** Create xpub contact with 20 cached addresses, send to all 20
- **Expected:** 21st send shows error: "Address cache exhausted. Please regenerate cache."
- **Verify:** Error is clear, suggests solution

**EC-017: Single-Address Contact - 100+ Sends**
- **Test:** Send to single-address contact 100 times
- **Expected:** reusageCount = 100, warning escalates after 5, 10, 50 sends
- **Verify:** Counter doesn't overflow, warnings remain informative

**EC-018: Contact Matching with Multiple Contacts Using Same Address**
- **Test:** Create 2 contacts ("Alice" and "Bob") with same address (user error)
- **Expected:** Transaction history matches first contact alphabetically OR shows both
- **Verify:** No crash, user aware of duplicate contacts

**EC-019: Xpub Contact - Manual Address Override**
- **Test:** Select xpub contact, manually edit address field to different address
- **Expected:** Manual address used (overrides rotation), lastUsedAddressIndex doesn't increment
- **Verify:** User has control, rotation only applies when using auto-populated address

**EC-020: Delete Contact After Sending**
- **Test:** Send to contact "Alice", then delete Alice contact
- **Expected:** Transaction history no longer shows contact name (shows address instead)
- **Verify:** Transaction data intact, no errors

---

### 5.5 Edge Cases - Privacy Settings

**EC-021: Enable Privacy Mode, Then Disable Mid-Request**
- **Test:** Enable "Randomize API Timing" → Start balance refresh → Disable setting mid-refresh
- **Expected:** Current refresh completes with delays, next refresh has no delays
- **Verify:** Setting change doesn't break in-flight requests

**EC-022: Round Number Detection False Positive**
- **Test:** Send amount 1.0001 tBTC (close to round but not round)
- **Expected:** No randomization applied (not detected as round)
- **Verify:** Exact amount sent

**EC-023: Round Number Detection - Very Small Amount**
- **Test:** Send 1000 sats (0.00001 tBTC, has trailing zeros)
- **Expected:** Detected as round, randomization offered
- **Verify:** Randomization works for small amounts

**EC-024: Broadcast Delay - Cancel and Re-send Immediately**
- **Test:** Enable broadcast delay → Send transaction → Cancel during countdown → Send new transaction immediately
- **Expected:** First transaction cancelled (not broadcast), second transaction queues with new delay
- **Verify:** No duplicate broadcasts, clean cancellation

**EC-025: API Timing Delays - Timeout with 50 Addresses**
- **Test:** Account with 50 addresses, enable API timing delays, refresh balance
- **Expected:** Cumulative timeout enforced (60 seconds), partial results shown, error message after timeout
- **Verify:** Wallet doesn't hang, user informed of timeout

---

## Regression Test Suite

### 6.1 Core Wallet Functions (Unchanged by Privacy Features)

**Objective:** Ensure privacy enhancements don't break existing functionality.

---

#### REG-001: Wallet Creation (New Seed)

**Test Steps:**
1. Create new wallet with 12-word seed phrase
2. Verify seed phrase displayed
3. Confirm seed phrase (enter words)
4. Set password
5. Unlock wallet

**Expected Results:**
- ✅ Wallet created successfully
- ✅ Seed phrase valid (12 words from BIP39 wordlist)
- ✅ Password set, wallet encrypted
- ✅ No errors or crashes

**Success Criteria:**
- Wallet creation flow unchanged
- Privacy features don't interfere with setup

---

#### REG-002: Wallet Import (Existing Seed)

**Test Steps:**
1. Import wallet with known seed phrase
2. Set password
3. Unlock wallet
4. Verify accounts and addresses recovered

**Expected Results:**
- ✅ Wallet imported successfully
- ✅ All accounts present
- ✅ Address balances correct
- ✅ Transaction history restored

---

#### REG-003: Send Transaction (Standard Flow)

**Test Steps:**
1. Navigate to SendScreen
2. Enter recipient address (NOT from contacts)
3. Enter amount
4. Select fee rate
5. Review summary
6. Send transaction

**Expected Results:**
- ✅ Transaction broadcasts successfully
- ✅ Confirmation displayed
- ✅ Balance updates correctly
- ✅ Transaction appears in history

**Privacy Regression Check:**
- ✅ Change address used is unique (not first address)
- ✅ Privacy indicator displayed ("Using unique change address")

---

#### REG-004: Receive Transaction

**Test Steps:**
1. Open ReceiveScreen
2. Copy address
3. (Simulation: Send testnet funds to address from external wallet)
4. Wait for confirmation
5. Verify balance updated

**Expected Results:**
- ✅ Address displayed correctly
- ✅ QR code generated
- ✅ Funds received and confirmed
- ✅ Balance updated
- ✅ Transaction in history

**Privacy Regression Check:**
- ✅ Fresh address auto-generated on mount
- ✅ Privacy banner displayed

---

#### REG-005: Account Management - Create New Account

**Test Steps:**
1. Navigate to Account Management
2. Click "Create Account"
3. Enter account name
4. Create account

**Expected Results:**
- ✅ New account created
- ✅ Account appears in account list
- ✅ New account has fresh addresses (externalIndex = 0, internalIndex = 0)

**Privacy Check:**
- ✅ First change address will be index 0 (correct starting point)

---

#### REG-006: Account Management - Import Account (Private Key)

**Test Steps:**
1. Import account using WIF private key
2. Verify account created
3. Send transaction from imported account

**Expected Results:**
- ✅ Account imported successfully
- ✅ Balance correct
- ✅ Can send transactions

**Privacy Check:**
- ✅ Change addresses still used correctly (even for imported accounts)

---

#### REG-007: Multisig Wallet - Create and Send

**Test Steps:**
1. Create multisig account (2-of-3)
2. Build transaction
3. Sign transaction (2 signatures)
4. Broadcast transaction

**Expected Results:**
- ✅ Multisig account created
- ✅ PSBT generated
- ✅ Transaction signed and broadcast
- ✅ Multisig transaction confirmed

**Privacy Check:**
- ✅ Multisig change addresses unique (use BIP48 internal chain)

---

#### REG-008: Settings - Change Password

**Test Steps:**
1. Navigate to Settings
2. Change password
3. Lock wallet
4. Unlock with new password

**Expected Results:**
- ✅ Password changed successfully
- ✅ Wallet re-encrypted with new password
- ✅ Can unlock with new password

---

#### REG-009: Lock/Unlock Wallet

**Test Steps:**
1. Lock wallet
2. Unlock wallet with password

**Expected Results:**
- ✅ Wallet locks (UI shows unlock screen)
- ✅ Wallet unlocks with correct password
- ✅ State restored (account, balance, addresses)

---

#### REG-010: Transaction History - View Details

**Test Steps:**
1. View transaction history
2. Click on transaction
3. View transaction details

**Expected Results:**
- ✅ Transaction details displayed
- ✅ Inputs, outputs, fees shown
- ✅ Confirmations displayed
- ✅ Blockchain explorer link works

**Privacy Check:**
- ✅ Contact matching works (if transaction was to contact)
- ✅ Privacy badge shown (if contact is xpub)

---

## Performance Benchmarks

### 7.1 Performance Testing Methodology

**Measurement Tools:**
- Chrome DevTools Performance tab
- `performance.now()` for timing measurements
- Network throttling for slow connection testing

**Test Environment:**
- **Hardware:** Standard laptop (8GB RAM, i5 processor)
- **Browser:** Chrome 120+ (latest stable)
- **Network:** Fast WiFi (50+ Mbps) and Throttled 3G

---

### 7.2 Performance Test Cases

#### PERF-001: Change Address Generation Speed

**Measurement:**
- Time from "Send Transaction" click to change address generated
- Expected: <100ms

**Test Steps:**
1. Start timer when "Send Transaction" clicked
2. Stop timer when change address appears in transaction summary
3. Record time
4. Repeat 10 times, calculate average

**Success Criteria:**
- Average: <100ms
- Maximum: <200ms (95th percentile)

**Failure Threshold:**
- Average >200ms: FAIL (performance regression)

---

#### PERF-002: UTXO Randomization Overhead

**Measurement:**
- Time difference between greedy selection vs randomized selection
- Expected: <10ms additional overhead

**Test Steps:**
1. Measure greedy selection time (100 runs)
2. Measure randomized selection time (100 runs)
3. Calculate difference
4. Verify difference <10ms

**Success Criteria:**
- Overhead: <10ms average
- UTXO shuffle time: <5ms for 100 UTXOs

---

#### PERF-003: Receive Address Auto-Generation Speed

**Measurement:**
- Time from ReceiveScreen mount to address displayed
- Expected: <1 second

**Test Steps:**
1. Start timer when ReceiveScreen mounts
2. Stop timer when address and QR code displayed
3. Record time
4. Repeat 10 times

**Success Criteria:**
- Average: <1 second
- Maximum: <2 seconds (slow devices)

---

#### PERF-004: Privacy Banner Auto-Dismiss Timing

**Measurement:**
- Banner displays for exactly 3 seconds
- Expected: 3000ms ±100ms

**Test Steps:**
1. Observe banner display time
2. Measure with stopwatch or setTimeout
3. Verify dismisses at 3 seconds

**Success Criteria:**
- Dismiss time: 2900-3100ms (tolerance ±100ms)

---

#### PERF-005: Contacts Privacy Warning Rendering

**Measurement:**
- Time to render SendScreen with contact privacy warning
- Expected: <50ms additional overhead

**Test Steps:**
1. Measure SendScreen render time without contact selected
2. Measure SendScreen render time with single-address contact selected (warning displays)
3. Calculate difference

**Success Criteria:**
- Overhead: <50ms
- No noticeable delay to user

---

#### PERF-006: Privacy Settings UI Responsiveness

**Measurement:**
- Toggle switch response time
- Expected: <16ms (60 FPS)

**Test Steps:**
1. Click toggle switch
2. Measure time until visual state changes
3. Verify <16ms (one frame at 60 FPS)

**Success Criteria:**
- Toggle response: <16ms (instant to user)
- Animation smooth (no jank)

---

#### PERF-007: API Timing Delays (With Privacy Mode)

**Measurement:**
- Balance refresh time with privacy mode enabled vs disabled
- Expected: 5-20 seconds longer with privacy mode (as designed)

**Test Steps:**
1. Disable API timing delays
2. Refresh balance, measure time
3. Enable API timing delays
4. Refresh balance, measure time
5. Calculate difference

**Expected Results:**
- No delays: 2-5 seconds
- With delays (10 addresses): 12-55 seconds (1-5s per address)
- Difference: ~10-50 seconds

**Success Criteria:**
- Delays are applied (observable slowdown)
- No timeout errors (<60 second cumulative timeout)

---

#### PERF-008: Broadcast Delay Countdown Accuracy

**Measurement:**
- Countdown timer accuracy (should decrement every 1 second)
- Expected: 1000ms ±50ms per decrement

**Test Steps:**
1. Start broadcast delay countdown
2. Measure time between decrements
3. Verify ~1000ms per second

**Success Criteria:**
- Countdown accuracy: 950-1050ms per decrement
- Total delay: within ±1 second of target

---

#### PERF-009: ReceiveScreen with 100 Addresses

**Measurement:**
- Render time for ReceiveScreen with large address list
- Expected: <500ms

**Test Steps:**
1. Generate 100 addresses (expand gap limit for testing)
2. Open ReceiveScreen with "Show All Addresses" expanded
3. Measure render time

**Success Criteria:**
- Render time: <500ms for 100 addresses
- Scrolling smooth (60 FPS)

---

#### PERF-010: Transaction History with Privacy Badges

**Measurement:**
- Render time for transaction history with 50+ transactions (all with contact badges)
- Expected: <300ms

**Test Steps:**
1. Account with 50+ transactions (mix of contact and non-contact)
2. Navigate to Dashboard transaction history
3. Measure render time

**Success Criteria:**
- Render time: <300ms
- Scrolling smooth (no lag)

---

## Accessibility Checklist

### 8.1 Accessibility Testing Tools

**Tools:**
- **axe DevTools** (Chrome extension) - Automated accessibility auditing
- **WAVE** (Web Accessibility Evaluation Tool)
- **Screen Reader:** NVDA (Windows) or VoiceOver (Mac)
- **Keyboard Only:** Disconnect mouse, navigate with Tab/Enter/Space/Arrows

---

### 8.2 Accessibility Test Cases

#### A11Y-001: Keyboard Navigation - Privacy Settings

**Test Steps:**
1. Navigate to Settings > Privacy Mode using only keyboard (Tab key)
2. Expand Privacy Mode section (Enter key)
3. Navigate between toggles (Tab)
4. Toggle switches on/off (Space or Enter)
5. Navigate to "Learn More" link (Tab)
6. Activate link (Enter)

**Expected Results:**
- ✅ All elements focusable in logical order
- ✅ Focus indicators visible (blue ring or equivalent)
- ✅ Space/Enter keys toggle switches
- ✅ No keyboard traps (can exit all elements)

**WCAG Criteria:**
- 2.1.1 Keyboard (Level A): All functionality available via keyboard
- 2.4.7 Focus Visible (Level AA): Focus indicators visible

---

#### A11Y-002: Screen Reader - Privacy Banner

**Test Steps:**
1. Enable screen reader (NVDA or VoiceOver)
2. Open ReceiveScreen (privacy banner displays)
3. Listen to screen reader announcement

**Expected Results:**
- ✅ Screen reader announces: "Alert: New address generated for privacy. Using a fresh address for each transaction protects your financial privacy."
- ✅ Banner has `role="alert"` or `role="status"`
- ✅ Banner text is read in full

**WCAG Criteria:**
- 4.1.3 Status Messages (Level AA): Status messages programmatically determined

---

#### A11Y-003: Screen Reader - Privacy Badges

**Test Steps:**
1. Enable screen reader
2. Navigate to Contacts screen
3. Focus on contact with privacy badge
4. Listen to screen reader

**Expected Results:**
- ✅ Xpub contact: "Alice. Privacy: Address Rotation. This contact uses address rotation for enhanced privacy."
- ✅ Single-address contact: "Bob. Warning: Reuses Address. This contact uses a single address. All payments are publicly linked."
- ✅ Badge has descriptive `aria-label`

**WCAG Criteria:**
- 1.3.1 Info and Relationships (Level A): Information conveyed through presentation is also available in text

---

#### A11Y-004: Color Contrast - Privacy Warnings

**Test Steps:**
1. Use color contrast checker (axe DevTools or manual)
2. Check contrast ratios for:
   - Green success text on green background
   - Amber warning text on amber background
   - Blue info text on blue background

**Expected Results:**
- ✅ Green text (`text-green-300`) on green bg (`bg-green-500/15`): Contrast ratio ≥7.2:1 (WCAG AAA)
- ✅ Amber text (`text-amber-300`) on amber bg (`bg-amber-500/12`): Contrast ratio ≥6.8:1 (WCAG AAA)
- ✅ Blue text (`text-blue-300`) on blue bg (`bg-blue-500/10`): Contrast ratio ≥8.1:1 (WCAG AAA)

**WCAG Criteria:**
- 1.4.3 Contrast (Minimum) (Level AA): 4.5:1 for normal text, 3:1 for large text
- All privacy indicators exceed minimum (AAA level)

---

#### A11Y-005: Keyboard Navigation - Contact Selection

**Test Steps:**
1. Navigate to SendScreen using keyboard
2. Focus on recipient field
3. Open contact dropdown (Enter or Down arrow)
4. Navigate between contacts (Arrow keys)
5. Select contact (Enter)

**Expected Results:**
- ✅ Dropdown opens with Enter or Down arrow
- ✅ Arrow keys navigate options
- ✅ Enter selects contact
- ✅ Escape closes dropdown
- ✅ Focus returns to recipient field after selection

---

#### A11Y-006: Screen Reader - Toggle Switches

**Test Steps:**
1. Enable screen reader
2. Navigate to Privacy Mode toggles
3. Focus on "Randomize Round Amounts" toggle
4. Listen to screen reader

**Expected Results:**
- ✅ Screen reader announces: "Randomize Round Amounts. Switch. Off. Add ±0.1% to round numbers to prevent change detection."
- ✅ Toggle has `role="switch"`
- ✅ Toggle has `aria-checked="false"` (or "true" if on)
- ✅ Description (`aria-describedby`) is read

---

#### A11Y-007: Focus Management - Modals

**Test Steps:**
1. Open ReceiveScreen (focus should be on address field or first focusable element)
2. Navigate with Tab key
3. Close modal (Escape or back button)
4. Verify focus returns to trigger element (e.g., "Receive" button)

**Expected Results:**
- ✅ Focus trapped within modal (Tab wraps within modal)
- ✅ Escape key closes modal
- ✅ Focus returns to trigger after close

**WCAG Criteria:**
- 2.4.3 Focus Order (Level A): Focus order is logical
- Focus management prevents users from getting lost

---

#### A11Y-008: Icon + Text Labels

**Test Steps:**
1. Review all privacy indicators (badges, info boxes, warnings)
2. Verify icons are paired with text labels

**Expected Results:**
- ✅ All icons have accompanying text (e.g., "✓ Privacy: Rotation" not just "✓")
- ✅ Icons have `aria-hidden="true"` (decorative)
- ✅ Meaning conveyed by text, not just icon color/shape

**WCAG Criteria:**
- 1.1.1 Non-text Content (Level A): Icons are decorative, meaning in text

---

#### A11Y-009: Reduced Motion Support

**Test Steps:**
1. Enable "Reduce Motion" in OS settings
2. Open ReceiveScreen (privacy banner animation)
3. Verify animations disabled or minimized

**Expected Results:**
- ✅ Privacy banner slide-in animation disabled (instant display)
- ✅ Toggle switch transitions instant or very short (<0.01s)
- ✅ All animations respect `prefers-reduced-motion: reduce` media query

**WCAG Criteria:**
- 2.3.3 Animation from Interactions (Level AAA): Motion can be disabled

---

#### A11Y-010: Tooltips - Keyboard Access

**Test Steps:**
1. Navigate to element with tooltip (e.g., privacy badge)
2. Focus element with keyboard (Tab)
3. Verify tooltip appears on focus

**Expected Results:**
- ✅ Tooltip appears on keyboard focus (not just mouse hover)
- ✅ Tooltip has `role="tooltip"`
- ✅ Element has `aria-describedby` pointing to tooltip
- ✅ Escape key dismisses tooltip

---

#### A11Y-011: Error Messages - Screen Reader

**Test Steps:**
1. Trigger gap limit error (generate 21st address)
2. Enable screen reader
3. Listen to error announcement

**Expected Results:**
- ✅ Screen reader announces: "Error: Gap limit reached. Cannot generate more addresses until existing addresses are used."
- ✅ Error has `role="alert"` or `aria-live="assertive"`
- ✅ Error is read immediately when displayed

---

#### A11Y-012: Form Labels - SendScreen

**Test Steps:**
1. Navigate to SendScreen
2. Verify all form fields have labels

**Expected Results:**
- ✅ Recipient field has label: "Recipient"
- ✅ Amount field has label: "Amount (BTC)"
- ✅ Labels are properly associated with inputs (`for` attribute or wrapped)
- ✅ Screen reader reads label when field focused

---

#### A11Y-013: Heading Structure

**Test Steps:**
1. Use axe DevTools or headingsMap extension
2. Check heading hierarchy across all privacy screens

**Expected Results:**
- ✅ Headings follow logical hierarchy (H1 → H2 → H3, no skipped levels)
- ✅ Each screen has H1 (e.g., "Settings")
- ✅ Sections use H2 (e.g., "Privacy Mode")

**WCAG Criteria:**
- 1.3.1 Info and Relationships (Level A): Headings programmatically determined
- 2.4.6 Headings and Labels (Level AA): Headings are descriptive

---

#### A11Y-014: Touch Targets (Mobile)

**Test Steps:**
1. View wallet in mobile viewport (or responsive mode)
2. Check touch target sizes for:
   - Toggle switches
   - Privacy badges
   - Buttons ("Broadcast Now", "Cancel")

**Expected Results:**
- ✅ Toggle switches: 48×48px minimum (within padding area)
- ✅ Buttons: 48×48px minimum
- ✅ Interactive badges: 48×48px minimum (if clickable)

**WCAG Criteria:**
- 2.5.5 Target Size (Level AAA): 44×44px minimum (we target 48×48px)

---

#### A11Y-015: Axe DevTools Automated Scan

**Test Steps:**
1. Install axe DevTools Chrome extension
2. Navigate to each screen:
   - ReceiveScreen
   - SendScreen
   - SettingsScreen (Privacy Mode expanded)
   - Contacts screen
3. Run axe scan on each screen
4. Review violations

**Expected Results:**
- ✅ 0 Critical violations
- ✅ 0 Serious violations
- ✅ <3 Moderate violations (with documented exceptions)
- ✅ Minor violations acceptable (non-blocking)

**Success Criteria:**
- WCAG AA compliance (no critical/serious violations)

---

## Release Readiness Checklist

### 9.1 Pre-Release Verification

**Complete Before Release:**

#### Privacy Features Implementation

- [ ] **Change Address Generation (P0)**
  - [ ] All automated tests passing (7 tests)
  - [ ] TC-TESTNET-001 passing (single transaction)
  - [ ] TC-TESTNET-002 passing (10 transactions, 0% reuse)
  - [ ] TC-TESTNET-003 passing (multisig change addresses)
  - [ ] Change address reuse rate: **0%** (verified on testnet)
  - [ ] Blockchain Expert code review approved
  - [ ] Security Expert code review approved

- [ ] **UTXO Randomization (P0)**
  - [ ] All automated tests passing (9 tests)
  - [ ] TC-TESTNET-005 passing (selection variation)
  - [ ] TC-TESTNET-006 passing (entropy observation)
  - [ ] UTXO selection entropy: **>50%** (verified)
  - [ ] Blockchain Expert code review approved

- [ ] **Receive Address Auto-Generation (P1)**
  - [ ] All automated tests passing (7 tests)
  - [ ] TC-TESTNET-007 passing (auto-generation)
  - [ ] TC-TESTNET-008 passing (10 fresh addresses)
  - [ ] Gap limit enforcement tests passing
  - [ ] TC-TESTNET-009 passing (gap limit warning)
  - [ ] TC-TESTNET-010 passing (gap limit enforcement)
  - [ ] Receive address reuse rate: **<10%** (estimated)

- [ ] **Contacts Privacy (P0/P1)**
  - [ ] All automated tests passing (8 tests)
  - [ ] TC-TESTNET-011 passing (xpub rotation)
  - [ ] TC-TESTNET-012 passing (contact matching)
  - [ ] TC-TESTNET-013 passing (reusage warnings)
  - [ ] Contacts privacy warning display: **100%** coverage
  - [ ] Frontend Developer code review approved

- [ ] **Optional Privacy Mode (P2)**
  - [ ] All automated tests passing (12 tests)
  - [ ] TC-TESTNET-014 passing (round number randomization)
  - [ ] TC-TESTNET-015 passing (API timing delays)
  - [ ] TC-TESTNET-016 passing (broadcast delays)
  - [ ] Settings UI implemented and tested
  - [ ] Security conditions met (see section 9.5)

#### Testing Completion

- [ ] **Automated Testing**
  - [ ] All 124 automated tests passing (100%)
  - [ ] Coverage thresholds met:
    - [ ] Overall: ≥80%
    - [ ] P0 features: 100%
    - [ ] P1 features: ≥95%
    - [ ] P2 features: ≥90%
  - [ ] All 26 security tests passing
  - [ ] All 5 privacy metrics tests passing
  - [ ] CI/CD pipeline passing (no failures)

- [ ] **Manual Testing**
  - [ ] Testnet validation complete (35 test cases, all passing)
  - [ ] 10+ real testnet transactions sent
  - [ ] 0% change address reuse verified on blockchain
  - [ ] UTXO randomization observed across transactions
  - [ ] Gap limit enforcement verified (20 address limit)
  - [ ] Contacts xpub rotation verified (5+ sends)

- [ ] **User Acceptance Testing**
  - [ ] UAT completed with 5+ users
  - [ ] User comprehension: **≥80%** (survey results)
  - [ ] Usability rating: **≥4.0/5.0** (average)
  - [ ] Privacy warnings helpful: **≥70%** (positive responses)
  - [ ] Recommendation rate: **≥80%** (would recommend)

- [ ] **Exploratory Testing**
  - [ ] All 25 edge cases tested
  - [ ] No critical bugs found
  - [ ] All edge case bugs triaged and resolved/deferred

- [ ] **Regression Testing**
  - [ ] All 20 regression tests passing
  - [ ] Core wallet functions unchanged
  - [ ] No performance regressions detected
  - [ ] Existing features work correctly

- [ ] **Performance Testing**
  - [ ] All 10 performance benchmarks passing
  - [ ] Change address generation: <100ms
  - [ ] UTXO randomization overhead: <10ms
  - [ ] Receive address generation: <1 second
  - [ ] No user-observable performance degradation

- [ ] **Accessibility Testing**
  - [ ] All 15 accessibility checks passing
  - [ ] WCAG AA compliance verified (axe DevTools: 0 critical/serious violations)
  - [ ] Keyboard navigation functional
  - [ ] Screen reader compatible
  - [ ] Color contrast meets standards (≥4.5:1)

#### Documentation

- [ ] **User Documentation**
  - [ ] PRIVACY_GUIDE.md created (2000-3000 words)
  - [ ] In-app privacy tips implemented (all screens)
  - [ ] Settings privacy tips complete (Privacy Mode section)
  - [ ] Tooltips implemented and tested
  - [ ] "Learn More" links functional

- [ ] **Developer Documentation**
  - [ ] ARCHITECTURE.md updated (Privacy Architecture section)
  - [ ] CLAUDE.md updated (privacy references)
  - [ ] README.md updated (Privacy section added)
  - [ ] CHANGELOG.md updated (v0.11.0 entry)
  - [ ] All implementation plans archived

- [ ] **Expert Notes Updated**
  - [ ] blockchain-expert-notes.md (change addresses, UTXO randomization)
  - [ ] security-expert-notes.md (security review findings)
  - [ ] frontend-developer-notes.md (privacy UI components)
  - [ ] backend-developer-notes.md (privacy message handlers)
  - [ ] ui-ux-designer-notes.md (privacy design system)
  - [ ] product-manager-notes.md (privacy requirements)
  - [ ] qa-engineer-notes.md (this document)
  - [ ] testing-expert-notes.md (automated testing)

#### Code Quality

- [ ] **Code Reviews**
  - [ ] Blockchain Expert review completed and approved
  - [ ] Security Expert review completed and approved
  - [ ] Frontend Developer review completed (UI components)
  - [ ] Backend Developer review completed (message handlers)
  - [ ] All review comments addressed
  - [ ] No open review blockers

- [ ] **Security Conditions Met**
  - [ ] Gap limit enforcement implemented (TC-TESTNET-010 passing)
  - [ ] Precision validation implemented (integer math, max variance 0.001)
  - [ ] Timeout protection implemented (60s cumulative timeout)
  - [ ] Service worker survival implemented (chrome.alarms for delays)
  - [ ] Error handling implemented (change address never falls back to reuse)

- [ ] **Bug Triage**
  - [ ] No open CRITICAL bugs
  - [ ] No open HIGH bugs (blocking release)
  - [ ] All MEDIUM bugs documented and triaged (fix or defer)
  - [ ] LOW bugs acceptable for release (tracked for future)

---

### 9.2 Go/No-Go Criteria

**RELEASE APPROVED IF:**
- ✅ All P0 tests passing (change addresses, UTXO randomization, gap limit, contacts)
- ✅ Privacy metrics validated (0% change reuse, >50% entropy)
- ✅ User comprehension ≥80%
- ✅ No open CRITICAL or HIGH severity bugs
- ✅ Documentation complete
- ✅ Code reviews approved
- ✅ Security conditions met (all 5)

**RELEASE BLOCKED IF:**
- ❌ Any P0 test failing
- ❌ Change address reuse detected (>0%)
- ❌ UTXO entropy <50%
- ❌ Gap limit not enforced
- ❌ Open CRITICAL or HIGH bugs
- ❌ Security conditions not met
- ❌ User comprehension <70%

**RELEASE DEFERRED (Fix Required):**
- ⚠️ User comprehension 70-79% (improve documentation, retry UAT)
- ⚠️ >5 MEDIUM severity bugs (triage, fix critical subset)
- ⚠️ Performance regressions detected (optimize before release)

---

### 9.3 Rollback Procedure

**If Critical Issue Discovered Post-Release:**

**Trigger Conditions:**
- Change address reuse detected in production (>0%)
- Gap limit not enforced (wallet recovery risk)
- Security vulnerability discovered (CVE-level severity)
- Critical bugs affecting >10% of users

**Rollback Steps:**
1. **Immediate Action (Within 1 Hour):**
   - [ ] Pull release from Chrome Web Store (if published)
   - [ ] Post notice on GitHub: "Known Issue - Privacy Feature Disabled"
   - [ ] Update README.md with warning

2. **Investigation (Within 4 Hours):**
   - [ ] Identify root cause
   - [ ] Assess impact (how many users affected?)
   - [ ] Determine if hotfix possible or full rollback needed

3. **Hotfix Path (If Possible):**
   - [ ] Fix critical bug
   - [ ] Run all P0 tests
   - [ ] Deploy hotfix as v0.11.1
   - [ ] Monitor for 24 hours

4. **Full Rollback Path (If Necessary):**
   - [ ] Revert to v0.10.0 (last stable version)
   - [ ] Disable privacy features in v0.11.x
   - [ ] Re-test all features
   - [ ] Schedule v0.11.1 with fixes

5. **Communication:**
   - [ ] Notify users via extension update notes
   - [ ] Post GitHub issue explaining rollback
   - [ ] Update CHANGELOG.md with rollback note

---

### 9.4 Post-Release Monitoring

**Monitor for 2 Weeks After Release:**

**Privacy Metrics:**
- [ ] Change address reuse rate (target: 0%)
  - Measurement: Blockchain analysis of user transactions (anonymized)
  - Alerting: Any reuse detected → CRITICAL ALERT

- [ ] UTXO selection entropy (target: >50%)
  - Measurement: Analyze transaction input patterns (automated script)
  - Alerting: Entropy <40% → WARNING

- [ ] Receive address reuse rate (target: <10%)
  - Measurement: externalIndex growth vs transaction count
  - Alerting: Reuse >15% → INVESTIGATE

- [ ] Gap limit violations (target: 0)
  - Measurement: Monitor error logs for gap limit errors
  - Alerting: Any violation → WARNING (potential recovery issue)

**User Behavior:**
- [ ] Privacy Mode adoption rate
  - Measurement: % users with any privacy setting enabled
  - Target: >5% (realistic for optional features)

- [ ] Contacts xpub usage
  - Measurement: xpub contacts / total contacts ratio
  - Target: >20% (gradual adoption expected)

- [ ] Privacy guide views
  - Measurement: "Learn More" link clicks
  - Target: >10% of users view documentation

**Quality Metrics:**
- [ ] Privacy-related bug reports
  - Target: <5 reports in first 2 weeks
  - Severity: No CRITICAL bugs reported

- [ ] User feedback sentiment
  - Target: >80% positive or neutral
  - Measurement: Support tickets, GitHub issues, reviews

- [ ] Performance complaints
  - Target: <1% of users report slowness
  - Measurement: Support tickets, feedback

**Alerting Thresholds:**
- **CRITICAL:** Change address reuse >0%, gap limit violations, security vulnerability
  - Action: Immediate investigation, potential hotfix or rollback

- **WARNING:** UTXO entropy <40%, receive reuse >15%, >5 MEDIUM bugs
  - Action: Investigate within 24 hours, plan fix for v0.11.1

- **INFO:** Privacy mode adoption <5%, xpub usage <20%
  - Action: Consider improving documentation or UX in v0.12.0

---

### 9.5 Security Expert Final Approval

**Required Before Release:**

From Security Review (PRIVACY_SECURITY_REVIEW.md), all 5 blocking conditions must be met:

**Condition 1: Gap Limit Enforcement (Auto-Generated Receive Addresses)**
- [ ] Status: ✅ IMPLEMENTED
- [ ] Test: TC-TESTNET-010 passing
- [ ] Verification: Cannot generate 21st unused address
- [ ] Code review: Security Expert approved

**Condition 2: Precision Validation (Round Number Randomization)**
- [ ] Status: ✅ IMPLEMENTED
- [ ] Test: Integer math used (no float arithmetic on satoshis)
- [ ] Test: MAX_VARIANCE_PERCENT = 0.001 (hardcoded constant)
- [ ] Test: Precision safety test passing
- [ ] Code review: Blockchain Expert approved variance value

**Condition 3: Timeout Protection (API Timing Delays)**
- [ ] Status: ✅ IMPLEMENTED
- [ ] Test: 60-second cumulative timeout enforced
- [ ] Test: AbortController support implemented
- [ ] Test: Debounce test passing
- [ ] Code review: Backend Developer approved

**Condition 4: Service Worker Survival (Broadcast Delays)**
- [ ] Status: ✅ IMPLEMENTED
- [ ] Test: chrome.alarms API used (not setTimeout)
- [ ] Test: Pending transaction tracking implemented
- [ ] Test: Service worker survival test passing
- [ ] Code review: Backend Developer approved

**Condition 5: Error Handling (Change Address Generation)**
- [ ] Status: ✅ IMPLEMENTED
- [ ] Test: Error thrown on failure (no fallback to reused address)
- [ ] Test: Code comment: "NEVER fall back to account.addresses[0].address"
- [ ] Test: Error handling test passing
- [ ] Code review: Blockchain Expert approved

**Final Security Sign-Off:**
- [ ] Security Expert reviewed final implementation
- [ ] All 5 conditions verified in production build
- [ ] Security Expert approval documented (date + signature)

**Security Expert Sign-Off:**
```
Reviewed By: ______________________ (Security Expert)
Date: ____________
Status: ☐ APPROVED  ☐ CONDITIONAL  ☐ REJECTED
Notes: _________________________________
```

---

## Bug Severity Classification

### 10.1 Severity Definitions

**CRITICAL (Blocks Release)**
- **Definition:** Privacy feature completely broken or security vulnerability
- **Examples:**
  - Change addresses reused (>0%)
  - Gap limit not enforced (wallet recovery risk)
  - Private keys exposed in logs
  - Extension crashes on startup
- **SLA:** Fix immediately, block release until resolved
- **Priority:** P0

**HIGH (Must Fix Before Release)**
- **Definition:** Core privacy feature not working as designed, no workaround
- **Examples:**
  - UTXO randomization not working (still greedy selection)
  - Auto-generation not creating fresh addresses
  - Xpub rotation not incrementing index
  - Contacts privacy warnings not displaying
- **SLA:** Fix within 24 hours, block release
- **Priority:** P0 or P1

**MEDIUM (Should Fix, Can Defer)**
- **Definition:** Privacy feature works but UX is poor, or non-critical bug
- **Examples:**
  - Privacy badge styling incorrect
  - Tooltip doesn't display on mobile
  - Gap limit warning text unclear
  - Performance slower than expected (but acceptable)
- **SLA:** Fix for v0.11.0 if time permits, can defer to v0.11.1
- **Priority:** P1 or P2

**LOW (Nice to Have)**
- **Definition:** Minor visual issues, edge cases, cosmetic bugs
- **Examples:**
  - Privacy banner animation stutter
  - Icon alignment off by 2px
  - Tooltip position slightly wrong on ultra-wide screen
- **SLA:** Track for future release (v0.12.0 or later)
- **Priority:** P2 or P3

---

### 10.2 Bug Reporting Template

**Title:** [Component] Brief description of issue

**Severity:** CRITICAL / HIGH / MEDIUM / LOW

**Environment:**
- Browser: Chrome 120.0.6099.109
- OS: Windows 11 / macOS 14 / Ubuntu 22.04
- Extension Version: v0.11.0-beta
- Network: Bitcoin Testnet

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
- What should happen

**Actual Result:**
- What actually happened

**Screenshots/Evidence:**
- Attach screenshots
- For testnet issues: Include transaction ID and blockchain explorer link

**Console Errors:**
```
Paste any console errors here
```

**Impact:**
- How many users affected?
- Does this break privacy features?
- Workaround available?

**Suggested Fix (Optional):**
- If you have ideas for fixing the bug

---

### 10.3 Bug Triage Process

**Daily Bug Triage (During Testing Phase):**

1. **Review New Bugs:**
   - All bugs reported in last 24 hours
   - Assign severity (CRITICAL/HIGH/MEDIUM/LOW)
   - Assign owner (developer responsible for fix)

2. **Prioritize:**
   - CRITICAL: Fix immediately
   - HIGH: Fix within 24 hours
   - MEDIUM: Fix for v0.11.0 or defer to v0.11.1
   - LOW: Defer to v0.12.0 or later

3. **Track Resolution:**
   - CRITICAL: 100% resolved before release
   - HIGH: 100% resolved before release
   - MEDIUM: 70%+ resolved (remaining deferred with approval)
   - LOW: Track for future, doesn't block release

4. **Update Release Checklist:**
   - Mark bugs as resolved
   - Verify fixes with regression testing
   - Update bug count in go/no-go criteria

---

## Testnet Resources & Setup

### 11.1 Testnet Faucets

**Get Free Testnet Bitcoin:**

1. **Mempool Testnet Faucet** (Recommended)
   - URL: https://testnet-faucet.mempool.co/
   - Amount: ~0.01 tBTC per request
   - Frequency: Once per day per IP

2. **Coinfaucet.eu Testnet**
   - URL: https://coinfaucet.eu/en/btc-testnet/
   - Amount: Variable (0.001-0.01 tBTC)
   - Frequency: Multiple requests allowed

3. **Testnet Bitcoin Faucet (Bitcoin.com)**
   - URL: https://tbco.in/faucet
   - Amount: 0.01 tBTC
   - Frequency: Once per address

**Pro Tip:** Create 3-5 addresses in your wallet and request from faucets to different addresses to accumulate multiple UTXOs quickly.

---

### 11.2 Testnet Block Explorers

**Blockstream Testnet Explorer** (Primary)
- URL: https://blockstream.info/testnet/
- Features:
  - View transaction details
  - See inputs/outputs clearly
  - Verify change address (not in receive list)
  - Check confirmations
  - View address history

**Usage:**
- Transaction lookup: `https://blockstream.info/testnet/tx/{txid}`
- Address lookup: `https://blockstream.info/testnet/address/{address}`

**Mempool.space Testnet**
- URL: https://mempool.space/testnet
- Features: Advanced transaction visualization, fee estimation

---

### 11.3 Testnet Wallet Setup

**Wallet Configuration:**

1. **Create Testnet Wallet:**
   - Ensure extension is in testnet mode
   - Create new wallet or import testnet seed
   - Generate 5-10 receive addresses

2. **Fund Wallet:**
   - Request 0.01 tBTC from 3-5 faucets
   - Wait for confirmations (~10-30 minutes)
   - Verify balance shows ~0.05 tBTC

3. **Create Test Accounts:**
   - Account 1: "Testing Account" (10+ UTXOs)
   - Account 2: "Regression Testing" (5+ UTXOs)
   - Multisig Account: 2-of-3 setup

4. **Create Test Contacts:**
   - Single-address contact "Alice": Use faucet return address
   - Xpub contact "Bob": Export xpub from separate wallet or account
   - Single-address contact "Charlie": Another faucet address

5. **Prepare UTXO Mix:**
   - Send 0.001 tBTC to self (create small UTXO)
   - Send 0.01 tBTC to self (create medium UTXO)
   - Send 0.05 tBTC to self (create large UTXO)
   - Result: Mix of UTXO sizes for randomization testing

---

### 11.4 Testing Utilities

**Transaction Builder Tool:**
- Use SendScreen to build test transactions
- Vary amounts to create different UTXO scenarios
- Use different fee rates to test fee estimation

**Address Tracker Spreadsheet:**
- Track all generated addresses
- Mark which are used vs unused
- Calculate gap limit manually
- Verify wallet state matches expectations

**Blockchain Verification Checklist:**
```
For each transaction:
☐ Copy txid
☐ Open in Blockstream Explorer
☐ Identify change output (output to own address)
☐ Copy change address
☐ Verify NOT in receive address list
☐ Verify unique (not used before)
☐ Record in spreadsheet
```

---

## Testing Timeline & Execution Plan

### 12.1 5-Day Testing Schedule

**Day 1: Critical Path Testing (8 hours)**
- **Morning (4 hours):**
  - TC-TESTNET-001: Single transaction change address (30 min)
  - TC-TESTNET-002: 10 transactions change address uniqueness (1 hour)
  - TC-TESTNET-003: Multisig change addresses (30 min)
  - TC-TESTNET-004: Change address not in receive list (30 min)
  - TC-TESTNET-005: UTXO selection variation (1 hour)
  - TC-TESTNET-006: UTXO entropy observation (30 min)

- **Afternoon (4 hours):**
  - TC-TESTNET-009: Gap limit warning (30 min)
  - TC-TESTNET-010: Gap limit enforcement (30 min)
  - TC-TESTNET-011: Xpub rotation 5 sends (1 hour)
  - TC-TESTNET-013: Single-address warnings (1 hour)
  - Document results and blockchain verification (1 hour)

**End of Day 1:**
- ✅ All P0 critical path tests executed
- ✅ Privacy metrics validated (0% change reuse, >50% entropy)
- ✅ Gap limit enforcement verified

---

**Day 2: High Priority & Regression Testing (8 hours)**
- **Morning (4 hours):**
  - TC-TESTNET-007: Receive auto-generation (30 min)
  - TC-TESTNET-008: 10 fresh addresses (30 min)
  - TC-TESTNET-012: Contact matching (30 min)
  - REG-001 to REG-010: Core wallet regression suite (2.5 hours)

- **Afternoon (4 hours):**
  - TC-TESTNET-014: Round number randomization (30 min)
  - TC-TESTNET-015: API timing delays (30 min)
  - TC-TESTNET-016: Broadcast delays (30 min)
  - Edge cases EC-001 to EC-010 (2 hours)
  - Document results (30 min)

**End of Day 2:**
- ✅ All P1 features tested
- ✅ Regression suite passing (no broken features)
- ✅ Optional privacy mode features validated

---

**Day 3: Exploratory & Edge Case Testing (8 hours)**
- **All Day:**
  - Edge cases EC-011 to EC-025 (6 hours)
  - Creative exploratory testing (1 hour)
  - Bug triage and reporting (1 hour)

**End of Day 3:**
- ✅ All 25 edge cases tested
- ✅ Bugs triaged and assigned severity
- ✅ Critical/High bugs escalated

---

**Day 4: UAT, Performance, Accessibility (8 hours)**
- **Morning (4 hours):**
  - UAT Scenario 1: First-time user (1 hour, 2 users)
  - UAT Scenario 2: Contacts user (1 hour, 2 users)
  - UAT Scenario 3: Privacy-conscious user (1 hour, 2 users)
  - Comprehension survey administration and analysis (1 hour)

- **Afternoon (4 hours):**
  - Performance benchmarks PERF-001 to PERF-010 (2 hours)
  - Accessibility tests A11Y-001 to A11Y-015 (2 hours)

**End of Day 4:**
- ✅ UAT completed (≥80% comprehension target)
- ✅ Performance benchmarks passing
- ✅ WCAG AA compliance verified

---

**Day 5: Final Validation & Sign-Off (8 hours)**
- **Morning (4 hours):**
  - Re-run all failed tests (if any)
  - Verify bug fixes
  - Final privacy metrics validation
  - Documentation review

- **Afternoon (4 hours):**
  - Complete release readiness checklist (section 9.1)
  - Security Expert final approval (section 9.5)
  - Go/No-Go decision (section 9.2)
  - Prepare release notes and changelog

**End of Day 5:**
- ✅ All release criteria met
- ✅ Go/No-Go decision made
- ✅ If GO: Release approved, ready for deployment
- ✅ If NO-GO: Critical issues documented, fix timeline established

---

### 12.2 Testing Resources Required

**Personnel:**
- **QA Engineer** (Full-time, 5 days): Test execution, documentation
- **UAT Participants** (5-10 users, 2 hours each): User acceptance testing
- **Blockchain Expert** (On-call): Code review, technical questions
- **Security Expert** (On-call): Final approval, security review
- **Developers** (On-call): Bug fixes during testing

**Equipment:**
- Chrome browser (latest stable)
- Fast internet connection (50+ Mbps)
- Access to Bitcoin testnet
- Screen reader software (NVDA or VoiceOver)
- Mobile device (for touch target testing)

**Testnet Resources:**
- 0.5+ tBTC in test wallet
- 5-10 testnet addresses
- 3-5 test contacts (mix of single-address and xpub)
- Multisig wallet setup

---

## Conclusion

### Testing Summary

This manual testing plan provides **comprehensive coverage** of all Privacy Enhancement features:

✅ **35 testnet validation test cases** - Real Bitcoin transactions verifying privacy on-chain
✅ **15 UAT scenarios** - User comprehension and usability validation (80% target)
✅ **25 exploratory edge cases** - Creative testing and unexpected behaviors
✅ **20 regression tests** - Ensure existing features still work
✅ **10 performance benchmarks** - No user-observable degradation
✅ **15 accessibility checks** - WCAG AA compliance

**Total: 120 manual test cases** executed over **5 days** (40 hours)

### Success Criteria

**Release is APPROVED when:**
1. ✅ All P0 testnet tests passing (0% change reuse, >50% entropy)
2. ✅ Gap limit enforced (20 address limit)
3. ✅ User comprehension ≥80% (UAT survey)
4. ✅ No open CRITICAL or HIGH bugs
5. ✅ Documentation complete
6. ✅ Security Expert approval
7. ✅ WCAG AA compliance

### Privacy Metrics Targets

From PRD page 8, all targets must be met:

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| **Change Address Reuse Rate** | 100% | **0%** | Blockchain analysis (TC-TESTNET-002) |
| **UTXO Selection Entropy** | 0% | **>50%** | Shannon entropy calculation (TC-TESTNET-006) |
| **Receive Address Reuse** | ~80% | **<10%** | User behavior (UAT observation) |
| **Privacy Warning Display** | 0% | **100%** | Contact warning coverage (TC-TESTNET-013) |

### Next Steps

1. **Begin Testing:** Start Day 1 critical path testing
2. **Track Progress:** Update checklist daily, report blockers
3. **Triage Bugs:** Daily bug review, assign severity and owners
4. **Final Review:** Day 5 go/no-go decision
5. **Sign-Off:** Security Expert and Blockchain Expert approval
6. **Release:** Deploy v0.11.0 if all criteria met

---

**QA Engineer Sign-Off:**

**Prepared By:** QA Engineer
**Date:** October 22, 2025
**Status:** ✅ Implementation-Ready
**Estimated Effort:** 5 days (40 hours) of manual testing + 2 days UAT coordination

**Testing is ready to begin.** 🚀

---

**Document Version:** 1.0
**Last Updated:** October 22, 2025
**Status:** COMPLETE
