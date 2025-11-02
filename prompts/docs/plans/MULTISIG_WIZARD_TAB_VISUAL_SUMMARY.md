# Multisig Wizard Full-Tab Design - Visual Summary

**Quick Reference Guide for Developers**

---

## Layout Overview

### Current (Popup - 600×400px)
```
┌─────────────────────────────────────────┐
│ [←] Create Multisig Account        [?] │ ← Header 64px
├─────────────────────────────────────────┤
│ Step 1 ◉ 2 ○ 3 ○ 4 ○ 5 ○ 6 ○ 7 ○   │ ← Progress 80px
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │                                   │ │
│  │     CRAMPED CONTENT              │ │
│  │     - Small QR codes              │ │
│  │     - Excessive scrolling         │ │ ← Content 200px
│  │     - Hard to read xpubs          │ │   (with scroll)
│  │                                   │ │
│  └───────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│  [Cancel]              [Next →]         │ ← Footer 56px
└─────────────────────────────────────────┘
       PROBLEM: Too constrained!
```

### New (Full Tab - 1200×800px+)
```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [○] Bitcoin Wallet  │  Create Multisig Account  │                      [?] │ ← Fixed Header 80px
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                          Step 3 of 7                                          │
│                     ████████░░░░░░░░░░░                                       │
│              Config → Address → Export → Import → Verify → Name → Done       │
│                ✓         ✓        [3]       •        •        •       •      │ ← Progress 120px
│                                                                                │
│    ┌────────────────────────────────────────────────────────────────┐        │
│    │                                                                  │        │
│    │                       SPACIOUS CONTENT                           │        │
│    │                                                                  │        │
│    │  ┌────────────────────────────────────────────────────────┐   │        │
│    │  │                                                          │   │        │
│    │  │         Large QR Code (400×400px)                       │   │        │
│    │  │         Easy to scan!                                   │   │        │
│    │  │                                                          │   │        │
│    │  └────────────────────────────────────────────────────────┘   │        │
│    │                                                                  │        │
│    │  Your Extended Public Key:                                      │        │
│    │  xpub6CUGRUo... [Copy] [QR] [File]                             │        │ ← Content
│    │                                                                  │   Scrollable
│    │  Share this with your co-signers via secure channel.            │   Max 800px
│    │                                                                  │   Centered
│    │  ⚠ Warning: Never share your private keys or seed phrase!       │
│    │                                                                  │
│    └────────────────────────────────────────────────────────────────┘        │
│                                                                                │
│    ┌────────────────────────────────────────────────────────────────┐        │
│    │  [← Back]                                   [Next →]            │        │ ← Sticky Footer
│    └────────────────────────────────────────────────────────────────┘        │   100px
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
                    SOLUTION: Spacious & Professional!
```

---

## Header Design

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│  ┌──┐                                                                          │
│  │○○│  Bitcoin Wallet   │   Create Multisig Account             [?]          │
│  └──┘                   │                                                      │
│  48px                   │ (separator)              (context)    (help)        │
│  Logo                                                                          │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
  80px height, #1A1A1A background, sticky top, border bottom #2E2E2E
```

**Elements:**
- Logo: 48×48px Bitcoin orange circle with white B icon
- Extension Name: "Bitcoin Wallet" - 18px Semibold #FFFFFF
- Separator: 1px × 24px vertical line #3A3A3A
- Context: "Create Multisig Account" - 16px Regular #B4B4B4
- Help: 44×44px icon button, question mark, hover tooltip

---

## Progress Indicator (Enhanced)

```
                               Step 3 of 7
                        ─────────────────────
                               (14px gray)

    ████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░
    43% progress                                    (6px bar)


    Config → Address → Export → Import → Verify → Name → Done
      ✓         ✓        [3]       •        •       •      •
   (green)   (green)  (orange)  (gray)   (gray)  (gray) (gray)

   13px labels, checkmark for completed, number for current, dot for future
```

**Spacing:**
- Total height: 120px
- Step counter: 14px Medium #B4B4B4
- Margin: 16px between counter and bar
- Progress bar: 6px height, gradient #F7931A → #FFA43D
- Margin: 24px between bar and labels
- Labels: 13px Medium, flex space-between

---

## Footer Design

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│                                                                                │
│    ┌─────────────┐                                     ┌──────────────────┐  │
│    │             │                                     │                  │  │
│    │    Back     │                                     │    Next  →       │  │
│    │             │                                     │                  │  │
│    └─────────────┘                                     └──────────────────┘  │
│     140px width                                          180px width          │
│     Secondary style                                      Primary (orange)     │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
  100px height, #1A1A1A background, sticky bottom, border top #2E2E2E
```

