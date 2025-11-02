/**
 * ErrorDisplay - User-friendly error display component
 *
 * Displays blockchain API errors in a clear, actionable way.
 * Maps technical errors to user-friendly messages with appropriate actions.
 *
 * Features:
 * - User-friendly error messages (no technical jargon)
 * - Retry button for recoverable errors
 * - Contextual help and next steps
 * - Support for proxy errors, rate limiting, network issues
 * - Maintains funds safety reassurance
 *
 * Props:
 * - type: Error type (maps to ApiErrorType)
 * - message: Error message to display
 * - details: Optional additional details
 * - onRetry: Optional callback for retry action
 * - showReassurance: Show "Your Bitcoin is safe" message (default: true)
 *
 * Usage:
 * <ErrorDisplay
 *   type="PROXY_ERROR"
 *   message="Blockchain service temporarily unavailable"
 *   onRetry={() => refetchData()}
 * />
 */

import React from 'react';

interface ErrorDisplayProps {
  type: 'PROXY_ERROR' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'TIMEOUT' | 'BROADCAST_FAILED' | 'UNKNOWN';
  message: string;
  details?: string;
  onRetry?: () => void;
  showReassurance?: boolean;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type,
  message,
  details,
  onRetry,
  showReassurance = true,
}) => {
  // Get icon based on error type
  const getIcon = () => {
    switch (type) {
      case 'PROXY_ERROR':
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        );
      case 'RATE_LIMITED':
        return (
          <svg className="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case 'BROADCAST_FAILED':
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  // Get user-friendly title based on error type
  const getTitle = () => {
    switch (type) {
      case 'PROXY_ERROR':
        return 'Service Unavailable';
      case 'RATE_LIMITED':
        return 'Too Many Requests';
      case 'NETWORK_ERROR':
        return 'Connection Problem';
      case 'TIMEOUT':
        return 'Request Timed Out';
      case 'BROADCAST_FAILED':
        return 'Transaction Failed';
      default:
        return 'Something Went Wrong';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
      {/* Icon */}
      <div className="mb-4">{getIcon()}</div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-white mb-2">{getTitle()}</h3>

      {/* Message */}
      <p className="text-sm text-gray-400 mb-4 max-w-md">{message}</p>

      {/* Details (if provided) */}
      {details && (
        <div className="mb-4 p-3 bg-gray-850 border border-gray-700 rounded-lg max-w-md">
          <p className="text-xs text-gray-500">{details}</p>
        </div>
      )}

      {/* Reassurance (for transaction-related errors) */}
      {showReassurance && type === 'BROADCAST_FAILED' && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg max-w-md">
          <p className="text-sm text-green-300 flex items-center gap-2 justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Your Bitcoin is safe
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active text-white py-2.5 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>
        )}
      </div>

      {/* Helpful Tips */}
      {type === 'NETWORK_ERROR' && (
        <div className="mt-4 text-xs text-gray-500 max-w-md">
          <p>Check your internet connection and try again.</p>
        </div>
      )}
      {type === 'RATE_LIMITED' && (
        <div className="mt-4 text-xs text-gray-500 max-w-md">
          <p>Please wait a moment before trying again.</p>
        </div>
      )}
      {type === 'PROXY_ERROR' && (
        <div className="mt-4 text-xs text-gray-500 max-w-md">
          <p>The blockchain service is temporarily unavailable. This usually resolves quickly.</p>
        </div>
      )}
    </div>
  );
};

export default ErrorDisplay;
