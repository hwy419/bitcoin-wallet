# Feature Test Guide: Transaction Filtering

**Feature Area:** Advanced Transaction Filtering
**Test Cases:** 21 tests (18 core + 3 edge cases)
**Time to Execute:** 2 hours
**Priority:** P1 (High - User Experience)

---

## Overview

This feature validates advanced transaction filtering including multi-select filters for contacts, tags, and categories, combined filters with AND/OR logic, active filter pills, and filter persistence. Filtering helps users quickly find specific transactions in their history.

**Why this matters:** As transaction history grows, users need powerful filtering tools to find specific transactions by contact, category, tags, or amount. Good filtering improves user experience and wallet usability.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] **REQUIRED:** Complete test data setup from TESTNET_SETUP_GUIDE.md Step 3
- [ ] At least 10 transactions in history
- [ ] At least 3 contacts created
- [ ] Multiple transactions with metadata (tags, categories, notes)
- [ ] Mix of transactions with and without metadata
- [ ] Chrome DevTools open (F12) for all tests

**If test data not ready:** Follow TESTNET_SETUP_GUIDE.md Step 3 first!

---

## Test Cases

### FILT-001: Filter by Single Contact

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** At least 2 contacts with transactions

**Purpose:** Verify filtering transactions by single contact works correctly

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Observe all transactions displayed (unfiltered)
3. Note total transaction count
4. Click "Filter" button to open FilterPanel
5. Observe FilterPanel slides in from right
6. Locate "Contact" filter section
7. Click to expand "Contact" section
8. Observe dropdown shows all contacts with transaction counts
9. Select contact "Exchange Wallet"
10. Observe filtered results update immediately
11. Verify only transactions involving "Exchange Wallet" shown
12. Verify filter pill appears: "Contact: Exchange Wallet"
13. Note filtered transaction count
14. Verify status text: "Showing X of Y transactions"
15. Click X on filter pill to clear filter
16. Verify all transactions shown again

**Expected Results:**
- ✅ "Filter" button visible in transaction history header
- ✅ Click opens FilterPanel on right side
- ✅ "Contact" filter section present
- ✅ Dropdown lists all contacts
- ✅ Contact names displayed (not raw addresses)
- ✅ Transaction counts shown: "Exchange Wallet (3 txs)"
- ✅ Selecting contact filters immediately
- ✅ Only transactions TO or FROM selected contact shown
- ✅ Sent and received transactions both included
- ✅ Active filter pill displays: "Contact: Exchange Wallet"
- ✅ Pill has X button to remove filter
- ✅ Status text shows filtered count: "Showing 3 of 25 transactions"
- ✅ Clearing filter restores full list
- ✅ No console errors

**Visual Example:**
```
Transaction History (Filtered)
┌────────────────────────────────────────┐
│ Transactions          [Filter (1)]     │
│ Active Filters:                        │
│ [Contact: Exchange Wallet X]           │
├────────────────────────────────────────┤
│ Showing 3 of 25 transactions           │
├────────────────────────────────────────┤
│ ↑ Sent  -0.001 BTC  Exchange Wallet   │
│ ↓ Recv  +0.005 BTC  Exchange Wallet   │
│ ↑ Sent  -0.002 BTC  Exchange Wallet   │
└────────────────────────────────────────┘

FilterPanel:
┌────────────────────────────────┐
│ Filters                    [X] │
├────────────────────────────────┤
│ Contact ▼                      │
│ ☑ Exchange Wallet (3 txs)     │
│ ☐ Alice Friend (2 txs)        │
│ ☐ Coffee Shop (1 tx)          │
│                                │
│ [Search contacts...]           │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-002: Filter by Multiple Contacts

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify multi-select contact filter uses OR logic

**Steps:**
1. Open FilterPanel
2. Expand "Contact" section
3. Select "Exchange Wallet" (already selected from FILT-001)
4. Also select "Alice Friend"
5. Observe filtered results
6. Verify shows transactions from EITHER contact (OR logic)
7. Add third contact: "Coffee Shop"
8. Verify results include all 3 contacts' transactions
9. Verify filter pill shows: "Contacts (3 selected)"
10. Clear one contact by unchecking
11. Verify results update immediately

**Expected Results:**
- ✅ Multi-select checkboxes functional
- ✅ Can select 2+ contacts
- ✅ OR logic: Shows transactions matching ANY selected contact
- ✅ Filter pill shows count: "Contacts (3 selected)"
- ✅ Hover on pill shows full contact list (tooltip)
- ✅ Unchecking contact removes from filter immediately
- ✅ Status text updates: "Showing 10 of 25 transactions"
- ✅ All selected contacts' transactions visible

**OR Logic Test:**
```
Selected: Exchange Wallet, Alice Friend

