# BitSNARK - Zero-Knowledge Proofs on Bitcoin

**Last Updated**: 2025-10-26
**Status**: Production-ready (since July 2024)
**Testnet Support**: ✅ Yes
**Mainnet Support**: ✅ Yes

## Overview

BitSNARK is BitcoinOS's zero-knowledge proof verification protocol that brings zk-SNARKs (Succinct Non-Interactive Arguments of Knowledge) to Bitcoin for the first time. It enables privacy-preserving transactions and smart contracts on Bitcoin L1 without altering Bitcoin's core protocol.

## Key Capabilities

### 1. Privacy-Preserving Transactions

**What It Does**:
- Hides transaction amounts
- Obscures sender/receiver relationships
- Proves transaction validity without revealing details
- Maintains Bitcoin's UTXO model

**How It Works**:
1. User generates zk-proof of valid transaction off-chain
2. Proof posted to Bitcoin blockchain
3. BitSNARK VM verifies proof on-chain
4. Transaction confirmed without revealing private details

**Wallet Integration Potential**:
- "Private Send" feature with hidden amounts
- Confidential multisig wallets
- Privacy-preserving corporate treasury
- Optional privacy mode for enhanced transactions

### 2. Smart Contracts on Bitcoin

**What It Does**:
- Enables programmable Bitcoin logic
- Complex conditional payments
- Time-locked transactions with multiple conditions
- DeFi primitives on Bitcoin L1

**How It Works**:
1. Smart contract logic defined in zk-circuit
2. Execution proven off-chain using zk-SNARK
3. Proof verified on Bitcoin blockchain
4. Bitcoin released according to proven conditions

**Wallet Integration Potential**:
- Programmable vesting schedules
- Escrow with complex release conditions
- Decentralized exchanges (DEX) on Bitcoin
- Automated recurring payments

### 3. Zero-Knowledge Proofs of Reserves

**What It Does**:
- Prove wallet balance without revealing addresses
- Demonstrate solvency without exposing holdings
- Verify ownership of funds privately

**Wallet Integration Potential**:
- Corporate transparency tools
- Private auditing features
- Proof of funds for large transactions

## Technical Architecture

### BitSNARK VM

The BitSNARK VM is a highly optimized virtual machine for verifying zk-SNARKs on Bitcoin:

**Characteristics**:
- Processes succinct proofs (small size, fast verification)
- Bitcoin Script compatible
- Minimal on-chain footprint
- Off-chain computation, on-chain verification

**Proof Systems Supported**:
- Groth16 (most compact proofs)
- PLONK (universal trusted setup)
- Other SNARK variants

### Integration Points

**For Chrome Extension Background Worker**:
```typescript
// Conceptual API (to be refined based on actual SDK)
import { BitSNARK } from '@bitcoinos/bitsnark';

// Generate privacy transaction proof
const proof = await BitSNARK.generateProof({
  inputs: {
    utxos: selectedUTXOs,
    recipients: [{ address, amount }],
    changeAddress
  },
  circuit: 'private-transaction',
  options: {
    hideAmounts: true,
    hideRecipients: false
  }
});

// Construct Bitcoin transaction with proof
const tx = await BitSNARK.buildTransaction({
  proof,
  feeRate
});

// Broadcast
const txid = await bitcoinClient.broadcastTransaction(tx);
```

**For Frontend UI**:
- Progress indicator for proof generation (can take 10-30 seconds)
- Privacy level selector (full privacy, partial privacy, standard)
- Educational tooltips explaining zk-proofs
- Transaction preview with privacy features highlighted

## Wallet Feature Designs

### Feature 1: Private Send Mode

**User Story**:
> "As a user, I want to send Bitcoin with hidden amounts so that observers cannot determine how much I'm sending."

**UX Flow**:
1. User selects "Private Send" toggle on Send screen
2. Educational modal explains zk-proof privacy (first time only)
3. User enters recipient and amount (they still see amounts)
4. Wallet generates zk-proof in background (show progress)
5. Transaction constructed with proof embedded
6. User confirms and broadcasts
7. On-chain: proof verified, transaction confirmed
8. External observers see valid transaction but not amount

**Implementation Requirements**:
- BitSNARK SDK integration in background worker
- Proof generation worker (avoid blocking UI)
- Progress tracking for multi-second proof generation
- Privacy level selection (full, partial)
- Educational content for first-time users
- Testnet testing before mainnet launch

**Privacy Levels**:
- **Full Privacy**: Hide amounts, hide recipient, hide sender
- **Partial Privacy**: Hide amounts only (default)
- **Standard**: No privacy (regular Bitcoin transaction)

### Feature 2: Confidential Multisig

