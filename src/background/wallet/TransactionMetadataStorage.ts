/**
 * TransactionMetadataStorage - Transaction Metadata Storage Manager (v1.0)
 *
 * Manages persistent storage of transaction metadata with encryption support.
 *
 * Security Architecture:
 * - Individual transaction metadata encryption with AES-256-GCM
 * - Shared PBKDF2 key derivation with wallet/contacts (100,000 iterations)
 * - Unique IV per transaction
 * - Global salt shared with wallet and contacts
 * - Encrypted fields: tags, category, notes
 * - Plaintext fields: updatedAt (for sorting)
 *
 * Usage:
 * - Requires wallet password for all operations (encryption)
 * - Wallet must be unlocked to view or edit metadata
 * - Bulk operations for efficient filtering
 */

import type {
  TransactionMetadata,
  TransactionMetadataStorage as TransactionMetadataStorageType,
  EncryptedTransactionMetadata,
} from '../../shared/types';
import { TransactionMetadataCrypto } from './TransactionMetadataCrypto';
import { WalletStorage } from './WalletStorage';

/**
 * Storage key for transaction metadata in chrome.storage.local
 */
const METADATA_STORAGE_KEY = 'transaction_metadata';

/**
 * Current metadata storage schema version
 */
const CURRENT_VERSION = 1;

/**
 * TransactionMetadataStorage class for managing transaction metadata persistence
 */
