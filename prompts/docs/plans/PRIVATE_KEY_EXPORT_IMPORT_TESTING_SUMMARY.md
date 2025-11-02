# Private Key Export/Import - Testing Strategy Summary

**Version**: 1.0
**Date**: 2025-10-19
**Quick Reference Document**

---

## Quick Stats

| Metric | Target | Details |
|--------|--------|---------|
| **Total Test Files** | 15+ | 7 unit, 3 integration, 1 security, 4 component |
| **Total Test Cases** | 150+ | Comprehensive coverage |
| **Critical Code Coverage** | 100% | WIFManager, encryption, validation |
| **Overall Coverage** | 90%+ | Complete feature coverage |
| **Execution Time** | < 30 seconds | Fast test suite |

---

## Test File Checklist

### Backend Unit Tests (7 files)

- [ ] `WIFManager.test.ts` - Format validation, network detection, checksum (100% coverage)
- [ ] `WIFEncryption.test.ts` - Encryption/decryption round-trips (100% coverage)
- [ ] `DuplicateDetection.test.ts` - Key collision prevention (100% coverage)
- [ ] `NetworkValidation.test.ts` - Mainnet blocking (100% coverage)
- [ ] `PrivateKeyExtraction.test.ts` - HD and imported key extraction (95% coverage)
- [ ] `MessageHandlers.privateKey.test.ts` - Export/import handlers (95% coverage)
- [ ] `PrivateKeyEdgeCases.test.ts` - Edge cases and boundary conditions

### Integration Tests (3 files)

- [ ] `privateKeyExport.integration.test.ts` - Complete export flows
- [ ] `privateKeyImport.integration.test.ts` - Complete import flows
- [ ] `privateKeyRoundtrip.integration.test.ts` - Export → Import → Verify

### Security Tests (1 file)

- [ ] `privateKeySecurity.test.ts` - No logging, memory safety, network enforcement

### Component Tests (4 files)

- [ ] `PasswordStrengthMeter.test.tsx` - Password validation UI
- [ ] `FileUploadArea.test.tsx` - File drag/drop and selection
- [ ] `ExportPrivateKeyModal.test.tsx` - Export modal flow
- [ ] `ImportPrivateKeyModal.test.tsx` - Import modal flow

---

## Critical Security Tests (MUST PASS)

### 1. No Logging of Sensitive Data
```typescript
it('does not log private keys to console', async () => {
  const consoleLogSpy = jest.spyOn(console, 'log');
  await handleExportPrivateKey({ accountIndex: 0 });

  const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
  // Should not contain WIF pattern (52 chars starting with c/9)
  expect(allLogs).not.toMatch(/[c9][A-Za-z0-9]{51}/);

  consoleLogSpy.mockRestore();
});
```

### 2. Mainnet Key Blocking
```typescript
it('BLOCKS mainnet key import immediately', async () => {
  const mainnetWIF = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';

  const response = await handleImportPrivateKey({
    wif: mainnetWIF,
    name: 'Mainnet Key'
  });

  expect(response.success).toBe(false);
  expect(response.error).toContain('REJECTED');
  expect(response.error).toContain('mainnet');
});
```

### 3. Memory Cleanup
```typescript
it('clears private key from memory after use', async () => {
  const exportCode = handleExportPrivateKey.toString();

  // Verify cleanup pattern exists
  expect(exportCode).toContain('repeat(');
  expect(exportCode).toContain('= null');
  expect(exportCode).toContain('finally');
});
```

### 4. Duplicate Prevention
```typescript
it('prevents importing same key twice', async () => {
  const wif = VALID_TESTNET_WIF_COMPRESSED;

  await handleImportPrivateKey({ wif, name: 'First' });
  const response = await handleImportPrivateKey({ wif, name: 'Duplicate' });

  expect(response.success).toBe(false);
  expect(response.error).toContain('already imported');
});
```

---

## Test Fixtures Required

### Sample WIF Strings

```typescript
// Valid testnet WIF strings
const VALID_TESTNET_WIF_COMPRESSED = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
const VALID_TESTNET_WIF_UNCOMPRESSED = '92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc';

// Mainnet WIF strings (for rejection tests)
const MAINNET_WIF_COMPRESSED = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';
const MAINNET_WIF_UNCOMPRESSED = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';

// Invalid WIF strings
const INVALID_CHECKSUM_WIF = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpx';
const INVALID_FORMAT_WIF = 'invalid-wif-string';
```

