# Sidebar Account Switcher - Enhanced Design Specification

**Version:** 1.0
**Date:** 2025-10-18
**Status:** Ready for Implementation

---

## 1. Overview

This specification defines the design for an enhanced account switcher component in the sidebar that consolidates all account management functionality into a single, accessible location. This replaces the current split between a non-functional sidebar switcher and the functional Dashboard dropdown.

### Goals

1. **Consolidate Account Management**: Move all account-related actions from Dashboard to the sidebar
2. **Universal Access**: Make account switching available from all views (Assets, Multisig, Contacts, Settings)
3. **Improved UX**: Create a clear visual hierarchy and intuitive interaction pattern
4. **Maintain Consistency**: Keep visual style aligned with existing dark theme and Bitcoin orange branding

---

## 2. Current State Analysis

### Current Implementation

**Sidebar (Sidebar.tsx, lines 84-149):**
- Non-functional account switcher button
- Shows account name with avatar initial
- Has placeholder `onClick` handler
- Located above Help/Lock/Settings buttons
- Dark gray background with Bitcoin orange accent on hover

**Dashboard (Dashboard.tsx, lines 364-470):**
- Functional account dropdown in header
- Account list with selection checkmarks
- Three action buttons:
  - Create Account (primary orange)
  - Import Account (secondary gray)
  - Create Multisig Account (secondary gray with external link icon)
- Badge indicators (ImportBadge, MultisigBadge)
- Account metadata (address type, account type)

### What Needs to Change

1. Make sidebar switcher functional with dropdown
2. Move all three action buttons from Dashboard to sidebar
3. Move account list and selection logic to sidebar
4. Remove account dropdown entirely from Dashboard header
5. Update App.tsx to pass necessary props and handlers to Sidebar

---

## 3. Design Solution: Dropdown Panel

### 3.1 Layout Approach

**Selected: Dropdown Panel (Drop-down from button)**

**Rationale:**
- Consistent with existing Dashboard dropdown pattern
- Familiar UX pattern for users
- Works within 240px sidebar width constraint
- Doesn't block main content area
- Can extend downward with scrolling if many accounts

**Rejected Alternatives:**
- **Modal:** Too heavy for quick account switching, blocks entire UI
- **Slide-out Panel:** Would require significant layout changes, adds complexity

### 3.2 Positioning & Dimensions

```
┌─────────────────────────────────────────┐
│ Sidebar (240px / w-60)                  │
│                                         │
│ [Navigation Items]                      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Account Switcher Button             │ │ <- Trigger
│ │  ○ Account Name                     │ │
│ │     Click to switch          ↕      │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│ │ ┃ DROPDOWN PANEL                 ┃ │ │ <- Dropdown
│ │ ┃ (256px / w-64)                 ┃ │ │    (extends right)
│ │ ┃                                ┃ │ │
│ │ ┃ Account List                   ┃ │ │
│ │ ┃ ────────────────               ┃ │ │
│ │ ┃ Action Buttons                 ┃ │ │
│ │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Help] [Lock]                           │
│ [Settings]                              │
└─────────────────────────────────────────┘
```

**Dropdown Properties:**
- **Width:** 256px (w-64) - Slightly wider than sidebar for breathing room
- **Position:** Absolute, anchored to top of button, extends to the right
- **Max Height:** `max-h-[500px]` with `overflow-y-auto` for scrollable account list
- **Z-index:** `z-50` to appear above all content
- **Margin:** `ml-2` (8px gap from sidebar edge)

---

## 4. Component Structure

### 4.1 Enhanced Sidebar Props

```typescript
interface SidebarProps {
  // Navigation
  currentView: 'dashboard' | 'multisig' | 'contacts' | 'settings';
  onNavigate: (view: 'dashboard' | 'multisig' | 'contacts' | 'settings') => void;

  // Account Management (NEW/UPDATED)
  accounts: WalletAccount[];                    // All accounts
  currentAccountIndex: number;                  // Currently selected account
  onAccountSwitch: (index: number) => void;    // Switch to different account
  onCreateAccount: () => void;                 // Open create account modal
  onImportAccount: () => void;                 // Open import account modal
  onCreateMultisig: () => void;                // Navigate to multisig wizard

  // Wallet Controls
  onLock: () => void;
}
```

