/**
 * Contact Validation Utilities
 *
 * Security-critical validation functions for the Contacts feature.
 * All inputs must be validated using these functions before storage.
 *
 * Security Requirements:
 * - Prevent CSV formula injection (=, +, -, @)
 * - Prevent XSS attacks (<script>, HTML tags)
 * - Enforce length limits
 * - Validate Bitcoin addresses using AddressGenerator
 * - Sanitize all user inputs
 */

import type {
  Contact,
  ValidationResult,
  AddressType,
  MultisigAddressType,
} from '../types';
import { XpubValidator } from '../../background/bitcoin/XpubValidator';

/**
 * Validates contact name
 *
 * Requirements:
 * - Non-empty (1-50 characters)
 * - No formula injection (=, +, -, @)
 * - No HTML injection (<, >, &, ", ')
 * - No script injection
 * - Safe character set only
 *
 * @param name - Contact name to validate
 * @returns ValidationResult with errors and sanitized value
 */
export function validateContactName(name: string): ValidationResult {
  const errors: string[] = [];

  // Empty check
  if (!name || name.trim().length === 0) {
    errors.push('Contact name cannot be empty');
    return { valid: false, errors };
  }

  // Length check
  if (name.length > 50) {
    errors.push('Contact name too long (max 50 characters)');
  }

  // CSV injection prevention
  if (/^[=+\-@]/.test(name)) {
    errors.push('Contact name cannot start with =, +, -, or @ (security risk)');
  }

  // HTML injection prevention
  // Note: React auto-escapes, so we primarily prevent <script> tags
  if (/<|>/.test(name)) {
    errors.push('Contact name cannot contain HTML characters');
  }

  // Script injection prevention
  if (/script|javascript:|data:|vbscript:/i.test(name)) {
    errors.push('Contact name contains potentially malicious content');
  }

  // Whitespace normalization check
  if (name !== name.trim()) {
    errors.push('Contact name has leading/trailing whitespace');
  }

  // Safe character set (alphanumeric + safe punctuation)
  if (!/^[\w\s\-\.,']+$/u.test(name.trim())) {
    errors.push('Contact name contains invalid characters (use letters, numbers, spaces, and basic punctuation)');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: sanitizeName(name),
  };
}

/**
 * Sanitizes contact name
 *
 * @param name - Contact name to sanitize
 * @returns Sanitized name
 */
function sanitizeName(name: string): string {
  return name
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/^[=+\-@]/, ''); // Remove formula prefixes
}

/**
 * Validates Bitcoin address
 *
 * Requirements:
 * - Non-empty
 * - Valid Bitcoin address format
 * - Correct network (testnet/mainnet)
 * - Supported address type
 *
 * Note: This function provides basic validation.
 * Full validation with AddressGenerator must be done at the service layer.
 *
 * @param address - Bitcoin address to validate
 * @param network - Network type (testnet or mainnet)
 * @returns ValidationResult with errors and address type
 */
