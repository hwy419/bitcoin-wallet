export type AddressType = 'legacy' | 'segwit' | 'native-segwit';
export type MultisigAddressType = 'p2sh' | 'p2wsh' | 'p2sh-p2wsh';
export type MultisigConfig = '2-of-2' | '2-of-3' | '3-of-5';

// Single-signature account
export interface Account {
  accountType: 'single';
  index: number;
  name: string;
  addressType: AddressType;
  importType?: 'hd' | 'private-key' | 'seed'; // How account was created/imported
  externalIndex: number;
  internalIndex: number;
  addresses: Address[];
}

// Co-signer information for multisig accounts
export interface Cosigner {
  name: string;
  xpub: string;
  fingerprint: string;
  derivationPath: string;
  isSelf: boolean;
}

// Multi-signature account
export interface MultisigAccount {
  accountType: 'multisig';
  index: number;
  name: string;
  multisigConfig: MultisigConfig;
  addressType: MultisigAddressType;
  cosigners: Cosigner[];
  externalIndex: number;
  internalIndex: number;
  addresses: MultisigAddress[];
}

// Union type for all account types
export type WalletAccount = Account | MultisigAccount;

export interface Address {
  address: string;
  derivationPath: string;
  index: number;
  isChange: boolean;
  used: boolean;
}

// Multisig address includes redeem/witness scripts
export interface MultisigAddress extends Address {
  redeemScript?: string;  // For P2SH and P2SH-P2WSH
  witnessScript?: string; // For P2WSH and P2SH-P2WSH
}

// Pending multisig transaction
export interface PendingMultisigTx {
  id: string;
  accountId: number;
  psbtBase64: string;
  created: number;
  expiresAt: number;
  multisigConfig: MultisigConfig;
  signaturesCollected: number;
  signaturesRequired: number;
  signatureStatus: {
    [fingerprint: string]: {
      signed: boolean;
      timestamp?: number;
      cosignerName: string;
    };
  };
  metadata: {
    amount: number;
    recipient: string;
    fee: number;
  };
}

// Imported key/seed storage entry
export interface ImportedKeyData {
  encryptedData: string;  // Encrypted private key (WIF) or seed phrase
  salt: string;           // Encryption salt
  iv: string;             // Encryption IV
  type: 'private-key' | 'seed';  // Type of imported data
}

// Wallet storage (v1 - single-sig only)
export interface StoredWalletV1 {
  version: 1;
  encryptedSeed: string;
  salt: string;
  iv: string;
  accounts: Account[];
  settings: WalletSettings;
}

// Wallet storage (v2 - supports multisig)
export interface StoredWalletV2 {
  version: 2;
  encryptedSeed: string;
  salt: string;
  iv: string;
  accounts: WalletAccount[];
  pendingMultisigTxs: PendingMultisigTx[];
  importedKeys?: { [accountIndex: number]: ImportedKeyData };  // Imported keys/seeds by account index
  settings: WalletSettings;
}

// Current wallet storage type
export type StoredWallet = StoredWalletV1 | StoredWalletV2;

export interface WalletSettings {
  autoLockMinutes: number;
  network: 'testnet' | 'mainnet';
  hdWalletInitialized?: boolean; // True if wallet has HD seed (all wallets should have this going forward)
}

export interface Transaction {
  txid: string;
  confirmations: number;
  timestamp: number;
  value: number;
  fee: number;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}

export interface TransactionInput {
  txid: string;
  vout: number;
  address: string;
  value: number;
}

export interface TransactionOutput {
  address: string;
  value: number;
  scriptPubKey: string;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  scriptPubKey: string;
  confirmations: number;
}

export interface FeeEstimate {
  slow: number;
  medium: number;
  fast: number;
}

export interface Balance {
  confirmed: number;
  unconfirmed: number;
}

export interface BitcoinPrice {
  usd: number;
  lastUpdated: number;
}

// Balance history for charting
export type BalanceHistoryPeriod = '7D' | '1M' | '3M' | '1Y' | 'ALL';

export interface BalanceHistoryPoint {
  timestamp: number;     // Unix timestamp in seconds
  balance: number;       // Balance in satoshis at this point
  confirmed: number;     // Confirmed balance in satoshis
  unconfirmed: number;   // Unconfirmed balance in satoshis
}

