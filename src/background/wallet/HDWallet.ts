/**
 * HDWallet - Hierarchical Deterministic Wallet Implementation
 *
 * Implements BIP32 (HD Wallets) and BIP44 (Multi-Account Hierarchy) standards
 * for Bitcoin key derivation and account management.
 *
 * Standards:
 * - BIP32: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 * - BIP44: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 * - BIP49: https://github.com/bitcoin/bips/blob/master/bip-0049.mediawiki (SegWit in P2SH)
 * - BIP84: https://github.com/bitcoin/bips/blob/master/bip-0084.mediawiki (Native SegWit)
 *
 * BIP44 Path Structure: m / purpose' / coin_type' / account' / change / address_index
 * - purpose': 44 (legacy), 49 (segwit), 84 (native-segwit)
 * - coin_type': 0 (mainnet), 1 (testnet)
 * - account': Account index (hardened)
 * - change: 0 (external/receiving), 1 (internal/change)
 * - address_index: Address index (non-hardened)
 *
 * Security Notes:
 * - Master private key should only exist in memory
 * - Use hardened derivation (') for account level to prevent key leakage
 * - Never expose or log private keys
 */

import { BIP32Interface, BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import { DERIVATION_PATHS, COIN_TYPES, NETWORKS } from '../../shared/constants';
import type { AddressType, Account } from '../../shared/types';

// Initialize bip32 with tiny-secp256k1
const bip32 = BIP32Factory(ecc);

/**
 * HDWallet class for BIP32/BIP44 hierarchical deterministic wallet operations
 *
 * Responsibilities:
 * 1. Create HD wallet from seed
 * 2. Derive keys according to BIP44/49/84 paths
 * 3. Manage multiple accounts
 * 4. Derive child keys for addresses
 */
export class HDWallet {
  private masterNode: BIP32Interface;
  private network: 'testnet' | 'mainnet';

  /**
   * Creates an HD wallet from a BIP39 seed
   *
   * @param seed - 64-byte seed from BIP39 mnemonic
   * @param network - Bitcoin network ('testnet' or 'mainnet')
   *
   * @throws {Error} If seed is invalid or key derivation fails
   *
   * BIP32 Master Key Derivation:
   * - Input: 512-bit seed (64 bytes)
   * - Process: HMAC-SHA512 with key "Bitcoin seed"
   * - Output: 512 bits split into:
   *   - Left 256 bits: Master private key
   *   - Right 256 bits: Master chain code
   */
  constructor(seed: Buffer, network: 'testnet' | 'mainnet' = 'testnet') {
    try {
      if (!seed || seed.length !== 64) {
        throw new Error('Invalid seed: must be 64 bytes');
      }

      this.network = network;

      // Derive master node from seed using BIP32
      // This creates the root of the HD wallet tree
      // IMPORTANT: Must specify network for correct xpub prefix (tpub for testnet, xpub for mainnet)
      this.masterNode = bip32.fromSeed(seed, NETWORKS[network]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create HD wallet: ${message}`);
    }
  }

  /**
   * Gets the master node (root of the HD tree)
   *
   * @returns BIP32 master node
   *
   * Warning: This exposes the master private key. Use with caution.
   * In production, this should only be used internally.
   */
  getMasterNode(): BIP32Interface {
    return this.masterNode;
  }

  /**
   * Derives a BIP32 node at a specific derivation path
   *
   * @param path - BIP32 derivation path (e.g., "m/44'/1'/0'/0/0")
   * @returns BIP32 node at the specified path
   *
   * @throws {Error} If path is invalid or derivation fails
   *
   * Path notation:
   * - m: master node
   * - /: path separator
   * - ': hardened derivation (adds 2^31 to index)
   * - Numbers: child index
   *
   * Example paths:
   * - m/44'/1'/0'/0/0: First receiving address, first account, testnet, legacy
   * - m/84'/1'/0'/1/0: First change address, first account, testnet, native segwit
   */
  derivePath(path: string): BIP32Interface {
    try {
      if (!path || !path.startsWith('m')) {
        throw new Error('Invalid derivation path: must start with "m"');
      }

      // Derive node at path from master node
      const node = this.masterNode.derivePath(path);
      return node;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to derive path "${path}": ${message}`);
    }
  }

  /**
   * Derives an account node according to BIP44 standard
   *
   * @param addressType - Type of address (determines BIP purpose)
   * @param accountIndex - Account index (0-based)
   * @returns BIP32 node at account level
   *
   * @throws {Error} If parameters are invalid or derivation fails
   *
   * BIP44 Account Level Path:
   * - Legacy (P2PKH): m/44'/coin_type'/account'
   * - SegWit (P2SH-P2WPKH): m/49'/coin_type'/account'
   * - Native SegWit (P2WPKH): m/84'/coin_type'/account'
   *
   * Note: Account level uses hardened derivation for security
   */
  deriveAccountNode(
    addressType: AddressType,
    accountIndex: number
  ): BIP32Interface {
    try {
      // Validate account index
      if (accountIndex < 0 || !Number.isInteger(accountIndex)) {
        throw new Error('Account index must be a non-negative integer');
      }

      // Get coin type for current network
      const coinType = COIN_TYPES[this.network];

      // Build account-level path based on address type
      // This stops at the account level (m/purpose'/coin_type'/account')
      // Individual addresses will be derived from this node
      let accountPath: string;

      switch (addressType) {
        case 'legacy':
          // BIP44: m/44'/coin_type'/account'
          accountPath = `m/44'/${coinType}'/${accountIndex}'`;
          break;
        case 'segwit':
          // BIP49: m/49'/coin_type'/account'
          accountPath = `m/49'/${coinType}'/${accountIndex}'`;
          break;
        case 'native-segwit':
          // BIP84: m/84'/coin_type'/account'
          accountPath = `m/84'/${coinType}'/${accountIndex}'`;
          break;
        default:
          throw new Error(`Unsupported address type: ${addressType}`);
      }

      // Derive and return the account node
      return this.derivePath(accountPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to derive account node (type: ${addressType}, index: ${accountIndex}): ${message}`
      );
    }
  }

  /**
   * Derives a specific address key from an account
   *
   * @param addressType - Type of address
   * @param accountIndex - Account index
   * @param change - 0 for external (receiving), 1 for internal (change)
   * @param addressIndex - Address index
   * @returns BIP32 node containing the key pair for this address
   *
   * @throws {Error} If parameters are invalid or derivation fails
   *
   * Full derivation path examples:
   * - m/44'/1'/0'/0/0: First receiving address, testnet legacy
   * - m/49'/1'/0'/1/5: Sixth change address, testnet segwit
   * - m/84'/1'/2'/0/10: Eleventh receiving address, third account, native segwit
   */
  deriveAddressNode(
    addressType: AddressType,
    accountIndex: number,
    change: 0 | 1,
    addressIndex: number
  ): BIP32Interface {
    try {
      // Validate parameters
      if (change !== 0 && change !== 1) {
        throw new Error('Change must be 0 (external) or 1 (internal)');
      }

      if (addressIndex < 0 || !Number.isInteger(addressIndex)) {
        throw new Error('Address index must be a non-negative integer');
      }

      // Get coin type
      const coinType = COIN_TYPES[this.network];

      // Get derivation path function for address type
      const pathFunction = DERIVATION_PATHS[addressType];
      if (!pathFunction) {
        throw new Error(`Unsupported address type: ${addressType}`);
      }

      // Build full derivation path
      const fullPath = pathFunction(coinType, accountIndex, change, addressIndex);

      // Derive and return the address node
      return this.derivePath(fullPath);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to derive address node (type: ${addressType}, account: ${accountIndex}, ` +
          `change: ${change}, index: ${addressIndex}): ${message}`
      );
    }
  }

  /**
   * Creates an account structure for storage
   *
   * @param addressType - Type of addresses for this account
   * @param accountIndex - Account index
   * @param name - User-friendly account name
   * @returns Account object ready for storage
   *
   * Note: This creates the account metadata structure but does not
   * generate addresses. Use AddressGenerator for address creation.
   */
  createAccount(
    addressType: AddressType,
    accountIndex: number,
    name?: string
  ): Account {
    try {
      // Validate that we can derive this account
      this.deriveAccountNode(addressType, accountIndex);

      // Create account structure
      const account: Account = {
        accountType: 'single',
        index: accountIndex,
        name: name || `Account ${accountIndex + 1}`,
        addressType,
        externalIndex: 0, // Start with no addresses generated
        internalIndex: 0,
        addresses: [], // Addresses will be added by AddressGenerator
      };

      return account;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create account: ${message}`);
    }
  }

  /**
   * Gets the current network
   *
   * @returns Current network setting
   */
  getNetwork(): 'testnet' | 'mainnet' {
    return this.network;
  }

  /**
   * Exports the master public key (xpub) for watch-only wallets
   *
   * @returns Base58-encoded extended public key
   *
   * Note: The xpub can derive all public keys and addresses but
   * cannot sign transactions. Useful for watch-only wallets.
   *
   * Warning: Sharing xpub reveals all addresses in the wallet.
   * Use account-level xpubs for better privacy.
   */
  getExtendedPublicKey(): string {
    return this.masterNode.toBase58();
  }

  /**
   * Exports an account's extended public key
   *
   * @param addressType - Type of address
   * @param accountIndex - Account index
   * @returns Base58-encoded extended public key for the account
   *
   * This is safer than sharing the master xpub as it only exposes
   * one account's addresses.
   */
  getAccountExtendedPublicKey(
    addressType: AddressType,
    accountIndex: number
  ): string {
    const accountNode = this.deriveAccountNode(addressType, accountIndex);
    return accountNode.neutered().toBase58();
  }

  /**
   * Validates a derivation path format
   *
   * @param path - Derivation path to validate
   * @returns true if path format is valid
   *
   * Valid format: m/[0-9]+'?/[0-9]+'?/...
   */
  static isValidPath(path: string): boolean {
    if (!path || !path.startsWith('m')) {
      return false;
    }

    // Regex pattern for BIP32 derivation paths
    // Matches: m/44'/0'/0'/0/0 or m/44/0/0/0/0 etc.
    const pathRegex = /^m(\/\d+'?)*$/;
    return pathRegex.test(path);
  }
}
