# User Flows & Journey Maps

**Last Updated**: October 22, 2025
**Owner**: UI/UX Designer
**Status**: Complete - Tab Architecture (v0.9.0+)

[← Back to Index](./_INDEX.md)

---

## Quick Navigation

- [Core Wallet Flows](#core-wallet-flows)
- [Account Management Flows](#account-management-flows)
- [Transaction Flows](#transaction-flows)
- [Multisig Flows](#multisig-flows)
- [Privacy Flows (v0.11.0)](#privacy-flows-v0110)

---

## Overview

This document maps all user flows through the Bitcoin Wallet extension, from initial setup to advanced features.

**Flow Design Principles:**
- Clear entry and exit points
- Progress indicators for multi-step processes
- Ability to go back (except security-critical steps)
- Clear error states and recovery paths
- Confirmation before destructive actions

---

## Core Wallet Flows

### Flow 1: First-Time Wallet Creation

**Purpose**: Create new wallet with generated seed phrase

**Flow Diagram:**
```
1. Splash Screen
   ↓ [Create New Wallet]
2. Address Type Selection
   ↓ [Next]
3. Password Creation
   ↓ [Create Wallet]
4. Seed Phrase Display
   ↓ [Continue]
5. Seed Phrase Confirmation
   ↓ [Confirm]
6. Dashboard (Wallet Created)
```

**Design Notes:**
- Progress indicator at top (Step 1 of 4, etc.)
- Back button enabled except on seed phrase display
- Clear visual feedback at each step
- Warning messages prominent on seed phrase screens
- Cannot skip seed phrase confirmation

**Critical Decision Points:**
- **Address Type**: Defaults to Native SegWit (recommended)
- **Password Strength**: Must meet minimum requirements
- **Seed Confirmation**: Must verify 3 random words correctly

**Error Handling:**
- Invalid password: Show inline error, prevent progress
- Failed confirmation: Shake animation, show error, let user retry
- Weak password: Warning banner, still allow progress (user choice)

**Expected Duration**: 3-5 minutes for new users

---

### Flow 2: Import Existing Wallet

**Purpose**: Restore wallet from seed phrase or private key

**Flow Diagram:**
```
1. Splash Screen
   ↓ [Import Wallet]
2. WalletSetup (Import Tab)
   ├─ Import Seed Phrase Sub-flow
   │  ├─ Seed Phrase Entry (12/24 words)
   │  ├─ Address Type Selection
   │  ├─ Password Creation
   │  └─ Account Discovery
   │
   └─ Import Private Key Sub-flow
      ├─ Private Key Entry (WIF)
      ├─ Address Type Display (detected)
      ├─ Account Name
      └─ Password Creation
   ↓
3. Dashboard (Wallet Imported)
```

**Design Notes:**
- Tab navigation for import method selection (Seed Phrase / Private Key)
- Real-time validation (word suggestions, WIF format check)
- Auto-suggest BIP39 words as user types
- Validate seed phrase checksum before allowing progress
- Show loading during account discovery
- Display first address for verification

**Critical Decision Points:**
- **Import Method**: Seed phrase (most common) vs. Private key (advanced)
- **Address Type**: Auto-detect for private key, user choice for seed phrase
- **Account Discovery**: Scan for existing transactions (seed phrase only)

**Error Handling:**
- Invalid seed phrase: Red error message with suggestions
- Invalid private key WIF: Specific error with format example
- Network mismatch: Warning if key/seed is for different network

**Expected Duration**: 2-4 minutes

---

### Flow 3: Unlock Wallet

**Purpose**: Re-enter password after auto-lock or browser close

**Flow Diagram:**
```
1. Unlock Screen
   ↓ Enter password
   ↓ [Unlock Wallet]
2. Authentication (Background)
   ↓ Success
3. Dashboard

Alternative: Wrong Password
2. Authentication
   ↓ Error
3. Unlock Screen
   • Error message "Incorrect password"
   • Password field cleared
   • Shake animation
```

**Design Notes:**
- Password input auto-focused
- Show/hide password toggle
- Clear error message on failure with shake animation
- Loading state on unlock button while authenticating
- No "forgot password" option (cannot recover wallet password)

**Critical Decision Points:**
- **Forgot Password**: Can only import wallet with seed phrase (data loss warning)

**Error Handling:**
- Wrong password: Shake animation, clear field, show error
- 3 failed attempts: Show warning about importing wallet
- 10 failed attempts: Show security notice, suggest reimport

**Expected Duration**: 5-10 seconds

---

## Account Management Flows

### Flow 4: Create New Account

**Purpose**: Create additional HD wallet account from same seed

**Flow Diagram:**
```
1. Dashboard or Settings
   ↓ Open account switcher dropdown
   ↓ [Create Account]
2. Create Account Modal
   ├─ Account Name (optional)
   ├─ Address Type Selection
   └─ [Create]
   ↓
3. Account Created
   ↓ Modal closes
4. Dashboard (Switched to new account)
```

**Design Notes:**
- Modal-based form (800px width)
- Default names: "Account 2", "Account 3", etc.
- Address type defaults to Native SegWit (recommended)
- Real-time character counter for name (max 30)
- Preview of first address after creation
- Auto-switch to new account after creation

**Critical Decision Points:**
- **Account Name**: Default vs custom
- **Address Type**: Native SegWit (recommended) vs others

**Error Handling:**
- Duplicate name: Warning, append number
- Creation failure: Show error, allow retry

**Expected Duration**: 15-30 seconds

---

### Flow 5: Import Account (Into Existing Wallet)

**Purpose**: Import external account via private key or seed into existing wallet

**Flow Diagram:**
```
1. Dashboard or Settings
   ↓ Open account switcher dropdown
   ↓ [Import Account]
2. Import Account Modal
   ├─ Security Warning Banner (always visible)
   ├─ Tab Selection: Private Key / Seed Phrase
   ├─ Import Method Content
   │  ├─ Private Key Tab:
   │  │   ├─ WIF Entry (file upload or manual)
   │  │   ├─ Real-time validation
   │  │   ├─ Preview (network, first address, type)
   │  │   └─ Account Name
   │  │
   │  └─ Seed Phrase Tab:
   │      ├─ 12/24 word entry
   │      ├─ Address type selection
   │      ├─ Preview (first address)
   │      └─ Account Name
   └─ [Import]
   ↓
3. Account Imported
   ↓ Modal closes
4. Dashboard (Switched to imported account)
   • Imported badge visible in account list
```

**Design Notes:**
- Prominent amber warning: "NOT backed up by main seed"
- Tab navigation for method selection
- Real-time WIF/seed validation
- Preview shows network, first address, type
- Imported accounts get blue download badge (↓)
- Auto-switch to imported account after import

**Critical Decision Points:**
- **Import Method**: Private key (single) vs seed phrase (HD)
- **Account Name**: Required for organization

**Error Handling:**
- Invalid WIF: Show format example, clear error
- Invalid seed: Word suggestions, checksum error
- Network mismatch: Warning banner, prevent import
- Duplicate detection: Warning if same key/seed already imported

**Expected Duration**: 1-2 minutes

---

### Flow 6: Switch Accounts

**Purpose**: Switch between wallet accounts

**Flow Diagram:**
```
1. Any Screen
   ↓ Click account switcher (sidebar footer)
2. Account Dropdown Panel
   ├─ List of accounts with balances
   ├─ Current account highlighted
   └─ Click different account
   ↓
3. Same Screen (updated for new account)
   • Balance updated
   • Transaction history updated
   • Account name updated
```

**Design Notes:**
- Dropdown opens on click
- Current account highlighted with checkmark
- Show balance for each account
- Show address type badge
- Show imported badge if applicable
- Instant switch (no loading unless syncing needed)

**Expected Duration**: 2-3 seconds

---

## Transaction Flows

### Flow 7: Send Bitcoin Transaction

**Purpose**: Send Bitcoin to an address

**Flow Diagram:**
```
1. Dashboard
   ↓ [Send Button] or Send modal
2. Send Transaction Form
   ├─ Recipient Address Entry
   │  • Manual entry or paste
   │  • Address book selection
   │  • Contact selection (xpub or single address)
   ├─ Amount Entry
   │  • BTC amount
   │  • USD equivalent display
   │  • Max button
   ├─ Fee Selection
   │  • Slow / Medium / Fast
   │  • Sat/vB display
   └─ Privacy Indicators (v0.11.0)
      • Change address indicator
      • Round number randomization (if enabled)
      • Contact reuse warning (if applicable)
   ↓ [Review Transaction]
3. Transaction Review Screen
   ├─ From: Account name + address
   ├─ To: Recipient address
   ├─ Amount breakdown
   │  • Send amount
   │  • Network fee
   │  • Total
   ├─ Privacy indicators
   └─ [Cancel] [Confirm & Send]
   ↓ [Confirm & Send]
4. Password Confirmation Modal
   ├─ Enter password
   ├─ Transaction summary
   └─ [Cancel] [Send Now]
   ↓ [Send Now]
5. Broadcasting Transaction
   • Loading state
   ↓
6. Transaction Success Modal
   ├─ Success icon + glow
   ├─ "Transaction Sent!"
   ├─ TX ID with copy button
   ├─ Block explorer link
   └─ [Done]
   ↓ [Done]
7. Dashboard
   • Updated balance
   • Transaction in history (pending)
```

**Design Notes:**
- Real-time address validation with visual feedback (green border when valid)
- Show fee in both BTC and sat/vB
- Disable Review button until all inputs valid
- Transaction review shows all details clearly
- Password modal auto-focuses input
- Success screen shows TX ID with copy button and explorer link
- Contact privacy warnings if address reuse detected

**Critical Decision Points:**
- **Recipient**: Manual address, address book, or contact
- **Amount**: Partial send vs Max (all funds)
- **Fee Speed**: Slow (cheaper) vs Fast (expensive)
- **Password**: Must re-enter for security

**Error Handling:**
- Invalid address: Red border, format error message
- Insufficient funds: Calculate max sendable (minus fee)
- Fee too low: Warning, but allow (user choice)
- Broadcast failure: Show error, allow retry or save unsigned TX

**Privacy Considerations (v0.11.0):**
- Show warning if sending to contact with high reuse count (≥5)
- Display green success box for xpub contacts (address rotation)
- Show change address indicator in review (green privacy badge)
- Round number randomization override button if enabled

**Expected Duration**: 30 seconds - 2 minutes

---

### Flow 8: Receive Bitcoin

**Purpose**: Display receiving address with QR code

**Flow Diagram:**
```
1. Dashboard
   ↓ [Receive Button] or Receive modal/screen
2. Receive Screen
   ├─ QR Code (200x200px, gold border)
   ├─ Address display (monospace, copy button)
   ├─ Account info (Account name • Address #3)
   ├─ Privacy indicators (v0.11.0)
   │  • Fresh address badge (green ✨ Fresh)
   │  • OR Previously used badge (amber ⚠️)
   │  • Auto-generation success banner (if just generated)
   ├─ [Generate New Address] (optional)
   └─ Privacy tip: "Use new address for each transaction"
   ↓ Optional: [Generate New Address]
3. New Address Generated
   • QR code updates
   • Address updates
   • Success banner shows briefly (3s auto-dismiss)
   • Fresh badge appears
```

**Design Notes:**
- QR code generated instantly
- Address formatted for readability (groups of 4 characters)
- Copy button provides toast feedback ("Address copied!")
- Privacy tip about address reuse
- Generate new address increments HD wallet index
- Auto-generation privacy banner (green, auto-dismiss after 3s)

**Privacy Enhancements (v0.11.0):**
- **Auto-generation banner**: Green success box, "New address generated for privacy"
- **Fresh badge**: Green "✨ Fresh" for unused addresses
- **Previously used badge**: Amber "⚠️ Previously Used" with inline warning
- **Warning content**: "Privacy Risk: Reusing addresses links transactions publicly"
- **Learn More link**: Opens privacy documentation

**Expected Duration**: 10-30 seconds

---

### Flow 9: View Transaction History

**Purpose**: Browse past transactions

**Flow Diagram:**
```
1. Dashboard
   ↓ Click transaction in recent list
   ↓ OR navigate to Activity/History screen
2. Transaction History Screen
   ├─ Filter tabs: [All] [Sent] [Received]
   ├─ Grouped by date (Today, Yesterday, date)
   ├─ Transaction cards
   │  • Icon (↗ sent, ↙ received)
   │  • Amount (colored: red sent, green received)
   │  • Status + time
   │  • USD equivalent
   └─ Click transaction card
   ↓
3. Transaction Detail View
   ├─ Status badge (confirmed/pending)
   ├─ Confirmation count (if <6)
   ├─ Amount + USD
   ├─ Details:
   │  • Date and time
   │  • From address (+ account name if ours)
   │  • To address
   │  • Fee (BTC and sat/vB)
   │  • Transaction ID (copy button)
   ├─ Privacy badges (v0.11.0)
   │  • Contact privacy indicator
   │  • Change address indicator
   └─ [View on Block Explorer] link
```

**Design Notes:**
- Filter tabs work instantly (no loading)
- Infinite scroll or pagination for long lists
- Empty state: "No transactions yet" with Receive CTA
- Pending transactions show progress (0/6 confirmations)
- Sent transactions negative (red), received positive (green)
- Copy buttons for addresses and TX ID

**Expected Duration**: 10 seconds - 2 minutes (browsing)

---

## Multisig Flows

### Flow 10: Create Multisig Wallet

**Purpose**: Create multi-signature wallet (2-of-2, 2-of-3, 3-of-5)

**Flow Diagram:**
```
1. Dashboard/Settings
   ↓ Click "Multisig Wallets" in sidebar
   ↓ OR [Create Multisig Account] in dropdown
2. Multisig Setup Landing Page
   ↓ [Create Multisig Wallet]
3. Multisig Wizard - Step 1: Configuration
   ├─ Config selector (2-of-2, 2-of-3, 3-of-5)
   ├─ Risk explanation
   ├─ Educational content
   └─ [Next]
   ↓
4. Step 2: Wallet Details
   ├─ Wallet name
   ├─ Address type (P2SH, P2WSH, P2SH-P2WSH)
   └─ [Next]
   ↓
5. Step 3: Co-signers
   ├─ Import co-signer xpubs (N-1 xpubs)
   ├─ Your key auto-included
   ├─ Validation and preview
   └─ [Next]
   ↓
6. Step 4: Review & Create
   ├─ Summary of configuration
   ├─ First address preview
   ├─ Export your xpub section
   └─ [Create Multisig Wallet]
   ↓
7. Wallet Created
   ↓ Navigate to multisig dashboard
8. Multisig Wallet Dashboard
   • Balance
   • Receive address
   • Pending PSBTs
   • Transaction history
```

**Design Notes:**
- Full-tab wizard (800px centered)
- Progress indicator (1 of 4, 2 of 4, etc.)
- Back button enabled on all steps
- Educational content with tooltips and info boxes
- BIP67 deterministic sorting explained
- Clear validation at each step
- Export xpub with QR code for easy sharing

**Critical Decision Points:**
- **Configuration**: Security vs usability trade-off
- **Address Type**: P2WSH recommended for best privacy/fees
- **Co-signer xpubs**: Must collect from all parties before creation

**Expected Duration**: 5-10 minutes (excluding co-signer coordination)

---

### Flow 11: Sign PSBT (Partially Signed Bitcoin Transaction)

**Purpose**: Sign pending multisig transaction

**Flow Diagram:**
```
1. Multisig Wallet Dashboard
   ↓ See pending PSBT in list
   ↓ Click PSBT
2. PSBT Detail View
   ├─ Transaction summary
   │  • From (wallet name)
   │  • To (recipient address)
   │  • Amount
   │  • Fee
   ├─ Signature status (1 of 2 signed, need 1 more)
   ├─ Signed by: [List of signed xpub fingerprints]
   └─ [Sign Transaction]
   ↓ [Sign Transaction]
3. Password Confirmation Modal
   ├─ Enter password
   └─ [Sign]
   ↓
4. PSBT Signed
   ├─ Update signature count (2 of 2)
   ├─ If threshold met: Show "Ready to Broadcast"
   └─ [Broadcast] OR [Export PSBT]
   ↓ [Broadcast] (if threshold met)
5. Transaction Broadcast
   ↓ Success
6. Transaction Confirmed
   • Move from pending to history
   • Update balance
```

**Design Notes:**
- Clear signature progress indicator
- Show who has signed (xpub fingerprints)
- Cannot sign twice with same key
- Export PSBT options: Base64, Hex, QR code chunks
- Auto-detect threshold met → enable broadcast

**Expected Duration**: 30 seconds - 2 minutes

---

## Privacy Flows (v0.11.0)

### Flow 12: Enable Privacy Mode Settings

**Purpose**: Configure optional privacy mode features

**Flow Diagram:**
```
1. Settings Screen
   ↓ Scroll to "Privacy Mode" section
   ↓ Click to expand
2. Privacy Mode Section (Expanded)
   ├─ Shield icon header
   ├─ Subtitle: "Advanced privacy features"
   ├─ Toggle 1: Randomize Round Amounts
   │  • Benefit: Reduces transaction fingerprinting
   │  • Cost: None
   ├─ Toggle 2: Randomize API Timing
   │  • Benefit: Prevents timing analysis
   │  • Cost: ⚠️ Slower balance updates
   ├─ Toggle 3: Delay Broadcast
   │  • Benefit: Prevents IP linking
   │  • Cost: ⚠️ Slower transaction sending
   ├─ Privacy Tips info box
   │  • Default protections listed
   │  • Tor recommendation
   └─ "Learn More" link
   ↓ Toggle any setting
3. Setting Updated
   • Toggle animation (200ms)
   • Immediate effect
   • Optional confirmation toast
```

**Design Notes:**
- Collapsible section (default: collapsed)
- Each toggle shows benefit/cost trade-off clearly
- All toggles default to OFF (opt-in)
- Privacy tips always visible when expanded
- "Learn More" opens comprehensive privacy guide in new tab

**Expected Duration**: 1-2 minutes (including reading)

---

### Flow 13: Send to Contact (Privacy-Aware)

**Purpose**: Send to saved contact with privacy indicators

**Flow Diagram:**
```
1. Send Screen
   ↓ Select contact from dropdown/address book
2. Contact Selected
   ├─ Auto-fill recipient field
   ├─ Privacy badge display:
   │  • Xpub contact: Green "✓ Privacy: Rotation"
   │  • Single-address: Amber "⚠️ Reuses Address"
   └─ Privacy warning (if single-address with reuse)
      • Amber box with warning triangle
      • "Privacy Notice: Address Reuse"
      • Reusage count: "Sent X times before"
      • Why it matters explanation
      • Blue tip: "Ask {name} for xpub for better privacy"
      • Learn More link
   ↓ Continue with amount and fee
   ↓ [Review Transaction]
3. Transaction Review
   ├─ Standard review content
   └─ Privacy success box (if xpub):
      • Green checkmark
      • "Privacy Active: Address Rotation"
      • "Sending to {name}'s address #12"
      • Actual address shown (verification)
   ↓ Proceed with signing and broadcast
```

**Design Notes:**
- Privacy badges visible immediately on contact selection
- Non-judgmental warning language ("Privacy Notice" not "Error")
- Educational content explains why privacy matters
- Xpub contacts get positive reinforcement (green success)
- Single-address contacts get gentle nudge to upgrade
- Learn More link provides comprehensive privacy education

**Expected Duration**: 1-3 minutes (including reading warnings)

---

### Flow 14: Add Contact with Privacy

**Purpose**: Add contact to address book with privacy consideration

**Flow Diagram:**
```
1. Contacts Screen
   ↓ [Add Contact]
2. Add Contact Modal
   ├─ Contact Name
   ├─ Type Selection: Xpub / Single Address
   ├─ Privacy info box (blue):
   │  • "Xpub recommended for best privacy"
   │  • Explains address rotation vs reuse
   ├─ If Xpub selected:
   │  • Xpub entry field
   │  • Shows "25 addresses cached" after validation
   │  • Green badge preview
   ├─ If Single Address selected:
   │  • Address entry field
   │  • Privacy warning (amber):
   │     "Reusing addresses reduces privacy"
   │  • Amber badge preview
   └─ [Save]
   ↓
3. Contact Saved
   ↓ Navigate to contacts list
4. Contacts List
   • New contact visible with appropriate badge
   • Sort options include privacy status
```

**Design Notes:**
- Xpub recommended upfront (blue info box)
- Clear explanation of privacy differences
- Badge preview before saving (see what it will look like)
- No judgment, just information and gentle guidance
- Privacy status visible in contact list

**Expected Duration**: 1-2 minutes

---

## Flow Design Patterns

### Progress Indicators

**Multi-step wizards:**
```
[ 1. Config ]  >  2. Details  >  3. Co-signers  >  4. Review

✓ 1. Config  >  [ 2. Details ]  >  3. Co-signers  >  4. Review
```

**Step counter:**
```
Step 2 of 4: Wallet Details
```

---

### Back Navigation

**Enabled:**
- Account creation wizard
- Import flows
- Transaction review (back to edit)

**Disabled (security):**
- Seed phrase display (cannot go back to re-generate)
- After transaction broadcast (cannot undo)

---

### Confirmation Dialogs

**Before destructive actions:**
```
┌─────────────────────────────────────┐
│ [X]        Delete Account?          │
├─────────────────────────────────────┤
│ This will remove "Trading Account"  │
│ from your wallet.                   │
│                                     │
│ ⚠️ Imported accounts are NOT backed│
│ up by your main seed phrase.        │
│                                     │
│ Make sure you have a backup before  │
│ deleting this account.              │
│                                     │
│      [Cancel]  [Delete Account]     │
└─────────────────────────────────────┘
```

---

## Related Documentation

- [Design System](./design-system.md) - Colors, typography, components
- [Components](./components.md) - UI component specifications
- [Accessibility](./accessibility.md) - Keyboard navigation, ARIA patterns
- [Design Decisions](./decisions.md) - Why flows are designed this way

---

**Last Updated**: October 22, 2025
**Version**: v0.11.0 (Privacy Enhancement Release)