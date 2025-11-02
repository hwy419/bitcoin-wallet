# Backend Developer Notes

**Last Updated**: 2025-10-18
**Phase**: Phase 6 - Tab-Based Architecture Migration Complete
**Owner**: Backend Developer

## Overview

This document tracks all implementation decisions, patterns, and technical details for the Bitcoin Wallet Chrome Extension background service worker. The backend is responsible for all Bitcoin operations, key management, API integration, and serves as the source of truth for wallet state.

**MAJOR ARCHITECTURAL CHANGE**: As of v0.9.0, the extension has migrated from a popup-based UI (600x400px) to a full tab-based architecture. This change significantly impacts how the background service worker communicates with the frontend and how tabs are managed.

## Table of Contents

1. [Tab-Based Architecture Overview](#tab-based-architecture-overview)
2. [Service Worker Architecture](#service-worker-architecture)
3. [Tab Lifecycle Management](#tab-lifecycle-management)
4. [Message Handler Implementation](#message-handler-implementation)
5. [Single Tab Enforcement System](#single-tab-enforcement-system)
6. [In-Memory State Management](#in-memory-state-management)
7. [HD Wallet Integration](#hd-wallet-integration)
8. [Storage Patterns](#storage-patterns)
9. [Auto-Lock Implementation](#auto-lock-implementation)
10. [Security Considerations](#security-considerations)
11. [API Integration (Future)](#api-integration-future)
12. [Known Issues & Technical Debt](#known-issues--technical-debt)
13. [Implementation Decisions Log](#implementation-decisions-log)

---

## Tab-Based Architecture Overview

### Migration from Popup to Tab

**Previous Architecture (v0.8.0 and earlier)**:
- Extension used Chrome action popup (600x400px fixed dimensions)
- Popup opened on extension icon click
- `manifest.json` had `action.default_popup` pointing to popup.html
- Communication: `chrome.runtime.sendMessage()` from popup to background

**Current Architecture (v0.9.0+)**:
- Extension uses full browser tabs
- Tab opens on extension icon click via `chrome.action.onClicked` listener
- `manifest.json` has NO `default_popup` - only `action.default_icon`
- Communication: `chrome.runtime.sendMessage()` from tab to background (same API, different context)

### Why Tab-Based Architecture?

**Benefits**:
1. **Better UX**: Full viewport instead of cramped 600x400 popup
2. **Persistent State**: Tabs don't close when clicking outside (unlike popups)
3. **Multi-screen Support**: Easier multisig workflows with more space
4. **Better Security Controls**: Can implement tab session management and single-tab enforcement
5. **Development Experience**: Easier debugging with standard browser tab

**Trade-offs**:
1. **More Attack Surface**: Tabs are more persistent than popups (mitigated with session tokens)
2. **User Confusion**: Users might open multiple tabs (mitigated with single-tab enforcement)
3. **Tab Management**: Need to track and clean up tabs

### Key Architectural Components

#### 1. Extension Icon Click Handler (`chrome.action.onClicked`)

**Location**: `/src/background/index.ts` (lines 2985-3016)

**Behavior**:
```typescript
chrome.action.onClicked.addListener(async () => {
  // Check if wallet tab already exists
  const walletUrl = chrome.runtime.getURL('index.html');
  const tabs = await chrome.tabs.query({ url: walletUrl });

  if (tabs.length > 0) {
    // Wallet tab exists - focus it
    await chrome.tabs.update(tabs[0].id!, { active: true });
    await chrome.windows.update(tabs[0].windowId!, { focused: true });
  } else {
    // No wallet tab - create new one
    await chrome.tabs.create({ url: walletUrl, active: true });
  }
});
```

**Implementation Details**:
- Uses `chrome.tabs.query()` to find existing wallet tabs
- Prevents duplicate tabs by focusing existing tab
- Brings window to front if tab exists in background window
- Creates new tab only if no wallet tab exists

#### 2. Tab Entry Point

**Files**:
- `/src/tab/index.html` - Tab HTML template
- `/src/tab/index.tsx` - Tab React entry point
- `/src/tab/App.tsx` - Main React application

**Webpack Configuration** (`webpack.config.js`):
```javascript
entry: {
  index: './src/tab/index.tsx',      // Main wallet tab
  background: './src/background/index.ts',
  wizard: './src/wizard/index.tsx',  // Multisig wizard tab
}
```

**Build Output**:
- `dist/index.html` - Main wallet tab HTML
- `dist/index.js` - Bundled React app for main tab
- `dist/background.js` - Service worker
- `dist/wizard.html` / `dist/wizard.js` - Separate multisig wizard

#### 3. Message Passing Pattern (Unchanged API, Different Context)

**From Tab to Background**:
```typescript
// src/tab/hooks/useBackgroundMessaging.ts
const response = await chrome.runtime.sendMessage({
  type: MessageType.UNLOCK_WALLET,
  payload: { password }
});
```

**Background Message Listener**:
```typescript
// src/background/index.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch(error => sendResponse({ success: false, error: error.message }));
  return true; // Required for async
});
```

**Key Difference from Popup**:
- **API is identical**: `chrome.runtime.sendMessage()` works the same
- **Sender context differs**: `sender.tab.id` is available (popup doesn't have tab ID)
- **Tab-to-background messaging**: Background can now send messages back to specific tabs using `chrome.tabs.sendMessage(tabId, message)`

#### 4. Background-to-Tab Messaging (NEW CAPABILITY)

**Why This Matters**:
- Popups couldn't receive messages reliably (they close frequently)
- Tabs are persistent and can be targeted by tab ID
- Enables push notifications from background to tab (e.g., session revocation)

**Example - Session Revocation**:
```typescript
// Background sends message to specific tab
chrome.tabs.sendMessage(activeTabSession.tabId, {
  type: 'SESSION_REVOKED',
  reason: 'Another wallet tab was opened'
});

// Tab listens for messages
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SESSION_REVOKED') {
    handleSessionRevoked(message.reason);
  }
});
```

**Use Cases**:
- Single tab enforcement (revoking sessions when new tab opens)
- Security alerts (tab nabbing detection)
- Lock notifications
- Balance updates (future)

---

## Service Worker Architecture

### Entry Point: src/background/index.ts

The background service worker is the core of our extension, handling all Bitcoin operations and serving as the single source of truth for wallet state.

**Key Responsibilities:**
- Message routing between tab UI and background service worker
- Tab lifecycle management (open, focus, close tracking)
- Single tab session enforcement (security feature)
- HD wallet operations (key derivation, address generation)
- Encrypted storage management
- In-memory sensitive data management
- Auto-lock functionality
- API communication (Blockstream, price service)

**Critical Constraint: Lifecycle Management**

Service workers can terminate at any time. Our architecture accounts for this:

1. **NEVER** store decrypted keys persistently
2. **ALWAYS** encrypt sensitive data before storage
3. Require password re-entry after worker restart
4. Design all operations to handle sudden termination

### Directory Structure

```
src/background/
├── index.ts                    # Main entry point, message router
├── wallet/
│   ├── KeyManager.ts          # BIP39 mnemonic operations
│   ├── HDWallet.ts            # BIP32/BIP44 HD wallet implementation
│   ├── AddressGenerator.ts    # Bitcoin address generation
│   ├── CryptoUtils.ts         # AES-256-GCM encryption/decryption
│   └── WalletStorage.ts       # Chrome storage wrapper
├── bitcoin/                   # (Future) Transaction operations
│   ├── TransactionBuilder.ts
│   ├── FeeEstimator.ts
│   └── Signer.ts
├── api/                       # (Future) Blockstream API client
│   └── BlockstreamClient.ts
└── utils/                     # (Future) Utilities
    ├── validation.ts
    └── errors.ts
```

---

## Tab Lifecycle Management

### Overview

The tab-based architecture requires careful lifecycle management to prevent security issues, resource leaks, and user confusion. The background service worker tracks and manages wallet tabs throughout their lifecycle.

### Tab Opening and Focusing

**Chrome APIs Used**:
- `chrome.action.onClicked` - Listens for extension icon clicks
- `chrome.tabs.query()` - Finds existing wallet tabs
- `chrome.tabs.create()` - Creates new tabs
- `chrome.tabs.update()` - Focuses existing tabs
- `chrome.windows.update()` - Brings window to front

**Implementation**: `/src/background/index.ts` (lines 2985-3016)

**Flow**:
```
User clicks extension icon
  ↓
chrome.action.onClicked fires
  ↓
Query for existing wallet tabs (chrome.tabs.query)
  ↓
If wallet tab exists:
  - Focus the tab (chrome.tabs.update)
  - Bring window to front (chrome.windows.update)
  - Log: "Focused existing wallet tab: {tabId}"
Else:
  - Create new tab (chrome.tabs.create)
  - Tab opens index.html
  - Log: "Created new wallet tab: {tabId}"
```

**Design Rationale**:
- **Single tab preference**: Avoid tab clutter by reusing existing tab
- **Window management**: Brings background windows to front (multi-monitor support)
- **User experience**: Consistent behavior - icon click always shows wallet

### Tab Cleanup on Close

**Chrome APIs Used**:
- `chrome.tabs.onRemoved` - Fires when tab closes

**Implementation**: `/src/background/index.ts` (lines 2952-2959, 3126-3128)

**Two cleanup listeners**:

1. **Wizard Session Cleanup** (lines 2952-2959):
```typescript
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab closed:', tabId);
  WizardSessionStorage.deleteSessionByTabId(tabId).catch(error => {
    console.error('Failed to cleanup wizard session:', error);
  });
});
```

2. **Tab Session Token Revocation** (lines 3126-3128):
```typescript
chrome.tabs.onRemoved.addListener((tabId) => {
  revokeTabToken(tabId);
});
```

**Why Two Listeners?**:
- Each handles different cleanup concerns (separation of concerns)
- Wizard sessions are persisted to storage (need async cleanup)
- Tab tokens are in-memory (instant cleanup)

### Wizard Tab Management

**Special Case**: Multisig wizard opens in separate tab (not subject to single-tab enforcement)

**Opening Wizard**:
```typescript
// Message handler: WIZARD_OPEN
const tab = await chrome.tabs.create({
  url: chrome.runtime.getURL('wizard.html'),
  active: true,
});
```

**Wizard Tab Features**:
- Separate from main wallet tab
- Has its own session storage (`WizardSessionStorage`)
- Can coexist with main wallet tab
- Session persists across service worker restarts
- Auto-cleanup after 24 hours or on tab close

**Implementation**: `/src/background/index.ts` (lines 2600-2649)

### Periodic Cleanup

**Expired Wizard Sessions**:
```typescript
// Clean up wizard sessions older than 24 hours
chrome.alarms.create('cleanupExpiredWizardSessions', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupExpiredWizardSessions') {
    WizardSessionStorage.cleanupExpiredSessions();
  }
});
```

**Purpose**: Prevent storage bloat from abandoned wizard sessions

### Tab Communication Patterns

#### Pattern 1: Tab → Background (Request-Response)

**Used for**: All wallet operations (unlock, send, receive, etc.)

```typescript
// Tab sends request
const response = await chrome.runtime.sendMessage({
  type: MessageType.UNLOCK_WALLET,
  payload: { password }
});

// Background processes and responds
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // Required for async
});
```

**Characteristics**:
- Synchronous request-response pattern
- Tab waits for background to respond
- `sender.tab.id` available in background (NEW with tab architecture)

#### Pattern 2: Background → Tab (Push Notification)

**Used for**: Session revocation, security alerts

```typescript
// Background sends to specific tab
chrome.tabs.sendMessage(tabId, {
  type: 'SESSION_REVOKED',
  reason: 'Another wallet tab was opened'
});

// Tab listens for messages
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SESSION_REVOKED') {
    handleSessionRevoked(message.reason);
  }
});
```

**Characteristics**:
- Asynchronous push from background
- Requires tab ID (tracked by background)
- Tab may ignore message if not relevant
- Fails silently if tab is closed (caught and ignored)

#### Pattern 3: Broadcast to All Tabs (Future)

**Not yet implemented** but possible for:
- Balance updates
- Price changes
- Network status

```typescript
// Hypothetical broadcast pattern
const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL('index.html') });
tabs.forEach(tab => {
  chrome.tabs.sendMessage(tab.id!, {
    type: 'BALANCE_UPDATE',
    balance: newBalance
  });
});
```

### Tab State Persistence

**Challenge**: Tabs persist longer than popups, but service workers can still terminate

**Solutions**:
1. **Storage**: Persist critical state to `chrome.storage.local`
2. **Session Tokens**: Re-request token on tab visibility change
3. **Auto-Lock**: Lock wallet when tab hidden for 5 minutes
4. **Activity Tracking**: Update `lastActivity` timestamp on every message

**Example - Activity Persistence**:
```typescript
// Update activity timestamp
function updateActivity(): void {
  state.lastActivity = Date.now();
  chrome.storage.local.set({ lastActivity: state.lastActivity });
}

// Restore on service worker start
chrome.storage.local.get(['lastActivity']).then((result) => {
  if (result.lastActivity) {
    state.lastActivity = result.lastActivity;
  }
});
```

---

## Message Handler Implementation

### Message Passing Pattern

All communication between tab UI and background service worker uses Chrome's runtime messaging API:

```typescript
// Tab → Background (request-response pattern)
const response = await chrome.runtime.sendMessage({
  type: MessageType.CREATE_WALLET,
  payload: { password: 'secret', addressType: 'native-segwit' }
});

// Background handler
chrome.runtime.onMessage.addListener(
  (message: Message, sender, sendResponse: (response: MessageResponse) => void) => {
    // sender.tab.id is available with tab architecture (not available with popup)
    console.log('Message from tab:', sender.tab?.id);

    handleMessage(message)
      .then((response) => sendResponse(response))
      .catch((error) => sendResponse({ success: false, error: error.message }));

    return true; // Required for async responses
  }
);
```

**Note**: The message passing API is identical to the previous popup architecture, but `sender.tab.id` is now available, enabling background-to-tab push messaging.

### Implemented Message Handlers

#### 1. GET_WALLET_STATE

**Purpose**: Check if wallet exists and is unlocked

**Payload**: None

**Returns**:
```typescript
{
  isInitialized: boolean,  // Wallet exists in storage
  isLocked: boolean        // Wallet is locked (no decrypted seed in memory)
}
```

**Implementation**: Uses `WalletStorage.hasWallet()` to check existence

---

#### 2. CREATE_WALLET

**Purpose**: Generate new wallet with 12-word seed phrase

**Payload**:
```typescript
{
  password: string,
  addressType?: AddressType  // Default: 'native-segwit'
}
```

**Returns**:
```typescript
{
  mnemonic: string,         // 12-word BIP39 seed phrase (SHOW ONCE!)
  firstAddress: string      // First receiving address (tb1...)
}
```

**Implementation Flow**:

1. **Validate** - Check password, ensure no existing wallet
2. **Generate Mnemonic** - `KeyManager.generateMnemonic(128)` → 12 words
3. **Derive Seed** - `KeyManager.mnemonicToSeed(mnemonic)` → 64-byte seed
4. **Create HD Wallet** - `new HDWallet(seed, 'testnet')`
5. **Create First Account** - `hdWallet.createAccount(addressType, 0, 'Account 1')`
6. **Generate First Address** - Derive `m/84'/1'/0'/0/0` (for native-segwit testnet)
7. **Encrypt & Store** - `WalletStorage.createWallet(mnemonic, password, account)`

**Security Notes**:
- Mnemonic shown ONCE in response (never logged)
- User must back it up during onboarding
- Encrypted before storage with AES-256-GCM
- New salt + IV generated for encryption

---

#### 3. IMPORT_WALLET

**Purpose**: Import existing wallet from seed phrase

**Payload**:
```typescript
{
  mnemonic: string,
  password: string,
  addressType?: AddressType  // Default: 'native-segwit'
}
```

**Returns**:
```typescript
{
  firstAddress: string      // First receiving address (tb1...)
}
```

**Implementation Flow**:

1. **Validate Mnemonic** - `KeyManager.validateMnemonic(mnemonic)` (checksum + word list)
2. **Check No Existing Wallet** - Prevent accidental overwrite
3. **Derive Seed** - Convert mnemonic to 64-byte seed
4. **Create HD Wallet** - Same as CREATE_WALLET
5. **Create First Account** - Generate account 0 with first address
6. **Encrypt & Store** - Save encrypted mnemonic

**Security Notes**:
- Mnemonic validated before storage (BIP39 checksum)
- Cannot import if wallet already exists (safety)
- Mnemonic never logged in error messages

---

#### 4. UNLOCK_WALLET

**Purpose**: Decrypt seed and load HD wallet into memory

**Payload**:
```typescript
{
  password: string
}
```

**Returns**:
```typescript
{
  accounts: Account[],      // All accounts with addresses
  balance: Balance          // TODO: Fetch from API
}
```

**Implementation Flow**:

1. **Decrypt Seed** - `WalletStorage.unlockWallet(password)` → mnemonic
2. **Derive HD Wallet** - `KeyManager.mnemonicToSeed()` + `new HDWallet()`
3. **Initialize Address Generator** - `new AddressGenerator('testnet')`
4. **Update In-Memory State** - Store seed, hdWallet, addressGenerator
5. **Start Auto-Lock Timer** - Begin 15-minute inactivity countdown
6. **Load Accounts** - Retrieve from storage

**Security Notes**:
- Decrypted seed exists ONLY in memory (state.decryptedSeed)
- Wrong password → generic error (don't reveal if wallet exists)
- Auto-lock starts immediately after unlock

**TODO**:
- Integrate Blockstream API to fetch real balance
- Scan addresses for transactions (address discovery)

---

#### 5. LOCK_WALLET

**Purpose**: Clear sensitive data from memory

**Payload**: None

**Returns**:
```typescript
{
  message: 'Wallet locked'
}
```

**Implementation**:

1. Clear decrypted seed (overwrite then null)
2. Clear HDWallet instance
3. Clear AddressGenerator instance
4. Set isUnlocked = false
5. Stop auto-lock timer

**Security Notes**:
- Best-effort memory clearing (JavaScript limitation)
- Called on: manual lock, auto-lock, service worker termination
- State persists in storage (encrypted)

---

#### 6. CREATE_ACCOUNT

**Purpose**: Add new BIP44 account (MetaMask-style multi-account)

**Payload**:
```typescript
{
  name?: string,              // Default: 'Account N'
  addressType?: AddressType   // Default: 'native-segwit'
}
```

**Returns**:
```typescript
{
  account: Account,
  firstAddress: string
}
```

**Implementation Flow**:

1. **Check Unlocked** - Require wallet to be unlocked
2. **Determine Account Index** - `accounts.length` (0-indexed)
3. **Create Account** - `hdWallet.createAccount(type, index, name)`
4. **Generate First Address** - Derive `m/84'/1'/index'/0/0`
5. **Save to Storage** - `WalletStorage.addAccount(account)`

**BIP44 Account Derivation**:
- Account 0: `m/84'/1'/0'/0/0`, `m/84'/1'/0'/0/1`, ...
- Account 1: `m/84'/1'/1'/0/0`, `m/84'/1'/1'/0/1`, ...
- Account 2: `m/84'/1'/2'/0/0`, `m/84'/1'/2'/0/1`, ...

**Security Notes**:
- Requires unlocked wallet (needs seed for key derivation)
- Each account is independent (BIP44 standard)
- All accounts share same seed phrase

---

#### 7. UPDATE_ACCOUNT_NAME

**Purpose**: Rename an existing account

**Payload**:
```typescript
{
  accountIndex: number,
  name: string
}
```

**Returns**:
```typescript
{
  account: Account
}
```

**Implementation**:

1. Validate account exists
2. Update name in memory
3. Save to storage via `WalletStorage.updateAccount()`

**Notes**:
- Requires unlocked wallet
- Only updates metadata (no cryptographic operations)

---

#### 8. GENERATE_ADDRESS

**Purpose**: Generate new receiving or change address

**Payload**:
```typescript
{
  accountIndex: number,
  isChange?: boolean        // Default: false (receiving address)
}
```

**Returns**:
```typescript
{
  address: Address          // Full address object with metadata
}
```

**Implementation Flow**:

1. **Check Unlocked** - Need HD wallet for derivation
2. **Find Account** - Lookup by accountIndex
3. **Determine Next Index** - `account.externalIndex` or `account.internalIndex`
4. **Derive Address Node** - `hdWallet.deriveAddressNode(type, account, change, index)`
5. **Build Derivation Path** - e.g., `m/84'/1'/0'/0/5`
6. **Generate Address** - `addressGenerator.generateAddressWithMetadata()`
7. **Update Account** - Increment index, add address to list
8. **Save to Storage** - Persist updated account

**BIP44 Address Types**:
- External (receiving): `change = 0`, index tracked by `externalIndex`
- Internal (change): `change = 1`, index tracked by `internalIndex`

**Address Gap Limit** (BIP44):
- Standard: 20 unused addresses
- We track indices but don't enforce gap limit yet
- TODO: Implement address discovery with gap limit

**Security Notes**:
- Requires unlocked wallet (key derivation needed)
- Addresses are public data (safe to expose)
- Derivation path included in metadata for debugging

---

#### 9. GET_BALANCE

**Purpose**: Fetch confirmed and unconfirmed balance for all addresses in account

**Payload**:
```typescript
{
  accountIndex: number
}
```

**Returns**:
```typescript
{
  confirmed: number,      // Confirmed balance in satoshis
  unconfirmed: number     // Unconfirmed balance in satoshis
}
```

**Implementation Flow**:

1. **Validate Payload** - Check accountIndex is provided and valid
2. **Find Account** - Lookup account by index in storage
3. **Get All Addresses** - Extract all addresses from account
4. **Fetch Balances** - Call `blockstreamClient.getBalance()` for each address in parallel
5. **Aggregate** - Sum confirmed and unconfirmed balances across all addresses
6. **Return Total** - Return aggregated balance

**API Integration**:
```typescript
const balancePromises = addresses.map(addr => blockstreamClient.getBalance(addr));
const balances = await Promise.all(balancePromises);

const totalBalance = balances.reduce(
  (acc, balance) => ({
    confirmed: acc.confirmed + balance.confirmed,
    unconfirmed: acc.unconfirmed + balance.unconfirmed,
  }),
  { confirmed: 0, unconfirmed: 0 }
);
```

**Error Handling**:
- Account not found → `Account with index N not found`
- API errors → Propagated from BlockstreamClient
- No addresses → Returns zero balance (not an error)

**Performance Notes**:
- Parallel fetching for all addresses (Promise.all)
- No caching implemented yet (future enhancement)

---

#### 10. GET_TRANSACTIONS

**Purpose**: Fetch transaction history for all addresses in account

**Payload**:
```typescript
{
  accountIndex: number,
  limit?: number          // Optional: limit number of transactions
}
```

**Returns**:
```typescript
{
  transactions: Transaction[]  // Sorted by timestamp (newest first)
}
```

**Implementation Flow**:

1. **Validate Payload** - Check accountIndex is provided
2. **Find Account** - Lookup account by index
3. **Get All Addresses** - Extract all addresses from account
4. **Fetch Transactions** - Call `blockstreamClient.getTransactions()` for each address in parallel
5. **Deduplicate** - Use Map to deduplicate by txid (same tx can involve multiple addresses)
6. **Sort** - Sort by timestamp (newest first)
7. **Apply Limit** - If limit provided, slice array
8. **Return Results** - Return deduplicated, sorted transactions

**Deduplication Logic**:
```typescript
const txMap = new Map<string, Transaction>();
for (const txArray of txArrays) {
  for (const tx of txArray) {
    if (!txMap.has(tx.txid)) {
      txMap.set(tx.txid, tx);
    }
  }
}
```

**Why Deduplication is Needed**:
- A transaction can involve multiple addresses in the same account
- Example: Send from address A to address B (both in account)
- Without deduplication: Transaction appears twice
- With deduplication: Transaction appears once

**Sorting**:
```typescript
transactions.sort((a, b) => b.timestamp - a.timestamp)
```

**Error Handling**:
- Account not found → Error
- API errors → Propagated from BlockstreamClient
- No addresses → Returns empty array (not an error)

**Performance Notes**:
- Parallel fetching for all addresses
- Deduplication in O(n) time using Map
- Sorting in O(n log n) time

---

#### 11. GET_FEE_ESTIMATES

**Purpose**: Get current fee estimates from Bitcoin network

**Payload**: None

**Returns**:
```typescript
{
  slow: number,    // sat/vB - Low priority (10+ blocks)
  medium: number,  // sat/vB - Medium priority (3-6 blocks)
  fast: number     // sat/vB - High priority (1-2 blocks)
}
```

**Implementation**:

Simple wrapper around `blockstreamClient.getFeeEstimates()`:

```typescript
const feeEstimates = await blockstreamClient.getFeeEstimates();
return { success: true, data: feeEstimates };
```

**Fee Rate Mapping** (in BlockstreamClient):
- Fast: Block target 1-2 (next 1-2 blocks)
- Medium: Block target 3-6 (3-6 blocks)
- Slow: Block target 10-12 (10+ blocks)

**Error Handling**:
- API errors → Propagated from BlockstreamClient
- Fallback: If API fails, could use default rates (not implemented)

**Usage Example**:
```typescript
// User selects fee speed
const fees = await getFeeEstimates();
const selectedFeeRate = fees.fast; // or fees.medium, fees.slow
```

---

#### 12. SEND_TRANSACTION

**Purpose**: Build, sign, and broadcast a Bitcoin transaction

**Payload**:
```typescript
{
  accountIndex: number,
  toAddress: string,      // Recipient Bitcoin address
  amount: number,         // Amount in satoshis
  feeRate: number         // Fee rate in sat/vB
}
```

**Returns**:
```typescript
{
  txid: string,          // Transaction ID (hash)
  fee: number,           // Actual fee paid in satoshis
  size: number           // Virtual size in vBytes
}
```

**Implementation Flow**:

1. **Check Wallet Unlocked** - Require wallet to be unlocked (need seed for signing)
2. **Validate Payload** - Check all required fields (accountIndex, toAddress, amount, feeRate)
3. **Find Account** - Lookup account by index
4. **Get All Addresses** - Extract all addresses from account
5. **Fetch UTXOs** - Call `blockstreamClient.getUTXOs()` for each address in parallel
6. **Flatten UTXOs** - Merge UTXO arrays from all addresses
7. **Check UTXO Availability** - Error if no UTXOs available
8. **Get Change Address** - Use first address in account (could be improved)
9. **Build Transaction** - Call `transactionBuilder.buildTransaction()` with:
   - UTXOs to spend from
   - Output (recipient address + amount)
   - Change address
   - Fee rate
   - Callback functions for key derivation
10. **Broadcast Transaction** - Call `blockstreamClient.broadcastTransaction()` with signed tx hex
11. **Return Result** - Return txid, fee, and size

**Callback Functions**:

The TransactionBuilder needs three callbacks to derive keys and metadata:

```typescript
getPrivateKey: (derivationPath: string) => {
  // Derive private key from HD wallet using derivation path
  const node = state.hdWallet!.derivePath(derivationPath);
  if (!node.privateKey) {
    throw new Error(`Failed to derive private key for path: ${derivationPath}`);
  }
  return node.privateKey;
}
```

```typescript
getAddressType: (address: string) => {
  // All addresses in account have same type
  return account.addressType;
}
```

```typescript
getDerivationPath: (address: string) => {
  // Find address in account to get its derivation path
  const addrObj = account.addresses.find(a => a.address === address);
  if (!addrObj) {
    throw new Error(`Address ${address} not found in account`);
  }
  return addrObj.derivationPath;
}
```

**TransactionBuilder Integration**:

The TransactionBuilder handles:
- UTXO selection (greedy algorithm)
- Fee calculation
- Change output creation
- PSBT construction
- Input signing (Legacy, SegWit, Native SegWit)
- Transaction finalization
- Transaction verification

See `src/background/bitcoin/TransactionBuilder.ts` for full implementation.

**Error Handling**:
- Wallet locked → `Wallet is locked. Please unlock first.`
- Invalid payload → Specific validation errors
- Account not found → `Account with index N not found`
- No addresses → `No addresses found in account`
- No UTXOs → `No UTXOs available for spending`
- Insufficient funds → Thrown by TransactionBuilder
- Invalid recipient address → Thrown by TransactionBuilder
- Broadcast failure → Propagated from BlockstreamClient

**Security Notes**:
- Requires unlocked wallet (private keys needed)
- Private keys derived on-demand (not stored)
- Transaction verified before broadcast
- All amounts in satoshis (no floating point)

**Performance Notes**:
- UTXO fetching is parallel (Promise.all)
- Transaction building is synchronous (fast)
- Broadcast is network-bound (1-3 seconds)

**Future Enhancements**:
- UTXO caching (reduce API calls)
- Better change address selection (unused address)
- RBF (Replace-By-Fee) support
- Transaction preview before signing
- Multiple outputs (batch payments)

---

## Single Tab Enforcement System

### Overview

**Security Requirement**: Only ONE wallet tab can access the unlocked wallet at any given time.

**Why This Matters**:
- Multiple tabs = multiple attack surfaces
- Prevents session confusion and state synchronization issues
- Reduces risk of session hijacking or phishing attacks
- Ensures consistent user experience

### Architecture

The single tab enforcement system uses cryptographically secure session tokens managed by the background service worker.

**Components**:
1. **Session Token Generation** - Cryptographically random 32-byte tokens
2. **Token Validation** - Validate token every 5 seconds from tab
3. **Session Revocation** - Revoke old session when new tab requests token
4. **Tab Communication** - Push notifications to revoked tabs

**Implementation**: `/src/background/index.ts` (lines 3018-3167)

### Data Structures

```typescript
interface TabSession {
  tabId: number;          // Chrome tab ID
  token: string;          // 64-character hex token (32 bytes)
  issuedAt: number;       // Timestamp when token was issued
  lastValidated: number;  // Timestamp of last validation
}

// Global state in background service worker
let activeTabSession: TabSession | null = null;
```

**Design Decision**: Only ONE `activeTabSession` at a time (enforces single tab)

### Token Generation

```typescript
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);  // Cryptographically secure random
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

**Security Properties**:
- 256 bits of entropy (2^256 possible tokens)
- Cryptographically secure random source
- Hex-encoded for easy transmission
- Unpredictable (cannot be guessed or forged)

### Tab Session Lifecycle

#### 1. Tab Requests Token (On Load or Visibility Change)

**Tab Side** (`/src/tab/index.tsx` lines 183-202):
```typescript
async function requestSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({
    type: 'REQUEST_TAB_TOKEN'
  });

  if (response.granted && response.token) {
    sessionToken = response.token;
    sessionValid = true;
    return true;
  }
  return false;
}
```

**Background Side** (`/src/background/index.ts` lines 3060-3088):
```typescript
function requestTabToken(tabId: number): { token: string; granted: boolean } {
  // If there's an active session for a different tab, invalidate it
  if (activeTabSession && activeTabSession.tabId !== tabId) {
    // Notify the old tab that it's been superseded
    chrome.tabs.sendMessage(activeTabSession.tabId, {
      type: 'SESSION_REVOKED',
      reason: 'Another wallet tab was opened'
    });
  }

  // Generate new token for requesting tab
  const token = generateSessionToken();
  activeTabSession = {
    tabId,
    token,
    issuedAt: Date.now(),
    lastValidated: Date.now()
  };

  return { token, granted: true };
}
```

**Flow**:
```
Tab A loads and requests token
  ↓
Background grants token to Tab A
  ↓
Tab A starts validation loop (every 5s)
  ↓
User opens Tab B (manually or via extension icon)
  ↓
Tab B requests token
  ↓
Background revokes Tab A's session
Background sends SESSION_REVOKED to Tab A
Background grants new token to Tab B
  ↓
Tab A receives SESSION_REVOKED
Tab A shows "Wallet Tab Closed" message
Tab A locks wallet
  ↓
Only Tab B has valid session
```

#### 2. Tab Validates Token (Every 5 Seconds)

**Tab Side** (`/src/tab/index.tsx` lines 207-232):
```typescript
async function validateSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({
    type: 'VALIDATE_TAB_TOKEN',
    token: sessionToken
  });

  if (response.valid) {
    sessionValid = true;
    return true;
  } else {
    sessionValid = false;
    handleSessionRevoked(response.reason);
    return false;
  }
}

// Validation loop
setInterval(() => {
  validateSessionToken();
}, 5000);
```

**Background Side** (`/src/background/index.ts` lines 3093-3113):
```typescript
function validateTabToken(tabId: number, token: string): { valid: boolean; reason?: string } {
  if (!activeTabSession) {
    return { valid: false, reason: 'No active session' };
  }
  if (activeTabSession.tabId !== tabId) {
    return { valid: false, reason: 'Token belongs to different tab' };
  }
  if (activeTabSession.token !== token) {
    return { valid: false, reason: 'Invalid token' };
  }

  // Token is valid - update last validated time
  activeTabSession.lastValidated = Date.now();
  return { valid: true };
}
```

**Validation Checks**:
1. Does an active session exist? (No → invalid)
2. Is the tab ID correct? (No → invalid)
3. Does the token match? (No → invalid)
4. All checks pass → valid, update `lastValidated`

#### 3. Session Revocation

**Trigger Events**:
- Another tab requests a token
- Tab is closed (`chrome.tabs.onRemoved`)
- Manual revocation (future: admin lock feature)

**Background Revocation** (`/src/background/index.ts` lines 3118-3123):
```typescript
function revokeTabToken(tabId: number): void {
  if (activeTabSession && activeTabSession.tabId === tabId) {
    console.log(`[TAB SESSION] Revoked token for tab ${tabId}`);
    activeTabSession = null;
  }
}

// Listen for tab closure
chrome.tabs.onRemoved.addListener((tabId) => {
  revokeTabToken(tabId);
});
```

**Tab Handles Revocation** (`/src/tab/index.tsx` lines 237-296):
```typescript
function handleSessionRevoked(reason: string): void {
  // Lock wallet
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });

  // Show revocation UI
  document.body.innerHTML = `
    <div style="...">
      <h1>🔒 Wallet Tab Closed</h1>
      <p>${reason}</p>
      <button onclick="window.close()">Close This Tab</button>
    </div>
  `;
}

// Listen for revocation messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SESSION_REVOKED') {
    handleSessionRevoked(message.reason);
  }
});
```

### Client-Side Security Checks

**In Addition to Session Tokens**, the tab implements multiple security checks:

#### 1. Clickjacking Prevention (`/src/tab/index.tsx` lines 19-50)

```typescript
// Detect iframe embedding
if (window !== window.top) {
  console.error('[SECURITY] Clickjacking attempt detected');
  // Show error UI and stop initialization
  throw new Error('Clickjacking prevention: iframe detected');
}
```

**Complements**: CSP `frame-ancestors 'none'` directive

#### 2. Tab Nabbing Prevention (`/src/tab/index.tsx` lines 69-154)

```typescript
// Check location integrity every 1 second
setInterval(() => {
  if (!window.location.href.startsWith(EXPECTED_ORIGIN)) {
    handleLocationTampering();  // Lock wallet and show warning
  }
}, 1000);
```

**Protects Against**: Malicious script changing `window.location`

#### 3. Auto-Lock on Hidden Tab (`/src/tab/index.tsx` lines 371-434)

```typescript
// Lock wallet after 5 minutes when tab is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    setTimeout(() => {
      chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
    }, 5 * 60 * 1000);
  }
});
```

**Complements**: Background's 15-minute inactivity auto-lock

### Security Properties

**Token-Based Security**:
- Tokens are cryptographically random (cannot be guessed)
- Tokens are single-use per session (not reusable)
- Validation happens server-side (background) - tabs cannot forge validity
- Revocation is immediate and enforced by background

**Defense-in-Depth**:
1. **Tab-level**: Clickjacking, tab nabbing, visibility monitoring
2. **Background-level**: Session tokens, single active session enforcement
3. **CSP-level**: `frame-ancestors 'none'` prevents embedding
4. **Storage-level**: Encrypted wallet data, activity tracking

**Attack Scenarios Mitigated**:
- User opens duplicate tabs → Only latest tab works, others show revocation message
- Malicious page tries to embed wallet in iframe → Blocked by iframe detection + CSP
- Malicious script tries to redirect wallet tab → Detected within 1 second, wallet locked
- User leaves tab open and walks away → Auto-locks after 5 minutes (tab) or 15 minutes (inactivity)
- Attacker tries to reuse old session token → Validation fails (token rotated)

### Trade-offs and Design Rationale

**Why Single Tab?**:
- **Pro**: Simpler security model (one session to protect)
- **Pro**: Prevents user confusion (which tab is "real"?)
- **Pro**: Reduces attack surface (fewer entry points)
- **Con**: User can't have multiple windows open (could be useful for multisig coordination)

**Decision**: Security over convenience. Single tab enforcement is critical for wallet security.

**Why 5-Second Validation?**:
- **Fast enough**: Detect revocation within 5 seconds
- **Not too chatty**: Doesn't spam background service worker
- **Balance**: Between responsiveness and performance

**Why Client-Side + Server-Side Checks?**:
- **Defense-in-depth**: Multiple layers of security
- **Client-side**: Fast detection (1s for location tampering)
- **Server-side**: Authoritative (background controls session)

---

## In-Memory State Management

### State Structure

**UPDATED 2025-10-18**: Added encryptionKey for secure imported key encryption

```typescript
interface InMemoryState {
  isUnlocked: boolean;              // Wallet unlocked flag
  decryptedSeed: string | null;     // BIP39 mnemonic (NEVER persist!)
  encryptionKey: CryptoKey | null;  // Password-derived key for imported keys (NEW)
  hdWallet: HDWallet | null;        // HD wallet instance
  addressGenerator: AddressGenerator | null;  // Address generator instance
  lastActivity: number;             // Timestamp for auto-lock
  autoLockTimer: number | null;     // Timeout ID for auto-lock
}
```

**Key Addition - encryptionKey (2025-10-18)**:
- CryptoKey derived from user password via PBKDF2
- Used EXCLUSIVELY for encrypting imported private keys and seeds
- Derived during wallet unlock and stored in memory
- Cleared when wallet locks (same lifecycle as decryptedSeed)
- CRITICAL: This prevents cascading key compromise if main seed is leaked
- Old (vulnerable) approach: Used decryptedSeed directly as encryption key
- New (secure) approach: Password-derived key independent of wallet seed

### State Lifecycle

**Unlocked State**:
- `decryptedSeed`: Mnemonic phrase (12 words)
- `encryptionKey`: CryptoKey derived from password (for imported keys)
- `hdWallet`: HDWallet instance with master node
- `addressGenerator`: AddressGenerator instance
- `isUnlocked`: true
- `lastActivity`: Updated on every message
- `autoLockTimer`: Active timeout

**Locked State**:
- All sensitive data cleared (nulled), including encryptionKey
- `isUnlocked`: false
- Storage persists (encrypted)

**Service Worker Termination**:
- Entire state cleared (memory released)
- User must unlock again with password
- Storage remains intact (encrypted)

### Activity Tracking

Every message handler calls `updateActivity()` to reset the inactivity timer:

```typescript
function updateActivity(): void {
  state.lastActivity = Date.now();
}
```

This ensures auto-lock only triggers after true inactivity (no messages for 15 minutes).

---

## HD Wallet Integration

### Class Dependencies

Our HD wallet implementation uses the following classes:

1. **KeyManager** - BIP39 mnemonic operations
   - Generate 12/24 word seed phrases
   - Validate mnemonic (checksum + word list)
   - Convert mnemonic to 64-byte seed (PBKDF2)

2. **HDWallet** - BIP32/BIP44 key derivation
   - Create master node from seed
   - Derive account nodes (hardened)
   - Derive address nodes (non-hardened)
   - Support all three address types

3. **AddressGenerator** - Bitcoin address generation
   - Legacy (P2PKH): `m` or `n` prefix (testnet)
   - SegWit (P2SH-P2WPKH): `2` prefix (testnet)
   - Native SegWit (P2WPKH): `tb1` prefix (testnet)

4. **CryptoUtils** - AES-256-GCM encryption
   - Encrypt seed phrase with password (PBKDF2 key derivation)
   - Decrypt seed phrase (verify password)
   - 100,000 PBKDF2 iterations (OWASP minimum)

5. **WalletStorage** - Chrome storage wrapper
   - Create/read/update wallet data
   - Encrypt/decrypt seed phrase
   - Manage accounts and settings

### Derivation Path Examples

**Testnet Native SegWit** (BIP84):
```
Purpose: 84' (native segwit)
Coin Type: 1' (testnet)
Account: 0' (first account)
Change: 0 (receiving) or 1 (change)
Index: 0, 1, 2, ... (address index)

First receiving: m/84'/1'/0'/0/0 → tb1q...
Second receiving: m/84'/1'/0'/0/1 → tb1q...
First change: m/84'/1'/0'/1/0 → tb1q...
```

**Testnet SegWit** (BIP49):
```
Purpose: 49' (segwit wrapped in P2SH)
First receiving: m/49'/1'/0'/0/0 → 2...
```

**Testnet Legacy** (BIP44):
```
Purpose: 44' (legacy)
First receiving: m/44'/1'/0'/0/0 → m... or n...
```

### Address Generation Flow

1. **Derive Account Node** - `m/84'/1'/0'` (hardened, account-level)
2. **Derive Address Node** - `m/84'/1'/0'/0/5` (non-hardened, address-level)
3. **Extract Public Key** - 33-byte compressed public key
4. **Generate Address** - Hash160 → Bech32 encoding (native segwit)
5. **Create Metadata** - Store derivation path, index, change flag

---

## Storage Patterns

### Chrome Storage Schema

```typescript
interface StoredWallet {
  version: 1,                       // Schema version (for migrations)
  encryptedSeed: string,            // Base64 encoded ciphertext
  salt: string,                     // Base64 encoded PBKDF2 salt
  iv: string,                       // Base64 encoded AES IV
  accounts: Account[],              // All accounts with addresses
  settings: WalletSettings          // User preferences
}

interface WalletSettings {
  autoLockMinutes: number,          // Auto-lock timeout (default: 15)
  network: 'testnet' | 'mainnet'    // Bitcoin network (default: 'testnet')
}

interface Account {
  index: number,                    // BIP44 account index (0, 1, 2, ...)
  name: string,                     // User-friendly name ('Account 1', ...)
  addressType: AddressType,         // 'legacy' | 'segwit' | 'native-segwit'
  externalIndex: number,            // Next external (receiving) address index
  internalIndex: number,            // Next internal (change) address index
  addresses: Address[]              // All generated addresses
}

interface Address {
  address: string,                  // Bitcoin address (tb1q..., 2..., m/n...)
  derivationPath: string,           // Full BIP44 path (m/84'/1'/0'/0/0)
  index: number,                    // Address index in account
  isChange: boolean,                // true for change addresses
  used: boolean                     // true if address has transactions (TODO)
}
```

### Storage Operations

**Read Wallet**:
```typescript
const wallet = await WalletStorage.getWallet();
// Returns StoredWallet (seed is encrypted)
```

**Create Wallet**:
```typescript
await WalletStorage.createWallet(mnemonic, password, firstAccount);
// Encrypts mnemonic, creates wallet structure
```

**Unlock Wallet**:
```typescript
const mnemonic = await WalletStorage.unlockWallet(password);
// Decrypts and returns seed phrase (handle with care!)
```

**Update Account**:
```typescript
await WalletStorage.updateAccount(accountIndex, updatedAccount);
// Saves updated account to storage
```

**Add Account**:
```typescript
await WalletStorage.addAccount(newAccount);
// Appends new account to accounts array
```

### Storage Size Considerations

Chrome storage has a 10 MB quota for local storage. Our wallet data is small:

- Encrypted seed: ~200 bytes
- Salt + IV: ~50 bytes
- Account metadata: ~100 bytes per account
- Address metadata: ~150 bytes per address

**Estimated capacity**: ~60,000 addresses before hitting 10 MB limit (unlikely scenario).

---

## Auto-Lock Implementation

### Design Goals

1. Lock wallet after 15 minutes of inactivity
2. Track activity via message handling
3. Clear sensitive data on lock
4. Handle service worker termination

### Implementation Strategy

We use TWO mechanisms for auto-lock:

#### 1. Timeout-Based Auto-Lock

```typescript
function startAutoLock(): void {
  const autoLockMs = 15 * 60 * 1000; // 15 minutes

  state.autoLockTimer = setTimeout(() => {
    if (state.isUnlocked) {
      handleLockWallet();
    }
  }, autoLockMs);
}
```

**Triggered**: Immediately after `UNLOCK_WALLET`

**Reset**: Every time a message is processed (via `updateActivity()`)

**Pros**: Accurate, immediate response

**Cons**: Cleared if service worker terminates (but that's fine - state is cleared anyway)

#### 2. Periodic Inactivity Check

```typescript
chrome.alarms.create('checkInactivity', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkInactivity') {
    checkInactivity();
  }
});

function checkInactivity(): void {
  if (!state.isUnlocked) return;

  const inactiveMs = Date.now() - state.lastActivity;
  const autoLockMs = 15 * 60 * 1000;

  if (inactiveMs >= autoLockMs) {
    handleLockWallet();
  }
}
```

**Triggered**: Every 1 minute via Chrome alarms

**Purpose**: Backup mechanism (survives service worker restarts)

**Pros**: Persists across service worker lifecycle

**Cons**: 1-minute granularity (acceptable for 15-minute timeout)

#### 3. Service Worker Termination Handler

```typescript
self.addEventListener('beforeunload', () => {
  if (state.isUnlocked) {
    handleLockWallet();
  }
});
```

**Purpose**: Clean up sensitive data before service worker terminates

**Note**: This is best-effort (service worker may terminate without notice)

### Activity Tracking

Every message handler updates the activity timestamp:

```typescript
async function handleMessage(message: Message): Promise<MessageResponse> {
  updateActivity(); // Reset inactivity timer
  // ... handle message
}
```

This ensures the 15-minute countdown only starts after the LAST user interaction.

---

## Security Considerations

### Sensitive Data Handling

**NEVER Log**:
- Mnemonic seed phrases
- Private keys
- Passwords
- Decrypted seed

**NEVER Persist Unencrypted**:
- Seed phrases (always encrypted before storage)
- Private keys (derived on-demand, never stored)

**ALWAYS Clear on Lock**:
- `state.decryptedSeed`
- `state.hdWallet`
- `state.addressGenerator`

### Encryption Details

**Algorithm**: AES-256-GCM (authenticated encryption)

**Key Derivation**: PBKDF2-HMAC-SHA256
- Iterations: 100,000 (OWASP minimum)
- Salt: 32 bytes (unique per wallet)
- Output: 256-bit key

**IV**: 12 bytes (unique per encryption, never reused)

**Authenticated Encryption**: GCM mode provides:
- Confidentiality (data encrypted)
- Integrity (tampering detected)
- Authentication (prevents forgery)

### Service Worker Security Constraints

**Challenge**: Service workers can terminate at any time

**Solution**:
1. Encrypt all sensitive data before storage
2. Keep decrypted data in memory only
3. Require password re-entry after restart
4. Design for sudden termination (no assumptions)

**Trade-offs**:
- UX: Users must unlock after extension restart
- Security: Decrypted keys never persist (strong security)

---

## API Integration

### Blockstream API Client

**Status**: IMPLEMENTED (2025-10-12)

**Location**: `src/background/api/BlockstreamClient.ts`

**Responsibilities**:
- Fetch address balances
- Fetch transaction history
- Fetch UTXOs (unspent transaction outputs)
- Broadcast transactions
- Get fee estimates

**Implemented Endpoints**:

1. **GET /address/{address}** - Address info and balance
   ```typescript
   async getAddressInfo(address: string): Promise<BlockstreamAddressInfo>
   ```
   - Returns chain_stats (confirmed) and mempool_stats (unconfirmed)
   - Used by `getBalance()` to calculate total balance

2. **GET /address/{address}** - Simplified balance
   ```typescript
   async getBalance(address: string): Promise<Balance>
   ```
   - Returns `{ confirmed: number, unconfirmed: number }` in satoshis
   - Calculates: `funded_txo_sum - spent_txo_sum`

3. **GET /address/{address}/txs** - Transaction history
   ```typescript
   async getTransactions(address: string): Promise<Transaction[]>
   ```
   - Returns array of transactions involving the address
   - Parses inputs/outputs, calculates value change
   - Includes confirmations, timestamp, fee

4. **GET /address/{address}/utxo** - Unspent outputs
   ```typescript
   async getUTXOs(address: string): Promise<UTXO[]>
   ```
   - Returns UTXOs available for spending
   - Includes txid, vout, value, confirmations
   - Used for transaction building

5. **POST /tx** - Broadcast transaction
   ```typescript
   async broadcastTransaction(txHex: string): Promise<string>
   ```
   - Posts raw transaction hex to network
   - Returns transaction ID (txid) on success
   - Throws specific errors (INVALID_TRANSACTION, BROADCAST_FAILED)

6. **GET /fee-estimates** - Fee recommendations
   ```typescript
   async getFeeEstimates(): Promise<FeeEstimates>
   ```
   - Returns `{ slow, medium, fast }` in sat/vB
   - Maps block targets: 1-2 blocks (fast), 3-6 blocks (medium), 10+ blocks (slow)

**Features Implemented**:

1. **Exponential Backoff Retry Logic**:
   - Retries failed requests with delays: 1s, 2s, 4s
   - Skips retry for non-retryable errors (404, invalid address, etc.)
   - Handles rate limiting (429) gracefully

2. **Timeout Handling**:
   - 10-second timeout per request
   - Throws `ApiErrorType.TIMEOUT` on timeout
   - Uses AbortController for cancellation

3. **Error Handling**:
   - Custom `ApiError` class with typed error codes
   - Specific error types:
     - `NETWORK_ERROR` - No internet or fetch failed
     - `RATE_LIMITED` - Too many requests (429)
     - `INVALID_ADDRESS` - Bad address format (400)
     - `INVALID_TRANSACTION` - Transaction rejected (400)
     - `BROADCAST_FAILED` - Transaction broadcast failed
     - `NOT_FOUND` - Resource not found (404)
     - `TIMEOUT` - Request timed out
     - `UNKNOWN` - Unhandled error

4. **Comprehensive Logging**:
   - Logs all API requests with address/operation
   - Logs retry attempts with delay
   - Logs errors with context
   - NEVER logs sensitive data (keys, mnemonics)

5. **Network Support**:
   - Constructor accepts `'mainnet' | 'testnet'`
   - Testnet: `https://blockstream.info/testnet/api`
   - Mainnet: `https://blockstream.info/api`
   - Default: testnet

6. **Transaction Parsing**:
   - Transforms raw Blockstream API responses to our types
   - Calculates value change for specific address
   - Extracts inputs/outputs with addresses and values
   - Includes fee and confirmation data

**Usage Example**:

```typescript
import { BlockstreamClient } from './api/BlockstreamClient';

const client = new BlockstreamClient('testnet');

// Get balance
const balance = await client.getBalance('tb1q...');
console.log(`Confirmed: ${balance.confirmed}, Unconfirmed: ${balance.unconfirmed}`);

// Get transactions
const txs = await client.getTransactions('tb1q...');
console.log(`Found ${txs.length} transactions`);

// Get UTXOs for spending
const utxos = await client.getUTXOs('tb1q...');
console.log(`${utxos.length} UTXOs available`);

// Broadcast transaction
const txid = await client.broadcastTransaction('01000000...');
console.log(`Broadcast successful: ${txid}`);

// Get fee estimates
const fees = await client.getFeeEstimates();
console.log(`Fast: ${fees.fast} sat/vB, Medium: ${fees.medium}, Slow: ${fees.slow}`);
```

**Singleton Instance**:

```typescript
import { blockstreamClient } from './api/BlockstreamClient';

// Use default testnet instance
const balance = await blockstreamClient.getBalance('tb1q...');
```

**Integration Points** (TODO):
- `UNLOCK_WALLET`: Fetch balance for all addresses
- `GET_BALANCE`: Return real balance from API
- `GET_TRANSACTIONS`: Fetch transaction history
- `GENERATE_ADDRESS`: Check if address has been used
- `SEND_TRANSACTION`: Fetch UTXOs, build tx, sign, broadcast
- `GET_FEE_ESTIMATES`: Return current fee rates

**Future Enhancements**:
- Response caching (5-minute TTL for balances)
- Request queuing (rate limiting)
- Batch address balance fetching
- WebSocket support for real-time updates
- Configurable retry parameters
- Request throttling

---

### Price Service (CoinGecko API)

**Status**: IMPLEMENTED (2025-10-12)

**Location**: `src/background/api/PriceService.ts`

**Responsibilities**:
- Fetch current BTC/USD price from CoinGecko API
- Cache price data to minimize API calls
- Provide price data to popup for USD display

**Implemented Methods**:

1. **getPrice()** - Fetch current Bitcoin price
   ```typescript
   async getPrice(): Promise<BitcoinPrice>
   ```
   - Returns `{ usd: number, lastUpdated: number }`
   - Uses cached price if still valid (within 5-minute TTL)
   - Fetches fresh price from API if cache expired or invalid
   - Throws error on network failure or invalid response

**Features Implemented**:

1. **5-Minute Price Caching**:
   - Cache TTL: 5 minutes (300,000ms)
   - Stores price and lastUpdated timestamp
   - Validates cache before returning cached price
   - Prevents excessive API calls (reduces from 12/hour to ~1/hour)

2. **Cache Validation**:
   ```typescript
   private isCacheValid(): boolean {
     if (!this.cachedPrice) return false;
     const age = Date.now() - this.cachedPrice.lastUpdated;
     return age < this.cacheTimeout;
   }
   ```

3. **Timeout Handling**:
   - 10-second timeout per request
   - Uses AbortController for cancellation
   - Throws descriptive error on timeout

4. **Error Handling**:
   - Network errors with context
   - Invalid response format detection
   - Missing price field validation
   - Comprehensive error messages for debugging

5. **Retry Logic**:
   - Single retry on network failure
   - 1-second delay before retry
   - Fails fast after single retry (prevents long waits)

6. **Comprehensive Logging**:
   - Logs cache hits/misses
   - Logs API requests
   - Logs errors with context
   - No sensitive data logged

**API Integration**:

- **Endpoint**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- **Method**: GET
- **Response Format**:
  ```json
  {
    "bitcoin": {
      "usd": 45000.50
    }
  }
  ```
- **Rate Limiting**: CoinGecko free tier allows 10-50 requests/minute
- **Caching Strategy**: 5-minute TTL keeps usage well under rate limits

**Usage Example**:

```typescript
import { priceService } from './api/PriceService';

// Get current price (uses cache if valid)
const price = await priceService.getPrice();
console.log(`BTC/USD: $${price.usd}`);
console.log(`Last updated: ${new Date(price.lastUpdated).toLocaleString()}`);
```

**Singleton Instance**:

```typescript
import { priceService } from './api/PriceService';

// Use default singleton instance
const price = await priceService.getPrice();
```

**Message Handler Integration**:

Added GET_BTC_PRICE message handler in `src/background/index.ts`:

```typescript
case MessageType.GET_BTC_PRICE:
  return handleGetBtcPrice();

async function handleGetBtcPrice(): Promise<MessageResponse> {
  try {
    const price = await priceService.getPrice();
    return { success: true, data: price };
  } catch (error) {
    console.error('[Background] Failed to get BTC price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get BTC price',
    };
  }
}
```

**Integration Points**:
- Popup components call GET_BTC_PRICE message to fetch price
- useBitcoinPrice React hook manages price state and auto-refresh
- Price displayed alongside BTC amounts throughout UI

**Performance Notes**:
- Cache reduces API calls by ~12x (from every request to ~1 per 5 minutes)
- Non-blocking: Price fetch failures don't affect wallet operations
- Lightweight: Price service adds <5KB to bundle size

**Security Notes**:
- Uses HTTPS for API requests
- No authentication required (public API)
- No sensitive data sent to CoinGecko
- Timeout prevents hanging requests

**Future Enhancements**:
- Support for additional fiat currencies (EUR, GBP, JPY, etc.)
- Configurable cache TTL in settings
- WebSocket support for real-time price updates
- Fallback to alternative price APIs (Coinbase, Kraken)
- Historical price data for charts
- Price alerts/notifications

**Type Definitions**:

Added to `src/shared/types/index.ts`:

```typescript
export interface BitcoinPrice {
  usd: number;         // Bitcoin price in USD
  lastUpdated: number; // Timestamp when price was fetched
}

export enum MessageType {
  // ... existing types
  GET_BTC_PRICE = 'GET_BTC_PRICE',
}
```

**Version**: Added in v0.7.0 (2025-10-12)

---

## Known Issues & Technical Debt

### Current Limitations

1. ✅ **DONE**: Balance Fetching - `GET_BALANCE` handler implemented
   - `UNLOCK_WALLET` now fetches real balance from API
   - Aggregates balances from all addresses in account

2. ✅ **DONE**: Transaction History - `GET_TRANSACTIONS` handler implemented
   - Fetches transactions for all addresses
   - Deduplicates and sorts by timestamp

3. ✅ **DONE**: Fee Estimation - `GET_FEE_ESTIMATES` handler implemented
   - Returns slow/medium/fast fee rates from network

4. ✅ **DONE**: Transaction Building - `SEND_TRANSACTION` handler implemented
   - UTXO fetching from all addresses
   - Transaction building with TransactionBuilder
   - Signing with derived private keys
   - Broadcasting to network

5. **No Address Discovery**
   - Cannot detect used addresses on import
   - **TODO**: Implement BIP44 gap limit scanning
   - **Priority**: Medium (import flow enhancement)

6. **Limited Error Messages**
   - Generic errors for security (don't reveal wallet state)
   - **Trade-off**: Security vs. UX (security wins)

7. **No Storage Cleanup**
   - Old addresses not pruned
   - **Low priority**: 60,000+ address capacity

8. **No Multi-Network Support in Message Handlers**
   - Hardcoded to testnet
   - **TODO**: Read from WalletSettings.network (already stored)
   - **Priority**: High (before mainnet launch)

9. **No Response Caching**
   - Balance/transaction requests hit API every time
   - **TODO**: Implement 5-minute TTL cache
   - **Priority**: Medium (performance optimization)

10. **Basic Change Address Selection**
    - Uses first address as change address
    - **TODO**: Generate new change address or use unused address
    - **Priority**: Low (works but not optimal for privacy)

### Technical Debt

1. **Type Safety**: Some `any` types in message payloads
   - **Fix**: Define strict payload types in `src/shared/types/index.ts`

2. **Memory Clearing**: Best-effort in JavaScript
   - **Limitation**: Cannot guarantee memory overwrite
   - **Mitigation**: Service worker termination clears memory

3. **Error Handling**: Generic catch-all errors
   - **Fix**: Define custom error types with codes

4. **Logging**: Console.log in production
   - **Fix**: Implement proper logging levels (debug, info, warn, error)

5. **Testing**: No unit tests yet
   - **Priority**: High (Phase 1 completion)
   - **TODO**: Test all message handlers, encryption, HD wallet

---

## Wizard Session Management

**Status**: IMPLEMENTED (2025-10-13)
**Phase**: Tab-Based Multisig Wizard - Phase 1 (Backend Foundation)

### Overview

The wizard session management system provides persistent state storage for the tab-based multisig wallet setup wizard. This replaces the popup-based wizard which had UX issues (popup closes when users click away to copy/paste xpubs or download files).

**Location**: `src/background/wizard/WizardSessionStorage.ts`

### Architecture

**Key Design Principle**: Single wizard session enforcement
- Only ONE wizard can be active at a time across all tabs
- Prevents inconsistent state if multiple wizards were running
- Session tied to specific Chrome tab ID
- Auto-cleanup when tab closes or after 24 hours

### WizardSessionStorage Class

**Storage Key**: `wizardSession` in `chrome.storage.local`

**Session Data Structure**:
```typescript
interface WizardSessionData {
  tabId: number;                                    // Active wizard tab ID
  currentStep: number;                              // Current step (1-7)
  state: {
    selectedConfig: MultisigConfig | null;         // Step 1: Config selection
    selectedAddressType: MultisigAddressType | null; // Step 2: Address type
    myXpub: string | null;                          // Step 3: Our xpub
    myFingerprint: string | null;                   // Step 3: Our fingerprint
    cosignerXpubs: Cosigner[];                      // Step 4: Imported cosigners
    firstAddress: string | null;                    // Step 5: Generated address
    accountName: string;                            // Step 6: Account name
    addressVerified: boolean;                       // Step 5: Address verified flag
  };
  createdAt: number;                                // Creation timestamp
  updatedAt: number;                                // Last update timestamp
}
```

### Static Methods

#### 1. createSession(tabId: number)
- Creates new wizard session for specified tab
- Checks for existing active session
- If session exists, verifies tab is still open
- Cleans up stale sessions (tab closed but session remains)
- Throws error if active session in different tab
- Initializes all state fields to default values

**Error Handling**:
```typescript
throw new Error('A wizard session is already active in another tab')
```

#### 2. getSession()
- Retrieves current wizard session from storage
- Returns null if no session exists
- Validates session structure
- Auto-cleans invalid/corrupted sessions
- Returns typed WizardSessionData or null

**Validation**: Checks all required fields and types before returning

#### 3. updateSession(updates: Partial<WizardSessionData>)
- Updates session with partial data
- Deep merges state object
- Updates `updatedAt` timestamp automatically
- Throws error if no session exists

**Usage**:
```typescript
await WizardSessionStorage.updateSession({
  currentStep: 2,
  state: { selectedConfig: '2-of-3' }
});
```

#### 4. deleteSession()
- Removes wizard session from storage
- Called when wizard completes or user cancels
- Safe to call even if no session exists

#### 5. getActiveSession()
- Gets session only if tab is still open
- Verifies tab existence using `chrome.tabs.get()`
- Auto-cleans session if tab was closed
- Returns null if no active session

**Use Case**: Recovery on page reload, check if wizard already running

#### 6. deleteSessionByTabId(tabId: number)
- Deletes session if it belongs to specified tab
- Used by tab lifecycle listener
- Safe to call for any tab (no-op if no match)

#### 7. cleanupExpiredSessions()
- Removes sessions older than 24 hours
- Called periodically by chrome.alarms (hourly)
- Prevents stale sessions from accumulating
- Uses `updatedAt` timestamp for age calculation

### Message Handlers

#### WIZARD_INIT
**Purpose**: Initialize wizard session or recover existing session

**Payload**: `{ tabId: number }`

**Returns**: `{ session: WizardSessionData | null, isRecovery: boolean }`

**Logic**:
1. Check for existing active session
2. If exists and same tab → return existing session (recovery)
3. If exists and different tab → error (session already active)
4. If no session → create new session
5. Return session data and recovery flag

**Error Cases**:
- Tab ID missing: "Tab ID is required"
- Session in different tab: "A wizard session is already active in another tab. Please complete or close it first."

#### WIZARD_SAVE_STATE
**Purpose**: Update wizard session with partial state

**Payload**: `Partial<WizardSessionData>` (any partial session data)

**Returns**: `{ success: boolean }`

**Logic**:
1. Validate payload exists
2. Call `WizardSessionStorage.updateSession()`
3. Updates `updatedAt` automatically
4. Return success response

**Use Case**: Save wizard progress after each step completion

#### WIZARD_LOAD_STATE
**Purpose**: Load current wizard session state

**Payload**: `{ tabId?: number }` (optional tab ID for verification)

**Returns**: `{ session: WizardSessionData | null }`

**Logic**:
1. Get active session
2. If tabId provided, verify it matches
3. Return session or null
4. Error if tab mismatch

**Use Case**: Recover wizard state on page reload

#### WIZARD_COMPLETE
**Purpose**: Create multisig account from wizard data and cleanup session

**Payload**:
```typescript
{
  accountName: string,
  config: MultisigConfig,
  addressType: MultisigAddressType,
  cosignerXpubs: Cosigner[]
}
```

**Returns**: `{ account: MultisigAccount }`

**Logic**:
1. Check wallet is unlocked
2. Validate all required fields
3. Call `handleCreateMultisigAccount()` with payload
4. If successful, delete wizard session
5. Return created account

**Error Cases**:
- Wallet locked: "Wallet is locked. Please unlock first."
- Missing fields: "Account name, config, and addressType are required"
- Invalid cosigners: "cosignerXpubs must be an array"

**Important**: Session cleanup happens AFTER account creation succeeds. If cleanup fails, it's logged but doesn't fail the operation.

#### WIZARD_CHECK_WALLET_LOCKED
**Purpose**: Check if wallet is locked (for wizard validation)

**Payload**: none

**Returns**: `{ isLocked: boolean }`

**Logic**:
1. Check `isWalletUnlocked()` helper
2. Return negated value (isLocked = !isUnlocked)

**Use Case**: Wizard can check if user needs to unlock wallet before proceeding with certain steps

### Tab Lifecycle Management

**Location**: `src/background/index.ts` (bottom of file)

#### Tab Close Listener
```typescript
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  WizardSessionStorage.deleteSessionByTabId(tabId).catch(error => {
    console.error('Failed to cleanup wizard session for closed tab:', error);
  });
});
```

**Purpose**: Auto-cleanup wizard session when tab closes

**Behavior**:
- Fires whenever any Chrome tab closes
- Checks if closed tab has wizard session
- Deletes session if match found
- Prevents orphaned sessions

#### Expired Session Cleanup Alarm
```typescript
chrome.alarms.create('cleanupExpiredWizardSessions', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupExpiredWizardSessions') {
    WizardSessionStorage.cleanupExpiredSessions();
  }
});
```

**Purpose**: Periodic cleanup of stale sessions

**Behavior**:
- Runs every 60 minutes
- Removes sessions older than 24 hours
- Based on `updatedAt` timestamp
- Prevents storage bloat

### Integration with Existing Code

**Message Type Enum**: Added 5 new types to `src/shared/types/index.ts`:
```typescript
export enum MessageType {
  // ... existing types ...

  // Wizard session management
  WIZARD_INIT = 'WIZARD_INIT',
  WIZARD_SAVE_STATE = 'WIZARD_SAVE_STATE',
  WIZARD_LOAD_STATE = 'WIZARD_LOAD_STATE',
  WIZARD_COMPLETE = 'WIZARD_COMPLETE',
  WIZARD_CHECK_WALLET_LOCKED = 'WIZARD_CHECK_WALLET_LOCKED',
}
```

**Message Router**: Added 5 case statements to `handleMessage()` switch in `src/background/index.ts`

**Dependencies**:
- Uses existing `handleCreateMultisigAccount()` for account creation
- Uses existing `isWalletUnlocked()` helper for lock check
- Uses `chrome.storage.local` for persistence
- Uses `chrome.tabs.get()` for tab existence check
- Uses `chrome.alarms` for periodic cleanup

### Security Considerations

**No Sensitive Data Storage**:
- Session stores xpubs and fingerprints (PUBLIC data)
- Does NOT store private keys or seed phrases
- Does NOT store passwords
- Safe to store in `chrome.storage.local` unencrypted

**Session Isolation**:
- Only one session at a time prevents race conditions
- Tab ID verification prevents session hijacking
- Auto-cleanup prevents indefinite storage

**Validation**:
- All inputs validated before storage
- Session structure validated on retrieval
- Corrupted sessions auto-deleted

### Error Handling Patterns

**All methods use try-catch**:
```typescript
try {
  // ... operation ...
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to [operation]: ${message}`);
}
```

**Message handlers return MessageResponse**:
```typescript
return {
  success: false,
  error: error instanceof Error ? error.message : 'Failed to [operation]'
};
```

**Cleanup operations don't fail parent operation**:
```typescript
try {
  await WizardSessionStorage.deleteSession();
} catch (cleanupError) {
  console.warn('Failed to cleanup wizard session:', cleanupError);
  // Continue - cleanup failure shouldn't fail the main operation
}
```

### Testing Considerations

**Test Scenarios**:
1. Create new session → verify session data
2. Create session when one already exists in different tab → verify error
3. Recover session in same tab → verify isRecovery flag
4. Update session → verify state merge and updatedAt
5. Load session with tabId verification → verify tab mismatch error
6. Complete wizard → verify account creation and session cleanup
7. Tab close → verify session cleanup
8. Expired session cleanup → verify age-based deletion

**Manual Testing**:
1. Open wizard in tab → verify session created
2. Reload page → verify session recovered
3. Try to open wizard in second tab → verify error
4. Complete wizard → verify session deleted
5. Close tab → verify session deleted
6. Wait 24 hours → verify session cleaned up

### Performance

**Storage Impact**:
- Single session: ~2-5 KB (depends on number of cosigners)
- Maximum: 1 session at a time
- Auto-cleanup after 24 hours

**Network Impact**: None (local storage only)

**CPU Impact**: Minimal
- Validation on read: O(1) field checks
- Tab existence check: Single API call
- Cleanup: Single storage read/write per hour

### Future Improvements

**Potential Enhancements**:
1. **Session Encryption**: Encrypt session data (not critical, public data only)
2. **Multi-Session Support**: Allow multiple wizards with queue system
3. **Session Recovery UI**: Show recovery prompt on page reload
4. **Session Export**: Allow saving wizard state to file
5. **Analytics**: Track wizard completion rates and drop-off points
6. **Session Timeout Warning**: Notify user before 24-hour expiration

**Known Limitations**:
1. Only one wizard at a time (by design)
2. No session history or undo
3. 24-hour expiration cannot be customized
4. Tab ID is not stable across browser restarts (acceptable)

---

## Implementation Decisions Log

### Decision 0: Migration to Tab-Based Architecture (MAJOR ARCHITECTURAL CHANGE)

**Date**: 2025-10-18

**Context**:
- v0.8.0 and earlier used Chrome action popup (600x400px fixed window)
- Multisig workflows were cramped in popup UI
- Popup closed when user clicked outside (poor UX for long-running operations)
- Limited debugging capabilities with popup lifecycle

**Decision**: Migrate from popup-based to full tab-based architecture

**Changes Implemented**:

1. **manifest.json**:
   - Removed `action.default_popup`
   - Kept only `action.default_icon`
   - Added `downloads` permission for PSBT export

2. **Background Service Worker** (`/src/background/index.ts`):
   - Added `chrome.action.onClicked` listener
   - Implemented tab opening/focusing logic (lines 2985-3016)
   - Added tab lifecycle tracking (`chrome.tabs.onRemoved`)
   - Implemented single tab enforcement system (lines 3018-3167)
   - Added background-to-tab messaging capability (`chrome.tabs.sendMessage`)

3. **Frontend**:
   - Moved all components from `/src/popup/` to `/src/tab/`
   - Created `/src/tab/index.tsx` as entry point
   - Added security checks: clickjacking, tab nabbing, auto-lock on hidden tab
   - Implemented session token system (client-side)

4. **Webpack Configuration**:
   - Changed entry point from `popup: './src/popup/index.tsx'` to `index: './src/tab/index.tsx'`
   - Output changed from `popup.html` to `index.html`
   - Kept `wizard` as separate tab-based entry point

5. **Build Output**:
   - `dist/index.html` (wallet tab, was popup.html)
   - `dist/index.js` (React app bundle)
   - `dist/background.js` (service worker)
   - `dist/wizard.html` and `dist/wizard.js` (multisig wizard)

**Rationale**:

**Pros**:
- Full viewport (no 600x400 constraint) → Better UX for complex workflows
- Persistent state (tabs don't close on outside click) → Easier multisig coordination
- Standard browser tab → Better debugging with DevTools
- Can implement advanced security (session tokens, single-tab enforcement)
- More space for sidebar navigation and multi-screen workflows

**Cons**:
- More attack surface (tabs persist longer) → **Mitigated** with session tokens
- User confusion with multiple tabs → **Mitigated** with single-tab enforcement
- More complex lifecycle management → **Documented** in this file

**Security Enhancements** (enabled by tab architecture):

1. **Single Tab Enforcement**:
   - Cryptographically random session tokens (256-bit)
   - Token validation every 5 seconds
   - Automatic revocation when new tab opens
   - Background-to-tab push notifications

2. **Client-Side Security Checks**:
   - Clickjacking prevention (iframe detection)
   - Tab nabbing prevention (location monitoring every 1s)
   - Auto-lock after 5 minutes when tab hidden
   - Complements background's 15-minute inactivity lock

3. **CSP Hardening**:
   - `frame-ancestors 'none'` prevents embedding
   - `wasm-unsafe-eval` for bitcoinjs-lib

**Breaking Changes**:
- Users must click extension icon to open wallet (no popup on click)
- Extension icon click focuses existing tab instead of opening new popup
- Multiple tabs are prevented by session token system

**Migration Path**:
- No data migration needed (storage format unchanged)
- Seamless upgrade from v0.8.0 to v0.9.0
- Users see new tab-based UI immediately

**Trade-offs Accepted**:
- Security over convenience (single tab only)
- Complexity over simplicity (session token system required)
- Full viewport over minimalism (tabs take more screen space)

**Future Considerations**:
- Could implement multi-tab support for advanced users (with security warnings)
- Could add browser action badge for quick balance display
- Could implement tab-to-tab messaging for multisig coordination across tabs

**References**:
- See "Tab-Based Architecture Overview" section for detailed architecture
- See "Tab Lifecycle Management" for tab opening/closing patterns
- See "Single Tab Enforcement System" for security implementation
- See `TAB_ARCHITECTURE_TESTING_GUIDE.md` for testing procedures

---

### Decision 1: Timeout + Alarm Auto-Lock (Dual Mechanism)

**Date**: 2025-10-12

**Context**: Service workers can terminate unpredictably

**Decision**: Implement BOTH timeout-based and alarm-based auto-lock

**Rationale**:
- Timeout: Accurate (exact 15 minutes), clears on service worker termination (acceptable)
- Alarm: Persistent (survives restarts), 1-minute granularity (acceptable for 15-min timeout)
- Combined: Reliable auto-lock in all scenarios

**Trade-offs**:
- Complexity: Two mechanisms vs. one
- Accuracy: Alarm has 1-minute granularity (acceptable)
- Reliability: Dual mechanism ensures lock (high confidence)

---

### Decision 2: Native SegWit Default Address Type

**Date**: 2025-10-12

**Context**: Users need a default address type for account creation

**Decision**: Default to `'native-segwit'` (BIP84, tb1... addresses)

**Rationale**:
- Lower fees (SegWit witness discount)
- Better privacy (Bech32 format)
- Modern standard (widely supported)
- Testnet: `tb1...` prefix (clear testnet indicator)

**Alternatives Considered**:
- Legacy: Highest compatibility, but higher fees
- SegWit wrapped: Compatibility with older wallets, but not as efficient

---

### Decision 3: First Account Named "Account 1"

**Date**: 2025-10-12

**Context**: Need a user-friendly default account name

**Decision**: First account is "Account 1" (not "Account 0")

**Rationale**:
- UX: Users expect 1-indexed naming ("Account 1", "Account 2", ...)
- Implementation: Internally 0-indexed (accountIndex: 0, 1, 2, ...)
- Consistency: MetaMask uses "Account 1" naming convention

---

### Decision 4: Require Unlock for CREATE_ACCOUNT

**Date**: 2025-10-12

**Context**: Creating a new account requires HD wallet for key derivation

**Decision**: `CREATE_ACCOUNT` requires unlocked wallet

**Rationale**:
- Security: Need decrypted seed for account derivation
- Consistency: All crypto operations require unlock
- UX: User confirms password before adding account

**Alternatives Considered**:
- Prompt for password in CREATE_ACCOUNT payload (duplicate unlock logic)

---

### Decision 5: Update Activity on Every Message

**Date**: 2025-10-12

**Context**: Need to track user activity for auto-lock

**Decision**: Call `updateActivity()` at the start of every message handler

**Rationale**:
- Simple: Single line in `handleMessage()`
- Accurate: Any user interaction resets timer
- Secure: No activity = lock (15 minutes)

**Trade-offs**:
- Includes non-sensitive operations (GET_WALLET_STATE)
- Acceptable: Better to err on side of keeping wallet unlocked during active use

---

### Decision 6: Generic Unlock Error Messages

**Date**: 2025-10-12

**Context**: Balance security vs. user-friendly errors

**Decision**: Return generic "Incorrect password or failed to unlock" error

**Rationale**:
- Security: Don't reveal if wallet exists (timing attacks)
- Security: Don't distinguish wrong password from corruption
- Trade-off: Less helpful, but more secure

**Alternatives Considered**:
- Specific errors: "Wrong password" vs "Corrupted wallet"
- Rejected: Information leakage risk

---

### Decision 7: Return Mnemonic in CREATE_WALLET Response

**Date**: 2025-10-12

**Context**: User needs to back up seed phrase

**Decision**: Return mnemonic in `CREATE_WALLET` response

**Rationale**:
- UX: User must see and back up seed phrase
- Security: Only shown ONCE (not logged, not persisted)
- Implementation: Frontend displays modal with backup flow

**Security Notes**:
- Mnemonic transmitted in message (in-memory only)
- User responsible for backing up (extension cannot back up securely)
- If lost, no recovery (standard crypto wallet behavior)

---

### Decision 8: Store Addresses in Account Object

**Date**: 2025-10-12

**Context**: Need to track generated addresses

**Decision**: Store all generated addresses in `account.addresses[]`

**Rationale**:
- Simplicity: All account data in one place
- Performance: No separate address lookup
- Storage: Addresses are small (~150 bytes each)

**Alternatives Considered**:
- Separate storage key for addresses (more complex, no benefit)

**Trade-offs**:
- Storage size: Grows with addresses (acceptable, 60k+ capacity)
- Read performance: Load all addresses on unlock (acceptable for MVP)

---

### Decision 9: Exponential Backoff with Limited Retries

**Date**: 2025-10-12

**Context**: Blockstream API can be unreliable (network errors, rate limiting)

**Decision**: Implement retry logic with exponential backoff (1s, 2s, 4s delays)

**Rationale**:
- Resilience: Transient network errors are common (retry helps)
- Exponential backoff: Reduces server load, avoids rate limiting
- Limited retries: 3 attempts total (avoid infinite loops)
- Smart retry: Skip non-retryable errors (404, invalid address)

**Trade-offs**:
- Latency: Max 7 seconds added delay (1 + 2 + 4)
- Acceptable: Better than failing immediately on transient errors

**Implementation**:
```typescript
private retryDelays: number[] = [1000, 2000, 4000]; // 1s, 2s, 4s
```

---

### Decision 10: 10-Second Request Timeout

**Date**: 2025-10-12

**Context**: API requests can hang indefinitely

**Decision**: Set 10-second timeout for all API requests

**Rationale**:
- UX: Users shouldn't wait forever
- Resource management: Prevent stuck requests in service worker
- Reasonable: Most API calls complete in <2 seconds
- Fail-fast: Better to show error than hang UI

**Alternatives Considered**:
- 30 seconds: Too long for user experience
- 5 seconds: Too short for slow networks
- No timeout: Risk of hanging indefinitely

---

### Decision 11: Parse Transaction Value Relative to Address

**Date**: 2025-10-12

**Context**: Transactions have multiple inputs/outputs, need to calculate value change for specific address

**Decision**: Calculate value as `outputs_to_address - inputs_from_address`

**Rationale**:
- Received transaction: Positive value (more outputs than inputs)
- Sent transaction: Negative value (more inputs than outputs)
- Internal transfer: Near-zero (inputs ≈ outputs, minus fee)
- User-friendly: Shows net change for the address

**Example**:
```typescript
// Received 100k sats to tb1q...
value = 100000 (outputs) - 0 (inputs) = +100000

// Sent 50k sats from tb1q...
value = 0 (outputs) - 50000 (inputs) = -50000
```

---

### Decision 12: Singleton Testnet Client Export

**Date**: 2025-10-12

**Context**: Most of the extension uses testnet by default

**Decision**: Export singleton `blockstreamClient` for convenience

**Rationale**:
- Convenience: No need to instantiate for common use
- Default network: Testnet matches extension default
- Still flexible: Can create custom instance for mainnet

**Usage**:
```typescript
// Default testnet
import { blockstreamClient } from './api/BlockstreamClient';

// Custom network
import { BlockstreamClient } from './api/BlockstreamClient';
const mainnetClient = new BlockstreamClient('mainnet');
```

---

## Future Enhancements

### Phase 2: ✅ COMPLETE - Bitcoin Operations

1. ✅ **DONE**: Implement Blockstream API client with retry logic
2. ✅ **DONE**: Integrate API client into message handlers:
   - ✅ `GET_BALANCE` handler implemented
   - ✅ `GET_TRANSACTIONS` handler implemented
   - ✅ `GET_FEE_ESTIMATES` handler implemented
   - ✅ `SEND_TRANSACTION` handler implemented (includes TransactionBuilder)
   - ✅ `UNLOCK_WALLET` now fetches real balance
3. **TODO**: Implement address discovery (BIP44 gap limit scanning)
4. **TODO**: Add response caching (5-minute TTL for balances)
5. **TODO**: Add request queuing/rate limiting
6. **TODO**: Update `GENERATE_ADDRESS` to check address usage

### Phase 4: Advanced Features

1. Multi-network support (testnet/mainnet switching)
2. Multiple address types per account
3. Watch-only accounts (xpub import)
4. Hardware wallet support (via WebUSB)
5. Transaction history filtering
6. Export transaction history (CSV)

### Phase 5: Optimization & Polish

1. Address caching (reduce API calls)
2. Transaction caching (local history)
3. Batch address generation (gap limit)
4. Improved error messages (error codes)
5. Logging infrastructure (debug levels)
6. Performance monitoring

---

## Testing Plan

### Unit Tests (TODO)

**Message Handlers**:
- `CREATE_WALLET` - Valid/invalid inputs, existing wallet check
- `IMPORT_WALLET` - Valid/invalid mnemonic, existing wallet check
- `UNLOCK_WALLET` - Correct/incorrect password
- `LOCK_WALLET` - State cleared correctly
- `CREATE_ACCOUNT` - Sequential accounts, naming
- `UPDATE_ACCOUNT_NAME` - Valid/invalid account index
- `GENERATE_ADDRESS` - External/internal addresses, indexing

**Encryption**:
- `CryptoUtils.encrypt()` - Different plaintexts/passwords
- `CryptoUtils.decrypt()` - Correct/incorrect password, corrupted data

**HD Wallet**:
- `KeyManager.generateMnemonic()` - Entropy validation
- `KeyManager.validateMnemonic()` - Valid/invalid phrases
- `HDWallet.derivePath()` - All address types, all coin types
- `AddressGenerator.generateAddress()` - All address types, network validation

**Storage**:
- `WalletStorage.createWallet()` - Duplicate check, encryption
- `WalletStorage.unlockWallet()` - Password verification
- `WalletStorage.updateAccount()` - Account not found, validation

### Integration Tests (TODO)

1. **Wallet Creation Flow**:
   - Create wallet → Unlock → Create account → Generate address

2. **Wallet Import Flow**:
   - Import wallet → Unlock → Verify first address

3. **Auto-Lock**:
   - Unlock → Wait 15 minutes → Verify locked

4. **Service Worker Restart**:
   - Unlock → Restart extension → Verify locked

5. **Multi-Account**:
   - Create wallet → Create 5 accounts → Verify unique addresses

### Manual Testing (TODO)

1. Load extension in Chrome
2. Create new wallet (verify mnemonic shown once)
3. Lock and unlock wallet (verify password)
4. Create multiple accounts (verify naming)
5. Generate addresses (verify correct prefixes)
6. Restart extension (verify auto-lock)
7. Import wallet (verify same addresses)

---

## Collaboration Notes

### With Frontend Developer

**Shared Types**: `src/shared/types/index.ts`
- `MessageType` enum (all message types)
- `Message<T>` interface (request structure)
- `MessageResponse<T>` interface (response structure)
- `Account`, `Address`, `Balance` types

**Message Contract**: Frontend sends messages, backend responds:
```typescript
// Frontend
const response = await chrome.runtime.sendMessage({
  type: MessageType.CREATE_WALLET,
  payload: { password, addressType }
});

if (response.success) {
  // response.data contains mnemonic and firstAddress
}
```

**Integration Points**:
- Wallet creation flow (show mnemonic backup)
- Unlock screen (password input)
- Account management (create, rename)
- Address display (receive screen)

### With Blockchain Expert

**Collaboration Areas**:
- HD wallet derivation paths (BIP32/44/49/84)
- Address generation for all types
- Transaction building (future phase)
- UTXO selection strategies (future)

**Implemented Together**:
- `KeyManager` - BIP39 operations
- `HDWallet` - BIP32/44 derivation
- `AddressGenerator` - All address types

### With Security Expert

**Collaboration Areas**:
- Encryption implementation (AES-256-GCM)
- Key derivation (PBKDF2 parameters)
- Auto-lock timing and mechanisms
- Memory clearing strategies

**Implemented Together**:
- `CryptoUtils` - Encryption/decryption
- `WalletStorage` - Secure storage patterns
- Auto-lock functionality
- In-memory state management

### With Testing Expert

**Collaboration Areas**:
- Unit test structure for message handlers
- Mocking Chrome APIs (storage, runtime, alarms)
- Service worker lifecycle testing
- Encryption/decryption testing

**TODO**: Work together on test implementation

---

## References

### Documentation
- `ARCHITECTURE.md` - Full system architecture
- `CLAUDE.md` - Development guidelines
- `prompts/blockchain-expert-notes.md` - Bitcoin implementation details
- `prompts/security-expert-notes.md` - Security specifications

### External Resources
- Chrome Extension APIs: https://developer.chrome.com/docs/extensions/reference/
- Service Worker Lifecycle: https://developer.chrome.com/docs/extensions/mv3/service_workers/
- bitcoinjs-lib: https://github.com/bitcoinjs/bitcoinjs-lib
- BIP32: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
- BIP39: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- BIP44: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki

---

## Multisig Wallet Support

### Overview

**Status**: IMPLEMENTED (2025-10-12)

The backend now supports multi-signature wallets following BIP48, BIP67, and BIP174 standards. Multisig functionality allows multiple co-signers to collectively control Bitcoin funds, requiring M-of-N signatures to spend.

**Supported Configurations**:
- 2-of-2: Both signatures required (high security, single point of failure)
- 2-of-3: Any 2 of 3 signatures required (recommended for most users)
- 3-of-5: Any 3 of 5 signatures required (best for organizations)

**Supported Address Types**:
- P2SH: Legacy multisig (starts with '3' on mainnet, '2' on testnet)
- P2WSH: Native SegWit multisig (starts with 'bc1' on mainnet, 'tb1' on testnet)
- P2SH-P2WSH: Wrapped SegWit multisig (P2SH wrapping P2WSH)

---

### MultisigManager Class

**Location**: `src/background/wallet/MultisigManager.ts`

**Responsibilities**:
1. Create multisig accounts with M-of-N configurations
2. Validate and import co-signer extended public keys (xpubs)
3. Export our xpub for sharing with co-signers
4. Validate multisig configurations
5. Manage co-signer information
6. Generate BIP48 derivation paths

#### Key Methods

**createMultisigAccount()**
```typescript
createMultisigAccount(params: {
  config: MultisigConfig;              // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType;    // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  name: string;                        // Account name
  accountIndex: number;                // BIP48 account index
  ourXpub: string;                     // Our extended public key
  ourFingerprint: string;              // Our key fingerprint
  cosignerXpubs: Array<{               // Co-signer public keys
    name: string;
    xpub: string;
    fingerprint: string;
  }>;
}): MultisigAccount
```

**Workflow**:
1. Validates configuration (2-of-2, 2-of-3, or 3-of-5)
2. Verifies correct number of co-signers (N total including us)
3. Validates all xpubs (format, network, public key only)
4. Creates cosigner list (us first, then others per BIP67)
5. Returns MultisigAccount structure

**Security Notes**:
- Only handles public keys (xpubs) - never private keys
- Validates xpub network prefix matches (testnet: tpub/vpub/upub, mainnet: xpub/ypub/zpub)
- Rejects private keys (xprv) if provided
- Verifies fingerprints can be derived from xpubs

---

**exportOurXpub()**
```typescript
exportOurXpub(
  masterNode: BIP32Interface,
  config: MultisigConfig,
  addressType: MultisigAddressType,
  accountIndex: number
): { xpub: string; fingerprint: string }
```

**Workflow**:
1. Generates BIP48 derivation path for the configuration
2. Derives account node from master node
3. Extracts neutered (public-only) extended key
4. Calculates fingerprint (first 4 bytes of hash160 of public key)
5. Returns xpub and fingerprint for sharing

**Use Case**: Share your xpub with co-signers so they can create the same multisig account on their wallets.

---

**validateXpub()**
```typescript
validateXpub(xpub: string): void
```

**Validations**:
1. Parses xpub using BIP32
2. Verifies it's a public key (not private)
3. Checks network prefix matches (testnet vs mainnet)
4. Throws descriptive errors if invalid

**Network Prefixes**:
- Testnet: tpub (BIP44), vpub (BIP49), upub (BIP84)
- Mainnet: xpub (BIP44), ypub (BIP49), zpub (BIP84)

---

**getDerivationPath()**
```typescript
getDerivationPath(
  config: MultisigConfig,
  addressType: MultisigAddressType,
  accountIndex: number
): string
```

**BIP48 Path Format**: `m/48'/coin_type'/account'/script_type'`

**Script Type Mapping**:
- P2SH: script_type = 1
- P2WSH: script_type = 2
- P2SH-P2WSH: script_type = 1 (same as P2SH)

**Example Paths**:
```
Testnet 2-of-3 P2WSH Account 0: m/48'/1'/0'/2'
Mainnet 3-of-5 P2SH Account 1: m/48'/0'/1'/1'
```

**Coin Types**:
- Mainnet: 0
- Testnet: 1

---

**importCosignerXpub()**
```typescript
importCosignerXpub(
  xpub: string,
  name: string
): Omit<Cosigner, 'derivationPath' | 'isSelf'>
```

**Workflow**:
1. Validates the xpub
2. Parses to extract fingerprint
3. Returns cosigner object (partial - caller must add derivationPath and isSelf)

**Use Case**: Import a co-signer's xpub that they shared with you.

---

#### Storage Integration

**MultisigAccount Type**:
```typescript
interface MultisigAccount {
  accountType: 'multisig';
  index: number;
  name: string;
  multisigConfig: MultisigConfig;    // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType;  // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  cosigners: Cosigner[];             // All co-signers (including us)
  externalIndex: number;             // Next receiving address index
  internalIndex: number;             // Next change address index
  addresses: MultisigAddress[];      // Generated addresses
}
```

**Cosigner Type**:
```typescript
interface Cosigner {
  name: string;           // User-friendly name
  xpub: string;           // Extended public key
  fingerprint: string;    // Key fingerprint (8 hex chars)
  derivationPath: string; // BIP48 path
  isSelf: boolean;        // true if this is our key
}
```

**MultisigAddress Type**:
```typescript
interface MultisigAddress extends Address {
  address: string;
  derivationPath: string;
  index: number;
  isChange: boolean;
  used: boolean;
  redeemScript?: string;   // For P2SH and P2SH-P2WSH (hex)
  witnessScript?: string;  // For P2WSH and P2SH-P2WSH (hex)
}
```

**Storage Schema V2**:
```typescript
interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;
  salt: string;
  iv: string;
  accounts: WalletAccount[];          // Union of Account | MultisigAccount
  pendingMultisigTxs: PendingMultisigTx[];  // Pending PSBTs
  settings: WalletSettings;
}
```

---

### PSBTManager Class

**Location**: `src/background/bitcoin/PSBTManager.ts`

**Responsibilities**:
1. Export PSBTs in multiple formats (base64, hex)
2. Split PSBTs into QR-compatible chunks for air-gapped signing
3. Reassemble PSBTs from chunks
4. Import and validate PSBTs from co-signers
5. Track pending multisig transactions
6. Provide PSBT metadata and summaries

#### Key Methods

**exportPSBT()**
```typescript
exportPSBT(psbt: bitcoin.Psbt): PSBTExport
```

**Returns**:
```typescript
interface PSBTExport {
  base64: string;          // Standard PSBT format
  hex: string;             // Alternative format
  txid: string;            // Transaction ID
  numInputs: number;       // Input count
  numOutputs: number;      // Output count
  totalOutput: number;     // Total output amount (satoshis)
  fee: number;             // Fee (satoshis)
  signatures: number[];    // Signature count per input
  finalized: boolean;      // Whether PSBT is finalized
}
```

**Use Case**: Export PSBT for sharing with co-signers via file, QR code, or direct transfer.

---

**importPSBT()**
```typescript
importPSBT(psbtString: string): PSBTImportResult
```

**Returns**:
```typescript
interface PSBTImportResult {
  psbt: bitcoin.Psbt;      // Parsed PSBT object
  txid: string;            // Transaction ID
  warnings: string[];      // Validation warnings
  isValid: boolean;        // Whether PSBT is valid
}
```

**Format Detection**:
- Tries base64 first (most common)
- Falls back to hex if base64 fails
- Validates format with regex patterns

**Validations**:
- All inputs have UTXO data (witnessUtxo or nonWitnessUtxo)
- Transaction has outputs
- Output values are positive
- PSBT structure is valid

**Use Case**: Import a PSBT from a co-signer for signing or merging.

---

**createPSBTChunks()**
```typescript
createPSBTChunks(psbt: bitcoin.Psbt): PSBTChunk[]
```

**Returns**:
```typescript
interface PSBTChunk {
  index: number;    // Chunk number (1-based)
  total: number;    // Total chunks
  data: string;     // Base64 chunk data
  txid: string;     // Transaction ID for reassembly
}
```

**Parameters**:
- Chunk size: 2500 bytes (fits in standard QR code)
- Encoding: Base64

**Use Case**: Split large PSBTs for QR code display to air-gapped signing devices.

---

**reassemblePSBTChunks()**
```typescript
reassemblePSBTChunks(chunks: PSBTChunk[]): bitcoin.Psbt
```

**Validations**:
- All chunks have same txid
- All chunks have same total count
- No missing chunks
- No duplicate chunks
- Chunks can be in any order (sorted by index)

**Use Case**: Reassemble a PSBT scanned from multiple QR codes.

---

**createPendingTransaction()**
```typescript
createPendingTransaction(
  psbt: bitcoin.Psbt,
  multisigAccountId: string,
  m: number,
  n: number,
  description?: string
): PendingMultisigTx
```

**Returns**:
```typescript
interface PendingMultisigTx {
  txid: string;
  psbtBase64: string;
  multisigAccountId: string;
  requiredSignatures: number;      // M
  totalCosigners: number;          // N
  currentSignatures: number[];     // Signature count per input
  recipientAddress: string;
  amount: number;
  fee: number;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'ready';
  description?: string;
}
```

**Use Case**: Track PSBTs awaiting signatures from co-signers.

---

**updatePendingTransaction()**
```typescript
updatePendingTransaction(
  pending: PendingMultisigTx,
  signedPsbt: bitcoin.Psbt
): PendingMultisigTx
```

**Updates**:
- psbtBase64 with new signatures
- currentSignatures array
- updatedAt timestamp
- status ('pending' → 'ready' when finalized)

**Use Case**: Update pending transaction when a co-signer adds their signature.

---

**validateMultisigPSBT()**
```typescript
validateMultisigPSBT(
  psbt: bitcoin.Psbt,
  expectedM: number,
  expectedN: number,
  expectedAddresses?: string[]
): { valid: boolean; errors: string[] }
```

**Validations**:
1. Each input has redeem script or witness script
2. Multisig script contains correct M and N values
3. Input addresses match expected addresses (if provided)
4. Script structure is valid

**Use Case**: Verify a PSBT matches the multisig configuration before signing.

---

**getPSBTSummary()**
```typescript
getPSBTSummary(psbt: bitcoin.Psbt): {
  txid: string;
  numInputs: number;
  numOutputs: number;
  totalOutput: number;
  fee: number;
  signatures: { input: number; count: number; required?: number }[];
  finalized: boolean;
}
```

**Use Case**: Display human-readable PSBT information in UI.

---

#### QR Code Chunking

**Strategy**: Split PSBTs into 2500-byte base64 chunks for QR code encoding.

**Standard QR Code Capacity**:
- Version 40 (largest): ~2953 bytes in binary mode
- Safety margin: 2500 bytes per chunk

**Chunk Format**:
```typescript
{
  index: 2,           // This is chunk 2
  total: 5,           // Out of 5 total chunks
  data: "cHNidP8...", // Base64 chunk
  txid: "a3b2c1..."   // For reassembly validation
}
```

**Use Cases**:
- Air-gapped hardware wallets
- Cold storage devices
- Paper backups
- Mobile-to-desktop transfers

---

### TransactionBuilder Multisig Integration

**Location**: `src/background/bitcoin/TransactionBuilder.ts`

The TransactionBuilder class has been extended with multisig PSBT support:

#### Multisig Methods

**buildMultisigPSBT()**
```typescript
async buildMultisigPSBT(params: {
  multisigAddresses: MultisigAddress[];
  utxos: UTXO[];
  outputs: { address: string; amount: number }[];
  changeAddress: string;
  feeRate: number;
  m: number;
  n: number;
  addressType: MultisigAddressType;
}): Promise<bitcoin.Psbt>
```

**Workflow**:
1. Validates output amounts and addresses
2. Selects UTXOs using multisig size estimation
3. Creates unsigned PSBT
4. Adds multisig inputs with proper scripts
5. Adds recipient and change outputs
6. Returns unsigned PSBT for distribution

**Key Difference from Single-Sig**:
- Uses `estimateMultisigSize()` instead of `estimateSize()`
- Calls `addMultisigInputToPSBT()` instead of `addInputToPSBT()`
- Does not sign (returns unsigned PSBT)

---

**addMultisigInputToPSBT()**
```typescript
private async addMultisigInputToPSBT(
  psbt: bitcoin.Psbt,
  utxo: UTXO,
  multisigAddresses: MultisigAddress[],
  m: number,
  n: number,
  addressType: MultisigAddressType
): Promise<void>
```

**Script Attachment Strategy**:
- **P2SH**: Adds redeemScript to input
- **P2WSH**: Adds witnessScript to input
- **P2SH-P2WSH**: Adds both redeemScript and witnessScript

**Script Sources**:
- Scripts come from MultisigAddress.redeemScript / witnessScript
- Scripts are stored when address is generated
- Scripts are required for PSBT signing

---

**signMultisigPSBT()**
```typescript
async signMultisigPSBT(
  psbt: bitcoin.Psbt,
  publicKeys: Buffer[],
  privateKey: Buffer
): Promise<bitcoin.Psbt>
```

**Workflow**:
1. Sorts public keys per BIP67 (deterministic ordering)
2. Creates ECPair from private key
3. Finds which public key index corresponds to this private key
4. Signs all inputs with this key
5. Validates each signature
6. Returns PSBT with new signatures added

**Partial Signing**:
- Can be called on unsigned PSBT (adds first signature)
- Can be called on partially signed PSBT (adds additional signature)
- Skips inputs already signed by this key
- Each co-signer calls this with their own key

---

**mergePSBTs()** (static)
```typescript
static mergePSBTs(psbts: bitcoin.Psbt[]): bitcoin.Psbt
```

**Workflow**:
1. Validates at least one PSBT provided
2. Clones first PSBT
3. Combines each subsequent PSBT using `psbt.combine()`
4. Returns merged PSBT with all signatures

**Use Case**: Combine PSBTs from multiple co-signers into one PSBT with all signatures.

**Example**:
```typescript
// Co-signer 1 signs
const psbt1 = await txBuilder.signMultisigPSBT(psbt, pubkeys, key1);

// Co-signer 2 signs
const psbt2 = await txBuilder.signMultisigPSBT(psbt, pubkeys, key2);

// Merge signatures
const merged = TransactionBuilder.mergePSBTs([psbt1, psbt2]);
```

---

**hasEnoughSignatures()** (static)
```typescript
static hasEnoughSignatures(psbt: bitcoin.Psbt, m: number): boolean
```

**Logic**: Returns true if all inputs have at least M signatures.

**Use Case**: Check if PSBT is ready for finalization.

---

**finalizeMultisigPSBT()**
```typescript
async finalizeMultisigPSBT(psbt: bitcoin.Psbt, m: number): Promise<string>
```

**Workflow**:
1. Verifies PSBT has enough signatures (M per input)
2. Finalizes all inputs (converts partial sigs to final scriptSig/witness)
3. Extracts transaction
4. Returns transaction hex ready for broadcast

**Error Handling**: Throws if not enough signatures with detailed count per input.

---

**estimateMultisigSize()**
```typescript
estimateMultisigSize(params: {
  numInputs: number;
  numOutputs: number;
  m: number;
  n: number;
  addressType: MultisigAddressType;
}): SizeEstimate
```

**Size Calculations**:

**P2SH Multisig**:
- Base input: 32 (txid) + 4 (vout) + 1 (length) + 4 (sequence)
- scriptSig: M signatures (~73 bytes each) + redeemScript (N * 34 + 3 bytes)
- No witness data

**P2WSH Multisig**:
- Base input: 32 (txid) + 4 (vout) + 1 (empty) + 4 (sequence)
- Witness: M signatures + witnessScript
- SegWit marker + flag

**P2SH-P2WSH Multisig**:
- Base input: 32 (txid) + 4 (vout) + 34 (redeemScript) + 4 (sequence)
- Witness: M signatures + witnessScript
- SegWit marker + flag

**Output Sizes**:
- SegWit outputs: ~43 bytes each
- Legacy outputs: ~32 bytes each

**vSize Calculation**:
- Weight = base_size * 3 + total_size
- vSize = ceil(weight / 4)

---

### Message Handler Extensions

**Location**: `src/background/index.ts` (when implemented)

The following message handlers need to be implemented for multisig support:

#### CREATE_MULTISIG_ACCOUNT

**Payload**:
```typescript
{
  config: MultisigConfig;           // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType; // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  name: string;                     // Account name
  cosignerXpubs: Array<{            // Co-signer xpubs (excluding ours)
    name: string;
    xpub: string;
  }>;
}
```

**Returns**:
```typescript
{
  account: MultisigAccount;
  firstAddress: string;
}
```

**Workflow**:
1. Check wallet is unlocked
2. Validate configuration and cosigner count
3. Determine next account index
4. Export our xpub using MultisigManager
5. Import and validate all cosigner xpubs
6. Create MultisigAccount with all cosigners
7. Generate first receiving address
8. Save account to storage
9. Return account and first address

---

#### EXPORT_OUR_XPUB

**Payload**:
```typescript
{
  config: MultisigConfig;
  addressType: MultisigAddressType;
  accountIndex: number;
}
```

**Returns**:
```typescript
{
  xpub: string;
  fingerprint: string;
  derivationPath: string;
}
```

**Workflow**:
1. Check wallet is unlocked
2. Get HD wallet master node
3. Call MultisigManager.exportOurXpub()
4. Return xpub, fingerprint, and derivation path

---

#### IMPORT_COSIGNER_XPUB

**Payload**:
```typescript
{
  accountIndex: number;
  cosignerName: string;
  xpub: string;
}
```

**Returns**:
```typescript
{
  cosigner: Cosigner;
}
```

**Workflow**:
1. Check wallet is unlocked
2. Validate xpub using MultisigManager
3. Import xpub and extract fingerprint
4. Create Cosigner object
5. Add to account's cosigner list
6. Save updated account
7. Return cosigner

---

#### BUILD_MULTISIG_PSBT

**Payload**:
```typescript
{
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
}
```

**Returns**:
```typescript
{
  psbt: PSBTExport;
  pendingTx: PendingMultisigTx;
}
```

**Workflow**:
1. Check wallet is unlocked
2. Find multisig account
3. Fetch UTXOs for all addresses in account
4. Get multisig addresses with scripts
5. Build unsigned PSBT using TransactionBuilder.buildMultisigPSBT()
6. Export PSBT using PSBTManager.exportPSBT()
7. Create pending transaction record
8. Save to storage
9. Return PSBT and pending tx

---

#### SIGN_PSBT

**Payload**:
```typescript
{
  psbtBase64: string;
  accountIndex: number;
}
```

**Returns**:
```typescript
{
  psbt: PSBTExport;
  hasEnoughSignatures: boolean;
}
```

**Workflow**:
1. Check wallet is unlocked
2. Import PSBT using PSBTManager
3. Find multisig account
4. Get all cosigner public keys
5. Derive our private key
6. Sign PSBT using TransactionBuilder.signMultisigPSBT()
7. Check if enough signatures
8. Export updated PSBT
9. Update pending transaction if exists
10. Return PSBT and signature status

---

#### MERGE_PSBTS

**Payload**:
```typescript
{
  psbtBase64Array: string[];
}
```

**Returns**:
```typescript
{
  psbt: PSBTExport;
  hasEnoughSignatures: boolean;
}
```

**Workflow**:
1. Import all PSBTs using PSBTManager
2. Merge using TransactionBuilder.mergePSBTs()
3. Check signature count
4. Export merged PSBT
5. Return merged PSBT and status

---

#### FINALIZE_AND_BROADCAST_MULTISIG

**Payload**:
```typescript
{
  psbtBase64: string;
  accountIndex: number;
}
```

**Returns**:
```typescript
{
  txid: string;
  txHex: string;
}
```

**Workflow**:
1. Check wallet is unlocked
2. Import PSBT
3. Find multisig account (get M value)
4. Verify enough signatures
5. Finalize PSBT using TransactionBuilder.finalizeMultisigPSBT()
6. Broadcast transaction using BlockstreamClient
7. Remove from pending transactions
8. Return txid and hex

---

#### GET_PENDING_MULTISIG_TXS

**Payload**: None

**Returns**:
```typescript
{
  pendingTxs: PendingMultisigTx[];
}
```

**Workflow**:
1. Read from storage
2. Return all pending multisig transactions

---

#### DELETE_PENDING_MULTISIG_TX

**Payload**:
```typescript
{
  txid: string;
}
```

**Returns**:
```typescript
{
  success: true;
}
```

**Workflow**:
1. Find pending transaction by txid
2. Remove from storage
3. Return success

---

### API Patterns and Design Decisions

#### 1. Separation of Concerns

**MultisigManager**: Handles account creation, xpub management, validation
**PSBTManager**: Handles PSBT lifecycle, export/import, tracking
**TransactionBuilder**: Handles transaction building, signing, finalization

**Rationale**: Clear boundaries make testing easier and code more maintainable.

---

#### 2. Async/Await Throughout

All methods that perform cryptographic operations or I/O use async/await:
```typescript
async buildMultisigPSBT(...): Promise<bitcoin.Psbt>
async signMultisigPSBT(...): Promise<bitcoin.Psbt>
async finalizeMultisigPSBT(...): Promise<string>
```

**Rationale**: Consistent async pattern, future-proof for async crypto operations.

---

#### 3. Validation Layers

**Three layers of validation**:
1. **Input validation**: Check parameters are provided and have correct types
2. **Business logic validation**: Check configuration rules (e.g., correct number of cosigners)
3. **Cryptographic validation**: Verify xpubs, signatures, scripts

**Example** (from MultisigManager.createMultisigAccount):
```typescript
// Layer 1: Input validation
this.validateConfig(params.config);

// Layer 2: Business logic validation
if (totalCosigners !== configDetails.n) {
  throw new Error(`${params.config} requires ${configDetails.n} co-signers`);
}

// Layer 3: Cryptographic validation
this.validateXpub(params.ourXpub);
```

---

#### 4. Comprehensive Error Messages

All errors include context and actionable information:
```typescript
throw new Error(
  `${params.config} requires ${configDetails.n} co-signers, ` +
  `but ${totalCosigners} provided`
);
```

**Rationale**: Helps debugging and provides user-friendly errors.

---

#### 5. Immutable Operations

Methods that transform PSBTs return new instances rather than mutating:
```typescript
// Clone before merging
const merged = psbts[0].clone();
for (let i = 1; i < psbts.length; i++) {
  merged.combine(psbts[i]);
}
return merged;
```

**Rationale**: Prevents unintended side effects, makes debugging easier.

---

#### 6. Static Utility Methods

Helper methods that don't depend on instance state are static:
```typescript
static mergePSBTs(psbts: bitcoin.Psbt[]): bitcoin.Psbt
static countSignatures(psbt: bitcoin.Psbt): number[]
static hasEnoughSignatures(psbt: bitcoin.Psbt, m: number): boolean
```

**Rationale**: Can be used independently, signals no side effects.

---

### Integration Points

#### HDWallet Integration

**MultisigManager uses HDWallet for**:
- Deriving account nodes from master node
- Exporting xpubs at BIP48 paths
- Getting master fingerprint

**Example**:
```typescript
const masterNode = hdWallet.getMasterNode();
const { xpub, fingerprint } = multisigManager.exportOurXpub(
  masterNode,
  config,
  addressType,
  accountIndex
);
```

---

#### TransactionBuilder Integration

**PSBTManager provides metadata for TransactionBuilder**:
```typescript
const exported = psbtManager.exportPSBT(psbt);
// Returns: base64, hex, txid, fee, signatures, finalized status

const summary = psbtManager.getPSBTSummary(psbt);
// Returns: Human-readable PSBT information
```

**TransactionBuilder uses PSBTManager for**:
- Exporting PSBTs after building
- Creating pending transaction records
- Updating pending transactions with new signatures

---

#### AddressGenerator Integration

**MultisigManager validates addresses using AddressGenerator**:
```typescript
// In TransactionBuilder.buildMultisigPSBT()
if (!this.addressGenerator.validateAddress(output.address)) {
  throw new Error(`Invalid recipient address: ${output.address}`);
}
```

**Note**: AddressGenerator needs multisig address generation support (separate implementation).

---

#### Storage Integration

**MultisigAccount stored in WalletAccount union type**:
```typescript
type WalletAccount = Account | MultisigAccount;

interface StoredWalletV2 {
  version: 2;
  accounts: WalletAccount[];          // Can contain both types
  pendingMultisigTxs: PendingMultisigTx[];
  // ... other fields
}
```

**Storage migrations**: Version 1 to Version 2 requires adding:
- pendingMultisigTxs array (empty initially)
- Support for MultisigAccount in accounts array

---

### Security Considerations

#### 1. Public Key Only Operations

**MultisigManager never handles private keys**:
- Only imports/exports xpubs (public keys)
- Validates that provided keys are public (rejects xprv)
- Fingerprints derived from public keys only

**Rationale**: Limits attack surface, follows principle of least privilege.

---

#### 2. Signature Validation

**Every signature is validated immediately after signing**:
```typescript
psbt.signInput(i, signer);

const isValid = psbt.validateSignaturesOfInput(i, validator);
if (!isValid) {
  throw new Error(`Signature validation failed for input ${i}`);
}
```

**Rationale**: Catches signing errors before broadcast, prevents invalid transactions.

---

#### 3. Script Verification

**PSBTManager validates multisig scripts**:
- Checks M and N values match expected configuration
- Verifies script structure is valid multisig
- Validates input addresses match expected addresses

**Rationale**: Prevents signing PSBTs with incorrect multisig parameters.

---

#### 4. Fingerprint Verification

**Cosigner fingerprints used for tracking**:
- Derived from xpub (not user-provided)
- Used to identify which cosigner signed
- Displayed in UI for manual verification

**Rationale**: Users should verify fingerprints match when setting up multisig (prevents MITM attacks).

---

#### 5. PSBT Import Validation

**All imported PSBTs undergo validation**:
- Format validation (base64/hex)
- Structure validation (inputs have UTXOs)
- Content validation (outputs, values)
- Warnings returned for issues

**Rationale**: Prevents importing malicious or malformed PSBTs.

---

### Performance Optimizations

#### 1. Lazy Signature Counting

**Signatures counted only when needed**:
```typescript
// Only count when checking if ready to finalize
if (TransactionBuilder.hasEnoughSignatures(psbt, m)) {
  await txBuilder.finalizeMultisigPSBT(psbt, m);
}
```

**Rationale**: Avoids unnecessary computation.

---

#### 2. Chunk Reassembly Validation

**Chunks validated incrementally during reassembly**:
- txid checked per chunk (fail fast on mismatch)
- Sorted once (O(n log n))
- Deduplicated with Set (O(n))

**Rationale**: Catches errors early, efficient algorithms.

---

#### 3. Size Estimation Caching

**TransactionBuilder estimates size once during UTXO selection**:
```typescript
const estimatedSize = this.estimateMultisigSize({...});
const fee = Math.ceil(estimatedSize.virtualSize * feeRate);
```

**Rationale**: Avoids recalculating size for each UTXO iteration.

---

### Known Limitations and Future Enhancements

#### Current Limitations

1. **No Address Generation**: Multisig address generation not yet implemented in AddressGenerator
   - **TODO**: Add MultisigAddressGenerator class
   - **Priority**: High (required for receive flow)

2. **No PSBT Caching**: PSBTs re-parsed on every operation
   - **TODO**: Cache parsed PSBTs in memory
   - **Priority**: Low (performance optimization)

3. **Fixed QR Chunk Size**: 2500 bytes may not be optimal for all QR scanners
   - **TODO**: Make chunk size configurable
   - **Priority**: Low (2500 bytes works for most cases)

4. **No Timelock Support**: Multisig PSBTs don't support timelocks or sequence numbers
   - **TODO**: Add timelock support to buildMultisigPSBT
   - **Priority**: Low (advanced feature)

5. **Basic Fee Estimation**: Multisig size estimation is approximate
   - **TODO**: More accurate size calculation based on actual scripts
   - **Priority**: Medium (affects fee accuracy)

---

#### Future Enhancements

1. **Hardware Wallet Integration**:
   - Export PSBTs to hardware wallets via USB/Bluetooth
   - Import signed PSBTs from hardware wallets
   - Display signing instructions per device

2. **Cosigner Management UI**:
   - Add/remove cosigners
   - Track cosigner activity (last signed, signing frequency)
   - Cosigner permissions (spending limits)

3. **Advanced PSBT Features**:
   - Partial amount PSBTs (sign subset of inputs)
   - PSBT templates (reusable payment requests)
   - PSBT metadata (notes, labels, attachments)

4. **Multi-Device Coordination**:
   - Cloud PSBT storage (encrypted)
   - Push notifications for pending PSBTs
   - Automatic PSBT merging

5. **Enhanced Security**:
   - PSBT expiration (auto-delete old PSBTs)
   - Spending limits per cosigner
   - Multi-factor auth for signing
   - Audit log of all signatures

---

### Testing Strategy

#### Unit Tests for MultisigManager

**Test Coverage**:
- [x] createMultisigAccount() with valid params
- [x] createMultisigAccount() with invalid config
- [x] createMultisigAccount() with wrong cosigner count
- [x] validateXpub() with valid xpub
- [x] validateXpub() with invalid xpub
- [x] validateXpub() with private key (xprv)
- [x] validateXpub() with wrong network
- [x] exportOurXpub() for all address types
- [x] getDerivationPath() for all configurations
- [x] importCosignerXpub() with valid xpub

---

#### Unit Tests for PSBTManager

**Test Coverage**:
- [x] exportPSBT() with unsigned PSBT
- [x] exportPSBT() with partially signed PSBT
- [x] exportPSBT() with fully signed PSBT
- [x] importPSBT() from base64
- [x] importPSBT() from hex
- [x] importPSBT() with invalid format
- [x] createPSBTChunks() with small PSBT (1 chunk)
- [x] createPSBTChunks() with large PSBT (multiple chunks)
- [x] reassemblePSBTChunks() with valid chunks
- [x] reassemblePSBTChunks() with missing chunks
- [x] reassemblePSBTChunks() with mismatched txids
- [x] createPendingTransaction()
- [x] updatePendingTransaction()
- [x] validateMultisigPSBT() with valid PSBT
- [x] validateMultisigPSBT() with invalid M/N

---

#### Unit Tests for TransactionBuilder Multisig

**Test Coverage**:
- [ ] buildMultisigPSBT() with 2-of-3 P2WSH
- [ ] buildMultisigPSBT() with insufficient funds
- [ ] buildMultisigPSBT() with invalid address
- [ ] signMultisigPSBT() with first signature
- [ ] signMultisigPSBT() with second signature
- [ ] signMultisigPSBT() already signed (idempotent)
- [ ] mergePSBTs() with 2 PSBTs
- [ ] mergePSBTs() with duplicate signatures
- [ ] hasEnoughSignatures() true/false cases
- [ ] finalizeMultisigPSBT() with enough signatures
- [ ] finalizeMultisigPSBT() with insufficient signatures
- [ ] estimateMultisigSize() for all address types

---

#### Integration Tests

**Test Scenarios**:
- [ ] End-to-end 2-of-3 multisig transaction
  1. Create multisig account with 3 co-signers
  2. Generate multisig address
  3. Fund address (testnet faucet)
  4. Build unsigned PSBT
  5. Co-signer 1 signs
  6. Co-signer 2 signs
  7. Merge PSBTs
  8. Finalize and broadcast
  9. Verify on block explorer

- [ ] QR code workflow
  1. Build large PSBT (multiple inputs)
  2. Split into chunks
  3. Generate QR codes
  4. Scan QR codes
  5. Reassemble PSBT
  6. Verify integrity

- [ ] Partial signing workflow
  1. Build PSBT
  2. Export to file
  3. Import on different device
  4. Sign
  5. Export signed PSBT
  6. Merge with original
  7. Verify signatures

---

### Documentation References

**BIP Standards**:
- BIP48: Derivation scheme for multisig - https://github.com/bitcoin/bips/blob/master/bip-0048.mediawiki
- BIP67: Deterministic P2SH multisig addresses - https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
- BIP174: PSBT format - https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki

**Library Documentation**:
- bitcoinjs-lib PSBT: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/ts_src/psbt.ts
- bitcoinjs-lib Multisig: https://github.com/bitcoinjs/bitcoinjs-lib/blob/master/test/integration/multisig.spec.ts

**Related Expert Notes**:
- Blockchain Expert: `prompts/docs/blockchain-expert-notes.md` (BIP standards, derivation paths)
- Security Expert: `prompts/docs/security-expert-notes.md` (PSBT security, cosigner verification)
- Frontend Developer: `prompts/docs/frontend-developer-notes.md` (multisig UI flows)

---

## Version History

**v0.4.0** (2025-10-12) - Multisig Wallet Support
- Implemented MultisigManager class for account creation and xpub management
- Implemented PSBTManager class for PSBT lifecycle management
- Extended TransactionBuilder with multisig PSBT support
- Added storage schema v2 with MultisigAccount and PendingMultisigTx types
- Defined message handler interfaces for multisig operations
- Comprehensive BIP48 derivation path support
- QR code chunking for air-gapped signing
- PSBT import/export with validation
- Multisig transaction size estimation
- Unit tests for MultisigManager and PSBTManager

**v0.3.0** (2025-10-12) - Bitcoin Operations Message Handlers Complete
- Implemented `GET_BALANCE` handler (fetch balances for all addresses in account)
- Implemented `GET_TRANSACTIONS` handler (fetch transaction history with deduplication)
- Implemented `GET_FEE_ESTIMATES` handler (get current network fee rates)
- Implemented `SEND_TRANSACTION` handler (build, sign, and broadcast transactions)
- Updated `UNLOCK_WALLET` to fetch real balance from API
- Added helper function `getAllAddressesForAccount()`
- Full integration of BlockstreamClient and TransactionBuilder
- Production-ready error handling for all operations

**v0.2.0** (2025-10-12) - Blockstream API Client Complete
- Implemented comprehensive Blockstream API client
- All endpoints: balance, transactions, UTXOs, broadcast, fees
- Exponential backoff retry logic (1s, 2s, 4s)
- 10-second request timeout with AbortController
- Typed error handling (ApiError with error codes)
- Transaction parsing (calculate value change per address)
- Singleton testnet client export
- Comprehensive logging (never logs sensitive data)
- Network support (testnet/mainnet)

**v0.1.0** (2025-10-12) - HD Wallet Integration Complete
- Implemented all core message handlers
- In-memory state management
- Auto-lock functionality (dual mechanism)
- Secure encryption/decryption
- Multi-account support (BIP44)
- Address generation (all types)

**Next**: Phase 2 - Frontend integration and testing

---

**Document Maintenance**: Update this file after every significant implementation or architectural decision. Keep it as the single source of truth for backend development.

---

## Multi-Signature Message Handlers (v0.8.0)

**Implementation Date**: 2025-10-12

### Overview

Implemented 12 message handlers to support multi-signature wallet functionality including account creation, xpub exchange, PSBT construction/signing, and pending transaction management.

### Handler Implementations

#### 1. CREATE_MULTISIG_ACCOUNT

**Purpose**: Create a new multi-signature account with M-of-N configuration

**Message**: `MessageType.CREATE_MULTISIG_ACCOUNT`

**Payload**:
```typescript
{
  config: MultisigConfig,          // '2-of-2' | '2-of-3' | '3-of-5'
  addressType: MultisigAddressType, // 'p2sh' | 'p2wsh' | 'p2sh-p2wsh'
  name: string,
  cosignerXpubs: Array<{
    name: string,
    xpub: string,
    fingerprint: string
  }>
}
```

**Returns**: `{ account: MultisigAccount }`

**Implementation Details**:
- Requires wallet to be unlocked
- Validates all cosigner xpubs
- Automatically exports our xpub using MultisigManager
- Creates BIP48-compliant account structure
- Stores in WalletStorage as type-cast to Account (StoredWalletV2 supports both types)

**Security Notes**:
- Only public keys (xpubs) are handled
- Validates number of cosigners matches M-of-N configuration
- Uses BIP48 derivation paths

---

#### 2. EXPORT_OUR_XPUB

**Purpose**: Export our extended public key for sharing with co-signers

**Message**: `MessageType.EXPORT_OUR_XPUB`

**Payload**:
```typescript
{
  config: MultisigConfig,
  addressType: MultisigAddressType,
  accountIndex?: number  // Default: 0
}
```

**Returns**: `{ xpub: string, fingerprint: string }`

**Implementation Details**:
- Requires wallet to be unlocked
- Derives BIP48 path from config, addressType, and accountIndex
- Uses MultisigManager.exportOurXpub()
- Returns neutered (public-only) extended key
- Includes 4-byte fingerprint for verification

**Security Notes**:
- Never exposes private keys
- Xpub is safe to share with co-signers
- Fingerprint should be verified in person

---

#### 3. IMPORT_COSIGNER_XPUB

**Purpose**: Import and validate a co-signer's extended public key

**Message**: `MessageType.IMPORT_COSIGNER_XPUB`

**Payload**:
```typescript
{
  xpub: string,
  name: string
}
```

**Returns**: `{ cosigner: Partial<Cosigner> }`

**Implementation Details**:
- Validates xpub format and network
- Extracts fingerprint from xpub
- Returns cosigner data without derivationPath (set by caller)
- Does not require wallet to be unlocked

**Security Notes**:
- Validates xpub is public key (not private)
- Checks network prefix matches wallet network
- Rejects invalid or malformed xpubs

---

#### 4. BUILD_MULTISIG_TRANSACTION

**Purpose**: Create unsigned PSBT for a multisig transaction

**Message**: `MessageType.BUILD_MULTISIG_TRANSACTION`

**Payload**:
```typescript
{
  accountIndex: number,
  toAddress: string,
  amount: number,        // Satoshis
  feeRate: number        // Sat/vB
}
```

**Returns**: `{ psbtBase64: string, txid: string }`

**Implementation Details**:
- Requires wallet to be unlocked
- Fetches UTXOs from all addresses in multisig account
- Uses TransactionBuilder.buildMultisigPSBT()
- Includes appropriate redeem/witness scripts
- Exports PSBT in base64 format for sharing
- Does NOT sign the transaction (returns unsigned PSBT)

**Process**:
1. Validate account is multisig type
2. Fetch all UTXOs for account addresses
3. Select UTXOs based on amount + fee
4. Build PSBT with inputs/outputs
5. Add multisig scripts to each input
6. Export PSBT for distribution

**Security Notes**:
- Validates recipient address
- Checks for dust outputs
- Verifies sufficient funds before building

---

#### 5. SIGN_MULTISIG_TRANSACTION

**Purpose**: Sign a PSBT with our private key

**Message**: `MessageType.SIGN_MULTISIG_TRANSACTION`

**Payload**:
```typescript
{
  psbtBase64: string,
  accountIndex: number
}
```

**Returns**: `{ psbtBase64: string, signaturesAdded: number }`

**Implementation Details**:
- Requires wallet to be unlocked
- Imports and validates PSBT
- Derives all cosigner public keys
- Finds our private key from account
- Signs all inputs using TransactionBuilder.signMultisigPSBT()
- Validates signatures after signing
- Exports updated PSBT with our signatures

**Process**:
1. Import PSBT and validate structure
2. Get multisig account and config
3. Derive public keys for all cosigners (BIP67 sorted)
4. Derive our private key from HD wallet
5. Sign each input with our key
6. Validate signatures
7. Count total signatures
8. Export signed PSBT

**Security Notes**:
- Private key only used for signing, never exposed
- Validates each signature after adding
- Supports partially-signed PSBTs (adds our signature to existing ones)

---

#### 6. EXPORT_PSBT

**Purpose**: Export PSBT in various formats (base64, hex, QR chunks)

**Message**: `MessageType.EXPORT_PSBT`

**Payload**:
```typescript
{
  psbtBase64: string,
  format?: 'base64' | 'hex' | 'qr'  // Default: 'base64'
}
```

**Returns**: `{ export: PSBTExport }`

**Implementation Details**:
- Imports and validates PSBT
- For 'base64' or 'hex': Returns full PSBTExport with metadata
- For 'qr': Includes PSBTChunk[] array for QR code display
- Chunks are ~2500 bytes each (fits in standard QR)

**PSBTExport Structure**:
```typescript
{
  base64: string,
  hex: string,
  txid: string,
  numInputs: number,
  numOutputs: number,
  totalOutput: number,
  fee: number,
  signatures: number[],  // Per-input signature counts
  finalized: boolean,
  chunks?: PSBTChunk[]   // Only for 'qr' format
}
```

---

#### 7. IMPORT_PSBT

**Purpose**: Import and validate PSBT from external source

**Message**: `MessageType.IMPORT_PSBT`

**Payload**:
```typescript
{
  psbtString: string  // Base64 or hex
}
```

**Returns**: `{ psbt: PSBTImportResult }`

**Implementation Details**:
- Accepts base64 or hex format
- Validates PSBT structure
- Checks for required UTXO data
- Returns warnings for missing data
- Does not modify PSBT

**PSBTImportResult**:
```typescript
{
  txid: string,
  isValid: boolean,
  warnings: string[]
}
```

---

#### 8. GET_PENDING_MULTISIG_TXS

**Purpose**: Retrieve all pending multisig transactions

**Message**: `MessageType.GET_PENDING_MULTISIG_TXS`

**Payload**:
```typescript
{
  accountIndex?: number  // Optional filter
}
```

**Returns**: `{ pendingTxs: PendingMultisigTx[] }`

**Implementation Details**:
- Reads from StoredWalletV2.pendingMultisigTxs
- Filters by accountIndex if provided
- Returns empty array for v1 wallets
- Does not require wallet to be unlocked

---

#### 9. SAVE_PENDING_MULTISIG_TX

**Purpose**: Save PSBT for later signing/broadcasting

**Message**: `MessageType.SAVE_PENDING_MULTISIG_TX`

**Payload**:
```typescript
{
  psbtBase64: string,
  accountIndex: number,
  metadata: {
    amount: number,
    recipient: string,
    fee: number
  }
}
```

**Returns**: `{ pendingTx: PendingMultisigTx }`

**Implementation Details**:
- Validates PSBT and account
- Creates PendingMultisigTx record
- Tracks signature status per cosigner
- Sets 7-day expiration
- Stores in StoredWalletV2
- Updates existing if txid matches

**PendingMultisigTx Structure**:
```typescript
{
  id: string,                    // txid
  accountId: number,
  psbtBase64: string,
  created: number,
  expiresAt: number,
  multisigConfig: MultisigConfig,
  signaturesCollected: number,
  signaturesRequired: number,
  signatureStatus: {
    [fingerprint: string]: {
      signed: boolean,
      timestamp?: number,
      cosignerName: string
    }
  },
  metadata: {
    amount: number,
    recipient: string,
    fee: number
  }
}
```

---

#### 10. DELETE_PENDING_MULTISIG_TX

**Purpose**: Remove pending transaction from storage

**Message**: `MessageType.DELETE_PENDING_MULTISIG_TX`

**Payload**:
```typescript
{
  txid: string
}
```

**Returns**: `{ success: boolean }`

**Implementation Details**:
- Removes transaction by txid
- Returns error if not found
- Updates StoredWalletV2 in chrome.storage

---

#### 11. BROADCAST_MULTISIG_TRANSACTION

**Purpose**: Broadcast finalized transaction to network

**Message**: `MessageType.BROADCAST_MULTISIG_TRANSACTION`

**Payload**:
```typescript
{
  txHex: string  // Fully signed transaction
}
```

**Returns**: `{ txid: string }`

**Implementation Details**:
- Uses BlockstreamClient.broadcastTransaction()
- Returns confirmed txid
- Does not validate signatures (assumes finalized)
- Network will reject if invalid

**Process**:
1. Receive finalized transaction hex
2. POST to Blockstream API
3. Return txid on success
4. Propagate network errors

---

### Integration Points

#### MultisigManager

Used by handlers: CREATE_MULTISIG_ACCOUNT, EXPORT_OUR_XPUB, IMPORT_COSIGNER_XPUB

**Key Methods**:
- `createMultisigAccount()` - Creates MultisigAccount structure
- `exportOurXpub()` - Derives and exports xpub + fingerprint
- `importCosignerXpub()` - Validates and imports cosigner xpub
- `getConfigDetails()` - Returns M and N for config
- `validateXpub()` - Validates xpub format and network

#### PSBTManager

Used by handlers: BUILD_MULTISIG_TRANSACTION, EXPORT_PSBT, IMPORT_PSBT, SAVE_PENDING_MULTISIG_TX

**Key Methods**:
- `exportPSBT()` - Exports PSBT with full metadata
- `importPSBT()` - Imports and validates PSBT
- `createPSBTChunks()` - Splits PSBT for QR codes
- `createPendingTransaction()` - Creates pending tx record

#### TransactionBuilder

Used by handlers: BUILD_MULTISIG_TRANSACTION, SIGN_MULTISIG_TRANSACTION

**Key Methods**:
- `buildMultisigPSBT()` - Builds unsigned PSBT with multisig inputs
- `signMultisigPSBT()` - Signs PSBT with one cosigner's key
- `countSignatures()` - Counts signatures per input
- `hasEnoughSignatures()` - Checks if ready to finalize
- `finalizeMultisigPSBT()` - Finalizes and extracts tx hex
- `mergePSBTs()` - Combines multiple signed PSBTs

#### WalletStorage

**StoredWalletV2 Support**:
- Added `pendingMultisigTxs: PendingMultisigTx[]` array
- Supports union type `WalletAccount = Account | MultisigAccount`
- Version 2 format includes multisig data

**Note**: Current WalletStorage methods expect Account type. We type-cast MultisigAccount as `any` when calling `addAccount()`. Future improvement: Update WalletStorage to accept WalletAccount type.

---

### Error Handling

All handlers follow consistent error handling pattern:

1. **Validation Errors**:
   - Check required payload fields
   - Validate types and ranges
   - Return descriptive error messages

2. **State Errors**:
   - Check wallet unlocked (for sensitive operations)
   - Validate account exists and is correct type
   - Check wallet version for multisig support

3. **Operation Errors**:
   - Try-catch around all async operations
   - Log errors to console with context
   - Return user-friendly error messages

4. **Response Format**:
```typescript
{
  success: boolean,
  data?: any,      // Present on success
  error?: string   // Present on failure
}
```

---

### Testing Considerations

**Unit Tests Needed**:
- [ ] Each message handler with valid payload
- [ ] Each handler with invalid/missing payload fields
- [ ] Wallet locked scenarios (where applicable)
- [ ] Account not found scenarios
- [ ] Wrong account type (single-sig vs multisig)
- [ ] PSBT validation edge cases
- [ ] Signature counting and validation

**Integration Tests Needed**:
- [ ] End-to-end multisig account creation
- [ ] PSBT round-trip (build → sign → export → import)
- [ ] Multiple cosigners signing same PSBT
- [ ] Pending transaction CRUD operations
- [ ] Transaction broadcasting with Blockstream API

**Manual Testing on Testnet**:
- [ ] Create 2-of-2 multisig account
- [ ] Create 2-of-3 multisig account
- [ ] Exchange xpubs between wallets
- [ ] Build transaction and sign with multiple keys
- [ ] Export/import PSBTs in all formats
- [ ] Save and retrieve pending transactions
- [ ] Broadcast fully-signed transaction

---

### Known Issues & Future Improvements

1. **WalletStorage Type Safety**:
   - Currently type-casting MultisigAccount to `any` when calling `addAccount()`
   - Should update WalletStorage to accept `WalletAccount` union type
   - Affects: CREATE_MULTISIG_ACCOUNT handler

2. **Signature Status Tracking**:
   - SAVE_PENDING_MULTISIG_TX creates signature status but sets all to `signed: false`
   - Need to actually check PSBT for each cosigner's signature
   - Requires mapping public keys to signatures in PSBT

3. **PSBT Finalization**:
   - No dedicated handler for finalizing PSBT
   - Frontend must call TransactionBuilder.finalizeMultisigPSBT() directly
   - Consider adding FINALIZE_PSBT message type

4. **Address Verification**:
   - No handler for verifying multisig address across cosigners
   - Should add VERIFY_MULTISIG_ADDRESS message type
   - Helps detect mismatched xpubs or derivation paths

5. **Pending Transaction Expiration**:
   - Set to 7 days but no automatic cleanup
   - Consider adding background job to remove expired transactions

6. **Error Messages**:
   - Some errors could be more specific
   - Add error codes for programmatic handling

---

### Performance Considerations

1. **UTXO Fetching**:
   - BUILD_MULTISIG_TRANSACTION fetches UTXOs for all addresses in parallel
   - Good for small number of addresses (<10)
   - May need optimization for accounts with many addresses

2. **PSBT Size**:
   - Multisig PSBTs can be large (multiple signatures + scripts)
   - QR chunking handles this (2500 bytes per chunk)
   - Consider compression for storage/transmission

3. **Signature Validation**:
   - Each signature validated immediately after signing
   - Adds latency but ensures correctness
   - Could be optimized by batch validation

---

### Security Audit Notes

**Reviewed**: 2025-10-12

**Security Strengths**:
- ✅ Private keys never leave in-memory state
- ✅ All xpubs validated before acceptance
- ✅ Signatures validated after each signing operation
- ✅ Wallet unlock required for sensitive operations
- ✅ BIP48/67 compliance ensures address consistency
- ✅ PSBTs validated on import

**Security Considerations**:
- Xpubs are public data but should still be shared securely
- Fingerprints should be verified out-of-band
- PSBTs may contain partial transaction info (outputs visible)
- Pending transactions stored unencrypted (contains recipient address)

**Recommendations**:
- Add encryption for pending multisig transactions in storage
- Implement xpub verification flow (compare fingerprints)
- Add warnings for sharing xpubs over insecure channels
- Consider adding PSBT encryption for sensitive transactions

---

### Architecture Decisions

**Decision 1: PSBT as Communication Format**

**Rationale**: BIP174 PSBTs are the standard for coordinating multisig signatures. They:
- Contain all necessary transaction info
- Support partial signing by multiple parties
- Can be easily transmitted (base64, hex, QR)
- Are supported by all major Bitcoin libraries

**Alternatives Considered**: Raw transaction hex (rejected - can't be partially signed)

---

**Decision 2: Separate Handlers for Build/Sign**

**Rationale**: 
- BUILD creates unsigned PSBT for distribution
- SIGN adds our signature to any PSBT (ours or received)
- Allows flexible workflow (create vs. receive)
- Each handler has single responsibility

**Alternatives Considered**: Single SEND_MULTISIG handler (rejected - too complex, less flexible)

---

**Decision 3: Pending Transaction Storage**

**Rationale**:
- Users need to track PSBTs awaiting signatures
- Extension can close/reopen during signing process
- Pending txs provide UI state for incomplete transactions
- 7-day expiration prevents unbounded growth

**Alternatives Considered**: No persistence (rejected - poor UX, data loss)

---

**Decision 4: Type-Cast MultisigAccount in Storage**

**Rationale**:
- Quick implementation to meet v0.8.0 deadline
- WalletStorage already stores Account objects
- MultisigAccount extends same interface
- Storage structure supports both types (StoredWalletV2)

**Technical Debt**: Should refactor WalletStorage to properly handle WalletAccount union type

---

### Migration Path (v1 → v2)

**When a user upgrades from single-sig to multisig-enabled wallet:**

1. StoredWalletV1 → StoredWalletV2:
   - Version: 1 → 2
   - accounts: Account[] → WalletAccount[] (compatible)
   - Add: pendingMultisigTxs: [] (empty array)

2. Backward Compatibility:
   - v2 wallets can still have only single-sig accounts
   - All existing Account objects work unchanged
   - No data migration needed for upgrade

3. Forward Compatibility:
   - v1 wallet cannot read MultisigAccount objects
   - Opening v2 wallet with v1 code will fail validation
   - Downgrade not supported (one-way migration)

**Implementation**: Automatic migration on first multisig account creation

---

### Message Handler Summary

| Handler | Unlock Required | Returns | Side Effects |
|---------|----------------|---------|--------------|
| CREATE_MULTISIG_ACCOUNT | ✅ Yes | MultisigAccount | Adds account to storage |
| EXPORT_OUR_XPUB | ✅ Yes | xpub, fingerprint | None |
| IMPORT_COSIGNER_XPUB | ❌ No | Partial<Cosigner> | None |
| BUILD_MULTISIG_TRANSACTION | ✅ Yes | PSBT (unsigned) | None |
| SIGN_MULTISIG_TRANSACTION | ✅ Yes | PSBT (signed) | None |
| EXPORT_PSBT | ❌ No | PSBTExport | None |
| IMPORT_PSBT | ❌ No | PSBTImportResult | None |
| GET_PENDING_MULTISIG_TXS | ❌ No | PendingMultisigTx[] | None |
| SAVE_PENDING_MULTISIG_TX | ❌ No | PendingMultisigTx | Adds/updates in storage |
| DELETE_PENDING_MULTISIG_TX | ❌ No | success: boolean | Removes from storage |
| BROADCAST_MULTISIG_TRANSACTION | ❌ No | txid | Broadcasts to network |

**Total Handlers Implemented**: 11 (VERIFY_MULTISIG_ADDRESS deferred to future version)


---

## Account Import Feature Implementation

**Status**: IMPLEMENTED (2025-10-18)
**Phase**: v0.10.0 - Enhanced Account Management
**Owner**: Backend Developer

### Overview

Implemented comprehensive account import functionality allowing users to:
1. Create HD-derived accounts from wallet seed
2. Import accounts from WIF private keys  
3. Import accounts from external BIP39 seed phrases

This feature enables users to consolidate accounts from multiple wallets and import paper wallet keys while maintaining proper security and encryption.

### Implementation Components

#### 1. Type System Updates

**File**: `src/shared/types/index.ts`

Added `importType` field to Account interface:
```typescript
export interface Account {
  accountType: 'single';
  index: number;
  name: string;
  addressType: AddressType;
  importType?: 'hd' | 'private-key' | 'seed'; // NEW: How account was created
  externalIndex: number;
  internalIndex: number;
  addresses: Address[];
}
```

**Import Type Meanings**:
- `'hd'`: HD-derived account from main wallet seed (default, backward compatible)
- `'private-key'`: Imported from WIF private key (single address)
- `'seed'`: Imported from external BIP39 seed phrase (HD account from different seed)

Added `ImportedKeyData` interface for encrypted storage:
```typescript
export interface ImportedKeyData {
  encryptedData: string;  // Encrypted private key (WIF) or seed phrase
  salt: string;           // Encryption salt
  iv: string;             // Encryption IV
  type: 'private-key' | 'seed';  // Type of imported data
}
```

Updated `StoredWalletV2` interface:
```typescript
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData };  // NEW: Imported keys/seeds
  settings: WalletSettings;
}
```

Added new message types:
```typescript
export enum MessageType {
  // ... existing types ...
  IMPORT_ACCOUNT_PRIVATE_KEY = 'IMPORT_ACCOUNT_PRIVATE_KEY',
  IMPORT_ACCOUNT_SEED = 'IMPORT_ACCOUNT_SEED',
}
```

#### 2. KeyManager Enhancements

**File**: `src/background/wallet/KeyManager.ts`

Added WIF private key validation and manipulation methods:

**validateWIF(wif, network)**: Validates WIF format for testnet/mainnet
- Returns `true` if valid WIF for specified network
- Uses ECPairFactory to decode and validate
- Testnet WIF starts with 'c' (compressed) or '9' (uncompressed)

**decodeWIF(wif, network)**: Decodes WIF and extracts key information
- Returns object with privateKey (hex), publicKey (hex), compressed flag
- Used for deriving addresses from imported keys
- Throws error if invalid WIF

**privateKeyToWIF(privateKeyHex, network, compressed)**: Converts hex private key to WIF
- Creates WIF from hex private key
- Supports compressed/uncompressed format
- Used for exporting keys (future feature)

**Security Considerations**:
- Uses ECPairFactory from 'ecpair' package (not bitcoin.ECPair)
- Validates checksums in WIF format
- Network-specific validation (testnet vs mainnet)

#### 3. WalletStorage Extensions

**File**: `src/background/wallet/WalletStorage.ts`

Added methods for managing imported keys/seeds:

**storeImportedKey(accountIndex, data)**: Stores encrypted imported key/seed
- Associates imported data with account index
- Requires wallet version 2
- Initializes importedKeys object if not exists
- Saves encrypted data separately from main wallet seed

**getImportedKey(accountIndex)**: Retrieves encrypted imported key/seed
- Returns ImportedKeyData or null
- Only works with wallet version 2
- Returns encrypted data (must decrypt with password)

**unlockImportedKey(accountIndex, password)**: Decrypts imported key/seed
- Decrypts using same password as wallet unlock
- Returns decrypted WIF private key or seed phrase
- Throws error if account doesn't have imported data

**deleteImportedKey(accountIndex)**: Removes imported key/seed
- Permanently deletes encrypted imported data
- User should be warned to backup before deletion
- Used for cleanup or account removal

**Security Model**:
- Imported keys/seeds encrypted with same AES-256-GCM as wallet seed
- Uses wallet password for encryption (same key derivation)
- Stored separately in `importedKeys` object by account index
- Each account can have at most one imported key/seed
- Encryption uses separate salt and IV for each imported item

#### 4. Message Handler Implementation

**File**: `src/background/index.ts`

Added routing for new message types (lines 124-128):
```typescript
case MessageType.IMPORT_ACCOUNT_PRIVATE_KEY:
  return handleImportAccountPrivateKey(message.payload);

