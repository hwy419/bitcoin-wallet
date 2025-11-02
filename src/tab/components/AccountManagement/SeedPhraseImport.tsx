/**
 * SeedPhraseImport - Seed phrase import tab component
 *
 * Allows users to import a Bitcoin account from a BIP39 seed phrase (12 or 24 words).
 * Provides word count validation, checksum validation, account index selection,
 * and address type selection.
 *
 * Features:
 * - BIP39 seed phrase validation (12 or 24 words)
 * - Word count indicator
 * - Account index selector (BIP44 derivation)
 * - Address type selector
 * - Account name input
 * - Security warning banner
 * - Real-time validation feedback
 *
 * Props:
 * - seedPhrase: Current seed phrase value
 * - onSeedPhraseChange: Seed phrase change handler
 * - accountIndex: Current account index value
 * - onAccountIndexChange: Account index change handler
 * - addressType: Current address type value
 * - onAddressTypeChange: Address type change handler
 * - accountName: Current account name value
 * - onAccountNameChange: Account name change handler
 * - errors: Form validation errors
 * - wordCount: Number of words in seed phrase
 * - isValidChecksum: Whether checksum is valid
 * - isSubmitting: Loading state
 *
 * Usage:
 * <SeedPhraseImport
 *   seedPhrase={seedPhrase}
 *   onSeedPhraseChange={setSeedPhrase}
 *   accountIndex={accountIndex}
 *   onAccountIndexChange={setAccountIndex}
 *   addressType={addressType}
 *   onAddressTypeChange={setAddressType}
 *   accountName={accountName}
 *   onAccountNameChange={setAccountName}
 *   errors={errors}
 *   wordCount={12}
 *   isValidChecksum={true}
 *   isSubmitting={false}
 * />
 */

import React, { useState } from 'react';
import FormField from '../shared/FormField';

type AddressType = 'legacy' | 'segwit' | 'native-segwit';

interface AddressTypeOption {
  type: AddressType;
  displayName: string;
  description: string;
  prefix: string;
  recommended: boolean;
}

const ADDRESS_TYPES: AddressTypeOption[] = [
  {
    type: 'native-segwit',
    displayName: 'Native SegWit',
    description: 'Lower fees and better privacy',
    prefix: 'tb1... addresses',
    recommended: true,
  },
  {
    type: 'segwit',
    displayName: 'SegWit',
    description: 'Moderate fees, good compatibility',
    prefix: '2... addresses',
    recommended: false,
  },
  {
    type: 'legacy',
    displayName: 'Legacy',
    description: 'Widest compatibility, higher fees',
    prefix: 'm/n... addresses',
    recommended: false,
  },
];

interface SeedPhraseImportProps {
  seedPhrase: string;
  onSeedPhraseChange: (value: string) => void;
  accountIndex: number;
  onAccountIndexChange: (value: number) => void;
  addressType: AddressType;
  onAddressTypeChange: (value: AddressType) => void;
  accountName: string;
  onAccountNameChange: (value: string) => void;
  errors: {
    seedPhrase?: string;
    accountIndex?: string;
    accountName?: string;
  };
  wordCount: number;
  isValidChecksum: boolean;
  isSubmitting: boolean;
}

