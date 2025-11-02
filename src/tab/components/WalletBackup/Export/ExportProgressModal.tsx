/**
 * ExportProgressModal - Shows encryption progress
 *
 * Step 4 in export flow. Non-dismissible modal showing progress during
 * backup encryption (10-20 seconds).
 *
 * Features:
 * - Non-dismissible during operation
 * - Progress bar (0-100%)
 * - Step-by-step status updates
 * - Warning to not close window
 */

import React from 'react';
import Modal from '../../shared/Modal';

interface ExportProgressModalProps {
  isOpen: boolean;
  progress: number; // 0-100
  currentStep: string;
}

export const ExportProgressModal: React.FC<ExportProgressModalProps> = ({
  isOpen,
  progress,
  currentStep,
}) => {
  // Modal is non-dismissible - no onClose callback
  return (
    <Modal isOpen={isOpen} onClose={() => {}} closeOnBackdropClick={false} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">🔐</span>
          <h2 className="text-xl font-bold text-white">Encrypting Your Backup...</h2>
        </div>

        {/* Spinner */}
        <div className="flex justify-center my-6">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-700 border-t-bitcoin"></div>
        </div>

        {/* Status Text */}
        <p className="text-base text-gray-300 text-center mb-2">
          Encrypting your wallet backup...
        </p>
        <p className="text-sm text-gray-500 text-center mb-6">
          This may take 10-20 seconds
        </p>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-bitcoin h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-400 italic">{currentStep}</span>
            <span className="text-sm text-gray-400 font-mono">{progress}%</span>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
          <p className="text-sm text-amber-300 text-center flex items-center justify-center">
            <span className="mr-2">⚠️</span>
            <span>Do not close this window</span>
          </p>
        </div>

        {/* Live region for screen readers */}
        <div role="status" aria-live="polite" className="sr-only">
          {currentStep}. Progress: {progress}%
        </div>
      </div>
    </Modal>
  );
};

export default ExportProgressModal;