### Mock Functions

```typescript
// Generate random testnet WIF for testing
function generateRandomTestnetWIF(): string {
  const privateKey = crypto.randomBytes(32);
  return KeyManager.privateKeyToWIF(
    privateKey.toString('hex'),
    'testnet',
    true
  );
}

// Create WIF that derives to specific address (for duplicate testing)
function createWIFForAddress(targetAddress: string): string {
  // Implementation depends on reverse derivation logic
}

// Create mock wallet with test accounts
async function createMockWallet(): Promise<Wallet> {
  // Implementation
}

// Create mock multisig account
async function createMockMultisigAccount(): Promise<WalletAccount> {
  // Implementation
}
```

---

## Coverage Requirements

### 100% Coverage (Critical Security Code)

```javascript
// jest.config.js
coverageThreshold: {
  './src/background/wallet/WIFManager.ts': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  },
  './src/background/wallet/WIFExportImport.ts': {
    branches: 100,
    functions: 100,
    lines: 100,
    statements: 100
  }
}
```

### Functions Requiring 100% Coverage

- `WIFManager.validateFormat()`
- `WIFManager.detectNetwork()`
- `WIFManager.validateNetwork()`
- `WIFManager.validateChecksum()`
- `WIFManager.deriveFirstAddress()`
- `WIFManager.validateWIF()`
- `encryptWIF()`
- `decryptWIF()`
- `checkDuplicateWIF()`
- `enforceNetwork()`
- `extractPrivateKey()`

---

## CI/CD Integration

### Pre-Merge Gates

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage

- name: Fail if critical coverage below 100%
  run: |
    if ! grep -q "100" coverage/lcov-report/WIFManager.ts.html; then
      echo "WIFManager coverage below 100%"
      exit 1
    fi
```

### Tests to Run on Every Commit

- All unit tests (< 10 seconds)
- Security tests (< 5 seconds)
- Critical integration tests (< 10 seconds)

### Tests to Run Pre-Merge

- All unit tests
- All integration tests
- All security tests
- Component tests
- Coverage analysis

---

## Testing Workflow

### Step 1: Write Test Fixtures
```bash
# Create test data file
src/__tests__/fixtures/wifTestVectors.ts
```

### Step 2: Write Unit Tests
```bash
# Backend unit tests
src/background/wallet/__tests__/WIFManager.test.ts
src/background/wallet/__tests__/WIFEncryption.test.ts
```

### Step 3: Write Integration Tests
```bash
# Full flow tests
src/background/__tests__/privateKeyExport.integration.test.ts
src/background/__tests__/privateKeyImport.integration.test.ts
```

### Step 4: Write Security Tests
```bash
# Security verification
src/background/__tests__/privateKeySecurity.test.ts
```

### Step 5: Write Component Tests
```bash
# Frontend components
src/tab/components/__tests__/PasswordStrengthMeter.test.tsx
src/tab/components/__tests__/FileUploadArea.test.tsx
```

### Step 6: Run Coverage Analysis
```bash
npm run test:coverage
```

### Step 7: Review Coverage Report
```bash
open coverage/lcov-report/index.html
```

---

## Key Testing Principles

### 1. AAA Pattern (Arrange, Act, Assert)
```typescript
it('validates correct testnet WIF', () => {
  // Arrange
  const wif = VALID_TESTNET_WIF_COMPRESSED;

  // Act
  const result = WIFManager.validateWIF(wif, 'testnet');

  // Assert
  expect(result.valid).toBe(true);
});
```

### 2. Test Behavior, Not Implementation
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

### 3. Descriptive Test Names
```typescript
// ✅ Good: Clear and specific
it('rejects mainnet WIF when testnet required', () => { ... });