export const SeedPhraseImport: React.FC<SeedPhraseImportProps> = ({
  seedPhrase,
  onSeedPhraseChange,
  accountIndex,
  onAccountIndexChange,
  addressType,
  onAddressTypeChange,
  accountName,
  onAccountNameChange,
  errors,
  wordCount,
  isValidChecksum,
  isSubmitting,
}) => {
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  // Word count validation
  const isValidWordCount = wordCount === 12 || wordCount === 24;
  const wordCountStatus = isValidWordCount ? 'text-green-500' : wordCount > 0 ? 'text-amber-500' : 'text-gray-500';

  // Checksum status
  const checksumStatus = isValidChecksum ? 'text-green-500' : seedPhrase.trim() ? 'text-red-500' : 'text-gray-500';

  // Character count color for account name
  const charCountColor =
    accountName.length > 30
      ? 'text-red-500'
      : accountName.length > 25
      ? 'text-amber-500'
      : 'text-gray-500';

  const selectedAddressTypeOption = ADDRESS_TYPES.find((opt) => opt.type === addressType)!;

  return (
    <div className="space-y-6">
      {/* Seed Phrase Input */}
      <FormField
        label="Seed Phrase (12 or 24 words)"
        id="seed-phrase"
        error={errors.seedPhrase}
        required
      >
        <textarea
          id="seed-phrase"
          value={seedPhrase}
          onChange={(e) => onSeedPhraseChange(e.target.value)}
          placeholder="abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
          rows={4}
          disabled={isSubmitting}
          className={`w-full px-4 py-3 bg-gray-950 border ${
            errors.seedPhrase
              ? 'border-red-500 focus:ring-red-500/30'
              : isValidChecksum && isValidWordCount
              ? 'border-green-500 focus:ring-green-500/30'
              : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
          } rounded-lg text-white text-sm resize-vertical transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-required="true"
          aria-invalid={!!errors.seedPhrase}
          aria-describedby={errors.seedPhrase ? 'seed-phrase-error' : undefined}
        />
      </FormField>

      {/* Word Count and Checksum Status */}
      <div className="flex justify-between text-xs -mt-4">
        <span className={wordCountStatus}>
          Words: {wordCount}/{isValidWordCount ? wordCount : '12 or 24'} {isValidWordCount && '✓'}
        </span>
        {seedPhrase.trim() && (
          <span className={checksumStatus}>
            {isValidChecksum ? 'Valid checksum ✓' : 'Invalid checksum'}
          </span>
        )}
      </div>

      {/* Account Index and Address Type Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Account Index */}
        <FormField
          label="Account Index"
          id="account-index"
          error={errors.accountIndex}
          helperText="First account (0)"
        >
          <input
            id="account-index"
            type="number"
            value={accountIndex}
            onChange={(e) => onAccountIndexChange(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
            max={2147483647}
            disabled={isSubmitting}
            className={`w-full h-12 px-4 bg-gray-950 border ${
              errors.accountIndex
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
            } rounded-lg text-white text-sm transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-invalid={!!errors.accountIndex}
            aria-describedby={errors.accountIndex ? 'account-index-error' : 'account-index-helper'}
          />
        </FormField>

        {/* Address Type */}
        <FormField label="Address Type" id="address-type-seed" required>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAddressDropdown(!showAddressDropdown)}
              disabled={isSubmitting}
              className="w-full h-12 px-4 bg-gray-950 border border-gray-700 hover:border-gray-600 focus:border-bitcoin focus:ring-3 focus:ring-bitcoin/30 rounded-lg text-white text-sm transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
              aria-haspopup="listbox"
              aria-expanded={showAddressDropdown}
            >
              <span className="truncate">{selectedAddressTypeOption.displayName}</span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                  showAddressDropdown ? 'rotate-180' : ''
                }`}
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
                      onAddressTypeChange(option.type);
                      setShowAddressDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors ${
                      addressType === option.type ? 'bg-bitcoin/10 border-l-2 border-bitcoin' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white flex items-center gap-2 text-sm">
                        {option.displayName}
                        {option.recommended && (
                          <span className="px-2 py-0.5 bg-bitcoin/20 text-bitcoin text-xs font-semibold rounded uppercase tracking-wide">
                            Recommended
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{option.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormField>
      </div>

      {/* Account Name Input */}
      <FormField
        label="Account Name"
        id="seed-account-name"
        error={errors.accountName}
        helperText="Enter a name to identify this account"
        required
      >
        <input
          id="seed-account-name"
          type="text"
          value={accountName}
          onChange={(e) => onAccountNameChange(e.target.value)}
          placeholder="e.g., Imported from Electrum"
          maxLength={50}
          disabled={isSubmitting}
          className={`w-full h-12 px-4 bg-gray-950 border ${
            errors.accountName
              ? 'border-red-500 focus:ring-red-500/30'
              : 'border-gray-700 focus:border-bitcoin focus:ring-bitcoin/30'
          } rounded-lg text-white text-sm transition-all focus:outline-none focus:ring-3 disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-required="true"
          aria-invalid={!!errors.accountName}
          aria-describedby={errors.accountName ? 'seed-account-name-error' : 'seed-account-name-helper'}
        />
      </FormField>

      {/* Character Counter */}
      <div className="flex justify-end -mt-4">
        <span className={`text-xs ${charCountColor}`}>{accountName.length}/30</span>
      </div>
    </div>
  );
};

export default SeedPhraseImport;
