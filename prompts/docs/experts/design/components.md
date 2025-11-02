# Component Library Specification

**Last Updated**: October 22, 2025
**Owner**: UI/UX Designer
**Status**: Complete - Tab Architecture (v0.9.0+)

[← Back to Index](./_INDEX.md)

---

## Quick Navigation

- [Buttons](#buttons)
- [Input Fields](#input-fields)
- [Cards](#cards)
- [Modals & Dialogs](#modals--dialogs)
- [Form Controls](#form-controls)
- [Navigation](#navigation)
- [Feedback Components](#feedback-components)
- [Data Display](#data-display)
- [Privacy Components (v0.11.0)](#privacy-components-v0110)

---

## Overview

This document specifies all reusable UI components for the Bitcoin Wallet extension. Components follow the dark-mode-first design system with Bitcoin orange as the primary color.

**Design Principles:**
- Consistent visual language across all components
- Accessibility-first (WCAG AA compliance)
- Reusable and composable
- Dark theme optimized

---

## Buttons

### Primary Button (Bitcoin Orange)

**Purpose**: Primary actions, CTAs, main user flows

**Visual Specifications:**
```css
Background:       #F7931A
Text:             #FFFFFF
Padding:          12px 24px (py-3 px-6)
Border Radius:    8px (rounded-lg)
Font:             14px, Semibold (text-sm font-semibold)
Height:           44px (h-11)
```

**States:**
```css
Default:    bg-bitcoin text-white
Hover:      bg-bitcoin-hover (#D77C15)
Active:     bg-bitcoin-active (#C76D12), scale(0.98)
Disabled:   bg-gray-700 text-gray-600, cursor-not-allowed
Loading:    Show spinner, disabled state
```

**Tailwind Implementation:**
```tsx
<button className="
  bg-bitcoin hover:bg-bitcoin-hover active:scale-[0.98]
  text-white font-semibold text-sm
  px-6 py-3 rounded-lg
  transition-all duration-200
  disabled:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed
">
  Primary Action
</button>
```

**Usage Examples:**
- "Create Wallet", "Send", "Confirm", "Next", "Save"
- Only one primary button per view
- Right-aligned in button groups

---

### Secondary Button (Outlined)

**Purpose**: Secondary actions, alternative paths

**Visual Specifications:**
```css
Background:       Transparent
Border:           1px solid #FFA43D (Bitcoin Orange Light)
Text:             #FFA43D
Padding:          12px 24px (py-3 px-6)
Border Radius:    8px (rounded-lg)
Font:             14px, Semibold
Height:           44px
```

**States:**
```css
Default:    border-bitcoin-light text-bitcoin-light bg-transparent
Hover:      bg-bitcoin/10
Active:     bg-bitcoin/15
Disabled:   border-gray-700 text-gray-600
```

**Tailwind Implementation:**
```tsx
<button className="
  border border-bitcoin-light text-bitcoin-light
  hover:bg-bitcoin/10 active:bg-bitcoin/15
  px-6 py-3 rounded-lg font-semibold text-sm
  transition-colors duration-200
  disabled:border-gray-700 disabled:text-gray-600
">
  Secondary Action
</button>
```

**Usage Examples:**
- "Cancel", "Back", "Import Wallet", "Address Book"

---

### Ghost Button

**Purpose**: Tertiary actions, low-emphasis actions

**Visual Specifications:**
```css
Background:       Transparent
Border:           None
Text:             #B4B4B4 (gray-400)
Padding:          12px 20px (py-3 px-5)
Font:             14px, Medium
```

**States:**
```css
Default:    text-gray-400 bg-transparent
Hover:      bg-gray-800 text-white
Active:     bg-gray-750
Disabled:   text-gray-600
```

**Usage Examples:**
- "Learn More", "View Details", "Dismiss"

---

### Danger Button

**Purpose**: Destructive actions, critical operations

**Visual Specifications:**
```css
Background:       #EF4444 (red-500)
Text:             #FFFFFF
Same sizing as Primary
```

**States:**
```css
Default:    bg-red-500
Hover:      bg-red-600
Active:     bg-red-700
```

**Usage Examples:**
- "Delete Account", "Reset Wallet", "Export Unencrypted"

---

### Icon Button

**Purpose**: Icon-only actions, compact toolbars

**Visual Specifications:**
```css
Size:             44x44px
Border Radius:    8px (rounded-lg)
Background:       Transparent
Icon Size:        20px
```

**States:**
```css
Default:    bg-transparent
Hover:      bg-gray-800
Active:     bg-gray-750
```

**Usage Examples:**
- Copy button, Close button, Edit button, Menu button

---

## Input Fields

### Text Input

**Purpose**: General text entry

**Visual Specifications:**
```css
Background:       #242424 (gray-800)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          12px 16px (py-3 px-4)
Font:             14px, Regular (text-sm)
Text Color:       #FFFFFF
Placeholder:      #808080 (gray-500)
Height:           44px
```

**States:**
```css
Default:    bg-gray-800 border-gray-700 text-white
Focus:      border-bitcoin ring-2 ring-bitcoin/10
Error:      border-red-500 ring-2 ring-red-500/10
Success:    border-green-500
Disabled:   bg-gray-900 border-gray-750 text-gray-600 cursor-not-allowed
```

**Tailwind Implementation:**
```tsx
<input className="
  w-full h-11
  bg-gray-800 border border-gray-700
  rounded-lg px-4 py-3
  text-white text-sm placeholder:text-gray-500
  focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10
  disabled:bg-gray-900 disabled:border-gray-750 disabled:text-gray-600
  transition-all duration-200
"/>
```

---

### Input Label

**Visual Specifications:**
```css
Font:             12px, Medium (text-xs font-medium)
Color:            #B4B4B4 (text-gray-400)
Margin Bottom:    8px (mb-2)
Required:         Red asterisk (#EF4444)
```

**Implementation:**
```tsx
<label className="block text-xs font-medium text-gray-400 mb-2">
  Password <span className="text-red-500">*</span>
</label>
```

---

### Input Helper Text

**Visual Specifications:**
```css
Font:             12px, Regular (text-xs)
Color:            #808080 (text-gray-500)
Margin Top:       6px (mt-1.5)
```

---

### Input Error Message

**Visual Specifications:**
```css
Font:             12px, Regular (text-xs)
Color:            #EF4444 (text-red-500)
Margin Top:       6px (mt-1.5)
Icon:             Error icon before text (⚠️)
```

**Implementation:**
```tsx
<div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-500">
  <ExclamationTriangleIcon className="h-4 w-4" />
  <span>Invalid address format</span>
</div>
```

---

### Password Input

**Purpose**: Password entry with show/hide toggle

**Specifications:**
Same as Text Input, plus:
- Show/Hide toggle button (eye icon) on right
- Toggle button size: 24x24px, centered vertically
- Toggle preserves focus state

**Implementation:**
```tsx
<div className="relative">
  <input type={showPassword ? "text" : "password"} className="..." />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2
               text-gray-400 hover:text-white
               transition-colors"
  >
    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
  </button>
</div>
```

---

### Textarea

**Specifications:**
Same as Text Input, but:
```css
Min Height:       88px
Resize:           Vertical only (resize-y)
```

**Usage**: Seed phrase entry, notes, multi-line data

---

## Cards

### Standard Card

**Purpose**: General content container

**Visual Specifications:**
```css
Background:       #1E1E1E (gray-850)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    12px (rounded-xl)
Padding:          20px (p-5)
Shadow:           None
```

**States:**
```css
Default:    bg-gray-850 border-gray-700
Hover:      border-gray-650 (if interactive)
Active:     bg-gray-800 (if interactive)
```

**Tailwind Implementation:**
```tsx
<div className="
  bg-gray-850 border border-gray-700
  rounded-xl p-5
  hover:border-gray-650 (if clickable)
  transition-colors duration-200
">
  Card content
</div>
```

---

### Elevated Card

**Purpose**: Emphasized content, important containers

**Visual Specifications:**
```css
Background:       #2E2E2E (gray-750)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    12px (rounded-xl)
Padding:          20px (p-5)
Shadow:           shadow-sm (0 1px 2px rgba(0,0,0,0.3))
```

**Usage**: Balance card, transaction summary, important notices

---

### Transaction Card

**Purpose**: Display transaction in history list

**Visual Specifications:**
```css
Background:       #1E1E1E (gray-850)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    8px (rounded-lg)
Padding:          16px (p-4)
Display:          Flex layout
```

**Layout:**
```
┌────────────────────────────────────────┐
│ [Icon] Transaction Type     Amount     │
│        Status • Time        USD Value  │
└────────────────────────────────────────┘
```

**Sent Transaction:**
```tsx
<div className="flex items-start justify-between p-4 bg-gray-850 border border-gray-700 rounded-lg">
  <div className="flex items-center gap-3">
    <ArrowUpRightIcon className="h-5 w-5 text-red-500" />
    <div>
      <div className="font-medium text-white">Sent</div>
      <div className="text-xs text-gray-400">2 confirmations · 10:45 AM</div>
    </div>
  </div>
  <div className="text-right">
    <div className="font-mono text-red-500">-0.00100000 BTC</div>
    <div className="text-xs text-gray-400">≈ $30.00</div>
  </div>
</div>
```

**Received Transaction:**
```tsx
<ArrowDownLeftIcon className="h-5 w-5 text-green-500" />
<div className="font-mono text-green-500">+0.05000000 BTC</div>
```

---

## Modals & Dialogs

### Modal Overlay

**Visual Specifications:**
```css
Background:       rgba(0, 0, 0, 0.8)
Backdrop Blur:    blur(8px) (optional, check performance)
Z-Index:          z-[100]
Animation:        Fade in (200ms)
```

**Implementation:**
```tsx
<div className="
  fixed inset-0 z-[100]
  bg-black/80 backdrop-blur-sm
  flex items-center justify-center
  animate-fadeIn
">
  {/* Modal content */}
</div>
```

---

### Modal Container

**Visual Specifications:**
```css
Background:       #1A1A1A (gray-900)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    16px (rounded-2xl)
Padding:          24px (p-6)
Max Width:        560px (max-w-lg) or 640px (max-w-xl) or 800px (max-w-3xl)
Shadow:           shadow-lg
Position:         Centered
Animation:        Slide up + fade in (200ms)
```

**Sizing:**
- **Compact**: 560px (max-w-lg) - Simple confirmations
- **Standard**: 640px (max-w-xl) - Most modals
- **Wide**: 800px (max-w-3xl) - Complex forms (account management, multisig)

**Implementation:**
```tsx
<div className="
  bg-gray-900 border border-gray-700
  rounded-2xl p-6 max-w-xl w-full
  shadow-lg
  animate-slideIn
">
  {/* Modal content */}
</div>
```

---

### Modal Header

**Visual Specifications:**
```css
Display:          Flex (space-between, items-center)
Margin Bottom:    20px (mb-5)
Border Bottom:    Optional 1px solid gray-750
Padding Bottom:   16px (pb-4) if border
```

**Title:**
```css
Font:             20px, Semibold (text-xl font-semibold)
Color:            #FFFFFF (text-white)
```

**Close Button:**
```css
Size:             32x32px
Icon:             X icon (XMarkIcon)
Color:            #808080 (text-gray-500)
Hover:            text-white, bg-gray-800
Border Radius:    8px (rounded-lg)
```

**Implementation:**
```tsx
<div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-750">
  <h2 className="text-xl font-semibold text-white">Modal Title</h2>
  <button
    onClick={onClose}
    className="
      p-1.5 rounded-lg
      text-gray-500 hover:text-white hover:bg-gray-800
      transition-colors
    "
  >
    <XMarkIcon className="h-5 w-5" />
  </button>
</div>
```

---

### Modal Actions

**Visual Specifications:**
```css
Display:          Flex (gap 12px)
Margin Top:       24px (mt-6)
Justify:          Flex-end or space-between
```

**Patterns:**
- **Right-aligned**: `justify-end` - Primary + Secondary
- **Space-between**: `justify-between` - Cancel left, Primary right

**Implementation:**
```tsx
{/* Right-aligned */}
<div className="flex justify-end gap-3 mt-6">
  <button className="secondary">Cancel</button>
  <button className="primary">Confirm</button>
</div>

{/* Space-between */}
<div className="flex justify-between items-center mt-6">
  <button className="ghost">Cancel</button>
  <div className="flex gap-3">
    <button className="secondary">Save Draft</button>
    <button className="primary">Publish</button>
  </div>
</div>
```

---

## Form Controls

### Toggle Switch

**Purpose**: Binary on/off settings

**Visual Specifications:**
```css
Track Width:      44px
Track Height:     24px
Border Radius:    Full (9999px)
Background Off:   #3A3A3A (gray-700)
Background On:    #F7931A (bitcoin)
```

**Thumb:**
```css
Size:             20px diameter
Background:       #FFFFFF
Position Off:     Left (2px from edge)
Position On:      Right (22px from left)
Transition:       0.2s ease
```

**Implementation:**
```tsx
<button
  role="switch"
  aria-checked={enabled}
  onClick={() => setEnabled(!enabled)}
  className={`
    relative inline-flex h-6 w-11 items-center rounded-full
    transition-colors duration-200
    ${enabled ? 'bg-bitcoin' : 'bg-gray-700'}
  `}
>
  <span
    className={`
      inline-block h-5 w-5 transform rounded-full bg-white
      transition-transform duration-200
      ${enabled ? 'translate-x-6' : 'translate-x-0.5'}
    `}
  />
</button>
```

---

### Checkbox

**Visual Specifications:**
```css
Size:             20x20px
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    4px (rounded)
Background:       Transparent
```

**Checked State:**
```css
Background:       #F7931A (bitcoin)
Border:           #F7931A
Icon:             White checkmark (CheckIcon)
```

---

### Radio Button

**Visual Specifications:**
```css
Size:             20x20px
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    Full (rounded-full)
Background:       Transparent
```

**Selected State:**
```css
Border:           2px solid #F7931A
Inner Dot:        8px diameter, #F7931A, centered
```

---

## Navigation

### Sidebar Navigation Item

**Purpose**: Main navigation links in sidebar

**Visual Specifications:**
```css
Width:            100% of sidebar (208px content)
Height:           48px
Padding:          12px 16px (py-3 px-4)
Border Radius:    8px (rounded-lg)
Display:          Flex with icon + label
Icon Size:        20px
Font:             14px, medium weight
Gap:              12px between icon and label
```

**States:**
```css
Default:    bg-transparent text-gray-300
Hover:      bg-gray-800 text-white
Active:     bg-bitcoin text-gray-950 font-semibold
            shadow-glow-bitcoin (0 0 16px rgba(247,147,26,0.4))
            Small dot indicator on right
```

**Implementation:**
```tsx
<button className={`
  w-full flex items-center gap-3
  px-4 py-3 rounded-lg
  font-medium text-sm
  transition-all duration-200
  ${isActive
    ? 'bg-bitcoin text-gray-950 font-semibold shadow-glow-bitcoin'
    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
  }
`}>
  <WalletIcon className="h-5 w-5" />
  <span>Assets</span>
  {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-950" />}
</button>
```

---

### Tab Navigation

**Purpose**: Switch between views in same screen

**Visual Specifications:**
```css
Container:
  Display:        Flex
  Gap:            4px
  Background:     #242424 (gray-800)
  Border Radius:  8px (rounded-lg)
  Padding:        4px (p-1)

Tab Item:
  Padding:        10px 20px (py-2.5 px-5)
  Border Radius:  6px (rounded-md)
  Font:           14px, Medium
  Color:          #808080 (gray-500)

Active Tab:
  Background:     #1E1E1E (gray-850)
  Color:          #FFFFFF
```

**Implementation:**
```tsx
<div className="inline-flex gap-1 bg-gray-800 p-1 rounded-lg">
  <button className={`
    px-5 py-2.5 rounded-md text-sm font-medium
    transition-all duration-200
    ${activeTab === 'all'
      ? 'bg-gray-850 text-white'
      : 'text-gray-500 hover:text-gray-400'
    }
  `}>
    All
  </button>
  <button className="...">Sent</button>
  <button className="...">Received</button>
</div>
```

---

## Feedback Components

### Spinner

**Purpose**: Loading indicator

**Visual Specifications:**
```css
Size:             20px (small), 32px (medium), 48px (large)
Border:           3px solid #3A3A3A (gray-700)
Border Top:       3px solid #F7931A (bitcoin)
Border Radius:    Full (rounded-full)
Animation:        Spin 0.8s linear infinite
```

**Implementation:**
```tsx
<div className="
  h-8 w-8
  border-3 border-gray-700 border-t-bitcoin
  rounded-full
  animate-spin
" />
```

---

### Toast Notification

**Purpose**: Temporary success/error/info messages

**Visual Specifications:**
```css
Background:       #2E2E2E (gray-750)
Border:           1px solid #3A3A3A (gray-700)
Border Radius:    12px (rounded-xl)
Padding:          16px (p-4)
Min Width:        320px
Max Width:        420px
Shadow:           shadow-lg
Display:          Flex (icon + content + close)
Gap:              12px (gap-3)
```

**Variants:**
```css
Success:    border-left: 3px solid #22C55E
            Icon color: #22C55E

Error:      border-left: 3px solid #EF4444
            Icon color: #EF4444

Info:       border-left: 3px solid #3B82F6
            Icon color: #3B82F6

Warning:    border-left: 3px solid #F59E0B
            Icon color: #F59E0B
```

---

### Skeleton Loader

**Purpose**: Content placeholder during loading

**Visual Specifications:**
```css
Background:       Linear gradient animation
  From:           #1E1E1E (gray-850)
  Via:            #242424 (gray-800)
  To:             #1E1E1E (gray-850)
Border Radius:    4px (rounded)
Height:           Match content (16px, 20px, 24px)
Width:            100% or specific
Animation:        1.5s ease-in-out infinite
```

---

## Data Display

### QR Code Container

**Purpose**: Display Bitcoin address as QR code

**Visual Specifications:**
```css
Background:       #FFFFFF (white for scannability)
Border:           2px solid #FFA43D (bitcoin-light)
Border Radius:    12px (rounded-xl)
Padding:          16px (p-4)
Display:          Inline-flex
Box Shadow:       0 0 0 8px rgba(247, 147, 26, 0.1)
```

**QR Code:**
```css
Size:             200x200px
Error Level:      M (Medium)
Foreground:       #000000 (black)
Background:       #FFFFFF (white)
```

**Implementation:**
```tsx
<div className="
  inline-flex
  bg-white p-4 rounded-xl
  border-2 border-bitcoin-light
  shadow-[0_0_0_8px_rgba(247,147,26,0.1)]
">
  <QRCodeSVG
    value={address}
    size={200}
    level="M"
    fgColor="#000000"
    bgColor="#FFFFFF"
  />
</div>
```

---

### Badge

**Purpose**: Status indicators, tags, labels

**Visual Specifications:**
```css
Background:       #3A3A3A (gray-700)
Color:            #B4B4B4 (gray-400)
Padding:          4px 10px (py-1 px-2.5)
Border Radius:    6px (rounded-md)
Font:             11px, Medium (text-xs font-medium)
Display:          Inline-flex
Align:            Center
```

**Variants:**
```css
Success:    bg-green-500/15 text-green-400 border border-green-500/30
Error:      bg-red-500/15 text-red-400 border border-red-500/30
Warning:    bg-amber-500/15 text-amber-400 border border-amber-500/30
Info:       bg-blue-500/15 text-blue-400 border border-blue-500/30
```

**Implementation:**
```tsx
<span className="
  inline-flex items-center
  px-2.5 py-1 rounded-md
  text-xs font-medium
  bg-green-500/15 text-green-400 border border-green-500/30
">
  ✓ Confirmed
</span>
```

---

## Privacy Components (v0.11.0)

### PrivacyBadge

**Purpose**: Visual indicator for privacy status

**Variants:**
```css
Success (Privacy Enabled):
  bg-green-500/15
  border-green-500/30
  text-green-400

Warning (Privacy Risk):
  bg-amber-500/12
  border-amber-500/30
  text-amber-300

Info:
  bg-blue-500/10
  border-blue-500/30
  text-blue-300
```

**Sizes:**
- **sm**: `px-2 py-0.5 text-xs` - Inline in lists
- **md**: `px-2.5 py-1 text-sm` - Standalone indicators

**Props:**
```typescript
interface PrivacyBadgeProps {
  variant: 'success' | 'warning' | 'info';
  label: string;
  icon?: ReactNode;
  tooltip?: string;
  size?: 'sm' | 'md';
}
```

**Usage Examples:**
```tsx
<PrivacyBadge
  variant="success"
  label="Privacy: Rotation"
  icon={<CheckIcon className="h-3 w-3" />}
  tooltip="This contact uses address rotation for privacy"
  size="sm"
/>

<PrivacyBadge
  variant="warning"
  label="Reuses Address"
  icon={<ExclamationTriangleIcon className="h-3 w-3" />}
  tooltip="This contact reuses the same address"
  size="sm"
/>
```

---

### InfoBox

**Purpose**: Educational content boxes, tips, warnings

**Visual Specifications:**
```css
Display:          Flex
Padding:          16px (p-4)
Border Radius:    8px (rounded-lg)
Gap:              12px (gap-3)
Structure:        Icon + Content
```

**Variants:**
```css
Info (Blue):
  bg-blue-500/10
  border border-blue-500/30
  Icon: text-blue-400

Success (Green):
  bg-green-500/15
  border border-green-500/30
  Icon: text-green-400

Warning (Amber):
  bg-amber-500/12
  border border-amber-500/30
  Icon: text-amber-400
```

**Props:**
```typescript
interface InfoBoxProps {
  variant: 'info' | 'success' | 'warning';
  title?: string;
  content: ReactNode;
  icon?: ReactNode;
  action?: {label: string; onClick: () => void};
  dismissible?: boolean;
}
```

**Implementation:**
```tsx
<div
  role="region"
  aria-label="Privacy tip"
  className="
    flex gap-3 p-4 rounded-lg
    bg-blue-500/10 border border-blue-500/30
  "
>
  <InformationCircleIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
  <div className="flex-1">
    <div className="text-sm font-semibold text-white mb-1">Privacy Tip</div>
    <div className="text-sm text-gray-300">
      Reusing addresses links your transactions publicly on the blockchain.
    </div>
    {action && (
      <button className="mt-2 text-sm text-blue-400 hover:text-blue-300">
        {action.label} →
      </button>
    )}
  </div>
  {dismissible && (
    <button className="text-gray-400 hover:text-white">
      <XMarkIcon className="h-4 w-4" />
    </button>
  )}
</div>
```

---

### PrivacyTooltip

**Purpose**: Contextual privacy help

**Visual Specifications:**
```css
Max Width:        280px
Background:       #323232 (gray-700)
Border:           1px solid #3A3A3A
Border Radius:    8px (rounded-lg)
Padding:          8px 12px (px-3 py-2)
Font:             12px (text-xs)
Color:            #FFFFFF
Shadow:           shadow-md
Delay:            300ms
Arrow:            Small triangle pointing to trigger
```

**Props:**
```typescript
interface PrivacyTooltipProps {
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: number;
  children: ReactNode;
}
```

**Accessibility:**
```tsx
<div
  role="tooltip"
  aria-describedby="tooltip-id"
  className="..."
>
  {content}
</div>
```

---

## Animation Patterns

### Transitions

```css
/* Default transition for most interactions */
.transition-default {
  transition: all 0.2s ease;
}

/* Color transitions for buttons and states */
.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease;
}

/* Transform transitions for hover effects */
.transition-transform {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
```

### Hover Effects

```css
/* Subtle lift on hover */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

/* Button press effect */
.active-press:active {
  transform: scale(0.98);
}
```

### Entrance Animations

```css
/* Fade in */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide in from bottom */
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Shake (for errors) */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
```

---

## Responsive Behavior

### Touch Targets

All interactive elements must have minimum 44x44px touch target:

```css
/* Ensure minimum touch target size */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px; /* Or adjust to reach 44px */
}
```

### Breakpoint Adaptations

```css
/* Mobile (<768px) */
@media (max-width: 767px) {
  /* Increase touch targets to 48px */
  .btn { min-height: 48px; }

  /* Stack button groups */
  .button-group { flex-direction: column; }

  /* Full-width inputs */
  .input { width: 100%; }
}
```

---

## Related Documentation

- [Design System](./design-system.md) - Colors, typography, spacing
- [User Flows](./user-flows.md) - How components combine into flows
- [Accessibility](./accessibility.md) - ARIA patterns and keyboard navigation
- [Design Decisions](./decisions.md) - Why components are designed this way

---

**Last Updated**: October 22, 2025
**Version**: v0.11.0 (Privacy Enhancement Release)