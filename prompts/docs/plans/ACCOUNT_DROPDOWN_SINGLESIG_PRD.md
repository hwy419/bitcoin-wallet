# Account Dropdown Single-Sig Wallet Creation - Product Requirements Document

**Feature Name:** Add Single-Signature Wallet Creation/Import to Account Dropdown
**Version:** 1.0
**Created:** October 18, 2025
**Owner:** Product Manager
**Priority:** P0 - Critical Gap in UX
**Target Version:** v0.10.0

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [User Impact](#user-impact)
4. [Feature Requirements](#feature-requirements)
5. [User Stories](#user-stories)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Design Specifications](#design-specifications)
8. [Technical Considerations](#technical-considerations)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Out of Scope](#out-of-scope)
11. [Success Metrics](#success-metrics)
12. [Implementation Plan](#implementation-plan)

---

## Executive Summary

### Overview
Currently, users can create multisig wallets from the Account dropdown on the Assets tab, but cannot create or import additional single-signature accounts. This creates an inconsistent user experience where:
- The only way to create/import single-sig wallets is during initial setup (before any wallet exists)
- Once a wallet is created, users have no way to add more single-sig accounts from the UI
- The Account dropdown offers multisig creation but not single-sig, creating UX asymmetry

This PRD defines requirements for adding single-signature wallet creation and import options to the Account dropdown, making account management consistent and user-friendly.

### Business Value
- **Improves UX consistency**: All account creation flows accessible from same location
- **Reduces user confusion**: Clear path to create both single-sig and multisig accounts
- **Increases product usability**: Users can manage full wallet lifecycle within the extension
- **Competitive parity**: Matches MetaMask's account management UX

### Scope
- Add "Create Account" option to Account dropdown (single-sig)
- Add "Import Account" option to Account dropdown (seed phrase or private key)
- Reuse existing WalletSetup component with tab context layout (800px centered)
- Maintain "Create Multisig Account" option in dropdown (keep current behavior)
- Ensure consistent 800px centered layout for all creation flows

---

## Problem Statement

### Current State
**What exists today:**
1. **Initial Wallet Creation** (first time only):
   - Users see WalletSetup screen when no wallet exists
   - Can create new wallet (12-word seed) OR import existing wallet
   - This flow happens in `/src/tab/components/WalletSetup.tsx`
   - After this, the WalletSetup screen never appears again

2. **Account Dropdown** (after wallet exists):
   - Located on Assets tab (Dashboard)
   - Shows list of existing accounts (single-sig and multisig)
   - Has "Create Multisig Account" button at bottom
   - Opens wizard in new tab for multisig creation
   - **NO option to create/import single-sig accounts**

3. **Multisig Wizard**:
   - Opens in dedicated tab (`/src/wizard/`)
   - Uses 800px centered layout with fixed header
   - Complex 7-step flow for multisig setup
   - Can be launched from Account dropdown

### Problems with Current State
1. **No way to add single-sig accounts after initial setup**
   - Users stuck with whatever they created during initial setup
   - Must manually add accounts via backend (no UI)
   - Poor UX for users wanting multiple single-sig accounts

2. **Inconsistent account creation UX**
   - Multisig accounts: Can be created anytime from Account dropdown
   - Single-sig accounts: Only during initial setup (before wallet exists)
   - Users don't understand why they can create one type but not the other

3. **Layout inconsistency**
   - Initial WalletSetup: Was designed for popup (600x400px), now in tab context
   - Multisig Wizard: Properly designed for tab (800px centered)
   - When reusing WalletSetup for account creation, it needs proper tab layout

4. **Unclear user journey**
   - Users don't understand the difference between:
     - "Creating a wallet" (initial setup, happens once)
     - "Creating an account" (adding accounts to existing wallet)
     - "Importing an account" (adding account from different source)

### User Pain Points
- "How do I create another regular account?" (most common user question)
- "Why can I create multisig but not regular accounts?"
- "I want to separate my personal and business Bitcoin, but can only create multisig?"
- "The 'Create Multisig Account' button suggests I can create accounts, but where's the regular option?"

---

## User Impact

### Who is Affected?
1. **Primary Users**: Active wallet users wanting multiple single-sig accounts
   - Use case: Separating personal/business funds
   - Use case: Different accounts for different projects
   - Use case: Privacy (fresh account for each purpose)

2. **New Users**: Learning Bitcoin wallet concepts
   - Confusion about accounts vs wallets
   - Expecting MetaMask-like account management
   - Need clear distinction between account types

3. **Power Users**: Managing complex setups
   - Multiple single-sig accounts for different purposes
   - Mix of single-sig and multisig accounts
   - Importing accounts from other wallets/sources

### Impact Level
**Severity: HIGH**
- **Blocker**: Users cannot add single-sig accounts (core functionality gap)
- **Workaround exists**: Manual backend manipulation (not viable for users)
- **Expected behavior**: Should work like MetaMask (industry standard)
- **User frustration**: High - this is a fundamental wallet feature

### User Journey Before vs After

**BEFORE (Current State):**
```
User: "I want to create a new account for my business transactions"
1. Opens Account dropdown → Only sees "Create Multisig Account"
2. Clicks "Create Multisig Account" → Realizes this is complex, not what they want
3. Searches Settings → No option to create single-sig accounts
4. Gives up or contacts support → "How do I create a regular account?"
Result: User frustrated, feature gap exposed
```

**AFTER (With This Feature):**
```
User: "I want to create a new account for my business transactions"
1. Opens Account dropdown → Sees three options:
   - "Create Account" (single-sig)
   - "Import Account" (seed/private key)
   - "Create Multisig Account"
2. Clicks "Create Account" → Simple form with name and address type
3. Confirms → New account appears in dropdown instantly
Result: User successful, clear UX
```

---

## Feature Requirements

### Functional Requirements

#### FR1: Add "Create Account" to Account Dropdown
**Priority:** P0 (Critical)

**Requirements:**
- Add "Create Account" button to Account dropdown
- Position above "Create Multisig Account" (single-sig is more common)
- Opens account creation form (reuse WalletSetup component or create simpler flow)
- Account is added to existing wallet (same seed, different derivation path)
- New account immediately available in dropdown after creation

**Details:**
- **Derivation Path**: BIP44 standard - `m/purpose'/coin_type'/account'/change/index`
  - Next available account index (0, 1, 2, ...)
  - Respects selected address type (Legacy/SegWit/Native SegWit)
- **Account Name**: User-provided or default "Account N"
- **No seed phrase backup**: Uses existing wallet seed (already backed up)
- **No password entry**: Wallet is already unlocked (dropdown only shows when unlocked)

#### FR2: Add "Import Account" to Account Dropdown
**Priority:** P1 (High)

**Requirements:**
- Add "Import Account" button to Account dropdown
- Position between "Create Account" and "Create Multisig Account"
- Supports two import methods:
  1. **Private Key Import** (WIF format)
     - Single account, not derived from wallet seed
     - Stored securely alongside other accounts
     - User warned this is a "hot" import (less secure than HD derivation)
  2. **Seed Phrase Import** (12/24 words)
     - Creates account derived from different seed
     - User can choose account index and address type
     - Stored as separate account (different derivation)

**Details:**
- **Security Warning**: Imported accounts are NOT backed up by the wallet's main seed
  - User must back up the imported seed/private key separately
  - Clear warning during import flow
- **Account Naming**: User must provide a name (no default)
- **Validation**: Strict validation of private keys and seed phrases

#### FR3: Reuse and Adapt WalletSetup Component
**Priority:** P0 (Critical)

**Requirements:**
- Reuse existing `/src/tab/components/WalletSetup.tsx` logic
- Adapt for "add account to existing wallet" context vs. "create first wallet"
- Two modes:
  1. **Initial Setup Mode** (existing behavior):
     - Full wallet creation/import flow
     - Shows seed backup screen
     - Requires password creation
     - Navigates to unlock screen after completion
  2. **Add Account Mode** (NEW):
     - Simplified flow (no password, no seed backup)
     - Just name + address type for "Create Account"
     - Seed/key input + name + address type for "Import Account"
     - Returns to dashboard after completion

**Layout Requirements:**
- **800px centered container** - Matches tab layout (not popup 600x400)
- **Consistent with multisig wizard layout**:
  - Fixed header with back button
  - Scrollable content area
  - Fixed footer with action buttons
- **Responsive**: Works at different browser widths
- **Dark theme**: Consistent with rest of app

#### FR4: Update Account Dropdown UI
**Priority:** P0 (Critical)

**Requirements:**
- **Current Layout** (in `/src/tab/components/Dashboard.tsx` lines 332-389):
  ```
  [Account Dropdown]
  ├── [Account List]
  │   ├── Account 1 (selected)
  │   ├── Account 2
  │   └── Multisig 2-of-3
  ├── [Divider]
  └── [Create Multisig Account] (orange button)
  ```

- **New Layout**:
  ```
  [Account Dropdown]
  ├── [Account List]
  │   ├── Account 1 (selected)
  │   ├── Account 2
  │   └── Multisig 2-of-3
  ├── [Divider]
  ├── [Create Account] (orange button)
  ├── [Import Account] (gray button with icon)
  └── [Create Multisig Account] (gray button with external link icon)
  ```

**Button Styles:**
- **Create Account**: Primary orange button (`bg-bitcoin`)
  - Full width, orange background
  - Icon: Plus sign
  - Text: "Create Account"
- **Import Account**: Secondary button (`bg-gray-850`)
  - Full width, gray background with hover
  - Icon: Download/import arrow
  - Text: "Import Account"
- **Create Multisig Account**: Secondary button (keep current style)
  - Full width, gray background with hover
  - Icon: Plus sign + external link
  - Text: "Create Multisig Account"

### Non-Functional Requirements

#### NFR1: Performance
- Account creation completes in <1 second (local operation)
- Account import validates seed/key in <500ms
- Dropdown remains responsive with 50+ accounts

#### NFR2: Security
- All accounts encrypted with same wallet password
- Imported private keys/seeds encrypted separately
- No private data logged to console
- Secure memory handling (keys cleared after use)

#### NFR3: Usability
- Clear distinction between "Create" and "Import"
- Tooltips explain each option
- Error messages are actionable
- Success confirmation with account name displayed

#### NFR4: Accessibility
- Keyboard navigation through dropdown options
- Screen reader friendly labels
- Focus management in modal/form flows
- Color contrast meets WCAG 2.1 AA standards

---

## User Stories

### US1: Create Single-Sig Account (Primary Flow)
**As a** wallet user
**I want to** create a new single-signature account from the Account dropdown
**So that** I can organize my Bitcoin funds into separate accounts for different purposes

**Acceptance Criteria:**
- ✅ "Create Account" button appears in Account dropdown
- ✅ Clicking opens account creation form
- ✅ Form asks for account name and address type
- ✅ Form validates name (not empty, max 30 chars)
- ✅ New account uses next available BIP44 derivation path
- ✅ Account appears in dropdown immediately after creation
- ✅ Account is automatically selected after creation
- ✅ Dashboard updates to show new account's balance (initially 0)

**Priority:** P0 (Critical)
**User Value:** High - Enables core account management feature

---

### US2: Import Account from Private Key
**As a** power user
**I want to** import a Bitcoin account using a private key
**So that** I can manage funds from paper wallets or other sources in my extension

**Acceptance Criteria:**
- ✅ "Import Account" button appears in Account dropdown
- ✅ Clicking opens import modal/screen
- ✅ User can choose "Private Key" import method
- ✅ Form validates WIF private key format
- ✅ Security warning displayed: "This account is not backed up by your wallet seed"
- ✅ User must provide a name for the imported account
- ✅ Imported account appears in dropdown with import badge/icon
- ✅ Dashboard shows correct balance for imported account

**Priority:** P1 (High)
**User Value:** Medium - Supports migration and paper wallet sweeps

---

### US3: Import Account from Seed Phrase
**As a** user migrating from another wallet
**I want to** import an account using a 12/24-word seed phrase
**So that** I can consolidate multiple wallets into one extension

**Acceptance Criteria:**
- ✅ "Import Account" option supports seed phrase import
- ✅ User can choose "Seed Phrase" import method
- ✅ Form accepts 12 or 24-word BIP39 seed phrases
- ✅ Form validates seed phrase format and checksum
- ✅ User can select account index (0, 1, 2, ...) to import
- ✅ User can select address type (Legacy/SegWit/Native SegWit)
- ✅ Security warning: "This account uses a different seed - back it up separately"
- ✅ User must provide a name for the imported account
- ✅ Imported account appears in dropdown with import badge
- ✅ Dashboard shows correct balance for imported account

**Priority:** P1 (High)
**User Value:** High - Supports multi-wallet users

---

### US4: Distinguish Account Types in Dropdown
**As a** user with multiple account types
**I want to** easily identify which accounts are single-sig, multisig, or imported
**So that** I understand the security model of each account

**Acceptance Criteria:**
- ✅ Single-sig accounts show address type label (Legacy/SegWit/Native SegWit)
- ✅ Multisig accounts show MultisigBadge component (existing - e.g., "2-of-3")
- ✅ Imported accounts show small icon or badge (e.g., download arrow icon)
- ✅ Tooltip on hover explains account type
- ✅ Visual hierarchy clear: Name > Type > Balance

**Priority:** P1 (High)
**User Value:** Medium - Improves account management clarity

---

### US5: Handle Account Creation Errors Gracefully
**As a** user attempting to create/import an account
**I want to** see clear error messages when something goes wrong
**So that** I can correct the issue and successfully create/import the account

**Acceptance Criteria:**
- ✅ Invalid seed phrase shows: "Invalid seed phrase. Please check and try again."
- ✅ Invalid private key shows: "Invalid private key format. Expected WIF format (5...)."
- ✅ Duplicate account name shows warning but allows (names not required to be unique)
- ✅ Empty account name shows: "Account name is required."
- ✅ Name too long shows: "Account name must be 30 characters or less."
- ✅ Backend errors show: "Failed to create account. Please try again."
- ✅ All errors display in red alert box with dismissable X

**Priority:** P0 (Critical)
**User Value:** High - Prevents user frustration

---

## Acceptance Criteria

### Critical Path (Must Have for v0.10.0)

#### AC1: Account Dropdown UI
- [ ] "Create Account" button added to dropdown (orange, full width, plus icon)
- [ ] "Import Account" button added to dropdown (gray, full width, import icon)
- [ ] "Create Multisig Account" button retained (gray, external link icon)
- [ ] Buttons positioned in order: Create → Import → Create Multisig
- [ ] All buttons have consistent padding, spacing, and hover states
- [ ] Dropdown closes when any action button is clicked

#### AC2: Create Account Flow
- [ ] Clicking "Create Account" opens account creation form
- [ ] Form layout: 800px centered container (not popup 600x400)
- [ ] Form fields:
  - [ ] Account Name (text input, required, max 30 chars)
  - [ ] Address Type (dropdown: Legacy/SegWit/Native SegWit)
- [ ] Form validation:
  - [ ] Name cannot be empty
  - [ ] Name limited to 30 characters
  - [ ] Address type must be selected
- [ ] "Create" button disabled until form valid
- [ ] Backend creates account with next available BIP44 derivation path
- [ ] New account appears in dropdown immediately after creation
- [ ] New account is automatically selected
- [ ] Dashboard updates to show new account (balance 0, no addresses yet)
- [ ] Success toast/message: "Account created successfully"

#### AC3: Import Account Flow - Private Key
- [ ] Clicking "Import Account" opens import method selector
- [ ] User can choose "Private Key" tab
- [ ] Form fields:
  - [ ] Private Key (textarea, WIF format)
  - [ ] Account Name (text input, required, max 30 chars)
- [ ] Security warning displayed: "This account is not backed up by your wallet seed. Back up this private key separately."
- [ ] Form validation:
  - [ ] Private key format validated (WIF format starting with 5, K, or L for mainnet; c for testnet)
  - [ ] Name cannot be empty
- [ ] "Import" button disabled until form valid
- [ ] Backend imports account and encrypts private key
- [ ] Imported account appears in dropdown with import badge
- [ ] Dashboard updates to show imported account balance
- [ ] Success toast: "Account imported successfully"

#### AC4: Import Account Flow - Seed Phrase
- [ ] Clicking "Import Account" → "Seed Phrase" tab
- [ ] Form fields:
  - [ ] Seed Phrase (textarea, 12 or 24 words)
  - [ ] Account Index (number input, default 0)
  - [ ] Address Type (dropdown)
  - [ ] Account Name (text input, required)
- [ ] Security warning: "This account uses a different seed phrase. Back it up separately."
- [ ] Form validation:
  - [ ] Seed phrase must be 12 or 24 words
  - [ ] BIP39 checksum validation
  - [ ] Account index must be 0-2147483647 (BIP44 hardened range)
- [ ] "Import" button disabled until form valid
- [ ] Backend derives account from seed phrase
- [ ] Imported account appears in dropdown with import badge
- [ ] Dashboard updates to show imported account balance
- [ ] Success toast: "Account imported successfully"

#### AC5: Error Handling
- [ ] Invalid seed phrase: Clear error message with suggestion to verify words
- [ ] Invalid private key: Error explaining WIF format requirement
- [ ] Empty name: "Account name is required"
- [ ] Name too long: "Name must be 30 characters or less"
- [ ] Backend error: "Failed to create account. Please try again."
- [ ] All errors display in red alert box
- [ ] Errors clear when user corrects input

#### AC6: Account List Visual Updates
- [ ] Single-sig accounts show address type (e.g., "Native SegWit")
- [ ] Multisig accounts show MultisigBadge (e.g., "2-of-3")
- [ ] Imported accounts show small import icon (download arrow)
- [ ] Selected account has checkmark icon (existing behavior)
- [ ] Hover states work for all accounts
- [ ] Account names truncate with ellipsis if too long

### Nice to Have (Post v0.10.0)

#### AC7: Advanced Features
- [ ] Option to import multiple accounts from same seed (batch import)
- [ ] Preview address before importing to verify correct derivation
- [ ] Export account (private key or xpub) from dropdown context menu
- [ ] "Delete" option for imported accounts (not allowed for HD accounts)
- [ ] Account reordering (drag and drop in dropdown)

#### AC8: UX Enhancements
- [ ] Tooltips explaining each button on hover
- [ ] Help icon next to "Import Account" with explanation modal
- [ ] Search/filter accounts in dropdown (if >10 accounts)
- [ ] Keyboard shortcuts (Ctrl+N for new account, Ctrl+I for import)
- [ ] Animated transitions when account list updates

---

## Design Specifications

### Visual Design

#### Account Dropdown Layout (Current → New)

**BEFORE:**
```
┌─────────────────────────────────────┐
│ Account Dropdown                    │
├─────────────────────────────────────┤
│ ✓ Account 1       [Native SegWit]   │
│   Account 2       [SegWit]          │
│   Multisig 2-of-3 [2-of-3 Badge]    │
├─────────────────────────────────────┤
│ [+ Create Multisig Account] 🔗      │ ← Only this button
└─────────────────────────────────────┘
```

**AFTER:**
```
┌─────────────────────────────────────┐
│ Account Dropdown                    │
├─────────────────────────────────────┤
│ ✓ Account 1       [Native SegWit]   │
│   Account 2       [SegWit]          │
│   Imported ↓      [Legacy]          │ ← Import badge
│   Multisig 2-of-3 [2-of-3 Badge]    │
├─────────────────────────────────────┤
│ [+ Create Account]                  │ ← NEW (orange)
│ [↓ Import Account]                  │ ← NEW (gray)
│ [+ Create Multisig Account] 🔗      │ ← Keep (gray)
└─────────────────────────────────────┘
```

#### Button Specifications

**Create Account Button:**
```css
Background: #F7931A (bitcoin orange)
Hover: #FF9E2D (lighter orange)
Active: #E88711 (darker orange)
Text: White (#FFFFFF)
Icon: Plus sign (+)
Height: 48px (py-3)
Padding: 16px (px-4)
Border Radius: 8px (rounded-lg)
Font: Semibold, 14px
```

**Import Account Button:**
```css
Background: #1E1E1E (gray-850)
Hover: #2A2A2A (gray-800)
Border: 1px solid #3F3F3F (gray-700)
Text: #D1D5DB (gray-300)
Text Hover: #FFFFFF (white)
Icon: Download arrow (↓)
Height: 48px (py-3)
Padding: 16px (px-4)
Border Radius: 8px (rounded-lg)
Font: Semibold, 14px
```

**Create Multisig Account Button:**
```css
Background: #1E1E1E (gray-850)
Hover: #2A2A2A (gray-800)
Border: 1px solid #3F3F3F (gray-700)
Text: #D1D5DB (gray-300)
Text Hover: #FFFFFF (white)
Icon: Plus (+) and external link (🔗)
Height: 48px (py-3)
Padding: 16px (px-4)
Border Radius: 8px (rounded-lg)
Font: Semibold, 14px
```

#### Import Badge (for imported accounts)
```css
Icon: Download arrow (↓)
Color: #60A5FA (blue-400)
Size: 16px (w-4 h-4)
Position: Next to account name
Tooltip: "Imported account"
```

### Form Layouts

#### Create Account Form (800px centered)
```
┌────────────────────────────────────────────────────────┐
│  ← Back                Create New Account              │ ← Header (64px)
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Account Name                                  │   │
│  │  [_________________________________]           │   │
│  │  Enter a name for this account                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Address Type                                  │   │
│  │  [Native SegWit (Recommended)      ▼]         │   │
│  │  Lower fees and better privacy                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ℹ️ This account will be derived from your existing    │
│     wallet seed using BIP44 path m/84'/1'/N'/0/0      │
│                                                         │
├────────────────────────────────────────────────────────┤
│  [Cancel]                     [Create Account]         │ ← Footer (64px)
└────────────────────────────────────────────────────────┘
```

#### Import Account Form - Tabs (800px centered)
```
┌────────────────────────────────────────────────────────┐
│  ← Back                Import Account                  │
├────────────────────────────────────────────────────────┤
│  [Private Key]  [Seed Phrase]                          │ ← Tabs
├────────────────────────────────────────────────────────┤
│                                                         │
│  ⚠️ Warning: Imported accounts are NOT backed up by    │
│     your wallet's main seed phrase. Back them up       │
│     separately.                                        │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Private Key (WIF Format)                      │   │
│  │  [_________________________________]           │   │
│  │  [_________________________________]           │   │
│  │  5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYX... │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │  Account Name                                  │   │
│  │  [_________________________________]           │   │
│  │  Enter a name to identify this account         │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
├────────────────────────────────────────────────────────┤
│  [Cancel]                     [Import Account]         │
└────────────────────────────────────────────────────────┘
```

### Interaction States

#### Account Dropdown Interaction Flow
1. **Closed State**: Button shows current account name
2. **Open State**: Dropdown expands, shows account list + action buttons
3. **Hover State**: Account row highlights on hover
4. **Selected State**: Checkmark icon next to current account
5. **Action Button Hover**: Buttons change background color
6. **Close Triggers**: Click outside, ESC key, or select an action

#### Create Account Flow
1. User clicks "Create Account" → Dropdown closes
2. Form opens in modal or inline (800px centered)
3. User enters name and selects address type
4. User clicks "Create Account" → Loading spinner
5. Backend creates account (< 1 second)
6. Success message displays
7. Form closes, dropdown reopens with new account selected

#### Import Account Flow
1. User clicks "Import Account" → Dropdown closes
2. Import form opens with tabs (Private Key / Seed Phrase)
3. User selects tab and enters data
4. Form validates input in real-time
5. User clicks "Import Account" → Loading spinner
6. Backend imports and encrypts account
7. Success message displays
8. Form closes, dropdown reopens with imported account selected

---

## Technical Considerations

### Component Architecture

#### Option 1: Modal-Based Approach (RECOMMENDED)
**Pros:**
- Consistent with current dropdown pattern (dropdown closes, modal opens)
- Clear focus - user attention on form
- Easy to implement with existing Modal component
- 800px centered container already supported

**Cons:**
- Requires closing dropdown first (minor UX step)
- Modal management adds complexity

**Implementation:**
```tsx
// Dashboard.tsx
const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
const [showImportAccountModal, setShowImportAccountModal] = useState(false);

// In Account Dropdown:
<button onClick={() => {
  setShowAccountDropdown(false);
  setShowCreateAccountModal(true);
}}>
  Create Account
</button>

// Modal with AccountCreationForm:
{showCreateAccountModal && (
  <Modal onClose={() => setShowCreateAccountModal(false)}>
    <AccountCreationForm onSuccess={handleAccountCreated} />
  </Modal>
)}
```

#### Option 2: Dedicated Route/View
**Pros:**
- Full-screen form (more space for help content)
- Browser back button works naturally
- URL state (shareable, bookmarkable)

**Cons:**
- More complex routing logic
- Loses dashboard context
- Inconsistent with multisig wizard (opens new tab)

**Decision:** Use Modal-Based Approach (Option 1)

### Backend API Requirements

#### New Message Types
```typescript
// MessageType enum additions:
CREATE_ACCOUNT = 'CREATE_ACCOUNT', // Single-sig HD account
IMPORT_ACCOUNT_PRIVATE_KEY = 'IMPORT_ACCOUNT_PRIVATE_KEY',
IMPORT_ACCOUNT_SEED = 'IMPORT_ACCOUNT_SEED',
```

#### CREATE_ACCOUNT Message Handler
```typescript
// Payload:
{
  name: string;           // Account name (1-30 chars)
  addressType: AddressType; // 'legacy' | 'segwit' | 'native-segwit'
}

// Response:
{
  account: WalletAccount; // Newly created account object
  success: boolean;
  error?: string;
}

// Backend Logic:
1. Get next available account index (find max index + 1)
2. Derive account from master seed using BIP44 path
3. Generate first receiving address (index 0)
4. Create account object with metadata
5. Save to encrypted storage
6. Return account object
```

#### IMPORT_ACCOUNT_PRIVATE_KEY Message Handler
```typescript
// Payload:
{
  privateKey: string;     // WIF format private key
  name: string;           // Account name (1-30 chars)
}

// Response:
{
  account: WalletAccount;
  success: boolean;
  error?: string;
}

// Backend Logic:
1. Validate WIF format
2. Decode private key
3. Derive public key and address
4. Encrypt private key separately
5. Create account object (mark as "imported")
6. Save to encrypted storage
7. Return account object
```

#### IMPORT_ACCOUNT_SEED Message Handler
```typescript
// Payload:
{
  mnemonic: string;       // 12 or 24-word seed phrase
  accountIndex: number;   // BIP44 account index (0-2147483647)
  addressType: AddressType;
  name: string;
}

// Response:
{
  account: WalletAccount;
  success: boolean;
  error?: string;
}

// Backend Logic:
1. Validate BIP39 mnemonic (checksum)
2. Derive seed from mnemonic
3. Derive account using BIP44 path (m/purpose'/coin'/accountIndex')
4. Generate first receiving address
5. Encrypt seed separately
6. Create account object (mark as "imported")
7. Save to encrypted storage
8. Return account object
```

### Storage Schema Updates

#### WalletAccount Type Extension
```typescript
interface WalletAccount {
  index: number;
  name: string;
  addressType: AddressType;
  accountType: 'single-sig' | 'multisig'; // Existing
  importType?: 'hd' | 'private-key' | 'seed'; // NEW
  derivationPath: string;
  addresses: Address[];
  externalIndex: number;
  internalIndex: number;
  multisigConfig?: MultisigConfig;
}
```

#### New Fields Explanation
- **importType**: Tracks how account was created
  - `'hd'`: HD account from main wallet seed (default)
  - `'private-key'`: Imported from single WIF private key
  - `'seed'`: Imported from external seed phrase
- **Used for**:
  - UI badges (show import icon)
  - Security warnings (imported accounts need separate backup)
  - Export logic (can export private key for imported accounts)

### Security Considerations

#### Key Management
1. **HD Accounts** (from main seed):
   - Derived on-demand from main seed
   - Private keys never stored (re-derived when needed)
   - Backed up via main wallet seed phrase

2. **Imported Private Keys**:
   - Encrypted with wallet password
   - Stored separately in encrypted storage
   - User warned during import: "Back up this key separately"

3. **Imported Seed Phrases**:
   - Encrypted with wallet password
   - Stored separately from main seed
   - User warned: "This seed is not backed up by your wallet's main seed"

#### Encryption Strategy
```typescript
// Existing wallet storage:
{
  encryptedSeed: string,      // Main wallet seed (AES-256-GCM)
  accounts: WalletAccount[],  // Account metadata (names, indexes)
  // NEW:
  importedKeys: {
    [accountIndex: number]: {
      encryptedKey: string,   // Encrypted WIF or seed
      iv: string,             // Encryption IV
      salt: string            // Key derivation salt
    }
  }
}
```

### Performance Considerations

#### Account Creation
- **HD Account**: ~50ms (key derivation + address generation)
- **Private Key Import**: ~20ms (decode + validate + encrypt)
- **Seed Import**: ~100ms (seed validation + key derivation + encrypt)

#### Dropdown Rendering
- **Current**: 10 accounts render in ~5ms
- **Target**: 100 accounts render in <50ms
- **Optimization**: Virtual scrolling if >50 accounts

#### Storage Impact
- **HD Account**: ~500 bytes (metadata only)
- **Imported Private Key**: ~1KB (encrypted key + metadata)
- **Imported Seed**: ~2KB (encrypted seed + metadata)
- **Chrome Storage Limit**: 5MB → Can store ~5000 accounts

---

## Edge Cases & Error Handling

### Edge Case 1: Maximum Account Limit
**Scenario:** User tries to create 2147483648th account (BIP44 hardened limit)
**Handling:**
- Backend prevents creation
- Error: "Maximum number of accounts reached (2147483647)"
- Suggest deleting unused accounts or importing with specific index

**Likelihood:** Extremely low (unrealistic to create billions of accounts)

### Edge Case 2: Duplicate Private Key Import
**Scenario:** User imports same private key twice (different names)
**Handling:**
- Check if address already exists in account list
- Error: "This private key has already been imported as '[Account Name]'"
- Suggest using existing account or providing different key

**Likelihood:** Medium (user error during migration)

### Edge Case 3: Seed Phrase Collision
**Scenario:** User imports seed that generates same address as existing account
**Handling:**
- Check first address against all existing addresses
- Warning: "An account with this address already exists. Continue anyway?"
- Allow if user confirms (different derivation paths can exist)

**Likelihood:** Low (requires same seed + same derivation)

### Edge Case 4: Invalid Testnet Private Key
**Scenario:** User provides mainnet WIF key during testnet mode
**Handling:**
- Detect network mismatch (mainnet keys start with 5/K/L, testnet with c)
- Error: "This is a mainnet private key. Please use a testnet key."
- Provide education: "Testnet keys start with 'c'"

**Likelihood:** High (common user mistake)

### Edge Case 5: Corrupted Clipboard Data
**Scenario:** User pastes invalid/corrupted seed phrase from clipboard
**Handling:**
- Validate each word against BIP39 wordlist
- Show specific errors: "Word 3 ('bitcoon') is not valid. Did you mean 'bitcoin'?"
- Highlight invalid words in red
- Suggest corrections using Levenshtein distance

**Likelihood:** Medium (typos, clipboard corruption)

### Edge Case 6: Very Long Account Names
**Scenario:** User enters name with 50+ characters
**Handling:**
- Limit input to 30 characters (form validation)
- Show character counter: "25/30"
- Truncate display in dropdown with ellipsis: "My Super Long Account N..."

**Likelihood:** Low (most users use short names)

### Edge Case 7: Special Characters in Names
**Scenario:** User enters emoji or special Unicode in account name
**Handling:**
- Allow all Unicode characters (including emoji)
- Sanitize for storage (escape special chars)
- Display correctly in UI (UTF-8 support)
- Example: "💰 Savings Account" is valid

**Likelihood:** Medium (emoji are popular)

### Edge Case 8: Account Creation During Wallet Lock
**Scenario:** Wallet auto-locks while user is filling account creation form
**Handling:**
- Detect lock state via periodic polling
- Show warning: "Wallet has been locked. Please unlock to continue."
- Preserve form data in session storage
- Restore form after unlock

**Likelihood:** Low (form fills quickly)

### Edge Case 9: Browser Crash During Account Creation
**Scenario:** Browser crashes after user submits form but before confirmation
**Handling:**
- Backend saves account atomically (all-or-nothing)
- If account created but response lost, user sees it on next unlock
- No duplicate account creation (idempotent operation)
- User refreshes and sees new account in dropdown

**Likelihood:** Very low (rare browser crash)

### Edge Case 10: Import Account with Zero Balance
**Scenario:** User imports seed/key for account that has never received Bitcoin
**Handling:**
- Import succeeds even with 0 balance
- Display "0.00000000 BTC" in dropdown
- User can generate addresses normally
- No warning (valid use case for new accounts)

**Likelihood:** High (common for fresh imports)

---

## Out of Scope

### Features NOT Included in v0.10.0

1. **Delete Account**
   - Reason: Requires careful UX (prevent accidental deletion)
   - Requires backup verification (ensure seed/key backed up)
   - MVP focuses on creation, not deletion
   - Target: v0.11.0

2. **Export Account (Private Key/Seed)**
   - Reason: Security-sensitive feature needs audit
   - Requires clear warning flow
   - Target: v0.11.0

3. **Account Reordering (Drag & Drop)**
   - Reason: Nice-to-have, not critical
   - Adds complexity to dropdown
   - Target: v0.12.0

4. **Batch Import (Multiple Accounts)**
   - Reason: Power user feature, not MVP
   - Complex UI for selecting multiple indexes
   - Target: v0.12.0

5. **Address Preview Before Import**
   - Reason: Good UX but adds complexity
   - Requires address generation before commit
   - Target: v0.11.0

6. **Hardware Wallet Import**
   - Reason: Requires hardware wallet integration (Phase 3)
   - Separate feature set
   - Target: v1.2.0 (Phase 3)

7. **Watch-Only Accounts (Xpub Import)**
   - Reason: Different use case (no spending)
   - Requires separate UI flow
   - Target: v0.13.0

8. **Account Categories/Tags**
   - Reason: Over-engineering for MVP
   - Users can use name prefixes (e.g., "Personal - Savings")
   - Target: v0.14.0 or later

9. **Multi-Wallet Support**
   - Reason: Major architectural change
   - Out of scope for current phase
   - Target: Phase 3 (v1.x)

### Why These Are Out of Scope
- **Focus on MVP**: Complete core account management first
- **Security Review**: Sensitive features need thorough audit
- **User Feedback**: Wait for user needs before adding complexity
- **Technical Debt**: Avoid over-engineering early

---

## Success Metrics

### Quantitative Metrics

#### Adoption Metrics
- **Account Creation Rate**
  - Target: 30% of users create 2+ accounts within 7 days
  - Measurement: Track CREATE_ACCOUNT message calls
  - Success: >25% adoption

- **Import Usage Rate**
  - Target: 10% of users import accounts
  - Measurement: Track IMPORT_ACCOUNT_* message calls
  - Success: >5% adoption

- **Dropdown Engagement**
  - Target: 50% of users open Account dropdown within first session
  - Measurement: Track dropdown open events
  - Success: >40% engagement

#### Performance Metrics
- **Account Creation Time**
  - Target: <1 second (HD), <2 seconds (import)
  - Measurement: Time from submit to success
  - Success: 95th percentile under target

- **Error Rate**
  - Target: <2% of account creations fail
  - Measurement: Track failed CREATE_ACCOUNT attempts
  - Success: <3% error rate

#### User Experience Metrics
- **Form Completion Rate**
  - Target: 80% of users who open form complete it
  - Measurement: Track form opens vs. successful creates
  - Success: >70% completion

- **Retry Rate**
  - Target: <10% of users retry after error
  - Measurement: Track retries after failed attempts
  - Success: <15% retry rate

### Qualitative Metrics

#### User Satisfaction
- **User Feedback**: "Easy to create new accounts" (post-implementation survey)
- **Support Tickets**: Reduction in "How do I create an account?" tickets
- **User Confusion**: Reduction in users clicking "Create Multisig" by mistake

#### Feature Clarity
- **Button Labeling**: Users understand difference between Create/Import/Multisig
- **Form Usability**: Users complete forms without errors
- **Error Clarity**: Users understand error messages and can resolve issues

### Monitoring & Tracking

#### Analytics Events
```typescript
// Track these events:
'account_dropdown_opened'
'create_account_clicked'
'import_account_clicked'
'create_multisig_clicked'
'account_created_success'
'account_created_failure'
'account_imported_success'
'account_imported_failure'
'account_form_abandoned'
```

#### Error Tracking
- Log all account creation/import errors
- Track error types (validation, backend, network)
- Monitor error rate trends over time

#### User Behavior
- Track most popular account creation paths
- Measure time spent on forms
- Identify common user mistakes (e.g., invalid seeds)

---

## Implementation Plan

### Phase 1: Foundation (Week 1)

#### Sprint 1.1: Backend API (Days 1-2)
**Owner:** Backend Developer

**Tasks:**
1. Add CREATE_ACCOUNT message type and handler
   - [ ] Define message payload schema
   - [ ] Implement account derivation logic (BIP44)
   - [ ] Add account to wallet storage
   - [ ] Return created account object
   - [ ] Unit tests for handler

2. Add IMPORT_ACCOUNT_PRIVATE_KEY message handler
   - [ ] Define message payload schema
   - [ ] Validate WIF format
   - [ ] Decrypt/encrypt private key
   - [ ] Add account to storage (mark as imported)
   - [ ] Unit tests for handler

3. Add IMPORT_ACCOUNT_SEED message handler
   - [ ] Define message payload schema
   - [ ] Validate BIP39 mnemonic
   - [ ] Derive account from seed
   - [ ] Encrypt and store seed separately
   - [ ] Unit tests for handler

4. Update WalletAccount type
   - [ ] Add `importType` field
   - [ ] Update storage schema
   - [ ] Add migration logic (existing accounts → importType: 'hd')

**Deliverables:**
- Backend API fully functional
- All message handlers tested
- Storage schema updated

**Dependencies:** None

---

#### Sprint 1.2: Account Dropdown UI (Days 3-4)
**Owner:** Frontend Developer

**Tasks:**
1. Update Account Dropdown component
   - [ ] Add "Create Account" button (orange, primary)
   - [ ] Add "Import Account" button (gray, secondary)
   - [ ] Keep "Create Multisig Account" button (gray, secondary)
   - [ ] Add divider above buttons
   - [ ] Update spacing and padding

2. Add import badges to account list
   - [ ] Show import icon for imported accounts
   - [ ] Add tooltip: "Imported account"
   - [ ] Update account list styling

3. Wire button click handlers
   - [ ] Create Account → Open modal
   - [ ] Import Account → Open modal
   - [ ] Close dropdown when modal opens

**Deliverables:**
- Updated Account Dropdown UI
- All buttons functional (open modals)
- Visual design matches spec

**Dependencies:** None (UI only)

---

### Phase 2: Account Creation Flow (Week 2)

#### Sprint 2.1: Create Account Form (Days 5-7)
**Owner:** Frontend Developer

**Tasks:**
1. Create AccountCreationForm component
   - [ ] 800px centered container
   - [ ] Header with "Create Account" title
   - [ ] Account name input (validation)
   - [ ] Address type dropdown
   - [ ] Info box explaining HD derivation
   - [ ] Footer with Cancel/Create buttons

2. Implement form validation
   - [ ] Name required, max 30 chars
   - [ ] Address type required
   - [ ] Real-time error display
   - [ ] Disable submit until valid

3. Wire to backend API
   - [ ] Call CREATE_ACCOUNT message
   - [ ] Handle loading state (spinner)
   - [ ] Handle success (close modal, update accounts)
   - [ ] Handle errors (display error message)

4. Add success flow
   - [ ] Display success toast
   - [ ] Close modal
   - [ ] Select newly created account
   - [ ] Update dashboard

**Deliverables:**
- Functional Create Account form
- Full validation and error handling
- Success flow complete

**Dependencies:** Backend API (Sprint 1.1)

---

#### Sprint 2.2: Import Account Form - Private Key (Days 8-10)
**Owner:** Frontend Developer

**Tasks:**
1. Create ImportAccountModal component
   - [ ] 800px centered container
   - [ ] Tab navigation (Private Key / Seed Phrase)
   - [ ] Security warning banner
   - [ ] Footer with Cancel/Import buttons

2. Implement Private Key tab
   - [ ] Private key textarea (WIF format)
   - [ ] Account name input
   - [ ] Real-time validation
   - [ ] Format hints and examples

3. Wire to backend API
   - [ ] Call IMPORT_ACCOUNT_PRIVATE_KEY message
   - [ ] Handle loading state
   - [ ] Handle success (update accounts, show badge)
   - [ ] Handle errors (WIF validation, duplicate key)

4. Add security warnings
   - [ ] Display warning: "Not backed up by wallet seed"
   - [ ] Require user acknowledgment
   - [ ] Provide backup instructions

**Deliverables:**
- Functional Private Key import
- Security warnings displayed
- Full error handling

**Dependencies:** Backend API (Sprint 1.1)

---

### Phase 3: Seed Import & Polish (Week 3)

#### Sprint 3.1: Import Account Form - Seed Phrase (Days 11-13)
**Owner:** Frontend Developer

**Tasks:**
1. Implement Seed Phrase tab
   - [ ] Seed phrase textarea (12/24 words)
   - [ ] Account index input (default 0)
   - [ ] Address type dropdown
   - [ ] Account name input
   - [ ] Real-time validation (BIP39 wordlist)

2. Wire to backend API
   - [ ] Call IMPORT_ACCOUNT_SEED message
   - [ ] Handle loading state
   - [ ] Handle success (update accounts, show badge)
   - [ ] Handle errors (invalid seed, checksum)

3. Add word validation
   - [ ] Highlight invalid words in red
   - [ ] Suggest corrections (Levenshtein distance)
   - [ ] Show word count (12/24)

4. Add security warnings
   - [ ] Display: "Different seed, back up separately"
   - [ ] Require acknowledgment
   - [ ] Provide backup instructions

**Deliverables:**
- Functional Seed Phrase import
- Word validation and suggestions
- Security warnings displayed

**Dependencies:** Backend API (Sprint 1.1)

---

#### Sprint 3.2: Testing & Bug Fixes (Days 14-15)
**Owner:** QA Engineer

**Tasks:**
1. Manual testing
   - [ ] Test all account creation flows
   - [ ] Test all import flows (private key, seed)
   - [ ] Test edge cases (invalid inputs, duplicates)
   - [ ] Test on testnet with real data
   - [ ] Test with 50+ accounts (performance)

2. Security testing
   - [ ] Verify encryption of imported keys
   - [ ] Test wallet lock during account creation
   - [ ] Verify backup warnings displayed
   - [ ] Test private key handling (no console logs)

3. Usability testing
   - [ ] Test with real users (3-5 users)
   - [ ] Gather feedback on form clarity
   - [ ] Identify UX pain points
   - [ ] Document user confusion

4. Bug fixes
   - [ ] Fix critical bugs (P0)
   - [ ] Fix high-priority bugs (P1)
   - [ ] Document known issues (P2/P3)

**Deliverables:**
- All critical bugs fixed
- QA sign-off
- User feedback documented

**Dependencies:** All previous sprints

---

#### Sprint 3.3: Documentation & Release Prep (Days 16-17)
**Owner:** Product Manager

**Tasks:**
1. Update documentation
   - [ ] Update README with account creation instructions
   - [ ] Update CHANGELOG with v0.10.0 features
   - [ ] Update product-manager-notes.md
   - [ ] Create user guide (how to create/import accounts)

2. Release preparation
   - [ ] Draft release notes
   - [ ] Prepare marketing copy (if applicable)
   - [ ] Create demo video/GIFs
   - [ ] Update screenshots in docs

3. Final review
   - [ ] Product Manager approval
   - [ ] Security Expert review (imported keys)
   - [ ] UI/UX Designer review (forms, buttons)
   - [ ] Blockchain Expert review (derivation paths)

**Deliverables:**
- Documentation updated
- Release notes ready
- All approvals obtained

**Dependencies:** Sprint 3.2 complete

---

### Phase 4: Release (Week 4)

#### Sprint 4.1: Release v0.10.0 (Day 18)
**Owner:** Product Manager + Backend Developer

**Tasks:**
1. Merge feature branch
   - [ ] Final code review
   - [ ] Merge to main branch
   - [ ] Tag release (v0.10.0)

2. Build and deploy
   - [ ] Build production bundle
   - [ ] Test production build
   - [ ] Update version in manifest.json

3. Release announcement
   - [ ] Publish CHANGELOG
   - [ ] Announce on project channels
   - [ ] Update README and docs

**Deliverables:**
- v0.10.0 released
- Documentation published
- Announcement sent

**Dependencies:** All previous phases complete

---

#### Sprint 4.2: Post-Release Monitoring (Days 19-21)
**Owner:** QA Engineer + Product Manager

**Tasks:**
1. Monitor adoption
   - [ ] Track account creation metrics
   - [ ] Monitor error rates
   - [ ] Track user feedback

2. Address issues
   - [ ] Respond to user reports
   - [ ] Fix critical bugs (hotfix if needed)
   - [ ] Document enhancement requests

3. Gather feedback
   - [ ] User survey (optional)
   - [ ] Analyze analytics data
   - [ ] Identify areas for improvement

**Deliverables:**
- Metrics dashboard
- User feedback summary
- Issue backlog for v0.11.0

**Dependencies:** Sprint 4.1 (release)

---

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1: Foundation | Week 1 (Days 1-4) | Backend API, Dropdown UI |
| Phase 2: Account Creation | Week 2 (Days 5-10) | Create form, Private Key import |
| Phase 3: Seed Import & Polish | Week 3 (Days 11-17) | Seed import, Testing, Docs |
| Phase 4: Release | Week 4 (Days 18-21) | Release v0.10.0, Monitoring |

**Total Duration:** 3-4 weeks (21 working days)

---

## Risk Assessment

### High Risk

#### Risk 1: User Confusion - Import vs. Create
**Likelihood:** Medium
**Impact:** High
**Mitigation:**
- Clear labeling and tooltips
- Help modal explaining difference
- Visual distinction (icons, colors)
- User testing before release

#### Risk 2: Security - Imported Keys Not Backed Up
**Likelihood:** High
**Impact:** Critical
**Mitigation:**
- Prominent security warnings during import
- Require user acknowledgment checkbox
- Show backup reminder after import
- Display import badge in account list
- Document in user guide

### Medium Risk

#### Risk 3: Performance - Many Accounts Slow Dropdown
**Likelihood:** Low
**Impact:** Medium
**Mitigation:**
- Virtual scrolling for 50+ accounts
- Lazy load account balances
- Optimize React rendering (memo, useMemo)
- Performance testing with 100+ accounts

#### Risk 4: UX - Form Too Complex
**Likelihood:** Medium
**Impact:** Medium
**Mitigation:**
- Keep forms simple (minimal fields)
- Progressive disclosure (advanced options hidden)
- User testing to validate
- Iterate based on feedback

### Low Risk

#### Risk 5: Edge Cases - Invalid Input Handling
**Likelihood:** Medium
**Impact:** Low
**Mitigation:**
- Comprehensive validation
- Clear error messages
- Unit tests for all edge cases
- QA testing with invalid inputs

#### Risk 6: Compatibility - Old Wallets
**Likelihood:** Low
**Impact:** Low
**Mitigation:**
- Storage migration for old wallets
- Add importType field with default 'hd'
- Test with wallets created in v0.9.0

---

## Dependencies

### Internal Dependencies
- **Backend Developer**: API implementation (Sprints 1.1, 1.2)
- **Frontend Developer**: UI implementation (Sprints 1.2, 2.1, 2.2, 3.1)
- **UI/UX Designer**: Form design review (before Sprint 2.1)
- **Security Expert**: Imported key encryption review (before Sprint 2.2)
- **Blockchain Expert**: BIP44 derivation review (before Sprint 1.1)
- **QA Engineer**: Testing and validation (Sprint 3.2)
- **Product Manager**: Requirements, docs, release (Sprints 3.3, 4.1)

### External Dependencies
- **Existing Components**:
  - `/src/tab/components/WalletSetup.tsx` (reuse logic)
  - `/src/tab/components/shared/Modal.tsx` (for forms)
  - `/src/tab/hooks/useBackgroundMessaging.ts` (for API calls)

- **Backend APIs**:
  - WalletStorage (account persistence)
  - HDWallet (key derivation)
  - Encryption utilities (AES-256-GCM)

- **Bitcoin Libraries**:
  - bitcoinjs-lib (address generation, WIF decoding)
  - bip32 (HD wallet derivation)
  - bip39 (seed validation)

### Blocking Dependencies
- None - All dependencies are internal and available

---

## Open Questions

### Questions for Security Expert
1. **Q:** Should imported private keys be encrypted with a different password than the wallet password?
   - **Context:** Additional security layer for hot imports
   - **Trade-off:** More complexity vs. more security
   - **Recommendation:** Use same password for MVP (simpler UX)

2. **Q:** Should we limit the number of imported accounts (e.g., max 10)?
   - **Context:** Too many imports = security risk (more keys to manage)
   - **Trade-off:** Flexibility vs. security best practices
   - **Recommendation:** No limit, but warn user after 5 imports

### Questions for UI/UX Designer
1. **Q:** Should Create Account form be inline or modal?
   - **Context:** Modal is more focused, inline is more seamless
   - **Trade-off:** Focus vs. flow
   - **Recommendation:** Modal (consistent with multisig wizard)

2. **Q:** Should import tabs be side-by-side or dropdown?
   - **Context:** Tabs are clearer, dropdown saves space
   - **Trade-off:** Clarity vs. space efficiency
   - **Recommendation:** Tabs (only 2 options, tabs are clearer)

### Questions for Blockchain Expert
1. **Q:** Should we support custom derivation paths for imports?
   - **Context:** Power users may want non-standard paths
   - **Trade-off:** Flexibility vs. complexity
   - **Recommendation:** Not in MVP, add in v0.11.0

2. **Q:** Should we discover existing accounts when importing seed?
   - **Context:** Seed may have multiple accounts with balances
   - **Trade-off:** Completeness vs. performance
   - **Recommendation:** Not in MVP (import single account only)

### Questions for Product Manager
1. **Q:** Should we allow account deletion?
   - **Context:** Users may want to remove unused accounts
   - **Trade-off:** Cleanliness vs. risk of accidental deletion
   - **Recommendation:** Not in v0.10.0, add in v0.11.0 with confirmation

2. **Q:** Should imported accounts be visually distinct (different icon/color)?
   - **Context:** Helps users understand backup status
   - **Trade-off:** Clarity vs. visual clutter
   - **Recommendation:** Yes - small import icon badge

---

## Appendix

### A. Related Documents
- **ARCHITECTURE.md** - System architecture and data flow
- **TAB_BASED_MULTISIG_WIZARD_PRD.md** - Multisig wizard PRD (similar scope)
- **MULTISIG_WIZARD_TAB_DESIGN_SPEC.md** - Tab layout design patterns
- **product-manager-notes.md** - Product roadmap and decisions
- **frontend-developer-notes.md** - React patterns and components
- **backend-developer-notes.md** - Message handlers and storage
- **security-expert-notes.md** - Encryption and security model

### B. Design Assets
- **Account Dropdown Mockups** - Figma link (TBD)
- **Form Layouts** - Wireframes (TBD)
- **Button Styles** - Style guide (TBD)

### C. User Research
- **User Interviews** - Findings from 5 users (TBD)
- **Usability Testing** - Session recordings (TBD)
- **Survey Results** - User feedback on account management (TBD)

### D. Competitive Analysis
- **MetaMask** - Account creation flow (benchmark)
- **Electrum** - Multi-wallet management (reference)
- **Sparrow Wallet** - Account import options (inspiration)

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-18 | Product Manager | Initial PRD created |

---

**Document Status:** ✅ Ready for Review
**Next Steps:**
1. Review with Security Expert (imported key encryption)
2. Review with UI/UX Designer (form layouts and flows)
3. Review with Blockchain Expert (BIP44 derivation paths)
4. Review with Backend Developer (API feasibility)
5. Review with Frontend Developer (implementation plan)
6. Obtain all approvals before starting Sprint 1.1

---

**END OF DOCUMENT**
