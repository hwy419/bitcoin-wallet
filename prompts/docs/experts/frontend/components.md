# Frontend Components

**Last Updated**: October 22, 2025
**Quick Nav**: [Index](./_INDEX.md) | [Architecture](./architecture.md) | [State](./state.md) | [Styling](./styling.md) | [Decisions](./decisions.md)

---

## Overview

This document catalogs all frontend components, their APIs, patterns, and implementation details. Components are organized by category: shared/reusable components, screen components, modals, and specialized features.

---

## Component Hierarchy

```
App.tsx (Root)
├── WalletContext.Provider
│   ├── WalletSetup/ (First-time flow)
│   │   ├── Tab: Create New Wallet
│   │   │   ├── SetPassword.tsx
│   │   │   └── AddressTypeSelector.tsx
│   │   ├── Tab: Import Seed
│   │   │   └── ImportWallet.tsx
│   │   └── Tab: Import Private Key (NEW v0.11.0)
│   │       └── ImportPrivateKey.tsx
│   │
│   ├── UnlockScreen.tsx (Locked state)
│   │
│   └── MainApp/ (Unlocked state)
│       ├── Sidebar
│       │   ├── Logo & Title
│       │   ├── Navigation Items
│       │   ├── Account Switcher
│       │   └── Lock Button
│       │
│       └── MainContent (based on currentView)
│           ├── Dashboard.tsx
│           │   ├── BalanceCard.tsx
│           │   ├── BalanceChart.tsx
│           │   └── TransactionList.tsx
│           ├── SendScreen.tsx
│           │   ├── RecipientInput.tsx
│           │   ├── AmountInput.tsx
│           │   ├── FeeSelector.tsx
│           │   └── TransactionPreview.tsx
│           ├── ReceiveScreen.tsx
│           │   ├── AddressDisplay.tsx
│           │   └── QRCode.tsx
│           ├── ContactsScreen.tsx
│           │   └── ContactCard.tsx (multiple)
│           └── SettingsScreen.tsx
│               └── AccountManagement
└── Modals (Portal-rendered)
    ├── SendModal
    ├── ReceiveModal
    ├── AccountCreationModal
    └── ImportAccountModal
```

---

## Shared Components Library

Location: `/src/tab/components/shared/`

### ImportBadge.tsx

**Purpose**: Visual indicator showing that an account was imported rather than HD-derived.

**Props**:
```typescript
interface ImportBadgeProps {
  className?: string;
}
```

**Usage**:
```tsx
<ImportBadge className="ml-2" />
```

**Design**:
- Blue download arrow icon
- Compact size for inline use
- Tooltip explains "Imported account"

---

### SecurityWarning.tsx

**Purpose**: Amber warning banner for security-sensitive operations.

**Props**:
```typescript
interface SecurityWarningProps {
  title: string;
  message: string;
  severity?: 'warning' | 'danger';
  className?: string;
}
```

**Usage**:
```tsx
<SecurityWarning
  title="Security Warning"
  message="Never share your private keys with anyone"
  severity="danger"
/>
```

**Design**:
- Amber background (warning) or red background (danger)
- Warning icon on left
- Bold title with detailed message
- Rounded corners with border

---

### FormField.tsx

**Purpose**: Standardized form field wrapper with label, input, and error message.

**Props**:
```typescript
interface FormFieldProps {
  label: string;
  type?: 'text' | 'password' | 'number';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}
```

**Usage**:
```tsx
<FormField
  label="Account Name"
  value={accountName}
  onChange={setAccountName}
  error={nameError}
  placeholder="My Bitcoin Account"
  required
/>
```

**Design**:
- Label above input with required asterisk
- Full-width input with dark mode styling
- Error message below in red
- Disabled state with reduced opacity

---

### ContactCard.tsx

**Purpose**: Display contact information in list or grid view.

**Props**:
```typescript
interface ContactCardProps {
  contact: {
    name: string;
    address: string;
    label?: string;
  };
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

**Usage**:
```tsx
<ContactCard
  contact={contact}
  onClick={selectContact}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

**Design**:
- Card layout with avatar/icon
- Name and truncated address
- Hover actions (edit, delete)
- Click to select in send flow

---

### BalanceChart.tsx

**Purpose**: Visual representation of balance over time or distribution.

**Props**:
```typescript
interface BalanceChartProps {
  data: Array<{ date: string; balance: number }>;
  currency?: 'BTC' | 'USD';
  height?: number;
}
```

**Usage**:
```tsx
<BalanceChart
  data={balanceHistory}
  currency="BTC"
  height={200}
/>
```

**Design**:
- Line chart showing balance trend
- Bitcoin orange accent colors
- Responsive to container width
- Shows min/max values

---

### TransactionDetailPane.tsx

**Purpose**: Expanded transaction details in side panel or modal.

**Props**:
```typescript
interface TransactionDetailPaneProps {
  transaction: Transaction;
  onClose: () => void;
}
```

**Usage**:
```tsx
<TransactionDetailPane
  transaction={selectedTransaction}
  onClose={closeDetails}
/>
```

**Design**:
- Slide-in panel from right
- All transaction metadata
- Confirmations badge
- Links to block explorer
- Copy buttons for addresses/TXID

---

### FilterPanel.tsx (NEW v0.12.0)

**Purpose**: Collapsible panel for filtering transactions by multiple criteria.

**Location**: `/src/tab/components/shared/FilterPanel.tsx`

**Props**:
```typescript
interface TransactionFilters {
  senderAddress: string;
  amountMin: number | null;
  amountMax: number | null;
  transactionHash: string;
}

interface FilterPanelProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  network: 'testnet' | 'mainnet';
}
```

**Usage**:
```tsx
<FilterPanel
  filters={filters}
  onFiltersChange={setFilters}
  isExpanded={filterPanelExpanded}
  onToggleExpanded={() => setFilterPanelExpanded(!filterPanelExpanded)}
  network="testnet"
/>
```

**Features**:
- **Sender Address Filter**: Exact match, case-insensitive Bitcoin address validation
- **Amount Range Filter**: Min/max BTC amount (filters by absolute value)
- **Transaction Hash Filter**: Partial match support (minimum 8 characters), hex validation
- **Debounced Input**: 300ms debounce on text inputs to prevent excessive re-renders
- **Active Filter Pills**: Visual indicators showing applied filters with individual remove buttons
- **Reset All Button**: Clear all filters at once (only visible when filters are active)
- **Validation**: Real-time validation with error messages for invalid inputs
- **Collapsible**: Expandable/collapsible panel to save screen space

**Filter Logic**:
- All filters use AND logic (must match all criteria)
- Empty/null values are ignored (no filter applied)
- Address validation uses bitcoinjs-lib for network-specific validation
- Hash validation ensures hexadecimal format

**Design**:
- Collapsible header with "Search & Filter" label and status badge
- Expand/collapse icon animation
- Individual filter controls with clear buttons
- Active filter pills with orange/bitcoin theme
- Consistent spacing and responsive layout
- Accessible with ARIA labels and keyboard navigation

---

### Pagination.tsx (ENHANCED v0.12.0)

