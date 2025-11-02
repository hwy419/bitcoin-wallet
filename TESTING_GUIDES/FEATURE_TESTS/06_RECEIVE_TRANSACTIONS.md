# Feature Test Guide: Receive Transactions

**Feature Area:** Receive Bitcoin & Address Management
**Test Cases:** 15 tests (11 core + 4 edge cases)
**Time to Execute:** 1.5 hours
**Priority:** P0 (Critical - Receiving Funds)

---

## Overview

This feature validates receiving Bitcoin, address generation, QR code display, address copying, and balance updates. Receiving is a core wallet function that must work reliably.

**Why this matters:** Users must be able to receive Bitcoin easily and reliably. Address generation must be correct to avoid fund loss.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Testnet faucet access: https://testnet-faucet.mempool.co/
- [ ] Block explorer: https://blockstream.info/testnet/
- [ ] QR code scanner app (optional, for QR testing)

---

## Test Cases

### RECV-001: Receive Screen - UI Validation

**Priority:** P0
**Time:** 3 minutes

**Purpose:** Verify receive screen displays correctly

**Steps:**
1. Unlock wallet
2. Navigate to Receive screen (from dashboard or sidebar)
3. Observe all UI elements

**Expected Results:**
- ✅ Receive screen title: "Receive Bitcoin"
- ✅ Current receiving address displayed prominently
- ✅ Address format correct for account type:
  - Native SegWit: starts with "tb1"
  - SegWit: starts with "2"
  - Legacy: starts with "m" or "n"
- ✅ QR code displayed (scannable)
- ✅ "Copy Address" button visible
- ✅ "Generate New Address" button (for HD accounts)
- ✅ Address derivation path shown (optional)
- ✅ Warning: "Only send Bitcoin to this address"
- ✅ Dark theme consistent

**Visual Layout:**
```
Receive Bitcoin
┌─────────────────────────────────┐
│       [QR CODE IMAGE]           │
│                                 │
│ Your Bitcoin Address:           │
│ tb1qrp33g0q5c5txsp9arysrx...   │
│                                 │
│      [Copy Address] [📋]        │
│                                 │
│   [Generate New Address]        │
│                                 │
│ ⚠️ Only send Bitcoin (BTC) to   │
│    this address. Do not send    │
│    other cryptocurrencies.      │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-002: Copy Address to Clipboard

**Priority:** P0
**Time:** 2 minutes

**Purpose:** Verify address can be copied easily

**Steps:**
1. Navigate to Receive screen
2. Note displayed address: ___________________________
3. Click "Copy Address" button
4. Observe visual feedback
5. Paste into text editor (Ctrl+V)
6. Compare pasted address with displayed address

**Expected Results:**
- ✅ "Copy Address" button functional
- ✅ Visual feedback on click (button changes color, shows "Copied!")
- ✅ Address copied to clipboard exactly
- ✅ No extra characters, spaces, or line breaks
- ✅ Address matches display character-for-character
- ✅ Can paste into any application

**Visual Feedback:**
```
Before click: [Copy Address] 📋
After click:  [Copied! ✅] (green, 2 seconds)
Then revert:  [Copy Address] 📋
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-003: QR Code Display and Scanning

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify QR code is correct and scannable

**Steps:**
1. Navigate to Receive screen
2. Observe QR code
3. Use phone camera or QR scanner app to scan
4. Verify scanned data matches displayed address

**Expected Results:**
- ✅ QR code displayed (clear, not pixelated)
- ✅ QR code large enough to scan (at least 200x200px)
- ✅ QR code contains ONLY the address (no extra data)
- ✅ Scannable by standard QR readers
- ✅ Scanned address matches displayed address exactly
- ✅ QR code updates when new address generated

**QR Code Format:**
- Content: bitcoin:tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7
- OR simple: tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7

**Testing Without Phone:**
- Right-click QR code → "Open image in new tab"
- Use online QR decoder: https://zxing.org/w/decode.html
- Upload/paste QR image
- Verify decoded address

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-004: Receive Bitcoin - Balance Update

**Priority:** P0
**Time:** 15-30 minutes (including faucet and confirmation)

