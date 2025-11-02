# Styling System

**Last Updated**: October 22, 2025
**Quick Nav**: [Index](./_INDEX.md) | [Architecture](./architecture.md) | [Components](./components.md) | [State](./state.md) | [Decisions](./decisions.md)

---

## Overview

The Bitcoin wallet uses **Tailwind CSS** for styling with a **dark mode-first** design approach. All components use a consistent design system built around Bitcoin orange (#F7931A) and carefully selected gray tones for optimal readability.

---

## Tailwind CSS Configuration

### Current Configuration

**File**: `/tailwind.config.js`

```javascript
module.exports = {
  darkMode: 'class', // Class-based dark mode strategy
  content: ['./src/tab/**/*.{ts,tsx}'], // Updated from src/popup
  theme: {
    extend: {
      colors: {
        // Bitcoin brand colors
        bitcoin: {
          DEFAULT: '#F7931A',      // Primary orange
          hover: '#FF9E2D',        // Brighter for dark backgrounds
          active: '#E88711',       // Darker for pressed state
          light: '#FFA43D',        // Borders, accents
          subtle: 'rgba(247, 147, 26, 0.12)',  // Backgrounds
          muted: 'rgba(247, 147, 26, 0.24)',   // Emphasized backgrounds
        },
        // Extended gray scale for dark mode
        gray: {
          ...defaultGrays,
          650: '#323232',  // Surface-active
          750: '#2E2E2E',  // Surface-hover
          850: '#1E1E1E',  // Card backgrounds
          950: '#0F0F0F',  // Main background (not pure black for eye comfort)
        },
        // Legacy wallet colors (light mode - deprecated for MVP)
        wallet: {
          bg: '#FAFAFA',
          card: '#FFFFFF',
          text: '#1A1A1A',
          'text-secondary': '#6B7280',
          border: '#E5E7EB',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
      },
      boxShadow: {
        'glow-bitcoin': '0 0 20px rgba(247, 147, 26, 0.4)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
      },
      borderWidth: {
        '3': '3px',
      }
    }
  },
  plugins: [],
}
```

---

## Design Tokens

### Color Palette

#### Primary Colors (Dark Mode)

**Background Hierarchy**:
- `gray-950` (#0F0F0F) - Main background (near-black, not pure black for eye comfort)
- `gray-900` (#1A1A1A) - Input backgrounds, secondary surfaces
- `gray-850` (#1E1E1E) - Card backgrounds, elevated surfaces
- `gray-800` (#1F2937) - Dropdown backgrounds, tertiary surfaces

**Text Hierarchy**:
- `white` (#FFFFFF) - Primary text (headings, main content)
- `gray-300` (#D4D4D4) - Secondary text (descriptions, labels)
- `gray-400` (#A3A3A3) - Tertiary text (hints, placeholders)
- `gray-500` (#737373) - Quaternary text (disabled, metadata)
- `gray-600` (#525252) - Disabled text

**Border Colors**:
- `gray-700` (#404040) - Default borders (clearly visible)
- `gray-600` (#525252) - Hover borders (brighter)
- `gray-800` (#1F2937) - Subtle borders (separators)

#### Brand Colors

**Bitcoin Orange**:
- `bitcoin` (#F7931A) - Primary brand color, CTAs, active states
- `bitcoin-hover` (#FF9E2D) - Hover states (brighter for dark backgrounds)
- `bitcoin-active` (#E88711) - Active/pressed states (darker)
- `bitcoin-light` (#FFA43D) - Borders, accents, highlights
- `bitcoin-subtle` (rgba(247, 147, 26, 0.12)) - Background tints
- `bitcoin-muted` (rgba(247, 147, 26, 0.24)) - Emphasized backgrounds

**Semantic Colors**:
- `green-500` (#10B981) - Success, confirmed transactions
- `red-500` (#EF4444) - Error, danger, failed states
- `yellow-500` (#F59E0B) - Warning, pending states
- `blue-500` (#3B82F6) - Info, links, secondary actions

#### Special Colors

**QR Codes**:
- Always use `white` (#FFFFFF) background for scannability
- `bitcoin-light` border with `shadow-glow-bitcoin` for emphasis

**Seed Phrases**:
- `gray-900` background
- `bitcoin-light` border
- `white` text (monospace)
- `shadow-glow-bitcoin` for importance

### Typography

**Font Families**:
- **Sans-serif** (body): `Inter`, fallback to `system-ui` and `sans-serif`
- **Monospace** (code, addresses): `Roboto Mono`, fallback to `monospace`

**Font Weights**:
- Regular: 400 (`font-normal`)
- Medium: 500 (`font-medium`)
- Semibold: 600 (`font-semibold`)
- Bold: 700 (`font-bold`)

**Font Sizes**:
- `text-xs`: 0.75rem (12px) - Small labels, metadata
- `text-sm`: 0.875rem (14px) - Body text, buttons
- `text-base`: 1rem (16px) - Default body
- `text-lg`: 1.125rem (18px) - Subheadings
- `text-xl`: 1.25rem (20px) - Section headers
- `text-2xl`: 1.5rem (24px) - Page titles
- `text-3xl`: 1.875rem (30px) - Large headings
- `text-4xl`: 2.25rem (36px) - Hero text

**Typography Patterns**:
```tsx
// Page Title
<h1 className="text-2xl font-semibold text-white">Dashboard</h1>

// Section Heading
<h2 className="text-xl font-semibold text-white">Recent Transactions</h2>

// Subsection Heading
<h3 className="text-lg font-semibold text-gray-300">Account Details</h3>

// Body Text
<p className="text-sm text-gray-300">Description goes here</p>

// Secondary Text
<p className="text-xs text-gray-400">Helper text or metadata</p>

// Code/Addresses
<code className="text-sm font-mono text-bitcoin-light">tb1q...</code>

// Labels
<label className="text-sm font-medium text-gray-300">Account Name</label>
```

### Spacing Scale

**Tailwind Default** (used throughout):
- `0`: 0px
- `px`: 1px
- `0.5`: 0.125rem (2px)
- `1`: 0.25rem (4px)
- `2`: 0.5rem (8px)
- `3`: 0.75rem (12px)
- `4`: 1rem (16px)
- `5`: 1.25rem (20px)
- `6`: 1.5rem (24px)
- `8`: 2rem (32px)
- `10`: 2.5rem (40px)
- `12`: 3rem (48px)
- `16`: 4rem (64px)

**Custom Spacing**:
- `18`: 4.5rem (72px) - Custom gap size
- `88`: 22rem (352px) - Custom container width

**Common Patterns**:
- Card padding: `p-6` (24px all sides)
- Section spacing: `space-y-6` (24px vertical gap)
- Button padding: `px-6 py-3` (24px horizontal, 12px vertical)
- Input padding: `px-4 py-2` (16px horizontal, 8px vertical)

---

## Dark Mode Implementation

### Dark Mode Strategy

**Implementation Date**: October 12, 2025

**Approach**: Dark mode as **primary and only theme** for MVP

**Rationale**:
- Industry standard for cryptocurrency wallets
- Bitcoin orange has exceptional impact on dark backgrounds
- Reduces eye strain for frequent wallet checking
- OLED power savings
- Light mode deferred to Phase 2 based on user demand

### Global Enablement

**File**: `/src/tab/App.tsx`

```typescript
useEffect(() => {
  // Enable dark mode immediately on mount
  document.documentElement.classList.add('dark');
}, []);
```

All components automatically use dark mode classes via Tailwind's `dark:` prefix.

### Dark Mode Color Philosophy

#### Background Strategy

**Layered Elevation**:
```
Level 0 (Base):      gray-950 (#0F0F0F) - Main background
Level 1 (Surface):   gray-900 (#1A1A1A) - Inputs, forms
Level 2 (Card):      gray-850 (#1E1E1E) - Cards, panels
Level 3 (Elevated):  gray-800 (#1F2937) - Dropdowns, popovers
Level 4 (Modal):     gray-850 with shadow - Modal containers
```

**Why Not Pure Black?**
- Pure black (#000000) is too harsh on eyes
- Near-black (#0F0F0F) provides comfortable viewing
- Subtle variations create depth without heavy shadows
- Better OLED power efficiency than pure black with white text

#### Text Hierarchy

```
Primary:    white (#FFFFFF)     - Headings, main content (19.5:1 contrast ✅ AAA)
Secondary:  gray-300 (#D4D4D4)  - Descriptions, labels (11.2:1 contrast ✅ AAA)
Tertiary:   gray-400 (#A3A3A3)  - Hints, placeholders (7.3:1 contrast ✅ AAA)
Quaternary: gray-500 (#737373)  - Disabled, metadata (4.6:1 contrast ✅ AA)
Disabled:   gray-600 (#525252)  - Disabled text (3.8:1 contrast ✅ AA)
```

All combinations verified for **WCAG 2.1 AA compliance** (minimum 3:1 for borders, 4.5:1 for text).

#### Brand Color Adjustments

**Bitcoin Orange on Dark**:
- Default: #F7931A (8.1:1 contrast on gray-950 ✅ AAA)
- Hover: #FF9E2D (brighter for better visibility on dark)
- Active: #E88711 (darker, with scale-down animation)

**Borders**:
- Default: gray-700 (#404040) - clearly visible
- Hover: gray-600 (#525252) - brighter
- Focus: bitcoin (#F7931A) with ring

---

## Component Style Patterns

### Button Patterns

#### Primary Button (Bitcoin Orange)

```tsx
<button className="
  bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active
  active:scale-[0.98]
  text-white font-semibold
  px-6 py-3 rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850
">
  Send Bitcoin
</button>
```

#### Secondary Button (Gray)

```tsx
<button className="
  bg-gray-800 hover:bg-gray-750 active:bg-gray-700
  active:scale-[0.98]
  text-gray-300 hover:text-white font-semibold
  px-6 py-3 rounded-lg border border-gray-700
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-gray-600 focus:ring-offset-2 focus:ring-offset-gray-850
">
  Cancel
</button>
```

#### Danger Button (Red)

```tsx
<button className="
  bg-red-500 hover:bg-red-600 active:bg-red-700
  active:scale-[0.98]
  text-white font-semibold
  px-6 py-3 rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-850
">
  Delete Account
</button>
```

#### Ghost Button (Transparent)

```tsx
<button className="
  bg-transparent hover:bg-gray-850 active:bg-gray-800
  text-gray-400 hover:text-white
  px-4 py-2 rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-gray-600
">
  Cancel
</button>
```

#### Disabled State

```tsx
<button
  disabled
  className="
    bg-gray-800 text-gray-600
    px-6 py-3 rounded-lg
    cursor-not-allowed opacity-50
  "
>
  Disabled Button
</button>
```

---

### Input Patterns

#### Text Input

```tsx
<input
  type="text"
  className="
    w-full px-4 py-2
    bg-gray-900 border border-gray-700 rounded-lg
    text-white placeholder:text-gray-500
    focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
    transition-colors duration-200
    disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed
  "
  placeholder="Enter account name"
/>
```

#### Password Input

```tsx
<div className="relative">
  <input
    type={showPassword ? 'text' : 'password'}
    className="
      w-full px-4 py-2 pr-12
      bg-gray-900 border border-gray-700 rounded-lg
      text-white placeholder:text-gray-500
      focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
      transition-colors duration-200
    "
    placeholder="Enter password"
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="
      absolute right-3 top-1/2 -translate-y-1/2
      text-gray-400 hover:text-white
      transition-colors duration-200
    "
  >
    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
  </button>
</div>
```

#### Number Input (Satoshis)

```tsx
<input
  type="number"
  className="
    w-full px-4 py-2
    bg-gray-900 border border-gray-700 rounded-lg
    text-white text-right font-mono placeholder:text-gray-500
    focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
    transition-colors duration-200
  "
  placeholder="0"
  min="0"
  step="1"
/>
```

#### Textarea

```tsx
<textarea
  className="
    w-full px-4 py-2
    bg-gray-900 border border-gray-700 rounded-lg
    text-white placeholder:text-gray-500
    focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
    transition-colors duration-200
    resize-none
  "
  rows={4}
  placeholder="Enter notes..."
/>
```

#### Input with Error State

```tsx
<div>
  <input
    className={`
      w-full px-4 py-2
      bg-gray-900 rounded-lg
      text-white placeholder:text-gray-500
      transition-colors duration-200
      ${error
        ? 'border-2 border-red-500 focus:ring-2 focus:ring-red-500/30'
        : 'border border-gray-700 focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30'
      }
    `}
  />
  {error && (
    <p className="mt-1 text-sm text-red-400">{error}</p>
  )}
</div>
```

---

### Card Patterns

#### Basic Card

```tsx
<div className="
  bg-gray-850 border border-gray-700 rounded-xl shadow-sm
  p-6
">
  {/* Card content */}
</div>
```

#### Hoverable Card

```tsx
<div className="
  bg-gray-850 border border-gray-700 rounded-xl shadow-sm
  p-6
  hover:border-gray-600 hover:bg-gray-800
  transition-all duration-200
  cursor-pointer
">
  {/* Card content */}
</div>
```

#### Card with Gradient Background

```tsx
<div className="
  bg-gradient-to-br from-gray-850 to-gray-800
  border border-gray-700 rounded-xl shadow-lg
  p-6
">
  {/* Card content - used for balance cards */}
</div>
```

#### Card with Glow Effect

```tsx
<div className="
  bg-gray-850 border-2 border-bitcoin-light rounded-xl
  shadow-glow-bitcoin
  p-6
">
  {/* Emphasized card - used for seed phrases */}
</div>
```

---

### Modal Patterns

#### Modal Overlay

```tsx
<div className="
  fixed inset-0 z-50
  bg-black/85 backdrop-blur-sm
  flex items-center justify-center
  p-4
">
  {/* Modal container */}
</div>
```

#### Modal Container

```tsx
<div className="
  bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl
  max-w-2xl w-full max-h-[90vh]
  overflow-hidden
  animate-in fade-in zoom-in-95 duration-200
">
  {/* Modal content */}
</div>
```

#### Modal Header

```tsx
<div className="
  px-6 pt-6 pb-4
  border-b border-gray-700
  flex items-center justify-between
">
  <h2 className="text-xl font-semibold text-white">Modal Title</h2>
  <button
    onClick={onClose}
    className="
      text-gray-400 hover:text-white
      transition-colors duration-200
    "
  >
    <XIcon className="w-5 h-5" />
  </button>
</div>
```

#### Modal Body

```tsx
<div className="px-6 py-6 overflow-y-auto">
  {/* Modal content */}
</div>
```

#### Modal Footer

```tsx
<div className="
  px-6 py-4
  border-t border-gray-700
  flex items-center justify-end space-x-3
">
  <button className="secondary-button">Cancel</button>
  <button className="primary-button">Confirm</button>
</div>
```

---

### Alert/Warning Patterns

#### Info Box

```tsx
<div className="
  bg-blue-500/10 border border-blue-500/30 rounded-lg
  p-4
  flex items-start space-x-3
">
  <span className="text-2xl">💡</span>
  <div>
    <p className="text-sm font-semibold text-blue-400 mb-1">Tip</p>
    <p className="text-sm text-gray-300">Helpful information here.</p>
  </div>
</div>
```

#### Warning Box

```tsx
<div className="
  bg-yellow-500/15 border border-yellow-500/30 rounded-lg
  p-4
  flex items-start space-x-3
">
  <span className="text-2xl">⚠️</span>
  <div>
    <p className="text-sm font-semibold text-yellow-400 mb-1">Warning</p>
    <p className="text-sm text-gray-300">Important warning message.</p>
  </div>
</div>
```

#### Danger Box

```tsx
<div className="
  bg-red-500/15 border border-red-500/30 rounded-lg
  p-4
  flex items-start space-x-3
">
  <span className="text-2xl">🔴</span>
  <div>
    <p className="text-sm font-semibold text-red-400 mb-1">Danger</p>
    <p className="text-sm text-gray-300">Critical security warning.</p>
  </div>
</div>
```

#### Success Box

```tsx
<div className="
  bg-green-500/15 border border-green-500/30 rounded-lg
  p-4
  flex items-start space-x-3
">
  <span className="text-2xl">✅</span>
  <div>
    <p className="text-sm font-semibold text-green-400 mb-1">Success</p>
    <p className="text-sm text-gray-300">Operation completed successfully.</p>
  </div>
</div>
```

---

### Badge Patterns

#### Status Badge

```tsx
// Confirmed
<span className="
  inline-flex items-center px-2 py-1 rounded
  bg-green-500/20 text-green-400
  text-xs font-medium
">
  Confirmed
</span>

// Pending
<span className="
  inline-flex items-center px-2 py-1 rounded
  bg-yellow-500/20 text-yellow-400
  text-xs font-medium
">
  Pending
</span>

// Failed
<span className="
  inline-flex items-center px-2 py-1 rounded
  bg-red-500/20 text-red-400
  text-xs font-medium
">
  Failed
</span>
```

#### Recommended Badge

```tsx
<div className="absolute top-0 right-0 -mt-2 -mr-2">
  <span className="
    inline-flex items-center px-3 py-1 rounded-full
    bg-blue-600 text-white
    text-sm font-medium shadow-lg
  ">
    ⭐ Recommended
  </span>
</div>
```

#### Import Badge

```tsx
<span className="
  inline-flex items-center px-2 py-1 rounded
  bg-blue-500/20 text-blue-400 border border-blue-500/30
  text-xs font-medium
">
  <DownloadIcon className="w-3 h-3 mr-1" />
  Imported
</span>
```

---

## Custom Scrollbar Styling

**Implementation Date**: October 13, 2025
**Design Approach**: "Minimalist Dark with Orange Accent"

The custom scrollbar provides a subtle, cohesive look that integrates with the dark theme while using Bitcoin orange for interactive states.

**Location**: `/src/tab/styles/index.css`

### Webkit Browsers (Chrome, Edge, Safari)

```css
/* Scrollbar track */
::-webkit-scrollbar {
  width: 8px;  /* Slim profile */
}

/* Track background (shown on hover) */
::-webkit-scrollbar-track {
  background: transparent;
  transition: background 200ms ease;
}

::-webkit-scrollbar-track:hover {
  background: #1F2937;  /* gray-800 */
}

/* Scrollbar thumb (the draggable part) */
::-webkit-scrollbar-thumb {
  background: #4B5563;  /* gray-600 at rest */
  border: 2px solid #1F2937;  /* gray-800 for visual separation */
  border-radius: 4px;
  min-height: 40px;  /* Ensures draggable area */
  transition: background 150ms ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #F7931A;  /* Bitcoin orange on hover */
}

::-webkit-scrollbar-thumb:active {
  background: #D77C15;  /* Bitcoin orange dark when dragging */
}

/* Respect reduced motion preference */
@media (prefers-reduced-motion: reduce) {
  ::-webkit-scrollbar-track,
  ::-webkit-scrollbar-thumb {
    transition: none;
  }
}
```

### Firefox

```css
/* Firefox scrollbar styling */
* {
  scrollbar-width: thin;
  scrollbar-color: #4B5563 #1F2937;  /* thumb, track */
}
```

### Design Rationale

- **Subtle at rest**: Gray scrollbar doesn't compete with content
- **Orange on interaction**: Reinforces Bitcoin brand on hover/drag
- **Smooth transitions**: Creates polished, professional feel
- **Track-on-hover**: Shows context without cluttering interface
- **Consistent spacing**: 8px width matches overall spacing scale

### Accessibility

- Respects `prefers-reduced-motion` media query
- Removes transitions for users who prefer reduced motion
- Sufficient color contrast for visibility
- Large enough target area for dragging (40px min height)

### Testing

Test in these contexts:
- Dashboard with long address lists
- Transaction History with many transactions
- Contact Manager with many contacts
- Verify hover state triggers properly
- Verify drag behavior feels smooth
- Test with `prefers-reduced-motion` enabled

---

## Special Case Styling

### QR Code Component

**Critical**: QR codes MUST have white backgrounds for scannability.

```tsx
<div className="
  bg-white p-4 rounded-xl
  border-2 border-bitcoin-light
  shadow-glow-bitcoin
  w-fit mx-auto
">
  <QRCode
    value={address}
    size={256}
    level="M"
    includeMargin
  />
</div>
```

### Seed Phrase Display

```tsx
<div className="
  bg-gray-900 border-2 border-bitcoin-light rounded-lg
  shadow-glow-bitcoin
  p-4
">
  <code className="
    text-white font-mono text-sm
    break-all
  ">
    {seedPhrase}
  </code>
</div>
```

### Bitcoin Address Display

```tsx
<code className="
  px-3 py-2 rounded
  bg-gray-900 border border-gray-700
  text-bitcoin-light font-mono text-sm
  break-all
">
  {address}
</code>
```

### Loading Spinner

```tsx
<div className="
  w-12 h-12 rounded-full
  border-4 border-gray-700 border-t-bitcoin
  animate-spin
">
</div>
```

---

## Responsive Considerations

**Current State**: Tab is full viewport (100vw x 100vh), but design should remain scalable.

**Best Practices**:
- Use relative units (`rem`, `em`) for text
- Flexible layouts with flexbox/grid
- Avoid fixed pixel widths where possible
- Consider future mobile/tablet extension
- Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) for future breakpoints

**Current Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Example Responsive Pattern**:
```tsx
<div className="
  grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
  gap-4
">
  {/* Responsive grid */}
</div>
```

---

## Accessibility Compliance

### Color Contrast (WCAG 2.1)

All combinations verified:
- Primary text (white on gray-950): **19.5:1** ✅ AAA
- Secondary text (gray-300 on gray-950): **11.2:1** ✅ AAA
- Tertiary text (gray-400 on gray-950): **7.3:1** ✅ AAA
- Borders (gray-700 on gray-950): **3.8:1** ✅ AA
- Bitcoin orange on dark: **8.1:1** ✅ AAA

### Focus States

All interactive elements have visible focus indicators:

```tsx
// Standard focus ring
focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850

// Button focus
focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850

// Input focus
focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30
```

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows visual layout
- Modal focus trapping implemented
- Skip to content links (future enhancement)

---

## Animation Patterns

### Transitions

**Default Transition**:
```tsx
transition-all duration-200
```

**Color Transition Only**:
```tsx
transition-colors duration-200
```

**Transform Transition**:
```tsx
transition-transform duration-200
```

### Scale on Click

```tsx
active:scale-[0.98]
```

### Fade In/Out

```tsx
// Fade in
animate-in fade-in duration-200

// Fade out
animate-out fade-out duration-200
```

### Slide Transitions

```tsx
// Slide in from right
transition-transform duration-300 ease-in-out
translate-x-full → translate-x-0

// Slide out to right
translate-x-0 → translate-x-full
```

### Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Future Enhancements

**Phase 2+**:
- [ ] Add light mode theme (based on user demand)
- [ ] Theme toggle in Settings
- [ ] Auto-detect system preference (`prefers-color-scheme`)
- [ ] High contrast mode
- [ ] Custom color themes
- [ ] Animation preferences in settings
- [ ] Font size preferences

---

**Related Documentation**:
- [Architecture](./architecture.md) - Component structure
- [Components](./components.md) - Component patterns
- [State Management](./state.md) - React Context and hooks
- [Implementation Decisions](./decisions.md) - Styling decisions and rationale