**User Story**:
> "As a corporate treasurer, I want multisig wallets where co-signers cannot see the wallet balance."

**UX Flow**:
1. Create multisig wallet with "Confidential" option
2. Generate zk-proof circuit for N-of-M verification
3. Co-signers receive signing requests without amount visibility
4. Each co-signer proves their signature without revealing details
5. Final transaction combines proofs and executes

**Benefits**:
- Co-signers verify validity without seeing amounts
- Privacy between co-signers
- Audit trail without exposing balances
- Corporate treasury privacy

### Feature 3: Zero-Knowledge Proof of Reserves

**User Story**:
> "As a high-net-worth individual, I want to prove I own X BTC without revealing my addresses."

**UX Flow**:
1. User selects "Generate Proof of Reserves"
2. Chooses amount threshold to prove (e.g., "I own ≥ 10 BTC")
3. Wallet generates zk-proof across all accounts
4. Proof exported as verifiable file/QR code
5. Third party can verify proof without learning addresses

**Use Cases**:
- Prove solvency for loans
- Demonstrate reserves for business partnerships
- Privacy-preserving audits
- Inheritance verification

## Security Considerations

### Threat Model

**Potential Attack Vectors**:
1. **Proof Forgery**: Attacker generates fake proof of valid transaction
   - **Mitigation**: Use battle-tested proof systems (Groth16, PLONK)
   - **Mitigation**: Verify proofs on-chain using BitSNARK VM

2. **Setup Ceremony Compromise**: Trusted setup for Groth16 compromised
   - **Mitigation**: Use transparent setup systems (PLONK, STARKs)
   - **Mitigation**: Participate in multi-party computation ceremonies

3. **Implementation Bugs**: Bugs in zk-circuit or proof generation
   - **Mitigation**: Audit all circuits before production
   - **Mitigation**: Use well-tested libraries
   - **Mitigation**: Extensive testnet testing

4. **Denial of Service**: Proof generation consumes excessive resources
   - **Mitigation**: Run proof generation in Web Worker
   - **Mitigation**: Set timeouts and resource limits
   - **Mitigation**: Show progress to user, allow cancellation

### Security Requirements

**MANDATORY Before Production**:
- [ ] Security expert review of all zk-circuit implementations
- [ ] Third-party audit of proof generation code
- [ ] Extensive testnet validation (minimum 1000 test transactions)
- [ ] Blockchain expert validation of Bitcoin integration
- [ ] Performance testing (proof generation time, resource usage)
- [ ] Error handling and edge case coverage
- [ ] User education materials reviewed
- [ ] Incident response plan for proof-related issues

## Performance Characteristics

**Proof Generation**:
- **Time**: 10-60 seconds depending on circuit complexity
- **CPU**: Intensive, use Web Worker to avoid UI blocking
- **Memory**: 100-500 MB for proof generation
- **Proof Size**: ~200-500 bytes (very compact)

**Verification**:
- **Time**: < 1 second on-chain
- **Size**: Minimal on-chain footprint
- **Cost**: Standard Bitcoin transaction fees + small overhead

**UX Implications**:
- Show clear progress indicator during generation
- Allow user to continue browsing wallet during generation
- Background queue for multiple proofs
- Batch multiple operations when possible

## Implementation Roadmap

### Phase 1: Research & Planning (Current)
- [x] Research BitSNARK capabilities
- [x] Document wallet integration potential
- [ ] Define initial feature set (Private Send)
- [ ] Create detailed technical specifications
- [ ] Security threat modeling

### Phase 2: SDK Integration
- [ ] Integrate BitcoinOS SDK into background worker
- [ ] Set up development environment (Rust, IC canisters)
- [ ] Create proof generation worker
- [ ] Implement basic zk-proof construction
- [ ] Testnet deployment and validation

### Phase 3: Private Send Feature
- [ ] Design UX for privacy mode toggle
- [ ] Implement proof generation UI
- [ ] Progress tracking and cancellation
- [ ] Educational content and warnings
- [ ] Testnet user testing

### Phase 4: Testing & Audit
- [ ] Comprehensive unit tests
- [ ] Integration tests with testnet
- [ ] Security expert review
- [ ] Blockchain expert validation
- [ ] Performance optimization
- [ ] User acceptance testing

### Phase 5: Mainnet Launch
- [ ] Final security audit
- [ ] Mainnet deployment preparation
- [ ] Phased rollout (limit amounts initially)
- [ ] Monitoring and incident response
- [ ] User documentation and support

## Known Limitations

