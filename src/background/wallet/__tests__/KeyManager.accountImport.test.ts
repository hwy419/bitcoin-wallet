/**
 * KeyManager Tests - WIF Import Operations
 *
 * Tests for WIF (Wallet Import Format) private key operations:
 * - validateWIF(): WIF format validation for testnet/mainnet
 * - decodeWIF(): Extract private key and metadata from WIF
 * - privateKeyToWIF(): Convert hex private key to WIF format
 *
 * Security test coverage:
 * - Network validation (testnet vs mainnet)
 * - WIF format validation
 * - Compressed vs uncompressed key handling
 * - Error handling without key leakage
 *
 * @jest-environment node
 */

import { KeyManager } from '../KeyManager';
import * as bitcoin from 'bitcoinjs-lib';

describe('KeyManager - WIF Import Operations', () => {
  // Test vectors for WIF validation
  // These are valid WIF keys generated from known private key:
  // ef235aacf90d9f4aadd8c92e4b2562e1d9eb97f0df9ba3b508258739cb013db2
  const TEST_VECTORS = {
    testnet: {
      // Compressed testnet WIF (starts with 'c')
      compressed: 'cVbZ8ovhye9AoAHFsqobCf7LxbXDAECy9Kb8TZdfsDYMZGBUyCnm',
      // Uncompressed testnet WIF (starts with '9')
      uncompressed: '93QEdCzUrzMRsnbx2YuF6MsNjxQA6iWSrv9e2wX4NM4UmYzUsLn',
    },
    mainnet: {
      // Compressed mainnet WIF starting with 'L'
      compressed_L: 'L5EZftvrYaSudiozVRzTqLcHLNDoVn7H5HSfM9BAN6tMJX8oTWz6',
      // Uncompressed mainnet WIF starting with '5'
      uncompressed_5: '5Kdc3UAwGmHHuj6fQD1LDmKR6J3SwYyFWyHgxKAZ2cKRzVCRETY',
    },
  };

  describe('validateWIF()', () => {
    describe('Testnet Validation', () => {
      it('should validate compressed testnet WIF (starts with "c")', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.testnet.compressed, 'testnet');
        expect(isValid).toBe(true);
      });

      it('should validate uncompressed testnet WIF (starts with "9")', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.testnet.uncompressed, 'testnet');
        expect(isValid).toBe(true);
      });

      it('should reject mainnet WIF when validating for testnet', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.mainnet.compressed_L, 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject mainnet WIF starting with "5"', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.mainnet.uncompressed_5, 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject mainnet WIF starting with "L"', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.mainnet.compressed_L, 'testnet');
        expect(isValid).toBe(false);
      });
    });

    describe('Mainnet Validation', () => {
      it('should validate compressed mainnet WIF (starts with "L")', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.mainnet.compressed_L, 'mainnet');
        expect(isValid).toBe(true);
      });

      it('should validate uncompressed mainnet WIF (starts with "5")', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.mainnet.uncompressed_5, 'mainnet');
        expect(isValid).toBe(true);
      });

      it('should reject testnet WIF when validating for mainnet', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.testnet.compressed, 'mainnet');
        expect(isValid).toBe(false);
      });
    });

    describe('Invalid WIF Formats', () => {
      it('should reject empty string', () => {
        const isValid = KeyManager.validateWIF('', 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject non-Base58 characters', () => {
        const invalidWIF = 'cVhT8DRG4sP1wNz@kjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmZ'; // Contains '@'
        const isValid = KeyManager.validateWIF(invalidWIF, 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject WIF with invalid checksum', () => {
        const invalidWIF = 'cVhT8DRG4sP1wNzQkjyF7MttCR2XK3UvJ8vB7q1B5K6nN9VWxTmA'; // Last char changed
        const isValid = KeyManager.validateWIF(invalidWIF, 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject WIF with wrong length', () => {
        const shortWIF = 'cVhT8DRG4sP1wNzQ'; // Too short
        const isValid = KeyManager.validateWIF(shortWIF, 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject random string', () => {
        const randomString = 'not-a-valid-wif-key-at-all';
        const isValid = KeyManager.validateWIF(randomString, 'testnet');
        expect(isValid).toBe(false);
      });

      it('should reject hex private key (not WIF format)', () => {
        const hexKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const isValid = KeyManager.validateWIF(hexKey, 'testnet');
        expect(isValid).toBe(false);
      });
    });

    describe('Network Parameter', () => {
      it('should default to testnet when network not specified', () => {
        const isValid = KeyManager.validateWIF(TEST_VECTORS.testnet.compressed);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('decodeWIF()', () => {
    describe('Testnet Decoding', () => {
      it('should decode compressed testnet WIF', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.testnet.compressed, 'testnet');

        expect(result).toBeDefined();
        expect(result.privateKey).toBeDefined();
        expect(result.publicKey).toBeDefined();
        expect(result.compressed).toBe(true);
        expect(typeof result.privateKey).toBe('string');
        expect(typeof result.publicKey).toBe('string');
        expect(result.privateKey.length).toBe(64); // 32 bytes in hex
      });

      it('should decode uncompressed testnet WIF', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.testnet.uncompressed, 'testnet');

        expect(result).toBeDefined();
        expect(result.compressed).toBe(false);
        expect(result.privateKey.length).toBe(64);
        expect(result.publicKey.length).toBe(130); // Uncompressed public key: 65 bytes = 130 hex chars
      });

      it('should extract valid hex private key', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.testnet.compressed, 'testnet');

        // Private key should be valid hex
        expect(/^[0-9a-f]{64}$/i.test(result.privateKey)).toBe(true);
      });

      it('should extract valid hex public key', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.testnet.compressed, 'testnet');

        // Public key should be valid hex
        expect(/^[0-9a-f]+$/i.test(result.publicKey)).toBe(true);
      });

      it('should have consistent compressed flag', () => {
        const compressed = KeyManager.decodeWIF(TEST_VECTORS.testnet.compressed, 'testnet');
        const uncompressed = KeyManager.decodeWIF(TEST_VECTORS.testnet.uncompressed, 'testnet');

        expect(compressed.compressed).toBe(true);
        expect(uncompressed.compressed).toBe(false);
      });
    });

    describe('Mainnet Decoding', () => {
      it('should decode compressed mainnet WIF (L prefix)', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.mainnet.compressed_L, 'mainnet');

        expect(result).toBeDefined();
        expect(result.compressed).toBe(true);
        expect(result.privateKey.length).toBe(64);
      });

      it('should decode compressed mainnet WIF (L prefix)', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.mainnet.compressed_L, 'mainnet');

        expect(result).toBeDefined();
        expect(result.compressed).toBe(true);
      });

      it('should decode uncompressed mainnet WIF (5 prefix)', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.mainnet.uncompressed_5, 'mainnet');

        expect(result).toBeDefined();
        expect(result.compressed).toBe(false);
      });
    });

    describe('Error Handling', () => {
      it('should throw for invalid WIF format', () => {
        expect(() => {
          KeyManager.decodeWIF('invalid-wif', 'testnet');
        }).toThrow();
      });

      it('should throw for mainnet WIF on testnet', () => {
        expect(() => {
          KeyManager.decodeWIF(TEST_VECTORS.mainnet.compressed_L, 'testnet');
        }).toThrow();
      });

      it('should throw for testnet WIF on mainnet', () => {
        expect(() => {
          KeyManager.decodeWIF(TEST_VECTORS.testnet.compressed, 'mainnet');
        }).toThrow();
      });

      it('should throw for empty string', () => {
        expect(() => {
          KeyManager.decodeWIF('', 'testnet');
        }).toThrow();
      });

      it('should throw descriptive error message', () => {
        expect(() => {
          KeyManager.decodeWIF('invalid', 'testnet');
        }).toThrow(/Failed to decode WIF/);
      });

      it('should not leak WIF in error message', () => {
        const invalidWIF = TEST_VECTORS.mainnet.compressed_L;
        try {
          KeyManager.decodeWIF(invalidWIF, 'testnet');
          fail('Should have thrown');
        } catch (error) {
          const errorMessage = (error as Error).message;
          expect(errorMessage).not.toContain(invalidWIF);
        }
      });
    });

    describe('Network Parameter', () => {
      it('should default to testnet when network not specified', () => {
        const result = KeyManager.decodeWIF(TEST_VECTORS.testnet.compressed);
        expect(result).toBeDefined();
        expect(result.compressed).toBe(true);
      });
    });
  });

  describe('privateKeyToWIF()', () => {
    describe('Testnet Conversion', () => {
      it('should convert private key to compressed testnet WIF', () => {
        // Get a known private key from a WIF
        const knownWIF = TEST_VECTORS.testnet.compressed;
        const { privateKey } = KeyManager.decodeWIF(knownWIF, 'testnet');

        // Convert back to WIF
        const wif = KeyManager.privateKeyToWIF(privateKey, 'testnet', true);

        // Should match original
        expect(wif).toBe(knownWIF);
      });

      it('should convert private key to uncompressed testnet WIF', () => {
        const knownWIF = TEST_VECTORS.testnet.uncompressed;
        const { privateKey } = KeyManager.decodeWIF(knownWIF, 'testnet');

        const wif = KeyManager.privateKeyToWIF(privateKey, 'testnet', false);

        expect(wif).toBe(knownWIF);
      });

      it('should produce different WIF for compressed vs uncompressed', () => {
        const privateKeyHex = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

        const compressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);
        const uncompressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', false);

        expect(compressedWIF).not.toBe(uncompressedWIF);
        expect(compressedWIF).toMatch(/^c/); // Testnet compressed starts with 'c'
        expect(uncompressedWIF).toMatch(/^9/); // Testnet uncompressed starts with '9'
      });

      it('should default to compressed format', () => {
        const privateKeyHex = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

        const wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet');

        // Should be compressed (starts with 'c')
        expect(wif).toMatch(/^c/);
      });
    });

    describe('Mainnet Conversion', () => {
      it('should convert private key to compressed mainnet WIF (K prefix)', () => {
        const knownWIF = TEST_VECTORS.mainnet.compressed_L;
        const { privateKey } = KeyManager.decodeWIF(knownWIF, 'mainnet');

        const wif = KeyManager.privateKeyToWIF(privateKey, 'mainnet', true);

        expect(wif).toBe(knownWIF);
      });

      it('should convert private key to uncompressed mainnet WIF (5 prefix)', () => {
        const knownWIF = TEST_VECTORS.mainnet.uncompressed_5;
        const { privateKey } = KeyManager.decodeWIF(knownWIF, 'mainnet');

        const wif = KeyManager.privateKeyToWIF(privateKey, 'mainnet', false);

        expect(wif).toBe(knownWIF);
      });

      it('should produce valid mainnet WIF prefixes', () => {
        const privateKeyHex = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

        const compressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, 'mainnet', true);
        const uncompressedWIF = KeyManager.privateKeyToWIF(privateKeyHex, 'mainnet', false);

        // Mainnet compressed starts with K or L
        expect(compressedWIF).toMatch(/^[KL]/);
        // Mainnet uncompressed starts with 5
        expect(uncompressedWIF).toMatch(/^5/);
      });
    });

    describe('Round-Trip Conversion', () => {
      it('should round-trip: privateKey -> WIF -> privateKey (testnet compressed)', () => {
        const originalKey = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

        const wif = KeyManager.privateKeyToWIF(originalKey, 'testnet', true);
        const { privateKey } = KeyManager.decodeWIF(wif, 'testnet');

        expect(privateKey).toBe(originalKey);
      });

      it('should round-trip: privateKey -> WIF -> privateKey (testnet uncompressed)', () => {
        const originalKey = 'b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1';

        const wif = KeyManager.privateKeyToWIF(originalKey, 'testnet', false);
        const { privateKey } = KeyManager.decodeWIF(wif, 'testnet');

        expect(privateKey).toBe(originalKey);
      });

      it('should round-trip: privateKey -> WIF -> privateKey (mainnet)', () => {
        const originalKey = 'c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2';

        const wif = KeyManager.privateKeyToWIF(originalKey, 'mainnet', true);
        const { privateKey } = KeyManager.decodeWIF(wif, 'mainnet');

        expect(privateKey).toBe(originalKey);
      });
    });

    describe('Error Handling', () => {
      it('should throw for invalid hex private key (odd length)', () => {
        const invalidKey = 'a1b2c3d4e5f67890a'; // Odd length

        expect(() => {
          KeyManager.privateKeyToWIF(invalidKey, 'testnet', true);
        }).toThrow();
      });

      it('should throw for invalid hex characters', () => {
        const invalidKey = 'g1h2i3j4k5l67890g1h2i3j4k5l67890g1h2i3j4k5l67890g1h2i3j4k5l67890'; // Contains g-l

        expect(() => {
          KeyManager.privateKeyToWIF(invalidKey, 'testnet', true);
        }).toThrow();
      });

      it('should throw for empty string', () => {
        expect(() => {
          KeyManager.privateKeyToWIF('', 'testnet', true);
        }).toThrow();
      });

      it('should throw for wrong length (not 32 bytes)', () => {
        const shortKey = 'a1b2c3d4'; // Too short

        expect(() => {
          KeyManager.privateKeyToWIF(shortKey, 'testnet', true);
        }).toThrow();
      });

      it('should throw descriptive error message', () => {
        expect(() => {
          KeyManager.privateKeyToWIF('invalid', 'testnet', true);
        }).toThrow(/Failed to convert private key to WIF/);
      });
    });

    describe('Network Parameter', () => {
      it('should default to testnet when network not specified', () => {
        const privateKeyHex = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

        const wif = KeyManager.privateKeyToWIF(privateKeyHex);

        // Should be testnet (starts with 'c' for compressed)
        expect(wif).toMatch(/^c/);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should validate WIF after conversion from private key', () => {
      const privateKeyHex = 'a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890';

      const wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);
      const isValid = KeyManager.validateWIF(wif, 'testnet');

      expect(isValid).toBe(true);
    });

    it('should decode WIF after conversion from private key', () => {
      const originalKey = 'b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1b2c3d4e5f67890a1';

      const wif = KeyManager.privateKeyToWIF(originalKey, 'testnet', true);
      const decoded = KeyManager.decodeWIF(wif, 'testnet');

      expect(decoded.privateKey).toBe(originalKey);
      expect(decoded.compressed).toBe(true);
    });

    it('should handle complete import workflow: WIF -> privateKey -> address', () => {
      const testWIF = TEST_VECTORS.testnet.compressed;

      // 1. Validate WIF
      const isValid = KeyManager.validateWIF(testWIF, 'testnet');
      expect(isValid).toBe(true);

      // 2. Decode WIF
      const { privateKey, publicKey, compressed } = KeyManager.decodeWIF(testWIF, 'testnet');
      expect(privateKey).toBeDefined();
      expect(publicKey).toBeDefined();
      expect(compressed).toBe(true);

      // 3. Convert back to WIF (round-trip)
      const regeneratedWIF = KeyManager.privateKeyToWIF(privateKey, 'testnet', compressed);
      expect(regeneratedWIF).toBe(testWIF);
    });
  });
});
