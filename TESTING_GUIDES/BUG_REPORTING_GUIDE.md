# Bug Reporting Guide

**Purpose:** Ensure every bug report contains complete, actionable information for developers
**Time to Read:** 15 minutes
**Reference Document:** Use this template for every bug you find

---

## Quick Bug Reporting Checklist

**Before submitting a bug report, ensure you have:**

- [ ] Clear one-line title describing the issue
- [ ] Bug severity (P0/P1/P2/P3)
- [ ] Numbered steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Screenshot or screen recording
- [ ] Browser console logs (F12)
- [ ] Environment details (version, browser, OS)
- [ ] Test case ID that failed (if applicable)

**If any missing → Bug report is incomplete**

---

## Bug Report Template

Copy this template for each bug:

```markdown
## BUG-XXX: [One-line title describing the issue]

**Reported:** 2025-10-29
**Reporter:** [Your name]
**Priority:** [P0/P1/P2/P3] (see priority guide below)
**Status:** Open
**Feature Area:** [Tab Architecture/Wallet Setup/Transactions/etc.]
**Test Case:** [TC-XXX-YYY that failed]
**Browser:** Chrome [version]
**Extension Version:** v0.10.0
**OS:** [Windows/Mac/Linux + version]

### 🐛 Description
[2-3 sentences: What's broken and why it matters]

### 📋 Steps to Reproduce

**Starting State:**
[e.g., "Fresh wallet created with Native SegWit, unlocked, 0.005 BTC balance"]

**Steps:**
1. [Be very specific - include exact button names, field values]
2. [Include timing if relevant - "Wait 5 minutes"]
3. [Note any console logs or errors observed]
4. [Include result of action]

### ✅ Expected Behavior
[What SHOULD happen according to test case or common sense]

### ❌ Actual Behavior
[What ACTUALLY happened - be specific about error messages, UI state]

### 📸 Evidence

**Screenshots:**
[Attach or describe screenshots]

**Console Logs:** (Press F12 → Console tab)
```
[Paste relevant console output here]
[⚠️ REDACT any private keys/seed phrases if accidentally logged]
```

**Network Tab:** (If transaction/API related)
```
[Paste failed API calls or network errors]
```

### 🔄 Reproducibility
- [ ] Reproduced 1 time
- [ ] Reproduced 2+ times consistently
- [ ] Intermittent (works sometimes, fails others)
- [ ] Cannot reproduce again

### 💡 Workaround
[If you found a way to work around the issue, describe it]
[Or write "None found"]

### 📌 Notes
[Any other relevant information, related bugs, patterns observed]
```

---

## Bug Priority Guide

### How to Determine Severity

Use this flowchart to classify bugs:

```
Is private data exposed OR funds lost/stolen?
    YES → P0 (Critical)
    NO ↓

Is core feature completely broken?
    YES → P1 (High)
    NO ↓

Is there a minor issue with workaround?
    YES → P2 (Medium)
    NO ↓

Is it cosmetic or edge case?
    YES → P3 (Low)
```

---

### P0 - Critical (Blocker)

**STOP ALL TESTING. Report immediately.**

**Definition:** Security vulnerability, data loss, wallet completely unusable

