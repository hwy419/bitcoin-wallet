# Feature Test Guide: Contact Management

**Feature Area:** Contact Management & Custom Tags
**Test Cases:** 16 tests (13 core + 3 edge cases)
**Time to Execute:** 2 hours
**Priority:** P1 (High - User Experience)

---

## Overview

This feature validates contact management functionality including custom tags (key-value pairs), ContactDetailPane for comprehensive contact viewing/editing, and "Add to Contacts" functionality from transactions. Contacts help users organize their Bitcoin addresses and track relationships.

**Why this matters:** Contact management makes the wallet user-friendly by allowing users to label addresses with meaningful names and metadata, making it easier to send payments and track transaction history.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Chrome DevTools open (F12) for all tests
- [ ] At least 3 contacts already created (for testing)
- [ ] Some test transactions in history (for "Add to Contacts" testing)

---

## Test Cases

### CONT-001: Add Contact with Custom Tags

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify adding a new contact with custom key-value tags

**Steps:**
1. Navigate to Contacts screen (sidebar)
2. Click "Add Contact" button
3. Observe contact form modal opens
4. Fill in basic details:
   - **Name:** Test Exchange Wallet
   - **Address:** tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx (valid testnet address)
   - **Email:** exchange@testnet.local (optional)
   - **Category:** Exchange
   - **Notes:** Primary exchange wallet for testing
5. Locate "Custom Tags" section
6. Click "+ Add Tag" button
7. Enter first tag:
   - **Key:** service
   - **Value:** coinbase
8. Click "Save Tag" or press Enter
9. Observe tag appears in tag list
10. Add second tag:
    - **Key:** type
    - **Value:** exchange
11. Add third tag:
    - **Key:** verified
    - **Value:** yes
12. Verify all 3 tags displayed in list
13. Click "Save Contact" button
14. Observe success message
15. Verify contact appears in contacts list
16. Click contact card to view details
17. Verify all tags saved correctly

**Expected Results:**
- ✅ "Add Contact" button functional
- ✅ Contact form modal opens with all fields
- ✅ "Custom Tags" section visible
- ✅ "+ Add Tag" button functional
- ✅ Tag input shows Key and Value fields
- ✅ Can enter tag key (max 30 characters)
- ✅ Can enter tag value (max 100 characters)
- ✅ "Save Tag" adds tag to list
- ✅ Tag displayed in format: `key: value`
- ✅ Can add multiple tags (up to 10)
- ✅ Each tag has "X" remove button
- ✅ "Save Contact" persists all data including tags
- ✅ Success message: "Contact added successfully"
- ✅ Contact card shows name, category, address
- ✅ Tags visible in contact detail view
- ✅ Tags encrypted in storage (check with DevTools)

**Visual Example:**
```
Add Contact Modal
┌────────────────────────────────────┐
│ Add Contact                    [X] │
├────────────────────────────────────┤
│ Name: *                            │
│ [Test Exchange Wallet_________]    │
│                                    │
│ Address: *                         │
│ [tb1qw508d6qejxtdg4y5r3...____]   │
│                                    │
│ Email:                             │
│ [exchange@testnet.local_______]    │
│                                    │
│ Category:                          │
│ [Exchange ▼]                       │
│                                    │
│ Custom Tags:           [+ Add Tag] │
│ • service: coinbase         [X]    │
│ • type: exchange            [X]    │
│ • verified: yes             [X]    │
│                                    │
│ Notes:                             │
│ ┌────────────────────────────────┐ │
│ │ Primary exchange wallet for... │ │
│ └────────────────────────────────┘ │
│                                    │
│      [Cancel]    [Save Contact]    │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-002: Edit Contact Tags

**Priority:** P1
**Time:** 8 minutes

**Prerequisites:** At least 1 contact with existing tags

**Purpose:** Verify contact tags can be edited (add, modify, remove)

**Steps:**
1. Navigate to Contacts screen
2. Click on contact "Test Exchange Wallet" (from CONT-001)
3. Observe ContactDetailPane opens on right side
4. Click "Edit" button in detail pane
5. Observe form fields become editable
6. Locate existing tags section
7. Remove one tag by clicking "X" button:
   - Remove tag: `verified: yes`
8. Edit existing tag value:
   - Change `type: exchange` → `type: custodial`
9. Add new tag:
   - Key: `region`
   - Value: `usa`
10. Click "Save" button
11. Observe success feedback
12. Verify changes persisted:
    - `verified: yes` tag removed
    - `type` tag value changed to `custodial`
    - `region: usa` tag added
13. Close detail pane and reopen
14. Verify changes still present

**Expected Results:**
- ✅ ContactDetailPane displays contact details
- ✅ "Edit" button functional
- ✅ Edit mode enables all form fields
- ✅ Existing tags displayed with values
- ✅ Can remove tag by clicking X button
- ✅ Can edit tag value (double-click or edit mode)
- ✅ Can add new tags in edit mode
- ✅ "Save" button persists all changes
- ✅ Success message: "Contact updated successfully"
- ✅ Changes reflected immediately in UI
- ✅ Changes persist after closing/reopening
- ✅ "Cancel" button discards changes (test separately)

**Visual Edit Mode:**
```
ContactDetailPane (Edit Mode)
┌────────────────────────────────────┐
│ Test Exchange Wallet     [Cancel]  │
│                          [Save]    │
├────────────────────────────────────┤
│ Category: [Exchange ▼]             │
│                                    │
│ Address:                           │
│ tb1qw508d6qejxtdg4y5r3...         │
│                                    │
│ Custom Tags:           [+ Add Tag] │
│ • service: coinbase         [X]    │
│ • type: [custodial_____]    [X]    │
│ • region: usa               [X]    │
│                                    │
│ Email: exchange@testnet.local      │
│                                    │
│ Notes:                             │
│ ┌────────────────────────────────┐ │
│ │ Primary exchange wallet...     │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-003: Delete Specific Tag

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** Contact with multiple tags

