/**
 * PendingTransactionList - List of pending multisig transactions
 *
 * Displays all pending PSBTs awaiting signatures for a multisig account.
 * Each item shows basic transaction info and signature progress.
 *
 * Props:
 * - accountIndex: Index of multisig account (optional, shows all if not provided)
 * - onSelectTransaction: Callback when user selects a transaction
 *
 * Usage:
 * <PendingTransactionList
 *   accountIndex={0}
 *   onSelectTransaction={(txid) => navigate(`/tx/${txid}`)}
 * />
 */

import React, { useEffect, useState } from 'react';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { MessageType, PendingMultisigTx } from '../../../shared/types';
import { formatSatoshisAsUSD } from '../../../shared/utils/price';
import { SignatureProgress } from '../shared/SignatureProgress';

interface PendingTransactionListProps {
  accountIndex?: number;
  onSelectTransaction?: (txid: string) => void;
}

export const PendingTransactionList: React.FC<PendingTransactionListProps> = ({
  accountIndex,
  onSelectTransaction,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const { price: btcPrice } = useBitcoinPrice();

  const [pendingTxs, setPendingTxs] = useState<PendingMultisigTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch pending transactions
  useEffect(() => {
    const fetchPendingTxs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage<{ pendingTxs: PendingMultisigTx[] }>(
          MessageType.GET_PENDING_MULTISIG_TXS,
          accountIndex !== undefined ? { accountIndex } : undefined
        );

        setPendingTxs(response.pendingTxs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load pending transactions');
        setPendingTxs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingTxs();
  }, [accountIndex, sendMessage]);

  // Format BTC
  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Shortened address
  const shortAddress = (address: string): string => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-3 border-gray-700 border-t-bitcoin mb-3"></div>
        <p className="text-sm text-gray-400">Loading pending transactions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (pendingTxs.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4">
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <p className="text-gray-400 font-medium mb-1">No Pending Transactions</p>
        <p className="text-sm text-gray-500">
          Pending multisig transactions will appear here awaiting signatures
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pendingTxs.map((tx) => {
        const isExpired = Date.now() > tx.expiresAt;
        const isFullySigned = tx.signaturesCollected >= tx.signaturesRequired;

        return (
          <div
            key={tx.id}
            onClick={() => onSelectTransaction?.(tx.id)}
            className={`p-4 bg-gray-850 border rounded-lg transition-all cursor-pointer ${
              isExpired
                ? 'border-red-500/30 hover:border-red-500/50'
                : isFullySigned
                ? 'border-green-500/30 hover:border-green-500/50'
                : 'border-gray-700 hover:border-bitcoin'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">Multisig Payment</p>
                  {isExpired && (
                    <span className="px-2 py-0.5 bg-red-500/15 text-red-400 border border-red-500/30 text-xs rounded">
                      Expired
                    </span>
                  )}
                  {isFullySigned && !isExpired && (
                    <span className="px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 text-xs rounded">
                      Ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">Created {formatDate(tx.created)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-white">{tx.metadata.amount} sats</p>
                <p className="text-xs text-gray-500">{formatBTC(tx.metadata.amount)} BTC</p>
                {btcPrice !== null && (
                  <p className="text-xs text-gray-500">≈ {formatSatoshisAsUSD(tx.metadata.amount, btcPrice)}</p>
                )}
              </div>
            </div>

            {/* Recipient */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">To:</p>
              <p className="text-xs font-mono text-gray-400">{shortAddress(tx.metadata.recipient)}</p>
            </div>

            {/* Signature Progress */}
            <SignatureProgress
              signaturesCollected={tx.signaturesCollected}
              signaturesRequired={tx.signaturesRequired}
              size="sm"
              showLabel={true}
            />

            {/* View Details Arrow */}
            <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-center text-gray-500 hover:text-bitcoin transition-colors">
              <span className="text-xs font-medium mr-1">View Details</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PendingTransactionList;
