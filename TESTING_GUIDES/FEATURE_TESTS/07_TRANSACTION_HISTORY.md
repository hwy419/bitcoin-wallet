# Feature Test Guide: Transaction History

**Feature Area:** Transaction History & Details
**Test Cases:** 19 tests (16 core + 3 edge cases)
**Time to Execute:** 2.5 hours
**Priority:** P1 (High - User Information)

---

## Overview

This feature validates transaction history display, transaction details, confirmation tracking, status updates, and block explorer integration. Users need to see their transaction history to track funds.

**Why this matters:** Transaction history is how users verify their Bitcoin activity, track confirmations, and audit their wallet. It must be accurate and easy to understand.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Account with transaction history (send/receive at least 3 transactions)
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Block explorer: https://blockstream.info/testnet/

---

## Test Cases

### HIST-001: Transaction History - UI Display

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** At least 3 transactions in account

**Purpose:** Verify transaction history displays correctly

**Steps:**
1. Unlock wallet
2. Navigate to Dashboard or Transaction History screen
3. Observe transaction list

**Expected Results:**
- ✅ Transaction history section visible
- ✅ Transactions listed in reverse chronological order (newest first)
- ✅ Each transaction shows:
  - Transaction type (Sent/Received)
  - Amount (±0.001 BTC)
  - Date/time
  - Status (Pending/Confirmed)
  - Confirmation count (0/6, 3/6, 6/6)
- ✅ Sent transactions show negative amount (-0.001 BTC)
- ✅ Received transactions show positive amount (+0.001 BTC)
- ✅ Visual distinction between sent/received (icons or colors)
- ✅ Scrollable if many transactions
- ✅ No console errors

**Visual Example:**
```
Transaction History
┌──────────────────────────────────────┐
│ ↓ Received         +0.001 BTC [6/6] │
│   Oct 29, 2:30 PM   Confirmed      │
├──────────────────────────────────────┤
│ ↑ Sent            -0.0005 BTC [3/6] │
│   Oct 29, 1:15 PM   Confirming      │
├──────────────────────────────────────┤
│ ↓ Received         +0.002 BTC [0/1] │
│   Oct 29, 12:00 PM  Pending         │
└──────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-002: Transaction Details Modal

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify clicking transaction shows detailed information

**Steps:**
1. Navigate to transaction history
2. Click on a transaction
3. Observe transaction details modal/view

**Expected Results:**
- ✅ Modal or detail view opens
- ✅ Transaction details displayed:
  - **Transaction ID** (full 64-character hex)
  - **Type**: Sent or Received
  - **Amount**: e.g., 0.001 BTC
  - **Fee**: e.g., 0.00000212 BTC (for sent transactions)
  - **Date/Time**: e.g., "Oct 29, 2025, 2:30 PM"
  - **Status**: Pending/Confirming/Confirmed
  - **Confirmations**: e.g., "3 of 6"
  - **From Address** (for received transactions)
  - **To Address** (for sent transactions)
  - **Block Height** (if confirmed)
- ✅ "Copy TX ID" button
- ✅ "View on Block Explorer" link
- ✅ Close button

**Visual Example:**
```
┌────────────────────────────────┐
│   Transaction Details      [×] │
├────────────────────────────────┤
│ Type:          Received         │
│ Amount:        +0.001 BTC       │
│ Status:        Confirmed        │
│ Confirmations: 6 of 6           │
│                                 │
│ Transaction ID:                 │
│ a3f5d2e8b9...c4d5e6f7  [Copy]  │
│                                 │
│ Date: Oct 29, 2025, 2:30 PM     │
│ Block: 2,543,210                │
│                                 │
│ [View on Block Explorer]        │
│                                 │
│         [Close]                 │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-003: Confirmation Count Updates

**Priority:** P0
**Time:** 15-30 minutes (wait for confirmations)

**Purpose:** Verify confirmation count updates as blocks are mined

**Steps:**
1. Send or receive a new transaction
2. Observe initial confirmation count: 0/6
3. Wait for first block (~10 minutes)
4. Observe confirmation count updates to 1/6
5. Wait for additional confirmations
6. Observe count increases: 2/6, 3/6, ... 6/6

