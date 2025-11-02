# Wallet Restore from Private Key - Testing Plan

**Version**: 1.0
**Date**: 2025-10-22
**Target Release**: v0.11.0
**Status**: Ready for Implementation
**Document Type**: Focused Testing Strategy

---

## Executive Summary

This document outlines a focused testing strategy for the "Import Private Key" wallet restoration feature. The plan covers 10 critical test scenarios, unit test requirements, integration test coverage, and test data preparation.

**Coverage Targets**:
- **New Code**: 90% minimum
- **Critical Paths**: 100% (WIF validation, encryption, signing)
- **Integration**: Full end-to-end flow coverage

**Test Suite Size**: ~60-80 tests total
- Unit tests: ~40 tests
- Integration tests: ~10 tests
- Manual test scenarios: 10 critical scenarios

---

## 1. Critical Test Scenarios (Top 10)

### Scenario 1: Import Plaintext WIF (Compressed, Native SegWit)

**Setup:**
- Testnet WIF: `cT1NR9q1V5Yqz9WzKUBbJ8UXFKPBm3Y5Y7bJRpUPZ4xQyYb7S3Yg` (example)
- Address type: Native SegWit
- Wallet password: `TestPassword123!`

**Steps:**
1. Open wallet setup screen
2. Select "Import Private Key" tab
3. Paste WIF into textarea
4. Select address type: "Native SegWit"
5. Enter wallet password
6. Click "Import Wallet"

**Expected:**
- ✅ WIF validation passes
- ✅ First address: `tb1q...` (testnet native segwit)
- ✅ Wallet created with `encryptedSeed = ''`
- ✅ Account has `importType: 'private-key'`
- ✅ Redirect to unlock screen

**Coverage:**
- Message handler: `CREATE_WALLET_FROM_PRIVATE_KEY`
- WIF validation
- Address generation
- Non-HD wallet structure

---

### Scenario 2: Import Encrypted WIF File

**Setup:**
- Encrypted WIF file from previous export
- File password: `FilePassword123!`
- Wallet password: `WalletPassword123!`

**Steps:**
1. Open wallet setup screen
2. Select "Import Private Key" tab
3. Choose "Upload File"
4. Select encrypted `.txt` file
5. System detects encryption, shows file password field
6. Enter file password
7. System decrypts and validates WIF
8. Enter wallet password
9. Click "Import Wallet"

**Expected:**
- ✅ File detected as encrypted
- ✅ Decryption succeeds with correct password
- ✅ WIF extracted and validated
- ✅ Wallet created successfully

**Coverage:**
- File upload handling
- Encryption detection
- AES-256-GCM decryption
- Encrypted import flow

---

### Scenario 3: Compressed vs Uncompressed Key Handling

**Setup:**
- Compressed WIF: `cT1NR9...` (starts with 'c')
- Uncompressed WIF: `92Pg46...` (starts with '9')

**Test Cases:**

**3A: Compressed Key - All Address Types**
- Import compressed WIF
- Try address types: Legacy, SegWit, Native SegWit
- All should work ✅

**3B: Uncompressed Key - Legacy Only**
- Import uncompressed WIF
- Try Native SegWit → Error ❌
- Try SegWit → Error ❌
- Try Legacy → Success ✅

**Expected:**
- Compressed keys: All 3 address types allowed
- Uncompressed keys: Legacy only (error for SegWit/Native SegWit)
- Clear error: `"Address type 'native-segwit' requires compressed key"`

**Coverage:**
- WIFManager.deriveAddress() validation
- Address type compatibility checking
- Error message clarity

---

### Scenario 4: Wrong Network Error

**Setup:**
- Mainnet WIF: `L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ`
- Testnet wallet

**Steps:**
1. Import mainnet WIF into testnet wallet
2. System detects network mismatch

**Expected:**
- ❌ Error: `"Wrong network: This is a mainnet key, testnet required"`
- Suggestion: `"Use a testnet private key (starts with 9 or c)"`
- Import blocked

**Coverage:**
- Network validation
- WIF prefix detection
- User-friendly error messages

---

### Scenario 5: Address Type Selection

**Setup:**
- Valid compressed testnet WIF

**Test Cases:**

**5A: Legacy Address**
- Select "Legacy (P2PKH)"
- Verify address starts with `m` or `n`

**5B: SegWit Address**
- Select "SegWit (P2SH-P2WPKH)"
- Verify address starts with `2`

