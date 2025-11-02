/**
 * AddressGenerator - Bitcoin Address Generation for All Address Types
 *
 * Generates Bitcoin addresses from BIP32 keys for different address types:
 * - Legacy (P2PKH): Pay to Public Key Hash
 * - SegWit (P2SH-P2WPKH): SegWit wrapped in P2SH for backward compatibility
 * - Native SegWit (P2WPKH): Bech32 native SegWit addresses
 *
 * Testnet Address Prefixes:
 * - Legacy: 'm' or 'n' (P2PKH)
 * - SegWit: '2' (P2SH)
 * - Native SegWit: 'tb1' (Bech32)
 *
 * Mainnet Address Prefixes:
 * - Legacy: '1' (P2PKH)
 * - SegWit: '3' (P2SH)
 * - Native SegWit: 'bc1' (Bech32)
 *
 * Standards:
 * - P2PKH: Original Bitcoin address format
 * - P2SH-P2WPKH: BIP141 (SegWit) + BIP49 (derivation)
 * - P2WPKH: BIP141 (SegWit) + BIP84 (derivation) + BIP173 (Bech32)
 *
 * Security Notes:
 * - Addresses are derived from public keys only (safe to expose)
 * - Never expose the private keys used for derivation
 * - Validate addresses before use in transactions
 */

import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface } from 'bip32';
import { NETWORKS } from '../../shared/constants';
import type { AddressType, Address, MultisigAddressType, MultisigAddress } from '../../shared/types';
import { sortPublicKeys, validateMultisigKeys } from './utils/bip67';

/**
 * AddressGenerator class for creating Bitcoin addresses
 *
 * Responsibilities:
 * 1. Generate addresses from BIP32 keys
 * 2. Support all three address types (Legacy, SegWit, Native SegWit)
 * 3. Handle both testnet and mainnet
 * 4. Validate generated addresses
 * 5. Track address metadata (path, index, change status)
 */
export class AddressGenerator {
  private network: bitcoin.Network;
  private networkName: 'testnet' | 'mainnet';

