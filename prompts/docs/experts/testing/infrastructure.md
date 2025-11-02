# Test Infrastructure & Configuration

**Last Updated**: 2025-10-22
**Owner**: Testing Expert
**Related**: [unit-tests.md](./unit-tests.md), [integration.md](./integration.md)

---

## Quick Navigation
- [Jest Configuration](#jest-configuration)
- [Test Utilities](#test-utilities)
- [Chrome API Mocks](#chrome-api-mocks)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Jest Configuration

### Framework Setup ✅ COMPLETE

- **Test Runner**: Jest v30.2.0
- **React Testing**: @testing-library/react v16.3.0, @testing-library/jest-dom v6.9.1
- **TypeScript**: ts-jest v29.4.5
- **Environment**: Node (for crypto tests), JSDOM (for React tests)
- **Canvas Mock**: jest-canvas-mock v2.5.2 (for QR code testing)

### Configuration File

**Location**: `/home/michael/code_projects/bitcoin_wallet/jest.config.js`

**Key Configuration Decisions**:
- **Test environment**: JSDOM for React components, Node for crypto modules (using `@jest-environment` directive)
- **Coverage thresholds**: 80% global, 100% for security-critical files (CryptoUtils, KeyManager)
- **Transform**: ts-jest for TypeScript compilation
- **Setup files**:
  - `setupEnv.ts` - Runs before environment creation (polyfills crypto.subtle)
  - `setupTests.ts` - Runs after environment creation (jest-dom, Chrome mocks)

### Coverage Thresholds

```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  },
  // Critical security code requires 100% coverage
  './src/background/wallet/CryptoUtils.ts': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  },
  './src/background/wallet/KeyManager.ts': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  },
  './src/background/wallet/WIFManager.ts': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
}
```

### Test Environment Selection

```typescript
/**
 * @jest-environment node
 */
// Use for tests requiring crypto.subtle
```

```typescript
/**
 * @jest-environment jsdom
 */
// Use for React component tests (default)
```

---

## Critical Polyfills

### Crypto API

**Why?** JSDOM doesn't provide Web Crypto API, but Node.js 15+ has webcrypto which is compatible.

**Location**: `/home/michael/code_projects/bitcoin_wallet/src/__tests__/setup/setupEnv.ts`

```typescript
import { webcrypto } from 'crypto';

if (!global.crypto) {
  (global as any).crypto = webcrypto;
}

if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}
```

### Text Encoding

```typescript
// setupEnv.ts
import { TextEncoder, TextDecoder } from 'util';

if (!global.TextEncoder) {
  (global as any).TextEncoder = TextEncoder;
}

if (!global.TextDecoder) {
  (global as any).TextDecoder = TextDecoder;
}
```

---

## Chrome API Mocks

### Chrome Storage Mock

**Location**: `/home/michael/code_projects/bitcoin_wallet/src/__tests__/__mocks__/chrome.ts`

**Provides**:
- `chrome.storage.local` - In-memory storage with Promise-based API
- `chrome.runtime.sendMessage` - Message passing mock
- `chrome.runtime.onMessage` - Listener registration and triggering
- Test helpers: `__clear()`, `__trigger()`, `__getData()`, etc.

**Example Usage**:

```typescript
// In test file
import chrome from '../__mocks__/chrome';

beforeEach(() => {
  chrome.storage.local.__clear();
});

it('should store data in chrome.storage', async () => {
  await chrome.storage.local.set({ key: 'value' });

  const result = await chrome.storage.local.get('key');
  expect(result.key).toBe('value');
});
```

### Message Passing Mock

```typescript
// Mock successful message
chrome.runtime.sendMessage.mockResolvedValue({
  success: true,
  data: { /* ... */ }
});

// Mock failed message
chrome.runtime.sendMessage.mockResolvedValue({
  success: false,
  error: 'Error message'
});

// Trigger message listener
chrome.runtime.onMessage.__trigger(
  { type: 'TEST_MESSAGE', payload: {} },
  {},
  jest.fn()
);
```

---

## Test Utilities

### Test Constants

**Location**: `/home/michael/code_projects/bitcoin_wallet/src/__tests__/utils/testConstants.ts`

**Provides**:
- Shared test data across all test files
- BIP39 test mnemonics (12 and 24-word)
- Test addresses for all Bitcoin address types (Legacy, SegWit, Native SegWit)
- Test transaction IDs
- Common satoshi values and fee rates
- BIP32 derivation paths for all address types
- Mock API responses (CoinGecko, Blockstream)
- Utility functions (btcToSatoshis, getTestDerivationPath)

**Example**:

```typescript
import {
  TEST_MNEMONIC_12,
  TEST_ADDRESSES,
  TEST_DERIVATION_PATHS,
  btcToSatoshis
} from '../utils/testConstants';

it('should use test constants', () => {
  const wallet = new HDWallet(TEST_MNEMONIC_12, 'testnet');
  const amount = btcToSatoshis(0.001); // 100000 satoshis
});
```

### Test Factories

**Location**: `/home/michael/code_projects/bitcoin_wallet/src/__tests__/utils/testFactories.ts`

**Provides Factory Functions**:
- `createMockAddress()`, `createMockAccount()`, `createMockUTXO()`
- `createMockTransaction()`, `createReceivedTransaction()`, `createSentTransaction()`
- `createMockBalance()`, `createMockBitcoinPrice()`
- Blockstream API response factories
- CoinGecko API response factories
- Chrome message response factories
- Batch creation functions (e.g., `createUTXOsWithTotalValue()`)

**Example**:

```typescript
import { createMockUTXO, createUTXOsWithTotalValue } from '../utils/testFactories';

it('should select UTXOs', () => {
  const utxos = createUTXOsWithTotalValue(500000, 5); // 5 UTXOs totaling 500000 sats

  const result = selectUTXOs(utxos, 300000, 5);
  expect(result.selectedUtxos.length).toBeGreaterThan(0);
});
```

### Test Helpers

**Location**: `/home/michael/code_projects/bitcoin_wallet/src/__tests__/utils/testHelpers.ts`

**Provides Helper Functions**:

**Async Helpers**:
- `wait(ms)` - Simple delay
- `waitFor(condition)` - Wait for condition to be true
- `waitForPromise(promise)` - Wait for promise to resolve

**Mock Helpers**:
- `createDelayedMock(value, delay)` - Mock with delay
- `createRetryMock(failCount, successValue)` - Mock that fails N times
- `setupMockFetchSequence(responses)` - Mock fetch with sequence of responses

**Chrome API Mock Helpers**:
- `mockSuccessfulMessage(type, response)` - Mock successful Chrome message
- `setupMockStorage(data)` - Setup Chrome storage with data

**Crypto Mock Helpers**:
- `setupDeterministicCrypto()` - Use deterministic crypto for tests
- `restoreRealCrypto()` - Restore real crypto

**Time Manipulation**:
- `mockDateNow(timestamp)` - Mock Date.now()
- `advanceTime(ms)` - Advance Jest timers

**Assertion Helpers**:
- `expectInRange(value, min, max)` - Assert value in range
- `expectClose(value, expected, tolerance)` - Assert values close
- `expectRejectsWithMessage(promise, message)` - Assert rejection with message

**Data Generators**:
- `randomHex(length)` - Generate random hex string
- `randomTxid()` - Generate random transaction ID
- `randomSatoshis(min, max)` - Generate random satoshi amount

**Console Suppression**:
- `suppressConsole()` - Suppress console output
- `withSuppressedConsole(fn)` - Run function with suppressed console

**Performance Testing**:
- `measureExecutionTime(fn)` - Measure function execution time
- `expectExecutesWithin(fn, maxMs)` - Assert execution time

**Example**:

```typescript
import { waitFor, expectInRange, randomSatoshis } from '../utils/testHelpers';

it('should complete within time limit', async () => {
  await expectExecutesWithin(async () => {
    await expensiveOperation();
  }, 1000); // Must complete in <1 second
});

it('should generate fee in range', () => {
  const fee = calculateFee(1000, 5);
  expectInRange(fee, 500, 2000);
});
```

---

## NPM Scripts

### Test Commands

```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:privacy": "jest --testPathPattern=privacy",
  "test:security": "jest --testPathPattern=security",
  "build": "npm run test && webpack --mode production"
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- HDWallet.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run only security tests
npm test -- --testNamePattern="Security"

# Run privacy tests
npm run test:privacy
```

### Coverage Reports

Generated in `/home/michael/code_projects/bitcoin_wallet/coverage/`:
- `lcov-report/index.html` - Interactive HTML report
- `lcov.info` - LCOV format for CI tools

**View Coverage**:

```bash
npm run test:coverage && open coverage/lcov-report/index.html
```

---

## CI/CD Integration

### GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm test

    - name: Generate coverage
      run: npm run test:coverage

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info

    - name: Check coverage thresholds
      run: |
        # Fail if critical coverage below 100%
        if ! grep -q "100" coverage/lcov-report/CryptoUtils.ts.html; then
          echo "CryptoUtils coverage below 100%"
          exit 1
        fi
```

### Pre-Commit Hooks

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running tests before commit..."
npm test

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

### Coverage Enforcement

**In jest.config.js**:
- Set `coverageThreshold` for global and per-file thresholds
- CI will fail if thresholds not met

**In CI**:
- Upload coverage to Codecov
- Block PRs with failing tests or coverage drops
- Require 100% coverage on security-critical files

---

## Performance Benchmarks

### Test Execution Performance

**Current Status**:
- **Total tests**: 369
- **Execution time**: ~1.6 seconds
- **Average per test**: ~6ms
- **Status**: Excellent performance ✅

**Performance Targets**:
- Total test suite: < 30 seconds
- Unit tests: < 10 seconds
- Integration tests: < 15 seconds
- Security tests: < 5 seconds

### Test Performance Testing

```typescript
it('PBKDF2 with 100K iterations completes in < 1 second', async () => {
  const start = Date.now();
  await encryptWIF(wif, 'password');
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(1000);
  expect(duration).toBeGreaterThan(100); // Verify not instant
});
```

---

## Troubleshooting

### Common Issues

#### 1. crypto.subtle is undefined

**Solution**: Use `@jest-environment node` directive:

```typescript
/**
 * @jest-environment node
 */
```

#### 2. Tests timeout

**Solution**: Increase timeout for crypto-heavy tests:

```typescript
jest.setTimeout(30000); // 30 seconds

// Or per test
it('slow test', async () => {
  // ...
}, 10000);
```

#### 3. Async/await hanging

**Solution**: Ensure all Promises are properly resolved/rejected in mocks:

```typescript
// Bad - no ok property
(global.fetch as jest.Mock).mockResolvedValue({ json: async () => ({}) });

// Good - complete Response mock
(global.fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ data: 'value' }),
});
```

#### 4. Canvas/QR code errors

**Solution**: Install and configure jest-canvas-mock:

```javascript
// jest.config.js
setupFiles: ['jest-canvas-mock']
```

#### 5. Import path errors

**Solution**: Check moduleNameMapper in jest.config.js:

```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

