/**
 * ImportSuccessModal - Success confirmation after import
 *
 * Shows what was restored from backup. Has two variants:
 * - Fresh install: "Get Started" button
 * - Replace existing: "Done" button
 */

import React from 'react';
import Modal from '../../shared/Modal';

interface RestoreDetails {
  singleSigAccountCount: number;
  multisigAccountCount: number;
  multisigBreakdown?: string; // e.g., "1× 2-of-3, 1× 3-of-5"
  contactCount: number;
  network: 'testnet' | 'mainnet';
  backupCreated: string; // Formatted date string
}

interface ImportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  restoreDetails: RestoreDetails;
  isFreshInstall: boolean; // true = fresh install, false = replace existing
}

export const ImportSuccessModal: React.FC<ImportSuccessModalProps> = ({
  isOpen,
  onClose,
  restoreDetails,
  isFreshInstall,
}) => {
  const totalAccounts = restoreDetails.singleSigAccountCount + restoreDetails.multisigAccountCount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">✅</span>
          <h2 className="text-xl font-bold text-white">
            {isFreshInstall ? 'Wallet Successfully Restored' : 'Wallet Successfully Replaced'}
          </h2>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center my-6">
          <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center animate-scale-in">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        {/* Success Message */}
        <p className="text-base text-gray-300 text-center mb-6">
          {isFreshInstall
            ? 'Your wallet has been restored from the backup file.'
            : 'Your old wallet has been replaced with the imported backup.'}
        </p>

        {/* Restored Data Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Restored Data</h3>

          {/* Accounts */}
          {restoreDetails.singleSigAccountCount > 0 && (
            <div className="flex items-start mb-2">
              <span className="mr-2">•</span>
              <span className="text-sm text-white">
                {restoreDetails.singleSigAccountCount} Single-Sig Account{restoreDetails.singleSigAccountCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {restoreDetails.multisigAccountCount > 0 && (
            <div className="flex items-start mb-2">
              <span className="mr-2">•</span>
              <span className="text-sm text-white">
                {restoreDetails.multisigAccountCount} Multisig Account{restoreDetails.multisigAccountCount !== 1 ? 's' : ''}
                {restoreDetails.multisigBreakdown && ` (${restoreDetails.multisigBreakdown})`}
              </span>
            </div>
          )}

          {/* Contacts */}
          <div className="flex items-start mb-2">
            <span className="mr-2">•</span>
            <span className="text-sm text-white">
              {restoreDetails.contactCount} Contact{restoreDetails.contactCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Settings */}
          <div className="flex items-start mb-3">
            <span className="mr-2">•</span>
            <span className="text-sm text-white">All Settings</span>
          </div>

          {/* Network */}
          <div className="flex items-start mb-2 pt-3 border-t border-gray-800">
            <span className="text-gray-500 mr-2">🌐</span>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Network: </span>
              <span className="text-sm text-white">{restoreDetails.network === 'testnet' ? 'Testnet' : 'Mainnet'}</span>
            </div>
          </div>

          {/* Backup Created Date */}
          <div className="flex items-start">
            <span className="text-gray-500 mr-2">📅</span>
            <div className="flex-1">
              <span className="text-xs text-gray-500">Backup Created: </span>
              <span className="text-sm text-gray-300">{restoreDetails.backupCreated}</span>
            </div>
          </div>
        </div>

        {/* Next Steps Text */}
        <p className="text-sm text-gray-400 text-center mb-6">
          {isFreshInstall
            ? 'You can now unlock your wallet with the password you just created.'
            : 'Your wallet is now unlocked with your existing password.'}
        </p>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="w-auto px-12 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            autoFocus
          >
            {isFreshInstall ? 'Get Started' : 'Done'}
          </button>
        </div>

        {/* Announce success to screen readers */}
        <div role="alert" aria-live="assertive" className="sr-only">
          {isFreshInstall ? 'Wallet successfully restored' : 'Wallet successfully replaced'}
        </div>
      </div>
    </Modal>
  );
};

export default ImportSuccessModal;
