/**
 * CSV Helper Utilities
 *
 * Utility functions for CSV import/export operations:
 * - File reading
 * - CSV parsing for preview
 * - File downloading
 */

/**
 * Read CSV file content as text
 */
export const readCSVFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/**
 * Parse CSV data for preview (first 10 rows)
 * Returns array of row objects with column headers as keys
 */
export const parseCSVPreview = (csvData: string): Array<Record<string, string>> => {
  const lines = csvData.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header row
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse data rows (max 10 for preview)
  const rows = lines.slice(1, 11);

  return rows.map(line => {
    // Simple CSV parsing (handles basic comma-separated values)
    // Note: Does not handle quoted commas - backend handles full CSV parsing
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
};

/**
 * Count total rows in CSV (excluding header)
 */
export const countCSVRows = (csvData: string): number => {
  const lines = csvData.trim().split('\n');
  return Math.max(0, lines.length - 1); // Exclude header
};

/**
 * Download file to user's device
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Format file size in human-readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate CSV file
 * Returns error message if invalid, null if valid
 */
export const validateCSVFile = (file: File): string | null => {
  // Check file type
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
    return 'Please select a CSV file (.csv)';
  }

  // Check file size (max 1MB)
  const maxSize = 1 * 1024 * 1024; // 1MB
  if (file.size > maxSize) {
    return `File is too large (${formatFileSize(file.size)}). Maximum size is 1MB.`;
  }

  return null;
};
