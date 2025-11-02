# Service Worker Architecture

**Last Updated**: October 22, 2025
**Related**: [messages.md](./messages.md) | [storage.md](./storage.md) | [api.md](./api.md) | [_INDEX.md](./_INDEX.md)

---

## Quick Navigation

- [Tab-Based Architecture](#tab-based-architecture)
- [Service Worker Core](#service-worker-core)
- [Tab Lifecycle Management](#tab-lifecycle-management)
- [In-Memory State Management](#in-memory-state-management)
- [Auto-Lock Implementation](#auto-lock-implementation)
- [Wizard Session Management](#wizard-session-management)

---

## Tab-Based Architecture

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

#### 1. Extension Icon Click Handler

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

#### 3. Message Passing Pattern

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

## Service Worker Core

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
├── bitcoin/
│   ├── TransactionBuilder.ts  # Transaction building
│   ├── FeeEstimator.ts        # Fee estimation
│   └── Signer.ts              # Transaction signing
├── api/
│   ├── BlockstreamClient.ts   # Blockchain API client
│   └── PriceService.ts        # BTC price service
├── wizard/
│   └── WizardSessionStorage.ts # Multisig wizard session persistence
└── utils/
    ├── validation.ts           # Input validation
    └── errors.ts               # Custom error types
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

## In-Memory State Management

### State Object

The background service worker maintains in-memory state for the active wallet session:

```typescript
interface BackgroundState {
  // Wallet state
  isUnlocked: boolean;
  decryptedSeed: Buffer | null;     // SENSITIVE: Cleared on lock
  hdWallet: HDWallet | null;         // SENSITIVE: Cleared on lock
  addressGenerator: AddressGenerator | null; // SENSITIVE: Cleared on lock

  // Activity tracking
  lastActivity: number;              // Timestamp of last user interaction
  autoLockTimer: NodeJS.Timeout | null;

  // Tab session tokens (single tab enforcement)
  activeTabSession: {
    tabId: number;
    token: string;                   // 256-bit random token
    issuedAt: number;
  } | null;
}
```

**Critical Security Rules**:
1. **NEVER** log sensitive state fields (`decryptedSeed`, `hdWallet`)
2. **ALWAYS** clear sensitive data on lock
3. **ALWAYS** check `isUnlocked` before crypto operations
4. **ALWAYS** update `lastActivity` on every message

### State Lifecycle

**On Service Worker Start**:
```typescript
// Initialize state
const state: BackgroundState = {
  isUnlocked: false,
  decryptedSeed: null,
  hdWallet: null,
  addressGenerator: null,
  lastActivity: Date.now(),
  autoLockTimer: null,
  activeTabSession: null,
};

// Restore persisted activity timestamp
chrome.storage.local.get(['lastActivity']).then((result) => {
  if (result.lastActivity) {
    state.lastActivity = result.lastActivity;
  }
});
```

**On UNLOCK_WALLET**:
```typescript
async function handleUnlockWallet(password: string): Promise<MessageResponse> {
  // Decrypt seed from storage
  const mnemonic = await WalletStorage.unlockWallet(password);
  const seed = KeyManager.mnemonicToSeed(mnemonic);

  // Load into memory
  state.decryptedSeed = seed;
  state.hdWallet = new HDWallet(seed, 'testnet');
  state.addressGenerator = new AddressGenerator('testnet');
  state.isUnlocked = true;

  // Start auto-lock
  startAutoLock();

  return { success: true };
}
```

**On LOCK_WALLET**:
```typescript
function handleLockWallet(): MessageResponse {
  // Clear sensitive data (best-effort memory clearing in JavaScript)
  if (state.decryptedSeed) {
    state.decryptedSeed.fill(0); // Overwrite buffer
    state.decryptedSeed = null;
  }

  state.hdWallet = null;
  state.addressGenerator = null;
  state.isUnlocked = false;

  // Stop auto-lock timer
  if (state.autoLockTimer) {
    clearTimeout(state.autoLockTimer);
    state.autoLockTimer = null;
  }

  return { success: true, message: 'Wallet locked' };
}
```

**On Service Worker Termination**:
```typescript
self.addEventListener('beforeunload', () => {
  if (state.isUnlocked) {
    handleLockWallet();
  }
});
```

**Note**: This is best-effort (service worker may terminate without notice)

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

function updateActivity(): void {
  state.lastActivity = Date.now();
  chrome.storage.local.set({ lastActivity: state.lastActivity });

  // Reset timeout-based auto-lock
  if (state.autoLockTimer) {
    clearTimeout(state.autoLockTimer);
  }
  if (state.isUnlocked) {
    startAutoLock();
  }
}
```

This ensures the 15-minute countdown only starts after the LAST user interaction.

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

---

## Security Considerations

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

### Memory Clearing Limitations

**Challenge**: JavaScript cannot guarantee memory overwrite

**Best-Effort Approach**:
```typescript
// Clear buffer (overwrite with zeros)
if (state.decryptedSeed) {
  state.decryptedSeed.fill(0);
  state.decryptedSeed = null;
}
```

**Mitigation**:
- Service worker termination clears memory
- Auto-lock reduces exposure window
- Encrypted storage prevents persistence

---

## See Also

- [messages.md](./messages.md) - Message handler system
- [storage.md](./storage.md) - Chrome storage patterns
- [api.md](./api.md) - API integration
- [decisions.md](./decisions.md) - Backend ADRs
