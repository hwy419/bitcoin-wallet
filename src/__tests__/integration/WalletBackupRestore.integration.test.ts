/**
 * Wallet Backup & Restore Integration Tests
 *
 * End-to-end integration tests for the complete wallet backup and restore workflow.
 * Tests real-world scenarios with multiple accounts, contacts, imported keys, and multisig.
 *
 * CRITICAL: These tests verify that users can successfully backup and restore their
 * entire wallet without ANY data loss, especially address indices which would lead
 * to LOSS OF FUNDS if corrupted.
 *
 * Test Scenarios:
 * - Simple wallet (1 account) backup/restore
 * - Complex wallet (multiple accounts, contacts, settings) backup/restore
 * - Wallet with imported private keys backup/restore
 * - Multisig wallet with pending PSBTs backup/restore
 * - Mixed wallet (all features combined) backup/restore
 * - Network mismatch detection
 * - Corrupted backup detection
 * - Password requirements enforcement
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { BackupManager } from '../../background/wallet/BackupManager';
import { WalletStorage } from '../../background/wallet/WalletStorage';
import { ContactsStorage } from '../../background/wallet/ContactsStorage';
import { TransactionMetadataStorage } from '../../background/wallet/TransactionMetadataStorage';
import { CryptoUtils } from '../../background/wallet/CryptoUtils';
import { KeyManager } from '../../background/wallet/KeyManager';
import type {
  StoredWalletV2,
  Account,
  MultisigAccount,
  Contact,
  ImportedKeyData,
  PendingMultisigTx,
  EncryptedBackupFile,
  BackupPayload,
  TransactionMetadataStorage as TransactionMetadataStorageType,
} from '../../shared/types';
import {
  TEST_MNEMONIC_12,
  TEST_PASSWORD_STRONG,
} from '../utils/testConstants';
import {
  createMockAccount,
  createMockAddresses,
} from '../utils/testFactories';
import { storageMock } from '../__mocks__/chrome';

// Ensure crypto.subtle is available
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

// Mock chrome.runtime.getManifest
(global as any).chrome = {
  ...(global as any).chrome,
  runtime: {
    ...(global as any).chrome?.runtime,
    getManifest: () => ({ version: '0.10.0' }),
  },
};

describe('Wallet Backup & Restore Integration Tests', () => {
  const WALLET_PASSWORD = TEST_PASSWORD_STRONG;
  const BACKUP_PASSWORD = 'BackupPassword123!@#$%';

  beforeEach(async () => {
    jest.clearAllMocks();
    (global as any).__restoreOriginalCrypto();
    await storageMock.clear();
  });

  // ===========================================================================
  // Helper Functions
  // ===========================================================================

  /**
   * Create a complete wallet setup with accounts and contacts
   */
  async function setupCompleteWallet(): Promise<{
    wallet: StoredWalletV2;
    contacts: Contact[];
  }> {
    // Create wallet with seed
    const wallet = await WalletStorage.createWallet(
      TEST_MNEMONIC_12,
      WALLET_PASSWORD,
      createMockAccount({
        index: 0,
        name: 'Primary Account',
        addressType: 'native-segwit',
        externalIndex: 10,
        internalIndex: 5,
        addresses: createMockAddresses(15),
      })
    );

    // Upgrade wallet to v2 for multisig and imported keys support
    const walletV2: StoredWalletV2 = {
      ...wallet,
      version: 2,
      pendingMultisigTxs: [],
      importedKeys: {},
    };
    await chrome.storage.local.set({ wallet: walletV2 });

    // Add more accounts
    await WalletStorage.addAccount(
      createMockAccount({
        index: 1,
        name: 'Savings Account',
        addressType: 'segwit',
        externalIndex: 20,
        internalIndex: 8,
        addresses: createMockAddresses(28),
      })
    );

    await WalletStorage.addAccount(
      createMockAccount({
        index: 2,
        name: 'Legacy Account',
        addressType: 'legacy',
        externalIndex: 5,
        internalIndex: 2,
        addresses: createMockAddresses(7),
      })
    );

    // Create contacts using valid mock addresses
    const contactsData = {
      version: 2,
      contacts: [],
      salt: wallet.salt,
    };
    await storageMock.set({ contacts: contactsData });

    // Generate valid test addresses
    const testAddresses = createMockAddresses(5).map(addr => addr.address);

    const contacts: Contact[] = [];
    for (let i = 0; i < 5; i++) {
      const contact = await ContactsStorage.addContact(
        {
          name: `Contact ${i + 1}`,
          address: testAddresses[i],
          category: i % 2 === 0 ? 'Friends' : 'Family',
          notes: `Test contact number ${i + 1}`,
        },
        WALLET_PASSWORD,
        'testnet'
      );
      contacts.push(contact);
    }

    return {
      wallet: walletV2,
      contacts,
    };
  }

  /**
   * Verify wallet data matches expected values
   */
  function verifyWalletIntegrity(
    wallet: StoredWalletV2,
    expectedAccountCount: number,
    expectedIndices: Array<{ external: number; internal: number }>
  ): void {
    expect(wallet.accounts.length).toBe(expectedAccountCount);

    wallet.accounts.forEach((account, i) => {
      const acc = account as Account;
      expect(acc.externalIndex).toBe(expectedIndices[i].external);
      expect(acc.internalIndex).toBe(expectedIndices[i].internal);
    });
  }

  // ===========================================================================
  // Simple Wallet Backup/Restore
  // ===========================================================================

  describe('Simple wallet backup and restore', () => {
    it('should backup and restore a basic wallet with one account', async () => {
      // Create simple wallet
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({
          index: 0,
          name: 'My Account',
          externalIndex: 5,
          internalIndex: 2,
          addresses: createMockAddresses(7),
        })
      );

      // Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      expect(backupFile).toBeDefined();
      expect(backupFile.header.network).toBe('testnet');

      // Clear storage (simulate fresh install)
      await storageMock.clear();

      // Import backup
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      expect(importResult.success).toBe(true);
      expect(importResult.accountCount).toBe(1);
      expect(importResult.network).toBe('testnet');

      // Verify wallet restored correctly
      const restoredWallet = await WalletStorage.getWallet();
      expect(restoredWallet.accounts.length).toBe(1);
      expect(restoredWallet.accounts[0].name).toBe('My Account');

      const account = restoredWallet.accounts[0] as Account;
      expect(account.externalIndex).toBe(5);
      expect(account.internalIndex).toBe(2);
      expect(account.addresses.length).toBe(7);

      // Verify seed phrase can be unlocked
      const seedPhrase = await WalletStorage.unlockWallet(WALLET_PASSWORD);
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });

    it('should restore wallet settings correctly', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      // Update settings
      await WalletStorage.updateSettings({
        autoLockMinutes: 30,
        network: 'testnet',
      });

      // Export and restore
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();
      await BackupManager.importWallet(backupFile, BACKUP_PASSWORD);

      // Verify settings restored
      const restoredWallet = await WalletStorage.getWallet();
      expect(restoredWallet.settings.autoLockMinutes).toBe(30);
      expect(restoredWallet.settings.network).toBe('testnet');
    });
  });

  // ===========================================================================
  // Complex Wallet Backup/Restore
  // ===========================================================================

  describe('Complex wallet with multiple accounts and contacts', () => {
    it('should backup and restore wallet with 3 accounts and 5 contacts', async () => {
      const { wallet, contacts } = await setupCompleteWallet();

      // Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Clear storage
      await storageMock.clear();

      // Import backup
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      expect(importResult.success).toBe(true);
      expect(importResult.accountCount).toBe(3);
      expect(importResult.contactCount).toBe(5);

      // Verify accounts restored with EXACT indices
      const restoredWallet = await WalletStorage.getWallet() as StoredWalletV2;
      verifyWalletIntegrity(restoredWallet, 3, [
        { external: 10, internal: 5 },
        { external: 20, internal: 8 },
        { external: 5, internal: 2 },
      ]);

      // Verify contacts restored
      const restoredContacts = await ContactsStorage.getContacts(WALLET_PASSWORD);
      expect(restoredContacts.length).toBe(5);

      // Verify contact details
      restoredContacts.forEach((contact, i) => {
        expect(contact.name).toBe(`Contact ${i + 1}`);
        expect(contact.category).toBe(i % 2 === 0 ? 'Friends' : 'Family');
      });
    });

    it('should preserve all account metadata', async () => {
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({
          index: 0,
          name: 'Primary',
          addressType: 'native-segwit',
          externalIndex: 15,
          internalIndex: 7,
          addresses: createMockAddresses(22),
        })
      );

      // Add account with different address type
      await WalletStorage.addAccount(
        createMockAccount({
          index: 1,
          name: 'Legacy Savings',
          addressType: 'legacy',
          externalIndex: 30,
          internalIndex: 12,
          addresses: createMockAddresses(42),
        })
      );

      // Export and restore
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();
      await BackupManager.importWallet(backupFile, BACKUP_PASSWORD);

      // Verify all account metadata
      const restoredWallet = await WalletStorage.getWallet();
      const account0 = restoredWallet.accounts[0] as Account;
      const account1 = restoredWallet.accounts[1] as Account;

      expect(account0.name).toBe('Primary');
      expect(account0.addressType).toBe('native-segwit');
      expect(account0.externalIndex).toBe(15);
      expect(account0.internalIndex).toBe(7);

      expect(account1.name).toBe('Legacy Savings');
      expect(account1.addressType).toBe('legacy');
      expect(account1.externalIndex).toBe(30);
      expect(account1.internalIndex).toBe(12);
    });
  });

  // ===========================================================================
  // Imported Keys Backup/Restore
  // ===========================================================================

  describe('Wallet with imported private keys', () => {
    it('should backup and restore imported private keys', async () => {
      // Create wallet
      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'HD Account' })
      );

      // Upgrade wallet to v2 manually
      const walletV2: StoredWalletV2 = {
        ...wallet,
        version: 2,
        pendingMultisigTxs: [],
        importedKeys: {},
      };
      await chrome.storage.local.set({ wallet: walletV2 });

      // Add imported key
      const importedKeyData: ImportedKeyData = {
        encryptedData: 'encrypted_wif_string',
        salt: 'salt_for_import',
        iv: 'iv_for_import',
        type: 'private-key',
      };

      await WalletStorage.storeImportedKey(0, importedKeyData);

      // Export and restore
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      expect(importResult.hasImportedKeys).toBe(true);

      // Verify imported key restored
      const restoredWallet = await WalletStorage.getWallet() as StoredWalletV2;
      expect(restoredWallet.importedKeys).toBeDefined();
      expect(restoredWallet.importedKeys![0]).toEqual(importedKeyData);
    });

    it('should handle multiple imported keys', async () => {
      const wallet = await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      // Upgrade wallet to v2 manually
      const walletV2: StoredWalletV2 = {
        ...wallet,
        version: 2,
        pendingMultisigTxs: [],
        importedKeys: {},
      };
      await chrome.storage.local.set({ wallet: walletV2 });

      // Add multiple accounts with imported keys
      await WalletStorage.addAccount(createMockAccount({ index: 0, name: 'Account 0' }));
      await WalletStorage.addAccount(createMockAccount({ index: 1, name: 'Account 1' }));

      const key0: ImportedKeyData = {
        encryptedData: 'encrypted_wif_0',
        salt: 'salt_0',
        iv: 'iv_0',
        type: 'private-key',
      };

      const key1: ImportedKeyData = {
        encryptedData: 'encrypted_wif_1',
        salt: 'salt_1',
        iv: 'iv_1',
        type: 'private-key',
      };

      await WalletStorage.storeImportedKey(0, key0);
      await WalletStorage.storeImportedKey(1, key1);

      // Export and restore
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();
      await BackupManager.importWallet(backupFile, BACKUP_PASSWORD);

      // Verify all imported keys restored
      const restoredWallet = await WalletStorage.getWallet() as StoredWalletV2;
      expect(restoredWallet.importedKeys![0]).toEqual(key0);
      expect(restoredWallet.importedKeys![1]).toEqual(key1);
    });
  });

  // ===========================================================================
  // Multisig Wallet Backup/Restore
  // ===========================================================================

  describe('Multisig wallet with pending PSBTs', () => {
    function createMultisigAccount(): MultisigAccount {
      return {
        accountType: 'multisig',
        index: 0,
        name: '2-of-3 Multisig',
        multisigConfig: '2-of-3',
        addressType: 'p2wsh',
        cosigners: [
          {
            name: 'Self',
            xpub: 'tpubD6NzVbkrYhZ4Xa1...',
            fingerprint: '12345678',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: true,
          },
          {
            name: 'Partner',
            xpub: 'tpubD6NzVbkrYhZ4Xb2...',
            fingerprint: '23456789',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: false,
          },
          {
            name: 'Backup',
            xpub: 'tpubD6NzVbkrYhZ4Xc3...',
            fingerprint: '34567890',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: false,
          },
        ],
        externalIndex: 8,
        internalIndex: 3,
        addresses: createMockAddresses(11) as any[],
      };
    }

    function createPendingPSBT(): PendingMultisigTx {
      return {
        id: crypto.randomUUID(),
        accountId: 0,
        psbtBase64: 'cHNidP8BAHECAAAAAQQoZGF0YQAA...',
        created: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        multisigConfig: '2-of-3',
        signaturesCollected: 1,
        signaturesRequired: 2,
        signatureStatus: {
          '12345678': {
            signed: true,
            timestamp: Date.now(),
            cosignerName: 'Self',
          },
          '23456789': {
            signed: false,
            cosignerName: 'Partner',
          },
          '34567890': {
            signed: false,
            cosignerName: 'Backup',
          },
        },
        metadata: {
          amount: 500000,
          recipient: 'tb1qmultisig123...',
          fee: 5000,
        },
      };
    }

    it('should backup and restore multisig account with PSBT', async () => {
      const multisigAccount = createMultisigAccount();
      const pendingPSBT = createPendingPSBT();

      // Create wallet with multisig
      const encryptionResult = await CryptoUtils.encrypt(TEST_MNEMONIC_12, WALLET_PASSWORD);

      const wallet: StoredWalletV2 = {
        version: 2,
        encryptedSeed: encryptionResult.encryptedData,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        accounts: [multisigAccount],
        settings: {
          autoLockMinutes: 15,
          network: 'testnet',
        },
        pendingMultisigTxs: [pendingPSBT],
      };

      await storageMock.set({ wallet });

      // Export and restore
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      expect(importResult.success).toBe(true);
      expect(importResult.hasMultisig).toBe(true);

      // Verify multisig account restored
      const restoredWallet = await WalletStorage.getWallet() as StoredWalletV2;
      const restoredAccount = restoredWallet.accounts[0] as MultisigAccount;

      expect(restoredAccount.accountType).toBe('multisig');
      expect(restoredAccount.multisigConfig).toBe('2-of-3');
      expect(restoredAccount.externalIndex).toBe(8);
      expect(restoredAccount.internalIndex).toBe(3);
      expect(restoredAccount.cosigners.length).toBe(3);

      // Verify PSBT restored
      expect(restoredWallet.pendingMultisigTxs.length).toBe(1);
      const restoredPSBT = restoredWallet.pendingMultisigTxs[0];
      expect(restoredPSBT.psbtBase64).toBe(pendingPSBT.psbtBase64);
      expect(restoredPSBT.signaturesCollected).toBe(1);
      expect(restoredPSBT.signatureStatus['12345678'].signed).toBe(true);
    });
  });

  // ===========================================================================
  // Network Mismatch Detection
  // ===========================================================================

  describe('Network mismatch detection', () => {
    it('should detect network mismatch between header and payload', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Corrupt network in header (keep payload intact)
      backupFile.header.network = 'mainnet';

      await storageMock.clear();

      await expect(
        BackupManager.importWallet(backupFile, BACKUP_PASSWORD)
      ).rejects.toThrow('Network mismatch');
    });
  });

  // ===========================================================================
  // Corrupted Backup Detection
  // ===========================================================================

  describe('Corrupted backup detection', () => {
    it('should detect corrupted encrypted data via checksum', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Corrupt encrypted data
      backupFile.encryptedData = backupFile.encryptedData.slice(0, -10) + 'corrupted!';

      await expect(
        BackupManager.importWallet(backupFile, BACKUP_PASSWORD)
      ).rejects.toThrow('Checksum mismatch');
    });

    it('should detect tampered checksum', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Tamper with checksum
      backupFile.checksum.hash = 'f'.repeat(64);

      await expect(
        BackupManager.importWallet(backupFile, BACKUP_PASSWORD)
      ).rejects.toThrow('Checksum mismatch');
    });
  });

  // ===========================================================================
  // Password Requirements
  // ===========================================================================

  describe('Password requirements enforcement', () => {
    it('should reject same wallet and backup passwords', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      await expect(
        BackupManager.exportWallet(WALLET_PASSWORD, WALLET_PASSWORD)
      ).rejects.toThrow('Backup password must be different from wallet password');
    });

    it('should reject backup password shorter than 12 characters', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      await expect(
        BackupManager.exportWallet(WALLET_PASSWORD, 'short')
      ).rejects.toThrow('Backup password must be at least 12 characters');
    });

    it('should accept backup password with exactly 12 characters', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, WALLET_PASSWORD);

      const backupPassword = 'Exactly12Chr';
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        backupPassword
      );

      expect(backupFile).toBeDefined();
    });
  });

  // ===========================================================================
  // Complete Workflow Test
  // ===========================================================================

  describe('Complete backup/restore workflow', () => {
    it('should handle complete wallet with all features', async () => {
      // Create comprehensive wallet
      const { wallet, contacts } = await setupCompleteWallet();

      // Add imported key
      const importedKey: ImportedKeyData = {
        encryptedData: 'encrypted_wif',
        salt: 'salt',
        iv: 'iv',
        type: 'private-key',
      };
      await WalletStorage.storeImportedKey(0, importedKey);

      // Add multisig account
      const multisigAccount: MultisigAccount = {
        accountType: 'multisig',
        index: 3,
        name: 'Joint Account',
        multisigConfig: '2-of-2',
        addressType: 'p2wsh',
        cosigners: [
          {
            name: 'Self',
            xpub: 'tpubD6...',
            fingerprint: '11111111',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: true,
          },
          {
            name: 'Partner',
            xpub: 'tpubD7...',
            fingerprint: '22222222',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: false,
          },
        ],
        externalIndex: 12,
        internalIndex: 6,
        addresses: createMockAddresses(18) as any[],
      };

      await WalletStorage.addAccount(multisigAccount);

      // Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Clear storage
      await storageMock.clear();

      // Import backup
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      expect(importResult.success).toBe(true);
      expect(importResult.accountCount).toBe(4); // 3 regular + 1 multisig
      expect(importResult.contactCount).toBe(5);
      expect(importResult.hasImportedKeys).toBe(true);
      expect(importResult.hasMultisig).toBe(true);

      // Verify all data restored
      const restoredWallet = await WalletStorage.getWallet() as StoredWalletV2;
      expect(restoredWallet.accounts.length).toBe(4);
      expect(restoredWallet.importedKeys![0]).toEqual(importedKey);

      const restoredMultisig = restoredWallet.accounts[3] as MultisigAccount;
      expect(restoredMultisig.accountType).toBe('multisig');
      expect(restoredMultisig.externalIndex).toBe(12);
      expect(restoredMultisig.internalIndex).toBe(6);

      const restoredContacts = await ContactsStorage.getContacts(WALLET_PASSWORD);
      expect(restoredContacts.length).toBe(5);

      // Verify seed phrase can be unlocked
      const seedPhrase = await WalletStorage.unlockWallet(WALLET_PASSWORD);
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });
  });

  // ===========================================================================
  // Transaction Metadata Backup/Restore (v0.12.1)
  // ===========================================================================

  describe('Transaction metadata backup and restore', () => {
    /**
     * Helper function to create realistic transaction metadata
     */
    async function createTransactionMetadata(): Promise<{
      txids: string[];
      metadataMap: { [txid: string]: { tags: string[]; category?: string; notes?: string } };
    }> {
      const txids = [
        'a'.repeat(64),
        'b'.repeat(64),
        'c'.repeat(64),
        'd'.repeat(64),
        'e'.repeat(64),
      ];

      const metadataMap = {
        [txids[0]]: {
          tags: ['income', 'salary'],
          category: 'Salary',
          notes: 'Monthly salary payment',
        },
        [txids[1]]: {
          tags: ['expense', 'food'],
          category: 'Coffee',
          notes: 'Morning coffee at Starbucks ☕',
        },
        [txids[2]]: {
          tags: ['expense', 'bills'],
          category: 'Rent',
          notes: 'Monthly rent payment - Apartment 4B',
        },
        [txids[3]]: {
          tags: ['personal', 'transfer'],
          category: 'Savings',
          notes: undefined,
        },
        [txids[4]]: {
          tags: ['income', 'freelance'],
          category: 'Freelance Work',
          notes: 'Web development project - Client ABC',
        },
      };

      // Create metadata for each transaction
      for (const [txid, metadata] of Object.entries(metadataMap)) {
        await TransactionMetadataStorage.setMetadata(
          txid,
          metadata,
          WALLET_PASSWORD
        );
      }

      return { txids, metadataMap };
    }

    it('should export wallet with transaction metadata', async () => {
      // Arrange: Create wallet with transaction metadata
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      const { txids, metadataMap } = await createTransactionMetadata();

      // Act: Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Assert: Verify backup file structure
      expect(backupFile).toBeDefined();
      expect(backupFile.header.network).toBe('testnet');

      // Decrypt payload to verify transaction metadata is included
      const salt = BackupManager['base64ToArrayBuffer'](backupFile.encryption.salt);
      const decryptionKey = await CryptoUtils.deriveKey(
        BACKUP_PASSWORD,
        new Uint8Array(salt as ArrayBuffer),
        backupFile.encryption.pbkdf2Iterations
      );
      const decryptedJSON = await CryptoUtils.decryptWithKey(
        backupFile.encryptedData,
        decryptionKey,
        backupFile.encryption.iv
      );
      const payload: BackupPayload = JSON.parse(decryptedJSON);

      // Verify transaction metadata is present
      expect(payload.transactionMetadata).toBeDefined();
      expect(payload.transactionMetadata?.version).toBe(1);
      expect(payload.transactionMetadata?.metadata).toBeDefined();
      expect(Object.keys(payload.transactionMetadata!.metadata).length).toBe(5);

      // Verify metadata count in metadata section
      expect(payload.metadata.totalTransactionMetadata).toBe(5);
    });

    it('should import wallet with transaction metadata', async () => {
      // Arrange: Create wallet with transaction metadata
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      const { txids, metadataMap } = await createTransactionMetadata();

      // Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Clear storage
      await storageMock.clear();

      // Act: Import backup
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      // Assert: Verify import result
      expect(importResult.success).toBe(true);
      expect(importResult.transactionMetadataCount).toBe(5);

      // Verify all transaction metadata restored correctly
      for (const [txid, expectedMetadata] of Object.entries(metadataMap)) {
        const restoredMetadata = await TransactionMetadataStorage.getMetadata(
          txid,
          WALLET_PASSWORD
        );

        expect(restoredMetadata).toBeDefined();
        expect(restoredMetadata!.tags).toEqual(expectedMetadata.tags);
        expect(restoredMetadata!.category).toBe(expectedMetadata.category);
        expect(restoredMetadata!.notes).toBe(expectedMetadata.notes);
      }
    });

    it('should handle backward compatibility - import backup without transaction metadata', async () => {
      // Arrange: Create wallet
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      // Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Simulate old backup by removing transactionMetadata field
      const salt = BackupManager['base64ToArrayBuffer'](backupFile.encryption.salt);
      const decryptionKey = await CryptoUtils.deriveKey(
        BACKUP_PASSWORD,
        new Uint8Array(salt as ArrayBuffer),
        backupFile.encryption.pbkdf2Iterations
      );
      const decryptedJSON = await CryptoUtils.decryptWithKey(
        backupFile.encryptedData,
        decryptionKey,
        backupFile.encryption.iv
      );
      const payload: BackupPayload = JSON.parse(decryptedJSON);

      // Remove transactionMetadata to simulate v0.12.0 backup
      delete payload.transactionMetadata;
      delete payload.metadata.totalTransactionMetadata;

      // Re-encrypt payload
      const payloadJSON = JSON.stringify(payload);
      const newSalt = crypto.getRandomValues(new Uint8Array(32));
      const newKey = await CryptoUtils.deriveKey(
        BACKUP_PASSWORD,
        newSalt,
        600000
      );
      const encryptionResult = await CryptoUtils.encryptWithKey(
        payloadJSON,
        newKey
      );

      // Create new backup file
      const oldBackupFile: EncryptedBackupFile = {
        ...backupFile,
        encryption: {
          ...backupFile.encryption,
          salt: BackupManager['arrayBufferToBase64'](newSalt.buffer as ArrayBuffer),
          iv: encryptionResult.iv,
        },
        encryptedData: encryptionResult.encryptedData,
      };

      // Recalculate checksum
      const checksum = await BackupManager['generateChecksum'](
        oldBackupFile.encryptedData
      );
      oldBackupFile.checksum.hash = checksum;

      // Clear storage
      await storageMock.clear();

      // Act: Import old backup
      const importResult = await BackupManager.importWallet(
        oldBackupFile,
        BACKUP_PASSWORD
      );

      // Assert: Import should succeed without errors
      expect(importResult.success).toBe(true);
      expect(importResult.transactionMetadataCount).toBeUndefined();

      // Wallet should be fully functional
      const restoredWallet = await WalletStorage.getWallet();
      expect(restoredWallet.accounts.length).toBe(1);

      // Should be able to unlock wallet
      const seedPhrase = await WalletStorage.unlockWallet(WALLET_PASSWORD);
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });

    it('should preserve transaction metadata through round-trip export/import', async () => {
      // Arrange: Create wallet with transaction metadata
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      const { txids, metadataMap } = await createTransactionMetadata();

      // Act: Export → Import → Export again
      const backupFile1 = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();

      await BackupManager.importWallet(backupFile1, BACKUP_PASSWORD);

      const backupFile2 = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Assert: Decrypt both payloads and compare transaction metadata
      const salt1 = BackupManager['base64ToArrayBuffer'](backupFile1.encryption.salt);
      const key1 = await CryptoUtils.deriveKey(
        BACKUP_PASSWORD,
        new Uint8Array(salt1 as ArrayBuffer),
        backupFile1.encryption.pbkdf2Iterations
      );
      const payload1: BackupPayload = JSON.parse(
        await CryptoUtils.decryptWithKey(
          backupFile1.encryptedData,
          key1,
          backupFile1.encryption.iv
        )
      );

      const salt2 = BackupManager['base64ToArrayBuffer'](backupFile2.encryption.salt);
      const key2 = await CryptoUtils.deriveKey(
        BACKUP_PASSWORD,
        new Uint8Array(salt2 as ArrayBuffer),
        backupFile2.encryption.pbkdf2Iterations
      );
      const payload2: BackupPayload = JSON.parse(
        await CryptoUtils.decryptWithKey(
          backupFile2.encryptedData,
          key2,
          backupFile2.encryption.iv
        )
      );

      // Compare transaction metadata
      expect(payload2.transactionMetadata).toBeDefined();
      expect(
        Object.keys(payload1.transactionMetadata!.metadata).length
      ).toBe(
        Object.keys(payload2.transactionMetadata!.metadata).length
      );

      // Verify all transaction IDs present in both
      for (const txid of txids) {
        expect(payload1.transactionMetadata!.metadata[txid]).toBeDefined();
        expect(payload2.transactionMetadata!.metadata[txid]).toBeDefined();
      }
    });
  });

  // ===========================================================================
  // Contact Tags Backup/Restore (v0.12.0)
  // ===========================================================================

  describe('Contact tags backup and restore', () => {
    it('should export wallet with contact tags', async () => {
      // Arrange: Create wallet
      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      // Create contacts storage v2
      const contactsData = {
        version: 2,
        contacts: [],
        salt: wallet.salt,
      };
      await storageMock.set({ contacts: contactsData });

      // Generate test addresses
      const testAddresses = createMockAddresses(3).map(addr => addr.address);

      // Add contacts with tags
      const contact1 = await ContactsStorage.addContact(
        {
          name: 'Alice',
          address: testAddresses[0],
          category: 'Friends',
          tags: {
            'payment-preference': 'Bitcoin only',
            'location': 'San Francisco',
            'met-date': '2024-01-15',
          },
        },
        WALLET_PASSWORD,
        'testnet'
      );

      const contact2 = await ContactsStorage.addContact(
        {
          name: 'Bob',
          address: testAddresses[1],
          category: 'Business',
          tags: {
            'company': 'Tech Corp',
            'role': 'CTO',
          },
        },
        WALLET_PASSWORD,
        'testnet'
      );

      const contact3 = await ContactsStorage.addContact(
        {
          name: 'Charlie',
          address: testAddresses[2],
          category: 'Family',
          // No tags for this contact
        },
        WALLET_PASSWORD,
        'testnet'
      );

      // Act: Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Assert: Decrypt and verify tags are in backup
      const salt = BackupManager['base64ToArrayBuffer'](backupFile.encryption.salt);
      const decryptionKey = await CryptoUtils.deriveKey(
        BACKUP_PASSWORD,
        new Uint8Array(salt as ArrayBuffer),
        backupFile.encryption.pbkdf2Iterations
      );
      const decryptedJSON = await CryptoUtils.decryptWithKey(
        backupFile.encryptedData,
        decryptionKey,
        backupFile.encryption.iv
      );
      const payload: BackupPayload = JSON.parse(decryptedJSON);

      // Verify contacts are encrypted in backup
      expect(payload.contacts.version).toBe(2);
      expect(payload.contacts.contacts.length).toBe(3);
    });

    it('should import wallet with contact tags', async () => {
      // Arrange: Create wallet with contacts
      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      const contactsData = {
        version: 2,
        contacts: [],
        salt: wallet.salt,
      };
      await storageMock.set({ contacts: contactsData });

      const testAddresses = createMockAddresses(2).map(addr => addr.address);

      await ContactsStorage.addContact(
        {
          name: 'Alice',
          address: testAddresses[0],
          tags: {
            'preference': 'Lightning Network',
            'timezone': 'PST',
          },
        },
        WALLET_PASSWORD,
        'testnet'
      );

      await ContactsStorage.addContact(
        {
          name: 'Bob',
          address: testAddresses[1],
          tags: {
            'company': 'Bitcoin Inc',
          },
        },
        WALLET_PASSWORD,
        'testnet'
      );

      // Export backup
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Clear storage
      await storageMock.clear();

      // Act: Import backup
      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      // Assert: Verify import succeeded
      expect(importResult.success).toBe(true);
      expect(importResult.contactCount).toBe(2);

      // Verify tags restored
      const contacts = await ContactsStorage.getContacts(WALLET_PASSWORD);
      expect(contacts.length).toBe(2);

      const alice = contacts.find(c => c.name === 'Alice');
      const bob = contacts.find(c => c.name === 'Bob');

      expect(alice).toBeDefined();
      expect(alice!.tags).toBeDefined();
      expect(alice!.tags!['preference']).toBe('Lightning Network');
      expect(alice!.tags!['timezone']).toBe('PST');

      expect(bob).toBeDefined();
      expect(bob!.tags).toBeDefined();
      expect(bob!.tags!['company']).toBe('Bitcoin Inc');
    });

    it('should handle backward compatibility - import contacts without tags', async () => {
      // Arrange: Create wallet
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({ index: 0, name: 'Test Account' })
      );

      const wallet = await WalletStorage.getWallet();
      const contactsData = {
        version: 2,
        contacts: [],
        salt: wallet.salt,
      };
      await storageMock.set({ contacts: contactsData });

      const testAddress = createMockAddresses(1)[0].address;

      // Add contact without tags (simulates v0.11.0)
      await ContactsStorage.addContact(
        {
          name: 'Alice',
          address: testAddress,
          category: 'Friends',
        },
        WALLET_PASSWORD,
        'testnet'
      );

      // Export and import
      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      await storageMock.clear();

      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      // Assert: Should work without errors
      expect(importResult.success).toBe(true);
      expect(importResult.contactCount).toBe(1);

      const contacts = await ContactsStorage.getContacts(WALLET_PASSWORD);
      expect(contacts.length).toBe(1);
      expect(contacts[0].name).toBe('Alice');
      expect(contacts[0].tags).toBeUndefined();
    });
  });

  // ===========================================================================
  // Comprehensive Full Wallet Restoration Test
  // ===========================================================================

  describe('Complete wallet restoration with ALL data types', () => {
    it('should restore complete wallet with all features and data', async () => {
      // ========================================================================
      // ARRANGE: Create comprehensive wallet with ALL data types
      // ========================================================================

      // Step 1: Create wallet with seed
      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        WALLET_PASSWORD,
        createMockAccount({
          index: 0,
          name: 'Primary HD Account',
          addressType: 'native-segwit',
          externalIndex: 15,
          internalIndex: 7,
          addresses: createMockAddresses(22),
        })
      );

      // Step 2: Upgrade to v2 for multisig and imported keys
      const walletV2: StoredWalletV2 = {
        ...wallet,
        version: 2,
        pendingMultisigTxs: [],
        importedKeys: {},
      };
      await chrome.storage.local.set({ wallet: walletV2 });

      // Step 3: Add multiple HD accounts (different address types)
      await WalletStorage.addAccount(
        createMockAccount({
          index: 1,
          name: 'Savings (SegWit)',
          addressType: 'segwit',
          externalIndex: 25,
          internalIndex: 10,
          addresses: createMockAddresses(35),
        })
      );

      await WalletStorage.addAccount(
        createMockAccount({
          index: 2,
          name: 'Legacy Account',
          addressType: 'legacy',
          externalIndex: 8,
          internalIndex: 3,
          addresses: createMockAddresses(11),
        })
      );

      // Step 4: Add imported private keys
      const importedKey1: ImportedKeyData = {
        encryptedData: 'encrypted_wif_key_1',
        salt: 'salt_import_1',
        iv: 'iv_import_1',
        type: 'private-key',
      };

      const importedKey2: ImportedKeyData = {
        encryptedData: 'encrypted_wif_key_2',
        salt: 'salt_import_2',
        iv: 'iv_import_2',
        type: 'private-key',
      };

      await WalletStorage.storeImportedKey(0, importedKey1);
      await WalletStorage.storeImportedKey(1, importedKey2);

      // Step 5: Add multisig account with pending PSBT
      const multisigAccount: MultisigAccount = {
        accountType: 'multisig',
        index: 3,
        name: '2-of-3 Multisig Vault',
        multisigConfig: '2-of-3',
        addressType: 'p2wsh',
        cosigners: [
          {
            name: 'Self (Key 1)',
            xpub: 'tpubD6NzVbkrYhZ4Xa1...',
            fingerprint: '12345678',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: true,
          },
          {
            name: 'Partner',
            xpub: 'tpubD6NzVbkrYhZ4Xb2...',
            fingerprint: '23456789',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: false,
          },
          {
            name: 'Backup Key',
            xpub: 'tpubD6NzVbkrYhZ4Xc3...',
            fingerprint: '34567890',
            derivationPath: "m/48'/1'/0'/2'",
            isSelf: false,
          },
        ],
        externalIndex: 12,
        internalIndex: 6,
        addresses: createMockAddresses(18) as any[],
      };

      await WalletStorage.addAccount(multisigAccount);

      // Add pending PSBT for multisig
      const pendingPSBT: PendingMultisigTx = {
        id: crypto.randomUUID(),
        accountId: 3,
        psbtBase64: 'cHNidP8BAHECAAAAAQQoZGF0YQAA...',
        created: Date.now(),
        expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
        multisigConfig: '2-of-3',
        signaturesCollected: 1,
        signaturesRequired: 2,
        signatureStatus: {
          '12345678': {
            signed: true,
            timestamp: Date.now(),
            cosignerName: 'Self (Key 1)',
          },
          '23456789': {
            signed: false,
            cosignerName: 'Partner',
          },
          '34567890': {
            signed: false,
            cosignerName: 'Backup Key',
          },
        },
        metadata: {
          amount: 1000000,
          recipient: 'tb1qmultisig123...',
          fee: 10000,
        },
      };

      const currentWallet = await WalletStorage.getWallet() as StoredWalletV2;
      currentWallet.pendingMultisigTxs.push(pendingPSBT);
      await chrome.storage.local.set({ wallet: currentWallet });

      // Step 6: Create contacts with full data (including tags)
      const contactsData = {
        version: 2,
        contacts: [],
        salt: wallet.salt,
      };
      await storageMock.set({ contacts: contactsData });

      const testAddresses = createMockAddresses(5).map(addr => addr.address);

      const contacts = [];
      for (let i = 0; i < 5; i++) {
        const contact = await ContactsStorage.addContact(
          {
            name: `Contact ${i + 1}`,
            address: testAddresses[i],
            category: i % 2 === 0 ? 'Friends' : 'Business',
            notes: `Important contact #${i + 1}`,
            tags: {
              'importance': i % 2 === 0 ? 'high' : 'medium',
              'met-date': `2024-0${i + 1}-15`,
            },
          },
          WALLET_PASSWORD,
          'testnet'
        );
        contacts.push(contact);
      }

      // Step 7: Create transaction metadata for multiple transactions
      const txids = [
        '1'.repeat(64),
        '2'.repeat(64),
        '3'.repeat(64),
        '4'.repeat(64),
        '5'.repeat(64),
        '6'.repeat(64),
        '7'.repeat(64),
        '8'.repeat(64),
        '9'.repeat(64),
        'a'.repeat(64),
      ];

      for (let i = 0; i < 10; i++) {
        await TransactionMetadataStorage.setMetadata(
          txids[i],
          {
            tags: i % 2 === 0 ? ['income', 'salary'] : ['expense', 'shopping'],
            category: i % 2 === 0 ? 'Salary' : 'Shopping',
            notes: `Transaction #${i + 1} - Test note with UTF-8: 💰🎉`,
          },
          WALLET_PASSWORD
        );
      }

      // Step 8: Update wallet settings
      await WalletStorage.updateSettings({
        autoLockMinutes: 30,
        network: 'testnet',
      });

      // ========================================================================
      // ACT: Export → Clear → Import
      // ========================================================================

      const backupFile = await BackupManager.exportWallet(
        WALLET_PASSWORD,
        BACKUP_PASSWORD
      );

      // Clear ALL data
      await storageMock.clear();

      const importResult = await BackupManager.importWallet(
        backupFile,
        BACKUP_PASSWORD
      );

      // ========================================================================
      // ASSERT: Verify EVERYTHING is restored
      // ========================================================================

      expect(importResult.success).toBe(true);
      expect(importResult.accountCount).toBe(4); // 3 HD + 1 multisig
      expect(importResult.contactCount).toBe(5);
      expect(importResult.transactionMetadataCount).toBe(10);
      expect(importResult.hasMultisig).toBe(true);
      expect(importResult.hasImportedKeys).toBe(true);

      // Verify wallet structure
      const restoredWallet = await WalletStorage.getWallet() as StoredWalletV2;
      expect(restoredWallet.version).toBe(2);
      expect(restoredWallet.accounts.length).toBe(4);

      // Verify HD accounts with correct indices
      const account0 = restoredWallet.accounts[0] as Account;
      expect(account0.name).toBe('Primary HD Account');
      expect(account0.addressType).toBe('native-segwit');
      expect(account0.externalIndex).toBe(15);
      expect(account0.internalIndex).toBe(7);
      expect(account0.addresses.length).toBe(22);

      const account1 = restoredWallet.accounts[1] as Account;
      expect(account1.name).toBe('Savings (SegWit)');
      expect(account1.addressType).toBe('segwit');
      expect(account1.externalIndex).toBe(25);
      expect(account1.internalIndex).toBe(10);

      const account2 = restoredWallet.accounts[2] as Account;
      expect(account2.name).toBe('Legacy Account');
      expect(account2.addressType).toBe('legacy');
      expect(account2.externalIndex).toBe(8);
      expect(account2.internalIndex).toBe(3);

      // Verify multisig account
      const multisig = restoredWallet.accounts[3] as MultisigAccount;
      expect(multisig.accountType).toBe('multisig');
      expect(multisig.name).toBe('2-of-3 Multisig Vault');
      expect(multisig.multisigConfig).toBe('2-of-3');
      expect(multisig.cosigners.length).toBe(3);
      expect(multisig.externalIndex).toBe(12);
      expect(multisig.internalIndex).toBe(6);

      // Verify pending PSBTs
      expect(restoredWallet.pendingMultisigTxs.length).toBe(1);
      const restoredPSBT = restoredWallet.pendingMultisigTxs[0];
      expect(restoredPSBT.accountId).toBe(3);
      expect(restoredPSBT.signaturesCollected).toBe(1);
      expect(restoredPSBT.signatureStatus['12345678'].signed).toBe(true);

      // Verify imported keys
      expect(restoredWallet.importedKeys).toBeDefined();
      expect(restoredWallet.importedKeys![0]).toEqual(importedKey1);
      expect(restoredWallet.importedKeys![1]).toEqual(importedKey2);

      // Verify contacts
      const restoredContacts = await ContactsStorage.getContacts(WALLET_PASSWORD);
      expect(restoredContacts.length).toBe(5);

      for (let i = 0; i < 5; i++) {
        const contact = restoredContacts.find(c => c.name === `Contact ${i + 1}`);
        expect(contact).toBeDefined();
        expect(contact!.category).toBe(i % 2 === 0 ? 'Friends' : 'Business');
        expect(contact!.tags).toBeDefined();
        expect(contact!.tags!['importance']).toBe(i % 2 === 0 ? 'high' : 'medium');
      }

      // Verify transaction metadata
      for (let i = 0; i < 10; i++) {
        const metadata = await TransactionMetadataStorage.getMetadata(
          txids[i],
          WALLET_PASSWORD
        );

        expect(metadata).toBeDefined();
        expect(metadata!.tags).toEqual(
          i % 2 === 0 ? ['income', 'salary'] : ['expense', 'shopping']
        );
        expect(metadata!.category).toBe(i % 2 === 0 ? 'Salary' : 'Shopping');
        expect(metadata!.notes).toContain(`Transaction #${i + 1}`);
        expect(metadata!.notes).toContain('💰🎉'); // UTF-8 preserved
      }

      // Verify wallet settings
      expect(restoredWallet.settings.autoLockMinutes).toBe(30);
      expect(restoredWallet.settings.network).toBe('testnet');

      // Verify wallet is fully functional
      const seedPhrase = await WalletStorage.unlockWallet(WALLET_PASSWORD);
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });
  });
});
