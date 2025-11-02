# Privacy Enhancement UI - Visual Reference Guide

**Version:** 1.0
**Created:** October 21, 2025
**Purpose:** Quick visual reference for implementing privacy UI components
**Related:** `PRIVACY_UI_UX_DESIGN_SPEC.md` (Complete specification)

---

## Quick Reference

### Color Palette

**Success (Privacy Enabled) - Green:**
```css
Background:  bg-green-500/15    /* rgba(34, 197, 94, 0.15) */
Border:      border-green-500/30 /* rgba(34, 197, 94, 0.30), 1px */
Text:        text-green-400      /* #4ade80 */
Icon:        text-green-400      /* #4ade80 */
```

**Example Usage:** Xpub contacts, privacy features active, success confirmations

---

**Warning (Privacy Risk) - Amber:**
```css
Background:  bg-amber-500/12     /* rgba(245, 158, 11, 0.12) */
Border:      border-amber-500/30  /* rgba(245, 158, 11, 0.30), 1px */
Text:        text-amber-300       /* #fcd34d */
Icon:        text-amber-300       /* #fcd34d */
```

**Example Usage:** Single-address contacts, address reuse warnings, optional modes disabled

---

**Critical (High Risk) - Red:**
```css
Background:  bg-red-500/15       /* rgba(239, 68, 68, 0.15) */
Border:      border-red-500/30    /* rgba(239, 68, 68, 0.30), 2px */
Text:        text-red-300         /* #fca5a5 */
Icon:        text-red-300         /* #fca5a5 */
```

**Example Usage:** Errors, critical privacy failures (rare)

---

**Info (Educational) - Blue:**
```css
Background:  bg-blue-500/10      /* rgba(59, 130, 246, 0.10) */
Border:      border-blue-500/30   /* rgba(59, 130, 246, 0.30), 1px */
Text:        text-blue-300        /* #93c5fd */
Icon:        text-blue-400        /* #60a5fa */
```

**Example Usage:** Privacy tips, educational content, informational messages

---

## Component Visual Examples

### PrivacyBadge - Success (Xpub Contact)

```
Visual:
┌─────────────────────────┐
│ ✓ Privacy: Rotation     │  ← Green background, 1px green border
└─────────────────────────┘

Code:
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/15 border border-green-500/30 text-green-400 text-xs rounded">
  <CheckCircleIcon className="w-3 h-3" />
  Privacy: Rotation
</span>

Colors:
- Background: rgba(34, 197, 94, 0.15) - 15% opacity green
- Border: rgba(34, 197, 94, 0.30) - 30% opacity green, 1px
- Text: #4ade80 - green-400
- Icon: 12px (w-3 h-3)
```

---

### PrivacyBadge - Warning (Single-Address)

```
Visual:
┌─────────────────────────┐
│ ⚠️ Reuses Address       │  ← Amber background, 1px amber border
└─────────────────────────┘

Code:
<span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/12 border border-amber-500/30 text-amber-300 text-xs rounded">
  <ExclamationTriangleIcon className="w-3 h-3" />
  Reuses Address
</span>

Colors:
- Background: rgba(245, 158, 11, 0.12) - 12% opacity amber
- Border: rgba(245, 158, 11, 0.30) - 30% opacity amber, 1px
- Text: #fcd34d - amber-300
- Icon: 12px (w-3 h-3)
```

---

### InfoBox - Success (Privacy Active)

```
Visual:
┌────────────────────────────────────────────────────────┐
│ ✓  Privacy Active                                      │
│                                                        │
│    New address generated for privacy. Each             │
│    transaction uses a unique address.                  │
└────────────────────────────────────────────────────────┘
   ↑ Green background, green border

Code:
<div className="p-4 bg-green-500/15 border border-green-500/30 rounded-lg">
  <div className="flex items-start gap-3">
    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-green-300 font-semibold">Privacy Active</p>
      <p className="text-sm text-green-200 mt-1">
        New address generated for privacy. Each transaction uses a unique address.
      </p>
    </div>
  </div>
</div>

Dimensions:
- Padding: 16px all sides (p-4)
- Icon: 20px (w-5 h-5), flex-shrink-0 to prevent squishing
- Gap between icon and text: 12px (gap-3)
- Title: 14px semibold green-300
- Content: 14px green-200, 4px margin-top
```

---

### InfoBox - Warning (Privacy Risk)

