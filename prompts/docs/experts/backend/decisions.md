# Backend Architectural Decision Records (ADRs)

**Last Updated**: October 22, 2025
**Related**: [service-worker.md](./service-worker.md) | [messages.md](./messages.md) | [storage.md](./storage.md) | [api.md](./api.md) | [_INDEX.md](./_INDEX.md)

---

## Quick Navigation

- [Major Architectural Decisions](#major-architectural-decisions)
- [Security Decisions](#security-decisions)
- [API Decisions](#api-decisions)
- [Storage Decisions](#storage-decisions)
- [UX Decisions](#ux-decisions)

---

## Major Architectural Decisions

### ADR-0: Migration to Tab-Based Architecture

**Date**: 2025-10-18
**Status**: ✅ Implemented
**Impact**: MAJOR ARCHITECTURAL CHANGE

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
- More complex lifecycle management → **Documented** extensively

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
- See [service-worker.md](./service-worker.md#tab-based-architecture) for detailed architecture
- See [service-worker.md](./service-worker.md#tab-lifecycle-management) for tab opening/closing patterns
- See [messages.md](./messages.md#single-tab-enforcement) for security implementation

---

### ADR-1: Dual-Mechanism Auto-Lock

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Service workers can terminate unpredictably

**Decision**: Implement BOTH timeout-based and alarm-based auto-lock

**Rationale**:
- **Timeout**: Accurate (exact 15 minutes), clears on service worker termination (acceptable)
- **Alarm**: Persistent (survives restarts), 1-minute granularity (acceptable for 15-min timeout)
- **Combined**: Reliable auto-lock in all scenarios

**Implementation**:

1. **setTimeout-based** (in-memory):
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

2. **chrome.alarms-based** (persistent):
   ```typescript
   chrome.alarms.create('checkInactivity', { periodInMinutes: 1 });

   chrome.alarms.onAlarm.addListener((alarm) => {
     if (alarm.name === 'checkInactivity') {
       const inactiveMs = Date.now() - state.lastActivity;
       if (inactiveMs >= 15 * 60 * 1000) {
         handleLockWallet();
       }
     }
   });
   ```

**Trade-offs**:
- **Complexity**: Two mechanisms vs. one
- **Accuracy**: Alarm has 1-minute granularity (acceptable)
- **Reliability**: Dual mechanism ensures lock (high confidence)

**References**:
- See [service-worker.md](./service-worker.md#auto-lock-implementation) for full implementation

---

## Security Decisions

### ADR-2: Generic Unlock Error Messages

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Balance security vs. user-friendly errors

**Decision**: Return generic "Incorrect password or failed to unlock" error

**Rationale**:
- **Security**: Don't reveal if wallet exists (prevents timing attacks)
- **Security**: Don't distinguish wrong password from corruption (prevents information leakage)
- **Trade-off**: Less helpful, but more secure

**Alternatives Considered**:
- Specific errors: "Wrong password" vs "Corrupted wallet"
- **Rejected**: Information leakage risk

**Example**:
```typescript
try {
  const mnemonic = await WalletStorage.unlockWallet(password);
  // ...
} catch (error) {
  // Generic error - don't reveal details
  return { success: false, error: 'Incorrect password or failed to unlock' };
}
```

---

### ADR-3: Return Mnemonic in CREATE_WALLET Response

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: User needs to back up seed phrase

**Decision**: Return mnemonic in `CREATE_WALLET` response

**Rationale**:
- **UX**: User must see and back up seed phrase
- **Security**: Only shown ONCE (not logged, not persisted)
- **Implementation**: Frontend displays modal with backup flow

**Security Notes**:
- Mnemonic transmitted in message (in-memory only)
- User responsible for backing up (extension cannot back up securely)
- If lost, no recovery (standard crypto wallet behavior)

**Example**:
```typescript
case MessageType.CREATE_WALLET:
  const { mnemonic, firstAddress } = await createWallet(payload);
  return {
    success: true,
    data: { mnemonic, firstAddress }  // Mnemonic shown ONCE
  };
```

---

### ADR-4: Require Unlock for CREATE_ACCOUNT

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Creating a new account requires HD wallet for key derivation

**Decision**: `CREATE_ACCOUNT` requires unlocked wallet

**Rationale**:
- **Security**: Need decrypted seed for account derivation
- **Consistency**: All crypto operations require unlock
- **UX**: User confirms password before adding account

**Alternatives Considered**:
- Prompt for password in CREATE_ACCOUNT payload
- **Rejected**: Would duplicate unlock logic

**Implementation**:
```typescript
case MessageType.CREATE_ACCOUNT:
  if (!state.isUnlocked) {
    return { success: false, error: 'Wallet is locked' };
  }
  // Proceed with account creation...
```

---

### ADR-5: Update Activity on Every Message

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Need to track user activity for auto-lock

**Decision**: Call `updateActivity()` at the start of every message handler

**Rationale**:
- **Simple**: Single line in `handleMessage()`
- **Accurate**: Any user interaction resets timer
- **Secure**: No activity = lock (15 minutes)

**Trade-offs**:
- Includes non-sensitive operations (GET_WALLET_STATE)
- **Acceptable**: Better to err on side of keeping wallet unlocked during active use

**Implementation**:
```typescript
async function handleMessage(message: Message): Promise<MessageResponse> {
  updateActivity(); // Reset inactivity timer

  switch (message.type) {
    case MessageType.GET_WALLET_STATE:
    case MessageType.UNLOCK_WALLET:
    // ... all handlers
  }
}
```

---

## API Decisions

### ADR-6: Exponential Backoff with Limited Retries

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Blockstream API can be unreliable (network errors, rate limiting)

**Decision**: Implement retry logic with exponential backoff (1s, 2s, 4s delays)

**Rationale**:
- **Resilience**: Transient network errors are common (retry helps)
- **Exponential backoff**: Reduces server load, avoids rate limiting
- **Limited retries**: 3 attempts total (avoid infinite loops)
- **Smart retry**: Skip non-retryable errors (404, invalid address)

**Trade-offs**:
- **Latency**: Max 7 seconds added delay (1 + 2 + 4)
- **Acceptable**: Better than failing immediately on transient errors

**Implementation**:
```typescript
private retryDelays: number[] = [1000, 2000, 4000]; // 1s, 2s, 4s

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    return await this.makeRequest(url, options);
  } catch (error) {
    if (attempt < maxAttempts - 1 && this.shouldRetry(error)) {
      await this.delay(this.retryDelays[attempt]);
      continue;
    }
    throw error;
  }
}
```

**References**:
- See [api.md](./api.md#exponential-backoff-retry-logic) for full implementation

---

### ADR-7: 10-Second Request Timeout

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: API requests can hang indefinitely

**Decision**: Set 10-second timeout for all API requests

**Rationale**:
- **UX**: Users shouldn't wait forever
- **Resource management**: Prevent stuck requests in service worker
- **Reasonable**: Most API calls complete in <2 seconds
- **Fail-fast**: Better to show error than hang UI

**Alternatives Considered**:
- 30 seconds: Too long for user experience
- 5 seconds: Too short for slow networks
- No timeout: Risk of hanging indefinitely

**Implementation**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new ApiError(ApiErrorType.TIMEOUT, 'Request timed out');
  }
  throw error;
}
```

**References**:
- See [api.md](./api.md#timeout-handling) for full implementation

---

### ADR-8: Parse Transaction Value Relative to Address

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Transactions have multiple inputs/outputs, need to calculate value change for specific address

**Decision**: Calculate value as `outputs_to_address - inputs_from_address`

**Rationale**:
- **Received transaction**: Positive value (more outputs than inputs)
- **Sent transaction**: Negative value (more inputs than outputs)
- **Internal transfer**: Near-zero (inputs ≈ outputs, minus fee)
- **User-friendly**: Shows net change for the address

**Example**:
```typescript
// Received 100k sats to tb1q...
value = 100000 (outputs) - 0 (inputs) = +100000

// Sent 50k sats from tb1q...
value = 0 (outputs) - 50000 (inputs) = -50000
```

**Implementation**:
```typescript
let value = 0;
for (const output of tx.vout) {
  if (output.scriptpubkey_address === address) {
    value += output.value;
  }
}
for (const input of tx.vin) {
  if (input.prevout?.scriptpubkey_address === address) {
    value -= input.prevout.value;
  }
}
```

---

### ADR-9: Singleton Testnet Client Export

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Most of the extension uses testnet by default

**Decision**: Export singleton `blockstreamClient` for convenience

**Rationale**:
- **Convenience**: No need to instantiate for common use
- **Default network**: Testnet matches extension default
- **Still flexible**: Can create custom instance for mainnet

**Usage**:
```typescript
// Default testnet
import { blockstreamClient } from './api/BlockstreamClient';

// Custom network
import { BlockstreamClient } from './api/BlockstreamClient';
const mainnetClient = new BlockstreamClient('mainnet');
```

---

## Storage Decisions

### ADR-10: Store Addresses in Account Object

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Need to track generated addresses

**Decision**: Store all generated addresses in `account.addresses[]`

**Rationale**:
- **Simplicity**: All account data in one place
- **Performance**: No separate address lookup
- **Storage**: Addresses are small (~150 bytes each)

**Alternatives Considered**:
- Separate storage key for addresses (more complex, no benefit)

**Trade-offs**:
- **Storage size**: Grows with addresses (acceptable, 60k+ capacity)
- **Read performance**: Load all addresses on unlock (acceptable for MVP)

**Schema**:
```typescript
interface Account {
  index: number,
  name: string,
  addressType: AddressType,
  externalIndex: number,
  internalIndex: number,
  addresses: Address[]  // All addresses stored here
}
```

**References**:
- See [storage.md](./storage.md#storage-schema) for full schema

---

## UX Decisions

### ADR-11: Native SegWit Default Address Type

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Users need a default address type for account creation

**Decision**: Default to `'native-segwit'` (BIP84, tb1... addresses)

**Rationale**:
- **Lower fees**: SegWit witness discount
- **Better privacy**: Bech32 format
- **Modern standard**: Widely supported
- **Testnet**: `tb1...` prefix (clear testnet indicator)

**Alternatives Considered**:
- **Legacy**: Highest compatibility, but higher fees
- **SegWit wrapped**: Compatibility with older wallets, but not as efficient

**Implementation**:
```typescript
async function handleCreateWallet(payload) {
  const addressType = payload.addressType || 'native-segwit';
  // ...
}
```

---

### ADR-12: First Account Named "Account 1"

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Need a user-friendly default account name

**Decision**: First account is "Account 1" (not "Account 0")

**Rationale**:
- **UX**: Users expect 1-indexed naming ("Account 1", "Account 2", ...)
- **Implementation**: Internally 0-indexed (accountIndex: 0, 1, 2, ...)
- **Consistency**: MetaMask uses "Account 1" naming convention

**Implementation**:
```typescript
const defaultName = `Account ${accounts.length + 1}`;
```

---

## Multisig Decisions

### ADR-13: PSBT as Communication Format

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Need standard format for coordinating multisig signatures

**Decision**: Use BIP174 PSBTs as communication format

**Rationale**:
- **Standard**: BIP174 PSBTs are the Bitcoin standard for coordinating multisig signatures
- **Complete**: Contain all necessary transaction info
- **Partial signing**: Support partial signing by multiple parties
- **Portable**: Can be easily transmitted (base64, hex, QR)
- **Supported**: All major Bitcoin libraries support PSBTs

**Alternatives Considered**:
- Raw transaction hex
- **Rejected**: Can't be partially signed

---

### ADR-14: Separate Handlers for Build/Sign

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Multisig transactions need to be built and signed separately

**Decision**: Separate `BUILD_MULTISIG_TRANSACTION` and `SIGN_MULTISIG_TRANSACTION` handlers

**Rationale**:
- **BUILD**: Creates unsigned PSBT for distribution
- **SIGN**: Adds our signature to any PSBT (ours or received)
- **Flexibility**: Allows flexible workflow (create vs. receive)
- **Single responsibility**: Each handler has single responsibility

**Alternatives Considered**:
- Single SEND_MULTISIG handler
- **Rejected**: Too complex, less flexible

---

### ADR-15: Pending Transaction Storage

**Date**: 2025-10-12
**Status**: ✅ Implemented

**Context**: Users need to track PSBTs awaiting signatures

**Decision**: Store pending multisig transactions in `pendingMultisigTxs[]`

**Rationale**:
- **Persistence**: Users need to track PSBTs awaiting signatures
- **Reopening**: Extension can close/reopen during signing process
- **UI state**: Pending txs provide UI state for incomplete transactions
- **Expiration**: 7-day expiration prevents unbounded growth

**Alternatives Considered**:
- No persistence
- **Rejected**: Poor UX, data loss

**Schema**:
```typescript
interface StoredWalletV2 {
  version: 2,
  // ... other fields
  pendingMultisigTxs: PendingMultisigTx[]  // NEW
}
```

---

### ADR-16: Type-Cast MultisigAccount in Storage

**Date**: 2025-10-12
**Status**: ✅ Implemented (Technical Debt)

**Context**: Need to store MultisigAccount in existing WalletStorage

**Decision**: Type-cast MultisigAccount to `any` when calling `addAccount()`

**Rationale**:
- **Quick implementation**: Meet v0.8.0 deadline
- **Compatible structure**: WalletStorage already stores Account objects
- **Interface compatibility**: MultisigAccount extends same interface
- **Storage support**: StoredWalletV2 supports both types

**Technical Debt**:
- Should refactor WalletStorage to properly handle `WalletAccount` union type
- Affects: CREATE_MULTISIG_ACCOUNT handler

**Future Work**:
```typescript
// Current (type-casting)
await WalletStorage.addAccount(multisigAccount as any);

// Future (proper typing)
await WalletStorage.addAccount(multisigAccount); // WalletAccount union type
```

---

## See Also

- [service-worker.md](./service-worker.md) - Service worker architecture
- [messages.md](./messages.md) - Message handler implementations
- [storage.md](./storage.md) - Chrome storage patterns
- [api.md](./api.md) - API integration details
