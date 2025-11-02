/**
 * TransactionMetadataStorage Tests
 *
 * Comprehensive test suite for TransactionMetadataStorage covering:
 * - Metadata retrieval (single and bulk)
 * - Metadata storage and updates
 * - Metadata deletion
 * - Tag/category aggregation and search
 * - Backup and restore functionality
 * - Error handling and edge cases
 * - Integration with encryption layer
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { TransactionMetadataStorage } from '../TransactionMetadataStorage';
import { WalletStorage } from '../WalletStorage';
import type { TransactionMetadata, TransactionMetadataStorage as TransactionMetadataStorageType } from '../../../shared/types';
import {
  TEST_MNEMONIC_12,
  TEST_PASSWORD_STRONG,
  TEST_TXID_1,
  TEST_TXID_2,
  TEST_TXID_3,
} from '../../../__tests__/utils/testConstants';
import { expectAsyncThrows } from '../../../__tests__/utils/testHelpers';
import { storageMock } from '../../../__tests__/__mocks__/chrome';

// Ensure crypto.subtle is available
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

// Helper to create sample metadata
function createSampleMetadata(overrides: Partial<TransactionMetadata> = {}): Omit<TransactionMetadata, 'updatedAt'> {
  return {
    tags: ['test', 'sample'],
    category: 'Testing',
    notes: 'Test notes',
    ...overrides,
  };
}

describe('TransactionMetadataStorage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    (global as any).__restoreOriginalCrypto();

    // Create wallet for encryption (metadata shares salt with wallet)
    await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
  });

  // ===========================================================================
  // hasMetadata() Tests
  // ===========================================================================

  describe('hasMetadata()', () => {
    it('should return false when no metadata exists', async () => {
      const result = await TransactionMetadataStorage.hasMetadata();
      expect(result).toBe(false);
    });

    it('should return true when metadata exists', async () => {
      // Add some metadata
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata(),
        TEST_PASSWORD_STRONG
      );

      const result = await TransactionMetadataStorage.hasMetadata();
      expect(result).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      const originalGet = storageMock.get.bind(storageMock);
      storageMock.get = jest.fn().mockRejectedValueOnce(
        new Error('Storage unavailable')
      ) as any;

      await expectAsyncThrows(
        () => TransactionMetadataStorage.hasMetadata(),
        'Failed to check metadata existence'
      );

      storageMock.get = originalGet;
    });
  });

  // ===========================================================================
  // getVersion() Tests
  // ===========================================================================

  describe('getVersion()', () => {
    it('should return current version (1) when no metadata exists', async () => {
      const version = await TransactionMetadataStorage.getVersion();
      expect(version).toBe(1);
    });

    it('should return stored version', async () => {
      // Add metadata (will create v1 structure)
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata(),
        TEST_PASSWORD_STRONG
      );

      const version = await TransactionMetadataStorage.getVersion();
      expect(version).toBe(1);
    });
  });

  // ===========================================================================
  // setMetadata() Tests
  // ===========================================================================

  describe('setMetadata()', () => {
    it('should store metadata for a transaction', async () => {
      const metadata = createSampleMetadata();

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      // Verify stored
      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved).toBeDefined();
      expect(retrieved?.tags).toEqual(metadata.tags);
      expect(retrieved?.category).toBe(metadata.category);
      expect(retrieved?.notes).toBe(metadata.notes);
      expect(retrieved?.updatedAt).toBeGreaterThan(0);
    });

    it('should update existing metadata', async () => {
      const initial = createSampleMetadata({ tags: ['initial'], notes: 'Initial notes' });
      const updated = createSampleMetadata({ tags: ['updated'], notes: 'Updated notes' });

      // Set initial
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        initial,
        TEST_PASSWORD_STRONG
      );

      // Update
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        updated,
        TEST_PASSWORD_STRONG
      );

      // Verify updated
      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved?.tags).toEqual(['updated']);
      expect(retrieved?.notes).toBe('Updated notes');
    });

    it('should handle empty tags array', async () => {
      const metadata = createSampleMetadata({ tags: [] });

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved?.tags).toEqual([]);
    });

    it('should handle empty category', async () => {
      const metadata = createSampleMetadata({ category: '' });

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved?.category).toBe('');
    });

    it('should handle empty notes', async () => {
      const metadata = createSampleMetadata({ notes: '' });

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved?.notes).toBe('');
    });

    it('should reject wrong password', async () => {
      const metadata = createSampleMetadata();

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      // Try to retrieve with wrong password
      await expectAsyncThrows(
        () => TransactionMetadataStorage.getMetadata(TEST_TXID_1, 'wrong_password'),
        'Failed to get metadata'
      );
    });
  });

  // ===========================================================================
  // getMetadata() Tests
  // ===========================================================================

  describe('getMetadata()', () => {
    it('should return null for non-existent transaction', async () => {
      const result = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(result).toBeNull();
    });

    it('should retrieve existing metadata', async () => {
      const metadata = createSampleMetadata();

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved).not.toBeNull();
      expect(retrieved?.tags).toEqual(metadata.tags);
      expect(retrieved?.category).toBe(metadata.category);
      expect(retrieved?.notes).toBe(metadata.notes);
    });

    it('should decrypt metadata with correct password', async () => {
      const metadata = createSampleMetadata({ notes: 'Secret notes' });

      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        metadata,
        TEST_PASSWORD_STRONG
      );

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved?.notes).toBe('Secret notes');
    });
  });

  // ===========================================================================
  // getAllMetadata() Tests
  // ===========================================================================

  describe('getAllMetadata()', () => {
    it('should return empty object when no metadata exists', async () => {
      const result = await TransactionMetadataStorage.getAllMetadata(TEST_PASSWORD_STRONG);

      expect(result).toEqual({});
    });

    it('should retrieve all metadata', async () => {
      const metadata1 = createSampleMetadata({ tags: ['tag1'], category: 'Cat1' });
      const metadata2 = createSampleMetadata({ tags: ['tag2'], category: 'Cat2' });
      const metadata3 = createSampleMetadata({ tags: ['tag3'], category: 'Cat3' });

      await TransactionMetadataStorage.setMetadata(TEST_TXID_1, metadata1, TEST_PASSWORD_STRONG);
      await TransactionMetadataStorage.setMetadata(TEST_TXID_2, metadata2, TEST_PASSWORD_STRONG);
      await TransactionMetadataStorage.setMetadata(TEST_TXID_3, metadata3, TEST_PASSWORD_STRONG);

      const allMetadata = await TransactionMetadataStorage.getAllMetadata(TEST_PASSWORD_STRONG);

      expect(Object.keys(allMetadata)).toHaveLength(3);
      expect(allMetadata[TEST_TXID_1]?.tags).toEqual(['tag1']);
      expect(allMetadata[TEST_TXID_2]?.tags).toEqual(['tag2']);
      expect(allMetadata[TEST_TXID_3]?.tags).toEqual(['tag3']);
    });

    it('should decrypt all metadata correctly', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ notes: 'Notes1' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ notes: 'Notes2' }),
        TEST_PASSWORD_STRONG
      );

      const allMetadata = await TransactionMetadataStorage.getAllMetadata(TEST_PASSWORD_STRONG);

      expect(allMetadata[TEST_TXID_1]?.notes).toBe('Notes1');
      expect(allMetadata[TEST_TXID_2]?.notes).toBe('Notes2');
    });
  });

  // ===========================================================================
  // deleteMetadata() Tests
  // ===========================================================================

  describe('deleteMetadata()', () => {
    it('should delete existing metadata', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata(),
        TEST_PASSWORD_STRONG
      );

      await TransactionMetadataStorage.deleteMetadata(TEST_TXID_1);

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved).toBeNull();
    });

    it('should not throw when deleting non-existent metadata', async () => {
      // Should not throw
      await TransactionMetadataStorage.deleteMetadata(TEST_TXID_1);

      const retrieved = await TransactionMetadataStorage.getMetadata(
        TEST_TXID_1,
        TEST_PASSWORD_STRONG
      );

      expect(retrieved).toBeNull();
    });

    it('should not affect other metadata', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'Keep1' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ category: 'Delete' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ category: 'Keep2' }),
        TEST_PASSWORD_STRONG
      );

      await TransactionMetadataStorage.deleteMetadata(TEST_TXID_2);

      const allMetadata = await TransactionMetadataStorage.getAllMetadata(TEST_PASSWORD_STRONG);

      expect(Object.keys(allMetadata)).toHaveLength(2);
      expect(allMetadata[TEST_TXID_1]?.category).toBe('Keep1');
      expect(allMetadata[TEST_TXID_3]?.category).toBe('Keep2');
      expect(allMetadata[TEST_TXID_2]).toBeUndefined();
    });
  });

  // ===========================================================================
  // getAllTags() Tests
  // ===========================================================================

  describe('getAllTags()', () => {
    it('should return empty array when no metadata exists', async () => {
      const tags = await TransactionMetadataStorage.getAllTags(TEST_PASSWORD_STRONG);

      expect(tags).toEqual([]);
    });

    it('should return unique tags with counts', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['exchange', 'bitcoin'] }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ tags: ['exchange', 'savings'] }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ tags: ['bitcoin', 'hodl'] }),
        TEST_PASSWORD_STRONG
      );

      const tags = await TransactionMetadataStorage.getAllTags(TEST_PASSWORD_STRONG);

      expect(tags).toHaveLength(4);

      // Sort by count (descending), then alphabetically
      expect(tags[0]).toEqual({ tag: 'bitcoin', count: 2 });
      expect(tags[1]).toEqual({ tag: 'exchange', count: 2 });
      expect(tags[2]).toEqual({ tag: 'hodl', count: 1 });
      expect(tags[3]).toEqual({ tag: 'savings', count: 1 });
    });

    it('should handle empty tags arrays', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: [] }),
        TEST_PASSWORD_STRONG
      );

      const tags = await TransactionMetadataStorage.getAllTags(TEST_PASSWORD_STRONG);

      expect(tags).toEqual([]);
    });

    it('should sort tags by count (most used first)', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['common'] }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ tags: ['common'] }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ tags: ['rare'] }),
        TEST_PASSWORD_STRONG
      );

      const tags = await TransactionMetadataStorage.getAllTags(TEST_PASSWORD_STRONG);

      expect(tags[0]).toEqual({ tag: 'common', count: 2 });
      expect(tags[1]).toEqual({ tag: 'rare', count: 1 });
    });
  });

  // ===========================================================================
  // getAllCategories() Tests
  // ===========================================================================

  describe('getAllCategories()', () => {
    it('should return empty array when no metadata exists', async () => {
      const categories = await TransactionMetadataStorage.getAllCategories(TEST_PASSWORD_STRONG);

      expect(categories).toEqual([]);
    });

    it('should return unique categories with counts', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'Income' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ category: 'Expense' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ category: 'Income' }),
        TEST_PASSWORD_STRONG
      );

      const categories = await TransactionMetadataStorage.getAllCategories(TEST_PASSWORD_STRONG);

      expect(categories).toHaveLength(2);
      expect(categories[0]).toEqual({ category: 'Income', count: 2 });
      expect(categories[1]).toEqual({ category: 'Expense', count: 1 });
    });

    it('should ignore empty categories', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'ValidCategory' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ category: '' }),
        TEST_PASSWORD_STRONG
      );

      const categories = await TransactionMetadataStorage.getAllCategories(TEST_PASSWORD_STRONG);

      expect(categories).toHaveLength(1);
      expect(categories[0]).toEqual({ category: 'ValidCategory', count: 1 });
    });

    it('should sort categories by count (most used first)', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'Popular' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ category: 'Popular' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ category: 'Rare' }),
        TEST_PASSWORD_STRONG
      );

      const categories = await TransactionMetadataStorage.getAllCategories(TEST_PASSWORD_STRONG);

      expect(categories[0]).toEqual({ category: 'Popular', count: 2 });
      expect(categories[1]).toEqual({ category: 'Rare', count: 1 });
    });
  });

  // ===========================================================================
  // searchByTag() Tests
  // ===========================================================================

  describe('searchByTag()', () => {
    it('should return empty array when no matches', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['exchange'] }),
        TEST_PASSWORD_STRONG
      );

      const txids = await TransactionMetadataStorage.searchByTag('nonexistent', TEST_PASSWORD_STRONG);

      expect(txids).toEqual([]);
    });

    it('should return txids matching tag', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['exchange', 'bitcoin'] }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ tags: ['savings'] }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ tags: ['exchange', 'hodl'] }),
        TEST_PASSWORD_STRONG
      );

      const txids = await TransactionMetadataStorage.searchByTag('exchange', TEST_PASSWORD_STRONG);

      expect(txids).toHaveLength(2);
      expect(txids).toContain(TEST_TXID_1);
      expect(txids).toContain(TEST_TXID_3);
    });

    it('should be case-sensitive', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['Exchange'] }),
        TEST_PASSWORD_STRONG
      );

      const txids = await TransactionMetadataStorage.searchByTag('exchange', TEST_PASSWORD_STRONG);

      expect(txids).toEqual([]);
    });
  });

  // ===========================================================================
  // searchByCategory() Tests
  // ===========================================================================

  describe('searchByCategory()', () => {
    it('should return empty array when no matches', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'Income' }),
        TEST_PASSWORD_STRONG
      );

      const txids = await TransactionMetadataStorage.searchByCategory('Expense', TEST_PASSWORD_STRONG);

      expect(txids).toEqual([]);
    });

    it('should return txids matching category', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'Income' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata({ category: 'Expense' }),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_3,
        createSampleMetadata({ category: 'Income' }),
        TEST_PASSWORD_STRONG
      );

      const txids = await TransactionMetadataStorage.searchByCategory('Income', TEST_PASSWORD_STRONG);

      expect(txids).toHaveLength(2);
      expect(txids).toContain(TEST_TXID_1);
      expect(txids).toContain(TEST_TXID_3);
    });

    it('should be case-sensitive', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ category: 'Income' }),
        TEST_PASSWORD_STRONG
      );

      const txids = await TransactionMetadataStorage.searchByCategory('income', TEST_PASSWORD_STRONG);

      expect(txids).toEqual([]);
    });
  });

  // ===========================================================================
  // clearAll() Tests
  // ===========================================================================

  describe('clearAll()', () => {
    it('should delete all metadata', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata(),
        TEST_PASSWORD_STRONG
      );
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_2,
        createSampleMetadata(),
        TEST_PASSWORD_STRONG
      );

      await TransactionMetadataStorage.clearAll();

      const hasMetadata = await TransactionMetadataStorage.hasMetadata();
      expect(hasMetadata).toBe(false);
    });

    it('should not throw when no metadata exists', async () => {
      // Should not throw
      await TransactionMetadataStorage.clearAll();

      const hasMetadata = await TransactionMetadataStorage.hasMetadata();
      expect(hasMetadata).toBe(false);
    });
  });

  // ===========================================================================
  // getRawStorage() and restoreFromBackup() Tests
  // ===========================================================================

  describe('getRawStorage() and restoreFromBackup()', () => {
    it('should export and restore metadata', async () => {
      const metadata1 = createSampleMetadata({ tags: ['tag1'], category: 'Cat1', notes: 'Notes1' });
      const metadata2 = createSampleMetadata({ tags: ['tag2'], category: 'Cat2', notes: 'Notes2' });

      await TransactionMetadataStorage.setMetadata(TEST_TXID_1, metadata1, TEST_PASSWORD_STRONG);
      await TransactionMetadataStorage.setMetadata(TEST_TXID_2, metadata2, TEST_PASSWORD_STRONG);

      // Export
      const backup = await TransactionMetadataStorage.getRawStorage();

      // Clear
      await TransactionMetadataStorage.clearAll();

      // Verify cleared
      const hasMetadata = await TransactionMetadataStorage.hasMetadata();
      expect(hasMetadata).toBe(false);

      // Restore
      await TransactionMetadataStorage.restoreFromBackup(backup);

      // Verify restored
      const restored1 = await TransactionMetadataStorage.getMetadata(TEST_TXID_1, TEST_PASSWORD_STRONG);
      const restored2 = await TransactionMetadataStorage.getMetadata(TEST_TXID_2, TEST_PASSWORD_STRONG);

      expect(restored1?.tags).toEqual(['tag1']);
      expect(restored1?.category).toBe('Cat1');
      expect(restored1?.notes).toBe('Notes1');

      expect(restored2?.tags).toEqual(['tag2']);
      expect(restored2?.category).toBe('Cat2');
      expect(restored2?.notes).toBe('Notes2');
    });

    it('should preserve encryption in backup', async () => {
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ notes: 'Secret' }),
        TEST_PASSWORD_STRONG
      );

      const backup = await TransactionMetadataStorage.getRawStorage();

      // Backup should contain encrypted data
      expect(backup.metadata[TEST_TXID_1]).toBeDefined();
      expect(backup.metadata[TEST_TXID_1].encryptedData).toBeDefined();
      expect(backup.salt).toBeDefined();
    });
  });

  // ===========================================================================
  // Integration Tests
  // ===========================================================================

  describe('Integration Tests', () => {
    it('should handle complete metadata lifecycle', async () => {
      // 1. Create metadata
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['test'], category: 'Test', notes: 'Original' }),
        TEST_PASSWORD_STRONG
      );

      // 2. Retrieve metadata
      const metadata = await TransactionMetadataStorage.getMetadata(TEST_TXID_1, TEST_PASSWORD_STRONG);
      expect(metadata?.notes).toBe('Original');

      // 3. Update metadata
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['updated'], category: 'Updated', notes: 'Modified' }),
        TEST_PASSWORD_STRONG
      );

      const updated = await TransactionMetadataStorage.getMetadata(TEST_TXID_1, TEST_PASSWORD_STRONG);
      expect(updated?.notes).toBe('Modified');

      // 4. Delete metadata entry
      await TransactionMetadataStorage.deleteMetadata(TEST_TXID_1);
      const deleted = await TransactionMetadataStorage.getMetadata(TEST_TXID_1, TEST_PASSWORD_STRONG);
      expect(deleted).toBeNull();

      // 5. Re-create with different data
      await TransactionMetadataStorage.setMetadata(
        TEST_TXID_1,
        createSampleMetadata({ tags: ['final'], category: 'Final', notes: 'Final notes' }),
        TEST_PASSWORD_STRONG
      );

      const final = await TransactionMetadataStorage.getMetadata(TEST_TXID_1, TEST_PASSWORD_STRONG);
      expect(final?.notes).toBe('Final notes');
    });

    it('should maintain data integrity across multiple operations', async () => {
      // Add multiple metadata entries
      for (let i = 0; i < 10; i++) {
        await TransactionMetadataStorage.setMetadata(
          `${TEST_TXID_1.slice(0, -1)}${i}`,
          createSampleMetadata({ tags: [`tag${i}`], category: `Cat${i % 3}`, notes: `Notes${i}` }),
          TEST_PASSWORD_STRONG
        );
      }

      // Get all tags
      const tags = await TransactionMetadataStorage.getAllTags(TEST_PASSWORD_STRONG);
      expect(tags).toHaveLength(10);

      // Get all categories
      const categories = await TransactionMetadataStorage.getAllCategories(TEST_PASSWORD_STRONG);
      expect(categories).toHaveLength(3);

      // Search by category
      const cat0Txids = await TransactionMetadataStorage.searchByCategory('Cat0', TEST_PASSWORD_STRONG);
      expect(cat0Txids).toHaveLength(4); // 0, 3, 6, 9

      // Get all metadata
      const allMetadata = await TransactionMetadataStorage.getAllMetadata(TEST_PASSWORD_STRONG);
      expect(Object.keys(allMetadata)).toHaveLength(10);
    });
  });
});
