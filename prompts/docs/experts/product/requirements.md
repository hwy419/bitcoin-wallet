# Product Requirements & User Stories

**Last Updated**: October 22, 2025
**Owner**: Product Manager
**Purpose**: User stories, acceptance criteria, requirements by feature

---

## Quick Navigation

- [Overview](#overview)
- [MVP User Stories](#mvp-user-stories)
- [Post-MVP User Stories](#post-mvp-user-stories)
- [Privacy Enhancement Requirements](#privacy-enhancement-requirements-v0110)
- [Requirements by Feature Area](#requirements-by-feature-area)
- [Related Documentation](#related-documentation)

---

## Overview

This document contains all user stories and acceptance criteria for the Bitcoin Wallet Chrome Extension. User stories follow the standard format:

```
As a [user type]
I want to [action]
So that [benefit]

Acceptance Criteria:
- [ ] Specific, testable criterion
- [ ] Another testable criterion
```

All acceptance criteria must be met before a feature is considered complete and ready for release.

---

## MVP User Stories

### Epic: First-Time Wallet Setup

#### Story 1.1: Create Wallet as New User

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a new user
I want to create a Bitcoin wallet
So that I can store and manage my Bitcoin

Acceptance Criteria:
✅ I can click "Create New Wallet" from welcome screen
✅ I can choose between Legacy, SegWit, or Native SegWit address types
✅ I can create a password that meets security requirements
✅ I see a 12-word seed phrase displayed clearly
✅ I receive clear warnings about seed phrase security
✅ I must confirm my seed phrase by selecting words in order
✅ My wallet is created and I see my first account
✅ My first account shows a balance of 0 BTC
✅ I can immediately receive Bitcoin to my new wallet
```

**Related**:
- Address type selection decision (see [decisions.md](./decisions.md#decision-1-address-type-selection))
- 12-word seed phrase decision (see [decisions.md](./decisions.md#decision-2-seed-phrase-length))

---

#### Story 1.2: Import Existing Wallet

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a user with an existing wallet
I want to import my wallet using my seed phrase
So that I can access my Bitcoin in the extension

Acceptance Criteria:
✅ I can click "Import Wallet" from welcome screen
✅ I can enter my 12 or 24-word seed phrase
✅ I receive clear error messages if my seed phrase is invalid
✅ I can choose my preferred address type
✅ I can create a new password for this extension
✅ The extension discovers my existing accounts with balances
✅ I see all my accounts and balances after import
✅ My transaction history is loaded from the blockchain
```

**Technical Requirements**:
- Support BIP39 12-word and 24-word mnemonics
- Validate seed phrase checksum
- Support optional BIP39 passphrase (advanced feature)
- Account discovery using gap limit of 20
- Load transaction history from Blockstream API

---

#### Story 1.3: Import Account from Private Key

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.10.0)

```
As a user with a single private key
I want to import that key as a new account
So that I can access Bitcoin from that specific address

Acceptance Criteria:
✅ I can import WIF-format private keys
✅ The extension detects the address type from the key format
✅ I receive clear error messages for invalid keys
✅ I can optionally protect the import with a password
✅ The account appears in my account list
✅ Balance and transaction history load correctly
✅ The imported account is clearly marked as "Imported"
```

**Related**: Private Key Import/Export PRD (see `prompts/docs/plans/PRIVATE_KEY_EXPORT_IMPORT_PRD.md`)

---

### Epic: Account Management

#### Story 2.1: Create Additional Accounts

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a wallet user
I want to create multiple accounts
So that I can separate my Bitcoin for different purposes

Acceptance Criteria:
✅ I can open an account dropdown similar to MetaMask
✅ I can click "Create Account" button
✅ A new account is created with name "Account N"
✅ The new account has its own unique addresses
✅ I can switch between accounts using the dropdown
✅ Each account displays its own balance independently
✅ All accounts are derived from my single seed phrase
```

**Technical Requirements**:
- Follow BIP44 derivation paths
- Support unlimited accounts (practical limit: 100)
- Increment account index automatically
- Derive addresses independently for each account
- Store account metadata (name, index, type)

---

#### Story 2.2: Rename Accounts

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.4.0)

```
As a wallet user
I want to give my accounts custom names
So that I can easily identify their purpose

Acceptance Criteria:
✅ I can click an edit icon next to the account name
✅ I can enter a custom name (up to 30 characters)
✅ The name is saved and persists across sessions
✅ I see my custom names in the account dropdown
✅ I can rename accounts at any time
✅ Special characters and emoji are supported
```

**Technical Requirements**:
- 30 character maximum length
- Support UTF-8 (including emoji)
- Validate name on input
- Persist to encrypted storage
- Update UI immediately on save

---

#### Story 2.3: Export Account Private Key

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.10.0)

```
As a wallet user
I want to export a specific account's private key
So that I can import it into another wallet or create a backup

Acceptance Criteria:
✅ I can access export function from account management panel
✅ I must re-enter my password to confirm
✅ I see clear security warnings before export
✅ The private key is displayed in WIF format
✅ I can copy the WIF key to clipboard
✅ I can optionally password-protect the exported key
✅ I can export as PDF with QR code for offline storage
```

**Related**: Private Key Export/Import PRD (see `prompts/docs/plans/PRIVATE_KEY_EXPORT_IMPORT_PRD.md`)

---

### Epic: Sending Bitcoin

#### Story 3.1: Send Bitcoin Transaction

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a wallet user
I want to send Bitcoin to another address
So that I can pay someone or transfer to another wallet

Acceptance Criteria:
✅ I can click "Send" from the dashboard
✅ I can enter a recipient Bitcoin address
✅ I can enter an amount in BTC
✅ I see validation errors for invalid addresses
✅ I cannot send more than my available balance
✅ I can choose between Slow, Medium, or Fast fee options
✅ I see the fee amount in sat/vB and total BTC
✅ I see a transaction preview before confirming
✅ I must re-enter my password to confirm
✅ I see a success message with transaction ID
✅ I can view my transaction in the block explorer
✅ My balance updates immediately to show pending transaction
```

**Technical Requirements**:
- Validate address format and network (testnet/mainnet)
- Detect address type compatibility
- Calculate accurate fees using UTXO selection
- Build and sign transaction with bitcoinjs-lib
- Broadcast via Blockstream API
- Update balance optimistically (pending tx)
- Link to Blockstream explorer

---

#### Story 3.2: Send Maximum Amount

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.4.0)

```
As a wallet user
I want to send all my Bitcoin in one transaction
So that I can empty my account or consolidate funds

Acceptance Criteria:
✅ I can click "Send Max" button on send form
✅ The amount field is populated with my full balance minus fees
✅ The fee is calculated based on my selected fee speed
✅ The transaction will empty my account (0 remaining)
✅ I can still change the fee speed and see updated amounts
✅ The transaction completes successfully with no remaining balance
```

**Technical Requirements**:
- Calculate max amount = total UTXOs - fees
- No change output (send all)
- Recalculate when fee speed changes
- Handle dust limits correctly

---

#### Story 3.3: Send to Contact

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.9.0)

```
As a wallet user
I want to select a recipient from my contacts
So that I don't have to manually enter addresses I use frequently

Acceptance Criteria:
✅ I can click "Select Contact" on send screen
✅ I see a list of my saved contacts
✅ I can click a contact to auto-fill their address
✅ I see contact name and label displayed
✅ I see privacy warnings if reusing addresses with this contact
✅ The send flow continues normally after selection
```

**Related**: Contacts V2 feature (v0.9.0)

---

### Epic: Receiving Bitcoin

#### Story 4.1: Receive Bitcoin

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a wallet user
I want to receive Bitcoin from others
So that I can accept payments or transfers

Acceptance Criteria:
✅ I can click "Receive" from the dashboard
✅ I see my current Bitcoin address displayed clearly
✅ I see a QR code of my address for easy scanning
✅ I can copy my address with one click
✅ I receive confirmation when address is copied
✅ I can generate a new address if desired
✅ I see guidance about address types and reuse
```

**Technical Requirements**:
- Display current receiving address (index 0 by default)
- Generate QR code using qrcode library
- Copy to clipboard with user feedback
- Generate next address in sequence
- Follow BIP44 gap limit (20 addresses)
- Show address type and index

---

#### Story 4.2: Auto-Generate Fresh Receive Address

**Priority**: P1 (High)
**Status**: ⏳ Planned (v0.11.0)

```
As a privacy-conscious wallet user
I want the wallet to prompt me to generate new addresses
So that I can maintain better privacy by avoiding address reuse

Acceptance Criteria:
[ ] I see a banner when my current address has been used
[ ] The banner explains the privacy benefits of new addresses
[ ] I can click "Generate New Address" from the banner
[ ] I can dismiss the banner if I choose to reuse
[ ] The wallet tracks which addresses have received funds
[ ] I see a visual indicator on addresses that have been used
```

**Related**: Privacy Enhancement PRD (see `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`)

---

### Epic: Transaction History

#### Story 5.1: View Transaction History

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a wallet user
I want to see all my past transactions
So that I can track my Bitcoin activity

Acceptance Criteria:
✅ I can view a list of all transactions for current account
✅ I can distinguish between sent and received transactions
✅ I see the amount, date, and confirmation status
✅ Pending transactions are clearly marked
✅ I see transaction fees for sent transactions
✅ I can click a transaction to see more details
✅ I can click to view transaction on block explorer
✅ The list updates automatically when new transactions occur
```

**Technical Requirements**:
- Fetch transaction history from Blockstream API
- Display sent/received with different styling
- Show confirmation count or "Pending"
- Include fee for sent transactions
- Auto-refresh every 30 seconds when unlocked
- Link to Blockstream explorer

---

#### Story 5.2: View Transaction Details

**Priority**: P1 (High)
**Status**: 🔄 Partially Implemented (v0.9.0)

```
As a wallet user
I want to view detailed information about a specific transaction
So that I can verify the transaction details or troubleshoot issues

Acceptance Criteria:
✅ I can click a transaction to expand details
✅ I see all inputs and outputs
✅ I see the transaction size and fee rate (sat/vB)
✅ I see the block height and timestamp
✅ I see the transaction ID with copy button
✅ I see the confirmations progress (0-6+)
[ ] I see which addresses are mine (change detection)
[ ] I can view the raw transaction data (advanced)
```

**Related**: Transaction detail pane component (v0.9.0)

---

### Epic: Security

#### Story 6.1: Secure Wallet with Password

**Priority**: P0 (Critical)
**Status**: ✅ Implemented (v0.4.0)

```
As a security-conscious user
I want my wallet protected by a strong password
So that others cannot access my Bitcoin

Acceptance Criteria:
✅ I must create a password when setting up my wallet
✅ The password must meet minimum security requirements (8+ chars)
✅ I see a password strength indicator while typing
✅ I cannot proceed with a weak password
✅ I must unlock my wallet with password after closing extension
✅ I see clear error messages for incorrect passwords
✅ There is no password recovery option (by design)
```

**Technical Requirements**:
- Minimum 8 characters
- Password strength validation (weak/medium/strong)
- PBKDF2 key derivation (100,000 iterations)
- AES-256-GCM encryption for wallet data
- No password recovery (user must have seed phrase backup)

---

#### Story 6.2: Auto-Lock Protection

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.4.0)

```
As a security-conscious user
I want my wallet to lock automatically
So that I'm protected if I forget to lock it manually

Acceptance Criteria:
✅ My wallet locks after 15 minutes of inactivity
✅ I can manually lock my wallet at any time
✅ I must enter my password to unlock after auto-lock
✅ All sensitive data is cleared from memory when locked
✅ I see the lock status clearly in the UI
```

**Technical Requirements**:
- 15-minute inactivity timeout
- Manual lock button in sidebar
- Clear decrypted keys from memory on lock
- Show unlock screen immediately
- Additional 5-minute timeout when tab hidden (v0.9.0)

**Related**: Auto-lock timeout decision (see [decisions.md](./decisions.md#decision-3-auto-lock-timeout))

---

## Post-MVP User Stories

### Epic: Multi-Signature Wallets

#### Story 7.1: Create Multi-Signature Account

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.8.0, improved v0.9.0)

```
As a user managing high-value Bitcoin
I want to create a multi-signature wallet account
So that I can require multiple signatures for enhanced security

Acceptance Criteria:
✅ I can select "Create Multisig Account" from the dashboard
✅ I can choose configuration: 2-of-2, 2-of-3, or 3-of-5
✅ I can choose address type: P2SH, P2WSH, or P2SH-P2WSH
✅ I can name the multisig account
✅ I can export my xpub for co-signers
✅ I can import co-signer xpubs (manually or via file)
✅ I see the multisig address generated from all keys
✅ I can save the multisig account configuration
✅ The account appears in my account list
✅ I can view the account balance and receive funds
```

**Related**:
- Tab-based multisig wizard (v0.9.0)
- See `prompts/docs/plans/TAB_BASED_MULTISIG_WIZARD_PRD.md`
- See `prompts/docs/plans/MULTISIG_UI_DESIGN_SPEC.md`

---

#### Story 7.2: Sign Multisig Transaction with PSBT

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.8.0)

```
As a multisig account holder
I want to sign transactions using PSBT format
So that I can coordinate with co-signers without backend infrastructure

Acceptance Criteria:
✅ I can create a transaction from my multisig account
✅ The wallet creates a PSBT (Partially Signed Bitcoin Transaction)
✅ I can sign the PSBT with my key
✅ I can export the signed PSBT (base64, hex, or QR chunks)
✅ I can import a PSBT from co-signers
✅ I can see how many signatures are present (e.g., "1 of 2")
✅ I can add my signature if not yet signed
✅ I can broadcast the transaction when enough signatures collected
```

**Technical Requirements**:
- BIP174 PSBT compliance
- Support base64 and hex encoding
- QR code chunking for large PSBTs
- Signature count validation
- Finalize PSBT when threshold reached
- Broadcast via Blockstream API

---

### Epic: Contacts Management

#### Story 8.1: Save Contact

**Priority**: P1 (High)
**Status**: ✅ Implemented (v0.9.0)

```
As a wallet user
I want to save frequently-used addresses as contacts
So that I don't have to remember or re-enter addresses

Acceptance Criteria:
✅ I can add a new contact with name and address
✅ I can optionally add a label/category
✅ I can optionally add notes about the contact
✅ The contact is saved to encrypted storage
✅ I see the contact in my contacts list
✅ I can select the contact when sending
```

**Related**: Contacts V2 implementation (v0.9.0)

---

#### Story 8.2: Contact Privacy Warnings

**Priority**: P1 (High)
**Status**: ⏳ Planned (v0.11.0)

```
As a privacy-conscious user
I want to be warned about address reuse with contacts
So that I can maintain my privacy and identity

Acceptance Criteria:
[ ] I see a privacy badge on contacts where I've reused addresses
[ ] The badge shows the reuse count (e.g., "Used 3 times")
[ ] I see a warning when sending to a contact I've used before
[ ] The warning explains the privacy risks
[ ] I can request a fresh address from the contact (xpub flow)
[ ] I can dismiss the warning if I choose to proceed
```

**Related**: Privacy Enhancement PRD (see `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`)

---

## Privacy Enhancement Requirements (v0.11.0)

### Epic: Privacy-by-Default

#### Story 9.1: Unique Change Addresses

**Priority**: P0 (Critical)
**Status**: ⏳ Planned (v0.11.0)

```
As a wallet user
I want every transaction to use a unique change address
So that my transaction history cannot be linked through change analysis

Acceptance Criteria:
[ ] Every transaction generates a fresh change address
[ ] Change addresses are never reused, even if transaction fails
[ ] Change addresses use the internal derivation path (m/.../1/index)
[ ] Old change detection logic is removed (no address reuse)
[ ] Transaction privacy is maintained across all address types
```

**Technical Requirements**:
- Generate new change address for every transaction attempt
- Increment change index even on broadcast failure
- Use BIP44 internal chain (m/44'/1'/account'/1/index)
- Store highest change index in account metadata
- Never reuse change addresses under any circumstance

**Privacy Impact**: CRITICAL - Eliminates change address reuse vulnerability

**Related**: Privacy Enhancement PRD Section 4.1 (P0 Critical)

---

#### Story 9.2: Randomized UTXO Selection

**Priority**: P1 (High)
**Status**: ⏳ Planned (v0.11.0)

```
As a wallet user
I want my UTXO selection to be randomized
So that my wallet cannot be fingerprinted by transaction patterns

Acceptance Criteria:
[ ] UTXO selection algorithm includes randomization
[ ] Selection is not purely deterministic (no fingerprinting)
[ ] Selection still minimizes fees (privacy-aware optimization)
[ ] Randomization is cryptographically secure (not pseudo-random)
[ ] Different transactions from same wallet use different patterns
```

**Technical Requirements**:
- Implement privacy-aware UTXO selection algorithm
- Use crypto.getRandomValues() for randomization
- Balance privacy vs. fee optimization
- Document algorithm in blockchain-expert-notes.md
- Test for non-deterministic behavior

**Privacy Impact**: HIGH - Prevents wallet fingerprinting

**Related**: Privacy Enhancement PRD Section 4.2 (P1 High)

---

#### Story 9.3: Privacy Mode Settings

**Priority**: P2 (Nice to Have)
**Status**: ⏳ Planned (v0.11.0)

```
As an advanced wallet user
I want to enable additional privacy protections
So that I can maximize my transaction privacy

Acceptance Criteria:
[ ] I can access Privacy Mode settings in Settings screen
[ ] I can toggle "Randomize Round Numbers" (prevents change detection)
[ ] I can toggle "API Timing Delays" (prevents network clustering)
[ ] I can toggle "Broadcast Delays" (prevents timing correlation)
[ ] Each toggle has a clear explanation of the privacy benefit
[ ] Settings persist across sessions
[ ] Settings apply to all future transactions
```

**Technical Requirements**:
- Round number randomization (+/- 1-5%)
- Random API delays (100-500ms)
- Random broadcast delays (0-60 seconds)
- Store settings in encrypted storage
- Apply settings in transaction builder

**Privacy Impact**: MEDIUM - Additional privacy layers for advanced users

**Related**: Privacy Enhancement PRD Section 4.3 (P2 Optional)

---

## Requirements by Feature Area

### Wallet Setup & Import

**MVP Requirements (v0.4.0)** - ✅ Complete
- Create new wallet from seed phrase
- Import wallet from 12 or 24-word seed phrase
- Password creation with strength validation
- Seed phrase confirmation
- Address type selection

**Post-MVP Enhancements**:
- ✅ Import single private key (v0.10.0)
- ⏳ BIP39 passphrase support (future)
- ⏳ Import from hardware wallet (future)

---

### Account Management

**MVP Requirements (v0.4.0)** - ✅ Complete
- Create multiple accounts
- Rename accounts
- Account switching
- BIP44 derivation paths
- Balance display per account

**Post-MVP Enhancements**:
- ✅ Export account private key (v0.10.0)
- ✅ Import account from private key (v0.10.0)
- ✅ Multisig account creation (v0.8.0)
- ✅ Account management UI improvements (v0.9.0)

---

### Transaction Operations

**MVP Requirements (v0.4.0)** - ✅ Complete
- Send Bitcoin to address
- Receive Bitcoin (address display + QR)
- Fee selection (slow/medium/fast)
- Transaction preview
- Password confirmation
- Send max functionality

**Post-MVP Enhancements**:
- ✅ Send to contacts (v0.9.0)
- ⏳ Custom fee input (sat/vB) - planned
- ⏳ RBF (Replace-By-Fee) - future
- ⏳ CPFP (Child-Pays-For-Parent) - future
- ⏳ Coin control / manual UTXO selection - future

---

### Privacy & Security

**MVP Requirements (v0.4.0)** - ✅ Complete
- AES-256-GCM encryption
- PBKDF2 key derivation
- Password protection
- Auto-lock (15 min inactivity)
- Manual lock button
- Seed phrase backup flow

**Post-MVP Enhancements**:
- ✅ Tab-based security controls (v0.9.0)
  - Single tab enforcement
  - Clickjacking prevention
  - Tab nabbing prevention
  - Auto-lock on hidden tab (5 min)
- ⏳ Privacy enhancements (v0.11.0)
  - Unique change addresses
  - Randomized UTXO selection
  - Privacy mode settings
  - Contact privacy warnings

---

### Multi-Signature

**Post-MVP Requirements (v0.8.0)** - ✅ Complete
- 2-of-2, 2-of-3, 3-of-5 configurations
- P2SH, P2WSH, P2SH-P2WSH address types
- xpub import/export
- PSBT creation and signing
- PSBT export (base64, hex, QR)
- PSBT import and signature aggregation
- Pending transaction management

**Enhancements (v0.9.0)** - ✅ Complete
- Tab-based wizard (better UX)
- Progress save/resume
- Comprehensive help content

---

### Contacts Management

**Post-MVP Requirements (v0.9.0)** - ✅ Complete
- Add/edit/delete contacts
- Contact name, label, notes
- Address validation
- Contact list view
- Select contact when sending

**Enhancements (v0.11.0)** - ⏳ Planned
- Privacy badges (address reuse warnings)
- xpub-based contacts (rotation support)
- Contact groups/categories
- CSV import/export

---

## Related Documentation

### Product Documents
- [**roadmap.md**](./roadmap.md) - Release planning and version history
- [**features.md**](./features.md) - Detailed feature specifications
- [**decisions.md**](./decisions.md) - Product ADRs and decision log

### Planning Documents
- [**PRIVACY_ENHANCEMENT_PRD.md**](../plans/PRIVACY_ENHANCEMENT_PRD.md) - Privacy feature requirements (v0.11.0)
- [**TAB_BASED_MULTISIG_WIZARD_PRD.md**](../plans/TAB_BASED_MULTISIG_WIZARD_PRD.md) - Multisig wizard requirements (v0.9.0)
- [**PRIVATE_KEY_EXPORT_IMPORT_PRD.md**](../plans/PRIVATE_KEY_EXPORT_IMPORT_PRD.md) - Private key management requirements (v0.10.0)

### Technical Documents
- [**ARCHITECTURE.md**](../plans/ARCHITECTURE.md) - System architecture
- [**TESTING.md**](../plans/TESTING.md) - Testing requirements

### Expert Notes
- [**blockchain-expert-notes.md**](../blockchain-expert-notes.md) - Bitcoin protocol implementation
- [**security-expert-notes.md**](../security-expert-notes.md) - Security requirements and audits

---

**Document Status**: Complete and up-to-date
**Next Review**: Before each sprint planning
**Maintainer**: Product Manager
