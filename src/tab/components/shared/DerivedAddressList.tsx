/**
 * DerivedAddressList - Display list of addresses derived from xpub
 *
 * Shows addresses derived from an extended public key with progressive disclosure:
 * - Initially shows first 10 addresses
 * - "Show more" button reveals remaining cached addresses (up to 20)
 * - "Derive more" button expands from 20 to 100 addresses
 *
 * Features:
 * - Copy to clipboard for each address
 * - External/Internal (change) labeling
 * - Address truncation for display
 * - Progressive disclosure (10 → 20 → 100)
 *
 * @see prompts/docs/plans/CONTACTS_V2_UI_UX_DESIGN.md
 */

import React, { useState } from 'react';

export interface DerivedAddressListProps {
  addresses: string[]; // Cached derived addresses (20 or 100)
  maxVisible?: number; // How many to show initially (default: 10)
  onExpand?: () => void; // Callback when user wants to expand from 20→100
  className?: string;
}

/**
 * DerivedAddressList Component
 *
 * Renders a list of addresses derived from xpub with progressive disclosure
 *
 * @example
 * <DerivedAddressList
 *   addresses={contact.cachedAddresses || []}
 *   onExpand={() => expandContactAddresses(contact.id)}
 * />
 */
export const DerivedAddressList: React.FC<DerivedAddressListProps> = ({
  addresses,
  maxVisible = 10,
  onExpand,
  className = '',
}) => {
  const [showAll, setShowAll] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Determine how many to show
  const visibleAddresses = showAll ? addresses : addresses.slice(0, maxVisible);
  const hasMore = addresses.length > maxVisible && !showAll;
  const canExpand = addresses.length === 20 && onExpand; // Can expand from 20 to 100

  /**
   * Copy address to clipboard
   */
  const handleCopy = async (address: string, index: number) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  /**
   * Truncate address for display
   */
  const truncateAddress = (address: string): string => {
    if (address.length <= 20) return address;
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  /**
   * Determine if address is external (receive) or internal (change)
   * Even indices (0, 2, 4...) are typically external for first 10
   * Odd indices (1, 3, 5...) are typically internal for first 10
   * After 10, pattern continues with next set
   */
  const getAddressType = (index: number): { isExternal: boolean; derivationIndex: number } => {
    const halfLength = addresses.length / 2;
    if (index < halfLength) {
      return { isExternal: true, derivationIndex: index };
    } else {
      return { isExternal: false, derivationIndex: index - halfLength };
    }
  };

  if (addresses.length === 0) {
    return (
      <div className={`text-sm text-gray-500 text-center py-4 ${className}`}>
        No addresses derived yet
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {visibleAddresses.map((address, index) => {
          const { isExternal, derivationIndex } = getAddressType(index);
          const isCopied = copiedIndex === index;

          return (
            <div
              key={index}
              className="flex items-center gap-2 py-2 px-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <span className="text-xs text-gray-500 w-8 flex-shrink-0">{index + 1}.</span>
              <code className="flex-1 text-sm font-mono text-gray-700 truncate" title={address}>
                {truncateAddress(address)}
              </code>
              <span className="text-xs text-gray-500 flex-shrink-0">
                {isExternal ? 'Receive' : 'Change'} #{derivationIndex}
              </span>
              <button
                onClick={() => handleCopy(address, index)}
                className="text-blue-500 hover:text-blue-600 text-xs font-medium flex-shrink-0 transition-colors"
                title={`Copy ${address}`}
              >
                {isCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Show More / Expand buttons */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Show {addresses.length - maxVisible} more ({addresses.length} total)
          </button>
        )}

        {showAll && canExpand && (
          <button
            onClick={onExpand}
            className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
          >
            Derive 80 more addresses (100 total)
          </button>
        )}
      </div>

      {/* Address count summary */}
      <div className="mt-2 text-xs text-gray-500 text-center">
        Showing {visibleAddresses.length} of {addresses.length} cached addresses
      </div>
    </div>
  );
};
