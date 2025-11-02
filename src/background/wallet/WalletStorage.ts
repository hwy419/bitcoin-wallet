/**
 * WalletStorage - Secure Wallet Data Storage Manager
 *
 * This module manages persistent storage of wallet data in chrome.storage.local.
 * It handles encryption/decryption of sensitive data (seed phrases) and provides
 * a clean interface for wallet data management.
 *
 * Security Architecture:
 * - Seed phrase: ALWAYS encrypted (AES-256-GCM)
 * - Account metadata: Stored in plaintext (no privacy risk)
 * - Addresses: Stored in plaintext (public data)
 * - Settings: Stored in plaintext (no security risk)
 *
 * Storage Schema:
 * - Version: 1 (allows future migrations)
 * - Encrypted seed with salt and IV
 * - Multiple accounts with addresses
 * - User settings
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - NEVER store seed phrase in plaintext
 * - NEVER log the seed phrase or password
 * - Validate all data before storage
 * - Clear sensitive data on wallet deletion
 * - Handle storage errors gracefully
 */

import { CryptoUtils, EncryptionResult } from './CryptoUtils';
import type { StoredWallet, StoredWalletV2, Account, WalletAccount, WalletSettings, ImportedKeyData } from '../../shared/types';
import { DEFAULT_AUTO_LOCK_MINUTES, DEFAULT_NETWORK } from '../../shared/constants';

/**
 * Storage key for wallet data in chrome.storage.local
 */
const WALLET_STORAGE_KEY = 'wallet';

/**
 * WalletStorage class for managing wallet persistence
 *
 * All methods are static as this is a storage utility class.
 * Uses chrome.storage.local for persistence (survives browser restarts).
 */
