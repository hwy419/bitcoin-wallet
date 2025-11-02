/**
 * MultisigBadge - Visual indicator for multisig accounts
 *
 * Displays a purple badge with the multisig configuration (e.g., "2-of-3")
 * to distinguish multisig accounts from single-signature accounts.
 *
 * Props:
 * - config: MultisigConfig ('2-of-2' | '2-of-3' | '3-of-5')
 * - variant: 'default' | 'compact' | 'detailed'
 * - size: 'xs' | 'sm' | 'md' | 'lg'
 *
 * Usage:
 * <MultisigBadge config="2-of-3" variant="default" size="md" />
 */

import React from 'react';
import { MultisigConfig } from '../../../shared/types';

interface MultisigBadgeProps {
  config: MultisigConfig;
  variant?: 'default' | 'compact' | 'detailed';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const MultisigBadge: React.FC<MultisigBadgeProps> = ({
  config,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  // Size classes
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Parse configuration
  const [required, total] = config.split('-of-').map(Number);

  // Render based on variant
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 ${sizeClasses[size]} ${className}`}
      >
        <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
        </svg>
        {config}
      </span>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`inline-flex flex-col gap-0.5 rounded-lg bg-purple-500/10 border border-purple-500/30 ${sizeClasses[size]} ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <span className="font-semibold text-purple-400">Multisig</span>
        </div>
        <span className="text-purple-400/80">
          {required} of {total} signatures
        </span>
      </div>
    );
  }

  // Default variant
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded font-medium bg-purple-500/15 text-purple-400 border border-purple-500/30 ${sizeClasses[size]} ${className}`}
    >
      <svg className={iconSizes[size]} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
      <span>{config} Multisig</span>
    </span>
  );
};

export default MultisigBadge;
