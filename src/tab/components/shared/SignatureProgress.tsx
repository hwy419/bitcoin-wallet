/**
 * SignatureProgress - Visual indicator for multisig signature collection
 *
 * Shows progress of signature collection for PSBT transactions.
 * Color transitions from amber (pending) to green (complete).
 *
 * Props:
 * - signaturesCollected: Number of signatures collected so far
 * - signaturesRequired: Total signatures required (M in M-of-N)
 * - size: 'sm' | 'md' | 'lg'
 * - showLabel: Whether to show text label
 *
 * Usage:
 * <SignatureProgress signaturesCollected={2} signaturesRequired={3} size="md" />
 */

import React from 'react';

interface SignatureProgressProps {
  signaturesCollected: number;
  signaturesRequired: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const SignatureProgress: React.FC<SignatureProgressProps> = ({
  signaturesCollected,
  signaturesRequired,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const isComplete = signaturesCollected >= signaturesRequired;
  const progress = (signaturesCollected / signaturesRequired) * 100;

  // Size configurations
  const barHeights = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  // Color based on completion
  const statusColor = isComplete ? 'text-green-500' : 'text-amber-500';
  const barColor = isComplete
    ? 'bg-gradient-to-r from-green-500 to-green-400'
    : 'bg-gradient-to-r from-amber-500 to-amber-400';

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={`font-medium ${statusColor} ${textSizes[size]}`}>
            {isComplete ? (
              <>
                <svg
                  className="inline w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Ready to Broadcast
              </>
            ) : (
              <>
                <svg
                  className="inline w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                Awaiting Signatures
              </>
            )}
          </span>
          <span className={`font-semibold ${statusColor} ${textSizes[size]}`}>
            {signaturesCollected} of {signaturesRequired}
          </span>
        </div>
      )}

      {/* Progress Bar */}
      <div className={`w-full bg-gray-750 rounded-full overflow-hidden ${barHeights[size]}`}>
        <div
          className={`${barColor} ${barHeights[size]} transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Individual Signature Indicators (for larger sizes) */}
      {size === 'lg' && (
        <div className="flex items-center gap-2">
          {Array.from({ length: signaturesRequired }).map((_, index) => {
            const isSigned = index < signaturesCollected;
            return (
              <div
                key={index}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  isSigned
                    ? 'border-green-500 bg-green-500/15 text-green-500'
                    : 'border-gray-600 bg-gray-800 text-gray-600'
                }`}
              >
                {isSigned ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SignatureProgress;
