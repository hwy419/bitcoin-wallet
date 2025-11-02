/**
 * ExportWarningModal - Security warning before export
 *
 * First step in export flow. Ensures user understands security implications
 * of exporting encrypted wallet backup.
 *
 * Features:
 * - Clear security warnings
 * - Educational content
 * - Prominent continue button
 */

import React from 'react';
import Modal from '../../shared/Modal';

interface ExportWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const ExportWarningModal: React.FC<ExportWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">⚠️</span>
          <h2 className="text-xl font-bold text-white">Export Encrypted Backup</h2>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-300 mb-4">
            You're about to export an encrypted backup of your entire wallet. This file will contain:
          </p>

          <ul className="text-sm text-gray-300 space-y-2 mb-6 ml-4">
            <li>• All your accounts and private keys (encrypted)</li>
            <li>• All saved contacts</li>
            <li>• Transaction history and settings</li>
          </ul>

          {/* Security Warnings */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-start mb-3">
              <span className="text-amber-400 mr-2">⚠️</span>
              <h3 className="text-xs font-bold text-amber-300">SECURITY WARNINGS</h3>
            </div>

            <ul className="text-xs text-amber-200/90 space-y-2 ml-6">
              <li>
                • You'll create a <strong>SEPARATE</strong> password for this backup file
                (different from wallet password)
              </li>
              <li>
                • Store this backup file in a <strong>SECURE</strong> location
                (encrypted USB drive, password manager)
              </li>
              <li>
                • <strong>NEVER</strong> share this file or the backup password with anyone -
                they can access all your funds
              </li>
              <li>
                • Keep the backup password in a <strong>DIFFERENT</strong> location than
                the backup file
              </li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            autoFocus
          >
            I Understand, Continue →
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportWarningModal;
