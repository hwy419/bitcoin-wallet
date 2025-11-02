# Testing Architecture Decision Records (ADRs)

**Last Updated**: 2025-10-22
**Owner**: Testing Expert
**Related**: [unit-tests.md](./unit-tests.md), [infrastructure.md](./infrastructure.md)

---

## Quick Navigation
- [Framework Decisions](#framework-decisions)
- [Coverage Strategy](#coverage-strategy)
- [Test Environment Choices](#test-environment-choices)
- [Security Testing Decisions](#security-testing-decisions)
- [Changelog](#changelog)

---

## Framework Decisions

### ADR-001: Jest as Test Runner

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Use Jest v30.2.0 as the test runner

**Context**:
- Need a test runner that supports TypeScript, React, and crypto operations
- Must work with JSDOM for React components and Node for crypto tests
- Need code coverage reporting
- Want fast test execution

**Alternatives Considered**:
- Vitest: Modern, fast, but less mature ecosystem for Chrome extensions
- Mocha + Chai: Requires more configuration, no built-in coverage

**Decision**:
Use Jest because:
- Mature ecosystem with extensive documentation
- Built-in coverage reporting
- Excellent TypeScript support via ts-jest
- Environment switching (@jest-environment directive)
- Large community and plugin ecosystem
- Built-in mocking capabilities

**Consequences**:
- ✅ Single test framework for all test types
- ✅ Excellent developer experience with watch mode
- ✅ Built-in coverage thresholds
- ⚠️ Requires polyfills for Web Crypto API in JSDOM

---

### ADR-002: React Testing Library for Component Tests

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Use React Testing Library instead of Enzyme

**Context**:
- Need to test React components for tab-based UI
- Want to test user behavior, not implementation details
- Need accessibility-first query methods

**Alternatives Considered**:
- Enzyme: Popular but tests implementation details, maintenance mode
- Testing Library: Modern, behavior-focused, actively maintained

**Decision**:
Use React Testing Library (@testing-library/react v16.3.0) because:
- Encourages testing behavior over implementation
- Accessibility-first queries (getByRole, getByLabelText)
- Actively maintained by community
- Better alignment with React best practices
- Easier to refactor components without breaking tests

**Consequences**:
- ✅ Tests are more resilient to refactoring
- ✅ Better accessibility coverage
- ✅ Clearer test intent
- ⚠️ Steeper learning curve for developers used to Enzyme

---

### ADR-003: Separate Test Environments (Node vs JSDOM)

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Use Node environment for crypto tests, JSDOM for React tests

**Context**:
- Crypto tests require crypto.subtle which JSDOM doesn't provide
- React component tests require DOM which Node doesn't provide
- Need a way to specify environment per test file

**Decision**:
Use `@jest-environment` directive to select environment:
- **Node**: For crypto operations, Bitcoin wallet logic, background services
- **JSDOM**: For React components, UI tests

**Implementation**:

```typescript
/**
 * @jest-environment node
 */
// For crypto tests

/**
 * @jest-environment jsdom
 */
// For React tests (default)
```

**Consequences**:
- ✅ Crypto tests run in native Node environment with crypto.subtle
- ✅ React tests run in JSDOM with DOM APIs
- ✅ Clear separation of concerns
- ⚠️ Must remember to add directive for crypto tests

---

## Coverage Strategy

### ADR-004: 100% Coverage for Security-Critical Code

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Require 100% coverage for security-critical modules

**Context**:
- Wallet handles private keys, seed phrases, and user funds
- Security bugs can lead to loss of funds
- Need confidence in encryption, key management, and Bitcoin operations

**Decision**:
Enforce 100% coverage on security-critical files via jest.config.js:
- `CryptoUtils.ts` (encryption/decryption)
- `KeyManager.ts` (BIP39 mnemonic, seeds)
- `WIFManager.ts` (private key import/export)

**Target**: 80% global coverage, 100% security-critical

**Rationale**:
- Every branch in crypto code must be tested
- No untested error paths in key management
- Security functions must have test vectors
- Round-trip encryption/decryption verified

**Consequences**:
- ✅ High confidence in security-critical code
- ✅ CI blocks merges if security coverage drops
- ⚠️ More time spent writing comprehensive tests
- ⚠️ Harder to refactor security code (more tests to update)

---

### ADR-005: 80% Global Coverage Threshold

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Require 80% global code coverage

**Context**:
- Need balance between test coverage and development speed
- Some code (UI, error handling) is less critical than crypto
- Want to prevent coverage regression

**Decision**:
Set global coverage threshold at 80%:
- Statements: 80%
- Branches: 80%
- Functions: 80%
- Lines: 80%

**Rationale**:
- 80% is industry standard for high-quality projects
- Critical paths exceed 80% (90-100%)
- Allows flexibility for UI and edge cases
- Prevents coverage regression via CI

**Consequences**:
- ✅ Maintains high code quality
- ✅ Catches untested code in PRs
- ✅ Reasonable development overhead
- ⚠️ Some non-critical code may remain untested

---

## Test Environment Choices

### ADR-006: Polyfill crypto.subtle from Node's webcrypto

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Use Node's webcrypto to polyfill crypto.subtle in JSDOM

**Context**:
- JSDOM doesn't provide Web Crypto API
- Need crypto.subtle for encryption tests
- Don't want to mock crypto (need real encryption)

**Alternatives Considered**:
- Mock crypto.subtle: Too complex, not realistic
- Use only Node environment: Can't test React components
- Use crypto-browserify: Outdated, not compatible

**Decision**:
Import webcrypto from Node and assign to global.crypto:

```typescript
import { webcrypto } from 'crypto';

if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
```

**Consequences**:
- ✅ Real crypto operations in tests
- ✅ No mocking required
- ✅ Same API as browser
- ⚠️ Requires Node 15+ for webcrypto

---

### ADR-007: Chrome API Mocks (In-Memory Storage)

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Mock Chrome APIs with in-memory implementations

**Context**:
- Tests run in Jest, not Chrome extension environment
- Need to test chrome.storage.local, chrome.runtime.sendMessage
- Don't want to use real Chrome extension for tests

**Decision**:
Create comprehensive Chrome API mocks:
- `chrome.storage.local`: In-memory Map-based storage
- `chrome.runtime.sendMessage`: jest.fn() with mock responses
- `chrome.runtime.onMessage`: Listener registration and triggering

**Implementation**: `src/__tests__/__mocks__/chrome.ts`

**Consequences**:
- ✅ Fast test execution (no real storage I/O)
- ✅ Easy to reset state between tests
- ✅ Full control over mock behavior
- ⚠️ Mocks may drift from real Chrome API

---

## Security Testing Decisions

### ADR-008: No Logging of Sensitive Data

**Date**: 2025-10-19
**Status**: ✅ Accepted
**Decision**: Test that sensitive data is never logged

**Context**:
- Private keys, WIFs, and passwords must never appear in logs
- Console logs can leak to browser DevTools
- Need automated verification

**Decision**:
Add security tests that verify no logging:

```typescript
it('does not log private keys to console', async () => {
  const consoleLogSpy = jest.spyOn(console, 'log');
  await handleExportPrivateKey({ accountIndex: 0 });

  const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
  // Should not contain WIF pattern (52 chars starting with c/9)
  expect(allLogs).not.toMatch(/[c9][A-Za-z0-9]{51}/);
  // Should not contain hex private key pattern (64 hex chars)
  expect(allLogs).not.toMatch(/[0-9a-f]{64}/i);
});
```

**Consequences**:
- ✅ Automated detection of logging leaks
- ✅ Prevents accidental exposure
- ⚠️ Must update patterns if WIF format changes

---

### ADR-009: Memory Cleanup Verification

**Date**: 2025-10-19
**Status**: ✅ Accepted
**Decision**: Test that sensitive data is cleared from memory

**Context**:
- Private keys must be zeroed out after use
- Memory leaks can expose keys
- Need to verify cleanup in finally blocks

**Decision**:
Test memory cleanup patterns:
- Verify sensitive strings overwritten with zeros
- Verify variables set to null
- Verify finally blocks contain cleanup code

```typescript
it('uses finally block for guaranteed cleanup', async () => {
  const exportCode = handleExportPrivateKey.toString();

  // Verify cleanup pattern exists
  expect(exportCode).toContain('repeat(');
  expect(exportCode).toContain('= null');
  expect(exportCode).toContain('finally');
});
```

**Consequences**:
- ✅ Enforces secure coding patterns
- ✅ Catches missing cleanup in code review
- ⚠️ Tests implementation (not ideal, but necessary for security)

---

### ADR-010: BIP Test Vectors Required

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Use official BIP test vectors for Bitcoin operations

**Context**:
- Bitcoin operations must comply with BIP standards
- Need confidence in address generation, derivation paths
- Test vectors provide known inputs and expected outputs

**Decision**:
Use official test vectors from:
- BIP39: Mnemonic generation and validation
- BIP32: HD wallet derivation
- BIP44/49/84: Derivation paths
- BIP67: Multisig key sorting

**Example**:

```typescript
it('should derive correct BIP32 path', () => {
  // Use official BIP32 test vector
  const seed = 'known test seed from BIP32 spec';
  const expectedPath = "m/44'/1'/0'/0/0";
  const expectedAddress = 'known address from spec';

  const address = deriveAddress(seed, expectedPath);
  expect(address).toBe(expectedAddress);
});
```

**Consequences**:
- ✅ Compliance with Bitcoin standards verified
- ✅ High confidence in Bitcoin operations
- ✅ Catches implementation bugs
- ⚠️ Must maintain test vector data

---

## Test Data Management

### ADR-011: Centralized Test Constants

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Centralize test data in `testConstants.ts`

**Context**:
- Test data scattered across files (mnemonics, addresses, etc.)
- Duplication of test data
- Hard to update test data when needed

**Decision**:
Create `src/__tests__/utils/testConstants.ts`:
- All test mnemonics
- All test addresses (testnet/mainnet, all types)
- All test transaction IDs
- Common satoshi values
- Derivation paths
- Mock API responses

**Consequences**:
- ✅ Single source of truth for test data
- ✅ Easy to update test data
- ✅ Reduces duplication
- ⚠️ Large file (300+ lines)

---

### ADR-012: Test Factories Pattern

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Use factory functions to create test objects

**Context**:
- Creating mock UTXOs, accounts, transactions is repetitive
- Want consistent test object structure
- Need flexibility to override properties

**Decision**:
Create factory functions in `testFactories.ts`:

```typescript
function createMockUTXO(value: number, index: number): UTXO {
  return {
    txid: randomTxid(),
    vout: index,
    value,
    status: { confirmed: true, block_height: 700000 },
    // ... other properties
  };
}
```

**Consequences**:
- ✅ Consistent test object creation
- ✅ Easy to create complex test scenarios
- ✅ Reduces boilerplate in tests
- ⚠️ Factory function maintenance required

---

## Testing Best Practices Decisions

### ADR-013: AAA Pattern Mandatory

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: All tests must follow Arrange-Act-Assert pattern

**Context**:
- Tests are easier to read with clear structure
- Want consistency across all test files
- New developers can understand tests quickly

**Decision**:
Enforce AAA pattern in all tests:

```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const input = 'test';

  // Act - Execute the code under test
  const result = functionUnderTest(input);

  // Assert - Verify the result
  expect(result).toBe('expected');
});
```

**Consequences**:
- ✅ Consistent, readable tests
- ✅ Easy to understand test intent
- ✅ Easier to debug failed tests
- ⚠️ Requires developer discipline

---

### ADR-014: Test Behavior, Not Implementation

**Date**: 2025-10-12
**Status**: ✅ Accepted
**Decision**: Tests should focus on behavior, not implementation details

**Context**:
- Implementation-focused tests break during refactoring
- Want tests that verify user-facing behavior
- Tests should be resilient to internal changes

**Decision**:
Test observable behavior:
- ✅ Test inputs and outputs
- ✅ Test user interactions
- ✅ Test side effects (storage, API calls)
- ❌ Don't test internal state
- ❌ Don't test private methods
- ❌ Don't test implementation details

**Example**:

```typescript
// ✅ Good: Tests behavior
it('prevents importing same key twice', async () => {
  await importKey(wif);
  const result = await importKey(wif);
  expect(result.error).toContain('already imported');
});

// ❌ Bad: Tests implementation
it('calls checkDuplicateWIF', async () => {
  const spy = jest.spyOn(module, 'checkDuplicateWIF');
  await importKey(wif);
  expect(spy).toHaveBeenCalled();
});
```

**Consequences**:
- ✅ Tests survive refactoring
- ✅ Clearer test intent
- ⚠️ Exception: Security tests may test implementation (cleanup patterns)

---

## Changelog

### 2025-10-22: Documentation Migration
- Migrated ADRs from monolithic `testing-expert-notes.md` to `decisions.md`
- Extracted 14 ADRs from testing notes
- Added cross-references to related documentation
- Organized by category (Framework, Coverage, Environment, Security, Best Practices)

### 2025-10-19: Private Key Testing Decisions
- **ADR-008**: No Logging of Sensitive Data
- **ADR-009**: Memory Cleanup Verification
- Added security-first testing requirements

### 2025-10-12: Test Infrastructure Complete
- **ADR-001**: Jest as Test Runner
- **ADR-002**: React Testing Library
- **ADR-003**: Separate Test Environments
- **ADR-004**: 100% Coverage for Security-Critical Code
- **ADR-005**: 80% Global Coverage Threshold
- **ADR-006**: Polyfill crypto.subtle from Node's webcrypto
- **ADR-007**: Chrome API Mocks
- **ADR-010**: BIP Test Vectors Required
- **ADR-011**: Centralized Test Constants
- **ADR-012**: Test Factories Pattern
- **ADR-013**: AAA Pattern Mandatory
- **ADR-014**: Test Behavior, Not Implementation

---

## Cross-References

- **Unit Tests**: See [unit-tests.md](./unit-tests.md)
- **Integration Tests**: See [integration.md](./integration.md)
- **Test Infrastructure**: See [infrastructure.md](./infrastructure.md)
