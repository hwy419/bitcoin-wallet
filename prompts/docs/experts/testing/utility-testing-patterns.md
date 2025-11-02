# Utility Testing Patterns

**Last Updated**: October 31, 2025
**Status**: Active
**Coverage**: 235 utility tests created (6 utility files with 98-100% coverage)

---

## Overview

This document outlines comprehensive testing patterns for utility functions in the Bitcoin Wallet project. These patterns ensure 100% coverage of utility modules with clear, maintainable tests.

## Completed Utility Tests

### Summary
- **Total Tests**: 235 tests across 6 utility files
- **Coverage**: 98-100% for tested utilities
- **Test Execution**: < 1 second for all utility tests
- **Status**: All tests passing ✅

### Test Files Created

| Utility Module | Test File | Tests | Coverage | Status |
|----------------|-----------|-------|----------|--------|
| `fileDownload.ts` | `fileDownload.test.ts` | 19 tests | 100% | ✅ |
| `fileReader.ts` | `fileReader.test.ts` | 37 tests | 100% | ✅ |
| `price.ts` | `price.test.ts` | 38 tests | 100% | ✅ |
| `batchUtils.ts` | `batchUtils.test.ts` | 25 tests | 100% | ✅ |
| `csvHelpers.ts` | `csvHelpers.test.ts` | 59 tests | 100% | ✅ NEW |
| `contactMatcher.ts` | `contactMatcher.test.ts` | 57 tests | 97.36% | ✅ NEW |

---

## Testing Patterns by Utility Type

### 1. File Download Utilities (fileDownload.ts)

**Pattern**: Mock DOM APIs and verify file creation

```typescript
describe('downloadEncryptedKey', () => {
  let mockCreateElement: jest.SpyInstance;
  let mockAppendChild: jest.SpyInstance;
  let mockRemoveChild: jest.SpyInstance;
  let mockClick: jest.Mock;
  let mockAnchor: HTMLAnchorElement;

  beforeEach(() => {
    // Mock anchor element
    mockClick = jest.fn();
    mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLAnchorElement;

    // Mock DOM methods
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
    mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();

    // Mock URL methods
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock Blob
    global.Blob = jest.fn((content, options) => ({
      content,
      options,
      size: content[0].length,
      type: options?.type || '',
    })) as any;
  });

  it('triggers download with correct filename', () => {
    const data = { /* encrypted key data */ };

    downloadEncryptedKey(data, 'my-key');

    expect(mockAnchor.download).toBe('my-key.enc');
    expect(mockClick).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
```

**Key Points**:
- Mock DOM manipulation (createElement, appendChild, removeChild)
- Mock URL.createObjectURL and URL.revokeObjectURL
- Mock Blob constructor
- Verify file download triggered and resources cleaned up

### 2. File Reader Utilities (fileReader.ts)

**Pattern**: Test File API interactions and error handling

```typescript
describe('readEncryptedFile', () => {
  const createMockFile = (content: string, name: string): File => {
    const blob = new Blob([content], { type: 'application/json' });
    return new File([blob], name, { type: blob.type });
  };

  it('reads and parses valid encrypted file', async () => {
    const fileContent = JSON.stringify({
      version: 1,
      type: 'encrypted-private-key',
      encryptedData: 'data',
      salt: 'salt',
      iv: 'iv',
    });

    const file = createMockFile(fileContent, 'test.enc');
    const result = await readEncryptedFile(file);

    expect(result.encryptedData).toBe('data');
    expect(result.salt).toBe('salt');
  });

  it('throws error for malformed JSON', async () => {
    const file = createMockFile('{ invalid json }', 'test.enc');

    await expect(readEncryptedFile(file)).rejects.toThrow(
      'Invalid file format. Expected JSON encrypted key file.'
    );
  });
});
```

**Key Points**:
- Create helper function to generate mock File objects
- Test successful file reading
- Test validation errors (missing fields, wrong type)
- Test JSON parsing errors
- Test file size limits
- Test different file formats (.enc, .txt)

### 3. Price Utilities (price.ts)

**Pattern**: Test mathematical conversions and formatting

