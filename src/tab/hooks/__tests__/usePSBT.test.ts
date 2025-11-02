/**
 * Tests for usePSBT hook
 *
 * Provides PSBT (Partially Signed Bitcoin Transaction) operations
 * for multisig transaction workflows.
 *
 * Test coverage:
 * - Initial state
 * - buildPSBT operation
 * - signPSBT operation
 * - exportPSBT operation
 * - importPSBT operation
 * - broadcastPSBT operation
 * - savePending operation
 * - deletePending operation
 * - getPending operation
 * - Loading states
 * - Error handling
 * - Combined loading state
 * - Clear error functionality
 * - Sequential operations
 * - Error recovery
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { usePSBT } from '../usePSBT';
import { MessageType } from '../../../shared/types';

// Create persistent mock
const mockSendMessage = jest.fn();

// Mock the useBackgroundMessaging hook
jest.mock('../useBackgroundMessaging', () => ({
  useBackgroundMessaging: () => ({
    sendMessage: mockSendMessage
  })
}));

describe('usePSBT', () => {
  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  /**
   * Test: Initial state
   */
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => usePSBT());

    expect(result.current.isBuilding).toBe(false);
    expect(result.current.isSigning).toBe(false);
    expect(result.current.isExporting).toBe(false);
    expect(result.current.isImporting).toBe(false);
    expect(result.current.isBroadcasting).toBe(false);
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isDeleting).toBe(false);
    expect(result.current.isLoadingPending).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  /**
   * Test: buildPSBT - Success
   */
  describe('buildPSBT', () => {
    it('successfully builds PSBT', async () => {
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
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.BUILD_MULTISIG_TRANSACTION,
        {
          accountIndex: 0,
          toAddress: 'tb1qtest',
          amount: 50000,
          feeRate: 5
        }
      );
      expect(result.current.error).toBeNull();
    });

    it('sets loading state during build', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          psbtBase64: 'test',
          txid: 'test',
          fee: 1000,
          size: 250
        }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      // Start the build (don't await act yet)
      let buildPromise: Promise<any>;
      act(() => {
        buildPromise = result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'tb1qtest',
          amount: 50000,
          feeRate: 5
        });
      });

      // Should be loading
      await waitFor(() => {
        expect(result.current.isBuilding).toBe(true);
      });
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await buildPromise!;
      });

      // Should be done
      expect(result.current.isBuilding).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles build errors', async () => {
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
      expect(result.current.isBuilding).toBe(false);
    });

    it('clears error before building', async () => {
      mockSendMessage.mockResolvedValue({
        psbtBase64: 'test',
        txid: 'test',
        fee: 1000,
        size: 250
      });

      const { result } = renderHook(() => usePSBT());

      // Set error first
      await act(async () => {
        mockSendMessage.mockRejectedValueOnce(new Error('Previous error'));
        await result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'tb1qtest',
          amount: 50000,
          feeRate: 5
        }).catch(() => {});
      });

      expect(result.current.error).toBe('Previous error');

      // Build again - should clear error
      await act(async () => {
        await result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'tb1qtest',
          amount: 50000,
          feeRate: 5
        });
      });

      expect(result.current.error).toBeNull();
    });
  });

  /**
   * Test: signPSBT - Success
   */
  describe('signPSBT', () => {
    it('successfully signs PSBT', async () => {
      const mockResult = {
        psbtBase64: 'cHNidP8BAH...signed',
        signaturesCollected: 1,
        signatureStatus: {
          'fingerprint1': {
            signed: true,
            timestamp: Date.now(),
            cosignerName: 'Alice'
          }
        }
      };

      mockSendMessage.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePSBT());

      let signedPsbt: any;
      await act(async () => {
        signedPsbt = await result.current.signPSBT({
          accountIndex: 0,
          psbtBase64: 'cHNidP8BAH...'
        });
      });

      expect(signedPsbt).toEqual(mockResult);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.SIGN_MULTISIG_TRANSACTION,
        {
          accountIndex: 0,
          psbtBase64: 'cHNidP8BAH...'
        }
      );
    });

    it('sets loading state during signing', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          psbtBase64: 'signed',
          signaturesCollected: 1,
          signatureStatus: {}
        }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let signPromise: Promise<any>;
      act(() => {
        signPromise = result.current.signPSBT({
          accountIndex: 0,
          psbtBase64: 'test'
        });
      });

      await waitFor(() => {
        expect(result.current.isSigning).toBe(true);
      });
      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await signPromise!;
      });

      expect(result.current.isSigning).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });

    it('handles signing errors', async () => {
      const errorMessage = 'Invalid PSBT format';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePSBT());

      await act(async () => {
        await expect(
          result.current.signPSBT({
            accountIndex: 0,
            psbtBase64: 'invalid'
          })
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isSigning).toBe(false);
    });
  });

  /**
   * Test: exportPSBT
   */
  describe('exportPSBT', () => {
    it('successfully exports PSBT as base64', async () => {
      const exportedData = 'cHNidP8BAH...exported';
      mockSendMessage.mockResolvedValue({ exported: exportedData });

      const { result } = renderHook(() => usePSBT());

      let exported: string = '';
      await act(async () => {
        exported = await result.current.exportPSBT({
          psbtBase64: 'cHNidP8BAH...',
          format: 'base64'
        });
      });

      expect(exported).toBe(exportedData);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.EXPORT_PSBT,
        {
          psbtBase64: 'cHNidP8BAH...',
          format: 'base64'
        }
      );
    });

    it('supports different export formats', async () => {
      mockSendMessage.mockResolvedValue({ exported: 'exported_data' });

      const { result } = renderHook(() => usePSBT());

      const formats: Array<'base64' | 'hex' | 'qr' | 'file'> = ['base64', 'hex', 'qr', 'file'];

      for (const format of formats) {
        await act(async () => {
          await result.current.exportPSBT({
            psbtBase64: 'test',
            format
          });
        });

        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.EXPORT_PSBT,
          expect.objectContaining({ format })
        );
      }
    });

    it('sets loading state during export', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ exported: 'data' }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let exportPromise: Promise<any>;
      act(() => {
        exportPromise = result.current.exportPSBT({
          psbtBase64: 'test',
          format: 'base64'
        });
      });

      await waitFor(() => {
        expect(result.current.isExporting).toBe(true);
      });

      await act(async () => {
        await exportPromise!;
      });

      expect(result.current.isExporting).toBe(false);
    });
  });

  /**
   * Test: importPSBT
   */
  describe('importPSBT', () => {
    it('successfully imports PSBT', async () => {
      const mockResult = {
        psbtBase64: 'cHNidP8BAH...',
        txid: 'abc123',
        signaturesCollected: 1,
        signaturesRequired: 2,
        metadata: {
          amount: 50000,
          recipient: 'tb1qtest',
          fee: 1000
        }
      };

      mockSendMessage.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePSBT());

      let imported: any;
      await act(async () => {
        imported = await result.current.importPSBT({
          psbtBase64: 'cHNidP8BAH...'
        });
      });

      expect(imported).toEqual(mockResult);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.IMPORT_PSBT,
        { psbtBase64: 'cHNidP8BAH...' }
      );
    });

    it('sets loading state during import', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({
          psbtBase64: 'test',
          txid: 'test',
          signaturesCollected: 1,
          signaturesRequired: 2,
          metadata: { amount: 0, recipient: '', fee: 0 }
        }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let importPromise: Promise<any>;
      act(() => {
        importPromise = result.current.importPSBT({ psbtBase64: 'test' });
      });

      await waitFor(() => {
        expect(result.current.isImporting).toBe(true);
      });

      await act(async () => {
        await importPromise!;
      });

      expect(result.current.isImporting).toBe(false);
    });
  });

  /**
   * Test: broadcastPSBT
   */
  describe('broadcastPSBT', () => {
    it('successfully broadcasts PSBT', async () => {
      const mockResult = { txid: 'broadcasted_txid' };
      mockSendMessage.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePSBT());

      let broadcast: any;
      await act(async () => {
        broadcast = await result.current.broadcastPSBT({
          accountIndex: 0,
          psbtBase64: 'cHNidP8BAH...'
        });
      });

      expect(broadcast).toEqual(mockResult);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.BROADCAST_MULTISIG_TRANSACTION,
        {
          accountIndex: 0,
          psbtBase64: 'cHNidP8BAH...'
        }
      );
    });

    it('sets loading state during broadcast', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ txid: 'test' }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let broadcastPromise: Promise<any>;
      act(() => {
        broadcastPromise = result.current.broadcastPSBT({
          accountIndex: 0,
          psbtBase64: 'test'
        });
      });

      await waitFor(() => {
        expect(result.current.isBroadcasting).toBe(true);
      });

      await act(async () => {
        await broadcastPromise!;
      });

      expect(result.current.isBroadcasting).toBe(false);
    });

    it('handles broadcast errors', async () => {
      const errorMessage = 'Not enough signatures';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => usePSBT());

      await act(async () => {
        await expect(
          result.current.broadcastPSBT({
            accountIndex: 0,
            psbtBase64: 'incomplete'
          })
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  /**
   * Test: savePending
   */
  describe('savePending', () => {
    it('successfully saves pending PSBT', async () => {
      mockSendMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePSBT());

      await act(async () => {
        await result.current.savePending({
          accountIndex: 0,
          psbtBase64: 'cHNidP8BAH...',
          metadata: {
            amount: 50000,
            recipient: 'tb1qtest',
            fee: 1000
          }
        });
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.SAVE_PENDING_MULTISIG_TX,
        expect.objectContaining({
          accountIndex: 0,
          psbtBase64: 'cHNidP8BAH...'
        })
      );
      expect(result.current.error).toBeNull();
    });

    it('sets loading state during save', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(undefined), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let savePromise: Promise<any>;
      act(() => {
        savePromise = result.current.savePending({
          accountIndex: 0,
          psbtBase64: 'test',
          metadata: { amount: 0, recipient: '', fee: 0 }
        });
      });

      await waitFor(() => {
        expect(result.current.isSaving).toBe(true);
      });

      await act(async () => {
        await savePromise!;
      });

      expect(result.current.isSaving).toBe(false);
    });
  });

  /**
   * Test: deletePending
   */
  describe('deletePending', () => {
    it('successfully deletes pending PSBT', async () => {
      mockSendMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePSBT());

      await act(async () => {
        await result.current.deletePending({ txid: 'abc123' });
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.DELETE_PENDING_MULTISIG_TX,
        { txid: 'abc123' }
      );
      expect(result.current.error).toBeNull();
    });

    it('sets loading state during delete', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve(undefined), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let deletePromise: Promise<any>;
      act(() => {
        deletePromise = result.current.deletePending({ txid: 'test' });
      });

      await waitFor(() => {
        expect(result.current.isDeleting).toBe(true);
      });

      await act(async () => {
        await deletePromise!;
      });

      expect(result.current.isDeleting).toBe(false);
    });
  });

  /**
   * Test: getPending
   */
  describe('getPending', () => {
    it('successfully gets pending PSBTs', async () => {
      const mockResult = {
        pendingTxs: [
          {
            id: 'tx1',
            accountId: 0,
            psbtBase64: 'psbt1',
            created: Date.now(),
            expiresAt: Date.now() + 86400000,
            multisigConfig: '2-of-3' as const,
            signaturesCollected: 1,
            signaturesRequired: 2,
            signatureStatus: {},
            metadata: { amount: 50000, recipient: 'tb1qtest', fee: 1000 }
          }
        ]
      };

      mockSendMessage.mockResolvedValue(mockResult);

      const { result } = renderHook(() => usePSBT());

      let pending: any;
      await act(async () => {
        pending = await result.current.getPending();
      });

      expect(pending).toEqual(mockResult);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_PENDING_MULTISIG_TXS,
        undefined
      );
    });

    it('can filter by account index', async () => {
      mockSendMessage.mockResolvedValue({ pendingTxs: [] });

      const { result } = renderHook(() => usePSBT());

      await act(async () => {
        await result.current.getPending({ accountIndex: 1 });
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_PENDING_MULTISIG_TXS,
        { accountIndex: 1 }
      );
    });

    it('sets loading state while fetching pending', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ pendingTxs: [] }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let getPendingPromise: Promise<any>;
      act(() => {
        getPendingPromise = result.current.getPending();
      });

      await waitFor(() => {
        expect(result.current.isLoadingPending).toBe(true);
      });

      await act(async () => {
        await getPendingPromise!;
      });

      expect(result.current.isLoadingPending).toBe(false);
    });
  });

  /**
   * Test: clearError
   */
  describe('clearError', () => {
    it('clears error state', async () => {
      mockSendMessage.mockRejectedValue(new Error('Test error'));

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

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  /**
   * Test: Combined loading state
   */
  describe('Combined loading state', () => {
    it('isLoading is true when any operation is loading', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ psbtBase64: 'test', txid: 'test', fee: 0, size: 0 }), 100);
      }));

      const { result } = renderHook(() => usePSBT());

      let buildPromise: Promise<any>;
      act(() => {
        buildPromise = result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'test',
          amount: 0,
          feeRate: 0
        });
      });

      await waitFor(() => {
        expect(result.current.isBuilding).toBe(true);
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await buildPromise!;
      });

      expect(result.current.isBuilding).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  /**
   * Test: Sequential operations
   */
  describe('Sequential operations', () => {
    it('handles build -> sign -> broadcast workflow', async () => {
      const { result } = renderHook(() => usePSBT());

      // Build
      mockSendMessage.mockResolvedValueOnce({
        psbtBase64: 'built_psbt',
        txid: 'tx123',
        fee: 1000,
        size: 250
      });

      let builtPsbt: any;
      await act(async () => {
        builtPsbt = await result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'tb1qtest',
          amount: 50000,
          feeRate: 5
        });
      });

      expect(builtPsbt.psbtBase64).toBe('built_psbt');

      // Sign
      mockSendMessage.mockResolvedValueOnce({
        psbtBase64: 'signed_psbt',
        signaturesCollected: 2,
        signatureStatus: {}
      });

      let signedPsbt: any;
      await act(async () => {
        signedPsbt = await result.current.signPSBT({
          accountIndex: 0,
          psbtBase64: builtPsbt.psbtBase64
        });
      });

      expect(signedPsbt.psbtBase64).toBe('signed_psbt');

      // Broadcast
      mockSendMessage.mockResolvedValueOnce({
        txid: 'final_txid'
      });

      let broadcast: any;
      await act(async () => {
        broadcast = await result.current.broadcastPSBT({
          accountIndex: 0,
          psbtBase64: signedPsbt.psbtBase64
        });
      });

      expect(broadcast.txid).toBe('final_txid');
      expect(result.current.error).toBeNull();
    });
  });

  /**
   * Test: Error messages for non-Error objects
   */
  describe('Non-Error exception handling', () => {
    it('handles string errors', async () => {
      mockSendMessage.mockRejectedValue('String error');

      const { result } = renderHook(() => usePSBT());

      await act(async () => {
        await result.current.buildPSBT({
          accountIndex: 0,
          toAddress: 'test',
          amount: 0,
          feeRate: 0
        }).catch(() => {});
      });

      expect(result.current.error).toBe('Failed to build PSBT');
    });
  });
});