**Expected Results:**
- ✅ Initial state: 0 confirmations, status "Pending"
- ✅ After 1 block: 1 confirmation, status "Confirming"
- ✅ After 6 blocks: 6 confirmations, status "Confirmed"
- ✅ Confirmation count auto-updates (polling every 30 seconds)
- ✅ No need to refresh browser
- ✅ Visual indication of confirmation progress

**Timing Log:**
```
Transaction received: 2:00 PM (0 conf)
First confirmation:   2:12 PM (1 conf) - 12 min
Second confirmation:  2:23 PM (2 conf) - 11 min
Third confirmation:   2:35 PM (3 conf) - 12 min
Sixth confirmation:   3:08 PM (6 conf)
```

**Confirmation Bar Example:**
```
Confirmations: [====------] 4/6 Confirming
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-004: Transaction Type Indicators

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify sent vs received transactions clearly distinguished

**Steps:**
1. View transaction history with both sent and received transactions
2. Observe visual indicators

**Expected Results:**

**Sent Transactions:**
- ✅ Icon: ↑ (up arrow) or ⬆️
- ✅ Amount: Negative (-0.001 BTC)
- ✅ Color: Red or orange (outgoing indication)
- ✅ Label: "Sent" or "Outgoing"

**Received Transactions:**
- ✅ Icon: ↓ (down arrow) or ⬇️
- ✅ Amount: Positive (+0.001 BTC) or no sign
- ✅ Color: Green (incoming indication)
- ✅ Label: "Received" or "Incoming"

**Visual Comparison:**
```
Sent Transaction:
┌────────────────────────────┐
│ ↑ Sent     -0.001 BTC [6/6]│  ← Red/Orange
└────────────────────────────┘

Received Transaction:
┌────────────────────────────┐
│ ↓ Received +0.001 BTC [6/6]│  ← Green
└────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-005: Block Explorer Link Integration

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify "View on Block Explorer" opens correct transaction

**Steps:**
1. Open transaction details for any transaction
2. Note transaction ID: ________________________________
3. Click "View on Block Explorer" link
4. Observe new tab opens
5. Verify correct transaction displayed on Blockstream

**Expected Results:**
- ✅ Link opens in new browser tab
- ✅ URL: https://blockstream.info/testnet/tx/[TRANSACTION_ID]
- ✅ Transaction ID in URL matches wallet's TX ID
- ✅ Block explorer shows same transaction details:
  - Same amount
  - Same addresses
  - Same confirmation count
  - Same timestamp
- ✅ Link works for both sent and received transactions

**Verification:**
Compare wallet details vs block explorer:
```
Wallet Shows              Block Explorer Shows
────────────────          ────────────────────
Amount: 0.001 BTC         ✅ 0.001 BTC
Confirmations: 6          ✅ 6 confirmations
TX ID: a3f5d2e8...        ✅ Same TX ID
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-006: Empty Transaction History

**Priority:** P2
**Time:** 2 minutes

**Purpose:** Verify empty state displays correctly for new accounts

**Steps:**
1. Create new account with 0 transactions
2. Navigate to transaction history
3. Observe empty state

**Expected Results:**
- ✅ Empty state message displayed
- ✅ Message: "No transactions yet" or similar
- ✅ Helpful text: "Send or receive Bitcoin to see your transaction history"
- ✅ No error messages
- ✅ UI doesn't break with empty history

**Visual Example:**
```
┌────────────────────────────────┐
│   Transaction History          │
├────────────────────────────────┤
│                                │
│      📭                         │
│   No transactions yet          │
│                                │
│   Send or receive Bitcoin to   │
│   see your transaction history │
│                                │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-007: Transaction Fee Display (Sent Transactions)

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify sent transactions show fee information

**Steps:**
1. Find a sent transaction in history
2. Click to view details
3. Observe fee information

**Expected Results:**
- ✅ Fee displayed: e.g., "0.00000212 BTC"
- ✅ Fee rate displayed: e.g., "1.5 sat/vB" or "Medium"
- ✅ Total cost shown: Amount + Fee
- ✅ Fee NOT shown for received transactions (N/A)

**Transaction Detail Example (Sent):**
```
Type: Sent
Amount: 0.001 BTC
Fee: 0.00000212 BTC
Total: 0.00100212 BTC
─────────────────────
Deducted from wallet: 0.00100212 BTC
```

