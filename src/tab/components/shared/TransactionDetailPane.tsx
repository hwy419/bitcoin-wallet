import React, { useEffect, useRef, useState } from 'react';
import { Transaction, Contact, TransactionMetadata, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { TagInput } from './TagInput';

interface TransactionDetailPaneProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  btcPrice: number | null;
  contacts?: Contact[];
  onAddContact?: (address: string, category: string) => void;
}

export const TransactionDetailPane: React.FC<TransactionDetailPaneProps> = ({
  transaction,
  isOpen,
  onClose,
  btcPrice,
  contacts = [],
  onAddContact,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const paneRef = useRef<HTMLDivElement>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Metadata state
  const [metadata, setMetadata] = useState<TransactionMetadata | null>(null);
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Metadata form state
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  // Suggestions for autocomplete
  const [allTags, setAllTags] = useState<string[]>([]);
  const [allCategories, setAllCategories] = useState<string[]>([]);

  // Fetch metadata when transaction changes
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!transaction) return;

      setIsLoadingMetadata(true);
      try {
        // Fetch this transaction's metadata
        const metadataResponse = await sendMessage<{ metadata: TransactionMetadata | null }>(
          MessageType.GET_TRANSACTION_METADATA,
          { txid: transaction.txid }
        );
        setMetadata(metadataResponse.metadata);

        // Initialize form with existing metadata
        if (metadataResponse.metadata) {
          setCategory(metadataResponse.metadata.category || '');
          setTags(metadataResponse.metadata.tags || []);
          setNotes(metadataResponse.metadata.notes || '');
        } else {
          setCategory('');
          setTags([]);
          setNotes('');
        }

        // Fetch all tags and categories for suggestions
        const tagsResponse = await sendMessage<{ tags: string[] }>(
          MessageType.GET_ALL_TRANSACTION_TAGS,
          {}
        );
        setAllTags(tagsResponse.tags || []);

        const categoriesResponse = await sendMessage<{ categories: string[] }>(
          MessageType.GET_ALL_TRANSACTION_CATEGORIES,
          {}
        );
        setAllCategories(categoriesResponse.categories || []);

        // Check if wallet is locked
        const statusResponse = await sendMessage<{ locked: boolean }>(
          MessageType.GET_WALLET_STATUS,
          {}
        );
        setIsLocked(statusResponse.locked);
      } catch (err) {
        console.error('Failed to fetch transaction metadata:', err);
        setMetadata(null);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    if (isOpen && transaction) {
      fetchMetadata();
    }
  }, [transaction, isOpen, sendMessage]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when flyout is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Focus trap: keep focus within the pane when open
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
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
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

  // Copy to clipboard function
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(label);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Find contact name for an address
  const getContactName = (address: string): string | null => {
    const contact = contacts.find((c) => c.address === address);
    return contact?.name || null;
  };

  // Format BTC value
  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Format USD value
  const formatUSD = (satoshis: number): string => {
    if (!btcPrice) return '';
    const usdValue = (satoshis / 100000000) * btcPrice;
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine transaction status
  const getStatus = (confirmations: number): { label: string; color: string } => {
    if (confirmations === 0) {
      return { label: 'Pending', color: 'text-yellow-500' };
    } else if (confirmations < 6) {
      return { label: `${confirmations} Confirmation${confirmations > 1 ? 's' : ''}`, color: 'text-blue-500' };
    } else {
      return { label: 'Confirmed', color: 'text-green-500' };
    }
  };

  // Truncate address for display
  const truncateAddress = (address: string): string => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Handle metadata save
  const handleSaveMetadata = async () => {
    if (!transaction || isLocked) return;

    // Validation
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
      await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: transaction.txid,
        metadata: {
          tags,
          category: category.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });

      // Update local metadata state
      setMetadata({
        tags,
        category: category.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save metadata:', err);
      alert('Failed to save metadata. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle metadata cancel
  const handleCancelMetadata = () => {
    // Reset form to metadata state
    if (metadata) {
      setCategory(metadata.category || '');
      setTags(metadata.tags || []);
      setNotes(metadata.notes || '');
    } else {
      setCategory('');
      setTags([]);
      setNotes('');
    }
    setIsEditing(false);
  };

  // Handle toggle metadata section
  const handleToggleMetadata = () => {
    if (!isMetadataExpanded && !metadata && !isLocked) {
      // Auto-enter edit mode when expanding empty metadata
      setIsEditing(true);
    }
    setIsMetadataExpanded(!isMetadataExpanded);
  };

  if (!transaction) return null;

  const status = getStatus(transaction.confirmations);
  const isSent = transaction.value < 0;
  const absoluteValue = Math.abs(transaction.value);

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
        aria-labelledby="transaction-detail-title"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between z-10">
          <h2 id="transaction-detail-title" className="text-lg font-semibold text-white">
            Transaction Details
          </h2>
          <button
            data-close-button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 -mr-2"
            aria-label="Close transaction details"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Amount Card */}
          <div className="bg-gray-850 border border-gray-800 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">{isSent ? 'Sent' : 'Received'}</p>
            <p className={`text-3xl font-bold mb-2 ${isSent ? 'text-red-500' : 'text-green-500'}`}>
              {isSent ? '-' : '+'} {formatBTC(absoluteValue)} BTC
            </p>
            {btcPrice && (
              <p className="text-lg text-gray-400">
                ≈ {isSent ? '-' : '+'} {formatUSD(absoluteValue)}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Status</span>
              <span className={`text-sm font-semibold ${status.color}`}>{status.label}</span>
            </div>
          </div>

          {/* Transaction ID */}
          <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Transaction ID</span>
              <button
                onClick={() => copyToClipboard(transaction.txid, 'txid')}
                className="text-bitcoin hover:text-bitcoin-dark transition-colors text-xs font-medium flex items-center gap-1"
              >
                {copiedItem === 'txid' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-white font-mono break-all">{transaction.txid}</p>
          </div>

          {/* Date & Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Date</p>
              <p className="text-sm text-white">{formatDate(transaction.timestamp)}</p>
            </div>
            <div className="bg-gray-850 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Fee</p>
              <p className="text-sm text-white">{formatBTC(transaction.fee)} BTC</p>
            </div>
          </div>

          {/* Inputs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Inputs ({transaction.inputs.length})
            </h3>
            <div className="space-y-2">
              {transaction.inputs.map((input, index) => {
                const contactName = getContactName(input.address);
                return (
                  <div
                    key={`${input.txid}-${input.vout}-${index}`}
                    className="bg-gray-850 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        {contactName && (
                          <p className="text-xs font-semibold text-bitcoin mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {contactName}
                          </p>
                        )}
                        <p className="text-sm text-white font-mono break-all" title={input.address}>
                          {truncateAddress(input.address)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(input.address, `input-${index}`)}
                        className="text-gray-400 hover:text-white transition-colors ml-2 flex-shrink-0"
                        aria-label="Copy input address"
                      >
                        {copiedItem === `input-${index}` ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{formatBTC(input.value)} BTC</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Outputs */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
              Outputs ({transaction.outputs.length})
            </h3>
            <div className="space-y-2">
              {transaction.outputs.map((output, index) => {
                const contactName = getContactName(output.address);
                return (
                  <div
                    key={`${output.address}-${index}`}
                    className="bg-gray-850 border border-gray-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        {contactName && (
                          <p className="text-xs font-semibold text-bitcoin mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            {contactName}
                          </p>
                        )}
                        <p className="text-sm text-white font-mono break-all" title={output.address}>
                          {truncateAddress(output.address)}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(output.address, `output-${index}`)}
                        className="text-gray-400 hover:text-white transition-colors ml-2 flex-shrink-0"
                        aria-label="Copy output address"
                      >
                        {copiedItem === `output-${index}` ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">{formatBTC(output.value)} BTC</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tags & Notes Section */}
          <div className="border-t border-gray-700 pt-4">
            <button
              onClick={handleToggleMetadata}
              className="flex items-center justify-between w-full text-left mb-2 hover:text-bitcoin transition-colors"
              disabled={isLoadingMetadata}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Tags & Notes</span>
                {isLocked && (
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isMetadataExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLoadingMetadata && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-700 border-t-bitcoin"></div>
              </div>
            )}

            {isMetadataExpanded && !isLoadingMetadata && (
              <div className="mt-4 space-y-4">
                {isLocked ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-sm text-amber-300">
                      Wallet is locked. Unlock to edit transaction metadata.
                    </p>
                  </div>
                ) : isEditing ? (
                  <>
                    {/* Category input with datalist for autocomplete */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Category
                      </label>
                      <input
                        type="text"
                        list="categories"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g., Payment, Donation, Purchase"
                        maxLength={30}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                      />
                      <datalist id="categories">
                        {allCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                      <p className="mt-1 text-xs text-gray-500">{category.length}/30 characters</p>
                    </div>

                    {/* Tags input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Tags
                      </label>
                      <TagInput
                        tags={tags}
                        onChange={setTags}
                        suggestions={allTags}
                        placeholder="Add tags..."
                        maxTags={10}
                        maxTagLength={30}
                      />
                    </div>

                    {/* Notes textarea */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add notes about this transaction"
                        maxLength={500}
                        rows={4}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10 resize-none"
                      />
                      <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveMetadata}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelMetadata}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Display mode */}
                    {metadata && (metadata.category || metadata.tags.length > 0 || metadata.notes) ? (
                      <div className="space-y-3">
                        {metadata.category && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Category</p>
                            <span className="inline-block px-2 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-sm rounded">
                              {metadata.category}
                            </span>
                          </div>
                        )}

                        {metadata.tags.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Tags</p>
                            <div className="flex flex-wrap gap-2">
                              {metadata.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-block px-2 py-1 bg-bitcoin/15 border border-bitcoin/30 text-bitcoin-light text-xs rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {metadata.notes && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{metadata.notes}</p>
                          </div>
                        )}

                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-sm text-bitcoin hover:text-bitcoin-hover font-medium transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">No tags or notes yet</p>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-750 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Add Tags & Notes
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* View on Explorer Button */}
          <a
            href={`https://blockstream.info/testnet/tx/${transaction.txid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-gray-800 hover:bg-gray-750 text-white text-center py-3 px-4 rounded-lg transition-colors font-medium"
          >
            View on Block Explorer
            <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </>
  );
};