### 4.2 Component State

```typescript
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const [hoveredAccountIndex, setHoveredAccountIndex] = useState<number | null>(null);
```

### 4.3 Component Hierarchy

```
Sidebar
├── Header (Logo + Title)
├── Navigation (Assets, Multisig, Contacts)
└── Account Switcher Section
    ├── Account Switcher Button (trigger)
    └── Dropdown Panel (conditional render)
        ├── Account List Section
        │   └── Account Items (map over accounts)
        │       ├── Avatar Initial
        │       ├── Account Info
        │       │   ├── Name + Badges
        │       │   └── Address Type
        │       └── Checkmark (if selected)
        ├── Divider
        └── Action Buttons Section
            ├── Create Account (primary)
            ├── Import Account (secondary)
            └── Create Multisig Account (secondary)
    ├── Help Button
    ├── Lock Button
    └── Settings Button
```

---

## 5. Visual Design Specification

### 5.1 Account Switcher Button (Trigger)

**Current State:** (No changes needed - already well designed)

```tsx
<button
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
    bg-gray-800 hover:bg-gray-750 transition-all duration-200
    border border-gray-700 hover:border-bitcoin/30"
  title="Switch account"
>
  {/* Avatar */}
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
    flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
    {currentAccount.name.charAt(0).toUpperCase()}
  </div>

  {/* Account Info */}
  <div className="flex-1 text-left min-w-0">
    <p className="text-white text-sm font-medium truncate">{currentAccount.name}</p>
    <p className="text-gray-400 text-xs">Click to switch</p>
  </div>

  {/* Arrow Icon - Updates based on dropdown state */}
  <svg
    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
      isDropdownOpen ? 'rotate-180' : ''
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
</button>
```

**Interaction States:**
- **Default:** `bg-gray-800`, `border-gray-700`
- **Hover:** `bg-gray-750`, `border-bitcoin/30`
- **Active/Open:** `bg-gray-750`, `border-bitcoin/50`, arrow rotated 180°

---

### 5.2 Dropdown Panel Container

```tsx
{isDropdownOpen && (
  <div
    className="absolute bottom-full left-0 ml-2 mb-2 w-64
      bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50
      py-2"
  >
    {/* Content */}
  </div>
)}
```

**Visual Properties:**
- **Background:** `bg-gray-800` (consistent with trigger button)
- **Border:** `border border-gray-700` (subtle separation)
- **Border Radius:** `rounded-xl` (16px, modern and friendly)
- **Shadow:** `shadow-2xl` (strong elevation for clear hierarchy)
- **Padding:** `py-2` (8px vertical padding for content breathing room)
- **Position:** `absolute bottom-full left-0` (appears above button)
- **Margin:** `ml-2 mb-2` (8px gap from sidebar edge and button)

**Positioning Details:**
- Appears **above** the account switcher button (`bottom-full`)
- Aligns to **left edge** of sidebar content area (`left-0`)
- Small margin to create visual separation (`ml-2 mb-2`)
- Extends **to the right** due to being wider than sidebar

---

### 5.3 Account List Section

```tsx
<div className="max-h-[320px] overflow-y-auto py-2">
  {accounts.map((account, index) => (
    <button
      key={account.index}
      onClick={() => {
        onAccountSwitch(index);
        setIsDropdownOpen(false);
      }}
      onMouseEnter={() => setHoveredAccountIndex(index)}
      onMouseLeave={() => setHoveredAccountIndex(null)}
      className={`
        w-full px-4 py-3 text-left transition-all duration-200
        ${currentAccountIndex === index
          ? 'bg-bitcoin-subtle border-l-2 border-bitcoin'
          : 'hover:bg-gray-750'
        }
      `}
    >
      {/* Account Item Content - See Section 5.4 */}
    </button>
  ))}
</div>
```

