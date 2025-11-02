/**
 * Test Utilities for React Component Tests
 *
 * Custom render functions and test utilities:
 * - renderWithProviders: Render component with all required context providers
 * - Mock chrome.runtime.sendMessage
 * - Mock navigator.clipboard
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MessageType, MessageResponse } from '../../../shared/types';
import { PrivacyProvider } from '../../contexts/PrivacyContext';

/**
 * Extended render options with mock functions
 */
interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add any provider-specific options here in the future
}

/**
 * Custom render function with all providers
 *
 * Wraps components with necessary context providers:
 * - PrivacyProvider: For privacy mode functionality
 *
 * NOTE: PrivacyProvider loads settings asynchronously from chrome.storage.
 * Use waitFor() in tests if you need to wait for content to appear.
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: ExtendedRenderOptions
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <PrivacyProvider>
        {children}
      </PrivacyProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock chrome.runtime.sendMessage for tests
 *
 * @param mockResponses - Map of MessageType to response data or error
 * @returns Jest mock function
 *
 * Usage:
 * const sendMessage = mockChromeSendMessage({
 *   [MessageType.GET_BALANCE]: { confirmed: 100000, unconfirmed: 0 },
 *   [MessageType.GET_TRANSACTIONS]: { transactions: [] },
 * });
 */
export function mockChromeSendMessage(mockResponses: {
  [key in MessageType]?: any | Error;
}) {
  const mockSendMessage = jest.fn((message: any, callback?: any) => {
    const response = mockResponses[message.type as MessageType];

    // Simulate async behavior
    setTimeout(() => {
      if (response instanceof Error) {
        // Simulate error
        if (callback) {
          callback({
            success: false,
            error: response.message,
          });
        }
      } else {
        // Simulate success
        if (callback) {
          callback({
            success: true,
            data: response,
          });
        }
      }
    }, 0);

    return true; // Required for async
  });

  global.chrome.runtime.sendMessage = mockSendMessage;
  return mockSendMessage;
}

/**
 * Mock chrome.runtime.sendMessage with callback-based responses
 *
 * Works with the useBackgroundMessaging hook which uses callbacks
 */
export function mockChromeSendMessageAsync(mockResponses: {
  [key in MessageType]?: any | Error;
}) {
  const mockSendMessage = jest.fn((message: any, callback?: any) => {
    const response = mockResponses[message.type as MessageType];

    // If callback is provided, use callback style
    if (callback) {
      if (response instanceof Error) {
        callback({
          success: false,
          error: response.message,
        });
      } else {
        callback({
          success: true,
          data: response,
        });
      }
      return true; // Required for async Chrome API with callback
    }

    // Otherwise, return a Promise (for promise-based calls)
    if (response instanceof Error) {
      return Promise.resolve({
        success: false,
        error: response.message,
      });
    } else {
      return Promise.resolve({
        success: true,
        data: response,
      });
    }
  });

  global.chrome.runtime.sendMessage = mockSendMessage as any;
  return mockSendMessage;
}

/**
 * Mock navigator.clipboard for copy tests
 */
export function mockClipboard() {
  const mockWriteText = jest.fn().mockResolvedValue(undefined);

  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockWriteText,
    },
    writable: true,
    configurable: true,
  });

  return { writeText: mockWriteText };
}

/**
 * Wait for a specific amount of time
 * Useful for waiting for timeouts, animations, etc.
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock QRCode library
 */
export function mockQRCode() {
  const mockToCanvas = jest.fn((canvas, text, options, callback) => {
    // Simulate successful QR code generation
    if (callback) {
      callback(null);
    }
  });

  return {
    toCanvas: mockToCanvas,
  };
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
