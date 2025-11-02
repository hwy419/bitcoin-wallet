/**
 * NetworkMismatchWarningModal - Warning when backup network differs
 *
 * Shown conditionally after backup decryption if backup network doesn't
 * match current network setting.
 *
 * Features:
 * - Amber warning theme
 * - Clear explanation of network change
 * - Special emphasis on mainnet (real Bitcoin)
 */

import React from 'react';
import Modal from '../../shared/Modal';

interface BackupInfo {
  network: 'testnet' | 'mainnet';
  created: string; // Formatted date
  accountCount: number;
}

interface NetworkMismatchWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  backupInfo: BackupInfo;
  currentNetwork: 'testnet' | 'mainnet';
}

export const NetworkMismatchWarningModal: React.FC<NetworkMismatchWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  backupInfo,
  currentNetwork,
}) => {
  const backupNetworkLabel = backupInfo.network === 'testnet' ? 'TESTNET' : 'MAINNET';
  const currentNetworkLabel = currentNetwork === 'testnet' ? 'TESTNET' : 'MAINNET';
  const isGoingToMainnet = backupInfo.network === 'mainnet';

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">⚠️</span>
          <h2 className="text-xl font-bold text-amber-300">Network Mismatch Warning</h2>
        </div>

        {/* Explanation */}
        <p className="text-base text-gray-300 mb-6">
          This backup is for <strong className="text-white">{backupNetworkLabel}</strong> but
          your wallet is set to <strong className="text-white">{currentNetworkLabel}</strong>.
        </p>

        {/* Backup Info */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Backup Information</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Network: {backupNetworkLabel}</li>
            <li>• Created: {backupInfo.created}</li>
            <li>• Accounts: {backupInfo.accountCount}</li>
          </ul>
        </div>

        {/* What Will Happen */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start mb-3">
            <span className="text-amber-400 mr-2">⚠️</span>
            <h3 className="text-xs font-bold text-amber-300">What Will Happen</h3>
          </div>

          <ul className="text-xs text-amber-200 space-y-2 ml-6">
            <li>• Your network setting will change to <strong>{backupNetworkLabel}</strong></li>
            <li>• All addresses will be {backupNetworkLabel.toLowerCase()} addresses</li>
            <li>• You'll interact with Bitcoin <strong>{backupNetworkLabel}</strong></li>
            {isGoingToMainnet && (
              <li className="text-amber-100 font-bold">
                • This uses <strong>REAL Bitcoin</strong> (not testnet coins)
              </li>
            )}
          </ul>
        </div>

        {/* Confirmation */}
        <p className="text-sm text-gray-300 mb-6 text-center">
          Are you sure you want to continue?
        </p>

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
            className="flex-1 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 active:scale-[0.98] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            Change to {backupNetworkLabel} & Import
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default NetworkMismatchWarningModal;
