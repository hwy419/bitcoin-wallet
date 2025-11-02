/**
 * Tests for useContacts hook
 *
 * Manages contact operations including CRUD, search, and CSV import/export.
 *
 * Test coverage:
 * - Initial state
 * - getContacts (with sorting)
 * - getContactById
 * - getContactByAddress
 * - searchContacts
 * - addContact
 * - updateContact
 * - deleteContact
 * - exportContactsCSV
 * - importContactsCSV
 * - Loading states
 * - Error handling
 * - Local state synchronization
 * - clearError functionality
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useContacts } from '../useContacts';
import { MessageType, Contact } from '../../../shared/types';

// Create persistent mock
const mockSendMessage = jest.fn();

// Mock the useBackgroundMessaging hook
jest.mock('../useBackgroundMessaging', () => ({
  useBackgroundMessaging: () => ({
    sendMessage: mockSendMessage
  })
}));

describe('useContacts', () => {
  const mockContact: Contact = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Alice',
    address: 'tb1qtest123',
    addressType: 'native-segwit',
    xpub: undefined,
    email: 'alice@example.com',
    notes: 'Test contact',
    category: 'personal',
    color: 'blue',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    mockSendMessage.mockClear();
  });

  /**
   * Test: Initial state
   */
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useContacts());

    expect(result.current.contacts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  /**
   * Test: getContacts
   */
  describe('getContacts', () => {
    it('fetches all contacts', async () => {
      const mockContacts = [mockContact];

      const { result } = renderHook(() => useContacts());

      mockSendMessage.mockResolvedValueOnce({ contacts: mockContacts });

      await act(async () => {
        await result.current.getContacts();
      });

      expect(result.current.contacts).toEqual(mockContacts);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_CONTACTS,
        { sortBy: undefined }
      );
      expect(result.current.error).toBeNull();
    });

    it('supports sorting by name', async () => {
      mockSendMessage.mockResolvedValue({ contacts: [] });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.getContacts('name');
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_CONTACTS,
        { sortBy: 'name' }
      );
    });

    it('supports sorting by date', async () => {
      mockSendMessage.mockResolvedValue({ contacts: [] });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.getContacts('date');
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_CONTACTS,
        { sortBy: 'date' }
      );
    });

    it('supports sorting by transaction count', async () => {
      mockSendMessage.mockResolvedValue({ contacts: [] });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.getContacts('transactionCount');
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_CONTACTS,
        { sortBy: 'transactionCount' }
      );
    });

    it('sets loading state during fetch', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ contacts: [] }), 100);
      }));

      const { result } = renderHook(() => useContacts());

      const fetchPromise = result.current.getContacts();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await fetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles fetch errors', async () => {
      const errorMessage = 'Failed to fetch contacts';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.getContacts();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.contacts).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('clears error before fetching', async () => {
      mockSendMessage.mockRejectedValueOnce(new Error('First error'));
      mockSendMessage.mockResolvedValueOnce({ contacts: [] });

      const { result } = renderHook(() => useContacts());

      // First fetch - error
      await act(async () => {
        await result.current.getContacts();
      });

      expect(result.current.error).toBe('First error');

      // Second fetch - should clear error
      await act(async () => {
        await result.current.getContacts();
      });

      expect(result.current.error).toBeNull();
    });

    it('handles null contacts in response', async () => {
      mockSendMessage.mockResolvedValue({ contacts: null });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.getContacts();
      });

      expect(result.current.contacts).toEqual([]);
    });
  });

  /**
   * Test: getContactById
   */
  describe('getContactById', () => {
    it('fetches contact by ID', async () => {
      mockSendMessage.mockResolvedValue({ contact: mockContact });

      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.getContactById(mockContact.id);
      });

      expect(contact).toEqual(mockContact);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_CONTACT_BY_ID,
        { id: mockContact.id }
      );
    });

    it('returns null when contact not found', async () => {
      mockSendMessage.mockResolvedValue({ contact: null });

      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.getContactById('nonexistent');
      });

      expect(contact).toBeNull();
    });

    it('handles errors', async () => {
      const errorMessage = 'Contact not found';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.getContactById('test');
      });

      expect(contact).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });
  });

  /**
   * Test: getContactByAddress
   */
  describe('getContactByAddress', () => {
    it('fetches contact by address', async () => {
      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        mockSendMessage.mockResolvedValue({ contact: mockContact });
        contact = await result.current.getContactByAddress(mockContact.address);
      });

      expect(contact).toEqual(mockContact);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.GET_CONTACT_BY_ADDRESS,
        { address: mockContact.address }
      );
    });

    it('returns null when address not found', async () => {
      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        mockSendMessage.mockResolvedValue({ contact: null });
        contact = await result.current.getContactByAddress('tb1qnonexistent');
      });

      expect(contact).toBeNull();
    });

    it('does not set error state on failure (used for lookups)', async () => {
      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        mockSendMessage.mockRejectedValue(new Error('Not found'));
        contact = await result.current.getContactByAddress('tb1qtest');
      });

      expect(contact).toBeNull();
      // Should not set error - this is used for lookups during send
      expect(result.current.error).toBeNull();
    });
  });

  /**
   * Test: searchContacts
   */
  describe('searchContacts', () => {
    it('searches contacts', async () => {
      const searchResults = [mockContact];
      mockSendMessage.mockResolvedValue({ contacts: searchResults });

      const { result } = renderHook(() => useContacts());

      let results: Contact[] = [];
      await act(async () => {
        results = await result.current.searchContacts('Alice');
      });

      expect(results).toEqual(searchResults);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.SEARCH_CONTACTS,
        { query: 'Alice' }
      );
    });

    it('returns empty array on error', async () => {
      mockSendMessage.mockRejectedValue(new Error('Search failed'));

      const { result } = renderHook(() => useContacts());

      let results: Contact[] = [];
      await act(async () => {
        results = await result.current.searchContacts('test');
      });

      expect(results).toEqual([]);
      expect(result.current.error).toBe('Search failed');
    });
  });

  /**
   * Test: addContact
   */
  describe('addContact', () => {
    it('adds new contact', async () => {
      const newContact = {
        name: 'Bob',
        address: 'tb1qbob',
        xpub: undefined,
        email: 'bob@example.com',
        notes: 'New contact',
        category: 'business' as const,
        color: 'green' as const
      };

      const createdContact: Contact = {
        ...newContact,
        id: 'new-id',
        addressType: 'native-segwit',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockSendMessage.mockResolvedValue({ contact: createdContact });

      const { result } = renderHook(() => useContacts());

      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.addContact(newContact);
      });

      expect(contact).toEqual(createdContact);
      expect(result.current.contacts).toContain(createdContact);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.ADD_CONTACT,
        expect.objectContaining({
          name: 'Bob',
          address: 'tb1qbob'
        })
      );
    });

    it('sets loading state during add', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ contact: mockContact }), 100);
      }));

      const { result } = renderHook(() => useContacts());

      const addPromise = result.current.addContact({
        name: 'Test',
        address: 'tb1qtest',
        xpub: undefined,
        email: undefined,
        notes: undefined,
        category: undefined,
        color: 'blue'
      });

      // Check loading state immediately (synchronously after calling addContact)
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await addPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles add errors', async () => {
      const errorMessage = 'Duplicate address';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await expect(
          result.current.addContact({
            name: 'Test',
            address: 'tb1qduplicate',
            xpub: undefined,
            email: undefined,
            notes: undefined,
            category: undefined,
            color: 'blue'
          })
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.contacts).toEqual([]);
    });
  });

  /**
   * Test: updateContact
   */
  describe('updateContact', () => {
    it('updates existing contact', async () => {
      const updatedContact = {
        ...mockContact,
        name: 'Alice Updated',
        updatedAt: Date.now()
      };

      mockSendMessage.mockResolvedValue({ contact: updatedContact });

      const { result } = renderHook(() => useContacts());

      // Add initial contact to state
      await act(async () => {
        mockSendMessage.mockResolvedValueOnce({ contact: mockContact });
        await result.current.addContact({
          name: mockContact.name,
          address: mockContact.address,
          xpub: undefined,
          email: mockContact.email,
          notes: mockContact.notes,
          category: mockContact.category,
          color: mockContact.color
        });
      });

      // Update contact
      let contact: Contact | null = null;
      await act(async () => {
        contact = await result.current.updateContact(mockContact.id, {
          name: 'Alice Updated'
        });
      });

      expect(contact).toEqual(updatedContact);
      expect(result.current.contacts[0].name).toBe('Alice Updated');
      expect(mockSendMessage).toHaveBeenLastCalledWith(
        MessageType.UPDATE_CONTACT,
        {
          id: mockContact.id,
          updates: { name: 'Alice Updated' }
        }
      );
    });

    it('sets loading state during update', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ contact: mockContact }), 100);
      }));

      const { result } = renderHook(() => useContacts());

      const updatePromise = result.current.updateContact('test-id', { name: 'Updated' });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await updatePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles update errors', async () => {
      const errorMessage = 'Contact not found';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await expect(
          result.current.updateContact('nonexistent', { name: 'Test' })
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  /**
   * Test: deleteContact
   */
  describe('deleteContact', () => {
    it('deletes contact', async () => {
      mockSendMessage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useContacts());

      // Add contact first
      await act(async () => {
        mockSendMessage.mockResolvedValueOnce({ contact: mockContact });
        await result.current.addContact({
          name: mockContact.name,
          address: mockContact.address,
          xpub: undefined,
          email: mockContact.email,
          notes: mockContact.notes,
          category: mockContact.category,
          color: mockContact.color
        });
      });

      expect(result.current.contacts).toHaveLength(1);

      // Delete contact
      let success = false;
      await act(async () => {
        success = await result.current.deleteContact(mockContact.id);
      });

      expect(success).toBe(true);
      expect(result.current.contacts).toHaveLength(0);
      expect(mockSendMessage).toHaveBeenLastCalledWith(
        MessageType.DELETE_CONTACT,
        { id: mockContact.id }
      );
    });

    it('does not remove from state if delete fails', async () => {
      mockSendMessage.mockResolvedValue({ success: false });

      const { result } = renderHook(() => useContacts());

      // Add contact first
      await act(async () => {
        mockSendMessage.mockResolvedValueOnce({ contact: mockContact });
        await result.current.addContact({
          name: mockContact.name,
          address: mockContact.address,
          xpub: undefined,
          email: mockContact.email,
          notes: mockContact.notes,
          category: mockContact.category,
          color: mockContact.color
        });
      });

      expect(result.current.contacts).toHaveLength(1);

      // Try to delete
      let success = false;
      await act(async () => {
        success = await result.current.deleteContact(mockContact.id);
      });

      expect(success).toBe(false);
      expect(result.current.contacts).toHaveLength(1);
    });

    it('sets loading state during delete', async () => {
      mockSendMessage.mockImplementation(() => new Promise(resolve => {
        setTimeout(() => resolve({ success: true }), 100);
      }));

      const { result } = renderHook(() => useContacts());

      const deletePromise = result.current.deleteContact('test-id');

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        await deletePromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles delete errors', async () => {
      const errorMessage = 'Delete failed';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await expect(
          result.current.deleteContact('test-id')
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  /**
   * Test: exportContactsCSV
   */
  describe('exportContactsCSV', () => {
    it('exports contacts as CSV', async () => {
      const csvData = 'name,address,email\nAlice,tb1qtest,alice@example.com';
      const filename = 'contacts_2024-01-15.csv';

      mockSendMessage.mockResolvedValue({ csvData, filename });

      const { result } = renderHook(() => useContacts());

      let exportResult: any;
      await act(async () => {
        exportResult = await result.current.exportContactsCSV();
      });

      expect(exportResult.csvData).toBe(csvData);
      expect(exportResult.filename).toBe(filename);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.EXPORT_CONTACTS_CSV,
        {}
      );
    });

    it('handles export errors', async () => {
      const errorMessage = 'Export failed';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await expect(
          result.current.exportContactsCSV()
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  /**
   * Test: importContactsCSV
   */
  describe('importContactsCSV', () => {
    it('imports contacts from CSV', async () => {
      const csvData = 'name,address,email\nBob,tb1qbob,bob@example.com';
      const importResult = {
        imported: 1,
        skipped: 0,
        errors: []
      };

      mockSendMessage.mockResolvedValue({ result: importResult });

      const { result } = renderHook(() => useContacts());

      let importRes: any;
      await act(async () => {
        importRes = await result.current.importContactsCSV(csvData);
      });

      expect(importRes).toEqual(importResult);
      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.IMPORT_CONTACTS_CSV,
        { csvData, options: undefined }
      );
    });

    it('supports import options', async () => {
      const csvData = 'name,address\nTest,tb1qtest';
      const options = { skipDuplicates: true };
      const importResult = { imported: 1, skipped: 0, errors: [] };

      mockSendMessage.mockResolvedValue({ result: importResult });

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await result.current.importContactsCSV(csvData, options);
      });

      expect(mockSendMessage).toHaveBeenCalledWith(
        MessageType.IMPORT_CONTACTS_CSV,
        { csvData, options }
      );
    });

    it('handles import errors', async () => {
      const errorMessage = 'Invalid CSV format';
      mockSendMessage.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useContacts());

      await act(async () => {
        await expect(
          result.current.importContactsCSV('invalid csv')
        ).rejects.toThrow(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });
  });

  /**
   * Test: clearError
   */
  describe('clearError', () => {
    it('clears error state', async () => {
      mockSendMessage.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useContacts());

      // Generate error
      await act(async () => {
        await result.current.getContacts();
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  /**
   * Test: Multiple contacts in state
   */
  describe('Multiple contacts management', () => {
    it('maintains multiple contacts in state', async () => {
      const { result } = renderHook(() => useContacts());

      const contact1: Contact = { ...mockContact, id: 'id1', name: 'Alice' };
      const contact2: Contact = { ...mockContact, id: 'id2', name: 'Bob' };
      const contact3: Contact = { ...mockContact, id: 'id3', name: 'Charlie' };

      // Add multiple contacts
      mockSendMessage.mockResolvedValueOnce({ contact: contact1 });
      await act(async () => {
        await result.current.addContact({
          name: 'Alice',
          address: 'tb1q1',
          xpub: undefined,
          email: undefined,
          notes: undefined,
          category: undefined,
          color: 'blue'
        });
      });

      mockSendMessage.mockResolvedValueOnce({ contact: contact2 });
      await act(async () => {
        await result.current.addContact({
          name: 'Bob',
          address: 'tb1q2',
          xpub: undefined,
          email: undefined,
          notes: undefined,
          category: undefined,
          color: 'green'
        });
      });

      mockSendMessage.mockResolvedValueOnce({ contact: contact3 });
      await act(async () => {
        await result.current.addContact({
          name: 'Charlie',
          address: 'tb1q3',
          xpub: undefined,
          email: undefined,
          notes: undefined,
          category: undefined,
          color: 'red'
        });
      });

      expect(result.current.contacts).toHaveLength(3);
      expect(result.current.contacts.map(c => c.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });
  });
});