**Purpose**: Reusable pagination controls for lists (transactions, addresses, contacts).

**Location**: `/src/tab/components/shared/Pagination.tsx`

**Props**:
```typescript
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemType: 'transactions' | 'addresses' | 'contacts';
}
```

**Usage**:
```tsx
<Pagination
  totalItems={filteredTransactions.length}
  itemsPerPage={transactionItemsPerPage}
  currentPage={transactionCurrentPage}
  onPageChange={setTransactionCurrentPage}
  onItemsPerPageChange={setTransactionItemsPerPage}
  itemType="transactions"
/>
```

**Features**:
- **Items Per Page Selector**: Dropdown with options [10, 35, 50, 100, 500]
- **Page Navigation**: Previous/Next buttons with disabled states
- **Page Number Buttons**: Smart pagination (shows first, last, current, and surrounding pages)
- **Status Text**: "Showing X-Y of Z items"
- **Auto-hide**: Hides when totalPages <= 1
- **Responsive**: Mobile-friendly layout with icon-only buttons on small screens
- **Auto-reset**: Resets to page 1 when items per page changes

**Design**:
- Consistent styling with border and hover states
- Disabled state with reduced opacity and not-allowed cursor
- Current page highlighted with bitcoin theme color
- Ellipsis (...) for skipped page ranges
- Accessible with ARIA labels and keyboard navigation

---

## Screen Components

Location: `/src/tab/components/`

### Dashboard.tsx

**Purpose**: Main wallet view showing balance, accounts, and transactions.

**Key Features**:
1. **Account Switcher Dropdown**:
   - Displays current account with balance
   - Dropdown menu with all accounts
   - Three action buttons: Create, Import, Multisig
   - Account badges for imported accounts

2. **Balance Display**:
   - Large BTC amount
   - USD equivalent below (if price available)
   - Visual balance chart
   - Refresh button

3. **Quick Actions**:
   - Send (opens SendModal)
   - Receive (opens ReceiveModal)
   - Buy/Sell (future)

4. **Transaction History**:
   - Chronological list of transactions
   - Type icons (sent/received)
   - Amounts with USD values
   - Confirmation badges
   - Click to expand details

5. **Address Management**:
   - List of generated addresses
   - External/internal indicators
   - Used/unused badges
   - Copy buttons
   - Generate new address

**Props**:
```typescript
interface DashboardProps {
  account: Account;
  balance: number;
  transactions: Transaction[];
  onSend: () => void;
  onReceive: () => void;
  onSwitchAccount: (index: number) => void;
  onCreateAccount: () => void;
  onImportAccount: () => void;
  onCreateMultisig: () => void;
}
```

**State Management**:
- Uses `useWallet()` hook for global state
- Uses `useBitcoinPrice()` for USD conversion
- Uses `useBalanceUpdater()` for auto-refresh
- Uses `useTransactionHistory()` for transaction list

**Design Patterns**:
- Dropdown panel (account switcher)
- Action button grid
- Transaction list with expand/collapse
- Address list with copy buttons

---

### SendScreen.tsx

**Purpose**: Send Bitcoin transaction form with fee selection.

**Key Features**:
1. **Recipient Input**:
   - Bitcoin address validation
   - Contact picker integration
   - QR code scanner (future)
   - Address format detection

2. **Amount Input**:
   - BTC or Satoshi units
   - USD equivalent display
   - "Send Max" button
   - Available balance indicator

3. **Fee Selection**:
   - Three presets: Slow, Medium, Fast
   - Fee in satoshis and USD
   - Estimated confirmation time
   - Custom fee option (advanced)

4. **Transaction Summary**:
   - Amount to send
   - Network fee
   - Total amount
   - Recipient address verification
   - Final confirmation button

5. **Success/Error States**:
   - Success: TXID with block explorer link
   - Error: Descriptive error message
   - Loading: Broadcast in progress

**Props**:
```typescript
interface SendScreenProps {
  account: Account;
  balance: number;
  onSendComplete: (txid: string) => void;
  onCancel?: () => void;
  isModal?: boolean; // Different layout for modal vs tab
}
```

**Conditional Rendering** (Modal vs Tab):
```typescript
// Outer wrapper - remove dark background in modal mode
<div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>

  // Header - hide in modal mode (modal has its own title)
  {!isModal && (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <h1>Send Bitcoin</h1>
    </div>
  )}

  // Main content - different spacing for modal vs tab
  <div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
    {/* Form content */}
  </div>
</div>
```

**Validation**:
- Address format validation (BIP173 for bech32, base58 for legacy)
- Amount validation (> 0, <= available balance - fee)
- Dust limit check (546 satoshis minimum)
- Fee reasonableness check (< 10% of amount)

**Contact Integration**:
- Recent contacts dropdown
- Search/filter contacts
- Add contact from send flow
- Contact metadata (label, notes)

---

### ReceiveScreen.tsx

**Purpose**: Display receive address with QR code.

**Key Features**:
1. **Address Display**:
   - Current receive address
   - Address type indicator (legacy/segwit/native)
   - Copy button with success feedback
   - QR code toggle

2. **QR Code**:
   - Large scannable QR code
   - Bitcoin orange border with glow
   - WHITE background (critical for scannability)
   - BIP21 URI format (bitcoin:address?amount=...)

3. **Address Management**:
   - Generate new address button
   - Address reuse warning
   - External/internal indicator
   - Used/unused status

4. **Amount Request** (optional):
   - Add amount to QR code
   - Add label/message
   - Generate payment URI

**Props**:
```typescript
interface ReceiveScreenProps {
  account: Account;
  currentAddress: string;
  onGenerateNew: () => void;
  onCopy: () => void;
  isModal?: boolean; // Different layout for modal vs tab
}
```

**QR Code Implementation**:
```tsx
<div className="bg-white p-4 rounded-xl border-2 border-bitcoin-light shadow-glow-bitcoin">
  <QRCode
    value={`bitcoin:${address}${amount ? `?amount=${amount}` : ''}`}
    size={256}
    level="M"
    includeMargin
  />
</div>
```

**Address Reuse Warning**:
- Shows amber warning if address already used
- Educates user on privacy implications
- Recommends generating new address
- One-click generate button

---

### ContactsScreen.tsx

**Purpose**: Manage Bitcoin contacts (address book).

**Key Features**:
1. **Contact List**:
   - Grid or list view
   - Search/filter
   - Sort by name/date
   - Add contact button

2. **Contact Cards**:
   - Name and label
   - Truncated address
   - Edit/delete actions
   - Click to view details

3. **Add/Edit Modal**:
   - Name input (required)
   - Address input with validation
   - Label/notes (optional)
   - Save/cancel buttons

4. **Contact Details**:
   - Full address with copy button
   - QR code
   - Transaction history with contact
   - Edit/delete actions

5. **Import/Export**:
   - CSV import
   - CSV export
   - Backup contacts

**Props**:
```typescript
interface ContactsScreenProps {
  contacts: Contact[];
  onAdd: (contact: Contact) => void;
  onEdit: (id: string, contact: Contact) => void;
  onDelete: (id: string) => void;
  onSelect?: (contact: Contact) => void; // For send flow
}
```

