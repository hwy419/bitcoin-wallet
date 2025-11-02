/**
 * AddressTypeSelector - Address type selection component for multisig
 *
 * Allows users to choose between P2WSH, P2SH-P2WSH, and P2SH with clear
 * explanations of fee implications and compatibility trade-offs.
 *
 * Features:
 * - Card-based selection matching ConfigSelector pattern
 * - Fee comparison (P2WSH lowest, P2SH highest)
 * - Compatibility warnings
 * - Recommendation for P2WSH (Native SegWit)
 * - Warning modal for P2SH (Legacy) selection
 * - Visual indicators (emoji, tags, pros/cons)
 *
 * Usage:
 * <AddressTypeSelector
 *   selectedAddressType={addressType}
 *   onSelect={setAddressType}
 *   onContinue={nextStep}
 * />
 */

import React, { useState } from 'react';
import { MultisigAddressType } from '../../../shared/types';
import Modal from '../shared/Modal';

interface AddressTypeOption {
  type: MultisigAddressType;
  displayName: string;
  prefix: string;
  emoji: string;
  tagline: string;
  description: string;
  feeSavings: string;
  feeLevel: 'lowest' | 'lower' | 'highest';
  feeTagColor: string;
  compatibility: 'modern' | 'good' | 'maximum';
  recommended: boolean;
  pros: string[];
  cons: string[];
  learnMore: string;
}

const ADDRESS_TYPES: AddressTypeOption[] = [
  {
    type: 'p2wsh',
    displayName: 'P2WSH - Native SegWit',
    prefix: 'tb1q... (testnet)',
    emoji: '🚀',
    tagline: 'Lowest fees, modern standard',
    description:
      'Native SegWit multisig addresses offer the lowest transaction fees and full SegWit benefits.',
    feeSavings: '40% savings',
    feeLevel: 'lowest',
    feeTagColor: 'bg-green-500/15 text-green-500 border-green-500/30',
    compatibility: 'modern',
    recommended: true,
    pros: [
      'Lowest transaction fees (40% savings vs legacy)',
      'Modern Bitcoin standard (BIP 141, BIP 173)',
      'Full SegWit benefits (malleability fix, better scaling)',
      'Privacy improvements with bech32 format',
    ],
    cons: [
      'Not compatible with very old wallets (pre-2018)',
      'Some exchanges may not support sending to bech32',
    ],
    learnMore:
      'P2WSH (Pay-to-Witness-Script-Hash) is the native SegWit format for multisig. It stores the script in the witness data, resulting in smaller transaction sizes and lower fees.',
  },
  {
    type: 'p2sh-p2wsh',
    displayName: 'P2SH-P2WSH - Wrapped SegWit',
    prefix: '2... (testnet)',
    emoji: '⚖️',
    tagline: 'Balanced fees and compatibility',
    description:
      'Wrapped SegWit provides SegWit benefits wrapped in a P2SH address for better compatibility.',
    feeSavings: '20% savings',
    feeLevel: 'lower',
    feeTagColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    compatibility: 'good',
    recommended: false,
    pros: [
      'Lower fees than legacy (20% savings)',
      'Compatible with older wallets',
      'SegWit benefits with backward compatibility',
      'Widely supported by exchanges',
    ],
    cons: [
      'Higher fees than native SegWit',
      'More complex than P2WSH',
      'Larger transaction size than P2WSH',
    ],
    learnMore:
      'P2SH-P2WSH wraps a SegWit script inside a P2SH address. This provides compatibility with older wallets while still getting some SegWit benefits, but fees are higher than native SegWit.',
  },
  {
    type: 'p2sh',
    displayName: 'P2SH - Legacy',
    prefix: '3... (testnet)',
    emoji: '⚠️',
    tagline: 'Maximum compatibility, highest fees',
    description:
      'Legacy P2SH addresses work with all wallets but have the highest transaction fees.',
    feeSavings: 'No savings',
    feeLevel: 'highest',
    feeTagColor: 'bg-red-500/15 text-red-500 border-red-500/30',
    compatibility: 'maximum',
    recommended: false,
    pros: [
      'Compatible with all Bitcoin wallets',
      'Widely recognized format',
      'Maximum exchange support',
    ],
    cons: [
      'Highest transaction fees',
      'No SegWit benefits (malleability issues)',
      'Larger transaction size',
      'Being phased out in favor of SegWit',
    ],
    learnMore:
      'P2SH (Pay-to-Script-Hash) is the original multisig format. While it has maximum compatibility, it has the highest fees and lacks SegWit improvements. Only choose this if you need compatibility with very old software.',
  },
];

interface AddressTypeSelectorProps {
  selectedAddressType?: MultisigAddressType;
  onSelect: (addressType: MultisigAddressType) => void;
  onContinue: () => void;
  showContinueButton?: boolean;
}

