/**
 * ContactsStorage Test Suite
 *
 * Comprehensive tests for contact storage operations:
 * - CRUD operations (Create, Read, Update, Delete)
 * - V2 encryption integration
 * - V1→V2 migration with backup/rollback
 * - Address expansion (20→100)
 * - CSV import/export
 * - Search and filtering
 * - Xpub address derivation integration
 * - Chrome storage integration
 * - Error handling and validation
 *
 * Data integrity critical - requires high coverage
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { ContactsStorage } from '../ContactsStorage';
import { WalletStorage } from '../WalletStorage';
import type { Contact, ContactV1, ContactsDataV1, ContactsDataV2, ContactColor } from '../../../shared/types';
import { TEST_PASSWORD_STRONG, TEST_MNEMONIC_12 } from '../../../__tests__/utils/testConstants';
import { storageMock } from '../../../__tests__/__mocks__/chrome';

// Ensure crypto.subtle is available
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

// Test constants
const TEST_PASSWORD = TEST_PASSWORD_STRONG;
const TEST_SALT = 'dGVzdHNhbHQxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=';

// Test xpubs
const VALID_TESTNET_TPUB =
  'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp';

// Helper to set storage data
async function setStorageData(key: string, value: any) {
  await storageMock.set({ [key]: value });
}

// Helper to get storage data
async function getStorageData(key: string): Promise<any> {
  const data = await storageMock.get(key);
  return data[key];
}

// Helper to create test contact data
function createContactData(overrides: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    addressType: 'native-segwit',
    notes: 'Test contact',
    category: 'Friends',
    color: 'blue' as ContactColor,
    ...overrides,
  };
}

// Helper to initialize wallet with salt
async function initializeWallet() {
  await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
  const wallet = await WalletStorage.getWallet();
  return wallet;
}

describe('ContactsStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (global as any).__restoreOriginalCrypto();

    // Initialize wallet for tests that need it
    await initializeWallet();
  });

  describe('hasContacts', () => {
    it('should return false when no contacts exist', async () => {
      const result = await ContactsStorage.hasContacts();
      expect(result).toBe(false);
    });

    it('should return true when contacts exist', async () => {
      await setStorageData('contacts', { version: 2, contacts: [], salt: TEST_SALT });
      const result = await ContactsStorage.hasContacts();
      expect(result).toBe(true);
    });
  });

  describe('getVersion', () => {
    it('should return current version (2) when no contacts exist', async () => {
      const version = await ContactsStorage.getVersion();
      expect(version).toBe(2);
    });

    it('should return version 1 for v1 contacts', async () => {
      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: [],
      };
      await setStorageData('contacts', v1Data);

      const version = await ContactsStorage.getVersion();
      expect(version).toBe(1);
    });

    it('should return version 2 for v2 contacts', async () => {
      const v2Data: ContactsDataV2 = {
        version: 2,
        contacts: [],
        salt: TEST_SALT,
      };
      await setStorageData('contacts', v2Data);

      const version = await ContactsStorage.getVersion();
      expect(version).toBe(2);
    });
  });

  describe('needsMigration', () => {
    it('should return false when no contacts exist (defaults to v2)', async () => {
      const needs = await ContactsStorage.needsMigration();
      expect(needs).toBe(false);
    });

    it('should return true for v1 contacts', async () => {
      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: [],
      };
      await setStorageData('contacts', v1Data);

      const needs = await ContactsStorage.needsMigration();
      expect(needs).toBe(true);
    });

    it('should return false for v2 contacts', async () => {
      const v2Data: ContactsDataV2 = {
        version: 2,
        contacts: [],
        salt: TEST_SALT,
      };
      await setStorageData('contacts', v2Data);

      const needs = await ContactsStorage.needsMigration();
      expect(needs).toBe(false);
    });
  });

  describe('addContact', () => {
    it('should add contact with single address', async () => {
      const contactData = createContactData({ name: 'Bob' });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      expect(contact.id).toBeDefined();
      expect(contact.name).toBe('Bob');
      expect(contact.email).toBe(contactData.email);
      expect(contact.address).toBe(contactData.address);
      expect(contact.createdAt).toBeDefined();
      expect(contact.updatedAt).toBeDefined();
    });

    it('should add contact with xpub and derive initial addresses', async () => {
      const contactData = createContactData({
        address: undefined,
        addressType: undefined,
        xpub: VALID_TESTNET_TPUB,
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      expect(contact.xpub).toBe(VALID_TESTNET_TPUB);
      expect(contact.xpubFingerprint).toBeDefined();
      expect(contact.xpubFingerprint?.length).toBe(8);
      expect(contact.xpubDerivationPath).toBeDefined();
      expect(contact.cachedAddresses).toBeDefined();
      expect(contact.cachedAddresses?.length).toBe(20); // 10 external + 10 internal
      expect(contact.addressesLastUpdated).toBeDefined();
    });

    it('should encrypt contact in v2 storage', async () => {
      const contactData = createContactData();
      await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      const stored = await getStorageData('contacts');
      expect(stored.version).toBe(2);
      expect(stored.contacts.length).toBe(1);
      expect(stored.contacts[0].encryptedData).toBeDefined();
      expect(stored.contacts[0].iv).toBeDefined();

      // Name should be encrypted (not in plaintext)
      const encryptedContact = stored.contacts[0];
      expect(encryptedContact.name).toBeUndefined();
    });

    it('should validate required fields', async () => {
      await expect(
        ContactsStorage.addContact({ name: '' } as any, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/name is required/);
    });

    it('should require at least one address method (address or xpub)', async () => {
      const contactData = createContactData({ address: undefined });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Either address or xpub is required/);
    });

    it('should validate Bitcoin address format', async () => {
      const contactData = createContactData({ address: 'invalid_address' });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Invalid Bitcoin address/);
    });

    it('should validate xpub format', async () => {
      const contactData = createContactData({
        address: undefined,
        xpub: 'invalid_xpub',
      });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Unsupported xpub format/);
    });

    it('should validate email format', async () => {
      const contactData = createContactData({ email: 'invalid-email' });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Invalid email/);
    });

    it('should enforce maximum contact limit (1000)', async () => {
      // Create a nearly-full contacts data
      const contacts = Array.from({ length: 1000 }, (_, i) => ({
        id: `contact-${i}`,
        encryptedData: 'encrypted',
        iv: 'iv',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      await setStorageData('contacts', {
        version: 2,
        contacts,
        salt: TEST_SALT,
      });

      const contactData = createContactData();

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Contact limit reached/);
    });
  });

  describe('getContacts', () => {
    it('should return empty array when no contacts exist', async () => {
      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      expect(contacts).toEqual([]);
    });

    it('should decrypt and return all contacts', async () => {
      await ContactsStorage.addContact(createContactData({ name: 'Alice' }), TEST_PASSWORD, 'testnet');
      await ContactsStorage.addContact(createContactData({ name: 'Bob' }), TEST_PASSWORD, 'testnet');

      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);

      expect(contacts).toHaveLength(2);
      expect(contacts[0].name).toBe('Alice');
      expect(contacts[1].name).toBe('Bob');
    });

    it('should sort by name by default', async () => {
      await ContactsStorage.addContact(createContactData({ name: 'Zoe' }), TEST_PASSWORD, 'testnet');
      await ContactsStorage.addContact(createContactData({ name: 'Alice' }), TEST_PASSWORD, 'testnet');
      await ContactsStorage.addContact(createContactData({ name: 'Bob' }), TEST_PASSWORD, 'testnet');

      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD, 'name');

      expect(contacts[0].name).toBe('Alice');
      expect(contacts[1].name).toBe('Bob');
      expect(contacts[2].name).toBe('Zoe');
    });

    it('should sort by date', async () => {
      await ContactsStorage.addContact(createContactData({ name: 'Alice' }), TEST_PASSWORD, 'testnet');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await ContactsStorage.addContact(createContactData({ name: 'Bob' }), TEST_PASSWORD, 'testnet');

      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD, 'date');

      // Most recent first
      expect(contacts[0].name).toBe('Bob');
      expect(contacts[1].name).toBe('Alice');
    });

    it('should require password for v2 contacts', async () => {
      await ContactsStorage.addContact(createContactData(), TEST_PASSWORD, 'testnet');

      await expect(
        ContactsStorage.getContacts()
      ).rejects.toThrow(/Password required/);
    });
  });

  describe('getContactById', () => {
    it('should get contact by ID', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({ name: 'Alice' }),
        TEST_PASSWORD,
        'testnet'
      );

      const retrieved = await ContactsStorage.getContactById(added.id, TEST_PASSWORD);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(added.id);
      expect(retrieved?.name).toBe('Alice');
    });

    it('should return null for non-existent ID', async () => {
      const retrieved = await ContactsStorage.getContactById('nonexistent', TEST_PASSWORD);
      expect(retrieved).toBeNull();
    });
  });

  describe('getContactByAddress', () => {
    it('should get contact by single address', async () => {
      // Use a valid testnet bech32 address (different from default)
      const testAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      const contactData = createContactData({
        address: testAddress,
      });
      await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      const retrieved = await ContactsStorage.getContactByAddress(
        testAddress,
        TEST_PASSWORD
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.address).toBe(testAddress);
    });

    it('should get contact by cached xpub address', async () => {
      const contactData = createContactData({
        address: undefined,
        addressType: undefined,
        xpub: VALID_TESTNET_TPUB,
      });
      const added = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      // Get one of the cached addresses
      const cachedAddress = added.cachedAddresses![0];

      const retrieved = await ContactsStorage.getContactByAddress(
        cachedAddress,
        TEST_PASSWORD
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.xpub).toBe(VALID_TESTNET_TPUB);
    });

    it('should return null for non-existent address', async () => {
      const retrieved = await ContactsStorage.getContactByAddress(
        'tb1qnonexistent',
        TEST_PASSWORD
      );
      expect(retrieved).toBeNull();
    });
  });

  describe('searchContacts', () => {
    beforeEach(async () => {
      await ContactsStorage.addContact(
        createContactData({ name: 'Alice Johnson', email: 'alice@example.com' }),
        TEST_PASSWORD,
        'testnet'
      );
      await ContactsStorage.addContact(
        createContactData({ name: 'Bob Smith', email: 'bob@company.com', category: 'Work' }),
        TEST_PASSWORD,
        'testnet'
      );
    });

    it('should search by name', async () => {
      const results = await ContactsStorage.searchContacts('Alice', TEST_PASSWORD);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('should search by email', async () => {
      const results = await ContactsStorage.searchContacts('company.com', TEST_PASSWORD);
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('bob@company.com');
    });

    it('should search by category', async () => {
      const results = await ContactsStorage.searchContacts('Work', TEST_PASSWORD);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBe('Work');
    });

    it('should be case-insensitive', async () => {
      const results = await ContactsStorage.searchContacts('ALICE', TEST_PASSWORD);
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('Alice Johnson');
    });

    it('should return empty array for empty query', async () => {
      const results = await ContactsStorage.searchContacts('', TEST_PASSWORD);
      expect(results).toEqual([]);
    });

    it('should return empty array for no matches', async () => {
      const results = await ContactsStorage.searchContacts('XYZ123', TEST_PASSWORD);
      expect(results).toEqual([]);
    });
  });

  describe('updateContact', () => {
    it('should update contact fields', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({ name: 'Alice', email: 'old@example.com' }),
        TEST_PASSWORD,
        'testnet'
      );

      const updated = await ContactsStorage.updateContact(
        added.id,
        { name: 'Alice Updated', email: 'new@example.com' },
        TEST_PASSWORD,
        'testnet'
      );

      expect(updated.name).toBe('Alice Updated');
      expect(updated.email).toBe('new@example.com');
      expect(updated.updatedAt).toBeGreaterThan(added.updatedAt);
    });

    it('should preserve createdAt timestamp', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({ name: 'Alice' }),
        TEST_PASSWORD,
        'testnet'
      );

      const updated = await ContactsStorage.updateContact(
        added.id,
        { name: 'Alice Updated' },
        TEST_PASSWORD,
        'testnet'
      );

      expect(updated.createdAt).toBe(added.createdAt);
    });

    it('should update xpub and re-derive addresses', async () => {
      // Use a valid testnet address
      const testAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      const added = await ContactsStorage.addContact(
        createContactData({ address: testAddress }),
        TEST_PASSWORD,
        'testnet'
      );

      const updated = await ContactsStorage.updateContact(
        added.id,
        { xpub: VALID_TESTNET_TPUB, address: undefined },
        TEST_PASSWORD,
        'testnet'
      );

      expect(updated.xpub).toBe(VALID_TESTNET_TPUB);
      expect(updated.cachedAddresses).toBeDefined();
      expect(updated.cachedAddresses?.length).toBe(20);
    });

    it('should throw error for non-existent contact', async () => {
      await expect(
        ContactsStorage.updateContact(
          'nonexistent',
          { name: 'Test' },
          TEST_PASSWORD,
          'testnet'
        )
      ).rejects.toThrow(/not found/);
    });

    it('should validate updated data', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({ name: 'Alice' }),
        TEST_PASSWORD,
        'testnet'
      );

      await expect(
        ContactsStorage.updateContact(
          added.id,
          { email: 'invalid-email' },
          TEST_PASSWORD,
          'testnet'
        )
      ).rejects.toThrow(/Invalid email/);
    });
  });

  describe('deleteContact', () => {
    it('should delete contact by ID', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({ name: 'Alice' }),
        TEST_PASSWORD,
        'testnet'
      );

      await ContactsStorage.deleteContact(added.id);

      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      expect(contacts).toHaveLength(0);
    });

    it('should throw error for non-existent contact', async () => {
      await expect(
        ContactsStorage.deleteContact('nonexistent')
      ).rejects.toThrow(/not found/);
    });
  });

  describe('expandContactAddresses', () => {
    it('should expand addresses from 20 to 40', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({
          address: undefined,
          addressType: undefined,
          xpub: VALID_TESTNET_TPUB,
        }),
        TEST_PASSWORD,
        'testnet'
      );

      expect(added.cachedAddresses).toHaveLength(20);

      const expanded = await ContactsStorage.expandContactAddresses(
        added.id,
        TEST_PASSWORD,
        'testnet',
        20 // Gap limit 20 = 40 total addresses
      );

      expect(expanded.cachedAddresses).toHaveLength(40);
    });

    it('should expand to maximum (100 addresses)', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({
          address: undefined,
          addressType: undefined,
          xpub: VALID_TESTNET_TPUB,
        }),
        TEST_PASSWORD,
        'testnet'
      );

      const expanded = await ContactsStorage.expandContactAddresses(
        added.id,
        TEST_PASSWORD,
        'testnet',
        50 // Gap limit 50 = 100 total addresses
      );

      expect(expanded.cachedAddresses).toHaveLength(100);
    });

    it('should throw error for contact without xpub', async () => {
      // Use a valid testnet address
      const testAddress = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
      const added = await ContactsStorage.addContact(
        createContactData({ address: testAddress }),
        TEST_PASSWORD,
        'testnet'
      );

      await expect(
        ContactsStorage.expandContactAddresses(added.id, TEST_PASSWORD, 'testnet', 50)
      ).rejects.toThrow(/does not have an xpub/);
    });

    it('should update addressesLastUpdated timestamp', async () => {
      const added = await ContactsStorage.addContact(
        createContactData({
          address: undefined,
          addressType: undefined,
          xpub: VALID_TESTNET_TPUB,
        }),
        TEST_PASSWORD,
        'testnet'
      );

      const originalTimestamp = added.addressesLastUpdated!;
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay

      const expanded = await ContactsStorage.expandContactAddresses(
        added.id,
        TEST_PASSWORD,
        'testnet',
        20
      );

      expect(expanded.addressesLastUpdated).toBeGreaterThan(originalTimestamp);
    });
  });

  describe('exportToCSV', () => {
    it('should export contacts to CSV format', async () => {
      await ContactsStorage.addContact(
        createContactData({ name: 'Alice', email: 'alice@example.com' }),
        TEST_PASSWORD,
        'testnet'
      );
      await ContactsStorage.addContact(
        createContactData({ name: 'Bob', email: 'bob@example.com' }),
        TEST_PASSWORD,
        'testnet'
      );

      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);

      expect(csv).toContain('Name,Address,Email');
      expect(csv).toContain('Alice');
      expect(csv).toContain('Bob');
      expect(csv).toContain('alice@example.com');
      expect(csv).toContain('bob@example.com');
    });

    it('should escape CSV special characters', async () => {
      await ContactsStorage.addContact(
        createContactData({ name: 'Name, with comma', notes: 'Notes with "quotes"' }),
        TEST_PASSWORD,
        'testnet'
      );

      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);

      expect(csv).toContain('"Name, with comma"');
      expect(csv).toContain('"Notes with ""quotes"""');
    });

    it('should export contacts with tags to CSV', async () => {
      const tags = {
        company: 'Acme Corp',
        role: 'manager',
      };

      await ContactsStorage.addContact(
        createContactData({ name: 'Alice with tags', tags }),
        TEST_PASSWORD,
        'testnet'
      );

      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);

      // CSV should include Tags column header
      expect(csv).toContain('Tags');

      // Tags should be serialized as JSON
      expect(csv).toContain('company');
      expect(csv).toContain('Acme Corp');
      expect(csv).toContain('role');
      expect(csv).toContain('manager');
    });

    it('should export contacts without tags (empty tags field)', async () => {
      await ContactsStorage.addContact(
        createContactData({ name: 'Bob without tags' }),
        TEST_PASSWORD,
        'testnet'
      );

      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);

      // CSV should include Tags column header
      expect(csv).toContain('Tags');

      // Verify row structure (should have 8 columns)
      const lines = csv.split('\n');
      expect(lines[0].split(',').length).toBe(8); // Header has 8 columns
    });

    it('should handle tags with special characters in CSV export', async () => {
      const tags = {
        website: 'https://example.com',
        'contact-email': 'test@company.co.uk',
      };

      await ContactsStorage.addContact(
        createContactData({ name: 'Charlie special chars', tags }),
        TEST_PASSWORD,
        'testnet'
      );

      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);

      // Tags should be in CSV (JSON will handle special chars)
      expect(csv).toContain('website');
      expect(csv).toContain('https://example.com');
      expect(csv).toContain('contact-email');
    });
  });

  describe('importFromCSV', () => {
    it('should import contacts with tags from CSV', async () => {
      // Tags are Base64-encoded to avoid CSV parsing issues with commas/quotes in JSON
      const tagsJson = JSON.stringify({ company: 'Acme Corp', role: 'manager' });
      const tagsBase64 = Buffer.from(tagsJson, 'utf-8').toString('base64');

      const csvContent = `Name,Address,Email,Category,Notes,Color,Xpub Fingerprint,Tags
Alice,tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx,alice@example.com,Business,Test note,blue,,${tagsBase64}`;

      const result = await ContactsStorage.importFromCSV(
        csvContent,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);

      // Verify tags were imported correctly
      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      const alice = contacts.find(c => c.name === 'Alice');
      expect(alice).toBeDefined();
      expect(alice?.tags).toEqual({
        company: 'Acme Corp',
        role: 'manager',
      });
    });

    it('should import contacts without tags from CSV (backward compatibility)', async () => {
      const csvContent = `Name,Address,Email,Category,Notes,Color,Xpub Fingerprint
Bob,tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7,bob@example.com,Personal,Friend,green,`;

      const result = await ContactsStorage.importFromCSV(
        csvContent,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);

      // Verify contact was imported without tags
      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      const bob = contacts.find(c => c.name === 'Bob');
      expect(bob).toBeDefined();
      expect(bob?.tags).toBeUndefined();
    });

    it('should handle empty tags column gracefully', async () => {
      const csvContent = `Name,Address,Email,Category,Notes,Color,Xpub Fingerprint,Tags
Charlie,tb1q8c6fshw2dlwun7ekn9qwf37cu2rn755upcp6el,charlie@example.com,Work,Colleague,purple,,`;

      const result = await ContactsStorage.importFromCSV(
        csvContent,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      expect(result.imported).toBe(1);
      expect(result.failed).toBe(0);

      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      const charlie = contacts.find(c => c.name === 'Charlie');
      expect(charlie).toBeDefined();
      expect(charlie?.tags).toBeUndefined();
    });

    it('should handle invalid tags data gracefully (add error, continue import)', async () => {
      const csvContent = `Name,Address,Email,Category,Notes,Color,Xpub Fingerprint,Tags
Diana,tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx,diana@example.com,Friend,,,invalid-base64-here`;

      const result = await ContactsStorage.importFromCSV(
        csvContent,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      // Import should succeed but with an error for invalid tags
      expect(result.imported).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].reason).toContain('Invalid tags data');

      // Contact should still be imported (without tags)
      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      const diana = contacts.find(c => c.name === 'Diana');
      expect(diana).toBeDefined();
      expect(diana?.tags).toBeUndefined();
    });

    it('should validate tag key max length (30 chars)', async () => {
      const longKey = 'a'.repeat(31);
      const tagsJson = JSON.stringify({ [longKey]: 'value' });
      const tagsBase64 = Buffer.from(tagsJson, 'utf-8').toString('base64');

      const csvContent = `Name,Address,Email,Category,Notes,Color,Xpub Fingerprint,Tags
Eve,tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx,eve@example.com,,,,${tagsBase64}`;

      const result = await ContactsStorage.importFromCSV(
        csvContent,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].reason).toContain('exceeds maximum length of 30 characters');
    });

    it('should validate tag value max length (100 chars)', async () => {
      const longValue = 'v'.repeat(101);
      const tagsJson = JSON.stringify({ company: longValue });
      const tagsBase64 = Buffer.from(tagsJson, 'utf-8').toString('base64');

      const csvContent = `Name,Address,Email,Category,Notes,Color,Xpub Fingerprint,Tags
Frank,tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx,frank@example.com,,,,${tagsBase64}`;

      const result = await ContactsStorage.importFromCSV(
        csvContent,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].reason).toContain('exceeds maximum length of 100 characters');
    });

    it('should round-trip export and import with tags', async () => {
      // Create contacts with various tag configurations (using unique valid addresses)
      const contact1Tags = { company: 'TechCorp', role: 'Engineer' };
      const contact2Tags = { verified: 'yes', type: 'exchange' };

      await ContactsStorage.addContact(
        createContactData({ name: 'Alice Round Trip', tags: contact1Tags }),
        TEST_PASSWORD,
        'testnet'
      );
      await ContactsStorage.addContact(
        createContactData({
          name: 'Bob Round Trip',
          address: undefined,
          xpub: VALID_TESTNET_TPUB,
          tags: contact2Tags,
        }),
        TEST_PASSWORD,
        'testnet'
      );
      await ContactsStorage.addContact(
        createContactData({
          name: 'Charlie No Tags',
          address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
        }),
        TEST_PASSWORD,
        'testnet'
      );

      // Export to CSV
      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);

      // Clear contacts (but keep wallet)
      await ContactsStorage.deleteAll();

      // Import from CSV (wallet still exists, so no need to re-initialize)
      const result = await ContactsStorage.importFromCSV(
        csv,
        TEST_PASSWORD,
        'testnet',
        { skipDuplicates: false, validateOnly: false }
      );

      expect(result.imported).toBe(3);
      expect(result.failed).toBe(0);

      // Verify all contacts and tags
      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      expect(contacts.length).toBe(3);

      const alice = contacts.find(c => c.name === 'Alice Round Trip');
      expect(alice?.tags).toEqual(contact1Tags);

      const bob = contacts.find(c => c.name === 'Bob Round Trip');
      expect(bob?.tags).toEqual(contact2Tags);

      const charlie = contacts.find(c => c.name === 'Charlie No Tags');
      expect(charlie?.tags).toBeUndefined();
    });
  });

  describe('v1 to v2 migration', () => {
    it('should migrate v1 contacts to v2 with encryption', async () => {
      const v1Contacts: ContactV1[] = [
        {
          id: 'contact-1',
          name: 'Alice',
          address: 'tb1qtest1',
          addressType: 'native-segwit',
          notes: 'Test note',
          category: 'Friends',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'contact-2',
          name: 'Bob',
          address: 'tb1qtest2',
          addressType: 'native-segwit',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: v1Contacts,
      };

      await setStorageData('contacts', v1Data);

      const result = await ContactsStorage.migrateV1ToV2(TEST_PASSWORD);

      expect(result.success).toBe(true);
      expect(result.contactsProcessed).toBe(2);
      expect(result.errors).toHaveLength(0);

      // Verify v2 structure
      const stored = await getStorageData('contacts');
      expect(stored.version).toBe(2);
      expect(stored.contacts.length).toBe(2);
      expect(stored.salt).toBeDefined();

      // Verify encryption
      expect(stored.contacts[0].encryptedData).toBeDefined();
      expect(stored.contacts[0].iv).toBeDefined();
    });

    it('should create backup before migration', async () => {
      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: [
          {
            id: 'contact-1',
            name: 'Alice',
            address: 'tb1qtest',
            addressType: 'native-segwit',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      await setStorageData('contacts', v1Data);
      await ContactsStorage.migrateV1ToV2(TEST_PASSWORD);

      const backup = await getStorageData('contacts_v1_backup');
      expect(backup).toBeDefined();
      expect(backup.version).toBe(1);
      expect(backup.contacts).toHaveLength(1);
    });

    it('should assign default color to migrated contacts', async () => {
      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: [
          {
            id: 'contact-1',
            name: 'Alice',
            address: 'tb1qtest',
            addressType: 'native-segwit',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      await setStorageData('contacts', v1Data);
      await ContactsStorage.migrateV1ToV2(TEST_PASSWORD);

      const contacts = await ContactsStorage.getContacts(TEST_PASSWORD);
      expect(contacts[0].color).toBe('blue');
    });

    it('should reject migration from v2', async () => {
      const v2Data: ContactsDataV2 = {
        version: 2,
        contacts: [],
        salt: TEST_SALT,
      };

      await setStorageData('contacts', v2Data);

      await expect(
        ContactsStorage.migrateV1ToV2(TEST_PASSWORD)
      ).rejects.toThrow(/Cannot migrate from version 2/);
    });
  });

  describe('verifyMigrationIntegrity', () => {
    it('should verify all contacts decrypt successfully', async () => {
      await ContactsStorage.addContact(createContactData(), TEST_PASSWORD, 'testnet');

      const isValid = await ContactsStorage.verifyMigrationIntegrity(TEST_PASSWORD);
      expect(isValid).toBe(true);
    });

    it('should return false for corrupted data', async () => {
      await ContactsStorage.addContact(createContactData(), TEST_PASSWORD, 'testnet');

      // Corrupt the encrypted data
      const stored = await getStorageData('contacts');
      stored.contacts[0].encryptedData = 'CORRUPTED';
      await setStorageData('contacts', stored);

      const isValid = await ContactsStorage.verifyMigrationIntegrity(TEST_PASSWORD);
      expect(isValid).toBe(false);
    });

    it('should return false for wrong password', async () => {
      await ContactsStorage.addContact(createContactData(), TEST_PASSWORD, 'testnet');

      const isValid = await ContactsStorage.verifyMigrationIntegrity('wrong_password');
      expect(isValid).toBe(false);
    });
  });

  describe('rollbackMigration', () => {
    it('should restore v1 backup', async () => {
      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: [
          {
            id: 'contact-1',
            name: 'Alice',
            address: 'tb1qtest',
            addressType: 'native-segwit',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      await setStorageData('contacts', v1Data);
      await ContactsStorage.migrateV1ToV2(TEST_PASSWORD);

      // Rollback
      const result = await ContactsStorage.rollbackMigration();

      expect(result.success).toBe(true);
      expect(result.contactsRestored).toBe(1);

      // Verify v1 restored
      const stored = await getStorageData('contacts');
      expect(stored.version).toBe(1);
      expect(stored.contacts[0].name).toBe('Alice');
    });

    it('should return error if no backup exists', async () => {
      const result = await ContactsStorage.rollbackMigration();

      expect(result.success).toBe(false);
      expect(result.contactsRestored).toBe(0);
      expect(result.error).toContain('No backup found');
    });
  });

  describe('getMigrationStatus', () => {
    it('should report migration needed for v1', async () => {
      const v1Data: ContactsDataV1 = {
        version: 1,
        contacts: [
          {
            id: 'contact-1',
            name: 'Alice',
            address: 'tb1qtest',
            addressType: 'native-segwit',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      await setStorageData('contacts', v1Data);

      const status = await ContactsStorage.getMigrationStatus();

      expect(status.needsMigration).toBe(true);
      expect(status.currentVersion).toBe(1);
      expect(status.contactCount).toBe(1);
    });

    it('should report no migration needed for v2', async () => {
      const v2Data: ContactsDataV2 = {
        version: 2,
        contacts: [],
        salt: TEST_SALT,
      };

      await setStorageData('contacts', v2Data);

      const status = await ContactsStorage.getMigrationStatus();

      expect(status.needsMigration).toBe(false);
      expect(status.currentVersion).toBe(2);
    });
  });

  describe('deleteAll', () => {
    it('should delete all contacts', async () => {
      await ContactsStorage.addContact(createContactData(), TEST_PASSWORD, 'testnet');
      await ContactsStorage.deleteAll();

      const hasContacts = await ContactsStorage.hasContacts();
      expect(hasContacts).toBe(false);
    });
  });

  describe('edge cases and validation', () => {
    it('should handle maximum field lengths', async () => {
      const contactData = createContactData({
        name: 'A'.repeat(50),
        email: 'a'.repeat(90) + '@test.com',
        notes: 'N'.repeat(500),
        category: 'C'.repeat(30),
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
      expect(contact.name.length).toBe(50);
      expect(contact.notes?.length).toBe(500);
    });

    it('should reject name longer than 50 characters', async () => {
      const contactData = createContactData({ name: 'A'.repeat(51) });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/name must be 50 characters or less/);
    });

    it('should reject email longer than 100 characters', async () => {
      const contactData = createContactData({ email: 'a'.repeat(100) + '@test.com' });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Email must be 100 characters or less/);
    });

    it('should reject notes longer than 500 characters', async () => {
      const contactData = createContactData({ notes: 'N'.repeat(501) });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Notes must be 500 characters or less/);
    });

    it('should reject category longer than 30 characters', async () => {
      const contactData = createContactData({ category: 'C'.repeat(31) });

      await expect(
        ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet')
      ).rejects.toThrow(/Category must be 30 characters or less/);
    });

    it('should handle Unicode characters in name', async () => {
      const contactData = createContactData({ name: '李明 (Lǐ Míng) 🌟' });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
      const retrieved = await ContactsStorage.getContactById(contact.id, TEST_PASSWORD);

      expect(retrieved?.name).toBe('李明 (Lǐ Míng) 🌟');
    });

    it('should handle all 16 color options', async () => {
      const colors: ContactColor[] = [
        'blue', 'purple', 'pink', 'red',
        'orange', 'yellow', 'green', 'teal',
        'cyan', 'indigo', 'violet', 'magenta',
        'amber', 'lime', 'emerald', 'sky'
      ];

      for (const color of colors) {
        const contactData = createContactData({ color, name: `Contact ${color}` });
        const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
        expect(contact.color).toBe(color);
      }
    });
  });

  describe('Contact Tags (v3)', () => {
    it('should add contact with custom tags (key-value pairs)', async () => {
      const tags = {
        'Company': 'Acme Corp',
        'Role': 'CEO',
        'Region': 'North America'
      };

      const contactData = createContactData({
        name: 'Bob with Tags',
        tags
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
      expect(contact.tags).toEqual(tags);
    });

    it('should update contact tags (add new tag)', async () => {
      const initialTags = {
        'Company': 'Acme Corp'
      };

      const contactData = createContactData({
        name: 'Alice Tags',
        tags: initialTags
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      // Add new tag
      const updatedTags = {
        ...initialTags,
        'Department': 'Engineering'
      };

      const updated = await ContactsStorage.updateContact(
        contact.id,
        { tags: updatedTags },
        TEST_PASSWORD,
        'testnet'
      );

      expect(updated.tags).toEqual(updatedTags);
      expect(Object.keys(updated.tags!).length).toBe(2);
    });

    it('should update contact tags (modify existing tag value)', async () => {
      const initialTags = {
        'Role': 'Developer',
        'Level': 'Junior'
      };

      const contactData = createContactData({
        name: 'Charlie Tags',
        tags: initialTags
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      // Modify existing tag
      const updatedTags = {
        'Role': 'Developer',
        'Level': 'Senior'
      };

      const updated = await ContactsStorage.updateContact(
        contact.id,
        { tags: updatedTags },
        TEST_PASSWORD,
        'testnet'
      );

      expect(updated.tags!['Level']).toBe('Senior');
      expect(updated.tags!['Role']).toBe('Developer');
    });

    it('should remove specific tag from contact', async () => {
      const initialTags = {
        'Company': 'Acme Corp',
        'Department': 'Engineering',
        'Location': 'Remote'
      };

      const contactData = createContactData({
        name: 'Diana Tags',
        tags: initialTags
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      // Remove one tag
      const { Location, ...remainingTags } = initialTags;

      const updated = await ContactsStorage.updateContact(
        contact.id,
        { tags: remainingTags },
        TEST_PASSWORD,
        'testnet'
      );

      expect(updated.tags).toEqual(remainingTags);
      expect(updated.tags!['Location']).toBeUndefined();
      expect(Object.keys(updated.tags!).length).toBe(2);
    });

    it('should search contacts by tag key', async () => {
      // Create contacts with various tags
      const contact1 = await ContactsStorage.addContact(
        createContactData({
          name: 'Contact with Company tag',
          tags: { 'Company': 'TechCorp' }
        }),
        TEST_PASSWORD,
        'testnet'
      );

      const contact2 = await ContactsStorage.addContact(
        createContactData({
          name: 'Contact with Department tag',
          address: undefined,
          xpub: VALID_TESTNET_TPUB,
          tags: { 'Department': 'Sales' }
        }),
        TEST_PASSWORD,
        'testnet'
      );

      const contact3 = await ContactsStorage.addContact(
        createContactData({
          name: 'Contact with Company and Role',
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          tags: { 'Company': 'StartupInc', 'Role': 'Engineer' }
        }),
        TEST_PASSWORD,
        'testnet'
      );

      // Search by tag key
      const results = await ContactsStorage.searchContacts('Company', TEST_PASSWORD);

      expect(results.length).toBe(2);
      expect(results.map(c => c.name)).toContain('Contact with Company tag');
      expect(results.map(c => c.name)).toContain('Contact with Company and Role');
    });

    it('should search contacts by tag value', async () => {
      // Create contacts with various tag values
      const contact1 = await ContactsStorage.addContact(
        createContactData({
          name: 'TechCorp Employee',
          tags: { 'Company': 'TechCorp' }
        }),
        TEST_PASSWORD,
        'testnet'
      );

      const contact2 = await ContactsStorage.addContact(
        createContactData({
          name: 'Engineer at StartupInc',
          address: undefined,
          xpub: VALID_TESTNET_TPUB,
          tags: { 'Role': 'Engineer' }
        }),
        TEST_PASSWORD,
        'testnet'
      );

      const contact3 = await ContactsStorage.addContact(
        createContactData({
          name: 'Another TechCorp Person',
          address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          tags: { 'Employer': 'TechCorp' }
        }),
        TEST_PASSWORD,
        'testnet'
      );

      // Search by tag value
      const results = await ContactsStorage.searchContacts('TechCorp', TEST_PASSWORD);

      expect(results.length).toBe(2);
      expect(results.map(c => c.name)).toContain('TechCorp Employee');
      expect(results.map(c => c.name)).toContain('Another TechCorp Person');
    });

    it('should handle empty tags object', async () => {
      const contactData = createContactData({
        name: 'Contact with empty tags',
        tags: {}
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
      expect(contact.tags).toEqual({});
    });

    it('should handle contact without tags', async () => {
      const contactData = createContactData({
        name: 'Contact without tags'
      });
      // Don't include tags field at all

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
      expect(contact.tags).toBeUndefined();
    });

    it('should handle tags with special characters in values', async () => {
      const tags = {
        'Website': 'https://example.com',
        'Email': 'test@company.co.uk',
        'Notes': 'Contact via email (not phone)'
      };

      const contactData = createContactData({
        name: 'Contact with special chars',
        tags
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');
      const retrieved = await ContactsStorage.getContactById(contact.id, TEST_PASSWORD);

      expect(retrieved?.tags).toEqual(tags);
      expect(retrieved?.tags!['Website']).toBe('https://example.com');
      expect(retrieved?.tags!['Email']).toBe('test@company.co.uk');
    });

    it('should encrypt tags in storage', async () => {
      const tags = {
        'SecretKey': 'SecretValue',
        'PrivateInfo': 'Confidential Data'
      };

      const contactData = createContactData({
        name: 'Contact with encrypted tags',
        tags
      });

      const contact = await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      // Get raw storage data
      const rawData = await getStorageData('contacts');

      // Find the contact in encrypted storage
      const encryptedContact = rawData.contacts.find((c: any) => c.id === contact.id);

      // Verify tags are not in plaintext in storage
      const storageString = JSON.stringify(encryptedContact);
      expect(storageString).not.toContain('SecretKey');
      expect(storageString).not.toContain('SecretValue');
      expect(storageString).not.toContain('PrivateInfo');
      expect(storageString).not.toContain('Confidential Data');

      // Verify encrypted data exists
      expect(encryptedContact.encryptedData).toBeDefined();
      expect(encryptedContact.iv).toBeDefined();
    });

    it('should handle CSV export with tags', async () => {
      // Note: Current CSV export doesn't include tags, but test that it doesn't error
      const tags = {
        'Company': 'Acme Corp',
        'Role': 'Manager'
      };

      const contactData = createContactData({
        name: 'CSV Contact with tags',
        tags
      });

      await ContactsStorage.addContact(contactData, TEST_PASSWORD, 'testnet');

      // Export should work without errors
      const csv = await ContactsStorage.exportToCSV(TEST_PASSWORD);
      expect(csv).toContain('CSV Contact with tags');
    });
  });
});
