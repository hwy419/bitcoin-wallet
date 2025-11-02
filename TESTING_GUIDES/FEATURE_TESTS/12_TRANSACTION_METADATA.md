# Feature Test Guide: Transaction Metadata

**Feature Area:** Transaction Tags, Category, & Notes
**Test Cases:** 20 tests (17 core + 3 edge cases)
**Time to Execute:** 2.5 hours
**Priority:** P1 (High - User Experience)

---

## Overview

This feature validates transaction metadata functionality including adding tags, categories, and notes to transactions, metadata autocomplete, validation, visual indicators, and encrypted storage. Metadata helps users organize and remember transaction context.

**Why this matters:** Transaction metadata allows users to add context to their Bitcoin transactions (categories, tags, notes) making it easier to track spending, organize transactions, and prepare for accounting or tax purposes.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] At least 5 transactions in history (mix of sent and received)
- [ ] Chrome DevTools open (F12) for all tests
- [ ] Completed test data setup from TESTNET_SETUP_GUIDE.md Step 3 (recommended)

---

## Test Cases

### META-001: Add Metadata to Transaction (Tags, Category, Notes)

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify complete metadata can be added to any transaction

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click on any transaction to open TransactionDetailPane
3. Locate "Tags & Notes" section (may be collapsed initially)
4. Click to expand "Tags & Notes" section
5. Observe metadata form with 3 sections:
   - Category field
   - Tags input
   - Notes textarea
6. Add category:
   - Type "Business" in category field
   - Observe character counter: "8 / 30"
7. Add tags:
   - Type "#payment" and press Enter
   - Type "#invoice" and press Enter
   - Type "#q4-2025" and press Enter
   - Observe 3 tags displayed as chips
8. Add notes:
   - Type: "Monthly payment to supplier for Q4 services rendered"
   - Observe character counter: "X / 500"
9. Review all entered metadata
10. Click "Save" button
11. Observe success feedback
12. Close transaction detail pane
13. Observe transaction row in list
14. Verify visual indicators appear:
    - Category badge (purple): "Business"
    - Tags icon (green) with count: "🏷️ 3"
    - Notes icon (amber): "📝"
15. Reopen transaction detail pane
16. Verify all metadata persisted correctly

**Expected Results:**
- ✅ "Tags & Notes" section visible in transaction detail
- ✅ Section can expand/collapse
- ✅ Category field accepts text input (single line)
- ✅ Character counter shows: "X / 30 characters"
- ✅ TagInput component allows multiple tags
- ✅ Tags accept # prefix (automatically added if omitted)
- ✅ Tag chips displayed with X remove button
- ✅ Notes textarea accepts multi-line text
- ✅ Character counter: "X / 500 characters"
- ✅ "Save" button functional
- ✅ Success message: "Metadata saved successfully"
- ✅ Visual indicators appear in transaction row:
  - Purple category badge with text
  - Green tags icon "🏷️" with count
  - Amber notes icon "📝"
- ✅ Hover tooltips show metadata preview
- ✅ All metadata persists after close/reopen
- ✅ Metadata syncs across app (visible from Dashboard, History, etc.)

**Visual Indicators:**
```
Transaction Row (with metadata):
┌──────────────────────────────────────────┐
│ ↑ Sent           -0.001 BTC [6/6]        │
│   Business  🏷️ 3  📝                      │
│   ^^^^^^    ^^^^^  ^^                    │
│  Category   Tags  Notes                  │
│   Oct 30, 3:00 PM   Confirmed           │
└──────────────────────────────────────────┘

Hover on category badge:
┌─────────────────────┐
│ Category: Business  │
└─────────────────────┘

Hover on tags icon:
┌───────────────────────────┐
│ Tags:                     │
│ • #payment                │
│ • #invoice                │
│ • #q4-2025                │
└───────────────────────────┘

Hover on notes icon:
┌─────────────────────────────────┐
│ Notes:                          │
│ Monthly payment to supplier...  │
│ (click to view full notes)      │
└─────────────────────────────────┘
```

