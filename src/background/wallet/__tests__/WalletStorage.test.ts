/**
 * WalletStorage Tests
 *
 * Comprehensive test suite for WalletStorage class covering:
 * - Wallet creation and retrieval
 * - Account management operations
 * - Lock/unlock functionality
 * - Password verification and change
 * - Settings management
 * - Chrome storage integration
 * - Error handling and edge cases
 * - Data validation
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { WalletStorage } from '../WalletStorage';
import { CryptoUtils } from '../CryptoUtils';
import type { Account, StoredWallet, WalletSettings } from '../../../shared/types';
import {
  TEST_MNEMONIC_12,
  TEST_PASSWORD_STRONG,
} from '../../../__tests__/utils/testConstants';
import {
  createMockAccount,
  createMockAccounts,
  createMockStoredWallet,
  createMockWalletSettings,
} from '../../../__tests__/utils/testFactories';
import {
  expectAsyncThrows,
} from '../../../__tests__/utils/testHelpers';
import { storageMock } from '../../../__tests__/__mocks__/chrome';

// Ensure crypto.subtle is available (needed for PBKDF2)
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

// Helper to set data in chrome.storage.local for testing
async function setStorageData(key: string, value: any) {
  await storageMock.set({ [key]: value });
}

// Helper to get data from chrome.storage.local for testing
async function getStorageData(key: string): Promise<any> {
  const data = await storageMock.get(key);
  return data[key];
}

describe('WalletStorage', () => {
  beforeEach(() => {
    // Tests rely on global afterEach in setupTests.ts to clear storage
    jest.clearAllMocks();
    // Use real crypto for encryption operations (PBKDF2 needs real crypto.subtle)
    (global as any).__restoreOriginalCrypto();
  });

  // ===========================================================================
  // hasWallet() Tests
  // ===========================================================================

  describe('hasWallet()', () => {
    it('should return false when no wallet exists', async () => {
      const result = await WalletStorage.hasWallet();
      expect(result).toBe(false);
    });

    it('should return true when wallet exists', async () => {
      await setStorageData('wallet', createMockStoredWallet());

      const result = await WalletStorage.hasWallet();
      expect(result).toBe(true);
    });

    it('should handle storage errors gracefully', async () => {
      const originalGet = storageMock.get.bind(storageMock);
      storageMock.get = jest.fn().mockRejectedValueOnce(
        new Error('Storage unavailable')
      ) as any;

      await expectAsyncThrows(
        () => WalletStorage.hasWallet(),
        'Failed to check wallet existence'
      );

      // Restore
      storageMock.get = originalGet;
    });
  });

  // ===========================================================================
  // createWallet() Tests
  // ===========================================================================

  describe('createWallet()', () => {
    it('should create a new wallet with encrypted seed phrase', async () => {
      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG
      );

      expect(wallet).toBeDefined();
      expect(wallet.version).toBe(2); // v2 supports imported keys and multisig
      expect(wallet.encryptedSeed).toBeDefined();
      expect(wallet.salt).toBeDefined();
      expect(wallet.iv).toBeDefined();
      expect(wallet.accounts).toEqual([]);
      expect(wallet.settings).toBeDefined();
      expect(wallet.settings.network).toBe('testnet');
      expect(wallet.settings.autoLockMinutes).toBe(15);
    });

    it('should create wallet with initial account', async () => {
      const initialAccount = createMockAccount({ index: 0, name: 'Main Account' });

      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG,
        initialAccount
      );

      expect(wallet.accounts).toHaveLength(1);
      expect(wallet.accounts[0]).toEqual(initialAccount);
    });

    it('should create wallet with custom settings', async () => {
      const customSettings: Partial<WalletSettings> = {
        autoLockMinutes: 30,
        network: 'mainnet',
      };

      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG,
        undefined,
        customSettings
      );

      expect(wallet.settings.autoLockMinutes).toBe(30);
      expect(wallet.settings.network).toBe('mainnet');
    });

    it('should save wallet to chrome.storage.local', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);

      const storedWallet = await getStorageData('wallet');
      expect(storedWallet).toBeDefined();
      expect(storedWallet.version).toBe(2); // v2 supports imported keys and multisig
      expect(storedWallet.encryptedSeed).toBeDefined();
    });

    it('should reject empty seed phrase', async () => {
      await expectAsyncThrows(
        () => WalletStorage.createWallet('', TEST_PASSWORD_STRONG),
        'Seed phrase cannot be empty'
      );
    });

    it('should reject whitespace-only seed phrase', async () => {
      await expectAsyncThrows(
        () => WalletStorage.createWallet('   ', TEST_PASSWORD_STRONG),
        'Seed phrase cannot be empty'
      );
    });

    it('should reject empty password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.createWallet(TEST_MNEMONIC_12, ''),
        'Password cannot be empty'
      );
    });

    it('should reject when wallet already exists', async () => {
      // Create first wallet
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);

      // Attempt to create second wallet
      await expectAsyncThrows(
        () => WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG),
        'Wallet already exists'
      );
    });

    it('should encrypt seed phrase (not store in plaintext)', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);

      const storedWallet = await getStorageData('wallet') as StoredWallet;
      expect(storedWallet.encryptedSeed).not.toContain('abandon');
      expect(storedWallet.encryptedSeed).not.toBe(TEST_MNEMONIC_12);
    });
  });

  // ===========================================================================
  // getWallet() Tests
  // ===========================================================================

  describe('getWallet()', () => {
    it('should retrieve stored wallet', async () => {
      const storedWallet = createMockStoredWallet();
      await setStorageData('wallet', storedWallet);

      const wallet = await WalletStorage.getWallet();

      expect(wallet).toEqual(storedWallet);
    });

    it('should throw error when no wallet exists', async () => {
      await expectAsyncThrows(
        () => WalletStorage.getWallet(),
        'Wallet not found'
      );
    });

    it('should validate wallet structure', async () => {
      // Invalid wallet (missing required fields)
      await setStorageData('wallet', {
        version: 1,
        // Missing encryptedSeed, salt, iv
      });

      await expectAsyncThrows(
        () => WalletStorage.getWallet(),
        'Invalid wallet data'
      );
    });

    it('should reject wallet with invalid version', async () => {
      await setStorageData('wallet', {
        ...createMockStoredWallet(),
        version: 999,
      });

      await expectAsyncThrows(
        () => WalletStorage.getWallet(),
        'Invalid wallet data'
      );
    });

    it('should reject wallet with empty encrypted fields', async () => {
      await setStorageData('wallet', {
        ...createMockStoredWallet(),
        encryptedSeed: '',
      });

      await expectAsyncThrows(
        () => WalletStorage.getWallet(),
        'Invalid wallet data'
      );
    });
  });

  // ===========================================================================
  // unlockWallet() Tests
  // ===========================================================================

  describe('unlockWallet()', () => {
    beforeEach(async () => {
      // Create a wallet for unlock tests
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
    });

    it('should decrypt and return seed phrase with correct password', async () => {
      const seedPhrase = await WalletStorage.unlockWallet(TEST_PASSWORD_STRONG);

      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });

    it('should reject incorrect password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.unlockWallet('wrong_password'),
        'Failed to unlock wallet'
      );
    });

    it('should reject empty password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.unlockWallet(''),
        'Password cannot be empty'
      );
    });
  });

  // ===========================================================================
  // verifyPassword() Tests
  // ===========================================================================

  describe('verifyPassword()', () => {
    beforeEach(async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
    });

    it('should return true for correct password', async () => {
      const isValid = await WalletStorage.verifyPassword(TEST_PASSWORD_STRONG);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const isValid = await WalletStorage.verifyPassword('wrong_password');

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const isValid = await WalletStorage.verifyPassword('');

      expect(isValid).toBe(false);
    });

    it('should clear seed phrase from memory after verification', async () => {
      const clearSpy = jest.spyOn(CryptoUtils, 'clearSensitiveData');

      await WalletStorage.verifyPassword(TEST_PASSWORD_STRONG);

      expect(clearSpy).toHaveBeenCalledWith(TEST_MNEMONIC_12);
      clearSpy.mockRestore();
    });
  });

  // ===========================================================================
  // updateAccounts() Tests
  // ===========================================================================

  describe('updateAccounts()', () => {
    beforeEach(async () => {
      const initialAccount = createMockAccount({ index: 0 });
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG,
        initialAccount
      );
    });

    it('should update accounts successfully', async () => {
      const updatedAccounts = createMockAccounts(3);

      await WalletStorage.updateAccounts(updatedAccounts);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts).toHaveLength(3);
      expect(wallet.accounts).toEqual(updatedAccounts);
    });

    it('should preserve encrypted seed when updating accounts', async () => {
      const walletBefore = await WalletStorage.getWallet();
      const updatedAccounts = createMockAccounts(2);

      await WalletStorage.updateAccounts(updatedAccounts);

      const walletAfter = await WalletStorage.getWallet();
      expect(walletAfter.encryptedSeed).toBe(walletBefore.encryptedSeed);
      expect(walletAfter.salt).toBe(walletBefore.salt);
      expect(walletAfter.iv).toBe(walletBefore.iv);
    });

    it('should reject non-array accounts', async () => {
      await expectAsyncThrows(
        () => WalletStorage.updateAccounts({} as any),
        'Accounts must be an array'
      );
    });

    // Note: updateAccounts() intentionally skips validation to support both Account and MultisigAccount types
    // Invalid data will be caught when getWallet() is called later

    it('should allow empty accounts array', async () => {
      await WalletStorage.updateAccounts([]);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts).toEqual([]);
    });
  });

  // ===========================================================================
  // updateSettings() Tests
  // ===========================================================================

  describe('updateSettings()', () => {
    beforeEach(async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
    });

    it('should update auto-lock timeout', async () => {
      await WalletStorage.updateSettings({ autoLockMinutes: 30 });

      const wallet = await WalletStorage.getWallet();
      expect(wallet.settings.autoLockMinutes).toBe(30);
    });

    it('should update network setting', async () => {
      await WalletStorage.updateSettings({ network: 'mainnet' });

      const wallet = await WalletStorage.getWallet();
      expect(wallet.settings.network).toBe('mainnet');
    });

    it('should merge settings (preserve unchanged values)', async () => {
      await WalletStorage.updateSettings({ autoLockMinutes: 45 });

      const wallet = await WalletStorage.getWallet();
      expect(wallet.settings.autoLockMinutes).toBe(45);
      expect(wallet.settings.network).toBe('testnet'); // Unchanged
    });

    it('should preserve encrypted seed when updating settings', async () => {
      const walletBefore = await WalletStorage.getWallet();

      await WalletStorage.updateSettings({ autoLockMinutes: 20 });

      const walletAfter = await WalletStorage.getWallet();
      expect(walletAfter.encryptedSeed).toBe(walletBefore.encryptedSeed);
    });

    it('should reject invalid settings structure', async () => {
      await expectAsyncThrows(
        () => WalletStorage.updateSettings({ network: 'invalid' as any }),
        'Invalid wallet structure'
      );
    });
  });

  // ===========================================================================
  // addAccount() Tests
  // ===========================================================================

  describe('addAccount()', () => {
    beforeEach(async () => {
      const initialAccount = createMockAccount({ index: 0 });
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG,
        initialAccount
      );
    });

    it('should add new account successfully', async () => {
      const newAccount = createMockAccount({ index: 1, name: 'Account 2' });

      await WalletStorage.addAccount(newAccount);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts).toHaveLength(2);
      expect(wallet.accounts[1]).toEqual(newAccount);
    });

    it('should reject duplicate account index', async () => {
      const duplicateAccount = createMockAccount({ index: 0, name: 'Duplicate' });

      await expectAsyncThrows(
        () => WalletStorage.addAccount(duplicateAccount),
        'Account with index 0 already exists'
      );
    });

    it('should reject invalid account structure', async () => {
      const invalidAccount = {
        index: 1,
        // Missing required fields
      } as any;

      await expectAsyncThrows(
        () => WalletStorage.addAccount(invalidAccount),
        'Invalid account structure'
      );
    });

    it('should preserve existing accounts when adding new one', async () => {
      const existingAccounts = (await WalletStorage.getWallet()).accounts;
      const newAccount = createMockAccount({ index: 1 });

      await WalletStorage.addAccount(newAccount);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts[0]).toEqual(existingAccounts[0]);
    });
  });

  // ===========================================================================
  // updateAccount() Tests
  // ===========================================================================

  describe('updateAccount()', () => {
    beforeEach(async () => {
      const accounts = createMockAccounts(2);
      await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG,
        accounts[0]
      );
      await WalletStorage.addAccount(accounts[1]);
    });

    it('should update existing account', async () => {
      const updatedAccount = createMockAccount({
        index: 0,
        name: 'Updated Name',
      });

      await WalletStorage.updateAccount(0, updatedAccount);

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts[0].name).toBe('Updated Name');
    });

    it('should throw error when account not found', async () => {
      const account = createMockAccount({ index: 999 });

      await expectAsyncThrows(
        () => WalletStorage.updateAccount(999, account),
        'Account with index 999 not found'
      );
    });

    it('should reject invalid account structure', async () => {
      const invalidAccount = {
        index: 0,
        // Missing required fields
      } as any;

      await expectAsyncThrows(
        () => WalletStorage.updateAccount(0, invalidAccount),
        'Invalid account structure'
      );
    });

    it('should preserve other accounts when updating one', async () => {
      const accountsBefore = (await WalletStorage.getWallet()).accounts;
      const updatedAccount = createMockAccount({
        index: 0,
        name: 'Updated',
      });

      await WalletStorage.updateAccount(0, updatedAccount);

      const accountsAfter = (await WalletStorage.getWallet()).accounts;
      expect(accountsAfter[1]).toEqual(accountsBefore[1]);
    });
  });

  // ===========================================================================
  // deleteWallet() Tests
  // ===========================================================================

  describe('deleteWallet()', () => {
    beforeEach(async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
    });

    it('should delete wallet from storage', async () => {
      await WalletStorage.deleteWallet();

      const hasWallet = await WalletStorage.hasWallet();
      expect(hasWallet).toBe(false);
    });

    it('should not throw error when deleting non-existent wallet', async () => {
      await WalletStorage.deleteWallet();
      await WalletStorage.deleteWallet(); // Delete again

      // Should not throw
      const hasWallet = await WalletStorage.hasWallet();
      expect(hasWallet).toBe(false);
    });
  });

  // ===========================================================================
  // changePassword() Tests
  // ===========================================================================

  describe('changePassword()', () => {
    beforeEach(async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
    });

    it('should change password successfully', async () => {
      const newPassword = 'NewSecureP@ssw0rd!2024';

      await WalletStorage.changePassword(TEST_PASSWORD_STRONG, newPassword);

      // Verify old password no longer works
      const isOldValid = await WalletStorage.verifyPassword(TEST_PASSWORD_STRONG);
      expect(isOldValid).toBe(false);

      // Verify new password works
      const isNewValid = await WalletStorage.verifyPassword(newPassword);
      expect(isNewValid).toBe(true);
    });

    it('should unlock wallet with new password', async () => {
      const newPassword = 'NewSecureP@ssw0rd!2024';

      await WalletStorage.changePassword(TEST_PASSWORD_STRONG, newPassword);

      const seedPhrase = await WalletStorage.unlockWallet(newPassword);
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });

    it('should reject incorrect old password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.changePassword('wrong_password', 'new_password'),
        'Failed to change password'
      );
    });

    it('should reject empty old password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.changePassword('', 'new_password'),
        'Old password cannot be empty'
      );
    });

    it('should reject empty new password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.changePassword(TEST_PASSWORD_STRONG, ''),
        'New password cannot be empty'
      );
    });

    it('should reject same password', async () => {
      await expectAsyncThrows(
        () => WalletStorage.changePassword(TEST_PASSWORD_STRONG, TEST_PASSWORD_STRONG),
        'New password must be different'
      );
    });

    it('should preserve accounts and settings after password change', async () => {
      const accounts = createMockAccounts(2);
      await WalletStorage.updateAccounts(accounts);
      await WalletStorage.updateSettings({ autoLockMinutes: 30 });

      await WalletStorage.changePassword(TEST_PASSWORD_STRONG, 'NewPassword123!');

      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts).toHaveLength(2);
      expect(wallet.settings.autoLockMinutes).toBe(30);
    });

    it('should re-encrypt wallet on password change', async () => {
      const walletBefore = await WalletStorage.getWallet();

      await WalletStorage.changePassword(TEST_PASSWORD_STRONG, 'NewPassword123!');

      const walletAfter = await WalletStorage.getWallet();

      // Encryption fields should still exist and be valid
      expect(walletAfter.encryptedSeed).toBeDefined();
      expect(walletAfter.salt).toBeDefined();
      expect(walletAfter.iv).toBeDefined();
      expect(walletAfter.encryptedSeed.length).toBeGreaterThan(0);
      expect(walletAfter.salt.length).toBeGreaterThan(0);
      expect(walletAfter.iv.length).toBeGreaterThan(0);

      // New password should work to unlock (this is the key test)
      const seedPhrase = await WalletStorage.unlockWallet('NewPassword123!');
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);

      // Old password should NOT work
      await expectAsyncThrows(
        () => WalletStorage.unlockWallet(TEST_PASSWORD_STRONG),
        'Failed to unlock wallet'
      );
    });

    it('should clear seed phrase from memory', async () => {
      const clearSpy = jest.spyOn(CryptoUtils, 'clearSensitiveData');

      await WalletStorage.changePassword(TEST_PASSWORD_STRONG, 'NewPassword123!');

      expect(clearSpy).toHaveBeenCalledWith(TEST_MNEMONIC_12);
      clearSpy.mockRestore();
    });
  });

  // ===========================================================================
  // getStorageInfo() Tests
  // ===========================================================================

  describe('getStorageInfo()', () => {
    it('should return storage usage information', async () => {
      // Mock getBytesInUse which isn't in our storageMock
      (storageMock as any).getBytesInUse = jest.fn().mockResolvedValue(1024);
      (storageMock as any).QUOTA_BYTES = 5242880;

      const info = await WalletStorage.getStorageInfo();

      expect(info.bytesInUse).toBe(1024);
      expect(info.quotaBytes).toBe(5242880);
      expect(info.quotaBytes).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Validation Tests (Private Methods - Testing via Public API)
  // ===========================================================================

  describe('Validation', () => {
    describe('Wallet Structure Validation', () => {
      it('should reject wallet with missing version', async () => {
        await setStorageData('wallet', {
          encryptedSeed: 'test',
          salt: 'test',
          iv: 'test',
          accounts: [],
          settings: createMockWalletSettings(),
        });

        await expectAsyncThrows(
          () => WalletStorage.getWallet(),
          'Invalid wallet data'
        );
      });

      it('should reject wallet with wrong version', async () => {
        await setStorageData('wallet', {
          ...createMockStoredWallet(),
          version: 999, // Invalid version (only 1 and 2 are supported)
        });

        await expectAsyncThrows(
          () => WalletStorage.getWallet(),
          'Invalid wallet data'
        );
      });

      it('should reject wallet with non-string encrypted fields', async () => {
        await setStorageData('wallet', {
          ...createMockStoredWallet(),
          encryptedSeed: 123,
        });

        await expectAsyncThrows(
          () => WalletStorage.getWallet(),
          'Invalid wallet data'
        );
      });

      it('should reject wallet with missing accounts array', async () => {
        await setStorageData('wallet', {
          version: 1,
          encryptedSeed: 'test',
          salt: 'test',
          iv: 'test',
          settings: createMockWalletSettings(),
        });

        await expectAsyncThrows(
          () => WalletStorage.getWallet(),
          'Invalid wallet data'
        );
      });

      it('should reject wallet with invalid settings', async () => {
        await setStorageData('wallet', {
          ...createMockStoredWallet(),
          settings: {
            autoLockMinutes: 'not_a_number',
            network: 'testnet',
          },
        });

        await expectAsyncThrows(
          () => WalletStorage.getWallet(),
          'Invalid wallet data'
        );
      });
    });

    describe('Account Structure Validation', () => {
      beforeEach(async () => {
        await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
      });

      it('should reject account with missing index', async () => {
        const invalidAccount = {
          name: 'Test',
          addressType: 'native-segwit',
          externalIndex: 0,
          internalIndex: 0,
          addresses: [],
        } as any;

        await expectAsyncThrows(
          () => WalletStorage.addAccount(invalidAccount),
          'Invalid account structure'
        );
      });

      it('should reject account with invalid address type', async () => {
        const invalidAccount = createMockAccount({
          addressType: 'invalid' as any,
        });

        await expectAsyncThrows(
          () => WalletStorage.addAccount(invalidAccount),
          'Wallet validation failed after adding account'
        );
      });

      it('should reject account with negative index', async () => {
        const invalidAccount = createMockAccount({
          index: -1,
        });

        await expectAsyncThrows(
          () => WalletStorage.addAccount(invalidAccount),
          'Wallet validation failed after adding account'
        );
      });
    });
  });

  // ===========================================================================
  // Integration Tests (Multiple Operations)
  // ===========================================================================

  describe('Integration Tests', () => {
    it('should handle complete wallet lifecycle', async () => {
      // 1. Create wallet
      const wallet = await WalletStorage.createWallet(
        TEST_MNEMONIC_12,
        TEST_PASSWORD_STRONG
      );
      expect(wallet).toBeDefined();

      // 2. Verify it exists
      const exists = await WalletStorage.hasWallet();
      expect(exists).toBe(true);

      // 3. Add accounts
      await WalletStorage.addAccount(createMockAccount({ index: 0 }));
      await WalletStorage.addAccount(createMockAccount({ index: 1 }));

      // 4. Update settings
      await WalletStorage.updateSettings({ autoLockMinutes: 30 });

      // 5. Verify password
      const isValid = await WalletStorage.verifyPassword(TEST_PASSWORD_STRONG);
      expect(isValid).toBe(true);

      // 6. Change password
      await WalletStorage.changePassword(TEST_PASSWORD_STRONG, 'NewPassword123!');

      // 7. Unlock with new password
      const seedPhrase = await WalletStorage.unlockWallet('NewPassword123!');
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);

      // 8. Delete wallet
      await WalletStorage.deleteWallet();
      const existsAfterDelete = await WalletStorage.hasWallet();
      expect(existsAfterDelete).toBe(false);
    });

    it('should maintain data integrity across multiple account operations', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);

      // Add multiple accounts
      for (let i = 0; i < 5; i++) {
        await WalletStorage.addAccount(
          createMockAccount({ index: i, name: `Account ${i + 1}` })
        );
      }

      // Update some accounts
      await WalletStorage.updateAccount(
        0,
        createMockAccount({ index: 0, name: 'Updated Account 1' })
      );
      await WalletStorage.updateAccount(
        2,
        createMockAccount({ index: 2, name: 'Updated Account 3' })
      );

      // Verify all accounts
      const wallet = await WalletStorage.getWallet();
      expect(wallet.accounts).toHaveLength(5);
      expect(wallet.accounts[0].name).toBe('Updated Account 1');
      expect(wallet.accounts[2].name).toBe('Updated Account 3');
      expect(wallet.accounts[1].name).toBe('Account 2');
    });

    it('should preserve encryption across settings changes', async () => {
      await WalletStorage.createWallet(TEST_MNEMONIC_12, TEST_PASSWORD_STRONG);
      const walletBefore = await WalletStorage.getWallet();

      // Make multiple settings changes
      await WalletStorage.updateSettings({ autoLockMinutes: 20 });
      await WalletStorage.updateSettings({ network: 'mainnet' });
      await WalletStorage.updateSettings({ autoLockMinutes: 45 });

      const walletAfter = await WalletStorage.getWallet();

      // Encryption data should remain unchanged
      expect(walletAfter.encryptedSeed).toBe(walletBefore.encryptedSeed);
      expect(walletAfter.salt).toBe(walletBefore.salt);
      expect(walletAfter.iv).toBe(walletBefore.iv);

      // Should still unlock with original password
      const seedPhrase = await WalletStorage.unlockWallet(TEST_PASSWORD_STRONG);
      expect(seedPhrase).toBe(TEST_MNEMONIC_12);
    });
  });
});