```typescript
describe('satoshisToUSD', () => {
  it('converts satoshis to USD correctly', () => {
    const pricePerBtc = 50000;
    const satoshis = 100_000_000; // 1 BTC

    const result = satoshisToUSD(satoshis, pricePerBtc);

    expect(result).toBe(50000);
  });

  it('handles fractional results', () => {
    const pricePerBtc = 50000;
    const satoshis = 1; // 0.00000001 BTC

    const result = satoshisToUSD(satoshis, pricePerBtc);

    expect(result).toBe(0.0005);
  });
});

describe('formatUSD', () => {
  it('formats amounts with thousand separators', () => {
    expect(formatUSD(1000)).toBe('$1,000.00');
    expect(formatUSD(1000000)).toBe('$1,000,000.00');
  });

  it('formats very small amounts as <$0.01', () => {
    expect(formatUSD(0.009)).toBe('<$0.01');
    expect(formatUSD(0.00001)).toBe('<$0.01');
  });
});
```

**Key Points**:
- Test edge cases (zero, negative, very large, very small)
- Test precision (fractional amounts, rounding)
- Test formatting (thousand separators, decimal places)
- Test different formatting options (with/without symbol)

### 4. Batch Processing Utilities (batchUtils.ts)

**Pattern**: Test async operations with fake timers

```typescript
describe('fetchInBatches', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('processes items in batches with delays', async () => {
    const items = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
    const fetchFunction = jest.fn().mockResolvedValue('success');

    const promise = fetchInBatches(items, fetchFunction);

    await jest.runAllTimersAsync();

    const result = await promise;

    expect(result.total).toBe(6);
    expect(result.successCount).toBe(6);
    expect(fetchFunction).toHaveBeenCalledTimes(6);
  });

  it('handles partial failures', async () => {
    const items = ['success1', 'fail1', 'success2'];
    const fetchFunction = jest.fn((item: string) => {
      if (item.startsWith('fail')) {
        return Promise.reject(new Error('Failed'));
      }
      return Promise.resolve('Result');
    });

    const promise = fetchInBatches(items, fetchFunction);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result.successCount).toBe(2);
    expect(result.errorCount).toBe(1);
  });
});
```

**Key Points**:
- Use `jest.useFakeTimers()` for testing delays
- Use `jest.runAllTimersAsync()` to advance timers
- Test batch processing logic
- Test error handling (partial failures)
- Test parallel vs sequential execution

### Retry Logic with Error Handling

```typescript
describe('retryWithBackoff', () => {
  it('retries on failure and succeeds', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValueOnce('success');

    const promise = retryWithBackoff(operation, 3, 1000);
    await jest.runAllTimersAsync();

    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('returns error after max retries', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const operation = jest.fn(async () => {
      throw new Error('Always fails');
    });

    // Catch the rejection to prevent unhandled promise rejection
    const result = retryWithBackoff(operation, 3, 1000).catch((err) => err);

    await jest.runAllTimersAsync();

    const error = await result;
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain('Always fails');

    consoleWarnSpy.mockRestore();
  });
});
```

**Key Points**:
- Suppress console.warn for expected errors
- Use `.catch((err) => err)` pattern to handle expected rejections
- Verify retry attempts and exponential backoff
- Test success after retries

---

## Common Testing Patterns

### 1. Mock Setup Pattern

```typescript
describe('utility', () => {
  let mockDependency: jest.Mock;

  beforeEach(() => {
    mockDependency = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses dependency correctly', () => {
    // Test using mockDependency
  });
});
```

### 2. Error Testing Pattern

```typescript
it('throws error for invalid input', async () => {
  const invalidInput = /* ... */;

  await expect(utilityFunction(invalidInput)).rejects.toThrow(
    'Expected error message'
  );
});

// OR for synchronous functions
it('throws error for invalid input', () => {
  const invalidInput = /* ... */;

  expect(() => utilityFunction(invalidInput)).toThrow(
    'Expected error message'
  );
});
```

### 3. Edge Case Testing Pattern

```typescript
describe('edge cases', () => {
  it('handles empty input', () => {
    expect(utilityFunction('')).toBe(expectedValue);
  });

  it('handles null input', () => {
    expect(utilityFunction(null)).toBe(expectedValue);
  });

  it('handles undefined input', () => {
    expect(utilityFunction(undefined)).toBe(expectedValue);
  });

  it('handles very large input', () => {
    const largeInput = /* ... */;
    expect(utilityFunction(largeInput)).toBe(expectedValue);
  });
});
```

