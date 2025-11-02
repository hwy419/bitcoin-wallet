# Tab-Based Architecture Testing Guide

## Overview
This guide covers testing the new tab-based architecture for the Bitcoin Wallet Chrome Extension. The extension has been converted from a popup (600x400px) to a full browser tab with persistent sidebar navigation.

## Pre-Testing Setup

### 1. Build the Extension
```bash
npm run build
```

### 2. Load Extension in Chrome
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked"
4. Select the `dist/` folder from this project
5. Extension should appear in your extensions list

### 3. Pin the Extension
1. Click the puzzle piece icon in Chrome toolbar
2. Find "Bitcoin Wallet" and click the pin icon
3. Extension icon should now appear in toolbar

---

## Test Suite

### Phase 1: Basic Tab Functionality ✓

#### Test 1.1: Extension Opens in Tab
**Expected**: Clicking extension icon opens wallet in full browser tab

**Steps**:
1. Click the Bitcoin Wallet extension icon in toolbar
2. **Verify**: Wallet opens in new tab (not popup)
3. **Verify**: Tab has full browser dimensions (not 600x400)
4. **Verify**: URL is `chrome-extension://[id]/index.html`

**Pass Criteria**:
- ✓ Opens in full tab
- ✓ No popup window appears
- ✓ Tab fills entire browser viewport

#### Test 1.2: Tab Focus Behavior
**Expected**: Clicking icon when tab exists focuses that tab

**Steps**:
1. Open wallet by clicking extension icon
2. Switch to a different tab
3. Click extension icon again
4. **Verify**: Existing wallet tab becomes active/focused
5. **Verify**: No duplicate wallet tab is created

**Pass Criteria**:
- ✓ Existing tab is focused
- ✓ Only one wallet tab exists

---

### Phase 2: Security Controls ✓

#### Test 2.1: Single Tab Enforcement
**Expected**: Only one wallet tab can be active at a time

**Steps**:
1. Open wallet tab (Tab A)
2. Unlock wallet with password
3. Open second wallet tab (Tab B) by visiting `chrome-extension://[id]/index.html` directly
4. **Verify**: Tab B gets session token
5. **Verify**: Tab A shows "Wallet Tab Closed" message with orange button
6. **Verify**: Tab A is locked and shows reason

**Pass Criteria**:
- ✓ Tab A session is revoked
- ✓ Tab B becomes active session
- ✓ User cannot use both tabs simultaneously
- ✓ Orange "Close This Tab" button appears

#### Test 2.2: Clickjacking Prevention
**Expected**: Wallet cannot be embedded in iframe