Expected Results:
✅ Transaction to Exchange Wallet (match 1)
✅ Transaction from Alice Friend (match 2)
✅ Transaction to Coffee Shop (no match - not selected)
❌ Transaction with no contact (no match)

Showing: All transactions involving Exchange OR Alice
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-003: Search Contacts in Filter Dropdown

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify contact search in filter dropdown

**Steps:**
1. Open FilterPanel
2. Expand "Contact" section
3. Observe search box in dropdown
4. Type "exchange" in search box
5. Verify only "Exchange Wallet" contact shown
6. Clear search
7. Verify all contacts shown again
8. Type "alice"
9. Verify only "Alice Friend" shown
10. Select Alice from filtered list
11. Verify filter applied correctly

**Expected Results:**
- ✅ Search box visible in contact dropdown
- ✅ Placeholder text: "Search contacts..."
- ✅ Search filters contact list in real-time
- ✅ Case-insensitive search
- ✅ Partial matching works
- ✅ Clearing search restores full list
- ✅ Can select from filtered search results
- ✅ Search works with contact names and categories

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-004: Clear Contact Filter

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify contact filter can be cleared

**Steps:**
1. Apply contact filter (any contact)
2. Verify filtered results shown
3. Method 1: Click X on filter pill
4. Verify filter cleared, all transactions shown
5. Apply contact filter again
6. Method 2: Uncheck all contacts in FilterPanel
7. Verify filter cleared
8. Method 3: Click "Reset All Filters" button
9. Verify all filters cleared

**Expected Results:**
- ✅ Filter pill X button clears contact filter
- ✅ Unchecking all contacts clears filter
- ✅ "Reset All Filters" clears contact filter
- ✅ All methods restore full transaction list
- ✅ Filter pill disappears after clearing
- ✅ FilterPanel checkboxes reset to unchecked

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-005: Filter by Single Tag

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify filtering transactions by tag

**Steps:**
1. Clear all filters (if any active)
2. Open FilterPanel
3. Expand "Tags" section
4. Observe all existing tags listed with counts
5. Select tag "#payment"
6. Verify only transactions with #payment tag shown
7. Verify filter pill: "Tag: #payment"
8. Note filtered count
9. Clear filter

**Expected Results:**
- ✅ "Tags" filter section present
- ✅ All tags listed with usage counts: "#payment (4 txs)"
- ✅ Tags shown with # prefix
- ✅ Selecting tag filters immediately
- ✅ Only transactions with selected tag shown
- ✅ Filter pill displays: "Tag: #payment"
- ✅ Status text: "Showing 4 of 25 transactions"
- ✅ Transactions without tags not shown

**Visual Tags Dropdown:**
```
Tags ▼
☑ #payment (4 txs)
☐ #exchange (3 txs)
☐ #business (2 txs)
☐ #personal (2 txs)
☐ #test (1 tx)
☐ #important (1 tx)

[Search tags...]
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-006: Filter by Multiple Tags (OR Logic)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify multiple tag filter uses OR logic

**Steps:**
1. Open FilterPanel
2. Expand "Tags" section
3. Select tag "#payment"
4. Also select tag "#business"
5. Verify filtered results show transactions with EITHER tag
6. Verify OR logic:
   - Transaction with #payment only → shown
   - Transaction with #business only → shown
   - Transaction with both #payment AND #business → shown
   - Transaction with neither tag → NOT shown
7. Add third tag: "#test"
8. Verify results include all 3 tags
9. Verify filter pill: "Tags (3 selected)"

**Expected Results:**
- ✅ Multi-select for tags functional
- ✅ OR logic: Shows transactions with ANY selected tag
- ✅ Transaction with multiple matching tags shown once
- ✅ Filter pill: "Tags (3 selected)"
- ✅ Hover shows all selected tags
- ✅ Results update immediately when selecting/unselecting

**OR Logic Test:**
```
Selected: #payment, #business

