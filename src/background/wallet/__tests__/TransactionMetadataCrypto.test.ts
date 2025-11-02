/**
 * TransactionMetadataCrypto Tests
 *
 * Comprehensive test suite for TransactionMetadataCrypto covering:
 * - Metadata encryption and decryption
 * - Round-trip encryption/decryption
 * - Bulk encryption/decryption operations
 * - Password re-encryption (password change)
 * - Encryption integrity verification
 * - Error handling (wrong password, corrupted data)
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { TransactionMetadataCrypto } from '../TransactionMetadataCrypto';
import { CryptoUtils } from '../CryptoUtils';
import type { TransactionMetadata, EncryptedTransactionMetadata } from '../../../shared/types';
import {
  TEST_PASSWORD_STRONG,
  TEST_TXID_1,
  TEST_TXID_2,
  TEST_TXID_3,
} from '../../../__tests__/utils/testConstants';
import { expectAsyncThrows } from '../../../__tests__/utils/testHelpers';

// Ensure crypto.subtle is available
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

// Helper to create sample metadata
function createSampleMetadata(overrides: Partial<TransactionMetadata> = {}): TransactionMetadata {
  return {
    tags: ['test', 'sample'],
    category: 'Testing',
    notes: 'Test notes',
    updatedAt: Date.now(),
    ...overrides,
  };
}

describe('TransactionMetadataCrypto', () => {
  let globalSalt: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    (global as any).__restoreOriginalCrypto();

    // Generate a test salt
    const saltBytes = new Uint8Array(32);
    crypto.getRandomValues(saltBytes);
    globalSalt = CryptoUtils.arrayBufferToBase64(saltBytes);
  });

  // ===========================================================================
  // encryptMetadata() and decryptMetadata() Tests
  // ===========================================================================

  describe('encryptMetadata() and decryptMetadata()', () => {
    it('should encrypt and decrypt metadata successfully', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.tags).toEqual(metadata.tags);
      expect(decrypted.category).toBe(metadata.category);
      expect(decrypted.notes).toBe(metadata.notes);
      // Note: encryptMetadata() generates a new updatedAt timestamp
      expect(decrypted.updatedAt).toBe(encrypted.updatedAt);
    });

    it('should produce encrypted data structure', async () => {
      const metadata = createSampleMetadata();
      const beforeEncrypt = Date.now();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const afterEncrypt = Date.now();

      expect(encrypted.encryptedData).toBeDefined();
      expect(typeof encrypted.encryptedData).toBe('string');
      expect(encrypted.encryptedData.length).toBeGreaterThan(0);

      expect(encrypted.iv).toBeDefined();
      expect(typeof encrypted.iv).toBe('string');
      expect(encrypted.iv.length).toBeGreaterThan(0);

      // updatedAt should be generated during encryption
      expect(encrypted.updatedAt).toBeGreaterThanOrEqual(beforeEncrypt);
      expect(encrypted.updatedAt).toBeLessThanOrEqual(afterEncrypt);
    });

    it('should encrypt sensitive fields (tags, category, notes)', async () => {
      const metadata = createSampleMetadata({
        tags: ['secret-tag'],
        category: 'Secret Category',
        notes: 'Confidential notes',
      });

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // Encrypted data should not contain plaintext
      const encryptedDataLower = encrypted.encryptedData.toLowerCase();
      expect(encryptedDataLower).not.toContain('secret');
      expect(encryptedDataLower).not.toContain('confidential');
    });

    it('should keep updatedAt in plaintext', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // updatedAt should be plaintext (number type, not encrypted)
      expect(typeof encrypted.updatedAt).toBe('number');
      expect(encrypted.updatedAt).toBeGreaterThan(0);
    });

    it('should reject decryption with wrong password', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      await expectAsyncThrows(
        () => TransactionMetadataCrypto.decryptMetadata(
          TEST_TXID_1,
          encrypted,
          'wrong_password',
          globalSalt
        ),
        'Failed to decrypt metadata'
      );
    });

    it('should reject corrupted encrypted data', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // Corrupt the encrypted data
      encrypted.encryptedData = 'corrupted_base64_data';

      await expectAsyncThrows(
        () => TransactionMetadataCrypto.decryptMetadata(
          TEST_TXID_1,
          encrypted,
          TEST_PASSWORD_STRONG,
          globalSalt
        ),
        'Failed to decrypt metadata'
      );
    });

    it('should reject corrupted IV', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // Corrupt the IV
      encrypted.iv = 'corrupted_iv';

      await expectAsyncThrows(
        () => TransactionMetadataCrypto.decryptMetadata(
          TEST_TXID_1,
          encrypted,
          TEST_PASSWORD_STRONG,
          globalSalt
        ),
        'Failed to decrypt metadata'
      );
    });

    it('should handle empty tags array', async () => {
      const metadata = createSampleMetadata({ tags: [] });

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.tags).toEqual([]);
    });

    it('should handle empty category', async () => {
      const metadata = createSampleMetadata({ category: '' });

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.category).toBe('');
    });

    it('should handle empty notes', async () => {
      const metadata = createSampleMetadata({ notes: '' });

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.notes).toBe('');
    });

    it('should handle unicode in metadata', async () => {
      const metadata = createSampleMetadata({
        tags: ['日本語', 'émoji-🚀'],
        category: 'Категория',
        notes: 'Notes with 中文 and Ελληνικά',
      });

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.tags).toEqual(['日本語', 'émoji-🚀']);
      expect(decrypted.category).toBe('Категория');
      expect(decrypted.notes).toBe('Notes with 中文 and Ελληνικά');
    });

    it('should produce different ciphertext for same plaintext (unique IV)', async () => {
      const metadata = createSampleMetadata();

      const encrypted1 = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const encrypted2 = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);

      // Ciphertext should be different
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);

      // Both should decrypt correctly
      const decrypted1 = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted1,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted2 = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted2,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted1.notes).toBe(metadata.notes);
      expect(decrypted2.notes).toBe(metadata.notes);
    });
  });

  // ===========================================================================
  // decryptMetadataMap() Tests
  // ===========================================================================

  describe('decryptMetadataMap()', () => {
    it('should decrypt multiple metadata entries', async () => {
      const metadata1 = createSampleMetadata({ tags: ['tag1'], category: 'Cat1', notes: 'Notes1' });
      const metadata2 = createSampleMetadata({ tags: ['tag2'], category: 'Cat2', notes: 'Notes2' });
      const metadata3 = createSampleMetadata({ tags: ['tag3'], category: 'Cat3', notes: 'Notes3' });

      const encrypted1 = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata1,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const encrypted2 = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_2,
        metadata2,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const encrypted3 = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_3,
        metadata3,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const encryptedMap = {
        [TEST_TXID_1]: encrypted1,
        [TEST_TXID_2]: encrypted2,
        [TEST_TXID_3]: encrypted3,
      };

      const decryptedMap = await TransactionMetadataCrypto.decryptMetadataMap(
        encryptedMap,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(Object.keys(decryptedMap)).toHaveLength(3);
      expect(decryptedMap[TEST_TXID_1]?.notes).toBe('Notes1');
      expect(decryptedMap[TEST_TXID_2]?.notes).toBe('Notes2');
      expect(decryptedMap[TEST_TXID_3]?.notes).toBe('Notes3');
    });

    it('should handle empty map', async () => {
      const decryptedMap = await TransactionMetadataCrypto.decryptMetadataMap(
        {},
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decryptedMap).toEqual({});
    });

    it('should reject with wrong password', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      await expectAsyncThrows(
        () => TransactionMetadataCrypto.decryptMetadataMap(
          { [TEST_TXID_1]: encrypted },
          'wrong_password',
          globalSalt
        ),
        'Failed to decrypt metadata'
      );
    });
  });

  // ===========================================================================
  // reencryptMetadata() Tests
  // ===========================================================================

  describe('reencryptMetadata()', () => {
    it('should re-encrypt metadata with new password', async () => {
      const metadata = createSampleMetadata({ notes: 'Secret notes' });
      const newPassword = 'NewPassword123!';

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const reencrypted = await TransactionMetadataCrypto.reencryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        newPassword,
        globalSalt
      );

      // Old password should not work
      await expectAsyncThrows(
        () => TransactionMetadataCrypto.decryptMetadata(
          TEST_TXID_1,
          reencrypted,
          TEST_PASSWORD_STRONG,
          globalSalt
        ),
        'Failed to decrypt metadata'
      );

      // New password should work
      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        reencrypted,
        newPassword,
        globalSalt
      );

      expect(decrypted.notes).toBe('Secret notes');
    });

    it('should preserve metadata content during re-encryption', async () => {
      const metadata = createSampleMetadata({
        tags: ['tag1', 'tag2'],
        category: 'Category',
        notes: 'Important notes',
      });

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const reencrypted = await TransactionMetadataCrypto.reencryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        'NewPassword123!',
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        reencrypted,
        'NewPassword123!',
        globalSalt
      );

      expect(decrypted.tags).toEqual(['tag1', 'tag2']);
      expect(decrypted.category).toBe('Category');
      expect(decrypted.notes).toBe('Important notes');
      // updatedAt is taken from the encrypted object (which comes from the original encryption)
      expect(decrypted.updatedAt).toBe(encrypted.updatedAt);
    });

    it('should reject re-encryption with wrong old password', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      await expectAsyncThrows(
        () => TransactionMetadataCrypto.reencryptMetadata(
          TEST_TXID_1,
          encrypted,
          'wrong_password',
          'NewPassword123!',
          globalSalt
        ),
        'Failed to decrypt metadata'
      );
    });
  });

  // ===========================================================================
  // verifyIntegrity() Tests
  // ===========================================================================

  describe('verifyIntegrity()', () => {
    it('should return true for valid encryption', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const isValid = await TransactionMetadataCrypto.verifyIntegrity(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(isValid).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const isValid = await TransactionMetadataCrypto.verifyIntegrity(
        TEST_TXID_1,
        encrypted,
        'wrong_password',
        globalSalt
      );

      expect(isValid).toBe(false);
    });

    it('should return false for corrupted data', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // Corrupt the data
      encrypted.encryptedData = 'corrupted_data';

      const isValid = await TransactionMetadataCrypto.verifyIntegrity(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(isValid).toBe(false);
    });

    it('should return false for corrupted IV', async () => {
      const metadata = createSampleMetadata();

      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // Corrupt the IV
      encrypted.iv = 'corrupted_iv';

      const isValid = await TransactionMetadataCrypto.verifyIntegrity(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(isValid).toBe(false);
    });
  });

  // ===========================================================================
  // createEncryptedMetadata() Tests
  // ===========================================================================

  describe('createEncryptedMetadata()', () => {
    it('should create encrypted metadata with timestamp', async () => {
      const metadataData = {
        tags: ['test'],
        category: 'Category',
        notes: 'Notes',
      };

      const before = Date.now();
      const encrypted = await TransactionMetadataCrypto.createEncryptedMetadata(
        TEST_TXID_1,
        metadataData,
        TEST_PASSWORD_STRONG,
        globalSalt
      );
      const after = Date.now();

      // Verify structure
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.updatedAt).toBeGreaterThanOrEqual(before);
      expect(encrypted.updatedAt).toBeLessThanOrEqual(after);

      // Verify decryption
      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.tags).toEqual(['test']);
      expect(decrypted.category).toBe('Category');
      expect(decrypted.notes).toBe('Notes');
    });

    it('should handle empty fields', async () => {
      const metadataData = {
        tags: [],
        category: '',
        notes: '',
      };

      const encrypted = await TransactionMetadataCrypto.createEncryptedMetadata(
        TEST_TXID_1,
        metadataData,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      expect(decrypted.tags).toEqual([]);
      expect(decrypted.category).toBe('');
      expect(decrypted.notes).toBe('');
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration Tests', () => {
    it('should handle complete encryption lifecycle', async () => {
      const metadata = createSampleMetadata({
        tags: ['important', 'work'],
        category: 'Business',
        notes: 'Confidential transaction',
      });

      // 1. Encrypt
      const encrypted = await TransactionMetadataCrypto.encryptMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // 2. Verify integrity
      const isValid = await TransactionMetadataCrypto.verifyIntegrity(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );
      expect(isValid).toBe(true);

      // 3. Decrypt
      const decrypted = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        globalSalt
      );
      expect(decrypted.notes).toBe('Confidential transaction');

      // 4. Re-encrypt with new password
      const newPassword = 'NewSecurePassword123!';
      const reencrypted = await TransactionMetadataCrypto.reencryptMetadata(
        TEST_TXID_1,
        encrypted,
        TEST_PASSWORD_STRONG,
        newPassword,
        globalSalt
      );

      // 5. Verify with new password
      const isValidNew = await TransactionMetadataCrypto.verifyIntegrity(
        TEST_TXID_1,
        reencrypted,
        newPassword,
        globalSalt
      );
      expect(isValidNew).toBe(true);

      // 6. Decrypt with new password
      const decryptedNew = await TransactionMetadataCrypto.decryptMetadata(
        TEST_TXID_1,
        reencrypted,
        newPassword,
        globalSalt
      );
      expect(decryptedNew.notes).toBe('Confidential transaction');
    });

    it('should handle bulk operations efficiently', async () => {
      const metadataMap: { [txid: string]: TransactionMetadata } = {};
      const encryptedMap: { [txid: string]: EncryptedTransactionMetadata } = {};

      // Create and encrypt 10 metadata entries
      for (let i = 0; i < 10; i++) {
        const txid = `${TEST_TXID_1.slice(0, -1)}${i}`;
        const metadata = createSampleMetadata({
          tags: [`tag${i}`],
          category: `Cat${i}`,
          notes: `Notes${i}`,
        });

        metadataMap[txid] = metadata;
        encryptedMap[txid] = await TransactionMetadataCrypto.encryptMetadata(
          txid,
          metadata,
          TEST_PASSWORD_STRONG,
          globalSalt
        );
      }

      // Decrypt all in bulk
      const decryptedMap = await TransactionMetadataCrypto.decryptMetadataMap(
        encryptedMap,
        TEST_PASSWORD_STRONG,
        globalSalt
      );

      // Verify all decrypted correctly
      for (let i = 0; i < 10; i++) {
        const txid = `${TEST_TXID_1.slice(0, -1)}${i}`;
        expect(decryptedMap[txid]?.notes).toBe(`Notes${i}`);
      }
    });
  });
});