**Purpose:** Verify individual tags can be deleted without affecting other tags

**Steps:**
1. Open contact with 3+ tags
2. Click "Edit" button
3. Note all existing tags
4. Click "X" button on middle tag only
5. Do NOT remove other tags
6. Click "Save"
7. Verify only the selected tag removed
8. Verify other tags remain unchanged

**Expected Results:**
- ✅ X button on each tag
- ✅ Clicking X removes only that specific tag
- ✅ Other tags unaffected
- ✅ Save persists the deletion
- ✅ No console errors
- ✅ UI updates immediately

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-004: Duplicate Key Prevention

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify duplicate tag keys are prevented

**Steps:**
1. Open contact in edit mode
2. Add tag: `location: downtown`
3. Save contact
4. Edit contact again
5. Try to add another tag with same key: `location: uptown`
6. Observe validation error
7. Verify cannot save with duplicate key

**Expected Results:**
- ✅ Validation detects duplicate key
- ✅ Error message: "Tag key 'location' already exists"
- ✅ Save button disabled or shows error
- ✅ Must remove first tag or use different key
- ✅ User-friendly error presentation

**Visual Error:**
```
Custom Tags:
• location: downtown      [X]
[location_____] [uptown_____] [Add]
❌ Tag key "location" already exists
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-005: Tag Validation (Max Lengths)

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify tag key/value length limits enforced

**Test 1: Tag Key Too Long**
1. Open contact in edit mode
2. Try to add tag with 31+ character key
3. Observe validation error

**Expected:**
- ✅ Key field enforces 30 character max
- ✅ Error: "Tag key must be 30 characters or less"
- ✅ Character counter shows: "X / 30"
- ✅ Cannot add tag exceeding limit

**Test 2: Tag Value Too Long**
1. Try to add tag with 101+ character value
2. Observe validation error

**Expected:**
- ✅ Value field enforces 100 character max
- ✅ Error: "Tag value must be 100 characters or less"
- ✅ Character counter shows: "X / 100"
- ✅ Cannot add tag exceeding limit

**Test 3: Empty Key or Value**
1. Try to add tag with empty key
2. Try to add tag with empty value

**Expected:**
- ✅ Error: "Tag key is required"
- ✅ Error: "Tag value is required"
- ✅ Cannot add tag with empty fields

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-006: Search Contacts by Tag Key

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** Multiple contacts with various tags

**Purpose:** Verify contact search works with tag keys

**Steps:**
1. Create test data:
   - Contact A: Tags include `location: downtown`
   - Contact B: Tags include `location: uptown`
   - Contact C: No `location` tag
2. Navigate to Contacts screen
3. Use search box at top
4. Type: "location"
5. Observe search results

**Expected Results:**
- ✅ Search finds contacts with tag key "location"
- ✅ Contact A and B shown
- ✅ Contact C not shown
- ✅ Search is case-insensitive
- ✅ Partial matching works ("loca" matches "location")
- ✅ Clear search shows all contacts again

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-007: Search Contacts by Tag Value

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify contact search works with tag values

**Steps:**
1. Use contacts from CONT-006
2. In search box, type: "downtown"
3. Observe results show only Contact A
4. Clear search
5. Type: "uptown"
6. Observe results show only Contact B

**Expected Results:**
- ✅ Search finds contacts with tag value "downtown"
- ✅ Only Contact A shown
- ✅ Search by "uptown" shows only Contact B
- ✅ Case-insensitive matching
- ✅ Partial value matching works

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-008: Open ContactDetailPane from ContactsScreen

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify clicking contact card opens ContactDetailPane

**Steps:**
1. Navigate to Contacts screen
2. Observe list of contact cards
3. Click on any contact card
4. Observe ContactDetailPane opens on right side
5. Verify pane shows:
   - Contact name as header
   - Category badge
   - Full address
   - Email (if provided)
   - All custom tags with key-value pairs
   - Notes
   - "Edit" button
   - "Delete Contact" button
   - "Close" button (X)
6. Click "Close" button
7. Verify pane closes, returns to contacts list

**Expected Results:**
- ✅ Contact card clickable
- ✅ ContactDetailPane slides in from right
- ✅ Pane width appropriate (~400px)
- ✅ All contact details displayed
- ✅ Tags formatted as `key: value`
- ✅ Action buttons functional
- ✅ Close button dismisses pane
- ✅ Animation smooth
- ✅ No layout shift or flickering

**Visual Layout:**
```
Contacts Screen with Detail Pane
┌─────────────────────┬────────────────────┐
│ Contacts            │ Test Exchange      │
│ [Search_________]   │ Exchange       [X] │
│                     ├────────────────────┤
│ ┌─────────────────┐ │ Category: Exchange │
│ │Test Exchange >  │ │                    │
│ │Exchange         │ │ Address:           │
│ │tb1qw508...      │ │ tb1qw508d6qejxt... │
│ └─────────────────┘ │                    │
│                     │ Tags:              │
│ ┌─────────────────┐ │ • service: coinbase│
│ │Alice Friend   > │ │ • type: custodial  │
│ │Personal         │ │ • region: usa      │
│ │tb1q3f2...       │ │                    │
│ └─────────────────┘ │ Email:             │
│                     │ exchange@testnet...│
│ ┌─────────────────┐ │                    │
│ │Coffee Shop    > │ │ Notes:             │
│ │Business         │ │ Primary exchange...│
│ │tb1qc7a...       │ │                    │
│ └─────────────────┘ │ [Edit]  [Delete]   │
└─────────────────────┴────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-009: Open ContactDetailPane from Dashboard

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify contact details can be opened from Dashboard transaction list

