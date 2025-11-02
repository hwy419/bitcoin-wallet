# Bitcoin Wallet Testing Guides - Complete Documentation

**Version:** 1.0
**Last Updated:** 2025-10-29
**Target Audience:** Manual testers, QA engineers
**Project:** Bitcoin Wallet Chrome Extension v0.10.0

---

## Quick Start

**New tester? Follow these steps:**

1. **Read this README** (5 minutes) ✓ You're here!
2. **[EXTENSION_INSTALLATION_GUIDE.md](./EXTENSION_INSTALLATION_GUIDE.md)** (10 minutes) - Install the extension in Chrome
3. **[MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)** (10 minutes) - Central hub, testing philosophy
4. **[TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)** (1 hour) - Set up your testnet environment
5. **[PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)** (30 min) - Run first smoke test
6. **[FEATURE_TESTS/01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md)** (1-2 hours) - Start feature testing

---

## Documentation Structure

### Core Guides (Start Here)

| Document | Purpose | Time | Status |
|----------|---------|------|--------|
| **[EXTENSION_INSTALLATION_GUIDE.md](./EXTENSION_INSTALLATION_GUIDE.md)** | Install Chrome extension from zip, load unpacked, verify installation | 10 min | ✅ Complete |
| **[MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)** | Central hub, 6-phase workflow, navigation | 10 min read | ✅ Complete |
| **[TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)** | Environment setup, faucets, test wallets | 1 hour | ✅ Complete |
| **[PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)** | 40 P0 critical path tests (smoke test suite) | 30-45 min | ✅ Complete |
| **[BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md)** | Bug templates, severity classification, evidence capture | Reference | ✅ Complete |
| **[TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)** | Progress tracking, metrics dashboard, QA sign-off | Living doc | ✅ Complete |

### Reference Guides (Use as Needed)

| Document | Purpose | When to Use | Status |
|----------|---------|-------------|--------|
| **[VISUAL_TESTING_REFERENCE.md](./VISUAL_TESTING_REFERENCE.md)** | ASCII wireframes, color charts, layout specs | Validating UI/UX | ✅ Complete |
| **[BITCOIN_SPECIFIC_TESTING.md](./BITCOIN_SPECIFIC_TESTING.md)** | Bitcoin protocol validation, testnet workflows, BIP compliance | Transaction/address testing | ✅ Complete |

### Feature Test Guides (Detailed Procedures)

| Guide | Feature | Tests | Time | Priority | Status |
|-------|---------|-------|------|----------|--------|
| **[01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md)** | Tab security, single tab enforcement, clickjacking | 16 | 1-2 hours | P0 | ✅ Complete |
| **[02_WALLET_SETUP.md](./FEATURE_TESTS/02_WALLET_SETUP.md)** | Create/import wallets, seed phrase, address types | 15 | 2 hours | P0 | ✅ Complete |
| **[03_AUTHENTICATION.md](./FEATURE_TESTS/03_AUTHENTICATION.md)** | Lock/unlock, auto-lock timers, passwords | 10 | 1 hour | P0 | ✅ Complete |
| **[04_ACCOUNT_MANAGEMENT.md](./FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md)** | Create, import, switch accounts, private keys | 18 | 2-3 hours | P1 | ✅ Complete |
| **[05_SEND_TRANSACTIONS.md](./FEATURE_TESTS/05_SEND_TRANSACTIONS.md)** | Send flows, fee tiers, validation, Send Max | 12 | 2 hours | P0 | ✅ Complete |
| **[06_RECEIVE_TRANSACTIONS.md](./FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md)** | Receive addresses, QR codes, balance updates, **address pagination**, **contact tagging**, **transaction filtering** | **15** | **2 hours** | P0 | ✅ Complete |
| **[07_TRANSACTION_HISTORY.md](./FEATURE_TESTS/07_TRANSACTION_HISTORY.md)** | History display, confirmations, explorer links, **transaction pagination**, **transaction metadata**, **advanced filtering** | **19** | **2.5 hours** | P1 | ✅ Complete |
| **[08_MULTISIG_WALLETS.md](./FEATURE_TESTS/08_MULTISIG_WALLETS.md)** | Multisig config, PSBT, xpub coordination | 30 | 4 hours | P2 | ✅ Complete |
| **[09_SECURITY_FEATURES.md](./FEATURE_TESTS/09_SECURITY_FEATURES.md)** | Encryption, memory cleanup, sensitive data, **privacy balance hiding**, **metadata encryption** | **17** | **2-3 hours** | P0 | ✅ Complete |
| **[10_SETTINGS_PREFERENCES.md](./FEATURE_TESTS/10_SETTINGS_PREFERENCES.md)** | Settings UI, account list, preferences | 8 | 1 hour | P1 | ✅ Complete |
| **[10_CONTACT_MANAGEMENT.md](./FEATURE_TESTS/10_CONTACT_MANAGEMENT.md)** | Contact custom tags, ContactDetailPane, "Add to Contacts" functionality, CSV import/export with tags | 16 | 2 hours | P1 | ✅ Complete |
| **[11_TRANSACTION_FILTERING.md](./FEATURE_TESTS/11_TRANSACTION_FILTERING.md)** | Advanced filtering by contact/tag/category, multi-select, combined filters with AND logic, filter persistence | 21 | 2 hours | P1 | ✅ Complete |
| **[11_ACCESSIBILITY_PERFORMANCE.md](./FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md)** | Keyboard nav, screen readers, performance | 12 | 2 hours | P2 | ✅ Complete |
| **[12_TRANSACTION_METADATA.md](./FEATURE_TESTS/12_TRANSACTION_METADATA.md)** | Transaction tags/category/notes, autocomplete, validation, visual indicators, encrypted storage | 20 | 2.5 hours | P1 | ✅ Complete |