**Contact Data Structure**:
```typescript
interface Contact {
  id: string;
  name: string;
  address: string;
  label?: string;
  notes?: string;
  createdAt: number;
  lastUsed?: number;
}
```

**CSV Export Format**:
```csv
Name,Address,Label,Notes
Alice,tb1q...,Friend,Birthday gift
Bob,2N...,Business,Monthly payment
```

---

### SettingsScreen.tsx

**Purpose**: Wallet settings and preferences.

**Key Features**:
1. **General Settings**:
   - Network (testnet/mainnet) - display only for MVP
   - Currency (USD/EUR/etc.) - future
   - Theme (dark/light) - placeholder for MVP
   - Language - future

2. **Security Settings**:
   - Auto-lock timeout (5/15/30/60 minutes)
   - Change password
   - Show seed phrase (with password confirmation)
   - Export seed phrase
   - Clear wallet data (danger zone)

3. **Account Management**:
   - List all accounts
   - Create new account
   - Import account (private key/seed)
   - Export account keys
   - Delete account (with confirmation)

4. **Advanced Settings**:
   - Custom fee rates
   - Coin control
   - Transaction builder
   - Developer mode

5. **About**:
   - Version number
   - License
   - Links (docs, GitHub, support)

**Props**:
```typescript
interface SettingsScreenProps {
  settings: Settings;
  accounts: Account[];
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onExportSeed: () => void;
  onClearWallet: () => void;
}
```

**Settings Data Structure**:
```typescript
interface Settings {
  network: 'testnet' | 'mainnet';
  currency: 'USD' | 'EUR' | 'GBP';
  theme: 'dark' | 'light';
  autoLockTimeout: number; // minutes
  showBalanceInUSD: boolean;
  customFeeRates: boolean;
  developerMode: boolean;
}
```

---

## Account Management Components

Location: `/src/tab/components/AccountManagement/`

### AccountCreationModal.tsx

**Purpose**: Create new HD-derived account.

