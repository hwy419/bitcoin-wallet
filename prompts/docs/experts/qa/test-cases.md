# QA Engineer - Test Cases

**Last Updated**: October 22, 2025
**Role**: QA Engineer - Test Case Library

---

## Quick Navigation
- [Overview](#overview)
- [Tab Architecture Test Cases](#tab-architecture-test-cases)
- [Wallet Setup Test Cases](#wallet-setup-test-cases)
- [Multisig Test Cases](#multisig-test-cases)
- [Account Management Test Cases](#account-management-test-cases)
- [Regression Test Checklists](#regression-test-checklists)
- [Accessibility Testing](#accessibility-testing)
- [Performance Testing](#performance-testing)

---

## Overview

This document contains the complete test case library for manual testing. All test cases include detailed steps, expected results, and actual results tracking.

**Related Documentation:**
- [Test Plans](./test-plans.md) - Test plans and strategies
- [Bugs](./bugs.md) - Bug tracking and reports
- [Decisions](./decisions.md) - QA process ADRs

**Test Case Naming Convention:**
- `TC-XXX-###` - Feature test cases
- `TAB-###` - Tab architecture test cases
- `TC-MS-###` - Multisig test cases
- `TC-ACC-###` - Account creation test cases
- `TC-IMP-###` - Import private key test cases
- `TC-SEED-###` - Import seed phrase test cases

---

## Tab Architecture Test Cases

### TAB-001: Tab Opening and Focus

**Priority**: Critical
**Prerequisites**: Extension loaded in Chrome

**Test Steps:**
1. Click Bitcoin Wallet extension icon
2. Verify wallet opens in new tab (not popup)
3. Verify tab URL is `chrome-extension://[id]/index.html`
4. Verify tab fills full browser viewport
5. Switch to different tab
6. Click extension icon again
7. Verify existing wallet tab becomes focused
8. Verify NO duplicate wallet tab is created

**Expected Results:**
- ✅ Extension always opens in tab
- ✅ Only one wallet tab exists at a time
- ✅ Clicking icon focuses existing tab if present
- ✅ Tab has full browser dimensions (not 600x400)

**Actual Results:** *Pending testing*

---

### TAB-002: Single Tab Enforcement (Security Critical)

**Priority**: P0 (Security)
**Prerequisites**: Wallet unlocked in Tab A

**Test Steps:**
1. Open wallet in Tab A, unlock with password
2. Navigate to dashboard, verify wallet is unlocked
3. Open second wallet tab manually:
   - Copy URL from Tab A: `chrome-extension://[id]/index.html`
   - Open new tab, paste URL
4. Observe Tab B (newly opened)
5. Switch back to Tab A
6. Observe Tab A state

**Expected Results:**
- ✅ Tab B receives session token (becomes active)
- ✅ Tab A shows "Wallet Tab Closed" message
- ✅ Tab A displays orange "Close This Tab" button
- ✅ Tab A is locked and non-functional
- ✅ Only one tab can access unlocked wallet at a time
- ✅ Console logs show session revocation in Tab A

**Security Validation:**
- Session token validated every 5 seconds
- Cannot use both tabs simultaneously
- First tab automatically locked when second opens
- User clearly informed which tab is active

**Actual Results:** *Pending testing*

---

### TAB-003: Clickjacking Prevention (Security Critical)

**Priority**: P0 (Security)
**Prerequisites**: Test HTML file with iframe

**Test Steps:**
1. Create test HTML file:
   ```html
   <!DOCTYPE html>
   <html>
   <head><title>Clickjacking Test</title></head>
   <body>
     <h1>Attempting to embed wallet in iframe:</h1>
     <iframe src="chrome-extension://[YOUR-ID]/index.html" width="600" height="400"></iframe>
   </body>
   </html>
   ```
2. Replace `[YOUR-ID]` with actual extension ID
3. Open test HTML file in browser
4. Observe iframe content

**Expected Results:**
- ✅ Iframe shows security error message
- ✅ Error text: "Security Error: This wallet cannot run in an iframe..."
- ✅ Background is dark (#0F0F0F)
- ✅ React app does NOT initialize
- ✅ Console shows security error log

**Security Validation:**
- CSP header `frame-ancestors 'none'` blocks embedding
- JavaScript runtime check prevents React initialization
- User sees clear security message
- No wallet functionality accessible in iframe

**Actual Results:** *Pending testing*

---

### TAB-004: Tab Nabbing Prevention (Security Critical)

**Priority**: P0 (Security)
**Prerequisites**: Wallet unlocked in tab

**Test Steps:**
1. Open wallet and unlock
2. Navigate to dashboard
3. Open browser console (F12)
4. Execute malicious redirect:
   ```javascript
   window.location.href = 'https://evil.com';
   ```
5. Observe wallet response (should be within 1 second)

**Expected Results:**
- ✅ Wallet detects location change within 1 second
- ✅ Security alert displayed: "Tab Nabbing Detected"
- ✅ Wallet immediately locked
- ✅ Page shows security warning
- ✅ User instructed to close tab and reopen wallet
- ✅ Console logs security event

**Security Validation:**
- Location monitored every 1 second via `setInterval`
- Tampering detected before redirect completes
- Wallet locked automatically
- Sensitive data cleared from memory

**Actual Results:** *Pending testing*

---

### TAB-005: Auto-Lock on Hidden Tab (Security)

**Priority**: P1 (Security)
**Prerequisites**: Wallet unlocked in tab

**Test Steps:**
1. Open wallet and unlock
2. Navigate to dashboard (confirm unlocked)
3. Switch to different tab (hide wallet tab)
4. Wait 5 minutes (300 seconds)
5. Switch back to wallet tab

**Expected Results:**
- ✅ Wallet locks after 5 minutes of being hidden
- ✅ Unlock screen displayed when tab becomes visible
- ✅ User must re-enter password
- ✅ Balance and account data cleared

**Timing Validation:**
- Timer starts when `document.hidden` becomes `true`
- Timer cancels when `document.hidden` becomes `false`
- Lock occurs at exactly 5 minutes (300,000ms)
- Complements existing 15-minute inactivity timer

**Edge Cases:**
- Tab hidden for 4 min 59 sec, then visible: Should NOT lock
- Tab hidden for 5 min 1 sec, then visible: Should lock
- Multiple hide/show cycles: Timer should reset each time

**Actual Results:** *Pending testing*

---

### TAB-006: Sidebar Navigation

**Priority**: High
**Prerequisites**: Wallet unlocked

**Test Steps:**
1. Unlock wallet, reach dashboard
2. Verify sidebar visible on left (240px wide)
3. Verify navigation items present:
   - ₿ Assets (dashboard)
   - 🔐 Multi-sig Wallets
   - 👥 Contacts
   - ⚙️ Settings
4. Click "Assets" - verify active state (Bitcoin orange background)
5. Click "Multi-sig Wallets" - verify navigation
6. Click "Contacts" - verify navigation
7. Click "Settings" - verify navigation
8. Return to "Assets"

**Expected Results:**
- ✅ Sidebar is exactly 240px wide
- ✅ Sidebar has dark background (gray-900)
- ✅ Active item highlights in Bitcoin orange (#F7931A)
- ✅ Active item shows orange glow effect (shadow-glow-bitcoin)
- ✅ Inactive items are gray-300
- ✅ Hover states show gray-800 background
- ✅ Navigation switches main content area
- ✅ Sidebar remains fixed (doesn't scroll with content)

**Visual Validation:**
- Orange color matches #F7931A exactly
- Glow effect visible on active items
- Sidebar background is gray-900 (#1A1A1A)
- Bitcoin logo at top with orange gradient

**Actual Results:** *Pending testing*

---

### TAB-007: Account Switcher in Sidebar

**Priority**: Medium
**Prerequisites**: Wallet unlocked with at least one account

**Test Steps:**
1. Unlock wallet
2. Scroll to bottom of sidebar
3. Observe account switcher component
4. Verify avatar shows first letter of account name
5. Verify account name displayed
6. Click account switcher

**Expected Results:**
- ✅ Account switcher visible at bottom of sidebar
- ✅ Orange gradient avatar (from-bitcoin-light to-bitcoin)
- ✅ First letter of account name in avatar (uppercase)
- ✅ Account name displayed with truncation if long
- ✅ "Click to switch" hint text shown
- ✅ Clicking logs to console (modal not yet implemented)

**Known Limitation:**
- Account switcher modal NOT YET IMPLEMENTED
- Currently logs to console when clicked
- Full implementation planned for future release

**Actual Results:** *Pending testing*

---

### TAB-008: Session Token Validation

**Priority**: P0 (Security)
**Prerequisites**: Wallet unlocked, browser console open

**Test Steps:**
1. Open wallet and unlock
2. Open browser console (F12)
3. Filter console logs for "[TAB SESSION]"
4. Observe token validation messages
5. Count validation frequency (should be every 5 seconds)
6. Wait 30 seconds, count total validations (should be ~6)

**Expected Results:**
- ✅ Token requested on page load
- ✅ Token validation occurs every 5 seconds
- ✅ Console shows "Token granted" on initialization
- ✅ Validation frequency is consistent (±500ms tolerance)
- ✅ No validation errors during normal operation

**Console Log Validation:**
```
[TAB SESSION] Initializing session...
[TAB SESSION] Token granted
[TAB SESSION] Token validation every 5 seconds
```

**Actual Results:** *Pending testing*

---

### TAB-009: Visibility Lock Timer

**Priority**: P1 (Security)
**Prerequisites**: Wallet unlocked, browser console open

**Test Steps:**
1. Open wallet and unlock
2. Open browser console (F12)
3. Filter for "[VISIBILITY LOCK]"
4. Switch to different tab (hide wallet)
5. Observe console log: "Timer started - will lock in 5 minutes"
6. Wait 10 seconds
7. Switch back to wallet tab
8. Observe console log: "Timer cancelled - tab is visible"

**Expected Results:**
- ✅ Timer starts immediately when tab hidden
- ✅ Console log confirms timer start
- ✅ Timer cancels immediately when tab visible
- ✅ Console log confirms timer cancellation
- ✅ Multiple hide/show cycles work correctly

**Timer Edge Cases:**
- Hide → Show → Hide: Should restart timer
- Multiple rapid switches: Should handle gracefully
- Tab stays visible: No timer should run

**Actual Results:** *Pending testing*

---

### TAB-010: Full Viewport Layout

**Priority**: Medium
**Prerequisites**: Wallet unlocked

**Test Steps:**
1. Unlock wallet
2. Maximize browser window
3. Verify layout fills entire viewport
4. Resize browser window (smaller)
5. Verify layout adapts
6. Resize browser window (larger)
7. Verify layout scales appropriately

**Expected Results:**
- ✅ Sidebar is fixed 240px wide (does not resize)
- ✅ Main content area fills remaining horizontal space
- ✅ Layout uses full viewport height (100vh)
- ✅ No horizontal scrollbar at normal window sizes
- ✅ Content scrolls vertically within main area
- ✅ Sidebar does not scroll with content

**Layout Measurements:**
- Sidebar: 240px fixed
- Main content: calc(100vw - 240px)
- Total height: 100vh
- No overflow issues

**Actual Results:** *Pending testing*

---

## Wallet Setup Test Cases

### TC-001: Create Wallet - Native SegWit

**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Extension installed, no existing wallet

**Steps:**
1. Open extension popup
2. Click "Create Wallet"
3. Select "Native SegWit" address type
4. Enter password: "TestPassword123!"
5. Confirm password: "TestPassword123!"
6. Click "Create"
7. View seed phrase (12 words)
8. Click "I have written it down"
9. Confirm seed phrase by selecting words
10. Click "Confirm"

**Expected Results:**
- Seed phrase displayed correctly (12 valid BIP39 words)
- Security warnings clearly visible
- Seed phrase confirmation successful
- Wallet created successfully
- Dashboard displayed with Account 1
- Balance shows 0 BTC
- First address displayed (starts with "tb1")

**Actual Results:** *Pending testing*

---

## Multisig Test Cases

### TC-MS-001: Choose 2-of-2 Configuration

**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Extension installed, wallet created

**Steps:**
1. Open extension popup
2. Navigate to account management
3. Click "Create Multisig Account"
4. Review configuration selection screen
5. Click on "2-of-2 Multisig" card
6. Expand "Learn more" section
7. Review warnings about key loss risk
8. Click "Continue"

**Expected Results:**
- Configuration selection UI displays all 3 options
- 2-of-2 card clearly shows "Higher Risk if Key Lost" badge
- Description explains both signatures required
- Expanded section shows detailed warnings about permanent loss if one key lost
- Use case examples displayed (Laptop + Phone, Desktop + Hardware wallet)
- Risk explanation clear and prominent
- "Continue" button only enabled after selection

**Actual Results:** *Pending testing*

---

### TC-MS-002: Choose 2-of-3 Configuration (Recommended)

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Extension installed, wallet created

**Steps:**
1. Open extension popup
2. Navigate to account management
3. Click "Create Multisig Account"
4. Observe "Recommended" badge on 2-of-3 option
5. Click on "2-of-3 Multisig" card
6. Expand "Learn more" section
7. Review benefits and use cases
8. Click "Continue"

**Expected Results:**
- 2-of-3 configuration displays "Recommended" badge
- Card shows "Low Risk" indicator
- Description explains "Any 2 of 3 signatures required"
- Expanded section shows recovery benefits (can lose 1 key safely)
- Use case examples appropriate (business partnerships, family accounts)
- Recommendation text explains why this is best for most users
- Selection confirmed and workflow continues

**Actual Results:** *Pending testing*

---

### TC-MS-003: Choose 3-of-5 Configuration

**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** Extension installed, wallet created

**Steps:**
1. Open extension popup
2. Navigate to account management
3. Click "Create Multisig Account"
4. Click on "3-of-5 Multisig" card
5. Expand "Learn more" section
6. Review organization use cases
7. Click "Continue"

**Expected Results:**
- 3-of-5 card shows organization emoji and "Very Low Risk" badge
- Description explains "Any 3 of 5 signatures required"
- Use case examples focus on organizations, DAOs, boards
- Risk explanation mentions can lose 2 keys safely
- Warnings mention coordination complexity and higher fees
- Selection confirmed

**Actual Results:** *Pending testing*

---

### TC-MS-004: Export Xpub for Sharing

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Multisig configuration selected

**Steps:**
1. After selecting configuration, reach xpub export screen
2. Review displayed xpub (should start with "tpub" for testnet)
3. Note fingerprint displayed (8-character hex)
4. Click "Copy to Clipboard"
5. Verify clipboard contains xpub
6. Observe QR code generation
7. Take note of derivation path displayed

**Expected Results:**
- Xpub displayed clearly in monospace font
- Xpub starts with "tpub" (testnet) or "vpub/upub" for other formats
- Fingerprint shown (e.g., "A1B2C3D4")
- Copy button provides visual feedback
- Clipboard contains exact xpub string
- QR code displayed and scannable
- Derivation path shown (e.g., "m/48'/1'/0'/2'")
- Help text explains xpub is safe to share
- Warning reminds to NEVER share seed phrase

**Actual Results:** *Pending testing*

---

### TC-MS-005: Import Co-signer Xpubs (2-of-2)

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Own xpub exported, co-signer xpub available

**Steps:**
1. Navigate to co-signer import screen
2. Enter name for first co-signer (e.g., "Alice")
3. Paste co-signer's xpub
4. Click "Import"
5. Verify import successful
6. Observe progress indicator (1 of 1 co-signers imported)
7. Click "Create Account"

**Expected Results:**
- Import form accepts co-signer name (required)
- Paste area accepts xpub string
- Validation occurs on import:
  - Valid xpub format
  - Correct network (testnet)
  - Not a private key (xprv)
  - Not a duplicate of own xpub
- Fingerprint extracted and displayed
- Progress shows "1 of 1 co-signers imported"
- "Create Account" button enabled
- Error messages clear for invalid inputs

**Actual Results:** *Pending testing*

---

### TC-MS-010: Verify First Address Matches (2-of-3)

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Multisig account created with all co-signer xpubs imported

**Steps:**
1. Create 2-of-3 multisig account with Native SegWit (P2WSH)
2. Note the first receiving address displayed
3. Have co-signer 1 create identical multisig account (same config, same xpubs, same order)
4. Have co-signer 2 create identical multisig account
5. Compare first addresses from all 3 co-signers

**Expected Results:**
- All 3 co-signers see IDENTICAL first address
- Address starts with "tb1" (testnet Native SegWit)
- Address format matches P2WSH specification
- BIP67 key sorting ensures order doesn't matter
- Address can be verified independently by all parties

**Actual Results:** *Pending testing*

**Verification Notes:**
- Test address: _________________ (to be filled)
- Co-signer 1 address: _________________ (to be filled)
- Co-signer 2 address: _________________ (to be filled)
- Match status: [ ] PASS / [ ] FAIL

---

### TC-MS-012: Receive Bitcoin to Multisig Address

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Multisig account created, testnet faucet access

**Steps:**
1. Get first multisig receiving address
2. Copy address
3. Request testnet Bitcoin from faucet to this address
4. Wait for transaction broadcast
5. Verify transaction appears in wallet (unconfirmed)
6. Wait for confirmation
7. Verify balance updates correctly
8. Check balance visible to all co-signers

**Expected Results:**
- Faucet accepts multisig address format
- Transaction broadcasts successfully
- Transaction appears in wallet immediately (0 confirmations)
- Status shows "Pending" or "Unconfirmed"
- Balance updates after confirmation
- All co-signers see same balance
- Transaction details accessible

**Actual Results:** *Pending testing*

**Testnet Transaction Log:**
- Multisig Address: _________________ (to be filled)
- Transaction ID: _________________ (to be filled)
- Amount: _________________ (to be filled)
- Confirmations: _____ (to be filled)
- Block Explorer Link: _________________ (to be filled)

---

### TC-MS-013: Create Unsigned PSBT

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Multisig account with confirmed balance

**Steps:**
1. Navigate to Send screen for multisig account
2. Enter recipient address (can be regular testnet address)
3. Enter amount (e.g., 0.001 BTC)
4. Select fee rate (Medium)
5. Review transaction preview
6. Click "Create Transaction"
7. Enter password to unlock wallet
8. Transaction created as unsigned PSBT

**Expected Results:**
- Send form same as single-sig, but with multisig indicators
- Shows "Requires 2 of 3 signatures" or similar
- Transaction preview shows all details
- Password required for signing
- Unsigned PSBT created successfully
- PSBT contains proper multisig witness script
- Ready for export to co-signers

**Actual Results:** *Pending testing*

---

### TC-MS-020: Finalize and Broadcast (2-of-2)

**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** PSBT with 2 of 2 signatures

**Steps:**
1. Verify PSBT has 2 of 2 signatures
2. Click "Broadcast Transaction" (or auto-broadcast)
3. Confirm broadcast
4. Observe transaction broadcast to network
5. Note transaction ID
6. Verify on Blockstream testnet explorer
7. Wait for confirmation

**Expected Results:**
- Broadcast button enabled when threshold met
- Confirmation prompt shown
- Transaction successfully broadcast
- Transaction ID displayed
- Transaction appears on block explorer
- Status shows "Pending" then "Confirmed"
- Balance updates correctly after confirmation
- Transaction appears in history for all co-signers

**Actual Results:** *Pending testing*

**Testnet Transaction Log:**
- Transaction ID: _________________ (to be filled)
- From Address: _________________ (to be filled)
- To Address: _________________ (to be filled)
- Amount: _________________ (to be filled)
- Fee: _________________ (to be filled)
- Confirmations: _____ (to be filled)
- Block Explorer Link: _________________ (to be filled)

---

## Account Management Test Cases

### Critical Test Cases (P0 - Must Pass)

**Account Creation:**
- TC-ACC-001: Create account with Native SegWit
- TC-ACC-005: Empty name validation
- TC-ACC-006: Rate limiting enforcement
- TC-ACC-007: Account limit enforcement (100 max)

**Import Private Key:**
- TC-IMP-001: Import valid testnet WIF (compressed)
- TC-IMP-003: Reject invalid WIF format
- TC-IMP-004: Reject mainnet private key

**Import Seed Phrase:**
- TC-SEED-001: Import valid 12-word seed
- TC-SEED-003: Reject known weak seeds
- TC-SEED-005: Invalid word count rejection
- TC-SEED-006: Invalid checksum rejection

**UI/UX:**
- TC-UI-001: Account dropdown button hierarchy
- TC-UI-002: Import badge display
- TC-UI-005: Security warning visibility

**Security:**
- TC-SEC-002: Entropy validation working
- TC-SEC-003: Network validation working
- TC-SEC-004: No sensitive data in errors

**Integration:**
- TC-INT-001: Create account E2E workflow
- TC-INT-002: Import private key E2E workflow
- TC-INT-003: Import seed phrase E2E workflow

*See ACCOUNT_MANAGEMENT_QA_TEST_PLAN.md for complete test cases*

---

## Regression Test Checklists

### Pre-Release Regression Suite v2.0 (Tab Architecture)

**Updated for v0.9.0 tab-based architecture**

#### Tab Architecture (NEW in v0.9.0)
- [ ] Extension opens in tab (not popup)
- [ ] Tab focus behavior works (clicking icon focuses existing tab)
- [ ] Tab fills full browser viewport
- [ ] Single tab enforcement active
- [ ] Session tokens granted and validated
- [ ] Clickjacking prevention blocks iframe embedding
- [ ] Tab nabbing detection works
- [ ] Auto-lock on hidden tab (5 minutes)
- [ ] Sidebar navigation functional
- [ ] Sidebar exactly 240px wide
- [ ] Bitcoin orange active states (#F7931A)
- [ ] Account switcher visible in sidebar
- [ ] Help and Lock buttons work

#### Wallet Setup
- [ ] Create wallet - Legacy
- [ ] Create wallet - SegWit
- [ ] Create wallet - Native SegWit
- [ ] Import wallet from seed phrase
- [ ] Password validation works
- [ ] Seed phrase confirmation works
- [ ] Setup screens display correctly in tab view

#### Authentication
- [ ] Unlock with correct password
- [ ] Unlock fails with wrong password
- [ ] Manual lock works (sidebar lock button)
- [ ] Auto-lock after 15 minutes (inactivity)
- [ ] Auto-lock after 5 minutes (tab hidden)
- [ ] State persists after lock/unlock
- [ ] Unlock screen fills tab correctly

#### Account Management
- [ ] Create new account
- [ ] Rename account
- [ ] Switch between accounts (via dashboard or sidebar)
- [ ] View account balances
- [ ] Default account naming
- [ ] Account switcher shows current account

#### Transactions
- [ ] Send with slow fee
- [ ] Send with medium fee
- [ ] Send with fast fee
- [ ] Receive Bitcoin
- [ ] View transaction history
- [ ] Transaction confirmations update
- [ ] Balance updates correctly
- [ ] Send/Receive screens accessible from dashboard

#### UI/UX (Tab-Based)
- [ ] All buttons respond
- [ ] Form validation works
- [ ] Loading states display (orange spinners)
- [ ] Error messages clear
- [ ] Sidebar navigation functional
- [ ] Main content area scrolls independently
- [ ] Sidebar remains fixed (doesn't scroll)
- [ ] Orange color scheme consistent (#F7931A)
- [ ] Success green for checkmarks (#22C55E)
- [ ] Dark theme consistent across all screens
- [ ] Layout adapts to window resize
- [ ] No layout breaking at various window sizes

#### Security (Enhanced for Tab Architecture)
- [ ] No sensitive data in console logs
- [ ] Password required for transactions
- [ ] Seed phrase not auto-copied
- [ ] Transaction confirmation required
- [ ] Single tab enforcement prevents multiple sessions
- [ ] Session tokens cryptographically secure
- [ ] Clickjacking blocked by CSP and runtime check
- [ ] Tab nabbing detection active
- [ ] Auto-lock timers work correctly
- [ ] Session invalidated on refresh
- [ ] Security warnings clear and actionable

#### Performance (Tab Architecture)
- [ ] Tab opens in < 500ms (from icon click)
- [ ] Session token request < 100ms
- [ ] Session validation < 50ms
- [ ] Sidebar navigation < 100ms
- [ ] Transactions sign in < 2 seconds
- [ ] No memory leaks (check with Task Manager)
- [ ] No UI freezing
- [ ] Performance stable after hours of use

#### Regression from Popup to Tab
- [ ] All popup features still work in tab view
- [ ] No functionality lost in transition
- [ ] Existing wallets load correctly
- [ ] Password and seed phrase handling unchanged
- [ ] Transaction building/signing unchanged
- [ ] API interactions unchanged

**Last Run:** Not yet executed
**Pass Rate:** N/A
**Architecture Version:** v2.0 (Tab-based)

---

### Multisig Manual Testing Checklist

#### Configuration & Setup
- [ ] All 3 configurations selectable (2-of-2, 2-of-3, 3-of-5)
- [ ] Configuration help content accessible and clear
- [ ] Risk levels accurately displayed
- [ ] Use case examples relevant
- [ ] Warnings prominent for high-risk options
- [ ] Recommended badge on 2-of-3
- [ ] Configuration selection persists correctly

#### Address Type Selection
- [ ] All 3 address types available
- [ ] Native SegWit (P2WSH) recommended
- [ ] Benefits and trade-offs clearly explained
- [ ] Fee estimates accurate for each type
- [ ] Addresses generated with correct prefix
- [ ] Help content explains differences

#### Xpub Export
- [ ] Xpub displayed correctly (correct prefix for network)
- [ ] Fingerprint displayed (8 hex characters)
- [ ] Copy to clipboard works
- [ ] QR code generated correctly
- [ ] Derivation path shown
- [ ] Help text explains xpub is safe to share
- [ ] Warning about never sharing seed phrase

#### Xpub Import
- [ ] Can import co-signer xpubs
- [ ] Name required for each co-signer
- [ ] Validation rejects private keys (xprv)
- [ ] Validation rejects wrong network xpubs
- [ ] Duplicate detection works
- [ ] Own xpub rejection works
- [ ] Progress indicator accurate
- [ ] Can import required number of co-signers

#### Address Generation & Verification
- [ ] First address generated correctly
- [ ] All co-signers see identical first address
- [ ] Can generate multiple addresses
- [ ] Address indices increment correctly
- [ ] Gap limit enforced
- [ ] BIP67 key sorting applied (order doesn't matter)

#### PSBT Workflow
- [ ] Unsigned PSBT created correctly
- [ ] First signature added successfully
- [ ] Signature count incremented
- [ ] PSBT export (Base64, Hex, QR)
- [ ] PSBT import works
- [ ] Multiple PSBTs merge correctly
- [ ] Can broadcast when threshold met
- [ ] Cannot broadcast with insufficient signatures

---

## Accessibility Testing

### Accessibility Checklist
**Status:** 🔴 NOT YET TESTED

#### Keyboard Navigation
- [ ] All elements accessible via Tab
- [ ] Logical tab order
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] No keyboard traps

#### Screen Reader
- [ ] Images have alt text
- [ ] Buttons have accessible labels
- [ ] Form inputs labeled
- [ ] Errors announced
- [ ] Success messages announced

#### Visual
- [ ] Color contrast WCAG AA (4.5:1)
- [ ] Readable at 200% zoom
- [ ] No color-only information
- [ ] Visible focus indicators

---

## Performance Testing

### Performance Benchmarks
**Status:** 🔴 NOT YET TESTED

#### Target Metrics
- Extension load time: < 1 second
- Transaction signing: < 2 seconds
- Balance refresh: < 3 seconds
- Memory usage: < 100MB

#### Test Results
*No tests conducted yet*

---

**Last Updated:** October 22, 2025
