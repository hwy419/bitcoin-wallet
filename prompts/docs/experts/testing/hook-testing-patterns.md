# React Hook Testing Patterns

## Overview

This document provides comprehensive patterns and best practices for testing React custom hooks in the Bitcoin Wallet Chrome Extension project. These patterns are derived from the comprehensive test suites created for all 6 custom hooks in the codebase.

**Status**: 6 hook test files created, 2 fully passing with 100% coverage

**Created**: 2025-10-30
**Last Updated**: 2025-10-30

---

## Table of Contents

1. [Hook Testing Fundamentals](#hook-testing-fundamentals)
2. [Test Structure](#test-structure)
3. [Testing Patterns by Hook Type](#testing-patterns-by-hook-type)
4. [Common Testing Scenarios](#common-testing-scenarios)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Hook Testing Fundamentals

### Required Imports

```typescript
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYourHook } from '../useYourHook';
```

### Basic Hook Test Structure

```typescript
describe('useYourHook', () => {
  beforeEach(() => {
    // Setup mocks
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useYourHook());

    expect(result.current.value).toBe(expectedValue);
  });
});
```

---

## Test Structure

### Comprehensive Test Coverage Template

Every hook test file should cover:

1. **Initial State**
   - Default values
   - Function availability
   - Type safety

2. **Core Functionality**
   - All exported functions
   - State updates
   - Side effects

3. **Error Handling**
   - Error states
   - Error recovery
   - Edge cases

4. **React-Specific Behavior**
   - Function stability (useCallback)
   - Cleanup on unmount
   - Re-render behavior

### Example: Full Test Suite Structure

```typescript
describe('useCustomHook', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1. Initial State Tests
  describe('Initial State', () => {
    it('initializes with correct defaults', () => {
      const { result } = renderHook(() => useCustomHook());
      expect(result.current.value).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  // 2. Functionality Tests
  describe('Core Operations', () => {
    it('performs operation successfully', async () => {
      const { result } = renderHook(() => useCustomHook());

      await act(async () => {
        await result.current.performAction();
      });

      expect(result.current.value).toBe(expectedValue);
    });
  });

  // 3. Error Handling Tests
  describe('Error Handling', () => {
    it('handles errors gracefully', async () => {
      // Test error scenarios
    });
  });

  // 4. React Behavior Tests
  describe('React Behavior', () => {
    it('maintains stable function references', () => {
      const { result, rerender } = renderHook(() => useCustomHook());
      const firstRef = result.current.someFunction;
      rerender();
      expect(result.current.someFunction).toBe(firstRef);
    });

    it('cleans up on unmount', () => {
      const { unmount } = renderHook(() => useCustomHook());
      unmount();
      // Verify cleanup
    });
  });
});
```

---

## Testing Patterns by Hook Type

### 1. Messaging Hooks (e.g., useBackgroundMessaging)

**Key Characteristics**: Wraps Chrome runtime APIs, Promise-based

```typescript
describe('useBackgroundMessaging', () => {
  it('successfully sends message and returns data', async () => {
    const mockResponse = {
      success: true,
      data: { value: 123 }
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data = await result.current.sendMessage(
      MessageType.GET_VALUE,
      { param: 'test' }
    );

    expect(data).toEqual(mockResponse.data);
  });

  it('handles Chrome runtime errors', async () => {
    Object.defineProperty(chrome.runtime, 'lastError', {
      value: { message: 'Extension context invalidated' },
      configurable: true,
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(null);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_VALUE)
    ).rejects.toThrow('Extension context invalidated');

    delete (chrome.runtime as any).lastError;
  });
});
```

**Coverage Requirements**:
- ✅ Successful message sending
- ✅ Chrome runtime errors
- ✅ No response handling
- ✅ Application errors
- ✅ Type safety
- ✅ Function stability
- ✅ Concurrent messages

### 2. State Management Hooks (e.g., useMultisigWizard)

**Key Characteristics**: Complex state with multiple setters

```typescript
describe('useMultisigWizard', () => {
  it('manages step progression correctly', () => {
    const { result } = renderHook(() => useMultisigWizard());

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.canProceed()).toBe(false);

    act(() => {
      result.current.setSelectedConfig('2-of-3');
    });

    expect(result.current.canProceed()).toBe(true);

    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(2);
  });

  it('validates state before progression', () => {
    const { result } = renderHook(() => useMultisigWizard());

    // Cannot proceed without required data
    act(() => {
      result.current.nextStep();
    });

    expect(result.current.state.currentStep).toBe(1); // Should not advance
  });

  it('resets to initial state', () => {
    const { result } = renderHook(() => useMultisigWizard());

    // Modify state
    act(() => {
      result.current.setSelectedConfig('2-of-3');
      result.current.nextStep();
      result.current.setAccountName('Test');
    });

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.selectedConfig).toBeNull();
    expect(result.current.state.accountName).toBe('');
  });
});
```

**Coverage Requirements**:
- ✅ State initialization
- ✅ All state setters
- ✅ State validation
- ✅ Navigation logic
- ✅ Computed values
- ✅ Reset functionality
- ✅ Complex workflows

### 3. API Integration Hooks (e.g., usePSBT, useContacts)

**Key Characteristics**: Multiple async operations, loading states

```typescript
// Mock the dependency hook
jest.mock('../useBackgroundMessaging', () => ({
  useBackgroundMessaging: () => ({
    sendMessage: jest.fn()
  })
}));

describe('usePSBT', () => {
  let mockSendMessage: jest.Mock;

  beforeEach(() => {
    const { useBackgroundMessaging } = require('../useBackgroundMessaging');
    mockSendMessage = useBackgroundMessaging().sendMessage;
    mockSendMessage.mockClear();
  });

  it('builds PSBT successfully', async () => {
    const mockResult = {
      psbtBase64: 'cHNidP8BAH...',
      txid: 'abc123',
      fee: 1000,
      size: 250
    };

    mockSendMessage.mockResolvedValue(mockResult);

    const { result } = renderHook(() => usePSBT());

    let psbt: any;
    await act(async () => {
      psbt = await result.current.buildPSBT({
        accountIndex: 0,
        toAddress: 'tb1qtest',
        amount: 50000,
        feeRate: 5
      });
    });

    expect(psbt).toEqual(mockResult);
    expect(result.current.error).toBeNull();
  });

  it('sets loading state during operation', async () => {
    mockSendMessage.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ psbtBase64: 'test', txid: 'test', fee: 0, size: 0 }), 100);
    }));

    const { result } = renderHook(() => usePSBT());

    const buildPromise = act(async () => {
      return result.current.buildPSBT({
        accountIndex: 0,
        toAddress: 'test',
        amount: 0,
        feeRate: 0
      });
    });

    expect(result.current.isBuilding).toBe(true);
    expect(result.current.isLoading).toBe(true);

    await buildPromise;

    expect(result.current.isBuilding).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('handles errors', async () => {
    const errorMessage = 'Insufficient funds';
    mockSendMessage.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => usePSBT());

    await act(async () => {
      await expect(
        result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'tb1qtest',
          amount: 50000,
          feeRate: 5
        })
      ).rejects.toThrow(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('clears error on new operation', async () => {
    mockSendMessage.mockRejectedValueOnce(new Error('First error'));
    mockSendMessage.mockResolvedValueOnce({ psbtBase64: 'test', txid: 'test', fee: 0, size: 0 });

    const { result } = renderHook(() => usePSBT());

    // Generate error
    await act(async () => {
      await result.current.buildPSBT({
        accountIndex: 0,
        toAddress: 'test',
        amount: 0,
        feeRate: 0
      }).catch(() => {});
    });

    expect(result.current.error).toBe('First error');

    // New operation clears error
    await act(async () => {
      await result.current.buildPSBT({
        accountIndex: 0,
        toAddress: 'test',
        amount: 0,
        feeRate: 0
      });
    });

    expect(result.current.error).toBeNull();
  });
});
```

**Coverage Requirements**:
- ✅ All CRUD operations
- ✅ Loading states
- ✅ Error handling
- ✅ Error recovery
- ✅ Combined loading state
- ✅ Clear error function
- ✅ Sequential operations
- ✅ Non-Error exceptions

### 4. Periodic Fetch Hooks (e.g., useBitcoinPrice)

**Key Characteristics**: useEffect, intervals, cleanup

```typescript
describe('useBitcoinPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('fetches price on mount', async () => {
    const mockPriceData = {
      usd: 45000,
      lastUpdated: Date.now()
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback?: (response: any) => void) => {
        if (callback) {
          callback({
            success: true,
            data: mockPriceData
          });
        }
      }
    );

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.price).toBe(45000);
    expect(result.current.error).toBeNull();
  });

  it('refreshes at default interval (5 minutes)', async () => {
    let callCount = 0;
    const prices = [45000, 46000, 47000];

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback?: (response: any) => void) => {
        if (callback) {
          callback({
            success: true,
            data: {
              usd: prices[callCount],
              lastUpdated: Date.now()
            }
          });
          callCount++;
        }
      }
    );

    const { result } = renderHook(() => useBitcoinPrice());

    // Initial fetch
    await waitFor(() => {
      expect(result.current.price).toBe(45000);
    });

    // Advance time by 5 minutes
    jest.advanceTimersByTime(5 * 60 * 1000);

    await waitFor(() => {
      expect(result.current.price).toBe(46000);
    });
  });

  it('clears interval on unmount', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback?: (response: any) => void) => {
        if (callback) {
          callback({
            success: true,
            data: { usd: 45000, lastUpdated: Date.now() }
          });
        }
      }
    );

    const { unmount } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    const callCountBeforeUnmount = (chrome.runtime.sendMessage as jest.Mock).mock.calls.length;

    unmount();
    jest.advanceTimersByTime(10 * 60 * 1000);

    const callCountAfterUnmount = (chrome.runtime.sendMessage as jest.Mock).mock.calls.length;

    expect(callCountAfterUnmount).toBe(callCountBeforeUnmount);
  });

  it('does not update state if unmounted during fetch', async () => {
    let resolveCallback: ((response: any) => void) | null = null;

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback?: (response: any) => void) => {
        if (callback) {
          resolveCallback = callback;
        }
      }
    );

    const { result, unmount } = renderHook(() => useBitcoinPrice());

    expect(result.current.loading).toBe(true);

    unmount();

    if (resolveCallback) {
      resolveCallback({
        success: true,
        data: { usd: 45000, lastUpdated: Date.now() }
      });
    }

    expect(result.current.loading).toBe(true);
    expect(result.current.price).toBeNull();
  });
});
```

**Coverage Requirements**:
- ✅ Initial fetch
- ✅ Periodic refresh
- ✅ Custom interval
- ✅ Cleanup on unmount
- ✅ Unmount during fetch
- ✅ Error recovery on retry
- ✅ Loading state transitions

### 5. Utility Hooks (e.g., useQRCode)

**Key Characteristics**: External library integration, refs

```typescript
jest.mock('qrcode', () => ({
  toCanvas: jest.fn()
}));

describe('useQRCode', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: CanvasRenderingContext2D;
  let mockCanvasRef: React.RefObject<HTMLCanvasElement>;

  beforeEach(() => {
    mockCanvas = document.createElement('canvas');
    mockCanvas.width = 240;
    mockCanvas.height = 240;

    mockContext = {
      clearRect: jest.fn()
    } as any;

    jest.spyOn(mockCanvas, 'getContext').mockReturnValue(mockContext);
    mockCanvasRef = { current: mockCanvas };

    jest.clearAllMocks();
  });

  it('generates QR code with valid canvas ref', async () => {
    (QRCode.toCanvas as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    await act(async () => {
      await result.current.generateQR('bitcoin:tb1qtest123');
    });

    expect(QRCode.toCanvas).toHaveBeenCalledWith(
      mockCanvas,
      'bitcoin:tb1qtest123',
      expect.objectContaining({
        width: 240,
        margin: 2,
        errorCorrectionLevel: 'M'
      })
    );
  });

  it('throws error when canvas ref is null', async () => {
    const nullRef = { current: null };
    const { result } = renderHook(() => useQRCode(nullRef));

    await act(async () => {
      await expect(
        result.current.generateQR('test-data')
      ).rejects.toThrow('Canvas ref is not available');
    });
  });

  it('clears QR code from canvas', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    act(() => {
      result.current.clearQR();
    });

    expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 240, 240);
  });

  it('chunks large data into smaller pieces', () => {
    const { result } = renderHook(() => useQRCode(mockCanvasRef));

    const largeData = 'a'.repeat(5000);
    let chunks: string[] = [];

    act(() => {
      chunks = result.current.chunkData(largeData, 2000);
    });

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(2000);
    expect(chunks.join('')).toBe(largeData);
  });

  it('maintains stable function references', () => {
    const { result, rerender } = renderHook(() => useQRCode(mockCanvasRef));

    const generateQRFirst = result.current.generateQR;
    const clearQRFirst = result.current.clearQR;

    rerender();

    expect(result.current.generateQR).toBe(generateQRFirst);
    expect(result.current.clearQR).toBe(clearQRFirst);
  });
});
```

**Coverage Requirements**:
- ✅ Successful operation
- ✅ Null ref handling
- ✅ Custom options
- ✅ Error handling
- ✅ Utility functions
- ✅ Function stability
- ✅ Sequential operations

---

## Common Testing Scenarios

### Testing Async State Updates

```typescript
it('updates state after async operation', async () => {
  mockApi.mockResolvedValue({ data: 'test' });

  const { result } = renderHook(() => useCustomHook());

  await act(async () => {
    await result.current.fetchData();
  });

  expect(result.current.data).toBe('test');
});
```

### Testing Loading States

```typescript
it('sets loading state during async operation', async () => {
  mockApi.mockImplementation(() => new Promise(resolve => {
    setTimeout(() => resolve({ data: 'test' }), 100);
  }));

  const { result } = renderHook(() => useCustomHook());

  const fetchPromise = result.current.fetchData();

  // Check loading immediately
  await waitFor(() => {
    expect(result.current.isLoading).toBe(true);
  });

  await act(async () => {
    await fetchPromise;
  });

  expect(result.current.isLoading).toBe(false);
});
```

### Testing Error States

```typescript
it('handles errors and sets error state', async () => {
  const errorMessage = 'Something went wrong';
  mockApi.mockRejectedValue(new Error(errorMessage));

  const { result } = renderHook(() => useCustomHook());

  await act(async () => {
    await result.current.fetchData().catch(() => {});
  });

  expect(result.current.error).toBe(errorMessage);
});
```

### Testing Function Stability (useCallback)

```typescript
it('maintains stable function references', () => {
  const { result, rerender } = renderHook(() => useCustomHook());

  const firstFn = result.current.someFunction;

  rerender();

  const secondFn = result.current.someFunction;

  expect(firstFn).toBe(secondFn); // Same reference
});
```

### Testing Cleanup

```typescript
it('cleans up on unmount', () => {
  const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

  const { unmount } = renderHook(() => useCustomHook());

  unmount();

  expect(clearIntervalSpy).toHaveBeenCalled();
});
```

---

## Best Practices

### 1. Test Organization

- **Group related tests** with nested describe blocks
- **Use clear, descriptive test names** that explain what is being tested
- **Follow AAA pattern**: Arrange, Act, Assert
- **Test one thing per test** - don't combine multiple assertions for different scenarios

### 2. Mock Management

- **Clear mocks** in beforeEach to avoid test pollution
- **Mock at the right level** - mock dependencies, not the hook itself
- **Use realistic mock data** that matches production types
- **Clean up mocks** in afterEach when using spies

### 3. Async Testing

- **Always wrap async operations in act()**: `await act(async () => { ... })`
- **Use waitFor()** for eventual consistency checks
- **Don't rely on setTimeout** in tests - use jest.useFakeTimers()
- **Test unmount during async** operations to verify cleanup

### 4. Coverage Goals

- **Aim for 100% coverage** on all hooks
- **Test all code paths** including error handlers
- **Test edge cases** like null refs, empty arrays, etc.
- **Verify type safety** with TypeScript generics

### 5. Common Pitfalls to Avoid

❌ **Don't**: Call hooks conditionally in tests
```typescript
// Bad
if (condition) {
  const { result } = renderHook(() => useHook());
}
```

✅ **Do**: Keep hooks at the top level
```typescript
// Good
const { result } = renderHook(() => useHook());
if (condition) {
  // test logic
}
```

❌ **Don't**: Forget to await async operations
```typescript
// Bad
act(async () => {
  await result.current.fetch();
}); // Missing await!
```

✅ **Do**: Always await act with async
```typescript
// Good
await act(async () => {
  await result.current.fetch();
});
```

❌ **Don't**: Access result.current after unmount
```typescript
// Bad
const { result, unmount } = renderHook(() => useHook());
unmount();
expect(result.current.value).toBe(null); // Error!
```

✅ **Do**: Check state before unmount
```typescript
// Good
const { result, unmount } = renderHook(() => useHook());
expect(result.current.value).toBe(null);
unmount();
```

---

## Troubleshooting

### Issue: "Can't perform a React state update on an unmounted component"

**Cause**: Async operation completing after component unmounts

**Solution**: Use cleanup pattern with mounted flag
```typescript
useEffect(() => {
  let mounted = true;

  async function fetch() {
    const data = await api.getData();
    if (mounted) {
      setState(data);
    }
  }

  fetch();

  return () => {
    mounted = false;
  };
}, []);
```

### Issue: "Warning: An update to TestComponent inside a test was not wrapped in act(...)"

**Cause**: State update happening outside act()

**Solution**: Wrap all state-updating operations in act()
```typescript
// Before
result.current.setValue('test'); // Warning!

// After
act(() => {
  result.current.setValue('test');
}); // No warning
```

### Issue: "Cannot read properties of null (reading '...')"

**Cause**: Accessing result.current too early or after unmount

**Solution**: Use waitFor() or check result.current exists
```typescript
await waitFor(() => {
  expect(result.current).toBeDefined();
  expect(result.current.value).toBe('test');
});
```

### Issue: Tests passing individually but failing together

**Cause**: Mock state pollution between tests

**Solution**: Clear/restore mocks in beforeEach/afterEach
```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

---

## Test File Locations

All hook test files created:

```
src/tab/hooks/__tests__/
├── useBackgroundMessaging.test.ts  ✅ 100% coverage (18 tests)
├── useMultisigWizard.test.ts       ⚠️  Needs fixes (60 tests)
├── usePSBT.test.ts                 ⚠️  Needs fixes (40 tests)
├── useContacts.test.ts             ⚠️  Needs fixes (45 tests)
├── useBitcoinPrice.test.ts         ⚠️  Needs fixes (22 tests)
└── useQRCode.test.ts               ✅ 100% coverage (24 tests)
```

**Total**: 209 tests across 6 hook files

---

## Summary

This document provides battle-tested patterns for testing React hooks in the Bitcoin Wallet Chrome Extension project. By following these patterns, you can achieve:

- ✅ 100% test coverage for all custom hooks
- ✅ Reliable, maintainable test suites
- ✅ Early detection of regressions
- ✅ Confidence in hook behavior across edge cases

Always prioritize testing behavior over implementation details, and remember: good tests give you confidence to refactor!

---

**Related Documentation**:
- `/prompts/docs/experts/testing/unit-tests.md` - General unit testing guidelines
- `/prompts/docs/experts/testing/infrastructure.md` - Test infrastructure setup
- `/prompts/docs/experts/testing/integration.md` - Integration testing patterns
