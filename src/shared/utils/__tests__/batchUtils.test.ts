/**
 * Tests for Batch Utilities
 *
 * Tests the batch processing functions for API requests:
 * - Batched fetching with delays
 * - Retry logic with exponential backoff
 * - Error handling and result tracking
 */

import { fetchInBatches, retryWithBackoff } from '../batchUtils';

describe('batchUtils', () => {
  // Mock timers for controlling delays
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('fetchInBatches', () => {
    it('processes items in batches with default configuration', async () => {
      const items = ['item1', 'item2', 'item3', 'item4', 'item5', 'item6'];
      const fetchFunction = jest.fn().mockResolvedValue('success');

      const promise = fetchInBatches(items, fetchFunction);

      // Fast-forward through all timers
      await jest.runAllTimersAsync();

      const result = await promise;

      // All items should be processed
      expect(result.total).toBe(6);
      expect(result.successCount).toBe(6);
      expect(result.errorCount).toBe(0);
      expect(fetchFunction).toHaveBeenCalledTimes(6);
    });

    it('batches items according to batch size', async () => {
      const items = ['item1', 'item2', 'item3'];
      const fetchFunction = jest.fn().mockResolvedValue('success');

      const promise = fetchInBatches(items, fetchFunction, 2); // Batch size of 2

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.total).toBe(3);
      expect(result.successCount).toBe(3);
    });

    it('delays between batches', async () => {
      const items = ['item1', 'item2', 'item3', 'item4'];
      const fetchFunction = jest.fn().mockResolvedValue('success');

      const promise = fetchInBatches(items, fetchFunction, 2, 1000);

      // First batch should process immediately
      await Promise.resolve();
      expect(fetchFunction).toHaveBeenCalledTimes(2);

      // Advance timer by 1000ms for delay
      jest.advanceTimersByTime(1000);

      // Second batch should process
      await Promise.resolve();
      await jest.runAllTimersAsync();

      const result = await promise;
      expect(result.successCount).toBe(4);
    });

    it('does not delay after the last batch', async () => {
      const items = ['item1', 'item2'];
      const fetchFunction = jest.fn().mockResolvedValue('success');
      const delaySpy = jest.spyOn(global, 'setTimeout');

      const promise = fetchInBatches(items, fetchFunction, 2, 1000);

      await jest.runAllTimersAsync();
      await promise;

      // Only one batch, so no delay should be called
      expect(delaySpy).not.toHaveBeenCalled();
    });

    it('handles successful and failed items separately', async () => {
      const items = ['success1', 'fail1', 'success2', 'fail2'];
      const fetchFunction = jest.fn((item: string) => {
        if (item.startsWith('fail')) {
          return Promise.reject(new Error(`Failed: ${item}`));
        }
        return Promise.resolve(`Result: ${item}`);
      });

      const promise = fetchInBatches(items, fetchFunction);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.total).toBe(4);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(2);

      // Check success results
      expect(result.success.get('success1')).toBe('Result: success1');
      expect(result.success.get('success2')).toBe('Result: success2');

      // Check error results
      expect(result.errors.get('fail1')).toBeInstanceOf(Error);
      expect(result.errors.get('fail1')?.message).toBe('Failed: fail1');
      expect(result.errors.get('fail2')).toBeInstanceOf(Error);
    });

    it('processes empty array', async () => {
      const items: string[] = [];
      const fetchFunction = jest.fn();

      const promise = fetchInBatches(items, fetchFunction);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.total).toBe(0);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(0);
      expect(fetchFunction).not.toHaveBeenCalled();
    });

    it('processes single item without delay', async () => {
      const items = ['item1'];
      const fetchFunction = jest.fn().mockResolvedValue('success');

      const promise = fetchInBatches(items, fetchFunction);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.total).toBe(1);
      expect(result.successCount).toBe(1);
      expect(fetchFunction).toHaveBeenCalledTimes(1);
    });

    it('processes items within a batch in parallel', async () => {
      const items = ['item1', 'item2', 'item3'];
      const callOrder: string[] = [];

      const fetchFunction = jest.fn((item: string) => {
        callOrder.push(`start-${item}`);
        return Promise.resolve(item).then((result) => {
          callOrder.push(`end-${item}`);
          return result;
        });
      });

      const promise = fetchInBatches(items, fetchFunction, 3);

      await jest.runAllTimersAsync();
      await promise;

      // All items should start before any end (parallel execution)
      expect(callOrder[0]).toBe('start-item1');
      expect(callOrder[1]).toBe('start-item2');
      expect(callOrder[2]).toBe('start-item3');
    });

    it('handles custom batch size and delay', async () => {
      const items = Array.from({ length: 10 }, (_, i) => `item${i + 1}`);
      const fetchFunction = jest.fn().mockResolvedValue('success');

      const promise = fetchInBatches(items, fetchFunction, 3, 2000);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.total).toBe(10);
      expect(result.successCount).toBe(10);
    });

    it('continues processing even if entire batch fails', async () => {
      const items = ['fail1', 'fail2', 'success1', 'success2'];
      const fetchFunction = jest.fn((item: string) => {
        if (item.startsWith('fail')) {
          return Promise.reject(new Error('Batch failure'));
        }
        return Promise.resolve('success');
      });

      const promise = fetchInBatches(items, fetchFunction, 2);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(2);
    });

    it('returns success and error maps with correct keys', async () => {
      const items = ['addr1', 'addr2', 'addr3'];
      const fetchFunction = jest.fn((item: string) => {
        if (item === 'addr2') {
          return Promise.reject(new Error('Error for addr2'));
        }
        return Promise.resolve(`Balance: ${item}`);
      });

      const promise = fetchInBatches(items, fetchFunction);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.success.has('addr1')).toBe(true);
      expect(result.success.has('addr3')).toBe(true);
      expect(result.errors.has('addr2')).toBe(true);
      expect(result.success.get('addr1')).toBe('Balance: addr1');
    });
  });

  describe('retryWithBackoff', () => {
    it('returns result on first success', async () => {
      const operation = jest.fn().mockResolvedValue('success');

      const promise = retryWithBackoff(operation, 3, 1000);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and succeeds on second attempt', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(operation, 3, 1000);

      // Fast-forward through retry delays
      await jest.runAllTimersAsync();

      const result = await promise;

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('retries maximum number of times before giving up', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      let attemptCount = 0;
      const operation = jest.fn(async () => {
        attemptCount++;
        // Always fail
        throw new Error(`Fail attempt ${attemptCount}`);
      });

      // Catch the promise rejection
      const result = retryWithBackoff(operation, 3, 1000).catch((err) => err);

      await jest.runAllTimersAsync();

      const error = await result;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toContain('Fail attempt');
      expect(operation).toHaveBeenCalledTimes(4); // Initial + 3 retries

      consoleWarnSpy.mockRestore();
    });

    it('uses exponential backoff delays', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const timeoutSpy = jest.spyOn(global, 'setTimeout');

      const promise = retryWithBackoff(operation, 3, 1000);

      await jest.runAllTimersAsync();
      await promise;

      // First retry: 1000ms * 2^0 = 1000ms
      // Second retry: 1000ms * 2^1 = 2000ms
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
    });

    it('does not retry after max retries exhausted', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const operation = jest.fn(async () => {
        throw new Error('Persistent failure');
      });

      const result = retryWithBackoff(operation, 2, 500).catch((err) => err);

      await jest.runAllTimersAsync();

      const error = await result;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Persistent failure');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries

      consoleWarnSpy.mockRestore();
    });

    it('handles zero retries (fail immediately)', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const operation = jest.fn(async () => {
        throw new Error('Immediate failure');
      });

      const result = retryWithBackoff(operation, 0, 1000).catch((err) => err);

      await jest.runAllTimersAsync();

      const error = await result;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Immediate failure');
      expect(operation).toHaveBeenCalledTimes(1);

      consoleWarnSpy.mockRestore();
    });

    it('returns last error when all retries fail', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      let callCount = 0;
      const operation = jest.fn(async () => {
        callCount++;
        if (callCount === 1) throw new Error('First error');
        if (callCount === 2) throw new Error('Second error');
        throw new Error('Final error');
      });

      const result = retryWithBackoff(operation, 2, 1000).catch((err) => err);

      await jest.runAllTimersAsync();

      const error = await result;
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Final error');

      consoleWarnSpy.mockRestore();
    });

    it('handles successful retry after multiple failures', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockResolvedValueOnce('finally success');

      const promise = retryWithBackoff(operation, 5, 100);

      await jest.runAllTimersAsync();

      const result = await promise;
      expect(result).toBe('finally success');
      expect(operation).toHaveBeenCalledTimes(4);
    });

    it('handles different initial delay values', async () => {
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const timeoutSpy = jest.spyOn(global, 'setTimeout');

      const promise = retryWithBackoff(operation, 3, 500);

      await jest.runAllTimersAsync();
      await promise;

      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    });

    it('logs retry attempts with error information', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const operation = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce('success');

      const promise = retryWithBackoff(operation, 3, 1000);

      await jest.runAllTimersAsync();
      await promise;

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[retryWithBackoff] Attempt 1 failed'),
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('handles operation that returns undefined', async () => {
      const operation = jest.fn().mockResolvedValue(undefined);

      const promise = retryWithBackoff(operation, 3, 1000);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeUndefined();
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('handles operation that returns null', async () => {
      const operation = jest.fn().mockResolvedValue(null);

      const promise = retryWithBackoff(operation, 3, 1000);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result).toBeNull();
      expect(operation).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration scenarios', () => {
    it('combines batch processing with retry logic', async () => {
      let attemptCount = 0;
      const items = ['addr1', 'addr2', 'addr3'];

      const fetchWithRetry = async (item: string) => {
        return retryWithBackoff(
          async () => {
            attemptCount++;
            if (attemptCount <= 2) {
              throw new Error('Transient error');
            }
            return `Balance: ${item}`;
          },
          2,
          100
        );
      };

      const promise = fetchInBatches(items, fetchWithRetry, 2, 200);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.successCount).toBeGreaterThan(0);
    });

    it('handles large batch with some failures', async () => {
      const items = Array.from({ length: 50 }, (_, i) => `addr${i + 1}`);
      const fetchFunction = jest.fn((item: string) => {
        // Simulate 10% failure rate
        if (item.endsWith('5')) {
          return Promise.reject(new Error('Rate limit'));
        }
        return Promise.resolve(`Balance: ${item}`);
      });

      const promise = fetchInBatches(items, fetchFunction, 5, 100);

      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.total).toBe(50);
      expect(result.successCount).toBe(45); // 5 failures (items ending in 5)
      expect(result.errorCount).toBe(5);
    });
  });
});