**Visual Properties:**
- **Max Height:** `max-h-[320px]` (prevents dropdown from extending too far)
- **Scrolling:** `overflow-y-auto` (scrollbar appears when >5-6 accounts)
- **Padding:** `py-2` (vertical padding for list container)

---

### 5.4 Account Item (Individual Account Row)

```tsx
<div className="flex items-center justify-between">
  {/* Left: Avatar + Info */}
  <div className="flex items-center gap-3 flex-1 min-w-0">
    {/* Avatar Initial */}
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
      flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
      {account.name.charAt(0).toUpperCase()}
    </div>

    {/* Account Details */}
    <div className="flex-1 min-w-0">
      {/* Name + Badges Row */}
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-white text-sm truncate">
          {account.name}
        </span>

        {/* Import Badge */}
        {account.importType && account.importType !== 'hd' && (
          <ImportBadge type={account.importType} size="sm" />
        )}

        {/* Multisig Badge */}
        {account.accountType === 'multisig' && (
          <MultisigBadge config={account.multisigConfig} size="sm" />
        )}
      </div>

      {/* Address Type */}
      <div className="text-xs text-gray-400 capitalize">
        {account.accountType === 'multisig'
          ? account.addressType.toUpperCase()
          : account.addressType.replace('-', ' ')
        }
      </div>
    </div>
  </div>

  {/* Right: Checkmark (if selected) */}
  {currentAccountIndex === index && (
    <svg className="w-5 h-5 text-bitcoin flex-shrink-0 ml-2"
      fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  )}
</div>
```

**Interaction States:**

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | Transparent | None | `text-white` (name), `text-gray-400` (type) |
| Hover (not selected) | `bg-gray-750` | None | `text-white` |
| Selected | `bg-bitcoin-subtle` | `border-l-2 border-bitcoin` | `text-white` |
| Selected + Hover | `bg-bitcoin-subtle` | `border-l-2 border-bitcoin` | `text-white` |

**Visual Hierarchy:**
1. **Avatar:** Bitcoin orange gradient, eye-catching
2. **Name:** White, bold, primary focus
3. **Badges:** Inline with name, color-coded (blue for import, purple for multisig)
4. **Address Type:** Gray, secondary information
5. **Checkmark:** Bitcoin orange, confirmation indicator

---

### 5.5 Divider

```tsx
<div className="border-t border-gray-700 my-2"></div>
```

**Purpose:** Separate account list from action buttons

**Visual Properties:**
- **Border:** `border-t border-gray-700` (subtle gray line)
- **Spacing:** `my-2` (8px margin top/bottom)

---

### 5.6 Action Buttons Section

```tsx
<div className="px-2 space-y-2">
  {/* Create Account - Primary */}
  <button
    onClick={() => {
      setIsDropdownOpen(false);
      onCreateAccount();
    }}
    className="w-full px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active
      text-white rounded-lg font-semibold transition-all duration-200
      flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    <span>Create Account</span>
  </button>

  {/* Import Account - Secondary */}
  <button
    onClick={() => {
      setIsDropdownOpen(false);
      onImportAccount();
    }}
    className="w-full px-4 py-3 bg-gray-850 hover:bg-gray-800
      text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600
      rounded-lg font-semibold transition-colors duration-200
      flex items-center justify-center gap-2"
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
    <span>Import Account</span>
  </button>

  {/* Create Multisig Account - Secondary with External Link */}
  <button
    onClick={() => {
      setIsDropdownOpen(false);
      onCreateMultisig();
    }}
    className="w-full px-4 py-3 bg-gray-850 hover:bg-gray-800
      text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600
      rounded-lg font-semibold transition-colors duration-200
      flex items-center justify-between gap-2"
  >
    <div className="flex items-center gap-2">
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      <span>Create Multisig Account</span>
    </div>
    {/* External link indicator */}
    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor"
      viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  </button>
</div>
```

**Button Specifications:**

