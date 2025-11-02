# Account Management UI - Visual Design Summary

**Quick Reference Guide**
**Date:** October 18, 2025
**Designer:** UI/UX Designer
**Status:** Ready for Implementation

---

## At a Glance

This document provides a quick visual reference for implementing the enhanced account management UI. For complete specifications, see `ACCOUNT_MANAGEMENT_DESIGN_SPEC.md`.

---

## 1. Account Dropdown - Before & After

### BEFORE (v0.9.0)
```
┌─────────────────────────────────────┐
│ ✓ Account 1       [Native SegWit]   │
│   Multisig Vault  [2-of-3]          │
├─────────────────────────────────────┤
│ [+ Create Multisig Account] 🔗      │ ← Only option
└─────────────────────────────────────┘
```

### AFTER (v0.10.0)
```
┌─────────────────────────────────────┐
│ ✓ Account 1       [Native SegWit]   │
│   Imported ↓      [Legacy]          │ ← New badge
│   Multisig Vault  [2-of-3]          │
├─────────────────────────────────────┤
│ [+  Create Account]                 │ ← NEW (Orange)
│ [↓  Import Account]                 │ ← NEW (Gray)
│ [+  Create Multisig Account  🔗]    │ ← Keep (Gray)
└─────────────────────────────────────┘
```

**Key Changes:**
- ✅ Added "Create Account" button (primary orange)
- ✅ Added "Import Account" button (secondary gray)
- ✅ Changed "Create Multisig" to secondary gray
- ✅ Added import badge (blue ↓) for imported accounts
- ✅ Clear visual hierarchy: Orange > Gray > Gray

---

## 2. Button Visual Hierarchy

### Priority 1: Create Account (Primary)
```
┌──────────────────────────────────────┐
│  +  Create Account                   │  ← Bitcoin Orange #F7931A
└──────────────────────────────────────┘    White text
    Hover: Glow effect, lighter orange
    Most common action (80% usage)
```

### Priority 2: Import Account (Secondary)
```
┌──────────────────────────────────────┐
│  ↓  Import Account                   │  ← Gray #1E1E1E
└──────────────────────────────────────┘    Gray-300 text
    Border: Gray-700
    Hover: Gray-800 background
    Advanced feature (5% usage)
```

### Priority 3: Create Multisig (Secondary)
```
┌──────────────────────────────────────┐
│  +  Create Multisig Account      🔗  │  ← Gray #1E1E1E
└──────────────────────────────────────┘    External link icon
    Same style as Import
    Specialized feature (15% usage)
```

---

## 3. Create Account Modal

### Layout
```
┌────────────────────────────────────────────────────┐
│ Create New Account                            [X]   │ ← Header (80px)
├────────────────────────────────────────────────────┤
│                                                      │
│  Account Name *                                     │
│  ┌────────────────────────────────────────────┐    │
│  │ My Savings Account_                        │    │
│  └────────────────────────────────────────────┘    │
│  Enter a name to identify this account   18/30     │
│                                                      │
│  Address Type *                                     │
│  ┌────────────────────────────────────────────┐    │
│  │ Native SegWit (Recommended)             ▼ │    │
│  └────────────────────────────────────────────┘    │
│  • Lower fees and better privacy                   │
│                                                      │
│  ℹ️ This account will be derived from your         │
│     existing wallet seed (BIP44 derivation)        │
│                                                      │
├────────────────────────────────────────────────────┤
│                                                      │ ← Footer (80px)
│  [Cancel]                     [Create Account]     │
│                                                      │
└────────────────────────────────────────────────────┘
    800px width, centered, dark overlay backdrop
```

### Color Scheme
- **Modal Background:** #1A1A1A (gray-900)
- **Input Background:** #0F0F0F (gray-950)
- **Input Border:** #3F3F3F (gray-700)
- **Input Focus:** #F7931A (bitcoin orange)
- **Primary Button:** #F7931A background, white text
- **Secondary Button:** Transparent, gray border

---

## 4. Import Account Modal

### Tab Navigation
```
┌────────────────────────────────────────────────────┐
│ Import Account                                [X]   │
├────────────────────────────────────────────────────┤
│ [Private Key]   Seed Phrase                        │ ← Tabs
├────────────────────────────────────────────────────┤
│                                                      │
│  ⚠️ Warning: Imported accounts are NOT backed up   │ ← Security Warning
│     by your wallet's main seed. Back up separately │   (Amber)
│                                                      │
│  Private Key (WIF Format) *                         │
│  ┌────────────────────────────────────────────┐    │
│  │ cVhT8DRG4sP1wNzQkjyF7M...                  │    │ ← Monospace
│  │                                             │    │
│  └────────────────────────────────────────────┘    │
│  Testnet keys start with 'c'                       │
│                                                      │
│  Account Name *                                     │
│  ┌────────────────────────────────────────────┐    │
│  │ Imported Paper Wallet_                     │    │
│  └────────────────────────────────────────────┘    │
│                                                      │
├────────────────────────────────────────────────────┤
│  [Cancel]                     [Import Account]     │
└────────────────────────────────────────────────────┘
```

