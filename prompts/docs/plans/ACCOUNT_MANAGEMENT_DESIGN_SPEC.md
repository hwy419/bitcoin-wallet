# Account Management UI/UX Design Specification

**Feature:** Enhanced Account Dropdown with Single-Sig Creation/Import
**Version:** 1.0
**Created:** October 18, 2025
**Designer:** UI/UX Designer
**Status:** Design Complete - Ready for Implementation
**Related PRD:** `ACCOUNT_DROPDOWN_SINGLESIG_PRD.md`

---

## Table of Contents
1. [Design Overview](#design-overview)
2. [Design Decisions](#design-decisions)
3. [Account Dropdown Redesign](#account-dropdown-redesign)
4. [Create Account Modal](#create-account-modal)
5. [Import Account Modal](#import-account-modal)
6. [Visual Design System](#visual-design-system)
7. [Interaction Patterns](#interaction-patterns)
8. [Component Reuse Strategy](#component-reuse-strategy)
9. [Accessibility Considerations](#accessibility-considerations)
10. [Implementation Checklist](#implementation-checklist)

---

## 1. Design Overview

### Problem Statement
Currently, users can only create multisig accounts from the Account dropdown on the Assets tab. There's no way to create or import additional single-signature accounts after initial wallet setup, creating an inconsistent and incomplete user experience.

### Design Goals
1. **Consistency**: Provide unified account creation experience (single-sig and multisig)
2. **Clarity**: Clear visual distinction between account types and creation methods
3. **Simplicity**: Simple forms that don't overwhelm users
4. **Security**: Prominent warnings for imported accounts
5. **Accessibility**: Keyboard navigation, screen reader support, proper focus management

### Design Approach
- **Modal-based forms** - Consistent with tab architecture (800px centered containers)
- **Progressive disclosure** - Only show complexity when needed
- **Bitcoin orange for primary actions** - Maintain brand consistency
- **Dark theme throughout** - Matches existing design system

---

## 2. Design Decisions

### Decision 1: Modal vs. Full-Screen Forms
**Choice:** Modal dialogs with 800px centered content

**Rationale:**
- Maintains context (dashboard visible in background with blur)
- Consistent with tab architecture patterns (800px centered)
- Faster interaction (no page navigation required)
- Clear entry/exit points (open modal → complete → close)
- Similar to multisig wizard mental model but simpler

**Implementation:**
- Reuse existing `Modal` component from `src/tab/components/shared/Modal.tsx`
- Dark overlay backdrop with blur
- ESC key and click-outside to close (with confirmation if form is dirty)

### Decision 2: Button Hierarchy in Dropdown
**Choice:** Orange primary button for "Create Account", gray secondary for others

**Visual Hierarchy:**
```
1. Create Account (Primary - Bitcoin Orange)
2. Import Account (Secondary - Gray)
3. Create Multisig Account (Secondary - Gray with external link icon)
```

**Rationale:**
- "Create Account" is most common action (80% of use cases)
- Orange draws attention to primary action
- Multisig creation is specialized, less frequent
- Import is advanced feature, secondary action
- Matches user expectations from similar UX patterns (MetaMask, etc.)

### Decision 3: Import Method Tabs
**Choice:** Horizontal tab switcher (Private Key / Seed Phrase)

**Rationale:**
- Only 2 options (tabs work well for 2-4 choices)
- Clear visual separation of methods
- Familiar pattern (users understand tabs)
- Easy to switch between methods without losing context
- More intuitive than dropdown selector

### Decision 4: Address Type Selection
**Choice:** Dropdown selector with recommendations

**Rationale:**
- 3 address types (Legacy, SegWit, Native SegWit)
- Native SegWit as default/recommended (lower fees)
- Helper text explains benefits of each type
- Consistent with existing WalletSetup component pattern

### Decision 5: Import Account Badges
**Choice:** Small blue import icon next to account name

**Visual Design:**
```
Download arrow (↓) icon
Color: #60A5FA (blue-400)
Size: 16px
Position: Right of account name, before address type badge
Tooltip: "Imported account - Back up separately"
```

**Rationale:**
- Blue conveys "information/different" without alarm
- Consistent with download/import metaphor
- Subtle but noticeable
- Tooltip provides education on hover
- Doesn't clutter the dropdown

---

## 3. Account Dropdown Redesign

### 3.1 Current Layout (Before)

```
┌─────────────────────────────────────────────────┐
│ Account Dropdown                                 │
├─────────────────────────────────────────────────┤
│                                                   │
│ ✓ Account 1                    [Native SegWit]  │
│   Account 2                    [SegWit]          │
│   Multisig Vault               [2-of-3]          │
│                                                   │
├─────────────────────────────────────────────────┤
│                                                   │
│ [+ Create Multisig Account] 🔗                   │ ← Only option
│                                                   │
└─────────────────────────────────────────────────┘
```

### 3.2 New Layout (After)

```
┌─────────────────────────────────────────────────┐
│ Account Dropdown                                 │
├─────────────────────────────────────────────────┤
│                                                   │
│ ✓ Account 1                    [Native SegWit]  │
│   Account 2                    [SegWit]          │
│   Imported Wallet ↓            [Legacy]          │ ← Import badge
│   Multisig Vault               [2-of-3]          │
│                                                   │
├─────────────────────────────────────────────────┤
│                                                   │
│ [+  Create Account            ]                  │ ← Primary (orange)
│                                                   │
│ [↓  Import Account            ]                  │ ← Secondary (gray)
│                                                   │
│ [+  Create Multisig Account  🔗]                 │ ← Secondary (gray)
│                                                   │
└─────────────────────────────────────────────────┘
```

### 3.3 Dropdown Component Specifications

**Container:**
```css
Width:                  280px (increased from 256px for better button text)
Max Height:             420px (account list scrollable if >8 accounts)
Background:             #1E1E1E (gray-800)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          12px (rounded-xl)
Box Shadow:             0 8px 24px rgba(0, 0, 0, 0.4)
Padding:                8px
Position:               Absolute, top: 100% + 8px, left: 0
Z-Index:                50
Animation:              Fade in + slide down (200ms ease-out)
```

**Account List Section:**
```css
Padding:                8px 0
Border Bottom:          1px solid #3F3F3F (gray-700)
Margin Bottom:          8px
Max Height:             280px (scroll if needed)
Overflow Y:             Auto
```

**Account Row:**
```css
Width:                  100%
Padding:                12px 16px
Border Radius:          8px
Display:                Flex, align-items: center, justify-content: space-between
Transition:             Background 150ms ease

Hover:
  Background:           #2A2A2A (gray-800)
  Cursor:               Pointer

Active/Selected:
  Background:           rgba(247, 147, 26, 0.1) (bitcoin-subtle)
  Border Left:          3px solid #F7931A (bitcoin orange)
```

**Account Row Content:**
```
Left Side (Flex 1):
├── Account Name (Text, 14px, Semibold, #FFFFFF)
│   └── Import Badge (if imported) - Download icon, 16px, #60A5FA
└── Address Type (Text, 12px, Regular, #9CA3AF gray-400, Capitalize)

Right Side:
└── Checkmark Icon (if selected) - 20px, #F7931A (bitcoin orange)
```

**Action Buttons Section:**
```css
Padding:                8px 0
Gap:                    8px
Display:                Flex, flex-direction: column
```

### 3.4 Button Specifications

#### Create Account Button (Primary)
```css
Width:                  100%
Height:                 48px
Padding:                12px 16px
Background:             #F7931A (bitcoin orange)
Border:                 None
Border Radius:          8px
Font:                   14px, Semibold, #FFFFFF
Display:                Flex, align-items: center, justify-content: center
Gap:                    8px
Transition:             All 150ms ease
Cursor:                 Pointer

Icon:
  Plus sign (+)
  Size:                 20px
  Color:                #FFFFFF

Hover:
  Background:           #FF9E2D (bitcoin-hover)
  Transform:            translateY(-1px)
  Box Shadow:           0 4px 12px rgba(247, 147, 26, 0.3)

Active:
  Background:           #E88711 (bitcoin-active)
  Transform:            translateY(0)
  Box Shadow:           0 2px 6px rgba(247, 147, 26, 0.2)

Focus:
  Outline:              2px solid #FFA43D
  Outline Offset:       2px
```

#### Import Account Button (Secondary)
```css
Width:                  100%
Height:                 48px
Padding:                12px 16px
Background:             #1E1E1E (gray-850)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Font:                   14px, Semibold, #D1D5DB (gray-300)
Display:                Flex, align-items: center, justify-content: center
Gap:                    8px
Transition:             All 150ms ease
Cursor:                 Pointer

Icon:
  Download arrow (↓)
  Size:                 20px
  Color:                #D1D5DB (gray-300)

Hover:
  Background:           #2A2A2A (gray-800)
  Border Color:         #4A4A4A (gray-600)
  Color:                #FFFFFF
  Icon Color:           #FFFFFF

Active:
  Background:           #1A1A1A (gray-900)
  Border Color:         #3F3F3F (gray-700)

Focus:
  Outline:              2px solid #60A5FA
  Outline Offset:       2px
```

#### Create Multisig Account Button (Secondary with External Link)
```css
/* Same as Import Account Button, with additions: */

Icons:
  Plus sign (+) - 20px, #D1D5DB
  External link (🔗) - 16px, #9CA3AF, margin-left: auto

Layout:
  Justify Content:      Space-between (icon left, text center, link icon right)
```

### 3.5 Import Account Badge (in Account List)

```css
Display:                Inline-flex
Align Items:            Center
Margin Left:            6px
Color:                  #60A5FA (blue-400)
Cursor:                 Help

Icon:
  Download arrow (↓)
  Size:                 16px
  Stroke Width:         2

Tooltip (on hover):
  Background:           #1A1A1A (gray-900)
  Border:               1px solid #3F3F3F (gray-700)
  Padding:              8px 12px
  Font Size:            12px
  Color:                #FFFFFF
  Border Radius:        6px
  Box Shadow:           0 4px 12px rgba(0, 0, 0, 0.3)
  Text:                 "Imported account - Back up separately"
  Arrow:                Pointing to badge
  Delay:                300ms
```

---

## 4. Create Account Modal

### 4.1 Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Modal Backdrop (Black 70% opacity, Blur 8px)                 │
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Create New Account                            [X]   │    │ ← Header
│   ├────────────────────────────────────────────────────┤    │
│   │                                                      │    │
│   │  ┌──────────────────────────────────────────────┐  │    │
│   │  │ Account Name                                 │  │    │
│   │  │ ┌──────────────────────────────────────────┐ │  │    │
│   │  │ │ My Savings Account_                      │ │  │    │
│   │  │ └──────────────────────────────────────────┘ │  │    │
│   │  │ Enter a name to identify this account       │  │    │
│   │  └──────────────────────────────────────────────┘  │    │
│   │                                                      │    │
│   │  ┌──────────────────────────────────────────────┐  │    │
│   │  │ Address Type                                 │  │    │
│   │  │ ┌──────────────────────────────────────────┐ │  │    │
│   │  │ │ Native SegWit (Recommended)           ▼ │ │  │    │
│   │  │ └──────────────────────────────────────────┘ │  │    │
│   │  │ Lower fees and better privacy               │  │    │
│   │  └──────────────────────────────────────────────┘  │    │
│   │                                                      │    │
│   │  ℹ️ This account will be derived from your         │    │
│   │     existing wallet seed using BIP44 derivation    │    │
│   │     path m/84'/1'/N'/0/0                           │    │
│   │                                                      │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                      │    │ ← Footer
│   │  [Cancel]                    [Create Account]      │    │
│   │                                                      │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 Modal Container Specifications

```css
Width:                  800px
Max Width:              90vw (responsive for smaller screens)
Background:             #1A1A1A (gray-900)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          16px (rounded-2xl)
Box Shadow:             0 20px 60px rgba(0, 0, 0, 0.6)
Max Height:             90vh
Overflow Y:             Auto
Animation:              Scale in + fade in (250ms ease-out)

Backdrop:
  Background:           rgba(0, 0, 0, 0.7)
  Backdrop Filter:      blur(8px)
  Position:             Fixed, inset: 0
  Z-Index:              50
  Display:              Flex, align-items: center, justify-content: center
  Padding:              16px
```

### 4.3 Header Section

```css
Height:                 80px
Padding:                24px 32px
Border Bottom:          1px solid #2E2E2E (gray-750)
Display:                Flex, align-items: center, justify-content: space-between
Background:             #1E1E1E (gray-850) - subtle elevation

Title:
  Font Size:            20px
  Font Weight:          Semibold
  Color:                #FFFFFF
  Letter Spacing:       -0.01em

Close Button:
  Width:                32px
  Height:               32px
  Background:           Transparent
  Border:               None
  Color:                #9CA3AF (gray-400)
  Border Radius:        6px
  Display:              Flex, align-items: center, justify-content: center
  Cursor:               Pointer

  Icon:
    X mark
    Size:               20px
    Stroke Width:       2

  Hover:
    Background:         #2A2A2A (gray-800)
    Color:              #FFFFFF

  Focus:
    Outline:            2px solid #60A5FA
    Outline Offset:     2px
```

### 4.4 Content Section

```css
Padding:                32px 32px 24px
Display:                Flex, flex-direction: column
Gap:                    24px
Min Height:             200px
```

#### Form Field: Account Name

**Field Container:**
```css
Display:                Flex, flex-direction: column
Gap:                    8px
```

**Label:**
```css
Font Size:              14px
Font Weight:            Medium
Color:                  #D1D5DB (gray-300)
Letter Spacing:         0.01em
Margin Bottom:          8px
```

**Input:**
```css
Width:                  100%
Height:                 48px
Padding:                12px 16px
Background:             #0F0F0F (gray-950)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Font Size:              14px
Color:                  #FFFFFF
Transition:             All 150ms ease

Placeholder:
  Color:                #6B7280 (gray-500)
  Text:                 "e.g., My Savings Account"

Focus:
  Border Color:         #F7931A (bitcoin orange)
  Outline:              None
  Box Shadow:           0 0 0 3px rgba(247, 147, 26, 0.1)

Error:
  Border Color:         #EF4444 (red-500)
  Box Shadow:           0 0 0 3px rgba(239, 68, 68, 0.1)

Disabled:
  Background:           #1A1A1A (gray-900)
  Color:                #6B7280 (gray-500)
  Cursor:               Not-allowed
```

**Helper Text:**
```css
Font Size:              12px
Color:                  #9CA3AF (gray-400)
Line Height:            16px
Margin Top:             6px
```

**Error Message:**
```css
Font Size:              12px
Color:                  #EF4444 (red-500)
Line Height:            16px
Display:                Flex, align-items: center
Gap:                    6px
Margin Top:             6px

Icon:
  Alert circle
  Size:                 14px
```

**Character Counter:**
```css
Font Size:              12px
Color:                  #6B7280 (gray-500)
Text Align:             Right
Margin Top:             6px

Near Limit (>25 chars):
  Color:                #F59E0B (amber-500)

At Limit (30 chars):
  Color:                #EF4444 (red-500)
```

#### Form Field: Address Type Selector

**Dropdown:**
```css
Width:                  100%
Height:                 48px
Padding:                12px 16px
Background:             #0F0F0F (gray-950)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Font Size:              14px
Color:                  #FFFFFF
Cursor:                 Pointer
Position:               Relative
Display:                Flex, align-items: center, justify-content: space-between

Chevron Icon:
  Size:                 20px
  Color:                #9CA3AF (gray-400)
  Position:             Absolute, right: 16px
  Transition:           Transform 150ms ease

  Open:
    Transform:          Rotate(180deg)

Focus:
  Border Color:         #F7931A (bitcoin orange)
  Outline:              None
  Box Shadow:           0 0 0 3px rgba(247, 147, 26, 0.1)
```

**Dropdown Menu:**
```css
Position:               Absolute
Top:                    100% + 4px
Left:                   0
Right:                  0
Background:             #1E1E1E (gray-850)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Box Shadow:             0 8px 24px rgba(0, 0, 0, 0.4)
Z-Index:                10
Padding:                4px
Animation:              Fade in + slide down (150ms ease-out)
```

**Dropdown Option:**
```css
Padding:                12px 16px
Border Radius:          6px
Cursor:                 Pointer
Transition:             Background 100ms ease

Label:
  Font Size:            14px
  Font Weight:          Medium
  Color:                #FFFFFF
  Display:              Block
  Margin Bottom:        2px

Description:
  Font Size:            12px
  Color:                #9CA3AF (gray-400)
  Display:              Block

Recommended Badge:
  Display:              Inline-block
  Margin Left:          8px
  Padding:              2px 8px
  Background:           rgba(247, 147, 26, 0.15)
  Color:                #F7931A
  Font Size:            10px
  Font Weight:          Semibold
  Border Radius:        4px
  Text Transform:       Uppercase
  Letter Spacing:       0.05em

Hover:
  Background:           #2A2A2A (gray-800)

Selected:
  Background:           rgba(247, 147, 26, 0.1)
  Border Left:          2px solid #F7931A
```

**Address Type Options:**
```
1. Native SegWit (Recommended) ← Default
   - Lower fees and better privacy
   - tb1... addresses
   - BIP84 (m/84'/1'/N'/0/0)

2. SegWit
   - Moderate fees, good compatibility
   - 2... addresses
   - BIP49 (m/49'/1'/N'/0/0)

3. Legacy
   - Widest compatibility, higher fees
   - m/n... addresses
   - BIP44 (m/44'/1'/N'/0/0)
```

#### Info Box (HD Derivation Explanation)

```css
Display:                Flex
Gap:                    12px
Padding:                16px
Background:             rgba(59, 130, 246, 0.08) (blue-subtle)
Border:                 1px solid rgba(59, 130, 246, 0.2)
Border Radius:          8px
Margin Top:             8px

Icon:
  Info circle (ℹ️)
  Size:                 20px
  Color:                #60A5FA (blue-400)
  Flex Shrink:          0

Text:
  Font Size:            13px
  Line Height:          20px
  Color:                #D1D5DB (gray-300)

Code (derivation path):
  Font Family:          Monospace
  Background:           rgba(0, 0, 0, 0.3)
  Padding:              2px 6px
  Border Radius:        4px
  Color:                #FDE68A (yellow-200)
  Font Size:            12px
```

### 4.5 Footer Section

```css
Height:                 80px
Padding:                20px 32px
Border Top:             1px solid #2E2E2E (gray-750)
Display:                Flex, align-items: center, justify-content: space-between
Background:             #1E1E1E (gray-850)
```

**Cancel Button:**
```css
Height:                 44px
Padding:                12px 24px
Background:             Transparent
Border:                 1px solid #4A4A4A (gray-600)
Border Radius:          8px
Font Size:              14px
Font Weight:            Semibold
Color:                  #D1D5DB (gray-300)
Cursor:                 Pointer
Transition:             All 150ms ease
Min Width:              100px

Hover:
  Background:           #2A2A2A (gray-800)
  Border Color:         #6B7280 (gray-500)
  Color:                #FFFFFF

Active:
  Background:           #1A1A1A (gray-900)

Focus:
  Outline:              2px solid #60A5FA
  Outline Offset:       2px
```

**Create Account Button:**
```css
Height:                 44px
Padding:                12px 32px
Background:             #F7931A (bitcoin orange)
Border:                 None
Border Radius:          8px
Font Size:              14px
Font Weight:            Semibold
Color:                  #FFFFFF
Cursor:                 Pointer
Transition:             All 150ms ease
Min Width:              160px

Hover:
  Background:           #FF9E2D (bitcoin-hover)
  Box Shadow:           0 4px 12px rgba(247, 147, 26, 0.3)

Active:
  Background:           #E88711 (bitcoin-active)
  Box Shadow:           0 2px 6px rgba(247, 147, 26, 0.2)

Disabled:
  Background:           #4A4A4A (gray-600)
  Color:                #9CA3AF (gray-400)
  Cursor:               Not-allowed
  Opacity:              0.6

Loading:
  Position:             Relative
  Color:                Transparent

  Spinner (pseudo-element):
    Position:           Absolute
    Width:              20px
    Height:             20px
    Border:             2px solid rgba(255, 255, 255, 0.3)
    Border Top Color:   #FFFFFF
    Border Radius:      50%
    Animation:          Spin 600ms linear infinite

Focus:
  Outline:              2px solid #FFA43D
  Outline Offset:       2px
```

---

## 5. Import Account Modal

### 5.1 Layout Overview

```
┌──────────────────────────────────────────────────────────────┐
│ Modal Backdrop                                                │
│                                                               │
│   ┌────────────────────────────────────────────────────┐    │
│   │ Import Account                                [X]   │    │ ← Header
│   ├────────────────────────────────────────────────────┤    │
│   │ [Private Key]   [Seed Phrase]                      │    │ ← Tabs
│   ├────────────────────────────────────────────────────┤    │
│   │                                                      │    │
│   │  ⚠️ Warning: Imported accounts are NOT backed up   │    │ ← Security Warning
│   │     by your wallet's main seed phrase. Back them   │    │
│   │     up separately.                                  │    │
│   │                                                      │    │
│   │  ┌──────────────────────────────────────────────┐  │    │
│   │  │ Private Key (WIF Format)                     │  │    │
│   │  │ ┌──────────────────────────────────────────┐ │  │    │
│   │  │ │ cVhT...                                  │ │  │    │
│   │  │ │                                           │ │  │    │
│   │  │ │                                           │ │  │    │
│   │  │ └──────────────────────────────────────────┘ │  │    │
│   │  │ Testnet keys start with 'c'                 │  │    │
│   │  └──────────────────────────────────────────────┘  │    │
│   │                                                      │    │
│   │  ┌──────────────────────────────────────────────┐  │    │
│   │  │ Account Name                                 │  │    │
│   │  │ ┌──────────────────────────────────────────┐ │  │    │
│   │  │ │ Imported Paper Wallet_                   │ │  │    │
│   │  │ └──────────────────────────────────────────┘ │  │    │
│   │  │ Enter a name to identify this account       │  │    │
│   │  └──────────────────────────────────────────────┘  │    │
│   │                                                      │    │
│   ├────────────────────────────────────────────────────┤    │
│   │                                                      │    │
│   │  [Cancel]                    [Import Account]      │    │ ← Footer
│   │                                                      │    │
│   └────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 Tab Navigation

```css
Height:                 56px
Padding:                0 32px
Border Bottom:          1px solid #2E2E2E (gray-750)
Display:                Flex
Gap:                    4px
Background:             #1E1E1E (gray-850)
```

**Tab Button:**
```css
Height:                 56px
Padding:                0 24px
Background:             Transparent
Border:                 None
Border Bottom:          2px solid Transparent
Font Size:              14px
Font Weight:            Medium
Color:                  #9CA3AF (gray-400)
Cursor:                 Pointer
Transition:             All 150ms ease
Position:               Relative

Hover:
  Color:                #D1D5DB (gray-300)
  Background:           rgba(255, 255, 255, 0.03)

Active (Selected):
  Color:                #F7931A (bitcoin orange)
  Border Bottom Color:  #F7931A

  ::after pseudo-element (glow):
    Position:           Absolute
    Bottom:             -2px
    Left:               0
    Right:              0
    Height:             2px
    Background:         Linear gradient to right
                        from transparent via #F7931A to transparent
    Box Shadow:         0 0 8px rgba(247, 147, 26, 0.5)

Focus:
  Outline:              2px solid #60A5FA
  Outline Offset:       -2px
  Border Radius:        4px
```

### 5.3 Security Warning Banner

```css
Display:                Flex
Gap:                    12px
Padding:                16px 32px
Background:             rgba(245, 158, 11, 0.1) (amber-subtle)
Border:                 1px solid rgba(245, 158, 11, 0.3)
Border Left:            4px solid #F59E0B (amber-500)
Border Right:           None
Border Top:             None
Border Bottom:          None
Margin:                 0

Icon:
  Warning triangle (⚠️)
  Size:                 24px
  Color:                #FBBF24 (amber-400)
  Flex Shrink:          0

Text:
  Font Size:            13px
  Line Height:          20px
  Color:                #FEF3C7 (amber-100)
  Font Weight:          Medium

Strong/Bold Text:
  Font Weight:          Semibold
  Color:                #FBBF24 (amber-400)
```

### 5.4 Private Key Tab Content

#### Private Key Input Field

**Textarea:**
```css
Width:                  100%
Min Height:             120px
Padding:                16px
Background:             #0F0F0F (gray-950)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Font Family:            Monospace (SF Mono, Monaco, Courier New)
Font Size:              13px
Line Height:            20px
Color:                  #FFFFFF
Resize:                 Vertical
Transition:             All 150ms ease

Placeholder:
  Color:                #6B7280 (gray-500)
  Font Family:          Monospace
  Text:                 "cVhT... (testnet WIF format)"

Focus:
  Border Color:         #F7931A (bitcoin orange)
  Outline:              None
  Box Shadow:           0 0 0 3px rgba(247, 147, 26, 0.1)

Error:
  Border Color:         #EF4444 (red-500)
  Box Shadow:           0 0 0 3px rgba(239, 68, 68, 0.1)

Success (valid):
  Border Color:         #22C55E (green-500)
  Box Shadow:           0 0 0 3px rgba(34, 197, 94, 0.1)
```

**Helper Text Examples:**
```
Default:  "Testnet private keys start with 'c'"
Error:    "Invalid WIF format. Private keys start with 'c' for testnet."
Success:  "Valid testnet private key detected"
```

### 5.5 Seed Phrase Tab Content

```
┌────────────────────────────────────────────────────┐
│                                                      │
│  ⚠️ Warning: This account uses a different seed    │
│     phrase. Back it up separately from your main   │
│     wallet seed.                                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Seed Phrase (12 or 24 words)                 │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │ abandon abandon abandon ...              │ │  │
│  │ │                                           │ │  │
│  │ │                                           │ │  │
│  │ │                                           │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  │ Words: 12/12 ✓                              │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Account Index                                │  │
│  │ ┌────────────────────────┐                  │  │
│  │ │ 0                      │                  │  │
│  │ └────────────────────────┘                  │  │
│  │ Which account to derive (default: 0)        │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Address Type                                 │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │ Native SegWit (Recommended)           ▼ │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  │ Lower fees and better privacy               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Account Name                                 │  │
│  │ ┌──────────────────────────────────────────┐ │  │
│  │ │ Imported from Electrum_                  │ │  │
│  │ └──────────────────────────────────────────┘ │  │
│  │ Enter a name to identify this account       │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
└────────────────────────────────────────────────────┘
```

#### Seed Phrase Textarea

```css
Width:                  100%
Min Height:             120px
Padding:                16px
Background:             #0F0F0F (gray-950)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Font Family:            System font (NOT monospace - easier to read words)
Font Size:              14px
Line Height:            24px
Color:                  #FFFFFF
Resize:                 Vertical

Placeholder:
  Color:                #6B7280 (gray-500)
  Text:                 "abandon abandon abandon ... (12 or 24 words)"

Word Validation (real-time):
  Invalid Word:
    Background:         rgba(239, 68, 68, 0.15) (highlight invalid)
    Text Decoration:    Wavy underline, #EF4444
    Tooltip:            "Word not in BIP39 wordlist. Did you mean 'bitcoin'?"

Focus:
  Border Color:         #F7931A (bitcoin orange)
  Box Shadow:           0 0 0 3px rgba(247, 147, 26, 0.1)

Error (wrong word count or checksum):
  Border Color:         #EF4444 (red-500)
  Box Shadow:           0 0 0 3px rgba(239, 68, 68, 0.1)

Success (valid seed):
  Border Color:         #22C55E (green-500)
  Box Shadow:           0 0 0 3px rgba(34, 197, 94, 0.1)
```

**Word Counter:**
```css
Display:                Flex
Justify Content:        Space-between
Margin Top:             8px
Font Size:              12px

Word Count:
  Color:                #9CA3AF (gray-400)

  Valid (12 or 24):
    Color:              #22C55E (green-500)
    Icon:               Checkmark ✓

  Invalid:
    Color:              #F59E0B (amber-500)
    Text:               "Expected 12 or 24 words"

Checksum Status:
  Color:                #9CA3AF (gray-400)

  Valid:
    Color:              #22C55E (green-500)
    Text:               "Valid checksum ✓"

  Invalid:
    Color:              #EF4444 (red-500)
    Text:               "Invalid checksum"
```

#### Account Index Input

```css
Width:                  200px
Height:                 48px
Padding:                12px 16px
Background:             #0F0F0F (gray-950)
Border:                 1px solid #3F3F3F (gray-700)
Border Radius:          8px
Font Size:              14px
Color:                  #FFFFFF
Type:                   Number
Min:                    0
Max:                    2147483647 (BIP44 hardened range)
Step:                   1

Focus:
  Border Color:         #F7931A (bitcoin orange)
  Box Shadow:           0 0 0 3px rgba(247, 147, 26, 0.1)

Error (out of range):
  Border Color:         #EF4444 (red-500)
  Helper Text:          "Must be between 0 and 2,147,483,647"

Increment/Decrement Buttons:
  Hide:                 True (use text input only for simplicity)
```

---

## 6. Visual Design System

### 6.1 Color Palette (Reference)

All colors follow the existing design system from `ui-ux-designer-notes.md`:

**Bitcoin Orange (Primary):**
- Primary: `#F7931A`
- Hover: `#FF9E2D`
- Active: `#E88711`
- Subtle BG: `rgba(247, 147, 26, 0.1)`

**Grays (Dark Theme):**
- Gray-950 (Body): `#0F0F0F`
- Gray-900 (Sidebar/Cards): `#1A1A1A`
- Gray-850 (Elevated): `#1E1E1E`
- Gray-800: `#242424`
- Gray-750 (Borders): `#2E2E2E`
- Gray-700: `#3F3F3F`
- Gray-600: `#4A4A4A`
- Gray-500: `#6B7280`
- Gray-400: `#9CA3AF`
- Gray-300: `#D1D5DB`

**Semantic Colors:**
- Success: `#22C55E` (green-500)
- Error: `#EF4444` (red-500)
- Warning: `#F59E0B` (amber-500)
- Info: `#60A5FA` (blue-400)

### 6.2 Typography Scale

**Headings:**
- Modal Title: 20px, Semibold, -0.01em tracking
- Section Heading: 16px, Semibold
- Field Label: 14px, Medium

**Body Text:**
- Body: 14px, Regular, 20px line-height
- Small: 13px, Regular, 20px line-height
- Helper Text: 12px, Regular, 16px line-height

**Monospace (Keys/Addresses):**
- Font: SF Mono, Monaco, Courier New
- Size: 13px
- Tracking: -0.02em

### 6.3 Spacing Rhythm

**Modal Spacing:**
- Header Padding: 24px 32px
- Content Padding: 32px 32px 24px
- Footer Padding: 20px 32px
- Section Gap: 24px
- Field Gap: 16px
- Label-Input Gap: 8px

**Form Field Spacing:**
- Input Height: 48px
- Input Padding: 12px 16px
- Button Height: 44px (footer), 48px (dropdown)
- Button Padding: 12px 24px (secondary), 12px 32px (primary)

### 6.4 Border Radius System

- Small (Tags): 4px
- Medium (Inputs, Buttons): 8px
- Large (Cards): 12px
- XL (Modals): 16px
- Full (Pills): 9999px

### 6.5 Shadow System

**Elevation:**
- Dropdown: `0 8px 24px rgba(0, 0, 0, 0.4)`
- Modal: `0 20px 60px rgba(0, 0, 0, 0.6)`
- Focus Ring: `0 0 0 3px rgba(color, 0.1)`
- Button Hover: `0 4px 12px rgba(247, 147, 26, 0.3)`

---

## 7. Interaction Patterns

### 7.1 Modal Opening Animation

```css
@keyframes modal-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modal-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-backdrop {
  animation: modal-fade-in 200ms ease-out;
}

.modal-content {
  animation: modal-scale-in 250ms ease-out;
}
```

### 7.2 Form Validation Flow

**1. Real-Time Validation (onChange):**
- Validate as user types (debounced 300ms)
- Show error state immediately on blur if invalid
- Show success state when field becomes valid
- Character counter updates in real-time

**2. Validation States:**
```
Default (Untouched):
  - Border: Gray-700
  - No message

Focused (Typing):
  - Border: Bitcoin Orange
  - Focus ring visible
  - No validation yet

Valid (onBlur):
  - Border: Green-500 (success)
  - Checkmark icon in input (optional)
  - Success message (optional)

Invalid (onBlur):
  - Border: Red-500 (error)
  - Error message below field
  - Alert icon next to message

Disabled:
  - Border: Gray-700
  - Background: Gray-900
  - Cursor: not-allowed
  - Opacity: 0.6
```

**3. Submit Validation:**
- Validate all fields on submit
- Scroll to first error if any
- Focus first invalid field
- Prevent submission if errors
- Show loading state on submit button

### 7.3 Dropdown Interaction

**Opening:**
1. Click account selector button
2. Dropdown animates in (fade + slide down, 200ms)
3. Focus trap activated (keyboard nav within dropdown)
4. Click outside or ESC closes dropdown

**Keyboard Navigation:**
- `Tab`: Navigate to next button
- `Shift + Tab`: Navigate to previous button
- `Enter/Space`: Select account or click button
- `Escape`: Close dropdown
- `Arrow Up/Down`: Navigate account list

**Account Selection:**
1. Click account row
2. Checkmark appears instantly
3. Dashboard updates (balance, transactions load)
4. Dropdown closes with fade out (150ms)

**Button Click:**
1. Click "Create Account", "Import Account", or "Create Multisig"
2. Dropdown closes
3. Modal/tab opens (if applicable)
4. Focus moves to first input in modal

### 7.4 Success Confirmation

**Create Account Success:**
```
1. User clicks "Create Account" button
2. Button shows loading spinner (600ms animation)
3. Account created in background (<500ms)
4. Modal closes with fade out
5. Toast notification appears:
   ┌────────────────────────────────────────┐
   │ ✓ Account created successfully         │
   │   "My Savings Account" has been added  │
   └────────────────────────────────────────┘
   Duration: 3 seconds
   Position: Top-right
   Animation: Slide in from right
6. Dropdown reopens with new account selected
7. Dashboard updates to show new account
```

**Import Account Success:**
```
1. User clicks "Import Account" button
2. Button shows loading spinner
3. Account validated and imported (<1 second)
4. Modal closes with fade out
5. Toast notification:
   ┌────────────────────────────────────────┐
   │ ✓ Account imported successfully        │
   │   "Imported Paper Wallet" ↓            │ ← Import badge
   │   Remember to back up this key!        │ ← Reminder
   └────────────────────────────────────────┘
   Duration: 5 seconds (longer for import warning)
6. Dropdown reopens with imported account selected
7. Import badge visible next to account name
```

### 7.5 Error Handling

**Form Errors:**
- Show error inline below field
- Keep modal open
- Focus error field
- Shake animation on submit button if errors exist

**Backend Errors:**
```
┌────────────────────────────────────────────┐
│ ⚠️ Failed to create account                │
│                                             │
│ Error: Unable to derive account. Please    │
│ try again or contact support.              │
│                                             │
│ [Dismiss]                    [Try Again]   │
└────────────────────────────────────────────┘

Style:
  Background:        rgba(239, 68, 68, 0.1)
  Border:            1px solid #EF4444
  Padding:           16px 20px
  Border Radius:     8px
  Margin Top:        16px
  Position:          Within modal content area
```

**Network/Timeout Errors:**
- Show error banner at top of modal
- Allow user to retry
- Preserve form data
- Log error details for debugging

---

## 8. Component Reuse Strategy

### 8.1 Existing Components to Reuse

**1. Modal Component** (`src/tab/components/shared/Modal.tsx`)
```typescript
// Already exists - perfect for account creation/import forms
<Modal isOpen={showModal} onClose={handleClose}>
  {/* Form content */}
</Modal>

Reuse: ✅ 100% - no changes needed
```

**2. Toast Component** (`src/tab/components/shared/Toast.tsx`)
```typescript
// Already exists - use for success/error notifications
<Toast
  message="Account created successfully"
  type="success"
  duration={3000}
/>

Reuse: ✅ 100% - no changes needed
```

**3. MultisigBadge Component** (`src/tab/components/shared/MultisigBadge.tsx`)
```typescript
// Pattern for account badges
<MultisigBadge config={account.multisigConfig} size="sm" />

Create Similar: ImportBadge component
  - Same visual style
  - Different icon and color
  - Tooltip support
```

### 8.2 New Components to Create

**1. AccountCreationModal**
```typescript
// Location: src/tab/components/AccountManagement/AccountCreationModal.tsx

interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: WalletAccount) => void;
}

Features:
  - Account name input
  - Address type selector
  - Form validation
  - Submit/cancel handlers
  - Success callback
```

**2. ImportAccountModal**
```typescript
// Location: src/tab/components/AccountManagement/ImportAccountModal.tsx

interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: WalletAccount) => void;
}

Features:
  - Tab navigation (Private Key / Seed Phrase)
  - Security warning banner
  - Import method forms
  - BIP39 validation (for seed phrase)
  - WIF validation (for private key)
  - Success callback
```

**3. AddressTypeSelector**
```typescript
// Location: src/tab/components/AccountManagement/AddressTypeSelector.tsx
// Reuse from: src/tab/components/MultisigSetup/AddressTypeSelector.tsx

interface AddressTypeSelectorProps {
  value: AddressType;
  onChange: (type: AddressType) => void;
  showDescription?: boolean;
}

Modifications Needed:
  - Add "Recommended" badge to Native SegWit
  - Include BIP derivation path in descriptions
  - Make descriptions toggleable
```

**4. ImportBadge**
```typescript
// Location: src/tab/components/shared/ImportBadge.tsx

interface ImportBadgeProps {
  type: 'private-key' | 'seed';
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

Features:
  - Download arrow icon
  - Blue color (info)
  - Tooltip: "Imported account - Back up separately"
  - Different tooltips for private-key vs seed imports
```

**5. FormField**
```typescript
// Location: src/tab/components/shared/FormField.tsx

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}

Features:
  - Consistent label styling
  - Error message display
  - Helper text display
  - Required indicator (*)
  - Accessible labels
```

### 8.3 Component File Structure

```
src/tab/components/
├── AccountManagement/           ← NEW directory
│   ├── AccountCreationModal.tsx
│   ├── ImportAccountModal.tsx
│   ├── AddressTypeSelector.tsx  ← Adapted from MultisigSetup
│   ├── PrivateKeyImport.tsx     ← Tab content
│   ├── SeedPhraseImport.tsx     ← Tab content
│   └── SecurityWarning.tsx      ← Reusable warning banner
│
├── shared/
│   ├── Modal.tsx                ← EXISTS (reuse)
│   ├── Toast.tsx                ← EXISTS (reuse)
│   ├── MultisigBadge.tsx        ← EXISTS (reference)
│   ├── ImportBadge.tsx          ← NEW
│   └── FormField.tsx            ← NEW
│
└── Dashboard.tsx                ← UPDATE (add modal state)
```

---

## 9. Accessibility Considerations

### 9.1 Keyboard Navigation

**Modal Opening:**
- Trigger: Click button or `Enter`/`Space` on focused button
- Focus: Moves to first input in modal
- Focus trap: Cannot tab outside modal while open
- Close: `Escape` key or click outside

**Form Navigation:**
- `Tab`: Next field
- `Shift + Tab`: Previous field
- `Enter`: Submit form (if on submit button)
- `Escape`: Cancel/close modal

**Dropdown Navigation:**
- `Tab`: Navigate buttons
- `Arrow Up/Down`: Navigate accounts
- `Enter/Space`: Select account
- `Escape`: Close dropdown

### 9.2 Screen Reader Support

**ARIA Labels:**
```html
<!-- Account Dropdown -->
<button
  aria-label="Select account"
  aria-expanded={showDropdown}
  aria-haspopup="true"
>
  {currentAccount.name}
</button>

<div role="menu" aria-label="Account list">
  <button role="menuitem" aria-current={isSelected}>
    Account 1
  </button>
</div>

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Create New Account</h2>
  {/* Content */}
</div>

<!-- Form Fields -->
<label htmlFor="account-name">Account Name</label>
<input
  id="account-name"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby="account-name-error account-name-helper"
/>
<span id="account-name-helper">Enter a name for this account</span>
<span id="account-name-error" role="alert">{error}</span>
```

**Live Regions:**
```html
<!-- Success message -->
<div role="status" aria-live="polite">
  Account created successfully
</div>

<!-- Error message -->
<div role="alert" aria-live="assertive">
  Failed to create account
</div>
```

### 9.3 Focus Management

**Modal Open:**
1. Store currently focused element
2. Move focus to modal (first input)
3. Trap focus within modal
4. Prevent body scroll

**Modal Close:**
1. Restore focus to trigger button
2. Remove focus trap
3. Re-enable body scroll

**Form Submit Success:**
1. Close modal
2. Show toast notification
3. Focus account in dropdown (if reopened)
4. Announce success to screen readers

### 9.4 Color Contrast

All text meets WCAG 2.1 AA standards (4.5:1 ratio):

- White text on Gray-900: ✅ 14.5:1
- Gray-300 text on Gray-900: ✅ 8.2:1
- Gray-400 text on Gray-900: ✅ 5.8:1
- Bitcoin Orange on Gray-900: ✅ 4.9:1
- Error Red on Gray-900: ✅ 5.2:1
- Success Green on Gray-900: ✅ 5.5:1

**Enhanced Contrast for Inputs:**
- Input background: Gray-950 (darker than modal)
- Input text: White (maximum contrast)
- Placeholder: Gray-500 (subtle but readable)

---

## 10. Implementation Checklist

### Phase 1: Account Dropdown Updates

- [ ] Update Dashboard.tsx dropdown layout
  - [ ] Add "Create Account" button (primary orange)
  - [ ] Add "Import Account" button (secondary gray)
  - [ ] Update "Create Multisig Account" to secondary gray
  - [ ] Add divider above buttons
  - [ ] Update spacing and padding
- [ ] Create ImportBadge component
  - [ ] Download arrow icon
  - [ ] Blue color scheme
  - [ ] Tooltip support
  - [ ] Size variants (sm, md)
- [ ] Update account list rendering
  - [ ] Show import badge for imported accounts
  - [ ] Update hover states
  - [ ] Test keyboard navigation

### Phase 2: Create Account Modal

- [ ] Create AccountCreationModal component
  - [ ] Header with title and close button
  - [ ] Account name input with validation
  - [ ] Address type selector (reuse/adapt from MultisigSetup)
  - [ ] HD derivation info box
  - [ ] Footer with Cancel/Create buttons
  - [ ] Form validation logic
  - [ ] Loading states
  - [ ] Error handling
- [ ] Create FormField wrapper component
  - [ ] Label rendering
  - [ ] Error message display
  - [ ] Helper text display
  - [ ] Required indicator
- [ ] Wire to backend API
  - [ ] CREATE_ACCOUNT message handler
  - [ ] Success callback
  - [ ] Error handling
  - [ ] Account list update

### Phase 3: Import Account Modal

- [ ] Create ImportAccountModal component
  - [ ] Header with title and close button
  - [ ] Tab navigation (Private Key / Seed Phrase)
  - [ ] Security warning banner component
  - [ ] Tab content switching
  - [ ] Footer with Cancel/Import buttons
- [ ] Create PrivateKeyImport component
  - [ ] WIF textarea with validation
  - [ ] Account name input
  - [ ] Real-time validation
  - [ ] Format hints
- [ ] Create SeedPhraseImport component
  - [ ] Seed phrase textarea with word validation
  - [ ] Word counter and checksum validation
  - [ ] Account index input
  - [ ] Address type selector
  - [ ] Account name input
- [ ] Wire to backend API
  - [ ] IMPORT_ACCOUNT_PRIVATE_KEY message handler
  - [ ] IMPORT_ACCOUNT_SEED message handler
  - [ ] Success callbacks
  - [ ] Error handling

### Phase 4: Testing & Polish

- [ ] Manual testing
  - [ ] Create account flow (all address types)
  - [ ] Import via private key
  - [ ] Import via seed phrase
  - [ ] Edge cases (invalid inputs, duplicates)
  - [ ] Keyboard navigation
  - [ ] Screen reader testing
- [ ] Visual polish
  - [ ] Animation timing
  - [ ] Focus states
  - [ ] Loading states
  - [ ] Error states
  - [ ] Success states
- [ ] Responsive testing
  - [ ] Desktop (1920px+)
  - [ ] Laptop (1280px)
  - [ ] Tablet (768px)
  - [ ] Mobile (360px)

### Phase 5: Documentation

- [ ] Update ui-ux-designer-notes.md
  - [ ] Add Account Management section
  - [ ] Document new components
  - [ ] Record design decisions
  - [ ] Add usage examples
- [ ] Component documentation
  - [ ] JSDoc comments
  - [ ] Props documentation
  - [ ] Usage examples
  - [ ] Accessibility notes
- [ ] Update CHANGELOG.md
  - [ ] Feature description
  - [ ] Breaking changes (if any)
  - [ ] Migration guide (if needed)

---

## Appendix: ASCII Wireframes

### A.1 Create Account Modal (Full)

```
┌──────────────────────────────────────────────────────────────────────┐
│ BACKDROP (Black 70%, Blur 8px)                                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃ Create New Account                                    [X] ┃ │ │ Header
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ Account Name *                                       │   │ │
│  │   │ ┌──────────────────────────────────────────────────┐ │   │ │
│  │   │ │ My Savings Account_                              │ │   │ │
│  │   │ └──────────────────────────────────────────────────┘ │   │ │
│  │   │ Enter a name to identify this account               │   │ │
│  │   │                                     Characters: 18/30│   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ Address Type *                                       │   │ │
│  │   │ ┌──────────────────────────────────────────────────┐ │   │ │
│  │   │ │ Native SegWit (Recommended)                   ▼ │ │   │ │
│  │   │ └──────────────────────────────────────────────────┘ │   │ │
│  │   │ • Lower fees and better privacy                     │   │ │
│  │   │ • tb1... addresses on testnet                       │   │ │
│  │   │ • BIP84 standard (m/84'/1'/N'/0/0)                  │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ ℹ️ This account will be derived from your existing  │   │ │
│  │   │   wallet seed using BIP44 hierarchical derivation.  │   │ │
│  │   │   Path: m/84'/1'/N'/0/0 where N = next account #    │   │ │
│  │   │                                                       │   │ │
│  │   │   Your seed phrase already backs up this account.    │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃                                                          ┃ │ │ Footer
│  │ ┃  [Cancel]                             [Create Account]  ┃ │ │
│  │ ┃                                                          ┃ │ │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### A.2 Import Account Modal - Private Key Tab

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃ Import Account                                        [X] ┃ │ │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ [Private Key]  Seed Phrase                              │ │ │ Tabs
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ ⚠️  Warning: Imported accounts are NOT backed up by │   │ │
│  │   │     your wallet's main seed phrase. You must back   │   │ │
│  │   │     up this private key separately or risk losing   │   │ │
│  │   │     access to these funds.                          │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ Private Key (WIF Format) *                           │   │ │
│  │   │ ┌──────────────────────────────────────────────────┐ │   │ │
│  │   │ │ cVhT8DRG4sP1wNzQkjyF7M...                        │ │   │ │
│  │   │ │                                                   │ │   │ │
│  │   │ │                                                   │ │   │ │
│  │   │ └──────────────────────────────────────────────────┘ │   │ │
│  │   │ Testnet private keys start with 'c'                 │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ Account Name *                                       │   │ │
│  │   │ ┌──────────────────────────────────────────────────┐ │   │ │
│  │   │ │ Imported Paper Wallet_                           │ │   │ │
│  │   │ └──────────────────────────────────────────────────┘ │   │ │
│  │   │ Enter a name to identify this account               │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃  [Cancel]                             [Import Account]  ┃ │ │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### A.3 Import Account Modal - Seed Phrase Tab

```
┌──────────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃ Import Account                                        [X] ┃ │ │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  │ ┌──────────────────────────────────────────────────────────┐ │ │
│  │ │ Private Key  [Seed Phrase]                              │ │ │
│  │ └──────────────────────────────────────────────────────────┘ │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ ⚠️  Warning: This account uses a different seed     │   │ │
│  │   │     phrase than your main wallet. Back it up        │   │ │
│  │   │     separately or risk losing access to funds.      │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ Seed Phrase (12 or 24 words) *                       │   │ │
│  │   │ ┌──────────────────────────────────────────────────┐ │   │ │
│  │   │ │ abandon abandon abandon abandon abandon abandon  │ │   │ │
│  │   │ │ abandon abandon abandon abandon abandon about_   │ │   │ │
│  │   │ │                                                   │ │   │ │
│  │   │ └──────────────────────────────────────────────────┘ │   │ │
│  │   │ Words: 12/12 ✓               Valid checksum ✓       │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌────────────────────────┐  ┌──────────────────────────┐   │ │
│  │   │ Account Index *        │  │ Address Type *           │   │ │
│  │   │ ┌────────────────────┐ │  │ ┌──────────────────────┐ │   │ │
│  │   │ │ 0                  │ │  │ │ Native SegWit     ▼ │ │   │ │
│  │   │ └────────────────────┘ │  │ └──────────────────────┘ │   │ │
│  │   │ First account (0)      │  │ Lower fees & privacy     │   │ │
│  │   └────────────────────────┘  └──────────────────────────┘   │ │
│  │                                                                │ │
│  │   ┌──────────────────────────────────────────────────────┐   │ │
│  │   │ Account Name *                                       │   │ │
│  │   │ ┌──────────────────────────────────────────────────┐ │   │ │
│  │   │ │ Imported from Electrum_                          │ │   │ │
│  │   │ └──────────────────────────────────────────────────┘ │   │ │
│  │   └──────────────────────────────────────────────────────┘   │ │
│  │                                                                │ │
│  │ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │ │
│  │ ┃  [Cancel]                             [Import Account]  ┃ │ │
│  │ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This design specification provides complete UX/UI guidance for implementing enhanced account management features in the Bitcoin Wallet extension. The design maintains consistency with the existing tab-based architecture, leverages the established design system, and provides clear, accessible interfaces for creating and importing both single-signature and multisig accounts.

**Key Design Principles:**
1. **Consistency** - Reuses existing components and patterns
2. **Clarity** - Clear visual hierarchy and labeling
3. **Accessibility** - Full keyboard navigation and screen reader support
4. **Security** - Prominent warnings for imported accounts
5. **Simplicity** - Progressive disclosure, minimal friction

**Next Steps:**
1. Review with Frontend Developer for implementation feasibility
2. Review with Security Expert for import warning adequacy
3. Review with Product Manager for alignment with PRD
4. Begin implementation following checklist in Section 10

---

**Document Status:** ✅ Design Complete - Ready for Review
**Last Updated:** October 18, 2025
**Designer:** UI/UX Designer
