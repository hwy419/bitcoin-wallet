# Account Management Testing Checklist
## Quick Reference for Manual Testing - v0.10.0

**Feature:** Enhanced Account Dropdown with Create/Import
**Tester:** _________________
**Date:** _________________
**Environment:** Chrome [version] on [OS]

---

## Pre-Testing Setup

- [ ] Extension built and loaded from `dist/`
- [ ] Test wallet created on testnet
- [ ] Wallet unlocked
- [ ] Browser console open (F12)
- [ ] Test data prepared (WIF keys, seed phrases)
- [ ] Testnet Bitcoin available for integration tests

---

## Critical Tests (Must Pass - P0)

### Create Account
- [ ] Create account with Native SegWit (TC-ACC-001)
- [ ] Empty name validation (TC-ACC-005)
- [ ] Rate limiting: 5 accounts in 1 minute (TC-ACC-006)
- [ ] Account limit: Maximum 100 accounts (TC-ACC-007)

### Import Private Key
- [ ] Import valid testnet WIF (compressed) (TC-IMP-001)
  - WIF: _________________
  - Expected Address: _________________
  - Import badge shows: [ ] YES [ ] NO
- [ ] Reject invalid WIF format (TC-IMP-003)
- [ ] Reject mainnet WIF (TC-IMP-004)

### Import Seed Phrase
- [ ] Import valid 12-word seed (TC-SEED-001)
  - First 4 words: _________________
  - Account Index: 0
  - Expected Address: _________________
  - Import badge shows: [ ] YES [ ] NO
- [ ] Reject known weak seed: "abandon abandon..." (TC-SEED-003)
- [ ] Reject 11-word seed (invalid count) (TC-SEED-005)
- [ ] Reject seed with bad checksum (TC-SEED-006)

### UI/UX
- [ ] Account dropdown shows 3 buttons in correct order (TC-UI-001)
  1. "Create Account" (orange)
  2. "Import Account" (gray)
  3. "Create Multisig Account" (gray)
- [ ] Import badge displays on imported accounts (TC-UI-002)
  - Blue download arrow icon
  - Tooltip: "Imported account - Back up separately"
- [ ] Security warnings visible in import modals (TC-UI-005)
  - Private Key tab: Amber banner
  - Seed Phrase tab: Amber banner

### Security
- [ ] Weak seeds rejected (TC-SEC-002)
  - Test: "abandon abandon..." → REJECTED
  - Test: "zoo zoo zoo..." → REJECTED
  - Test: "bitcoin bitcoin..." → REJECTED
- [ ] Mainnet keys rejected (TC-SEC-003)
  - Test mainnet WIF → REJECTED
- [ ] No sensitive data in console logs (TC-SEC-004)
  - Check console after failed import
  - No WIF keys visible: [ ] PASS [ ] FAIL
  - No seed phrases visible: [ ] PASS [ ] FAIL

### Integration (End-to-End)
- [ ] Create account → Receive → Send (TC-INT-001)
  - Account name: _________________
  - Address: _________________
  - TX received: _________________
  - TX sent: _________________
- [ ] Import WIF → Send all funds (TC-INT-002)
  - TX ID: _________________
- [ ] Import seed → Generate address → Receive (TC-INT-003)
  - Address generated: _________________

---

## High Priority Tests (Should Pass - P1)

### Create Account
- [ ] Create with SegWit (P2SH-P2WPKH) (TC-ACC-002)
  - Address starts with "2": [ ] YES [ ] NO
- [ ] Create with Legacy (P2PKH) (TC-ACC-003)
  - Address starts with "m" or "n": [ ] YES [ ] NO
- [ ] Character counter changes color (TC-ACC-004)
  - 20 chars: gray
  - 28 chars: amber
  - 30 chars: red

### Import Private Key
- [ ] Import uncompressed WIF (TC-IMP-002)
  - Starts with "9"
  - Address is Legacy
- [ ] Reject duplicate WIF (TC-IMP-005)
  - First import succeeds
  - Second import blocked with error
- [ ] Rate limiting (TC-IMP-006)
  - 5 imports in 1 minute
  - 6th blocked

### Import Seed Phrase
- [ ] Import valid 24-word seed (TC-SEED-002)
  - Word counter: "24/24 ✓"
- [ ] Reject high repetition seed (TC-SEED-004)
- [ ] Different account indices (TC-SEED-007)
  - Index 0: _________________
  - Index 1: _________________ (different address)
  - Index 10: _________________ (different address)
- [ ] Different address types (TC-SEED-009)
  - Native SegWit (tb1...): _________________
  - SegWit (2...): _________________
  - Legacy (m/n...): _________________

### UI/UX
- [ ] Modal is 800px wide (TC-UI-003)
- [ ] Form validation real-time feedback (TC-UI-004)
  - Empty name → Error displayed
  - Valid name → Error clears
- [ ] Toast notifications (TC-UI-006)
  - Success toast appears
  - Auto-dismisses after 3 seconds
