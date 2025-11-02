/**
 * ContactMatcher Test Suite
 *
 * Comprehensive tests for contact matching utilities:
 * - ContactMatcher class instantiation and updates
 * - Single address matching (findContactByAddress)
 * - Batch address matching (findContactsByAddresses)
 * - Transaction contact matching (findContactsInTransaction)
 * - Transaction history analysis (getContactsFromTransactions)
 * - Known contact checking (isKnownContact)
 * - Statistics generation (getStatistics)
 * - Factory function (createContactMatcher)
 * - Edge cases (empty contacts, special characters, Unicode, xpub matching)
 *
 * @see src/shared/utils/contactMatcher.ts
 */

import {
  ContactMatcher,
  createContactMatcher,
  TransactionContactMatch,
} from '../contactMatcher';
import { Contact, Transaction } from '../../types';

// ============================================================================
// Test Data Factories
// ============================================================================

const createContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Contact',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  address: 'tb1q1234567890abcdef',
  addressType: 'native-segwit',
  ...overrides,
});

const createTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  txid: 'abc123',
  confirmations: 6,
  timestamp: Date.now(),
  value: 100000,
  fee: 1000,
  inputs: [
    {
      txid: 'prev123',
      vout: 0,
      address: 'tb1qsender',
      value: 101000,
    },
  ],
  outputs: [
    {
      address: 'tb1qrecipient',
      value: 100000,
      scriptPubKey: 'script123',
    },
  ],
  ...overrides,
});

// ============================================================================
// ContactMatcher Tests
// ============================================================================

