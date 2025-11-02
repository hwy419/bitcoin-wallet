/**
 * Account Utilities Tests
 *
 * Comprehensive test suite for account grouping and categorization utilities
 */

import {
  isSingleSigAccount,
  isMultisigAccount,
  isHDDerivedAccount,
  isImportedAccount,
  getHDAccounts,
  getImportedAccounts,
  getMultisigAccounts,
  groupAccounts,
  canExportXpub,
  canExportPrivateKey,
  getAccountTypeLabel,
  getAccountDerivationInfo,
  isNonHDWallet,
  countAccounts,
} from '../accountUtils';
import { WalletAccount, Account, MultisigAccount } from '../../types';

// Mock accounts for testing
const mockHDAccount: Account = {
  accountType: 'single',
  index: 0,
  name: 'HD Account',
  addressType: 'native-segwit',
  importType: 'hd',
  externalIndex: 1,
  internalIndex: 0,
  addresses: [],
};

const mockLegacyHDAccount: Account = {
  accountType: 'single',
  index: 1,
  name: 'Legacy HD Account',
  addressType: 'native-segwit',
  // importType undefined (legacy HD account)
  externalIndex: 1,
  internalIndex: 0,
  addresses: [],
};

const mockImportedPrivateKeyAccount: Account = {
  accountType: 'single',
  index: 2,
  name: 'Imported Private Key',
  addressType: 'native-segwit',
  importType: 'private-key',
  externalIndex: 1,
  internalIndex: 0,
  addresses: [],
};

const mockImportedSeedAccount: Account = {
  accountType: 'single',
  index: 3,
  name: 'Imported Seed',
  addressType: 'legacy',
  importType: 'seed',
  externalIndex: 1,
  internalIndex: 0,
  addresses: [],
};

const mockMultisigAccount: MultisigAccount = {
  accountType: 'multisig',
  index: 4,
  name: 'Multisig Wallet',
  multisigConfig: '2-of-3',
  addressType: 'p2wsh',
  cosigners: [],
  externalIndex: 0,
  internalIndex: 0,
  addresses: [],
};