```
Visual:
┌────────────────────────────────────────────────────────┐
│ ⚠️  Privacy Notice                                     │
│                                                        │
│    This contact uses a single address. Reusing        │
│    addresses reduces privacy.                          │
└────────────────────────────────────────────────────────┘
   ↑ Amber background, amber border

Code:
<div className="p-4 bg-amber-500/12 border border-amber-500/30 rounded-lg">
  <div className="flex items-start gap-3">
    <ExclamationTriangleIcon className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-amber-300 font-semibold">Privacy Notice</p>
      <p className="text-sm text-amber-200 mt-1">
        This contact uses a single address. Reusing addresses reduces privacy.
      </p>
    </div>
  </div>
</div>

Colors:
- Background: rgba(245, 158, 11, 0.12)
- Border: rgba(245, 158, 11, 0.30), 1px
- Title text: #fcd34d (amber-300)
- Content text: #fde68a (amber-200)
```

---

### InfoBox - Info (Educational)

```
Visual:
┌────────────────────────────────────────────────────────┐
│ ℹ️  Privacy Tips                                       │
│                                                        │
│    • Default protections always active                 │
│    • Use Tor browser for maximum privacy               │
│    • Use new address for each transaction              │
│                                                        │
│    [Learn More About Bitcoin Privacy →]                │
└────────────────────────────────────────────────────────┘
   ↑ Blue background, blue border

Code:
<div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
  <div className="flex items-start gap-3">
    <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-blue-300 font-semibold">Privacy Tips</p>
      <ul className="text-sm text-blue-200 mt-2 space-y-1 list-disc list-inside">
        <li>Default protections always active</li>
        <li>Use Tor browser for maximum privacy</li>
        <li>Use new address for each transaction</li>
      </ul>
      <a href="#" className="inline-flex items-center gap-1 text-sm text-bitcoin hover:text-bitcoin-hover transition-colors mt-3">
        Learn More About Bitcoin Privacy
        <ArrowTopRightOnSquareIcon className="w-4 h-4" />
      </a>
    </div>
  </div>
</div>

Colors:
- Background: rgba(59, 130, 246, 0.10)
- Border: rgba(59, 130, 246, 0.30), 1px
- Title text: #93c5fd (blue-300)
- Content text: #bfdbfe (blue-200)
- Link: Bitcoin orange (#f7931a)
```

---

### ToggleSwitch - Enabled (ON)

```
Visual:
   ┌──────────────┐
   │      ● ──────│  ← Orange background, knob on right
   └──────────────┘

Code:
<button
  role="switch"
  aria-checked="true"
  className="relative inline-flex h-6 w-11 items-center rounded-full bg-bitcoin transition-colors focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-950"
>
  <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
</button>

Dimensions:
- Track: 44px wide (w-11), 24px tall (h-6)
- Knob: 16px diameter (w-4 h-4), white
- Knob position (ON): translateX(24px) - translate-x-6
- Background color (ON): Bitcoin orange (#f7931a)
- Border radius: full (rounded-full)
- Transition: 200ms ease-in-out (transition-colors, transition-transform)
```

---

### ToggleSwitch - Disabled (OFF)

```
Visual:
   ┌──────────────┐
   │ ●────────────│  ← Gray background, knob on left
   └──────────────┘

Code:
<button
  role="switch"
  aria-checked="false"
  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-950"
>
  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
</button>

Dimensions:
- Track: 44px wide (w-11), 24px tall (h-6)
- Knob: 16px diameter (w-4 h-4), white
- Knob position (OFF): translateX(4px) - translate-x-1
- Background color (OFF): Gray (#374151 - gray-700)
- Border radius: full (rounded-full)
```

---

### Privacy Banner (Auto-Dismiss)

```
Visual:
┌────────────────────────────────────────────────────────┐
│ ✓  New address generated for privacy             [×] │
│                                                        │
│    Using a fresh address for each transaction         │
│    protects your financial privacy.                    │
└────────────────────────────────────────────────────────┘
   ↑ Green background, green border, slide-in from top

Code:
{showPrivacyBanner && (
  <div className="mb-6 p-4 bg-green-500/15 border border-green-500/30 rounded-lg animate-slideInFromTop">
    <div className="flex items-center gap-3">
      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-green-300 font-semibold">
          New address generated for privacy
        </p>
        <p className="text-xs text-green-200 mt-1">
          Using a fresh address for each transaction protects your financial privacy.
        </p>
      </div>
      <button
        onClick={() => setShowPrivacyBanner(false)}
        className="text-green-400 hover:text-green-300 transition-colors"
        aria-label="Dismiss"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
)}

Animation:
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideInFromTop {
  animation: slideInFromTop 300ms ease-out;
}

Behavior:
- Shows on component mount (after address generation)
- Auto-dismisses after 3 seconds (setTimeout)
- User can manually dismiss (X button)
- role="alert" for screen reader announcement
```

