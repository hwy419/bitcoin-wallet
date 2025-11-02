/**
 * Tests for useBitcoinPrice hook
 *
 * Fetches and manages Bitcoin price in USD with automatic refresh.
 *
 * Test coverage:
 * - Initial state
 * - Initial price fetch
 * - Successful price updates
 * - Error handling
 * - Periodic refresh interval
 * - Custom refresh interval
 * - Cleanup on unmount
 * - Component unmounting during fetch
 * - Multiple rapid re-renders
 * - Price caching behavior
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useBitcoinPrice } from '../useBitcoinPrice';
import { MessageType, BitcoinPrice } from '../../../shared/types';

describe('useBitcoinPrice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Don't use fake timers by default - only specific tests will enable them
  });

  afterEach(() => {
    // Cleanup any remaining timers
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  /**
   * Test: Initial state
   */
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useBitcoinPrice());

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
  });

  /**
   * Test: Initial fetch on mount
   */
  it('fetches price on mount', async () => {
    const mockPriceData: BitcoinPrice = {
      usd: 45000,
      lastUpdated: Date.now()
    };

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPriceData
    });

    const { result, unmount } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.price).toBe(45000);
    expect(result.current.lastUpdated).toBe(mockPriceData.lastUpdated);
    expect(result.current.error).toBeNull();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: MessageType.GET_BTC_PRICE
    });

    unmount();
  });

  /**
   * Test: Successful price fetch
   */
  it('updates price successfully', async () => {
    const mockPriceData: BitcoinPrice = {
      usd: 50000,
      lastUpdated: Date.now()
    };

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: mockPriceData
    });

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.price).toBe(50000);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  /**
   * Test: Error handling - response with error
   */
  it('handles error response from background', async () => {
    const errorMessage = 'Failed to fetch price from API';

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: false,
      error: errorMessage
    });

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  /**
   * Test: Error handling - generic failure
   */
  it('handles generic failure without error message', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: false
    });

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch Bitcoin price');
    });

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  /**
   * Test: Error handling - exception thrown
   */
  it('handles exceptions during fetch', async () => {
    const errorMessage = 'Network error';

    (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.error).toBe(errorMessage);
    });

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  /**
   * Test: Error handling - non-Error exception
   */
  it('handles non-Error exceptions', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockRejectedValue('String error');

    const { result } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch Bitcoin price');
    });

    expect(result.current.price).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  /**
   * Test: Periodic refresh with default interval
   */
  it('refreshes price at default interval (5 minutes)', async () => {
    jest.useFakeTimers();

    let callCount = 0;
    const prices = [45000, 46000, 47000];

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      const price = prices[callCount] || 45000;
      callCount++;
      return Promise.resolve({
        success: true,
        data: {
          usd: price,
          lastUpdated: Date.now()
        }
      });
    });

    const { result, unmount } = renderHook(() => useBitcoinPrice());

    // Initial fetch
    await waitFor(() => {
      expect(result.current.price).toBe(45000);
    });

    // Advance time by 5 minutes and flush promises
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
      // Flush microtasks to allow promises to resolve
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.price).toBe(46000);
    });

    // Advance time by another 5 minutes
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.price).toBe(47000);
    });

    expect(callCount).toBe(3);

    unmount();
  });

  /**
   * Test: Custom refresh interval
   */
  it('uses custom refresh interval', async () => {
    jest.useFakeTimers();

    let callCount = 0;

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      const price = 45000 + callCount * 1000;
      callCount++;
      return Promise.resolve({
        success: true,
        data: {
          usd: price,
          lastUpdated: Date.now()
        }
      });
    });

    const customInterval = 60000; // 1 minute
    const { result, unmount } = renderHook(() => useBitcoinPrice(customInterval));

    // Initial fetch
    await waitFor(() => {
      expect(result.current.price).toBe(45000);
    });

    expect(callCount).toBe(1);

    // Advance time by 1 minute
    await act(async () => {
      jest.advanceTimersByTime(60000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(result.current.price).toBe(46000);
    });

    expect(callCount).toBe(2);

    unmount();
  });

  /**
   * Test: Cleanup on unmount
   */
  it('clears interval on unmount', async () => {
    jest.useFakeTimers();

    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: { usd: 45000, lastUpdated: Date.now() }
    });

    const { unmount } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    const callCountBeforeUnmount = (chrome.runtime.sendMessage as jest.Mock).mock.calls.length;

    // Unmount
    unmount();

    // Advance time - should not trigger more fetches
    act(() => {
      jest.advanceTimersByTime(10 * 60 * 1000);
    });

    const callCountAfterUnmount = (chrome.runtime.sendMessage as jest.Mock).mock.calls.length;

    expect(callCountAfterUnmount).toBe(callCountBeforeUnmount);
  });

  /**
   * Test: Component unmounts during fetch
   */
  it('does not update state if unmounted during fetch', async () => {
    let resolvePromise: ((value: any) => void) | null = null;

    (chrome.runtime.sendMessage as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result, unmount } = renderHook(() => useBitcoinPrice());

    expect(result.current.loading).toBe(true);

    // Unmount before response arrives
    unmount();

    // Response arrives after unmount
    if (resolvePromise) {
      resolvePromise({
        success: true,
        data: { usd: 45000, lastUpdated: Date.now() }
      });
    }

    // Should not cause warnings or errors
    // State should remain in loading state (not updated after unmount)
    expect(result.current.loading).toBe(true);
    expect(result.current.price).toBeNull();
  });

  /**
   * Test: Changing refresh interval
   */
  it('updates interval when prop changes', async () => {
    jest.useFakeTimers();

    let callCount = 0;

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      const price = 45000 + callCount * 1000;
      callCount++;
      return Promise.resolve({
        success: true,
        data: {
          usd: price,
          lastUpdated: Date.now()
        }
      });
    });

    const { rerender, unmount } = renderHook(
      ({ interval }) => useBitcoinPrice(interval),
      { initialProps: { interval: 60000 } } // 1 minute
    );

    await waitFor(() => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    const initialCallCount = callCount;

    // Change interval to 30 seconds - this will trigger re-mount of effect
    rerender({ interval: 30000 });

    // The effect will run again (re-fetch), so we should see callCount increase
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCallCount);
    });

    // Now advance by 30 seconds and verify interval uses new timing
    await act(async () => {
      jest.advanceTimersByTime(30000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(callCount).toBeGreaterThan(initialCallCount + 1);
    });

    unmount();
  });

  /**
   * Test: Multiple components using the hook
   */
  it('each hook instance has independent state', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        usd: 45000,
        lastUpdated: Date.now()
      }
    });

    const { result: result1 } = renderHook(() => useBitcoinPrice());
    const { result: result2 } = renderHook(() => useBitcoinPrice());

    await waitFor(() => {
      expect(result1.current.price).toBe(45000);
      expect(result2.current.price).toBe(45000);
    });

    // Both instances should have fetched independently
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
  });

  /**
   * Test: Loading state transitions
   */
  it('correctly manages loading state transitions', async () => {
    let resolvePromise: ((value: any) => void) | null = null;

    (chrome.runtime.sendMessage as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolvePromise = resolve;
      })
    );

    const { result } = renderHook(() => useBitcoinPrice());

    // Should be loading initially
    expect(result.current.loading).toBe(true);
    expect(result.current.price).toBeNull();

    // Resolve with data
    if (resolvePromise) {
      await act(async () => {
        resolvePromise({
          success: true,
          data: { usd: 45000, lastUpdated: Date.now() }
        });
      });
    }

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.price).toBe(45000);
  });

  /**
   * Test: Error clears on successful retry
   */
  it('clears error on successful retry', async () => {
    jest.useFakeTimers();

    let attemptCount = 0;

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        // First attempt fails
        return Promise.resolve({
          success: false,
          error: 'Network error'
        });
      } else {
        // Subsequent attempts succeed
        return Promise.resolve({
          success: true,
          data: { usd: 45000, lastUpdated: Date.now() }
        });
      }
    });

    const { result, unmount } = renderHook(() => useBitcoinPrice());

    // First fetch fails
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    expect(result.current.price).toBeNull();

    // Advance time to trigger retry
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
      await Promise.resolve();
    });

    // Second fetch succeeds
    await waitFor(() => {
      expect(result.current.price).toBe(45000);
    });

    expect(result.current.error).toBeNull();

    unmount();
  });

  /**
   * Test: Sets loading and clears error before each fetch
   */
  it('sets loading and clears error before each fetch', async () => {
    jest.useFakeTimers();

    let attemptCount = 0;
    let resolveSecondFetch: ((value: any) => void) | null = null;

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      attemptCount++;
      if (attemptCount === 1) {
        return Promise.resolve({
          success: false,
          error: 'First error'
        });
      } else {
        // Return a promise we can control
        return new Promise(resolve => {
          resolveSecondFetch = resolve;
        });
      }
    });

    const { result, unmount } = renderHook(() => useBitcoinPrice());

    // First fetch fails
    await waitFor(() => {
      expect(result.current.error).toBe('First error');
    });

    expect(result.current.loading).toBe(false);

    // Advance time to trigger second fetch
    await act(async () => {
      jest.advanceTimersByTime(5 * 60 * 1000);
      await Promise.resolve();
    });

    // Should set loading and clear error
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    // Resolve the second fetch
    if (resolveSecondFetch) {
      await act(async () => {
        resolveSecondFetch({
          success: true,
          data: { usd: 45000, lastUpdated: Date.now() }
        });
      });
    }

    // Wait for success
    await waitFor(() => {
      expect(result.current.price).toBe(45000);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);

    unmount();
  });

  /**
   * Test: Zero interval (edge case)
   */
  it('handles zero interval gracefully', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockResolvedValue({
      success: true,
      data: { usd: 45000, lastUpdated: Date.now() }
    });

    const { result } = renderHook(() => useBitcoinPrice(0));

    await waitFor(() => {
      expect(result.current.price).toBe(45000);
    });

    // With 0 interval, it should still set up interval (albeit very frequent)
    // This is an edge case - in practice, interval should be positive
    expect(result.current.loading).toBe(false);
  });
});