**Note:** All 14 feature guides complete with comprehensive test procedures. New features added:
- **Privacy Mode**: Balance hiding feature (click-to-toggle) in Security Features guide
- **Pagination**: Transaction list and address list pagination controls in Receive and Transaction History guides
- **Transaction Metadata**: Tags, category, notes with encrypted storage and autocomplete
- **Contact Custom Tags**: Key-value pair tags for contacts with search capabilities
- **Enhanced Filtering**: Multi-select filters for contacts, tags, and categories with AND/OR logic
- **ContactDetailPane**: Comprehensive contact management with inline editing

---

## Testing Workflow (5-Day Plan)

### Day 1: Foundation (3 hours)
**Morning:**
- [ ] Complete [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) (1 hour)
- [ ] Run [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md) - Quick Smoke Test (30 min)

**Afternoon:**
- [ ] [FEATURE_TESTS/01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md) (1-2 hours)
- [ ] Begin Wallet Setup testing (if time permits)

**Deliverable:** Environment ready, smoke tests passed, tab architecture validated

---

### Day 2: Core Features (4 hours)
**Morning:**
- [ ] Wallet Setup (02) - Create & import flows (2 hours)
- [ ] Authentication (03) - Lock/unlock, timers (1 hour)

**Afternoon:**
- [ ] Account Management (04) - Create, switch, import accounts (2 hours)

**Deliverable:** Core wallet functionality validated

---

### Day 3: Transactions (4 hours)
**Morning:**
- [ ] Send Transactions (05) - All fee tiers, validation (2 hours)
- [ ] Receive Transactions (06) - QR codes, address generation (1 hour)

**Afternoon:**
- [ ] Transaction History (07) - Display, confirmations (1 hour)
- [ ] Security Features (09) - Encryption, console logs (1 hour)

**Deliverable:** Transaction flows validated, security checks passed

---

### Day 4: Advanced Features (4 hours)
**Morning:**
- [ ] Multisig Wallets (08) - PSBT workflow (2-3 hours)

**Afternoon:**
- [ ] Settings & Preferences (10) - UI configuration (1 hour)
- [ ] Accessibility & Performance (11) - Keyboard nav, benchmarks (1-2 hours)

**Deliverable:** Advanced features tested, UX validated

---

### Day 5: Regression & Sign-Off (2 hours)
**Morning:**
- [ ] Execute [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md) - Full P0 Suite (1.5 hours)
- [ ] Regression checklist (45 tests)

**Afternoon:**
- [ ] Complete [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md) (30 min)
- [ ] Write final test summary and QA sign-off

**Deliverable:** Testing complete, release readiness assessment

---

## Key Success Metrics

**Test Coverage Targets:**
- P0 (Critical): 100% executed, 100% passed
- P1 (High): 100% executed, ≥95% passed
- P2 (Medium): ≥90% executed, ≥85% passed

**Release Readiness:**
- ✅ 0 open P0 bugs
- ✅ 0-2 open P1 bugs (with documented workarounds)
- ✅ ≤10 open P2 bugs
- ✅ ≥5 successful testnet transactions
- ✅ ≥1 successful multisig transaction
- ✅ All 3 address types tested

---

## Feature Test Guide Template

**For guides 02-11, follow this structure:**

```markdown
# Feature Test Guide: [Feature Name]

**Feature Area:** [Name]
**Test Cases:** [Number] tests
**Time to Execute:** [Hours]
**Priority:** P0/P1/P2

## Overview
[What this feature does, why it matters]

## Prerequisites
- [ ] Checklist of required setup

## Test Cases

### TEST-XXX-001: [Test Name]
**Priority:** P0/P1/P2
**Time:** [Minutes]
**Purpose:** [What this test validates]

**Steps:**
1. [Numbered steps]
2. [With specific actions]

**Expected Results:**
- ✅ [Specific outcomes]
- ✅ [Observable behaviors]

**Visual Checkpoints:**
- [ ] [UI elements to verify]

**What to Check:**
- Console logs
- Block explorer
- State persistence

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___)

---

[Additional test cases...]

## Edge Case Tests
[Edge scenarios to validate]

## Test Summary
[Statistics, critical tests, failure handling]

## Common Issues & Troubleshooting
[Known issues and solutions]
```