export interface BalanceHistory {
  points: BalanceHistoryPoint[];
  period: BalanceHistoryPeriod;
  summary: {
    periodChange: number;      // Change in satoshis over the period
    percentChange: number;     // Percentage change
    highest: number;           // Highest balance in satoshis
    highestTimestamp: number;  // When highest occurred
    lowest: number;            // Lowest balance in satoshis
    lowestTimestamp: number;   // When lowest occurred
  };
}

// Contact color palette (16 colors)
export type ContactColor =
  | 'blue' | 'purple' | 'pink' | 'red'
  | 'orange' | 'yellow' | 'green' | 'teal'
  | 'cyan' | 'indigo' | 'violet' | 'magenta'
  | 'amber' | 'lime' | 'emerald' | 'sky';

// Contacts feature types (v1 - Legacy, plaintext)
export interface ContactV1 {
  id: string;                             // UUID v4
  name: string;                           // User-friendly name (1-50 characters)
  address: string;                        // Bitcoin address
  addressType: AddressType | MultisigAddressType; // Detected address type
  notes?: string;                         // Optional notes (max 500 characters)
  category?: string;                      // Optional category (max 30 characters)
  createdAt: number;                      // Unix timestamp (ms)
  updatedAt: number;                      // Unix timestamp (ms)
  transactionCount?: number;              // Cached transaction count
  lastTransactionDate?: number;           // Unix timestamp of last transaction
}

// Contact v2.0 - Enhanced with encryption and xpub support
export interface Contact {
  // Core Fields (Required)
  id: string;                             // UUID v4
  name: string;                           // 1-50 chars (ENCRYPTED)
  createdAt: number;                      // Unix timestamp ms
  updatedAt: number;                      // Unix timestamp ms

  // Address Fields (At least ONE required: address OR xpub)
  address?: string;                       // Single Bitcoin address (PLAINTEXT)
  addressType?: AddressType | MultisigAddressType; // Detected type (PLAINTEXT)

  xpub?: string;                          // Extended public key (ENCRYPTED)
  xpubFingerprint?: string;               // 8-char hex fingerprint (PLAINTEXT)
  xpubDerivationPath?: string;            // e.g., "m/48'/1'/0'/2'" (PLAINTEXT)
  cachedAddresses?: string[];             // First 20-100 derived addresses (PLAINTEXT)
  addressesLastUpdated?: number;          // Unix timestamp of last address cache update (PLAINTEXT)

  // Privacy Tracking Fields (PLAINTEXT)
  lastUsedAddressIndex?: number;          // For xpub contacts: Index of last used cached address (0-based)
  reusageCount?: number;                  // For single-address contacts: Number of times address has been reused

  // Enhanced Fields (Optional)
  email?: string;                         // Email address, 0-100 chars (ENCRYPTED)
  notes?: string;                         // Notes, max 500 chars (ENCRYPTED)
  category?: string;                      // Category, max 30 chars (ENCRYPTED)
  tags?: { [key: string]: string };       // Custom key-value tags (ENCRYPTED)

  // Visual Customization (Optional)
  color?: ContactColor;                   // Contact color (ENCRYPTED)

  // Analytics (Optional)
  transactionCount?: number;              // Cached transaction count (PLAINTEXT)
  lastTransactionDate?: number;           // Unix timestamp of last tx (PLAINTEXT)
}

// Encrypted contact data (stored in chrome.storage.local)
export interface EncryptedContact {
  id: string;                             // UUID v4 (PLAINTEXT)
  encryptedData: string;                  // Base64 encrypted JSON (name, email, notes, category, xpub, color)
  iv: string;                             // Base64 initialization vector (unique per contact)

  // Plaintext fields for lookup/search
  address?: string;                       // Bitcoin address
  addressType?: AddressType | MultisigAddressType;
  xpubFingerprint?: string;               // 8-char hex fingerprint
  xpubDerivationPath?: string;            // Derivation path
  cachedAddresses?: string[];             // Derived addresses
  addressesLastUpdated?: number;

