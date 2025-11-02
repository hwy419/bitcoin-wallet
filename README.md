# Bitcoin Wallet Chrome Extension

A Bitcoin wallet Chrome/Edge extension with testnet support. Built with React, TypeScript, and bitcoinjs-lib.

**GitHub Repository:** https://github.com/hwy419/bitcoin-wallet

## Project Status

**🎉 MVP COMPLETE** - Fully Functional Bitcoin Wallet (2025-10-12)

### ✅ Phase 1: Core Infrastructure (Complete)
- Node.js project with TypeScript & Webpack
- Chrome Extension Manifest V3 with WebAssembly support
- React 18 + Tailwind CSS
- Service worker architecture
- Message passing infrastructure

### ✅ Phase 2: Wallet Core (Complete)
- BIP39 mnemonic generation & validation (12-word seed phrases)
- BIP32/BIP44 HD wallet implementation
- AES-256-GCM encryption with PBKDF2 key derivation
- Password management with auto-lock (15 minutes)
- Address generation (Legacy P2PKH, SegWit P2SH-P2WPKH, Native SegWit P2WPKH)
- Multi-account support (MetaMask-style)

### ✅ Phase 3: Bitcoin Operations (Complete)
- Blockstream API client with retry logic
- Real-time balance fetching (confirmed + unconfirmed)
- Transaction history with deduplication
- UTXO management and selection
- Transaction building with proper fee estimation
- Transaction signing (all address types)
- Transaction broadcasting

### ✅ Phase 4: UI Implementation (Complete)
- Wallet setup flow (create new / import from seed)
- Unlock/lock screens with password protection
- Dashboard with account switcher
- Send transaction screen with fee selection (slow/medium/fast)
- Receive screen with QR code generation
- Settings screen (account management, security)
- Real balance display
- Address copy functionality

**Current Version:** 0.12.0 | **Bundle Size:** ~1 MB | **Network:** Bitcoin Testnet

## What's New in v0.12.0

### Transaction Metadata
Organize your transactions with **tags, categories, and notes**:
- **Tags**: Add multiple tags like #exchange, #important, #business
- **Category**: Categorize transactions (Business, Personal, Exchange, etc.)
- **Notes**: Add notes up to 500 characters for any transaction
- **Autocomplete**: Suggestions based on your existing data with usage counts
- **Encrypted**: All metadata encrypted with AES-256-GCM and secure

### Enhanced Filtering
Find transactions faster with powerful filters:
- Filter by **multiple contacts** at once
- Filter by **tags** (OR logic - any matching tag shows)
- Filter by **categories** (OR logic - any matching category shows)
- **Combine filters** with AND logic (contact + tag + category)
- See active filters as removable pills
- One-click "Reset All Filters"

### Contact Tags
Enhance your contacts with custom information:
- Add **unlimited key-value tags** (company: Acme, role: manager, etc.)
- **Search by tags** to find contacts quickly
- Tags displayed as colorful badges on contact cards
- Fully encrypted like all contact data

### Contact Management
New **ContactDetailPane** for better contact management:
- **Inline editing** - click any field to edit, auto-saves
- **Tag management** - add, edit, remove tags easily
- **Recent transactions** - see last 5 transactions with contact
- **One-click access** - open from contact list or transaction history

### Quick Add Contacts
Save time with quick contact creation:
- **After sending** - "Save to Address Book" button after successful transactions
- **From transaction history** - Add senders/recipients directly from transaction details

## Quick Start

### Install Dependencies
```bash
npm install
```

### Development Build (with watch mode)
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Load Extension in Chrome

1. Build the extension (see above)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `dist/` folder from this project
6. The Bitcoin Wallet icon (orange with white "B") should appear in your toolbar

## Using the Wallet

### First Time Setup

1. **Create or Import Wallet**:
   - Click the extension icon
   - Choose "Create New Wallet" or "Import Existing Wallet"
   - Set a strong password (min 8 chars, with uppercase, lowercase, and number)
   - Select address type (Native SegWit recommended for lower fees)