export function validateContactAddress(
  address: string,
  network: 'testnet' | 'mainnet'
): ValidationResult {
  const errors: string[] = [];

  // Empty check
  if (!address || address.trim().length === 0) {
    errors.push('Bitcoin address cannot be empty');
    return { valid: false, errors };
  }

  // Length validation (sanity check)
  if (address.length < 26 || address.length > 90) {
    errors.push('Address length is outside expected range (26-90 characters)');
  }

  // Network prefix validation
  if (network === 'testnet') {
    const validPrefixes = ['m', 'n', '2', 'tb1'];
    const hasValidPrefix = validPrefixes.some(p => address.startsWith(p));

    if (!hasValidPrefix) {
      errors.push('Address does not appear to be a testnet address (should start with m, n, 2, or tb1)');
    }
  } else {
    const validPrefixes = ['1', '3', 'bc1'];
    const hasValidPrefix = validPrefixes.some(p => address.startsWith(p));

    if (!hasValidPrefix) {
      errors.push('Address does not appear to be a mainnet address (should start with 1, 3, or bc1)');
    }
  }

  // Basic character set validation
  // Bitcoin addresses use base58 (no 0, O, I, l) or bech32 (alphanumeric lowercase)
  const isBase58 = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(address);
  const isBech32 = /^(tb1|bc1)[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+$/.test(address);

  if (!isBase58 && !isBech32) {
    errors.push('Address contains invalid characters');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates contact notes
 *
 * Requirements:
 * - Max 500 characters
 * - No formula injection (=, +, -, @)
 * - Warn about sensitive keywords
 *
 * @param notes - Contact notes to validate
 * @returns ValidationResult with errors and warnings
 */
export function validateContactNotes(notes: string | undefined): ValidationResult {
  if (!notes || notes.trim().length === 0) {
    return { valid: true, errors: [], warnings: [] };
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Length check
  if (notes.length > 500) {
    errors.push('Notes too long (max 500 characters)');
  }

  // CSV injection prevention
  if (/^[=+\-@]/.test(notes)) {
    errors.push('Notes cannot start with =, +, -, or @ (security risk)');
  }

  // Sensitive data warning
  const sensitiveKeywords = [
    'password',
    'private key',
    'seed',
    'ssn',
    'social security',
    'credit card',
    'bank account',
    'pin',
    'secret',
  ];

  const lowerNotes = notes.toLowerCase();
  for (const keyword of sensitiveKeywords) {
    if (lowerNotes.includes(keyword)) {
      warnings.push(
        `Notes may contain sensitive information ("${keyword}"). ` +
        `Consider if this should be stored.`
      );
      break; // One warning is enough
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitized: sanitizeNotes(notes),
  };
}

/**
 * Sanitizes contact notes
 *
 * @param notes - Contact notes to sanitize
 * @returns Sanitized notes
 */
function sanitizeNotes(notes: string): string {
  return notes
    .trim()
    .replace(/^[=+\-@]/, ''); // Remove formula prefixes
}

/**
 * Validates contact category
 *
 * Requirements:
 * - Max 30 characters
 * - No formula injection (=, +, -, @)
 * - Safe character set only
 *
 * @param category - Contact category to validate
 * @returns ValidationResult with errors
 */
export function validateContactCategory(category: string | undefined): ValidationResult {
  if (!category || category.trim().length === 0) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];

  // Length check
  if (category.length > 30) {
    errors.push('Category too long (max 30 characters)');
  }

  // CSV injection prevention
  if (/^[=+\-@]/.test(category)) {
    errors.push('Category cannot start with =, +, -, or @ (security risk)');
  }

  // Safe character set
  if (!/^[\w\s\-]+$/u.test(category)) {
    errors.push('Category contains invalid characters (use letters, numbers, spaces, and hyphens)');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: category.trim().replace(/^[=+\-@]/, ''),
  };
}

/**
 * Validates contact extended public key (xpub)
 *
 * Requirements:
 * - Valid xpub format (tpub/upub/vpub for testnet, xpub/ypub/zpub for mainnet)
 * - Correct network (testnet or mainnet)
 * - Valid BIP32 structure
 * - Appropriate depth (account level)
 *
 * @param xpub - Extended public key to validate
 * @param network - Network type (testnet or mainnet)
 * @returns ValidationResult with errors and xpub metadata
 */
export function validateContactXpub(
  xpub: string,
  network: 'testnet' | 'mainnet'
): ValidationResult {
  const errors: string[] = [];

  // Empty check
  if (!xpub || xpub.trim().length === 0) {
    errors.push('Extended public key cannot be empty');
    return { valid: false, errors };
  }

  // Whitespace check
  if (xpub !== xpub.trim()) {
    errors.push('Extended public key has leading/trailing whitespace');
  }

  // Use XpubValidator for comprehensive validation
  const validationResult = XpubValidator.validate(xpub.trim(), network);

  if (!validationResult.valid) {
    errors.push(validationResult.error || 'Invalid extended public key');
    return { valid: false, errors };
  }

  // Warn if depth is unexpected (should be account level: depth 3 for single-sig, depth 4 for multisig)
  const warnings: string[] = [];
  if (validationResult.depth !== undefined) {
    if (validationResult.depth < 3) {
      warnings.push('This xpub appears to be above account level. Ensure it\'s an account-level xpub (m/44\'/1\'/0\' or similar).');
    } else if (validationResult.depth > 4) {
      warnings.push('This xpub appears to be below account level. It should be an account-level xpub, not an address-level key.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validates contact email address
 *
 * Requirements:
 * - Valid email format (RFC 5322 basic validation)
 * - Max 100 characters
 * - No CSV formula injection
 *
 * @param email - Email address to validate
 * @returns ValidationResult with errors
 */
export function validateContactEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: true, errors: [] }; // Email is optional
  }

  const errors: string[] = [];

  // Length check
  if (email.length > 100) {
    errors.push('Email too long (max 100 characters)');
  }

  // CSV injection prevention
  if (/^[=+\-@]/.test(email)) {
    errors.push('Email cannot start with =, +, -, or @ (security risk)');
  }

  // Basic email format validation (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitized: email.trim(),
  };
}

/**
 * Validates complete contact data
 *
 * Validates all contact fields and checks for duplicates.
 * This should be called before adding or updating a contact.
 *
 * @param contact - Partial contact data to validate
 * @param existingContacts - Array of existing contacts (for duplicate check)
 * @param network - Network type (testnet or mainnet)
 * @returns ValidationResult with all errors and warnings
 */
export function validateContact(
  contact: Partial<Contact>,
  existingContacts: Contact[],
  network: 'testnet' | 'mainnet'
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  const nameResult = validateContactName(contact.name || '');
  errors.push(...nameResult.errors);

  // Check name uniqueness
  if (contact.name) {
    const duplicateName = existingContacts.find(
      c =>
        c.name.toLowerCase() === contact.name!.toLowerCase() &&
        c.id !== contact.id
    );
    if (duplicateName) {
      errors.push(`Contact name "${contact.name}" already exists`);
    }
  }

  // At least one of address or xpub must be provided
  const hasAddress = contact.address && contact.address.trim().length > 0;
  const hasXpub = contact.xpub && contact.xpub.trim().length > 0;

  if (!hasAddress && !hasXpub) {
    errors.push('Contact must have either a Bitcoin address or an extended public key (xpub)');
  }

  // Validate address (only if provided)
  if (hasAddress) {
    const addressResult = validateContactAddress(contact.address!, network);
    errors.push(...addressResult.errors);

    // Check duplicate address (warning, not error - same address can have multiple names)
    const duplicateAddress = existingContacts.find(
      c => c.address === contact.address && c.id !== contact.id
    );
    if (duplicateAddress) {
      warnings.push(
        `Address already exists for contact "${duplicateAddress.name}". ` +
        `Multiple contacts can share addresses, but this is unusual.`
      );
    }
  }

  // Validate xpub (only if provided)
  if (hasXpub) {
    const xpubResult = validateContactXpub(contact.xpub!, network);
    errors.push(...xpubResult.errors);
    if (xpubResult.warnings) {
      warnings.push(...xpubResult.warnings);
    }

    // Check duplicate xpub (warning)
    const duplicateXpub = existingContacts.find(
      c => c.xpub === contact.xpub && c.id !== contact.id
    );
    if (duplicateXpub) {
      warnings.push(
        `Extended public key already exists for contact "${duplicateXpub.name}". ` +
        `This xpub may already be in use.`
      );
    }
  }

  // Validate notes
  const notesResult = validateContactNotes(contact.notes);
  errors.push(...notesResult.errors);
  if (notesResult.warnings) {
    warnings.push(...notesResult.warnings);
  }

  // Validate category
  const categoryResult = validateContactCategory(contact.category);
  errors.push(...categoryResult.errors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * CRITICAL SECURITY FUNCTION
 * Sanitizes CSV field to prevent formula injection attacks
 *
 * If field starts with =, +, -, or @, prepends a single quote
 * to force spreadsheet software to treat it as literal text.
 *
 * This prevents command execution when CSV is opened in Excel/LibreOffice.
 *
 * @param field - CSV field to sanitize
 * @returns Sanitized field
 */
export function sanitizeCSVField(field: string): string {
  if (!field) return '';

  // Trim whitespace
  field = field.trim();

  // If field starts with formula characters, prepend single quote
  // This causes Excel/LibreOffice to treat as literal text
  if (/^[=+\-@]/.test(field)) {
    field = "'" + field;
  }

  // Remove any embedded null bytes
  field = field.replace(/\0/g, '');

  // Limit length (safety check)
  if (field.length > 500) {
    field = field.substring(0, 500);
  }

  return field;
}

/**
 * Escapes CSV field for export
 *
 * Prepends space if starts with formula character
 * (Alternative to single quote that's more Excel-compatible)
 *
 * @param field - CSV field to escape
 * @returns Escaped field
 */
export function escapeCSVField(field: string): string {
  if (!field) return '';

  // Prepend space if starts with formula character
  if (/^[=+\-@]/.test(field)) {
    field = ' ' + field;
  }

  return field;
}

/**
 * Formats field for CSV output (handles commas, quotes, newlines)
 *
 * @param field - Field to format
 * @returns Formatted field
 */
export function formatCSVField(field: string): string {
  // If field contains comma, newline, or quote, wrap in quotes
  if (/[,\n"]/.test(field)) {
    // Escape existing quotes by doubling them
    field = field.replace(/"/g, '""');
    return `"${field}"`;
  }

  return field;
}

/**
 * Parses CSV content into rows
 *
 * Basic CSV parser for MVP. For production, consider using a library
 * like papaparse for robust parsing (handles quoted fields, commas in values, etc.)
 *
 * @param csvData - CSV content string
 * @returns Array of row objects with header keys
 */
export function parseCSV(csvData: string): Array<Record<string, string>> {
  const lines = csvData.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV must contain header row and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, string> = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    // Skip empty rows
    if (Object.values(row).some(v => v.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * Validates CSV row for contact import
 *
 * @param row - CSV row object
 * @param rowNumber - Line number (for error reporting)
 * @param existingContacts - Existing contacts (for duplicate check)
 * @param network - Network type
 * @returns ValidationResult
 */
export function validateCSVRow(
  row: Record<string, string>,
  rowNumber: number,
  existingContacts: Contact[],
  network: 'testnet' | 'mainnet'
): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!row.name || row.name.trim().length === 0) {
    errors.push(`Row ${rowNumber}: Missing required field 'name'`);
  }

  if (!row.address || row.address.trim().length === 0) {
    errors.push(`Row ${rowNumber}: Missing required field 'address'`);
  }

  // If required fields missing, return early
  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Sanitize fields BEFORE validation (critical security step)
  const sanitizedContact = {
    name: sanitizeCSVField(row.name),
    address: sanitizeCSVField(row.address),
    notes: row.notes ? sanitizeCSVField(row.notes) : undefined,
    category: row.category ? sanitizeCSVField(row.category) : undefined,
  };

  // Validate all fields
  const contactValidation = validateContact(
    sanitizedContact,
    existingContacts,
    network
  );

  if (!contactValidation.valid) {
    // Add row number prefix to errors
    const rowErrors = contactValidation.errors.map(
      err => `Row ${rowNumber}: ${err}`
    );
    errors.push(...rowErrors);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: contactValidation.warnings,
  };
}