  // Plaintext metadata
  createdAt: number;
  updatedAt: number;
  transactionCount?: number;
  lastTransactionDate?: number;
}

// Decrypted sensitive data (in-memory only)
export interface EncryptedContactData {
  name: string;
  email?: string;
  notes?: string;
  category?: string;
  tags?: { [key: string]: string };
  xpub?: string;
  color?: ContactColor;
}

// Contacts storage structure v1 (Legacy)
export interface ContactsDataV1 {
  version: 1;
  contacts: ContactV1[];
}

// Contacts storage structure v2 (Encrypted)
export interface ContactsDataV2 {
  version: 2;
  contacts: EncryptedContact[];
  salt: string;                           // Global salt for PBKDF2 (shared with wallet)
}

// Union type for all versions
export type ContactsData = ContactsDataV1 | ContactsDataV2;

// Transaction Metadata types

// Transaction metadata for user-defined tags, categories, and notes
export interface TransactionMetadata {
  tags: string[];              // User-created tags (ENCRYPTED)
  category?: string;           // Free-form category, max 30 chars (ENCRYPTED)
  notes?: string;              // User notes, max 500 chars (ENCRYPTED)
  updatedAt: number;           // Unix timestamp ms
}

// Encrypted transaction metadata (stored in chrome.storage.local)
export interface EncryptedTransactionMetadata {
  encryptedData: string;       // Base64 encrypted JSON (tags, category, notes)
  iv: string;                  // Base64 initialization vector (unique per transaction)
  updatedAt: number;           // Unix timestamp ms (PLAINTEXT for sorting)
}

// Decrypted sensitive data (in-memory only)
export interface EncryptedTransactionMetadataData {
  tags: string[];
  category?: string;
  notes?: string;
}

// Transaction metadata storage structure
export interface TransactionMetadataStorage {
  version: 1;
  metadata: { [txid: string]: EncryptedTransactionMetadata };
  salt: string;                // Global salt for PBKDF2 (shared with wallet/contacts)
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  sanitized?: string;
  addressType?: AddressType | MultisigAddressType;
}

// Xpub validation result
export interface XpubValidationResult {
  valid: boolean;
  error?: string;
  xpubType?: 'tpub' | 'upub' | 'vpub' | 'Tpub' | 'Upub' | 'Vpub' | 'xpub' | 'ypub' | 'zpub' | 'Xpub' | 'Ypub' | 'Zpub';
  fingerprint?: string;                   // 8-char hex
  depth?: number;                         // BIP32 depth
  childNumber?: number;                   // BIP32 child number
  purpose?: number;                       // 44, 48, 49, or 84
  scriptType?: 'p2pkh' | 'p2sh-p2wpkh' | 'p2wpkh' | 'p2sh' | 'p2wsh' | 'p2sh-p2wsh';
  derivationPathTemplate?: string;        // e.g., "m/84'/1'/0'/0/{index}"
  standardXpub?: string;                  // Standard format (xpub/tpub) for bip32 parsing
}

// Derived address info
export interface DerivedAddress {
  address: string;
  derivationPath: string;
  index: number;
  isChange: boolean;                      // false = external (receive), true = internal (change)
}

// CSV import/export types
export interface ImportOptions {
  skipDuplicates?: boolean;               // Default: true
  overwriteExisting?: boolean;            // Default: false
  validateOnly?: boolean;                 // Default: false (dry-run mode)
}

export interface ImportError {
  line: number;                           // CSV line number
  name: string;                           // Contact name
  address: string;                        // Contact address
  reason: string;                         // Error reason
}

export interface ImportResult {
  success: boolean;
  imported: number;                       // Successfully imported
  skipped: number;                        // Skipped (duplicates)
  failed: number;                         // Failed (invalid)
  errors: ImportError[];                  // Detailed error list
}

// Message types for Chrome runtime messaging
export enum MessageType {
  // Wallet management
  CREATE_WALLET = 'CREATE_WALLET',
  IMPORT_WALLET = 'IMPORT_WALLET',
  UNLOCK_WALLET = 'UNLOCK_WALLET',
  LOCK_WALLET = 'LOCK_WALLET',
  GET_WALLET_STATE = 'GET_WALLET_STATE',

