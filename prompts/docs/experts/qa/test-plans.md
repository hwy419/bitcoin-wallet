# QA Engineer - Test Plans

**Last Updated**: October 22, 2025
**Role**: QA Engineer - Manual Testing & Test Planning

---

## Quick Navigation
- [Overview](#overview)
- [MVP Test Plan](#mvp-test-plan-v10)
- [Tab Architecture Testing](#tab-architecture-testing-v090)
- [Multisig Test Plan](#multisig-test-plan-v10)
- [Account Management Test Plan](#account-management-test-plan-v0100)
- [Common Test Scenarios](#common-test-scenarios)
- [Exploratory Testing](#exploratory-testing-sessions)
- [User Acceptance Testing](#user-acceptance-testing-uat)

---

## Overview

This document contains all manual test plans organized by feature and release version. Each test plan includes scope, strategy, entry/exit criteria, and detailed test procedures.

**Related Documentation:**
- [Test Cases](./test-cases.md) - Detailed test case library
- [Bugs](./bugs.md) - Bug tracking and reports
- [Decisions](./decisions.md) - QA process ADRs

---

## MVP Test Plan v1.0

**Status:** 📝 REQUIRES UPDATE FOR TAB ARCHITECTURE

### Scope

**In Scope:**
- Wallet creation (all address types)
- Wallet import from seed phrase
- Wallet unlock/lock
- Send transactions
- Receive Bitcoin
- Transaction history
- Account management

**Out of Scope:**
- Mainnet operations (testnet only)
- Hardware wallet integration
- Lightning Network
- Multi-signature

### Test Strategy

- Manual functional testing
- Exploratory testing sessions
- Real testnet validation
- Accessibility testing
- Performance testing
- Security validation

### Entry Criteria

- Feature implemented by developers
- Unit tests passing (from Testing Expert)
- Build deployable to test environment

### Exit Criteria

- All test cases executed and passed
- No P0 or P1 bugs open
- Testnet validation completed
- UAT feedback positive

---

## Tab Architecture Testing (v0.9.0)

### Overview

**MAJOR ARCHITECTURAL SHIFT** - The extension has completely transitioned from a 600x400px popup to a full browser tab with persistent sidebar navigation.

**Key Changes Affecting Testing:**
1. **No Popup** - Extension icon opens wallet in full browser tab
2. **Tab Lifecycle** - Tabs can stay open indefinitely, require new security controls
3. **Sidebar Navigation** - Fixed 240px left sidebar with persistent navigation
4. **Full Viewport** - Tab uses entire browser window (responsive layout)
5. **Security Enhancements** - Multi-layer defense: single tab enforcement, clickjacking prevention, tab nabbing detection, auto-lock on hidden tabs

**Reference Documentation:**
- **Complete Testing Guide**: `/home/michael/code_projects/bitcoin_wallet/TAB_ARCHITECTURE_TESTING_GUIDE.md`
- **Release Summary**: `/home/michael/code_projects/bitcoin_wallet/V0.9.0_RELEASE_SUMMARY.md`
- **Architecture Documentation**: `prompts/docs/plans/ARCHITECTURE.md`

### Loading Tab-Based Extension in Chrome

**Critical Difference**: The extension NO LONGER has a popup. Clicking the extension icon opens a full browser tab.

**Installation Steps:**

1. **Build the Extension**
   ```bash
   cd /home/michael/code_projects/bitcoin_wallet
   npm run build
   ```
   - Verify build succeeds without errors
   - Check `dist/` folder contains `index.html` (NOT `popup.html`)

2. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right corner)
   - Click "Load unpacked"
   - Select the `dist/` folder
   - Extension should appear with Bitcoin Wallet icon

3. **Pin Extension Icon** (Recommended)
   - Click puzzle piece icon in Chrome toolbar
   - Find "Bitcoin Wallet"
   - Click pin icon to make it permanently visible

4. **Test Opening Wallet**
   - Click the Bitcoin Wallet extension icon in toolbar
   - **Expected**: Wallet opens in NEW BROWSER TAB (not popup)
   - **Expected**: URL is `chrome-extension://[id]/index.html`
   - **Expected**: Tab fills entire browser viewport

5. **Test Tab Focus Behavior**
   - With wallet tab open, switch to different tab
   - Click extension icon again
   - **Expected**: Existing wallet tab becomes focused (no duplicate tab created)

**Common Issues:**
- ❌ **Popup still appears**: You may have old version cached - remove extension completely and reload
- ❌ **Extension won't load**: Check console for CSP errors related to WebAssembly
- ❌ **Blank tab**: Check browser console (F12) for React errors or security violations

### Tab-Based Testing Procedures

See [test-cases.md](./test-cases.md) for detailed test cases TAB-001 through TAB-010.

### Tab Architecture Edge Cases

#### Edge Case 1: Browser Refresh
**Test Steps:**
1. Open wallet, unlock, navigate to dashboard
2. Press F5 or Ctrl+R to refresh tab
3. Observe wallet state

**Expected Results:**
- Wallet returns to locked state (as before)
- Session token invalidated on refresh
- User must unlock again
- No data loss

#### Edge Case 2: Multiple Browser Windows
**Test Steps:**
1. Open wallet in Tab A (Window 1)
2. Open new browser window (Window 2)
3. Navigate to `chrome-extension://[id]/index.html` in Window 2
4. Observe both windows

**Expected Results:**
- Second window/tab gets session token
- First window/tab shows "Wallet Tab Closed" message
- Single tab enforcement works across windows
- Only one active session globally

#### Edge Case 3: Tab Duplication (Ctrl+Shift+D)
**Test Steps:**
1. Open wallet in tab, unlock
2. Press Ctrl+Shift+D (duplicate tab) or right-click tab → Duplicate
3. Observe both tabs

**Expected Results:**
- Duplicated tab opens in locked state
- Duplicated tab does NOT inherit session
- Must request new session token
- Original tab may lose session to duplicate

#### Edge Case 4: Navigating Away and Back
**Test Steps:**
1. Open wallet, unlock
2. Click in address bar, navigate to `https://google.com`
3. Click back button

**Expected Results:**
- Tab nabbing detection triggers
- Wallet locked due to location change
- Security warning displayed
- Cannot return to unlocked state via back button

#### Edge Case 5: Extension Reload During Active Session
**Test Steps:**
1. Open wallet, unlock
2. Go to chrome://extensions/
3. Click "Reload" button for Bitcoin Wallet extension
4. Switch back to wallet tab

**Expected Results:**
- Background service worker restarts
- All sessions invalidated
- Wallet tab shows error or locked state
- User must close tab and reopen

#### Edge Case 6: Long-Running Tab (Hours)
**Test Steps:**
1. Open wallet, unlock
2. Leave tab open and active for 2+ hours
3. Periodically interact (click around)
4. Monitor for memory leaks or performance degradation

**Expected Results:**
- No memory leaks
- Session validation continues indefinitely
- Performance remains consistent
- No crashes or freezes

### Tab Architecture Security Testing

**Critical Security Controls to Validate:**

1. **Single Tab Enforcement**
   - Only one tab can be active
   - Session tokens cryptographically random (256-bit)
   - Tokens validated every 5 seconds
   - Automatic revocation on new tab

2. **Clickjacking Prevention**
   - CSP `frame-ancestors 'none'` active
   - Runtime iframe detection blocks initialization
   - Clear security error message shown

3. **Tab Nabbing Prevention**
   - Location checked every 1 second
   - Tampering triggers immediate lock
   - Security alert displayed to user

4. **Auto-Lock Timers**
   - 5-minute timer when tab hidden
   - 15-minute timer for inactivity (existing)
   - Timers cancel appropriately
   - Lock behavior consistent

**Security Test Matrix:**

| Attack Vector | Defense | Test ID | Status |
|---------------|---------|---------|--------|
| Multiple tabs accessing wallet | Single tab enforcement | TAB-002 | Pending |
| Iframe embedding | Clickjacking prevention | TAB-003 | Pending |
| Location redirect | Tab nabbing detection | TAB-004 | Pending |
| Tab left open while away | Auto-lock on hidden | TAB-005 | Pending |
| Session replay | Token validation | TAB-008 | Pending |

**All security tests are P0 priority and MUST pass before release.**

### Tab Architecture Performance Testing

**Performance Benchmarks for Tab Architecture:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Tab open time (icon click to UI) | < 500ms | ___ | Pending |
| Session token request | < 100ms | ___ | Pending |
| Session validation | < 50ms | ___ | Pending |
| Navigation switch (sidebar) | < 100ms | ___ | Pending |
| Memory usage (tab idle) | < 100MB | ___ | Pending |
| Memory usage (tab active) | < 150MB | ___ | Pending |

**Performance Testing Procedure:**

1. **Tab Open Time**
   - Clear all tabs
   - Click extension icon
   - Measure time to visible UI (use Performance tab in DevTools)

2. **Memory Usage**
   - Open wallet tab
   - Unlock wallet
   - Open Chrome Task Manager (Shift+Esc)
   - Find "Bitcoin Wallet" tab
   - Record memory usage

3. **Session Validation Performance**
   - Open console
   - Monitor network requests
   - Verify validation messages don't cause lag

---

## Multisig Test Plan v1.0

**Status:** 📝 DRAFT
**Feature:** Multi-Signature Wallet Support (2-of-2, 2-of-3, 3-of-5)
**Target Release:** v0.8.0
**Priority:** P1 (High)

### Scope

**In Scope:**
- Configuration selection (2-of-2, 2-of-3, 3-of-5)
- Xpub export and import workflows
- Co-signer coordination
- Address generation verification
- PSBT creation, signing, and merging
- Transaction workflow (initiate, sign, merge, broadcast)
- UI/UX for multisig features
- Help content accessibility
- Error handling and validation
- Network isolation (testnet only)

**Out of Scope:**
- Mainnet multisig transactions
- Hardware wallet integration (future enhancement)
- Descriptor import/export (future enhancement)
- More than 3 configurations (4-of-7, etc.)

### Test Strategy

- Manual functional testing of all workflows
- Cross-wallet interoperability testing
- Real testnet validation with actual multisig transactions
- Address verification testing (all co-signers must see same addresses)
- PSBT compatibility testing
- User acceptance testing scenarios
- Security validation
- Accessibility testing

### Entry Criteria

- MultisigManager implementation complete
- PSBTManager implementation complete
- ConfigSelector UI component complete
- Background message handlers for multisig operations complete
- BIP67 unit tests passing (52 tests)
- Integration tests passing

### Exit Criteria

- All test cases executed and passed
- No P0 or P1 bugs open
- Testnet validation completed with real multisig transactions
- Address verification confirmed (100% match rate across co-signers)
- PSBT compatibility verified with at least one external wallet
- UAT completed with positive feedback
- Help content reviewed and accessible
- Release readiness assessment approved

### Multisig User Acceptance Testing (UAT) Scenarios

#### UAT Scenario 1: 2-of-2 Couple Scenario
**Persona:** Married couple wanting shared Bitcoin savings
**Configuration:** 2-of-2
**Goal:** Both spouses must approve any spending

**Scenario:**
1. Spouse A creates 2-of-2 multisig account on their device
2. Spouse A exports xpub, shows QR code to Spouse B
3. Spouse B creates matching 2-of-2 multisig account
4. Spouse B imports Spouse A's xpub
5. Both verify first address matches (verbally confirm)
6. Receive test Bitcoin to multisig address
7. Spouse A initiates send transaction, signs, exports PSBT
8. Spouse A shares PSBT with Spouse B (via messaging app)
9. Spouse B imports PSBT, reviews details, signs
10. Transaction broadcasts automatically
11. Both verify transaction confirmed on block explorer

**Success Criteria:**
- Both spouses successfully create matching wallets
- Address verification occurs without confusion
- PSBT coordination works smoothly
- Transaction completes successfully
- Both understand that losing one device locks funds

**Observations to Capture:**
- Time to complete: _____ minutes
- Friction points: _____________
- Help content accessed: _____________
- User confusion areas: _____________
- Overall satisfaction: [ ] Excellent [ ] Good [ ] Fair [ ] Poor

#### UAT Scenario 2: 2-of-3 Business Scenario
**Persona:** Two business partners + accountant
**Configuration:** 2-of-3
**Goal:** Any two partners can approve spending, accountant as backup

**Scenario:**
1. Partner A creates 2-of-3 multisig account
2. Partner A exports xpub, emails to Partner B and Accountant
3. Partner B and Accountant create matching 2-of-3 accounts
4. All three import each other's xpubs (total: 3 xpubs each)
5. All three verify fingerprints over video call
6. All three verify first address matches
7. Receive business funds to multisig address
8. Partner A initiates payment to supplier, signs, exports PSBT
9. Partner B reviews and signs PSBT (threshold met, 2 of 3)
10. Transaction broadcasts without needing accountant's signature
11. Accountant later imports transaction history to verify

**Success Criteria:**
- All three participants create matching accounts
- Fingerprint verification process clear
- Any 2 can complete transaction (accountant not required)
- Business workflow feels professional and reliable
- All participants understand recovery options

**Observations to Capture:**
- Time to complete setup: _____ minutes
- Coordination challenges: _____________
- Fingerprint verification clarity: _____________
- Transaction approval flow smoothness: _____________
- Overall satisfaction: [ ] Excellent [ ] Good [ ] Fair [ ] Poor

#### UAT Scenario 3: 3-of-5 Organization Scenario
**Persona:** Board of directors (5 members)
**Configuration:** 3-of-5
**Goal:** Majority consensus required for spending

**Scenario:**
1. Board member 1 (treasurer) initiates multisig setup
2. All 5 board members create 3-of-5 multisig accounts
3. Xpubs exchanged via secure email thread
4. All 5 import 4 co-signer xpubs each
5. Group video call to verify all fingerprints
6. All 5 verify first address matches
7. Receive organizational funds
8. Treasurer proposes expenditure, creates transaction, signs
9. Two other board members review and sign (threshold met)
10. Transaction broadcasts
11. Remaining 2 board members verify transaction in history

**Success Criteria:**
- All 5 participants successfully coordinated
- Setup completed without technical issues
- Exactly 3 signatures required, no more, no less
- Remaining members can verify without participating
- Organization feels secure and transparent

**Observations to Capture:**
- Coordination complexity: _____________
- Setup time with 5 participants: _____ minutes
- User interface scaling (display of 5 co-signers): _____________
- Transaction workflow with multiple signers: _____________
- Overall satisfaction: [ ] Excellent [ ] Good [ ] Fair [ ] Poor

#### UAT Scenario 4: Recovery Scenario (2-of-3 with Lost Key)
**Persona:** Individual user with personal security setup
**Configuration:** 2-of-3 (laptop + phone + hardware wallet)
**Goal:** Recover funds after losing one device

**Scenario:**
1. User creates 2-of-3 multisig (laptop, phone, hardware wallet)
2. Receives funds to multisig address
3. Simulates losing phone (uninstalls wallet)
4. Attempts to spend using only laptop and hardware wallet
5. Creates transaction on laptop, signs with laptop key
6. Signs with hardware wallet (second signature)
7. Transaction broadcasts successfully
8. Verifies funds accessible without phone

**Success Criteria:**
- User successfully recovers funds with 2 remaining keys
- Process doesn't require lost device
- User understands recovery was possible due to 2-of-3 setup
- Transaction completes without issues
- User appreciates backup protection

**Observations to Capture:**
- Recovery process clarity: _____________
- User confidence during recovery: _____________
- Time to complete recovery: _____ minutes
- Emotional response (stress vs. confidence): _____________
- Overall satisfaction: [ ] Excellent [ ] Good [ ] Fair [ ] Poor

### Multisig Interoperability Testing

#### External Wallet Compatibility (Future)
**Goal:** Verify PSBTs work with other BIP174-compliant wallets

**Wallets to Test:**
- [ ] Electrum (desktop)
- [ ] Specter Desktop
- [ ] BlueWallet (mobile)
- [ ] Sparrow Wallet
- [ ] Bitcoin Core (if multisig support available)

**Test Process:**
1. Create multisig in our wallet
2. Export PSBT
3. Import PSBT into external wallet
4. Sign in external wallet
5. Export from external wallet
6. Import back into our wallet
7. Verify signature merge and broadcast

**Success Criteria:**
- PSBT format compatible
- No data loss during import/export
- Signatures merge correctly
- Transaction broadcasts successfully

**Status:** 📋 PENDING (not critical for initial testnet release)

---

## Account Management Test Plan (v0.10.0)

**Status:** 📝 READY FOR TESTING
**Feature:** Enhanced Account Dropdown with Single-Sig Creation/Import
**Version:** v0.10.0
**Test Plan Document:** `/home/michael/code_projects/bitcoin_wallet/ACCOUNT_MANAGEMENT_QA_TEST_PLAN.md`

### Overview

Comprehensive test plan created for account management features:
- **Create Account** - HD-derived accounts from wallet seed
- **Import Account (Private Key)** - WIF format single-signature accounts
- **Import Account (Seed Phrase)** - Accounts from external BIP39 seeds

### Test Plan Scope

**Test Coverage:**
- 60+ detailed test cases
- Organized by priority (P0/P1/P2/P3)
- Covers all feature areas:
  - Create Account (8 test cases)
  - Import Private Key (6 test cases)
  - Import Seed Phrase (9 test cases)
  - UI/UX (8 test cases)
  - Security (5 test cases)
  - Integration (6 test cases)
  - Edge Cases (5 test cases)
  - Accessibility (3 test cases)
  - Performance (3 test cases)
  - Regression (3 test cases)

**Security Testing Focus:**
- Entropy validation (weak seed rejection)
- Network validation (mainnet key rejection)
- Rate limiting enforcement (5 per minute)
- Account limit enforcement (100 max)
- Memory cleanup verification
- Error message sanitization

**Integration Testing Focus:**
- End-to-end workflows (create → receive → send)
- Account switching
- Wallet lock/unlock persistence
- Extension reload persistence
- Compatibility with existing features

### Test Environment Setup

**Prerequisites:**
1. Chrome browser (latest stable)
2. Extension built and loaded from `dist/`
3. Test wallet unlocked on testnet
4. Test data prepared:
   - Valid testnet WIF keys
   - Valid BIP39 seed phrases (12 and 24 words)
   - Known weak seeds for rejection testing
   - Funded testnet addresses for integration tests

**Testnet Resources:**
- Faucet: https://testnet-faucet.mempool.co/
- Explorer: https://blockstream.info/testnet/

### Release Readiness Criteria

**Functionality:**
- [ ] All P0 test cases passed
- [ ] All P1 test cases passed or documented
- [ ] No P0 or P1 bugs open

**Security:**
- [ ] Entropy validation working
- [ ] Network validation working
- [ ] Rate limiting enforced
- [ ] Account limit enforced
- [ ] No sensitive data exposure
- [ ] Memory cleanup verified

**Integration:**
- [ ] End-to-end workflows successful
- [ ] Account persistence verified
- [ ] No data corruption

**User Experience:**
- [ ] Import badges display correctly
- [ ] Security warnings visible
- [ ] Toast notifications working
- [ ] Form validation helpful

**Accessibility:**
- [ ] Keyboard navigation working
- [ ] Screen reader compatible
- [ ] Color contrast compliant

**Performance:**
- [ ] Account creation <1s
- [ ] Import operations <2s
- [ ] UI responsive

**Testnet Validation:**
- [ ] HD accounts created successfully
- [ ] Private keys imported successfully
- [ ] Seed phrases imported successfully
- [ ] Transactions successful from all types

---

## Common Test Scenarios

### Scenario: First-Time User
```
User Profile: New to Bitcoin wallets
Goal: Create wallet and receive first Bitcoin

Flow:
1. Install extension
2. Create new wallet
3. Backup seed phrase
4. Reach dashboard
5. Get receiving address
6. Request testnet Bitcoin
7. See balance update

Success: User completes without confusion
```

### Scenario: Send Bitcoin
```
User Profile: Has Bitcoin in wallet
Goal: Send Bitcoin to another address

Flow:
1. Unlock wallet
2. Navigate to Send
3. Enter address and amount
4. Select fee rate
5. Review transaction
6. Confirm and sign
7. Verify success

Success: Transaction broadcasts successfully
```

---

## Exploratory Testing Sessions

### Session Template
```
Session #: [Number]
Date: [Date]
Duration: [Minutes]
Tester: [Name]
Focus Area: [Feature/Area]

Charter:
[What are we exploring?]

Observations:
- [Interesting behaviors]
- [Unexpected findings]
- [Edge cases]

Bugs Found:
- [Bug descriptions]

Questions:
- [Questions for developers]

Follow-up:
- [Areas needing more investigation]
```

*No sessions conducted yet*

---

## User Acceptance Testing (UAT)

### UAT Plan
**Status:** 🔴 NOT YET PLANNED

#### Target Testers
- 5-10 test users
- Mix of Bitcoin experience levels
- Mix of technical experience
- Different operating systems

#### Test Scenarios
1. **First-time user:** Create wallet and receive Bitcoin
2. **Regular user:** Send Bitcoin to another wallet
3. **Power user:** Manage multiple accounts
4. **Recovery scenario:** Import existing wallet

#### Success Criteria
- 90%+ task completion rate
- Positive feedback sentiment
- < 5 usability issues per feature
- Clear understanding of security features

### UAT Feedback
*No UAT conducted yet*

---

## Testing Tools & Environment

### Browser Setup
- **Primary:** Chrome (latest stable)
- **Secondary:** Edge (Chromium)
- **DevTools:** Console, Network, Application tabs

### Test Data
- Testnet wallets (documented separately, secure storage)
- Test addresses for sending
- Sample transaction data

### Screen Recording
- For bug reproduction
- For UAT sessions
- For creating documentation

---

## Testnet Testing Log

### Testnet Environment Setup
**Status:** 🔴 NOT YET SET UP

#### Setup Checklist
- [ ] Install extension in Chrome
- [ ] Create testnet wallet
- [ ] Document seed phrase (test wallet only)
- [ ] Get first receiving address
- [ ] Request testnet BTC from faucet
- [ ] Bookmark block explorer
- [ ] Create second test wallet (for sending tests)

#### Testnet Resources
- **Primary Faucet:** https://testnet-faucet.mempool.co/
- **Block Explorer:** https://blockstream.info/testnet/
- **Alternative Faucet:** https://bitcoinfaucet.uo1.net/

### Testnet Test Sessions
*Test sessions will be logged here*

---

**Last Updated:** October 22, 2025
