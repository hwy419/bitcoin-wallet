# QA Engineer Notes
## Bitcoin Wallet Chrome Extension - Manual Testing & Quality Assurance

**Last Updated:** October 18, 2025
**Role:** Manual Testing, Test Planning, Bug Reporting, UAT

---

## Overview

This document tracks manual testing activities, test plans, bug reports, testnet validation, and quality metrics for the Bitcoin Wallet Chrome Extension project.

**Key Responsibility:** Ensure product quality through manual testing, real-world validation, and user acceptance testing.

**CRITICAL**: As of v0.9.0, the extension has transitioned from popup-based to **tab-based architecture**. All testing procedures have been updated to reflect this major architectural change.

---

## Testing Status Dashboard

### Current Phase: 🟡 TAB ARCHITECTURE TESTING (v0.9.0)
- Tab-based extension implemented
- Security controls active (single tab enforcement, clickjacking prevention, auto-lock)
- Manual testing in progress
- Comprehensive testing guide available: `TAB_ARCHITECTURE_TESTING_GUIDE.md`

### Test Readiness
- [x] Test environment set up (Chrome with tab-based extension)
- [x] Tab architecture testing guide created
- [ ] Tab-based regression testing completed
- [ ] Security controls validated
- [ ] Testnet wallet created
- [ ] Testnet Bitcoin obtained
- [ ] Full release testing completed

---

## Tab-Based Architecture Testing (v0.9.0)

### Overview of Tab Architecture Changes

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

---

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

---

### Tab-Based Testing Procedures

#### 1. Tab Opening and Focus

**Test ID**: TAB-001
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

#### 2. Single Tab Enforcement (Security Critical)

**Test ID**: TAB-002
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

#### 3. Clickjacking Prevention (Security Critical)

**Test ID**: TAB-003
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

#### 4. Tab Nabbing Prevention (Security Critical)

**Test ID**: TAB-004
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

#### 5. Auto-Lock on Hidden Tab (Security)

**Test ID**: TAB-005
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

#### 6. Sidebar Navigation

**Test ID**: TAB-006
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

#### 7. Account Switcher in Sidebar

**Test ID**: TAB-007
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

#### 8. Session Token Validation

**Test ID**: TAB-008
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

#### 9. Visibility Lock Timer

**Test ID**: TAB-009
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

#### 10. Full Viewport Layout

**Test ID**: TAB-010
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

**Actual Results:** *Pending testing*

---

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

**Actual Results:** *Pending testing*

---

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

**Actual Results:** *Pending testing*

---

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

**Actual Results:** *Pending testing*

---

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

**Actual Results:** *Pending testing*

---

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

**Actual Results:** *Pending testing*

---

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

---

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

**Actual Results:** *Pending testing*

---

## Test Plans

### MVP Test Plan v1.0
**Status:** 📝 REQUIRES UPDATE FOR TAB ARCHITECTURE

#### Scope
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

#### Test Strategy
- Manual functional testing
- Exploratory testing sessions
- Real testnet validation
- Accessibility testing
- Performance testing
- Security validation

#### Entry Criteria
- Feature implemented by developers
- Unit tests passing (from Testing Expert)
- Build deployable to test environment

#### Exit Criteria
- All test cases executed and passed
- No P0 or P1 bugs open
- Testnet validation completed
- UAT feedback positive

---

## Test Cases

### Test Case Library
*Test cases will be added as features are implemented*

#### TC-001: Create Wallet - Native SegWit
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

## Bug Reports

### Bug Tracking
**Status:** No bugs yet (no features to test)

### Active Bugs
*No active bugs*

### Bug Summary Statistics
- **Total Bugs:** 0
- **Critical:** 0
- **High:** 0
- **Medium:** 0
- **Low:** 0
- **Fixed:** 0
- **Open:** 0

---

## Regression Test Checklist

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

## Quality Metrics

### Current Metrics
**Status:** No data yet

#### Target Metrics (for release)
- **Bug Escape Rate:** < 5%
- **Test Pass Rate:** > 95%
- **Critical Bugs:** 0
- **Regression Defects:** < 3
- **UAT Success Rate:** > 90%

---

## Release Readiness

### Release Checklist v1.0
**Status:** 🔴 NOT READY (development phase)

#### Functionality
- [ ] All MVP features implemented
- [ ] All features tested and passing
- [ ] No P0 or P1 bugs open
- [ ] All P2 bugs documented

#### Testing
- [ ] All test cases executed
- [ ] Regression tests passed
- [ ] Testnet validation completed
- [ ] UAT completed successfully

#### Documentation
- [ ] User guide available
- [ ] Known issues documented
- [ ] Release notes prepared

#### Security
- [ ] Security testing completed
- [ ] No critical vulnerabilities
- [ ] Encryption verified
- [ ] Auto-lock tested

#### Performance
- [ ] Performance targets met
- [ ] No memory leaks detected
- [ ] Extension loads quickly

#### Sign-off
- [ ] QA Engineer approval
- [ ] Product Manager approval
- [ ] Security Expert approval

**READY FOR RELEASE:** ❌ NO

---

## Known Issues & Workarounds

*No known issues yet*

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

## Collaboration Notes

### With Testing Expert
- Coordinate on test coverage
- Report gaps in automated tests
- Provide real-world test scenarios
- Validate automated test assumptions