- [ ] Tab navigation in import modal (TC-UI-007)
  - Switch between Private Key and Seed Phrase
  - Content updates correctly

### Integration
- [ ] Account switching works (TC-INT-004)
  - Switch between HD, imported key, imported seed
  - Dashboard updates each time
- [ ] Lock/unlock preserves data (TC-INT-005)
  - Import account → Lock → Unlock
  - Imported account still present with badge
- [ ] Extension reload persistence (TC-INT-006)
  - Import account → Reload extension
  - Account persists with badge

---

## Accessibility Tests (P1)

- [ ] Keyboard navigation (ACC-001)
  - Tab through all fields
  - Enter/Space activates buttons
  - Escape closes modals
- [ ] Screen reader labels (ACC-002)
  - All inputs have labels
  - Errors announced
- [ ] Color contrast (ACC-003)
  - Orange button: contrast ≥ 4.5:1
  - Gray button: contrast ≥ 4.5:1
  - Error text: contrast ≥ 4.5:1

---

## Performance Tests (P1)

- [ ] Account creation speed (PERF-001)
  - Time from button click to toast: _________ ms
  - Target: <1000ms
- [ ] Import speed (PERF-002)
  - Private key import: _________ ms (<1000ms)
  - Seed phrase import: _________ ms (<2000ms)
- [ ] Dropdown with 50+ accounts (PERF-003)
  - Dropdown opens: _________ ms (<500ms)
  - Scrolling: [ ] Smooth [ ] Laggy

---

## Regression Tests (Must Pass - P0)

- [ ] Existing account creation unchanged (REG-001)
- [ ] Multisig wizard still works (REG-002)
  - Opens in new tab
  - Multisig badge displayed (not import badge)
- [ ] Send/Receive unchanged (REG-003)
  - Can send from all account types
  - Can receive to all account types

---

## Edge Cases (P2)

- [ ] Create while wallet locking (TC-EDGE-001)
- [ ] Rapid button clicking (TC-EDGE-002)
  - No duplicate accounts created
- [ ] Unicode/emoji in names (TC-EDGE-003)
  - "My Wallet 💰🚀" accepted
- [ ] Network interruption during import (TC-EDGE-004)
- [ ] Maximum name length with emoji (TC-EDGE-005)
  - 30 characters enforced

---

## Test Data Used

### Valid Testnet WIF (Compressed)
- WIF: _________________
- Expected Address: _________________
- Funded: [ ] YES [ ] NO
- Balance: _________________

### Valid Testnet WIF (Uncompressed)
- WIF: _________________
- Expected Address: _________________
- Funded: [ ] YES [ ] NO

### Valid 12-Word Seed Phrase
- First 4 words: _________________
- Account Index 0 Address: _________________
- Funded: [ ] YES [ ] NO

### Valid 24-Word Seed Phrase
- First 4 words: _________________
- Account Index 0 Address: _________________
- Funded: [ ] YES [ ] NO

---

## Bugs Found

### Bug #1
- **Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
- **Test Case:** _________________
- **Description:** _________________________________________________
- **Steps to Reproduce:** _________________________________________________
- **Expected:** _________________________________________________
- **Actual:** _________________________________________________
- **Screenshot:** _________________

### Bug #2
- **Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
- **Test Case:** _________________
- **Description:** _________________________________________________

### Bug #3
- **Severity:** [ ] Critical [ ] High [ ] Medium [ ] Low
- **Test Case:** _________________
- **Description:** _________________________________________________

---

## Test Results Summary

**Total Test Cases:** 60+
**P0 Tests Run:** _____ / 25
**P0 Tests Passed:** _____ / 25
**P1 Tests Run:** _____ / 20
**P1 Tests Passed:** _____ / 20

**Pass Rate (P0):** _____% (Target: 100%)
**Pass Rate (P1):** _____% (Target: 95%+)

**Critical Bugs (P0):** _____
**High Bugs (P1):** _____
**Medium Bugs (P2):** _____
**Low Bugs (P3):** _____

---

## Release Recommendation

**All P0 tests passed:** [ ] YES [ ] NO

**Security validation complete:** [ ] YES [ ] NO
- [ ] Entropy validation working
- [ ] Network validation working
- [ ] Rate limiting enforced
- [ ] No sensitive data exposure

**Integration tests successful:** [ ] YES [ ] NO
- [ ] End-to-end workflows work
- [ ] Account persistence verified
- [ ] No data corruption

**Accessibility compliant:** [ ] YES [ ] NO

**Performance acceptable:** [ ] YES [ ] NO

**No regressions:** [ ] YES [ ] NO

---

## Final Sign-Off

**Ready for Release:** [ ] YES [ ] NO

**QA Engineer:** _________________

**Date:** _________________

**Signature:** _________________

**Notes:** _________________________________________________________
_________________________________________________________
_________________________________________________________

---

**If YES:** Feature approved for v0.10.0 release

**If NO:** Blocker issues:
1. _________________________________________________________
2. _________________________________________________________
3. _________________________________________________________

Must be resolved before release.
