import { useCallback } from 'react';
import { MessageType, MessageResponse } from '../../shared/types';

/**
 * Custom hook for communicating with the background service worker
 *
 * Wraps chrome.runtime.sendMessage with:
 * - Promise interface
 * - Error handling
 * - Type safety
 *
 * Usage:
 * const { sendMessage } = useBackgroundMessaging();
 * const response = await sendMessage(MessageType.UNLOCK_WALLET, { password });
 */
export const useBackgroundMessaging = () => {
  const sendMessage = useCallback(async <T = any>(
    type: MessageType,
    payload?: any
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        { type, payload },
        (response: MessageResponse<T>) => {
          // Check for Chrome runtime errors
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          // Check for application errors in response
          if (!response) {
            reject(new Error('No response from background service worker'));
            return;
          }

          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          if (!response.success) {
            reject(new Error('Operation failed'));
            return;
          }

          // Success - return data
          resolve(response.data as T);
        }
      );
    });
  }, []);

  return { sendMessage };
};