case MessageType.IMPORT_ACCOUNT_SEED:
  return handleImportAccountSeed(message.payload);
```

#### handleCreateAccount Updates

Updated existing CREATE_ACCOUNT handler to set importType:
```typescript
// Create new account using HD wallet
const newAccount = state.hdWallet!.createAccount(addressType, nextAccountIndex, accountName);

// Set importType to 'hd' for HD-derived accounts
newAccount.importType = 'hd';
```

Also updated wallet creation (CREATE_WALLET, IMPORT_WALLET) to set importType for first account.

#### handleImportAccountPrivateKey

**Payload**: `{ privateKey: string, name: string }`

**Flow**:
1. Validate wallet is unlocked
2. Validate payload (privateKey and name required)
3. Validate WIF format using `KeyManager.validateWIF()`
4. Decode WIF to get key information
5. Create ECPair and derive address:
   - Compressed keys → Native SegWit (P2WPKH) address
   - Uncompressed keys → Legacy (P2PKH) address
6. Check for duplicate address across all accounts
7. Encrypt private key with wallet password
8. Create ImportedKeyData object
9. Create Account object with importType: 'private-key'
10. Store encrypted key using `WalletStorage.storeImportedKey()`
11. Add account to wallet using `WalletStorage.addAccount()`

**Address Type Auto-Detection**:
- Compressed private keys use Native SegWit (most modern, lower fees)
- Uncompressed private keys use Legacy (P2PKH)
- Cannot use SegWit with uncompressed keys (not supported by Bitcoin)

**Security**:
- Private key encrypted before storage
- Uses wallet password for encryption (same as main seed)
- Duplicate detection prevents importing same key twice
- Private key cleared from memory after encryption

**Error Handling**:
- Invalid WIF format: "Invalid WIF private key format. Expected testnet key starting with 'c'."
- Duplicate address: "This private key has already been imported as '[Account Name]'"
- Wallet locked: "Wallet is locked. Please unlock first."

#### handleImportAccountSeed

**Payload**: `{ mnemonic: string, accountIndex: number, addressType: AddressType, name: string }`

**Flow**:
1. Validate wallet is unlocked
2. Validate payload (mnemonic and name required)
3. Validate BIP39 mnemonic using `KeyManager.validateMnemonic()`
4. Validate account index (0 to 2,147,483,647)
5. Convert mnemonic to seed
6. Create temporary HDWallet from imported seed
7. Derive account using BIP44 path
8. Generate first receiving address
9. Check for duplicate address across all accounts
10. Encrypt seed phrase with wallet password
11. Create ImportedKeyData object
12. Update account with correct index and importType: 'seed'
13. Store encrypted seed using `WalletStorage.storeImportedKey()`
14. Add account to wallet using `WalletStorage.addAccount()`

**BIP44 Derivation**:
- Uses imported seed to derive account at specified index
- Respects addressType selection (Legacy/SegWit/Native SegWit)
- Derivation path: m/purpose'/coin_type'/accountIndex'/change/address_index
- Purpose determined by addressType (44' for Legacy, 49' for SegWit, 84' for Native SegWit)

**Security**:
- Seed phrase encrypted before storage
- Uses wallet password for encryption
- Temporary HDWallet only exists in memory during derivation
- Seed phrase cleared from memory after encryption

**Error Handling**:
- Invalid mnemonic: "Invalid BIP39 seed phrase. Please check and try again."
- Invalid account index: "Account index must be between 0 and 2,147,483,647"
- Duplicate address: "An account with this address already exists as '[Account Name]'"

### Storage Schema

**Encrypted Storage Layout**:
```typescript
{
  version: 2,
  encryptedSeed: "base64...",        // Main wallet seed
  salt: "base64...",
  iv: "base64...",
  accounts: [
    {
      index: 0,
      name: "Account 1",
      importType: "hd",               // HD-derived from main seed
      // ... other fields
    },
    {
      index: 1,
      name: "Paper Wallet",
      importType: "private-key",      // Imported from WIF
      // ... other fields
    },
    {
      index: 2,
      name: "Hardware Wallet Clone",
      importType: "seed",             // Imported from different seed
      // ... other fields
    }
  ],
  importedKeys: {
    1: {                              // Account index 1 (Paper Wallet)
      encryptedData: "base64...",     // Encrypted WIF private key
      salt: "base64...",
      iv: "base64...",
      type: "private-key"
    },
    2: {                              // Account index 2 (Hardware Wallet Clone)
      encryptedData: "base64...",     // Encrypted BIP39 seed
      salt: "base64...",
      iv: "base64...",
      type: "seed"
    }
  },
  // ... other fields
}
```

### Security Considerations

1. **Encryption**:
   - All imported keys/seeds encrypted with AES-256-GCM
   - Uses password-derived encryption key (NOT wallet seed)
   - CRITICAL FIX (2025-10-18): Changed from seed-based to password-based encryption
   - Encryption key derived via PBKDF2 with 100,000 iterations
   - Separate salt and IV for each encrypted item
   - Encrypted data stored separately from main wallet seed

2. **Memory Management**:
   - CRITICAL FIX (2025-10-18): Added try/finally blocks to ensure cleanup
   - Private keys/seeds cleared immediately after encryption using CryptoUtils.clearSensitiveData()
   - Cleanup happens even if errors occur (finally block)
   - Not persisted in decrypted form
   - Buffer.fill(0) used for seed buffers

3. **Duplicate Detection**:
   - Checks all existing account addresses before import
   - Prevents importing same key/seed multiple times
   - Provides clear error with existing account name

4. **Network Validation**:
   - HIGH-PRIORITY FIX (2025-10-18): Added mainnet key detection
   - WIF keys validated for correct network (testnet)
   - Testnet keys start with 'c' (compressed)
   - Mainnet keys explicitly rejected with clear error message
   - Prevents importing mainnet keys to testnet wallet

5. **Error Sanitization**:
   - HIGH-PRIORITY FIX (2025-10-18): All error messages sanitized
   - No sensitive data (keys, seeds, passwords) in error messages
   - Generic error messages prevent information leakage
   - Console logs stripped of sensitive data

6. **Entropy Validation**:
   - HIGH-PRIORITY FIX (2025-10-18): Added weak seed detection
   - Known weak seeds rejected (e.g., "abandon abandon...about")
   - Word repetition checking (less than 75% unique = rejected)
   - Protects users from importing publicly known test seeds

7. **Rate Limiting**:
   - HIGH-PRIORITY FIX (2025-10-18): Import operations rate limited
   - Maximum 5 import/create operations per minute
   - Prevents brute force and DoS attacks
   - Account limit enforced (100 accounts maximum)

8. **Backward Compatibility**:
   - importType field is optional (backward compatible)
   - Existing accounts default to importType: 'hd'
   - Migration handled automatically on first access

### Frontend Integration

The backend is fully implemented and ready for frontend integration. Frontend should call:

**Create HD Account**:
```typescript
const response = await chrome.runtime.sendMessage({
  type: 'CREATE_ACCOUNT',
  payload: { name: 'Account Name', addressType: 'native-segwit' }
});
```

**Import Private Key**:
```typescript
const response = await chrome.runtime.sendMessage({
  type: 'IMPORT_ACCOUNT_PRIVATE_KEY',
  payload: { 
    privateKey: 'cT1BqWt...WIF...', 
    name: 'Paper Wallet' 
  }
});
```

**Import Seed Phrase**:
```typescript
const response = await chrome.runtime.sendMessage({
  type: 'IMPORT_ACCOUNT_SEED',
  payload: { 
    mnemonic: 'abandon abandon abandon ...',
    accountIndex: 0,
    addressType: 'native-segwit',
    name: 'Imported Wallet'
  }
});
```

### Testing Recommendations

1. **Unit Tests**:
   - KeyManager.validateWIF() with valid/invalid WIF
   - KeyManager.decodeWIF() with compressed/uncompressed keys
   - WalletStorage imported key methods
   - Message handler validation logic

2. **Integration Tests**:
   - End-to-end private key import flow
   - End-to-end seed phrase import flow
   - Duplicate detection across all account types
   - Encryption/decryption round-trip

3. **Manual Testing on Testnet**:
   - Import WIF private key from paper wallet
   - Import seed from another wallet (e.g., Electrum, Sparrow)
   - Verify imported accounts show correct balances
   - Verify imported accounts can send transactions
   - Test with both compressed and uncompressed keys
   - Test account index selection for seed imports

### Known Limitations

1. **No Address Discovery**:
   - When importing seed, only generates first address
   - Does not scan for used addresses (BIP44 gap limit)
   - User must know which account index to import

2. **Single Address for Private Key Import**:
   - WIF private key imports create single-address account
   - Cannot generate additional addresses (no seed)
   - Suitable for paper wallets but not HD usage

3. **No Export Feature**:
   - Can import but not export private keys/seeds
   - Export would be useful for backup verification
   - Intentionally deferred to v0.11.0 for security review

4. **No Account Deletion**:
   - Imported accounts cannot be deleted via UI
   - Would need careful UX (backup verification)
   - Deferred to future version

### Future Enhancements

1. **BIP44 Gap Limit Scanning** (v0.11.0):
   - Scan imported seed for used addresses
   - Follow BIP44 standard (20 address gap limit)
   - Discover all accounts automatically

2. **Export Functionality** (v0.11.0):
   - Export private key from imported accounts
   - Export seed phrase from imported seed accounts
   - Require password re-entry for security

3. **Address Type Override** (v0.12.0):
   - Allow user to specify address type for private key imports
   - Currently auto-detected from key compression
   - Useful for specific use cases

4. **Hardware Wallet Integration** (Phase 3):
   - Import xpub from hardware wallet
   - Watch-only accounts
   - Sign with hardware device

### Implementation Metrics

**Files Modified**: 4
- `src/shared/types/index.ts` (types)
- `src/background/wallet/KeyManager.ts` (WIF methods)
- `src/background/wallet/WalletStorage.ts` (imported key storage)
- `src/background/index.ts` (message handlers)

**Lines of Code Added**: ~350
- KeyManager: ~90 lines
- WalletStorage: ~130 lines
- Message handlers: ~230 lines

**New Message Types**: 2
- IMPORT_ACCOUNT_PRIVATE_KEY
- IMPORT_ACCOUNT_SEED

**TypeScript Compilation**: ✅ Success
**Build Status**: ✅ Success
**Backward Compatibility**: ✅ Maintained

### Documentation References

- **Product Requirements**: `prompts/docs/plans/ACCOUNT_DROPDOWN_SINGLESIG_PRD.md`
- **Frontend Implementation**: `ACCOUNT_MANAGEMENT_IMPLEMENTATION_SUMMARY.md`
- **BIP39 Specification**: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
- **BIP44 Specification**: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
- **WIF Format**: https://en.bitcoin.it/wiki/Wallet_import_format

---

## Privacy Enhancement Backend Planning (v0.11.0)

**Date**: 2025-10-21
**Phase**: Planning Complete - Implementation Ready
**Priority**: P0 (Critical Privacy Fixes) + P1 (High Priority) + P2 (Optional Features)
**Related Documents**:
- `prompts/docs/plans/PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md` - Complete backend implementation plan
- `prompts/docs/plans/PRIVACY_UI_UX_DESIGN_SPEC.md` - UI/UX design specification
- `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md` - Blockchain Expert audit findings
- `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md` - Product requirements

### Planning Overview

Created comprehensive backend implementation plan for Bitcoin Privacy Enhancement (v0.11.0) covering all privacy features required to fix critical vulnerabilities identified by Blockchain Expert audit.

**Document Stats**:
- **Word Count**: ~30,000 words
- **Code Examples**: 20+ complete implementations
- **Test Cases**: 50+ unit and integration tests
- **Message Handlers**: 4 new handlers
- **Files to Modify**: 4 core files
- **Estimated Timeline**: 17 days (10 days Phase 2, 7 days Phase 3)

### Critical Privacy Fixes (Phase 2 - P0/P1)

#### 1. Fix Change Address Reuse (P0 - CRITICAL)

**Current Vulnerability**:
- Lines 1766 and 2147 in `src/background/index.ts` hardcode change address to `account.addresses[0].address`
- Results in 100% transaction linkability
- Complete failure of Bitcoin privacy model

**Implementation Plan**:
```typescript
// New helper function
async function getOrGenerateChangeAddress(accountIndex: number): Promise<string> {
  const response = await handleGenerateAddress({
    accountIndex,
    isChange: true,  // ✅ Use internal chain (m/.../1/index)
  });
  return response.data.address;
}

