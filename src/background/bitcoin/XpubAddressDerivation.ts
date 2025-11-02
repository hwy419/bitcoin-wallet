/**
 * XpubAddressDerivation - Derive addresses from extended public keys
 *
 * Implements BIP32 hierarchical deterministic address derivation from xpubs
 * with gap limit support according to BIP44 standard.
 *
 * Gap Limit:
 * - Initial cache: 20 addresses (10 external + 10 internal)
 * - Maximum cache: 100 addresses (50 external + 50 internal)
 * - Lazy expansion: Derive more addresses on demand
 *
 * Address Types:
 * - External (receive): m/.../.../0/index
 * - Internal (change): m/.../.../1/index
 *
 * Supported Address Formats:
 * - P2PKH (Legacy)
 * - P2SH-P2WPKH (SegWit)
 * - P2WPKH (Native SegWit)
 * - P2SH (Multisig Legacy)
 * - P2SH-P2WSH (Multisig SegWit)
 * - P2WSH (Multisig Native SegWit)
 *
 * @see prompts/docs/plans/CONTACTS_V2_XPUB_INTEGRATION.md
 * @see https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki
 */

import { DerivedAddress, XpubValidationResult } from '../../shared/types';
import { XpubValidator } from './XpubValidator';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';

const bip32 = BIP32Factory(ecc);

// Gap limits per BIP44
export const INITIAL_GAP_LIMIT = 10; // 10 external + 10 internal = 20 total
export const MAX_GAP_LIMIT = 50; // 50 external + 50 internal = 100 total

// Network configurations
const NETWORKS = {
  testnet: bitcoin.networks.testnet,
  mainnet: bitcoin.networks.bitcoin,
};

export class XpubAddressDerivation {
  /**
   * Derive initial addresses from xpub (20 addresses)
   *
   * @param xpubString - Extended public key string
   * @param network - Network ('testnet' or 'mainnet')
   * @returns Array of 20 derived addresses (10 external + 10 internal)
   */
  static deriveInitialAddresses(
    xpubString: string,
    network: 'testnet' | 'mainnet'
  ): DerivedAddress[] {
    return this.deriveAddresses(xpubString, network, INITIAL_GAP_LIMIT);
  }

  /**
   * Derive addresses from xpub up to specified gap limit
   *
   * @param xpubString - Extended public key string
   * @param network - Network ('testnet' or 'mainnet')
   * @param gapLimit - Number of addresses per chain (external/internal)
   * @returns Array of derived addresses (gapLimit * 2 total)
   */
  static deriveAddresses(
    xpubString: string,
    network: 'testnet' | 'mainnet',
    gapLimit: number = INITIAL_GAP_LIMIT
  ): DerivedAddress[] {
    // Validate xpub first
    const validation = XpubValidator.validate(xpubString, network);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid xpub');
    }

    // Parse xpub using standard format (handles ypub/zpub/upub/vpub conversion)
    const standardXpub = validation.standardXpub || xpubString;
    const node = bip32.fromBase58(standardXpub, NETWORKS[network]);

    // Determine script type for address generation
    const scriptType = validation.scriptType!;

    const addresses: DerivedAddress[] = [];

    // Derive external (receive) addresses: m/.../0/index
    for (let i = 0; i < gapLimit; i++) {
      const child = node.derive(0).derive(i);
      const address = this.generateAddress(child, scriptType, network);
      addresses.push({
        address,
        derivationPath: `${validation.derivationPathTemplate}/0/${i}`,
        index: i,
        isChange: false,
      });
    }

    // Derive internal (change) addresses: m/.../1/index
    for (let i = 0; i < gapLimit; i++) {
      const child = node.derive(1).derive(i);
      const address = this.generateAddress(child, scriptType, network);
      addresses.push({
        address,
        derivationPath: `${validation.derivationPathTemplate}/1/${i}`,
        index: i,
        isChange: true,
      });
    }

