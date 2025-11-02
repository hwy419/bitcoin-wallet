/**
 * Setup Tests - Runs AFTER test environment is created
 *
 * This file configures the testing environment and sets up global mocks.
 * It runs after JSDOM is loaded and before any tests run.
 */

import '@testing-library/jest-dom';
import { chromeMock } from '../__mocks__/chrome';

// Set up Chrome API mock
global.chrome = chromeMock as any;

// Mock console methods to reduce noise in tests (can be overridden in individual tests)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Filter out known React warnings that aren't relevant to tests
console.error = (...args: any[]) => {
  const message = args[0];
  const fullMessage = typeof message === 'string' ? message : String(message);

  if (
    fullMessage.includes('Warning: ReactDOM.render') ||
    fullMessage.includes('Warning: useLayoutEffect') ||
    fullMessage.includes('Not implemented: HTMLFormElement.prototype.submit') ||
    // Suppress act warnings for async hook updates - these are properly handled with waitFor
    fullMessage.includes('An update to TestComponent inside a test was not wrapped in act')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

console.warn = (...args: any[]) => {
  const message = args[0];
  if (
    typeof message === 'string' &&
    message.includes('componentWillReceiveProps')
  ) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Store originals for restoration
(global as any).__originalConsole = {
  error: originalConsoleError,
  warn: originalConsoleWarn
};

// Clean up after each test
afterEach(() => {
  // Reset chrome.storage mocks
  if (global.chrome?.storage?.local) {
    (global.chrome.storage.local as any).__clear();
  }
  if (global.chrome?.storage?.session) {
    (global.chrome.storage.session as any).__clear();
  }

  // NOTE: Do NOT clear chrome.runtime.onMessage listeners here
  // The background script registers listeners on module import, and clearing them
  // breaks message handler tests. Listeners are stateless and don't interfere with tests.
});