// Update handleSendTransaction (line 1766)
// OLD: const changeAddress = account.addresses[0].address;
// NEW: const changeAddress = await getOrGenerateChangeAddress(accountIndex);

// Update handleBuildMultisigTransaction (line 2147)
// Same change for multisig accounts
```

**Testing Requirements**:
- Verify unique change addresses for 10 consecutive transactions
- Verify internal chain usage (m/.../1/x)
- Verify internalIndex increments
- Test with multisig accounts (BIP48 compliance)
- Testnet validation: Confirm change addresses NOT in receive address list

**Impact**:
- **Privacy Improvement**: 0% → 100% change address uniqueness
- **Performance**: +50-100ms per transaction (acceptable)
- **Breaking Changes**: None (backwards compatible)

---

#### 2. Randomized UTXO Selection (P1 - HIGH)

**Current Vulnerability**:
- Line 289 in `src/background/bitcoin/TransactionBuilder.ts` uses greedy (largest-first) selection
- Creates 0% entropy, enables wallet fingerprinting
- Makes wallet behavior predictable to network observers

**Implementation Plan**:
```typescript
// Add Fisher-Yates shuffle helper
private shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Update selectUTXOs method
// OLD: const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);
// NEW: const shuffledUtxos = this.shuffleArray([...utxos]);
```

**Testing Requirements**:
- Verify non-deterministic selection (>10% variation over 100 runs)
- Measure entropy: Target >50% of theoretical maximum
- Verify dust limits respected
- Verify sufficient funds selected
- Compare fees: randomized vs greedy (ensure <10% increase)

**Impact**:
- **Privacy Improvement**: 0% → 50-70% UTXO selection entropy
- **Performance**: Negligible (same algorithm, shuffled order)
- **Fee Impact**: <5% average increase (acceptable trade-off)

---

#### 3. Contacts Privacy Backend (P0 - CRITICAL)

**Current Vulnerability**:
- Contact type lacks privacy tracking fields
- No support for xpub address rotation
- No reusage warnings for single-address contacts

**Implementation Plan**:

**A. Update Contact Type** (`src/shared/types/index.ts`):
```typescript
export interface Contact {
  // ... existing fields
  lastUsedAddressIndex?: number;  // For xpub rotation tracking
  reusageCount?: number;           // For single-address reuse tracking
}
```

**B. Add Message Handlers** (`src/background/index.ts`):
```typescript
// GET_NEXT_CONTACT_ADDRESS - Get next unused address for xpub contact
async function handleGetNextContactAddress(payload: {
  contactId: string;
}): Promise<MessageResponse>

