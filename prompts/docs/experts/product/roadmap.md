# Product Roadmap

**Last Updated**: October 22, 2025
**Owner**: Product Manager
**Purpose**: Feature prioritization, release planning, version history, future roadmap

---

## Quick Navigation

- [Current Version](#current-version)
- [Product Roadmap](#product-roadmap-by-phase)
- [Version History](#version-history)
- [Release Criteria](#release-criteria)
- [Success Metrics](#success-metrics)
- [Related Documentation](#related-documentation)

---

## Current Version

### v0.10.0 (October 2025)

**Status**: Released
**Theme**: Private Key Management & Planning Documentation Consolidation

**Key Features**:
- ✅ Private key export/import with WIF format
- ✅ Optional password protection for exported keys
- ✅ PDF export with QR codes for offline storage
- ✅ Privacy enhancement planning complete
- ✅ Planning documentation reorganized

**Next Release**: v0.11.0 - Privacy Enhancements (November 2025)

---

## Product Roadmap by Phase

### Phase 1: MVP - ✅ COMPLETE (v0.4.0)

**Goal**: Fully functional testnet wallet with core features
**Timeline**: Week 1-10
**Status**: Completed October 2025

**Core Features**:
- ✅ Wallet setup (create/import with seed phrase)
- ✅ Multi-account management with custom names
- ✅ Send/receive transactions on testnet
- ✅ Transaction history with details
- ✅ Security (AES-256-GCM encryption, auto-lock)
- ✅ All 3 address types (Legacy, SegWit, Native SegWit)
- ✅ Fee selection (slow/medium/fast)
- ✅ Password protection with strength validation

**Intentionally Out of Scope**:
- ❌ Mainnet support (Phase 2)
- ❌ Address book (Phase 2)
- ❌ Advanced fee customization (Phase 2)
- ❌ Hardware wallet support (Phase 3+)
- ❌ Multi-signature (Implemented early in v0.8.0)
- ❌ Lightning Network (Phase 4)

---

### Phase 2: Enhanced Functionality - 🔄 IN PROGRESS

**Theme**: Production Readiness & User Convenience
**Timeline**: 3 months post-MVP (October 2025 - January 2026)
**Status**: Partially complete

**Planned Features**:
- 🔄 Bitcoin mainnet support (with extensive testing) - **Deferred**
- ✅ Address book for saved contacts (v0.9.0 - Contacts V2)
- 🔄 Advanced fee customization (manual sat/vB) - **In Progress**
- ⏳ Transaction labels and notes - **Planned**
- ⏳ Export transaction history (CSV) - **Planned**
- ⏳ Multi-currency display (USD, EUR pricing) - **Planned**
- 🔄 Settings page improvements - **Ongoing**
- ⏳ Browser notification enhancements - **Planned**
- ⏳ Privacy mode toggle for balance concealment - **Future (UX Enhancement)**
- ⏳ Consistent password validation UI - **Future (UX Enhancement)**

**Early Completions from Phase 3**:
- ✅ Multi-signature support (v0.8.0 - accelerated)
- ✅ Tab-based architecture (v0.9.0 - accelerated)
- ✅ Private key import/export (v0.10.0 - accelerated)
- 🔄 Privacy enhancements (v0.11.0 - accelerated)

---

### Phase 3: Advanced Features - 📋 PLANNING

**Theme**: Power User Features
**Timeline**: 6 months post-MVP (March 2026+)
**Status**: Planning phase

**Planned Features**:
- ✅ Multi-signature support (2-of-2, 2-of-3, 3-of-5) - **Completed v0.8.0**
- 🔄 Bitcoin Privacy Enhancement - **v0.11.0 in progress**
- ⏳ Multiple wallet management (switch between wallets)
- ⏳ Watch-only addresses
- ⏳ Connect to personal Bitcoin node
- ⏳ Hardware wallet integration (Ledger, Trezor)
- ⏳ Advanced UTXO management and coin control
- ⏳ Custom transaction RBF (Replace-By-Fee)
- ⏳ CPFP (Child-Pays-For-Parent)

---

### Phase 3.5: Privacy Enhancement Release (v0.11.0) - ⏳ NEXT RELEASE

**Theme**: Privacy-by-Default Bitcoin Wallet
**Target**: November 2025
**Status**: PRD complete, ready for expert audit and implementation

**Critical Privacy Fixes (P0 - Must Have)**:
- ✅ PRD Complete: Unique change addresses for every transaction
  - Eliminates transaction graph analysis vulnerability
  - Prevents change address reuse leakage
- ✅ PRD Complete: Contacts address reuse warnings
  - Warns users about privacy risks when reusing addresses
  - Suggests xpub rotation for repeat payments

**High Priority Privacy Features (P1 - Should Have)**:
- ✅ PRD Complete: Randomized UTXO selection
  - Prevents wallet fingerprinting
  - Makes transaction analysis harder
- ✅ PRD Complete: Auto-generated fresh receive addresses
  - Encourages privacy best practices
  - Visual indicators for address reuse
  - Banner prompts to generate new addresses

**Optional Privacy Mode Features (P2 - Nice to Have)**:
- ✅ PRD Complete: Round number randomization
  - Prevents change output detection
  - User-configurable toggle in settings
- ✅ PRD Complete: API timing delays
  - Prevents network clustering analysis
  - Random delays between API calls
- ✅ PRD Complete: Transaction broadcast delays
  - Prevents timing correlation attacks
  - Configurable delay before broadcasting

**Documentation & Education**:
- ✅ PRD Complete: Comprehensive privacy guide (PRIVACY_GUIDE.md)
- ✅ PRD Complete: In-app privacy tips and warnings
- ✅ PRD Complete: Bitcoin Privacy Wiki compliance scorecard

**Related Documentation**:
- Technical Plan: `prompts/docs/plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md`
- Product Requirements: `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`
- Privacy Audit Report: `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md`
- Privacy Summary: `prompts/docs/plans/PRIVACY_ENHANCEMENT_SUMMARY.md`

**Implementation Phases**:
1. **Phase 1: Audit** - Blockchain Expert + Security Expert review current implementation
2. **Phase 2: Critical Fixes** - Implement P0 fixes (change addresses, contact warnings)
3. **Phase 3: High Priority** - Implement P1 features (randomized UTXO, auto-generate addresses)
4. **Phase 4: Privacy Mode** - Implement P2 optional toggles
5. **Phase 5: Testing** - QA Engineer comprehensive privacy testing
6. **Phase 6: Documentation** - Complete PRIVACY_GUIDE.md and in-app education

**Success Metrics**:
- Privacy Score: Achieve 80%+ on Bitcoin Privacy Wiki compliance
- User Education: 90%+ users see privacy warnings before first reuse
- Feature Adoption: 30%+ users enable Privacy Mode toggles
- Change Address: 100% transactions use unique change addresses
- UTXO Selection: 0% predictable patterns in UTXO selection

---

### Phase 4: Lightning Network - 💡 FUTURE

**Theme**: Instant Payments
**Timeline**: 12+ months post-MVP (October 2026+)
**Status**: Future consideration

**Planned Features**:
- Lightning Network integration
- Channel management UI
- Instant payment support
- Lightning address support
- Channel backup/restore

**Dependencies**:
- Mainnet launch (prerequisite)
- Lightning Network library evaluation
- User demand validation
- Technical feasibility study

---

## Version History

### Major Releases

#### v0.10.0 - Private Key Management (October 2025)
- Private key export/import with WIF format
- Optional password protection for exported keys
- PDF export with QR codes
- Planning documentation consolidation

#### v0.9.0 - Tab-Based Architecture & Contacts V2 (October 2025)
- Full migration to browser tab interface with persistent sidebar
- Contacts V2 with enhanced address book
- Improved multisig wizard UX (tab-based)
- Account management consolidated into sidebar dropdown
- Enhanced security controls (single tab, clickjacking prevention)

#### v0.8.0 - Multisig Wallets (October 2025)
- Multi-signature wallet support (2-of-2, 2-of-3, 3-of-5)
- PSBT (Partially Signed Bitcoin Transactions) support
- Extended public key (xpub) import/export
- BIP48, BIP67, BIP174 compliance
- P2SH, P2WSH, P2SH-P2WSH address types

#### v0.4.0 - MVP Complete (October 2025)
- Create/import wallets (seed phrase, private key)
- Multiple accounts with custom names
- Send/receive Bitcoin (testnet)
- Transaction history with details
- Fee selection (slow/medium/fast)
- All 3 address types (Legacy, SegWit, Native SegWit)
- Password protection and encryption
- Auto-lock functionality

### Earlier Versions

#### v0.3.0 - Core Wallet Features
- Transaction building and signing
- UTXO selection algorithm
- Address generation (all 3 types)
- Basic security implementation

#### v0.2.0 - Account Management
- Multi-account HD wallet structure
- BIP32/BIP44 derivation paths
- Account switching and management

#### v0.1.0 - Initial Foundation
- Basic wallet setup flow
- Seed phrase generation (BIP39)
- Chrome extension infrastructure
- Service worker architecture

---

## Release Criteria

### MVP Release Criteria (v0.4.0) - ✅ COMPLETE

**Must Have (Release Blockers)**:
- ✅ Create wallet from seed phrase
- ✅ Import wallet from seed phrase or private key
- ✅ Password protection and encryption
- ✅ Multi-account support
- ✅ Send transactions on testnet
- ✅ Receive transactions (address display + QR)
- ✅ Transaction history view
- ✅ Balance display (confirmed + unconfirmed)
- ✅ Fee estimation and selection
- ✅ Auto-lock functionality
- ✅ All 3 address types supported
- ✅ No critical security vulnerabilities
- ✅ Passing all unit tests
- ✅ Passing all integration tests
- ✅ Manual testing completed on testnet
- ✅ Security review completed
- ✅ Documentation complete (README, user guide)

**Nice to Have (Can be patched)**:
- ⏳ Transaction filtering/search
- ⏳ Export transaction history
- ⏳ Keyboard shortcuts
- ✅ Dark mode (completed v0.9.0)
- ⏳ Transaction labels
- ⏳ Multiple currency display

**Minimum Quality Bar**:
- No P0 bugs (critical, security, data loss)
- No more than 5 P1 bugs (high priority)
- Test coverage >80%
- All user flows tested end-to-end
- Performance: <2s load time, <1s account switch

---

### Privacy Enhancement Release Criteria (v0.11.0) - ⏳ PENDING

**Must Have (Release Blockers)**:
- [ ] P0 fixes implemented and tested
  - [ ] Unique change addresses for every transaction
  - [ ] Contact address reuse warnings
- [ ] P1 features implemented and tested
  - [ ] Randomized UTXO selection
  - [ ] Auto-generate receive address prompts
- [ ] Privacy audit completed (Blockchain Expert + Security Expert)
- [ ] Comprehensive manual testing of all privacy features
- [ ] PRIVACY_GUIDE.md documentation complete
- [ ] In-app privacy education implemented
- [ ] No regressions in existing functionality
- [ ] Privacy score: 80%+ on Bitcoin Privacy Wiki compliance

**Nice to Have (Can be patched)**:
- [ ] P2 Privacy Mode toggles (round numbers, delays)
- [ ] Advanced privacy analytics in settings
- [ ] Privacy score visualization for users
- [ ] Educational tooltips throughout app

**Quality Bar**:
- No P0 bugs (privacy leaks, security issues)
- No more than 3 P1 bugs
- Test coverage maintained >80%
- Privacy features tested on testnet
- Performance impact: <100ms additional latency

---

### Mainnet Release Criteria (v1.0.0) - 💡 FUTURE

**Must Have (Release Blockers)**:
- [ ] External security audit by reputable firm
- [ ] Bug bounty program completed (minimum 3 months)
- [ ] Privacy enhancements complete and tested
- [ ] Mainnet testing completed by team and beta users
- [ ] All P0 and P1 bugs resolved
- [ ] Comprehensive documentation (user guide, FAQ, security guide)
- [ ] Support channels established (GitHub, email)
- [ ] Disaster recovery plan documented
- [ ] Legal review completed
- [ ] Insurance or compensation strategy defined

**Minimum Quality Bar**:
- Zero critical security vulnerabilities
- Test coverage >90%
- Performance: <1s load time, <500ms account switch
- 6+ months stable operation on testnet
- 1000+ active testnet users with positive feedback
- Chrome Web Store rating >4.5/5.0

---

## Success Metrics

### MVP Launch Metrics (v0.4.0) - ✅ ACHIEVED

**Adoption Metrics**:
- Target: 1,000 installs in first month - **Status: TBD**
- Target: 100 active weekly users - **Status: TBD**
- Target: 70% user retention after 1 week - **Status: TBD**

**Usage Metrics**:
- Wallet creation success rate: >95% - **Target met**
- Transaction success rate: >98% - **Target met**
- Average session duration: 3-5 minutes - **Status: TBD**
- Sessions per user per week: 5+ - **Status: TBD**

**Quality Metrics**:
- Crash rate: <0.1% - **Target met**
- Error rate: <2% - **Target met**
- Bug reports per 100 users: <5 - **Status: TBD**
- Response time (balance load): <2s - **Target met**

**User Satisfaction**:
- Chrome Web Store rating: >4.0/5.0 - **Status: TBD**
- User feedback sentiment: >70% positive - **Status: TBD**
- Feature request diversity: High (indicates engagement) - **Status: TBD**

---

### Ongoing KPIs

**Product Health**:
- Weekly active users (WAU)
- Monthly active users (MAU)
- WAU/MAU ratio (stickiness target: >40%)
- User retention (Day 7, Day 30)
- Churn rate (target: <5% monthly)

**Feature Usage**:
- % users with multiple accounts (target: >60%)
- Average accounts per user (target: 2-3)
- Transactions per user per week (target: 5+)
- Most used fee speeds (validation for defaults)
- Address generation frequency (privacy indicator)
- Multisig adoption rate (target: 5%+ of users)
- Contacts usage (target: 40%+ users create contacts)

**Quality Indicators**:
- Crash-free user rate (target: >99.9%)
- API error rate (target: <1%)
- Transaction broadcast success rate (target: >99%)
- Average transaction confirmation time (info only)
- Support ticket volume (target: <10 per week)

**Growth Indicators**:
- Install growth rate (target: 20% MoM)
- Uninstall rate (target: <3% monthly)
- Chrome Web Store rating trend (maintain >4.0)
- Review sentiment over time (>70% positive)
- GitHub stars and forks (community engagement)

---

### Privacy Enhancement Metrics (v0.11.0)

**Privacy Compliance**:
- Bitcoin Privacy Wiki score: >80%
- Change address uniqueness: 100% of transactions
- UTXO selection randomness: 0% predictable patterns
- Address reuse rate: <10% (down from baseline)

**User Education**:
- % users who see address reuse warning: >90%
- % users who generate new address after warning: >60%
- % users who enable Privacy Mode: >30%

**Feature Adoption**:
- Auto-generate address banner click rate: >40%
- Contact privacy badge awareness: >70%
- Privacy settings engagement: >50% visit privacy settings

**Performance Impact**:
- Additional transaction build time: <100ms
- API delay impact: <200ms average
- User-perceived latency: No complaints

---

## Related Documentation

### Planning Documents
- [**BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md**](../plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md) - Technical privacy enhancement plan
- [**PRIVACY_ENHANCEMENT_PRD.md**](../plans/PRIVACY_ENHANCEMENT_PRD.md) - Product requirements for v0.11.0
- [**PRIVACY_ENHANCEMENT_SUMMARY.md**](../plans/PRIVACY_ENHANCEMENT_SUMMARY.md) - Executive summary of privacy features
- [**TAB_BASED_MULTISIG_WIZARD_PRD.md**](../plans/TAB_BASED_MULTISIG_WIZARD_PRD.md) - Tab-based wizard product requirements
- [**PRIVATE_KEY_EXPORT_IMPORT_PRD.md**](../plans/PRIVATE_KEY_EXPORT_IMPORT_PRD.md) - Private key management PRD

### Product Documentation
- [**requirements.md**](./requirements.md) - User stories and acceptance criteria
- [**features.md**](./features.md) - Detailed feature specifications
- [**decisions.md**](./decisions.md) - Product ADRs and decision log

### Architecture & Technical
- [**ARCHITECTURE.md**](../plans/ARCHITECTURE.md) - System architecture and design
- [**TESTING.md**](../plans/TESTING.md) - Testing strategy and QA processes

---

**Document Status**: Complete and up-to-date
**Next Review**: Before each release cycle
**Maintainer**: Product Manager
