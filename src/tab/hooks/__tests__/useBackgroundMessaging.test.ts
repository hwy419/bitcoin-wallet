/**
 * Tests for useBackgroundMessaging hook
 *
 * This is a CRITICAL hook that handles all communication between the tab UI
 * and the background service worker. It must be thoroughly tested.
 *
 * Test coverage:
 * - Initial hook state
 * - Successful message sending
 * - Chrome runtime errors
 * - No response from background
 * - Response with error property
 * - Response with success: false
 * - Type safety for different message types
 * - Multiple sequential messages
 * - Concurrent message sending
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useBackgroundMessaging } from '../useBackgroundMessaging';
import { MessageType } from '../../../shared/types';

describe('useBackgroundMessaging', () => {
  /**
   * Test: Hook returns sendMessage function
   */
  it('returns sendMessage function', () => {
    const { result } = renderHook(() => useBackgroundMessaging());

    expect(result.current.sendMessage).toBeDefined();
    expect(typeof result.current.sendMessage).toBe('function');
  });

  /**
   * Test: sendMessage is stable across re-renders (useCallback)
   */
  it('returns stable sendMessage function reference', () => {
    const { result, rerender } = renderHook(() => useBackgroundMessaging());

    const firstSendMessage = result.current.sendMessage;
    rerender();
    const secondSendMessage = result.current.sendMessage;

    expect(firstSendMessage).toBe(secondSendMessage);
  });

  /**
   * Test: Successful message sending and response
   */
  it('successfully sends message and returns response data', async () => {
    const mockResponse = {
      success: true,
      data: { balance: 100000, address: 'tb1qtest' }
    };

    // Mock chrome.runtime.sendMessage to call callback with success response
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const responseData = await result.current.sendMessage(
      MessageType.GET_BALANCE,
      { accountIndex: 0 }
    );

    expect(responseData).toEqual(mockResponse.data);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: MessageType.GET_BALANCE, payload: { accountIndex: 0 } },
      expect.any(Function)
    );
  });

  /**
   * Test: Handles Chrome runtime errors
   */
  it('rejects with Chrome runtime error', async () => {
    const errorMessage = 'Extension context invalidated';

    // Mock chrome.runtime.lastError
    Object.defineProperty(chrome.runtime, 'lastError', {
      value: { message: errorMessage },
      configurable: true,
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(null);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_BALANCE)
    ).rejects.toThrow(errorMessage);

    // Clean up
    delete (chrome.runtime as any).lastError;
  });

  /**
   * Test: Handles no response from background worker
   */
  it('rejects when no response received', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(null);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_BALANCE)
    ).rejects.toThrow('No response from background service worker');
  });

  /**
   * Test: Handles response with error property
   */
  it('rejects when response contains error', async () => {
    const errorMessage = 'Wallet is locked';
    const mockResponse = {
      success: false,
      error: errorMessage
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_BALANCE)
    ).rejects.toThrow(errorMessage);
  });

  /**
   * Test: Handles response with success: false but no error message
   */
  it('rejects when response.success is false without error message', async () => {
    const mockResponse = {
      success: false
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_BALANCE)
    ).rejects.toThrow('Operation failed');
  });

  /**
   * Test: Type safety - correctly typed responses
   */
  it('returns correctly typed response data', async () => {
    interface BalanceResponse {
      confirmed: number;
      unconfirmed: number;
    }

    const mockBalance: BalanceResponse = {
      confirmed: 100000,
      unconfirmed: 5000
    };

    const mockResponse = {
      success: true,
      data: mockBalance
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const balance = await result.current.sendMessage<BalanceResponse>(
      MessageType.GET_BALANCE
    );

    expect(balance).toEqual(mockBalance);
    expect(balance.confirmed).toBe(100000);
    expect(balance.unconfirmed).toBe(5000);
  });

  /**
   * Test: Sends message without payload
   */
  it('sends message without payload', async () => {
    const mockResponse = {
      success: true,
      data: { unlocked: false }
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data = await result.current.sendMessage(MessageType.GET_WALLET_STATUS);

    expect(data).toEqual(mockResponse.data);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: MessageType.GET_WALLET_STATUS, payload: undefined },
      expect.any(Function)
    );
  });

  /**
   * Test: Multiple sequential messages
   */
  it('handles multiple sequential messages', async () => {
    const mockResponse1 = { success: true, data: { balance: 100000 } };
    const mockResponse2 = { success: true, data: { txid: 'abc123' } };
    const mockResponse3 = { success: true, data: { address: 'tb1qtest' } };

    let callCount = 0;
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callCount++;
        if (callCount === 1) callback(mockResponse1);
        else if (callCount === 2) callback(mockResponse2);
        else callback(mockResponse3);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data1 = await result.current.sendMessage(MessageType.GET_BALANCE);
    const data2 = await result.current.sendMessage(MessageType.SEND_TRANSACTION);
    const data3 = await result.current.sendMessage(MessageType.GET_NEW_ADDRESS);

    expect(data1).toEqual(mockResponse1.data);
    expect(data2).toEqual(mockResponse2.data);
    expect(data3).toEqual(mockResponse3.data);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(3);
  });

  /**
   * Test: Concurrent messages (Promise.all)
   */
  it('handles concurrent messages', async () => {
    const mockResponse1 = { success: true, data: { balance: 100000 } };
    const mockResponse2 = { success: true, data: { fee: 1000 } };
    const mockResponse3 = { success: true, data: { price: 45000 } };

    let callCount = 0;
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        // Simulate async with setTimeout
        setTimeout(() => {
          callCount++;
          if (message.type === MessageType.GET_BALANCE) callback(mockResponse1);
          else if (message.type === MessageType.ESTIMATE_FEE) callback(mockResponse2);
          else callback(mockResponse3);
        }, 10);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const [data1, data2, data3] = await Promise.all([
      result.current.sendMessage(MessageType.GET_BALANCE),
      result.current.sendMessage(MessageType.ESTIMATE_FEE),
      result.current.sendMessage(MessageType.GET_BTC_PRICE)
    ]);

    expect(data1).toEqual(mockResponse1.data);
    expect(data2).toEqual(mockResponse2.data);
    expect(data3).toEqual(mockResponse3.data);
  });

  /**
   * Test: Handles undefined data (but success: true)
   */
  it('handles response with success but undefined data', async () => {
    const mockResponse = {
      success: true,
      data: undefined
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data = await result.current.sendMessage(MessageType.LOCK_WALLET);

    expect(data).toBeUndefined();
  });

  /**
   * Test: Handles null data (but success: true)
   */
  it('handles response with success but null data', async () => {
    const mockResponse = {
      success: true,
      data: null
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data = await result.current.sendMessage(MessageType.LOCK_WALLET);

    expect(data).toBeNull();
  });

  /**
   * Test: Complex payload object
   */
  it('sends complex payload object', async () => {
    const complexPayload = {
      accountIndex: 0,
      toAddress: 'tb1qtest123',
      amount: 50000,
      feeRate: 5,
      utxos: [
        { txid: 'abc', vout: 0, value: 100000 }
      ]
    };

    const mockResponse = {
      success: true,
      data: { txid: 'newtx123' }
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await result.current.sendMessage(
      MessageType.SEND_TRANSACTION,
      complexPayload
    );

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: MessageType.SEND_TRANSACTION, payload: complexPayload },
      expect.any(Function)
    );
  });

  /**
   * Test: Error thrown in Promise executor is caught
   */
  it('handles error when sendMessage throws', async () => {
    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(() => {
      throw new Error('Chrome API not available');
    });

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_BALANCE)
    ).rejects.toThrow('Chrome API not available');
  });

  /**
   * Test: Chrome runtime error takes precedence over response error
   */
  it('prioritizes Chrome runtime error over response error', async () => {
    const runtimeError = 'Extension context invalidated';
    const responseError = 'Operation failed';

    Object.defineProperty(chrome.runtime, 'lastError', {
      value: { message: runtimeError },
      configurable: true,
    });

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback({ success: false, error: responseError });
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    await expect(
      result.current.sendMessage(MessageType.GET_BALANCE)
    ).rejects.toThrow(runtimeError);

    // Clean up
    delete (chrome.runtime as any).lastError;
  });

  /**
   * Test: Response with empty object data
   */
  it('handles response with empty object data', async () => {
    const mockResponse = {
      success: true,
      data: {}
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data = await result.current.sendMessage(MessageType.GET_BALANCE);

    expect(data).toEqual({});
  });

  /**
   * Test: Response with array data
   */
  it('handles response with array data', async () => {
    const mockResponse = {
      success: true,
      data: [
        { address: 'tb1qtest1', balance: 100000 },
        { address: 'tb1qtest2', balance: 50000 }
      ]
    };

    (chrome.runtime.sendMessage as jest.Mock).mockImplementation(
      (message: any, callback: (response: any) => void) => {
        callback(mockResponse);
      }
    );

    const { result } = renderHook(() => useBackgroundMessaging());

    const data = await result.current.sendMessage(MessageType.GET_ACCOUNTS);

    expect(data).toEqual(mockResponse.data);
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
  });
});
