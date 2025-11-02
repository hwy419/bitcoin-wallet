/**
 * Modal - Reusable modal dialog component
 *
 * A centered modal overlay with backdrop for displaying dialogs, forms, and confirmations.
 * Supports keyboard navigation (Escape to close) and click-outside-to-close.
 *
 * Features:
 * - Dark overlay backdrop
 * - Click outside to close (optional)
 * - Escape key to close
 * - Smooth fade-in animation
 * - Scroll lock when open
 *
 * Props:
 * - isOpen: Controls modal visibility
 * - onClose: Callback when modal should close
 * - children: Modal content
 * - closeOnBackdropClick: Allow closing by clicking backdrop (default: true)
 *
 * Usage:
 * <Modal isOpen={showModal} onClose={() => setShowModal(false)}>
 *   <div className="p-6">
 *     <h2>Modal Title</h2>
 *     <p>Modal content...</p>
 *   </div>
 * </Modal>
 */

import React, { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  closeOnBackdropClick = true,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Track mousedown to differentiate between clicks and drags
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    mouseDownTargetRef.current = event.target;
  };

  // Handle backdrop click (only if mousedown also happened on backdrop)
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only close if both mousedown and mouseup happened on the backdrop
    // This prevents closing when dragging text selection from inside modal to outside
    if (
      closeOnBackdropClick &&
      event.target === event.currentTarget &&
      mouseDownTargetRef.current === event.target
    ) {
      onClose();
    }
    mouseDownTargetRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onMouseDown={handleMouseDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className={`bg-gray-900 border border-gray-700 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-in ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