---

## Creating Remaining Feature Guides

**To complete guides 02-11, refer to:**
1. **Test case source:** `prompts/docs/experts/qa/test-cases.md` (127 test cases with IDs)
2. **Template:** Use `01_TAB_ARCHITECTURE.md` as structural template
3. **Visual reference:** `VISUAL_TESTING_REFERENCE.md` for UI validation
4. **Bitcoin validation:** `BITCOIN_SPECIFIC_TESTING.md` for protocol tests

**Example mapping:**

| Feature Guide | Source Test Cases | Additional References |
|---------------|-------------------|----------------------|
| 02_WALLET_SETUP | TC-WS-001 to TC-WS-015 | BITCOIN_SPECIFIC_TESTING.md (address types) |
| 03_AUTHENTICATION | TC-AUTH-001 to TC-AUTH-010 | - |
| 04_ACCOUNT_MANAGEMENT | TC-ACC-001 to TC-ACC-018 | - |
| 05_SEND_TRANSACTIONS | TC-SEND-001 to TC-SEND-012 | BITCOIN_SPECIFIC_TESTING.md (transactions) |
| 06_RECEIVE_TRANSACTIONS | TC-RECV-001 to TC-RECV-008 | BITCOIN_SPECIFIC_TESTING.md (addresses) |
| 07_TRANSACTION_HISTORY | TC-HIST-001 to TC-HIST-008 | - |
| 08_MULTISIG_WALLETS | TC-MS-001 to TC-MS-030 | BITCOIN_SPECIFIC_TESTING.md (multisig) |
| 09_SECURITY_FEATURES | TC-SEC-001 to TC-SEC-010 | - |
| 10_SETTINGS_PREFERENCES | TC-SET-001 to TC-SET-008 | - |
| 11_ACCESSIBILITY_PERFORMANCE | TC-A11Y-001 to TC-PERF-006 | VISUAL_TESTING_REFERENCE.md |

---

## Documentation Statistics

**Total Documentation Created:**
- **Core Guides:** 9 documents (~43,500 words) - includes Installation and Distribution guides
- **Feature Guides:** 14 complete guides (~68,000 words)
- **Total Test Cases:** 203 tests across all features (updated with metadata, filtering, and contact management)
- **Total Pages:** ~250 pages (if printed)

**Test Coverage:**
- P0 (Critical): 42 tests
- P1 (High): 106 tests (includes new metadata, filtering, and contact tests)
- P2 (Medium): 42 tests
- P3 (Low): 13 tests
- **New Features Added:**
  - Privacy balance hiding
  - Transaction pagination (10 items per page with controls)
  - Address pagination (10 items per page with controls)
  - Transaction metadata (tags, category, notes with encryption)
  - Contact custom tags (key-value pairs with encryption)
  - Enhanced filtering (multi-select contacts/tags/categories with AND/OR logic)
  - ContactDetailPane (comprehensive contact management)
  - "Add to Contacts" from transactions
  - Metadata autocomplete and validation

---

## Tools & Resources

### Testing Tools
- **Chrome DevTools:** F12 (console, network, storage inspection)
- **Blockstream Testnet Explorer:** https://blockstream.info/testnet/
- **Testnet Faucets:**
  - Primary: https://testnet-faucet.mempool.co/
  - Backup: https://coinfaucet.eu/en/btc-testnet/
- **BIP39 Tool:** https://iancoleman.io/bip39/ (address verification)

### Documentation Links
- **Project README:** `../README.md`
- **Architecture:** `../prompts/docs/plans/ARCHITECTURE.md`
- **QA Expert Notes:** `../prompts/docs/experts/qa/_INDEX.md`
- **Test Cases Library:** `../prompts/docs/experts/qa/test-cases.md`

---

## FAQ

**Q: Where do I start if I'm new to testing?**
A: Follow this sequence:
1. Read [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)
2. Complete [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)
3. Run [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md)

**Q: How long does complete testing take?**
A: 16-20 hours over 5 days for comprehensive testing of all 127 test cases.

**Q: What if I find a P0 bug?**
A: STOP testing immediately, document in [BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md), report to team, wait for fix.

**Q: How do I track my progress?**
A: Update [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md) daily with test results, bugs found, and observations.

**Q: Can I test in any order?**
A: No - follow the sequence in [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md). Some tests depend on prerequisites.

**Q: What if testnet faucets are empty?**
A: See [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) for backup faucets and troubleshooting.

---

## Support & Questions

**For testing questions:**
- Add to "Questions" section in [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md)
- Ask development team in daily sync
- Check troubleshooting sections in each guide

**For bug reports:**
- Follow templates in [BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md)
- Include all required information (steps, screenshots, console logs)
- Classify severity correctly (P0/P1/P2/P3)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-29 | Initial release - 7 core guides, 1 feature guide, templates for remaining guides |

---

**Ready to start testing? Go to [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)!**
