/**
 * ContactMatcher - Utility for matching Bitcoin addresses to contacts
 *
 * Provides functions to identify which contacts are associated with specific
 * Bitcoin addresses or transactions. Supports both single-address contacts
 * and xpub contacts with multiple derived addresses.
 *
 * Features:
 * - Match single address to contact (O(n) linear search)
 * - Match multiple addresses to contacts (batch matching)
 * - Find contacts in transaction inputs/outputs
 * - Support for xpub contacts with cached addresses
 *
 * Usage:
 * ```typescript
 * const matcher = new ContactMatcher(contacts);
 * const contact = matcher.findContactByAddress('tb1q...');
 * const txContacts = matcher.findContactsInTransaction(transaction, myAddresses);
 * ```
 *
 * Performance notes:
 * - Single address lookup: O(n) where n = number of contacts
 * - Xpub address lookup: O(n * m) where m = average cached addresses per contact
 * - Future optimization: Build address→contact Map for O(1) lookup
 *
 * @see prompts/docs/plans/CONTACTS_V2_PRD.md
 */

import { Contact, Transaction } from '../types';

export interface TransactionContactMatch {
  /** Contact found in transaction inputs (sending to us) */
  sender?: Contact;
  /** Contact found in transaction outputs (receiving from us) */
  recipient?: Contact;
  /** All contacts involved (union of sender and recipient) */
  allContacts: Contact[];
}

export class ContactMatcher {
  private contacts: Contact[];

  /**
   * Create a new ContactMatcher
   *
   * @param contacts - Array of contacts to match against
   */
  constructor(contacts: Contact[]) {
    this.contacts = contacts;
  }

  /**
   * Update the contact list
   *
   * Call this when contacts change (add/edit/delete) to refresh the matcher
   *
   * @param contacts - Updated contact list
   */
  updateContacts(contacts: Contact[]): void {
    this.contacts = contacts;
  }

  /**
   * Find contact by Bitcoin address
   *
   * Checks both single-address contacts and xpub contacts' cached addresses
   *
   * @param address - Bitcoin address to search for
   * @returns Contact if found, undefined otherwise
   *
   * @example
   * const contact = matcher.findContactByAddress('tb1q...');
   * if (contact) {
   *   console.log(`Found contact: ${contact.name}`);
   * }
   */
  findContactByAddress(address: string): Contact | undefined {
    if (!address) return undefined;

    const normalizedAddress = address.trim().toLowerCase();

    for (const contact of this.contacts) {
      // Check single address
      if (contact.address?.toLowerCase() === normalizedAddress) {
        return contact;
      }

      // Check xpub cached addresses
      if (contact.cachedAddresses && contact.cachedAddresses.length > 0) {
        const hasMatch = contact.cachedAddresses.some(
          (cachedAddr) => cachedAddr.toLowerCase() === normalizedAddress
        );
        if (hasMatch) {
          return contact;
        }
      }
    }

    return undefined;
  }

  /**
   * Find contacts for multiple addresses
   *
   * Batch version of findContactByAddress for better performance
   *
   * @param addresses - Array of Bitcoin addresses
   * @returns Map of address → contact (only includes addresses with matches)
   *
   * @example
   * const addressMap = matcher.findContactsByAddresses(['tb1q...', 'tb1p...']);
   * addressMap.forEach((contact, address) => {
   *   console.log(`${address} belongs to ${contact.name}`);
   * });
   */
  findContactsByAddresses(addresses: string[]): Map<string, Contact> {
    const result = new Map<string, Contact>();

    for (const address of addresses) {
      if (!address) continue;
      const contact = this.findContactByAddress(address);
      if (contact) {
        result.set(address, contact);
      }
    }

    return result;
  }

