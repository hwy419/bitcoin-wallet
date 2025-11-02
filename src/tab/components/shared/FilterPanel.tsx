import React, { useState, useEffect, useCallback } from 'react';
import * as bitcoin from 'bitcoinjs-lib';
import { MultiSelectDropdown, MultiSelectOption } from './MultiSelectDropdown';
import { Contact, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';

export interface TransactionFilters {
  senderAddress: string;
  amountMin: number | null;
  amountMax: number | null;
  transactionHash: string;
  contactIds: string[];      // Multi-select contacts
  tags: string[];           // Multi-select tags
  categories: string[];     // Multi-select categories
}

interface FilterPanelProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  network: 'testnet' | 'mainnet';
  contacts: Contact[];  // For contact filter
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFiltersChange,
  isExpanded,
  onToggleExpanded,
  network,
  contacts,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const [localFilters, setLocalFilters] = useState<TransactionFilters>(filters);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Tag and category data
  const [allTags, setAllTags] = useState<Array<{ tag: string; count: number }>>([]);
  const [allCategories, setAllCategories] = useState<Array<{ category: string; count: number }>>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Validate Bitcoin address
  const validateAddress = useCallback((address: string): boolean => {
    if (!address) {
      setAddressError(null);
      return true;
    }

    try {
      const bitcoinNetwork = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;
      bitcoin.address.toOutputScript(address, bitcoinNetwork);
      setAddressError(null);
      return true;
    } catch (e) {
      setAddressError('Invalid Bitcoin address format');
      return false;
    }
  }, [network]);

  // Validate transaction hash
  const validateHash = useCallback((hash: string): boolean => {
    if (!hash) {
      setHashError(null);
      return true;
    }

    // Must be hex format, minimum 8 characters for partial match
    const hexRegex = /^[0-9a-fA-F]{8,64}$/;
    if (!hexRegex.test(hash)) {
      if (hash.length < 8) {
        setHashError('Transaction hash must be at least 8 characters');
      } else {
        setHashError('Invalid transaction hash format (must be hexadecimal)');
      }
      return false;
    }

    setHashError(null);
    return true;
  }, []);

  // Validate amount range
  const validateAmountRange = useCallback((min: number | null, max: number | null): boolean => {
    if (min !== null && max !== null && min > max) {
      setAmountError('Minimum amount cannot be greater than maximum');
      return false;
    }
    if (min !== null && min < 0) {
      setAmountError('Amount cannot be negative');
      return false;
    }
    if (max !== null && max < 0) {
      setAmountError('Amount cannot be negative');
      return false;
    }
    setAmountError(null);
    return true;
  }, []);

  // Debounced filter update
  const debouncedUpdateFilters = useCallback((newFilters: TransactionFilters) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      // Validate before applying
      const addressValid = validateAddress(newFilters.senderAddress);
      const hashValid = validateHash(newFilters.transactionHash);
      const amountValid = validateAmountRange(newFilters.amountMin, newFilters.amountMax);

      if (addressValid && hashValid && amountValid) {
        onFiltersChange(newFilters);
      }
    }, 300);
  }, [onFiltersChange, validateAddress, validateHash, validateAmountRange]);

  // Handle input changes
  const handleSenderAddressChange = (value: string) => {
    const newFilters = { ...localFilters, senderAddress: value };
    setLocalFilters(newFilters);
    debouncedUpdateFilters(newFilters);
  };

  const handleAmountMinChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newFilters = { ...localFilters, amountMin: numValue };
    setLocalFilters(newFilters);
    debouncedUpdateFilters(newFilters);
  };

  const handleAmountMaxChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const newFilters = { ...localFilters, amountMax: numValue };
    setLocalFilters(newFilters);
    debouncedUpdateFilters(newFilters);
  };

  const handleTransactionHashChange = (value: string) => {
    const newFilters = { ...localFilters, transactionHash: value };
    setLocalFilters(newFilters);
    debouncedUpdateFilters(newFilters);
  };

  const handleContactIdsChange = (contactIds: string[]) => {
    const newFilters = { ...localFilters, contactIds };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleTagsChange = (tags: string[]) => {
    const newFilters = { ...localFilters, tags };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleCategoriesChange = (categories: string[]) => {
    const newFilters = { ...localFilters, categories };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Clear individual filter
  const clearSenderAddress = () => {
    const newFilters = { ...localFilters, senderAddress: '' };
    setLocalFilters(newFilters);
    setAddressError(null);
    onFiltersChange(newFilters);
  };

  const clearAmountRange = () => {
    const newFilters = { ...localFilters, amountMin: null, amountMax: null };
    setLocalFilters(newFilters);
    setAmountError(null);
    onFiltersChange(newFilters);
  };

  const clearTransactionHash = () => {
    const newFilters = { ...localFilters, transactionHash: '' };
    setLocalFilters(newFilters);
    setHashError(null);
    onFiltersChange(newFilters);
  };

  const clearContactIds = () => {
    const newFilters = { ...localFilters, contactIds: [] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearTags = () => {
    const newFilters = { ...localFilters, tags: [] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearCategories = () => {
    const newFilters = { ...localFilters, categories: [] };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Reset all filters
  const resetAllFilters = () => {
    const emptyFilters: TransactionFilters = {
      senderAddress: '',
      amountMin: null,
      amountMax: null,
      transactionHash: '',
      contactIds: [],
      tags: [],
      categories: [],
    };
    setLocalFilters(emptyFilters);
    setAddressError(null);
    setHashError(null);
    setAmountError(null);
    onFiltersChange(emptyFilters);
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.senderAddress !== '' ||
    filters.amountMin !== null ||
    filters.amountMax !== null ||
    filters.transactionHash !== '' ||
    filters.contactIds.length > 0 ||
    filters.tags.length > 0 ||
    filters.categories.length > 0;

  // Fetch all tags when panel expands
  useEffect(() => {
    if (isExpanded && allTags.length === 0) {
      setIsLoadingTags(true);
      sendMessage<{ tags: Array<{ tag: string; count: number }> }>(
        MessageType.GET_ALL_TRANSACTION_TAGS,
        {}
      )
        .then(response => {
          setAllTags(response.tags || []);
        })
        .catch(err => {
          console.error('Failed to fetch tags:', err);
          setAllTags([]);
        })
        .finally(() => {
          setIsLoadingTags(false);
        });
    }
  }, [isExpanded, allTags.length, sendMessage]);

  // Fetch all categories when panel expands
  useEffect(() => {
    if (isExpanded && allCategories.length === 0) {
      setIsLoadingCategories(true);
      sendMessage<{ categories: Array<{ category: string; count: number }> }>(
        MessageType.GET_ALL_TRANSACTION_CATEGORIES,
        {}
      )
        .then(response => {
          setAllCategories(response.categories || []);
        })
        .catch(err => {
          console.error('Failed to fetch categories:', err);
          setAllCategories([]);
        })
        .finally(() => {
          setIsLoadingCategories(false);
        });
    }
  }, [isExpanded, allCategories.length, sendMessage]);

  // Prepare contact options
  const contactOptions: MultiSelectOption[] = contacts
    .map(contact => ({
      value: contact.id,
      label: contact.name,
      subtitle: contact.category || (contact.address ? `${contact.address.slice(0, 10)}...` : undefined),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Prepare tag options
  const tagOptions: MultiSelectOption[] = allTags.map(({ tag, count }) => ({
    value: tag,
    label: tag,
    count,
  }));

  // Prepare category options
  const categoryOptions: MultiSelectOption[] = allCategories.map(({ category, count }) => ({
    value: category,
    label: category,
    count,
  }));

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-850 border border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggleExpanded}
        className="w-full flex items-center justify-between p-4 bg-gray-850 hover:bg-gray-800 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="filter-panel-content"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-bitcoin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-base font-semibold text-white">Search & Filter</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 bg-bitcoin/20 border border-bitcoin/40 text-bitcoin-light text-xs font-semibold rounded">
              Active
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Controls */}
      {isExpanded && (
        <div id="filter-panel-content" className="p-4 border-t border-gray-700 space-y-4">
          {/* Sender Address Filter */}
          <div>
            <label htmlFor="sender-address" className="block text-sm font-medium text-gray-300 mb-2">
              Sender Address
            </label>
            <div className="relative">
              <input
                id="sender-address"
                type="text"
                value={localFilters.senderAddress}
                onChange={(e) => handleSenderAddressChange(e.target.value)}
                placeholder={network === 'testnet' ? 'tb1q... or m... or 2...' : '1A2b... or bc1q... or 3...'}
                className={`w-full px-4 py-2 pr-10 bg-gray-900 border ${
                  addressError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10`}
                aria-describedby={addressError ? 'address-error' : undefined}
              />
              {localFilters.senderAddress && (
                <button
                  onClick={clearSenderAddress}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  aria-label="Clear sender address filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {addressError && (
              <p id="address-error" className="mt-1 text-xs text-red-400">
                {addressError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Exact match only (case-insensitive)
            </p>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount Range (BTC)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  id="amount-min"
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={localFilters.amountMin ?? ''}
                  onChange={(e) => handleAmountMinChange(e.target.value)}
                  placeholder="Min (e.g., 0.001)"
                  className={`w-full px-3 py-2 bg-gray-900 border ${
                    amountError ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10`}
                  aria-label="Minimum amount"
                  aria-describedby={amountError ? 'amount-error' : undefined}
                />
              </div>
              <div>
                <input
                  id="amount-max"
                  type="number"
                  step="0.00000001"
                  min="0"
                  value={localFilters.amountMax ?? ''}
                  onChange={(e) => handleAmountMaxChange(e.target.value)}
                  placeholder="Max (e.g., 1.0)"
                  className={`w-full px-3 py-2 bg-gray-900 border ${
                    amountError ? 'border-red-500' : 'border-gray-700'
                  } rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10`}
                  aria-label="Maximum amount"
                  aria-describedby={amountError ? 'amount-error' : undefined}
                />
              </div>
            </div>
            {localFilters.amountMin !== null || localFilters.amountMax !== null ? (
              <button
                onClick={clearAmountRange}
                className="mt-2 text-xs text-bitcoin hover:text-bitcoin-hover font-medium transition-colors"
              >
                Clear amount filter
              </button>
            ) : null}
            {amountError && (
              <p id="amount-error" className="mt-1 text-xs text-red-400">
                {amountError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Filters by absolute value (ignores sent/received direction)
            </p>
          </div>

          {/* Transaction Hash Filter */}
          <div>
            <label htmlFor="transaction-hash" className="block text-sm font-medium text-gray-300 mb-2">
              Transaction Hash
            </label>
            <div className="relative">
              <input
                id="transaction-hash"
                type="text"
                value={localFilters.transactionHash}
                onChange={(e) => handleTransactionHashChange(e.target.value)}
                placeholder="1a2b3c4d... (min 8 characters)"
                className={`w-full px-4 py-2 pr-10 bg-gray-900 border ${
                  hashError ? 'border-red-500' : 'border-gray-700'
                } rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10 font-mono`}
                aria-describedby={hashError ? 'hash-error' : undefined}
              />
              {localFilters.transactionHash && (
                <button
                  onClick={clearTransactionHash}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                  aria-label="Clear transaction hash filter"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {hashError && (
              <p id="hash-error" className="mt-1 text-xs text-red-400">
                {hashError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Supports partial match (minimum 8 characters)
            </p>
          </div>

          {/* Filter by Contact */}
          <div>
            <MultiSelectDropdown
              label="Filter by Contact"
              placeholder="Select contacts..."
              options={contactOptions}
              selected={localFilters.contactIds}
              onChange={handleContactIdsChange}
              showSearch={true}
              maxDisplay={3}
            />
            <p className="mt-1 text-xs text-gray-500">
              Show only transactions involving selected contacts
            </p>
          </div>

          {/* Filter by Tags */}
          <div>
            <MultiSelectDropdown
              label="Filter by Tags"
              placeholder="Select tags..."
              options={tagOptions}
              selected={localFilters.tags}
              onChange={handleTagsChange}
              showSearch={true}
              maxDisplay={3}
            />
            {isLoadingTags && (
              <p className="mt-1 text-xs text-gray-500">Loading tags...</p>
            )}
            {!isLoadingTags && tagOptions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">No tags found</p>
            )}
            {!isLoadingTags && tagOptions.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Show transactions with any of the selected tags
              </p>
            )}
          </div>

          {/* Filter by Category */}
          <div>
            <MultiSelectDropdown
              label="Filter by Category"
              placeholder="Select categories..."
              options={categoryOptions}
              selected={localFilters.categories}
              onChange={handleCategoriesChange}
              showSearch={true}
              maxDisplay={3}
            />
            {isLoadingCategories && (
              <p className="mt-1 text-xs text-gray-500">Loading categories...</p>
            )}
            {!isLoadingCategories && categoryOptions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">No categories found</p>
            )}
            {!isLoadingCategories && categoryOptions.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Show transactions with the selected categories
              </p>
            )}
          </div>

          {/* Active Filter Pills */}
          {hasActiveFilters && (
            <div className="pt-3 border-t border-gray-700">
              <p className="text-xs font-medium text-gray-400 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {filters.senderAddress && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light">
                    <span className="font-medium">Sender:</span>
                    <span className="font-mono">{filters.senderAddress.slice(0, 10)}...</span>
                    <button
                      onClick={clearSenderAddress}
                      className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                      aria-label="Remove sender address filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {(filters.amountMin !== null || filters.amountMax !== null) && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light">
                    <span className="font-medium">Amount:</span>
                    <span>
                      {filters.amountMin !== null ? filters.amountMin : '0'} - {filters.amountMax !== null ? filters.amountMax : '∞'} BTC
                    </span>
                    <button
                      onClick={clearAmountRange}
                      className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                      aria-label="Remove amount range filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {filters.transactionHash && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light">
                    <span className="font-medium">Hash:</span>
                    <span className="font-mono">{filters.transactionHash.slice(0, 8)}...</span>
                    <button
                      onClick={clearTransactionHash}
                      className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                      aria-label="Remove transaction hash filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {filters.contactIds.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light">
                    <span className="font-medium">Contacts:</span>
                    <span>{filters.contactIds.length} selected</span>
                    <button
                      onClick={clearContactIds}
                      className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                      aria-label="Remove contact filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {filters.tags.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light">
                    <span className="font-medium">Tags:</span>
                    <span>{filters.tags.slice(0, 2).join(', ')}{filters.tags.length > 2 ? ` +${filters.tags.length - 2}` : ''}</span>
                    <button
                      onClick={clearTags}
                      className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                      aria-label="Remove tag filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
                {filters.categories.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light">
                    <span className="font-medium">Categories:</span>
                    <span>{filters.categories.slice(0, 2).join(', ')}{filters.categories.length > 2 ? ` +${filters.categories.length - 2}` : ''}</span>
                    <button
                      onClick={clearCategories}
                      className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                      aria-label="Remove category filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reset All Button */}
          {hasActiveFilters && (
            <div className="pt-2">
              <button
                onClick={resetAllFilters}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-750 hover:text-white transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
