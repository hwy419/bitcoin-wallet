# QA Engineer - Decisions & ADRs

**Last Updated**: October 22, 2025
**Role**: QA Engineer - QA Process Architecture Decision Records

---

## Quick Navigation
- [Overview](#overview)
- [Testing Process Decisions](#testing-process-decisions)
- [Quality Standards](#quality-standards)
- [Collaboration Decisions](#collaboration-decisions)
- [Notes & Observations](#notes--observations)

---

## Overview

This document records Architecture Decision Records (ADRs) related to QA processes, testing standards, quality metrics, and collaboration workflows.

**Related Documentation:**
- [Test Plans](./test-plans.md) - Test plans and strategies
- [Test Cases](./test-cases.md) - Test case library
- [Bugs](./bugs.md) - Bug tracking and reports

---

## Testing Process Decisions

### ADR-QA-001: Manual Testing Focus

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Need to define the QA Engineer's role relative to the Testing Expert

**Decision:**
QA Engineer focuses on **manual testing**, while Testing Expert focuses on **automated tests**.

**Rationale:**
- Both roles are complementary and necessary
- Manual testing catches real-world usability issues that automated tests miss
- Automated tests provide fast feedback and regression coverage
- Clear separation of concerns prevents duplication of effort

**Responsibilities:**
- **QA Engineer:** Manual functional testing, exploratory testing, UAT, testnet validation
- **Testing Expert:** Unit tests, integration tests, test automation, CI/CD

**Consequences:**
- Need strong coordination between QA and Testing Expert
- Test coverage gaps must be identified and assigned
- Both must validate each other's assumptions with real-world scenarios

---

### ADR-QA-002: Testnet-Only Testing Policy

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Need to determine testing environment for Bitcoin operations

**Decision:**
All Bitcoin wallet testing will be conducted exclusively on **Bitcoin testnet** until mainnet readiness is confirmed.

**Rationale:**
- Testnet Bitcoin has no real value, eliminating financial risk
- Testnet allows unlimited testing without cost
- Testnet faucets provide free test Bitcoin
- Testnet closely mimics mainnet behavior
- Critical bugs caught before real funds at risk

**Testing Requirements:**
- All features must be validated on testnet before mainnet consideration
- Real testnet transactions must be executed for all transaction workflows
- Testnet faucets: https://testnet-faucet.mempool.co/
- Block explorer: https://blockstream.info/testnet/

**Mainnet Criteria (Future):**
- 100% testnet test pass rate
- Zero P0 or P1 bugs
- Security audit completed
- Extended testnet usage period (minimum 30 days)
- User acceptance testing successful
- Product Manager approval

---

### ADR-QA-003: Bug Priority Framework

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Need consistent bug prioritization criteria

**Decision:**
Use four-tier priority system: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)

**Priority Definitions:**

**P0 (Critical) - Immediate Fix Required:**
- Security vulnerabilities (private key exposure, encryption bypass)
- Data loss or corruption
- Wallet completely unusable
- Testnet transaction funds at risk
- Privacy breaches
- **Action:** Stop release, fix immediately

**P1 (High) - Fix Before Release:**
- Major features broken
- Significant functionality unavailable
- Poor user experience affecting core workflows
- Crashes or freezes
- Incorrect Bitcoin calculations
- **Action:** Must fix before release

**P2 (Medium) - Fix if Time Permits:**
- Minor features not working as expected
- UI issues with workarounds
- Non-critical validation errors
- Confusing but non-blocking UX
- Performance degradation
- **Action:** Fix if time permits, or defer to next release

**P3 (Low) - Backlog:**
- Cosmetic issues
- Edge cases unlikely to occur
- Minor UX improvements
- Typos or text improvements
- Nice-to-have features
- **Action:** Add to backlog, prioritize later

**Consequences:**
- Clear escalation path for critical bugs
- Objective criteria reduce prioritization debates
- Release blockers clearly identified
- Backlog managed separately from release work

---

### ADR-QA-004: Tab Architecture Testing Strategy

**Date:** October 18, 2025
**Status:** Accepted
**Context:** Major architectural change from popup to tab-based extension (v0.9.0)

**Decision:**
Create comprehensive tab architecture test plan with security-first approach.

**Key Testing Priorities:**
1. **Security (P0)** - All security controls must pass before release
   - Single tab enforcement
   - Clickjacking prevention
   - Tab nabbing detection
   - Session token validation
   - Auto-lock timers

2. **Stability (P1)** - Tab lifecycle must be stable
   - No crashes or freezes
   - No memory leaks
   - Session management reliable

3. **Performance (P1)** - Tab must be responsive
   - Tab opens quickly (<500ms)
   - Navigation smooth
   - No UI lag

4. **UX (P1)** - User experience must be intuitive
   - Sidebar navigation clear
   - Full viewport layout
   - Visual design consistent

5. **Regression (P0)** - All existing features must work
   - Wallet setup unchanged
   - Transactions unchanged
   - Account management unchanged

**Testing Approach:**
1. Start with P0 security tests
2. Validate core tab functionality
3. Test edge cases thoroughly
4. Run full regression suite
5. Performance testing last

**Documentation:**
- Created TAB_ARCHITECTURE_TESTING_GUIDE.md
- 10 core test cases (TAB-001 through TAB-010)
- 6 edge case scenarios
- Security test matrix (5 attack vectors)
- Performance benchmarks

**Consequences:**
- Testing time increased due to new security controls
- Need to validate tab lifecycle extensively
- Must test across different window sizes
- Security testing is blocking for release

---

### ADR-QA-005: Multisig Address Verification Standard

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Multisig addresses must match across all co-signers to prevent fund loss

**Decision:**
Require **100% address verification match rate** across all co-signers before considering multisig feature release-ready.

**Verification Process:**
1. Each co-signer creates multisig account independently
2. First address generated on each co-signer's wallet
3. Addresses compared manually (visual verification)
4. Addresses must match character-for-character
5. Verification repeated for multiple addresses (minimum 3)
6. Fingerprint verification required for all xpubs

**Critical Success Criteria:**
- 100% match rate (no exceptions)
- BIP67 key sorting verified (order doesn't matter)
- Address derivation consistent (same indices produce same addresses)
- All address types tested (P2SH, P2WSH, P2SH-P2WSH)

**Consequences:**
- Any mismatch is automatic release blocker (P0 bug)
- Must test with multiple wallet instances
- Real-world coordination testing required
- UAT scenarios must include address verification

**Rationale:**
- Address mismatch leads to permanent fund loss
- No recovery possible if funds sent to wrong multisig address
- User cannot detect mismatch without explicit verification
- This is the highest risk area in multisig implementation

---

### ADR-QA-006: Account Management Testing Priorities

**Date:** October 18, 2025
**Status:** Accepted
**Context:** Account management features (v0.10.0) introduce private key import and seed phrase import

**Decision:**
Prioritize **security validation** above all other testing for account management features.

**Security Testing Must Pass (P0):**
1. **Entropy Validation** - Weak seeds must be rejected
2. **Network Validation** - Mainnet keys must be rejected on testnet
3. **Rate Limiting** - Maximum 5 operations per minute enforced
4. **Account Limit** - Maximum 100 accounts enforced
5. **Memory Cleanup** - Sensitive data cleared from memory
6. **Error Sanitization** - No sensitive data in error messages

**Testing Order:**
1. Security tests (all P0)
2. Functionality tests (create/import workflows)
3. UI/UX tests (import badges, warnings)
4. Integration tests (E2E workflows)
5. Edge cases and error handling
6. Accessibility and performance
7. Regression testing

**Success Metrics:**
- 100% of P0 security tests must pass
- 95%+ of P1 tests must pass
- No sensitive data exposure in any scenario
- All imported accounts functional (send/receive)

**Consequences:**
- Security testing is blocking for release
- Weak seed detection must be thoroughly tested
- Many test cases focused on rejection scenarios
- Memory inspection required (DevTools manual testing)

**Rationale:**
- Private key import is high-risk feature
- Weak seeds compromise wallet security
- Network mismatch could result in fund loss
- User education critical for security

---

## Quality Standards

### ADR-QA-007: Release Readiness Criteria

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Need clear criteria for determining when a release is ready

**Decision:**
Establish comprehensive release readiness checklist with sign-off requirements.

**Minimum Criteria for Release:**

**Functionality:**
- All MVP features implemented
- All features tested and passing
- No P0 or P1 bugs open
- All P2 bugs documented

**Testing:**
- All test cases executed
- Regression tests passed
- Testnet validation completed
- UAT completed successfully (if applicable)

**Documentation:**
- User guide available
- Known issues documented
- Release notes prepared

**Security:**
- Security testing completed
- No critical vulnerabilities
- Encryption verified
- Auto-lock tested

**Performance:**
- Performance targets met
- No memory leaks detected
- Extension loads quickly

**Sign-off Required:**
- QA Engineer approval
- Product Manager approval
- Security Expert approval

**Consequences:**
- Clear gate for releases
- Multiple stakeholder approval required
- Documentation mandatory
- Quality bar consistently enforced

---

### ADR-QA-008: Test Case Documentation Standard

**Date:** October 22, 2025
**Status:** Accepted
**Context:** Need consistent format for test case documentation

**Decision:**
All test cases must include: ID, priority, prerequisites, steps, expected results, and actual results tracking.

**Required Elements:**
```markdown
### TEST-ID: Descriptive Title

**Status:** [Not Tested/Pass/Fail/Blocked]
**Priority:** [Critical/High/Medium/Low or P0/P1/P2/P3]
**Prerequisites:** [What must be true before testing]

**Steps:**
1. [Action]
2. [Action]
3. [Action]

**Expected Results:**
- ✅ [Expected outcome]
- ✅ [Expected outcome]

**Actual Results:** [What actually happened]

**Notes:** [Optional additional context]
```

**Benefits:**
- Consistent format across all test cases
- Easy to review and execute
- Clear pass/fail criteria
- Reproducible by anyone
- Test results tracked

**Consequences:**
- Test case creation takes more time initially
- Must update actual results after testing
- Easier to hand off testing to others
- Better documentation for future reference

---

### ADR-QA-009: Exploratory Testing Sessions

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Scripted test cases may miss real-world issues

**Decision:**
Conduct regular exploratory testing sessions in addition to scripted test cases.

**Session Structure:**
- **Charter:** Define focus area and goals
- **Duration:** Time-boxed (30-90 minutes)
- **Observations:** Document interesting behaviors
- **Bugs Found:** File bugs discovered
- **Questions:** Note questions for developers
- **Follow-up:** Identify areas needing more investigation

**Frequency:**
- After each major feature implementation
- Before each release
- When investigating complex bugs
- When learning new features

**Documentation:**
- Use exploratory testing session template
- Record observations even if no bugs found
- Share findings with team

**Consequences:**
- Catches unexpected issues
- Builds deep product knowledge
- Complements scripted testing
- Time must be allocated for exploration

---

## Collaboration Decisions

### ADR-QA-010: Collaboration with Testing Expert

**Date:** October 12, 2025
**Status:** Accepted
**Context:** Need clear boundaries and collaboration points with Testing Expert

**Decision:**
Establish complementary workflows with clear collaboration points.

**QA Engineer Responsibilities:**
- Manual testing of all features
- Exploratory testing sessions
- UAT coordination
- Testnet validation
- Bug reporting and triage
- Release readiness assessment

**Testing Expert Responsibilities:**
- Unit tests for all components
- Integration tests
- Test automation
- CI/CD pipeline
- Test infrastructure
- Code coverage analysis

**Collaboration Points:**
1. **Test Coverage Gaps** - QA reports gaps in automated tests
2. **Real-World Scenarios** - QA provides scenarios for automated tests
3. **Bug Validation** - Testing Expert writes regression tests for bugs QA finds
4. **Release Testing** - Both validate release readiness from different angles

**Communication:**
- QA reports coverage gaps to Testing Expert
- Testing Expert notifies QA of new automated test coverage
- Weekly sync on test status
- Shared bug tracking and test case documentation

**Consequences:**
- Comprehensive test coverage (manual + automated)
- No duplication of effort
- Faster feedback loops
- Both perspectives validate quality

---

### ADR-QA-011: Collaboration with Other Roles

**Date:** October 12, 2025
**Status:** Accepted
**Context:** QA Engineer collaborates with entire team

**Decision:**
Establish clear collaboration workflows with all team roles.

**With Product Manager:**
- Validate acceptance criteria
- Provide UAT feedback
- Report usability issues
- Confirm features meet requirements

**With Frontend/Backend Developers:**
- Report bugs with clear reproduction steps
- Provide early feedback on features
- Validate fixes quickly
- Pair on complex debugging

**With Blockchain Expert:**
- Validate Bitcoin operations on testnet
- Verify address generation
- Test transaction building
- Confirm BIP compliance

**With Security Expert:**
- Conduct security testing
- Validate encryption implementation
- Test authentication flows
- Verify no data leakage

**With UI/UX Designer:**
- Report usability issues
- Validate design implementation
- Test accessibility
- Provide user perspective

**Communication Standards:**
- Bug reports include reproduction steps, screenshots, console logs
- Use clear, objective language
- Prioritize based on impact
- Provide constructive feedback
- Respond to questions promptly

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

### 2025-10-18: Account Management Test Plan Created
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

### 2025-10-22: Documentation Migration to Segmented Structure
- Migrated monolithic qa-engineer-notes.md to segmented structure
- Created test-plans.md for all test planning and strategies
- Created test-cases.md for test case library
- Created bugs.md for bug tracking and triage
- Created decisions.md for QA process ADRs
- All content preserved and reorganized for better navigation
- Cross-references established between documents
- Original file remains intact (not deleted)

**Benefits of Segmentation:**
- Easier to find specific information
- Test plans separate from test cases
- Bug tracking isolated for quick reference
- Decision records provide historical context
- Each file focused on single purpose
- Better for version control and collaboration

---

**Last Updated:** October 22, 2025
