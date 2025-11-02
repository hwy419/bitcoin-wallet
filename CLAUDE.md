# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bitcoin wallet Chrome/Edge browser extension built with React, TypeScript, and Tailwind CSS. Uses Manifest V3 and bitcoinjs-lib for Bitcoin operations. Currently targeting Bitcoin testnet.

**Current Status**: MVP Complete (v0.4.0) - All 4 phases complete. Fully functional Bitcoin wallet for testnet.

**Full technical details**: See `prompts/docs/plans/ARCHITECTURE.md`

---

## ⚠️ IMPORTANT: Mandatory Agent Usage

**This project requires the use of specialized Claude Code agents for ALL domain-specific work.**

When working on this project, you MUST:
1. **Invoke the appropriate agent** using the Task tool for their domain
2. **Use agents proactively** - don't wait to be asked
3. **Maintain documentation** - agents must update their notes after every significant change
4. **Review agent notes** before starting work in any domain

📖 **Detailed agent usage guide**: See `AGENT_USAGE_GUIDE.md` for when and how to use each agent

**Quick Reference:**
- Bitcoin protocol work → `bitcoin-blockchain-expert`
- BitcoinOS integration (zk-SNARKs, cross-chain) → `bitcoinos-integration-expert`
- Security/encryption → `bitcoin-wallet-security-expert`
- UI/React components → `frontend-developer`
- Service worker/background → `backend-developer`
- Design/UX → `ui-ux-designer`
- Requirements/features → `bitcoin-wallet-product-manager`
- Manual testing → `qa-engineer`
- Unit/integration tests → `testing-expert`

---

## Expert Team Structure

This project uses specialized agents in Claude Code to handle different aspects of development. **These are not just reference documents - they are active agents that MUST be invoked regularly for their areas of expertise.**

### Available Agents

| Agent | Agent Type | Documentation | Focus Area |
|-------|-----------|---------------|------------|
| **Blockchain Expert** | `bitcoin-blockchain-expert` | `prompts/docs/experts/blockchain/` → [_INDEX.md](prompts/docs/experts/blockchain/_INDEX.md) | Bitcoin protocol, BIP standards, HD wallets, transactions, UTXO management, address generation, UTXO selection |
| **BitcoinOS Expert** | `bitcoinos-integration-expert` | `prompts/docs/experts/bitcoinos/` → [_INDEX.md](prompts/docs/experts/bitcoinos/_INDEX.md) | BitSNARK (zk-SNARKs), Grail Bridge (cross-chain), Merkle Mesh, privacy features, cross-chain integration, smart contracts on Bitcoin |
| **Security Expert** | `bitcoin-wallet-security-expert` | `prompts/docs/experts/security/` → [_INDEX.md](prompts/docs/experts/security/_INDEX.md) | Encryption, key management, threat modeling, security audits, vulnerability assessment, code security review |
| **Frontend Developer** | `frontend-developer` | `prompts/docs/experts/frontend/` → [_INDEX.md](prompts/docs/experts/frontend/_INDEX.md) | React components, state management, UI implementation, Tailwind styling, popup development |
| **Backend Developer** | `backend-developer` | `prompts/docs/experts/backend/` → [_INDEX.md](prompts/docs/experts/backend/_INDEX.md) | Service worker, API integration, message passing, Chrome storage, background operations |
| **UI/UX Designer** | `ui-ux-designer` | `prompts/docs/experts/design/` → [_INDEX.md](prompts/docs/experts/design/_INDEX.md) | Design system, user flows, accessibility, UX patterns, visual design, design reviews |
| **Product Manager** | `bitcoin-wallet-product-manager` | `prompts/docs/experts/product/` → [_INDEX.md](prompts/docs/experts/product/_INDEX.md) | Requirements, features, user stories, roadmap, scope decisions, product validation |
| **QA Engineer** | `qa-engineer` | `prompts/docs/experts/qa/` → [_INDEX.md](prompts/docs/experts/qa/_INDEX.md) | Test plans, manual testing, bug tracking, quality assurance, release readiness, testnet validation |
| **Testing Expert** | `testing-expert` | `prompts/docs/experts/testing/` → [_INDEX.md](prompts/docs/experts/testing/_INDEX.md) | Unit tests, integration tests, test automation, test infrastructure, coverage analysis |

### How to Use Agents

Use the Task tool with the appropriate `subagent_type` parameter. Each agent maintains documentation in `prompts/docs/experts/{domain}/` - always check their `_INDEX.md` before starting work.

