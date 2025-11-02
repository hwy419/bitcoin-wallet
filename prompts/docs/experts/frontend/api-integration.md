# Frontend API Integration Documentation

**Last Updated**: 2025-10-28
**Version**: v0.11.0
**Status**: Production Ready

---

## Overview

This document covers the frontend integration with blockchain APIs, including the Lambda proxy architecture, error handling patterns, and loading state management.

---

## Lambda Proxy Integration (v0.11.0)

### Architecture

The extension uses an AWS Lambda proxy to securely access the Blockstream API:

```
Extension → Lambda Proxy → Blockstream API
(No API key)   (API key)      (Blockchain data)
```

**Benefits:**
- API key secured on backend (never in extension code)
- Production-ready security model
- Automatic failover and rate limiting
- User-friendly error handling

### Configuration

**Production:**
```bash
# Set via build environment
BLOCKSTREAM_PROXY_URL=https://api.yourdomain.com/blockstream npm run build
```

**Development:**
```bash
# .env.local (gitignored)
BLOCKSTREAM_PROXY_URL=https://staging-api.yourdomain.com/blockstream
```

**Local Testing (No Proxy):**
```bash
# .env.local - Leave empty to use Blockstream directly
BLOCKSTREAM_PROXY_URL=
```

### Implementation Details

**BlockstreamClient.ts:**
```typescript
constructor(network: 'mainnet' | 'testnet' = 'testnet') {
  this.network = network;

  const proxyUrl = process.env.BLOCKSTREAM_PROXY_URL;

  if (proxyUrl) {
    // Production: Use Lambda proxy with network query parameter
    this.baseUrl = `${proxyUrl}?network=${network}`;
    console.log(`[BlockstreamClient] Using Lambda proxy for ${network}`);
  } else {
    // Development: Direct Blockstream API
    this.baseUrl = network === 'mainnet'
      ? 'https://blockstream.info/api'
      : 'https://blockstream.info/testnet/api';
    console.log(`[BlockstreamClient] Using direct Blockstream API`);
  }
}
```

**Network Parameter:**
- Lambda proxy expects `?network=testnet` or `?network=mainnet`
- Proxy routes to correct Blockstream endpoint based on network
- All API methods (getBalance, getTransactions, broadcastTransaction) work unchanged

---

## Error Handling Patterns

### Error Types

**ApiErrorType Enum:**
```typescript
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',         // Network connectivity issues
  RATE_LIMITED = 'RATE_LIMITED',           // 429 Too Many Requests
  INVALID_ADDRESS = 'INVALID_ADDRESS',     // 400 Bad Request (invalid input)
  INVALID_TRANSACTION = 'INVALID_TRANSACTION', // 400 Bad Request (tx validation)
  BROADCAST_FAILED = 'BROADCAST_FAILED',   // Transaction broadcast failure
  NOT_FOUND = 'NOT_FOUND',                 // 404 Resource not found
  TIMEOUT = 'TIMEOUT',                     // Request timed out (>10s)
  PROXY_ERROR = 'PROXY_ERROR',             // 502/503/504 Lambda or Blockstream unavailable
  UNKNOWN = 'UNKNOWN',                     // Catch-all for unexpected errors
}
```

### Error Mapping Strategy

Map technical errors to user-friendly messages:

```typescript
// Example from Dashboard.tsx
try {
  const balance = await sendMessage<Balance>(MessageType.GET_BALANCE, {
    accountIndex: currentAccount.index,
  });
  setBalance(balance);
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';

  // Map to user-friendly error
  if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
    setBalanceError({
      type: 'PROXY_ERROR',
      message: 'Blockchain service temporarily unavailable. Please try again in a moment.'
    });
  } else if (errorMessage.includes('429')) {
    setBalanceError({
      type: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment and try again.'
    });
  } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    setBalanceError({
      type: 'TIMEOUT',
      message: 'Request timed out. Please check your internet connection and try again.'
    });
  } else {
    setBalanceError({
      type: 'NETWORK_ERROR',
      message: 'Network error. Please check your internet connection.'
    });
  }
}
```

### Transaction Broadcasting Errors

