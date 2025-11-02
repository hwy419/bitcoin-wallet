# Bitcoin Wallet v0.10.0 - Master Testing Guide

**Version:** 1.0
**Last Updated:** 2025-10-29
**Target Tester:** Real-world tester with basic Bitcoin knowledge
**Testing Scope:** Complete manual testing of all 11 feature areas (127 test cases)

---

## Welcome!

This guide is your central hub for testing the Bitcoin Wallet Chrome Extension v0.10.0. Whether you're new to software testing or an experienced QA professional, these guides will walk you through everything you need to thoroughly validate this wallet.

**What you'll accomplish:**
- Set up a complete testnet testing environment in <1 hour
- Execute critical path smoke tests in 30 minutes
- Systematically test all 11 feature areas over 5 days (~16 hours total)
- Report bugs with professional, actionable detail
- Provide a release readiness assessment

---

## Quick Start (15 Minutes)

**New to this project? Start here:**

1. **Read this guide** (Master Testing Guide) - 10 minutes
2. **Complete environment setup** → [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) - 1 hour
3. **Run your first smoke test** → [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md) - 30 minutes
4. **Start feature testing** → [FEATURE_TESTS/](./FEATURE_TESTS/) - 2-3 hours per day for 5 days

---

## Document Index

### Core Guides (Start Here)

| Guide | Purpose | Time | When to Use |
|-------|---------|------|-------------|
| **[MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)** (this file) | Central hub, workflow, navigation | 10 min read | Always start here |
| **[TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)** | Environment setup, faucets, tools | 1 hour | First-time setup, troubleshooting |
| **[PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)** | 40 P0 critical path tests (smoke tests) | 30 min | Every build, before feature testing |
| **[BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md)** | Bug templates, severity, screenshots | Reference | When you find a bug |
| **[TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)** | Progress tracking, metrics, sign-off | Living doc | Daily updates |

### Reference Guides

| Guide | Purpose | Time | When to Use |
|-------|---------|------|-------------|
| **[VISUAL_TESTING_REFERENCE.md](./VISUAL_TESTING_REFERENCE.md)** | Wireframes, color charts, layout specs | Reference | Validating UI/UX |
| **[BITCOIN_SPECIFIC_TESTING.md](./BITCOIN_SPECIFIC_TESTING.md)** | Bitcoin protocol, testnet workflows | Reference | Transaction/address testing |

### Feature Test Guides (Detailed Procedures)

| Guide | Feature Area | Test Cases | Time | Priority |
|-------|--------------|------------|------|----------|
| **[01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md)** | Tab opening, single tab enforcement, security | 16 | 1-2 hours | P0 |
| **[02_WALLET_SETUP.md](./FEATURE_TESTS/02_WALLET_SETUP.md)** | Create/import wallets, address types | 15 | 2 hours | P0 |
| **[03_AUTHENTICATION.md](./FEATURE_TESTS/03_AUTHENTICATION.md)** | Lock/unlock, auto-lock, passwords | 10 | 1 hour | P0 |
| **[04_ACCOUNT_MANAGEMENT.md](./FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md)** | Create, import, switch accounts | 18 | 2-3 hours | P1 |
| **[05_SEND_TRANSACTIONS.md](./FEATURE_TESTS/05_SEND_TRANSACTIONS.md)** | Send flows, fees, validation | 12 | 2 hours | P0 |
| **[06_RECEIVE_TRANSACTIONS.md](./FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md)** | Receive, address generation, QR codes | 8 | 1 hour | P0 |
| **[07_TRANSACTION_HISTORY.md](./FEATURE_TESTS/07_TRANSACTION_HISTORY.md)** | History display, confirmations | 8 | 1 hour | P1 |
| **[08_MULTISIG_WALLETS.md](./FEATURE_TESTS/08_MULTISIG_WALLETS.md)** | Multisig config, PSBT, coordination | 30 | 4 hours | P2 |
| **[09_SECURITY_FEATURES.md](./FEATURE_TESTS/09_SECURITY_FEATURES.md)** | Encryption, clickjacking, session | 10 | 1-2 hours | P0 |
| **[10_SETTINGS_PREFERENCES.md](./FEATURE_TESTS/10_SETTINGS_PREFERENCES.md)** | Settings UI, preferences | 8 | 1 hour | P1 |
| **[11_ACCESSIBILITY_PERFORMANCE.md](./FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md)** | Keyboard nav, performance | 12 | 2 hours | P2 |

