/**
 * ContactsCrypto - Encryption/Decryption for Contact Data
 *
 * Implements AES-256-GCM encryption for sensitive contact fields:
 * - name, email, notes, category, xpub, color
 *
 * Security Architecture:
 * - Shared PBKDF2 key derivation with wallet (same password)
 * - Individual encryption per contact (unique IV per contact)
 * - Global salt shared with wallet
 * - 100,000 PBKDF2 iterations
 * - 12-byte IV for AES-GCM
 * - Authenticated encryption prevents tampering
 *
 * @see prompts/docs/plans/CONTACTS_V2_SECURITY_ARCHITECTURE.md
 */

import { Contact, EncryptedContact, EncryptedContactData } from '../../shared/types';
import { CryptoUtils } from './CryptoUtils';

export const PBKDF2_ITERATIONS = 100000;

export class ContactsCrypto {
  /**
   * Encrypt a contact's sensitive fields
   *
   * @param contact - Decrypted contact with sensitive data
   * @param password - User's wallet password
   * @param globalSalt - Global salt (shared with wallet)
   * @returns Encrypted contact for storage
   */
  static async encryptContact(
    contact: Contact,
    password: string,
    globalSalt: string
  ): Promise<EncryptedContact> {
    // Extract sensitive fields to encrypt
    const sensitiveData: EncryptedContactData = {
      name: contact.name,
      email: contact.email,
      notes: contact.notes,
      category: contact.category,
      tags: contact.tags,
      xpub: contact.xpub,
      color: contact.color,
    };

    // Serialize to JSON
    const plaintext = JSON.stringify(sensitiveData);

    // Derive encryption key from password + global salt
    const salt = new Uint8Array(CryptoUtils.base64ToArrayBuffer(globalSalt));
    const key = await CryptoUtils.deriveKey(password, salt, PBKDF2_ITERATIONS);

    // Generate unique IV for this contact
    const iv = CryptoUtils.generateIV(12);

    // Encrypt with AES-GCM
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(plaintext)
    );

    // Build encrypted contact (plaintext fields remain for lookup)
    const encryptedContact: EncryptedContact = {
      id: contact.id,
      encryptedData: CryptoUtils.arrayBufferToBase64(ciphertext),
      iv: CryptoUtils.arrayBufferToBase64(iv),

      // Plaintext fields for search/lookup
      address: contact.address,
      addressType: contact.addressType,
      xpubFingerprint: contact.xpubFingerprint,
      xpubDerivationPath: contact.xpubDerivationPath,
      cachedAddresses: contact.cachedAddresses,
      addressesLastUpdated: contact.addressesLastUpdated,

      // Plaintext metadata
      createdAt: contact.createdAt,
      updatedAt: Date.now(),
      transactionCount: contact.transactionCount,
      lastTransactionDate: contact.lastTransactionDate,
    };

    return encryptedContact;
  }

  /**
   * Decrypt a contact's sensitive fields
   *
   * @param encryptedContact - Encrypted contact from storage
   * @param password - User's wallet password
   * @param globalSalt - Global salt (shared with wallet)
   * @returns Decrypted contact with all fields
   */
  static async decryptContact(
    encryptedContact: EncryptedContact,
    password: string,
    globalSalt: string
  ): Promise<Contact> {
    try {
      // Derive decryption key from password + global salt
      const salt = new Uint8Array(CryptoUtils.base64ToArrayBuffer(globalSalt));
      const key = await CryptoUtils.deriveKey(password, salt, PBKDF2_ITERATIONS);

      // Prepare IV and ciphertext
      const iv = CryptoUtils.base64ToArrayBuffer(encryptedContact.iv);
      const ciphertext = CryptoUtils.base64ToArrayBuffer(encryptedContact.encryptedData);

      // Decrypt with AES-GCM
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      // Parse decrypted JSON
      const decryptedData: EncryptedContactData = JSON.parse(
        new TextDecoder().decode(plaintext)
      );

      // Reconstruct full contact
      const contact: Contact = {
        id: encryptedContact.id,
        name: decryptedData.name,
        email: decryptedData.email,
        notes: decryptedData.notes,
        category: decryptedData.category,
        tags: decryptedData.tags,
        xpub: decryptedData.xpub,
        color: decryptedData.color,

        // Plaintext fields
        address: encryptedContact.address,
        addressType: encryptedContact.addressType,
        xpubFingerprint: encryptedContact.xpubFingerprint,
        xpubDerivationPath: encryptedContact.xpubDerivationPath,
        cachedAddresses: encryptedContact.cachedAddresses,
        addressesLastUpdated: encryptedContact.addressesLastUpdated,

        // Metadata
        createdAt: encryptedContact.createdAt,
        updatedAt: encryptedContact.updatedAt,
        transactionCount: encryptedContact.transactionCount,
        lastTransactionDate: encryptedContact.lastTransactionDate,
      };

      return contact;
    } catch (error) {
      throw new Error(
        `Failed to decrypt contact ${encryptedContact.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Decrypt multiple contacts in bulk
   *
   * @param encryptedContacts - Array of encrypted contacts
   * @param password - User's wallet password
   * @param globalSalt - Global salt
   * @returns Array of decrypted contacts
   */
  static async decryptContacts(
    encryptedContacts: EncryptedContact[],
    password: string,
    globalSalt: string
  ): Promise<Contact[]> {
    const decryptPromises = encryptedContacts.map((ec) =>
      this.decryptContact(ec, password, globalSalt)
    );

    return Promise.all(decryptPromises);
  }

  /**
   * Re-encrypt a contact (e.g., after password change)
   *
   * @param encryptedContact - Encrypted contact with old password
   * @param oldPassword - Current wallet password
   * @param newPassword - New wallet password
   * @param globalSalt - Global salt (unchanged)
   * @returns Re-encrypted contact
   */
  static async reencryptContact(
    encryptedContact: EncryptedContact,
    oldPassword: string,
    newPassword: string,
    globalSalt: string
  ): Promise<EncryptedContact> {
    // Decrypt with old password
    const decryptedContact = await this.decryptContact(
      encryptedContact,
      oldPassword,
      globalSalt
    );

    // Encrypt with new password
    return this.encryptContact(decryptedContact, newPassword, globalSalt);
  }

  /**
   * Verify contact encryption integrity
   *
   * @param encryptedContact - Encrypted contact to verify
   * @param password - Wallet password
   * @param globalSalt - Global salt
   * @returns true if decryption succeeds (integrity OK)
   */
  static async verifyIntegrity(
    encryptedContact: EncryptedContact,
    password: string,
    globalSalt: string
  ): Promise<boolean> {
    try {
      await this.decryptContact(encryptedContact, password, globalSalt);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a new encrypted contact from plaintext data
   *
   * Convenience method that generates UUID and timestamps
   *
   * @param contactData - Contact fields (name, address, etc.)
   * @param password - Wallet password
   * @param globalSalt - Global salt
   * @returns Encrypted contact ready for storage
   */
  static async createEncryptedContact(
    contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
    password: string,
    globalSalt: string
  ): Promise<EncryptedContact> {
    const now = Date.now();
    const contact: Contact = {
      ...contactData,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    return this.encryptContact(contact, password, globalSalt);
  }
}