**Transaction Detail Example (Received):**
```
Type: Received
Amount: 0.001 BTC
Fee: N/A (paid by sender)
─────────────────────
Received to wallet: 0.001 BTC
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-008: Pending Transaction Status

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify pending transactions display correctly

**Steps:**
1. Send a new transaction
2. Immediately check transaction history
3. Observe pending transaction before confirmation

**Expected Results:**
- ✅ Transaction appears in history immediately (0 conf)
- ✅ Status: "Pending" or "Unconfirmed"
- ✅ Confirmation count: "0 of 6" or "Waiting for confirmation"
- ✅ Visual indication (spinner, orange color, etc.)
- ✅ Balance deducted immediately (for sent)
- ✅ Warning: "Not confirmed - wait for at least 1 confirmation"

**Pending vs Confirmed Visual:**
```
Pending Transaction:
┌─────────────────────────────────┐
│ ⏳ Sent      -0.001 BTC [0/6]   │ ← Orange
│    Pending - waiting for miners │
└─────────────────────────────────┘

Confirmed Transaction:
┌─────────────────────────────────┐
│ ✅ Sent      -0.001 BTC [6/6]   │ ← Green/White
│    Confirmed                    │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-009: Add Transaction Metadata

**Priority:** P1
**Time:** 12 minutes

**Prerequisites:** At least 2 transactions in history

**Purpose:** Verify transaction metadata (tags, category, notes) can be added and persisted

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click on any transaction to open detail pane
3. Locate "Tags & Notes" section (may be collapsed)
4. Click to expand metadata section
5. Add transaction metadata:
   - **Category:** "Business"
   - **Tags:** Add 3 tags: #payment, #important, #q4-2025
   - **Notes:** "Test transaction for Q4 business payment processing"
6. Observe character counter for notes (should show X/500)
7. Click "Save" button
8. Observe success feedback
9. Close transaction detail pane
10. Observe transaction row shows metadata indicators
11. Reopen transaction detail pane
12. Verify all metadata persisted correctly

**Expected Results:**
- ✅ "Tags & Notes" section visible in transaction detail
- ✅ Section can expand/collapse
- ✅ Category field accepts text input (max 30 characters)
- ✅ TagInput component allows multiple tags
- ✅ Tag autocomplete shows existing tags as suggestions
- ✅ Notes textarea accepts multi-line text (max 500 characters)
- ✅ Character counter updates: "X / 500 characters"
- ✅ Save button functional
- ✅ Success message: "Metadata saved successfully"
- ✅ Transaction row shows visual indicators:
  - Category badge (purple): "Business"
  - Tags icon (green) with count: "🏷️ 3"
  - Notes icon (amber): "📝"
- ✅ Tooltips on hover show metadata preview
- ✅ Metadata persists after closing and reopening
- ✅ Metadata syncs across wallet lock/unlock

