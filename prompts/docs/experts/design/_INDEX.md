# UI/UX Designer - Quick Reference

**Last Updated**: October 30, 2025
**Role**: UI/UX Designer
**Purpose**: Design system, user flows, accessibility, visual design

---

## Current Status

### Implemented ✅
- Design system (colors, typography, spacing)
- Dark mode color palette (WCAG AA compliant)
- Tab-based layout (800px centered, 240px sidebar)
- Sidebar navigation with account switcher
- Multisig wizard flow (full-tab design)
- Transaction detail pane
- Privacy indicators and badges (v0.11.0)
- Account management modals
- Import/export flows

### In Progress ⏳
- Privacy mode UI patterns (implementation)
- Transaction list pagination & filtering (v0.12.0)
- Address list pagination & creation order (v0.12.0)

### Planned 📋
- Hardware wallet connect flow
- Advanced settings redesign
- Onboarding improvements
- Mobile responsive behavior

---

## Documentation Map

### Core Documentation (Segmented)
- [**design-system.md**](./design-system.md) - Colors, typography, spacing, tokens, dark mode palette
- [**components.md**](./components.md) - Component specs, states, variations, UI patterns
- [**user-flows.md**](./user-flows.md) - Flow diagrams, user journeys, interaction patterns
- [**accessibility.md**](./accessibility.md) - A11y guidelines, WCAG compliance, ARIA patterns
- [**decisions.md**](./decisions.md) - Design ADRs, UX decisions, trade-offs

### Planning Documents
Located in `/prompts/docs/plans/`:
- **ADDRESS_LIST_PAGINATION_DESIGN_SPEC.md** - Address list pagination & creation order display design (25,000+ words) ⭐ NEW
- **TRANSACTION_LIST_PAGINATION_FILTER_DESIGN_SPEC.md** - Transaction list pagination & filtering design (40,000+ words)
- **LAMBDA_PROXY_UX_DESIGN_SPEC.md** - Lambda proxy UX design (loading states, errors, retry patterns, trust) (35,000+ words)
- **PRIVACY_UI_UX_DESIGN_SPEC.md** - Complete privacy enhancement UI/UX design (50,000+ words)
- **PRIVATE_KEY_EXPORT_IMPORT_UX_SPEC.md** - Private key export/import UX design (30,000+ words)
- **SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md** - Enhanced sidebar account switcher design
- **TAB_BASED_MULTISIG_WIZARD_PRD.md** - Tab-based multisig wizard requirements
- **MULTISIG_WIZARD_TAB_DESIGN_SPEC.md** - Complete multisig wizard UX design
- **SEND_RECEIVE_MODAL_DESIGN_FIX.md** - Modal visual layering fix specification
- **DARK_MODE_DESIGN_SPEC.md** - Complete dark mode design specification

---

## Recent Changes (Last 10)

1. **2025-10-30**: Address list pagination & creation order design specification complete (v0.12.0)
2. **2025-10-30**: Transaction list pagination & filtering design specification complete (v0.12.0)
3. **2025-10-28**: Lambda proxy UX design specification complete (loading states, errors, retry patterns, trust)
4. **2025-10-22**: Documentation segmented into 5 focused files
5. **2025-10-21**: Privacy UI design specification complete (v0.11.0)
6. **2025-10-20**: Send/Receive modal visual layering fix design
7. **2025-10-19**: Private key export/import UX design complete
8. **2025-10-19**: Encrypted wallet backup export UX design
9. **2025-10-18**: Enhanced sidebar account switcher design
10. **2025-10-18**: Account management design specifications

---

## Quick Reference

### Color Palette
```
Bitcoin Orange (Primary): #F7931A
Success Green:            #22C55E (v0.9.0+ for better contrast)
Warning Amber:            #F59E0B
Error Red:                #EF4444
Info Blue:                #3B82F6

Dark Theme:
Body:                     #0F0F0F (gray-950)
Sidebar:                  #1A1A1A (gray-900)
Card Surface:             #1E1E1E (gray-850)
Text Primary:             #FFFFFF
Text Secondary:           #B4B4B4 (gray-400)
```

### Typography
```
Font Family:    System fonts (-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto)
Monospace:      "SF Mono", Monaco, "Courier New" (for addresses, hashes)

Headings:       font-semibold (600)
Body:           font-normal (400)
Labels:         font-medium (500)

Sizes:
  Display:      text-4xl (28px)
  H1:           text-xl (20px)
  H2:           text-lg (18px)
  Body:         text-sm (14px)
  Caption:      text-xs (12px)
```

### Spacing Scale
```
xs:  4px   (space-1)
sm:  8px   (space-2)
md:  16px  (space-4)
lg:  24px  (space-6)
xl:  32px  (space-8)

Common Patterns:
  Card padding:     p-5 or p-6 (20px or 24px)
  Section gaps:     space-y-6 (24px)
  Modal padding:    p-6 (24px)
  Button padding:   py-3 px-6 (12px 24px)
```

