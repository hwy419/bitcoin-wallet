/**
 * CoSignerList - Display list of co-signers for multisig accounts
 *
 * Shows co-signers with their names, fingerprints, and optional signature status.
 * Supports compact, full, and horizontal card display modes.
 *
 * Props:
 * - cosigners: Array of Cosigner objects
 * - compact: Whether to use compact display mode
 * - layout: 'vertical' (default) or 'horizontal' (card-based scrollable)
 * - contacts: Array of contacts for auto-matching (horizontal mode only)
 * - signatureStatus: Optional map of fingerprint -> signed status (for PSBT review)
 * - highlightSelf: Whether to highlight current user's key
 * - onLinkContact: Callback for linking cosigner to contact (horizontal mode only)
 * - onShowQRCode: Callback for showing QR code (horizontal mode only)
 *
 * Usage:
 * <CoSignerList cosigners={account.cosigners} compact={false} highlightSelf={true} />
 * <CoSignerList cosigners={account.cosigners} layout="horizontal" contacts={contacts} />
 */

import React from 'react';
import { Cosigner, Contact } from '../../../shared/types';
import { CosignerCard } from './CosignerCard';

interface CoSignerListProps {
  cosigners: Cosigner[];
  compact?: boolean;
  layout?: 'vertical' | 'horizontal';
  contacts?: Contact[];
  signatureStatus?: Record<string, { signed: boolean; timestamp?: number; cosignerName: string }>;
  highlightSelf?: boolean;
  onLinkContact?: (cosigner: Cosigner) => void;
  onShowQRCode?: (cosigner: Cosigner) => void;
  className?: string;
}

export const CoSignerList: React.FC<CoSignerListProps> = ({
  cosigners,
  compact = false,
  layout = 'vertical',
  contacts = [],
  signatureStatus,
  highlightSelf = false,
  onLinkContact,
  onShowQRCode,
  className = '',
}) => {
  const formatFingerprint = (fingerprint: string): string => {
    // Format as pairs: a4b3c2d1 -> a4b3 c2d1
    return fingerprint.match(/.{1,4}/g)?.join(' ') || fingerprint;
  };

  const truncateXpub = (xpub: string): string => {
    return `${xpub.slice(0, 12)}...${xpub.slice(-8)}`;
  };

  // Horizontal card layout mode
  if (layout === 'horizontal') {
    return (
      <div className={className}>
        {/* Horizontal scrollable container */}
        <div
          className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#6B21A8 #1E1E1E',
          }}
        >
          {cosigners.map((cosigner) => (
            <CosignerCard
              key={cosigner.fingerprint}
              cosigner={cosigner}
              contacts={contacts}
              onLinkContact={onLinkContact}
              onShowQRCode={onShowQRCode}
              className="flex-shrink-0 flex-grow snap-start"
              style={{ minWidth: 'calc(20% - 0.8rem)' }}
            />
          ))}
        </div>
        {/* Custom scrollbar styles for webkit browsers */}
        <style>{`
          .overflow-x-auto::-webkit-scrollbar {
            height: 8px;
          }
          .overflow-x-auto::-webkit-scrollbar-track {
            background: #1E1E1E;
            border-radius: 4px;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb {
            background: #6B21A8;
            border-radius: 4px;
          }
          .overflow-x-auto::-webkit-scrollbar-thumb:hover {
            background: #7E22CE;
          }
        `}</style>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Co-Signers ({cosigners.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {cosigners.map((cosigner, index) => {
            const isSigned = signatureStatus?.[cosigner.fingerprint]?.signed;
            return (
              <div
                key={cosigner.fingerprint}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                  cosigner.isSelf && highlightSelf
                    ? 'bg-bitcoin-subtle border-bitcoin-light/30 text-bitcoin-light'
                    : isSigned
                    ? 'bg-green-500/15 border-green-500/30 text-green-400'
                    : 'bg-gray-850 border-gray-700 text-gray-300'
                }`}
              >
                {isSigned && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="font-medium">
                  {cosigner.name || `Co-Signer ${index + 1}`}
                  {cosigner.isSelf && ' (You)'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full display mode
  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-300">
        Co-Signers ({cosigners.length})
      </h4>
      <div className="space-y-3">
        {cosigners.map((cosigner, index) => {
          const status = signatureStatus?.[cosigner.fingerprint];
          const isSigned = status?.signed;

          return (
            <div
              key={cosigner.fingerprint}
              className={`p-4 rounded-lg border transition-colors ${
                cosigner.isSelf && highlightSelf
                  ? 'bg-bitcoin-subtle border-bitcoin-light/30'
                  : isSigned
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-gray-850 border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-white">
                    {cosigner.name || `Co-Signer ${index + 1}`}
                  </span>
                  {cosigner.isSelf && (
                    <span className="px-2 py-0.5 bg-bitcoin text-white text-xs rounded font-medium">
                      You
                    </span>
                  )}
                </div>
                {isSigned && (
                  <div className="flex items-center gap-1 text-green-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">Signed</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Fingerprint</p>
                  <p className="text-sm font-mono font-semibold text-bitcoin">
                    {formatFingerprint(cosigner.fingerprint)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Extended Public Key</p>
                  <p className="text-xs font-mono text-gray-400 break-all">
                    {truncateXpub(cosigner.xpub)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Derivation Path</p>
                  <p className="text-xs font-mono text-gray-400">{cosigner.derivationPath}</p>
                </div>

                {status?.timestamp && (
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Signed</p>
                    <p className="text-xs text-gray-400">
                      {new Date(status.timestamp).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CoSignerList;