// INCREMENT_CONTACT_USAGE - Track contact usage after send
async function handleIncrementContactUsage(payload: {
  contactId: string;
  isXpub: boolean;
}): Promise<MessageResponse>
```

**C. Message Types**:
- `GET_NEXT_CONTACT_ADDRESS` - Returns next cached address for xpub contact
- `INCREMENT_CONTACT_USAGE` - Increments lastUsedAddressIndex (xpub) or reusageCount (single)

**Testing Requirements**:
- Verify xpub rotation increments lastUsedAddressIndex
- Verify single-address increments reusageCount
- Test cache exhaustion handling
- Test contact matching in transaction history (all cached addresses)

**Impact**:
- **Privacy Improvement**: Enables address rotation, tracks reuse for warnings
- **Performance**: +10ms per send (single storage write)
- **Breaking Changes**: None (new fields are optional)

---

### Optional Privacy Features (Phase 3 - P2)

#### 4. Privacy Settings Storage

**Implementation**:
```typescript
// New type in src/shared/types/index.ts
export interface PrivacySettings {
  randomizeRoundAmounts: boolean;   // Add ±0.1% to round numbers
  randomizeApiTiming: boolean;      // 1-5s delays between API requests
  delayBroadcast: boolean;          // 5-30s delay before broadcasting
}

