# Sidebar Account Switcher - Visual Guide

**Companion Document to:** `SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md`
**Version:** 1.0
**Date:** 2025-10-18

This document provides visual ASCII diagrams and quick reference for the sidebar account switcher design.

---

## Quick Visual Overview

### Before (Current State)

```
┌──────────────────────┬─────────────────────────────────────┐
│ SIDEBAR (240px)      │ DASHBOARD HEADER                    │
│                      │ ┌─────────────────────────────────┐ │
│ ₿ Bitcoin Wallet     │ │ [Account 1 ▼] <-- Dropdown here│ │
│    Testnet           │ │  ├─ Account 1         ✓         │ │
│                      │ │  ├─ Account 2                   │ │
│ [Assets]             │ │  ├─ Create Account (orange)     │ │
│ [Multi-sig]          │ │  ├─ Import Account (gray)       │ │
│ [Contacts]           │ │  └─ Create Multisig (gray)      │ │
│                      │ └─────────────────────────────────┘ │
│                      │                                     │
│ ┌──────────────────┐ │ Dashboard Content...                │
│ │  A  Account 1    │ │                                     │
│ │     Click switch │ │ <- Non-functional                  │
│ └──────────────────┘ │                                     │
│                      │                                     │
│ [Help] [Lock]        │                                     │
│ [Settings]           │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

**Issues:**
- Account management split between sidebar and dashboard header
- Sidebar switcher doesn't work
- Not accessible from other views (Multisig, Contacts, Settings)
- Redundant UI elements

---

### After (New Design)

```
┌──────────────────────┬─────────────────────────────────────┐
│ SIDEBAR (240px)      │ DASHBOARD HEADER                    │
│                      │                                     │
│ ₿ Bitcoin Wallet     │ Simplified - no account dropdown   │
│    Testnet           │                                     │
│                      │                                     │
│ [Assets]             │ Dashboard Content...                │
│ [Multi-sig]          │                                     │
│ [Contacts]           │                                     │
│                      │                                     │
│ ┌──────────────────┐ │                                     │
│ │  A  Account 1  ↕ │ │ <- Click to open dropdown          │
│ │     Click switch │ │                                     │
│ └──────────────────┘ │                                     │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                              │
│ ┃ DROPDOWN (256px)          ┃ <- Functional dropdown       │
│ ┃ ┌─────────────────────┐   ┃                              │
│ ┃ │ A Account 1      ✓ │   ┃    Accessible from all views│
│ ┃ │ B Account 2        │   ┃                              │
│ ┃ │ C Imported     🔽  │   ┃    All account management    │
│ ┃ └─────────────────────┘   ┃    in one place              │
│ ┃ ───────────────────────   ┃                              │
│ ┃ [Create Account]  (🟠)    ┃                              │
│ ┃ [Import Account]          ┃                              │
│ ┃ [Create Multisig] ↗       ┃                              │
│ ┃━━━━━━━━━━━━━━━━━━━━━━━━━━━┃                              │
│ [Help] [Lock]        │                                     │
│ [Settings]           │                                     │
└──────────────────────┴─────────────────────────────────────┘
```

**Improvements:**
- Single source for account management
- Available from any view
- Consistent UX pattern
- Reduced complexity in Dashboard

---

## Detailed Component Layout

### 1. Closed State (Default)

```
┌─────────────────────────────────────┐
│ Account Switcher Button             │
│ ┌─────────────────────────────────┐ │
│ │ ┏━━┓                            │ │
│ │ ┃ A ┃  Account 1            ↓   │ │
│ │ ┗━━┛  Click to switch           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Components:
- Avatar circle: 32px (w-8 h-8), Bitcoin orange gradient
- Account name: White, bold, truncated
- Hint text: "Click to switch", gray-400
- Arrow icon: Down chevron, gray-400
- Background: gray-800
- Border: gray-700, becomes bitcoin/30 on hover
```

---

### 2. Open State with Dropdown

```
┌────────────────────────────────────────────┐
│ Account Switcher Section                   │
│                                            │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ DROPDOWN PANEL (256px wide)           ┃  │ <- Appears above button
│ ┃                                       ┃  │
│ ┃ ┌───────────────────────────────────┐ ┃  │
│ ┃ │ ACCOUNT LIST (scrollable)         │ ┃  │
│ ┃ │ ┌──────────────────────────────┐  │ ┃  │
│ ┃ │ │ ┏━┓ Account 1            ✓   │  │ ┃  │ <- Selected (orange bg)
│ ┃ │ │ ┗━┛ native-segwit             │  │ ┃  │
│ ┃ │ └──────────────────────────────┘  │ ┃  │
│ ┃ │ ┌──────────────────────────────┐  │ ┃  │
│ ┃ │ │ ┏━┓ Account 2                │  │ ┃  │ <- Default (hover gray)
│ ┃ │ │ ┗━┛ segwit                    │  │ ┃  │
│ ┃ │ └──────────────────────────────┘  │ ┃  │
│ ┃ │ ┌──────────────────────────────┐  │ ┃  │
│ ┃ │ │ ┏━┓ Imported 🔽              │  │ ┃  │ <- With badge
│ ┃ │ │ ┗━┛ legacy                    │  │ ┃  │
│ ┃ │ └──────────────────────────────┘  │ ┃  │
│ ┃ │ ┌──────────────────────────────┐  │ ┃  │
│ ┃ │ │ ┏━┓ Multi 2-of-3              │  │ ┃  │ <- Multisig badge
│ ┃ │ │ ┗━┛ P2WSH                     │  │ ┃  │
│ ┃ │ └──────────────────────────────┘  │ ┃  │
│ ┃ └───────────────────────────────────┘ ┃  │
│ ┃                                       ┃  │
│ ┃ ───────────────────────────────────── ┃  │ <- Divider
│ ┃                                       ┃  │
│ ┃ ┌───────────────────────────────────┐ ┃  │
│ ┃ │ ACTION BUTTONS                    │ ┃  │
│ ┃ │ ┌─────────────────────────────┐   │ ┃  │
│ ┃ │ │ + Create Account  🟠         │   │ ┃  │ <- Primary (orange)
│ ┃ │ └─────────────────────────────┘   │ ┃  │
│ ┃ │ ┌─────────────────────────────┐   │ ┃  │
│ ┃ │ │ ↓ Import Account             │   │ ┃  │ <- Secondary (gray)
│ ┃ │ └─────────────────────────────┘   │ ┃  │
│ ┃ │ ┌─────────────────────────────┐   │ ┃  │
│ ┃ │ │ + Create Multisig        ↗  │   │ ┃  │ <- Secondary (gray)
│ ┃ │ └─────────────────────────────┘   │ ┃  │
│ ┃ └───────────────────────────────────┘ ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                            │
│ ┌─────────────────────────────────┐        │
│ │ ┏━┓ Account 1              ↑   │        │ <- Button (arrow up when open)
│ │ ┗━┛ Click to switch             │        │
│ └─────────────────────────────────┘        │
│                                            │
│ ┌────────────┬────────────┐                │
│ │    Help    │   🔒 Lock  │                │
│ └────────────┴────────────┘                │
│ ┌─────────────────────────┐                │
│ │    ⚙ Settings           │                │
│ └─────────────────────────┘                │
└────────────────────────────────────────────┘
```

---

## Component States Visual Reference

### Account Item States

#### 1. Default (Not Selected, Not Hovered)
```
┌────────────────────────────────────┐
│  ┏━┓  Account 2                   │  <- Transparent background
│  ┗━┛  native-segwit               │     White text
└────────────────────────────────────┘     No border
```

#### 2. Hovered (Not Selected)
```
┌────────────────────────────────────┐
│  ┏━┓  Account 2                   │  <- bg-gray-750
│  ┗━┛  native-segwit               │     White text (slightly brighter)
└────────────────────────────────────┘     No border
                                          Smooth transition
