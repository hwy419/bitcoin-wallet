/**
 * MultisigManager - Multi-Signature Wallet Management
 *
 * This module handles the creation and management of multi-signature accounts.
 * Supports configurations: 2-of-2, 2-of-3, and 3-of-5
 *
 * Key Responsibilities:
 * 1. Create multisig accounts with specific M-of-N configurations
 * 2. Validate and import co-signer extended public keys (xpubs)
 * 3. Export our xpub for sharing with co-signers
 * 4. Validate multisig configurations
 * 5. Manage co-signer information
 *
 * BIP Standards:
 * - BIP48: Derivation scheme for multisig wallets
 * - BIP67: Deterministic Pay-to-script-hash multi-signature addresses
 * - BIP174: Partially Signed Bitcoin Transaction Format (PSBT)
 *
 * Security Notes:
 * - Only public keys (xpubs) are handled in this class
 * - Never log or expose private keys
 * - Validate all xpubs before accepting
 * - Verify fingerprints with co-signers in person
 */

import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface, BIP32Factory } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import {
  MultisigConfig,
  MultisigAddressType,
  MultisigAccount,
  Cosigner,
} from '../../shared/types';
import { NETWORKS } from '../../shared/constants';

// Initialize BIP32 with secp256k1
const bip32 = BIP32Factory(ecc);

/**
 * Configuration details for each supported multisig type
 */
interface MultisigConfigDetails {
  m: number; // Required signatures
  n: number; // Total co-signers
  name: string;
  description: string;
  riskLevel: 'high' | 'low' | 'very-low';
}

/**
 * Supported multisig configurations
 */
const MULTISIG_CONFIGS: Record<MultisigConfig, MultisigConfigDetails> = {
  '2-of-2': {
    m: 2,
    n: 2,
    name: 'Personal Security',
    description: 'Both signatures required - Higher risk if one key is lost',
    riskLevel: 'high',
  },
  '2-of-3': {
    m: 2,
    n: 3,
    name: 'Shared Account',
    description: 'Any 2 of 3 signatures required - Recommended for most users',
    riskLevel: 'low',
  },
  '3-of-5': {
    m: 3,
    n: 5,
    name: 'Organization',
    description: 'Any 3 of 5 signatures required - Best for businesses',
    riskLevel: 'very-low',
  },
};

/**
 * MultisigManager class for creating and managing multi-signature accounts
 */
export class MultisigManager {
  private network: bitcoin.Network;
  private networkName: 'testnet' | 'mainnet';

