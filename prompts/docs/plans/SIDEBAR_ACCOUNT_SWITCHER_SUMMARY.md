# Sidebar Account Switcher - Executive Summary

**Design Status:** ✅ Complete - Ready for Implementation
**Date:** 2025-10-18
**Designer:** UI/UX Designer Agent
**Version:** 1.0

---

## Overview

This design consolidates all account management functionality into an enhanced sidebar account switcher, replacing the current split implementation between the Dashboard header dropdown and non-functional sidebar button.

---

## Problem Statement

**Current Issues:**
1. Account management split between two locations (Dashboard header and sidebar)
2. Sidebar switcher button is non-functional (placeholder only)
3. Account switching only available from Dashboard/Assets view
4. Not accessible from Multisig, Contacts, or Settings views
5. Redundant UI elements causing user confusion

---

## Design Solution

### Enhanced Sidebar Account Switcher

**Component Type:** Dropdown panel (appears above button, extends to the right)

**Structure:**
```
┌─────────────────────────────────┐
│ DROPDOWN PANEL (256px wide)     │
│                                 │
│ ┌─ ACCOUNT LIST ──────────────┐ │
│ │ Account 1 (selected) ✓      │ │  <- Scrollable if >5 accounts
│ │ Account 2                   │ │
│ │ Imported Account 🔽         │ │  <- With badges
│ │ Multisig 2-of-3 👥          │ │
│ └─────────────────────────────┘ │
│ ────────────────────────────────│  <- Divider
│ ┌─ ACTION BUTTONS ────────────┐ │
│ │ [Create Account] 🟠         │ │  <- Primary (orange)
│ │ [Import Account]            │ │  <- Secondary (gray)
│ │ [Create Multisig] ↗         │ │  <- Secondary (gray)
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Key Features

### 1. Universal Access
- Available from **all views** (Assets, Multisig, Contacts, Settings)
- Always accessible in sidebar, no view-specific restrictions

### 2. Account List
- Shows all accounts with avatars (initial circle)
- Displays account name, address type
- Shows badges (ImportBadge 🔽, MultisigBadge 👥)
- Checkmark ✓ on currently selected account
- Scrollable when >5-6 accounts (`max-h-[320px]`)

### 3. Action Buttons
- **Create Account** (primary orange) - Opens create modal
- **Import Account** (secondary gray) - Opens import modal
- **Create Multisig** (secondary gray with ↗) - Navigates to wizard

### 4. Interactions
- Click button → Toggle dropdown
- Click account → Switch account + close dropdown
- Click action button → Trigger action + close dropdown
- Click outside → Close dropdown
- Press Escape → Close dropdown

---

## Visual Design

### Dimensions
- **Sidebar:** 240px (w-60)
- **Dropdown:** 256px (w-64) - extends 16px beyond sidebar
- **Position:** Appears above button with 8px gap
- **Max Height:** 320px for account list (scrollable)

### Colors
- **Background:** `bg-gray-800` (consistent with sidebar)
- **Border:** `border-gray-700` with `rounded-xl`
- **Selected:** `bg-bitcoin-subtle` with orange left border
- **Hover:** `bg-gray-750`
- **Primary Button:** Bitcoin orange (#f7931a)
- **Secondary Buttons:** Gray with white text on hover

### Animations
- Dropdown: 150ms slide-down animation
- Arrow: 200ms rotation (down → up when open)
- Transitions: 200ms ease-in-out on all interactive elements

---

## Changes Required

### Phase 1: Sidebar Component
- Add new props (accounts, currentAccountIndex, event handlers)
- Implement dropdown panel structure
- Add account list with mapping over accounts
- Add action buttons section
- Implement click-outside detection
- Add Escape key handler
- Import ImportBadge and MultisigBadge components

### Phase 2: App.tsx Integration
- Add currentAccountIndex state
- Implement onAccountSwitch handler
- Pass new props to Sidebar
- Handle create/import modal state
- Handle multisig navigation

### Phase 3: Dashboard Cleanup
- **Remove** account dropdown from header (lines 364-470)
- **Remove** account dropdown state
- Simplify header to show balance/title only

### Phase 4: Testing
- Test with 0, 1, 5, 10+ accounts
- Test account switching updates all views
- Test all action button flows
- Test click outside and Escape key
- Test with long account names (truncation)
- Test with badges (import, multisig)
- Verify animations and accessibility

---

## Benefits

### User Experience
✅ **Single Source of Truth:** All account management in one location
✅ **Universal Access:** Available from every view, not just Dashboard
✅ **Reduced Complexity:** Eliminates redundant dropdown in Dashboard
✅ **Consistent Pattern:** Matches sidebar navigation paradigm
✅ **Better Discovery:** Account actions always visible in sidebar

### Technical
✅ **Component Reuse:** Leverages existing ImportBadge, MultisigBadge
✅ **Clean Architecture:** Centralizes account state management
✅ **Maintainability:** Single component to update for account features
✅ **Accessibility:** ARIA labels, keyboard support, screen reader friendly

---

## Documentation

### Complete Specifications
1. **SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md** (40+ pages)
   - Complete component specifications
   - Props and state definitions
   - Visual design specifications
   - Interaction patterns
   - Code snippets
   - Implementation checklist

2. **SIDEBAR_ACCOUNT_SWITCHER_VISUAL_GUIDE.md** (15+ pages)
   - ASCII diagrams and visual examples
   - Component state visualizations
   - Color reference chart
   - Animation timelines
   - Testing checklist

3. **ui-ux-designer-notes.md** (Updated)
   - Added to Recent Design Work section
   - Cross-references to related patterns
   - Design decision rationale

---

## Next Steps

### For Frontend Developer:

1. **Read the Specifications:**
   - Review `SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md` for complete details
   - Reference `SIDEBAR_ACCOUNT_SWITCHER_VISUAL_GUIDE.md` for visual examples

2. **Follow Implementation Phases:**
   - Phase 1: Update Sidebar component
   - Phase 2: Integrate with App.tsx
   - Phase 3: Clean up Dashboard component
   - Phase 4: Test thoroughly
   - Phase 5: Update documentation

3. **Use Provided Code Snippets:**
   - Section 12 of design spec has complete code examples
   - Copy/paste for dropdown structure, account items, buttons
   - Includes click-outside detection logic

4. **Test Checklist:**
   - Reference Section 11 for complete implementation checklist
   - Use testing scenarios from visual guide

---

## Design Patterns Applied

### Dropdown Panel Pattern
- Consistent with existing Dashboard dropdown (same visual style)
- Positioned to avoid blocking content (extends into main area)
- Z-index 50 for proper layering
- Click-outside and Escape key for dismissal

### Account Item Pattern
- Avatar circle with initial (existing pattern)
- Badge indicators for special account types
- Checkmark for selection state
- Hover states for interactivity

### Button Hierarchy Pattern
- Primary action (Create) uses Bitcoin orange
- Secondary actions (Import, Multisig) use gray
- Icon + text for clarity
- External link indicator for navigation actions

---

## Accessibility Compliance

✅ **ARIA Labels:** All interactive elements labeled
✅ **Semantic HTML:** Proper roles (menu, menuitem)
✅ **Keyboard Support:** Tab navigation, Escape to close
✅ **Focus Management:** Proper focus handling on open/close
✅ **Screen Reader:** Announces states and actions
✅ **Color Contrast:** Meets WCAG AA standards

---

## Responsive Considerations

**Fixed Viewport:** Chrome extension with minimum width ~800px
- Sidebar: 240px fixed
- Dropdown: 256px fixed, extends into content area
- No mobile/tablet breakpoints needed
- Scales well from minimum to maximum viewport sizes

---

## Future Enhancements (Out of Scope)

These are documented but NOT required for initial implementation:

- **Account Search/Filter:** When user has 20+ accounts
- **Account Grouping:** Group by type (HD, Imported, Multisig)
- **Drag-to-Reorder:** Custom account ordering
- **Quick Actions:** Hover menu for rename/delete/export

---

## Success Criteria

### Functional Requirements
- [ ] Dropdown opens/closes on button click
- [ ] All accounts displayed with correct information
- [ ] Account switching works from all views
- [ ] All three action buttons trigger correct flows
- [ ] Click outside and Escape close dropdown
- [ ] Badges display correctly for imported/multisig accounts

### Visual Requirements
- [ ] Matches design specifications (colors, spacing, typography)
- [ ] Animations smooth and performant
- [ ] Scrolling works correctly with many accounts
- [ ] Selected state visually distinct
- [ ] Hover states provide clear feedback

### UX Requirements
- [ ] Quick and easy to switch accounts
- [ ] Intuitive action button placement
- [ ] No confusion about account management location
- [ ] Works consistently across all views
- [ ] Dashboard simplified (dropdown removed)

---

## Risk Assessment

### Low Risk
- Well-defined specifications with complete code examples
- Reuses existing components (ImportBadge, MultisigBadge)
- Follows established patterns (dropdown, badges, buttons)
- Non-breaking change (additive functionality)

### Mitigation Strategies
- **Testing:** Thorough testing with various account counts
- **Fallbacks:** Graceful handling of edge cases (0 accounts, long names)
- **Accessibility:** Built-in ARIA and keyboard support from start
- **Documentation:** Comprehensive specs reduce implementation ambiguity

---

## Estimated Implementation Time

**Total:** 4-6 hours for experienced React developer

- **Phase 1 (Sidebar):** 2 hours
- **Phase 2 (App.tsx):** 1 hour
- **Phase 3 (Dashboard):** 30 minutes
- **Phase 4 (Testing):** 1.5 hours
- **Phase 5 (Docs):** 30 minutes

---

## Contact & Questions

**Design Owner:** UI/UX Designer Agent
**Documentation:** See `prompts/docs/plans/` for complete specifications
**Expert Notes:** `prompts/docs/ui-ux-designer-notes.md` (updated with this design)

For implementation questions or clarifications, refer to the detailed design specification or invoke the `ui-ux-designer` agent.

---

**Status:** ✅ Design Complete - Ready for Frontend Developer Implementation
**Last Updated:** October 18, 2025
**Version:** 1.0