  /**
   * Creates an AddressGenerator instance
   *
   * @param network - Bitcoin network ('testnet' or 'mainnet')
   */
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.networkName = network;
    this.network = NETWORKS[network];
  }

  /**
   * Generates a Bitcoin address from a BIP32 key node
   *
   * @param node - BIP32 key node (can be derived from HDWallet)
   * @param addressType - Type of address to generate
   * @returns Bitcoin address string
   *
   * @throws {Error} If node is invalid or address generation fails
   *
   * Address Generation Methods:
   * - Legacy (P2PKH): Hash160(publicKey) → Base58Check
   * - SegWit (P2SH-P2WPKH): Hash160(witnessProgram) → Base58Check
   * - Native SegWit (P2WPKH): witnessProgram → Bech32
   */
  generateAddress(node: BIP32Interface, addressType: AddressType): string {
    try {
      if (!node || !node.publicKey) {
        throw new Error('Invalid BIP32 node: missing public key');
      }

      let address: string;

      switch (addressType) {
        case 'legacy':
          address = this.generateLegacyAddress(node);
          break;
        case 'segwit':
          address = this.generateSegWitAddress(node);
          break;
        case 'native-segwit':
          address = this.generateNativeSegWitAddress(node);
          break;
        default:
          throw new Error(`Unsupported address type: ${addressType}`);
      }

      return address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate address: ${message}`);
    }
  }

  /**
   * Generates a Legacy P2PKH address
   *
   * @param node - BIP32 key node
   * @returns Legacy Bitcoin address (starts with 'm'/'n' on testnet, '1' on mainnet)
   *
   * P2PKH Address Generation:
   * 1. Extract public key from node (33 bytes compressed)
   * 2. Compute Hash160(publicKey) = RIPEMD160(SHA256(publicKey))
   * 3. Add version byte (0x6F for testnet, 0x00 for mainnet)
   * 4. Encode with Base58Check (includes checksum)
   *
   * Script: OP_DUP OP_HASH160 <pubKeyHash> OP_EQUALVERIFY OP_CHECKSIG
   */
  private generateLegacyAddress(node: BIP32Interface): string {
    try {
      // Create P2PKH payment object
      const payment = bitcoin.payments.p2pkh({
        pubkey: node.publicKey,
        network: this.network,
      });

      if (!payment.address) {
        throw new Error('Failed to generate P2PKH address');
      }

      return payment.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Legacy address generation failed: ${message}`);
    }
  }

  /**
   * Generates a SegWit P2SH-P2WPKH address
   *
   * @param node - BIP32 key node
   * @returns SegWit address (starts with '2' on testnet, '3' on mainnet)
   *
   * P2SH-P2WPKH Address Generation (BIP49):
   * 1. Create P2WPKH witness program (OP_0 <20-byte-pubkey-hash>)
   * 2. Hash160(witnessProgram) to create redeemScript hash
   * 3. Add version byte (0xC4 for testnet, 0x05 for mainnet)
   * 4. Encode with Base58Check
   *
   * This wraps SegWit in P2SH for compatibility with older wallets.
   * The SegWit script is revealed when spending.
   *
   * Script: OP_HASH160 <redeemScriptHash> OP_EQUAL
   * RedeemScript: OP_0 <pubKeyHash>
   */
  private generateSegWitAddress(node: BIP32Interface): string {
    try {
      // Create P2WPKH payment
      const p2wpkh = bitcoin.payments.p2wpkh({
        pubkey: node.publicKey,
        network: this.network,
      });

      // Wrap in P2SH for backward compatibility
      const p2sh = bitcoin.payments.p2sh({
        redeem: p2wpkh,
        network: this.network,
      });

      if (!p2sh.address) {
        throw new Error('Failed to generate P2SH-P2WPKH address');
      }

      return p2sh.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`SegWit address generation failed: ${message}`);
    }
  }

  /**
   * Generates a Native SegWit P2WPKH address
   *
   * @param node - BIP32 key node
   * @returns Native SegWit address (starts with 'tb1' on testnet, 'bc1' on mainnet)
   *
   * P2WPKH Address Generation (BIP84):
   * 1. Compute Hash160(publicKey)
   * 2. Create witness program: version 0 + 20-byte pubkey hash
   * 3. Encode with Bech32 (includes checksum)
   *
   * Bech32 Benefits:
   * - Better error detection than Base58
   * - Case-insensitive
   * - More efficient QR codes
   * - Native SegWit format (no wrapping needed)
   *
   * Script: OP_0 <pubKeyHash>
   */
  private generateNativeSegWitAddress(node: BIP32Interface): string {
    try {
      // Create P2WPKH payment
      const payment = bitcoin.payments.p2wpkh({
        pubkey: node.publicKey,
        network: this.network,
      });

      if (!payment.address) {
        throw new Error('Failed to generate P2WPKH address');
      }

      return payment.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Native SegWit address generation failed: ${message}`
      );
    }
  }

  /**
   * Generates an address with full metadata
   *
   * @param node - BIP32 key node
   * @param addressType - Type of address
   * @param derivationPath - Full BIP44/49/84 derivation path
   * @param addressIndex - Address index in the derivation path
   * @param isChange - Whether this is a change address
   * @returns Address object with metadata
   *
   * This creates the full Address object used in wallet storage,
   * including all metadata needed for tracking and display.
   */
  generateAddressWithMetadata(
    node: BIP32Interface,
    addressType: AddressType,
    derivationPath: string,
    addressIndex: number,
    isChange: boolean
  ): Address {
    try {
      // Generate the address string
      const address = this.generateAddress(node, addressType);

      // Create full address object with metadata
      const addressObject: Address = {
        address,
        derivationPath,
        index: addressIndex,
        isChange,
        used: false, // Will be updated when address receives funds
      };

      return addressObject;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to generate address with metadata: ${message}`
      );
    }
  }

  /**
   * Validates a Bitcoin address
   *
   * @param address - Bitcoin address to validate
   * @returns true if address is valid for current network
   *
   * Validation checks:
   * - Correct format (Base58Check or Bech32)
   * - Valid checksum
   * - Correct network (testnet vs mainnet)
   * - Supported address type
   */
  validateAddress(address: string): boolean {
    try {
      // Use bitcoinjs-lib to decode and validate
      bitcoin.address.toOutputScript(address, this.network);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Detects the type of a Bitcoin address
   *
   * @param address - Bitcoin address to analyze
   * @returns Address type or null if invalid/unsupported
   *
   * Detection logic:
   * - Starts with '1' or 'm'/'n': Legacy (P2PKH)
   * - Starts with '3' or '2': Could be P2SH (includes SegWit wrapped)
   * - Starts with 'bc1' or 'tb1': Native SegWit (P2WPKH or P2WSH)
   */
  getAddressType(address: string): AddressType | null {
    try {
      if (!this.validateAddress(address)) {
        return null;
      }

      // Check prefix for address type
      if (this.networkName === 'testnet') {
        if (address.startsWith('m') || address.startsWith('n')) {
          return 'legacy';
        } else if (address.startsWith('2')) {
          // Note: P2SH can contain SegWit or other scripts
          // We assume P2SH-P2WPKH for our wallet
          return 'segwit';
        } else if (address.startsWith('tb1')) {
          return 'native-segwit';
        }
      } else {
        // mainnet
        if (address.startsWith('1')) {
          return 'legacy';
        } else if (address.startsWith('3')) {
          return 'segwit';
        } else if (address.startsWith('bc1')) {
          return 'native-segwit';
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Gets the scriptPubKey for an address
   *
   * @param address - Bitcoin address
   * @returns Hex-encoded scriptPubKey (locking script)
   *
   * @throws {Error} If address is invalid
   *
   * The scriptPubKey is the locking script that defines how
   * the output can be spent. It's needed for transaction building.
   */
  getScriptPubKey(address: string): string {
    try {
      const script = bitcoin.address.toOutputScript(address, this.network);
      return script.toString('hex');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get scriptPubKey: ${message}`);
    }
  }

  /**
   * Gets the payment object for an address
   *
   * @param address - Bitcoin address
   * @returns Bitcoin payment object
   *
   * @throws {Error} If address is invalid
   *
   * This is useful for transaction building as it provides
   * the complete payment structure including scriptPubKey.
   */
  getPayment(address: string): bitcoin.Payment {
    try {
      const script = bitcoin.address.toOutputScript(address, this.network);

      // Determine payment type and create appropriate payment object
      const addressType = this.getAddressType(address);

      if (addressType === 'legacy') {
        return bitcoin.payments.p2pkh({ output: script, network: this.network });
      } else if (addressType === 'native-segwit') {
        return bitcoin.payments.p2wpkh({
          output: script,
          network: this.network,
        });
      } else if (addressType === 'segwit') {
        return bitcoin.payments.p2sh({ output: script, network: this.network });
      }

      throw new Error('Unsupported address type');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get payment object: ${message}`);
    }
  }

  /**
   * Gets the current network
   *
   * @returns Current network name
   */
  getNetworkName(): 'testnet' | 'mainnet' {
    return this.networkName;
  }

  /**
   * Gets the bitcoinjs-lib network object
   *
   * @returns Bitcoin network object
   */
  getNetwork(): bitcoin.Network {
    return this.network;
  }

  // ========================================================================
  // MULTISIG ADDRESS GENERATION
  // ========================================================================

  /**
   * Generates a multisig address from multiple public keys
   *
   * @param publicKeys - Array of public keys (Buffers)
   * @param m - Number of required signatures
   * @param addressType - Type of multisig address (p2sh, p2wsh, p2sh-p2wsh)
   * @returns Multisig address string
   *
   * @throws {Error} If parameters are invalid
   *
   * This method uses BIP67 to sort public keys deterministically,
   * ensuring all co-signers generate the same address.
   *
   * Supported address types:
   * - p2sh: Legacy multisig (starts with '2' on testnet, '3' on mainnet)
   * - p2wsh: Native SegWit multisig (starts with 'tb1' on testnet)
   * - p2sh-p2wsh: Wrapped SegWit multisig (starts with '2' on testnet)
   */
  generateMultisigAddress(
    publicKeys: Buffer[],
    m: number,
    addressType: MultisigAddressType
  ): string {
    try {
      // Validate inputs
      if (m < 1 || m > publicKeys.length) {
        throw new Error(`Invalid M value: ${m}. Must be between 1 and ${publicKeys.length}`);
      }

      // Validate public keys (will throw if invalid)
      validateMultisigKeys(publicKeys, 2, 15);

      // Sort public keys per BIP67
      const sortedKeys = sortPublicKeys(publicKeys);

      // Generate address based on type
      switch (addressType) {
        case 'p2sh':
          return this.generateP2SHMultisig(sortedKeys, m);
        case 'p2wsh':
          return this.generateP2WSHMultisig(sortedKeys, m);
        case 'p2sh-p2wsh':
          return this.generateP2SHP2WSHMultisig(sortedKeys, m);
        default:
          throw new Error(`Unsupported multisig address type: ${addressType}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate multisig address: ${message}`);
    }
  }

  /**
   * Generates a P2SH multisig address (Legacy multisig)
   *
   * @param sortedPublicKeys - BIP67 sorted public keys
   * @param m - Required signatures
   * @returns P2SH multisig address
   *
   * Process:
   * 1. Create multisig redeem script: OP_M <pubkey1> <pubkey2> ... OP_N OP_CHECKMULTISIG
   * 2. Hash the redeem script: Hash160(redeemScript)
   * 3. Create P2SH address from the hash
   */
  private generateP2SHMultisig(sortedPublicKeys: Buffer[], m: number): string {
    try {
      const n = sortedPublicKeys.length;

      // Create P2MS (Pay-to-Multisig) payment
      const p2ms = bitcoin.payments.p2ms({
        m,
        pubkeys: sortedPublicKeys,
        network: this.network,
      });

      if (!p2ms.output) {
        throw new Error('Failed to create multisig redeem script');
      }

      // Wrap in P2SH
      const p2sh = bitcoin.payments.p2sh({
        redeem: p2ms,
        network: this.network,
      });

      if (!p2sh.address) {
        throw new Error('Failed to generate P2SH multisig address');
      }

      return p2sh.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`P2SH multisig generation failed: ${message}`);
    }
  }

  /**
   * Generates a P2WSH multisig address (Native SegWit multisig)
   *
   * @param sortedPublicKeys - BIP67 sorted public keys
   * @param m - Required signatures
   * @returns P2WSH multisig address
   *
   * Process:
   * 1. Create multisig witness script: OP_M <pubkey1> <pubkey2> ... OP_N OP_CHECKMULTISIG
   * 2. Hash the witness script: SHA256(witnessScript)
   * 3. Create P2WSH address: OP_0 <32-byte-script-hash>
   * 4. Encode as Bech32
   */
  private generateP2WSHMultisig(sortedPublicKeys: Buffer[], m: number): string {
    try {
      const n = sortedPublicKeys.length;

      // Create P2MS witness script
      const p2ms = bitcoin.payments.p2ms({
        m,
        pubkeys: sortedPublicKeys,
        network: this.network,
      });

      if (!p2ms.output) {
        throw new Error('Failed to create multisig witness script');
      }

      // Create P2WSH from the witness script
      const p2wsh = bitcoin.payments.p2wsh({
        redeem: p2ms,
        network: this.network,
      });

      if (!p2wsh.address) {
        throw new Error('Failed to generate P2WSH multisig address');
      }

      return p2wsh.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`P2WSH multisig generation failed: ${message}`);
    }
  }

  /**
   * Generates a P2SH-P2WSH multisig address (Wrapped SegWit multisig)
   *
   * @param sortedPublicKeys - BIP67 sorted public keys
   * @param m - Required signatures
   * @returns P2SH-P2WSH multisig address
   *
   * Process:
   * 1. Create multisig witness script: OP_M <pubkey1> <pubkey2> ... OP_N OP_CHECKMULTISIG
   * 2. Create P2WSH: OP_0 <32-byte-script-hash>
   * 3. Wrap P2WSH in P2SH for backward compatibility
   *
   * This provides SegWit benefits while maintaining compatibility with
   * wallets that don't support native SegWit.
   */
  private generateP2SHP2WSHMultisig(sortedPublicKeys: Buffer[], m: number): string {
    try {
      const n = sortedPublicKeys.length;

      // Create P2MS witness script
      const p2ms = bitcoin.payments.p2ms({
        m,
        pubkeys: sortedPublicKeys,
        network: this.network,
      });

      if (!p2ms.output) {
        throw new Error('Failed to create multisig witness script');
      }

      // Create P2WSH
      const p2wsh = bitcoin.payments.p2wsh({
        redeem: p2ms,
        network: this.network,
      });

      // Wrap in P2SH
      const p2sh = bitcoin.payments.p2sh({
        redeem: p2wsh,
        network: this.network,
      });

      if (!p2sh.address) {
        throw new Error('Failed to generate P2SH-P2WSH multisig address');
      }

      return p2sh.address;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`P2SH-P2WSH multisig generation failed: ${message}`);
    }
  }

  /**
   * Generates a multisig address with full metadata
   *
   * @param publicKeys - Array of public keys
   * @param m - Required signatures
   * @param addressType - Multisig address type
   * @param derivationPath - BIP48 derivation path
   * @param addressIndex - Address index
   * @param isChange - Whether this is a change address
   * @returns MultisigAddress object with metadata including scripts
   */
  generateMultisigAddressWithMetadata(
    publicKeys: Buffer[],
    m: number,
    addressType: MultisigAddressType,
    derivationPath: string,
    addressIndex: number,
    isChange: boolean
  ): MultisigAddress {
    try {
      // Sort keys per BIP67
      const sortedKeys = sortPublicKeys(publicKeys);
      const n = sortedKeys.length;

      // Generate address
      const address = this.generateMultisigAddress(sortedKeys, m, addressType);

      // Create the multisig payment to get scripts
      const p2ms = bitcoin.payments.p2ms({
        m,
        pubkeys: sortedKeys,
        network: this.network,
      });

      if (!p2ms.output) {
        throw new Error('Failed to create multisig script');
      }

      // Build metadata object
      const metadata: MultisigAddress = {
        address,
        derivationPath,
        index: addressIndex,
        isChange,
        used: false,
      };

      // Add appropriate scripts based on address type
      if (addressType === 'p2sh') {
        // P2SH uses redeemScript
        metadata.redeemScript = p2ms.output.toString('hex');
      } else if (addressType === 'p2wsh') {
        // P2WSH uses witnessScript
        metadata.witnessScript = p2ms.output.toString('hex');
      } else if (addressType === 'p2sh-p2wsh') {
        // P2SH-P2WSH uses both
        metadata.witnessScript = p2ms.output.toString('hex');

        // Create P2WSH to get its output script (becomes the redeemScript for P2SH)
        const p2wsh = bitcoin.payments.p2wsh({
          redeem: p2ms,
          network: this.network,
        });

        if (p2wsh.output) {
          metadata.redeemScript = p2wsh.output.toString('hex');
        }
      }

      return metadata;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate multisig address with metadata: ${message}`);
    }
  }

  /**
   * Gets the redeem script for a P2SH multisig address
   *
   * @param publicKeys - Public keys (will be sorted per BIP67)
   * @param m - Required signatures
   * @returns Hex-encoded redeem script
   */
  getMultisigRedeemScript(publicKeys: Buffer[], m: number): string {
    try {
      const sortedKeys = sortPublicKeys(publicKeys);

      const p2ms = bitcoin.payments.p2ms({
        m,
        pubkeys: sortedKeys,
        network: this.network,
      });

      if (!p2ms.output) {
        throw new Error('Failed to create redeem script');
      }

      return p2ms.output.toString('hex');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get redeem script: ${message}`);
    }
  }

  /**
   * Gets the witness script for a P2WSH multisig address
   *
   * @param publicKeys - Public keys (will be sorted per BIP67)
   * @param m - Required signatures
   * @returns Hex-encoded witness script
   */
  getMultisigWitnessScript(publicKeys: Buffer[], m: number): string {
    // Witness script is the same as redeem script for multisig
    return this.getMultisigRedeemScript(publicKeys, m);
  }
}
