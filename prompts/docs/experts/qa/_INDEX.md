# QA Engineer - Quick Reference

**Last Updated**: November 1, 2025
**Role**: QA Engineer
**Purpose**: Manual testing, test plans, bug tracking, quality assurance

---

## Current Status

### Test Coverage
- **Manual Test Suite**: 239 test cases (15 comprehensive feature guides complete)
- **Regression Suite**: 45 test cases
- **Critical Path**: All core features covered including metadata, filtering, contacts, and encrypted backup
- **Testnet Validation**: Pending testing

### Quality Metrics
- **Open Bugs**: 0 (no testing completed yet)
- **Test Pass Rate**: N/A (pending testing)
- **Release Readiness**: v0.10.0 - Pending Testing

---

## Documentation Map

### Comprehensive Testing Guides (For Human Testers)
🆕 **Production-Ready Test Execution Guides** - Located in `/TESTING_GUIDES/`

**Core Guides:**
- [**README.md**](../../../../TESTING_GUIDES/README.md) - Quick start, 5-day workflow, documentation index (~4,000 words)
- [**MASTER_TESTING_GUIDE.md**](../../../../TESTING_GUIDES/MASTER_TESTING_GUIDE.md) - Central hub, 6-phase workflow, navigation (~3,500 words)
- [**TESTNET_SETUP_GUIDE.md**](../../../../TESTING_GUIDES/TESTNET_SETUP_GUIDE.md) - Environment setup, faucets, test wallets (~2,500 words)
- [**PRIORITY_TEST_EXECUTION_GUIDE.md**](../../../../TESTING_GUIDES/PRIORITY_TEST_EXECUTION_GUIDE.md) - 40 P0 critical path tests (~6,000 words)
- [**BUG_REPORTING_GUIDE.md**](../../../../TESTING_GUIDES/BUG_REPORTING_GUIDE.md) - Bug templates, severity classification (~4,000 words)
- [**TEST_RESULTS_TRACKER.md**](../../../../TESTING_GUIDES/TEST_RESULTS_TRACKER.md) - Progress tracking, metrics, QA sign-off (~2,500 words)
- [**VISUAL_TESTING_REFERENCE.md**](../../../../TESTING_GUIDES/VISUAL_TESTING_REFERENCE.md) - ASCII wireframes, color charts (~8,000 words)
- [**BITCOIN_SPECIFIC_TESTING.md**](../../../../TESTING_GUIDES/BITCOIN_SPECIFIC_TESTING.md) - Protocol validation, testnet workflows (~7,000 words)

**Feature Test Guides** (15 guides, 239 tests, ~88,000 words):
- [**01_TAB_ARCHITECTURE.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/01_TAB_ARCHITECTURE.md) - 16 tests, 1-2 hours, P0
- [**02_WALLET_SETUP.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/02_WALLET_SETUP.md) - 15 tests, 2-2.5 hours, P0
- [**03_AUTHENTICATION.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/03_AUTHENTICATION.md) - 10 tests, 1-1.5 hours, P0
- [**04_ACCOUNT_MANAGEMENT.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md) - 18 tests, 2-3 hours, P0-P1
- [**05_SEND_TRANSACTIONS.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/05_SEND_TRANSACTIONS.md) - 12 tests, 2 hours, P0
- [**06_RECEIVE_TRANSACTIONS.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md) - 15 tests (address pagination, contact tagging, filtering), 2 hours, P0
- [**07_TRANSACTION_HISTORY.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/07_TRANSACTION_HISTORY.md) - 19 tests (pagination, metadata, advanced filtering), 2.5 hours, P1
- [**08_MULTISIG_WALLETS.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/08_MULTISIG_WALLETS.md) - 30 tests, 4-5 hours, P1-P2
- [**09_SECURITY_FEATURES.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/09_SECURITY_FEATURES.md) - 17 tests (privacy mode, metadata encryption), 2-3 hours, P0
- [**10_SETTINGS_PREFERENCES.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/10_SETTINGS_PREFERENCES.md) - 8 tests, 1 hour, P1
- [**10_CONTACT_MANAGEMENT.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/10_CONTACT_MANAGEMENT.md) - 16 tests (custom tags, ContactDetailPane, CSV import/export), 2 hours, P1
- [**11_TRANSACTION_FILTERING.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/11_TRANSACTION_FILTERING.md) - 21 tests (multi-select filters, AND/OR logic, persistence), 2 hours, P1
- [**11_ACCESSIBILITY_PERFORMANCE.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md) - 12 tests, 2 hours, P2
- [**12_TRANSACTION_METADATA.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/12_TRANSACTION_METADATA.md) - 20 tests (tags, category, notes, autocomplete, encryption), 2.5 hours, P1
- [**13_ENCRYPTED_BACKUP.md**](../../../../TESTING_GUIDES/FEATURE_TESTS/13_ENCRYPTED_BACKUP.md) - 🆕 36 tests (export/import, backward compatibility, security), 45-60 min, P0

