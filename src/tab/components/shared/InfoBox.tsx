import React, { useState } from 'react';

export type InfoBoxVariant = 'success' | 'warning' | 'info';

export interface InfoBoxProps {
  /** Box variant - determines color scheme */
  variant: InfoBoxVariant;
  /** Box title (optional) */
  title?: string;
  /** Box content */
  children: React.ReactNode;
  /** Whether the box is dismissible */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * InfoBox - Display informational, warning, or success messages
 *
 * Variants:
 * - success (green): Positive confirmation messages
 * - warning (amber): Privacy warnings, requires attention
 * - info (blue): Educational content, neutral information
 *
 * Features:
 * - Optional dismissible with X button
 * - ARIA live region for screen readers
 * - Keyboard accessible dismiss button
 *
 * Examples:
 *   <InfoBox variant="success" title="Address Generated">
 *     New address generated for privacy ✓
 *   </InfoBox>
 *
 *   <InfoBox variant="warning" title="Privacy Notice" dismissible onDismiss={() => {}}>
 *     This contact uses a single address...
 *   </InfoBox>
 */
export const InfoBox: React.FC<InfoBoxProps> = ({
  variant,
  title,
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) {
    return null;
  }

  // Variant-specific styling
  const variantStyles = {
    success: {
      container: 'bg-green-500/10 border-green-500/20',
      title: 'text-green-400',
      text: 'text-green-300',
      icon: '✓',
    },
    warning: {
      container: 'bg-amber-500/10 border-amber-500/20',
      title: 'text-amber-400',
      text: 'text-amber-300',
      icon: '⚠️',
    },
    info: {
      container: 'bg-blue-500/10 border-blue-500/20',
      title: 'text-blue-400',
      text: 'text-blue-300',
      icon: 'ℹ️',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`relative rounded-lg border p-4 ${styles.container} ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <span className="text-xl flex-shrink-0" aria-hidden="true">
          {styles.icon}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`text-sm font-semibold mb-1 ${styles.title}`}>
              {title}
            </h3>
          )}
          <div className={`text-sm ${styles.text}`}>
            {children}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className={`flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors ${styles.text}`}
            aria-label="Dismiss"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
