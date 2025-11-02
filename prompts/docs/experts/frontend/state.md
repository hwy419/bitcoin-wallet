# State Management

**Last Updated**: October 22, 2025
**Quick Nav**: [Index](./_INDEX.md) | [Architecture](./architecture.md) | [Components](./components.md) | [Styling](./styling.md) | [Decisions](./decisions.md)

---

## Overview

The Bitcoin wallet uses **React Context + Custom Hooks** for state management. The background service worker is the source of truth, with the frontend (tab) maintaining a synchronized view of that state.

---

## Strategy: React Context + Custom Hooks

**Decision**: Using React Context API with custom hooks instead of Redux/Zustand

**Rationale**:
- Simpler setup for Chrome extension tab
- Background service worker is true source of truth
- State is scoped to tab lifecycle
- No need for complex middleware or dev tools
- Lightweight and performant for our use case

---

## Global State Structure

### WalletState Interface

```typescript
interface WalletState {
  // Authentication
  isLocked: boolean;
  isInitialized: boolean;

  // Account Management
  currentAccountIndex: number;
  accounts: Account[];

  // Balance
  balance: {
    confirmed: number;      // in satoshis
    unconfirmed: number;    // in satoshis
  };

  // Transactions
  transactions: Transaction[];

  // UI State
  isLoading: boolean;
  error: string | null;

  // Network
  network: 'testnet' | 'mainnet';
}
```

### Account Interface

```typescript
interface Account {
  index: number;
  name: string;
  addressType: 'legacy' | 'segwit' | 'native-segwit';
  balance: number;
  externalIndex: number;
  internalIndex: number;
  addresses: Address[];
}
```

### Transaction Interface

```typescript
interface Transaction {
  txid: string;
  type: 'sent' | 'received';
  amount: number;
  fee: number;
  confirmations: number;
  timestamp: number;
  address: string;
}
```

### Address Interface

```typescript
interface Address {
  address: string;
  index: number;
  type: 'external' | 'internal';
  used: boolean;
}
```

---

## WalletContext Implementation

### Context Type

```typescript
// src/tab/context/WalletContext.tsx

interface WalletContextType {
  state: WalletState;
  actions: {
    unlock: (password: string) => Promise<void>;
    lock: () => void;
    createWallet: (password: string, addressType: string) => Promise<void>;
    importWallet: (seed: string, password: string) => Promise<void>;
    switchAccount: (index: number) => void;
    createAccount: (name: string) => Promise<void>;
    refreshBalance: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
  };
}
```

### Provider Implementation

```typescript
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>(initialState);

  // Actions implementation
  const actions = {
    unlock: async (password: string) => {
      // Send UNLOCK_WALLET message to background
      const response = await chrome.runtime.sendMessage({
        type: 'UNLOCK_WALLET',
        payload: { password }
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          isLocked: false,
          accounts: response.data.accounts,
          currentAccountIndex: response.data.currentAccountIndex
        }));
      } else {
        throw new Error(response.error);
      }
    },

    lock: () => {
      chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
      setState(prev => ({ ...prev, isLocked: true }));
    },

    // ... other actions
  };

  return (
    <WalletContext.Provider value={{ state, actions }}>
      {children}
    </WalletContext.Provider>
  );
};
```

---

## State Synchronization Rules

1. **Source of Truth**: Background service worker owns the state
2. **Tab Mount**: Fetch full state from background on mount
3. **Periodic Sync**: Poll background every 30 seconds when unlocked
4. **Optimistic Updates**: Update UI immediately, rollback on error
5. **Event Listeners**: Background can push updates to tab via chrome.runtime
6. **Service Worker Restart**: Re-fetch state if service worker restarts

### Synchronization Implementation

