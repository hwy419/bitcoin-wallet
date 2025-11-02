# API Integration

**Last Updated**: October 22, 2025
**Related**: [service-worker.md](./service-worker.md) | [messages.md](./messages.md) | [storage.md](./storage.md) | [_INDEX.md](./_INDEX.md)

---

## Quick Navigation

- [Blockstream API Client](#blockstream-api-client)
- [Price Service](#price-service)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)

---

## Blockstream API Client

**Status**: IMPLEMENTED (2025-10-12)

**Location**: `src/background/api/BlockstreamClient.ts`

**Responsibilities**:
- Fetch address balances
- Fetch transaction history
- Fetch UTXOs (unspent transaction outputs)
- Broadcast transactions
- Get fee estimates

### Implemented Endpoints

#### 1. GET /address/{address} - Address Info and Balance

```typescript
async getAddressInfo(address: string): Promise<BlockstreamAddressInfo>
```

- Returns chain_stats (confirmed) and mempool_stats (unconfirmed)
- Used by `getBalance()` to calculate total balance

**Response Structure**:
```typescript
{
  chain_stats: {
    funded_txo_count: number,
    funded_txo_sum: number,     // Total received (satoshis)
    spent_txo_count: number,
    spent_txo_sum: number,      // Total spent (satoshis)
    tx_count: number
  },
  mempool_stats: {
    funded_txo_count: number,
    funded_txo_sum: number,
    spent_txo_count: number,
    spent_txo_sum: number,
    tx_count: number
  }
}
```

---

#### 2. GET /address/{address} - Simplified Balance

```typescript
async getBalance(address: string): Promise<Balance>
```

- Returns `{ confirmed: number, unconfirmed: number }` in satoshis
- Calculates: `funded_txo_sum - spent_txo_sum`

**Implementation**:
```typescript
const info = await this.getAddressInfo(address);
return {
  confirmed: info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum,
  unconfirmed: info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum
};
```

---

#### 3. GET /address/{address}/txs - Transaction History

```typescript
async getTransactions(address: string): Promise<Transaction[]>
```

- Returns array of transactions involving the address
- Parses inputs/outputs, calculates value change
- Includes confirmations, timestamp, fee

**Transaction Processing**:
```typescript
{
  txid: string,
  confirmations: number,
  timestamp: number,
  value: number,              // Net value for this address (+ received, - sent)
  fee: number,
  inputs: TxInput[],
  outputs: TxOutput[]
}
```

**Value Calculation**:
- Received transaction: Positive value (more outputs than inputs)
- Sent transaction: Negative value (more inputs than outputs)
- Internal transfer: Near-zero (inputs ≈ outputs, minus fee)

---

#### 4. GET /address/{address}/utxo - Unspent Outputs

```typescript
async getUTXOs(address: string): Promise<UTXO[]>
```

- Returns UTXOs available for spending
- Includes txid, vout, value, confirmations
- Used for transaction building

**UTXO Structure**:
```typescript
{
  txid: string,               // Transaction ID containing this output
  vout: number,               // Output index in transaction
  value: number,              // Value in satoshis
  status: {
    confirmed: boolean,
    block_height?: number,
    block_hash?: string
  }
}
```

---

#### 5. POST /tx - Broadcast Transaction

```typescript
async broadcastTransaction(txHex: string): Promise<string>
```

- Posts raw transaction hex to network
- Returns transaction ID (txid) on success
- Throws specific errors (INVALID_TRANSACTION, BROADCAST_FAILED)

**Error Responses**:
- 400: Invalid transaction format
- 500: Broadcast failed (network rejection)

---

#### 6. GET /fee-estimates - Fee Recommendations

```typescript
async getFeeEstimates(): Promise<FeeEstimates>
```

- Returns `{ slow, medium, fast }` in sat/vB
- Maps block targets: 1-2 blocks (fast), 3-6 blocks (medium), 10+ blocks (slow)

**Fee Mapping Logic**:
```typescript
{
  fast: feeData['2'] || feeData['1'],      // 1-2 blocks
  medium: feeData['6'] || feeData['3'],    // 3-6 blocks
  slow: feeData['12'] || feeData['10']     // 10-12 blocks
}
```

---

### Features Implemented

#### 1. Exponential Backoff Retry Logic

- Retries failed requests with delays: 1s, 2s, 4s
- Skips retry for non-retryable errors (404, invalid address, etc.)
- Handles rate limiting (429) gracefully

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

**Should Retry?**:
- Network errors: YES
- Timeouts: YES
- Rate limiting (429): YES
- Client errors (400, 404): NO
- Server errors (500): YES

---

#### 2. Timeout Handling

- 10-second timeout per request
- Throws `ApiErrorType.TIMEOUT` on timeout
- Uses AbortController for cancellation

**Implementation**:
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), this.timeout);

