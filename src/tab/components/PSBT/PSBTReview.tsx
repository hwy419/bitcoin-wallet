/**
 * PSBTReview - Review and manage Partially Signed Bitcoin Transaction
 *
 * Displays transaction details and manages the PSBT signature workflow.
 * Shows signature status, allows signing, exporting, importing signatures, and broadcasting.
 *
 * Props:
 * - psbtBase64: PSBT in base64 format
 * - accountIndex: Index of the multisig account
 * - signaturesCollected: Number of signatures collected
 * - signaturesRequired: Number of signatures required
 * - metadata: Transaction metadata (amount, recipient, fee)
 * - signatureStatus: Status of each co-signer's signature
 * - onComplete: Callback when transaction is completed (signed or broadcast)
 *
 * Usage:
 * <PSBTReview
 *   psbtBase64={psbt}
 *   accountIndex={0}
 *   signaturesCollected={1}
 *   signaturesRequired={2}
 *   metadata={{ amount, recipient, fee }}
 *   signatureStatus={signatureStatus}
 *   onComplete={() => refreshData()}
 * />
 */

import React, { useState } from 'react';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { useBitcoinPrice } from '../../hooks/useBitcoinPrice';
import { MessageType, PendingMultisigTx } from '../../../shared/types';
import { formatSatoshisAsUSD } from '../../../shared/utils/price';
import { SignatureProgress } from '../shared/SignatureProgress';
import PSBTExport from './PSBTExport';
import PSBTImport, { PSBTImportResult } from './PSBTImport';

interface PSBTReviewProps {
  psbtBase64: string;
  accountIndex: number;
  signaturesCollected: number;
  signaturesRequired: number;
  metadata: {
    amount: number;
    recipient: string;
    fee: number;
  };
  signatureStatus: PendingMultisigTx['signatureStatus'];
  onComplete: () => void;
}

