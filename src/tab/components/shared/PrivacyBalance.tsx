/**
 * PrivacyBalance - Reusable component for displaying balances with privacy support
 *
 * Features:
 * - Shows actual amount when privacy mode is off
 * - Shows "••••• BTC" (5 bullets) when privacy mode is on
 * - Optional click-to-toggle functionality
 * - Optional USD value display
 * - Size variants (sm, md, lg)
 * - Eye icon indicator when hidden
 * - Smooth transition animation
 * - Full keyboard accessibility
 *
 * Props:
 * - amount: Amount in BTC (number)
 * - usdValue: Optional USD equivalent
 * - showCurrency: Show "BTC" suffix (default: true)
 * - showUsd: Show USD value (default: false)
 * - size: Font size variant (default: 'md')
 * - clickable: Allow click-to-toggle (default: true)
 * - className: Additional Tailwind classes
 *
 * Usage:
 * <PrivacyBalance
 *   amount={0.12345678}
 *   usdValue={3500}
 *   showUsd={true}
 *   size="lg"
 *   clickable={true}
 * />
 */

import React, { useMemo } from 'react';
import { usePrivacy } from '../../contexts/PrivacyContext';

// ============================================================================
// Types
// ============================================================================

interface PrivacyBalanceProps {
  amount: number; // Amount in BTC
  usdValue?: number; // Optional USD equivalent
  showCurrency?: boolean; // Show "BTC" suffix (default: true)
  showUsd?: boolean; // Show USD value (default: false)
  size?: 'sm' | 'md' | 'lg'; // Font size variant
  clickable?: boolean; // Allow click-to-toggle (default: true)
  className?: string; // Additional Tailwind classes
}

// ============================================================================
// Component
// ============================================================================

export const PrivacyBalance: React.FC<PrivacyBalanceProps> = ({
  amount,
  usdValue,
  showCurrency = true,
  showUsd = false,
  size = 'md',
  clickable = true,
  className = '',
}) => {
  const { balancesHidden, togglePrivacy } = usePrivacy();

  // Format BTC amount
  const formatBTC = (btc: number): string => {
    return btc.toFixed(8);
  };

  // Format USD amount
  const formatUSD = (usd: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(usd);
  };

  // Size-based classes
  const sizeClasses = useMemo(() => {
    switch (size) {
      case 'sm':
        return {
          btc: 'text-sm',
          usd: 'text-xs',
          icon: 'w-3 h-3',
        };
      case 'lg':
        return {
          btc: 'text-3xl lg:text-4xl',
          usd: 'text-lg lg:text-xl',
          icon: 'w-5 h-5',
        };
      case 'md':
      default:
        return {
          btc: 'text-base',
          usd: 'text-sm',
          icon: 'w-4 h-4',
        };
    }
  }, [size]);

  // Handle click
  const handleClick = () => {
    if (clickable) {
      togglePrivacy();
    }
  };

  // Handle keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      togglePrivacy();
    }
  };

  // ARIA label
  const ariaLabel = useMemo(() => {
    if (balancesHidden) {
      return 'Balance hidden for privacy. Click to show.';
    } else {
      const btcText = `${formatBTC(amount)} Bitcoin`;
      const usdText = usdValue && showUsd ? `, approximately ${formatUSD(usdValue)}` : '';
      return `Balance: ${btcText}${usdText}. Click to hide.`;
    }
  }, [balancesHidden, amount, usdValue, showUsd]);

  return (
    <div
      className={`inline-flex flex-col items-center transition-opacity duration-200 ${
        clickable ? 'cursor-pointer select-none' : ''
      } ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : -1}
      role={clickable ? 'button' : 'text'}
      aria-label={ariaLabel}
    >
      {/* BTC Amount */}
      <div className="flex items-center gap-2">
        {balancesHidden && (
          <svg
            className={`${sizeClasses.icon} text-gray-400 flex-shrink-0`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
        )}
        <span className={`${sizeClasses.btc} font-bold text-white transition-all duration-200`}>
          {balancesHidden ? '•••••' : formatBTC(amount)}
          {showCurrency && ` BTC`}
        </span>
      </div>

      {/* USD Value */}
      {showUsd && usdValue !== undefined && (
        <span className={`${sizeClasses.usd} text-gray-400 transition-all duration-200`}>
          {balancesHidden ? '$ •••••' : `≈ ${formatUSD(usdValue)}`}
        </span>
      )}

      {/* Hover hint for clickable */}
      {clickable && (
        <style>{`
          @media (hover: hover) {
            [role="button"]:hover {
              opacity: 0.8;
            }
          }
        `}</style>
      )}
    </div>
  );
};

export default PrivacyBalance;