**Special handling for transaction errors:**

```typescript
// SendScreen.tsx - Detailed error mapping
if (errorMessage.includes('bad-txns-inputs-missingorspent')) {
  setError('Transaction failed: One or more inputs have already been spent. Your balance may have changed. Please refresh and try again.');
} else if (errorMessage.includes('insufficient fee') || errorMessage.includes('min relay fee')) {
  setError('Transaction fee too low for current network conditions. Try selecting a higher fee speed (Medium or Fast).');
} else if (errorMessage.includes('504') || errorMessage.includes('timeout')) {
  setError('Transaction status unknown: The request timed out. Your transaction may or may not have been broadcast. Please check your transaction history or a blockchain explorer before retrying.');
} else if (errorMessage.includes('502') || errorMessage.includes('503')) {
  setError('Blockchain service temporarily unavailable. Your transaction was NOT sent. Please try again in a moment.');
}
```

**Key Principles:**
- **Clear Status**: Tell users if transaction was sent or not
- **Actionable**: Provide next steps ("Try again", "Check explorer", "Increase fee")
- **Reassuring**: Show "Your Bitcoin is safe" message
- **No Jargon**: Avoid technical terms (502, Lambda, proxy)

---

## Loading State Management

### Progressive Feedback Pattern

Use progressive disclosure for loading states:

```
0-500ms:     No loading indicator (feels instant)
500-3000ms:  Show spinner with message
3000ms+:     Add "slower than usual" warning
10000ms+:    Timeout error
```

### Implementation

**State Variables:**
```typescript
const [isLoadingBalance, setIsLoadingBalance] = useState(false);
const [showSlowBalanceWarning, setShowSlowBalanceWarning] = useState(false);
const [balanceError, setBalanceError] = useState<{ type: string; message: string } | null>(null);
```

**Fetch with Timer:**
```typescript
useEffect(() => {
  let slowWarningTimer: NodeJS.Timeout;

  const fetchBalance = async () => {
    setIsLoadingBalance(true);
    setBalanceError(null);
    setShowSlowBalanceWarning(false);

    // Show "slow connection" warning after 3 seconds
    slowWarningTimer = setTimeout(() => {
      setShowSlowBalanceWarning(true);
    }, 3000);

    try {
      const balance = await sendMessage<Balance>(MessageType.GET_BALANCE, {
        accountIndex: currentAccount.index,
      });
      setBalance(balance);
    } catch (err) {
      // Handle error (see error mapping above)
    } finally {
      clearTimeout(slowWarningTimer);
      setIsLoadingBalance(false);
      setShowSlowBalanceWarning(false);
    }
  };

  fetchBalance();

  return () => clearTimeout(slowWarningTimer);
}, [currentAccount]);
```

**UI Rendering:**
```typescript
{isLoadingBalance ? (
  <LoadingState message="Fetching balance..." showSlowWarning={showSlowBalanceWarning} />
) : balanceError ? (
  <ErrorDisplay
    type={balanceError.type as any}
    message={balanceError.message}
    onRetry={retryBalanceFetch}
    showReassurance={false}
  />
) : (
  // Show balance data
)}
```

---

## Shared UI Components

### LoadingState Component

**Location:** `src/tab/components/shared/LoadingState.tsx`

**Props:**
```typescript
interface LoadingStateProps {
  message?: string;           // Loading message (default: "Loading...")
  showSlowWarning?: boolean;  // Show "slower than usual" warning
}
```

**Usage:**
```tsx
<LoadingState message="Fetching transactions..." showSlowWarning={showSlowWarning} />
```

### ErrorDisplay Component

**Location:** `src/tab/components/shared/ErrorDisplay.tsx`

**Props:**
```typescript
interface ErrorDisplayProps {
  type: 'PROXY_ERROR' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'BROADCAST_FAILED' | 'UNKNOWN';
  message: string;              // User-friendly error message
  details?: string;             // Optional additional context
  onRetry?: () => void;         // Optional retry callback
  showReassurance?: boolean;    // Show "Your Bitcoin is safe" (default: true for BROADCAST_FAILED)
}
```

