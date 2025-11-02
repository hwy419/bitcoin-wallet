/**
 * Setup Environment - Runs BEFORE test environment is created
 *
 * This file sets up global variables and polyfills needed for tests.
 * It runs before the test environment (JSDOM) is created.
 */

// Import Node.js crypto for Web Crypto API polyfill
import { webcrypto } from 'crypto';

// Polyfill Web Crypto API (crypto.subtle) for tests
// JSDOM doesn't provide crypto.subtle, but Node.js 15+ has it
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}

if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

// Mock crypto.getRandomValues for deterministic tests
// This is overridden in individual tests when randomness needs to be tested
const originalGetRandomValues = global.crypto.getRandomValues.bind(global.crypto);

// Store original for tests that want true randomness
(global as any).__originalCryptoGetRandomValues = originalGetRandomValues;

// Default mock: deterministic sequence for repeatable tests
let mockRandomCounter = 0;
const mockGetRandomValues = function<T extends ArrayBufferView>(array: T): T {
  // Fill with deterministic values for testing
  // Each call increments the counter to provide different values
  const bytes = array as unknown as Uint8Array;
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = (mockRandomCounter + i) % 256;
  }
  mockRandomCounter += bytes.length;
  return array;
};

// Initially use mock crypto for deterministic tests
global.crypto.getRandomValues = mockGetRandomValues;

// Provide a way to reset the counter
(global as any).__resetMockRandomCounter = () => {
  mockRandomCounter = 0;
};

// Provide a way to restore original crypto.getRandomValues
(global as any).__restoreOriginalCrypto = () => {
  global.crypto.getRandomValues = originalGetRandomValues;
};

// Provide a way to use mock crypto
(global as any).__useMockCrypto = () => {
  mockRandomCounter = 0;
  global.crypto.getRandomValues = mockGetRandomValues;
};

// TextEncoder/TextDecoder are available in Node 16+, but let's ensure they're global
if (typeof global.TextEncoder === 'undefined') {
  const util = require('util');
  global.TextEncoder = util.TextEncoder;
  global.TextDecoder = util.TextDecoder;
}

// Mock atob and btoa if not available
if (typeof global.atob === 'undefined') {
  global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
}

if (typeof global.btoa === 'undefined') {
  global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
}
