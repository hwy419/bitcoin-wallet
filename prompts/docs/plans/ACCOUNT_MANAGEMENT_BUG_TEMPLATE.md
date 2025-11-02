# Bug Report Template - Account Management v0.10.0

**Copy this template when reporting bugs during testing**

---

## Bug Report

**Bug ID:** BUG-ACC-XXX (to be assigned)

**Title:** [Short, descriptive title - e.g., "Create Account fails with emoji in name"]

**Date Reported:** [YYYY-MM-DD]

**Reported By:** [Your name]

---

### Classification

**Severity:**
- [ ] **Critical (P0)** - Feature completely broken, data loss, security issue, blocks release
- [ ] **High (P1)** - Major functionality broken, significant user impact, should fix before release
- [ ] **Medium (P2)** - Minor functionality issue, workaround exists, can defer to next version
- [ ] **Low (P3)** - Cosmetic issue, typo, minor inconvenience, nice to fix

**Priority:**
- [ ] **P0** - Must fix before release (BLOCKER)
- [ ] **P1** - Should fix before release
- [ ] **P2** - Can defer to v0.10.1
- [ ] **P3** - Can defer to future version

**Feature Area:**
- [ ] Create Account
- [ ] Import Account - Private Key
- [ ] Import Account - Seed Phrase
- [ ] UI/UX
- [ ] Security
- [ ] Integration
- [ ] Performance
- [ ] Accessibility

**Test Case:** [e.g., TC-ACC-001, TC-IMP-003, etc.]

---

### Environment

**Browser:** Chrome [version number]

**OS:** [Windows 10/11, macOS Ventura/Sonoma, Ubuntu 22.04, etc.]

**Extension Version:** v0.10.0

**Date/Time:** [YYYY-MM-DD HH:MM]

**Network:** [Testnet / Mainnet - should be testnet]

---

### Reproducibility

**Can you reproduce this bug?**
- [ ] **Always** - Happens every time (100%)
- [ ] **Often** - Happens most of the time (75%+)
- [ ] **Sometimes** - Happens occasionally (25-75%)
- [ ] **Rarely** - Happened once or twice (<25%)
- [ ] **Once** - Only observed once, cannot reproduce

**Reproduction Rate:** _____ out of _____ attempts

---

### Steps to Reproduce

**Preconditions:**
- [e.g., "Wallet unlocked on testnet"]
- [e.g., "At least 1 account already exists"]
- [e.g., "No imported accounts yet"]

**Steps:**
1. [First action - be specific]
2. [Second action]
3. [Third action]
4. [Continue as needed...]

**Example:**
```
Preconditions:
- Wallet unlocked on testnet
- 0 imported accounts exist

Steps:
1. Open account dropdown
2. Click "Import Account" button
3. Click "Seed Phrase" tab
4. Paste 12-word seed: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
5. Enter account name: "Test Import"
6. Click "Import Account" button
```

---

### Expected Result

**What should happen:**

[Describe the expected behavior clearly]

**Example:**
```
Expected:
- Error message should appear: "This seed phrase is publicly known and insecure. Please use a different seed."
- Import should be rejected
- No account created
- Form remains open for user to try different seed
```

---

### Actual Result

**What actually happened:**

[Describe what you observed]

**Example:**
```
Actual:
- Account was created successfully
- No error message displayed
- Import badge appeared
- Known weak seed was accepted (SECURITY ISSUE)
```

---

### Visual Evidence

**Screenshots:**
- [Attach screenshot showing the issue]
- [Multiple screenshots if workflow-related]

**Screen Recording:**
- [Link to video if available - use Loom, Cloudinary, or similar]
- [Especially helpful for timing issues or complex interactions]

**Console Logs:**
```
[Paste relevant browser console errors here]
[Include timestamps if relevant]

Example:
[18:30:45.123] Error: Failed to validate entropy
[18:30:45.125] TypeError: Cannot read property 'checksum' of undefined
    at validateSeed (background.js:234)
```

---

### Additional Context

**Related Issues:**
- [Link to similar bugs if known]
- [Reference to related test cases]

**Workaround (if any):**
- [Describe temporary solution if you found one]
- [e.g., "Can work around by using 24-word seed instead of 12-word"]

**Impact:**
- **User Impact:** [How does this affect users? e.g., "Users cannot import their existing wallets"]
- **Frequency:** [How often will users encounter this? e.g., "Every user who tries to import a seed"]
- **Security Impact:** [Any security implications? e.g., "Weak seeds accepted, funds at risk"]

**Test Data Used:**
- [Provide test data if relevant and safe to share]
- [e.g., "Test seed phrase: abandon abandon..." - OK to share]
- [NEVER share real private keys or production seeds]

---

### Suggested Fix (Optional)

**If you have ideas on how to fix this:**

[Your suggestion - even if not a developer, your insight may help]

