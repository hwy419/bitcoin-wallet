/**
 * usePSBT - Custom hook for PSBT operations
 *
 * Provides helper functions for Partially Signed Bitcoin Transaction operations.
 * Wraps background message handlers with loading states and error handling.
 *
 * Functions:
 * - buildPSBT: Create a new PSBT for a multisig transaction
 * - signPSBT: Sign a PSBT with the current wallet
 * - exportPSBT: Export PSBT in specified format
 * - importPSBT: Import and validate a PSBT
 * - broadcastPSBT: Broadcast a fully signed PSBT
 * - savePending: Save PSBT to pending transactions
 * - deletePending: Remove PSBT from pending transactions
 * - getPending: Fetch pending PSBTs
 *
 * Usage:
 * const { buildPSBT, isBuilding, error } = usePSBT();
 * const psbt = await buildPSBT(accountIndex, recipient, amount, feeRate);
 */

import { useState, useCallback } from 'react';
import { useBackgroundMessaging } from './useBackgroundMessaging';
import { MessageType, PendingMultisigTx } from '../../shared/types';

interface BuildPSBTParams {
  accountIndex: number;
  toAddress: string;
  amount: number;
  feeRate: number;
}

interface BuildPSBTResult {
  psbtBase64: string;
  txid: string;
  fee: number;
  size: number;
}

interface SignPSBTParams {
  accountIndex: number;
  psbtBase64: string;
}

interface SignPSBTResult {
  psbtBase64: string;
  signaturesCollected: number;
  signatureStatus: PendingMultisigTx['signatureStatus'];
}

interface ExportPSBTParams {
  psbtBase64: string;
  format: 'base64' | 'hex' | 'qr' | 'file';
}

interface ImportPSBTParams {
  psbtBase64: string;
}

interface ImportPSBTResult {
  psbtBase64: string;
  txid: string;
  signaturesCollected: number;
  signaturesRequired: number;
  metadata: {
    amount: number;
    recipient: string;
    fee: number;
  };
}

interface BroadcastPSBTParams {
  accountIndex: number;
  psbtBase64: string;
}

interface BroadcastPSBTResult {
  txid: string;
}

interface SavePendingParams {
  accountIndex: number;
  psbtBase64: string;
  metadata: {
    amount: number;
    recipient: string;
    fee: number;
  };
}

interface DeletePendingParams {
  txid: string;
}

interface GetPendingParams {
  accountIndex?: number;
}

interface GetPendingResult {
  pendingTxs: PendingMultisigTx[];
}

export const usePSBT = () => {
  const { sendMessage } = useBackgroundMessaging();

  // Loading states
  const [isBuilding, setIsBuilding] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoadingPending, setIsLoadingPending] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Build PSBT
  const buildPSBT = useCallback(
    async (params: BuildPSBTParams): Promise<BuildPSBTResult> => {
      setError(null);
      setIsBuilding(true);

      try {
        const result = await sendMessage<BuildPSBTResult>(MessageType.BUILD_MULTISIG_TRANSACTION, params);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to build PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsBuilding(false);
      }
    },
    [sendMessage]
  );

  // Sign PSBT
  const signPSBT = useCallback(
    async (params: SignPSBTParams): Promise<SignPSBTResult> => {
      setError(null);
      setIsSigning(true);

      try {
        const result = await sendMessage<SignPSBTResult>(MessageType.SIGN_MULTISIG_TRANSACTION, params);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to sign PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsSigning(false);
      }
    },
    [sendMessage]
  );

  // Export PSBT
  const exportPSBT = useCallback(
    async (params: ExportPSBTParams): Promise<string> => {
      setError(null);
      setIsExporting(true);

      try {
        const result = await sendMessage<{ exported: string }>(MessageType.EXPORT_PSBT, params);
        return result.exported;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to export PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [sendMessage]
  );

  // Import PSBT
  const importPSBT = useCallback(
    async (params: ImportPSBTParams): Promise<ImportPSBTResult> => {
      setError(null);
      setIsImporting(true);

      try {
        const result = await sendMessage<ImportPSBTResult>(MessageType.IMPORT_PSBT, params);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to import PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsImporting(false);
      }
    },
    [sendMessage]
  );

  // Broadcast PSBT
  const broadcastPSBT = useCallback(
    async (params: BroadcastPSBTParams): Promise<BroadcastPSBTResult> => {
      setError(null);
      setIsBroadcasting(true);

      try {
        const result = await sendMessage<BroadcastPSBTResult>(MessageType.BROADCAST_MULTISIG_TRANSACTION, params);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to broadcast PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsBroadcasting(false);
      }
    },
    [sendMessage]
  );

  // Save pending PSBT
  const savePending = useCallback(
    async (params: SavePendingParams): Promise<void> => {
      setError(null);
      setIsSaving(true);

      try {
        await sendMessage(MessageType.SAVE_PENDING_MULTISIG_TX, params);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save pending PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [sendMessage]
  );

  // Delete pending PSBT
  const deletePending = useCallback(
    async (params: DeletePendingParams): Promise<void> => {
      setError(null);
      setIsDeleting(true);

      try {
        await sendMessage(MessageType.DELETE_PENDING_MULTISIG_TX, params);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete pending PSBT';
        setError(errorMessage);
        throw err;
      } finally {
        setIsDeleting(false);
      }
    },
    [sendMessage]
  );

  // Get pending PSBTs
  const getPending = useCallback(
    async (params?: GetPendingParams): Promise<GetPendingResult> => {
      setError(null);
      setIsLoadingPending(true);

      try {
        const result = await sendMessage<GetPendingResult>(MessageType.GET_PENDING_MULTISIG_TXS, params);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load pending PSBTs';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoadingPending(false);
      }
    },
    [sendMessage]
  );

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Functions
    buildPSBT,
    signPSBT,
    exportPSBT,
    importPSBT,
    broadcastPSBT,
    savePending,
    deletePending,
    getPending,
    clearError,

    // Loading states
    isBuilding,
    isSigning,
    isExporting,
    isImporting,
    isBroadcasting,
    isSaving,
    isDeleting,
    isLoadingPending,

    // Error state
    error,

    // Combined loading state
    isLoading:
      isBuilding ||
      isSigning ||
      isExporting ||
      isImporting ||
      isBroadcasting ||
      isSaving ||
      isDeleting ||
      isLoadingPending,
  };
};

export default usePSBT;
