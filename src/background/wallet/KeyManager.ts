/**
 * KeyManager - BIP39 Mnemonic Generation and Seed Derivation
 *
 * This module handles the generation and validation of BIP39 mnemonic phrases
 * and their conversion to binary seeds for HD wallet derivation.
 *
 * Also supports private key imports (WIF format) for single accounts.
 *
 * BIP39 Standard: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 *
 * Security Notes:
 * - Never log or expose mnemonic phrases or seeds
 * - Seeds should only exist in memory during active wallet operations
 * - Use proper entropy sources (crypto.getRandomValues via bip39 library)
 */

import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

// Initialize ECPair with secp256k1
const ECPair = ECPairFactory(ecc);

/**
 * KeyManager class for BIP39 operations
 *
 * Responsibilities:
 * 1. Generate cryptographically secure mnemonic phrases
 * 2. Validate mnemonic phrases (checksum and word list verification)
 * 3. Convert mnemonics to binary seeds for HD wallet derivation
 */
export class KeyManager {
  /**
   * Generates a new BIP39 mnemonic phrase
   *
   * @param strength - Entropy strength in bits (128 = 12 words, 256 = 24 words)
   * @returns A space-separated mnemonic phrase
   *
   * @throws {Error} If strength is invalid (must be 128, 160, 192, 224, or 256)
   *
   * Implementation:
   * - Uses crypto.getRandomValues internally via bip39 library
   * - Generates 128 bits of entropy by default (12 words)
   * - Adds checksum bits per BIP39 specification
   * - Maps to English word list (2048 words)
   *
   * BIP39 Entropy to Mnemonic:
   * - 128 bits → 12 words (ENT=128, CS=4, MS=132)
   * - 256 bits → 24 words (ENT=256, CS=8, MS=264)
   * Where: ENT=Entropy, CS=Checksum, MS=Mnemonic Sentence
   */
  static generateMnemonic(strength: number = 128): string {
    try {
      // Validate strength parameter
      const validStrengths = [128, 160, 192, 224, 256];
      if (!validStrengths.includes(strength)) {
        throw new Error(
          `Invalid entropy strength: ${strength}. Must be one of: ${validStrengths.join(', ')}`
        );
      }

      // Generate mnemonic using bip39 library
      // This uses crypto.getRandomValues internally for secure randomness
      const mnemonic = bip39.generateMnemonic(strength);

      return mnemonic;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate mnemonic: ${message}`);
    }
  }

  /**
   * Validates a BIP39 mnemonic phrase
   *
   * @param mnemonic - Space-separated mnemonic phrase to validate
   * @returns true if valid, false otherwise
   *
   * Validation checks:
   * 1. All words are in the BIP39 English word list
   * 2. Correct number of words (12, 15, 18, 21, or 24)
   * 3. Checksum is valid (last few bits derived from SHA256 hash)
   *
   * Note: This performs both word list and checksum validation per BIP39
   */
  static validateMnemonic(mnemonic: string): boolean {
    try {
      // Normalize whitespace (remove extra spaces, trim)
      const normalizedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');

      // Validate using bip39 library
      // This checks both word list membership and checksum validity
      return bip39.validateMnemonic(normalizedMnemonic);
    } catch (error) {
      // Any error during validation means invalid mnemonic
      return false;
    }
  }

  /**
   * Converts a BIP39 mnemonic to a binary seed
   *
   * @param mnemonic - Valid BIP39 mnemonic phrase
   * @param passphrase - Optional passphrase for additional security (default: empty string)
   * @returns Buffer containing 512-bit (64 byte) binary seed
   *
   * @throws {Error} If mnemonic is invalid
   *
   * BIP39 Seed Derivation:
   * - Uses PBKDF2-HMAC-SHA512
   * - 2048 iterations
   * - Salt: "mnemonic" + passphrase (UTF-8 normalized)
   * - Output: 512 bits (64 bytes)
   *
   * Security Notes:
   * - Passphrase acts as a "25th word" for additional security
   * - Empty passphrase is valid and common
   * - Different passphrases generate completely different wallets
   * - This seed is used as input for BIP32 master key derivation
   *
   * @example
   * const mnemonic = "abandon abandon abandon ... art";
   * const seed = KeyManager.mnemonicToSeed(mnemonic);
   * // seed is now a 64-byte Buffer ready for BIP32 derivation
   */
  static mnemonicToSeed(mnemonic: string, passphrase: string = ''): Buffer {
    try {
      // Normalize mnemonic whitespace
      const normalizedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');

      // Validate mnemonic before conversion
      if (!this.validateMnemonic(normalizedMnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Convert mnemonic to seed using BIP39 standard
      // PBKDF2-HMAC-SHA512 with 2048 iterations
      // Salt: "mnemonic" + passphrase
      const seed = bip39.mnemonicToSeedSync(normalizedMnemonic, passphrase);

      return seed;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert mnemonic to seed: ${message}`);
    }
  }

  /**
   * Gets the entropy from a mnemonic phrase
   *
   * @param mnemonic - Valid BIP39 mnemonic phrase
   * @returns Hex string of the entropy
   *
   * @throws {Error} If mnemonic is invalid
   *
   * Note: This is primarily for testing and verification.
   * In production, you typically work with the mnemonic directly.
   */
  static mnemonicToEntropy(mnemonic: string): string {
    try {
      const normalizedMnemonic = mnemonic.trim().replace(/\s+/g, ' ');

      if (!this.validateMnemonic(normalizedMnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      // Extract entropy from mnemonic
      const entropy = bip39.mnemonicToEntropy(normalizedMnemonic);
      return entropy;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract entropy: ${message}`);
    }
  }

  /**
   * Converts entropy to a mnemonic phrase
   *
   * @param entropy - Hex string or Buffer of entropy
   * @returns BIP39 mnemonic phrase
   *
   * @throws {Error} If entropy is invalid
   *
   * Note: Entropy length must be 128-256 bits and a multiple of 32 bits
   */
  static entropyToMnemonic(entropy: string | Buffer): string {
    try {
      const mnemonic = bip39.entropyToMnemonic(entropy);
      return mnemonic;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert entropy to mnemonic: ${message}`);
    }
  }

  /**
   * Gets the word list used for mnemonic generation
   *
   * @returns Array of 2048 BIP39 English words
   *
   * Note: BIP39 supports multiple languages, but English is the standard
   * and most widely supported across wallets.
   */
  static getWordList(): string[] {
    return bip39.wordlists.english;
  }

  /**
   * Validates a WIF (Wallet Import Format) private key
   *
   * @param wif - WIF format private key string
   * @param network - Bitcoin network ('testnet' or 'mainnet')
   * @returns true if valid WIF for the network, false otherwise
   *
   * WIF Format:
   * - Mainnet: Starts with 5, K, or L (uncompressed/compressed)
   * - Testnet: Starts with 9 or c (uncompressed/compressed)
   * - Base58Check encoded
   * - Contains checksum
   *
   * Security Note:
   * - This only validates format, not whether the key controls any funds
   */
  static validateWIF(wif: string, network: 'testnet' | 'mainnet' = 'testnet'): boolean {
    try {
      const networkObj = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

      // Attempt to decode WIF - will throw if invalid
      ECPair.fromWIF(wif, networkObj);

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decodes a WIF private key and returns key information
   *
   * @param wif - WIF format private key
   * @param network - Bitcoin network
   * @returns Object with private key and public key info
   *
   * @throws {Error} If WIF is invalid
   *
   * Use Cases:
   * - Import private key from paper wallet
   * - Verify private key before storage
   * - Derive address from private key
   */
  static decodeWIF(
    wif: string,
    network: 'testnet' | 'mainnet' = 'testnet'
  ): {
    privateKey: string;    // Hex format
    publicKey: string;     // Hex format
    compressed: boolean;   // Whether key is compressed
  } {
    try {
      const networkObj = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

      // Decode WIF to get ECPair (key pair)
      const keyPair = ECPair.fromWIF(wif, networkObj);

      if (!keyPair.privateKey) {
        throw new Error('Failed to extract private key from WIF');
      }

      return {
        privateKey: Buffer.from(keyPair.privateKey).toString('hex'),
        publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
        compressed: keyPair.compressed || false,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to decode WIF: ${message}`);
    }
  }

  /**
   * Converts a private key (hex) to WIF format
   *
   * @param privateKeyHex - Private key in hex format
   * @param network - Bitcoin network
   * @param compressed - Whether to use compressed format (default: true)
   * @returns WIF format private key
   *
   * @throws {Error} If private key is invalid
   *
   * Note: Compressed format is recommended for modern wallets
   */
  static privateKeyToWIF(
    privateKeyHex: string,
    network: 'testnet' | 'mainnet' = 'testnet',
    compressed: boolean = true
  ): string {
    try {
      const networkObj = network === 'testnet' ? bitcoin.networks.testnet : bitcoin.networks.bitcoin;

      // Convert hex to buffer
      const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');

      // Create ECPair from private key
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
        network: networkObj,
        compressed,
      });

      // Convert to WIF
      return keyPair.toWIF();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert private key to WIF: ${message}`);
    }
  }
}
