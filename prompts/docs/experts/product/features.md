# Feature Specifications

**Last Updated**: October 30, 2025
**Owner**: Product Manager
**Purpose**: Detailed feature specifications, MVP features, feature status

---

## Quick Navigation

- [Feature Overview](#feature-overview)
- [MVP Features](#mvp-features-v040)
- [Post-MVP Features](#post-mvp-features)
- [Future UI/UX Enhancement Ideas](#future-uiux-enhancement-ideas)
- [Feature Status Matrix](#feature-status-matrix)
- [Related Documentation](#related-documentation)

---

## Feature Overview

This document provides detailed specifications for all features in the Bitcoin Wallet Chrome Extension, including:
- Feature descriptions and value propositions
- Technical requirements
- Acceptance criteria
- Implementation status
- Related user stories and documentation

**Priority Levels**:
- **P0 (Critical)**: Must-have for release, blocks other work
- **P1 (High)**: Should-have, significant user value
- **P2 (Nice-to-have)**: Can be deferred without major impact

---

## MVP Features (v0.4.0)

### 1. Wallet Setup Flow

#### 1.1 Create New Wallet

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: First-time users need to create a secure Bitcoin wallet

**Requirements**:
- Generate cryptographically secure 12-word BIP39 seed phrase
- User selects address type (Legacy/SegWit/Native SegWit) with clear explanations
- User creates password with minimum 8 characters and strength indicator
- Display seed phrase with clear warnings about backup importance
- Seed phrase confirmation step (select words in correct order to verify backup)
- Security education throughout flow (tooltips, warnings, best practices)
- Clear visual feedback at each step (progress indicators, success states)

**Technical Implementation**:
- Use `bip39` library for mnemonic generation (128-bit entropy)
- Validate password strength in real-time
- PBKDF2 key derivation (100,000 iterations) for encryption key
- AES-256-GCM encryption for seed phrase storage
- Store encrypted wallet data in chrome.storage.local

**Acceptance Criteria**:
- ✅ Generates cryptographically secure 12-word seed phrase
- ✅ Password meets strength requirements
- ✅ Seed phrase is displayed one time only
- ✅ User must confirm seed phrase before proceeding
- ✅ Wallet is encrypted and stored securely
- ✅ First account (Account 1) is created automatically
- ✅ User sees dashboard after successful creation

**Related**:
- User Story 1.1 (see [requirements.md](./requirements.md#story-11-create-wallet-as-new-user))
- Address Type Selection Decision (see [decisions.md](./decisions.md#decision-1-address-type-selection))
- Seed Phrase Length Decision (see [decisions.md](./decisions.md#decision-2-seed-phrase-length))

---

#### 1.2 Import Existing Wallet

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: Users need to restore wallet from backup or migrate from another wallet

**Requirements**:
- Support both 12-word and 24-word BIP39 seed phrases
- Support single private key import (WIF format) for one account
- Input validation with clear, actionable error messages
- Address type selection for imported wallets
- Password creation for extension security
- Automatic account discovery for seed phrase imports (gap limit: 20)
- Optional support for BIP39 passphrases (advanced feature)

**Technical Implementation**:
- Validate BIP39 mnemonic checksum
- Support BIP39 passphrases (12th/24th word)
- Scan blockchain for existing accounts using gap limit
- Import WIF private keys (compressed and uncompressed)
- Derive account structure based on address type

**Acceptance Criteria**:
- ✅ Accepts valid 12 or 24-word seed phrases
- ✅ Validates seed phrase format and checksum
- ✅ Accepts WIF private keys for single account import
- ✅ Discovers existing accounts with balances (up to gap limit)
- ✅ Creates appropriate account structure
- ✅ Encrypts and stores wallet securely
- ✅ Shows dashboard with imported accounts

**Related**:
- User Story 1.2 (see [requirements.md](./requirements.md#story-12-import-existing-wallet))
- Private Key Import feature (v0.10.0)

---

### 2. Account Management

#### 2.1 Multi-Account Support

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0, enhanced v0.9.0)
**User Need**: Users want separate accounts for different purposes (personal, business, testing)

**Requirements**:
- Support unlimited accounts following BIP44 standard (practical limit: 100)
- Each account has unique BIP44 derivation path
- Account dropdown/panel similar to MetaMask (familiar UX pattern)
- Display account name, balance, and address in dropdown
- Default naming: "Account 1", "Account 2", etc.
- Visual indicator for currently selected account
- Persistent account selection across sessions

**Technical Implementation**:
- BIP44 derivation paths: `m/44'/1'/account'/0/index` (testnet)
- Increment account index for each new account
- Store account metadata (index, name, type) in encrypted storage
- Load balance via Blockstream API on account switch
- Maintain selected account ID in storage

**Acceptance Criteria**:
- ✅ Users can create new accounts
- ✅ Each account has correct BIP44 derivation path
- ✅ Account switching updates UI immediately
- ✅ All accounts are derived from single seed phrase
- ✅ Balance displays correctly for each account
- ✅ Selected account persists after extension close

**Related**:
- User Story 2.1 (see [requirements.md](./requirements.md#story-21-create-additional-accounts))
- Tab architecture enhancements (v0.9.0)

---

#### 2.2 Custom Account Names

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: Users want to label accounts with meaningful names

**Requirements**:
- Edit icon/button next to account name
- Inline editing or modal dialog for renaming
- Name validation (maximum 30 characters)
- Unique names encouraged but not enforced
- Names stored in encrypted storage
- UTF-8 support (including emoji)

**Technical Implementation**:
- 30 character maximum length
- UTF-8 encoding support
- Validate on input (no restrictions on characters)
- Store in account metadata
- Update UI immediately on save

**Acceptance Criteria**:
- ✅ Users can rename accounts
- ✅ Name changes persist across sessions
- ✅ Names display in account dropdown
- ✅ Character limit enforced (30 chars)
- ✅ Special characters allowed
- ✅ Emoji support (optional enhancement)

**Related**:
- User Story 2.2 (see [requirements.md](./requirements.md#story-22-rename-accounts))

---

#### 2.3 Address Generation

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: Generate new receiving addresses for privacy

**Requirements**:
- Generate addresses on demand (external chain: m/.../0/index)
- Follow BIP44 address gap limit (20 unused addresses maximum)
- Support external (receiving) and internal (change) address chains
- Display current address prominently on receive screen
- Show address index for power users (e.g., "Address #5")
- Warn against excessive address generation without use

**Technical Implementation**:
- External chain (receiving): `m/44'/1'/account'/0/index`
- Internal chain (change): `m/44'/1'/account'/1/index`
- Gap limit: Stop scanning after 20 consecutive unused addresses
- Track highest used index per chain
- Generate addresses deterministically from seed

**Acceptance Criteria**:
- ✅ Generates valid Bitcoin addresses
- ✅ Addresses match selected address type
- ✅ Gap limit of 20 enforced
- ✅ Address derivation is deterministic
- ✅ Change addresses generated automatically
- ✅ Address reuse detection and warning

**Related**:
- Privacy enhancement: Auto-generate fresh addresses (v0.11.0 planned)

---

### 3. Send Transaction Flow

#### 3.1 Transaction Form

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0, enhanced v0.9.0)
**User Need**: Send Bitcoin to another address

**Requirements**:
- Recipient address input with real-time validation
- Amount input in BTC (with optional USD conversion - future)
- "Send Max" button to send entire balance minus fees
- Fee selection: Slow / Medium / Fast (based on Blockstream API)
- Display fee in sat/vB and total BTC
- Display estimated confirmation time for each fee speed
- Transaction preview modal before signing
- Password re-entry for final confirmation
- Clear, actionable error messages for all failure cases

**Technical Implementation**:
- Validate address format using bitcoinjs-lib
- Check address network (testnet/mainnet) compatibility
- Fetch fee estimates from Blockstream API (`/fee-estimates`)
- Build transaction using UTXO selection algorithm
- Sign transaction with HDSigner
- Broadcast via Blockstream API POST `/tx`

**Acceptance Criteria**:
- ✅ Validates Bitcoin address format
- ✅ Detects and warns about address type mismatches
- ✅ Prevents sending more than available balance
- ✅ Accurate fee estimation from Blockstream API
- ✅ "Send Max" calculates correctly (balance - fees)
- ✅ Transaction preview shows all details
- ✅ Password verification before signing
- ✅ Transaction broadcasts successfully
- ✅ Shows transaction ID after broadcast
- ✅ Updates balance immediately (optimistic update for pending tx)

**Related**:
- User Story 3.1 (see [requirements.md](./requirements.md#story-31-send-bitcoin-transaction))
- Send to Contact feature (v0.9.0)

---

#### 3.2 UTXO Selection

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0), **🔄 Enhancement Planned (v0.11.0)**
**User Need**: Efficient coin selection for transactions

**Current Implementation**:
- Automatic UTXO selection algorithm (largest-first strategy)
- Prefer confirmed UTXOs over unconfirmed
- Minimize transaction size when possible
- Handle change outputs correctly
- Consider current fee rates in selection

**Planned Enhancement (v0.11.0 - Privacy)**:
- **Randomized UTXO selection** to prevent wallet fingerprinting
- Privacy-aware selection algorithm (balance privacy vs. fees)
- Cryptographically secure randomization (crypto.getRandomValues())

**Technical Implementation**:
- Select UTXOs to cover amount + fees
- Create change output if remainder > dust threshold
- Use largest-first or best-fit algorithm (current)
- **Future**: Add randomization layer for privacy

**Acceptance Criteria**:
- ✅ Selects sufficient UTXOs for transaction
- ✅ Minimizes fees through smart selection
- ✅ Creates change output when necessary
- ✅ Handles dust outputs appropriately
- ✅ Works with various UTXO distributions
- ⏳ Randomized selection prevents fingerprinting (v0.11.0)

**Related**:
- Privacy Enhancement: Randomized UTXO Selection (v0.11.0)
- See `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`

---

### 4. Receive Bitcoin

#### 4.1 Address Display

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: Share receiving address with others

**Requirements**:
- Display current receiving address prominently (large, readable font)
- QR code generation for mobile wallet scanning
- Copy to clipboard button with user feedback
- "Generate New Address" button for privacy
- Display address type label (Legacy/SegWit/Native SegWit)
- Show address index for reference (e.g., "Address #3")
- Provide guidance on address reuse best practices

**Technical Implementation**:
- Display current external address (lowest unused index)
- Generate QR code using qrcode.js library
- Copy to clipboard using navigator.clipboard API
- Show "Copied!" feedback message
- Increment address index on "Generate New Address"

**Acceptance Criteria**:
- ✅ Address displays in readable format
- ✅ QR code is scannable and accurate
- ✅ Copy button provides user feedback
- ✅ New address generation works correctly
- ✅ Addresses follow BIP44 standards
- ✅ Address type clearly indicated

**Related**:
- User Story 4.1 (see [requirements.md](./requirements.md#story-41-receive-bitcoin))
- Privacy enhancement: Auto-generate prompts (v0.11.0)

---

### 5. Transaction History

#### 5.1 Transaction List

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0, enhanced v0.9.0)
**User Need**: View past transactions

**Requirements**:
- List all transactions for current account
- Show sent and received transactions with distinct styling
- Display amount, fee (for sent transactions), confirmations
- Show timestamp (formatted) or "Pending" status
- Link to Blockstream block explorer for each transaction
- Pagination or infinite scroll for large transaction histories
- Refresh button to manually update history
- Auto-refresh every 30 seconds when wallet unlocked

**Technical Implementation**:
- Fetch transactions from Blockstream API (`/address/{address}/txs`)
- Aggregate transactions from all account addresses
- Parse and categorize (sent/received)
- Calculate net effect on balance
- Display in reverse chronological order

**Acceptance Criteria**:
- ✅ Displays all account transactions
- ✅ Correctly identifies sent vs. received
- ✅ Shows confirmation count or pending status
- ✅ Amounts displayed accurately
- ✅ Block explorer links work correctly
- ✅ Real-time updates for pending transactions
- ✅ Handles empty state (no transactions yet)

**Related**:
- User Story 5.1 (see [requirements.md](./requirements.md#story-51-view-transaction-history))
- Transaction detail pane (v0.9.0)

---

#### 5.2 Transaction Details

**Priority**: P1 (High)
**Status**: 🔄 Partially Implemented (v0.9.0)
**User Need**: View detailed transaction information

**Requirements**:
- Expand transaction to see full details
- Show all inputs and outputs
- Display transaction size (bytes/vB) and fee rate (sat/vB)
- Show block height and timestamp
- Display transaction ID with copy button
- Show confirmations progress (0 to 6+)
- **Future**: Identify which addresses/outputs are mine (change detection)
- **Future**: View raw transaction data (advanced users)

**Technical Implementation**:
- Fetch full transaction data from Blockstream API
- Parse inputs and outputs
- Calculate transaction size and fee rate
- Display block information
- Link to block explorer

**Acceptance Criteria**:
- ✅ All transaction data displayed accurately
- ✅ Inputs and outputs are clear
- ✅ Fee calculations are correct
- ✅ Links to block explorer work
- ✅ Copy transaction ID works
- ✅ Loading states handled properly
- ⏳ Change detection (future enhancement)

**Related**:
- User Story 5.2 (see [requirements.md](./requirements.md#story-52-view-transaction-details))

---

### 6. Security Features

#### 6.1 Password Protection

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: Protect wallet from unauthorized access

**Requirements**:
- Password required on first wallet creation
- Unlock screen after lock or extension restart
- Password strength requirements (minimum 8 characters)
- Password strength indicator during creation (weak/medium/strong)
- "Show/Hide password" toggle for user convenience
- No password recovery mechanism (intentional design for security)
- Clear messaging about password importance and no-recovery policy

**Technical Implementation**:
- PBKDF2 key derivation (100,000 iterations, SHA-256)
- AES-256-GCM encryption for wallet data
- Password never stored (only used to derive encryption key)
- Lock state managed by background service worker
- Re-derive encryption key on unlock

**Acceptance Criteria**:
- ✅ Cannot access wallet without correct password
- ✅ Password strength enforced (minimum 8 chars)
- ✅ Incorrect password shows clear error message
- ✅ Password never stored in plain text (or at all)
- ✅ Service worker restart requires re-unlock
- ✅ Clear security guidance provided to users

**Related**:
- User Story 6.1 (see [requirements.md](./requirements.md#story-61-secure-wallet-with-password))
- Encrypted Storage feature (below)

---

#### 6.2 Auto-Lock

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.4.0, enhanced v0.9.0)
**User Need**: Automatic wallet lock for security

**Requirements**:
- Auto-lock after 15 minutes of inactivity (keyboard/mouse events)
- Manual lock button always accessible in UI
- All sensitive data cleared from memory on lock
- **Future**: Configurable timeout in settings
- Lock icon/button always visible in sidebar

**Enhanced Requirements (v0.9.0 - Tab Architecture)**:
- Additional 5-minute auto-lock when tab is hidden (not in focus)
- Single tab enforcement (only one active wallet tab)
- Tab nabbing detection and prevention
- Clickjacking prevention

**Technical Implementation**:
- Inactivity timer in background service worker
- Reset timer on user interaction
- Clear decrypted keys from memory on lock
- **v0.9.0**: Hidden tab timer (5 minutes)
- **v0.9.0**: Session token validation for single tab

**Acceptance Criteria**:
- ✅ Wallet locks after 15 minutes of inactivity
- ✅ Manual lock button works
- ✅ All decrypted data cleared on lock
- ✅ Cannot perform operations when locked
- ✅ Unlock flow is smooth and user-friendly
- ✅ No data leakage after lock
- ✅ Tab-specific security controls (v0.9.0)

**Related**:
- User Story 6.2 (see [requirements.md](./requirements.md#story-62-auto-lock-protection))
- Auto-Lock Timeout Decision (see [decisions.md](./decisions.md#decision-3-auto-lock-timeout))

---

#### 6.3 Encrypted Storage

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)
**User Need**: Secure storage of sensitive wallet data

**Requirements**:
- AES-256-GCM encryption for seed phrase and private keys
- PBKDF2 key derivation (100,000 iterations minimum, SHA-256)
- Unique salt generated per wallet (cryptographically secure random)
- Secure random IV generation for each encryption operation
- Only store encrypted data in chrome.storage.local
- Never log sensitive information (keys, passwords, seeds)

**Technical Implementation**:
- Use Web Crypto API for encryption operations
- Generate salt using crypto.getRandomValues()
- Derive encryption key from password + salt using PBKDF2
- Encrypt wallet data with AES-256-GCM
- Store only encrypted data and salt

**Acceptance Criteria**:
- ✅ Seed phrase encrypted with AES-256-GCM
- ✅ PBKDF2 with 100,000 iterations minimum
- ✅ Unique salt generated per wallet
- ✅ Encryption verified through security audit
- ✅ No sensitive data in plain text storage
- ✅ Audit logs confirm no leakage

**Related**:
- Security Expert audit results
- See `prompts/docs/security-expert-notes.md`

---

## Post-MVP Features

### 7. Multi-Signature Wallets

**Status**: ✅ Fully Implemented
**Initial Release**: v0.8.0 (Core multisig functionality)
**Enhanced UX**: v0.9.0 (Tab-based wizard)
**Priority**: P1 (High)

#### Feature Overview

Multi-signature (multisig) wallet support enables users to create Bitcoin accounts that require multiple signatures to authorize transactions. This provides enhanced security for high-value holdings and enables use cases like business partnerships, inheritance planning, and institutional custody.

**Key Value Propositions**:
1. **Enhanced Security**: No single point of failure - requires cooperation of multiple parties
2. **Business Use Cases**: Joint accounts for partnerships, board approvals, treasury management
3. **Inheritance Planning**: 2-of-3 setups with family members and trusted advisors
4. **Institutional Grade**: Multi-party approval workflows for corporate Bitcoin holdings
5. **Compliance**: Meet organizational requirements for multi-party authorization

#### Supported Configurations

| Configuration | Description | Primary Use Case | Security Level |
|---------------|-------------|------------------|----------------|
| **2-of-2** | Both parties must sign | Joint accounts, partnerships | High |
| **2-of-3** | Any 2 of 3 parties must sign | Inheritance, small teams | Very High |
| **3-of-5** | Any 3 of 5 parties must sign | DAOs, larger organizations | Highest |

**Decision Rationale**: These three configurations cover 90%+ of real-world multisig use cases based on industry research.

#### Technical Implementation

**BIP Standards Compliance**:
- **BIP48**: Multisig HD wallet derivation paths
- **BIP67**: Deterministic P2SH multisig address ordering
- **BIP174**: Partially Signed Bitcoin Transactions (PSBT) for coordination

**Address Type Support**:
- **P2SH (Legacy Multisig)**: `3...` addresses, broad compatibility
- **P2WSH (Native SegWit Multisig)**: `tb1q...` addresses, lowest fees, best privacy
- **P2SH-P2WSH (Nested SegWit)**: `2...` addresses, compatibility + some SegWit benefits

**Derivation Paths (BIP48)**:
```
m/48'/{coin_type}'/{account}'/{script_type}'/{change}/{index}

Where:
- coin_type = 1 (testnet) or 0 (mainnet)
- script_type = 1 (P2SH), 2 (P2WSH), 1 (P2SH-P2WSH)
- change = 0 (receiving) or 1 (change addresses)
- index = address index
```

#### User Workflow

**Phase 1: Setup (Coordinator)**
1. Choose "Create Multisig Account" from account management
2. Select configuration (2-of-2, 2-of-3, or 3-of-5)
3. Review educational content about chosen configuration
4. Select address type (P2SH, P2WSH, or P2SH-P2WSH)
5. Export extended public key (xpub) to share with co-signers

**Phase 2: Coordination (All Co-signers)**
1. Each co-signer generates and shares their xpub
2. All co-signers import the other co-signers' xpubs
3. Wallet derives multisig addresses using all xpubs (BIP67 ordering)
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

#### Tab-Based Wizard (v0.9.0)

**Enhancement Rationale**: Original popup-based wizard had critical UX issues:
- Popup closed when users clicked away (lost progress)
- Limited 600x400px space was cramped for complex multi-step wizard
- File picker dialogs caused popup closure

**Solution**: Full browser tab for multisig wizard
- Persistent state (tab doesn't close on focus loss)
- Full browser window space
- Progress save/resume with 30-day expiration
- Duplicate tab prevention

**Related**:
- See [decisions.md](./decisions.md#decision-6-move-multisig-wizard-to-browser-tab)
- See `prompts/docs/plans/TAB_BASED_MULTISIG_WIZARD_PRD.md`
- See `prompts/docs/plans/MULTISIG_WIZARD_TAB_DESIGN_SPEC.md`

---

### 8. Private Key Export/Import

**Status**: ✅ Implemented (v0.10.0)
**Priority**: P1 (High)

#### Feature Overview

Per-account private key export and import functionality enables users to:
- Export individual account private keys for backup or migration
- Import private keys from other wallets as new accounts
- Create offline backups with optional password protection
- Generate PDF backups with QR codes for offline storage

**Key Value Propositions**:
1. **Account Mobility**: Move specific accounts between wallets
2. **Backup Flexibility**: Create per-account backups in addition to seed phrase
3. **Offline Storage**: PDF with QR codes for paper wallet backups
4. **Migration**: Import accounts from other Bitcoin wallets

#### Export Features

**WIF Format Export**:
- Export private key in standard WIF (Wallet Import Format)
- Support for compressed and uncompressed keys
- Network-specific encoding (testnet vs mainnet)

**Optional Password Protection**:
- BIP38-style password protection for exported keys
- 100,000 PBKDF2 iterations for key derivation
- Clear security warnings about password importance

**PDF Export with QR Codes**:
- Generate PDF with account details, WIF key, and QR code
- Suitable for printing and offline storage
- Clear labeling and security warnings on PDF

**Security Measures**:
- Require password re-entry before export
- Multiple security warnings during export flow
- Clear user education about risks
- Exported keys are not stored (one-time display)

#### Import Features

**WIF Key Import**:
- Import WIF-format private keys
- Auto-detect address type from key format
- Network validation (testnet/mainnet)

**Account Creation**:
- Create new "Imported Account" from private key
- Mark as imported (not derived from seed)
- Load balance and transaction history

**Duplicate Detection**:
- Prevent importing same key twice
- Check against existing accounts

**Related**:
- See `prompts/docs/plans/PRIVATE_KEY_EXPORT_IMPORT_PRD.md`
- See `prompts/docs/plans/PRIVATE_KEY_EXPORT_IMPORT_SECURITY_SPEC.md`
- See `prompts/docs/plans/PRIVATE_KEY_EXPORT_IMPORT_UX_SPEC.md`

---

### 9. Contacts Management (Contacts V2)

**Status**: ✅ Implemented (v0.9.0)
**Priority**: P1 (High)

#### Feature Overview

Contacts management (address book) enables users to save frequently-used Bitcoin addresses with labels, categories, and notes. Contacts V2 includes enhanced privacy features to warn users about address reuse.

**Key Features**:
- Add/edit/delete contacts
- Contact name, label/category, notes
- Address validation on save
- Contact list view with search/filter
- Select contact when sending (auto-fill address)
- Privacy badges for address reuse tracking

**Privacy Enhancements (v0.11.0 Planned)**:
- Privacy badge showing address reuse count
- Warnings when sending to reused addresses
- Suggestions to request fresh address (xpub-based contacts)
- Privacy risk education

**Related**:
- See [requirements.md](./requirements.md#epic-contacts-management)
- Privacy Enhancement PRD (v0.11.0)

---

### 10. Privacy Enhancements (v0.11.0)

**Status**: ⏳ Planned (PRD Complete)
**Priority**: P0 (Critical Fixes), P1 (High Priority Features), P2 (Nice to Have)

#### Feature Overview

Comprehensive privacy enhancement release targeting Bitcoin Privacy Wiki compliance and implementing privacy-by-default best practices.

**Critical Privacy Fixes (P0)**:
1. **Unique Change Addresses** - Every transaction uses fresh change address
2. **Contact Privacy Warnings** - Warn about address reuse with contacts

**High Priority Features (P1)**:
1. **Randomized UTXO Selection** - Prevent wallet fingerprinting
2. **Auto-Generate Address Prompts** - Encourage fresh receive addresses

**Optional Privacy Mode (P2)**:
1. **Round Number Randomization** - Prevent change detection
2. **API Timing Delays** - Prevent network clustering
3. **Broadcast Delays** - Prevent timing correlation

**Documentation & Education**:
- Comprehensive PRIVACY_GUIDE.md
- In-app privacy tips and warnings
- Bitcoin Privacy Wiki compliance scorecard

**Related**:
- See `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`
- See `prompts/docs/plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md`
- See `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md`
- See [requirements.md](./requirements.md#privacy-enhancement-requirements-v0110)

---

### 11. Wallet Restore from Private Key (v0.11.0)

**Status**: ⏳ PRD Complete (Implementation Pending)
**Priority**: P0 (Critical Recovery Gap)

#### Feature Overview

**Critical Problem**: Users who backed up their wallet by exporting a private key file cannot restore their wallet during initial setup. The current wallet setup flow only supports creating from a new seed phrase or importing an existing seed phrase. This is a **critical recovery gap** that blocks users from accessing funds despite having valid backups.

**Solution**: Add "Import Private Key" as a third option in wallet setup, allowing users to initialize a wallet from a WIF private key backup without requiring a seed phrase. This creates a **non-HD wallet** (no hierarchical deterministic seed) with a single imported account.

**Key Value Propositions**:
1. **Recovery Completion**: Users can restore wallet from private key backups
2. **Backup Flexibility**: Private key export feature is now truly useful for recovery
3. **Migration Support**: Users can migrate from simple wallets (non-HD) to this wallet
4. **Trust Restoration**: Export feature promise (backup) now actually works for recovery

#### Technical Approach

**Non-HD Wallet Structure**:
```typescript
StoredWalletV2 {
  version: 2,
  encryptedSeed: '',  // EMPTY - no HD seed
  salt: '{wallet_encryption_salt}',
  iv: '{wallet_encryption_iv}',
  accounts: [{
    accountType: 'single',
    index: 0,
    name: 'Imported Account',
    addressType: 'native-segwit',  // Auto-detected
    importType: 'private-key',
    externalIndex: 0,
    internalIndex: 0,
    addresses: [ /* derived from private key */ ]
  }],
  importedKeys: {
    0: {
      encryptedData: '{encrypted_wif}',
      salt: '{key_encryption_salt}',
      iv: '{key_encryption_iv}',
      type: 'private-key'
    }
  },
  // ... rest of wallet structure
}
```

**Key Design Decisions**:
1. **Empty Seed Field**: `encryptedSeed = ''` (not null/undefined for type safety)
2. **Single Account**: Non-HD wallets support only the imported account
3. **Change Addresses**: Reuse same address OR derive from private key + deterministic index
4. **Separate Signing**: Transaction signing uses private key directly (not HD derivation)
5. **Migration Path**: User must create new wallet with seed phrase to get HD features

#### User Workflow

**Setup Screen Enhancement**:
```
┌─────────────────────────────────────────┐
│  [ Create New ]  [ Import Seed ]       │
│  [ Import Private Key ] ← NEW           │
└─────────────────────────────────────────┘
```

**Import Flow**:
1. User selects "Import Private Key" tab
2. User chooses: Upload File OR Paste WIF
3. System detects if file is encrypted
4. If encrypted: User enters file password
5. System validates WIF (network, format, checksum)
6. System shows preview: Network, first address, address type
7. User sets wallet password (for new wallet)
8. User names account (optional)
9. System creates non-HD wallet
10. User sees unlock screen → Dashboard

**Edge Cases Handled**:
- Network mismatch (mainnet key on testnet wallet)
- Wrong file password (clear error, allow retry)
- Corrupted file (detect and error gracefully)
- Uncompressed keys (force legacy address type)
- Zero balance (warn but allow import)
- Duplicate import (block with error)

#### Security Considerations

**Encryption**:
- WIF stored with same AES-256-GCM as wallet
- Separate salt/IV for private key (defense-in-depth)
- PBKDF2 100k iterations (consistent with wallet)

**Memory Handling**:
- Clear decrypted WIF immediately after wallet creation
- No logging of private keys
- Secure random for encryption parameters

**User Education**:
- Warning: "This wallet has no seed phrase"
- Warning: "Cannot create new accounts without seed"
- Recommendation: Eventually migrate to HD wallet

#### Limitations

**Non-HD Wallet Limitations**:
- Cannot create additional accounts from HD derivation
- Cannot export seed phrase (doesn't have one)
- Address reuse for change (or limited derivation)
- Less privacy than HD wallets

**Migration Encouragement**:
- Show banner suggesting HD wallet creation
- Link to help article on HD vs non-HD wallets
- Provide clear migration path (import seed → transfer funds)

#### Success Metrics

**Target Adoption**:
- 80% of users with private key backups can restore successfully
- <5% failure rate for valid WIF imports

**Quality Metrics**:
- Import success rate: >95%
- Decryption success (correct password): >95%
- Network mismatch rate: <2% (clear validation)

**User Satisfaction**:
- Support tickets <5% of all private key import attempts
- No data loss reports (successful recovery)
- User confidence in backup strategy restored

#### Related Documentation

**Primary PRD**:
- [WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md](../plans/WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md) - Complete product requirements

**Related Features**:
- Private Key Export (v0.10.0) - Completes the export/import cycle
- Import Wallet (v0.4.0) - Existing seed phrase import

**Questions for Experts**:
- **Blockchain Expert**: Non-HD wallet structure, address derivation strategy
- **Security Expert**: Non-HD wallet security, memory handling
- **UI/UX Designer**: Tab layout, password field organization, error messaging

---

### 12. Tab-Based Architecture

**Status**: ✅ Implemented (v0.9.0)
**Priority**: P0 (Critical Product Evolution)

#### Feature Overview

Fundamental architectural transformation from popup-based interface to full browser tab with persistent sidebar navigation. This change enhances UX, enables complex features, and positions the wallet competitively.

**Key Benefits**:
1. **Unlimited Screen Space** - Full browser window vs. 600x400px popup
2. **Persistent State** - Tab doesn't close when switching apps
3. **Professional Navigation** - 240px sidebar with persistent navigation
4. **Enhanced Security** - Single tab enforcement, clickjacking prevention

**Security Controls**:
- Single tab enforcement (cryptographic session tokens)
- Clickjacking prevention (CSP + iframe detection)
- Tab nabbing prevention (location monitoring)
- Auto-lock on hidden tab (5 minutes)

**Navigation Structure**:
- Assets (₿) - Main dashboard
- Multi-sig Wallets (🔐) - Multisig management
- Contacts (👥) - Address book
- Settings (⚙️) - Configuration

**Related**:
- See [decisions.md](./decisions.md#decision-6-move-multisig-wizard-to-browser-tab)
- Product rationale and detailed specs in product-manager-notes.md section "Tab-Based Architecture Transformation"

---

### 13. Privacy Mode Toggle (Future Enhancement)

**Status**: ⏳ Concept - Future Release (TBD)
**Priority**: P2 (Nice-to-have)

#### Feature Overview

Privacy mode toggle allows users to conceal sensitive financial information (balances and dollar amounts) for privacy when sharing screens, using wallet in public, or when others are nearby. This addresses a common user need to temporarily hide financial details without logging out.

**Key Value Propositions**:
1. **Screen Privacy**: Safely use wallet during screen shares or in public
2. **Shoulder Surfing Protection**: Prevent others from viewing balances
3. **Quick Toggle**: Fast, contextual access without navigating to settings
4. **User Control**: Users decide when to show/hide sensitive information

#### Proposed User Experience

**Two Toggle Methods**:

1. **Settings Toggle** (Global Control):
   - Privacy toggle in Settings → Privacy section
   - Toggle switches between "Show Balances" and "Hide Balances"
   - Persists preference across sessions
   - Default state: Balances visible

2. **Quick Toggle** (Contextual):
   - Click any balance or dollar amount to toggle privacy mode
   - Provides instant access without navigating to settings
   - Visual indicator when in privacy mode (e.g., eye icon crossed out)
   - Toggle state syncs with settings preference

**Privacy Behavior**:
- When enabled: All balances and dollar amounts show as "••••• BTC" or "$ •••••"
- Account balances, transaction amounts, USD equivalents all hidden
- QR codes and addresses remain visible (different privacy concern)
- Privacy state persists across tabs/sessions

#### Technical Considerations

**Implementation Approach**:
```typescript
// State management
interface PrivacySettings {
  balancesHidden: boolean;
}

// Display component
<Balance
  amount={balance}
  hidden={privacySettings.balancesHidden}
  onToggle={() => togglePrivacy()}
/>
```

**Frontend Requirements**:
- Global privacy state in context/store
- Consistent toggle behavior across all balance displays
- Visual indicator for privacy mode active
- Clickable balance components with hover states
- Smooth transition animations

**Storage**:
- Store privacy preference in chrome.storage.local
- Non-sensitive preference (can be unencrypted)
- Default to "false" (balances visible)

**Edge Cases**:
- First-time user: Show tooltip explaining quick-toggle feature
- Multiple tabs: Sync privacy state across tabs
- Screenshot prevention: Consider OS-level screenshot blocking (advanced)

#### Design Considerations

**Visual Design**:
- Hidden state: "••••• BTC" or blur effect
- Privacy indicator: Eye icon with slash when active
- Hover state: Subtle indication that balance is clickable
- Color: Use neutral color for privacy indicator

**Accessibility**:
- Screen reader: Announce privacy state changes
- Keyboard: Space/Enter to toggle when focused on balance
- High contrast mode: Ensure hidden state is distinguishable

**User Education**:
- Tooltip on first balance hover: "Click to toggle privacy mode"
- Settings help text: Explain both toggle methods
- Privacy guide documentation: Explain use cases

#### Success Metrics

**Target Adoption**:
- 30%+ of users enable privacy mode at least once
- 10%+ of users use privacy mode regularly (weekly)
- 60%+ awareness of feature (through tooltips/help)

**User Satisfaction**:
- Positive feedback on feature discoverability
- Low confusion reports (toggle should be intuitive)
- Feature request satisfaction for screen privacy

#### Dependencies

**Required Features**:
- None (standalone feature)

**Enhanced By**:
- Multi-currency display (hide both BTC and fiat amounts)
- Transaction labels (consistent privacy across all financial data)

**Design Requirements**:
- UI/UX Designer: Design privacy indicator, hidden state, toggle interactions
- Frontend Developer: Implement global privacy state and toggle logic
- QA Engineer: Test all toggle scenarios, edge cases, accessibility

#### Open Questions for Implementation

1. **Scope**: Should privacy mode hide transaction history entirely or just amounts?
   - **Recommendation**: Hide amounts only, allow viewing transaction structure

2. **Default State**: Should privacy mode remember state per session or persist permanently?
   - **Recommendation**: Persist permanently, users set and forget

3. **Quick Toggle Scope**: What counts as "clickable balance"?
   - **Recommendation**: All numeric amounts (balances, transaction amounts, fees)

4. **Indicator Placement**: Where to show global privacy mode indicator?
   - **Recommendation**: Small icon in sidebar footer or settings area

#### Related Features

**Complementary Privacy Features**:
- Privacy Enhancement (v0.11.0): Transaction privacy
- This Feature: Display privacy
- Together: Comprehensive privacy approach

**Future Enhancements**:
- Screenshot blocking (OS-level)
- Privacy timeout (auto-hide after inactivity)
- Privacy shortcuts (keyboard shortcut to toggle)

---

### 14. Consistent Password Validation UI (Future Enhancement)

**Status**: ⏳ Concept - Future Release (TBD)
**Priority**: P1 (Should-have)

#### Feature Overview

Standardize password validation UI/UX across all password creation flows to match the excellent implementation in the Encrypted Backup feature. Currently, wallet creation lacks the visual feedback and guidance that helps users create strong passwords.

**Key Value Propositions**:
1. **Security**: Stronger passwords through better guidance
2. **Consistency**: Same UX everywhere users create passwords
3. **User Confidence**: Visual feedback reduces password creation anxiety
4. **Error Prevention**: Real-time validation prevents weak passwords

#### Current State Analysis

**Encrypted Backup Feature (Excellent Implementation)**:
- Clear text describing password requirements
- Strength bar/progress indicator (weak/medium/strong)
- Visual feedback on password quality
- Real-time validation as user types
- Color-coded strength levels

**Wallet Creation (Needs Improvement)**:
- Basic password field
- Minimum 8 characters validation
- No visual strength indicator
- Limited real-time feedback
- Users uncertain about password quality

**Gap**: Primary wallet creation flow lacks the visual guidance and feedback that the backup feature provides, creating inconsistent UX.

#### Proposed Solution

**Apply Encrypted Backup Pattern Everywhere**:

1. **Wallet Creation** (Primary Need):
   - Add password strength bar
   - Show requirements text
   - Real-time strength calculation
   - Color-coded feedback (red/yellow/green)
   - Prevent weak passwords (enforce medium+)

2. **Other Password Flows**:
   - Import wallet from private key (when setting wallet password)
   - Settings: Change password (future feature)
   - Any new password creation flows

**Standard Password Validation Component**:
```typescript
<PasswordInput
  value={password}
  onChange={setPassword}
  showStrengthBar={true}
  showRequirements={true}
  minStrength="medium"
  onValidationChange={setIsValid}
/>
```

#### Technical Considerations

**Component Architecture**:
- Create reusable `<PasswordValidation>` component
- Extract from Encrypted Backup implementation
- Props: value, minStrength, showRequirements, showBar
- Emit validation events for parent forms

**Password Strength Calculation**:
- Length (8+ chars required, 12+ recommended)
- Character variety (uppercase, lowercase, numbers, symbols)
- Common passwords check (avoid "password123", etc.)
- Sequential patterns detection (avoid "abcd1234")
- Strength score: 0-100 mapped to weak/medium/strong

**Validation Rules** (Consistent Across All Flows):
```typescript
interface PasswordRequirements {
  minLength: 8;
  recommendedLength: 12;
  requireUppercase: false; // Recommended but not required
  requireLowercase: false;
  requireNumbers: false;
  requireSymbols: false;
  minStrength: 'medium'; // Enforced minimum
}
```

**Visual Design Consistency**:
- Same strength bar colors (red/yellow/green)
- Same requirements text styling
- Same layout and spacing
- Same animation for strength changes

#### Implementation Plan

**Phase 1: Extract Component**:
1. Identify password validation code in Encrypted Backup
2. Extract into reusable component
3. Parameterize for different use cases
4. Add comprehensive prop types

**Phase 2: Apply to Wallet Creation**:
1. Replace basic password field in wallet creation
2. Apply same styling and layout
3. Update validation logic to match
4. Test thoroughly

**Phase 3: Apply to Other Flows**:
1. Audit all password creation flows
2. Replace with standardized component
3. Ensure consistent behavior everywhere

**Phase 4: Documentation**:
1. Document password requirements in user guide
2. Add developer documentation for component
3. Update security documentation

#### Design Specifications

**Visual Layout**:
```
Password: [___________________] 👁️
[====                    ] Weak

Requirements:
✓ At least 8 characters
✓ 12+ characters recommended
○ Mix of uppercase and lowercase
○ Include numbers or symbols

Current strength: Weak (not recommended)
```

**Strength Levels**:
- **Weak** (0-33): Red bar, blocked on submit
- **Medium** (34-66): Yellow bar, allowed but warning
- **Strong** (67-100): Green bar, encouraged

**Real-Time Feedback**:
- Update strength bar as user types
- Check mark requirements dynamically
- Show helpful messages based on strength
- Animate color changes smoothly

#### Success Metrics

**Target Quality**:
- 90%+ of new passwords are "medium" or "strong"
- <5% of users attempt weak passwords
- Reduced support requests about password requirements

**User Satisfaction**:
- Positive feedback on password creation experience
- Users feel confident about password strength
- No confusion about requirements

**Security Improvement**:
- Average password entropy increases by 30%+
- Fewer common/weak passwords in use
- Better long-term security posture

#### Dependencies

**Required Features**:
- None (can implement immediately)

**Enhanced By**:
- Password strength library (zxcvbn or similar)
- Common password database
- Real-time breach checking (future, optional)

**Development Requirements**:
- UI/UX Designer: Review and approve component design
- Frontend Developer: Extract and implement component
- Security Expert: Review password strength criteria
- QA Engineer: Test across all password flows

#### Open Questions for Implementation

1. **Minimum Strength Enforcement**: Should we block "weak" passwords or just warn?
   - **Recommendation**: Block weak, warn on medium, encourage strong

2. **Password Strength Library**: Use existing library (zxcvbn) or custom implementation?
   - **Recommendation**: Use zxcvbn (battle-tested, comprehensive)

3. **Requirements Display**: Always show or only on focus/error?
   - **Recommendation**: Always show during password creation for guidance

4. **Password Meter Sensitivity**: How strict should strength calculation be?
   - **Recommendation**: Follow NIST guidelines, favor user-friendliness

#### Related Documentation

**Security Considerations**:
- Consistent validation prevents weak passwords
- Same security standards across all entry points
- User education through visual feedback
- Prevents password-related security vulnerabilities

**UX Considerations**:
- Consistency reduces cognitive load
- Visual feedback builds user confidence
- Real-time validation prevents frustration
- Clear requirements reduce support burden

**Code Reusability**:
- Single source of truth for password validation
- Easier to update requirements globally
- Reduced code duplication and bugs
- Consistent behavior across features

---

## Future UI/UX Enhancement Ideas

This section captures potential UI/UX improvements for future consideration. These are not scheduled for implementation but represent valuable enhancement opportunities that have been identified through user feedback, design reviews, or development insights.

### Enhancement Idea 1: Larger Bitcoin Icon on Dashboard

**Category**: Visual Design Enhancement
**Status**: 📝 Documented - Not Scheduled
**Date Added**: October 30, 2025

**Description**:
Increase the size of the Bitcoin icon displayed above "Total Balance" on the main dashboard to improve visual branding and hierarchy.

**Rationale**:
- Enhances visual impact and brand recognition
- Creates a stronger visual anchor for the balance display
- Improves the dashboard's visual hierarchy
- Makes the interface feel more polished and professional
- Better utilizes available space in the tab-based layout

**Proposed Changes**:
- **Current Size**: Standard icon size (needs measurement)
- **Target Size**: At least 3x larger than current size
- **Location**: Above "Total Balance" text on Dashboard tab
- **Style**: Maintain Bitcoin Orange (#F7931A) brand color
- **Spacing**: Adjust surrounding margins to accommodate larger icon

**User Benefits**:
- More visually appealing dashboard
- Stronger brand identity
- Better focus on primary information (balance)
- More professional appearance

**Technical Considerations**:
- Icon asset needs to be available in larger resolution
- Ensure icon scales properly on different screen sizes
- Verify spacing doesn't disrupt other dashboard elements
- Consider dark mode appearance

**Design Considerations**:
- Maintain visual balance with other dashboard elements
- Don't overwhelm the interface with too large an icon
- Ensure icon doesn't push important content below the fold
- Consider animation potential (subtle glow, rotation on load)

**Priority**: P2 (Nice-to-have)
**Effort Estimate**: Low (2-4 hours)
**Dependencies**: None

**Related Components**:
- `src/popup/components/Dashboard.tsx` - Main dashboard component
- Design system icon sizing tokens

**Owner**: UI/UX Designer + Frontend Developer

**Next Steps** (when scheduled):
1. UI/UX Designer: Create mockup with various icon sizes (2x, 3x, 4x)
2. UI/UX Designer: Review with team to select optimal size
3. Frontend Developer: Implement size change and adjust spacing
4. QA Engineer: Verify appearance across different states
5. Product Manager: Approve final design before release

**Status**: Awaiting prioritization in future roadmap planning

---

### Enhancement Idea 2: Address List with Pagination and Creation Order

**Category**: Information Architecture / Interaction Pattern / Usability
**Status**: ⏳ PRD Complete - Awaiting Prioritization
**Date Added**: October 30, 2025
**Priority**: P1 (Should-Have)

**Description**:
Enhance the address list feature with pagination controls and reverse chronological sort order (newest addresses first). Adds visual indicators for the most recent address and configurable items-per-page display, mirroring the UX patterns from the transaction list enhancement.

**Key Features**:
1. **Reverse Chronological Sort**: Addresses displayed newest-first (most recently created at top)
2. **Visual Indicator**: Clear marker/badge on the most recent address ("Most Recent" or "Newest")
3. **Pagination System**: Configurable items per page (10, 35, 50, 100, 500) with full navigation controls
4. **Consistent UX**: Same pagination pattern as transaction list for familiarity
5. **Address Type Handling**: Addresses from all types (Legacy, SegWit, Native SegWit) displayed in creation order

**Rationale**:
- **User Need**: Most recent address is most important (users typically generate and use latest address)
- **Consistency**: Mirrors transaction list sort order (newest-first) for familiar UX
- **Scalability**: Addresses can accumulate (especially for power users with many transactions), pagination prevents UI clutter
- **Power User Support**: Users with 50+ addresses benefit from pagination and navigation controls
- **Visual Clarity**: Newest address indicator helps users quickly identify which address to use

**User Benefits**:
- **Quick Access**: Most recent address immediately visible at top of list
- **Consistent Experience**: Same sort order and pagination as transaction list (cognitive consistency)
- **Clean UI**: Pagination prevents overwhelming address lists for active users
- **Easy Navigation**: Jump between pages, configure density preference
- **Clear Indicators**: Know which address is newest without checking timestamps

**Proposed Implementation**:

**1. Sort Order**:
```
Address List (sorted by creation order, newest first):

[MOST RECENT] tb1qxyz...abc  Address #15  (Native SegWit)  Balance: 0.00123 BTC
              tb1qdef...ghi  Address #14  (Native SegWit)  Balance: 0.00000 BTC
              tb1qabc...xyz  Address #13  (Native SegWit)  Balance: 0.00456 BTC
              ...
              tb1q123...456  Address #1   (Native SegWit)  Balance: 0.00000 BTC
```

**2. Visual Indicator for Most Recent**:
```
Options for visual treatment:
- Badge: [MOST RECENT] or [NEWEST] label
- Icon: ⭐ or 🆕 emoji/icon
- Color: Subtle background highlight (light blue/green)
- Combination: Badge + subtle highlight
```

**3. Pagination Controls** (same as transaction list):
```
Showing 1-10 of 47 addresses
Items per page: [10 ▼]  [◀ Previous]  Page 1 of 5  [Next ▶]
Jump to page: [___]
```

**Technical Considerations**:

**Sort Logic**:
- Use BIP44 derivation path index as creation order indicator
- External addresses: `m/44'/1'/account'/0/index` (index = creation order)
- Internal addresses: `m/44'/1'/account'/1/index` (typically hidden, change addresses)
- Sort by index descending (highest index = newest = top of list)

**Address Type Handling**:
- **Question**: Should addresses be grouped by type or intermixed by creation order?
- **Recommendation**: Intermix by creation order (all types together)
- **Rationale**: Users think chronologically, not by address type
- **Future**: Add filter by address type if users request it

**Data Source**:
- Account addresses already tracked in account metadata
- Each address has derivation index (creation order)
- Optional: Add creation timestamp to address metadata (for future features)

**Frontend Architecture**:
- Reuse pagination component from transaction list
- Sort addresses by index descending before pagination
- Client-side pagination (fast, no API calls)
- Memoize sorted/paginated results

**Performance**:
- Typical users: 5-20 addresses (no performance concern)
- Power users: 50-100 addresses (pagination helps)
- Edge case: 200+ addresses (pagination essential)

**Accessibility**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation for pagination controls
- Screen reader: Announce "Most Recent Address"
- Sufficient color contrast for visual indicators

**Design Considerations**:

**Most Recent Indicator**:
- Should be prominent but not overwhelming
- Consider: Badge text ("Most Recent") + subtle icon
- Color: Use accent color from design system
- Placement: Left of address or inline with address label

**Empty States**:
- No addresses yet: "No addresses generated. Receive Bitcoin to create your first address."
- Single address: No pagination needed, still show "Most Recent" badge

**Pagination State**:
- Persist items-per-page preference during session
- Reset to page 1 on account switch
- Default to page 1 (newest addresses) on load

**Mobile/Responsive**:
- Pagination controls stack vertically on narrow screens
- Address list remains scrollable
- Most Recent badge scales appropriately

**Priority**: P1 (Should-Have)
**Effort Estimate**: Low-Medium (24-32 hours total, ~1.5 weeks)

**Breakdown**:
- Frontend Developer: 16 hours (sort logic, pagination, visual indicator)
- UI/UX Designer: 4 hours (visual indicator design, pagination layout)
- QA Engineer: 8 hours (test sort order, pagination, edge cases)
- Product Manager: 4 hours (specification, review, approval)

**Dependencies**:
- ✅ Address Generation (v0.4.0) - Already implemented
- ✅ Account Management (v0.4.0) - Already implemented
- 🔄 Transaction List Enhancement (v0.12.0) - Shares pagination component (can reuse)
- No blockers - Ready for implementation

**Success Metrics**:

**Adoption** (3 months post-release):
- 80% of users with 20+ addresses use pagination at least once
- 90% awareness of newest address indicator (via user testing)
- 70% of users report finding newest address "very easy"

**Usability**:
- 50% reduction in time to identify newest address (vs. unsorted list)
- <2% user confusion (support tickets about address order)
- 95% of users correctly identify "Most Recent" badge meaning

**Satisfaction**:
- 4.0/5.0 average feature satisfaction rating
- Positive feedback on consistency with transaction list
- Reduced feature requests for address list improvements

**Implementation Plan**:

**Phase 1: Sort Order (3 days)** - 8 hours
- Implement reverse chronological sort (index descending)
- Test with multiple address types (Legacy, SegWit, Native SegWit)
- Verify sort order persists across account switches
- Handle edge cases (single address, no addresses)

**Phase 2: Most Recent Indicator (2 days)** - 8 hours
- Design visual indicator (badge/icon/color)
- Implement indicator on first address in sorted list
- Add accessibility labels
- Test visibility and clarity

**Phase 3: Pagination (4 days)** - 12 hours
- Reuse pagination component from transaction list
- Integrate with sorted address list
- Items per page: 10, 35, 50, 100, 500
- Navigation controls (prev/next, page picker)
- "Showing X-Y of Z addresses" counter

**Phase 4: Polish & Testing (2 days)** - 4 hours
- Cross-browser testing
- Accessibility audit
- Edge case testing (boundary conditions)
- Documentation updates

**Total**: 1.5 weeks with buffer

**Release Strategy**: Ship with v0.12.0 (same release as Transaction List Enhancement)
- Consistent UX across both list features
- User education: "Lists now sorted newest-first"
- Single round of user testing for both features

**Related Components**:
- `/home/michael/code_projects/bitcoin_wallet/src/popup/components/AddressList.tsx` - Address list component (likely path)
- `/home/michael/code_projects/bitcoin_wallet/src/popup/components/Pagination.tsx` - Shared pagination component (from transaction list)
- `/home/michael/code_projects/bitcoin_wallet/src/popup/components/Dashboard.tsx` - Dashboard layout

**Owner**: Frontend Developer (primary), UI/UX Designer (visual indicator)

**Next Steps** (when scheduled):
1. Product Manager: Prioritize in v0.12.0 roadmap (ship with Transaction List Enhancement)
2. UI/UX Designer: Design "Most Recent" indicator (badge/icon/color options)
3. Frontend Developer: Implement sort order and pagination integration
4. QA Engineer: Test sort order correctness, pagination edge cases, accessibility
5. Product Manager: Approve visual design and coordinate release with Transaction List Enhancement

**Status**: ⏳ PRD Complete - Awaiting prioritization in roadmap planning

**Open Questions for Implementation**:

1. **Address Type Grouping**: Should addresses be grouped by type or intermixed by creation order?
   - **Recommendation**: Intermix by creation order (all types together, sorted by index)
   - **Rationale**: Users think chronologically, not by address type

2. **Internal (Change) Addresses**: Should internal/change addresses be shown or hidden?
   - **Recommendation**: Hidden by default, optional "Show Change Addresses" toggle
   - **Rationale**: Most users don't need to see change addresses (advanced feature)

3. **Visual Indicator Design**: Badge, icon, color, or combination?
   - **Recommendation**: Badge text ("Most Recent") + subtle background highlight
   - **Rationale**: Clear, accessible, doesn't rely solely on color

4. **Default Items Per Page**: What's the optimal default?
   - **Recommendation**: 10 addresses per page (same as transaction list default)
   - **Rationale**: Consistency, addresses are visually similar to transactions

5. **Creation Timestamp**: Should we add creation timestamp metadata to addresses?
   - **Recommendation**: Yes, for future features (address analytics, filtering)
   - **Rationale**: Minimal cost, enables future enhancements

**Related Features**:

**Complementary Features**:
- Transaction List Enhancement (v0.12.0): Shares pagination UX patterns
- Address Generation (v0.4.0): Existing feature being enhanced
- Auto-Generate Fresh Address Prompts (v0.11.0): Privacy feature that generates new addresses

**Future Enhancements**:
- Filter by address type (Legacy/SegWit/Native SegWit)
- Search by address prefix
- Address labels/notes (custom naming)
- Export address list to CSV
- Address usage statistics (received count, total amount)

---

### Enhancement Idea 3: Transaction List with Pagination and Filtering

**Category**: Information Architecture / Interaction Pattern / Performance
**Status**: ⏳ PRD Complete - Awaiting Prioritization
**Date Added**: October 30, 2025
**Priority**: P1 (Should-Have)

**Description**:
Comprehensive enhancement to the transaction list feature, adding pagination, advanced filtering/search capabilities, and improved layout. Enables users to efficiently navigate and analyze large transaction histories (500+ transactions).

**Key Features**:
1. **Pagination System**: Configurable items per page (10, 35, 50, 100, 500) with full navigation controls
2. **Search by Sender Address**: Filter transactions by sender Bitcoin address (exact match)
3. **Filter by Amount Range**: Dual-range slider to filter transactions by BTC amount (greater than / less than)
4. **Search by Transaction Hash**: Find specific transaction by txid (full or partial match)
5. **Combined Filters**: Apply multiple filters simultaneously (AND logic)
6. **Reorganized Layout**: Move transaction list above address list (transactions as primary focus)
7. **Improved Sort**: Default to newest-first (reverse chronological order)

**Rationale**:
- **Usability**: Current transaction list doesn't scale beyond 50-100 transactions (scrolling becomes unwieldy)
- **Power User Need**: Essential for active users who need transaction analysis and lookup
- **Performance**: Current implementation causes rendering lag with 500+ transactions
- **Competitive Parity**: Standard feature in mature wallets (MetaMask, Ledger Live, Exodus)
- **Business Use Case**: Required for professional/business wallet usage
- **Foundation**: Enables future features (transaction export, spending reports, analytics)

**User Benefits**:
- **Quick Navigation**: Find specific transactions without endless scrolling
- **Transaction Analysis**: Filter by criteria to analyze spending patterns
- **Performance**: Fast rendering even with 500+ transaction histories
- **Better UX**: Transactions as primary focus (moved above address management)
- **Professional Feel**: Meets expectations for mature wallet applications

**Proposed Implementation**:

**1. Pagination Controls**:
```
Showing 1-10 of 147 transactions
Items per page: [10 ▼]  [◀ Previous]  Page 1 of 15  [Next ▶]
Jump to page: [___]
```

**2. Filter Panel**:
```
🔍 Search & Filter

Sender Address: [_______________________________] [Clear]
Amount Range:   [0.0] BTC to [1.0] BTC
                [━━━━━━━━|━━━━━━━━━━━━━━━━] Slider
Transaction Hash: [_______________________________] [Clear]

Active Filters: [Sender: tb1q...abc] [X]  [Amount: 0.1-1.0] [X]
[Reset All Filters]
```

**3. Layout Hierarchy**:
```
1. Total Balance (top)
2. Transaction History (primary focus - with filters)
3. Addresses (secondary - below transactions)
```

**Technical Considerations**:

**Frontend Architecture**:
- State management for pagination and filters
- Client-side filtering (fast, no API latency)
- Debounced filter inputs (300ms)
- Memoization for performance
- React.memo() and useMemo() hooks

**Performance Optimizations**:
- Only render current page (10-500 items max)
- Virtualization (future enhancement for 5000+ items)
- Indexed lookups (hash map for O(1) search)
- Lazy loading for off-screen pages

**Data Fetching**:
- MVP: Fetch all transactions on load (current approach)
- Future: Server-side pagination if history exceeds 1000+ transactions

**Accessibility**:
- WCAG 2.1 Level AA compliance
- Keyboard navigation (Tab, Enter, Escape, arrows)
- Screen reader support (ARIA labels, live regions)
- Sufficient color contrast (4.5:1 minimum)

**Security**:
- Input validation (address format, amount range, hash format)
- XSS prevention (React escaping by default)
- Filter state session-only (not persisted for privacy)
- No filter history or autocomplete

**Design Considerations**:

**Filter Panel UX**:
- Collapsible panel (default: collapsed for clean UI)
- Expand on first filter application (automatic)
- Active filter pills with individual removal
- "Reset All" button when any filter active
- Inline validation with helpful error messages

**Pagination UX**:
- Disabled state for Previous/Next at boundaries
- Clear indication of current page (bold text)
- "Showing X-Y of Z" counter for context
- Items per page persists during session
- Reset to page 1 when filters change

**Empty States**:
- No transactions: "No transactions yet. Receive Bitcoin to get started."
- No filter results: "No transactions found. Try adjusting your filters."
- Loading: Skeleton animation for smooth UX

**Priority**: P1 (Should-Have)
**Effort Estimate**: Medium-High (121 hours total, ~6 weeks with buffer)

**Breakdown**:
- Frontend Developer: 70 hours
- UI/UX Designer: 8 hours
- QA Engineer: 30 hours
- Backend Developer: 3 hours (consultation)
- Product Manager: 10 hours

**Dependencies**:
- ✅ Transaction History (v0.4.0) - Already implemented
- ✅ Account Management (v0.4.0) - Already implemented
- ✅ Blockstream API (v0.4.0) - Already implemented
- No blockers - Ready for implementation

**Success Metrics**:

**Adoption** (3 months post-release):
- 60% of users with 50+ transactions use pagination
- 40% of users with 100+ transactions use at least one filter
- 15% of power users use combined filters

**Usability**:
- 30% reduction in time to locate specific transaction
- 85% of filter applications return results (not empty)
- <5% user confusion (support tickets about filters)

**Performance**:
- <1 second initial load (first 10 transactions)
- <500ms page navigation
- <1 second filter application (500+ transactions)

**Satisfaction**:
- 4.2/5.0 average feature satisfaction rating
- +10 points NPS improvement for users with 100+ transactions
- 70% reduction in "add filtering" feature requests

**Implementation Plan**:

**Phase 1: Pagination (2 weeks)** - 37 hours
- Pagination state management
- Pagination controls UI
- Items per page selector
- Loading and empty states
- Performance optimization

**Phase 2: Layout Reorganization (1 week)** - 7 hours
- Move transaction list above addresses
- Responsive design adjustments
- Visual hierarchy improvements

**Phase 3: Search/Filter (2 weeks)** - 54 hours
- Filter panel UI design
- Sender address filter
- Amount range filter (slider + inputs)
- Transaction hash search
- Combined filter logic
- Active filter pills and reset

**Phase 4: Polish & Testing (1 week)** - 23 hours
- Accessibility audit
- Cross-browser testing
- Performance profiling
- Bug fixes and documentation

**Total**: 6 weeks with 20% risk buffer

**Release Strategy**: Incremental rollout
1. **v0.12.0**: Release pagination only (lower risk, quick win)
2. **v0.12.1 or v0.13.0**: Release search/filter functionality
3. Gather feedback and iterate

**Related Components**:
- `/home/michael/code_projects/bitcoin_wallet/src/popup/components/TransactionList.tsx` - Main list component
- `/home/michael/code_projects/bitcoin_wallet/src/popup/components/Dashboard.tsx` - Dashboard layout

**Owner**: Frontend Developer (primary), UI/UX Designer (design)

**Next Steps** (when scheduled):
1. Product Manager: Prioritize in v0.12.0 roadmap (compare with other features)
2. UI/UX Designer: Create mockups for filter panel and pagination controls
3. Frontend Developer: Review technical feasibility and refine estimates
4. Security Expert: Review input validation and data handling (consultation)
5. QA Engineer: Create comprehensive test plan for all filter combinations
6. Product Manager: Approve design and begin Phase 1 implementation

**Status**: ⏳ PRD Complete - Awaiting prioritization in roadmap planning

**Complete PRD**: See [TRANSACTION_LIST_ENHANCEMENT_PRD.md](../plans/TRANSACTION_LIST_ENHANCEMENT_PRD.md) for:
- Detailed user stories with acceptance criteria
- Complete UI/UX specifications with mockups
- Technical architecture and performance optimization strategies
- Edge case handling and validation rules
- Success metrics and KPIs
- Implementation timeline with task breakdown
- Open questions and decision points

---

### How to Add New Enhancement Ideas

When documenting new UI/UX enhancement ideas, include:

1. **Category**: Visual Design / Interaction Pattern / Information Architecture / Accessibility
2. **Status**: 📝 Documented / 🔍 Under Review / ✅ Approved / 🚧 In Progress / ❌ Rejected
3. **Date Added**: When the idea was first documented
4. **Description**: Clear explanation of the proposed enhancement
5. **Rationale**: Why this enhancement would be valuable
6. **Proposed Changes**: Specific changes to implement
7. **User Benefits**: How users benefit from this enhancement
8. **Technical Considerations**: Implementation challenges or requirements
9. **Design Considerations**: Design trade-offs and decisions needed
10. **Priority**: P0/P1/P2 classification (when prioritized)
11. **Effort Estimate**: Low/Medium/High or hour estimate
12. **Dependencies**: Prerequisites or related work
13. **Related Components**: Code files affected
14. **Owner**: Responsible expert(s)
15. **Next Steps**: Action items when approved for implementation
16. **Status**: Current state in the enhancement lifecycle

---

## Feature Status Matrix

### MVP Features (v0.4.0)

| Feature | Priority | Status | Version |
|---------|----------|--------|---------|
| Create Wallet | P0 | ✅ Complete | v0.4.0 |
| Import Wallet (Seed) | P0 | ✅ Complete | v0.4.0 |
| Multi-Account | P0 | ✅ Complete | v0.4.0 |
| Rename Accounts | P1 | ✅ Complete | v0.4.0 |
| Address Generation | P0 | ✅ Complete | v0.4.0 |
| Send Transaction | P0 | ✅ Complete | v0.4.0 |
| Receive Bitcoin | P0 | ✅ Complete | v0.4.0 |
| Transaction History | P0 | ✅ Complete | v0.4.0 |
| Password Protection | P0 | ✅ Complete | v0.4.0 |
| Auto-Lock | P1 | ✅ Complete | v0.4.0 |
| Encrypted Storage | P0 | ✅ Complete | v0.4.0 |

### Post-MVP Features

| Feature | Priority | Status | Version |
|---------|----------|--------|---------|
| Multisig Wallets | P1 | ✅ Complete | v0.8.0 |
| PSBT Support | P1 | ✅ Complete | v0.8.0 |
| Tab Architecture | P0 | ✅ Complete | v0.9.0 |
| Contacts V2 | P1 | ✅ Complete | v0.9.0 |
| Private Key Export | P1 | ✅ Complete | v0.10.0 |
| Private Key Import | P1 | ✅ Complete | v0.10.0 |
| Dark Mode | P2 | ✅ Complete | v0.9.0 |
| Transaction Details | P1 | 🔄 Partial | v0.9.0 |

### Planned Features (v0.11.0+)

| Feature | Priority | Status | Target |
|---------|----------|--------|--------|
| **Import Wallet from Private Key** | **P0** | **⏳ PRD Complete** | **v0.11.0** |
| Unique Change Addresses | P0 | ⏳ Planned | v0.11.0 |
| Randomized UTXO Selection | P1 | ⏳ Planned | v0.11.0 |
| Contact Privacy Warnings | P1 | ⏳ Planned | v0.11.0 |
| Auto-Generate Prompts | P1 | ⏳ Planned | v0.11.0 |
| Privacy Mode Toggles | P2 | ⏳ Planned | v0.11.0 |
| Custom Fee Input | P1 | ⏳ Planned | v0.12.0 |
| **Transaction List Enhancement** | **P1** | **⏳ PRD Complete** | **v0.12.0** |
| **Address List Enhancement** | **P1** | **⏳ PRD Complete** | **v0.12.0** |
| Privacy Mode Toggle (Balance Concealment) | P2 | ⏳ Concept | TBD |
| Consistent Password Validation UI | P1 | ⏳ Concept | TBD |
| Hardware Wallet Support | P1 | ⏳ Future | TBD |
| Mainnet Support | P0 | ⏳ Future | v1.0.0 |

---

## Related Documentation

### Product Documents
- [**roadmap.md**](./roadmap.md) - Release planning and version history
- [**requirements.md**](./requirements.md) - User stories and acceptance criteria
- [**decisions.md**](./decisions.md) - Product ADRs and decision log

### Planning Documents
- [**PRIVACY_ENHANCEMENT_PRD.md**](../plans/PRIVACY_ENHANCEMENT_PRD.md) - Privacy features (v0.11.0)
- [**TAB_BASED_MULTISIG_WIZARD_PRD.md**](../plans/TAB_BASED_MULTISIG_WIZARD_PRD.md) - Multisig wizard (v0.9.0)
- [**PRIVATE_KEY_EXPORT_IMPORT_PRD.md**](../plans/PRIVATE_KEY_EXPORT_IMPORT_PRD.md) - Key management (v0.10.0)
- [**TRANSACTION_LIST_ENHANCEMENT_PRD.md**](../plans/TRANSACTION_LIST_ENHANCEMENT_PRD.md) - Transaction pagination and filtering (v0.12.0)

### Technical Documents
- [**ARCHITECTURE.md**](../plans/ARCHITECTURE.md) - System architecture
- [**TESTING.md**](../plans/TESTING.md) - Testing requirements

### Expert Notes
- [**blockchain-expert-notes.md**](../blockchain-expert-notes.md) - Bitcoin implementation
- [**security-expert-notes.md**](../security-expert-notes.md) - Security implementation
- [**frontend-developer-notes.md**](../frontend-developer-notes.md) - UI implementation
- [**backend-developer-notes.md**](../backend-developer-notes.md) - Service worker implementation

---

**Document Status**: Complete and up-to-date
**Next Review**: Before each release cycle
**Maintainer**: Product Manager