### 4. Async Operation Pattern

```typescript
it('completes async operation', async () => {
  const promise = asyncUtility();

  // Advance timers if needed
  await jest.runAllTimersAsync();

  const result = await promise;

  expect(result).toBe(expectedValue);
});
```

---

## Best Practices

### Test Organization

1. **Group related tests** using nested `describe` blocks
2. **Use descriptive test names** that explain the scenario
3. **Test one thing** per test case
4. **Arrange-Act-Assert** pattern for clarity

### Mocking Strategy

1. **Mock external dependencies** (DOM APIs, File API, timers)
2. **Restore mocks** in `afterEach` to avoid test pollution
3. **Use spy functions** to verify calls and arguments
4. **Mock only what you need** - avoid over-mocking

### Coverage Goals

1. **Test all exported functions**
2. **Test happy path** - normal successful execution
3. **Test error paths** - validation errors, exceptions
4. **Test edge cases** - empty, null, undefined, large values
5. **Test boundary conditions** - min/max values, limits

### Error Handling

1. **Suppress expected console warnings** during tests
2. **Use `.catch((err) => err)` pattern** for expected rejections
3. **Test error messages** to ensure helpful feedback
4. **Test error types** (Error, TypeError, etc.)

### Performance

1. **Keep tests fast** (< 100ms per test)
2. **Use fake timers** for time-dependent code
3. **Mock expensive operations** (file I/O, network calls)
4. **Run tests in parallel** when possible

---

## Utility Testing Checklist

When creating tests for a new utility file:

- [ ] Create test file in `__tests__/` directory
- [ ] Import utility functions to test
- [ ] Set up necessary mocks in `beforeEach`
- [ ] Clean up mocks in `afterEach`
- [ ] Test all exported functions
- [ ] Test happy path for each function
- [ ] Test error cases for each function
- [ ] Test edge cases (empty, null, undefined, large values)
- [ ] Test with different input types
- [ ] Verify return values and side effects
- [ ] Run tests and verify 100% coverage
- [ ] Document any testing limitations

---

## Common Pitfalls and Solutions

### 1. Unhandled Promise Rejections

**Problem**: Tests fail with "Unhandled promise rejection" errors

**Solution**: Catch expected rejections
```typescript
// BAD
const promise = retryWithBackoff(operation, 3);
await jest.runAllTimersAsync();
await expect(promise).rejects.toThrow(); // Rejection already thrown!

// GOOD
const result = retryWithBackoff(operation, 3).catch((err) => err);
await jest.runAllTimersAsync();
const error = await result;
expect(error).toBeInstanceOf(Error);
```

### 2. Fake Timer Issues

**Problem**: Tests hang or timeout with fake timers

**Solution**: Always clean up timers
```typescript
afterEach(() => {
  jest.runOnlyPendingTimers(); // Clear any remaining timers
  jest.useRealTimers(); // Restore real timers
});
```

### 3. Mock Pollution

**Problem**: Mocks from one test affect another test

**Solution**: Restore mocks after each test
```typescript
afterEach(() => {
  jest.restoreAllMocks();
});
```

### 4. Console Noise

**Problem**: Tests pass but console is filled with warnings

**Solution**: Mock console methods for expected warnings
```typescript
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
// ... test code ...
consoleWarnSpy.mockRestore();
```

---

## 5. CSV Processing Utilities (csvHelpers.ts)

**Pattern**: Test CSV parsing, file validation, and download operations

### CSV Reading with FileReader API

```typescript
describe('readCSVFile', () => {
  it('reads CSV file content as text', async () => {
    const csvContent = 'name,address\nAlice,tb1q123\nBob,tb1q456';
    const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

    const result = await readCSVFile(file);

    expect(result).toBe(csvContent);
  });

  it('rejects when FileReader fails', async () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });

    // Mock FileReader to fail
    const originalFileReader = global.FileReader;
    global.FileReader = jest.fn().mockImplementation(() => ({
      readAsText: jest.fn(function (this: any) {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Event('error'));
          }
        }, 0);
      }),
    })) as any;

    await expect(readCSVFile(file)).rejects.toThrow('Failed to read file');

    global.FileReader = originalFileReader;
  });
});
```