**Agent Responsibilities:**
- Update their segmented documentation after every significant change
- Keep `_INDEX.md` current with status and recent changes
- Document decisions, patterns, and known issues

📖 **Complete usage guide**: See `AGENT_USAGE_GUIDE.md` for:
- Detailed examples for each agent
- When to invoke agents (with scenarios)
- Cross-functional collaboration patterns
- Documentation workflow requirements
- Common pitfalls and best practices

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Webpack for bundling
- bitcoinjs-lib, bip32, bip39 for Bitcoin operations
- Chrome Extension Manifest V3
- Blockstream API for blockchain data

## Development Commands

```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Run tests
npm test

# Type checking
npm run type-check

# Load extension in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the dist/ folder
```

## Developer Experience

💡 **Productivity tips**: See `DEVELOPMENT_TIPS.md` for:
- Password/mnemonic pre-fill setup (saves ~30 seconds per test)
- Testnet faucets and verification
- Debugging Chrome extensions
- Performance profiling
- Development workflow best practices

## Architecture Overview

> 🏗️ **Agent Required**: Use `frontend-developer` and `backend-developer` agents for ALL architecture work
>
> **Documentation**: See `ARCHITECTURE.md` and:
> - **Frontend structure**: `prompts/docs/frontend-developer-notes.md`
> - **Backend structure**: `prompts/docs/backend-developer-notes.md`

### Extension Structure
- **Popup**: Main UI (React app, 600x400px)
- **Background Service Worker**: Crypto operations, API calls, message handling
- **Storage**: chrome.storage.local (encrypted wallet data)

### Key Components
- `src/popup/`: React UI components
- `src/background/`: Service worker with wallet logic
- `src/background/wallet/`: Key management, HD wallet (BIP32/44)
- `src/background/bitcoin/`: Transaction building, signing
- `src/background/api/`: Blockstream API client

### Communication
Popup and background communicate via chrome.runtime.sendMessage/onMessage.

📚 **Architecture details**: See `prompts/docs/plans/ARCHITECTURE.md` for complete system design, data flow diagrams, and component interactions.

## Bitcoin Implementation

> 💡 **Agent Required**: Use `bitcoin-blockchain-expert` agent for ALL Bitcoin protocol work
>
> **MANDATORY**: All Bitcoin cryptographic operations, transaction building, address generation, and UTXO management MUST be implemented or reviewed by the blockchain expert agent
>
> **Documentation**: `prompts/docs/blockchain-expert-notes.md`

### Address Types
- **Legacy** (P2PKH): Testnet addresses start with 'm' or 'n'
- **SegWit** (P2SH-P2WPKH): Start with '2'
- **Native SegWit** (P2WPKH): Start with 'tb1'

### BIP Standards
- **BIP39**: 12-word mnemonic seed phrases
- **BIP32**: Hierarchical Deterministic wallets
- **BIP44**: Derivation paths (testnet coin type = 1):
  - Legacy: `m/44'/1'/account'/change/index`
  - SegWit: `m/49'/1'/account'/change/index`
  - Native SegWit: `m/84'/1'/account'/change/index`
- **BIP48**: Multisig derivation paths (testnet coin type = 1):
  - Format: `m/48'/1'/account'/script_type'`
  - Script types: 1 (P2SH), 2 (P2WSH), 1 (P2SH-P2WSH)
- **BIP67**: Deterministic key sorting for multisig addresses
- **BIP174**: Partially Signed Bitcoin Transactions (PSBT)

📚 **Detailed specs**: See `prompts/docs/blockchain-expert-notes.md` for derivation path details, address generation algorithms, UTXO selection strategies, and transaction building logic.

### Blockstream API Integration

**Production Architecture: AWS Lambda Proxy (Recommended)**

For production deployment, the wallet uses an **AWS Lambda proxy** to secure the Blockstream API key:

```
Extension → Lambda Proxy → Blockstream API
(No API key)  (Has key, secure)  (Your paid credits)
```

**Why Lambda Proxy?**
- ✅ **Security**: API key stored on backend, never in client code (prevents theft)
- ✅ **Cost**: ~$5-10/month + Blockstream credits
- ✅ **Quick**: 6-8 hours to implement
- ✅ **Scalable**: Auto-scales to 1000 concurrent requests

**⚠️ CRITICAL**: Never bundle API keys in the extension code - they can be extracted by anyone who installs the extension!

**API Endpoints** (same interface for proxy or direct):
- GET `/address/{address}` - Balance and info
- GET `/address/{address}/txs` - Transaction history
- GET `/address/{address}/utxo` - Unspent outputs
- POST `/tx` - Broadcast transaction
- GET `/fee-estimates` - Fee recommendations

