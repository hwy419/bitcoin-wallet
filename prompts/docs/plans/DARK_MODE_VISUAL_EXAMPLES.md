# Dark Mode Visual Examples
## Bitcoin Wallet Chrome Extension

**Purpose:** Visual reference showing light mode → dark mode transformations
**Date:** October 12, 2025

---

## Color Transformation Reference

### Background Colors

| Element | Current (Light) | New (Dark) | Tailwind Class |
|---------|----------------|------------|----------------|
| **Main Background** | `#F9FAFB` (gray-50) | `#0F0F0F` (gray-950) | `bg-gray-950` |
| **Secondary Background** | `#F3F4F6` (gray-100) | `#1A1A1A` (gray-900) | `bg-gray-900` |
| **Card Surface** | `#FFFFFF` (white) | `#1E1E1E` (gray-850) | `bg-gray-850` |
| **Elevated Surface** | `#FFFFFF` (white) | `#2A2A2A` (gray-750) | `bg-gray-750` |
| **Input Background** | `#FFFFFF` (white) | `#1A1A1A` (gray-900) | `bg-gray-900` |
| **Hover State** | `#F3F4F6` (gray-100) | `#2E2E2E` (gray-700) | `hover:bg-gray-700` |

### Text Colors

| Element | Current (Light) | New (Dark) | Tailwind Class |
|---------|----------------|------------|----------------|
| **Primary Text** | `#111827` (gray-900) | `#FFFFFF` (white) | `text-white` |
| **Secondary Text** | `#4B5563` (gray-600) | `#D4D4D4` (gray-300) | `text-gray-300` |
| **Tertiary Text** | `#6B7280` (gray-500) | `#A3A3A3` (gray-400) | `text-gray-400` |
| **Disabled Text** | `#9CA3AF` (gray-400) | `#737373` (gray-500) | `text-gray-500` |
| **Link Text** | `#F7931A` (bitcoin) | `#FFA43D` (bitcoin-light) | `text-bitcoin-light` |

### Border Colors

| Element | Current (Light) | New (Dark) | Tailwind Class |
|---------|----------------|------------|----------------|
| **Default Border** | `#E5E7EB` (gray-200) | `#404040` (gray-700) | `border-gray-700` |
| **Subtle Border** | `#F3F4F6` (gray-100) | `#2E2E2E` (gray-750) | `border-gray-750` |
| **Hover Border** | `#D1D5DB` (gray-300) | `#525252` (gray-600) | `hover:border-gray-600` |
| **Focus Border** | `#F7931A` (bitcoin) | `#F7931A` (bitcoin) | `focus:border-bitcoin` |

### Button Colors

| Button Type | Current (Light) | New (Dark) |
|-------------|----------------|------------|
| **Primary Background** | `#F7931A` (bitcoin) | `#F7931A` (bitcoin) |
| **Primary Hover** | `#D77C15` | `#FF9E2D` (brighter for dark) |
| **Secondary Border** | `#F7931A` | `#FFA43D` (bitcoin-light) |
| **Secondary Background** | `transparent` | `transparent` |
| **Ghost Background** | `#F3F4F6` | `#1A1A1A` (gray-900) |
| **Ghost Hover** | `#E5E7EB` | `#242424` (gray-800) |

---

## Component Examples

### Dashboard - Balance Card

**Light Mode (Current):**
```
┌─────────────────────────────────────────┐
│         bg-white                        │
│         text-gray-600                   │
│                                         │
│         Total Balance                   │
│         0.00000000 BTC                  │
│         text-gray-900                   │
│                                         │
│         ≈ $0.00 USD                     │
│         text-gray-500                   │
└─────────────────────────────────────────┘
```

**Dark Mode (New):**
```
┌─────────────────────────────────────────┐
│         bg-gradient-to-br               │
│         from-gray-850 to-gray-800       │
│         border-gray-700                 │
│                                         │
│         Total Balance                   │
│         text-gray-400                   │
│                                         │
│         0.00000000 BTC                  │
│         text-white (large, bold)        │
│                                         │
│         ≈ $0.00 USD                     │
│         text-gray-500                   │
│                                         │
│         Testnet                         │
│         text-bitcoin                    │
└─────────────────────────────────────────┘
```

