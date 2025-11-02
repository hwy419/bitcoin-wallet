/**
 * TransactionMetadataCrypto - Encryption/Decryption for Transaction Metadata
 *
 * Implements AES-256-GCM encryption for transaction metadata fields:
 * - tags, category, notes
 *
 * Security Architecture:
 * - Shared PBKDF2 key derivation with wallet and contacts (same password)
 * - Individual encryption per transaction (unique IV per transaction)
 * - Global salt shared with wallet and contacts
 * - 100,000 PBKDF2 iterations
 * - 12-byte IV for AES-GCM
 * - Authenticated encryption prevents tampering
 *
 * Usage:
 * - All metadata fields are encrypted to protect user privacy
 * - updatedAt remains plaintext for efficient sorting/filtering
 * - Wallet must be unlocked to view or edit metadata
 */

import {
  TransactionMetadata,
  EncryptedTransactionMetadata,
  EncryptedTransactionMetadataData,
} from '../../shared/types';
import { CryptoUtils } from './CryptoUtils';

export const PBKDF2_ITERATIONS = 100000;

export class TransactionMetadataCrypto {
  /**
   * Encrypt transaction metadata
   *
   * @param txid - Transaction ID
   * @param metadata - Decrypted metadata with sensitive data
   * @param password - User's wallet password
   * @param globalSalt - Global salt (shared with wallet/contacts)
   * @returns Encrypted metadata for storage
   */
  static async encryptMetadata(
    txid: string,
    metadata: TransactionMetadata,
    password: string,
    globalSalt: string
  ): Promise<EncryptedTransactionMetadata> {
    // Extract sensitive fields to encrypt
    const sensitiveData: EncryptedTransactionMetadataData = {
      tags: metadata.tags,
      category: metadata.category,
      notes: metadata.notes,
    };

    // Serialize to JSON
    const plaintext = JSON.stringify(sensitiveData);

    // Derive encryption key from password + global salt
    const salt = new Uint8Array(CryptoUtils.base64ToArrayBuffer(globalSalt));
    const key = await CryptoUtils.deriveKey(password, salt, PBKDF2_ITERATIONS);

    // Generate unique IV for this transaction metadata
    const iv = CryptoUtils.generateIV(12);

    // Encrypt with AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext)
    );

    // Build encrypted metadata (updatedAt remains plaintext for sorting)
    const encryptedMetadata: EncryptedTransactionMetadata = {
      encryptedData: CryptoUtils.arrayBufferToBase64(ciphertext),
      iv: CryptoUtils.arrayBufferToBase64(iv),
      updatedAt: Date.now(),
    };

    return encryptedMetadata;
  }

  /**
   * Decrypt transaction metadata
   *
   * @param txid - Transaction ID
   * @param encryptedMetadata - Encrypted metadata from storage
   * @param password - User's wallet password
   * @param globalSalt - Global salt (shared with wallet/contacts)
   * @returns Decrypted metadata with all fields
   */
  static async decryptMetadata(
    txid: string,
    encryptedMetadata: EncryptedTransactionMetadata,
    password: string,
    globalSalt: string
  ): Promise<TransactionMetadata> {
    try {
      // Derive decryption key from password + global salt
      const salt = new Uint8Array(CryptoUtils.base64ToArrayBuffer(globalSalt));
      const key = await CryptoUtils.deriveKey(password, salt, PBKDF2_ITERATIONS);

      // Prepare IV and ciphertext
      const iv = CryptoUtils.base64ToArrayBuffer(encryptedMetadata.iv);
      const ciphertext = CryptoUtils.base64ToArrayBuffer(encryptedMetadata.encryptedData);

      // Decrypt with AES-GCM
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      // Parse decrypted JSON
      const decryptedData: EncryptedTransactionMetadataData = JSON.parse(
        new TextDecoder().decode(plaintext)
      );

      // Reconstruct full metadata
      const metadata: TransactionMetadata = {
        tags: decryptedData.tags,
        category: decryptedData.category,
        notes: decryptedData.notes,
        updatedAt: encryptedMetadata.updatedAt,
      };

      return metadata;
    } catch (error) {
      throw new Error(
        `Failed to decrypt metadata for transaction ${txid}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Decrypt multiple transaction metadata in bulk
   *
   * @param metadataMap - Map of txid -> encrypted metadata
   * @param password - User's wallet password
   * @param globalSalt - Global salt
   * @returns Map of txid -> decrypted metadata
   */
  static async decryptMetadataMap(
    metadataMap: { [txid: string]: EncryptedTransactionMetadata },
    password: string,
    globalSalt: string
  ): Promise<{ [txid: string]: TransactionMetadata }> {
    const decryptedMap: { [txid: string]: TransactionMetadata } = {};

    const decryptPromises = Object.entries(metadataMap).map(
      async ([txid, encryptedMetadata]) => {
        const metadata = await this.decryptMetadata(
          txid,
          encryptedMetadata,
          password,
          globalSalt
        );
        decryptedMap[txid] = metadata;
      }
    );

    await Promise.all(decryptPromises);

    return decryptedMap;
  }

  /**
   * Re-encrypt transaction metadata (e.g., after password change)
   *
   * @param txid - Transaction ID
   * @param encryptedMetadata - Encrypted metadata with old password
   * @param oldPassword - Current wallet password
   * @param newPassword - New wallet password
   * @param globalSalt - Global salt (unchanged)
   * @returns Re-encrypted metadata
   */
  static async reencryptMetadata(
    txid: string,
    encryptedMetadata: EncryptedTransactionMetadata,
    oldPassword: string,
    newPassword: string,
    globalSalt: string
  ): Promise<EncryptedTransactionMetadata> {
    // Decrypt with old password
    const decryptedMetadata = await this.decryptMetadata(
      txid,
      encryptedMetadata,
      oldPassword,
      globalSalt
    );

    // Encrypt with new password
    return this.encryptMetadata(txid, decryptedMetadata, newPassword, globalSalt);
  }

  /**
   * Verify metadata encryption integrity
   *
   * @param txid - Transaction ID
   * @param encryptedMetadata - Encrypted metadata to verify
   * @param password - Wallet password
   * @param globalSalt - Global salt
   * @returns true if decryption succeeds (integrity OK)
   */
  static async verifyIntegrity(
    txid: string,
    encryptedMetadata: EncryptedTransactionMetadata,
    password: string,
    globalSalt: string
  ): Promise<boolean> {
    try {
      await this.decryptMetadata(txid, encryptedMetadata, password, globalSalt);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create new encrypted metadata from plaintext data
   *
   * Convenience method that generates timestamps
   *
   * @param txid - Transaction ID
   * @param metadataData - Metadata fields (tags, category, notes)
   * @param password - Wallet password
   * @param globalSalt - Global salt
   * @returns Encrypted metadata ready for storage
   */
  static async createEncryptedMetadata(
    txid: string,
    metadataData: Omit<TransactionMetadata, 'updatedAt'>,
    password: string,
    globalSalt: string
  ): Promise<EncryptedTransactionMetadata> {
    const metadata: TransactionMetadata = {
      ...metadataData,
      updatedAt: Date.now(),
    };

    return this.encryptMetadata(txid, metadata, password, globalSalt);
  }
}