try {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  });
  clearTimeout(timeoutId);
  return response;
} catch (error) {
  if (error.name === 'AbortError') {
    throw new ApiError(ApiErrorType.TIMEOUT, 'Request timed out');
  }
  throw error;
}
```

---

#### 3. Error Handling

Custom `ApiError` class with typed error codes:

```typescript
enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',        // No internet or fetch failed
  RATE_LIMITED = 'RATE_LIMITED',          // Too many requests (429)
  INVALID_ADDRESS = 'INVALID_ADDRESS',    // Bad address format (400)
  INVALID_TRANSACTION = 'INVALID_TRANSACTION', // Transaction rejected (400)
  BROADCAST_FAILED = 'BROADCAST_FAILED',  // Transaction broadcast failed
  NOT_FOUND = 'NOT_FOUND',                // Resource not found (404)
  TIMEOUT = 'TIMEOUT',                    // Request timed out
  UNKNOWN = 'UNKNOWN'                     // Unhandled error
}

class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

**Error Classification**:
```typescript
if (response.status === 429) {
  throw new ApiError(ApiErrorType.RATE_LIMITED, 'Rate limited', 429);
}
if (response.status === 404) {
  throw new ApiError(ApiErrorType.NOT_FOUND, 'Resource not found', 404);
}
if (response.status === 400) {
  // Could be invalid address or invalid transaction
  const body = await response.text();
  if (body.includes('address')) {
    throw new ApiError(ApiErrorType.INVALID_ADDRESS, 'Invalid address', 400);
  }
  throw new ApiError(ApiErrorType.INVALID_TRANSACTION, 'Invalid transaction', 400);
}
```

---

#### 4. Comprehensive Logging

- Logs all API requests with address/operation
- Logs retry attempts with delay
- Logs errors with context
- NEVER logs sensitive data (keys, mnemonics)

**Examples**:
```typescript
console.log(`[BlockstreamClient] Fetching balance for address: ${address}`);
console.log(`[BlockstreamClient] Retry attempt ${attempt + 1} after ${delay}ms`);
console.error(`[BlockstreamClient] API error:`, error);
```

---

#### 5. Network Support

Constructor accepts `'mainnet' | 'testnet'`:

```typescript
constructor(network: 'mainnet' | 'testnet' = 'testnet') {
  this.baseUrl = network === 'mainnet'
    ? 'https://blockstream.info/api'
    : 'https://blockstream.info/testnet/api';
  this.network = network;
}
```

**Base URLs**:
- Testnet: `https://blockstream.info/testnet/api`
- Mainnet: `https://blockstream.info/api`

---

#### 6. Transaction Parsing

Transforms raw Blockstream API responses to our types:

- Calculates value change for specific address
- Extracts inputs/outputs with addresses and values
- Includes fee and confirmation data

**Example**:
```typescript
// Calculate value change for address
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

### Usage Examples

#### Singleton Instance

```typescript
import { blockstreamClient } from './api/BlockstreamClient';

