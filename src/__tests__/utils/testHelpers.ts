/**
 * Test Helper Functions
 *
 * Common utility functions for testing including:
 * - Async wait helpers
 * - Mock setup/teardown functions
 * - Test data generators
 * - Assertion helpers
 * - Time manipulation
 */

import { MessageResponse } from '../../shared/types';

// =============================================================================
// Async Helpers
// =============================================================================

/**
 * Wait for a specified duration (in milliseconds)
 * Useful for testing timeouts and delays
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to become true
 * @param condition Function that returns true when condition is met
 * @param timeout Maximum time to wait in milliseconds
 * @param interval Check interval in milliseconds
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Wait for a promise to resolve or reject
 * Useful for testing error handling
 */
export async function waitForPromise<T>(
  promise: Promise<T>,
  timeout: number = 5000
): Promise<T> {
  return Promise.race([
    promise,
    wait(timeout).then(() => {
      throw new Error(`Promise did not resolve within ${timeout}ms`);
    }),
  ]) as Promise<T>;
}

// =============================================================================
// Mock Helpers
// =============================================================================

/**
 * Create a mock function that resolves after a delay
 */
export function createDelayedMock<T>(
  returnValue: T,
  delay: number = 100
): jest.Mock<Promise<T>> {
  return jest.fn().mockImplementation(async () => {
    await wait(delay);
    return returnValue;
  });
}

/**
 * Create a mock function that rejects after a delay
 */
export function createDelayedRejectMock<T extends Error>(
  error: T,
  delay: number = 100
): jest.Mock<Promise<never>> {
  return jest.fn().mockImplementation(async () => {
    await wait(delay);
    throw error;
  });
}

/**
 * Create a mock function that succeeds after N failures
 */
export function createRetryMock<T>(
  returnValue: T,
  failureCount: number = 2,
  errorMessage: string = 'Mock error'
): jest.Mock<Promise<T>> {
  let attempts = 0;

  return jest.fn().mockImplementation(async () => {
    attempts++;
    if (attempts <= failureCount) {
      throw new Error(errorMessage);
    }
    return returnValue;
  });
}

/**
 * Create a mock fetch Response object
 */
export function createMockResponse(
  data: any,
  ok: boolean = true,
  status: number = 200
): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    headers: new Headers(),
    redirected: false,
    type: 'basic',
    url: '',
    clone: function() { return this; },
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob(),
    formData: async () => new FormData(),
  } as Response;
}

/**
 * Setup mock fetch with queue of responses
 * Useful for testing retry logic
 */
export function setupMockFetchSequence(responses: Array<{ data: any; ok: boolean; status?: number }>) {
  let callCount = 0;

  (global.fetch as jest.Mock) = jest.fn().mockImplementation(async () => {
    const response = responses[Math.min(callCount, responses.length - 1)];
    callCount++;
    return createMockResponse(response.data, response.ok, response.status || (response.ok ? 200 : 500));
  });
}

// =============================================================================
// Chrome API Mock Helpers
// =============================================================================

/**
 * Mock chrome.runtime.sendMessage with a response
 */
export function mockChromeMessageResponse<T>(response: MessageResponse<T>): jest.Mock {
  return jest.fn().mockResolvedValue(response);
}

/**
 * Mock successful chrome message response
 */
export function mockSuccessfulMessage<T>(data: T): jest.Mock {
  return mockChromeMessageResponse({ success: true, data });
}

/**
 * Mock failed chrome message response
 */
export function mockFailedMessage(error: string): jest.Mock {
  return mockChromeMessageResponse({ success: false, error });
}

/**
 * Setup chrome.storage.local mock with initial data
 */
export function setupMockStorage(initialData: Record<string, any> = {}) {
  const storage = { ...initialData };

  (global as any).chrome = {
    storage: {
      local: {
        get: jest.fn().mockImplementation((keys: string | string[] | null) => {
          if (keys === null || keys === undefined) {
            return Promise.resolve(storage);
          }
          if (typeof keys === 'string') {
            return Promise.resolve({ [keys]: storage[keys] });
          }
          const result: Record<string, any> = {};
          keys.forEach(key => {
            if (key in storage) {
              result[key] = storage[key];
            }
          });
          return Promise.resolve(result);
        }),
        set: jest.fn().mockImplementation((items: Record<string, any>) => {
          Object.assign(storage, items);
          return Promise.resolve();
        }),
        remove: jest.fn().mockImplementation((keys: string | string[]) => {
          const keysArray = typeof keys === 'string' ? [keys] : keys;
          keysArray.forEach(key => delete storage[key]);
          return Promise.resolve();
        }),
        clear: jest.fn().mockImplementation(() => {
          Object.keys(storage).forEach(key => delete storage[key]);
          return Promise.resolve();
        }),
      },
    },
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
    },
  };

  return storage;
}

// =============================================================================
// Crypto Mock Helpers
// =============================================================================

/**
 * Setup deterministic crypto.getRandomValues for testing
 * Returns sequential bytes starting from seed
 */
export function setupDeterministicCrypto(seed: number = 0) {
  let counter = seed;

  (global.crypto.getRandomValues as jest.Mock) = jest.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = (counter + i) % 256;
    }
    counter += array.length;
    return array;
  });
}

/**
 * Restore real crypto.getRandomValues
 */
export function restoreRealCrypto() {
  if (typeof (global as any).__restoreOriginalCrypto === 'function') {
    (global as any).__restoreOriginalCrypto();
  }
}