  // Account management
  CREATE_ACCOUNT = 'CREATE_ACCOUNT',
  UPDATE_ACCOUNT_NAME = 'UPDATE_ACCOUNT_NAME',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  GENERATE_ADDRESS = 'GENERATE_ADDRESS',
  IMPORT_ACCOUNT_PRIVATE_KEY = 'IMPORT_ACCOUNT_PRIVATE_KEY',
  IMPORT_ACCOUNT_SEED = 'IMPORT_ACCOUNT_SEED',

  // Transactions
  GET_BALANCE = 'GET_BALANCE',
  GET_TRANSACTIONS = 'GET_TRANSACTIONS',
  SEND_TRANSACTION = 'SEND_TRANSACTION',
  GET_FEE_ESTIMATES = 'GET_FEE_ESTIMATES',
  GET_BALANCE_HISTORY = 'GET_BALANCE_HISTORY',

  // Price data
  GET_BTC_PRICE = 'GET_BTC_PRICE',

  // Multisig operations
  CREATE_MULTISIG_ACCOUNT = 'CREATE_MULTISIG_ACCOUNT',
  IMPORT_COSIGNER_XPUB = 'IMPORT_COSIGNER_XPUB',
  EXPORT_OUR_XPUB = 'EXPORT_OUR_XPUB',
  BUILD_MULTISIG_TRANSACTION = 'BUILD_MULTISIG_TRANSACTION',
  SIGN_MULTISIG_TRANSACTION = 'SIGN_MULTISIG_TRANSACTION',
  EXPORT_PSBT = 'EXPORT_PSBT',
  IMPORT_PSBT = 'IMPORT_PSBT',
  GET_PENDING_MULTISIG_TXS = 'GET_PENDING_MULTISIG_TXS',
  SAVE_PENDING_MULTISIG_TX = 'SAVE_PENDING_MULTISIG_TX',
  DELETE_PENDING_MULTISIG_TX = 'DELETE_PENDING_MULTISIG_TX',
  BROADCAST_MULTISIG_TRANSACTION = 'BROADCAST_MULTISIG_TRANSACTION',
  GENERATE_MULTISIG_ADDRESS = 'GENERATE_MULTISIG_ADDRESS',

  // Contacts management
  GET_CONTACTS = 'GET_CONTACTS',
  GET_CONTACT_BY_ID = 'GET_CONTACT_BY_ID',
  GET_CONTACT_BY_ADDRESS = 'GET_CONTACT_BY_ADDRESS',
  SEARCH_CONTACTS = 'SEARCH_CONTACTS',
  ADD_CONTACT = 'ADD_CONTACT',
  UPDATE_CONTACT = 'UPDATE_CONTACT',
  DELETE_CONTACT = 'DELETE_CONTACT',
  IMPORT_CONTACTS_CSV = 'IMPORT_CONTACTS_CSV',
  EXPORT_CONTACTS_CSV = 'EXPORT_CONTACTS_CSV',
  GET_TRANSACTIONS_FOR_CONTACT = 'GET_TRANSACTIONS_FOR_CONTACT',
  EXPAND_CONTACT_ADDRESSES = 'EXPAND_CONTACT_ADDRESSES',

  // Contacts privacy tracking
  GET_NEXT_CONTACT_ADDRESS = 'GET_NEXT_CONTACT_ADDRESS',
  INCREMENT_CONTACT_USAGE = 'INCREMENT_CONTACT_USAGE',

  // Contacts migration (v1 → v2)
  GET_CONTACTS_MIGRATION_STATUS = 'GET_CONTACTS_MIGRATION_STATUS',
  MIGRATE_CONTACTS_V1_TO_V2 = 'MIGRATE_CONTACTS_V1_TO_V2',
  VERIFY_CONTACTS_MIGRATION = 'VERIFY_CONTACTS_MIGRATION',
  ROLLBACK_CONTACTS_MIGRATION = 'ROLLBACK_CONTACTS_MIGRATION',
  DELETE_CONTACTS_BACKUP = 'DELETE_CONTACTS_BACKUP',

