# Bitcoin Wallet Design Pattern Comparison

**Date:** October 18, 2025
**Purpose:** Visual comparison of design patterns across the Bitcoin Wallet extension

---

## Overview

The Bitcoin Wallet extension uses **three complementary design patterns**, all sharing the same foundational design system but adapted for different use cases:

1. **Main Tab Layout** - Sidebar + content area (dashboard, transactions, settings)
2. **Modal Overlays** - Centered 800px forms with backdrop (account creation/import)
3. **Full-Tab Wizard** - Centered 800px multi-step flow (multisig setup)

---

## Pattern 1: Main Tab Layout (Sidebar + Content)

**Use Case:** Primary navigation and content browsing
**Examples:** Dashboard, Send, Receive, Contacts, Settings
**Implementation:** `/src/tab/App.tsx`, `/src/tab/components/Sidebar.tsx`

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser Tab: chrome-extension://[id]/index.html                    │
├───────────┬────────────────────────────────────────────────────────┤
│           │                                                         │
│  SIDEBAR  │                MAIN CONTENT AREA                       │
│  240px    │         (Flexible width, max-w-7xl centered)           │
│           │                                                         │
│  ₿ Assets │  ┌──────────────────────────────────────────────┐     │
│  🔐 Multi │  │                                               │     │
│  👥 Cont. │  │          Dashboard / Send / Receive          │     │
│  ⚙️ Sett. │  │                                               │     │
│           │  │   • Account balance                           │     │
│  ┌──────┐ │  │   • Transaction list                         │     │
│  │Acc 1▼│ │  │   • Quick actions                            │     │
│  └──────┘ │  │                                               │     │
│  [Lock]   │  └──────────────────────────────────────────────┘     │
│           │                                                         │
└───────────┴────────────────────────────────────────────────────────┘

Background: #0F0F0F (gray-950)
Sidebar:    #1A1A1A (gray-900)
Content:    #1E1E1E cards on gray-950 background
Width:      Sidebar 240px + Content flexible (responsive)
```

**Key Characteristics:**
- ✅ Persistent sidebar navigation
- ✅ Always visible account switcher
- ✅ Flexible content width (responsive)
- ✅ Multiple views share same layout
- ✅ Professional desktop app feel

---

## Pattern 2: Modal Overlays (Account Management)

**Use Case:** Quick forms that need focus but maintain context
**Examples:** Create Account, Import Account (Private Key/Seed)
**Implementation:** `/src/tab/components/AccountManagement/`
**Design Spec:** `ACCOUNT_MANAGEMENT_DESIGN_SPEC.md`

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser Tab: chrome-extension://[id]/index.html                    │
├───────────┬────────────────────────────────────────────────────────┤
│           │  ╔═══════════════════════════════════════════╗         │
│  SIDEBAR  │  ║         MODAL (800px centered)            ║         │
│  (blurred)│  ║  ┌─────────────────────────────────────┐ ║         │
│           │  ║  │ Create New Account             [X]  │ ║         │
│  ₿ Assets │  ║  ├─────────────────────────────────────┤ ║         │
│  🔐 Multi │  ║  │                                     │ ║         │
│  👥 Cont. │  ║  │  Account Name:                      │ ║         │
│  ⚙️ Sett. │  ║  │  [Input field..................]   │ ║         │
│  (dimmed) │  ║  │                                     │ ║         │
│           │  ║  │  Address Type:                      │ ║         │
│  ┌──────┐ │  ║  │  [Native SegWit        ▼]         │ ║         │
│  │Acc 1▼│ │  ║  │                                     │ ║         │
│  └──────┘ │  ║  ├─────────────────────────────────────┤ ║         │
│  [Lock]   │  ║  │  [Cancel]      [Create Account]     │ ║         │
│  (dimmed) │  ║  └─────────────────────────────────────┘ ║         │
│           │  ╚═══════════════════════════════════════════╝         │
└───────────┴────────────────────────────────────────────────────────┘

Backdrop:   rgba(0, 0, 0, 0.7) with blur(8px)
Modal:      #1A1A1A (gray-900) with border
Width:      800px (max-w-[800px])
Height:     Auto (fits content, max 90vh)
```