**Indicators:**
- ❌ Private keys or seed phrases exposed (console, UI, storage, network)
- ❌ Bitcoin lost or sent to wrong address
- ❌ Wallet completely unusable (crashes on launch, won't unlock)
- ❌ Security feature bypassed (single tab enforcement broken, clickjacking works)
- ❌ Data corruption (wallet locked permanently, cannot recover funds)
- ❌ Transaction signed incorrectly (wrong amount, wrong recipient, wrong fee)
- ❌ Seed phrase not required for wallet creation
- ❌ Password bypassed (can unlock without password)

**Examples:**
- "Private keys logged to console during transaction signing"
- "Send transaction sends BTC to different address than entered"
- "Extension crashes on unlock with password, cannot access funds"
- "Wallet can be embedded in iframe (clickjacking vulnerability)"
- "Seed phrase displayed in plain text in chrome.storage.local"

**Action Required:**
1. **STOP all testing immediately**
2. **Take screenshots and console logs**
3. **Report to development team immediately** (Slack, email, phone)
4. **Do NOT continue testing until fixed**
5. **Mark as P0 blocker in tracker**

---

### P1 - High (Major Functionality Broken)

**Finish current test, then report. Fix before release.**

**Definition:** Core feature completely non-functional, significant UX impact

**Indicators:**
- ⚠️ Core feature completely broken (can't send, can't receive, can't unlock)
- ⚠️ Account switching doesn't work at all
- ⚠️ Transaction history not loading or showing wrong data
- ⚠️ Balance showing incorrect amount (off by >1%)
- ⚠️ PSBT signing fails for multisig (completely broken)
- ⚠️ Address generation fails
- ⚠️ Cannot import seed phrase
- ⚠️ QR code doesn't generate
- ⚠️ Send button does nothing

**Examples:**
- "Send button clicked, nothing happens (no modal, no error, no console log)"
- "Receive screen shows blank address instead of tb1q..."
- "Account switcher dropdown doesn't open when clicked"
- "Balance shows 0.00000000 BTC but Blockstream shows 0.01 BTC"
- "Import seed phrase button disabled even with valid 12-word phrase"

**Action Required:**
1. **Complete current test case**
2. **Document bug with full template**
3. **Report to team within 2 hours**
4. **Move to next feature area**
5. **Mark as P1 in tracker**

**Note:** P1 bugs are release blockers but don't stop testing

---

### P2 - Medium (Minor Issues, Workaround Available)

**Note the bug, continue testing. Fix if time permits.**

**Definition:** Feature works but has issues, or UX is confusing but functional

**Indicators:**
- ℹ️ UI element misaligned or visually broken
- ℹ️ Validation message unclear or unhelpful
- ℹ️ Feature works but UX is confusing
- ℹ️ Performance slower than expected but functional (e.g., 5s instead of 2s)
- ℹ️ Edge case error not handled gracefully
- ℹ️ Error message says "Error occurred" without details
- ℹ️ Missing user feedback (no loading state, no success message)

**Examples:**
- "Button text cuts off on 1280x720 resolution"
- "Error message says 'Invalid address' for mainnet address (should say 'Mainnet address not supported')"
- "Transaction signing takes 5 seconds (expected 2s)"
- "No loading spinner when fetching balance (user doesn't know it's loading)"
- "Send Max button calculates amount but doesn't auto-fill input field"

**Action Required:**
1. **Document in bug tracker**
2. **Continue testing current feature**
3. **Report at end of day or testing session**
4. **Mark as P2 in tracker**

**Note:** P2 bugs can be deferred to next release if needed

---

### P3 - Low (Cosmetic, Nice-to-Have)

**Note for backlog. Not required for release.**

**Definition:** Visual polish, rare edge cases, feature enhancements

**Indicators:**
- 💅 Typo in help text or labels
- 💅 Icon color slightly off (e.g., #F7941A instead of #F7931A)
- 💅 Tooltip doesn't appear on hover
- 💅 Rare edge case (unlikely scenario, not security-related)
- 💅 Feature enhancement idea (not in requirements)
- 💅 Spacing inconsistent (3px instead of 4px)

**Examples:**
- "Word 'recieve' should be 'receive' in tooltip"
- "Bitcoin orange button is #F7941A instead of spec #F7931A"
- "Would be nice to have keyboard shortcut for Send (Cmd+S)"
- "Settings screen title uses 18px font instead of 20px"
- "Modal close button missing hover state"

**Action Required:**
1. **Add to notes section in tracker**
2. **Continue testing without interruption**
3. **Can batch report P3 bugs at end of week**
4. **Mark as P3 in tracker**

**Note:** P3 bugs typically go to backlog, not fixed for current release

---

## How to Capture Evidence

### Taking Screenshots

**Windows:**
- Press `Win + Shift + S`
- Select area to capture
- Screenshot copied to clipboard
- Paste into bug report

**macOS:**
- Press `Cmd + Shift + 4`
- Select area to capture
- Screenshot saved to Desktop
- Drag into bug report

**Linux:**
- Press `PrtScn` or use Screenshot tool
- Select area
- Save file
- Attach to bug report

**What to capture:**
- Entire browser window (shows URL, extension icon)
- Error message or unexpected UI state
- Console logs (if relevant)
- Multiple screenshots for multi-step bugs

**Annotation (optional):**
- Use arrows to point to issue
- Circle problematic elements
- Add text labels for clarity

---

### Capturing Console Logs

**How to access console:**
1. Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. Click "Console" tab
3. Look for red errors

**What to capture:**
```
1. Red error messages (highest priority)
2. Yellow warnings (medium priority)
3. Network errors (if transaction/API issue)
4. Stack traces (full error details)
```

**How to capture:**

**Method 1: Copy-Paste**
1. Right-click error in console
2. Select "Copy message" or "Save as..."
3. Paste into bug report in code block:
   ````
   ```
   [Console error here]
   ```
   ````

**Method 2: Screenshot**
1. Take screenshot of console with errors visible
2. Include in bug report

**⚠️ CRITICAL: Redact Sensitive Data**

Before sharing console logs:
- **Search for:** "seed", "mnemonic", "private", "wif", "xprv"
- **If found:** Replace with `[REDACTED]`
- **Example:**
  ```
  ❌ BAD:  seed: "abandon abandon abandon abandon..."
  ✅ GOOD: seed: "[REDACTED]"
  ```

---

### Capturing Network Logs

**When to capture:**
- Transaction broadcast failures
- Balance not updating
- API errors
- "Failed to fetch" errors

**How to capture:**

1. **Open DevTools:** F12
2. **Go to Network tab**
3. **Filter:** Click "Fetch/XHR" (only show API calls)
4. **Reproduce issue**
5. **Find failed request:**
   - Look for red status codes (400, 404, 500)
   - Or requests with "failed" status
6. **Right-click failed request**
7. **Copy → Copy as cURL** (includes headers and data)
8. **Paste into bug report**

**Example network log:**
```
Request URL: https://blockstream.info/testnet/api/address/tb1q.../utxo
Status: 500 Internal Server Error
Response: {"error": "Database connection failed"}
```

---

### Screen Recording (For Intermittent Bugs)

**When to use:**
- Bug happens randomly
- Multi-step reproduction
- Timing-dependent issues
- Hard to describe in words

**Tools:**

**Windows (Game Bar):**
1. Press `Win + G`
2. Click Record button
3. Reproduce bug
4. Press `Win + Alt + R` to stop
5. Video saved to Videos/Captures

**macOS:**
1. Press `Cmd + Shift + 5`
2. Select "Record Entire Screen"
3. Click Record
4. Reproduce bug
5. Click Stop in menu bar
6. Video saved to Desktop

**Linux (OBS Studio):**
1. Install OBS: `sudo apt install obs-studio`
2. Set up screen capture source
3. Click "Start Recording"
4. Reproduce bug
5. Click "Stop Recording"

**Best practices:**
- Keep videos short (30-60 seconds)
- Show entire screen (including URL bar)
- Narrate what you're doing (if recording audio)
- Upload to file sharing (large files)

---

## Example Bug Reports

### Example 1: P0 Critical Bug

```markdown
## BUG-001: Private keys logged to console during transaction signing

**Reported:** 2025-10-29
**Reporter:** Alex
**Priority:** P0 (Critical - Security Vulnerability)
**Status:** Open
**Feature Area:** Send Transactions
**Test Case:** TC-005-003 (Send transaction with medium fee)
**Browser:** Chrome 120.0.6099.109
**Extension Version:** v0.10.0
**OS:** macOS 14.1

### 🐛 Description
When signing a send transaction, the wallet logs the unencrypted private key to the browser console. This is a critical security vulnerability as anyone with access to DevTools can steal funds.

### 📋 Steps to Reproduce

**Starting State:**
- Wallet created with Native SegWit
- Unlocked with password "TestWallet123"
- Balance: 0.005 BTC
- DevTools console open (F12)

**Steps:**
1. Click "Send" button on Dashboard
2. Enter recipient: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
3. Enter amount: 0.001 BTC
4. Select "Medium" fee
5. Click "Review Transaction"
6. Click "Confirm"
7. Enter password: TestWallet123
8. Observe console logs during signing

### ✅ Expected Behavior
- Console should NOT log any private keys
- Private keys should remain encrypted in memory
- Only public information logged (txid, addresses, amounts)

### ❌ Actual Behavior
- Console logs: "Signing with private key: cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy"
- Private key displayed in plain text
- Anyone viewing console can copy and steal funds

### 📸 Evidence

**Screenshot:**
[Screenshot showing console log with private key visible]

**Console Logs:**
```
[2025-10-29 10:32:15] INFO: Transaction created: abc123...
[2025-10-29 10:32:15] DEBUG: Signing with private key: cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
[2025-10-29 10:32:15] INFO: Transaction signed successfully
[2025-10-29 10:32:15] INFO: Broadcasting transaction...
```

### 🔄 Reproducibility
- [x] Reproduced 2+ times consistently
- Every transaction signing logs private key

### 💡 Workaround
None - this is a critical security flaw. Do not use wallet until fixed.

### 📌 Notes
- This affects ALL transaction types (send, send max)
- Also affects multisig PSBT signing
- Private keys should NEVER be logged, even in debug mode
- Related to background/wallet/KeyManager.ts:signingFunction() likely

**ESCALATED TO DEV TEAM IMMEDIATELY - BLOCKING RELEASE**
```

---

### Example 2: P1 High Priority Bug

```markdown
## BUG-015: Account switcher dropdown doesn't open when clicked

**Reported:** 2025-10-29
**Reporter:** Alex
**Priority:** P1 (High - Core functionality broken)
**Status:** Open
**Feature Area:** Account Management
**Test Case:** TC-ACC-003 (Switch between accounts)
**Browser:** Chrome 120.0.6099.109
**Extension Version:** v0.10.0
**OS:** Windows 11

### 🐛 Description
The account switcher dropdown in the sidebar does not open when clicked. Users cannot switch between accounts, making multi-account functionality unusable.

### 📋 Steps to Reproduce

**Starting State:**
- Wallet unlocked
- 2 accounts created: "Account 1" and "Account 2"
- Currently on "Account 1"

**Steps:**
1. Look at sidebar (bottom section)
2. See account switcher showing "Account 1" with dropdown arrow
3. Click on account switcher area
4. Observe result

### ✅ Expected Behavior
- Dropdown menu opens showing all accounts
- Can click "Account 2" to switch
- Dropdown closes after selection

### ❌ Actual Behavior
- Click does nothing
- No dropdown appears
- Console logs: "Account switcher clicked" (debug log)
- No errors in console
- Cannot switch accounts

### 📸 Evidence

**Screenshot:**
[Screenshot showing account switcher with no dropdown]

**Console Logs:**
```
[2025-10-29 11:15:32] DEBUG: Account switcher clicked
[2025-10-29 11:15:32] DEBUG: Current account: Account 1
```

### 🔄 Reproducibility
- [x] Reproduced 2+ times consistently
- Happens every time

### 💡 Workaround
**Workaround found:**
1. Go to Settings screen
2. Click on account name in account list
3. This switches to that account
4. Not ideal but functional

### 📌 Notes
- Likely a React onClick handler not attached
- Or modal not rendering (check for conditional rendering bugs)
- Sidebar.tsx:AccountSwitcher component probably affected
```

---

### Example 3: P2 Medium Bug

```markdown
## BUG-023: Button text cuts off on small screens (1280x720)

**Reported:** 2025-10-29
**Reporter:** Alex
**Priority:** P2 (Medium - UI issue, functional)
**Status:** Open
**Feature Area:** Settings
**Test Case:** Visual validation
**Browser:** Chrome 120.0.6099.109
**Extension Version:** v0.10.0
**OS:** Ubuntu 22.04

### 🐛 Description
On 1280x720 resolution, the "Export Private Key" button text gets cut off, showing only "Export Private K...". Button is still functional but looks unprofessional.

### 📋 Steps to Reproduce

**Starting State:**
- Browser window resized to 1280x720
- Wallet unlocked
- Settings screen open

**Steps:**
1. Resize browser to 1280x720 (or test on 720p monitor)
2. Navigate to Settings screen
3. Scroll to account list
4. Observe "Export Private Key" button

### ✅ Expected Behavior
- Full button text visible: "Export Private Key"
- Or text wraps to second line
- Or button width adjusts to content

### ❌ Actual Behavior
- Button text truncated: "Export Private K..."
- Ellipsis indicates cut-off text
- Button still clickable and functional

### 📸 Evidence

**Screenshot:**
[Screenshot showing truncated button text]

### 🔄 Reproducibility
- [x] Reproduced 2+ times consistently
- Only happens at 1280x720 and below

### 💡 Workaround
Resize browser window to 1366x768 or larger - text displays fully

### 📌 Notes
- Likely CSS overflow or max-width issue
- Affects all buttons with long text on small screens
- Check Tailwind classes for button component
```

---

## Common Bug Reporting Mistakes

### ❌ Mistake 1: Vague Title
**Bad:** "It doesn't work"
**Good:** "Send transaction fails with 'Insufficient funds' error despite having balance"

### ❌ Mistake 2: Missing Steps
**Bad:** "I clicked send and it crashed"
**Good:**
```
1. Unlocked wallet with password
2. Clicked "Send" button
3. Entered address: tb1q...
4. Entered amount: 0.001
5. Clicked "Review"
6. Clicked "Confirm"
7. Extension crashed with white screen
```

### ❌ Mistake 3: No Expected Behavior
**Bad:** "The button didn't work"
**Good:**
```
Expected: Button should open modal with transaction details
Actual: Button does nothing, no modal appears
```

### ❌ Mistake 4: No Evidence
**Bad:** "There was an error in the console"
**Good:**
```
Console Error:
TypeError: Cannot read property 'balance' of undefined
    at Dashboard.tsx:45
    at updateBalance()
```

### ❌ Mistake 5: Combining Multiple Bugs
**Bad:** "Lots of issues: send doesn't work, balance is wrong, and buttons are ugly"
**Good:** Create 3 separate bug reports:
- BUG-001: Send transaction fails
- BUG-002: Balance displays incorrect amount
- BUG-003: Button styling inconsistent

---

## Bug Report Workflow

### 1. Find Bug During Testing
**Immediately:**
- Take screenshot
- Note console errors
- Stop current test

### 2. Determine If It's Actually a Bug
**Ask yourself:**
- Did I follow test steps correctly?
- Is this expected behavior? (check test case)
- Can I reproduce it?

**If unsure → Ask in questions log first**

### 3. Classify Severity
**Use priority guide above:**
- P0 → Stop, escalate immediately
- P1 → Document, continue testing
- P2/P3 → Note, continue testing

### 4. Document Bug
**Use template:**
- Fill all required fields
- Capture evidence
- Write clear reproduction steps

### 5. Report Bug
**P0:** Immediate Slack/email to dev team
**P1:** Create issue, notify team within 2 hours
**P2/P3:** Create issue, batch report at end of day

### 6. Track Bug
**Update TEST_RESULTS_TRACKER.md:**
- Add to bug summary
- Link to test case that failed
- Update metrics

### 7. Retest After Fix
**When developer marks "Fixed":**
- Re-run original test case
- Verify bug is resolved
- Update bug status: "Verified Fixed" or "Still Broken"

---

## Quick Reference: Bug Severity Flowchart

```
┌─────────────────────────────────────────┐
│ Found unexpected behavior?              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│ Is private data exposed OR funds lost?  │
└──YES─────────────────────────────┬──NO──┘
   │                                │
   ▼                                ▼
┌──────────────┐          ┌─────────────────────────────┐
│ P0 CRITICAL  │          │ Is core feature completely  │
│ STOP TESTING │          │ broken?                     │
│ ESCALATE NOW │          └──YES──────────────────┬─NO──┘
└──────────────┘             │                    │
                             ▼                    ▼
                    ┌─────────────────┐   ┌──────────────────┐
                    │ P1 HIGH         │   │ Is there a minor │
                    │ Report & Fix    │   │ issue with       │
                    │ before release  │   │ workaround?      │
                    └─────────────────┘   └──YES──────┬──NO──┘
                                             │        │
                                             ▼        ▼
                                    ┌─────────────┐ ┌────────┐
                                    │ P2 MEDIUM   │ │ P3 LOW │
                                    │ Fix if time │ │ Backlog│
                                    └─────────────┘ └────────┘
```

---

## You're Ready to Report Bugs!

**Remember:**
- ✅ Use the template for every bug
- ✅ Capture screenshots and console logs
- ✅ Be specific in reproduction steps
- ✅ Classify severity correctly
- ✅ Redact sensitive data (seed phrases, private keys)

**Questions?**
- Return to [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)
- Check troubleshooting sections
- Ask in [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md) questions log

---

**Good bug reports = faster fixes = better wallet!**