**Current BitSNARK Limitations** (as of Oct 2025):
- Proof generation time can be slow on low-end devices
- Requires modern CPU for reasonable performance
- Memory-intensive (may struggle on mobile devices)
- Limited to specific proof systems (Groth16, PLONK)
- Testnet thoroughly before mainnet (new technology)

**Wallet Implementation Challenges**:
- Browser environment constraints (no native code)
- WASM compilation for proof generation
- Background worker resource limits in Chrome extensions
- User education (zk-proofs are complex concept)
- Privacy vs transparency trade-offs

## Future Enhancements

**Potential Future Features**:
- Privacy-preserving Lightning Network channels
- Confidential atomic swaps
- Zero-knowledge identity proofs
- Private voting mechanisms
- Confidential DeFi protocols on Bitcoin

## Official BitSNARK Library

### Repository Information

**Official Library**: https://github.com/bitsnark/bitsnark-lib

**Purpose**: Protocol enabling zero-knowledge proof verification on Bitcoin, facilitating BTC transfers conditional on provable external events (like cross-chain token burns).

**Primary Use Case**: 2-way pegging between Bitcoin and ERC20 tokens

**Current State**: Prover-verifier demo running locally on Bitcoin regtest

**Roadmap**: Expanding to multi-verifier network implementation

### Technical Requirements

**System Dependencies**:
- Node.js v20.17.0
- Python 3.12
- libsecp256k1-1
- Docker 26+
- npm (latest)

**Installation**:
```bash
# Clone repository
git clone https://github.com/bitsnark/bitsnark-lib.git
cd bitsnark-lib

# Install dependencies
npm install

# Run end-to-end demo (takes ~15 minutes)
npm run e2e
```

### Repository Structure

```
bitsnark-lib/
├── db/              # Database schema (schema.sql)
├── generated/       # Auto-generated files
├── git-hooks/       # Git workflow automation
├── python/          # Core implementation and tools
│   └── bitsnark/core/
│       └── db_listener.py  # Primary production entry point
├── scripts/         # Execution scripts (e2e.sh entry point)
├── specs/           # TLA+ protocol specification + SVG diagrams
├── src/             # TypeScript agent and setup logic
│   └── agent/
│       ├── setup/agent.ts           # Full agent with Telegram negotiation
│       └── setup/emulate-setup.ts   # Local setup generation
├── tests/           # Test suites
└── types/           # TypeScript type definitions
```

**Languages**: TypeScript (69.3%), Python (22.5%), HTML (4.6%), Shell (1.7%), Solidity (0.9%), TLA (0.9%)

### Core Protocol Architecture

**Prover-Verifier Model**:
The protocol involves two parties agreeing on a deterministic program, preparing interdependent Bitcoin transactions where:
1. **Prover** stakes BTC on proof correctness
2. **Verifier** can challenge and claim the stake if proof is invalid
3. **Timelock mechanisms** enforce response deadlines

**Transaction Flow**:
1. **Proof** - Prover publishes zero-knowledge proof with staked BTC
2. **Challenge** (optional) - Verifier contests proof validity
3. **State/Select Chain** - Binary dissection identifies contentious operation
4. **Argument** - Prover commits to operation inputs/outputs
5. **Proof Refuted/Uncontested** - Final settlement based on correctness

**Contention Dissection**:
Since full program execution in Bitcoin Script is infeasible, the protocol performs logarithmic binary search to isolate disputed operations. Takes approximately **6 dissections to identify one out of ~500,000 operations**.

### Key Components

**Python Core** (`python/bitsnark/core/`):
- **db_listener.py** - Primary production entry point handling:
  - Transaction template signing during setup
  - Transaction construction and broadcasting during execution
  - Funding transaction management

**TypeScript Agent** (`src/`):
- **agent/setup/agent.ts** - Full agent implementation with Telegram-based setup negotiation
- **agent/setup/emulate-setup.ts** - Local setup generation without external communication

**Database**:
- Schema manages protocol state, transaction templates, and execution tracking
- See `db/schema.sql` for complete schema

**Specifications**:
- TLA+ formal verification of protocol invariants
- SVG diagrams showing transaction dependencies and multi-verifier flows

### Demo Execution

**Running the Demo**:
```bash
npm run e2e
```

This executes a complete prover-verifier setup and protocol run on local regtest Bitcoin, demonstrating:
- Proof publication
- Verifier refutation
- Complete transaction flow

**Execution Time**: Approximately 15 minutes

**Optional Telegram Integration** (for setup negotiation visibility):
```bash
export TELEGRAM_TOKEN_PROVER="your_prover_token"
export TELEGRAM_TOKEN_VERIFIER="your_verifier_token"
export TELEGRAM_CHANNEL_ID="your_channel_id"
```