**Purpose:** Verify receiving Bitcoin updates balance correctly

**Steps:**
1. Navigate to Receive screen
2. Copy receiving address
3. Open testnet faucet: https://testnet-faucet.mempool.co/
4. Paste address into faucet
5. Request testnet Bitcoin (typically 0.001 BTC)
6. Complete CAPTCHA
7. Wait for faucet to send
8. Observe wallet for transaction notification
9. Check balance update
10. Wait for confirmations

**Expected Results:**
- ✅ Transaction appears in wallet within 10-30 seconds
- ✅ Balance updates immediately (0 confirmations)
- ✅ Balance shows as "Pending" or "Unconfirmed"
- ✅ Transaction details accessible
- ✅ Confirmation count updates: 0 → 1 → 2 → ... → 6
- ✅ Balance becomes "Confirmed" after 1-6 confirmations
- ✅ Balance amount matches faucet amount (minus any network fees)

**Timing Log:**
```
Address:         tb1q___________________________
Faucet Request:  [Time] _____:_____
First Seen:      [Time] _____:_____ (0 conf)
First Confirm:   [Time] _____:_____ (1 conf)
Fully Confirmed: [Time] _____:_____ (6 conf)
Amount:          0.001 BTC
```

**Block Explorer Verification:**
1. Copy transaction ID from wallet
2. Search on https://blockstream.info/testnet/
3. Verify:
   - Transaction found
   - Outputs to your address
   - Amount correct
   - Confirmations updating

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-005: Generate New Address (HD Accounts)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify new addresses can be generated for privacy

**Steps:**
1. Navigate to Receive screen
2. Note current address: _____________________________
3. Click "Generate New Address"
4. Observe new address displayed
5. Verify old address still valid
6. Generate another new address

**Expected Results:**
- ✅ "Generate New Address" button functional
- ✅ New address generated and displayed
- ✅ New address different from previous
- ✅ QR code updates to new address
- ✅ Derivation path index increments:
  - Address 0: m/84'/1'/0'/0/0
  - Address 1: m/84'/1'/0'/0/1
  - Address 2: m/84'/1'/0'/0/2
- ✅ Old addresses still work (can receive to previous addresses)
- ✅ Gap limit enforced (typically 20 unused addresses max)

**Privacy Note:**
Address reuse is bad for privacy. Generating new addresses for each transaction is best practice.

**Testing Old Address Still Works:**
1. Generate new address (Address 1)
2. Send small amount to OLD address (Address 0)
3. Verify wallet still receives to old address
4. Both addresses tracked

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-006: Imported Account - Single Address Only

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** Have an imported private key account

**Purpose:** Verify imported accounts cannot generate new addresses

**Steps:**
1. Switch to imported private key account
2. Navigate to Receive screen
3. Observe UI