export const AddressTypeSelector: React.FC<AddressTypeSelectorProps> = ({
  selectedAddressType,
  onSelect,
  onContinue,
  showContinueButton = true,
}) => {
  const [expandedType, setExpandedType] = useState<MultisigAddressType | null>(null);
  const [showP2SHWarning, setShowP2SHWarning] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<MultisigAddressType | null>(null);

  const handleSelect = (type: MultisigAddressType) => {
    if (type === 'p2sh' && selectedAddressType !== 'p2sh') {
      // Show warning for P2SH selection
      setPendingSelection(type);
      setShowP2SHWarning(true);
    } else {
      onSelect(type);
    }
  };

  const confirmP2SHSelection = () => {
    if (pendingSelection) {
      onSelect(pendingSelection);
    }
    setShowP2SHWarning(false);
    setPendingSelection(null);
  };

  const cancelP2SHSelection = () => {
    setShowP2SHWarning(false);
    setPendingSelection(null);
  };

  const toggleExpanded = (type: MultisigAddressType) => {
    setExpandedType(expandedType === type ? null : type);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Choose Address Type</h2>
          <p className="text-gray-400">
            Select how your multisig addresses will be formatted on the blockchain
          </p>
        </div>

        {/* Address Type Cards */}
        <div className="space-y-4">
          {ADDRESS_TYPES.map((option) => {
            const isSelected = selectedAddressType === option.type;
            const isExpanded = expandedType === option.type;

            return (
              <div
                key={option.type}
                className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-bitcoin bg-bitcoin-subtle'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-850'
                }`}
                onClick={() => handleSelect(option.type)}
              >
                {/* Recommended Badge */}
                {option.recommended && (
                  <div className="absolute top-0 right-0 -mt-2 -mr-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-bitcoin text-white shadow-lg">
                      <span>⭐</span>
                      <span>Recommended</span>
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Radio Button */}
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  <div className="flex-1">
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{option.emoji}</span>
                        <h3 className="text-lg font-semibold text-white">{option.displayName}</h3>
                      </div>
                    </div>

                    {/* Address Prefix */}
                    <p className="text-sm text-gray-500 mb-2">Addresses: {option.prefix}</p>

                    {/* Tagline */}
                    <p className="text-sm font-medium text-gray-300 mb-3">{option.tagline}</p>

                    {/* Feature Tags */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {/* Fee Tag */}
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${option.feeTagColor}`}
                      >
                        <span>💰</span>
                        <span>
                          {option.feeLevel === 'lowest'
                            ? 'Lowest Fees'
                            : option.feeLevel === 'lower'
                            ? 'Lower Fees'
                            : 'Higher Fees'}
                        </span>
                      </span>

                      {/* Compatibility Tag */}
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                        <span>🔧</span>
                        <span>
                          {option.compatibility === 'modern'
                            ? 'Modern'
                            : option.compatibility === 'good'
                            ? 'Good Compatibility'
                            : 'Maximum Compatibility'}
                        </span>
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-400 mb-3">{option.description}</p>

                    {/* Pros */}
                    <div className="mb-2">
                      <div className="space-y-1">
                        {option.pros.slice(0, 2).map((pro, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                            <svg
                              className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>{pro}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Expand/Collapse Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(option.type);
                      }}
                      className="text-sm text-bitcoin hover:text-bitcoin-hover font-medium flex items-center gap-1"
                    >
                      <span>{isExpanded ? 'Show less' : 'Learn more'}</span>
                      <svg
                        className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                        {/* All Pros */}
                        <div>
                          <p className="text-xs font-semibold text-gray-300 mb-2">Advantages:</p>
                          <div className="space-y-1">
                            {option.pros.map((pro, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                                <svg
                                  className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>{pro}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cons */}
                        <div>
                          <p className="text-xs font-semibold text-gray-300 mb-2">Considerations:</p>
                          <div className="space-y-1">
                            {option.cons.map((con, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                                <svg
                                  className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span>{con}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Technical Details */}
                        <div className="bg-gray-900 border border-gray-700 rounded p-3">
                          <p className="text-xs text-gray-400">{option.learnMore}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Important Info Box */}
        <div className="flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <span className="text-2xl flex-shrink-0">ℹ️</span>
          <div>
            <p className="text-sm font-semibold text-blue-400 mb-1">
              All co-signers must use the SAME address type
            </p>
            <p className="text-sm text-blue-400/80">
              Coordinate with all participants to ensure everyone selects the same address type.
              Mismatched address types will result in different wallet addresses.
            </p>
          </div>
        </div>

        {/* Recommendation Box */}
        <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-green-400 mb-1">Recommended Choice</p>
            <p className="text-sm text-green-400/80">
              We recommend <strong>P2WSH (Native SegWit)</strong> for multisig wallets. It provides
              the lowest fees and is the modern Bitcoin standard. Most wallets created after 2018
              support it.
            </p>
          </div>
        </div>

        {/* Continue Button */}
        {showContinueButton && (
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onContinue}
              disabled={!selectedAddressType}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                selectedAddressType
                  ? 'bg-bitcoin hover:bg-bitcoin-hover text-white'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        )}
      </div>

      {/* P2SH Warning Modal */}
      <Modal isOpen={showP2SHWarning} onClose={cancelP2SHSelection}>
        <div className="w-96 p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-4xl">⚠️</span>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Are you sure?</h2>
              <p className="text-sm text-gray-400 mb-2">
                Legacy P2SH addresses have the <strong className="text-red-400">highest transaction fees</strong>.
              </p>
              <p className="text-sm text-gray-400 mb-2">
                We <strong className="text-bitcoin">strongly recommend</strong> using P2WSH (Native
                SegWit) for <strong className="text-green-400">40% lower fees</strong>.
              </p>
              <p className="text-sm text-gray-400">
                Only choose Legacy if you need compatibility with very old software.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={cancelP2SHSelection}
              className="flex-1 px-4 py-2.5 bg-gray-850 hover:bg-gray-800 text-white border border-gray-700 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={confirmP2SHSelection}
              className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Continue Anyway
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AddressTypeSelector;
