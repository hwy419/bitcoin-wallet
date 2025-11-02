# Bitcoin Privacy Enhancement - Product Requirements Document

**Version:** 1.0
**Created:** October 21, 2025
**Status:** Approved - Ready for Implementation
**Owner:** Product Manager
**Related Documents:**
- `BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md` - Technical implementation plan
- `ARCHITECTURE.md` - System architecture
- `product-manager-notes.md` - Product context

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Goals & Success Metrics](#product-goals--success-metrics)
3. [Priority & Scope Validation](#priority--scope-validation)
4. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
5. [Implementation Phases](#implementation-phases)
6. [Product Trade-offs & Decisions](#product-trade-offs--decisions)
7. [User Experience Requirements](#user-experience-requirements)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [Testing Requirements](#testing-requirements)
10. [Documentation Requirements](#documentation-requirements)
11. [Release Strategy](#release-strategy)
12. [Open Questions & Risks](#open-questions--risks)
13. [Blockchain Expert Handoff](#blockchain-expert-handoff)

---

## Executive Summary

### Problem Statement

Our Bitcoin wallet currently has **critical privacy vulnerabilities** that expose users to:
- **Transaction graph analysis**: Change address reuse enables tracking all user transactions
- **Wallet fingerprinting**: Predictable UTXO selection patterns reveal wallet ownership
- **Address clustering**: Contacts feature encourages address reuse, linking transactions
- **Network surveillance**: API request patterns can expose wallet holdings to network observers

These issues violate Bitcoin privacy best practices and put user financial privacy at risk.

### Solution Overview

Implement **privacy-by-default** protections that automatically:
1. Generate unique change addresses for every transaction
2. Randomize UTXO selection to prevent fingerprinting
3. Auto-generate fresh receive addresses to discourage reuse
4. Warn users about contacts address reuse and enable xpub rotation

Add **optional Privacy Mode** settings for advanced users:
1. Round number randomization (prevents change detection)
2. API request timing delays (prevents network clustering)
3. Transaction broadcast delays (prevents timing correlation)

### Business Impact

**User Benefits:**
- Enhanced financial privacy without user effort (default protections)
- Informed decisions about privacy trade-offs (contacts warnings)
- Advanced privacy controls for power users (optional modes)

**Product Differentiation:**
- First Bitcoin browser wallet with privacy-by-default design
- Competitive advantage over MetaMask-style wallets that ignore privacy
- Aligns with Bitcoin community values and best practices

**Risk Mitigation:**
- Reduces legal/regulatory risk from enabling surveillance
- Protects users from financial profiling
- Demonstrates security-first product philosophy

---

## Product Goals & Success Metrics

### Primary Goals

1. **Eliminate Critical Privacy Leaks** (P0)
   - 100% of transactions use unique change addresses
   - 0% predictable UTXO selection patterns
   - Contacts feature provides clear privacy warnings

2. **Privacy-by-Default Architecture** (P0)
   - Users protected without configuration
   - No opt-in required for core privacy features
   - Seamless UX with no performance degradation

3. **User Privacy Education** (P1)
   - Users understand privacy trade-offs
   - Clear warnings when privacy is compromised
   - Accessible documentation for all users

### Success Metrics

**Technical Metrics:**
- **Change Address Reuse Rate**: 0% (currently 100%)
- **UTXO Selection Entropy**: >50% randomization (currently 0%)
- **Receive Address Reuse Rate**: <10% (currently ~80% estimated)
- **Contacts Privacy Warning Display**: 100% coverage

**User Behavior Metrics:**
- **Privacy Mode Adoption**: Track % users enabling optional features
- **Receive Address Generation**: Measure fresh address creation rate
- **Contacts Xpub Usage**: Track xpub contacts vs single-address contacts
- **User Feedback**: Survey privacy awareness post-implementation

**Quality Metrics:**
- **Zero Privacy Regressions**: Automated tests prevent reintroduction
- **Documentation Coverage**: 100% of privacy features documented
- **User Complaints**: <1% privacy-related support tickets

### Key Performance Indicators (KPIs)

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Transactions with unique change address | 0% | 100% | Blockchain analysis |
| UTXO selection randomization | 0% | 100% | Code behavior test |
| Users reusing receive addresses | High | <10% | Frontend analytics |
| Privacy Mode feature discovery | N/A | >25% | Settings page views |
| User-reported privacy issues | N/A | 0 | Support tickets |

---

## Priority & Scope Validation

### Priority Classification Review

I've reviewed the technical plan's priority classifications and **validate them as follows**:

#### P0 - CRITICAL (Must Have for MVP)

✅ **Change Address Reuse Fix**
- **Validation**: CONFIRMED P0
- **Rationale**: This is a catastrophic privacy leak. Every transaction reveals wallet structure and enables transaction graph analysis. Users cannot protect themselves.
- **Impact**: Affects 100% of transactions
- **User Risk**: High - Financial profiling, theft targeting, regulatory exposure
- **Timeline**: BLOCK ALL RELEASES until fixed

✅ **Contacts Address Reuse Warnings + Xpub Rotation**
- **Validation**: CONFIRMED P0
- **Rationale**: Contacts feature actively encourages address reuse, fundamentally breaking Bitcoin privacy. Users unknowingly expose transaction history.
- **Impact**: Affects all users using contacts (likely 30-50% based on similar wallets)
- **User Risk**: High - Links identity to transaction history
- **Timeline**: Must ship with contacts feature (already shipped - urgent fix)

#### P1 - HIGH (Should Have for MVP)

✅ **Randomized UTXO Selection**
- **Validation**: CONFIRMED P1
- **Rationale**: Prevents wallet fingerprinting and ownership clustering. While not as severe as change address reuse, it's still a significant privacy leak.
- **Impact**: Affects all transactions, but requires sophisticated adversary analysis
- **User Risk**: Medium - Wallet clustering, balance estimation
- **Timeline**: Include in privacy release (high priority)

#### P2 - MEDIUM (Nice to Have)

⚠️ **Auto-Generate Receive Addresses** - **UPGRADE TO P1**
- **Original**: P2 - MEDIUM
- **Revised**: P1 - HIGH
- **Rationale**: While users *can* manually generate addresses, the current UX actively encourages reuse by showing the same address repeatedly. This is a UX-driven privacy leak.
- **Impact**: Likely 80%+ of users reuse receive addresses due to UX design
- **User Risk**: Medium-High - Address reuse is well-known privacy issue
- **Product Decision**: We are responsible for guiding users to privacy best practices through UX design, not just providing the capability.
- **Timeline**: Include in privacy release

#### Optional Features (Phase 3)

✅ **Round Number Randomization, API Timing, Broadcast Delays**
- **Validation**: CONFIRMED as Optional
- **Rationale**: These are advanced privacy techniques that trade convenience for marginal privacy gains. Power users benefit, casual users may be confused.
- **Impact**: Niche use cases, sophisticated threat models
- **User Risk**: Low - Most users don't face these threats
- **Product Decision**: Keep optional with clear UX explaining trade-offs

### Revised Priority Summary

| Feature | Original Priority | Final Priority | Rationale |
|---------|------------------|----------------|-----------|
| Change address reuse fix | P0 | **P0** | Critical privacy leak |
| Contacts warnings + xpub rotation | P0 | **P0** | Active privacy harm |
| Randomized UTXO selection | P1 | **P1** | Prevents fingerprinting |
| Auto-generate receive addresses | P2 | **P1** ⬆️ | UX-driven privacy leak |
| Round number randomization | Optional | **Optional** | Advanced use case |
| API timing delays | Optional | **Optional** | Advanced use case |
| Broadcast delays | Optional | **Optional** | Advanced use case |

### Scope Boundaries

**IN SCOPE (This Release):**
- All P0 and P1 features (4 features)
- Optional Privacy Mode settings (3 toggles)
- Privacy documentation and user education
- Expert privacy audit (Phase 1)

**OUT OF SCOPE (Future Releases):**
- CoinJoin / PayJoin (requires coordinator, complex UX)
- Lightning Network privacy (separate feature)
- Tor integration (browser-level, not wallet)
- Full node support (resource intensive)
- Multi-wallet privacy isolation (Phase 2 feature)

**EXPLICITLY EXCLUDED:**
- Automatic Tor proxy (user must configure browser)
- Privacy coins integration (Bitcoin-only wallet)
- On-chain privacy coin swaps (regulatory risk)

---

## User Stories & Acceptance Criteria

### Phase 1: Privacy Audit & Expert Review

#### Story 1.1: Privacy Audit Report
**As a** product manager
**I want** a comprehensive privacy audit from blockchain and security experts
**So that** we understand all privacy vulnerabilities and can prioritize fixes

**Acceptance Criteria:**
- [ ] Blockchain Expert completes transaction privacy audit
  - [ ] UTXO selection analysis with entropy measurements
  - [ ] Change address implementation audit
  - [ ] Transaction graph exposure assessment
  - [ ] Contacts feature privacy impact analysis
- [ ] Security Expert completes network privacy audit
  - [ ] Blockstream API privacy review (IP exposure, clustering risks)
  - [ ] Transaction broadcasting privacy assessment
  - [ ] Wallet fingerprinting vector identification
  - [ ] Contacts storage privacy review
- [ ] Backend Developer documents current implementation
  - [ ] Maps all address-linking API calls
  - [ ] Documents change address reuse code path
  - [ ] Analyzes contacts address reuse patterns
  - [ ] Identifies all privacy leak vectors
- [ ] Privacy Audit Report created at `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md`
  - [ ] Severity classification for each issue (Critical/High/Medium/Low)
  - [ ] Comparison against Bitcoin Privacy Wiki best practices
  - [ ] Prioritized remediation roadmap
  - [ ] Quantitative privacy metrics (entropy, reuse rates)

**Definition of Done:**
- All three experts complete their audits
- Report document published and reviewed by product manager
- Issues triaged and assigned severity/priority
- Findings inform Phase 2 implementation

---

### Phase 2: Default Privacy Improvements

#### Story 2.1: Unique Change Addresses (P0 - CRITICAL)

**As a** Bitcoin wallet user
**I want** my change from transactions to go to a new address every time
**So that** my transaction history cannot be linked and analyzed

**Acceptance Criteria:**

**Backend Implementation:**
- [ ] `src/background/index.ts` modified:
  - [ ] Remove hardcoded change address reuse at line 1766 (`account.addresses[0].address`)
  - [ ] Create helper function: `getOrGenerateChangeAddress(accountIndex: number): Promise<string>`
  - [ ] Function uses internal chain: `handleGenerateAddress({ accountIndex, isChange: true })`
  - [ ] Change address generated for EVERY transaction automatically
  - [ ] `internalIndex` increments after each transaction
- [ ] Multisig support:
  - [ ] Same fix applied to multisig transaction builder (line 2147)
  - [ ] Multisig change addresses use internal chain
  - [ ] BIP48 derivation path compliance maintained
- [ ] Storage updates:
  - [ ] `internalIndex` persisted after transaction broadcast
  - [ ] Wallet state saved atomically with transaction

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] `getOrGenerateChangeAddress()` returns unique address each call
  - [ ] `internalIndex` increments correctly
  - [ ] Function works for all account types (single-sig, multisig, all address types)
- [ ] Integration tests:
  - [ ] Send 3 transactions, verify 3 different change addresses
  - [ ] Verify change addresses are on internal chain (derivation path `m/.../1/index`)
  - [ ] Verify no address reuse across 100+ transactions
- [ ] Testnet validation:
  - [ ] Send real transactions and verify unique change addresses on blockchain
  - [ ] Verify change addresses never appear in receive address list
  - [ ] Test with insufficient funds (no change) - ensure no errors

**Privacy Validation:**
- [ ] Blockchain analysis confirms:
  - [ ] 0% change address reuse across test transactions
  - [ ] Change addresses use internal chain (index 1)
  - [ ] No overlap between receive and change addresses
- [ ] Transaction graph analysis cannot link transactions via change addresses

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Blockchain Expert and Security Expert
- Tests passing with 100% coverage
- Testnet validation complete
- No change address reuse in any scenario

---

#### Story 2.2: Randomized UTXO Selection (P1 - HIGH)

**As a** Bitcoin wallet user
**I want** my wallet to select UTXOs randomly rather than predictably
**So that** observers cannot fingerprint my wallet or estimate my balance

**Acceptance Criteria:**

**Backend Implementation:**
- [ ] `src/background/bitcoin/TransactionBuilder.ts` modified:
  - [ ] Replace greedy selection (line 289: `sort((a, b) => b.value - a.value)`)
  - [ ] Implement randomized selection algorithm:
    - [ ] Shuffle eligible UTXOs using Fisher-Yates algorithm
    - [ ] Select UTXOs in randomized order until target met
    - [ ] Still respect dust limits (546 sats)
    - [ ] Still respect fee requirements
    - [ ] Still prevent uneconomical change outputs
  - [ ] Keep greedy as fallback ONLY if randomized fails (edge case)
  - [ ] Add selection metadata for testing: `selectionAlgorithm: 'random' | 'greedy'`

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] UTXO selection is non-deterministic (run 100x, verify different results)
  - [ ] Selection still meets target amount
  - [ ] Dust limit respected (no UTXOs < 546 sats selected if avoidable)
  - [ ] Fee calculation correct with random selection
  - [ ] Change output creation works correctly
- [ ] Entropy tests:
  - [ ] Measure selection entropy: H(selection) > 50% of maximum
  - [ ] Verify distribution is approximately uniform across 1000 selections
  - [ ] Confirm no bias toward large or small UTXOs
- [ ] Edge case tests:
  - [ ] Insufficient funds still returns correct error
  - [ ] Single UTXO selection (no randomization needed)
  - [ ] Exact match scenario (no change)
  - [ ] Multiple UTXOs with same value (selection still random)

**Privacy Validation:**
- [ ] Statistical analysis confirms:
  - [ ] UTXO selection patterns are non-deterministic
  - [ ] No consistent largest-first or smallest-first bias
  - [ ] Selection entropy >50% (measured over 1000 transactions)
- [ ] Wallet fingerprinting analysis:
  - [ ] Cannot identify wallet by UTXO selection strategy
  - [ ] Selection patterns do not reveal balance information

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Blockchain Expert
- Tests passing with entropy validation
- No performance degradation vs. greedy selection
- Fallback to greedy documented for edge cases

---

#### Story 2.3: Auto-Generate Fresh Receive Addresses (P1 - HIGH)

**As a** Bitcoin wallet user
**I want** a new receive address automatically generated each time I view the receive screen
**So that** I'm encouraged to use a fresh address for each transaction (privacy best practice)

**Acceptance Criteria:**

**Frontend Implementation:**
- [ ] `src/tab/components/ReceiveScreen.tsx` modified:
  - [ ] `useEffect` hook on component mount triggers address generation
  - [ ] Call `chrome.runtime.sendMessage({ type: 'GENERATE_ADDRESS', ... })`
  - [ ] Show banner: "✓ New address generated for privacy"
  - [ ] Banner auto-dismisses after 3 seconds
  - [ ] If address generation fails, show error and use existing address

**Address List UI:**
- [ ] `src/tab/components/Dashboard.tsx` (or ReceiveScreen) shows address list:
  - [ ] Display all external addresses for current account
  - [ ] Mark used addresses with warning icon: "⚠️ Previously Used"
  - [ ] Tooltip on warning: "Bitcoin best practice: Use new address per transaction"
  - [ ] Most recent address highlighted as "Current"
  - [ ] Used addresses styled with reduced opacity
  - [ ] Click to copy any address (with privacy warning for used ones)

**Backend Support:**
- [ ] Existing `GENERATE_ADDRESS` handler supports auto-generation
- [ ] Addresses marked as `used: true` when they receive funds (existing functionality)
- [ ] Address list returned includes `used` field

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] ReceiveScreen calls GENERATE_ADDRESS on mount
  - [ ] Banner displays after successful generation
  - [ ] Error handling when generation fails
- [ ] Integration tests:
  - [ ] Open ReceiveScreen 5 times, verify 5 different addresses generated
  - [ ] Verify addresses increment correctly (externalIndex)
  - [ ] Used addresses marked correctly in UI
- [ ] UX tests:
  - [ ] Banner is visible and informative
  - [ ] Warning icon displays on used addresses
  - [ ] Tooltip provides privacy context

**Privacy Validation:**
- [ ] User testing confirms:
  - [ ] Users understand why new address is generated
  - [ ] Users aware of privacy benefits
  - [ ] Users can still access old addresses if needed
- [ ] Analytics tracking:
  - [ ] Measure address reuse rate before and after feature
  - [ ] Target: <10% address reuse rate

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Frontend Developer and UI/UX Designer
- Tests passing
- UX validated with user testing
- Address reuse rate measurably reduced

---

#### Story 2.4: Contacts Privacy Warnings & Xpub Rotation (P0 - CRITICAL)

**As a** Bitcoin wallet user
**I want** to be warned when sending to a contact reuses addresses
**And** I want xpub contacts to automatically rotate addresses
**So that** I can make informed privacy decisions when using contacts

**Acceptance Criteria:**

**Type System Updates:**
- [ ] `src/shared/types/index.ts` modified:
  - [ ] Add `lastUsedAddressIndex?: number` to `Contact` interface
  - [ ] Add `reusageCount?: number` to track sends to same address
  - [ ] Backwards compatible with existing contacts

**Xpub Contact Address Rotation:**
- [ ] `src/background/wallet/ContactsStorage.ts` (or handler) implements rotation:
  - [ ] When sending to xpub contact, suggest NEXT unused cached address
  - [ ] Increment `lastUsedAddressIndex` after suggestion
  - [ ] Show in UI: "Sending to Alice's address #5 (privacy: rotating addresses)"
  - [ ] Allow user to manually select different cached address
  - [ ] Warn if user selects previously used address
  - [ ] Update contact storage with new `lastUsedAddressIndex`

**Single-Address Contact Warnings:**
- [ ] `src/tab/components/shared/ContactCard.tsx` shows privacy badge:
  - [ ] If `reusageCount > 0`: Display "⚠️ Reuses Address" badge
  - [ ] If xpub contact: Display "✓ Address Rotation" badge
  - [ ] Tooltip explains privacy implications
  - [ ] Visual differentiation (yellow warning, green checkmark)
- [ ] `src/tab/components/SendScreen.tsx` shows warning when selecting contact:
  - [ ] For single-address contact: "⚠️ Privacy Warning: Sending to a reused address"
  - [ ] Display counter: "Sent 5 times to this address (privacy risk)"
  - [ ] Suggest: "Upgrade to xpub contact for automatic address rotation"
  - [ ] Show "Continue Anyway" and "Learn More" buttons
  - [ ] "Learn More" links to privacy documentation

**Transaction History Contact Matching Fix:**
- [ ] `src/tab/components/shared/TransactionRow.tsx` updated:
  - [ ] Check `contact.cachedAddresses` array (not just `contact.address`)
  - [ ] Xpub contacts match ANY cached address
  - [ ] Show contact name with privacy indicator:
    - [ ] Single-address: "Alice ⚠️"
    - [ ] Xpub: "Alice ✓"
  - [ ] Tooltip shows which cached address was used

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] Xpub contact rotation increments `lastUsedAddressIndex`
  - [ ] Single-address contacts show reusage count
  - [ ] Contact matching works for all cached addresses
- [ ] Integration tests:
  - [ ] Send to xpub contact 10 times, verify 10 different addresses used
  - [ ] Verify `lastUsedAddressIndex` persists correctly
  - [ ] Send to single-address contact 3 times, verify counter = 3
  - [ ] Transaction history shows correct contact matches
- [ ] UX tests:
  - [ ] Warning messages are clear and actionable
  - [ ] Privacy badges display correctly
  - [ ] Users understand privacy implications

**Privacy Validation:**
- [ ] User testing confirms:
  - [ ] Users understand address reuse risks
  - [ ] Users prefer xpub contacts when available
  - [ ] Warnings do not block workflow (inform, don't prevent)
- [ ] Analytics tracking:
  - [ ] % of contacts that are xpub vs single-address
  - [ ] Average reusage count for single-address contacts
  - [ ] % of users who heed warnings and switch to xpub

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Blockchain Expert, Security Expert, Frontend Developer
- Tests passing
- User testing validates UX
- Privacy warnings informative but not obstructive

---

### Phase 3: Optional Privacy Mode Settings

#### Story 3.1: Privacy Mode Settings UI

**As a** privacy-conscious user
**I want** optional privacy features I can enable
**So that** I can customize my privacy/convenience trade-off

**Acceptance Criteria:**

**Type System Updates:**
- [ ] `src/shared/types/index.ts` defines:
  ```typescript
  export interface PrivacySettings {
    randomizeRoundAmounts: boolean;
    randomizeApiTiming: boolean;
    delayBroadcast: boolean;
  }
  ```
- [ ] Added to `WalletSettings` interface

**Settings Screen UI:**
- [ ] `src/tab/components/SettingsScreen.tsx` adds Privacy Mode section:
  - [ ] Collapsible section: "Privacy Mode"
  - [ ] Three toggle switches:
    1. **Randomize Round Amounts**
       - Label: "Randomize Round Amounts"
       - Description: "Add ±0.1% to round numbers (0.1 BTC → 0.10023 BTC) to prevent change address detection"
       - Default: OFF
    2. **Randomize API Timing**
       - Label: "Randomize API Request Timing"
       - Description: "Add 1-5s delays between blockchain queries to prevent timing-based address clustering. Trade-off: Slower balance updates."
       - Default: OFF
    3. **Delay Broadcast**
       - Label: "Delay Transaction Broadcast"
       - Description: "Wait 5-30s before broadcasting transactions to prevent timing correlation. Trade-off: Slower transaction sending."
       - Default: OFF
  - [ ] Privacy Tips section:
    - [ ] "Default protections always active (change addresses, UTXO randomization)"
    - [ ] "Use Tor browser for maximum network privacy"
    - [ ] "Avoid sending round amounts"
    - [ ] "Use new address for each transaction"
  - [ ] "Learn More About Bitcoin Privacy" link to documentation

**Storage Implementation:**
- [ ] `src/background/wallet/WalletStorage.ts` stores privacy settings
- [ ] Settings persist across sessions
- [ ] Default values: all false

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] Toggle switches update settings correctly
  - [ ] Settings persist after reload
  - [ ] Default values correct for new wallets
- [ ] UI tests:
  - [ ] All descriptions display correctly
  - [ ] Links work
  - [ ] Toggles are accessible (keyboard, screen reader)

**Definition of Done:**
- All acceptance criteria met
- UI/UX reviewed by Designer
- Accessibility validated
- Settings persist correctly

---

#### Story 3.2: Round Number Randomization (Optional)

**As a** privacy-conscious user
**I want** to automatically randomize round transaction amounts
**So that** change detection analysis is harder

**Acceptance Criteria:**

**Utility Implementation:**
- [ ] Create `src/shared/utils/privacy.ts`:
  - [ ] `detectRoundNumber(amount: number): boolean`
    - Detects: 0.1, 0.5, 1.0, 10.0, 100.0 BTC (and multiples)
    - Threshold: Number ends in 0 or 5 with trailing zeros
  - [ ] `randomizeAmount(amount: number, variance: number = 0.001): number`
    - Adds random satoshis: ±0.1% of amount
    - Returns: Original amount + random(-variance * amount, +variance * amount)
    - Precision: Satoshi-level (8 decimals)

**Frontend Integration:**
- [ ] `src/tab/components/SendScreen.tsx` applies randomization:
  - [ ] Check if `settings.privacy.randomizeRoundAmounts === true`
  - [ ] If true and `detectRoundNumber(amount)`:
    - [ ] Display tooltip: "Amount randomized for privacy (+0.1%)"
    - [ ] Show both original and randomized amounts
    - [ ] User can toggle "Use exact amount" to disable
  - [ ] Otherwise: Use exact amount

**Backend Integration:**
- [ ] `src/background/index.ts` (SEND_TRANSACTION handler):
  - [ ] Check privacy setting
  - [ ] Apply randomization if enabled and amount is round
  - [ ] Log randomization in transaction metadata

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] `detectRoundNumber()` correctly identifies round amounts
  - [ ] `randomizeAmount()` adds variance within ±0.1%
  - [ ] Randomized amounts are never exactly round
- [ ] Integration tests:
  - [ ] Sending 0.1 BTC with setting enabled → amount is randomized
  - [ ] Sending 0.1234 BTC → not randomized (not round)
  - [ ] User can override and use exact amount
- [ ] Privacy tests:
  - [ ] Randomized amounts have sufficient entropy
  - [ ] Multiple randomizations produce different results

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Blockchain Expert
- Tests passing
- UX validated (tooltip clear)

---

#### Story 3.3: API Request Timing Randomization (Optional)

**As a** privacy-conscious user
**I want** blockchain API requests to be randomized in timing
**So that** network observers cannot cluster my addresses by request patterns

**Acceptance Criteria:**

**API Client Implementation:**
- [ ] `src/background/api/BlockstreamClient.ts` modified:
  - [ ] Add `privacyMode: boolean` parameter to constructor/methods
  - [ ] Implement `delayBetweenRequests(min: number, max: number): Promise<void>`
    - Random delay between 1000-5000ms
    - Uses `setTimeout` in Promise
  - [ ] When `privacyMode === true`:
    - [ ] Add random delay before EACH API request
    - [ ] Randomize order of address queries (shuffle array)
    - [ ] Batch requests with delays between batches (every 5 addresses)
  - [ ] When `privacyMode === false`:
    - [ ] No delays (current behavior)

**Background Integration:**
- [ ] `src/background/index.ts` passes privacy setting to API client
- [ ] Respects `settings.privacy.randomizeApiTiming`
- [ ] Applied to: balance checks, UTXO queries, transaction history

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] `delayBetweenRequests()` delays within expected range
  - [ ] Privacy mode adds delays, normal mode doesn't
  - [ ] Request order randomization works
- [ ] Integration tests:
  - [ ] Measure time difference: 10 addresses with privacy ON vs OFF
  - [ ] Verify privacy mode adds 10-50 seconds total delay
  - [ ] Verify results are identical (timing doesn't affect data)
- [ ] Performance tests:
  - [ ] Measure impact on balance refresh time
  - [ ] Ensure delays don't cause timeout errors

**User Experience:**
- [ ] Settings description warns: "Trade-off: Balance updates 5-20 seconds slower"
- [ ] Loading indicators remain responsive during delays
- [ ] User can cancel/refresh manually

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Backend Developer and Security Expert
- Tests passing
- Performance impact documented

---

#### Story 3.4: Transaction Broadcast Delay (Optional)

**As a** privacy-conscious user
**I want** transaction broadcasts to be delayed randomly
**So that** timing correlation attacks are prevented

**Acceptance Criteria:**

**API Client Implementation:**
- [ ] `src/background/api/BlockstreamClient.ts` modified:
  - [ ] Add broadcast delay method: `delayedBroadcast(txHex: string, delay: number): Promise<string>`
  - [ ] Random delay: 5-30 seconds
  - [ ] Returns transaction ID after delay + broadcast
  - [ ] Can be cancelled (via AbortController)

**Backend Integration:**
- [ ] `src/background/index.ts` (SEND_TRANSACTION handler):
  - [ ] Check `settings.privacy.delayBroadcast`
  - [ ] If enabled: Use `delayedBroadcast()` instead of immediate broadcast
  - [ ] Return delay duration to frontend for countdown UI

**Frontend Integration:**
- [ ] `src/tab/components/SendScreen.tsx` shows countdown UI:
  - [ ] After user confirms send, show modal: "Broadcasting in 12 seconds..."
  - [ ] Countdown timer updates every second
  - [ ] "Broadcast Now" button to skip delay
  - [ ] "Cancel" button to abort transaction
  - [ ] After broadcast: Show success message

**Testing Requirements:**
- [ ] Unit tests:
  - [ ] Delay is within 5-30 second range
  - [ ] Broadcast occurs after delay
  - [ ] Cancel works correctly (transaction not broadcast)
- [ ] Integration tests:
  - [ ] Full flow: Send transaction with delay enabled
  - [ ] Countdown UI displays correctly
  - [ ] "Broadcast Now" skips delay
  - [ ] "Cancel" prevents broadcast
- [ ] Edge case tests:
  - [ ] Network error during delay (retry logic)
  - [ ] User closes popup during delay (transaction still broadcasts)
  - [ ] Multiple transactions queued (delays are independent)

**User Experience:**
- [ ] Countdown is clear and not alarming
- [ ] User understands why delay exists (privacy)
- [ ] Option to skip delay is prominent
- [ ] Transaction still broadcasts if popup closes

**Definition of Done:**
- All acceptance criteria met
- Code reviewed by Backend Developer and Frontend Developer
- Tests passing
- UX validated (countdown not confusing)

---

### Phase 4: Documentation & User Education

#### Story 4.1: Privacy Documentation

**As a** Bitcoin wallet user
**I want** comprehensive privacy documentation
**So that** I understand how to protect my financial privacy

**Acceptance Criteria:**

**Create `PRIVACY_GUIDE.md`:**
- [ ] Bitcoin Privacy Principles section:
  - [ ] Explain address reuse risks
  - [ ] Explain change address detection
  - [ ] Explain wallet fingerprinting
  - [ ] Explain network surveillance
  - [ ] Link to Bitcoin Privacy Wiki
- [ ] Default Privacy Protections section:
  - [ ] Unique change addresses (explain how it works)
  - [ ] Randomized UTXO selection (explain benefits)
  - [ ] Fresh receive addresses (explain encouragement)
  - [ ] Contacts warnings (explain trade-offs)
- [ ] Optional Privacy Mode section:
  - [ ] Round number randomization (explain when to use)
  - [ ] API timing delays (explain network privacy)
  - [ ] Broadcast delays (explain timing correlation)
  - [ ] Trade-offs clearly documented
- [ ] Tor Setup Instructions section:
  - [ ] How to install Tor Browser
  - [ ] How to use wallet with Tor
  - [ ] Benefits and limitations
  - [ ] Step-by-step screenshots
- [ ] Contacts Privacy Guidance section:
  - [ ] Xpub contacts vs single-address contacts
  - [ ] How to get someone's xpub
  - [ ] When to use which type
  - [ ] Privacy implications clearly explained
- [ ] Best Practices section:
  - [ ] Never reuse addresses
  - [ ] Use xpub contacts when possible
  - [ ] Avoid sending round amounts
  - [ ] Use Tor for network privacy
  - [ ] Consider coin control (future feature)

**Update Existing Documentation:**
- [ ] `prompts/docs/plans/ARCHITECTURE.md`:
  - [ ] Add "Privacy Architecture" section
  - [ ] Document privacy-by-default design
  - [ ] Explain each privacy feature technically
- [ ] `CLAUDE.md`:
  - [ ] Reference privacy documentation
  - [ ] Add privacy to developer guidelines
- [ ] `README.md`:
  - [ ] Add "Privacy" section
  - [ ] Highlight privacy-first approach
  - [ ] Link to PRIVACY_GUIDE.md

**Testing Requirements:**
- [ ] Documentation review:
  - [ ] Technical accuracy (reviewed by Blockchain Expert)
  - [ ] User comprehension (user testing)
  - [ ] Accessibility (plain language, screenshots)
- [ ] User testing:
  - [ ] 5 users read documentation and answer comprehension questions
  - [ ] 80% correct answers on privacy concepts
  - [ ] Feedback incorporated

**Definition of Done:**
- All acceptance criteria met
- Documentation reviewed by all experts
- User testing validates comprehension
- Documentation published and linked from app

---

#### Story 4.2: In-App Privacy Education

**As a** Bitcoin wallet user
**I want** privacy tips and explanations within the app
**So that** I learn privacy best practices while using the wallet

**Acceptance Criteria:**

**Receive Screen Tips:**
- [ ] Banner on ReceiveScreen: "✓ New address generated for privacy"
  - [ ] Displays for 3 seconds after generation
  - [ ] Tooltip: "Using a fresh address for each transaction protects your privacy"
- [ ] Used address warning: "⚠️ Previously Used"
  - [ ] Tooltip: "Bitcoin best practice: Use new address per transaction. Learn More"
  - [ ] "Learn More" links to privacy documentation

**Send Screen Tips:**
- [ ] During transaction building: "✓ Using unique change address for privacy"
  - [ ] Displays briefly in transaction preview
  - [ ] Tooltip: "Your change goes to a fresh address, preventing transaction linking"

**Contacts Screen Warnings:**
- [ ] Single-address contact card: "⚠️ Reuses Address"
  - [ ] Tooltip: "Address reuse reduces privacy. Consider upgrading to xpub contact for automatic address rotation. Learn More"
  - [ ] "Learn More" links to contacts privacy section
- [ ] Xpub contact card: "✓ Address Rotation"
  - [ ] Tooltip: "This contact uses address rotation for enhanced privacy"

**Settings Screen Education:**
- [ ] Privacy Mode section header:
  - [ ] "Privacy Mode (Advanced Features)"
  - [ ] Subtitle: "Additional privacy options with trade-offs"
- [ ] "Learn More About Bitcoin Privacy" link:
  - [ ] Links to full privacy documentation
  - [ ] Opens in new tab

**First-Time User Flow:**
- [ ] After wallet creation/import, show privacy tips modal:
  - [ ] "Your wallet uses privacy-by-default protections"
  - [ ] Highlight key features (change addresses, UTXO randomization, fresh addresses)
  - [ ] "Learn More" button to documentation
  - [ ] "Got it" button to dismiss
  - [ ] Only show once (stored in settings: `privacyTipsShown: boolean`)

**Testing Requirements:**
- [ ] UI tests:
  - [ ] All tips display correctly
  - [ ] Tooltips are informative and concise
  - [ ] Links work correctly
- [ ] User testing:
  - [ ] Users notice and read privacy tips
  - [ ] Users understand privacy concepts from tips
  - [ ] Tips are helpful, not annoying
- [ ] Accessibility tests:
  - [ ] Screen reader announces tips
  - [ ] Keyboard navigation works
  - [ ] Color contrast meets WCAG AA

**Definition of Done:**
- All acceptance criteria met
- UI/UX reviewed by Designer
- User testing validates effectiveness
- Accessibility validated

---

## Implementation Phases

### Phase 1: Privacy Audit & Expert Review (Week 1)
**Duration:** 3-5 days
**Deliverables:**
- Privacy Audit Report (`PRIVACY_AUDIT_REPORT.md`)
- Issue severity classifications
- Baseline privacy metrics

**Critical Path:**
1. Blockchain Expert audit (2 days)
2. Security Expert audit (2 days)
3. Backend Developer documentation (1 day)
4. Report compilation and review (1 day)

**Success Criteria:**
- All experts complete audits
- Report approved by Product Manager
- Issues triaged and prioritized
- Findings validate technical plan

---

### Phase 2: Default Privacy Improvements (Week 2-4)
**Duration:** 7-10 days
**Deliverables:**
- Change address reuse fix (single-sig + multisig)
- Randomized UTXO selection
- Auto-generate receive addresses
- Contacts privacy warnings and xpub rotation

**Critical Path:**
1. Change address fix (2 days) - **BLOCKING** all other work
2. UTXO randomization (1 day)
3. Receive address auto-generation (1 day)
4. Contacts warnings + xpub rotation (3-4 days)
5. Testing and validation (2-3 days)

**Success Criteria:**
- All P0 and P1 features implemented
- Tests passing with 100% coverage
- Testnet validation complete
- Privacy metrics meet targets (0% change reuse, >50% UTXO entropy)

---

### Phase 3: Optional Privacy Mode Settings (Week 5-6)
**Duration:** 5-7 days
**Deliverables:**
- Privacy settings UI
- Round number randomization
- API timing delays
- Broadcast delays

**Critical Path:**
1. Settings UI (1 day)
2. Round number randomization (1 day)
3. API timing delays (2 days)
4. Broadcast delays (1-2 days)
5. Testing and UX validation (1 day)

**Success Criteria:**
- All optional features implemented
- Settings UI clear and accessible
- Trade-offs clearly communicated
- Tests passing

---

### Phase 4: Documentation & User Education (Week 7)
**Duration:** 3-5 days
**Deliverables:**
- PRIVACY_GUIDE.md
- Updated ARCHITECTURE.md, CLAUDE.md, README.md
- In-app privacy tips and warnings

**Critical Path:**
1. Privacy guide writing (2 days)
2. Documentation updates (1 day)
3. In-app tips implementation (1 day)
4. User testing and revisions (1 day)

**Success Criteria:**
- Documentation complete and accurate
- User testing validates comprehension (80% pass rate)
- In-app tips display correctly
- All documentation linked and accessible

---

## Product Trade-offs & Decisions

### Decision 1: Privacy-by-Default vs. Opt-In

**Question:** Should privacy features be enabled by default or opt-in?

**Decision:** **Privacy-by-default** for all P0/P1 features
- Change addresses: Always enabled
- UTXO randomization: Always enabled
- Fresh receive addresses: Always enabled
- Contacts warnings: Always shown

**Rationale:**
- Users cannot protect privacy they don't know they've lost
- Opt-in privacy favors the 5% who care, harms the 95% who don't know
- Bitcoin community best practices are privacy-by-default
- No performance penalty for default protections
- Aligns with "secure by default" product philosophy

**Trade-offs:**
- None - default privacy features have no UX/performance cost

---

### Decision 2: Contacts Address Reuse - Warning vs. Prevention

**Question:** Should we prevent users from sending to reused addresses or just warn them?

**Decision:** **Warn, don't prevent** (but make xpub rotation automatic)

**Rationale:**
- Users may have valid reasons to send to same address (e.g., merchant)
- Preventing use cases reduces product utility
- Warning empowers user choice while educating about risk
- Automatic xpub rotation provides privacy without user effort
- We can measure and improve based on user behavior

**Trade-offs:**
- Some users will ignore warnings and harm privacy
- BUT: Blocking valid use cases harms adoption
- MITIGATION: Make xpub contacts the default/easy path

---

### Decision 3: Optional Privacy Mode Features - Defaults

**Question:** Should optional privacy modes be enabled by default?

**Decision:** **All disabled by default** (opt-in)

**Rationale:**
- These features have real UX/performance trade-offs
- Round number randomization: Users may want exact amounts
- API timing delays: 5-20 second balance refresh delays
- Broadcast delays: 5-30 second transaction delays
- Most users don't face sophisticated network-level threats
- Power users can opt-in based on threat model

**Trade-offs:**
- Users won't get maximum privacy by default
- MITIGATION: Clear UI explaining benefits and costs
- MITIGATION: Settings discoverability (onboarding tip)

---

### Decision 4: Receive Address Auto-Generation Frequency

**Question:** When should fresh receive addresses be generated?

**Decision:** **On ReceiveScreen mount** (every time user views receive screen)

**Alternative Considered:** Generate only after previous address received funds

**Rationale:**
- User viewing receive screen signals intent to receive
- Pre-generating address ensures it's ready immediately
- QR code generation requires address at mount time
- No cost to generating extra addresses (HD wallet)
- Encourages best practice (fresh address per transaction)

**Trade-offs:**
- May generate unused addresses (gap limit concern)
- MITIGATION: Standard BIP44 gap limit is 20 (we're well under this)
- MITIGATION: Unused addresses don't harm privacy

---

### Decision 5: Privacy Audit Before or After Implementation?

**Question:** Should we audit current implementation first or implement fixes then audit?

**Decision:** **Audit first (Phase 1), then implement (Phase 2)**

**Rationale:**
- Audit may reveal issues not in technical plan
- Expert review validates priorities and approach
- Baseline metrics help measure improvement
- Safer to understand problem fully before fixing
- Audit findings inform implementation details

**Trade-offs:**
- Delays fixing critical issues by ~1 week
- MITIGATION: Audit is only 3-5 days
- MITIGATION: Fixes are more thorough and correct

---

## User Experience Requirements

### UX Principle: Privacy Without Friction

**Goal:** Protect user privacy without adding complexity or steps

**Implementation:**
- Default protections are invisible (happen automatically)
- Warnings are informative but not blocking
- Optional features are clearly explained with trade-offs
- Privacy tips are educational, not nagging

### UX Requirement: Progressive Disclosure

**Novice Users:**
- See simple privacy tips ("✓ Using fresh address for privacy")
- No configuration required
- Minimal jargon

**Intermediate Users:**
- Understand warnings ("⚠️ This contact reuses addresses")
- Can make informed choices
- Access privacy documentation

**Advanced Users:**
- Enable optional privacy modes
- Understand trade-offs (convenience vs. privacy)
- Access detailed privacy guide and technical docs

### UX Requirement: Clear Communication of Trade-offs

**Every optional feature must communicate:**
1. **Benefit:** What privacy protection does this provide?
2. **Cost:** What is the trade-off (time, convenience, UX)?
3. **Recommendation:** When should I enable this?

**Example (Broadcast Delay):**
- **Benefit:** "Prevents timing correlation attacks"
- **Cost:** "Transactions take 5-30 seconds longer to send"
- **Recommendation:** "Enable if you're concerned about network-level surveillance"

### UX Requirement: No Privacy Shaming

**Avoid:**
- ❌ "You're doing it wrong"
- ❌ "Your privacy is at risk" (alarmist)
- ❌ Blocking user actions without explanation

**Instead:**
- ✅ "Bitcoin best practice: Use new address per transaction"
- ✅ "This helps protect your financial privacy"
- ✅ Inform and educate, let user decide

---

## Edge Cases & Error Handling

### Edge Case 1: Insufficient Internal Addresses for Change

**Scenario:** User sends many transactions rapidly, exhausting pre-generated internal addresses

**Expected Behavior:**
- Generate change address on-demand during transaction building
- Increase internal address buffer (generate in batches of 5 instead of 1)
- Log warning if generation fails
- Graceful error message: "Unable to generate change address. Please try again."

**Prevention:**
- Backend maintains buffer of 5 unused internal addresses
- Regenerate buffer after each transaction

---

### Edge Case 2: UTXO Randomization with Insufficient Funds

**Scenario:** Wallet has exactly enough UTXOs to cover transaction, but randomization might miss optimal selection

**Expected Behavior:**
- Randomized selection attempts multiple iterations (up to 10)
- If all attempts fail, fallback to greedy selection
- Log fallback for analytics: `selectionAlgorithm: 'greedy-fallback'`
- Transaction still succeeds

**Prevention:**
- Randomization algorithm prioritizes reaching target over pure randomness
- Greedy fallback documented in code comments

---

### Edge Case 3: Contacts Xpub with Exhausted Cache

**Scenario:** User has sent to all 20-100 cached addresses for xpub contact

**Expected Behavior:**
- Regenerate next batch of cached addresses (20 more)
- Update `cachedAddresses` array in contact storage
- Continue rotation with new addresses
- Log cache refresh for analytics

**Prevention:**
- When `lastUsedAddressIndex` reaches 80% of cache size, regenerate
- Cache size configurable (default 100 addresses)

---

### Edge Case 4: Privacy Mode Broadcast Delay + Popup Close

**Scenario:** User enables broadcast delay, sends transaction, then closes popup during countdown

**Expected Behavior:**
- Transaction broadcasts in background after delay completes
- Background service worker handles broadcast even if popup closed
- User sees confirmation on next popup open
- Transaction added to pending list immediately (not after delay)

**Prevention:**
- Background worker owns broadcast logic
- Popup only displays countdown UI
- Transaction state persists across popup sessions

---

### Edge Case 5: API Timing Delays + User Impatience

**Scenario:** User enables API timing delays, then repeatedly refreshes balance during delay period

**Expected Behavior:**
- Abort previous delayed request when new refresh initiated
- Show loading state clearly: "Refreshing balance with privacy mode (5s delay)"
- Allow user to disable privacy mode mid-request
- Provide "Refresh Now" override button

**Prevention:**
- Use AbortController for cancellable delayed requests
- Clear messaging about delays in UI
- Manual override option always available

---

### Edge Case 6: Change Address Generation Failure

**Scenario:** Change address generation fails due to encryption error or storage corruption

**Expected Behavior:**
- Catch error before building transaction
- Show user-friendly error: "Unable to prepare transaction. Please unlock wallet and try again."
- Log detailed error for debugging
- Do NOT send transaction with reused change address as fallback
- Graceful degradation: Suggest user restart extension

**Prevention:**
- Validate change address generation in transaction preparation phase
- Never fallback to insecure behavior on error
- Clear error messages guide user to resolution

---

## Testing Requirements

### Unit Test Coverage Requirements

**Minimum Coverage:** 95% for all privacy-critical code

**Required Unit Tests:**
1. **Change Address Generation:**
   - Generate 100 change addresses, verify 100% unique
   - Verify internal chain derivation path
   - Verify storage updates correctly
2. **UTXO Selection:**
   - Run 1000 selections, measure entropy >50%
   - Verify non-deterministic behavior
   - Test greedy fallback scenarios
3. **Round Number Detection:**
   - Test all round number patterns (0.1, 0.5, 1.0, etc.)
   - Test non-round numbers (0.123, 0.987)
   - Test edge cases (0.0, 21000000.0)
4. **Contacts Rotation:**
   - Xpub rotation increments correctly
   - Cache exhaustion triggers regeneration
   - Reusage counter increments

### Integration Test Coverage Requirements

**Required Integration Tests:**
1. **End-to-End Transaction Privacy:**
   - Send 10 transactions, verify 10 unique change addresses
   - Verify randomized UTXO selection in each transaction
   - Verify internal index increments
2. **Receive Address Flow:**
   - Open ReceiveScreen 5 times, verify 5 new addresses
   - Verify gap limit not exceeded
   - Verify QR codes generate correctly
3. **Contacts Privacy Flow:**
   - Send to xpub contact 5 times, verify 5 different addresses
   - Send to single-address contact 5 times, verify counter = 5
   - Transaction history matches contacts correctly

### Testnet Validation Requirements

**Real Bitcoin Testnet Tests:**
1. **Change Address Validation:**
   - Send 3 real testnet transactions
   - Verify on blockchain: 3 unique change addresses
   - Verify change addresses not in external chain
2. **UTXO Selection Validation:**
   - Create wallet with 10 UTXOs
   - Send 5 transactions, analyze UTXO selection patterns
   - Verify no consistent greedy/largest-first pattern
3. **Address Rotation Validation:**
   - Generate 10 receive addresses
   - Receive funds to 5 of them
   - Verify unused addresses marked correctly

### Privacy Analysis Requirements

**Quantitative Privacy Metrics:**
1. **Change Address Reuse Rate:** Must be 0%
2. **UTXO Selection Entropy:** Must be >50% of maximum theoretical entropy
3. **Receive Address Reuse Rate:** Must be <10% (user behavior metric)
4. **Contacts Xpub Adoption:** Track % of contacts using xpub

**Qualitative Privacy Analysis:**
1. **Transaction Graph Analysis:**
   - Attempt to link transactions via change addresses
   - Should fail 100% of the time
2. **Wallet Fingerprinting:**
   - Attempt to identify wallet by UTXO selection pattern
   - Should fail (no consistent pattern)
3. **Network Surveillance Simulation:**
   - With API timing delays: Cannot cluster addresses
   - Without delays: Can cluster addresses (validates feature)

### User Acceptance Testing (UAT) Requirements

**User Testing Scenarios:**
1. **First-Time User:**
   - Create wallet, see privacy tips
   - Send transaction, observe change address messaging
   - Receive funds, observe fresh address generation
   - Outcome: User aware of privacy features (survey)
2. **Contacts User:**
   - Create single-address contact, see warning
   - Create xpub contact, see rotation badge
   - Send to both, understand difference
   - Outcome: User prefers xpub contacts (behavior metric)
3. **Advanced User:**
   - Enable optional privacy modes
   - Understand trade-offs
   - Use features successfully
   - Outcome: User satisfied with privacy control (survey)

**User Testing Success Criteria:**
- 80% of users understand privacy tips
- 60% of users prefer xpub contacts (when available)
- 90% of users successfully use default privacy features
- <10% of users frustrated by privacy warnings

---

## Documentation Requirements

### Required Documentation Deliverables

1. **PRIVACY_GUIDE.md** (User-Facing)
   - Target Audience: All wallet users
   - Length: 2000-3000 words
   - Tone: Educational, accessible, not alarmist
   - Includes: Screenshots, step-by-step guides, examples

2. **PRIVACY_AUDIT_REPORT.md** (Internal)
   - Target Audience: Development team
   - Length: 3000-5000 words
   - Tone: Technical, detailed, actionable
   - Includes: Severity classifications, metrics, remediation plan

3. **ARCHITECTURE.md - Privacy Section** (Technical)
   - Target Audience: Developers
   - Length: 1000-1500 words
   - Tone: Technical, architectural
   - Includes: Design patterns, data flow diagrams, code references

4. **In-App Help Content** (Contextual)
   - Target Audience: Users encountering privacy features
   - Length: 50-200 words per tooltip/modal
   - Tone: Concise, friendly, actionable
   - Includes: Tooltips, warnings, tips, modal content

### Documentation Quality Standards

**All documentation must:**
- Be technically accurate (reviewed by relevant expert)
- Use plain language (Flesch reading ease >60)
- Include visual aids (screenshots, diagrams, examples)
- Be accessible (WCAG AA compliant for web content)
- Be actionable (clear next steps for users)
- Be maintained (updated with each feature change)

### Documentation Review Process

1. **First Draft:** Written by assigned owner (PM or expert)
2. **Technical Review:** Reviewed by relevant expert (Blockchain, Security, etc.)
3. **User Testing:** 5 users read and provide comprehension feedback
4. **Accessibility Review:** UI/UX Designer checks accessibility
5. **Final Approval:** Product Manager approves for publication
6. **Publish:** Added to repository and linked from relevant locations

---

## Release Strategy

### Pre-Release Requirements (v0.11.0 - Privacy Release)

**Blocking Requirements:**
- [ ] All P0 and P1 features implemented and tested
- [ ] Privacy audit complete and issues resolved
- [ ] Testnet validation successful (0% change reuse, >50% UTXO entropy)
- [ ] User testing complete (80% comprehension)
- [ ] Documentation complete and published
- [ ] No open P0 or P1 bugs

**Non-Blocking (Can Ship After):**
- [ ] Optional privacy modes (Phase 3)
- [ ] Advanced documentation topics
- [ ] Privacy metrics dashboard (future)

### Release Versioning

**Version:** v0.11.0 (Privacy Release)

**Versioning Rationale:**
- Minor version bump (0.11) for significant new features
- Not a major version (1.0) as still testnet-only
- Signals meaningful privacy improvements

### Release Channels

**Testnet Beta:**
- Release to testnet first for validation
- Duration: 2 weeks minimum
- Audience: Existing users + privacy-focused testers
- Metrics: Monitor privacy metrics, user feedback, bug reports

**Testnet Stable:**
- Promote to stable after successful beta
- Full documentation and announcement
- Changelog highlighting privacy features

**Mainnet (Future):**
- Only after extensive testnet validation
- Requires additional security audit
- Separate release planning

### Release Communication

**Changelog (CHANGELOG.md):**
```markdown
## [0.11.0] - Privacy Enhancement Release - 2025-11-XX

### Added - Privacy Features
- **CRITICAL: Unique change addresses** - Every transaction now uses a fresh change address, preventing transaction graph analysis
- **UTXO selection randomization** - Prevents wallet fingerprinting through predictable UTXO selection
- **Auto-generated receive addresses** - Fresh address automatically created on each receive screen visit
- **Contacts privacy warnings** - Alerts when sending to reused addresses, encourages xpub contacts
- **Xpub contact address rotation** - Automatic rotation through cached addresses for privacy
- **Optional Privacy Mode settings** - Round number randomization, API timing delays, broadcast delays (advanced users)
- **Privacy documentation** - Comprehensive PRIVACY_GUIDE.md with best practices and Tor setup

### Fixed - Privacy Vulnerabilities
- **CRITICAL: Change address reuse** (Issue #XXX) - Was sending change to first address, now generates unique change addresses
- **Contacts address reuse** - Fixed transaction history contact matching to support xpub cached addresses
- **UTXO selection fingerprinting** - Replaced greedy selection with randomized algorithm

### Security
- Privacy audit completed by Blockchain and Security experts
- Zero known privacy vulnerabilities remaining in transaction building
```

**Announcement (README.md, GitHub Release):**
- Highlight privacy-first approach
- Link to PRIVACY_GUIDE.md
- Encourage user feedback on privacy features
- Request community security review

**User Communication:**
- In-app notification on first launch after update
- Modal: "New Privacy Features in v0.11.0"
- Highlights: Change addresses, UTXO randomization, contacts rotation
- Link to full changelog and privacy guide

### Post-Release Monitoring

**Metrics to Monitor:**
1. **Privacy Metrics:**
   - Change address reuse rate (target: 0%)
   - UTXO selection entropy (target: >50%)
   - Receive address reuse rate (target: <10%)
2. **User Behavior:**
   - Privacy Mode adoption rate
   - Xpub contact creation rate
   - Privacy guide views
3. **Quality Metrics:**
   - Privacy-related bug reports
   - User feedback sentiment
   - Performance impact (should be zero for default features)

**Success Criteria:**
- Privacy metrics meet targets within 2 weeks
- <5 privacy-related bug reports
- Positive user feedback (>80% satisfaction)
- No performance regressions

**Contingency Plan:**
- If critical privacy bug found: Hotfix within 24 hours
- If user confusion high: Improve documentation, add in-app tips
- If performance issues: Optimize or make feature optional

---

## Open Questions & Risks

### Open Questions

#### Question 1: Contacts Xpub Discovery
**Question:** How do users exchange xpubs with contacts? Should we provide in-app xpub sharing?

**Context:** For xpub contacts to work, users need to get xpub from the recipient. This may be a UX barrier.

**Options:**
1. Provide "Share My Xpub" feature in wallet (QR code, copy to clipboard)
2. Document manual process (user exports, sends via external channel)
3. Implement xpub exchange protocol (e.g., encrypted message passing)

**Recommended Approach:**
- **Phase 1 (this release):** Document manual process in PRIVACY_GUIDE.md
- **Phase 2 (future):** Add "Share My Xpub" feature with QR code and copy button
- **Phase 3 (future):** Consider encrypted xpub exchange protocol

**Decision Required By:** Phase 2 implementation planning

---

#### Question 2: Contacts Address Cache Size
**Question:** How many addresses should we cache for xpub contacts? (Current plan: 20-100)

**Trade-offs:**
- **Small cache (20 addresses):**
  - Pro: Less storage, faster initial generation
  - Con: Frequent regeneration if user sends many transactions
- **Large cache (100 addresses):**
  - Pro: Rare regeneration, supports high-volume users
  - Con: More storage, slower initial setup

**Recommended Approach:**
- Default: 50 addresses (balances trade-offs)
- Make configurable in advanced settings (future feature)
- Regenerate when 80% exhausted

**Decision Required By:** Phase 2 implementation (contacts rotation)

---

#### Question 3: Privacy Metrics Dashboard
**Question:** Should we provide users with privacy metrics (e.g., "0% address reuse")?

**Pros:**
- Educates users about privacy health
- Gamifies privacy (encourages best practices)
- Transparency builds trust

**Cons:**
- May confuse non-technical users
- Metrics may be misinterpreted
- Implementation effort for v0.11.0

**Recommended Approach:**
- **Phase 1 (this release):** Focus on functional features, skip metrics dashboard
- **Phase 2 (v0.12.0):** Add simple privacy health indicator (green/yellow/red)
- **Phase 3 (future):** Full privacy metrics dashboard for power users

**Decision Required By:** Post-release roadmap planning

---

### Risks & Mitigation

#### Risk 1: Change Address Implementation Breaks Multisig
**Severity:** HIGH
**Probability:** MEDIUM

**Risk:** Multisig change address generation is more complex (requires all cosigner xpubs). Implementation bug could break multisig transactions.

**Mitigation:**
- Blockchain Expert leads implementation review
- Extensive multisig testing (2-of-2, 2-of-3, 3-of-5)
- Testnet validation with real multisig transactions
- Code review by Security Expert before merge

**Contingency:**
- If bugs found in multisig: Disable multisig change address generation temporarily
- Fallback: Use first address for multisig only (document as known issue)
- Fix in hotfix release within 1 week

---

#### Risk 2: UTXO Randomization Causes Fee Estimation Issues
**Severity:** MEDIUM
**Probability:** LOW

**Risk:** Randomized UTXO selection might create inefficient transactions (more inputs = higher fees) compared to greedy selection.

**Mitigation:**
- Randomization algorithm still prioritizes efficiency
- Greedy fallback for edge cases
- Fee estimation testing across 1000 randomized selections
- Compare average fees: randomized vs greedy (should be within 5%)

**Contingency:**
- If fees significantly higher (>10%): Refine randomization algorithm to prefer fewer inputs
- If unresolvable: Make randomization optional (default ON)

---

#### Risk 3: Users Disable Privacy Features Due to Confusion
**Severity:** MEDIUM
**Probability:** MEDIUM

**Risk:** If optional privacy features are confusing or perceived as annoying, users may disable them or avoid using contacts.

**Mitigation:**
- Clear, non-technical documentation
- User testing before release (5+ users)
- In-app education (tips, tooltips)
- Default features are automatic (no user action required)

**Contingency:**
- Monitor user feedback and confusion signals
- Improve documentation and in-app help
- Simplify settings UI based on feedback
- A/B test different messaging approaches

---

#### Risk 4: Privacy Audit Reveals Critical Issues Not in Plan
**Severity:** MEDIUM
**Probability:** MEDIUM

**Risk:** Expert audit (Phase 1) may discover privacy vulnerabilities not identified in technical plan, requiring scope expansion.

**Mitigation:**
- Budget 20% contingency time in Phase 2 implementation
- Product Manager reviews audit findings and re-prioritizes if needed
- Critical issues block release (P0)
- Medium issues can ship in v0.12.0 (P1/P2)

**Contingency:**
- If critical issues found: Extend timeline, delay release
- If scope expands significantly: Split into v0.11.0 (critical) and v0.12.0 (enhancements)

---

#### Risk 5: Contacts Xpub Adoption Is Low
**Severity:** LOW
**Probability:** HIGH

**Risk:** Users may not understand or adopt xpub contacts, continuing to use single-address contacts and harming privacy.

**Mitigation:**
- Make xpub contact creation the default/prominent path
- Show privacy benefits clearly in UI ("✓ Address Rotation")
- Warning on single-address contacts is informative but not scary
- Document xpub exchange process clearly

**Contingency:**
- Monitor xpub contact adoption rate (target: >30% of contacts)
- If low (<10%): Improve onboarding, add tutorial
- Consider future features: In-app xpub sharing, address rotation for single-address contacts (user-managed)

---

#### Risk 6: Performance Impact on Low-End Devices
**Severity:** LOW
**Probability:** LOW

**Risk:** Address generation, UTXO randomization, or encryption operations could cause performance issues on low-end devices.

**Mitigation:**
- Test on low-end devices (old laptops, Chromebooks)
- Optimize cryptographic operations (use Web Crypto API)
- Lazy address generation (generate on-demand, not in batches)
- Performance benchmarking before release

**Contingency:**
- If performance issues: Optimize hotspots (profiling)
- If unresolvable: Make expensive features optional (e.g., large address caches)
- Document minimum system requirements

---

## Blockchain Expert Handoff

### Overview

The Privacy Audit (Phase 1) is the critical first step of this implementation. Your audit will validate the technical plan, identify any missed vulnerabilities, and provide baseline metrics for measuring improvement.

This section provides you with:
1. Specific audit requirements
2. Questions to answer
3. Expected deliverables
4. Technical concerns to investigate

---

### Audit Scope

#### Transaction Privacy Audit

**Current Implementation to Review:**

1. **Change Address Handling** (CRITICAL)
   - **File:** `src/background/index.ts` line 1766, 2147
   - **Current Behavior:** Hardcoded to `account.addresses[0].address`
   - **Questions to Answer:**
     - Does this leak transaction history? (Quantify severity)
     - How many transactions can be linked via change address clustering?
     - What is the transaction graph exposure?
     - Does this affect multisig differently than single-sig?
   - **Deliverable:** Severity assessment, quantitative analysis

2. **UTXO Selection Algorithm** (HIGH)
   - **File:** `src/background/bitcoin/TransactionBuilder.ts` line 289
   - **Current Behavior:** Greedy/largest-first selection
   - **Questions to Answer:**
     - Can wallet be fingerprinted by UTXO selection pattern?
     - Can balance be estimated by analyzing selection strategy?
     - What is the current entropy of UTXO selection? (H(selection) = ?)
     - Are there edge cases where greedy is necessary?
   - **Deliverable:** Entropy measurement, fingerprinting risk assessment

3. **Contacts Feature Address Reuse** (CRITICAL)
   - **Files:** `src/tab/components/ContactsScreen.tsx`, `src/tab/components/shared/TransactionRow.tsx`
   - **Current Behavior:** Single-address contacts encourage reuse
   - **Questions to Answer:**
     - How does contacts feature impact privacy?
     - Is xpub rotation solution technically sound?
     - What is the risk of transaction linking via contact addresses?
     - How effective is the proposed mitigation (warnings + rotation)?
   - **Deliverable:** Privacy impact analysis, mitigation validation

4. **Transaction Graph Exposure**
   - **Scope:** Overall transaction privacy
   - **Questions to Answer:**
     - Can an adversary link transactions to the same wallet?
     - What clustering heuristics work against current implementation?
     - Common input ownership heuristic effectiveness?
     - Change address detection heuristic effectiveness?
   - **Deliverable:** Transaction graph analysis report

#### Bitcoin Best Practices Compliance

**Review Against Bitcoin Privacy Wiki:**
- Address reuse (receive addresses, change addresses, contacts)
- Change address detection (round numbers, UTXO selection)
- Wallet fingerprinting (UTXO selection, address types, transaction patterns)
- Network privacy (API patterns, broadcasting)

**Questions to Answer:**
- Which best practices do we violate?
- Which best practices do we follow?
- What is the overall privacy grade? (A/B/C/D/F)

**Deliverable:** Compliance scorecard, comparison table

---

### Technical Concerns to Investigate

#### Concern 1: Internal Chain Address Generation

**Context:** Proposed fix generates change addresses from internal chain (`isChange: true`)

**Questions:**
- Is `handleGenerateAddress({ accountIndex, isChange: true })` the correct approach?
- Does it properly increment `internalIndex`?
- Are internal addresses derived correctly for all address types (legacy, segwit, native segwit)?
- Are internal addresses derived correctly for multisig (BIP48 compliance)?
- Is there risk of address collision between external and internal chains?

**Expected Answer:**
- Validation that internal chain derivation is correct
- Confirmation of BIP32/44/48 compliance
- Any edge cases or risks identified

---

#### Concern 2: UTXO Randomization Edge Cases

**Context:** Proposed randomized UTXO selection with greedy fallback

**Questions:**
- Are there scenarios where randomized selection fails to meet target?
- When should we fallback to greedy selection?
- Does randomization impact fee estimation accuracy?
- Could randomization create uneconomical transactions (dust change)?
- What entropy level is achievable in practice? (50%? 70%? Higher?)

**Expected Answer:**
- Edge case identification (e.g., exact amount, single UTXO, fragmented UTXOs)
- Fallback criteria definition
- Entropy target validation (is 50% reasonable? Should it be higher?)

---

#### Concern 3: Contacts Xpub Cached Address Matching

**Context:** Transaction history should match xpub contacts by checking `cachedAddresses` array

**Questions:**
- Is checking `cachedAddresses` sufficient for contact matching?
- Could this miss transactions (e.g., if contact uses address not in cache)?
- Is there a better approach (e.g., derive addresses on-demand)?
- What happens if xpub contact has exhausted cache?

**Expected Answer:**
- Validation of contact matching approach
- Identification of false negatives (missed matches)
- Recommendation for cache exhaustion handling

---

#### Concern 4: Multisig Change Address Derivation

**Context:** Multisig change addresses require all cosigner xpubs

**Questions:**
- Does `handleGenerateAddress` support multisig change address generation?
- Are all cosigner xpubs available when generating change address?
- Is BIP48 internal chain derivation correct? (`m/48'/1'/account'/script_type'/1/index`)
- Do we need special handling for multisig vs single-sig?

**Expected Answer:**
- Confirmation of multisig change address support
- Identification of any code changes needed
- BIP48 compliance validation

---

#### Concern 5: Gap Limit Implications

**Context:** Auto-generating receive addresses may create unused addresses

**Questions:**
- What is the BIP44 gap limit? (Standard is 20)
- Could our auto-generation exceed gap limit?
- What happens if user generates 25 addresses but only uses 1?
- Do we need gap limit enforcement?

**Expected Answer:**
- Gap limit compliance assessment
- Recommendation: Is auto-generation safe? Do we need limits?

---

### Expected Deliverables

#### Deliverable 1: Privacy Audit Report

**File:** `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md`

**Required Sections:**
1. **Executive Summary**
   - Overall privacy grade (A/B/C/D/F)
   - Critical findings (P0)
   - High/Medium/Low findings (P1/P2/P3)
   - Recommendations

2. **Current Privacy Strengths**
   - What we do well
   - Bitcoin best practices we follow
   - Comparison to other wallets (MetaMask, etc.)

3. **Privacy Vulnerabilities**
   - Detailed analysis of each issue
   - Severity classification (Critical/High/Medium/Low)
   - Quantitative metrics (entropy, reuse rates, linkability)
   - Attack scenarios and impact

4. **Bitcoin Privacy Wiki Compliance**
   - Section-by-section comparison
   - Scorecard of compliance
   - Gaps and recommendations

5. **Contacts Feature Privacy Analysis**
   - Address reuse impact
   - Xpub rotation effectiveness
   - Recommendations for mitigation

6. **Prioritized Remediation Roadmap**
   - Validate P0/P1/P2 classifications from technical plan
   - Identify any missed issues
   - Recommend implementation order

7. **Baseline Privacy Metrics**
   - Change address reuse rate: X%
   - UTXO selection entropy: H = X bits
   - Receive address reuse rate: X% (estimated)
   - Transaction linkability: X% (via clustering heuristics)

8. **Technical Recommendations**
   - Address technical concerns raised above
   - Validate or adjust proposed fixes
   - Identify any additional fixes needed

---

#### Deliverable 2: Technical Validation of Proposed Fixes

**For Each Proposed Fix (Change Address, UTXO Randomization, Contacts Rotation):**
- **Is the fix technically correct?** (Yes/No + explanation)
- **Does it fully resolve the vulnerability?** (Yes/Partial/No + gaps)
- **Are there edge cases or risks?** (List with mitigation)
- **BIP compliance maintained?** (BIP32/39/44/48 validation)
- **Implementation recommendations?** (Code structure, approach, gotchas)

**Deliverable Format:** Section in audit report or separate technical review document

---

#### Deliverable 3: Code Review Notes

**Review These Files (Minimum):**
- `src/background/index.ts` (transaction building, change address handling)
- `src/background/bitcoin/TransactionBuilder.ts` (UTXO selection)
- `src/background/wallet/HDWallet.ts` (address derivation)
- `src/tab/components/ReceiveScreen.tsx` (receive address UX)
- `src/tab/components/shared/ContactCard.tsx` (contacts)
- `src/tab/components/shared/TransactionRow.tsx` (transaction history)

**For Each File:**
- Privacy issues found (line numbers, description)
- Code quality observations (patterns, risks)
- Recommendations for improvement

**Deliverable Format:** Code review notes in audit report or inline GitHub comments

---

#### Deliverable 4: Quantitative Privacy Metrics

**Baseline Metrics (Current State):**
- Change address reuse rate: X% (should be 100%)
- UTXO selection entropy: H = X bits (should be ~0)
- Estimated receive address reuse: X%
- Transaction linkability success rate: X% (via common heuristics)

**Target Metrics (Post-Fix):**
- Change address reuse rate: 0%
- UTXO selection entropy: >50% of theoretical maximum
- Receive address reuse: <10%
- Transaction linkability success rate: <5%

**Methodology:**
- How did you measure each metric?
- What tools/scripts were used?
- Can these measurements be automated for regression testing?

**Deliverable Format:** Section in audit report with measurement methodology

---

### Questions for Blockchain Expert to Answer

#### High-Level Questions

1. **What is the single biggest privacy vulnerability in our current implementation?**
   - Why is it the worst?
   - What is the impact on users?

2. **Are the proposed fixes sufficient to eliminate critical vulnerabilities?**
   - Yes/No for each fix
   - What gaps remain?

3. **How does our privacy compare to industry standards (Bitcoin Core, Electrum, Wasabi)?**
   - Privacy grade: A/B/C/D/F
   - What separates us from best-in-class?

4. **What privacy features are we missing that should be on the roadmap?**
   - Coin control?
   - CoinJoin?
   - Lightning?
   - Full node?

#### Technical Questions

5. **Is the internal chain approach for change addresses correct?**
   - BIP32/44 compliance?
   - Risk of address collision?
   - Edge cases?

6. **What is the correct randomization algorithm for UTXO selection?**
   - Fisher-Yates shuffle?
   - Weighted randomization?
   - Other approach?

7. **What entropy level should we target for UTXO selection?**
   - 50%? 70%? Higher?
   - How to measure in practice?

8. **Is the contacts xpub rotation approach sound?**
   - Does it fully mitigate address reuse?
   - What are the limitations?

9. **Are there privacy implications of using Blockstream API?**
   - IP exposure?
   - Address clustering?
   - Should we recommend Tor?

10. **Should we implement additional privacy features beyond the plan?**
    - Specific recommendations?
    - Priority assessment?

---

### Timeline for Audit

**Estimated Duration:** 3-5 days

**Breakdown:**
- **Day 1-2:** Code review, transaction privacy analysis
- **Day 3:** Bitcoin Privacy Wiki compliance, baseline metrics
- **Day 4:** Contacts feature analysis, technical validation
- **Day 5:** Report writing, recommendations

**Deliverable Deadline:** End of Week 1 (Phase 1)

---

### Handoff Checklist

**Before Starting Audit:**
- [ ] Read BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md (technical plan)
- [ ] Read this PRD (product requirements)
- [ ] Review Bitcoin Privacy Wiki: https://en.bitcoin.it/wiki/Privacy
- [ ] Set up test environment (wallet with transactions, testnet)

**During Audit:**
- [ ] Review all files listed in "Code Review Notes"
- [ ] Measure baseline privacy metrics
- [ ] Answer all questions in "Questions for Blockchain Expert"
- [ ] Validate proposed fixes against Bitcoin best practices
- [ ] Identify edge cases and risks

**After Audit:**
- [ ] Create PRIVACY_AUDIT_REPORT.md with all required sections
- [ ] Present findings to Product Manager
- [ ] Discuss any scope changes or new issues discovered
- [ ] Get approval to proceed to Phase 2 implementation

---

### Success Criteria for Audit

**Audit is complete when:**
- [ ] All questions answered
- [ ] All files reviewed
- [ ] Baseline metrics measured
- [ ] Report document created and approved
- [ ] Technical validation of fixes provided
- [ ] Product Manager accepts findings and approves Phase 2 start

---

### Communication & Collaboration

**During Audit:**
- Post daily updates on progress
- Flag critical findings immediately (don't wait for report)
- Ask clarifying questions as needed
- Collaborate with Security Expert for network privacy aspects

**After Audit:**
- Present findings to Product Manager (sync meeting)
- Discuss scope adjustments if needed
- Hand off to Backend Developer for implementation (Phase 2)

---

## Conclusion

This PRD provides comprehensive product requirements for the Bitcoin Privacy Enhancement project. The audit phase is critical to validate assumptions and ensure our fixes are correct and complete.

**Next Steps:**
1. **Product Manager** reviews and approves this PRD ✅ (You are here)
2. **Blockchain Expert** begins privacy audit (Phase 1)
3. **Security Expert** begins network privacy audit (Phase 1)
4. **Backend Developer** documents current implementation (Phase 1)
5. **All experts** collaborate on PRIVACY_AUDIT_REPORT.md
6. **Product Manager** reviews audit findings and approves Phase 2 start

**Questions or Concerns:**
- Product Manager is available for clarifications
- Scope can be adjusted based on audit findings
- Timeline is flexible if critical issues discovered

**Let's build privacy-first Bitcoin infrastructure.** 🔒
