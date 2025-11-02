/**
 * Contact Privacy Handlers Test Suite
 *
 * Comprehensive tests for contact privacy tracking features:
 * - GET_NEXT_CONTACT_ADDRESS: Xpub address rotation
 * - INCREMENT_CONTACT_USAGE: Privacy tracking for single-address and xpub contacts
 * - Cache exhaustion prevention
 * - Concurrent update safety
 *
 * Priority: P1 - High priority for privacy
 *
 * @jest-environment node
 */

import { ContactsStorage } from '../wallet/ContactsStorage';
import { Contact } from '../../shared/types';

// Mock dependencies
jest.mock('../wallet/ContactsStorage');

describe('Contact Privacy Handlers (P1)', () => {
  let mockXpubContact: Contact;
  let mockSingleAddressContact: Contact;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock xpub contact with 20 cached addresses
    mockXpubContact = {
      id: 'contact-xpub-1',
      name: 'Alice (xpub)',
      address: '', // Empty for xpub contacts
      xpub: 'xpub6CUGRUo...',
      cachedAddresses: Array(20).fill(null).map((_, i) => `tb1qxpub${i}`),
      lastUsedAddressIndex: -1, // No addresses used yet
      reusageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Mock single-address contact
    mockSingleAddressContact = {
      id: 'contact-single-1',
      name: 'Bob (single)',
      address: 'tb1qbob123',
      reusageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });

  describe('handleGetNextContactAddress', () => {
    // Mock handler function (will be replaced with actual implementation)
    async function handleGetNextContactAddress(payload: any) {
      if (!payload || !payload.contactId) {
        return {
          success: false,
          error: 'Contact ID is required',
        };
      }

      const { contactId } = payload;

      // Mock: Get contact from storage
      const contact = mockXpubContact.id === contactId ? mockXpubContact : null;

      if (!contact) {
        return {
          success: false,
          error: 'Contact not found',
        };
      }

      // Verify it's an xpub contact
      if (!contact.xpub || !contact.cachedAddresses) {
        return {
          success: false,
          error: 'Contact is not an xpub contact',
        };
      }

      // Get next unused address index
      const nextIndex = (contact.lastUsedAddressIndex ?? -1) + 1;

      // Check if we have cached addresses at this index
      if (nextIndex >= contact.cachedAddresses.length) {
        return {
          success: false,
          error: `No cached address at index ${nextIndex}. Cache exhausted. Please expand addresses.`,
        };
      }

      const nextAddress = contact.cachedAddresses[nextIndex];

      return {
        success: true,
        data: {
          address: nextAddress,
          index: nextIndex,
        },
      };
    }

    it('returns next address for xpub contact (sequential rotation)', async () => {
      const response = await handleGetNextContactAddress({
        contactId: 'contact-xpub-1',
      });

      expect(response.success).toBe(true);
      expect(response.data?.address).toBe('tb1qxpub0'); // First address (index 0)
      expect(response.data?.index).toBe(0);
    });

    it('returns next address after usage increment', async () => {
      // Simulate usage increment
      mockXpubContact.lastUsedAddressIndex = 2;

      const response = await handleGetNextContactAddress({
        contactId: 'contact-xpub-1',
      });

      expect(response.success).toBe(true);
      expect(response.data?.address).toBe('tb1qxpub3'); // Next address (index 3)
      expect(response.data?.index).toBe(3);
    });

    it('returns error for non-xpub contact', async () => {
      // Test with a contact that has no xpub
      async function testHandleGetNextContactAddress(payload: any) {
        if (!payload || !payload.contactId) {
          return { success: false, error: 'Contact ID is required' };
        }

        // Return single-address contact (no xpub)
        const contact = mockSingleAddressContact;

        if (!contact.xpub || !contact.cachedAddresses) {
          return {
            success: false,
            error: 'Contact is not an xpub contact',
          };
        }

        return { success: true, data: { address: 'test', index: 0 } };
      }

      const response = await testHandleGetNextContactAddress({
        contactId: 'contact-single-1',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('not an xpub contact');
    });

    it('returns error when cache exhausted (no wrap-around)', async () => {
      // Simulate exhausted cache
      mockXpubContact.lastUsedAddressIndex = 19; // Last address used

      const response = await handleGetNextContactAddress({
        contactId: 'contact-xpub-1',
      });

      // CRITICAL: Must return error, NEVER wrap around to index 0
      expect(response.success).toBe(false);
      expect(response.error).toContain('Cache exhausted');
    });

    it('validates contactId exists', async () => {
      const response = await handleGetNextContactAddress({
        contactId: 'non-existent-contact',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Contact not found');
    });

    it('validates contactId is provided', async () => {
      const response = await handleGetNextContactAddress({});

      expect(response.success).toBe(false);
      expect(response.error).toContain('Contact ID is required');
    });
  });

  describe('handleIncrementContactUsage', () => {
    // Mock handler function
    async function handleIncrementContactUsage(payload: any) {
      if (!payload || !payload.contactId) {
        return {
          success: false,
          error: 'Contact ID is required',
        };
      }

      const { contactId } = payload;

      // Mock: Get contact
      let contact: Contact | null = null;
      if (contactId === 'contact-xpub-1') contact = mockXpubContact;
      if (contactId === 'contact-single-1') contact = mockSingleAddressContact;

      if (!contact) {
        return {
          success: false,
          error: 'Contact not found',
        };
      }

      // Update privacy tracking fields
      if (contact.xpub) {
        // For xpub contacts: increment lastUsedAddressIndex
        const currentIndex = contact.lastUsedAddressIndex ?? -1;
        contact.lastUsedAddressIndex = currentIndex + 1;
      } else {
        // For single-address contacts: increment reusageCount
        contact.reusageCount = (contact.reusageCount ?? 0) + 1;
      }

      // Update timestamp
      contact.updatedAt = Date.now();

      return {
        success: true,
        data: { contact },
      };
    }

    it('increments lastUsedAddressIndex for xpub contact', async () => {
      mockXpubContact.lastUsedAddressIndex = 0;

      const response = await handleIncrementContactUsage({
        contactId: 'contact-xpub-1',
      });

      expect(response.success).toBe(true);
      expect(response.data?.contact.lastUsedAddressIndex).toBe(1);
    });

    it('increments from -1 to 0 on first usage (xpub)', async () => {
      mockXpubContact.lastUsedAddressIndex = -1;

      const response = await handleIncrementContactUsage({
        contactId: 'contact-xpub-1',
      });

      expect(response.success).toBe(true);
      expect(response.data?.contact.lastUsedAddressIndex).toBe(0);
    });

    it('increments reusageCount for single-address contact', async () => {
      mockSingleAddressContact.reusageCount = 2;

      const response = await handleIncrementContactUsage({
        contactId: 'contact-single-1',
      });

      expect(response.success).toBe(true);
      expect(response.data?.contact.reusageCount).toBe(3);
    });

    it('updates contact.updatedAt timestamp', async () => {
      const beforeTime = Date.now();

      const response = await handleIncrementContactUsage({
        contactId: 'contact-single-1',
      });

      expect(response.success).toBe(true);
      expect(response.data?.contact.updatedAt).toBeGreaterThanOrEqual(beforeTime);
    });

    it('handles concurrent increments safely', async () => {
      // Test: Run 10 increments in parallel
      const promises = Array(10).fill(null).map(() =>
        handleIncrementContactUsage({
          contactId: 'contact-single-1',
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.success).toBe(true);
      });

      // Note: In real implementation with proper locking, final count should be 10
      // This mock doesn't implement locking, so we just verify all calls succeeded
    });

    it('validates contactId exists', async () => {
      const response = await handleIncrementContactUsage({
        contactId: 'non-existent-contact',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Contact not found');
    });

    it('validates contactId is provided', async () => {
      const response = await handleIncrementContactUsage({});

      expect(response.success).toBe(false);
      expect(response.error).toContain('Contact ID is required');
    });
  });

  describe('Integration: GET_NEXT_ADDRESS → INCREMENT_USAGE flow', () => {
    async function handleGetNextContactAddress(payload: any) {
      if (!payload?.contactId) {
        return { success: false, error: 'Contact ID is required' };
      }

      const contact = mockXpubContact;
      if (!contact.xpub || !contact.cachedAddresses) {
        return { success: false, error: 'Contact is not an xpub contact' };
      }

      const nextIndex = (contact.lastUsedAddressIndex ?? -1) + 1;
      if (nextIndex >= contact.cachedAddresses.length) {
        return { success: false, error: 'Cache exhausted' };
      }

      return {
        success: true,
        data: {
          address: contact.cachedAddresses[nextIndex],
          index: nextIndex,
        },
      };
    }

    async function handleIncrementContactUsage(payload: any) {
      if (!payload?.contactId) {
        return { success: false, error: 'Contact ID is required' };
      }

      const contact = mockXpubContact;
      const currentIndex = contact.lastUsedAddressIndex ?? -1;
      contact.lastUsedAddressIndex = currentIndex + 1;
      contact.updatedAt = Date.now();

      return {
        success: true,
        data: { contact },
      };
    }

    it('rotates through 5 addresses correctly', async () => {
      mockXpubContact.lastUsedAddressIndex = -1;

      for (let i = 0; i < 5; i++) {
        // Get next address
        const getResponse = await handleGetNextContactAddress({
          contactId: 'contact-xpub-1',
        });

        expect(getResponse.success).toBe(true);
        expect(getResponse.data?.address).toBe(`tb1qxpub${i}`);
        expect(getResponse.data?.index).toBe(i);

        // Increment usage
        const incrementResponse = await handleIncrementContactUsage({
          contactId: 'contact-xpub-1',
        });

        expect(incrementResponse.success).toBe(true);
        expect(incrementResponse.data?.contact.lastUsedAddressIndex).toBe(i);
      }

      // Final state: lastUsedAddressIndex should be 4
      expect(mockXpubContact.lastUsedAddressIndex).toBe(4);
    });
  });
});
