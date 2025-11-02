/**
 * MultisigTransactionDetail - Detailed view of a pending multisig transaction
 *
 * Full view of a pending PSBT with all details and actions.
 * Uses PSBTReview component for the main interface.
 *
 * Props:
 * - txid: Transaction ID to display
 * - onBack: Callback to return to list view
 * - onDeleted: Callback when transaction is deleted
 *
 * Usage:
 * <MultisigTransactionDetail
 *   txid="abc123..."
 *   onBack={() => setView('list')}
 *   onDeleted={() => refreshList()}
 * />
 */

import React, { useEffect, useState } from 'react';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType, PendingMultisigTx } from '../../../shared/types';
import PSBTReview from '../PSBT/PSBTReview';

interface MultisigTransactionDetailProps {
  txid: string;
  onBack: () => void;
  onDeleted?: () => void;
}

export const MultisigTransactionDetail: React.FC<MultisigTransactionDetailProps> = ({
  txid,
  onBack,
  onDeleted,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  const [transaction, setTransaction] = useState<PendingMultisigTx | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch transaction details
  useEffect(() => {
    const fetchTransaction = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage<{ pendingTxs: PendingMultisigTx[] }>(
          MessageType.GET_PENDING_MULTISIG_TXS
        );

        const tx = response.pendingTxs.find((t) => t.id === txid);

        if (!tx) {
          setError('Transaction not found');
          return;
        }

        setTransaction(tx);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transaction');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [txid, sendMessage]);

  // Handle delete transaction
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await sendMessage(MessageType.DELETE_PENDING_MULTISIG_TX, {
        txid,
      });

      // Success - call callbacks
      onDeleted?.();
      onBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete transaction');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle transaction completion (signed or broadcast)
  const handleComplete = () => {
    // Refresh the transaction data or go back
    onBack();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-950 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-1 text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Transaction Details</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading transaction...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="w-full h-full bg-gray-950 flex flex-col">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-1 text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white">Transaction Details</h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error || 'Transaction not found'}</p>
            </div>
            <button
              onClick={onBack}
              className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-750 text-white rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-1 text-gray-400 hover:text-white transition-colors"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Pending Transaction</h1>
              <p className="text-sm text-gray-500">{transaction.multisigConfig} Multisig</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-850 rounded-lg transition-colors"
            title="Delete Transaction"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <PSBTReview
          psbtBase64={transaction.psbtBase64}
          accountIndex={transaction.accountId}
          signaturesCollected={transaction.signaturesCollected}
          signaturesRequired={transaction.signaturesRequired}
          metadata={transaction.metadata}
          signatureStatus={transaction.signatureStatus}
          onComplete={handleComplete}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-3">Delete Transaction?</h2>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently delete this pending transaction. You will need to recreate it if you want to
              continue. This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-750 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultisigTransactionDetail;
