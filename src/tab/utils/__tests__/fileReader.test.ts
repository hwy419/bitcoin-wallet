/**
 * Tests for File Reader Utilities
 *
 * Tests the file reading functions for private key import:
 * - Reading encrypted .enc files
 * - Reading plain text .txt files
 * - File format validation
 * - File type detection
 */

import {
  readEncryptedFile,
  readPlainTextFile,
  validateFileFormat,
  detectFileType,
  EncryptedKeyFile,
} from '../fileReader';

describe('fileReader utilities', () => {
  // Helper to create a mock File object
  const createMockFile = (content: string, name: string, type?: string): File => {
    const blob = new Blob([content], { type: type || 'text/plain' });
    return new File([blob], name, { type: blob.type });
  };

  describe('readEncryptedFile', () => {
    it('reads and parses valid encrypted file', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'encrypted-private-key',
        encryptedData: 'encrypted-data-here',
        salt: 'salt-value',
        iv: 'iv-value',
        metadata: {
          accountName: 'Test Account',
          addressType: 'P2WPKH',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      });

      const file = createMockFile(fileContent, 'test.enc', 'application/json');
      const result = await readEncryptedFile(file);

      expect(result).toEqual({
        version: 1,
        type: 'encrypted-private-key',
        encryptedData: 'encrypted-data-here',
        salt: 'salt-value',
        iv: 'iv-value',
        metadata: {
          accountName: 'Test Account',
          addressType: 'P2WPKH',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      });
    });

    it('reads encrypted file without metadata', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'encrypted-private-key',
        encryptedData: 'encrypted-data',
        salt: 'salt',
        iv: 'iv',
      });

      const file = createMockFile(fileContent, 'test.enc');
      const result = await readEncryptedFile(file);

      expect(result.encryptedData).toBe('encrypted-data');
      expect(result.salt).toBe('salt');
      expect(result.iv).toBe('iv');
      expect(result.metadata).toBeUndefined();
    });

    it('throws error for missing encryptedData field', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'encrypted-private-key',
        salt: 'salt',
        iv: 'iv',
      });

      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Missing required encrypted key data fields'
      );
    });

    it('throws error for missing salt field', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'encrypted-private-key',
        encryptedData: 'data',
        iv: 'iv',
      });

      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Missing required encrypted key data fields'
      );
    });

    it('throws error for missing iv field', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'encrypted-private-key',
        encryptedData: 'data',
        salt: 'salt',
      });

      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Missing required encrypted key data fields'
      );
    });

    it('throws error for invalid file type', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'wrong-type',
        encryptedData: 'data',
        salt: 'salt',
        iv: 'iv',
      });

      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Invalid file type: wrong-type. Expected encrypted-private-key.'
      );
    });

    it('throws error for malformed JSON', async () => {
      const fileContent = '{ invalid json }';
      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Invalid file format. Expected JSON encrypted key file.'
      );
    });

    it('throws error for non-JSON content', async () => {
      const fileContent = 'This is not JSON';
      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Invalid file format. Expected JSON encrypted key file.'
      );
    });

    it('handles empty encryptedData string as valid', async () => {
      const fileContent = JSON.stringify({
        version: 1,
        type: 'encrypted-private-key',
        encryptedData: '',
        salt: 'salt',
        iv: 'iv',
      });

      const file = createMockFile(fileContent, 'test.enc');

      await expect(readEncryptedFile(file)).rejects.toThrow(
        'Missing required encrypted key data fields'
      );
    });
  });

  describe('readPlainTextFile', () => {
    it('reads WIF from plain text file', async () => {
      const fileContent = `# Bitcoin Wallet Private Key Export
# WARNING: This file contains your private key
# Account Name: Test Account
# Address Type: P2WPKH
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy`;

      const file = createMockFile(fileContent, 'key.txt');
      const result = await readPlainTextFile(file);

      expect(result).toBe('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });

    it('strips comment lines starting with #', async () => {
      const fileContent = `# Comment 1
# Comment 2
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
# Comment 3`;

      const file = createMockFile(fileContent, 'key.txt');
      const result = await readPlainTextFile(file);

      expect(result).toBe('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });

    it('reads WIF with no comments', async () => {
      const fileContent = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

      const file = createMockFile(fileContent, 'key.txt');
      const result = await readPlainTextFile(file);

      expect(result).toBe('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });

    it('trims whitespace from WIF', async () => {
      const fileContent = '  cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy  \n';

      const file = createMockFile(fileContent, 'key.txt');
      const result = await readPlainTextFile(file);

      expect(result).toBe('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });

    it('throws error for empty file', async () => {
      const fileContent = '';
      const file = createMockFile(fileContent, 'key.txt');

      await expect(readPlainTextFile(file)).rejects.toThrow(
        'No private key found in file. Expected WIF format.'
      );
    });

    it('throws error for file with only comments', async () => {
      const fileContent = `# Comment 1
# Comment 2
# Comment 3`;

      const file = createMockFile(fileContent, 'key.txt');

      await expect(readPlainTextFile(file)).rejects.toThrow(
        'No private key found in file. Expected WIF format.'
      );
    });

    it('throws error for file with only whitespace', async () => {
      const fileContent = '   \n\n  \t  \n';
      const file = createMockFile(fileContent, 'key.txt');

      await expect(readPlainTextFile(file)).rejects.toThrow(
        'No private key found in file. Expected WIF format.'
      );
    });

    it('returns first non-comment line when multiple present', async () => {
      const fileContent = `# Comment
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
KxFC1jmwwCoACiCAWZ3eXa96mBM6tb3TYzGmf6YwgdGWZgawvrtJ`;

      const file = createMockFile(fileContent, 'key.txt');
      const result = await readPlainTextFile(file);

      expect(result).toBe('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });

    it('handles Windows line endings (CRLF)', async () => {
      const fileContent = '# Comment\r\ncVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy\r\n';

      const file = createMockFile(fileContent, 'key.txt');
      const result = await readPlainTextFile(file);

      expect(result).toBe('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });
  });

  describe('validateFileFormat', () => {
    it('validates .enc file extension', () => {
      const file = createMockFile('content', 'key.enc');
      const error = validateFileFormat(file, 'enc');
      expect(error).toBeNull();
    });

    it('validates .txt file extension', () => {
      const file = createMockFile('content', 'key.txt');
      const error = validateFileFormat(file, 'txt');
      expect(error).toBeNull();
    });

    it('rejects wrong extension for enc', () => {
      const file = createMockFile('content', 'key.txt');
      const error = validateFileFormat(file, 'enc');
      expect(error).toBe('Invalid file type. Expected .enc file.');
    });

    it('rejects wrong extension for txt', () => {
      const file = createMockFile('content', 'key.enc');
      const error = validateFileFormat(file, 'txt');
      expect(error).toBe('Invalid file type. Expected .txt file.');
    });

    it('is case-insensitive for extensions', () => {
      const file = createMockFile('content', 'KEY.ENC');
      const error = validateFileFormat(file, 'enc');
      expect(error).toBeNull();
    });

    it('rejects file that is too large', () => {
      const largeContent = 'x'.repeat(200 * 1024); // 200 KB
      const file = createMockFile(largeContent, 'key.enc');
      // Mock file size
      Object.defineProperty(file, 'size', { value: 200 * 1024 });

      const error = validateFileFormat(file, 'enc');
      expect(error).toBe('File is too large. Maximum size is 100 KB.');
    });

    it('rejects empty file', () => {
      const file = createMockFile('', 'key.enc');
      Object.defineProperty(file, 'size', { value: 0 });

      const error = validateFileFormat(file, 'enc');
      expect(error).toBe('File is empty.');
    });

    it('accepts file at size limit', () => {
      const content = 'x'.repeat(100 * 1024); // Exactly 100 KB
      const file = createMockFile(content, 'key.enc');
      Object.defineProperty(file, 'size', { value: 100 * 1024 });

      const error = validateFileFormat(file, 'enc');
      expect(error).toBeNull();
    });

    it('rejects file just over size limit', () => {
      const content = 'x'.repeat(100 * 1024 + 1); // 100 KB + 1 byte
      const file = createMockFile(content, 'key.enc');
      Object.defineProperty(file, 'size', { value: 100 * 1024 + 1 });

      const error = validateFileFormat(file, 'enc');
      expect(error).toBe('File is too large. Maximum size is 100 KB.');
    });
  });

  describe('detectFileType', () => {
    it('detects encrypted JSON file', async () => {
      const fileContent = JSON.stringify({
        type: 'encrypted-private-key',
        encryptedData: 'data',
        salt: 'salt',
        iv: 'iv',
      });

      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('enc');
    });

    it('detects plain text WIF file', async () => {
      const fileContent = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('txt');
    });

    it('returns unknown for WIF with comments (checks first line only)', async () => {
      // detectFileType checks first line only, so comments make it undetectable
      const fileContent = `# Comment
cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy`;

      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('unknown');
    });

    it('returns unknown for invalid JSON', async () => {
      const fileContent = '{ invalid json }';
      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('unknown');
    });

    it('returns unknown for JSON without correct structure', async () => {
      const fileContent = JSON.stringify({ foo: 'bar' });
      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('unknown');
    });

    it('returns unknown for non-base58 text', async () => {
      const fileContent = 'This is some random text that is not a WIF';
      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('unknown');
    });

    it('returns unknown for short base58-like string', async () => {
      const fileContent = '123ABC'; // Too short to be a WIF
      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('unknown');
    });

    it('returns unknown for empty file', async () => {
      const fileContent = '';
      const file = createMockFile(fileContent, 'unknown.dat');
      const type = await detectFileType(file);

      expect(type).toBe('unknown');
    });

    it('detects mainnet compressed WIF format', async () => {
      // Mainnet compressed WIF (starts with K or L, 52 chars)
      const compressedWIF = 'KxFC1jmwwCoACiCAWZ3eXa96mBM6tb3TYzGmf6YwgdGWZgawvrtJ';
      const file = createMockFile(compressedWIF, 'key.dat');
      const type = await detectFileType(file);
      expect(type).toBe('txt');
    });

    it('detects mainnet uncompressed WIF format', async () => {
      // Mainnet uncompressed WIF (starts with 5, 51 chars)
      const uncompressedWIF = '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ';
      const file = createMockFile(uncompressedWIF, 'key.dat');
      const type = await detectFileType(file);
      expect(type).toBe('txt');
    });
  });
});