// Use default testnet instance
const balance = await blockstreamClient.getBalance('tb1q...');
```

#### Custom Instance

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

---

### Integration Points

Message handlers that use BlockstreamClient:

- `UNLOCK_WALLET`: Fetch balance for all addresses
- `GET_BALANCE`: Return real balance from API
- `GET_TRANSACTIONS`: Fetch transaction history
- `GENERATE_ADDRESS`: Check if address has been used (future)
- `SEND_TRANSACTION`: Fetch UTXOs, build tx, sign, broadcast
- `GET_FEE_ESTIMATES`: Return current fee rates

---

### Future Enhancements

1. **Response Caching**:
   - 5-minute TTL for balances
   - 1-minute TTL for fee estimates
   - Cache invalidation on new transactions

2. **Request Queuing**:
   - Rate limiting (max 10 requests per second)
   - Queue overflow handling
   - Priority queue for time-sensitive requests

3. **Batch Operations**:
   - Batch address balance fetching
   - Parallel UTXO fetching with concurrency limit
   - Request deduplication

4. **WebSocket Support**:
   - Real-time balance updates
   - Transaction confirmations
   - New block notifications

5. **Configurable Parameters**:
   - Retry attempts (currently 3)
   - Timeout duration (currently 10s)
   - Retry delays (currently 1s, 2s, 4s)

6. **Request Throttling**:
   - Adaptive rate limiting based on 429 responses
   - Exponential backoff for rate limits
   - Circuit breaker pattern

---

## Price Service

**Status**: IMPLEMENTED (2025-10-12)

**Location**: `src/background/api/PriceService.ts`

**Responsibilities**:
- Fetch current BTC/USD price from CoinGecko API
- Cache price data to minimize API calls
- Provide price data to popup for USD display

### Implemented Methods

#### getPrice() - Fetch Current Bitcoin Price

```typescript
async getPrice(): Promise<BitcoinPrice>
```

- Returns `{ usd: number, lastUpdated: number }`
- Uses cached price if still valid (within 5-minute TTL)
- Fetches fresh price from API if cache expired or invalid
- Throws error on network failure or invalid response

---

### Features Implemented

#### 1. 5-Minute Price Caching

- Cache TTL: 5 minutes (300,000ms)
- Stores price and lastUpdated timestamp
- Validates cache before returning cached price
- Prevents excessive API calls (reduces from 12/hour to ~1/hour)

**Implementation**:
```typescript
private cachedPrice: BitcoinPrice | null = null;
private cacheTimeout = 5 * 60 * 1000; // 5 minutes

private isCacheValid(): boolean {
  if (!this.cachedPrice) return false;
  const age = Date.now() - this.cachedPrice.lastUpdated;
  return age < this.cacheTimeout;
}

async getPrice(): Promise<BitcoinPrice> {
  if (this.isCacheValid()) {
    return this.cachedPrice!;
  }

  // Fetch fresh price...
  this.cachedPrice = { usd: price, lastUpdated: Date.now() };
  return this.cachedPrice;
}
```

---

#### 2. Timeout Handling

- 10-second timeout per request
- Uses AbortController for cancellation
- Throws descriptive error on timeout

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
    throw new Error('Request timed out after 10 seconds');
  }
  throw error;
}
```

---

#### 3. Error Handling

- Network errors with context
- Invalid response format detection
- Missing price field validation
- Comprehensive error messages for debugging

**Error Cases**:
```typescript
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

const data = await response.json();
if (!data.bitcoin || typeof data.bitcoin.usd !== 'number') {
  throw new Error('Invalid price data from API');
}
```

---

#### 4. Retry Logic

- Single retry on network failure
- 1-second delay before retry
- Fails fast after single retry (prevents long waits)

**Implementation**:
```typescript
for (let attempt = 0; attempt < 2; attempt++) {
  try {
    return await this.fetchPrice();
  } catch (error) {
    if (attempt === 0) {
      console.log('[PriceService] Retrying after 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
    throw error;
  }
}
```

---

#### 5. Comprehensive Logging

- Logs cache hits/misses
- Logs API requests
- Logs errors with context
- No sensitive data logged

**Examples**:
```typescript
console.log('[PriceService] Cache hit - returning cached price');
console.log('[PriceService] Fetching fresh price from CoinGecko API');
console.error('[PriceService] Failed to get price:', error);
```

---

### API Integration

**Endpoint**: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`

**Method**: GET

**Response Format**:
```json
{
  "bitcoin": {
    "usd": 45000.50
  }
}
```

**Rate Limiting**:
- CoinGecko free tier allows 10-50 requests/minute
- Our caching strategy: 5-minute TTL keeps usage well under rate limits
- ~12 requests per hour with active usage
- ~1 request per 5 minutes worst case

---

### Usage Examples

#### Singleton Instance

```typescript
import { priceService } from './api/PriceService';