**Usage:**
```tsx
<ErrorDisplay
  type="PROXY_ERROR"
  message="Blockchain service temporarily unavailable. Please try again."
  onRetry={retryFetch}
  showReassurance={false}
/>
```

**Features:**
- Appropriate icon for each error type
- User-friendly titles and messages
- Retry button (when onRetry provided)
- Reassurance message for transaction errors
- Helpful tips based on error type

### Toast Component (Existing)

**Location:** `src/tab/components/shared/Toast.tsx`

**Usage for quick notifications:**
```tsx
<Toast
  message="Blockchain service temporarily unavailable"
  type="error"
  onClose={() => setShowToast(false)}
  duration={5000}
/>
```

---

## UTXO Batching Utility

### Problem

Fetching UTXOs for 30+ addresses in parallel causes rate limiting (429 errors).

### Solution

**Location:** `src/shared/utils/batchUtils.ts`

**Batch configuration:**
- BATCH_SIZE: 5 addresses per batch
- BATCH_DELAY_MS: 500ms delay between batches

**Usage:**
```typescript
import { fetchInBatches } from '../../shared/utils/batchUtils';

// Instead of parallel requests
const balances = await Promise.all(
  addresses.map(addr => blockstreamClient.getBalance(addr))
);

// Use batched requests
const result = await fetchInBatches(
  addresses,
  addr => blockstreamClient.getBalance(addr)
);

console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`);

// Access successful results
result.success.forEach((balance, address) => {
  console.log(`${address}: ${balance.confirmed} sats`);
});

// Handle errors
result.errors.forEach((error, address) => {
  console.error(`Failed to fetch ${address}:`, error);
});
```

**Features:**
- Processes items in small batches with delays
- Tracks success and errors separately
- Failures don't block entire operation
- Returns comprehensive result object

---

## Testing Checklist

### Configuration Tests
- [ ] Extension builds with BLOCKSTREAM_PROXY_URL set
- [ ] Extension builds without BLOCKSTREAM_PROXY_URL (dev mode)
- [ ] Console logs show correct mode ("Using proxy" vs "Using direct API")

### Functional Tests
- [ ] Dashboard loads balance through proxy
- [ ] Dashboard loads transactions through proxy
- [ ] Send transaction broadcasts through proxy
- [ ] All API calls work with network parameter (`?network=testnet`)

### Error Handling Tests
- [ ] 502 error shows "Blockchain service unavailable" message
- [ ] 429 error shows "Too many requests" message
- [ ] Timeout shows "Request timed out" message
- [ ] Network error shows "Check internet connection" message
- [ ] All error messages are user-friendly (no 502, Lambda, proxy mentions)

### Loading State Tests
- [ ] Loading spinner shows for requests >500ms
- [ ] "Slower than usual" warning shows after 3 seconds
- [ ] Loading state clears after successful response
- [ ] Timeout error shows after 10 seconds

### Transaction Error Tests
- [ ] Invalid inputs error provides clear guidance
- [ ] Insufficient fee error suggests higher fee speed
- [ ] Timeout shows "status unknown" with explorer suggestion
- [ ] Proxy error clearly states transaction was NOT sent
- [ ] Reassurance message shows for transaction errors

### Retry Pattern Tests
- [ ] Retry button appears on errors
- [ ] Retry button triggers new API call
- [ ] Loading state shows during retry
- [ ] Error clears on successful retry

---

## Common Patterns

### Pattern: Fetch with Error Handling

```typescript
const [data, setData] = useState<T | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<{ type: string; message: string } | null>(null);
const [showSlowWarning, setShowSlowWarning] = useState(false);

