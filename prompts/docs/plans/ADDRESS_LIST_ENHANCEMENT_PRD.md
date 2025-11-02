# Address List Enhancement - Product Requirements Document

**Version**: 1.0
**Date**: October 30, 2025
**Status**: PRD Complete - Awaiting Prioritization
**Target Release**: v0.12.0
**Owner**: Product Manager
**Priority**: P1 (Should-Have)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Goals & Success Metrics](#goals--success-metrics)
4. [User Stories & Requirements](#user-stories--requirements)
5. [Feature Specifications](#feature-specifications)
6. [Technical Architecture](#technical-architecture)
7. [Design Specifications](#design-specifications)
8. [Implementation Plan](#implementation-plan)
9. [Testing Strategy](#testing-strategy)
10. [Release Strategy](#release-strategy)
11. [Open Questions](#open-questions)
12. [Related Documentation](#related-documentation)

---

## Executive Summary

### What We're Building

Enhanced address list feature with:
- **Reverse chronological sort order** (newest addresses first)
- **Visual indicator** for the most recent address
- **Pagination controls** (configurable items per page: 10, 35, 50, 100, 500)
- **Consistent UX** with transaction list (same pagination patterns)

### Why We're Building This

1. **User Need**: Most recent address is most important (users typically generate and use latest address)
2. **Consistency**: Mirrors transaction list sort order for cognitive consistency
3. **Scalability**: Addresses accumulate for power users, pagination prevents UI clutter
4. **UX Improvement**: Clear visual indicators reduce cognitive load

### Key Benefits

- **Quick Access**: Most recent address immediately visible at top
- **Consistent Experience**: Same sort order and pagination as transaction list
- **Clean UI**: Pagination prevents overwhelming long address lists
- **Easy Navigation**: Jump between pages, configure display density

### Estimated Effort

**Total**: 24-32 hours (~1.5 weeks)
- Frontend Developer: 16 hours
- UI/UX Designer: 4 hours
- QA Engineer: 8 hours
- Product Manager: 4 hours

---

## Problem Statement

### Current State

**Existing Implementation**:
- Address list displays addresses in creation order (oldest first)
- No pagination controls
- No visual indicator for newest address
- All addresses displayed at once (scroll for longer lists)
- Inconsistent with transaction list UX (which shows newest-first)

**Pain Points**:
1. **Cognitive Load**: Users must scan entire list to find newest address
2. **Inconsistent UX**: Transaction list shows newest-first, address list shows oldest-first
3. **Scalability Issues**: Power users with 50+ addresses have unwieldy lists
4. **Unclear Priority**: No visual cue indicating which address is most current

### User Scenarios

**Scenario 1: New User Generating First Addresses**
- User generates 3-5 addresses for different purposes
- Each time they return, they want to use the **newest** address (best privacy)
- Current UI: Must scroll to bottom to find newest address
- Expected: Newest address at top, clearly marked

**Scenario 2: Power User with Many Addresses**
- User has generated 50+ addresses over time
- Wants to verify which address is current
- Current UI: Must scroll through all 50+ addresses
- Expected: Newest address at top + pagination for viewing older addresses

**Scenario 3: Address Reuse Prevention**
- User received funds to address #5
- Wants to generate new address (privacy best practice)
- Current UI: No easy way to identify which is newest
- Expected: "Most Recent" badge on newest address

### Why This Matters

**Privacy**: Bitcoin privacy best practices recommend generating new addresses frequently. Users need to **easily identify and use their newest address**.

**Usability**: Cognitive consistency across the wallet (transaction list and address list should follow same patterns).

**Scalability**: Active users will accumulate addresses over time. UI must scale gracefully.

---

## Goals & Success Metrics

### Primary Goals

1. **Improve Address Discoverability**: Users can immediately identify newest address
2. **Consistent UX**: Address list follows same patterns as transaction list (newest-first, pagination)
3. **Scalability**: Support users with 100+ addresses without UI degradation
4. **Privacy Support**: Make it easy to follow "use fresh addresses" best practice

### Success Metrics

#### Adoption Metrics (3 months post-release)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Users with 20+ addresses use pagination | 80% | Analytics event tracking |
| Awareness of newest address indicator | 90% | User testing interviews |
| Users report finding newest address "very easy" | 70% | Post-release survey |

#### Usability Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Time to identify newest address (vs. baseline) | 50% reduction | User testing task completion time |
| User confusion (support tickets) | <2% | Support ticket analysis |
| Correct identification of "Most Recent" badge | 95% | User comprehension testing |

#### Satisfaction Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Feature satisfaction rating | 4.0/5.0 | In-app satisfaction survey |
| Consistency with transaction list feedback | Positive | User feedback analysis |
| Feature request rate for address improvements | Reduced | Support ticket tracking |

#### Performance Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Initial render time (10 addresses) | <100ms | Performance profiling |
| Sort operation time (100 addresses) | <50ms | Performance profiling |
| Pagination transition time | <200ms | Performance profiling |

---

## User Stories & Requirements

### Epic: Address List Enhancement

#### User Story 1: Sort Addresses by Creation Order

**As a** wallet user
**I want** addresses displayed newest-first
**So that** I can immediately see my most recent address

**Acceptance Criteria**:
- [ ] Addresses are sorted by BIP44 derivation index (descending)
- [ ] Newest address (highest index) appears at top of list
- [ ] Oldest address (lowest index, typically index 0) appears at bottom
- [ ] Sort order persists across account switches
- [ ] Sort order consistent for all address types (Legacy, SegWit, Native SegWit)
- [ ] Change addresses (internal chain) are hidden by default

**Priority**: P0 (Critical)
**Estimated Effort**: 8 hours

---

#### User Story 2: Visual Indicator for Newest Address

**As a** wallet user
**I want** a clear visual indicator on my newest address
**So that** I know which address to use for receiving Bitcoin

**Acceptance Criteria**:
- [ ] Most recent address has visible "Most Recent" or "Newest" badge
- [ ] Badge is prominent but not overwhelming
- [ ] Badge uses accent color from design system
- [ ] Screen readers announce "Most Recent Address" for accessibility
- [ ] Badge displays correctly on mobile/responsive layouts
- [ ] Badge updates immediately when new address is generated

**Priority**: P0 (Critical)
**Estimated Effort**: 8 hours

---

#### User Story 3: Pagination Controls

**As a** power user with many addresses
**I want** pagination controls for the address list
**So that** I can navigate through my addresses efficiently

**Acceptance Criteria**:
- [ ] Pagination controls visible when addresses exceed items-per-page
- [ ] Items per page options: 10, 35, 50, 100, 500 (same as transaction list)
- [ ] Default items per page: 10 addresses
- [ ] Navigation controls: Previous, Next, Page Picker
- [ ] "Showing X-Y of Z addresses" counter displays correctly
- [ ] Items-per-page preference persists during session
- [ ] Reset to page 1 on account switch
- [ ] Pagination controls match transaction list design (consistency)

**Priority**: P1 (High)
**Estimated Effort**: 12 hours

---

#### User Story 4: Empty and Single-Address States

**As a** new wallet user
**I want** helpful messages when I have no addresses or just one
**So that** I understand the address list functionality

**Acceptance Criteria**:
- [ ] No addresses: "No addresses generated. Receive Bitcoin to create your first address."
- [ ] Single address: "Most Recent" badge still displays, no pagination
- [ ] Empty state has clear call-to-action
- [ ] Loading state displays skeleton animation
- [ ] Error state shows retry option

**Priority**: P2 (Nice to Have)
**Estimated Effort**: 2 hours

---

## Feature Specifications

### Sort Order Specification

#### Primary Sort

**Field**: BIP44 Derivation Path Index
**Order**: Descending (highest index first)

**Rationale**: Derivation path index directly corresponds to creation order. Higher index = more recently created address.

#### Address Type Handling

**Approach**: Intermix all address types by creation order

**Example** (account with mixed address types):
```
[MOST RECENT] tb1qxyz...abc  Address #15  (Native SegWit)  Index: 15
              3abc...xyz123  Address #14  (SegWit)         Index: 14
              tb1qdef...ghi  Address #13  (Native SegWit)  Index: 13
              n9876...54321  Address #12  (Legacy)         Index: 12
              ...
              tb1q123...456  Address #1   (Native SegWit)  Index: 1
              tb1qabc...000  Address #0   (Native SegWit)  Index: 0
```

**Rationale**: Users think chronologically (time order), not by address type. Intermixing provides natural flow.

**Future Enhancement**: Add optional "Filter by Address Type" if users request it.

#### Change Address Handling

**Default Behavior**: Hide internal (change) addresses

**Rationale**: Most users don't need to see change addresses. They are generated automatically by the wallet and not intended for manual sharing.

**Future Enhancement**: Add "Show Change Addresses" toggle for advanced users who want to audit change address usage.

---

### Visual Indicator Specification

#### Design Options (for UI/UX Designer to decide)

**Option 1: Badge + Subtle Highlight** (Recommended)
```
┌─────────────────────────────────────────────────────────┐
│ [MOST RECENT] tb1qxyz...abc  Address #15  Native SegWit │  ← Light blue/green background
│               0.00123 BTC                                │
└─────────────────────────────────────────────────────────┘
│               tb1qdef...ghi  Address #14  Native SegWit │
│               0.00000 BTC                                │
└─────────────────────────────────────────────────────────┘
```

**Option 2: Icon Only**
```
⭐ tb1qxyz...abc  Address #15  Native SegWit  0.00123 BTC
   tb1qdef...ghi  Address #14  Native SegWit  0.00000 BTC
```

**Option 3: Badge Text Only**
```
[NEWEST] tb1qxyz...abc  Address #15  Native SegWit  0.00123 BTC
         tb1qdef...ghi  Address #14  Native SegWit  0.00000 BTC
```

**Recommendation**: Option 1 (Badge + Highlight)
- **Accessibility**: Text label works for screen readers
- **Visual**: Background highlight adds prominence without relying solely on color
- **Clear**: Combination of text + visual treatment is most explicit

#### Badge Text Options

- "Most Recent" (descriptive, clear)
- "Newest" (shorter, still clear)
- "Latest" (alternative)
- "Current" (implies active use)

**Recommendation**: "Most Recent" - Most explicit and descriptive

#### Color Specification

**Accent Color**: Use existing accent color from design system
**Background Highlight**: Light accent color (10-15% opacity)
**Badge Background**: Solid accent color
**Badge Text**: White or high-contrast color

**Accessibility**: Ensure 4.5:1 contrast ratio minimum (WCAG 2.1 Level AA)

---

### Pagination Specification

#### Items Per Page Options

**Options**: 10, 35, 50, 100, 500

**Default**: 10 addresses per page

**Rationale**:
- Consistency with transaction list
- Typical users have 5-20 addresses (fits in default 10)
- Power users can increase to 50 or 100
- Edge case (200+ addresses) can use 500

#### Pagination Controls Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Showing 1-10 of 47 addresses                                │
│                                                              │
│  Items per page: [10 ▼]  [◀ Previous]  Page 1 of 5  [Next ▶] │
│                                                              │
│  Jump to page: [___]                                         │
└──────────────────────────────────────────────────────────────┘
```

**Components**:
1. **Item Counter**: "Showing X-Y of Z addresses"
2. **Items Per Page Dropdown**: Configurable display density
3. **Previous/Next Buttons**: Sequential navigation
4. **Page Indicator**: Current page / total pages
5. **Page Picker**: Jump directly to specific page

#### Pagination State Management

**Session Persistence**:
- Items-per-page preference: Persist during session
- Current page number: Reset to 1 on account switch
- Current page number: Persist during same account view

**Initial State**:
- Default to page 1 (newest addresses)
- Default to 10 items per page

**Boundary Handling**:
- Disable "Previous" button on page 1
- Disable "Next" button on last page
- Page picker validates input (1 to max page)

---

### Technical Specifications

#### Data Structure

**Address Object** (existing):
```typescript
interface Address {
  address: string;           // Bitcoin address (base58 or bech32)
  derivationPath: string;    // Full BIP44 path: m/44'/1'/0'/0/15
  index: number;             // Derivation index: 15
  type: 'legacy' | 'segwit' | 'native-segwit';
  chain: 'external' | 'internal';  // External = receiving, Internal = change
  balance: number;           // Current balance in satoshis
  txCount: number;           // Number of transactions
  // Optional: Future enhancement
  createdAt?: number;        // Unix timestamp
}
```

**Account Addresses** (existing):
```typescript
interface Account {
  // ... other account fields
  addresses: Address[];
  externalIndex: number;     // Highest external address index
  internalIndex: number;     // Highest internal (change) address index
}
```

#### Sort Algorithm

**Implementation**:
```typescript
function sortAddressesByCreationOrder(addresses: Address[]): Address[] {
  // Filter: Show only external (receiving) addresses by default
  const externalAddresses = addresses.filter(addr => addr.chain === 'external');

  // Sort: Descending by index (newest first)
  return externalAddresses.sort((a, b) => b.index - a.index);
}
```

**Complexity**: O(n log n) where n = number of addresses
**Performance**: Negligible for typical address counts (<100)

#### Pagination Logic

**Implementation**:
```typescript
interface PaginationState {
  currentPage: number;       // 1-indexed
  itemsPerPage: number;      // 10, 35, 50, 100, 500
  totalItems: number;        // Total addresses
}

function paginateAddresses(
  addresses: Address[],
  state: PaginationState
): Address[] {
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  return addresses.slice(startIndex, endIndex);
}

function calculateTotalPages(totalItems: number, itemsPerPage: number): number {
  return Math.ceil(totalItems / itemsPerPage);
}
```

**Edge Cases**:
- Empty list: Show empty state, no pagination
- Single page: Hide pagination controls
- Last page partial: Show remaining items (e.g., "Showing 41-47 of 47")

---

## Technical Architecture

### Component Structure

```
<Dashboard>
  └─ <AddressListSection>
       ├─ <AddressList>
       │    ├─ <AddressItem newest={true}>  ← Most Recent badge
       │    ├─ <AddressItem newest={false}>
       │    ├─ <AddressItem newest={false}>
       │    └─ ...
       └─ <Pagination>
            ├─ <ItemCounter>
            ├─ <ItemsPerPageSelector>
            ├─ <PaginationControls>
            └─ <PagePicker>
```

### State Management

**React Context** (existing):
```typescript
interface WalletState {
  // ... existing fields
  accounts: Account[];
  selectedAccountId: string;

  // New fields for address list
  addressListPagination: {
    currentPage: number;
    itemsPerPage: number;
  };
}
```

**Local Component State**:
```typescript
const [sortedAddresses, setSortedAddresses] = useState<Address[]>([]);
const [paginatedAddresses, setPaginatedAddresses] = useState<Address[]>([]);
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
```

**Memoization**:
```typescript
// Expensive operations: Memoize to prevent re-computation
const sortedAddresses = useMemo(
  () => sortAddressesByCreationOrder(currentAccount.addresses),
  [currentAccount.addresses]
);

const paginatedAddresses = useMemo(
  () => paginateAddresses(sortedAddresses, { currentPage, itemsPerPage }),
  [sortedAddresses, currentPage, itemsPerPage]
);

const totalPages = useMemo(
  () => calculateTotalPages(sortedAddresses.length, itemsPerPage),
  [sortedAddresses.length, itemsPerPage]
);
```

### Reusable Components

**Pagination Component** (shared with transaction list):
```typescript
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemType: 'transactions' | 'addresses';  // For text display
}

<Pagination
  totalItems={47}
  itemsPerPage={10}
  currentPage={1}
  onPageChange={setCurrentPage}
  onItemsPerPageChange={setItemsPerPage}
  itemType="addresses"
/>
```

**Badge Component** (reusable):
```typescript
interface BadgeProps {
  text: string;
  variant: 'accent' | 'success' | 'warning' | 'info';
  size: 'sm' | 'md' | 'lg';
}

<Badge text="Most Recent" variant="accent" size="sm" />
```

---

## Design Specifications

### Layout Mockup

#### Full Address List (Annotated)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Addresses                                                              │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ [MOST RECENT]  tb1qxyz...abc  Address #15  Native SegWit         │ │ ← Badge + Highlight
│  │                0.00123 BTC  •  2 transactions                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                tb1qdef...ghi  Address #14  Native SegWit         │ │
│  │                0.00000 BTC  •  0 transactions                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                tb1qabc...xyz  Address #13  Native SegWit         │ │
│  │                0.00456 BTC  •  5 transactions                     │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│  ...                                                                    │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│  Showing 1-10 of 47 addresses                                          │
│                                                                         │
│  Items per page: [10 ▼]  [◀ Previous]  Page 1 of 5  [Next ▶]           │
│                                                                         │
│  Jump to page: [___]                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Visual Specifications

#### Most Recent Badge

**Size**: Small (height: 20px, padding: 4px 8px)
**Font**: 10px bold, uppercase
**Color**: White text on accent color background
**Border Radius**: 4px
**Margin**: 8px right of address

**Background Highlight** (on address item):
- Background color: Accent color at 10% opacity
- Border: 1px solid accent color at 30% opacity
- Border radius: 8px
- Padding: 12px (slightly more than other items)

#### Pagination Controls

**Item Counter**:
- Font: 14px regular
- Color: Secondary text color
- Margin: 12px bottom

**Items Per Page Dropdown**:
- Width: 100px
- Height: 36px
- Options: 10, 35, 50, 100, 500

**Previous/Next Buttons**:
- Width: 100px each
- Height: 36px
- Disabled state: Gray background, no hover

**Page Indicator**:
- Font: 14px medium
- Display: "Page X of Y"

**Page Picker**:
- Input width: 60px
- Height: 36px
- Validation: 1 to max page

### Responsive Design

**Desktop (>768px)**:
- Full layout as shown above
- Pagination controls horizontal

**Mobile (<768px)**:
- Address items full width
- Badge scales proportionally
- Pagination controls stack vertically
- Items per page dropdown full width

### Accessibility

**ARIA Labels**:
```html
<div role="list" aria-label="Bitcoin addresses sorted newest first">
  <div role="listitem" aria-label="Most recent address: tb1qxyz...abc">
    <span aria-label="Badge: Most Recent">MOST RECENT</span>
    <span>tb1qxyz...abc</span>
  </div>
</div>

<nav aria-label="Address list pagination">
  <button aria-label="Previous page" disabled>◀ Previous</button>
  <span aria-current="page">Page 1 of 5</span>
  <button aria-label="Next page">Next ▶</button>
</nav>
```

**Keyboard Navigation**:
- Tab: Navigate through pagination controls
- Enter/Space: Activate buttons, dropdowns
- Arrow keys: Navigate within dropdown menu
- Numbers: Type page number in page picker

**Screen Reader Announcements**:
- "Most Recent Address" for badge
- "Showing 1 to 10 of 47 addresses"
- "Page 1 of 5"
- "Items per page: 10"

---

## Implementation Plan

### Phase 1: Sort Order (3 days, 8 hours)

**Tasks**:
1. Implement `sortAddressesByCreationOrder()` function
2. Filter external addresses (hide change addresses)
3. Sort by index descending
4. Test with multiple address types (Legacy, SegWit, Native SegWit)
5. Verify sort persists across account switches
6. Handle edge cases (empty list, single address)

**Deliverable**: Address list displays in reverse chronological order

**Dependencies**: None

**Owner**: Frontend Developer

---

### Phase 2: Most Recent Indicator (2 days, 8 hours)

**Tasks**:
1. UI/UX Designer: Design badge and highlight (Options 1-3)
2. Frontend Developer: Implement `<Badge>` component
3. Frontend Developer: Add background highlight to first address item
4. Frontend Developer: Add ARIA labels for accessibility
5. QA Engineer: Test visual appearance across browsers
6. QA Engineer: Test screen reader compatibility

**Deliverable**: Visual "Most Recent" indicator on newest address

**Dependencies**: Phase 1 (sort order) must be complete

**Owner**: UI/UX Designer (design), Frontend Developer (implementation)

---

### Phase 3: Pagination (4 days, 12 hours)

**Tasks**:
1. Frontend Developer: Extract pagination component from transaction list
2. Frontend Developer: Parameterize for "addresses" item type
3. Frontend Developer: Implement pagination state management
4. Frontend Developer: Integrate with sorted address list
5. Frontend Developer: Implement items per page selector
6. Frontend Developer: Implement page navigation controls
7. Frontend Developer: Implement page picker
8. Frontend Developer: Implement "Showing X-Y of Z" counter
9. QA Engineer: Test all pagination controls
10. QA Engineer: Test boundary conditions (page 1, last page)
11. QA Engineer: Test items per page changes

**Deliverable**: Fully functional pagination controls

**Dependencies**: Phase 1 (sort order) complete

**Owner**: Frontend Developer

---

### Phase 4: Polish & Testing (2 days, 4 hours)

**Tasks**:
1. QA Engineer: Cross-browser testing (Chrome, Edge, Firefox, Safari)
2. QA Engineer: Responsive design testing (mobile, tablet, desktop)
3. QA Engineer: Accessibility audit (keyboard navigation, screen readers)
4. Frontend Developer: Fix any bugs identified in testing
5. Product Manager: Review and approve final implementation
6. Frontend Developer: Update documentation (inline comments, README)

**Deliverable**: Production-ready feature, no known bugs

**Dependencies**: Phases 1-3 complete

**Owner**: QA Engineer (testing), Frontend Developer (bug fixes)

---

### Total Timeline

**Duration**: 11 working days (~1.5 weeks)
**Hours**: 32 hours total (with buffer)

**Critical Path**: Phase 1 → Phase 2 & Phase 3 (parallel) → Phase 4

---

## Testing Strategy

### Unit Tests

**Sort Function Tests**:
```typescript
describe('sortAddressesByCreationOrder', () => {
  it('sorts addresses by index descending', () => {
    const addresses = [
      { index: 0, address: 'tb1q000' },
      { index: 15, address: 'tb1q015' },
      { index: 7, address: 'tb1q007' }
    ];
    const sorted = sortAddressesByCreationOrder(addresses);
    expect(sorted[0].index).toBe(15);
    expect(sorted[1].index).toBe(7);
    expect(sorted[2].index).toBe(0);
  });

  it('filters out internal (change) addresses', () => {
    const addresses = [
      { index: 0, chain: 'external' },
      { index: 1, chain: 'internal' },
      { index: 2, chain: 'external' }
    ];
    const sorted = sortAddressesByCreationOrder(addresses);
    expect(sorted.length).toBe(2);
    expect(sorted.every(a => a.chain === 'external')).toBe(true);
  });

  it('handles empty array', () => {
    const sorted = sortAddressesByCreationOrder([]);
    expect(sorted).toEqual([]);
  });

  it('handles single address', () => {
    const addresses = [{ index: 0, address: 'tb1q000' }];
    const sorted = sortAddressesByCreationOrder(addresses);
    expect(sorted.length).toBe(1);
  });
});
```

**Pagination Function Tests**:
```typescript
describe('paginateAddresses', () => {
  it('returns correct page of addresses', () => {
    const addresses = Array.from({ length: 47 }, (_, i) => ({ index: i }));
    const paginated = paginateAddresses(addresses, {
      currentPage: 1,
      itemsPerPage: 10,
      totalItems: 47
    });
    expect(paginated.length).toBe(10);
    expect(paginated[0].index).toBe(0);
  });

  it('handles last page with fewer items', () => {
    const addresses = Array.from({ length: 47 }, (_, i) => ({ index: i }));
    const paginated = paginateAddresses(addresses, {
      currentPage: 5,
      itemsPerPage: 10,
      totalItems: 47
    });
    expect(paginated.length).toBe(7); // 47 % 10 = 7
  });

  it('calculates total pages correctly', () => {
    expect(calculateTotalPages(47, 10)).toBe(5);
    expect(calculateTotalPages(50, 10)).toBe(5);
    expect(calculateTotalPages(51, 10)).toBe(6);
  });
});
```

### Integration Tests

**Address List Component Tests**:
```typescript
describe('<AddressList />', () => {
  it('displays addresses in reverse chronological order', () => {
    const { getAllByRole } = render(<AddressList addresses={mockAddresses} />);
    const items = getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('Address #15');
    expect(items[1]).toHaveTextContent('Address #14');
  });

  it('displays "Most Recent" badge on first address', () => {
    const { getByText } = render(<AddressList addresses={mockAddresses} />);
    expect(getByText('MOST RECENT')).toBeInTheDocument();
  });

  it('displays pagination controls when addresses exceed items per page', () => {
    const manyAddresses = Array.from({ length: 47 }, mockAddress);
    const { getByText } = render(<AddressList addresses={manyAddresses} />);
    expect(getByText(/Showing 1-10 of 47/)).toBeInTheDocument();
  });

  it('hides pagination controls for single page', () => {
    const fewAddresses = Array.from({ length: 5 }, mockAddress);
    const { queryByText } = render(<AddressList addresses={fewAddresses} />);
    expect(queryByText(/Page 1 of 1/)).not.toBeInTheDocument();
  });
});
```

**Pagination Component Tests**:
```typescript
describe('<Pagination />', () => {
  it('disables Previous button on first page', () => {
    const { getByLabelText } = render(
      <Pagination currentPage={1} totalPages={5} />
    );
    expect(getByLabelText('Previous page')).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    const { getByLabelText } = render(
      <Pagination currentPage={5} totalPages={5} />
    );
    expect(getByLabelText('Next page')).toBeDisabled();
  });

  it('calls onPageChange when Next is clicked', () => {
    const onPageChange = jest.fn();
    const { getByLabelText } = render(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />
    );
    fireEvent.click(getByLabelText('Next page'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
```

### Manual Testing Checklist

#### Sort Order Testing

- [ ] Addresses display in reverse chronological order (newest first)
- [ ] Sort order correct for Legacy addresses
- [ ] Sort order correct for SegWit addresses
- [ ] Sort order correct for Native SegWit addresses
- [ ] Sort order correct for mixed address types
- [ ] Change addresses (internal chain) are hidden
- [ ] Sort order persists when switching accounts
- [ ] Sort order persists when switching back to same account
- [ ] Empty state displays correctly (no addresses)
- [ ] Single address displays correctly (no pagination)

#### Visual Indicator Testing

- [ ] "Most Recent" badge displays on newest address
- [ ] Badge is visible and readable
- [ ] Background highlight on newest address is subtle and clear
- [ ] Badge color matches design system accent color
- [ ] Badge text is white with sufficient contrast
- [ ] Badge scales correctly on mobile view
- [ ] Badge displays correctly in dark mode (if applicable)
- [ ] Screen reader announces "Most Recent Address"

#### Pagination Testing

- [ ] Pagination controls display when addresses > items per page
- [ ] Items per page dropdown shows correct options (10, 35, 50, 100, 500)
- [ ] Default items per page is 10
- [ ] "Showing X-Y of Z addresses" counter is accurate
- [ ] Previous button disabled on page 1
- [ ] Next button disabled on last page
- [ ] Previous button navigates to previous page
- [ ] Next button navigates to next page
- [ ] Page indicator shows "Page X of Y" correctly
- [ ] Page picker accepts valid page numbers (1 to max)
- [ ] Page picker rejects invalid input (0, negative, > max)
- [ ] Changing items per page resets to page 1
- [ ] Items per page preference persists during session
- [ ] Pagination resets to page 1 on account switch
- [ ] Last page displays remaining addresses (partial page)

#### Accessibility Testing

- [ ] Keyboard navigation works (Tab through controls)
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate dropdown menu
- [ ] Screen reader announces address count correctly
- [ ] Screen reader announces page changes
- [ ] Screen reader announces "Most Recent" badge
- [ ] Focus indicators are visible on all interactive elements
- [ ] Color contrast meets WCAG 2.1 Level AA (4.5:1 minimum)
- [ ] Works with NVDA screen reader (Windows)
- [ ] Works with JAWS screen reader (Windows)
- [ ] Works with VoiceOver (macOS)

#### Cross-Browser Testing

- [ ] Chrome (latest): All features work
- [ ] Edge (latest): All features work
- [ ] Firefox (latest): All features work
- [ ] Safari (latest): All features work
- [ ] Chrome Mobile (Android): Responsive design works
- [ ] Safari Mobile (iOS): Responsive design works

#### Edge Cases

- [ ] Account with 0 addresses: Empty state
- [ ] Account with 1 address: No pagination, badge shows
- [ ] Account with exactly 10 addresses: No pagination (1 page)
- [ ] Account with 11 addresses: Pagination appears (2 pages)
- [ ] Account with 200+ addresses: Performance acceptable
- [ ] Switching from account with many addresses to account with few
- [ ] Generating new address updates sort order immediately
- [ ] Badge moves to new address after generation

---

## Release Strategy

### Release Timing

**Target Release**: v0.12.0
**Bundled With**: Transaction List Enhancement

**Rationale**: Ship both list enhancements together for:
1. **Consistent UX**: Users learn "lists are newest-first" once
2. **Single User Education**: One announcement, one set of release notes
3. **Shared Components**: Pagination component reused across both features
4. **Testing Efficiency**: Test consistent patterns across both features once

### Release Notes

**v0.12.0 Release Notes** (excerpt):

```markdown
## Address List Improvements

### Sort Order: Newest First

Addresses are now displayed in reverse chronological order, with your **most
recently generated address at the top**. This matches the transaction list
sort order for consistency and makes it easy to find your current address.

### Most Recent Indicator

Your newest address is now clearly marked with a "MOST RECENT" badge and
subtle highlight. Use this address for receiving Bitcoin to maintain privacy.

### Pagination Controls

Power users with many addresses can now navigate efficiently with pagination
controls. Configure how many addresses to display per page (10, 35, 50, 100,
or 500) and jump between pages easily.

### Benefits

- **Quick Access**: Most recent address is always at the top
- **Consistent UX**: Same sort order as transaction list
- **Better Privacy**: Easy to identify and use fresh addresses
- **Scalability**: Manage 100+ addresses without UI clutter
```

### User Education

**In-App Notification** (first view after update):
```
┌─────────────────────────────────────────────────────────────┐
│  ℹ️  Addresses Now Sorted Newest First                      │
│                                                             │
│  Your address list now shows the most recent address at    │
│  the top, marked with a "MOST RECENT" badge. This makes    │
│  it easy to use fresh addresses for better privacy.        │
│                                                             │
│  [ Learn More ]  [ Got It ]                                 │
└─────────────────────────────────────────────────────────────┘
```

**Help Article**: "Understanding Address List Sort Order"
- Explains newest-first rationale
- Shows screenshot of "Most Recent" badge
- Explains pagination controls
- Links to Bitcoin privacy best practices

### Rollback Plan

**Rollback Trigger**: >5% user confusion or critical bugs within 48 hours

**Rollback Steps**:
1. Revert to previous version via git
2. Redeploy previous version to Chrome Web Store
3. Notify users via in-app banner (if feasible)
4. Post-mortem to identify root cause
5. Fix issues and re-release in v0.12.1

**Monitoring**:
- Support ticket volume (address list related)
- Error rate (JavaScript errors on address list page)
- User feedback sentiment analysis
- Analytics: Feature usage (pagination click rate)

---

## Open Questions

### 1. Address Type Grouping

**Question**: Should addresses be grouped by type (Legacy, SegWit, Native SegWit) or intermixed by creation order?

**Options**:
- **A**: Intermix all types by creation order
- **B**: Group by type, sort within each group

**Recommendation**: **Option A** (Intermix by creation order)

**Rationale**:
- Users think chronologically (time order), not by address type
- Grouping adds complexity and breaks natural flow
- Most users use single address type (Native SegWit)
- Power users who switch types still benefit from chronological view

**Future Enhancement**: Add optional "Filter by Address Type" if users request it.

---

### 2. Internal (Change) Addresses

**Question**: Should internal (change) addresses be shown in the list or hidden?

**Options**:
- **A**: Hide change addresses by default
- **B**: Show change addresses intermixed
- **C**: Show change addresses in separate section

**Recommendation**: **Option A** (Hide by default)

**Rationale**:
- Most users don't need to see change addresses
- Change addresses are generated automatically by wallet
- Showing them adds noise to the list
- Advanced users who need them can use future "Show Change Addresses" toggle

**Future Enhancement**: Add "Show Change Addresses" toggle in settings for advanced users.

---

### 3. Visual Indicator Design

**Question**: Badge text, icon, color, or combination?

**Options**:
- **A**: Badge text ("Most Recent") + background highlight
- **B**: Icon only (⭐ or 🆕)
- **C**: Badge text only

**Recommendation**: **Option A** (Badge + highlight)

**Rationale**:
- Text label works for screen readers (accessibility)
- Background highlight adds visual prominence
- Combination is most explicit and clear
- Doesn't rely solely on color (color blind accessible)

**Decision Owner**: UI/UX Designer (final design decision)

---

### 4. Default Items Per Page

**Question**: What should be the default items per page?

**Options**:
- **A**: 10 addresses per page
- **B**: 20 addresses per page
- **C**: 35 addresses per page

**Recommendation**: **Option A** (10 addresses)

**Rationale**:
- Consistency with transaction list default (10)
- Most users have <10 addresses (no pagination needed)
- Power users can easily increase to 35, 50, or 100
- Clean, uncluttered default view

**Data Point**: Typical users have 5-20 addresses, power users have 50-100.

---

### 5. Creation Timestamp Metadata

**Question**: Should we add creation timestamp to address metadata?

**Options**:
- **A**: Yes, add creation timestamp (Unix timestamp)
- **B**: No, use derivation index as proxy

**Recommendation**: **Option A** (Add timestamp)

**Rationale**:
- Minimal cost (single number field)
- Enables future features (address analytics, filtering by date)
- More explicit than deriving from index
- Useful for debugging and support

**Implementation**: Add `createdAt: number` field when generating new addresses.

---

## Related Documentation

### Product Documents

- [**features.md**](../experts/product/features.md) - Feature specification (Enhancement Idea 2)
- [**requirements.md**](../experts/product/requirements.md) - User stories and acceptance criteria
- [**roadmap.md**](../experts/product/roadmap.md) - v0.12.0 release planning

### Technical Documents

- [**TRANSACTION_LIST_ENHANCEMENT_PRD.md**](./TRANSACTION_LIST_ENHANCEMENT_PRD.md) - Companion feature (shares pagination component)
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - System architecture
- [**frontend-developer-notes.md**](../experts/frontend/_INDEX.md) - React component patterns

### Expert Notes

- **Frontend Developer**: React patterns, component architecture, state management
- **UI/UX Designer**: Visual design, interaction patterns, accessibility
- **QA Engineer**: Test plans, edge cases, cross-browser testing

### Design References

- Transaction List Enhancement (same pagination UX)
- Existing Address List (current implementation to enhance)
- MetaMask account list (inspiration for list design)

---

## Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-30 | Product Manager | Initial PRD |

---

**Status**: PRD Complete - Ready for prioritization and implementation

**Next Steps**:
1. Product Manager: Prioritize in v0.12.0 roadmap
2. UI/UX Designer: Design "Most Recent" indicator visual treatment
3. Frontend Developer: Implement sort order and pagination
4. QA Engineer: Comprehensive testing across browsers and devices
5. Product Manager: Approve design and coordinate v0.12.0 release