### CSV Parsing and Preview

```typescript
describe('parseCSVPreview', () => {
  it('parses CSV data into preview rows', () => {
    const csvData = 'name,address\nAlice,tb1q123\nBob,tb1q456';

    const result = parseCSVPreview(csvData);

    expect(result).toEqual([
      { name: 'Alice', address: 'tb1q123' },
      { name: 'Bob', address: 'tb1q456' },
    ]);
  });

  it('limits preview to first 10 rows', () => {
    const rows = Array.from({ length: 20 }, (_, i) => `Contact ${i},tb1q${i}`);
    const csvData = 'name,address\n' + rows.join('\n');

    const result = parseCSVPreview(csvData);

    expect(result).toHaveLength(10);
  });

  it('handles missing values (empty cells)', () => {
    const csvData = 'name,address,notes\nAlice,tb1q123,\nBob,,Important';

    const result = parseCSVPreview(csvData);

    expect(result).toEqual([
      { name: 'Alice', address: 'tb1q123', notes: '' },
      { name: 'Bob', address: '', notes: 'Important' },
    ]);
  });
});
```

### File Validation

```typescript
describe('validateCSVFile', () => {
  it('accepts valid CSV file with .csv extension', () => {
    const file = new File(['content'], 'contacts.csv', { type: 'text/csv' });

    const result = validateCSVFile(file);

    expect(result).toBeNull();
  });

  it('rejects file larger than 1MB', () => {
    const largeContent = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

    const result = validateCSVFile(file);

    expect(result).toContain('File is too large');
    expect(result).toContain('Maximum size is 1MB');
  });
});
```

### File Download with Blob API

```typescript
describe('downloadFile', () => {
  beforeEach(() => {
    // Mock DOM APIs
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    mockClick = jest.fn();
    jest.spyOn(document, 'createElement').mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
    } as any);
  });

  it('downloads CSV file with default mime type', () => {
    const content = 'name,address\nAlice,tb1q123';
    const filename = 'contacts.csv';

    downloadFile(content, filename);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
```

**Key Points**:
- Mock FileReader API for async file reading
- Test CSV parsing with various formats (empty cells, special characters, Unicode)
- Test file validation (size limits, file types)
- Mock Blob and URL APIs for downloads
- Test edge cases (empty files, large files, malformed CSV)

---

## 6. Contact Matching Utilities (contactMatcher.ts)

**Pattern**: Test class-based utilities with complex matching logic

### Factory Functions for Test Data

```typescript
const createContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Contact',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  address: 'tb1q1234567890abcdef',
  addressType: 'native-segwit',
  ...overrides,
});

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  txid: 'abc123',
  confirmations: 6,
  timestamp: Date.now(),
  value: 100000,
  fee: 1000,
  inputs: [/* ... */],
  outputs: [/* ... */],
  ...overrides,
});
```

### Class Instantiation and Updates

```typescript
describe('ContactMatcher', () => {
  describe('constructor', () => {
    it('creates ContactMatcher with empty contacts', () => {
      const matcher = new ContactMatcher([]);
      expect(matcher).toBeInstanceOf(ContactMatcher);
    });
  });

  describe('updateContacts', () => {
    it('updates contact list', () => {
      const matcher = new ContactMatcher([createContact({ id: '1', address: 'tb1q111' })]);

      const updatedContacts = [
        createContact({ id: '1', address: 'tb1q111' }),
        createContact({ id: '2', address: 'tb1q222' }),
      ];
      matcher.updateContacts(updatedContacts);

      const found = matcher.findContactByAddress('tb1q222');
      expect(found?.id).toBe('2');
    });
  });
});
```

### Address Matching Logic