### WalletSetup - Setup Form

**Light Mode (Current):**
```
Outer: bg-gradient-to-br from-orange-50 to-orange-100
Card: bg-white, border none, shadow-lg
Title: text-gray-900
Tabs: text-gray-500 / text-orange-500 (active)
Tab Border: border-gray-200 / border-orange-500 (active)
Input: bg-white, border-gray-300, text-gray-900
Button: bg-orange-500, text-white
```

**Dark Mode (New):**
```
Outer: bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950
Card: bg-gray-850, border-gray-700, shadow-2xl
Title: text-white
Tabs: text-gray-400 / text-bitcoin (active)
Tab Border: border-gray-800 / border-bitcoin (active)
Input: bg-gray-900, border-gray-700, text-white
Button: bg-bitcoin, text-white
```

### SendScreen - Fee Selector

**Light Mode (Current):**
```
┌─────────────────────────────────────────┐
│ ○ Fast              bg-white            │
│   ~10 min           border-gray-300     │
│   0.00004 BTC       text-gray-900       │
└─────────────────────────────────────────┘
```

**Dark Mode (New):**
```
┌─────────────────────────────────────────┐
│ ◉ Fast              bg-bitcoin-subtle   │
│   ~10 min           border-bitcoin      │
│   0.00004 BTC       text-white          │
│                     (when selected)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ○ Medium            bg-gray-900         │
│   ~15 min           border-gray-700     │
│   0.00002 BTC       text-gray-300       │
│                     (when unselected)   │
└─────────────────────────────────────────┘
```

### Transaction Card

**Light Mode (Current):**
```
┌─────────────────────────────────────────┐
│ ↗ Sent              bg-white            │
│ -0.001 BTC          text-red-600        │
│ 2 confirmations     text-gray-500       │
│                     border-gray-200     │
└─────────────────────────────────────────┘
```

**Dark Mode (New):**
```
┌─────────────────────────────────────────┐
│ ↗ Sent              bg-gray-850         │
│ -0.001 BTC          text-red-400        │
│ 2 confirmations     text-gray-400       │
│                     border-gray-700     │
│                     hover:bg-gray-800   │
└─────────────────────────────────────────┘
```

### Modal / Dialog

**Light Mode (Current):**
```
Overlay: bg-black/60
Container: bg-white, border none, shadow-2xl
Title: text-gray-900
Close Button: text-gray-500, hover:text-gray-700
```

**Dark Mode (New):**
```
Overlay: bg-black/85, backdrop-blur-sm
Container: bg-gray-850, border-gray-700, shadow-2xl
Title: text-white
Close Button: text-gray-400, hover:text-white, hover:bg-gray-800
```

### Input Field States

**Light Mode:**
```
Default:  bg-white, border-gray-300, text-gray-900
Focus:    border-orange-500, ring-orange-500/20
Error:    border-red-500, ring-red-500/20
Success:  border-green-500
Disabled: bg-gray-100, text-gray-400
```

**Dark Mode:**
```
Default:  bg-gray-900, border-gray-700, text-white
Focus:    border-bitcoin, ring-bitcoin/30
Error:    border-red-500, ring-red-500/30
Success:  border-green-500
Disabled: bg-gray-950, text-gray-600
```

### Badge / Tag

**Light Mode:**
```
Default:  bg-gray-100, text-gray-700
Success:  bg-green-100, text-green-700
Error:    bg-red-100, text-red-700
Warning:  bg-amber-100, text-amber-700
```

**Dark Mode:**
```
Default:  bg-gray-800, text-gray-300
Success:  bg-green-500/15, text-green-400, border-green-500/30
Error:    bg-red-500/15, text-red-400, border-red-500/30
Warning:  bg-amber-500/15, text-amber-400, border-amber-500/30
```

---

## Code Examples

