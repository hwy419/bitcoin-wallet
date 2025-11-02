# Product Decisions & ADRs

**Last Updated**: October 22, 2025
**Owner**: Product Manager
**Purpose**: Product ADRs, scope decisions, prioritization framework, trade-offs

---

## Quick Navigation

- [Product Vision & Strategy](#product-vision--strategy)
- [Prioritization Framework](#prioritization-framework)
- [Decision Log](#decision-log)
- [Strategic Trade-offs](#strategic-trade-offs)
- [Open Questions](#open-questions)
- [Related Documentation](#related-documentation)

---

## Product Vision & Strategy

### Vision Statement

Create the most secure, intuitive, and user-friendly Bitcoin wallet extension that brings MetaMask-level ease of use to Bitcoin, empowering users to confidently manage their Bitcoin on testnet and eventually mainnet.

### Mission

Deliver a browser-based Bitcoin wallet that prioritizes security without sacrificing usability, making Bitcoin accessible to both newcomers and experienced users.

### Strategic Goals

1. **Security First**: Industry-leading encryption and key management
2. **Intuitive UX**: MetaMask-familiar interface for easy adoption
3. **Standards Compliance**: Full BIP32/39/44/48/67/174 compliance for interoperability
4. **Progressive Enhancement**: Start simple, add power features later
5. **No Backend Dependencies**: Fully client-side for maximum privacy and decentralization

### Target Market

- **Primary**: Cryptocurrency enthusiasts learning Bitcoin (testnet)
- **Secondary**: Bitcoin developers building/testing dApps
- **Future**: General users wanting browser-based Bitcoin wallet (mainnet)

### Competitive Advantages

1. MetaMask-like multi-account experience for Bitcoin
2. Support for all 3 Bitcoin address types
3. No backend server = enhanced privacy
4. Open source and transparent
5. Chrome Manifest V3 compliance (future-proof)
6. Multi-signature wallet support (institutional-grade)
7. Privacy-by-default approach

---

## Prioritization Framework

### Priority Levels

**P0 (Must-Have / Critical)**:
- Blocks release or other work
- Security-critical features
- Core wallet functionality
- Fixes for critical privacy issues
- Essential UX improvements that prevent user confusion/frustration

**P1 (Should-Have / High)**:
- Significant user value
- Important UX improvements
- Privacy enhancements
- Features that differentiate from competitors
- Can be deferred to next release if necessary

**P2 (Nice-to-Have / Low)**:
- Optional enhancements
- Advanced features for power users
- Can be deferred indefinitely without major impact
- Experimental or unvalidated features

### Decision-Making Criteria

When evaluating features or making product decisions, consider:

1. **Security Impact**: Does it improve or risk security?
2. **User Value**: How many users benefit? How much?
3. **Development Effort**: Time/complexity to implement?
4. **Privacy Impact**: Does it protect or risk user privacy?
5. **Competitive Position**: Does it differentiate us?
6. **Standards Compliance**: Does it align with Bitcoin best practices?
7. **Technical Debt**: Does it create or reduce technical debt?
8. **Risk**: What are the risks if we do it? If we don't?

### User Segments

**Beginners** (40% of users):
- Simple send/receive flows
- Guided wallet setup
- Clear explanations and tooltips
- Safety warnings and guardrails

**Intermediate Users** (40% of users):
- Multiple accounts
- Fee control
- Transaction history
- Address management

**Power Users** (15% of users):
- Multisig wallets
- Coin control
- Privacy features
- Advanced settings

**Developers** (5% of users):
- xpub coordination
- PSBT workflows
- Integration capabilities
- Technical documentation

---

## Decision Log

### Decision 1: Address Type Selection

**Date**: October 12, 2025
**Status**: ✅ Implemented (v0.4.0)
**Owner**: Product Manager

**Decision**: Allow users to choose address type during wallet creation

**Options Considered**:
1. Force Native SegWit only (best fees, modern standard)
2. Allow user choice between 3 types
3. Default to Native SegWit with option to change later

**Decision**: **Option 2** - Allow user choice during setup

**Rationale**:
- Users may need Legacy for compatibility with older services/exchanges
- Educational opportunity to explain differences between address types
- Flexibility for various use cases (compatibility vs. lowest fees)
- Can recommend Native SegWit as default while allowing informed choice
- Better than changing later (requires new accounts)

**Impact**:
- Adds some complexity to setup flow
- Provides necessary flexibility
- Users report appreciation for the choice
- Aligns with industry standards (most wallets offer choice)

**Trade-offs Accepted**:
- Slightly more complex UI during setup
- Need to educate users about differences
- Benefit: User autonomy and compatibility outweigh added complexity

**Communicated To**: UI/UX Designer, Frontend Developer, Backend Developer

---

### Decision 2: Seed Phrase Length

**Date**: October 12, 2025
**Status**: ✅ Implemented (v0.4.0)
**Owner**: Product Manager

**Decision**: Use 12-word seed phrase for new wallets

**Options Considered**:
1. 12 words (128-bit security)
2. 24 words (256-bit security)
3. Let user choose (12 or 24)

**Decision**: **Option 1** - 12 words for creation, support both for import

**Rationale**:
- 12 words is industry standard for most consumer wallets
- 128-bit security is more than sufficient for Bitcoin wallets
- Easier for users to write down and verify (lower error rate)
- Reduces user error in seed phrase backup process
- Still support 24-word import for compatibility with other wallets
- MetaMask and most popular wallets use 12 words

**Impact**:
- Simpler UX during wallet creation
- Maintains security standards (128-bit is cryptographically sound)
- Better user compliance with backup process
- Compatible with majority of Bitcoin wallets

**Trade-offs Accepted**:
- 256-bit security not necessary for this use case
- Import still supports 24-word for migration scenarios
- Benefit: Usability improvements lead to better security (users actually back up)

**Communicated To**: UI/UX Designer, Backend Developer, Security Expert

---

### Decision 3: Auto-Lock Timeout

**Date**: October 12, 2025
**Status**: ✅ Implemented (v0.4.0)
**Owner**: Product Manager

**Decision**: 15-minute auto-lock timeout (not configurable in MVP)

**Options Considered**:
1. 5 minutes (very secure, less convenient)
2. 15 minutes (balanced approach)
3. 30 minutes (convenient, less secure)
4. User configurable (added complexity for MVP)

**Decision**: **Option 2** - 15 minutes fixed for MVP

**Rationale**:
- Balances security with usability
- Matches industry standards (MetaMask uses 15 minutes)
- Prevents timeout too frequently during active use
- Short enough to protect abandoned sessions
- Can make configurable in post-MVP based on feedback

**Impact**:
- Good security/usability balance
- Users don't complain about frequent unlocking
- Still provides reasonable security for abandoned sessions
- Industry-standard approach

**Future Enhancement**: Make configurable in Settings (Phase 2)

**Trade-offs Accepted**:
- Not the most secure option (5 min would be more secure)
- Not the most convenient (30 min would be more convenient)
- Benefit: Balance matches user expectations and industry norms

**Communicated To**: Backend Developer, UI/UX Designer

---

### Decision 4: Testnet Only for MVP

**Date**: October 12, 2025
**Status**: ✅ Implemented (v0.4.0)
**Owner**: Product Manager

**Decision**: MVP supports Bitcoin testnet only, mainnet in Phase 2

**Options Considered**:
1. Testnet only (safest)
2. Mainnet only (higher risk)
3. Both with toggle (added complexity)
4. Separate extensions (maintenance burden)

**Decision**: **Option 1** - Testnet only for MVP

**Rationale**:
- **Safety**: No risk of losing real funds during initial testing phase
- **Testing**: Extensive testing and validation required before handling real money
- **Development**: Can iterate faster without mainnet concerns
- **Security**: Time for thorough security audits before real Bitcoin
- **Users**: Developers and testers are primary MVP audience
- **Risk Management**: Reduces liability and user fund loss risk

**Impact**:
- Limits initial user base to developers/testers
- Ensures safety during development and early adoption
- Allows rapid iteration without catastrophic risks
- Builds confidence before mainnet launch

**Timeline**: Mainnet support in Phase 2 (after security audit and extensive testnet usage)

**Trade-offs Accepted**:
- Smaller initial user base
- Cannot market to general users yet
- Benefit: Safety and thorough testing outweigh market reach

**Communicated To**: All team members

---

### Decision 5: No Address Book in MVP

**Date**: October 12, 2025
**Status**: ✅ Reversed - Implemented in v0.9.0 as Contacts V2
**Owner**: Product Manager

**Original Decision**: Address book deferred to Phase 2

**Options Considered**:
1. Include in MVP
2. Defer to Phase 2
3. Never implement

**Original Decision**: **Option 2** - Phase 2 enhancement

**Original Rationale**:
- Not critical for core wallet functionality
- Adds development time to MVP
- Can validate need through user feedback
- Copy-paste addresses works for MVP
- Focus MVP on essential features

**Original Impact**:
- Users must copy-paste addresses
- Workaround: Users can keep addresses in notes/documents
- Timeline: Planned for Phase 2

**REVERSAL - October 2025**:
**New Decision**: Implement as "Contacts V2" in v0.9.0

**Reversal Rationale**:
- User feedback showed strong demand for address book
- Privacy features require contact tracking (address reuse warnings)
- Tab architecture provided screen space for robust implementation
- Differentiates from simpler wallets
- Enables privacy enhancement features (contact reuse tracking)

**Final Status**: ✅ Implemented as Contacts V2 (v0.9.0) with privacy enhancements

**Communicated To**: Product team → All team members (after reversal)

---

### Decision 6: Multisig Feature Prioritization

**Date**: October 12, 2025
**Status**: ✅ Implemented (v0.8.0, enhanced v0.9.0)
**Owner**: Product Manager

**Decision**: Implement multisig wallet support as post-MVP enhancement (accelerated from Phase 3)

**Options Considered**:
1. Include in MVP (too complex)
2. Defer to Phase 2 (originally planned)
3. Implement post-MVP (accelerated from Phase 3)
4. Never implement (missed opportunity)

**Decision**: **Option 3** - Accelerate from Phase 3 to post-MVP implementation

**Rationale**:
- **Market Differentiation**: Few Bitcoin browser wallets offer multisig
- **User Demand**: Power users and institutions need multisig for security
- **Technical Opportunity**: BIP standards provide clear implementation path
- **Use Cases Validated**: Business partnerships, inheritance planning, DAOs
- **Competitive Advantage**: Positions wallet for institutional adoption
- **Security Enhancement**: Multisig is the gold standard for high-value holdings
- **Education Opportunity**: Helps users understand advanced Bitcoin security

**Implementation Approach**:
- Start with three proven configurations (2-of-2, 2-of-3, 3-of-5)
- Use PSBT standard for coordination (no backend required)
- Build extensive user education into feature
- Launch on testnet first for extensive validation
- Support all three address types (P2SH, P2WSH, P2SH-P2WSH)
- Maintain no-backend architecture principle

**Impact**:
- Significant development effort but high user value
- Requires comprehensive testing and documentation
- Positions wallet as advanced/institutional-grade
- Differentiates from simpler wallet competitors
- Opens up business/institutional use cases

**Timeline**: v0.8.0 release (completed October 2025)

**Success Metrics**:
- Target: 5% of users create multisig accounts
- Target: >95% multisig transaction success rate
- Target: High user satisfaction with educational content
- Target: Positive feedback from institutional users

**Trade-offs Accepted**:
- Delayed other Phase 2 features
- Required significant development effort (3+ weeks)
- Benefit: High-value differentiator, institutional credibility

**Communicated To**: All team members, especially Blockchain Expert, Security Expert, Frontend Developer

---

### Decision 7: Move Multisig Wizard to Browser Tab

**Date**: October 13, 2025
**Status**: ✅ Implemented (v0.9.0)
**Owner**: Product Manager
**Priority**: P1 - High (Critical UX Fix)

**Decision**: Move multisig account creation wizard from extension popup to dedicated browser tab

**Problem Statement**:
Current popup-based wizard has critical UX issues:
- Popup closes when users click away to copy/paste xpub data (CRITICAL)
- File picker dialogs cause popup to close, losing progress (CRITICAL)
- Limited 600x400px screen space constrains 7-step wizard UI (HIGH)
- Users cannot coordinate with co-signers without losing wizard progress (CRITICAL)

**Options Considered**:
1. Keep popup wizard, add progress save (doesn't solve focus loss issue)
2. Move to browser tab (full persistence, more space)
3. Hybrid: Quick setup in popup, advanced in tab (confusing UX)
4. New window popup (similar issues to tab, but less standard)

**Decision**: **Option 2** - Full migration to browser tab

**Rationale**:
- **Persistence**: Tab stays open when users switch to other apps (100% solves popup closure issue)
- **Screen Space**: Full browser window provides 3-5x more space for wizard content
- **File Operations**: Native file dialogs work correctly in tabs without conflicts
- **User Control**: Users control tab lifecycle, not browser auto-close behavior
- **Industry Standard**: Desktop wallets use persistent windows for multisig setup
- **Development Effort**: Moderate (2-3 days) with 100% component reuse
- **Risk**: Low - well-understood Chrome extension tab architecture

**Implementation Highlights**:
- New tab page: `tabs/multisig-wizard.html`
- Entry: Dashboard "Create Multisig Account" button opens tab
- Exit: Wizard completion closes tab and focuses popup
- Progress: Save to chrome.storage.local after each step
- Resume: Detect incomplete wizard on next start
- Components: Reuse 100% of existing MultisigWizard component tree

**Success Metrics**:
- Target: >80% wizard completion rate (baseline likely <50%)
- Target: 0 accidental progress loss incidents
- Target: Positive user feedback, no UX complaints
- Target: >30% of wizards use save/resume feature

**Scope for v0.9.0**:
- ✅ Tab-based wizard implementation
- ✅ Remove popup wizard entirely (no valid use case)
- ✅ Progress save/resume with 30-day expiration
- ✅ Duplicate tab prevention
- ✅ Tab close confirmation
- ✅ All edge case handling (service worker restart, network offline, etc.)
- ❌ Popup progress indicator badge (Phase 2)
- ❌ PSBT signing in tab (wait for feedback)

**Edge Cases Addressed**:
- Duplicate wizard tabs: Focus existing tab instead of creating duplicate
- Popup closed during wizard: Wizard continues independently
- Browser restart: Progress restored from storage
- Service worker crash: Storage-backed state allows continuation
- Storage corruption: Auto-detect, clear, and start fresh
- Network offline: Steps 1-6 work offline, Step 7 shows retry button

**Impact Assessment**:
- **User Experience**: Significantly improved - eliminates #1 friction point
- **Development Effort**: Medium (2-3 days implementation + 1 day testing)
- **Risk**: Low - well-understood pattern, no wallet core changes
- **Business Value**: High - unblocks multisig feature adoption
- **Technical Debt**: None (cleaner than maintaining popup version)

**Timeline**:
- Implementation: 4 days (2 dev + 0.5 progress + 0.5 edge cases + 1 testing)
- Target Completion: October 20, 2025
- Release Version: v0.9.0

**Trade-offs Accepted**:
- Users must allow tab creation (rare browser setting issue)
- Tab-based flow slightly different from popup-only experience
- Small learning curve for first-time multisig creators (mitigated with tooltip)
- Benefit: Massive UX improvement, eliminates critical frustration point

**Rollback Plan**:
- If critical issues: Temporarily hide "Create Multisig Account" button
- Existing multisig accounts continue working (no data impact)
- No user fund risk (accounts are permanent once created)

**Approval Status**: APPROVED - Proceed with implementation

**Result**: This is a mandatory UX fix, not an optional enhancement. Current popup wizard is unusable for real-world multisig coordination. Tab-based wizard enables the multisig feature to reach its full potential.

**Communicated To**: All team members via PRD document

**Related Documentation**:
- Full PRD: `prompts/docs/plans/TAB_BASED_MULTISIG_WIZARD_PRD.md`
- Design Spec: `prompts/docs/plans/MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`

---

### Decision 8: Tab-Based Architecture for Entire Application

**Date**: October 14, 2025
**Status**: ✅ Implemented (v0.9.0)
**Owner**: Product Manager
**Priority**: P0 - Critical Product Evolution

**Decision**: Transform entire application from popup-based to full browser tab with persistent sidebar navigation

**Problem Statement**:
The popup-based architecture created fundamental limitations:
1. **Constrained Space**: 600x400px too small for complex features
2. **Popup Lifecycle**: Popup closes on focus loss, interrupting workflows
3. **Limited Interactions**: Can't support multi-window or long-running operations
4. **Professional Appearance**: Popup feels less professional than full-screen apps

**Options Considered**:
1. Keep popup, improve as much as possible
2. Full migration to browser tab
3. Hybrid: Simple tasks in popup, complex in tab
4. Both modes available (too complex)

**Decision**: **Option 2** - Full migration to browser tab with persistent sidebar

**Rationale**:
- **Enable Advanced Features**: Multisig, PSBT, future DeFi need more space
- **Competitive Positioning**: Match MetaMask web, Phantom UX quality
- **User Retention**: Reduce friction in complex workflows
- **Professional Image**: Institutional-grade appearance
- **Future-Proofing**: Scalable architecture for new features

**Key Benefits**:
1. **Unlimited Screen Space**: Full browser window available
2. **Persistent State**: Tab stays open, maintains context
3. **Professional Navigation**: 240px sidebar with persistent nav
4. **Enhanced Security**: Single tab enforcement, clickjacking prevention

**Security Enhancements Enabled**:
- Single tab enforcement (cryptographic session tokens)
- Clickjacking prevention (CSP + iframe detection)
- Tab nabbing prevention (location monitoring)
- Auto-lock on hidden tab (5 minutes)

**Navigation Structure**:
- Assets (₿) - Main dashboard
- Multi-sig Wallets (🔐) - Multisig management
- Contacts (👥) - Address book
- Settings (⚙️) - Configuration

**Color Scheme**: Bitcoin orange (#F7931A) as primary action color

**Impact**:
- **User Experience**: Dramatically improved, professional appearance
- **Development**: One-time migration effort (1 week)
- **Business Value**: Enables institutional positioning
- **Risk**: Low - well-understood pattern

**Trade-offs Accepted**:
- No longer a "quick popup" wallet (intentional shift to full app)
- Requires browser tab space (acceptable for crypto wallet)
- Different from traditional extension popups (aligns with crypto wallet trends)
- Benefit: Professional-grade experience enables advanced features

**Communicated To**: All team members

**Related**: See full analysis in product-manager-notes.md "Tab-Based Architecture Transformation (v0.9.0)"

---

### Decision 9: Privacy Enhancement Priority (v0.11.0)

**Date**: October 21, 2025
**Status**: ⏳ PRD Complete, Ready for Implementation
**Owner**: Product Manager
**Priority**: P0 (Critical Fixes) + P1 (High Features)

**Decision**: Prioritize privacy enhancements as v0.11.0 release, targeting Bitcoin Privacy Wiki compliance

**Problem Statement**:
Current implementation has several privacy vulnerabilities:
- Change address reuse (links transactions)
- Deterministic UTXO selection (wallet fingerprinting)
- No warnings for address reuse with contacts
- No privacy education for users

**Options Considered**:
1. Fix critical issues only (P0 fixes)
2. Comprehensive privacy release (P0 + P1 + P2)
3. Defer all privacy work (unacceptable)
4. Privacy as ongoing effort (no focused release)

**Decision**: **Option 2** - Comprehensive privacy release (phased implementation)

**Scope Breakdown**:
- **P0 (Must-Have)**: Unique change addresses, contact reuse warnings
- **P1 (Should-Have)**: Randomized UTXO selection, auto-generate prompts
- **P2 (Nice-to-Have)**: Privacy Mode toggles (round numbers, delays)

**Rationale**:
- **Bitcoin Privacy Wiki Compliance**: Industry best practices
- **User Protection**: Privacy is security for Bitcoin users
- **Market Differentiation**: Few wallets implement all best practices
- **Reputation**: Privacy-first positioning
- **User Education**: Opportunity to teach privacy concepts

**Implementation Phases**:
1. Audit current implementation (Blockchain + Security experts)
2. Fix P0 critical issues (change addresses, contact warnings)
3. Implement P1 features (randomized UTXO, auto-generate)
4. Add P2 optional toggles (Privacy Mode settings)
5. Testing and documentation
6. Release with comprehensive privacy guide

**Success Metrics**:
- Bitcoin Privacy Wiki compliance score: >80%
- Change address uniqueness: 100% of transactions
- UTXO selection randomness: 0% predictable patterns
- User education: 90%+ users see privacy warnings

**Timeline**: v0.11.0 - November 2025 (4-5 weeks total)

**Trade-offs Accepted**:
- Delays other Phase 2 features
- Some performance impact (randomization, delays)
- Additional complexity in transaction building
- Benefit: Privacy is fundamental to Bitcoin, worth the investment

**Related Documentation**:
- `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`
- `prompts/docs/plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md`
- `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md`

**Communicated To**: All team members, Blockchain Expert, Security Expert

---

## Strategic Trade-offs

### Security vs. Usability

**Philosophy**: Security first, but not at the expense of usability that causes users to circumvent security measures.

**Examples**:
- ✅ **15-min auto-lock**: Balanced approach (not 5 min, not 30 min)
- ✅ **12-word seed**: Easier to back up correctly (vs. 24-word)
- ✅ **No password recovery**: Security over convenience (users must backup seed)
- ✅ **Password re-entry**: Required for sensitive operations (export, send)

### Privacy vs. Convenience

**Philosophy**: Privacy-by-default for critical issues, optional toggles for advanced features.

**Examples**:
- ✅ **Unique change addresses**: Always enabled (P0, no toggle)
- ✅ **Randomized UTXO**: Always enabled (P1, no toggle)
- ⏳ **Privacy Mode toggles**: Optional (P2, user choice)
- ⏳ **Address reuse warnings**: Prominent but dismissible

### Complexity vs. Power Features

**Philosophy**: Progressive disclosure - simple by default, power features accessible but not overwhelming.

**Examples**:
- ✅ **Multi-account**: Simple dropdown, familiar pattern
- ✅ **Multisig**: Separate section, extensive help content
- ✅ **Address types**: Choice during setup with education
- ✅ **Fee selection**: Simple slow/medium/fast (custom input future)

### Speed to Market vs. Quality

**Philosophy**: No compromise on security, fast iteration on UX and features.

**Examples**:
- ✅ **Testnet first**: Safety over early market entry
- ✅ **Security audits**: Required before mainnet (delays but necessary)
- ✅ **Tab architecture**: One-time delay for long-term UX improvement
- ✅ **Privacy enhancement**: Dedicated release for comprehensive implementation

---

## Open Questions

### Q1: Mainnet Launch Timeline

**Question**: How much testnet usage before mainnet launch?

**Considerations**:
- External security audit required?
- Bug bounty program timeline?
- Insurance or compensation strategy?
- Legal review necessary?

**Current Thinking**:
- Minimum 6 months stable testnet operation
- 1000+ active testnet users
- External security audit (reputable firm)
- 3+ month bug bounty program
- Zero critical vulnerabilities

**Resolution Target**: After 6 months of stable testnet usage (v1.0.0)

---

### Q2: Hardware Wallet Integration

**Question**: Which hardware wallets to support first?

**Options**:
1. Ledger (most popular)
2. Trezor (open source)
3. Both from launch
4. Neither (defer indefinitely)

**Considerations**:
- User demand validation needed
- Development complexity
- Maintenance burden
- Partnership opportunities

**Current Thinking**: Support Ledger first (market leader), add Trezor based on demand

**Resolution Target**: User survey in Month 2 post-mainnet

---

### Q3: Revenue Model

**Question**: How to sustain development long-term?

**Options**:
1. Remain completely free (unsustainable)
2. Optional donation mechanism
3. Premium features for institutional users
4. Grant funding

**Current Thinking**: Start free, evaluate donation mechanism, consider institutional features

**Resolution Target**: Post-MVP, based on operating costs

---

### Q4: Multi-Language Support

**Question**: Prioritize which languages after English?

**Options**:
1. Spanish (large Spanish-speaking Bitcoin community)
2. Chinese (large market)
3. Both simultaneously
4. Community-driven translations

**Current Thinking**: Community-driven with i18n infrastructure

**Resolution Target**: Phase 3 consideration

---

## Related Documentation

### Product Documents
- [**roadmap.md**](./roadmap.md) - Release planning and version history
- [**requirements.md**](./requirements.md) - User stories and acceptance criteria
- [**features.md**](./features.md) - Detailed feature specifications

### Planning Documents
- [**ARCHITECTURE.md**](../plans/ARCHITECTURE.md) - Technical architecture decisions
- [**PRIVACY_ENHANCEMENT_PRD.md**](../plans/PRIVACY_ENHANCEMENT_PRD.md) - Privacy product requirements

### Expert Notes
- [**security-expert-notes.md**](../security-expert-notes.md) - Security decisions and audits
- [**blockchain-expert-notes.md**](../blockchain-expert-notes.md) - Bitcoin protocol decisions

---

**Document Status**: Complete and up-to-date
**Next Review**: Before major product decisions
**Maintainer**: Product Manager