Transaction A: Tags: #payment, #important
Result: ✅ Shown (has #payment)

Transaction B: Tags: #business, #receipt
Result: ✅ Shown (has #business)

Transaction C: Tags: #payment, #business
Result: ✅ Shown (has both)

Transaction D: Tags: #test, #demo
Result: ❌ Not shown (no matching tags)

Transaction E: No tags
Result: ❌ Not shown (no tags)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-007: Tag Autocomplete and Count Display

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify tag dropdown shows usage counts and autocomplete

**Steps:**
1. Open FilterPanel
2. Expand "Tags" section
3. Observe tag list
4. Verify each tag shows usage count
5. Use search box to filter tags
6. Type "#pay"
7. Verify only "#payment" shown
8. Verify count still displayed
9. Select from filtered results

**Expected Results:**
- ✅ Tags sorted by usage count (most used first)
- ✅ Usage count displayed: "#payment (8 txs)"
- ✅ Search filters tag list
- ✅ Partial matching works
- ✅ Count persists in search results
- ✅ Can select from filtered list

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-008: Clear Tag Filter

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify tag filter can be cleared

**Steps:**
1. Apply tag filter (any tags)
2. Clear using filter pill X button
3. Verify filter cleared
4. Apply tag filter again
5. Clear using "Reset All Filters"
6. Verify cleared

**Expected Results:**
- ✅ Pill X button clears tag filter
- ✅ "Reset All Filters" clears tag filter
- ✅ Unchecking all tags clears filter
- ✅ All methods work correctly

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-009: Filter by Single Category

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify filtering transactions by category

**Steps:**
1. Clear all filters
2. Open FilterPanel
3. Expand "Category" section
4. Observe all categories listed with counts
5. Select category "Gift"
6. Verify only transactions with "Gift" category shown
7. Verify filter pill: "Category: Gift"
8. Note filtered count
9. Clear filter

**Expected Results:**
- ✅ "Category" filter section present
- ✅ All categories listed: "Gift (2 txs)", "Expense (3 txs)", etc.
- ✅ Selecting category filters immediately
- ✅ Only transactions with selected category shown
- ✅ Filter pill: "Category: Gift"
- ✅ Status text shows filtered count
- ✅ Transactions without category not shown

**Visual Categories Dropdown:**
```
Category ▼
☑ Gift (2 txs)
☐ Expense (3 txs)
☐ Withdrawal (2 txs)
☐ Income (1 tx)
☐ Testing (1 tx)

[Search categories...]
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-010: Filter by Multiple Categories (OR Logic)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify multiple category filter uses OR logic

**Steps:**
1. Open FilterPanel
2. Expand "Category" section
3. Select "Gift"
4. Also select "Expense"
5. Verify shows transactions with EITHER category
6. Verify OR logic correctly applied
7. Add third category: "Withdrawal"
8. Verify results include all 3 categories
9. Verify filter pill: "Categories (3 selected)"

**Expected Results:**
- ✅ Multi-select for categories functional
- ✅ OR logic: Shows transactions with ANY selected category
- ✅ Filter pill: "Categories (3 selected)"
- ✅ Results update immediately
- ✅ Transactions without category not shown

**OR Logic Test:**
```
Selected: Gift, Expense

Transaction A: Category: Gift
Result: ✅ Shown

Transaction B: Category: Expense
Result: ✅ Shown

Transaction C: Category: Withdrawal
Result: ❌ Not shown (not selected)

Transaction D: No category
Result: ❌ Not shown (no category)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-011: Category Autocomplete and Count Display

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify category dropdown shows counts and search works

**Steps:**
1. Open FilterPanel
2. Expand "Category" section
3. Verify categories sorted by usage count
4. Use search box
5. Type "exp"
6. Verify "Expense" shown
7. Select from filtered results

**Expected Results:**
- ✅ Categories sorted by usage (most used first)
- ✅ Usage count displayed
- ✅ Search filters category list
- ✅ Partial matching works
- ✅ Can select from search results

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-012: Clear Category Filter

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify category filter can be cleared

**Steps:**
1. Apply category filter
2. Clear using various methods
3. Verify all methods work

**Expected Results:**
- ✅ Pill X clears filter
- ✅ Uncheck all clears filter
- ✅ "Reset All" clears filter

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-013: Combined Contact + Tag Filter (AND Logic)

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify combining contact and tag filters uses AND logic

**Steps:**
1. Clear all filters
2. Apply contact filter: "Exchange Wallet"
3. Observe results (e.g., 3 transactions)
4. ADD tag filter: "#payment"
5. Verify results now show ONLY transactions that match BOTH:
   - Contact = Exchange Wallet AND
   - Tags include #payment
6. Verify filter pills show both:
   - "Contact: Exchange Wallet"
   - "Tag: #payment"
7. Note filtered count (should be smaller than either filter alone)
8. Test that removing one filter expands results

**Expected Results:**
- ✅ Multiple filter types use AND logic
- ✅ Results must match ALL active filters
- ✅ Both filter pills displayed
- ✅ Status text: "Showing 1 of 25 transactions" (intersection)
- ✅ Removing one filter expands results
- ✅ No transactions shown if no intersection exists

**AND Logic Test:**
```
Contact Filter: Exchange Wallet (3 txs total)
Tag Filter: #payment (4 txs total)
Combined: Exchange AND #payment (1 tx)

Transaction A: Contact=Exchange, Tags=#payment
Result: ✅ Shown (matches both)

Transaction B: Contact=Exchange, Tags=#business
Result: ❌ Not shown (no #payment tag)

Transaction C: Contact=Alice, Tags=#payment
Result: ❌ Not shown (wrong contact)

Transaction D: Contact=Exchange, No tags
Result: ❌ Not shown (no tags)
```

**Visual:**
```
Active Filters:
[Contact: Exchange Wallet X] [Tag: #payment X]

Showing 1 of 25 transactions

Result: Only transactions TO/FROM Exchange
        that ALSO have #payment tag
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-014: Combined Contact + Category Filter (AND Logic)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify contact + category filter combination

**Steps:**
1. Clear all filters
2. Apply contact filter: "Coffee Shop"
3. Apply category filter: "Expense"
4. Verify only transactions matching BOTH shown
5. Verify AND logic correctly applied

**Expected Results:**
- ✅ AND logic between contact and category
- ✅ Only transactions with Coffee Shop AND Expense shown
- ✅ Both filter pills displayed
- ✅ Results are intersection of both filters

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-015: Combined Tag + Category Filter (AND Logic)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify tag + category filter combination

**Steps:**
1. Clear all filters
2. Apply tag filter: "#business"
3. Apply category filter: "Expense"
4. Verify only transactions with #business tag AND Expense category shown
5. Verify AND logic

**Expected Results:**
- ✅ AND logic between tag and category
- ✅ Only matching transactions shown
- ✅ Both filter pills displayed

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-016: All Filters Combined (Contact + Tag + Category + Amount)

**Priority:** P1
**Time:** 15 minutes

**Purpose:** Verify all filter types can be combined with AND logic

**Steps:**
1. Clear all filters
2. Apply contact filter: "Exchange Wallet"
3. Apply tag filter: "#important"
4. Apply category filter: "Withdrawal"
5. Apply amount range filter: Min 0.001 BTC
6. Verify only transactions matching ALL filters shown
7. Verify all filter pills displayed
8. Test removing filters one at a time
9. Verify results expand as filters removed

**Expected Results:**
- ✅ All filter types can be combined
- ✅ AND logic across all filter types
- ✅ All filter pills displayed
- ✅ Results match ALL active filters
- ✅ Status text shows filtered count
- ✅ Removing filters expands results progressively
- ✅ "Reset All Filters" clears everything

**Complex Filter Test:**
```
Active Filters:
- Contact: Exchange Wallet
- Tag: #important
- Category: Withdrawal
- Amount: ≥ 0.001 BTC

Result: Show ONLY transactions that match:
  ✅ TO/FROM Exchange Wallet AND
  ✅ Has #important tag AND
  ✅ Has Withdrawal category AND
  ✅ Amount ≥ 0.001 BTC

Expected: Very narrow result set (possibly 0-1 tx)
```

**Visual:**
```
Active Filters:
[Contact: Exchange X] [Tag: #important X]
[Category: Withdrawal X] [Amount: ≥0.001 BTC X]
[Reset All Filters]

Showing 1 of 25 transactions

↑ Sent -0.001 BTC  Exchange Wallet
  Withdrawal  🏷️ #important, #monthly
  Oct 30, 3:00 PM  Confirmed
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-017: Active Filter Pills Display

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify active filter pills display correctly

**Steps:**
1. Apply various filters
2. Observe filter pill display
3. Verify pill formatting:
   - Contact: Shows contact name
   - Tag (single): Shows tag with #
   - Tags (multiple): Shows "Tags (3 selected)"
   - Category: Shows category name
   - Categories (multiple): Shows "Categories (2 selected)"
   - Amount: Shows range (e.g., "0.001 - 0.1 BTC")
4. Hover over multi-select pills
5. Verify tooltip shows all selected items
6. Test pill X buttons
7. Verify each pill removes its specific filter

**Expected Results:**
- ✅ All active filters show as pills
- ✅ Pills displayed in row above transactions
- ✅ Each pill has X button
- ✅ Pill text clear and concise
- ✅ Multi-select pills show count
- ✅ Hover tooltip shows full details
- ✅ Clicking X removes that specific filter
- ✅ Pills update in real-time
- ✅ "Reset All Filters" button visible when filters active

**Visual Pills:**
```
Active Filters:
┌─────────────────────────────────────────────┐
│ [Contact: Exchange Wallet X]                │
│ [Tags (3 selected) X]                       │
│ [Category: Expense X]                       │
│ [Amount: 0.001 - 0.1 BTC X]                 │
│                                             │
│ [Reset All Filters]                         │
└─────────────────────────────────────────────┘

Hover on "Tags (3 selected)":
┌──────────────────────┐
│ #payment             │
│ #business            │
│ #important           │
└──────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-018: Remove Individual Filter Pill

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify individual filter pills can be removed

**Steps:**
1. Apply 4 filters: Contact, Tag, Category, Amount
2. Verify 4 filter pills displayed
3. Click X on Tag pill only
4. Verify:
   - Tag filter removed
   - Tag pill disappears
   - Other 3 pills remain
   - Results expand (more transactions shown)
5. Click X on Contact pill
6. Verify Contact filter removed, other 2 pills remain
7. Continue removing filters one by one
8. Verify each removal expands results correctly

**Expected Results:**
- ✅ Each pill X button functional
- ✅ Clicking X removes only that filter
- ✅ Other filters remain active
- ✅ Results update immediately
- ✅ Correct transactions shown after each removal
- ✅ Last pill removal shows all transactions

**Sequential Removal Test:**
```
Start: 4 filters active → 1 transaction shown

Remove Tag filter:
- 3 filters active → 2 transactions shown

Remove Contact filter:
- 2 filters active → 8 transactions shown

Remove Category filter:
- 1 filter active → 15 transactions shown

Remove Amount filter:
- 0 filters active → 25 transactions shown (all)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-019: Reset All Filters

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify "Reset All Filters" clears all active filters

**Steps:**
1. Apply multiple filters (contact, tag, category)
2. Verify filtered results shown
3. Click "Reset All Filters" button
4. Verify:
   - All filter pills disappear
   - All transactions shown
   - FilterPanel checkboxes reset
   - Status text: "Showing 25 of 25 transactions"
5. Re-apply filters
6. Use FilterPanel close button
7. Verify filters persist
8. Click "Reset All" again
9. Verify clears everything

**Expected Results:**
- ✅ "Reset All Filters" button visible when filters active
- ✅ Button hidden when no filters active
- ✅ Click clears ALL active filters at once
- ✅ All pills disappear
- ✅ Full transaction list restored
- ✅ FilterPanel resets to default state
- ✅ Button functional from any filter combination

**Visual:**
```
Before Reset:
Active Filters:
[Contact: Exchange X] [Tag: #payment X]
[Category: Gift X]
[Reset All Filters]  ← Click this
Showing 1 of 25 transactions

After Reset:
Active Filters:
(empty - no pills)
Showing 25 of 25 transactions
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-020: Filter Persistence Across Navigation

**Priority:** P2
**Time:** 10 minutes

**Purpose:** Verify filters persist when navigating between screens

**Steps:**
1. Navigate to Dashboard
2. Apply filters: Contact + Tag
3. Note filtered results
4. Navigate to Send screen
5. Return to Dashboard
6. Verify filters still active
7. Verify same filtered results shown
8. Navigate to Settings
9. Return to Dashboard
10. Verify filters persist
11. Lock wallet
12. Unlock wallet
13. Verify filter behavior (cleared or persisted - document which)

**Expected Results:**
- ✅ Filters persist when navigating between screens
- ✅ Filter pills remain visible after navigation
- ✅ Same filtered results shown after return
- ✅ FilterPanel state preserved
- ✅ Filters cleared on wallet lock OR persisted (document behavior)
- ✅ Filters cleared on browser refresh OR persisted (document behavior)

**Persistence Test:**
```
1. Dashboard: Apply Contact=Exchange + Tag=#payment
   → Showing 1 transaction

2. Navigate: Dashboard → Send → Dashboard
   → Filters still active, same 1 transaction shown ✅

3. Navigate: Dashboard → Settings → Dashboard
   → Filters still active ✅

4. Lock/Unlock wallet
   → Filters cleared OR persisted (implementation-dependent)

5. Browser refresh (F5)
   → Filters cleared OR persisted (implementation-dependent)
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-021: Filters with Pagination

**Priority:** P1
**Time:** 10 minutes

**Prerequisites:** 20+ transactions for pagination testing

**Purpose:** Verify filters work correctly with transaction pagination

**Steps:**
1. Ensure you have 20+ transactions
2. Set items per page to 10
3. Navigate to page 2 of transactions
4. Apply contact filter
5. Verify:
   - Pagination resets to page 1
   - Filtered results paginated correctly
   - Page controls adjust to filtered count
6. Navigate to page 2 of filtered results
7. Clear filter
8. Verify:
   - Returns to page 1 of full list
   - Pagination controls show full count again

**Expected Results:**
- ✅ Applying filter resets to page 1
- ✅ Filtered results paginated correctly
- ✅ Pagination controls reflect filtered count
- ✅ Status: "Showing 1-10 of 15 transactions" (filtered)
- ✅ Can navigate pages within filtered results
- ✅ Clearing filter resets to page 1 of full list
- ✅ Pagination updates when filters change

**Pagination Test:**
```
Initial State:
- 25 total transactions
- Page 2 (showing 11-20)
- No filters

Apply Contact Filter:
- 5 matching transactions (filtered)
- Reset to Page 1 (showing 1-5)
- Pagination: "Page 1 of 1" (only 5 results)

Clear Filter:
- 25 total transactions (all)
- Reset to Page 1 (showing 1-10)
- Pagination: "Page 1 of 3"
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Cases & Error Scenarios

### FILT-EDGE-001: No Results Found

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify empty state when no transactions match filters

**Steps:**
1. Apply filter combination that matches no transactions
   - Example: Contact=Exchange + Category=Gift (if no such tx exists)
2. Observe empty state
3. Verify helpful message displayed
4. Verify filter pills still shown
5. Clear filters
6. Verify transactions reappear

**Expected Results:**
- ✅ Empty state displayed
- ✅ Message: "No transactions match your filters"
- ✅ Suggestion: "Try removing some filters"
- ✅ Filter pills still visible (user can adjust)
- ✅ "Reset All Filters" button available
- ✅ No console errors
- ✅ UI doesn't break

**Visual Empty State:**
```
┌────────────────────────────────┐
│ Active Filters:                │
│ [Contact: Exchange X]          │
│ [Category: Gift X]             │
│ [Reset All Filters]            │
├────────────────────────────────┤
│ Showing 0 of 25 transactions   │
├────────────────────────────────┤
│                                │
│         🔍                     │
│   No transactions match        │
│   your current filters         │
│                                │
│   Try removing some filters    │
│   or use "Reset All Filters"   │
│                                │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-EDGE-002: All Transactions Match Filter

**Priority:** P2
**Time:** 3 minutes

**Purpose:** Verify behavior when filter matches all transactions

**Steps:**
1. Apply very broad filter (e.g., Amount > 0)
2. Verify all transactions shown
3. Verify status: "Showing 25 of 25 transactions"
4. Verify filter pill still displayed
5. Verify no false positives

**Expected Results:**
- ✅ All transactions shown
- ✅ Status text correct
- ✅ Filter pill visible (filter is active)
- ✅ Matches are legitimate (not showing extra)
- ✅ Can clear filter normally

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### FILT-EDGE-003: Empty Filter Dropdowns

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify behavior with new wallet (no tags/categories yet)

**Steps:**
1. Create new wallet with transactions but no metadata
2. Open FilterPanel
3. Expand "Tags" section
4. Verify empty state message
5. Expand "Category" section
6. Verify empty state message

**Expected Results:**
- ✅ Tags section shows: "No tags yet. Add tags to transactions to filter by them."
- ✅ Category section shows: "No categories yet."
- ✅ Contact filter still functional (if contacts exist)
- ✅ Amount filter still functional
- ✅ No UI errors or broken states

**Visual Empty Dropdowns:**
```
Tags ▼
┌────────────────────────────────┐
│ No tags yet                    │
│                                │
│ Add tags to transactions to    │
│ enable tag filtering           │
└────────────────────────────────┘

Category ▼
┌────────────────────────────────┐
│ No categories yet              │
│                                │
│ Add categories to transactions │
│ to enable category filtering   │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Regression Testing

**Verify existing filter features still work:**

### Legacy Filter Features
- [ ] Amount range filter (min/max)
- [ ] Sender address filter (text input)
- [ ] Transaction type filter (sent/received)
- [ ] Date range filter (if implemented)
- [ ] Filters work with transaction sorting
- [ ] Filters work with search functionality

**If any regression fails:** Mark as regression bug, P1 priority

---

## Test Summary

**Total Tests:** 18 core + 3 edge cases = 21 tests
**P1 Tests:** 16 (FILT-001 through FILT-019, FILT-021)
**P2 Tests:** 5 (FILT-007, FILT-011, FILT-020, all edge cases)

**Critical Tests:**
- FILT-001: Filter by single contact
- FILT-002: Filter by multiple contacts (OR logic)
- FILT-013: Combined contact + tag (AND logic)
- FILT-016: All filters combined
- FILT-019: Reset all filters
- FILT-021: Filters with pagination

**Filter Logic Summary:**
- **Within filter type:** OR logic (tags: #payment OR #business)
- **Across filter types:** AND logic (Contact=Exchange AND Tag=#payment)

**If any P1 test fails:** Report as high-priority bug, may affect release

---

## Common Issues & Troubleshooting

### Issue: Filters not working
**Cause:** Filter logic bug or state management issue
**Solution:** Check console for errors, verify filter state
**Report As:** P0 bug (critical functionality)

### Issue: Wrong AND/OR logic
**Cause:** Filter combination logic incorrect
**Solution:** Review filter implementation
**Report As:** P1 bug

### Issue: Filter pills not updating
**Cause:** UI state not syncing with filter state
**Solution:** Check React state updates
**Report As:** P1 bug

### Issue: Filters cleared unexpectedly
**Cause:** State reset bug or navigation issue
**Solution:** Verify filter persistence logic
**Report As:** P2 bug

### Issue: Empty state not showing
**Cause:** Empty state component not rendering
**Solution:** Check conditional rendering logic
**Report As:** P2 bug

---

## Known Issues

(None at this time - document any known issues discovered during testing)

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