**Metadata Form:**
```
┌────────────────────────────────────┐
│ Tags & Notes              [Expand] │
├────────────────────────────────────┤
│ Category:                          │
│ [Business______________] 8/30      │
│                                    │
│ Tags:                              │
│ [#payment X] [#invoice X]          │
│ [#q4-2025 X]                       │
│ [Add tag...____________]           │
│                                    │
│ Notes:                             │
│ ┌────────────────────────────────┐ │
│ │ Monthly payment to supplier    │ │
│ │ for Q4 services rendered       │ │
│ └────────────────────────────────┘ │
│ 58 / 500 characters                │
│                                    │
│           [Cancel]  [Save]         │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-002: Edit Existing Metadata

**Priority:** P1
**Time:** 10 minutes

**Prerequisites:** Transaction with existing metadata (from META-001)

**Purpose:** Verify transaction metadata can be edited

**Steps:**
1. Open transaction with metadata
2. Expand "Tags & Notes" section
3. Observe existing metadata displayed:
   - Category: Business
   - Tags: #payment, #invoice, #q4-2025
   - Notes: Monthly payment...
4. Click "Edit" button
5. Observe form fields become editable
6. Modify category:
   - Change "Business" → "Expense"
7. Modify tags:
   - Remove tag: #q4-2025 (click X)
   - Add new tag: #recurring
8. Modify notes:
   - Append: " - Payment completed on schedule."
9. Click "Save"
10. Verify success message
11. Verify updates reflected in transaction row:
    - Category badge now shows "Expense"
    - Tags icon shows "🏷️ 3" (same count)
    - Notes icon still present
12. Close and reopen transaction
13. Verify all changes persisted:
    - Category: Expense
    - Tags: #payment, #invoice, #recurring
    - Notes: Updated text

**Expected Results:**
- ✅ Existing metadata displays correctly
- ✅ "Edit" button visible when metadata exists
- ✅ Click Edit enables form fields
- ✅ Can modify category text
- ✅ Can remove existing tags (X button)
- ✅ Can add new tags
- ✅ Can modify notes text
- ✅ Character counters update in real-time
- ✅ "Save" button persists changes
- ✅ Success message: "Metadata updated successfully"
- ✅ Transaction row indicators update immediately
- ✅ Changes persist after close/reopen
- ✅ "Cancel" button discards changes (test separately)

**Visual Edit Mode:**
```
Tags & Notes (Edit Mode)
┌────────────────────────────────────┐
│ Tags & Notes        [Cancel][Save] │
├────────────────────────────────────┤
│ Category:                          │
│ [Expense_______________] 7/30      │
│                                    │
│ Tags:                              │
│ [#payment X] [#invoice X]          │
│ [#recurring X]                     │
│ [Add tag...____________]           │
│                                    │
│ Notes:                             │
│ ┌────────────────────────────────┐ │
│ │ Monthly payment to supplier    │ │
│ │ for Q4 services rendered       │ │
│ │ - Payment completed on         │ │
│ │   schedule.                    │ │
│ └────────────────────────────────┘ │
│ 89 / 500 characters                │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-003: Delete Metadata (Clear All Fields)

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** Transaction with metadata

**Purpose:** Verify all metadata can be deleted

**Steps:**
1. Open transaction with metadata
2. Click "Edit" button
3. Clear all fields:
   - Delete category text (clear field)
   - Remove all tags (click X on each)
   - Clear notes textarea (delete all text)
4. Verify all fields empty
5. Click "Save"
6. Observe confirmation or warning (optional)
7. Verify metadata deleted
8. Check transaction row:
   - No category badge
   - No tags icon
   - No notes icon
9. Reopen transaction detail pane
10. Verify "Tags & Notes" section shows empty state

**Expected Results:**
- ✅ Can clear category field completely
- ✅ Can remove all tags
- ✅ Can clear notes field completely
- ✅ Save with empty fields deletes metadata
- ✅ Optional: Confirmation "Remove all metadata?"
- ✅ Success message: "Metadata removed"
- ✅ All visual indicators removed from transaction row
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

Tags & Notes Section (empty):
┌────────────────────────────────────┐
│ Tags & Notes              [Expand] │
├────────────────────────────────────┤
│ No metadata yet                    │
│ [Add Metadata]                     │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-004: Category Autocomplete

**Priority:** P1
**Time:** 8 minutes

**Prerequisites:** Multiple transactions with various categories

**Purpose:** Verify category autocomplete shows existing categories

**Steps:**
1. Create test data:
   - Transaction A: Category "Business"
   - Transaction B: Category "Business"
   - Transaction C: Category "Personal"
   - Transaction D: Category "Expense"
2. Open new transaction (Transaction E)
3. Start typing in category field: "Bu..."
4. Observe autocomplete dropdown appears
5. Verify "Business" suggestion shown
6. Verify usage count displayed: "Business (used 2 times)"
7. Click "Business" suggestion
8. Verify field populated with "Business"
9. Clear field and type: "Per..."
10. Verify "Personal" suggestion shown
11. Select with keyboard (Down arrow, Enter)
12. Verify field populated

**Expected Results:**
- ✅ Category field has autocomplete
- ✅ Suggestions appear after 2+ characters typed
- ✅ Suggestions show existing categories from other transactions
- ✅ Usage count displayed: "Business (used 2 times)"
- ✅ Suggestions sorted by usage count (most used first)
- ✅ Can select suggestion with mouse click
- ✅ Can select with keyboard (arrows + Enter)
- ✅ Autocomplete dropdown dismisses after selection
- ✅ Can still type custom category (not limited to suggestions)
- ✅ Case-insensitive matching

**Autocomplete Dropdown:**
```
Category:
[Bu_____________________]
 ↓ Suggestions:
 • Business (used 5 times)  ← Most used
 • Bills (used 2 times)
 • Budget (used 1 time)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-005: Tag Autocomplete with Suggestions

**Priority:** P1
**Time:** 8 minutes

**Prerequisites:** Multiple transactions with various tags

**Purpose:** Verify tag autocomplete shows existing tags

**Steps:**
1. Create test data with tags:
   - Multiple transactions with #payment
   - Some with #business
   - Some with #personal
2. Open new transaction
3. Start typing tag: "#pay..."
4. Observe tag autocomplete dropdown
5. Verify "#payment" suggestion shown with usage count
6. Select suggestion
7. Verify tag added
8. Start typing another tag: "#bus..."
9. Verify "#business" suggestion shown
10. Test keyboard navigation (arrows, Enter)

**Expected Results:**
- ✅ Tag field has autocomplete
- ✅ Suggestions appear as you type
- ✅ Shows existing tags with # prefix
- ✅ Usage count shown: "#payment (used 8 times)"
- ✅ Sorted by usage count (most used first)
- ✅ Partial matching works ("pay" matches "#payment")
- ✅ Can select with mouse or keyboard
- ✅ Autocomplete dismisses after selection
- ✅ Can still type custom tags
- ✅ # prefix automatically added if omitted

**Tag Autocomplete:**
```
Tags:
[#pay___________________]
 ↓ Suggestions:
 • #payment (used 12 times)  ← Most used
 • #payroll (used 3 times)
 • #paypal (used 1 time)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-006: Notes Character Counter

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify notes character counter works correctly

**Steps:**
1. Open transaction metadata editor
2. Observe notes textarea
3. Verify character counter shows: "0 / 500"
4. Type short text: "Test note"
5. Verify counter updates: "9 / 500"
6. Continue typing to approach limit
7. Type 500 characters total
8. Verify counter: "500 / 500"
9. Try to type 501st character
10. Verify prevented or warning shown

**Expected Results:**
- ✅ Character counter visible below notes textarea
- ✅ Counter format: "X / 500 characters"
- ✅ Counter updates in real-time as you type
- ✅ Shows accurate character count
- ✅ Counter turns yellow near limit (e.g., >450 chars)
- ✅ Counter turns red at/over limit (500+ chars)
- ✅ Warning when attempting to exceed limit
- ✅ Save button disabled if over limit

**Visual Counter States:**
```
Normal (under limit):
┌────────────────────────────────┐
│ Notes:                         │
│ [Test note...                ] │
│ 150 / 500 characters           │
└────────────────────────────────┘

Warning (near limit):
┌────────────────────────────────┐
│ Notes:                         │
│ [Long note text...            ] │
│ 478 / 500 characters ⚠️         │
└────────────────────────────────┘

Error (over limit):
┌────────────────────────────────┐
│ Notes:                         │
│ [Very long note text...       ] │
│ ❌ 523 / 500 characters         │
│ Notes must be 500 chars or less│
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-007: Save Metadata Successfully

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify metadata saves correctly

**Steps:**
1. Add metadata to transaction
2. Click "Save" button
3. Observe save process
4. Verify success feedback
5. Verify no console errors
6. Verify data persisted

**Expected Results:**
- ✅ "Save" button functional
- ✅ Button shows loading state while saving
- ✅ Success message appears: "Metadata saved successfully"
- ✅ Message auto-dismisses after 3 seconds
- ✅ Form exits edit mode
- ✅ Metadata displayed in view mode
- ✅ Visual indicators appear in transaction row
- ✅ No console errors
- ✅ Data persisted to encrypted storage

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-008: Cancel Metadata Editing

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify cancel button discards changes

**Steps:**
1. Open transaction with existing metadata
2. Click "Edit"
3. Make changes to category, tags, and notes
4. Click "Cancel" button (do NOT save)
5. Observe changes discarded
6. Verify original metadata restored
7. Verify transaction row unchanged

**Expected Results:**
- ✅ "Cancel" button visible in edit mode
- ✅ Click cancels editing
- ✅ All changes discarded
- ✅ Original metadata restored
- ✅ Form returns to view mode
- ✅ No console errors
- ✅ Transaction row unchanged

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-009: Metadata Validation - Category Too Long

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify category length limit enforced

**Steps:**
1. Open metadata editor
2. Type 31+ characters in category field
3. Observe validation error
4. Verify cannot save

**Expected Results:**
- ✅ Character counter: "31 / 30" (red)
- ✅ Error message: "Category must be 30 characters or less"
- ✅ Save button disabled
- ✅ Must shorten to save
- ✅ Error clears when fixed

**Visual Error:**
```
Category:
[This is a very long category name_]
❌ 35 / 30 characters
Category must be 30 characters or less

[Save] ← Disabled
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-010: Metadata Validation - Notes Too Long

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify notes length limit enforced

**Steps:**
1. Type 501+ characters in notes field
2. Observe validation error
3. Verify cannot save

**Expected Results:**
- ✅ Counter: "523 / 500" (red)
- ✅ Error: "Notes must be 500 characters or less"
- ✅ Save button disabled
- ✅ Must shorten to save

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-011: Metadata Validation - Tag Too Long

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify tag length limit enforced

**Steps:**
1. Try to add tag with 31+ characters
2. Observe validation error
3. Verify cannot add tag

**Expected Results:**
- ✅ Error: "Tag must be 30 characters or less"
- ✅ Cannot add tag exceeding limit
- ✅ Must shorten tag name

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-012: Metadata Validation - Duplicate Tag

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify duplicate tags prevented

**Steps:**
1. Add tag: #payment
2. Try to add #payment again
3. Observe duplicate prevention

**Expected Results:**
- ✅ Error: "Tag '#payment' already added"
- ✅ Cannot add duplicate
- ✅ Case-insensitive check (#Payment = #payment)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-013: Metadata Validation - Too Many Tags

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify 10 tag maximum enforced

**Steps:**
1. Add 10 tags successfully
2. Try to add 11th tag
3. Observe limit enforced

**Expected Results:**
- ✅ Can add up to 10 tags
- ✅ Error after 10: "Maximum 10 tags allowed"
- ✅ Must remove tag to add new one
- ✅ Tag count shown: "Tags (10/10)"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-014: Category Badge Display in Transaction Row

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify category badge displays correctly

**Steps:**
1. Add category "Expense" to transaction
2. Save metadata
3. Observe transaction row
4. Verify category badge displayed
5. Verify badge styling:
   - Purple background
   - White text
   - Rounded corners
   - Appropriate size
6. Hover over badge
7. Verify tooltip shows: "Category: Expense"

**Expected Results:**
- ✅ Category badge visible in transaction row
- ✅ Badge shows category text
- ✅ Purple/violet background color
- ✅ White text, readable
- ✅ Rounded corners (pill shape)
- ✅ Positioned before tags/notes icons
- ✅ Hover tooltip shows full text
- ✅ Badge truncates if very long category

**Visual Badge:**
```
Transaction Row:
┌────────────────────────────────────────┐
│ ↑ Sent  -0.001 BTC                    │
│   [Expense]  🏷️ 2  📝                  │
│    ^^^^^^^                             │
│   Purple badge                         │
└────────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-015: Tags Icon with Count Display

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify tags icon displays correctly

**Steps:**
1. Add 3 tags to transaction
2. Save metadata
3. Observe transaction row
4. Verify tags icon displayed: "🏷️ 3"
5. Hover over icon
6. Verify tooltip shows all tags:
   - #payment
   - #invoice
   - #q4-2025
7. Test with different tag counts (1, 5, 10 tags)

**Expected Results:**
- ✅ Tags icon visible: "🏷️ X" (green)
- ✅ Count displays number of tags
- ✅ Green color/icon
- ✅ Hover tooltip shows all tag names
- ✅ Tags listed with # prefix in tooltip
- ✅ Works for 1-10 tags
- ✅ Icon size appropriate

**Visual Tags Icon:**
```
Transaction Row:
┌────────────────────────────────────────┐
│ ↑ Sent  -0.001 BTC                    │
│   Business  🏷️ 3  📝                   │
│              ^^^^                      │
│           Green icon with count        │
└────────────────────────────────────────┘

Hover Tooltip:
┌─────────────────────┐
│ Tags:               │
│ • #payment          │
│ • #invoice          │
│ • #q4-2025          │
└─────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-016: Notes Icon Display

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify notes icon displays correctly

**Steps:**
1. Add notes to transaction
2. Save metadata
3. Observe transaction row
4. Verify notes icon displayed: "📝"
5. Hover over icon
6. Verify tooltip shows notes preview (first 50 chars)
7. Click icon or transaction to view full notes

**Expected Results:**
- ✅ Notes icon visible: "📝" (amber/yellow)
- ✅ Amber/yellow color
- ✅ Hover tooltip shows notes preview
- ✅ Tooltip truncates long notes: "Monthly payment to..."
- ✅ Hint to view full notes: "(click to view full)"
- ✅ Clicking opens transaction detail with full notes

**Visual Notes Icon:**
```
Transaction Row:
┌────────────────────────────────────────┐
│ ↑ Sent  -0.001 BTC                    │
│   Business  🏷️ 3  📝                   │
│                    ^^                  │
│              Amber notes icon          │
└────────────────────────────────────────┘

Hover Tooltip:
┌─────────────────────────────────┐
│ Notes:                          │
│ Monthly payment to supplier...  │
│ (click to view full notes)      │
└─────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-017: Metadata Tooltips on Hover

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify all metadata indicators have hover tooltips

**Steps:**
1. Add complete metadata (category, tags, notes)
2. Save and observe transaction row
3. Hover over category badge
4. Verify tooltip appears within 500ms
5. Hover over tags icon
6. Verify tooltip with all tags
7. Hover over notes icon
8. Verify tooltip with notes preview
9. Move mouse away
10. Verify tooltips dismiss

**Expected Results:**
- ✅ All indicators have hover tooltips
- ✅ Tooltips appear on hover (no click required)
- ✅ Tooltip delay: ~300-500ms
- ✅ Tooltips auto-dismiss on mouse leave
- ✅ Tooltip positioning correct (above or below element)
- ✅ Tooltips don't obscure important UI
- ✅ Tooltip styling consistent with app theme

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-018: Metadata When Wallet Locked (Show Lock Icon)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify metadata encrypted and hidden when wallet locked

**Steps:**
1. Add metadata to transaction
2. Save successfully
3. Lock wallet (Settings → Lock Wallet)
4. Navigate to transaction history
5. Observe transaction row
6. Verify metadata indicators show LOCK icons instead of content:
   - Category badge: 🔒 instead of text
   - Tags icon: 🔒 instead of count
   - Notes icon: 🔒 instead of preview
7. Click transaction to open detail pane
8. Verify metadata section shows: "🔒 Unlock wallet to view metadata"
9. Unlock wallet
10. Verify metadata visible again

**Expected Results:**
- ✅ Metadata hidden when wallet locked
- ✅ Lock icons (🔒) shown instead of metadata content
- ✅ Category badge shows: 🔒 (locked)
- ✅ Tags icon shows: 🔒 (locked)
- ✅ Notes icon shows: 🔒 (locked)
- ✅ Transaction detail pane shows: "🔒 Unlock wallet to view metadata"
- ✅ Cannot view or edit metadata while locked
- ✅ Metadata visible again after unlock
- ✅ No plaintext metadata in console or storage while locked

**Visual Locked State:**
```
Transaction Row (locked):
┌────────────────────────────────────────┐
│ ↑ Sent  -0.001 BTC                    │
│   🔒  🔒  🔒                            │
│   ^^  ^^  ^^                           │
│  Category Tags Notes (all locked)      │
└────────────────────────────────────────┘

Transaction Detail (locked):
┌────────────────────────────────────┐
│ Tags & Notes              [Expand] │
├────────────────────────────────────┤
│ 🔒 Unlock wallet to view metadata  │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-019: Metadata When Wallet Unlocked (Editable)

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify metadata editable when wallet unlocked

**Steps:**
1. Unlock wallet (if locked)
2. Navigate to transaction with metadata
3. Open transaction detail pane
4. Verify metadata visible and readable
5. Click "Edit" button
6. Verify all fields editable
7. Make changes and save
8. Verify changes persist

**Expected Results:**
- ✅ Metadata fully visible when unlocked
- ✅ All fields readable
- ✅ "Edit" button functional
- ✅ All fields editable
- ✅ Changes can be saved
- ✅ No encryption barriers while unlocked

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-020: Inspect Encrypted Storage

**Priority:** P0 (Security Critical)
**Time:** 10 minutes

**Purpose:** Verify transaction metadata encrypted in storage

**Steps:**
1. Ensure wallet unlocked
2. Add metadata to transaction:
   - Category: "TestCategory"
   - Tags: #testtag1, #testtag2
   - Notes: "Test notes for encryption check"
3. Save metadata
4. Open Chrome DevTools (F12)
5. Go to Application tab → Storage → IndexedDB or Local Storage
6. Inspect wallet data storage
7. Search for plaintext strings:
   - Search for "TestCategory"
   - Search for "testtag1"
   - Search for "Test notes"
8. Verify metadata is encrypted (NOT found in plaintext)
9. Lock wallet
10. Re-inspect storage
11. Verify metadata still encrypted
12. Unlock wallet
13. Verify metadata decrypted and visible in UI

**Expected Results:**
- ✅ Metadata NOT visible as plaintext in storage
- ✅ Storage contains encrypted blobs only
- ✅ Searching for "TestCategory" finds NOTHING
- ✅ Searching for "#testtag1" finds NOTHING
- ✅ Searching for "Test notes" finds NOTHING
- ✅ Metadata encrypted with AES-256-GCM
- ✅ Encryption key derived from wallet password
- ✅ Metadata decrypted in memory only when unlocked
- ✅ No plaintext leakage in console logs
- ✅ No plaintext leakage in network requests

**Security Check:**
```
🚨 CRITICAL SECURITY TEST 🚨

Plaintext metadata in storage = CRITICAL SECURITY BUG

✅ PASS: Encrypted blob only
❌ FAIL: "TestCategory" found in plaintext
❌ FAIL: "#testtag1" found in plaintext
❌ FAIL: "Test notes" found in plaintext

If FAIL: Report as P0 CRITICAL SECURITY VULNERABILITY
```

**Chrome DevTools Inspection:**
```
Application → Storage → Local Storage
Key: wallet_data
Value: {
  "iv": "a3f5d2e8b9c4d5e6...",
  "ciphertext": "8h3k5m9n2p4q7r...",
  "authTag": "x2y5z8a1b4c7d0..."
}

✅ No plaintext "TestCategory" visible
✅ No plaintext "#testtag1" visible
✅ Encrypted storage confirmed
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

⚠️ **If FAIL:** This is a CRITICAL SECURITY BUG. Report immediately as P0 priority.

---

## Edge Cases & Error Scenarios

### META-EDGE-001: Empty Metadata Fields

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify behavior with empty/whitespace-only fields

**Steps:**
1. Open metadata editor
2. Enter only whitespace in category: "   "
3. Try to save
4. Verify validation or auto-trim

**Expected Results:**
- ✅ Whitespace-only fields trimmed to empty
- ✅ Empty fields treated as no metadata
- ✅ Or validation error: "Category cannot be empty or whitespace"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-EDGE-002: Unicode Characters in Metadata

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify Unicode characters handled correctly

**Steps:**
1. Add metadata with Unicode:
   - Category: "Café & Restaurant"
   - Tags: #☕coffee, #🌍international
   - Notes: "Payment for café services - €50.00"
2. Save metadata
3. Verify all Unicode preserved
4. Reopen and verify display correct

**Expected Results:**
- ✅ Unicode characters accepted in all fields
- ✅ Accents preserved: "Café"
- ✅ Emoji supported: "☕", "🌍"
- ✅ Special chars: "€", "&"
- ✅ Display correctly in UI
- ✅ Encryption/decryption preserves Unicode

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### META-EDGE-003: Very Long Tag List (10 Tags Max)

**Priority:** P2
**Time:** 8 minutes

**Purpose:** Verify UI handles maximum 10 tags gracefully

**Steps:**
1. Add 10 tags to transaction:
   #tag1, #tag2, #tag3, #tag4, #tag5,
   #tag6, #tag7, #tag8, #tag9, #tag10
2. Save metadata
3. Observe transaction row display
4. Verify tags icon shows: "🏷️ 10"
5. Hover to see all 10 tags in tooltip
6. Open transaction detail
7. Verify all 10 tags displayed
8. Verify no UI overflow or breaking
9. Try to add 11th tag
10. Verify prevented

**Expected Results:**
- ✅ Displays up to 10 tags correctly
- ✅ Transaction row not too wide
- ✅ Tags icon: "🏷️ 10"
- ✅ Tooltip shows all 10 tags
- ✅ Detail pane shows all 10 tags without UI break
- ✅ Tag chips wrap to multiple lines if needed
- ✅ Cannot add 11th tag
- ✅ Error: "Maximum 10 tags allowed"

**Visual with 10 Tags:**
```
Transaction Detail:
┌────────────────────────────────────┐
│ Tags: (10/10)                      │
│ [#tag1 X] [#tag2 X] [#tag3 X]     │
│ [#tag4 X] [#tag5 X] [#tag6 X]     │
│ [#tag7 X] [#tag8 X] [#tag9 X]     │
│ [#tag10 X]                         │
│                                    │
│ ⚠️ Maximum tags reached            │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Regression Testing

**Verify existing transaction features still work:**

### Legacy Transaction Features
- [ ] Transaction history display
- [ ] Transaction detail view
- [ ] Transaction confirmations tracking
- [ ] Block explorer links
- [ ] Transaction amounts correct
- [ ] Transaction types (sent/received) correct
- [ ] Transaction fees displayed
- [ ] Transaction dates/times correct
- [ ] Contact names shown for known addresses

**If any regression fails:** Mark as regression bug, P1 priority

---

## Test Summary

**Total Tests:** 17 core + 3 edge cases = 20 tests
**P0 Tests:** 1 (META-020 - encryption security)
**P1 Tests:** 16 (META-001 through META-019, excluding META-006, META-017)
**P2 Tests:** 3 (META-006, META-017, all edge cases)

**Critical Tests:**
- META-001: Add complete metadata
- META-002: Edit existing metadata
- META-004: Category autocomplete
- META-005: Tag autocomplete
- META-018: Metadata encryption when locked
- META-020: Verify encrypted storage (SECURITY CRITICAL)

**Security Critical:**
- META-020: MUST PASS - Metadata encryption verification

**If META-020 fails:** Report immediately as P0 CRITICAL SECURITY VULNERABILITY

**If any P1 test fails:** Report as high-priority bug, may affect release

---

## Common Issues & Troubleshooting

### Issue: Metadata not saving
**Cause:** Validation error or storage failure
**Solution:** Check console for errors, verify field limits
**Report As:** P1 bug

### Issue: Metadata lost after reload
**Cause:** Storage encryption/decryption bug
**Solution:** Check storage implementation
**Report As:** P0 bug (data loss)

### Issue: Autocomplete not working
**Cause:** Autocomplete logic or data indexing bug
**Solution:** Verify autocomplete implementation
**Report As:** P2 bug

### Issue: Visual indicators not appearing
**Cause:** UI rendering bug or conditional logic error
**Solution:** Check React component rendering
**Report As:** P1 bug

### Issue: Metadata visible when locked
**Cause:** CRITICAL SECURITY BUG - encryption not working
**Solution:** Verify encryption implementation immediately
**Report As:** P0 CRITICAL SECURITY BUG

### Issue: Plaintext metadata in storage
**Cause:** CRITICAL SECURITY BUG - encryption bypassed
**Solution:** Fix encryption implementation immediately
**Report As:** P0 CRITICAL SECURITY BUG

---

## Known Issues

(None at this time - document any known issues discovered during testing)

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
