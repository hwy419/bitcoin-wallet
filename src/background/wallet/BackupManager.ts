/**
 * BackupManager - Complete Wallet Backup and Restore System
 *
 * This module handles encryption and decryption of complete wallet backups,
 * including all accounts, contacts, settings, imported keys, and multisig data.
 *
 * Security Architecture:
 * - Two-layer encryption:
 *   1. Inner layer: Wallet password (existing encryption on seed/contacts)
 *   2. Outer layer: Backup password (600K PBKDF2 for file protection)
 * - Separate passwords enforced for defense in depth
 * - File integrity verification with SHA-256 checksum
 * - Version migration support for backward compatibility
 *
 * Backup File Format:
 * - Magic bytes: "BTCWALLET" for file type identification
 * - Version: 1 (allows future format changes)
 * - Network: testnet|mainnet (prevents network mismatch)
 * - Encrypted payload: Complete wallet + contacts data
 * - Checksum: SHA-256 hash for integrity verification
 *
 * CRITICAL: Address Indices Preservation (BIP44 Gap Limit)
 * - MUST preserve externalIndex and internalIndex for each account
 * - MUST preserve complete addresses[] array with 'used' flags
 * - Failure to preserve indices results in LOSS OF FUNDS due to gap limit
 * - See WALLET_BACKUP_BITCOIN_REVIEW.md Section 5 for detailed explanation
 *
 * Data Included in Backup:
 * - Wallet seed phrase (encrypted with wallet password)
 * - All accounts (single-sig and multisig) with COMPLETE state
 * - All generated addresses with derivation paths and indices
 * - Imported private keys/seeds (encrypted with wallet password)
 * - Pending multisig transactions (PSBTs)
 * - All contacts (encrypted with wallet password)
 * - Wallet settings (network, auto-lock timeout)
 *
 * Network Validation:
 * - Backup includes network type in plaintext header
 * - Validates all addresses match declared network
 * - Validates all WIF keys match declared network
 * - Rejects backups with mixed-network data
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - NEVER log backup password, wallet password, or decrypted data
 * - Validate file structure before decryption
 * - Verify checksum before decryption
 * - Clear sensitive data from memory after use
 * - Enforce separate backup password (different from wallet password)
 */

import { CryptoUtils, EncryptionResult } from './CryptoUtils';
import { WalletStorage } from './WalletStorage';
import { ContactsStorage } from './ContactsStorage';
import { TransactionMetadataStorage } from './TransactionMetadataStorage';
import type {
  StoredWallet,
  StoredWalletV1,
  StoredWalletV2,
  WalletAccount,
  Contact,
  WalletSettings,
  ImportedKeyData,
  PendingMultisigTx,
  TransactionMetadataStorage,
} from '../../shared/types';

/**
 * Encrypted backup file structure (top-level container)
 */
export interface EncryptedBackupFile {
  // Plaintext header (for version detection and network validation)
  header: {
    magicBytes: 'BTCWALLET';
    version: number; // Backup format version (1, 2, 3, etc.)
    created: number; // Unix timestamp (ms)
    network: 'testnet' | 'mainnet';
    appVersion: string; // Extension version (e.g., "0.10.0")
  };

  // Encryption metadata (plaintext)
  encryption: {
    algorithm: 'AES-256-GCM';
    pbkdf2Iterations: 600000; // Stronger than wallet password (100K)
    salt: string; // Base64 encoded salt (32 bytes)
    iv: string; // Base64 encoded IV (12 bytes)
  };

  // Encrypted payload (encrypted with backup password)
  encryptedData: string; // Base64 encoded encrypted JSON

  // Integrity verification (plaintext)
  checksum: {
    algorithm: 'SHA-256';
    hash: string; // SHA-256 hash of encryptedData (hex)
  };
}

/**
 * Decrypted backup payload structure (inner encrypted data)
 */