**Example:**
```
Suggested Fix:
- Add the known weak seed "abandon abandon..." to the KNOWN_WEAK_SEEDS array in entropy-validator.ts
- Ensure entropy validation runs before account creation
- Display clear error message to user
```

---

### Developer Notes (To be filled by developer)

**Root Cause:** _________________

**Fix Applied:** _________________

**Files Changed:** _________________

**Verification:** _________________

**Resolved In:** [version number]

---

## Examples of Good Bug Reports

### Example 1: Critical Security Bug

**Bug ID:** BUG-ACC-001

**Title:** Weak seed phrases accepted during import

**Severity:** Critical (P0) - Security Issue
**Priority:** P0 - BLOCKER
**Feature Area:** Import Account - Seed Phrase
**Test Case:** TC-SEED-003

**Environment:** Chrome 118, Windows 11, v0.10.0

**Reproducibility:** Always (100% - 5/5 attempts)

**Steps:**
1. Unlock wallet on testnet
2. Open "Import Account" modal
3. Click "Seed Phrase" tab
4. Paste: "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
5. Enter name: "Weak Seed Test"
6. Click "Import Account"

**Expected:** Error: "This seed phrase is publicly known and insecure. Please use a different seed." Import rejected.

**Actual:** Account created successfully with weak seed. No error shown. Import badge displayed.

**Impact:**
- **User Impact:** Users can import publicly known seeds, funds at high risk of theft
- **Security Impact:** CRITICAL - Known weak seeds should never be accepted
- **Frequency:** Any user attempting to test with common seeds

**Priority Justification:** This is a security vulnerability. MUST fix before release.

---

### Example 2: High Priority UI Bug

**Bug ID:** BUG-ACC-002

**Title:** Import badge not displayed after private key import

**Severity:** High (P1) - Major UX Issue
**Priority:** P1 - Should fix before release
**Feature Area:** UI/UX
**Test Case:** TC-UI-002

**Environment:** Chrome 118, macOS Sonoma, v0.10.0

**Reproducibility:** Always (100% - 3/3 attempts)

**Steps:**
1. Unlock wallet
2. Import account from WIF private key: cVhT8DRG... (testnet)
3. Import succeeds, toast shows success
4. Open account dropdown
5. Locate imported account in list

**Expected:** Blue download arrow import badge displayed next to account name with tooltip "Imported account - Back up separately"

**Actual:** No import badge displayed. Account looks identical to HD-derived accounts.

**Impact:**
- **User Impact:** Users cannot distinguish imported accounts from HD accounts
- **Security Impact:** Medium - Users may not realize they need separate backup
- **Frequency:** Every private key import

**Visual Evidence:** [Screenshot showing dropdown without badge]

**Workaround:** Check account name manually (but not reliable if user renamed)

---

### Example 3: Medium Priority Bug

**Bug ID:** BUG-ACC-003

**Title:** Character counter doesn't update for emoji correctly

**Severity:** Medium (P2) - Minor issue
**Priority:** P2 - Can defer to v0.10.1
**Feature Area:** UI/UX
**Test Case:** TC-ACC-004

**Environment:** Chrome 118, Windows 11, v0.10.0

**Reproducibility:** Always (100%)

**Steps:**
1. Open "Create Account" modal
2. Type: "Wallet 💰🚀" (7 visible characters)
3. Observe character counter

**Expected:** Counter shows "7/30" (emoji counts as 1 character each)

**Actual:** Counter shows "11/30" (emoji counted as multiple characters)

**Impact:**
- **User Impact:** Minor confusion about character limit
- **Frequency:** Only affects users using emoji in names
- **Workaround:** Users can still create accounts, limit still enforced correctly at 30

**Notes:** May be counting Unicode code points instead of grapheme clusters. Low priority, doesn't break functionality.

---

## Bug Report Checklist

Before submitting, verify:

- [ ] Title is clear and specific
- [ ] Severity and priority set correctly
- [ ] Feature area identified
- [ ] Test case referenced (if applicable)
- [ ] Environment details complete
- [ ] Reproducibility confirmed (try at least 3 times)
- [ ] Steps to reproduce are clear and complete
- [ ] Expected vs. actual behavior clearly stated
- [ ] Screenshots/console logs attached
- [ ] Impact assessment included
- [ ] No sensitive data shared (real keys, seeds, passwords)

---

## Where to Submit Bugs

**Internal Testing:**
- GitHub Issues: [Repository URL]
- Internal Bug Tracker: [URL if applicable]
- Team Chat: [Slack/Discord channel]

**Template Usage:**
```markdown
Copy this entire template
Fill in all sections
Remove example text
Submit via preferred channel
```

---

**Remember:**
- **Be specific** - Vague bug reports are hard to fix
- **Be reproducible** - If you can't reproduce it, developers probably can't either
- **Be helpful** - The more context you provide, the faster it gets fixed
- **Be safe** - NEVER share real private keys, production seeds, or sensitive data
