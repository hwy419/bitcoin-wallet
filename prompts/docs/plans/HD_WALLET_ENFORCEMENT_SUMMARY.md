# HD Wallet Enforcement - Executive Summary

**Version**: 1.0
**Created**: October 27, 2025
**Designer**: UI/UX Designer (Claude Code)
**Status**: Ready for Review & Implementation

---

## Overview

This specification enforces HD-only wallet creation at setup while maintaining support for imported private key accounts post-setup. The design introduces clear visual segregation between HD-derived accounts and imported accounts across all UI surfaces.

---

## Problem

**Current Issues:**
1. Wallet Setup allows private key import as initial wallet creation → creates non-HD wallets
2. Account Switcher shows flat list with no visual distinction between HD and imported accounts
3. Settings screen shows "Export Xpub" button for imported accounts (incorrect - they have no xpub)
4. Users confused about wallet structure and account types

**User Impact:**
- Confusion about HD vs imported accounts
- Accidental creation of non-HD wallets (defeating the purpose of HD architecture)
- Security risk (incorrect export button visibility)
- Poor UX (no organization, cluttered interface)

---

## Solution

### 1. Wallet Setup Flow Redesign

**BEFORE (4 tabs):**
```
[Create] [Seed] [Key] [Backup]
```

**AFTER (3 tabs):**
```
[Create Wallet] [Import Wallet] [Restore from Backup]
```

**Changes:**
- ❌ Remove "Key" tab (no private key import at setup)
- ✅ Rename "Seed" → "Import Wallet" (clearer intent)
- ✅ Rename "Backup" → "Restore from Backup" (clearer action)
- ✅ Add info box in "Import Wallet" tab explaining where private key import happens

**Result:** Only seed-based wallet creation at setup. Private key import moves to post-setup.

---

### 2. Account Grouping - Sidebar

**BEFORE:**
```
Flat list of all accounts (no grouping)
```

**AFTER:**
```
HD-DERIVED ACCOUNTS           ▼ (2)
• Main Account           [HD]
• Savings                [HD]

IMPORTED ACCOUNTS             ▼ (1)
• Imported Ledger   [🔑 Imported]

MULTISIG ACCOUNTS             ▼ (1)
• 2-of-3 Safe           [🔐 2/3]
```

**Changes:**
- ✅ Three collapsible sections with headers
- ✅ Account count badges in headers
- ✅ Type badges on each account (HD, Imported, Multisig)
- ✅ Visual dividers between sections
- ✅ Empty sections hidden automatically
- ✅ Collapse state saved to localStorage

**Result:** Clear visual hierarchy. Users instantly understand account structure.

---

### 3. Account Grouping - Settings Screen

**BEFORE:**
```
Flat list with incorrect export buttons
```

**AFTER:**
```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ HD-DERIVED ACCOUNTS      + Create   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Educational description text...

Main Account                    [HD]
Native SegWit (Bech32)

[Export Xpub] [Export Key] [Rename] [Delete]

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ IMPORTED ACCOUNTS        + Import   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

Educational description text...

Imported Ledger        [🔑 Imported]
Native SegWit (Bech32)

[Export Key] [Rename] [Delete]
(NO "Export Xpub" - imported accounts don't have xpubs)
```

**Changes:**
- ✅ Three sections with prominent headers
- ✅ Educational descriptions under each header
- ✅ Context-aware action buttons in headers (+ Create, + Import, + Create Multisig)
- ✅ Type badges on account cards
- ✅ Export button logic respects account type
- ✅ Empty states with clear CTAs

**Result:** Users understand what each account type means and see correct export options.

---

### 4. Export Button Logic (Context-Aware)

**Decision Matrix:**

| Account Type | Import Type | Export Xpub? | Export Key? |
|--------------|-------------|--------------|-------------|
| Single-sig   | HD          | ✅ YES       | ✅ YES      |
| Single-sig   | Private Key | ❌ NO        | ✅ YES      |
| Multisig     | HD          | ✅ YES       | ❌ NO       |
| Multisig     | Imported    | ✅ YES       | ❌ NO       |

**Logic:**
- **Export Xpub**: Show for HD-derived single-sig and all multisig accounts. Hide for imported private key accounts.
- **Export Key**: Show for all single-sig accounts (HD and imported). Hide for multisig accounts.

