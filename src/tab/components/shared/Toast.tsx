/**
 * Toast - Toast notification component
 *
 * Displays temporary notification messages for success, error, and info.
 * Auto-dismisses after 5 seconds or can be manually dismissed.
 *
 * Features:
 * - Success (green), Error (red), Info (blue) variants
 * - Auto-dismiss after 5 seconds
 * - Manual dismiss with X button
 * - Positioned at top-center of screen
 * - Slide-in animation from top
 *
 * Props:
 * - message: Toast message text
 * - type: 'success' | 'error' | 'info'
 * - onClose: Callback when toast is dismissed
 * - duration: Auto-dismiss duration in ms (default: 5000)
 *
 * Usage:
 * <Toast
 *   message="Contact added successfully"
 *   type="success"
 *   onClose={() => setShowToast(false)}
 * />
 */

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type,
  onClose,
  duration = 5000,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Styling based on type
  const typeStyles = {
    success: 'bg-green-500/15 border-green-500/30 text-green-300',
    error: 'bg-red-500/15 border-red-500/30 text-red-300',
    info: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
  };

  const iconPath = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  };

  return (
    <div
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] px-4 py-3 border rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[500px] animate-slide-in-top ${typeStyles[type]}`}
      role="alert"
    >
      {/* Icon */}
      <svg
        className="w-5 h-5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={iconPath[type]}
        />
      </svg>

      {/* Message */}
      <p className="flex-1 text-sm font-medium">{message}</p>

      {/* Close button */}
      <button
        onClick={onClose}
        className="flex-shrink-0 p-1 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