2. **Backup Your Seed Phrase** (Create New only):
   - **Write down your 12-word seed phrase on paper**
   - Store it securely - this is the ONLY way to recover your wallet
   - Never share it or store it digitally
   - Check the confirmation box

3. **Get Testnet Bitcoin**:
   - Go to the Receive screen
   - Copy your receiving address
   - Visit https://testnet-faucet.mempool.co/
   - Paste your address and request testnet BTC
   - Wait 10-20 minutes for confirmation

### Daily Usage

**Send Bitcoin**:
1. Click "Send" from the dashboard
2. Enter recipient's testnet address (starts with m, n, 2, or tb1)
3. Enter amount in satoshis (1 BTC = 100,000,000 sats)
4. Select fee rate (Slow/Medium/Fast)
5. Review transaction summary
6. Click "Send Transaction"
7. View transaction on Blockstream explorer

**Receive Bitcoin**:
1. Click "Receive" from the dashboard
2. Show QR code to sender OR copy address
3. Share address with sender
4. Wait for transaction confirmation

**Manage Accounts**:
1. Click "Settings" from the dashboard
2. Create new accounts with different address types
3. Rename accounts for organization
4. Switch between accounts using the dropdown

**Export Private Keys** (⚠️ Advanced):
1. Go to Settings
2. Find the account you want to export
3. Click "Export Key" button
4. Choose export method:
   - **Encrypted File (Recommended)**: Password-protected .enc file
     - Enter a strong encryption password
     - Confirm the password
     - Click "Export Encrypted File"
     - File downloads automatically
   - **Plain Text (Dangerous)**: WIF format .txt file
     - Read and understand the security warnings
     - Check "I understand the risks"
     - Click "Show Private Key"
     - Copy the WIF or download as .txt file
5. **Store the exported file securely** - Anyone with this file (and password) can access your funds
6. **Never share your private key** - Treat it like cash

**Import Private Keys**:
1. Go to Settings
2. Click "+ Import Account"
3. Choose import method:
   - **Encrypted File**: Upload password-protected .enc file
     - Select the .enc file
     - Enter decryption password
     - Click "Decrypt and Validate"
   - **Plain Text File**: Upload .txt file containing WIF
     - Select the .txt file
     - Automatic validation
   - **Direct Paste**: Paste WIF directly
     - Paste WIF into text area
     - Real-time validation with preview
4. Review the address preview (first receiving address)
5. Select address type (for compressed keys):
   - Native SegWit (Recommended) - tb1 addresses, lowest fees
   - SegWit - 2 addresses, medium fees
   - Legacy - m/n addresses, higher fees
6. Enter account name
7. Click "Import Account"
8. Your new account appears in Settings

**⚠️ Security Notes for Export/Import**:
- **Multisig accounts cannot be exported** - Use xpub export instead for multisig
- **Mainnet keys cannot be imported to testnet wallet** - Network validation enforced
- **Duplicate keys are rejected** - Cannot import the same key twice
- **Rate limiting**: Maximum 5 imports per minute
- **Encrypted exports use AES-256-GCM** - Industry-standard encryption
- **WIF obfuscation**: UI only shows first/last 6 characters for security

**Security**:
- Wallet auto-locks after 15 minutes of inactivity
- Manually lock anytime from Settings
- Re-enter password to unlock

### Development Tips

**Debugging:**
- Right-click in the popup → "Inspect" to open popup DevTools
- Go to `chrome://extensions/` → Click "Inspect views: service worker" to debug background
- Console logs from both contexts will appear in their respective DevTools

**Hot Reload:**
- Use `npm run dev` for watch mode
- After code changes, click the refresh icon on the extension in `chrome://extensions/`
- Popup changes require closing and reopening the popup

**Advanced Development:**
- See `CLAUDE.md` for advanced developer features (password/mnemonic auto-fill, testing shortcuts, etc.)

## Project Structure

