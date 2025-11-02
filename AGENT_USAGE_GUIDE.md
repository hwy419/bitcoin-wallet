# Agent Usage Guide

This guide provides detailed instructions on when and how to use specialized Claude Code agents in the Bitcoin Wallet Chrome Extension project.

## Overview

**This project requires the use of specialized Claude Code agents for ALL domain-specific work.** These are not optional - they are a mandatory part of the development workflow.

**Quick Reference**: See `CLAUDE.md` for the quick agent reference table.

## When to Invoke Agents

Invoke agents proactively and frequently for the following scenarios:

### 1. Bitcoin Blockchain Expert

**Agent Type**: `bitcoin-blockchain-expert`

**Use for ANY Bitcoin-related code:**

- Implementing or modifying HD wallet functionality (BIP32/39/44/48)
- Address generation or validation
- Transaction building, signing, or broadcasting
- UTXO selection or management
- Fee estimation
- Reviewing Bitcoin protocol implementations
- **MUST review** all Bitcoin cryptographic operations before merge

**Examples:**

```
"I need to implement address generation for a new account"
→ Invoke bitcoin-blockchain-expert agent

"I've implemented transaction fee estimation"
→ Invoke bitcoin-blockchain-expert agent to review

"The UTXO selection algorithm is selecting too many small UTXOs"
→ Invoke bitcoin-blockchain-expert agent to optimize

"I need to add support for P2TR (Taproot) addresses"
→ Invoke bitcoin-blockchain-expert agent for implementation guidance
```

### 2. BitcoinOS Integration Expert

**Agent Type**: `bitcoinos-integration-expert`

**Use for ALL BitcoinOS integration work:**

- Feature ideation using BitSNARK, Grail Bridge, or Merkle Mesh
- zk-SNARK privacy transaction implementation
- Cross-chain bridge integration (BTC ↔ ETH/SOL/ADA)
- Smart contract capabilities on Bitcoin
- BitcoinOS SDK integration and architecture
- Proof generation and verification
- Cross-chain state management
- **MUST consult** before implementing any BitcoinOS features
- **MUST review** with Security Expert for cryptographic operations

**Examples:**

```
"Can we add privacy features using zk-SNARKs to the wallet?"
→ Invoke bitcoinos-integration-expert agent

"I need to integrate the Grail Bridge for cross-chain transfers"
→ Invoke bitcoinos-integration-expert agent

"How can we use BitSNARK to create private transactions?"
→ Invoke bitcoinos-integration-expert agent for architecture guidance

"I want to enable Bitcoin-based smart contracts"
→ Invoke bitcoinos-integration-expert agent for feasibility and implementation plan
```

### 3. Security Expert

**Agent Type**: `bitcoin-wallet-security-expert`

**Use for ANY security-sensitive code:**

- Encryption/decryption implementation
- Key management (storage, derivation, handling)
- Password handling and validation
- Seed phrase operations
- Security audits before releases
- Threat modeling for new features
- **MUST review** all code handling private keys or sensitive data

**Examples:**

```
"I've implemented seed phrase encryption"
→ Invoke bitcoin-wallet-security-expert agent for security review

"I need to implement password strength validation"
→ Invoke bitcoin-wallet-security-expert agent

"We're adding a feature to export private keys"
→ Invoke bitcoin-wallet-security-expert agent for threat modeling

"I'm about to release v1.0 to production"
→ Invoke bitcoin-wallet-security-expert agent for security audit
```

### 4. Frontend Developer

**Agent Type**: `frontend-developer`

**Use for ALL UI work:**

- Creating or modifying React components
- Implementing user flows (wallet setup, send, receive, etc.)
- State management with Context/hooks
- Tailwind CSS styling
- Form validation and error handling
- Chrome extension popup development
- **MUST update** frontend-developer-notes.md after implementations

**Examples:**

```
"I need to create the Send Transaction form"
→ Invoke frontend-developer agent

"I've finished implementing the dashboard component"
→ Invoke frontend-developer agent to update documentation

"The transaction history is loading slowly"
→ Invoke frontend-developer agent to optimize rendering

"I need to add dark mode support"
→ Invoke frontend-developer agent for implementation
```

### 5. Backend Developer

**Agent Type**: `backend-developer`

**Use for ALL backend work:**

