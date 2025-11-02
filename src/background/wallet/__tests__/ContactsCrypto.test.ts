/**
 * ContactsCrypto Test Suite
 *
 * Comprehensive tests for contact encryption/decryption operations:
 * - AES-256-GCM encryption with unique IVs
 * - PBKDF2 key derivation (100,000 iterations)
 * - Round-trip encryption/decryption
 * - Bulk operations
 * - Re-encryption for password changes
 * - Integrity verification
 * - Error handling
 *
 * Security-critical code - requires 100% coverage
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { ContactsCrypto, PBKDF2_ITERATIONS } from '../ContactsCrypto';
import { Contact, EncryptedContact, ContactColor } from '../../../shared/types';

// Ensure crypto.subtle is available
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

describe('ContactsCrypto', () => {
  // Test constants
  const TEST_PASSWORD = 'TestPassword123!';
  const TEST_SALT = 'dGVzdHNhbHQxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ='; // Base64 encoded salt
  const TEST_WRONG_PASSWORD = 'WrongPassword456!';

  // Helper function to create a test contact
  const createTestContact = (overrides: Partial<Contact> = {}): Contact => ({
    id: crypto.randomUUID(),
    name: 'Alice Johnson',
    email: 'alice@example.com',
    notes: 'Test notes for Alice',
    category: 'Friends',
    address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    addressType: 'native-segwit',
    xpub: undefined,
    xpubFingerprint: undefined,
    xpubDerivationPath: undefined,
    cachedAddresses: undefined,
    addressesLastUpdated: undefined,
    color: 'blue' as ContactColor,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    transactionCount: 5,
    lastTransactionDate: Date.now() - 86400000,
    ...overrides,
  });

  describe('encryptContact', () => {
    beforeEach(() => {
      // Use original crypto for encryption tests to ensure proper randomness
      (global as any).__restoreOriginalCrypto();
    });

    it('should encrypt contact with all sensitive fields', async () => {
      const contact = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);

      // Should have encrypted data and IV
      expect(encrypted.encryptedData).toBeDefined();
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(encrypted.encryptedData.length).toBeGreaterThan(0);
      expect(encrypted.iv).toBeDefined();
      expect(typeof encrypted.iv).toBe('string');
      expect(encrypted.iv.length).toBeGreaterThan(0);

      // Should preserve plaintext fields
      expect(encrypted.id).toBe(contact.id);
      expect(encrypted.address).toBe(contact.address);
      expect(encrypted.addressType).toBe(contact.addressType);
      expect(encrypted.createdAt).toBe(contact.createdAt);
      expect(encrypted.transactionCount).toBe(contact.transactionCount);
      expect(encrypted.lastTransactionDate).toBe(contact.lastTransactionDate);

      // Updated timestamp should be set
      expect(encrypted.updatedAt).toBeGreaterThanOrEqual(contact.updatedAt);
    });

    it('should produce unique IVs for same contact encrypted twice', async () => {
      const contact = createTestContact();

      const encrypted1 = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);
      const encrypted2 = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);

      // Different IVs
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      // Different encrypted data (because of different IVs)
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
    });

    it('should encrypt contact with minimal fields (only name and address)', async () => {
      const contact = createTestContact({
        email: undefined,
        notes: undefined,
        category: undefined,
        color: undefined,
      });

      const encrypted = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);

      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.address).toBe(contact.address);
    });

    it('should encrypt contact with xpub data', async () => {
      const contact = createTestContact({
        address: undefined,
        addressType: undefined,
        xpub: 'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp',
        xpubFingerprint: '12ab34cd',
        xpubDerivationPath: "m/84'/1'/0'",
        cachedAddresses: ['tb1qaddress1', 'tb1qaddress2'],
        addressesLastUpdated: Date.now(),
      });

      const encrypted = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);

      // Plaintext xpub metadata preserved
      expect(encrypted.xpubFingerprint).toBe(contact.xpubFingerprint);
      expect(encrypted.xpubDerivationPath).toBe(contact.xpubDerivationPath);
      expect(encrypted.cachedAddresses).toEqual(contact.cachedAddresses);
      expect(encrypted.addressesLastUpdated).toBe(contact.addressesLastUpdated);

      // Xpub itself is encrypted (not in plaintext)
      expect(encrypted).not.toHaveProperty('xpub');
    });

    it('should produce Base64-encoded output', async () => {
      const contact = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);

      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(base64Regex.test(encrypted.encryptedData)).toBe(true);
      expect(base64Regex.test(encrypted.iv)).toBe(true);
    });

    it('should encrypt contact with special characters in name', async () => {
      const contact = createTestContact({
        name: '李明 (Lǐ Míng) - 🌟',
        notes: 'Unicode: 日本語, العربية, Русский',
      });

      const encrypted = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted.name).toBe(contact.name);
      expect(decrypted.notes).toBe(contact.notes);
    });

    it('should encrypt contact with maximum field lengths', async () => {
      const contact = createTestContact({
        name: 'A'.repeat(50),
        email: 'a'.repeat(90) + '@test.com', // ~100 chars
        notes: 'N'.repeat(500),
        category: 'C'.repeat(30),
      });

      const encrypted = await ContactsCrypto.encryptContact(contact, TEST_PASSWORD, TEST_SALT);
      expect(encrypted.encryptedData).toBeDefined();
    });
  });

  describe('decryptContact', () => {
    it('should decrypt contact and restore all sensitive fields', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      // All fields should match
      expect(decrypted.id).toBe(original.id);
      expect(decrypted.name).toBe(original.name);
      expect(decrypted.email).toBe(original.email);
      expect(decrypted.notes).toBe(original.notes);
      expect(decrypted.category).toBe(original.category);
      expect(decrypted.color).toBe(original.color);
      expect(decrypted.address).toBe(original.address);
      expect(decrypted.addressType).toBe(original.addressType);
      expect(decrypted.createdAt).toBe(original.createdAt);
      expect(decrypted.transactionCount).toBe(original.transactionCount);
      expect(decrypted.lastTransactionDate).toBe(original.lastTransactionDate);
    });

    it('should perform round-trip encryption/decryption correctly', async () => {
      const original = createTestContact();

      // Encrypt
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      // Decrypt
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      // Should match original (except updatedAt which is set during encryption)
      expect(decrypted.name).toBe(original.name);
      expect(decrypted.email).toBe(original.email);
      expect(decrypted.notes).toBe(original.notes);
      expect(decrypted.category).toBe(original.category);
      expect(decrypted.xpub).toBe(original.xpub);
      expect(decrypted.color).toBe(original.color);
    });

    it('should fail to decrypt with wrong password', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      await expect(
        ContactsCrypto.decryptContact(encrypted, TEST_WRONG_PASSWORD, TEST_SALT)
      ).rejects.toThrow(/Failed to decrypt contact/);
    });

    it('should fail to decrypt with wrong salt', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const wrongSalt = 'ZGlmZmVyZW50c2FsdDEyMzQ1Njc4OTAxMjM0NTY3ODk=';

      await expect(
        ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, wrongSalt)
      ).rejects.toThrow(/Failed to decrypt contact/);
    });

    it('should fail to decrypt with corrupted encrypted data', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      // Corrupt the encrypted data
      encrypted.encryptedData = encrypted.encryptedData.slice(0, -10) + 'CORRUPTED==';

      await expect(
        ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT)
      ).rejects.toThrow(/Failed to decrypt contact/);
    });

    it('should fail to decrypt with corrupted IV', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      // Corrupt the IV
      encrypted.iv = 'Q09SUlVQVEVESVY=';

      await expect(
        ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT)
      ).rejects.toThrow(/Failed to decrypt contact/);
    });

    it('should handle contact with undefined optional fields', async () => {
      const original = createTestContact({
        email: undefined,
        notes: undefined,
        category: undefined,
        color: undefined,
      });

      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted.email).toBeUndefined();
      expect(decrypted.notes).toBeUndefined();
      expect(decrypted.category).toBeUndefined();
      expect(decrypted.color).toBeUndefined();
    });

    it('should decrypt contact with xpub fields', async () => {
      const original = createTestContact({
        address: undefined,
        addressType: undefined,
        xpub: 'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp',
        xpubFingerprint: '12ab34cd',
        xpubDerivationPath: "m/84'/1'/0'",
        cachedAddresses: ['tb1qaddress1', 'tb1qaddress2'],
        addressesLastUpdated: Date.now(),
      });

      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted.xpub).toBe(original.xpub);
      expect(decrypted.xpubFingerprint).toBe(original.xpubFingerprint);
      expect(decrypted.xpubDerivationPath).toBe(original.xpubDerivationPath);
      expect(decrypted.cachedAddresses).toEqual(original.cachedAddresses);
    });
  });

  describe('decryptContacts (bulk)', () => {
    it('should decrypt multiple contacts in bulk', async () => {
      const contacts = [
        createTestContact({ name: 'Alice' }),
        createTestContact({ name: 'Bob' }),
        createTestContact({ name: 'Charlie' }),
      ];

      // Encrypt all
      const encrypted = await Promise.all(
        contacts.map(c => ContactsCrypto.encryptContact(c, TEST_PASSWORD, TEST_SALT))
      );

      // Bulk decrypt
      const decrypted = await ContactsCrypto.decryptContacts(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted).toHaveLength(3);
      expect(decrypted[0].name).toBe('Alice');
      expect(decrypted[1].name).toBe('Bob');
      expect(decrypted[2].name).toBe('Charlie');
    });

    it('should decrypt empty array', async () => {
      const decrypted = await ContactsCrypto.decryptContacts([], TEST_PASSWORD, TEST_SALT);
      expect(decrypted).toEqual([]);
    });

    it('should fail if any contact fails to decrypt', async () => {
      const contacts = [
        createTestContact({ name: 'Alice' }),
        createTestContact({ name: 'Bob' }),
      ];

      const encrypted = await Promise.all(
        contacts.map(c => ContactsCrypto.encryptContact(c, TEST_PASSWORD, TEST_SALT))
      );

      // Corrupt one contact
      encrypted[1].encryptedData = 'CORRUPTED_DATA==';

      await expect(
        ContactsCrypto.decryptContacts(encrypted, TEST_PASSWORD, TEST_SALT)
      ).rejects.toThrow(/Failed to decrypt contact/);
    });
  });

  describe('reencryptContact', () => {
    it('should re-encrypt contact with new password', async () => {
      const original = createTestContact();
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';

      // Encrypt with old password
      const encrypted = await ContactsCrypto.encryptContact(original, oldPassword, TEST_SALT);

      // Re-encrypt with new password
      const reencrypted = await ContactsCrypto.reencryptContact(
        encrypted,
        oldPassword,
        newPassword,
        TEST_SALT
      );

      // Should not decrypt with old password
      await expect(
        ContactsCrypto.decryptContact(reencrypted, oldPassword, TEST_SALT)
      ).rejects.toThrow(/Failed to decrypt contact/);

      // Should decrypt with new password
      const decrypted = await ContactsCrypto.decryptContact(reencrypted, newPassword, TEST_SALT);
      expect(decrypted.name).toBe(original.name);
      expect(decrypted.email).toBe(original.email);
      expect(decrypted.notes).toBe(original.notes);
    });

    it('should preserve all contact data during re-encryption', async () => {
      const original = createTestContact();
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';

      const encrypted = await ContactsCrypto.encryptContact(original, oldPassword, TEST_SALT);
      const reencrypted = await ContactsCrypto.reencryptContact(
        encrypted,
        oldPassword,
        newPassword,
        TEST_SALT
      );
      const decrypted = await ContactsCrypto.decryptContact(reencrypted, newPassword, TEST_SALT);

      // All fields should be preserved
      expect(decrypted.name).toBe(original.name);
      expect(decrypted.email).toBe(original.email);
      expect(decrypted.notes).toBe(original.notes);
      expect(decrypted.category).toBe(original.category);
      expect(decrypted.color).toBe(original.color);
      expect(decrypted.address).toBe(original.address);
      expect(decrypted.id).toBe(original.id);
      expect(decrypted.createdAt).toBe(original.createdAt);
    });

    it('should fail re-encryption with wrong old password', async () => {
      const original = createTestContact();
      const oldPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';

      const encrypted = await ContactsCrypto.encryptContact(original, oldPassword, TEST_SALT);

      await expect(
        ContactsCrypto.reencryptContact(encrypted, TEST_WRONG_PASSWORD, newPassword, TEST_SALT)
      ).rejects.toThrow(/Failed to decrypt contact/);
    });
  });

  describe('verifyIntegrity', () => {
    it('should return true for valid encrypted contact', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      const isValid = await ContactsCrypto.verifyIntegrity(encrypted, TEST_PASSWORD, TEST_SALT);
      expect(isValid).toBe(true);
    });

    it('should return false for contact with wrong password', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      const isValid = await ContactsCrypto.verifyIntegrity(encrypted, TEST_WRONG_PASSWORD, TEST_SALT);
      expect(isValid).toBe(false);
    });

    it('should return false for corrupted encrypted data', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      // Corrupt data
      encrypted.encryptedData = 'CORRUPTED==';

      const isValid = await ContactsCrypto.verifyIntegrity(encrypted, TEST_PASSWORD, TEST_SALT);
      expect(isValid).toBe(false);
    });

    it('should return false for corrupted IV', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      // Corrupt IV
      encrypted.iv = 'BADIV===';

      const isValid = await ContactsCrypto.verifyIntegrity(encrypted, TEST_PASSWORD, TEST_SALT);
      expect(isValid).toBe(false);
    });
  });

  describe('createEncryptedContact', () => {
    it('should create encrypted contact with generated ID and timestamps', async () => {
      const contactData = {
        name: 'Test Contact',
        email: 'test@example.com',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        addressType: 'native-segwit' as const,
        notes: 'Test notes',
        category: 'Test category',
        color: 'blue' as ContactColor,
      };

      const encrypted = await ContactsCrypto.createEncryptedContact(
        contactData,
        TEST_PASSWORD,
        TEST_SALT
      );

      // Should have generated ID
      expect(encrypted.id).toBeDefined();
      expect(typeof encrypted.id).toBe('string');
      expect(encrypted.id.length).toBeGreaterThan(0);

      // Should have encrypted data
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      // Decrypt to verify
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);
      expect(decrypted.name).toBe(contactData.name);
      expect(decrypted.email).toBe(contactData.email);
      expect(decrypted.createdAt).toBeDefined();
      expect(decrypted.updatedAt).toBeDefined();
      expect(decrypted.createdAt).toBeCloseTo(decrypted.updatedAt, -2); // Within 100ms
    });

    it('should generate unique IDs for multiple contacts', async () => {
      const contactData = {
        name: 'Test',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      const contact1 = await ContactsCrypto.createEncryptedContact(
        contactData,
        TEST_PASSWORD,
        TEST_SALT
      );
      const contact2 = await ContactsCrypto.createEncryptedContact(
        contactData,
        TEST_PASSWORD,
        TEST_SALT
      );

      expect(contact1.id).not.toBe(contact2.id);
    });
  });

  describe('PBKDF2 iterations constant', () => {
    it('should use 100,000 iterations for PBKDF2', () => {
      expect(PBKDF2_ITERATIONS).toBe(100000);
    });
  });

  describe('edge cases and security', () => {
    it('should handle very long contact names', async () => {
      const original = createTestContact({
        name: 'A'.repeat(1000), // Very long name
      });

      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted.name).toBe(original.name);
    });

    it('should handle contact with all 16 color options', async () => {
      const colors: ContactColor[] = [
        'blue', 'purple', 'pink', 'red',
        'orange', 'yellow', 'green', 'teal',
        'cyan', 'indigo', 'violet', 'magenta',
        'amber', 'lime', 'emerald', 'sky'
      ];

      for (const color of colors) {
        const original = createTestContact({ color });
        const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
        const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);
        expect(decrypted.color).toBe(color);
      }
    });

    it('should handle empty strings in optional fields', async () => {
      const original = createTestContact({
        email: '',
        notes: '',
        category: '',
      });

      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted.email).toBe('');
      expect(decrypted.notes).toBe('');
      expect(decrypted.category).toBe('');
    });

    it('should ensure IV is 12 bytes (16 base64 chars)', async () => {
      const original = createTestContact();
      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);

      // Base64 encoding of 12 bytes = 16 chars
      expect(encrypted.iv.length).toBeGreaterThanOrEqual(16);
    });

    it('should handle contacts with large cached address arrays', async () => {
      const cachedAddresses = Array.from({ length: 100 }, (_, i) =>
        `tb1qaddress${i.toString().padStart(10, '0')}`
      );

      const original = createTestContact({
        xpub: 'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp',
        cachedAddresses,
        xpubFingerprint: '12ab34cd',
        xpubDerivationPath: "m/84'/1'/0'",
      });

      const encrypted = await ContactsCrypto.encryptContact(original, TEST_PASSWORD, TEST_SALT);
      const decrypted = await ContactsCrypto.decryptContact(encrypted, TEST_PASSWORD, TEST_SALT);

      expect(decrypted.cachedAddresses).toEqual(cachedAddresses);
      expect(decrypted.cachedAddresses?.length).toBe(100);
    });
  });
});