**Current Implementation (v0.7.0):**
```
bitcoin-wallet/
├── src/
│   ├── popup/                    # React UI (600x400px)
│   │   ├── index.tsx            # React entry point
│   │   ├── App.tsx              # Main app router
│   │   ├── popup.html           # HTML template
│   │   ├── styles/
│   │   │   └── index.css        # Tailwind CSS
│   │   ├── components/          # UI components
│   │   │   ├── WalletSetup.tsx  # Create/import wallet
│   │   │   ├── UnlockScreen.tsx # Password unlock
│   │   │   ├── Dashboard.tsx    # Main wallet view
│   │   │   ├── SendScreen.tsx   # Send transaction
│   │   │   ├── ReceiveScreen.tsx # Receive with QR code
│   │   │   └── SettingsScreen.tsx # Account management
│   │   └── hooks/
│   │       └── useBackgroundMessaging.ts # Message passing hook
│   ├── background/              # Service worker
│   │   ├── index.ts             # Main service worker with handlers
│   │   ├── wallet/              # Wallet core
│   │   │   ├── KeyManager.ts    # BIP39/BIP32 key management
│   │   │   ├── HDWallet.ts      # HD wallet implementation
│   │   │   ├── AddressGenerator.ts # Address generation
│   │   │   ├── CryptoUtils.ts   # AES-256-GCM encryption
│   │   │   └── WalletStorage.ts # Chrome storage wrapper
│   │   ├── bitcoin/             # Bitcoin operations
│   │   │   └── TransactionBuilder.ts # PSBT construction & signing
│   │   └── api/
│   │       └── BlockstreamClient.ts # API client with retry logic
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript definitions
│   │   └── constants.ts         # Bitcoin constants
│   └── assets/
│       └── icons/               # Extension icons
├── dist/                        # Build output (generated)
│   ├── popup.js                 # 233 KiB
│   ├── background.js            # 602 KiB
│   └── manifest.json            # Extension manifest
├── prompts/                     # Expert documentation
│   ├── docs/                    # Implementation notes
│   │   ├── blockchain-expert-notes.md
│   │   ├── backend-developer-notes.md
│   │   ├── frontend-developer-notes.md
│   │   └── security-expert-notes.md
│   └── *.txt                    # Expert role definitions
├── manifest.json                # Source manifest
├── package.json                 # Dependencies
├── tsconfig.json                # TypeScript config
├── webpack.config.js            # Build configuration
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
├── README.md                    # This file
├── CHANGELOG.md                 # Version history
├── ARCHITECTURE.md              # Technical design
└── CLAUDE.md                    # Development guide
```

## Documentation