  // Transaction metadata management
  GET_TRANSACTION_METADATA = 'GET_TRANSACTION_METADATA',
  GET_ALL_TRANSACTION_METADATA = 'GET_ALL_TRANSACTION_METADATA',
  SET_TRANSACTION_METADATA = 'SET_TRANSACTION_METADATA',
  DELETE_TRANSACTION_METADATA = 'DELETE_TRANSACTION_METADATA',
  GET_ALL_TRANSACTION_TAGS = 'GET_ALL_TRANSACTION_TAGS',
  GET_ALL_TRANSACTION_CATEGORIES = 'GET_ALL_TRANSACTION_CATEGORIES',
  SEARCH_TRANSACTIONS_BY_TAG = 'SEARCH_TRANSACTIONS_BY_TAG',
  SEARCH_TRANSACTIONS_BY_CATEGORY = 'SEARCH_TRANSACTIONS_BY_CATEGORY',

  // Wizard session management
  WIZARD_OPEN = 'WIZARD_OPEN',
  WIZARD_INIT = 'WIZARD_INIT',
  WIZARD_SAVE_STATE = 'WIZARD_SAVE_STATE',
  WIZARD_LOAD_STATE = 'WIZARD_LOAD_STATE',
  WIZARD_COMPLETE = 'WIZARD_COMPLETE',
  WIZARD_CHECK_WALLET_LOCKED = 'WIZARD_CHECK_WALLET_LOCKED',

  // Private key export/import
  EXPORT_PRIVATE_KEY = 'EXPORT_PRIVATE_KEY',
  IMPORT_PRIVATE_KEY = 'IMPORT_PRIVATE_KEY',
  VALIDATE_WIF = 'VALIDATE_WIF',

  // Account xpub export
  EXPORT_ACCOUNT_XPUB = 'EXPORT_ACCOUNT_XPUB',

  // Wallet backup/restore
  EXPORT_WALLET_BACKUP = 'EXPORT_WALLET_BACKUP',
  IMPORT_WALLET_BACKUP = 'IMPORT_WALLET_BACKUP',
  VALIDATE_BACKUP_FILE = 'VALIDATE_BACKUP_FILE',
}

export interface Message<T = any> {
  type: MessageType;
  payload?: T;
}

export interface MessageResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: PrivateKeyErrorCode | string;
  details?: any;
}

// Private Key Export/Import Types

export enum PrivateKeyErrorCode {
  // Export errors
  WALLET_LOCKED = 'WALLET_LOCKED',
  ACCOUNT_NOT_FOUND = 'ACCOUNT_NOT_FOUND',
  MULTISIG_NOT_SUPPORTED = 'MULTISIG_NOT_SUPPORTED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',

