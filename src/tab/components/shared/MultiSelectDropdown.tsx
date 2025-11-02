/**
 * MultiSelectDropdown - Reusable multi-select dropdown component
 *
 * Features:
 * - Checkboxes for each option
 * - Search/filter options
 * - "Select all" / "Clear all" buttons
 * - Show selected count in button
 * - Display selected items as removable pills
 * - Keyboard navigation (Tab, Enter, ESC)
 * - Tailwind CSS dark theme styling
 *
 * Usage:
 * <MultiSelectDropdown
 *   label="Filter by Contact"
 *   placeholder="Search contacts..."
 *   options={contactOptions}
 *   selected={selectedContactIds}
 *   onChange={setSelectedContactIds}
 *   showSearch={true}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  count?: number;
}

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  showSearch?: boolean;
  maxDisplay?: number;  // Max pills to show before "X more"
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  placeholder,
  options,
  selected,
  onChange,
  showSearch = true,
  maxDisplay = 3,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    option.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showSearch]);

  // Handle ESC key to close dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setSearchQuery('');
    }
  };

  const handleToggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    onChange(filteredOptions.map(opt => opt.value));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleRemovePill = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter(v => v !== value));
  };

  // Get selected options for display
  const selectedOptions = options.filter(opt => selected.includes(opt.value));
  const displayedOptions = selectedOptions.slice(0, maxDisplay);
  const remainingCount = selectedOptions.length - maxDisplay;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-left text-sm text-white hover:bg-gray-850 hover:border-gray-600 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center justify-between">
          <span className={selected.length === 0 ? 'text-gray-500' : 'text-white'}>
            {selected.length === 0
              ? placeholder
              : `${selected.length} selected`}
          </span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Selected Pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {displayedOptions.map(option => (
            <div
              key={option.value}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-xs text-bitcoin-light"
            >
              <span className="max-w-[120px] truncate">{option.label}</span>
              <button
                onClick={(e) => handleRemovePill(option.value, e)}
                className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                aria-label={`Remove ${option.label}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="inline-flex items-center px-2 py-1 bg-gray-700 text-gray-300 rounded-full text-xs">
              +{remainingCount} more
            </div>
          )}
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-gray-850 border border-gray-700 rounded-lg shadow-xl max-h-80 overflow-hidden">
          {/* Search Input */}
          {showSearch && (
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10"
                />
              </div>
            </div>
          )}

          {/* Select All / Clear All */}
          {filteredOptions.length > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium text-bitcoin hover:text-bitcoin-hover transition-colors"
              >
                Select All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            ) : (
              filteredOptions.map(option => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => handleToggleOption(option.value)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-bitcoin focus:ring-bitcoin focus:ring-offset-0 focus:ring-2"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white truncate">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-gray-500">({option.count})</span>
                      )}
                    </div>
                    {option.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{option.subtitle}</p>
                    )}
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
