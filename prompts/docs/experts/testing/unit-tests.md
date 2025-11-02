# Unit Testing Patterns & Strategies

**Last Updated**: 2025-10-22
**Owner**: Testing Expert
**Related**: [integration.md](./integration.md), [infrastructure.md](./infrastructure.md)

---

## Quick Navigation
- [Testing Patterns](#testing-patterns)
- [Component Testing](#component-testing-react)
- [Bitcoin-Specific Tests](#bitcoin-specific-testing)
- [Crypto & Security Tests](#crypto--security-testing)
- [Test Files Overview](#test-files-overview)

---

## Testing Patterns

### 1. AAA Pattern (Arrange-Act-Assert)

All tests follow the AAA pattern for clarity:

```typescript
it('should do something', async () => {
  // Arrange
  const input = 'test data';
  const expected = 'expected result';

  // Act
  const result = await functionUnderTest(input);

  // Assert
  expect(result).toBe(expected);
});
```

### 2. Crypto Testing Pattern

For cryptographic functions that require randomness:

```typescript
describe('crypto function', () => {
  beforeEach(() => {
    // Use real crypto for randomness tests
    (global as any).__restoreOriginalCrypto();
  });

  it('produces different outputs (randomness)', async () => {
    const result1 = await encrypt('data', 'password');
    const result2 = await encrypt('data', 'password');
    expect(result1).not.toBe(result2);
  });
});
```

### 3. Account Import Testing Pattern

Test WIF validation, encryption, and storage for imported accounts:

```typescript
describe('Import Account from Private Key', () => {
  it('should validate, encrypt, and store private key', async () => {
    const testWIF = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ';
    const password = 'test-password';

    // 1. Validate WIF format for testnet
    const isValid = KeyManager.validateWIF(testWIF, 'testnet');
    expect(isValid).toBe(true);

    // 2. Decode WIF to get key info
    const { privateKey, compressed } = KeyManager.decodeWIF(testWIF, 'testnet');
    expect(privateKey).toBeDefined();
    expect(compressed).toBe(true);

    // 3. Derive encryption key from password
    const salt = new Uint8Array(32);
    const encryptionKey = await CryptoUtils.deriveKey(password, salt);

    // 4. Encrypt private key with derived key
    const encrypted = await CryptoUtils.encryptWithKey(testWIF, encryptionKey);
    expect(encrypted.encryptedData).toBeDefined();

    // 5. Store encrypted key
    const importedKeyData: ImportedKeyData = {
      encryptedData: encrypted.encryptedData,
      salt: encrypted.salt,
      iv: encrypted.iv,
      type: 'private-key',
    };

    await WalletStorage.storeImportedKey(0, importedKeyData);

    // 6. Retrieve and decrypt
    const retrieved = await WalletStorage.getImportedKey(0);
    expect(retrieved).toEqual(importedKeyData);

    const decrypted = await WalletStorage.unlockImportedKey(0, password);
    expect(decrypted).toBe(testWIF);
  });
});
```

### 4. Rate Limiting Testing Pattern

Test rate limiting for security-sensitive operations:

```typescript
describe('Rate Limiting', () => {
  it('should enforce rate limits on imports', async () => {
    // Attempt 5 imports (should succeed)
    for (let i = 0; i < 5; i++) {
      const result = await importPrivateKey(testWIF + i, 'Account ' + i);
      expect(result.success).toBe(true);
    }

    // 6th attempt should be rate limited
    const result = await importPrivateKey(testWIF + '6', 'Account 6');
    expect(result.success).toBe(false);
    expect(result.error).toContain('rate limit');

    // Advance time by 61 seconds
    jest.advanceTimersByTime(61000);

    // Should succeed after window expires
    const retryResult = await importPrivateKey(testWIF + '7', 'Account 7');
    expect(retryResult.success).toBe(true);
  });
});
```

### 5. Entropy Validation Testing Pattern

Test seed phrase entropy validation to prevent weak seeds:

```typescript
describe('Seed Entropy Validation', () => {
  it('should reject known weak seeds', () => {
    const weakSeeds = [
      // BIP39 test vectors (publicly known)
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
      // High repetition
      'bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin',
    ];

    for (const seed of weakSeeds) {
      const validation = validateSeedEntropy(seed);
      expect(validation.valid).toBe(false);
      expect(validation.error).toContain('weak');
    }
  });

  it('should accept seed with good entropy', () => {
    const goodSeed = 'abandon ability able about above absent absorb abstract absurd abuse access accident';

    const validation = validateSeedEntropy(goodSeed);
    expect(validation.valid).toBe(true);
  });

  it('should require >75% unique words', () => {
    // Create seed with exactly 75% unique words (9 of 12)
    const borderlineSeed = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word1 word2 word3';

    const validation = validateSeedEntropy(borderlineSeed);
    expect(validation.valid).toBe(true); // Boundary case should pass
  });
});
```

### 6. Memory Cleanup Testing Pattern

Test that sensitive data is cleared from memory:

```typescript
describe('Memory Cleanup', () => {
  it('should clear sensitive data after operation', async () => {
    const sensitiveData = 'private-key-or-seed';
    const mockClearFn = jest.spyOn(CryptoUtils, 'clearSensitiveData');

    try {
      await importPrivateKey(sensitiveData, 'Test Account');
    } catch (error) {
      // Even if operation fails, cleanup should happen
    }

    // Verify clearSensitiveData was called
    expect(mockClearFn).toHaveBeenCalledWith(sensitiveData);

    mockClearFn.mockRestore();
  });

  it('should clear data in finally block', async () => {
    const mockClearFn = jest.spyOn(CryptoUtils, 'clearSensitiveData');

    // Force an error
    jest.spyOn(WalletStorage, 'addAccount').mockRejectedValue(new Error('Storage error'));

    try {
      await importPrivateKey('test-key', 'Account');
    } catch (error) {
      // Expected to fail
    }

    // Cleanup should still happen
    expect(mockClearFn).toHaveBeenCalled();

    mockClearFn.mockRestore();
  });
});
```

---

## Component Testing (React)

### Component Testing Pattern

```typescript
describe('ComponentName', () => {
  it('renders with required props', () => {
    // Arrange
    const props = { /* ... */ };

    // Act
    render(<ComponentName {...props} />);

    // Assert
    expect(screen.getByRole('...')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Testing Pattern

```typescript
describe('useCustomHook', () => {
  it('returns expected initial state', () => {
    const { result } = renderHook(() => useCustomHook());
    expect(result.current.value).toBe(expectedValue);
  });

  it('updates state correctly', async () => {
    const { result } = renderHook(() => useCustomHook());

    await act(async () => {
      await result.current.updateValue(newValue);
    });

    expect(result.current.value).toBe(newValue);
  });
});
```

---

## Bitcoin-Specific Testing

### BIP Standards Testing

Use official BIP test vectors and known derivations:

```typescript
it('should derive correct path for BIP44 legacy', () => {
  const wallet = new HDWallet(TEST_SEED, 'testnet');
  const node = wallet.deriveAddressNode('legacy', 0, 0, 0);

  // Verify path: m/44'/1'/0'/0/0 for testnet legacy
  const expectedPath = "m/44'/1'/0'/0/0";
  const expectedNode = wallet.derivePath(expectedPath);
  expect(node.toBase58()).toBe(expectedNode.toBase58());
});
```

### Bitcoin Address Testing

Test address generation with known keys and verify prefixes:

```typescript
it('should generate testnet native segwit address', () => {
  const generator = new AddressGenerator('testnet');
  const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
  const address = generator.generateAddress(node, 'native-segwit');

  // Testnet native segwit starts with 'tb1'
  expect(address.startsWith('tb1')).toBe(true);
  expect(generator.validateAddress(address)).toBe(true);
});
```

### Transaction Building Testing

Test UTXO selection and transaction construction:

```typescript
it('should select UTXOs and build transaction', async () => {
  const utxos = [createMockUTXO(100000, 0)];
  const params = {
    utxos,
    outputs: [{ address: recipientAddress, amount: 50000 }],
    changeAddress,
    feeRate: 5,
    getPrivateKey,
    getAddressType,
    getDerivationPath,
  };

  const result = await builder.buildTransaction(params);

  expect(result.txHex).toBeDefined();
  expect(result.fee).toBeGreaterThan(0);
  expect(result.inputs.length).toBe(1);
});
```

### Multisig and BIP67 Testing

Test order-independence and deterministic key sorting for multisig wallets:

```typescript
describe('BIP67 key sorting', () => {
  it('should ensure all co-signers generate same sorted order', () => {
    // Simulate 3 co-signers receiving keys in different orders
    const cosigner1Keys = [key1, key2, key3];
    const cosigner2Keys = [key3, key1, key2];
    const cosigner3Keys = [key2, key3, key1];

    const sorted1 = sortPublicKeys(cosigner1Keys);
    const sorted2 = sortPublicKeys(cosigner2Keys);
    const sorted3 = sortPublicKeys(cosigner3Keys);

    // All should have identical sorted order
    for (let i = 0; i < 3; i++) {
      expect(sorted1[i].equals(sorted2[i])).toBe(true);
      expect(sorted2[i].equals(sorted3[i])).toBe(true);
    }
  });

  it('should validate multisig configuration', () => {
    const keys = [key1, key2, key3];

    // Validate keys are suitable for 2-of-3 multisig
    expect(() => validateMultisigKeys(keys, 2, 15)).not.toThrow();

    // Sort keys for address generation
    const sorted = sortPublicKeys(keys);
    expect(areKeysSorted(sorted)).toBe(true);

    // Verify all keys are present
    expect(publicKeysMatch(keys, sorted)).toBe(true);
  });
});
```

---

## Crypto & Security Testing

### Encryption/Decryption Round-Trip

```typescript
it('should encrypt and decrypt data successfully', async () => {
  const plaintext = 'sensitive data';
  const password = 'test-password';

  // Encrypt
  const encrypted = await CryptoUtils.encrypt(plaintext, password);
  expect(encrypted.encryptedData).toBeDefined();
  expect(encrypted.salt).toBeDefined();
  expect(encrypted.iv).toBeDefined();

  // Decrypt
  const decrypted = await CryptoUtils.decrypt(
    encrypted.encryptedData,
    password,
    encrypted.salt,
    encrypted.iv
  );

  expect(decrypted).toBe(plaintext);
});
```

### Randomness Verification

```typescript
it('produces different outputs for same input (randomness)', async () => {
  const input = 'test input';

  const result1 = await cryptoFunction(input);
  const result2 = await cryptoFunction(input);

  expect(result1).not.toBe(result2);
});
```

### Test Vector Validation

```typescript
it('produces correct output for test vector', async () => {
  const input = 'known test vector input';
  const expectedOutput = 'known test vector output';

  const result = await cryptoFunction(input);

  expect(result).toBe(expectedOutput);
});
```

---

## Test Files Overview

### Core Wallet Logic Tests

| Test File | Tests | Coverage | Status | Focus Area |
|-----------|-------|----------|--------|------------|
| **CryptoUtils.test.ts** | 52 | 94%+ | ✅ | AES-256-GCM encryption, PBKDF2 |
| **KeyManager.test.ts** | 48 | 100% | ✅ | BIP39 mnemonic, validation, seeds |
| **HDWallet.test.ts** | 78 | 95% | ✅ | BIP32/44/49/84 HD wallet |
| **AddressGenerator.test.ts** | 61 | 84% | ✅ | Bitcoin address generation |
| **TransactionBuilder.test.ts** | 33 | 86% | ✅ | Transaction building, UTXO selection |
| **BlockstreamClient.test.ts** | 30 | 93% | ✅ | Blockchain API integration |
| **WalletStorage.test.ts** | 65 | 87% | ✅ | Secure wallet persistence |

### Multisig Tests

| Test File | Tests | Coverage | Status | Focus Area |
|-----------|-------|----------|--------|------------|
| **bip67.test.ts** | 52 | 100% | ✅ | BIP67 key sorting |
| **MultisigManager.test.ts** | 35 | - | ⏳ | Xpub export/import (needs fixes) |
| **PSBTManager.test.ts** | 50 | - | ⏳ | PSBT operations (needs fixes) |

### Account Management Tests

| Test File | Tests | Status | Focus Area |
|-----------|-------|--------|------------|
| **KeyManager.accountImport.test.ts** | 68 | ✅ | WIF validation, encoding/decoding |
| **WalletStorage.accountImport.test.ts** | 30 | ✅ | Imported key storage |
| **CryptoUtils.encryptWithKey.test.ts** | 50 | ✅ | Key-based encryption |

### Contacts v2.0 Tests

| Test File | Tests | Coverage | Status | Focus Area |
|-----------|-------|----------|--------|------------|
| **ContactsCrypto.test.ts** | 45+ | 100% | ✅ | Contact encryption |
| **XpubValidator.test.ts** | 70+ | 95%+ | ✅ | Xpub validation |
| **XpubAddressDerivation.test.ts** | 65+ | 95%+ | ✅ | Address derivation |
| **ContactsStorage.test.ts** | 85+ | 90%+ | ✅ | Contact CRUD operations |

### Wallet Restore Tests (Planned - v0.11.0)

| Test File | Tests | Coverage Target | Status | Focus Area |
|-----------|-------|-----------------|--------|------------|
| **WIFManager.deriveAddress.test.ts** | 15 | 100% | 📋 Planned | Address derivation from WIF |
| **CreateWalletFromPrivateKey.test.ts** | 20 | 95% | 📋 Planned | Non-HD wallet creation |
| **WalletValidation.test.ts** | 10 | 100% | 📋 Planned | Wallet structure validation |
| **NonHDTransactionSigning.test.ts** | 8 | 95% | 📋 Planned | Signing with imported keys |
| **PrivateKeyImport.test.tsx** | 12 | 85% | 📋 Planned | Frontend import UI |

**Total Planned**: ~65 unit tests
**Documentation**: See `prompts/docs/plans/WALLET_RESTORE_TEST_PLAN.md`

**Key Testing Focus Areas**:
- WIF format validation (compressed/uncompressed)
- Network validation (testnet/mainnet)
- Address type compatibility (uncompressed = legacy only)
- Non-HD wallet structure (encryptedSeed = '')
- Transaction signing without HD derivation
- Rate limiting (3 attempts per 15 minutes)
- Change address reuse in non-HD wallets

---

## Best Practices

### DO ✅

- Test behavior, not implementation
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies (APIs, Chrome APIs)
- Use official test vectors for Bitcoin operations
- Test edge cases and error paths
- Clean up after each test
- Follow AAA pattern (Arrange-Act-Assert)
- Test security properties (no data leaks, proper randomness)

### DON'T ❌

- Test implementation details
- Use real API calls in unit tests
- Use real private keys or mainnet data
- Leave console.log statements in tests
- Write tests that depend on execution order
- Ignore flaky tests
- Lower coverage thresholds for critical code

---

## Coverage Targets

| Code Category | Coverage Target | Enforcement |
|---------------|----------------|-------------|
| **Security-critical** (CryptoUtils, KeyManager) | 100% | jest.config.js threshold |
| **Bitcoin wallet logic** | 80% | CI enforcement |
| **API & Storage** | 80% | CI enforcement |
| **React components** | 80% | CI enforcement |
| **Overall** | 80% | CI blocks if below |

---

## Cross-References

- **Integration Tests**: See [integration.md](./integration.md)
- **Test Infrastructure**: See [infrastructure.md](./infrastructure.md)
- **Testing Decisions**: See [decisions.md](./decisions.md)