```typescript
describe('findContactByAddress', () => {
  it('finds contact by exact address match', () => {
    const contact = createContact({ address: 'tb1q123abc' });
    const matcher = new ContactMatcher([contact]);

    const found = matcher.findContactByAddress('tb1q123abc');

    expect(found).toBeDefined();
    expect(found?.id).toBe(contact.id);
  });

  it('handles case-insensitive matching', () => {
    const contact = createContact({ address: 'TB1Q123ABC' });
    const matcher = new ContactMatcher([contact]);

    const found = matcher.findContactByAddress('tb1q123abc');

    expect(found).toBeDefined();
  });

  it('finds contact with xpub by cached address', () => {
    const contact = createContact({
      address: undefined,
      xpub: 'tpubD6NzVbkrYhZ4...',
      cachedAddresses: ['tb1q111', 'tb1q222', 'tb1q333'],
    });
    const matcher = new ContactMatcher([contact]);

    const found = matcher.findContactByAddress('tb1q222');

    expect(found).toBeDefined();
  });
});
```

### Transaction Analysis

```typescript
describe('findContactsInTransaction', () => {
  it('identifies sender in incoming transaction', () => {
    const senderContact = createContact({ address: 'tb1qsender' });
    const matcher = new ContactMatcher([senderContact]);

    const tx = createTransaction({
      inputs: [{ txid: 'prev', vout: 0, address: 'tb1qsender', value: 100000 }],
      outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
    });

    const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

    expect(result.sender?.id).toBe(senderContact.id);
    expect(result.recipient).toBeUndefined();
  });

  it('excludes change addresses from recipient detection', () => {
    const matcher = new ContactMatcher([createContact()]);

    const tx = createTransaction({
      inputs: [{ txid: 'prev', vout: 0, address: 'tb1qmyaddress', value: 100000 }],
      outputs: [
        { address: 'tb1qrecipient', value: 50000, scriptPubKey: 'script1' },
        { address: 'tb1qmychange', value: 49000, scriptPubKey: 'script2' },
      ],
    });

    const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress', 'tb1qmychange']);

    // Change address is excluded from recipient detection
    expect(result.recipient).toBeUndefined();
  });
});
```

### Statistics and Reporting

```typescript
describe('getStatistics', () => {
  it('returns correct statistics for mixed contact types', () => {
    const contacts = [
      createContact({ id: '1', address: 'tb1q111' }),
      createContact({ id: '2', xpub: 'tpub2...', cachedAddresses: ['tb1q2'] }),
      createContact({ id: '3', address: 'tb1q333', xpub: 'tpub3...', cachedAddresses: ['tb1q3', 'tb1q4'] }),
    ];
    const matcher = new ContactMatcher(contacts);

    const stats = matcher.getStatistics();

    expect(stats.totalContacts).toBe(3);
    expect(stats.singleAddressContacts).toBe(2);
    expect(stats.xpubContacts).toBe(2);
    expect(stats.hybridContacts).toBe(1);
    expect(stats.totalCachedAddresses).toBe(3);
  });
});
```

**Key Points**:
- Use factory functions for complex test data
- Test class instantiation and state updates
- Test case-insensitive matching and normalization
- Test xpub support with cached addresses
- Test transaction analysis logic (sender/recipient detection)
- Test statistics calculation and edge cases
- Test large data sets for performance

---

## Next Steps

### Remaining Utilities to Test

- `accountUtils.ts` - Account utility functions
- `contactValidation.ts` - Contact validation (partial coverage exists)

### Future Improvements

1. Add integration tests for utility combinations
2. Add performance benchmarks for batch operations
3. Add stress tests for large data sets

---

## Summary

This document provides comprehensive patterns for testing utility functions with 98-100% coverage. The patterns established here ensure:

- **Reliability**: All utility functions are thoroughly tested
- **Maintainability**: Clear, consistent test patterns
- **Coverage**: 98-100% code coverage for tested utilities
- **Performance**: Fast test execution (< 1 second total)
- **Documentation**: Well-documented patterns for future utilities

**Total Impact**: 235 comprehensive utility tests ensuring critical helper functions work correctly across the application.

### Pattern Highlights

1. **File Operations**: Mock DOM and File APIs for downloads and reading
2. **CSV Processing**: Test parsing, validation, preview, and special character handling
3. **Contact Matching**: Test class-based utilities with complex logic and transactions
4. **Async Operations**: Use fake timers for batch processing and retries
5. **Edge Cases**: Test empty inputs, large data sets, malformed data, Unicode, special characters