**Back Button:**
- 140px × 44px
- Border: 1px #4A4A4A
- Text: #B4B4B4
- Hover: bg #2E2E2E, text #FFFFFF
- Labels: "Cancel" (Step 1), "Back" (Steps 2-7)

**Next Button:**
- 180px × 44px
- Background: #F7931A (enabled), #2E2E2E (disabled)
- Text: #FFFFFF
- Hover: #FFA43D
- Active: #D77C15, scale 0.98
- Labels: "Next →" (Steps 1-5), "Create Account" (Step 6), "Return to Wallet" (Step 7)
- Loading: Spinner + "Creating..."

---

## Entry Point (Dashboard)

### Current Account Dropdown
```
┌──────────────────────────────────┐
│  Personal Account        ✓       │
│  legacy                          │
├──────────────────────────────────┤
│  Savings                         │
│  native-segwit                   │
├──────────────────────────────────┤
│  Family Wallet  [2-of-3]         │
│  P2WSH                           │
├══════════════════════════════════┤
│  ┌────────────────────────────┐ │
│  │ [+] Create Multisig Account │↗│ ← NEW: External link icon
│  └────────────────────────────┘ │
└──────────────────────────────────┘
```

**Visual Indicators:**
- Small external link icon (↗) in top-right corner
- Hover tooltip: "Opens in new browser tab"
- Button style: Bitcoin orange, prominent placement

**Click Behavior:**
```typescript
chrome.tabs.create({
  url: chrome.runtime.getURL('wizard.html'),
  active: true // Focus new tab immediately
});
```

---

## Responsive Breakpoints

### Desktop (1200px+)
```
┌────────────────────────────────────────────────────────────────┐
│                                                                  │
│         ┌────────────────────────────────────┐                 │
│         │                                    │                 │
│         │     800px Content                  │                 │
│         │     Centered on screen             │                 │
│         │     Full feature set               │                 │
│         │                                    │                 │
│         └────────────────────────────────────┘                 │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
  Comfortable margins, two-column where appropriate
```

### Tablet (768px)
```
┌──────────────────────────────────────┐
│                                      │
│  ┌────────────────────────────────┐ │
│  │                                │ │
│  │    720px Content               │ │
│  │    Single column               │ │
│  │    Abbreviated labels          │ │
│  │                                │ │
│  └────────────────────────────────┘ │
│                                      │
└──────────────────────────────────────┘
  Tight margins, optimized for touch
```

### Mobile (360px minimum)
```
┌────────────────────┐
│                    │
│ ┌────────────────┐ │
│ │                │ │
│ │  Full Width    │ │
│ │  Stacked       │ │
│ │  Simple Bar    │ │
│ │  No Labels     │ │
│ │                │ │
│ └────────────────┘ │
│                    │
└────────────────────┘
  Minimal padding
  Warning < 360px
```

---