**Total Documentation:** ~131,500 words, 25 documents (includes Installation and Distribution guides), 239 test cases

**New Features Added (v0.11.0):**
- Privacy Mode: Click-to-toggle balance hiding feature
- Transaction Pagination: Items per page selector (10, 35, 50, 100, 500) with page navigation
- Address Pagination: Address list pagination on Dashboard
- 🆕 Transaction Metadata: Tags, category, notes with encrypted storage and autocomplete
- 🆕 Contact Custom Tags: Key-value pair tags for contacts with search capabilities
- 🆕 Enhanced Filtering: Multi-select filters for contacts/tags/categories with AND/OR logic
- 🆕 ContactDetailPane: Comprehensive contact management with inline editing
- 🆕 "Add to Contacts": Quick contact creation from Send screen and transactions

### Test Documentation (Internal)
- [**test-plans.md**](./test-plans.md) - Manual test plans organized by feature
  - MVP Test Plan v1.0
  - Tab Architecture Testing (v0.9.0)
  - Multisig Test Plan v1.0
  - Account Management Test Plan (v0.10.0)
  - UAT scenarios and exploratory testing templates

- [**test-cases.md**](./test-cases.md) - Detailed test case library (internal reference)
  - Tab Architecture: TAB-001 to TAB-010
  - Wallet Setup: TC-001+
  - Multisig: TC-MS-001 to TC-MS-030
  - Account Management: TC-ACC, TC-IMP, TC-SEED series
  - Regression checklists
  - Accessibility and performance test cases

- [**bugs.md**](./bugs.md) - Bug tracking, triage, and release readiness
  - Bug summary statistics
  - Active bugs tracking
  - Bug triage process and templates
  - Known issues and workarounds
  - Release readiness checklists

- [**decisions.md**](./decisions.md) - QA process architecture decision records
  - Testing process decisions (ADR-QA-001 to ADR-QA-006)
  - Quality standards (ADR-QA-007 to ADR-QA-009)
  - Collaboration decisions (ADR-QA-010 to ADR-QA-011)
  - Testing strategy notes and observations

---

## Recent Changes (Last 5)

1. **2025-11-01**: 🎉 **Encrypted Backup Testing Guide Complete** - Created comprehensive manual testing guide for encrypted wallet backup/restore system (36 tests, ~20,000 words, 45-60 min execution time). Guide covers: Export flow (8 tests), fresh import flow (7 tests), invalid import scenarios (5 tests), backward compatibility (2 tests), round-trip testing (2 tests), edge cases (6 tests), and security verification (4 tests). Includes pre-test setup for creating comprehensive test wallet, detailed troubleshooting guide, and security checklist. Total test suite now **239 tests** across **15 feature guides** (~131,500 words total). File: 13_ENCRYPTED_BACKUP.md (P0 critical - data integrity & security).
2. **2025-11-01**: 🎉 **Advanced Features Testing Complete** - Created 3 comprehensive testing guides (57 tests, ~40,000 words) for transaction metadata, contact management, and advanced filtering features. Total test suite now 203 tests across 14 feature guides (~111,500 words total). New guides: 10_CONTACT_MANAGEMENT.md (16 tests, key-value tags), 11_TRANSACTION_FILTERING.md (21 tests, multi-select with AND/OR logic), 12_TRANSACTION_METADATA.md (20 tests, encrypted tags/category/notes). Also added test data setup section to TESTNET_SETUP_GUIDE.md for comprehensive filter testing scenarios.
2. **2025-10-30**: 🆕 **Privacy & Pagination Features Added** - Updated testing guides with 3 new test cases for v0.11.0 features: Privacy Mode balance hiding (SEC-011), transaction pagination (HIST-EDGE-01), and address pagination (RECV-EDGE-04). Total test count now 130+ tests across 21 documents (~75,000 words). Updated guides: 06_RECEIVE_TRANSACTIONS.md, 07_TRANSACTION_HISTORY.md, 09_SECURITY_FEATURES.md.
3. **2025-10-29**: 🎉 **Comprehensive Testing Guides Complete** - Created 19 production-ready testing guides (~70,000 words, 127+ test cases) for human testers in `/TESTING_GUIDES/` directory. Includes master guide, testnet setup, priority tests, bug reporting templates, visual references, Bitcoin-specific testing, and 11 detailed feature guides. Ready for real-world tester deployment.
4. **2025-10-22**: Migrated to segmented documentation structure
5. **2025-10-18**: Account management test plan created (60+ test cases)