**Key Characteristics:**
- ✅ Backdrop blur maintains context
- ✅ 800px centered content
- ✅ Single-purpose forms (1-2 minutes)
- ✅ Quick interaction, fast close
- ✅ Dashboard visible but dimmed
- ✅ Focus management (trap focus in modal)

**Modal Variations:**
```
1. Create Account Modal:
   ├─ Account name input
   ├─ Address type selector
   ├─ HD derivation info box
   └─ Create button

2. Import Account Modal:
   ├─ Tab switcher (Private Key | Seed Phrase)
   ├─ Security warning banner
   ├─ Import method forms
   └─ Import button
```

---

## Pattern 3: Full-Tab Wizard (Multisig Setup)

**Use Case:** Complex multi-step processes requiring dedicated focus
**Examples:** Multisig account creation (7 steps)
**Implementation:** `/src/wizard/WizardApp.tsx`, `/src/tab/components/MultisigSetup/`
**Design Spec:** `MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`

```
┌────────────────────────────────────────────────────────────────────┐
│ Browser Tab: chrome-extension://[id]/wizard.html                   │
├────────────────────────────────────────────────────────────────────┤
│ FIXED HEADER (80px)                                                │
│ [Logo] Bitcoin Wallet │ Create Multisig Account             [?]   │
├────────────────────────────────────────────────────────────────────┤
│ PROGRESS INDICATOR (120px)                                         │
│                       Step 3 of 7                                  │
│     ████████████████████░░░░░░░░░░░░░░░░░░                        │
│     Config → Address → Export → Import → Verify → Name → Done     │
│       ✓         ✓        [3]       •        •        •      •     │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│     ┌────────────────────────────────────────────────────┐        │
│     │                                                      │        │
│     │        WIZARD CONTENT (800px centered)              │        │
│     │                                                      │        │
│     │  ┌────────────────────────────────────────────┐   │        │
│     │  │                                             │   │        │
│     │  │      Large QR Code (400×400px)             │   │        │
│     │  │                                             │   │        │
│     │  └────────────────────────────────────────────┘   │        │
│     │                                                      │        │
│     │  Your Extended Public Key:                          │        │
│     │  xpub6CUGRUo... [Copy] [QR] [File]                │        │
│     │                                                      │        │
│     └────────────────────────────────────────────────────┘        │
│                                                                     │
├────────────────────────────────────────────────────────────────────┤
│ STICKY FOOTER (100px)                                              │
│     [← Back]                                   [Next →]            │
└────────────────────────────────────────────────────────────────────┘

Background: #0F0F0F (gray-950)
Content:    #1A1A1A (gray-900) 800px centered
Width:      800px (max-w-[800px])
Height:     100vh (full screen)
No backdrop (dedicated full-tab experience)
```

**Key Characteristics:**
- ✅ Full-screen dedicated experience
- ✅ 800px centered content (same width as modals)
- ✅ No backdrop (entire tab is wizard)
- ✅ Multi-step process (7 steps, 5-10 minutes)
- ✅ Fixed header with branding
- ✅ Enhanced progress indicator
- ✅ Sticky footer navigation
- ✅ Can stay open during co-signer coordination

**7-Step Flow:**
```
Step 1: Configuration Selection (2-of-2, 2-of-3, 3-of-5)
Step 2: Address Type (P2WSH, P2SH-P2WSH, P2SH)
Step 3: Export Xpub (QR code + text)
Step 4: Import Co-signer Xpubs
Step 5: Verify First Address
Step 6: Name Account + Review
Step 7: Success + Auto-close
```

---

## Design System Consistency

All three patterns share the **same foundational design system**:

### Color Palette
```css
/* Dark Theme Base */
--gray-950: #0F0F0F  /* Body background */
--gray-900: #1A1A1A  /* Sidebar, modals, cards */
--gray-850: #1E1E1E  /* Elevated elements */
--gray-800: #242424  /* Hover states */
--gray-750: #2E2E2E  /* Borders */
--gray-700: #3F3F3F  /* Dividers */

/* Primary Color */
--bitcoin:       #F7931A  /* Primary actions */
--bitcoin-hover: #FF9E2D  /* Hover state */
--bitcoin-active:#E88711  /* Active state */

/* Semantic Colors */
--success: #22C55E  /* Green */
--error:   #EF4444  /* Red */
--warning: #F59E0B  /* Amber */
--info:    #60A5FA  /* Blue */
```