### With Other Roles
- **Product Manager:** Validate acceptance criteria
- **Frontend/Backend Devs:** Report bugs with clear repro steps
- **Blockchain Expert:** Validate Bitcoin operations on testnet
- **Security Expert:** Conduct security testing
- **UI/UX Designer:** Report usability issues

---

## Next Steps

### Immediate (Week 1)
1. Set up Chrome test environment
2. Wait for first feature implementation
3. Create detailed test cases for MVP features
4. Prepare testnet testing setup

### Short-term (Month 1)
1. Begin testing as features are completed
2. Set up bug tracking workflow
3. Start testnet validation
4. Begin exploratory testing sessions

### Long-term (Pre-Release)
1. Complete full regression suite
2. Conduct UAT with test users
3. Final security and performance testing
4. Release readiness assessment

---

## Multisig Wallet Feature Testing

### Multisig Test Plan v1.0
**Status:** 📝 DRAFT
**Feature:** Multi-Signature Wallet Support (2-of-2, 2-of-3, 3-of-5)
**Target Release:** v0.8.0
**Priority:** P1 (High)

#### Scope

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

#### Test Strategy
- Manual functional testing of all workflows
- Cross-wallet interoperability testing
- Real testnet validation with actual multisig transactions
- Address verification testing (all co-signers must see same addresses)
- PSBT compatibility testing
- User acceptance testing scenarios
- Security validation
- Accessibility testing

#### Entry Criteria
- MultisigManager implementation complete
- PSBTManager implementation complete
- ConfigSelector UI component complete
- Background message handlers for multisig operations complete
- BIP67 unit tests passing (52 tests)
- Integration tests passing

#### Exit Criteria
- All test cases executed and passed
- No P0 or P1 bugs open
- Testnet validation completed with real multisig transactions
- Address verification confirmed (100% match rate across co-signers)
- PSBT compatibility verified with at least one external wallet
- UAT completed with positive feedback
- Help content reviewed and accessible
- Release readiness assessment approved

---

### Multisig Test Cases

#### TC-MS-001: Choose 2-of-2 Configuration
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

#### TC-MS-002: Choose 2-of-3 Configuration (Recommended)
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

#### TC-MS-003: Choose 3-of-5 Configuration
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

#### TC-MS-004: Export Xpub for Sharing
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

#### TC-MS-005: Import Co-signer Xpubs (2-of-2)
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

#### TC-MS-006: Import Co-signer Xpubs (2-of-3)
**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Own xpub exported, 2 co-signer xpubs available

**Steps:**
1. Navigate to co-signer import screen
2. Import first co-signer xpub (name: "Bob")
3. Verify progress shows "1 of 2 co-signers imported"
4. Import second co-signer xpub (name: "Carol")
5. Verify progress shows "2 of 2 co-signers imported"
6. Click "Create Account"

**Expected Results:**
- Can import multiple xpubs sequentially
- Progress indicator updates after each import
- Each co-signer shown with name and fingerprint
- Duplicate detection prevents importing same xpub twice
- "Create Account" only enabled after all co-signers imported
- Can edit/remove imported co-signers before finalizing

**Actual Results:** *Pending testing*

---

#### TC-MS-007: Import Co-signer Xpubs (3-of-5)
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** Own xpub exported, 4 co-signer xpubs available

**Steps:**
1. Navigate to co-signer import screen
2. Import 4 co-signer xpubs one by one
3. Verify progress indicator after each import
4. Verify all 4 co-signers listed with fingerprints
5. Click "Create Account"

**Expected Results:**
- Can import 4 co-signers successfully
- Progress shows "1 of 4", "2 of 4", "3 of 4", "4 of 4"
- UI accommodates display of 5 total participants (you + 4 others)
- No performance issues with 5 participants
- All fingerprints unique

**Actual Results:** *Pending testing*

---

#### TC-MS-008: Reject Invalid Xpub (Private Key)
**Status:** 📝 NOT YET TESTED
**Priority:** Critical (Security)
**Prerequisites:** Attempting to import co-signer xpub

**Steps:**
1. Navigate to co-signer import screen
2. Attempt to paste a private key (xprv/tprv) instead of xpub
3. Click "Import"

**Expected Results:**
- Clear error message: "Provided key is a private key (xprv), not a public key (xpub)"
- Import rejected
- Security warning displayed
- Form remains empty for re-entry

**Actual Results:** *Pending testing*

---

#### TC-MS-009: Reject Invalid Xpub (Wrong Network)
**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Attempting to import co-signer xpub

**Steps:**
1. Navigate to co-signer import screen (testnet wallet)
2. Attempt to paste mainnet xpub (starts with "xpub")
3. Click "Import"

**Expected Results:**
- Clear error message: "Extended public key has wrong network prefix. Expected tpub/vpub/upub, got xpub"
- Import rejected
- Explanation that wallet is testnet but xpub is mainnet
- Form cleared for re-entry

**Actual Results:** *Pending testing*

---

#### TC-MS-010: Verify First Address Matches (2-of-3)
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

#### TC-MS-011: Generate Multiple Addresses
**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Multisig account created

**Steps:**
1. View first receiving address (index 0)
2. Click "Generate New Address"
3. Note second address (index 1)
4. Generate third address (index 2)
5. Have co-signers generate same addresses independently
6. Verify all addresses match across all co-signers