// =============================================================================
// Time Manipulation
// =============================================================================

/**
 * Mock Date.now() to return a fixed timestamp
 */
export function mockDateNow(timestamp: number): jest.SpyInstance {
  return jest.spyOn(Date, 'now').mockReturnValue(timestamp);
}

/**
 * Advance time by a specified duration
 * Works with jest.useFakeTimers()
 */
export function advanceTime(ms: number) {
  jest.advanceTimersByTime(ms);
}

/**
 * Run all pending timers
 * Works with jest.useFakeTimers()
 */
export function runAllTimers() {
  jest.runAllTimers();
}

// =============================================================================
// Assertion Helpers
// =============================================================================

/**
 * Assert that a value is within a range
 */
export function expectInRange(value: number, min: number, max: number) {
  expect(value).toBeGreaterThanOrEqual(min);
  expect(value).toBeLessThanOrEqual(max);
}

/**
 * Assert that a value is close to expected (within tolerance)
 */
export function expectClose(actual: number, expected: number, tolerance: number = 0.01) {
  const diff = Math.abs(actual - expected);
  expect(diff).toBeLessThanOrEqual(tolerance);
}

/**
 * Assert that an array contains items in any order
 */
export function expectArrayContains<T>(array: T[], items: T[]) {
  items.forEach(item => {
    expect(array).toContain(item);
  });
}

/**
 * Assert that a string matches a pattern
 */
export function expectMatches(value: string, pattern: RegExp) {
  expect(value).toMatch(pattern);
}

/**
 * Assert that an object has specific properties
 */
export function expectHasProperties<T extends object>(obj: T, properties: (keyof T)[]) {
  properties.forEach(prop => {
    expect(obj).toHaveProperty(prop);
  });
}

/**
 * Assert that a promise rejects with a specific error message
 */
export async function expectRejectsWithMessage(
  promise: Promise<any>,
  message: string | RegExp
) {
  await expect(promise).rejects.toThrow(message);
}

/**
 * Assert that a promise resolves successfully
 */
export async function expectResolvesSuccessfully<T>(promise: Promise<T>): Promise<T> {
  const result = await promise;
  expect(result).toBeDefined();
  return result;
}

// =============================================================================
// Data Generators
// =============================================================================

/**
 * Generate a random hex string of specified length
 */
export function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a random Bitcoin-style transaction ID (64 hex characters)
 */
export function randomTxid(): string {
  return randomHex(64);
}

/**
 * Generate a random amount in satoshis within a range
 */
export function randomSatoshis(min: number = 1000, max: number = 1000000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate a sequence of numbers
 */
export function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// =============================================================================
// Test Setup/Teardown Helpers
// =============================================================================

/**
 * Create a test context object that can be shared across tests
 */
export function createTestContext<T extends object>(initialState: T) {
  return {
    state: { ...initialState },
    reset() {
      this.state = { ...initialState };
    },
  };
}

/**
 * Cleanup function to restore all mocks and timers
 */
export function cleanupTests() {
  jest.clearAllMocks();
  jest.clearAllTimers();
  jest.restoreAllMocks();

  if (jest.isMockFunction(global.fetch)) {
    (global.fetch as jest.Mock).mockClear();
  }

  restoreRealCrypto();
}

// =============================================================================
// Console Suppression
// =============================================================================

/**
 * Suppress console output during tests
 * Returns a restore function
 */
export function suppressConsole(): () => void {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
  };

  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();

  return () => {
    console.log = originalConsole.log;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.info = originalConsole.info;
  };
}

/**
 * Run a test with suppressed console output
 */
export async function withSuppressedConsole<T>(fn: () => T | Promise<T>): Promise<T> {
  const restore = suppressConsole();
  try {
    return await fn();
  } finally {
    restore();
  }
}

// =============================================================================
// Error Testing Helpers
// =============================================================================

/**
 * Test that a function throws a specific error
 */
export function expectThrows(fn: () => void, errorMessage?: string | RegExp) {
  if (errorMessage) {
    expect(fn).toThrow(errorMessage);
  } else {
    expect(fn).toThrow();
  }
}

/**
 * Test that an async function throws a specific error
 */
export async function expectAsyncThrows(
  fn: () => Promise<void>,
  errorMessage?: string | RegExp
) {
  if (errorMessage) {
    await expect(fn()).rejects.toThrow(errorMessage);
  } else {
    await expect(fn()).rejects.toThrow();
  }
}

// =============================================================================
// Performance Testing Helpers
// =============================================================================

/**
 * Measure execution time of a function
 */
export async function measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{
  result: T;
  duration: number;
}> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Assert that a function executes within a time limit
 */
export async function expectExecutesWithin<T>(
  fn: () => T | Promise<T>,
  maxDuration: number
): Promise<T> {
  const { result, duration } = await measureExecutionTime(fn);
  expect(duration).toBeLessThanOrEqual(maxDuration);
  return result;
}

// =============================================================================
// Snapshot Testing Helpers
// =============================================================================

/**
 * Create a serializable snapshot (removes functions and non-serializable data)
 */
export function toSerializableSnapshot(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'function') {
    return '[Function]';
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (obj instanceof Buffer) {
    return `[Buffer: ${obj.toString('hex').slice(0, 20)}...]`;
  }

  if (Array.isArray(obj)) {
    return obj.map(toSerializableSnapshot);
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = toSerializableSnapshot(value);
    }
    return result;
  }

  return obj;
}
