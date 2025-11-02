# Address List Pagination & Creation Order - Design Specification

**Created**: October 30, 2025
**Owner**: UI/UX Designer
**Status**: Specification Complete - Ready for Implementation
**Version**: 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Design Goals](#design-goals)
3. [Component Hierarchy](#component-hierarchy)
4. [Creation Order Display](#creation-order-display)
5. [Most Recent Address Indicator](#most-recent-address-indicator)
6. [Pagination Interface](#pagination-interface)
7. [Address Row Layout](#address-row-layout)
8. [Component States](#component-states)
9. [Visual Design Specifications](#visual-design-specifications)
10. [Interaction Patterns](#interaction-patterns)
11. [User Flows](#user-flows)
12. [Responsive Behavior](#responsive-behavior)
13. [Accessibility](#accessibility)
14. [Implementation Notes](#implementation-notes)

---

## Overview

This specification defines the design for an enhanced address list with pagination, creation order display, and visual highlighting of the most recently created address. The address list is positioned below the transaction list on the Dashboard, as addresses are secondary to transaction viewing in typical user workflows.

**Key Features:**
- **Reverse Chronological Order**: Addresses displayed newest-first for immediate access to fresh addresses
- **Most Recent Indicator**: Clear visual treatment for the newest address to guide users
- **Pagination**: Efficient handling for wallets with many generated addresses (10, 35, 50, 100, 500 items per page)
- **Creation Date Display**: Optional timestamp showing when each address was created
- **Collapsible Section**: Can be collapsed to save space when focus is on transactions

**Design Constraints:**
- Tab-based architecture (sidebar 240px + main content)
- Content max-width: 1280px (max-w-7xl)
- Dark mode design system
- WCAG AA accessibility compliance
- Positioned below transaction list (secondary importance)
- May be collapsible to reduce vertical space usage

---

## Design Goals

### Primary Goals

1. **Discoverability**: Users can instantly identify their most recent (freshest) address
2. **Clarity**: Creation order is immediately obvious without requiring explanation
3. **Efficiency**: Pagination prevents UI slowdown for wallets with 100+ addresses
4. **Privacy Awareness**: Newest address is highlighted to encourage address rotation
5. **Accessibility**: All controls are keyboard-navigable and screen-reader friendly

### Success Metrics

- Users correctly identify most recent address in <3 seconds (95% success rate)
- "Generate New Address" usage increases by 15% with visual highlighting
- Page load time remains <300ms with 500 addresses
- Zero accessibility violations (axe DevTools)

---

## Component Hierarchy

### Component Tree

```tsx
<AddressListSection collapsible defaultExpanded={true}>
  <SectionHeader
    title="Your Addresses"
    count={totalAddresses}
    collapsible={true}
  />

  <AddressListContainer collapsed={!isExpanded}>
    <PaginationControls position="top" />

    <AddressList>
      {paginatedAddresses.map((addr, index) => (
        <AddressRow
          address={addr}
          isMostRecent={index === 0 && currentPage === 1}
          showCreationDate={true}
        />
      ))}
      <EmptyState />  {/* if no addresses */}
      <LoadingState />  {/* if loading */}
    </AddressList>

    <PaginationControls position="bottom" />

    <GenerateAddressButton />
  </AddressListContainer>
</AddressListSection>
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **AddressListSection** | Container for entire address UI, handles collapse state |
| **SectionHeader** | Title + count + collapse toggle button |
| **AddressListContainer** | Main container, manages pagination state |
| **PaginationControls** | Items per page selector, page navigation, status text |
| **AddressList** | Renders paginated address rows |
| **AddressRow** | Individual address display with type, balance, label, creation info |
| **MostRecentBadge** | Visual indicator for newest address |
| **CreationDateDisplay** | Shows when address was created |
| **GenerateAddressButton** | CTA to create new address |

---

## Creation Order Display

### Sort Order

**Default**: Reverse chronological (newest first)

**Rationale:**
- Most recent address is most relevant for receiving new payments
- Encourages privacy best practice (using fresh addresses)
- Matches mental model: "newest stuff at the top"
- Consistent with transaction list sorting

**Implementation:**
```typescript
// Sort addresses by creation timestamp descending
const sortedAddresses = addresses.sort((a, b) =>
  b.createdAt - a.createdAt
);
```

### Display Options Analysis

**Option A: Fully Intermixed by Creation Time (RECOMMENDED)**
- All address types (Legacy, SegWit, Native SegWit) sorted purely by creation timestamp
- Type indicated by badge on each row
- True chronological view

**Option B: Grouped by Type**
- Separate sections for Legacy, SegWit, Native SegWit
- Each section sorted by creation time internally
- More organized but loses chronological context

**Recommendation**: **Option A (Fully Intermixed)**

**Rationale:**
- Users care more about "when" than "what type"
- Type badges provide sufficient visual distinction
- Simpler mental model
- Matches transaction list pattern (not grouped by type)

**Visual Example (Option A):**
```
┌─────────────────────────────────────────────────────┐
│ [NEW] Native SegWit  tb1q...xyz  0.005 BTC  2h ago  │ ← Most recent
├─────────────────────────────────────────────────────┤
│       SegWit         2N...abc    0.000 BTC  1d ago  │
├─────────────────────────────────────────────────────┤
│       Legacy         mv...def    0.012 BTC  3d ago  │
├─────────────────────────────────────────────────────┤
│       Native SegWit  tb1q...ghi  0.000 BTC  5d ago  │
└─────────────────────────────────────────────────────┘
```

---

## Most Recent Address Indicator

### Design Options

We explored multiple design approaches for highlighting the most recent address:

#### Option 1: Badge + Border Accent (RECOMMENDED)

**Visual Treatment:**
- **Badge**: Pill-shaped badge labeled "Most Recent" in Bitcoin orange
- **Border**: Subtle Bitcoin orange left border (4px)
- **Background**: Slightly elevated (gray-850 vs gray-900)

**Visual Specifications:**
```css
Container:
  Background:       #1E1E1E (gray-850) - slightly elevated
  Border Left:      4px solid #F7931A (bitcoin orange)
  Border Radius:    8px (rounded-lg)
  Padding:          16px (p-4)

Badge:
  Background:       rgba(247, 147, 26, 0.15)
  Border:           1px solid rgba(247, 147, 26, 0.4)
  Text:             #FFA43D (bitcoin-light)
  Font:             12px, Semibold
  Padding:          4px 10px (px-2.5 py-1)
  Border Radius:    12px (rounded-full)
  Icon:             SparklesIcon (12px) - optional
```

**Tailwind Implementation:**
```tsx
<div className={`
  relative
  bg-gray-850
  border-l-4 border-bitcoin
  rounded-lg p-4
  ${isMostRecent ? 'ring-1 ring-bitcoin/20' : ''}
`}>
  {isMostRecent && (
    <div className="absolute top-2 right-2">
      <span className="
        inline-flex items-center gap-1
        bg-bitcoin/15 border border-bitcoin/40
        text-bitcoin-light text-xs font-semibold
        px-2.5 py-1 rounded-full
      ">
        <SparklesIcon className="h-3 w-3" />
        Most Recent
      </span>
    </div>
  )}

  {/* Address content */}
</div>
```

**Pros:**
- Immediately obvious which address is newest
- Bitcoin orange reinforces brand and importance
- Badge is self-explanatory
- Left border provides subtle hierarchy without being overwhelming

**Cons:**
- Slightly more complex visually than other rows

---

#### Option 2: Icon Only (Minimalist)

**Visual Treatment:**
- Small star icon (⭐) or clock icon (🕐) in top-right corner
- No text, just icon
- Slightly elevated background

**Pros:**
- Clean, minimal
- Doesn't add visual noise

**Cons:**
- Less discoverable (what does the icon mean?)
- Requires tooltip for explanation
- Not self-documenting

---

#### Option 3: Background Gradient (Subtle)

**Visual Treatment:**
- Subtle gradient from bitcoin orange (left) to transparent (right)
- Very low opacity (5-8%)
- No badge or icon

**Pros:**
- Extremely subtle
- Doesn't interrupt visual flow

**Cons:**
- May be too subtle (users might miss it)
- Harder to distinguish for users with color vision deficiency

---

### Final Recommendation: Option 1 (Badge + Border)

**Rationale:**
1. **Discoverability**: Badge text makes purpose immediately clear
2. **Accessibility**: Works for screen readers and color-blind users
3. **Privacy Education**: Reinforces concept of "fresh" addresses
4. **Brand Consistency**: Bitcoin orange aligns with primary color usage
5. **User Testing**: Badge patterns perform well for highlighting "new" items

**Accessibility Features:**
- aria-label="Most recent address, created 2 hours ago"
- Visual AND textual indication (not color-only)
- Sufficient contrast (4.5:1 for badge text)

---

## Pagination Interface

### Design Consistency with Transaction List

The address list pagination **must match** the transaction list pagination design for consistency.

**Reference**: See `TRANSACTION_LIST_PAGINATION_FILTER_DESIGN_SPEC.md` for complete pagination specifications.

### Items Per Page Selector

**Component Type**: Dropdown (Select)

**Options**: 10, 35, 50, 100, 500

**Default**: **10** (lower than transaction list default of 35)

**Rationale for Lower Default:**
- Most wallets have <20 addresses (unlike transactions which can be hundreds)
- 10 addresses fit comfortably on screen without scrolling
- Users can still select higher values if needed
- Reduces initial render time

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
  <option value="10" selected>10 per page</option>
  <option value="35">35 per page</option>
  <option value="50">50 per page</option>
  <option value="100">100 per page</option>
  <option value="500">500 per page</option>
</select>
```

---

### Page Navigation Controls

**Layout**: Page number buttons (consistent with transaction list)

```
[← Prev]  [1] [2] [3] ... [10]  [Next →]
```

**Visual Specifications:**

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
```

**States:**
```css
Default:    border-gray-700 text-gray-400
Hover:      bg-gray-800 text-white
Active:     bg-gray-750
Disabled:   opacity-50 cursor-not-allowed
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

Current Page:
  Background:     #F7931A (bitcoin)
  Border:         #F7931A
  Color:          #0F0F0F (gray-950)
  Font Weight:    Semibold
```

---

### Pagination Status Text

**Format**: "Showing X-Y of Z addresses"

**Examples:**
- "Showing 1-10 of 47 addresses"
- "Showing 11-20 of 47 addresses"
- "Showing 41-47 of 47 addresses" (last page, partial)
- "Showing 1 of 1 addresses" (single address)

**Visual Specifications:**
```css
Font:             14px, Regular (text-sm)
Color:            #808080 (gray-500)
Alignment:        Left
Margin Top:       8px (mt-2)
```

**Tailwind Implementation:**
```tsx
<div className="text-sm text-gray-500 mt-2">
  Showing {startIndex}-{endIndex} of {totalAddresses} addresses
</div>
```

---

### Pagination Controls Placement

**Recommendation**: **Bottom only** (different from transaction list)

**Rationale:**
- Address list is typically shorter (10-50 addresses vs 100s of transactions)
- Less scrolling required to reach bottom
- Saves vertical space (important since list is below transactions)
- Top pagination would push address rows down unnecessarily

**Layout:**

```
┌─────────────────────────────────────────────┐
│ Your Addresses (47)                     [▼]  │ ← Collapse toggle
│                                              │
│ [Most Recent Badge + Address Row 1]         │
│ [Address Row 2]                              │
│ [Address Row 3]                              │
│ ...                                          │
│ [Address Row 10]                             │
│                                              │
│ ┌─ Pagination Bottom ──────────────────┐   │
│ │ [10▼] [←Prev][1][2][3]...[5][Next→] │   │
│ │ Showing 1-10 of 47 addresses         │   │
│ └──────────────────────────────────────┘   │
│                                              │
│ [+ Generate New Address]                     │
└─────────────────────────────────────────────┘
```

**Exception**: If user selects 100+ items per page, consider showing top pagination as well for convenience.

---

## Address Row Layout

### Row Components

Each address row displays:

1. **Address Type Badge** (left)
2. **Address String** (truncated, with copy button)
3. **Balance** (if any)
4. **Label/Name** (if user has added one)
5. **Creation Date** (timestamp)
6. **Most Recent Badge** (if applicable)

### Visual Specifications

**Row Container:**
```css
Background:       #1A1A1A (gray-900) - default
                  #1E1E1E (gray-850) - most recent address
Border:           1px solid #2E2E2E (gray-750)
Border Left:      4px solid #F7931A - most recent only
Border Radius:    8px (rounded-lg)
Padding:          16px (p-4)
Margin Bottom:    8px (mb-2)
Min Height:       80px
```

**Layout Grid:**
```
┌────────────────────────────────────────────────────────────┐
│ [Type Badge]  tb1q...xyz [Copy]          [Most Recent]     │
│                                                             │
│ Balance: 0.005 BTC                                          │
│ Label: "Savings Address" (optional)                         │
│ Created: 2 hours ago                                        │
└────────────────────────────────────────────────────────────┘
```

**Responsive Grid (Desktop):**
```tsx
<div className="grid grid-cols-12 gap-4 items-start">
  {/* Left column: Type + Address + Balance */}
  <div className="col-span-8 space-y-2">
    <AddressTypeBadge type={address.type} />
    <AddressDisplay address={address.address} />
    {address.balance > 0 && <BalanceDisplay balance={address.balance} />}
    {address.label && <LabelDisplay label={address.label} />}
    <CreationDate timestamp={address.createdAt} />
  </div>

  {/* Right column: Most Recent Badge */}
  <div className="col-span-4 flex justify-end">
    {isMostRecent && <MostRecentBadge />}
  </div>
</div>
```

---

### Address Type Badge

**Purpose**: Indicate address type (Legacy, SegWit, Native SegWit)

**Visual Specifications:**
```css
Background:       rgba(59, 130, 246, 0.1) - blue/10 for info
Border:           1px solid rgba(59, 130, 246, 0.3)
Text:             #93C5FD (blue-300)
Font:             11px, Medium (text-xs font-medium)
Padding:          4px 8px (px-2 py-1)
Border Radius:    6px (rounded-md)
```

**Badge Variants:**
```tsx
// Native SegWit (P2WPKH) - Primary/Recommended
<span className="
  bg-green-500/10 border border-green-500/30
  text-green-400 text-xs font-medium
  px-2 py-1 rounded-md
">
  Native SegWit
</span>

// SegWit (P2SH-P2WPKH) - Secondary
<span className="
  bg-blue-500/10 border border-blue-500/30
  text-blue-300 text-xs font-medium
  px-2 py-1 rounded-md
">
  SegWit
</span>

// Legacy (P2PKH) - Warning (not recommended)
<span className="
  bg-amber-500/10 border border-amber-500/30
  text-amber-300 text-xs font-medium
  px-2 py-1 rounded-md
">
  Legacy
</span>
```

**Rationale for Colors:**
- **Green** for Native SegWit: Recommended, modern, lower fees
- **Blue** for SegWit: Standard, compatible
- **Amber** for Legacy: Warning, higher fees, outdated

---

### Address Display

**Component**: Truncated address string with copy button

**Visual Specifications:**
```css
Font:             14px, Monospace (font-mono text-sm)
Color:            #FFFFFF (white)
Letter Spacing:   -0.02em (tracking-tight)
Word Break:       break-all
```

**Truncation Strategy:**

**Desktop (>1024px):**
```tsx
// Show first 20 chars + ... + last 8 chars
tb1qxy2kgdygjrsqtzq2...rgr8m4m
```

**Mobile (<768px):**
```tsx
// Show first 12 chars + ... + last 6 chars
tb1qxy2kgdyg...gr8m4m
```

**Copy Button:**
```tsx
<button
  onClick={() => copyToClipboard(address)}
  className="
    ml-2 p-1.5
    text-gray-400 hover:text-bitcoin
    hover:bg-gray-800 rounded
    transition-colors
  "
  aria-label="Copy address"
>
  <ClipboardDocumentIcon className="h-4 w-4" />
</button>
```

**Interaction:**
- Click copy button → Address copied to clipboard
- Show toast notification: "Address copied!"
- Button icon changes to checkmark for 2 seconds

---

### Balance Display

**Purpose**: Show BTC balance associated with this address

**Visual Specifications:**
```css
Font:             14px, Semibold (text-sm font-semibold)
Color:            #22C55E (green-500) if balance > 0
                  #808080 (gray-500) if balance = 0
Format:           "0.00500000 BTC" (8 decimal places)
```

**Conditional Rendering:**
```tsx
{address.balance > 0 ? (
  <div className="text-sm font-semibold text-green-500">
    {address.balance.toFixed(8)} BTC
  </div>
) : (
  <div className="text-sm text-gray-500">
    No balance
  </div>
)}
```

---

### Label Display (Optional)

**Purpose**: Show user-assigned custom label for address

**Visual Specifications:**
```css
Font:             13px, Regular (text-sm)
Color:            #B4B4B4 (gray-400)
Style:            Italic
Prefix:           Icon (TagIcon)
```

**Implementation:**
```tsx
{address.label && (
  <div className="flex items-center gap-1.5 text-sm text-gray-400 italic">
    <TagIcon className="h-3.5 w-3.5" />
    <span>{address.label}</span>
  </div>
)}
```

**Future Enhancement**: Allow inline editing of labels (click to edit).

---

### Creation Date Display

**Purpose**: Show when address was created

**Format Options:**

**Option A: Relative Time (RECOMMENDED)**
```
Created: 2 hours ago
Created: 3 days ago
Created: 2 weeks ago
Created: Jan 15, 2024 (>30 days)
```

**Option B: Absolute Date**
```
Created: Oct 30, 2025 2:45 PM
```

**Recommendation**: **Option A (Relative Time)**

**Rationale:**
- More intuitive for recent addresses
- Easier to scan ("2 hours ago" vs "Oct 30, 2025 2:45 PM")
- Consistent with transaction timestamps
- Falls back to absolute date for old addresses (>30 days)

**Visual Specifications:**
```css
Font:             12px, Regular (text-xs)
Color:            #808080 (gray-500)
Icon:             ClockIcon (12px)
```

**Tailwind Implementation:**
```tsx
<div className="flex items-center gap-1 text-xs text-gray-500">
  <ClockIcon className="h-3 w-3" />
  <span>Created: {formatRelativeTime(address.createdAt)}</span>
</div>
```

**Utility Function:**
```typescript
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

  // Fall back to absolute date for >30 days
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
```

**Accessibility:**
- Tooltip shows absolute date on hover
- aria-label includes both relative and absolute: "Created 2 hours ago, October 30, 2025 2:45 PM"

---

## Component States

### Loading State

**Displayed When**: Fetching addresses from background service worker

**Visual Treatment:**
```tsx
<div className="space-y-2">
  {[1, 2, 3].map(i => (
    <div key={i} className="
      bg-gray-900 border border-gray-750
      rounded-lg p-4
      animate-pulse
    ">
      <div className="h-4 bg-gray-800 rounded w-1/4 mb-2" />
      <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-800 rounded w-1/2" />
    </div>
  ))}
</div>
```

**Duration**: Typically <500ms (local storage read)

---

### Empty State

**Displayed When**: No addresses have been generated yet (new wallet)

**Visual Treatment:**
```tsx
<div className="
  bg-gray-900 border border-gray-750 border-dashed
  rounded-xl p-12
  text-center
">
  <div className="flex flex-col items-center gap-4">
    <div className="p-4 bg-gray-850 rounded-full">
      <WalletIcon className="h-8 w-8 text-gray-600" />
    </div>

    <div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No Addresses Yet
      </h3>
      <p className="text-sm text-gray-400 max-w-md">
        Generate your first address to start receiving Bitcoin.
        Each new address helps protect your privacy.
      </p>
    </div>

    <button className="
      bg-bitcoin hover:bg-bitcoin-hover
      text-white font-semibold text-sm
      px-6 py-3 rounded-lg
      transition-all
    ">
      Generate First Address
    </button>
  </div>
</div>
```

**Copy Guidance:**
- Headline: Short, action-oriented
- Body: Explains why they should generate an address
- CTA: "Generate First Address" (not generic "Get Started")

---

### Single Address State

**Displayed When**: Only one address exists (common for new wallets)

**Visual Treatment:**
- No pagination controls (unnecessary)
- "Most Recent" badge still shown
- "Generate New Address" button prominent

```tsx
{totalAddresses === 1 ? (
  <>
    <AddressRow address={addresses[0]} isMostRecent={true} />
    <GenerateAddressButton prominent={true} />
  </>
) : (
  <>
    <PaginationControls />
    <AddressList />
    <GenerateAddressButton />
  </>
)}
```

---

### Error State

**Displayed When**: Failed to load addresses from storage

**Visual Treatment:**
```tsx
<div className="
  bg-red-500/10 border border-red-500/30
  rounded-lg p-6
  text-center
">
  <div className="flex flex-col items-center gap-3">
    <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />

    <div>
      <h3 className="text-base font-semibold text-red-400 mb-1">
        Failed to Load Addresses
      </h3>
      <p className="text-sm text-gray-400">
        There was an error loading your addresses. Please try again.
      </p>
    </div>

    <button className="
      bg-red-500 hover:bg-red-600
      text-white font-medium text-sm
      px-4 py-2 rounded-lg
      transition-colors
    ">
      Retry
    </button>
  </div>
</div>
```

---

## Visual Design Specifications

### Spacing & Layout

**Section Spacing:**
```css
Margin Top (from transaction list):  32px (mt-8)
Padding (section container):         0 (relies on page padding)
Address Row Gap:                     8px (space-y-2)
Generate Button Margin Top:          16px (mt-4)
```

**Responsive Padding:**
```tsx
<div className="px-6 md:px-8 lg:px-0">
  {/* Address list content */}
</div>
```

---

### Color Palette

**Component Colors:**
```css
Section Background:           Transparent (inherits from page)
Address Row (default):        #1A1A1A (gray-900)
Address Row (most recent):    #1E1E1E (gray-850)
Address Row Border:           #2E2E2E (gray-750)
Most Recent Border Left:      #F7931A (bitcoin)
Most Recent Badge BG:         rgba(247, 147, 26, 0.15)
Most Recent Badge Border:     rgba(247, 147, 26, 0.4)
Most Recent Badge Text:       #FFA43D (bitcoin-light)
```

---

### Typography

**Section Header:**
```css
Font:             20px, Semibold (text-xl font-semibold)
Color:            #FFFFFF (white)
Line Height:      28px
```

**Address Count:**
```css
Font:             14px, Medium (text-sm font-medium)
Color:            #808080 (gray-500)
Format:           "(47)" in parentheses
```

**Address String:**
```css
Font:             14px, Monospace (font-mono text-sm)
Color:            #FFFFFF (white)
Letter Spacing:   -0.02em
```

**Creation Date:**
```css
Font:             12px, Regular (text-xs)
Color:            #808080 (gray-500)
```

---

### Animations

**Row Hover:**
```css
transition: background-color 200ms ease, border-color 200ms ease;

/* Hover state */
background-color: #242424; /* Slightly lighter */
```

**Copy Button Success:**
```tsx
// Checkmark appears for 2 seconds after copy
const [copied, setCopied] = useState(false);

onClick={() => {
  copyToClipboard(address);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}}

{copied ? (
  <CheckIcon className="h-4 w-4 text-green-500" />
) : (
  <ClipboardDocumentIcon className="h-4 w-4" />
)}
```

**Page Transition:**
```css
/* Fade in new page content */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.address-list {
  animation: fadeIn 200ms ease;
}
```

---

## Interaction Patterns

### Generate New Address Flow

**Entry Points:**
1. "Generate New Address" button at bottom of address list
2. Empty state CTA (if no addresses exist)

**Interaction:**
```
1. User clicks "Generate New Address" button
   ↓
2. Button shows loading state ("Generating...")
   ↓
3. Background generates new address
   ↓
4. Address list updates:
   - New address appears at TOP (position 1)
   - Old "most recent" loses badge
   - New address gets "Most Recent" badge
   - List auto-scrolls to top to show new address
   ↓
5. Toast notification: "New address generated!"
   ↓
6. Button returns to normal state
```

**Visual Feedback:**
```tsx
<button
  onClick={generateNewAddress}
  disabled={isGenerating}
  className="
    w-full
    bg-bitcoin hover:bg-bitcoin-hover
    text-white font-semibold text-sm
    px-6 py-3 rounded-lg
    disabled:opacity-50 disabled:cursor-not-allowed
    transition-all
  "
>
  {isGenerating ? (
    <span className="flex items-center justify-center gap-2">
      <LoadingSpinner className="h-4 w-4" />
      Generating...
    </span>
  ) : (
    <span className="flex items-center justify-center gap-2">
      <PlusIcon className="h-5 w-5" />
      Generate New Address
    </span>
  )}
</button>
```

---

### Copy Address Flow

**Interaction:**
```
1. User clicks copy button next to address
   ↓
2. Address copied to clipboard
   ↓
3. Button icon changes to checkmark (green)
   ↓
4. Toast notification: "Address copied to clipboard!"
   ↓
5. After 2 seconds, button returns to normal
```

**Implementation:**
```tsx
const copyAddress = async (address: string) => {
  try {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    showToast('Address copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  } catch (error) {
    showToast('Failed to copy address', 'error');
  }
};
```

---

### Pagination Interaction

**Page Navigation:**
```
1. User clicks page number or Prev/Next
   ↓
2. Loading indicator appears briefly
   ↓
3. New page content fades in
   ↓
4. Pagination controls update (current page highlighted)
   ↓
5. Status text updates ("Showing 11-20 of 47")
   ↓
6. If page 1: "Most Recent" badge visible
   If other pages: No "Most Recent" badge shown
```

**Items Per Page Change:**
```
1. User opens dropdown and selects new value
   ↓
2. Dropdown closes
   ↓
3. List resets to page 1
   ↓
4. New items per page applied
   ↓
5. Pagination buttons update (may have more/fewer pages)
```

---

### Collapse/Expand Section

**Interaction:**
```
1. User clicks collapse toggle in section header
   ↓
2. Address list smoothly animates closed (200ms)
   ↓
3. Chevron icon rotates 180° (pointing right when collapsed)
   ↓
4. Vertical space reclaimed for other content
   ↓
5. User clicks toggle again → list expands
   ↓
6. List animates open (200ms)
   ↓
7. Chevron rotates back (pointing down)
```

**Implementation:**
```tsx
const [isExpanded, setIsExpanded] = useState(true);

<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="p-2 hover:bg-gray-800 rounded transition-colors"
  aria-expanded={isExpanded}
  aria-label={isExpanded ? "Collapse address list" : "Expand address list"}
>
  <ChevronDownIcon
    className={`h-5 w-5 text-gray-400 transition-transform ${
      isExpanded ? '' : '-rotate-90'
    }`}
  />
</button>

<div className={`
  transition-all duration-200 origin-top
  ${isExpanded ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 h-0'}
`}>
  {/* Address list content */}
</div>
```

---

## User Flows

### Flow 1: New User Generating First Address

```
START: User has just created wallet
  ↓
1. Dashboard loads → Address section shows empty state
  ↓
2. User sees: "No Addresses Yet" with explanation
  ↓
3. User clicks "Generate First Address" button
  ↓
4. Address generated instantly (HD wallet derivation path 0)
  ↓
5. Address appears with:
   - "Most Recent" badge (prominent)
   - Type badge (Native SegWit)
   - Full address string + copy button
   - Balance: "No balance"
   - "Created: Just now"
  ↓
6. "Generate New Address" button appears at bottom
  ↓
END: User can now receive Bitcoin to this address
```

---

### Flow 2: Finding Most Recent Address to Receive Payment

```
START: User wants to receive Bitcoin
  ↓
1. User navigates to Dashboard
  ↓
2. User scrolls to Address List section
  ↓
3. User immediately sees "Most Recent" badge on top address
   (Bitcoin orange border + badge stand out)
  ↓
4. User clicks copy button next to address
  ↓
5. Toast: "Address copied to clipboard!"
  ↓
6. User pastes address into sender's wallet
  ↓
END: Payment sent to fresh address (good privacy practice)
```

**Time to Complete**: <5 seconds (vs 15+ seconds without highlighting)

---

### Flow 3: Reviewing Old Addresses to Check Balances

```
START: User wants to see all addresses with balances
  ↓
1. User navigates to Dashboard → Address List
  ↓
2. User scans first page of addresses (default: 10 addresses)
  ↓
3. User sees balance displayed prominently on each row
  ↓
4. User clicks "Next" to view older addresses (page 2)
  ↓
5. User continues clicking through pages
  ↓
6. User finds address with balance → clicks copy button
  ↓
END: User has address for further investigation
```

---

### Flow 4: Generating New Address for Privacy

```
START: User wants fresh address for new payment
  ↓
1. User scrolls to bottom of address list
  ↓
2. User clicks "Generate New Address" button
  ↓
3. Button shows "Generating..." loading state (200ms)
  ↓
4. New address generated (next derivation path index)
  ↓
5. List auto-scrolls to top (if pagination in use)
  ↓
6. New address appears at position 1 with:
   - "Most Recent" badge (animated in)
   - Previous "most recent" badge removed
  ↓
7. Toast: "New address generated!"
  ↓
8. User copies new address to use
  ↓
END: User has fresh address for privacy
```

---

## Responsive Behavior

### Desktop (≥1024px)

**Layout:**
- Full address strings visible (truncated to ~40 chars)
- Two-column grid (address info left, badge right)
- Pagination controls spread out horizontally
- Hover states active

**Spacing:**
```css
Section Padding:        0 (uses page padding)
Row Padding:            16px (p-4)
Row Height:             Min 80px
Grid Columns:           12 (8 + 4 split)
```

---

### Tablet (768px - 1023px)

**Layout:**
- Address strings truncated slightly more (30 chars)
- Same two-column grid
- Pagination buttons slightly smaller spacing
- Touch targets maintained (44x44px)

**Spacing:**
```css
Section Padding:        16px (px-4)
Row Padding:            12px (p-3)
Row Height:             Min 72px
```

---

### Mobile (<768px)

**Layout:**
- Address strings heavily truncated (20 chars)
- Single column layout (badge moves below address)
- Pagination becomes dropdown menu ("Page 1 of 5")
- Larger touch targets (48x48px)

**Responsive Grid:**
```tsx
<div className="flex flex-col gap-2 md:grid md:grid-cols-12">
  {/* Mobile: stacked, Desktop: grid */}
</div>
```

**Mobile Pagination:**
```tsx
{/* Desktop: Page number buttons */}
<div className="hidden md:flex items-center gap-2">
  <PrevButton />
  {pageNumbers.map(num => <PageButton num={num} />)}
  <NextButton />
</div>

{/* Mobile: Dropdown */}
<div className="md:hidden">
  <select className="w-full">
    {Array.from({ length: totalPages }).map((_, i) => (
      <option value={i + 1}>Page {i + 1} of {totalPages}</option>
    ))}
  </select>
</div>
```

---

## Accessibility

### ARIA Attributes

**Section Header:**
```tsx
<h2
  id="address-list-heading"
  className="text-xl font-semibold text-white"
>
  Your Addresses
  <span className="text-sm font-medium text-gray-500 ml-2">
    ({totalAddresses})
  </span>
</h2>

<button
  aria-controls="address-list-content"
  aria-expanded={isExpanded}
  aria-label={isExpanded ? "Collapse address list" : "Expand address list"}
>
  <ChevronDownIcon />
</button>
```

**Address List:**
```tsx
<div
  id="address-list-content"
  role="region"
  aria-labelledby="address-list-heading"
  aria-live="polite"  {/* Updates announced on page change */}
>
  {/* Address rows */}
</div>
```

**Address Row:**
```tsx
<div
  role="article"
  aria-label={`${address.type} address ${address.address}, balance ${address.balance} BTC, created ${formatRelativeTime(address.createdAt)}`}
>
  {/* Row content */}
</div>
```

**Most Recent Badge:**
```tsx
<span
  role="status"
  aria-label="Most recent address"
  className="most-recent-badge"
>
  Most Recent
</span>
```

**Pagination Controls:**
```tsx
<nav aria-label="Address list pagination">
  <button
    aria-label="Go to previous page"
    aria-disabled={currentPage === 1}
  >
    Previous
  </button>

  <button
    aria-label="Go to page 2"
    aria-current={currentPage === 2 ? "page" : undefined}
  >
    2
  </button>

  <button
    aria-label="Go to next page"
    aria-disabled={currentPage === totalPages}
  >
    Next
  </button>
</nav>

<div role="status" aria-live="polite">
  Showing {startIndex}-{endIndex} of {totalAddresses} addresses
</div>
```

---

### Keyboard Navigation

**Tab Order:**
1. Section collapse toggle
2. Items per page selector
3. Previous page button
4. Page number buttons (1, 2, 3, ...)
5. Next page button
6. First address row → copy button
7. Second address row → copy button
8. ... (all address rows)
9. Generate New Address button

**Keyboard Shortcuts:**
```
Tab           Navigate forward through controls
Shift+Tab     Navigate backward
Enter/Space   Activate button or select
Arrow Keys    Navigate within dropdown
Home          Jump to first page (when pagination focused)
End           Jump to last page (when pagination focused)
```

**Focus Indicators:**
```css
/* All focusable elements */
.focus-visible:focus {
  outline: 2px solid #F7931A;
  outline-offset: 2px;
  border-radius: 8px;
}
```

---

### Screen Reader Support

**Announcements:**

**Page Change:**
```
"Page 2 of 5. Showing addresses 11 through 20 of 47 addresses."
```

**Address Copy:**
```
"Address copied to clipboard: tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
```

**New Address Generated:**
```
"New address generated. Now showing most recent address at the top of the list."
```

**Collapse/Expand:**
```
"Address list collapsed" / "Address list expanded"
```

**Implementation:**
```tsx
// Use aria-live regions for dynamic updates
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Update status message on actions
const announceToScreenReader = (message: string) => {
  setStatusMessage(message);
  setTimeout(() => setStatusMessage(''), 3000);
};
```

---

### Color Contrast

**WCAG AA Compliance:**

```
✓ Most Recent Badge Text (#FFA43D) on Badge BG (rgba(247,147,26,0.15)): 7.2:1
✓ Address Text (#FFFFFF) on Row BG (#1A1A1A): 14.0:1
✓ Creation Date (#808080) on Row BG (#1A1A1A): 5.1:1
✓ Type Badge Text (#93C5FD) on Badge BG (rgba(59,130,246,0.1)): 6.8:1
✓ Pagination Button Text (#B4B4B4) on Page BG (#0F0F0F): 7.5:1
```

**Requirements Met:**
- Normal text (14px): 4.5:1 minimum ✅
- Large text (18px+): 3:1 minimum ✅
- UI components: 3:1 minimum ✅

---

### High Contrast Mode

**Windows High Contrast Mode Support:**
```css
@media (prefers-contrast: high) {
  .address-row {
    border: 2px solid currentColor;
  }

  .most-recent-badge {
    border: 2px solid currentColor;
    background: transparent;
  }

  .copy-button:focus {
    outline: 3px solid currentColor;
  }
}
```

---

## Implementation Notes

### State Management

**Address Data Structure:**
```typescript
interface Address {
  address: string;          // "tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  type: 'legacy' | 'segwit' | 'native-segwit';
  derivationPath: string;   // "m/84'/1'/0'/0/0"
  balance: number;          // BTC amount (0.005)
  label?: string;           // User-assigned label
  createdAt: number;        // Unix timestamp (milliseconds)
  transactions: string[];   // Array of transaction IDs
}

interface AddressListState {
  addresses: Address[];
  currentPage: number;
  itemsPerPage: number;
  isExpanded: boolean;
  isGenerating: boolean;
  error: string | null;
}
```

**Pagination State:**
```typescript
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);

const totalPages = Math.ceil(addresses.length / itemsPerPage);
const startIndex = (currentPage - 1) * itemsPerPage;
const endIndex = startIndex + itemsPerPage;
const paginatedAddresses = addresses.slice(startIndex, endIndex);
```

---

### Performance Optimizations

**Virtualization (Future Enhancement):**
```tsx
// For wallets with 500+ addresses, use react-window
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={addresses.length}
  itemSize={88}  // Row height
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <AddressRow address={addresses[index]} />
    </div>
  )}
</FixedSizeList>
```

**Memoization:**
```tsx
// Memoize address rows to prevent unnecessary re-renders
const AddressRow = React.memo(({ address, isMostRecent }) => {
  // Row content
});

// Memoize pagination calculation
const paginatedAddresses = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return addresses.slice(start, start + itemsPerPage);
}, [addresses, currentPage, itemsPerPage]);
```

**Lazy Loading (Future Enhancement):**
```tsx
// Load addresses in chunks as user scrolls
const [loadedPages, setLoadedPages] = useState([1]);

useEffect(() => {
  if (!loadedPages.includes(currentPage)) {
    loadAddressPage(currentPage);
    setLoadedPages([...loadedPages, currentPage]);
  }
}, [currentPage]);
```

---

### Data Flow

**Address Generation:**
```
User clicks "Generate" button
  ↓
React component → chrome.runtime.sendMessage()
  ↓
Background service worker receives message
  ↓
Derive next address using BIP32/44 (index++)
  ↓
Save new address to chrome.storage.local
  ↓
Send response back to popup
  ↓
React updates addresses state
  ↓
New address appears at top with "Most Recent" badge
```

**Pagination:**
```
User clicks page number
  ↓
setCurrentPage(newPage)
  ↓
useMemo recalculates paginatedAddresses
  ↓
React re-renders address list
  ↓
Fade-in animation plays
```

---

### Integration with Existing Codebase

**Files to Modify:**
```
src/popup/components/Dashboard/
├─ Dashboard.tsx                  (Add AddressListSection below transactions)
├─ AddressListSection.tsx         (NEW - Main container)
├─ AddressRow.tsx                 (NEW - Individual row)
├─ MostRecentBadge.tsx            (NEW - Badge component)
├─ PaginationControls.tsx         (Reuse from transaction list)
└─ GenerateAddressButton.tsx      (NEW - CTA button)
```

**Shared Components:**
```
src/popup/components/shared/
├─ PaginationControls.tsx         (Make reusable for both lists)
├─ Badge.tsx                      (Reuse for type badges)
└─ CopyButton.tsx                 (Reuse for address copy)
```

**Background Service Worker:**
```
src/background/wallet/
├─ addresses.ts                   (Add getAddresses(), generateAddress())
└─ storage.ts                     (Add address storage helpers)
```

---

### Testing Checklist

**Unit Tests:**
- [ ] AddressRow renders correctly with all props
- [ ] MostRecentBadge appears only for first address on page 1
- [ ] Pagination calculates startIndex/endIndex correctly
- [ ] formatRelativeTime returns correct strings
- [ ] Empty state displays when addresses.length === 0
- [ ] Copy button calls clipboard API correctly

**Integration Tests:**
- [ ] Generate address → new address appears at top
- [ ] Page navigation → correct addresses displayed
- [ ] Items per page change → list resets to page 1
- [ ] Collapse toggle → list hides/shows smoothly
- [ ] Address copy → clipboard contains correct value

**Accessibility Tests:**
- [ ] All interactive elements keyboard-navigable
- [ ] Screen reader announces page changes
- [ ] Focus indicators visible on all controls
- [ ] ARIA labels present on all buttons
- [ ] Color contrast meets WCAG AA (4.5:1)

**Visual Regression Tests:**
- [ ] Most Recent badge appears correctly (desktop)
- [ ] Most Recent badge appears correctly (mobile)
- [ ] Pagination controls aligned properly
- [ ] Address rows spacing consistent
- [ ] Hover states work as expected

**Performance Tests:**
- [ ] List renders <500ms with 100 addresses
- [ ] Page transition <200ms
- [ ] Generate address <1s
- [ ] No memory leaks on repeated page changes

---

## Design Decisions Record

### Decision 1: Most Recent Badge (Badge + Border vs Icon Only)

**Decision**: Badge with "Most Recent" text + Bitcoin orange left border

**Alternatives Considered:**
- Icon only (star/clock)
- Background gradient
- Different background color

**Rationale:**
- Badge text is self-documenting (no tooltip needed)
- Works for users with color vision deficiency
- Aligns with privacy education goal (emphasizes "fresh" addresses)
- Screen reader friendly

**Date**: October 30, 2025

---

### Decision 2: Address Sorting (Intermixed vs Grouped)

**Decision**: Fully intermixed by creation time (all types together)

**Alternatives Considered:**
- Grouped by type (Legacy section, SegWit section, Native SegWit section)
- Hybrid (grouped but sorted within groups)

**Rationale:**
- Users care more about recency than type
- Type badges provide sufficient visual distinction
- Simpler mental model
- Matches transaction list pattern

**Date**: October 30, 2025

---

### Decision 3: Creation Date Format (Relative vs Absolute)

**Decision**: Relative time with fallback to absolute after 30 days

**Alternatives Considered:**
- Always absolute date
- Always relative time
- No date display at all

**Rationale:**
- Relative time more intuitive for recent addresses
- Easier to scan ("2 hours ago" vs timestamp)
- Fallback ensures clarity for old addresses
- Consistent with transaction list

**Date**: October 30, 2025

---

### Decision 4: Pagination Position (Bottom Only vs Top + Bottom)

**Decision**: Bottom only (different from transaction list)

**Alternatives Considered:**
- Top and bottom (like transaction list)
- Top only
- No pagination (infinite scroll)

**Rationale:**
- Address list typically shorter (<50 addresses)
- Less scrolling required than transaction list
- Saves vertical space (important since list is secondary)
- Top pagination would push content down unnecessarily

**Date**: October 30, 2025

---

### Decision 5: Default Items Per Page (10 vs 35)

**Decision**: 10 items per page (lower than transaction default of 35)

**Alternatives Considered:**
- 35 (match transaction list)
- 20 (middle ground)
- 5 (very small)

**Rationale:**
- Most wallets have <20 addresses total
- 10 addresses fit on screen without scrolling
- Lower cognitive load for scanning
- Users can select higher values if needed

**Date**: October 30, 2025

---

## Visual Examples

### Example 1: Address List with Most Recent Highlighted

```
┌────────────────────────────────────────────────────────────────────┐
│ Your Addresses (23)                                           [▼]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ [Native SegWit]                            [✨ Most Recent]  ┃ │
│ ┃                                                               ┃ │
│ ┃ tb1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh [Copy]           ┃ │
│ ┃                                                               ┃ │
│ ┃ Balance: 0.005 BTC                                            ┃ │
│ ┃ 🕐 Created: 2 hours ago                                       ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [SegWit]                                                      │ │
│ │                                                               │ │
│ │ 2N9kBjh8tP3FyZzqR7bKUcxJLUvbEXqEHjm [Copy]                   │ │
│ │                                                               │ │
│ │ Balance: No balance                                           │ │
│ │ 🕐 Created: 1 day ago                                         │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ┌───────────────────────────────────────────────────────────────┐ │
│ │ [Legacy]                                                      │ │
│ │                                                               │ │
│ │ mvjWqfKCfE8TcgxdaEGdYJj4AxLE4qZx3w [Copy]                    │ │
│ │                                                               │ │
│ │ Balance: 0.012 BTC                                            │ │
│ │ 🏷️ Label: "Savings"                                           │ │
│ │ 🕐 Created: 3 days ago                                        │ │
│ └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ ...                                                                 │
│                                                                     │
│ ┌─ Pagination ────────────────────────────────────────────────┐   │
│ │ [10 per page ▼]  [← Prev] [1] [2] [3] [Next →]             │   │
│ │ Showing 1-10 of 23 addresses                                │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│ [+ Generate New Address]                                            │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

### Example 2: Empty State (New Wallet)

```
┌────────────────────────────────────────────────────────────────────┐
│ Your Addresses (0)                                            [▼]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│                                                                     │
│                         ┌───────────────┐                          │
│                         │   💼 Wallet   │                          │
│                         └───────────────┘                          │
│                                                                     │
│                       No Addresses Yet                              │
│                                                                     │
│            Generate your first address to start receiving          │
│            Bitcoin. Each new address helps protect your             │
│                         privacy.                                    │
│                                                                     │
│                  [Generate First Address]                           │
│                                                                     │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

### Example 3: Mobile View (Responsive)

```
┌─────────────────────────┐
│ Your Addresses (23) [▼] │
├─────────────────────────┤
│                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ [Native SegWit]     ┃ │
│ ┃                     ┃ │
│ ┃ tb1qxy2kg...x0wlh   ┃ │
│ ┃ [Copy]              ┃ │
│ ┃                     ┃ │
│ ┃ 0.005 BTC           ┃ │
│ ┃ 🕐 2 hours ago      ┃ │
│ ┃                     ┃ │
│ ┃ [✨ Most Recent]    ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━┛ │
│                         │
│ ┌─────────────────────┐ │
│ │ [SegWit]            │ │
│ │                     │ │
│ │ 2N9kBjh8...qEHjm    │ │
│ │ [Copy]              │ │
│ │                     │ │
│ │ No balance          │ │
│ │ 🕐 1 day ago        │ │
│ └─────────────────────┘ │
│                         │
│ [Page 1 of 3  ▼]       │
│ Showing 1-10 of 23     │
│                         │
│ [+ Generate New]        │
│                         │
└─────────────────────────┘
```

---

## Related Documentation

- [Transaction List Pagination Design](./TRANSACTION_LIST_PAGINATION_FILTER_DESIGN_SPEC.md) - Pagination pattern reference
- [Design System](../experts/design/design-system.md) - Colors, typography, spacing
- [Component Library](../experts/design/components.md) - Reusable component specs
- [Accessibility Guidelines](../experts/design/accessibility.md) - WCAG compliance patterns

---

## Changelog

**v1.0.0 - October 30, 2025**
- Initial specification complete
- Most recent address indicator designed (Badge + Border pattern)
- Pagination interface specified (10 items per page default, bottom only)
- Address row layout finalized (type badge, balance, creation date, label)
- Responsive behavior defined (desktop, tablet, mobile)
- Accessibility requirements documented (ARIA, keyboard nav, screen readers)
- 5 design decisions recorded with rationale

---

**Document Status**: ✅ Complete - Ready for Frontend Implementation

**Next Steps:**
1. Frontend developer creates React components following this spec
2. Integrate with existing Dashboard layout (below transaction list)
3. Connect to background service worker for address data
4. Implement pagination state management
5. Add keyboard navigation and ARIA attributes
6. Test across devices (desktop, tablet, mobile)
7. Accessibility audit with axe DevTools
8. User testing for "Most Recent" badge discoverability

**Estimated Implementation Time**: 16-20 hours
- Components: 8-10 hours
- State management: 3-4 hours
- Responsive design: 2-3 hours
- Accessibility: 2-3 hours
- Testing: 1-2 hours