**Configuration:**
```bash
# Production (Lambda proxy - secure!)
BLOCKSTREAM_PROXY_URL=https://api.yourdomain.com/blockstream

# Development (Direct Blockstream - LOCAL ONLY, never publish!)
# Use API key in .env.local for local testing only
```

**Future Scaling**: When request volume exceeds 1-2M/month or costs exceed $150/month, consider self-hosting an Esplora node. The Lambda proxy can then forward to your self-hosted node instead of Blockstream.

📚 **Implementation details**:
- **Lambda Proxy**: See `prompts/docs/plans/BLOCKSTREAM_API_PROXY_PLAN.md` for AWS CDK implementation (PRIMARY)
- **Self-Hosted Esplora**: See `prompts/docs/plans/SELF_HOSTED_ESPLORA_AWS_PLAN.md` for future scaling
- **API Client**: See `prompts/docs/backend-developer-notes.md` for client implementation patterns
- **Architecture**: See `prompts/docs/plans/ARCHITECTURE.md` section 5 for complete proxy architecture

## Security Model

> 🔒 **Agent Required**: Use `bitcoin-wallet-security-expert` agent for ALL security-sensitive code
>
> **MANDATORY**: All encryption, key management, password handling, and sensitive data operations MUST be implemented or reviewed by the security expert agent BEFORE merge
>
> **Documentation**: `prompts/docs/security-expert-notes.md`

### Key Storage
- Seed phrases encrypted with AES-256-GCM
- Password derived using PBKDF2 (100,000 iterations)
- Decrypted keys only in memory, never persisted
- Auto-lock after 15 minutes inactivity

📚 **Detailed security specs**: See `prompts/docs/security-expert-notes.md` for encryption implementation, threat models, attack vectors, mitigation strategies, and security audit findings.

### Critical Rules
- **NEVER** log private keys or seed phrases
- **NEVER** implement custom cryptography
- **ALWAYS** validate addresses before transactions
- **ALWAYS** test on testnet first
- **ALWAYS** use bitcoinjs-lib for Bitcoin operations

⚠️ **Security review required**: All code handling keys, encryption, or sensitive data MUST be reviewed by invoking the `bitcoin-wallet-security-expert` agent before merge. NO EXCEPTIONS.

## State Management

> 🎨 **Agents Required**: Use `frontend-developer` agent for UI state and `backend-developer` agent for background state
>
> **Documentation**:
> - **Frontend Developer**: `prompts/docs/frontend-developer-notes.md`
> - **Backend Developer**: `prompts/docs/backend-developer-notes.md`

- React Context for global wallet state
- Background service worker is source of truth
- Popup syncs with background every 30 seconds when unlocked
- All Bitcoin operations happen in background worker

📚 **Implementation patterns**: Frontend notes contain React patterns, component architecture, and state management. Backend notes contain service worker patterns and message handling.

## Code Patterns

### Message Passing Example
```typescript
// Popup -> Background
const response = await chrome.runtime.sendMessage({
  type: 'SEND_TRANSACTION',
  payload: { to, amount, feeRate }
});

// Background handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SEND_TRANSACTION') {
    // Handle transaction...
    sendResponse({ success: true, txid });
  }
  return true; // Required for async
});
```

### Storage Pattern
```typescript
// Read
const data = await chrome.storage.local.get('wallet');

// Write
await chrome.storage.local.set({ wallet: encryptedData });
```

## MVP Features

> 📋 **Agents Required**:
> - Use `bitcoin-wallet-product-manager` agent for feature requirements and scope decisions
> - Use `ui-ux-designer` agent for design specifications and user flows

**Implemented Features:**
- ✅ HD wallet creation and import (BIP39/32/44)
- ✅ Multiple accounts with custom names
- ✅ All 3 address types (Legacy, SegWit, Native SegWit)
- ✅ Send/receive Bitcoin (testnet)
- ✅ Transaction history and UTXO management
- ✅ Multi-signature wallets (2-of-2, 2-of-3, 3-of-5)
- ✅ PSBT support for multisig coordination
- ✅ Private key import/export (WIF format)
- ✅ Encrypted wallet backups

📚 **Detailed specs**: See `prompts/docs/experts/product/_INDEX.md` for requirements, user stories, and acceptance criteria. See `ARCHITECTURE.md` for complete technical documentation.

## Testing on Testnet