## Test File Organization

```
src/
├─ __tests__/
│  ├─ setup/                      # Test setup files
│  │  ├─ setupEnv.ts              # Polyfills (crypto, TextEncoder)
│  │  └─ setupTests.ts            # Jest-dom, Chrome mocks
│  ├─ __mocks__/                  # Mock implementations
│  │  └─ chrome.ts                # Chrome Extension API mocks
│  └─ utils/                      # Test utilities
│     ├─ testConstants.ts         # Shared test data
│     ├─ testFactories.ts         # Factory functions
│     └─ testHelpers.ts           # Helper functions
├─ background/
│  ├─ __tests__/                  # Background tests
│  │  ├─ messageHandlers.*.test.ts
│  │  └─ psbtWorkflow.test.ts
│  └─ wallet/
│     └─ __tests__/               # Wallet tests
│        ├─ CryptoUtils.test.ts
│        ├─ KeyManager.test.ts
│        └─ HDWallet.test.ts
├─ tab/                           # Tab-based UI
│  └─ components/
│     └─ __tests__/               # Component tests
│        ├─ Dashboard.test.tsx
│        └─ Sidebar.test.tsx
└─ wizard/                        # Multisig wizard
   └─ __tests__/
      └─ WizardApp.test.tsx
```

---

## Environment Variables

### Development Pre-fill (`.env.local`)

```bash
# For development speed
DEV_PASSWORD=YourTestPassword123
DEV_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
```

**Note**: `.env.local` is gitignored and only works in development builds

---

## Resources

### Official Documentation

- **Jest**: https://jestjs.io/docs/getting-started
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro
- **bitcoinjs-lib**: https://github.com/bitcoinjs/bitcoinjs-lib
- **BIP39**: https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md
- **BIP32**: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
- **BIP44**: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki

### Test Vectors

- BIP39 Test Vectors: https://github.com/bitcoin/bips/blob/master/bip-0039/bip-0039-wordlists.md
- BIP32 Test Vectors: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki#test-vectors
- BIP67 Test Vectors: https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki

---

## Cross-References

- **Unit Tests**: See [unit-tests.md](./unit-tests.md)
- **Integration Tests**: See [integration.md](./integration.md)
- **Testing Decisions**: See [decisions.md](./decisions.md)