## Success Screen (Step 7)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  [○] Bitcoin Wallet  │  Create Multisig Account  │                      [?] │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│                                                                                │
│                              ┌────────────┐                                   │
│                              │            │                                   │
│                              │     ✓      │  (120×120px green checkmark       │
│                              │            │   in circle with subtle glow)     │
│                              └────────────┘                                   │
│                                                                                │
│                        Multisig Account Created!                              │
│                   (32px Bold #FFFFFF)                                         │
│                                                                                │
│                 Your 2-of-3 account is ready to use                           │
│                   (18px Regular #B4B4B4)                                      │
│                                                                                │
│        You can now send and receive Bitcoin with enhanced security.           │
│                   (14px Regular #808080)                                      │
│                                                                                │
│                                                                                │
│    ┌────────────────────────────────────────────────────────────────┐        │
│    │                                                                  │        │
│    │   Account Name:     Family Savings                              │        │
│    │   Configuration:    2-of-3                                      │        │
│    │   Address Type:     P2WSH                                       │        │
│    │   Co-Signers:       2                                           │        │
│    │                                                                  │        │
│    └────────────────────────────────────────────────────────────────┘        │
│             (Detail card: #2A2A2A bg, border #3A3A3A, 24px padding)          │
│                                                                                │
│                                                                                │
│                       Closing in 3 seconds...                                 │
│                           (14px #808080)                                      │
│                                                                                │
│                                                                                │
│       ┌──────────────────────┐        ┌──────────────────────┐              │
│       │                      │        │                      │              │
│       │  ← Back to Dashboard │        │  Close Tab Now       │              │
│       │                      │        │                      │              │
│       └──────────────────────┘        └──────────────────────┘              │
│        Secondary button                 Primary button                        │
│                                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Countdown Logic:**
```typescript
useEffect(() => {
  if (wizardComplete) {
    const timer = setTimeout(() => {
      window.close();
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [wizardComplete]);
```

---

## User Flow Diagram

```
┌─────────────┐
│   User      │
│   Opens     │
│  Extension  │
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│   Dashboard         │
│   Account Dropdown  │
└──────┬──────────────┘
       │ Clicks "Create Multisig Account"
       │
       ▼
┌─────────────────────┐
│  chrome.tabs.create()│
│  Opens wizard.html  │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  NEW TAB: Wizard Page               │
│                                     │
│  Step 1: Select Config (2-of-3)    │
│         ↓ Next                      │
│  Step 2: Select Address Type (P2WSH)│
│         ↓ Next                      │
│  Step 3: Export Xpub (QR + text)   │
│         ↓ Next                      │
│  Step 4: Import Co-signer Xpubs    │
│         ↓ Next (when 2 added)       │
│  Step 5: Verify Address Match      │
│         ↓ Next (after checked)      │
│  Step 6: Name Account + Summary    │
│         ↓ Create Account            │
│  Step 7: Success Screen             │
│         ↓ Auto-close (3 sec)        │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────┐
│   Tab Closes        │
│   User Returns to   │
│   Browser Context   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────┐
│   User Re-opens     │
│   Extension Popup   │
└──────┬──────────────┘
       │
       ▼
┌─────────────────────────────────┐
│  Dashboard                      │
│  New account appears in         │
│  dropdown with [2-of-3] badge   │
│  ✓ Ready to use!                │
└─────────────────────────────────┘
```

---

## File Structure

```
src/
├── wizard/
│   ├── wizard.html                 // Entry point HTML
│   ├── wizard.tsx                  // Main wizard app (routes)
│   ├── index.tsx                   // ReactDOM.render()
│   │
│   ├── components/
│   │   ├── WizardPage.tsx          // Page layout wrapper
│   │   ├── WizardHeader.tsx        // Fixed header (80px)
│   │   ├── WizardProgress.tsx      // Enhanced progress (120px)
│   │   ├── WizardFooter.tsx        // Sticky footer (100px)
│   │   ├── SuccessScreen.tsx       // Step 7 with auto-close
│   │   └── CancelModal.tsx         // Confirmation modal
│   │
│   └── hooks/
│       ├── useWizardRouter.ts      // Browser history management
│       └── useAutoClose.ts         // 3-second countdown
│
├── popup/
│   └── components/
│       ├── Dashboard.tsx           // Add chrome.tabs.create()
│       └── MultisigSetup/
│           └── MultisigWizard.tsx  // REUSE existing step components!
│
└── shared/
    └── types/
        └── index.ts                // Shared types
```

**Reuse Strategy:**
- ✅ All 7 step components from MultisigWizard (no changes needed!)
- ✅ useMultisigWizard hook (state management)
- ✅ All multisig helper functions
- 🆕 Only create new layout/wrapper components
- 🆕 Only add chrome.tabs.create() call to Dashboard

---

## Implementation Checklist

### Phase 1: Setup (2 hours)
- [ ] Create `/src/wizard/` directory structure
- [ ] Create `wizard.html` entry point
- [ ] Create `wizard.tsx` main app
- [ ] Create `index.tsx` ReactDOM render
- [ ] Update webpack.config.js (add wizard entry)
- [ ] Update manifest.json (web_accessible_resources)
- [ ] Test: Wizard page opens blank in new tab

### Phase 2: Layout Components (4 hours)
- [ ] Create `WizardPage.tsx` layout wrapper
- [ ] Create `WizardHeader.tsx` with logo/branding
- [ ] Create `WizardProgress.tsx` enhanced indicator
- [ ] Create `WizardFooter.tsx` sticky navigation
- [ ] Create `CancelModal.tsx` confirmation
- [ ] Test: Layout renders correctly at all breakpoints

### Phase 3: Wizard Integration (3 hours)
- [ ] Import existing MultisigWizard step components
- [ ] Import useMultisigWizard hook
- [ ] Wire up step navigation
- [ ] Wire up progress indicator
- [ ] Wire up footer buttons
- [ ] Test: All 7 steps navigate correctly

### Phase 4: Success & Auto-close (2 hours)
- [ ] Create `SuccessScreen.tsx` component
- [ ] Implement 3-second countdown timer
- [ ] Implement window.close() on timer
- [ ] Add manual "Close Now" button
- [ ] Add "Back to Dashboard" button
- [ ] Test: Tab closes correctly, account appears

### Phase 5: Dashboard Integration (1 hour)
- [ ] Update Dashboard.tsx account dropdown
- [ ] Add external link icon to button
- [ ] Implement chrome.tabs.create() handler
- [ ] Remove old showMultisigWizard state
- [ ] Test: Wizard opens from dashboard

### Phase 6: Responsive & Polish (3 hours)
- [ ] Test desktop breakpoint (1200px+)
- [ ] Test laptop breakpoint (1024px)
- [ ] Test tablet breakpoint (768px)
- [ ] Test mobile breakpoint (360px)
- [ ] Add responsive CSS transitions
- [ ] Test window resize behavior
- [ ] Polish animations and transitions

### Phase 7: Testing & QA (4 hours)
- [ ] Functional testing (all steps work)
- [ ] Responsive testing (all breakpoints)
- [ ] Visual testing (design system consistency)
- [ ] Accessibility testing (keyboard nav)
- [ ] Edge case testing (errors, cancellation)
- [ ] Browser compatibility (Chrome/Edge)
- [ ] Performance testing (load time)

**Total Estimated Time:** ~19 hours (~3 days for experienced developer)

---

## Key Benefits Summary

### Before (Popup):
- ❌ Cramped 600×400px space
- ❌ Small QR codes (hard to scan)
- ❌ Excessive scrolling
- ❌ Difficult xpub management
- ❌ Poor address verification UX

### After (Full Tab):
- ✅ Spacious 800px centered content
- ✅ Large 400×400px QR codes (easy scan)
- ✅ Minimal scrolling (each step fits comfortably)
- ✅ Easy xpub copy/paste/QR
- ✅ Clear address verification layout
- ✅ Professional, focused environment
- ✅ Can multi-task (tab stays open during co-signer coordination)
- ✅ Maintains 100% design system consistency
- ✅ Auto-closes on completion (clean UX)

---

## Questions & Answers

**Q: Why not just make the popup bigger?**
A: Chrome extension popups have strict size limits. Full tab provides unlimited space.

**Q: Will users be confused by opening a new tab?**
A: No - external link icon (↗) indicates new tab. OAuth flows have trained users on this pattern.

**Q: What if user closes tab mid-wizard?**
A: For MVP, progress is lost (restart needed). State persistence can be added later if needed.

**Q: What if user has multiple tabs open?**
A: Only one wizard tab should be open at a time. Can add detection/focus logic if needed.

**Q: How does this integrate with existing code?**
A: Reuses all existing MultisigWizard step components. Only adds new layout wrappers.

**Q: What about mobile users?**
A: Responsive design supports down to 360px width. Not optimal on small phones, but functional.

**Q: Can user navigate back with browser back button?**
A: Yes - implement `popstate` listener to navigate to previous wizard step.

**Q: How long does implementation take?**
A: ~3 days for experienced React/TypeScript developer (19 hours total).

---

## Next Steps

1. **Frontend Developer:** Review spec, implement Phase 1-7
2. **Backend Developer:** Ensure chrome.tabs.create() works correctly
3. **QA Engineer:** Prepare test plan using Phase 7 checklist
4. **Product Manager:** Validate UX meets user needs
5. **UI/UX Designer:** Review implementation for design fidelity

---

**Full Specification:** `/prompts/docs/MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`
**Designer Notes:** `/prompts/docs/ui-ux-designer-notes.md` (Section: "October 13, 2025: Multisig Wizard Full-Tab Design")

**Status:** Design Complete - Ready for Implementation
**Date:** October 13, 2025
