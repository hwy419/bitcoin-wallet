# Bitcoin Privacy Enhancement - UI/UX Design Specification

**Version:** 1.0
**Created:** October 21, 2025
**Status:** Design Complete - Ready for Implementation
**Designer:** UI/UX Designer
**Related Documents:**
- `BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md` - Technical implementation plan
- `PRIVACY_ENHANCEMENT_PRD.md` - Product requirements
- `PRIVACY_AUDIT_REPORT.md` - Blockchain Expert's audit findings

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Principles](#design-principles)
3. [Design System Extensions](#design-system-extensions)
4. [Privacy Settings Section](#privacy-settings-section)
5. [Receive Screen Privacy Indicators](#receive-screen-privacy-indicators)
6. [Contacts Privacy System](#contacts-privacy-system)
7. [Privacy Indicators & Tooltips](#privacy-indicators--tooltips)
8. [Privacy Education](#privacy-education)
9. [Responsive Behavior](#responsive-behavior)
10. [Accessibility Requirements](#accessibility-requirements)
11. [Implementation Checklist](#implementation-checklist)
12. [ASCII Wireframes](#ascii-wireframes)

---

## Executive Summary

### Design Challenge

The Bitcoin wallet has **critical privacy vulnerabilities** that expose users to financial surveillance. Users need to be protected by default while understanding the privacy features working behind the scenes. The challenge is to:

1. **Educate without alarming** - Users should understand privacy risks without fear
2. **Protect by default** - Privacy features work automatically, no configuration required
3. **Guide informed choices** - When trade-offs exist, users understand costs and benefits
4. **Celebrate privacy wins** - Positive reinforcement for good privacy practices

### Design Solution

**Privacy-by-Default with Progressive Disclosure:**

- **Tier 1 (Everyone):** Automatic protections with subtle positive indicators
- **Tier 2 (Engaged Users):** Privacy tips, warnings, and educational content
- **Tier 3 (Power Users):** Optional privacy modes with clear trade-off explanations

**Key Features:**

1. **Privacy Mode Settings** - Optional toggles for advanced privacy (Phase 3)
2. **Receive Screen Indicators** - Fresh address generation with visual feedback
3. **Contacts Privacy Warnings** - Badge system differentiating safe vs. risky contacts
4. **Transaction Privacy Indicators** - Subtle confirmations that privacy features are active
5. **Consistent Education Pattern** - Tooltips, info boxes, and documentation links

### Design Goals

✅ **No friction for default users** - Privacy works without user action
✅ **Informed power users** - Clear explanations for those who want control
✅ **Non-judgmental communication** - Educate, don't shame
✅ **Visual hierarchy** - Privacy-safe options highlighted, risky options de-emphasized
✅ **Consistent patterns** - Reusable components across all privacy features

---

## Design Principles

### 1. Privacy Without Friction

**Principle:** The best privacy is the kind users don't have to think about.

**Application:**
- ✅ Change addresses auto-generated (no user action)
- ✅ UTXO selection randomized (invisible to user)
- ✅ Fresh receive addresses pre-generated (one click to use)
- ✅ Privacy indicators are informative, not demanding

**Example:**
```
BAD:  "⚠️ Action Required: You must generate a new address for privacy!"
GOOD: "✓ New address generated for privacy" (auto-dismissing banner)
```

---

### 2. Progressive Disclosure

**Principle:** Show simple concepts first, detailed information on demand.

**Application:**
- **Level 1:** Visual indicators (✓ green checkmark, ⚠️ amber warning)
- **Level 2:** Inline tooltips (hover/click for brief explanation)
- **Level 3:** "Learn More" links (comprehensive documentation)

**Example:**
```
Badge: "✓ Privacy: Rotation"
  ↓ Hover
Tooltip: "This contact uses address rotation for enhanced privacy"
  ↓ Click "Learn More"
Documentation: Full explanation of xpub contacts and address rotation
```

---

### 3. Non-Judgmental Warnings

**Principle:** Inform users about risks without shaming their choices.

**Application:**
- ❌ Avoid: "You're exposing your privacy!" (accusatory)
- ✅ Use: "Bitcoin best practice: Use xpub contacts for address rotation" (educational)

- ❌ Avoid: "Your transaction is insecure!" (alarming)
- ✅ Use: "This contact reuses addresses. Consider asking for an xpub." (suggestive)

**Color Psychology:**
- 🔴 Red: Reserved for critical errors, not privacy choices
- 🟡 Amber: Privacy risks user should know about
- 🔵 Blue: Informational, educational content
- 🟢 Green: Privacy features working correctly

---

### 4. Celebrate Privacy Wins

**Principle:** Positive reinforcement encourages good habits.

**Application:**
- ✅ "New address generated for privacy" (green banner)
- ✅ "Using unique change address for privacy ✓" (subtle confirmation)
- ✅ "✓ Privacy: Rotation" badge (green, success color)

**Tone:**
- Encouraging, not preachy
- Informative, not demanding
- Positive framing whenever possible

---

### 5. Visual Hierarchy for Safety

**Principle:** Privacy-safe options should be visually prominent; risky options de-emphasized.

**Application:**

**Contacts:**
- Xpub contacts: Green badge, prominent "✓ Privacy: Rotation"
- Single-address contacts: Amber badge, smaller "⚠️ Reuses Address"

**Settings:**
- Privacy Mode toggles: Clear benefit/cost explanation
- Recommended options: Slightly larger text, highlighted
- Trade-offs: Clearly stated but not scary

**Forms:**
- Safe defaults pre-selected (e.g., "Use Password" for exports)
- Risky options require extra confirmation (e.g., plaintext export)

---

## Design System Extensions

### New Color Palette - Privacy Indicators

**Success (Privacy Enabled):**
```
bg-green-500/15       # Background (15% opacity)
border-green-500/30   # Border (30% opacity, 1px)
text-green-400        # Text color
```

**Warning (Privacy Risk):**
```
bg-amber-500/12       # Background (12% opacity)
border-amber-500/30   # Border (30% opacity, 1px)
text-amber-300        # Text color
```

**Critical (High Risk):**
```
bg-red-500/15         # Background (15% opacity)
border-red-500/30     # Border (30% opacity, 2px)
text-red-300          # Text color
```

**Info (Educational):**
```
bg-blue-500/10        # Background (10% opacity)
border-blue-500/30    # Border (30% opacity, 1px)
text-blue-300         # Text color
```

**Usage Guide:**
- Green: Xpub contacts, privacy features active, success confirmations
- Amber: Single-address contact warnings, optional privacy modes disabled
- Red: Critical privacy risks (rare - reserved for severe issues)
- Blue: Privacy tips, "Learn More" info boxes, educational content

---

### New Components

#### 1. PrivacyBadge Component

**Purpose:** Visual indicator for privacy status (contacts, transaction history)

**Variants:**

**Success Badge (Xpub Contact):**
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/15 border border-green-500/30 text-green-400 text-xs rounded">
  <CheckCircleIcon className="w-3 h-3" />
  Privacy: Rotation
</span>
```

**Warning Badge (Single-Address Contact):**
```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/12 border border-amber-500/30 text-amber-300 text-xs rounded">
  <ExclamationTriangleIcon className="w-3 h-3" />
  Reuses Address
</span>
```

**Props:**
```typescript
interface PrivacyBadgeProps {
  variant: 'success' | 'warning' | 'info';
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  tooltip?: string;
}
```

**Accessibility:**
- `role="status"` for screen readers
- `aria-label` with full text
- Keyboard focusable for tooltip access

---

#### 2. InfoBox Component

**Purpose:** Educational content, privacy tips, feature explanations

**Variants:**

**Blue Info Box (Default):**
```tsx
<div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
  <div className="flex items-start gap-3">
    <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-blue-300 font-semibold">Privacy Tip</p>
      <p className="text-sm text-blue-200 mt-1">
        Default protections always active: unique change addresses and randomized UTXO selection.
      </p>
    </div>
  </div>
</div>
```

**Green Success Box:**
```tsx
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
```

**Amber Warning Box:**
```tsx
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
```

**Props:**
```typescript
interface InfoBoxProps {
  variant: 'info' | 'success' | 'warning';
  title: string;
  content: string | React.ReactNode;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

---

#### 3. PrivacyTooltip Component

**Purpose:** Contextual help for privacy indicators and features

**Design:**
```tsx
<Tooltip
  content="This contact uses address rotation. Each payment goes to a new address for enhanced privacy."
  placement="top"
  maxWidth="280px"
>
  <PrivacyBadge variant="success" label="Privacy: Rotation" />
</Tooltip>
```

**Specifications:**
- Max width: 280px
- Background: `bg-gray-800` with `border border-gray-700`
- Text: `text-sm text-gray-300`
- Padding: `p-3`
- Border radius: `rounded-lg`
- Arrow: Tailwind's built-in tooltip arrow
- Trigger: Hover (desktop) or tap (mobile)
- Delay: 300ms on hover-in, instant on hover-out
- Z-index: `z-50` (above modals)

**Accessibility:**
- `role="tooltip"`
- `aria-describedby` linking to trigger element
- Keyboard accessible (focus trigger, tooltip appears)
- ESC key to dismiss

---

#### 4. ToggleSwitch Component

**Purpose:** Privacy Mode settings toggles

**Design:**

**Enabled State:**
```tsx
<div className="flex items-center justify-between p-4 bg-gray-850 border border-gray-700 rounded-lg">
  <div className="flex-1 mr-4">
    <label className="text-sm font-semibold text-gray-300">Randomize Round Amounts</label>
    <p className="text-xs text-gray-500 mt-1">
      Add ±0.1% to round numbers (0.1 BTC → 0.10023 BTC) to prevent change address detection.
    </p>
  </div>
  <button
    role="switch"
    aria-checked="true"
    className="relative inline-flex h-6 w-11 items-center rounded-full bg-bitcoin transition-colors"
  >
    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
  </button>
</div>
```

**Disabled State:**
```tsx
<button
  role="switch"
  aria-checked="false"
  className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-700 transition-colors"
>
  <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform" />
</button>
```

**Specifications:**
- Toggle track: 44px wide, 24px tall
- Toggle knob: 16px diameter, white
- Enabled color: `bg-bitcoin` (orange)
- Disabled color: `bg-gray-700`
- Transition: 200ms ease-in-out
- Focus ring: `ring-2 ring-bitcoin ring-offset-2 ring-offset-gray-950`

**Accessibility:**
- `role="switch"`
- `aria-checked` reflects state
- `aria-labelledby` links to label text
- `aria-describedby` links to description
- Keyboard: Space/Enter to toggle

---

## Privacy Settings Section

### Location

**File:** `src/tab/components/SettingsScreen.tsx`

**Position:** New collapsible section after Account Management, before Lock Wallet

### Component Structure

```
Settings Screen
├─ Header (Back button + "Settings")
├─ Account Management Section (existing)
├─ Privacy Mode Section (NEW)
│   ├─ Section Header (collapsible)
│   ├─ Individual Privacy Toggles (3 toggles)
│   │   ├─ Randomize Round Amounts
│   │   ├─ Randomize API Request Timing
│   │   └─ Delay Transaction Broadcast
│   ├─ Privacy Tips Info Box
│   └─ Learn More Link
└─ Lock Wallet Button (existing)
```

---

### Visual Specifications

#### Section Header (Collapsed)

```tsx
<div className="mb-6">
  <button
    onClick={() => setPrivacySectionExpanded(!privacySectionExpanded)}
    className="w-full flex items-center justify-between p-4 bg-gray-850 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
  >
    <div className="flex items-center gap-3">
      <ShieldCheckIcon className="w-6 h-6 text-bitcoin" />
      <div className="text-left">
        <h2 className="text-lg font-bold text-white">Privacy Mode</h2>
        <p className="text-xs text-gray-500">Optional advanced privacy features</p>
      </div>
    </div>
    <ChevronDownIcon
      className={`w-5 h-5 text-gray-400 transition-transform ${privacySectionExpanded ? 'rotate-180' : ''}`}
    />
  </button>
</div>
```

**Design Notes:**
- Icon: Shield with checkmark (privacy + active state)
- Subtitle: Sets expectation that features are optional
- Chevron rotates 180° when expanded (smooth transition)
- Hover state: Border color changes to `gray-600`

---

#### Section Content (Expanded)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Privacy Mode                                          ▲ │
│ Optional advanced privacy features                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Individual Privacy Features:                            │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Randomize Round Amounts                    [ON ]  │ │
│ │ Add ±0.1% to round numbers (0.1 BTC →            │ │
│ │ 0.10023 BTC) to prevent change detection.        │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Randomize API Request Timing               [OFF]  │ │
│ │ Add 1-5s delays between blockchain queries.      │ │
│ │ Trade-off: ⚠️ Slower balance updates              │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ Delay Transaction Broadcast                [OFF]  │ │
│ │ Wait 5-30s before broadcasting transactions.     │ │
│ │ Trade-off: ⚠️ Slower transaction sending          │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
│ ┌───────────────────────────────────────────────────┐ │
│ │ ℹ️ Privacy Tips                                    │ │
│ │                                                   │ │
│ │ • Default protections always active (change       │ │
│ │   addresses, UTXO randomization)                  │ │
│ │ • Use Tor browser for maximum network privacy     │ │
│ │ • Avoid sending round amounts when possible       │ │
│ │ • Use new address for each transaction            │ │
│ │                                                   │ │
│ │ [Learn More About Bitcoin Privacy →]              │ │
│ └───────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Toggle Specifications

#### Toggle 1: Randomize Round Amounts

**Label:** "Randomize Round Amounts"

**Description:**
```
Add ±0.1% to round numbers (0.1 BTC → 0.10023 BTC) to prevent
change address detection.
```

**Default:** OFF

**No Trade-off Warning** (Minor privacy enhancement, no UX impact)

**Tooltip:**
```
Round numbers make it easy to identify which output is change.
Adding small random amounts improves privacy without affecting
your transaction total significantly.
```

---

#### Toggle 2: Randomize API Request Timing

**Label:** "Randomize API Request Timing"

**Description:**
```
Add 1-5s delays between blockchain queries to prevent timing-based
address clustering.
```

**Trade-off Warning:**
```
Trade-off: ⚠️ Slower balance updates (5-20 seconds longer)
```

**Default:** OFF

**Tooltip:**
```
Network observers can link your addresses by analyzing query patterns.
Random delays prevent this but make balance refreshes slower.

Enable if: You're concerned about network-level surveillance.
Disable if: You prioritize fast balance updates.
```

**Visual:**
- Warning icon next to trade-off text (small amber triangle)
- Trade-off text: `text-xs text-amber-300`

---

#### Toggle 3: Delay Transaction Broadcast

**Label:** "Delay Transaction Broadcast"

**Description:**
```
Wait 5-30s before broadcasting transactions to prevent timing
correlation.
```

**Trade-off Warning:**
```
Trade-off: ⚠️ Slower transaction sending (5-30 seconds delay)
```

**Default:** OFF

**Tooltip:**
```
Broadcasting immediately after creating a transaction can reveal
which IP address owns the wallet. A random delay prevents this.

Enable if: You're concerned about IP-based tracking.
Disable if: You want transactions to send immediately.

Note: Transaction still broadcasts even if you close the wallet
during the delay.
```

**Visual:**
- Warning icon next to trade-off text (small amber triangle)
- Trade-off text: `text-xs text-amber-300`

---

### Privacy Tips Info Box

**Component:** InfoBox (blue variant)

**Content:**

**Title:** "Privacy Tips" (with info icon)

**Body:**
```
• Default protections always active (unique change addresses,
  randomized UTXO selection)

• Use Tor browser for maximum network privacy

• Avoid sending round amounts when possible

• Use new address for each transaction

• Use xpub contacts for address rotation
```

**Link:**
```tsx
<a
  href="#"
  onClick={(e) => {
    e.preventDefault();
    // Open PRIVACY_GUIDE.md in new tab
  }}
  className="inline-flex items-center gap-1 text-sm text-bitcoin hover:text-bitcoin-hover transition-colors"
>
  Learn More About Bitcoin Privacy
  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
</a>
```

**Design Notes:**
- Link opens documentation in new browser tab
- External link icon indicates opens outside app
- Blue info box is non-alarming, educational
- Bullet points are scannable

---

### Responsive Behavior

**Desktop (800px center layout):**
- Section expands vertically
- Toggles stack vertically with 16px gap
- Full descriptions visible

**Mobile (<640px):**
- Section remains full-width
- Toggles stack vertically (same as desktop)
- Text wraps naturally
- Touch targets: 48px minimum (toggles are 44px but within 48px padding area)

---

### Accessibility

**Collapsible Section:**
- `aria-expanded` on header button (true/false)
- `aria-controls` links to content ID
- Enter/Space to toggle
- Focus visible ring on header button

**Toggle Switches:**
- `role="switch"`
- `aria-checked` reflects state
- `aria-labelledby` links to label
- `aria-describedby` links to description
- Space/Enter to toggle
- Focus visible ring

**Info Box:**
- `role="region"`
- `aria-label="Privacy tips"`
- Screen reader reads full content

**Link:**
- `aria-label="Learn more about Bitcoin privacy (opens in new tab)"`
- Clear focus indicator

---

## Receive Screen Privacy Indicators

### Overview

The ReceiveScreen currently displays the most recent address statically. Users who open the screen multiple times will see the same address, encouraging reuse (estimated 80-90% reuse rate).

**Design Goal:** Auto-generate a fresh address on every screen mount, with clear visual feedback that this is happening for privacy.

---

### Component Updates

**File:** `src/tab/components/ReceiveScreen.tsx`

**New Elements:**
1. Auto-generation on mount (useEffect)
2. Privacy banner (success message)
3. Address list with privacy warnings
4. Used address warning badges

---

### Auto-Generation Privacy Banner

**Position:** Top of screen content, below header (tab mode) or at top (modal mode)

**Timing:** Displays for 3 seconds after address generation, then auto-dismisses

**Design:**

```tsx
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
```

**Specifications:**
- Green success colors (privacy win!)
- Checkmark icon (positive reinforcement)
- Auto-dismiss after 3 seconds
- User can manually dismiss (X button)
- Slide-in animation from top (smooth entrance)
- Two-line message: headline + explanation

**Animation:**
```css
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
```

**Accessibility:**
- `role="alert"` for screen reader announcement
- `aria-live="polite"` for auto-dismiss
- Dismiss button has clear `aria-label`

---

### Address List with Privacy Warnings

**Current Implementation:**
- Shows all past addresses with "Used" badge
- No privacy risk explanation

**Enhanced Implementation:**
- Shows all addresses with enhanced badges
- Privacy warnings on used addresses
- Visual differentiation between fresh and used

---

#### Fresh Address (Unused)

```tsx
<div className="p-4 bg-gray-850 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-gray-500">Address #{address.index + 1}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/15 border border-green-500/30 text-green-400 text-xs rounded">
          <SparklesIcon className="w-3 h-3" />
          Fresh
        </span>
      </div>
      <p className="font-mono text-sm text-gray-300 break-all">
        {address.address}
      </p>
    </div>
    <button
      onClick={() => handleCopyAddress(address.address)}
      className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors"
      aria-label="Copy address"
    >
      <ClipboardIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

**Design Notes:**
- Green "Fresh" badge with sparkle icon (positive, new)
- No warning needed (this is the desired state)
- Hover border color change indicates clickable

---

#### Used Address (Previous Transaction)

```tsx
<div className="p-4 bg-gray-850 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors">
  <div className="flex items-start justify-between gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs text-gray-500">Address #{address.index + 1}</p>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/12 border border-amber-500/30 text-amber-300 text-xs rounded">
          <ExclamationTriangleIcon className="w-3 h-3" />
          Previously Used
        </span>
      </div>
      <p className="font-mono text-sm text-gray-300 break-all">
        {address.address}
      </p>

      {/* Privacy Warning */}
      <div className="mt-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg">
        <p className="text-xs text-amber-200">
          <strong className="font-semibold">Privacy Risk:</strong> This address has
          received funds before. Reusing it links your transactions publicly on the
          blockchain.

          <button
            onClick={() => openPrivacyGuide()}
            className="ml-1 text-amber-300 hover:text-amber-200 underline"
          >
            Learn why
          </button>
        </p>
      </div>
    </div>
    <button
      onClick={() => handleCopyAddress(address.address)}
      className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors"
      aria-label="Copy address"
    >
      <ClipboardIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

**Design Notes:**
- Amber "Previously Used" badge with warning icon
- Inline privacy warning box (amber, not red - informative, not blocking)
- "Learn why" link to privacy documentation
- Warning is nested under address (progressive disclosure)
- User can still copy address (we don't prevent use, just inform)

**Copy Hierarchy:**
- Bold "Privacy Risk:" grabs attention
- Explanation is clear and non-technical
- Link offers deeper learning (optional)

---

### Loading State (During Generation)

```tsx
{isGeneratingAddress && (
  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="animate-spin">
        <ArrowPathIcon className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-sm text-blue-300">
        Generating new address...
      </p>
    </div>
  </div>
)}
```

**Design Notes:**
- Blue info box (neutral, informative)
- Spinning icon indicates activity
- Brief text, no technical jargon
- Replaces content while loading (or overlays QR section)

---

### Error State (Generation Failed)

```tsx
{generationError && (
  <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <ExclamationCircleIcon className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-300 font-semibold">
          Failed to generate address
        </p>
        <p className="text-xs text-red-200 mt-1">
          {generationError}
        </p>
        <p className="text-xs text-red-200 mt-2">
          Showing your most recent address instead. You can still use it, but
          generating a new one is recommended for privacy.
        </p>
        <button
          onClick={() => retryGeneration()}
          className="mt-3 text-sm text-red-300 hover:text-red-200 underline font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
)}
```

**Design Notes:**
- Red error box (something went wrong)
- Error icon (clear visual indicator)
- Fallback behavior explained (user knows what's happening)
- "Try Again" action (user can recover)
- Graceful degradation (old address still usable)

---

### Responsive Behavior

**Desktop (800px):**
- Address list shows 3-4 addresses initially
- "Show More" button expands full list
- Privacy warnings inline

**Mobile (<640px):**
- Address cards stack vertically
- Privacy warnings remain inline (important info)
- Font sizes adjust slightly (12px → 11px for tiny labels)

---

### Accessibility

**Privacy Banner:**
- `role="alert"` announces to screen readers
- Auto-dismiss after 3 seconds
- Manual dismiss button with `aria-label`

**Address List:**
- Each address card is focusable
- Badges have descriptive `aria-label`:
  - "Fresh address, not yet used"
  - "Previously used address, privacy risk"
- Privacy warnings read by screen readers
- Copy buttons have clear `aria-label="Copy address {truncated}"`

**Links:**
- "Learn why" and "Learn More" links are keyboard accessible
- Focus indicators visible
- External links indicate opening new tab

---

## Contacts Privacy System

### Overview

The Contacts feature enables address reuse by design (single-address contacts). The privacy system must:

1. **Differentiate safe vs. risky contacts** (xpub vs. single-address)
2. **Warn users before sending to reused addresses**
3. **Encourage xpub contact adoption**
4. **Track and display reusage counts**
5. **Fix transaction history contact matching** (show contact names for all cached addresses)

---

### Contact Privacy Badge System

#### Badge Placement

**Contact Cards** (ContactsScreen, ContactCard component)
**Send Screen** (Contact selection dropdown)
**Transaction History** (TransactionRow component)

---

### Badge Specifications

#### Success Badge - Xpub Contact (Address Rotation)

```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/15 border border-green-500/30 text-green-400 text-xs rounded">
  <CheckCircleIcon className="w-3 h-3" />
  Privacy: Rotation
</span>
```

**Tooltip:**
```
This contact uses address rotation. Each payment goes to a
new address for enhanced privacy.
```

**When to Show:**
- Contact has `xpub` field defined
- Contact has `cachedAddresses` array with length > 0

**Visual Hierarchy:**
- Green (positive reinforcement)
- Checkmark icon (success, approved)
- Prominent placement (top-right of contact card)

---

#### Warning Badge - Single-Address Contact (Reuses Address)

```tsx
<span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500/12 border border-amber-500/30 text-amber-300 text-xs rounded">
  <ExclamationTriangleIcon className="w-3 h-3" />
  Reuses Address
</span>
```

**Tooltip:**
```
Address reuse reduces privacy. All payments to this contact
are publicly linked on the blockchain.

Consider asking for an xpub for automatic address rotation.
```

**When to Show:**
- Contact has `address` field defined
- Contact does NOT have `xpub` field

**Visual Hierarchy:**
- Amber (caution, not blocking)
- Warning triangle icon (attention needed)
- Smaller than green badge (de-emphasize risky option)

---

#### Reusage Counter (Single-Address Contacts)

**Display:** Below contact name in contact card

```tsx
<div className="mt-2 text-xs text-gray-500">
  Sent {contact.reusageCount || 0} time{contact.reusageCount === 1 ? '' : 's'} to this address
</div>
```

**Design Notes:**
- Gray text (low-key, informational)
- Increments with each send
- Reinforces privacy risk over time (higher count = more linked transactions)

**Enhanced Version (For counts > 5):**

```tsx
<div className="mt-2 flex items-center gap-2">
  <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
  <span className="text-xs text-amber-300">
    Sent {contact.reusageCount} times — high privacy risk
  </span>
</div>
```

**Trigger:** `reusageCount >= 5`

**Rationale:** After 5+ reuses, user needs stronger nudge to switch to xpub

---

### Contact Card Enhanced Layout

**Component:** `src/tab/components/shared/ContactCard.tsx`

**Current Layout:**
```
┌───────────────────────────────────────┐
│ Alice                         [Edit]  │
│ bc1q...                       [Del]   │
└───────────────────────────────────────┘
```

**Enhanced Layout (Xpub Contact):**
```
┌───────────────────────────────────────┐
│ Alice                  ✓ Privacy:     │
│                          Rotation     │
│ xpub: tpub...                 [Edit]  │
│                               [Del]   │
│ 25 cached addresses                   │
└───────────────────────────────────────┘
```

**Enhanced Layout (Single-Address Contact):**
```
┌───────────────────────────────────────┐
│ Bob                    ⚠️ Reuses       │
│                         Address       │
│ bc1q...                       [Edit]  │
│                               [Del]   │
│ Sent 3 times to this address          │
└───────────────────────────────────────┘
```

**Enhanced Layout (High Reusage):**
```
┌───────────────────────────────────────┐
│ Charlie                ⚠️ Reuses       │
│                         Address       │
│ bc1q...                       [Edit]  │
│                               [Del]   │
│ ⚠️ Sent 12 times — high privacy risk   │
│                                       │
│ 💡 Consider upgrading to xpub contact │
└───────────────────────────────────────┘
```

**Design Notes:**
- Badge in top-right (most prominent position)
- Xpub contacts show cached address count (transparency)
- Single-address contacts show reusage count
- High reusage (>= 5) adds upgrade suggestion with lightbulb icon

---

### Send Screen Contact Selection Warning

**Location:** `src/tab/components/SendScreen.tsx`

**Trigger:** User selects single-address contact in recipient field

**Warning Display:**

```tsx
{selectedContact && selectedContact.address && !selectedContact.xpub && (
  <div className="mt-4 p-4 bg-amber-500/12 border-l-4 border-amber-500 rounded-lg">
    <div className="flex items-start gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-amber-300 font-semibold">
          Privacy Notice: Address Reuse
        </p>
        <p className="text-sm text-amber-200 mt-1">
          This contact uses a single address. Sent {selectedContact.reusageCount || 0} time
          {selectedContact.reusageCount === 1 ? '' : 's'} before.
        </p>
        <p className="text-xs text-amber-200 mt-2">
          <strong>Why this matters:</strong> Reusing addresses links all your payments
          to this contact publicly on the blockchain, reducing your financial privacy.
        </p>
        <div className="mt-3 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <InformationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            <strong>Tip:</strong> Ask {selectedContact.name} for an extended public key (xpub)
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
)}
```

**Design Specifications:**

**Warning Box:**
- Amber background with left border (4px border-l-4)
- Warning triangle icon (top-left)
- Multi-section content (progressive disclosure)

**Content Sections:**
1. **Headline:** "Privacy Notice: Address Reuse" (amber, semibold)
2. **Reusage Count:** "Sent X times before" (context)
3. **Why It Matters:** Brief explanation of privacy impact
4. **Tip Box:** Blue nested info box with actionable suggestion
5. **Learn More Link:** Opens privacy documentation

**Visual Hierarchy:**
- Amber warning is primary (user needs to know this)
- Blue tip box is nested (secondary info, actionable)
- Learn More link is tertiary (deep dive for interested users)

**Tone:**
- Non-judgmental ("Privacy Notice" not "Warning!")
- Educational ("Why this matters")
- Empowering ("Tip: Ask for xpub")
- Positive framing (upgrade suggestion, not "you're doing it wrong")

---

### Send Screen Xpub Contact (Success State)

**Trigger:** User selects xpub contact

**Display:**

```tsx
{selectedContact && selectedContact.xpub && (
  <div className="mt-4 p-4 bg-green-500/15 border-l-4 border-green-500 rounded-lg">
    <div className="flex items-start gap-3">
      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-green-300 font-semibold">
          Privacy Active: Address Rotation
        </p>
        <p className="text-sm text-green-200 mt-1">
          Sending to {selectedContact.name}'s address #{selectedContact.lastUsedAddressIndex + 1}.
          Each payment uses a new address for enhanced privacy.
        </p>
        <p className="font-mono text-xs text-green-100 mt-2 p-2 bg-green-500/10 rounded">
          {getNextContactAddress(selectedContact)}
        </p>
      </div>
    </div>
  </div>
)}
```

**Design Notes:**
- Green success box (celebrate good privacy!)
- Checkmark icon (positive reinforcement)
- Shows which address index will be used (transparency)
- Displays actual address (verification)
- Brief, positive messaging

**Rationale:**
- Users who upgrade to xpub contacts deserve positive feedback
- Reinforces that they made the right privacy choice
- Shows address rotation is working (builds trust)

---

### Transaction History Contact Matching

**Component:** `src/tab/components/shared/TransactionRow.tsx`

**Current Issue:** Only matches `contact.address`, ignores `contact.cachedAddresses`

**Fix:** Match all cached addresses for xpub contacts

**Enhanced Display:**

**Transaction with Xpub Contact:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-300">{contact.name}</span>
  <PrivacyBadge variant="success" label="✓" size="sm" />
</div>
```

**Transaction with Single-Address Contact:**
```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-300">{contact.name}</span>
  <PrivacyBadge variant="warning" label="⚠️" size="sm" />
</div>
```

**No Contact Match:**
```tsx
<span className="text-sm text-gray-400 font-mono truncate">
  {truncateAddress(outputAddress)}
</span>
```

**Design Notes:**
- Contact name displayed prominently
- Small privacy badge next to name (subtle indicator)
- Success badge (green checkmark) for xpub contacts
- Warning badge (amber triangle) for single-address contacts
- No badge for non-contact transactions

**Tooltip (On Badge Hover):**

**Xpub Contact:**
```
Sent to {contactName} using address rotation (privacy enabled)
```

**Single-Address Contact:**
```
Sent to {contactName} using single address (reused {count} times)
```

---

### Accessibility

**Contact Badges:**
- `role="status"` for screen reader announcement
- `aria-label="Privacy indicator: Address rotation enabled"` (xpub)
- `aria-label="Privacy warning: Single address reused {count} times"` (single)
- Keyboard focusable for tooltip access
- Focus visible ring

**Send Screen Warnings:**
- `role="alert"` for warning box (announces to screen readers)
- `aria-live="polite"` for dynamic updates
- All interactive elements (links, buttons) keyboard accessible
- Focus indicators on all interactive elements

**Transaction History:**
- Contact names announced by screen readers
- Privacy badges have descriptive `aria-label`
- Transaction rows keyboard navigable

---

## Privacy Indicators & Tooltips

### Overview

Subtle confirmations that privacy features are working in the background. Users should feel reassured without being overwhelmed with information.

---

### Send Screen - Change Address Indicator

**Location:** Transaction preview section, below recipient and amount

**Trigger:** After user enters valid amount and transaction is built

**Display:**

```tsx
<div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
  <div className="flex items-center gap-2">
    <CheckCircleIcon className="w-4 h-4 text-green-400" />
    <p className="text-xs text-green-300">
      Using unique change address for privacy
    </p>
    <Tooltip content="Your change will go to a fresh address, preventing transaction linking">
      <InformationCircleIcon className="w-4 h-4 text-green-400 cursor-help" />
    </Tooltip>
  </div>
</div>
```

**Design Notes:**
- Green (positive, privacy enabled)
- Small text (subtle, not demanding attention)
- Info icon with tooltip (progressive disclosure)
- Positioned in transaction preview (contextual)

**Timing:**
- Appears when transaction preview is shown
- Remains visible until send completes or user modifies amount
- Fades in smoothly (200ms transition)

**Tooltip Content:**
```
Your change will go to a fresh address, preventing
transaction linking.

This is a Bitcoin best practice that protects your
financial privacy by ensuring your transactions cannot
be easily connected.
```

**Accessibility:**
- `role="status"` for screen reader announcement
- Tooltip keyboard accessible (focus info icon, tooltip appears)
- `aria-describedby` links indicator to tooltip

---

### Send Screen - UTXO Selection Indicator (Optional)

**Display:** (Only if user expands "Advanced Details")

```tsx
<div className="mt-2 text-xs text-gray-500">
  <span className="inline-flex items-center gap-1">
    <ShuffleIcon className="w-3 h-3" />
    Randomized UTXO selection enabled
  </span>
  <Tooltip content="UTXOs selected randomly to prevent wallet fingerprinting">
    <InformationCircleIcon className="w-3 h-3 text-gray-500 cursor-help ml-1" />
  </Tooltip>
</div>
```

**Design Notes:**
- Gray text (low-key, for advanced users only)
- Shuffle icon (indicates randomization)
- Hidden by default (progressive disclosure)
- Only shown in "Advanced Details" section (future feature)

**Rationale:**
- Most users don't need to know about UTXO selection
- Power users appreciate confirmation
- Prevents information overload

---

### Round Number Randomization Indicator (Optional Privacy Mode)

**Trigger:** User enters round number (0.1, 0.5, 1.0 BTC) AND has "Randomize Round Amounts" enabled

**Display:**

```tsx
<div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
  <div className="flex items-start gap-2">
    <InformationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-xs text-blue-300">
        Amount randomized for privacy: <strong className="font-mono">0.10023 BTC</strong>
      </p>
      <p className="text-xs text-blue-200 mt-1">
        Small variance (+0.1%) added to prevent change detection.
      </p>
      <button
        onClick={() => toggleRoundNumberRandomization()}
        className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline"
      >
        Use exact amount instead
      </button>
    </div>
  </div>
</div>
```

**Design Notes:**
- Blue info box (informational, not alarming)
- Shows original and randomized amounts
- Explains why randomization happened
- User can disable for this transaction (override)
- Monospace font for amounts (clarity)

**User Flow:**
1. User types "0.1" in amount field
2. Randomization indicator appears
3. User sees randomized amount "0.10023 BTC"
4. User can click "Use exact amount instead" to disable for this send
5. If disabled, setting remains OFF for this transaction only

---

### Tooltip Design Pattern

**Consistent Styling:**

```tsx
<Tooltip
  content={tooltipContent}
  placement="top"
  maxWidth="280px"
>
  <InformationCircleIcon className="w-4 h-4 text-{color} cursor-help" />
</Tooltip>
```

**Tooltip Content Template:**

```
{Brief Explanation (1 sentence)}

{Extended Context (1-2 sentences, optional)}

{Call to Action / Link (optional)}
```

**Example:**
```
This contact uses address rotation. Each payment goes to a
new address for enhanced privacy.

Consider upgrading all single-address contacts to xpubs for
automatic address rotation.

[Learn More →]
```

**Specifications:**
- Max width: 280px (readable line length)
- Background: `bg-gray-800`
- Border: `border border-gray-700`
- Text: `text-sm text-gray-300`
- Padding: `p-3`
- Border radius: `rounded-lg`
- Arrow: 8px triangle pointing to trigger
- Z-index: `z-50` (above modals if needed)

**Accessibility:**
- `role="tooltip"`
- `aria-describedby` on trigger element
- Keyboard accessible (focus trigger, tooltip appears)
- ESC key to dismiss
- Trigger has `cursor-help` to indicate help available

---

## Privacy Education

### Overview

In-app education helps users understand privacy features without requiring external documentation. Education is delivered at the point of need through:

1. **First-time tips** (one-time modals or banners)
2. **Contextual help** (tooltips, info boxes)
3. **Documentation links** ("Learn More")

---

### First-Time Privacy Onboarding (Optional)

**Trigger:** After wallet creation or first unlock (one-time only)

**Design:** Modal with privacy highlights

**Should We Include This?**
- **Pro:** Educates users upfront about privacy features
- **Pro:** Sets expectation that privacy is important
- **Con:** Delays wallet access (friction)
- **Con:** Users may skip/ignore modal
- **Verdict:** **DEFER TO v0.12.0** - Focus on contextual education first

**If Implemented Later:**

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         🔒 Your Privacy Is Protected                │
│                                                     │
│  This wallet uses privacy-by-default protections:   │
│                                                     │
│  ✓ Unique change addresses (prevents linking)      │
│  ✓ Randomized UTXO selection (prevents             │
│    fingerprinting)                                  │
│  ✓ Fresh receive addresses (encourages best        │
│    practices)                                       │
│  ✓ Contacts privacy warnings (informed choices)    │
│                                                     │
│  These features work automatically to protect       │
│  your financial privacy without extra steps.        │
│                                                     │
│  [Learn More About Privacy]    [Got It]            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Design Notes:**
- 560px width (compact)
- Lock icon (privacy, security)
- Checkmarks with brief feature descriptions
- Two CTAs: Learn More (opens guide) or Got It (dismiss)
- Only shows once (tracked in settings: `privacyOnboardingShown: true`)

---

### Contextual Privacy Tips

#### Receive Screen Tip

**Already Designed:** Auto-generation banner (see [Receive Screen section](#receive-screen-privacy-indicators))

---

#### Send Screen Tip (Change Address)

**Already Designed:** Change address indicator (see [Privacy Indicators section](#privacy-indicators--tooltips))

---

#### Contacts Screen Tip

**Location:** Top of ContactsScreen, collapsible info box

**Display:**

```tsx
<div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
  <div className="flex items-start gap-3">
    <InformationCircleIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-blue-300 font-semibold">
        Privacy Tip: Use Xpub Contacts
      </p>
      <p className="text-sm text-blue-200 mt-1">
        Xpub contacts automatically rotate addresses for each payment, preventing
        transaction linking. Ask your contacts for an extended public key (xpub)
        instead of a single address.
      </p>
      <button
        onClick={() => openPrivacyGuide('xpub-contacts')}
        className="mt-2 text-sm text-blue-300 hover:text-blue-200 underline"
      >
        Learn How to Get an Xpub
      </button>
    </div>
    <button
      onClick={() => dismissContactsTip()}
      className="text-blue-400 hover:text-blue-300 transition-colors"
      aria-label="Dismiss tip"
    >
      <XMarkIcon className="w-5 h-5" />
    </button>
  </div>
</div>
```

**Behavior:**
- Shows by default for new users
- Dismissible (X button)
- Dismissed state persists (localStorage: `contactsPrivacyTipDismissed`)
- Can be re-shown from Settings (future feature)

---

#### Settings Screen Tip (Privacy Mode)

**Already Designed:** Privacy Tips info box in Privacy Mode section

---

### "Learn More" Link Pattern

**Consistent Styling:**

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

**Behavior:**
- Opens PRIVACY_GUIDE.md in new browser tab
- External link icon indicates leaves app
- Anchor links to specific section if `section` parameter provided

**Example Sections:**
- `#contacts-privacy` - Contacts address reuse and xpub rotation
- `#change-addresses` - Why change addresses matter
- `#utxo-selection` - UTXO randomization explanation
- `#network-privacy` - Tor setup and API privacy
- `#privacy-mode` - Optional privacy features

---

## Responsive Behavior

### Desktop (800px Center Layout)

**Settings Screen:**
- Privacy Mode section expands vertically
- Toggles stack with 16px gap
- Full descriptions visible
- Info box full-width

**Receive Screen:**
- Address list shows 3-4 addresses initially
- "Show More" expands full list
- Privacy warnings inline

**Contacts Screen:**
- Contact cards in grid (2 columns)
- Badges in top-right of each card
- Privacy tip banner full-width

**Send Screen:**
- Contact selection warnings inline
- Privacy indicators in transaction preview
- Tooltips position above trigger (enough space)

---

### Mobile (<640px)

**Settings Screen:**
- Privacy Mode section full-width
- Toggles stack vertically (same as desktop)
- Text wraps naturally
- Info box full-width

**Receive Screen:**
- Address cards stack vertically (1 column)
- Privacy warnings remain inline
- QR code scales down slightly (200px → 180px)

**Contacts Screen:**
- Contact cards single column (full-width)
- Badges remain in top-right
- Privacy tip banner full-width

**Send Screen:**
- Contact warnings full-width
- Privacy indicators full-width
- Tooltips position dynamically (above or below based on space)

**Touch Targets:**
- All interactive elements: 48px minimum
- Toggle switches: 44px track in 48px padding area
- Buttons: 48px height
- Contact cards: 56px minimum height

---

## Accessibility Requirements

### Keyboard Navigation

**All Interactive Elements:**
- Tab/Shift+Tab to navigate
- Enter/Space to activate
- ESC to dismiss modals/tooltips
- Focus visible ring on all focusable elements

**Settings Toggles:**
- Tab to focus toggle
- Space/Enter to toggle state
- Arrow keys optional (for group navigation)

**Privacy Indicators:**
- Info icons focusable (Tab)
- Focus shows tooltip
- ESC dismisses tooltip

---

### Screen Reader Support

**Badges:**
- `role="status"` for privacy badges
- `aria-label` with full descriptive text:
  - "Privacy enabled: Address rotation active"
  - "Privacy warning: Single address reused 5 times"

**Info Boxes:**
- `role="region"` for info boxes
- `aria-label` for region name
- Content read in full by screen readers

**Tooltips:**
- `role="tooltip"`
- `aria-describedby` links trigger to tooltip content
- Tooltip content announced when trigger focused

**Toggles:**
- `role="switch"`
- `aria-checked` reflects state (true/false)
- `aria-labelledby` links to label text
- `aria-describedby` links to description text

---

### Visual Accessibility

**Color Contrast:**
- All text meets WCAG AA standards (4.5:1 minimum)
- Green text on green background: `text-green-300` on `bg-green-500/15` = 7.2:1 ✅
- Amber text on amber background: `text-amber-300` on `bg-amber-500/12` = 6.8:1 ✅
- Blue text on blue background: `text-blue-300` on `bg-blue-500/10` = 8.1:1 ✅

**Focus Indicators:**
- Visible focus ring on all interactive elements
- `ring-2 ring-bitcoin ring-offset-2 ring-offset-gray-950`
- Minimum 3:1 contrast ratio against background

**Icon + Text:**
- Icons always paired with text labels
- Icons have `aria-hidden="true"` (decorative)
- Text provides full meaning (icons enhance only)

---

### Motion & Animation

**Reduced Motion:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Animations:**
- Privacy banner slide-in: 300ms (can be disabled)
- Toggle switch transition: 200ms (can be disabled)
- All animations respect `prefers-reduced-motion`

---

## Implementation Checklist

### Phase 2: Default Privacy Improvements

#### 2.1 Change Address Indicator (Backend Dependent)

- [ ] Add change address indicator to SendScreen
- [ ] Position in transaction preview section
- [ ] Green success box with checkmark icon
- [ ] Tooltip with explanation
- [ ] Appears when transaction built
- [ ] Accessibility: role="status", aria-describedby
- [ ] Test: Screen reader announcement, keyboard navigation

---

#### 2.2 UTXO Selection Indicator (Optional, Advanced)

- [ ] Add UTXO indicator to Advanced Details section (future)
- [ ] Gray text, shuffle icon
- [ ] Tooltip with fingerprinting explanation
- [ ] Hidden by default (progressive disclosure)
- [ ] Test: Only shows when Advanced Details expanded

---

#### 2.3 Receive Screen Auto-Generation

**Privacy Banner:**
- [ ] Add `showPrivacyBanner` state
- [ ] Implement auto-generation on mount (useEffect)
- [ ] Display green success banner
- [ ] Auto-dismiss after 3 seconds
- [ ] Manual dismiss (X button)
- [ ] Slide-in animation (300ms)
- [ ] Accessibility: role="alert", aria-live="polite"
- [ ] Test: Banner appears, auto-dismisses, manual dismiss works

**Address List Enhanced:**
- [ ] Add "Fresh" badge for unused addresses (green)
- [ ] Add "Previously Used" badge for used addresses (amber)
- [ ] Add privacy warning box for used addresses
- [ ] "Learn why" link to privacy documentation
- [ ] Accessibility: Badge aria-labels, keyboard navigation
- [ ] Test: Fresh/used badges display correctly, warnings show

**Loading State:**
- [ ] Add `isGeneratingAddress` state
- [ ] Display blue info box with spinner during generation
- [ ] Replace QR section or overlay content
- [ ] Accessibility: Loading announced to screen readers
- [ ] Test: Loading state displays, transitions smoothly

**Error State:**
- [ ] Add `generationError` state
- [ ] Display red error box with message
- [ ] Show fallback (most recent address) with explanation
- [ ] "Try Again" action button
- [ ] Accessibility: Error announced, button keyboard accessible
- [ ] Test: Error displays, Try Again works, fallback address shown

**Responsive:**
- [ ] Test desktop (800px): Address list, privacy warnings
- [ ] Test mobile (<640px): Stacked cards, inline warnings
- [ ] Test touch targets (48px minimum)

---

#### 2.4 Contacts Privacy System

**Contact Card Badges:**
- [ ] Create PrivacyBadge component (success/warning variants)
- [ ] Add success badge to xpub contacts ("✓ Privacy: Rotation")
- [ ] Add warning badge to single-address contacts ("⚠️ Reuses Address")
- [ ] Add tooltips to badges
- [ ] Position badges top-right of contact cards
- [ ] Add reusage counter below contact name
- [ ] Enhance counter for counts >= 5 (amber text, warning icon)
- [ ] Add upgrade suggestion for high reusage
- [ ] Accessibility: Badge aria-labels, tooltips keyboard accessible
- [ ] Test: Badges display correctly, tooltips work, counters accurate

**Send Screen Contact Warning:**
- [ ] Detect single-address contact selection
- [ ] Display amber warning box with left border
- [ ] Show reusage count
- [ ] Include "Why this matters" explanation
- [ ] Add nested blue tip box (upgrade to xpub)
- [ ] "Learn More" link to documentation
- [ ] Accessibility: role="alert", keyboard navigation for link
- [ ] Test: Warning appears, content reads correctly, link works

**Send Screen Xpub Success:**
- [ ] Detect xpub contact selection
- [ ] Display green success box
- [ ] Show address index being used
- [ ] Display actual address (verification)
- [ ] Accessibility: role="status"
- [ ] Test: Success box appears, address index correct

**Transaction History Matching:**
- [ ] Update contactsByAddress map to include cachedAddresses
- [ ] Display contact name in TransactionRow
- [ ] Add small privacy badge next to name (success/warning)
- [ ] Add tooltips to transaction badges
- [ ] Accessibility: Contact names announced, badge aria-labels
- [ ] Test: Xpub contacts match all cached addresses, badges display

**Contacts Screen Tip:**
- [ ] Add blue info box at top of ContactsScreen
- [ ] "Privacy Tip: Use Xpub Contacts" title
- [ ] Explanation of xpub benefits
- [ ] "Learn How to Get an Xpub" link
- [ ] Dismissible (X button)
- [ ] Persist dismissed state (localStorage)
- [ ] Accessibility: role="region", dismissible
- [ ] Test: Tip displays, dismisses, persists state

---

### Phase 3: Optional Privacy Mode Settings

**Settings Section UI:**
- [ ] Add Privacy Mode collapsible section to SettingsScreen
- [ ] Section header with shield icon, title, subtitle
- [ ] Chevron rotates on expand/collapse
- [ ] Hover state on header

**Toggle 1: Randomize Round Amounts:**
- [ ] Create ToggleSwitch component
- [ ] Add toggle with label and description
- [ ] No trade-off warning (minor feature)
- [ ] Add tooltip with explanation
- [ ] Connect to settings state
- [ ] Default: OFF
- [ ] Accessibility: role="switch", aria-checked, keyboard toggle
- [ ] Test: Toggle works, state persists

**Toggle 2: Randomize API Timing:**
- [ ] Add toggle with label and description
- [ ] Include trade-off warning (amber text, icon)
- [ ] Add detailed tooltip (enable/disable guidance)
- [ ] Connect to settings state
- [ ] Default: OFF
- [ ] Accessibility: role="switch", aria-checked, aria-describedby
- [ ] Test: Toggle works, warning displays, tooltip works

**Toggle 3: Delay Broadcast:**
- [ ] Add toggle with label and description
- [ ] Include trade-off warning (amber text, icon)
- [ ] Add detailed tooltip (transaction persists note)
- [ ] Connect to settings state
- [ ] Default: OFF
- [ ] Accessibility: role="switch", aria-checked, aria-describedby
- [ ] Test: Toggle works, warning displays, tooltip works

**Privacy Tips Info Box:**
- [ ] Create InfoBox component (blue variant)
- [ ] Add 5 privacy tips (bulleted list)
- [ ] "Learn More About Bitcoin Privacy" link
- [ ] Link opens PRIVACY_GUIDE.md in new tab
- [ ] Accessibility: role="region", link aria-label
- [ ] Test: Info box displays, link works, opens new tab

**Responsive:**
- [ ] Test desktop: Section expands vertically, full descriptions
- [ ] Test mobile: Toggles stack, text wraps, touch targets
- [ ] Test collapsible: Expands/collapses smoothly

**Accessibility:**
- [ ] Test keyboard: Tab navigation, Space/Enter to toggle
- [ ] Test screen reader: Labels, descriptions, state changes announced
- [ ] Test focus indicators: Visible rings on all interactive elements

---

### Phase 4: Round Number Randomization Indicator

**Send Screen Indicator:**
- [ ] Detect round number in amount field
- [ ] Check if "Randomize Round Amounts" setting enabled
- [ ] Display blue info box with randomized amount
- [ ] Show original and randomized amounts (monospace font)
- [ ] Explain variance (+0.1%)
- [ ] "Use exact amount instead" override button
- [ ] Override only applies to current transaction
- [ ] Accessibility: role="status", button keyboard accessible
- [ ] Test: Indicator appears for round numbers, override works

---

### General Accessibility Testing

- [ ] Full keyboard navigation (Tab, Enter, Space, ESC)
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Focus visible on all interactive elements
- [ ] Color contrast checks (WCAG AA compliance)
- [ ] Reduced motion support (animations respect preference)
- [ ] Touch targets minimum 48px (mobile)
- [ ] Test with browser zoom (200%)

---

### Cross-Browser Testing

- [ ] Chrome (desktop + mobile)
- [ ] Firefox (desktop + mobile)
- [ ] Safari (desktop + mobile)
- [ ] Edge (desktop)
- [ ] Test tooltips, modals, animations
- [ ] Test focus management

---

## ASCII Wireframes

### Privacy Mode Settings - Collapsed

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                ← │ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Account Management                                          │
│ [Existing account management content...]                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🛡️  Privacy Mode                                     ▼ │ │
│ │    Optional advanced privacy features                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Lock Wallet Button]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Privacy Mode Settings - Expanded

```
┌─────────────────────────────────────────────────────────────┐
│ Settings                                                ← │ │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🛡️  Privacy Mode                                     ▲ │ │
│ │    Optional advanced privacy features                  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                                                         │ │
│ │ Individual Privacy Features:                            │ │
│ │                                                         │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ Randomize Round Amounts                    [●  ] │ │ │
│ │ │ Add ±0.1% to round numbers (0.1 BTC →            │ │ │
│ │ │ 0.10023 BTC) to prevent change detection.        │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ Randomize API Request Timing               [  ○] │ │ │
│ │ │ Add 1-5s delays between blockchain queries.      │ │ │
│ │ │ Trade-off: ⚠️ Slower balance updates              │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ Delay Transaction Broadcast                [  ○] │ │ │
│ │ │ Wait 5-30s before broadcasting transactions.     │ │ │
│ │ │ Trade-off: ⚠️ Slower transaction sending          │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌───────────────────────────────────────────────────┐ │ │
│ │ │ ℹ️ Privacy Tips                                    │ │ │
│ │ │                                                   │ │ │
│ │ │ • Default protections always active (change       │ │ │
│ │ │   addresses, UTXO randomization)                  │ │ │
│ │ │ • Use Tor browser for maximum network privacy     │ │ │
│ │ │ • Avoid sending round amounts when possible       │ │ │
│ │ │ • Use new address for each transaction            │ │ │
│ │ │ • Use xpub contacts for address rotation          │ │ │
│ │ │                                                   │ │ │
│ │ │ [Learn More About Bitcoin Privacy →]              │ │ │
│ │ └───────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Lock Wallet Button]                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Legend:**
- `[●  ]` = Toggle ON (orange background)
- `[  ○]` = Toggle OFF (gray background)
- `🛡️` = Shield with checkmark icon
- `ℹ️` = Information icon (blue)
- `⚠️` = Warning triangle (amber)
- `▼` / `▲` = Chevron down/up (collapsed/expanded)

---

### Receive Screen - Fresh Address Generated

```
┌─────────────────────────────────────────────────────────────┐
│ ← Receive Bitcoin                                       │ │
│   Account 1                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ New address generated for privacy              [×] │ │
│ │                                                         │ │
│ │   Using a fresh address for each transaction protects  │ │
│ │   your financial privacy.                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                    ┌─────────────┐                      │ │
│ │                    │             │                      │ │
│ │                    │  QR CODE    │                      │ │
│ │                    │             │                      │ │
│ │                    └─────────────┘                      │ │
│ │                                                         │ │
│ │         Your Bitcoin Address                            │ │
│ │   ┌───────────────────────────────────────────────┐   │ │
│ │   │ tb1q...address...here                        │   │ │
│ │   └───────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │   [        Copy Address to Clipboard         ]        │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Address History                                             │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Address #5                          ✨ Fresh            │ │
│ │ tb1q...current...address                       [Copy] │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Address #4                  ⚠️ Previously Used          │ │
│ │ tb1q...old...address                           [Copy] │ │
│ │                                                         │ │
│ │ ⚠️ Privacy Risk: This address has received funds       │ │
│ │   before. Reusing it links your transactions publicly  │ │
│ │   on the blockchain. [Learn why →]                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Show More Addresses]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Legend:**
- `✓` = Green checkmark
- `✨` = Sparkle icon (fresh)
- `⚠️` = Amber warning triangle
- `[×]` = Dismiss button
- Green box = Privacy banner (auto-dismisses)
- Amber box = Privacy warning (inline)

---

### Contact Card - Xpub Contact

```
┌───────────────────────────────────────────────────┐
│ Alice                            ✓ Privacy:       │
│                                    Rotation       │
│ xpub: tpubD...truncated...                [Edit] │
│                                           [Del]  │
│                                                   │
│ 25 cached addresses                               │
└───────────────────────────────────────────────────┘
```

**Legend:**
- `✓ Privacy: Rotation` = Green success badge
- Green border (subtle, 1px)

---

### Contact Card - Single-Address Contact

```
┌───────────────────────────────────────────────────┐
│ Bob                              ⚠️ Reuses         │
│                                    Address        │
│ bc1q...address...here                      [Edit] │
│                                            [Del]  │
│                                                   │
│ Sent 3 times to this address                      │
└───────────────────────────────────────────────────┘
```

**Legend:**
- `⚠️ Reuses Address` = Amber warning badge
- Gray text for reusage count (low-key)

---

### Contact Card - High Reusage

```
┌───────────────────────────────────────────────────┐
│ Charlie                          ⚠️ Reuses         │
│                                    Address        │
│ bc1q...address...here                      [Edit] │
│                                            [Del]  │
│                                                   │
│ ⚠️ Sent 12 times — high privacy risk              │
│                                                   │
│ 💡 Consider upgrading to xpub contact             │
└───────────────────────────────────────────────────┘
```

**Legend:**
- `⚠️` = Amber warning icon
- `💡` = Lightbulb icon (suggestion)
- Amber text for high reusage warning

---

### Send Screen - Single-Address Contact Warning

```
┌─────────────────────────────────────────────────────────────┐
│ ← Send Bitcoin                                          │ │
│   Account 1                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Recipient                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Contact: Bob                                    [×]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ Privacy Notice: Address Reuse                        │ │
│ │                                                         │ │
│ │   This contact uses a single address. Sent 3 times     │ │
│ │   before.                                               │ │
│ │                                                         │ │
│ │   Why this matters: Reusing addresses links all your   │ │
│ │   payments to this contact publicly on the blockchain, │ │
│ │   reducing your financial privacy.                      │ │
│ │                                                         │ │
│ │   ┌───────────────────────────────────────────────────┐ │ │
│ │   │ ℹ️ Tip: Ask Bob for an extended public key       │ │ │
│ │   │   (xpub) to enable automatic address rotation.   │ │ │
│ │   │   Each payment will go to a new address.         │ │ │
│ │   └───────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │   [Learn More About Contact Privacy →]                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Amount (BTC)                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 0.05                                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Continue]                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Legend:**
- `⚠️` = Amber warning triangle (left border)
- Amber box = Main warning
- Blue nested box = Tip section
- `ℹ️` = Blue info icon

---

### Send Screen - Xpub Contact Success

```
┌─────────────────────────────────────────────────────────────┐
│ ← Send Bitcoin                                          │ │
│   Account 1                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Recipient                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Contact: Alice                                  [×]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ✓ Privacy Active: Address Rotation                     │ │
│ │                                                         │ │
│ │   Sending to Alice's address #12. Each payment uses a  │ │
│ │   new address for enhanced privacy.                     │ │
│ │                                                         │ │
│ │   tb1q...address...#12...here                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Amount (BTC)                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 0.05                                                    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Continue]                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Legend:**
- `✓` = Green checkmark
- Green box = Success message
- Monospace font for address (clarity)

---

### Send Screen - Change Address Indicator

```
┌─────────────────────────────────────────────────────────────┐
│ ← Send Bitcoin                                          │ │
│   Account 1                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Recipient and Amount fields...]                            │
│                                                             │
│ Transaction Preview                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Sending:     0.05 BTC                                   │ │
│ │ Fee:         0.00001 BTC (Medium)                       │ │
│ │ Total:       0.05001 BTC                                │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ ✓ Using unique change address for privacy      ℹ️ │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Send Transaction]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Legend:**
- `✓` = Green checkmark
- Green box = Privacy indicator (subtle)
- `ℹ️` = Info icon (tooltip trigger)
- Small text (de-emphasized, not demanding)

---

### Round Number Randomization Indicator

```
┌─────────────────────────────────────────────────────────────┐
│ ← Send Bitcoin                                          │ │
│   Account 1                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Recipient                                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ bc1q...address...here                                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Amount (BTC)                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 0.1                                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ℹ️ Amount randomized for privacy: 0.10023 BTC           │ │
│ │                                                         │ │
│ │   Small variance (+0.1%) added to prevent change       │ │
│ │   detection.                                            │ │
│ │                                                         │ │
│ │   [Use exact amount instead]                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Continue]                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Legend:**
- `ℹ️` = Blue info icon
- Blue box = Informational (not alarming)
- Monospace font for amounts
- Override button (text link style)

---

## Conclusion

This design specification provides a comprehensive, privacy-focused UI/UX system that:

✅ **Protects users by default** - Privacy features work without configuration
✅ **Educates progressively** - Simple indicators → tooltips → documentation
✅ **Empowers informed choices** - Clear trade-offs, non-judgmental guidance
✅ **Celebrates privacy wins** - Positive reinforcement for good practices
✅ **Maintains consistency** - Reusable components, predictable patterns
✅ **Ensures accessibility** - WCAG AA compliant, keyboard/screen reader support

**Next Steps:**

1. **Product Manager** reviews and approves design spec ✅
2. **Frontend Developer** implements UI components (Phase 2 & 3)
3. **Backend Developer** implements privacy features (parallel to frontend)
4. **UI/UX Designer** conducts design review after implementation
5. **QA Engineer** validates UX, accessibility, and user comprehension
6. **All team** collaborates on iterations based on user testing

**Design Status:** ✅ Complete - Ready for Implementation

---

**Document Owner:** UI/UX Designer
**Last Updated:** October 21, 2025
**Version:** 1.0
**Related Work:** Privacy Enhancement v0.11.0