export const PSBTReview: React.FC<PSBTReviewProps> = ({
  psbtBase64: initialPsbtBase64,
  accountIndex,
  signaturesCollected: initialSignaturesCollected,
  signaturesRequired,
  metadata,
  signatureStatus: initialSignatureStatus,
  onComplete,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const { price: btcPrice } = useBitcoinPrice();

  const [psbtBase64, setPsbtBase64] = useState(initialPsbtBase64);
  const [signaturesCollected, setSignaturesCollected] = useState(initialSignaturesCollected);
  const [signatureStatus, setSignatureStatus] = useState(initialSignatureStatus);

  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [isSigning, setIsSigning] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isFullySigned = signaturesCollected >= signaturesRequired;
  const canSign = !isSigning && !isFullySigned;
  const canBroadcast = isFullySigned && !isBroadcasting;

  // Format BTC
  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Handle signing the PSBT
  const handleSign = async () => {
    setError(null);
    setSuccess(null);
    setIsSigning(true);

    try {
      const result = await sendMessage<{
        psbtBase64: string;
        signaturesCollected: number;
        signatureStatus: PendingMultisigTx['signatureStatus'];
      }>(MessageType.SIGN_MULTISIG_TRANSACTION, {
        accountIndex,
        psbtBase64,
      });

      setPsbtBase64(result.psbtBase64);
      setSignaturesCollected(result.signaturesCollected);
      setSignatureStatus(result.signatureStatus);
      setSuccess('Transaction signed successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign transaction');
    } finally {
      setIsSigning(false);
    }
  };

  // Handle importing PSBT with additional signatures
  const handlePSBTImported = (result: PSBTImportResult) => {
    setPsbtBase64(result.psbtBase64);
    setSignaturesCollected(result.signaturesCollected);
    // Update signature status if provided
    setShowImport(false);
    setSuccess('PSBT imported successfully!');
  };

  // Handle broadcasting the fully signed transaction
  const handleBroadcast = async () => {
    setError(null);
    setSuccess(null);
    setIsBroadcasting(true);

    try {
      const result = await sendMessage<{ txid: string }>(MessageType.BROADCAST_MULTISIG_TRANSACTION, {
        accountIndex,
        psbtBase64,
      });

      setSuccess(`Transaction broadcast! TXID: ${result.txid.substring(0, 16)}...`);

      // Wait 2 seconds to show success message, then call onComplete
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to broadcast transaction');
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Transaction Details Card */}
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Transaction Details</h3>

        <div className="space-y-3">
          {/* Recipient */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Recipient</label>
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
              <p className="text-sm font-mono text-gray-300 break-all">{metadata.recipient}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount</label>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-semibold text-white">{metadata.amount} sats</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatBTC(metadata.amount)} BTC</p>
                {btcPrice !== null && (
                  <p className="text-xs text-gray-500">≈ {formatSatoshisAsUSD(metadata.amount, btcPrice)}</p>
                )}
              </div>
            </div>

            {/* Fee */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Network Fee</label>
              <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
                <p className="text-sm font-semibold text-white">{metadata.fee} sats</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatBTC(metadata.fee)} BTC</p>
                {btcPrice !== null && (
                  <p className="text-xs text-gray-500">≈ {formatSatoshisAsUSD(metadata.fee, btcPrice)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Total */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Total (Amount + Fee)</label>
            <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
              <p className="text-base font-bold text-white">{metadata.amount + metadata.fee} sats</p>
              <p className="text-sm text-gray-500 mt-0.5">{formatBTC(metadata.amount + metadata.fee)} BTC</p>
              {btcPrice !== null && (
                <p className="text-sm text-gray-500">
                  ≈ {formatSatoshisAsUSD(metadata.amount + metadata.fee, btcPrice)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Status Card */}
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-white mb-4">Signature Status</h3>

        <SignatureProgress
          signaturesCollected={signaturesCollected}
          signaturesRequired={signaturesRequired}
          size="lg"
          showLabel={true}
        />

        {/* Co-signer Signature Status */}
        <div className="mt-4 space-y-2">
          {Object.entries(signatureStatus).map(([fingerprint, status]) => (
            <div
              key={fingerprint}
              className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status.signed ? 'bg-green-500/15 text-green-500' : 'bg-gray-750 text-gray-500'
                  }`}
                >
                  {status.signed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{status.cosignerName}</p>
                  <p className="text-xs text-gray-500 font-mono">{fingerprint}</p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  status.signed
                    ? 'bg-green-500/15 text-green-500 border border-green-500/30'
                    : 'bg-gray-750 text-gray-400 border border-gray-700'
                }`}
              >
                {status.signed ? 'Signed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/15 border border-green-500/30 rounded-lg">
          <p className="text-sm text-green-400">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Sign Button */}
        {canSign && (
          <button
            onClick={handleSign}
            disabled={isSigning}
            className="w-full py-3 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isSigning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Signing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                  />
                </svg>
                <span>Sign Transaction</span>
              </>
            )}
          </button>
        )}

        {/* Export and Import Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowExport(true)}
            className="py-3 bg-gray-800 hover:bg-gray-750 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 17l4 4m0 0l4-4m-4 4V3"
              />
            </svg>
            <span>Export PSBT</span>
          </button>

          <button
            onClick={() => setShowImport(true)}
            disabled={isFullySigned}
            className="py-3 bg-gray-800 hover:bg-gray-750 disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8"
              />
            </svg>
            <span>Import Signatures</span>
          </button>
        </div>

        {/* Broadcast Button */}
        {canBroadcast && (
          <button
            onClick={handleBroadcast}
            disabled={isBroadcasting}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {isBroadcasting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 3l14 9-14 9V3z"
                  />
                </svg>
                <span>Broadcast Transaction</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Modals */}
      {showExport && <PSBTExport psbtBase64={psbtBase64} onClose={() => setShowExport(false)} />}

      {showImport && <PSBTImport onImported={handlePSBTImported} onCancel={() => setShowImport(false)} />}
    </div>
  );
};

export default PSBTReview;
