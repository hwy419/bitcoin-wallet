/**
 * SecurityWarning - Amber warning banner component
 *
 * Displays security warnings for account import flows, emphasizing
 * that imported accounts are not backed up by the main wallet seed.
 *
 * Features:
 * - Amber color scheme with warning icon
 * - 4px left border accent
 * - Emphasis on critical security information
 * - Flexible content via children
 *
 * Props:
 * - children: Warning content (text or JSX)
 *
 * Usage:
 * <SecurityWarning>
 *   <strong>Warning:</strong> Imported accounts are NOT backed up by your
 *   wallet's main seed phrase. Back them up separately.
 * </SecurityWarning>
 */

import React from 'react';

interface SecurityWarningProps {
  children: React.ReactNode;
}

export const SecurityWarning: React.FC<SecurityWarningProps> = ({ children }) => {
  return (
    <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 border-l-4 border-l-amber-500 rounded-lg">
      {/* Warning Icon */}
      <svg
        className="w-6 h-6 text-amber-400 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>

      {/* Warning Content */}
      <div className="flex-1 text-sm font-medium text-amber-100 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default SecurityWarning;