**Steps:**
1. Navigate to Dashboard
2. Locate transaction history section
3. Find transaction associated with a contact
4. Observe contact name displayed (not raw address)
5. Click on contact name link
6. Observe ContactDetailPane opens
7. Verify shows correct contact details
8. Verify can edit from this pane
9. Close pane

**Expected Results:**
- ✅ Contact names shown in transaction rows
- ✅ Contact name is clickable/interactive
- ✅ Click opens ContactDetailPane
- ✅ Correct contact loaded
- ✅ All details present
- ✅ Edit functionality works from this pane
- ✅ Closing pane returns to Dashboard

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-010: Inline Edit in ContactDetailPane

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify all contact fields can be edited inline from detail pane

**Steps:**
1. Open ContactDetailPane for any contact
2. Click "Edit" button
3. Verify all fields become editable:
   - Name
   - Category
   - Email
   - Custom tags
   - Notes
4. Make changes to each field:
   - Change name: Add "(Updated)" to name
   - Change category
   - Edit email
   - Add new tag
   - Modify notes
5. Click "Save"
6. Verify all changes persisted
7. Test "Cancel" functionality:
8. Click "Edit" again
9. Make changes but click "Cancel"
10. Verify changes discarded, original values restored

**Expected Results:**
- ✅ "Edit" button enables all fields
- ✅ All fields editable in edit mode
- ✅ Save button functional
- ✅ All changes persist after save
- ✅ Success message shown
- ✅ Cancel button discards changes
- ✅ Original values restored after cancel
- ✅ Form validation works in edit mode
- ✅ Cannot save invalid data