---

## Testing Philosophy

### Our Approach

This wallet handles real Bitcoin (currently testnet only), so quality and security are paramount. Our testing philosophy:

1. **Security First** - All P0 security tests must pass 100%
2. **User-Centric** - Test from the user's perspective, not just technical specs
3. **Systematic** - Follow the test sequence to build on validated foundations
4. **Thorough** - Every feature, every address type, every error scenario
5. **Bitcoin-Aware** - Validate on actual testnet blockchain, not just UI

### What Makes a Good Test?

**Good testing:**
- ✅ Follows step-by-step procedures
- ✅ Verifies expected results at each step
- ✅ Checks console logs for errors (F12)
- ✅ Validates on Blockstream testnet explorer
- ✅ Documents actual results (screenshots, notes)
- ✅ Reports bugs immediately with complete information

**Poor testing:**
- ❌ Clicking randomly without checking results
- ❌ Assuming it works because it didn't crash
- ❌ Skipping verification steps
- ❌ Not documenting findings
- ❌ Moving to next test when current one failed

---

## 6-Phase Testing Workflow

### Phase 1: Foundation (Day 1, ~3 hours)

**Goal:** Verify wallet can be created, unlocked, and funded

**Activities:**
1. **Morning** (1 hour): Complete [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)
   - Install Chrome extension
   - Get testnet Bitcoin from faucet
   - Set up Blockstream explorer

2. **Morning** (30 min): Execute [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)
   - Run 40 P0 critical path tests
   - If any fail → STOP, report blocker bug

3. **Afternoon** (1.5 hours): Execute [01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md) + [02_WALLET_SETUP.md](./FEATURE_TESTS/02_WALLET_SETUP.md)

**Success Criteria:**
- [ ] Environment set up
- [ ] Wallet funded with ≥0.01 BTC
- [ ] All P0 smoke tests passed
- [ ] Tab architecture and wallet setup tested

**If Phase 1 fails:** STOP - Wallet fundamentally broken, escalate to dev team

---

### Phase 2: Core Features (Day 2, ~4 hours)

**Goal:** Validate send/receive transactions work end-to-end

**Activities:**
1. **Morning** (2 hours): [03_AUTHENTICATION.md](./FEATURE_TESTS/03_AUTHENTICATION.md) + [04_ACCOUNT_MANAGEMENT.md](./FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md)
2. **Afternoon** (2 hours): [05_SEND_TRANSACTIONS.md](./FEATURE_TESTS/05_SEND_TRANSACTIONS.md) + [06_RECEIVE_TRANSACTIONS.md](./FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md)

**Success Criteria:**
- [ ] Lock/unlock works reliably
- [ ] Can create and switch accounts
- [ ] At least 3 successful send transactions
- [ ] At least 3 successful receive transactions
- [ ] All 3 fee tiers tested (slow/medium/fast)

**If Phase 2 fails:** HIGH PRIORITY BUG - Core functionality broken

---

### Phase 3: Tab Security (Day 2-3, ~2 hours)

**Goal:** Validate P0 security controls

**Activities:**
- Execute [09_SECURITY_FEATURES.md](./FEATURE_TESTS/09_SECURITY_FEATURES.md)
- Focus on:
  - Single tab enforcement (TAB-002)
  - Clickjacking prevention (TAB-003)
  - Tab nabbing detection (TAB-004)
  - Session token validation (TAB-008)
  - Auto-lock timers (TAB-005, TAB-009)

**Success Criteria:**
- [ ] All P0 security tests passed
- [ ] No security vulnerabilities found
- [ ] Wallet locks appropriately

**If Phase 3 fails:** BLOCKING SECURITY ISSUE - Cannot release until fixed

---

### Phase 4: Advanced Features (Day 3-4, ~6 hours)

**Goal:** Test advanced functionality (multisig, import/export, history)

**Activities:**
1. **Day 3 Morning** (2 hours): [07_TRANSACTION_HISTORY.md](./FEATURE_TESTS/07_TRANSACTION_HISTORY.md) + [08_MULTISIG_WALLETS.md](./FEATURE_TESTS/08_MULTISIG_WALLETS.md) (Part 1)
2. **Day 3 Afternoon** (2 hours): [08_MULTISIG_WALLETS.md](./FEATURE_TESTS/08_MULTISIG_WALLETS.md) (Part 2 - complete multisig testing)
3. **Day 4 Morning** (2 hours): Complete any remaining multisig tests, test private key import/export

