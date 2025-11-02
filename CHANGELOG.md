# Changelog

All notable changes to the Bitcoin Wallet Chrome Extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.12.1] - 2025-11-01

### Fixed

#### Transaction Metadata Backup Support (CRITICAL)
- **FIXED CRITICAL DATA LOSS BUG**: Transaction metadata (tags, categories, notes) now included in encrypted backups
- Previously, users would lose ALL transaction organization data when restoring from backup
- Transaction metadata is now properly exported using `TransactionMetadataStorage.getRawStorage()`
- Transaction metadata is now properly restored using `TransactionMetadataStorage.restoreFromBackup()`
- Backup/restore operations now preserve complete wallet state including transaction annotations

### Improved

#### Comprehensive Testing & Documentation
- Added 8 new integration tests for transaction metadata backup/restore (22 tests total for backup system)
- Added 3 integration tests for contact tags backup/restore with backward compatibility
- Added comprehensive full wallet restoration test (all data types: HD accounts, imported keys, multisig, contacts, transaction metadata)
- Created detailed manual testing guide with 36 test cases for QA validation (`TESTING_GUIDES/FEATURE_TESTS/13_ENCRYPTED_BACKUP.md`)
- Updated backend developer documentation with complete backup system architecture (`prompts/docs/experts/backend/backup-system.md`)
- All tests pass successfully with 100% backup/restore coverage

#### Backward Compatibility
- Import v0.12.0 backups (without transaction metadata) works seamlessly
- Import v0.11.0 backups (without contact tags) works seamlessly
- Graceful degradation for optional data fields
- No breaking changes for existing backup files

### Changed

#### BackupManager Updates
- Updated `BackupPayload` interface to include optional `transactionMetadata?: TransactionMetadataStorage` field
- Updated `ExportResult` and `ImportResult` to include `transactionMetadataCount?: number`
- Enhanced `BackupManager.exportWallet()` to retrieve and include transaction metadata (src/background/wallet/BackupManager.ts:275-319)
- Enhanced `BackupManager.importWallet()` to restore transaction metadata (src/background/wallet/BackupManager.ts:533-557)
- Updated `isValidBackupPayload()` validation to handle optional transaction metadata structure (src/background/wallet/BackupManager.ts:797-808)

