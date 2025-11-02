# Multisig Wizard Full-Tab Design Specification

**Date:** October 13, 2025
**Designer:** UI/UX Designer
**Status:** ✅ Design Complete and Validated (Reviewed October 18, 2025)
**Implementation Status:** ✅ Implemented in v0.9.0

---

## Design Consistency Note (Added October 18, 2025)

This multisig wizard design uses an **800px centered layout** that is consistent with other tab-based forms in the Bitcoin Wallet extension, specifically the new account management modals. While the wizard uses a **full-tab experience** (no backdrop), account creation/import modals use **modal overlays** (with backdrop blur) - both patterns are complementary and appropriate for their respective use cases.

**Related Design Specifications:**
- `ACCOUNT_MANAGEMENT_DESIGN_SPEC.md` - Modal-based forms (same 800px width, different presentation)
- Main tab architecture - Sidebar (240px) + Content area pattern
- See `ui-ux-designer-notes.md` for complete design system

**Design Pattern Choice:**
- **Multisig Wizard**: Full-tab (multi-step, 5-10 minutes, stays open during co-signer coordination)
- **Account Modals**: Overlay (single form, 1-2 minutes, quick interaction)
- **Both**: Share 800px width, same color palette, typography, and spacing

---

## Table of Contents
1. [Overview](#overview)
2. [Design Decisions](#design-decisions)
3. [Layout Specifications](#layout-specifications)
4. [Entry Point Design](#entry-point-design)
5. [Tab-Specific UI Elements](#tab-specific-ui-elements)
6. [Responsive Considerations](#responsive-considerations)
7. [User Flows](#user-flows)
8. [Component Specifications](#component-specifications)
9. [Implementation Notes](#implementation-notes)

---

## 1. Overview

### Problem Statement
The multisig account creation wizard requires significant screen space for QR codes, multiple xpub inputs, and address verification. The current 600x400px popup is too constrained, leading to:
- Excessive scrolling through 7-step wizard
- Cramped QR code display (small, hard to scan)
- Difficult co-signer xpub management
- Poor address verification UX

### Solution
Open wizard in a full browser tab while maintaining visual consistency with the extension's design system.

### Design Goals
1. **Spacious Layout**: Utilize additional screen space for better information display
2. **Extension Identity**: Maintain clear visual connection to Bitcoin Wallet extension
3. **Consistency**: Use identical design system (colors, typography, spacing)
4. **Focus**: Minimize distractions, keep user focused on wizard steps
5. **Professional**: Convey trust and security for sensitive multisig setup

---

## 2. Design Decisions

### Decision 1: Centered Content Width
**Choice:** Fixed-width content container (800px max-width), centered on screen

**Rationale:**
- Prevents overwhelming wide layouts on large monitors
- Maintains familiar width progression: popup (600px) → tab (800px)
- Optimal reading width for text content (50-75 characters per line)
- Centers user attention on the wizard, not screen edges
- Professional, modern web app aesthetic

**Alternatives Considered:**
- ❌ **Full-width responsive**: Too wide on large screens, content spreads thin
- ❌ **Keep 600px width**: Doesn't justify opening new tab
- ✅ **800px fixed**: Sweet spot between spacious and focused

### Decision 2: Persistent Header with Extension Identity
**Choice:** Fixed header at top with logo, extension name, and context

**Rationale:**
- Users need constant reminder this is extension-controlled tab
- Prevents confusion with standalone websites
- Provides consistent navigation (back to extension)
- Professional branding throughout multi-step process

### Decision 3: Minimal Chrome, Maximum Focus
**Choice:** Remove all secondary navigation, focus only on wizard

**Rationale:**
- Wizard is a goal-oriented task with linear progression
- Distractions increase abandonment rate
- Security-critical process requires user focus
- Similar to checkout flows in e-commerce

### Decision 4: Tab Closes on Completion
**Choice:** Show success message, then auto-close tab after 3 seconds (with manual close option)

**Rationale:**
- Reduces friction - user doesn't need to remember to close tab
- Clear end state - wizard is complete
- Returns user to extension popup automatically
- Similar to OAuth flows

---

## 3. Layout Specifications

### 3.1 Overall Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ FIXED HEADER (80px tall)                                     │
│ Logo + Extension Name + Help                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                   (margin: auto - centered)                   │
│                                                               │
│   ┌───────────────────────────────────────────────────┐     │
│   │                                                     │     │
│   │         CONTENT CONTAINER (max-width: 800px)       │     │
│   │         min-height: calc(100vh - 80px - 100px)     │     │
│   │                                                     │     │
│   │   ┌─────────────────────────────────────────┐     │     │
│   │   │ PROGRESS INDICATOR (120px tall)         │     │     │
│   │   │ Step 3 of 7 - Export Xpub               │     │     │
│   │   └─────────────────────────────────────────┘     │     │
│   │                                                     │     │
│   │   ┌─────────────────────────────────────────┐     │     │
│   │   │                                           │     │     │
│   │   │        WIZARD STEP CONTENT               │     │     │
│   │   │        (scrollable if needed)            │     │     │
│   │   │                                           │     │     │
│   │   │                                           │     │     │
│   │   └─────────────────────────────────────────┘     │     │
│   │                                                     │     │
│   │   ┌─────────────────────────────────────────┐     │     │
│   │   │ FOOTER (100px tall, sticky bottom)      │     │     │
│   │   │ [Back/Cancel]    [Next/Create] →        │     │     │
│   │   └─────────────────────────────────────────┘     │     │
│   │                                                     │     │
│   └───────────────────────────────────────────────────┘     │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Spacing & Measurements

**Page Layout:**
```
Body Background:        #0F0F0F (gray-950)
Content Max Width:      800px
Content Horizontal Padding: 48px (desktop), 24px (tablet), 16px (mobile)
Header Height:          80px
Footer Height:          100px
Progress Indicator:     120px tall
```

**Content Container:**
```
Max Width:              800px
Margin:                 0 auto (centered)
Background:             #1A1A1A (gray-900) - subtle elevation
Border:                 None (seamless with body)
Border Radius:          0 (full-height container)
Padding:                32px 48px
Min Height:             calc(100vh - 80px) // Ensure footer at bottom
```

**Breakpoints:**
```
Desktop:    1200px+     // Full 800px content width
Laptop:     1024-1199px // 800px content, tight margins
Tablet:     768-1023px  // 720px content, reduced padding
Mobile:     < 768px     // 100% width, minimal padding
```

### 3.3 Fixed Header Design

```
┌────────────────────────────────────────────────────────────────┐
│  [Logo]  Bitcoin Wallet   │   Create Multisig Account   │ [?] │
│   (48x48)                  │        (breadcrumb)         │     │
└────────────────────────────────────────────────────────────────┘
```

**Header Specifications:**
```css
Height:             80px
Background:         #1A1A1A (gray-900)
Border Bottom:      1px solid #2E2E2E (gray-750)
Padding:            0 48px
Display:            Flex, align-items: center, justify-content: space-between
Position:           Sticky, top: 0
Z-Index:            100
Box Shadow:         0 2px 8px rgba(0,0,0,0.4) // Subtle depth
```

**Header Left Section:**
```
Logo Icon:          48x48px Bitcoin logo (orange #F7931A on dark circle)
Extension Name:     "Bitcoin Wallet" - 18px, Semibold, #FFFFFF
Separator:          1px tall × 24px, vertical line, #3A3A3A, margin: 0 24px
Page Context:       "Create Multisig Account" - 16px, Regular, #B4B4B4
```

**Header Right Section:**
```
Help Button:        44x44px icon button
                    Question mark icon, 20px
                    Color: #808080, Hover: #FFFFFF
                    Background: Transparent, Hover: #2E2E2E
                    Border Radius: 8px
                    Tooltip: "Help & Guidance"
```

**Close Tab Indicator:**
```
// Optional: Add subtle "You can close this tab anytime" text
Text:               "Close tab to cancel" - 14px, #4A4A4A
Position:           Far right, before help button
Icon:               Small X icon, 16px, #4A4A4A
```

### 3.4 Progress Indicator (Enhanced)

**Visual Design:**
```
Height:             120px
Background:         Transparent (within content container)
Padding:            32px 0
Margin Bottom:      32px
```

**Step Counter Display:**
```
Position:           Top center
Text:               "Step 3 of 7" - 14px, Medium, #B4B4B4
Margin Bottom:      16px
Letter Spacing:     0.05em (slightly tracked)
```

**Progress Bar:**
```
Width:              100%
Height:             6px (thicker than popup version)
Background:         #2E2E2E (gray-750)
Border Radius:      Full (3px)
Margin Bottom:      24px

Fill:
- Background:       Linear gradient: #F7931A → #FFA43D
- Width:            (currentStep / totalSteps) × 100%
- Transition:       width 0.3s ease-out
- Border Radius:    Full (inherited)
```

**Step Labels:**
```
Display:            Flex, space-between
Gap:                16px

Each Step:
- Width:            Flex 1 (equal distribution)
- Text Align:       Center
- Font Size:        13px
- Font Weight:      Medium

States:
- Future:           Color #4A4A4A (disabled)
- Current:          Color #F7931A, Bold
- Completed:        Color #10B981 (green), with checkmark icon
```

**Example Step Labels:**
```
Config → Address → Export → Import → Verify → Name → Done
  ✓        ✓         ✓       [3]       •       •      •
```

### 3.5 Footer Design (Sticky Bottom)

```
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│    [Back]                                      [Next →]          │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

**Footer Specifications:**
```css
Height:             100px
Background:         #1A1A1A (gray-900)
Border Top:         1px solid #2E2E2E (gray-750)
Padding:            24px 48px
Display:            Flex, align-items: center, justify-content: space-between
Position:           Sticky, bottom: 0
Z-Index:            90
Box Shadow:         0 -2px 8px rgba(0,0,0,0.4) // Subtle elevation
```

**Back/Cancel Button:**
```
Style:              Secondary (Ghost)
Background:         Transparent
Border:             1px solid #4A4A4A
Text:               #B4B4B4
Padding:            14px 32px
Font:               16px, Semibold
Border Radius:      8px
Width:              140px

Hover:
- Background:       #2E2E2E
- Border:           #606060
- Text:             #FFFFFF

Text:
- Step 1:           "Cancel"
- Steps 2-7:        "Back"
```

**Next/Create Button:**
```
Style:              Primary (Bitcoin Orange)
Background:         #F7931A
Text:               #FFFFFF
Padding:            14px 32px
Font:               16px, Semibold
Border Radius:      8px
Width:              180px
Text Align:         Center
Icon:               Arrow right, 18px (except "Create Account")

States:
- Default:          Background #F7931A
- Hover:            Background #FFA43D
- Active:           Background #D77C15, Scale 0.98
- Disabled:         Background #2E2E2E, Text #4A4A4A, Cursor not-allowed
- Loading:          Spinner animation, Text "Creating..."

Button Text:
- Steps 1-5:        "Next" →
- Step 6:           "Create Account"
- Step 7:           "Return to Wallet"
```

---

## 4. Entry Point Design

### 4.1 Dashboard Button Location

**Current Implementation:**
The "Create Multisig Account" button appears in the account dropdown menu (Dashboard.tsx, line 379-393).

**Enhanced Design:**

**Primary Button (In Account Dropdown):**
```tsx
// Keep existing placement, enhance visual design
<button className="w-full px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
  <svg className="w-5 h-5" ...> {/* Plus icon */}
  <span>Create Multisig Account</span>
  <svg className="w-4 h-4 text-white/80" ...> {/* External link icon */}
</button>
```

**Visual Indicators:**
- Add small "external link" icon (↗) to indicate opens in new tab
- Hover tooltip: "Opens in new browser tab"
- Keep prominent placement at bottom of dropdown

### 4.2 Button Click Behavior

```typescript
const handleCreateMultisig = () => {
  // Close dropdown
  setShowAccountDropdown(false);

  // Open wizard in new tab
  chrome.tabs.create({
    url: chrome.runtime.getURL('wizard.html'),
    active: true // Focus new tab immediately
  });
};
```

**User Experience:**
1. User clicks "Create Multisig Account" in dropdown
2. Dropdown closes smoothly
3. New browser tab opens with wizard (immediate focus)
4. Original popup remains unchanged (can be closed or stay open)
5. User completes wizard in full-screen tab
6. On wizard completion, tab auto-closes, user returns to extension

### 4.3 New Tab Initial State

**Loading Screen (if needed):**
```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Bitcoin Wallet  │  Create Multisig Account  │ [?]│
├────────────────────────────────────────────────────────────┤
│                                                              │
│                    [Loading spinner]                         │
│                Creating your wizard...                       │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**Note:** Should be nearly instant, no loading screen necessary unless initializing xpub takes >500ms.

---

## 5. Tab-Specific UI Elements

### 5.1 Close/Cancel Behavior

**Primary Cancel Method:**
- "Cancel" button in footer (Step 1) / "Back" button (returns to Step 1)
- On Step 1, clicking "Cancel" shows confirmation modal

**Confirmation Modal:**
```
┌─────────────────────────────────────────────────────────────┐
│                      Cancel Wizard?                           │
│                                                               │
│  Your progress will be lost. Co-signers' xpubs and           │
│  configurations will not be saved.                            │
│                                                               │
│               [Keep Editing]    [Cancel Setup]                │
└─────────────────────────────────────────────────────────────┘
```

**Modal Specifications:**
```
Width:              440px
Background:         #2A2A2A (gray-850)
Border:             1px solid #3A3A3A
Border Radius:      16px
Padding:            32px
Shadow:             Large (0 10px 24px -4px rgba(0,0,0,0.7))
Backdrop:           rgba(0, 0, 0, 0.8) with blur(8px)

Title:              20px, Semibold, #FFFFFF, Center aligned
Message:            14px, Regular, #B4B4B4, Center aligned, Line height 1.5
Margin:             24px between title and message, 32px before buttons

Buttons:
- Keep Editing:     Secondary button, left
- Cancel Setup:     Danger button (#EF4444), right
```

**Danger Button (Cancel Setup):**
```
Background:         #EF4444
Text:               #FFFFFF
Hover:              #DC2626
Active:             #B91C1C
```

**Browser Tab Close:**
If user closes tab directly (X button):
- No confirmation needed before Step 6 (reversible)
- On Step 6-7: Browser shows native "Leave site?" confirmation
- All progress is lost (no state persistence)

### 5.2 Navigation After Completion

**Step 7 (Success Screen) Design:**

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Bitcoin Wallet  │  Create Multisig Account  │ [?]│
├────────────────────────────────────────────────────────────┤
│                                                              │
│                     [Large checkmark icon]                   │
│                     (120×120px, green)                       │
│                                                              │
│               Multisig Account Created!                      │
│           Your 2-of-3 account is ready to use                │
│                                                              │
│   ┌──────────────────────────────────────────────────┐     │
│   │  Account Name:    "Family Savings"               │     │
│   │  Configuration:   2-of-3                          │     │
│   │  Address Type:    P2WSH                           │     │
│   │  Co-Signers:      2                               │     │
│   └──────────────────────────────────────────────────┘     │
│                                                              │
│              Closing in 3 seconds...                         │
│                                                              │
│   [← Back to Dashboard]    [Close Tab Now]                  │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**Countdown Timer:**
```
Text:               "Closing in X seconds..."
Font:               14px, Regular
Color:              #808080
Animation:          Number counts down: 3 → 2 → 1 → Closing...
```

**Auto-close Behavior:**
```typescript
useEffect(() => {
  if (wizardComplete) {
    const timer = setTimeout(() => {
      window.close(); // Close current tab
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [wizardComplete]);
```

**Manual Close Buttons:**
1. **"Close Tab Now"** - Primary button, closes immediately
2. **"Back to Dashboard"** - Opens extension popup, then closes tab

### 5.3 Extension Identity Elements

**Purpose:** Ensure user knows this tab belongs to Bitcoin Wallet extension

**Brand Elements Present:**
1. **Header Logo**: 48×48px Bitcoin logo (distinctive orange)
2. **Extension Name**: "Bitcoin Wallet" always visible
3. **Color Scheme**: Consistent gray-950 background, bitcoin orange accents
4. **Typography**: Identical to extension (system fonts)
5. **Components**: Reused from extension (buttons, inputs, cards)

**Subtle Branding:**
- Favicon: Bitcoin logo (same as extension icon)
- Page Title: "Create Multisig Account - Bitcoin Wallet"
- No external links or navigation away from wizard
- Footer could include small "Bitcoin Wallet Extension" text

**Trust Indicators:**
- Show extension ID in page title/URL
- Use chrome-extension:// protocol (visible in address bar)
- No ability to navigate to external websites

---

## 6. Responsive Considerations

### 6.1 Breakpoint Strategy

**Desktop (1200px+):**
- Full 800px content width
- 48px horizontal padding
- Progress indicator with full step labels
- Two-column layouts where appropriate (xpub import, address verification)

**Laptop (1024-1199px):**
- 800px content width maintained
- 32px horizontal padding
- Same layouts as desktop
- Slightly tighter margins

**Tablet (768-1023px):**
- 720px content width
- 24px horizontal padding
- Progress indicator with abbreviated labels
- Single-column layouts
- Footer buttons stack on small tablets (< 900px)

**Mobile (< 768px):**
- 100% width (minus 16px padding each side)
- Full-width content
- Progress indicator: simple progress bar, no labels
- All content single-column
- Footer buttons full-width, stacked vertically
- Reduced font sizes (but still readable)

### 6.2 Minimum Width Requirements

**Absolute Minimum:**
```
Min Width:          360px (mobile)
Graceful Degradation:
- < 360px: Show warning "Please use a larger screen"
- 360-480px: Single column, minimal padding
- 480-768px: Single column, comfortable padding
```

**Recommended Minimum:**
```
Min Width:          768px (tablet landscape)
Reason:             QR codes need minimum 200×200px display
                    Xpub strings need ~400px to wrap properly
                    Address verification benefits from width
```

**Optimal Width:**
```
Optimal:            1024px+ (laptop/desktop)
Content Width:      800px (leaves margins for breathing room)
```

### 6.3 Window Resize Behavior

**Content Reflow:**
- Smooth transitions between breakpoints (CSS transitions on padding/width)
- No jarring jumps or content re-arrangement
- Progress bar scales smoothly
- QR codes scale proportionally (max 400px, min 200px)

**Fixed Elements:**
- Header height remains 80px on desktop/laptop
- Header height reduces to 64px on mobile
- Footer height remains 100px on desktop/laptop
- Footer height adjusts to content (stacked buttons) on mobile

**Test Scenarios:**
1. Start wizard on desktop, resize to tablet → should reflow smoothly
2. Start on mobile, rotate to landscape → should adapt immediately
3. Drag window narrow/wide → should never break layout

---

## 7. User Flows

### 7.1 Complete Happy Path

```
┌─────────────────────────────────────────────────────────────────┐
│                         HAPPY PATH                               │
└─────────────────────────────────────────────────────────────────┘

1. USER: Opens extension popup
   STATE: Dashboard visible, account dropdown available

2. USER: Clicks account dropdown
   STATE: Dropdown opens, shows accounts + "Create Multisig Account"

3. USER: Clicks "Create Multisig Account"
   ACTION: chrome.tabs.create() opens wizard.html in new tab
   STATE: Dropdown closes, new tab opens and gains focus

4. USER: In new tab, sees wizard Step 1 (Config Selection)
   STATE: Header shows "Bitcoin Wallet │ Create Multisig Account"
           Progress: Step 1 of 7 - Config
           Footer: [Cancel] [Next →]

5. USER: Selects "2-of-3" configuration
   STATE: Selection highlighted, Next button enabled

6. USER: Clicks "Next"
   STATE: Transitions to Step 2 (Address Type Selection)
           Progress: Step 1 ✓, Step 2 active

7. USER: Selects "P2WSH (Native SegWit)"
   STATE: Selection highlighted, Next button enabled

8. USER: Clicks "Next"
   STATE: Transitions to Step 3 (Export Xpub)
           Progress: Steps 1-2 ✓, Step 3 active
           Display: Large QR code (400×400px) + text xpub

9. USER: Scans QR code with co-signer device, copies xpub
   STATE: Xpub generated and displayed, Next button enabled

10. USER: Clicks "Next"
    STATE: Transitions to Step 4 (Import Xpubs)
            Progress: Steps 1-3 ✓, Step 4 active
            Display: Empty list, "Add Co-Signer" button, need 2 xpubs

11. USER: Clicks "Add Co-Signer", pastes Co-Signer 1 xpub
    STATE: Co-Signer 1 card appears with fingerprint, editable name
            Still need 1 more xpub, Next button disabled

12. USER: Clicks "Add Co-Signer", pastes Co-Signer 2 xpub
    STATE: Co-Signer 2 card appears
            All 2 required xpubs collected, Next button enabled

13. USER: Clicks "Next"
    STATE: Transitions to Step 5 (Verify Address)
            Progress: Steps 1-4 ✓, Step 5 active
            Display: First multisig address + QR code
                     Checkbox "I've verified this address matches"

14. USER: Verifies address on other devices, checks checkbox
    STATE: Checkbox checked, Next button enabled

15. USER: Clicks "Next"
    STATE: Transitions to Step 6 (Name Account)
            Progress: Steps 1-5 ✓, Step 6 active
            Display: Summary of all config + name input
            Default name: "Multisig Account 1"

16. USER: Changes name to "Family Savings", clicks "Create Account"
    STATE: Button shows loading spinner "Creating..."
            Background: Creates account in wallet storage
            Disabled all navigation during creation

17. SYSTEM: Account created successfully
    STATE: Transitions to Step 7 (Success)
            Progress: Steps 1-7 ✓
            Display: Success checkmark, account details
                     "Closing in 3 seconds..."
                     [← Back to Dashboard] [Close Tab Now]

18. USER: Waits 3 seconds OR clicks "Close Tab Now"
    ACTION: window.close()
    STATE: Tab closes, user returns to browser context

19. USER: Re-opens extension popup
    STATE: Dashboard loads, new account "Family Savings" appears
            in account dropdown with 2-of-3 badge

20. COMPLETED: User can now use multisig account
```

### 7.2 Error Scenarios

**Error Scenario 1: Invalid Xpub**
```
Step 4 (Import Xpubs)
→ User pastes invalid xpub string
→ Error toast appears: "Invalid xpub format"
→ Input field shows error state (red border)
→ User can correct and retry
→ No progress lost
```

**Error Scenario 2: Duplicate Xpub**
```
Step 4 (Import Xpubs)
→ User pastes xpub that matches their own xpub
→ Error toast: "Cannot use your own xpub as co-signer"
→ Input cleared, user can paste different xpub
```

**Error Scenario 3: Account Creation Fails**
```
Step 6 (Name Account)
→ User clicks "Create Account"
→ Background error (storage failure, network issue)
→ Error message appears: "Failed to create account. Please try again."
→ "Create Account" button re-enabled
→ User can retry
→ Progress not lost, can go back and verify settings
```

**Error Scenario 4: Tab Closed Mid-Wizard**
```
Any Step 1-5
→ User closes browser tab accidentally
→ All progress lost (no persistence)
→ User must restart from Step 1
→ NOTE: Acceptable for MVP, add "Save Progress" in future
```

### 7.3 Cancellation Flow

**Cancel at Step 1:**
```
Step 1 (Config Selection)
→ User clicks "Cancel" button
→ Confirmation modal appears:
   "Cancel Wizard? Your progress will be lost."
   [Keep Editing] [Cancel Setup]
→ User clicks "Cancel Setup"
→ Tab closes immediately
→ No account created
```

**Cancel at Step 3 (After Progress Made):**
```
Step 3 (Export Xpub)
→ User clicks "Back" repeatedly to return to Step 1
→ User clicks "Cancel" at Step 1
→ Same confirmation modal as above
→ User clicks "Cancel Setup"
→ Tab closes, all progress lost
```

### 7.4 Browser Navigation Events

**User Clicks Browser Back Button:**
```
Any Step
→ Browser back button pressed
→ Wizard moves to previous step
→ Same as clicking "Back" in footer
→ NOTE: Requires proper browser history management
```

**Implementation Note:**
```typescript
// Prevent browser back from leaving wizard
useEffect(() => {
  const handlePopState = (e: PopStateEvent) => {
    e.preventDefault();
    if (currentStep > 1) {
      wizard.previousStep();
    } else {
      showCancelModal();
    }
  };

  window.addEventListener('popstate', handlePopState);
  return () => window.removeEventListener('popstate', handlePopState);
}, [currentStep]);
```

---

## 8. Component Specifications

### 8.1 Wizard Container Component

**File:** `/src/wizard/WizardPage.tsx`

```typescript
interface WizardPageProps {
  children: React.ReactNode;
}

export const WizardPage: React.FC<WizardPageProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <WizardHeader />

      <main className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[800px] px-12 py-8 bg-gray-900 min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </main>
    </div>
  );
};
```

**Tailwind Classes:**
```
Container:
  min-h-screen           // Full viewport height
  bg-gray-950            // Body background
  flex flex-col          // Vertical layout

Content Wrapper:
  w-full                 // Full width up to max
  max-w-[800px]          // Centered 800px
  px-12 py-8             // Generous padding
  bg-gray-900            // Content background
  min-h-[calc(100vh-80px)] // Ensure footer at bottom
```

### 8.2 Wizard Header Component

**File:** `/src/wizard/components/WizardHeader.tsx`

```typescript
export const WizardHeader: React.FC = () => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <header className="sticky top-0 z-100 h-20 bg-gray-900 border-b border-gray-750 px-12 flex items-center justify-between shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-6">
        <div className="w-12 h-12 bg-bitcoin rounded-full flex items-center justify-center">
          <BitcoinIcon className="w-8 h-8 text-white" />
        </div>
        <span className="text-lg font-semibold text-white">Bitcoin Wallet</span>
        <div className="w-px h-6 bg-gray-750" /> {/* Separator */}
        <span className="text-base text-gray-400">Create Multisig Account</span>
      </div>

      {/* Right Section */}
      <button
        onClick={() => setShowHelp(!showHelp)}
        className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-850 rounded-lg transition-colors"
        title="Help & Guidance"
      >
        <QuestionMarkIcon className="w-5 h-5" />
      </button>
    </header>
  );
};
```

**Component Styling:**
```css
Header:
  position: sticky
  top: 0
  z-index: 100
  height: 80px
  background: #1A1A1A
  border-bottom: 1px solid #2E2E2E
  padding: 0 48px
  box-shadow: 0 2px 8px rgba(0,0,0,0.4)

Logo Container:
  width: 48px
  height: 48px
  background: #F7931A (bitcoin orange)
  border-radius: 50%
  display: flex
  align-items: center
  justify-content: center

Logo Icon:
  width: 32px
  height: 32px
  color: #FFFFFF
```

### 8.3 Enhanced Progress Indicator

**File:** `/src/wizard/components/WizardProgress.tsx`

```typescript
interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="py-8 px-0">
      {/* Step Counter */}
      <div className="text-center mb-4">
        <span className="text-sm font-medium text-gray-400 tracking-wide">
          Step {currentStep} of {totalSteps}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-1.5 bg-gray-750 rounded-full mb-6 overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-bitcoin to-bitcoin-light rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Step Labels */}
      <div className="flex items-center justify-between">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center gap-1">
              {/* Step Indicator */}
              {isCompleted ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
              ) : isCurrent ? (
                <div className="w-5 h-5 rounded-full bg-bitcoin flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{stepNumber}</span>
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">{stepNumber}</span>
                </div>
              )}

              {/* Step Label */}
              <span
                className={`text-xs font-medium ${
                  isCompleted
                    ? 'text-green-500'
                    : isCurrent
                    ? 'text-bitcoin'
                    : 'text-gray-600'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

### 8.4 Wizard Footer Component

**File:** `/src/wizard/components/WizardFooter.tsx`

```typescript
interface WizardFooterProps {
  onBack: () => void;
  onNext: () => void;
  backLabel: string;
  nextLabel: string;
  nextEnabled: boolean;
  isLoading?: boolean;
}

export const WizardFooter: React.FC<WizardFooterProps> = ({
  onBack,
  onNext,
  backLabel,
  nextLabel,
  nextEnabled,
  isLoading = false
}) => {
  return (
    <footer className="sticky bottom-0 z-90 h-[100px] bg-gray-900 border-t border-gray-750 px-12 flex items-center justify-between shadow-[0_-2px_8px_rgba(0,0,0,0.4)]">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="px-8 py-3.5 bg-transparent border border-gray-600 text-gray-400 hover:bg-gray-850 hover:border-gray-500 hover:text-white rounded-lg font-semibold text-base transition-colors min-w-[140px]"
      >
        {backLabel}
      </button>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!nextEnabled || isLoading}
        className={`px-8 py-3.5 rounded-lg font-semibold text-base transition-all min-w-[180px] flex items-center justify-center gap-2 ${
          nextEnabled && !isLoading
            ? 'bg-bitcoin hover:bg-bitcoin-light text-white active:scale-98'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
        }`}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="w-5 h-5" />
            <span>Creating...</span>
          </>
        ) : (
          <>
            <span>{nextLabel}</span>
            {nextLabel.includes('Next') && <ArrowRightIcon className="w-4 h-4" />}
          </>
        )}
      </button>
    </footer>
  );
};
```

### 8.5 Success Screen Component

**File:** `/src/wizard/components/SuccessScreen.tsx`

```typescript
interface SuccessScreenProps {
  accountName: string;
  configuration: string;
  addressType: string;
  cosignerCount: number;
  onClose: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  accountName,
  configuration,
  addressType,
  cosignerCount,
  onClose
}) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          window.close();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Success Icon */}
      <div className="w-32 h-32 bg-green-500/15 rounded-full flex items-center justify-center mb-8">
        <CheckCircleIcon className="w-20 h-20 text-green-500" />
      </div>

      {/* Success Message */}
      <h1 className="text-3xl font-bold text-white mb-3">
        Multisig Account Created!
      </h1>
      <p className="text-lg text-gray-400 mb-2">
        Your {configuration} multisig account is ready to use
      </p>
      <p className="text-sm text-gray-500">
        You can now send and receive Bitcoin with enhanced security.
      </p>

      {/* Account Details Card */}
      <div className="mt-10 w-full max-w-md p-6 bg-gray-850 border border-gray-700 rounded-xl">
        <div className="space-y-3 text-left">
          <DetailRow label="Account Name" value={accountName} />
          <DetailRow label="Configuration" value={configuration} />
          <DetailRow label="Address Type" value={addressType.toUpperCase()} />
          <DetailRow label="Co-Signers" value={cosignerCount.toString()} />
        </div>
      </div>

      {/* Countdown */}
      <p className="mt-8 text-sm text-gray-500">
        Closing in {countdown} second{countdown !== 1 ? 's' : ''}...
      </p>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => {
            chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
            window.close();
          }}
          className="px-6 py-3 bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-lg font-semibold transition-colors"
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-bitcoin hover:bg-bitcoin-light text-white rounded-lg font-semibold transition-colors"
        >
          Close Tab Now
        </button>
      </div>
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center">
    <span className="text-sm text-gray-500">{label}:</span>
    <span className="text-base text-white font-semibold">{value}</span>
  </div>
);
```

---

## 9. Implementation Notes

### 9.1 File Structure

```
src/
├── wizard/
│   ├── wizard.html                 // Entry point HTML
│   ├── wizard.tsx                  // Main wizard React app
│   ├── index.tsx                   // ReactDOM render
│   ├── components/
│   │   ├── WizardPage.tsx          // Page layout wrapper
│   │   ├── WizardHeader.tsx        // Fixed header
│   │   ├── WizardProgress.tsx      // Enhanced progress indicator
│   │   ├── WizardFooter.tsx        // Sticky footer
│   │   ├── SuccessScreen.tsx       // Step 7 success screen
│   │   └── CancelModal.tsx         // Confirmation modal
│   └── hooks/
│       ├── useWizardRouter.ts      // Browser history management
│       └── useAutoClose.ts         // Auto-close countdown logic
```

### 9.2 HTML Entry Point

**File:** `/src/wizard/wizard.html`

```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Create Multisig Account - Bitcoin Wallet</title>
  <link rel="icon" type="image/png" href="./assets/icon-48.png">
  <link rel="stylesheet" href="./styles.css">
</head>
<body class="bg-gray-950 text-white antialiased">
  <div id="wizard-root"></div>
  <script src="./wizard.js"></script>
</body>
</html>
```

### 9.3 Webpack Configuration

**Add wizard bundle to webpack.config.js:**

```javascript
module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    wizard: './src/wizard/index.tsx',  // NEW
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/popup.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: './src/wizard/wizard.html',  // NEW
      filename: 'wizard.html',
      chunks: ['wizard'],
    }),
    // ... other plugins
  ],
};
```

### 9.4 Manifest.json Updates

**Add wizard.html to web_accessible_resources:**

```json
{
  "manifest_version": 3,
  "web_accessible_resources": [
    {
      "resources": [
        "wizard.html",
        "assets/*"
      ],
      "matches": ["<all_urls>"]
    }
  ]
}
```

### 9.5 State Management

**Option 1: Reuse Existing Hook (Simple)**
- Use `useMultisigWizard` hook from popup
- No state persistence needed (wizard completes in one session)
- All state resets if tab closes

**Option 2: Add State Persistence (Future Enhancement)**
- Save wizard state to chrome.storage.local on each step
- Restore state if user returns to wizard
- Clear state on completion or cancellation
- Requires additional implementation

**MVP Recommendation:** Option 1 (no persistence)

### 9.6 Testing Checklist

**Functionality:**
- [ ] Wizard opens in new tab from dashboard
- [ ] All 7 steps progress correctly
- [ ] Back navigation works at each step
- [ ] Cancel confirmation appears on Step 1
- [ ] Account creation succeeds
- [ ] Success screen displays correct details
- [ ] Tab auto-closes after 3 seconds
- [ ] Manual close buttons work
- [ ] Account appears in dashboard after creation

**Responsive:**
- [ ] Desktop (1200px+): Full 800px content
- [ ] Laptop (1024px): Comfortable layout
- [ ] Tablet (768px): Adapted single-column layout
- [ ] Mobile (360px): Minimum viable experience
- [ ] Window resize: Smooth transitions

**Visual:**
- [ ] Colors match extension design system
- [ ] Typography consistent with popup
- [ ] Spacing follows 4px grid
- [ ] Shadows and borders correct
- [ ] Progress indicator animates smoothly
- [ ] Footer buttons have correct states
- [ ] Success checkmark displays properly

**Accessibility:**
- [ ] Keyboard navigation works throughout
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] Screen reader announces step changes
- [ ] Buttons have proper aria-labels
- [ ] Color contrast meets WCAG AA

**Edge Cases:**
- [ ] Invalid xpub handling
- [ ] Duplicate xpub prevention
- [ ] Account creation failure recovery
- [ ] Browser back button behavior
- [ ] Tab close confirmation (if needed)
- [ ] Network error handling

---

## 10. Design Rationale Summary

### Why Full Tab vs. Modal in Popup?

**Rejected Alternative:** Expand popup to larger modal
- ❌ Chrome extensions have strict popup size limits
- ❌ User expects popup to be quick actions
- ❌ Multi-step wizard feels cramped in popup
- ✅ Full tab provides unlimited space
- ✅ Tab can remain open while user communicates with co-signers
- ✅ User can switch tabs to copy xpubs from messages

### Why 800px Content Width?

**Considered Alternatives:**
- 600px: Too similar to popup, doesn't justify tab
- 1000px: Too wide, content spreads thin, poor readability
- 100% responsive: Overwhelming on large monitors, no focus
- 800px: Optimal for readability, QR code display, comfortable spacing

### Why Auto-Close After Success?

**Rationale:**
- Wizard is one-time task, no reason to stay open
- Reduces tab clutter
- Matches OAuth flow patterns users are familiar with
- 3-second delay allows user to read success message
- Manual close option for users who prefer control

### Why No State Persistence?

**MVP Decision:**
- Wizard typically completed in one session (5-10 minutes)
- Co-signers share xpubs via message/email (persistent elsewhere)
- Adding persistence increases complexity significantly
- If tab closes, user can restart (rare occurrence)
- Can add in future if user feedback indicates need

---

## Conclusion

This design transforms the multisig wizard from a cramped 600×400px popup experience into a spacious, professional full-tab flow. The 800px centered content width provides optimal space for QR codes, xpub management, and address verification, while maintaining the extension's visual identity through consistent design system usage.

The fixed header and footer, enhanced progress indicator, and auto-closing success screen create a polished, focused experience that guides users confidently through the complex multisig setup process.

**Next Steps:**
1. Frontend Developer: Implement wizard page components
2. Backend Developer: Ensure chrome.tabs.create() opens wizard correctly
3. QA Engineer: Test all responsive breakpoints and edge cases
4. Product Manager: Validate UX meets user needs
5. UI/UX Designer: Review implementation for design fidelity

---

**Document Version:** 1.0
**Last Updated:** October 13, 2025
**Status:** Design Complete - Ready for Implementation