**Success Criteria:**
- [ ] Transaction history displays correctly
- [ ] At least one multisig account created (2-of-2 or 2-of-3)
- [ ] PSBT workflow tested end-to-end
- [ ] Private key export/import tested

**If Phase 4 fails:** P1 BUG - Important but not blocking basic usage

---

### Phase 5: UI/UX Polish (Day 4, ~3 hours)

**Goal:** Validate user experience quality

**Activities:**
- Execute [10_SETTINGS_PREFERENCES.md](./FEATURE_TESTS/10_SETTINGS_PREFERENCES.md)
- Execute [11_ACCESSIBILITY_PERFORMANCE.md](./FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md)
- Use [VISUAL_TESTING_REFERENCE.md](./VISUAL_TESTING_REFERENCE.md) to validate UI

**Success Criteria:**
- [ ] Settings screen functional
- [ ] Navigation intuitive
- [ ] Visual design consistent
- [ ] Keyboard navigation works
- [ ] No major UX friction

---

### Phase 6: Regression & Sign-Off (Day 5, ~2 hours)

**Goal:** Final validation and release readiness assessment

**Activities:**
1. **Morning** (1.5 hours): Execute regression test checklist from [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)
2. **Afternoon** (30 min): Complete [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md) and sign-off

**Success Criteria:**
- [ ] All regression tests passed
- [ ] All P0 bugs fixed and retested
- [ ] Test coverage metrics met (see Quality Gates below)
- [ ] Release readiness assessment complete

---

## Daily Testing Schedule (5-Day Plan)

**Total Time:** 16-20 hours over 5 days

### Day 1: Foundation (3 hours)
- **09:00-10:00** Environment setup ([TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md))
- **10:00-10:30** Smoke tests ([PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md))
- **10:30-10:45** Break
- **10:45-12:00** Tab Architecture ([01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md))
- **12:00-13:00** Lunch
- **13:00-14:30** Wallet Setup ([02_WALLET_SETUP.md](./FEATURE_TESTS/02_WALLET_SETUP.md))

**Deliverable:** Foundation tested, environment ready

---

### Day 2: Core Features (4 hours)
- **09:00-10:00** Authentication ([03_AUTHENTICATION.md](./FEATURE_TESTS/03_AUTHENTICATION.md))
- **10:00-11:00** Account Management ([04_ACCOUNT_MANAGEMENT.md](./FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md))
- **11:00-11:15** Break
- **11:15-12:00** Send Transactions Part 1 ([05_SEND_TRANSACTIONS.md](./FEATURE_TESTS/05_SEND_TRANSACTIONS.md))
- **12:00-13:00** Lunch
- **13:00-14:00** Send Transactions Part 2 + Receive ([06_RECEIVE_TRANSACTIONS.md](./FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md))
- **14:00-15:00** Security Features ([09_SECURITY_FEATURES.md](./FEATURE_TESTS/09_SECURITY_FEATURES.md))

**Deliverable:** Core features tested, security validated

---

### Day 3: Advanced Features Part 1 (4 hours)
- **09:00-10:00** Transaction History ([07_TRANSACTION_HISTORY.md](./FEATURE_TESTS/07_TRANSACTION_HISTORY.md))
- **10:00-12:00** Multisig Wallets Part 1 ([08_MULTISIG_WALLETS.md](./FEATURE_TESTS/08_MULTISIG_WALLETS.md))
- **12:00-13:00** Lunch
- **13:00-15:00** Multisig Wallets Part 2 (PSBT workflows)

**Deliverable:** Transaction history tested, multisig partially tested

---

### Day 4: Advanced Features Part 2 + Polish (3 hours)
- **09:00-10:30** Complete Multisig testing + Private key import/export
- **10:30-10:45** Break
- **10:45-11:30** Settings ([10_SETTINGS_PREFERENCES.md](./FEATURE_TESTS/10_SETTINGS_PREFERENCES.md))
- **11:30-12:30** Accessibility & Performance ([11_ACCESSIBILITY_PERFORMANCE.md](./FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md))

**Deliverable:** All features tested, UX validated

---