- Service worker implementation
- Background message handlers
- Chrome storage operations
- API client implementation (Blockstream)
- Message passing between popup and background
- Wallet encryption/decryption in background
- **MUST update** backend-developer-notes.md after implementations

**Examples:**

```
"I need to implement the CREATE_WALLET message handler"
→ Invoke backend-developer agent

"I'm getting service worker lifecycle issues"
→ Invoke backend-developer agent to investigate

"I need to add caching to the Blockstream API client"
→ Invoke backend-developer agent

"I've implemented the transaction signing handler"
→ Invoke backend-developer agent to update documentation
```

### 6. UI/UX Designer

**Agent Type**: `ui-ux-designer`

**Use for ALL design work:**

- Designing new screens or components
- Creating or updating the design system
- User flow design and interaction patterns
- Design reviews of implementations
- Accessibility standards and guidelines
- Visual design specifications
- **MUST update** design system documentation

**Examples:**

```
"We need a new feature to export transaction history"
→ Invoke ui-ux-designer agent to design the user flow

"I've finished implementing the transaction confirmation screen"
→ Invoke ui-ux-designer agent for design review

"What should the hover state look like for secondary buttons?"
→ Invoke ui-ux-designer agent for design system specs

"We need to make the wallet more accessible"
→ Invoke ui-ux-designer agent for accessibility audit
```

### 7. Product Manager

**Agent Type**: `bitcoin-wallet-product-manager`

**Use for ALL product decisions:**

- Defining feature requirements
- Creating user stories with acceptance criteria
- Prioritizing features and making scope decisions
- Reviewing implementations against requirements
- Planning releases or defining MVP scope
- Resolving product trade-offs
- **MUST validate** all features meet acceptance criteria

**Examples:**

```
"Should we add custom fee selection to MVP?"
→ Invoke bitcoin-wallet-product-manager agent

"We're ready to start building the transaction history feature"
→ Invoke bitcoin-wallet-product-manager agent for requirements

"I've finished the send transaction feature"
→ Invoke bitcoin-wallet-product-manager agent to validate acceptance criteria

"Users are requesting support for hardware wallets"
→ Invoke bitcoin-wallet-product-manager agent for prioritization decision
```

### 8. QA Engineer

**Agent Type**: `qa-engineer`

**Use for ALL testing activities:**

- Manual testing of new features
- Creating test plans and test cases
- Reporting bugs with reproduction steps
- Validating functionality on testnet
- Regression testing before releases
- Release readiness assessment
- **MUST test** all features on testnet before release

**Examples:**

```
"I've finished the send transaction feature"
→ Invoke qa-engineer agent for testing

"We're planning to release version 0.2.0 next week"
→ Invoke qa-engineer agent for release readiness assessment

"A user reported that the wallet balance doesn't update"
→ Invoke qa-engineer agent to reproduce and document the bug

"I need a test plan for the multisig wizard"
→ Invoke qa-engineer agent to create test cases
```

### 9. Testing Expert

**Agent Type**: `testing-expert`

**Use for ALL test code:**

- Writing unit tests for new components/functions
- Creating integration tests
- Setting up test infrastructure
- Reviewing test coverage
- Fixing flaky tests
- Test automation and CI/CD
- **MUST write tests** for all critical functionality

**Examples:**

```
"I've created a new TransactionList component"
→ Invoke testing-expert agent to write tests

"I've finished implementing the seed phrase encryption"
→ Invoke testing-expert agent for comprehensive test coverage

"Our GitHub Actions workflow is failing intermittently"
→ Invoke testing-expert agent to fix flaky tests

"Can you analyze our current test coverage?"
→ Invoke testing-expert agent for coverage analysis
```

## Agent Responsibilities

**Every agent MUST:**

1. **Maintain Documentation**: Update their segmented documentation files in `prompts/docs/experts/{domain}/` after EVERY significant implementation or decision
2. **Update the Index**: Keep `_INDEX.md` current with recent changes and status
3. **Document Patterns**: Record architectural decisions, code patterns, and implementation details in the appropriate segmented file
4. **Track Issues**: Note any bugs, technical debt, or areas needing improvement
5. **Cross-Reference**: Link related documentation and reference other agents' work when relevant
6. **Provide Context**: Ensure future work can understand past decisions by reading the segmented documentation

