/**
 * ContactCard - Display individual contact in list (v2.0)
 *
 * Shows contact information with colored avatar, xpub support, and edit/delete actions.
 * Includes ContactAvatar, category badge, transaction count, and derived addresses.
 * Supports click-to-expand to show recent transactions or derived addresses.
 *
 * Updates in v2.0:
 * - ContactAvatar with colored initials
 * - Xpub fingerprint and derived address count display
 * - DerivedAddressList for xpub contacts
 * - Email address display
 * - Enhanced visual hierarchy
 *
 * @see prompts/docs/plans/CONTACTS_V2_UI_UX_DESIGN.md
 */

import React, { useState } from 'react';
import { Contact, Transaction, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { TransactionRow } from './TransactionRow';
import { ContactAvatar } from './ContactAvatar';
import { DerivedAddressList } from './DerivedAddressList';
import { PrivacyBadge } from './PrivacyBadge';

interface ContactCardProps {
  contact: Contact;
  accountIndex: number;
  currentAddresses: string[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  onClick?: (contact: Contact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  accountIndex,
  currentAddresses,
  onEdit,
  onDelete,
  onClick,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const [isExpanded, setIsExpanded] = useState(false);
  const [contactTransactions, setContactTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const hasXpub = !!contact.xpub;
  const hasSingleAddress = !!contact.address;

  // Get address type icon based on address format
  const getAddressTypeIcon = (address: string): { icon: string; label: string } => {
    if (address.startsWith('tb1') || address.startsWith('bc1')) {
      return { icon: '🔷', label: 'Native SegWit' };
    }
    if (address.startsWith('2') || address.startsWith('3')) {
      return { icon: '🔶', label: 'SegWit' };
    }
    return { icon: '🔸', label: 'Legacy' };
  };

  // Format date to relative time (e.g., "2 days ago")
  const formatRelativeDate = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  // Handle expand/collapse to show transactions
  const handleExpand = async () => {
    if (!isExpanded && !hasXpub && contactTransactions.length === 0) {
      // Fetch transactions for single-address contacts
      setIsLoadingTransactions(true);
      try {
        const response = await sendMessage<{ transactions: Transaction[] }>(
          MessageType.GET_TRANSACTIONS_FOR_CONTACT,
          {
            contactId: contact.id,
            accountIndex,
            limit: 5,
          }
        );
        setContactTransactions(response.transactions || []);
      } catch (err) {
        console.error('Failed to fetch contact transactions:', err);
        setContactTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(contact);
    } else {
      // Default behavior: expand/collapse
      handleExpand();
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onEdit(contact);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    onDelete(contact.id);
  };

  const handleExpandAddresses = async () => {
    try {
      await sendMessage(MessageType.EXPAND_CONTACT_ADDRESSES, {
        contactId: contact.id,
        newGapLimit: 50, // Expand to 100 addresses (50 external + 50 internal)
      });
      // The parent component should refetch contacts to update cachedAddresses
    } catch (err) {
      console.error('Failed to expand contact addresses:', err);
    }
  };

  return (
    <div
      className={`bg-gray-850 border border-gray-700 rounded-lg transition-colors ${
        isExpanded ? 'border-bitcoin/40' : 'hover:bg-gray-800 hover:border-gray-600'
      }`}
    >
      <div className={`p-4 cursor-pointer`} onClick={handleCardClick}>
        <div className="flex items-start gap-3">
          {/* Contact Avatar */}
          <ContactAvatar name={contact.name} color={contact.color} size="lg" />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Name and Category */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-semibold text-white truncate">{contact.name}</h3>

              {/* Privacy Badge */}
              {hasXpub ? (
                <PrivacyBadge variant="success" ariaLabel="Xpub contact with address rotation">
                  ✓ Address Rotation
                </PrivacyBadge>
              ) : hasSingleAddress ? (
                <PrivacyBadge variant="warning" ariaLabel="Single address contact - privacy risk">
                  ⚠️ Reuses Address
                </PrivacyBadge>
              ) : null}

              {contact.category && (
                <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs rounded">
                  {contact.category}
                </span>
              )}
              {/* Expand indicator */}
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${
                  isExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* Address or Xpub Info */}
            {hasXpub ? (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" title="Extended Public Key">
                  🔑
                </span>
                <p className="text-sm font-mono text-gray-400 break-all">
                  {contact.xpub} ({contact.cachedAddresses?.length || 0} addresses)
                </p>
              </div>
            ) : hasSingleAddress ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg" title={getAddressTypeIcon(contact.address!).label}>
                    {getAddressTypeIcon(contact.address!).icon}
                  </span>
                  <p className="text-sm font-mono text-gray-400 break-all">
                    {contact.address}
                  </p>
                </div>
                {/* Privacy warning: reusage counter */}
                {contact.reusageCount !== undefined && contact.reusageCount > 0 && (
                  <p className="text-xs text-amber-400 mb-2">
                    ⚠️ Sent {contact.reusageCount} {contact.reusageCount === 1 ? 'time' : 'times'} to this address (privacy risk)
                  </p>
                )}
              </>
            ) : null}

            {/* Email if present */}
            {contact.email && (
              <p className="text-xs text-gray-500 mb-2">
                📧 {contact.email}
              </p>
            )}

            {/* Tags display */}
            {contact.tags && Object.keys(contact.tags).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 mb-2">
                {Object.entries(contact.tags)
                  .slice(0, isExpanded ? undefined : 3)
                  .map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/30"
                      title={`${key}: ${value}`}
                    >
                      <span className="font-medium">{key}:</span>
                      <span className="ml-1 truncate max-w-[100px]">{value}</span>
                    </span>
                  ))}
                {!isExpanded && Object.keys(contact.tags).length > 3 && (
                  <span className="text-xs text-gray-400 self-center">
                    +{Object.keys(contact.tags).length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Notes preview */}
            {contact.notes && !isExpanded && (
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">{contact.notes}</p>
            )}

            {/* Transaction count and last transaction */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {contact.transactionCount !== undefined && contact.transactionCount > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExpand();
                  }}
                  className="hover:text-bitcoin transition-colors"
                >
                  {contact.transactionCount} transaction
                  {contact.transactionCount !== 1 ? 's' : ''}
                </button>
              )}
              {contact.lastTransactionDate && (
                <span>Last: {formatRelativeDate(contact.lastTransactionDate)}</span>
              )}
            </div>
          </div>

          {/* Right side: Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit button */}
            <button
              onClick={handleEdit}
              className="p-2 text-gray-500 hover:text-white hover:bg-gray-700 rounded transition-colors"
              title="Edit Contact"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>

            {/* Delete button */}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/15 rounded transition-colors"
              title="Delete Contact"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-700 px-4 py-3 bg-gray-900/50">
          {/* Show derived addresses for xpub contacts */}
          {hasXpub && contact.cachedAddresses && contact.cachedAddresses.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-3">Derived Addresses</h4>
              <DerivedAddressList
                addresses={contact.cachedAddresses}
                onExpand={handleExpandAddresses}
              />
            </div>
          )}

          {/* Show notes if present and expanded */}
          {contact.notes && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-white mb-2">Notes</h4>
              <p className="text-sm text-gray-400">{contact.notes}</p>
            </div>
          )}

          {/* Show transactions */}
          {!hasXpub && (
            <>
              <h4 className="text-sm font-medium text-white mb-3">Recent Transactions</h4>

              {isLoadingTransactions ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-700 border-t-bitcoin"></div>
                </div>
              ) : contactTransactions.length > 0 ? (
                <div className="space-y-2">
                  {contactTransactions.map((tx) => (
                    <TransactionRow
                      key={tx.txid}
                      transaction={tx}
                      currentAddresses={currentAddresses}
                      contacts={[contact]}
                      compact={true}
                      showDate={true}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No transactions yet with this contact
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactCard;