    return addresses;
  }

  /**
   * Expand cached addresses (lazy expansion from 20 to 100)
   *
   * @param xpubString - Extended public key string
   * @param network - Network
   * @param currentCount - Current number of cached addresses
   * @param newGapLimit - New gap limit to expand to (max 50)
   * @returns Array of newly derived addresses
   */
  static expandAddresses(
    xpubString: string,
    network: 'testnet' | 'mainnet',
    currentCount: number,
    newGapLimit: number = MAX_GAP_LIMIT
  ): DerivedAddress[] {
    if (newGapLimit > MAX_GAP_LIMIT) {
      throw new Error(`Gap limit cannot exceed ${MAX_GAP_LIMIT}`);
    }

    const currentGapLimit = currentCount / 2; // Current count is (external + internal)
    if (newGapLimit <= currentGapLimit) {
      return []; // Already at or above requested gap limit
    }

    // Validate xpub first
    const validation = XpubValidator.validate(xpubString, network);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid xpub');
    }

    // Parse xpub using standard format
    const standardXpub = validation.standardXpub || xpubString;
    const node = bip32.fromBase58(standardXpub, NETWORKS[network]);
    const scriptType = validation.scriptType!;

    const newAddresses: DerivedAddress[] = [];

    // Derive only the new external addresses (from currentGapLimit to newGapLimit-1)
    for (let i = currentGapLimit; i < newGapLimit; i++) {
      const child = node.derive(0).derive(i);
      const address = this.generateAddress(child, scriptType, network);
      newAddresses.push({
        address,
        derivationPath: `${validation.derivationPathTemplate}/0/${i}`,
        index: i,
        isChange: false,
      });
    }

    // Derive only the new internal addresses (from currentGapLimit to newGapLimit-1)
    for (let i = currentGapLimit; i < newGapLimit; i++) {
      const child = node.derive(1).derive(i);
      const address = this.generateAddress(child, scriptType, network);
      newAddresses.push({
        address,
        derivationPath: `${validation.derivationPathTemplate}/1/${i}`,
        index: i,
        isChange: true,
      });
    }

    return newAddresses;
  }

  /**
   * Derive a single address at specific index
   *
   * @param xpubString - Extended public key string
   * @param network - Network
   * @param index - Address index
   * @param isChange - false = external (receive), true = internal (change)
   * @returns Single derived address
   */
  static deriveAddress(
    xpubString: string,
    network: 'testnet' | 'mainnet',
    index: number,
    isChange: boolean = false
  ): DerivedAddress {
    const validation = XpubValidator.validate(xpubString, network);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid xpub');
    }

    // Parse xpub using standard format (handles ypub/zpub/upub/vpub conversion)
    const standardXpub = validation.standardXpub || xpubString;
    const node = bip32.fromBase58(standardXpub, NETWORKS[network]);
    const scriptType = validation.scriptType!;

    const changeIndex = isChange ? 1 : 0;
    const child = node.derive(changeIndex).derive(index);
    const address = this.generateAddress(child, scriptType, network);

    return {
      address,
      derivationPath: `${validation.derivationPathTemplate}/${changeIndex}/${index}`,
      index,
      isChange,
    };
  }

  /**
   * Generate Bitcoin address from BIP32 node based on script type
   *
   * @param node - BIP32 node
   * @param scriptType - Address script type
   * @param network - Network
   * @returns Bitcoin address string
   */
  private static generateAddress(
    node: BIP32Interface,
    scriptType: XpubValidationResult['scriptType'],
    network: 'testnet' | 'mainnet'
  ): string {
    const bitcoinNetwork = NETWORKS[network];
    const pubkey = node.publicKey;

    switch (scriptType) {
      case 'p2pkh': {
        // Legacy: P2PKH
        const { address } = bitcoin.payments.p2pkh({
          pubkey,
          network: bitcoinNetwork,
        });
        if (!address) throw new Error('Failed to generate P2PKH address');
        return address;
      }

      case 'p2sh-p2wpkh': {
        // SegWit: P2SH-P2WPKH
        const { address } = bitcoin.payments.p2sh({
          redeem: bitcoin.payments.p2wpkh({ pubkey, network: bitcoinNetwork }),
          network: bitcoinNetwork,
        });
        if (!address) throw new Error('Failed to generate P2SH-P2WPKH address');
        return address;
      }

      case 'p2wpkh': {
        // Native SegWit: P2WPKH
        const { address } = bitcoin.payments.p2wpkh({
          pubkey,
          network: bitcoinNetwork,
        });
        if (!address) throw new Error('Failed to generate P2WPKH address');
        return address;
      }

      case 'p2sh':
      case 'p2sh-p2wsh':
      case 'p2wsh': {
        // Multisig addresses require multiple pubkeys
        // This is a placeholder - actual multisig address generation
        // requires all co-signer pubkeys and will be handled by MultisigAccount logic
        throw new Error('Multisig address derivation requires all co-signer xpubs');
      }

      default: {
        throw new Error(`Unsupported script type: ${scriptType}`);
      }
    }
  }

  /**
   * Get only external (receive) addresses from derived set
   *
   * @param addresses - Array of derived addresses
   * @returns Only external addresses
   */
  static getExternalAddresses(addresses: DerivedAddress[]): DerivedAddress[] {
    return addresses.filter((addr) => !addr.isChange);
  }

  /**
   * Get only internal (change) addresses from derived set
   *
   * @param addresses - Array of derived addresses
   * @returns Only internal addresses
   */
  static getInternalAddresses(addresses: DerivedAddress[]): DerivedAddress[] {
    return addresses.filter((addr) => addr.isChange);
  }

  /**
   * Find address by Bitcoin address string
   *
   * @param addresses - Array of derived addresses
   * @param addressString - Bitcoin address to find
   * @returns Derived address info or undefined
   */
  static findAddress(
    addresses: DerivedAddress[],
    addressString: string
  ): DerivedAddress | undefined {
    return addresses.find((addr) => addr.address === addressString);
  }

  /**
   * Validate that an address was derived from xpub
   *
   * This checks if the provided address exists in the derived set
   * within the gap limit.
   *
   * @param xpubString - Extended public key string
   * @param network - Network
   * @param addressToValidate - Address to check
   * @param gapLimit - Gap limit to check (default: 20)
   * @returns true if address is derived from xpub
   */
  static validateAddressBelongsToXpub(
    xpubString: string,
    network: 'testnet' | 'mainnet',
    addressToValidate: string,
    gapLimit: number = INITIAL_GAP_LIMIT * 2 // Check up to 20 addresses per chain
  ): boolean {
    try {
      const addresses = this.deriveAddresses(xpubString, network, gapLimit);
      return addresses.some((addr) => addr.address === addressToValidate);
    } catch {
      return false;
    }
  }

  /**
   * Get summary of derived addresses
   *
   * @param addresses - Array of derived addresses
   * @returns Summary object with counts
   */
  static getSummary(addresses: DerivedAddress[]): {
    total: number;
    external: number;
    internal: number;
    gapLimit: number;
  } {
    const external = addresses.filter((a) => !a.isChange).length;
    const internal = addresses.filter((a) => a.isChange).length;

    return {
      total: addresses.length,
      external,
      internal,
      gapLimit: Math.min(external, internal), // Gap limit is the smaller of the two
    };
  }
}