// New message handlers
handleGetPrivacySettings(): Promise<MessageResponse>
handleUpdatePrivacySettings(payload: Partial<PrivacySettings>): Promise<MessageResponse>
```

**Storage**: `chrome.storage.local` under `privacySettings` key

**Defaults**: All `false` (disabled)

---

#### 5. Round Number Randomization

**Implementation**:
- Create `src/background/privacy/PrivacyUtils.ts` module
- `detectRoundNumber(amountSats)` - Detects amounts with >=3 trailing zeros
- `randomizeAmount(amountSats)` - Adds ±0.1% variance
- Integration: Check privacy setting in `handleSendTransaction`, apply if enabled

**Testing**:
- Verify detection of round numbers (0.1 BTC, 1.0 BTC, etc.)
- Verify randomization within ±0.1%
- Verify positive values always returned

---

#### 6. API Timing Randomization

**Implementation**:
- Update `BlockstreamClient` constructor to accept `privacyMode: boolean`
- Add `delayBetweenRequests(minMs, maxMs)` helper
- Apply 1-5s random delays before each API request if privacy mode enabled

**Testing**:
- Measure total time for 5 API requests with privacy mode
- Verify delays within expected range (1000-5000ms)
- Verify no timeouts caused by delays

---

#### 7. Transaction Broadcast Delay

**Implementation**:
- Update `broadcastTransaction(txHex, delayMs?)` to accept optional delay
- Apply random 5-30s delay if privacy setting enabled
- Return `broadcastDelay` in response for frontend countdown UI

**Testing**:
- Verify delay applied when specified
- Verify immediate broadcast when delay = 0
- Test transaction still broadcasts if wallet closed during delay

---

### Message Handler Summary

| Message Type | Payload | Response | Phase | Priority |
|-------------|---------|----------|-------|----------|
| **GET_NEXT_CONTACT_ADDRESS** | `{ contactId: string }` | `{ address: string, addressIndex: number }` | 2 | P0 |
| **INCREMENT_CONTACT_USAGE** | `{ contactId: string, isXpub: boolean }` | `{ success: boolean }` | 2 | P0 |
| **GET_PRIVACY_SETTINGS** | none | `PrivacySettings` | 3 | P2 |
| **UPDATE_PRIVACY_SETTINGS** | `Partial<PrivacySettings>` | `PrivacySettings` | 3 | P2 |

---

### Storage Schema Updates

**contacts (MODIFIED)**:
```typescript
interface Contact {
  // ... existing fields
  lastUsedAddressIndex?: number;  // NEW: For xpub rotation tracking
  reusageCount?: number;           // NEW: For single-address reuse tracking
}
```

**privacySettings (NEW)**:
```typescript
{
  privacySettings: {
    randomizeRoundAmounts: boolean,  // Default: false
    randomizeApiTiming: boolean,     // Default: false
    delayBroadcast: boolean          // Default: false
  }
}
```

**wallet.accounts[].internalIndex (INCREMENTED)**:
- No schema change, just usage change
- Will increment with every transaction that has change

---

### Testing Strategy

**Unit Tests** (Target: 95% coverage):
- `privacy-change-address.test.ts` - Change address generation
- `privacy-utxo-selection.test.ts` - UTXO randomization entropy
- `privacy-contacts.test.ts` - Contact rotation and tracking
- `privacy-utils.test.ts` - Round number detection and randomization
- `privacy-settings.test.ts` - Settings storage and retrieval
- `BlockstreamClient-privacy.test.ts` - API timing delays

**Integration Tests**:
- End-to-end transaction privacy (10 transactions, verify unique change addresses)
- Contacts privacy flow (xpub rotation, reusage counting)
- Privacy settings flow (update settings, verify applied in transactions)

**Testnet Validation**:
- Send 3 real testnet transactions
- Verify change addresses unique and NOT in receive address list
- Verify UTXO selection varies across transactions
- Test xpub contact rotation (5 sends = 5 different addresses)

**Privacy Metrics**:
- 0% change address reuse (100% unique)
- >50% UTXO selection entropy
- Contact rotation works for all cached addresses

---

### Migration Plan

**No Breaking Changes**:
- All new fields are optional (Contact.lastUsedAddressIndex, Contact.reusageCount)
- Privacy settings default to disabled (safe defaults)
- Existing contacts work without changes

**Deployment Strategy**:
1. Deploy backend changes (Phase 2: Critical fixes)
2. Test thoroughly (unit, integration, testnet)
3. Frontend deploys UI in parallel (independent work)
4. Deploy Phase 3 (Optional features) after Phase 2 stable

**Rollback Plan**:
- If critical issues: Revert to previous version
- Privacy settings disabled (safe default)
- Contacts still work (new fields ignored)

---

### Implementation Checklist

**Phase 2: Critical Privacy Fixes (10 days)**

Change Address Fix (2 days):
- [ ] Add `getOrGenerateChangeAddress()` helper function
- [ ] Update `handleSendTransaction` (line 1766)
- [ ] Update `handleBuildMultisigTransaction` (line 2147)
- [ ] Write unit tests (uniqueness, internal chain, index increment)
- [ ] Write integration tests (real transactions)
- [ ] Testnet validation (manual testing)
- [ ] Code review by Blockchain Expert

UTXO Randomization (1 day):
- [ ] Add `shuffleArray()` helper (Fisher-Yates)
- [ ] Update `selectUTXOs()` method
- [ ] Write unit tests (non-determinism, entropy >50%)
- [ ] Measure entropy (1000 runs)
- [ ] Performance testing (compare fees)
- [ ] Code review by Blockchain Expert

Contacts Privacy Backend (2 days):
- [ ] Update Contact type (add fields)
- [ ] Add `handleGetNextContactAddress` handler
- [ ] Add `handleIncrementContactUsage` handler
- [ ] Update message router
- [ ] Write unit tests (rotation, tracking, cache exhaustion)
- [ ] Test backwards compatibility

Testing & Validation (3 days):
- [ ] Run full unit test suite
- [ ] Run integration test suite
- [ ] Testnet validation (10 transactions)
- [ ] Measure privacy metrics
- [ ] Performance testing
- [ ] Documentation review

---

**Phase 3: Optional Privacy Features (7 days)**

Privacy Settings (1 day):
- [ ] Define PrivacySettings type
- [ ] Add GET/UPDATE message handlers
- [ ] Write unit tests (storage, persistence)

Round Number Randomization (1 day):
- [ ] Create PrivacyUtils module
- [ ] Implement detection and randomization
- [ ] Update handleSendTransaction
- [ ] Write unit tests

API Timing Delays (2 days):
- [ ] Update BlockstreamClient constructor
- [ ] Add delayBetweenRequests helper
- [ ] Update all API methods
- [ ] Write unit tests

Broadcast Delays (1 day):
- [ ] Update broadcastTransaction method
- [ ] Update handleSendTransaction
- [ ] Write unit tests

Testing & Validation (2 days):
- [ ] Run full test suite
- [ ] Test privacy settings UI integration
- [ ] Performance testing (delays)
- [ ] Documentation review

---

### Dependencies and Risks

**External Dependencies**:
- bitcoinjs-lib 6.1.5 - Stable, low risk
- bip32 4.0.0 - Standard BIP, low risk
- bip39 3.1.0 - Standard BIP, low risk
- chrome.storage.local - Browser API, low risk
- Math.random() - Sufficient for privacy (not security), medium risk

**Technical Risks**:
1. **Change Address Performance** - Mitigation: Pre-generate internal addresses
2. **UTXO Randomization Fees** - Mitigation: Monitor fees, add greedy fallback
3. **Contacts Cache Exhaustion** - Mitigation: Warn at 80%, auto-regenerate at 90%
4. **API Timeout with Delays** - Mitigation: Test with real API, reduce max delay
5. **Broadcast Delay Impatience** - Mitigation: Countdown UI, "Broadcast Now" button

**Performance Impact**:
- Change address generation: +50-100ms per transaction
- UTXO randomization: Negligible
- Contacts tracking: +10ms per send
- API delays (optional): +5-20s per balance refresh
- Broadcast delay (optional): +5-30s per send

**Overall**: Phase 2 minimal impact, Phase 3 opt-in with clear trade-offs

---

### Documentation References

- **Backend Implementation Plan**: `prompts/docs/plans/PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md`
- **UI/UX Design Spec**: `prompts/docs/plans/PRIVACY_UI_UX_DESIGN_SPEC.md`
- **Privacy Audit Report**: `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md`
- **Product Requirements**: `prompts/docs/plans/PRIVACY_ENHANCEMENT_PRD.md`
- **Technical Overview**: `prompts/docs/plans/BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md`
- **Bitcoin Privacy Wiki**: https://en.bitcoin.it/wiki/Privacy

---

**Last Updated**: 2025-10-21
**Planning Status**: ✅ Complete - Implementation Ready
**Estimated Timeline**: 17 days (3.5 weeks)
**Next Steps**:
1. Product Manager reviews and approves plan
2. Backend Developer begins Phase 2 implementation
3. Frontend Developer implements UI components (parallel work)
4. Blockchain Expert reviews change address and UTXO code
5. Security Expert reviews privacy settings and API delays

---

**Last Updated**: 2025-10-21
**Implementation Status**: 📝 Planning Complete - Ready for Implementation
**Testing Status**: ⏳ Pending Implementation


---

## 30. Wallet Backup and Restore System

**Status**: ✅ Backend Implementation Complete (2025-10-26)
**Version**: 0.11.0
**Module**: `src/background/wallet/BackupManager.ts`
**Feature**: Complete encrypted wallet backup export and import with two-layer encryption

### Overview

Complete wallet backup and restore system that encrypts and exports ALL wallet data:
- All accounts (single-sig and multisig) with complete state
- All generated addresses with derivation paths, indices, and usage flags
- Imported private keys/seeds (encrypted with wallet password)
- Pending multisig transactions (PSBTs)
- All contacts (encrypted with wallet password)
- Wallet settings (network, auto-lock timeout)

**Critical**: This system preserves `externalIndex` and `internalIndex` for each account, which is ESSENTIAL for restoring BIP44 gap limit compliance and preventing loss of funds.

### Security Architecture

**Two-Layer Encryption**:
1. **Inner Layer**: Wallet password encryption (existing)
   - Seed phrases encrypted with wallet password (100K PBKDF2)
   - Contacts encrypted with wallet password
   - Imported keys encrypted with wallet password
   - Purpose: Daily wallet operations protection

2. **Outer Layer**: Backup password encryption (new)
   - Entire backup payload encrypted with backup password (600K PBKDF2)
   - Stronger than wallet password (6x iterations)
   - Purpose: Long-term backup file protection

**Separate Passwords Enforced**:
- Backup password MUST be different from wallet password
- Prevents single point of compromise
- Defense in depth security model

### BackupManager Module

**Location**: `src/background/wallet/BackupManager.ts`

**Key Methods**:
1. `exportWallet(walletPassword, backupPassword, onProgress?)` - Export encrypted backup
2. `importWallet(backupFile, backupPassword, onProgress?)` - Import and restore backup
3. `validateBackupFile(backupFile)` - Validate file structure without decrypting

**File Format**:
```typescript
interface EncryptedBackupFile {
  header: {
    magicBytes: 'BTCWALLET';
    version: 1;
    created: number; // Unix timestamp
    network: 'testnet' | 'mainnet';
    appVersion: string; // Extension version
  };
  encryption: {
    algorithm: 'AES-256-GCM';
    pbkdf2Iterations: 600000;
    salt: string; // Base64
    iv: string; // Base64
  };
  encryptedData: string; // Base64 encrypted JSON payload
  checksum: {
    algorithm: 'SHA-256';
    hash: string; // Hex
  };
}
```

**Payload Structure (encrypted)**:
```typescript
interface BackupPayload {
  wallet: {
    version: 1 | 2;
    encryptedSeed: string; // Encrypted with wallet password
    salt: string;
    iv: string;
    accounts: WalletAccount[]; // INCLUDES externalIndex, internalIndex!
    settings: WalletSettings;
    importedKeys?: { [accountIndex: number]: ImportedKeyData };
    pendingMultisigTxs?: PendingMultisigTx[];
  };
  contacts: {
    version: number;
    contacts: Contact[];
    salt: string;
  };
  metadata: {
    totalAccounts: number;
    totalContacts: number;
    hasMultisig: boolean;
    hasImportedKeys: boolean;
    exportedBy: string;
  };
}
```

### Message Handlers

**Added to `src/background/index.ts`**:

#### 1. EXPORT_WALLET_BACKUP

**Payload**:
```typescript
{
  walletPassword: string;
  backupPassword: string;
  onProgress?: (progress: number, step: string) => void;
}
```

**Returns**:
```typescript
{
  success: true,
  data: {
    backupFile: EncryptedBackupFile,
    filename: string, // e.g., "bitcoin-wallet-backup-testnet-2025-10-26T14-30-00.dat"
    fileSize: number, // bytes
    checksum: string, // SHA-256 hash (hex)
    network: 'testnet' | 'mainnet'
  }
}
```

**Progress Steps** (0-100%):
- 0-20%: Verify wallet password
- 21-35%: Gather wallet data
- 36-50%: Gather contacts data
- 51-60%: Serialize backup data
- 61-85%: Derive backup encryption key (SLOWEST STEP - 600K PBKDF2)
- 86-95%: Encrypt backup
- 96-100%: Generate checksum

**Requirements**:
- Wallet must be unlocked
- Wallet password must be correct
- Backup password must be different from wallet password
- Backup password must be at least 12 characters

**Error Handling**:
- Wallet locked → "Wallet is locked. Please unlock to export backup."
- Incorrect wallet password → "Incorrect wallet password"
- Same passwords → "Backup password must be different from wallet password for security"
- Weak backup password → "Backup password must be at least 12 characters"

#### 2. VALIDATE_BACKUP_FILE

**Payload**:
```typescript
{
  backupFile: EncryptedBackupFile;
}
```

**Returns**:
```typescript
{
  success: true,
  data: {
    valid: boolean;
    version?: number;
    network?: 'testnet' | 'mainnet';
    created?: number; // Unix timestamp
    accountCount?: number;
    contactCount?: number;
    error?: string; // If valid=false
  }
}
```

**Validation Checks**:
- Magic bytes correct ("BTCWALLET")
- Version supported (currently only v1)
- Required fields present
- Valid encryption metadata
- Valid checksum format
- Network is 'testnet' or 'mainnet'

**Does NOT**:
- Decrypt the file
- Verify password
- Verify checksum (only validates format)

#### 3. IMPORT_WALLET_BACKUP

**Payload**:
```typescript
{
  backupFile: EncryptedBackupFile;
  backupPassword: string;
  walletPassword?: string; // Required if replaceExisting=true
  replaceExisting: boolean;
  onProgress?: (progress: number, step: string) => void;
}
```

**Returns**:
```typescript
{
  success: true,
  data: {
    accountCount: number;
    contactCount: number;
    network: 'testnet' | 'mainnet';
    backupCreated: number; // Unix timestamp
    hasMultisig: boolean;
    hasImportedKeys: boolean;
  }
}
```

**Progress Steps** (0-100%):
- 0-10%: Validate file structure
- 11-20%: Verify checksum
- 21-40%: Derive decryption key (SLOWEST STEP - 600K PBKDF2)
- 41-50%: Decrypt backup
- 51-60%: Validate backup data
- 61-80%: Restore wallet data
- 81-95%: Restore contacts
- 96-100%: Finalize import

**Requirements**:
- Backup file must be valid
- Backup password must be correct
- If replaceExisting=true:
  - Wallet must be unlocked
  - Wallet password must be provided and correct

**WARNING**:
- This PERMANENTLY REPLACES the current wallet
- All existing wallet data is DELETED
- Cannot be undone
- User should export current wallet first

**Security**:
- Wallet is automatically LOCKED after import (for security)
- User must unlock with password to access restored wallet

### Message Types Added

**Location**: `src/shared/types/index.ts`

```typescript
export enum MessageType {
  // ... existing types ...