**Visual Indicators:**
```
Transaction Row (with metadata):
┌──────────────────────────────────────────┐
│ ↑ Sent           -0.001 BTC [6/6]        │
│   Business  🏷️ 3  📝                      │
│   Oct 30, 3:00 PM   Confirmed           │
└──────────────────────────────────────────┘

Hover tooltip on category badge:
┌─────────────────────┐
│ Category: Business  │
└─────────────────────┘

Hover tooltip on tags icon:
┌─────────────────────────┐
│ Tags: #payment,         │
│ #important, #q4-2025    │
└─────────────────────────┘

Hover tooltip on notes icon:
┌─────────────────────────────────┐
│ Notes: Test transaction for...  │
│ (click to view full notes)      │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-010: Edit Existing Metadata

**Priority:** P1
**Time:** 8 minutes

**Prerequisites:** At least 1 transaction with existing metadata

**Purpose:** Verify transaction metadata can be edited

**Steps:**
1. Navigate to transaction with metadata
2. Open transaction detail pane
3. Expand "Tags & Notes" section
4. Observe existing metadata displayed
5. Click "Edit" button
6. Modify metadata:
   - Change category: "Business" → "Personal"
   - Remove tag: #q4-2025
   - Add new tag: #archived
   - Modify notes: Add " - COMPLETED"
7. Click "Save"
8. Verify updates applied
9. Test cancel functionality:
10. Click "Edit" again
11. Make changes but click "Cancel"
12. Verify changes not saved (original data retained)

**Expected Results:**
- ✅ Existing metadata displays correctly
- ✅ Edit button visible when metadata exists
- ✅ Click Edit enables form fields
- ✅ Can modify category field
- ✅ Can remove existing tags (X button on tag)
- ✅ Can add new tags
- ✅ Can modify notes text
- ✅ Save applies changes successfully
- ✅ Updated metadata reflected in transaction row
- ✅ Cancel button discards changes
- ✅ Original data restored after cancel
- ✅ Edit/Save/Cancel flow smooth and intuitive

**Visual Edit Mode:**
```
Metadata Section (Edit Mode):
┌───────────────────────────────────┐
│ Tags & Notes              [Cancel]│
│                           [Save]  │
├───────────────────────────────────┤
│ Category:                         │
│ [Personal____________] 24/30      │
│                                   │
│ Tags:                             │
│ [#payment X] [#important X]       │
│ [#archived X]                     │
│ [Add tag...___________]           │
│                                   │
│ Notes:                            │
│ ┌───────────────────────────────┐ │
│ │ Test transaction for Q4...    │ │
│ │ - COMPLETED                   │ │
│ └───────────────────────────────┘ │
│ 65 / 500 characters               │
└───────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-011: Delete Transaction Metadata

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** At least 1 transaction with metadata

**Purpose:** Verify transaction metadata can be completely deleted

**Steps:**
1. Open transaction with metadata
2. Click "Edit" button
3. Clear all metadata fields:
   - Delete category text (clear field)
   - Remove all tags (click X on each tag)
   - Clear notes textarea (delete all text)
4. Click "Save"
5. Observe confirmation or warning
6. Verify metadata deleted
7. Check transaction row no longer shows indicators
8. Reopen transaction detail
9. Verify "Tags & Notes" section empty or shows "No metadata"

**Expected Results:**
- ✅ Can clear category field completely
- ✅ Can remove all tags
- ✅ Can clear notes field completely
- ✅ Save with empty fields deletes metadata
- ✅ Optional: Confirmation message "Remove all metadata?"
- ✅ Metadata indicators removed from transaction row
- ✅ Transaction row shows clean state (no badges/icons)
- ✅ Detail pane shows empty metadata section
- ✅ Can re-add metadata after deletion

**Visual After Deletion:**
```
Transaction Row (metadata deleted):
┌──────────────────────────────────────────┐
│ ↑ Sent           -0.001 BTC [6/6]        │
│   Oct 30, 3:00 PM   Confirmed           │
│   (no category badge, no icons)          │
└──────────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-012: Metadata Autocomplete

**Priority:** P2
**Time:** 8 minutes

**Prerequisites:** Multiple transactions with various tags and categories

**Purpose:** Verify autocomplete suggestions for tags and categories work correctly

**Steps:**
1. Create test data:
   - Transaction A: Category "Business", Tags: #payment, #invoice
   - Transaction B: Category "Personal", Tags: #payment, #food
   - Transaction C: Category "Business", Tags: #subscription
2. Open new transaction (Transaction D)
3. Start typing category: "Bu..."
4. Observe autocomplete suggestions
5. Select "Business" from suggestions
6. Start typing tag: "#pay..."
7. Observe tag suggestions
8. Select "#payment" from suggestions
9. Verify autocomplete sorts by usage frequency

**Expected Results:**
- ✅ Category autocomplete shows existing categories
- ✅ Suggestions appear after 2+ characters typed
- ✅ Can select suggestion with mouse click
- ✅ Can select suggestion with keyboard (Enter)
- ✅ Tag autocomplete shows existing tags
- ✅ Tag suggestions include "#" prefix
- ✅ Suggestions sorted by usage count (most used first)
- ✅ Usage count shown: "#payment (used 2 times)"
- ✅ Partial matching works ("pay" matches "#payment")
- ✅ Autocomplete dropdown dismisses after selection
- ✅ Can still type custom values (not limited to suggestions)

**Autocomplete Visual:**
```
Category Autocomplete:
┌─────────────────────────────┐
│ Category:                   │
│ [Bu_____________]           │
│  ↓ Suggestions:             │
│  • Business (used 5 times)  │
│  • Bills (used 2 times)     │
└─────────────────────────────┘

Tag Autocomplete:
┌─────────────────────────────┐
│ Tags: [#pay_____________]   │
│  ↓ Suggestions:             │
│  • #payment (used 8 times)  │
│  • #payroll (used 3 times)  │
└─────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-013: Transaction Filtering - Basic Filters

**Priority:** P1
**Time:** 15 minutes

**Prerequisites:**
- At least 10 transactions
- Transactions with various metadata
- Multiple contacts created

**Purpose:** Verify transaction filtering works for all filter types

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click "Filter" button to open FilterPanel
3. Observe all filter sections available:
   - Contact
   - Tags
   - Category
   - (Existing: Sender Address, Amount Range)

**Test 1: Filter by Single Tag**
1. Expand "Tags" filter section
2. Observe all existing tags listed with counts
3. Select tag "#payment"
4. Observe filtered results show only transactions with #payment tag
5. Verify filter pill shows: "Tag: #payment"
6. Clear filter

**Test 2: Filter by Multiple Tags**
1. Select multiple tags: #payment, #important
2. Observe OR logic (shows transactions with either tag)
3. Verify filter pill: "Tags (2 selected)"
4. Clear filters

**Test 3: Filter by Single Category**
1. Expand "Category" filter section
2. Select "Business"
3. Observe only transactions with "Business" category shown
4. Verify filter pill: "Category: Business"
5. Clear filter

**Test 4: Filter by Multiple Categories**
1. Select categories: "Business", "Personal"
2. Observe OR logic (either category matches)
3. Clear filters

**Test 5: Filter by Contact**
1. Expand "Contact" filter section
2. Select contact "Exchange Wallet"
3. Observe transactions involving that contact
4. Verify shows both sent TO and received FROM contact
5. Clear filter

**Expected Results:**
- ✅ FilterPanel button visible and functional
- ✅ All filter sections present:
  - Contact (with search)
  - Tags (multi-select)
  - Category (multi-select)
  - Sender Address (text input)
  - Amount Range (min/max)
- ✅ Each section can expand/collapse
- ✅ Multi-select works for tags and categories
- ✅ Contact dropdown shows all contacts with transaction counts
- ✅ Tag dropdown shows all tags with usage counts
- ✅ Category dropdown shows all categories with usage counts
- ✅ Search box in dropdowns works
- ✅ Active filters show as pills above transaction list
- ✅ Each pill has X button to remove individual filter
- ✅ "Reset All Filters" button clears everything
- ✅ Filter count badge on FilterPanel button: "Filters (3 active)"
- ✅ Filtered results update immediately
- ✅ Empty state shown if no transactions match filters

**Visual FilterPanel:**
```
┌─────────────────────────────────────┐
│ Filters                        [X]  │
├─────────────────────────────────────┤
│ Contact ▼                           │
│ ☑ Exchange Wallet (12 txs)         │
│ ☐ Test Sender (3 txs)              │
│ [Search contacts...]                │
│                                     │
│ Tags ▼                              │
│ ☑ #payment (24 txs)                │
│ ☐ #important (8 txs)               │
│ ☐ #business (15 txs)               │
│ [Search tags...]                    │
│                                     │
│ Category ▼                          │
│ ☑ Business (18 txs)                │
│ ☐ Personal (12 txs)                │
│ ☐ Investment (5 txs)               │
│                                     │
│ Sender Address ▼                    │
│ [tb1q..._________________]          │
│                                     │
│ Amount Range ▼                      │
│ Min: [0.001_____] BTC              │
│ Max: [0.1_______] BTC              │
│                                     │
│ [Reset All Filters]                 │
└─────────────────────────────────────┘

Active Filter Pills:
┌─────────────────────────────────────┐
│ [ Contact: Exchange Wallet X ]      │
│ [ Tag: #payment X ]                 │
│ [ Category: Business X ]            │
│ [ Reset All Filters ]               │
└─────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-014: Combined Filters (AND Logic)

**Priority:** P1
**Time:** 10 minutes

**Prerequisites:** Transactions with various combinations of metadata

**Purpose:** Verify multiple filters use AND logic correctly

**Steps:**
1. Apply multiple filters simultaneously:
   - Contact: "Exchange Wallet"
   - Tag: "#payment"
   - Category: "Business"
2. Verify results show ONLY transactions matching ALL filters
3. Test various combinations:
   - Contact + Tag
   - Contact + Category
   - Tag + Category
   - Contact + Tag + Category + Amount Range
4. Verify each combination uses AND logic

**Expected Results:**
- ✅ Multiple filters combine with AND logic
- ✅ Results must match ALL active filters
- ✅ Example: Contact="Exchange" AND Tag="#payment"
  - Shows only Exchange transactions that have #payment tag
  - Does NOT show Exchange transactions without #payment tag
  - Does NOT show #payment transactions from other contacts
- ✅ Filter count accurate: "Showing 3 of 50 transactions"
- ✅ Empty state if no transactions match all filters
- ✅ Removing one filter expands results correctly
- ✅ Can build complex filter queries step-by-step

**Test Scenarios:**
```
Scenario 1: Contact + Tag
- Apply: Contact="Exchange Wallet" (12 txs)
- Apply: Tag="#payment" (24 txs)
- Result: Shows 4 txs (intersection of both filters)

Scenario 2: Category + Amount Range
- Apply: Category="Business" (18 txs)
- Apply: Amount Range 0.01-0.1 BTC (8 txs)
- Result: Shows 3 txs (business transactions in range)

Scenario 3: All Filters
- Contact + Tag + Category + Amount Range
- Result: Shows only exact matches (possibly 0-1 txs)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-015: Filter Persistence and Reset

**Priority:** P2
**Time:** 8 minutes

**Purpose:** Verify filter state persists and can be reset

**Steps:**
1. Apply multiple filters (contact, tag, category)
2. Navigate away from Dashboard (go to Send screen)
3. Return to Dashboard
4. Verify filters still active
5. Refresh browser tab (F5)
6. Verify filters persist after refresh
7. Lock wallet
8. Unlock wallet
9. Verify filters cleared OR persisted (document behavior)
10. Apply filters again
11. Click "Reset All Filters" button
12. Verify all filters cleared
13. Verify all transactions shown

**Expected Results:**
- ✅ Filters persist when navigating between screens
- ✅ Filters persist after page refresh (within session)
- ✅ Filter state stored in React context or local storage
- ✅ "Reset All Filters" clears all active filters
- ✅ Filter pills disappear after reset
- ✅ Full transaction list shown after reset
- ✅ FilterPanel closes after reset (optional)
- ✅ Clear behavior: Filters cleared on wallet lock OR persisted (document which)

**Persistence Test:**
```
1. Apply filters
2. Navigate: Dashboard → Send → Dashboard
3. Expected: Filters still active ✅

4. Apply filters
5. Refresh browser (F5)
6. Expected: Filters still active ✅

7. Apply filters
8. Lock wallet → Unlock wallet
9. Expected: Filters cleared OR persisted (implementation-dependent)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### HIST-016: Metadata Validation

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify metadata validation enforces limits and prevents errors

**Steps:**
1. Open transaction detail pane
2. Click "Edit" (or start adding metadata)

**Test 1: Category Length Limit**
1. Type 31+ characters in category field
2. Observe validation error
3. Verify cannot save

**Test 2: Tag Length Limit**
1. Add tag with 31+ characters
2. Observe validation error

**Test 3: Notes Length Limit**
1. Type 501+ characters in notes field
2. Observe character counter turns red
3. Observe validation error
4. Verify cannot save

**Test 4: Duplicate Tag Prevention**
1. Add tag "#payment"
2. Try to add "#payment" again
3. Verify duplicate prevention

**Test 5: Maximum Tags Limit**
1. Add 10 tags
2. Try to add 11th tag
3. Verify limit enforced

**Test 6: Empty Field Behavior**
1. Leave all fields empty
2. Click Save
3. Verify saves successfully (deletes metadata) OR shows warning

**Expected Results:**
- ✅ Category field enforces 30 character max
- ✅ Validation error: "Category must be 30 characters or less"
- ✅ Tag field enforces 30 character max per tag
- ✅ Notes field enforces 500 character max
- ✅ Character counter shows: "X / 500 characters"
- ✅ Counter turns red when over limit
- ✅ Save button disabled when validation errors present
- ✅ Duplicate tags prevented with message: "Tag already added"
- ✅ Maximum 10 tags enforced
- ✅ Error message: "Maximum 10 tags allowed"
- ✅ Validation messages clear and user-friendly
- ✅ Real-time validation (errors show while typing)

**Visual Validation Errors:**
```
Category Over Limit:
┌─────────────────────────────────┐
│ Category:                       │
│ [Very Long Category Name That...│
│ ❌ Category must be 30 chars    │
│    or less (currently 35)       │
└─────────────────────────────────┘

Notes Over Limit:
┌─────────────────────────────────┐
│ Notes:                          │
│ ┌─────────────────────────────┐ │
│ │ Long notes text...          │ │
│ └─────────────────────────────┘ │
│ ❌ 523 / 500 characters         │
└─────────────────────────────────┘

Duplicate Tag:
┌─────────────────────────────────┐
│ Tags: [#payment X]              │
│ [#payment___________]           │
│ ❌ Tag "#payment" already added │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Case Tests

### HIST-EDGE-01: Transaction History Pagination

**Priority:** P1 (Feature Implemented)
**Time:** 15 minutes

**Prerequisites:** Account with 15+ transactions (or create test data)

**Purpose:** Verify transaction pagination controls work correctly

**Steps:**
1. Navigate to Dashboard (transaction history section)
2. Observe transaction list
3. Locate pagination controls at bottom of transaction list
4. Test "Items per page" selector
5. Test page navigation controls
6. Test filter functionality with pagination

**Expected Results:**
- ✅ Pagination controls visible when more than 10 transactions
- ✅ Status text shows: "Showing 1-10 of 25 transactions"
- ✅ Items per page selector options: 10, 35, 50, 100, 500
- ✅ Default: 10 items per page
- ✅ Page navigation buttons:
  - "Prev" button (disabled on page 1)
  - Page number buttons (1, 2, 3, ..., last)
  - "Next" button (disabled on last page)
- ✅ Current page highlighted in Bitcoin orange (#F7931A)
- ✅ Ellipsis ("...") shown for large page ranges
- ✅ Pagination resets to page 1 when changing items per page
- ✅ Pagination works with transaction filters
- ✅ No duplicate transactions across pages
- ✅ No missing transactions between pages

**Visual Example:**
```
Transaction History
┌─────────────────────────────────────┐
│ [Transaction 1]                     │
│ [Transaction 2]                     │
│ ...                                 │
│ [Transaction 10]                    │
└─────────────────────────────────────┘

Pagination Controls:
┌─────────────────────────────────────┐
│ Showing 1-10 of 25 transactions     │
│                                     │
│ Items per page: [10 ▼]             │
│                                     │
│ [< Prev] [1] [2] [3] [Next >]      │
│          ^^^                        │
│       (highlighted)                 │
└─────────────────────────────────────┘
```

**Test 1: Change Items Per Page**
1. Select "35 items per page" from dropdown
2. Observe:
   - ✅ List updates to show 35 transactions
   - ✅ Pagination resets to page 1
   - ✅ Status text updates: "Showing 1-25 of 25 transactions"
   - ✅ Pagination controls hide if all items fit on one page

**Test 2: Navigate Between Pages**
1. Set items per page to 10
2. Click "Next" button
3. Observe:
   - ✅ Shows transactions 11-20
   - ✅ Page 2 button highlighted
   - ✅ Status text: "Showing 11-20 of 25 transactions"
   - ✅ URL or state updates (optional)
4. Click page number "1" button
5. Observe:
   - ✅ Returns to transactions 1-10
   - ✅ Page 1 highlighted

**Test 3: Large Transaction Set (50+ transactions)**
If you have 50+ transactions:
1. Set items per page to 10
2. Observe page numbers
3. Verify ellipsis shown: [1] [2] [3] ... [8]
4. Click last page
5. Verify correct transactions shown

**Test 4: Pagination with Filters**
1. Set items per page to 10
2. Navigate to page 2
3. Apply a transaction filter (e.g., filter by contact)
4. Observe:
   - ✅ Pagination resets to page 1
   - ✅ Status text shows filtered count: "Showing 1-5 of 5 transactions"
   - ✅ Pagination controls adjust to filtered results

**Test 5: Keyboard Accessibility**
1. Tab to pagination controls
2. Verify all buttons keyboard-accessible
3. Press Enter on page number button
4. Verify page changes

**Test 6: Mobile/Responsive**
1. Resize browser to mobile width (< 640px)
2. Observe pagination controls
3. Verify:
   - ✅ Controls remain usable
   - ✅ "Prev"/"Next" text may be hidden (arrows only)
   - ✅ Fewer page numbers shown on small screens

**Edge Cases:**
- ✅ Exactly 10 transactions: No pagination shown
- ✅ 11 transactions: Pagination shown (2 pages)
- ✅ 0 transactions: No pagination, empty state shown
- ✅ Last page with fewer items: e.g., "Showing 21-25 of 25"

**Performance Check:**
1. Navigate between pages
2. Verify smooth, instant page changes
3. No lag or loading spinners needed (data already loaded)

**Screenshot Points:**
- Pagination controls with status text
- Page 1 highlighted state
- Page 2 highlighted state
- Items per page dropdown
- Ellipsis for large page ranges

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### HIST-EDGE-02: Failed/Replaced Transactions

**Priority:** P2
**Time:** 5 minutes (if testable)

**Purpose:** Verify handling of failed or replaced transactions

**Steps:**
1. Create transaction with very low fee (may get stuck)
2. OR: Use RBF to replace transaction
3. Observe how wallet handles

**Expected (implementation-dependent):**
- ✅ Replaced transactions marked as "Replaced"
- ✅ Failed transactions marked as "Failed"
- ✅ Clear explanation why transaction failed
- ✅ Can retry or create new transaction

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___) OR [ ] N/A

---

### HIST-EDGE-03: Transaction with Multiple Outputs

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify transactions with multiple outputs display correctly

**Steps:**
1. Send transaction (will have 2 outputs: recipient + change)
2. View transaction on block explorer
3. Verify wallet displays correctly

**Expected:**
- ✅ Wallet shows amount sent to recipient
- ✅ Change output hidden from user (internal)
- ✅ User sees simple view: "Sent 0.001 BTC"
- ✅ Block explorer shows 2 outputs (recipient + change)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Test Summary

**Total Tests:** 16 core + 3 edge cases = 19 tests
**P0 Tests:** 1 (HIST-003)
**P1 Tests:** 13 (HIST-001, HIST-002, HIST-004, HIST-005, HIST-007, HIST-008, HIST-009, HIST-010, HIST-011, HIST-013, HIST-014, HIST-016, HIST-EDGE-01)
**P2 Tests:** 5 (HIST-006, HIST-012, HIST-015, HIST-EDGE-02, HIST-EDGE-03)

**Critical Tests:**
- HIST-003: Confirmation count updates
- HIST-004: Sent vs received indicators
- HIST-005: Block explorer integration
- HIST-008: Pending transaction display

**New Feature Tests:**
- HIST-009: Add transaction metadata (tags, category, notes)
- HIST-010: Edit existing metadata
- HIST-011: Delete transaction metadata
- HIST-012: Metadata autocomplete suggestions
- HIST-013: Transaction filtering (contact, tag, category)
- HIST-014: Combined filters with AND logic
- HIST-015: Filter persistence and reset
- HIST-016: Metadata validation

**If any P0 test fails:** STOP, report as blocker bug, do not continue testing

---

## Common Issues & Troubleshooting

### Issue: Transactions not appearing in history
**Cause:** API polling not working or transaction not broadcast
**Solution:** Check API connectivity and transaction status
**Report As:** P0 bug

### Issue: Confirmation count not updating
**Cause:** Polling interval too long or API issue
**Solution:** Check polling logic and API responses
**Report As:** P1 bug

### Issue: Wrong transaction type (sent shown as received)
**Cause:** Transaction direction detection bug
**Solution:** Review UTXO input/output logic
**Report As:** P0 bug

### Issue: Block explorer link broken
**Cause:** Wrong URL format or network mismatch
**Solution:** Verify URL construction and network parameter
**Report As:** P1 bug

---

## Transaction History Reference

**Transaction States:**
```
Pending (0 confirmations)
├─> Unconfirmed
└─> Waiting for miners

Confirming (1-5 confirmations)
├─> Low risk of reversal
└─> Wait for more confirmations

Confirmed (6+ confirmations)
├─> Final and irreversible
└─> Safe to consider received
```

**Confirmation Recommendations:**
- 0 confirmations: High risk, not final
- 1 confirmation: Low value transactions acceptable
- 3 confirmations: Moderate security
- 6 confirmations: Standard, secure for most transactions
- 100+ confirmations: Extremely secure (for very large amounts)

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