### Tab Styles
- **Active Tab:** Bitcoin orange underline with glow
- **Inactive Tab:** Gray text, transparent
- **Security Warning:** Amber background (#F59E0B 10% opacity), 4px left border

---

## 5. Import Badge Design

### Visual Appearance
```
Account Name ↓
             ↑
        Blue icon (16px)
        Color: #60A5FA
        Download arrow symbol
```

### Tooltip
```
┌───────────────────────────────────────┐
│ Imported account - Back up separately │
└───────────────────────────────────────┘
  Dark background, white text
  Appears after 300ms hover
```

### Usage in Account List
```
✓ Account 1                    [Native SegWit]
  Account 2                    [SegWit]
  Imported Wallet ↓            [Legacy]          ← Badge here
  Multisig Vault               [2-of-3]
```

---

## 6. Form Validation States

### Input Field States
```
DEFAULT (Untouched):
  ┌────────────────────┐
  │ Enter name_        │  Border: Gray-700 #3F3F3F
  └────────────────────┘

FOCUSED (Typing):
  ┌────────────────────┐
  │ My Account_        │  Border: Orange #F7931A
  └────────────────────┘  Focus ring: 3px orange glow

VALID (After blur):
  ┌────────────────────┐
  │ My Account     ✓   │  Border: Green #22C55E
  └────────────────────┘  Success ring: 3px green glow

INVALID (After blur):
  ┌────────────────────┐
  │ A                  │  Border: Red #EF4444
  └────────────────────┘  Error ring: 3px red glow
  ⚠️ Name must be 2-30 characters
```

---

## 7. Address Type Selector

### Dropdown Options
```
┌────────────────────────────────────────────┐
│ Native SegWit (Recommended) [RECOMMENDED]  │ ← Default
│ • Lower fees and better privacy            │
│ • tb1... addresses                          │
│ • BIP84 (m/84'/1'/N'/0/0)                  │
├────────────────────────────────────────────┤
│ SegWit                                      │
│ • Moderate fees, good compatibility        │
│ • 2... addresses                            │
│ • BIP49 (m/49'/1'/N'/0/0)                  │
├────────────────────────────────────────────┤
│ Legacy                                      │
│ • Widest compatibility, higher fees        │
│ • m/n... addresses                          │
│ • BIP44 (m/44'/1'/N'/0/0)                  │
└────────────────────────────────────────────┘
```

### Recommended Badge
```
[RECOMMENDED]  ← Orange text on orange-subtle background
               10px uppercase, semibold
               Bitcoin orange color
```

---

## 8. Success Toast Notifications

### Create Account Success
```
┌────────────────────────────────────────┐
│ ✓ Account created successfully         │
│   "My Savings Account" has been added  │
└────────────────────────────────────────┘
  Position: Top-right
  Duration: 3 seconds
  Background: Green-subtle
  Border: Green-500
  Animation: Slide in from right
```

### Import Account Success
```
┌────────────────────────────────────────┐
│ ✓ Account imported successfully        │
│   "Imported Paper Wallet" ↓            │ ← Shows badge
│   Remember to back up this key!        │ ← Reminder
└────────────────────────────────────────┘
  Duration: 5 seconds (longer for warning)
```

---

## 9. Security Warning Banners

### Private Key Import Warning
```
┌────────────────────────────────────────────────┐
│ ⚠️  Warning: Imported accounts are NOT backed │
│     up by your wallet's main seed phrase.     │
│     You must back up this private key         │
│     separately or risk losing funds.          │
└────────────────────────────────────────────────┘
  Background: Amber-subtle (10% opacity)
  Left Border: 4px solid amber-500
  Icon: Warning triangle (24px, amber-400)
  Text: 13px, amber-100
  Bold words: "NOT backed up", "separately"
```

### Seed Phrase Import Warning
```
┌────────────────────────────────────────────────┐
│ ⚠️  Warning: This account uses a different    │
│     seed phrase than your main wallet. Back   │
│     it up separately or risk losing funds.    │
└────────────────────────────────────────────────┘
  Same visual style as private key warning
```

---

## 10. Modal Backdrop

### Backdrop Style
```
Full viewport overlay
  Background: rgba(0, 0, 0, 0.7) - 70% black
  Backdrop Filter: blur(8px)
  Click outside: Close modal (with confirmation if form dirty)
  ESC key: Close modal (with confirmation if form dirty)

Modal Container:
  Width: 800px
  Max Width: 90vw (responsive)
  Background: #1A1A1A (gray-900)
  Border: 1px solid #3F3F3F (gray-700)
  Border Radius: 16px (rounded-2xl)
  Box Shadow: 0 20px 60px rgba(0, 0, 0, 0.6)
  Animation: Scale in + fade in (250ms)
```

---

## 11. Color Palette Quick Reference

### Primary Colors
- **Bitcoin Orange:** `#F7931A`
- **Bitcoin Orange Hover:** `#FF9E2D`
- **Bitcoin Orange Active:** `#E88711`

### Backgrounds
- **Gray-950 (Body):** `#0F0F0F`
- **Gray-900 (Modal/Cards):** `#1A1A1A`
- **Gray-850 (Elevated):** `#1E1E1E`

### Borders
- **Gray-750:** `#2E2E2E`
- **Gray-700:** `#3F3F3F`
- **Gray-600:** `#4A4A4A`

### Text
- **White:** `#FFFFFF`
- **Gray-300:** `#D1D5DB`
- **Gray-400:** `#9CA3AF`
- **Gray-500:** `#6B7280`

### Semantic Colors
- **Success Green:** `#22C55E`
- **Error Red:** `#EF4444`
- **Warning Amber:** `#F59E0B`
- **Info Blue:** `#60A5FA`

---

## 12. Spacing Quick Reference

### Modal Spacing
- Header Padding: `24px 32px`
- Content Padding: `32px 32px 24px`
- Footer Padding: `20px 32px`
- Section Gap: `24px`
- Field Gap: `16px`

### Button Spacing
- Height: `44px` (footer), `48px` (dropdown)
- Padding: `12px 24px` (secondary), `12px 32px` (primary)
- Border Radius: `8px`

### Input Spacing
- Height: `48px`
- Padding: `12px 16px`
- Border Radius: `8px`

---

## 13. Typography Quick Reference

### Modal Typography
- **Title:** 20px, Semibold, -0.01em tracking
- **Field Label:** 14px, Medium
- **Input Text:** 14px, Regular
- **Helper Text:** 12px, Regular, Gray-400
- **Error Text:** 12px, Regular, Red-500
- **Button Text:** 14px, Semibold

### Monospace (Keys/Seeds)
- **Font:** SF Mono, Monaco, Courier New
- **Size:** 13px
- **Tracking:** -0.02em

---

## 14. Animation Timing

### Modal Animations
- **Backdrop Fade In:** 200ms ease-out
- **Modal Scale In:** 250ms ease-out
- **Toast Slide In:** 300ms ease-out

### Interaction Animations
- **Button Hover:** 150ms ease
- **Input Focus:** 150ms ease
- **Dropdown Open:** 150ms ease-out

---

## 15. Accessibility Checklist

### Keyboard Navigation
- ✅ Tab navigation through all interactive elements
- ✅ Enter/Space to activate buttons
- ✅ Escape to close modals
- ✅ Arrow keys in dropdowns
- ✅ Focus indicators visible (2px outline, 2px offset)

### Screen Reader Support
- ✅ ARIA labels on all inputs
- ✅ ARIA-describedby for helper/error text
- ✅ ARIA-required for required fields
- ✅ ARIA-invalid for error states
- ✅ Role="dialog" and aria-modal="true" for modals
- ✅ Live regions for success/error announcements

### Color Contrast
- ✅ All text meets WCAG 2.1 AA (4.5:1 minimum)
- ✅ Focus indicators have sufficient contrast
- ✅ Error states distinguishable by more than color alone

---

## 16. Component File Structure

```
src/tab/components/
├── AccountManagement/           ← NEW
│   ├── AccountCreationModal.tsx
│   ├── ImportAccountModal.tsx
│   ├── PrivateKeyImport.tsx
│   ├── SeedPhraseImport.tsx
│   ├── SecurityWarning.tsx
│   └── AddressTypeSelector.tsx  (adapted from MultisigSetup)
│
├── shared/
│   ├── Modal.tsx                ← REUSE (no changes)
│   ├── Toast.tsx                ← REUSE (no changes)
│   ├── FormField.tsx            ← NEW
│   └── ImportBadge.tsx          ← NEW
│
└── Dashboard.tsx                ← UPDATE
```

---

## 17. Implementation Priority

### Phase 1: Dropdown Updates (1-2 days)
1. Update Dashboard.tsx dropdown layout
2. Add three buttons with correct hierarchy
3. Create ImportBadge component
4. Test keyboard navigation

### Phase 2: Create Account Modal (2-3 days)
1. Create AccountCreationModal component
2. Implement form validation
3. Wire to backend API
4. Add success/error handling

### Phase 3: Import Account Modal (3-4 days)
1. Create ImportAccountModal component
2. Implement tab navigation
3. Create security warning banner
4. Implement both import methods
5. Wire to backend APIs

### Phase 4: Testing & Polish (1-2 days)
1. Manual testing (all flows)
2. Accessibility testing
3. Visual polish
4. Bug fixes

**Total Estimated Time:** 7-11 days

---

## Quick Links

- **Full Design Spec:** `ACCOUNT_MANAGEMENT_DESIGN_SPEC.md`
- **Product Requirements:** `ACCOUNT_DROPDOWN_SINGLESIG_PRD.md`
- **Designer Notes:** `../../ui-ux-designer-notes.md`
- **Design System:** See Section 3 of Designer Notes

---

**Last Updated:** October 18, 2025
**Status:** ✅ Ready for Implementation