## How to Use Agents

**Use the Task tool to invoke agents:**

```
Use the Task tool with subagent_type parameter:
- bitcoin-blockchain-expert
- bitcoinos-integration-expert
- bitcoin-wallet-security-expert
- frontend-developer
- backend-developer
- ui-ux-designer
- bitcoin-wallet-product-manager
- qa-engineer
- testing-expert
```

**Example Task Tool Invocations:**

```typescript
// Example 1: Review Bitcoin transaction implementation
Task({
  subagent_type: "bitcoin-blockchain-expert",
  prompt: "Review the transaction builder implementation in src/background/bitcoin/TransactionBuilder.ts for BIP compliance and security best practices. Specifically check UTXO selection, fee calculation, and change address handling."
})

// Example 2: Security audit before release
Task({
  subagent_type: "bitcoin-wallet-security-expert",
  prompt: "Conduct a comprehensive security audit for the v1.0 release. Review all encryption, key management, and password handling code. Check for vulnerabilities and compliance with the security checklist."
})

// Example 3: Write tests for new component
Task({
  subagent_type: "testing-expert",
  prompt: "Write comprehensive unit tests and integration tests for the new SendForm component in src/popup/components/SendForm.tsx. Include tests for form validation, error handling, and user interactions."
})
```

## Cross-Functional Collaboration

Some features require multiple agents working together. Invoke agents sequentially or in parallel as needed for comprehensive coverage:

### Key Management
**Agents Required**: Security Expert + Blockchain Expert

**Workflow**:
1. Blockchain Expert designs HD wallet derivation and address generation
2. Security Expert reviews encryption, key storage, and memory handling
3. Both experts collaborate on secure key lifecycle management

**Example**:
```
"I need to implement BIP32 HD wallet key derivation"
→ Invoke bitcoin-blockchain-expert for BIP32 implementation
→ Invoke bitcoin-wallet-security-expert for security review of key handling
```

### Transaction Flow
**Agents Required**: Product Manager → UI/UX Designer → Frontend Developer → Backend Developer → Blockchain Expert

**Workflow**:
1. Product Manager defines requirements and user stories
2. UI/UX Designer creates user flows and component designs
3. Frontend Developer implements UI components
4. Backend Developer implements message handlers and transaction logic
5. Blockchain Expert reviews transaction building and signing

**Example**:
```
"We need to add a send transaction feature"
→ Invoke bitcoin-wallet-product-manager for requirements
→ Invoke ui-ux-designer for user flow design
→ Invoke frontend-developer for UI implementation
→ Invoke backend-developer for transaction handler
→ Invoke bitcoin-blockchain-expert for transaction validation
→ Invoke testing-expert for tests
→ Invoke qa-engineer for manual testing
```

### BitcoinOS Privacy Features
**Agents Required**: BitcoinOS Expert + Security Expert + Blockchain Expert + Frontend Developer

**Workflow**:
1. BitcoinOS Expert designs zk-SNARK privacy implementation
2. Security Expert audits cryptographic operations
3. Blockchain Expert validates Bitcoin protocol compliance
4. Frontend Developer implements UI for privacy features

**Example**:
```
"We want to add private transactions using BitSNARK"
→ Invoke bitcoinos-integration-expert for architecture design
→ Invoke bitcoin-wallet-security-expert for cryptographic audit
→ Invoke bitcoin-blockchain-expert for transaction validation
→ Invoke frontend-developer for UI implementation
```

### Cross-Chain Bridge
**Agents Required**: BitcoinOS Expert + Security Expert + Backend Developer + Frontend Developer

**Workflow**:
1. BitcoinOS Expert designs Grail Bridge integration
2. Security Expert reviews cross-chain security model
3. Backend Developer implements bridge API integration
4. Frontend Developer creates bridge UI

**Example**:
```
"We want to enable BTC ↔ ETH transfers via Grail Bridge"
→ Invoke bitcoinos-integration-expert for bridge architecture
→ Invoke bitcoin-wallet-security-expert for cross-chain security review
→ Invoke backend-developer for API integration
→ Invoke frontend-developer for bridge UI
```

### New Feature (Complete Flow)
**Agents Required**: Product Manager → UI/UX Designer → Frontend/Backend Developers → Domain Experts → Testing Expert → QA Engineer