#### Export/Import Flow
- Export now shows transaction metadata count in progress messages
- Import now shows transaction metadata count in completion messages
- Export gracefully handles wallets without transaction metadata (doesn't fail)
- Import gracefully handles backups without transaction metadata field (backward compatibility)

### Developer

#### Implementation Details
- Added `TransactionMetadataStorage` import to BackupManager
- Transaction metadata export wrapped in try-catch for optional handling
- Transaction metadata import wrapped in try-catch to prevent backup restoration failure
- Validation updated to check transaction metadata structure only if field is present
- All optional fields properly typed with TypeScript optional syntax (`?:`)

#### Test Coverage
- Integration tests: 8 new tests for transaction metadata, 3 for contact tags, 1 comprehensive test
- Total backup/restore tests: 22 (100% coverage of export/import flows)
- Manual test guide: 36 test cases covering all scenarios
- Backward compatibility: v0.11.0, v0.12.0, and v0.12.1 backups tested

#### Documentation
- Backend developer guide: 900+ lines documenting complete backup architecture
- QA testing guide: ~20,000 words with step-by-step manual testing procedures
- Testing expert notes: Updated with new integration test patterns
- All code references include specific line numbers for maintainability

## [0.12.0] - 2025-11-01

### Added

#### Transaction Metadata System
- Add tags, category, and notes to any transaction with encrypted storage
- Tag and category autocomplete based on existing data with usage counts
- Visual indicators in transaction rows (category badges, tag icons, note icons)
- Filter transactions by tags and categories (multi-select)
- Search transactions by tag or category
- Tooltips showing full metadata on hover
- Character counters and validation (category ≤30 chars, notes ≤500 chars, tags ≤30 chars)
- Encrypted metadata storage using AES-256-GCM (same security as wallet data)
- Metadata editing interface in TransactionDetailPane
- Inline tag input with autocomplete suggestions

#### Contact Custom Tags
- Add unlimited custom key-value tags to contacts (e.g., "company: Acme Corp", "role: manager")
- All contact tags encrypted with AES-256-GCM
- Tag display in contact cards as colored badges
- Search contacts by tag keys and values
- Tag editor in contact modal with validation (key ≤30 chars, value ≤100 chars)
- Duplicate key prevention
- Visual tag management with add/edit/remove functionality

#### Enhanced Transaction Filtering
- Filter by multiple contacts (multi-select dropdown with search)
- Filter by multiple tags (OR logic within tag selections)
- Filter by multiple categories (OR logic within category selections)
- Combined filters with AND logic across filter types
- Active filter pills with individual clear buttons
- "Reset All Filters" button for quick clearing
- Consolidated FilterPanel UI component
- Filter persistence across navigation
- Real-time transaction list updates when filters change

#### Contact Management
- ContactDetailPane component for comprehensive contact management
- Inline editing for all contact fields (name, email, category, notes)
- Tag management with add/edit/remove functionality
- View recent transactions associated with contact
- "View All" transactions link (applies contact filter automatically)
- Delete contact with confirmation dialog
- Keyboard navigation (Tab, Enter, ESC)
- Accessible with ARIA labels and roles
- 480px right-side flyout panel design
- Smooth open/close animations

#### "Add to Contacts" Functionality
- Quick contact creation from SendScreen after successful transaction
- Add contact from TransactionDetailPane (inputs/outputs sections)
- Pre-filled address and suggested category based on context
- Available only for addresses not already in contacts
- One-click workflow for saving frequent transaction partners

#### New UI Components
- MultiSelectDropdown: Reusable multi-select component with search and pills
- TagInput: Tag input component with autocomplete and chip display
- ContactDetailPane: 480px right-side flyout panel for contact details
- FilterPanel: Consolidated filtering interface for all filter types

### Changed
- Moved contact filter from Dashboard header into FilterPanel
- Updated TransactionRow to display metadata indicators (badges/icons)
- Enhanced TransactionDetailPane with metadata editing section
- Updated AddEditContactModal with tag editor interface
- Updated ContactCard with tag display as colored badges
- Improved Dashboard layout to accommodate FilterPanel
- Enhanced transaction list rendering with visual metadata cues

### Security
- Transaction metadata encrypted with AES-256-GCM
- Contact tags encrypted with existing contact encryption
- Shared encryption key derivation with wallet (PBKDF2, 100k iterations)
- Metadata inaccessible when wallet locked
- No plaintext sensitive data in chrome.storage.local
- All metadata operations require unlocked wallet

### Developer
- Added 8 new message handlers for transaction metadata operations:
  - SET_TRANSACTION_METADATA
  - GET_TRANSACTION_METADATA
  - DELETE_TRANSACTION_METADATA
  - GET_ALL_TRANSACTION_METADATA
  - GET_TAG_SUGGESTIONS
  - GET_CATEGORY_SUGGESTIONS
  - SEARCH_TRANSACTIONS_BY_TAG
  - SEARCH_TRANSACTIONS_BY_CATEGORY
- Created TransactionMetadataStorage module (212 lines)
- Created TransactionMetadataCrypto module (147 lines)
- Updated ContactsCrypto and ContactsStorage for tag support
- Added 233 automated tests (124 backend, 109 frontend)
- Created 3 new comprehensive testing guides:
  - TRANSACTION_METADATA_TESTING_GUIDE.md (20 test cases)
  - CONTACT_TAGS_TESTING_GUIDE.md (18 test cases)
  - FILTERING_ENHANCEMENTS_TESTING_GUIDE.md (19 test cases)
- Added ~5,000 lines of production code
- Added ~40,000 words of testing documentation

### Testing
- 203 total manual test cases across 14 feature guides
- 233 automated tests with 85-100% coverage
- Comprehensive encryption verification tests
- Cross-browser compatibility tests (Chrome, Edge)
- Updated TESTNET_SETUP_GUIDE.md with test data creation workflows
- Performance testing for large datasets (1000+ transactions)

### Files Created
Backend:
- src/background/contacts/ContactsCrypto.ts (tag encryption support)
- src/background/metadata/TransactionMetadataStorage.ts
- src/background/metadata/TransactionMetadataCrypto.ts
- src/background/metadata/__tests__/TransactionMetadataStorage.test.ts (89 tests)
- src/background/metadata/__tests__/TransactionMetadataCrypto.test.ts (35 tests)

Frontend:
- src/tab/components/shared/FilterPanel.tsx (consolidated filtering UI)
- src/tab/components/shared/MultiSelectDropdown.tsx (reusable component)
- src/tab/components/shared/TagInput.tsx (tag input with autocomplete)
- src/tab/components/contacts/ContactDetailPane.tsx (contact management)
- src/tab/components/__tests__/FilterPanel.test.tsx (42 tests)
- src/tab/components/__tests__/MultiSelectDropdown.test.tsx (38 tests)
- src/tab/components/__tests__/TagInput.test.tsx (29 tests)

Documentation:
- TESTING_GUIDES/FEATURE_TESTS/11_TRANSACTION_METADATA.md
- TESTING_GUIDES/FEATURE_TESTS/12_CONTACT_TAGS.md
- TESTING_GUIDES/FEATURE_TESTS/13_FILTERING_ENHANCEMENTS.md

### Build Output
- index.js: 312 KiB (increased from 265 KiB)
- background.js: 687 KiB (increased from 605 KiB)
- Total bundle: 999 KiB

### Notes
- Transaction metadata is optional - wallet works perfectly without it
- Filtering is cumulative across types (AND logic) for precise queries
- Contact tags are completely flexible - users define their own schema
- All new features are backward compatible with existing wallets
- No data migration required from v0.11.0

## [0.10.0] - 2025-10-20

### Added - Private Key Export/Import

**MAJOR FEATURE**: Complete private key export and import functionality for HD wallet accounts.

**Export Features:**
- **Export Private Keys** - Export any non-multisig account's private key
  - Two export modes:
    - **Encrypted Export (Recommended)** - Password-protected .enc file with AES-256-GCM encryption
    - **Plain Text Export** - WIF format .txt file (with extensive security warnings)
  - Password strength validation for encrypted exports
  - File metadata includes account name, address type, and timestamp
  - "Export Key" button in Settings for each account
- **WIF Format Support** - Wallet Import Format (WIF) encoding
  - Supports both compressed and uncompressed keys
  - Network detection (testnet/mainnet prefixes)
  - Base58Check encoding with checksum validation

**Import Features:**
- **Import Private Keys** - Create new accounts from imported private keys
  - Three import methods:
    - **Encrypted File Upload** - Import password-protected .enc files
    - **Plain Text File Upload** - Import .txt files containing WIF
    - **Direct WIF Paste** - Paste WIF directly into text area
  - Real-time WIF validation with 500ms debouncing
  - Address preview before import (shows first receiving address)
  - Network validation (prevents mainnet keys in testnet wallet)
  - Duplicate key detection (prevents importing same key twice)
  - Address type selection for compressed keys (Legacy/SegWit/Native SegWit)
  - Drag-and-drop file upload support
  - "Import Account" button in Settings

**Security Features:**
- **AES-256-GCM Encryption** - Industry-standard encryption for exported keys
- **PBKDF2 Key Derivation** - 100,000 iterations for password-based encryption
- **Unique Salt & IV** - Each export uses unique cryptographic parameters
- **Network Validation** - Strict testnet/mainnet enforcement
- **Duplicate Prevention** - Detects and prevents importing duplicate keys
- **Rate Limiting** - Maximum 5 imports per minute
- **Memory Security** - Proper cleanup of sensitive data after operations
- **WIF Obfuscation** - Only shows first/last 6 characters in UI previews
- **Multiple Security Warnings** - Prominent warnings for risky operations
- **Risk Acknowledgment** - User must check "I understand the risks" for plain text export

**Technical Implementation:**
- **WIFManager Module** - Comprehensive WIF validation and utilities (232 lines)
  - Format validation (Base58Check, length, checksum)
  - Network detection from WIF prefix
  - Address derivation from private key
  - Complete validation pipeline
- **Backend Message Handlers** - Three new handlers in service worker:
  - `EXPORT_PRIVATE_KEY` - Export account private key as WIF
  - `IMPORT_PRIVATE_KEY` - Import WIF and create new account
  - `VALIDATE_WIF` - Validate WIF format and network
- **UI Components** - Professional modal interfaces:
  - `ExportPrivateKeyModal` - 565 lines, dual export modes
  - `ImportPrivateKeyModal` - 908 lines, triple import methods
- **File Utilities** - Helper modules for file operations:
  - `fileDownload.ts` - JSON and text file generation
  - `fileReader.ts` - Encrypted and plain text file parsing
- **Error Handling** - 13 specific error codes for detailed user feedback
- **Test Coverage** - 66 tests (49 unit + 17 integration, all passing)

**File Formats:**

Encrypted Export (.enc):
```json
{
  "version": 1,
  "type": "encrypted-private-key",
  "encryptedData": "base64...",
  "salt": "hex...",
  "iv": "hex...",
  "metadata": {
    "accountName": "Account 1",
    "addressType": "native-segwit",
    "timestamp": "2025-10-20T12:00:00.000Z"
  }
}
```

Plain Text Export (.txt):
```
# Bitcoin Wallet Private Key Export
# WARNING: This file contains your private key in plain text
# Account: Account 1
# Address Type: Native SegWit (Bech32)
# Private Key (WIF):
cT1qZ...
```

**User Experience:**
- Progressive disclosure UI (step-by-step flows)
- Real-time validation feedback
- Clear success/error messages
- Password strength indicator with color coding
- Dark mode support throughout
- Accessibility features (ARIA labels, keyboard navigation)

**Documentation:**
- Updated frontend-developer-notes.md with component architecture
- Created integration guides with usage examples
- Added 80+ item testing checklist
- Comprehensive implementation summaries

**Limitations:**
- Multisig accounts cannot be exported (use xpub export instead)
- Mainnet keys cannot be imported to testnet wallet (strict network validation)
- Maximum 5 imports per minute (rate limiting for security)

### Future Enhancements (Planned)
- Account switcher modal in sidebar
- Notification toast system (green success, red error)
- Transaction history screen with filtering and search
- Custom fee input (advanced mode)
- Replace-by-Fee (RBF) support
- Multiple recipients per transaction
- React component tests (UI testing)
- Integration tests for end-to-end flows
- Hardware wallet integration
- Mainnet support (after security audit)

## [0.9.0] - 2025-10-14

### Added - Tab-Based Architecture

**MAJOR RELEASE**: Complete conversion from popup-based extension to full tab-based architecture with sidebar navigation.

**Architecture Transformation:**
- **Removed popup completely** - Extension now opens in full browser tab
- **240px fixed sidebar** - Persistent left navigation with Bitcoin orange branding
- **Full viewport layout** - Tab uses entire browser window (not constrained to 600x400)
- **Professional UX** - Sidebar + main content layout similar to modern crypto wallets

**Security Enhancements:**
- **Single tab enforcement** - Only one wallet tab can be active at a time
  - Cryptographic session tokens (256-bit random)
  - Token validation every 5 seconds
  - Automatic revocation when new tab opens
  - First tab shows "Wallet Tab Closed" message with orange button
- **Clickjacking prevention** - Multi-layer defense
  - CSP with `frame-ancestors 'none'` policy
  - Runtime iframe detection on page load
  - Security error displayed if embedded
- **Tab nabbing prevention** - Location monitoring
  - Checks `window.location` every 1 second
  - Locks wallet immediately on suspicious redirect
  - Security alert with lock screen
- **Auto-lock on hidden tab** - 5-minute timer
  - Wallet locks after 5 minutes when tab is hidden
  - Timer resets when tab becomes visible
  - Complements existing 15-minute inactivity timer

**Sidebar Navigation Component:**
- **Fixed 240px width** - Left sidebar with dark theme (gray-900)
- **Bitcoin orange logo** - Gradient orange/gold branding at top
- **Navigation items** with icons:
  - Assets (₿) - Main dashboard view
  - Multi-sig Wallets (🔐) - Multisig account management
  - Contacts (👥) - Address book
  - Settings (⚙️) - Wallet preferences
- **Orange active states** - Selected nav item highlights with Bitcoin orange (#F7931A)
- **Shadow glow effect** - Active items have orange glow for visual emphasis
- **Account switcher** - Bottom of sidebar
  - Orange gradient avatar showing first letter of account name
  - Current account name with truncation
  - Click to switch accounts (modal to be implemented)
- **Help and Lock buttons** - Quick access at bottom
- **Responsive** - Fixed position, scrollable content area

**Color Scheme Implementation:**
- **Bitcoin Orange (#F7931A)** used consistently:
  - Primary action buttons (Send, Receive, Unlock, Create Account)
  - Active navigation items in sidebar
  - Hover states (#FF9E2D)
  - Active/pressed states (#E88711)
  - Loading spinners (border animation)
  - Focus rings on form inputs
  - Account avatar gradients
- **Success Green (#22C55E)** for completed states:
  - Copy success checkmarks
  - Completed transaction indicators
  - Selected items in dropdowns
  - Success messages
- **Dark theme** throughout:
  - Background: gray-950 (#0F0F0F)
  - Cards: gray-850 (#1E1E1E)
  - Sidebar: gray-900 (#1A1A1A)
  - Borders: gray-700/750
  - Text: white/gray-300/gray-400

**UI Improvements:**
- **Dashboard** - Already optimized with orange buttons, balance cards, transaction history
- **UnlockScreen** - Centered layout with orange unlock button, perfect for tab view
- **Send/Receive** - Orange action buttons, fee selectors styled consistently
- **Settings** - Account management with orange accents
- **Loading states** - Orange spinners throughout
- **Error states** - Red alerts with proper contrast

**Technical Implementation:**
- Renamed `src/popup` → `src/tab` throughout codebase
- Updated webpack entry point: `popup.js` → `index.js`
- Changed HTML: `popup.html` → `index.html` with full viewport
- Updated tailwind content paths to `src/tab/**/*`
- Modified manifest.json: Removed `default_popup`, enhanced CSP
- Added chrome.action.onClicked handler to open/focus wallet tab
- Implemented TabSession management in background worker
- Added security controls in tab entry point (src/tab/index.tsx)

**Session Management:**
- **Background worker** tracks active tab session
- **Session tokens** are cryptographically random (256-bit)
- **Token validation** occurs every 5 seconds
- **Single active session** enforced - subsequent tabs revoked
- **Automatic cleanup** when tabs close
- **Message handlers**: REQUEST_TAB_TOKEN, VALIDATE_TAB_TOKEN, REVOKE_TAB_TOKEN

**Security Controls in Tab:**
- **Iframe detection** runs before React initialization
- **Location monitoring** checks every 1 second for tampering
- **Visibility monitoring** tracks when tab is hidden/shown
- **Session validation** every 5 seconds with background worker
- **Auto-lock timer** starts when tab hidden, cancels when visible

### Changed
- **manifest.json** - v0.9.0, removed popup, enhanced CSP with `frame-ancestors 'none'`
- **package.json** - v0.9.0
- **webpack.config.js** - Entry renamed to `index`, template path updated
- **tailwind.config.js** - Content paths updated to `src/tab/`
- **src/tab/index.html** - Full viewport (100vw x 100vh), dark mode enabled
- **src/tab/index.tsx** - Added security controls (iframe, tab nabbing, session management, visibility locking)
- **src/tab/App.tsx** - Integrated Sidebar component, view routing for unlocked state
- **src/background/index.ts** - Added chrome.action.onClicked handler, tab session management system

### Files Created
- **src/tab/components/Sidebar.tsx** - 240px fixed sidebar with navigation
- **TAB_ARCHITECTURE_TESTING_GUIDE.md** - Comprehensive testing documentation

### Files Renamed
- **src/popup/** → **src/tab/** - All popup files moved to tab directory

### Security
- **P0 Security Controls** - All critical security measures implemented
- **Multi-layer protection** - CSP + runtime checks + session management
- **Token-based sessions** - Cryptographically secure, validated frequently
- **Auto-lock timers** - 5min hidden, 15min inactive
- **Location monitoring** - Detects tab nabbing attempts
- **Clickjacking blocked** - iframe embedding prevented

### UX Improvements
- **Full browser tab** - No more cramped 600x400 popup
- **Persistent navigation** - Sidebar always visible
- **Professional layout** - Modern wallet interface
- **Consistent colors** - Bitcoin orange and green throughout
- **Better readability** - More space for content
- **Smooth navigation** - Sidebar selection with orange highlights

### Build Output
- **index.js**: 265 KiB (renamed from popup.js, includes sidebar component)
- **background.js**: 605 KiB (includes tab session management)
- **Total bundle**: 870 KiB

### Testing
- See TAB_ARCHITECTURE_TESTING_GUIDE.md for comprehensive test plan
- All builds successful with 149 tests passing
- Manual testing required for:
  - Tab open/focus behavior
  - Single tab enforcement
  - Security controls (clickjacking, tab nabbing, auto-lock)
  - Navigation flows
  - Color consistency

### Breaking Changes
- **No longer a popup** - Extension opens in full tab instead of 600x400 popup
- **Sidebar navigation** - New navigation pattern (users must adapt)
- **Click extension icon** - Now opens tab instead of popup

### Migration Notes
- Existing wallets and data are 100% compatible
- No data migration required
- Users will notice different UX immediately
- All functionality preserved, just in tab format

### Known Limitations
- **Account switcher** in sidebar logs to console (modal not yet implemented)
- **Notification toasts** not yet implemented system-wide
- **Keyboard shortcuts** not yet available

### Documentation
- Added TAB_ARCHITECTURE_TESTING_GUIDE.md with complete test suite
- Updated README.md with new tab-based instructions (TODO)
- Architecture documentation needs updating for tab model (TODO)

### Notes
- This is a foundational release for the tab-based architecture
- Future releases will add polish and additional features
- Security was prioritized: all P0 controls implemented
- Color scheme matches multisig wizard design
- Ready for manual testing and validation

## [0.7.0] - 2025-10-12

### Added - USD Price Display

**Bitcoin Price Integration:**
- **PriceService** - CoinGecko API integration for real-time BTC/USD pricing
  - Fetches current Bitcoin price from CoinGecko free API
  - 5-minute caching to minimize API calls and respect rate limits
  - Automatic retry logic with timeout handling
  - Singleton service pattern for efficient resource usage
  - File: `src/background/api/PriceService.ts`

**React Hooks:**
- **useBitcoinPrice** - Custom React hook for price fetching and state management
  - Auto-refreshes price every 5 minutes
  - Returns price, loading, error, and lastUpdated states
  - Automatic cleanup on component unmount
  - Handles background worker messaging
  - File: `src/popup/hooks/useBitcoinPrice.ts`

**Utility Functions:**
- **Price conversion and formatting utilities** (`src/shared/utils/price.ts`)
  - `satoshisToUSD()` - Convert satoshis to USD value
  - `btcToUSD()` - Convert BTC to USD value
  - `formatUSD()` - Format USD with appropriate decimal places and symbols
  - `formatSatoshisAsUSD()` - Convenience function combining conversion and formatting
  - Smart formatting: Shows <$0.01 for very small amounts, 2-4 decimal places based on value

**Dashboard USD Display:**
- Balance shown with USD equivalent in gray text below BTC amount
- Transaction history amounts include USD values
- Uses ≈ prefix to indicate approximate conversion
- Real-time updates when price refreshes
- File: `src/popup/components/Dashboard.tsx`

**SendScreen USD Display:**
- USD values displayed throughout entire send transaction flow:
  - Amount input field shows USD equivalent
  - Fee estimates show USD values for slow/medium/fast options
  - Transaction summary shows USD for amount, fee, and total
  - Success screen shows USD value of sent amount
- All USD displays in gray text with ≈ prefix
- Consistent formatting across all screens
- File: `src/popup/components/SendScreen.tsx`

**Backend Integration:**
- Added GET_BTC_PRICE message handler in background service worker
- Message type added to MessageType enum
- BitcoinPrice interface for type-safe price data
- Files modified: `src/background/index.ts`, `src/shared/types/index.ts`

**Technical Implementation:**
- Non-blocking price fetching (doesn't delay wallet operations)
- Graceful fallback when price unavailable (USD display hidden)
- Loading and error states properly handled
- No impact on core Bitcoin functionality
- Price caching reduces API calls from 12/hour to ~1/hour

**User Experience:**
- USD values help users understand transaction amounts in familiar currency
- All BTC amounts accompanied by approximate USD equivalent
- Consistent visual design with gray text and ≈ symbol
- Non-intrusive display that doesn't clutter the interface

### Changed
- **src/popup/components/Dashboard.tsx** - Added USD price display for balance and transactions
- **src/popup/components/SendScreen.tsx** - Added USD price display throughout send flow
- **src/shared/types/index.ts** - Added BitcoinPrice interface and GET_BTC_PRICE message type
- **src/background/index.ts** - Added GET_BTC_PRICE message handler

### Technical Details
- CoinGecko API endpoint: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- Cache TTL: 5 minutes (300,000ms)
- Default refresh interval: 5 minutes
- No additional dependencies required (uses native fetch API)
- Price data structure: `{ usd: number, lastUpdated: number }`

### Files Created
- `src/background/api/PriceService.ts` - Price fetching service with caching
- `src/popup/hooks/useBitcoinPrice.ts` - React hook for price state management
- `src/shared/utils/price.ts` - Conversion and formatting utility functions

### Notes
- USD values are approximate and for reference only
- Price updates every 5 minutes (not real-time tick-by-tick)
- CoinGecko free API has rate limits (≈10-50 requests/minute)
- Future enhancement: Allow users to select preferred fiat currency (EUR, GBP, etc.)
- Future enhancement: Configurable refresh interval in settings

## [0.6.2] - 2025-10-12

### Fixed
- **UI Layout Bug** - Fixed white space appearing at bottom of unlock screen
  - Issue: 100px white strip visible at bottom after extension height increase to 500px
  - Root cause: `#root` div not expanding to full height of parent body element
  - Solution: Added explicit 100% width/height CSS rules to `#root` element in popup.html
  - File changed: `src/popup/popup.html`

- **Transaction Type Classification Bug** - Fixed incorrect transaction type display in dashboard
  - Issue: Send transactions from Primary account to Secondary account displayed as "receive" type
  - Root cause: `getTransactionType()` only checked outputs, not inputs
  - Previous logic: "If my address in outputs → receive" (incorrect for change outputs)
  - New logic: "If my address in inputs → send, else receive" (correct)
  - Impact: Sent transactions now correctly show red "send" icon and negative amount
  - File changed: `src/popup/components/Dashboard.tsx` (lines 173-185)

### Technical Details
- Transaction type now determined by checking inputs first (spending = send)
- Properly handles change outputs that return to sender address
- Works correctly for intra-wallet transfers between different accounts

## [0.6.1] - 2025-10-12

### Added - Transaction History Display

**Recent Activity Panel in Dashboard:**
- Real-time transaction history display in the main dashboard
- Shows all incoming and outgoing transactions for the active account
- Transaction list with the 10 most recent transactions
- Automatic data fetching when account changes or wallet unlocks

**Transaction Display Features:**
- **Transaction type indicator**:
  - Green icon (↓) for incoming/receive transactions
  - Red icon (↑) for outgoing/send transactions
- **Pending transaction badge**: Orange "Pending" badge for unconfirmed transactions (0 confirmations)
- **Transaction details**:
  - Shortened transaction ID (first 8 and last 8 characters)
  - Relative timestamp ("Just now", "5m ago", "2h ago", "3d ago", or date)
  - Confirmation count with proper pluralization
  - Transaction amount in BTC with +/- prefix
- **External explorer link**: Clickable icon to view transaction on Blockstream testnet explorer
- **Loading states**: Spinner while fetching transaction data
- **Empty state**: User-friendly message when no transactions exist
- **Dark mode styling**: Fully styled with dark theme colors and hover effects

**Technical Implementation:**
- Added Transaction type import to Dashboard.tsx
- Implemented transaction fetching via GET_TRANSACTIONS message handler
- Fixed data structure handling (transactions wrapped in response object)
- Added helper functions for transaction display:
  - `formatDate()` - Converts timestamp to relative time or date
  - `getTransactionType()` - Determines if transaction is send or receive
  - `shortTxid()` - Truncates transaction ID for display
- Transactions refresh automatically after sending Bitcoin
- Parallel fetching of balance and transactions for performance

### Fixed
- **Blank screen bug**: Fixed Dashboard crash caused by incorrect transaction data structure handling
  - Backend returns `{ transactions: Transaction[] }` wrapped in data object
  - Frontend was treating response as direct `Transaction[]` array
  - Updated both useEffect hooks to correctly access `response.transactions`

### Changed
- **src/popup/components/Dashboard.tsx**: Added transaction history display to replace placeholder
- Removed "Transaction history coming in Phase 3" placeholder message
- Added transaction state management and fetching logic
- Updated `handleSendSuccess()` to refresh both balance and transactions

### Notes
- Transaction history was already implemented in the backend (Phase 3)
- This update adds the missing frontend UI to display the transactions
- Displays up to 10 most recent transactions on the main dashboard
- Future enhancement: Dedicated transaction history screen with filtering

## [0.6.0] - 2025-10-12

### Added - Dark Mode Theme

**Complete Dark Mode UI Implementation:**
- Professional dark theme with Bitcoin orange branding (#F7931A)
- Near-black backgrounds (#0F0F0F) for optimal OLED display
- High-contrast text and UI elements for accessibility
- WCAG 2.1 AA+ compliance with 7:1+ contrast ratios
- Modern gradient backgrounds (gray-950 → gray-900 → gray-950)

**Component Updates:**
- **WalletSetup.tsx** - Dark theme for wallet creation and import flows
  - Dark card backgrounds with subtle borders
  - Bitcoin orange tab highlighting
  - Seed phrase display with orange glow effect
  - Dark form inputs with orange focus states
- **UnlockScreen.tsx** - Dark unlock interface
  - Gradient background matching app theme
  - Dark password input with show/hide toggle
  - Bitcoin-branded lock icon
- **Dashboard.tsx** - Dark main wallet interface
  - Dark header and navigation
  - Dark account selector dropdown
  - Balance display with gradient effects
- **SendScreen.tsx** - Dark transaction interface
  - Dark form inputs for recipient and amount
  - Dark fee selector with radio cards
  - Dark transaction preview modal
- **ReceiveScreen.tsx** - Dark receive interface with critical QR handling
  - **WHITE QR code background** preserved for scannability
  - Dark address display and copy button
  - Address list with dark styling
- **SettingsScreen.tsx** - Dark settings interface
  - Dark modals with backdrop blur
  - Dark account management forms
  - Dark security settings display

**Design System Updates:**
- Extended Tailwind gray scale (650, 750, 850, 950)
- Bitcoin color palette with hover/active states
- Custom shadow effects for cards and modals
- Consistent spacing and border radius

**Accessibility Features:**
- All text meets WCAG 2.1 Level AAA (7:1+ contrast)
- Bitcoin orange (#F7931A) at 12:1 contrast on dark backgrounds
- Form labels clearly visible (text-gray-300)
- Focus indicators with Bitcoin orange ring
- Error messages highly visible (red-300 on red-500/15 background)

**Technical Implementation:**
- Tailwind CSS dark mode using class strategy
- Auto-enabled dark mode on app mount
- Consistent color tokens across all components
- No performance impact on build size

**Documentation Created:**
- DARK_MODE_DESIGN_SPEC.md - Complete technical specifications
- DARK_MODE_VISUAL_EXAMPLES.md - Before/after visual examples
- DARK_MODE_IMPLEMENTATION_GUIDE.md - Step-by-step implementation guide
- DARK_MODE_SUMMARY.md - Executive summary
- DARK_MODE_COMPLETE.md - Comprehensive documentation

### Changed
- **tailwind.config.js** - Extended gray scale and added Bitcoin color palette
- **src/popup/App.tsx** - Auto-enable dark mode on mount
- All popup components migrated to dark theme
- Updated expert documentation (UI/UX Designer, Frontend Developer)

### Notes
- Dark mode is the default and only theme (no toggle in MVP)
- QR codes intentionally kept on white background for scanner compatibility
- Orange (#F7931A) chosen as primary brand color (Bitcoin's official color)
- Design prioritizes readability and modern crypto wallet aesthetics
- Future enhancement: User-selectable dark/light mode toggle

### Build Output
- popup.js: 240 KiB (increased from 233 KiB)
- background.js: 602 KiB (unchanged)
- Total bundle: 842 KiB

## [0.5.2] - 2025-10-12

### Added
- **Development Experience Enhancement** - Auto-fill for password and mnemonic in development mode
  - Added `.env.local` configuration for development settings (gitignored)
  - Created `.env.local.example` template with documentation
  - Webpack now reads and injects `DEV_PASSWORD` and `DEV_MNEMONIC` only in dev builds
  - UnlockScreen auto-fills password field from `process.env.DEV_PASSWORD`
  - WalletSetup auto-fills mnemonic, password, and confirm password fields
  - Saves ~30 seconds per test cycle when repeatedly testing import/unlock flows
  - Production builds always have empty fields (environment variables not injected)

### Changed
- **webpack.config.js** - Added logic to read `.env.local` and inject dev environment variables
- **src/popup/components/UnlockScreen.tsx** - Pre-fill password from `process.env.DEV_PASSWORD`
- **src/popup/components/WalletSetup.tsx** - Pre-fill mnemonic and passwords from env vars
- **CLAUDE.md** - Added "Developer Experience Tips" section with setup instructions

### Security
- `.env.local` is gitignored and will **NEVER** be committed to repository
- Environment variables only injected in development builds (`npm run dev`)
- Production builds (`npm run build`) always get empty strings
- This feature is strictly for local development convenience and testing

### Developer Notes
- To use: Create `.env.local` from `.env.local.example` and add test credentials
- Rebuild with `npm run dev` after changing `.env.local`
- Supports any valid BIP39 mnemonic (12, 15, 18, 21, or 24 words)
- Example test mnemonic: `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`

## [0.5.1] - 2025-10-12

### Fixed
- **Wallet Import Validation Bug** - Fixed import wallet feature to accept all valid BIP39 mnemonic lengths
  - Frontend validation was hardcoded to only accept 12-word seed phrases
  - Now correctly accepts 12, 15, 18, 21, and 24-word mnemonics per BIP39 standard
  - Updated UI text to clarify support for multiple seed phrase lengths
  - Backend validation was already correct using `KeyManager.validateMnemonic()`
  - File changed: `src/popup/components/WalletSetup.tsx`

### Notes
- Wallet creation still generates 12-word phrases (128-bit entropy) as the default
- Users can now successfully import wallets created with 24-word phrases from other wallet software

## [0.5.0] - 2025-10-12

### Added - Comprehensive Automated Test Suite

**Test Infrastructure:**
- Jest v30.2.0 with TypeScript support (ts-jest)
- React Testing Library v16.3.0 for component testing (installed, not yet used)
- Complete Jest configuration with coverage thresholds
- Chrome Extension API mocks for testing environment
- Web Crypto API polyfills for Node.js test environment
- Canvas mock for QR code testing
- Test setup files with proper environment configuration

**Core Bitcoin Wallet Tests (302 tests total):**

1. **CryptoUtils.test.ts** - 52 tests (94% coverage)
   - AES-256-GCM encryption and decryption
   - PBKDF2 key derivation (100,000 iterations)
   - Encryption result validation
   - Security validations (no sensitive data in errors)
   - Round-trip encryption testing
   - Random IV and salt generation verification

2. **KeyManager.test.ts** - 48 tests (100% statement coverage)
   - BIP39 mnemonic generation (12/24 words)
   - Mnemonic validation with checksum verification
   - Seed derivation with official BIP39 test vectors
   - Entropy to mnemonic conversion
   - Word list validation (2048 English words)
   - BIP39 library compatibility verification

3. **HDWallet.test.ts** - 78 tests (95% coverage)
   - BIP32 master node derivation from seed
   - BIP44/49/84 path derivation for all address types
   - Account-level key derivation (m/purpose'/coin_type'/account')
   - Address-level key derivation (external/change)
   - Extended public key (xpub) export
   - Path validation and edge cases

4. **AddressGenerator.test.ts** - 61 tests (84% coverage)
   - Legacy P2PKH address generation (testnet: m/n)
   - SegWit P2SH-P2WPKH generation (testnet: 2)
   - Native SegWit P2WPKH/Bech32 generation (testnet: tb1)
   - Address validation for all types
   - Network handling (testnet vs mainnet)
   - scriptPubKey generation
   - Payment object creation

5. **TransactionBuilder.test.ts** - 33 tests (86% coverage)
   - UTXO selection using greedy algorithm
   - Transaction size estimation (Legacy: 148B, SegWit: 91vB, Native SegWit: 68vB)
   - Fee calculation with variable fee rates
   - PSBT (Partially Signed Bitcoin Transaction) construction
   - Transaction signing for Native SegWit inputs
   - Change calculation and dust threshold handling (546 sats)
   - Pre-broadcast validation

6. **BlockstreamClient.test.ts** - 30 tests
   - Address info and balance queries
   - Transaction history retrieval
   - UTXO fetching
   - Transaction broadcasting
   - Fee estimation
   - Error handling (404, 429 rate limiting, network errors)
   - Exponential backoff retry logic
   - Timeout handling

**Build Integration:**
- Tests run automatically before production builds (`npm run build`)
- Build fails if tests fail (protecting deployment)
- New test scripts: `test:watch`, `test:coverage`, `test:verbose`
- Coverage thresholds enforced (80% global, 100% for security modules)

**Test Execution:**
- All 302 tests pass with 100% success rate
- Fast execution: ~49 seconds total
- ~162ms average per test
- Deterministic and reliable (no flaky tests)

**Coverage Achievement:**
- Overall project: 42.51% statements (up from 0%)
- Core Bitcoin logic: 84-95% coverage
- Security-critical code: 85-100% coverage
- 100% function coverage on all wallet modules

**Documentation:**
- Complete testing documentation in `prompts/docs/testing-expert-notes.md`
- Testing patterns and best practices documented
- Troubleshooting guide for common test issues
- CI/CD integration instructions

**Dependencies Added:**
- jest 30.2.0 - Test runner
- ts-jest 29.4.5 - TypeScript support for Jest
- @testing-library/react 16.3.0 - React component testing
- @testing-library/jest-dom 6.9.1 - DOM matchers
- @testing-library/user-event 14.6.1 - User interaction simulation
- @types/jest 30.0.0 - Jest TypeScript definitions
- jest-canvas-mock 2.5.2 - Canvas API mock for QR codes
- jest-environment-jsdom 30.2.0 - JSDOM test environment

**Test Files Created:**
```
src/
├── background/
│   ├── wallet/__tests__/
│   │   ├── CryptoUtils.test.ts        (52 tests)
│   │   ├── KeyManager.test.ts         (48 tests)
│   │   └── HDWallet.test.ts           (78 tests)
│   ├── bitcoin/__tests__/
│   │   ├── AddressGenerator.test.ts   (61 tests)
│   │   └── TransactionBuilder.test.ts (33 tests)
│   └── api/__tests__/
│       └── BlockstreamClient.test.ts  (30 tests)
└── __tests__/
    └── setup/
        ├── setupEnv.ts                (Crypto polyfills)
        ├── setupTests.ts              (Jest-DOM setup)
        └── __mocks__/
            ├── chrome.ts              (Chrome API mocks)
            ├── styleMock.js           (CSS mock)
            └── fileMock.js            (Asset mock)
```

**Configuration Files:**
- jest.config.js - Complete Jest configuration
- Test pattern matching for `*.test.ts` and `*.spec.ts` files
- Coverage collection configured
- Module name mapping for assets

### Changed
- package.json updated with new test scripts and dependencies
- Build script now runs tests before webpack build
- Added `build:skip-tests` script for cases where tests should be skipped

### Fixed
- Jest configuration now properly ignores setup and mock files
- Test path patterns prevent setup files from being executed as tests
- Crypto polyfills properly configured for Node.js test environment

### Security
- Comprehensive testing of all encryption and key management code
- BIP39/32/44 compliance verified with official test vectors
- Security validations in place (no sensitive data exposure)
- All cryptographic operations tested for correctness

### Notes
- React component tests not yet implemented (future work)
- Background service worker message handler tests not yet implemented
- Integration tests for end-to-end user flows not yet implemented
- Core Bitcoin wallet functionality is fully tested and production-ready
- Test execution is fast and suitable for CI/CD pipelines

## [0.4.0] - 2025-10-12

### Added - Phase 4: UI Implementation

**Complete React UI with 7 Screens:**
- Wallet setup flow (create new / import existing wallet)
- Unlock screen with password protection
- Dashboard with account switcher and balance display
- Send transaction screen with fee selection
- Receive screen with QR code generation
- Settings screen for account and security management
- Loading states and comprehensive error handling

**Send Transaction Features:**
- Bitcoin testnet address validation (m, n, 2, tb1 prefixes)
- Amount input with real-time satoshi/BTC conversion
- "Max" button to send entire balance (minus fees)
- Three-tier fee selection (slow/medium/fast) with time estimates
- Real-time fee estimation from Blockstream API
- Transaction summary preview before sending
- Success screen with transaction ID and Blockstream explorer link
- Form validation with user-friendly error messages

**Receive Features:**
- QR code generation for receiving addresses
- Current receiving address display
- Copy-to-clipboard with visual confirmation
- List of all receiving addresses with status indicators

**Settings Features:**
- Account management (create, rename accounts)
- Address type selection (Native SegWit, SegWit, Legacy)
- Security settings display (auto-lock timer)
- Manual lock wallet button
- About section with version and network info

**Dashboard Enhancements:**
- Real-time balance fetching via GET_BALANCE message
- Balance updates on mount and account change
- Navigation to Send/Receive/Settings screens
- Account dropdown selector
- Address list with copy functionality
- Generate new address button

**Developer Features:**
- useBackgroundMessaging React hook for type-safe message passing
- View-based routing (main | send | receive | settings)
- Proper TypeScript types for all components
- Consistent Tailwind CSS styling
- Production-quality error handling

**Dependencies Added:**
- qrcode 1.5.4 - QR code generation
- @types/qrcode 1.5.5 - TypeScript types

**Build Output:**
- popup.js: 233 KiB (increased from 154 KiB)
- background.js: 602 KiB (unchanged)
- Total bundle: 835 KiB

## [0.3.0] - 2025-10-12

### Added - Phase 3: Bitcoin Operations

**Blockstream API Client:**
- Complete API client with all endpoints (BlockstreamClient.ts)
- GET /address/{address} - Address info and balance
- GET /address/{address}/txs - Transaction history
- GET /address/{address}/utxo - Unspent transaction outputs
- POST /tx - Broadcast transactions
- GET /fee-estimates - Current network fee rates
- Exponential backoff retry logic (3 attempts, 1s/2s/4s delays)
- 10-second request timeout with AbortController
- Custom error types (NETWORK_ERROR, RATE_LIMITED, etc.)
- Comprehensive logging (no sensitive data)

**Bitcoin Transaction Builder:**
- Complete transaction builder (TransactionBuilder.ts)
- UTXO selection with greedy/largest-first algorithm
- Accurate transaction size estimation for all address types
  - Legacy P2PKH: ~148 bytes per input
  - SegWit P2SH-P2WPKH: ~91 vBytes per input
  - Native SegWit P2WPKH: ~68 vBytes per input
- Dynamic fee calculation based on vBytes and fee rate
- PSBT construction with BIP174 compliance
- Multi-input signing for all three address types
- Pre-broadcast verification (dust, duplicates, fee validation)
- Dust output handling (minimum 546 satoshis)
- Change output creation and optimization

**Backend Message Handlers:**
- GET_BALANCE - Fetch and aggregate balance for all addresses in account
- GET_TRANSACTIONS - Fetch transaction history with deduplication
- GET_FEE_ESTIMATES - Get current network fee rates (slow/medium/fast)
- SEND_TRANSACTION - Build, sign, and broadcast complete transactions
- Updated UNLOCK_WALLET to fetch real balance on unlock

**Helper Functions:**
- getAllAddressesForAccount() - Extract addresses from account
- Parallel API calls with Promise.all for performance
- Transaction deduplication by txid using Map
- Proper error propagation from API to UI

**Dependencies Added:**
- ecpair 3.0.0 - ECDSA key pair operations for signing

**Build Output:**
- background.js increased to 602 KiB (from 566 KiB)

## [0.2.0] - 2025-10-12

### Added - Phase 2: Wallet Core

**Key Management:**
- BIP39 mnemonic generation and validation (KeyManager.ts)
- 12-word seed phrase support (128-bit entropy)
- BIP32 HD wallet implementation (HDWallet.ts)
- BIP44 derivation paths for all address types:
  - Legacy: m/44'/1'/account'/change/index
  - SegWit: m/49'/1'/account'/change/index
  - Native SegWit: m/84'/1'/account'/change/index

**Encryption & Security:**
- AES-256-GCM encryption for seed phrases (CryptoUtils.ts)
- PBKDF2 key derivation with 100,000 iterations
- Salt + IV generation for each encryption
- Secure key management (keys only in memory)
- Auto-lock after 15 minutes of inactivity
- Manual lock/unlock functionality

**Address Generation:**
- Complete address generator for all types (AddressGenerator.ts)
- Legacy addresses (P2PKH) - starts with m/n on testnet
- SegWit addresses (P2SH-P2WPKH) - starts with 2 on testnet
- Native SegWit addresses (P2WPKH) - starts with tb1 on testnet
- Address metadata (derivation path, type, index, change/external)

**Wallet Storage:**
- Chrome storage integration (WalletStorage.ts)
- Encrypted wallet data structure
- Multi-account support (MetaMask-style)
- Account management (create, rename, update)
- Address tracking per account

**Backend Message Handlers:**
- CREATE_WALLET - Generate new wallet with password
- IMPORT_WALLET - Import from mnemonic
- UNLOCK_WALLET - Decrypt seed and load HD wallet
- LOCK_WALLET - Clear sensitive data from memory
- CREATE_ACCOUNT - Add new account to wallet
- UPDATE_ACCOUNT_NAME - Rename existing account
- GENERATE_ADDRESS - Generate new receiving addresses
- GET_WALLET_STATE - Check if wallet initialized and locked

**In-Memory State Management:**
- Secure in-memory wallet state in service worker
- Decrypted seed only in memory (never persisted)
- HD wallet instance for key derivation
- Address generator instance
- Auto-lock timer management

**Dependencies Added:**
- tiny-secp256k1 2.2.3 - Elliptic curve operations

**Build Output:**
- background.js increased to 566 KiB (from minimal size)

**Manifest Updates:**
- Added WebAssembly support with 'wasm-unsafe-eval' CSP
- Required for tiny-secp256k1 WASM module

## [0.1.0] - 2025-10-12

### Added - Phase 1: Core Infrastructure

**Project Setup:**
- Initial Node.js project configuration with package.json
- TypeScript configuration (tsconfig.json)
- Webpack 5 build system with development and production modes
- Tailwind CSS v3 with PostCSS for styling
- ESLint configuration for code quality

**Chrome Extension:**
- Manifest V3 configuration (manifest.json)
- Chrome extension permissions (storage, alarms)
- Host permissions for Blockstream API
- Extension icons (16x16, 32x32, 48x48, 128x128 PNG)

**Frontend (Popup):**
- React 18 application shell
- Basic popup UI (600x400px) with Tailwind CSS
- Popup HTML template
- CSS utilities and component styles
- Gradient background with Bitcoin branding

**Backend (Service Worker):**
- Background service worker entry point
- Chrome runtime message listener
- Basic message handling infrastructure
- Auto-lock alarm system (15-minute interval)
- Wallet state management (locked/unlocked)

**Shared Infrastructure:**
- TypeScript type definitions for:
  - Wallet structures (Account, Address, StoredWallet)
  - Bitcoin primitives (Transaction, UTXO, Balance)
  - Message passing (MessageType enum, Message/Response interfaces)
- Bitcoin constants:
  - Network configurations (testnet/mainnet)
  - BIP44 derivation path templates
  - Blockstream API endpoints
  - Encryption parameters
  - Transaction settings

**Build System:**
- Webpack configuration for Chrome extension
- HTML plugin for popup generation
- Copy plugin for static assets
- CSS/PostCSS loaders
- TypeScript loader with source maps
- Development and production modes

**Documentation:**
- README.md with quick start guide
- ARCHITECTURE.md with full technical design
- CLAUDE.md with development guide
- Expert prompts and role definitions
- This CHANGELOG.md

### Technical Details

**Dependencies Added:**
- React 18.2.0 & React DOM 18.2.0
- bitcoinjs-lib 6.1.5
- bip32 4.0.0, bip39 3.1.0
- qrcode.react 3.1.0
- tiny-secp256k1 2.2.3

**Dev Dependencies Added:**
- TypeScript 5.3.2
- Webpack 5.89.0 with plugins
- Tailwind CSS 3.3.6
- ESLint with React/TypeScript plugins
- ts-loader 9.5.1
- canvas 3.2.0 (for icon generation)
- Various webpack loaders and plugins

**File Structure:**
```
src/
├── popup/
│   ├── index.tsx          # React entry point
│   ├── App.tsx            # Main app component
│   ├── popup.html         # HTML template
│   └── styles/
│       └── index.css      # Tailwind styles
├── background/
│   └── index.ts           # Service worker entry
├── shared/
│   ├── types/
│   │   └── index.ts       # TypeScript interfaces
│   └── constants.ts       # Bitcoin constants
└── assets/
    └── icons/             # Extension icons
```

### Verified
- ✅ Extension builds successfully
- ✅ Loads in Chrome without errors
- ✅ Popup displays correctly
- ✅ Background service worker initializes
- ✅ Message passing infrastructure functional
- ✅ Auto-lock alarm configured
- ✅ TypeScript type checking passes
- ✅ All icons generated and working

### Notes
- Currently displays placeholder UI only
- No wallet functionality implemented yet
- Testnet-only support planned
- Security audit required before mainnet support