---

### Warning Box with Left Border (Contact Warning)

```
Visual:
┌────────────────────────────────────────────────────────┐
║ ⚠️  Privacy Notice: Address Reuse                     │
║                                                        │
║    This contact uses a single address. Sent 3 times   │
║    before.                                             │
║                                                        │
║    Why this matters: Reusing addresses links all      │
║    your payments to this contact publicly on the      │
║    blockchain, reducing your financial privacy.        │
║                                                        │
║    ┌──────────────────────────────────────────────┐  │
║    │ ℹ️ Tip: Ask Bob for an extended public key   │  │
║    │   (xpub) to enable automatic address          │  │
║    │   rotation. Each payment will go to a new     │  │
║    │   address.                                     │  │
║    └──────────────────────────────────────────────┘  │
║                                                        │
║    [Learn More About Contact Privacy →]               │
└────────────────────────────────────────────────────────┘
 ↑ 4px amber left border

Code:
<div className="mt-4 p-4 bg-amber-500/12 border-l-4 border-amber-500 rounded-lg">
  <div className="flex items-start gap-3">
    <ExclamationTriangleIcon className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-amber-300 font-semibold">
        Privacy Notice: Address Reuse
      </p>
      <p className="text-sm text-amber-200 mt-1">
        This contact uses a single address. Sent {reusageCount} time{reusageCount === 1 ? '' : 's'} before.
      </p>
      <p className="text-xs text-amber-200 mt-2">
        <strong>Why this matters:</strong> Reusing addresses links all your payments
        to this contact publicly on the blockchain, reducing your financial privacy.
      </p>
      <div className="mt-3 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <InformationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-300">
          <strong>Tip:</strong> Ask {contactName} for an extended public key (xpub)
          to enable automatic address rotation. Each payment will go to a new address.
        </p>
      </div>
      <button
        onClick={() => openPrivacyGuide('contacts-privacy')}
        className="mt-3 text-sm text-amber-300 hover:text-amber-200 underline font-semibold"
      >
        Learn More About Contact Privacy
      </button>
    </div>
  </div>
</div>

Key Features:
- 4px left border (border-l-4) in solid amber (#f59e0b)
- Background: rgba(245, 158, 11, 0.12)
- Multi-section content (headline, reusage, explanation, nested tip, link)
- Nested blue info box (nested progressive disclosure)
- Bold key terms: "Why this matters:", "Tip:"
```

---

## Typography Scale

```
Component Text Sizes:

Badge text:        text-xs     12px   leading-4  (16px line-height)
Info box title:    text-sm     14px   leading-5  (20px line-height) + font-semibold
Info box content:  text-sm     14px   leading-5  (20px line-height)
Privacy tips:      text-sm     14px   leading-5  (20px line-height)
Toggle label:      text-sm     14px   leading-5  (20px line-height) + font-semibold
Toggle desc:       text-xs     12px   leading-4  (16px line-height)
Banner title:      text-sm     14px   leading-5  (20px line-height) + font-semibold
Banner subtitle:   text-xs     12px   leading-4  (16px line-height)

Monospace (addresses, amounts):
font-mono, text-sm (14px)

Link text:
text-sm (14px), text-bitcoin (#f7931a), hover:text-bitcoin-hover, underline
```

---

## Icon Sizes

```
Small badges:      w-3 h-3     12×12px
Info box icons:    w-5 h-5     20×20px
Toggle close:      w-5 h-5     20×20px
Section icons:     w-6 h-6     24×24px
External link:     w-4 h-4     16×16px

Positioning:
flex-shrink-0      Prevents icon from shrinking
mt-0.5             Aligns top with first line of text (2px offset)
```

---

## Spacing Reference

```
Section gaps:          space-y-6    24px vertical gap
Toggle stack:          space-y-4    16px vertical gap
Info box padding:      p-4          16px all sides
Badge padding:         px-2 py-1    8px horizontal, 4px vertical
Warning box padding:   p-4          16px all sides
Nested box padding:    p-3          12px all sides
Content gap:           gap-3        12px (flex gap)
Small gap:             gap-2        8px (flex gap)
Tiny gap:              gap-1        4px (flex gap)

Margin utilities:
mt-1: 4px top margin
mt-2: 8px top margin
mt-3: 12px top margin
mt-4: 16px top margin
mb-6: 24px bottom margin
```

---

## Responsive Breakpoints