**Visual Comparison:**
```
View Mode:
┌────────────────────────────────┐
│ Test Exchange Wallet      [X]  │
│ Exchange              [Edit]   │
├────────────────────────────────┤
│ Tags: service: coinbase        │
│ [Non-editable display]         │
└────────────────────────────────┘

Edit Mode:
┌────────────────────────────────┐
│ [Test Exchange (Updated)___]   │
│ [Exchange ▼]    [Cancel][Save] │
├────────────────────────────────┤
│ Tags: • service: coinbase  [X] │
│       [+ Add Tag]              │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-011: Add/Edit/Remove Tags in Detail Pane

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify comprehensive tag management in ContactDetailPane

**Steps:**
1. Open ContactDetailPane with 2 existing tags
2. Click "Edit"
3. Add new tag: `status: active`
4. Edit existing tag value
5. Remove one existing tag
6. Save changes
7. Verify all tag operations successful
8. Reopen pane
9. Verify changes persisted

**Expected Results:**
- ✅ Can add tags in detail pane
- ✅ Can edit tag values
- ✅ Can remove tags
- ✅ All operations in single edit session
- ✅ Save persists all changes
- ✅ UI updates correctly
- ✅ Tag list dynamically updates

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-012: Delete Contact from Detail Pane

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify contact deletion from ContactDetailPane

**Steps:**
1. Create temporary test contact
2. Open ContactDetailPane for test contact
3. Click "Delete Contact" button
4. Observe confirmation dialog
5. Read warning message
6. Click "Cancel" on confirmation
7. Verify contact NOT deleted
8. Click "Delete Contact" again
9. Confirm deletion
10. Observe success message
11. Verify ContactDetailPane closes
12. Verify contact removed from contacts list
13. Verify transactions associated with deleted contact still visible

**Expected Results:**
- ✅ "Delete Contact" button visible in detail pane
- ✅ Click shows confirmation dialog
- ✅ Warning: "Are you sure? This cannot be undone."
- ✅ Cancel button preserves contact
- ✅ Confirm button deletes contact
- ✅ Success message: "Contact deleted successfully"
- ✅ Detail pane closes automatically
- ✅ Contact removed from list
- ✅ Transactions still accessible (orphaned gracefully)
- ✅ No console errors

**Confirmation Dialog:**
```
┌──────────────────────────────────┐
│ Delete Contact?                  │
├──────────────────────────────────┤
│ Are you sure you want to delete  │
│ "Test Exchange Wallet"?          │
│                                  │
│ This will remove the contact but │
│ transactions will remain visible.│
│                                  │
│ This action cannot be undone.    │
│                                  │
│     [Cancel]  [Delete Contact]   │
└──────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-013: Add to Contacts from SendScreen

**Priority:** P1
**Time:** 8 minutes

**Purpose:** Verify "Add to Contacts" functionality from Send screen

**Steps:**
1. Navigate to Send screen
2. Enter unknown Bitcoin address (not in contacts)
3. Enter valid testnet address: tb1qtest123...
4. Observe "Add to Contacts" button appears next to address field
5. Click "Add to Contacts" button
6. Observe contact form modal opens
7. Verify address field pre-filled with entered address
8. Add contact details:
   - Name: Test Recipient
   - Category: Personal
   - Tags: `type: test`, `source: send_screen`
9. Click "Save"
10. Observe success message
11. Verify contact added to contacts list
12. Return to Send screen
13. Enter same address again
14. Verify "Add to Contacts" button no longer shows (address now known)
15. Verify contact name displayed instead

**Expected Results:**
- ✅ "Add to Contacts" button appears for unknown addresses
- ✅ Button only shows AFTER valid address entered
- ✅ Click opens contact form modal
- ✅ Address field pre-filled and read-only
- ✅ All other fields editable
- ✅ Suggested category: "Recipient" (optional)
- ✅ Can add custom tags
- ✅ Save creates contact successfully
- ✅ Success message: "Contact added successfully"
- ✅ Button disappears after adding (address now known)
- ✅ Contact name shows in Send screen for future use
- ✅ Can proceed to send transaction normally

