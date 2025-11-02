/**
 * ContactsStorage - Contacts Data Storage Manager (v2.0)
 *
 * Manages persistent storage of contacts with encryption support.
 *
 * Version History:
 * - v1: Plaintext storage (legacy)
 * - v2: Encrypted storage with xpub support
 *
 * Security Architecture (v2):
 * - Individual contact encryption with AES-256-GCM
 * - Shared PBKDF2 key derivation with wallet (100,000 iterations)
 * - Unique IV per contact
 * - Global salt shared with wallet
 * - Plaintext fields: addresses, xpub fingerprint, cached addresses (for lookup)
 * - Encrypted fields: name, email, notes, category, xpub, color
 *
 * Migration Strategy:
 * - Automatic detection of v1 schema
 * - User-initiated migration to v2 with backup
 * - Rollback capability for failed migrations
 *
 * @see prompts/docs/plans/CONTACTS_V2_SECURITY_ARCHITECTURE.md
 * @see prompts/docs/plans/CONTACTS_V2_XPUB_INTEGRATION.md
 */

import type {
  Contact,
  ContactV1,
  ContactsData,
  ContactsDataV1,
  ContactsDataV2,
  EncryptedContact,
  ImportOptions,
  ImportResult,
  ImportError,
  ValidationResult,
} from '../../shared/types';
import {
  validateContact,
  validateCSVRow,
  sanitizeCSVField,
  escapeCSVField,
  formatCSVField,
  parseCSV,
} from '../../shared/utils/contactValidation';
import { AddressGenerator } from './AddressGenerator';
import { ContactsCrypto } from './ContactsCrypto';
import { XpubValidator } from '../bitcoin/XpubValidator';
import { XpubAddressDerivation } from '../bitcoin/XpubAddressDerivation';
import { WalletStorage } from './WalletStorage';

/**
 * Storage key for contacts data in chrome.storage.local
 */
const CONTACTS_STORAGE_KEY = 'contacts';

/**
 * Storage key for v1 backup (created before migration)
 */
const CONTACTS_V1_BACKUP_KEY = 'contacts_v1_backup';

/**
 * Current contacts storage schema version
 */
const CURRENT_VERSION = 2;

/**
 * Maximum number of contacts allowed
 */
const MAX_CONTACTS = 1000;

/**
 * Maximum CSV file size in bytes (1MB)
 */
const MAX_CSV_SIZE = 1048576;

/**
 * ContactsStorage class for managing contact persistence
 */