```
Mobile:      < 640px    (default, stack vertically)
Tablet:      640-800px  (md: prefix)
Desktop:     >= 800px   (lg: prefix)

Touch targets (mobile):
Minimum 48×48px for all interactive elements

Settings toggles:
- Track: 44×24px (within 48px touch area via padding)
- Full toggle container with label: 64px height minimum

Buttons:
- Height: 48px (py-3 px-6)
- Active state: scale-[0.98] for touch feedback
```

---

## Animation Timings

```
Banner slide-in:         300ms ease-out
Toggle switch:           200ms ease-in-out
Chevron rotation:        200ms ease
Tooltip appear:          300ms delay on hover-in, instant on hover-out
Auto-dismiss banner:     3000ms (3 seconds)

Reduced Motion:
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility Checklist

**Every Component Must Have:**
- [ ] Proper ARIA role (role="status", role="switch", role="tooltip", etc.)
- [ ] Descriptive aria-label or aria-labelledby
- [ ] aria-describedby for complex components
- [ ] Keyboard navigation support (Tab, Enter, Space, ESC)
- [ ] Focus visible ring (ring-2 ring-bitcoin ring-offset-2)
- [ ] Color contrast >= 4.5:1 (WCAG AA)
- [ ] Icon + text (never icon alone)
- [ ] Screen reader announcements for dynamic content
- [ ] Touch targets >= 48×48px (mobile)

**Focus Ring Pattern:**
```css
focus:outline-none
focus:ring-2
focus:ring-bitcoin
focus:ring-offset-2
focus:ring-offset-gray-950
```

---

## Common Patterns

### "Learn More" Link

```tsx
<a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    openPrivacyGuide(section);
  }}
  className="inline-flex items-center gap-1 text-sm text-bitcoin hover:text-bitcoin-hover transition-colors"
>
  Learn More About {topic}
  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
</a>
```

---

### Dismissible Info Box

```tsx
const [showTip, setShowTip] = useState(true);

{showTip && (
  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-blue-300 font-semibold">Privacy Tip</p>
        <p className="text-sm text-blue-200 mt-1">
          {content}
        </p>
      </div>
      <button
        onClick={() => setShowTip(false)}
        className="text-blue-400 hover:text-blue-300 transition-colors"
        aria-label="Dismiss tip"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
)}
```

---

### Tooltip with Icon

```tsx
<Tooltip
  content="This contact uses address rotation. Each payment goes to a new address for enhanced privacy."
  placement="top"
  maxWidth="280px"
>
  <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-gray-300 cursor-help" />
</Tooltip>
```

---

## Color Contrast Ratios (WCAG AA Compliance)

```
Success (Green):
- text-green-400 (#4ade80) on bg-green-500/15: 7.2:1 ✅
- text-green-300 (#86efac) on bg-green-500/15: 9.1:1 ✅
- text-green-200 (#bbf7d0) on bg-green-500/15: 12.3:1 ✅

Warning (Amber):
- text-amber-300 (#fcd34d) on bg-amber-500/12: 6.8:1 ✅
- text-amber-200 (#fde68a) on bg-amber-500/12: 9.5:1 ✅

Info (Blue):
- text-blue-400 (#60a5fa) on bg-blue-500/10: 8.1:1 ✅
- text-blue-300 (#93c5fd) on bg-blue-500/10: 10.2:1 ✅
- text-blue-200 (#bfdbfe) on bg-blue-500/10: 13.1:1 ✅

Critical (Red):
- text-red-300 (#fca5a5) on bg-red-500/15: 6.5:1 ✅

All combinations meet WCAG AA standard (4.5:1 minimum)
```

---

## Implementation Priority

**Phase 2 (Default Privacy) - Implement First:**
1. PrivacyBadge component (success/warning)
2. InfoBox component (success/warning/info)
3. Receive screen banner + address list badges
4. Contact card badges
5. Send screen contact warnings

**Phase 3 (Optional Privacy Mode) - Implement Second:**
1. ToggleSwitch component
2. Privacy Mode section in Settings
3. Privacy tips info box
4. Round number randomization indicator

**Accessibility - Test Throughout:**
1. Keyboard navigation
2. Screen reader support
3. Color contrast
4. Touch targets
5. Focus indicators

---

**Document Status:** ✅ Complete - Quick Visual Reference

**Related Documentation:**
- Complete specification: `PRIVACY_UI_UX_DESIGN_SPEC.md`
- Implementation checklist: See spec document
- ASCII wireframes: See spec document

**Last Updated:** October 21, 2025
