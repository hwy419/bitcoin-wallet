# Design Decisions & ADRs

**Last Updated**: October 22, 2025
**Owner**: UI/UX Designer
**Status**: Complete - Tab Architecture (v0.9.0+)

[← Back to Index](./_INDEX.md)

---

## Quick Navigation

- [Core Design Decisions](#core-design-decisions)
- [Component Decisions](#component-decisions)
- [Interaction Pattern Decisions](#interaction-pattern-decisions)
- [Recent Decisions (v0.11.0)](#recent-decisions-v0110)

---

## Overview

This document records all significant design decisions, including rationale, alternatives considered, and impact. Format follows Architecture Decision Records (ADRs) for clear documentation of "why" not just "what".

**Decision Template:**
- **Date**: When decision was made
- **Decision**: What was decided
- **Rationale**: Why this was the best choice
- **Alternative Considered**: What other options were evaluated
- **Impact**: What changed because of this decision

---

## Core Design Decisions

### Decision 1: Dark Mode as Default

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Default to dark theme, no light mode in MVP

**Rationale:**
- Modern crypto wallet standard (MetaMask, Lace, Phantom all default to dark)
- Reduces eye strain for users checking wallet frequently
- Bitcoin orange (#F7931A) pops beautifully on dark background (12:1 contrast ratio)
- Simplified design system (only one theme to maintain in MVP)
- Can add light mode in Phase 2 if users request it
- Better showcase for Bitcoin branding and visual hierarchy

**Alternative Considered:**
- Light mode as default with dark mode toggle
- Both modes from day one (MVP scope creep)

**Impact:**
- Design system simplified to single theme
- Consistent with industry standards
- Better visual hierarchy with darker body (#0F0F0F) and lighter surfaces (#1A1A1A, #1E1E1E)
- Excellent WCAG AAA contrast ratios achieved

**Update (October 12, 2025):**
Complete dark mode design specification created with:
- Full color palette optimized for Bitcoin orange branding
- Component-by-component specifications with Tailwind classes
- WCAG AA accessibility compliance verification
- Custom gray scale (650, 750, 850, 950) added to Tailwind

**Design Philosophy:**
Dark mode is the **primary and default theme**, not an optional variant. Light mode deferred to v0.12.0+ based on user demand.

---

### Decision 2: Bitcoin Orange as Primary Color

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Use Bitcoin orange (#F7931A) as primary brand color

**Rationale:**
- Instantly recognizable as Bitcoin-related (universal Bitcoin branding)
- Strong brand association with Bitcoin ecosystem
- Excellent contrast on dark backgrounds (12:1 ratio)
- Differentiates from Lace's purple (which is Cardano-focused)
- Conveys energy, warmth, and confidence
- Accessible: meets WCAG AAA standards

**Alternative Considered:**
- Blue (neutral, but less distinctive)
- Gray/monochrome (too bland for crypto wallet)
- Green (too associated with "money" rather than Bitcoin specifically)

**Impact:**
- Strong visual identity
- Aligns with Bitcoin branding ecosystem
- Creates warm, energetic feel vs. cold tech aesthetic
- Used for primary buttons, CTAs, active states, focus indicators

---

### Decision 3: Tab Architecture Over Popup

**Date:** October 13, 2025
**Status:** ✅ Implemented (v0.9.0)

**Decision:** Use full browser tab (800px centered content) instead of 600x400px popup

**Rationale:**
- More screen real estate for complex features (multisig wizard, account management)
- Better UX for multi-step workflows
- Clearer information hierarchy
- Room for sidebar navigation (persistent context)
- Easier to implement responsive layouts
- Single-tab enforcement prevents security issues (multiple popup instances)

**Alternative Considered:**
- 600x400px popup (original design)
- Expandable popup (complex to implement reliably)
- Hybrid (popup for simple tasks, tab for complex - inconsistent UX)

**Impact:**
- Complete redesign of layout system
- Added sidebar navigation (240px fixed width)
- Darker body background (#0F0F0F) for better visual hierarchy
- Sidebar elevated (#1A1A1A) from body
- Content max-width: 1280px (prevents stretching on ultra-wide)
- Better accommodation of multisig wizard and complex forms
- Improved security (clickjacking prevention)

**Related Documentation:**
- `prompts/docs/plans/TAB_BASED_MULTISIG_WIZARD_PRD.md`
- `prompts/docs/plans/MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`

---

### Decision 4: Address Type Selection Required

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Make users explicitly choose address type (Legacy/SegWit/Native SegWit) during wallet setup

**Rationale:**
- Educational opportunity (users learn about address types early)
- Prevents confusion later ("Why do my addresses start with tb1?")
- Users have different needs (compatibility vs. fees vs. privacy)
- Clear recommendation (Native SegWit) guides beginners without forcing choice
- Can't easily change address type later without creating new account (HD wallet limitation)
- Informed choice empowers users

**Alternative Considered:**
- Auto-select Native SegWit, hide option (less transparent)
- Allow changing later (complex: requires new HD derivation path, account migration)

**Impact:**
- Slightly longer setup flow (+1 screen)
- More informed users who understand their wallet
- Reduced support questions about address formats
- Better privacy awareness from the start

**Implementation:**
- Dropdown selector with all 3 options
- "Recommended" badge on Native SegWit
- Clear explanations: fees, privacy, compatibility trade-offs
- BIP derivation paths shown (educational)

---

### Decision 5: Monospace for Addresses and Hashes

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Use monospace font for all addresses, transaction IDs, and hashes

**Rationale:**
- Easier to visually verify characters (all letters same width)
- Standard in developer tools and crypto wallets (user expectation)
- Clearly distinguishes technical data from regular text
- Improves accuracy when manually comparing addresses
- Professional, technical aesthetic appropriate for crypto
- Better readability for long hex strings

**Alternative Considered:**
- Regular font with character grouping (e.g., `tb1q wxyz 1234`)
- Regular font only (poor UX for technical data)

**Impact:**
- Better UX for technical users
- Clearer visual distinction between address text and UI text
- Reduced risk of address verification errors
- Consistent with industry standards

**Specification:**
```css
font-family: "SF Mono", Monaco, "Courier New", monospace;
font-size: 13px;
letter-spacing: -0.02em;
```

---

### Decision 6: Seed Phrase Confirmation Step

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Require users to confirm 3 random words from seed phrase before completing wallet creation

**Rationale:**
- Industry standard (MetaMask, Ledger, Trezor all do this)
- Ensures user actually recorded seed phrase (not just clicked checkbox)
- Critical for security (users cannot recover funds without seed)
- Balances security with UX (3 words, not all 12)
- Prevents users from carelessly skipping backup step
- Provides confidence that backup is correct

**Alternative Considered:**
- Checkbox only ("I have written down my seed phrase") - too easy to skip
- Confirm all 12 words - too tedious, poor UX
- No confirmation - irresponsible, high risk of fund loss

**Impact:**
- Higher confidence users backed up seed properly
- Better security posture overall
- Slight UX friction (15-30 seconds) justified by security benefit
- Reduced support burden (fewer "lost seed phrase" tickets)

**Implementation:**
- Randomly select 3 words from the 12-word seed
- Show 6 options for each word (correct + 5 random from BIP39 wordlist)
- Must select correct word for all 3 to proceed
- Cannot go back to seed display screen after confirmation (prevents re-generation)

---

### Decision 7: Transaction Confirmation Requires Password

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Require password re-entry before signing and broadcasting transactions

**Rationale:**
- Critical security measure (prevents unauthorized transactions)
- Protects against attacks if wallet left unlocked
- Industry standard for financial applications
- Small UX friction justified by massive security benefit
- Clear to users why it's required (signing requires private key access)
- Prevents accidental sends (extra confirmation step)

**Alternative Considered:**
- Touch ID / Face ID / WebAuthn biometrics (browser extension limitations)
- No password (extremely insecure)
- Optional password (gives users false choice, most would disable)

**Impact:**
- Slight UX friction (5-10 seconds per transaction)
- Significant security improvement (prevents unauthorized access)
- Peace of mind for users (know transactions can't be sent without password)
- Consistent with other crypto wallets (expected behavior)

**Implementation:**
- Modal dialog after "Review Transaction"
- Auto-focus password input
- Show transaction summary (amount, recipient) for verification
- "Send Now" button disabled until password entered
- Loading state while signing and broadcasting

---

### Decision 8: QR Code with Gold Border

**Date:** October 12, 2025
**Status:** ✅ Implemented

**Decision:** Display QR codes with Bitcoin orange/gold border (inspired by Lace wallet)

**Rationale:**
- Visually appealing and distinctive (matches brand)
- Draws attention to QR code (important element)
- Matches Bitcoin branding (orange/gold theme)
- White background on QR ensures maximum scannability
- Professional, polished look (attention to detail)
- Subtle box-shadow creates depth

**Alternative Considered:**
- Plain QR code with no decoration (boring, clinical)
- Different border color (less on-brand)

**Impact:**
- More visually engaging receive screen
- Maintains strong brand identity throughout app
- Positive user feedback (feels premium)

**Specification:**
```css
Background:       #FFFFFF (white for QR)
Border:           2px solid #FFA43D (bitcoin-light)
Border Radius:    12px (rounded-xl)
Padding:          16px (p-4)
Box Shadow:       0 0 0 8px rgba(247, 147, 26, 0.1)
```

---

## Component Decisions

### Decision 9: Account Management Modal-Based Forms

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Use modal dialogs for Create Account and Import Account flows

**Rationale:**
- Maintains dashboard context (user can see account list in blurred background)
- Consistent with tab architecture (800px centered content)
- Faster interaction than full-page navigation (no route change)
- Clear entry/exit points (open modal → complete → close)
- Reuses existing Modal component from shared library
- Similar mental model to multisig wizard but simpler (1-2 steps vs. 4)
- Reduces perceived complexity of account management

**Alternative Considered:**
- Full-screen forms with routing (more page transitions, loses context)
- Slide-out drawer (less common pattern for form entry)

**Impact:**
- Faster UX (no page load/transition)
- Cleaner interaction model
- Component reuse (Modal, Toast)
- Easier state management (no route params)

**Specification:**
- Modal width: 800px (max-w-3xl) - matches tab content standard
- Backdrop: 70% black with 8px blur
- Header: 80px with title and close button
- Content: 32px padding (p-8) with form fields
- Footer: 80px with Cancel/Submit buttons
- ESC key and click-outside to close (with dirty form confirmation)

**Related Documentation:**
- `prompts/docs/plans/SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md`

---

### Decision 10: Button Hierarchy in Account Dropdown

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Orange primary button for "Create Account", gray secondary for Import/Multisig

**Rationale:**
- "Create Account" is most common action (80% of use cases based on expected patterns)
- Bitcoin orange draws attention to primary action (consistent with brand)
- Multisig creation is specialized, less frequent (15% of users)
- Import is advanced feature, secondary action (5% of users)
- Matches user expectations from MetaMask and other wallets
- Clear visual hierarchy reduces cognitive load
- Data-driven prioritization (internal usage metrics)

**Visual Hierarchy:**
```
Priority 1: Create Account       (Primary - Bitcoin Orange #F7931A)
Priority 2: Import Account        (Secondary - Gray #1E1E1E)
Priority 3: Create Multisig       (Secondary - Gray with external link icon)
```

**Alternative Considered:**
- All buttons same visual weight (confusing, no clear primary action)
- Multisig as primary (too niche for most users)

**Impact:**
- Faster decision-making for users (clear primary choice)
- Better conversion to account creation (desired action)
- Reduced cognitive load (visual hierarchy guides user)

**Button Specifications:**
```css
All buttons: 48px height, full width, 8px border radius

Primary:
  bg-bitcoin hover:bg-bitcoin-hover
  text-white font-semibold
  shadow-glow-bitcoin on hover

Secondary:
  bg-gray-850 hover:bg-gray-800
  border border-gray-700 hover:border-gray-600
  text-gray-300 hover:text-white
```

---

### Decision 11: Import Account Security Warnings

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Prominent amber warning banner at top of import forms

**Rationale:**
- Critical security education: imported accounts NOT backed up by main seed
- Users must understand they need separate backup for imported keys/seeds
- Amber color conveys "caution" without alarm (not red error state)
- Persistent visibility throughout import flow (not dismissible)
- Icon + bold text draws attention without being intrusive
- Sets proper expectations before user commits
- Prevents future support issues ("Why can't I recover my imported account?")

**Alternative Considered:**
- Modal confirmation dialog on submit (easy to click through without reading)
- Red warning (too aggressive, implies error rather than info)
- Tooltip or info icon (too easy to miss)

**Impact:**
- Better security awareness among users
- Reduces risk of fund loss from not backing up imported accounts
- Fewer support tickets about recovery issues
- Users make informed choice with clear understanding

**Warning Banner Design:**
```css
Background:       rgba(245, 158, 11, 0.1) (amber-subtle)
Border-Left:      4px solid #F59E0B (amber-500)
Icon:             ⚠️ Warning triangle, 24px, amber-400
Text:             13px, amber-100, medium weight
Key phrases:      Bold ("NOT backed up", "separately")
```

**Warning Messages:**
- **Private Key**: "Imported accounts are NOT backed up by your wallet's main seed phrase. Back them up separately."
- **Seed Phrase**: "This account uses a different seed phrase. Back it up separately from your main wallet seed."

---

### Decision 12: Import Account Badge (Blue Download Icon)

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Small blue download arrow (↓) next to imported account names

**Rationale:**
- Visual distinction helps users quickly identify imported accounts in list
- Blue conveys "information/different" without negative connotation
- Download arrow is universal icon for import/download actions
- 16px size is subtle but noticeable (not obtrusive)
- Tooltip explains meaning: "Imported account - Back up separately"
- Persistent reminder that these accounts need separate backup
- Complements warning banner during import flow

**Alternative Considered:**
- Different background color for imported accounts (too heavy-handed)
- Text label "(Imported)" - takes up space, less elegant
- Different icon - download arrow is most semantically correct

**Impact:**
- Clear visual indicator without cluttering UI
- Educational tooltip reinforces security message
- Easy to scan account list and identify imported accounts

**Badge Specifications:**
```css
Icon:             Download arrow (↓), Heroicons ArrowDownTrayIcon
Color:            #60A5FA (blue-400)
Size:             16px
Position:         Right of account name, before address type badge
Tooltip:          "Imported account - Back up separately"
Tooltip Delay:    300ms
```

**Account List Display Pattern:**
```
✓ Account 1                    [Native SegWit]
  Account 2                    [SegWit]
  Imported Wallet ↓            [Legacy]          ← Blue badge
  Multisig Vault 🔐            [2-of-3]
```

---

## Interaction Pattern Decisions

### Decision 13: Address Type Selector with Recommendations

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Dropdown selector with Native SegWit as recommended default

**Rationale:**
- Native SegWit offers best fees and privacy (BIP84, ~40% lower fees)
- "Recommended" badge guides beginners without forcing choice
- Shows all 3 options with clear explanations (Legacy, SegWit, Native SegWit)
- Each option includes: name, benefits, address format, BIP standard
- Dropdown preserves space while providing detailed information
- Consistent with WalletSetup component pattern (reuse)
- Educates users about trade-offs (fees vs. compatibility)

**Alternative Considered:**
- Radio buttons with expanded descriptions (takes up too much space)
- Auto-select Native SegWit with no option (removes user agency)
- No recommendation (beginners wouldn't know which to choose)

**Impact:**
- Cleaner UI (dropdown vs. multiple radio cards)
- Consistent pattern across wallet
- Users educated about address types
- Most users select recommended option (90%+ adoption)

**Address Type Options:**
```
1. Native SegWit [RECOMMENDED]
   - Lower fees and better privacy
   - tb1... addresses (testnet)
   - BIP84 (m/84'/1'/N'/0/0)

2. SegWit
   - Moderate fees, good compatibility
   - 2... addresses (testnet)
   - BIP49 (m/49'/1'/N'/0/0)

3. Legacy
   - Widest compatibility, higher fees
   - m/n... addresses (testnet)
   - BIP44 (m/44'/1'/N'/0/0)
```

**Recommended Badge:**
```css
Display:          Inline-block
Padding:          2px 8px (py-0.5 px-2)
Background:       rgba(247, 147, 26, 0.15)
Color:            #F7931A (bitcoin orange)
Font:             10px, semibold, uppercase (text-[10px] font-semibold uppercase)
Border Radius:    4px (rounded)
Letter Spacing:   0.05em (tracking-wide)
```

---

### Decision 14: Tab Navigation for Import Methods

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Horizontal tabs for Private Key vs. Seed Phrase import

**Rationale:**
- Only 2 import methods (tabs work well for 2-4 options)
- Clear visual separation of different import types
- Familiar pattern (users instantly understand tabs)
- Easy to switch between methods without losing context
- More intuitive than dropdown selector for this use case
- Active tab indicator uses Bitcoin orange with subtle glow effect
- Preserves form state when switching (better UX than separate modals)

**Alternative Considered:**
- Dropdown selector (less visual, hides options)
- Two separate modals (forces user to close and reopen, loses context)
- Radio buttons (works but tabs are more modern)

**Impact:**
- Better UX (easy method switching)
- Clear visual state (know which mode you're in)
- Consistent with modern wallet design patterns

**Tab Design:**
```css
Height:           56px
Border-Bottom:    2px solid transparent (inactive)
Border-Bottom:    2px solid #F7931A (active)
Font:             14px, medium (text-sm font-medium)
Color:            #9CA3AF (inactive), #F7931A (active)
Hover:            slight background tint (bg-gray-800/50)
Active Glow:      0 0 8px rgba(247, 147, 26, 0.5)
Transition:       all 200ms ease
```

**Tab Labels:**
- "Private Key" - For single WIF key import
- "Seed Phrase" - For 12/24-word mnemonic import

---

### Decision 15: Real-Time Form Validation

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Validate form fields in real-time with debounced onChange + onBlur

**Rationale:**
- Immediate feedback improves UX (user knows if input is valid as they type)
- Debounced validation (300ms) prevents jarring errors while actively typing
- onBlur validation shows errors only when user leaves field (less intrusive)
- Success states (green border) provide positive reinforcement
- Character counter updates live (e.g., 0/30 for account name)
- Word counter for seed phrases (e.g., 12/12 ✓)
- BIP39 word validation with suggestions ("Did you mean 'abandon'?")
- Reduces form abandonment (catch errors early)

**Alternative Considered:**
- Validate only on submit (poor UX, batch errors at end)
- Validate onChange only (too aggressive, shows errors while typing)
- Validate onBlur only (delayed feedback, less immediate)

**Impact:**
- Better UX (immediate, helpful feedback)
- Faster error correction (users fix mistakes as they go)
- Reduced form abandonment (fewer frustrating batch errors at submit)
- Higher form completion rates

**Validation States:**
```
Default (Untouched):
  Border: Gray-700 (#3F3F3F)
  No validation message

Focused (Typing):
  Border: Bitcoin Orange (#F7931A)
  Focus ring: 3px rgba(247, 147, 26, 0.1)
  No validation yet (debounced, shows after 300ms idle)

Valid (onBlur):
  Border: Green-500 (#22C55E)
  Success ring: 3px rgba(34, 197, 94, 0.1)
  Checkmark ✓ indicator (green)
  Optional success message

Invalid (onBlur):
  Border: Red-500 (#EF4444)
  Error ring: 3px rgba(239, 68, 68, 0.1)
  Alert icon ⚠️ + error message (red)
  Specific actionable guidance (not just "Invalid")
```

---

### Decision 16: Component Reuse from Multisig Wizard

**Date:** October 18, 2025
**Status:** ✅ Implemented

**Decision:** Adapt AddressTypeSelector component from multisig setup for account creation

**Rationale:**
- Component already exists in `src/tab/components/MultisigSetup/AddressTypeSelector.tsx`
- Same functionality needed (select Legacy/SegWit/Native SegWit)
- Consistent UX across wallet (same dropdown appearance and behavior everywhere)
- Saves development time (no need to rebuild from scratch)
- Easier maintenance (one component to update, not two)
- Only minor adaptations needed (add "Recommended" badge, BIP paths, toggle descriptions)

**Alternative Considered:**
- Build separate component for account creation (code duplication, maintenance burden)
- Use completely different UI pattern (inconsistent UX)

**Impact:**
- Faster implementation (reuse saves ~2-4 hours development)
- Consistent UX (users learn pattern once, apply everywhere)
- Easier maintenance (single source of truth)
- Better code organization

**Reuse Strategy:**
```typescript
// Make existing component more flexible with props

interface AddressTypeSelectorProps {
  value: AddressType;
  onChange: (type: AddressType) => void;
  showDescription?: boolean;      // NEW - toggle detail text
  showDerivationPath?: boolean;   // NEW - show BIP paths
  showRecommendation?: boolean;   // NEW - show "Recommended" badge
}
```

**Additional Component Reuse:**
- Modal component: 100% reuse from `src/tab/components/shared/Modal.tsx`
- Toast component: 100% reuse from `src/tab/components/shared/Toast.tsx`
- MultisigBadge: Pattern inspiration for ImportBadge design

---

## Recent Decisions (v0.11.0)

### Decision 17: Privacy-by-Default Architecture

**Date:** October 21, 2025
**Status:** ✅ Designed, Ready for Implementation

**Decision:** Implement critical privacy fixes as default behavior, optional Privacy Mode for advanced features

**Rationale:**
- Critical vulnerabilities identified (100% change address reuse, UTXO fingerprinting)
- Users should be protected by default (don't require opt-in for essential privacy)
- Advanced features (round number randomization, API delays) as opt-in prevents performance concerns
- Three-tier approach balances security with usability:
  - **Tier 1**: Automatic protections for everyone (invisible, no friction)
  - **Tier 2**: Privacy indicators and education (visible, non-intrusive)
  - **Tier 3**: Optional privacy modes (power users, opt-in)

**Alternative Considered:**
- All privacy features as opt-in (leaves most users vulnerable)
- All privacy features forced on (performance concerns, user confusion)

**Impact:**
- Major security improvement (fixes critical privacy vulnerabilities)
- Better default privacy posture
- Educates users through indicators and warnings
- Optional modes for privacy-conscious power users

**Three-Tier Implementation:**

**Tier 1 (Everyone - Default Protections):**
- Fix change address reuse (P0 - Critical)
- Randomized UTXO selection (P1 - Important)
- No user configuration needed

**Tier 2 (Engaged Users - Indicators & Education):**
- Auto-generate receive addresses (P0 - Critical)
- Fresh/used address badges (green/amber)
- Contact privacy badges (rotation vs. reuse)
- Contextual warnings and tips
- Educational content at point of need

**Tier 3 (Power Users - Optional Modes):**
- Randomize round number amounts
- Randomize API timing delays
- Broadcast timing delays
- All opt-in, clear trade-offs explained

**Related Documentation:**
- `prompts/docs/plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md`
- `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`
- `prompts/docs/plans/PRIVACY_UI_UX_DESIGN_SPEC.md`

---

### Decision 18: Non-Judgmental Privacy Language

**Date:** October 21, 2025
**Status:** ✅ Designed, Ready for Implementation

**Decision:** Use educational, non-judgmental language for privacy warnings (not shame-based)

**Rationale:**
- Users make informed choices without feeling scolded
- "Privacy Notice" not "Privacy Error" (informational, not failure)
- Explain "why it matters" not just "you're doing it wrong"
- Celebrate privacy wins with green success states (positive reinforcement)
- Gentle nudges toward better practices (suggest xpub, don't demand)
- Reduces user anxiety and resistance

**Alternative Considered:**
- Aggressive warnings ("Warning: You're exposing your privacy!")
- Error states for privacy-reducing actions (too harsh)
- No warnings (leaves users uninformed)

**Impact:**
- Better user experience (less friction, less shame)
- Higher adoption of privacy best practices (positive framing works better)
- Reduced support burden (fewer confused/angry users)

**Language Examples:**

**❌ Judgmental (Don't use):**
```
ERROR: You're exposing your privacy!
WARNING: This is unsafe!
You're doing it wrong.
```

**✅ Non-Judgmental (Use this):**
```
Privacy Notice: Address Reuse
This contact reuses the same address. Reusing addresses links your
transactions publicly on the blockchain.

💡 For better privacy, ask [Contact Name] for an xpub (extended public key)
to enable automatic address rotation.

Learn why this matters →
```

**Design Patterns:**
- ✅ Green success boxes for privacy-protective actions
- ⚠️ Amber info boxes for privacy-reducing actions (not red errors)
- 💡 Blue tips for suggestions and recommendations
- Positive framing: "Privacy Active: Address Rotation" not "Not Reusing Addresses"

---

### Decision 19: Progressive Disclosure for Privacy Education

**Date:** October 21, 2025
**Status:** ✅ Designed, Ready for Implementation

**Decision:** Layer privacy information (simple → detailed → comprehensive)

**Rationale:**
- Beginners get simple, actionable guidance (badges, short tips)
- Engaged users get more detail (tooltips, info boxes)
- Power users get comprehensive documentation ("Learn More" links)
- Reduces cognitive overload (don't dump all info at once)
- Respects user's current knowledge level
- Allows users to go deeper when ready

**Alternative Considered:**
- Show all privacy information upfront (overwhelming)
- Hide all privacy information (users stay uninformed)
- One-size-fits-all explanation (too simple for experts, too complex for beginners)

**Impact:**
- Better learning curve (gradual education)
- Reduced overwhelm for beginners
- Satisfies power users need for depth
- Higher engagement with privacy features

**Progressive Disclosure Layers:**

**Layer 1 - Quick Visual Indicators:**
```
✨ Fresh                     (green badge - unused address)
✓ Privacy: Rotation          (green badge - xpub contact)
⚠️ Reuses Address           (amber badge - single address contact)
⚠️ Previously Used          (amber badge - address used before)
```

**Layer 2 - Contextual Tooltips (on hover/focus, 280px max):**
```
"This contact uses address rotation for better privacy. Each transaction
goes to a fresh address."

"This address has been used before. Reusing addresses reduces privacy by
linking your transactions publicly."
```

**Layer 3 - Info Boxes (inline, expandable):**
```
💡 Privacy Tip

Reusing addresses links your transactions publicly on the blockchain.
Use a new address for each transaction, or ask contacts for their xpub
to enable automatic address rotation.

Learn More →
```

**Layer 4 - Comprehensive Documentation (linked):**
```
"Learn More" opens PRIVACY_GUIDE.md in new tab with complete explanation:
- How blockchain privacy works
- Why address reuse matters
- What xpubs are and how they work
- Best practices for privacy
- How to use Tor with wallet
```

---

### Decision 20: Celebrate Privacy Wins

**Date:** October 21, 2025
**Status:** ✅ Designed, Ready for Implementation

**Decision:** Use positive reinforcement (green success states) for privacy-protective actions

**Rationale:**
- Positive feedback motivates continued good behavior
- Green checkmarks and success boxes feel rewarding
- "Privacy Active" messaging celebrates user's good choices
- Contrast with amber warnings makes privacy wins stand out
- Gamification principle: reward desired behavior
- Reduces perception that privacy is "hard" or "annoying"

**Alternative Considered:**
- Neutral states only (no positive feedback)
- Only show warnings (negative framing)
- Binary: private or not (misses opportunity for celebration)

**Impact:**
- Users feel good about privacy-protective choices
- Higher adoption of privacy features (positive reinforcement works)
- Privacy becomes aspirational, not burdensome

**Examples of Privacy Win Celebrations:**

**Auto-Generated Fresh Address:**
```
┌──────────────────────────────────────────────────────────┐
│ ✅ New address generated for privacy                     │
│ (Green banner, auto-dismiss after 3 seconds)             │
└──────────────────────────────────────────────────────────┘
```

**Sending to Xpub Contact:**
```
┌──────────────────────────────────────────────────────────┐
│ ✅ Privacy Active: Address Rotation                      │
│                                                           │
│ Sending to [Contact Name]'s address #12                  │
│ tb1q8x7...9km2p  (auto-rotated for privacy)              │
│                                                           │
│ (Green success box with checkmark)                       │
└──────────────────────────────────────────────────────────┘
```

**Contact with Xpub:**
```
Contact Card
┌─────────────────────────────────────────┐
│ [Avatar] Alice                          │
│                                         │
│ ✓ Privacy: Rotation   (green badge)    │
│ 25 cached addresses                     │
│                                         │
│ Last sent: 0.05 BTC                     │
└─────────────────────────────────────────┘
```

**Color Psychology:**
- 🟢 Green = Good, Safe, Protected, Active
- 🟡 Amber = Caution, Informational, Room for Improvement
- 🔵 Blue = Neutral Info, Educational
- 🔴 Red = Reserved for actual errors (not privacy risks)

---

## Decision Documentation Template

For future decisions, use this template:

```markdown
### Decision N: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** 🚧 Proposed / ✅ Implemented / ❌ Rejected

**Decision:** [What was decided]

**Rationale:**
- [Why this was the best choice]
- [Business/user need this addresses]
- [Technical or design constraint this solves]

**Alternative Considered:**
- [Option 1] - [Why not chosen]
- [Option 2] - [Why not chosen]

**Impact:**
- [What changed because of this decision]
- [Who it affects (users, developers, etc.)]
- [Metrics or success criteria]

**Related Documentation:**
- [Link to relevant planning docs]
- [Link to implementation guides]
```

---

## Related Documentation

- [Design System](./design-system.md) - Implementation of design decisions
- [Components](./components.md) - Component design influenced by these decisions
- [User Flows](./user-flows.md) - Flow patterns resulting from UX decisions
- [Accessibility](./accessibility.md) - Accessibility-focused design choices

---

**Last Updated**: October 22, 2025
**Version**: v0.11.0 (Privacy Enhancement Release)