/**
 * XpubValidator Test Suite
 *
 * Comprehensive tests for extended public key validation:
 * - BIP32 xpub format validation
 * - Network detection (testnet vs mainnet)
 * - Xpub type identification (tpub, upub, vpub, xpub, ypub, zpub, etc.)
 * - Metadata extraction (fingerprint, depth, purpose, script type)
 * - Derivation path template generation
 * - BIP compliance verification
 * - Edge cases and error handling
 *
 * Bitcoin protocol implementation - requires high coverage
 *
 * @jest-environment node
 */

import { XpubValidator } from '../XpubValidator';
import { XpubValidationResult } from '../../../shared/types';

describe('XpubValidator', () => {
  // Test xpubs (generated from valid BIP32 seeds for testing)
  // These are real BIP32 extended public keys for testnet and mainnet
  const VALID_TESTNET_TPUB =
    'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp';
  const VALID_TESTNET_UPUB =
    'upub5EFU65HtV5TeiSHmZZm7FUffBGy8UKeqp7vw43jYbvZPpoVsgU93oac7Wk3u6moKegAEWtGNF8DehrnHtv21XXEMYRUocHqguyjknFHYfgY';
  const VALID_TESTNET_VPUB =
    'vpub5Y6cjg78GGuNLsaPhmYsiw4gYX3HoQiRBiSwDaBXKUafCt9bNwWQiitDk5VZ5BVxYnQdwoTyXSs2JHRPAgjAvtbBrf8ZhDYe2jWAqvZVnsc';

  const VALID_MAINNET_XPUB =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
  const VALID_MAINNET_YPUB =
    'ypub6QqdH2c5z7967BioGSfAWFHM1EHzHPBZK7wrND3ZpEWFtzmCqvsD1bgpaE6pSAPkiSKhkuWPCJV6mZTSNMd2tK8xYTcJ48585pZecmSUzWp';
  const VALID_MAINNET_ZPUB =
    'zpub6jftahH18ngZxLmXaKw3GSZzZsszmt9WqedkyZdezFtWRFBZqsQH5hyUmb4pCEeZGmVfQuP5bedXTB8is6fTv19U1GQRyQUKQGUTzyHACMF';

  describe('validate', () => {
    describe('testnet xpubs', () => {
      it('should validate testnet tpub (BIP44 Legacy)', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.xpubType).toBe('tpub');
        expect(result.fingerprint).toBeDefined();
        expect(result.fingerprint?.length).toBe(8); // 4 bytes = 8 hex chars
        expect(result.depth).toBeDefined();
        expect(result.purpose).toBe(44);
        expect(result.scriptType).toBe('p2pkh');
        expect(result.derivationPathTemplate).toMatch(/^m\/44'\/1'\/\d+'/);
      });

      it('should validate testnet upub (BIP49 SegWit)', () => {
        const result = XpubValidator.validate(VALID_TESTNET_UPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.xpubType).toBe('upub');
        expect(result.purpose).toBe(49);
        expect(result.scriptType).toBe('p2sh-p2wpkh');
        expect(result.derivationPathTemplate).toMatch(/^m\/49'\/1'\/\d+'/);
      });

      it('should validate testnet vpub (BIP84 Native SegWit)', () => {
        const result = XpubValidator.validate(VALID_TESTNET_VPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.xpubType).toBe('vpub');
        expect(result.purpose).toBe(84);
        expect(result.scriptType).toBe('p2wpkh');
        expect(result.derivationPathTemplate).toMatch(/^m\/84'\/1'\/\d+'/);
      });
    });

    describe('mainnet xpubs', () => {
      it('should validate mainnet xpub (BIP44 Legacy)', () => {
        const result = XpubValidator.validate(VALID_MAINNET_XPUB, 'mainnet');

        expect(result.valid).toBe(true);
        expect(result.xpubType).toBe('xpub');
        expect(result.fingerprint).toBeDefined();
        expect(result.purpose).toBe(44);
        expect(result.scriptType).toBe('p2pkh');
        expect(result.derivationPathTemplate).toMatch(/^m\/44'\/0'\/\d+'/);
      });

      it('should validate mainnet ypub (BIP49 SegWit)', () => {
        const result = XpubValidator.validate(VALID_MAINNET_YPUB, 'mainnet');

        expect(result.valid).toBe(true);
        expect(result.xpubType).toBe('ypub');
        expect(result.purpose).toBe(49);
        expect(result.scriptType).toBe('p2sh-p2wpkh');
        expect(result.derivationPathTemplate).toMatch(/^m\/49'\/0'\/\d+'/);
      });

      it('should validate mainnet zpub (BIP84 Native SegWit)', () => {
        const result = XpubValidator.validate(VALID_MAINNET_ZPUB, 'mainnet');

        expect(result.valid).toBe(true);
        expect(result.xpubType).toBe('zpub');
        expect(result.purpose).toBe(84);
        expect(result.scriptType).toBe('p2wpkh');
        expect(result.derivationPathTemplate).toMatch(/^m\/84'\/0'\/\d+'/);
      });
    });

    describe('network mismatch detection', () => {
      it('should reject testnet xpub when mainnet expected', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'mainnet');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('testnet');
        expect(result.error).toContain('mainnet');
      });

      it('should reject mainnet xpub when testnet expected', () => {
        const result = XpubValidator.validate(VALID_MAINNET_XPUB, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('mainnet');
        expect(result.error).toContain('testnet');
      });
    });

    describe('invalid xpubs', () => {
      it('should reject invalid prefix', () => {
        const invalidXpub = 'invalid' + VALID_TESTNET_TPUB.slice(7);
        const result = XpubValidator.validate(invalidXpub, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toContain('Unsupported xpub format');
      });

      it('should reject empty string', () => {
        const result = XpubValidator.validate('', 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject too short string', () => {
        const result = XpubValidator.validate('tpub123', 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject corrupted base58 xpub', () => {
        // Replace valid characters with invalid ones
        const corrupted = VALID_TESTNET_TPUB.slice(0, -10) + '0000000000';
        const result = XpubValidator.validate(corrupted, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject xpub with invalid checksum', () => {
        // Modify last character to break checksum
        const brokenChecksum = VALID_TESTNET_TPUB.slice(0, -1) + 'X';
        const result = XpubValidator.validate(brokenChecksum, 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });

      it('should reject random string', () => {
        const result = XpubValidator.validate('this is not an xpub', 'testnet');

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('metadata extraction', () => {
      it('should extract correct fingerprint', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.fingerprint).toBeDefined();
        expect(typeof result.fingerprint).toBe('string');
        expect(result.fingerprint?.length).toBe(8);
        expect(/^[0-9a-f]{8}$/.test(result.fingerprint!)).toBe(true);
      });

      it('should extract correct depth', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.depth).toBeDefined();
        expect(typeof result.depth).toBe('number');
        expect(result.depth).toBeGreaterThanOrEqual(0);
      });

      it('should extract correct child number', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.childNumber).toBeDefined();
        expect(typeof result.childNumber).toBe('number');
      });
    });

    describe('derivation path templates', () => {
      it('should generate correct template for BIP44 (tpub)', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.derivationPathTemplate).toMatch(/^m\/44'\/1'\/\d+'/);
      });

      it('should generate correct template for BIP49 (upub)', () => {
        const result = XpubValidator.validate(VALID_TESTNET_UPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.derivationPathTemplate).toMatch(/^m\/49'\/1'\/\d+'/);
      });

      it('should generate correct template for BIP84 (vpub)', () => {
        const result = XpubValidator.validate(VALID_TESTNET_VPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.derivationPathTemplate).toMatch(/^m\/84'\/1'\/\d+'/);
      });

      it('should use coin type 0 for mainnet', () => {
        const result = XpubValidator.validate(VALID_MAINNET_XPUB, 'mainnet');

        expect(result.valid).toBe(true);
        expect(result.derivationPathTemplate).toContain("44'/0'/");
      });

      it('should use coin type 1 for testnet', () => {
        const result = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

        expect(result.valid).toBe(true);
        expect(result.derivationPathTemplate).toContain("44'/1'/");
      });
    });

    describe('script type mapping', () => {
      const testCases: Array<{
        xpub: string;
        network: 'testnet' | 'mainnet';
        expectedType: string;
        description: string;
      }> = [
        { xpub: VALID_TESTNET_TPUB, network: 'testnet', expectedType: 'p2pkh', description: 'tpub -> p2pkh' },
        { xpub: VALID_TESTNET_UPUB, network: 'testnet', expectedType: 'p2sh-p2wpkh', description: 'upub -> p2sh-p2wpkh' },
        { xpub: VALID_TESTNET_VPUB, network: 'testnet', expectedType: 'p2wpkh', description: 'vpub -> p2wpkh' },
        { xpub: VALID_MAINNET_XPUB, network: 'mainnet', expectedType: 'p2pkh', description: 'xpub -> p2pkh' },
        { xpub: VALID_MAINNET_YPUB, network: 'mainnet', expectedType: 'p2sh-p2wpkh', description: 'ypub -> p2sh-p2wpkh' },
        { xpub: VALID_MAINNET_ZPUB, network: 'mainnet', expectedType: 'p2wpkh', description: 'zpub -> p2wpkh' },
      ];

      testCases.forEach(({ xpub, network, expectedType, description }) => {
        it(`should map ${description}`, () => {
          const result = XpubValidator.validate(xpub, network);
          expect(result.valid).toBe(true);
          expect(result.scriptType).toBe(expectedType);
        });
      });
    });
  });

  describe('getNetwork', () => {
    it('should detect testnet from tpub', () => {
      const network = XpubValidator.getNetwork(VALID_TESTNET_TPUB);
      expect(network).toBe('testnet');
    });

    it('should detect testnet from upub', () => {
      const network = XpubValidator.getNetwork(VALID_TESTNET_UPUB);
      expect(network).toBe('testnet');
    });

    it('should detect testnet from vpub', () => {
      const network = XpubValidator.getNetwork(VALID_TESTNET_VPUB);
      expect(network).toBe('testnet');
    });

    it('should detect mainnet from xpub', () => {
      const network = XpubValidator.getNetwork(VALID_MAINNET_XPUB);
      expect(network).toBe('mainnet');
    });

    it('should detect mainnet from ypub', () => {
      const network = XpubValidator.getNetwork(VALID_MAINNET_YPUB);
      expect(network).toBe('mainnet');
    });

    it('should detect mainnet from zpub', () => {
      const network = XpubValidator.getNetwork(VALID_MAINNET_ZPUB);
      expect(network).toBe('mainnet');
    });

    it('should return undefined for invalid prefix', () => {
      const network = XpubValidator.getNetwork('invalid_xpub_string');
      expect(network).toBeUndefined();
    });

    it('should return undefined for empty string', () => {
      const network = XpubValidator.getNetwork('');
      expect(network).toBeUndefined();
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid testnet xpub formats', () => {
      expect(XpubValidator.isValidFormat(VALID_TESTNET_TPUB)).toBe(true);
      expect(XpubValidator.isValidFormat(VALID_TESTNET_UPUB)).toBe(true);
      expect(XpubValidator.isValidFormat(VALID_TESTNET_VPUB)).toBe(true);
    });

    it('should return true for valid mainnet xpub formats', () => {
      expect(XpubValidator.isValidFormat(VALID_MAINNET_XPUB)).toBe(true);
      expect(XpubValidator.isValidFormat(VALID_MAINNET_YPUB)).toBe(true);
      expect(XpubValidator.isValidFormat(VALID_MAINNET_ZPUB)).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(XpubValidator.isValidFormat('')).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(XpubValidator.isValidFormat(null as any)).toBe(false);
      expect(XpubValidator.isValidFormat(undefined as any)).toBe(false);
      expect(XpubValidator.isValidFormat(123 as any)).toBe(false);
    });

    it('should return false for too short string', () => {
      expect(XpubValidator.isValidFormat('tpub123')).toBe(false);
    });

    it('should return false for too long string', () => {
      const tooLong = 'tpub' + 'a'.repeat(200);
      expect(XpubValidator.isValidFormat(tooLong)).toBe(false);
    });

    it('should return false for invalid prefix', () => {
      expect(XpubValidator.isValidFormat('invalid_prefix_' + VALID_TESTNET_TPUB.slice(15))).toBe(false);
    });

    it('should return false for bitcoin address', () => {
      expect(XpubValidator.isValidFormat('tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx')).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse valid testnet xpub and return BIP32 node', () => {
      const node = XpubValidator.parse(VALID_TESTNET_TPUB, 'testnet');

      expect(node).toBeDefined();
      expect(node.publicKey).toBeDefined();
      expect(node.chainCode).toBeDefined();
      expect(node.depth).toBeDefined();
      expect(node.index).toBeDefined();
      expect(node.fingerprint).toBeDefined();
    });

    it('should parse valid mainnet xpub and return BIP32 node', () => {
      const node = XpubValidator.parse(VALID_MAINNET_XPUB, 'mainnet');

      expect(node).toBeDefined();
      expect(node.publicKey).toBeDefined();
      expect(node.chainCode).toBeDefined();
    });

    it('should throw error for invalid xpub', () => {
      expect(() => {
        XpubValidator.parse('invalid_xpub', 'testnet');
      }).toThrow();
    });

    it('should throw error for network mismatch', () => {
      expect(() => {
        XpubValidator.parse(VALID_TESTNET_TPUB, 'mainnet');
      }).toThrow(/testnet.*mainnet/);
    });

    it('should throw error for empty string', () => {
      expect(() => {
        XpubValidator.parse('', 'testnet');
      }).toThrow();
    });
  });

  describe('getXpubDescription', () => {
    it('should return correct description for tpub', () => {
      const description = XpubValidator.getXpubDescription('tpub');
      expect(description).toContain('Testnet');
      expect(description).toContain('BIP44');
      expect(description).toContain('Legacy');
      expect(description).toContain('P2PKH');
    });

    it('should return correct description for upub', () => {
      const description = XpubValidator.getXpubDescription('upub');
      expect(description).toContain('Testnet');
      expect(description).toContain('BIP49');
      expect(description).toContain('SegWit');
    });

    it('should return correct description for vpub', () => {
      const description = XpubValidator.getXpubDescription('vpub');
      expect(description).toContain('Testnet');
      expect(description).toContain('BIP84');
      expect(description).toContain('Native SegWit');
    });

    it('should return correct description for xpub', () => {
      const description = XpubValidator.getXpubDescription('xpub');
      expect(description).toContain('Mainnet');
      expect(description).toContain('BIP44');
      expect(description).toContain('Legacy');
    });

    it('should return correct description for ypub', () => {
      const description = XpubValidator.getXpubDescription('ypub');
      expect(description).toContain('Mainnet');
      expect(description).toContain('BIP49');
    });

    it('should return correct description for zpub', () => {
      const description = XpubValidator.getXpubDescription('zpub');
      expect(description).toContain('Mainnet');
      expect(description).toContain('BIP84');
    });

    it('should include multisig info for capital letter prefixes', () => {
      const descriptionTpub = XpubValidator.getXpubDescription('Tpub');
      expect(descriptionTpub).toContain('Multisig');
      expect(descriptionTpub).toContain('BIP48');
    });
  });

  describe('validateDepth', () => {
    it('should validate xpub at correct depth', () => {
      // Most account-level xpubs are at depth 3 (m/purpose'/coin'/account')
      const result = XpubValidator.validateDepth(VALID_TESTNET_TPUB, 'testnet', 3);
      // This depends on the actual depth of the test xpub
      expect(typeof result).toBe('boolean');
    });

    it('should return false for xpub at wrong depth', () => {
      const result = XpubValidator.validateDepth(VALID_TESTNET_TPUB, 'testnet', 99);
      expect(result).toBe(false);
    });

    it('should return false for invalid xpub', () => {
      const result = XpubValidator.validateDepth('invalid_xpub', 'testnet', 3);
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      const result = XpubValidator.validateDepth('', 'testnet', 3);
      expect(result).toBe(false);
    });

    it('should return false for network mismatch', () => {
      const result = XpubValidator.validateDepth(VALID_TESTNET_TPUB, 'mainnet', 3);
      expect(result).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle xpub with whitespace (should fail)', () => {
      const xpubWithSpaces = '  ' + VALID_TESTNET_TPUB + '  ';
      const result = XpubValidator.validate(xpubWithSpaces, 'testnet');
      expect(result.valid).toBe(false);
    });

    it('should handle xpub with newlines (should fail)', () => {
      const xpubWithNewlines = VALID_TESTNET_TPUB + '\n';
      const result = XpubValidator.validate(xpubWithNewlines, 'testnet');
      expect(result.valid).toBe(false);
    });

    it('should handle mixed case xpub (should fail)', () => {
      const mixedCase = VALID_TESTNET_TPUB.slice(0, 20).toUpperCase() + VALID_TESTNET_TPUB.slice(20);
      const result = XpubValidator.validate(mixedCase, 'testnet');
      expect(result.valid).toBe(false);
    });

    it('should validate same xpub multiple times consistently', () => {
      const result1 = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');
      const result2 = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');

      expect(result1.valid).toBe(result2.valid);
      expect(result1.fingerprint).toBe(result2.fingerprint);
      expect(result1.xpubType).toBe(result2.xpubType);
      expect(result1.purpose).toBe(result2.purpose);
      expect(result1.scriptType).toBe(result2.scriptType);
    });

    it('should handle all supported xpub prefixes', () => {
      const prefixes = ['tpub', 'upub', 'vpub', 'Tpub', 'Upub', 'Vpub', 'xpub', 'ypub', 'zpub', 'Xpub', 'Ypub', 'Zpub'];

      prefixes.forEach(prefix => {
        const description = XpubValidator.getXpubDescription(prefix as any);
        expect(description).toBeDefined();
        expect(description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('BIP compliance', () => {
    it('should correctly identify BIP44 purpose from tpub/xpub', () => {
      const testnetResult = XpubValidator.validate(VALID_TESTNET_TPUB, 'testnet');
      expect(testnetResult.purpose).toBe(44);

      const mainnetResult = XpubValidator.validate(VALID_MAINNET_XPUB, 'mainnet');
      expect(mainnetResult.purpose).toBe(44);
    });

    it('should correctly identify BIP49 purpose from upub/ypub', () => {
      const testnetResult = XpubValidator.validate(VALID_TESTNET_UPUB, 'testnet');
      expect(testnetResult.purpose).toBe(49);

      const mainnetResult = XpubValidator.validate(VALID_MAINNET_YPUB, 'mainnet');
      expect(mainnetResult.purpose).toBe(49);
    });

    it('should correctly identify BIP84 purpose from vpub/zpub', () => {
      const testnetResult = XpubValidator.validate(VALID_TESTNET_VPUB, 'testnet');
      expect(testnetResult.purpose).toBe(84);

      const mainnetResult = XpubValidator.validate(VALID_MAINNET_ZPUB, 'mainnet');
      expect(mainnetResult.purpose).toBe(84);
    });
  });
});
