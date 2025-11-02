/**
 * KeyManager Test Suite
 *
 * Comprehensive tests for BIP39 mnemonic operations including:
 * - Mnemonic generation
 * - Mnemonic validation
 * - Seed derivation
 * - Entropy conversions
 * - BIP39 test vectors
 *
 * Security-critical code - requires 100% coverage
 *
 * @jest-environment node
 */

import { KeyManager } from '../KeyManager';
import * as bip39 from 'bip39';

describe('KeyManager', () => {
  describe('generateMnemonic', () => {
    it('should generate a 12-word mnemonic by default', () => {
      const mnemonic = KeyManager.generateMnemonic();
      const words = mnemonic.split(' ');

      expect(words.length).toBe(12);
    });

    it('should generate a 24-word mnemonic with 256-bit strength', () => {
      const mnemonic = KeyManager.generateMnemonic(256);
      const words = mnemonic.split(' ');

      expect(words.length).toBe(24);
    });

    it('should generate valid BIP39 mnemonics', () => {
      const mnemonic = KeyManager.generateMnemonic();
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should generate different mnemonics each time', () => {
      const mnemonics = new Set();
      for (let i = 0; i < 10; i++) {
        mnemonics.add(KeyManager.generateMnemonic());
      }
      expect(mnemonics.size).toBe(10);
    });

    it('should support all valid BIP39 strengths', () => {
      const validStrengths = [128, 160, 192, 224, 256];
      const expectedWords = [12, 15, 18, 21, 24];

      validStrengths.forEach((strength, i) => {
        const mnemonic = KeyManager.generateMnemonic(strength);
        const words = mnemonic.split(' ');
        expect(words.length).toBe(expectedWords[i]);
        expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
      });
    });

    it('should throw error for invalid strength', () => {
      expect(() => KeyManager.generateMnemonic(100)).toThrow(
        'Invalid entropy strength'
      );
    });

    it('should throw error for strength of 0', () => {
      expect(() => KeyManager.generateMnemonic(0)).toThrow(
        'Invalid entropy strength'
      );
    });

    it('should throw error for negative strength', () => {
      expect(() => KeyManager.generateMnemonic(-128)).toThrow(
        'Invalid entropy strength'
      );
    });
  });

  describe('validateMnemonic', () => {
    it('should validate correct 12-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should validate correct 24-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should reject mnemonic with invalid checksum', () => {
      // Changed last word to invalidate checksum
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(false);
    });

    it('should reject mnemonic with invalid words', () => {
      const mnemonic = 'notaword abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(false);
    });

    it('should reject mnemonic with wrong number of words', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(KeyManager.validateMnemonic('')).toBe(false);
    });

    it('should normalize extra whitespace', () => {
      const mnemonic = '  abandon   abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon about  ';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should handle mnemonics with tabs and newlines', () => {
      const mnemonic = 'abandon\tabandon\nabandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should reject single word', () => {
      expect(KeyManager.validateMnemonic('abandon')).toBe(false);
    });

    it('should reject non-string input gracefully', () => {
      expect(KeyManager.validateMnemonic(null as any)).toBe(false);
      expect(KeyManager.validateMnemonic(undefined as any)).toBe(false);
      expect(KeyManager.validateMnemonic(123 as any)).toBe(false);
    });
  });

  describe('mnemonicToSeed', () => {
    it('should convert valid mnemonic to 64-byte seed', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const seed = KeyManager.mnemonicToSeed(mnemonic);

      expect(Buffer.isBuffer(seed)).toBe(true);
      expect(seed.length).toBe(64);
    });

    it('should produce deterministic seed for same mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      const seed1 = KeyManager.mnemonicToSeed(mnemonic);
      const seed2 = KeyManager.mnemonicToSeed(mnemonic);

      expect(seed1.equals(seed2)).toBe(true);
    });

    it('should produce different seeds for different mnemonics', () => {
      const mnemonic1 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const mnemonic2 = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

      const seed1 = KeyManager.mnemonicToSeed(mnemonic1);
      const seed2 = KeyManager.mnemonicToSeed(mnemonic2);

      expect(seed1.equals(seed2)).toBe(false);
    });

    it('should support BIP39 test vector 1', () => {
      // Official BIP39 test vector
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const expectedSeedHex = '5eb00bbddcf069084889a8ab9155568165f5c453ccb85e70811aaed6f6da5fc19a5ac40b389cd370d086206dec8aa6c43daea6690f20ad3d8d48b2d2ce9e38e4';

      const seed = KeyManager.mnemonicToSeed(mnemonic);
      expect(seed.toString('hex')).toBe(expectedSeedHex);
    });

    it('should support BIP39 test vector 2', () => {
      const mnemonic = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
      const expectedSeedHex = '878386efb78845b3355bd15ea4d39ef97d179cb712b77d5c12b6be415fffeffe5f377ba02bf3f8544ab800b955e51fbff09828f682052a20faa6addbbddfb096';

      const seed = KeyManager.mnemonicToSeed(mnemonic);
      expect(seed.toString('hex')).toBe(expectedSeedHex);
    });

    it('should support passphrase (25th word)', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const passphrase = 'TREZOR';

      const seed = KeyManager.mnemonicToSeed(mnemonic, passphrase);
      expect(Buffer.isBuffer(seed)).toBe(true);
      expect(seed.length).toBe(64);

      // Seed with passphrase should be different from seed without passphrase
      const seedWithout = KeyManager.mnemonicToSeed(mnemonic);
      expect(seed.equals(seedWithout)).toBe(false);
    });

    it('should produce different seeds for different passphrases', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      const seed1 = KeyManager.mnemonicToSeed(mnemonic, 'passphrase1');
      const seed2 = KeyManager.mnemonicToSeed(mnemonic, 'passphrase2');

      expect(seed1.equals(seed2)).toBe(false);
    });

    it('should throw error for invalid mnemonic', () => {
      const invalidMnemonic = 'invalid mnemonic phrase here';

      expect(() => KeyManager.mnemonicToSeed(invalidMnemonic)).toThrow(
        'Invalid mnemonic phrase'
      );
    });

    it('should handle empty passphrase as valid', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      const seed = KeyManager.mnemonicToSeed(mnemonic, '');
      expect(Buffer.isBuffer(seed)).toBe(true);
    });

    it('should normalize whitespace before conversion', () => {
      const mnemonic = '  abandon   abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon about  ';

      const seed = KeyManager.mnemonicToSeed(mnemonic);
      expect(Buffer.isBuffer(seed)).toBe(true);
      expect(seed.length).toBe(64);
    });
  });

  describe('mnemonicToEntropy', () => {
    it('should extract entropy from 12-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const entropy = KeyManager.mnemonicToEntropy(mnemonic);

      expect(typeof entropy).toBe('string');
      expect(entropy.length).toBe(32); // 128 bits = 32 hex chars
    });

    it('should extract entropy from 24-word mnemonic', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';
      const entropy = KeyManager.mnemonicToEntropy(mnemonic);

      expect(typeof entropy).toBe('string');
      expect(entropy.length).toBe(64); // 256 bits = 64 hex chars
    });

    it('should extract correct entropy for test vector', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
      const expectedEntropy = '00000000000000000000000000000000';

      const entropy = KeyManager.mnemonicToEntropy(mnemonic);
      expect(entropy).toBe(expectedEntropy);
    });

    it('should throw error for invalid mnemonic', () => {
      const invalidMnemonic = 'invalid phrase here';

      expect(() => KeyManager.mnemonicToEntropy(invalidMnemonic)).toThrow(
        'Invalid mnemonic phrase'
      );
    });

    it('should normalize whitespace before extraction', () => {
      const mnemonic = '  abandon   abandon  abandon abandon abandon abandon abandon abandon abandon abandon abandon about  ';
      const expectedEntropy = '00000000000000000000000000000000';

      const entropy = KeyManager.mnemonicToEntropy(mnemonic);
      expect(entropy).toBe(expectedEntropy);
    });
  });

  describe('entropyToMnemonic', () => {
    it('should convert 128-bit entropy to 12-word mnemonic', () => {
      const entropy = '00000000000000000000000000000000';
      const mnemonic = KeyManager.entropyToMnemonic(entropy);
      const words = mnemonic.split(' ');

      expect(words.length).toBe(12);
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should convert 256-bit entropy to 24-word mnemonic', () => {
      const entropy = '0000000000000000000000000000000000000000000000000000000000000000';
      const mnemonic = KeyManager.entropyToMnemonic(entropy);
      const words = mnemonic.split(' ');

      expect(words.length).toBe(24);
      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should produce correct mnemonic for test vector', () => {
      const entropy = '00000000000000000000000000000000';
      const expectedMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      const mnemonic = KeyManager.entropyToMnemonic(entropy);
      expect(mnemonic).toBe(expectedMnemonic);
    });

    it('should accept Buffer as entropy', () => {
      const entropyBuffer = Buffer.from('00000000000000000000000000000000', 'hex');
      const mnemonic = KeyManager.entropyToMnemonic(entropyBuffer);

      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should round-trip entropy to mnemonic and back', () => {
      const originalEntropy = '7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f7f';
      const mnemonic = KeyManager.entropyToMnemonic(originalEntropy);
      const extractedEntropy = KeyManager.mnemonicToEntropy(mnemonic);

      expect(extractedEntropy).toBe(originalEntropy);
    });

    it('should throw error for invalid entropy length', () => {
      const invalidEntropy = '1234'; // Too short

      expect(() => KeyManager.entropyToMnemonic(invalidEntropy)).toThrow();
    });

    it('should throw error for invalid hex string', () => {
      const invalidEntropy = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';

      expect(() => KeyManager.entropyToMnemonic(invalidEntropy)).toThrow();
    });
  });

  describe('getWordList', () => {
    it('should return array of 2048 words', () => {
      const wordList = KeyManager.getWordList();

      expect(Array.isArray(wordList)).toBe(true);
      expect(wordList.length).toBe(2048);
    });

    it('should return BIP39 English word list', () => {
      const wordList = KeyManager.getWordList();

      // Check first and last words
      expect(wordList[0]).toBe('abandon');
      expect(wordList[2047]).toBe('zoo');
    });

    it('should contain common BIP39 words', () => {
      const wordList = KeyManager.getWordList();

      expect(wordList).toContain('abandon');
      expect(wordList).toContain('ability');
      expect(wordList).toContain('able');
      expect(wordList).toContain('about');
      expect(wordList).toContain('zoo');
    });

    it('should return same array reference', () => {
      const wordList1 = KeyManager.getWordList();
      const wordList2 = KeyManager.getWordList();

      expect(wordList1).toBe(wordList2);
    });
  });

  describe('BIP39 compliance', () => {
    it('should use the same wordlist as bip39 library', () => {
      const keyManagerWords = KeyManager.getWordList();
      const bip39Words = bip39.wordlists.english;

      expect(keyManagerWords).toEqual(bip39Words);
    });

    it('should generate mnemonics compatible with bip39 library', () => {
      const mnemonic = KeyManager.generateMnemonic();

      // Should be valid according to bip39 library
      expect(bip39.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should validate mnemonics generated by bip39 library', () => {
      const mnemonic = bip39.generateMnemonic();

      expect(KeyManager.validateMnemonic(mnemonic)).toBe(true);
    });

    it('should produce same seed as bip39 library', () => {
      const mnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      const keyManagerSeed = KeyManager.mnemonicToSeed(mnemonic);
      const bip39Seed = bip39.mnemonicToSeedSync(mnemonic);

      expect(keyManagerSeed.equals(bip39Seed)).toBe(true);
    });
  });
});