**Visual Flow:**
```
Before Adding Contact:
┌────────────────────────────────┐
│ Send Bitcoin                   │
├────────────────────────────────┤
│ To:                            │
│ [tb1qtest123..._________]      │
│              [Add to Contacts] │
└────────────────────────────────┘

After Adding Contact:
┌────────────────────────────────┐
│ Send Bitcoin                   │
├────────────────────────────────┤
│ To:                            │
│ Test Recipient                 │
│ [tb1qtest123..._________]      │
│ (no button - address known)    │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-014: Add to Contacts from TransactionDetailPane

**Priority:** P1
**Time:** 10 minutes

**Purpose:** Verify "Add to Contacts" from transaction inputs/outputs

**Steps:**
1. Navigate to Dashboard → Transaction History
2. Click on any transaction
3. Observe TransactionDetailPane opens
4. Locate "Inputs" section (sender addresses)
5. Find unknown address (not in contacts)
6. Observe "Add to Contacts" button next to address
7. Click "Add to Contacts"
8. Verify contact form opens with address pre-filled
9. Add contact details:
   - Name: Transaction Sender
   - Category: Sender
   - Tags: `transaction: received`, `date: 2025-11-01`
   - Notes: Added from transaction xyz...
10. Save contact
11. Verify success message
12. Close and reopen transaction detail pane
13. Verify "Add to Contacts" button no longer shows
14. Verify contact name displayed instead of raw address

**Expected Results:**
- ✅ Transaction detail pane shows input/output addresses
- ✅ "Add to Contacts" button visible for unknown addresses
- ✅ Button NOT visible for addresses already in contacts
- ✅ Click opens contact form with address pre-filled
- ✅ Can add all contact details including tags
- ✅ Save creates contact successfully
- ✅ Button disappears after adding
- ✅ Contact name shown in future transaction views
- ✅ Works for both sent and received transactions

**Visual Before/After:**
```
Before Adding:
┌────────────────────────────────┐
│ Transaction Detail             │
│ Inputs:                        │
│ tb1qsender123...               │
│         [Add to Contacts]      │
└────────────────────────────────┘

After Adding:
┌────────────────────────────────┐
│ Transaction Detail             │
│ Inputs:                        │
│ Transaction Sender             │
│ (tb1qsender123...)             │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-015: CSV Export with Tags

**Priority:** P2
**Time:** 10 minutes

**Purpose:** Verify CSV export includes custom tags

**Steps:**
1. Navigate to Contacts screen
2. Ensure you have 3+ contacts with custom tags
3. Click "Export Contacts" or similar export button
4. Select CSV format
5. Click "Export"
6. Observe CSV file downloads
7. Open CSV file in text editor or spreadsheet
8. Verify CSV structure includes:
   - Name column
   - Address column
   - Email column
   - Category column
   - Tags column (JSON or key:value format)
   - Notes column
9. Verify all custom tags exported for each contact
10. Verify tags format is parseable

**Expected Results:**
- ✅ Export button functional
- ✅ CSV file generated
- ✅ File named: `bitcoin-wallet-contacts-[date].csv`
- ✅ CSV includes header row
- ✅ All contacts exported
- ✅ Custom tags included in export
- ✅ Tags format: `key1:value1; key2:value2` OR JSON
- ✅ Special characters escaped properly
- ✅ UTF-8 encoding for international characters

**Sample CSV:**
```csv
Name,Address,Email,Category,Tags,Notes
Test Exchange,tb1qw508...,exchange@test.local,Exchange,"service:coinbase; type:custodial; region:usa",Primary exchange
Alice Friend,tb1q3f2...,alice@test.local,Personal,"name:alice; relationship:friend; location:local",Personal friend
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-016: CSV Import with Tags

**Priority:** P2
**Time:** 15 minutes

**Purpose:** Verify CSV import correctly parses and imports custom tags

**Steps:**
1. Create test CSV file with custom tags:
   ```csv
   Name,Address,Email,Category,Tags,Notes
   Import Test 1,tb1qimport1...,import1@test.local,Business,"company:acme; dept:sales","Test import"
   Import Test 2,tb1qimport2...,import2@test.local,Personal,"friend:yes; hobby:bitcoin","Another test"
   ```
2. Navigate to Contacts screen
3. Click "Import Contacts" button
4. Select CSV file
5. Click "Import"
6. Observe import progress/summary
7. Verify success message: "2 contacts imported successfully"
8. Check contacts list for new contacts
9. Open "Import Test 1" contact
10. Verify custom tags imported:
    - `company: acme`
    - `dept: sales`
11. Open "Import Test 2" contact
12. Verify tags: `friend: yes`, `hobby: bitcoin`

**Expected Results:**
- ✅ Import button functional
- ✅ CSV file picker opens
- ✅ Import processes CSV file
- ✅ Progress indicator shown
- ✅ Custom tags parsed correctly
- ✅ Tag format: `key:value` OR JSON parsed
- ✅ Tags associated with correct contacts
- ✅ All tag data preserved
- ✅ Success message shows import count
- ✅ Imported contacts visible in list
- ✅ Can open and verify tag data

**Import Summary:**
```
┌────────────────────────────────┐
│ Import Complete                │
├────────────────────────────────┤
│ ✅ 2 contacts imported         │
│ ✅ 4 custom tags parsed        │
│ ⚠️  0 errors                   │
│                                │
│ [View Imported Contacts]       │
└────────────────────────────────┘
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Edge Cases & Error Scenarios

