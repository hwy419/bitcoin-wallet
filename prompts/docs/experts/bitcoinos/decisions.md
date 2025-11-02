# BitcoinOS Architectural Decision Records (ADRs)

**Last Updated**: 2025-10-26

## Overview

This document records significant architectural and design decisions made for BitcoinOS integration into the Bitcoin Wallet Chrome Extension.

---

## ADR-001: BitcoinOS Expert Creation

**Date**: 2025-10-26
**Status**: ✅ Accepted
**Deciders**: Development Team

### Context

The project needs expertise in cutting-edge Bitcoin technologies (zk-SNARKs, cross-chain bridges, scalable verification) that are not covered by existing experts. BitcoinOS brings fundamentally new capabilities to Bitcoin that require specialized knowledge.

### Decision

Created a dedicated **BitcoinOS Integration Expert** with responsibilities for:
- BitSNARK (zk-SNARK privacy)
- Grail Bridge (cross-chain interoperability)
- Merkle Mesh (scalable verification)
- Feature innovation and brainstorming
- Integration architecture design

### Consequences

**Positive**:
- Dedicated expertise for advanced Bitcoin features
- Clear ownership of BitcoinOS-related decisions
- Structured approach to integrating new technologies
- Better collaboration with existing experts

**Negative**:
- Additional expert to coordinate with
- Requires ongoing monitoring of BitcoinOS development
- Learning curve for new technologies

**Neutral**:
- Documentation maintained in `prompts/docs/experts/bitcoinos/`
- Agent invoked via `bitcoinos-integration-expert` subagent type

---

## ADR-002: Phased BitcoinOS Integration Approach

**Date**: 2025-10-26
**Status**: ✅ Accepted
**Deciders**: Product Team, BitcoinOS Expert

### Context

BitcoinOS technologies are at different maturity levels:
- BitSNARK: Production (since July 2024)
- Grail Bridge: Testnet (mainnet Q2 2025)
- Merkle Mesh: In development

Attempting to integrate all at once would be risky and complex.

### Decision

**Phased Integration Approach**:

**Phase 1** (Q3 2025): BitSNARK Privacy Features
- Focus: Confidential transactions (Private Send)
- Testnet validation
- User education materials
- Security audits

**Phase 2** (Q4 2025): Grail Bridge Cross-Chain
- Focus: BTC ↔ ETH bridging
- Wait for mainnet launch (Q2 2025)
- Limited beta with small amounts
- Gradual limit increases

**Phase 3** (2026+): Advanced Features
- Multi-chain support (Cardano, Solana)
- Confidential multisig
- Smart contract integration
- Merkle Mesh aggregation (when available)

### Consequences

**Positive**:
- Manageable complexity per phase
- Learn from each phase before next
- Align with BitcoinOS maturity/timelines
- Reduce risk of major failures

**Negative**:
- Slower feature rollout
- Users must wait for later-phase features
- Potential competitive disadvantage

**Neutral**:
- Feature flags control phase activation
- Each phase independently valuable

---

## ADR-003: Web Worker for Proof Generation

**Date**: 2025-10-26
**Status**: ✅ Accepted (Pending Implementation)
**Deciders**: Frontend Developer, BitcoinOS Expert, Backend Developer

### Context

zk-SNARK proof generation is computationally intensive:
- Takes 10-60 seconds
- CPU-intensive operations
- Memory usage 100-500 MB
- Blocks UI thread if run directly

Chrome extension service workers have resource constraints.

### Decision

Use **Web Worker** for all proof generation:
- Spawn dedicated worker for each proof generation task
- Run computation off main thread
- Show progress indicator in UI
- Allow user to cancel long-running operations
- Cache generated proofs to avoid regeneration

**Implementation Pattern**:
```typescript
// Background worker spawns Web Worker
const worker = new Worker('proof-generator-worker.js');

worker.postMessage({
  type: 'GENERATE_PROOF',
  inputs: txInputs
});

worker.onmessage = (event) => {
  if (event.data.type === 'PROGRESS') {
    updateProgressUI(event.data.progress);
  } else if (event.data.type === 'COMPLETE') {
    handleProof(event.data.proof);
  }
};
```

### Consequences

**Positive**:
- UI remains responsive during proof generation
- Better user experience
- Can show real-time progress
- Allows cancellation

**Negative**:
- Additional complexity (worker management)
- Communication overhead (postMessage)
- Debugging more difficult

**Neutral**:
- Standard pattern for CPU-intensive tasks in browsers

---

## ADR-004: Testnet-First Deployment Strategy

**Date**: 2025-10-26
**Status**: ✅ Accepted
**Deciders**: Security Expert, BitcoinOS Expert, Product Manager

### Context

BitcoinOS features involve:
- Cryptographic operations (zk-proofs)
- Cross-chain interactions
- Smart contracts
- New, unproven technologies

Deploying directly to mainnet is high-risk.

### Decision

**Mandatory Testnet-First Approach**:

1. All BitcoinOS features MUST launch on testnet first
2. Minimum 100 successful test transactions before mainnet consideration
3. Minimum 30 days testnet operation
4. User acceptance testing on testnet
5. Security audit based on testnet implementation
6. Blockchain expert validation
7. Product manager sign-off on UX

**Mainnet Deployment Requirements**:
- [ ] Testnet success criteria met
- [ ] Security audit passed
- [ ] No critical bugs in 30-day testnet period
- [ ] User education materials complete
- [ ] Support processes established
- [ ] Monitoring dashboard operational