  // Wallet backup/restore
  EXPORT_WALLET_BACKUP = 'EXPORT_WALLET_BACKUP',
  IMPORT_WALLET_BACKUP = 'IMPORT_WALLET_BACKUP',
  VALIDATE_BACKUP_FILE = 'VALIDATE_BACKUP_FILE',
}
```

### Critical: Address Indices Preservation

**MUST PRESERVE for each account**:
- `externalIndex`: Index of last used external (receiving) address
- `internalIndex`: Index of last used internal (change) address
- Complete `addresses[]` array with `used` flags

**Why Critical**:
BIP44 gap limit (20 unused addresses) means:
- If we don't preserve indices, restoration will only scan first 20 addresses
- Any addresses beyond gap limit will NOT be discovered
- Funds sent to those addresses will be LOST

**Example Loss Scenario**:
```
// Before backup:
- externalIndex: 35 (35 addresses generated)
- User received funds to address #30

// BAD restore (without preserving indices):
- externalIndex: 0 (reset to 0)
- Only scans first 20 addresses (0-19)
- Address #30 NOT discovered
- Funds LOST!

// GOOD restore (with preserved indices):
- externalIndex: 35 (restored from backup)
- Scans addresses 0-35
- Address #30 discovered
- Funds SAFE!
```

### Encryption Specifications

**Backup Password Encryption**:
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2-HMAC-SHA256
- Iterations: 600,000 (6x stronger than wallet password)
- Salt: 32 bytes (256 bits) random
- IV: 12 bytes (96 bits) random
- Authentication: GCM provides authentication tag

**Wallet Password Encryption** (inner layer):
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2-HMAC-SHA256
- Iterations: 100,000 (existing wallet encryption)
- Salt: 32 bytes (256 bits) random
- IV: 12 bytes (96 bits) random

**Checksum**:
- Algorithm: SHA-256
- Input: encryptedData string
- Output: Hex string (64 characters)
- Purpose: Detect corruption or tampering

### File Naming Convention

Format: `bitcoin-wallet-backup-{network}-{timestamp}.dat`

Example: `bitcoin-wallet-backup-testnet-2025-10-26T14-30-00.dat`

**Components**:
- Prefix: `bitcoin-wallet-backup`
- Network: `testnet` or `mainnet`
- Timestamp: ISO 8601 format (simplified, no colons/dots)
- Extension: `.dat` (generic data file)

### Network Validation

**Export**:
- Network is read from `wallet.settings.network`
- Stored in plaintext header
- No validation needed (just save what's in wallet)

**Import**:
- Validates `header.network` matches `payload.wallet.settings.network`
- Future: Can add UI warning if importing different network than current setting
- Future: Can validate all addresses match declared network

### Error Handling

**Common Errors**:

1. **Wallet Locked**
   - Message: "Wallet is locked. Please unlock to export backup."
   - Recovery: User must unlock wallet first

2. **Incorrect Wallet Password**
   - Message: "Incorrect wallet password"
   - Recovery: User must enter correct password

3. **Same Passwords**
   - Message: "Backup password must be different from wallet password for security"
   - Recovery: User must choose different backup password

4. **Weak Backup Password**
   - Message: "Backup password must be at least 12 characters"
   - Recovery: User must choose stronger password

5. **Invalid Backup File**
   - Message: "Invalid file format. Not a valid backup file."
   - Recovery: User must select correct .dat backup file

6. **Corrupted Backup File**
   - Message: "Backup file is corrupted. Checksum mismatch. The file may have been modified or damaged."
   - Recovery: User must try different backup file

7. **Incorrect Backup Password**
   - Message: "Failed to import wallet backup: Decryption failed: incorrect password or corrupted data"
   - Recovery: User must enter correct backup password

8. **Version Mismatch**
   - Message: "Backup version {version} is not supported. Please update the extension."
   - Recovery: User must update extension to support newer backup format

### Testing Strategy

**Unit Tests Needed** (for BackupManager):
1. Export with correct passwords → Success
2. Export with same passwords → Error
3. Export with weak backup password → Error
4. Import with correct password → Success
5. Import with incorrect password → Error
6. Validate valid file → Success with metadata
7. Validate invalid file → Error
8. Validate corrupted file → Error
9. Checksum verification → Detects tampering
10. Network consistency validation

**Integration Tests Needed**:
1. Full export/import cycle → All data preserved
2. Export → Modify file → Import → Checksum error
3. Export → Import on fresh install → Wallet restored
4. Export → Import to replace existing → Old wallet deleted, new restored
5. Address indices preservation → No fund loss
6. Multisig wallet backup → PSBTs preserved
7. Imported keys backup → Keys preserved and decryptable

**Manual Testing**:
1. Export wallet with various account types
2. Import on different device
3. Verify all accounts appear
4. Verify balances correct
5. Verify addresses match
6. Verify contacts preserved
7. Verify settings preserved
8. Verify multisig PSBTs preserved
9. Test with corrupted file
10. Test with wrong password

### Performance Considerations

**Export Time**:
- Small wallet (1 account, few contacts): ~3-5 seconds
- Medium wallet (5 accounts, 50 contacts): ~5-10 seconds
- Large wallet (10 accounts, 100 contacts, multisig): ~10-15 seconds
- Bottleneck: 600K PBKDF2 iterations (~5-8 seconds on typical hardware)

**Import Time**:
- Similar to export time
- Bottleneck: 600K PBKDF2 iterations

**File Size**:
- Base (empty wallet): ~2-3 KB
- Per account: ~500 bytes - 2 KB (depends on addresses generated)
- Per contact: ~200-500 bytes
- Typical wallet: 10-50 KB
- Large wallet with multisig: 50-200 KB
- Maximum recommended: 10 MB (enforced in UI)

### Security Best Practices

**For Users**:
1. Use different backup password from wallet password
2. Use strong backup password (12+ chars, mixed case, numbers, symbols)
3. Store backup file securely (encrypted USB, password manager)
4. Never email backup file unencrypted
5. Test restore periodically
6. Keep multiple backups in different locations
7. Export new backup after creating new accounts

**For Developers**:
1. Never log backup password, wallet password, or decrypted data
2. Clear sensitive data from memory after use
3. Validate all inputs before cryptographic operations
4. Use constant-time comparison for authentication tags
5. Enforce separate passwords
6. Always lock wallet after import
7. Verify checksum before decryption

### Future Enhancements

**Post-MVP Features**:
1. **Selective Restore**
   - Import only contacts
   - Import only accounts
   - Choose which accounts to import
   - Merge vs replace options

2. **Backup Verification**
   - Test restore without actually importing
   - Verify backup integrity
   - Compare backup to current wallet

3. **Cloud Integration**
   - Import from cloud storage (Dropbox, Google Drive)
   - Direct restore from cloud
   - Automatic cloud sync (with warnings)

4. **Multiple Backups**
   - Import history tracking
   - Compare multiple backups
   - Choose which backup to restore

5. **Enhanced Encryption**
   - Support for 1M+ PBKDF2 iterations (when performance allows)
   - Optional hardware key support (YubiKey, Ledger)
   - Multi-signature backup decryption

6. **Network Migration**
   - Convert testnet backup to mainnet format
   - Migrate addresses (with warnings)
   - Support network-agnostic backups

### Documentation References

- **Product Requirements**: `prompts/docs/plans/WALLET_BACKUP_RESTORE_PRD.md`
- **Blockchain Review**: `prompts/docs/plans/WALLET_BACKUP_BITCOIN_REVIEW.md`
- **Import UX Spec**: `prompts/docs/plans/WALLET_BACKUP_IMPORT_UX_SPEC.md`
- **Export UX Spec**: `prompts/docs/plans/ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md`
- **Backend Plan**: `prompts/docs/plans/WALLET_BACKUP_BACKEND_PLAN.md` (if exists)

### Troubleshooting

**Problem**: Export takes too long (>30 seconds)
- **Cause**: 600K PBKDF2 iterations on slow hardware
- **Solution**: Add progress UI, explain delay is for security

**Problem**: Import fails with "Decryption failed"
- **Cause**: Wrong backup password OR corrupted file
- **Solution**: Verify backup password, try different backup file, check checksum

**Problem**: Restored wallet missing addresses/funds
- **Cause**: Address indices not preserved in backup
- **Solution**: Check BackupPayload includes externalIndex/internalIndex

**Problem**: Backup file too large (>10 MB)
- **Cause**: Too many addresses cached or PSBTs stored
- **Solution**: Clean up old PSBTs, limit address cache size

**Problem**: Import succeeds but wallet locked
- **Cause**: By design - wallet is locked after import for security
- **Solution**: Explain to user, provide unlock flow

### Implementation Checklist

- [x] Create BackupManager.ts module
- [x] Implement exportWallet() method
- [x] Implement importWallet() method
- [x] Implement validateBackupFile() method
- [x] Add message handlers in background/index.ts
- [x] Add MessageType enum entries
- [x] Export with progress callbacks
- [x] Import with progress callbacks
- [x] Validate separate passwords
- [x] Validate backup password strength
- [x] Generate checksum
- [x] Verify checksum on import
- [x] Preserve address indices
- [x] Lock wallet after import
- [x] Network validation
- [ ] Unit tests for BackupManager
- [ ] Integration tests for full cycle
- [ ] Manual testing on testnet
- [ ] Frontend components for export flow
- [ ] Frontend components for import flow
- [ ] Error handling UI
- [ ] Progress UI with steps
- [ ] Success confirmation UI

---

**Last Updated**: 2025-10-26
**Implementation Status**: ✅ Backend Complete - Ready for Frontend Integration
**Testing Status**: ⏳ Pending Unit Tests
**Documentation Status**: ✅ Complete
**Next Steps**:
1. Frontend Developer implements export/import UI components
2. Testing Expert writes unit tests for BackupManager
3. Testing Expert writes integration tests for full backup cycle
4. QA Engineer performs manual testing on testnet
5. Security Expert reviews encryption implementation
6. Blockchain Expert verifies address indices preservation