**Expected Results:**
- ✅ Receiving address displayed (the imported key's address)
- ✅ QR code displayed
- ✅ "Copy Address" button functional
- ✅ "Generate New Address" button DISABLED or HIDDEN
- ✅ Explanation: "Imported accounts have a single address"
- ✅ OR: "Cannot generate new addresses for imported keys"
- ✅ Can still receive to this address multiple times

**Visual Example:**
```
Receive Bitcoin
┌─────────────────────────────────┐
│       [QR CODE]                 │
│                                 │
│ tb1qfuv9a3p7kk8r7zqxzz2ykz...  │
│                                 │
│      [Copy Address] [📋]        │
│                                 │
│ ⓘ Imported accounts have a      │
│   single address. New address   │
│   generation is not available.  │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-007: Multiple Receives to Same Address

**Priority:** P1
**Time:** 20-40 minutes (including confirmations)

**Purpose:** Verify multiple receives to same address work correctly

**Steps:**
1. Get receiving address
2. Request testnet Bitcoin from faucet (0.001 BTC)
3. Wait for confirmation
4. Use SAME address, request from faucet again (0.001 BTC)
5. Wait for confirmation
6. Verify both transactions received
7. Verify balance = 0.002 BTC (sum of both)

**Expected Results:**
- ✅ First transaction received and confirmed
- ✅ Second transaction to SAME address received
- ✅ Both transactions visible in history
- ✅ Balance correctly sums: 0.001 + 0.001 = 0.002 BTC
- ✅ UTXO tracking correct (2 separate UTXOs)
- ✅ Can spend from either or both UTXOs

**UTXO Verification:**
Use block explorer:
- Address should show 2 unspent outputs
- Each UTXO: 0.001 BTC
- Total: 0.002 BTC

**Privacy Warning:**
While technically allowed, reusing addresses is discouraged for privacy. Wallet should still function correctly.

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-008: Address Format Matches Account Type

**Priority:** P0
**Time:** 10 minutes

**Purpose:** Verify address format is correct for each account type

**Test 1: Native SegWit Account**
**Steps:**
1. Switch to Native SegWit account
2. View receiving address

**Expected:**
- ✅ Address starts with "tb1" (testnet Bech32)
- ✅ Length: ~42-62 characters
- ✅ All lowercase
- ✅ Derivation: m/84'/1'/X'/0/Y

**Test 2: SegWit Account (Wrapped)**
**Steps:**
1. Switch to SegWit account
2. View receiving address

**Expected:**
- ✅ Address starts with "2" (testnet P2SH)
- ✅ Length: ~34-35 characters
- ✅ Derivation: m/49'/1'/X'/0/Y

**Test 3: Legacy Account**
**Steps:**
1. Switch to Legacy account
2. View receiving address

**Expected:**
- ✅ Address starts with "m" or "n" (testnet P2PKH)
- ✅ Length: ~34 characters
- ✅ Derivation: m/44'/1'/X'/0/Y

**Verification with BIP39 Tool:**
For each account type:
1. Open https://iancoleman.io/bip39/
2. Paste wallet seed phrase
3. Select appropriate BIP (BIP44/49/84)
4. Coin: Bitcoin Testnet
5. Verify first address matches wallet

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-009: Tag Received Transaction

**Priority:** P1
**Time:** 8 minutes

**Prerequisites:** At least 1 received transaction in history

**Purpose:** Verify transaction metadata can be added to received transactions

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click on a received transaction to open detail pane
3. Expand "Tags & Notes" section
4. Add metadata:
   - Category: "Faucet"
   - Tags: #testnet, #received
   - Notes: "Test transaction from faucet"
5. Click "Save"
6. Observe success feedback
7. Close detail pane
8. Reopen same transaction
9. Verify metadata persisted

**Expected Results:**
- ✅ Transaction detail pane opens correctly
- ✅ "Tags & Notes" section visible
- ✅ Can expand/collapse metadata section
- ✅ Category field accepts text input
- ✅ Tags can be added with TagInput component
- ✅ Notes textarea accepts text
- ✅ Character counters show for notes
- ✅ "Save" button functional
- ✅ Success message: "Metadata saved successfully"
- ✅ Metadata persists after closing and reopening
- ✅ Transaction row shows metadata indicators:
  - Category badge (purple)
  - Tags icon with count (green)
  - Notes icon (amber)

**Visual Indicators:**
```
Transaction Row (after adding metadata):
┌────────────────────────────────────────┐
│ ↓ Received  +0.001 BTC  [6/6]         │
│   Faucet  🏷️ 2  📝                     │
│   Oct 29, 2:30 PM   Confirmed         │
│          ^^^  ^^^  ^^                  │
│       Category Tags Notes              │
└────────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-010: Add Sender to Contacts

**Priority:** P1
**Time:** 10 minutes

**Prerequisites:** At least 1 received transaction from external address

**Purpose:** Verify "Add to Contacts" functionality from transaction detail pane

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click on a received transaction
3. In transaction detail pane, locate "Inputs" section
4. Find sender address (input address)
5. Observe "Add to Contacts" button next to unknown address
6. Click "Add to Contacts" button
7. Observe contact form modal opens
8. Verify address is pre-filled
9. Add contact details:
   - Name: "Test Sender"
   - Email: testsender@example.com (optional)
   - Category: "Faucet"
   - Tags: key="source", value="testnet"
   - Notes: "Added from received transaction"
10. Click "Save"
11. Observe success message
12. Close modal and transaction detail pane
13. Navigate to ContactsScreen
14. Verify "Test Sender" contact appears
15. Return to transaction detail pane
16. Verify "Add to Contacts" button no longer shows (address now known)

**Expected Results:**
- ✅ Transaction detail pane shows input addresses
- ✅ "Add to Contacts" button visible for unknown addresses
- ✅ Button NOT visible for addresses already in contacts
- ✅ Click button opens contact form modal
- ✅ Address field pre-filled with sender address
- ✅ Suggested category: "Sender" or transaction type
- ✅ All contact fields functional
- ✅ Can add custom tags (key-value pairs)
- ✅ Save creates contact successfully
- ✅ Success message: "Contact added successfully"
- ✅ Contact appears in ContactsScreen
- ✅ "Add to Contacts" button disappears after adding
- ✅ Contact name now appears in transaction detail

**Visual Flow:**
```
Before Adding Contact:
┌─────────────────────────────────┐
│ Transaction Detail Pane         │
│ Inputs:                         │
│ tb1qsender... [Add to Contacts] │
└─────────────────────────────────┘

After Adding Contact:
┌─────────────────────────────────┐
│ Transaction Detail Pane         │
│ Inputs:                         │
│ Test Sender (tb1qsender...)    │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-011: Filter Transactions by Contact (Sender)

**Priority:** P1
**Time:** 8 minutes

**Prerequisites:**
- At least 2 contacts created
- Contacts have associated transactions (sent from or sent to)

**Purpose:** Verify contact filter works correctly for sender filtering

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click "Filter" button to open FilterPanel
3. Expand "Contact" filter section
4. Select contact "Test Sender" from dropdown
5. Click "Apply" or observe auto-filter
6. Verify filtered results show only transactions involving "Test Sender"
7. Observe active filter pill shows: "Contact: Test Sender"
8. Add second contact to filter
9. Verify results show transactions from either contact (OR logic)
10. Clear contact filter by clicking X on filter pill
11. Verify all transactions shown again

**Expected Results:**
- ✅ Filter button visible in transaction history
- ✅ FilterPanel opens with "Contact" section
- ✅ Contact dropdown shows all contacts
- ✅ Contact names displayed (not raw addresses)
- ✅ Multi-select enabled (can select multiple contacts)
- ✅ Search box in contact dropdown functional
- ✅ Selecting contact filters transactions immediately
- ✅ Active filter pill shows selected contact name
- ✅ Multiple contacts use OR logic (show any match)
- ✅ Contact count shown: "Contact (3 selected)"
- ✅ Filtered results accurate:
  - Shows transactions FROM selected contact
  - Shows transactions TO selected contact
- ✅ Clear filter pill removes filter
- ✅ No results message if no transactions for contact

**Visual Example:**
```
FilterPanel:
┌─────────────────────────────────┐
│ Filters                    [X]  │
├─────────────────────────────────┤
│ Contact ▼                       │
│ ☑ Test Sender (3 txs)          │
│ ☐ Faucet User (1 tx)           │
│ ☐ Exchange Wallet (0 txs)      │
│                                 │
│ [Search contacts...]            │
└─────────────────────────────────┘

Active Filter Pills:
[ Contact: Test Sender X ]
```

**Testing Contact Filter:**
1. **Single contact:** Verify only that contact's transactions shown
2. **Multiple contacts:** Verify OR logic (any match)
3. **Contact with no transactions:** Verify empty state message
4. **Combine with other filters:** Contact + tag filter (AND logic)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### RECV-EDGE-01: Receive Very Small Amount (Dust)

**Priority:** P2
**Time:** 10 minutes

**Steps:**
1. Receive very small amount (e.g., 0.00000546 BTC = 546 satoshis)
2. Verify wallet handles correctly

**Expected:**
- ✅ Transaction received
- ✅ Balance updates
- ✅ Dust warning may be shown
- ✅ May be uneconomical to spend (fee > amount)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-EDGE-02: Receive While Wallet Locked

**Priority:** P2
**Time:** 10 minutes

**Steps:**
1. Lock wallet
2. Request testnet Bitcoin to last used address
3. Wait for transaction broadcast
4. Unlock wallet
5. Observe balance update

**Expected:**
- ✅ Transaction received even while locked
- ✅ Balance updates after unlocking
- ✅ Transaction appears in history

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-EDGE-03: Maximum Address Generation

**Priority:** P2
**Time:** 5 minutes (or test programmatically)

**Steps:**
1. Generate new addresses repeatedly
2. Continue until gap limit reached
3. Observe behavior

**Expected:**
- ✅ Gap limit enforced (e.g., 20 unused addresses)
- ✅ Cannot generate beyond gap limit until previous addresses receive funds
- ✅ Error: "Address gap limit reached. Use existing addresses first."

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### RECV-EDGE-04: Address List Pagination

**Priority:** P1 (Feature Implemented)
**Time:** 10 minutes

**Prerequisites:** Account with 15+ addresses generated

**Purpose:** Verify address list pagination works correctly on Dashboard

**Steps:**
1. Navigate to Dashboard
2. Scroll to "Addresses" section (below transaction history)
3. Generate at least 15 addresses (if not already present)
4. Observe address list and pagination controls
5. Test pagination functionality

**Expected Results:**
- ✅ Pagination controls visible when more than 10 addresses
- ✅ Status text shows: "Showing 1-10 of 15 addresses"
- ✅ Items per page selector options: 10, 35, 50, 100, 500
- ✅ Default: 10 items per page
- ✅ Page navigation buttons:
  - "Prev" button (disabled on page 1)
  - Page number buttons (1, 2, 3, ..., last)
  - "Next" button (disabled on last page)
- ✅ Current page highlighted in Bitcoin orange
- ✅ Addresses displayed newest first (descending order)
- ✅ Address #1 (most recent) on page 1
- ✅ "Most Recent" badge shown on first address (page 1 only)
- ✅ Pagination resets to page 1 when account changes
- ✅ No duplicate addresses across pages
- ✅ No missing addresses between pages

**Visual Example:**
```
Addresses Section
┌─────────────────────────────────────┐
│ Addresses              [+ Generate] │
├─────────────────────────────────────┤
│ Address #15 ⭐ Most Recent          │
│ tb1q... [Copy]                      │
├─────────────────────────────────────┤
│ Address #14                         │
│ tb1q... [Copy]                      │
├─────────────────────────────────────┤
│ ... (8 more addresses)              │
└─────────────────────────────────────┘

Pagination Controls:
┌─────────────────────────────────────┐
│ Showing 1-10 of 15 addresses        │
│                                     │
│ Items per page: [10 ▼]             │
│                                     │
│ [< Prev] [1] [2] [Next >]          │
│          ^^^                        │
└─────────────────────────────────────┘
```

**Test 1: Navigate to Page 2**
1. Click "Next" button or page "2"
2. Observe:
   - ✅ Shows addresses 11-15 (older addresses)
   - ✅ Address #5 through Address #1 shown
   - ✅ Status text: "Showing 11-15 of 15 addresses"
   - ✅ "Most Recent" badge NOT shown on page 2
   - ✅ Page 2 button highlighted

**Test 2: Change Items Per Page**
1. Navigate to page 2
2. Change items per page to "35"
3. Observe:
   - ✅ All 15 addresses shown on single page
   - ✅ Pagination resets to page 1
   - ✅ Pagination controls hidden (all items fit)
   - ✅ "Most Recent" badge shown on first address

**Test 3: Generate New Address While on Page 2**
1. Set items per page to 10
2. Navigate to page 2
3. Click "+ Generate New" button
4. Observe:
   - ✅ New address generated (Address #16)
   - ✅ Pagination resets to page 1 automatically
   - ✅ New address appears at top with "Most Recent" badge
   - ✅ Total count updates: "Showing 1-10 of 16 addresses"

**Test 4: Pagination Resets on Account Switch**
1. Navigate to page 2 of addresses
2. Switch to different account
3. Observe:
   - ✅ New account's addresses shown
   - ✅ Pagination on page 1
   - ✅ Address count reflects new account

**Test 5: Copy Address from Page 2**
1. Navigate to page 2
2. Click "Copy" on any address
3. Observe:
   - ✅ Address copied successfully
   - ✅ Visual feedback shown
   - ✅ Pagination state preserved (stays on page 2)

**Test 6: Imported Private Key Account**
For imported private key account:
1. Switch to imported account
2. Observe addresses section
3. Verify:
   - ✅ Shows single address only
   - ✅ No pagination controls (only 1 address)
   - ✅ No "Generate New" button
   - ✅ Info message: "Imported accounts have a single address"

**Address Ordering Verification:**
1. Note address indices on page 1: #15, #14, #13, #12, #11, #10, #9, #8, #7, #6
2. Navigate to page 2
3. Verify address indices: #5, #4, #3, #2, #1
4. Confirm newest addresses first, oldest addresses last

**Edge Cases:**
- ✅ Exactly 10 addresses: No pagination shown
- ✅ 11 addresses: Pagination shown (2 pages)
- ✅ 1 address (new account): No pagination
- ✅ Last page with fewer items: e.g., "Showing 11-15 of 15"

**Performance Check:**
1. Generate 50+ addresses
2. Navigate between pages
3. Verify smooth, instant transitions
4. No lag when switching pages

**Screenshot Points:**
- Address list with pagination controls
- "Most Recent" badge on page 1
- Page 2 without "Most Recent" badge
- Items per page dropdown
- Address pagination with 50+ addresses

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Test Summary

**Total Tests:** 11 core + 4 edge cases = 15 tests
**P0 Tests:** 5 (RECV-001, RECV-002, RECV-003, RECV-004, RECV-008)
**P1 Tests:** 7 (RECV-005, RECV-006, RECV-007, RECV-009, RECV-010, RECV-011, RECV-EDGE-04)
**P2 Tests:** 3 (RECV-EDGE-01, RECV-EDGE-02, RECV-EDGE-03)

**Critical Tests:**
- RECV-002: Copy address
- RECV-003: QR code scanning
- RECV-004: Receive and balance update
- RECV-008: Address format validation

**New Feature Tests:**
- RECV-009: Tag received transaction (transaction metadata)
- RECV-010: Add sender to contacts (contact tagging)
- RECV-011: Filter transactions by contact (sender filtering)

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Balance not updating after receiving
**Cause:** API polling not working or network issue
**Solution:** Check Blockstream API connectivity
**Report As:** P0 bug

### Issue: Wrong address format generated
**Cause:** Derivation path or address type mismatch
**Solution:** Verify derivation path logic
**Report As:** P0 critical bug (potential fund loss)

### Issue: QR code not scannable
**Cause:** QR code too small or low resolution
**Solution:** Increase QR code size, check encoding
**Report As:** P1 bug

### Issue: Cannot generate new addresses
**Cause:** Gap limit reached or address generation bug
**Solution:** Verify gap limit logic
**Report As:** P1 bug

---

## Testnet Faucets

**Primary Faucet:**
- URL: https://testnet-faucet.mempool.co/
- Amount: ~0.001 BTC
- Rate limit: 1 request per day per IP

**Backup Faucets:**
- https://coinfaucet.eu/en/btc-testnet/
- https://bitcoinfaucet.uo1.net/
- https://testnet.help/en/btcfaucet/testnet

**If Faucets Empty:**
- Wait 24 hours and retry
- Use backup faucets
- Ask for testnet coins on Bitcoin forums
- Mine testnet blocks (very easy, fast)

---

## Address Derivation Reference

**Derivation Path Format:**
```
m / purpose' / coin_type' / account' / change / address_index

For Bitcoin Testnet:
- purpose: 44 (Legacy), 49 (SegWit), 84 (Native SegWit)
- coin_type: 1 (testnet)
- account: 0, 1, 2, ... (account number)
- change: 0 (receiving), 1 (change)
- address_index: 0, 1, 2, ... (address number)
```

**Examples:**
```
Native SegWit Account 1, Address 1:
m/84'/1'/0'/0/0

SegWit Account 2, Address 3:
m/49'/1'/1'/0/2

Legacy Account 1, Change Address 1:
m/44'/1'/0'/1/0
```

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
