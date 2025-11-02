/**
 * AddEditContactModal - Modal for adding or editing contacts (v2.0)
 *
 * Provides a comprehensive form for creating/editing contacts with v2.0 features:
 * - 16-color avatar customization with live preview
 * - Extended public key (xpub) support with validation
 * - Email address field
 * - Hybrid model: single address OR xpub (at least one required)
 * - Real-time validation using validation utilities
 *
 * Updates in v2.0:
 * - ColorPicker integration for avatar customization
 * - Live ContactAvatar preview with selected color
 * - Xpub field with XpubValidator integration
 * - Email field with validation
 * - Enhanced validation: address OR xpub required (not both mandatory)
 *
 * Props:
 * - isOpen: Controls modal visibility
 * - onClose: Callback when modal closes
 * - contact: Contact to edit (undefined for add mode)
 * - onSave: Callback when contact is saved successfully
 *
 * @see prompts/docs/plans/CONTACTS_V2_UI_UX_DESIGN.md
 */

import React, { useState, useEffect } from 'react';
import { Contact, ContactColor } from '../../../shared/types';
import { Modal } from './Modal';
import { ContactAvatar } from './ContactAvatar';
import { ColorPicker } from './ColorPicker';
import {
  validateContactName,
  validateContactAddress,
  validateContactNotes,
  validateContactCategory,
  validateContactEmail,
  validateContactXpub,
} from '../../../shared/utils/contactValidation';

interface AddEditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  onSave: (contact: Contact) => void;
}