**Implementation:** Conditional rendering (hide unavailable buttons, don't disable them).

**Result:** Users only see buttons that make sense for their account type. No confusion.

---

## Key Design Decisions

### 1. HD-Only Wallet Creation
**Decision:** Remove private key import from initial wallet setup.

**Rationale:**
- Aligns with industry standards (MetaMask, Ledger, Trust Wallet)
- HD wallets are superior (unlimited accounts, single backup)
- Private key import is for adding *individual accounts*, not creating *wallets*
- Reduces cognitive load during setup

**Trade-off:** Users who only want to import a single private key must create HD wallet first. Mitigated by clear info box explaining this.

---

### 2. Visual Segregation (Grouped Sections)
**Decision:** Group accounts by derivation type with collapsible sections.

**Rationale:**
- Immediate visual clarity (no need to read badges to understand structure)
- Scalable (works with 1 account or 100 accounts)
- Educational (section headers + descriptions teach users about account types)
- Reduces clutter (collapse sections you don't use)

**Trade-off:** More vertical space when all sections expanded. Mitigated by collapsible sections with state persistence.

---

### 3. Conditional Export Buttons
**Decision:** Hide unavailable export buttons instead of showing them disabled.

**Rationale:**
- Cleaner UI (no visual clutter)
- Reduces confusion ("Why is this button grayed out?")
- Progressive disclosure (only show what's relevant)

**Alternative Considered:** Show disabled buttons with tooltips. Rejected because it clutters the interface.

---

### 4. Badge System
**Decision:** Use color-coded badges to indicate account type.

**Rationale:**
- Quick visual scanning (color + icon + text)
- Accessible (not relying on color alone - also has text and icons)
- Consistent across Sidebar and Settings
- Educational (tooltips explain what each badge means)

**Color Choices:**
- Blue (HD): Trust, reliability, standard practice
- Amber (Imported): Warning, different from norm, requires separate backup
- Purple (Multisig): Special, advanced feature

---

## User Journey Changes

### Journey 1: First-Time Wallet Creation (HD)
**BEFORE:** User could accidentally create non-HD wallet by clicking "Key" tab.

**AFTER:** Only seed-based options at setup. User creates HD wallet, can import private keys later if needed.

**Result:** All users start with HD wallet foundation.

---

### Journey 2: User Wants to Import Private Key
**BEFORE:** User clicks "Key" tab at setup → creates non-HD wallet → confused why "Create Account" doesn't work as expected.

**AFTER:**
1. User sees "Create Wallet" and "Import Wallet" (seed-based)
2. Reads info box: "Need to import private key? Create wallet first"
3. Creates HD wallet (or imports seed)
4. Opens account switcher → "Import Account"
5. Imports private key as additional account
6. Now has: HD wallet (primary) + imported account (clearly labeled)

**Result:** Clear separation. HD wallet is foundation, imported keys are additions.

---

## Implementation Plan

### Phase 1: Wallet Setup (2-3 hours)
**File:** `src/tab/components/WalletSetup.tsx`
- Remove "Key" tab
- Update tab labels
- Add info box component

### Phase 2: Sidebar Grouping (4-5 hours)
**Files:** `Sidebar.tsx` + new badge/header components
- Group accounts by type
- Render collapsible sections
- Add badges
- Implement collapse state

### Phase 3: Settings Grouping (5-6 hours)
**File:** `SettingsScreen.tsx`
- Group accounts by type
- Add section headers with descriptions
- Add badges
- Implement export button logic
- Add empty states

### Phase 4: Export Logic (2 hours)
**File:** `SettingsScreen.tsx`
- Conditional rendering for export buttons
- Add tooltips
- Update aria-labels

**Total Effort:** 13-16 hours implementation + 4-5 hours testing = **~3 days**

---

## Edge Cases Handled

1. **Only HD accounts** → Imported/Multisig sections hidden (clean UI)
2. **Only imported accounts** → HD section shows empty state with CTA
3. **Only multisig accounts** → Other sections hidden
4. **Mixed accounts** → All sections visible with appropriate accounts
5. **Zero accounts in section** → Section hidden (not shown empty)

---

## Accessibility Highlights

- ✅ WCAG AA color contrast on all badges and text
- ✅ Keyboard navigation (Tab, Enter, Space, Arrows, Escape)
- ✅ ARIA labels on all interactive elements
- ✅ Screen reader announcements for section state changes
- ✅ Focus management (modals, dropdowns)
- ✅ Tooltips accessible on keyboard focus
- ✅ Touch targets 44x44px minimum

---

## Success Metrics

**After Implementation:**
1. **Zero non-HD wallets created at setup** (enforced by removing "Key" tab)
2. **95% of users can identify account type** within 3 seconds (visual badges)
3. **Zero "Export Xpub" errors for imported accounts** (conditional rendering)
4. **80% reduction in account structure confusion** (grouped sections + education)
5. **Support ticket reduction** for export-related questions (clear button logic)

---

## Documentation

**Main Spec (50,000+ words):**
[HD_WALLET_ENFORCEMENT_UX_SPEC.md](./HD_WALLET_ENFORCEMENT_UX_SPEC.md)

**Visual Guide (ASCII wireframes, color charts, code examples):**
[HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md](./HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md)

**This Summary:**
[HD_WALLET_ENFORCEMENT_SUMMARY.md](./HD_WALLET_ENFORCEMENT_SUMMARY.md)

---

## Next Steps

### 1. Review & Approval
- [ ] Product Manager: Requirements validation
- [ ] Frontend Developer: Feasibility check
- [ ] Backend Developer: Data structure compatibility
- [ ] Security Expert: Private key handling review

### 2. Implementation
- [ ] Phase 1: Wallet Setup (2-3 hours)
- [ ] Phase 2: Sidebar Grouping (4-5 hours)
- [ ] Phase 3: Settings Grouping (5-6 hours)
- [ ] Phase 4: Export Logic (2 hours)

### 3. Testing
- [ ] Manual testing (all edge cases)
- [ ] Accessibility testing (keyboard, screen reader)
- [ ] Visual QA (badges, colors, spacing)
- [ ] User acceptance testing

### 4. Documentation Updates
- [ ] Update CHANGELOG.md
- [ ] Update README.md (user guide)
- [ ] Update expert notes (design, frontend, backend)

---

## Questions for Review

1. **Product**: Do we want to allow ANY private key import at setup, even with strong warnings?
2. **Frontend**: Are collapsible sections performant with 100+ accounts?
3. **Backend**: Do we need to add `importType` field to existing wallet data, or can we infer it?
4. **Security**: Should imported accounts have different UI treatment to emphasize separate backup requirements?

---

## Approval

**Designer:** ✅ Ready for review
**Product Manager:** ⏳ Pending review
**Frontend Developer:** ⏳ Pending review
**Backend Developer:** ⏳ Pending review
**Security Expert:** ⏳ Pending review

---

**Document Version:** 1.0
**Created:** October 27, 2025
**Status:** Ready for Implementation

**Related Documents:**
- [HD_WALLET_ENFORCEMENT_UX_SPEC.md](./HD_WALLET_ENFORCEMENT_UX_SPEC.md) - Full specification
- [HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md](./HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md) - Visual reference
