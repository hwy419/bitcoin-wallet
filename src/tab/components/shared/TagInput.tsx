/**
 * TagInput - Tag input component with autocomplete
 *
 * Features:
 * - Input field with autocomplete dropdown
 * - Display tags as removable chips
 * - Duplicate prevention
 * - Max tag length validation
 * - Press Enter to add tag
 * - Press Backspace on empty input to remove last tag
 * - Autocomplete dropdown showing suggestions
 * - Tailwind CSS dark theme styling
 *
 * Usage:
 * <TagInput
 *   tags={tags}
 *   onChange={setTags}
 *   suggestions={existingTags}
 *   placeholder="Add tags..."
 *   maxTags={10}
 *   maxTagLength={30}
 * />
 */

import React, { useState, useRef, useEffect } from 'react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];  // Autocomplete suggestions
  placeholder?: string;
  maxTags?: number;
  maxTagLength?: number;
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  suggestions = [],
  placeholder = 'Add tags...',
  maxTags = 10,
  maxTagLength = 30,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and exclude already added tags
  const filteredSuggestions = suggestions.filter(
    suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !tags.includes(suggestion) &&
      inputValue.length > 0
  );

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();

    // Validation
    if (trimmedTag === '') return;
    if (tags.includes(trimmedTag)) return;
    if (tags.length >= maxTags) return;
    if (trimmedTag.length > maxTagLength) return;

    onChange([...tags, trimmedTag]);
    setInputValue('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(value.length > 0 && filteredSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter: Add tag
    if (e.key === 'Enter') {
      e.preventDefault();

      // If a suggestion is selected, use it
      if (selectedSuggestionIndex >= 0 && filteredSuggestions[selectedSuggestionIndex]) {
        addTag(filteredSuggestions[selectedSuggestionIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    }

    // Backspace: Remove last tag if input is empty
    if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags.length - 1);
    }

    // Arrow Down: Navigate suggestions
    if (e.key === 'ArrowDown' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    }

    // Arrow Up: Navigate suggestions
    if (e.key === 'ArrowUp' && filteredSuggestions.length > 0) {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    }

    // Escape: Close suggestions
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const isMaxTagsReached = tags.length >= maxTags;
  const isInputTooLong = inputValue.length > maxTagLength;

  return (
    <div className="relative">
      {/* Tag Container */}
      <div
        onClick={handleContainerClick}
        className={`min-h-[42px] px-3 py-2 bg-gray-900 border ${
          isMaxTagsReached ? 'border-amber-500/50' : 'border-gray-700'
        } rounded-lg cursor-text focus-within:border-bitcoin focus-within:ring-2 focus-within:ring-bitcoin/10 transition-colors`}
      >
        <div className="flex flex-wrap gap-2">
          {/* Tag Pills */}
          {tags.map((tag, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-bitcoin/15 border border-bitcoin/30 rounded-full text-sm text-bitcoin-light"
            >
              <span className="max-w-[150px] truncate">{tag}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(index);
                }}
                className="p-0.5 hover:bg-bitcoin/20 rounded transition-colors"
                aria-label={`Remove tag ${tag}`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Input Field */}
          {!isMaxTagsReached && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (inputValue.length > 0 && filteredSuggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={tags.length === 0 ? placeholder : ''}
              className="flex-1 min-w-[120px] bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
              disabled={isMaxTagsReached}
            />
          )}
        </div>
      </div>

      {/* Validation Messages */}
      <div className="mt-1 flex items-center justify-between text-xs">
        <div>
          {isInputTooLong && (
            <p className="text-red-400">
              Tag too long (max {maxTagLength} characters)
            </p>
          )}
          {isMaxTagsReached && (
            <p className="text-amber-400">
              Maximum {maxTags} tags reached
            </p>
          )}
        </div>
        <p className="text-gray-500">
          {tags.length}/{maxTags} tags
        </p>
      </div>

      {/* Autocomplete Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-gray-850 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                index === selectedSuggestionIndex
                  ? 'bg-bitcoin/20 text-bitcoin-light'
                  : 'text-white hover:bg-gray-800'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="mt-1 text-xs text-gray-500">
        Press Enter to add, Backspace to remove
      </p>
    </div>
  );
};

export default TagInput;
