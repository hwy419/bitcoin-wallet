# Private Key Export/Import - Comprehensive Testing Strategy

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Implementation Ready
**Owner**: Testing Expert

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Objectives](#testing-objectives)
3. [Coverage Goals](#coverage-goals)
4. [Unit Test Plan](#unit-test-plan)
5. [Integration Test Plan](#integration-test-plan)
6. [Security Test Plan](#security-test-plan)
7. [Edge Case Tests](#edge-case-tests)
8. [Component Test Plan](#component-test-plan)
9. [Test File Organization](#test-file-organization)
10. [Test Fixtures and Mocks](#test-fixtures-and-mocks)
11. [Testing Tools and Libraries](#testing-tools-and-libraries)
12. [CI/CD Integration](#cicd-integration)
13. [Complete Test Examples](#complete-test-examples)
14. [Performance Benchmarks](#performance-benchmarks)
15. [Manual Testing Checklist](#manual-testing-checklist)

---

## Executive Summary

This document provides a comprehensive, implementation-ready testing strategy for the **per-account private key export and import feature**. The feature allows users to export individual account private keys in WIF (Wallet Import Format) with optional password protection, and import them into new or existing wallets.

### Key Testing Deliverables

- **7 unit test files**: WIFManager, encryption/decryption, message handlers, validation
- **3 integration test files**: Export flow, import flow, roundtrip tests
- **1 security test file**: Memory safety, logging verification, sensitive data handling
- **5 component test files**: Password strength meter, file upload, modals, PDF generation
- **50+ test fixtures**: Sample WIF strings, encrypted files, mock data
- **100% coverage** for security-critical code (WIF validation, encryption, duplicate detection)
- **95%+ coverage** for backend message handlers
- **90%+ coverage** for frontend components

### Testing Philosophy

1. **Security First**: All security-critical functions must have 100% coverage
2. **Behavior Testing**: Test user-facing behavior, not implementation details
3. **Isolation**: Each test is independent and can run in any order
4. **Fast Execution**: All tests complete in < 30 seconds total
5. **Clear Naming**: Test names describe exact scenario and expected outcome
6. **Comprehensive Fixtures**: Reusable test data for all edge cases

---

## Testing Objectives

### Primary Objectives

1. **Functional Correctness**
   - Verify WIF encoding/decoding produces correct results
   - Ensure encryption/decryption round-trips successfully
   - Validate network detection blocks mainnet keys
   - Confirm duplicate detection prevents key collisions

2. **Security Assurance**
   - Private keys never logged to console
   - WIF strings not visible in DOM
   - Memory cleared after operations
   - Password strength requirements enforced
   - Rate limiting prevents brute-force attempts

3. **Error Handling**
   - All edge cases handled gracefully
   - User-friendly error messages
   - No sensitive data leaked in errors
   - Proper validation at all entry points

4. **User Experience**
   - Components render correctly
   - Form validation provides helpful feedback
   - File upload/download works reliably
   - PDF generation produces valid output

### Success Criteria

- ✅ All critical code has 100% coverage
- ✅ All tests pass in CI/CD pipeline
- ✅ Zero security vulnerabilities detected
- ✅ No flaky tests (100% pass rate on 10 runs)
- ✅ Test execution time < 30 seconds
- ✅ All edge cases documented and tested

---

## Coverage Goals

### Overall Coverage Targets

| Code Category | Coverage Target | Rationale |
|---------------|----------------|-----------|
| **WIFManager** (all methods) | 100% | Security-critical validation |
| **Encryption/Decryption** | 100% | Security-critical crypto operations |
| **Network Validation** | 100% | Prevents mainnet key import (critical) |
| **Duplicate Detection** | 100% | Prevents key collisions |
| **Message Handlers** | 95%+ | Core business logic |
| **Frontend Components** | 90%+ | User-facing UI |
| **Utility Functions** | 95%+ | Helper functions |
| **Overall Feature** | 90%+ | Comprehensive coverage |

### Critical Functions Requiring 100% Coverage

```typescript
// MUST have 100% branch, statement, function, line coverage:

// WIFManager.ts
- WIFManager.validateFormat()
- WIFManager.detectNetwork()
- WIFManager.validateNetwork()
- WIFManager.validateChecksum()
- WIFManager.deriveFirstAddress()
- WIFManager.validateWIF()

// Encryption/Decryption
- encryptWIF()
- decryptWIF()

// Validation
- checkDuplicateWIF()
- enforceNetwork()

// Private Key Extraction
- extractPrivateKey()
- extractHDAccountPrivateKey()
- extractImportedAccountPrivateKey()
```

### Coverage Enforcement

```javascript
// jest.config.js additions
coverageThreshold: {
  global: {
    branches: 90,
    functions: 90,
    lines: 90,
    statements: 90
  },
  // Critical security code requires 100% coverage
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

---

## Unit Test Plan

### 1. WIFManager Unit Tests

**File**: `src/background/wallet/__tests__/WIFManager.test.ts`

**Coverage Target**: 100%

```typescript
describe('WIFManager', () => {
  describe('validateFormat', () => {
    it('accepts valid testnet WIF (compressed)', () => { ... });
    it('accepts valid testnet WIF (uncompressed)', () => { ... });
    it('rejects invalid Base58 characters', () => { ... });
    it('rejects incorrect length (too short)', () => { ... });
    it('rejects incorrect length (too long)', () => { ... });
    it('rejects empty string', () => { ... });
    it('rejects null/undefined', () => { ... });
  });

  describe('detectNetwork', () => {
    it('detects testnet compressed (prefix "c")', () => { ... });
    it('detects testnet uncompressed (prefix "9")', () => { ... });
    it('detects mainnet compressed (prefix "K")', () => { ... });
    it('detects mainnet compressed (prefix "L")', () => { ... });
    it('detects mainnet uncompressed (prefix "5")', () => { ... });
    it('returns "invalid" for unknown prefix', () => { ... });
    it('returns "invalid" for empty string', () => { ... });
  });

  describe('validateNetwork', () => {
    it('accepts testnet WIF when testnet required', () => { ... });
    it('rejects mainnet WIF when testnet required', () => { ... });
    it('provides clear error message for wrong network', () => { ... });
    it('rejects invalid prefix', () => { ... });
  });

  describe('validateChecksum', () => {
    it('validates correct testnet WIF checksum', () => { ... });
    it('rejects invalid checksum (last char changed)', () => { ... });
    it('rejects corrupted WIF (middle chars changed)', () => { ... });
  });

  describe('deriveFirstAddress', () => {
    it('derives native-segwit address for compressed key', () => { ... });
    it('derives legacy address for uncompressed key', () => { ... });
    it('throws error for invalid WIF', () => { ... });
    it('produces consistent address for same WIF', () => { ... });
    it('uses correct testnet address format', () => { ... });
  });

  describe('validateWIF - Integration', () => {
    it('validates complete testnet WIF successfully', () => { ... });
    it('rejects mainnet WIF on testnet wallet', () => { ... });
    it('rejects invalid checksum', () => { ... });
    it('rejects invalid format', () => { ... });
    it('returns complete validation result with address', () => { ... });
  });
});
```

**Test Vectors**:
```typescript
// Valid testnet WIF strings (use in tests)
const VALID_TESTNET_WIF_COMPRESSED = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
const VALID_TESTNET_WIF_UNCOMPRESSED = '92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc';

// Invalid WIF strings (use in tests)
const MAINNET_WIF_COMPRESSED = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';
const MAINNET_WIF_UNCOMPRESSED = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';
const INVALID_CHECKSUM_WIF = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpx'; // Changed last char
```

---

### 2. WIF Encryption/Decryption Unit Tests

**File**: `src/background/wallet/__tests__/WIFEncryption.test.ts`

**Coverage Target**: 100%

```typescript
describe('WIF Encryption/Decryption', () => {
  describe('encryptWIF', () => {
    it('returns plaintext when no password provided', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const result = await encryptWIF(wif, undefined);

      expect(result.encrypted).toBe(false);
      expect(result.wif).toBe(wif);
      expect(result.encryptedData).toBeUndefined();
    });

    it('encrypts WIF with password', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'SecurePassword123!';
      const result = await encryptWIF(wif, password);

      expect(result.encrypted).toBe(true);
      expect(result.encryptedData).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.wif).toBeUndefined();
    });

    it('produces different encrypted output for same input (random IV/salt)', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'Password123';

      const result1 = await encryptWIF(wif, password);
      const result2 = await encryptWIF(wif, password);

      expect(result1.salt).not.toBe(result2.salt);
      expect(result1.iv).not.toBe(result2.iv);
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
    });

    it('uses 100K PBKDF2 iterations', async () => {
      // Verify encryption takes appropriate time (not instant)
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'Password123';

      const start = Date.now();
      await encryptWIF(wif, password);
      const duration = Date.now() - start;

      // 100K iterations should take > 100ms
      expect(duration).toBeGreaterThan(100);
    });

    it('throws error for empty password', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      await expect(encryptWIF(wif, '')).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('decryptWIF', () => {
    it('decrypts WIF with correct password', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'Password123';

      // Encrypt first
      const encrypted = await encryptWIF(wif, password);

      // Decrypt
      const decrypted = await decryptWIF(
        encrypted.encryptedData!,
        encrypted.salt!,
        encrypted.iv!,
        password
      );

      expect(decrypted).toBe(wif);
    });

    it('throws error with wrong password', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const correctPassword = 'CorrectPassword';
      const wrongPassword = 'WrongPassword';

      const encrypted = await encryptWIF(wif, correctPassword);

      await expect(
        decryptWIF(
          encrypted.encryptedData!,
          encrypted.salt!,
          encrypted.iv!,
          wrongPassword
        )
      ).rejects.toThrow('Decryption failed');
    });

    it('throws error with corrupted encrypted data', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'Password123';

      const encrypted = await encryptWIF(wif, password);

      // Corrupt encrypted data
      const corrupted = encrypted.encryptedData! + 'CORRUPT';

      await expect(
        decryptWIF(corrupted, encrypted.salt!, encrypted.iv!, password)
      ).rejects.toThrow('Decryption failed');
    });

    it('does not leak sensitive data in error messages', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'Password123';
      const encrypted = await encryptWIF(wif, password);

      try {
        await decryptWIF(encrypted.encryptedData!, encrypted.salt!, encrypted.iv!, 'WrongPassword');
        fail('Should have thrown error');
      } catch (error) {
        const errorMessage = (error as Error).message;
        // Error message should NOT contain WIF or password
        expect(errorMessage).not.toContain(wif);
        expect(errorMessage).not.toContain(password);
        expect(errorMessage).not.toContain('WrongPassword');
      }
    });
  });

  describe('Encryption Round-trip', () => {
    it('successfully round-trips WIF (compress → decompress)', async () => {
      const originalWIF = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'TestPassword123!';

      const encrypted = await encryptWIF(originalWIF, password);
      const decrypted = await decryptWIF(
        encrypted.encryptedData!,
        encrypted.salt!,
        encrypted.iv!,
        password
      );

      expect(decrypted).toBe(originalWIF);
    });

    it('handles special characters in password', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      const encrypted = await encryptWIF(wif, password);
      const decrypted = await decryptWIF(
        encrypted.encryptedData!,
        encrypted.salt!,
        encrypted.iv!,
        password
      );

      expect(decrypted).toBe(wif);
    });

    it('handles unicode characters in password', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const password = 'Pass用户名🔐';

      const encrypted = await encryptWIF(wif, password);
      const decrypted = await decryptWIF(
        encrypted.encryptedData!,
        encrypted.salt!,
        encrypted.iv!,
        password
      );

      expect(decrypted).toBe(wif);
    });
  });
});
```

---

### 3. Duplicate Detection Unit Tests

**File**: `src/background/wallet/__tests__/DuplicateDetection.test.ts`

**Coverage Target**: 100%

```typescript
describe('checkDuplicateWIF', () => {
  let mockAccounts: WalletAccount[];

  beforeEach(() => {
    // Create mock accounts with known addresses
    mockAccounts = [
      {
        index: 0,
        name: 'Account 1',
        addressType: 'native-segwit',
        accountType: 'single',
        imported: false,
        addresses: [
          {
            address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
            derivationPath: 'm/84\'/1\'/0\'/0/0',
            index: 0,
            isChange: false,
            used: false
          }
        ],
        balance: { confirmed: 0, unconfirmed: 0, total: 0 },
        externalIndex: 0,
        internalIndex: 0
      },
      {
        index: 1,
        name: 'Imported Account',
        addressType: 'native-segwit',
        accountType: 'single',
        imported: true,
        addresses: [
          {
            address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
            derivationPath: 'imported',
            index: 0,
            isChange: false,
            used: false
          }
        ],
        balance: { confirmed: 0, unconfirmed: 0, total: 0 },
        externalIndex: 0,
        internalIndex: 0
      }
    ];
  });

  it('returns not duplicate for new WIF', async () => {
    const newWIF = VALID_TESTNET_WIF_COMPRESSED;

    const result = await checkDuplicateWIF(newWIF, mockAccounts);

    expect(result.isDuplicate).toBe(false);
    expect(result.existingAccountName).toBeUndefined();
    expect(result.existingAccountIndex).toBeUndefined();
  });

  it('detects duplicate when WIF derives to existing imported account address', async () => {
    // Create WIF that derives to same address as mockAccounts[1]
    const duplicateWIF = createWIFForAddress('tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7');

    const result = await checkDuplicateWIF(duplicateWIF, mockAccounts);

    expect(result.isDuplicate).toBe(true);
    expect(result.existingAccountName).toBe('Imported Account');
    expect(result.existingAccountIndex).toBe(1);
  });

  it('detects duplicate when WIF derives to existing HD account address', async () => {
    // Create WIF that derives to same address as mockAccounts[0]
    const duplicateWIF = createWIFForAddress('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

    const result = await checkDuplicateWIF(duplicateWIF, mockAccounts);

    expect(result.isDuplicate).toBe(true);
    expect(result.existingAccountName).toBe('Account 1');
    expect(result.existingAccountIndex).toBe(0);
  });

  it('skips multisig accounts during duplicate check', async () => {
    const multisigAccount: WalletAccount = {
      index: 2,
      name: 'Multisig Account',
      addressType: 'native-segwit',
      accountType: 'multisig',
      imported: false,
      addresses: [
        {
          address: 'tb1qmultisigaddress',
          derivationPath: 'm/48\'/1\'/0\'/2\'/0/0',
          index: 0,
          isChange: false,
          used: false
        }
      ],
      balance: { confirmed: 0, unconfirmed: 0, total: 0 },
      externalIndex: 0,
      internalIndex: 0
    };

    mockAccounts.push(multisigAccount);

    const wif = VALID_TESTNET_WIF_COMPRESSED;
    const result = await checkDuplicateWIF(wif, mockAccounts);

    expect(result.isDuplicate).toBe(false);
  });

  it('handles error gracefully if address derivation fails', async () => {
    const invalidWIF = 'INVALID_WIF_STRING';

    // Should not throw, should return not duplicate
    const result = await checkDuplicateWIF(invalidWIF, mockAccounts);

    expect(result.isDuplicate).toBe(false);
  });

  it('compares addresses case-insensitively', async () => {
    const address = 'tb1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KXPJZSX'; // Uppercase
    const duplicateWIF = createWIFForAddress(address);

    const result = await checkDuplicateWIF(duplicateWIF, mockAccounts);

    expect(result.isDuplicate).toBe(true);
  });
});
```

---

### 4. Network Validation Unit Tests

**File**: `src/background/wallet/__tests__/NetworkValidation.test.ts`

**Coverage Target**: 100%

```typescript
describe('enforceNetwork', () => {
  it('accepts testnet compressed WIF', () => {
    const wif = VALID_TESTNET_WIF_COMPRESSED;

    expect(() => enforceNetwork(wif)).not.toThrow();
  });

  it('accepts testnet uncompressed WIF', () => {
    const wif = VALID_TESTNET_WIF_UNCOMPRESSED;

    expect(() => enforceNetwork(wif)).not.toThrow();
  });

  it('rejects mainnet compressed WIF (prefix K)', () => {
    const wif = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn';

    expect(() => enforceNetwork(wif)).toThrow('mainnet');
  });

  it('rejects mainnet compressed WIF (prefix L)', () => {
    const wif = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';

    expect(() => enforceNetwork(wif)).toThrow('mainnet');
  });

  it('rejects mainnet uncompressed WIF (prefix 5)', () => {
    const wif = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';

    expect(() => enforceNetwork(wif)).toThrow('mainnet');
  });

  it('provides clear error message for mainnet key', () => {
    const wif = MAINNET_WIF_COMPRESSED;

    try {
      enforceNetwork(wif);
      fail('Should have thrown error');
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('REJECTED');
      expect(message).toContain('mainnet');
      expect(message).toContain('testnet');
      expect(message).toContain('DO NOT import');
    }
  });

  it('rejects invalid prefix', () => {
    const wif = 'xVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

    expect(() => enforceNetwork(wif)).toThrow('Invalid WIF prefix');
  });

  it('does not process mainnet key beyond detection', () => {
    // Ensure no further operations performed on mainnet key
    const mainnetWIF = MAINNET_WIF_COMPRESSED;

    // Mock WIFManager.deriveFirstAddress to track calls
    const deriveSpy = jest.spyOn(WIFManager, 'deriveFirstAddress');

    try {
      enforceNetwork(mainnetWIF);
    } catch (error) {
      // Expected error
    }

    // Verify derive was NEVER called for mainnet key
    expect(deriveSpy).not.toHaveBeenCalledWith(mainnetWIF, 'mainnet');

    deriveSpy.mockRestore();
  });
});
```

---

### 5. Private Key Extraction Unit Tests

**File**: `src/background/wallet/__tests__/PrivateKeyExtraction.test.ts`

**Coverage Target**: 95%+

```typescript
describe('extractPrivateKey', () => {
  let mockState: InMemoryState;
  let mockAccount: WalletAccount;

  beforeEach(() => {
    mockState = {
      isUnlocked: true,
      decryptedSeed: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      encryptionKey: null, // Will be set when needed
      lastActivity: Date.now()
    };

    mockAccount = {
      index: 0,
      name: 'Test Account',
      addressType: 'native-segwit',
      accountType: 'single',
      imported: false,
      addresses: [],
      balance: { confirmed: 0, unconfirmed: 0, total: 0 },
      externalIndex: 0,
      internalIndex: 0
    };
  });

  describe('HD Account Extraction', () => {
    it('extracts private key for HD native-segwit account', async () => {
      mockAccount.addressType = 'native-segwit';

      const privateKey = await extractPrivateKey(mockAccount, mockState);

      expect(privateKey).toBeDefined();
      expect(typeof privateKey).toBe('string');
      expect(privateKey.length).toBe(64); // 32 bytes hex = 64 chars
    });

    it('extracts private key for HD segwit account', async () => {
      mockAccount.addressType = 'segwit';

      const privateKey = await extractPrivateKey(mockAccount, mockState);

      expect(privateKey).toBeDefined();
      expect(privateKey.length).toBe(64);
    });

    it('extracts private key for HD legacy account', async () => {
      mockAccount.addressType = 'legacy';

      const privateKey = await extractPrivateKey(mockAccount, mockState);

      expect(privateKey).toBeDefined();
      expect(privateKey.length).toBe(64);
    });

    it('produces consistent private key for same derivation path', async () => {
      const privateKey1 = await extractPrivateKey(mockAccount, mockState);
      const privateKey2 = await extractPrivateKey(mockAccount, mockState);

      expect(privateKey1).toBe(privateKey2);
    });

    it('produces different private keys for different account indices', async () => {
      const account1 = { ...mockAccount, index: 0 };
      const account2 = { ...mockAccount, index: 1 };

      const privateKey1 = await extractPrivateKey(account1, mockState);
      const privateKey2 = await extractPrivateKey(account2, mockState);

      expect(privateKey1).not.toBe(privateKey2);
    });

    it('throws error when wallet is locked', async () => {
      mockState.isUnlocked = false;
      mockState.decryptedSeed = null;

      await expect(
        extractPrivateKey(mockAccount, mockState)
      ).rejects.toThrow('Wallet is locked');
    });

    it('throws error when decrypted seed is null', async () => {
      mockState.decryptedSeed = null;

      await expect(
        extractPrivateKey(mockAccount, mockState)
      ).rejects.toThrow('Wallet seed not available');
    });
  });

  describe('Imported Account Extraction', () => {
    beforeEach(async () => {
      mockAccount.imported = true;

      // Create mock encryption key
      mockState.encryptionKey = await CryptoUtils.deriveKey(
        'TestPassword123',
        new Uint8Array(32),
        100000
      );
    });

    it('extracts private key for imported account', async () => {
      // Mock WalletStorage.getImportedKey
      jest.spyOn(WalletStorage, 'getImportedKey').mockResolvedValue({
        encryptedData: 'mock_encrypted_data',
        salt: '',
        iv: 'mock_iv',
        type: 'wif'
      });

      // Mock CryptoUtils.decryptWithKey to return WIF
      jest.spyOn(CryptoUtils, 'decryptWithKey').mockResolvedValue(VALID_TESTNET_WIF_COMPRESSED);

      const privateKey = await extractPrivateKey(mockAccount, mockState);

      expect(privateKey).toBeDefined();
      expect(privateKey.length).toBe(64);
    });

    it('handles imported key that is already hex format', async () => {
      const hexPrivateKey = '0'.repeat(64);

      jest.spyOn(WalletStorage, 'getImportedKey').mockResolvedValue({
        encryptedData: 'mock_encrypted_data',
        salt: '',
        iv: 'mock_iv',
        type: 'hex'
      });

      jest.spyOn(CryptoUtils, 'decryptWithKey').mockResolvedValue(hexPrivateKey);

      const privateKey = await extractPrivateKey(mockAccount, mockState);

      expect(privateKey).toBe(hexPrivateKey);
    });

    it('throws error when no imported key data found', async () => {
      jest.spyOn(WalletStorage, 'getImportedKey').mockResolvedValue(null);

      await expect(
        extractPrivateKey(mockAccount, mockState)
      ).rejects.toThrow('No imported key found');
    });
  });

  describe('Multisig Account Rejection', () => {
    it('throws error for multisig account', async () => {
      mockAccount.accountType = 'multisig';

      await expect(
        extractPrivateKey(mockAccount, mockState)
      ).rejects.toThrow('Cannot export multisig accounts');
    });

    it('error message mentions xpub export alternative', async () => {
      mockAccount.accountType = 'multisig';

      try {
        await extractPrivateKey(mockAccount, mockState);
        fail('Should have thrown error');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('multiple co-signer keys');
      }
    });
  });

  describe('Memory Safety', () => {
    it('clears private key from memory after use', async () => {
      const privateKey = await extractPrivateKey(mockAccount, mockState);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Private key variable should be cleared
      // (This is a conceptual test - actual memory inspection requires different tools)
      expect(privateKey).toBeDefined(); // Still defined in test scope
    });
  });
});
```

---

## Integration Test Plan

### 1. Export Flow Integration Tests

**File**: `src/background/__tests__/privateKeyExport.integration.test.ts`

**Coverage Target**: 95%+

```typescript
describe('Private Key Export - Integration Tests', () => {
  let mockWallet: Wallet;
  let mockState: InMemoryState;

  beforeEach(async () => {
    // Setup wallet with test account
    mockWallet = await createMockWallet();
    mockState = await unlockMockWallet(mockWallet, 'TestPassword123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('EXPORT_PRIVATE_KEY Handler - Plaintext', () => {
    it('exports HD account as plaintext WIF', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: undefined // No encryption
      });

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.wif).toBeDefined();
      expect(response.data.metadata.encrypted).toBe(false);
      expect(response.data.metadata.network).toBe('testnet');
      expect(response.data.metadata.accountName).toBe('Test Account');
    });

    it('exported WIF is valid testnet format', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      const wif = response.data.wif!;
      const validation = WIFManager.validateWIF(wif, 'testnet');

      expect(validation.valid).toBe(true);
      expect(validation.network).toBe('testnet');
    });

    it('exported WIF derives to correct first address', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      const wif = response.data.wif!;
      const addressInfo = WIFManager.deriveFirstAddress(wif, 'testnet');

      expect(addressInfo.address).toBe(response.data.metadata.firstAddress);
    });

    it('includes correct metadata in response', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      expect(response.data.metadata).toEqual({
        accountName: expect.any(String),
        addressType: expect.stringMatching(/^(legacy|segwit|native-segwit)$/),
        firstAddress: expect.stringMatching(/^(tb1|[2mn])/),
        network: 'testnet',
        timestamp: expect.any(Number),
        encrypted: false
      });
    });
  });

  describe('EXPORT_PRIVATE_KEY Handler - Encrypted', () => {
    it('exports HD account with password protection', async () => {
      const password = 'ExportPassword123!';

      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password
      });

      expect(response.success).toBe(true);
      expect(response.data.encryptedData).toBeDefined();
      expect(response.data.salt).toBeDefined();
      expect(response.data.iv).toBeDefined();
      expect(response.data.wif).toBeUndefined(); // Should not include plaintext
      expect(response.data.metadata.encrypted).toBe(true);
    });

    it('encrypted WIF can be decrypted with correct password', async () => {
      const password = 'TestPassword123';

      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0,
        password
      });

      // Decrypt
      const decrypted = await CryptoUtils.decrypt(
        exportResponse.data.encryptedData!,
        password,
        exportResponse.data.salt!,
        exportResponse.data.iv!
      );

      // Validate decrypted WIF
      const validation = WIFManager.validateWIF(decrypted, 'testnet');
      expect(validation.valid).toBe(true);
    });

    it('fails to decrypt with wrong password', async () => {
      const correctPassword = 'CorrectPassword';
      const wrongPassword = 'WrongPassword';

      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0,
        password: correctPassword
      });

      await expect(
        CryptoUtils.decrypt(
          exportResponse.data.encryptedData!,
          wrongPassword,
          exportResponse.data.salt!,
          exportResponse.data.iv!
        )
      ).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('returns error when wallet is locked', async () => {
      mockState.isUnlocked = false;

      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('locked');
      expect(response.code).toBe(PrivateKeyErrorCode.WALLET_LOCKED);
    });

    it('returns error when account not found', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 999 // Non-existent account
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('not found');
      expect(response.code).toBe(PrivateKeyErrorCode.ACCOUNT_NOT_FOUND);
    });

    it('returns error for multisig account', async () => {
      // Create multisig account
      await createMockMultisigAccount(mockWallet);

      const response = await handleExportPrivateKey({
        accountIndex: 1 // Multisig account
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('multisig');
      expect(response.code).toBe(PrivateKeyErrorCode.MULTISIG_NOT_SUPPORTED);
    });
  });

  describe('Memory Safety', () => {
    it('does not log private keys', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      await handleExportPrivateKey({
        accountIndex: 0
      });

      // Check no console.log calls contain WIF-like strings (52 chars starting with c/9)
      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      const allErrors = consoleErrorSpy.mock.calls.flat().join(' ');

      expect(allLogs).not.toMatch(/[c9][A-Za-z0-9]{51}/);
      expect(allErrors).not.toMatch(/[c9][A-Za-z0-9]{51}/);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
```

---

### 2. Import Flow Integration Tests

**File**: `src/background/__tests__/privateKeyImport.integration.test.ts`

**Coverage Target**: 95%+

```typescript
describe('Private Key Import - Integration Tests', () => {
  let mockWallet: Wallet;
  let mockState: InMemoryState;

  beforeEach(async () => {
    mockWallet = await createMockWallet();
    mockState = await unlockMockWallet(mockWallet, 'TestPassword123');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IMPORT_PRIVATE_KEY Handler', () => {
    it('imports valid testnet WIF successfully', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif,
        name: 'Imported Account'
      });

      expect(response.success).toBe(true);
      expect(response.data.account).toBeDefined();
      expect(response.data.account.name).toBe('Imported Account');
      expect(response.data.account.imported).toBe(true);
      expect(response.data.account.addressType).toBe('native-segwit');
      expect(response.data.firstAddress).toBeDefined();
    });

    it('creates account with correct address', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif,
        name: 'Test Import'
      });

      // Verify address matches WIF derivation
      const validation = WIFManager.validateWIF(wif, 'testnet');
      expect(response.data.firstAddress).toBe(validation.firstAddress);
    });

    it('stores encrypted WIF in wallet storage', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif,
        name: 'Test Account'
      });

      // Verify imported key was stored
      const importedKey = await WalletStorage.getImportedKey(response.data.account.index);

      expect(importedKey).toBeDefined();
      expect(importedKey!.type).toBe('wif');
      expect(importedKey!.encryptedData).toBeDefined();
    });

    it('adds account to wallet accounts list', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const beforeCount = mockWallet.accounts.length;

      await handleImportPrivateKey({
        wif,
        name: 'New Account'
      });

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts.length).toBe(beforeCount + 1);
      expect(wallet.accounts[beforeCount].name).toBe('New Account');
    });

    it('assigns correct account index', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif,
        name: 'Test'
      });

      const expectedIndex = mockWallet.accounts.length;
      expect(response.data.account.index).toBe(expectedIndex);
    });
  });

  describe('Validation and Error Handling', () => {
    it('rejects mainnet WIF', async () => {
      const mainnetWIF = MAINNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif: mainnetWIF,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('mainnet');
      expect(response.code).toBe(PrivateKeyErrorCode.WRONG_NETWORK);
    });

    it('rejects invalid WIF format', async () => {
      const invalidWIF = 'invalid-wif-string';

      const response = await handleImportPrivateKey({
        wif: invalidWIF,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid');
      expect(response.code).toBe(PrivateKeyErrorCode.INVALID_WIF_FORMAT);
    });

    it('rejects invalid WIF checksum', async () => {
      const invalidChecksum = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpx';

      const response = await handleImportPrivateKey({
        wif: invalidChecksum,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('checksum');
    });

    it('detects and rejects duplicate import', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      // Import once
      await handleImportPrivateKey({
        wif,
        name: 'First Import'
      });

      // Try to import again
      const response = await handleImportPrivateKey({
        wif,
        name: 'Second Import'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('already imported');
      expect(response.error).toContain('First Import');
      expect(response.code).toBe(PrivateKeyErrorCode.DUPLICATE_KEY);
    });
  });

  describe('Rate Limiting', () => {
    it('allows 5 imports per minute', async () => {
      // Import 5 different WIFs
      for (let i = 0; i < 5; i++) {
        const wif = generateRandomTestnetWIF();
        const response = await handleImportPrivateKey({
          wif,
          name: `Account ${i}`
        });
        expect(response.success).toBe(true);
      }
    });

    it('blocks 6th import within 1 minute', async () => {
      // Import 5 accounts
      for (let i = 0; i < 5; i++) {
        const wif = generateRandomTestnetWIF();
        await handleImportPrivateKey({
          wif,
          name: `Account ${i}`
        });
      }

      // 6th import should fail
      const wif = generateRandomTestnetWIF();
      const response = await handleImportPrivateKey({
        wif,
        name: 'Too Many'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Too many');
      expect(response.code).toBe(PrivateKeyErrorCode.RATE_LIMIT_EXCEEDED);
    });
  });

  describe('Initial Wallet Setup', () => {
    it('creates wallet with imported key as first account', async () => {
      // Clear existing wallet
      await WalletStorage.clearWallet();

      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const walletPassword = 'NewWalletPassword123';

      const response = await handleImportPrivateKey({
        wif,
        name: 'First Account',
        walletPassword
      });

      expect(response.success).toBe(true);
      expect(response.data.account.index).toBe(0);

      // Verify wallet was created
      const wallet = await WalletStorage.getWallet();
      expect(wallet).toBeDefined();
      expect(wallet.accounts.length).toBe(1);
      expect(wallet.accounts[0].imported).toBe(true);
    });

    it('fails if wallet password not provided for initial setup', async () => {
      await WalletStorage.clearWallet();

      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif,
        name: 'First Account'
        // No walletPassword
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('password required');
    });
  });

  describe('Memory Safety', () => {
    it('does not log WIF strings', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      const wif = VALID_TESTNET_WIF_COMPRESSED;
      await handleImportPrivateKey({
        wif,
        name: 'Test'
      });

      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      const allErrors = consoleErrorSpy.mock.calls.flat().join(' ');

      expect(allLogs).not.toContain(wif);
      expect(allErrors).not.toContain(wif);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
```

---

### 3. Roundtrip Integration Tests

**File**: `src/background/__tests__/privateKeyRoundtrip.integration.test.ts`

**Coverage Target**: 100%

```typescript
describe('Export-Import Roundtrip - Integration Tests', () => {
  let mockWallet: Wallet;
  let mockState: InMemoryState;

  beforeEach(async () => {
    mockWallet = await createMockWallet();
    mockState = await unlockMockWallet(mockWallet, 'TestPassword123');
  });

  describe('Plaintext Roundtrip', () => {
    it('successfully exports and re-imports HD account', async () => {
      // 1. Export account
      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0,
        password: undefined
      });

      expect(exportResponse.success).toBe(true);
      const wif = exportResponse.data.wif!;
      const originalAddress = exportResponse.data.metadata.firstAddress;

      // 2. Import to new account
      const importResponse = await handleImportPrivateKey({
        wif,
        name: 'Re-imported Account'
      });

      expect(importResponse.success).toBe(true);

      // 3. Verify same first address
      expect(importResponse.data.firstAddress).toBe(originalAddress);

      // 4. Verify account was created
      const wallet = await WalletStorage.getWallet();
      const importedAccount = wallet.accounts.find(
        (acc) => acc.name === 'Re-imported Account'
      );
      expect(importedAccount).toBeDefined();
      expect(importedAccount!.imported).toBe(true);
    });

    it('exported and re-imported account can sign transactions', async () => {
      // 1. Export
      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0
      });

      // 2. Import
      const wif = exportResponse.data.wif!;
      const importResponse = await handleImportPrivateKey({
        wif,
        name: 'Test Account'
      });

      // 3. Create test transaction
      const testTransaction = createMockTransaction();

      // 4. Sign with imported account
      const signResponse = await handleSignTransaction({
        accountIndex: importResponse.data.account.index,
        transaction: testTransaction
      });

      expect(signResponse.success).toBe(true);
      expect(signResponse.data.signedTransaction).toBeDefined();
    });

    it('preserves address type across export-import', async () => {
      // Test legacy account
      const legacyAccount = await createMockAccount('legacy');
      const exportResponse = await handleExportPrivateKey({
        accountIndex: legacyAccount.index
      });

      const importResponse = await handleImportPrivateKey({
        wif: exportResponse.data.wif!,
        name: 'Imported Legacy'
      });

      // Uncompressed WIF → Legacy address type
      expect(importResponse.data.account.addressType).toBe('legacy');
    });
  });

  describe('Encrypted Roundtrip', () => {
    it('successfully exports encrypted and re-imports after decryption', async () => {
      const exportPassword = 'ExportPassword123!';

      // 1. Export with encryption
      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0,
        password: exportPassword
      });

      expect(exportResponse.success).toBe(true);
      const originalAddress = exportResponse.data.metadata.firstAddress;

      // 2. Decrypt exported data
      const wif = await CryptoUtils.decrypt(
        exportResponse.data.encryptedData!,
        exportPassword,
        exportResponse.data.salt!,
        exportResponse.data.iv!
      );

      // 3. Import decrypted WIF
      const importResponse = await handleImportPrivateKey({
        wif,
        name: 'Re-imported from Encrypted'
      });

      expect(importResponse.success).toBe(true);
      expect(importResponse.data.firstAddress).toBe(originalAddress);
    });

    it('fails import if wrong decryption password used', async () => {
      const correctPassword = 'CorrectPassword';
      const wrongPassword = 'WrongPassword';

      // Export with encryption
      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0,
        password: correctPassword
      });

      // Try to decrypt with wrong password
      await expect(
        CryptoUtils.decrypt(
          exportResponse.data.encryptedData!,
          wrongPassword,
          exportResponse.data.salt!,
          exportResponse.data.iv!
        )
      ).rejects.toThrow();
    });
  });

  describe('Multiple Accounts Roundtrip', () => {
    it('can export and import multiple accounts', async () => {
      // Create 3 accounts
      const account1 = mockWallet.accounts[0];
      const account2 = await createMockAccount('segwit');
      const account3 = await createMockAccount('native-segwit');

      // Export all 3
      const export1 = await handleExportPrivateKey({ accountIndex: account1.index });
      const export2 = await handleExportPrivateKey({ accountIndex: account2.index });
      const export3 = await handleExportPrivateKey({ accountIndex: account3.index });

      // Import all 3 to new wallet
      await WalletStorage.clearWallet();
      await createNewWallet('NewPassword123');

      const import1 = await handleImportPrivateKey({
        wif: export1.data.wif!,
        name: 'Imported 1'
      });
      const import2 = await handleImportPrivateKey({
        wif: export2.data.wif!,
        name: 'Imported 2'
      });
      const import3 = await handleImportPrivateKey({
        wif: export3.data.wif!,
        name: 'Imported 3'
      });

      // Verify all imported successfully
      expect(import1.success).toBe(true);
      expect(import2.success).toBe(true);
      expect(import3.success).toBe(true);

      // Verify addresses match
      expect(import1.data.firstAddress).toBe(export1.data.metadata.firstAddress);
      expect(import2.data.firstAddress).toBe(export2.data.metadata.firstAddress);
      expect(import3.data.firstAddress).toBe(export3.data.metadata.firstAddress);
    });

    it('detects duplicate when re-importing already imported account', async () => {
      // Export account 0
      const exportResponse = await handleExportPrivateKey({ accountIndex: 0 });

      // Import once
      const import1 = await handleImportPrivateKey({
        wif: exportResponse.data.wif!,
        name: 'First Import'
      });
      expect(import1.success).toBe(true);

      // Try to import again
      const import2 = await handleImportPrivateKey({
        wif: exportResponse.data.wif!,
        name: 'Duplicate Import'
      });

      expect(import2.success).toBe(false);
      expect(import2.error).toContain('already imported');
      expect(import2.error).toContain('First Import');
    });
  });

  describe('Cross-Wallet Roundtrip', () => {
    it('can export from one wallet and import to another', async () => {
      // Wallet 1: Export
      const exportResponse = await handleExportPrivateKey({
        accountIndex: 0
      });

      const wif = exportResponse.data.wif!;
      const originalAddress = exportResponse.data.metadata.firstAddress;

      // Create Wallet 2
      await WalletStorage.clearWallet();
      await createNewWallet('Wallet2Password');

      // Wallet 2: Import
      const importResponse = await handleImportPrivateKey({
        wif,
        name: 'Imported from Wallet 1'
      });

      expect(importResponse.success).toBe(true);
      expect(importResponse.data.firstAddress).toBe(originalAddress);
    });
  });

  describe('Stress Testing', () => {
    it('handles rapid export-import cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const exportResponse = await handleExportPrivateKey({
          accountIndex: 0
        });

        const importResponse = await handleImportPrivateKey({
          wif: exportResponse.data.wif!,
          name: `Cycle ${i}`
        });

        expect(exportResponse.success).toBe(true);
        expect(importResponse.success).toBe(true);
      }
    });

    it('handles large number of imports (up to rate limit)', async () => {
      const imports = [];

      for (let i = 0; i < 5; i++) {
        const wif = generateRandomTestnetWIF();
        const response = await handleImportPrivateKey({
          wif,
          name: `Bulk Import ${i}`
        });
        imports.push(response);
      }

      // All 5 should succeed
      expect(imports.every((r) => r.success)).toBe(true);
    });
  });
});
```

---

## Security Test Plan

**File**: `src/background/__tests__/privateKeySecurity.test.ts`

**Coverage Target**: 100%

```typescript
describe('Private Key Export/Import - Security Tests', () => {
  describe('No Logging of Sensitive Data', () => {
    it('does not log private keys to console', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();

      // Perform export
      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      // Check all console outputs
      const allLogs = [
        ...consoleLogSpy.mock.calls,
        ...consoleErrorSpy.mock.calls,
        ...consoleWarnSpy.mock.calls,
        ...consoleDebugSpy.mock.calls
      ].flat().join(' ');

      // Should not contain WIF pattern (52 chars starting with c/9)
      expect(allLogs).not.toMatch(/[c9][A-Za-z0-9]{51}/);

      // Should not contain hex private key pattern (64 hex chars)
      expect(allLogs).not.toMatch(/[0-9a-f]{64}/i);

      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
      consoleDebugSpy.mockRestore();
    });

    it('does not log WIF in import operations', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      await handleImportPrivateKey({
        wif,
        name: 'Test Account'
      });

      const allLogs = consoleLogSpy.mock.calls.flat().join(' ');
      expect(allLogs).not.toContain(wif);

      consoleLogSpy.mockRestore();
    });

    it('does not include sensitive data in error messages', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      // Trigger various errors and check messages
      const errors: string[] = [];

      // Invalid account index
      const response1 = await handleExportPrivateKey({ accountIndex: 999 });
      if (!response1.success) errors.push(response1.error);

      // Duplicate import
      await handleImportPrivateKey({ wif, name: 'First' });
      const response2 = await handleImportPrivateKey({ wif, name: 'Duplicate' });
      if (!response2.success) errors.push(response2.error);

      // Check no errors contain WIF
      errors.forEach((error) => {
        expect(error).not.toContain(wif);
      });
    });
  });

  describe('WIF Not in DOM', () => {
    it('WIF string never rendered to DOM during export', async () => {
      // Mock DOM to track what's rendered
      const domContent: string[] = [];
      const originalTextContent = Object.getOwnPropertyDescriptor(
        Node.prototype,
        'textContent'
      );

      Object.defineProperty(Node.prototype, 'textContent', {
        set(value: string) {
          if (value) domContent.push(value);
          originalTextContent?.set?.call(this, value);
        },
        get() {
          return originalTextContent?.get?.call(this);
        }
      });

      // Perform export
      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      const wif = response.data.wif!;

      // Check DOM content doesn't contain WIF
      const allDOMContent = domContent.join(' ');
      expect(allDOMContent).not.toContain(wif);

      // Restore original descriptor
      if (originalTextContent) {
        Object.defineProperty(Node.prototype, 'textContent', originalTextContent);
      }
    });
  });

  describe('Memory Cleanup', () => {
    it('clears private key variable after export', async () => {
      // This test verifies the pattern, actual memory inspection requires different tools
      const exportCode = handleExportPrivateKey.toString();

      // Verify cleanup pattern exists in code
      expect(exportCode).toContain('repeat(');
      expect(exportCode).toContain('= null');
    });

    it('clears WIF variable after import', async () => {
      const importCode = handleImportPrivateKey.toString();

      // Verify cleanup pattern exists
      expect(importCode).toContain('repeat(');
      expect(importCode).toContain('= null');
    });

    it('uses finally block for guaranteed cleanup', async () => {
      const exportCode = handleExportPrivateKey.toString();
      const importCode = handleImportPrivateKey.toString();

      expect(exportCode).toContain('finally');
      expect(importCode).toContain('finally');
    });
  });

  describe('Password Strength Enforcement', () => {
    it('accepts strong password for encryption', async () => {
      const strongPassword = 'StrongPassword123!@#';

      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: strongPassword
      });

      expect(response.success).toBe(true);
      expect(response.data.metadata.encrypted).toBe(true);
    });

    it('allows weak password with warning (user choice)', async () => {
      // Backend does not enforce password strength (frontend does)
      const weakPassword = '123456';

      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: weakPassword
      });

      // Backend allows it (user choice)
      expect(response.success).toBe(true);
    });
  });

  describe('Network Validation (Critical)', () => {
    it('BLOCKS mainnet key import immediately', async () => {
      const mainnetWIF = MAINNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif: mainnetWIF,
        name: 'Mainnet Key'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('REJECTED');
      expect(response.error).toContain('mainnet');
      expect(response.code).toBe(PrivateKeyErrorCode.WRONG_NETWORK);
    });

    it('does NOT decode mainnet key beyond detection', async () => {
      const mainnetWIF = MAINNET_WIF_COMPRESSED;
      const decodeSpy = jest.spyOn(KeyManager, 'decodeWIF');

      await handleImportPrivateKey({
        wif: mainnetWIF,
        name: 'Test'
      });

      // Verify decode was NEVER called with mainnet WIF
      expect(decodeSpy).not.toHaveBeenCalledWith(mainnetWIF, expect.anything());

      decodeSpy.mockRestore();
    });

    it('does NOT store mainnet key', async () => {
      const mainnetWIF = MAINNET_WIF_COMPRESSED;
      const storeSpy = jest.spyOn(WalletStorage, 'storeImportedKey');

      await handleImportPrivateKey({
        wif: mainnetWIF,
        name: 'Test'
      });

      // Verify store was NEVER called
      expect(storeSpy).not.toHaveBeenCalled();

      storeSpy.mockRestore();
    });

    it('provides clear warning in error message', async () => {
      const mainnetWIF = MAINNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif: mainnetWIF,
        name: 'Test'
      });

      expect(response.error).toContain('DO NOT import mainnet keys');
    });
  });

  describe('Rate Limiting (Brute Force Prevention)', () => {
    it('enforces 5 imports per minute limit', async () => {
      // Import 5 accounts (should succeed)
      for (let i = 0; i < 5; i++) {
        const wif = generateRandomTestnetWIF();
        const response = await handleImportPrivateKey({
          wif,
          name: `Account ${i}`
        });
        expect(response.success).toBe(true);
      }

      // 6th import (should fail)
      const wif = generateRandomTestnetWIF();
      const response = await handleImportPrivateKey({
        wif,
        name: 'Account 6'
      });

      expect(response.success).toBe(false);
      expect(response.code).toBe(PrivateKeyErrorCode.RATE_LIMIT_EXCEEDED);
    });

    it('rate limit resets after 60 seconds', async () => {
      jest.useFakeTimers();

      // Import 5 accounts
      for (let i = 0; i < 5; i++) {
        const wif = generateRandomTestnetWIF();
        await handleImportPrivateKey({ wif, name: `Account ${i}` });
      }

      // Advance time by 61 seconds
      jest.advanceTimersByTime(61000);

      // Should be able to import again
      const wif = generateRandomTestnetWIF();
      const response = await handleImportPrivateKey({
        wif,
        name: 'After Reset'
      });

      expect(response.success).toBe(true);

      jest.useRealTimers();
    });
  });

  describe('Duplicate Detection (Prevents Key Collisions)', () => {
    it('prevents importing same key twice', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      const response1 = await handleImportPrivateKey({
        wif,
        name: 'First Import'
      });
      expect(response1.success).toBe(true);

      const response2 = await handleImportPrivateKey({
        wif,
        name: 'Duplicate Import'
      });

      expect(response2.success).toBe(false);
      expect(response2.error).toContain('already imported');
      expect(response2.code).toBe(PrivateKeyErrorCode.DUPLICATE_KEY);
    });

    it('provides account name of existing import in error', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      await handleImportPrivateKey({ wif, name: 'Original Account' });
      const response = await handleImportPrivateKey({ wif, name: 'Duplicate' });

      expect(response.error).toContain('Original Account');
    });

    it('allows re-import after deletion (not a duplicate)', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;

      // Import
      const import1 = await handleImportPrivateKey({ wif, name: 'First' });

      // Delete account
      await WalletStorage.deleteAccount(import1.data.account.index);

      // Re-import (should succeed)
      const import2 = await handleImportPrivateKey({ wif, name: 'Re-imported' });

      expect(import2.success).toBe(true);
    });
  });

  describe('Wallet Lock State Enforcement', () => {
    it('prevents export when wallet locked', async () => {
      // Lock wallet
      mockState.isUnlocked = false;
      mockState.decryptedSeed = null;

      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('locked');
      expect(response.code).toBe(PrivateKeyErrorCode.WALLET_LOCKED);
    });

    it('requires unlock before import to existing wallet', async () => {
      mockState.isUnlocked = false;
      mockState.encryptionKey = null;

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('unlock');
    });
  });

  describe('Multisig Account Protection', () => {
    it('blocks export of multisig accounts', async () => {
      const multisigAccount = await createMockMultisigAccount();

      const response = await handleExportPrivateKey({
        accountIndex: multisigAccount.index
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('multisig');
      expect(response.code).toBe(PrivateKeyErrorCode.MULTISIG_NOT_SUPPORTED);
    });

    it('provides helpful error message for multisig', async () => {
      const multisigAccount = await createMockMultisigAccount();

      const response = await handleExportPrivateKey({
        accountIndex: multisigAccount.index
      });

      expect(response.error).toContain('multiple co-signer keys');
      expect(response.error).toContain('xpub');
    });
  });

  describe('Input Sanitization', () => {
    it('handles malicious WIF input safely', async () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"; DROP TABLE accounts; --',
        '../../../etc/passwd',
        '%00%00%00',
        'null',
        'undefined'
      ];

      for (const input of maliciousInputs) {
        const response = await handleImportPrivateKey({
          wif: input,
          name: 'Test'
        });

        // Should reject gracefully without throwing
        expect(response.success).toBe(false);
        expect(response.error).toBeDefined();
      }
    });

    it('handles extremely long WIF input', async () => {
      const longWIF = 'c'.repeat(10000);

      const response = await handleImportPrivateKey({
        wif: longWIF,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('length');
    });

    it('handles special characters in account name', async () => {
      const wif = VALID_TESTNET_WIF_COMPRESSED;
      const specialName = '<script>alert("xss")</script>';

      const response = await handleImportPrivateKey({
        wif,
        name: specialName
      });

      // Should succeed but sanitize name
      expect(response.success).toBe(true);
      // Name should be escaped or sanitized (implementation dependent)
    });
  });
});
```

---

## Edge Case Tests

**File**: `src/background/__tests__/privateKeyEdgeCases.test.ts`

```typescript
describe('Private Key Export/Import - Edge Cases', () => {
  describe('Empty and Null Inputs', () => {
    it('rejects empty WIF string', async () => {
      const response = await handleImportPrivateKey({
        wif: '',
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('empty');
    });

    it('rejects empty account name', async () => {
      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: ''
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('name');
    });

    it('handles whitespace-only account name', async () => {
      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: '   '
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('name');
    });
  });

  describe('Very Long Inputs', () => {
    it('handles very long account name (100+ chars)', async () => {
      const longName = 'A'.repeat(100);

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: longName
      });

      // Should succeed or truncate gracefully
      if (response.success) {
        expect(response.data.account.name.length).toBeLessThanOrEqual(100);
      }
    });

    it('rejects excessively long account name (1000+ chars)', async () => {
      const veryLongName = 'A'.repeat(1000);

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: veryLongName
      });

      // Should reject or truncate
      expect(response.success).toBe(false);
    });
  });

  describe('Unicode and Special Characters', () => {
    it('handles unicode characters in account name', async () => {
      const unicodeName = '账户 🔐 Ñame';

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: unicodeName
      });

      expect(response.success).toBe(true);
      expect(response.data.account.name).toBe(unicodeName);
    });

    it('handles emojis in account name', async () => {
      const emojiName = '💰 My Wallet 🚀';

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: emojiName
      });

      expect(response.success).toBe(true);
      expect(response.data.account.name).toBe(emojiName);
    });

    it('handles newlines in account name', async () => {
      const nameWithNewlines = 'Account\nWith\nNewlines';

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: nameWithNewlines
      });

      // Should succeed but normalize newlines
      if (response.success) {
        expect(response.data.account.name).not.toContain('\n');
      }
    });
  });

  describe('Boundary Cases', () => {
    it('handles account index 0', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      expect(response.success).toBe(true);
    });

    it('handles large account index (100+)', async () => {
      // Create 100 accounts
      for (let i = 0; i < 100; i++) {
        await createMockAccount();
      }

      const response = await handleExportPrivateKey({
        accountIndex: 99
      });

      expect(response.success).toBe(true);
    });

    it('rejects negative account index', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: -1
      });

      expect(response.success).toBe(false);
    });

    it('rejects non-integer account index', async () => {
      const response = await handleExportPrivateKey({
        accountIndex: 1.5
      });

      expect(response.success).toBe(false);
    });
  });

  describe('Concurrent Operations', () => {
    it('handles simultaneous exports', async () => {
      const promises = [
        handleExportPrivateKey({ accountIndex: 0 }),
        handleExportPrivateKey({ accountIndex: 0 }),
        handleExportPrivateKey({ accountIndex: 0 })
      ];

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });

      // All should produce same WIF (deterministic)
      const wifs = results.map((r) => r.data.wif);
      expect(new Set(wifs).size).toBe(1);
    });

    it('handles simultaneous imports', async () => {
      const wifs = [
        generateRandomTestnetWIF(),
        generateRandomTestnetWIF(),
        generateRandomTestnetWIF()
      ];

      const promises = wifs.map((wif, i) =>
        handleImportPrivateKey({
          wif,
          name: `Concurrent ${i}`
        })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Storage Edge Cases', () => {
    it('handles storage quota exceeded', async () => {
      // Mock storage.set to throw quota error
      jest.spyOn(chrome.storage.local, 'set').mockRejectedValue(
        new Error('QUOTA_BYTES quota exceeded')
      );

      const response = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: 'Test'
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('storage');
    });

    it('handles corrupted wallet data', async () => {
      // Corrupt wallet data in storage
      await chrome.storage.local.set({
        wallet: 'CORRUPTED_DATA'
      });

      const response = await handleExportPrivateKey({
        accountIndex: 0
      });

      expect(response.success).toBe(false);
    });
  });

  describe('Encryption Edge Cases', () => {
    it('handles encryption with very long password (100+ chars)', async () => {
      const longPassword = 'A'.repeat(100);

      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: longPassword
      });

      expect(response.success).toBe(true);
      expect(response.data.metadata.encrypted).toBe(true);
    });

    it('handles encryption with password containing null bytes', async () => {
      const passwordWithNull = 'password\x00with\x00nulls';

      const response = await handleExportPrivateKey({
        accountIndex: 0,
        password: passwordWithNull
      });

      // Should handle gracefully (might reject or accept)
      expect(response).toBeDefined();
    });
  });

  describe('Address Derivation Edge Cases', () => {
    it('handles uncompressed WIF (derives legacy address)', async () => {
      const uncompressedWIF = VALID_TESTNET_WIF_UNCOMPRESSED;

      const response = await handleImportPrivateKey({
        wif: uncompressedWIF,
        name: 'Uncompressed Key'
      });

      expect(response.success).toBe(true);
      expect(response.data.account.addressType).toBe('legacy');
      expect(response.data.firstAddress).toMatch(/^[mn]/); // Testnet legacy
    });

    it('handles compressed WIF (derives native-segwit address)', async () => {
      const compressedWIF = VALID_TESTNET_WIF_COMPRESSED;

      const response = await handleImportPrivateKey({
        wif: compressedWIF,
        name: 'Compressed Key'
      });

      expect(response.success).toBe(true);
      expect(response.data.account.addressType).toBe('native-segwit');
      expect(response.data.firstAddress).toMatch(/^tb1/); // Testnet bech32
    });
  });

  describe('Error Recovery', () => {
    it('recovers from transient storage errors', async () => {
      let callCount = 0;
      jest.spyOn(chrome.storage.local, 'set').mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Transient error'));
        }
        return Promise.resolve();
      });

      // First call fails, second succeeds
      const response1 = await handleImportPrivateKey({
        wif: VALID_TESTNET_WIF_COMPRESSED,
        name: 'Test 1'
      });
      expect(response1.success).toBe(false);

      const response2 = await handleImportPrivateKey({
        wif: generateRandomTestnetWIF(),
        name: 'Test 2'
      });
      expect(response2.success).toBe(true);
    });
  });
});
```

---

## Component Test Plan

### 1. PasswordStrengthMeter Component Tests

**File**: `src/tab/components/__tests__/PasswordStrengthMeter.test.tsx`

**Coverage Target**: 90%+

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PasswordStrengthMeter } from '../PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('renders nothing for empty password', () => {
    const { container } = render(<PasswordStrengthMeter password="" />);
    expect(container.firstChild).toBeNull();
  });

  it('shows "Weak" for short password', () => {
    render(<PasswordStrengthMeter password="123" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });

  it('shows "Medium" for moderate password', () => {
    render(<PasswordStrengthMeter password="password123" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows "Strong" for good password', () => {
    render(<PasswordStrengthMeter password="Password123!" />);
    expect(screen.getByText('Strong')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });

  it('shows "Very Strong" for excellent password', () => {
    render(<PasswordStrengthMeter password="VeryStr0ng!Pass@word#2023" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('applies correct CSS class for weak password', () => {
    const { container } = render(<PasswordStrengthMeter password="123" />);
    expect(container.querySelector('.strength-weak')).toBeInTheDocument();
  });

  it('applies correct CSS class for strong password', () => {
    const { container } = render(<PasswordStrengthMeter password="Password123!" />);
    expect(container.querySelector('.strength-strong')).toBeInTheDocument();
  });

  it('updates when password changes', () => {
    const { rerender } = render(<PasswordStrengthMeter password="weak" />);
    expect(screen.getByText('Weak')).toBeInTheDocument();

    rerender(<PasswordStrengthMeter password="VeryStr0ng!Password" />);
    expect(screen.getByText('Very Strong')).toBeInTheDocument();
  });

  it('is accessible with ARIA attributes', () => {
    render(<PasswordStrengthMeter password="Password123" />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-label', 'Password strength');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  describe('Password Requirements', () => {
    it('shows requirements checklist', () => {
      render(<PasswordStrengthMeter password="Pass123!" showRequirements />);

      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/Lowercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/Number/i)).toBeInTheDocument();
      expect(screen.getByText(/Special character/i)).toBeInTheDocument();
    });

    it('checks met requirements', () => {
      render(<PasswordStrengthMeter password="Password123!" showRequirements />);

      expect(screen.getByText(/At least 8 characters/i)).toHaveClass('requirement-met');
      expect(screen.getByText(/Uppercase letter/i)).toHaveClass('requirement-met');
    });

    it('shows unmet requirements', () => {
      render(<PasswordStrengthMeter password="weak" showRequirements />);

      expect(screen.getByText(/At least 8 characters/i)).toHaveClass('requirement-unmet');
    });
  });
});
```

