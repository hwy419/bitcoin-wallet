/**
 * MultisigAccountSummary - Final review before creating multisig account
 *
 * Shows complete configuration summary and allows user to name the account.
 * Last step before calling CREATE_MULTISIG_ACCOUNT backend handler.
 *
 * Features:
 * - Configuration summary (type, address type, derivation path)
 * - First address display
 * - Co-signer list with nicknames
 * - Account naming input
 * - Security reminders
 * - Create account button
 *
 * Props:
 * - config: Multisig configuration
 * - addressType: Address type
 * - cosigners: List of co-signers
 * - accountName: Current account name
 * - onNameChange: Callback when name changes
 * - defaultName: Default suggested name
 * - isCreating: Loading state during account creation
 * - onCreateAccount: Callback to create account
 *
 * Usage:
 * <MultisigAccountSummary
 *   config={wizard.state.selectedConfig}
 *   addressType={wizard.state.selectedAddressType}
 *   cosigners={wizard.state.cosignerXpubs}
 *   accountName={wizard.state.accountName}
 *   onNameChange={wizard.setAccountName}
 *   defaultName={wizard.getDefaultAccountName()}
 *   isCreating={wizard.state.isCreating}
 *   onCreateAccount={handleCreateAccount}
 * />
 */

import React, { useEffect } from 'react';
import { MultisigConfig, MultisigAddressType, Cosigner } from '../../../shared/types';

interface MultisigAccountSummaryProps {
  config: MultisigConfig;
  addressType: MultisigAddressType;
  cosigners: Cosigner[];
  accountName: string;
  onNameChange: (name: string) => void;
  defaultName: string;
  isCreating: boolean;
  onCreateAccount: () => void;
}

export const MultisigAccountSummary: React.FC<MultisigAccountSummaryProps> = ({
  config,
  addressType,
  cosigners,
  accountName,
  onNameChange,
  defaultName,
  isCreating,
  onCreateAccount,
}) => {
  // Set default name on mount if empty
  useEffect(() => {
    if (!accountName) {
      onNameChange(defaultName);
    }
  }, [accountName, defaultName, onNameChange]);

  const getAddressTypeLabel = (): string => {
    switch (addressType) {
      case 'p2wsh':
        return 'P2WSH (Native SegWit)';
      case 'p2sh-p2wsh':
        return 'P2SH-P2WSH (Wrapped SegWit)';
      case 'p2sh':
        return 'P2SH (Legacy)';
    }
  };

  const getDerivationPath = (): string => {
    const scriptType = addressType === 'p2wsh' ? '2' : addressType === 'p2sh-p2wsh' ? '1' : '0';
    return `m/48'/1'/0'/${scriptType}'`;
  };

  const truncateXpub = (xpub: string, maxLength: number = 40): string => {
    if (xpub.length <= maxLength) return xpub;
    const start = xpub.slice(0, 12);
    const end = xpub.slice(-8);
    return `${start}...${end}`;
  };

  const formatFingerprint = (fingerprint: string): string => {
    return fingerprint.match(/.{1,4}/g)?.join(' ') || fingerprint;
  };

  const isValid = accountName.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Review Multisig Configuration</h2>
        <p className="text-gray-400">Verify all details before creating account</p>
      </div>

      {/* Success Indicator */}
      <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-semibold text-green-400">Setup Complete</p>
          <p className="text-sm text-green-400/80">All requirements verified</p>
        </div>
      </div>

      {/* Configuration Details */}
      <div className="p-5 bg-gray-850 border border-gray-700 rounded-lg space-y-3">
        <h3 className="text-base font-semibold text-white mb-3">Configuration Details</h3>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Multisig Type</p>
            <p className="font-semibold text-white">{config}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-1">Address Type</p>
            <p className="font-semibold text-white">{getAddressTypeLabel()}</p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 mb-1">Derivation Path</p>
            <p className="font-mono text-sm text-gray-300">{getDerivationPath()}</p>
          </div>
        </div>
      </div>

      {/* Co-Signers */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3">
          Co-Signers ({cosigners.length})
        </h3>
        <div className="space-y-2">
          {cosigners.map((cosigner, index) => (
            <div key={cosigner.fingerprint} className="p-4 bg-gray-850 border border-gray-700 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-purple-500/20 text-purple-400 rounded-full text-xs font-bold">
                    {index + 1}
                  </span>
                  <p className="font-semibold text-white">
                    {cosigner.name || `Co-Signer ${index + 1}`}
                  </p>
                </div>
                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-gray-500">
                  Fingerprint:{' '}
                  <span className="font-mono text-bitcoin">{formatFingerprint(cosigner.fingerprint)}</span>
                </p>
                <p className="text-xs text-gray-600 break-all">{truncateXpub(cosigner.xpub, 40)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">Account Name</label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Family Savings, Business Treasury"
          className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-bitcoin"
          maxLength={32}
        />
        <p className="mt-1 text-xs text-gray-500">{accountName.length}/32 characters</p>
      </div>

      {/* Security Reminders */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <h4 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          Security Reminders
        </h4>
        <ul className="text-sm text-amber-400/80 space-y-1">
          <li>• Back up your 12-word seed phrase securely</li>
          <li>• Ensure all co-signers have backed up their keys</li>
          <li>• Test by sending a small amount first</li>
        </ul>
      </div>

      {/* Create Button */}
      <button
        onClick={onCreateAccount}
        disabled={!isValid || isCreating}
        className={`
          w-full py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2
          ${
            isValid && !isCreating
              ? 'bg-bitcoin hover:bg-bitcoin-hover text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }
        `}
      >
        {isCreating && (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-600 border-t-white"></div>
        )}
        {isCreating ? 'Creating Account...' : 'Create Multisig Account'}
      </button>
    </div>
  );
};

export default MultisigAccountSummary;