- **README.md** (this file) - Quick start guide and project overview
- **CHANGELOG.md** - Detailed version history and changes
- **CLAUDE.md** - Development guide for Claude Code
- **TESTER_PACKAGE_INFO.md** - Tester distribution package documentation
- **TESTING_GUIDES/** - Comprehensive manual testing documentation
  - **testing-guide.html** - Interactive HTML testing guide (GitHub-style)
  - **MASTER_TESTING_GUIDE.md** - Complete testing workflow and plan
  - **FEATURE_TESTS/** - 15 detailed feature test guides (127+ test cases)
  - **QUICK_START.md** - 5-minute tester onboarding
  - See `TESTING_GUIDES/INDEX.md` for complete catalog
- **prompts/** - Expert role definitions and implementation notes
  - Expert prompt files (`.txt`) define specialized roles
  - Expert documentation (`prompts/docs/*.md`) contains implementation details
  - Planning documents (`prompts/docs/plans/`) contain architecture, specifications, and technical plans

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Bitcoin**: bitcoinjs-lib, bip32, bip39
- **Build**: Webpack 5
- **Extension**: Chrome Manifest V3
- **API**: Blockstream (testnet)

## Features

### ✅ Implemented

**Wallet Management**:
- ✅ Create new wallet with 12-word BIP39 seed phrase
- ✅ Import existing wallet from mnemonic (supports 12, 15, 18, 21, or 24 words)
- ✅ Password protection with AES-256-GCM encryption
- ✅ Auto-lock after 15 minutes of inactivity
- ✅ Manual lock/unlock
- ✅ Multi-account support (unlimited accounts)

**Address Support**:
- ✅ Native SegWit (P2WPKH, bc1/tb1) - Lowest fees, modern
- ✅ SegWit (P2SH-P2WPKH, 3/2) - Compatible, lower fees
- ✅ Legacy (P2PKH, 1/m/n) - Maximum compatibility

**Transaction Management**:
- ✅ Send and receive Bitcoin on testnet
- ✅ Transaction history with detailed information
- ✅ **NEW: Transaction metadata (tags, category, notes) with encryption**
- ✅ **NEW: Filter transactions by contacts, tags, and categories**
- ✅ **NEW: Search transactions by tag or category**
- ✅ Fee estimation (slow, medium, fast)
- ✅ Transaction confirmation tracking
- ✅ Block explorer integration
- ✅ Real-time balance tracking (confirmed + unconfirmed)
- ✅ Transaction broadcasting to testnet
- ✅ UTXO selection and management
- ✅ **USD price display** - Real-time BTC/USD conversion with CoinGecko API
  - Balance shown in USD alongside BTC amount
  - Transaction amounts display USD equivalents
  - Send screen shows USD for amount, fees, and totals
  - 5-minute price caching for efficiency

**Contact Management**:
- ✅ Address book with contact names and categories
- ✅ **NEW: Custom key-value tags for contacts (encrypted)**
- ✅ **NEW: ContactDetailPane for comprehensive contact management**
- ✅ **NEW: Inline editing with auto-save**
- ✅ **NEW: "Add to Contacts" from transactions**
- ✅ Search contacts by name, address, email, category, or tags
- ✅ Extended public key (xpub) support for address rotation
- ✅ Privacy tracking (address reuse warnings)
- ✅ CSV import/export for contacts

**User Interface**:
- ✅ **NEW: Enhanced filtering with multi-select dropdowns**
- ✅ **NEW: Visual metadata indicators (badges, icons, tooltips)**
- ✅ Professional dark mode theme with Bitcoin orange branding
- ✅ WCAG 2.1 AA+ accessibility compliance (7:1+ contrast ratios)
- ✅ Clean, modern UI with Tailwind CSS
- ✅ Wallet setup wizard
- ✅ Dashboard with account switcher and Recent Activity panel
- ✅ Send screen with validation
- ✅ Receive screen with QR codes
- ✅ Settings screen for account management
- ✅ Loading states and error handling
- ✅ Responsive design for various screen sizes
- ✅ Accessibility features (keyboard navigation, ARIA labels)
- ✅ Bitcoin orange accent color throughout

### 🔮 Future Enhancements

**Planned Features**:
- [ ] Advanced transaction history screen with filtering and search
- [ ] Address book for frequent recipients
- [ ] Custom fee input (sat/vB)
- [ ] Replace-by-Fee (RBF) support
- [ ] Multiple recipients in one transaction
- [ ] SegWit address type switching
- [ ] Export transaction history
- [ ] Mainnet support (after security audit)

**Nice to Have**:
- [ ] Hardware wallet integration
- [ ] Multi-signature support
- [ ] Lightning Network integration
- [ ] Additional fiat currencies (EUR, GBP, JPY, etc.)
- [ ] Transaction labeling and notes
- [ ] CSV export for tax purposes

## Testing

### Automated Tests

**Test Suite**: 302 comprehensive tests covering all critical Bitcoin wallet operations

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Verbose output
npm run test:verbose
```

**Test Coverage**:
- ✅ **CryptoUtils**: 52 tests (94% coverage) - AES-256-GCM encryption, PBKDF2 key derivation
- ✅ **KeyManager**: 48 tests (100% statement coverage) - BIP39 mnemonic generation/validation
- ✅ **HDWallet**: 78 tests (95% coverage) - BIP32/44 HD wallet derivation
- ✅ **AddressGenerator**: 61 tests (84% coverage) - All 3 address types (Legacy, SegWit, Native SegWit)
- ✅ **TransactionBuilder**: 33 tests (86% coverage) - UTXO selection, fee calculation, transaction signing
- ✅ **BlockstreamClient**: 30 tests - API integration, error handling, retry logic

**Build Integration**:
- Tests run automatically before production builds
- Build fails if any tests fail
- Protects against deploying broken code

**Key Testing Features**:
- BIP39/32/44 compliance verified with official test vectors
- Security-critical code has 85-100% coverage
- Fast execution (~49 seconds for 302 tests)
- Comprehensive Chrome Extension API mocks
- Web Crypto API polyfills for Node environment

See `prompts/docs/testing-expert-notes.md` for detailed testing documentation.

### Manual Testing on Testnet

Run on Bitcoin testnet only. Get testnet Bitcoin from:
- https://testnet-faucet.mempool.co/

View transactions:
- https://blockstream.info/testnet/

### Tester Distribution Package

**For Manual Testers / QA Engineers:**

A complete testing package is available that bundles the extension with interactive testing guides:

```bash
# Create tester distribution package
python3 create-tester-package.py

# Output: bitcoin-wallet-v0.12.0-testing-package-[DATE].zip (2.1 MB)
```

**Package Contents:**
- ✅ Chrome Extension (ready to install from `extension/` folder)
- ✅ Interactive Testing Guide (`testing-guide.html`) - GitHub-style HTML with navigation
- ✅ Launcher Scripts (`open-guide.sh`, `open-guide.bat`) - One-click guide access
- ✅ Complete Documentation (README, Quick Start, Changelog)
- ✅ Tester Instructions (`TESTER_README.md`) - Complete setup guide

**Testing Guide Features:**
- 26+ testing guides with 127+ test cases
- Left-side navigation with search
- Interactive checkboxes (progress auto-saved)
- GitHub-style markdown rendering
- Works offline (no internet required)
- 5-day, 16-hour systematic testing plan

**Distribution:**
1. Create package: `python3 create-tester-package.py`
2. Send zip file to testers (2.1 MB - email-friendly)
3. Testers extract, read `TESTER_README.md`, and start testing
4. All guides accessible via `testing-guide.html` in browser

See `TESTER_PACKAGE_INFO.md` for complete distribution documentation.

## Security

**⚠️ TESTNET ONLY - DO NOT USE WITH REAL BITCOIN**

This wallet is currently configured for Bitcoin testnet only and has **not been audited**. Do not use with mainnet or real funds.

**Security Features**:
- ✅ **Encryption**: AES-256-GCM encryption for all sensitive data
  - Seed phrases
  - Private keys
  - Contact information (names, emails, notes, categories, tags)
  - Transaction metadata (tags, categories, notes)
- ✅ **Key Derivation**: PBKDF2 with 100,000 iterations
- ✅ **Password Protection**: Master password required for all operations
- ✅ **Auto-lock**: Configurable auto-lock timeout (default 15 minutes)
- ✅ **No Plaintext Storage**: All sensitive data encrypted at rest
- ✅ **Wallet Locked State**: Metadata inaccessible when locked
- ✅ Private keys never logged or persisted
- ✅ Service worker memory clearing on termination
- ✅ Password strength validation
- ✅ Address validation before transactions

**Best Practices**:
1. ✅ Use strong passwords (8+ chars, mixed case, numbers)
2. ✅ Write down seed phrase on paper (never digital)
3. ✅ Store seed phrase securely (fireproof safe recommended)
4. ✅ Never share seed phrase with anyone
5. ✅ Lock wallet when not in use
6. ✅ Only use on testnet until security audit complete

**Security Roadmap**:
- [ ] Professional security audit
- [ ] Penetration testing
- [ ] Bug bounty program
- [ ] Formal verification of crypto implementation
- [ ] Hardware wallet integration for production use

See `prompts/docs/plans/ARCHITECTURE.md` and `prompts/docs/security-expert-notes.md` for detailed security analysis.

## License

MIT
