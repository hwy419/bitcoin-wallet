/**
 * ImportBadge - Badge indicator for imported accounts
 *
 * Displays a small download arrow icon to indicate accounts that were
 * imported (from private key or seed phrase) rather than derived from
 * the main wallet seed.
 *
 * Features:
 * - Blue download arrow icon
 * - Tooltip explaining imported status
 * - Size variants (sm, md)
 * - Security reminder in tooltip
 *
 * Props:
 * - type: 'private-key' | 'seed' - Import method
 * - size: 'sm' | 'md' - Badge size (default: sm)
 * - showTooltip: boolean - Show tooltip on hover (default: true)
 *
 * Usage:
 * <ImportBadge type="private-key" size="sm" />
 */

import React, { useState } from 'react';

interface ImportBadgeProps {
  type: 'private-key' | 'seed';
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

export const ImportBadge: React.FC<ImportBadgeProps> = ({
  type,
  size = 'sm',
  showTooltip = true,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  };

  const tooltipText =
    type === 'private-key'
      ? 'Imported account (private key) - Back up separately'
      : 'Imported account (seed phrase) - Back up separately';

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Download Arrow Icon */}
      <svg
        className={`${sizeClasses[size]} text-blue-400 flex-shrink-0`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-label="Imported account"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>

      {/* Tooltip */}
      {showTooltip && isHovering && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-xl z-50 whitespace-nowrap">
          <p className="text-xs text-white">{tooltipText}</p>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportBadge;