### CONT-EDGE-001: Tag Key Exceeds 30 Characters

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify validation prevents tag keys over 30 characters

**Steps:**
1. Open contact in edit mode
2. Try to add tag with 31-character key:
   - Key: `this_is_a_very_long_tag_key_that_exceeds_limit`
3. Observe validation error
4. Verify cannot save

**Expected Results:**
- ✅ Character counter shows: "31 / 30"
- ✅ Counter turns red
- ✅ Error message: "Tag key must be 30 characters or less"
- ✅ Save button disabled
- ✅ Must shorten key to proceed

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-EDGE-002: Tag Value Exceeds 100 Characters

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify validation prevents tag values over 100 characters

**Steps:**
1. Open contact in edit mode
2. Try to add tag with 101+ character value
3. Observe validation error

**Expected Results:**
- ✅ Character counter: "101 / 100"
- ✅ Error: "Tag value must be 100 characters or less"
- ✅ Save disabled

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

### CONT-EDGE-003: Maximum Tags Limit (10 Tags)

**Priority:** P2
**Time:** 10 minutes

**Purpose:** Verify 10 tag maximum enforced

**Steps:**
1. Open contact in edit mode
2. Add 10 tags successfully
3. Try to add 11th tag
4. Observe validation prevents adding more

**Expected Results:**
- ✅ Can add up to 10 tags
- ✅ "+ Add Tag" button disabled after 10 tags
- ✅ Error message: "Maximum 10 tags allowed per contact"
- ✅ Must remove tag before adding new one
- ✅ UI clearly shows tag count: "Tags (10/10)"

**Visual:**
```
Custom Tags: (10/10)        [+ Add Tag] ⚠️
• tag1: value1      [X]
• tag2: value2      [X]
... (8 more tags)
❌ Maximum 10 tags reached
```

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

## Regression Testing

**Verify these existing contact features still work:**

### Legacy Contact Features
- [ ] Create contact with name and address only (no tags)
- [ ] Edit contact name
- [ ] Edit contact address
- [ ] Contact categories work (Exchange, Personal, Business, etc.)
- [ ] Contact search by name works
- [ ] Contact list sorting works
- [ ] xpub contacts functional (if supported)
- [ ] Contact privacy tracking (optional feature)
- [ ] Delete contact without tags
- [ ] Import/export contacts without tags

**If any regression fails:** Mark as regression bug, P1 priority

---

## Test Summary

**Total Tests:** 13 core + 3 edge cases = 16 tests
**P1 Tests:** 14 (CONT-001 through CONT-014)
**P2 Tests:** 2 (CONT-015, CONT-016, all edge cases)

**Critical Tests:**
- CONT-001: Add contact with tags
- CONT-002: Edit contact tags
- CONT-008: Open ContactDetailPane
- CONT-013: Add to Contacts from Send screen
- CONT-014: Add to Contacts from transaction

**New Features Tested:**
- Custom tags (key-value pairs) with encryption
- Tag validation (length limits, duplicates, max count)
- ContactDetailPane with inline editing
- "Add to Contacts" from Send and Transaction screens
- Tag search functionality
- CSV import/export with tags

**If any P1 test fails:** Report as high-priority bug, may block release depending on severity

---

## Common Issues & Troubleshooting

### Issue: Tags not saving
**Cause:** Validation error or encryption failure
**Solution:** Check console for errors, verify tag format
**Report As:** P1 bug

### Issue: Duplicate tags allowed
**Cause:** Validation not working
**Solution:** Verify key uniqueness check
**Report As:** P1 bug

### Issue: Tags not searchable
**Cause:** Search index not including tags
**Solution:** Verify search implementation
**Report As:** P1 bug

### Issue: CSV import fails with tags
**Cause:** Incorrect tag format parsing
**Solution:** Verify CSV parser handles tag format
**Report As:** P2 bug

### Issue: ContactDetailPane not opening
**Cause:** UI state bug or routing issue
**Solution:** Check console errors, verify click handlers
**Report As:** P1 bug

---

## Known Issues

(None at this time - document any known issues discovered during testing)

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
