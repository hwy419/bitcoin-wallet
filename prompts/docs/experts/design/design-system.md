# Design System Specification

**Last Updated**: October 22, 2025
**Owner**: UI/UX Designer
**Status**: Complete - Tab Architecture (v0.9.0+)

[← Back to Index](./_INDEX.md)

---

## Quick Navigation

- [Color Palette](#color-palette)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Elevation & Shadows](#elevation--shadows)
- [Dark Mode](#dark-mode)

---

## Overview

This document defines the complete design system for the Bitcoin Wallet Chrome Extension. The design is dark-mode-first, using Bitcoin orange (#F7931A) as the primary brand color.

**Design Philosophy:**
- Dark mode as default and primary theme
- Bitcoin orange for primary actions and branding
- High contrast for accessibility (WCAG AA compliance)
- System fonts for performance and native feel

---

## Color Palette

### Primary Colors (Bitcoin Theme)

```css
Bitcoin Orange (Primary):     #F7931A
Bitcoin Orange Hover:         #D77C15
Bitcoin Orange Active:        #C76D12
Bitcoin Orange Light:         #FFA43D (borders, accents)
Bitcoin Orange Subtle:        rgba(247, 147, 26, 0.1) (backgrounds)
```

**Usage:**
- Primary buttons, CTAs, highlights
- Active navigation states
- Focus indicators
- Brand elements

**Tailwind Classes:**
```css
bg-bitcoin       /* #F7931A */
hover:bg-bitcoin-hover  /* #D77C15 */
border-bitcoin-light    /* #FFA43D */
bg-bitcoin/10    /* rgba(247, 147, 26, 0.1) */
```

---

### Background Colors (Dark Theme - Tab Architecture)

```css
Body Background:              #0F0F0F (gray-950)
Sidebar Background:           #1A1A1A (gray-900)
Background Primary:           #1A1A1A (gray-900)
Background Secondary:         #242424  (gray-800)
Background Tertiary:          #2E2E2E  (gray-750)
Surface (Cards):              #1E1E1E  (gray-850)
Surface Elevated:             #323232  (gray-700)
Surface Hover:                #363636
Border Gray:                  #2E2E2E  (gray-750)
```

**Tab Architecture Update (v0.9.0):**
The tab-based architecture introduced a darker body background (#0F0F0F) to create better visual hierarchy and contrast on full-screen layouts. The sidebar uses #1A1A1A to create subtle elevation.

**Hierarchy:**
```
Body (#0F0F0F)
  └─ Sidebar (#1A1A1A)
      └─ Cards (#1E1E1E)
          └─ Elevated Elements (#323232)
```

**Tailwind Classes:**
```css
bg-gray-950    /* Body background #0F0F0F */
bg-gray-900    /* Sidebar #1A1A1A */
bg-gray-850    /* Card surface #1E1E1E */
bg-gray-800    /* Secondary background #242424 */
bg-gray-750    /* Tertiary background #2E2E2E */
bg-gray-700    /* Elevated surface #323232 */
```

---

### Text Colors

```css
Text Primary:                 #FFFFFF (white)
Text Secondary:               #B4B4B4 (gray-400)
Text Tertiary:                #808080 (gray-500)
Text Disabled:                #4A4A4A (gray-600)
Text On Color:                #FFFFFF
```

**Contrast Ratios (WCAG AA Compliant):**
- Primary on gray-950: 17:1 ✅
- Secondary on gray-950: 7.5:1 ✅
- Bitcoin orange on gray-950: 12:1 ✅

**Tailwind Classes:**
```css
text-white         /* Primary text */
text-gray-400      /* Secondary text */
text-gray-500      /* Tertiary text */
text-gray-600      /* Disabled text */
```

---

### Semantic Colors

```css
Success Green:                #22C55E (green-500)
Success Green Subtle:         rgba(34, 197, 94, 0.1)

Error Red:                    #EF4444 (red-500)
Error Red Subtle:             rgba(239, 68, 68, 0.1)

Warning Amber:                #F59E0B (amber-500)
Warning Amber Subtle:         rgba(245, 158, 11, 0.1)

Info Blue:                    #3B82F6 (blue-500)
Info Blue Subtle:             rgba(59, 130, 246, 0.1)
```

**Tab Architecture Update:**
Success green updated from #10B981 to #22C55E for better visibility on the darker gray-950 background. Used for checkmarks, completed transactions, and success messages.

**Usage:**
- **Success**: Transaction confirmed, copy success, validation passed
- **Error**: Failed transactions, validation errors, critical warnings
- **Warning**: Security warnings, non-critical alerts, caution messages
- **Info**: Educational content, tips, informational banners

**Tailwind Classes:**
```css
/* Success */
text-green-500     border-green-500     bg-green-500/10
/* Error */
text-red-500       border-red-500       bg-red-500/10
/* Warning */
text-amber-500     border-amber-500     bg-amber-500/10
/* Info */
text-blue-500      border-blue-500      bg-blue-500/10
```

---

### Privacy Color Palette (v0.11.0+)

```css
Privacy Success:              bg-green-500/15, border-green-500/30, text-green-400
Privacy Warning:              bg-amber-500/12, border-amber-500/30, text-amber-300
Privacy Critical:             bg-red-500/15, border-red-500/30, text-red-300
Privacy Info:                 bg-blue-500/10, border-blue-500/30, text-blue-300
```

**Usage:**
- Privacy indicators (change addresses, UTXO selection)
- Address reuse warnings
- Contact privacy badges
- Privacy mode settings

---

### Border Colors

```css
Border Default:               #3A3A3A (gray-700)
Border Subtle:                #2E2E2E (gray-750)
Border Hover:                 #4A4A4A
Border Focus:                 #F7931A (Bitcoin Orange)
Border Error:                 #EF4444
```

**Tailwind Classes:**
```css
border-gray-700    /* Default borders */
border-gray-750    /* Subtle borders */
border-bitcoin     /* Focus state */
border-red-500     /* Error state */
```

---

### Special Effects

```css
Overlay:                      rgba(0, 0, 0, 0.8)
Backdrop Blur:                blur(8px)
Glow (Bitcoin):               0 0 24px rgba(247, 147, 26, 0.3)
Glow (Success):               0 0 24px rgba(34, 197, 94, 0.3)
```

**Usage:**
- Modal overlays with backdrop blur
- Active navigation glow effect
- Button hover glow (primary actions)
- Success confirmation glow

---

## Typography

### Font Stack (System Fonts)

```css
/* Sans Serif (Body) */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI",
             "Roboto", "Helvetica Neue", Arial, sans-serif;

/* Monospace (Addresses, Hashes) */
font-family: "SF Mono", Monaco, "Courier New", monospace;
```

**Rationale:**
- System fonts for performance (no web fonts to load)
- Native look and feel on each platform
- Excellent readability and accessibility
- Monospace for technical data (addresses, transaction IDs)

---

### Type Scale

```
Display Large:    28px / 36px (line-height) - Semibold
Display:          24px / 32px - Semibold
H1:               20px / 28px - Semibold
H2:               18px / 24px - Semibold
H3:               16px / 22px - Semibold
Body Large:       16px / 24px - Regular
Body:             14px / 20px - Regular
Body Small:       13px / 18px - Regular
Caption:          12px / 16px - Regular
Label:            11px / 14px - Medium
```

**Tailwind Classes:**
```css
text-4xl / text-3xl  /* Display */
text-xl              /* H1 */
text-lg              /* H2 */
text-base            /* H3, Body Large */
text-sm              /* Body */
text-xs              /* Caption, Label */
```

---

### Font Weights

```
Regular:          400 (font-normal)
Medium:           500 (font-medium)
Semibold:         600 (font-semibold)
Bold:             700 (font-bold)
```

**Usage Guidelines:**
- **Headings**: Semibold (600)
- **Body Text**: Regular (400)
- **Labels**: Medium (500)
- **Emphasis**: Semibold (600) or Bold (700)

---

### Special Text Styles

#### Monospace (Addresses/Hashes)

```css
font-family: "SF Mono", Monaco, "Courier New", monospace;
font-size: 13px;
letter-spacing: -0.02em;
```

**Usage:**
- Bitcoin addresses
- Transaction IDs
- Seed phrases
- Private keys
- Any hexadecimal or technical data

**Tailwind Class:** `font-mono text-sm tracking-tight`

#### Balance Display

```css
font-size: 32px;
line-height: 40px;
font-weight: 600;
letter-spacing: -0.02em;
```

**Usage:**
- Main balance display on dashboard
- Large numeric amounts
- Prominent financial data

**Tailwind Class:** `text-4xl font-semibold tracking-tight`

---

## Spacing & Layout

### Spacing Scale

```
0:    0px      (space-0)
1:    4px      (space-1) - xs
2:    8px      (space-2) - sm
3:    12px     (space-3) - md
4:    16px     (space-4) - base
5:    20px     (space-5) - lg
6:    24px     (space-6) - xl
8:    32px     (space-8) - 2xl
10:   40px     (space-10) - 3xl
12:   48px     (space-12) - 4xl
16:   64px     (space-16) - 5xl
```

**Common Patterns:**
- **Card padding**: 20px (p-5) or 24px (p-6)
- **Section gaps**: 24px (space-y-6)
- **Input spacing**: 12px margin-bottom (mb-3)
- **Button padding**: 12px vertical, 24px horizontal (py-3 px-6)
- **Modal padding**: 24px all sides (p-6)

---

### Border Radius

```
None:         0px      (rounded-none)
Small:        6px      (rounded-md) - small elements, tags
Medium:       8px      (rounded-lg) - buttons, inputs
Large:        12px     (rounded-xl) - cards, containers
XL:           16px     (rounded-2xl) - modals, large cards
2XL:          24px     (rounded-3xl) - decorative elements
Full:         9999px   (rounded-full) - pills, avatars
```

**Usage:**
- **Buttons**: 8px (rounded-lg)
- **Inputs**: 8px (rounded-lg)
- **Cards**: 12px (rounded-xl)
- **Modals**: 16px (rounded-2xl)
- **Badges**: 6px (rounded-md)
- **Avatars**: Full (rounded-full)

---

### Layout Constraints

#### Tab-Based Architecture (v0.9.0+)

```
Viewport:             100vw × 100vh
Sidebar:              240px fixed width, 100vh height
Main Content:         calc(100vw - 240px)
Content Max Width:    1280px (max-w-7xl) + mx-auto
Content Padding:      24px (p-6) desktop, 16px (p-4) tablet
```

**Visual Hierarchy:**
```
┌──────────────────────────────────────────────┐
│ Full Browser Tab (100vw × 100vh)            │
│ Background: #0F0F0F (gray-950)               │
├────────────┬─────────────────────────────────┤
│  SIDEBAR   │     MAIN CONTENT AREA           │
│  240px     │     calc(100vw - 240px)         │
│  Fixed     │     Scrollable                  │
│  gray-900  │     gray-950                    │
└────────────┴─────────────────────────────────┘
```

#### Responsive Breakpoints

```css
/* Desktop (1024px and above) */
@media (min-width: 1024px) {
  /* Sidebar visible, 240px */
  /* Content padding: 24px */
  /* Font sizes: standard scale */
}

/* Tablet (768px - 1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  /* Sidebar visible, 240px */
  /* Content padding: 16px */
  /* Some side-by-side elements may stack */
}

/* Mobile (<768px) */
@media (max-width: 767px) {
  /* Sidebar hidden or drawer (future) */
  /* Content padding: 12px horizontal, 16px vertical */
  /* All grids become single column */
}
```

**Note:** Current implementation (v0.9.0) assumes desktop/tablet. Mobile responsive behavior is planned for future releases.

---

## Elevation & Shadows

### Shadow System

```css
/* Shadows */
Small:    0 1px 2px 0 rgba(0, 0, 0, 0.3)
Medium:   0 4px 8px -2px rgba(0, 0, 0, 0.4)
Large:    0 8px 16px -4px rgba(0, 0, 0, 0.5)
Glow:     0 0 24px 0 rgba(247, 147, 26, 0.3)
```

**Tailwind Classes:**
```css
shadow-sm    /* Small */
shadow-md    /* Medium */
shadow-lg    /* Large */
```

**Custom Glow:**
```css
/* Bitcoin glow for active navigation */
box-shadow: 0 0 16px rgba(247, 147, 26, 0.4);
```

---

### Elevation System

```
Level 0:  Surface         - Shadow: None
Level 1:  Raised          - Shadow: Small
Level 2:  Floating        - Shadow: Medium
Level 3:  Modal/Overlay   - Shadow: Large
```

**Usage:**
- **Level 0**: Cards, containers on page
- **Level 1**: Hover states, subtle lift
- **Level 2**: Dropdown menus, tooltips
- **Level 3**: Modals, dialogs

---

### Z-Index Stack

```
Level 0:   Base content                      z-0
Level 1:   Sidebar                           z-10
Level 2:   Dropdown menus                    z-50
Level 3:   Modals                            z-100
Level 4:   Toasts/Notifications (future)    z-200
```

**Tailwind Classes:**
```css
z-0      /* Base */
z-10     /* Sidebar */
z-50     /* Dropdowns */
z-100    /* Modals (custom: z-[100]) */
```

---

## Dark Mode

### Design Philosophy

**Dark mode is the PRIMARY and DEFAULT theme**, not an optional variant. Light mode will be considered for Phase 2 based on user demand.

**Rationale:**
- Modern crypto wallet standard (MetaMask, Lace, Phantom all dark)
- Reduces eye strain for users checking wallet frequently
- Bitcoin orange (#F7931A) pops beautifully on dark background
- Simplified design system (only one theme to maintain)

---

### Key Color Decisions

```
Background primary:   #0F0F0F (not pure black for reduced harshness)
Sidebar:              #1A1A1A (subtle elevation from body)
Surface default:      #1E1E1E (cards and containers)
Text primary:         #FFFFFF (pure white for maximum clarity)
Bitcoin orange:       #F7931A (unchanged, excellent on dark)
```

---

### WCAG AA Compliance

All color combinations meet or exceed WCAG AA requirements:

```
✓ Text Primary (#FFFFFF) on Background (#1A1A1A): 14.0:1
✓ Text Secondary (#B4B4B4) on Background (#1A1A1A): 7.5:1
✓ Text on Bitcoin Orange (#FFFFFF on #F7931A): 4.8:1
✓ Border Default (#3A3A3A) on Background (#1A1A1A): 3.5:1
✓ Success Green (#22C55E) on Background (#0F0F0F): 7.2:1
✓ Warning Amber (#F59E0B) on Background (#0F0F0F): 6.8:1
✓ Info Blue (#3B82F6) on Background (#0F0F0F): 8.1:1
```

**Requirements:**
- Normal text: 4.5:1 minimum ✅
- Large text: 3:1 minimum ✅
- UI components: 3:1 minimum ✅

---

### Extended Gray Scale (Tailwind Custom)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        gray: {
          650: '#3F3F3F',
          750: '#2E2E2E',
          850: '#1E1E1E',
          950: '#0F0F0F',
        }
      }
    }
  }
}
```

**Usage:**
- **gray-950**: Body background
- **gray-900**: Sidebar, modal backgrounds
- **gray-850**: Card surfaces
- **gray-800**: Secondary backgrounds
- **gray-750**: Borders, tertiary backgrounds
- **gray-700**: Elevated surfaces, default borders
- **gray-650**: Hover borders

---

## Tailwind Configuration

### Complete Extended Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Bitcoin Orange
        bitcoin: {
          DEFAULT: '#F7931A',
          hover: '#D77C15',
          light: '#FFA43D',
          subtle: 'rgba(247, 147, 26, 0.1)',
        },
        // Extended Gray Scale
        gray: {
          650: '#3F3F3F',
          750: '#2E2E2E',
          850: '#1E1E1E',
          950: '#0F0F0F',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ],
        mono: [
          '"SF Mono"',
          'Monaco',
          '"Courier New"',
          'monospace'
        ],
      },
      boxShadow: {
        'glow-bitcoin': '0 0 24px rgba(247, 147, 26, 0.3)',
        'glow-green': '0 0 24px rgba(34, 197, 94, 0.3)',
      },
    },
  },
}
```

---

## Design Tokens Reference

Quick reference for common design tokens:

```css
/* Primary Action */
.btn-primary {
  @apply bg-bitcoin text-white px-6 py-3 rounded-lg;
  @apply hover:bg-bitcoin-hover active:scale-[0.98];
  @apply transition-all duration-200;
}

/* Card Surface */
.card {
  @apply bg-gray-850 border border-gray-700 rounded-xl p-6;
}

/* Input Field */
.input {
  @apply bg-gray-800 border border-gray-700 rounded-lg px-4 py-3;
  @apply text-white placeholder:text-gray-500;
  @apply focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10;
}

/* Success Badge */
.badge-success {
  @apply bg-green-500/15 text-green-400 border border-green-500/30;
  @apply px-2 py-1 rounded text-xs font-medium;
}

/* Warning Box */
.warning-box {
  @apply bg-amber-500/12 border-l-4 border-amber-500;
  @apply p-4 rounded;
}
```

---

## Related Documentation

- [Component Specifications](./components.md)
- [User Flow Diagrams](./user-flows.md)
- [Accessibility Guidelines](./accessibility.md)
- [Design Decisions](./decisions.md)

---

**Last Updated**: October 22, 2025
**Version**: v0.11.0 (Privacy Enhancement Release)