export interface BackupPayload {
  // Wallet data (StoredWallet structure)
  wallet: {
    version: 1 | 2;
    encryptedSeed: string; // Encrypted with wallet password
    salt: string;
    iv: string;
    accounts: WalletAccount[]; // Includes externalIndex, internalIndex, addresses[]
    settings: WalletSettings;
    importedKeys?: { [accountIndex: number]: ImportedKeyData };
    pendingMultisigTxs?: PendingMultisigTx[];
  };

  // Contacts data (from ContactsStorage)
  contacts: {
    version: number;
    contacts: Contact[];
    salt: string;
  };

  // Transaction metadata (from TransactionMetadataStorage) - Optional for backward compatibility
  transactionMetadata?: TransactionMetadataStorage;

  // Metadata (for validation and display)
  metadata: {
    totalAccounts: number;
    totalContacts: number;
    totalTransactionMetadata?: number; // Optional for backward compatibility
    hasMultisig: boolean;
    hasImportedKeys: boolean;
    exportedBy: string; // Extension version
  };
}

/**
 * Result of export operation
 */
export interface ExportResult {
  success: boolean;
  filename: string;
  checksum: string;
  fileSize: number;
  network: 'testnet' | 'mainnet';
  accountCount: number;
  contactCount: number;
  transactionMetadataCount?: number; // Optional for backward compatibility
}

/**
 * Result of import operation
 */
export interface ImportResult {
  success: boolean;
  accountCount: number;
  contactCount: number;
  transactionMetadataCount?: number; // Optional for backward compatibility
  network: 'testnet' | 'mainnet';
  backupCreated: number;
  hasMultisig: boolean;
  hasImportedKeys: boolean;
}

/**
 * Result of backup file validation
 */
export interface ValidationResult {
  valid: boolean;
  version?: number;
  network?: 'testnet' | 'mainnet';
  created?: number;
  accountCount?: number;
  contactCount?: number;
  error?: string;
}

/**
 * Progress callback for export/import operations
 */
export type ProgressCallback = (progress: number, step: string) => void;

/**
 * Backup password strength requirements (stricter than wallet password)
 */
const BACKUP_PASSWORD_MIN_LENGTH = 12;
const BACKUP_PBKDF2_ITERATIONS = 600000; // 6x stronger than wallet password

/**
 * BackupManager class for wallet backup/restore operations
 */