**5C: Native SegWit Address**
- Select "Native SegWit (P2WPKH)"
- Verify address starts with `tb1q`

**Expected:**
- Correct address generated for each type
- User can verify address matches their backup
- Address type saved in account structure

**Coverage:**
- WIFManager.deriveAddress() for all types
- Address generation correctness
- User address selection flow

---

### Scenario 6: Rate Limiting

**Setup:**
- Clean browser state

**Steps:**
1. Attempt 1: Import invalid WIF → Error
2. Attempt 2: Import invalid WIF → Error
3. Attempt 3: Import invalid WIF → Error
4. Attempt 4: Import invalid WIF → Rate limit error

**Expected:**
- First 3 attempts: Validation error
- 4th attempt: `"Too many wallet creation attempts. Please wait 15 minutes."`
- After 15 minutes: Attempts reset ✅

**Coverage:**
- Rate limit enforcement
- Attack prevention
- User-friendly lockout message

---

### Scenario 7: Transaction Signing with Imported Key

**Setup:**
- Non-HD wallet imported from private key
- Testnet funds in account

**Steps:**
1. Unlock wallet
2. Navigate to Send screen
3. Enter recipient address
4. Enter amount
5. Click "Send"
6. Enter password to sign
7. Broadcast transaction

**Expected:**
- ✅ UTXO selection works
- ✅ Transaction built correctly
- ✅ Transaction signed with imported private key (not HD derivation)
- ✅ Transaction broadcast succeeds
- ✅ Change address reuses same address (privacy warning shown)

**Coverage:**
- `getPrivateKeyForSigning()` conditional logic
- Transaction signing for non-HD accounts
- Change address handling
- SEND_TRANSACTION handler for non-HD

---

### Scenario 8: Wallet Already Exists Error

**Setup:**
- Existing wallet already initialized

**Steps:**
1. Try to import private key during setup
2. System detects existing wallet

**Expected:**
- ❌ Error: `"Wallet already exists. Use Settings → Import Account to add private keys to existing wallet."`
- Redirect user to correct feature
- No wallet overwritten

**Coverage:**
- Wallet existence check
- Clear error messaging
- User guidance

---

### Scenario 9: Account Creation Restriction

**Setup:**
- Non-HD wallet (imported from private key)

**Steps:**
1. Unlock wallet
2. Navigate to Settings
3. Click "Create Account" button

**Expected:**
- ❌ Button disabled or shows error
- Error: `"Cannot create new accounts in non-HD wallet. This wallet does not have a seed phrase."`
- User education about non-HD limitations

**Coverage:**
- CREATE_ACCOUNT validation
- Non-HD wallet limitation enforcement
- UI button state management

---

### Scenario 10: Unlock After Service Worker Restart

**Setup:**
- Non-HD wallet created from private key
- Service worker terminated (Chrome extension unloaded)

