/**
 * CSV Helpers Test Suite
 *
 * Comprehensive tests for CSV import/export utilities:
 * - File reading with FileReader API
 * - CSV parsing and preview generation
 * - CSV row counting
 * - File downloading with Blob API
 * - File size formatting
 * - CSV file validation
 * - Edge cases and error handling
 *
 * @see src/tab/utils/csvHelpers.ts
 */

import {
  readCSVFile,
  parseCSVPreview,
  countCSVRows,
  downloadFile,
  formatFileSize,
  validateCSVFile,
} from '../csvHelpers';

// ============================================================================
// Mocks
// ============================================================================

describe('csvHelpers', () => {
  // Mock DOM APIs
  let mockCreateElement: jest.SpyInstance;
  let mockAppendChild: jest.SpyInstance;
  let mockRemoveChild: jest.SpyInstance;
  let mockClick: jest.Mock;

  beforeEach(() => {
    // Mock document.createElement
    mockClick = jest.fn();
    mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue({
      click: mockClick,
      href: '',
      download: '',
    } as any);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();

    // Mock document.body.appendChild and removeChild
    mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation((node) => node);
    mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation((node) => node);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ============================================================================
  // readCSVFile Tests
  // ============================================================================

  describe('readCSVFile', () => {
    it('reads CSV file content as text', async () => {
      const csvContent = 'name,address\nAlice,tb1q123\nBob,tb1q456';
      const file = new File([csvContent], 'contacts.csv', { type: 'text/csv' });

      const result = await readCSVFile(file);

      expect(result).toBe(csvContent);
    });

    it('handles empty CSV file', async () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });

      const result = await readCSVFile(file);

      expect(result).toBe('');
    });

    it('handles large CSV file', async () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `Contact ${i},tb1q${i}`);
      const csvContent = 'name,address\n' + rows.join('\n');
      const file = new File([csvContent], 'large.csv', { type: 'text/csv' });

      const result = await readCSVFile(file);

      expect(result).toBe(csvContent);
      expect(result.split('\n').length).toBe(1001); // 1 header + 1000 rows
    });

    it('handles CSV with special characters', async () => {
      const csvContent = 'name,address\n"Alice, Inc",tb1q123\n"Bob\'s Shop",tb1q456';
      const file = new File([csvContent], 'special.csv', { type: 'text/csv' });

      const result = await readCSVFile(file);

      expect(result).toBe(csvContent);
    });

    it('handles CSV with Unicode characters', async () => {
      const csvContent = 'name,address\n日本語,tb1q123\n中文,tb1q456\nЯзык,tb1q789';
      const file = new File([csvContent], 'unicode.csv', { type: 'text/csv' });

      const result = await readCSVFile(file);

      expect(result).toBe(csvContent);
    });

    it('handles CSV with newlines in quoted fields', async () => {
      const csvContent = 'name,address,notes\n"Alice\\nCompany",tb1q123,"Line 1\\nLine 2"';
      const file = new File([csvContent], 'newlines.csv', { type: 'text/csv' });

      const result = await readCSVFile(file);

      expect(result).toBe(csvContent);
    });

    it('rejects when FileReader fails', async () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      // Mock FileReader to fail
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsText: jest.fn(function (this: any) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 0);
        }),
      })) as any;

      await expect(readCSVFile(file)).rejects.toThrow('Failed to read file');

      global.FileReader = originalFileReader;
    });

    it('rejects when result is not a string', async () => {
      const file = new File(['content'], 'test.csv', { type: 'text/csv' });

      // Mock FileReader to return non-string result
      const originalFileReader = global.FileReader;
      global.FileReader = jest.fn().mockImplementation(() => ({
        readAsText: jest.fn(function (this: any) {
          setTimeout(() => {
            if (this.onload) {
              this.onload({ target: { result: new ArrayBuffer(8) } });
            }
          }, 0);
        }),
      })) as any;

      await expect(readCSVFile(file)).rejects.toThrow('Failed to read file as text');

      global.FileReader = originalFileReader;
    });
  });

  // ============================================================================
  // parseCSVPreview Tests
  // ============================================================================

  describe('parseCSVPreview', () => {
    it('parses CSV data into preview rows', () => {
      const csvData = 'name,address\nAlice,tb1q123\nBob,tb1q456';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice', address: 'tb1q123' },
        { name: 'Bob', address: 'tb1q456' },
      ]);
    });

    it('handles CSV with extra columns', () => {
      const csvData = 'name,address,notes\nAlice,tb1q123,Important\nBob,tb1q456,Friend';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice', address: 'tb1q123', notes: 'Important' },
        { name: 'Bob', address: 'tb1q456', notes: 'Friend' },
      ]);
    });

    it('limits preview to first 10 rows', () => {
      const rows = Array.from({ length: 20 }, (_, i) => `Contact ${i},tb1q${i}`);
      const csvData = 'name,address\n' + rows.join('\n');

      const result = parseCSVPreview(csvData);

      expect(result).toHaveLength(10);
      expect(result[0]).toEqual({ name: 'Contact 0', address: 'tb1q0' });
      expect(result[9]).toEqual({ name: 'Contact 9', address: 'tb1q9' });
    });

    it('handles CSV with fewer than 10 rows', () => {
      const csvData = 'name,address\nAlice,tb1q123\nBob,tb1q456\nCharlie,tb1q789';

      const result = parseCSVPreview(csvData);

      expect(result).toHaveLength(3);
    });

    it('returns empty array for header-only CSV', () => {
      const csvData = 'name,address';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([]);
    });

    it('returns empty array for empty CSV', () => {
      const csvData = '';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([]);
    });

    it('trims whitespace from headers and values', () => {
      const csvData = '  name  ,  address  \n  Alice  ,  tb1q123  ';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice', address: 'tb1q123' },
      ]);
    });

    it('handles missing values (empty cells)', () => {
      const csvData = 'name,address,notes\nAlice,tb1q123,\nBob,,Important\n,tb1q789,';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice', address: 'tb1q123', notes: '' },
        { name: 'Bob', address: '', notes: 'Important' },
        { name: '', address: 'tb1q789', notes: '' },
      ]);
    });

    it('handles rows with fewer columns than headers', () => {
      const csvData = 'name,address,notes\nAlice,tb1q123\nBob';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice', address: 'tb1q123', notes: '' },
        { name: 'Bob', address: '', notes: '' },
      ]);
    });

    it('handles rows with more columns than headers', () => {
      const csvData = 'name,address\nAlice,tb1q123,extra1,extra2\nBob,tb1q456';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice', address: 'tb1q123' },
        { name: 'Bob', address: 'tb1q456' },
      ]);
    });

    it('handles CSV with only whitespace', () => {
      const csvData = '   \n   \n   ';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([]);
    });

    it('handles CSV with duplicate header names', () => {
      const csvData = 'name,address,name\nAlice,tb1q123,Alice2';

      const result = parseCSVPreview(csvData);

      // Last column with same name will overwrite
      expect(result).toEqual([
        { name: 'Alice2', address: 'tb1q123' },
      ]);
    });

    it('handles CSV with special characters in values (basic)', () => {
      const csvData = 'name,address\nAlice & Co,tb1q123\nBob\'s Shop,tb1q456';

      const result = parseCSVPreview(csvData);

      expect(result).toEqual([
        { name: 'Alice & Co', address: 'tb1q123' },
        { name: 'Bob\'s Shop', address: 'tb1q456' },
      ]);
    });

    it('does not handle quoted commas (by design - backend handles full CSV parsing)', () => {
      // Note: Simple parsing splits by comma without handling quotes
      const csvData = 'name,address\n"Alice, Inc",tb1q123';

      const result = parseCSVPreview(csvData);

      // This will split incorrectly, but that's expected for simple preview
      expect(result[0].name).toBe('"Alice');
    });
  });

  // ============================================================================
  // countCSVRows Tests
  // ============================================================================

  describe('countCSVRows', () => {
    it('counts rows excluding header', () => {
      const csvData = 'name,address\nAlice,tb1q123\nBob,tb1q456';

      const result = countCSVRows(csvData);

      expect(result).toBe(2);
    });

    it('returns 0 for header-only CSV', () => {
      const csvData = 'name,address';

      const result = countCSVRows(csvData);

      expect(result).toBe(0);
    });

    it('returns 0 for empty CSV', () => {
      const csvData = '';

      const result = countCSVRows(csvData);

      expect(result).toBe(0);
    });

    it('counts large CSV correctly', () => {
      const rows = Array.from({ length: 1000 }, (_, i) => `Contact ${i},tb1q${i}`);
      const csvData = 'name,address\n' + rows.join('\n');

      const result = countCSVRows(csvData);

      expect(result).toBe(1000);
    });

    it('handles CSV with trailing newlines', () => {
      const csvData = 'name,address\nAlice,tb1q123\nBob,tb1q456\n\n\n';

      const result = countCSVRows(csvData);

      // Trim removes trailing newlines, so this is still 2 rows
      expect(result).toBe(2);
    });

    it('handles CSV with only newlines', () => {
      const csvData = '\n\n\n';

      const result = countCSVRows(csvData);

      expect(result).toBe(0);
    });

    it('counts single row CSV', () => {
      const csvData = 'name,address\nAlice,tb1q123';

      const result = countCSVRows(csvData);

      expect(result).toBe(1);
    });
  });

  // ============================================================================
  // downloadFile Tests
  // ============================================================================

  describe('downloadFile', () => {
    it('downloads CSV file with default mime type', () => {
      const content = 'name,address\nAlice,tb1q123';
      const filename = 'contacts.csv';

      downloadFile(content, filename);

      // Verify Blob creation
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text/csv',
        })
      );

      // Verify anchor element creation and click
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockClick).toHaveBeenCalledTimes(1);

      // Verify cleanup
      expect(mockAppendChild).toHaveBeenCalledTimes(1);
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });

    it('downloads file with custom mime type', () => {
      const content = '{"test": true}';
      const filename = 'data.json';
      const mimeType = 'application/json';

      downloadFile(content, filename, mimeType);

      expect(global.URL.createObjectURL).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'application/json',
        })
      );
    });

    it('sets correct filename on anchor element', () => {
      const content = 'test';
      const filename = 'my-export.csv';

      downloadFile(content, filename);

      const anchorElement = mockCreateElement.mock.results[0].value;
      expect(anchorElement.download).toBe(filename);
    });

    it('sets correct href on anchor element', () => {
      const content = 'test';
      const filename = 'test.csv';

      downloadFile(content, filename);

      const anchorElement = mockCreateElement.mock.results[0].value;
      expect(anchorElement.href).toBe('blob:mock-url');
    });

    it('handles empty content', () => {
      const content = '';
      const filename = 'empty.csv';

      downloadFile(content, filename);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('handles large content', () => {
      const content = 'x'.repeat(1000000); // 1MB of data
      const filename = 'large.csv';

      downloadFile(content, filename);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('handles special characters in content', () => {
      const content = 'name,address\n"Alice, Inc",tb1q123\n日本語,tb1q456';
      const filename = 'special.csv';

      downloadFile(content, filename);

      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('handles special characters in filename', () => {
      const content = 'test';
      const filename = 'contacts-2025-01-15.csv';

      downloadFile(content, filename);

      const anchorElement = mockCreateElement.mock.results[0].value;
      expect(anchorElement.download).toBe('contacts-2025-01-15.csv');
    });

    it('cleans up resources after download', () => {
      const content = 'test';
      const filename = 'test.csv';

      downloadFile(content, filename);

      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      expect(mockRemoveChild).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // formatFileSize Tests
  // ============================================================================

  describe('formatFileSize', () => {
    it('formats 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('formats bytes (< 1KB)', () => {
      expect(formatFileSize(100)).toBe('100 Bytes');
      expect(formatFileSize(512)).toBe('512 Bytes');
      expect(formatFileSize(1023)).toBe('1023 Bytes');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
      expect(formatFileSize(102400)).toBe('100 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(2097152)).toBe('2 MB');
      expect(formatFileSize(1572864)).toBe('1.5 MB');
      expect(formatFileSize(10485760)).toBe('10 MB');
    });

    it('rounds to 2 decimal places', () => {
      expect(formatFileSize(1234)).toBe('1.21 KB');
      expect(formatFileSize(12345)).toBe('12.06 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });

    it('handles very small files', () => {
      expect(formatFileSize(1)).toBe('1 Bytes');
      expect(formatFileSize(10)).toBe('10 Bytes');
    });

    it('handles typical CSV file sizes', () => {
      // Small CSV (few contacts)
      expect(formatFileSize(5120)).toBe('5 KB');

      // Medium CSV (hundreds of contacts)
      expect(formatFileSize(51200)).toBe('50 KB');

      // Large CSV (thousands of contacts)
      expect(formatFileSize(512000)).toBe('500 KB');
    });

    it('handles 1MB limit', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });
  });

  // ============================================================================
  // validateCSVFile Tests
  // ============================================================================

  describe('validateCSVFile', () => {
    it('accepts valid CSV file with .csv extension', () => {
      const file = new File(['content'], 'contacts.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toBeNull();
    });

    it('accepts valid CSV file with text/csv mime type', () => {
      const file = new File(['content'], 'data', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toBeNull();
    });

    it('rejects file without .csv extension and wrong mime type', () => {
      const file = new File(['content'], 'contacts.txt', { type: 'text/plain' });

      const result = validateCSVFile(file);

      expect(result).toBe('Please select a CSV file (.csv)');
    });

    it('rejects file with .txt extension', () => {
      const file = new File(['content'], 'data.txt', { type: 'text/plain' });

      const result = validateCSVFile(file);

      expect(result).toBe('Please select a CSV file (.csv)');
    });

    it('rejects file with .json extension', () => {
      const file = new File(['{}'], 'data.json', { type: 'application/json' });

      const result = validateCSVFile(file);

      expect(result).toBe('Please select a CSV file (.csv)');
    });

    it('rejects file larger than 1MB', () => {
      const largeContent = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toContain('File is too large');
      expect(result).toContain('Maximum size is 1MB');
    });

    it('accepts file exactly at 1MB limit', () => {
      const content = 'x'.repeat(1024 * 1024); // Exactly 1MB
      const file = new File([content], 'max.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toBeNull();
    });

    it('accepts small CSV files', () => {
      const file = new File(['name,address\nAlice,tb1q123'], 'small.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toBeNull();
    });

    it('includes file size in error message for oversized files', () => {
      const largeContent = 'x'.repeat(2 * 1024 * 1024); // 2MB
      const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toContain('2 MB');
      expect(result).toContain('Maximum size is 1MB');
    });

    it('accepts empty CSV file', () => {
      const file = new File([''], 'empty.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toBeNull();
    });

    it('handles file with uppercase .CSV extension', () => {
      const file = new File(['content'], 'contacts.CSV', { type: 'text/csv' });

      const result = validateCSVFile(file);

      // File is accepted because of text/csv mime type
      expect(result).toBeNull();
    });

    it('handles multiple dots in filename', () => {
      const file = new File(['content'], 'contacts.backup.csv', { type: 'text/csv' });

      const result = validateCSVFile(file);

      expect(result).toBeNull();
    });

    it('rejects file with .csv in middle of filename', () => {
      const file = new File(['content'], 'contacts.csv.txt', { type: 'text/plain' });

      const result = validateCSVFile(file);

      expect(result).toBe('Please select a CSV file (.csv)');
    });
  });
});