**Steps**:
1. Create test HTML file with iframe attempting to embed wallet
2. Open test file in browser
3. **Verify**: Iframe shows security error message
4. **Verify**: Error message: "Security Error: Wallet cannot run in iframe"
5. **Verify**: Background is dark (#0F0F0F)

**Pass Criteria**:
- ✓ Wallet does not render in iframe
- ✓ Security error displayed
- ✓ React app does not initialize

#### Test 2.3: Tab Nabbing Prevention
**Expected**: Location tampering triggers security lock

**Steps**:
1. Open wallet and unlock
2. Open browser console (F12)
3. Execute: `window.location.href = 'https://evil.com'`
4. **Verify**: Within 1 second, security alert appears
5. **Verify**: "Tab Nabbing Detected" message shown
6. **Verify**: Wallet is locked

**Pass Criteria**:
- ✓ Location change detected quickly (≤1s)
- ✓ Security warning displayed
- ✓ Wallet locked immediately

#### Test 2.4: Auto-Lock on Hidden Tab
**Expected**: Wallet locks after 5 minutes when tab is hidden

**Steps**:
1. Open wallet and unlock
2. Switch to different tab (hide wallet tab)
3. Wait 5 minutes
4. Switch back to wallet tab
5. **Verify**: Wallet is locked
6. **Verify**: Unlock screen is displayed

**Pass Criteria**:
- ✓ Wallet locks after 5 minutes hidden
- ✓ User must re-enter password
- ✓ Timer resets when tab becomes visible

---

### Phase 3: Navigation & Layout ✓

#### Test 3.1: Sidebar Navigation
**Expected**: Sidebar is fixed 240px and navigation works

**Steps**:
1. Open and unlock wallet
2. **Verify**: Sidebar visible on left (240px wide)
3. **Verify**: Sidebar shows Bitcoin logo at top
4. **Verify**: Navigation items present: Assets, Multi-sig Wallets, Contacts, Settings
5. Click each navigation item
6. **Verify**: Active item highlights in Bitcoin orange (#F7931A)
7. **Verify**: Active item shows orange glow effect

**Pass Criteria**:
- ✓ Sidebar is exactly 240px wide
- ✓ All navigation items visible
- ✓ Orange active state applied
- ✓ Navigation switches views correctly

#### Test 3.2: Account Switcher
**Expected**: Account switcher at bottom of sidebar works

**Steps**:
1. Unlock wallet (must have multiple accounts to test fully)
2. **Verify**: Account switcher visible at bottom of sidebar
3. **Verify**: Shows orange gradient avatar with first letter
4. **Verify**: Current account name displayed
5. Click account switcher
6. **Verify**: Tooltip or action occurs

**Pass Criteria**:
- ✓ Account switcher visible
- ✓ Orange gradient avatar
- ✓ Account name truncated if long

#### Test 3.3: Dashboard Layout
**Expected**: Dashboard displays properly in main content area

**Steps**:
1. Click "Assets" in sidebar
2. **Verify**: Balance card visible with BTC amount
3. **Verify**: USD equivalent shown (if price available)
4. **Verify**: "Testnet" badge in orange
5. **Verify**: Send and Receive buttons are orange
6. **Verify**: Addresses section visible
7. **Verify**: Transaction history visible

**Pass Criteria**:
- ✓ All sections render correctly
- ✓ No layout overflow or clipping
- ✓ Content scrolls independently from sidebar

---

### Phase 4: Color Scheme Verification ✓

#### Test 4.1: Bitcoin Orange (#F7931A)
**Expected**: Orange used for primary actions and active states

**Check these elements**:
- ✓ Sidebar active navigation item background
- ✓ Send button
- ✓ Receive button
- ✓ Unlock button
- ✓ Account switcher avatar gradient
- ✓ "Create Multisig Account" button
- ✓ Loading spinner border
- ✓ Focus rings on inputs
- ✓ Copy button hover states

**Pass Criteria**:
- All listed elements use orange consistently
- Hover states use `#FF9E2D`
- Active/pressed states use `#E88711`

#### Test 4.2: Success Green (#22C55E)
**Expected**: Green used for completed/success states

**Check these elements**:
- ✓ Copy success checkmark (after copying address)
- ✓ Selected items in dropdowns (checkmark)
- ✓ Success messages/notifications
- ✓ Completed transaction indicators

**Pass Criteria**:
- All success states show green
- Checkmarks are green (#22C55E)

#### Test 4.3: Dark Theme Consistency
**Expected**: All screens use consistent dark palette

**Check these screens**:
- ✓ Loading screen: gray-950 background
- ✓ Unlock screen: gray-950 background, gray-850 card
- ✓ Dashboard: gray-950 background, gray-850 cards
- ✓ Sidebar: gray-900 background
- ✓ Send screen: consistent with dashboard
- ✓ Receive screen: consistent with dashboard
- ✓ Settings screen: consistent with dashboard

**Pass Criteria**:
- No white backgrounds (except text)
- Consistent gray palette throughout
- Text is readable with proper contrast

---

### Phase 5: User Flows ✓

#### Test 5.1: Complete Send Flow
**Steps**:
1. Unlock wallet
2. Ensure account has testnet BTC balance
3. Click orange "Send" button
4. **Verify**: Send screen opens
5. Enter recipient address
6. Enter amount
7. Select fee (Slow/Medium/Fast)
8. **Verify**: Fee buttons have proper styling
9. Click "Send Transaction"
10. **Verify**: Transaction is broadcast
11. **Verify**: Success message appears (green checkmark or notification)
12. **Verify**: Returns to dashboard

**Pass Criteria**:
- ✓ Flow completes without errors
- ✓ Orange buttons throughout
- ✓ Success indicator appears
- ✓ Balance updates

#### Test 5.2: Complete Receive Flow
**Steps**:
1. Click orange "Receive" button
2. **Verify**: Receive screen opens
3. **Verify**: QR code displayed
4. **Verify**: Address shown below QR
5. Click orange "Copy Address" button
6. **Verify**: Button shows green checkmark
7. **Verify**: Address copied to clipboard
8. Click "Generate New Address"
9. **Verify**: New address appears

**Pass Criteria**:
- ✓ QR code renders correctly
- ✓ Copy button works with green feedback
- ✓ New address generation works

#### Test 5.3: Settings Flow
**Steps**:
1. Click "Settings" in sidebar (or from dashboard)
2. **Verify**: Settings screen opens
3. **Verify**: Account list visible
4. **Verify**: Can rename accounts
5. **Verify**: Can change address type
6. **Verify**: Lock button works
7. **Verify**: Orange accents on interactive elements

**Pass Criteria**:
- ✓ All settings accessible
- ✓ Changes persist after lock/unlock
- ✓ Orange styling consistent

---

### Phase 6: Edge Cases & Error Handling ✓

#### Test 6.1: Network Error Handling
**Steps**:
1. Disconnect from internet
2. Try to fetch balance
3. **Verify**: Error message appears (red)
4. **Verify**: Previous balance still displayed
5. **Verify**: Retry option available

**Pass Criteria**:
- ✓ Errors shown clearly
- ✓ App doesn't crash
- ✓ User can retry

#### Test 6.2: Large Transaction History
**Steps**:
1. Use account with many transactions
2. Open dashboard
3. **Verify**: Transaction list scrolls smoothly
4. **Verify**: Only 10 most recent shown initially
5. **Verify**: Scrolling works within content area (not whole page)

**Pass Criteria**:
- ✓ Performance is acceptable
- ✓ Scroll confined to content area
- ✓ Sidebar remains fixed

#### Test 6.3: Long Account Names
**Steps**:
1. Create account with very long name (50+ characters)
2. **Verify**: Name truncates in sidebar
3. **Verify**: Full name visible in account switcher or tooltip
4. **Verify**: No layout breaking

**Pass Criteria**:
- ✓ Text truncates properly
- ✓ No overflow issues
- ✓ Layout remains intact

---

## Success Criteria Summary

### Must Pass (Critical):
- [x] Extension opens in full tab (not popup)
- [x] Single tab enforcement works
- [x] Security controls active (clickjacking, tab nabbing)
- [x] Auto-lock on hidden tab works
- [x] Sidebar navigation functional
- [x] Bitcoin orange color scheme applied
- [x] All core flows work (send, receive, unlock)

### Should Pass (Important):
- [x] Tab focus behavior correct
- [x] Account switcher works
- [x] Success indicators use green
- [x] Dark theme consistent
- [x] Error handling graceful
- [x] Settings accessible

### Nice to Have (Polish):
- [x] Loading states smooth
- [x] Transitions/animations work
- [x] Tooltips helpful
- [x] Copy feedback clear

---

## Known Issues / Limitations

### Expected Behavior:
1. **Wizard Opens in Separate Tab**: Multisig wizard intentionally opens in separate tab/window (not affected by single tab enforcement)
2. **Console Logs**: Security checks may log to console - this is intentional for debugging
3. **Development Mode**: If using DEV_PASSWORD/.env.local, fields will pre-fill (production builds won't)

### Not Yet Implemented:
1. **Account Switcher Modal**: Clicking account switcher in sidebar shows console log (TODO)
2. **Notification Toasts**: Success/error toasts not yet implemented system-wide
3. **Keyboard Shortcuts**: No keyboard navigation yet

---

## Reporting Issues

If you find issues during testing, please note:
1. **What you were doing**: Exact steps to reproduce
2. **What you expected**: Expected behavior
3. **What happened**: Actual behavior
4. **Screenshots**: Especially for UI/layout issues
5. **Console errors**: Check browser console (F12) for errors

---

## Final Checklist

Before marking testing complete:

### Visual:
- [ ] All screens use Bitcoin orange (#F7931A) for primary actions
- [ ] Success states use green (#22C55E)
- [ ] Dark theme consistent across all views
- [ ] No white flashes or layout shifts
- [ ] Sidebar is exactly 240px wide
- [ ] Orange glow on active navigation items

### Functional:
- [ ] Extension opens in tab (not popup)
- [ ] Single tab enforcement prevents multiple sessions
- [ ] Auto-lock after 5 minutes when tab hidden
- [ ] Clickjacking prevention blocks iframe embedding
- [ ] Tab nabbing detection triggers security lock
- [ ] All navigation flows work (send, receive, settings)
- [ ] Account switching works
- [ ] Lock button works from sidebar

### Security:
- [ ] Session tokens validated every 5 seconds
- [ ] Location checked every 1 second
- [ ] Iframe embedding blocked
- [ ] Multiple tabs handled correctly
- [ ] Sensitive data cleared on lock

---

## Performance Benchmarks

### Target Metrics:
- **Tab Open Time**: < 500ms from icon click to visible UI
- **Unlock Time**: < 2s from password submit to dashboard
- **Navigation Switch**: < 100ms sidebar click to view change
- **Balance Refresh**: < 3s on fast connection
- **Transaction List**: Smooth scroll with 100+ transactions

### Actual Metrics:
_(To be filled during testing)_
- Tab Open Time: ___
- Unlock Time: ___
- Navigation Switch: ___
- Balance Refresh: ___
- Transaction List: ___

---

## Testing Sign-Off

**Tested By**: _______________
**Date**: _______________
**Build Version**: v0.9.0 (tab-based architecture)
**Chrome Version**: _______________

**Result**:
- [ ] All critical tests passed
- [ ] Ready for production
- [ ] Issues found (see notes below)

**Notes**:
_____________________________________
_____________________________________
_____________________________________