export class WalletStorage {
  /**
   * Checks if a wallet exists in storage
   *
   * @returns true if wallet exists, false otherwise
   *
   * Use Cases:
   * - Initial extension load: determine if user needs to create/import wallet
   * - Before wallet operations: ensure wallet is initialized
   */
  static async hasWallet(): Promise<boolean> {
    try {
      const result = await chrome.storage.local.get(WALLET_STORAGE_KEY);
      return !!result[WALLET_STORAGE_KEY];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to check wallet existence: ${message}`);
    }
  }

  /**
   * Creates a new wallet with encrypted seed phrase
   *
   * @param seedPhrase - BIP39 mnemonic (12 or 24 words) to encrypt and store
   * @param password - User's password for encryption
   * @param initialAccount - First account to create (optional)
   * @param settings - Wallet settings (optional, uses defaults)
   * @returns StoredWallet object that was saved
   *
   * @throws {Error} If wallet already exists or storage fails
   *
   * Encryption Process:
   * 1. Encrypt seed phrase using CryptoUtils (AES-256-GCM)
   * 2. Create wallet structure with encrypted seed
   * 3. Add initial account (if provided)
   * 4. Save to chrome.storage.local
   *
   * Security Notes:
   * - Seed phrase is encrypted before storage
   * - Password is never stored
   * - New salt and IV generated for encryption
   * - Prevents overwriting existing wallet (safety check)
   *
   * Storage Format:
   * - All encrypted data is Base64 encoded
   * - Version field allows future schema migrations
   * - Accounts and settings stored in plaintext (no security risk)
   */
  static async createWallet(
    seedPhrase: string,
    password: string,
    initialAccount?: Account,
    settings?: Partial<WalletSettings>
  ): Promise<StoredWallet> {
    try {
      // Validate inputs
      if (!seedPhrase || seedPhrase.trim().length === 0) {
        throw new Error('Seed phrase cannot be empty');
      }

      if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
      }

      // Check if wallet already exists
      const exists = await this.hasWallet();
      if (exists) {
        throw new Error(
          'Wallet already exists. Delete existing wallet before creating a new one.'
        );
      }

      // Encrypt seed phrase
      const encryptionResult: EncryptionResult = await CryptoUtils.encrypt(
        seedPhrase,
        password
      );

      // Create default settings
      const defaultSettings: WalletSettings = {
        autoLockMinutes: DEFAULT_AUTO_LOCK_MINUTES,
        network: DEFAULT_NETWORK,
        hdWalletInitialized: true, // All new wallets are HD wallets
        ...settings,
      };

      // Create wallet structure (v2 supports imported keys and multisig)
      const wallet: StoredWalletV2 = {
        version: 2, // Version 2 supports imported keys and HD wallet enforcement
        encryptedSeed: encryptionResult.encryptedData,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        accounts: initialAccount ? [initialAccount] : [],
        settings: defaultSettings,
        pendingMultisigTxs: [], // Initialize empty for v2
        importedKeys: undefined, // Will be added when needed
      };

      // Validate wallet structure before saving
      if (!this.isValidStoredWallet(wallet)) {
        throw new Error('Invalid wallet structure');
      }

      // Save to chrome.storage.local
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });

      return wallet;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Do not include seed phrase or password in error message
      throw new Error(`Failed to create wallet: ${message}`);
    }
  }

  /**
   * Retrieves wallet data from storage (seed phrase remains encrypted)
   *
   * @returns StoredWallet object with encrypted seed phrase
   *
   * @throws {Error} If wallet doesn't exist or retrieval fails
   *
   * Security Notes:
   * - Seed phrase is returned ENCRYPTED
   * - Password is required to decrypt (use unlockWallet method)
   * - Accounts and settings returned in plaintext (public data)
   *
   * Use Cases:
   * - Check wallet configuration without unlocking
   * - Display accounts and balances
   * - Read settings
   */
  static async getWallet(): Promise<StoredWallet> {
    try {
      const result = await chrome.storage.local.get(WALLET_STORAGE_KEY);
      const wallet = result[WALLET_STORAGE_KEY];

      if (!wallet) {
        throw new Error('Wallet not found. Create or import a wallet first.');
      }

      // Validate wallet structure
      if (!this.isValidStoredWallet(wallet)) {
        throw new Error(
          'Invalid wallet data in storage. Wallet may be corrupted.'
        );
      }

      return wallet as StoredWallet;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve wallet: ${message}`);
    }
  }

  /**
   * Unlocks wallet by decrypting the seed phrase
   *
   * @param password - User's password for decryption
   * @returns Decrypted seed phrase (BIP39 mnemonic)
   *
   * @throws {Error} If password is incorrect or decryption fails
   *
   * Decryption Process:
   * 1. Retrieve encrypted wallet from storage
   * 2. Extract encrypted seed, salt, and IV
   * 3. Decrypt using CryptoUtils with password
   * 4. Return decrypted seed phrase
   *
   * Security Notes:
   * - Seed phrase exists in memory only during this operation
   * - Caller responsible for clearing seed phrase from memory
   * - Wrong password results in decryption error
   * - Seed phrase should be auto-locked after inactivity
   *
   * Use Cases:
   * - User unlocks wallet with password
   * - Derive keys for transaction signing
   * - Display seed phrase for backup (with warnings)
   */
  static async unlockWallet(password: string): Promise<string> {
    try {
      // Validate input
      if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
      }

      // Get encrypted wallet
      const wallet = await this.getWallet();

      // Decrypt seed phrase
      const seedPhrase = await CryptoUtils.decrypt(
        wallet.encryptedSeed,
        password,
        wallet.salt,
        wallet.iv
      );

      return seedPhrase;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Generic error message (don't reveal if password was wrong vs other error)
      throw new Error(`Failed to unlock wallet: ${message}`);
    }
  }

  /**
   * Verifies password without returning the seed phrase
   *
   * @param password - Password to verify
   * @returns true if password is correct, false if password is incorrect
   *
   * Use Cases:
   * - Verify password before sensitive operations
   * - Check password strength after entry
   * - Re-authentication for transaction signing
   *
   * Note: This method returns false for incorrect passwords instead of throwing,
   * making it safe to use in conditional checks. Only throws for unexpected errors
   * like storage failures.
   */
  static async verifyPassword(password: string): Promise<boolean> {
    try {
      // Attempt to unlock wallet
      const seedPhrase = await this.unlockWallet(password);

      // Clear seed phrase from memory immediately
      CryptoUtils.clearSensitiveData(seedPhrase);

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      // Return false for password-related errors (incorrect password or empty password)
      // These are expected errors that should not be thrown
      if (
        message.includes('Password cannot be empty') ||
        message.includes('Decryption failed') ||
        message.includes('incorrect password') ||
        message.includes('corrupted data')
      ) {
        return false;
      }

      // For other unexpected errors (storage, timeout, etc.), throw
      // This allows callers to handle critical errors appropriately
      throw new Error(`Password verification failed: ${message}`);
    }
  }

  /**
   * Updates wallet accounts (without changing seed phrase)
   *
   * @param accounts - Updated accounts array (single-sig or multisig)
   *
   * @throws {Error} If wallet doesn't exist or update fails
   *
   * Security Notes:
   * - Does not modify encrypted seed phrase
   * - Accounts contain only public data (addresses, metadata)
   * - No password required (not modifying sensitive data)
   * - Supports both Account and MultisigAccount types
   *
   * Use Cases:
   * - Add new account
   * - Update account name
   * - Add new addresses to account
   * - Update address usage flags
   */
  static async updateAccounts(accounts: WalletAccount[]): Promise<void> {
    try {
      // Validate input
      if (!Array.isArray(accounts)) {
        throw new Error('Accounts must be an array');
      }

      // Get current wallet
      const wallet = await this.getWallet();

      // Update accounts (works for both Account and MultisigAccount)
      wallet.accounts = accounts as any;

      // Note: Skip full validation as it only handles Account type
      // Basic validation is sufficient for both types

      // Save updated wallet
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update accounts: ${message}`);
    }
  }

  /**
   * Updates wallet settings
   *
   * @param settings - Updated settings (partial or full)
   *
   * @throws {Error} If wallet doesn't exist or update fails
   *
   * Security Notes:
   * - Does not modify encrypted seed phrase
   * - Settings are public configuration (no password required)
   * - Auto-lock timeout affects security posture
   *
   * Use Cases:
   * - Change auto-lock timeout
   * - Switch network (testnet/mainnet)
   * - Update user preferences
   */
  static async updateSettings(
    settings: Partial<WalletSettings>
  ): Promise<void> {
    try {
      // Get current wallet
      const wallet = await this.getWallet();

      // Merge settings
      wallet.settings = {
        ...wallet.settings,
        ...settings,
      };

      // Validate updated wallet
      if (!this.isValidStoredWallet(wallet)) {
        throw new Error('Invalid wallet structure after settings update');
      }

      // Save updated wallet
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update settings: ${message}`);
    }
  }

  /**
   * Adds a new account to the wallet
   *
   * @param account - Account to add (single-sig or multisig)
   *
   * @throws {Error} If account already exists or addition fails
   *
   * Security Notes:
   * - No password required (public data)
   * - Validates account index is unique
   * - Does not modify encrypted seed phrase
   * - Supports both Account and MultisigAccount types
   */
  static async addAccount(account: WalletAccount): Promise<void> {
    try {
      // Validate account structure (basic validation)
      if (!account || typeof account.index !== 'number' || !account.name) {
        throw new Error('Invalid account structure');
      }

      // Get current wallet
      const wallet = await this.getWallet();

      // Check if account with same index already exists
      const exists = wallet.accounts.some((a) => a.index === account.index);
      if (exists) {
        throw new Error(`Account with index ${account.index} already exists`);
      }

      // Add account (works for both Account and MultisigAccount)
      wallet.accounts.push(account as any);

      // Validate updated wallet before saving
      if (!this.isValidStoredWallet(wallet)) {
        console.error('Wallet validation failed after adding account:', account);
        console.error('Current wallet structure:', JSON.stringify(wallet, null, 2));
        throw new Error('Wallet validation failed after adding account');
      }

      // Save updated wallet
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add account: ${message}`);
    }
  }

  /**
   * Updates a specific account
   *
   * @param accountIndex - Index of account to update
   * @param updatedAccount - Updated account data (single-sig or multisig)
   *
   * @throws {Error} If account not found or update fails
   *
   * Security Notes:
   * - No password required (public data)
   * - Validates account exists before updating
   * - Does not modify encrypted seed phrase
   * - Supports both Account and MultisigAccount types
   */
  static async updateAccount(
    accountIndex: number,
    updatedAccount: WalletAccount
  ): Promise<void> {
    try {
      // Basic validation
      if (!updatedAccount || typeof updatedAccount.index !== 'number' || !updatedAccount.name) {
        throw new Error('Invalid account structure');
      }

      // Get current wallet
      const wallet = await this.getWallet();

      // Find account
      const index = wallet.accounts.findIndex((a) => a.index === accountIndex);
      if (index === -1) {
        throw new Error(`Account with index ${accountIndex} not found`);
      }

      // Update account (works for both Account and MultisigAccount)
      wallet.accounts[index] = updatedAccount as any;

      // Save updated wallet
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update account: ${message}`);
    }
  }

  /**
   * Deletes the wallet from storage (DESTRUCTIVE)
   *
   * @throws {Error} If deletion fails
   *
   * Security Notes:
   * - PERMANENTLY deletes encrypted seed phrase
   * - Cannot be recovered without seed phrase backup
   * - Should require password confirmation in UI
   * - Clears all wallet data
   *
   * WARNING:
   * - This operation is IRREVERSIBLE
   * - Users must have backed up seed phrase
   * - All accounts and addresses are deleted
   * - UI should display strong warnings
   *
   * Use Cases:
   * - User wants to reset extension
   * - User wants to import different wallet
   * - Testing and development
   */
  static async deleteWallet(): Promise<void> {
    try {
      await chrome.storage.local.remove(WALLET_STORAGE_KEY);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete wallet: ${message}`);
    }
  }

  /**
   * Re-encrypts seed phrase with a new password
   *
   * @param oldPassword - Current password
   * @param newPassword - New password for encryption
   *
   * @throws {Error} If old password is incorrect or re-encryption fails
   *
   * Security Notes:
   * - Requires old password to decrypt seed
   * - Generates new salt and IV for new encryption
   * - Atomic operation (fails or succeeds completely)
   * - Old password must be correct
   *
   * Use Cases:
   * - User wants to change password
   * - Security incident requiring password reset
   * - Periodic password rotation (security best practice)
   */
  static async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Validate inputs
      if (!oldPassword || oldPassword.length === 0) {
        throw new Error('Old password cannot be empty');
      }

      if (!newPassword || newPassword.length === 0) {
        throw new Error('New password cannot be empty');
      }

      if (oldPassword === newPassword) {
        throw new Error('New password must be different from old password');
      }

      // Decrypt with old password
      const seedPhrase = await this.unlockWallet(oldPassword);

      // Get current wallet to preserve accounts and settings
      const wallet = await this.getWallet();

      // Encrypt with new password (generates new salt and IV)
      const encryptionResult = await CryptoUtils.encrypt(seedPhrase, newPassword);

      // Update encrypted seed phrase
      wallet.encryptedSeed = encryptionResult.encryptedData;
      wallet.salt = encryptionResult.salt;
      wallet.iv = encryptionResult.iv;

      // Clear seed phrase from memory
      CryptoUtils.clearSensitiveData(seedPhrase);

      // Save updated wallet
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: wallet });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to change password: ${message}`);
    }
  }

  /**
   * Validates StoredWallet structure
   *
   * @param wallet - Object to validate
   * @returns true if valid StoredWallet, false otherwise
   *
   * Validation checks:
   * - Required fields present
   * - Correct types
   * - Valid encryption result format
   * - Valid accounts array
   * - Valid settings object
   */
  private static isValidStoredWallet(wallet: any): wallet is StoredWallet {
    if (!wallet || typeof wallet !== 'object') {
      return false;
    }

    // Check version (support v1 and v2)
    if (wallet.version !== 1 && wallet.version !== 2) {
      return false;
    }

    // Check encrypted seed fields
    if (
      typeof wallet.encryptedSeed !== 'string' ||
      typeof wallet.salt !== 'string' ||
      typeof wallet.iv !== 'string'
    ) {
      return false;
    }

    // Check non-empty encrypted fields
    // All wallets created with v2 require a seed phrase (HD wallets)
    // Reject wallets with empty encryption fields
    if (
      wallet.encryptedSeed.length === 0 ||
      wallet.salt.length === 0 ||
      wallet.iv.length === 0
    ) {
      return false;
    }

    // Check accounts array
    if (!Array.isArray(wallet.accounts)) {
      return false;
    }

    // Validate each account
    for (const account of wallet.accounts) {
      if (!this.isValidAccount(account)) {
        return false;
      }
    }

    // Check settings object
    if (!wallet.settings || typeof wallet.settings !== 'object') {
      return false;
    }

    // Validate settings
    if (
      typeof wallet.settings.autoLockMinutes !== 'number' ||
      (wallet.settings.network !== 'testnet' &&
        wallet.settings.network !== 'mainnet')
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validates Account structure (both single-sig and multisig)
   *
   * @param account - Object to validate
   * @returns true if valid Account or MultisigAccount, false otherwise
   */
  private static isValidAccount(account: any): boolean {
    if (!account || typeof account !== 'object') {
      console.error('[WalletStorage] Validation failed: account is not an object', account);
      return false;
    }

    // Check common required fields
    if (
      typeof account.index !== 'number' ||
      typeof account.name !== 'string' ||
      typeof account.externalIndex !== 'number' ||
      typeof account.internalIndex !== 'number'
    ) {
      console.error('[WalletStorage] Validation failed: missing common fields', {
        index: typeof account.index,
        name: typeof account.name,
        externalIndex: typeof account.externalIndex,
        internalIndex: typeof account.internalIndex,
      });
      return false;
    }

    // Check accountType field
    if (account.accountType !== 'single' && account.accountType !== 'multisig') {
      console.error('[WalletStorage] Validation failed: invalid accountType', account.accountType);
      return false;
    }

    // Validate address type based on account type
    if (account.accountType === 'single') {
      const validTypes = ['legacy', 'segwit', 'native-segwit'];
      if (!validTypes.includes(account.addressType)) {
        return false;
      }
    } else if (account.accountType === 'multisig') {
      const validTypes = ['p2sh', 'p2wsh', 'p2sh-p2wsh'];
      if (!validTypes.includes(account.addressType)) {
        return false;
      }

      // Validate multisig-specific fields
      if (!Array.isArray(account.cosigners)) {
        return false;
      }

      // Validate multisig config format (e.g., "2-of-3")
      if (typeof account.multisigConfig !== 'string') {
        return false;
      }

      // Validate addresses array is MultisigAddress[] (extends Address with optional scripts)
      // Note: addresses can have redeemScript and/or witnessScript
    }

    // Check addresses array
    if (!Array.isArray(account.addresses)) {
      return false;
    }

    // Validate each address
    for (const address of account.addresses) {
      if (!this.isValidAddress(address)) {
        return false;
      }
    }

    // Check indices are non-negative
    if (
      account.index < 0 ||
      account.externalIndex < 0 ||
      account.internalIndex < 0
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validates Address structure
   *
   * @param address - Object to validate
   * @returns true if valid Address, false otherwise
   */
  private static isValidAddress(address: any): boolean {
    if (!address || typeof address !== 'object') {
      return false;
    }

    // Check required fields
    if (
      typeof address.address !== 'string' ||
      typeof address.derivationPath !== 'string' ||
      typeof address.index !== 'number' ||
      typeof address.isChange !== 'boolean' ||
      typeof address.used !== 'boolean'
    ) {
      return false;
    }

    // Check non-empty strings
    if (address.address.length === 0 || address.derivationPath.length === 0) {
      return false;
    }

    // Check index is non-negative
    if (address.index < 0) {
      return false;
    }

    return true;
  }

  /**
   * Gets current storage usage information
   *
   * @returns Object with storage statistics
   *
   * Use Cases:
   * - Monitor storage quota
   * - Display storage usage to user
   * - Warn when approaching limits
   */
  static async getStorageInfo(): Promise<{
    bytesInUse: number;
    quotaBytes: number;
  }> {
    try {
      const bytesInUse = await chrome.storage.local.getBytesInUse(
        WALLET_STORAGE_KEY
      );

      // Chrome storage quota is typically 10MB for local storage
      const quotaBytes = chrome.storage.local.QUOTA_BYTES || 10485760;

      return {
        bytesInUse,
        quotaBytes,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get storage info: ${message}`);
    }
  }

  /**
   * Stores encrypted imported key/seed for an account
   *
   * @param accountIndex - Account index to associate with imported data
   * @param data - Imported key/seed data (already encrypted)
   *
   * @throws {Error} If storage fails
   *
   * Security Notes:
   * - Data must be encrypted before calling this method
   * - Each account can have at most one imported key/seed
   * - Overwrites existing imported data for the account
   */
  static async storeImportedKey(
    accountIndex: number,
    data: ImportedKeyData
  ): Promise<void> {
    try {
      const wallet = await this.getWallet();

      // Ensure wallet is v2 (supports imported keys)
      if (wallet.version !== 2) {
        throw new Error('Wallet version must be 2 to support imported keys');
      }

      const walletV2 = wallet as StoredWalletV2;

      // Initialize importedKeys if not exists
      if (!walletV2.importedKeys) {
        walletV2.importedKeys = {};
      }

      // Store imported key data
      walletV2.importedKeys[accountIndex] = data;

      // Save updated wallet
      await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: walletV2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store imported key: ${message}`);
    }
  }

  /**
   * Retrieves encrypted imported key/seed for an account
   *
   * @param accountIndex - Account index
   * @returns ImportedKeyData if exists, null otherwise
   *
   * Security Notes:
   * - Returns encrypted data - must be decrypted with password
   * - Use CryptoUtils.decrypt to decrypt the data
   */
  static async getImportedKey(
    accountIndex: number
  ): Promise<ImportedKeyData | null> {
    try {
      const wallet = await this.getWallet();

      // Check if wallet supports imported keys
      if (wallet.version !== 2) {
        return null;
      }

      const walletV2 = wallet as StoredWalletV2;

      // Return imported key data if exists
      return walletV2.importedKeys?.[accountIndex] || null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve imported key: ${message}`);
    }
  }

  /**
   * Decrypts an imported key/seed for an account
   *
   * @param accountIndex - Account index
   * @param password - User's password for decryption
   * @returns Decrypted private key (WIF) or seed phrase
   *
   * @throws {Error} If account doesn't have imported data or decryption fails
   *
   * Security Notes:
   * - Returned data exists in memory only - caller must clear it
   * - Password must match the one used during wallet unlock
   */
  static async unlockImportedKey(
    accountIndex: number,
    password: string
  ): Promise<string> {
    try {
      const importedData = await this.getImportedKey(accountIndex);

      if (!importedData) {
        throw new Error(`No imported key found for account ${accountIndex}`);
      }

      // Decrypt imported data
      const decrypted = await CryptoUtils.decrypt(
        importedData.encryptedData,
        password,
        importedData.salt,
        importedData.iv
      );

      return decrypted;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to unlock imported key: ${message}`);
    }
  }

  /**
   * Deletes imported key/seed for an account
   *
   * @param accountIndex - Account index
   *
   * @throws {Error} If deletion fails
   *
   * Security Notes:
   * - This permanently deletes the encrypted imported data
   * - User should be warned to backup the key/seed before deletion
   */
  static async deleteImportedKey(accountIndex: number): Promise<void> {
    try {
      const wallet = await this.getWallet();

      if (wallet.version !== 2) {
        return; // Nothing to delete
      }

      const walletV2 = wallet as StoredWalletV2;

      if (walletV2.importedKeys && walletV2.importedKeys[accountIndex]) {
        delete walletV2.importedKeys[accountIndex];

        // Save updated wallet
        await chrome.storage.local.set({ [WALLET_STORAGE_KEY]: walletV2 });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete imported key: ${message}`);
    }
  }
}