**Key Features**:
- Account name input
- Address type selection (reuse parent wallet's type or choose)
- Derivation path display (educational)
- BIP44/49/84 explanation
- Create button

**Props**:
```typescript
interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAccount: (name: string, addressType: AddressType) => Promise<void>;
  nextAccountIndex: number;
}
```

**Derivation Path Info**:
```tsx
<div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
  <p className="text-xs text-gray-400 mb-1">Derivation Path:</p>
  <code className="text-xs text-bitcoin-light font-mono">
    m/{purpose}'/1'/{accountIndex}'/0/0
  </code>
  <p className="text-xs text-gray-400 mt-1">
    Purpose: {purpose === 44 ? 'Legacy (P2PKH)' :
              purpose === 49 ? 'SegWit (P2SH-P2WPKH)' :
              'Native SegWit (P2WPKH)'}
  </p>
</div>
```

---

### ImportAccountModal.tsx

**Purpose**: Import account from private key or seed phrase.

**Key Features**:
- Tab navigation (Private Key / Seed Phrase)
- Security warnings (amber SecurityWarning component)
- Form validation
- Import button
- Success/error feedback

**Props**:
```typescript
interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPrivateKey: (wif: string, name: string) => Promise<void>;
  onImportSeed: (seed: string, name: string, derivationPath: string) => Promise<void>;
}
```

**Tab Structure**:
```tsx
<div className="border-b border-gray-700">
  <button
    className={activeTab === 'privateKey' ? 'border-b-2 border-bitcoin' : ''}
    onClick={() => setActiveTab('privateKey')}
  >
    Private Key
  </button>
  <button
    className={activeTab === 'seed' ? 'border-b-2 border-bitcoin' : ''}
    onClick={() => setActiveTab('seed')}
  >
    Seed Phrase
  </button>
</div>

{activeTab === 'privateKey' && <PrivateKeyImport {...props} />}
{activeTab === 'seed' && <SeedPhraseImport {...props} />}
```

---

### PrivateKeyImport.tsx

**Purpose**: Import account from WIF private key.

**Key Features**:
- WIF input with validation
- Network detection (testnet/mainnet)
- Address type detection
- Account name input
- Import button
- Security warning

**Props**:
```typescript
interface PrivateKeyImportProps {
  onImport: (wif: string, name: string) => Promise<void>;
}
```

**WIF Validation**:
```typescript
function validateWIF(wif: string): {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  compressed?: boolean;
  error?: string;
} {
  try {
    const decoded = bitcoin.ECPair.fromWIF(wif);
    const network = wif.startsWith('c') || wif.startsWith('9')
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;
    return { valid: true, network, compressed: decoded.compressed };
  } catch (error) {
    return { valid: false, error: 'Invalid WIF format' };
  }
}
```

---

### PrivateKeyFileImport.tsx

**Purpose**: Import encrypted private key from .enc file.

**Key Features**:
- File upload (drag & drop or click)
- Password input
- Decryption
- Account name input
- Import button

**Props**:
```typescript
interface PrivateKeyFileImportProps {
  onImport: (encryptedData: string, password: string, name: string) => Promise<void>;
}
```

**File Format**:
```json
{
  "version": 1,
  "type": "encrypted-private-key",
  "encryptedData": "...",
  "salt": "...",
  "iv": "...",
  "metadata": {
    "accountName": "Account 1",
    "addressType": "native-segwit",
    "timestamp": "2025-10-19T12:00:00.000Z"
  }
}
```

---

### ExportPrivateKeyModal.tsx

**Implementation Date**: October 19, 2025
**Location**: `/src/tab/components/ExportPrivateKeyModal.tsx`
**Utility Module**: `/src/tab/utils/fileDownload.ts`

**Purpose**: Securely export private keys from single-signature accounts with two modes: encrypted file (recommended) or plain text (dangerous).

**Key Features**:

1. **Two Export Modes**:
   - **Encrypted File (Recommended)**: Password-protected .enc file with JSON structure
   - **Plain Text (Dangerous)**: Display WIF with copy/download options

2. **Security Features**:
   - Prominent security warnings (amber SecurityWarning component)
   - Red danger warnings for plain text mode
   - Risk acknowledgment checkbox before revealing plain text
   - Password strength indicator (weak/medium/strong)
   - Auto-clears sensitive data on modal close
   - Only works with single-signature accounts (rejects multisig)

3. **Password Strength Validation**:
   ```typescript
   const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
     if (password.length < 8) return 'weak';

     const hasUpper = /[A-Z]/.test(password);
     const hasLower = /[a-z]/.test(password);
     const hasNumber = /[0-9]/.test(password);
     const hasSpecial = /[^A-Za-z0-9]/.test(password);

     const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

     if (password.length >= 12 && criteriaCount >= 3) return 'strong';
     if (password.length >= 8 && criteriaCount >= 2) return 'medium';
     return 'weak';
   };
   ```

4. **File Download Utilities** (`fileDownload.ts`):
   - `downloadEncryptedKey()` - Creates .enc file with JSON structure
   - `downloadPlainKey()` - Creates .txt file with comments and WIF
   - `generateSafeFilename()` - Sanitizes account name for filename

5. **Encrypted File Format** (.enc):
   ```json
   {
     "version": 1,
     "type": "encrypted-private-key",
     "encryptedData": "...",
     "salt": "...",
     "iv": "...",
     "metadata": {
       "accountName": "Account 1",
       "addressType": "native-segwit",
       "timestamp": "2025-10-19T12:00:00.000Z"
     }
   }
   ```

6. **Plain Text File Format** (.txt):
   ```
   # Bitcoin Wallet Private Key Export
   # WARNING: This file contains your private key in plain text
   # Anyone with access to this file can steal your Bitcoin
   # Store it securely and never share it with anyone
   #
   # Account Name: Account 1
   # Address Type: Native SegWit (P2WPKH)
   # Export Date: 2025-10-19T12:00:00.000Z
   # Network: Testnet
   #
   # Private Key (WIF):
   cT1qZ...
   ```

**Props Interface**:
```typescript
interface ExportPrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountIndex: number;
  accountName: string;
  firstAddress: string;
  addressType: 'legacy' | 'segwit' | 'native-segwit';
}
```

**Backend Integration**:
Uses `EXPORT_PRIVATE_KEY` message type:
```typescript
const response = await sendMessage<{
  wif: string;
  encrypted?: boolean;
  encryptedData?: string;
  salt?: string;
  iv?: string;
  metadata: { accountName: string; addressType: string; timestamp: string };
}>({
  type: MessageType.EXPORT_PRIVATE_KEY,
  payload: { accountIndex, password? } // password optional for plain text
});
```

**UX Flow**:

*Encrypted Export*:
1. User selects "Encrypted File" radio option (pre-selected)
2. Enters encryption password (min 8 chars, strength indicator shown)
3. Confirms password (validation for match)
4. Clicks "Export Encrypted File" button
5. File downloads as `{account-name}-private-key-{date}.enc`
6. Modal closes on success

*Plain Text Export*:
1. User selects "Plain Text" radio option
2. Red danger warning appears
3. User checks "I understand the risks" checkbox
4. Clicks "Show Private Key" button (enabled after checkbox)
5. WIF displays in code block with copy button
6. User can copy WIF or download as .txt file
7. Modal stays open (user must manually close)

**Accessibility**:
- Escape key to close modal
- Click outside to close
- Keyboard navigation for radio buttons
- ARIA labels for form fields
- Focus management

**Security Considerations**:
1. **Defense in Depth**:
   - Multiple warnings at different severity levels
   - Checkbox confirmation for dangerous actions
   - Password strength requirements
   - Clear labeling of recommended vs dangerous options

2. **Sensitive Data Handling**:
   - WIF only stored in component state temporarily
   - Cleared on modal close via useEffect cleanup
   - Never persisted to storage or logged

3. **User Education**:
   - Security warnings explain WHY not just WHAT
   - Recommended/Dangerous badges provide quick visual cues
   - Account info display helps verify correct account

4. **File Security**:
   - Encrypted files use proper JSON structure for future compatibility
   - Plain text files include warnings in comments
   - Filenames include date for organization

---

## Modal Components

Location: `/src/tab/components/modals/`

### SendModal.tsx

**Purpose**: Modal wrapper for SendScreen component.

**Key Features**:
- Modal title and close button
- Wraps SendScreen with `isModal={true}` prop
- Portal rendering for proper layering
- Backdrop click to close
- Escape key to close

**Props**:
```typescript
interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  balance: number;
  onSendComplete: (txid: string) => void;
}
```

**Modal Structure**:
```tsx
<Modal isOpen={isOpen} onClose={onClose}>
  {/* Modal title section */}
  <div className="px-6 pt-6 pb-4 border-b border-gray-700">
    <h2 className="text-xl font-semibold text-white">Send Bitcoin</h2>
    <button onClick={onClose} className="absolute top-6 right-6">
      <XIcon className="w-5 h-5 text-gray-400 hover:text-white" />
    </button>
  </div>

  {/* SendScreen component */}
  <div className="px-6 pb-6">
    <SendScreen
      isModal={true}
      account={account}
      balance={balance}
      onSendComplete={onSendComplete}
      onCancel={onClose}
    />
  </div>
</Modal>
```

---

### ReceiveModal.tsx

**Purpose**: Modal wrapper for ReceiveScreen component.

**Key Features**:
- Modal title and close button
- Wraps ReceiveScreen with `isModal={true}` prop
- Portal rendering for proper layering
- Backdrop click to close
- Escape key to close

**Props**:
```typescript
interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: Account;
  currentAddress: string;
  onGenerateNew: () => void;
}
```

---

## Multisig Wallet Components

Location: `/src/tab/components/MultisigSetup/`

### ConfigSelector.tsx

**Purpose**: Interactive configuration selection for choosing between 2-of-2, 2-of-3, and 3-of-5 multisig setups.

**Key Features**:
1. **Visual Card Layout** - Each configuration displayed as selectable card with radio button
2. **Risk Level Indicators** - Color-coded badges showing risk (high/low/very-low)
3. **Educational Content** - Comprehensive descriptions, use cases, and examples
4. **Expandable Sections** - "Learn more" toggle to show additional details
5. **Recommended Option** - 2-of-3 highlighted with star badge
6. **Interactive Selection** - Click anywhere on card to select, visual feedback on selection
7. **Continue Button** - Disabled until selection made, enables user to proceed

**Props Interface**:
```typescript
interface ConfigSelectorProps {
  selectedConfig?: MultisigConfig;      // Currently selected configuration
  onSelect: (config: MultisigConfig) => void;  // Callback when config selected
  onContinue: () => void;                // Callback when Continue button clicked
  showContinueButton?: boolean;          // Whether to show Continue button (default: true)
}
```

**Usage Example**:
```typescript
import { ConfigSelector } from './components/MultisigSetup/ConfigSelector';

function MultisigSetupScreen() {
  const [config, setConfig] = useState<MultisigConfig>();

  const handleConfigSelect = (selected: MultisigConfig) => {
    setConfig(selected);
  };

  const handleContinue = () => {
    // Proceed to next step with selected config
    navigateToNextStep(config);
  };

  return (
    <ConfigSelector
      selectedConfig={config}
      onSelect={handleConfigSelect}
      onContinue={handleContinue}
      showContinueButton={true}
    />
  );
}
```

**Visual Design Patterns**:

**Card Selection States**:
```typescript
// Selected state
className="border-blue-500 bg-blue-50"

// Unselected state
className="border-gray-300 hover:border-gray-400 bg-white"

// Radio button visual (selected)
<div className="w-6 h-6 rounded-full border-2 border-blue-600 bg-blue-600">
  <div className="w-2 h-2 rounded-full bg-white" />
</div>

// Radio button visual (unselected)
<div className="w-6 h-6 rounded-full border-2 border-gray-300" />
```

**Risk Level Color System**:
```typescript
const getRiskColor = (riskLevel: 'high' | 'low' | 'very-low'): string => {
  switch (riskLevel) {
    case 'high':
      return 'text-red-600 bg-red-100';      // Red for higher risk (2-of-2)
    case 'low':
      return 'text-yellow-600 bg-yellow-100'; // Yellow for low risk (2-of-3)
    case 'very-low':
      return 'text-green-600 bg-green-100';   // Green for very low risk (3-of-5)
  }
};
```

**Recommended Badge**:
```typescript
// Positioned absolutely in top-right corner
<div className="absolute top-0 right-0 -mt-2 -mr-2">
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
    ⭐ Recommended
  </span>
</div>
```

**Expandable Section Pattern**:
```typescript
// Toggle button
<button
  type="button"
  onClick={(e) => {
    e.stopPropagation(); // Prevent card selection when clicking expand
    toggleExpanded(config);
  }}
  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
>
  <span>{isExpanded ? 'Show less' : 'Learn more'}</span>
  <span>{isExpanded ? '▲' : '▼'}</span>
</button>

// Expanded content with border separator
{isExpanded && (
  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
    {/* Additional content */}
  </div>
)}
```

---

## Help Content System

**Location**: `/src/popup/content/multisig-help.ts`

**Purpose**: Centralized educational content for multisig wallets, written in plain language for non-technical users.

**Content Structure**:

**1. MULTISIG_INTRO** - General explanation and benefits
```typescript
export const MULTISIG_INTRO = {
  title: 'What are Multi-Signature Wallets?',
  shortDescription: '...',
  analogyTitle: 'Think of it like...',
  analogy: 'A safe deposit box that requires 2 out of 3 keys...',
  benefits: [
    { icon: '🔒', title: 'Enhanced Security', description: '...' },
    { icon: '🤝', title: 'Shared Control', description: '...' },
    { icon: '🛡️', title: 'Backup Protection', description: '...' }
  ],
  whenToUse: [...],
  whenNotToUse: [...]
};
```

**2. MULTISIG_CONFIGS** - Detailed configuration information
```typescript
export const MULTISIG_CONFIGS: Record<MultisigConfig, {
  displayName: string;        // e.g., "2-of-3 Multisig"
  emoji: string;              // Visual icon for config
  tagline: string;            // One-line summary
  description: string;        // What it is
  howItWorks: string;         // Explanation of mechanics
  requiredSignatures: number; // e.g., 2
  totalSigners: number;       // e.g., 3
  riskLevel: 'high' | 'low' | 'very-low';
  riskExplanation: string;    // Why this risk level
  bestFor: string[];          // Use cases
  examples: string[];         // Real-world examples
  warnings: string[];         // Important considerations
  recommendation?: string;    // Why we recommend (for 2-of-3)
}> = {
  '2-of-2': { /* ... */ },
  '2-of-3': { /* ... */ },
  '3-of-5': { /* ... */ }
};
```

**3. ADDRESS_TYPES** - Address format explanations
```typescript
export const ADDRESS_TYPES: Record<MultisigAddressType, {
  displayName: string;        // e.g., "Native SegWit"
  fullName: string;           // Technical name
  description: string;        // Plain language
  prefix: { testnet: string; mainnet: string };
  feeLevel: 'lowest' | 'lower' | 'higher';
  compatibility: 'maximum' | 'good' | 'modern';
  technicalName: string;      // e.g., "P2WSH"
  pros: string[];             // Advantages
  cons: string[];             // Disadvantages
  whenToChoose: string;       // Decision guidance
  recommendation?: boolean;   // True for P2WSH
}>;
```

**4. GLOSSARY** - Key concept definitions
```typescript
export const GLOSSARY = {
  xpub: {
    term: 'Extended Public Key (xpub)',
    shortDefinition: '...',
    fullDefinition: '...',
    whatItLooksLike: 'A long string starting with "tpub"...',
    safe: 'Yes - Safe to share with co-signers',
    neverShare: 'Your seed phrase or private keys'
  },
  // fingerprint, psbt, redeemScript, cosigner, bip48, bip67
};
```

**How to Use Help Content**:

**In Components**:
```typescript
import { MULTISIG_CONFIGS, GLOSSARY, SECURITY_WARNINGS } from '../../content/multisig-help';

// Display config details in UI
const configDetails = MULTISIG_CONFIGS['2-of-3'];

<div>
  <h3>{configDetails.displayName}</h3>
  <p>{configDetails.description}</p>
  <p className="text-gray-600">Risk: {configDetails.riskExplanation}</p>
</div>

// Show glossary tooltip
const xpubInfo = GLOSSARY.xpub;

<Tooltip content={xpubInfo.shortDefinition}>
  <span className="underline cursor-help">What's an xpub?</span>
</Tooltip>

// Display security warning
{SECURITY_WARNINGS.critical.map(warning => (
  <div key={warning.title} className="bg-red-50 border border-red-200 rounded p-3">
    <div className="flex items-start">
      <span className="text-2xl mr-2">{warning.icon}</span>
      <div>
        <p className="font-bold text-red-900">{warning.title}</p>
        <p className="text-red-700 text-sm">{warning.description}</p>
      </div>
    </div>
  </div>
))}
```

---

## Reusable UI Patterns

These patterns extracted from multisig components can be applied to other features:

### 1. Educational Card Layout

- Large clickable cards with radio selection
- Visual hierarchy: icon → title → tagline → description
- Expandable "Learn more" sections for advanced info
- Best for: Feature selection, configuration choices

### 2. Risk/Status Indicator Badges

```typescript
// Reusable badge component pattern
interface BadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info';
  label: string;
  size?: 'sm' | 'md';
}

const Badge: React.FC<BadgeProps> = ({ variant, label, size = 'md' }) => {
  const colors = {
    success: 'text-green-600 bg-green-100',
    warning: 'text-yellow-600 bg-yellow-100',
    error: 'text-red-600 bg-red-100',
    info: 'text-blue-600 bg-blue-100'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  return (
    <span className={`rounded font-medium ${colors[variant]} ${sizes[size]}`}>
      {label}
    </span>
  );
};
```

### 3. Recommended Item Highlight

```typescript
// Absolute positioned badge in top-right of card
<div className="absolute top-0 right-0 -mt-2 -mr-2">
  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-600 text-white">
    ⭐ Recommended
  </span>
</div>
```

### 4. Progressive Disclosure Pattern

```typescript
// Show basic info by default, expand for details
const [expanded, setExpanded] = useState(false);

<div>
  {/* Always visible summary */}
  <div className="summary-content">...</div>

  {/* Expandable details */}
  <button onClick={() => setExpanded(!expanded)}>
    {expanded ? 'Show less' : 'Learn more'} {expanded ? '▲' : '▼'}
  </button>

  {expanded && (
    <div className="mt-4 pt-4 border-t border-gray-200">
      {/* Detailed content */}
    </div>
  )}
</div>
```

### 5. Info Box Pattern

```typescript
// Contextual help boxes with emoji icons
<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
  <div className="flex items-start space-x-3">
    <span className="text-2xl">💡</span>
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-1">
        Helpful tip title
      </p>
      <p className="text-sm text-gray-600">
        Detailed explanation of the tip or recommendation.
      </p>
    </div>
  </div>
</div>
```

### 6. Colored Alert Boxes

```typescript
// Different semantic colors for different alert types
const alertVariants = {
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800'
};

<div className={`border rounded p-3 ${alertVariants[variant]}`}>
  <p className="text-xs font-semibold mb-2">{title}</p>
  <ul className="text-xs space-y-1">
    {items.map((item, idx) => (
      <li key={idx}>{item}</li>
    ))}
  </ul>
</div>
```

---

## Component Documentation Template

Use this template when documenting new components:

```typescript
/**
 * ComponentName
 *
 * Description: What this component does and its primary purpose
 *
 * Props:
 * - propName: type - description of the prop
 * - optionalProp?: type - optional prop description
 *
 * Usage:
 * <ComponentName
 *   requiredProp="value"
 *   optionalProp="value"
 * />
 *
 * State Management:
 * - Describe any local state
 * - Hooks used
 * - Context dependencies
 *
 * Design Patterns:
 * - Notable patterns used
 * - Accessibility considerations
 * - Responsive behavior
 *
 * Notes:
 * - Any special considerations
 * - Known limitations
 * - Future improvements
 */
```

---

## Testing Approach

### Unit Tests

```typescript
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName {...requiredProps} />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('displays error states', () => {
    render(<ComponentName error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('handles loading states', () => {
    render(<ComponentName isLoading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
```

### What to Test

- Component rendering
- User interactions (clicks, inputs)
- State changes
- Error boundaries
- Hooks logic
- Utility functions

### What NOT to Test

- Implementation details
- Third-party libraries
- Trivial components (pure presentational)

---

**Related Documentation**:
- [Architecture](./architecture.md) - Component hierarchy and structure
- [State Management](./state.md) - React Context and hooks
- [Styling System](./styling.md) - Tailwind patterns and design tokens
- [Implementation Decisions](./decisions.md) - Component design choices

---

## WalletSetup Components (v0.11.0 Update)

### ImportPrivateKey.tsx

**Location**: `/src/tab/components/WalletSetup/ImportPrivateKey.tsx`

**Purpose**: Complete wallet restoration from WIF private key during initial setup. This component enables users to import a wallet from a previously exported private key backup file or pasted WIF string.

**New Feature (v0.11.0)**: Third tab in WalletSetup alongside "Create New" and "Import Seed".

**Key Features**:
1. **Dual Input Methods**:
   - File upload (.txt files from wallet exports)
   - Manual WIF paste (direct input)

2. **Real-time WIF Validation**:
   - Format validation (testnet WIF starts with 'c' or '9')
   - Network detection (testnet vs mainnet)
   - Compression detection (compressed vs uncompressed keys)
   - Error feedback with suggestions

3. **Address Type Selection**:
   - Preview all 3 address types (Legacy, SegWit, Native SegWit)
   - Auto-generated address previews using bitcoinjs-lib
   - Intelligent defaults (Native SegWit for compressed, Legacy for uncompressed)
   - Visual radio cards with address previews

4. **Security Features**:
   - Password strength meter
   - Privacy warnings (3-tier system)
   - Mandatory privacy acknowledgment checkbox
   - Clear explanation of non-HD wallet limitations

5. **User Experience**:
   - Segmented control for input method switching
   - Progressive disclosure (show sections as validation passes)
   - Inline validation feedback
   - Account name customization

**Props**:
```typescript
interface ImportPrivateKeyProps {
  onSetupComplete: () => void;
}
```

**Component State**:
```typescript
interface ImportPrivateKeyState {
  // Input method
  inputMethod: 'file' | 'paste';
  
  // WIF data
  pastedWIF: string;
  selectedFile: File | null;
  fileContent: string | null;
  
  // Validation
  wifValidation: WIFValidationResult | null;
  isValidating: boolean;
  
  // Address selection
  selectedAddressType: AddressType | null;
  addressPreviews: {
    legacy: string | null;
    segwit: string | null;
    nativeSegwit: string | null;
  };
  
  // Password
  walletPassword: string;
  confirmPassword: string;
  walletPasswordVisible: boolean;
  confirmPasswordVisible: boolean;
  
  // Account
  accountName: string; // Default: "Imported Account"
  
  // Privacy
  privacyNoticeDismissed: boolean;
  privacyAcknowledged: boolean;
  
  // UI
  isImporting: boolean;
  error: string | null;
  passwordError: string | null;
}
```

**WIF Validation Logic**:
```typescript
const validateWIF = async (wif: string) => {
  // 1. Check format (testnet regex)
  const testnetWIFRegex = /^[c9][a-zA-Z0-9]{51}$/;
  
  // 2. Decode with bitcoinjs-lib
  const bitcoin = await import('bitcoinjs-lib');
  const keyPair = bitcoin.ECPair.fromWIF(wif, bitcoin.networks.testnet);
  
  // 3. Detect compression
  const compressed = keyPair.compressed;
  
  // 4. Generate address previews for all types
  const previews = {
    legacy: bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey }).address,
    segwit: compressed ? bitcoin.payments.p2sh({ ... }).address : null,
    nativeSegwit: compressed ? bitcoin.payments.p2wpkh({ ... }).address : null
  };
  
  // 5. Set validation result
  setWIFValidation({ valid: true, network: 'testnet', compressed });
  setAddressPreviews(previews);
  
  // 6. Auto-select address type
  setSelectedAddressType(compressed ? 'native-segwit' : 'legacy');
};
```

**Address Type Cards**:
- **Legacy (P2PKH)**: Always available
  - Prefix: "m or n" (testnet)
  - Use case: Uncompressed keys or user preference
  
- **SegWit (P2SH-P2WPKH)**: Compressed keys only
  - Prefix: "2" (testnet)
  - Disabled for uncompressed keys
  
- **Native SegWit (P2WPKH)**: Compressed keys only (Recommended)
  - Prefix: "tb1" (testnet)
  - Highlighted as recommended
  - Disabled for uncompressed keys

**Privacy Warning System**:

1. **Dismissible Info Banner** (Blue):
   - Appears after address selection
   - Can be dismissed by user
   - Explains non-HD wallet limitations

2. **Mandatory Acknowledgment** (Yellow):
   - Cannot be bypassed
   - Checkbox required before import
   - Lists specific privacy implications:
     - All transactions publicly linked
     - Balance visible to anyone
     - Privacy significantly reduced
   - Alternative action: "Create Seed Phrase Wallet" button

**Password Validation**:
```typescript
const validatePassword = (pwd: string): boolean => {
  if (pwd.length < 8) return false;
  if (!/[A-Z]/.test(pwd)) return false;
  if (!/[a-z]/.test(pwd)) return false;
  if (!/[0-9]/.test(pwd)) return false;
  return true;
};
```

**Password Strength Indicator**:
- Weak (Red): Score <= 2
- Medium (Yellow): Score 3-4
- Strong (Green): Score >= 5

**Import Flow**:
```typescript
const handleImportWallet = async () => {
  // 1. Validate all inputs
  if (!pastedWIF || !wifValidation?.valid) throw Error
  if (!selectedAddressType) throw Error
  if (!validatePassword(walletPassword)) throw Error
  if (walletPassword !== confirmPassword) throw Error
  if (!privacyAcknowledged) throw Error
  
  // 2. Call backend handler
  await sendMessage(MessageType.CREATE_WALLET_FROM_PRIVATE_KEY, {
    wif: pastedWIF.trim(),
    addressType: selectedAddressType,
    password: walletPassword,
    accountName: accountName.trim()
  });
  
  // 3. Success - redirect to unlock
  onSetupComplete();
};
```

**Error Handling**:
- Invalid WIF format → "Invalid WIF format. Testnet WIF keys start with 'c' or '9'"
- Network mismatch → "Wrong network: This is a mainnet key, testnet required"
- Weak password → "Password must be at least 8 characters"
- Passwords don't match → "Passwords do not match"
- No privacy acknowledgment → "Please acknowledge the privacy implications"
- Rate limit exceeded → Backend error message displayed
- Wallet already exists → "Wallet already exists. Please delete the existing wallet first."

**File Upload Support**:
- Accepts `.txt` files
- Max size: 100KB
- Parses exported file format
- Extracts WIF from structured export:
  ```
  Private Key (WIF): cT1Y2Y...
  ```

**Accessibility**:
- WCAG AA compliant
- Keyboard navigation support
- Screen reader friendly
- ARIA labels on all form elements
- Clear focus indicators

**Integration with Backend**:
- Message type: `CREATE_WALLET_FROM_PRIVATE_KEY`
- Payload: `{ wif, addressType, password, accountName }`
- Response: `{ account, firstAddress }`
- Error codes handled:
  - `RATE_LIMIT_EXCEEDED`
  - `INVALID_WIF_FORMAT`
  - `WRONG_NETWORK`
  - `VALIDATION_FAILED`
  - `IMPORT_FAILED`

**Visual Design**:
- Follows existing WalletSetup design patterns
- Consistent with Create/Import tabs
- Tailwind CSS utility classes
- Bitcoin orange (#F7931A) for primary actions
- Yellow warnings for privacy notices
- Green validation feedback
- Red error states

**User Journey**:
1. User selects "Import Private Key" tab
2. Chooses input method (File or Paste)
3. Provides WIF (upload or paste)
4. System validates and shows address previews
5. User selects matching address type
6. Sets wallet password (with strength meter)
7. Optionally customizes account name
8. Reads privacy warnings
9. Acknowledges privacy implications (checkbox)
10. Clicks "Import Wallet"
11. Success → Redirects to unlock screen

**Known Limitations**:
- Non-HD wallet (single address, no derivation)
- Address reuse privacy concern
- No change addresses
- Cannot generate new addresses from same key
- Recommended for recovery only, not primary usage

**Testing Considerations**:
- Test with both compressed and uncompressed keys
- Verify all 3 address types generate correctly
- Test file upload with various formats
- Verify privacy acknowledgment is required
- Test password validation rules
- Verify network detection (reject mainnet on testnet wallet)
- Test rate limiting (3 attempts per 15 min)

---

### WalletSetup.tsx Updates (v0.11.0)

**Changes Made**:

1. **Added Third Tab**:
   ```typescript
   type SetupTab = 'create' | 'import' | 'import-key'; // Added 'import-key'
   ```

2. **Tab Navigation**:
   - "Create New" - Creates new HD wallet with seed phrase
   - "Import Seed" - Imports existing HD wallet from BIP39 mnemonic
   - "Import Private Key" - NEW: Imports non-HD wallet from WIF

3. **Component Import**:
   ```typescript
   import ImportPrivateKey from './WalletSetup/ImportPrivateKey';
   ```

4. **Conditional Rendering**:
   ```tsx
   {activeTab === 'import-key' && (
     <ImportPrivateKey onSetupComplete={onSetupComplete} />
   )}
   ```

**Tab Layout**:
- Equal-width tabs (flex-1)
- Active tab: Orange underline (border-bitcoin)
- Hover state: Lighter text color
- Click handler: Resets errors and switches tab

---

## Implementation Summary

**Files Created**:
- `/src/tab/components/WalletSetup/ImportPrivateKey.tsx` (850+ lines)

**Files Modified**:
- `/src/tab/components/WalletSetup.tsx`:
  - Added third tab type
  - Added ImportPrivateKey import
  - Added tab button UI
  - Added conditional rendering

**Backend Integration**:
- Uses existing `CREATE_WALLET_FROM_PRIVATE_KEY` handler
- No backend changes required (already implemented)
- Message type already defined in types

**Dependencies Used**:
- `bitcoinjs-lib` - WIF validation and address generation
- `useBackgroundMessaging` hook - Message passing
- `MessageType`, `AddressType` from shared types

**Build Status**: ✅ Successful (webpack 5.102.1)

**Estimated LOC**: ~850 lines of TypeScript/React

**Design Spec Reference**: 
- `prompts/docs/plans/WALLET_RESTORE_UX_DESIGN_SPEC.md`
- `prompts/docs/plans/WALLET_RESTORE_FRONTEND_PLAN.md`

---

**END OF COMPONENTS UPDATE (v0.11.0)**

## Privacy Components (v0.12.0)

**Added**: October 30, 2025
**Feature**: Privacy Mode Toggle - Balance Concealment

### Overview

Privacy mode allows users to conceal sensitive financial information (balances, transaction amounts) for:
- Screen privacy (shoulder surfing protection)
- Public use (displaying wallet in public without revealing amounts)
- Screenshots/screen recordings

**Implementation Strategy**:
- Global context for privacy state
- Reusable balance component with click-to-toggle
- Settings toggle switch
- Storage persistence across tabs

---

### PrivacyContext

**File**: `/src/tab/contexts/PrivacyContext.tsx`

**Purpose**: Global privacy state management with storage persistence and cross-tab sync.

**API**:
```typescript
interface PrivacyContextType {
  balancesHidden: boolean;       // Current privacy state
  togglePrivacy: () => void;     // Toggle privacy on/off
  setBalancesHidden: (hidden: boolean) => void; // Set explicit state
}

// Usage
const { balancesHidden, togglePrivacy, setBalancesHidden } = usePrivacy();
```

**Storage**:
- Key: `privacy_settings`
- Value: `{ balancesHidden: boolean }`
- Default: `balancesHidden: false` (balances visible)
- Syncs across tabs via `chrome.storage.onChanged`

**Features**:
- Initializes from storage on mount
- Auto-saves on state change
- Listens for storage changes from other tabs
- Provides hook for easy consumption

**Example**:
```tsx
import { usePrivacy } from '../contexts/PrivacyContext';

const MyComponent = () => {
  const { balancesHidden, togglePrivacy } = usePrivacy();
  
  return (
    <div>
      {balancesHidden ? '••••• BTC' : '1.23456789 BTC'}
      <button onClick={togglePrivacy}>Toggle Privacy</button>
    </div>
  );
};
```

---

### PrivacyBalance Component

**File**: `/src/tab/components/shared/PrivacyBalance.tsx`

**Purpose**: Reusable component for displaying balances with privacy support and click-to-toggle.

**Props**:
```typescript
interface PrivacyBalanceProps {
  amount: number;          // Amount in BTC
  usdValue?: number;      // Optional USD equivalent
  showCurrency?: boolean; // Show "BTC" suffix (default: true)
  showUsd?: boolean;      // Show USD value (default: false)
  size?: 'sm' | 'md' | 'lg'; // Font size variant
  clickable?: boolean;    // Allow click-to-toggle (default: true)
  className?: string;     // Additional Tailwind classes
}
```

**Behavior**:
- **When hidden**: Shows "••••• BTC" (5 bullets) with crossed-eye icon
- **When visible**: Shows actual amount formatted to 8 decimals
- **Click-to-toggle**: When `clickable={true}`, clicking toggles privacy globally
- **Keyboard accessible**: Space/Enter to toggle when focused
- **Size variants**: 
  - `sm`: Compact for inline use
  - `md`: Default size for cards/lists
  - `lg`: Large for dashboard balance display
- **Smooth transition**: 200ms fade on state change

**Usage Examples**:
```tsx
// Dashboard main balance (large, clickable, with USD)
<PrivacyBalance
  amount={balance.confirmed / 100000000}
  usdValue={btcPrice * (balance.confirmed / 100000000)}
  showUsd={true}
  size="lg"
  clickable={true}
/>

// Transaction amount (medium, read-only)
<PrivacyBalance
  amount={0.00123456}
  size="md"
  clickable={false}
/>

// Small inline balance
<PrivacyBalance
  amount={0.5}
  size="sm"
  showCurrency={false}
/>
```

**Accessibility**:
- ARIA label: Describes current state and action
  - Hidden: "Balance hidden for privacy. Click to show."
  - Visible: "Balance: 1.23456789 Bitcoin, approximately $35,000. Click to hide."
- Keyboard support: Tab to focus, Space/Enter to toggle
- Role: `button` when clickable, `text` when read-only

**Visual Design**:
- **Hidden state**: Crossed-eye icon + "••••• BTC"
- **Hover**: Opacity 0.8 when clickable
- **Icon size**: Scales with text size variant
- **Color**: Maintains parent text color (white/gray)

---

### Privacy Section in Settings

**File**: `/src/tab/components/SettingsScreen.tsx`

**Location**: After Security section, before About section

**UI Structure**:
```
## Privacy

[Toggle Switch] Hide Balances
Conceal financial information for screen privacy

[Info Icon] Click any balance to quickly toggle privacy mode
```

**Implementation**:
```tsx
const { balancesHidden, togglePrivacy } = usePrivacy();

<div className="bg-gray-850 border border-gray-700 rounded-xl p-6">
  <h2>Privacy</h2>
  
  {/* Toggle Switch */}
  <div className="flex items-center justify-between">
    <div>
      <p>Hide Balances</p>
      {balancesHidden && <EyeOffIcon />}
      <p className="text-sm">Conceal financial information</p>
    </div>
    <button
      onClick={togglePrivacy}
      role="switch"
      aria-checked={balancesHidden}
      className={balancesHidden ? 'bg-bitcoin' : 'bg-gray-700'}
    >
      <span className={balancesHidden ? 'translate-x-6' : 'translate-x-1'} />
    </button>
  </div>
  
  {/* Info Box */}
  <div className="bg-blue-500/10">
    <p>Click any balance to quickly toggle privacy mode</p>
  </div>
</div>
```

**Toggle Switch Design**:
- Width: 44px (11 Tailwind units)
- Height: 24px (6 Tailwind units)
- Background: Gray when off, Bitcoin orange when on
- Thumb: 16px white circle
- Transitions: All properties 200ms
- Focus ring: 2px Bitcoin orange

---

### TransactionRow Privacy Integration

**File**: `/src/tab/components/shared/TransactionRow.tsx`

**Changes**:
```tsx
// Import hook
import { usePrivacy } from '../../contexts/PrivacyContext';

// Use in component
const { balancesHidden } = usePrivacy();

// Amount display
<p className={transactionType === 'receive' ? 'text-green-500' : 'text-red-500'}>
  {transactionType === 'receive' ? '+' : '-'}
  {balancesHidden ? '••••• BTC' : `${formatBTC(Math.abs(transaction.value))} BTC`}
</p>

// USD display
{btcPrice !== null && (
  <p className="text-xs text-gray-500">
    {balancesHidden ? '$ •••••' : `≈ ${formatSatoshisAsUSD(Math.abs(transaction.value), btcPrice)}`}
  </p>
)}
```

**Behavior**:
- Respects global privacy state
- Maintains color coding (green/red) even when hidden
- Shows "••••• BTC" and "$ •••••" when hidden
- No click-to-toggle (controlled via settings or dashboard balance)

---

### Dashboard Integration

**File**: `/src/tab/components/Dashboard.tsx`

**Changes**:
```tsx
// Import component
import { PrivacyBalance } from './shared/PrivacyBalance';

// Replace balance display
<PrivacyBalance
  amount={balance.confirmed / 100000000}
  usdValue={btcPrice !== null ? (balance.confirmed / 100000000) * btcPrice : undefined}
  showUsd={btcPrice !== null}
  size="lg"
  clickable={true}
  className="mb-1"
/>
```

**Location**: Main balance card (top of dashboard)

**Features**:
- Large clickable balance display
- USD value shown when price available
- Click toggles privacy globally
- Smooth animation on toggle

---

## Files Created

1. `/src/tab/contexts/PrivacyContext.tsx` (~175 lines)
   - Context provider
   - Storage integration
   - Cross-tab sync
   - Hook export

2. `/src/tab/components/shared/PrivacyBalance.tsx` (~180 lines)
   - Reusable balance component
   - Size variants
   - Click-to-toggle
   - Accessibility

## Files Modified

3. `/src/tab/index.tsx`
   - Added PrivacyProvider wrapper
   - Wraps entire App component

4. `/src/tab/components/SettingsScreen.tsx`
   - Added Privacy section
   - Toggle switch UI
   - Info box with quick toggle hint

5. `/src/tab/components/Dashboard.tsx`
   - Replaced balance display with PrivacyBalance
   - Imported component

6. `/src/tab/components/shared/TransactionRow.tsx`
   - Added usePrivacy hook
   - Conditional display for amounts
   - Maintains color coding

---

## Testing Checklist

Manual testing performed:
- [x] Toggle in Settings updates Dashboard balance
- [x] Click balance in Dashboard toggles privacy
- [x] Privacy state persists on page reload
- [x] Privacy state syncs across tabs
- [x] Transaction amounts respect privacy state
- [x] Keyboard navigation works (Tab, Space, Enter)
- [x] ARIA labels read correctly
- [x] Smooth transitions on toggle
- [x] Color coding maintained when hidden
- [x] Build completes without errors
- [x] TypeScript compiles without new errors

---

## Design Reference

Spec: `prompts/docs/experts/product/features.md` (lines 942-1040)

---

**END OF PRIVACY COMPONENTS (v0.12.0)**
