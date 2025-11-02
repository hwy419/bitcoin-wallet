/**
 * WIFManager Tests
 *
 * Comprehensive test suite for WIF (Wallet Import Format) validation,
 * network detection, and address derivation.
 *
 * @jest-environment node
 */

import { WIFManager } from '../WIFManager';
import { KeyManager } from '../KeyManager';

describe('WIFManager', () => {
  // Valid testnet WIF keys for testing
  const VALID_TESTNET_WIF_COMPRESSED = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
  const VALID_TESTNET_WIF_UNCOMPRESSED = '92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc';

  // Valid mainnet WIF keys for testing
  const VALID_MAINNET_WIF_COMPRESSED = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';
  const VALID_MAINNET_WIF_UNCOMPRESSED = '5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss';

  // Invalid WIF keys
  const INVALID_WIF_TOO_SHORT = 'cNJFgo1';
  const INVALID_WIF_BAD_CHECKSUM = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMX';
  const INVALID_WIF_WRONG_PREFIX = 'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';

  describe('validateFormat', () => {
    it('should accept valid testnet WIF (compressed)', () => {
      const error = WIFManager.validateFormat(VALID_TESTNET_WIF_COMPRESSED);
      expect(error).toBeNull();
    });

    it('should accept valid testnet WIF (uncompressed)', () => {
      const error = WIFManager.validateFormat(VALID_TESTNET_WIF_UNCOMPRESSED);
      expect(error).toBeNull();
    });

    it('should accept valid mainnet WIF (compressed)', () => {
      const error = WIFManager.validateFormat(VALID_MAINNET_WIF_COMPRESSED);
      expect(error).toBeNull();
    });

    it('should accept valid mainnet WIF (uncompressed)', () => {
      const error = WIFManager.validateFormat(VALID_MAINNET_WIF_UNCOMPRESSED);
      expect(error).toBeNull();
    });

    it('should reject WIF that is too short', () => {
      const error = WIFManager.validateFormat(INVALID_WIF_TOO_SHORT);
      expect(error).toContain('Invalid WIF length');
    });

    it('should reject WIF with non-Base58 characters', () => {
      const error = WIFManager.validateFormat('cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwH0O'); // Contains '0' and 'O'
      expect(error).toContain('Invalid WIF format');
    });

    it('should reject empty string', () => {
      const error = WIFManager.validateFormat('');
      expect(error).not.toBeNull();
    });

    it('should reject WIF with wrong length (too long)', () => {
      const error = WIFManager.validateFormat(VALID_TESTNET_WIF_COMPRESSED + 'extra');
      expect(error).toContain('Invalid WIF length');
    });
  });

  describe('detectNetwork', () => {
    it('should detect testnet from compressed WIF (c prefix)', () => {
      const network = WIFManager.detectNetwork(VALID_TESTNET_WIF_COMPRESSED);
      expect(network).toBe('testnet');
    });

    it('should detect testnet from uncompressed WIF (9 prefix)', () => {
      const network = WIFManager.detectNetwork(VALID_TESTNET_WIF_UNCOMPRESSED);
      expect(network).toBe('testnet');
    });

    it('should detect mainnet from compressed WIF (L prefix)', () => {
      const network = WIFManager.detectNetwork(VALID_MAINNET_WIF_COMPRESSED);
      expect(network).toBe('mainnet');
    });

    it('should detect mainnet from compressed WIF (K prefix)', () => {
      // Generate a K-prefix WIF for testing
      const kPrefixWIF = 'KwDiBf89QgGbjEhKnhXJuH7LrciVrZi3qYjgd9M7rFU73sVHnoWn';
      const network = WIFManager.detectNetwork(kPrefixWIF);
      expect(network).toBe('mainnet');
    });

    it('should detect mainnet from uncompressed WIF (5 prefix)', () => {
      const network = WIFManager.detectNetwork(VALID_MAINNET_WIF_UNCOMPRESSED);
      expect(network).toBe('mainnet');
    });

    it('should return invalid for unknown prefix', () => {
      const network = WIFManager.detectNetwork(INVALID_WIF_WRONG_PREFIX);
      expect(network).toBe('invalid');
    });

    it('should return invalid for empty string', () => {
      const network = WIFManager.detectNetwork('');
      expect(network).toBe('invalid');
    });
  });

  describe('validateNetwork', () => {
    it('should accept testnet WIF when testnet required', () => {
      const error = WIFManager.validateNetwork(VALID_TESTNET_WIF_COMPRESSED, 'testnet');
      expect(error).toBeNull();
    });

    it('should accept mainnet WIF when mainnet required', () => {
      const error = WIFManager.validateNetwork(VALID_MAINNET_WIF_COMPRESSED, 'mainnet');
      expect(error).toBeNull();
    });

    it('should reject testnet WIF when mainnet required', () => {
      const error = WIFManager.validateNetwork(VALID_TESTNET_WIF_COMPRESSED, 'mainnet');
      expect(error).toContain('Wrong network');
      expect(error).toContain('testnet');
      expect(error).toContain('mainnet');
    });

    it('should reject mainnet WIF when testnet required', () => {
      const error = WIFManager.validateNetwork(VALID_MAINNET_WIF_COMPRESSED, 'testnet');
      expect(error).toContain('Wrong network');
      expect(error).toContain('mainnet');
      expect(error).toContain('testnet');
    });

    it('should reject invalid WIF prefix', () => {
      const error = WIFManager.validateNetwork(INVALID_WIF_WRONG_PREFIX, 'testnet');
      expect(error).toContain('Invalid WIF prefix');
    });

    it('should default to testnet when network not specified', () => {
      const error = WIFManager.validateNetwork(VALID_TESTNET_WIF_COMPRESSED);
      expect(error).toBeNull();
    });
  });

  describe('validateChecksum', () => {
    it('should validate correct testnet WIF checksum', () => {
      const valid = WIFManager.validateChecksum(VALID_TESTNET_WIF_COMPRESSED, 'testnet');
      expect(valid).toBe(true);
    });

    it('should validate correct mainnet WIF checksum', () => {
      const valid = WIFManager.validateChecksum(VALID_MAINNET_WIF_COMPRESSED, 'mainnet');
      expect(valid).toBe(true);
    });

    it('should reject WIF with bad checksum', () => {
      const valid = WIFManager.validateChecksum(INVALID_WIF_BAD_CHECKSUM, 'testnet');
      expect(valid).toBe(false);
    });

    it('should reject completely invalid WIF', () => {
      const valid = WIFManager.validateChecksum('invalidwif123', 'testnet');
      expect(valid).toBe(false);
    });
  });

  describe('deriveFirstAddress', () => {
    it('should derive correct address from compressed testnet WIF', () => {
      const result = WIFManager.deriveFirstAddress(VALID_TESTNET_WIF_COMPRESSED, 'testnet');

      expect(result.address).toBeDefined();
      expect(result.address).toMatch(/^(tb1|[mn2])/); // Testnet address prefix
      expect(result.addressType).toBe('native-segwit'); // Compressed keys default to native-segwit
      expect(result.compressed).toBe(true);
    });

    it('should derive legacy address from uncompressed testnet WIF', () => {
      const result = WIFManager.deriveFirstAddress(VALID_TESTNET_WIF_UNCOMPRESSED, 'testnet');

      expect(result.address).toBeDefined();
      expect(result.address).toMatch(/^[mn]/); // Testnet legacy prefix
      expect(result.addressType).toBe('legacy'); // Uncompressed keys use legacy
      expect(result.compressed).toBe(false);
    });

    it('should derive correct address from compressed mainnet WIF', () => {
      const result = WIFManager.deriveFirstAddress(VALID_MAINNET_WIF_COMPRESSED, 'mainnet');

      expect(result.address).toBeDefined();
      expect(result.address).toMatch(/^(bc1|[13])/); // Mainnet address prefix
      expect(result.addressType).toBe('native-segwit');
      expect(result.compressed).toBe(true);
    });

    it('should derive legacy address from uncompressed mainnet WIF', () => {
      const result = WIFManager.deriveFirstAddress(VALID_MAINNET_WIF_UNCOMPRESSED, 'mainnet');

      expect(result.address).toBeDefined();
      expect(result.address).toMatch(/^1/); // Mainnet legacy prefix
      expect(result.addressType).toBe('legacy');
      expect(result.compressed).toBe(false);
    });

    it('should throw error for invalid WIF', () => {
      expect(() => {
        WIFManager.deriveFirstAddress('invalid', 'testnet');
      }).toThrow();
    });

    it('should default to testnet when network not specified', () => {
      const result = WIFManager.deriveFirstAddress(VALID_TESTNET_WIF_COMPRESSED);
      expect(result.address).toMatch(/^(tb1|[mn2])/);
    });
  });

  describe('validateWIF', () => {
    describe('Valid WIF keys', () => {
      it('should validate compressed testnet WIF', () => {
        const result = WIFManager.validateWIF(VALID_TESTNET_WIF_COMPRESSED, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.network).toBe('testnet');
        expect(result.firstAddress).toBeDefined();
        expect(result.addressType).toBe('native-segwit');
        expect(result.compressed).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should validate uncompressed testnet WIF', () => {
        const result = WIFManager.validateWIF(VALID_TESTNET_WIF_UNCOMPRESSED, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.network).toBe('testnet');
        expect(result.firstAddress).toBeDefined();
        expect(result.addressType).toBe('legacy');
        expect(result.compressed).toBe(false);
        expect(result.error).toBeUndefined();
      });

      it('should validate compressed mainnet WIF when mainnet required', () => {
        const result = WIFManager.validateWIF(VALID_MAINNET_WIF_COMPRESSED, 'mainnet');

        expect(result.valid).toBe(true);
        expect(result.network).toBe('mainnet');
        expect(result.firstAddress).toBeDefined();
        expect(result.addressType).toBe('native-segwit');
        expect(result.compressed).toBe(true);
      });
    });

    describe('Invalid WIF keys', () => {
      it('should reject WIF with invalid format', () => {
        const result = WIFManager.validateWIF(INVALID_WIF_TOO_SHORT, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Invalid WIF length');
      });

      it('should reject WIF with bad checksum', () => {
        const result = WIFManager.validateWIF(INVALID_WIF_BAD_CHECKSUM, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject mainnet WIF when testnet required', () => {
        const result = WIFManager.validateWIF(VALID_MAINNET_WIF_COMPRESSED, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.network).toBe('mainnet');
        expect(result.error).toContain('Wrong network');
      });

      it('should reject testnet WIF when mainnet required', () => {
        const result = WIFManager.validateWIF(VALID_TESTNET_WIF_COMPRESSED, 'mainnet');

        expect(result.valid).toBe(false);
        expect(result.network).toBe('testnet');
        expect(result.error).toContain('Wrong network');
      });

      it('should reject empty string', () => {
        const result = WIFManager.validateWIF('', 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject non-Base58 string', () => {
        const result = WIFManager.validateWIF('not-a-wif-key-0O', 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('Network enforcement', () => {
      it('should strictly enforce testnet for testnet wallet', () => {
        const mainnetWIF = VALID_MAINNET_WIF_COMPRESSED;
        const result = WIFManager.validateWIF(mainnetWIF, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Wrong network');
        expect(result.error).toContain('mainnet');
        expect(result.error).toContain('testnet');
      });

      it('should strictly enforce mainnet for mainnet wallet', () => {
        const testnetWIF = VALID_TESTNET_WIF_COMPRESSED;
        const result = WIFManager.validateWIF(testnetWIF, 'mainnet');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Wrong network');
        expect(result.error).toContain('testnet');
        expect(result.error).toContain('mainnet');
      });
    });

    describe('Edge cases', () => {
      it('should handle WIF with whitespace (should fail)', () => {
        const wifWithSpaces = ` ${VALID_TESTNET_WIF_COMPRESSED} `;
        const result = WIFManager.validateWIF(wifWithSpaces, 'testnet');

        // Should fail because spaces are not valid Base58
        expect(result.valid).toBe(false);
      });

      it('should handle very long invalid string', () => {
        const longInvalid = 'a'.repeat(100);
        const result = WIFManager.validateWIF(longInvalid, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should default to testnet when network not specified', () => {
        const result = WIFManager.validateWIF(VALID_TESTNET_WIF_COMPRESSED);
        expect(result.valid).toBe(true);
        expect(result.network).toBe('testnet');
      });
    });
  });

  describe('Integration with KeyManager', () => {
    it('should work with KeyManager-generated WIF', () => {
      // Generate a random private key and convert to WIF
      const mnemonic = KeyManager.generateMnemonic();
      const seed = KeyManager.mnemonicToSeed(mnemonic);

      // We can't easily test this without HDWallet, but we can verify
      // that WIFManager correctly validates known test vectors
      const testnetWIF = VALID_TESTNET_WIF_COMPRESSED;

      // Decode with KeyManager
      const decoded = KeyManager.decodeWIF(testnetWIF, 'testnet');
      expect(decoded.privateKey).toBeDefined();
      expect(decoded.publicKey).toBeDefined();
      expect(decoded.compressed).toBe(true);

      // Validate with WIFManager
      const validation = WIFManager.validateWIF(testnetWIF, 'testnet');
      expect(validation.valid).toBe(true);
      expect(validation.compressed).toBe(true);
    });

    it('should round-trip: hex -> WIF -> validate', () => {
      // Use a known private key hex
      const privateKeyHex = '0c28fca386c7a227600b2fe50b7cae11ec86d3bf1fbe471be89827e19d72aa1d';

      // Convert to WIF with KeyManager
      const wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

      // Validate with WIFManager
      const validation = WIFManager.validateWIF(wif, 'testnet');
      expect(validation.valid).toBe(true);
      expect(validation.network).toBe('testnet');
      expect(validation.compressed).toBe(true);

      // Decode back with KeyManager
      const decoded = KeyManager.decodeWIF(wif, 'testnet');
      expect(decoded.privateKey).toBe(privateKeyHex);
    });
  });

  describe('Security', () => {
    it('should not leak private key in error messages', () => {
      const invalidWIF = 'invalid_but_looks_like_secret';
      const result = WIFManager.validateWIF(invalidWIF, 'testnet');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      // Error should not contain the invalid WIF
      expect(result.error!.toLowerCase()).not.toContain(invalidWIF.toLowerCase());
    });

    it('should handle potentially malicious input safely', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '../../etc/passwd',
        '${process.env.SECRET}',
        '\0\0\0\0',
        '\uFEFF' + VALID_TESTNET_WIF_COMPRESSED, // BOM character
      ];

      maliciousInputs.forEach(input => {
        expect(() => {
          WIFManager.validateWIF(input, 'testnet');
        }).not.toThrow(); // Should handle gracefully without throwing
      });
    });
  });

  // =============================================================================
  // deriveAddress() Tests - User-Selected Address Type
  // =============================================================================

  describe('deriveAddress', () => {
    describe('Compressed key with all address types', () => {
      it('should derive Legacy (P2PKH) address from compressed testnet WIF', () => {
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'legacy',
          'testnet'
        );

        expect(result.address).toBeDefined();
        expect(result.address).toMatch(/^[mn]/); // Testnet legacy prefix
        expect(result.compressed).toBe(true);
      });

      it('should derive SegWit (P2SH-P2WPKH) address from compressed testnet WIF', () => {
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'segwit',
          'testnet'
        );

        expect(result.address).toBeDefined();
        expect(result.address).toMatch(/^2/); // Testnet SegWit prefix
        expect(result.compressed).toBe(true);
      });

      it('should derive Native SegWit (P2WPKH) address from compressed testnet WIF', () => {
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'native-segwit',
          'testnet'
        );

        expect(result.address).toBeDefined();
        expect(result.address).toMatch(/^tb1q/); // Testnet native segwit prefix
        expect(result.compressed).toBe(true);
      });

      it('should derive all 3 address types from same compressed mainnet WIF', () => {
        const legacy = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_COMPRESSED,
          'legacy',
          'mainnet'
        );
        const segwit = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_COMPRESSED,
          'segwit',
          'mainnet'
        );
        const nativeSegwit = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_COMPRESSED,
          'native-segwit',
          'mainnet'
        );

        // All should succeed
        expect(legacy.address).toMatch(/^1/); // Mainnet legacy
        expect(segwit.address).toMatch(/^3/); // Mainnet segwit
        expect(nativeSegwit.address).toMatch(/^bc1q/); // Mainnet native segwit

        // All from compressed key
        expect(legacy.compressed).toBe(true);
        expect(segwit.compressed).toBe(true);
        expect(nativeSegwit.compressed).toBe(true);

        // All addresses should be different
        expect(legacy.address).not.toBe(segwit.address);
        expect(legacy.address).not.toBe(nativeSegwit.address);
        expect(segwit.address).not.toBe(nativeSegwit.address);
      });
    });

    describe('Uncompressed key restrictions', () => {
      it('should derive Legacy address from uncompressed testnet WIF', () => {
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_UNCOMPRESSED,
          'legacy',
          'testnet'
        );

        expect(result.address).toBeDefined();
        expect(result.address).toMatch(/^[mn]/); // Testnet legacy prefix
        expect(result.compressed).toBe(false);
      });

      it('should throw error when deriving SegWit from uncompressed key', () => {
        expect(() => {
          WIFManager.deriveAddress(
            VALID_TESTNET_WIF_UNCOMPRESSED,
            'segwit',
            'testnet'
          );
        }).toThrow(/Uncompressed private keys can only generate Legacy/);
      });

      it('should throw error when deriving Native SegWit from uncompressed key', () => {
        expect(() => {
          WIFManager.deriveAddress(
            VALID_TESTNET_WIF_UNCOMPRESSED,
            'native-segwit',
            'testnet'
          );
        }).toThrow(/Uncompressed private keys can only generate Legacy/);
      });

      it('should derive Legacy from uncompressed mainnet WIF', () => {
        const result = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_UNCOMPRESSED,
          'legacy',
          'mainnet'
        );

        expect(result.address).toBeDefined();
        expect(result.address).toMatch(/^1/); // Mainnet legacy prefix
        expect(result.compressed).toBe(false);
      });
    });

    describe('Network-specific address format validation', () => {
      it('should generate testnet address for testnet WIF', () => {
        const legacy = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'legacy',
          'testnet'
        );
        const segwit = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'segwit',
          'testnet'
        );
        const nativeSegwit = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'native-segwit',
          'testnet'
        );

        // Verify testnet-specific prefixes
        expect(legacy.address).toMatch(/^[mn]/);
        expect(segwit.address).toMatch(/^2/);
        expect(nativeSegwit.address).toMatch(/^tb1/);
      });

      it('should generate mainnet address for mainnet WIF', () => {
        const legacy = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_COMPRESSED,
          'legacy',
          'mainnet'
        );
        const segwit = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_COMPRESSED,
          'segwit',
          'mainnet'
        );
        const nativeSegwit = WIFManager.deriveAddress(
          VALID_MAINNET_WIF_COMPRESSED,
          'native-segwit',
          'mainnet'
        );

        // Verify mainnet-specific prefixes
        expect(legacy.address).toMatch(/^1/);
        expect(segwit.address).toMatch(/^3/);
        expect(nativeSegwit.address).toMatch(/^bc1/);
      });
    });

    describe('Address consistency', () => {
      it('should return same address for same WIF and address type', () => {
        const result1 = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'native-segwit',
          'testnet'
        );
        const result2 = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'native-segwit',
          'testnet'
        );

        expect(result1.address).toBe(result2.address);
        expect(result1.compressed).toBe(result2.compressed);
      });

      it('should return different addresses for different address types', () => {
        const legacy = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'legacy',
          'testnet'
        );
        const segwit = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'segwit',
          'testnet'
        );
        const nativeSegwit = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'native-segwit',
          'testnet'
        );

        // All addresses should be unique
        expect(legacy.address).not.toBe(segwit.address);
        expect(legacy.address).not.toBe(nativeSegwit.address);
        expect(segwit.address).not.toBe(nativeSegwit.address);
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid WIF', () => {
        expect(() => {
          WIFManager.deriveAddress('invalid_wif', 'legacy', 'testnet');
        }).toThrow();
      });

      it('should throw error for unsupported address type', () => {
        expect(() => {
          WIFManager.deriveAddress(
            VALID_TESTNET_WIF_COMPRESSED,
            'unsupported-type' as any,
            'testnet'
          );
        }).toThrow(/Unsupported address type/);
      });

      it('should default to testnet when network not specified', () => {
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'native-segwit'
        );

        expect(result.address).toMatch(/^tb1/); // Testnet prefix
      });
    });

    describe('Integration with validateWIF', () => {
      it('should work with validated WIF', () => {
        // First validate
        const validation = WIFManager.validateWIF(VALID_TESTNET_WIF_COMPRESSED, 'testnet');
        expect(validation.valid).toBe(true);

        // Then derive with user-selected type
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'segwit',
          'testnet'
        );

        expect(result.address).toBeDefined();
        expect(result.address).toMatch(/^2/);
      });

      it('should allow different address type than validateWIF default', () => {
        // validateWIF returns native-segwit for compressed keys by default
        const validation = WIFManager.validateWIF(VALID_TESTNET_WIF_COMPRESSED, 'testnet');
        expect(validation.addressType).toBe('native-segwit');
        expect(validation.firstAddress).toMatch(/^tb1/);

        // But deriveAddress allows user to choose legacy
        const result = WIFManager.deriveAddress(
          VALID_TESTNET_WIF_COMPRESSED,
          'legacy',
          'testnet'
        );
        expect(result.address).toMatch(/^[mn]/);
      });
    });
  });
});