**Workflow**:
1. Product Manager defines requirements and scope
2. UI/UX Designer creates user flows and designs
3. Frontend/Backend Developers implement the feature
4. Domain Experts (Security/Blockchain/BitcoinOS as needed) review implementation
5. Testing Expert writes automated tests
6. QA Engineer performs manual testing
7. Product Manager validates acceptance criteria

**Example**:
```
"We need to add hardware wallet support"
→ Invoke bitcoin-wallet-product-manager for requirements
→ Invoke ui-ux-designer for user flow
→ Invoke backend-developer for hardware wallet integration
→ Invoke bitcoin-blockchain-expert for transaction signing review
→ Invoke bitcoin-wallet-security-expert for security audit
→ Invoke testing-expert for test implementation
→ Invoke qa-engineer for manual testing
→ Invoke bitcoin-wallet-product-manager for acceptance validation
```

## Documentation Workflow

**MANDATORY Documentation Workflow:**

1. **BEFORE starting work**:
   - Read the relevant agent's `_INDEX.md` for quick reference
   - Drill into specific topic files as needed

2. **DURING work**:
   - Invoke the appropriate agent(s) using the Task tool

3. **AFTER completing work**:
   - The agent MUST update their segmented documentation:
     - Update the appropriate topic-specific file (e.g., `architecture.md`, `components.md`)
     - Update `_INDEX.md` with recent changes and current status
     - Add implementation details and decisions
     - Document code patterns and architectural choices
     - Note known issues or technical debt
     - Add cross-references to related documentation

4. **ON code review**:
   - Verify that segmented documentation has been updated

## Documentation Requirements

- All significant implementations must be documented in the appropriate segmented file
- All architectural decisions must be recorded in `decisions.md`
- All security decisions must be documented by security expert in `experts/security/`
- All Bitcoin protocol implementations must be documented by blockchain expert in `experts/blockchain/`
- Cross-references to related work in other expert documentation

These notes are the **single source of truth** for implementation details, patterns, and decisions in each domain.

**Note**: If an agent fails to update their segmented documentation, the work is considered incomplete and should not be merged.

## Proactive Agent Usage

**Best Practice**: Don't wait to be asked - invoke agents proactively!

**When to be proactive:**

1. **After implementing critical code**:
   - Just finished seed phrase encryption? → Invoke security expert immediately

2. **Before making architectural decisions**:
   - Planning a new state management pattern? → Invoke frontend/backend developer first

3. **When encountering domain-specific problems**:
   - Transaction fees seem too high? → Invoke blockchain expert to review UTXO selection

4. **After completing a feature**:
   - Dashboard is done? → Invoke testing expert for tests, QA engineer for manual testing, product manager for validation

5. **Before releases**:
   - About to tag v1.0? → Invoke security expert for audit, QA engineer for release readiness

## Common Pitfalls

❌ **DON'T**: Implement Bitcoin crypto operations yourself, then ask blockchain expert to review
✅ **DO**: Invoke blockchain expert BEFORE implementation for guidance

❌ **DON'T**: Write frontend code, then update docs yourself
✅ **DO**: Invoke frontend-developer agent to update their documentation

❌ **DON'T**: Make product scope decisions alone
✅ **DO**: Invoke product manager agent for all scope/priority decisions

❌ **DON'T**: Ship features without tests
✅ **DO**: Invoke testing-expert agent to write tests AND qa-engineer agent for manual testing

❌ **DON'T**: Assume a single agent is enough
✅ **DO**: Use cross-functional collaboration for complex features

## Quick Decision Tree

**Use this to decide which agent(s) to invoke:**

```
Is it Bitcoin protocol-related? → bitcoin-blockchain-expert
Is it BitcoinOS/zk-SNARK/cross-chain? → bitcoinos-integration-expert
Is it security/encryption/keys? → bitcoin-wallet-security-expert
Is it UI/React/frontend? → frontend-developer
Is it service worker/backend? → backend-developer
Is it design/UX? → ui-ux-designer
Is it product/requirements/scope? → bitcoin-wallet-product-manager
Is it manual testing/QA? → qa-engineer
Is it automated tests? → testing-expert

Not sure? → Invoke multiple agents in sequence or parallel
```
