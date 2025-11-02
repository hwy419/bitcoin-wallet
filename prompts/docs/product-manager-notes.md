# Product Manager Working Document
## Bitcoin Wallet Chrome Extension

**Last Updated:** October 21, 2025
**Document Owner:** Product Manager
**Current Phase:** v0.11.0 - Privacy Enhancement Planning Complete, Ready for Expert Audit

---

## Table of Contents
1. [Product Vision & Strategy](#product-vision--strategy)
2. [Current Product Roadmap](#current-product-roadmap)
3. [MVP Feature Specifications](#mvp-feature-specifications)
4. [Post-MVP Features](#post-mvp-features)
   - [Multisig Wallet Feature](#multisig-wallet-feature)
5. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
6. [Product Decisions Log](#product-decisions-log)
7. [Release Planning](#release-planning)
8. [Metrics & KPIs](#metrics--kpis)
9. [User Feedback & Pain Points](#user-feedback--pain-points)
10. [Competitive Analysis](#competitive-analysis)
11. [Open Questions & Risks](#open-questions--risks)

---

## Product Vision & Strategy

### Vision Statement
Create the most secure, intuitive, and user-friendly Bitcoin wallet extension that brings MetaMask-level ease of use to Bitcoin, empowering users to confidently manage their Bitcoin on testnet and eventually mainnet.

### Mission
Deliver a browser-based Bitcoin wallet that prioritizes security without sacrificing usability, making Bitcoin accessible to both newcomers and experienced users.

### Strategic Goals
1. **Security First**: Industry-leading encryption and key management
2. **Intuitive UX**: MetaMask-familiar interface for easy adoption
3. **Standards Compliance**: Full BIP32/39/44 compliance for interoperability
4. **Progressive Enhancement**: Start simple, add power features later
5. **No Backend Dependencies**: Fully client-side for maximum privacy and decentralization

### Target Market
- **Primary**: Cryptocurrency enthusiasts learning Bitcoin (testnet)
- **Secondary**: Bitcoin developers building/testing dApps
- **Future**: General users wanting browser-based Bitcoin wallet (mainnet)

### Market Opportunity
- Chrome extension marketplace has 200M+ active users
- MetaMask has proven browser wallet model
- Bitcoin-specific browser wallets are limited
- Growing need for testnet development tools

### Competitive Advantages
1. MetaMask-like multi-account experience for Bitcoin
2. Support for all 3 Bitcoin address types
3. No backend server = enhanced privacy
4. Open source and transparent
5. Chrome Manifest V3 compliance (future-proof)

---

## Current Product Roadmap

### MVP (Phase 1) - Target: Week 10
**Goal:** Fully functional testnet wallet with core features

**Core Features:**
- ✅ Wallet setup (create/import)
- ✅ Multi-account management
- ✅ Send/receive transactions
- ✅ Transaction history
- ✅ Security (encryption, auto-lock)

**Out of Scope for MVP:**
- ❌ Mainnet support
- ❌ Address book
- ❌ Advanced fee customization
- ❌ Hardware wallet support
- ❌ Multi-signature
- ❌ Lightning Network

### Phase 2: Enhanced Functionality - Target: 3 months post-MVP
**Theme:** Production Readiness & User Convenience

**Planned Features:**
- Bitcoin mainnet support (with extensive testing)
- Address book for saved contacts
- Advanced fee customization (manual sat/vB)
- Transaction labels and notes
- Export transaction history (CSV)
- Multi-currency display (USD, EUR pricing)
- Settings page improvements
- Browser notification enhancements

### Phase 3: Advanced Features - Target: 6 months post-MVP
**Theme:** Power User Features

**Planned Features:**
- ✅ Multi-signature support (2-of-2, 2-of-3, 3-of-5) - **Implemented October 2025**
- 🔄 **Bitcoin Privacy Enhancement** - **In Planning - v0.11.0**
- Multiple wallet management (switch between wallets)
- Watch-only addresses
- Connect to personal Bitcoin node
- Hardware wallet integration (Ledger, Trezor)
- Advanced UTXO management
- Custom transaction RBF (Replace-By-Fee)
- CPFP (Child-Pays-For-Parent)

### Phase 3.5: Privacy Enhancement Release (v0.11.0) - Target: November 2025
**Theme:** Privacy-by-Default Bitcoin Wallet
**Status:** Product requirements complete, ready for expert audit

**Critical Privacy Fixes (P0):**
- ✅ PRD Complete: Unique change addresses for every transaction (eliminates transaction graph analysis)
- ✅ PRD Complete: Contacts address reuse warnings and xpub rotation (protects user identity)

**High Priority Privacy Features (P1):**
- ✅ PRD Complete: Randomized UTXO selection (prevents wallet fingerprinting)
- ✅ PRD Complete: Auto-generated fresh receive addresses (encourages privacy best practices)

**Optional Privacy Mode Features:**
- ✅ PRD Complete: Round number randomization (prevents change detection)
- ✅ PRD Complete: API timing delays (prevents network clustering)
- ✅ PRD Complete: Transaction broadcast delays (prevents timing correlation)

**Documentation & Education:**
- ✅ PRD Complete: Comprehensive privacy guide (PRIVACY_GUIDE.md)
- ✅ PRD Complete: In-app privacy tips and warnings
- ✅ PRD Complete: Bitcoin Privacy Wiki compliance

**Related Documentation:**
- Technical Plan: `prompts/docs/plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md`
- Product Requirements: `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`
- Privacy Audit Report: `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md` (pending)

**Next Steps:**
1. Blockchain Expert begins transaction privacy audit (Phase 1)
2. Security Expert begins network privacy audit (Phase 1)
3. Backend Developer documents current implementation (Phase 1)
4. Compile findings into PRIVACY_AUDIT_REPORT.md
5. Begin Phase 2 implementation based on audit findings

### Phase 4: Lightning Network - Target: 12 months post-MVP
**Theme:** Instant Payments

**Planned Features:**
- Lightning Network integration
- Channel management UI
- Instant payment support
- Lightning address support
- Channel backup/restore

---

## MVP Feature Specifications

### 1. Wallet Setup Flow

#### 1.1 Create New Wallet
**Priority:** P0 (Critical)  
**User Need:** First-time users need to create a secure wallet

**Requirements:**
- Generate 12-word BIP39 seed phrase
- User selects address type (Legacy/SegWit/Native SegWit)
- User creates password (min 8 characters, strength indicator)
- Display seed phrase with copy warning
- Seed phrase confirmation step (select words in correct order)
- Security education throughout flow
- Clear visual feedback at each step

**Acceptance Criteria:**
- [ ] Generates cryptographically secure 12-word seed phrase
- [ ] Password meets strength requirements
- [ ] Seed phrase is displayed one time only
- [ ] User must confirm seed phrase before proceeding
- [ ] Wallet is encrypted and stored securely
- [ ] First account (Account 1) is created automatically
- [ ] User sees dashboard after successful creation

#### 1.2 Import Existing Wallet
**Priority:** P0 (Critical)  
**User Need:** Users need to restore wallet from backup or migrate from another wallet

**Requirements:**
- Support 12 and 24-word seed phrases
- Support single private key import (for one account)
- Input validation with clear error messages
- Address type selection
- Password creation
- Account discovery for seed phrase imports
- Support for BIP39 passphrases (advanced feature, optional)

**Acceptance Criteria:**
- [ ] Accepts valid 12 or 24-word seed phrases
- [ ] Validates seed phrase format and checksum
- [ ] Accepts WIF private keys for single account import
- [ ] Discovers existing accounts with balances
- [ ] Creates appropriate account structure
- [ ] Encrypts and stores wallet securely
- [ ] Shows dashboard with imported accounts

### 2. Account Management

#### 2.1 Multi-Account Support
**Priority:** P0 (Critical)  
**User Need:** Users want separate accounts for different purposes (personal, business, testing)

**Requirements:**
- Support unlimited accounts (BIP44 standard)
- Each account has unique derivation path
- Account dropdown similar to MetaMask
- Display account name and balance in dropdown
- Default names: "Account 1", "Account 2", etc.
- Visual indicator for currently selected account

**Acceptance Criteria:**
- [ ] Users can create new accounts
- [ ] Each account has correct BIP44 derivation path
- [ ] Account switching updates UI immediately
- [ ] All accounts are derived from single seed phrase
- [ ] Balance displays correctly for each account
- [ ] Selected account persists after extension close

#### 2.2 Custom Account Names
**Priority:** P1 (High)  
**User Need:** Users want to label accounts with meaningful names

**Requirements:**
- Edit icon next to account name
- Inline editing or modal dialog
- Name validation (max 30 characters)
- Unique names encouraged but not required
- Names stored in encrypted storage

**Acceptance Criteria:**
- [ ] Users can rename accounts
- [ ] Name changes persist across sessions
- [ ] Names display in account dropdown
- [ ] Character limit enforced (30 chars)
- [ ] Special characters allowed
- [ ] Emoji support (optional enhancement)

#### 2.3 Address Generation
**Priority:** P0 (Critical)  
**User Need:** Generate new receiving addresses for privacy

**Requirements:**
- Generate addresses on demand
- Follow BIP44 address gap limit (20)
- Support external (receiving) and internal (change) addresses
- Display current address prominently
- Show address index for power users
- Warn against excessive address generation

**Acceptance Criteria:**
- [ ] Generates valid Bitcoin addresses
- [ ] Addresses match selected address type
- [ ] Gap limit of 20 enforced
- [ ] Address derivation is deterministic
- [ ] Change addresses generated automatically
- [ ] Address reuse detection and warning

### 3. Send Transaction Flow

#### 3.1 Transaction Form
**Priority:** P0 (Critical)  
**User Need:** Send Bitcoin to another address

**Requirements:**
- Recipient address input with validation
- Amount input in BTC (with optional USD conversion)
- "Send Max" button (send all minus fees)
- Fee selection: Slow / Medium / Fast
- Display fee in sat/vB and total BTC
- Display estimated confirmation time
- Transaction preview before signing
- Password re-entry for confirmation
- Clear error messages for all failure cases

**Acceptance Criteria:**
- [ ] Validates Bitcoin address format
- [ ] Detects and warns about address type mismatches
- [ ] Prevents sending more than available balance
- [ ] Accurate fee estimation from Blockstream API
- [ ] "Send Max" calculates correctly
- [ ] Transaction preview shows all details
- [ ] Password verification before signing
- [ ] Transaction broadcasts successfully
- [ ] Shows transaction ID after broadcast
- [ ] Updates balance immediately (pending tx)

#### 3.2 UTXO Selection
**Priority:** P0 (Critical)  
**User Need:** Efficient coin selection for transactions

**Requirements:**
- Automatic UTXO selection algorithm
- Prefer confirmed UTXOs over unconfirmed
- Minimize transaction size when possible
- Handle change outputs correctly
- Consider current fee rates in selection

**Acceptance Criteria:**
- [ ] Selects sufficient UTXOs for transaction
- [ ] Minimizes fees through smart selection
- [ ] Creates change output when necessary
- [ ] Handles dust outputs appropriately
- [ ] Works with various UTXO distributions

### 4. Receive Bitcoin

#### 4.1 Address Display
**Priority:** P0 (Critical)  
**User Need:** Share receiving address with others

**Requirements:**
- Display current receiving address prominently
- QR code generation for mobile scanning
- Copy to clipboard button
- "Generate New Address" button
- Display address type (Legacy/SegWit/Native SegWit)
- Show address index for reference
- Guidance on address reuse

**Acceptance Criteria:**
- [ ] Address displays in readable format
- [ ] QR code is scannable and accurate
- [ ] Copy button provides user feedback
- [ ] New address generation works correctly
- [ ] Addresses follow BIP44 standards
- [ ] Address type clearly indicated

### 5. Transaction History

#### 5.1 Transaction List
**Priority:** P0 (Critical)  
**User Need:** View past transactions

**Requirements:**
- List all transactions for current account
- Show sent and received transactions distinctly
- Display amount, fee (for sent), confirmations
- Show timestamp or "Pending" status
- Link to Blockstream block explorer
- Pagination or infinite scroll for large histories
- Refresh button to update history

**Acceptance Criteria:**
- [ ] Displays all account transactions
- [ ] Correctly identifies sent vs. received
- [ ] Shows confirmation count or pending status
- [ ] Amounts displayed accurately
- [ ] Block explorer links work correctly
- [ ] Real-time updates for pending transactions
- [ ] Handles empty state (no transactions)

#### 5.2 Transaction Details
**Priority:** P1 (High)  
**User Need:** View detailed transaction information

**Requirements:**
- Expand transaction to see full details
- Show all inputs and outputs
- Display transaction size and fee rate
- Show block height and timestamp
- Display transaction ID (with copy)
- Show confirmations progress

**Acceptance Criteria:**
- [ ] All transaction data displayed accurately
- [ ] Inputs and outputs are clear
- [ ] Fee calculations are correct
- [ ] Links to block explorer work
- [ ] Copy transaction ID works
- [ ] Loading states handled properly

### 6. Security Features

#### 6.1 Password Protection
**Priority:** P0 (Critical)  
**User Need:** Protect wallet from unauthorized access

**Requirements:**
- Password required on first use
- Unlock screen after lock or extension restart
- Password strength requirements (min 8 chars)
- Password strength indicator during creation
- "Show/Hide password" toggle
- No password recovery (intentional design)
- Clear messaging about password importance

**Acceptance Criteria:**
- [ ] Cannot access wallet without password
- [ ] Password strength enforced
- [ ] Incorrect password shows error
- [ ] Password never stored in plain text
- [ ] Service worker restart requires re-unlock
- [ ] Clear security guidance provided

#### 6.2 Auto-Lock
**Priority:** P1 (High)  
**User Need:** Automatic wallet lock for security

**Requirements:**
- Auto-lock after 15 minutes of inactivity
- User can manually lock wallet
- All sensitive data cleared from memory on lock
- Configurable timeout in settings (future)
- Lock icon/button always visible

**Acceptance Criteria:**
- [ ] Wallet locks after 15 minutes idle
- [ ] Manual lock button works
- [ ] All decrypted data cleared on lock
- [ ] Cannot perform operations when locked
- [ ] Unlock flow is smooth
- [ ] No data leakage after lock

#### 6.3 Encrypted Storage
**Priority:** P0 (Critical)  
**User Need:** Secure storage of sensitive data

**Requirements:**
- AES-256-GCM encryption for seed phrase
- PBKDF2 key derivation (100,000 iterations)
- Unique salt per wallet
- Secure random IV generation
- Only store encrypted data in chrome.storage
- Never log sensitive information

**Acceptance Criteria:**
- [ ] Seed phrase encrypted with AES-256-GCM
- [ ] PBKDF2 with 100k iterations minimum
- [ ] Unique salt generated per wallet
- [ ] Encryption verified through audit
- [ ] No sensitive data in plain text storage
- [ ] Audit logs confirm no leakage

---

## Post-MVP Features

### Multisig Wallet Feature

**Status:** Fully Implemented with Tab-Based Architecture (October 2025)
**Initial Release:** v0.8.0 (Core multisig functionality)
**Enhanced UX Release:** v0.9.0 (Tab-based wizard - see Tab Architecture section above)
**Priority:** P1 (High)

**Related Documentation:**
- Tab architecture transformation: See "Tab-Based Architecture Transformation (v0.9.0)" section above
- Original tab-based wizard PRD: `prompts/docs/plans/TAB_BASED_MULTISIG_WIZARD_PRD.md`
- Wizard UI design specs: `prompts/docs/plans/MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`

#### Feature Overview

Multi-signature (multisig) wallet support enables users to create Bitcoin accounts that require multiple signatures to authorize transactions. This provides enhanced security for high-value holdings and enables use cases like business partnerships, inheritance planning, and institutional custody.

**Key Value Propositions:**
1. **Enhanced Security**: No single point of failure - requires cooperation of multiple parties
2. **Business Use Cases**: Joint accounts for partnerships, board approvals, treasury management
3. **Inheritance Planning**: 2-of-3 setups with family members and trusted advisors
4. **Institutional Grade**: Multi-party approval workflows for corporate Bitcoin holdings
5. **Compliance**: Meet organizational requirements for multi-party authorization

#### Supported Configurations

The wallet supports three carefully chosen multisig configurations that cover the most common real-world use cases:

| Configuration | Description | Primary Use Case | Security Level |
|---------------|-------------|------------------|----------------|
| **2-of-2** | Both parties must sign | Joint accounts, partnerships | High |
| **2-of-3** | Any 2 of 3 parties must sign | Inheritance, small teams | Very High |
| **3-of-5** | Any 3 of 5 parties must sign | DAOs, larger organizations | Highest |

**Why These Configurations?**
- **2-of-2**: Simplest multisig, perfect for two-party arrangements (spouses, business partners)
- **2-of-3**: Industry standard, balances security with recovery options (one key can be lost)
- **3-of-5**: Enterprise-grade for larger organizations requiring majority consensus

**Decision Rationale:**
These three configurations cover 90%+ of real-world multisig use cases based on industry research. More complex configurations (4-of-7, 5-of-9, etc.) will be considered based on user demand post-launch.

#### Technical Implementation

**BIP Standards Compliance:**
- **BIP48**: Multisig HD wallet derivation paths
- **BIP67**: Deterministic P2SH multisig address ordering
- **BIP174**: Partially Signed Bitcoin Transactions (PSBT) for coordination

**Address Type Support:**
- **P2SH (Legacy Multisig)**: `3...` addresses, broad compatibility
- **P2WSH (Native SegWit Multisig)**: `tb1q...` addresses, lowest fees, best privacy
- **P2SH-P2WSH (Nested SegWit)**: `2...` addresses, compatibility + some SegWit benefits

**Derivation Paths (BIP48):**
```
m/48'/{coin_type}'/{account}'/{script_type}'/{change}/{index}

Where:
- coin_type = 1 (testnet) or 0 (mainnet)
- script_type = 1 (P2SH), 2 (P2WSH), or 1 (P2SH-P2WSH)
- change = 0 (receiving) or 1 (change)
- index = address index
```

#### User Journey & Workflow

**Phase 1: Setup (Coordinator)**
1. User chooses "Create Multisig Account" from account dropdown
2. Selects configuration (2-of-2, 2-of-3, or 3-of-5)
3. Reviews educational content about their chosen configuration
4. Selects address type (P2SH, P2WSH, or P2SH-P2WSH)
5. Exports their extended public key (xpub) to share with co-signers

**Phase 2: Coordination (All Co-signers)**
1. Each co-signer generates and shares their xpub
2. All co-signers import the other co-signers' xpubs
3. Wallet derives multisig addresses using all xpubs
4. All co-signers verify they see identical receiving addresses

**Phase 3: Receiving Funds**
1. Any co-signer can generate and share receiving addresses
2. All co-signers can independently verify addresses match
3. Funds received to multisig address require M signatures to spend

**Phase 4: Spending (Transaction Workflow)**
1. **Initiator**: Creates transaction with recipient, amount, fee
2. **Initiator**: Signs with their key, exports PSBT
3. **Co-signer(s)**: Import PSBT, review transaction details
4. **Co-signer(s)**: Sign with their key(s), update PSBT
5. **Final Signer**: Broadcasts fully-signed transaction to network

#### User Education & Help Content

A comprehensive help content library has been implemented to guide users through multisig concepts and workflows:

**Configuration Selection Help:**
- **Comparison Table**: Side-by-side comparison of all configurations
- **Risk Assessment**: Security level, recovery options, coordination needs
- **Use Case Examples**: Real-world scenarios for each configuration
- **Decision Guide**: Interactive questions to help choose the right setup

**Concept Education:**
- **What is Multisig?**: Plain-language explanation of multi-signature wallets
- **How Does It Work?**: Visual walkthrough of the coordination process
- **xpub Explanation**: What extended public keys are and why they're safe to share
- **PSBT Overview**: Understanding Partially Signed Bitcoin Transactions
- **Security Best Practices**: Guidelines for secure multisig usage

**Step-by-Step Guides:**
- **Setup Guide**: Complete walkthrough from creation to receiving
- **Transaction Guide**: How to initiate, sign, and broadcast multisig transactions
- **Troubleshooting**: Common issues and solutions
- **Address Verification**: How to independently verify multisig addresses

**Technical Glossary:**
- M-of-N signatures
- Extended public keys (xpub)
- PSBT format and workflow
- Derivation paths
- Script types and address formats

#### Completed User Stories

##### Story MS.1: Choose Multisig Configuration
```
As a user wanting enhanced security
I want to create a 2-of-3 multisig wallet for my business partnership
So that no single person can unilaterally move company funds

Acceptance Criteria:
✅ I can access multisig creation from the account management interface
✅ I see three configuration options: 2-of-2, 2-of-3, and 3-of-5
✅ Each configuration shows security level and use case examples
✅ I can access detailed help content for each configuration
✅ The interface guides me through the decision-making process
✅ I receive clear warnings about coordination requirements
```

##### Story MS.2: Export Extended Public Key
```
As a multisig coordinator
I want to export my xpub to share with other co-signers
So that we can create a coordinated multisig account

Acceptance Criteria:
✅ I can export my xpub after selecting configuration
✅ The xpub export includes all necessary derivation information
✅ I can copy the xpub to clipboard easily
✅ I can export as QR code for mobile scanning
✅ I see clear guidance that xpub sharing is safe
✅ The export format is standard and interoperable
✅ Derivation path information is included with xpub
```

##### Story MS.3: Import Co-signer xpubs
```
As a multisig participant
I want to import other co-signers' xpubs to create the multisig account
So that I can generate shared addresses for receiving funds

Acceptance Criteria:
✅ I can import xpubs via text input or QR code scan
✅ I can import multiple xpubs (one per co-signer)
✅ The wallet validates xpub format and compatibility
✅ I see which co-signers I've imported (1 of 2, 2 of 3, etc.)
✅ I can't proceed until all required xpubs are imported
✅ The wallet detects and prevents duplicate xpub imports
✅ I see clear error messages for invalid xpubs
```

##### Story MS.4: Verify Multisig Addresses
```
As a multisig co-signer
I want to independently verify that all co-signers see the same addresses
So that I can trust funds sent to these addresses

Acceptance Criteria:
✅ The wallet displays the first multisig receiving address
✅ All co-signers using same xpubs see identical addresses
✅ I can verify address derivation independently
✅ The wallet shows which xpubs contributed to the address
✅ I receive guidance on verification best practices
✅ Address format matches selected type (P2SH/P2WSH/P2SH-P2WSH)
```

##### Story MS.5: Initiate Multisig Transaction
```
As a multisig account holder
I want to initiate a transaction and export a PSBT
So that co-signers can review and sign the transaction

Acceptance Criteria:
✅ I can create transactions from multisig accounts
✅ The transaction form shows required signature count (M of N)
✅ I can specify recipient, amount, and fee like single-sig
✅ The wallet builds a valid PSBT with my signature
✅ I can export the PSBT in multiple formats (base64, file, QR)
✅ The PSBT includes all necessary transaction details
✅ I see clear indication that additional signatures are needed
```

##### Story MS.6: Sign Partially Signed Transaction
```
As a multisig co-signer
I want to sign a PSBT with my key
So that the transaction can be completed and broadcast

Acceptance Criteria:
✅ I can import PSBTs via text, file upload, or QR code
✅ The wallet displays full transaction details before signing
✅ I see which signatures are already present (X of M signed)
✅ I can sign with my key after reviewing details
✅ The wallet updates the PSBT with my signature
✅ I can export the updated PSBT for the next signer
✅ If I'm the final signer, I can broadcast immediately
✅ The wallet validates PSBT compatibility with my wallet
```

##### Story MS.7: Access Multisig Help Content
```
As a user new to multisig wallets
I want clear guidance on which configuration to choose
So that I can make an informed decision for my use case

Acceptance Criteria:
✅ I can access help content from the configuration selection screen
✅ I see use case examples for each configuration
✅ I see security trade-offs explained clearly
✅ I can access a glossary of technical terms
✅ I see step-by-step guides for the entire process
✅ I can access help content at any point in the workflow
✅ The content is written in plain language for non-technical users
✅ Visual aids and diagrams enhance understanding
```

#### Feature Acceptance Criteria Summary

**Configuration Support:**
✅ Support for exactly 3 configurations: 2-of-2, 2-of-3, 3-of-5
✅ All configurations tested and validated on testnet
✅ Clear documentation for each configuration
✅ User education integrated into selection flow

**BIP Compliance:**
✅ BIP48 multisig derivation paths implemented correctly
✅ BIP67 deterministic key ordering for address generation
✅ BIP174 PSBT creation, signing, and finalization
✅ Full interoperability with other BIP-compliant wallets

**Address Type Support:**
✅ P2SH (Legacy) multisig addresses
✅ P2WSH (Native SegWit) multisig addresses
✅ P2SH-P2WSH (Nested SegWit) multisig addresses
✅ Address type selection with clear trade-off explanations
✅ Correct fee estimation for each address type

**User Experience:**
✅ Intuitive configuration selection interface
✅ Clear xpub import/export workflows
✅ Visual feedback for coordination progress
✅ Comprehensive error handling and validation
✅ Help content accessible throughout workflow
✅ PSBT support for transaction coordination

**Security:**
✅ Private keys never shared between co-signers
✅ Only xpubs (public keys) are exchanged
✅ PSBT format prevents malicious transaction modification
✅ Address verification guidance provided
✅ Clear warnings about coordination requirements
✅ Testnet-only for initial release

**User Education:**
✅ Configuration comparison table with risk levels
✅ Use case examples for each configuration
✅ Technical glossary for multisig terms
✅ Step-by-step setup and transaction guides
✅ Security best practices documentation
✅ Troubleshooting guide for common issues

#### Implementation Status

**✅ Completed:**
- Core multisig infrastructure (MultiSigAccount class)
- BIP48 derivation path implementation
- BIP67 deterministic key ordering
- BIP174 PSBT builder and signer
- Configuration models (2-of-2, 2-of-3, 3-of-5)
- Address generation for all 3 types
- xpub import/export utilities
- Help content library (MultisigHelpContent.tsx)
- Configuration selection UI components
- Educational content integration

**⏳ In Progress:**
- Complete multisig account creation UI flow
- PSBT management interface
- Transaction signing workflow UI
- Background service worker message handlers
- Integration with existing wallet state management

**📋 Pending:**
- End-to-end testing of complete multisig workflows
- Testnet validation with actual multisig transactions
- Hardware wallet integration for multisig signing
- Descriptor import/export for advanced users
- Mainnet support (post-testnet validation)

---

## Multisig Wallet UI Implementation Requirements

**Document Version:** 1.0
**Created:** October 12, 2025
**Status:** Product Requirements - Ready for Implementation
**Target Release:** v0.9.0

### Executive Summary

The Bitcoin Wallet Extension currently has NO multisig wallet UI despite having core infrastructure (MultisigManager, BIP48/67/174 support, and help content). This document defines comprehensive product requirements to implement a complete, user-friendly multisig wallet experience.

**Goal:** Enable users to create and manage 2-of-2, 2-of-3, and 3-of-5 multisig wallets with an intuitive UI that guides them through the complexity of multi-party Bitcoin custody.

**Core Value Proposition:**
- **Enhanced Security:** Multi-party approval for high-value holdings
- **Business Use Cases:** Joint accounts, partnerships, treasury management
- **Backup Protection:** Lose one key, still access funds (2-of-3, 3-of-5)
- **User-Friendly:** Complex Bitcoin multisig made accessible to non-technical users

---

### Phase 1: MVP Scope Definition

**What We MUST Build for v0.9.0:**

**Core Workflows:**
1. ✅ Create multisig account (configuration selection, xpub coordination)
2. ✅ Receive to multisig addresses (address display, verification)
3. ✅ Initiate multisig transaction (PSBT creation, export)
4. ✅ Sign PSBT (import, review, sign, export)
5. ✅ Track pending multisig transactions (signature progress)

**What We Can Defer to v1.0:**
- Hardware wallet integration for multisig signing
- Descriptor import/export (BIP380/381/382)
- Address scanning and discovery for imported wallets
- Batch transaction signing
- Multisig vault workflows with time locks
- Custom M-of-N configurations beyond 2-of-2, 2-of-3, 3-of-5

---

### User Stories with Detailed Acceptance Criteria

#### Epic 1: Multisig Account Creation

##### Story MS.UI.1: Access Multisig Account Creation

```
As a user wanting enhanced security
I want to create a new multisig account from the dashboard
So that I can start coordinating with co-signers

Acceptance Criteria:
✅ I can access multisig creation from the account dropdown menu
✅ I see a clear "Create Multisig Account" option separate from regular accounts
✅ The option is available on all screens with account selector
✅ Clicking opens the multisig setup wizard
✅ I see a brief explanation of what multisig is before starting
✅ I can cancel at any point and return to dashboard
✅ The UI is visually distinct from single-sig account creation
✅ Help icon provides access to educational content
```

**UI Components Required:**
- Account dropdown menu item for "Create Multisig Account"
- Multisig wizard entry point
- Brief introductory screen with benefits and use cases
- Cancel/Back navigation throughout wizard

---

##### Story MS.UI.2: Choose Multisig Configuration

```
As a user setting up multisig
I want to understand and select the right configuration (2-of-2, 2-of-3, 3-of-5)
So that I choose the setup that matches my security needs

Acceptance Criteria:
✅ I see all three configuration options clearly displayed
✅ Each configuration shows:
   - M-of-N format (e.g., "2-of-3")
   - Risk level indicator (high/low/very-low)
   - Primary use case tagline
   - Example scenarios
   - Key warnings
✅ I can expand each option to see full details
✅ 2-of-3 is visually marked as "Recommended"
✅ I can access comparison table showing all three side-by-side
✅ Help content is accessible via "Learn More" links
✅ I cannot proceed without selecting a configuration
✅ My selection is highlighted/confirmed before proceeding
✅ I can go back to change my selection
```

**UI Components Required:**
- Configuration selection cards (3 cards: 2-of-2, 2-of-3, 3-of-5)
- Expandable detail sections per configuration
- Comparison table modal
- Visual indicators for risk level and recommendation
- Help content integration
- Selection state management

**Design Requirements:**
- Use existing ConfigSelector.tsx component as foundation
- Risk level color coding: Red (high), Yellow (low), Green (very-low)
- Recommended badge for 2-of-3 configuration
- Clear visual hierarchy (most common use case first)
- Mobile-responsive card layout

---

##### Story MS.UI.3: Choose Address Type

```
As a user creating a multisig account
I want to select the appropriate address type
So that I can balance fees, compatibility, and features

Acceptance Criteria:
✅ I see three address type options: P2WSH (Native SegWit), P2SH-P2WSH (Wrapped), P2SH (Legacy)
✅ Each option displays:
   - Full name and technical abbreviation
   - Testnet/mainnet address prefix
   - Fee level indicator (lowest/lower/higher)
   - Compatibility level (modern/good/maximum)
   - Pros and cons list
✅ P2WSH (Native SegWit) is marked as "Recommended"
✅ I see clear guidance on when to choose each type
✅ I can access detailed technical explanation
✅ I cannot proceed without selecting an address type
✅ My selection matches with co-signers' requirement
✅ Warning if I select non-recommended option (P2SH)
```

**UI Components Required:**
- Address type selection cards (3 cards)
- Pros/cons lists with icons
- Recommendation badge for P2WSH
- Educational tooltips for technical terms
- Compatibility warning system

**Design Requirements:**
- Consistent with single-sig address type selection
- Fee level visualization (icons or color coding)
- Technical details in expandable sections
- Compatibility matrix if needed

---

##### Story MS.UI.4: Export Extended Public Key (xpub)

```
As the multisig coordinator
I want to export my xpub to share with co-signers
So that we can create a coordinated multisig account

Acceptance Criteria:
✅ I see my xpub displayed in a readable format
✅ I can copy xpub to clipboard with one click
✅ I see copy confirmation feedback
✅ I can display xpub as QR code for mobile scanning
✅ QR code is large enough to scan reliably
✅ I see my key fingerprint displayed prominently
✅ I see clear instructions: "Share this xpub with co-signers"
✅ I see security note: "Safe to share - this is PUBLIC key only"
✅ I can download xpub as text file
✅ Filename includes configuration and date (e.g., "xpub-2of3-2025-10-12.txt")
✅ I see derivation path information
✅ I can see which configuration this xpub is for
✅ Warning: "All co-signers must use SAME configuration"
```

**UI Components Required:**
- xpub display area (monospace font, selectable text)
- Copy to clipboard button with confirmation
- QR code generator and display
- Download as file button
- Fingerprint display (highlighted, large font)
- Security reassurance messaging
- Configuration reminder

**Technical Requirements:**
- Use existing QR code library (qrcode)
- xpub export format includes all metadata
- QR code chunking for large data (if needed)
- Clipboard API integration
- File download functionality

---

##### Story MS.UI.5: Import Co-signer Extended Public Keys

```
As a multisig participant
I want to import xpubs from other co-signers
So that we can generate shared multisig addresses

Acceptance Criteria:
✅ I see input fields for each required co-signer xpub
✅ For 2-of-2: I see 1 input (for other co-signer)
✅ For 2-of-3: I see 2 inputs (for 2 other co-signers)
✅ For 3-of-5: I see 4 inputs (for 4 other co-signers)
✅ I can paste xpub directly into input field
✅ I can scan QR code to import xpub
✅ I can upload xpub file to import
✅ Each imported xpub shows:
   - Co-signer nickname (editable)
   - Key fingerprint
   - Derivation path
   - Configuration match indicator
✅ I see validation errors for:
   - Invalid xpub format
   - Duplicate xpubs (same co-signer twice)
   - Configuration mismatch
   - Wrong network (mainnet vs testnet)
✅ I see progress indicator (e.g., "2 of 3 xpubs imported")
✅ I cannot proceed until all xpubs are imported
✅ I can remove/replace imported xpub
✅ I can go back to re-export my xpub
```

**UI Components Required:**
- Dynamic xpub input fields (based on configuration)
- Multiple input methods: paste, QR scan, file upload
- Co-signer nickname editor
- Validation feedback (inline errors)
- Progress indicator
- Remove/edit imported xpub buttons
- Configuration match verification display

**Technical Requirements:**
- xpub validation against BIP48 format
- Fingerprint extraction and display
- Configuration matching logic
- QR code scanning (camera access permission)
- File upload handling
- State management for imported xpubs

---

##### Story MS.UI.6: Verify Multisig Address Match

```
As a multisig co-signer
I want to verify that all co-signers see the same first receiving address
So that I can trust funds sent to these addresses

Acceptance Criteria:
✅ I see the first multisig receiving address prominently displayed
✅ The address is in the correct format (P2WSH/P2SH-P2WSH/P2SH)
✅ I can copy the address to clipboard
✅ I see clear instruction: "Verify this address matches with all co-signers"
✅ I see a checklist of verification steps:
   - ✅ All co-signers selected SAME configuration
   - ✅ All co-signers selected SAME address type
   - ✅ All co-signers imported SAME xpubs
   - ✅ First address matches on all wallets
✅ I see recommended verification method: "Call or video chat with each co-signer"
✅ I can display address as QR code for easy comparison
✅ I see warning: "DO NOT fund until address is verified with all co-signers"
✅ I can see derivation path for the address
✅ I must check confirmation box before finalizing
✅ Confirmation text: "I have verified this address with all co-signers"
```

**UI Components Required:**
- Large, prominent address display
- Copy button with confirmation
- QR code display for address
- Verification checklist (with checkboxes/progress indicators)
- Warning banner about verification importance
- Confirmation checkbox before proceeding
- Derivation path display (for technical users)

**Design Requirements:**
- High visual emphasis on address verification
- Color coding: Warning yellow/orange for unverified, green for confirmed
- Clear call-to-action for verification
- Step-by-step verification guide

---

##### Story MS.UI.7: Finalize Multisig Account Creation

```
As a multisig creator
I want to finalize and save my multisig account
So that I can start receiving and sending funds

Acceptance Criteria:
✅ I can set a custom name for the multisig account
✅ Default name format: "Multisig 2-of-3 #1"
✅ I see account summary before finalizing:
   - Configuration (M-of-N)
   - Address type
   - All co-signer names and fingerprints
   - First receiving address
   - Number of signatures required per transaction
✅ I can review and edit any settings before finalizing
✅ I see estimated setup time remaining
✅ I see success message after account creation
✅ Account appears in account dropdown immediately
✅ Account is marked visually as "Multisig" in dropdown
✅ I see option to fund account immediately (Receive flow)
✅ I can access help for "What's next?" guidance
```

**UI Components Required:**
- Account name input field
- Account summary screen
- Edit/back navigation for corrections
- Success confirmation screen
- Account dropdown integration
- Visual multisig indicator (icon/badge)
- "What's next?" help section

**Technical Requirements:**
- Save multisig account to chrome.storage
- Update account list in wallet state
- Generate multisig addresses following BIP48
- Integrate with existing account switching

---

#### Epic 2: Receive to Multisig Address

##### Story MS.UI.8: Display Multisig Receiving Address

```
As a multisig account holder
I want to view my current receiving address
So that I can share it for incoming payments

Acceptance Criteria:
✅ When multisig account is selected, Receive screen shows multisig address
✅ Address format matches configured type (P2WSH/P2SH-P2WSH/P2SH)
✅ I see visual indicator that this is a MULTISIG address
✅ I see "M-of-N Multisig" label on address card
✅ I can copy address to clipboard
✅ I see QR code for the address
✅ I see which co-signers have keys for this address
✅ I see reminder: "Requires M signatures to spend"
✅ I can generate new multisig address
✅ I see address derivation path (for verification with co-signers)
✅ I see warning: "Ensure co-signers can also derive this address"
```

**UI Components Required:**
- Multisig address display (visually distinct from single-sig)
- M-of-N indicator badge
- Co-signer list/avatars
- Signature requirement reminder
- QR code display
- Derivation path display
- Address generation button

**Design Requirements:**
- Extend existing ReceiveScreen.tsx
- Different visual styling for multisig addresses
- Clear distinction between single-sig and multisig
- Warning/info messages about coordination

---

#### Epic 3: Send from Multisig Account (PSBT Workflow)

##### Story MS.UI.9: Initiate Multisig Transaction

```
As a multisig account holder
I want to create a transaction from my multisig account
So that I can initiate spending that requires co-signer approval

Acceptance Criteria:
✅ When multisig account is selected, Send screen shows multisig indicators
✅ I see "Multisig M-of-N Transaction" at top of form
✅ I see reminder: "This transaction needs M signatures to broadcast"
✅ I can enter recipient address (same validation as single-sig)
✅ I can enter amount in BTC (same UX as single-sig)
✅ I can select fee rate (slow/medium/fast)
✅ I see transaction preview with all details
✅ I see PSBT creation confirmation:
   - "Creating partially signed Bitcoin transaction"
   - "You will be signature 1 of M"
✅ Transaction preview shows:
   - Recipient address
   - Amount to send
   - Fee amount
   - Current signatures: 1 of M
   - Co-signers needed: (M-1) more
✅ I can cancel before signing
✅ After I sign, I see next steps clearly displayed
```

**UI Components Required:**
- Multisig transaction indicator header
- Signature requirements reminder
- Standard send form (reused from SendScreen.tsx)
- PSBT creation feedback
- Modified transaction preview for multisig
- Signature progress indicator
- Next steps guidance

**Technical Requirements:**
- Detect multisig account type in SendScreen
- Build PSBT instead of complete transaction
- Sign PSBT with current user's key
- Track signature count
- Prevent duplicate signatures

---

##### Story MS.UI.10: Export PSBT for Co-signers

```
As the transaction initiator
I want to export the partially signed PSBT
So that I can share it with co-signers for their signatures

Acceptance Criteria:
✅ After signing, I see PSBT export options screen
✅ I can export PSBT in multiple formats:
   - Base64 text (copy to clipboard)
   - Hex format (for advanced users)
   - File download (.psbt extension)
   - QR code (chunked if large)
✅ I see recommended export method based on coordination approach
✅ For each export method, I see usage instructions
✅ I can export in multiple formats simultaneously
✅ I see PSBT metadata:
   - Transaction ID (once broadcast)
   - Amount and recipient
   - Signature count (1 of M)
   - Creation timestamp
✅ I see security reminder: "Verify transaction details with co-signers before they sign"
✅ I can save PSBT to "Pending Transactions" list
✅ I see "Share with co-signers" action buttons:
   - Copy link (if sharing via messaging)
   - Show QR code (if in-person)
   - Download file (if using air-gapped devices)
```

**UI Components Required:**
- PSBT export modal
- Format selection tabs (Base64/Hex/File/QR)
- Copy to clipboard buttons
- File download button
- QR code display (with chunking)
- PSBT metadata display
- Security messaging
- Share action buttons
- Pending transactions integration

**Technical Requirements:**
- PSBT base64 encoding
- PSBT hex encoding
- File generation and download
- QR code chunking for large PSBTs
- PSBT serialization
- Pending transaction storage

---

##### Story MS.UI.11: Import PSBT from Co-signer

```
As a co-signer
I want to import a PSBT that needs my signature
So that I can review and sign the transaction

Acceptance Criteria:
✅ I can access "Sign PSBT" from multisig account menu
✅ I see multiple import methods:
   - Paste base64/hex PSBT
   - Upload .psbt file
   - Scan QR code
   - Import from pending transactions list
✅ I see PSBT validation feedback:
   - Valid/invalid format
   - Correct network (testnet/mainnet)
   - Matches my multisig account
   - Already signed by me (if applicable)
✅ If PSBT is valid, I see full transaction details:
   - Recipient address
   - Amount to send
   - Fee amount
   - Current signature count (e.g., "2 of 3 signed")
   - Which co-signers have signed (by fingerprint)
   - Which signatures are still needed
✅ I see my role: "You are co-signer [name]" (if set)
✅ I see warning if transaction details look suspicious
✅ I can cancel import at any time
✅ I see clear indication whether I have already signed this PSBT
```

**UI Components Required:**
- PSBT import modal/screen
- Multiple import method tabs
- PSBT validation feedback
- Transaction detail display
- Signature progress visualization
- Co-signer identification
- Security warnings
- Already-signed detection

**Technical Requirements:**
- PSBT parsing (base64, hex, file, QR)
- PSBT validation against wallet
- Signature extraction and counting
- Co-signer fingerprint matching
- Duplicate signature detection
- QR code scanning (camera permission)

---

##### Story MS.UI.12: Review and Sign PSBT

```
As a co-signer
I want to review transaction details carefully and add my signature
So that I can approve spending from the multisig account

Acceptance Criteria:
✅ I see comprehensive transaction review screen:
   - FROM: Multisig account name and address
   - TO: Recipient address (with type indicator)
   - AMOUNT: BTC and USD equivalent
   - FEE: BTC and USD, plus fee rate (sat/vB)
   - TOTAL: Amount + Fee
   - Signatures: Current count (e.g., "2 of 3")
   - Who has signed: List of co-signers by name/fingerprint
   - Who needs to sign: Remaining co-signers
✅ I see ALL transaction inputs and outputs (advanced view)
✅ I see warning: "Verify recipient address and amount with other co-signers"
✅ I must scroll to bottom to see "Sign" button (ensures review)
✅ I must re-enter password to sign
✅ After signing, I see confirmation:
   - "Signature added successfully"
   - New signature count (e.g., "3 of 3 - Ready to broadcast!")
   - My signature fingerprint added to PSBT
✅ If I'm the final signer (M signatures reached):
   - I see "Transaction ready to broadcast!" message
   - I can broadcast immediately OR export for someone else to broadcast
✅ If more signatures needed:
   - I see updated PSBT with my signature
   - I can export updated PSBT for next co-signer
```

**UI Components Required:**
- Transaction review screen (detailed)
- Input/output visualization (advanced)
- Security warnings and guidance
- Scroll-to-review UX pattern
- Password re-entry modal
- Signature confirmation screen
- Signature progress update
- Final signature / broadcast decision flow
- Export updated PSBT flow

**Technical Requirements:**
- PSBT signing with user's key
- Signature count validation
- Final signature detection (M-of-N reached)
- Broadcast readiness check
- Updated PSBT serialization

---

##### Story MS.UI.13: Broadcast Fully-Signed Transaction

```
As the final co-signer OR any co-signer with fully-signed PSBT
I want to broadcast the transaction to the Bitcoin network
So that the funds are sent to the recipient

Acceptance Criteria:
✅ I see "Ready to Broadcast" indicator when M signatures collected
✅ I see final transaction summary:
   - All M signatures present and verified
   - Total amount and fee
   - Recipient address
   - Estimated confirmation time
✅ I see broadcast button clearly highlighted
✅ I see warning: "Broadcasting is irreversible"
✅ I must confirm broadcast action
✅ After broadcast, I see success screen:
   - Transaction ID (with copy button)
   - Link to Blockstream explorer
   - Estimated confirmation time
   - "Transaction sent successfully!" message
✅ Transaction moves from "Pending" to "Sent" in transaction history
✅ Multisig account balance updates immediately
✅ I can share transaction ID with co-signers
✅ If broadcast fails, I see clear error message and retry option
```

**UI Components Required:**
- Broadcast readiness indicator
- Final confirmation modal
- Broadcast button (prominent, clear)
- Transaction success screen
- Explorer link integration
- Balance update notification
- Error handling UI
- Share transaction ID option

**Technical Requirements:**
- PSBT finalization (convert to raw transaction)
- Transaction broadcast to network
- Transaction ID extraction
- Balance refresh trigger
- Transaction history update
- Error handling (network issues, fee too low, etc.)

---

#### Epic 4: Pending Multisig Transactions

##### Story MS.UI.14: View Pending Multisig Transactions

```
As a multisig account user
I want to see all pending transactions that need signatures
So that I know which PSBTs require my attention

Acceptance Criteria:
✅ I see "Pending Transactions" section in multisig account view
✅ I see a list of all pending PSBTs for this account
✅ Each pending transaction shows:
   - Recipient address (truncated)
   - Amount in BTC (and USD)
   - Current signature count (e.g., "1 of 3")
   - Who has signed (co-signer names or "Unknown")
   - Time since creation ("2 hours ago", "1 day ago")
   - Status badge: "Awaiting Signatures" or "Ready to Broadcast"
✅ I can filter pending transactions:
   - All pending
   - Needs my signature
   - Ready to broadcast (M signatures)
   - Expired (older than X days)
✅ I can sort by:
   - Date (newest/oldest)
   - Amount (highest/lowest)
   - Signature progress
✅ I see empty state: "No pending transactions" when list is empty
✅ I can click on pending transaction to see full details
```

**UI Components Required:**
- Pending transactions list/table
- Transaction summary cards
- Signature progress indicators
- Filter and sort controls
- Status badges
- Empty state display
- Click-to-details interaction

**Design Requirements:**
- Distinct visual from regular transaction history
- Clear signature progress visualization
- Status color coding (orange: pending, green: ready)
- Responsive list layout

---

##### Story MS.UI.15: Manage Pending PSBT

```
As a multisig user
I want to manage individual pending PSBTs
So that I can sign, export, delete, or broadcast them

Acceptance Criteria:
✅ I can click on pending PSBT to see full details
✅ I see complete PSBT information:
   - Full transaction details (inputs, outputs)
   - All signatures with fingerprints
   - PSBT creation date and creator (if known)
   - PSBT size and format
✅ I see available actions based on state:
   - "Sign PSBT" (if I haven't signed)
   - "Export PSBT" (to share with co-signers)
   - "Broadcast" (if M signatures present)
   - "Delete PSBT" (with confirmation)
   - "View in Explorer" (after broadcast)
✅ I can delete pending PSBT with warning:
   - "This will remove the PSBT from your wallet"
   - "Co-signers will need to recreate the transaction"
   - Requires confirmation
✅ I can export PSBT at any stage
✅ I can see PSBT age and auto-expiry warning (e.g., "Expires in 15 days")
✅ I see notification if PSBT inputs become invalid (already spent)
```

**UI Components Required:**
- PSBT detail modal/screen
- Action buttons (sign/export/broadcast/delete)
- Confirmation modals
- Expiry countdown
- Invalid PSBT warning
- Export functionality integration

**Technical Requirements:**
- PSBT detail extraction
- Action enablement logic
- PSBT deletion from storage
- Expiry tracking
- Input validation (check if UTXOs still unspent)

---

#### Epic 5: Help and Education

##### Story MS.UI.16: Contextual Help Throughout Multisig Flows

```
As a user new to multisig
I want access to help content at every step
So that I understand what I'm doing and make informed decisions

Acceptance Criteria:
✅ Every multisig screen has a "Help" or "?" icon
✅ Clicking help shows relevant contextual guidance
✅ Help content matches user's current step in workflow
✅ I can access full multisig guide from any screen
✅ I see tooltips on hover for technical terms:
   - Extended public key (xpub)
   - PSBT
   - Fingerprint
   - Redeem script
   - M-of-N configuration
✅ I can access comparison table from configuration selection
✅ I see "Learn More" links throughout UI
✅ Help content includes:
   - Text explanations (plain language)
   - Visual diagrams (workflow illustrations)
   - Video tutorials (if available)
   - FAQs specific to current step
✅ I can search help content
✅ Help opens in modal/sidebar (doesn't leave current flow)
```

**UI Components Required:**
- Help icon/button on all screens
- Contextual help modal
- Tooltip system for terms
- Help content renderer (from multisig-help.ts)
- Search functionality
- Visual aid display (diagrams, flows)

**Design Requirements:**
- Consistent help icon placement
- Non-intrusive help access
- Clear, concise explanations
- Visual learning aids
- Mobile-friendly help display

---

### User Flows Specification

#### Flow 1: Complete Multisig Account Setup (Coordinator)

**Preconditions:**
- User has a wallet with at least one single-sig account
- User understands they need to coordinate with co-signers

**Steps:**
1. Click account dropdown → "Create Multisig Account"
2. See introduction screen → Click "Get Started"
3. Select configuration (2-of-2, 2-of-3, or 3-of-5) → Click "Next"
4. Select address type (P2WSH recommended) → Click "Next"
5. See xpub export screen → Copy xpub or show QR code
6. Share xpub with co-signers via secure channel
7. Import co-signers' xpubs (paste, scan, or upload)
8. Verify imported xpubs show correct fingerprints
9. See first multisig address → Verify it matches with co-signers (phone/video)
10. Check "I have verified this address with all co-signers"
11. Set account name → Click "Create Account"
12. See success → Multisig account appears in account list

**Success Criteria:**
- Account created in <5 minutes (excluding co-signer coordination time)
- User understands which configuration they chose
- User has successfully coordinated with co-signers
- First address matches across all co-signers' wallets

**Error Handling:**
- Invalid xpub → Show inline error, cannot proceed
- Configuration mismatch → Show warning, explain how to fix
- Network error → Show retry option, don't lose progress

---

#### Flow 2: Send Multisig Transaction (Initiator)

**Preconditions:**
- Multisig account created and funded
- User has access to co-signers for coordination

**Steps:**
1. Select multisig account from dropdown
2. Click "Send" button
3. Enter recipient address → See validation
4. Enter amount → See USD equivalent
5. Select fee rate → See total fee
6. Click "Continue" → See transaction preview
7. Review details carefully → Re-enter password
8. Click "Sign Transaction" → PSBT created and signed
9. See "Transaction signed (1 of M)" confirmation
10. Choose export method:
    - Option A: Copy base64 PSBT to clipboard
    - Option B: Download .psbt file
    - Option C: Show QR code for in-person signing
11. Share PSBT with co-signers via chosen method
12. PSBT saved to "Pending Transactions"

**Success Criteria:**
- PSBT created successfully with valid signature
- User exports PSBT in format suitable for their workflow
- PSBT tracked in pending transactions list
- User knows next steps (share with co-signers)

**Error Handling:**
- Insufficient balance → Show error, suggest amount
- Invalid address → Show validation error
- Signing fails → Show error, allow retry
- Export fails → Offer alternative export methods

---

#### Flow 3: Sign PSBT (Co-signer)

**Preconditions:**
- Multisig account created on co-signer's wallet
- Co-signer received PSBT from initiator

**Steps:**
1. Select multisig account
2. Click "Sign PSBT" or "Pending Transactions"
3. Import PSBT:
   - Paste base64/hex text, OR
   - Upload .psbt file, OR
   - Scan QR code
4. PSBT validated → See transaction details
5. Review carefully:
   - Recipient address
   - Amount and fee
   - Current signature count
   - Who has already signed
6. Verify details with other co-signers (recommended)
7. Scroll to bottom → Click "Sign Transaction"
8. Re-enter password → PSBT signed
9. See updated signature count (e.g., "2 of 3")
10. If final signature:
    - See "Ready to Broadcast!" message
    - Choose to broadcast now OR export for others
11. If more signatures needed:
    - Export updated PSBT
    - Share with next co-signer

**Success Criteria:**
- PSBT imported successfully
- User reviews all transaction details
- Signature added without errors
- User knows next steps based on signature count

**Error Handling:**
- Invalid PSBT → Show error, allow re-import
- Already signed → Show message, offer to export
- Wrong account → Show error, suggest correct account
- Signing fails → Show error with reason, allow retry

---

#### Flow 4: Broadcast Multisig Transaction (Final Signer)

**Preconditions:**
- PSBT has M signatures collected
- User has PSBT with all required signatures

**Steps:**
1. Import fully-signed PSBT (or have it in pending list)
2. See "Ready to Broadcast" indicator
3. Review final transaction summary:
   - All signatures present (M of M)
   - Total amount and fee
   - Recipient address
4. Click "Broadcast Transaction"
5. See confirmation: "Broadcasting is irreversible"
6. Confirm broadcast
7. Transaction sent to network
8. See success screen:
   - Transaction ID
   - Explorer link
   - Estimated confirmation time
9. Transaction moves to transaction history
10. Balance updates

**Success Criteria:**
- Transaction broadcasts successfully
- Transaction ID displayed
- User can verify on explorer
- Balance updates correctly

**Error Handling:**
- Broadcast fails (network) → Show retry option
- Broadcast fails (fee too low) → Suggest higher fee, recreate
- Inputs already spent → Show error, transaction invalid

---

### Success Criteria & Metrics

#### Feature Completeness Metrics

**User Story Completion:**
- All 16 user stories implemented: 100%
- All acceptance criteria met per story: 100%
- All three core workflows functional: 100%

**Technical Implementation:**
- All UI components built and integrated
- All message handlers implemented
- PSBT workflow end-to-end functional
- Storage schema supports all multisig data
- Error handling comprehensive

#### User Experience Metrics

**Usability:**
- Time to create multisig account: <10 minutes (first time, excluding co-signer coordination)
- Configuration selection confidence: >80% (user survey)
- Address verification success rate: 100%
- PSBT import success rate: >95%

**Education Effectiveness:**
- Help content access rate: >50% of users during setup
- User understanding of M-of-N: >90% (post-setup survey)
- Support ticket volume: <5 per 100 multisig users

#### Quality Metrics

**Reliability:**
- PSBT creation success rate: >99%
- Signature success rate: >99%
- Broadcast success rate: >95%
- Zero critical bugs in production

**Performance:**
- Account creation: <5 seconds
- PSBT signing: <2 seconds
- PSBT import/export: <1 second
- UI responsiveness: <100ms interactions

#### Adoption Metrics (Post-Launch)

**Usage:**
- Multisig account creation rate: 5-10% of active users
- Configuration distribution:
  - 2-of-3: 60-70% (predicted most popular)
  - 2-of-2: 20-30%
  - 3-of-5: 10-20%
- Average multisig transactions per account: 2+ per month

**Engagement:**
- Pending PSBT completion rate: >80%
- Multi-device coordination success: >90%
- Address verification compliance: 100%

---

### Technical Dependencies & Integration Points

#### Frontend Components to Build

**New Components:**
1. `MultisigWizard.tsx` - Main setup wizard container
2. `ConfigurationSelector.tsx` - Configuration selection (DONE: use existing ConfigSelector.tsx)
3. `AddressTypeSelector.tsx` - Address type selection
4. `XpubExport.tsx` - xpub display and export
5. `XpubImport.tsx` - Co-signer xpub import
6. `AddressVerification.tsx` - Address verification screen
7. `MultisigAccountSummary.tsx` - Final account summary
8. `PsbtExport.tsx` - PSBT export modal
9. `PsbtImport.tsx` - PSBT import modal
10. `PsbtReview.tsx` - Transaction review and sign
11. `PendingTransactions.tsx` - Pending PSBT list
12. `MultisigTransactionDetail.tsx` - Individual PSBT detail

**Modified Components:**
1. `Dashboard.tsx` - Add multisig account support
2. `SendScreen.tsx` - Detect multisig, create PSBT instead of tx
3. `ReceiveScreen.tsx` - Show multisig addresses appropriately
4. `SettingsScreen.tsx` - Multisig account management

**Shared Components:**
1. `MultisigBadge.tsx` - Visual indicator for multisig accounts/addresses
2. `SignatureProgress.tsx` - Signature count visualization
3. `CoSignerList.tsx` - Display co-signer information
4. `HelpTooltip.tsx` - Contextual help integration

#### Backend Message Handlers

**New Message Types (add to MessageType enum):**
```typescript
CREATE_MULTISIG_ACCOUNT = 'CREATE_MULTISIG_ACCOUNT',
IMPORT_COSIGNER_XPUB = 'IMPORT_COSIGNER_XPUB',
VERIFY_MULTISIG_ADDRESS = 'VERIFY_MULTISIG_ADDRESS',
CREATE_MULTISIG_PSBT = 'CREATE_MULTISIG_PSBT',
SIGN_PSBT = 'SIGN_PSBT',
IMPORT_PSBT = 'IMPORT_PSBT',
EXPORT_PSBT = 'EXPORT_PSBT',
FINALIZE_PSBT = 'FINALIZE_PSBT',
BROADCAST_PSBT = 'BROADCAST_PSBT',
GET_PENDING_PSBTS = 'GET_PENDING_PSBTS',
DELETE_PENDING_PSBT = 'DELETE_PENDING_PSBT',
EXPORT_XPUB = 'EXPORT_XPUB',
```

**Message Handlers to Implement:**
1. `handleCreateMultisigAccount()` - Use MultisigManager to create account
2. `handleImportCosignerXpub()` - Validate and store co-signer xpubs
3. `handleVerifyMultisigAddress()` - Generate and return first address
4. `handleCreateMultisigPsbt()` - Build PSBT for multisig transaction
5. `handleSignPsbt()` - Sign PSBT with user's key
6. `handleImportPsbt()` - Parse and validate imported PSBT
7. `handleExportPsbt()` - Serialize PSBT for export
8. `handleFinalizePsbt()` - Convert fully-signed PSBT to raw tx
9. `handleBroadcastPsbt()` - Broadcast finalized transaction
10. `handleGetPendingPsbts()` - Fetch all pending PSBTs
11. `handleDeletePendingPsbt()` - Remove PSBT from storage
12. `handleExportXpub()` - Export xpub for account

#### Storage Schema Extensions

**MultisigAccount Interface (already in types):**
```typescript
interface MultisigAccount extends BaseAccount {
  accountType: 'multisig';
  multisigConfig: MultisigConfig; // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType; // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  cosigners: Cosigner[];
  externalIndex: number;
  internalIndex: number;
  addresses: MultisigAddress[];
  // ... existing fields
}
```

**PendingMultisigTx Interface (already in types):**
```typescript
interface PendingMultisigTx {
  txid: string;
  psbtBase64: string;
  multisigAccountId: string;
  requiredSignatures: number;
  totalCosigners: number;
  currentSignatures: number[];
  recipientAddress: string;
  amount: number;
  fee: number;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'ready';
  description?: string;
}
```

**Storage Keys:**
- `pending_multisig_txs`: Array of PendingMultisigTx
- Stored in chrome.storage.local
- Indexed by multisigAccountId for quick lookup

#### Existing Infrastructure to Leverage

**Backend (Already Implemented):**
✅ MultisigManager.ts - Complete multisig account management
✅ BIP48 derivation path implementation
✅ BIP67 key sorting for address generation
✅ PSBT builder and signer in TransactionBuilder
✅ All address types supported (P2SH, P2WSH, P2SH-P2WSH)

**Frontend (Already Implemented):**
✅ ConfigSelector.tsx - Configuration selection UI component
✅ multisig-help.ts - Complete help content library
✅ QR code generation (qrcode library)
✅ Clipboard API integration
✅ Message passing infrastructure

**What Needs to be Built:**
- Multisig wizard flow (connecting existing components)
- xpub import/export UI
- PSBT import/export UI
- Pending transactions UI
- Message handlers (bridge between UI and MultisigManager)
- State management for multisig workflows

---

### Risk Assessment & Mitigation

#### Technical Risks

**Risk 1: PSBT Compatibility Issues**
- **Probability:** Medium
- **Impact:** High
- **Description:** PSBTs may not be compatible with other wallets (Electrum, Specter, hardware wallets)
- **Mitigation:**
  - Test PSBT export/import with multiple wallet implementations
  - Follow BIP174 specification exactly
  - Validate with external tools before launch
  - Provide format conversion utilities if needed
  - Document known compatibility issues

**Risk 2: Address Derivation Mismatch**
- **Probability:** Low
- **Impact:** Critical
- **Description:** Users might generate different addresses due to implementation bugs
- **Mitigation:**
  - Extensive unit testing with test vectors
  - BIP67 key sorting validation
  - Address verification step mandatory
  - Visual address comparison tools
  - Testnet-only initially for validation

**Risk 3: Coordination Failures**
- **Probability:** High
- **Impact:** Medium
- **Description:** Users may lose PSBTs or fail to coordinate with co-signers
- **Mitigation:**
  - PSBT auto-save to pending transactions
  - Multiple export formats (base64, file, QR)
  - Clear instructions for sharing PSBTs
  - PSBT recovery/import functionality
  - Coordination troubleshooting guide

#### User Experience Risks

**Risk 4: Complexity Overwhelm**
- **Probability:** High
- **Impact:** High
- **Description:** Multisig is inherently complex, users may abandon setup
- **Mitigation:**
  - Extensive educational content throughout
  - Wizard-style setup (step-by-step)
  - Clear progress indicators
  - Default to recommended options (2-of-3, P2WSH)
  - Visual aids and diagrams
  - "Save and resume later" functionality

**Risk 5: Configuration Confusion**
- **Probability:** Medium
- **Impact:** High
- **Description:** Users choose wrong configuration for their needs
- **Mitigation:**
  - Clear use case examples for each configuration
  - Risk level indicators
  - Recommendation badges (2-of-3 recommended)
  - "Help me choose" decision tree
  - Ability to create test account first

**Risk 6: Verification Skipping**
- **Probability:** Medium
- **Impact:** Critical
- **Description:** Users skip address verification step, fund mismatched addresses
- **Mitigation:**
  - Mandatory verification checkbox
  - Visual warnings about importance
  - Step-by-step verification guide
  - Cannot proceed without confirmation
  - Testnet testing period to validate

#### Security Risks

**Risk 7: xpub Social Engineering**
- **Probability:** Low
- **Impact:** Critical
- **Description:** Attacker tricks user into creating multisig with attacker's xpub
- **Mitigation:**
  - Clear warnings about xpub verification
  - Fingerprint verification guidance
  - "Verify in person or via trusted channel" messaging
  - Cannot skip verification step
  - Educational content about this attack

**Risk 8: PSBT Manipulation**
- **Probability:** Low
- **Impact:** Critical
- **Description:** Attacker modifies PSBT between signers
- **Mitigation:**
  - PSBT integrity validation
  - Display all transaction details before signing
  - Warning to verify with co-signers
  - Hash-based PSBT verification (future)
  - Clear change detection

**Risk 9: Lost Keys**
- **Probability:** Medium
- **Impact:** Critical
- **Description:** User loses one key in 2-of-2 setup, funds locked
- **Mitigation:**
  - Clear risk warnings for 2-of-2
  - Strong recommendation for 2-of-3
  - "Lost key" risk explanation
  - Configuration comparison table
  - Recovery planning guidance

---

### Implementation Timeline & Phasing

#### Phase 1: Core Multisig Setup (Week 1-2)
**Goal:** Users can create multisig accounts and receive funds

**Deliverables:**
- Multisig wizard UI (configuration selection, address type)
- xpub export/import functionality
- Address verification screen
- Account creation and storage
- Receive to multisig addresses

**Acceptance:**
- Users can create 2-of-2, 2-of-3, 3-of-5 accounts
- xpub coordination works end-to-end
- Address verification is mandatory
- Multisig addresses display correctly

---

#### Phase 2: PSBT Workflow (Week 3-4)
**Goal:** Users can send from multisig accounts via PSBT coordination

**Deliverables:**
- PSBT creation from Send screen
- PSBT export (base64, file, QR)
- PSBT import functionality
- PSBT signing workflow
- Transaction review and broadcast

**Acceptance:**
- Users can create and sign PSBTs
- PSBTs export in multiple formats
- Co-signers can import and sign
- Final signer can broadcast successfully

---

#### Phase 3: Pending Transactions & Polish (Week 5)
**Goal:** Complete user experience with transaction tracking

**Deliverables:**
- Pending transactions list
- PSBT management (delete, re-export)
- Help content integration
- Error handling and edge cases
- UI polish and refinement

**Acceptance:**
- Pending PSBTs tracked reliably
- Users can manage all PSBTs
- Help content accessible throughout
- All error cases handled gracefully

---

#### Phase 4: Testing & Documentation (Week 6)
**Goal:** Production-ready multisig feature

**Deliverables:**
- End-to-end testing on testnet
- Unit tests for all components
- Integration tests for workflows
- User documentation and guides
- Release notes and changelog

**Acceptance:**
- All tests pass
- Documentation complete
- Real testnet transactions successful
- Feature ready for v0.9.0 release

---

### Release Checklist

#### Pre-Release Requirements

**Functionality:**
- [ ] All 16 user stories implemented and tested
- [ ] All three workflows functional end-to-end
- [ ] Error handling comprehensive
- [ ] Help content integrated throughout

**Testing:**
- [ ] Unit tests for all components (>80% coverage)
- [ ] Integration tests for workflows
- [ ] End-to-end testing on testnet
- [ ] Real multisig transactions (2-of-2, 2-of-3, 3-of-5)
- [ ] PSBT compatibility with external wallets
- [ ] Cross-browser testing (Chrome, Edge)

**Security:**
- [ ] Security expert review completed
- [ ] Blockchain expert review completed
- [ ] No critical vulnerabilities
- [ ] All warnings and guidance in place
- [ ] Testnet-only enforced

**Documentation:**
- [ ] User guide for multisig feature
- [ ] Help content comprehensive
- [ ] API documentation updated
- [ ] Changelog updated
- [ ] Release notes prepared

**Quality:**
- [ ] No P0 bugs
- [ ] <5 P1 bugs
- [ ] UI/UX reviewed and approved
- [ ] Performance acceptable (<2s operations)
- [ ] Accessibility validated

#### Post-Release Monitoring

**Week 1:**
- Monitor error rates daily
- Track user feedback
- Watch for critical bugs
- Collect usability feedback

**Month 1:**
- Analyze adoption rate (target: 5-10% of users)
- Measure configuration distribution
- Track completion rates
- Identify pain points

**Ongoing:**
- Support multisig users
- Iterate based on feedback
- Plan enhancements (hardware wallet, more configs)
- Prepare for mainnet support

---

### Open Questions for Resolution

**Q1: PSBT Storage Limits**
- How many pending PSBTs can we store before hitting chrome.storage limits?
- Should we implement PSBT expiry/cleanup?
- **Resolution:** Limit to 50 pending PSBTs, auto-expire after 30 days

**Q2: Co-signer Naming**
- Should we support co-signer nicknames/avatars?
- How to handle unknown co-signers (just fingerprints)?
- **Resolution:** Support nicknames, show fingerprints as fallback

**Q3: PSBT Sharing**
- Should we build in-app PSBT sharing (optional backend service)?
- Or keep it fully manual (copy/paste, QR, file)?
- **Resolution:** Manual only for v0.9.0, consider service in v1.0

**Q4: Hardware Wallet Priority**
- When should we add hardware wallet support for multisig?
- Which devices to support first (Ledger, Trezor)?
- **Resolution:** v1.0 feature, start with Ledger

**Q5: Mainnet Timeline**
- How much testnet usage before enabling mainnet?
- External audit required?
- **Resolution:** 100+ successful testnet multisig transactions, community feedback positive, then consider audit

---

### Success Definition

**This multisig feature will be considered successful when:**

1. **Adoption:** 5-10% of active users create at least one multisig account
2. **Completion:** 80%+ of multisig account creations result in successful first transaction
3. **Reliability:** >95% multisig transaction success rate
4. **Education:** <10 support tickets per 100 multisig users
5. **Satisfaction:** >4.5/5 user rating for multisig feature
6. **Interoperability:** PSBTs work with Electrum, Specter, and major hardware wallets
7. **Security:** Zero critical security issues in production
8. **Configuration Distribution:** 2-of-3 is most popular (60%+), validating our recommendation

**Failure Indicators:**
- <2% adoption (users don't find it valuable)
- >20% setup abandonment (too complex)
- <70% transaction completion (coordination too difficult)
- >20 support tickets per 100 users (poor UX or education)
- Critical security issue discovered
- PSBT incompatibility with major wallets

---

### Next Steps

**Immediate Actions (This Week):**
1. Review and approve this requirements document with stakeholders
2. UI/UX Designer: Create wireframes for all 12 new components
3. Frontend Developer: Estimate effort for UI implementation
4. Backend Developer: Implement message handlers (bridge to MultisigManager)
5. Security Expert: Review security warnings and guidance
6. Blockchain Expert: Validate PSBT implementation approach

**Week 1 Kickoff:**
1. Product Manager: Create detailed task breakdown
2. Team: Sprint planning for Phase 1 (Multisig Setup)
3. QA Engineer: Draft test plan for multisig workflows
4. Testing Expert: Plan unit/integration test strategy
5. All: Begin Phase 1 implementation

**Communication:**
- Daily standups during implementation
- Weekly demo of progress
- Bi-weekly user testing with beta testers
- Release candidate review in Week 5

---

**Document Owner:** Product Manager
**Last Updated:** October 12, 2025
**Status:** APPROVED - Ready for Implementation
**Target Release:** v0.9.0 (6 weeks from approval)

#### Future Enhancements (Post-Launch)

**Additional Configurations:**
- 2-of-4 (requested by enterprise users)
- 3-of-4 (common institutional setup)
- 4-of-7 (large DAOs and organizations)
- Custom M-of-N configurations (advanced users)

**Hardware Wallet Integration:**
- Ledger device support for multisig
- Trezor device support for multisig
- Mixed hardware/software co-signer setups
- Hardware wallet as one of M co-signers

**Advanced Features:**
- Descriptor import/export (BIP380/381/382)
- Multisig address scanning and discovery
- Spending policies and time locks
- Multisig vault workflows
- Emergency recovery procedures

**User Experience Improvements:**
- In-app co-signer coordination (optional backend service)
- QR code workflow for mobile-to-desktop coordination
- Transaction templates for recurring payments
- Batch transaction signing
- Multisig contact management

**Enterprise Features:**
- Role-based co-signer permissions
- Transaction approval workflows
- Audit logs for all multisig operations
- Compliance reporting
- Integration with enterprise key management

#### Success Metrics

**Adoption Metrics:**
- Target: 5% of active users create at least one multisig account
- Target: 10+ successful multisig transactions on testnet in first month
- Target: 2-of-3 configuration is most popular (predicted 60%+ of multisig users)

**Usage Patterns:**
- Configuration distribution (2-of-2 vs 2-of-3 vs 3-of-5)
- Average number of multisig accounts per user
- Transaction coordination time (setup to broadcast)
- PSBT export format preferences (base64 vs file vs QR)

**User Education Effectiveness:**
- Help content access rate during setup
- Configuration selection confidence (survey)
- Setup completion rate (start to first transaction)
- Support requests related to multisig

**Quality Metrics:**
- Multisig transaction success rate: >95%
- Address verification match rate: 100%
- PSBT compatibility with external wallets: 100%
- User-reported issues per 100 multisig users: <10

#### Risk Assessment

**Technical Risks:**
- **PSBT Compatibility**: Ensuring PSBTs work with external wallets (Electrum, Specter, etc.)
  - Mitigation: Extensive testing with multiple wallet implementations
- **Address Derivation Complexity**: Correct multisig address generation across types
  - Mitigation: Comprehensive unit tests, third-party validation
- **Coordination Failures**: Users losing PSBTs or unable to coordinate
  - Mitigation: Clear backup guidance, PSBT history/recovery features

**User Experience Risks:**
- **Complexity**: Multisig is inherently more complex than single-sig
  - Mitigation: Extensive user education, wizard-style workflows
- **Coordination Burden**: Requiring multiple parties to sign transactions
  - Mitigation: Clear expectations set upfront, async workflow support
- **xpub Confusion**: Users not understanding what to share
  - Mitigation: Plain-language explanations, security guidance

**Security Risks:**
- **Social Engineering**: Attackers convincing users to create multisig with attacker's key
  - Mitigation: Clear warnings, address verification guidance
- **Lost Keys**: One co-signer losing access preventing spending
  - Mitigation: Configuration selection guidance, recovery planning
- **PSBT Manipulation**: Modified PSBTs changing transaction details
  - Mitigation: Clear transaction review UI, PSBT integrity checks

#### Product Decisions

**Decision MS.1: Configuration Choices**
**Date:** October 2025
**Decision:** Support only 2-of-2, 2-of-3, and 3-of-5 configurations initially

**Rationale:**
- These three configurations cover the vast majority of real-world use cases
- Limiting choices reduces UI complexity and cognitive overload
- Each configuration has clear, distinct use cases
- Can add more configurations based on validated user demand
- Quality over quantity approach for MVP

**Decision MS.2: PSBT-Based Coordination**
**Date:** October 2025
**Decision:** Use PSBT (BIP174) for all multisig transaction coordination

**Rationale:**
- Industry standard for multisig coordination
- Interoperable with hardware wallets and other software
- Secure: PSBTs can't be manipulated without detection
- Flexible: Supports async coordination via multiple channels
- No backend required: Maintains wallet's privacy-first design

**Decision MS.3: No Built-in Coordination Service**
**Date:** October 2025
**Decision:** No backend service for co-signer coordination (users handle PSBT exchange)

**Rationale:**
- Maintains wallet's "no backend" privacy advantage
- Users can choose their own coordination method (email, messaging, etc.)
- Reduces development complexity and operational costs
- Aligns with Bitcoin ethos of self-sovereignty
- Can be added as optional service later based on demand

**Decision MS.4: Testnet Only Initially**
**Date:** October 2025
**Decision:** Multisig feature launches on testnet only, mainnet in future release

**Rationale:**
- Multisig is complex and high-stakes (multiple parties, high-value holdings)
- Extensive real-world testing required before mainnet
- Testnet allows users to learn without financial risk
- Time to identify and fix edge cases
- Consistent with wallet's safety-first approach

**Decision MS.5: Educational Content Prioritization**
**Date:** October 2025
**Decision:** Extensive user education built into multisig feature from day one

**Rationale:**
- Multisig is unfamiliar to most Bitcoin users
- Poor understanding leads to support burden and user frustration
- Prevention through education is more effective than reactive support
- Well-educated users make better security decisions
- Builds trust and confidence in advanced feature

#### User Feedback Collection Plan

**During Beta (Testnet):**
- Post-setup survey: Configuration selection confidence, clarity of instructions
- Post-transaction survey: PSBT coordination experience, pain points
- Help content analytics: Most-accessed articles, search queries
- User interviews: 5-10 detailed sessions with multisig users
- Support ticket analysis: Common confusion points, feature requests

**Metrics to Track:**
- Setup abandonment points (where users drop off)
- Help content effectiveness (do users find answers?)
- PSBT export format preferences
- Average coordination time (setup to first spend)
- Error rates at each step

**Feedback Integration:**
- Weekly review of multisig-related feedback during beta
- Monthly feature refinement based on learnings
- User quotes for testimonials and case studies
- Pain point prioritization for UI improvements
- Success stories for documentation and marketing

---

## User Stories & Acceptance Criteria

### Epic: First-Time Wallet Setup

#### Story 1.1: Create Wallet as New User
```
As a new user
I want to create a Bitcoin wallet
So that I can store and manage my Bitcoin

Acceptance Criteria:
- [ ] I can click "Create New Wallet" from welcome screen
- [ ] I can choose between Legacy, SegWit, or Native SegWit address types
- [ ] I can create a password that meets security requirements
- [ ] I see a 12-word seed phrase displayed clearly
- [ ] I receive clear warnings about seed phrase security
- [ ] I must confirm my seed phrase by selecting words in order
- [ ] My wallet is created and I see my first account
- [ ] My first account shows a balance of 0 BTC
- [ ] I can immediately receive Bitcoin to my new wallet
```

#### Story 1.2: Import Existing Wallet
```
As a user with an existing wallet
I want to import my wallet using my seed phrase
So that I can access my Bitcoin in the extension

Acceptance Criteria:
- [ ] I can click "Import Wallet" from welcome screen
- [ ] I can enter my 12 or 24-word seed phrase
- [ ] I receive clear error messages if my seed phrase is invalid
- [ ] I can choose my preferred address type
- [ ] I can create a new password for this extension
- [ ] The extension discovers my existing accounts with balances
- [ ] I see all my accounts and balances after import
- [ ] My transaction history is loaded from the blockchain
```

### Epic: Account Management

#### Story 2.1: Create Additional Accounts
```
As a wallet user
I want to create multiple accounts
So that I can separate my Bitcoin for different purposes

Acceptance Criteria:
- [ ] I can open an account dropdown similar to MetaMask
- [ ] I can click "Create Account" button
- [ ] A new account is created with name "Account N"
- [ ] The new account has its own unique addresses
- [ ] I can switch between accounts using the dropdown
- [ ] Each account displays its own balance independently
- [ ] All accounts are derived from my single seed phrase
```

#### Story 2.2: Rename Accounts
```
As a wallet user
I want to give my accounts custom names
So that I can easily identify their purpose

Acceptance Criteria:
- [ ] I can click an edit icon next to the account name
- [ ] I can enter a custom name (up to 30 characters)
- [ ] The name is saved and persists across sessions
- [ ] I see my custom names in the account dropdown
- [ ] I can rename accounts at any time
- [ ] Special characters and emoji are supported
```

### Epic: Sending Bitcoin

#### Story 3.1: Send Bitcoin Transaction
```
As a wallet user
I want to send Bitcoin to another address
So that I can pay someone or transfer to another wallet

Acceptance Criteria:
- [ ] I can click "Send" from the dashboard
- [ ] I can enter a recipient Bitcoin address
- [ ] I can enter an amount in BTC
- [ ] I see validation errors for invalid addresses
- [ ] I cannot send more than my available balance
- [ ] I can choose between Slow, Medium, or Fast fee options
- [ ] I see the fee amount in sat/vB and total BTC
- [ ] I see a transaction preview before confirming
- [ ] I must re-enter my password to confirm
- [ ] I see a success message with transaction ID
- [ ] I can view my transaction in the block explorer
- [ ] My balance updates immediately to show pending transaction
```

#### Story 3.2: Send Maximum Amount
```
As a wallet user
I want to send all my Bitcoin in one transaction
So that I can empty my account or consolidate funds

Acceptance Criteria:
- [ ] I can click "Send Max" button on send form
- [ ] The amount field is populated with my full balance minus fees
- [ ] The fee is calculated based on my selected fee speed
- [ ] The transaction will empty my account (0 remaining)
- [ ] I can still change the fee speed and see updated amounts
- [ ] The transaction completes successfully with no remaining balance
```

### Epic: Receiving Bitcoin

#### Story 4.1: Receive Bitcoin
```
As a wallet user
I want to receive Bitcoin from others
So that I can accept payments or transfers

Acceptance Criteria:
- [ ] I can click "Receive" from the dashboard
- [ ] I see my current Bitcoin address displayed clearly
- [ ] I see a QR code of my address for easy scanning
- [ ] I can copy my address with one click
- [ ] I receive confirmation when address is copied
- [ ] I can generate a new address if desired
- [ ] I see guidance about address types and reuse
```

### Epic: Transaction History

#### Story 5.1: View Transaction History
```
As a wallet user
I want to see all my past transactions
So that I can track my Bitcoin activity

Acceptance Criteria:
- [ ] I can view a list of all transactions for current account
- [ ] I can distinguish between sent and received transactions
- [ ] I see the amount, date, and confirmation status
- [ ] Pending transactions are clearly marked
- [ ] I see transaction fees for sent transactions
- [ ] I can click a transaction to see more details
- [ ] I can click to view transaction on block explorer
- [ ] The list updates automatically when new transactions occur
```

### Epic: Security

#### Story 6.1: Secure Wallet with Password
```
As a security-conscious user
I want my wallet protected by a strong password
So that others cannot access my Bitcoin

Acceptance Criteria:
- [ ] I must create a password when setting up my wallet
- [ ] The password must meet minimum security requirements
- [ ] I see a password strength indicator while typing
- [ ] I cannot proceed with a weak password
- [ ] I must unlock my wallet with password after closing extension
- [ ] I see clear error messages for incorrect passwords
- [ ] There is no password recovery option (by design)
```

#### Story 6.2: Auto-Lock Protection
```
As a security-conscious user
I want my wallet to lock automatically
So that I'm protected if I forget to lock it manually

Acceptance Criteria:
- [ ] My wallet locks after 15 minutes of inactivity
- [ ] I can manually lock my wallet at any time
- [ ] I must enter my password to unlock after auto-lock
- [ ] All sensitive data is cleared from memory when locked
- [ ] I see the lock status clearly in the UI
```

---

## Product Decisions Log

### Decision 1: Address Type Selection
**Date:** October 12, 2025  
**Decision:** Allow users to choose address type during wallet creation  
**Options Considered:**
1. Force Native SegWit only (best fees, modern)
2. Allow user choice between 3 types
3. Default to Native SegWit with option to change later

**Decision:** Option 2 - Allow user choice during setup  
**Rationale:**
- Users may need Legacy for compatibility with older services
- Educational opportunity to explain differences
- Flexibility for various use cases
- Can recommend Native SegWit as default while allowing choice

**Impact:** Adds complexity to setup flow, but provides necessary flexibility  
**Communicated To:** UI/UX Designer, Frontend Developer, Backend Developer

---

### Decision 2: Seed Phrase Length
**Date:** October 12, 2025  
**Decision:** Use 12-word seed phrase for new wallets  
**Options Considered:**
1. 12 words (128-bit security)
2. 24 words (256-bit security)
3. Let user choose

**Decision:** Option 1 - 12 words for creation, support both for import  
**Rationale:**
- 12 words is industry standard for most wallets
- 128-bit security is more than sufficient
- Easier for users to write down and verify
- Reduces user error in seed phrase backup
- Still support 24-word import for compatibility

**Impact:** Simpler UX, maintains security standards  
**Communicated To:** UI/UX Designer, Backend Developer, Security Expert

---

### Decision 3: Auto-Lock Timeout
**Date:** October 12, 2025  
**Decision:** 15-minute auto-lock timeout (not configurable in MVP)  
**Options Considered:**
1. 5 minutes (very secure, less convenient)
2. 15 minutes (balanced)
3. 30 minutes (convenient, less secure)
4. User configurable

**Decision:** Option 2 - 15 minutes fixed for MVP  
**Rationale:**
- Balances security with usability
- Matches industry standards (MetaMask uses 15 min)
- Prevents timeout too frequently during active use
- Can make configurable in post-MVP

**Impact:** Good security/usability balance  
**Future Enhancement:** Make configurable in Settings  
**Communicated To:** Backend Developer, UI/UX Designer

---

### Decision 4: Testnet Only for MVP
**Date:** October 12, 2025  
**Decision:** MVP supports Bitcoin testnet only, mainnet in Phase 2  
**Options Considered:**
1. Testnet only
2. Mainnet only
3. Both with toggle
4. Separate extensions

**Decision:** Option 1 - Testnet only for MVP  
**Rationale:**
- Safety: No risk of losing real funds during testing
- Testing: Extensive testing required before mainnet
- Development: Can iterate faster without mainnet concerns
- Security: Time for security audits before real money
- Users: Developers and testers are primary MVP audience

**Impact:** Limits initial user base but ensures safety  
**Timeline:** Mainnet support in Phase 2 (post-MVP)  
**Communicated To:** All team members

---

### Decision 5: No Address Book in MVP
**Date:** October 12, 2025
**Decision:** Address book deferred to Phase 2
**Options Considered:**
1. Include in MVP
2. Defer to Phase 2
3. Never implement

**Decision:** Option 2 - Phase 2 enhancement
**Rationale:**
- Not critical for core wallet functionality
- Adds development time to MVP

---

### Decision 6: Move Multisig Wizard to Browser Tab
**Date:** October 13, 2025
**Decision:** Move multisig account creation wizard from extension popup to dedicated browser tab
**Priority:** P1 - High (Critical UX Fix)
**Target Version:** v0.9.0

**Problem Statement:**
Current popup-based wizard has critical UX issues:
- Popup closes when users click away to copy/paste xpub data (CRITICAL)
- File picker dialogs cause popup to close, losing progress (CRITICAL)
- Limited 600x400px screen space constrains 7-step wizard UI (HIGH)
- Users cannot coordinate with co-signers without losing wizard progress (CRITICAL)

**Options Considered:**
1. Keep popup wizard, add progress save (doesn't solve focus loss issue)
2. Move to browser tab (full persistence, more space)
3. Hybrid: Quick setup in popup, advanced in tab (confusing UX)
4. New window popup (similar issues to tab, but less standard)

**Decision:** Option 2 - Full migration to browser tab

**Rationale:**
- **Persistence:** Tab stays open when users switch to other apps (100% solves popup closure issue)
- **Screen Space:** Full browser window provides 3-5x more space for wizard content
- **File Operations:** Native file dialogs work correctly in tabs without conflicts
- **User Control:** Users control tab lifecycle, not browser auto-close behavior
- **Industry Standard:** Desktop wallets use persistent windows for multisig setup
- **Development Effort:** Moderate (2-3 days) with 100% component reuse
- **Risk:** Low - well-understood Chrome extension tab architecture

**Implementation Highlights:**
- New tab page: `tabs/multisig-wizard.html`
- Entry: Dashboard "Create Multisig Account" button opens tab
- Exit: Wizard completion closes tab and focuses popup
- Progress: Save to chrome.storage.local after each step
- Resume: Detect incomplete wizard on next start
- Components: Reuse 100% of existing MultisigWizard component tree

**Success Metrics:**
- Target: >80% wizard completion rate (baseline likely <50%)
- Target: 0 accidental progress loss incidents
- Target: Positive user feedback, no UX complaints
- Target: >30% of wizards use save/resume feature

**Scope for v0.9.0:**
- ✅ Tab-based wizard implementation
- ✅ Remove popup wizard entirely (no valid use case)
- ✅ Progress save/resume with 30-day expiration
- ✅ Duplicate tab prevention
- ✅ Tab close confirmation
- ✅ All edge case handling (service worker restart, network offline, etc.)
- ❌ Popup progress indicator badge (Phase 2)
- ❌ PSBT signing in tab (wait for feedback)

**Alternative Solutions Rejected:**
- Popup with progress save: Doesn't solve fundamental issue of popup closing on focus loss
- Hybrid approach: Adds complexity without solving core problem
- New window popup: Less standard than tabs, similar UX

**Trade-offs Accepted:**
- Users must allow tab creation (rare browser setting issue)
- Tab-based flow slightly different from popup-only experience
- Small learning curve for first-time multisig creators (mitigated with tooltip)

**Edge Cases Addressed:**
- Duplicate wizard tabs: Focus existing tab instead of creating duplicate
- Popup closed during wizard: Wizard continues independently
- Browser restart: Progress restored from storage
- Service worker crash: Storage-backed state allows continuation
- Storage corruption: Auto-detect, clear, and start fresh
- Network offline: Steps 1-6 work offline, Step 7 shows retry button

**Impact Assessment:**
- **User Experience:** Significantly improved - eliminates #1 friction point
- **Development Effort:** Medium (2-3 days implementation + 1 day testing)
- **Risk:** Low - well-understood pattern, no wallet core changes
- **Business Value:** High - unblocks multisig feature adoption
- **Technical Debt:** None (cleaner than maintaining popup version)

**Timeline:**
- Implementation: 4 days (2 dev + 0.5 progress + 0.5 edge cases + 1 testing)
- Target Completion: October 20, 2025
- Release Version: v0.9.0

**Dependencies:**
- UI/UX Designer: Review tab layout (1 hour)
- Frontend Developer: Implement tab infrastructure (lead)
- Backend Developer: Review message passing (1 hour)
- Security Expert: Review progress storage security (1 hour)
- Testing Expert: Write unit tests (0.5 days)
- QA Engineer: Execute manual testing (1 day)

**Documentation:**
- Full PRD: `/prompts/docs/TAB_BASED_MULTISIG_WIZARD_PRD.md`
- User stories with acceptance criteria (6 stories)
- User flows (3 complete flows documented)
- Edge case matrix (10 edge cases specified)
- Risk assessment (8 risks identified and mitigated)
- Technical specifications (storage schema, API requirements, webpack config)

**Rollback Plan:**
- If critical issues: Temporarily hide "Create Multisig Account" button
- Existing multisig accounts continue working (no data impact)
- No user fund risk (accounts are permanent once created)

**Approval Status:** APPROVED - Proceed with implementation

**Impact:** This is a mandatory UX fix, not an optional enhancement. Current popup wizard is unusable for real-world multisig coordination. Tab-based wizard enables the multisig feature to reach its full potential.

**Communicated To:** All team members via PRD document
**Next Action:** UI/UX Designer review → Frontend Developer implementation
- Can validate need through user feedback
- Copy-paste addresses works for MVP
- Focus MVP on essential features

**Impact:** Users must copy-paste addresses
**Workaround:** Users can keep addresses in notes
**Timeline:** Phase 2 feature
**Communicated To:** Product team

---

### Decision 6: Multisig Feature Prioritization
**Date:** October 12, 2025
**Decision:** Implement multisig wallet support as post-MVP enhancement (originally Phase 3)
**Options Considered:**
1. Include in MVP
2. Defer to Phase 2
3. Implement post-MVP (accelerated from Phase 3)
4. Never implement (testnet wallet doesn't need multisig)

**Decision:** Option 3 - Accelerate from Phase 3 to post-MVP implementation
**Rationale:**
- **Market differentiation**: Few Bitcoin browser wallets offer multisig
- **User demand**: Power users and institutions need multisig for security
- **Technical opportunity**: BIP standards provide clear implementation path
- **Use cases validated**: Business partnerships, inheritance planning, DAOs
- **Competitive advantage**: Positions wallet for institutional adoption
- **Security enhancement**: Multisig is the gold standard for high-value holdings
- **Education opportunity**: Helps users understand advanced Bitcoin security

**Implementation Approach:**
- Start with three proven configurations (2-of-2, 2-of-3, 3-of-5)
- Use PSBT standard for coordination (no backend required)
- Build extensive user education into feature
- Launch on testnet first for extensive validation
- Support all three address types (P2SH, P2WSH, P2SH-P2WSH)
- Maintain no-backend architecture principle

**Impact:**
- Significant development effort but high user value
- Requires comprehensive testing and documentation
- Positions wallet as advanced/institutional-grade
- Differentiates from simpler wallet competitors
- Opens up business/institutional use cases

**Timeline:** v0.8.0 release
**Success Metrics:**
- 5% of users create multisig accounts
- >95% multisig transaction success rate
- High user satisfaction with educational content
- Positive feedback from institutional users

**Communicated To:** All team members, especially Blockchain Expert, Security Expert, Frontend Developer

---

## Release Planning

### MVP Release Criteria

**Must Have (Release Blockers):**
- [ ] Create wallet from seed phrase
- [ ] Import wallet from seed phrase or private key
- [ ] Password protection and encryption
- [ ] Multi-account support
- [ ] Send transactions on testnet
- [ ] Receive transactions (address display + QR)
- [ ] Transaction history view
- [ ] Balance display (confirmed + unconfirmed)
- [ ] Fee estimation and selection
- [ ] Auto-lock functionality
- [ ] All 3 address types supported
- [ ] No critical security vulnerabilities
- [ ] Passing all unit tests
- [ ] Passing all integration tests
- [ ] Manual testing completed on testnet
- [ ] Security review completed
- [ ] Documentation complete (README, user guide)

**Nice to Have (Can be patched):**
- Transaction filtering/search
- Export transaction history
- Keyboard shortcuts
- Dark mode
- Transaction labels
- Multiple currency display

**Minimum Quality Bar:**
- No P0 bugs (critical, security, data loss)
- No more than 5 P1 bugs (high priority)
- Test coverage >80%
- All user flows tested end-to-end
- Performance: <2s load time, <1s account switch

### Beta Testing Plan

**Beta Phase 1: Internal (Week 9)**
- Team members test all features
- Run through all user flows
- Document bugs and issues
- Security team review
- Performance testing

**Beta Phase 2: Closed Beta (Week 10)**
- Invite 10-20 external testers
- Provide test BTC on testnet
- Collect structured feedback
- Monitor for crashes and errors
- Iterate based on feedback

**Beta Phase 3: Public Beta (Week 11)**
- Release to Chrome Web Store (unlisted)
- Larger user base (50-100 users)
- Monitor usage patterns
- Collect feedback and metrics
- Fix critical issues

**Launch: Week 12**
- Public release on Chrome Web Store
- Announcement and documentation
- Support channels active
- Monitoring and analytics enabled

### Post-Launch Support Plan

**First 2 Weeks:**
- Daily monitoring of error reports
- Rapid response to critical bugs
- Active support on GitHub issues
- Collect user feedback
- Analytics review

**Month 1-3:**
- Weekly updates for bug fixes
- Begin Phase 2 feature development
- User feedback integration
- Performance optimization
- Security updates as needed

---

## Metrics & KPIs

### Success Metrics for MVP Launch

**Adoption Metrics:**
- Target: 1,000 installs in first month
- Target: 100 active weekly users
- Target: 70% user retention after 1 week

**Usage Metrics:**
- Wallet creation success rate: >95%
- Transaction success rate: >98%
- Average session duration: 3-5 minutes
- Sessions per user per week: 5+

**Quality Metrics:**
- Crash rate: <0.1%
- Error rate: <2%
- Bug reports per 100 users: <5
- Response time (balance load): <2s

**User Satisfaction:**
- Chrome Web Store rating: >4.0/5.0
- User feedback sentiment: >70% positive
- Feature request diversity: High (indicates engagement)

### Key Performance Indicators (Ongoing)

**Product Health:**
- Weekly active users (WAU)
- Monthly active users (MAU)
- WAU/MAU ratio (stickiness)
- User retention (Day 7, Day 30)
- Churn rate

**Feature Usage:**
- % users with multiple accounts
- Average accounts per user
- Transactions per user per week
- Most used fee speeds
- Address generation frequency

**Quality Indicators:**
- Crash-free user rate
- API error rate
- Transaction broadcast success rate
- Average transaction confirmation time
- Support ticket volume

**Growth Indicators:**
- Install growth rate
- Uninstall rate
- Chrome Web Store rating trend
- Review sentiment over time
- GitHub stars and forks

---

## User Feedback & Pain Points

### Pre-Launch Assumptions (to validate)

**Expected User Needs:**
1. Easy wallet setup (< 5 minutes)
2. Clear security guidance
3. Simple send/receive flow
4. Reliable transaction tracking
5. MetaMask-familiar interface

**Anticipated Pain Points:**
1. Seed phrase backup (users might skip)
2. Understanding address types
3. Bitcoin vs Satoshi confusion
4. Fee selection understanding
5. Transaction confirmation wait times

**Mitigation Strategies:**
- Clear onboarding tooltips
- Security education screens
- Unit conversions (BTC/sats/USD)
- Fee speed descriptions with time estimates
- Transaction status updates

### Feedback Collection Methods

**In-App:**
- Feedback button in settings
- Error report submission
- Optional usage analytics

**External:**
- Chrome Web Store reviews
- GitHub issues
- Reddit community (r/Bitcoin)
- Twitter mentions
- Direct email support

**Structured:**
- Post-transaction surveys (optional)
- Bi-weekly user interviews
- Beta tester feedback forms
- Usability testing sessions

---

## Competitive Analysis

### Direct Competitors

#### 1. MetaMask (Ethereum-focused)
**Strengths:**
- Excellent UX and brand recognition
- Multi-account support
- Large ecosystem
- Active development

**Weaknesses:**
- Ethereum only (no Bitcoin)
- Complex for beginners
- Security incidents in past

**Our Differentiation:**
- Bitcoin-specific features
- Simpler, focused experience
- No backend dependencies

#### 2. Electrum
**Strengths:**
- Mature, well-tested
- Advanced features
- Desktop application
- Full node support

**Weaknesses:**
- Dated UI
- Steep learning curve
- Not a browser extension
- Complex for casual users

**Our Differentiation:**
- Modern, intuitive UI
- Browser-based convenience
- Beginner-friendly

#### 3. Browser Bitcoin Wallets (various)
**Current Landscape:**
- Limited Chrome extension options
- Many are outdated or unmaintained
- Most lack multi-account support
- Variable security quality

**Our Differentiation:**
- Manifest V3 compliant
- MetaMask-inspired UX
- Modern tech stack
- Active maintenance commitment

### Market Positioning

**Target Position:**
"The MetaMask of Bitcoin - a secure, user-friendly browser extension for managing Bitcoin with confidence"

**Key Differentiators:**
1. MetaMask-familiar UX for easy adoption
2. All 3 Bitcoin address types in one wallet
3. Multi-account management
4. No backend servers (privacy-focused)
5. Open source and transparent

**Pricing Strategy:**
- Free and open source
- No transaction fees (beyond blockchain fees)
- No premium features
- Sustainable through community support

---

## Tab-Based Architecture Transformation (v0.9.0)

### Product Decision: Popup to Tab Migration

**Decision Date:** October 14, 2025
**Release:** v0.9.0
**Decision Owner:** Product Manager
**Priority:** P0 - Critical Product Evolution

#### Executive Summary

The Bitcoin Wallet extension underwent a fundamental architectural transformation from a constrained popup-based interface (600x400px) to a full browser tab with persistent sidebar navigation. This change represents a major product evolution that significantly enhances user experience, enables new feature possibilities, and positions the wallet competitively with leading cryptocurrency applications.

**Key Outcome:** The wallet now provides a professional, desktop-app-like experience within the browser, eliminating the cramped constraints of the popup model while introducing enhanced security controls and a modern, scalable UI architecture.

---

### Product Rationale: Why Tab Architecture?

#### Problem Statement

The popup-based architecture created fundamental UX limitations that became critical pain points as the product evolved:

**1. Constrained Real Estate (600x400px)**
- **Problem:** Complex features like multisig setup required extensive UI components that didn't fit comfortably in popup dimensions
- **Impact:** Users experienced cramped interfaces, excessive scrolling, and difficulty viewing complete information
- **Example:** Multisig wizard with 7 steps, multiple xpub inputs, and address verification couldn't display effectively

**2. Popup Lifecycle Issues**
- **Problem:** Popups close when users click away from the extension, losing context and progress
- **Impact:** Multi-step workflows were interrupted, forcing users to restart processes
- **Example:** Creating a multisig account required copying xpubs to share with co-signers - clicking away to another app closed the popup and lost wizard progress

**3. Limited Interaction Model**
- **Problem:** Popup architecture doesn't support complex, long-running operations or multi-window workflows
- **Impact:** Users couldn't reference external information while working in the wallet
- **Example:** Users needed to keep paper notes of addresses/keys because popup would close when switching to email or messaging apps

**4. Professional Appearance Gap**
- **Problem:** Leading crypto wallets (Metamask web, Phantom, etc.) offer full-screen experiences with sidebar navigation
- **Impact:** Our popup-constrained interface felt less professional and capable compared to competitors
- **User Perception:** "Feels like a toy wallet" vs. "Looks like serious financial software"

#### Decision Drivers

**Strategic Imperatives:**
1. **Enable Advanced Features:** Multisig workflows, PSBT coordination, and future DeFi integrations require more screen real estate
2. **Competitive Positioning:** Match or exceed UX quality of leading crypto wallet applications
3. **User Retention:** Reduce friction and abandonment in complex workflows
4. **Professional Image:** Present as an institutional-grade Bitcoin wallet, not a simple popup tool
5. **Future-Proofing:** Establish UI architecture that can scale to support additional features

**User Research Insights:**
- Users compared our popup unfavorably to Metamask's browser-based UI
- Power users requested "more space" for advanced features
- Multisig wizard testing revealed 80%+ abandonment due to popup closing issues
- Users expected modern crypto wallets to have sidebar navigation patterns

---

### Product Benefits & Value Propositions

#### User Experience Improvements

**1. Unlimited Screen Real Estate**
- **Benefit:** Full browser window available for wallet operations
- **Impact:** Complex features can breathe, reducing cognitive load
- **Examples:**
  - Multisig wizard can show full xpub strings without truncation
  - Transaction history can display more details at once
  - Settings can expand into comprehensive, organized sections

**2. Persistent Application State**
- **Benefit:** Wallet stays open in dedicated tab, maintaining context
- **Impact:** Users can work with wallet alongside other applications
- **Examples:**
  - Reference email while importing xpubs
  - Compare addresses with co-signers via messaging app
  - Keep wallet open while researching transaction fees

**3. Professional Navigation Model**
- **Benefit:** 240px fixed sidebar with persistent navigation (industry standard)
- **Impact:** Clearer information architecture, easier feature discovery
- **Examples:**
  - Assets, Multisig Wallets, Contacts, Settings always accessible
  - Current section clearly indicated with Bitcoin orange highlighting
  - Account switcher persistently visible at bottom of sidebar

**4. Enhanced Visual Hierarchy**
- **Benefit:** More space enables better organization and visual design
- **Impact:** Reduced cognitive load, clearer user flows
- **Examples:**
  - Dashboard can show balance, actions, addresses, and transactions without scrolling
  - Send flow can display form, fee selector, and preview side-by-side
  - Multisig wizard can show progress, current step, and help content simultaneously

#### Business & Strategic Benefits

**1. Competitive Differentiation**
- **Position:** Professional-grade Bitcoin wallet with modern UI
- **Competitive Advantage:** Matches or exceeds leading crypto wallet UX standards
- **Market Impact:** Appeals to institutional users and power users who demand quality

**2. Feature Enablement**
- **Unlocked Capabilities:**
  - Complex multisig workflows now practical and usable
  - PSBT coordination with extensive transaction details
  - Future DeFi integrations with rich interfaces
  - Address book with detailed contact management
  - Advanced transaction management (RBF, CPFP) with clear UIs
- **Strategic Value:** Removes architectural constraints on product roadmap

**3. Reduced Support Burden**
- **Improvement:** Fewer user confusion incidents related to popup closing
- **Impact:** Users can complete workflows without frustration-induced support requests
- **Example:** Multisig setup abandonment reduced from ~80% to expected <20%

**4. Brand Perception**
- **Before:** "Simple popup wallet for basic needs"
- **After:** "Professional-grade Bitcoin wallet for serious users"
- **Long-term:** Positions product for enterprise and institutional adoption

---

### User Experience Design Decisions

#### Sidebar Navigation (240px Fixed)

**Rationale:**
- **Industry Standard:** Leading crypto wallets (Metamask web, Phantom, Argent) use sidebar patterns
- **Persistent Context:** Users always know where they are and can navigate anywhere
- **Scalability:** Easy to add new sections without cluttering interface
- **Mobile-Ready:** Sidebar pattern adapts well to responsive breakpoints

**Navigation Structure:**
1. **Assets (₿)** - Primary dashboard, main entry point
2. **Multi-sig Wallets (🔐)** - Multisig account management
3. **Contacts (👥)** - Address book (future feature)
4. **Settings (⚙️)** - Wallet configuration and preferences

**Design Specifications:**
- Fixed 240px width (optimal for icon+label without excessive width)
- Dark background (gray-900 #1A1A1A) for professional appearance
- Bitcoin orange (#F7931A) for active states with shadow glow
- Account switcher at bottom with orange gradient avatar
- Quick access to Lock and Help functions

#### Color Scheme: Bitcoin Orange as Primary

**Decision:** Use Bitcoin orange (#F7931A) as primary action color throughout application

**Rationale:**
- **Brand Identity:** Orange is Bitcoin's official color - reinforces product focus
- **Visual Consistency:** Single primary color creates cohesive experience
- **Accessibility:** Orange provides excellent contrast on dark backgrounds (12:1 ratio)
- **Differentiation:** Most wallets use blue/purple - orange stands out
- **Success States:** Green (#22C55E) complements orange for completed actions

**Application:**
- Primary action buttons (Send, Receive, Unlock)
- Active navigation items with glow effect
- Loading spinners and progress indicators
- Focus states on form inputs
- Account avatar gradients

#### Tab Behavior & Interaction Model

**Opening Wallet:**
- **User Action:** Click extension icon in toolbar
- **Behavior:** Open wallet in full browser tab (or focus existing tab if already open)
- **UX Benefit:** Consistent, predictable behavior - wallet always opens the same way

**Tab Management:**
- **Single Tab Enforcement:** Only one wallet tab active at a time (security control)
- **Focus Existing:** Clicking icon when tab open focuses that tab (prevents duplicates)
- **Tab Title:** "Bitcoin Wallet" - clear identification in browser tab bar
- **Favicon:** Bitcoin logo for easy visual identification

**Navigation Pattern:**
- **Sidebar Always Visible:** Navigation persistently available (not hidden)
- **Content Area:** Main content scrolls independently of sidebar
- **View Transitions:** Smooth, instant switches between sections
- **Breadcrumbs:** Not needed - sidebar shows current location

---

### Security Enhancements

The tab architecture enabled implementation of four critical P0 security controls that weren't feasible in popup model:

#### 1. Single Tab Enforcement

**Product Requirement:** Only one wallet tab can be active at a time to prevent security confusion and session conflicts.

**Implementation:**
- Cryptographically secure session tokens (256-bit random)
- Token validation every 5 seconds between tab and background worker
- Automatic revocation when new tab requests session
- Clear user messaging: "Wallet Tab Closed" with orange action button

**User Impact:**
- Prevents accidentally operating wallet in multiple tabs (security risk)
- Clear indication when wallet tab is superseded by another
- Single source of truth for wallet state

**Product Tradeoff:**
- **Benefit:** Enhanced security, reduced user confusion
- **Cost:** Users cannot open wallet in multiple tabs (intentional limitation)
- **Decision:** Security benefit outweighs multi-tab convenience

#### 2. Clickjacking Prevention

**Product Requirement:** Prevent malicious websites from embedding wallet in hidden iframes to steal user actions.

**Implementation:**
- Multi-layer defense: CSP policy `frame-ancestors 'none'` + runtime iframe detection
- Wallet refuses to load if embedded in iframe
- Clear security error message on embedding attempt

**User Impact:**
- Invisible to users in normal usage
- Protects users from sophisticated clickjacking attacks
- Security-conscious users appreciate defense-in-depth approach

#### 3. Tab Nabbing Prevention

**Product Requirement:** Detect and prevent malicious code from redirecting wallet tab to phishing site.

**Implementation:**
- Monitor `window.location` every 1 second for unexpected changes
- Immediately lock wallet if location tampering detected
- Display security alert explaining the lock

**User Impact:**
- Invisible to users in normal usage
- Protects users from tab nabbing attacks
- Automatic protection without user configuration

#### 4. Auto-Lock on Hidden Tab

**Product Requirement:** Lock wallet automatically when user switches away for extended period.

**Implementation:**
- 5-minute timer when tab is hidden (not focused)
- Timer cancels when tab becomes visible again
- Complements existing 15-minute inactivity timer

**User Impact:**
- **Benefit:** Enhanced security if user leaves wallet open while AFK
- **Behavior:** Wallet locks 5 minutes after switching to another tab
- **UX:** Smooth unlock experience - just re-enter password
- **Tradeoff:** Slight inconvenience for improved security (acceptable for crypto wallet)

---

### Feature Opportunities Enabled

The tab architecture opens new product possibilities that weren't feasible with popup constraints:

#### Immediate Opportunities (v0.9.0+)

**1. Enhanced Transaction History**
- Full-width transaction list with rich details
- Filters, search, date range selection
- Export functionality with comprehensive data
- Transaction labels and categories

**2. Comprehensive Settings**
- Expanded settings sections without scrolling
- Visual preferences (future: theme toggle)
- Advanced security options
- Network configuration options

**3. Address Book (Contacts)**
- Dedicated contacts section in sidebar
- Rich contact cards with avatars, labels, notes
- Contact grouping and categories
- CSV import/export

**4. Multisig Wallet Management**
- Dedicated multisig section showing all multisig accounts
- PSBT management interface (import, sign, export)
- Co-signer coordination tools
- Multisig transaction history with signature status

#### Medium-Term Opportunities (Post-v1.0)

**1. DeFi Integrations**
- Connect to Bitcoin DeFi protocols
- Swap interfaces with rich transaction previews
- Liquidity provision management
- Yield farming dashboards

**2. Analytics & Insights**
- Portfolio performance graphs
- Transaction analytics and spending patterns
- Tax reporting tools
- UTXO visualization and management

**3. Educational Content**
- In-app tutorials and guides
- Interactive Bitcoin education
- Security best practices library
- Video content integration

**4. Social Features**
- Contact sharing and address resolution
- Transaction requests (payment requests)
- Shared accounts (family/team wallets)
- Activity feeds for multisig accounts

#### Long-Term Vision (Post-v2.0)

**1. Lightning Network UI**
- Full Lightning Network management
- Channel visualization and analytics
- Payment routing insights
- Lightning address management

**2. Hardware Wallet Integration**
- Rich device connection UI
- Detailed transaction approval flows
- Multi-device management
- Hardware wallet setup wizards

**3. Advanced Bitcoin Features**
- Coinjoin privacy tools
- Batch transaction creation
- Time-locked transactions UI
- Vault management (timelocked recovery)

---

### User Flow Changes & Adoption

#### Before (Popup) vs. After (Tab)

**Opening Wallet:**
- **Before:** Click icon → Small popup appears over current page → Constrained 600x400 view
- **After:** Click icon → New tab opens → Full browser window → Professional sidebar layout
- **User Adaptation:** Minimal - users familiar with opening new tabs

**Navigation:**
- **Before:** Single-screen views with back buttons or in-page navigation
- **After:** Persistent sidebar navigation - click section to switch views
- **User Adaptation:** Low - sidebar pattern is ubiquitous in web apps

**Multi-tasking:**
- **Before:** Popup closes when clicking away - users must complete actions in one session
- **After:** Wallet tab persists - users can switch to other apps and return
- **User Adaptation:** Positive - this is more natural behavior users expect

#### User Education Strategy

**Onboarding Changes:**
1. **First Launch:** No special education needed - tab behavior is intuitive
2. **Sidebar Discovery:** Icons + labels make navigation self-explanatory
3. **Account Switcher:** Orange avatar at bottom is visually prominent

**Communication Plan:**
1. **Release Notes:** Clear explanation of popup → tab change in v0.9.0 notes
2. **In-App Notice:** (Optional) First time opening v0.9.0, show brief "New Look!" tooltip
3. **Documentation:** Update README and user guides with tab-based instructions

**Expected User Reception:**
- **Power Users:** Immediate positive reaction - more space and professional UI
- **Casual Users:** May notice change but adapt quickly - tab behavior is familiar
- **New Users:** No difference - they never experienced popup version

---

### Competitive Position After Tab Architecture

#### Industry Comparison

| Wallet | Architecture | Navigation | Real Estate | Our Comparison |
|--------|--------------|------------|-------------|----------------|
| **Metamask** | Browser web app | Sidebar | Full screen | ✅ Now equivalent |
| **Phantom** | Popup + web app | Hybrid | 375x600 popup | ✅ We're better (full tab) |
| **Electrum** | Desktop app | Tabs | Full screen | ✅ Equivalent (browser-based advantage) |
| **BlueWallet** | Mobile app | Bottom tabs | Full screen | ✅ Equivalent (browser advantage) |
| **Our Wallet (Old)** | Popup | Single screen | 600x400 | ❌ We were inferior |
| **Our Wallet (v0.9.0)** | Full tab | Sidebar | Full browser | ✅ Industry leading |

**Market Position:**
- **Before v0.9.0:** Credible but constrained popup wallet
- **After v0.9.0:** Professional-grade wallet competitive with leading solutions
- **Differentiation:** Only Bitcoin-specific wallet with this level of UX polish

#### Feature Parity Achievement

**Essential UX Elements (Now Achieved):**
- ✅ Persistent sidebar navigation (Metamask-level)
- ✅ Full-screen real estate (desktop app-level)
- ✅ Professional visual design (institutional-grade)
- ✅ Scalable information architecture (room for growth)
- ✅ Multi-section organization (Assets, Multisig, Settings)

**Competitive Advantages:**
- ✅ Bitcoin-specific focus (not distracted by multi-chain complexity)
- ✅ No backend dependencies (privacy and decentralization)
- ✅ Open source and transparent
- ✅ Chrome Manifest V3 compliance (future-proof)
- ✅ Modern tech stack (React 18, TypeScript, Tailwind)

---

### Migration & Backward Compatibility

#### User Data Migration

**Migration Required:** NONE

**Compatibility:** 100% backward compatible
- Existing wallet data remains unchanged
- All encrypted storage structures identical
- Account structure and addresses preserved
- Transaction history fully intact

**User Experience:**
1. User updates extension to v0.9.0
2. User clicks extension icon (as usual)
3. Wallet opens in tab (instead of popup)
4. All accounts, balances, and settings exactly as before
5. User adapts to new UI layout (minimal learning curve)

#### Technical Migration

**Breaking Changes:** None at data level
- **Architecture:** Popup → Tab (user-facing only)
- **Code Structure:** `src/popup/` → `src/tab/` (internal refactor)
- **Entry Point:** `popup.html` → `index.html` (build artifact change)
- **Manifest:** Removed `default_popup`, added `action.onClicked` handler

**Preserved Functionality:**
- All message passing between tab and background worker identical
- All API integrations unchanged
- All cryptographic operations unchanged
- All wallet storage and encryption unchanged

**Zero Data Loss Guarantee:**
- Wallet seed phrases remain encrypted with same AES-256-GCM
- Passwords continue to work with same PBKDF2 derivation
- Accounts, addresses, and transaction history fully preserved
- No re-import or reconfiguration required

---

### Metrics & Success Criteria

#### Launch Metrics (v0.9.0 Release)

**Product Adoption:**
- **Target:** 100% of active users adopt v0.9.0 within 2 weeks
- **Measurement:** Track extension version distribution
- **Goal:** No users blocked or confused by update

**User Satisfaction:**
- **Target:** Positive feedback on new UI from early adopters
- **Measurement:** Monitor GitHub issues, user feedback channels
- **Goal:** <5% negative reactions, >50% positive mentions

**Usability:**
- **Target:** Users complete workflows without confusion
- **Measurement:** Track multisig wizard completion rates
- **Goal:** >80% completion rate (up from <20% in popup)

**Performance:**
- **Target:** No performance degradation from tab architecture
- **Measurement:** Load times, navigation speed, memory usage
- **Goal:** <500ms tab open time, <100ms navigation switches

#### Long-Term Success Indicators

**Feature Utilization:**
- Multisig account creation increases (enabled by better UX)
- Users engage with sidebar navigation sections
- Session duration increases (users keep wallet tab open longer)

**User Retention:**
- Reduced churn from UX frustrations
- Increased daily active users
- More users complete advanced workflows

**Competitive Position:**
- User reviews mention "professional UI" positively
- Users compare favorably to Metamask and other leading wallets
- Users recommend wallet to others citing UI quality

**Business Impact:**
- Increased credibility for institutional adoption
- Positive press and community reception
- Foundation for future feature expansion

---

### Risks & Mitigations

#### Risk 1: User Confusion from Architecture Change

**Risk Level:** Medium
**Probability:** Medium (30-40% of users notice change immediately)
**Impact:** Low (users adapt quickly to tab model)

**Mitigation:**
- Clear release notes explaining change
- Optional in-app tooltip on first v0.9.0 launch
- Updated documentation with tab-based instructions
- Monitor feedback channels for confusion signals

**Contingency:**
- Rapid response FAQ for common questions
- Video tutorial showing new UI (if needed)
- Community engagement to explain benefits

#### Risk 2: Browser Compatibility Issues

**Risk Level:** Low
**Probability:** Low (Chrome extension APIs are stable)
**Impact:** High if occurs (wallet unusable)

**Mitigation:**
- Thorough testing on Chrome, Edge, Brave
- Test across multiple OS platforms (Windows, Mac, Linux)
- Monitor browser console for errors
- Implement error boundaries for graceful failures

**Contingency:**
- Quick patch release if critical issue found
- Clear error messaging directing users to report issues
- Rollback plan (revert to popup) if catastrophic failure

#### Risk 3: Performance Degradation

**Risk Level:** Low
**Probability:** Low (tab architecture shouldn't impact performance)
**Impact:** Medium (users frustrated by slow UI)

**Mitigation:**
- Performance benchmarking before release
- Monitor tab open time, navigation speed
- React profiling to identify bottlenecks
- Lazy loading for heavy components

**Contingency:**
- Performance optimization sprint if needed
- Identify and fix bottlenecks quickly
- Consider code splitting if bundle size is issue

#### Risk 4: Security Control Bypass

**Risk Level:** Low
**Probability:** Very Low (multiple layers of defense)
**Impact:** Critical (security compromise)

**Mitigation:**
- Comprehensive security testing of all controls
- Multiple defense layers (CSP + runtime checks)
- Security audit of session management
- Monitoring for bypass attempts

**Contingency:**
- Rapid security patch if vulnerability found
- Clear communication with users if needed
- Incident response plan for security issues

---

### Product Roadmap Impact

#### Immediate Impact (v0.9.0 - v1.0)

**Enabled Features:**
1. ✅ Multisig wallet usability dramatically improved
2. ✅ Foundation for address book (Contacts section)
3. ✅ Enhanced transaction history with rich details
4. ✅ Comprehensive settings reorganization

**Deferred Features (No Longer Blocked):**
- Address book can now be full-featured (dedicated section)
- Transaction filtering and search now practical
- Advanced settings can expand without constraints
- PSBT management can have rich UIs

#### Medium-Term Impact (v1.0 - v2.0)

**New Opportunities:**
- DeFi integration UIs become feasible
- Analytics and insights dashboards
- Educational content integration
- Social features (contact sharing, payment requests)

**Strategic Positioning:**
- Wallet now positioned for institutional users
- Professional image enables enterprise adoption
- Feature parity with leading wallets achieved

#### Long-Term Vision (v2.0+)

**Enabled Possibilities:**
- Lightning Network management UI
- Hardware wallet integration with rich flows
- Advanced Bitcoin features (coinjoin, vaults, timelocks)
- Potential for browser-based Bitcoin OS

**Product Evolution:**
- Tab architecture is foundation for wallet becoming Bitcoin "super app"
- Sidebar navigation can scale to many more sections
- Full tab real estate enables rich, complex features
- Professional UI positions wallet as Bitcoin platform, not just wallet

---

### Decision Log: Tab Architecture Trade-offs

#### Trade-off 1: Popup Simplicity vs. Tab Capabilities

**Decision:** Sacrifice popup simplicity for tab capabilities
**Rationale:** Product has outgrown popup constraints - advanced features require more space
**Impact:** Positive - users gain professional experience, minor learning curve

#### Trade-off 2: Single Tab vs. Multi-Tab

**Decision:** Enforce single active wallet tab (security control)
**Rationale:** Multiple tabs create security confusion and session management complexity
**Impact:** Acceptable limitation - users rarely need wallet in multiple tabs

#### Trade-off 3: Popup Backward Compatibility vs. Clean Migration

**Decision:** No popup fallback option - all users move to tab architecture
**Rationale:** Maintaining both architectures doubles complexity, dilutes focus
**Impact:** Clean migration, all users on same experience, unified development

#### Trade-off 4: Gradual Rollout vs. All-at-Once

**Decision:** All-at-once migration with comprehensive release
**Rationale:** Architecture change doesn't lend itself to gradual rollout
**Impact:** Clear cut-over, predictable rollout, single version to support

---

### Stakeholder Communication

#### Internal Team Alignment

**Security Expert:** ✅ Approved security controls (single tab, clickjacking, tab nabbing)
**Frontend Developer:** ✅ Implemented sidebar navigation and tab architecture
**UI/UX Designer:** ✅ Designed 240px sidebar and Bitcoin orange color scheme
**Backend Developer:** ✅ Implemented session management and tab coordination
**QA Engineer:** ✅ Created comprehensive testing guide for v0.9.0
**Testing Expert:** ✅ Verified all automated tests pass with new architecture

#### User Communication Plan

**Pre-Release:**
1. Draft v0.9.0 release notes highlighting tab architecture
2. Update README with new tab-based instructions
3. Prepare screenshots showing new UI

**Release Day:**
1. Publish v0.9.0 with clear changelog
2. Post announcement in community channels
3. Monitor feedback for first 48 hours

**Post-Release:**
1. Respond to user questions promptly
2. Collect feedback on new UI experience
3. Plan iterations based on user input

**Documentation Updates:**
1. Update all screenshots to show tab UI
2. Revise user guides for tab interaction model
3. Add "What's New in v0.9.0" guide
4. Update architecture documentation

---

### Conclusion & Next Steps

#### Summary of Transformation

The v0.9.0 tab architecture represents a **critical product evolution** that transforms the Bitcoin Wallet from a constrained popup tool to a professional-grade, full-featured wallet application. This architectural change:

1. **Solves Critical UX Problems:** Eliminates popup constraints and workflow interruptions
2. **Enables Advanced Features:** Unlocks multisig, DeFi, and complex Bitcoin operations
3. **Positions Competitively:** Achieves UX parity with leading crypto wallet applications
4. **Establishes Foundation:** Creates scalable architecture for future feature expansion
5. **Enhances Security:** Implements four P0 security controls not feasible in popup

#### Product Manager Assessment

**Decision Quality:** ✅ Excellent
- Addresses real user pain points
- Enables strategic product goals
- Technically sound implementation
- Competitive positioning achieved

**Execution Quality:** ✅ Excellent
- Clean migration with zero data loss
- Comprehensive security enhancements
- Professional UI design and implementation
- Thorough testing and documentation

**Strategic Impact:** ✅ High
- Transforms wallet from "good popup" to "great application"
- Removes architectural constraints on roadmap
- Positions product for institutional adoption
- Establishes foundation for long-term vision

#### Next Actions for Product Manager

**Immediate (Week 1):**
1. ✅ Update product manager notes (this document)
2. Monitor v0.9.0 user feedback and adoption metrics
3. Respond to any user confusion or issues
4. Collect early user reactions for iteration planning

**Short Term (Month 1):**
1. Analyze multisig wizard completion rates (expect 80%+ improvement)
2. Review session analytics (tab open duration, navigation patterns)
3. Plan v0.9.1 polish improvements based on feedback
4. Identify next features enabled by tab architecture

**Medium Term (Quarter 1):**
1. Implement address book (Contacts section)
2. Enhance transaction history with filters/search
3. Expand settings with advanced options
4. Evaluate DeFi integration opportunities

**Long Term (Year 1):**
1. Lightning Network integration planning
2. Hardware wallet integration design
3. Advanced Bitcoin features roadmap
4. Institutional/enterprise feature prioritization

---

## Open Questions & Risks

### Open Questions

**Q1: Mainnet Launch Timeline**
- How much testnet usage before mainnet?
- External security audit required?
- Insurance or compensation strategy?
- **Resolution Target:** After 1 month of stable testnet usage

**Q2: Hardware Wallet Integration**
- Which hardware wallets to support first?
- Complexity vs. user demand?
- Partnership opportunities?
- **Resolution Target:** User survey in Month 2

**Q3: Mobile Support**
- Extension on mobile browsers?
- Separate mobile app?
- React Native potential?
- **Resolution Target:** Post-Phase 2 evaluation

**Q4: Revenue Model**
- Remain completely free?
- Optional donation mechanism?
- Premium features for funding?
- **Resolution Target:** Post-MVP, based on costs

**Q5: Multi-Language Support**
- Initial language: English only
- Prioritize which languages next?
- Translation resources?
- **Resolution Target:** Phase 3 consideration

### Risk Register

#### Risk 1: Security Vulnerability
**Probability:** Medium  
**Impact:** Critical  
**Mitigation:**
- Multiple security reviews
- Use battle-tested libraries
- Extensive testnet testing
- Bug bounty program post-launch
- Rapid response plan for vulnerabilities

#### Risk 2: Chrome API Changes
**Probability:** Low  
**Impact:** High  
**Mitigation:**
- Use stable Chrome APIs
- Monitor Chrome release notes
- Manifest V3 compliance (future-proof)
- Flexible architecture for API changes

#### Risk 3: Blockstream API Reliability
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Implement exponential backoff
- Cache responses appropriately
- Clear error messages for users
- Consider backup API providers
- Monitor API uptime

#### Risk 4: User Adoption
**Probability:** Medium  
**Impact:** High  
**Mitigation:**
- Focus on exceptional UX
- Clear marketing and positioning
- Community engagement
- Responsive to user feedback
- Content marketing strategy

#### Risk 5: Regulatory Changes
**Probability:** Low  
**Impact:** Medium  
**Mitigation:**
- Non-custodial design (users control keys)
- No KYC requirements
- Monitor regulatory landscape
- Legal review if scaling

#### Risk 6: Competition
**Probability:** Medium  
**Impact:** Medium  
**Mitigation:**
- Fast iteration and improvement
- Community engagement
- Superior UX focus
- Open source advantage
- First-mover advantage in Chrome/V3 space

---

## Action Items & Next Steps

### Immediate Actions (This Week)
- [x] Create this working document
- [ ] Review ARCHITECTURE.md with technical team
- [ ] Schedule kickoff meeting with all role owners
- [ ] Create detailed user story backlog
- [ ] Review and approve UI/UX initial wireframes
- [ ] Define MVP feature freeze date
- [ ] Set up project tracking system

### Week 1 Priorities
- [ ] Finalize all MVP user stories
- [ ] Approve initial UI designs
- [ ] Review security architecture with security expert
- [ ] Establish communication cadence with team
- [ ] Create product demo schedule
- [ ] Set up metrics and analytics plan
- [ ] Begin competitive research deep-dive

### Month 1 Goals
- [ ] All user stories documented with acceptance criteria
- [ ] Product roadmap through Phase 2 defined
- [ ] UI/UX designs approved
- [ ] Development sprint planning complete
- [ ] Success metrics dashboard planned
- [ ] Beta testing plan finalized
- [ ] Marketing and positioning strategy drafted

---

## Notes & Observations

**October 12, 2025 (Initial Setup):**
- Initial document created based on project requirements
- ARCHITECTURE.md provides solid technical foundation
- Team structure appears well-defined with clear roles
- MVP scope is appropriate for 10-week timeline
- Security-first approach is critical given crypto wallet nature
- MetaMask inspiration provides good UX baseline
- Testnet-first approach reduces risk appropriately

**October 12, 2025 (Multisig Feature Implementation):**
- Multisig wallet feature core infrastructure completed
- BIP48/67/174 compliance implemented and tested
- Three configurations chosen based on real-world use case analysis
- Comprehensive user education library built into feature
- PSBT-based coordination maintains no-backend architecture
- Implementation status: Core complete, UI integration in progress
- Feature represents significant value add for power users and institutions
- Educational content is extensive - shows commitment to user understanding
- Testnet-only approach for complex feature is prudent
- Risk assessment identifies key challenges (coordination, complexity, education)

**Key Insights:**
- Bitcoin browser wallet market is underserved
- MetaMask has proven browser wallet demand
- Security will be our #1 priority and #1 challenge
- User education will be critical for adoption
- BIP compliance ensures interoperability
- No backend is a major privacy advantage
- **Multisig feature differentiates wallet from competitors**
- **Educational content is as important as technical implementation for multisig**
- **PSBT standard enables interoperability with hardware wallets and other software**

**Areas to Watch:**
- Blockstream API reliability and rate limits
- Chrome service worker lifecycle challenges
- User feedback on address type selection
- Actual testnet usage patterns
- Security vulnerability discovery
- Competition developments
- **Multisig adoption rates and configuration preferences**
- **PSBT coordination user experience and pain points**
- **Help content effectiveness metrics**
- **Interoperability with other wallets (Electrum, Specter, hardware wallets)**

---

**Document Status:** Living document - updated regularly  
**Next Review:** Weekly during active development  
**Stakeholders:** All project team members  
**Access:** Project team and authorized stakeholders

---

*This document serves as the Product Manager's source of truth for the Bitcoin Wallet Chrome Extension project. It should be updated continuously as decisions are made, features are developed, and feedback is received.*