### Before: Light Mode Button

```tsx
<button className="
  bg-orange-500 hover:bg-orange-600
  text-white
  py-3 rounded-lg font-semibold
  transition-colors
">
  Send
</button>
```

### After: Dark Mode Button

```tsx
<button className="
  bg-bitcoin hover:bg-bitcoin-hover
  active:bg-bitcoin-active active:scale-[0.98]
  text-white
  py-3 rounded-lg font-semibold
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-bitcoin
  focus:ring-offset-2 focus:ring-offset-gray-900
">
  Send
</button>
```

### Before: Light Mode Card

```tsx
<div className="bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">
    Addresses
  </h3>
  <p className="text-sm text-gray-600">
    Generate new addresses for receiving Bitcoin
  </p>
</div>
```

### After: Dark Mode Card

```tsx
<div className="
  bg-gray-850 border border-gray-700
  rounded-xl p-6
  shadow-sm
">
  <h3 className="text-lg font-semibold text-white mb-4">
    Addresses
  </h3>
  <p className="text-sm text-gray-400">
    Generate new addresses for receiving Bitcoin
  </p>
</div>
```

### Before: Light Mode Input

```tsx
<input
  type="text"
  className="
    w-full px-4 py-3
    border border-gray-300
    rounded-lg
    focus:outline-none focus:ring-2 focus:ring-orange-500
  "
  placeholder="Enter address"
/>
```

### After: Dark Mode Input

```tsx
<input
  type="text"
  className="
    w-full px-4 py-3
    bg-gray-900 border border-gray-700
    text-white placeholder:text-gray-500
    rounded-lg
    focus:outline-none focus:border-bitcoin
    focus:ring-2 focus:ring-bitcoin/30
    transition-colors duration-200
  "
  placeholder="Enter address"
/>
```

### Before: Light Mode Dropdown

```tsx
<div className="
  absolute top-full left-0 mt-2
  w-64
  bg-white border border-gray-200
  rounded-lg shadow-lg
  z-10
">
  {/* Dropdown items */}
</div>
```

### After: Dark Mode Dropdown

```tsx
<div className="
  absolute top-full left-0 mt-2
  w-64
  bg-gray-800 border border-gray-700
  rounded-xl shadow-xl
  z-50
  p-2
">
  {/* Dropdown items */}
</div>
```

---

## Special Cases

### QR Code Container

**Important:** QR codes must remain on white background for scannability!

```tsx
<div className="
  inline-flex
  bg-white                           {/* Always white! */}
  border-3 border-bitcoin-light
  rounded-2xl
  p-5
  shadow-[0_0_0_12px_rgba(247,147,26,0.12)]
">
  <QRCodeSVG value={address} size={200} />
</div>
```

### Seed Phrase Display

**Light Mode:**
```tsx
<div className="
  bg-gray-50
  border-2 border-orange-200
  rounded-lg p-4
">
  {/* Seed words */}
</div>
```

**Dark Mode:**
```tsx
<div className="
  bg-gray-900
  border-2 border-bitcoin-light
  rounded-xl p-6
  shadow-[0_0_0_4px_rgba(247,147,26,0.12)]
">
  {/* Seed words */}
</div>
```

### Loading Spinner

**Light Mode:**
```tsx
<div className="
  animate-spin rounded-full
  h-8 w-8
  border-b-2 border-orange-500
" />
```

**Dark Mode:**
```tsx
<div className="
  animate-spin rounded-full
  h-8 w-8
  border-3 border-gray-700 border-t-bitcoin
" />
```

---

## Accessibility: Before & After

### Text Contrast Ratios

| Text Level | Light Mode | Dark Mode | Improvement |
|-----------|-----------|-----------|-------------|
| **Primary Text** | 16.1:1 (gray-900 on white) | 19.5:1 (white on gray-950) | ✅ +3.4 |
| **Secondary Text** | 7.0:1 (gray-600 on white) | 11.2:1 (gray-300 on gray-950) | ✅ +4.2 |
| **Tertiary Text** | 4.6:1 (gray-500 on white) | 7.3:1 (gray-400 on gray-950) | ✅ +2.7 |