// ❌ Bad: Vague
it('validates WIF', () => { ... });
```

### 4. Test Edge Cases
```typescript
it('handles empty WIF string', () => { ... });
it('handles very long account name (100+ chars)', () => { ... });
it('handles unicode characters in password', () => { ... });
it('handles concurrent import operations', () => { ... });
```

---

## Performance Benchmarks

### Expected Test Execution Times

| Test Suite | Time Budget | Test Count |
|------------|-------------|------------|
| WIFManager Unit Tests | < 2 seconds | 20+ tests |
| Encryption Unit Tests | < 5 seconds | 15+ tests (PBKDF2 heavy) |
| Integration Tests | < 10 seconds | 30+ tests |
| Security Tests | < 5 seconds | 25+ tests |
| Component Tests | < 5 seconds | 30+ tests |
| **Total** | **< 30 seconds** | **150+ tests** |

### Encryption Performance Test
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

## Manual Testing Checklist

### Before Marking Feature Complete

- [ ] Export HD account (plaintext) → downloads .txt file
- [ ] Export HD account (encrypted) → downloads encrypted .txt file
- [ ] Export imported account (plaintext) → downloads .txt file
- [ ] Export imported account (encrypted) → downloads encrypted .txt file
- [ ] Import valid testnet WIF → account created successfully
- [ ] Import mainnet WIF → rejected with clear error
- [ ] Import duplicate WIF → rejected with account name shown
- [ ] Import corrupted WIF → rejected with error message
- [ ] Import with wrong password → decryption fails
- [ ] Validate WIF → shows address preview
- [ ] Validate invalid WIF → shows validation error
- [ ] Export when locked → error message shown
- [ ] Export multisig → error message shown
- [ ] Import 6 keys in 1 minute → 6th blocked by rate limit
- [ ] PDF export → generates valid PDF with QR code
- [ ] File upload via drag/drop → works correctly
- [ ] File upload via click → works correctly
- [ ] Password strength meter → updates correctly
- [ ] No WIF visible in DevTools DOM inspector
- [ ] No WIF in console logs (check Console tab)
- [ ] No WIF in network requests (check Network tab)

---

## Common Test Patterns

### Testing Async Operations
```typescript
it('handles async encryption', async () => {
  const result = await encryptWIF(wif, password);
  expect(result.encrypted).toBe(true);
});
```

### Testing Error Handling
```typescript
it('throws error for invalid input', async () => {
  await expect(
    handleImportPrivateKey({ wif: '', name: 'Test' })
  ).rejects.toThrow('empty');
});
```

### Testing Console Output
```typescript
it('does not log sensitive data', async () => {
  const spy = jest.spyOn(console, 'log');
  await handleExportPrivateKey({ accountIndex: 0 });

  expect(spy).not.toHaveBeenCalledWith(expect.stringMatching(/[c9][A-Za-z0-9]{51}/));
  spy.mockRestore();
});
```

### Testing React Components
```typescript
it('renders password strength meter', () => {
  render(<PasswordStrengthMeter password="Password123!" />);
  expect(screen.getByText('Strong')).toBeInTheDocument();
});
```

### Testing User Interactions
```typescript
it('handles file upload', async () => {
  render(<FileUploadArea onFileSelect={mockFn} />);

  const file = new File(['content'], 'test.txt', { type: 'text/plain' });
  const input = screen.getByLabelText(/upload/i);

  await userEvent.upload(input, file);

  expect(mockFn).toHaveBeenCalledWith(file);
});
```

---

## Test Utilities Location

```
src/__tests__/
├── fixtures/
│   ├── wifTestVectors.ts         # Sample WIF strings
│   ├── mockWallets.ts            # Mock wallet data
│   └── mockTransactions.ts       # Mock transaction data
│
├── utils/
│   ├── testHelpers.ts            # Common test functions
│   ├── mockFactories.ts          # Data factories
│   └── customMatchers.ts         # Custom Jest matchers
│
└── __mocks__/
    ├── chrome.ts                 # Chrome API mocks
    ├── jsPDF.ts                  # PDF library mock
    └── qrcode.ts                 # QR code library mock
```

---

## Success Metrics

### Pre-Release Checklist

- [ ] All 150+ tests passing
- [ ] 100% coverage on critical security code
- [ ] 90%+ overall feature coverage
- [ ] Test execution time < 30 seconds
- [ ] Zero console.log of sensitive data
- [ ] Zero flaky tests (10 consecutive runs pass)
- [ ] All security tests passing
- [ ] All integration tests passing
- [ ] Manual testing checklist complete
- [ ] Code review by security expert
- [ ] Documentation updated

---

## Quick Command Reference

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- WIFManager.test.ts

# Run tests in watch mode
npm run test:watch

# Run only security tests
npm test -- --testNamePattern="Security"

# Generate coverage report
npm run test:coverage && open coverage/lcov-report/index.html
```

---

**Complete Testing Strategy**: See `PRIVATE_KEY_EXPORT_IMPORT_TESTING_STRATEGY.md` for full details with complete test implementations.

**Document Status**: Ready for Implementation ✅
**Last Updated**: 2025-10-19
**Maintained By**: Testing Expert
