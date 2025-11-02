/**
 * TransactionRow - Reusable transaction display component
 *
 * Displays a single transaction with:
 * - Direction indicator (sent/received)
 * - Contact name or shortened address
 * - Amount (colored positive/negative)
 * - Date/time (relative)
 * - Confirmations badge
 * - Link to block explorer
 *
 * Props:
 * - transaction: Transaction object to display
 * - currentAddresses: User's addresses to determine direction
 * - contacts: Contact list for address lookup
 * - onClick: Optional callback when row clicked
 * - showDate: Show date/time (default: true)
 * - compact: Compact mode with less spacing (default: false)
 * - btcPrice: Optional BTC price for USD conversion
 *
 * Usage:
 * <TransactionRow
 *   transaction={tx}
 *   currentAddresses={currentAccount.addresses.map(a => a.address)}
 *   contacts={contacts}
 *   onClick={(tx) => handleTransactionClick(tx)}
 * />
 */

import React, { useMemo } from 'react';
import { Transaction, Contact, TransactionMetadata } from '../../../shared/types';
import { formatSatoshisAsUSD } from '../../../shared/utils/price';
import { PrivacyBadge } from './PrivacyBadge';
import { usePrivacy } from '../../contexts/PrivacyContext';

interface TransactionRowProps {
  transaction: Transaction;
  currentAddresses: string[];
  contacts: Contact[];
  onClick?: (transaction: Transaction) => void;
  onContactClick?: (contact: Contact) => void;
  showDate?: boolean;
  compact?: boolean;
  btcPrice?: number | null;
  metadata?: TransactionMetadata;  // Transaction metadata
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  currentAddresses,
  contacts,
  onClick,
  onContactClick,
  showDate = true,
  compact = false,
  btcPrice = null,
  metadata,
}) => {
  const { balancesHidden } = usePrivacy();

  // Create address-to-contact lookup map
  // PRIVACY FIX: Include cachedAddresses for xpub contacts
  const contactsByAddress = useMemo(() => {
    const map = new Map<string, Contact>();
    contacts.forEach(contact => {
      // Single-address contacts
      if (contact.address) {
        map.set(contact.address, contact);
      }
      // Xpub contacts: map all cached addresses
      if (contact.cachedAddresses) {
        contact.cachedAddresses.forEach(addr => {
          map.set(addr, contact);
        });
      }
    });
    return map;
  }, [contacts]);

  // Determine transaction type (send or receive)
  const transactionType = useMemo((): 'receive' | 'send' => {
    const hasMyInputs = transaction.inputs.some(input =>
      currentAddresses.includes(input.address)
    );

    if (hasMyInputs) {
      return 'send';
    }

    return 'receive';
  }, [transaction, currentAddresses]);

  // Find contact associated with this transaction
  const associatedContact = useMemo((): Contact | null => {
    if (transactionType === 'send') {
      // For sent transactions, check outputs (excluding our own addresses)
      for (const output of transaction.outputs) {
        if (!currentAddresses.includes(output.address)) {
          const contact = contactsByAddress.get(output.address);
          if (contact) return contact;
        }
      }
    } else {
      // For received transactions, check inputs
      for (const input of transaction.inputs) {
        const contact = contactsByAddress.get(input.address);
        if (contact) return contact;
      }
    }
    return null;
  }, [transaction, transactionType, currentAddresses, contactsByAddress]);

  // Get display address (if no contact found)
  const displayAddress = useMemo((): string => {
    if (transactionType === 'send') {
      const externalOutput = transaction.outputs.find(
        output => !currentAddresses.includes(output.address)
      );
      return externalOutput?.address || transaction.outputs[0]?.address || '';
    } else {
      return transaction.inputs[0]?.address || '';
    }
  }, [transaction, transactionType, currentAddresses]);

  // Format BTC amount
  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format date to relative time
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Shorten address for display
  const shortenAddress = (address: string): string => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };


  const isPending = transaction.confirmations === 0;

  const handleRowClick = () => {
    if (onClick) {
      onClick(transaction);
    }
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    if (associatedContact && onContactClick) {
      onContactClick(associatedContact);
    }
  };

  return (
    <div
      className={`flex items-center justify-between ${
        compact ? 'p-3' : 'p-4'
      } bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 rounded-lg transition-colors duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={handleRowClick}
    >
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Icon */}
        <div
          className={`flex-shrink-0 ${
            compact ? 'w-8 h-8' : 'w-10 h-10'
          } rounded-full flex items-center justify-center ${
            transactionType === 'receive'
              ? 'bg-green-500/15 text-green-500'
              : 'bg-red-500/15 text-red-500'
          }`}
        >
          {transactionType === 'receive' ? (
            <svg
              className={compact ? 'w-4 h-4' : 'w-5 h-5'}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          ) : (
            <svg
              className={compact ? 'w-4 h-4' : 'w-5 h-5'}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          )}
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-white capitalize`}>
              {transactionType === 'receive' ? 'Received from' : 'Sent to'}
            </p>
            {isPending && (
              <span className="inline-flex items-center px-2 py-0.5 bg-bitcoin-subtle text-bitcoin-light border border-bitcoin-light/30 text-xs rounded">
                Pending
              </span>
            )}
          </div>

          {/* Contact name or address */}
          {associatedContact ? (
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={handleContactClick}
                className="text-sm font-medium text-bitcoin hover:text-bitcoin-hover transition-colors text-left"
                title={`View contact: ${associatedContact.name}`}
              >
                {associatedContact.name}
              </button>

              {/* Privacy Badge */}
              {associatedContact.xpub ? (
                <PrivacyBadge variant="success" ariaLabel="Xpub contact with address rotation">
                  ✓ Rotation
                </PrivacyBadge>
              ) : associatedContact.address ? (
                <PrivacyBadge variant="warning" ariaLabel="Single address contact">
                  ⚠️ Reuses
                </PrivacyBadge>
              ) : null}

              {associatedContact.category && (
                <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs rounded">
                  {associatedContact.category}
                </span>
              )}

              {/* Metadata indicators */}
              {metadata?.category && (
                <span
                  className="px-1.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs rounded"
                  title={`Category: ${metadata.category}`}
                >
                  {metadata.category}
                </span>
              )}
              {metadata?.tags && metadata.tags.length > 0 && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 text-xs rounded"
                  title={`Tags: ${metadata.tags.join(', ')}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {metadata.tags.length}
                </span>
              )}
              {metadata?.notes && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs rounded"
                  title="Has notes"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <p
                className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400 font-mono break-all`}
                title={displayAddress}
              >
                {displayAddress}
              </p>

              {/* Metadata indicators for non-contact transactions */}
              {metadata?.category && (
                <span
                  className="px-1.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 text-xs rounded"
                  title={`Category: ${metadata.category}`}
                >
                  {metadata.category}
                </span>
              )}
              {metadata?.tags && metadata.tags.length > 0 && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500/15 text-green-400 border border-green-500/30 text-xs rounded"
                  title={`Tags: ${metadata.tags.join(', ')}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {metadata.tags.length}
                </span>
              )}
              {metadata?.notes && (
                <span
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs rounded"
                  title="Has notes"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </span>
              )}
            </div>
          )}

          {/* Transaction ID and date */}
          <div className="flex items-center gap-2">
            <p
              className="text-xs text-gray-500 font-mono break-all"
              title={transaction.txid}
            >
              {transaction.txid}
            </p>
            {showDate && (
              <>
                <span className="text-gray-600">•</span>
                <p className="text-xs text-gray-500">
                  {formatDate(transaction.timestamp)}
                </p>
              </>
            )}
            {!compact && (
              <>
                <span className="text-gray-600">•</span>
                <p className="text-xs text-gray-500">
                  {transaction.confirmations} confirmation{transaction.confirmations !== 1 ? 's' : ''}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <p
            className={`${compact ? 'text-sm' : 'text-sm'} font-bold ${
              transactionType === 'receive' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {transactionType === 'receive' ? '+' : '-'}
            {balancesHidden ? '••••• BTC' : `${formatBTC(Math.abs(transaction.value))} BTC`}
          </p>
          {btcPrice !== null && !compact && (
            <p className="text-xs text-gray-500">
              {balancesHidden ? '$ •••••' : `≈ ${formatSatoshisAsUSD(Math.abs(transaction.value), btcPrice)}`}
            </p>
          )}
        </div>
      </div>

      {/* View on Explorer */}
      <a
        href={`https://blockstream.info/testnet/tx/${transaction.txid}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()} // Prevent row click
        className={`${
          compact ? 'ml-2' : 'ml-3'
        } p-2 text-gray-500 hover:text-bitcoin hover:bg-gray-800 rounded transition-colors flex-shrink-0`}
        title="View on Blockstream"
      >
        <svg
          className={compact ? 'w-4 h-4' : 'w-5 h-5'}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </a>
    </div>
  );
};

export default TransactionRow;