  /**
   * Find contacts involved in a transaction
   *
   * Identifies contacts in transaction inputs (senders) and outputs (recipients)
   * by comparing addresses against user's addresses to determine direction.
   *
   * @param transaction - Transaction to analyze
   * @param userAddresses - User's own addresses (to determine if tx is incoming/outgoing)
   * @returns Object with sender, recipient, and all involved contacts
   *
   * @example
   * const match = matcher.findContactsInTransaction(tx, myAddresses);
   * if (match.sender) {
   *   console.log(`Received from: ${match.sender.name}`);
   * }
   * if (match.recipient) {
   *   console.log(`Sent to: ${match.recipient.name}`);
   * }
   */
  findContactsInTransaction(
    transaction: Transaction,
    userAddresses: string[]
  ): TransactionContactMatch {
    const result: TransactionContactMatch = {
      allContacts: [],
    };

    // Normalize user addresses for comparison
    const normalizedUserAddresses = new Set(
      userAddresses.map((addr) => addr.toLowerCase())
    );

    // Check if this is an incoming or outgoing transaction
    const isIncoming = transaction.inputs.every(
      (input) => !normalizedUserAddresses.has(input.address?.toLowerCase() || '')
    );

    if (isIncoming) {
      // Incoming: sender is in inputs
      for (const input of transaction.inputs) {
        if (input.address) {
          const contact = this.findContactByAddress(input.address);
          if (contact && !result.sender) {
            result.sender = contact;
            result.allContacts.push(contact);
            break; // Use first matching input as sender
          }
        }
      }
    } else {
      // Outgoing: recipient is in outputs (excluding change addresses)
      for (const output of transaction.outputs) {
        if (output.address && !normalizedUserAddresses.has(output.address.toLowerCase())) {
          const contact = this.findContactByAddress(output.address);
          if (contact && !result.recipient) {
            result.recipient = contact;
            result.allContacts.push(contact);
            break; // Use first non-change output as recipient
          }
        }
      }
    }

    return result;
  }

  /**
   * Get all contacts that have been involved in transactions with a specific address
   *
   * Useful for finding all contacts a user has transacted with
   *
   * @param transactions - Array of transactions to analyze
   * @param userAddresses - User's own addresses
   * @returns Array of unique contacts found in transactions
   *
   * @example
   * const transactedContacts = matcher.getContactsFromTransactions(txHistory, myAddresses);
   * console.log(`You've transacted with ${transactedContacts.length} contacts`);
   */
  getContactsFromTransactions(
    transactions: Transaction[],
    userAddresses: string[]
  ): Contact[] {
    const uniqueContacts = new Map<string, Contact>();

    for (const tx of transactions) {
      const match = this.findContactsInTransaction(tx, userAddresses);
      for (const contact of match.allContacts) {
        uniqueContacts.set(contact.id, contact);
      }
    }

    return Array.from(uniqueContacts.values());
  }

  /**
   * Check if an address belongs to any contact
   *
   * Quick boolean check without returning the contact object
   *
   * @param address - Bitcoin address to check
   * @returns true if address matches any contact, false otherwise
   *
   * @example
   * if (matcher.isKnownContact('tb1q...')) {
   *   console.log('This address is in your contacts');
   * }
   */
  isKnownContact(address: string): boolean {
    return this.findContactByAddress(address) !== undefined;
  }

  /**
   * Get contact statistics
   *
   * Returns useful metrics about the contact list
   *
   * @returns Statistics object
   *
   * @example
   * const stats = matcher.getStatistics();
   * console.log(`Total contacts: ${stats.totalContacts}`);
   * console.log(`Xpub contacts: ${stats.xpubContacts}`);
   */
  getStatistics() {
    const totalContacts = this.contacts.length;
    const singleAddressContacts = this.contacts.filter((c) => !!c.address).length;
    const xpubContacts = this.contacts.filter((c) => !!c.xpub).length;
    const hybridContacts = this.contacts.filter((c) => c.address && c.xpub).length;
    const totalCachedAddresses = this.contacts.reduce(
      (sum, c) => sum + (c.cachedAddresses?.length || 0),
      0
    );

    return {
      totalContacts,
      singleAddressContacts,
      xpubContacts,
      hybridContacts,
      totalCachedAddresses,
      averageCachedAddresses:
        xpubContacts > 0 ? Math.round(totalCachedAddresses / xpubContacts) : 0,
    };
  }
}

/**
 * Utility function to create a ContactMatcher instance
 *
 * Convenience function for one-off matching operations
 *
 * @param contacts - Array of contacts
 * @returns New ContactMatcher instance
 *
 * @example
 * const contact = createContactMatcher(contacts).findContactByAddress('tb1q...');
 */
export function createContactMatcher(contacts: Contact[]): ContactMatcher {
  return new ContactMatcher(contacts);
}