**Required Environment Variables**:
```bash
PROVER_SCHNORR_PUBLIC="..."
PROVER_SCHNORR_PRIVATE="..."
VERIFIER_SCHNORR_PUBLIC="..."
VERIFIER_SCHNORR_PRIVATE="..."
```

### Transaction Template System

**Key Patterns**:
- Pre-signed, interdependent transactions with forward-declared TXIDs
- Timelocks enforce response sequencing
- Symbolic dust outputs ensure transaction mutuality

**Fee Handling**:
- Prover stake includes contingency for challenge costs
- Verifier payment compensates prover for challenge transaction fees
- Future CPFP (Child-Pays-For-Parent) integration mentioned for dynamic fee adjustment

### Multi-Verifier Extension

**Capabilities**:
- Protocol supports multiple independent verifiers
- Each verifier has separate transaction outputs
- Verifier claiming reward requires spending both proof and locked-funds outputs
- Prover recovers funds only if no verifier successfully claims victory (through refutation or timeout)

### Integration Points

**Bitcoin Network**:
- Regtest for testing and development
- Production-ready for mainnet deployment

**Zero-Knowledge Proofs**:
- Groth16 verification program as example
- Supports various zk-SNARK proof systems

**Ethereum Integration** (Planned):
- ERC20 token burn verification
- 2-way pegging implementation

### API Patterns (Conceptual for Wallet Integration)

**Based on repository structure, expected integration would look like**:

```typescript
import { BitSNARK } from 'bitsnark-lib';

// Initialize
const bitsnark = new BitSNARK({
  network: 'testnet',
  role: 'prover'
});

// Setup phase (one-time)
await bitsnark.setup({
  counterparty: verifierPublicKey,
  program: deterministicProgram,
  stake: amountInSats
});

// Execution phase
await bitsnark.proveExecution({
  inputs: programInputs,
  witness: privateWitness
});

// Verification
const isValid = await bitsnark.verify(proof);
```

**Note**: Actual API may differ - consult repository documentation for current interfaces.

### Wallet Integration Considerations

**For Our Bitcoin Wallet**:

1. **Proof Generation**:
   - Run BitSNARK protocol in background service worker
   - Use Python backend (db_listener.py) or port to TypeScript
   - Handle 15+ minute execution times with progress tracking

2. **Transaction Management**:
   - Integrate pre-signed transaction templates
   - Handle timelock mechanisms
   - Manage UTXO selection for stakes

3. **User Experience**:
   - Explain 15-minute commitment period
   - Show multi-stage transaction flow
   - Handle verifier selection/coordination

4. **Security**:
   - Validate all proof templates before signing
   - Monitor verifier behavior
   - Implement emergency exit mechanism

### Current Limitations

**As of October 2025**:
- Demo stage (local regtest only)
- Requires prover-verifier coordination
- 15-minute execution times (too long for quick transactions)
- Multi-verifier network still in development
- Limited to specific proof programs

**Not Yet Ready For**:
- Real-time privacy transactions (too slow)
- User-friendly wallet integration (requires coordination)
- Mainnet production use (demo phase)

### Future Development

**Planned Enhancements**:
- Multi-verifier functionality completion
- 2-way Bitcoin-ERC20 token pegging implementation
- Reduced execution times
- Simplified setup process

**Repository Activity**:
- 94 stars, 16 forks (as of documentation)
- Active development
- Open-source (check LICENSE file for details)

## Resources & References

### Official BitSNARK Library
- **Repository**: https://github.com/bitsnark/bitsnark-lib
- **Demo**: Run `npm run e2e` after cloning
- **Database Schema**: `db/schema.sql`
- **Specifications**: TLA+ specs in `specs/` directory
- **Diagrams**: SVG visualizations of transaction flows

### BitcoinOS Ecosystem
- **BitSNARK Announcement**: First zk-SNARK verified on Bitcoin (July 2024)
- **Technical Docs**: https://docs.bitcoinos.build/
- **GitHub**: https://github.com/bitcoinOS/bitcoinOS
- **Research Papers**: [TBD - link to academic papers]

### Academic & Technical
- **zk-SNARKs**: Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge
- **Groth16**: Most compact proof system (used in examples)
- **PLONK**: Universal trusted setup alternative
- **TLA+**: Temporal Logic of Actions (formal specification language)

## Cross-References

- **Security Analysis**: See [security.md](security.md)
- **Integration Guide**: See [integration-guide.md](integration-guide.md)
- **Feature Roadmap**: See [roadmap.md](roadmap.md)
- **Architecture**: See [architecture.md](architecture.md)

---

**Status**: Ready for planning and design phase. Requires SDK integration research before implementation begins.