const fetchData = async () => {
  let slowWarningTimer: NodeJS.Timeout;

  setIsLoading(true);
  setError(null);
  setShowSlowWarning(false);

  slowWarningTimer = setTimeout(() => {
    setShowSlowWarning(true);
  }, 3000);

  try {
    const result = await sendMessage<T>(MessageType.GET_DATA, { ... });
    setData(result);
    setError(null);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';

    // Map error to user-friendly message
    if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
      setError({
        type: 'PROXY_ERROR',
        message: 'Blockchain service temporarily unavailable. Please try again.'
      });
    } else if (errorMessage.includes('429')) {
      setError({
        type: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment.'
      });
    } else {
      setError({
        type: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.'
      });
    }
  } finally {
    clearTimeout(slowWarningTimer);
    setIsLoading(false);
    setShowSlowWarning(false);
  }
};
```

### Pattern: Conditional Rendering

```typescript
{isLoading ? (
  <LoadingState message="Loading..." showSlowWarning={showSlowWarning} />
) : error ? (
  <ErrorDisplay
    type={error.type as any}
    message={error.message}
    onRetry={fetchData}
  />
) : data ? (
  // Render data
) : (
  // Empty state
)}
```

---

## Performance Considerations

### API Call Optimization

1. **Batch requests** when fetching multiple addresses
2. **Debounce user input** for real-time validation
3. **Cache responses** when appropriate (balance, fee estimates)
4. **Parallel requests** for independent data (balance + transactions)
5. **Progressive loading** to improve perceived performance

### Network Performance

- **Expected latency**: 200-500ms (normal), 1000-1500ms (cold start), 2000-5000ms (slow network)
- **Timeout**: 10 seconds (BlockstreamClient default)
- **Retry strategy**: Exponential backoff (1s, 2s, 4s) for transient errors
- **Rate limiting**: 5 requests per batch, 500ms delay between batches

---

## Security Notes

### Critical Rules

1. **NEVER** log API keys or sensitive data
2. **NEVER** include API keys in extension code
3. **ALWAYS** use Lambda proxy in production builds
4. **ALWAYS** validate user input before API calls
5. **ALWAYS** sanitize error messages before display

### Production Checklist

- [ ] `BLOCKSTREAM_PROXY_URL` set in production builds
- [ ] No API keys in source code
- [ ] No API keys in environment files committed to git
- [ ] Error messages don't expose internal details
- [ ] All user inputs validated and sanitized

---

## Troubleshooting

### Issue: "Using direct Blockstream API" in production

**Cause:** `BLOCKSTREAM_PROXY_URL` not set during build

**Solution:**
```bash
BLOCKSTREAM_PROXY_URL=https://api.yourdomain.com/blockstream npm run build
```

### Issue: All requests failing with CORS errors

**Cause:** Lambda proxy not configured for extension origin

**Solution:** Update Lambda proxy CORS headers to allow extension origin

### Issue: 429 rate limiting errors

**Cause:** Too many parallel requests

**Solution:** Use `fetchInBatches` utility for multiple address queries

### Issue: Slow loading times (>5 seconds)

**Possible Causes:**
1. Lambda cold start (~1-2s first request)
2. Slow network connection
3. Blockstream API slow response
4. Too many sequential requests

**Solutions:**
- Implement parallel requests where possible
- Use batching for multiple addresses
- Add caching for frequently accessed data
- Monitor Lambda performance in CloudWatch

---

## Future Enhancements

### Planned Improvements

1. **Request caching**: Cache balance/transaction data for 30 seconds
2. **Optimistic UI updates**: Show pending state immediately
3. **Offline mode**: Queue transactions when offline
4. **Retry queue**: Auto-retry failed requests with backoff
5. **Performance monitoring**: Track API latency and error rates

### Considered but Deferred

- WebSocket connection for real-time updates (complexity vs benefit)
- Self-hosted Esplora instance (cost vs scale)
- Multiple API fallbacks (reliability vs complexity)

---

## References

- **Lambda Proxy Plan**: `prompts/docs/plans/BLOCKSTREAM_API_PROXY_PLAN.md`
- **Lambda Proxy UX Spec**: `prompts/docs/plans/LAMBDA_PROXY_UX_DESIGN_SPEC.md`
- **Lambda Proxy PRD**: `prompts/docs/plans/BLOCKSTREAM_API_PROXY_PRD.md`
- **BlockstreamClient**: `src/background/api/BlockstreamClient.ts`
- **Batch Utils**: `src/shared/utils/batchUtils.ts`
- **Error Display**: `src/tab/components/shared/ErrorDisplay.tsx`
- **Loading State**: `src/tab/components/shared/LoadingState.tsx`