```typescript
// In WalletProvider
useEffect(() => {
  // Fetch initial state on mount
  async function fetchState() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
    setState(response.data);
  }

  fetchState();

  // Set up periodic sync
  const syncInterval = setInterval(async () => {
    if (!state.isLocked) {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
      setState(response.data);
    }
  }, 30000); // 30 seconds

  // Listen for state updates from background
  const handleMessage = (message: any) => {
    if (message.type === 'STATE_UPDATED') {
      setState(message.data);
    }
  };

  chrome.runtime.onMessage.addListener(handleMessage);

  // Cleanup
  return () => {
    clearInterval(syncInterval);
    chrome.runtime.onMessage.removeListener(handleMessage);
  };
}, [state.isLocked]);
```

---

## Custom Hooks

### useWallet

**Purpose**: Main wallet operations hook

**API**:
```typescript
const { state, unlock, lock, refreshBalance } = useWallet();
```

**Returns**:
- `state`: Full WalletState object
- `unlock(password)`: Unlock wallet
- `lock()`: Lock wallet
- `createWallet(password, addressType)`: Create new wallet
- `importWallet(seed, password)`: Import from seed
- `refreshBalance()`: Refresh balance from blockchain
- `refreshTransactions()`: Refresh transaction history

**Implementation**:
```typescript
export const useWallet = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }

  return context;
};
```

---

### useAccounts

**Purpose**: Account management hook

**API**:
```typescript
const { accounts, currentAccount, switchAccount, createAccount } = useAccounts();
```

**Returns**:
- `accounts`: Array of all accounts
- `currentAccount`: Currently selected account
- `switchAccount(index)`: Switch to different account
- `createAccount(name)`: Create new HD account
- `deleteAccount(index)`: Delete account (with confirmation)
- `updateAccountName(index, name)`: Rename account

**Implementation**:
```typescript
export const useAccounts = () => {
  const { state, actions } = useWallet();

  return {
    accounts: state.accounts,
    currentAccount: state.accounts[state.currentAccountIndex],
    switchAccount: actions.switchAccount,
    createAccount: actions.createAccount,
    // ... other account actions
  };
};
```

---

### useBalance

**Purpose**: Balance fetching and formatting

**API**:
```typescript
const { balance, refreshBalance, formatBTC, formatUSD } = useBalance();
```

**Returns**:
- `balance`: Current balance in satoshis
- `refreshBalance()`: Refresh from blockchain
- `formatBTC(satoshis)`: Format as BTC string
- `formatUSD(satoshis, price)`: Format as USD string
- `satoshisToBTC(satoshis)`: Convert to BTC number
- `btcToSatoshis(btc)`: Convert to satoshis number

**Implementation**:
```typescript
export const useBalance = () => {
  const { state, actions } = useWallet();

  const formatBTC = (satoshis: number): string => {
    const btc = satoshis / 100000000;
    return `${btc.toFixed(8)} BTC`;
  };

  const formatUSD = (satoshis: number, pricePerBTC: number): string => {
    const btc = satoshis / 100000000;
    const usd = btc * pricePerBTC;
    return `$${usd.toFixed(2)}`;
  };

  return {
    balance: state.balance,
    refreshBalance: actions.refreshBalance,
    formatBTC,
    formatUSD,
    satoshisToBTC: (sats: number) => sats / 100000000,
    btcToSatoshis: (btc: number) => Math.floor(btc * 100000000),
  };
};
```

---

### useTransactions

**Purpose**: Transaction history management

**API**:
```typescript
const { transactions, refreshTransactions, getTransaction } = useTransactions();
```

**Returns**:
- `transactions`: Array of transactions (sorted by timestamp desc)
- `refreshTransactions()`: Refresh from blockchain
- `getTransaction(txid)`: Get specific transaction by TXID
- `sentTransactions`: Filter for sent transactions
- `receivedTransactions`: Filter for received transactions
- `pendingTransactions`: Filter for unconfirmed transactions

**Implementation**:
```typescript
export const useTransactions = () => {
  const { state, actions } = useWallet();

  return {
    transactions: state.transactions,
    refreshTransactions: actions.refreshTransactions,
    getTransaction: (txid: string) =>
      state.transactions.find(tx => tx.txid === txid),
    sentTransactions: state.transactions.filter(tx => tx.type === 'sent'),
    receivedTransactions: state.transactions.filter(tx => tx.type === 'received'),
    pendingTransactions: state.transactions.filter(tx => tx.confirmations === 0),
  };
};
```

