/**
 * CryptoUtils Tests - Encrypt/Decrypt with CryptoKey
 *
 * Tests for new encryption methods that use pre-derived CryptoKey objects:
 * - encryptWithKey(): Encrypt with password-derived CryptoKey
 * - decryptWithKey(): Decrypt with password-derived CryptoKey
 *
 * These methods are used for encrypting imported keys/seeds with the
 * password-derived encryption key (stored in memory during wallet unlock).
 *
 * Security test coverage:
 * - Encryption with pre-derived keys
 * - Round-trip encryption/decryption
 * - Error handling
 * - IV uniqueness
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

describe('CryptoUtils - Encrypt/Decrypt with CryptoKey', () => {
  let derivedKey: CryptoKey;
  const testPassword = 'test-password-123';
  const testSalt = new Uint8Array(32);

  beforeAll(async () => {
    // Fill test salt with predictable values for consistent key derivation
    for (let i = 0; i < testSalt.length; i++) {
      testSalt[i] = i;
    }

    // Derive a CryptoKey for testing
    derivedKey = await CryptoUtils.deriveKey(testPassword, testSalt, PBKDF2_ITERATIONS);
  });

  describe('encryptWithKey()', () => {
    describe('Success Cases', () => {
      it('should encrypt plaintext with CryptoKey', async () => {
        const plaintext = 'Test message to encrypt';

        const result = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        expect(result).toBeDefined();
        expect(result.encryptedData).toBeDefined();
        expect(result.iv).toBeDefined();
        expect(typeof result.encryptedData).toBe('string');
        expect(typeof result.iv).toBe('string');
        expect(result.encryptedData.length).toBeGreaterThan(0);
        expect(result.iv.length).toBeGreaterThan(0);
      });

      it('should return empty salt (not used with pre-derived key)', async () => {
        const plaintext = 'Test message';

        const result = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        expect(result.salt).toBe('');
      });

      it('should produce different encrypted outputs due to random IV', async () => {
        const plaintext = 'Same message';

        const result1 = await CryptoUtils.encryptWithKey(plaintext, derivedKey);
        const result2 = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        // Different IVs
        expect(result1.iv).not.toBe(result2.iv);
        // Different encrypted data (due to different IV)
        expect(result1.encryptedData).not.toBe(result2.encryptedData);
      });

      it('should produce Base64-encoded output', async () => {
        const plaintext = 'Test';

        const result = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        // Base64 regex pattern
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;

        expect(base64Regex.test(result.encryptedData)).toBe(true);
        expect(base64Regex.test(result.iv)).toBe(true);
      });

      it('should encrypt long plaintexts', async () => {
        const plaintext = 'a'.repeat(10000); // 10KB

        const result = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        expect(result.encryptedData.length).toBeGreaterThan(0);
      });

      it('should encrypt BIP39 seed phrase', async () => {
        const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        const result = await CryptoUtils.encryptWithKey(seedPhrase, derivedKey);

        expect(result.encryptedData).toBeDefined();
        expect(result.iv).toBeDefined();
      });

      it('should encrypt WIF private key', async () => {
        const wif = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ';

        const result = await CryptoUtils.encryptWithKey(wif, derivedKey);

        expect(result.encryptedData).toBeDefined();
        expect(result.iv).toBeDefined();
      });

      it('should encrypt special characters and Unicode', async () => {
        const plaintext = 'Hello 世界! 🔐 Special chars: @#$%^&*()';

        const result = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        expect(result.encryptedData).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should throw when plaintext is empty', async () => {
        await expect(CryptoUtils.encryptWithKey('', derivedKey))
          .rejects.toThrow('Plaintext cannot be empty');
      });

      it('should throw when CryptoKey is null', async () => {
        await expect(CryptoUtils.encryptWithKey('plaintext', null as any))
          .rejects.toThrow('CryptoKey cannot be null');
      });

      it('should throw when CryptoKey is undefined', async () => {
        await expect(CryptoUtils.encryptWithKey('plaintext', undefined as any))
          .rejects.toThrow('CryptoKey cannot be null');
      });

      it('should throw descriptive error message', async () => {
        await expect(CryptoUtils.encryptWithKey('', derivedKey))
          .rejects.toThrow(/Encryption with key failed/);
      });
    });
  });

  describe('decryptWithKey()', () => {
    describe('Success Cases', () => {
      it('should decrypt data encrypted with encryptWithKey', async () => {
        const plaintext = 'Test message to encrypt and decrypt';

        const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);
        const decrypted = await CryptoUtils.decryptWithKey(
          encrypted.encryptedData,
          derivedKey,
          encrypted.iv
        );

        expect(decrypted).toBe(plaintext);
      });

      it('should decrypt BIP39 seed phrase', async () => {
        const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        const encrypted = await CryptoUtils.encryptWithKey(seedPhrase, derivedKey);
        const decrypted = await CryptoUtils.decryptWithKey(
          encrypted.encryptedData,
          derivedKey,
          encrypted.iv
        );

        expect(decrypted).toBe(seedPhrase);
      });

      it('should decrypt WIF private key', async () => {
        const wif = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ';

        const encrypted = await CryptoUtils.encryptWithKey(wif, derivedKey);
        const decrypted = await CryptoUtils.decryptWithKey(
          encrypted.encryptedData,
          derivedKey,
          encrypted.iv
        );

        expect(decrypted).toBe(wif);
      });

      it('should decrypt long plaintexts', async () => {
        const plaintext = 'b'.repeat(5000);

        const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);
        const decrypted = await CryptoUtils.decryptWithKey(
          encrypted.encryptedData,
          derivedKey,
          encrypted.iv
        );

        expect(decrypted).toBe(plaintext);
      });

      it('should decrypt special characters and Unicode', async () => {
        const plaintext = 'Hello 世界! 🔐 Special chars: @#$%^&*()';

        const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);
        const decrypted = await CryptoUtils.decryptWithKey(
          encrypted.encryptedData,
          derivedKey,
          encrypted.iv
        );

        expect(decrypted).toBe(plaintext);
      });

      it('should decrypt data encrypted with different IV', async () => {
        const plaintext1 = 'Message 1';
        const plaintext2 = 'Message 2';

        const encrypted1 = await CryptoUtils.encryptWithKey(plaintext1, derivedKey);
        const encrypted2 = await CryptoUtils.encryptWithKey(plaintext2, derivedKey);

        const decrypted1 = await CryptoUtils.decryptWithKey(
          encrypted1.encryptedData,
          derivedKey,
          encrypted1.iv
        );
        const decrypted2 = await CryptoUtils.decryptWithKey(
          encrypted2.encryptedData,
          derivedKey,
          encrypted2.iv
        );

        expect(decrypted1).toBe(plaintext1);
        expect(decrypted2).toBe(plaintext2);
      });
    });

    describe('Error Handling', () => {
      it('should throw when encrypted data is empty', async () => {
        const iv = 'dGVzdC1pdg=='; // Base64 encoded "test-iv"

        await expect(CryptoUtils.decryptWithKey('', derivedKey, iv))
          .rejects.toThrow('Encrypted data cannot be empty');
      });

      it('should throw when CryptoKey is null', async () => {
        await expect(CryptoUtils.decryptWithKey('encrypted', null as any, 'iv'))
          .rejects.toThrow('CryptoKey cannot be null');
      });

      it('should throw when IV is empty', async () => {
        await expect(CryptoUtils.decryptWithKey('encrypted', derivedKey, ''))
          .rejects.toThrow('IV cannot be empty');
      });

      it('should throw when encrypted data is corrupted', async () => {
        const plaintext = 'Test message';
        const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        // Corrupt the encrypted data
        const corrupted = encrypted.encryptedData.slice(0, -5) + 'XXXXX';

        await expect(CryptoUtils.decryptWithKey(corrupted, derivedKey, encrypted.iv))
          .rejects.toThrow();
      });

      it('should throw when IV is incorrect', async () => {
        const plaintext = 'Test message';
        const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        // Use wrong IV
        const wrongIV = 'dGVzdC1pdg==';

        await expect(CryptoUtils.decryptWithKey(encrypted.encryptedData, derivedKey, wrongIV))
          .rejects.toThrow();
      });

      it('should throw when wrong CryptoKey is used', async () => {
        const plaintext = 'Test message';
        const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

        // Derive different key
        const differentSalt = new Uint8Array(32);
        for (let i = 0; i < differentSalt.length; i++) {
          differentSalt[i] = 255 - i;
        }
        const wrongKey = await CryptoUtils.deriveKey(testPassword, differentSalt, PBKDF2_ITERATIONS);

        await expect(CryptoUtils.decryptWithKey(encrypted.encryptedData, wrongKey, encrypted.iv))
          .rejects.toThrow();
      });

      it('should throw descriptive error message', async () => {
        // Empty data triggers validation error
        await expect(CryptoUtils.decryptWithKey('', derivedKey, 'iv'))
          .rejects.toThrow('Encrypted data cannot be empty');
      });
    });
  });

  describe('Round-Trip Encryption', () => {
    it('should round-trip: plaintext -> encrypt -> decrypt -> plaintext', async () => {
      const originalPlaintext = 'Original message';

      const encrypted = await CryptoUtils.encryptWithKey(originalPlaintext, derivedKey);
      const decrypted = await CryptoUtils.decryptWithKey(
        encrypted.encryptedData,
        derivedKey,
        encrypted.iv
      );

      expect(decrypted).toBe(originalPlaintext);
    });

    it('should round-trip multiple times with same key', async () => {
      const messages = [
        'Message 1',
        'Message 2',
        'Message 3',
      ];

      for (const message of messages) {
        const encrypted = await CryptoUtils.encryptWithKey(message, derivedKey);
        const decrypted = await CryptoUtils.decryptWithKey(
          encrypted.encryptedData,
          derivedKey,
          encrypted.iv
        );

        expect(decrypted).toBe(message);
      }
    });

    it('should round-trip with different derived keys', async () => {
      const plaintext = 'Test message';

      // Derive key 1
      const salt1 = new Uint8Array(32);
      for (let i = 0; i < 32; i++) salt1[i] = i;
      const key1 = await CryptoUtils.deriveKey('password1', salt1);

      // Derive key 2
      const salt2 = new Uint8Array(32);
      for (let i = 0; i < 32; i++) salt2[i] = 255 - i;
      const key2 = await CryptoUtils.deriveKey('password2', salt2);

      // Encrypt with key1
      const encrypted1 = await CryptoUtils.encryptWithKey(plaintext, key1);
      const decrypted1 = await CryptoUtils.decryptWithKey(
        encrypted1.encryptedData,
        key1,
        encrypted1.iv
      );

      // Encrypt with key2
      const encrypted2 = await CryptoUtils.encryptWithKey(plaintext, key2);
      const decrypted2 = await CryptoUtils.decryptWithKey(
        encrypted2.encryptedData,
        key2,
        encrypted2.iv
      );

      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
    });
  });

  describe('Comparison with encrypt/decrypt', () => {
    it('should produce compatible encryption format', async () => {
      const plaintext = 'Test message';
      const password = 'test-password';

      // Encrypt with password-based method
      const passwordEncrypted = await CryptoUtils.encrypt(plaintext, password);

      // Encrypt with key-based method
      const salt = CryptoUtils.base64ToArrayBuffer(passwordEncrypted.salt);
      const key = await CryptoUtils.deriveKey(password, new Uint8Array(salt));
      const keyEncrypted = await CryptoUtils.encryptWithKey(plaintext, key);

      // Both should be decryptable
      const passwordDecrypted = await CryptoUtils.decrypt(
        passwordEncrypted.encryptedData,
        password,
        passwordEncrypted.salt,
        passwordEncrypted.iv
      );

      const keyDecrypted = await CryptoUtils.decryptWithKey(
        keyEncrypted.encryptedData,
        key,
        keyEncrypted.iv
      );

      expect(passwordDecrypted).toBe(plaintext);
      expect(keyDecrypted).toBe(plaintext);
    });

    it('should allow cross-decryption if same key is used', async () => {
      const plaintext = 'Test message';
      const password = 'test-password';

      // Encrypt with password method
      const encrypted = await CryptoUtils.encrypt(plaintext, password);

      // Derive same key
      const salt = CryptoUtils.base64ToArrayBuffer(encrypted.salt);
      const key = await CryptoUtils.deriveKey(password, new Uint8Array(salt));

      // Decrypt with key method
      const decrypted = await CryptoUtils.decryptWithKey(
        encrypted.encryptedData,
        key,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Integration with deriveKey', () => {
    it('should use derived CryptoKey correctly', async () => {
      const plaintext = 'Test message';
      const password = 'test-password';
      const salt = new Uint8Array(32);
      for (let i = 0; i < 32; i++) salt[i] = i;

      // Derive key
      const key = await CryptoUtils.deriveKey(password, salt);

      // Encrypt with derived key
      const encrypted = await CryptoUtils.encryptWithKey(plaintext, key);

      // Decrypt with same derived key
      const decrypted = await CryptoUtils.decryptWithKey(
        encrypted.encryptedData,
        key,
        encrypted.iv
      );

      expect(decrypted).toBe(plaintext);
    });

    it('should work with keys derived from different passwords', async () => {
      const plaintext = 'Test message';
      const salt = new Uint8Array(32);
      for (let i = 0; i < 32; i++) salt[i] = i;

      const key1 = await CryptoUtils.deriveKey('password1', salt);
      const key2 = await CryptoUtils.deriveKey('password2', salt);

      const encrypted1 = await CryptoUtils.encryptWithKey(plaintext, key1);
      const encrypted2 = await CryptoUtils.encryptWithKey(plaintext, key2);

      // Can decrypt with correct key
      const decrypted1 = await CryptoUtils.decryptWithKey(
        encrypted1.encryptedData,
        key1,
        encrypted1.iv
      );

      // Cannot decrypt with wrong key
      await expect(CryptoUtils.decryptWithKey(
        encrypted1.encryptedData,
        key2,
        encrypted1.iv
      )).rejects.toThrow();

      expect(decrypted1).toBe(plaintext);
    });
  });

  describe('Security Properties', () => {
    it('should produce different ciphertext for same plaintext (IV randomness)', async () => {
      const plaintext = 'Same message';

      const encrypted1 = await CryptoUtils.encryptWithKey(plaintext, derivedKey);
      const encrypted2 = await CryptoUtils.encryptWithKey(plaintext, derivedKey);
      const encrypted3 = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

      // All IVs should be different
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.iv).not.toBe(encrypted3.iv);
      expect(encrypted2.iv).not.toBe(encrypted3.iv);

      // All ciphertexts should be different
      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.encryptedData).not.toBe(encrypted3.encryptedData);
      expect(encrypted2.encryptedData).not.toBe(encrypted3.encryptedData);
    });

    it('should not allow decryption without correct IV', async () => {
      const plaintext = 'Test message';

      const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

      // Create different IV
      const wrongIV = CryptoUtils['arrayBufferToBase64'](new Uint8Array(12).buffer);

      await expect(CryptoUtils.decryptWithKey(
        encrypted.encryptedData,
        derivedKey,
        wrongIV
      )).rejects.toThrow();
    });

    it('should provide authenticated encryption (tamper detection)', async () => {
      const plaintext = 'Test message';

      const encrypted = await CryptoUtils.encryptWithKey(plaintext, derivedKey);

      // Tamper with encrypted data
      const encryptedBuffer = CryptoUtils.base64ToArrayBuffer(encrypted.encryptedData);
      const tamperedArray = new Uint8Array(encryptedBuffer);
      tamperedArray[0] ^= 0xFF; // Flip bits
      const tampered = CryptoUtils['arrayBufferToBase64'](tamperedArray.buffer);

      // Decryption should fail (authentication tag mismatch)
      await expect(CryptoUtils.decryptWithKey(tampered, derivedKey, encrypted.iv))
        .rejects.toThrow();
    });
  });
});
