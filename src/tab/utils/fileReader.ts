/**
 * File Reader Utilities
 *
 * Utility functions for reading private key import files.
 * Supports both encrypted (.enc) and plain text (.txt) formats.
 */

/**
 * Encrypted file structure for private key exports
 */
export interface EncryptedKeyFile {
  version: number;
  type: string;
  encryptedData: string;
  salt: string;
  iv: string;
  metadata?: {
    accountName: string;
    addressType: string;
    timestamp: string;
    network?: string;
  };
}

/**
 * Read and parse encrypted .enc file
 *
 * @param file - File object from input
 * @returns Parsed encrypted key data
 * @throws Error if file format is invalid
 */
export const readEncryptedFile = async (file: File): Promise<EncryptedKeyFile> => {
  // Read file content
  const content = await readFileAsText(file);

  try {
    // Parse JSON structure
    const data = JSON.parse(content) as EncryptedKeyFile;

    // Validate required fields
    if (!data.encryptedData || !data.salt || !data.iv) {
      throw new Error('Missing required encrypted key data fields');
    }

    // Validate type
    if (data.type !== 'encrypted-private-key') {
      throw new Error(`Invalid file type: ${data.type}. Expected encrypted-private-key.`);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid file format. Expected JSON encrypted key file.');
    }
    throw error;
  }
};

/**
 * Read plain text .txt file and extract WIF
 *
 * @param file - File object from input
 * @returns WIF string (comment lines stripped)
 * @throws Error if WIF not found
 */
export const readPlainTextFile = async (file: File): Promise<string> => {
  // Read file content
  const content = await readFileAsText(file);

  // Split into lines and filter out comments/empty lines
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  if (lines.length === 0) {
    throw new Error('No private key found in file. Expected WIF format.');
  }

  // Return first non-comment line (should be the WIF)
  const wif = lines[0];

  if (!wif) {
    throw new Error('Empty private key in file.');
  }

  return wif;
};

/**
 * Validate file format based on extension
 *
 * @param file - File object
 * @param expectedType - Expected file type ('enc' or 'txt')
 * @returns Error message or null if valid
 */
export const validateFileFormat = (
  file: File,
  expectedType: 'enc' | 'txt'
): string | null => {
  const fileName = file.name.toLowerCase();

  // Check extension
  if (expectedType === 'enc' && !fileName.endsWith('.enc')) {
    return 'Invalid file type. Expected .enc file.';
  }

  if (expectedType === 'txt' && !fileName.endsWith('.txt')) {
    return 'Invalid file type. Expected .txt file.';
  }

  // Check file size (reasonable limits)
  const MAX_FILE_SIZE = 1024 * 100; // 100 KB (very generous for a private key)
  if (file.size > MAX_FILE_SIZE) {
    return 'File is too large. Maximum size is 100 KB.';
  }

  if (file.size === 0) {
    return 'File is empty.';
  }

  return null;
};

/**
 * Read file content as text
 *
 * @param file - File object
 * @returns File content as string
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        resolve(content);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Detect file type by content (fallback if extension is missing/wrong)
 *
 * @param file - File object
 * @returns Detected type ('enc', 'txt', or 'unknown')
 */
export const detectFileType = async (file: File): Promise<'enc' | 'txt' | 'unknown'> => {
  try {
    const content = await readFileAsText(file);
    const trimmed = content.trim();

    // Try to parse as JSON (encrypted file)
    if (trimmed.startsWith('{')) {
      try {
        const data = JSON.parse(trimmed);
        if (data.type === 'encrypted-private-key' && data.encryptedData) {
          return 'enc';
        }
      } catch {
        // Not valid JSON, continue
      }
    }

    // Check if it looks like a WIF (base58 string, starts with c, K, L for mainnet or 9, c for testnet)
    const firstLine = trimmed.split('\n')[0].trim();
    if (firstLine.length >= 51 && /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(firstLine)) {
      return 'txt';
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
};