export class TransactionMetadataStorage {
  /**
   * Checks if transaction metadata exists in storage
   */
  static async hasMetadata(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(METADATA_STORAGE_KEY);
      return !!result[METADATA_STORAGE_KEY];
    } catch (error) {
      throw new Error(
        `Failed to check metadata existence: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get metadata storage version
   */
  static async getVersion(): Promise<number> {
    try {
      const result = await chrome.storage.local.get(METADATA_STORAGE_KEY);
      const data = result[METADATA_STORAGE_KEY];
      if (!data) return CURRENT_VERSION;
      return data.version || CURRENT_VERSION;
    } catch {
      return CURRENT_VERSION;
    }
  }

  /**
   * Initialize empty metadata storage
   */
  private static createEmptyStorage(salt: string): TransactionMetadataStorageType {
    return {
      version: CURRENT_VERSION,
      metadata: {},
      salt,
    };
  }

  /**
   * Get raw metadata storage from chrome.storage
   */
  private static async getStorageRaw(): Promise<TransactionMetadataStorageType> {
    try {
      const result = await chrome.storage.local.get(METADATA_STORAGE_KEY);
      const data = result[METADATA_STORAGE_KEY];

      if (!data) {
        // No metadata exists, create empty structure
        const wallet = await WalletStorage.getWallet();
        const emptyData = this.createEmptyStorage(wallet.salt);
        await this.saveStorageRaw(emptyData);
        return emptyData;
      }

      return data as TransactionMetadataStorageType;
    } catch (error) {
      throw new Error(
        `Failed to retrieve metadata storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Save metadata storage to chrome.storage
   */
  private static async saveStorageRaw(
    data: TransactionMetadataStorageType
  ): Promise<void> {
    try {
      await chrome.storage.local.set({ [METADATA_STORAGE_KEY]: data });
    } catch (error) {
      throw new Error(
        `Failed to save metadata storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get metadata for a single transaction (decrypted)
   *
   * @param txid - Transaction ID
   * @param password - Wallet password (required for decryption)
   * @returns Decrypted metadata or null if not found
   */
  static async getMetadata(
    txid: string,
    password: string
  ): Promise<TransactionMetadata | null> {
    try {
      const storage = await this.getStorageRaw();
      const encryptedMetadata = storage.metadata[txid];

      if (!encryptedMetadata) {
        return null;
      }

      // Decrypt metadata
      const metadata = await TransactionMetadataCrypto.decryptMetadata(
        txid,
        encryptedMetadata,
        password,
        storage.salt
      );

      return metadata;
    } catch (error) {
      throw new Error(
        `Failed to get metadata for ${txid}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get all transaction metadata (decrypted)
   *
   * @param password - Wallet password (required for decryption)
   * @returns Map of txid -> decrypted metadata
   */
  static async getAllMetadata(
    password: string
  ): Promise<{ [txid: string]: TransactionMetadata }> {
    try {
      const storage = await this.getStorageRaw();

      // Decrypt all metadata
      const decryptedMap = await TransactionMetadataCrypto.decryptMetadataMap(
        storage.metadata,
        password,
        storage.salt
      );

      return decryptedMap;
    } catch (error) {
      throw new Error(
        `Failed to get all metadata: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Set or update metadata for a transaction
   *
   * @param txid - Transaction ID
   * @param metadata - Metadata to save (tags, category, notes)
   * @param password - Wallet password (required for encryption)
   */
  static async setMetadata(
    txid: string,
    metadata: Omit<TransactionMetadata, 'updatedAt'>,
    password: string
  ): Promise<void> {
    try {
      const storage = await this.getStorageRaw();

      // Encrypt metadata
      const encryptedMetadata = await TransactionMetadataCrypto.createEncryptedMetadata(
        txid,
        metadata,
        password,
        storage.salt
      );

      // Update storage
      storage.metadata[txid] = encryptedMetadata;
      await this.saveStorageRaw(storage);
    } catch (error) {
      throw new Error(
        `Failed to set metadata for ${txid}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Delete metadata for a transaction
   *
   * @param txid - Transaction ID
   */
  static async deleteMetadata(txid: string): Promise<void> {
    try {
      const storage = await this.getStorageRaw();

      if (!storage.metadata[txid]) {
        return; // Nothing to delete
      }

      // Remove from storage
      delete storage.metadata[txid];
      await this.saveStorageRaw(storage);
    } catch (error) {
      throw new Error(
        `Failed to delete metadata for ${txid}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get all unique tags across all transactions
   *
   * @param password - Wallet password (required for decryption)
   * @returns Array of unique tag strings with usage count
   */
  static async getAllTags(
    password: string
  ): Promise<Array<{ tag: string; count: number }>> {
    try {
      const allMetadata = await this.getAllMetadata(password);

      // Collect all tags with counts
      const tagCounts = new Map<string, number>();

      for (const metadata of Object.values(allMetadata)) {
        for (const tag of metadata.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }

      // Convert to array and sort by count (descending), then alphabetically
      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count; // Sort by count (most used first)
          }
          return a.tag.localeCompare(b.tag); // Then alphabetically
        });
    } catch (error) {
      throw new Error(
        `Failed to get all tags: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get all unique categories across all transactions
   *
   * @param password - Wallet password (required for decryption)
   * @returns Array of unique category strings with usage count
   */
  static async getAllCategories(
    password: string
  ): Promise<Array<{ category: string; count: number }>> {
    try {
      const allMetadata = await this.getAllMetadata(password);

      // Collect all categories with counts
      const categoryCounts = new Map<string, number>();

      for (const metadata of Object.values(allMetadata)) {
        if (metadata.category) {
          categoryCounts.set(
            metadata.category,
            (categoryCounts.get(metadata.category) || 0) + 1
          );
        }
      }

      // Convert to array and sort by count (descending), then alphabetically
      return Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => {
          if (b.count !== a.count) {
            return b.count - a.count; // Sort by count (most used first)
          }
          return a.category.localeCompare(b.category); // Then alphabetically
        });
    } catch (error) {
      throw new Error(
        `Failed to get all categories: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Search transactions by tag
   *
   * @param tag - Tag to search for
   * @param password - Wallet password (required for decryption)
   * @returns Array of transaction IDs with matching tag
   */
  static async searchByTag(tag: string, password: string): Promise<string[]> {
    try {
      const allMetadata = await this.getAllMetadata(password);

      const matchingTxids: string[] = [];

      for (const [txid, metadata] of Object.entries(allMetadata)) {
        if (metadata.tags.includes(tag)) {
          matchingTxids.push(txid);
        }
      }

      return matchingTxids;
    } catch (error) {
      throw new Error(
        `Failed to search by tag: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Search transactions by category
   *
   * @param category - Category to search for
   * @param password - Wallet password (required for decryption)
   * @returns Array of transaction IDs with matching category
   */
  static async searchByCategory(category: string, password: string): Promise<string[]> {
    try {
      const allMetadata = await this.getAllMetadata(password);

      const matchingTxids: string[] = [];

      for (const [txid, metadata] of Object.entries(allMetadata)) {
        if (metadata.category === category) {
          matchingTxids.push(txid);
        }
      }

      return matchingTxids;
    } catch (error) {
      throw new Error(
        `Failed to search by category: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Delete all metadata (for wallet reset/cleanup)
   */
  static async clearAll(): Promise<void> {
    try {
      await chrome.storage.local.remove(METADATA_STORAGE_KEY);
    } catch (error) {
      throw new Error(
        `Failed to clear all metadata: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Get raw metadata storage structure (for backup purposes)
   * Returns the encrypted metadata without decryption
   */
  static async getRawStorage(): Promise<TransactionMetadataStorageType> {
    try {
      return await this.getStorageRaw();
    } catch (error) {
      throw new Error(
        `Failed to get raw storage: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Restore metadata from backup
   *
   * @param storage - Transaction metadata storage structure
   */
  static async restoreFromBackup(
    storage: TransactionMetadataStorageType
  ): Promise<void> {
    try {
      await this.saveStorageRaw(storage);
    } catch (error) {
      throw new Error(
        `Failed to restore from backup: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
