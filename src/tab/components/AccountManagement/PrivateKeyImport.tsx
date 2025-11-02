/**
 * PrivateKeyImport - Private key text import component
 *
 * Allows users to import a Bitcoin account from a WIF-format private key by pasting.
 * Uses new v0.10.0 backend handlers (VALIDATE_WIF) for real-time validation.
 *
 * Features:
 * - WIF format validation using VALIDATE_WIF backend handler
 * - Real-time validation with debouncing
 * - Network detection (testnet vs mainnet)
 * - Address type selection (Legacy/SegWit/Native SegWit)
 * - Account name input
 * - Validation status indicators
 * - Helper text with format hints
 *
 * Props:
 * - privateKey: Current private key value
 * - onPrivateKeyChange: Private key change handler
 * - accountName: Current account name value
 * - onAccountNameChange: Account name change handler
 * - addressType: Selected address type
 * - onAddressTypeChange: Address type change handler
 * - validationResult: WIF validation result from backend
 * - isValidating: Validation in progress
 * - errors: Form validation errors
 * - isSubmitting: Loading state
 *
 * Usage:
 * <PrivateKeyImport
 *   privateKey={privateKey}
 *   onPrivateKeyChange={setPrivateKey}
 *   accountName={accountName}
 *   onAccountNameChange={setAccountName}
 *   addressType={addressType}
 *   onAddressTypeChange={setAddressType}
 *   validationResult={result}
 *   isValidating={false}
 *   errors={errors}
 *   isSubmitting={false}
 * />
 */

import React from 'react';
import FormField from '../shared/FormField';
import { AddressType } from '../../../shared/types/index';

interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: AddressType;
  compressed?: boolean;
  error?: string;
}

interface PrivateKeyImportProps {
  privateKey: string;
  onPrivateKeyChange: (value: string) => void;
  accountName: string;
  onAccountNameChange: (value: string) => void;
  addressType: AddressType;
  onAddressTypeChange: (value: AddressType) => void;
  validationResult: WIFValidationResult | null;
  isValidating: boolean;
  errors: {
    privateKey?: string;
    accountName?: string;
  };
  isSubmitting: boolean;
}

export const PrivateKeyImport: React.FC<PrivateKeyImportProps> = ({
  privateKey,
  onPrivateKeyChange,
  accountName,
  onAccountNameChange,
  addressType,
  onAddressTypeChange,
  validationResult,
  isValidating,
  errors,
  isSubmitting,
}) => {
  // Character count color for account name
  const charCountColor =
    accountName.length > 30
      ? 'text-red-500'
      : accountName.length > 25
      ? 'text-amber-500'
      : 'text-gray-500';

  return (
    <div className="space-y-6">
      {/* Private Key Input */}
      <FormField
        label="Private Key (WIF Format)"
        id="private-key-text"
        error={errors.privateKey}
        helperText="Paste your private key in Wallet Import Format (WIF)"
        required
      >
        <textarea
          id="private-key-text"
          value={privateKey}
          onChange={(e) => onPrivateKeyChange(e.target.value)}
          placeholder="Paste WIF here (e.g., cT1Y...ABC)"
          rows={3}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 bg-gray-950 border ${
            errors.privateKey
              ? 'border-red-500 focus:ring-red-500/30'
              : validationResult?.valid
              ? 'border-green-500 focus:ring-green-500/30'
              : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
          } rounded-lg text-white text-sm font-mono resize-vertical transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-required="true"
          aria-invalid={!!errors.privateKey}
          aria-describedby={errors.privateKey ? 'private-key-text-error' : 'private-key-text-helper'}
          spellCheck={false}
        />
      </FormField>

      {/* Validation Status */}
      {isValidating && (
        <div className="flex items-center gap-2 text-sm text-gray-400 -mt-4">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Validating...
        </div>
      )}

      {validationResult && !isValidating && privateKey && (
        <div className={`flex items-center gap-2 text-sm -mt-4 ${validationResult.valid ? 'text-green-400' : 'text-red-400'}`}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            {validationResult.valid ? (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
          </svg>
          {validationResult.valid ? `Valid WIF - ${validationResult.network}` : 'Invalid WIF format'}
        </div>
      )}

      {/* Validation Result Preview */}
      {validationResult && validationResult.valid && (
        <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Preview</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Network:</span>
              <span className="text-sm font-medium text-white capitalize">
                {validationResult.network}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Key Type:</span>
              <span className="text-sm font-medium text-white">
                {validationResult.compressed ? 'Compressed' : 'Uncompressed'}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-400">First Address:</span>
              <span className="text-xs font-mono text-gray-300 break-all text-right ml-4 max-w-[300px]">
                {validationResult.firstAddress}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Account Details Form (only show after validation) */}
      {validationResult && validationResult.valid && (
        <>
          {/* Account Name Input */}
          <FormField
            label="Account Name"
            id="text-account-name"
            error={errors.accountName}
            helperText="Enter a name to identify this account"
            required
          >
            <input
              id="text-account-name"
              type="text"
              value={accountName}
              onChange={(e) => onAccountNameChange(e.target.value)}
              placeholder="e.g., Imported Paper Wallet"
              maxLength={50}
              disabled={isSubmitting}
              className={`w-full h-12 px-4 bg-gray-950 border ${
                errors.accountName
                  ? 'border-red-500 focus:ring-red-500/30'
                  : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
              } rounded-lg text-white text-sm transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-required="true"
              aria-invalid={!!errors.accountName}
              aria-describedby={errors.accountName ? 'text-account-name-error' : 'text-account-name-helper'}
            />
          </FormField>

          {/* Character Counter */}
          <div className="flex justify-end -mt-4">
            <span className={`text-xs ${charCountColor}`}>{accountName.length}/30</span>
          </div>

          {/* Address Type Selection (only for compressed keys) */}
          {validationResult.compressed && (
            <FormField
              label="Address Type"
              id="text-address-type"
              required
              helperText="Choose the address format for this account"
            >
              <select
                id="text-address-type"
                value={addressType}
                onChange={(e) => onAddressTypeChange(e.target.value as AddressType)}
                disabled={isSubmitting}
                className="w-full h-12 px-4 bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-bitcoin focus:ring-3 focus:ring-bitcoin/30 rounded-lg text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="legacy">Legacy (P2PKH) - Slower, higher fees</option>
                <option value="segwit">SegWit (P2SH-P2WPKH) - Moderate fees</option>
                <option value="native-segwit">
                  Native SegWit (P2WPKH) - Recommended, lowest fees
                </option>
              </select>
            </FormField>
          )}

          {/* Uncompressed key notice */}
          {!validationResult.compressed && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-sm text-yellow-200">
                This is an uncompressed private key. Only Legacy (P2PKH) addresses are supported.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PrivateKeyImport;