---

## Quick Reference

### Test Environments
- **Testnet**: Primary testing environment (all Bitcoin operations)
- **Chrome**: Version 120+ (primary browser)
- **Edge**: Version 120+ (secondary browser)
- **Faucet**: https://testnet-faucet.mempool.co/
- **Explorer**: https://blockstream.info/testnet/

### Critical Test Paths
1. **Wallet Setup**: Create/import wallet, seed phrase backup
2. **Authentication**: Unlock, lock, auto-lock (15min + 5min hidden tab)
3. **Transactions**: Send (slow/medium/fast fee), receive, history
4. **Account Management**: Create account, import (private key/seed phrase)
5. **Tab Architecture**: Single tab enforcement, security controls, session tokens
6. **Multisig**: Configuration selection, xpub exchange, PSBT workflow, address verification

### Bug Priority Levels
- **P0 (Critical)**: Security vulnerabilities, data loss, wallet unusable - immediate fix required
- **P1 (High)**: Major functionality broken, significant user impact - fix before release
- **P2 (Medium)**: Minor functionality issues, workarounds available - fix if time permits
- **P3 (Low)**: Cosmetic issues, edge cases, minor UX improvements - backlog

### Testing Status by Feature
- **Tab Architecture (v0.9.0)**: 📝 Test plan ready, testing pending
- **Multisig (v0.8.0)**: 📝 Test plan ready, testing pending
- **Account Management (v0.10.0)**: 📝 Test plan ready, testing pending
- **MVP Core Features**: 📝 Test plan needs update for tab architecture

### Key Testing Priorities
1. **Security First**: All P0 security tests must pass (encryption, validation, session management)
2. **Address Verification**: 100% match rate for multisig addresses (critical for fund safety)
3. **Integration Testing**: End-to-end workflows must be validated on testnet
4. **No Regressions**: All existing features must work after architectural changes
5. **Real-World Validation**: Testnet transactions required before release

---

## Navigation Tips

**For Human Testers (Production Testing):**
- **New tester?** → Start with [TESTING_GUIDES/README.md](../../../../TESTING_GUIDES/README.md) (5-minute quick start)
- **Ready to test?** → Follow [MASTER_TESTING_GUIDE.md](../../../../TESTING_GUIDES/MASTER_TESTING_GUIDE.md) (6-phase workflow)
- **Setting up testnet?** → Use [TESTNET_SETUP_GUIDE.md](../../../../TESTING_GUIDES/TESTNET_SETUP_GUIDE.md)
- **Need to test fast?** → Run [PRIORITY_TEST_EXECUTION_GUIDE.md](../../../../TESTING_GUIDES/PRIORITY_TEST_EXECUTION_GUIDE.md) (40 P0 tests, 30 min smoke test)
- **Testing specific feature?** → Pick from 11 feature guides in [FEATURE_TESTS/](../../../../TESTING_GUIDES/FEATURE_TESTS/)
- **Found a bug?** → Use templates in [BUG_REPORTING_GUIDE.md](../../../../TESTING_GUIDES/BUG_REPORTING_GUIDE.md)
- **Track progress?** → Update [TEST_RESULTS_TRACKER.md](../../../../TESTING_GUIDES/TEST_RESULTS_TRACKER.md)

**For QA Engineers (Internal):**
- **Planning a test?** → Start with [test-plans.md](./test-plans.md)
- **Executing tests?** → Use [test-cases.md](./test-cases.md)
- **Found a bug?** → Report in [bugs.md](./bugs.md)
- **Why this process?** → See [decisions.md](./decisions.md)

---

**Need detailed information?** Navigate to the specific documentation files linked above.
