/**
 * File Download Utilities
 *
 * Utility functions for downloading private key exports as files.
 * Supports both encrypted (.enc) and plain text (.txt) formats.
 */

/**
 * Download encrypted private key file
 *
 * @param data - Encrypted key data object
 * @param filename - Base filename (without extension)
 */
export const downloadEncryptedKey = (
  data: {
    encryptedData: string;
    salt: string;
    iv: string;
    metadata: {
      accountName: string;
      addressType: string;
      timestamp: string;
    };
  },
  filename: string
): void => {
  // Create JSON structure for encrypted file
  const fileContent = JSON.stringify(
    {
      version: 1,
      type: 'encrypted-private-key',
      encryptedData: data.encryptedData,
      salt: data.salt,
      iv: data.iv,
      metadata: data.metadata,
    },
    null,
    2
  );

  const blob = new Blob([fileContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.enc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Download plain text private key file
 *
 * @param wif - Private key in WIF format
 * @param filename - Base filename (without extension)
 * @param accountName - Account name for metadata
 * @param addressType - Address type for metadata
 */
export const downloadPlainKey = (
  wif: string,
  filename: string,
  accountName: string,
  addressType: string
): void => {
  const timestamp = new Date().toISOString();

  // Create file content with metadata comments and WIF
  const fileContent = `# Bitcoin Wallet Private Key Export
# WARNING: This file contains your private key in plain text
# Anyone with access to this file can steal your Bitcoin
# Store it securely and never share it with anyone
#
# Account Name: ${accountName}
# Address Type: ${addressType}
# Export Date: ${timestamp}
# Network: Testnet
#
# Private Key (WIF):
${wif}
`;

  const blob = new Blob([fileContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Generate safe filename from account name
 *
 * @param accountName - Account name
 * @returns Safe filename
 */
export const generateSafeFilename = (accountName: string): string => {
  const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const safeName = accountName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `${safeName}-private-key-${timestamp}`;
};