### Typography Scale
```css
/* Headings */
Modal Title:      20px, Semibold, -0.01em tracking
Section Heading:  16px, Semibold
Field Label:      14px, Medium

/* Body Text */
Body:             14px, Regular, 20px line-height
Small:            13px, Regular, 20px line-height
Helper Text:      12px, Regular, 16px line-height

/* Monospace (Keys/Addresses) */
Code Font:        SF Mono, Monaco, Courier New
Code Size:        13px, -0.02em tracking
```

### Spacing Rhythm (4px Grid)
```css
/* Common Spacing Values */
xs:  4px   (gap-1, p-1)
sm:  8px   (gap-2, p-2)
md:  16px  (gap-4, p-4)
lg:  24px  (gap-6, p-6)
xl:  32px  (gap-8, p-8)
2xl: 48px  (gap-12, p-12)

/* Component Heights */
Input:        48px
Button:       44px (footer), 48px (dropdown)
Header:       80px (wizard), 64px (sidebar top)
Footer:       100px (wizard), 72px (modal)
```

### Border Radius System
```css
Small (Tags):    4px   (rounded)
Medium (Inputs): 8px   (rounded-lg)
Large (Cards):   12px  (rounded-xl)
XL (Modals):     16px  (rounded-2xl)
Full (Pills):    9999px (rounded-full)
```

### Shadow System
```css
/* Elevation Levels */
Dropdown:      0 8px 24px rgba(0, 0, 0, 0.4)
Modal:         0 20px 60px rgba(0, 0, 0, 0.6)
Focus Ring:    0 0 0 3px rgba(color, 0.1)
Button Hover:  0 4px 12px rgba(247, 147, 26, 0.3)
```

---

## When to Use Each Pattern

### Use Main Tab Layout When:
- ✅ User needs persistent navigation
- ✅ Browsing multiple related views
- ✅ Dashboard, lists, settings
- ✅ Standard wallet operations
- **Examples:** Assets, Contacts, Settings, Dashboard

### Use Modal Overlay When:
- ✅ Quick single-purpose form (1-2 minutes)
- ✅ User needs to maintain context
- ✅ Fast interaction required
- ✅ Simple account management
- **Examples:** Create Account, Import Account, Add Contact

### Use Full-Tab Wizard When:
- ✅ Complex multi-step process (5-10 minutes)
- ✅ Dedicated focus required
- ✅ User may need to switch apps (coordination)
- ✅ Large content (QR codes, tables)
- **Examples:** Multisig setup, complex configurations

---

## Width Comparison

All patterns use **consistent width principles**:

```
┌────────────────────────────────────────────────────────────┐
│                     WIDTH COMPARISON                        │
├─────────────────────┬──────────────────────────────────────┤
│ Pattern             │ Content Width                         │
├─────────────────────┼──────────────────────────────────────┤
│ Main Tab Layout     │ Flexible (sidebar 240px +            │
│                     │ content max-w-7xl = 1280px)          │
├─────────────────────┼──────────────────────────────────────┤
│ Modal Overlays      │ 800px centered                       │
│                     │ (max-w-[800px])                      │
├─────────────────────┼──────────────────────────────────────┤
│ Full-Tab Wizard     │ 800px centered                       │
│                     │ (max-w-[800px])                      │
└─────────────────────┴──────────────────────────────────────┘

Key Insight: Modals and wizard share 800px width for consistency,
while main layout uses flexible width for browsing content.
```

---

## Responsive Behavior

### Main Tab Layout
```
Desktop (1200px+):   Sidebar 240px + Content flexible (max 1280px)
Laptop (1024px):     Sidebar 240px + Content flexible
Tablet (768px):      Sidebar collapsible + Content full width
Mobile (< 768px):    Sidebar hidden (hamburger) + Content full width
```