---

### useBackgroundMessaging

**Purpose**: Chrome message passing wrapper

**API**:
```typescript
const { sendMessage } = useBackgroundMessaging();

// Usage
const response = await sendMessage<ResponseType>({
  type: MessageType.GET_BALANCE,
  payload: { accountIndex: 0 }
});
```

**Implementation**:
```typescript
// src/tab/hooks/useBackgroundMessaging.ts

const useBackgroundMessaging = () => {
  const sendMessage = useCallback(async <T>(
    type: MessageType,
    payload?: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type, payload },
        (response: ChromeResponse) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.data);
          }
        }
      );
    });
  }, []);

  return { sendMessage };
};
```

**Error Handling**:
- Network errors (no internet)
- Service worker not responding
- Invalid response format
- Timeout handling (5 second timeout)

---

### useAutoLock

**Purpose**: Auto-lock wallet after inactivity

**API**:
```typescript
useAutoLock(15 * 60 * 1000); // 15 minutes
```

**Parameters**:
- `timeout`: Milliseconds of inactivity before locking

**Implementation**:
```typescript
export const useAutoLock = (timeout: number) => {
  const { lock } = useWallet();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        lock();
      }, timeout);
    };

    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimer);
    });

    // Initial timer
    resetTimer();

    // Cleanup
    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [timeout, lock]);
};
```

---

### useBitcoinPrice

**Purpose**: Bitcoin price fetching and state management

**API**:
```typescript
const { price, loading, error, lastUpdated } = useBitcoinPrice(refreshInterval?);
```

**Parameters**:
- `refreshInterval`: Optional refresh interval in milliseconds (default: 5 minutes)

**Returns**:
- `price`: Current BTC/USD price (number | null)
- `loading`: Loading state (boolean)
- `error`: Error state (string | null)
- `lastUpdated`: Timestamp of last price update (number | null)

**Features**:
- Fetches current BTC/USD price from CoinGecko API via background service worker
- Auto-refreshes every 5 minutes (default, configurable)
- Handles mounted/unmounted state to prevent memory leaks
- Cleanup on component unmount

**Implementation**:
```typescript
export const useBitcoinPrice = (refreshInterval: number = 5 * 60 * 1000) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const { sendMessage } = useBackgroundMessaging();

  const fetchPrice = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await sendMessage<{ usd: number; lastUpdated: number }>({
        type: MessageType.GET_BTC_PRICE
      });

      setPrice(response.usd);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [sendMessage]);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout;

    // Initial fetch
    if (mounted) {
      fetchPrice();
    }

    // Set up refresh interval
    interval = setInterval(() => {
      if (mounted) {
        fetchPrice();
      }
    }, refreshInterval);

    // Cleanup
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchPrice, refreshInterval]);

  return { price, loading, error, lastUpdated };
};
```

---

### useBalanceUpdater

**Purpose**: Auto-refresh balance at regular intervals

**API**:
```typescript
useBalanceUpdater(30000); // Refresh every 30 seconds
```

**Parameters**:
- `interval`: Refresh interval in milliseconds

**Implementation**:
```typescript
export const useBalanceUpdater = (interval: number) => {
  const { refreshBalance, state } = useWallet();

  useEffect(() => {
    // Don't refresh if locked
    if (state.isLocked) return;

    const timer = setInterval(() => {
      refreshBalance();
    }, interval);

    return () => clearInterval(timer);
  }, [interval, refreshBalance, state.isLocked]);
};
```

---

## Price Utility Functions

**Location**: `/src/shared/utils/price.ts`

### satoshisToUSD

```typescript
/**
 * Convert satoshis to USD
 * @param satoshis - Amount in satoshis
 * @param pricePerBTC - Current BTC/USD price
 * @returns USD value
 */
export function satoshisToUSD(satoshis: number, pricePerBTC: number): number {
  return (satoshis / 100000000) * pricePerBTC;
}

// Example: 100M sats at $45k = $45,000
const usd = satoshisToUSD(100000000, 45000);
```