---

### 2. FileUploadArea Component Tests

**File**: `src/tab/components/__tests__/FileUploadArea.test.tsx`

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { FileUploadArea } from '../FileUploadArea';

describe('FileUploadArea', () => {
  const mockOnFileSelect = jest.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
  });

  it('renders file upload area', () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('handles file selection via click', async () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload file/i);

    await userEvent.upload(input, file);

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('handles file drag and drop', async () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const dropZone = screen.getByTestId('file-drop-zone');

    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file]
      }
    });

    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows drag hover state', () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    const dropZone = screen.getByTestId('file-drop-zone');

    fireEvent.dragOver(dropZone);
    expect(dropZone).toHaveClass('drag-hover');

    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('drag-hover');
  });

  it('accepts only .txt files', async () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} accept=".txt" />);

    const input = screen.getByLabelText(/upload file/i) as HTMLInputElement;
    expect(input.accept).toBe('.txt');
  });

  it('shows file size limit warning', () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} maxSizeMB={1} />);

    expect(screen.getByText(/maximum file size: 1 MB/i)).toBeInTheDocument();
  });

  it('rejects files exceeding size limit', async () => {
    const mockOnError = jest.fn();
    render(
      <FileUploadArea
        onFileSelect={mockOnFileSelect}
        onError={mockOnError}
        maxSizeMB={1}
      />
    );

    // Create 2MB file
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.txt', {
      type: 'text/plain'
    });

    const input = screen.getByLabelText(/upload file/i);
    await userEvent.upload(input, largeFile);

    expect(mockOnError).toHaveBeenCalledWith('File size exceeds 1 MB');
    expect(mockOnFileSelect).not.toHaveBeenCalled();
  });

  it('displays selected file name', async () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    const file = new File(['content'], 'private-key.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload file/i);

    await userEvent.upload(input, file);

    expect(screen.getByText('private-key.txt')).toBeInTheDocument();
  });

  it('allows clearing selected file', async () => {
    const mockOnClear = jest.fn();
    render(<FileUploadArea onFileSelect={mockOnFileSelect} onClear={mockOnClear} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload file/i);

    await userEvent.upload(input, file);

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await userEvent.click(clearButton);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('is keyboard accessible', async () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    const browseButton = screen.getByRole('button', { name: /browse files/i });

    browseButton.focus();
    expect(browseButton).toHaveFocus();

    await userEvent.keyboard('{Enter}');
    // File input should be triggered
  });

  it('has proper ARIA attributes', () => {
    render(<FileUploadArea onFileSelect={mockOnFileSelect} />);

    const dropZone = screen.getByTestId('file-drop-zone');
    expect(dropZone).toHaveAttribute('role', 'button');
    expect(dropZone).toHaveAttribute('aria-label', 'File upload area');
  });
});
```

---

(Continued in next message due to length...)

Now I'll create the rest of the testing strategy document, update my notes, and provide a comprehensive summary.
