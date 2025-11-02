/**
 * WIFManager - WIF (Wallet Import Format) Validation and Utilities
 *
 * This module provides WIF validation, network detection, and address derivation.
 * Complements KeyManager's WIF encoding/decoding methods.
 *
 * Security Notes:
 * - NEVER log WIF strings or private keys
 * - Clear sensitive data from memory immediately after use
 * - Enforce strict network validation (testnet-only for testnet wallets)
 */

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { KeyManager } from './KeyManager';
import type { AddressType } from '../../shared/types';

const ECPair = ECPairFactory(ecc);

export interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: AddressType;
  compressed?: boolean;
  error?: string;
}

/**
 * WIFManager class for WIF validation and utilities
 */
export class WIFManager {
  /**
   * Validates WIF format (Base58Check, length, checksum)
   *
   * @param wif - WIF string to validate
   * @returns Error message if invalid, null if valid
   */
  static validateFormat(wif: string): string | null {
    // Must be Base58Check format
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
    if (!base58Regex.test(wif)) {
      return 'Invalid WIF format. Must be Base58-encoded.';
    }

    // Must be correct length (51-52 chars)
    if (wif.length < 51 || wif.length > 52) {
      return 'Invalid WIF length. Must be 51-52 characters.';
    }

    return null;
  }

  /**
   * Detects network from WIF prefix
   *
   * @param wif - WIF string
   * @returns Network type or 'invalid' if unknown prefix
   */
  static detectNetwork(wif: string): 'testnet' | 'mainnet' | 'invalid' {
    const firstChar = wif[0];

    // Testnet prefixes
    if (firstChar === '9' || firstChar === 'c') {
      return 'testnet';
    }

    // Mainnet prefixes
    if (firstChar === '5' || firstChar === 'K' || firstChar === 'L') {
      return 'mainnet';
    }

    return 'invalid';
  }

  /**
   * Validates WIF network matches required network
   *
   * @param wif - WIF string
   * @param requiredNetwork - Network to enforce ('testnet' or 'mainnet')
   * @returns Error message if wrong network, null if correct
   */
  static validateNetwork(
    wif: string,
    requiredNetwork: 'testnet' | 'mainnet' = 'testnet'
  ): string | null {
    const network = this.detectNetwork(wif);

    if (network === 'invalid') {
      return 'Invalid WIF prefix. Unrecognized network.';
    }

    if (network !== requiredNetwork) {
      return `Wrong network: This is a ${network} key, but wallet requires ${requiredNetwork} keys.`;
    }

    return null;
  }

  /**
   * Validates WIF checksum using KeyManager
   *
   * @param wif - WIF string
   * @param network - Network to validate against
   * @returns true if checksum valid, false otherwise
   */
  static validateChecksum(wif: string, network: 'testnet' | 'mainnet'): boolean {
    return KeyManager.validateWIF(wif, network);
  }

  /**
   * Derives first receiving address from WIF
   *
   * @param wif - WIF private key
   * @param network - Network ('testnet' or 'mainnet')
   * @returns Object with address and address type
   */
  static deriveFirstAddress(
    wif: string,
    network: 'testnet' | 'mainnet' = 'testnet'
  ): {
    address: string;
    addressType: AddressType;
    compressed: boolean;
  } {
    const networkObj = network === 'testnet'
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;

    // Decode WIF to get key pair
    const decoded = KeyManager.decodeWIF(wif, network);
    const keyPair = ECPair.fromWIF(wif, networkObj);

    // Determine address type based on compression
    if (!decoded.compressed) {
      // Uncompressed keys can only use legacy addresses
      const { address } = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj
      });

      return {
        address: address!,
        addressType: 'legacy',
        compressed: false
      };
    } else {
      // Compressed keys default to native-segwit (most efficient)
      const { address } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj
      });

      return {
        address: address!,
        addressType: 'native-segwit',
        compressed: true
      };
    }
  }

  /**
   * Derives a Bitcoin address from a WIF private key with specified address type
   *
   * This method allows the user to choose which address type to generate from the WIF.
   * For compressed keys, all 3 types are supported (Legacy, SegWit, Native SegWit).
   * For uncompressed keys, only Legacy is supported.
   *
   * @param wif - WIF private key
   * @param addressType - Desired address type ('legacy', 'segwit', or 'native-segwit')
   * @param network - Network ('testnet' or 'mainnet', defaults to 'testnet')
   * @returns Object with address and metadata
   * @throws Error if address type is incompatible with key compression
   */
  static deriveAddress(
    wif: string,
    addressType: AddressType,
    network: 'testnet' | 'mainnet' = 'testnet'
  ): {
    address: string;
    compressed: boolean;
  } {
    const networkObj = network === 'testnet'
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;

    // Decode WIF to get compression info
    const decoded = KeyManager.decodeWIF(wif, network);
    const keyPair = ECPair.fromWIF(wif, networkObj);

    // Validate address type compatibility
    if (!decoded.compressed && addressType !== 'legacy') {
      throw new Error(
        'Uncompressed private keys can only generate Legacy (P2PKH) addresses. ' +
        'SegWit and Native SegWit require compressed keys.'
      );
    }

    // Generate address based on requested type
    let address: string;

    if (addressType === 'legacy') {
      // Legacy P2PKH
      const payment = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj
      });
      address = payment.address!;
    } else if (addressType === 'segwit') {
      // SegWit P2SH-P2WPKH (nested segwit)
      const payment = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: networkObj
        }),
        network: networkObj
      });
      address = payment.address!;
    } else if (addressType === 'native-segwit') {
      // Native SegWit P2WPKH (bech32)
      const payment = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: networkObj
      });
      address = payment.address!;
    } else {
      throw new Error(`Unsupported address type: ${addressType}`);
    }

    return {
      address,
      compressed: decoded.compressed
    };
  }

  /**
   * Complete WIF validation with all checks
   *
   * @param wif - WIF string to validate
   * @param requiredNetwork - Network to enforce (default: 'testnet')
   * @returns Validation result with network, address, and error info
   */
  static validateWIF(
    wif: string,
    requiredNetwork: 'testnet' | 'mainnet' = 'testnet'
  ): WIFValidationResult {
    // Step 1: Format validation
    const formatError = this.validateFormat(wif);
    if (formatError) {
      return {
        valid: false,
        error: formatError
      };
    }

    // Step 2: Network detection
    const network = this.detectNetwork(wif);
    if (network === 'invalid') {
      return {
        valid: false,
        error: 'Invalid WIF prefix. Unrecognized network.'
      };
    }

    // Step 3: Network validation (CRITICAL for testnet wallet)
    const networkError = this.validateNetwork(wif, requiredNetwork);
    if (networkError) {
      return {
        valid: false,
        network: network,
        error: networkError
      };
    }

    // Step 4: Checksum validation
    const checksumValid = this.validateChecksum(wif, network);
    if (!checksumValid) {
      return {
        valid: false,
        network: network,
        error: 'Invalid WIF checksum.'
      };
    }

    // Step 5: Derive first address for preview
    try {
      const addressInfo = this.deriveFirstAddress(wif, network);

      return {
        valid: true,
        network: network,
        firstAddress: addressInfo.address,
        addressType: addressInfo.addressType,
        compressed: addressInfo.compressed
      };
    } catch (error) {
      return {
        valid: false,
        network: network,
        error: 'Failed to derive address from WIF.'
      };
    }
  }
}