### Consequences

**Positive**:
- Dramatically reduced mainnet risk
- Real-world testing with no financial consequences
- Time to iterate on UX based on feedback
- Confidence before mainnet launch

**Negative**:
- Slower time to mainnet
- Testnet limitations (faucets, fake value)
- User excitement dampened by testnet-only

**Neutral**:
- Industry best practice for new crypto features
- Aligns with BitcoinOS's own rollout timeline

---

## ADR-005: Privacy Mode as Opt-In Feature

**Date**: 2025-10-26
**Status**: ✅ Accepted (Pending Implementation)
**Deciders**: Product Manager, UI/UX Designer, BitcoinOS Expert

### Context

Privacy transactions using zk-SNARKs have trade-offs:
- Slower (10-60 second proof generation)
- More complex (users must understand)
- Different fee structure
- Not always necessary

Making privacy default could frustrate users who just want fast, simple transactions.

### Decision

**Privacy as Opt-In Toggle**:
- Send screen has "Private Send" toggle (off by default)
- First time: Educational modal explains zk-proofs and benefits
- User can set default preference in settings
- Clear indicators when privacy mode active
- Standard mode remains fast and simple

**Privacy Levels**:
- **Standard** (default): Normal Bitcoin transaction
- **Partial Privacy**: Hide amounts only
- **Full Privacy**: Hide amounts, sender, receiver (future)

### Consequences

**Positive**:
- Doesn't force complexity on basic users
- Power users can enable as needed
- Clear user choice
- Gradual education opportunity

**Negative**:
- Privacy features may be underutilized
- Default matters for privacy (most won't change it)
- Educational burden on first use

**Neutral**:
- Common pattern (e.g., VPNs, incognito mode)
- Can promote privacy features without forcing them

---

## ADR-006: Cross-Chain Balance Aggregation

**Date**: 2025-10-26
**Status**: 🤔 Proposed (Not Yet Decided)
**Deciders**: TBD

### Context

When Grail Bridge launches, users may have Bitcoin split across chains:
- Native BTC on Bitcoin mainnet
- Wrapped BTC on Ethereum
- Wrapped BTC on Solana
- Wrapped BTC on Cardano

Should the wallet show:
1. Only native BTC (ignore wrapped)
2. Separate balances per chain
3. Aggregated total ("Total Bitcoin Holdings")

### Options

**Option A: Native BTC Only**
- Pros: Simple, focuses on Bitcoin L1
- Cons: Ignores user's cross-chain holdings

**Option B: Separate Balances**
- Pros: Clear distinction, no confusion
- Cons: Fragmented view, hard to see total exposure

**Option C: Aggregated Total + Breakdown**
```
Total Bitcoin Holdings: 3.05 BTC
  Native BTC:     2.45 BTC
  Wrapped (ETH):  0.50 WBTC
  Wrapped (SOL):  0.10 WBTC
```
- Pros: Complete picture, easy to see total
- Cons: More complex, requires multi-chain sync

### Decision

**TBD** - Requires input from:
- Product Manager (user needs)
- UI/UX Designer (dashboard design)
- Frontend Developer (implementation complexity)
- Backend Developer (multi-chain sync)

### Next Steps

- [ ] User research on preference
- [ ] Design mockups for Option B vs C
- [ ] Technical feasibility assessment
- [ ] Decision by end of Q2 2025

---

## ADR-007: Proof Caching Strategy

**Date**: 2025-10-26
**Status**: 🤔 Proposed (Not Yet Decided)
**Deciders**: TBD

### Context

Generating zk-proofs is expensive (10-60 seconds, high CPU/memory).

**Scenarios Where Caching Could Help**:
1. User generates proof, then cancels transaction (proof wasted)
2. User wants to resend same amount to same recipient
3. Batch transactions with similar structure

**Concerns**:
1. Proofs contain transaction-specific data (UTXOs, amounts)
2. Security: Cached proofs could be reused maliciously?
3. Storage: Proofs are ~200-500 bytes each
4. Invalidation: When is cached proof stale?

### Options

**Option A: No Caching**
- Generate fresh proof for every transaction
- Pros: Simple, no staleness issues
- Cons: Wastes computation on regeneration

**Option B: Cache with Short TTL**
- Cache proofs for 5 minutes
- Pros: Helps retry scenarios
- Cons: Limited benefit, complexity

**Option C: Smart Caching with Invalidation**
- Cache based on proof inputs hash
- Invalidate when UTXOs change
- Pros: Maximum benefit
- Cons: Complex invalidation logic

### Decision

**TBD** - Requires:
- Security expert assessment (reuse risks)
- BitcoinOS expert input (proof structure)
- Implementation complexity analysis

---

## Decision Template

```markdown
## ADR-XXX: [Title]

**Date**: YYYY-MM-DD
**Status**: [Proposed | Accepted | Rejected | Superseded | Deprecated]
**Deciders**: [List of people involved]

### Context

[What is the issue we're trying to solve?]

### Decision

[What did we decide to do?]

### Consequences

**Positive**:
- [Good outcome]

**Negative**:
- [Trade-off or downside]

**Neutral**:
- [Other notable impacts]
```

---

## Cross-References

- **Architecture**: [architecture.md](architecture.md)
- **Security**: [security.md](security.md)
- **Roadmap**: [roadmap.md](roadmap.md)

---

**Next Decision**: Review and vote on ADR-006 and ADR-007 by Q2 2025.
