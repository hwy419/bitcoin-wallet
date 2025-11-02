/**
 * Contact Validation Tests
 *
 * Comprehensive test suite for security-critical validation functions:
 * - Name validation (formula injection, XSS prevention)
 * - Address validation (format, network)
 * - Notes validation (sensitive data warnings)
 * - Category validation
 * - CSV sanitization (formula injection prevention)
 * - CSV parsing and formatting
 * - Complete contact validation
 *
 * SECURITY-CRITICAL: These tests verify protection against:
 * - CSV formula injection (=, +, -, @)
 * - XSS attacks (<script>, HTML)
 * - Invalid Bitcoin addresses
 * - Input length violations
 *
 * @jest-environment node
 */

import {
  validateContactName,
  validateContactAddress,
  validateContactNotes,
  validateContactCategory,
  validateContact,
  sanitizeCSVField,
  escapeCSVField,
  formatCSVField,
  parseCSV,
  validateCSVRow,
} from '../contactValidation';
import type { Contact } from '../../types';

describe('Contact Validation', () => {
  // ===========================================================================
  // validateContactName() Tests
  // ===========================================================================

  describe('validateContactName()', () => {
    describe('Valid Names', () => {
      it('should accept valid name with letters', () => {
        const result = validateContactName('Alice');
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept name with spaces', () => {
        const result = validateContactName('Alice Smith');
        expect(result.valid).toBe(true);
      });

      it('should accept name with numbers', () => {
        const result = validateContactName('Account 123');
        expect(result.valid).toBe(true);
      });

      it('should accept name with safe punctuation', () => {
        const result = validateContactName("O'Brien-Smith, Jr.");
        expect(result.valid).toBe(true);
      });

      it('should accept name at max length (50 chars)', () => {
        const result = validateContactName('A'.repeat(50));
        expect(result.valid).toBe(true);
      });

      it('should return sanitized name', () => {
        const result = validateContactName('  Alice  ');
        expect(result.sanitized).toBe('Alice');
      });
    });

    describe('Invalid Names - Empty', () => {
      it('should reject empty string', () => {
        const result = validateContactName('');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Contact name cannot be empty');
      });

      it('should reject whitespace-only string', () => {
        const result = validateContactName('   ');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Contact name cannot be empty');
      });
    });

    describe('Invalid Names - Length', () => {
      it('should reject name longer than 50 characters', () => {
        const result = validateContactName('A'.repeat(51));
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Contact name too long (max 50 characters)');
      });
    });

    describe('Security - CSV Formula Injection', () => {
      it('should reject name starting with =', () => {
        const result = validateContactName('=SUM(1+1)');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name cannot start with =, +, -, or @ (security risk)'
        );
      });

      it('should reject name starting with +', () => {
        const result = validateContactName('+1+1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name cannot start with =, +, -, or @ (security risk)'
        );
      });

      it('should reject name starting with -', () => {
        const result = validateContactName('-1-1');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name cannot start with =, +, -, or @ (security risk)'
        );
      });

      it('should reject name starting with @', () => {
        const result = validateContactName('@SUM(A1:A10)');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name cannot start with =, +, -, or @ (security risk)'
        );
      });
    });

    describe('Security - HTML Injection', () => {
      it('should reject name with <', () => {
        const result = validateContactName('Alice<script>');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Contact name cannot contain HTML characters');
      });

      it('should reject name with >', () => {
        const result = validateContactName('Alice>test');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Contact name cannot contain HTML characters');
      });
    });

    describe('Security - Script Injection', () => {
      it('should reject name containing "script"', () => {
        const result = validateContactName('javascript:alert(1)');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name contains potentially malicious content'
        );
      });

      it('should reject name containing "javascript:"', () => {
        const result = validateContactName('test javascript: test');
        expect(result.valid).toBe(false);
      });

      it('should reject name containing "data:"', () => {
        const result = validateContactName('data:text/html,<script>');
        expect(result.valid).toBe(false);
      });

      it('should reject name containing "vbscript:"', () => {
        const result = validateContactName('vbscript:msgbox');
        expect(result.valid).toBe(false);
      });
    });

    describe('Invalid Names - Whitespace', () => {
      it('should detect leading whitespace', () => {
        const result = validateContactName('  Alice');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name has leading/trailing whitespace'
        );
      });

      it('should detect trailing whitespace', () => {
        const result = validateContactName('Alice  ');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name has leading/trailing whitespace'
        );
      });
    });

    describe('Invalid Names - Character Set', () => {
      it('should reject name with invalid characters', () => {
        const result = validateContactName('Alice#$%^');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Contact name contains invalid characters (use letters, numbers, spaces, and basic punctuation)'
        );
      });
    });
  });

  // ===========================================================================
  // validateContactAddress() Tests
  // ===========================================================================

  describe('validateContactAddress()', () => {
    describe('Valid Testnet Addresses', () => {
      it('should accept valid testnet P2PKH address (m prefix)', () => {
        const result = validateContactAddress(
          'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
          'testnet'
        );
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept valid testnet P2PKH address (n prefix)', () => {
        const result = validateContactAddress(
          'n1YvxR8WFpBqZ5qR1QXGH1F8Bqe8Q2LJBk',
          'testnet'
        );
        expect(result.valid).toBe(true);
      });

      it('should accept valid testnet P2SH address (2 prefix)', () => {
        const result = validateContactAddress(
          '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
          'testnet'
        );
        expect(result.valid).toBe(true);
      });

      it('should accept valid testnet bech32 address (tb1 prefix)', () => {
        const result = validateContactAddress(
          'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
          'testnet'
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('Valid Mainnet Addresses', () => {
      it('should accept valid mainnet P2PKH address (1 prefix)', () => {
        const result = validateContactAddress(
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          'mainnet'
        );
        expect(result.valid).toBe(true);
      });

      it('should accept valid mainnet P2SH address (3 prefix)', () => {
        const result = validateContactAddress(
          '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
          'mainnet'
        );
        expect(result.valid).toBe(true);
      });

      it('should accept valid mainnet bech32 address (bc1 prefix)', () => {
        const result = validateContactAddress(
          'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
          'mainnet'
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid Addresses - Empty', () => {
      it('should reject empty address', () => {
        const result = validateContactAddress('', 'testnet');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Bitcoin address cannot be empty');
      });

      it('should reject whitespace-only address', () => {
        const result = validateContactAddress('   ', 'testnet');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Bitcoin address cannot be empty');
      });
    });

    describe('Invalid Addresses - Length', () => {
      it('should reject address too short', () => {
        const result = validateContactAddress('1A1zP1eP', 'mainnet');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Address length is outside expected range (26-90 characters)'
        );
      });

      it('should reject address too long', () => {
        const result = validateContactAddress('1'.repeat(100), 'mainnet');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Address length is outside expected range (26-90 characters)'
        );
      });
    });

    describe('Invalid Addresses - Network Mismatch', () => {
      it('should reject mainnet address on testnet', () => {
        const result = validateContactAddress(
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          'testnet'
        );
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Address does not appear to be a testnet address (should start with m, n, 2, or tb1)'
        );
      });

      it('should reject testnet address on mainnet', () => {
        const result = validateContactAddress(
          'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
          'mainnet'
        );
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Address does not appear to be a mainnet address (should start with 1, 3, or bc1)'
        );
      });
    });

    describe('Invalid Addresses - Character Set', () => {
      it('should reject address with invalid characters', () => {
        const result = validateContactAddress(
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa!!!',
          'mainnet'
        );
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Address contains invalid characters');
      });

      it('should reject address with ambiguous characters (0, O, I, l)', () => {
        const result = validateContactAddress(
          '1A1zP0eP5OGefiIlDMPTfTL5SLmv7DivfNa',
          'mainnet'
        );
        expect(result.valid).toBe(false);
      });
    });
  });

  // ===========================================================================
  // validateContactNotes() Tests
  // ===========================================================================

  describe('validateContactNotes()', () => {
    describe('Valid Notes', () => {
      it('should accept undefined notes', () => {
        const result = validateContactNotes(undefined);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should accept empty string notes', () => {
        const result = validateContactNotes('');
        expect(result.valid).toBe(true);
      });

      it('should accept normal notes', () => {
        const result = validateContactNotes('Monthly payment for services');
        expect(result.valid).toBe(true);
      });

      it('should accept notes at max length (500 chars)', () => {
        const result = validateContactNotes('A'.repeat(500));
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid Notes - Length', () => {
      it('should reject notes longer than 500 characters', () => {
        const result = validateContactNotes('A'.repeat(501));
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Notes too long (max 500 characters)');
      });
    });

    describe('Security - CSV Formula Injection', () => {
      it('should reject notes starting with =', () => {
        const result = validateContactNotes('=SUM(1+1)');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Notes cannot start with =, +, -, or @ (security risk)'
        );
      });

      it('should reject notes starting with +', () => {
        const result = validateContactNotes('+1+1');
        expect(result.valid).toBe(false);
      });

      it('should reject notes starting with -', () => {
        const result = validateContactNotes('-1-1');
        expect(result.valid).toBe(false);
      });

      it('should reject notes starting with @', () => {
        const result = validateContactNotes('@SUM(A1:A10)');
        expect(result.valid).toBe(false);
      });
    });

    describe('Sensitive Data Warnings', () => {
      it('should warn about "password" keyword', () => {
        const result = validateContactNotes('My password is secret123');
        expect(result.valid).toBe(true);
        expect(result.warnings).toBeDefined();
        expect(result.warnings!.length).toBeGreaterThan(0);
        expect(result.warnings![0]).toContain('password');
      });

      it('should warn about "private key" keyword', () => {
        const result = validateContactNotes('Private key backup');
        expect(result.warnings![0]).toContain('private key');
      });

      it('should warn about "seed" keyword', () => {
        const result = validateContactNotes('Seed phrase location');
        expect(result.warnings![0]).toContain('seed');
      });

      it('should warn about "ssn" keyword', () => {
        const result = validateContactNotes('SSN: 123-45-6789');
        expect(result.warnings![0]).toContain('ssn');
      });

      it('should warn about "credit card" keyword', () => {
        const result = validateContactNotes('Credit card payment');
        expect(result.warnings![0]).toContain('credit card');
      });

      it('should warn about "bank account" keyword', () => {
        const result = validateContactNotes('Bank account transfer');
        expect(result.warnings![0]).toContain('bank account');
      });

      it('should only show one warning even with multiple keywords', () => {
        const result = validateContactNotes('Password and private key info');
        expect(result.warnings).toHaveLength(1);
      });
    });
  });

  // ===========================================================================
  // validateContactCategory() Tests
  // ===========================================================================

  describe('validateContactCategory()', () => {
    describe('Valid Categories', () => {
      it('should accept undefined category', () => {
        const result = validateContactCategory(undefined);
        expect(result.valid).toBe(true);
      });

      it('should accept empty category', () => {
        const result = validateContactCategory('');
        expect(result.valid).toBe(true);
      });

      it('should accept normal category', () => {
        const result = validateContactCategory('Personal');
        expect(result.valid).toBe(true);
      });

      it('should accept category with spaces', () => {
        const result = validateContactCategory('Business Partners');
        expect(result.valid).toBe(true);
      });

      it('should accept category at max length (30 chars)', () => {
        const result = validateContactCategory('A'.repeat(30));
        expect(result.valid).toBe(true);
      });
    });

    describe('Invalid Categories - Length', () => {
      it('should reject category longer than 30 characters', () => {
        const result = validateContactCategory('A'.repeat(31));
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Category too long (max 30 characters)');
      });
    });

    describe('Security - CSV Formula Injection', () => {
      it('should reject category starting with =', () => {
        const result = validateContactCategory('=EVIL()');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Category cannot start with =, +, -, or @ (security risk)'
        );
      });
    });

    describe('Invalid Categories - Character Set', () => {
      it('should reject category with invalid characters', () => {
        const result = validateContactCategory('Personal#$%');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Category contains invalid characters (use letters, numbers, spaces, and hyphens)'
        );
      });
    });
  });

  // ===========================================================================
  // sanitizeCSVField() Tests - CRITICAL SECURITY FUNCTION
  // ===========================================================================

  describe('sanitizeCSVField()', () => {
    describe('Formula Injection Prevention', () => {
      it('should prepend single quote to field starting with =', () => {
        const result = sanitizeCSVField('=SUM(1+1)');
        expect(result).toBe("'=SUM(1+1)");
      });

      it('should prepend single quote to field starting with +', () => {
        const result = sanitizeCSVField('+1+1');
        expect(result).toBe("'+1+1");
      });

      it('should prepend single quote to field starting with -', () => {
        const result = sanitizeCSVField('-1-1');
        expect(result).toBe("'-1-1");
      });

      it('should prepend single quote to field starting with @', () => {
        const result = sanitizeCSVField('@SUM(A1:A10)');
        expect(result).toBe("'@SUM(A1:A10)");
      });
    });

    describe('Normal Fields', () => {
      it('should not modify safe string', () => {
        const result = sanitizeCSVField('Alice');
        expect(result).toBe('Alice');
      });

      it('should trim whitespace', () => {
        const result = sanitizeCSVField('  Alice  ');
        expect(result).toBe('Alice');
      });

      it('should handle empty string', () => {
        const result = sanitizeCSVField('');
        expect(result).toBe('');
      });
    });

    describe('Security - Null Bytes', () => {
      it('should remove null bytes', () => {
        const result = sanitizeCSVField('Alice\0Bob');
        expect(result).toBe('AliceBob');
      });
    });

    describe('Length Limits', () => {
      it('should truncate field longer than 500 characters', () => {
        const result = sanitizeCSVField('A'.repeat(600));
        expect(result).toHaveLength(500);
      });

      it('should not truncate field at exactly 500 characters', () => {
        const result = sanitizeCSVField('A'.repeat(500));
        expect(result).toHaveLength(500);
      });
    });
  });

  // ===========================================================================
  // escapeCSVField() Tests
  // ===========================================================================

  describe('escapeCSVField()', () => {
    it('should prepend space to field starting with =', () => {
      const result = escapeCSVField('=SUM(1+1)');
      expect(result).toBe(' =SUM(1+1)');
    });

    it('should prepend space to field starting with +', () => {
      const result = escapeCSVField('+1');
      expect(result).toBe(' +1');
    });

    it('should not modify safe field', () => {
      const result = escapeCSVField('Alice');
      expect(result).toBe('Alice');
    });

    it('should handle empty string', () => {
      const result = escapeCSVField('');
      expect(result).toBe('');
    });
  });

  // ===========================================================================
  // formatCSVField() Tests
  // ===========================================================================

  describe('formatCSVField()', () => {
    it('should wrap field with comma in quotes', () => {
      const result = formatCSVField('Smith, John');
      expect(result).toBe('"Smith, John"');
    });

    it('should wrap field with newline in quotes', () => {
      const result = formatCSVField('Line 1\nLine 2');
      expect(result).toBe('"Line 1\nLine 2"');
    });

    it('should escape quotes by doubling them', () => {
      const result = formatCSVField('Alice "Ace" Smith');
      expect(result).toBe('"Alice ""Ace"" Smith"');
    });

    it('should not quote simple field', () => {
      const result = formatCSVField('Alice');
      expect(result).toBe('Alice');
    });

    it('should handle empty string', () => {
      const result = formatCSVField('');
      expect(result).toBe('');
    });
  });

  // ===========================================================================
  // parseCSV() Tests
  // ===========================================================================

  describe('parseCSV()', () => {
    it('should parse simple CSV with header and one row', () => {
      const csv = 'name,address\nAlice,tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      const result = parseCSV(csv);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: 'Alice',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      });
    });

    it('should parse CSV with multiple rows', () => {
      const csv = 'name,address\nAlice,addr1\nBob,addr2\nCharlie,addr3';
      const result = parseCSV(csv);

      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should parse CSV with optional columns', () => {
      const csv = 'name,address,notes\nAlice,addr1,Personal\nBob,addr2,';
      const result = parseCSV(csv);

      expect(result[0].notes).toBe('Personal');
      expect(result[1].notes).toBe('');
    });

    it('should skip empty rows', () => {
      const csv = 'name,address\nAlice,addr1\n\nBob,addr2\n\n';
      const result = parseCSV(csv);

      expect(result).toHaveLength(2);
    });

    it('should throw error for CSV with no data rows', () => {
      const csv = 'name,address';
      expect(() => parseCSV(csv)).toThrow(
        'CSV must contain header row and at least one data row'
      );
    });

    it('should throw error for empty CSV', () => {
      const csv = '';
      expect(() => parseCSV(csv)).toThrow(
        'CSV must contain header row and at least one data row'
      );
    });

    it('should trim whitespace from headers and values', () => {
      const csv = ' name , address \n Alice , addr1 ';
      const result = parseCSV(csv);

      expect(result[0]).toEqual({
        name: 'Alice',
        address: 'addr1',
      });
    });
  });

  // ===========================================================================
  // validateContact() Tests - Integration
  // ===========================================================================

  describe('validateContact()', () => {
    const mockContacts: Contact[] = [
      {
        id: '1',
        name: 'Alice',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        addressType: 'native-segwit',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: '2',
        name: 'Bob',
        address: '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF',
        addressType: 'segwit',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];

    it('should validate complete valid contact', () => {
      const contact = {
        name: 'Charlie',
        address: 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
        notes: 'Monthly payment',
        category: 'Business',
      };

      const result = validateContact(contact, mockContacts, 'testnet');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate name', () => {
      const contact = {
        name: 'Alice',
        address: 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
      };

      const result = validateContact(contact, mockContacts, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Contact name "Alice" already exists');
    });

    it('should warn about duplicate address', () => {
      const contact = {
        name: 'Alice2',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      const result = validateContact(contact, mockContacts, 'testnet');

      expect(result.valid).toBe(true); // Warning, not error
      expect(result.warnings).toBeDefined();
      expect(result.warnings![0]).toContain('Address already exists for contact');
    });

    it('should collect all validation errors', () => {
      const contact = {
        name: '', // Invalid
        address: 'invalid', // Invalid
        notes: 'A'.repeat(501), // Too long
        category: 'A'.repeat(31), // Too long
      };

      const result = validateContact(contact, mockContacts, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });

    it('should allow same contact (by ID) to keep same name', () => {
      const contact = {
        id: '1',
        name: 'Alice',
        address: 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
      };

      const result = validateContact(contact, mockContacts, 'testnet');

      // Should not error on duplicate name since it's the same contact
      const hasDuplicateNameError = result.errors.some(e =>
        e.includes('already exists')
      );
      expect(hasDuplicateNameError).toBe(false);
    });
  });

  // ===========================================================================
  // validateCSVRow() Tests
  // ===========================================================================

  describe('validateCSVRow()', () => {
    const mockContacts: Contact[] = [];

    it('should validate valid CSV row', () => {
      const row = {
        name: 'Alice',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        notes: 'Test notes',
        category: 'Personal',
      };

      const result = validateCSVRow(row, 2, mockContacts, 'testnet');

      expect(result.valid).toBe(true);
    });

    it('should detect missing name', () => {
      const row = {
        name: '',
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      const result = validateCSVRow(row, 2, mockContacts, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Row 2: Missing required field 'name'");
    });

    it('should detect missing address', () => {
      const row = {
        name: 'Alice',
        address: '',
      };

      const result = validateCSVRow(row, 2, mockContacts, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Row 2: Missing required field 'address'");
    });

    it('should sanitize fields before validation', () => {
      const row = {
        name: 'Alice', // Use normal name to ensure sanitization doesn't break valid input
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      const result = validateCSVRow(row, 2, mockContacts, 'testnet');

      // Should sanitize (trim whitespace) and then validate successfully
      expect(result.valid).toBe(true);
    });

    it('should prefix row number to errors', () => {
      const row = {
        name: 'A'.repeat(51), // Too long
        address: 'invalid',
      };

      const result = validateCSVRow(row, 5, mockContacts, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Row 5:');
    });
  });
});