  /**
   * Creates a MultisigManager instance
   *
   * @param network - Bitcoin network ('testnet' or 'mainnet')
   */
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.networkName = network;
    this.network = NETWORKS[network];
  }

  /**
   * Creates a new multisig account
   *
   * @param params - Account creation parameters
   * @returns MultisigAccount object
   *
   * @throws {Error} If configuration is invalid or xpubs are missing
   *
   * Example:
   * ```typescript
   * const manager = new MultisigManager('testnet');
   * const account = manager.createMultisigAccount({
   *   config: '2-of-3',
   *   addressType: 'p2wsh',
   *   name: 'Business Account',
   *   accountIndex: 0,
   *   ourXpub: 'tpub...',
   *   ourFingerprint: 'A1B2C3D4',
   *   cosignerXpubs: [
   *     { name: 'Alice', xpub: 'tpub...', fingerprint: 'E5F6G7H8' },
   *     { name: 'Bob', xpub: 'tpub...', fingerprint: 'I9J0K1L2' }
   *   ]
   * });
   * ```
   */
  createMultisigAccount(params: {
    config: MultisigConfig;
    addressType: MultisigAddressType;
    name: string;
    accountIndex: number;
    ourXpub: string;
    ourFingerprint: string;
    cosignerXpubs: Array<{ name: string; xpub: string; fingerprint: string }>;
  }): MultisigAccount {
    try {
      // 1. Validate configuration
      this.validateConfig(params.config);

      const configDetails = MULTISIG_CONFIGS[params.config];

      // 2. Validate we have the correct number of co-signers
      const totalCosigners = 1 + params.cosignerXpubs.length; // 1 (us) + others
      if (totalCosigners !== configDetails.n) {
        throw new Error(
          `${params.config} requires ${configDetails.n} co-signers, but ${totalCosigners} provided`
        );
      }

      // 3. Validate all xpubs
      this.validateXpubStrict(params.ourXpub);
      for (const cosigner of params.cosignerXpubs) {
        this.validateXpubStrict(cosigner.xpub);
      }

      // 4. Create cosigner list (us first, then others)
      const cosigners: Cosigner[] = [
        {
          name: 'You',
          xpub: params.ourXpub,
          fingerprint: params.ourFingerprint,
          derivationPath: this.getDerivationPath(
            params.config,
            params.addressType,
            params.accountIndex
          ),
          isSelf: true,
        },
        ...params.cosignerXpubs.map((c) => ({
          name: c.name,
          xpub: c.xpub,
          fingerprint: c.fingerprint,
          derivationPath: this.getDerivationPath(
            params.config,
            params.addressType,
            params.accountIndex
          ),
          isSelf: false,
        })),
      ];

      // 5. Create and return multisig account
      const account: MultisigAccount = {
        accountType: 'multisig',
        index: params.accountIndex,
        name: params.name,
        multisigConfig: params.config,
        addressType: params.addressType,
        cosigners,
        externalIndex: 0,
        internalIndex: 0,
        addresses: [],
      };

      return account;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create multisig account: ${message}`);
    }
  }

  /**
   * Validates a multisig configuration
   *
   * @param config - Configuration to validate
   * @throws {Error} If configuration is not supported
   */
  validateConfig(config: MultisigConfig): void {
    if (!MULTISIG_CONFIGS[config]) {
      throw new Error(
        `Unsupported multisig configuration: ${config}. ` +
          `Supported: 2-of-2, 2-of-3, 3-of-5`
      );
    }
  }

  /**
   * Validates an extended public key (xpub) with detailed validation results
   *
   * @param xpub - Extended public key to validate
   * @param config - Optional multisig configuration (not used in validation, for API compatibility)
   * @param addressType - Optional address type (not used in validation, for API compatibility)
   * @returns Validation result with isValid flag and errors array
   */
  validateXpub(
    xpub: string,
    config?: MultisigConfig,
    addressType?: MultisigAddressType
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check if empty
      if (!xpub || xpub.trim() === '') {
        errors.push('Extended public key is empty');
        return { isValid: false, errors };
      }

      // Try to parse the xpub
      const node = bip32.fromBase58(xpub, this.network);

      // Verify it's a public key (not private)
      if (node.privateKey) {
        errors.push('Provided key is a private key (xprv), not a public key (xpub)');
      }

      // Verify the network matches
      const expectedPrefix =
        this.networkName === 'testnet' ? ['tpub', 'vpub', 'upub'] : ['xpub', 'ypub', 'zpub'];
      const hasCorrectPrefix = expectedPrefix.some((prefix) => xpub.startsWith(prefix));

      if (!hasCorrectPrefix) {
        errors.push(
          `Extended public key has wrong network prefix. ` +
            `Expected ${expectedPrefix.join('/')}, got ${xpub.substring(0, 4)}`
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Invalid extended public key: ${error.message}`);
      } else {
        errors.push('Invalid extended public key: Unknown error');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates an extended public key (xpub) and throws on error
   *
   * @param xpub - Extended public key to validate
   * @throws {Error} If xpub is invalid
   */
  private validateXpubStrict(xpub: string): void {
    const result = this.validateXpub(xpub);
    if (!result.isValid) {
      throw new Error(result.errors.join('; '));
    }
  }

  /**
   * Gets the BIP48 derivation path for a multisig account
   *
   * BIP48 path format: m/48'/coin_type'/account'/script_type'
   * Where:
   * - 48' = Purpose (multisig)
   * - coin_type' = 0 (mainnet) or 1 (testnet)
   * - account' = Account index
   * - script_type' = 1 (P2SH), 2 (P2WSH), or 1 (P2SH-P2WSH)
   *
   * @param config - Multisig configuration
   * @param addressType - Address type
   * @param accountIndex - Account index
   * @returns BIP48 derivation path
   */
  getDerivationPath(
    config: MultisigConfig,
    addressType: MultisigAddressType,
    accountIndex: number
  ): string {
    const coinType = this.networkName === 'mainnet' ? 0 : 1;

    // Determine script type
    let scriptType: number;
    switch (addressType) {
      case 'p2sh':
        scriptType = 1;
        break;
      case 'p2wsh':
        scriptType = 2;
        break;
      case 'p2sh-p2wsh':
        scriptType = 1; // P2SH wrapped, uses same as P2SH
        break;
      default:
        throw new Error(`Unsupported address type: ${addressType}`);
    }

    return `m/48'/${coinType}'/${accountIndex}'/${scriptType}'`;
  }

  /**
   * Exports extended public key for sharing with co-signers (from HDWallet)
   *
   * @param wallet - HDWallet instance
   * @param config - Multisig configuration
   * @param addressType - Address type
   * @param accountIndex - Account index
   * @returns Extended public key details including network and config info
   */
  exportXpub(
    wallet: any, // HDWallet type
    config: MultisigConfig,
    addressType: MultisigAddressType,
    accountIndex: number
  ): {
    xpub: string;
    fingerprint: string;
    derivationPath: string;
    network: string;
    multisigConfig: MultisigConfig;
    addressType: MultisigAddressType;
  } {
    const masterNode = wallet.getMasterNode();
    const result = this.exportOurXpub(masterNode, config, addressType, accountIndex);

    return {
      ...result,
      network: this.networkName,
      multisigConfig: config,
      addressType,
    };
  }

  /**
   * Exports our extended public key for sharing with co-signers
   *
   * @param masterNode - Master BIP32 node
   * @param config - Multisig configuration
   * @param addressType - Address type
   * @param accountIndex - Account index
   * @returns Extended public key (xpub) and fingerprint
   */
  exportOurXpub(
    masterNode: BIP32Interface,
    config: MultisigConfig,
    addressType: MultisigAddressType,
    accountIndex: number
  ): { xpub: string; fingerprint: string; derivationPath: string } {
    try {
      const derivationPath = this.getDerivationPath(config, addressType, accountIndex);

      // Derive the account node
      const accountNode = masterNode.derivePath(derivationPath);

      // Get the xpub
      const xpub = accountNode.neutered().toBase58();

      // Get the fingerprint (first 4 bytes of hash160 of public key)
      const fingerprint = accountNode.fingerprint.toString('hex').toLowerCase();

      return { xpub, fingerprint, derivationPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to export xpub: ${message}`);
    }
  }

  /**
   * Gets configuration details for a multisig config
   *
   * @param config - Multisig configuration
   * @returns Configuration details
   */
  getConfigDetails(config: MultisigConfig): MultisigConfigDetails {
    this.validateConfig(config);
    return MULTISIG_CONFIGS[config];
  }

  /**
   * Gets all supported multisig configurations
   *
   * @returns Array of supported configurations
   */
  getSupportedConfigs(): MultisigConfig[] {
    return Object.keys(MULTISIG_CONFIGS) as MultisigConfig[];
  }

  /**
   * Imports a co-signer's xpub
   *
   * @param xpub - Co-signer's extended public key
   * @param name - Co-signer's name
   * @returns Cosigner object (without isSelf and derivationPath which need to be set by caller)
   */
  importCosignerXpub(
    xpub: string,
    name: string
  ): Omit<Cosigner, 'derivationPath' | 'isSelf'> {
    try {
      // Validate the xpub
      this.validateXpubStrict(xpub);

      // Parse to get fingerprint
      const node = bip32.fromBase58(xpub, this.network);
      const fingerprint = node.fingerprint.toString('hex').toUpperCase();

      return {
        name,
        xpub,
        fingerprint,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to import co-signer xpub: ${message}`);
    }
  }

  /**
   * Checks if a configuration is valid
   *
   * @param config - Configuration to check
   * @returns true if valid, false otherwise
   */
  isValidConfig(config: string): config is MultisigConfig {
    return config in MULTISIG_CONFIGS;
  }

  /**
   * Gets the network being used
   *
   * @returns Network name
   */
  getNetwork(): 'testnet' | 'mainnet' {
    return this.networkName;
  }
}