### Modal Overlays
```
Desktop (1200px+):   Modal 800px centered with generous margins
Laptop (1024px):     Modal 800px centered with tight margins
Tablet (768px):      Modal 720px (90% width)
Mobile (< 768px):    Modal 100% width (minus 16px padding)
```

### Full-Tab Wizard
```
Desktop (1200px+):   Content 800px centered with margins
Laptop (1024px):     Content 800px centered with tight margins
Tablet (768px):      Content 720px (90% width)
Mobile (< 768px):    Content 100% width (minus 16px padding)
                     Progress labels abbreviated
```

---

## Component Reuse Matrix

| Component | Main Tab | Modal | Wizard | Notes |
|-----------|----------|-------|--------|-------|
| **Sidebar** | ✅ Yes | ❌ No | ❌ No | Main layout only |
| **Modal** | ✅ Used | ✅ Wrapper | ❌ No | Not needed for full-tab |
| **Toast** | ✅ Yes | ✅ Yes | ✅ Yes | Universal notifications |
| **AddressTypeSelector** | ❌ No | ✅ Yes | ✅ Yes | Shared form component |
| **Form Inputs** | ✅ Yes | ✅ Yes | ✅ Yes | Same styles everywhere |
| **Buttons** | ✅ Yes | ✅ Yes | ✅ Yes | Same styles everywhere |
| **QR Code** | ✅ Yes | ❌ Rare | ✅ Yes | Receive + Wizard |
| **Transaction List** | ✅ Yes | ❌ No | ❌ No | Dashboard only |

---

## Visual Hierarchy

All patterns follow the **same visual hierarchy principles**:

```
┌─────────────────────────────────────────────────────────┐
│              VISUAL HIERARCHY PRINCIPLES                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Primary Actions:    Bitcoin Orange (#F7931A)        │
│     • Create Account                                     │
│     • Send Transaction                                   │
│     • Next Step                                          │
│                                                          │
│  2. Secondary Actions:  Gray with border               │
│     • Import Account                                     │
│     • Cancel                                             │
│     • Back                                               │
│                                                          │
│  3. Tertiary Actions:   Gray ghost (hover only)        │
│     • Help button                                        │
│     • Settings icon                                      │
│                                                          │
│  4. Danger Actions:     Red (#EF4444)                   │
│     • Delete account                                     │
│     • Cancel setup (with warning)                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Accessibility Consistency

All patterns implement the **same accessibility standards**:

### Keyboard Navigation
- ✅ Tab/Shift+Tab for focus navigation
- ✅ Enter/Space to activate buttons
- ✅ Arrow keys for dropdowns/lists
- ✅ Escape to close modals (where applicable)

### Screen Reader Support
- ✅ Proper ARIA labels on all interactive elements
- ✅ Semantic HTML (headings, landmarks)
- ✅ Status announcements for state changes
- ✅ Form labels associated with inputs

### Color Contrast
- ✅ All text meets WCAG 2.1 AA (4.5:1 minimum)
- ✅ Focus indicators visible (2px outline)
- ✅ Error states use color + icon + text

---

## Summary: Design Pattern Decisions

```
┌─────────────────────────────────────────────────────────────────┐
│                   PATTERN DECISION TREE                          │
└─────────────────────────────────────────────────────────────────┘

Is this a multi-step process (7+ steps)?
├─ YES → Use Full-Tab Wizard
│         • Dedicated browser tab
│         • 800px centered content
│         • Fixed header + progress + footer
│         • Example: Multisig setup
│
└─ NO → Is this a quick form (1-2 fields)?
        ├─ YES → Use Modal Overlay
        │         • 800px centered modal
        │         • Backdrop blur
        │         • Quick interaction
        │         • Example: Create Account
        │
        └─ NO → Use Main Tab Layout
                  • Sidebar + content area
                  • Persistent navigation
                  • Flexible content width
                  • Example: Dashboard
```

---

**Status:** ✅ All patterns documented and consistent
**Last Updated:** October 18, 2025
**Designer:** UI/UX Designer

**Related Documentation:**
- `MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`
- `ACCOUNT_MANAGEMENT_DESIGN_SPEC.md`
- `ui-ux-designer-notes.md`
- `MULTISIG_WIZARD_DESIGN_REVIEW.md`
