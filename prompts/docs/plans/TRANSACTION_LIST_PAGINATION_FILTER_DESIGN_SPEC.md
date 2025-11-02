# Transaction List Pagination & Filtering - Design Specification

**Created**: October 30, 2025
**Owner**: UI/UX Designer
**Status**: Specification Complete - Ready for Implementation
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Design Goals](#design-goals)
3. [Layout Reorganization](#layout-reorganization)
4. [Component Hierarchy](#component-hierarchy)
5. [Pagination Interface](#pagination-interface)
6. [Search & Filter UI](#search--filter-ui)
7. [Sort Controls](#sort-controls)
8. [Component States](#component-states)
9. [Visual Design Specifications](#visual-design-specifications)
10. [Interaction Patterns](#interaction-patterns)
11. [User Flows](#user-flows)
12. [Responsive Behavior](#responsive-behavior)
13. [Accessibility](#accessibility)
14. [Performance Considerations](#performance-considerations)
15. [Implementation Notes](#implementation-notes)

---

## Overview

This specification defines the design for an enhanced transaction list with pagination, filtering, and search capabilities. The transaction list becomes the primary content on the Dashboard, moving above the address list to emphasize transaction history as the core user activity.

**Key Features:**
- **Pagination**: Handle large transaction histories efficiently (10, 35, 50, 100, 500 items per page)
- **Search**: Find transactions by sender address or transaction hash
- **Amount Filtering**: Filter by amount range (greater than / less than)
- **Sort Controls**: Toggle chronological order (newest first / oldest first)
- **Filter Management**: Clear active filters, visual filter chips

**Design Constraints:**
- Tab-based architecture (sidebar 240px + main content)
- Content max-width: 1280px (max-w-7xl)
- Dark mode design system
- WCAG AA accessibility compliance
- Mobile-friendly touch targets (44x44px minimum)

---

## Design Goals

### Primary Goals

1. **Efficiency**: Users can quickly find specific transactions in large histories
2. **Clarity**: Filter and pagination controls are intuitive and self-explanatory
3. **Performance**: Pagination reduces rendering load for wallets with hundreds of transactions
4. **Discoverability**: Filters are visible but don't clutter the interface
5. **Accessibility**: All controls are keyboard-navigable and screen-reader friendly

### Success Metrics

- Users can find a specific transaction in <10 seconds (avg)
- Pagination controls have >90% discoverability (user testing)
- Page load time remains <500ms with 500 transactions
- Zero accessibility violations (axe DevTools)

---

## Layout Reorganization

### Current Layout (v0.11.0)

```
Dashboard (Tab Content)
├─ Balance Card (top)
├─ Quick Actions (Send/Receive buttons)
├─ Address List Section
│  ├─ Section Header
│  ├─ Current Address Display
│  ├─ Address History (last 10)
│  └─ Generate New Address button
├─ Transaction History Section
│  ├─ Section Header
│  ├─ Contact Filter (if contacts exist)
│  └─ Transaction List (all transactions)
```

### New Layout (v0.12.0)

```
Dashboard (Tab Content)
├─ Balance Card (top)
├─ Quick Actions (Send/Receive buttons)
├─ Transaction History Section (PRIMARY - moved up)
│  ├─ Section Header with Count
│  ├─ Filters & Search Bar (collapsible)
│  ├─ Active Filter Chips
│  ├─ Pagination Controls (top)
│  ├─ Transaction List (paginated)
│  └─ Pagination Controls (bottom)
├─ Address List Section (secondary - moved down)
│  ├─ Section Header (collapsible)
│  ├─ Current Address Display
│  ├─ Address History (collapsed by default)
│  └─ Generate New Address button
```

**Visual Hierarchy Changes:**
- Transaction History moves **above** Address List
- Address List becomes **collapsible** (expanded by default on first visit)
- Transaction list gets **more vertical space** (60% of viewport vs 40% previously)
- Balance card remains at top (unchanged)

**Rationale:**
- Transactions are the primary activity users check (viewing history)
- Addresses are secondary (mostly used when receiving)
- More vertical space allows better pagination UX (more items visible)

---

## Component Hierarchy

### Component Tree

```tsx
<Dashboard>
  <BalanceCard />
  <QuickActions />

  <TransactionHistorySection>
    <SectionHeader count={totalTransactions} />

    <TransactionFilters>
      <FilterToggleButton />  {/* Expand/collapse filters */}

      <FilterPanel collapsed={!showFilters}>
        <SearchFilters>
          <AddressSearch />
          <TxHashSearch />
        </SearchFilters>

        <AmountFilter>
          <AmountRangeInputs />
        </AmountFilter>

        <SortControl>
          <SortToggle />
        </SortControl>

        <FilterActions>
          <ApplyButton />
          <ClearAllButton />
        </FilterActions>
      </FilterPanel>

      <ActiveFilterChips>
        {activeFilters.map(filter => <FilterChip />)}
      </ActiveFilterChips>
    </TransactionFilters>

    <PaginationControls position="top" />

    <TransactionList>
      {paginatedTransactions.map(tx => <TransactionRow />)}
      <EmptyState />  {/* if no results */}
      <LoadingState />  {/* if loading */}
    </TransactionList>

    <PaginationControls position="bottom" />
  </TransactionHistorySection>

  <AddressListSection collapsible defaultExpanded={true} />
</Dashboard>
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **TransactionHistorySection** | Container for entire transaction UI |
| **SectionHeader** | Title + total count + collapse toggle |
| **TransactionFilters** | All filter and search controls |
| **FilterToggleButton** | Show/hide filter panel |
| **FilterPanel** | Container for all filter inputs |
| **SearchFilters** | Address and TX hash search inputs |
| **AmountFilter** | Amount range inputs (greater/less than) |
| **SortControl** | Toggle sort order (newest/oldest first) |
| **ActiveFilterChips** | Visual tags showing active filters |
| **FilterChip** | Individual filter tag with remove button |
| **PaginationControls** | Items per page, page nav, status text |
| **TransactionList** | Paginated transaction rows |
| **TransactionRow** | Individual transaction display |

---

## Pagination Interface

### Layout & Components

```
┌────────────────────────────────────────────────────────────┐
│ Pagination Controls                                         │
│                                                              │
│ [Items per page ▼]  [← Prev] [1] [2] [3] ... [10] [Next →] │
│                                                              │
│ Showing 1-35 of 247 transactions                            │
└────────────────────────────────────────────────────────────┘
```

### Items Per Page Selector

**Component Type**: Dropdown (Select)

**Options**: 10, 35, 50, 100, 500

**Default**: 35 (balances visibility with performance)

**Visual Specifications:**
```css
Width:            140px
Height:           40px
Background:       #242424 (gray-800)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          8px 12px
Font:             14px, Medium
Icon:             ChevronDownIcon (16px)
```

**Tailwind Implementation:**
```tsx
<select className="
  w-[140px] h-10
  bg-gray-800 border border-gray-700
  rounded-lg px-3 py-2
  text-white text-sm font-medium
  focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
  cursor-pointer
">
  <option value="10">10 per page</option>
  <option value="35" selected>35 per page</option>
  <option value="50">50 per page</option>
  <option value="100">100 per page</option>
  <option value="500">500 per page</option>
</select>
```

**Interaction:**
- Click to open dropdown
- Select option → immediate page reload with new items per page
- Current selection highlighted
- Resets to page 1 when changed

**Accessibility:**
- Label: "Items per page"
- aria-label="Select number of transactions per page"
- Keyboard: Arrow keys to navigate, Enter to select

---

### Page Navigation Controls

**Component Type**: Button group

**Layout Options:**

**Option A: Page Number Buttons (Recommended)**
```
[← Prev]  [1] [2] [3] ... [10]  [Next →]
```

**Option B: Jump Input + Buttons**
```
[← Prev]  Page [3  ] of 10  [Next →]
          (input field)
```

**Recommendation**: **Option A** (Page Number Buttons)
- More visual
- Easier to click (larger touch targets)
- Shows context (how many pages total)
- Industry standard (most e-commerce sites)

**Visual Specifications (Option A):**

**Previous/Next Buttons:**
```css
Width:            Auto (text + icon + padding)
Height:           40px
Background:       Transparent
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          8px 16px (py-2 px-4)
Font:             14px, Medium
Color:            #B4B4B4 (gray-400)
Icon:             ChevronLeftIcon / ChevronRightIcon (16px)
Gap:              8px (between icon and text)
```

**States:**
```css
Default:    border-gray-700 text-gray-400
Hover:      bg-gray-800 text-white
Active:     bg-gray-750
Disabled:   border-gray-750 text-gray-600 cursor-not-allowed opacity-50
```

**Page Number Buttons:**
```css
Width:            40px (square)
Height:           40px
Background:       Transparent
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Font:             14px, Medium
Color:            #B4B4B4 (gray-400)
```

**Current Page State:**
```css
Background:       #F7931A (bitcoin)
Border:           #F7931A
Color:            #0F0F0F (gray-950)
Font Weight:      Semibold
```

**Tailwind Implementation:**
```tsx
{/* Previous Button */}
<button
  disabled={currentPage === 1}
  onClick={() => goToPage(currentPage - 1)}
  className="
    flex items-center gap-2
    px-4 py-2 h-10
    border border-gray-700 rounded-lg
    text-sm font-medium text-gray-400
    hover:bg-gray-800 hover:text-white
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
  "
>
  <ChevronLeftIcon className="h-4 w-4" />
  <span>Prev</span>
</button>

{/* Page Number */}
<button
  onClick={() => goToPage(pageNum)}
  className={`
    w-10 h-10
    border rounded-lg
    text-sm font-medium
    transition-all
    ${currentPage === pageNum
      ? 'bg-bitcoin border-bitcoin text-gray-950 font-semibold'
      : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white'
    }
  `}
>
  {pageNum}
</button>

{/* Ellipsis */}
<span className="text-gray-500 px-2">...</span>

{/* Next Button */}
<button
  disabled={currentPage === totalPages}
  onClick={() => goToPage(currentPage + 1)}
  className="
    flex items-center gap-2
    px-4 py-2 h-10
    border border-gray-700 rounded-lg
    text-sm font-medium text-gray-400
    hover:bg-gray-800 hover:text-white
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-colors
  "
>
  <span>Next</span>
  <ChevronRightIcon className="h-4 w-4" />
</button>
```

**Page Number Algorithm:**
```typescript
// Show max 5 page numbers + ellipsis
function getPageNumbers(currentPage: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 7) {
    // Show all pages if ≤7
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Pattern: [1] ... [current-1] [current] [current+1] ... [last]
  const pages: (number | 'ellipsis')[] = [1];

  if (currentPage > 3) {
    pages.push('ellipsis');
  }

  for (let i = Math.max(2, currentPage - 1); i <= Math.min(currentPage + 1, totalPages - 1); i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  if (currentPage < totalPages - 2) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);

  return pages;
}

// Examples:
// Total: 10, Current: 1  → [1] [2] [3] ... [10]
// Total: 10, Current: 5  → [1] ... [4] [5] [6] ... [10]
// Total: 10, Current: 10 → [1] ... [8] [9] [10]
```

**Interaction:**
- Click Previous/Next: Navigate one page
- Click page number: Jump to that page
- Click disabled button: No action, visual feedback (cursor-not-allowed)
- Keyboard: Tab to navigate, Enter/Space to activate

---

### Pagination Status Text

**Purpose**: Show current range and total count

**Format**: "Showing X-Y of Z transactions"

**Examples:**
- "Showing 1-35 of 247 transactions"
- "Showing 36-70 of 247 transactions"
- "Showing 210-247 of 247 transactions" (last page, partial)
- "Showing 0 of 247 transactions" (no results after filter)

**Visual Specifications:**
```css
Font:             14px, Regular (text-sm)
Color:            #808080 (gray-500)
Alignment:        Left (start of pagination controls)
Margin Top:       8px (mt-2)
```

**Tailwind Implementation:**
```tsx
<div className="text-sm text-gray-500 mt-2">
  Showing {startIndex}-{endIndex} of {totalTransactions} transactions
</div>
```

**Calculation:**
```typescript
const startIndex = (currentPage - 1) * itemsPerPage + 1;
const endIndex = Math.min(currentPage * itemsPerPage, totalTransactions);

// Handle empty results
if (totalTransactions === 0) {
  return "Showing 0 transactions";
}
```

---

### Pagination Controls Placement

**Recommendation**: **Both top and bottom**

**Rationale:**
- **Top**: Immediate access to controls without scrolling
- **Bottom**: Natural location after reading through list
- **UX Pattern**: Standard for long lists (Google, Amazon, etc.)

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Transaction History (247)                    │
│                                              │
│ [Filters...]                                 │
│                                              │
│ ┌─ Pagination Top ─────────────────────┐   │
│ │ [10▼] [←Prev][1][2][3]...[10][Next→]│   │
│ │ Showing 1-35 of 247 transactions     │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ [Transaction Row 1]                          │
│ [Transaction Row 2]                          │
│ ...                                          │
│ [Transaction Row 35]                         │
│                                              │
│ ┌─ Pagination Bottom ──────────────────┐   │
│ │ [10▼] [←Prev][1][2][3]...[10][Next→]│   │
│ │ Showing 1-35 of 247 transactions     │   │
│ └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

**Spacing:**
```css
Top Pagination:
  Margin Bottom:    16px (mb-4)

Bottom Pagination:
  Margin Top:       16px (mt-4)
  Padding Top:      16px (pt-4)
  Border Top:       1px solid #2E2E2E (border-gray-750)
```

---

## Search & Filter UI

### Filter Panel Layout

**Component Type**: Collapsible panel

**Default State**: Expanded on first visit, collapsed on return (user preference saved)

**Layout:**

```
┌────────────────────────────────────────────────────────────────┐
│ [🔍 Filters & Search] ▼                                         │
├────────────────────────────────────────────────────────────────┤
│ ┌─ Search ──────────────────────┬─ Amount ───────────────────┐ │
│ │ 🔍 Search by sender address   │ Amount Range               │ │
│ │ [                           ] │ Greater than: [         ]  │ │
│ │                               │ Less than:    [         ]  │ │
│ │ 🔍 Search by transaction hash │                            │ │
│ │ [                           ] │                            │ │
│ └───────────────────────────────┴────────────────────────────┘ │
│                                                                  │
│ ┌─ Sort ─────────────────────┬─ Actions ─────────────────────┐ │
│ │ Order: [Newest first ▼]    │ [Apply Filters] [Clear All]  │ │
│ └────────────────────────────┴──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Visual Specifications:**
```css
Background:       #1E1E1E (gray-850)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    12px (rounded-xl)
Padding:          20px (p-5)
Margin Bottom:    16px (mb-4)
Grid Layout:      CSS Grid (2 columns on desktop, 1 on mobile)
Gap:              16px (gap-4)
```

**Tailwind Implementation:**
```tsx
<div className="
  bg-gray-850 border border-gray-700
  rounded-xl p-5 mb-4
  grid grid-cols-1 md:grid-cols-2 gap-4
">
  {/* Filter content */}
</div>
```

---

### Filter Toggle Button

**Purpose**: Show/hide filter panel (save vertical space)

**Visual Specifications:**
```css
Width:            100%
Height:           48px
Background:       #242424 (gray-800)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          12px 16px
Font:             14px, Semibold
Icon:             MagnifyingGlassIcon + ChevronDownIcon
Display:          Flex (space-between)
```

**States:**
```css
Default:    bg-gray-800 border-gray-700
Hover:      bg-gray-750 border-gray-650
Active:     bg-gray-700
Expanded:   Icon rotates 180deg (ChevronUpIcon)
```

**Badge (Active Filter Count):**
```css
Position:         Absolute, top-right of button
Size:             20px diameter
Background:       #F7931A (bitcoin)
Color:            #0F0F0F (gray-950)
Font:             11px, Bold
Border Radius:    Full (rounded-full)
```

**Tailwind Implementation:**
```tsx
<button
  onClick={() => setShowFilters(!showFilters)}
  className="
    relative w-full h-12
    flex items-center justify-between
    bg-gray-800 border border-gray-700
    rounded-lg px-4 py-3
    text-sm font-semibold text-white
    hover:bg-gray-750
    transition-colors
  "
>
  <div className="flex items-center gap-2">
    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
    <span>Filters & Search</span>
  </div>

  {activeFilterCount > 0 && (
    <span className="
      absolute -top-2 -right-2
      flex items-center justify-center
      w-5 h-5 rounded-full
      bg-bitcoin text-gray-950
      text-xs font-bold
    ">
      {activeFilterCount}
    </span>
  )}

  <ChevronDownIcon className={`
    h-5 w-5 text-gray-400
    transition-transform
    ${showFilters ? 'rotate-180' : ''}
  `} />
</button>
```

---

### Address Search Input

**Purpose**: Search transactions by sender/recipient address

**Label**: "Search by sender address"

**Placeholder**: "Enter Bitcoin address..."

**Visual Specifications:**
```css
Width:            100%
Height:           44px
Background:       #242424 (gray-800)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          12px 16px 12px 40px (space for icon)
Font:             14px, Regular
Icon:             MagnifyingGlassIcon (left, 16px from edge)
```

**Icon Position:**
```css
Position:         Absolute
Left:             12px
Top:              50% (centered vertically)
Transform:        translateY(-50%)
Size:             20px
Color:            #808080 (gray-500)
```

**States:**
```css
Default:    border-gray-700 placeholder-gray-500
Focus:      border-bitcoin ring-2 ring-bitcoin/10
Filled:     text-white
Error:      border-red-500 (if invalid address format)
```

**Tailwind Implementation:**
```tsx
<div className="relative">
  <label className="block text-xs font-medium text-gray-400 mb-2">
    Search by sender address
  </label>

  <MagnifyingGlassIcon className="
    absolute left-3 top-1/2 -translate-y-1/2
    h-5 w-5 text-gray-500
    pointer-events-none
  " style={{ top: 'calc(50% + 12px)' }} />

  <input
    type="text"
    placeholder="Enter Bitcoin address..."
    value={addressSearch}
    onChange={(e) => setAddressSearch(e.target.value)}
    className="
      w-full h-11
      bg-gray-800 border border-gray-700
      rounded-lg pl-10 pr-4 py-3
      text-white text-sm placeholder:text-gray-500
      focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
      transition-all
    "
  />
</div>
```

**Features:**
- **Debounced search**: 300ms delay after typing stops
- **Partial matching**: Matches addresses containing substring (case-insensitive)
- **Clear button**: X icon appears on right when input has value
- **Validation**: Real-time check for valid Bitcoin address format (optional)

**Clear Button:**
```tsx
{addressSearch && (
  <button
    onClick={() => setAddressSearch('')}
    className="
      absolute right-3 top-1/2 -translate-y-1/2
      p-1 rounded
      text-gray-500 hover:text-white
      transition-colors
    "
    style={{ top: 'calc(50% + 12px)' }}
  >
    <XMarkIcon className="h-4 w-4" />
  </button>
)}
```

---

### Transaction Hash Search Input

**Purpose**: Search transactions by exact transaction ID

**Label**: "Search by transaction hash"

**Placeholder**: "Enter transaction hash..."

**Visual Specifications:** Same as Address Search Input

**Tailwind Implementation:**
```tsx
<div className="relative">
  <label className="block text-xs font-medium text-gray-400 mb-2">
    Search by transaction hash
  </label>

  <MagnifyingGlassIcon className="
    absolute left-3 top-1/2 -translate-y-1/2
    h-5 w-5 text-gray-500
    pointer-events-none
  " style={{ top: 'calc(50% + 12px)' }} />

  <input
    type="text"
    placeholder="Enter transaction hash..."
    value={txHashSearch}
    onChange={(e) => setTxHashSearch(e.target.value)}
    className="
      w-full h-11
      bg-gray-800 border border-gray-700
      rounded-lg pl-10 pr-4 py-3
      text-white text-sm placeholder:text-gray-500
      focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
      font-mono tracking-tight
      transition-all
    "
  />

  {txHashSearch && (
    <button
      onClick={() => setTxHashSearch('')}
      className="
        absolute right-3 top-1/2 -translate-y-1/2
        p-1 rounded
        text-gray-500 hover:text-white
        transition-colors
      "
      style={{ top: 'calc(50% + 12px)' }}
    >
      <XMarkIcon className="h-4 w-4" />
    </button>
  )}
</div>
```

**Features:**
- **Exact match**: Only matches complete or partial transaction hash
- **Monospace font**: Uses font-mono for technical data
- **Case-insensitive**: Matches regardless of case
- **Trim whitespace**: Auto-trim on blur

---

### Amount Filter Inputs

**Purpose**: Filter transactions by amount (greater than / less than)

**Layout:**

```
Amount Range
┌────────────────────────┐
│ Greater than:          │
│ [          ] BTC       │
│                        │
│ Less than:             │
│ [          ] BTC       │
└────────────────────────┘
```

**Visual Specifications:**
```css
Input Width:      100%
Input Height:     44px
Background:       #242424 (gray-800)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          12px 16px
Font:             14px, Regular
Suffix:           "BTC" (fixed, right-aligned)
Type:             Number (step: 0.00000001, min: 0)
```

**Tailwind Implementation:**
```tsx
<div className="space-y-3">
  <div className="text-sm font-medium text-gray-400 mb-3">
    Amount Range
  </div>

  {/* Greater Than */}
  <div>
    <label className="block text-xs font-medium text-gray-400 mb-2">
      Greater than:
    </label>

    <div className="relative">
      <input
        type="number"
        step="0.00000001"
        min="0"
        placeholder="0.00000000"
        value={amountGreaterThan}
        onChange={(e) => setAmountGreaterThan(e.target.value)}
        className="
          w-full h-11
          bg-gray-800 border border-gray-700
          rounded-lg px-4 py-3 pr-14
          text-white text-sm
          placeholder:text-gray-500
          focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
          transition-all
        "
      />

      <span className="
        absolute right-4 top-1/2 -translate-y-1/2
        text-sm text-gray-500
        pointer-events-none
      ">
        BTC
      </span>
    </div>
  </div>

  {/* Less Than */}
  <div>
    <label className="block text-xs font-medium text-gray-400 mb-2">
      Less than:
    </label>

    <div className="relative">
      <input
        type="number"
        step="0.00000001"
        min="0"
        placeholder="0.00000000"
        value={amountLessThan}
        onChange={(e) => setAmountLessThan(e.target.value)}
        className="
          w-full h-11
          bg-gray-800 border border-gray-700
          rounded-lg px-4 py-3 pr-14
          text-white text-sm
          placeholder:text-gray-500
          focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
          transition-all
        "
      />

      <span className="
        absolute right-4 top-1/2 -translate-y-1/2
        text-sm text-gray-500
        pointer-events-none
      ">
        BTC
      </span>
    </div>
  </div>
</div>
```

**Features:**
- **Decimal precision**: 8 decimal places (satoshi precision)
- **Validation**: Cannot be negative
- **Range logic**: Greater than < Less than (show error if inverted)
- **Optional**: Both fields optional (can use one or both)

**Error State (Invalid Range):**
```tsx
{amountGreaterThan && amountLessThan && parseFloat(amountGreaterThan) >= parseFloat(amountLessThan) && (
  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
    <ExclamationTriangleIcon className="h-4 w-4" />
    <span>"Greater than" must be less than "Less than"</span>
  </div>
)}
```

---

### Filter Actions

**Layout:**

```
┌─────────────────────────────────┐
│ [Apply Filters] [Clear All]     │
└─────────────────────────────────┘
```

**Apply Filters Button:**
```css
Type:             Primary button (Bitcoin Orange)
Width:            Auto (content + padding)
Height:           44px
Padding:          12px 24px
Font:             14px, Semibold
```

**Clear All Button:**
```css
Type:             Ghost button
Width:            Auto
Height:           44px
Padding:          12px 20px
Font:             14px, Medium
Color:            #B4B4B4 (gray-400)
```

**Tailwind Implementation:**
```tsx
<div className="flex items-center justify-end gap-3 mt-4">
  <button
    onClick={handleClearFilters}
    className="
      px-5 py-3 h-11
      text-sm font-medium text-gray-400
      hover:bg-gray-800 hover:text-white
      rounded-lg
      transition-colors
    "
  >
    Clear All
  </button>

  <button
    onClick={handleApplyFilters}
    className="
      px-6 py-3 h-11
      bg-bitcoin hover:bg-bitcoin-hover
      text-white text-sm font-semibold
      rounded-lg
      active:scale-[0.98]
      transition-all
    "
  >
    Apply Filters
  </button>
</div>
```

**Behavior:**
- **Apply Filters**: Apply all filter values, close filter panel, reset to page 1
- **Clear All**: Reset all filter inputs to empty, immediately update list (no confirmation)

---

### Active Filter Chips

**Purpose**: Visual indicator of active filters with quick removal

**Layout:**

```
Active Filters: [Sender: tb1q...abc ✕] [Amount > 0.001 BTC ✕] [Newest first ✕]
```

**Visual Specifications:**
```css
Background:       #3A3A3A (gray-700)
Border:           1px solid #4A4A4A
Border Radius:    6px (rounded-md)
Padding:          6px 12px (py-1.5 px-3)
Font:             12px, Medium (text-xs font-medium)
Color:            #FFFFFF
Gap:              8px (between chips)
Display:          Inline-flex, wrap
```

**Close Button (X):**
```css
Size:             16x16px
Color:            #B4B4B4 (gray-400)
Hover:            #FFFFFF
Margin Left:      8px (ml-2)
```

**Tailwind Implementation:**
```tsx
{activeFilters.length > 0 && (
  <div className="flex flex-wrap items-center gap-2 mb-4">
    <span className="text-xs font-medium text-gray-400">
      Active Filters:
    </span>

    {activeFilters.map((filter) => (
      <span
        key={filter.id}
        className="
          inline-flex items-center gap-2
          bg-gray-700 border border-gray-650
          rounded-md px-3 py-1.5
          text-xs font-medium text-white
        "
      >
        <span>{filter.label}</span>

        <button
          onClick={() => removeFilter(filter.id)}
          className="
            p-0.5 rounded
            text-gray-400 hover:text-white
            transition-colors
          "
          aria-label={`Remove filter: ${filter.label}`}
        >
          <XMarkIcon className="h-3 w-3" />
        </button>
      </span>
    ))}

    <button
      onClick={handleClearAllFilters}
      className="
        text-xs font-medium text-gray-400
        hover:text-white
        transition-colors
      "
    >
      Clear all
    </button>
  </div>
)}
```

**Filter Types & Labels:**

| Filter Type | Label Format | Example |
|-------------|-------------|---------|
| Address Search | `Sender: {truncated address}` | `Sender: tb1q...abc` |
| TX Hash Search | `TX: {truncated hash}` | `TX: 3f2a...9c1` |
| Amount Greater | `Amount > {value} BTC` | `Amount > 0.001 BTC` |
| Amount Less | `Amount < {value} BTC` | `Amount < 1.0 BTC` |
| Sort Order | `{order} first` | `Newest first` |

**Behavior:**
- Click X on chip: Remove that filter, immediately update list
- Click "Clear all": Remove all filters, collapse filter panel

---

## Sort Controls

### Sort Order Toggle

**Purpose**: Toggle transaction chronological order

**Options:**
- Newest first (default) - Most recent transactions at top
- Oldest first - Historical transactions at top

**Component Type**: Dropdown (Select)

**Visual Specifications:**
```css
Width:            180px
Height:           44px
Background:       #242424 (gray-800)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          12px 16px
Font:             14px, Medium
Icon:             ChevronDownIcon
```

**Tailwind Implementation:**
```tsx
<div>
  <label className="block text-xs font-medium text-gray-400 mb-2">
    Sort order:
  </label>

  <select
    value={sortOrder}
    onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
    className="
      w-[180px] h-11
      bg-gray-800 border border-gray-700
      rounded-lg px-4 py-2
      text-white text-sm font-medium
      focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
      cursor-pointer
    "
  >
    <option value="newest">Newest first</option>
    <option value="oldest">Oldest first</option>
  </select>
</div>
```

**Behavior:**
- Select option → Immediately re-sort list (no "Apply" needed)
- Maintains current page (doesn't reset to page 1)
- Sort applies BEFORE pagination

**Alternative Design**: Toggle Button (More Visual)

```tsx
<div>
  <label className="block text-xs font-medium text-gray-400 mb-2">
    Sort order:
  </label>

  <div className="inline-flex gap-1 bg-gray-800 p-1 rounded-lg">
    <button
      onClick={() => setSortOrder('newest')}
      className={`
        px-4 py-2 rounded-md text-sm font-medium
        transition-all
        ${sortOrder === 'newest'
          ? 'bg-gray-850 text-white'
          : 'text-gray-500 hover:text-gray-400'
        }
      `}
    >
      <ArrowDownIcon className="inline h-4 w-4 mr-1.5" />
      Newest first
    </button>

    <button
      onClick={() => setSortOrder('oldest')}
      className={`
        px-4 py-2 rounded-md text-sm font-medium
        transition-all
        ${sortOrder === 'oldest'
          ? 'bg-gray-850 text-white'
          : 'text-gray-500 hover:text-gray-400'
        }
      `}
    >
      <ArrowUpIcon className="inline h-4 w-4 mr-1.5" />
      Oldest first
    </button>
  </div>
</div>
```

**Recommendation**: **Toggle Button** (more visual, clearer state)

---

## Component States

### 1. Default State (Transactions Loaded)

**Visual:**
- Filter panel collapsed (with badge showing active filter count if any)
- Pagination controls visible (top and bottom)
- Transaction list showing paginated items
- Status text: "Showing 1-35 of 247 transactions"

**Empty Active Filters:**
- No filter chips shown
- Filter toggle shows "Filters & Search" (no badge)

**With Active Filters:**
- Filter chips row visible below filter toggle
- Filter toggle shows badge with count (e.g., "3" in orange circle)

---

### 2. Loading State (Fetching Page)

**Trigger:** User changes page, applies filter, or initial load

**Visual:**
- Show skeleton loaders in transaction list area
- Pagination controls disabled (opacity 50%, cursor-not-allowed)
- Filter controls disabled during load
- Spinner in center of transaction list area (optional)

**Skeleton Loader Pattern:**
```tsx
<div className="space-y-3">
  {Array.from({ length: itemsPerPage }).map((_, i) => (
    <div
      key={i}
      className="
        flex items-center justify-between
        bg-gray-850 border border-gray-700
        rounded-lg p-4
        animate-pulse
      "
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-800 rounded-full" />
        <div className="space-y-2">
          <div className="w-24 h-4 bg-gray-800 rounded" />
          <div className="w-32 h-3 bg-gray-800 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="w-28 h-4 bg-gray-800 rounded" />
        <div className="w-20 h-3 bg-gray-800 rounded" />
      </div>
    </div>
  ))}
</div>
```

**Duration:** Typically 300-800ms (show immediately, no delay)

---

### 3. Empty State (No Transactions)

**Trigger:** Wallet has no transactions (new account)

**Visual:**
```
┌────────────────────────────────────────┐
│         [Empty Wallet Icon]             │
│                                         │
│      No Transactions Yet                │
│                                         │
│  Your transaction history will appear   │
│  here once you send or receive Bitcoin. │
│                                         │
│         [Receive Bitcoin]               │
└────────────────────────────────────────┘
```

**Tailwind Implementation:**
```tsx
<div className="
  flex flex-col items-center justify-center
  py-16 px-6
  text-center
">
  <div className="
    w-20 h-20 mb-6
    flex items-center justify-center
    bg-gray-800 rounded-full
  ">
    <InboxIcon className="h-10 w-10 text-gray-600" />
  </div>

  <h3 className="text-lg font-semibold text-white mb-2">
    No Transactions Yet
  </h3>

  <p className="text-sm text-gray-400 mb-6 max-w-sm">
    Your transaction history will appear here once you send or receive Bitcoin.
  </p>

  <button
    onClick={onOpenReceiveModal}
    className="
      px-6 py-3
      bg-bitcoin hover:bg-bitcoin-hover
      text-white text-sm font-semibold
      rounded-lg
      transition-colors
    "
  >
    Receive Bitcoin
  </button>
</div>
```

**Pagination Behavior:** Hide pagination controls entirely

---

### 4. No Results State (Filters Return Nothing)

**Trigger:** Filters applied but no matching transactions

**Visual:**
```
┌────────────────────────────────────────┐
│       [Magnifying Glass Icon]           │
│                                         │
│      No Matching Transactions           │
│                                         │
│  No transactions match your current     │
│  filters. Try adjusting your filters or │
│  clearing them to see all transactions. │
│                                         │
│         [Clear Filters]                 │
└────────────────────────────────────────┘
```

**Active Filter Chips:** Remain visible above empty state

**Tailwind Implementation:**
```tsx
<div className="
  flex flex-col items-center justify-center
  py-16 px-6
  text-center
">
  <div className="
    w-20 h-20 mb-6
    flex items-center justify-center
    bg-gray-800 rounded-full
  ">
    <MagnifyingGlassIcon className="h-10 w-10 text-gray-600" />
  </div>

  <h3 className="text-lg font-semibold text-white mb-2">
    No Matching Transactions
  </h3>

  <p className="text-sm text-gray-400 mb-6 max-w-sm">
    No transactions match your current filters. Try adjusting your filters or clearing them to see all transactions.
  </p>

  <button
    onClick={handleClearFilters}
    className="
      px-6 py-3
      border border-bitcoin-light text-bitcoin-light
      hover:bg-bitcoin/10
      text-sm font-semibold
      rounded-lg
      transition-colors
    "
  >
    Clear Filters
  </button>
</div>
```

**Pagination Behavior:** Hide pagination controls, show status "Showing 0 of 247 transactions"

---

### 5. Error State (Failed to Load)

**Trigger:** Network error, API failure, timeout

**Visual:**
```
┌────────────────────────────────────────┐
│      [Error Triangle Icon]              │
│                                         │
│    Failed to Load Transactions          │
│                                         │
│  Unable to fetch transactions. Please   │
│  check your internet connection and     │
│  try again.                             │
│                                         │
│  Error: Network timeout (503)           │
│                                         │
│         [Try Again]                     │
└────────────────────────────────────────┘
```

**Error Types & Messages:**

| Error Code | User Message |
|------------|--------------|
| 502/503/504 | "Blockchain service temporarily unavailable. Please try again in a moment." |
| 429 | "Too many requests. Please wait a moment and try again." |
| Timeout | "Request timed out. Please check your internet connection and try again." |
| Network | "Network error. Please check your internet connection." |
| Unknown | "Failed to load transactions. Please try again." |

**Tailwind Implementation:**
```tsx
<div className="
  flex flex-col items-center justify-center
  py-16 px-6
  text-center
">
  <div className="
    w-20 h-20 mb-6
    flex items-center justify-center
    bg-red-500/15 rounded-full
  ">
    <ExclamationTriangleIcon className="h-10 w-10 text-red-500" />
  </div>

  <h3 className="text-lg font-semibold text-white mb-2">
    Failed to Load Transactions
  </h3>

  <p className="text-sm text-gray-400 mb-2 max-w-sm">
    {errorMessage}
  </p>

  <p className="text-xs text-gray-500 mb-6 font-mono">
    Error: {errorDetails}
  </p>

  <button
    onClick={handleRetry}
    className="
      px-6 py-3
      bg-bitcoin hover:bg-bitcoin-hover
      text-white text-sm font-semibold
      rounded-lg
      transition-colors
    "
  >
    Try Again
  </button>
</div>
```

---

## Visual Design Specifications

### Color Usage

**Transaction List Container:**
```css
Background:       Transparent (inherits dashboard gray-950)
```

**Transaction Row:**
```css
Background:       #1E1E1E (gray-850)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          16px (p-4)

Hover:            border-gray-650, bg-gray-800 (if clickable)
Active:           bg-gray-750
```

**Filter Panel:**
```css
Background:       #1E1E1E (gray-850)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    12px (rounded-xl)
```

**Pagination Controls:**
```css
Background:       Transparent
Buttons:          See "Pagination Interface" section
```

---

### Typography

**Section Header:**
```css
Font:             20px, Semibold (text-xl font-semibold)
Color:            #FFFFFF
```

**Transaction Count:**
```css
Font:             20px, Regular (text-xl)
Color:            #808080 (gray-500)
```

**Filter Labels:**
```css
Font:             12px, Medium (text-xs font-medium)
Color:            #B4B4B4 (gray-400)
```

**Filter Input Text:**
```css
Font:             14px, Regular (text-sm)
Color:            #FFFFFF
Placeholder:      #808080 (gray-500)
```

**Pagination Status:**
```css
Font:             14px, Regular (text-sm)
Color:            #808080 (gray-500)
```

**Active Filter Chips:**
```css
Font:             12px, Medium (text-xs font-medium)
Color:            #FFFFFF
```

---

### Spacing

**Section Gaps:**
```css
Balance to Transactions:    24px (space-y-6)
Filters to Transaction List: 16px (mb-4)
Transaction Rows:           12px (space-y-3)
Bottom Pagination:          16px (mt-4, pt-4, border-top)
```

**Filter Panel Internal:**
```css
Grid Gap:                   16px (gap-4)
Input Vertical Spacing:     12px (space-y-3)
Actions Margin Top:         16px (mt-4)
```

**Pagination Internal:**
```css
Items per page to Buttons:  16px (gap-4)
Button Group Gap:           8px (gap-2)
Status Text Margin Top:     8px (mt-2)
```

---

### Transitions & Animations

**Filter Panel Expand/Collapse:**
```css
Animation:        Height transition 0.3s ease
Max Height:       0 (collapsed) → auto (expanded)
Overflow:         hidden
```

**Filter Chip Remove:**
```css
Animation:        Fade out + scale down 0.2s ease
Transform:        scale(1) → scale(0.9)
Opacity:          1 → 0
```

**Page Transition:**
```css
Animation:        Fade in 0.2s ease
Opacity:          0 → 1
```

**Skeleton Pulse:**
```css
Animation:        Pulse 1.5s ease-in-out infinite
```

**Hover Effects:**
```css
Buttons:          All 0.2s ease
Borders:          Colors 0.2s ease
Backgrounds:      Colors 0.2s ease
```

---

## Interaction Patterns

### Filter Application Flow

**User Action Sequence:**

1. **Open Filters**
   - User clicks "Filters & Search" toggle button
   - Panel expands with smooth height transition (300ms)
   - Focus moves to first input (address search)

2. **Enter Filter Values**
   - User types in search/amount fields
   - Real-time validation (debounced 300ms for search)
   - No application until "Apply Filters" clicked

3. **Apply Filters**
   - User clicks "Apply Filters" button
   - Loading state appears in transaction list
   - Filter panel collapses
   - Active filter chips appear
   - Badge shows count on filter toggle button
   - Transaction list updates with filtered results
   - Pagination resets to page 1
   - Status text updates: "Showing 1-X of Y transactions"

4. **Clear Individual Filter**
   - User clicks X on filter chip
   - That filter immediately removed
   - Transaction list updates
   - Chip animates out (fade + scale)
   - Badge count decrements

5. **Clear All Filters**
   - User clicks "Clear all" in chips row OR "Clear All" in filter panel
   - All filters reset
   - All chips removed
   - Transaction list shows all transactions
   - Badge disappears from toggle button

**Filter Logic:**
```typescript
// Filters are applied with AND logic (all must match)
const filteredTransactions = transactions.filter(tx => {
  // Address search (partial match, case-insensitive)
  if (addressSearch && !tx.address.toLowerCase().includes(addressSearch.toLowerCase())) {
    return false;
  }

  // TX hash search (partial match, case-insensitive)
  if (txHashSearch && !tx.txid.toLowerCase().includes(txHashSearch.toLowerCase())) {
    return false;
  }

  // Amount greater than
  if (amountGreaterThan && tx.amount <= parseFloat(amountGreaterThan)) {
    return false;
  }

  // Amount less than
  if (amountLessThan && tx.amount >= parseFloat(amountLessThan)) {
    return false;
  }

  return true;
});

// Then sort
const sortedTransactions = [...filteredTransactions].sort((a, b) => {
  return sortOrder === 'newest'
    ? b.timestamp - a.timestamp  // Newest first
    : a.timestamp - b.timestamp;  // Oldest first
});

// Then paginate
const startIndex = (currentPage - 1) * itemsPerPage;
const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + itemsPerPage);
```

---

### Pagination Interaction Flow

**User Action Sequence:**

1. **Change Items Per Page**
   - User clicks dropdown, selects new value (e.g., 50)
   - Transaction list shows loading skeleton
   - List re-renders with new items per page
   - Resets to page 1
   - Pagination buttons update (total pages changes)
   - Status text updates: "Showing 1-50 of 247 transactions"

2. **Navigate to Next Page**
   - User clicks "Next" button
   - Transaction list shows loading skeleton (300ms)
   - Smooth scroll to top of transaction list
   - List updates with new page items
   - Current page button updates (e.g., [1] → [2])
   - Status text updates: "Showing 36-70 of 247 transactions"
   - Previous button becomes enabled
   - Next button disabled if on last page

3. **Jump to Specific Page**
   - User clicks page number button (e.g., [5])
   - Transaction list shows loading skeleton
   - Smooth scroll to top
   - List updates with page 5 items
   - Current page button highlights
   - Status text updates: "Showing 141-175 of 247 transactions"

4. **Navigate to Previous Page**
   - User clicks "Prev" button
   - Same flow as Next, but decrements page
   - Previous button disabled if page 1

**Scroll Behavior:**
```typescript
// Smooth scroll to top of transaction list on page change
const handlePageChange = (newPage: number) => {
  setCurrentPage(newPage);

  // Scroll to transaction list top
  const transactionListEl = document.getElementById('transaction-list');
  if (transactionListEl) {
    transactionListEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};
```

---

### Keyboard Navigation

**Filter Panel:**
- **Tab**: Navigate through inputs (address → tx hash → amount greater → amount less → sort → clear → apply)
- **Shift+Tab**: Reverse navigation
- **Enter**: Submit form (same as "Apply Filters")
- **Escape**: Close filter panel (if open)

**Pagination:**
- **Tab**: Navigate through controls (items per page → prev → page numbers → next)
- **Enter/Space**: Activate button
- **Arrow Keys**: Navigate page number buttons (left/right)
- **Home**: Jump to first page
- **End**: Jump to last page

**Transaction List:**
- **Tab**: Focus transaction rows sequentially
- **Enter**: Open transaction detail (if row is clickable)
- **Arrow Down/Up**: Navigate between transaction rows (optional enhancement)

**Filter Chips:**
- **Tab**: Navigate to chip, then to X button
- **Enter/Space**: Remove filter (when X focused)

---

## User Flows

### Flow 1: Find Transaction by Sender Address

**Scenario:** User remembers sending Bitcoin to address "tb1q...abc" and wants to find that transaction.

**Steps:**

1. **Start**: User is on Dashboard with 247 transactions
2. **Open Filters**: Click "Filters & Search" toggle button
3. **Enter Address**: Type partial address "tb1q...abc" in "Search by sender address"
4. **Apply**: Click "Apply Filters"
5. **View Results**: Transaction list shows 3 matching transactions
6. **Find Transaction**: User scans list, finds correct transaction
7. **View Details**: Click transaction row to open detail pane

**Duration:** ~15 seconds

**Success Criteria:**
- User finds transaction in <20 seconds
- Filter controls are intuitive (no help needed)
- Results are accurate (all matching transactions shown)

---

### Flow 2: Filter Large Transactions (>0.01 BTC)

**Scenario:** User wants to review all transactions over 0.01 BTC for tax purposes.

**Steps:**

1. **Start**: User is on Dashboard with 500+ transactions
2. **Open Filters**: Click "Filters & Search"
3. **Set Amount Filter**: Enter "0.01" in "Greater than" field
4. **Apply**: Click "Apply Filters"
5. **View Results**: List shows 18 matching transactions
6. **Review All**: User navigates through pages (6 transactions on page 1, rest on page 2)
7. **Export** (future): User exports filtered list

**Duration:** ~30 seconds

**Success Criteria:**
- All transactions >0.01 BTC shown
- No false positives or negatives
- Pagination works correctly with filtered results

---

### Flow 3: Navigate Large Transaction History

**Scenario:** User with 500 transactions wants to find a transaction from 6 months ago.

**Steps:**

1. **Start**: User is on Dashboard, newest transactions shown (page 1)
2. **Increase Items Per Page**: Select "100 per page" from dropdown
3. **Navigate**: Click page number buttons to jump forward (e.g., [3])
4. **Scan**: User scans transactions on page 3
5. **Adjust Sort**: Change to "Oldest first" to see historical transactions
6. **Find Transaction**: User recognizes transaction from amount/date
7. **View Details**: Click transaction to see full details

**Duration:** ~45 seconds

**Success Criteria:**
- Pagination handles 500 transactions smoothly
- Page transitions are fast (<500ms)
- Sort order changes apply immediately
- User can navigate entire history

---

### Flow 4: Clear Filters After No Results

**Scenario:** User applied too many filters and got no results.

**Steps:**

1. **Start**: User has 3 active filters applied (address + amount range + tx hash)
2. **View Empty State**: "No Matching Transactions" shown
3. **Clear Filters**: Click "Clear Filters" button in empty state
4. **View All Transactions**: Full list returns, filters reset
5. **Try Again**: User applies less restrictive filters

**Duration:** ~5 seconds

**Success Criteria:**
- Clear action is obvious (button prominent)
- All filters reset completely
- No lingering filter state
- User can immediately start fresh

---

## Responsive Behavior

### Desktop (1024px and above)

**Layout:**
```
┌──────────┬─────────────────────────────────────────────────┐
│ Sidebar  │ Transaction History                             │
│ 240px    │ ┌─────────────────────────────────────────────┐ │
│          │ │ Filters (2-column grid)                     │ │
│          │ │ [Search inputs] | [Amount inputs]           │ │
│          │ │ [Sort] | [Actions]                          │ │
│          │ └─────────────────────────────────────────────┘ │
│          │ [Pagination Controls - horizontal]             │
│          │ [Transaction List]                              │
│          │ [Pagination Controls - horizontal]             │
└──────────┴─────────────────────────────────────────────────┘
```

**Specifics:**
- Filter panel: 2-column grid (search left, amount right)
- Pagination: Horizontal row (items per page + buttons + status)
- Transaction rows: Full details visible
- Page numbers: Show up to 7 page numbers

---

### Tablet (768px - 1023px)

**Layout:**
```
┌──────────┬───────────────────────────────────┐
│ Sidebar  │ Transaction History               │
│ 240px    │ ┌───────────────────────────────┐ │
│          │ │ Filters (2-column grid)       │ │
│          │ │ [Search] | [Amount]           │ │
│          │ │ [Sort] | [Actions]            │ │
│          │ └───────────────────────────────┘ │
│          │ [Pagination - compact]            │
│          │ [Transaction List]                │
│          │ [Pagination - compact]            │
└──────────┴───────────────────────────────────┘
```

**Specifics:**
- Filter panel: Still 2-column but narrower
- Pagination: Compact (show 5 page numbers instead of 7)
- Transaction rows: Slightly condensed spacing
- Font sizes: Unchanged (maintain readability)

---

### Mobile (<768px)

**Layout:**
```
┌───────────────────────────────────┐
│ Transaction History               │
│ ┌───────────────────────────────┐ │
│ │ Filters (1-column stack)      │ │
│ │ [Search by sender]            │ │
│ │ [Search by TX hash]           │ │
│ │ [Amount greater]              │ │
│ │ [Amount less]                 │ │
│ │ [Sort]                        │ │
│ │ [Apply] [Clear]               │ │
│ └───────────────────────────────┘ │
│ [Pagination - vertical stack]     │
│ [10 ▼]                            │
│ [← Prev] [1][2][3] [Next →]      │
│ Showing 1-10 of 247               │
│                                   │
│ [Transaction List]                │
│ (stacked rows)                    │
│                                   │
│ [Pagination - vertical stack]     │
└───────────────────────────────────┘
```

**Specifics:**
- **Filter panel**: Single column stack (all inputs full-width)
- **Pagination**: Vertical stack or horizontal compact
  - Items per page dropdown above page buttons
  - Show 3 page numbers max (current + neighbors)
  - Previous/Next buttons full-width OR compact icons (← →)
- **Transaction rows**: Stack sender/amount vertically
- **Touch targets**: All buttons minimum 48x48px
- **Filter chips**: Wrap to multiple rows if needed
- **Sidebar**: Hidden (hamburger menu) - out of scope for this spec

**Responsive Breakpoints:**
```tsx
{/* Filter Panel Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Automatically stacks on mobile */}
</div>

{/* Pagination Layout */}
<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
  <select className="w-full md:w-[140px]">...</select>
  <div className="flex items-center gap-2 flex-wrap">...</div>
</div>
```

---

## Accessibility

### WCAG AA Compliance

**Color Contrast:**
- All text meets 4.5:1 minimum (normal text)
- UI components meet 3:1 minimum (borders, icons)
- Focus indicators meet 3:1 against background

**Keyboard Navigation:**
- All controls are keyboard-accessible (tab navigation)
- Focus indicators clearly visible (2px Bitcoin Orange outline)
- Logical tab order (top to bottom, left to right)
- Skip links for screen readers (optional enhancement)

**Screen Reader Support:**
- All inputs have associated labels (aria-labelledby or <label>)
- Buttons have descriptive aria-labels
- Status updates announced (aria-live regions)
- Page changes announced ("Page 2 of 10 loaded")

---

### ARIA Attributes

**Filter Panel:**
```tsx
<div
  role="region"
  aria-label="Transaction filters"
  aria-expanded={showFilters}
>
  {/* Filter inputs */}
</div>
```

**Pagination:**
```tsx
<nav aria-label="Transaction pagination">
  <button
    aria-label="Previous page"
    aria-disabled={currentPage === 1}
  >
    Prev
  </button>

  <button
    aria-label="Go to page 2"
    aria-current={currentPage === 2 ? "page" : undefined}
  >
    2
  </button>
</nav>
```

**Items Per Page:**
```tsx
<label htmlFor="items-per-page" className="sr-only">
  Items per page
</label>
<select
  id="items-per-page"
  aria-label="Select number of transactions per page"
>
  <option>10 per page</option>
</select>
```

**Filter Chips:**
```tsx
<button
  onClick={() => removeFilter(filter.id)}
  aria-label={`Remove filter: ${filter.label}`}
>
  <XMarkIcon />
</button>
```

**Status Updates (Live Region):**
```tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  Showing {startIndex}-{endIndex} of {totalTransactions} transactions. Page {currentPage} of {totalPages}.
</div>
```

---

### Focus Management

**Filter Panel Open:**
```typescript
// When filter panel opens, focus first input
useEffect(() => {
  if (showFilters) {
    addressSearchInputRef.current?.focus();
  }
}, [showFilters]);
```

**Modal Closes (Filter Applied):**
```typescript
// When filter panel closes, return focus to toggle button
const handleApplyFilters = () => {
  applyFilters();
  setShowFilters(false);
  filterToggleButtonRef.current?.focus();
};
```

**Page Change:**
```typescript
// Announce page change to screen readers
const handlePageChange = (newPage: number) => {
  setCurrentPage(newPage);

  // Update live region
  setStatusMessage(`Page ${newPage} of ${totalPages} loaded. Showing ${startIndex}-${endIndex} of ${totalTransactions} transactions.`);
};
```

---

### Touch Targets

**Minimum Size:** 44x44px (WCAG AAA guideline)

**All Interactive Elements:**
- Buttons: 44px height (py-3 = 12px + content)
- Inputs: 44px height
- Page number buttons: 40x40px (acceptable for desktop, 48px on mobile)
- Filter chip X buttons: 16x16px icon inside 32x32px tap area
- Dropdown selects: 40px height

**Mobile Adjustments:**
```css
@media (max-width: 767px) {
  button, input, select {
    min-height: 48px;
  }

  .pagination-button {
    min-width: 48px;
    min-height: 48px;
  }
}
```

---

## Performance Considerations

### Pagination Benefits

**Without Pagination:**
- Render 500 transactions = 500 DOM nodes
- Scroll performance degrades
- Initial paint time: ~1000ms
- Memory usage: High

**With Pagination (35 items):**
- Render 35 transactions = 35 DOM nodes
- Smooth scrolling
- Initial paint time: ~200ms
- Memory usage: Low

**Recommendation:** Default to 35 items per page (balances visibility with performance)

---

### Debounced Search

**Problem:** Typing in search field triggers filter on every keystroke (expensive)

**Solution:** Debounce search input (300ms delay)

```typescript
import { useState, useEffect } from 'react';
import { debounce } from 'lodash';

const [addressSearch, setAddressSearch] = useState('');
const [debouncedAddressSearch, setDebouncedAddressSearch] = useState('');

// Debounce search input (300ms)
useEffect(() => {
  const handler = setTimeout(() => {
    setDebouncedAddressSearch(addressSearch);
  }, 300);

  return () => clearTimeout(handler);
}, [addressSearch]);

// Filter using debounced value
const filteredTransactions = useMemo(() => {
  return transactions.filter(tx => {
    if (debouncedAddressSearch && !tx.address.toLowerCase().includes(debouncedAddressSearch.toLowerCase())) {
      return false;
    }
    // ... other filters
    return true;
  });
}, [transactions, debouncedAddressSearch, txHashSearch, amountGreaterThan, amountLessThan]);
```

---

### Memoization

**Filter Logic:** Use `useMemo` to avoid re-filtering on every render

```typescript
const filteredAndSortedTransactions = useMemo(() => {
  // 1. Filter
  let result = transactions.filter(tx => {
    // ... filter logic
  });

  // 2. Sort
  result.sort((a, b) => {
    return sortOrder === 'newest'
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp;
  });

  return result;
}, [transactions, addressSearch, txHashSearch, amountGreaterThan, amountLessThan, sortOrder]);

const paginatedTransactions = useMemo(() => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  return filteredAndSortedTransactions.slice(startIndex, startIndex + itemsPerPage);
}, [filteredAndSortedTransactions, currentPage, itemsPerPage]);
```

---

### Virtual Scrolling (Future Enhancement)

**If pagination is not desired:**

Consider virtual scrolling library (e.g., `react-window`, `react-virtualized`) to render only visible transactions.

**Pros:**
- No pagination UI needed
- Infinite scroll experience
- Still performant with 1000+ transactions

**Cons:**
- More complex implementation
- Less intuitive navigation (no "jump to page 5")
- Screen reader challenges

**Recommendation:** Stick with pagination for v0.12.0. Consider virtual scrolling if user feedback demands it.

---

## Implementation Notes

### State Management

**Component State:**
```typescript
// Pagination state
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(35);

// Filter state
const [showFilters, setShowFilters] = useState(false);
const [addressSearch, setAddressSearch] = useState('');
const [txHashSearch, setTxHashSearch] = useState('');
const [amountGreaterThan, setAmountGreaterThan] = useState('');
const [amountLessThan, setAmountLessThan] = useState('');
const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

// Active filters (for chips)
const [activeFilters, setActiveFilters] = useState<Filter[]>([]);

// Loading state
const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
```

**Persistence (Optional):**
```typescript
// Save user preferences to chrome.storage.local
useEffect(() => {
  chrome.storage.local.set({
    'transactionListPreferences': {
      itemsPerPage,
      showFilters,
      sortOrder
    }
  });
}, [itemsPerPage, showFilters, sortOrder]);

// Load on mount
useEffect(() => {
  chrome.storage.local.get('transactionListPreferences', (result) => {
    if (result.transactionListPreferences) {
      setItemsPerPage(result.transactionListPreferences.itemsPerPage || 35);
      setShowFilters(result.transactionListPreferences.showFilters || false);
      setSortOrder(result.transactionListPreferences.sortOrder || 'newest');
    }
  });
}, []);
```

---

### Filter State Type

```typescript
interface Filter {
  id: string;
  type: 'address' | 'txHash' | 'amountGreater' | 'amountLess' | 'sort';
  label: string;
  value: string | number;
}

// Example active filters:
const activeFilters: Filter[] = [
  {
    id: 'address-1',
    type: 'address',
    label: 'Sender: tb1q...abc',
    value: 'tb1q...abc'
  },
  {
    id: 'amountGreater-1',
    type: 'amountGreater',
    label: 'Amount > 0.001 BTC',
    value: 0.001
  }
];
```

---

### Data Flow

**1. User applies filter**
```
User clicks "Apply Filters"
  ↓
handleApplyFilters()
  ↓
Build activeFilters array from form values
  ↓
setActiveFilters(newFilters)
  ↓
setCurrentPage(1)  // Reset to page 1
  ↓
setShowFilters(false)  // Close filter panel
```

**2. Transactions are filtered**
```
activeFilters changes
  ↓
useMemo recalculates filteredAndSortedTransactions
  ↓
useMemo recalculates paginatedTransactions
  ↓
Component re-renders with new transaction list
```

**3. User changes page**
```
User clicks "Next"
  ↓
handlePageChange(currentPage + 1)
  ↓
setCurrentPage(newPage)
  ↓
Scroll to top of transaction list
  ↓
useMemo recalculates paginatedTransactions
  ↓
Component re-renders
```

---

### URL State (Optional Enhancement)

**Persist filters in URL for sharing/bookmarking:**

```typescript
// Example URL:
// /dashboard?page=2&items=50&address=tb1q...&amountGt=0.001&sort=oldest

// Update URL on filter/page change
const updateURL = () => {
  const params = new URLSearchParams();
  if (currentPage > 1) params.set('page', currentPage.toString());
  if (itemsPerPage !== 35) params.set('items', itemsPerPage.toString());
  if (addressSearch) params.set('address', addressSearch);
  if (txHashSearch) params.set('txHash', txHashSearch);
  if (amountGreaterThan) params.set('amountGt', amountGreaterThan);
  if (amountLessThan) params.set('amountLt', amountLessThan);
  if (sortOrder !== 'newest') params.set('sort', sortOrder);

  window.history.replaceState({}, '', `?${params.toString()}`);
};

// Parse URL on mount
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  setCurrentPage(parseInt(params.get('page') || '1'));
  setItemsPerPage(parseInt(params.get('items') || '35'));
  setAddressSearch(params.get('address') || '');
  setTxHashSearch(params.get('txHash') || '');
  setAmountGreaterThan(params.get('amountGt') || '');
  setAmountLessThan(params.get('amountLt') || '');
  setSortOrder((params.get('sort') || 'newest') as 'newest' | 'oldest');
}, []);
```

**Benefits:**
- Shareable filtered views
- Browser back/forward works with filters
- Bookmark specific filter states

**Drawbacks:**
- More complex state management
- Potential privacy concern (filters visible in URL)

**Recommendation:** Optional for v0.12.0, consider for future release

---

## Summary

This specification defines a comprehensive pagination and filtering system for the transaction list, addressing the need to efficiently navigate and search large transaction histories.

**Key Design Decisions:**

1. **Pagination Placement:** Both top and bottom (standard UX pattern)
2. **Default Items Per Page:** 35 (balances visibility and performance)
3. **Filter Panel:** Collapsible with active filter count badge
4. **Filter Application:** Explicit "Apply" button (prevents accidental filtering)
5. **Active Filters:** Visual chips with quick removal
6. **Page Numbers:** Show 5-7 page numbers with ellipsis (better than input field)
7. **Sort Control:** Toggle button (more visual than dropdown)
8. **Layout:** Transaction list moves above address list (primary content)

**Implementation Priorities:**

1. **Phase 1 (MVP):** Pagination controls + basic filtering (address, amount)
2. **Phase 2:** Advanced filters (TX hash, date range)
3. **Phase 3:** Performance optimizations (virtual scrolling, caching)
4. **Phase 4:** URL state persistence (shareable filters)

**Accessibility:** Full WCAG AA compliance with keyboard navigation, screen reader support, and minimum touch targets.

**Performance:** Pagination reduces DOM nodes from 500+ to 35, improving rendering speed and memory usage.

---

**Next Steps:**
1. Review specification with frontend developer
2. Create component implementation plan
3. Develop reusable pagination component
4. Implement filter logic in Dashboard component
5. Test with large transaction datasets (500+ transactions)
6. Conduct accessibility audit
7. User testing for filter discoverability

**Questions for Review:**
- Should filter panel be expanded or collapsed by default?
- Is 35 items per page the right default?
- Should we support URL state for filters?
- Do we need a "Reset to defaults" button?
- Should sort order be included in filter chips?

---

**Document Version:** 1.0.0
**Last Updated:** October 30, 2025
**Status:** Ready for Frontend Development