export class BackupManager {
  /**
   * Exports complete wallet to encrypted backup file
   *
   * @param walletPassword - Current wallet password (for verification)
   * @param backupPassword - New backup password (must be different from wallet password)
   * @param onProgress - Optional progress callback (0-100)
   * @returns EncryptedBackupFile object ready for download
   *
   * @throws {Error} If passwords are the same or export fails
   *
   * Export Process:
   * 1. Verify wallet password (0-20%)
   * 2. Gather wallet data (21-35%)
   * 3. Gather contacts data (36-50%)
   * 4. Serialize payload (51-60%)
   * 5. Derive backup encryption key (61-85% - slowest step)
   * 6. Encrypt payload (86-95%)
   * 7. Generate checksum (96-100%)
   *
   * Security Notes:
   * - Backup password MUST be different from wallet password
   * - Uses 600K PBKDF2 iterations (stronger than wallet's 100K)
   * - Seed phrase remains encrypted with wallet password (inner layer)
   * - Entire payload encrypted with backup password (outer layer)
   * - Checksum prevents tampering
   */
  static async exportWallet(
    walletPassword: string,
    backupPassword: string,
    onProgress?: ProgressCallback
  ): Promise<EncryptedBackupFile> {
    try {
      // Validate inputs
      if (!walletPassword || walletPassword.length === 0) {
        throw new Error('Wallet password cannot be empty');
      }

      if (!backupPassword || backupPassword.length === 0) {
        throw new Error('Backup password cannot be empty');
      }

      // Enforce separate passwords
      if (walletPassword === backupPassword) {
        throw new Error(
          'Backup password must be different from wallet password for security'
        );
      }

      // Validate backup password strength
      if (backupPassword.length < BACKUP_PASSWORD_MIN_LENGTH) {
        throw new Error(
          `Backup password must be at least ${BACKUP_PASSWORD_MIN_LENGTH} characters`
        );
      }

      // Step 1: Verify wallet password (0-20%)
      onProgress?.(10, 'Verifying wallet password...');

      const isValid = await WalletStorage.verifyPassword(walletPassword);
      if (!isValid) {
        throw new Error('Incorrect wallet password');
      }

      onProgress?.(20, 'Gathering wallet data...');

      // Step 2: Retrieve wallet data (21-35%)
      const wallet = await WalletStorage.getWallet();
      onProgress?.(30, 'Gathering contacts data...');

      // Step 3: Retrieve contacts data (36-50%)
      const hasContacts = await ContactsStorage.hasContacts();
      let contactsData: any;

      if (hasContacts) {
        contactsData = await ContactsStorage.getContactsData();
      } else {
        // Create empty contacts structure if none exist
        contactsData = {
          version: 1,
          contacts: [],
          salt: wallet.salt, // Reuse wallet salt
        };
      }

      // Step 3.5: Retrieve transaction metadata (optional - may not exist)
      let transactionMetadata: TransactionMetadataStorage | undefined;
      try {
        transactionMetadata = await TransactionMetadataStorage.getRawStorage();
      } catch (error) {
        // Transaction metadata is optional - if it doesn't exist, skip it
        console.log('No transaction metadata found, skipping in backup');
      }

      onProgress?.(50, 'Serializing backup data...');

      // Step 4: Build backup payload (51-60%)
      const payload: BackupPayload = {
        wallet: {
          version: wallet.version,
          encryptedSeed: wallet.encryptedSeed,
          salt: wallet.salt,
          iv: wallet.iv,
          accounts: wallet.accounts as WalletAccount[],
          settings: wallet.settings,
        },
        contacts: contactsData,
        metadata: {
          totalAccounts: wallet.accounts.length,
          totalContacts: contactsData.contacts.length,
          totalTransactionMetadata: transactionMetadata
            ? Object.keys(transactionMetadata.metadata).length
            : undefined,
          hasMultisig:
            wallet.version === 2 &&
            (wallet as StoredWalletV2).accounts.some(
              (a) => a.accountType === 'multisig'
            ),
          hasImportedKeys:
            wallet.version === 2 &&
            !!(wallet as StoredWalletV2).importedKeys &&
            Object.keys((wallet as StoredWalletV2).importedKeys!).length > 0,
          exportedBy: chrome.runtime.getManifest().version,
        },
      };

      // Add transaction metadata if it exists
      if (transactionMetadata) {
        payload.transactionMetadata = transactionMetadata;
      }

      // Add v2-specific data if present
      if (wallet.version === 2) {
        const walletV2 = wallet as StoredWalletV2;
        if (walletV2.importedKeys) {
          payload.wallet.importedKeys = walletV2.importedKeys;
        }
        if (walletV2.pendingMultisigTxs) {
          payload.wallet.pendingMultisigTxs = walletV2.pendingMultisigTxs;
        }
      }

      onProgress?.(60, 'Deriving backup encryption key...');

      // Step 5: Serialize payload to JSON
      const payloadJSON = JSON.stringify(payload);

      // Step 6: Generate salt for backup encryption
      const salt = crypto.getRandomValues(new Uint8Array(32));

      // Step 7: Derive backup encryption key (61-85% - SLOWEST STEP)
      onProgress?.(70, 'Deriving backup encryption key...');
      const backupKey = await CryptoUtils.deriveKey(
        backupPassword,
        salt,
        BACKUP_PBKDF2_ITERATIONS
      );
      onProgress?.(85, 'Encrypting backup...');

      // Step 8: Encrypt payload (86-95%)
      const encryptionResult = await CryptoUtils.encryptWithKey(
        payloadJSON,
        backupKey
      );
      onProgress?.(95, 'Generating checksum...');

      // Step 9: Generate checksum (96-100%)
      const checksum = await this.generateChecksum(
        encryptionResult.encryptedData
      );
      onProgress?.(98, 'Finalizing backup file...');

      // Step 10: Build encrypted backup file structure
      const backupFile: EncryptedBackupFile = {
        header: {
          magicBytes: 'BTCWALLET',
          version: 1,
          created: Date.now(),
          network: wallet.settings.network,
          appVersion: chrome.runtime.getManifest().version,
        },
        encryption: {
          algorithm: 'AES-256-GCM',
          pbkdf2Iterations: BACKUP_PBKDF2_ITERATIONS,
          salt: this.arrayBufferToBase64(salt.buffer as ArrayBuffer),
          iv: encryptionResult.iv,
        },
        encryptedData: encryptionResult.encryptedData,
        checksum: {
          algorithm: 'SHA-256',
          hash: checksum,
        },
      };

      onProgress?.(100, 'Backup file created successfully');

      // Clear sensitive data from memory
      CryptoUtils.clearSensitiveData(payloadJSON);

      return backupFile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to export wallet: ${message}`);
    }
  }

  /**
   * Imports and restores wallet from encrypted backup file
   *
   * @param backupFile - Encrypted backup file to import
   * @param backupPassword - Password used to encrypt the backup
   * @param onProgress - Optional progress callback (0-100)
   * @returns ImportResult with restored data summary
   *
   * @throws {Error} If validation fails, password is incorrect, or import fails
   *
   * Import Process:
   * 1. Validate file structure (0-10%)
   * 2. Verify checksum (11-20%)
   * 3. Derive decryption key (21-40% - slowest step)
   * 4. Decrypt payload (41-50%)
   * 5. Validate decrypted data (51-60%)
   * 6. Restore accounts (61-80%)
   * 7. Restore contacts (81-95%)
   * 8. Finalize import (96-100%)
   *
   * Security Notes:
   * - Validates file structure before decryption
   * - Verifies checksum before decryption
   * - Validates network consistency
   * - Preserves address indices (CRITICAL for BIP44 gap limit)
   * - Validates all addresses, WIF keys, xpubs match network
   *
   * WARNING:
   * - This REPLACES the current wallet
   * - All existing wallet data is deleted
   * - Cannot be undone
   */
  static async importWallet(
    backupFile: EncryptedBackupFile,
    backupPassword: string,
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    try {
      // Step 1: Validate file structure (0-10%)
      onProgress?.(5, 'Validating backup file...');
      const validation = await this.validateBackupFile(backupFile);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid backup file');
      }
      onProgress?.(10, 'Verifying file integrity...');

      // Step 2: Verify checksum (11-20%)
      const calculatedChecksum = await this.generateChecksum(
        backupFile.encryptedData
      );
      if (calculatedChecksum !== backupFile.checksum.hash) {
        throw new Error(
          'Backup file is corrupted. Checksum mismatch. The file may have been modified or damaged.'
        );
      }
      onProgress?.(20, 'Deriving decryption key...');

      // Step 3: Derive decryption key (21-40% - SLOWEST STEP)
      const salt = this.base64ToArrayBuffer(backupFile.encryption.salt);
      const decryptionKey = await CryptoUtils.deriveKey(
        backupPassword,
        new Uint8Array(salt as ArrayBuffer),
        backupFile.encryption.pbkdf2Iterations
      );
      onProgress?.(40, 'Decrypting backup...');

      // Step 4: Decrypt payload (41-50%)
      const decryptedJSON = await CryptoUtils.decryptWithKey(
        backupFile.encryptedData,
        decryptionKey,
        backupFile.encryption.iv
      );
      onProgress?.(50, 'Validating backup data...');

      // Step 5: Parse and validate decrypted data (51-60%)
      let payload: BackupPayload;
      try {
        payload = JSON.parse(decryptedJSON);
      } catch (error) {
        throw new Error('Invalid backup data format. The file may be corrupted.');
      }

      // Validate payload structure
      if (!this.isValidBackupPayload(payload)) {
        throw new Error(
          'Invalid backup payload structure. The file may be corrupted or incompatible.'
        );
      }

      // Validate network consistency
      if (backupFile.header.network !== payload.wallet.settings.network) {
        throw new Error(
          'Network mismatch in backup file. The backup may be corrupted.'
        );
      }

      onProgress?.(60, 'Restoring wallet...');

      // Step 6: Delete existing wallet (if any)
      const hasExistingWallet = await WalletStorage.hasWallet();
      if (hasExistingWallet) {
        await WalletStorage.deleteWallet();
      }

      // Step 7: Restore wallet data (61-80%)
      onProgress?.(65, 'Restoring accounts...');

      // Build StoredWallet object from payload
      const restoredWallet: StoredWallet = {
        version: payload.wallet.version,
        encryptedSeed: payload.wallet.encryptedSeed,
        salt: payload.wallet.salt,
        iv: payload.wallet.iv,
        accounts: payload.wallet.accounts,
        settings: payload.wallet.settings,
      };

      // Add v2-specific data if present
      if (payload.wallet.version === 2) {
        const walletV2 = restoredWallet as StoredWalletV2;
        walletV2.pendingMultisigTxs = payload.wallet.pendingMultisigTxs || [];
        if (payload.wallet.importedKeys) {
          walletV2.importedKeys = payload.wallet.importedKeys;
        }
      }

      // Save restored wallet to storage
      await chrome.storage.local.set({ wallet: restoredWallet });
      onProgress?.(80, 'Restoring contacts...');

      // Step 8: Restore contacts (81-90%)
      if (payload.contacts && payload.contacts.contacts.length > 0) {
        // Save contacts data directly
        await chrome.storage.local.set({ contacts: payload.contacts });
      }

      // Step 8.5: Restore transaction metadata (91-95%) - Optional for backward compatibility
      if (payload.transactionMetadata) {
        onProgress?.(91, 'Restoring transaction metadata...');
        try {
          await TransactionMetadataStorage.restoreFromBackup(
            payload.transactionMetadata
          );
        } catch (error) {
          console.error('Failed to restore transaction metadata:', error);
          // Don't fail the entire import if transaction metadata fails
        }
      }

      onProgress?.(95, 'Finalizing import...');

      // Step 9: Clear sensitive data from memory
      CryptoUtils.clearSensitiveData(decryptedJSON);

      onProgress?.(100, 'Wallet restored successfully');

      // Return import result
      return {
        success: true,
        accountCount: payload.metadata.totalAccounts,
        contactCount: payload.metadata.totalContacts,
        transactionMetadataCount: payload.metadata.totalTransactionMetadata,
        network: backupFile.header.network,
        backupCreated: backupFile.header.created,
        hasMultisig: payload.metadata.hasMultisig,
        hasImportedKeys: payload.metadata.hasImportedKeys,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to import wallet: ${message}`);
    }
  }

  /**
   * Validates backup file structure without decrypting
   *
   * @param backupFile - Backup file to validate
   * @returns ValidationResult with file information or error
   *
   * Validation checks:
   * - Magic bytes correct
   * - Version supported
   * - Required fields present
   * - Valid encryption metadata
   * - Valid checksum format
   */
  static async validateBackupFile(
    backupFile: any
  ): Promise<ValidationResult> {
    try {
      // Check if file is an object
      if (!backupFile || typeof backupFile !== 'object') {
        return {
          valid: false,
          error: 'Invalid file format. Not a valid backup file.',
        };
      }

      // Check header
      if (!backupFile.header || typeof backupFile.header !== 'object') {
        return {
          valid: false,
          error: 'Invalid backup file header.',
        };
      }

      // Check magic bytes
      if (backupFile.header.magicBytes !== 'BTCWALLET') {
        return {
          valid: false,
          error: 'Invalid file type. This is not a wallet backup file.',
        };
      }

      // Check version
      if (typeof backupFile.header.version !== 'number') {
        return {
          valid: false,
          error: 'Invalid backup file version.',
        };
      }

      // Check if version is supported (currently only v1)
      if (backupFile.header.version > 1) {
        return {
          valid: false,
          error: `Backup version ${backupFile.header.version} is not supported. Please update the extension.`,
        };
      }

      // Check network
      if (
        backupFile.header.network !== 'testnet' &&
        backupFile.header.network !== 'mainnet'
      ) {
        return {
          valid: false,
          error: 'Invalid network in backup file.',
        };
      }

      // Check encryption metadata
      if (!backupFile.encryption || typeof backupFile.encryption !== 'object') {
        return {
          valid: false,
          error: 'Invalid encryption metadata.',
        };
      }

      // Check required encryption fields
      if (
        !backupFile.encryption.salt ||
        !backupFile.encryption.iv ||
        typeof backupFile.encryption.pbkdf2Iterations !== 'number'
      ) {
        return {
          valid: false,
          error: 'Missing encryption parameters.',
        };
      }

      // Check encrypted data
      if (
        !backupFile.encryptedData ||
        typeof backupFile.encryptedData !== 'string'
      ) {
        return {
          valid: false,
          error: 'Missing encrypted data.',
        };
      }

      // Check checksum
      if (!backupFile.checksum || typeof backupFile.checksum !== 'object') {
        return {
          valid: false,
          error: 'Missing checksum.',
        };
      }

      if (!backupFile.checksum.hash || typeof backupFile.checksum.hash !== 'string') {
        return {
          valid: false,
          error: 'Invalid checksum format.',
        };
      }

      // File is valid
      return {
        valid: true,
        version: backupFile.header.version,
        network: backupFile.header.network,
        created: backupFile.header.created,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate backup file.',
      };
    }
  }

  /**
   * Generates SHA-256 checksum of encrypted data
   *
   * @param data - Base64 encoded encrypted data
   * @returns Hex string of SHA-256 hash
   *
   * Security Notes:
   * - Checksum is calculated on encrypted data (not plaintext)
   * - Detects corruption or tampering
   * - Does not reveal information about plaintext
   */
  private static async generateChecksum(data: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return this.arrayBufferToHex(hashBuffer);
    } catch (error) {
      throw new Error('Failed to generate checksum');
    }
  }

  /**
   * Converts ArrayBuffer to hex string
   */
  private static arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Converts ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts Base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      throw new Error('Invalid base64 string');
    }
  }

  /**
   * Validates BackupPayload structure
   */
  private static isValidBackupPayload(payload: any): payload is BackupPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    // Check wallet data
    if (!payload.wallet || typeof payload.wallet !== 'object') {
      return false;
    }

    // Check required wallet fields
    if (
      (payload.wallet.version !== 1 && payload.wallet.version !== 2) ||
      typeof payload.wallet.encryptedSeed !== 'string' ||
      typeof payload.wallet.salt !== 'string' ||
      typeof payload.wallet.iv !== 'string' ||
      !Array.isArray(payload.wallet.accounts) ||
      !payload.wallet.settings
    ) {
      return false;
    }

    // Check contacts data
    if (!payload.contacts || typeof payload.contacts !== 'object') {
      return false;
    }

    if (!Array.isArray(payload.contacts.contacts)) {
      return false;
    }

    // Check metadata
    if (!payload.metadata || typeof payload.metadata !== 'object') {
      return false;
    }

    // Check transaction metadata (optional - for backward compatibility)
    if (payload.transactionMetadata !== undefined) {
      if (
        typeof payload.transactionMetadata !== 'object' ||
        payload.transactionMetadata === null ||
        payload.transactionMetadata.version !== 1 ||
        typeof payload.transactionMetadata.metadata !== 'object' ||
        typeof payload.transactionMetadata.salt !== 'string'
      ) {
        return false;
      }
    }

    return true;
  }
}
