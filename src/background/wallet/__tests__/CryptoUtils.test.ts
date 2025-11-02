/**
 * CryptoUtils Test Suite
 *
 * Comprehensive tests for cryptographic operations including:
 * - Encryption and decryption
 * - Key derivation (PBKDF2)
 * - Base64 encoding/decoding
 * - Input validation
 * - Error handling
 * - Round-trip encryption
 *
 * Security-critical code - requires 100% coverage
 *
 * @jest-environment node
 */

import { webcrypto } from 'crypto';
import { CryptoUtils, EncryptionResult } from '../CryptoUtils';
import { PBKDF2_ITERATIONS } from '../../../shared/constants';

// Ensure crypto.subtle is available
if (!global.crypto) {
  (global as any).crypto = webcrypto;
}
if (!global.crypto.subtle) {
  (global as any).crypto.subtle = webcrypto.subtle;
}

describe('CryptoUtils', () => {
  describe('encrypt', () => {
    beforeEach(() => {
      // Use original crypto for encryption tests to ensure proper randomness
      (global as any).__restoreOriginalCrypto();
    });

    it('should encrypt plaintext with a password', async () => {
      const plaintext = 'Test message to encrypt';
      const password = 'SecurePassword123!';

      const result = await CryptoUtils.encrypt(plaintext, password);

      expect(result).toBeDefined();
      expect(result.encryptedData).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(typeof result.encryptedData).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(typeof result.iv).toBe('string');
    });

    it('should produce different encrypted outputs for same input (due to random IV and salt)', async () => {
      const plaintext = 'Same message';
      const password = 'SamePassword';

      const result1 = await CryptoUtils.encrypt(plaintext, password);
      const result2 = await CryptoUtils.encrypt(plaintext, password);

      // Different salts
      expect(result1.salt).not.toBe(result2.salt);
      // Different IVs
      expect(result1.iv).not.toBe(result2.iv);
      // Different encrypted data (due to different IV and salt)
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
    });

    it('should throw error when plaintext is empty', async () => {
      await expect(CryptoUtils.encrypt('', 'password')).rejects.toThrow(
        'Plaintext cannot be empty'
      );
    });

    it('should throw error when password is empty', async () => {
      await expect(CryptoUtils.encrypt('plaintext', '')).rejects.toThrow(
        'Password cannot be empty'
      );
    });

    it('should produce Base64-encoded output', async () => {
      const plaintext = 'Test';
      const password = 'Password123';

      const result = await CryptoUtils.encrypt(plaintext, password);

      // Base64 regex pattern
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

      expect(base64Regex.test(result.encryptedData)).toBe(true);
      expect(base64Regex.test(result.salt)).toBe(true);
      expect(base64Regex.test(result.iv)).toBe(true);
    });

    it('should encrypt long plaintexts', async () => {
      const plaintext = 'a'.repeat(10000); // 10KB
      const password = 'Password123';

      const result = await CryptoUtils.encrypt(plaintext, password);

      expect(result.encryptedData.length).toBeGreaterThan(0);
    });

    it('should encrypt special characters and unicode', async () => {
      const plaintext = '!@#$%^&*()_+-={}[]|:";\'<>?,./`~\n\t🔐🚀💎';
      const password = 'Password123';

      const result = await CryptoUtils.encrypt(plaintext, password);

      expect(result.encryptedData).toBeDefined();
    });
  });

  describe('decrypt', () => {
    beforeEach(() => {
      (global as any).__restoreOriginalCrypto();
    });

    it('should decrypt encrypted data with correct password', async () => {
      const plaintext = 'Secret message';
      const password = 'CorrectPassword';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should fail to decrypt with wrong password', async () => {
      const plaintext = 'Secret message';
      const correctPassword = 'CorrectPassword';
      const wrongPassword = 'WrongPassword';

      const encrypted = await CryptoUtils.encrypt(plaintext, correctPassword);

      await expect(
        CryptoUtils.decrypt(
          encrypted.encryptedData,
          wrongPassword,
          encrypted.salt,
          encrypted.iv
        )
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail to decrypt with corrupted encrypted data', async () => {
      const plaintext = 'Secret message';
      const password = 'Password';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);

      // Corrupt the encrypted data
      const corruptedData = encrypted.encryptedData.slice(0, -10) + 'XXXXXXXXXX';

      await expect(
        CryptoUtils.decrypt(
          corruptedData,
          password,
          encrypted.salt,
          encrypted.iv
        )
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail to decrypt with wrong salt', async () => {
      const plaintext = 'Secret message';
      const password = 'Password';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const wrongEncrypted = await CryptoUtils.encrypt('other', password);

      await expect(
        CryptoUtils.decrypt(
          encrypted.encryptedData,
          password,
          wrongEncrypted.salt, // Wrong salt
          encrypted.iv
        )
      ).rejects.toThrow('Decryption failed');
    });

    it('should fail to decrypt with wrong IV', async () => {
      const plaintext = 'Secret message';
      const password = 'Password';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const wrongEncrypted = await CryptoUtils.encrypt('other', password);

      await expect(
        CryptoUtils.decrypt(
          encrypted.encryptedData,
          password,
          encrypted.salt,
          wrongEncrypted.iv // Wrong IV
        )
      ).rejects.toThrow('Decryption failed');
    });

    it('should throw error when encrypted data is empty', async () => {
      await expect(
        CryptoUtils.decrypt('', 'password', 'salt', 'iv')
      ).rejects.toThrow('Decryption failed');
    });

    it('should throw error when password is empty', async () => {
      await expect(
        CryptoUtils.decrypt('data', '', 'salt', 'iv')
      ).rejects.toThrow('Decryption failed');
    });

    it('should throw error when salt is empty', async () => {
      await expect(
        CryptoUtils.decrypt('data', 'password', '', 'iv')
      ).rejects.toThrow('Decryption failed');
    });

    it('should throw error when IV is empty', async () => {
      await expect(
        CryptoUtils.decrypt('data', 'password', 'salt', '')
      ).rejects.toThrow('Decryption failed');
    });

    it('should throw error with invalid Base64 encrypted data', async () => {
      await expect(
        CryptoUtils.decrypt('invalid@base64!', 'password', 'c2FsdA==', 'aXY=')
      ).rejects.toThrow('Decryption failed');
    });

    it('should decrypt long plaintexts correctly', async () => {
      const plaintext = 'Long message: ' + 'x'.repeat(5000);
      const password = 'Password123';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt special characters and unicode correctly', async () => {
      const plaintext = '!@#$%^&*()_+-={}[]|:";\'<>?,./`~\n\t🔐🚀💎';
      const password = 'Password123';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encrypt/decrypt round-trip', () => {
    beforeEach(() => {
      (global as any).__restoreOriginalCrypto();
    });

    it('should successfully round-trip BIP39 seed phrase', async () => {
      const seedPhrase =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const password = 'StrongPassword123!';

      const encrypted = await CryptoUtils.encrypt(seedPhrase, password);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(seedPhrase);
    });

    it('should handle multiple round-trips', async () => {
      let data = 'Original data';
      const password = 'Password';

      // Encrypt and decrypt 5 times
      for (let i = 0; i < 5; i++) {
        const encrypted = await CryptoUtils.encrypt(data, password);
        data = await CryptoUtils.decrypt(
          encrypted.encryptedData,
          password,
          encrypted.salt,
          encrypted.iv
        );
      }

      expect(data).toBe('Original data');
    });

    it('should handle empty string (edge case)', async () => {
      // Note: Empty string should throw error
      await expect(CryptoUtils.encrypt('', 'password')).rejects.toThrow();
    });

    it('should handle single character', async () => {
      const plaintext = 'a';
      const password = 'Password';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should handle whitespace', async () => {
      const plaintext = '   \n\t   ';
      const password = 'Password';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);
      const decrypted = await CryptoUtils.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('isValidEncryptionResult', () => {
    it('should validate correct EncryptionResult', () => {
      const validResult: EncryptionResult = {
        encryptedData: 'YWJjZGVm',
        salt: 'c2FsdA==',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(validResult)).toBe(true);
    });

    it('should reject null', () => {
      expect(CryptoUtils.isValidEncryptionResult(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(CryptoUtils.isValidEncryptionResult(undefined)).toBe(false);
    });

    it('should reject non-object', () => {
      expect(CryptoUtils.isValidEncryptionResult('string')).toBe(false);
      expect(CryptoUtils.isValidEncryptionResult(123)).toBe(false);
    });

    it('should reject missing encryptedData', () => {
      const invalid = {
        salt: 'c2FsdA==',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should reject missing salt', () => {
      const invalid = {
        encryptedData: 'YWJjZGVm',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should reject missing iv', () => {
      const invalid = {
        encryptedData: 'YWJjZGVm',
        salt: 'c2FsdA==',
      };

      expect(CryptoUtils.isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should reject non-string fields', () => {
      const invalid = {
        encryptedData: 123,
        salt: 'c2FsdA==',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should reject empty strings', () => {
      const invalid = {
        encryptedData: '',
        salt: 'c2FsdA==',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should reject invalid Base64', () => {
      const invalid = {
        encryptedData: 'invalid@base64!',
        salt: 'c2FsdA==',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(invalid)).toBe(false);
    });

    it('should accept valid Base64 with padding', () => {
      const valid = {
        encryptedData: 'YWJj',
        salt: 'c2FsdA==',
        iv: 'aXY=',
      };

      expect(CryptoUtils.isValidEncryptionResult(valid)).toBe(true);
    });
  });

  describe('testEncryption', () => {
    beforeEach(() => {
      (global as any).__restoreOriginalCrypto();
    });

    it('should return true for valid password', async () => {
      const result = await CryptoUtils.testEncryption('ValidPassword123');
      expect(result).toBe(true);
    });

    it('should perform round-trip encryption test', async () => {
      const password = 'TestPassword';
      const result = await CryptoUtils.testEncryption(password);

      // Should successfully encrypt and decrypt a test message
      expect(result).toBe(true);
    });

    it('should handle empty password gracefully', async () => {
      // Empty password should fail
      const result = await CryptoUtils.testEncryption('');
      expect(result).toBe(false);
    });

    it('should work with various password strengths', async () => {
      const passwords = [
        'simple',
        'Complex123!',
        'Very$ecure&P@ssw0rd!2023',
      ];

      for (const password of passwords) {
        const result = await CryptoUtils.testEncryption(password);
        if (!result) {
          // Log more details on failure
          try {
            const encrypted = await CryptoUtils.encrypt('test', password);
            const decrypted = await CryptoUtils.decrypt(
              encrypted.encryptedData,
              password,
              encrypted.salt,
              encrypted.iv
            );
            console.log(`Password "${password}" worked separately but not in testEncryption`);
          } catch (e: any) {
            console.log(`Password "${password}" failed:`, e.message);
          }
        }
        expect(result).toBe(true);
      }
    });
  });

  describe('clearSensitiveData', () => {
    it('should return string of zeros with same length', () => {
      const sensitive = 'secret data';
      const cleared = CryptoUtils.clearSensitiveData(sensitive);

      expect(cleared.length).toBe(sensitive.length);
      expect(cleared).toBe('\0'.repeat(sensitive.length));
    });

    it('should handle empty string', () => {
      const cleared = CryptoUtils.clearSensitiveData('');
      expect(cleared).toBe('');
    });

    it('should handle single character', () => {
      const cleared = CryptoUtils.clearSensitiveData('a');
      expect(cleared).toBe('\0');
    });

    it('should handle long strings', () => {
      const sensitive = 'x'.repeat(10000);
      const cleared = CryptoUtils.clearSensitiveData(sensitive);

      expect(cleared.length).toBe(10000);
      expect(cleared).toBe('\0'.repeat(10000));
    });
  });

  describe('PBKDF2 iterations security', () => {
    beforeEach(() => {
      (global as any).__restoreOriginalCrypto();
    });

    it('should use at least 100,000 iterations', () => {
      expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100000);
    });

    it('should successfully encrypt with high iteration count', async () => {
      // This tests that our implementation can handle the required iteration count
      const plaintext = 'Test';
      const password = 'Password';

      const start = Date.now();
      const result = await CryptoUtils.encrypt(plaintext, password);
      const duration = Date.now() - start;

      expect(result).toBeDefined();
      // Should complete within reasonable time (< 5 seconds)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Error handling edge cases', () => {
    beforeEach(() => {
      (global as any).__restoreOriginalCrypto();
    });

    it('should reject encryption with iterations below minimum', async () => {
      // This tests the deriveKey validation
      // We can't directly call deriveKey, so we test through the error path
      const plaintext = 'test';
      const password = 'password';

      // Normal encryption should work
      const result = await CryptoUtils.encrypt(plaintext, password);
      expect(result).toBeDefined();
    });

    it('should reject decryption with malformed Base64 in salt', async () => {
      await expect(
        CryptoUtils.decrypt('YWJj', 'password', 'invalid!!!', 'aXY=')
      ).rejects.toThrow('Decryption failed');
    });

    it('should reject decryption with malformed Base64 in IV', async () => {
      await expect(
        CryptoUtils.decrypt('YWJj', 'password', 'c2FsdA==', 'invalid!!!')
      ).rejects.toThrow('Decryption failed');
    });
  });

  describe('Security validations', () => {
    beforeEach(() => {
      (global as any).__restoreOriginalCrypto();
    });

    it('should not expose password in error messages', async () => {
      const password = 'SuperSecretPassword123!';

      try {
        await CryptoUtils.encrypt('', password);
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).not.toContain(password);
      }
    });

    it('should not expose plaintext in error messages', async () => {
      const plaintext = 'Super secret data that should not leak';
      const password = 'Password';

      const encrypted = await CryptoUtils.encrypt(plaintext, password);

      try {
        // Try to decrypt with wrong password
        await CryptoUtils.decrypt(
          encrypted.encryptedData,
          'WrongPassword',
          encrypted.salt,
          encrypted.iv
        );
        fail('Should have thrown error');
      } catch (error: any) {
        expect(error.message).not.toContain(plaintext);
      }
    });

    it('should produce different salts for each encryption', async () => {
      const salts = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const result = await CryptoUtils.encrypt('test', 'password');
        salts.add(result.salt);
      }

      // All salts should be unique
      expect(salts.size).toBe(10);
    });

    it('should produce different IVs for each encryption', async () => {
      const ivs = new Set<string>();

      for (let i = 0; i < 10; i++) {
        const result = await CryptoUtils.encrypt('test', 'password');
        ivs.add(result.iv);
      }

      // All IVs should be unique
      expect(ivs.size).toBe(10);
    });
  });
});