### btcToUSD

```typescript
/**
 * Convert BTC to USD
 * @param btc - Amount in BTC
 * @param pricePerBTC - Current BTC/USD price
 * @returns USD value
 */
export function btcToUSD(btc: number, pricePerBTC: number): number {
  return btc * pricePerBTC;
}

// Example: 1.5 BTC at $45k = $67,500
const usd = btcToUSD(1.5, 45000);
```

### formatUSD

```typescript
/**
 * Format USD with proper decimals and symbols
 * @param usd - USD amount
 * @param includeSymbol - Whether to include $ symbol (default: true)
 * @returns Formatted USD string
 */
export function formatUSD(usd: number, includeSymbol: boolean = true): string {
  const symbol = includeSymbol ? '$' : '';

  // Very small amounts
  if (usd < 0.01 && usd > 0) {
    return `<${symbol}0.01`;
  }

  // Less than $1: show up to 4 decimals
  if (usd < 1) {
    return `${symbol}${usd.toFixed(4)}`.replace(/\.?0+$/, '');
  }

  // $1 and above: show 2 decimals with thousand separators
  return `${symbol}${usd.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

// Examples:
formatUSD(45000.50);  // "$45,000.50"
formatUSD(0.12);      // "$0.12"
formatUSD(0.00001);   // "<$0.01"
```

### formatSatoshisAsUSD

```typescript
/**
 * Convenience function: satoshis → USD → formatted string
 * @param satoshis - Amount in satoshis
 * @param pricePerBTC - Current BTC/USD price
 * @returns Formatted USD string
 */
export function formatSatoshisAsUSD(satoshis: number, pricePerBTC: number): string {
  const usd = satoshisToUSD(satoshis, pricePerBTC);
  return formatUSD(usd);
}

// Example: 100M sats at $45k → "$45,000.00"
const formatted = formatSatoshisAsUSD(100000000, 45000);
```

---

## Chrome Message Passing

### Message Structure

```typescript
interface ChromeMessage {
  type: MessageType;
  payload?: any;
}

interface ChromeResponse {
  success: boolean;
  data?: any;
  error?: string;
}

enum MessageType {
  CREATE_WALLET = 'CREATE_WALLET',
  IMPORT_WALLET = 'IMPORT_WALLET',
  UNLOCK_WALLET = 'UNLOCK_WALLET',
  LOCK_WALLET = 'LOCK_WALLET',
  GET_BALANCE = 'GET_BALANCE',
  GET_TRANSACTIONS = 'GET_TRANSACTIONS',
  SEND_TRANSACTION = 'SEND_TRANSACTION',
  GENERATE_ADDRESS = 'GENERATE_ADDRESS',
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  UPDATE_ACCOUNT_NAME = 'UPDATE_ACCOUNT_NAME',
  GET_FEE_ESTIMATES = 'GET_FEE_ESTIMATES',
  GET_BTC_PRICE = 'GET_BTC_PRICE',
  EXPORT_PRIVATE_KEY = 'EXPORT_PRIVATE_KEY',
  IMPORT_PRIVATE_KEY = 'IMPORT_PRIVATE_KEY',
}
```

### Message Flow Examples

**Create Wallet**:
```typescript
// Frontend
const { sendMessage } = useBackgroundMessaging();

const createWallet = async (password: string, addressType: string) => {
  const response = await sendMessage({
    type: MessageType.CREATE_WALLET,
    payload: { password, addressType }
  });

  // response.data contains wallet info
};
```

**Send Transaction**:
```typescript
const sendTransaction = async (to: string, amount: number, feeRate: number) => {
  const response = await sendMessage({
    type: MessageType.SEND_TRANSACTION,
    payload: { to, amount, feeRate }
  });

  // response.data contains txid
  console.log('Transaction sent:', response.data.txid);
};
```

**Get Balance**:
```typescript
const fetchBalance = async (accountIndex: number) => {
  const response = await sendMessage({
    type: MessageType.GET_BALANCE,
    payload: { accountIndex }
  });

  // response.data contains balance info
  setBalance(response.data);
};
```

---

## Service Worker Lifecycle Handling

### Service Worker Restart Detection

Chrome service workers can terminate and restart. The frontend must handle this:

```typescript
// In WalletProvider
useEffect(() => {
  const checkServiceWorker = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'PING' });
      if (!response) {
        console.log('Service worker restarted, re-fetching state');
        fetchState();
      }
    } catch (error) {
      console.log('Service worker not responding');
      // Show error UI
    }
  };

  // Check every minute
  const interval = setInterval(checkServiceWorker, 60000);

  return () => clearInterval(interval);
}, []);
```

### Keep-Alive Pattern

To prevent service worker from terminating during critical operations:

```typescript
// Before long operation
chrome.runtime.sendMessage({ type: 'KEEP_ALIVE_START' });