### Day 5: Regression & Sign-Off (2 hours)
- **09:00-10:30** Regression testing ([PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md) - regression checklist)
- **10:30-10:45** Break
- **10:45-11:30** Complete [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md), write summary, sign-off

**Deliverable:** Testing complete, release readiness assessment

---

## Test Environment Requirements

### Hardware
- **Computer:** Modern laptop/desktop (Windows, Mac, or Linux)
- **RAM:** 8GB minimum (16GB recommended)
- **Disk Space:** 2GB free for browser, extension, screenshots

### Software
- **Browser:** Chrome (latest stable) or Edge (latest stable)
- **Developer Tools:** Built-in (F12)
- **Optional:** Screen recording software (Windows Game Bar, macOS Screenshot, OBS)

### Bitcoin Testnet Resources
- **Faucet:** https://testnet-faucet.mempool.co/ (primary)
- **Explorer:** https://blockstream.info/testnet/
- **Test Amount Needed:** 0.01-0.02 BTC (from faucet)

### Documentation Tools
- **Bug Tracking:** Markdown files or GitHub Issues
- **Screenshots:** Built-in (Win+Shift+S, Cmd+Shift+4)
- **Test Results:** [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md) (this repo)

---

## Quality Gates & Success Criteria

### Testing Complete Criteria

**Before marking testing as "complete":**
- [ ] All 11 feature areas tested
- [ ] All P0 test cases: 100% executed, 100% passed
- [ ] All P1 test cases: 100% executed, ≥95% passed
- [ ] P2 test cases: ≥90% executed, ≥85% passed
- [ ] At least 5 successful send/receive transactions on testnet
- [ ] At least 1 successful multisig transaction
- [ ] All 3 address types tested (Legacy, SegWit, Native SegWit)
- [ ] All security tests passed (single tab, clickjacking, tab nabbing)

### Release Readiness Criteria

**v0.10.0 can be released when:**
- [ ] 0 open P0 bugs (critical/security)
- [ ] 0-2 open P1 bugs (major functionality) with workarounds documented
- [ ] ≤10 open P2 bugs (minor issues)
- [ ] All regression tests passed
- [ ] QA sign-off provided
- [ ] Test coverage ≥90% (P0+P1+P2 test cases)

### Bug Severity Thresholds

**Release Blockers:**
- Any P0 bugs (security, data loss, wallet unusable)
- >3 P1 bugs (major functionality broken)

**Acceptable for Release:**
- 0 P0 bugs
- 0-2 P1 bugs with documented workarounds
- ≤10 P2 bugs (documented in known issues)
- Any number of P3 bugs (backlog)

---

## Common Testing Scenarios

### Scenario 1: Found a Bug - What Do I Do?

