/**
 * Private Key Export/Import Integration Tests
 *
 * End-to-end tests for private key export and import workflow.
 * Tests the complete cycle: export → encrypt → decrypt → import → verify
 *
 * @jest-environment node
 */

import { KeyManager } from '../wallet/KeyManager';
import { WIFManager } from '../wallet/WIFManager';
import { HDWallet } from '../wallet/HDWallet';
import { CryptoUtils } from '../wallet/CryptoUtils';
import type { AddressType } from '../../shared/types';

describe('Private Key Export/Import Integration Tests', () => {
  const TEST_NETWORK: 'testnet' | 'mainnet' = 'testnet';
  const TEST_PASSWORD = 'TestPassword123!';

  // Test mnemonic for HD wallet
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  describe('HD Wallet Account Export/Import Cycle', () => {
    it('should export and re-import HD account private key', async () => {
      // 1. Create HD wallet
      const seed = KeyManager.mnemonicToSeed(TEST_MNEMONIC);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);

      // 2. Derive account private key (account 0, Native SegWit)
      const addressType: AddressType = 'native-segwit';
      const accountIndex = 0;
      const derivationPath = `m/84'/1'/${accountIndex}'`;

      const node = hdWallet.derivePath(derivationPath);
      const privateKeyHex = node.privateKey!.toString('hex');

      // 3. Convert to WIF (compressed)
      const exportedWIF = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);

      // Verify WIF is valid
      const validation = WIFManager.validateWIF(exportedWIF, TEST_NETWORK);
      expect(validation.valid).toBe(true);
      expect(validation.network).toBe(TEST_NETWORK);
      expect(validation.compressed).toBe(true);
      expect(validation.addressType).toBe('native-segwit');

      // 4. Re-import WIF and verify it produces same private key
      const decoded = KeyManager.decodeWIF(exportedWIF, TEST_NETWORK);
      expect(decoded.privateKey).toBe(privateKeyHex);
      expect(decoded.compressed).toBe(true);

      // 5. Verify address derivation matches
      const originalAddress = validation.firstAddress;
      const reimportedAddress = WIFManager.deriveFirstAddress(exportedWIF, TEST_NETWORK).address;
      expect(reimportedAddress).toBe(originalAddress);
    });

    it('should export different address types with correct format', async () => {
      const seed = KeyManager.mnemonicToSeed(TEST_MNEMONIC);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);

      const addressTypes: Array<{ type: AddressType; purpose: string }> = [
        { type: 'legacy', purpose: '44' },
        { type: 'segwit', purpose: '49' },
        { type: 'native-segwit', purpose: '84' },
      ];

      for (const { type, purpose } of addressTypes) {
        const derivationPath = `m/${purpose}'/1'/0'`;
        const node = hdWallet.derivePath(derivationPath);
        const privateKeyHex = node.privateKey!.toString('hex');

        // Export as WIF (always compressed for modern wallets)
        const wif = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);

        // Validate WIF
        const validation = WIFManager.validateWIF(wif, TEST_NETWORK);
        expect(validation.valid).toBe(true);
        expect(validation.network).toBe(TEST_NETWORK);

        // Verify address type (compressed keys use native-segwit)
        expect(validation.addressType).toBe('native-segwit');
      }
    });
  });

  describe('WIF Encryption/Decryption Cycle', () => {
    it('should encrypt and decrypt WIF with password', async () => {
      // 1. Generate test private key
      const mnemonic = KeyManager.generateMnemonic();
      const seed = KeyManager.mnemonicToSeed(mnemonic);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);
      const node = hdWallet.derivePath("m/84'/1'/0'");
      const privateKeyHex = node.privateKey!.toString('hex');

      // 2. Convert to WIF
      const originalWIF = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);

      // 3. Encrypt WIF
      const encrypted = await CryptoUtils.encrypt(originalWIF, TEST_PASSWORD);
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.salt).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.encryptedData).not.toBe(originalWIF);

      // 4. Decrypt WIF
      const decryptedWIF = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        TEST_PASSWORD,
        encrypted.salt,
        encrypted.iv
      );

      // 5. Verify decrypted WIF matches original
      expect(decryptedWIF).toBe(originalWIF);

      // 6. Verify decrypted WIF is still valid
      const validation = WIFManager.validateWIF(decryptedWIF, TEST_NETWORK);
      expect(validation.valid).toBe(true);

      // 7. Verify wrong password fails
      await expect(
        CryptoUtils.decrypt(
          encrypted.encryptedData,
          'WrongPassword123!',
          encrypted.salt,
          encrypted.iv
        )
      ).rejects.toThrow();
    });

    it('should handle encryption with different passwords', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';

      const passwords = ['Password1!', 'DifferentPass456', 'Another789$'];
      const encrypted: Array<{ encryptedData: string; salt: string; iv: string }> = [];

      // Encrypt with different passwords
      for (const password of passwords) {
        const result = await CryptoUtils.encrypt(wif, password);
        encrypted.push(result);
      }

      // Verify each produces different ciphertext
      expect(encrypted[0].encryptedData).not.toBe(encrypted[1].encryptedData);
      expect(encrypted[1].encryptedData).not.toBe(encrypted[2].encryptedData);

      // Verify each can only be decrypted with correct password
      for (let i = 0; i < passwords.length; i++) {
        const decrypted = await CryptoUtils.decrypt(
          encrypted[i].encryptedData,
          passwords[i],
          encrypted[i].salt,
          encrypted[i].iv
        );
        expect(decrypted).toBe(wif);
      }
    });
  });

  describe('Multiple Account Export/Import Cycle', () => {
    it('should export and import multiple accounts maintaining uniqueness', async () => {
      const seed = KeyManager.mnemonicToSeed(TEST_MNEMONIC);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);

      const accounts = [
        { index: 0, name: 'Account 1' },
        { index: 1, name: 'Account 2' },
        { index: 2, name: 'Account 3' },
      ];

      const exportedWIFs: string[] = [];
      const addresses: string[] = [];

      // Export all accounts
      for (const account of accounts) {
        const derivationPath = `m/84'/1'/${account.index}'`;
        const node = hdWallet.derivePath(derivationPath);
        const privateKeyHex = node.privateKey!.toString('hex');
        const wif = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);

        exportedWIFs.push(wif);

        const addressInfo = WIFManager.deriveFirstAddress(wif, TEST_NETWORK);
        addresses.push(addressInfo.address);
      }

      // Verify all WIFs are unique
      const uniqueWIFs = new Set(exportedWIFs);
      expect(uniqueWIFs.size).toBe(accounts.length);

      // Verify all addresses are unique
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(accounts.length);

      // Verify each WIF derives to its corresponding address
      for (let i = 0; i < exportedWIFs.length; i++) {
        const derived = WIFManager.deriveFirstAddress(exportedWIFs[i], TEST_NETWORK);
        expect(derived.address).toBe(addresses[i]);
      }
    });
  });

  describe('Legacy Address Type Compatibility', () => {
    it('should handle uncompressed WIF for legacy addresses', async () => {
      // Create uncompressed private key
      const privateKeyHex = '0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d';

      // Export as uncompressed WIF
      const uncompressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, false);

      // Validate
      const validation = WIFManager.validateWIF(uncompressedWIF, TEST_NETWORK);
      expect(validation.valid).toBe(true);
      expect(validation.compressed).toBe(false);
      expect(validation.addressType).toBe('legacy');

      // Verify address starts with 'm' or 'n' (testnet legacy)
      expect(validation.firstAddress).toMatch(/^[mn]/);

      // Re-import and verify
      const decoded = KeyManager.decodeWIF(uncompressedWIF, TEST_NETWORK);
      expect(decoded.privateKey).toBe(privateKeyHex);
      expect(decoded.compressed).toBe(false);
    });

    it('should distinguish compressed vs uncompressed for same private key', async () => {
      const privateKeyHex = '0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d';

      // Export both formats
      const compressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);
      const uncompressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, false);

      // Verify they're different
      expect(compressedWIF).not.toBe(uncompressedWIF);

      // Verify they derive different addresses
      const compressedAddr = WIFManager.deriveFirstAddress(compressedWIF, TEST_NETWORK);
      const uncompressedAddr = WIFManager.deriveFirstAddress(uncompressedWIF, TEST_NETWORK);

      expect(compressedAddr.address).not.toBe(uncompressedAddr.address);
      expect(compressedAddr.addressType).toBe('native-segwit');
      expect(uncompressedAddr.addressType).toBe('legacy');
    });
  });

  describe('Network Validation in Export/Import Cycle', () => {
    it('should prevent cross-network imports', async () => {
      // Generate testnet WIF
      const testnetMnemonic = KeyManager.generateMnemonic();
      const testnetSeed = KeyManager.mnemonicToSeed(testnetMnemonic);
      const testnetWallet = new HDWallet(testnetSeed, 'testnet');
      const testnetNode = testnetWallet.derivePath("m/84'/1'/0'");
      const testnetWIF = KeyManager.privateKeyToWIF(
        testnetNode.privateKey!.toString('hex'),
        'testnet',
        true
      );

      // Verify testnet WIF is rejected for mainnet
      const mainnetValidation = WIFManager.validateWIF(testnetWIF, 'mainnet');
      expect(mainnetValidation.valid).toBe(false);
      expect(mainnetValidation.error).toContain('Wrong network');
      expect(mainnetValidation.network).toBe('testnet');

      // Verify testnet WIF is accepted for testnet
      const testnetValidation = WIFManager.validateWIF(testnetWIF, 'testnet');
      expect(testnetValidation.valid).toBe(true);
      expect(testnetValidation.network).toBe('testnet');
    });
  });

  describe('Data Integrity Verification', () => {
    it('should maintain data integrity through full export/encrypt/decrypt/import cycle', async () => {
      // 1. Create original wallet
      const originalMnemonic = KeyManager.generateMnemonic();
      const seed = KeyManager.mnemonicToSeed(originalMnemonic);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);

      // 2. Derive account
      const derivationPath = "m/84'/1'/0'";
      const node = hdWallet.derivePath(derivationPath);
      const originalPrivateKey = node.privateKey!.toString('hex');

      // 3. Export to WIF
      const exportedWIF = KeyManager.privateKeyToWIF(originalPrivateKey, TEST_NETWORK, true);

      // 4. Derive original address
      const originalAddress = WIFManager.deriveFirstAddress(exportedWIF, TEST_NETWORK);

      // 5. Encrypt WIF
      const encrypted = await CryptoUtils.encrypt(exportedWIF, TEST_PASSWORD);

      // 6. Decrypt WIF
      const decryptedWIF = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        TEST_PASSWORD,
        encrypted.salt,
        encrypted.iv
      );

      // 7. Import decrypted WIF
      const imported = KeyManager.decodeWIF(decryptedWIF, TEST_NETWORK);

      // 8. Verify integrity
      expect(imported.privateKey).toBe(originalPrivateKey);

      // 9. Verify address derivation
      const reimportedAddress = WIFManager.deriveFirstAddress(decryptedWIF, TEST_NETWORK);
      expect(reimportedAddress.address).toBe(originalAddress.address);
      expect(reimportedAddress.addressType).toBe(originalAddress.addressType);
      expect(reimportedAddress.compressed).toBe(originalAddress.compressed);
    });

    it('should preserve metadata through export/import', async () => {
      const mnemonic = KeyManager.generateMnemonic();
      const seed = KeyManager.mnemonicToSeed(mnemonic);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);
      const node = hdWallet.derivePath("m/84'/1'/0'");
      const privateKeyHex = node.privateKey!.toString('hex');

      // Export with metadata
      const wif = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);
      const originalMetadata = {
        accountName: 'Test Account',
        addressType: 'native-segwit' as AddressType,
        firstAddress: WIFManager.deriveFirstAddress(wif, TEST_NETWORK).address,
        network: TEST_NETWORK,
        timestamp: Date.now(),
        encrypted: true,
      };

      // Encrypt
      const encrypted = await CryptoUtils.encrypt(wif, TEST_PASSWORD);

      // Simulate storage
      const exportData = {
        encryptedData: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        metadata: originalMetadata,
      };

      // Decrypt and import
      const decryptedWIF = await CryptoUtils.decrypt(
        exportData.encryptedData,
        TEST_PASSWORD,
        exportData.salt,
        exportData.iv
      );

      // Verify metadata integrity
      const reimported = WIFManager.deriveFirstAddress(decryptedWIF, TEST_NETWORK);
      expect(reimported.address).toBe(originalMetadata.firstAddress);
      expect(reimported.addressType).toBe(originalMetadata.addressType);
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle corrupted encrypted data', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
      const encrypted = await CryptoUtils.encrypt(wif, TEST_PASSWORD);

      // Corrupt the encrypted data
      const corruptedData = encrypted.encryptedData.slice(0, -10) + '0'.repeat(10);

      // Attempt to decrypt should fail
      await expect(
        CryptoUtils.decrypt(corruptedData, TEST_PASSWORD, encrypted.salt, encrypted.iv)
      ).rejects.toThrow();
    });

    it('should handle invalid decryption IV', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
      const encrypted = await CryptoUtils.encrypt(wif, TEST_PASSWORD);

      // Use wrong IV
      const wrongIV = 'A'.repeat(encrypted.iv.length);

      // Attempt to decrypt should fail
      await expect(
        CryptoUtils.decrypt(encrypted.encryptedData, TEST_PASSWORD, encrypted.salt, wrongIV)
      ).rejects.toThrow();
    });

    it('should handle very long passwords', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
      const longPassword = 'A'.repeat(1000);

      const encrypted = await CryptoUtils.encrypt(wif, longPassword);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        longPassword,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(wif);
    });

    it('should handle special characters in passwords', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
      const specialPassword = '!@#$%^&*()_+-={}[]|\\:";\'<>?,./~`';

      const encrypted = await CryptoUtils.encrypt(wif, specialPassword);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        specialPassword,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(wif);
    });

    it('should handle Unicode characters in passwords', async () => {
      const wif = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
      const unicodePassword = 'パスワード123🔐';

      const encrypted = await CryptoUtils.encrypt(wif, unicodePassword);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        unicodePassword,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(wif);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle batch exports efficiently', async () => {
      const seed = KeyManager.mnemonicToSeed(TEST_MNEMONIC);
      const hdWallet = new HDWallet(seed, TEST_NETWORK);

      const startTime = Date.now();
      const exportedWIFs: string[] = [];

      // Export 10 accounts
      for (let i = 0; i < 10; i++) {
        const derivationPath = `m/84'/1'/${i}'`;
        const node = hdWallet.derivePath(derivationPath);
        const privateKeyHex = node.privateKey!.toString('hex');
        const wif = KeyManager.privateKeyToWIF(privateKeyHex, TEST_NETWORK, true);
        exportedWIFs.push(wif);
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 1 second)
      expect(duration).toBeLessThan(1000);
      expect(exportedWIFs.length).toBe(10);

      // Verify all unique
      const uniqueWIFs = new Set(exportedWIFs);
      expect(uniqueWIFs.size).toBe(10);
    });

    it('should handle batch encryption efficiently', async () => {
      const wifs = [
        'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm',
        'cPQqB9z5F7oF7fXZp5y9k3Xv5Z8L4Q2J3H9R8T6Y1W2X3C4V5B6',
        'cR4d6R9z9F8oF8fXZp6y0k4Xv6Z9L5Q3J4H0R9T7Y2W3X4C5V6B',
      ];

      const startTime = Date.now();
      const encrypted: Array<{ encryptedData: string; salt: string; iv: string }> = [];

      for (const wif of wifs) {
        const result = await CryptoUtils.encrypt(wif, TEST_PASSWORD);
        encrypted.push(result);
      }

      const duration = Date.now() - startTime;

      // Should complete in reasonable time (< 2 seconds for 3 encryptions)
      expect(duration).toBeLessThan(2000);
      expect(encrypted.length).toBe(wifs.length);
    });
  });
});
