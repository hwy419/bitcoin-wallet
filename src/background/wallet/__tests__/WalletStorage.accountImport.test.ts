/**
 * WalletStorage Tests - Imported Key Operations
 *
 * Tests for imported key/seed storage and retrieval:
 * - storeImportedKey(): Store encrypted imported key/seed
 * - getImportedKey(): Retrieve encrypted imported data
 * - unlockImportedKey(): Decrypt imported key/seed
 * - deleteImportedKey(): Remove imported data
 *
 * Security test coverage:
 * - Encryption with password-derived key
 * - Separate storage from main wallet seed
 * - Proper error handling
 * - Data isolation per account
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { WalletStorage } from '../WalletStorage';
import { CryptoUtils } from '../CryptoUtils';
import type { StoredWalletV2, ImportedKeyData, Account } from '../../../shared/types';
import { createMockStoredWallet, createMockAccount } from '../../../__tests__/utils/testFactories';
import { storageMock } from '../../../__tests__/__mocks__/chrome';

// Ensure crypto.subtle is available in Node environment
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

describe('WalletStorage - Imported Key Operations', () => {
  const testPassword = 'test-password-123';
  const testSeedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const testPrivateKey = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ';

  beforeEach(() => {
    // Clear storage data using the global mock
    storageMock.__clear();
    // Reset mock random counter for deterministic tests
    (global as any).__resetMockRandomCounter();
  });

  describe('storeImportedKey()', () => {
    describe('Success Cases', () => {
      it('should store encrypted private key for account', async () => {
        // Create wallet v2
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        // Store wallet in mock storage
        await storageMock.set({ wallet });

        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-private-key-base64',
          salt: 'salt-base64',
          iv: 'iv-base64',
          type: 'private-key',
        };

        await WalletStorage.storeImportedKey(0, importedKeyData);

        // Get the saved wallet from storage
        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys).toBeDefined();
        expect(savedWallet.importedKeys![0]).toEqual(importedKeyData);
      });

      it('should store encrypted seed phrase for account', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        await storageMock.set({ wallet });

        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-seed-base64',
          salt: '', // Empty for key-based encryption
          iv: 'iv-base64',
          type: 'seed',
        };

        await WalletStorage.storeImportedKey(1, importedKeyData);

        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys![1]).toEqual(importedKeyData);
        expect(savedWallet.importedKeys![1].type).toBe('seed');
      });

      it('should initialize importedKeys if not present', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          // No importedKeys property
        };

        await storageMock.set({ wallet });

        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-data',
          salt: '',
          iv: 'iv',
          type: 'private-key',
        };

        await WalletStorage.storeImportedKey(0, importedKeyData);

        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys).toBeDefined();
        expect(savedWallet.importedKeys![0]).toEqual(importedKeyData);
      });

      it('should store multiple imported keys for different accounts', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        await storageMock.set({ wallet });

        const keyData1: ImportedKeyData = {
          encryptedData: 'encrypted-key-1',
          salt: '',
          iv: 'iv-1',
          type: 'private-key',
        };

        const keyData2: ImportedKeyData = {
          encryptedData: 'encrypted-seed-2',
          salt: '',
          iv: 'iv-2',
          type: 'seed',
        };

        await WalletStorage.storeImportedKey(0, keyData1);

        // Update mock to return wallet with first key
        const walletWithKey1: StoredWalletV2 = {
          ...wallet,
          importedKeys: { 0: keyData1 },
        };
        await storageMock.set({ wallet: walletWithKey1 });

        await WalletStorage.storeImportedKey(1, keyData2);

        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys![0]).toEqual(keyData1);
        expect(savedWallet.importedKeys![1]).toEqual(keyData2);
      });

      it('should overwrite existing imported key for same account', async () => {
        const oldKeyData: ImportedKeyData = {
          encryptedData: 'old-encrypted-data',
          salt: '',
          iv: 'old-iv',
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: oldKeyData },
        };

        await storageMock.set({ wallet });

        const newKeyData: ImportedKeyData = {
          encryptedData: 'new-encrypted-data',
          salt: '',
          iv: 'new-iv',
          type: 'seed',
        };

        await WalletStorage.storeImportedKey(0, newKeyData);

        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys![0]).toEqual(newKeyData);
        expect(savedWallet.importedKeys![0].type).toBe('seed'); // Overwritten
      });
    });

    describe('Error Handling', () => {
      it('should throw if wallet version is not 2', async () => {
        const wallet = createMockStoredWallet(); // Version 1

        await storageMock.set({ wallet });

        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-data',
          salt: '',
          iv: 'iv',
          type: 'private-key',
        };

        await expect(WalletStorage.storeImportedKey(0, importedKeyData))
          .rejects.toThrow('Wallet version must be 2');
      });

      it('should throw if wallet does not exist', async () => {
        // Empty storage (no wallet)

        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-data',
          salt: '',
          iv: 'iv',
          type: 'private-key',
        };

        await expect(WalletStorage.storeImportedKey(0, importedKeyData))
          .rejects.toThrow();
      });

      it('should throw if chrome.storage.local.set fails', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        await storageMock.set({ wallet });
        storageMock.__setError('set', new Error('Storage quota exceeded'));

        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-data',
          salt: '',
          iv: 'iv',
          type: 'private-key',
        };

        await expect(WalletStorage.storeImportedKey(0, importedKeyData))
          .rejects.toThrow('Failed to store imported key');
      });
    });
  });

  describe('getImportedKey()', () => {
    describe('Success Cases', () => {
      it('should retrieve imported private key for account', async () => {
        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-private-key',
          salt: '',
          iv: 'iv-base64',
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.getImportedKey(0);

        expect(result).toEqual(importedKeyData);
      });

      it('should retrieve imported seed phrase for account', async () => {
        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-seed-phrase',
          salt: '',
          iv: 'iv-base64',
          type: 'seed',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 1: importedKeyData },
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.getImportedKey(1);

        expect(result).toEqual(importedKeyData);
      });

      it('should return null if no imported key exists for account', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.getImportedKey(5);

        expect(result).toBeNull();
      });

      it('should return null if importedKeys is undefined', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          // No importedKeys property
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.getImportedKey(0);

        expect(result).toBeNull();
      });

      it('should return null if wallet version is 1 (legacy)', async () => {
        const wallet = createMockStoredWallet(); // Version 1

        await storageMock.set({ wallet });

        const result = await WalletStorage.getImportedKey(0);

        expect(result).toBeNull();
      });
    });

    describe('Error Handling', () => {
      it('should throw if wallet does not exist', async () => {
        // Empty storage (no wallet)

        await expect(WalletStorage.getImportedKey(0))
          .rejects.toThrow();
      });

      it('should throw if chrome.storage.local.get fails', async () => {
        storageMock.__setError('get', new Error('Storage error'));

        await expect(WalletStorage.getImportedKey(0))
          .rejects.toThrow('Failed to retrieve imported key');
      });
    });
  });

  describe('unlockImportedKey()', () => {
    describe('Success Cases', () => {
      it('should decrypt imported private key', async () => {
        const decryptedKey = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ';

        // Mock encryption (we'll use real CryptoUtils for this test)
        const encryptionResult = await CryptoUtils.encrypt(decryptedKey, testPassword);

        const importedKeyData: ImportedKeyData = {
          encryptedData: encryptionResult.encryptedData,
          salt: encryptionResult.salt,
          iv: encryptionResult.iv,
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.unlockImportedKey(0, testPassword);

        expect(result).toBe(decryptedKey);
      });

      it('should decrypt imported seed phrase', async () => {
        const decryptedSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        const encryptionResult = await CryptoUtils.encrypt(decryptedSeed, testPassword);

        const importedKeyData: ImportedKeyData = {
          encryptedData: encryptionResult.encryptedData,
          salt: encryptionResult.salt,
          iv: encryptionResult.iv,
          type: 'seed',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.unlockImportedKey(0, testPassword);

        expect(result).toBe(decryptedSeed);
      });

      it('should decrypt with correct password', async () => {
        const originalData = 'sensitive-data-123';
        const correctPassword = 'correct-password';

        const encryptionResult = await CryptoUtils.encrypt(originalData, correctPassword);

        const importedKeyData: ImportedKeyData = {
          encryptedData: encryptionResult.encryptedData,
          salt: encryptionResult.salt,
          iv: encryptionResult.iv,
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });

        const result = await WalletStorage.unlockImportedKey(0, correctPassword);

        expect(result).toBe(originalData);
      });
    });

    describe('Error Handling', () => {
      it('should throw if no imported key exists for account', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        await storageMock.set({ wallet });

        await expect(WalletStorage.unlockImportedKey(0, testPassword))
          .rejects.toThrow('No imported key found for account 0');
      });

      it('should throw if password is incorrect', async () => {
        const originalData = 'sensitive-data';
        const correctPassword = 'correct-password';
        const wrongPassword = 'wrong-password';

        const encryptionResult = await CryptoUtils.encrypt(originalData, correctPassword);

        const importedKeyData: ImportedKeyData = {
          encryptedData: encryptionResult.encryptedData,
          salt: encryptionResult.salt,
          iv: encryptionResult.iv,
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });

        await expect(WalletStorage.unlockImportedKey(0, wrongPassword))
          .rejects.toThrow();
      });

      it('should throw if wallet does not exist', async () => {
        // Empty storage (no wallet)

        await expect(WalletStorage.unlockImportedKey(0, testPassword))
          .rejects.toThrow();
      });
    });
  });

  describe('deleteImportedKey()', () => {
    describe('Success Cases', () => {
      it('should delete imported key for account', async () => {
        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-data',
          salt: '',
          iv: 'iv',
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });

        await WalletStorage.deleteImportedKey(0);

        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys![0]).toBeUndefined();
      });

      it('should delete imported key without affecting other keys', async () => {
        const keyData1: ImportedKeyData = {
          encryptedData: 'encrypted-key-1',
          salt: '',
          iv: 'iv-1',
          type: 'private-key',
        };

        const keyData2: ImportedKeyData = {
          encryptedData: 'encrypted-key-2',
          salt: '',
          iv: 'iv-2',
          type: 'seed',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: keyData1, 1: keyData2 },
        };

        await storageMock.set({ wallet });

        await WalletStorage.deleteImportedKey(0);

        const storageData = storageMock.__getData();
        const savedWallet = storageData['wallet'] as StoredWalletV2;
        expect(savedWallet.importedKeys![0]).toBeUndefined();
        expect(savedWallet.importedKeys![1]).toEqual(keyData2); // Still exists
      });

      it('should not throw if key does not exist', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: {},
        };

        await storageMock.set({ wallet });

        // Should not throw
        await expect(WalletStorage.deleteImportedKey(0)).resolves.not.toThrow();

        // Storage should not be modified
        // Verify no storage changes were made (wallet should be unchanged)
        const storageData = storageMock.__getData();
        expect(storageData['wallet']).toEqual(wallet);
      });

      it('should not throw if importedKeys is undefined', async () => {
        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          // No importedKeys
        };

        await storageMock.set({ wallet });

        await expect(WalletStorage.deleteImportedKey(0)).resolves.not.toThrow();
      });

      it('should do nothing for wallet version 1', async () => {
        const wallet = createMockStoredWallet(); // Version 1

        await storageMock.set({ wallet });

        await WalletStorage.deleteImportedKey(0);

        // Verify no storage changes were made (wallet should be unchanged)
        const storageData = storageMock.__getData();
        expect(storageData['wallet']).toEqual(wallet);
      });
    });

    describe('Error Handling', () => {
      it('should throw if wallet does not exist', async () => {
        // Empty storage (no wallet)

        await expect(WalletStorage.deleteImportedKey(0))
          .rejects.toThrow();
      });

      it('should throw if chrome.storage.local.set fails', async () => {
        const importedKeyData: ImportedKeyData = {
          encryptedData: 'encrypted-data',
          salt: '',
          iv: 'iv',
          type: 'private-key',
        };

        const wallet: StoredWalletV2 = {
          ...createMockStoredWallet(),
          version: 2,
          importedKeys: { 0: importedKeyData },
        };

        await storageMock.set({ wallet });
        storageMock.__setError('set', new Error('Storage error'));

        await expect(WalletStorage.deleteImportedKey(0))
          .rejects.toThrow('Failed to delete imported key');
      });
    });
  });

  describe('Integration Tests', () => {
    it('should store, retrieve, unlock, and delete imported key', async () => {
      const originalKey = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ';
      const password = 'test-password-123';

      // Encrypt the key
      const encryptionResult = await CryptoUtils.encrypt(originalKey, password);

      const importedKeyData: ImportedKeyData = {
        encryptedData: encryptionResult.encryptedData,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        type: 'private-key',
      };

      // 1. Store
      const wallet: StoredWalletV2 = {
        ...createMockStoredWallet(),
        version: 2,
        importedKeys: {},
      };

      await storageMock.set({ wallet });

      await WalletStorage.storeImportedKey(0, importedKeyData);

      // 2. Update mock to return wallet with stored key
      const walletWithKey: StoredWalletV2 = {
        ...wallet,
        importedKeys: { 0: importedKeyData },
      };
      await storageMock.set({ wallet: walletWithKey });

      // 3. Retrieve
      const retrieved = await WalletStorage.getImportedKey(0);
      expect(retrieved).toEqual(importedKeyData);

      // 4. Unlock
      const decrypted = await WalletStorage.unlockImportedKey(0, password);
      expect(decrypted).toBe(originalKey);

      // 5. Delete
      await WalletStorage.deleteImportedKey(0);

      const storageData = storageMock.__getData();
      const savedWallet = storageData['wallet'] as StoredWalletV2;
      expect(savedWallet.importedKeys![0]).toBeUndefined();
    });

    it('should handle multiple accounts with imported keys', async () => {
      const password = 'test-password-123';
      const key1 = 'private-key-1';
      const key2 = 'seed-phrase-2';

      const encrypted1 = await CryptoUtils.encrypt(key1, password);
      const encrypted2 = await CryptoUtils.encrypt(key2, password);

      const wallet: StoredWalletV2 = {
        ...createMockStoredWallet(),
        version: 2,
        importedKeys: {},
      };

      await storageMock.set({ wallet });

      // Store first key
      await WalletStorage.storeImportedKey(0, {
        encryptedData: encrypted1.encryptedData,
        salt: encrypted1.salt,
        iv: encrypted1.iv,
        type: 'private-key',
      });

      const walletWith1: StoredWalletV2 = {
        ...wallet,
        importedKeys: {
          0: {
            encryptedData: encrypted1.encryptedData,
            salt: encrypted1.salt,
            iv: encrypted1.iv,
            type: 'private-key',
          },
        },
      };
      await storageMock.set({ wallet: walletWith1 });

      // Store second key
      await WalletStorage.storeImportedKey(1, {
        encryptedData: encrypted2.encryptedData,
        salt: encrypted2.salt,
        iv: encrypted2.iv,
        type: 'seed',
      });

      const walletWith2: StoredWalletV2 = {
        ...walletWith1,
        importedKeys: {
          ...walletWith1.importedKeys,
          1: {
            encryptedData: encrypted2.encryptedData,
            salt: encrypted2.salt,
            iv: encrypted2.iv,
            type: 'seed',
          },
        },
      };
      await storageMock.set({ wallet: walletWith2 });

      // Unlock both
      const decrypted1 = await WalletStorage.unlockImportedKey(0, password);
      const decrypted2 = await WalletStorage.unlockImportedKey(1, password);

      expect(decrypted1).toBe(key1);
      expect(decrypted2).toBe(key2);
    });
  });
});
