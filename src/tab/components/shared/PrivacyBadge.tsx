import React from 'react';

export type PrivacyBadgeVariant = 'success' | 'warning' | 'info';

export interface PrivacyBadgeProps {
  /** Badge variant - determines color and icon */
  variant: PrivacyBadgeVariant;
  /** Badge text content */
  children: React.ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Optional ARIA label for accessibility */
  ariaLabel?: string;
}

/**
 * PrivacyBadge - Display privacy status indicators
 *
 * Variants:
 * - success (green): Privacy enabled, positive indicator (e.g., "✓ Address Rotation", "✓ Fresh")
 * - warning (amber): Privacy risk, needs attention (e.g., "⚠️ Reuses Address", "⚠️ Previously used")
 * - info (blue): Informational, neutral (e.g., educational tooltips)
 *
 * Examples:
 *   <PrivacyBadge variant="success">✓ Fresh</PrivacyBadge>
 *   <PrivacyBadge variant="warning">⚠️ Previously used</PrivacyBadge>
 *   <PrivacyBadge variant="info">Address Rotation</PrivacyBadge>
 */
export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  variant,
  children,
  className = '',
  ariaLabel,
}) => {
  // Variant-specific styling
  const variantStyles = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium ${variantStyles[variant]} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
};
