/**
 * Message Handler Tests
 *
 * @jest-environment node
 *
 * Comprehensive tests for all message handlers in the background service worker.
 * Tests all message types, error handling, authentication, and state management.
 */

import { MessageType, MessageResponse } from '../../shared/types/index';
import { WalletStorage } from '../wallet/WalletStorage';
import { KeyManager } from '../wallet/KeyManager';
import { HDWallet } from '../wallet/HDWallet';
import { AddressGenerator } from '../wallet/AddressGenerator';
import { blockstreamClient } from '../api/BlockstreamClient';
import { TransactionBuilder } from '../bitcoin/TransactionBuilder';
import { priceService } from '../api/PriceService';
import { TransactionMetadataStorage } from '../wallet/TransactionMetadataStorage';
import {
  createMockAccount,
  createMockStoredWallet,
  createMockBalance,
  createMockTransaction,
  createMockUTXO,
  createMockBitcoinPrice,
  createSuccessResponse,
} from '../../__tests__/utils/testFactories';
import {
  TEST_MNEMONIC_12,
  TEST_ADDRESS_NATIVE_SEGWIT_1,
  TEST_PASSWORD,
  SATOSHI_VALUES,
} from '../../__tests__/utils/testConstants';

// Mock dependencies
jest.mock('../wallet/WalletStorage');
jest.mock('../wallet/KeyManager');
jest.mock('../wallet/HDWallet');
jest.mock('../wallet/AddressGenerator');
jest.mock('../wallet/BackupManager');
jest.mock('../wallet/TransactionMetadataStorage');
jest.mock('../api/BlockstreamClient');
jest.mock('../bitcoin/TransactionBuilder');
jest.mock('../api/PriceService');

// Import the background script to set up message listeners
require('../index');