**Steps:**
1. Create non-HD wallet
2. Lock wallet
3. Terminate service worker (chrome://serviceworker-internals)
4. Click extension icon
5. Enter password to unlock

**Expected:**
- ✅ Wallet structure loads correctly
- ✅ Imported key decrypted successfully
- ✅ Balance fetched
- ✅ Dashboard displays correctly
- ✅ No "missing seed" errors

**Coverage:**
- Wallet validation on unlock
- Non-HD wallet persistence
- Service worker lifecycle handling

---

## 2. Unit Test Requirements

### 2.1 Backend: WIFManager.deriveAddress()

**Test File**: `src/background/wallet/__tests__/WIFManager.test.ts`

**Test Cases** (~15 tests):

```typescript
describe('WIFManager.deriveAddress()', () => {
  describe('Validation', () => {
    it('should throw error for invalid WIF format');
    it('should throw error for wrong network');
    it('should throw error for uncompressed key with segwit address type');
    it('should throw error for uncompressed key with native-segwit address type');
  });

  describe('Legacy Address Generation', () => {
    it('should generate correct legacy address for compressed key');
    it('should generate correct legacy address for uncompressed key');
    it('should generate testnet legacy address (starts with m or n)');
  });

  describe('SegWit Address Generation', () => {
    it('should generate correct segwit address for compressed key');
    it('should generate testnet segwit address (starts with 2)');
    it('should throw error for uncompressed key with segwit type');
  });

  describe('Native SegWit Address Generation', () => {
    it('should generate correct native-segwit address for compressed key');
    it('should generate testnet native-segwit address (starts with tb1q)');
    it('should throw error for uncompressed key with native-segwit type');
  });

  describe('Address Consistency', () => {
    it('should generate same address for same WIF and type');
    it('should generate different addresses for different types');
  });
});
```

**Coverage Target**: 100% (critical path)

---

### 2.2 Backend: CREATE_WALLET_FROM_PRIVATE_KEY Handler

**Test File**: `src/background/__tests__/CreateWalletFromPrivateKey.test.ts`

**Test Cases** (~20 tests):

```typescript
describe('CREATE_WALLET_FROM_PRIVATE_KEY', () => {
  describe('Input Validation', () => {
    it('should reject invalid WIF format');
    it('should reject mainnet WIF on testnet wallet');
    it('should reject testnet WIF on mainnet wallet');
    it('should reject weak password');
    it('should reject incompatible address type for uncompressed key');
    it('should reject if wallet already exists');
  });

  describe('Non-HD Wallet Creation', () => {
    it('should create wallet with encryptedSeed = ""');
    it('should create wallet with single account');
    it('should mark account as importType: "private-key"');
    it('should store encrypted WIF in importedKeys[0]');
    it('should set correct address type');
    it('should generate correct first address');
  });

  describe('Encryption', () => {
    it('should encrypt WIF with AES-256-GCM');
    it('should use separate salt/IV for imported key');
    it('should be able to decrypt WIF with correct password');
    it('should fail to decrypt with wrong password');
  });

  describe('Rate Limiting', () => {
    it('should allow 3 attempts within 15 minutes');
    it('should block 4th attempt within 15 minutes');
    it('should reset after 15 minutes');
    it('should show correct wait time in error message');
  });

  describe('Success Cases', () => {
    it('should return firstAddress in response');
    it('should return addressType in response');
    it('should return network in response');
  });
});
```

**Coverage Target**: 95% minimum

---

### 2.3 Backend: Wallet Validation

**Test File**: `src/background/__tests__/WalletValidation.test.ts`

**Test Cases** (~10 tests):

```typescript
describe('validateWalletStructure()', () => {
  describe('Non-HD Wallet Validation', () => {
    it('should pass for valid non-HD wallet');
    it('should fail if encryptedSeed empty but no importedKeys');
    it('should fail if encryptedSeed empty but accounts not marked as imported');
    it('should fail if imported key missing for account index');
  });

  describe('HD Wallet Validation', () => {
    it('should pass for valid HD wallet');
    it('should fail if encryptedSeed too short');
  });

  describe('Common Validation', () => {
    it('should fail if version != 2');
    it('should fail if missing salt or IV');
    it('should fail if missing settings');
  });
});
```

**Coverage Target**: 100% (critical path)

---

### 2.4 Backend: Transaction Signing (Non-HD)

**Test File**: `src/background/__tests__/NonHDTransactionSigning.test.ts`

**Test Cases** (~8 tests):

```typescript
describe('getPrivateKeyForSigning() - Non-HD', () => {
  it('should retrieve imported private key for non-HD account');
  it('should decrypt WIF with correct password');
  it('should throw error if imported key not found');
  it('should throw error for wrong password');
  it('should clear WIF from memory after decryption');
});

describe('Transaction Signing with Imported Key', () => {
  it('should sign transaction with imported private key');
  it('should handle multiple UTXOs on same address');
  it('should reuse same address for change output');
});
```

**Coverage Target**: 95% minimum

---

### 2.5 Frontend: Main Components

**Test File**: `src/tab/components/AccountManagement/__tests__/PrivateKeyImport.test.tsx`

**Test Cases** (~12 tests):

```typescript
describe('PrivateKeyImport', () => {
  describe('Rendering', () => {
    it('should render import method selector (file vs paste)');
    it('should render WIF textarea when paste selected');
    it('should render file upload when file selected');
    it('should render wallet password fields');
    it('should render submit button (disabled until valid)');
  });

  describe('WIF Validation', () => {
    it('should validate WIF on paste');
    it('should show validation success for valid WIF');
    it('should show validation error for invalid WIF');
    it('should show network info after validation');
  });

  describe('Address Type Selection', () => {
    it('should show all 3 types for compressed key');
    it('should show only legacy for uncompressed key');
    it('should update preview when address type changes');
  });

  describe('Form Submission', () => {
    it('should call CREATE_WALLET_FROM_PRIVATE_KEY on submit');
    it('should redirect to unlock screen on success');
    it('should show error message on failure');
  });
});
```

**Coverage Target**: 85% minimum

---

## 3. Integration Tests

### 3.1 End-to-End Wallet Restore Flow

**Test File**: `src/__tests__/integration/WalletRestoreFlow.test.ts`

**Test Cases** (~5 tests):

```typescript
describe('Wallet Restore from Private Key - E2E', () => {
  it('should complete full import flow: WIF → Create → Unlock → Dashboard', async () => {
    // 1. Import plaintext WIF
    // 2. Create wallet with password
    // 3. Unlock wallet
    // 4. Verify dashboard shows account
    // 5. Verify balance fetched
  });

  it('should complete encrypted WIF import flow', async () => {
    // 1. Create encrypted WIF export
    // 2. Upload encrypted file
    // 3. Enter file password
    // 4. Create wallet
    // 5. Unlock and verify
  });

  it('should handle address type selection correctly', async () => {
    // 1. Import compressed WIF
    // 2. Try all 3 address types
    // 3. Verify correct addresses generated
  });

  it('should prevent account creation in non-HD wallet', async () => {
    // 1. Create non-HD wallet
    // 2. Attempt to create account
    // 3. Verify error
  });

  it('should persist wallet across service worker restarts', async () => {
    // 1. Create non-HD wallet
    // 2. Lock wallet
    // 3. Simulate service worker restart
    // 4. Unlock wallet
    // 5. Verify state restored
  });
});
```

**Coverage Target**: 100% of critical user flows

---

### 3.2 Transaction Signing Integration

**Test File**: `src/__tests__/integration/NonHDTransactionFlow.test.ts`

**Test Cases** (~5 tests):

```typescript
describe('Non-HD Wallet - Transaction Flow', () => {
  it('should send transaction from imported account', async () => {
    // 1. Create non-HD wallet with funded address
    // 2. Build transaction
    // 3. Sign with imported key
    // 4. Broadcast transaction
    // 5. Verify transaction on blockchain
  });

  it('should reuse same address for change', async () => {
    // 1. Send transaction from non-HD account
    // 2. Verify change output uses same address
  });

  it('should handle multiple UTXOs on same address', async () => {
    // 1. Account has 3 UTXOs on same address
    // 2. Build transaction using all UTXOs
    // 3. Sign all inputs with same key
    // 4. Verify transaction valid
  });

  it('should fetch balance correctly for non-HD account', async () => {
    // 1. Create non-HD wallet
    // 2. Fetch UTXOs from Blockstream API
    // 3. Verify balance calculated correctly
  });

  it('should display transaction history correctly', async () => {
    // 1. Non-HD account with transactions
    // 2. Fetch transaction history
    // 3. Verify all transactions displayed
  });
});
```

**Coverage Target**: 100% of transaction flows

---

## 4. Test Coverage Targets

### 4.1 Coverage by Module

| Module | File | Target | Critical |
|--------|------|--------|----------|
| **Message Handler** | `background/index.ts` (CREATE_WALLET_FROM_PRIVATE_KEY) | 95% | ✅ Yes |
| **WIF Manager** | `background/wallet/WIFManager.ts` (deriveAddress) | 100% | ✅ Yes |
| **Validation** | `background/index.ts` (validateWalletStructure) | 100% | ✅ Yes |
| **Signing** | `background/index.ts` (getPrivateKeyForSigning) | 95% | ✅ Yes |
| **Rate Limiting** | `background/index.ts` (checkWalletCreationRateLimit) | 90% | No |
| **Frontend** | `tab/components/AccountManagement/PrivateKeyImport.tsx` | 85% | No |

### 4.2 Critical Path Coverage

**MUST be 100%**:
- WIF validation (format, network, checksum)
- Encryption/decryption of imported keys
- Transaction signing with imported keys
- Wallet structure validation
- Network mismatch detection
- Address type compatibility validation

### 4.3 Overall Target

**New Code Coverage**: **90% minimum**
- Unit tests: 85%
- Integration tests: 95%
- Critical paths: 100%

---

## 5. Test Data

### 5.1 Sample Testnet WIF Keys

**Compressed Keys** (can use all 3 address types):

```
# Testnet Compressed WIF #1
WIF: cT1NR9q1V5Yqz9WzKUBbJ8UXFKPBm3Y5Y7bJRpUPZ4xQyYb7S3Yg
Expected Addresses:
  Legacy: mhEi9gQNjVzJT3h7YqBPNRZN4V4WUvfPgK
  SegWit: 2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF
  Native SegWit: tb1q3cdwq0z4mhqt5s5t9qykzu58kkp35hnqv2y0gr

# Testnet Compressed WIF #2
WIF: cU8Q2jGeX3GNKNa5etiC8mgEgFSeVUTRQfWE2ZCzszyqYNK4Mepy
Expected Addresses:
  Legacy: n1LKejAadN6hg2FrBXoU1KrwX4uK16mco9
  SegWit: 2NBdpFKnxnTvVd5RG3bNFWNp4fVBGSR8kFM
  Native SegWit: tb1qew9dp4aq9t8wzn6jwg4v9qdmt7zzn57g8v9v4k
```

**Uncompressed Keys** (legacy addresses only):

```
# Testnet Uncompressed WIF #1
WIF: 92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc
Expected Address:
  Legacy: mhDR7X2bLqQjL9FLx5zvscuUvKUd8Y7yL6
  SegWit: ERROR (incompatible)
  Native SegWit: ERROR (incompatible)
```

### 5.2 Encrypted WIF File Format

**Example encrypted export file**:

```
Bitcoin Account Private Key (Encrypted)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Account: Savings
Address Type: Native SegWit
First Address: tb1q3cdwq0z4mhqt5s5t9qykzu58kkp35hnqv2y0gr
Exported: 2025-10-22 14:30:00 UTC

WARNING: This file contains your encrypted private key.
Keep it secure and never share it with anyone.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Encrypted Private Key: U2FsdGVkX1+EWif3Q7xC9pZqL8fH...
Salt: 4d3c2b1a0f9e8d7c6b5a4e3d2c1b0a9f8e7d6c5b4a3e2d1c0b9a8f7e6d5c4b3
IV: 7e6d5c4b3a2e1d0c9b8a7f6e5d4c3b2a

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To restore this account:
1. Import this file during wallet setup
2. Enter the file password you created during export
3. Set a new wallet password
4. Your account will be restored
```

**Encryption parameters for testing**:
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 (100,000 iterations)
- File password: `FilePassword123!`

### 5.3 Test Vectors

**BIP Test Vector for Address Generation**:

```typescript
// Test vector from BIP32
const TEST_VECTOR = {
  seed: '000102030405060708090a0b0c0d0e0f',
  wif: 'cT1NR9q1V5Yqz9WzKUBbJ8UXFKPBm3Y5Y7bJRpUPZ4xQyYb7S3Yg',
  compressed: true,
  network: 'testnet',
  addresses: {
    legacy: 'mhEi9gQNjVzJT3h7YqBPNRZN4V4WUvfPgK',
    segwit: '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
    nativeSegwit: 'tb1q3cdwq0z4mhqt5s5t9qykzu58kkp35hnqv2y0gr',
  },
};
```

---

## 6. Testing Workflow

### 6.1 Development Testing

**During Implementation**:

```bash
# Run tests in watch mode
npm test -- --watch WIFManager.test.ts

# Run specific test suite
npm test -- CreateWalletFromPrivateKey.test.ts

# Run all unit tests
npm test

# Run with coverage
npm test -- --coverage
```

**Coverage Check**:
```bash
# Generate coverage report
npm test -- --coverage --collectCoverageFrom='src/background/**/*.ts'

# View coverage report
open coverage/lcov-report/index.html
```

### 6.2 Pre-Commit Testing

**Checklist before committing**:

- [ ] All unit tests pass
- [ ] Coverage targets met (90% minimum)
- [ ] Integration tests pass
- [ ] No TypeScript errors
- [ ] No console errors/warnings
- [ ] Manual smoke test on 2+ scenarios

### 6.3 Pre-Release Testing

**QA Checklist**:

- [ ] All 10 critical scenarios tested manually on testnet
- [ ] All unit tests passing (100%)
- [ ] All integration tests passing (100%)
- [ ] Coverage report generated and reviewed
- [ ] Security checklist complete
- [ ] Documentation updated

---

## 7. Test Execution Estimates

### 7.1 Time Estimates

**Unit Test Development**: 2 days
- WIFManager tests: 4 hours
- Message handler tests: 6 hours
- Validation tests: 2 hours
- Signing tests: 4 hours
- Frontend tests: 4 hours

**Integration Test Development**: 1 day
- E2E flow tests: 4 hours
- Transaction flow tests: 4 hours

**Manual Testing**: 1 day
- 10 critical scenarios: 6 hours
- Exploratory testing: 2 hours

**Total**: 4 days (including buffer)

### 7.2 Test Execution Time

**Unit Tests**: ~2 seconds
**Integration Tests**: ~10 seconds
**Manual Tests**: ~2 hours

---

## 8. Success Criteria

### 8.1 Test Suite Metrics

**All tests must meet these criteria**:

- [ ] **Zero test failures** (100% pass rate)
- [ ] **Coverage ≥ 90%** for all new code
- [ ] **Coverage = 100%** for critical paths
- [ ] **Execution time < 15 seconds** for unit tests
- [ ] **No flaky tests** (100% reproducible)
- [ ] **No console errors** during test runs

### 8.2 Manual Testing Metrics

**All scenarios must pass**:

- [ ] **10/10 critical scenarios** pass on testnet
- [ ] **Zero P0/P1 bugs** found
- [ ] **All error messages** are clear and actionable
- [ ] **Performance** meets targets (<5s import time)

### 8.3 Documentation Metrics

**Documentation complete**:

- [ ] Test plan reviewed and approved
- [ ] Test coverage report generated
- [ ] Known issues documented
- [ ] Testing expert notes updated

---

## 9. Risk Mitigation

### 9.1 Testing Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **Flaky tests due to async operations** | Medium | Use proper async/await, increase timeouts if needed |
| **Insufficient test coverage** | Low | Set strict coverage thresholds in CI |
| **Test data becomes stale** | Low | Use BIP test vectors, document test key sources |
| **Integration tests fail in CI** | Medium | Mock external APIs, use deterministic test data |
| **Manual testing incomplete** | Medium | Clear checklist, assign QA owner |

### 9.2 Mitigation Actions

**Action 1**: Set up coverage thresholds in Jest config
```javascript
// jest.config.js
coverageThreshold: {
  'src/background/index.ts': {
    lines: 90,
    functions: 90,
    branches: 85,
  },
  'src/background/wallet/WIFManager.ts': {
    lines: 100,
    functions: 100,
    branches: 100,
  },
}
```

**Action 2**: Add pre-commit hook for tests
```bash
# .husky/pre-commit
npm test -- --coverage --passWithNoTests
```

---

## 10. Post-Testing Activities

### 10.1 Test Report

**After all tests complete, generate report**:

```markdown
# Wallet Restore Testing Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Version**: v0.11.0

## Summary
- Total Tests: X
- Passing: X (100%)
- Failing: 0
- Coverage: X% (target: 90%)

## Critical Scenarios
- [x] Scenario 1: Import Plaintext WIF - PASS
- [x] Scenario 2: Import Encrypted WIF - PASS
- [x] Scenario 3: Compressed vs Uncompressed - PASS
...

## Issues Found
None / [List any issues]

## Recommendations
- [Any recommendations for future testing]

## Approval
Ready for release: YES/NO
Blocker issues: NONE/[List]
```

### 10.2 Documentation Updates

**Update these files**:

- [ ] `prompts/docs/experts/testing/_INDEX.md` - Add test summary
- [ ] `prompts/docs/experts/testing/unit-tests.md` - Document new test patterns
- [ ] `prompts/docs/experts/testing/integration.md` - Document E2E tests
- [ ] `CHANGELOG.md` - Add testing notes to release

---

## Appendix A: Quick Reference Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- WIFManager.test.ts

# Run in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage --collectCoverageFrom='src/background/**/*.ts'

# View HTML coverage report
open coverage/lcov-report/index.html

# Run integration tests only
npm test -- --testPathPattern=integration

# Run unit tests only
npm test -- --testPathPattern=__tests__

# Type checking
npm run type-check

# Lint
npm run lint
```

---

## Appendix B: Test Checklist

### Pre-Development
- [ ] Read PRD and Backend Plan
- [ ] Understand acceptance criteria
- [ ] Identify critical paths
- [ ] Set up test data

### During Development
- [ ] Write tests alongside implementation
- [ ] Run tests frequently in watch mode
- [ ] Maintain ≥90% coverage
- [ ] Document test patterns

### Pre-Commit
- [ ] All tests passing
- [ ] Coverage targets met
- [ ] No TypeScript errors
- [ ] Manual smoke test

### Pre-Release
- [ ] All 10 critical scenarios tested
- [ ] Integration tests pass
- [ ] Security checklist complete
- [ ] Test report generated

---

**Document Version**: 1.0
**Status**: ✅ Ready for Implementation
**Test Suite Size**: ~60-80 tests
**Expected Duration**: 4 days

---

**END OF TESTING PLAN**
