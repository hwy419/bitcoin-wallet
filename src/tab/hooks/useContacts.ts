/**
 * useContacts - Custom hook for contact operations
 *
 * Provides interface for all contact-related operations:
 * - Fetching contacts (all, by ID, by address)
 * - Searching and sorting contacts
 * - Adding, updating, deleting contacts
 * - Transaction history for contacts
 *
 * All operations communicate with background service worker via messages.
 */

import { useState, useCallback } from 'react';
import { useBackgroundMessaging } from './useBackgroundMessaging';
import { MessageType, Contact, ImportResult, ImportOptions } from '../../shared/types';

type SortBy = 'name' | 'date' | 'transactionCount';

interface UseContactsReturn {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;

  // Fetch operations
  getContacts: (sortBy?: SortBy) => Promise<void>;
  getContactById: (id: string) => Promise<Contact | null>;
  getContactByAddress: (address: string) => Promise<Contact | null>;
  searchContacts: (query: string) => Promise<Contact[]>;

  // Mutation operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'addressType'>) => Promise<Contact>;
  updateContact: (id: string, updates: Partial<Contact>) => Promise<Contact>;
  deleteContact: (id: string) => Promise<boolean>;

  // CSV import/export
  exportContactsCSV: () => Promise<{ csvData: string; filename: string }>;
  importContactsCSV: (csvData: string, options?: ImportOptions) => Promise<ImportResult>;

  // Clear error
  clearError: () => void;
}

export const useContacts = (): UseContactsReturn => {
  const { sendMessage } = useBackgroundMessaging();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all contacts with optional sorting
   */
  const getContacts = useCallback(async (sortBy?: SortBy) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage<{ contacts: Contact[] }>(
        MessageType.GET_CONTACTS,
        { sortBy }
      );
      setContacts(response.contacts || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contacts';
      setError(errorMessage);
      setContacts([]);
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage]);

  /**
   * Get contact by ID
   */
  const getContactById = useCallback(async (id: string): Promise<Contact | null> => {
    setError(null);

    try {
      const response = await sendMessage<{ contact: Contact }>(
        MessageType.GET_CONTACT_BY_ID,
        { id }
      );
      return response.contact || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contact';
      setError(errorMessage);
      return null;
    }
  }, [sendMessage]);

  /**
   * Get contact by Bitcoin address
   */
  const getContactByAddress = useCallback(async (address: string): Promise<Contact | null> => {
    setError(null);

    try {
      const response = await sendMessage<{ contact: Contact | null }>(
        MessageType.GET_CONTACT_BY_ADDRESS,
        { address }
      );
      return response.contact || null;
    } catch (err) {
      // Don't set error state for this - it's used for lookups during send
      console.error('Failed to fetch contact by address:', err);
      return null;
    }
  }, [sendMessage]);

  /**
   * Search contacts by name or address
   */
  const searchContacts = useCallback(async (query: string): Promise<Contact[]> => {
    setError(null);

    try {
      const response = await sendMessage<{ contacts: Contact[] }>(
        MessageType.SEARCH_CONTACTS,
        { query }
      );
      return response.contacts || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search contacts';
      setError(errorMessage);
      return [];
    }
  }, [sendMessage]);

  /**
   * Add new contact
   */
  const addContact = useCallback(async (
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'addressType'>
  ): Promise<Contact> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage<{ contact: Contact }>(
        MessageType.ADD_CONTACT,
        {
          name: contact.name,
          address: contact.address,
          xpub: contact.xpub,
          email: contact.email,
          notes: contact.notes,
          category: contact.category,
          color: contact.color,
        }
      );

      // Add to local state
      setContacts(prev => [...prev, response.contact]);

      return response.contact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage]);

  /**
   * Update existing contact
   */
  const updateContact = useCallback(async (
    id: string,
    updates: Partial<Contact>
  ): Promise<Contact> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage<{ contact: Contact }>(
        MessageType.UPDATE_CONTACT,
        { id, updates }
      );

      // Update in local state
      setContacts(prev => prev.map(c => c.id === id ? response.contact : c));

      return response.contact;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage]);

  /**
   * Delete contact
   */
  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage<{ success: boolean }>(
        MessageType.DELETE_CONTACT,
        { id }
      );

      if (response.success) {
        // Remove from local state
        setContacts(prev => prev.filter(c => c.id !== id));
      }

      return response.success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [sendMessage]);

  /**
   * Export contacts to CSV
   */
  const exportContactsCSV = useCallback(async (): Promise<{
    csvData: string;
    filename: string;
  }> => {
    setError(null);

    try {
      const response = await sendMessage<{
        csvData: string;
        filename: string;
      }>(MessageType.EXPORT_CONTACTS_CSV, {});

      return {
        csvData: response.csvData,
        filename: response.filename,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to export contacts';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [sendMessage]);

  /**
   * Import contacts from CSV
   */
  const importContactsCSV = useCallback(
    async (
      csvData: string,
      options?: ImportOptions
    ): Promise<ImportResult> => {
      setError(null);

      try {
        const response = await sendMessage<{ result: ImportResult }>(
          MessageType.IMPORT_CONTACTS_CSV,
          { csvData, options }
        );

        return response.result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to import contacts';
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [sendMessage]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    contacts,
    isLoading,
    error,
    getContacts,
    getContactById,
    getContactByAddress,
    searchContacts,
    addContact,
    updateContact,
    deleteContact,
    exportContactsCSV,
    importContactsCSV,
    clearError,
  };
};