describe('ContactMatcher', () => {
  // ============================================================================
  // Constructor and Update Tests
  // ============================================================================

  describe('constructor', () => {
    it('creates ContactMatcher with empty contacts', () => {
      const matcher = new ContactMatcher([]);

      expect(matcher).toBeInstanceOf(ContactMatcher);
    });

    it('creates ContactMatcher with single contact', () => {
      const contact = createContact();
      const matcher = new ContactMatcher([contact]);

      expect(matcher).toBeInstanceOf(ContactMatcher);
    });

    it('creates ContactMatcher with multiple contacts', () => {
      const contacts = [
        createContact({ id: '1', name: 'Alice' }),
        createContact({ id: '2', name: 'Bob' }),
        createContact({ id: '3', name: 'Charlie' }),
      ];
      const matcher = new ContactMatcher(contacts);

      expect(matcher).toBeInstanceOf(ContactMatcher);
    });
  });

  describe('updateContacts', () => {
    it('updates contact list', () => {
      const initialContacts = [createContact({ id: '1', name: 'Alice', address: 'tb1q111' })];
      const matcher = new ContactMatcher(initialContacts);

      const updatedContacts = [
        createContact({ id: '1', name: 'Alice Updated', address: 'tb1q111' }),
        createContact({ id: '2', name: 'Bob', address: 'tb1q222' }),
      ];
      matcher.updateContacts(updatedContacts);

      const found = matcher.findContactByAddress(updatedContacts[1].address!);
      expect(found?.name).toBe('Bob');
    });

    it('allows clearing all contacts', () => {
      const matcher = new ContactMatcher([createContact()]);
      matcher.updateContacts([]);

      const stats = matcher.getStatistics();
      expect(stats.totalContacts).toBe(0);
    });
  });

  // ============================================================================
  // findContactByAddress Tests
  // ============================================================================

  describe('findContactByAddress', () => {
    it('finds contact by exact address match', () => {
      const contact = createContact({ address: 'tb1q123abc' });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q123abc');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('returns undefined for non-existent address', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1q123abc' })]);

      const found = matcher.findContactByAddress('tb1q999xyz');

      expect(found).toBeUndefined();
    });

    it('handles case-insensitive matching', () => {
      const contact = createContact({ address: 'TB1Q123ABC' });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q123abc');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('trims whitespace from search address', () => {
      const contact = createContact({ address: 'tb1q123abc' });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('  tb1q123abc  ');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('returns undefined for empty address', () => {
      const matcher = new ContactMatcher([createContact()]);

      const found = matcher.findContactByAddress('');

      expect(found).toBeUndefined();
    });

    it('finds contact with xpub by cached address', () => {
      const contact = createContact({
        address: undefined,
        xpub: 'tpubD6NzVbkrYhZ4...',
        cachedAddresses: ['tb1q111', 'tb1q222', 'tb1q333'],
      });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q222');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('finds contact with both address and xpub by address', () => {
      const contact = createContact({
        address: 'tb1q123abc',
        xpub: 'tpubD6NzVbkrYhZ4...',
        cachedAddresses: ['tb1q111', 'tb1q222'],
      });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q123abc');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('finds contact with both address and xpub by cached address', () => {
      const contact = createContact({
        address: 'tb1q123abc',
        xpub: 'tpubD6NzVbkrYhZ4...',
        cachedAddresses: ['tb1q111', 'tb1q222'],
      });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q111');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('handles contact with empty cachedAddresses array', () => {
      const contact = createContact({
        xpub: 'tpubD6NzVbkrYhZ4...',
        cachedAddresses: [],
      });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q111');

      expect(found).toBeUndefined();
    });

    it('handles contact with undefined cachedAddresses', () => {
      const contact = createContact({
        xpub: 'tpubD6NzVbkrYhZ4...',
        cachedAddresses: undefined,
      });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q111');

      expect(found).toBeUndefined();
    });

    it('returns first matching contact when multiple match', () => {
      const contact1 = createContact({ id: '1', address: 'tb1q123' });
      const contact2 = createContact({ id: '2', address: 'tb1q123' }); // Duplicate address
      const matcher = new ContactMatcher([contact1, contact2]);

      const found = matcher.findContactByAddress('tb1q123');

      expect(found?.id).toBe('1'); // First one wins
    });

    it('handles special characters in address', () => {
      const contact = createContact({ address: 'tb1q_special-123' });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q_special-123');

      expect(found).toBeDefined();
    });

    it('handles Unicode addresses (if supported)', () => {
      const contact = createContact({ address: 'tb1q日本語123' });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q日本語123');

      expect(found).toBeDefined();
    });

    it('searches through large contact list efficiently', () => {
      const contacts = Array.from({ length: 1000 }, (_, i) =>
        createContact({ id: `contact-${i}`, address: `tb1q${i}` })
      );
      const matcher = new ContactMatcher(contacts);

      const found = matcher.findContactByAddress('tb1q999');

      expect(found).toBeDefined();
      expect(found?.id).toBe('contact-999');
    });

    it('handles contact with no address field', () => {
      const contact = createContact({ address: undefined });
      const matcher = new ContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q123');

      expect(found).toBeUndefined();
    });
  });

  // ============================================================================
  // findContactsByAddresses Tests
  // ============================================================================

  describe('findContactsByAddresses', () => {
    it('finds multiple contacts by addresses', () => {
      const contacts = [
        createContact({ id: '1', address: 'tb1q111' }),
        createContact({ id: '2', address: 'tb1q222' }),
        createContact({ id: '3', address: 'tb1q333' }),
      ];
      const matcher = new ContactMatcher(contacts);

      const result = matcher.findContactsByAddresses(['tb1q111', 'tb1q222']);

      expect(result.size).toBe(2);
      expect(result.get('tb1q111')?.id).toBe('1');
      expect(result.get('tb1q222')?.id).toBe('2');
    });

    it('returns empty map for empty address list', () => {
      const matcher = new ContactMatcher([createContact()]);

      const result = matcher.findContactsByAddresses([]);

      expect(result.size).toBe(0);
    });

    it('returns empty map when no addresses match', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1q123' })]);

      const result = matcher.findContactsByAddresses(['tb1q999', 'tb1q888']);

      expect(result.size).toBe(0);
    });

    it('only includes addresses with matches', () => {
      const contact = createContact({ address: 'tb1q111' });
      const matcher = new ContactMatcher([contact]);

      const result = matcher.findContactsByAddresses(['tb1q111', 'tb1q999']);

      expect(result.size).toBe(1);
      expect(result.has('tb1q111')).toBe(true);
      expect(result.has('tb1q999')).toBe(false);
    });

    it('handles empty string addresses', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1q123' })]);

      const result = matcher.findContactsByAddresses(['', 'tb1q123', '']);

      expect(result.size).toBe(1);
      expect(result.has('tb1q123')).toBe(true);
    });

    it('handles duplicate addresses in input', () => {
      const contact = createContact({ address: 'tb1q111' });
      const matcher = new ContactMatcher([contact]);

      const result = matcher.findContactsByAddresses(['tb1q111', 'tb1q111', 'tb1q111']);

      expect(result.size).toBe(1); // Map deduplicates
      expect(result.get('tb1q111')?.id).toBe(contact.id);
    });

    it('preserves original address case in map keys', () => {
      const contact = createContact({ address: 'tb1q123abc' });
      const matcher = new ContactMatcher([contact]);

      const result = matcher.findContactsByAddresses(['TB1Q123ABC']);

      expect(result.size).toBe(1);
      expect(result.has('TB1Q123ABC')).toBe(true);
    });
  });

  // ============================================================================
  // findContactsInTransaction Tests
  // ============================================================================

  describe('findContactsInTransaction', () => {
    it('identifies sender in incoming transaction', () => {
      const senderContact = createContact({ address: 'tb1qsender' });
      const matcher = new ContactMatcher([senderContact]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qsender', value: 100000 }],
        outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.sender).toBeDefined();
      expect(result.sender?.id).toBe(senderContact.id);
      expect(result.recipient).toBeUndefined();
      expect(result.allContacts).toHaveLength(1);
    });

    it('identifies recipient in outgoing transaction', () => {
      const recipientContact = createContact({ address: 'tb1qrecipient' });
      const matcher = new ContactMatcher([recipientContact]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qmyaddress', value: 100000 }],
        outputs: [
          { address: 'tb1qrecipient', value: 50000, scriptPubKey: 'script1' },
          { address: 'tb1qmychange', value: 49000, scriptPubKey: 'script2' },
        ],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress', 'tb1qmychange']);

      expect(result.recipient).toBeDefined();
      expect(result.recipient?.id).toBe(recipientContact.id);
      expect(result.sender).toBeUndefined();
      expect(result.allContacts).toHaveLength(1);
    });

    it('returns empty result when no contacts match', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1qother' })]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qsender', value: 100000 }],
        outputs: [{ address: 'tb1qrecipient', value: 99000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.sender).toBeUndefined();
      expect(result.recipient).toBeUndefined();
      expect(result.allContacts).toHaveLength(0);
    });

    it('excludes change addresses from recipient detection', () => {
      const changeContact = createContact({ address: 'tb1qmychange' });
      const matcher = new ContactMatcher([changeContact]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qmyaddress', value: 100000 }],
        outputs: [
          { address: 'tb1qrecipient', value: 50000, scriptPubKey: 'script1' },
          { address: 'tb1qmychange', value: 49000, scriptPubKey: 'script2' },
        ],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress', 'tb1qmychange']);

      // Change address is excluded, so no recipient found
      expect(result.recipient).toBeUndefined();
      expect(result.sender).toBeUndefined();
    });

    it('uses first matching input as sender', () => {
      const sender1 = createContact({ id: '1', address: 'tb1qsender1' });
      const sender2 = createContact({ id: '2', address: 'tb1qsender2' });
      const matcher = new ContactMatcher([sender1, sender2]);

      const tx = createTransaction({
        inputs: [
          { txid: 'prev1', vout: 0, address: 'tb1qsender1', value: 50000 },
          { txid: 'prev2', vout: 0, address: 'tb1qsender2', value: 50000 },
        ],
        outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.sender?.id).toBe('1'); // First input
    });

    it('uses first non-change output as recipient', () => {
      const recipient1 = createContact({ id: '1', address: 'tb1qrecipient1' });
      const recipient2 = createContact({ id: '2', address: 'tb1qrecipient2' });
      const matcher = new ContactMatcher([recipient1, recipient2]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qmyaddress', value: 100000 }],
        outputs: [
          { address: 'tb1qrecipient1', value: 40000, scriptPubKey: 'script1' },
          { address: 'tb1qrecipient2', value: 30000, scriptPubKey: 'script2' },
          { address: 'tb1qmychange', value: 29000, scriptPubKey: 'script3' },
        ],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress', 'tb1qmychange']);

      expect(result.recipient?.id).toBe('1'); // First non-change output
    });

    it('handles transaction with no inputs (coinbase)', () => {
      const matcher = new ContactMatcher([createContact()]);

      const tx = createTransaction({
        inputs: [],
        outputs: [{ address: 'tb1qmyaddress', value: 5000000000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.sender).toBeUndefined();
      expect(result.recipient).toBeUndefined();
    });

    it('handles transaction with input without address', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1qcontact' })]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: '', value: 100000 }],
        outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.sender).toBeUndefined();
    });

    it('handles transaction with output without address', () => {
      const matcher = new ContactMatcher([createContact()]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qmyaddress', value: 100000 }],
        outputs: [{ address: '', value: 99000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.recipient).toBeUndefined();
    });

    it('handles case-insensitive address matching in transactions', () => {
      const contact = createContact({ address: 'TB1QCONTACT' });
      const matcher = new ContactMatcher([contact]);

      const tx = createTransaction({
        inputs: [{ txid: 'prev', vout: 0, address: 'tb1qcontact', value: 100000 }],
        outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
      });

      const result = matcher.findContactsInTransaction(tx, ['tb1qmyaddress']);

      expect(result.sender).toBeDefined();
      expect(result.sender?.id).toBe(contact.id);
    });
  });

  // ============================================================================
  // getContactsFromTransactions Tests
  // ============================================================================

  describe('getContactsFromTransactions', () => {
    it('collects unique contacts from multiple transactions', () => {
      const contact1 = createContact({ id: '1', address: 'tb1qcontact1' });
      const contact2 = createContact({ id: '2', address: 'tb1qcontact2' });
      const matcher = new ContactMatcher([contact1, contact2]);

      const transactions = [
        createTransaction({
          inputs: [{ txid: 'prev1', vout: 0, address: 'tb1qcontact1', value: 100000 }],
          outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
        }),
        createTransaction({
          inputs: [{ txid: 'prev2', vout: 0, address: 'tb1qmyaddress', value: 100000 }],
          outputs: [{ address: 'tb1qcontact2', value: 99000, scriptPubKey: 'script' }],
        }),
      ];

      const result = matcher.getContactsFromTransactions(transactions, ['tb1qmyaddress']);

      expect(result).toHaveLength(2);
      expect(result.find((c) => c.id === '1')).toBeDefined();
      expect(result.find((c) => c.id === '2')).toBeDefined();
    });

    it('deduplicates contacts appearing in multiple transactions', () => {
      const contact = createContact({ address: 'tb1qcontact' });
      const matcher = new ContactMatcher([contact]);

      const transactions = [
        createTransaction({
          inputs: [{ txid: 'prev1', vout: 0, address: 'tb1qcontact', value: 100000 }],
          outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
        }),
        createTransaction({
          inputs: [{ txid: 'prev2', vout: 0, address: 'tb1qcontact', value: 50000 }],
          outputs: [{ address: 'tb1qmyaddress', value: 49000, scriptPubKey: 'script' }],
        }),
      ];

      const result = matcher.getContactsFromTransactions(transactions, ['tb1qmyaddress']);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(contact.id);
    });

    it('returns empty array for empty transaction list', () => {
      const matcher = new ContactMatcher([createContact()]);

      const result = matcher.getContactsFromTransactions([], ['tb1qmyaddress']);

      expect(result).toHaveLength(0);
    });

    it('returns empty array when no transactions match contacts', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1qcontact' })]);

      const transactions = [
        createTransaction({
          inputs: [{ txid: 'prev', vout: 0, address: 'tb1qother', value: 100000 }],
          outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
        }),
      ];

      const result = matcher.getContactsFromTransactions(transactions, ['tb1qmyaddress']);

      expect(result).toHaveLength(0);
    });

    it('handles large transaction history', () => {
      const contacts = Array.from({ length: 100 }, (_, i) =>
        createContact({ id: `${i}`, address: `tb1qcontact${i}` })
      );
      const matcher = new ContactMatcher(contacts);

      const transactions = Array.from({ length: 500 }, (_, i) =>
        createTransaction({
          inputs: [{ txid: `prev${i}`, vout: 0, address: `tb1qcontact${i % 100}`, value: 100000 }],
          outputs: [{ address: 'tb1qmyaddress', value: 99000, scriptPubKey: 'script' }],
        })
      );

      const result = matcher.getContactsFromTransactions(transactions, ['tb1qmyaddress']);

      expect(result).toHaveLength(100); // All 100 unique contacts
    });
  });

  // ============================================================================
  // isKnownContact Tests
  // ============================================================================

  describe('isKnownContact', () => {
    it('returns true for known contact address', () => {
      const contact = createContact({ address: 'tb1qknown' });
      const matcher = new ContactMatcher([contact]);

      const result = matcher.isKnownContact('tb1qknown');

      expect(result).toBe(true);
    });

    it('returns false for unknown address', () => {
      const matcher = new ContactMatcher([createContact({ address: 'tb1qknown' })]);

      const result = matcher.isKnownContact('tb1qunknown');

      expect(result).toBe(false);
    });

    it('returns true for xpub cached address', () => {
      const contact = createContact({
        xpub: 'tpubD6NzVbkrYhZ4...',
        cachedAddresses: ['tb1q111', 'tb1q222'],
      });
      const matcher = new ContactMatcher([contact]);

      const result = matcher.isKnownContact('tb1q222');

      expect(result).toBe(true);
    });

    it('returns false for empty address', () => {
      const matcher = new ContactMatcher([createContact()]);

      const result = matcher.isKnownContact('');

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // getStatistics Tests
  // ============================================================================

  describe('getStatistics', () => {
    it('returns correct statistics for empty contact list', () => {
      const matcher = new ContactMatcher([]);

      const stats = matcher.getStatistics();

      expect(stats.totalContacts).toBe(0);
      expect(stats.singleAddressContacts).toBe(0);
      expect(stats.xpubContacts).toBe(0);
      expect(stats.hybridContacts).toBe(0);
      expect(stats.totalCachedAddresses).toBe(0);
      expect(stats.averageCachedAddresses).toBe(0);
    });

    it('counts single-address contacts correctly', () => {
      const contacts = [
        createContact({ id: '1', address: 'tb1q111' }),
        createContact({ id: '2', address: 'tb1q222' }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.totalContacts).toBe(2);
      expect(stats.singleAddressContacts).toBe(2);
      expect(stats.xpubContacts).toBe(0);
      expect(stats.hybridContacts).toBe(0);
    });

    it('counts xpub-only contacts correctly', () => {
      const contacts = [
        createContact({ id: '1', address: undefined, xpub: 'tpub1...', cachedAddresses: ['tb1q1', 'tb1q2'] }),
        createContact({ id: '2', address: undefined, xpub: 'tpub2...', cachedAddresses: ['tb1q3', 'tb1q4', 'tb1q5'] }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.totalContacts).toBe(2);
      expect(stats.singleAddressContacts).toBe(0);
      expect(stats.xpubContacts).toBe(2);
      expect(stats.hybridContacts).toBe(0);
      expect(stats.totalCachedAddresses).toBe(5);
      expect(stats.averageCachedAddresses).toBe(3); // Rounded (2.5 → 3)
    });

    it('counts hybrid contacts (both address and xpub) correctly', () => {
      const contacts = [
        createContact({ id: '1', address: 'tb1q111', xpub: 'tpub1...', cachedAddresses: ['tb1q1', 'tb1q2'] }),
        createContact({ id: '2', address: 'tb1q222', xpub: 'tpub2...', cachedAddresses: ['tb1q3'] }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.totalContacts).toBe(2);
      expect(stats.singleAddressContacts).toBe(2);
      expect(stats.xpubContacts).toBe(2);
      expect(stats.hybridContacts).toBe(2);
      expect(stats.totalCachedAddresses).toBe(3);
    });

    it('handles contacts with empty cachedAddresses', () => {
      const contacts = [
        createContact({ id: '1', xpub: 'tpub1...', cachedAddresses: [] }),
        createContact({ id: '2', xpub: 'tpub2...', cachedAddresses: undefined }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.xpubContacts).toBe(2);
      expect(stats.totalCachedAddresses).toBe(0);
      expect(stats.averageCachedAddresses).toBe(0);
    });

    it('calculates average cached addresses correctly', () => {
      const contacts = [
        createContact({ id: '1', xpub: 'tpub1...', cachedAddresses: ['tb1q1'] }),
        createContact({ id: '2', xpub: 'tpub2...', cachedAddresses: ['tb1q2', 'tb1q3'] }),
        createContact({ id: '3', xpub: 'tpub3...', cachedAddresses: ['tb1q4', 'tb1q5', 'tb1q6'] }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.totalCachedAddresses).toBe(6);
      expect(stats.averageCachedAddresses).toBe(2); // 6 / 3 = 2
    });

    it('rounds average cached addresses', () => {
      const contacts = [
        createContact({ id: '1', xpub: 'tpub1...', cachedAddresses: ['tb1q1', 'tb1q2'] }),
        createContact({ id: '2', xpub: 'tpub2...', cachedAddresses: ['tb1q3', 'tb1q4', 'tb1q5'] }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.averageCachedAddresses).toBe(3); // Math.round(5 / 2) = 3
    });

    it('handles mixed contact types', () => {
      const contacts = [
        createContact({ id: '1', address: 'tb1q111' }),
        createContact({ id: '2', address: undefined, xpub: 'tpub2...', cachedAddresses: ['tb1q2'] }),
        createContact({ id: '3', address: 'tb1q333', xpub: 'tpub3...', cachedAddresses: ['tb1q3', 'tb1q4'] }),
      ];
      const matcher = new ContactMatcher(contacts);

      const stats = matcher.getStatistics();

      expect(stats.totalContacts).toBe(3);
      expect(stats.singleAddressContacts).toBe(2);
      expect(stats.xpubContacts).toBe(2);
      expect(stats.hybridContacts).toBe(1);
      expect(stats.totalCachedAddresses).toBe(3);
    });
  });

  // ============================================================================
  // createContactMatcher Factory Function Tests
  // ============================================================================

  describe('createContactMatcher', () => {
    it('creates ContactMatcher instance', () => {
      const contacts = [createContact()];

      const matcher = createContactMatcher(contacts);

      expect(matcher).toBeInstanceOf(ContactMatcher);
    });

    it('creates functional matcher', () => {
      const contact = createContact({ address: 'tb1q123' });
      const matcher = createContactMatcher([contact]);

      const found = matcher.findContactByAddress('tb1q123');

      expect(found).toBeDefined();
      expect(found?.id).toBe(contact.id);
    });

    it('creates matcher with empty contacts', () => {
      const matcher = createContactMatcher([]);

      const stats = matcher.getStatistics();
      expect(stats.totalContacts).toBe(0);
    });
  });
});