  // Import errors
  INVALID_WIF_FORMAT = 'INVALID_WIF_FORMAT',
  INVALID_WIF_CHECKSUM = 'INVALID_WIF_CHECKSUM',
  WRONG_NETWORK = 'WRONG_NETWORK',
  DUPLICATE_KEY = 'DUPLICATE_KEY',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  IMPORT_FAILED = 'IMPORT_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

// Export Private Key Request/Response
export interface ExportPrivateKeyRequest {
  accountIndex: number;
  password?: string; // Optional password for encryption
}

export interface ExportPrivateKeyMetadata {
  accountName: string;
  addressType: string;
  firstAddress: string;
  network: 'testnet' | 'mainnet';
  timestamp: number;
  encrypted: boolean;
}

export interface ExportPrivateKeyResponse {
  success: true;
  data: {
    wif?: string;             // If plaintext
    encryptedData?: string;   // If encrypted
    salt?: string;
    iv?: string;
    metadata: ExportPrivateKeyMetadata;
  };
}

// Import Private Key Request/Response
export interface ImportPrivateKeyRequest {
  wif: string;               // Decrypted WIF
  name: string;              // Account name
  walletPassword?: string;   // Only for initial wallet setup
}

export interface ImportPrivateKeyResponse {
  success: true;
  data: {
    account: WalletAccount;
    firstAddress: string;
  };
}

// Validate WIF Request/Response
export interface ValidateWIFRequest {
  wif: string;
}

export interface ValidateWIFResponse {
  success: true;
  data: {
    valid: boolean;
    network?: 'testnet' | 'mainnet';
    firstAddress?: string;
    addressType?: AddressType;
    compressed?: boolean;
    error?: string;
  };
}

// Error Response
export interface PrivateKeyErrorResponse {
  success: false;
  error: string;
  code?: PrivateKeyErrorCode;
  details?: {
    existingAccountIndex?: number;
    existingAccountName?: string;
  };
}

// Create Wallet from Private Key Request/Response
export interface CreateWalletFromPrivateKeyRequest {
  wif: string;              // Decrypted WIF string
  addressType: AddressType; // User-selected address type
  accountName?: string;     // Account name (default "Account 1")
  password: string;         // New wallet password
}

export interface CreateWalletFromPrivateKeyResponse {
  success: true;
  data: {
    account: WalletAccount;
    firstAddress: string;
  };
}

// Wallet Backup/Restore Types

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
 * Result of export operation
 */
export interface WalletBackupExportResult {
  success: boolean;
  filename: string;
  checksum: string;
  fileSize: number;
  network: 'testnet' | 'mainnet';
  accountCount: number;
  contactCount: number;
}

/**
 * Result of import operation
 */
export interface WalletBackupImportResult {
  success: boolean;
  accountCount: number;
  contactCount: number;
  network: 'testnet' | 'mainnet';
  backupCreated: number;
  hasMultisig: boolean;
  hasImportedKeys: boolean;
}

/**
 * Result of backup file validation
 */
export interface WalletBackupValidationResult {
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
export type WalletBackupProgressCallback = (progress: number, step: string) => void;

// Export Wallet Backup Request/Response
export interface ExportWalletBackupRequest {
  walletPassword: string;
  backupPassword: string;
}

export interface ExportWalletBackupResponse {
  success: true;
  data: {
    backupFile: EncryptedBackupFile;
    metadata: {
      filename: string;
      checksum: string;
      fileSize: number;
      network: 'testnet' | 'mainnet';
      accountCount: number;
      contactCount: number;
    };
  };
}

// Import Wallet Backup Request/Response
export interface ImportWalletBackupRequest {
  backupFile: EncryptedBackupFile;
  backupPassword: string;
  replaceExisting: boolean; // true = replace wallet, false = fresh install
}

export interface ImportWalletBackupResponse {
  success: true;
  data: {
    accountCount: number;
    contactCount: number;
    network: 'testnet' | 'mainnet';
    backupCreated: number;
    hasMultisig: boolean;
    hasImportedKeys: boolean;
    networkChanged?: boolean; // true if network changed from current wallet
  };
}

// Validate Backup File Request/Response
export interface ValidateBackupFileRequest {
  backupFile: any; // Raw file data to validate
}

export interface ValidateBackupFileResponse {
  success: true;
  data: {
    valid: boolean;
    version?: number;
    network?: 'testnet' | 'mainnet';
    created?: number;
    accountCount?: number;
    contactCount?: number;
    error?: string;
  };
}

// Wallet Backup Error Codes
export enum WalletBackupErrorCode {
  // Export errors
  WALLET_LOCKED = 'WALLET_LOCKED',
  INCORRECT_PASSWORD = 'INCORRECT_PASSWORD',
  PASSWORDS_MATCH = 'PASSWORDS_MATCH',
  BACKUP_PASSWORD_TOO_SHORT = 'BACKUP_PASSWORD_TOO_SHORT',
  EXPORT_FAILED = 'EXPORT_FAILED',

  // Import errors
  INVALID_FILE_FORMAT = 'INVALID_FILE_FORMAT',
  INVALID_BACKUP_VERSION = 'INVALID_BACKUP_VERSION',
  CHECKSUM_MISMATCH = 'CHECKSUM_MISMATCH',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  NETWORK_MISMATCH = 'NETWORK_MISMATCH',
  IMPORT_FAILED = 'IMPORT_FAILED',

  // Validation errors
  VALIDATION_FAILED = 'VALIDATION_FAILED',
}

// Wallet Backup Error Response
export interface WalletBackupErrorResponse {
  success: false;
  error: string;
  code?: WalletBackupErrorCode;
  details?: {
    currentNetwork?: 'testnet' | 'mainnet';
    backupNetwork?: 'testnet' | 'mainnet';
    version?: number;
  };
}