1. **Stop testing the current feature** (don't proceed if blocker)
2. **Determine severity** using [BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md)
3. **Document the bug:**
   - Take screenshot
   - Copy console logs (F12)
   - Note exact steps to reproduce
4. **Create bug report** following template in [BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md)
5. **If P0 (critical):** Escalate immediately, stop all testing
6. **If P1 (high):** Report and continue with next feature
7. **If P2/P3:** Note in tracker, continue testing
8. **Update [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)** with bug reference

### Scenario 2: Test Failed - Is It a Bug or My Mistake?

**Troubleshooting Checklist:**
1. **Read test procedure again** - Did you follow all steps exactly?
2. **Check prerequisites** - Was wallet in correct starting state?
3. **Check console logs** (F12) - Any errors that explain failure?
4. **Try again** - Can you reproduce the failure?
5. **Check testnet** - Is Blockstream API working? (https://blockstream.info/testnet/)

**If reproducible 2+ times:** It's a bug - report it
**If only happened once:** Note as observation, continue testing
**If prerequisite missing:** Set up prerequisite, retry test

### Scenario 3: Ran Out of Testnet Bitcoin

**Solutions:**
1. **Primary Faucet:** https://testnet-faucet.mempool.co/ (0.001-0.01 BTC)
2. **Wait 24 hours:** Most faucets have 24-hour cooldown per address
3. **Generate new address:** Click "Generate New Address" on Receive screen, try faucet with new address
4. **Use backup faucet:** See [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) for alternatives
5. **Ask team:** Developer may have testnet BTC to send you

### Scenario 4: Transaction Not Confirming

**Troubleshooting:**
1. **Check on explorer:** https://blockstream.info/testnet/tx/[TXID]
   - If not found: Transaction not broadcast (wallet bug)
   - If "unconfirmed": Normal - wait for block
2. **Check testnet status:** Sometimes blocks are 30-60 minutes apart
3. **Check fee:** If fee too low (<1 sat/vB), may take hours
4. **Wait:** Testnet is slower than mainnet, be patient (up to 2 hours)

**When to report bug:**
- Transaction ID shown but not on explorer after 5 minutes
- Transaction shows on explorer but fee is 0
- Transaction confirmed but wallet balance not updating after 10 minutes

### Scenario 5: Extension Crashed or Not Loading

**Recovery Steps:**
1. **Check browser console:** F12 → Console tab → Look for errors
2. **Reload extension:** chrome://extensions/ → Click reload button
3. **Restart browser:** Close and reopen Chrome
4. **Check for updates:** Ensure extension version is v0.10.0
5. **Reinstall extension:** Remove and reload from dist/ folder

**Always document:**
- What you were doing when crash occurred
- Console error messages
- Whether crash is reproducible

---

## Best Practices & Tips

### DO:
✅ **Read the entire test procedure** before starting a test
✅ **Keep DevTools open** (F12) to catch console errors
✅ **Take screenshots** of unexpected behavior
✅ **Verify on Blockstream** for all transactions
✅ **Wait for confirmations** before marking transaction tests as passed
✅ **Document your test data** (addresses, txids, seed phrases for test wallets)
✅ **Update tracker daily** ([TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md))
✅ **Ask questions** if anything is unclear

### DON'T:
❌ **Skip prerequisites** - Each test assumes correct starting state
❌ **Test too fast** - Bitcoin operations take time (wait 30 seconds for balance updates)
❌ **Use mainnet** - This wallet is testnet only (v0.10.0)
❌ **Reuse seed phrases** - Generate fresh test wallets for each major test
❌ **Ignore console errors** - Red errors in console often indicate bugs
❌ **Test multiple features at once** - One feature at a time for clear results
❌ **Assume it works** - Always verify expected results

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension won't load | Check chrome://extensions/, ensure extension enabled |
| Can't get testnet BTC | Try alternative faucet (see [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)) |
| Transaction not confirming | Check Blockstream explorer, wait up to 1 hour for testnet |
| Balance not updating | Wait 30 seconds, refresh page, check console for API errors |
| Multisig addresses don't match | Verify all co-signers used same configuration and xpubs |
| Test case unclear | Reference [VISUAL_TESTING_REFERENCE.md](./VISUAL_TESTING_REFERENCE.md) or [BITCOIN_SPECIFIC_TESTING.md](./BITCOIN_SPECIFIC_TESTING.md) |
| Bug or expected behavior? | Check existing test cases, ask in questions log |

---

## Getting Help

### Questions During Testing
1. **Document in tracker:** Add to "Questions" section in [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)
2. **Continue testing:** Don't block on questions, move to next test
3. **Clarify with team:** Batch questions for daily sync

### Escalation
**Report immediately if:**
- ❌ P0 bug found (security, data loss)
- ❌ Cannot complete wallet creation
- ❌ Cannot access funds
- ❌ Private keys exposed

---

## Success Metrics

**You're doing great if:**
- ✅ Completing 2-3 hours of testing per day
- ✅ Finding bugs with complete reproduction steps
- ✅ Test coverage increasing daily
- ✅ Asking clarifying questions when needed
- ✅ Updating tracker regularly

**Testing is complete when:**
- ✅ All 11 feature guides executed
- ✅ All P0/P1 tests passed or bugs documented
- ✅ Release readiness criteria met
- ✅ QA sign-off provided in [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)

---

## Next Steps

**New Tester? Start Here:**

1. ✅ **Read this guide** (you're doing it!)
2. → **Environment Setup:** [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)
3. → **First Smoke Test:** [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)
4. → **Feature Testing:** [FEATURE_TESTS/01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md)

**Questions?**
- Check [BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md) for bug reporting help
- Check [BITCOIN_SPECIFIC_TESTING.md](./BITCOIN_SPECIFIC_TESTING.md) for Bitcoin testing help
- Add questions to [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)

---

**Good luck with your testing! Remember: Quality testing ensures a secure, reliable Bitcoin wallet for all users.**