### Layout Constraints
```
Sidebar Width:        240px (fixed)
Content Max Width:    1280px (max-w-7xl)
Modal Widths:         560px (compact), 640px (standard), 800px (wide)
Tab Content:          800px centered
```

### Accessibility
```
WCAG Level:           AA Compliant
Minimum Contrast:     4.5:1 (normal text), 3:1 (large text, UI components)
Touch Targets:        44x44px minimum
Focus Indicators:     2px Bitcoin Orange outline with 2px offset
```

---

## Design Principles

1. **Dark-Mode First** - Dark theme is primary, not optional
2. **Bitcoin Orange Brand** - Strong, recognizable brand identity
3. **Progressive Disclosure** - Layer information (simple → detailed)
4. **Privacy Without Friction** - Best privacy is invisible
5. **Accessibility Always** - WCAG AA compliance in all designs
6. **Non-Judgmental** - Educate, don't shame (privacy warnings)
7. **Celebrate Wins** - Positive reinforcement for good behavior

---

## Component Quick Links

### Buttons
- Primary (Bitcoin Orange), Secondary (Outlined), Ghost, Danger, Icon
- See: [components.md - Buttons](./components.md#buttons)

### Inputs
- Text, Password, Textarea, with real-time validation states
- See: [components.md - Input Fields](./components.md#input-fields)

### Cards
- Standard, Elevated, Transaction cards
- See: [components.md - Cards](./components.md#cards)

### Modals
- Overlay, Container, Header, Actions (3 size variants)
- See: [components.md - Modals & Dialogs](./components.md#modals--dialogs)

### Form Controls
- Toggle Switch, Checkbox, Radio, with full ARIA support
- See: [components.md - Form Controls](./components.md#form-controls)

### Privacy Components (v0.11.0)
- PrivacyBadge, InfoBox, PrivacyTooltip
- See: [components.md - Privacy Components](./components.md#privacy-components-v0110)

---

## User Flow Quick Links

### Core Flows
- First-Time Wallet Creation
- Import Existing Wallet
- Unlock Wallet
- See: [user-flows.md - Core Wallet Flows](./user-flows.md#core-wallet-flows)

### Account Management
- Create New Account
- Import Account (Private Key / Seed)
- Switch Accounts
- See: [user-flows.md - Account Management Flows](./user-flows.md#account-management-flows)

### Transactions
- Send Bitcoin (with privacy indicators)
- Receive Bitcoin (auto-generation, fresh badges)
- Transaction History
- See: [user-flows.md - Transaction Flows](./user-flows.md#transaction-flows)

### Multisig
- Create Multisig Wallet (4-step wizard)
- Sign PSBT
- See: [user-flows.md - Multisig Flows](./user-flows.md#multisig-flows)

### Privacy (v0.11.0)
- Enable Privacy Mode Settings
- Send to Contact (Privacy-Aware)
- Add Contact with Privacy
- See: [user-flows.md - Privacy Flows](./user-flows.md#privacy-flows-v0110)

---

## Design Decision Quick Links

### Core Decisions
- Decision 1: Dark Mode as Default
- Decision 2: Bitcoin Orange as Primary Color
- Decision 3: Tab Architecture Over Popup
- See: [decisions.md - Core Design Decisions](./decisions.md#core-design-decisions)

### Component Decisions
- Decision 9: Account Management Modal-Based Forms
- Decision 10: Button Hierarchy in Account Dropdown
- Decision 11: Import Account Security Warnings
- See: [decisions.md - Component Decisions](./decisions.md#component-decisions)

### Privacy Decisions (v0.11.0)
- Decision 17: Privacy-by-Default Architecture
- Decision 18: Non-Judgmental Privacy Language
- Decision 19: Progressive Disclosure for Privacy Education
- Decision 20: Celebrate Privacy Wins
- See: [decisions.md - Recent Decisions](./decisions.md#recent-decisions-v0110)

---

## Migration Notes

**Original Document**: `prompts/docs/ui-ux-designer-notes.md` (6595 lines, 61,212 tokens)

**Segmentation Date**: October 22, 2025

**New Structure**:
1. **design-system.md** - Colors, typography, spacing, dark mode (comprehensive token reference)
2. **components.md** - All component specifications with code examples
3. **user-flows.md** - Complete flow diagrams and user journeys
4. **accessibility.md** - WCAG compliance, ARIA patterns, keyboard navigation
5. **decisions.md** - 20 design ADRs with rationale and alternatives

**Benefits**:
- Faster navigation (find specific info quickly)
- Better organization (related content grouped)
- Easier maintenance (update one area without affecting others)
- Clearer cross-references (explicit links between documents)
- Better version control (smaller diffs, clearer changes)

**Note**: Original monolithic file preserved for reference until team confirms migration successful.

---

**Need detailed information?** Navigate to the specific documentation files linked above.

**Questions?** Check the related planning documents in `/prompts/docs/plans/` for comprehensive design specifications.
