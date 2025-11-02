/**
 * Tests for File Download Utilities
 *
 * Tests the file download functions for private key export:
 * - Encrypted file downloads
 * - Plain text file downloads
 * - Safe filename generation
 */

import {
  downloadEncryptedKey,
  downloadPlainKey,
  generateSafeFilename,
} from '../fileDownload';

describe('fileDownload utilities', () => {
  let mockCreateElement: jest.SpyInstance;
  let mockCreateObjectURL: jest.SpyInstance;
  let mockRevokeObjectURL: jest.SpyInstance;
  let mockAppendChild: jest.SpyInstance;
  let mockRemoveChild: jest.SpyInstance;
  let mockClick: jest.Mock;
  let mockAnchor: HTMLAnchorElement;

  beforeEach(() => {
    // Mock anchor element
    mockClick = jest.fn();
    mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    } as unknown as HTMLAnchorElement;

    // Mock DOM methods
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
    mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation();
    mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation();

    // Mock URL methods
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    mockCreateObjectURL = global.URL.createObjectURL as jest.Mock;
    mockRevokeObjectURL = global.URL.revokeObjectURL as jest.Mock;

    // Mock Blob
    global.Blob = jest.fn((content, options) => ({
      content,
      options,
      size: content[0].length,
      type: options?.type || '',
    })) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('downloadEncryptedKey', () => {
    it('creates encrypted file with correct structure', () => {
      const data = {
        encryptedData: 'encrypted-data-here',
        salt: 'salt-value',
        iv: 'iv-value',
        metadata: {
          accountName: 'Test Account',
          addressType: 'P2WPKH',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      };

      downloadEncryptedKey(data, 'test-key');

      // Verify Blob was created with correct content
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('"version": 1')],
        { type: 'application/json' }
      );

      // Verify file content structure
      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const fileContent = JSON.parse(blobCall[0][0]);
      expect(fileContent).toEqual({
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

    it('triggers download with .enc extension', () => {
      const data = {
        encryptedData: 'encrypted-data',
        salt: 'salt',
        iv: 'iv',
        metadata: {
          accountName: 'Account',
          addressType: 'P2WPKH',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      };

      downloadEncryptedKey(data, 'my-key');

      // Verify anchor element setup
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('my-key.enc');

      // Verify DOM manipulation
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);

      // Verify URL cleanup
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('formats JSON with indentation', () => {
      const data = {
        encryptedData: 'data',
        salt: 'salt',
        iv: 'iv',
        metadata: {
          accountName: 'Account',
          addressType: 'P2WPKH',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      };

      downloadEncryptedKey(data, 'key');

      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const fileContent = blobCall[0][0];

      // Verify formatted JSON (indented with 2 spaces)
      expect(fileContent).toContain('{\n  "version"');
      expect(fileContent).toContain('\n  "type"');
    });

    it('handles special characters in metadata', () => {
      const data = {
        encryptedData: 'data',
        salt: 'salt',
        iv: 'iv',
        metadata: {
          accountName: 'Test "Account" with special chars: <>&',
          addressType: 'P2WPKH',
          timestamp: '2025-01-15T10:00:00.000Z',
        },
      };

      downloadEncryptedKey(data, 'key');

      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const fileContent = JSON.parse(blobCall[0][0]);

      // Verify special characters are preserved
      expect(fileContent.metadata.accountName).toBe(
        'Test "Account" with special chars: <>&'
      );
    });
  });

  describe('downloadPlainKey', () => {
    beforeEach(() => {
      // Mock Date.toISOString for consistent timestamps
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:00:00.000Z');
    });

    it('creates plain text file with WIF and metadata', () => {
      downloadPlainKey('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy', 'test-key', 'Main Account', 'Native SegWit');

      // Verify Blob was created with text/plain
      expect(global.Blob).toHaveBeenCalledWith(
        [expect.stringContaining('# Bitcoin Wallet Private Key Export')],
        { type: 'text/plain' }
      );

      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const fileContent = blobCall[0][0];

      // Verify file contains warning
      expect(fileContent).toContain('# WARNING: This file contains your private key in plain text');

      // Verify metadata
      expect(fileContent).toContain('# Account Name: Main Account');
      expect(fileContent).toContain('# Address Type: Native SegWit');
      expect(fileContent).toContain('# Export Date: 2025-01-15T10:00:00.000Z');
      expect(fileContent).toContain('# Network: Testnet');

      // Verify WIF is included
      expect(fileContent).toContain('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy');
    });

    it('triggers download with .txt extension', () => {
      downloadPlainKey('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy', 'my-key', 'Account', 'P2WPKH');

      // Verify anchor element setup
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('my-key.txt');

      // Verify DOM manipulation and cleanup
      expect(mockAppendChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockAnchor);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('handles special characters in account name', () => {
      downloadPlainKey('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy', 'key', 'Account "with" chars', 'P2WPKH');

      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const fileContent = blobCall[0][0];

      expect(fileContent).toContain('# Account Name: Account "with" chars');
    });

    it('includes current timestamp', () => {
      const mockDate = new Date('2025-03-20T15:30:45.123Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
      jest.spyOn(mockDate, 'toISOString').mockReturnValue('2025-03-20T15:30:45.123Z');

      downloadPlainKey('cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy', 'key', 'Account', 'P2WPKH');

      const blobCall = (global.Blob as jest.Mock).mock.calls[0];
      const fileContent = blobCall[0][0];

      expect(fileContent).toContain('# Export Date: 2025-03-20T15:30:45.123Z');
    });
  });

  describe('generateSafeFilename', () => {
    beforeEach(() => {
      // Mock Date for consistent timestamps
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2025-01-15T10:00:00.000Z');
    });

    it('converts to lowercase', () => {
      const result = generateSafeFilename('MyAccount');
      expect(result).toBe('myaccount-private-key-2025-01-15');
    });

    it('replaces spaces with hyphens', () => {
      const result = generateSafeFilename('My Main Account');
      expect(result).toBe('my-main-account-private-key-2025-01-15');
    });

    it('replaces special characters with hyphens', () => {
      const result = generateSafeFilename('Account@#$%Name!');
      expect(result).toBe('account-name-private-key-2025-01-15');
    });

    it('removes leading and trailing hyphens', () => {
      const result = generateSafeFilename('---Account---');
      expect(result).toBe('account-private-key-2025-01-15');
    });

    it('collapses multiple hyphens', () => {
      const result = generateSafeFilename('My---Account---Name');
      expect(result).toBe('my-account-name-private-key-2025-01-15');
    });

    it('handles only special characters', () => {
      const result = generateSafeFilename('@#$%^&*()');
      // Implementation leaves a leading hyphen when name becomes empty
      expect(result).toBe('-private-key-2025-01-15');
    });

    it('preserves numbers', () => {
      const result = generateSafeFilename('Account123');
      expect(result).toBe('account123-private-key-2025-01-15');
    });

    it('includes date in YYYY-MM-DD format', () => {
      const result = generateSafeFilename('Account');
      expect(result).toBe('account-private-key-2025-01-15');
    });

    it('handles empty string', () => {
      const result = generateSafeFilename('');
      // Implementation leaves a leading hyphen when name is empty
      expect(result).toBe('-private-key-2025-01-15');
    });

    it('handles unicode characters', () => {
      const result = generateSafeFilename('账户名称');
      // Implementation leaves a leading hyphen when name becomes empty after removing unicode
      expect(result).toBe('-private-key-2025-01-15');
    });

    it('generates different filenames for different dates', () => {
      // First call with first date
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce('2025-01-15T10:00:00.000Z');
      const result1 = generateSafeFilename('Account');

      // Second call with different date
      jest.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce('2025-02-20T10:00:00.000Z');
      const result2 = generateSafeFilename('Account');

      expect(result1).toBe('account-private-key-2025-01-15');
      expect(result2).toBe('account-private-key-2025-02-20');
    });
  });
});
