/**
 * ReplaceWalletWarningModal - Scary warning before replacing wallet
 *
 * Only shown in replace existing wallet flow. Warns about destructive action.
 *
 * Features:
 * - Red warning theme
 * - Shows current wallet info
 * - Critical warnings
 * - Option to export current wallet first
 */

import React from 'react';
import Modal from '../../shared/Modal';

interface CurrentWalletInfo {
  singleSigAccountCount: number;
  multisigAccountCount: number;
  contactCount: number;
  created: string; // Formatted date
  network: 'testnet' | 'mainnet';
}

interface ReplaceWalletWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  onExportFirst: () => void;
  currentWallet: CurrentWalletInfo;
}

export const ReplaceWalletWarningModal: React.FC<ReplaceWalletWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  onExportFirst,
  currentWallet,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg border-t-4 border-red-500">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">⚠️</span>
          <h2 className="text-xl font-bold text-red-300">WARNING: Replace Existing Wallet</h2>
        </div>

        {/* Warning Text */}
        <p className="text-base text-gray-300 mb-6">
          Importing a backup will <strong className="text-white">PERMANENTLY</strong> replace your
          current wallet. This action <strong className="text-white">cannot be undone</strong>.
        </p>

        {/* Current Wallet Info */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-bold text-white mb-3">Your Current Wallet</h3>

          <ul className="text-sm text-gray-300 space-y-2">
            {currentWallet.singleSigAccountCount > 0 && (
              <li>• {currentWallet.singleSigAccountCount} Single-Sig Account{currentWallet.singleSigAccountCount !== 1 ? 's' : ''}</li>
            )}
            {currentWallet.multisigAccountCount > 0 && (
              <li>• {currentWallet.multisigAccountCount} Multisig Account{currentWallet.multisigAccountCount !== 1 ? 's' : ''}</li>
            )}
            <li>• {currentWallet.contactCount} Contact{currentWallet.contactCount !== 1 ? 's' : ''}</li>
            <li>• Created: {currentWallet.created}</li>
            <li>• Network: {currentWallet.network === 'testnet' ? 'Testnet' : 'Mainnet'}</li>
          </ul>
        </div>

        {/* Critical Warnings */}
        <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start mb-3">
            <span className="text-red-400 mr-2">⚠️</span>
            <h3 className="text-xs font-bold text-red-300">CRITICAL WARNING</h3>
          </div>

          <ul className="text-xs text-red-200 space-y-2 ml-6">
            <li>• All current accounts will be <strong>DELETED</strong></li>
            <li>• All contacts will be <strong>DELETED</strong></li>
            <li>• This action <strong>CANNOT be undone</strong></li>
            <li>• Make sure you have backups of current wallet</li>
          </ul>
        </div>

        {/* Recommendation */}
        <p className="text-sm text-gray-400 mb-4">
          <strong>Recommended:</strong> Export your current wallet before importing a backup.
        </p>

        {/* Export First Button */}
        <button
          onClick={onExportFirst}
          className="w-full bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 py-3 px-6 rounded-lg font-semibold mb-6 transition-colors flex items-center justify-center"
        >
          <span className="mr-2">💾</span>
          <span>Export Current Wallet First</span>
        </button>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 active:scale-[0.98] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            I Understand, Replace →
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReplaceWalletWarningModal;
