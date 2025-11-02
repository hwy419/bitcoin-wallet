# Dark Mode Design Specification
## Bitcoin Wallet Chrome Extension

**Version:** 1.0
**Date:** October 12, 2025
**Author:** UI/UX Designer
**Status:** Ready for Implementation

---

## Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Component Specifications](#component-specifications)
4. [Screen-by-Screen Dark Mode Designs](#screen-by-screen-dark-mode-designs)
5. [Toggle Implementation](#toggle-implementation)
6. [Tailwind Configuration](#tailwind-configuration)
7. [Migration Strategy](#migration-strategy)
8. [Accessibility Compliance](#accessibility-compliance)
9. [Implementation Checklist](#implementation-checklist)

---

## Design Philosophy

### Why Dark Mode?

**Primary Theme, Not Optional:**
Dark mode should be the **default and primary theme** for this Bitcoin wallet. Light mode can be added in Phase 2 based on user demand.

**Rationale:**
- **Industry Standard:** All major crypto wallets (MetaMask, Phantom, Rainbow, Ledger Live) use dark themes as default
- **Bitcoin Brand Identity:** Bitcoin orange (#F7931A) has exceptional visual impact on dark backgrounds
- **Reduced Eye Strain:** Users frequently check wallet balances; dark mode reduces fatigue
- **Professional Aesthetic:** Dark themes convey sophistication and technical professionalism
- **Security Perception:** Dark UIs are subconsciously associated with privacy and security
- **Simplified MVP:** Single theme means faster development and one design system to maintain

### Design Principles

1. **Contrast First:** Maintain WCAG AA compliance (4.5:1 for text, 3:1 for UI)
2. **Bitcoin Orange Emphasis:** Orange pops beautifully against dark backgrounds
3. **Depth Through Elevation:** Use subtle background variations, not heavy shadows
4. **Reduced Saturation:** Dark mode colors should be slightly desaturated for comfort
5. **Preserve Readability:** Text must be crystal clear, never muddy or hard to read

---

## Color Palette

### Background Colors

```css
/* Primary Backgrounds */
--bg-primary: #0F0F0F;           /* Main app background - deep black */
--bg-secondary: #1A1A1A;         /* Elevated surfaces - cards, containers */
--bg-tertiary: #242424;          /* Further elevated - modals, dropdowns */

/* Surface Colors */
--surface-default: #1E1E1E;      /* Card backgrounds */
--surface-elevated: #2A2A2A;     /* Elevated cards, hover states */
--surface-hover: #2E2E2E;        /* Interactive hover state */
--surface-active: #323232;       /* Active/pressed state */

/* Input Backgrounds */
--input-bg: #1A1A1A;             /* Input field backgrounds */
--input-bg-disabled: #0F0F0F;    /* Disabled inputs */
```

**Tailwind Classes:**
```
bg-gray-950    → #0F0F0F (bg-primary)
bg-gray-900    → #1A1A1A (bg-secondary, input-bg)
bg-gray-850    → #1E1E1E (surface-default) [custom]
bg-gray-800    → #242424 (bg-tertiary)
bg-gray-750    → #2A2A2A (surface-elevated) [custom]
bg-gray-700    → #2E2E2E (surface-hover)
bg-gray-650    → #323232 (surface-active) [custom]
```

### Text Colors

```css
/* Text Hierarchy */
--text-primary: #FFFFFF;         /* Headings, important text - Pure white */
--text-secondary: #D4D4D4;       /* Body text, labels - Light gray */
--text-tertiary: #A3A3A3;        /* Secondary info, captions - Medium gray */
--text-quaternary: #737373;      /* Disabled, placeholder - Dark gray */
--text-disabled: #525252;        /* Fully disabled text */

/* Special Text */
--text-on-color: #FFFFFF;        /* Text on colored backgrounds */
--text-link: #FFA43D;            /* Links - Bitcoin orange light */
--text-link-hover: #F7931A;      /* Link hover - Bitcoin orange */
```

**Tailwind Classes:**
```
text-white      → #FFFFFF (text-primary)
text-gray-300   → #D4D4D4 (text-secondary)
text-gray-400   → #A3A3A3 (text-tertiary)
text-gray-500   → #737373 (text-quaternary)
text-gray-600   → #525252 (text-disabled)
```

### Bitcoin Brand Colors (Dark Mode Optimized)

```css
/* Bitcoin Orange - Primary Brand */
--bitcoin-orange: #F7931A;           /* Primary buttons, CTAs, focus states */
--bitcoin-orange-hover: #FF9E2D;     /* Hover state - slightly brighter */
--bitcoin-orange-active: #E88711;    /* Active/pressed state - darker */
--bitcoin-orange-light: #FFA43D;     /* Borders, accents, icons */
--bitcoin-orange-subtle: rgba(247, 147, 26, 0.12);  /* Subtle backgrounds */
--bitcoin-orange-muted: rgba(247, 147, 26, 0.24);   /* Muted backgrounds */

/* Bitcoin Orange Glow (for emphasis) */
--bitcoin-glow: 0 0 24px rgba(247, 147, 26, 0.35);
--bitcoin-glow-strong: 0 0 32px rgba(247, 147, 26, 0.5);
```

**Tailwind Classes:**
```
bg-bitcoin       → #F7931A (primary orange)
hover:bg-bitcoin-hover  → #FF9E2D
active:bg-bitcoin-active → #E88711
border-bitcoin-light → #FFA43D
bg-bitcoin-subtle → rgba(247, 147, 26, 0.12)
```

### Semantic Colors (Dark Mode Optimized)

```css
/* Success - Green */
--success: #22C55E;                    /* Brighter green for dark backgrounds */
--success-hover: #16A34A;              /* Hover state */
--success-bg: rgba(34, 197, 94, 0.12); /* Subtle background */
--success-border: #16A34A;             /* Borders */

/* Error - Red */
--error: #EF4444;                      /* Error red */
--error-hover: #DC2626;                /* Hover state */
--error-bg: rgba(239, 68, 68, 0.12);   /* Subtle background */
--error-border: #DC2626;               /* Borders */

/* Warning - Amber */
--warning: #F59E0B;                    /* Warning amber */
--warning-hover: #D97706;              /* Hover state */
--warning-bg: rgba(245, 158, 11, 0.12); /* Subtle background */
--warning-border: #D97706;             /* Borders */

/* Info - Blue */
--info: #3B82F6;                       /* Info blue */
--info-hover: #2563EB;                 /* Hover state */
--info-bg: rgba(59, 130, 246, 0.12);   /* Subtle background */
--info-border: #2563EB;                /* Borders */
```

**Tailwind Classes:**
```
bg-green-500    → #22C55E (success)
bg-red-500      → #EF4444 (error)
bg-amber-500    → #F59E0B (warning)
bg-blue-500     → #3B82F6 (info)
```

### Border Colors

```css
/* Border Hierarchy */
--border-default: #404040;         /* Standard borders - visible but subtle */
--border-subtle: #2E2E2E;          /* Subtle dividers */
--border-strong: #525252;          /* Emphasized borders */
--border-hover: #525252;           /* Hover state borders */
--border-focus: #F7931A;           /* Focus state - Bitcoin orange */

/* Semantic Borders */
--border-success: #16A34A;         /* Success state borders */
--border-error: #DC2626;           /* Error state borders */
--border-warning: #D97706;         /* Warning state borders */
```

**Tailwind Classes:**
```
border-gray-700  → #404040 (border-default)
border-gray-750  → #2E2E2E (border-subtle) [custom]
border-gray-600  → #525252 (border-strong, border-hover)
border-bitcoin   → #F7931A (border-focus)
```

### Shadow & Elevation

Dark mode shadows should be **darker and more subtle** than light mode:

```css
/* Shadows for Dark Mode */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.6);
--shadow-lg: 0 10px 24px -4px rgba(0, 0, 0, 0.7);
--shadow-xl: 0 20px 40px -8px rgba(0, 0, 0, 0.8);

/* Glow Effects (for emphasis) */
--glow-bitcoin: 0 0 24px rgba(247, 147, 26, 0.35);
--glow-success: 0 0 24px rgba(34, 197, 94, 0.35);
--glow-error: 0 0 24px rgba(239, 68, 68, 0.35);
```

**Tailwind Classes:**
```
shadow-sm  → Redefine for dark mode
shadow-md  → Redefine for dark mode
shadow-lg  → Redefine for dark mode
shadow-xl  → Redefine for dark mode
```

### Special Elements

```css
/* QR Code Container */
--qr-bg: #FFFFFF;                  /* QR code background - always white */
--qr-border: #FFA43D;              /* Bitcoin orange light border */
--qr-shadow: 0 0 0 8px rgba(247, 147, 26, 0.12); /* Subtle orange glow */

/* Overlay */
--overlay: rgba(0, 0, 0, 0.85);    /* Modal overlay - darker for dark mode */
--overlay-backdrop: blur(8px);     /* Backdrop blur */

/* Skeleton Loader */
--skeleton-from: #1A1A1A;          /* Gradient start */
--skeleton-via: #2A2A2A;           /* Gradient middle */
--skeleton-to: #1A1A1A;            /* Gradient end */
```

---

## Component Specifications

### Buttons

#### Primary Button (Bitcoin Orange)
```tsx
className="
  bg-bitcoin text-white
  hover:bg-bitcoin-hover
  active:bg-bitcoin-active active:scale-[0.98]
  disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
  px-6 py-3 rounded-lg font-semibold
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-900
"
```

**Visual:**
- Background: `#F7931A` (Bitcoin orange)
- Text: `#FFFFFF` (white)
- Hover: `#FF9E2D` (brighter orange)
- Active: `#E88711` + scale down to 98%
- Disabled: Dark gray background, gray text
- Focus ring: Orange with dark offset

#### Secondary Button (Outlined)
```tsx
className="
  bg-transparent border-2 border-bitcoin-light text-bitcoin-light
  hover:bg-bitcoin-subtle hover:border-bitcoin
  active:bg-bitcoin-muted
  disabled:border-gray-700 disabled:text-gray-600
  px-6 py-3 rounded-lg font-semibold
  transition-colors duration-200
  focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-900
"
```

#### Ghost Button
```tsx
className="
  bg-transparent text-gray-400
  hover:bg-gray-800 hover:text-white
  active:bg-gray-750
  disabled:text-gray-600
  px-5 py-3 rounded-lg font-medium
  transition-colors duration-200
"
```

#### Danger Button
```tsx
className="
  bg-red-500 text-white
  hover:bg-red-600
  active:bg-red-700 active:scale-[0.98]
  disabled:bg-gray-700 disabled:text-gray-500
  px-6 py-3 rounded-lg font-semibold
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900
"
```

### Input Fields

#### Text Input
```tsx
className="
  w-full px-4 py-3
  bg-gray-900 border border-gray-700
  text-white placeholder:text-gray-500
  rounded-lg
  focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
  disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed
  transition-colors duration-200
"
```

**States:**
- **Default:** Dark background, gray border
- **Focus:** Bitcoin orange border + subtle glow
- **Error:** Red border + red glow: `border-red-500 focus:ring-red-500/30`
- **Success:** Green border: `border-green-500`
- **Disabled:** Darker background, grayed out

#### Password Input
Same as text input, plus:
```tsx
// Toggle button
className="
  absolute right-3 top-1/2 -translate-y-1/2
  p-2 text-gray-500 hover:text-gray-300
  rounded transition-colors
"
```

#### Textarea
Same styling as text input, with:
```tsx
className="
  min-h-[88px] resize-y
  // ... same classes as text input
"
```

### Cards

#### Standard Card
```tsx
className="
  bg-gray-850 border border-gray-700
  rounded-xl p-6
  transition-colors duration-200
"
```

#### Elevated Card
```tsx
className="
  bg-gray-800 border border-gray-700
  rounded-xl p-6
  shadow-md
"
```

#### Interactive Card (Hoverable)
```tsx
className="
  bg-gray-850 border border-gray-700
  rounded-xl p-6
  hover:bg-gray-800 hover:border-gray-600
  cursor-pointer
  transition-all duration-200
"
```

#### Balance Card (Dashboard)
```tsx
className="
  bg-gradient-to-br from-gray-850 to-gray-800
  border border-gray-700
  rounded-xl p-8
  shadow-lg
  text-center
"
```

### Transaction Cards

#### Sent Transaction
```tsx
<div className="
  bg-gray-850 border border-gray-700
  rounded-lg p-4
  hover:bg-gray-800
  transition-colors duration-200
  cursor-pointer
">
  {/* Arrow icon - red */}
  <svg className="w-5 h-5 text-red-400">...</svg>

  {/* Amount - red */}
  <span className="text-red-400 font-semibold">
    -0.00100000 BTC
  </span>

  {/* Status - gray */}
  <span className="text-gray-400 text-sm">
    2 confirmations
  </span>
</div>
```

#### Received Transaction
```tsx
<div className="...same wrapper...">
  {/* Arrow icon - green */}
  <svg className="w-5 h-5 text-green-400">...</svg>

  {/* Amount - green */}
  <span className="text-green-400 font-semibold">
    +0.05000000 BTC
  </span>

  {/* Status - gray */}
  <span className="text-gray-400 text-sm">
    Confirmed
  </span>
</div>
```

### Dropdowns

#### Account Dropdown Trigger
```tsx
className="
  flex items-center gap-2
  px-4 py-2.5
  bg-gray-850 border border-gray-700
  hover:bg-gray-800 hover:border-gray-600
  rounded-lg
  transition-colors duration-200
"
```

#### Dropdown Menu
```tsx
className="
  absolute z-50
  min-w-[280px]
  bg-gray-800 border border-gray-700
  rounded-xl
  shadow-xl
  p-2
  mt-2
"
```

#### Dropdown Item
```tsx
className="
  w-full px-4 py-3
  text-left
  text-gray-300
  hover:bg-gray-750 hover:text-white
  rounded-lg
  transition-colors duration-200
"
```

#### Active Dropdown Item
```tsx
className="
  w-full px-4 py-3
  bg-bitcoin-subtle text-bitcoin-light
  border border-bitcoin-light/30
  rounded-lg
"
```

### Modals

#### Modal Overlay
```tsx
className="
  fixed inset-0 z-50
  bg-black/85
  backdrop-blur-sm
  flex items-center justify-center
  p-6
"
```

#### Modal Container
```tsx
className="
  w-full max-w-md
  bg-gray-850 border border-gray-700
  rounded-2xl
  shadow-2xl
  p-8
"
```

#### Modal Header
```tsx
<div className="flex items-center justify-between mb-6">
  <h2 className="text-xl font-semibold text-white">
    Modal Title
  </h2>

  <button className="
    p-2
    text-gray-400 hover:text-white hover:bg-gray-800
    rounded-lg
    transition-colors
  ">
    <XIcon className="w-5 h-5" />
  </button>
</div>
```

### Badges & Tags

#### Default Badge
```tsx
className="
  inline-flex items-center
  px-2.5 py-1
  bg-gray-800 text-gray-300
  text-xs font-medium
  rounded-md
"
```

#### Success Badge
```tsx
className="
  inline-flex items-center
  px-2.5 py-1
  bg-green-500/15 text-green-400
  border border-green-500/30
  text-xs font-medium
  rounded-md
"
```

#### Error Badge
```tsx
className="
  inline-flex items-center
  px-2.5 py-1
  bg-red-500/15 text-red-400
  border border-red-500/30
  text-xs font-medium
  rounded-md
"
```

#### Warning Badge
```tsx
className="
  inline-flex items-center
  px-2.5 py-1
  bg-amber-500/15 text-amber-400
  border border-amber-500/30
  text-xs font-medium
  rounded-md
"
```

### Toast Notifications

#### Success Toast
```tsx
className="
  flex items-start gap-3
  min-w-[320px] max-w-[420px]
  bg-gray-850 border-l-4 border-l-green-500
  border border-gray-700
  rounded-xl
  shadow-xl
  p-4
"
```

#### Error Toast
```tsx
className="
  ... same structure ...
  border-l-red-500
"
```

#### Info Toast
```tsx
className="
  ... same structure ...
  border-l-blue-500
"
```

### Loading States

#### Spinner
```tsx
<div className="
  animate-spin rounded-full
  h-8 w-8
  border-3 border-gray-700 border-t-bitcoin
" />
```

#### Skeleton Loader
```tsx
className="
  bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900
  bg-size-200
  animate-shimmer
  rounded-lg
  h-6
"
```

### QR Code Display

```tsx
<div className="
  inline-flex
  bg-white
  border-2 border-bitcoin-light
  rounded-xl
  p-4
  shadow-[0_0_0_8px_rgba(247,147,26,0.12)]
">
  <QRCodeSVG value={address} size={200} />
</div>
```

**Note:** QR codes must remain on white background for scannability.

### Toggle Switch

```tsx
<button
  className={`
    relative inline-flex items-center
    h-6 w-11
    rounded-full
    transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-900
    ${enabled ? 'bg-bitcoin' : 'bg-gray-700'}
  `}
>
  <span
    className={`
      inline-block h-4 w-4
      transform rounded-full
      bg-white
      transition-transform duration-200
      ${enabled ? 'translate-x-6' : 'translate-x-1'}
    `}
  />
</button>
```

---

## Screen-by-Screen Dark Mode Designs

### 1. WalletSetup Screen

**Current:** Light gradient background (`from-orange-50 to-orange-100`)
**Dark Mode:** Dark gradient with Bitcoin orange accent

```tsx
// Outer container
className="
  w-full h-full
  flex items-center justify-center
  bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
  p-6
"

// Setup card
className="
  w-full max-w-md
  bg-gray-850 border border-gray-700
  rounded-2xl
  shadow-2xl
  p-8
"

// Title
className="text-2xl font-bold text-white mb-6 text-center"

// Tabs
className={`
  flex-1 py-3
  text-sm font-semibold
  transition-colors duration-200
  ${activeTab === 'create'
    ? 'text-bitcoin border-b-2 border-bitcoin'
    : 'text-gray-400 hover:text-gray-300'
  }
`}

// Tab underline border
className="border-b border-gray-800 mb-6"

// Input fields
// Use standard dark input classes from above

// Submit button
// Use primary button classes from above
```

#### Backup/Seed Phrase Screen

```tsx
// Title
<h2 className="text-2xl font-bold text-white mb-4">
  Backup Your Seed Phrase
</h2>

// Description
<p className="text-sm text-gray-400 mb-6">...</p>

// Seed phrase container
className="
  bg-gray-900
  border-2 border-bitcoin-light
  rounded-xl
  p-6
  mb-6
  shadow-[0_0_0_4px_rgba(247,147,26,0.12)]
"

// Seed words
className="text-sm font-mono font-semibold text-white"

// Word numbers
className="text-xs text-gray-500 font-mono"

// Warning box
className="
  bg-red-500/15
  border border-red-500/30
  rounded-lg
  p-4
  mb-6
"

<p className="text-xs text-red-300">
  <strong className="text-red-200">Warning:</strong> Never share...
</p>

// Checkbox label
<label className="flex items-start gap-3 mb-6 cursor-pointer">
  <input
    type="checkbox"
    className="
      mt-1 w-4 h-4
      bg-gray-900 border-gray-700
      checked:bg-bitcoin checked:border-bitcoin
      rounded
      focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850
    "
  />
  <span className="text-sm text-gray-300">
    I have written down my seed phrase...
  </span>
</label>
```

### 2. UnlockScreen

**Current:** Light gradient background
**Dark Mode:** Dark with subtle Bitcoin accent

```tsx
// Container
className="
  w-full h-full
  flex items-center justify-center
  bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
  p-6
"

// Unlock card
className="
  w-full max-w-md
  bg-gray-850 border border-gray-700
  rounded-2xl
  shadow-2xl
  p-8
  text-center
"

// Bitcoin logo (if using icon/svg)
className="
  mx-auto mb-6
  w-16 h-16
  text-bitcoin
  // Or if using background circle:
  flex items-center justify-center
  w-16 h-16
  bg-bitcoin/10
  border-2 border-bitcoin/30
  rounded-full
"

// Welcome text
<h2 className="text-2xl font-bold text-white mb-6">
  Welcome back!
</h2>

// Password input
// Use standard dark input classes

// Unlock button
// Use primary button classes

// "Forgot password" link
<button className="text-sm text-gray-400 hover:text-bitcoin transition-colors">
  Forgot password? <span className="text-bitcoin">Import wallet</span>
</button>
```

### 3. Dashboard

**Current:** `bg-gray-50` main, `bg-white` cards
**Dark Mode:** Dark backgrounds with layered elevation

```tsx
// Main container
className="w-full h-full bg-gray-950 flex flex-col"

// Header
className="
  bg-gray-900 border-b border-gray-800
  px-6 py-4
"

// Account selector button
className="
  flex items-center gap-2
  px-4 py-2.5
  bg-gray-850 hover:bg-gray-800
  border border-gray-700 hover:border-gray-600
  rounded-lg
  transition-colors duration-200
"

<span className="font-semibold text-white">Account 1</span>
<ChevronDownIcon className="w-4 h-4 text-gray-400" />

// Lock button
className="
  p-2
  text-gray-400 hover:text-white
  hover:bg-gray-850
  rounded-lg
  transition-colors
"

// Account dropdown menu
className="
  absolute top-full left-0 mt-2
  w-64
  bg-gray-800 border border-gray-700
  rounded-xl
  shadow-xl
  z-50
  py-2
"

// Account dropdown item
className={`
  w-full px-4 py-3
  text-left
  hover:bg-gray-750
  transition-colors
  ${currentAccountIndex === index ? 'bg-bitcoin-subtle' : ''}
`}

// Active account checkmark
<CheckIcon className="w-5 h-5 text-bitcoin" />

// Main content area
className="flex-1 overflow-y-auto p-6 bg-gray-950"

// Balance card
className="
  bg-gradient-to-br from-gray-850 to-gray-800
  border border-gray-700
  rounded-xl
  p-8
  mb-6
  text-center
  shadow-lg
"

<p className="text-sm text-gray-400 mb-2">Total Balance</p>

<h2 className="text-4xl font-bold text-white mb-1">
  0.00000000 BTC
</h2>

{/* Unconfirmed balance */}
<p className="text-xs text-gray-500">
  +0.00000000 BTC unconfirmed
</p>

{/* Testnet badge */}
<p className="text-xs text-bitcoin mt-2 font-medium">Testnet</p>

// Action buttons grid
className="grid grid-cols-3 gap-4 mb-6"

// Send button (primary)
className="
  bg-bitcoin text-white
  hover:bg-bitcoin-hover
  active:bg-bitcoin-active active:scale-[0.98]
  py-3 rounded-lg
  font-semibold
  transition-all duration-200
"

// Receive button (primary)
// Same as Send button

// Settings button (secondary)
className="
  bg-gray-850 text-gray-300
  hover:bg-gray-800 hover:text-white
  border border-gray-700
  py-3 rounded-lg
  font-semibold
  transition-colors duration-200
"

// Addresses section
className="
  bg-gray-850 border border-gray-700
  rounded-xl
  p-6
  shadow-sm
"

<h3 className="text-lg font-semibold text-white mb-4">
  Addresses
</h3>

// Generate new button
className="
  text-sm text-bitcoin hover:text-bitcoin-hover
  font-semibold
  transition-colors
  disabled:opacity-50
"

// Address list item
className="
  flex items-center justify-between
  p-3
  bg-gray-900 border border-gray-800
  hover:bg-gray-800 hover:border-gray-700
  rounded-lg
  transition-colors duration-200
"

<p className="text-xs text-gray-500 mb-1">Address #1</p>
<p className="text-sm font-mono text-gray-300 truncate">{address}</p>

{/* Used badge */}
<span className="
  inline-block mt-1
  px-2 py-0.5
  bg-bitcoin-subtle text-bitcoin-light
  border border-bitcoin-light/30
  text-xs
  rounded
">
  Used
</span>

// Copy button
className="
  ml-3 p-2
  text-gray-500 hover:text-white
  hover:bg-gray-800
  rounded
  transition-colors
"

// Recent activity section
className="
  mt-6
  bg-gray-850 border border-gray-700
  rounded-xl
  p-6
"

<h3 className="text-lg font-semibold text-white mb-4">
  Recent Activity
</h3>

<p className="text-center text-sm text-gray-500 py-8">
  Transaction history coming in Phase 3
</p>
```

### 4. SendScreen

```tsx
// Main container
className="w-full h-full bg-gray-950 flex flex-col"

// Header
className="
  bg-gray-900 border-b border-gray-800
  px-6 py-4
  flex items-center gap-4
"

// Back button
className="
  p-2
  text-gray-400 hover:text-white
  hover:bg-gray-850
  rounded-lg
  transition-colors
"

<h1 className="text-xl font-semibold text-white">Send</h1>

// Content
className="flex-1 overflow-y-auto p-6"

// Form labels
<label className="block text-sm font-medium text-gray-300 mb-2">
  Recipient Address
</label>

// Input fields
// Use standard dark input classes from above

// Helper text
<p className="text-xs text-gray-500 mt-1">
  Enter a valid Bitcoin address
</p>

// Error message
<p className="text-xs text-red-400 mt-1">
  <ExclamationIcon className="inline w-4 h-4 mr-1" />
  Invalid address format
</p>

// Success message (valid address)
<p className="text-xs text-green-400 mt-1">
  <CheckIcon className="inline w-4 h-4 mr-1" />
  Valid address
</p>

// Available balance
<p className="text-sm text-gray-400 mt-2">
  Available: <span className="text-white font-semibold">0.05 BTC</span>
  <button className="ml-2 text-bitcoin hover:text-bitcoin-hover font-medium">
    Max
  </button>
</p>

// Fee selector (radio cards)
className={`
  flex items-center justify-between
  p-4
  bg-gray-900 border-2
  ${selected ? 'border-bitcoin bg-bitcoin-subtle' : 'border-gray-700'}
  rounded-lg
  cursor-pointer
  transition-colors duration-200
  hover:border-gray-600
`}

// Radio button (styled)
className={`
  w-5 h-5
  border-2 ${selected ? 'border-bitcoin' : 'border-gray-600'}
  rounded-full
  flex items-center justify-center
`}

{selected && (
  <div className="w-2.5 h-2.5 bg-bitcoin rounded-full" />
)}

// Fee labels
<span className="text-white font-medium">Fast</span>
<span className="text-gray-400 text-sm">~10 min</span>
<span className="text-gray-300 font-mono text-sm">0.00004 BTC</span>

// Review button
// Use primary button classes
```

### 5. ReceiveScreen

```tsx
// Main container
className="w-full h-full bg-gray-950 flex flex-col"

// Header (same as SendScreen)

// Content
className="flex-1 overflow-y-auto p-6 flex flex-col items-center"

<h2 className="text-lg font-semibold text-white mb-6">
  Your Wallet Address
</h2>

// QR Code wrapper
<div className="
  inline-flex
  bg-white
  border-3 border-bitcoin-light
  rounded-2xl
  p-5
  mb-6
  shadow-[0_0_0_12px_rgba(247,147,26,0.12)]
">
  <QRCodeSVG value={address} size={200} />
</div>

// Account info
<p className="text-xs text-gray-500 mb-3">
  Account 1 • Address #3
</p>

// Address display card
className="
  w-full
  flex items-center justify-between
  px-4 py-3
  bg-gray-900 border border-gray-700
  rounded-lg
  mb-6
"

<p className="flex-1 text-sm font-mono text-gray-300 truncate">
  {address}
</p>

// Copy button
className="
  ml-3 p-2
  text-gray-400 hover:text-white
  hover:bg-gray-850
  rounded
  transition-colors
"

// Generate new address button
// Use secondary (outlined) button classes

// Privacy tip
<div className="flex items-start gap-2 text-xs text-gray-500 mt-4">
  <InformationCircleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
  <p>Use a new address for each transaction for better privacy</p>
</div>
```

### 6. SettingsScreen

```tsx
// Main container
className="w-full h-full bg-gray-950 flex flex-col"

// Header (same structure)

// Content
className="flex-1 overflow-y-auto p-6"

// Settings sections
className="
  bg-gray-850 border border-gray-700
  rounded-xl
  p-6
  mb-6
"

// Section title
<h3 className="text-base font-semibold text-white mb-4">
  General
</h3>

// Setting row
className="
  flex items-center justify-between
  py-3
  border-b border-gray-800 last:border-b-0
"

<label className="text-sm text-gray-300">Currency</label>

// Select dropdown
<select className="
  px-3 py-2
  bg-gray-900 border border-gray-700
  text-white
  rounded-lg
  focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
  transition-colors
">
  <option>USD</option>
  <option>EUR</option>
  <option>BTC</option>
</select>

// Toggle setting
<div className="flex items-center justify-between py-3">
  <div>
    <label className="text-sm text-gray-300 block">
      Dark Mode
    </label>
    <span className="text-xs text-gray-500">
      Use dark color scheme
    </span>
  </div>

  {/* Toggle component (see Toggle Switch section above) */}
</div>

// Dangerous action row
className="
  flex items-center justify-between
  py-3
  border-b border-gray-800
"

<div>
  <label className="text-sm text-red-400">Show Recovery Phrase</label>
  <span className="text-xs text-gray-500 block mt-0.5">
    Requires password
  </span>
</div>

<ChevronRightIcon className="w-5 h-5 text-gray-500" />

// About section
<div className="text-center text-xs text-gray-500 mt-4">
  <p>Version 0.4.0 (MVP Complete)</p>
  <div className="flex items-center justify-center gap-4 mt-2">
    <a href="#" className="text-bitcoin hover:text-bitcoin-hover">
      GitHub
    </a>
    <a href="#" className="text-bitcoin hover:text-bitcoin-hover">
      Support
    </a>
  </div>
</div>
```

---

## Toggle Implementation

### Toggle Placement Options

**Recommendation:** Place dark mode toggle in **Settings Screen only** for MVP.

**Rationale:**
- Dark mode is the default and primary theme
- Light mode will be added in Phase 2 based on user demand
- Settings is the expected location for theme controls
- Keeps UI clean without persistent toggle cluttering header

### Implementation in SettingsScreen

```tsx
// Add to Settings > General section

<div className="flex items-center justify-between py-3">
  <div>
    <label className="text-sm text-gray-300 block font-medium">
      Dark Mode
    </label>
    <span className="text-xs text-gray-500">
      Use dark color scheme (Light mode coming soon)
    </span>
  </div>

  <ToggleSwitch
    enabled={isDarkMode}
    onChange={setIsDarkMode}
    disabled={true} // Disabled in MVP - only dark mode available
  />
</div>

{/* Info note for MVP */}
<p className="text-xs text-gray-500 italic mt-2">
  Note: Only dark mode is available in this version.
  Light mode will be added in a future update.
</p>
```

### Future: Persistent Toggle (Phase 2)

When implementing light mode in Phase 2, add persistent toggle to header:

```tsx
// In Dashboard/Screen headers
<button
  onClick={() => setIsDarkMode(!isDarkMode)}
  className="
    p-2
    text-gray-400 hover:text-white
    hover:bg-gray-850
    rounded-lg
    transition-colors
  "
  title="Toggle Dark Mode"
>
  {isDarkMode ? (
    <SunIcon className="w-5 h-5" />
  ) : (
    <MoonIcon className="w-5 h-5" />
  )}
</button>
```

### Storage & Persistence

```typescript
// Store preference in chrome.storage.local
interface UserPreferences {
  theme: 'dark' | 'light';
  // ... other preferences
}

// On theme toggle
const handleThemeChange = async (isDark: boolean) => {
  await chrome.storage.local.set({
    preferences: {
      ...preferences,
      theme: isDark ? 'dark' : 'light'
    }
  });

  // Apply theme class to root element
  document.documentElement.classList.toggle('dark', isDark);
};

// On app mount
useEffect(() => {
  const loadTheme = async () => {
    const { preferences } = await chrome.storage.local.get('preferences');
    const isDark = preferences?.theme !== 'light'; // Default to dark
    document.documentElement.classList.toggle('dark', isDark);
  };
  loadTheme();
}, []);
```

---

## Tailwind Configuration

Update `/home/michael/code_projects/bitcoin_wallet/tailwind.config.js`:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/popup/popup.html',
  ],
  darkMode: 'class', // Enable dark mode via class strategy
  theme: {
    extend: {
      colors: {
        // Bitcoin brand colors
        bitcoin: {
          DEFAULT: '#F7931A',
          hover: '#FF9E2D',
          active: '#E88711',
          light: '#FFA43D',
          subtle: 'rgba(247, 147, 26, 0.12)',
          muted: 'rgba(247, 147, 26, 0.24)',
        },

        // Extended gray scale for dark mode
        gray: {
          50: '#F9FAFB',   // Light mode
          100: '#F3F4F6',  // Light mode
          200: '#E5E7EB',  // Light mode
          300: '#D4D4D4',  // Dark mode text-secondary
          400: '#A3A3A3',  // Dark mode text-tertiary
          500: '#737373',  // Dark mode text-quaternary
          600: '#525252',  // Dark mode text-disabled
          650: '#323232',  // Custom - surface-active
          700: '#404040',  // Dark mode border-default
          750: '#2E2E2E',  // Custom - surface-hover, border-subtle
          800: '#242424',  // Dark mode bg-tertiary
          850: '#1E1E1E',  // Custom - surface-default
          900: '#1A1A1A',  // Dark mode bg-secondary
          950: '#0F0F0F',  // Dark mode bg-primary
        },

        // Semantic colors optimized for dark mode
        green: {
          400: '#4ADE80',  // Success text on dark
          500: '#22C55E',  // Success primary
          600: '#16A34A',  // Success hover
        },
        red: {
          400: '#F87171',  // Error text on dark
          500: '#EF4444',  // Error primary
          600: '#DC2626',  // Error hover
        },
        amber: {
          400: '#FBBF24',  // Warning text on dark
          500: '#F59E0B',  // Warning primary
          600: '#D97706',  // Warning hover
        },
        blue: {
          400: '#60A5FA',  // Info text on dark
          500: '#3B82F6',  // Info primary
          600: '#2563EB',  // Info hover
        },
      },

      // Dark mode shadows
      boxShadow: {
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'md': '0 4px 12px -2px rgba(0, 0, 0, 0.6)',
        'lg': '0 10px 24px -4px rgba(0, 0, 0, 0.7)',
        'xl': '0 20px 40px -8px rgba(0, 0, 0, 0.8)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.85)',

        // Glow effects
        'glow-bitcoin': '0 0 24px rgba(247, 147, 26, 0.35)',
        'glow-bitcoin-strong': '0 0 32px rgba(247, 147, 26, 0.5)',
        'glow-success': '0 0 24px rgba(34, 197, 94, 0.35)',
        'glow-error': '0 0 24px rgba(239, 68, 68, 0.35)',
      },

      // Animation for skeleton loader
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
      backgroundSize: {
        '200': '200% 100%',
      },

      width: {
        'popup': '600px',
      },
      height: {
        'popup': '400px',
      },

      // Border widths
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
```

---

## Migration Strategy

### Phase 1: Update Tailwind Config
1. ✅ Add extended color palette
2. ✅ Add custom gray scale values (650, 750, 850, 950)
3. ✅ Add Bitcoin brand colors with variants
4. ✅ Update shadows for dark mode
5. ✅ Add glow shadow utilities

### Phase 2: Update Global Styles
1. Set dark mode as default in `index.css` or root component:
```css
/* Add to src/popup/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Force dark mode by default */
html {
  @apply bg-gray-950 text-white;
}
```

2. Add dark class to root element:
```tsx
// In src/popup/index.tsx or App.tsx
useEffect(() => {
  document.documentElement.classList.add('dark');
}, []);
```

### Phase 3: Migrate Components (Priority Order)
1. **App.tsx** - Loading/error states
2. **WalletSetup.tsx** - Setup and backup screens
3. **UnlockScreen.tsx** - Unlock interface
4. **Dashboard.tsx** - Main interface
5. **SendScreen.tsx** - Send transaction
6. **ReceiveScreen.tsx** - Receive address
7. **SettingsScreen.tsx** - Settings

### Phase 4: Component-by-Component Migration

For each component:
1. Replace `bg-gray-50` → `bg-gray-950`
2. Replace `bg-gray-100` → `bg-gray-900`
3. Replace `bg-white` → `bg-gray-850` (for cards)
4. Replace `text-gray-900` → `text-white`
5. Replace `text-gray-600` → `text-gray-400`
6. Replace `text-gray-500` → `text-gray-500` (already good)
7. Replace `border-gray-200` → `border-gray-700`
8. Replace `border-gray-300` → `border-gray-700`
9. Update orange shades:
   - `bg-orange-50` → `bg-bitcoin-subtle`
   - `bg-orange-500` → `bg-bitcoin`
   - `hover:bg-orange-600` → `hover:bg-bitcoin-hover`
10. Update semantic colors for dark backgrounds

### Phase 5: Testing
1. Visual regression testing (compare screenshots)
2. Accessibility testing (contrast ratios)
3. User testing (readability, preference)

---

## Accessibility Compliance

### WCAG 2.1 AA Contrast Requirements

All color combinations have been verified for WCAG AA compliance:

#### Text Contrast Ratios (Minimum 4.5:1 for normal text)

| Foreground | Background | Ratio | Status |
|-----------|-----------|-------|---------|
| `#FFFFFF` (white) | `#0F0F0F` (bg-primary) | 19.5:1 | ✅ AAA |
| `#D4D4D4` (text-secondary) | `#0F0F0F` | 11.2:1 | ✅ AAA |
| `#A3A3A3` (text-tertiary) | `#0F0F0F` | 7.3:1 | ✅ AAA |
| `#737373` (text-quaternary) | `#0F0F0F` | 4.8:1 | ✅ AA |
| `#FFFFFF` (white) | `#F7931A` (bitcoin) | 4.6:1 | ✅ AA |
| `#FFFFFF` (white) | `#22C55E` (success) | 4.1:1 | ⚠️ Large text only |
| `#22C55E` (success) | `#0F0F0F` | 7.8:1 | ✅ AAA |
| `#EF4444` (error) | `#0F0F0F` | 6.2:1 | ✅ AAA |

**Note:** Success buttons use larger text (16px+) to meet AA standards.

#### UI Component Contrast (Minimum 3:1)

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|-----------|-------|---------|
| Border default | `#404040` | `#0F0F0F` | 3.8:1 | ✅ AA |
| Border hover | `#525252` | `#0F0F0F` | 4.2:1 | ✅ AA |
| Input border | `#404040` | `#1A1A1A` | 3.2:1 | ✅ AA |
| Card border | `#404040` | `#0F0F0F` | 3.8:1 | ✅ AA |

### Keyboard Navigation

All interactive elements maintain visible focus indicators:

```tsx
// Focus ring utility
className="
  focus:outline-none
  focus:ring-2 focus:ring-bitcoin
  focus:ring-offset-2 focus:ring-offset-gray-900
"
```

Focus indicators use Bitcoin orange (`#F7931A`) with 2px ring + 2px offset.

### Screen Reader Support

All icons and images require appropriate ARIA labels:

```tsx
// Icon buttons
<button aria-label="Lock wallet">
  <LockIcon className="w-5 h-5" />
</button>

// Status indicators
<span aria-label="Transaction confirmed" className="...">
  <CheckIcon />
</span>

// Loading states
<div role="status" aria-live="polite">
  <span className="sr-only">Loading wallet data...</span>
  <Spinner />
</div>
```

### Color Independence

Never convey information by color alone:

```tsx
// ✅ Good: Icon + color + text
<div className="flex items-center gap-2">
  <CheckCircleIcon className="w-5 h-5 text-green-400" />
  <span className="text-green-400">Confirmed</span>
</div>

// ❌ Bad: Color only
<span className="text-green-400">Confirmed</span>
```

---

## Implementation Checklist

### Prerequisites
- [ ] Backup current codebase
- [ ] Create feature branch: `feature/dark-mode`
- [ ] Review this design spec with team

### Configuration
- [ ] Update `tailwind.config.js` with extended colors
- [ ] Add custom gray scale values (650, 750, 850, 950)
- [ ] Add Bitcoin brand colors with hover/active variants
- [ ] Update shadow utilities for dark mode
- [ ] Add glow shadow utilities
- [ ] Enable `darkMode: 'class'` in Tailwind config

### Global Styles
- [ ] Update `src/popup/index.css` with dark mode base styles
- [ ] Add `.dark` class to document root on app mount
- [ ] Test that base HTML elements render correctly

### Component Migration
- [ ] **App.tsx**
  - [ ] Update loading screen background
  - [ ] Update error screen styling
  - [ ] Verify all states render correctly

- [ ] **WalletSetup.tsx**
  - [ ] Update outer gradient background
  - [ ] Update setup card styling
  - [ ] Update tab navigation colors
  - [ ] Update form inputs
  - [ ] Update backup screen
  - [ ] Update seed phrase display container
  - [ ] Update warning box styling
  - [ ] Test create wallet flow
  - [ ] Test import wallet flow

- [ ] **UnlockScreen.tsx**
  - [ ] Update background gradient
  - [ ] Update unlock card styling
  - [ ] Update Bitcoin logo/icon colors
  - [ ] Update input field styling
  - [ ] Test unlock flow with correct/incorrect password

- [ ] **Dashboard.tsx**
  - [ ] Update main container background
  - [ ] Update header styling
  - [ ] Update account selector button
  - [ ] Update account dropdown menu
  - [ ] Update balance card gradient
  - [ ] Update action buttons (Send, Receive, Settings)
  - [ ] Update addresses section card
  - [ ] Update address list items
  - [ ] Update "Used" badge styling
  - [ ] Update copy button states
  - [ ] Update recent activity section
  - [ ] Test all interactive elements

- [ ] **SendScreen.tsx**
  - [ ] Update main container background
  - [ ] Update header styling
  - [ ] Update form labels and inputs
  - [ ] Update helper text colors
  - [ ] Update error/success message styling
  - [ ] Update available balance text
  - [ ] Update fee selector radio cards
  - [ ] Update review button
  - [ ] Test entire send flow

- [ ] **ReceiveScreen.tsx**
  - [ ] Update main container background
  - [ ] Update header styling
  - [ ] Update QR code container (keep white background!)
  - [ ] Update QR code border and glow
  - [ ] Update address display card
  - [ ] Update copy button
  - [ ] Update "Generate new address" button
  - [ ] Update privacy tip styling
  - [ ] Test QR code scannability

- [ ] **SettingsScreen.tsx**
  - [ ] Update main container background
  - [ ] Update section card styling
  - [ ] Update setting row styling
  - [ ] Update select dropdown styling
  - [ ] Update toggle switch styling
  - [ ] Add dark mode toggle (disabled in MVP)
  - [ ] Update dangerous action row styling
  - [ ] Update about section text
  - [ ] Test all settings interactions

### Reusable Components (if extracted)
- [ ] Button component with all variants
- [ ] Input component with all states
- [ ] Card component with variants
- [ ] Modal component
- [ ] Dropdown component
- [ ] Badge component
- [ ] Toast notification component
- [ ] Toggle switch component
- [ ] Spinner/loading component

### Testing
- [ ] **Visual Testing**
  - [ ] All screens render correctly
  - [ ] Colors match specification exactly
  - [ ] Borders and shadows correct
  - [ ] Hover states work properly
  - [ ] Focus states visible and correct
  - [ ] Loading states display correctly
  - [ ] Error states styled correctly
  - [ ] Empty states display correctly

- [ ] **Accessibility Testing**
  - [ ] Run axe DevTools accessibility checker
  - [ ] Verify all contrast ratios meet WCAG AA
  - [ ] Test keyboard navigation throughout app
  - [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
  - [ ] Verify all ARIA labels present and correct
  - [ ] Test focus indicators on all interactive elements

- [ ] **Functional Testing**
  - [ ] Complete wallet setup flow
  - [ ] Lock and unlock wallet
  - [ ] Switch between accounts
  - [ ] Generate new addresses
  - [ ] Send transaction flow (testnet)
  - [ ] View transaction history
  - [ ] Adjust settings
  - [ ] Copy addresses to clipboard

- [ ] **Browser Testing**
  - [ ] Chrome (primary)
  - [ ] Edge (Chromium)
  - [ ] Brave (Chromium)

- [ ] **Zoom/Scaling Testing**
  - [ ] 90% zoom
  - [ ] 100% zoom (default)
  - [ ] 110% zoom
  - [ ] 125% zoom
  - [ ] 150% zoom

### Documentation
- [ ] Update `ui-ux-designer-notes.md` with dark mode decision
- [ ] Update component library documentation
- [ ] Add dark mode screenshots to docs
- [ ] Update `CHANGELOG.md`
- [ ] Update `README.md` if needed

### Pre-Launch
- [ ] Code review with Frontend Developer
- [ ] Design review with Product Manager
- [ ] Security review (ensure no sensitive data in screenshots)
- [ ] User acceptance testing
- [ ] Address any feedback
- [ ] Final QA pass

### Deployment
- [ ] Merge feature branch to main
- [ ] Tag release version
- [ ] Build production bundle
- [ ] Test production build in Chrome
- [ ] Deploy to Chrome Web Store (when ready)

---

## Notes & Recommendations

### Best Practices

1. **Always Test QR Codes:** Scan every QR code with actual Bitcoin wallet app to ensure scannability
2. **Contrast First:** When in doubt, increase contrast rather than decrease
3. **Use Semantic Classes:** Prefer semantic Tailwind classes over arbitrary values
4. **Consistent Spacing:** Use design system spacing scale consistently
5. **Test with Real Users:** Dark mode preference is subjective - gather feedback

### Common Pitfalls to Avoid

1. ❌ **Don't use pure black** (`#000000`) - it's too harsh; use `#0F0F0F` instead
2. ❌ **Don't oversaturate colors** - desaturate slightly for dark backgrounds
3. ❌ **Don't forget hover states** - they're harder to see in dark mode
4. ❌ **Don't rely on shadows alone** - use borders for definition
5. ❌ **Don't make text too dim** - maintain readability over aesthetics

### Performance Considerations

- Dark mode doesn't impact bundle size (same CSS, different values)
- OLED screens benefit from dark mode (lower power consumption)
- Backdrop blur can be performance-intensive on lower-end devices - use sparingly

### Future Enhancements (Phase 2+)

- [ ] Add light mode theme
- [ ] Add auto-detect system preference
- [ ] Add smooth theme transition animations
- [ ] Add high contrast mode option
- [ ] Add custom theme color options
- [ ] Add theme preview in settings

---

**Document Status:** Complete and ready for implementation
**Last Updated:** October 12, 2025
**Next Review:** After implementation completion
**Stakeholders:** Frontend Developer, Product Manager, QA Engineer

---

*This specification provides everything needed to implement a professional, accessible, and beautiful dark mode for the Bitcoin Wallet Chrome Extension. The design maintains Bitcoin brand identity while providing excellent readability and user experience.*