**Expected Results:**
- Each address generation produces unique address
- Addresses follow sequential derivation (index 0, 1, 2...)
- All co-signers see identical addresses for same indices
- Can navigate back to previous addresses
- Gap limit enforced (20 addresses)

**Actual Results:** *Pending testing*

---

#### TC-MS-012: Receive Bitcoin to Multisig Address
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

#### TC-MS-013: Create Unsigned PSBT
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

#### TC-MS-014: Sign PSBT with First Signature
**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Unsigned PSBT created

**Steps:**
1. Review unsigned PSBT details
2. Click "Sign with My Key"
3. Enter password
4. Observe signature added
5. Check signature count (should show "1 of 2" or "1 of 3")

**Expected Results:**
- PSBT shows 0 signatures initially
- Password prompt appears
- Correct password signs successfully
- Signature count increments to 1
- PSBT remains partially signed (not finalized)
- Can export for next co-signer
- Transaction details unchanged (same amount, recipient, fee)

**Actual Results:** *Pending testing*

---

#### TC-MS-015: Export PSBT (Base64 Format)
**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** PSBT created and signed

**Steps:**
1. Click "Export PSBT"
2. Select "Base64" format
3. Click "Copy to Clipboard"
4. Paste into text editor to verify
5. Observe PSBT string format

**Expected Results:**
- Export options clearly labeled
- Base64 string copied to clipboard
- String is valid base64 (A-Z, a-z, 0-9, +, /, =)
- Copy confirmation shown to user
- PSBT metadata included (txid, signature count)
- Can be easily shared via messaging apps

**Actual Results:** *Pending testing*

---

#### TC-MS-016: Export PSBT (Hex Format)
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** PSBT created and signed

**Steps:**
1. Click "Export PSBT"
2. Select "Hex" format
3. Click "Copy to Clipboard"
4. Paste into text editor to verify

**Expected Results:**
- Hex string copied successfully
- String is valid hex (0-9, a-f)
- Alternative format for wallet compatibility
- Same transaction data as base64 format

**Actual Results:** *Pending testing*

---

#### TC-MS-017: Export PSBT (QR Code Chunks)
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** PSBT created and signed

**Steps:**
1. Click "Export PSBT"
2. Select "QR Code" format
3. Observe QR code(s) generated
4. Note if split into multiple chunks
5. Check chunk metadata (index, total)

**Expected Results:**
- QR code(s) displayed clearly
- If transaction large, split into chunks (max 2500 bytes per chunk)
- Chunk indicator shown (e.g., "1 of 3", "2 of 3", "3 of 3")
- Each chunk includes txid for reassembly
- QR codes scannable with phone
- Suitable for air-gapped signing

**Actual Results:** *Pending testing*

---

#### TC-MS-018: Import PSBT and Add Second Signature
**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** PSBT with 1 signature, second co-signer wallet ready

**Steps:**
1. Co-signer 2 imports PSBT (paste base64 string)
2. Wallet validates PSBT
3. Transaction details displayed for review
4. Shows "1 of 2 signatures" or "1 of 3 signatures"
5. Co-signer 2 clicks "Sign with My Key"
6. Enters password
7. Signature added

**Expected Results:**
- PSBT import successful
- All transaction details match original
- Current signature count displayed
- Co-signer can review before signing
- Password required for signing
- Signature count increments (now "2 of 2" or "2 of 3")
- If threshold met, transaction ready to broadcast
- If not, can export for next signer

**Actual Results:** *Pending testing*

---

#### TC-MS-019: Merge PSBTs from Multiple Co-signers
**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Multiple PSBTs with different signatures

**Steps:**
1. Have PSBT with signature from co-signer 1
2. Have separate PSBT with signature from co-signer 2
3. Import second PSBT into wallet that has first
4. Wallet automatically merges signatures
5. Verify signature count updated

**Expected Results:**
- Wallet detects PSBTs for same transaction (matching txid)
- Signatures merged automatically
- Combined signature count displayed
- No duplicate signatures
- Transaction details remain consistent
- If threshold met, ready to broadcast

**Actual Results:** *Pending testing*

---

#### TC-MS-020: Finalize and Broadcast (2-of-2)
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

#### TC-MS-021: Finalize and Broadcast (2-of-3)
**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** PSBT with 2 of 3 signatures (third signature optional)

**Steps:**
1. Verify PSBT has 2 of 3 signatures (threshold met)
2. Broadcast without waiting for third signature
3. Verify successful broadcast
4. Confirm transaction on testnet