describe('Account Utilities', () => {
  describe('isSingleSigAccount', () => {
    it('should return true for single-sig HD account', () => {
      expect(isSingleSigAccount(mockHDAccount)).toBe(true);
    });

    it('should return true for imported single-sig account', () => {
      expect(isSingleSigAccount(mockImportedPrivateKeyAccount)).toBe(true);
    });

    it('should return false for multisig account', () => {
      expect(isSingleSigAccount(mockMultisigAccount)).toBe(false);
    });
  });

  describe('isMultisigAccount', () => {
    it('should return true for multisig account', () => {
      expect(isMultisigAccount(mockMultisigAccount)).toBe(true);
    });

    it('should return false for single-sig account', () => {
      expect(isMultisigAccount(mockHDAccount)).toBe(false);
    });
  });

  describe('isHDDerivedAccount', () => {
    it('should return true for HD account with importType="hd"', () => {
      expect(isHDDerivedAccount(mockHDAccount)).toBe(true);
    });

    it('should return true for legacy HD account with undefined importType', () => {
      expect(isHDDerivedAccount(mockLegacyHDAccount)).toBe(true);
    });

    it('should return false for imported private key account', () => {
      expect(isHDDerivedAccount(mockImportedPrivateKeyAccount)).toBe(false);
    });

    it('should return false for imported seed account', () => {
      expect(isHDDerivedAccount(mockImportedSeedAccount)).toBe(false);
    });
  });

  describe('isImportedAccount', () => {
    it('should return true for imported private key account', () => {
      expect(isImportedAccount(mockImportedPrivateKeyAccount)).toBe(true);
    });

    it('should return true for imported seed account', () => {
      expect(isImportedAccount(mockImportedSeedAccount)).toBe(true);
    });

    it('should return false for HD account', () => {
      expect(isImportedAccount(mockHDAccount)).toBe(false);
    });

    it('should return false for legacy HD account', () => {
      expect(isImportedAccount(mockLegacyHDAccount)).toBe(false);
    });
  });

  describe('getHDAccounts', () => {
    it('should return all HD accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockLegacyHDAccount,
        mockImportedPrivateKeyAccount,
        mockMultisigAccount,
      ];

      const hdAccounts = getHDAccounts(accounts);

      expect(hdAccounts).toHaveLength(2);
      expect(hdAccounts[0].name).toBe('HD Account');
      expect(hdAccounts[1].name).toBe('Legacy HD Account');
    });

    it('should return empty array when no HD accounts exist', () => {
      const accounts: WalletAccount[] = [
        mockImportedPrivateKeyAccount,
        mockMultisigAccount,
      ];

      const hdAccounts = getHDAccounts(accounts);

      expect(hdAccounts).toHaveLength(0);
    });

    it('should handle empty account list', () => {
      const hdAccounts = getHDAccounts([]);
      expect(hdAccounts).toHaveLength(0);
    });
  });

  describe('getImportedAccounts', () => {
    it('should return all imported accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockImportedPrivateKeyAccount,
        mockImportedSeedAccount,
        mockMultisigAccount,
      ];

      const importedAccounts = getImportedAccounts(accounts);

      expect(importedAccounts).toHaveLength(2);
      expect(importedAccounts[0].name).toBe('Imported Private Key');
      expect(importedAccounts[1].name).toBe('Imported Seed');
    });

    it('should return empty array when no imported accounts exist', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockMultisigAccount,
      ];

      const importedAccounts = getImportedAccounts(accounts);

      expect(importedAccounts).toHaveLength(0);
    });
  });

  describe('getMultisigAccounts', () => {
    it('should return all multisig accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockMultisigAccount,
        mockImportedPrivateKeyAccount,
      ];

      const multisigAccounts = getMultisigAccounts(accounts);

      expect(multisigAccounts).toHaveLength(1);
      expect(multisigAccounts[0].name).toBe('Multisig Wallet');
    });

    it('should return empty array when no multisig accounts exist', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockImportedPrivateKeyAccount,
      ];

      const multisigAccounts = getMultisigAccounts(accounts);

      expect(multisigAccounts).toHaveLength(0);
    });
  });

  describe('groupAccounts', () => {
    it('should group accounts correctly', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockLegacyHDAccount,
        mockImportedPrivateKeyAccount,
        mockImportedSeedAccount,
        mockMultisigAccount,
      ];

      const grouped = groupAccounts(accounts);

      expect(grouped.hdAccounts).toHaveLength(2);
      expect(grouped.importedAccounts).toHaveLength(2);
      expect(grouped.multisigAccounts).toHaveLength(1);
    });

    it('should handle wallet with only HD accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockLegacyHDAccount,
      ];

      const grouped = groupAccounts(accounts);

      expect(grouped.hdAccounts).toHaveLength(2);
      expect(grouped.importedAccounts).toHaveLength(0);
      expect(grouped.multisigAccounts).toHaveLength(0);
    });

    it('should handle wallet with only imported accounts', () => {
      const accounts: WalletAccount[] = [
        mockImportedPrivateKeyAccount,
        mockImportedSeedAccount,
      ];

      const grouped = groupAccounts(accounts);

      expect(grouped.hdAccounts).toHaveLength(0);
      expect(grouped.importedAccounts).toHaveLength(2);
      expect(grouped.multisigAccounts).toHaveLength(0);
    });

    it('should handle empty account list', () => {
      const grouped = groupAccounts([]);

      expect(grouped.hdAccounts).toHaveLength(0);
      expect(grouped.importedAccounts).toHaveLength(0);
      expect(grouped.multisigAccounts).toHaveLength(0);
    });
  });

  describe('canExportXpub', () => {
    it('should return true for HD single-sig account', () => {
      expect(canExportXpub(mockHDAccount)).toBe(true);
    });

    it('should return true for legacy HD account', () => {
      expect(canExportXpub(mockLegacyHDAccount)).toBe(true);
    });

    it('should return false for imported private key account', () => {
      expect(canExportXpub(mockImportedPrivateKeyAccount)).toBe(false);
    });

    it('should return false for imported seed account', () => {
      expect(canExportXpub(mockImportedSeedAccount)).toBe(false);
    });

    it('should return false for multisig account', () => {
      expect(canExportXpub(mockMultisigAccount)).toBe(false);
    });
  });

  describe('canExportPrivateKey', () => {
    it('should return true for HD account', () => {
      expect(canExportPrivateKey(mockHDAccount)).toBe(true);
    });

    it('should return true for imported account', () => {
      expect(canExportPrivateKey(mockImportedPrivateKeyAccount)).toBe(true);
    });

    it('should return false for multisig account', () => {
      expect(canExportPrivateKey(mockMultisigAccount)).toBe(false);
    });
  });

  describe('getAccountTypeLabel', () => {
    it('should return "HD-derived" for HD account', () => {
      expect(getAccountTypeLabel(mockHDAccount)).toBe('HD-derived');
    });

    it('should return "HD-derived" for legacy HD account', () => {
      expect(getAccountTypeLabel(mockLegacyHDAccount)).toBe('HD-derived');
    });

    it('should return "Imported Key" for imported private key account', () => {
      expect(getAccountTypeLabel(mockImportedPrivateKeyAccount)).toBe('Imported Key');
    });

    it('should return "Imported Key" for imported seed account', () => {
      expect(getAccountTypeLabel(mockImportedSeedAccount)).toBe('Imported Key');
    });

    it('should return "Multisig" for multisig account', () => {
      expect(getAccountTypeLabel(mockMultisigAccount)).toBe('Multisig');
    });
  });

  describe('getAccountDerivationInfo', () => {
    it('should return HD info for HD account', () => {
      const info = getAccountDerivationInfo(mockHDAccount);
      expect(info).toBe('HD-derived account (can export xpub)');
    });

    it('should return imported info for imported account', () => {
      const info = getAccountDerivationInfo(mockImportedPrivateKeyAccount);
      expect(info).toBe('Imported account (cannot export xpub)');
    });

    it('should return multisig info for multisig account', () => {
      const info = getAccountDerivationInfo(mockMultisigAccount);
      expect(info).toBe('Multisig account (2-of-3)');
    });
  });

  describe('isNonHDWallet', () => {
    it('should return true for wallet with only imported accounts', () => {
      const accounts: WalletAccount[] = [
        mockImportedPrivateKeyAccount,
        mockImportedSeedAccount,
      ];

      expect(isNonHDWallet(accounts)).toBe(true);
    });

    it('should return false for wallet with HD accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockImportedPrivateKeyAccount,
      ];

      expect(isNonHDWallet(accounts)).toBe(false);
    });

    it('should return false for wallet with only HD accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockLegacyHDAccount,
      ];

      expect(isNonHDWallet(accounts)).toBe(false);
    });

    it('should return false for empty wallet', () => {
      expect(isNonHDWallet([])).toBe(false);
    });

    it('should return false for wallet with only multisig accounts', () => {
      const accounts: WalletAccount[] = [
        mockMultisigAccount,
      ];

      expect(isNonHDWallet(accounts)).toBe(false);
    });
  });

  describe('countAccounts', () => {
    it('should count all account types correctly', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockLegacyHDAccount,
        mockImportedPrivateKeyAccount,
        mockImportedSeedAccount,
        mockMultisigAccount,
      ];

      const counts = countAccounts(accounts);

      expect(counts.total).toBe(5);
      expect(counts.hd).toBe(2);
      expect(counts.imported).toBe(2);
      expect(counts.multisig).toBe(1);
    });

    it('should handle empty account list', () => {
      const counts = countAccounts([]);

      expect(counts.total).toBe(0);
      expect(counts.hd).toBe(0);
      expect(counts.imported).toBe(0);
      expect(counts.multisig).toBe(0);
    });

    it('should handle wallet with only one type', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockLegacyHDAccount,
      ];

      const counts = countAccounts(accounts);

      expect(counts.total).toBe(2);
      expect(counts.hd).toBe(2);
      expect(counts.imported).toBe(0);
      expect(counts.multisig).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle account with all properties', () => {
      const fullAccount: Account = {
        ...mockHDAccount,
        importType: 'hd',
      };

      expect(isSingleSigAccount(fullAccount)).toBe(true);
      expect(isHDDerivedAccount(fullAccount)).toBe(true);
      expect(canExportXpub(fullAccount)).toBe(true);
    });

    it('should handle multiple accounts with same type', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        { ...mockHDAccount, index: 10, name: 'HD 2' },
        { ...mockHDAccount, index: 11, name: 'HD 3' },
      ];

      const hdAccounts = getHDAccounts(accounts);
      expect(hdAccounts).toHaveLength(3);
    });

    it('should maintain type safety with grouped accounts', () => {
      const accounts: WalletAccount[] = [
        mockHDAccount,
        mockMultisigAccount,
      ];

      const grouped = groupAccounts(accounts);

      // Type checking - should not cause TypeScript errors
      const firstHD: Account = grouped.hdAccounts[0];
      const firstMultisig: MultisigAccount = grouped.multisigAccounts[0];

      expect(firstHD.accountType).toBe('single');
      expect(firstMultisig.accountType).toBe('multisig');
    });
  });
});
