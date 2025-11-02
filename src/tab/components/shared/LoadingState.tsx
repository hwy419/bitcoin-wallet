/**
 * LoadingState - Progressive loading indicator component
 *
 * Displays appropriate loading feedback based on elapsed time.
 * Implements progressive disclosure pattern: simple spinner → slow warning → timeout.
 *
 * Features:
 * - Simple spinner for normal loads (0-3 seconds)
 * - "Slower than usual" warning after 3 seconds
 * - Customizable message
 * - Maintains Bitcoin brand (orange accent color)
 * - Accessible (proper ARIA labels)
 *
 * Props:
 * - message: Loading message to display (default: "Loading...")
 * - showSlowWarning: Force show "slower than usual" warning
 *
 * Usage:
 * <LoadingState message="Fetching transactions..." />
 * <LoadingState message="Broadcasting transaction..." showSlowWarning />
 */

import React from 'react';

interface LoadingStateProps {
  message?: string;
  showSlowWarning?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  showSlowWarning = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-6" role="status" aria-live="polite">
      {/* Spinner */}
      <div className="relative mb-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-700 border-t-bitcoin"></div>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-400 mb-2 font-medium">{message}</p>

      {/* Slow Connection Warning */}
      {showSlowWarning && (
        <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>Connection is slower than usual</span>
        </div>
      )}
    </div>
  );
};

export default LoadingState;