```

#### 3. Selected (Not Hovered)
```
┌────────────────────────────────────┐
│█ ┏━┓  Account 1               ✓   │  <- bg-bitcoin-subtle
│█ ┗━┛  native-segwit               │     border-l-2 border-bitcoin (orange)
└────────────────────────────────────┘     Checkmark icon (orange)
```

#### 4. Selected + Hovered
```
┌────────────────────────────────────┐
│█ ┏━┓  Account 1               ✓   │  <- bg-bitcoin-subtle (same as selected)
│█ ┗━┛  native-segwit               │     No additional hover effect
└────────────────────────────────────┘     Maintains selected appearance
```

---

### Account Item with Badges

#### Imported Account
```
┌────────────────────────────────────┐
│  ┏━┓  Imported Wallet   🔽         │  <- Download icon (blue)
│  ┗━┛  legacy                       │     ImportBadge component
└────────────────────────────────────┘     w-4 h-4 size
```

#### Multisig Account
```
┌────────────────────────────────────┐
│  ┏━┓  Company Wallet   👥 2-of-3   │  <- People icon (purple)
│  ┗━┛  P2WSH                        │     MultisigBadge component
└────────────────────────────────────┘     Displays config
```

#### Imported + Multisig (Rare Edge Case)
```
┌────────────────────────────────────┐
│  ┏━┓  Special  🔽  👥 2-of-2       │  <- Both badges inline
│  ┗━┛  P2SH                         │     May wrap if name too long
└────────────────────────────────────┘
```

---

### Action Button States

#### Primary Button (Create Account)

**Default:**
```
┌─────────────────────────────────────┐
│    + Create Account                 │  <- bg-bitcoin (#f7931a)
└─────────────────────────────────────┘     text-white
                                            shadow-sm
```

**Hover:**
```
┌─────────────────────────────────────┐
│    + Create Account                 │  <- bg-bitcoin-hover
└─────────────────────────────────────┘     shadow-md (elevated)
                                            Smooth transition
```

**Active (Click):**
```
┌─────────────────────────────────────┐
│    + Create Account                 │  <- bg-bitcoin-active (darker)
└─────────────────────────────────────┘     Slight scale/depth change
```

---

#### Secondary Buttons (Import, Multisig)

**Default:**
```
┌─────────────────────────────────────┐
│    ↓ Import Account                 │  <- bg-gray-850
└─────────────────────────────────────┘     text-gray-300
                                            border-gray-700
```

**Hover:**
```
┌─────────────────────────────────────┐
│    ↓ Import Account                 │  <- bg-gray-800
└─────────────────────────────────────┘     text-white
                                            border-gray-600
```

---

## Dropdown Positioning Detail

### Spatial Relationship to Sidebar

```
┌──────────────┐
│   SIDEBAR    │
│   (240px)    │
│              │
│              │
│              │
│┌────────────┐│
││  Button    ││ <- 240px wide (full sidebar width minus padding)
││            ││
│└────────────┘│
│┏━━━━━━━━━━━━━━━━┓
│┃ Dropdown       ┃ <- 256px wide (extends 16px beyond sidebar)
│┃ (256px)        ┃    ml-2 = 8px offset from left edge
│┃                ┃    Positioned absolute, bottom-full mb-2
│┃                ┃
│┗━━━━━━━━━━━━━━━━┛
│              │
│ [Help] [Lock]│
│              │
└──────────────┘
```

**Dimensions:**
- Sidebar: 240px (w-60)
- Button: Full width of sidebar content area (minus padding)
- Dropdown: 256px (w-64) - 16px wider than sidebar
- Offset: 8px from left edge (ml-2)
- Gap from button: 8px (mb-2)

**Why it works:**
- Dropdown extends into main content area (over Dashboard/other views)
- Z-index 50 ensures it appears above content
- Click outside closes it (doesn't interfere with main content interaction)

---

## Color Reference Chart

### Background Colors

| Element | Default | Hover | Active/Selected |
|---------|---------|-------|-----------------|
| Trigger Button | `bg-gray-800` | `bg-gray-750` | `bg-gray-750` (when open) |
| Dropdown Panel | `bg-gray-800` | - | - |
| Account Item | Transparent | `bg-gray-750` | `bg-bitcoin-subtle` |
| Primary Button | `bg-bitcoin` | `bg-bitcoin-hover` | `bg-bitcoin-active` |
| Secondary Button | `bg-gray-850` | `bg-gray-800` | - |

### Border Colors

| Element | Default | Hover | Active/Selected |
|---------|---------|-------|-----------------|
| Trigger Button | `border-gray-700` | `border-bitcoin/30` | `border-bitcoin/50` |
| Dropdown Panel | `border-gray-700` | - | - |
| Account Item (Selected) | `border-l-2 border-bitcoin` | - | - |
| Secondary Button | `border-gray-700` | `border-gray-600` | - |

### Text Colors

| Element | Primary Text | Secondary Text |
|---------|--------------|----------------|
| Account Name | `text-white` | - |
| Address Type | `text-gray-400` | - |
| Button Hint | `text-gray-400` | - |
| Primary Button | `text-white` | - |
| Secondary Button | `text-gray-300` (default), `text-white` (hover) | - |

### Accent Colors

| Element | Color | Usage |
|---------|-------|-------|
| Bitcoin Orange | `#f7931a` | Primary actions, selected states, brand |
| Import Badge | Blue (`text-blue-400`) | Imported account indicator |
| Multisig Badge | Purple (`text-purple-400`) | Multisig account indicator |
| Checkmark | Bitcoin orange | Selected account indicator |

---

## Animation Timeline

### Dropdown Open Animation

```
Time: 0ms ──────────────────────────────> 150ms

State:
┌─────────────┐                         ┌─────────────┐
│   Closed    │  ──────────────────────> │    Open     │
└─────────────┘                         └─────────────┘

Properties:
Opacity:    0%  ───────────────────────> 100%
Transform:  translateY(-8px) ──────────> translateY(0)
Easing:     ease-out

Arrow:
Rotation:   0deg ──────────────────────> 180deg
Easing:     ease-out (200ms)
```

### Account Item Hover Transition

```
Time: 0ms ──────────> 200ms

Background: transparent ──> bg-gray-750
Easing:     ease-in-out
Duration:   200ms
```

### Button Hover Transitions

```
Primary Button (Create Account):
- Properties: all (background, shadow)
- Duration: 200ms
- Easing: ease-in-out

Secondary Buttons:
- Properties: colors (background, border, text)
- Duration: 200ms
- Easing: ease-in-out
```

---

## Scrolling Behavior

### Few Accounts (≤5)

```
┏━━━━━━━━━━━━━━━━━━┓
┃ Account 1     ✓ ┃  <- Visible
┃ Account 2       ┃  <- Visible
┃ Account 3       ┃  <- Visible
┃ ─────────────── ┃
┃ [Create]        ┃  <- Visible
┃ [Import]        ┃  <- Visible
┃ [Multisig]      ┃  <- Visible
┗━━━━━━━━━━━━━━━━━━┛

No scrollbar - everything fits
```

### Many Accounts (>6)

```
┏━━━━━━━━━━━━━━━━━━┓
┃ Account 1     ✓ ┃ ▲ <- Scrollbar appears
┃ Account 2       ┃ █
┃ Account 3       ┃ █
┃ Account 4       ┃ █  <- Scrollable area
┃ Account 5       ┃ █     (max-h-[320px])
┃ Account 6       ┃ █
┃ (more below)    ┃ ▼
┃ ─────────────── ┃    <- Divider always visible
┃ [Create]        ┃    <- Buttons always visible
┃ [Import]        ┃
┃ [Multisig]      ┃
┗━━━━━━━━━━━━━━━━━━┛
```

**Scrolling Details:**
- Only account list section scrolls
- Divider and action buttons remain fixed at bottom
- Smooth scrolling (native browser behavior)
- Scrollbar styled to match dark theme (browser default)

---

## Responsive Breakpoints

### Standard Layout (All Views)

```
┌──────────────┬─────────────────────────────────────────┐
│   Sidebar    │  Main Content Area                      │
│   240px      │  Flexible width                         │
│              │                                         │
│  [Dropdown]  │                                         │
│     ↓        │                                         │
│    Extends   │                                         │
│    into      │                                         │
│    this area │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘

Total width: Sidebar (240px) + Main (flexible)
Minimum width: ~800px (standard extension viewport)
```

**Note:** This is a Chrome extension with fixed minimum viewport size. No mobile/tablet breakpoints needed.

---

## Interaction Flow Diagrams

### Account Switching Flow

```
User clicks account in dropdown
         │
         ▼
onAccountSwitch(index) called
         │
         ▼
Close dropdown (setIsDropdownOpen(false))
         │
         ▼
Parent (App.tsx) updates currentAccountIndex
         │
         ▼
Trigger data refresh for new account
         │
         ▼
UI updates:
  - Sidebar button shows new account name
  - Dashboard refreshes with new account data
  - Other views (if applicable) refresh
```

### Create Account Flow

```
User clicks "Create Account" button
         │
         ▼
Close dropdown
         │
         ▼
onCreateAccount() prop called
         │
         ▼
Parent shows create account modal
         │
         ▼
User creates account
         │
         ▼
Modal closes, accounts list refreshed
         │
         ▼
Dropdown updates with new account
```

### Dropdown Open/Close Flow

```
User clicks trigger button
         │
         ▼
Toggle isDropdownOpen state
         │
         ├─── If opening:
         │    - Render dropdown
         │    - Play slide-down animation
         │    - Rotate arrow 180°
         │    - Attach click-outside listener
         │    - Attach Escape key listener
         │
         └─── If closing:
              - Remove dropdown
              - Rotate arrow back
              - Remove event listeners
```

---

## Accessibility Features

### ARIA Structure

```
<button
  aria-expanded="true"        <- Indicates dropdown state
  aria-haspopup="true"        <- Has associated popup menu
  aria-label="Account switcher"  <- Screen reader label
>

<div
  role="menu"                 <- Semantic menu role
  aria-label="Account management menu"  <- Menu purpose
>
  <button role="menuitem">    <- Each account is a menu item
  <button role="menuitem">
  ...
</div>
```

### Keyboard Support (Future)

```
Trigger Button (focused)
  │
  ├─ Enter/Space → Open dropdown, focus first account
  │
Dropdown Open
  │
  ├─ Tab → Navigate through accounts and buttons
  ├─ Shift+Tab → Navigate backwards
  ├─ Arrow Down → Next account (focus)
  ├─ Arrow Up → Previous account (focus)
  ├─ Enter/Space → Select focused account/button
  ├─ Escape → Close dropdown, return focus to trigger
```

---

## Implementation Priority Matrix

### Phase 1: Core Functionality (High Priority)

```
┌─────────────────────────────────┐
│ ✓ Dropdown open/close           │ <- Essential
│ ✓ Account list rendering        │ <- Essential
│ ✓ Account switching logic       │ <- Essential
│ ✓ Action buttons                │ <- Essential
│ ✓ Close on click outside        │ <- Essential
│ ✓ Close on Escape               │ <- Essential
└─────────────────────────────────┘
```

### Phase 2: Visual Polish (Medium Priority)

```
┌─────────────────────────────────┐
│ ✓ Slide-down animation          │ <- Nice to have
│ ✓ Arrow rotation animation      │ <- Nice to have
│ ✓ Hover states (all elements)   │ <- Important
│ ✓ Scrolling for many accounts   │ <- Important
│ ✓ Badge display (import/multi)  │ <- Important
└─────────────────────────────────┘
```

### Phase 3: Accessibility (Medium Priority)

```
┌─────────────────────────────────┐
│ ✓ ARIA labels                   │ <- Important
│ ✓ Semantic HTML                 │ <- Important
│ ○ Keyboard navigation           │ <- Future enhancement
│ ○ Screen reader testing         │ <- Future enhancement
└─────────────────────────────────┘
```

---

## Quick Reference Card

### Props to Add

```typescript
accounts: WalletAccount[]
currentAccountIndex: number
onAccountSwitch: (index: number) => void
onCreateAccount: () => void
onImportAccount: () => void
onCreateMultisig: () => void
```

### State to Add

```typescript
const [isDropdownOpen, setIsDropdownOpen] = useState(false);
const dropdownRef = useRef<HTMLDivElement>(null);
const triggerRef = useRef<HTMLButtonElement>(null);
```

### Key Classes

```typescript
// Dropdown panel
"absolute bottom-full left-0 ml-2 mb-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 py-2"

// Account item (selected)
"bg-bitcoin-subtle border-l-2 border-bitcoin"

// Account item (hover)
"hover:bg-gray-750"

// Primary button
"bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active text-white"

// Secondary button
"bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600"
```

---

## Testing Checklist Visual Guide

### Test with Different Account Counts

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 0 Accounts  │ 1 Account   │ 5 Accounts  │ 10+ Accounts│
│ (Edge Case) │ (Minimal)   │ (Typical)   │ (Scrolling) │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Show empty  │ Shows list  │ No scroll   │ Scroll bar  │
│ state with  │ with single │ Full list   │ appears     │
│ only action │ item        │ visible     │ Test scroll │
│ buttons     │ Checkmark   │ Test select │ performance │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Test with Different Account Types

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ HD Account   │ Imported     │ Multisig     │ Mixed        │
│ (Standard)   │ (With Badge) │ (With Badge) │ (All Types)  │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ No badges    │ Blue import  │ Purple multi │ All badges   │
│ Address type │ badge shown  │ badge shown  │ render       │
│ shown        │ Tooltip      │ Config shown │ correctly    │
│              │ works        │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

### Test Interactions

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Click Outside   │ Escape Key      │ Account Switch  │
├─────────────────┼─────────────────┼─────────────────┤
│ Dropdown closes │ Dropdown closes │ Closes dropdown │
│ No errors       │ Focus restored  │ Updates UI      │
│ Smooth          │ No errors       │ Data refreshes  │
└─────────────────┴─────────────────┴─────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│ Create Account  │ Import Account  │ Create Multisig │
├─────────────────┼─────────────────┼─────────────────┤
│ Opens modal     │ Opens modal     │ Navigates to    │
│ Closes dropdown │ Closes dropdown │ multisig view   │
│ Modal works     │ Modal works     │ Closes dropdown │
└─────────────────┴─────────────────┴─────────────────┘
```

---

## Summary

This visual guide provides:

1. **Before/After comparison** showing the consolidation
2. **Detailed component layouts** in ASCII art
3. **State visualizations** for all interactive elements
4. **Color reference chart** for consistent styling
5. **Animation timelines** for smooth transitions
6. **Scrolling behavior** for different account counts
7. **Interaction flow diagrams** for key user journeys
8. **Accessibility structure** with ARIA labels
9. **Implementation priority matrix** for phased development
10. **Testing checklist** with visual scenarios

Use this guide alongside the main design specification for complete implementation guidance.

---

**Status:** ✅ Complete
**Companion to:** `SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md`
**Ready for:** Frontend Developer Implementation
