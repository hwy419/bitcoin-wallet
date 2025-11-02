/**
 * AccountCreationModal - Create new HD-derived account modal
 *
 * Modal dialog for creating a new single-signature account derived from the
 * main wallet seed using BIP44 hierarchical deterministic derivation.
 *
 * Features:
 * - Account name input with validation (max 30 chars)
 * - Address type selector (Legacy, SegWit, Native SegWit)
 * - HD derivation info box
 * - Form validation
 * - Loading states
 * - Success/error handling
 *
 * Flow:
 * 1. User enters account name
 * 2. User selects address type
 * 3. Submit creates account via CREATE_ACCOUNT message
 * 4. Account added to wallet and dropdown
 * 5. Success toast and modal closes
 *
 * Props:
 * - isOpen: Modal visibility
 * - onClose: Close modal callback
 * - onSuccess: Success callback with created account
 *
 * Usage:
 * <AccountCreationModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={(account) => handleAccountCreated(account)}
 * />
 */

import React, { useState } from 'react';
import Modal from '../shared/Modal';
import FormField from '../shared/FormField';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType, WalletAccount } from '../../../shared/types';

type AddressType = 'legacy' | 'segwit' | 'native-segwit';

interface AddressTypeOption {
  type: AddressType;
  displayName: string;
  description: string;
  prefix: string;
  bipPath: string;
  recommended: boolean;
}

const ADDRESS_TYPES: AddressTypeOption[] = [
  {
    type: 'native-segwit',
    displayName: 'Native SegWit',
    description: 'Lower fees and better privacy',
    prefix: 'tb1... addresses',
    bipPath: "m/84'/1'/N'/0/0",
    recommended: true,
  },
  {
    type: 'segwit',
    displayName: 'SegWit',
    description: 'Moderate fees, good compatibility',
    prefix: '2... addresses',
    bipPath: "m/49'/1'/N'/0/0",
    recommended: false,
  },
  {
    type: 'legacy',
    displayName: 'Legacy',
    description: 'Widest compatibility, higher fees',
    prefix: 'm/n... addresses',
    bipPath: "m/44'/1'/N'/0/0",
    recommended: false,
  },
];

interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: WalletAccount) => void;
}

export const AccountCreationModal: React.FC<AccountCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  const [accountName, setAccountName] = useState('');
  const [addressType, setAddressType] = useState<AddressType>('native-segwit');
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form validation
  const nameError =
    accountName.trim().length === 0 && accountName.length > 0
      ? 'Account name is required'
      : accountName.length > 30
      ? 'Account name must be 30 characters or less'
      : null;

  const isFormValid = accountName.trim().length > 0 && accountName.length <= 30 && addressType;

  // Character count color
  const charCountColor =
    accountName.length > 30
      ? 'text-red-500'
      : accountName.length > 25
      ? 'text-amber-500'
      : 'text-gray-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await sendMessage<{ account: WalletAccount }>(
        MessageType.CREATE_ACCOUNT,
        {
          name: accountName.trim(),
          addressType,
        }
      );

      // Success
      onSuccess(response.account);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setAccountName('');
    setAddressType('native-segwit');
    setShowAddressDropdown(false);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  const selectedAddressTypeOption = ADDRESS_TYPES.find((opt) => opt.type === addressType)!;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnBackdropClick={!isSubmitting} className="w-[800px] max-w-[90vw]">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-750 bg-gray-850">
          <h2 className="text-xl font-semibold text-white tracking-tight">Create New Account</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Account Name Field */}
          <FormField
            label="Account Name"
            id="account-name"
            error={nameError || undefined}
            helperText="Enter a name to identify this account"
            required
          >
            <input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., My Savings Account"
              maxLength={50}
              className={`w-full h-12 px-4 bg-gray-950 border ${
                nameError ? 'border-red-500 focus:ring-red-500/30' : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
              } rounded-lg text-white text-sm transition-all focus:outline-none focus:ring-3`}
              aria-required="true"
              aria-invalid={!!nameError}
              aria-describedby={nameError ? 'account-name-error' : 'account-name-helper'}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Character Counter */}
          <div className="flex justify-end -mt-4">
            <span className={`text-xs ${charCountColor}`}>{accountName.length}/30</span>
          </div>

          {/* Address Type Selector */}
          <FormField
            label="Address Type"
            id="address-type"
            helperText={selectedAddressTypeOption.description}
            required
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                disabled={isSubmitting}
                className="w-full h-12 px-4 bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-bitcoin focus:ring-3 focus:ring-bitcoin/30 rounded-lg text-white text-sm transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                aria-haspopup="listbox"
                aria-expanded={showAddressDropdown}
              >
                <span className="flex items-center gap-2">
                  {selectedAddressTypeOption.displayName}
                  {selectedAddressTypeOption.recommended && (
                    <span className="px-2 py-0.5 bg-bitcoin/20 text-bitcoin text-xs font-semibold rounded uppercase tracking-wide">
                      Recommended
                    </span>
                  )}
                </span>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showAddressDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-850 border border-gray-700 rounded-lg shadow-2xl z-10 py-1">
                  {ADDRESS_TYPES.map((option) => (
                    <button
                      key={option.type}
                      type="button"
                      onClick={() => {
                        setAddressType(option.type);
                        setShowAddressDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                        addressType === option.type ? 'bg-bitcoin/10 border-l-2 border-bitcoin' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white flex items-center gap-2">
                          {option.displayName}
                          {option.recommended && (
                            <span className="px-2 py-0.5 bg-bitcoin/20 text-bitcoin text-xs font-semibold rounded uppercase tracking-wide">
                              Recommended
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.prefix}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {/* HD Derivation Info Box */}
          <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1 text-sm text-blue-400 leading-relaxed">
              <p>
                This account will be derived from your existing wallet seed using BIP44 hierarchical derivation.
              </p>
              <p className="mt-2 font-mono text-xs text-blue-300 bg-black/30 px-2 py-1 rounded inline-block">
                Path: {selectedAddressTypeOption.bipPath}
              </p>
              <p className="mt-2 text-xs text-blue-400/80">
                Your seed phrase already backs up this account.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-750 bg-gray-850">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-11 px-6 bg-transparent border border-gray-600 hover:bg-gray-800 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="h-11 px-8 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 min-w-[160px] flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                <span>Creating...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AccountCreationModal;