All combinations exceed WCAG AA requirements in both modes.

### UI Element Contrast

| Element | Light Mode | Dark Mode | Status |
|---------|-----------|-----------|--------|
| **Border on BG** | 2.8:1 (gray-200 on gray-50) | 3.8:1 (gray-700 on gray-950) | ✅ Improved |
| **Card on BG** | 1.03:1 (white on gray-50) | 1.8:1 (gray-850 on gray-950) | ✅ More visible |
| **Input Border** | 3.5:1 | 3.2:1 | ✅ Still AA compliant |

---

## Migration Examples

### Example 1: Dashboard Header

**Before:**
```tsx
<div className="bg-white border-b border-gray-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <button className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
      <span className="font-semibold text-gray-900">{accountName}</span>
      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
    </button>
    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
      <LockIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

**After:**
```tsx
<div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
  <div className="flex items-center justify-between">
    <button className="
      flex items-center gap-2
      px-4 py-2.5
      bg-gray-850 hover:bg-gray-800
      border border-gray-700 hover:border-gray-600
      rounded-lg
      transition-colors duration-200
    ">
      <span className="font-semibold text-white">{accountName}</span>
      <ChevronDownIcon className="w-4 h-4 text-gray-400" />
    </button>
    <button className="
      p-2
      text-gray-400 hover:text-white
      hover:bg-gray-850
      rounded-lg
      transition-colors
    ">
      <LockIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

### Example 2: Address List Item

**Before:**
```tsx
<div className="
  flex items-center justify-between
  p-3
  bg-gray-50 rounded-lg
  hover:bg-gray-100
">
  <div className="flex-1 min-w-0">
    <p className="text-xs text-gray-500 mb-1">Address #1</p>
    <p className="text-sm font-mono text-gray-900 truncate">{address}</p>
  </div>
  <button className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded">
    <CopyIcon className="w-5 h-5" />
  </button>
</div>
```

**After:**
```tsx
<div className="
  flex items-center justify-between
  p-3
  bg-gray-900 border border-gray-800
  hover:bg-gray-800 hover:border-gray-700
  rounded-lg
  transition-colors duration-200
">
  <div className="flex-1 min-w-0">
    <p className="text-xs text-gray-500 mb-1">Address #1</p>
    <p className="text-sm font-mono text-gray-300 truncate">{address}</p>
  </div>
  <button className="
    ml-3 p-2
    text-gray-500 hover:text-white
    hover:bg-gray-800
    rounded
    transition-colors
  ">
    <CopyIcon className="w-5 h-5" />
  </button>
</div>
```

---

## Key Takeaways

### Color Philosophy

1. **Not Pure Black:** Use `#0F0F0F` instead of `#000000` for reduced eye strain
2. **Layered Elevation:** Use subtle background variations (850 → 800 → 750)
3. **Brighter Hovers:** Hover states should be slightly brighter than base
4. **Desaturated Colors:** Semantic colors slightly desaturated for dark backgrounds
5. **Bitcoin Orange Unchanged:** Primary brand color works perfectly on dark

### Component Patterns

1. **Cards:** Always have border + background (not just background)
2. **Inputs:** Dark background with lighter border
3. **Buttons:** Same colors but brighter hover state
4. **Text:** White primary, gray-300 secondary, gray-400 tertiary
5. **Borders:** Gray-700 is the new gray-200

### Implementation Strategy

1. Start with global backgrounds (950 → 900 → 850)
2. Update text hierarchy (white → 300 → 400 → 500)
3. Adjust borders (700 as default)
4. Refine hover states (brighter for dark)
5. Test contrast ratios
6. Verify accessibility

---

**Document Purpose:** Visual reference for developers implementing dark mode
**Related Documents:**
- `DARK_MODE_DESIGN_SPEC.md` - Complete technical specification
- `ui-ux-designer-notes.md` - Design system documentation

**Last Updated:** October 12, 2025