// Perform operation
await longRunningOperation();

// After operation
chrome.runtime.sendMessage({ type: 'KEEP_ALIVE_END' });
```

---

## Optimistic Updates Pattern

For better UX, update UI immediately and rollback on error:

```typescript
const updateAccountName = async (index: number, newName: string) => {
  const oldName = accounts[index].name;

  // Optimistic update
  setAccounts(prev => prev.map((acc, i) =>
    i === index ? { ...acc, name: newName } : acc
  ));

  try {
    await sendMessage({
      type: MessageType.UPDATE_ACCOUNT_NAME,
      payload: { index, name: newName }
    });
  } catch (error) {
    // Rollback on error
    setAccounts(prev => prev.map((acc, i) =>
      i === index ? { ...acc, name: oldName } : acc
    ));

    // Show error
    toast.error('Failed to update account name');
  }
};
```

---

## State Persistence

**Storage**: All wallet state is persisted in background service worker via chrome.storage.local

**What's Stored**:
- Encrypted wallet data (seed, keys)
- Account information (names, indices, address types)
- Settings (network, theme, auto-lock timeout)
- Contacts
- Transaction cache

**What's NOT Stored**:
- Bitcoin price (fetched on demand)
- Decrypted keys (memory only in background)
- UI state (component-level)
- Session tokens (memory only)

**Frontend Storage**:
The frontend (tab) does NOT persist any sensitive data. It fetches everything from background on mount and discards on unmount.

---

## Error States

### Global Error Handling

```typescript
interface ErrorState {
  type: 'network' | 'auth' | 'validation' | 'unknown';
  message: string;
  retryable: boolean;
}

const [error, setError] = useState<ErrorState | null>(null);

// Network error
setError({
  type: 'network',
  message: 'Unable to connect to Bitcoin network',
  retryable: true
});

// Auth error
setError({
  type: 'auth',
  message: 'Incorrect password',
  retryable: true
});

// Validation error
setError({
  type: 'validation',
  message: 'Invalid Bitcoin address',
  retryable: false
});
```

### Error UI

```tsx
{error && (
  <div className={`p-4 rounded-lg ${
    error.retryable ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
  }`}>
    <p className="font-semibold">{error.message}</p>
    {error.retryable && (
      <button onClick={retry}>Retry</button>
    )}
  </div>
)}
```

---

## Loading States

### Global Loading

```typescript
const [isLoading, setIsLoading] = useState(false);

// Wrap async operations
const performAction = async () => {
  setIsLoading(true);
  try {
    await action();
  } finally {
    setIsLoading(false);
  }
};
```

### Granular Loading

```typescript
const [loadingStates, setLoadingStates] = useState({
  balance: false,
  transactions: false,
  price: false,
});

const refreshBalance = async () => {
  setLoadingStates(prev => ({ ...prev, balance: true }));
  try {
    await fetchBalance();
  } finally {
    setLoadingStates(prev => ({ ...prev, balance: false }));
  }
};
```

---

**Related Documentation**:
- [Architecture](./architecture.md) - Component hierarchy and tab structure
- [Components](./components.md) - Component APIs and patterns
- [Styling](./styling.md) - Tailwind and design tokens
- [Decisions](./decisions.md) - State management decisions
