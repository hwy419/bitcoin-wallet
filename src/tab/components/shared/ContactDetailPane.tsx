/**
 * ContactDetailPane - Right-side flyout for viewing/editing contact details
 *
 * Features:
 * - View complete contact information
 * - Inline editing of fields
 * - Custom tags editor (key-value pairs)
 * - Recent transactions list
 * - Statistics (transaction count, last activity)
 * - Edit/Delete actions
 * - Keyboard navigation and accessibility
 */

import React, { useEffect, useRef, useState } from 'react';
import { Contact, WalletAccount, Transaction, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { ContactAvatar } from './ContactAvatar';
import { TransactionRow } from './TransactionRow';

interface ContactDetailPaneProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  currentAccount?: WalletAccount;
}

export const ContactDetailPane: React.FC<ContactDetailPaneProps> = ({
  contact,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  currentAccount,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const paneRef = useRef<HTMLDivElement>(null);

  // State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Form state for editing
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<{ [key: string]: string }>({});

  // Tags editor state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  // Transaction state
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  // Initialize form when contact changes
  useEffect(() => {
    if (contact) {
      setName(contact.name);
      setEmail(contact.email || '');
      setCategory(contact.category || '');
      setNotes(contact.notes || '');
      setTags(contact.tags || {});
    }
  }, [contact]);

  // Fetch recent transactions when pane opens
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!contact || !isOpen || !currentAccount) return;

      setIsLoadingTransactions(true);
      try {
        const response = await sendMessage<{ transactions: Transaction[] }>(
          MessageType.GET_TRANSACTIONS_FOR_CONTACT,
          {
            contactId: contact.id,
            accountIndex: currentAccount.index,
            limit: 5,
          }
        );
        setRecentTransactions(response.transactions || []);
      } catch (err) {
        console.error('Failed to fetch contact transactions:', err);
        setRecentTransactions([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    if (isOpen && contact) {
      fetchTransactions();
    }
  }, [contact, isOpen, currentAccount, sendMessage]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isEditing) {
          handleCancelEdit();
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, isEditing, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !paneRef.current) return;

    const focusableElements = paneRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);

    // Focus the close button when opened
    setTimeout(() => {
      const closeButton = paneRef.current?.querySelector('[data-close-button]') as HTMLElement;
      closeButton?.focus();
    }, 100);

    return () => {
      document.removeEventListener('keydown', handleTab);
    };
  }, [isOpen]);

  // Copy to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!contact) return;

    // Validation
    if (name.trim().length === 0) {
      alert('Name is required');
      return;
    }
    if (name.trim().length > 50) {
      alert('Name must be 50 characters or less');
      return;
    }
    if (email.length > 100) {
      alert('Email must be 100 characters or less');
      return;
    }
    if (category.length > 30) {
      alert('Category must be 30 characters or less');
      return;
    }
    if (notes.length > 500) {
      alert('Notes must be 500 characters or less');
      return;
    }

    setIsSaving(true);
    try {
      const updatedContact: Contact = {
        ...contact,
        name: name.trim(),
        email: email.trim() || undefined,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
        tags: Object.keys(tags).length > 0 ? tags : undefined,
        updatedAt: Date.now(),
      };

      onUpdate(updatedContact);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update contact:', err);
      alert('Failed to update contact. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    if (contact) {
      setName(contact.name);
      setEmail(contact.email || '');
      setCategory(contact.category || '');
      setNotes(contact.notes || '');
      setTags(contact.tags || {});
    }
    setIsEditing(false);
    setIsAddingTag(false);
    setNewTagKey('');
    setNewTagValue('');
  };

  // Handle add tag
  const handleAddTag = () => {
    if (!newTagKey.trim() || !newTagValue.trim()) {
      return;
    }

    // Validation
    if (newTagKey.trim().length > 30) {
      alert('Tag key must be 30 characters or less');
      return;
    }
    if (newTagValue.trim().length > 100) {
      alert('Tag value must be 100 characters or less');
      return;
    }
    if (tags[newTagKey.trim()]) {
      alert('Tag with this key already exists');
      return;
    }

    setTags({
      ...tags,
      [newTagKey.trim()]: newTagValue.trim(),
    });
    setNewTagKey('');
    setNewTagValue('');
    setIsAddingTag(false);
  };

  // Handle remove tag
  const handleRemoveTag = (key: string) => {
    const newTags = { ...tags };
    delete newTags[key];
    setTags(newTags);
  };

  // Handle delete contact
  const handleDelete = () => {
    if (!contact) return;

    if (confirm(`Are you sure you want to delete ${contact.name}? This action cannot be undone.`)) {
      onDelete(contact.id);
      onClose();
    }
  };

  if (!contact) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Flyout Pane */}
      <div
        ref={paneRef}
        className={`fixed top-0 right-0 h-full bg-gray-900 border-l border-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } w-full sm:w-[480px]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-detail-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="contact-detail-title" className="text-lg font-semibold text-white">
            Contact Details
          </h2>
          <button
            data-close-button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 -mr-2"
            aria-label="Close contact details"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <ContactAvatar name={contact.name} color={contact.color} size="xl" />
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contact name"
                  maxLength={50}
                  className="w-full px-3 py-2 bg-gray-850 border border-gray-700 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                />
              ) : (
                <h3 className="text-xl font-bold text-white truncate">{contact.name}</h3>
              )}
              {contact.category && !isEditing && (
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs rounded">
                  {contact.category}
                </span>
              )}
            </div>
          </div>

          {/* Address Info */}
          <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              {contact.xpub ? 'Extended Public Key' : 'Bitcoin Address'}
            </h4>
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-mono text-white break-all flex-1 mr-2">
                {contact.address || contact.xpub}
              </p>
              <button
                onClick={() => copyToClipboard(contact.address || contact.xpub || '', 'address')}
                className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
                aria-label="Copy address"
              >
                {copiedItem === 'address' ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            {contact.xpub && (
              <p className="text-xs text-gray-500 mt-2">
                {contact.cachedAddresses?.length || 0} addresses cached
              </p>
            )}
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Contact Details
            </h4>

            {/* Email */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@example.com"
                  maxLength={100}
                  className="w-full px-3 py-2 bg-gray-850 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                />
              ) : (
                <p className="text-sm text-white">{contact.email || '—'}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Category</label>
              {isEditing ? (
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g., Exchange, Friend, Merchant"
                  maxLength={30}
                  className="w-full px-3 py-2 bg-gray-850 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                />
              ) : (
                <p className="text-sm text-white">{contact.category || '—'}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes</label>
              {isEditing ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this contact"
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 bg-gray-850 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10 resize-none"
                />
              ) : (
                <p className="text-sm text-white whitespace-pre-wrap">{contact.notes || '—'}</p>
              )}
            </div>
          </div>

          {/* Custom Tags */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
              Custom Tags
            </h4>

            {Object.keys(tags).length > 0 && (
              <div className="space-y-2">
                {Object.entries(tags).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-gray-850 border border-gray-800 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-400">{key}:</span>{' '}
                      <span className="text-sm text-white">{value}</span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => handleRemoveTag(key)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                        aria-label={`Remove tag ${key}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isEditing && (
              <>
                {isAddingTag ? (
                  <div className="space-y-2 p-3 bg-gray-850 border border-gray-800 rounded-lg">
                    <input
                      type="text"
                      value={newTagKey}
                      onChange={(e) => setNewTagKey(e.target.value)}
                      placeholder="Key (e.g., invoice-id)"
                      maxLength={30}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                    />
                    <input
                      type="text"
                      value={newTagValue}
                      onChange={(e) => setNewTagValue(e.target.value)}
                      placeholder="Value"
                      maxLength={100}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddTag}
                        className="flex-1 px-3 py-2 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Save Tag
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingTag(false);
                          setNewTagKey('');
                          setNewTagValue('');
                        }}
                        className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingTag(true)}
                    className="text-sm text-bitcoin hover:text-bitcoin-hover font-medium transition-colors"
                  >
                    + Add Tag
                  </button>
                )}
              </>
            )}

            {!isEditing && Object.keys(tags).length === 0 && (
              <p className="text-sm text-gray-500">No custom tags</p>
            )}
          </div>

          {/* Statistics */}
          {(contact.transactionCount || contact.lastTransactionDate) && (
            <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Statistics
              </h4>
              <div className="space-y-2">
                {contact.transactionCount !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transactions:</span>
                    <span className="text-sm text-white font-medium">{contact.transactionCount}</span>
                  </div>
                )}
                {contact.lastTransactionDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Activity:</span>
                    <span className="text-sm text-white font-medium">
                      {formatDate(contact.lastTransactionDate)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Recent Transactions
              </h4>
              {recentTransactions.length > 0 && (
                <span className="text-xs text-gray-500">Last 5</span>
              )}
            </div>

            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-700 border-t-bitcoin"></div>
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {recentTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.txid}
                    transaction={tx}
                    currentAddresses={currentAccount?.addresses.map(a => a.address) || []}
                    contacts={[contact]}
                    compact={true}
                    showDate={true}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">
                No transactions yet with this contact
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors"
                >
                  Edit Contact
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-3 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 rounded-lg font-semibold transition-colors"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactDetailPane;