export class ContactsStorage {
  /**
   * Checks if contacts data exists in storage
   */
  static async hasContacts(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(CONTACTS_STORAGE_KEY);
      return !!result[CONTACTS_STORAGE_KEY];
    } catch (error) {
      throw new Error(
        `Failed to check contacts existence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get raw contacts data structure from storage (for backup purposes)
   * Returns the encrypted contacts data without decryption
   */
  static async getContactsData(): Promise<ContactsData> {
    try {
      const result = await chrome.storage.local.get(CONTACTS_STORAGE_KEY);
      const data = result[CONTACTS_STORAGE_KEY];

      if (!data) {
        // Return empty v2 structure if no data exists
        return {
          version: 2,
          contacts: [],
          salt: '',
        };
      }

      return data as ContactsData;
    } catch (error) {
      throw new Error(
        `Failed to get contacts data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current contacts schema version
   */
  static async getVersion(): Promise<1 | 2> {
    try {
      const result = await chrome.storage.local.get(CONTACTS_STORAGE_KEY);
      const data = result[CONTACTS_STORAGE_KEY];
      if (!data) return CURRENT_VERSION;
      return (data.version as 1 | 2) || 1;
    } catch {
      return CURRENT_VERSION;
    }
  }

  /**
   * Check if migration to v2 is needed
   */
  static async needsMigration(): Promise<boolean> {
    const version = await this.getVersion();
    return version === 1;
  }

  /**
   * Initialize empty contacts storage (v2)
   */
  private static createEmptyContactsDataV2(salt: string): ContactsDataV2 {
    return {
      version: 2,
      contacts: [],
      salt,
    };
  }

  /**
   * Get contacts data from storage (handles both v1 and v2)
   */
  private static async getContactsDataRaw(): Promise<ContactsData> {
    try {
      const result = await chrome.storage.local.get(CONTACTS_STORAGE_KEY);
      const data = result[CONTACTS_STORAGE_KEY];

      if (!data) {
        // No contacts exist, create v2 structure
        const wallet = await WalletStorage.getWallet();
        const emptyData = this.createEmptyContactsDataV2(wallet.salt);
        await this.saveContactsDataRaw(emptyData);
        return emptyData;
      }

      return data as ContactsData;
    } catch (error) {
      throw new Error(
        `Failed to retrieve contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Save contacts data to storage
   */
  private static async saveContactsDataRaw(data: ContactsData): Promise<void> {
    try {
      await chrome.storage.local.set({ [CONTACTS_STORAGE_KEY]: data });
    } catch (error) {
      throw new Error(
        `Failed to save contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all contacts (decrypted if v2)
   *
   * @param password - Wallet password (required for v2)
   * @param sortBy - Optional sort field
   * @returns Array of decrypted contacts
   */
  static async getContacts(
    password?: string,
    sortBy?: 'name' | 'date' | 'transactionCount' | 'color'
  ): Promise<Contact[]> {
    try {
      const data = await this.getContactsDataRaw();

      let contacts: Contact[];

      if (data.version === 1) {
        // v1: Plaintext contacts (legacy)
        contacts = (data as ContactsDataV1).contacts as Contact[];
      } else {
        // v2: Encrypted contacts
        if (!password) {
          throw new Error('Password required to decrypt contacts');
        }

        const encryptedContacts = (data as ContactsDataV2).contacts;
        const salt = (data as ContactsDataV2).salt;

        // Decrypt all contacts
        contacts = await ContactsCrypto.decryptContacts(
          encryptedContacts,
          password,
          salt
        );
      }

      // Apply sorting
      switch (sortBy) {
        case 'name':
          contacts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'date':
          contacts.sort((a, b) => b.createdAt - a.createdAt);
          break;
        case 'transactionCount':
          contacts.sort((a, b) => (b.transactionCount || 0) - (a.transactionCount || 0));
          break;
        case 'color':
          contacts.sort((a, b) => (a.color || 'blue').localeCompare(b.color || 'blue'));
          break;
        default:
          contacts.sort((a, b) => a.name.localeCompare(b.name));
      }

      return contacts;
    } catch (error) {
      throw new Error(
        `Failed to get contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get contact by ID (decrypted if v2)
   */
  static async getContactById(id: string, password?: string): Promise<Contact | null> {
    try {
      const contacts = await this.getContacts(password);
      return contacts.find((c) => c.id === id) || null;
    } catch (error) {
      throw new Error(
        `Failed to get contact by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get contact by Bitcoin address (works with encrypted contacts)
   */
  static async getContactByAddress(address: string, password?: string): Promise<Contact | null> {
    try {
      const data = await this.getContactsDataRaw();

      if (data.version === 1) {
        const contacts = (data as ContactsDataV1).contacts;
        const found = contacts.find((c) => c.address === address);
        return found ? (found as Contact) : null;
      } else {
        // v2: Check plaintext address field or cached addresses
        const encryptedContacts = (data as ContactsDataV2).contacts;
        const found = encryptedContacts.find(
          (c) => c.address === address || c.cachedAddresses?.includes(address)
        );

        if (!found || !password) return null;

        // Decrypt and return
        const salt = (data as ContactsDataV2).salt;
        return ContactsCrypto.decryptContact(found, password, salt);
      }
    } catch (error) {
      throw new Error(
        `Failed to get contact by address: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Search contacts by name, address, email, or category
   */
  static async searchContacts(query: string, password?: string): Promise<Contact[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const contacts = await this.getContacts(password);
      const lowerQuery = query.toLowerCase();

      return contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          c.address?.toLowerCase().includes(lowerQuery) ||
          c.email?.toLowerCase().includes(lowerQuery) ||
          c.category?.toLowerCase().includes(lowerQuery) ||
          c.xpubFingerprint?.toLowerCase().includes(lowerQuery) ||
          c.cachedAddresses?.some((addr) => addr.toLowerCase().includes(lowerQuery)) ||
          (c.tags && Object.keys(c.tags).some((key) => key.toLowerCase().includes(lowerQuery))) ||
          (c.tags && Object.values(c.tags).some((value) => value.toLowerCase().includes(lowerQuery)))
      );
    } catch (error) {
      throw new Error(
        `Failed to search contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Add new contact (encrypted in v2)
   *
   * @param contact - Contact data (without id, timestamps)
   * @param password - Wallet password (required for v2)
   * @param network - Network for address/xpub validation
   * @returns Created contact with ID and timestamps
   */
  static async addContact(
    contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>,
    password: string,
    network: 'testnet' | 'mainnet'
  ): Promise<Contact> {
    try {
      const data = await this.getContactsDataRaw();

      // Check contact limit
      if (data.contacts.length >= MAX_CONTACTS) {
        throw new Error(`Contact limit reached (${MAX_CONTACTS} contacts maximum)`);
      }

      // Validate contact
      await this.validateContactData(contact, network);

      // Derive addresses if xpub provided
      let cachedAddresses: string[] | undefined;
      let xpubFingerprint: string | undefined;
      let xpubDerivationPath: string | undefined;

      if (contact.xpub) {
        const validation = XpubValidator.validate(contact.xpub, network);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid xpub');
        }

        xpubFingerprint = validation.fingerprint;
        xpubDerivationPath = validation.derivationPathTemplate;

        // Derive initial 20 addresses
        const derivedAddresses = XpubAddressDerivation.deriveInitialAddresses(
          contact.xpub,
          network
        );
        cachedAddresses = derivedAddresses.map((d) => d.address);
      }

      // Create contact with metadata
      const now = Date.now();
      const newContact: Contact = {
        ...contact,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        xpubFingerprint,
        xpubDerivationPath,
        cachedAddresses,
        addressesLastUpdated: cachedAddresses ? now : undefined,
      };

      if (data.version === 2) {
        // v2: Encrypt contact
        const salt = (data as ContactsDataV2).salt;
        const encryptedContact = await ContactsCrypto.encryptContact(
          newContact,
          password,
          salt
        );

        (data as ContactsDataV2).contacts.push(encryptedContact);
      } else {
        // v1: Plaintext (should not happen, but handle gracefully)
        (data as ContactsDataV1).contacts.push(newContact as ContactV1);
      }

      await this.saveContactsDataRaw(data);
      return newContact;
    } catch (error) {
      throw new Error(
        `Failed to add contact: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update existing contact (re-encrypts in v2)
   */
  static async updateContact(
    id: string,
    updates: Partial<Omit<Contact, 'id' | 'createdAt'>>,
    password: string,
    network: 'testnet' | 'mainnet'
  ): Promise<Contact> {
    try {
      const data = await this.getContactsDataRaw();

      // Find contact
      const index = data.contacts.findIndex((c) => c.id === id);
      if (index === -1) {
        throw new Error(`Contact with ID ${id} not found`);
      }

      // Get existing contact
      let existingContact: Contact;
      if (data.version === 2) {
        const salt = (data as ContactsDataV2).salt;
        existingContact = await ContactsCrypto.decryptContact(
          (data as ContactsDataV2).contacts[index],
          password,
          salt
        );
      } else {
        existingContact = (data as ContactsDataV1).contacts[index] as Contact;
      }

      // Merge updates
      const updatedContact: Contact = {
        ...existingContact,
        ...updates,
        id, // Preserve ID
        createdAt: existingContact.createdAt, // Preserve creation date
        updatedAt: Date.now(),
      };

      // Validate updated contact
      await this.validateContactData(updatedContact, network);

      // Update derived addresses if xpub changed
      if (updates.xpub && updates.xpub !== existingContact.xpub) {
        const validation = XpubValidator.validate(updates.xpub, network);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid xpub');
        }

        updatedContact.xpubFingerprint = validation.fingerprint;
        updatedContact.xpubDerivationPath = validation.derivationPathTemplate;

        const derivedAddresses = XpubAddressDerivation.deriveInitialAddresses(
          updates.xpub,
          network
        );
        updatedContact.cachedAddresses = derivedAddresses.map((d) => d.address);
        updatedContact.addressesLastUpdated = Date.now();
      }

      // Save updated contact
      if (data.version === 2) {
        const salt = (data as ContactsDataV2).salt;
        const encryptedContact = await ContactsCrypto.encryptContact(
          updatedContact,
          password,
          salt
        );
        (data as ContactsDataV2).contacts[index] = encryptedContact;
      } else {
        (data as ContactsDataV1).contacts[index] = updatedContact as ContactV1;
      }

      await this.saveContactsDataRaw(data);
      return updatedContact;
    } catch (error) {
      throw new Error(
        `Failed to update contact: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete contact by ID
   */
  static async deleteContact(id: string): Promise<void> {
    try {
      const data = await this.getContactsDataRaw();
      const initialLength = data.contacts.length;
      data.contacts = data.contacts.filter((c) => c.id !== id);

      if (data.contacts.length === initialLength) {
        throw new Error(`Contact with ID ${id} not found`);
      }

      await this.saveContactsDataRaw(data);
    } catch (error) {
      throw new Error(
        `Failed to delete contact: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Expand cached addresses for xpub contact (20 → 100)
   */
  static async expandContactAddresses(
    id: string,
    password: string,
    network: 'testnet' | 'mainnet',
    newGapLimit: number = 50
  ): Promise<Contact> {
    try {
      const contact = await this.getContactById(id, password);
      if (!contact) {
        throw new Error(`Contact with ID ${id} not found`);
      }

      if (!contact.xpub) {
        throw new Error('Contact does not have an xpub');
      }

      // Derive expanded addresses
      const currentCount = contact.cachedAddresses?.length || 0;
      const newAddresses = XpubAddressDerivation.expandAddresses(
        contact.xpub,
        network,
        currentCount,
        newGapLimit
      );

      // Update cached addresses
      const updatedCachedAddresses = [
        ...(contact.cachedAddresses || []),
        ...newAddresses.map((d) => d.address),
      ];

      return this.updateContact(
        id,
        {
          cachedAddresses: updatedCachedAddresses,
          addressesLastUpdated: Date.now(),
        },
        password,
        network
      );
    } catch (error) {
      throw new Error(
        `Failed to expand addresses: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate contact data before storage
   */
  private static async validateContactData(
    contact: Partial<Contact>,
    network: 'testnet' | 'mainnet'
  ): Promise<void> {
    // Validate required fields
    if (!contact.name || contact.name.trim().length === 0) {
      throw new Error('Contact name is required');
    }

    if (contact.name.length > 50) {
      throw new Error('Contact name must be 50 characters or less');
    }

    // Validate that at least one address method is provided
    if (!contact.address && !contact.xpub) {
      throw new Error('Either address or xpub is required');
    }

    // Validate address if provided
    if (contact.address) {
      const addressGenerator = new AddressGenerator(network);
      if (!addressGenerator.validateAddress(contact.address)) {
        throw new Error('Invalid Bitcoin address');
      }
    }

    // Validate xpub if provided
    if (contact.xpub) {
      const validation = XpubValidator.validate(contact.xpub, network);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid xpub');
      }
    }

    // Validate email if provided
    if (contact.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contact.email)) {
        throw new Error('Invalid email address format');
      }
      if (contact.email.length > 100) {
        throw new Error('Email must be 100 characters or less');
      }
    }

    // Validate optional fields
    if (contact.notes && contact.notes.length > 500) {
      throw new Error('Notes must be 500 characters or less');
    }

    if (contact.category && contact.category.length > 30) {
      throw new Error('Category must be 30 characters or less');
    }
  }

  /**
   * Export contacts to CSV
   */
  static async exportToCSV(password?: string): Promise<string> {
    try {
      const contacts = await this.getContacts(password, 'name');

      // CSV header
      const header = 'Name,Address,Email,Category,Notes,Color,Xpub,Xpub Fingerprint,Tags';
      const rows = [header];

      // Add contact rows
      for (const contact of contacts) {
        // Serialize tags to Base64-encoded JSON string
        // (Base64 encoding avoids CSV parsing issues with commas and quotes in JSON)
        let tagsBase64 = '';
        if (contact.tags && Object.keys(contact.tags).length > 0) {
          const tagsJson = JSON.stringify(contact.tags);
          tagsBase64 = Buffer.from(tagsJson, 'utf-8').toString('base64');
        }

        const row = [
          formatCSVField(contact.name),
          formatCSVField(contact.address || ''),
          formatCSVField(contact.email || ''),
          formatCSVField(contact.category || ''),
          formatCSVField(contact.notes || ''),
          formatCSVField(contact.color || ''),
          formatCSVField(contact.xpub || ''),
          formatCSVField(contact.xpubFingerprint || ''),
          formatCSVField(tagsBase64),
        ].join(',');
        rows.push(row);
      }

      return rows.join('\n');
    } catch (error) {
      throw new Error(
        `Failed to export contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Import contacts from CSV
   */
  static async importFromCSV(
    csvContent: string,
    password: string,
    network: 'testnet' | 'mainnet',
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      const { skipDuplicates = true, overwriteExisting = false, validateOnly = false } = options;

      // Parse CSV
      const rows = parseCSV(csvContent);
      if (rows.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Validate header (get column names from first row object)
      const header = Object.keys(rows[0]);
      const expectedColumns = ['name', 'address', 'email', 'category', 'notes', 'color'];
      const hasValidHeader = expectedColumns.some((col) =>
        header.some((h) => h.toLowerCase().includes(col))
      );

      if (!hasValidHeader) {
        throw new Error('Invalid CSV format. Expected columns: Name, Address, Email, Category, Notes, Color');
      }

      const dataRows = rows;
      const result: ImportResult = {
        success: true,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [],
      };

      // Get existing contacts
      const existingContacts = await this.getContacts(password);

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const lineNumber = i + 2; // +2 for header and 0-index

        try {
          // Extract values from row object (parseCSV returns objects, not arrays)
          const name = row.name || row.Name || '';
          const address = row.address || row.Address || '';
          const email = row.email || row.Email || '';
          const category = row.category || row.Category || '';
          const notes = row.notes || row.Notes || '';
          const color = row.color || row.Color || '';
          const xpub = row.xpub || row.Xpub || '';
          const tagsStr = row.tags || row.Tags || '';

          // Parse tags from Base64-encoded JSON string
          let tags: { [key: string]: string } | undefined = undefined;
          if (tagsStr && tagsStr.trim()) {
            try {
              // Decode from Base64
              const tagsJson = Buffer.from(tagsStr.trim(), 'base64').toString('utf-8');
              const parsedTags = JSON.parse(tagsJson);

              // Validate tags object structure
              if (typeof parsedTags === 'object' && !Array.isArray(parsedTags) && parsedTags !== null) {
                tags = {};
                for (const [key, value] of Object.entries(parsedTags)) {
                  // Validate key and value are strings
                  if (typeof key === 'string' && typeof value === 'string') {
                    // Validate max lengths (same as manual tag entry)
                    if (key.length > 30) {
                      result.errors.push({
                        line: lineNumber,
                        name,
                        address,
                        reason: `Tag key "${key}" exceeds maximum length of 30 characters`,
                      });
                      continue;
                    }
                    if ((value as string).length > 100) {
                      result.errors.push({
                        line: lineNumber,
                        name,
                        address,
                        reason: `Tag value for "${key}" exceeds maximum length of 100 characters`,
                      });
                      continue;
                    }
                    tags[key] = value as string;
                  }
                }
                // If no valid tags were added, set to undefined
                if (Object.keys(tags).length === 0) {
                  tags = undefined;
                }
              }
            } catch (parseError) {
              // Invalid Base64 or JSON - add warning but continue with import
              result.errors.push({
                line: lineNumber,
                name,
                address,
                reason: `Invalid tags data: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
              });
            }
          }

          // Skip empty rows
          if (!name && !address && !xpub) {
            continue;
          }

          // Check for duplicates (check both address and xpub)
          const duplicate = existingContacts.find((c) =>
            (address && c.address === address) || (xpub && c.xpub === xpub)
          );
          if (duplicate && skipDuplicates && !overwriteExisting) {
            result.skipped++;
            continue;
          }

          // Validate and create contact
          if (!validateOnly) {
            const contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
              name,
              address: address || undefined,
              xpub: xpub || undefined,
              email: email || undefined,
              category: category || undefined,
              notes: notes || undefined,
              color: (color as any) || undefined,
              tags,
            };

            if (duplicate && overwriteExisting) {
              await this.updateContact(duplicate.id, contactData, password, network);
            } else {
              await this.addContact(contactData, password, network);
            }
          }

          result.imported++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            line: lineNumber,
            name: row.name || row.Name || '',
            address: row.address || row.Address || '',
            reason: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      result.success = result.failed === 0;
      return result;
    } catch (error) {
      throw new Error(
        `Failed to import contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create backup of v1 contacts before migration
   */
  static async createV1Backup(): Promise<void> {
    try {
      const data = await this.getContactsDataRaw();
      if (data.version !== 1) {
        throw new Error('Cannot backup non-v1 contacts');
      }

      await chrome.storage.local.set({ [CONTACTS_V1_BACKUP_KEY]: data });
    } catch (error) {
      throw new Error(
        `Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Restore v1 backup (rollback migration)
   */
  static async restoreV1Backup(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(CONTACTS_V1_BACKUP_KEY);
      const backup = result[CONTACTS_V1_BACKUP_KEY];

      if (!backup) {
        throw new Error('No backup found');
      }

      await this.saveContactsDataRaw(backup);
      await chrome.storage.local.remove(CONTACTS_V1_BACKUP_KEY);
    } catch (error) {
      throw new Error(
        `Failed to restore backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete all contacts (for testing or reset)
   */
  static async deleteAll(): Promise<void> {
    try {
      await chrome.storage.local.remove(CONTACTS_STORAGE_KEY);
    } catch (error) {
      throw new Error(
        `Failed to delete all contacts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Migrate contacts from v1 (plaintext) to v2 (encrypted)
   *
   * Migration Process:
   * 1. Create backup of v1 contacts
   * 2. Decrypt wallet to get salt
   * 3. Encrypt each contact individually
   * 4. Save as v2 with global salt
   * 5. Return migration summary
   *
   * @param password - Wallet password for encryption
   * @returns Migration result with summary
   */
  static async migrateV1ToV2(password: string): Promise<{
    success: boolean;
    contactsProcessed: number;
    errors: string[];
  }> {
    try {
      const data = await this.getContactsDataRaw();

      // Verify we're on v1
      if (data.version !== 1) {
        throw new Error(`Cannot migrate from version ${data.version}. Migration only supports v1 to v2.`);
      }

      const v1Data = data as ContactsDataV1;
      const contactsToMigrate = v1Data.contacts;

      // Create backup before migration
      await this.createV1Backup();

      // Get wallet salt for encryption
      const wallet = await WalletStorage.getWallet();
      const salt = wallet.salt;

      // Encrypt each contact
      const encryptedContacts: EncryptedContact[] = [];
      const errors: string[] = [];

      for (const v1Contact of contactsToMigrate) {
        try {
          // Convert v1 contact to v2 format
          const contact: Contact = {
            ...v1Contact,
            // v2 fields default to undefined if not present
            email: undefined,
            xpub: undefined,
            xpubFingerprint: undefined,
            xpubDerivationPath: undefined,
            cachedAddresses: undefined,
            addressesLastUpdated: undefined,
            color: 'blue', // Default color for migrated contacts
          };

          // Encrypt contact
          const encryptedContact = await ContactsCrypto.encryptContact(
            contact,
            password,
            salt
          );

          encryptedContacts.push(encryptedContact);
        } catch (error) {
          errors.push(
            `Failed to migrate contact ${v1Contact.name}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`
          );
        }
      }

      // Create v2 data structure
      const v2Data: ContactsDataV2 = {
        version: 2,
        contacts: encryptedContacts,
        salt,
      };

      // Save migrated data
      await this.saveContactsDataRaw(v2Data);

      return {
        success: errors.length === 0,
        contactsProcessed: encryptedContacts.length,
        errors,
      };
    } catch (error) {
      throw new Error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get migration status information
   *
   * @returns Migration status details
   */
  static async getMigrationStatus(): Promise<{
    needsMigration: boolean;
    currentVersion: 1 | 2;
    contactCount: number;
    hasBackup: boolean;
  }> {
    try {
      const version = await this.getVersion();
      const needsMigration = version === 1;

      // Get contact count
      const data = await this.getContactsDataRaw();
      const contactCount = data.contacts.length;

      // Check if backup exists
      const result = await chrome.storage.local.get(CONTACTS_V1_BACKUP_KEY);
      const hasBackup = !!result[CONTACTS_V1_BACKUP_KEY];

      return {
        needsMigration,
        currentVersion: version,
        contactCount,
        hasBackup,
      };
    } catch (error) {
      throw new Error(
        `Failed to get migration status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verify migration integrity
   *
   * Checks that all contacts can be decrypted successfully
   *
   * @param password - Wallet password
   * @returns true if all contacts decrypt successfully
   */
  static async verifyMigrationIntegrity(password: string): Promise<boolean> {
    try {
      const data = await this.getContactsDataRaw();

      if (data.version !== 2) {
        return false;
      }

      const v2Data = data as ContactsDataV2;

      // Try to decrypt all contacts
      for (const encryptedContact of v2Data.contacts) {
        const isValid = await ContactsCrypto.verifyIntegrity(
          encryptedContact,
          password,
          v2Data.salt
        );

        if (!isValid) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Rollback migration (restore v1 backup)
   *
   * Use this if migration fails or user wants to revert
   *
   * @returns Rollback result
   */
  static async rollbackMigration(): Promise<{
    success: boolean;
    contactsRestored: number;
    error?: string;
  }> {
    try {
      // Check if backup exists
      const result = await chrome.storage.local.get(CONTACTS_V1_BACKUP_KEY);
      const backup = result[CONTACTS_V1_BACKUP_KEY];

      if (!backup) {
        return {
          success: false,
          contactsRestored: 0,
          error: 'No backup found. Cannot rollback migration.',
        };
      }

      const v1Data = backup as ContactsDataV1;
      const contactCount = v1Data.contacts.length;

      // Restore backup
      await this.restoreV1Backup();

      return {
        success: true,
        contactsRestored: contactCount,
      };
    } catch (error) {
      return {
        success: false,
        contactsRestored: 0,
        error: error instanceof Error ? error.message : 'Unknown error during rollback',
      };
    }
  }

  /**
   * Delete migration backup
   *
   * Should only be called after successful migration and verification
   */
  static async deleteBackup(): Promise<void> {
    try {
      await chrome.storage.local.remove(CONTACTS_V1_BACKUP_KEY);
    } catch (error) {
      throw new Error(
        `Failed to delete backup: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