#### Primary Button (Create Account)
- **Background:** `bg-bitcoin` (#f7931a)
- **Hover:** `bg-bitcoin-hover`
- **Active:** `bg-bitcoin-active`
- **Text:** `text-white`
- **Border:** None
- **Shadow:** `shadow-sm` default, `shadow-md` on hover
- **Icon:** Plus (+) icon, white, 20px
- **Transition:** `transition-all duration-200`

#### Secondary Buttons (Import, Create Multisig)
- **Background:** `bg-gray-850`
- **Hover:** `bg-gray-800`
- **Text:** `text-gray-300` default, `text-white` on hover
- **Border:** `border border-gray-700`, `border-gray-600` on hover
- **Shadow:** None
- **Icon:** Relevant icon (download/plus), same color as text, 20px
- **Transition:** `transition-colors duration-200`

**Layout:**
- **Container:** `px-2 space-y-2` (horizontal padding, 8px gap between buttons)
- **Full Width:** All buttons `w-full`
- **Padding:** `px-4 py-3` (comfortable touch target)
- **Border Radius:** `rounded-lg` (8px, consistent with panel)
- **Icon Alignment:** `justify-center` for primary/import, `justify-between` for multisig

---

## 6. Interaction Patterns

### 6.1 Opening/Closing Dropdown

**Trigger Actions:**
1. **Click button:** Toggle dropdown open/closed
2. **Click outside dropdown:** Close dropdown (use click-outside detection)
3. **Click account item:** Switch account + close dropdown
4. **Click action button:** Trigger action + close dropdown
5. **Press Escape key:** Close dropdown

**Implementation Pattern:**
```typescript
// Click outside detection
useEffect(() => {
  if (!isDropdownOpen) return;

  const handleClickOutside = (e: MouseEvent) => {
    const dropdown = dropdownRef.current;
    const trigger = triggerRef.current;

    if (
      dropdown &&
      trigger &&
      !dropdown.contains(e.target as Node) &&
      !trigger.contains(e.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  };
}, [isDropdownOpen]);
```

### 6.2 Account Switching Flow

**User Action:** Click account in dropdown

**System Response:**
1. Call `onAccountSwitch(index)` prop
2. Close dropdown (`setIsDropdownOpen(false)`)
3. Parent component (App.tsx) updates `currentAccountIndex`
4. Triggers data refresh for new account
5. UI updates to show new account name in button

**Animation:**
- Smooth transition on button text change (account name)
- No jarring flash or jump

### 6.3 Action Button Flows

#### Create Account
1. User clicks "Create Account" button
2. Close dropdown
3. Call `onCreateAccount()` prop
4. Parent shows create account modal (existing behavior)

#### Import Account
1. User clicks "Import Account" button
2. Close dropdown
3. Call `onImportAccount()` prop
4. Parent shows import account modal (existing behavior)

#### Create Multisig Account
1. User clicks "Create Multisig Account" button
2. Close dropdown
3. Call `onCreateMultisig()` prop
4. Parent navigates to `multisig` view (full-screen wizard)

### 6.4 Keyboard Navigation (Future Enhancement)

**Future Consideration:** Add keyboard support for accessibility

- **Tab:** Navigate through accounts and buttons
- **Enter/Space:** Select focused item
- **Arrow Up/Down:** Navigate account list
- **Escape:** Close dropdown

*(Not required for initial implementation but good to consider in design)*

---

## 7. Responsive Behavior

### 7.1 Dropdown Positioning

**Problem:** Dropdown is 256px wide, sidebar is 240px wide.

**Solution:**
- Dropdown positioned `absolute` relative to button
- Uses `ml-2` to offset 8px to the right
- Extends beyond sidebar edge into main content area
- **Z-index `z-50`** ensures it appears above main content

**Visual Result:**
```
┌────────────┬──────────────────────────┐
│  Sidebar   │  Main Content            │
│  (240px)   │                          │
│            │                          │
│  [Button]  │                          │
│  ┌────────────────┐                  │ <- Dropdown extends right
│  │ Dropdown       │                  │    (256px total width)
│  │ (256px)        │                  │
│  └────────────────┘                  │
│            │                          │
└────────────┴──────────────────────────┘
```

### 7.2 Scrolling with Many Accounts

**When:** More than ~5-6 accounts exist

**Behavior:**
- Dropdown height capped at `max-h-[320px]`
- Internal scrollbar appears for account list
- Action buttons remain visible at bottom (not scrolled)

**Implementation:**
- Only the account list section has `overflow-y-auto`
- Divider and action buttons are outside scrollable area

---

## 8. Accessibility Considerations

### 8.1 ARIA Labels

```tsx
<button
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  aria-expanded={isDropdownOpen}
  aria-haspopup="true"
  aria-label="Account switcher"
  className="..."
>
  {/* Button content */}
</button>

{isDropdownOpen && (
  <div
    role="menu"
    aria-label="Account management menu"
    className="..."
  >
    {/* Dropdown content */}
  </div>
)}
```

### 8.2 Focus Management

- When dropdown opens, focus remains on trigger button
- Clicking account/button closes dropdown and returns focus appropriately
- Pressing Escape closes dropdown and returns focus to trigger

### 8.3 Screen Reader Support

- Button announces "Account switcher, expanded" when open
- Account items announce "Account name, address type, [selected]"
- Action buttons announce their label and role

---

## 9. Error States & Edge Cases

### 9.1 No Accounts (Impossible but defensive)

**Scenario:** `accounts` array is empty

**Behavior:**
- Show placeholder message in dropdown
- Only display action buttons

```tsx
{accounts.length === 0 ? (
  <div className="px-4 py-8 text-center">
    <p className="text-gray-400 text-sm">No accounts found</p>
    <p className="text-gray-500 text-xs mt-1">Create or import an account to get started</p>
  </div>
) : (
  <div className="max-h-[320px] overflow-y-auto py-2">
    {/* Account list */}
  </div>
)}
```

### 9.2 Single Account

**Scenario:** User has only one account

**Behavior:**
- Dropdown still functional (shows 1 account with checkmark)
- Action buttons still accessible
- UX feels consistent

### 9.3 Very Long Account Names

**Scenario:** Account name exceeds button width

**Behavior:**
- Text truncates with ellipsis (`truncate` class)
- Full name visible on hover (title attribute)

```tsx
<p className="text-white text-sm font-medium truncate" title={account.name}>
  {account.name}
</p>
```

### 9.4 Multiple Badges

**Scenario:** Account is both imported AND multisig

**Behavior:**
- Both badges render inline
- May wrap to second line if name is very long
- Acceptable UX given rare occurrence

---

## 10. Animation & Transitions

### 10.1 Dropdown Appearance

**Entry Animation:**
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Implementation:**
```tsx
<div
  className="absolute bottom-full left-0 ml-2 mb-2 w-64
    bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 py-2
    animate-slideDown"
>
```

**Tailwind Config Addition:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      animation: {
        'slideDown': 'slideDown 150ms ease-out',
      },
      keyframes: {
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
};
```

### 10.2 Arrow Icon Rotation

**Smooth rotation on open/close:**
```tsx
<svg
  className={`w-4 h-4 text-gray-400 flex-shrink-0
    transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
  // ...
>
```

### 10.3 Button Hover States

**All transitions use:**
```css
transition-all duration-200
/* or */
transition-colors duration-200
```

**Ensures smooth visual feedback on:**
- Background color changes
- Border color changes
- Text color changes
- Shadow changes

---

## 11. Implementation Checklist

### Phase 1: Sidebar Component Updates

- [ ] Add new props to `SidebarProps` interface
  - [ ] `accounts: WalletAccount[]`
  - [ ] `currentAccountIndex: number`
  - [ ] `onAccountSwitch: (index: number) => void`
  - [ ] `onCreateAccount: () => void`
  - [ ] `onImportAccount: () => void`
  - [ ] `onCreateMultisig: () => void`
- [ ] Add state for dropdown open/close
- [ ] Implement dropdown panel structure
- [ ] Implement account list with mapping
- [ ] Implement action buttons section
- [ ] Add click-outside detection
- [ ] Add Escape key handler
- [ ] Import `ImportBadge` and `MultisigBadge` components
- [ ] Add animation classes to Tailwind config (if not exists)

### Phase 2: App.tsx Integration

- [ ] Add state for account management in App.tsx
  - [ ] `currentAccountIndex` state
  - [ ] Account switching handler
- [ ] Pass new props to Sidebar component
- [ ] Create/update modal state management
  - [ ] `showCreateAccountModal`
  - [ ] `showImportAccountModal`
- [ ] Implement `onCreateMultisig` handler (navigate to multisig view)
- [ ] Test account switching updates Dashboard correctly

### Phase 3: Dashboard Component Cleanup

- [ ] Remove account dropdown from Dashboard header
- [ ] Remove account dropdown state (`showAccountDropdown`)
- [ ] Remove account dropdown rendering code (lines 364-470)
- [ ] Simplify Dashboard header to only show title/balance
- [ ] Update Dashboard props (remove account management props if any)
- [ ] Test Dashboard still functions correctly

### Phase 4: Testing & Polish

- [ ] Test with 0 accounts (edge case)
- [ ] Test with 1 account
- [ ] Test with multiple accounts (3-5)
- [ ] Test with many accounts (10+) - verify scrolling
- [ ] Test account switching updates all views
- [ ] Test Create Account modal flow
- [ ] Test Import Account modal flow
- [ ] Test Create Multisig navigation flow
- [ ] Test click outside closes dropdown
- [ ] Test Escape key closes dropdown
- [ ] Test with long account names (truncation)
- [ ] Test with badges (import, multisig)
- [ ] Test animations are smooth
- [ ] Test on different screen sizes
- [ ] Verify accessibility with screen reader

### Phase 5: Documentation

- [ ] Update component documentation
- [ ] Add JSDoc comments to Sidebar component
- [ ] Update UI/UX Designer notes with implementation details
- [ ] Update Frontend Developer notes with new patterns
- [ ] Document any deviations from this spec

---

## 12. Code Snippets

### 12.1 Complete Sidebar Account Switcher Section

```tsx
{/* Account Switcher */}
<div className="border-t border-gray-750 p-4">
  <div className="relative">
    {/* Trigger Button */}
    <button
      ref={triggerRef}
      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      aria-expanded={isDropdownOpen}
      aria-haspopup="true"
      aria-label="Account switcher"
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
        bg-gray-800 hover:bg-gray-750 transition-all duration-200
        border border-gray-700 hover:border-bitcoin/30"
      title="Switch account"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
        flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
        {currentAccount.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-white text-sm font-medium truncate">{currentAccount.name}</p>
        <p className="text-gray-400 text-xs">Click to switch</p>
      </div>
      <svg
        className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
          isDropdownOpen ? 'rotate-180' : ''
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    {/* Dropdown Panel */}
    {isDropdownOpen && (
      <div
        ref={dropdownRef}
        role="menu"
        aria-label="Account management menu"
        className="absolute bottom-full left-0 ml-2 mb-2 w-64
          bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50
          py-2 animate-slideDown"
      >
        {/* Account List */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {accounts.map((account, index) => (
            <button
              key={account.index}
              onClick={() => {
                onAccountSwitch(index);
                setIsDropdownOpen(false);
              }}
              className={`w-full px-4 py-3 text-left transition-all duration-200
                ${currentAccountIndex === index
                  ? 'bg-bitcoin-subtle border-l-2 border-bitcoin'
                  : 'hover:bg-gray-750'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
                    flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white text-sm truncate">
                        {account.name}
                      </span>
                      {account.importType && account.importType !== 'hd' && (
                        <ImportBadge type={account.importType} size="sm" />
                      )}
                      {account.accountType === 'multisig' && (
                        <MultisigBadge config={account.multisigConfig} size="sm" />
                      )}
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {account.accountType === 'multisig'
                        ? account.addressType.toUpperCase()
                        : account.addressType.replace('-', ' ')
                      }
                    </div>
                  </div>
                </div>
                {currentAccountIndex === index && (
                  <svg className="w-5 h-5 text-bitcoin flex-shrink-0 ml-2"
                    fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-700 my-2"></div>

        {/* Action Buttons */}
        <div className="px-2 space-y-2">
          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onCreateAccount();
            }}
            className="w-full px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active
              text-white rounded-lg font-semibold transition-all duration-200
              flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Account</span>
          </button>

          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onImportAccount();
            }}
            className="w-full px-4 py-3 bg-gray-850 hover:bg-gray-800
              text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600
              rounded-lg font-semibold transition-colors duration-200
              flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Import Account</span>
          </button>

          <button
            onClick={() => {
              setIsDropdownOpen(false);
              onCreateMultisig();
            }}
            className="w-full px-4 py-3 bg-gray-850 hover:bg-gray-800
              text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600
              rounded-lg font-semibold transition-colors duration-200
              flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Multisig Account</span>
            </div>
            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>
    )}
  </div>

  {/* Help and Lock buttons */}
  <div className="flex gap-2 mt-3">
    {/* ... existing Help and Lock buttons ... */}
  </div>

  {/* Settings button */}
  {/* ... existing Settings button ... */}