**Expected Results:**
- Can broadcast with exactly M signatures (don't need all N)
- Third signature not required
- Broadcast succeeds with 2 signatures
- Transaction valid and confirmed
- Demonstrates M-of-N flexibility

**Actual Results:** *Pending testing*

---

#### TC-MS-022: Attempt Broadcast with Insufficient Signatures
**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** PSBT with 1 of 2 signatures (threshold not met)

**Steps:**
1. Try to broadcast PSBT with only 1 of 2 signatures
2. Observe error or disabled broadcast button

**Expected Results:**
- Broadcast button disabled or shows clear error
- Error message: "Not enough signatures (1 of 2 required)"
- Transaction cannot be broadcast
- User guided to collect more signatures
- No network error (validation happens before broadcast)

**Actual Results:** *Pending testing*

---

#### TC-MS-023: Address Type Selection - Native SegWit (P2WSH)
**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Creating multisig account

**Steps:**
1. After configuration selection, reach address type selection
2. Select "Native SegWit (P2WSH)"
3. Review benefits (lowest fees, best for multisig)
4. Create account
5. Verify addresses start with "tb1" (testnet)

**Expected Results:**
- P2WSH option clearly labeled as "Recommended"
- Benefits listed: lowest fees, most efficient
- Addresses generated start with "tb1"
- Fee calculations reflect lower SegWit fees
- Transactions smaller in size than P2SH

**Actual Results:** *Pending testing*

---

#### TC-MS-024: Address Type Selection - Legacy (P2SH)
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** Creating multisig account

**Steps:**
1. After configuration selection, reach address type selection
2. Select "Legacy (P2SH)"
3. Review compatibility notes
4. Create account
5. Verify addresses start with "2" (testnet)

**Expected Results:**
- P2SH option labeled "Maximum Compatibility"
- Addresses start with "2" on testnet
- Warning about higher fees displayed
- Fee calculations reflect higher P2SH fees
- Transactions larger in size than P2WSH

**Actual Results:** *Pending testing*

---

#### TC-MS-025: Address Type Selection - Wrapped SegWit (P2SH-P2WSH)
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** Creating multisig account

**Steps:**
1. After configuration selection, reach address type selection
2. Select "Wrapped SegWit (P2SH-P2WSH)"
3. Review benefits (compatibility + some SegWit benefits)
4. Create account
5. Verify addresses start with "2" (testnet)

**Expected Results:**
- P2SH-P2WSH option labeled "Good Compatibility"
- Addresses start with "2" on testnet (same as P2SH)
- Fees lower than legacy P2SH but higher than native P2WSH
- Explanation of "wrapped" format provided

**Actual Results:** *Pending testing*

---

#### TC-MS-026: Help Content - Configuration Comparison
**Status:** 📝 NOT YET TESTED
**Priority:** High
**Prerequisites:** Configuration selection screen

**Steps:**
1. On configuration selection screen, click "Learn More" for each option
2. Expand all help sections
3. Review use cases, examples, and warnings
4. Check for clarity and completeness

**Expected Results:**
- Each configuration has:
  - Clear description
  - Risk level indicator
  - Use case examples
  - Step-by-step workflow explanation
  - Security warnings
  - Recommendation (for 2-of-3)
- Content written in plain language
- No technical jargon unexplained
- Visual hierarchy clear

**Actual Results:** *Pending testing*

---

#### TC-MS-027: Help Content - Glossary Terms
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** Multisig setup flow

**Steps:**
1. Navigate to glossary/help section
2. Review definitions for:
   - xpub
   - Fingerprint
   - PSBT
   - Co-signer
   - BIP48
   - BIP67
3. Verify clarity and accuracy

**Expected Results:**
- All key terms defined
- Definitions in plain language
- Analogies provided where helpful
- Technical accuracy maintained
- Links to additional resources where appropriate

**Actual Results:** *Pending testing*

---

#### TC-MS-028: Error - Mismatched Configuration Between Co-signers
**Status:** 📝 NOT YET TESTED
**Priority:** Critical
**Prerequisites:** Two wallets attempting to create multisig

**Steps:**
1. Wallet A: Create 2-of-2 multisig, export xpub
2. Wallet B: Create 2-of-3 multisig, import Wallet A's xpub
3. Attempt to proceed with mismatched setup
4. Observe error or address mismatch

**Expected Results:**
- Wallets detect configuration mismatch (ideally during setup)
- Clear error message explaining problem
- Addresses don't match when generated
- Guidance provided to ensure all co-signers use same configuration
- Cannot proceed until resolved

**Actual Results:** *Pending testing*

---

#### TC-MS-029: Error - Duplicate Xpub Import
**Status:** 📝 NOT YET TESTED
**Priority:** Medium
**Prerequisites:** Importing co-signer xpubs

**Steps:**
1. Import first co-signer xpub successfully
2. Attempt to import same xpub again
3. Observe error

**Expected Results:**
- Duplicate detection occurs
- Error message: "This xpub has already been imported"
- Import rejected
- List shows existing import unchanged
- User can continue with next co-signer

**Actual Results:** *Pending testing*

---

#### TC-MS-030: Error - Import Own Xpub as Co-signer
**Status:** 📝 NOT YET TESTED
**Priority:** High (Security)
**Prerequisites:** Exporting own xpub

**Steps:**
1. Export own xpub
2. Attempt to import own xpub as co-signer
3. Observe error

**Expected Results:**
- Own xpub detected (fingerprint match)
- Error message: "Cannot import your own xpub as co-signer"
- Import rejected
- Security explanation provided
- User guided to import other co-signers' xpubs

**Actual Results:** *Pending testing*

---

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

---

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

---

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

---

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

#### Receiving Funds
- [ ] Can display multisig receiving address
- [ ] QR code generated for address
- [ ] Copy address to clipboard works
- [ ] Can receive testnet Bitcoin to address
- [ ] Transaction appears in history
- [ ] Balance updates correctly
- [ ] All co-signers see same balance

#### Transaction Creation
- [ ] Can create send transaction from multisig account
- [ ] Recipient address validation works
- [ ] Amount validation works
- [ ] Fee selection available
- [ ] Transaction preview shows details
- [ ] Multisig indicators displayed (M of N required)
- [ ] Password required for signing

#### PSBT Creation & Signing
- [ ] Unsigned PSBT created correctly
- [ ] First signature added successfully
- [ ] Signature count incremented
- [ ] PSBT remains partially signed (not finalized)
- [ ] Transaction details preserved

#### PSBT Export
- [ ] Can export as Base64
- [ ] Can export as Hex
- [ ] Can export as QR code(s)
- [ ] QR chunking works for large transactions
- [ ] Chunk metadata included (index, total, txid)
- [ ] Copy to clipboard provides feedback
- [ ] Filename generation sensible

#### PSBT Import
- [ ] Can import Base64 PSBT
- [ ] Can import Hex PSBT
- [ ] Can import QR chunks and reassemble
- [ ] Validation detects invalid PSBTs
- [ ] Transaction details displayed for review
- [ ] Current signature count shown
- [ ] Can sign imported PSBT

#### PSBT Merging
- [ ] Multiple PSBTs with different signatures merge correctly
- [ ] Duplicate signatures handled
- [ ] Signature count accurate after merge
- [ ] Transaction details consistent

#### Broadcasting
- [ ] Can broadcast when threshold met
- [ ] Cannot broadcast with insufficient signatures
- [ ] Broadcast button state correct
- [ ] Transaction broadcasts successfully
- [ ] Transaction ID displayed
- [ ] Transaction appears on block explorer
- [ ] Balance updates after confirmation

#### UI/UX
- [ ] All buttons respond correctly
- [ ] Loading states displayed
- [ ] Error messages clear and helpful
- [ ] Success confirmations shown
- [ ] Navigation intuitive
- [ ] Fits 600x400px popup constraint
- [ ] Visual hierarchy clear
- [ ] Help content accessible throughout

#### Error Handling
- [ ] Invalid xpub error messages clear
- [ ] Network mismatch detected
- [ ] Private key rejection clear
- [ ] Duplicate xpub detection works
- [ ] Configuration mismatch guidance provided
- [ ] Insufficient signatures error clear
- [ ] PSBT validation errors explained

#### Security
- [ ] Only xpubs shared, never private keys
- [ ] Fingerprint verification encouraged
- [ ] Address verification guidance provided
- [ ] Transaction review required before signing
- [ ] Password required for all signing operations
- [ ] No sensitive data in console logs

#### Help Content
- [ ] Configuration comparison accessible
- [ ] Glossary terms defined
- [ ] Setup guide available
- [ ] Transaction guide available
- [ ] Troubleshooting content available
- [ ] Security warnings prominent
- [ ] Content in plain language

---

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

### Multisig Security Testing

#### Security Test Cases

**ST-MS-001: Xpub Validation**
- [ ] Rejects private keys (xprv/tprv)
- [ ] Rejects wrong network xpubs
- [ ] Rejects malformed xpubs
- [ ] Accepts valid testnet xpubs (tpub/vpub/upub)

**ST-MS-002: Key Isolation**
- [ ] Private keys never leave secure storage
- [ ] xpubs safely shareable
- [ ] No private keys in error messages
- [ ] No private keys in console logs
- [ ] No private keys in storage (only encrypted)

**ST-MS-003: Transaction Integrity**
- [ ] PSBT manipulation detected
- [ ] Transaction details can't be changed after signing
- [ ] Signature verification works correctly
- [ ] Invalid signatures rejected

**ST-MS-004: Address Verification**
- [ ] BIP67 key sorting applied consistently
- [ ] All co-signers generate identical addresses
- [ ] Address format matches configuration
- [ ] Fingerprint verification prevents tampering

**ST-MS-005: Password Protection**
- [ ] Password required for all signing operations
- [ ] Cannot sign without correct password
- [ ] Password not stored or logged
- [ ] Auto-lock applies to multisig operations

---

### Multisig Accessibility Testing

#### Keyboard Navigation
- [ ] Can tab through all form fields
- [ ] Can select configuration with keyboard
- [ ] Can activate all buttons with Enter/Space
- [ ] Tab order logical
- [ ] No keyboard traps

#### Screen Reader
- [ ] Configuration cards have accessible labels
- [ ] Risk level announced
- [ ] Signature count announced
- [ ] Error messages announced
- [ ] Success confirmations announced
- [ ] Help content accessible

#### Visual
- [ ] Color contrast WCAG AA compliant
- [ ] Risk indicators use both color and text
- [ ] Readable at 200% zoom
- [ ] Focus indicators visible
- [ ] No color-only information

---

### Multisig Performance Testing

#### Performance Benchmarks
- [ ] Configuration selection loads < 500ms
- [ ] Address generation < 200ms per address
- [ ] PSBT creation < 1 second
- [ ] PSBT signing < 2 seconds
- [ ] PSBT export/import < 500ms
- [ ] UI remains responsive during operations
- [ ] No memory leaks with multiple multisig accounts

---

### Multisig Release Readiness Assessment

#### Functionality
- [ ] All 3 configurations implemented and tested
- [ ] All 3 address types working
- [ ] Xpub export/import complete
- [ ] PSBT creation, signing, merging, broadcasting complete
- [ ] Address verification working
- [ ] Transaction workflow complete

#### Testing
- [ ] All manual test cases executed
- [ ] BIP67 unit tests passing (52 tests)
- [ ] MultisigManager tests passing
- [ ] PSBTManager tests passing
- [ ] Integration tests passing
- [ ] Testnet validation completed with real transactions

#### User Experience
- [ ] Configuration selection intuitive
- [ ] Help content comprehensive
- [ ] Error messages clear
- [ ] Navigation smooth
- [ ] Visual design polished

#### Security
- [ ] Security test cases passed
- [ ] No private key exposure
- [ ] xpub validation working
- [ ] PSBT integrity checks working
- [ ] Address verification process secure

#### Documentation
- [ ] User guide updated
- [ ] Help content reviewed
- [ ] Release notes prepared
- [ ] Known issues documented

#### Known Issues & Limitations
- [ ] Testnet only (mainnet TBD)
- [ ] No hardware wallet integration yet
- [ ] No descriptor import/export yet
- [ ] Limited to 3 configurations (2-of-2, 2-of-3, 3-of-5)
- [ ] No interoperability testing with external wallets yet

#### GO/NO-GO Recommendation
**Status:** 📋 PENDING TESTING

**Criteria for GO:**
- [ ] All P0 test cases passing
- [ ] All P1 test cases passing or documented
- [ ] At least one successful end-to-end multisig transaction on testnet
- [ ] Address verification confirmed (100% match rate)
- [ ] No P0 or P1 bugs open
- [ ] Security review completed
- [ ] Help content approved
- [ ] UAT feedback positive

**GO FOR RELEASE:** ❌ NOT YET (pending testing)

---

## Notes & Observations

### 2025-10-12: Document Created
- Created QA Engineer notes document
- No features yet to test
- Will coordinate with Testing Expert on coverage
- QA Engineer focuses on manual testing, Testing Expert focuses on automated tests
- Both roles are complementary and necessary

### 2025-10-12: Multisig Testing Plan Added
- Comprehensive test plan created for multisig wallet feature
- 30 detailed test cases covering all aspects of multisig functionality
- UAT scenarios defined for real-world use cases (couple, business, organization, recovery)
- Manual testing checklist created (100+ items)
- Security testing plan included
- Interoperability testing planned (external wallets)
- Performance benchmarks defined
- Release readiness criteria established

**Key Testing Priorities:**
1. **Address Verification:** Must be 100% accurate - all co-signers must see identical addresses
2. **PSBT Workflow:** Complete lifecycle from creation to broadcast must work flawlessly
3. **Configuration Selection:** User education and guidance must be clear and helpful
4. **Security:** xpub validation, key isolation, transaction integrity all critical
5. **Error Handling:** Clear, helpful error messages for all failure scenarios

**Testing Strategy:**
- Start with unit tests (BIP67 - 52 passing)
- Progress to integration tests (MultisigManager, PSBTManager)
- Manual testing of UI workflows
- Real testnet validation with actual transactions
- Cross-wallet testing (multiple instances of our wallet as co-signers)
- UAT with realistic scenarios
- Security audit of multisig-specific code

**Risk Areas:**
- Address derivation complexity (BIP48, BIP67)
- PSBT compatibility and standards compliance
- User confusion about configuration selection
- Coordination burden (multiple parties required)
- Error scenarios (mismatched configs, network issues)

**Success Metrics for Multisig Feature:**
- Address verification: 100% match rate
- PSBT transaction success rate: >95%
- UAT completion rate: >90%
- User satisfaction: >80% positive feedback
- Setup time: <30 minutes for first-time users
- Help content access rate: High (indicates users finding guidance)

---

## Tab Architecture Testing Summary

### Key Testing Differences: Popup vs Tab

| Aspect | Popup (v0.8.0 and earlier) | Tab (v0.9.0+) |
|--------|----------------------------|---------------|
| **Opening** | Click icon → 600x400 popup appears | Click icon → Full browser tab opens |
| **Size** | Fixed 600x400px | Full browser viewport (responsive) |
| **Lifecycle** | Closes when focus lost | Stays open until manually closed |
| **Multiple Instances** | Could open multiple popups | Single tab enforcement prevents multiple |
| **Security** | Basic CSP | Enhanced: single tab, clickjacking, tab nabbing |
| **Navigation** | Inline view switching | Sidebar + main content area |
| **Auto-lock** | 15-minute inactivity only | 15-min inactivity + 5-min hidden |
| **Session** | Simple state management | Token-based session validation |
| **Testing** | Test in 600x400 window | Test in full browser with various sizes |

### Testing Focus Areas for Tab Architecture

**P0 - Critical (Must Pass):**
1. Single tab enforcement (TAB-002)
2. Clickjacking prevention (TAB-003)
3. Tab nabbing detection (TAB-004)
4. Session token security (TAB-008)
5. All existing wallet functionality still works

**P1 - High (Should Pass):**
1. Auto-lock on hidden tab (TAB-005)
2. Sidebar navigation (TAB-006)
3. Tab focus behavior (TAB-001)
4. Full viewport layout (TAB-010)
5. Performance benchmarks

**P2 - Medium (Nice to Have):**
1. Account switcher visual design (TAB-007)
2. Edge cases (refresh, duplicate, etc.)
3. Long-running tab stability
4. Window resize behavior

### Known Limitations (Tab Architecture)

**As of v0.9.0:**
1. **Account switcher modal not implemented** - Clicking account switcher logs to console
2. **Notification toast system not implemented** - No system-wide success/error toasts
3. **Keyboard shortcuts not available** - No keyboard navigation yet
4. **Multisig wizard opens in separate tab** - Not affected by single tab enforcement (intentional)

### Tab Architecture Quality Metrics

**Target Metrics for v0.9.0 Release:**
- [ ] All P0 security tests pass (100%)
- [ ] All P1 functionality tests pass (>95%)
- [ ] Performance benchmarks met (100%)
- [ ] No critical bugs in tab architecture
- [ ] No regression from popup functionality
- [ ] Security controls validated on testnet

**Acceptance Criteria:**
- Extension opens reliably in tab (no popup fallback)
- Single tab enforcement works in all scenarios
- All security controls active and tested
- No data loss or wallet corruption
- Existing users can upgrade seamlessly
- Performance acceptable on low-end devices

### Testing Tools for Tab Architecture

**Chrome DevTools:**
- **Console** - Monitor `[TAB SESSION]`, `[VISIBILITY LOCK]`, `[SECURITY]` logs
- **Network** - Verify session token validation requests
- **Performance** - Measure tab open time, memory usage
- **Application** - Inspect Chrome storage, service worker state

**Chrome Task Manager (Shift+Esc):**
- Monitor memory usage of wallet tab
- Check for memory leaks over time
- Verify performance stability

**Manual Testing Setup:**
```bash
# Terminal 1: Watch mode for development
npm run dev

# Terminal 2: Type checking
npm run type-check

# Load in Chrome
chrome://extensions/ → Load unpacked → dist/

# Test tab opening
Click extension icon → Should open in tab
```

### Testing Sign-Off Checklist (Tab Architecture)

**Before marking v0.9.0 ready for release:**

**Functionality:**
- [ ] All 10 tab architecture test cases executed
- [ ] All 6 edge cases tested
- [ ] Regression test suite v2.0 passed
- [ ] No P0 or P1 bugs open
- [ ] All known limitations documented

**Security:**
- [ ] Security test matrix completed (5 attack vectors tested)
- [ ] All P0 security tests passed
- [ ] Session token security validated
- [ ] Auto-lock timers tested and working
- [ ] No sensitive data exposure

**Performance:**
- [ ] Performance benchmarks met
- [ ] Memory usage within limits
- [ ] No performance degradation over time
- [ ] Tab opens quickly (<500ms)

**User Experience:**
- [ ] Sidebar navigation smooth
- [ ] Orange/green color scheme consistent
- [ ] Dark theme consistent across all screens
- [ ] Layout responsive to window size
- [ ] Error messages clear and helpful

**Documentation:**
- [ ] TAB_ARCHITECTURE_TESTING_GUIDE.md reviewed
- [ ] All test cases documented with results
- [ ] Known issues and limitations listed
- [ ] User migration notes updated

**QA Engineer Sign-Off:**
- [ ] Testing complete
- [ ] Results documented
- [ ] Ready for release: ❌ NO / ✅ YES

**Date:** _______________
**Tested By:** _______________
**Notes:** _____________________________________

---

## Tab Architecture Release Testing Notes

### 2025-10-18: Tab Architecture Testing Plan Created
- Comprehensive testing guide created for v0.9.0 tab-based architecture
- 10 core test cases defined (TAB-001 through TAB-010)
- 6 edge cases documented
- Security test matrix established (5 attack vectors)
- Performance benchmarks defined
- Regression test suite updated to v2.0

**Key Testing Priorities for Tab Architecture:**
1. **Security** - All P0 security controls must pass (single tab, clickjacking, tab nabbing)
2. **Stability** - Tab lifecycle must be stable (no crashes, memory leaks)
3. **Performance** - Tab must open quickly and perform well
4. **UX** - Sidebar navigation must be smooth and intuitive
5. **Regression** - All existing features must work in tab view

**Testing Approach:**
1. Start with security tests (P0 priority)
2. Validate core tab functionality
3. Test edge cases thoroughly
4. Run full regression suite
5. Performance testing last

**Risk Areas:**
- Session token validation reliability
- Single tab enforcement edge cases
- Auto-lock timer accuracy
- Memory leaks in long-running tabs
- Tab nabbing detection false positives

**Success Criteria:**
- All P0 tests pass
- No critical or high-priority bugs
- Performance benchmarks met
- User experience smooth and intuitive
- Ready for testnet deployment

---

## Account Management Feature Testing (v0.10.0)

### Account Creation and Import Test Plan

**Status:** 📝 READY FOR TESTING
**Feature:** Enhanced Account Dropdown with Single-Sig Creation/Import
**Version:** v0.10.0
**Test Plan Document:** `/home/michael/code_projects/bitcoin_wallet/ACCOUNT_MANAGEMENT_QA_TEST_PLAN.md`

#### Overview

Comprehensive test plan created for account management features:
- **Create Account** - HD-derived accounts from wallet seed
- **Import Account (Private Key)** - WIF format single-signature accounts
- **Import Account (Seed Phrase)** - Accounts from external BIP39 seeds

#### Test Plan Scope

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

#### Test Environment Setup

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

#### Critical Test Cases (P0 - Must Pass)

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

#### Testing Progress Tracker

**Account Creation:**
- [ ] TC-ACC-001: Native SegWit
- [ ] TC-ACC-002: SegWit
- [ ] TC-ACC-003: Legacy
- [ ] TC-ACC-004: Character counter
- [ ] TC-ACC-005: Empty name validation (P0)
- [ ] TC-ACC-006: Rate limiting (P0)
- [ ] TC-ACC-007: Account limit (P0)
- [ ] TC-ACC-008: Modal close behavior

**Import Private Key:**
- [ ] TC-IMP-001: Valid compressed WIF (P0)
- [ ] TC-IMP-002: Valid uncompressed WIF
- [ ] TC-IMP-003: Reject invalid WIF (P0)
- [ ] TC-IMP-004: Reject mainnet WIF (P0)
- [ ] TC-IMP-005: Reject duplicate WIF
- [ ] TC-IMP-006: Rate limiting

**Import Seed Phrase:**
- [ ] TC-SEED-001: Valid 12-word seed (P0)
- [ ] TC-SEED-002: Valid 24-word seed
- [ ] TC-SEED-003: Reject weak seed (P0)
- [ ] TC-SEED-004: Reject high repetition
- [ ] TC-SEED-005: Invalid word count (P0)
- [ ] TC-SEED-006: Invalid checksum (P0)
- [ ] TC-SEED-007: Different account indices
- [ ] TC-SEED-008: Account index edge cases
- [ ] TC-SEED-009: Different address types

**UI/UX:**
- [ ] TC-UI-001: Button hierarchy (P0)
- [ ] TC-UI-002: Import badge (P0)
- [ ] TC-UI-003: Modal layout
- [ ] TC-UI-004: Form validation
- [ ] TC-UI-005: Security warnings (P0)
- [ ] TC-UI-006: Toast notifications
- [ ] TC-UI-007: Tab navigation
- [ ] TC-UI-008: Responsive layout

**Security:**
- [ ] TC-SEC-001: Password required
- [ ] TC-SEC-002: Weak seeds rejected (P0)
- [ ] TC-SEC-003: Mainnet keys rejected (P0)
- [ ] TC-SEC-004: No sensitive data leaked (P0)
- [ ] TC-SEC-005: Memory cleanup

**Integration:**
- [ ] TC-INT-001: Create account E2E (P0)
- [ ] TC-INT-002: Import key E2E (P0)
- [ ] TC-INT-003: Import seed E2E (P0)
- [ ] TC-INT-004: Account switching
- [ ] TC-INT-005: Lock/unlock persistence
- [ ] TC-INT-006: Extension reload persistence

**Edge Cases:**
- [ ] TC-EDGE-001: Create while locking
- [ ] TC-EDGE-002: Double submit
- [ ] TC-EDGE-003: Unicode/emoji names
- [ ] TC-EDGE-004: Network interruption
- [ ] TC-EDGE-005: Multibyte characters

**Accessibility:**
- [ ] ACC-001: Keyboard navigation (P0)
- [ ] ACC-002: Screen reader labels (P0)
- [ ] ACC-003: Color contrast (P0)

**Performance:**
- [ ] PERF-001: Account creation speed
- [ ] PERF-002: Import speed
- [ ] PERF-003: Dropdown with many accounts

**Regression:**
- [ ] REG-001: Existing account creation (P0)
- [ ] REG-002: Multisig unchanged (P0)
- [ ] REG-003: Send/receive unchanged (P0)

#### Release Readiness Criteria

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

#### Bug Tracking

**Active Bugs:**
*No bugs filed yet - testing not started*

**Bug Summary:**
- **Total:** 0
- **Critical (P0):** 0
- **High (P1):** 0
- **Medium (P2):** 0
- **Low (P3):** 0

#### Testing Notes

**2025-10-18: Test Plan Created**
- Comprehensive test plan document created
- 60+ test cases organized by priority
- Security testing heavily emphasized
- Integration and E2E tests planned
- Accessibility and performance benchmarks defined
- Release readiness criteria established

**Key Testing Priorities:**
1. **Security First** - All entropy validation, network validation, and rate limiting must work
2. **Import Badge Visibility** - Critical UX element, must display consistently
3. **End-to-End Validation** - All account types must be fully functional (send/receive)
4. **No Regressions** - Existing features must remain unaffected
5. **Testnet Validation** - Real-world testing with actual Bitcoin transactions

**Risk Areas:**
- Entropy validation edge cases (many weak seed patterns to test)
- Memory cleanup verification (requires manual DevTools inspection)
- Rate limiting boundary conditions (exactly 5 operations in 60 seconds)
- Account limit edge case (exactly 100 accounts)
- Import badge display consistency across different screen states

**Testing Strategy:**
1. Start with P0 security tests (entropy, network validation)
2. Test all create/import workflows (P0 functionality)
3. Verify import badges display correctly (P0 UX)
4. Run integration tests (E2E workflows)
5. Test edge cases and error handling
6. Accessibility and performance validation
7. Regression testing
8. Final testnet validation

**Success Metrics:**
- **Pass Rate Target:** 100% of P0 tests, 95%+ of P1 tests
- **Bug Escape Rate:** <5% (bugs found after release)
- **Testnet Success Rate:** 100% (all transactions successful)
- **Performance Targets:** Account creation <1s, imports <2s

**Estimated Testing Time:**
- P0 test cases: 3-4 hours
- P1 test cases: 2-3 hours
- P2/P3 test cases: 1-2 hours
- Edge cases and exploratory: 2-3 hours
- Accessibility: 1-2 hours
- Performance: 1 hour
- Regression: 1-2 hours
- **Total: 11-17 hours** (2-3 days for thorough testing)

---

*This document will be updated regularly as testing progresses.*