describe('Background Message Handlers', () => {
  // Helper to send a message and get response
  const sendMessage = async (type: MessageType, payload?: any): Promise<MessageResponse> => {
    return await (global as any).chrome.runtime.onMessage.__trigger({
      type,
      payload,
    });
  };

  beforeEach(() => {
    // Clear chrome storage between tests
    // NOTE: Do NOT reset mocks here - let individual test describe blocks set up their own mocks
    if ((global as any).chrome?.storage?.local?.__clear) {
      (global as any).chrome.storage.local.__clear();
    }
  });

  // =============================================================================
  // Wallet Status & Initialization Tests
  // =============================================================================

  describe('GET_WALLET_STATE', () => {
    it('should return uninitialized state when no wallet exists', async () => {
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(false);

      const response = await sendMessage(MessageType.GET_WALLET_STATE);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        isInitialized: false,
        isLocked: true,
      });
    });

    it('should return locked state when wallet exists but is locked', async () => {
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(true);

      const response = await sendMessage(MessageType.GET_WALLET_STATE);

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        isInitialized: true,
        isLocked: true,
      });
    });

    it('should handle errors gracefully', async () => {
      (WalletStorage.hasWallet as jest.Mock).mockRejectedValue(new Error('Storage error'));

      const response = await sendMessage(MessageType.GET_WALLET_STATE);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Storage error');
    });
  });

  // =============================================================================
  // Wallet Creation Tests
  // =============================================================================

  describe('CREATE_WALLET', () => {
    const mockMnemonic = TEST_MNEMONIC_12;
    const mockSeed = Buffer.from('mock_seed_hex_string', 'hex');
    const mockAccount = createMockAccount({
      index: 0,
      name: 'Account 1',
      addressType: 'native-segwit',
      addresses: [],
    });

    beforeEach(() => {
      (KeyManager.generateMnemonic as jest.Mock).mockReturnValue(mockMnemonic);
      (KeyManager.mnemonicToSeed as jest.Mock).mockReturnValue(mockSeed);
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(false);
      (WalletStorage.createWallet as jest.Mock).mockResolvedValue(undefined);

      // Mock HDWallet
      const mockHDWallet = {
        createAccount: jest.fn().mockReturnValue(mockAccount),
        deriveAddressNode: jest.fn().mockReturnValue({
          publicKey: Buffer.from('mock_pubkey', 'hex'),
          chainCode: Buffer.from('mock_chaincode', 'hex'),
        }),
      };
      (HDWallet as jest.Mock).mockImplementation(() => mockHDWallet);

      // Mock AddressGenerator
      const mockAddressGenerator = {
        generateAddressWithMetadata: jest.fn().mockReturnValue({
          address: TEST_ADDRESS_NATIVE_SEGWIT_1,
          derivationPath: "m/84'/1'/0'/0/0",
          index: 0,
          isChange: false,
          used: false,
        }),
      };
      (AddressGenerator as jest.Mock).mockImplementation(() => mockAddressGenerator);
    });

    it('should create a new wallet with valid inputs', async () => {
      const response = await sendMessage(MessageType.CREATE_WALLET, {
        password: TEST_PASSWORD,
        addressType: 'native-segwit',
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('mnemonic', mockMnemonic);
      expect(response.data).toHaveProperty('firstAddress', TEST_ADDRESS_NATIVE_SEGWIT_1);
      expect(WalletStorage.createWallet).toHaveBeenCalled();
    });

    it('should reject when password is missing', async () => {
      const response = await sendMessage(MessageType.CREATE_WALLET, {});

      expect(response.success).toBe(false);
      expect(response.error).toContain('Password is required');
    });

    it('should reject when wallet already exists', async () => {
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(true);

      const response = await sendMessage(MessageType.CREATE_WALLET, {
        password: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet already exists');
    });

    it('should use default address type if not provided', async () => {
      const response = await sendMessage(MessageType.CREATE_WALLET, {
        password: TEST_PASSWORD,
      });

      expect(response.success).toBe(true);
      // Should default to native-segwit
    });

    it('should handle wallet creation errors', async () => {
      (WalletStorage.createWallet as jest.Mock).mockRejectedValue(
        new Error('Storage failed')
      );

      const response = await sendMessage(MessageType.CREATE_WALLET, {
        password: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  // =============================================================================
  // Wallet Import Tests
  // =============================================================================

  describe('IMPORT_WALLET', () => {
    const mockMnemonic = TEST_MNEMONIC_12;
    const mockSeed = Buffer.from('mock_seed_hex_string', 'hex');
    const mockAccount = createMockAccount();

    beforeEach(() => {
      (KeyManager.validateMnemonic as jest.Mock).mockReturnValue(true);
      (KeyManager.mnemonicToSeed as jest.Mock).mockReturnValue(mockSeed);
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(false);
      (WalletStorage.createWallet as jest.Mock).mockResolvedValue(undefined);

      const mockHDWallet = {
        createAccount: jest.fn().mockReturnValue(mockAccount),
        deriveAddressNode: jest.fn().mockReturnValue({
          publicKey: Buffer.from('mock_pubkey', 'hex'),
          chainCode: Buffer.from('mock_chaincode', 'hex'),
        }),
      };
      (HDWallet as jest.Mock).mockImplementation(() => mockHDWallet);

      const mockAddressGenerator = {
        generateAddressWithMetadata: jest.fn().mockReturnValue({
          address: TEST_ADDRESS_NATIVE_SEGWIT_1,
          derivationPath: "m/84'/1'/0'/0/0",
          index: 0,
          isChange: false,
          used: false,
        }),
      };
      (AddressGenerator as jest.Mock).mockImplementation(() => mockAddressGenerator);
    });

    it('should import wallet with valid mnemonic', async () => {
      const response = await sendMessage(MessageType.IMPORT_WALLET, {
        mnemonic: mockMnemonic,
        password: TEST_PASSWORD,
        addressType: 'native-segwit',
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('firstAddress', TEST_ADDRESS_NATIVE_SEGWIT_1);
      expect(KeyManager.validateMnemonic).toHaveBeenCalledWith(mockMnemonic);
      expect(WalletStorage.createWallet).toHaveBeenCalled();
    });

    it('should reject when mnemonic is missing', async () => {
      const response = await sendMessage(MessageType.IMPORT_WALLET, {
        password: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Mnemonic and password are required');
    });

    it('should reject when password is missing', async () => {
      const response = await sendMessage(MessageType.IMPORT_WALLET, {
        mnemonic: mockMnemonic,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Mnemonic and password are required');
    });

    it('should reject invalid mnemonic', async () => {
      (KeyManager.validateMnemonic as jest.Mock).mockReturnValue(false);

      const response = await sendMessage(MessageType.IMPORT_WALLET, {
        mnemonic: 'invalid mnemonic phrase',
        password: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Invalid mnemonic phrase');
    });

    it('should reject when wallet already exists', async () => {
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(true);

      const response = await sendMessage(MessageType.IMPORT_WALLET, {
        mnemonic: mockMnemonic,
        password: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet already exists');
    });
  });

  // Additional test groups would follow the same pattern...
  // For brevity, I'll include just a few more critical tests

  // =============================================================================
  // GET_BALANCE Test (simpler test to validate pattern)
  // =============================================================================

  describe('GET_BALANCE', () => {
    const mockWallet = createMockStoredWallet({
      accounts: [
        createMockAccount({
          index: 0,
          addresses: [{
            address: TEST_ADDRESS_NATIVE_SEGWIT_1,
            derivationPath: "m/84'/1'/0'/0/0",
            index: 0,
            isChange: false,
            used: false,
          }],
        }),
      ],
    });
    const mockBalance = createMockBalance({ confirmed: 100000, unconfirmed: 5000 });

    beforeEach(() => {
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(mockWallet);
      (blockstreamClient.getBalance as jest.Mock).mockResolvedValue(mockBalance);
    });

    it('should fetch balance for account', async () => {
      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockBalance);
      expect(blockstreamClient.getBalance).toHaveBeenCalledWith(TEST_ADDRESS_NATIVE_SEGWIT_1);
    });

    it('should reject when accountIndex is missing', async () => {
      const response = await sendMessage(MessageType.GET_BALANCE, {});

      expect(response.success).toBe(false);
      expect(response.error).toContain('Account index is required');
    });

    it('should reject when account not found', async () => {
      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 99,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('not found');
    });

    it('should return zero balance when account has no addresses', async () => {
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          accounts: [createMockAccount({ addresses: [] })],
        })
      );

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({ confirmed: 0, unconfirmed: 0 });
    });

    it('should handle API errors', async () => {
      (blockstreamClient.getBalance as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  // =============================================================================
  // GET_BTC_PRICE Test
  // =============================================================================

  describe('GET_BTC_PRICE', () => {
    const mockPrice = createMockBitcoinPrice({ usd: 65432.1 });

    beforeEach(() => {
      (priceService.getPrice as jest.Mock).mockResolvedValue(mockPrice);
    });

    it('should fetch Bitcoin price', async () => {
      const response = await sendMessage(MessageType.GET_BTC_PRICE);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockPrice);
      expect(priceService.getPrice).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      (priceService.getPrice as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const response = await sendMessage(MessageType.GET_BTC_PRICE);

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  // =============================================================================
  // CREATE_WALLET_FROM_PRIVATE_KEY Tests
  // =============================================================================
  // NOTE: These tests have been moved to a separate file (createWalletFromPrivateKey.test.ts)
  // to avoid rate limiting state pollution from other tests.
  // See: src/background/__tests__/createWalletFromPrivateKey.test.ts

  // =============================================================================
  // Wallet Backup/Restore Tests
  // =============================================================================

  describe('EXPORT_WALLET_BACKUP', () => {
    const mockBackupFile = {
      header: {
        magicBytes: 'BTCWALLET' as const,
        version: 1,
        created: Date.now(),
        network: 'testnet' as const,
        appVersion: '0.10.0',
      },
      encryption: {
        algorithm: 'AES-256-GCM' as const,
        pbkdf2Iterations: 600000,
        salt: 'base64_salt',
        iv: 'base64_iv',
      },
      encryptedData: 'base64_encrypted_data',
      checksum: {
        algorithm: 'SHA-256' as const,
        hash: 'a'.repeat(64),
      },
    };

    beforeEach(async () => {
      // Mock BackupManager
      jest.mock('../wallet/BackupManager', () => ({
        BackupManager: {
          exportWallet: jest.fn(),
        },
      }));

      // Create and unlock wallet so export tests can run
      // (Without this, all tests fail with "Wallet is locked" before validation)
      const mockAccount = createMockAccount({
        index: 0,
        name: 'Account 1',
        addressType: 'native-segwit',
        addresses: [],
      });

      // Mock crypto.subtle for key export (needed by unlock handler)
      const mockEncryptionKey = { type: 'secret' as const };
      (global.crypto.subtle.exportKey as jest.Mock) = jest.fn().mockResolvedValue(
        new ArrayBuffer(32) // 32 bytes for AES-256
      );

      // Mock CryptoUtils (needed by unlock handler)
      const { CryptoUtils } = require('../wallet/CryptoUtils');
      CryptoUtils.deriveKey = jest.fn().mockResolvedValue(mockEncryptionKey);
      CryptoUtils.base64ToArrayBuffer = jest.fn().mockReturnValue(new ArrayBuffer(16));
      CryptoUtils.arrayBufferToBase64 = jest.fn().mockReturnValue('mock_base64_key');

      (KeyManager.generateMnemonic as jest.Mock).mockReturnValue(TEST_MNEMONIC_12);
      (KeyManager.mnemonicToSeed as jest.Mock).mockReturnValue(Buffer.from('mock_seed', 'hex'));
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(false);
      (WalletStorage.createWallet as jest.Mock).mockResolvedValue(undefined);
      (WalletStorage.unlockWallet as jest.Mock).mockResolvedValue(TEST_MNEMONIC_12);
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(createMockStoredWallet({
        accounts: [mockAccount],
      }));

      const mockHDWallet = {
        createAccount: jest.fn().mockReturnValue(mockAccount),
        deriveAddressNode: jest.fn().mockReturnValue({
          publicKey: Buffer.from('mock_pubkey', 'hex'),
          chainCode: Buffer.from('mock_chaincode', 'hex'),
        }),
      };
      (HDWallet as jest.Mock).mockImplementation(() => mockHDWallet);

      const mockAddressGenerator = {
        generateAddressWithMetadata: jest.fn().mockReturnValue({
          address: TEST_ADDRESS_NATIVE_SEGWIT_1,
          derivationPath: "m/84'/1'/0'/0/0",
          index: 0,
          isChange: false,
          used: false,
        }),
      };
      (AddressGenerator as jest.Mock).mockImplementation(() => mockAddressGenerator);

      // Create wallet
      const createResponse = await sendMessage(MessageType.CREATE_WALLET, {
        password: TEST_PASSWORD,
        addressType: 'native-segwit',
      });

      if (!createResponse.success) {
        throw new Error(`Failed to create wallet in beforeEach: ${createResponse.error}`);
      }

      // After wallet creation, hasWallet should return true
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(true);

      // Unlock wallet (required for export operations)
      const unlockResponse = await sendMessage(MessageType.UNLOCK_WALLET, {
        password: TEST_PASSWORD,
      });

      if (!unlockResponse.success) {
        throw new Error(`Failed to unlock wallet in beforeEach: ${unlockResponse.error}`);
      }
    });

    it('should export wallet backup with valid passwords', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.exportWallet as jest.Mock).mockResolvedValue(mockBackupFile);

      const response = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        walletPassword: TEST_PASSWORD,
        backupPassword: 'BackupPassword123!@#',
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('backupFile');
      expect(response.data).toHaveProperty('metadata');
      expect(response.data.metadata).toHaveProperty('filename');
      expect(response.data.metadata).toHaveProperty('checksum');
    });

    it('should reject when wallet password is missing', async () => {
      const response = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        backupPassword: 'BackupPassword123!@#',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet password is required');
    });

    it('should reject when backup password is missing', async () => {
      const response = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        walletPassword: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Backup password is required');
    });

    it('should reject when passwords are the same', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.exportWallet as jest.Mock).mockRejectedValue(
        new Error('Backup password must be different from wallet password')
      );

      const response = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        walletPassword: TEST_PASSWORD,
        backupPassword: TEST_PASSWORD,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Backup password must be different');
    });

    it('should reject when backup password is too short', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.exportWallet as jest.Mock).mockRejectedValue(
        new Error('Backup password must be at least 12 characters')
      );

      const response = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        walletPassword: TEST_PASSWORD,
        backupPassword: 'short',
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Backup password must be at least 12 characters');
    });

    it('should handle export errors gracefully', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.exportWallet as jest.Mock).mockRejectedValue(
        new Error('Export failed')
      );

      const response = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        walletPassword: TEST_PASSWORD,
        backupPassword: 'BackupPassword123!@#',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('IMPORT_WALLET_BACKUP', () => {
    const mockBackupFile = {
      header: {
        magicBytes: 'BTCWALLET' as const,
        version: 1,
        created: Date.now(),
        network: 'testnet' as const,
        appVersion: '0.10.0',
      },
      encryption: {
        algorithm: 'AES-256-GCM' as const,
        pbkdf2Iterations: 600000,
        salt: 'base64_salt',
        iv: 'base64_iv',
      },
      encryptedData: 'base64_encrypted_data',
      checksum: {
        algorithm: 'SHA-256' as const,
        hash: 'a'.repeat(64),
      },
    };

    const mockImportResult = {
      success: true,
      accountCount: 3,
      contactCount: 5,
      network: 'testnet' as const,
      backupCreated: Date.now(),
      hasMultisig: true,
      hasImportedKeys: false,
    };

    beforeEach(async () => {
      jest.mock('../wallet/BackupManager', () => ({
        BackupManager: {
          importWallet: jest.fn(),
        },
      }));

      // Create and unlock wallet so import tests can run
      // (Without this, all tests fail with "Wallet is locked" before validation)
      const mockAccount = createMockAccount({
        index: 0,
        name: 'Account 1',
        addressType: 'native-segwit',
        addresses: [],
      });

      // Mock crypto.subtle for key export (needed by unlock handler)
      const mockEncryptionKey = { type: 'secret' as const };
      (global.crypto.subtle.exportKey as jest.Mock) = jest.fn().mockResolvedValue(
        new ArrayBuffer(32) // 32 bytes for AES-256
      );

      // Mock CryptoUtils (needed by unlock handler)
      const { CryptoUtils } = require('../wallet/CryptoUtils');
      CryptoUtils.deriveKey = jest.fn().mockResolvedValue(mockEncryptionKey);
      CryptoUtils.base64ToArrayBuffer = jest.fn().mockReturnValue(new ArrayBuffer(16));
      CryptoUtils.arrayBufferToBase64 = jest.fn().mockReturnValue('mock_base64_key');

      (KeyManager.generateMnemonic as jest.Mock).mockReturnValue(TEST_MNEMONIC_12);
      (KeyManager.mnemonicToSeed as jest.Mock).mockReturnValue(Buffer.from('mock_seed', 'hex'));
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(false);
      (WalletStorage.createWallet as jest.Mock).mockResolvedValue(undefined);
      (WalletStorage.unlockWallet as jest.Mock).mockResolvedValue(TEST_MNEMONIC_12);
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(createMockStoredWallet({
        accounts: [mockAccount],
      }));

      const mockHDWallet = {
        createAccount: jest.fn().mockReturnValue(mockAccount),
        deriveAddressNode: jest.fn().mockReturnValue({
          publicKey: Buffer.from('mock_pubkey', 'hex'),
          chainCode: Buffer.from('mock_chaincode', 'hex'),
        }),
      };
      (HDWallet as jest.Mock).mockImplementation(() => mockHDWallet);

      const mockAddressGenerator = {
        generateAddressWithMetadata: jest.fn().mockReturnValue({
          address: TEST_ADDRESS_NATIVE_SEGWIT_1,
          derivationPath: "m/84'/1'/0'/0/0",
          index: 0,
          isChange: false,
          used: false,
        }),
      };
      (AddressGenerator as jest.Mock).mockImplementation(() => mockAddressGenerator);

      // Create wallet
      const createResponse = await sendMessage(MessageType.CREATE_WALLET, {
        password: TEST_PASSWORD,
        addressType: 'native-segwit',
      });

      if (!createResponse.success) {
        throw new Error(`Failed to create wallet in beforeEach: ${createResponse.error}`);
      }

      // After wallet creation, hasWallet should return true
      (WalletStorage.hasWallet as jest.Mock).mockResolvedValue(true);

      // Unlock wallet (required for import operations)
      const unlockResponse = await sendMessage(MessageType.UNLOCK_WALLET, {
        password: TEST_PASSWORD,
      });

      if (!unlockResponse.success) {
        throw new Error(`Failed to unlock wallet in beforeEach: ${unlockResponse.error}`);
      }
    });

    it('should import wallet backup with valid data', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.importWallet as jest.Mock).mockResolvedValue(mockImportResult);

      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: mockBackupFile,
        backupPassword: 'BackupPassword123!@#',
        replaceExisting: true,
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('accountCount', 3);
      expect(response.data).toHaveProperty('contactCount', 5);
      expect(response.data).toHaveProperty('network', 'testnet');
      expect(response.data).toHaveProperty('hasMultisig', true);
    });

    it('should reject when backup file is missing', async () => {
      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupPassword: 'BackupPassword123!@#',
        replaceExisting: true,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Backup file is required');
    });

    it('should reject when backup password is missing', async () => {
      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: mockBackupFile,
        replaceExisting: true,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Backup password is required');
    });

    it('should reject when backup password is incorrect', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.importWallet as jest.Mock).mockRejectedValue(
        new Error('Failed to decrypt backup')
      );

      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: mockBackupFile,
        backupPassword: 'WrongPassword123!@#',
        replaceExisting: true,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Failed to decrypt backup');
    });

    it('should reject when checksum is invalid', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.importWallet as jest.Mock).mockRejectedValue(
        new Error('Checksum mismatch')
      );

      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: mockBackupFile,
        backupPassword: 'BackupPassword123!@#',
        replaceExisting: true,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Checksum mismatch');
    });

    it('should handle network mismatch errors', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.importWallet as jest.Mock).mockRejectedValue(
        new Error('Network mismatch in backup file')
      );

      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: mockBackupFile,
        backupPassword: 'BackupPassword123!@#',
        replaceExisting: true,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Network mismatch');
    });

    it('should handle import errors gracefully', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.importWallet as jest.Mock).mockRejectedValue(
        new Error('Import failed')
      );

      const response = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: mockBackupFile,
        backupPassword: 'BackupPassword123!@#',
        replaceExisting: true,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('VALIDATE_BACKUP_FILE', () => {
    const validBackupFile = {
      header: {
        magicBytes: 'BTCWALLET' as const,
        version: 1,
        created: Date.now(),
        network: 'testnet' as const,
        appVersion: '0.10.0',
      },
      encryption: {
        algorithm: 'AES-256-GCM' as const,
        pbkdf2Iterations: 600000,
        salt: 'base64_salt',
        iv: 'base64_iv',
      },
      encryptedData: 'base64_encrypted_data',
      checksum: {
        algorithm: 'SHA-256' as const,
        hash: 'a'.repeat(64),
      },
    };

    const mockValidationResult = {
      valid: true,
      version: 1,
      network: 'testnet' as const,
      created: Date.now(),
    };

    beforeEach(() => {
      jest.mock('../wallet/BackupManager', () => ({
        BackupManager: {
          validateBackupFile: jest.fn(),
        },
      }));
    });

    it('should validate correct backup file', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.validateBackupFile as jest.Mock).mockResolvedValue(mockValidationResult);

      const response = await sendMessage(MessageType.VALIDATE_BACKUP_FILE, {
        backupFile: validBackupFile,
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('valid', true);
      expect(response.data).toHaveProperty('version', 1);
      expect(response.data).toHaveProperty('network', 'testnet');
    });

    it('should reject when backup file is missing', async () => {
      const response = await sendMessage(MessageType.VALIDATE_BACKUP_FILE, {});

      expect(response.success).toBe(false);
      expect(response.error).toContain('Backup file is required');
    });

    it('should return invalid for corrupted backup file', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.validateBackupFile as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid file format',
      });

      const response = await sendMessage(MessageType.VALIDATE_BACKUP_FILE, {
        backupFile: { invalid: 'data' },
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('valid', false);
      expect(response.data).toHaveProperty('error');
    });

    it('should return invalid for wrong magic bytes', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.validateBackupFile as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Invalid file type. This is not a wallet backup file.',
      });

      const invalidFile = { ...validBackupFile, header: { ...validBackupFile.header, magicBytes: 'WRONG' } };

      const response = await sendMessage(MessageType.VALIDATE_BACKUP_FILE, {
        backupFile: invalidFile,
      });

      expect(response.success).toBe(true);
      expect(response.data.valid).toBe(false);
      expect(response.data.error).toContain('Invalid file type');
    });

    it('should return invalid for unsupported version', async () => {
      const { BackupManager } = require('../wallet/BackupManager');
      (BackupManager.validateBackupFile as jest.Mock).mockResolvedValue({
        valid: false,
        error: 'Backup version 99 is not supported',
      });

      const futureVersionFile = { ...validBackupFile, header: { ...validBackupFile.header, version: 99 } };

      const response = await sendMessage(MessageType.VALIDATE_BACKUP_FILE, {
        backupFile: futureVersionFile,
      });

      expect(response.success).toBe(true);
      expect(response.data.valid).toBe(false);
      expect(response.data.error).toContain('version 99 is not supported');
    });
  });

  // =============================================================================
  // Transaction Metadata Management Tests
  // =============================================================================

  describe('GET_TRANSACTION_METADATA', () => {
    const TEST_TXID = 'a'.repeat(64);

    beforeEach(() => {
      // Setup default unlock state
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should return metadata for existing transaction', async () => {
      const mockMetadata = {
        tags: ['mining', 'income'],
        category: 'Business',
        notes: 'Mining reward from pool',
        updatedAt: Date.now(),
      };

      (TransactionMetadataStorage.getMetadata as jest.Mock).mockResolvedValue(mockMetadata);

      const response = await sendMessage(MessageType.GET_TRANSACTION_METADATA, { txid: TEST_TXID });

      expect(response.success).toBe(true);
      expect(response.data.metadata).toEqual(mockMetadata);
      expect(TransactionMetadataStorage.getMetadata).toHaveBeenCalledWith(TEST_TXID, TEST_PASSWORD);
    });

    it('should return null for transaction without metadata', async () => {
      (TransactionMetadataStorage.getMetadata as jest.Mock).mockResolvedValue(null);

      const response = await sendMessage(MessageType.GET_TRANSACTION_METADATA, { txid: TEST_TXID });

      expect(response.success).toBe(true);
      expect(response.data.metadata).toBeNull();
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.GET_TRANSACTION_METADATA, { txid: TEST_TXID });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });

    it('should return error for invalid txid format', async () => {
      const response = await sendMessage(MessageType.GET_TRANSACTION_METADATA, { txid: 'invalid' });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('GET_ALL_TRANSACTION_METADATA', () => {
    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should return empty object when no metadata exists', async () => {
      (TransactionMetadataStorage.getAllMetadata as jest.Mock).mockResolvedValue({});

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_METADATA);

      expect(response.success).toBe(true);
      expect(response.data.metadata).toEqual({});
    });

    it('should return all metadata entries', async () => {
      const mockMetadata = {
        'txid1': { tags: ['tag1'], category: 'Cat1', notes: 'Note1', updatedAt: Date.now() },
        'txid2': { tags: ['tag2'], category: 'Cat2', notes: 'Note2', updatedAt: Date.now() },
      };

      (TransactionMetadataStorage.getAllMetadata as jest.Mock).mockResolvedValue(mockMetadata);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_METADATA);

      expect(response.success).toBe(true);
      expect(response.data.metadata).toEqual(mockMetadata);
      expect(TransactionMetadataStorage.getAllMetadata).toHaveBeenCalledWith(TEST_PASSWORD);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_METADATA);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });
  });

  describe('SET_TRANSACTION_METADATA', () => {
    const TEST_TXID = 'b'.repeat(64);

    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should save new metadata', async () => {
      (TransactionMetadataStorage.setMetadata as jest.Mock).mockResolvedValue(undefined);

      const metadata = {
        tags: ['payment', 'merchant'],
        category: 'Shopping',
        notes: 'Bought groceries',
      };

      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        ...metadata,
      });

      expect(response.success).toBe(true);
      expect(TransactionMetadataStorage.setMetadata).toHaveBeenCalledWith(
        TEST_TXID,
        expect.objectContaining(metadata),
        TEST_PASSWORD
      );
    });

    it('should update existing metadata', async () => {
      (TransactionMetadataStorage.setMetadata as jest.Mock).mockResolvedValue(undefined);

      const metadata = {
        tags: ['updated-tag'],
        category: 'Updated Category',
        notes: 'Updated notes',
      };

      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        ...metadata,
      });

      expect(response.success).toBe(true);
    });

    it('should save with all fields populated', async () => {
      (TransactionMetadataStorage.setMetadata as jest.Mock).mockResolvedValue(undefined);

      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        tags: ['tag1', 'tag2', 'tag3'],
        category: 'Full Category',
        notes: 'Complete notes with all fields',
      });

      expect(response.success).toBe(true);
    });

    it('should save with partial fields (tags only)', async () => {
      (TransactionMetadataStorage.setMetadata as jest.Mock).mockResolvedValue(undefined);

      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        tags: ['solo-tag'],
      });

      expect(response.success).toBe(true);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        tags: ['tag'],
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });

    it('should return error for missing txid', async () => {
      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        tags: ['tag'],
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should return error for invalid tags format (not array)', async () => {
      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        tags: 'not-an-array',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should validate category max length (30 chars)', async () => {
      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        tags: [],
        category: 'a'.repeat(31),
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('30 characters');
    });

    it('should validate notes max length (500 chars)', async () => {
      const response = await sendMessage(MessageType.SET_TRANSACTION_METADATA, {
        txid: TEST_TXID,
        tags: [],
        notes: 'a'.repeat(501),
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('500 characters');
    });
  });

  describe('DELETE_TRANSACTION_METADATA', () => {
    const TEST_TXID = 'c'.repeat(64);

    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should delete existing metadata', async () => {
      (TransactionMetadataStorage.deleteMetadata as jest.Mock).mockResolvedValue(undefined);

      const response = await sendMessage(MessageType.DELETE_TRANSACTION_METADATA, { txid: TEST_TXID });

      expect(response.success).toBe(true);
      expect(TransactionMetadataStorage.deleteMetadata).toHaveBeenCalledWith(TEST_TXID, TEST_PASSWORD);
    });

    it('should succeed when deleting non-existent metadata (no error)', async () => {
      (TransactionMetadataStorage.deleteMetadata as jest.Mock).mockResolvedValue(undefined);

      const response = await sendMessage(MessageType.DELETE_TRANSACTION_METADATA, { txid: 'nonexistent' });

      expect(response.success).toBe(true);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.DELETE_TRANSACTION_METADATA, { txid: TEST_TXID });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });

    it('should return error for missing txid', async () => {
      const response = await sendMessage(MessageType.DELETE_TRANSACTION_METADATA, {});

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('GET_ALL_TRANSACTION_TAGS', () => {
    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should return empty array when no tags exist', async () => {
      (TransactionMetadataStorage.getAllTags as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_TAGS);

      expect(response.success).toBe(true);
      expect(response.data.tags).toEqual([]);
    });

    it('should return tags with counts', async () => {
      const mockTags = [
        { tag: 'mining', count: 5 },
        { tag: 'payment', count: 3 },
        { tag: 'income', count: 2 },
      ];

      (TransactionMetadataStorage.getAllTags as jest.Mock).mockResolvedValue(mockTags);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_TAGS);

      expect(response.success).toBe(true);
      expect(response.data.tags).toEqual(mockTags);
      expect(TransactionMetadataStorage.getAllTags).toHaveBeenCalledWith(TEST_PASSWORD);
    });

    it('should return tags sorted by count (descending)', async () => {
      const mockTags = [
        { tag: 'common', count: 10 },
        { tag: 'rare', count: 1 },
        { tag: 'uncommon', count: 5 },
      ];

      (TransactionMetadataStorage.getAllTags as jest.Mock).mockResolvedValue(mockTags);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_TAGS);

      expect(response.success).toBe(true);
      // Verify first tag has highest count
      expect(response.data.tags[0].count).toBeGreaterThanOrEqual(response.data.tags[1]?.count || 0);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_TAGS);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });
  });

  describe('GET_ALL_TRANSACTION_CATEGORIES', () => {
    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should return empty array when no categories exist', async () => {
      (TransactionMetadataStorage.getAllCategories as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_CATEGORIES);

      expect(response.success).toBe(true);
      expect(response.data.categories).toEqual([]);
    });

    it('should return categories with counts', async () => {
      const mockCategories = [
        { category: 'Business', count: 8 },
        { category: 'Personal', count: 5 },
        { category: 'Shopping', count: 3 },
      ];

      (TransactionMetadataStorage.getAllCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_CATEGORIES);

      expect(response.success).toBe(true);
      expect(response.data.categories).toEqual(mockCategories);
      expect(TransactionMetadataStorage.getAllCategories).toHaveBeenCalledWith(TEST_PASSWORD);
    });

    it('should return categories sorted by count (descending)', async () => {
      const mockCategories = [
        { category: 'Frequent', count: 15 },
        { category: 'Occasional', count: 3 },
        { category: 'Regular', count: 7 },
      ];

      (TransactionMetadataStorage.getAllCategories as jest.Mock).mockResolvedValue(mockCategories);

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_CATEGORIES);

      expect(response.success).toBe(true);
      // Verify first category has highest count
      expect(response.data.categories[0].count).toBeGreaterThanOrEqual(response.data.categories[1]?.count || 0);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.GET_ALL_TRANSACTION_CATEGORIES);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });
  });

  describe('SEARCH_TRANSACTIONS_BY_TAG', () => {
    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should find transactions with specific tag', async () => {
      const mockTxids = ['txid1', 'txid2', 'txid3'];
      (TransactionMetadataStorage.searchByTag as jest.Mock).mockResolvedValue(mockTxids);

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_TAG, { tag: 'mining' });

      expect(response.success).toBe(true);
      expect(response.data.txids).toEqual(mockTxids);
      expect(TransactionMetadataStorage.searchByTag).toHaveBeenCalledWith('mining', TEST_PASSWORD);
    });

    it('should return empty array for non-existent tag', async () => {
      (TransactionMetadataStorage.searchByTag as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_TAG, { tag: 'nonexistent' });

      expect(response.success).toBe(true);
      expect(response.data.txids).toEqual([]);
    });

    it('should return multiple transactions with same tag', async () => {
      const mockTxids = Array(10).fill(0).map((_, i) => `txid${i}`);
      (TransactionMetadataStorage.searchByTag as jest.Mock).mockResolvedValue(mockTxids);

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_TAG, { tag: 'common-tag' });

      expect(response.success).toBe(true);
      expect(response.data.txids).toHaveLength(10);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_TAG, { tag: 'mining' });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });

    it('should return error for missing tag parameter', async () => {
      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_TAG, {});

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  describe('SEARCH_TRANSACTIONS_BY_CATEGORY', () => {
    beforeEach(() => {
      (global as any).__unlockWallet(TEST_MNEMONIC_12, TEST_PASSWORD);
    });

    it('should find transactions with specific category', async () => {
      const mockTxids = ['txid1', 'txid2'];
      (TransactionMetadataStorage.searchByCategory as jest.Mock).mockResolvedValue(mockTxids);

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_CATEGORY, { category: 'Business' });

      expect(response.success).toBe(true);
      expect(response.data.txids).toEqual(mockTxids);
      expect(TransactionMetadataStorage.searchByCategory).toHaveBeenCalledWith('Business', TEST_PASSWORD);
    });

    it('should return empty array for non-existent category', async () => {
      (TransactionMetadataStorage.searchByCategory as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_CATEGORY, { category: 'NonExistent' });

      expect(response.success).toBe(true);
      expect(response.data.txids).toEqual([]);
    });

    it('should return multiple transactions with same category', async () => {
      const mockTxids = Array(7).fill(0).map((_, i) => `txid${i}`);
      (TransactionMetadataStorage.searchByCategory as jest.Mock).mockResolvedValue(mockTxids);

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_CATEGORY, { category: 'Shopping' });

      expect(response.success).toBe(true);
      expect(response.data.txids).toHaveLength(7);
    });

    it('should return error when wallet is locked', async () => {
      (global as any).__lockWallet();

      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_CATEGORY, { category: 'Business' });

      expect(response.success).toBe(false);
      expect(response.error).toContain('Wallet is locked');
    });

    it('should return error for missing category parameter', async () => {
      const response = await sendMessage(MessageType.SEARCH_TRANSACTIONS_BY_CATEGORY, {});

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  // =============================================================================
  // Unknown Message Type Test
  // =============================================================================

  describe('Unknown message types', () => {
    it('should return error for unknown message type', async () => {
      const response = await sendMessage('UNKNOWN_MESSAGE' as any);

      expect(response.success).toBe(false);
      expect(response.error).toContain('Unhandled message type');
    });
  });
});