</div>
```

### 12.2 useEffect for Click Outside Detection

```tsx
// Add refs
const dropdownRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);

// Click outside detection
useEffect(() => {
  if (!isDropdownOpen) return;

  const handleClickOutside = (e: MouseEvent) => {
    if (
      dropdownRef.current &&
      triggerRef.current &&
      !dropdownRef.current.contains(e.target as Node) &&
      !triggerRef.current.contains(e.target as Node)
    ) {
      setIsDropdownOpen(false);
    }
  };

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleEscape);

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
    document.removeEventListener('keydown', handleEscape);
  };
}, [isDropdownOpen]);
```

---

## 13. Future Enhancements

### 13.1 Account Search/Filter

**When:** User has many accounts (20+)

**Implementation:**
- Add search input at top of dropdown
- Filter accounts by name as user types
- Clear search when dropdown closes

### 13.2 Account Grouping

**When:** User wants to organize accounts by category

**Implementation:**
- Group by account type (HD, Imported, Multisig)
- Collapsible sections
- Visual separators between groups

### 13.3 Drag-to-Reorder

**When:** User wants custom account order

**Implementation:**
- Drag handles on account items
- Persist order to storage
- Smooth reorder animation

### 13.4 Quick Actions

**When:** User frequently accesses account-specific actions

**Implementation:**
- Hover/long-press on account reveals actions menu
- Rename, delete, export options
- Inline without opening separate modal

*(These are NOT in scope for initial implementation)*

---

## 14. Dependencies

### Required Imports

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { WalletAccount } from '../../shared/types';
import { ImportBadge } from './shared/ImportBadge';
import { MultisigBadge } from './shared/MultisigBadge';
```

### Type Dependencies

**Existing Types (from `shared/types.ts`):**
- `WalletAccount`
- `MultisigConfig`
- Account-related types

**No new types required** - all necessary types already exist.

---

## 15. Summary

This design specification provides a complete blueprint for implementing an enhanced account switcher in the sidebar that consolidates all account management functionality. The solution:

1. **Uses a dropdown panel** that appears above the trigger button, extending to the right
2. **Maintains visual consistency** with existing dark theme and Bitcoin orange branding
3. **Provides clear hierarchy** with account list first, then action buttons
4. **Supports all account types** with proper badge indicators
5. **Handles edge cases** gracefully (no accounts, long names, scrolling)
6. **Includes proper interactions** (click outside, Escape key, animations)
7. **Is accessible** with ARIA labels and keyboard support considerations

The implementation can be done in 5 phases:
1. Update Sidebar component
2. Integrate with App.tsx
3. Clean up Dashboard component
4. Test thoroughly
5. Document changes

All visual specifications, interaction patterns, and code snippets are provided for the frontend developer to implement this design.

---

**Design Status:** ✅ Ready for Implementation
**Next Step:** Hand off to `frontend-developer` agent for implementation