export const AddEditContactModal: React.FC<AddEditContactModalProps> = ({
  isOpen,
  onClose,
  contact,
  onSave,
}) => {
  const isEditMode = !!contact;

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [xpub, setXpub] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [color, setColor] = useState<ContactColor>('blue');
  const [tags, setTags] = useState<{ [key: string]: string }>({});

  // Tags editor state
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagKey, setNewTagKey] = useState('');
  const [newTagValue, setNewTagValue] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [xpubError, setXpubError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form with contact data in edit mode
  useEffect(() => {
    if (isEditMode && contact) {
      setName(contact.name);
      setAddress(contact.address || '');
      setXpub(contact.xpub || '');
      setEmail(contact.email || '');
      setNotes(contact.notes || '');
      setCategory(contact.category || '');
      setColor(contact.color || 'blue');
      setTags(contact.tags || {});
    } else {
      // Clear form in add mode
      setName('');
      setAddress('');
      setXpub('');
      setEmail('');
      setNotes('');
      setCategory('');
      setColor('blue');
      setTags({});
    }

    // Clear errors when modal opens
    setNameError(null);
    setAddressError(null);
    setXpubError(null);
    setEmailError(null);
    setNotesError(null);
    setCategoryError(null);
    setFormError(null);
    setSaveError(null);
  }, [isEditMode, contact, isOpen]);

  // Validation handlers
  const handleNameBlur = () => {
    const result = validateContactName(name);
    if (!result.valid && result.errors.length > 0) {
      setNameError(result.errors[0]);
    }
  };

  const handleAddressBlur = () => {
    // Only validate if address is provided (not required if xpub is provided)
    if (address.trim()) {
      const result = validateContactAddress(address, 'testnet');
      if (!result.valid && result.errors.length > 0) {
        setAddressError(result.errors[0]);
      }
    }
  };

  const handleXpubBlur = () => {
    // Only validate if xpub is provided (not required if address is provided)
    if (xpub.trim()) {
      const result = validateContactXpub(xpub, 'testnet');
      if (!result.valid && result.errors.length > 0) {
        setXpubError(result.errors[0]);
      }
    }
  };

  const handleEmailBlur = () => {
    // Only validate if email is provided (optional field)
    if (email.trim()) {
      const result = validateContactEmail(email);
      if (!result.valid && result.errors.length > 0) {
        setEmailError(result.errors[0]);
      }
    }
  };

  const handleNotesBlur = () => {
    const result = validateContactNotes(notes);
    if (!result.valid && result.errors.length > 0) {
      setNotesError(result.errors[0]);
    }
  };

  const handleCategoryBlur = () => {
    const result = validateContactCategory(category);
    if (!result.valid && result.errors.length > 0) {
      setCategoryError(result.errors[0]);
    }
  };

  // Input change handlers (clear errors on change)
  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) setNameError(null);
  };

  const handleAddressChange = (value: string) => {
    setAddress(value);
    if (addressError) setAddressError(null);
    if (formError) setFormError(null);
  };

  const handleXpubChange = (value: string) => {
    setXpub(value);
    if (xpubError) setXpubError(null);
    if (formError) setFormError(null);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError(null);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    if (notesError) setNotesError(null);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    if (categoryError) setCategoryError(null);
  };

  const handleColorChange = (newColor: ContactColor) => {
    setColor(newColor);
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

  // Validate all fields
  const validateAll = (): boolean => {
    let isValid = true;

    // Name validation (required)
    const nameResult = validateContactName(name);
    if (!nameResult.valid) {
      setNameError(nameResult.errors[0] || 'Invalid name');
      isValid = false;
    }

    // Hybrid model validation: at least one of address OR xpub is required
    const hasAddress = address.trim().length > 0;
    const hasXpub = xpub.trim().length > 0;

    if (!hasAddress && !hasXpub) {
      setFormError('Please provide either a Bitcoin address or an extended public key (xpub)');
      isValid = false;
    }

    // Address validation (if provided)
    if (hasAddress) {
      const addressResult = validateContactAddress(address, 'testnet');
      if (!addressResult.valid) {
        setAddressError(addressResult.errors[0] || 'Invalid address');
        isValid = false;
      }
    }

    // Xpub validation (if provided)
    if (hasXpub) {
      const xpubResult = validateContactXpub(xpub, 'testnet');
      if (!xpubResult.valid) {
        setXpubError(xpubResult.errors[0] || 'Invalid xpub');
        isValid = false;
      }
    }

    // Email validation (optional, only if provided)
    if (email.trim()) {
      const emailResult = validateContactEmail(email);
      if (!emailResult.valid) {
        setEmailError(emailResult.errors[0] || 'Invalid email');
        isValid = false;
      }
    }

    // Notes validation (optional, only if provided)
    if (notes.trim()) {
      const notesResult = validateContactNotes(notes);
      if (!notesResult.valid) {
        setNotesError(notesResult.errors[0] || 'Invalid notes');
        isValid = false;
      }
    }

    // Category validation (optional, only if provided)
    if (category.trim()) {
      const categoryResult = validateContactCategory(category);
      if (!categoryResult.valid) {
        setCategoryError(categoryResult.errors[0] || 'Invalid category');
        isValid = false;
      }
    }

    return isValid;
  };

  // Handle save
  const handleSave = async () => {
    setSaveError(null);

    // Validate all fields
    if (!validateAll()) {
      return;
    }

    setIsSaving(true);

    try {
      // Build contact object with v2.0 fields
      const contactData: Contact = {
        id: contact?.id || '', // Will be generated by backend for new contacts
        name: name.trim(),

        // Address fields (optional in hybrid model)
        address: address.trim() || undefined,
        addressType: contact?.addressType || undefined,

        // Xpub fields (optional in hybrid model)
        xpub: xpub.trim() || undefined,
        xpubFingerprint: contact?.xpubFingerprint, // Will be calculated by backend for new xpub
        xpubDerivationPath: contact?.xpubDerivationPath,
        cachedAddresses: contact?.cachedAddresses,
        addressesLastUpdated: contact?.addressesLastUpdated,

        // New v2.0 fields
        email: email.trim() || undefined,
        color: color,
        tags: Object.keys(tags).length > 0 ? tags : undefined,

        // Existing optional fields
        notes: notes.trim() || undefined,
        category: category.trim() || undefined,

        // Metadata
        createdAt: contact?.createdAt || Date.now(),
        updatedAt: Date.now(),
        transactionCount: contact?.transactionCount,
        lastTransactionDate: contact?.lastTransactionDate,
      };

      // Call parent save handler
      onSave(contactData);

      // Close modal on success
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save contact');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnBackdropClick={!isSaving}>
      <div className="p-6 w-[600px] max-w-full">
        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-6">
          {isEditMode ? 'Edit Contact' : 'Add Contact'}
        </h2>

        {/* Save Error */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300">{saveError}</p>
          </div>
        )}

        {/* Form Error (for hybrid model validation) */}
        {formError && (
          <div className="mb-4 p-3 bg-orange-500/15 border border-orange-500/30 rounded-lg">
            <p className="text-sm text-orange-300">{formError}</p>
          </div>
        )}

        {/* Live Avatar Preview with Color Picker */}
        <div className="mb-6 flex items-center gap-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <ContactAvatar name={name || 'Contact'} color={color} size="xl" />
            <p className="text-xs text-gray-400">Avatar Preview</p>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Avatar Color
            </label>
            <ColorPicker selectedColor={color} onColorSelect={handleColorChange} />
          </div>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={handleNameBlur}
              placeholder="Enter contact name"
              maxLength={50}
              disabled={isSaving}
              autoFocus
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                nameError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {nameError && <p className="mt-1 text-sm text-red-400">{nameError}</p>}
            <p className="mt-1 text-xs text-gray-500">{name.length}/50 characters</p>
          </div>

          {/* Address OR Xpub Section Header */}
          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">
              Contact Information <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Provide either a single Bitcoin address OR an extended public key (xpub) for multiple addresses. At least one is required.
            </p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Bitcoin Address {!xpub && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={handleAddressBlur}
              placeholder="tb1q... or m... or n... or 2..."
              disabled={isSaving || (isEditMode && !!contact?.address)}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white font-mono text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                addressError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {addressError && <p className="mt-1 text-sm text-red-400">{addressError}</p>}
            {isEditMode && contact?.address && (
              <p className="mt-1 text-xs text-gray-500">Address cannot be changed after creation</p>
            )}
          </div>

          {/* Xpub */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Extended Public Key (Xpub) {!address && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={xpub}
              onChange={(e) => handleXpubChange(e.target.value)}
              onBlur={handleXpubBlur}
              placeholder="xpub... or tpub... (BIP32 extended public key)"
              disabled={isSaving || (isEditMode && !!contact?.xpub)}
              rows={3}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white font-mono text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
                xpubError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {xpubError && <p className="mt-1 text-sm text-red-400">{xpubError}</p>}
            {isEditMode && contact?.xpub && (
              <p className="mt-1 text-xs text-gray-500">Xpub cannot be changed after creation</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              💡 Use xpub for contacts with multiple addresses (e.g., exchanges, merchants)
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="contact@example.com"
              maxLength={100}
              disabled={isSaving}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                emailError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {emailError && <p className="mt-1 text-sm text-red-400">{emailError}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Category (Optional)
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              onBlur={handleCategoryBlur}
              placeholder="e.g., Exchange, Friend, Merchant"
              maxLength={30}
              disabled={isSaving}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                categoryError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {categoryError && <p className="mt-1 text-sm text-red-400">{categoryError}</p>}
            <p className="mt-1 text-xs text-gray-500">{category.length}/30 characters</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add any additional notes about this contact"
              maxLength={500}
              rows={3}
              disabled={isSaving}
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed resize-none ${
                notesError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {notesError && <p className="mt-1 text-sm text-red-400">{notesError}</p>}
            <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
          </div>

          {/* Custom Tags */}
          <div className="space-y-2 border-t border-gray-700 pt-4">
            <label className="block text-sm font-semibold text-gray-300">
              Custom Tags (Optional)
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Add custom key-value pairs to store additional information about this contact
            </p>

            {/* Existing tags */}
            {Object.keys(tags).length > 0 && (
              <div className="space-y-2 mb-3">
                {Object.entries(tags).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 bg-gray-850 border border-gray-800 p-3 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-gray-400">{key}:</span>{' '}
                      <span className="text-sm text-white">{value}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveTag(key)}
                      disabled={isSaving}
                      className="text-gray-500 hover:text-red-500 transition-colors disabled:opacity-50"
                      aria-label={`Remove tag ${key}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new tag */}
            {isAddingTag ? (
              <div className="space-y-2 p-3 bg-gray-850 border border-gray-800 rounded-lg">
                <input
                  type="text"
                  value={newTagKey}
                  onChange={(e) => setNewTagKey(e.target.value)}
                  placeholder="Key (e.g., invoice-id, wallet-type)"
                  maxLength={30}
                  disabled={isSaving}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500">{newTagKey.length}/30 characters</p>
                <input
                  type="text"
                  value={newTagValue}
                  onChange={(e) => setNewTagValue(e.target.value)}
                  placeholder="Value"
                  maxLength={100}
                  disabled={isSaving}
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/10 disabled:opacity-50"
                />
                <p className="text-xs text-gray-500">{newTagValue.length}/100 characters</p>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleAddTag}
                    disabled={isSaving || !newTagKey.trim() || !newTagValue.trim()}
                    className="flex-1 px-3 py-2 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Save Tag
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingTag(false);
                      setNewTagKey('');
                      setNewTagValue('');
                    }}
                    disabled={isSaving}
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingTag(true)}
                disabled={isSaving}
                className="text-sm text-bitcoin hover:text-bitcoin-hover font-medium transition-colors disabled:opacity-50"
              >
                + Add Tag
              </button>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim() || (!address.trim() && !xpub.trim())}
            className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              isEditMode ? 'Save Changes' : 'Add Contact'
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddEditContactModal;
