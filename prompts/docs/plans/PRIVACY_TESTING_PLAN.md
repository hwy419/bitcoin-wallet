# Privacy Enhancement - Comprehensive Testing Plan

**Version:** 1.0
**Created:** October 21, 2025
**Status:** Implementation-Ready
**Owner:** Testing Expert
**Related Documents:**
- `BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md` - Technical overview
- `PRIVACY_ENHANCEMENT_PRD.md` - Product requirements
- `PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md` - Backend implementation
- `PRIVACY_FRONTEND_IMPLEMENTATION_PLAN.md` - Frontend implementation
- `PRIVACY_SECURITY_REVIEW.md` - Security review (26 security test cases)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Strategy](#testing-strategy)
3. [Test Coverage Requirements](#test-coverage-requirements)
4. [Backend Unit Tests](#backend-unit-tests)
5. [Frontend Unit Tests](#frontend-unit-tests)
6. [Integration Tests](#integration-tests)
7. [Security Test Cases](#security-test-cases)
8. [Privacy Metrics Validation](#privacy-metrics-validation)
9. [Performance Testing](#performance-testing)
10. [CI/CD Integration](#cicd-integration)
11. [Testnet Validation Plan](#testnet-validation-plan)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Scope

This testing plan covers **all automated and manual tests** required for Privacy Enhancement features across both Phase 2 (Default Privacy) and Phase 3 (Optional Privacy Mode).

**Features Under Test:**

**Phase 2 (P0/P1 - Default Privacy):**
1. Change address generation (unique per transaction)
2. UTXO selection randomization (Fisher-Yates shuffle)
3. Auto-generated receive addresses (with gap limit enforcement)
4. Contacts privacy tracking (xpub rotation, reusage counting)

**Phase 3 (P2 - Optional Privacy Mode):**
5. Privacy settings storage and management
6. Round number randomization (±0.1% variance)
7. API request timing delays (1-5s randomization)
8. Transaction broadcast delays (5-30s randomization)

### Testing Goals

**Primary Objectives:**
1. ✅ Achieve **100% coverage on P0 critical paths** (change addresses, UTXO randomization)
2. ✅ Achieve **95% coverage on P1 features** (auto-generation, contacts privacy)
3. ✅ Achieve **90% coverage on P2 features** (optional privacy mode)
4. ✅ Implement **all 26 security test cases** from security review
5. ✅ Validate **privacy metrics**: 0% change reuse, >50% UTXO entropy, gap limit compliance

### Test Metrics Summary

| Category | Total Tests | P0 Tests | P1 Tests | P2 Tests |
|----------|-------------|----------|----------|----------|
| **Backend Unit Tests** | 42 | 18 | 12 | 12 |
| **Frontend Unit Tests** | 28 | 8 | 12 | 8 |
| **Integration Tests** | 15 | 6 | 5 | 4 |
| **Security Tests** | 26 | 12 | 8 | 6 |
| **Privacy Metrics Tests** | 5 | 3 | 2 | 0 |
| **Performance Tests** | 8 | 3 | 2 | 3 |
| **TOTAL** | **124 tests** | **50** | **41** | **33** |

### Expected Timeline

- **Backend Unit Tests:** 3 days (42 tests)
- **Frontend Unit Tests:** 2 days (28 tests)
- **Integration Tests:** 2 days (15 tests)
- **Security Tests:** 2 days (26 tests, some overlap with unit tests)
- **Privacy Metrics & Performance:** 1 day (13 tests)
- **Testnet Validation:** 2 days (manual testing)
- **Total:** **12 days** (~2.5 weeks)

---

## Testing Strategy

### Testing Pyramid Approach

```
           ┌─────────────┐
           │   Manual    │  Testnet validation (10%)
           │  Testing    │
           ├─────────────┤
           │ Integration │  E2E privacy flows (12%)
           │   Tests     │
           ├─────────────┤
           │   Unit      │  Component/function tests (78%)
           │   Tests     │
           └─────────────┘
```

**Distribution:**
- **Unit Tests:** 70 tests (56%) - Fast, isolated, comprehensive coverage
- **Integration Tests:** 15 tests (12%) - Critical user flows and message passing
- **Security Tests:** 26 tests (21%) - Vulnerability and attack vector testing
- **Metrics Tests:** 5 tests (4%) - Privacy regression detection
- **Performance Tests:** 8 tests (6%) - Ensure features don't degrade performance
- **Manual Tests:** ~10 test cases (testnet validation)

### Test-Driven Development (TDD)

**For Critical Features (P0):**
1. Write tests BEFORE implementation
2. Tests define expected behavior
3. Implement until tests pass
4. Refactor with confidence (tests prevent regressions)

**TDD Applied To:**
- Change address generation
- UTXO randomization
- Gap limit enforcement
- Round number variance enforcement

### Coverage Targets

| Priority | Target Coverage | Enforcement |
|----------|----------------|-------------|
| **P0 (Critical)** | 100% | CI blocks merge if <100% |
| **P1 (High)** | 95% | CI warns if <95% |
| **P2 (Optional)** | 90% | CI warns if <90% |
| **Overall** | 92%+ | CI blocks if <80% |

### Test Tooling

**Frameworks:**
- **Jest** (v29+) - Test runner, assertions, mocking
- **React Testing Library** - Component testing (behavior-focused)
- **@testing-library/user-event** - Realistic user interactions
- **@testing-library/jest-dom** - DOM matchers

**Coverage:**
- **Jest Coverage** - Built-in coverage reporting (Istanbul)
- **Codecov** - Coverage visualization and tracking

**Chrome Extension:**
- **chrome-mock** - Mock Chrome APIs (storage, runtime, alarms)
- **webextension-polyfill** - Cross-browser API compatibility

---

## Test Coverage Requirements

### Coverage Configuration

**jest.config.js:**

```javascript
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // P0: Critical privacy features (100% required)
    './src/background/index.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/background/bitcoin/TransactionBuilder.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/background/privacy/PrivacyUtils.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    // P1: High priority features (95%)
    './src/tab/components/ReceiveScreen.tsx': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/tab/components/SendScreen.tsx': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    './src/tab/components/shared/ContactCard.tsx': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
};
```

### Coverage Exclusions

**Excluded from coverage requirements:**
- Type definition files (*.d.ts)
- Test files themselves
- Mock data and fixtures
- Development-only utilities
- Legacy code (if any)

---

## Backend Unit Tests

### 4.1 Change Address Generation Tests

**File:** `src/background/__tests__/change-address-generation.test.ts`

**Coverage Target:** 100% (P0 - CRITICAL)

**Total Tests:** 7

#### Test Suite Outline

```typescript
describe('Change Address Generation (P0 - CRITICAL)', () => {
  describe('getOrGenerateChangeAddress', () => {
    it('generates unique change addresses for 1000 transactions', async () => {
      // Test: Verify 1000 unique change addresses
      // Priority: P0
      // Security Test Case: Yes (from security review)
    });

    it('uses internal chain (m/.../1/x) for change addresses', async () => {
      // Test: Verify derivation path uses internal chain
      // Priority: P0
      // Security Test Case: Yes
    });

    it('increments internalIndex after each generation', async () => {
      // Test: Verify state mutation
      // Priority: P0
    });

    it('throws error on generation failure (no fallback)', async () => {
      // Test: Never falls back to address[0]
      // Priority: P0 - CRITICAL
      // Security Test Case: Yes
    });

    it('handles concurrent calls safely (no race condition)', async () => {
      // Test: 10 parallel calls produce 10 unique addresses
      // Priority: P0
      // Security Test Case: Yes
    });

    it('works for multisig accounts (BIP48 compliance)', async () => {
      // Test: Multisig change addresses use correct path
      // Priority: P0
    });

    it('logs change address generation for debugging', async () => {
      // Test: Verify console.log called with correct message
      // Priority: P1
    });
  });
});
```

#### Key Test Implementation Example

```typescript
it('generates unique change addresses for 1000 transactions', async () => {
  const changeAddresses = new Set<string>();

  for (let i = 0; i < 1000; i++) {
    const changeAddr = await getOrGenerateChangeAddress(0);
    changeAddresses.add(changeAddr);
  }

  // CRITICAL: All addresses must be unique (0% reuse)
  expect(changeAddresses.size).toBe(1000);
});

it('throws error on generation failure (no fallback)', async () => {
  // Mock handleGenerateAddress to fail
  jest.spyOn(global, 'handleGenerateAddress').mockResolvedValue({
    success: false,
    error: 'Generation failed',
  });

  // CRITICAL: Must throw error, NEVER fall back to account.addresses[0]
  await expect(getOrGenerateChangeAddress(0)).rejects.toThrow('Failed to generate');

  // Verify no silent fallback occurred
  const account = state.accounts[0];
  const recentTransactions = await getRecentTransactions(account);
  recentTransactions.forEach(tx => {
    expect(extractChangeAddress(tx)).not.toBe(account.addresses[0].address);
  });
});
```

---

### 4.2 UTXO Randomization Tests

**File:** `src/background/bitcoin/__tests__/utxo-randomization.test.ts`

**Coverage Target:** 100% (P0 - CRITICAL)

**Total Tests:** 9

#### Test Suite Outline

```typescript
describe('UTXO Selection Randomization (P0 - CRITICAL)', () => {
  describe('shuffleArray (Fisher-Yates)', () => {
    it('produces uniform distribution (10,000 runs)', () => {
      // Test: Chi-squared test for uniformity
      // Priority: P0
      // Security Test Case: Yes
    });

    it('shuffles in-place without mutating original', () => {
      // Test: Verify copy created before shuffle
      // Priority: P0
    });

    it('handles edge cases (empty array, single element)', () => {
      // Test: Edge case handling
      // Priority: P1
    });
  });

  describe('selectUTXOs (randomized)', () => {
    it('produces non-deterministic selection (100 runs)', () => {
      // Test: >10 unique selections across 100 runs
      // Priority: P0
      // Security Test Case: Yes
    });

    it('achieves >50% of theoretical maximum entropy', () => {
      // Test: Shannon entropy calculation
      // Priority: P0
      // Security Test Case: Yes
    });

    it('selects sufficient UTXOs despite randomization', () => {
      // Test: Always meets target amount + fees
      // Priority: P0
    });

    it('respects dust threshold (no dust change)', () => {
      // Test: Change is either 0 or >= DUST_THRESHOLD
      // Priority: P0
    });

    it('fees within 10% of greedy selection', () => {
      // Test: Randomization doesn't inflate fees excessively
      // Priority: P1
      // Security Test Case: Yes
    });

    it('handles insufficient funds gracefully', () => {
      // Test: Throws clear error when UTXOs insufficient
      // Priority: P1
    });
  });
});
```

#### Key Test Implementation Example

```typescript
it('achieves >50% of theoretical maximum entropy', () => {
  const utxos = createTestUTXOs(10); // 10 UTXOs
  const params = {
    utxos,
    targetAmount: 50000,
    feeRate: 1,
    changeAddress: 'tb1q...',
  };

  const selectionCounts = new Map<string, number>();
  const runs = 1000;

  // Run selection 1000 times
  for (let i = 0; i < runs; i++) {
    const result = transactionBuilder.selectUTXOs(params);
    const key = result.selectedUtxos.map(u => u.txid).sort().join(',');
    selectionCounts.set(key, (selectionCounts.get(key) || 0) + 1);
  }

  // Calculate Shannon entropy
  let entropy = 0;
  selectionCounts.forEach(count => {
    const p = count / runs;
    entropy -= p * Math.log2(p);
  });

  const theoreticalMax = Math.log2(selectionCounts.size);
  const entropyPercent = (entropy / theoreticalMax) * 100;

  console.log(`UTXO Selection Entropy: ${entropyPercent.toFixed(2)}% of theoretical maximum`);

  // CRITICAL: Must achieve >50% entropy for privacy
  expect(entropyPercent).toBeGreaterThan(50);
});
```

---

### 4.3 Contacts Privacy Backend Tests

**File:** `src/background/__tests__/contacts-privacy.test.ts`

**Coverage Target:** 95% (P1)

**Total Tests:** 8

#### Test Suite Outline

```typescript
describe('Contacts Privacy Backend (P1)', () => {
  describe('handleGetNextContactAddress', () => {
    it('returns next address for xpub contact (sequential rotation)', async () => {
      // Test: Address rotation works correctly
      // Priority: P1
    });

    it('returns error for non-xpub contact', async () => {
      // Test: Single-address contacts don't support rotation
      // Priority: P1
    });

    it('returns error when cache exhausted (no wrap-around)', async () => {
      // Test: CRITICAL - never wrap to index 0
      // Priority: P0
      // Security Test Case: Yes
    });

    it('validates contactId exists', async () => {
      // Test: Returns error for non-existent contact
      // Priority: P1
      // Security Test Case: Yes
    });
  });

  describe('handleIncrementContactUsage', () => {
    it('increments lastUsedAddressIndex for xpub contact', async () => {
      // Test: Xpub index increments correctly
      // Priority: P1
    });

    it('increments reusageCount for single-address contact', async () => {
      // Test: Single-address counter increments
      // Priority: P1
      // Security Test Case: Yes
    });

    it('updates contact.updatedAt timestamp', async () => {
      // Test: Timestamp updated on usage
      // Priority: P2
    });

    it('handles concurrent increments safely', async () => {
      // Test: Race condition protection
      // Priority: P1
      // Security Test Case: Yes
    });
  });
});
```

---

### 4.4 Privacy Settings Storage Tests

**File:** `src/background/__tests__/privacy-settings.test.ts`

**Coverage Target:** 95% (P2)

**Total Tests:** 6

#### Test Suite Outline

```typescript
describe('Privacy Settings Storage (P2)', () => {
  describe('handleGetPrivacySettings', () => {
    it('returns default settings when not set', async () => {
      // Test: Default values returned
      // Priority: P2
    });

    it('returns saved settings from storage', async () => {
      // Test: Persistence works
      // Priority: P2
    });

    it('handles corrupted storage gracefully', async () => {
      // Test: Falls back to defaults on error
      // Priority: P2
    });
  });

  describe('handleUpdatePrivacySettings', () => {
    it('updates partial settings (merge with existing)', async () => {
      // Test: Partial update doesn't overwrite all
      // Priority: P2
    });

    it('validates setting values before saving', async () => {
      // Test: Invalid values rejected
      // Priority: P2
    });

    it('persists settings across extension restart', async () => {
      // Test: chrome.storage.local persistence
      // Priority: P2
    });
  });
});
```

---

### 4.5 Round Number Randomization Tests

**File:** `src/background/privacy/__tests__/round-number-randomization.test.ts`

**Coverage Target:** 100% (P2 but CRITICAL for security)

**Total Tests:** 7

#### Test Suite Outline

```typescript
describe('Round Number Randomization (P2 - Security Critical)', () => {
  describe('detectRoundNumber', () => {
    it('detects round numbers (>= 3 trailing zeros)', () => {
      // Test: Correct detection algorithm
      // Priority: P2
    });

    it('does not detect non-round numbers', () => {
      // Test: No false positives on most inputs
      // Priority: P2
      // Security Test Case: Yes
    });
  });

  describe('randomizeAmount', () => {
    it('uses integer math to avoid precision errors', () => {
      // Test: CRITICAL - no float arithmetic
      // Priority: P0 (security critical)
      // Security Test Case: Yes
    });

    it('enforces maximum variance of 0.001 (0.1%)', () => {
      // Test: CRITICAL - variance never exceeds 0.1%
      // Priority: P0 (security critical)
      // Security Test Case: Yes
    });

    it('returns positive values within ±0.1% variance', () => {
      // Test: Bounds validation (1000 runs)
      // Priority: P0 (security critical)
      // Security Test Case: Yes
    });

    it('handles custom variance parameter', () => {
      // Test: Parameter override works
      // Priority: P2
    });

    it('validates input (throws on invalid amount)', () => {
      // Test: Input validation
      // Priority: P1
    });
  });
});
```

#### Key Test Implementation Example

```typescript
it('uses integer math to avoid precision errors', () => {
  const amounts = [
    1, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, // 1 sat to 1 BTC
    1000000000, 10000000000, 100000000000, // 10 BTC to 1000 BTC
  ];

  amounts.forEach(amount => {
    for (let i = 0; i < 100; i++) {
      const randomized = randomizeAmount(amount);

      // CRITICAL: Result must be integer (no float precision errors)
      expect(Number.isInteger(randomized)).toBe(true);

      // Verify within bounds
      expect(randomized).toBeGreaterThan(amount * 0.999);
      expect(randomized).toBeLessThan(amount * 1.001);
    }
  });
});

it('enforces maximum variance of 0.001 (0.1%)', () => {
  const amount = 100000000; // 1 BTC

  // Try to use larger variance (should throw or cap)
  expect(() => randomizeAmount(amount, 0.01)).toThrow('Maximum variance');
  expect(() => randomizeAmount(amount, 0.1)).toThrow('Maximum variance');
  expect(() => randomizeAmount(amount, 1.0)).toThrow('Maximum variance');

  // Valid variance should work
  expect(() => randomizeAmount(amount, 0.001)).not.toThrow();
  expect(() => randomizeAmount(amount, 0.0005)).not.toThrow();
});
```

---

### 4.6 API Timing Delays Tests

**File:** `src/background/api/__tests__/BlockstreamClient-privacy.test.ts`

**Coverage Target:** 90% (P2)

**Total Tests:** 5

#### Test Suite Outline

```typescript
describe('API Request Timing Delays (P2)', () => {
  describe('BlockstreamClient with privacyMode', () => {
    it('adds delays when privacy mode enabled', async () => {
      // Test: Delays applied to requests
      // Priority: P2
      // Security Test Case: Yes
    });

    it('does not add delays when privacy mode disabled', async () => {
      // Test: Fast path when disabled
      // Priority: P2
      // Security Test Case: Yes
    });

    it('enforces 60-second cumulative timeout', async () => {
      // Test: CRITICAL - prevent DoS
      // Priority: P0 (security critical)
      // Security Test Case: Yes
    });

    it('supports AbortController for cancellation', async () => {
      // Test: Request cancellation works
      // Priority: P1
      // Security Test Case: Yes
    });

    it('delays are within expected range (1-5s)', async () => {
      // Test: Randomization bounds
      // Priority: P2
      // Security Test Case: Yes
    });
  });
});
```

#### Key Test Implementation Example

```typescript
it('enforces 60-second cumulative timeout', async () => {
  const client = new BlockstreamClient('testnet', true); // Privacy mode ON
  const addresses = Array(20).fill(null).map((_, i) => `tb1q${i}...`);

  const startTime = Date.now();

  // Fetch 20 addresses (with 1-5s delays, could take 20-100 seconds)
  // Should timeout at 60 seconds
  await expect(
    Promise.all(addresses.map(addr => client.getUTXOs(addr)))
  ).rejects.toThrow('timeout');

  const elapsed = Date.now() - startTime;

  // CRITICAL: Must timeout around 60 seconds (allow 5s buffer)
  expect(elapsed).toBeLessThan(65000);
  expect(elapsed).toBeGreaterThan(55000);
});
```

---

## Frontend Unit Tests

### 5.1 Shared Components Tests

**Coverage Target:** 95% (P1)

**Total Tests:** 12

#### PrivacyBadge Tests

**File:** `src/tab/components/shared/__tests__/PrivacyBadge.test.tsx`

**Tests:** 4

```typescript
describe('PrivacyBadge Component', () => {
  it('renders success variant with correct styling', () => {
    // Test: Green badge for success
    // Priority: P1
  });

  it('renders warning variant with correct styling', () => {
    // Test: Amber badge for warning
    // Priority: P1
  });

  it('shows tooltip on hover', async () => {
    // Test: Tooltip appears on mouseEnter
    // Priority: P1
  });

  it('is keyboard accessible (focus, aria-label)', () => {
    // Test: Accessibility compliance
    // Priority: P1
  });
});
```

#### InfoBox Tests

**File:** `src/tab/components/shared/__tests__/InfoBox.test.tsx`

**Tests:** 4

```typescript
describe('InfoBox Component', () => {
  it('renders with title and content', () => {
    // Test: Basic rendering
    // Priority: P1
  });

  it('calls onDismiss when X button clicked', () => {
    // Test: Dismissible functionality
    // Priority: P1
  });

  it('calls action.onClick when action button clicked', () => {
    // Test: Action button works
    // Priority: P1
  });

  it('renders different variants (info/success/warning)', () => {
    // Test: All variants render correctly
    // Priority: P1
  });
});
```

#### ToggleSwitch Tests

**File:** `src/tab/components/shared/__tests__/ToggleSwitch.test.tsx`

**Tests:** 4

```typescript
describe('ToggleSwitch Component', () => {
  it('calls onChange when toggled', () => {
    // Test: Toggle interaction
    // Priority: P2
  });

  it('displays trade-off warning when provided', () => {
    // Test: Warning UI
    // Priority: P2
  });

  it('is disabled when disabled prop is true', () => {
    // Test: Disabled state
    // Priority: P2
  });

  it('is keyboard accessible (Space/Enter to toggle)', () => {
    // Test: Accessibility
    // Priority: P1
  });
});
```

---

### 5.2 ReceiveScreen Privacy Tests

**File:** `src/tab/components/__tests__/ReceiveScreen-privacy.test.tsx`

**Coverage Target:** 95% (P1)

**Total Tests:** 7

#### Test Suite Outline

```typescript
describe('ReceiveScreen - Privacy Features (P1)', () => {
  it('auto-generates address on mount', async () => {
    // Test: useEffect triggers GENERATE_ADDRESS
    // Priority: P1
  });

  it('shows privacy banner after generation', async () => {
    // Test: Banner displayed
    // Priority: P1
  });

  it('auto-dismisses banner after 3 seconds', async () => {
    // Test: Timeout dismissal
    // Priority: P1
  });

  it('shows gap limit warning when gap >= 15', async () => {
    // Test: Warning UI
    // Priority: P0 (security critical)
  });

  it('prevents generation when gap >= 20', async () => {
    // Test: CRITICAL - gap limit enforcement
    // Priority: P0 (security critical)
    // Security Test Case: Yes
  });

  it('shows Fresh badge for unused addresses', () => {
    // Test: Badge rendering
    // Priority: P1
  });

  it('shows Previously Used badge with warning for used addresses', () => {
    // Test: Badge rendering and warning box
    // Priority: P1
  });
});
```

#### Key Test Implementation Example

```typescript
it('prevents generation when gap >= 20', async () => {
  // Create account with 20 unused addresses
  const account = {
    ...mockAccount,
    addresses: Array(20).fill(null).map((_, i) => ({
      address: `tb1q${i}...`,
      used: false,
      isChange: false,
      index: i,
    })),
  };

  render(<ReceiveScreen account={account} onBack={() => {}} />);

  // Should show error, not generate new address
  await waitFor(() => {
    expect(screen.getByText(/Gap limit reached/i)).toBeInTheDocument();
  });

  // CRITICAL: GENERATE_ADDRESS should NOT have been called
  expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: 'GENERATE_ADDRESS' })
  );
});
```

---

### 5.3 SendScreen Privacy Tests

**File:** `src/tab/components/__tests__/SendScreen-privacy.test.tsx`

**Coverage Target:** 95% (P1)

**Total Tests:** 6

#### Test Suite Outline

```typescript
describe('SendScreen - Privacy Features (P1)', () => {
  it('shows warning for single-address contact', async () => {
    // Test: Warning box displays
    // Priority: P1
  });

  it('displays reusage count in warning', async () => {
    // Test: Counter shown correctly
    // Priority: P1
  });

  it('shows success indicator for xpub contact', async () => {
    // Test: Green success box
    // Priority: P1
  });

  it('fetches next contact address on xpub contact selection', async () => {
    // Test: Message handler called
    // Priority: P1
  });

  it('increments contact usage after successful send', async () => {
    // Test: INCREMENT_CONTACT_USAGE called
    // Priority: P1
  });

  it('shows change address privacy indicator in summary', () => {
    // Test: Privacy indicator rendered
    // Priority: P1
  });
});
```

---

### 5.4 SettingsScreen Privacy Tests

**File:** `src/tab/components/__tests__/SettingsScreen-privacy.test.tsx`

**Coverage Target:** 90% (P2)

**Total Tests:** 3

#### Test Suite Outline

```typescript
describe('SettingsScreen - Privacy Mode (P2)', () => {
  it('fetches and displays privacy settings on mount', async () => {
    // Test: GET_PRIVACY_SETTINGS called
    // Priority: P2
  });

  it('updates privacy setting on toggle', async () => {
    // Test: UPDATE_PRIVACY_SETTINGS called with correct payload
    // Priority: P2
  });

  it('reverts toggle on error (optimistic update rollback)', async () => {
    // Test: Error handling
    // Priority: P2
  });
});
```

---

## Integration Tests

### 6.1 Message Passing Integration

**File:** `src/__tests__/integration/message-passing-privacy.test.ts`

**Coverage Target:** 90%

**Total Tests:** 6

#### Test Suite Outline

```typescript
describe('Privacy Message Passing Integration', () => {
  it('GET_NEXT_CONTACT_ADDRESS: frontend → backend → response', async () => {
    // Test: Full message round-trip
    // Priority: P1
  });

  it('INCREMENT_CONTACT_USAGE: updates storage correctly', async () => {
    // Test: Storage mutation verification
    // Priority: P1
  });

  it('GET_PRIVACY_SETTINGS: returns correct defaults', async () => {
    // Test: Default settings flow
    // Priority: P2
  });

  it('UPDATE_PRIVACY_SETTINGS: persists and retrieves', async () => {
    // Test: Settings persistence
    // Priority: P2
  });

  it('GENERATE_ADDRESS with isChange=true: change address creation', async () => {
    // Test: Change address flow
    // Priority: P0
  });

  it('Error handling: invalid message types return error', async () => {
    // Test: Error responses
    // Priority: P1
  });
});
```

---

### 6.2 End-to-End Privacy Flows

**File:** `src/__tests__/integration/privacy-e2e.test.ts`

**Coverage Target:** 85%

**Total Tests:** 9

#### Test Suite Outline

```typescript
describe('End-to-End Privacy Flows', () => {
  describe('Send Transaction Privacy Flow', () => {
    it('sends transaction with unique change address', async () => {
      // Test: Full send flow with change address generation
      // Priority: P0
    });

    it('uses randomized UTXO selection', async () => {
      // Test: UTXO selection varies across sends
      // Priority: P0
    });

    it('increments contact usage after send to xpub contact', async () => {
      // Test: Contact rotation integration
      // Priority: P1
    });
  });

  describe('Receive Address Privacy Flow', () => {
    it('generates fresh address on ReceiveScreen open', async () => {
      // Test: Auto-generation flow
      // Priority: P1
    });

    it('enforces gap limit at 20 addresses', async () => {
      // Test: Gap limit integration
      // Priority: P0 (security critical)
    });
  });

  describe('Contact Privacy Flow', () => {
    it('rotates through xpub addresses for 5 sends', async () => {
      // Test: Full rotation flow
      // Priority: P1
    });

    it('shows privacy warning after 5 sends to single-address contact', async () => {
      // Test: Warning threshold integration
      // Priority: P1
    });
  });

  describe('Privacy Mode Settings Flow', () => {
    it('enables round number randomization and sends transaction', async () => {
      // Test: Optional privacy mode integration
      // Priority: P2
    });

    it('applies API timing delays when enabled', async () => {
      // Test: Timing delay integration
      // Priority: P2
    });
  });
});
```

---

## Security Test Cases

### 7.1 Security Test Matrix

**All 26 security test cases from security review must be implemented.**

**Coverage Target:** 100% (all tests must pass before release)

#### Summary by Feature

| Feature | Security Tests | File Location |
|---------|---------------|---------------|
| Change Address Generation | 4 tests | `change-address-generation.test.ts` |
| UTXO Randomization | 4 tests | `utxo-randomization.test.ts` |
| Auto-Generated Addresses | 3 tests | `ReceiveScreen-privacy.test.tsx` |
| Contacts Privacy | 4 tests | `contacts-privacy.test.ts` |
| Round Number Randomization | 4 tests | `round-number-randomization.test.ts` |
| API Timing Delays | 3 tests | `BlockstreamClient-privacy.test.ts` |
| Broadcast Delays | 4 tests | `broadcast-delays.test.ts` |

### 7.2 Broadcast Delay Security Tests

**File:** `src/background/__tests__/broadcast-delays.test.ts`

**Coverage Target:** 100% (P2 but CRITICAL for security)

**Total Tests:** 4

#### Test Suite Outline

```typescript
describe('Transaction Broadcast Delays - Security (P2)', () => {
  it('broadcasts transaction even if service worker terminates', async () => {
    // Test: CRITICAL - chrome.alarms survive termination
    // Priority: P0 (security critical)
    // Security Test Case: Yes
  });

  it('stores pending transaction state during delay', async () => {
    // Test: Pending tracking
    // Priority: P1
    // Security Test Case: Yes
  });

  it('cancels broadcast when user clicks Cancel', async () => {
    // Test: User control
    // Priority: P1
    // Security Test Case: Yes
  });

  it('prevents duplicate sends during pending broadcast', async () => {
    // Test: CRITICAL - prevent double-spends
    // Priority: P0 (security critical)
    // Security Test Case: Yes
  });
});
```

#### Key Test Implementation Example

```typescript
it('broadcasts transaction even if service worker terminates', async () => {
  const txHex = 'raw-tx-hex';
  const delay = 10000; // 10 seconds

  // Start delayed broadcast using chrome.alarms
  const alarmId = await broadcastTransactionWithDelay(txHex, delay);

  // Verify pending state stored
  const pending = await chrome.storage.local.get(`pending-broadcast-${alarmId}`);
  expect(pending[`pending-broadcast-${alarmId}`].txHex).toBe(txHex);

  // Simulate service worker termination and restart
  await terminateServiceWorker();
  await restartServiceWorker();

  // Wait for alarm to fire
  await new Promise(resolve => setTimeout(resolve, 11000));

  // CRITICAL: Transaction must have been broadcast despite termination
  expect(mockBroadcastTransaction).toHaveBeenCalledWith(txHex);

  // Verify cleanup occurred
  const cleaned = await chrome.storage.local.get(`pending-broadcast-${alarmId}`);
  expect(cleaned[`pending-broadcast-${alarmId}`]).toBeUndefined();
});
```

---

## Privacy Metrics Validation

### 8.1 Privacy Regression Tests

**File:** `src/__tests__/privacy-metrics/regression.test.ts`

**Coverage Target:** 100% (CRITICAL for privacy)

**Total Tests:** 5

#### Test Suite Outline

```typescript
describe('Privacy Metrics Regression Suite (CRITICAL)', () => {
  it('maintains 0% change address reuse', async () => {
    // Test: 100 transactions = 100 unique change addresses
    // Priority: P0 - CRITICAL
    // Metric: Change address reuse = 0%
  });

  it('achieves >50% UTXO selection entropy', () => {
    // Test: Shannon entropy over 1000 selections
    // Priority: P0 - CRITICAL
    // Metric: UTXO entropy >= 50%
  });

  it('enforces gap limit at 20 addresses', async () => {
    // Test: Cannot generate 21st unused address
    // Priority: P0 - CRITICAL
    // Metric: Gap limit compliance = 100%
  });

  it('rotates contact addresses correctly (0% xpub reuse)', async () => {
    // Test: 50 sends to xpub contact use 50 different addresses
    // Priority: P1
    // Metric: Xpub address rotation = 100%
  });

  it('tracks single-address contact reuse accurately', async () => {
    // Test: reusageCount increments correctly
    // Priority: P1
    // Metric: Reusage counter accuracy = 100%
  });
});
```

#### Key Test Implementation Example

```typescript
it('maintains 0% change address reuse', async () => {
  const changeAddresses = new Set<string>();

  // Send 100 transactions
  for (let i = 0; i < 100; i++) {
    const tx = await sendTestTransaction({
      accountIndex: 0,
      toAddress: 'tb1qtest...',
      amount: 10000 + i, // Vary amount
      feeRate: 1,
    });

    // Extract change address from transaction
    const changeAddr = await extractChangeAddress(tx.data.txid);
    changeAddresses.add(changeAddr);
  }

  // CRITICAL: All 100 change addresses must be unique (0% reuse)
  expect(changeAddresses.size).toBe(100);

  // Log metric for monitoring
  console.log(`Change Address Reuse Rate: 0% (100/100 unique)`);
});

it('achieves >50% UTXO selection entropy', () => {
  const utxos = createTestUTXOs(15); // 15 UTXOs for variety
  const params = {
    utxos,
    targetAmount: 75000,
    feeRate: 2,
    changeAddress: 'tb1q...',
  };

  const selectionCounts = new Map<string, number>();
  const runs = 1000;

  for (let i = 0; i < runs; i++) {
    const result = transactionBuilder.selectUTXOs(params);
    const key = result.selectedUtxos.map(u => u.txid).sort().join(',');
    selectionCounts.set(key, (selectionCounts.get(key) || 0) + 1);
  }

  // Calculate Shannon entropy
  let entropy = 0;
  selectionCounts.forEach(count => {
    const p = count / runs;
    entropy -= p * Math.log2(p);
  });

  const theoreticalMax = Math.log2(selectionCounts.size);
  const entropyPercent = (entropy / theoreticalMax) * 100;

  console.log(`UTXO Selection Entropy: ${entropyPercent.toFixed(2)}%`);
  console.log(`Unique selections: ${selectionCounts.size} out of ${runs} runs`);

  // CRITICAL: Must achieve >50% of theoretical maximum
  expect(entropyPercent).toBeGreaterThan(50);
});
```

---

## Performance Testing

### 9.1 Performance Benchmarks

**File:** `src/__tests__/performance/privacy-features.perf.test.ts`

**Total Tests:** 8

#### Test Suite Outline

```typescript
describe('Privacy Features Performance', () => {
  describe('Change Address Generation', () => {
    it('generates change address in <100ms', async () => {
      // Test: Performance benchmark
      // Priority: P1
      // Target: <100ms per generation
    });

    it('handles 100 concurrent generations without blocking', async () => {
      // Test: Concurrency performance
      // Priority: P1
    });
  });

  describe('UTXO Randomization', () => {
    it('shuffles 1000 UTXOs in <10ms', () => {
      // Test: Fisher-Yates performance
      // Priority: P1
      // Target: <10ms for 1000 elements
    });

    it('selects UTXOs in <50ms (randomized vs greedy)', () => {
      // Test: Selection performance comparison
      // Priority: P1
    });
  });

  describe('Privacy Mode Delays', () => {
    it('API timing delays add 1-5s per request (as designed)', async () => {
      // Test: Delay overhead measurement
      // Priority: P2
    });

    it('broadcast delay uses chrome.alarms (no setTimeout overhead)', async () => {
      // Test: Alarm API performance
      // Priority: P2
    });
  });

  describe('Frontend Rendering', () => {
    it('PrivacyBadge renders in <5ms', () => {
      // Test: Component render performance
      // Priority: P2
    });

    it('ReceiveScreen with 100 addresses renders in <100ms', () => {
      // Test: Large list rendering
      // Priority: P1
    });
  });
});
```

#### Key Test Implementation Example

```typescript
it('generates change address in <100ms', async () => {
  const iterations = 100;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await getOrGenerateChangeAddress(0);
    const elapsed = performance.now() - start;
    times.push(elapsed);
  }

  const avgTime = times.reduce((a, b) => a + b) / times.length;
  const maxTime = Math.max(...times);

  console.log(`Change address generation: avg ${avgTime.toFixed(2)}ms, max ${maxTime.toFixed(2)}ms`);

  // Performance target: <100ms average
  expect(avgTime).toBeLessThan(100);
  // Max should be <200ms (allowing for outliers)
  expect(maxTime).toBeLessThan(200);
});
```

---

## CI/CD Integration

### 10.1 GitHub Actions Workflow

**File:** `.github/workflows/test-privacy.yml`

```yaml
name: Privacy Features Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  privacy-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Privacy Unit Tests
        run: npm run test:privacy

      - name: Run Security Tests
        run: npm run test:security

      - name: Run Privacy Metrics Tests
        run: npm run test:metrics

      - name: Generate Coverage Report
        run: npm run test:coverage

      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: privacy-features
          name: privacy-coverage

      - name: Check Coverage Thresholds
        run: npm run test:coverage:check

      - name: Block PR if Tests Fail
        if: failure()
        run: exit 1

  privacy-metrics-validation:
    runs-on: ubuntu-latest
    needs: privacy-tests

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Run Privacy Regression Suite
        run: npm run test:privacy:regression

      - name: Validate Privacy Metrics
        run: |
          # Check that privacy metrics meet targets
          npm run validate:privacy-metrics

      - name: Post Metrics to PR Comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            // Post privacy metrics as PR comment
            // (Implementation details)
```

### 10.2 NPM Scripts

**Add to package.json:**

```json
{
  "scripts": {
    "test": "jest",
    "test:privacy": "jest --testPathPattern=privacy",
    "test:security": "jest --testPathPattern=security",
    "test:metrics": "jest --testPathPattern=privacy-metrics",
    "test:coverage": "jest --coverage",
    "test:coverage:check": "jest --coverage --coverageThreshold='{ \"global\": { \"branches\": 80, \"functions\": 80, \"lines\": 80, \"statements\": 80 } }'",
    "test:privacy:regression": "jest --testPathPattern=privacy-metrics/regression",
    "validate:privacy-metrics": "node scripts/validate-privacy-metrics.js"
  }
}
```

### 10.3 Coverage Enforcement

**CI will block PRs if:**
- Overall coverage < 80%
- P0 critical path coverage < 100%
- P1 feature coverage < 95%
- Any privacy regression tests fail
- Any security tests fail

---

## Testnet Validation Plan

### 11.1 Manual Testing Checklist

**Pre-Deployment Testing on Bitcoin Testnet**

#### Privacy Feature Validation

**Change Address Privacy (P0 - CRITICAL)**

- [ ] Send 10 real testnet transactions
- [ ] Use Blockstream explorer to view each transaction
- [ ] Identify change outputs (non-recipient outputs)
- [ ] Verify all 10 change addresses are different
- [ ] Verify change addresses NOT in receive address list
- [ ] Verify change addresses use internal chain (if derivation path visible)

**UTXO Selection Randomization (P0)**

- [ ] Create account with 10 UTXOs (mix of sizes)
- [ ] Send 5 transactions with same amount and fee rate
- [ ] Verify UTXO selection varies across transactions
- [ ] Check that fees are within 10% of greedy selection

**Receive Address Auto-Generation (P1)**

- [ ] Open ReceiveScreen 5 times
- [ ] Verify fresh address generated each time
- [ ] Verify privacy banner displays
- [ ] Verify banner auto-dismisses after 3 seconds
- [ ] Verify "Fresh" badges on new addresses
- [ ] Verify "Previously Used" badges on used addresses

**Gap Limit Enforcement (P0 - CRITICAL)**

- [ ] Generate 15 unused addresses
- [ ] Verify warning displays ("Approaching gap limit")
- [ ] Generate 5 more addresses (total 20 unused)
- [ ] Verify generation blocked with error message
- [ ] Verify error message mentions gap limit

**Contact Privacy - Xpub Rotation (P1)**

- [ ] Create xpub contact with 20 cached addresses
- [ ] Send 5 transactions to this contact
- [ ] Verify 5 different addresses used
- [ ] Verify `lastUsedAddressIndex` = 4 after 5 sends
- [ ] Verify privacy success indicator in SendScreen

**Contact Privacy - Single Address Warning (P1)**

- [ ] Create single-address contact
- [ ] Send 3 transactions to this contact
- [ ] Verify `reusageCount` = 3
- [ ] Verify privacy warning displays in SendScreen
- [ ] Send 2 more (total 5) - verify upgrade suggestion appears

**Privacy Mode Settings (P2)**

- [ ] Open Settings, expand Privacy Mode section
- [ ] Enable "Randomize Round Amounts"
- [ ] Send transaction with round amount (e.g., 0.1 BTC)
- [ ] Verify randomization indicator displays
- [ ] Verify actual amount sent is slightly randomized
- [ ] Enable "Randomize API Timing"
- [ ] Refresh balance, observe slower update (5-20s)
- [ ] Enable "Delay Broadcast"
- [ ] Send transaction, verify countdown displays
- [ ] Verify "Broadcast Now" and "Cancel" buttons work

#### Edge Cases and Error Handling

- [ ] Close ReceiveScreen during address generation - verify no partial state
- [ ] Close SendScreen during broadcast delay - verify transaction still broadcasts
- [ ] Disable internet during API timing delays - verify timeout error
- [ ] Exhaust xpub contact cache (use all 20 addresses) - verify error message
- [ ] Try to send during pending broadcast - verify duplicate prevention

---

## Implementation Checklist

### 12.1 Test Development Timeline

**Week 1: Backend Unit Tests (5 days)**

- [ ] **Day 1:** Change Address Generation Tests (7 tests)
  - [ ] Unique address generation (1000 runs)
  - [ ] Internal chain verification
  - [ ] State mutation (internalIndex increment)
  - [ ] Error handling (no fallback)
  - [ ] Concurrent calls safety
  - [ ] Multisig compliance
  - [ ] Logging verification

- [ ] **Day 2:** UTXO Randomization Tests (9 tests)
  - [ ] Fisher-Yates uniformity (10,000 runs)
  - [ ] In-place shuffle verification
  - [ ] Edge case handling
  - [ ] Non-deterministic selection (100 runs)
  - [ ] Entropy calculation (>50%)
  - [ ] Sufficient UTXO selection
  - [ ] Dust threshold compliance
  - [ ] Fee comparison vs greedy
  - [ ] Insufficient funds handling

- [ ] **Day 3:** Contacts Privacy Tests (8 tests)
  - [ ] Xpub address rotation
  - [ ] Non-xpub error handling
  - [ ] Cache exhaustion prevention
  - [ ] Contact ID validation
  - [ ] lastUsedAddressIndex increment
  - [ ] reusageCount increment
  - [ ] Timestamp updates
  - [ ] Concurrent increment safety

- [ ] **Day 4:** Privacy Settings & Round Number Tests (13 tests)
  - [ ] Default settings retrieval
  - [ ] Saved settings persistence
  - [ ] Corrupted storage handling
  - [ ] Partial settings update
  - [ ] Setting value validation
  - [ ] Cross-restart persistence
  - [ ] Round number detection
  - [ ] Integer math verification
  - [ ] Variance enforcement
  - [ ] Bounds validation
  - [ ] Custom variance parameter
  - [ ] Input validation

- [ ] **Day 5:** API Timing & Broadcast Delay Tests (9 tests)
  - [ ] Privacy mode delays enabled
  - [ ] Privacy mode delays disabled
  - [ ] Cumulative timeout enforcement
  - [ ] AbortController cancellation
  - [ ] Delay range verification
  - [ ] Service worker survival
  - [ ] Pending state storage
  - [ ] Broadcast cancellation
  - [ ] Duplicate send prevention

**Week 2: Frontend & Integration Tests (5 days)**

- [ ] **Day 6:** Shared Components Tests (12 tests)
  - [ ] PrivacyBadge variants (4 tests)
  - [ ] InfoBox functionality (4 tests)
  - [ ] ToggleSwitch interaction (4 tests)

- [ ] **Day 7:** Screen Components Tests (16 tests)
  - [ ] ReceiveScreen privacy features (7 tests)
  - [ ] SendScreen privacy features (6 tests)
  - [ ] SettingsScreen privacy mode (3 tests)

- [ ] **Day 8:** Integration Tests (15 tests)
  - [ ] Message passing (6 tests)
  - [ ] E2E privacy flows (9 tests)

- [ ] **Day 9:** Security & Metrics Tests (31 tests)
  - [ ] Security test implementation (26 tests)
  - [ ] Privacy metrics regression (5 tests)

- [ ] **Day 10:** Performance & CI Setup (8 tests + CI)
  - [ ] Performance benchmarks (8 tests)
  - [ ] GitHub Actions workflow setup
  - [ ] Coverage threshold configuration
  - [ ] NPM scripts configuration

**Week 3: Testnet Validation & Bug Fixes (2 days)**

- [ ] **Day 11-12:** Testnet Manual Testing
  - [ ] Execute full manual checklist (30+ test cases)
  - [ ] Document bugs and issues
  - [ ] Fix critical bugs
  - [ ] Re-run affected automated tests
  - [ ] Final coverage report
  - [ ] Privacy metrics validation

### 12.2 Test Completion Criteria

**Definition of Done:**

- [ ] All 124 automated tests implemented
- [ ] All tests passing in local environment
- [ ] All tests passing in CI environment
- [ ] Coverage thresholds met:
  - [ ] Overall: ≥80%
  - [ ] P0 features: 100%
  - [ ] P1 features: ≥95%
  - [ ] P2 features: ≥90%
- [ ] All 26 security tests passing
- [ ] All 5 privacy metrics tests passing
- [ ] Privacy metrics validated:
  - [ ] Change address reuse = 0%
  - [ ] UTXO entropy ≥50%
  - [ ] Gap limit compliance = 100%
- [ ] Testnet validation complete (10+ transactions)
- [ ] No open critical or high severity bugs
- [ ] Documentation updated:
  - [ ] Test strategy documented
  - [ ] Test coverage reported
  - [ ] Known issues documented

### 12.3 Deliverables

**Test Artifacts:**

1. **Test Code:**
   - [ ] 42 backend unit test files
   - [ ] 28 frontend unit test files
   - [ ] 15 integration test files
   - [ ] 26 security test files
   - [ ] 5 privacy metrics test files
   - [ ] 8 performance test files

2. **Test Reports:**
   - [ ] Coverage report (HTML + LCOV)
   - [ ] Test results summary
   - [ ] Privacy metrics report
   - [ ] Performance benchmark report
   - [ ] Testnet validation report

3. **CI/CD:**
   - [ ] GitHub Actions workflow (`.github/workflows/test-privacy.yml`)
   - [ ] NPM scripts (`package.json`)
   - [ ] Coverage configuration (`jest.config.js`)
   - [ ] Codecov integration

4. **Documentation:**
   - [ ] This testing plan (PRIVACY_TESTING_PLAN.md)
   - [ ] Testing expert notes updated
   - [ ] Test maintenance guide

---

## Conclusion

### Summary

This comprehensive testing plan covers **all aspects** of Privacy Enhancement testing:

✅ **124 automated tests** across all priority levels
✅ **100% P0 coverage** on critical privacy features
✅ **26 security tests** from security review
✅ **5 privacy metrics tests** for regression detection
✅ **Complete CI/CD integration** with coverage enforcement
✅ **Testnet validation plan** with 30+ manual test cases

### Success Criteria

**Privacy Enhancement testing is COMPLETE when:**

1. ✅ All 124 automated tests passing
2. ✅ Coverage thresholds met (100% P0, 95% P1, 90% P2)
3. ✅ All 26 security tests passing
4. ✅ Privacy metrics validated (0% change reuse, >50% entropy)
5. ✅ Testnet validation successful (10+ transactions)
6. ✅ CI/CD pipeline configured and enforcing standards
7. ✅ No open critical or high severity issues

### Next Steps

1. **Begin Test Development:** Start with Week 1 Day 1 (Change Address Tests)
2. **Run Tests Daily:** Execute test suite after each day's implementation
3. **Track Coverage:** Monitor coverage reports, address gaps immediately
4. **Security Review:** Ensure all 26 security tests implemented before review
5. **Testnet Validation:** Execute manual checklist before release
6. **Final Approval:** Security Expert and Blockchain Expert sign-off after all tests pass

---

**Testing Expert Sign-Off:**

**Owner:** Testing Expert
**Date:** October 21, 2025
**Status:** Implementation-Ready
**Estimated Completion:** 12 days (~2.5 weeks)

**Ready for implementation.** 🚀

---

**Document Version:** 1.0
**Last Updated:** October 21, 2025
**Status:** ✅ COMPLETE