// Use default singleton instance
const price = await priceService.getPrice();
console.log(`BTC/USD: $${price.usd}`);
console.log(`Last updated: ${new Date(price.lastUpdated).toLocaleString()}`);
```

#### Message Handler Integration

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

---

### Integration Points

- Popup components call GET_BTC_PRICE message to fetch price
- useBitcoinPrice React hook manages price state and auto-refresh
- Price displayed alongside BTC amounts throughout UI

---

### Performance Notes

- Cache reduces API calls by ~12x (from every request to ~1 per 5 minutes)
- Non-blocking: Price fetch failures don't affect wallet operations
- Lightweight: Price service adds <5KB to bundle size

---

### Security Notes

- Uses HTTPS for API requests
- No authentication required (public API)
- No sensitive data sent to CoinGecko
- Timeout prevents hanging requests

---

### Future Enhancements

1. **Multiple Fiat Currencies**:
   - Support for EUR, GBP, JPY, etc.
   - User-selectable currency in settings
   - Configurable default currency

2. **Configurable Cache TTL**:
   - User setting for cache duration
   - Range: 1-15 minutes
   - Balance between freshness and API usage

3. **WebSocket Support**:
   - Real-time price updates
   - Push notifications for price changes
   - Reduced API polling

4. **Fallback APIs**:
   - Coinbase API as fallback
   - Kraken API as secondary fallback
   - Automatic failover on errors

5. **Historical Price Data**:
   - Price charts (24h, 7d, 30d)
   - Price change indicators (+/- %)
   - Local caching of historical data

6. **Price Alerts**:
   - Notify on price thresholds
   - Percentage change alerts
   - Chrome notifications integration

---

### Type Definitions

**Location**: `src/shared/types/index.ts`

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

---

## Rate Limiting

### Current Strategy

**Blockstream API**:
- No explicit rate limits documented
- Use exponential backoff on 429 responses
- Queue requests if rate limited (future)

**CoinGecko API**:
- Free tier: 10-50 requests/minute
- Our usage: ~1 request per 5 minutes (well under limit)
- 5-minute cache prevents excessive calls

### Future Rate Limiting Implementation

**Request Queue**:
```typescript
class RequestQueue {
  private queue: Request[] = [];
  private processing = false;
  private requestsPerSecond = 10;

  async enqueue(request: Request): Promise<Response> {
    return new Promise((resolve, reject) => {
      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;
      try {
        const response = await this.executeRequest(item.request);
        item.resolve(response);
      } catch (error) {
        item.reject(error);
      }
      await this.delay(1000 / this.requestsPerSecond);
    }

    this.processing = false;
  }
}
```

**Circuit Breaker**:
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private resetTimeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      }, this.resetTimeout);
    }
  }
}
```

---

## Error Handling

### Error Types

**Network Errors**:
- No internet connection
- DNS resolution failure
- Connection timeout
- SSL/TLS errors

**HTTP Errors**:
- 400 Bad Request (invalid data)
- 404 Not Found (resource doesn't exist)
- 429 Too Many Requests (rate limited)
- 500 Internal Server Error (API failure)

**Application Errors**:
- Invalid response format
- Missing required fields
- Type validation failures
- Timeout (AbortController)

### Error Handling Pattern

```typescript
async function apiCall<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ApiError) {
      // Typed API error - handle by type
      switch (error.type) {
        case ApiErrorType.RATE_LIMITED:
          // Wait and retry
          await delay(60000);
          return apiCall(operation);

        case ApiErrorType.TIMEOUT:
          // Log and throw
          console.error('Request timed out');
          throw error;

        case ApiErrorType.NETWORK_ERROR:
          // Check connectivity
          console.error('Network error');
          throw error;

        default:
          throw error;
      }
    }

    // Unknown error
    console.error('Unexpected error:', error);
    throw error;
  }
}
```

### User-Facing Errors

**Message Handlers**:
```typescript
async function handleGetBalance(accountIndex: number): Promise<MessageResponse> {
  try {
    const balance = await getBalance(accountIndex);
    return { success: true, data: balance };
  } catch (error) {
    if (error instanceof ApiError) {
      // User-friendly messages
      const messages = {
        [ApiErrorType.NETWORK_ERROR]: 'No internet connection. Please check your network.',
        [ApiErrorType.TIMEOUT]: 'Request timed out. Please try again.',
        [ApiErrorType.RATE_LIMITED]: 'Too many requests. Please wait a moment.',
        [ApiErrorType.INVALID_ADDRESS]: 'Invalid Bitcoin address.',
      };

      return {
        success: false,
        error: messages[error.type] || 'Failed to get balance. Please try again.'
      };
    }

    return {
      success: false,
      error: 'An unexpected error occurred.'
    };
  }
}
```

---

## See Also

- [service-worker.md](./service-worker.md) - Service worker architecture
- [messages.md](./messages.md) - Message handlers using API
- [storage.md](./storage.md) - Chrome storage patterns
- [decisions.md](./decisions.md) - API-related architectural decisions
