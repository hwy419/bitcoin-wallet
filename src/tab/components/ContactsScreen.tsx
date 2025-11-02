/**
 * ContactsScreen - Main screen for managing Bitcoin address contacts
 *
 * Features:
 * - List all contacts with search and sort
 * - Add new contact
 * - Edit existing contact
 * - Delete contact (with confirmation)
 * - Empty state for no contacts
 * - Loading state while fetching
 *
 * Props:
 * - onBack: Callback to return to previous screen
 *
 * Usage:
 * <ContactsScreen onBack={() => setView('main')} />
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Contact, ImportResult, WalletAccount } from '../../shared/types';
import { useContacts } from '../hooks/useContacts';
import { ContactCard } from './shared/ContactCard';
import { AddEditContactModal } from './shared/AddEditContactModal';
import { CSVImportModal } from './shared/CSVImportModal';
import { ContactDetailPane } from './shared/ContactDetailPane';
import { Toast, ToastType } from './shared/Toast';
import { downloadFile } from '../utils/csvHelpers';

interface ContactsScreenProps {
  onBack: () => void;
  selectedContactId?: string;
  currentAccount: WalletAccount;
}

type SortBy = 'name' | 'date' | 'transactionCount';

const ContactsScreen: React.FC<ContactsScreenProps> = ({ onBack, selectedContactId, currentAccount }) => {
  const {
    contacts,
    isLoading,
    error,
    getContacts,
    searchContacts,
    addContact,
    updateContact,
    deleteContact,
    exportContactsCSV,
    clearError,
  } = useContacts();

  const selectedContactRef = useRef<HTMLDivElement>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Contact[]>([]);

  // Modal state
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | undefined>(undefined);

  // Delete confirmation state
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Contact detail pane state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isContactDetailOpen, setIsContactDetailOpen] = useState(false);

  // CSV import/export state
  const [showCSVImportModal, setShowCSVImportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: ToastType;
  }>({ show: false, message: '', type: 'info' });

  // Fetch contacts on mount and when sort changes
  useEffect(() => {
    getContacts(sortBy);
  }, [sortBy, getContacts]);

  // Scroll to selected contact when selectedContactId changes
  useEffect(() => {
    if (selectedContactId && selectedContactRef.current) {
      setTimeout(() => {
        selectedContactRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, [selectedContactId, contacts]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchContacts(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchContacts]);

  // Handle add contact button
  const handleAddContact = () => {
    setEditingContact(undefined);
    setShowAddEditModal(true);
  };

  // Handle edit contact
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setShowAddEditModal(true);
  };

  // Handle delete contact (show confirmation)
  const handleDeleteContact = (contactId: string) => {
    setDeletingContactId(contactId);
    setShowDeleteConfirm(true);
  };

  // Handle contact click to open detail pane
  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsContactDetailOpen(true);
  };

  // Handle close contact detail pane
  const handleCloseContactDetail = () => {
    setIsContactDetailOpen(false);
    // Delay clearing to allow animation
    setTimeout(() => setSelectedContact(null), 300);
  };

  // Handle update contact from detail pane
  const handleUpdateContactFromPane = async (contact: Contact) => {
    try {
      await updateContact(contact.id, {
        name: contact.name,
        address: contact.address,
        xpub: contact.xpub,
        email: contact.email,
        notes: contact.notes,
        category: contact.category,
        color: contact.color,
        tags: contact.tags,
      });

      // Refresh contacts list
      await getContacts(sortBy);

      // Update selected contact
      const updatedContact = contacts.find(c => c.id === contact.id);
      if (updatedContact) {
        setSelectedContact(updatedContact);
      }

      showToast('Contact updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update contact', 'error');
      throw err;
    }
  };

  // Handle delete contact from detail pane
  const handleDeleteContactFromPane = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      setIsContactDetailOpen(false);
      setSelectedContact(null);
      showToast('Contact deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete contact', 'error');
    }
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingContactId) return;

    try {
      await deleteContact(deletingContactId);
      setShowDeleteConfirm(false);
      setDeletingContactId(null);
    } catch (err) {
      // Error handled by hook
      console.error('Delete failed:', err);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeletingContactId(null);
  };

  // Handle save from modal
  const handleSaveContact = async (contact: Contact) => {
    try {
      if (editingContact) {
        // Update existing contact
        await updateContact(contact.id, {
          name: contact.name,
          address: contact.address,
          xpub: contact.xpub,
          email: contact.email,
          notes: contact.notes,
          category: contact.category,
          color: contact.color,
        });
      } else {
        // Add new contact
        await addContact({
          name: contact.name,
          address: contact.address,
          xpub: contact.xpub,
          email: contact.email,
          notes: contact.notes,
          category: contact.category,
          color: contact.color,
        });
      }

      // Refresh contacts list
      await getContacts(sortBy);
    } catch (err) {
      // Error displayed in modal
      throw err;
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Toast helper
  const showToast = (message: string, type: ToastType) => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'info' });
  };

  // Handle CSV Export
  const handleExportCSV = async () => {
    setIsExporting(true);

    try {
      const { csvData, filename } = await exportContactsCSV();

      // Download file
      downloadFile(csvData, filename);

      // Show success toast
      showToast(`Exported ${contacts.length} contacts to CSV`, 'success');
    } catch (err) {
      showToast('Failed to export contacts', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle CSV Import button
  const handleImportCSV = () => {
    setShowCSVImportModal(true);
  };

  // Handle CSV Import completion
  const handleImportComplete = async (result: ImportResult) => {
    // Refresh contacts list
    await getContacts(sortBy);

    // Show success toast
    if (result.imported > 0) {
      showToast(
        `Successfully imported ${result.imported} contact${result.imported !== 1 ? 's' : ''}`,
        'success'
      );
    } else if (result.skipped > 0) {
      showToast(`All contacts were duplicates and skipped`, 'info');
    } else {
      showToast('No contacts were imported', 'info');
    }
  };

  // Get display contacts (search results or full list)
  const displayContacts = searchQuery.trim() ? searchResults : contacts;

  // Get deleting contact name
  const deletingContactName = displayContacts.find(c => c.id === deletingContactId)?.name;

  return (
    <div className="w-full h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-1 text-gray-400 hover:text-white transition-colors"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Address Book</h1>
              <p className="text-sm text-gray-500">
                {displayContacts.length} contact{displayContacts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Import CSV Button */}
            <button
              onClick={handleImportCSV}
              className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              title="Import from CSV"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import CSV
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              disabled={contacts.length === 0 || isExporting}
              className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 disabled:bg-gray-800 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              title="Export to CSV"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </>
              )}
            </button>

            {/* Add Contact Button */}
            <button
              onClick={handleAddContact}
              className="bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Search and Sort Bar */}
        <div className="mb-6 flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search by name or address..."
              className="w-full px-4 py-3 pl-10 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-950"
            />
            {/* Search icon */}
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-white rounded transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-950"
            >
              <option value="name">Sort by Name</option>
              <option value="date">Sort by Date Added</option>
              <option value="transactionCount">Sort by Transactions</option>
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-300">{error}</p>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Loading State */}
        {(isLoading || isSearching) && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-700 border-t-bitcoin"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isSearching && displayContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-850 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              {searchQuery ? 'No contacts found' : 'No contacts yet'}
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              {searchQuery
                ? `No contacts match "${searchQuery}". Try a different search term.`
                : 'Add contacts to quickly send Bitcoin to frequently used addresses.'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleAddContact}
                className="bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Add Your First Contact
              </button>
            )}
          </div>
        )}

        {/* Contact List */}
        {!isLoading && !isSearching && displayContacts.length > 0 && (
          <div className="space-y-3">
            {displayContacts.map((contact) => (
              <div
                key={contact.id}
                ref={contact.id === selectedContactId ? selectedContactRef : null}
              >
                <ContactCard
                  contact={contact}
                  accountIndex={currentAccount?.index || 0}
                  currentAddresses={currentAccount?.addresses.map(a => a.address) || []}
                  onEdit={handleEditContact}
                  onDelete={handleDeleteContact}
                  onClick={handleContactClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Detail Pane */}
      <ContactDetailPane
        contact={selectedContact}
        isOpen={isContactDetailOpen}
        onClose={handleCloseContactDetail}
        onUpdate={handleUpdateContactFromPane}
        onDelete={handleDeleteContactFromPane}
        currentAccount={currentAccount}
      />

      {/* Add/Edit Contact Modal */}
      <AddEditContactModal
        isOpen={showAddEditModal}
        onClose={() => setShowAddEditModal(false)}
        contact={editingContact}
        onSave={handleSaveContact}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-[400px] max-w-full">
            <h2 className="text-xl font-bold text-white mb-4">Delete Contact?</h2>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to delete <span className="font-semibold text-white">{deletingContactName}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImportModal}
        onClose={() => setShowCSVImportModal(false)}
        onImportComplete={handleImportComplete}
      />

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
};

export default ContactsScreen;