> 🧪 **Agents Required**:
> - Use `testing-expert` agent for writing unit/integration tests
> - Use `qa-engineer` agent for manual testing and quality assurance
>
> **MANDATORY**: All new features MUST have tests written by `testing-expert` and MUST be manually tested on testnet by `qa-engineer` before release
>
> **Documentation**:
> - **Testing Expert**: `prompts/docs/testing-expert-notes.md`
> - **QA Engineer**: `prompts/docs/qa-engineer-notes.md`

1. Get testnet Bitcoin from faucet: https://testnet-faucet.mempool.co/
2. Use Blockstream testnet explorer: https://blockstream.info/testnet/
3. Verify transactions and balances
4. Test edge cases (insufficient funds, invalid addresses, etc.)

📚 **Testing details**: Testing Expert notes contain unit/integration test patterns and automation strategies. QA Engineer notes contain manual test plans, test cases, and bug tracking.

## Tester Distribution Package

**For distributing to manual testers / QA engineers:**

### Creating the Package

```bash
# Build extension first
npm run build

# Create tester distribution package
python3 create-tester-package.py

# Output: bitcoin-wallet-v0.12.0-testing-package-[DATE].zip (2.1 MB)
```

**What's Included:**
- Chrome Extension (`extension/`) - Ready to install
- Interactive Testing Guide (`testing-guide.html`) - 661 KB, GitHub-style HTML
- Launcher Scripts (`open-guide.sh`, `open-guide.bat`)
- Complete Documentation (`TESTER_README.md`, `QUICK_START.md`, etc.)
- 26+ testing guides with 127+ test cases

**Testing Guide Features:**
- ✅ Left-side navigation with search
- ✅ Interactive checkboxes (auto-saved progress)
- ✅ GitHub-style markdown rendering
- ✅ Hyperlinking between guides
- ✅ Works offline (no internet needed)
- ✅ 5-day, 16-hour systematic testing plan

**Distribution Workflow:**
1. Run `python3 create-tester-package.py` to generate zip
2. Send zip to testers (2.1 MB - email-friendly)
3. Testers extract and read `TESTER_README.md`
4. Testers install extension from `extension/` folder
5. Testers open `testing-guide.html` in browser
6. Testers follow systematic testing plan

**Regenerating After Updates:**
```bash
# If code changed
npm run build

# If testing guides markdown changed
cd TESTING_GUIDES
python3 build-html-guide.py

# Create new package
cd ..
python3 create-tester-package.py
```

📚 **Package details**: See `TESTER_PACKAGE_INFO.md` for complete distribution documentation, package contents, and tester instructions.

## Common Gotchas

- Service workers can terminate - don't rely on persistent state
- Always return `true` from message listeners for async responses
- Chrome storage has size limits (use QUOTA_BYTES)
- Manifest V3 requires service workers (not background pages)
- Content Security Policy restricts inline scripts

## Documentation & Resources

### Quick Reference
- **This File** (`CLAUDE.md`) - Project overview and agent quick reference
- **README.md** - User guide and project overview
- **CHANGELOG.md** - Complete version history
- **AGENT_USAGE_GUIDE.md** - Detailed guide on using specialized agents
- **DEVELOPMENT_TIPS.md** - Developer experience enhancements
- **TESTER_PACKAGE_INFO.md** - Tester distribution package documentation
- **DOCUMENTATION_INDEX.md** - Complete catalog of all documentation

### Key Documentation Locations

📁 **Planning Documents**: `prompts/docs/plans/` - Architecture, specifications, technical plans (see `DOCUMENTATION_INDEX.md` for complete list)

📁 **Expert Documentation**: `prompts/docs/experts/{domain}/` - Segmented topic-specific documentation
- Each domain has `_INDEX.md` for quick reference
- Detailed files cover specific topics (architecture, components, decisions, etc.)

📁 **Testing Guides**: `TESTING_GUIDES/` - Comprehensive manual testing documentation
- **testing-guide.html** - Interactive HTML guide (GitHub-style, 26+ guides)
- **MASTER_TESTING_GUIDE.md** - Complete testing workflow
- **FEATURE_TESTS/** - 15 detailed test guides (127+ test cases)
- **QUICK_START.md** - 5-minute tester onboarding
- See `TESTING_GUIDES/INDEX.md` for complete catalog

📁 **Conversation History**: `prompts/docs/chats/` - Exported Claude Code conversations

📁 **UI Design References**: `docs/ui-examples/` - Visual design inspiration

📚 **Complete index**: See `DOCUMENTATION_INDEX.md` for:
- Full planning documents table (60+ documents)
- Conversation history catalog
- Expert documentation structure details
- UI design references list
