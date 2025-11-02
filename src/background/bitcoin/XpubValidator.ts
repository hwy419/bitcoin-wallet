/**
 * XpubValidator - Extended Public Key Validation
 *
 * Validates and parses xpub strings according to BIP32 standards.
 * Supports all standard xpub formats for testnet and mainnet:
 *
 * Testnet:
 * - tpub: BIP44 P2PKH (m/44'/1'/account')
 * - upub: BIP49 P2SH-P2WPKH (m/49'/1'/account')
 * - vpub: BIP84 P2WPKH (m/84'/1'/account')
 * - Tpub/Upub/Vpub: BIP48 Multisig variants
 *
 * Mainnet:
 * - xpub: BIP44 P2PKH (m/44'/0'/account')
 * - ypub: BIP49 P2SH-P2WPKH (m/49'/0'/account')
 * - zpub: BIP84 P2WPKH (m/84'/0'/account')
 * - Xpub/Ypub/Zpub: BIP48 Multisig variants
 *
 * @see prompts/docs/plans/CONTACTS_V2_XPUB_INTEGRATION.md
 * @see https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
 */

import { XpubValidationResult } from '../../shared/types';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Factory, BIP32Interface } from 'bip32';
import * as ecc from 'tiny-secp256k1';
import bs58check from 'bs58check';

const bip32 = BIP32Factory(ecc);

// Network configurations
const NETWORKS = {
  testnet: bitcoin.networks.testnet,
  mainnet: bitcoin.networks.bitcoin,
};

// SLIP-0132 version bytes for extended public keys
// These map custom prefixes (ypub, zpub, etc.) to standard prefixes (xpub, tpub)
const VERSION_BYTES = {
  // Mainnet
  xpub: 0x0488b21e, // BIP44 Legacy P2PKH
  ypub: 0x049d7cb2, // BIP49 SegWit P2SH-P2WPKH
  zpub: 0x04b24746, // BIP84 Native SegWit P2WPKH
  Xpub: 0x0488b21e, // BIP48 Multisig Legacy (same as xpub)
  Ypub: 0x0295b43f, // BIP48 Multisig SegWit P2SH-P2WSH
  Zpub: 0x02aa7ed3, // BIP48 Multisig Native SegWit P2WSH

  // Testnet
  tpub: 0x043587cf, // BIP44 Legacy P2PKH
  upub: 0x044a5262, // BIP49 SegWit P2SH-P2WPKH
  vpub: 0x045f1cf6, // BIP84 Native SegWit P2WPKH
  Tpub: 0x043587cf, // BIP48 Multisig Legacy (same as tpub)
  Upub: 0x024289ef, // BIP48 Multisig SegWit P2SH-P2WSH
  Vpub: 0x02575483, // BIP48 Multisig Native SegWit P2WSH
} as const;

// Xpub prefix to network mapping
const XPUB_PREFIXES = {
  // Testnet
  tpub: 'testnet', // BIP44 Legacy
  upub: 'testnet', // BIP49 SegWit
  vpub: 'testnet', // BIP84 Native SegWit
  Tpub: 'testnet', // BIP48 Multisig Legacy
  Upub: 'testnet', // BIP48 Multisig SegWit
  Vpub: 'testnet', // BIP48 Multisig Native SegWit

  // Mainnet
  xpub: 'mainnet', // BIP44 Legacy
  ypub: 'mainnet', // BIP49 SegWit
  zpub: 'mainnet', // BIP84 Native SegWit
  Xpub: 'mainnet', // BIP48 Multisig Legacy
  Ypub: 'mainnet', // BIP48 Multisig SegWit
  Zpub: 'mainnet', // BIP48 Multisig Native SegWit
} as const;

// Xpub type to purpose and script type mapping
const XPUB_TYPE_MAP = {
  tpub: { purpose: 44, scriptType: 'p2pkh' as const },
  upub: { purpose: 49, scriptType: 'p2sh-p2wpkh' as const },
  vpub: { purpose: 84, scriptType: 'p2wpkh' as const },
  Tpub: { purpose: 48, scriptType: 'p2sh' as const },
  Upub: { purpose: 48, scriptType: 'p2sh-p2wsh' as const },
  Vpub: { purpose: 48, scriptType: 'p2wsh' as const },
  xpub: { purpose: 44, scriptType: 'p2pkh' as const },
  ypub: { purpose: 49, scriptType: 'p2sh-p2wpkh' as const },
  zpub: { purpose: 84, scriptType: 'p2wpkh' as const },
  Xpub: { purpose: 48, scriptType: 'p2sh' as const },
  Ypub: { purpose: 48, scriptType: 'p2sh-p2wsh' as const },
  Zpub: { purpose: 48, scriptType: 'p2wsh' as const },
} as const;

export class XpubValidator {
  /**
   * Convert custom xpub format (ypub, zpub, upub, vpub) to standard format (xpub, tpub)
   * This is necessary because bip32 library only supports standard version bytes
   *
   * @param xpubString - Extended public key with custom prefix
   * @param xpubType - Type of xpub (ypub, zpub, etc.)
   * @param network - Target network
   * @returns Converted xpub string with standard prefix
   */
  private static convertToStandardFormat(
    xpubString: string,
    xpubType: keyof typeof XPUB_PREFIXES,
    network: 'testnet' | 'mainnet'
  ): string {
    // If already standard format (xpub/tpub), no conversion needed
    if (xpubType === 'xpub' || xpubType === 'tpub') {
      return xpubString;
    }

    try {
      // Decode the base58check encoded xpub
      const decoded = bs58check.decode(xpubString);

      // Replace the first 4 bytes (version bytes) with standard version
      const standardVersion = network === 'testnet' ? VERSION_BYTES.tpub : VERSION_BYTES.xpub;
      const versionBuffer = Buffer.allocUnsafe(4);
      versionBuffer.writeUInt32BE(standardVersion, 0);

      // Create new buffer with standard version bytes + rest of data
      const converted = Buffer.concat([versionBuffer, decoded.slice(4)]);

      // Encode back to base58check
      return bs58check.encode(converted);
    } catch (error) {
      throw new Error('Failed to convert xpub format: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Validate and parse an extended public key
   *
   * @param xpubString - Extended public key string
   * @param network - Expected network ('testnet' or 'mainnet')
   * @returns Validation result with parsed metadata
   */
  static validate(
    xpubString: string,
    network: 'testnet' | 'mainnet'
  ): XpubValidationResult {
    try {
      // Detect xpub type from prefix
      const xpubType = this.detectXpubType(xpubString);
      if (!xpubType) {
        return {
          valid: false,
          error: 'Unsupported xpub format. Must start with tpub/upub/vpub (testnet) or xpub/ypub/zpub (mainnet)',
        };
      }

      // Verify network matches xpub prefix
      const expectedNetwork = XPUB_PREFIXES[xpubType];
      if (expectedNetwork !== network) {
        return {
          valid: false,
          error: `This xpub is for ${expectedNetwork}, but wallet is on ${network}`,
        };
      }

      // Convert custom formats (ypub, zpub, upub, vpub) to standard format (xpub, tpub)
      const standardXpub = this.convertToStandardFormat(xpubString, xpubType, network);

      // Parse with BIP32 using standard format
      const node: BIP32Interface = bip32.fromBase58(standardXpub, NETWORKS[network]);

      // Extract metadata
      const fingerprint = node.fingerprint.toString('hex');
      const { purpose, scriptType } = XPUB_TYPE_MAP[xpubType];

      // Generate derivation path template
      const coinType = network === 'testnet' ? 1 : 0;
      const accountIndex = node.index & 0x7fffffff; // Remove hardened bit
      let derivationPathTemplate: string;

      if (purpose === 48) {
        // BIP48 multisig: m/48'/coinType'/account'/script_type'
        const scriptTypeIndex = scriptType === 'p2sh' ? 1 : scriptType === 'p2wsh' ? 2 : 1;
        derivationPathTemplate = `m/${purpose}'/${coinType}'/${accountIndex}'/${scriptTypeIndex}'`;
      } else {
        // BIP44/49/84: m/purpose'/coinType'/account'
        derivationPathTemplate = `m/${purpose}'/${coinType}'/${accountIndex}'`;
      }

      return {
        valid: true,
        xpubType,
        fingerprint,
        depth: node.depth,
        childNumber: node.index,
        purpose,
        scriptType,
        derivationPathTemplate,
        standardXpub, // Include converted xpub for use in address derivation
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Failed to parse xpub',
      };
    }
  }

  /**
   * Detect xpub type from prefix (first 4 characters)
   *
   * @param xpubString - Extended public key string
   * @returns Xpub type or undefined if invalid
   */
  private static detectXpubType(
    xpubString: string
  ): keyof typeof XPUB_PREFIXES | undefined {
    const prefix = xpubString.substring(0, 4);
    return prefix in XPUB_PREFIXES ? (prefix as keyof typeof XPUB_PREFIXES) : undefined;
  }

  /**
   * Get network from xpub string
   *
   * @param xpubString - Extended public key string
   * @returns 'testnet' or 'mainnet' or undefined if invalid
   */
  static getNetwork(xpubString: string): 'testnet' | 'mainnet' | undefined {
    const xpubType = this.detectXpubType(xpubString);
    return xpubType ? XPUB_PREFIXES[xpubType] : undefined;
  }

  /**
   * Check if xpub string is valid format (basic check)
   *
   * @param xpubString - Extended public key string
   * @returns true if format looks valid
   */
  static isValidFormat(xpubString: string): boolean {
    if (!xpubString || typeof xpubString !== 'string') {
      return false;
    }

    // Check length (xpubs are typically 111 characters)
    if (xpubString.length < 100 || xpubString.length > 120) {
      return false;
    }

    // Check if it starts with a known prefix
    const xpubType = this.detectXpubType(xpubString);
    return xpubType !== undefined;
  }

  /**
   * Parse xpub and return BIP32 node (for address derivation)
   *
   * @param xpubString - Extended public key string
   * @param network - Network ('testnet' or 'mainnet')
   * @returns BIP32 node or throws error
   */
  static parse(xpubString: string, network: 'testnet' | 'mainnet'): BIP32Interface {
    const validation = this.validate(xpubString, network);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid xpub');
    }

    // Detect xpub type and convert to standard format if needed
    const xpubType = this.detectXpubType(xpubString);
    if (!xpubType) {
      throw new Error('Invalid xpub type');
    }

    const standardXpub = this.convertToStandardFormat(xpubString, xpubType, network);
    return bip32.fromBase58(standardXpub, NETWORKS[network]);
  }

  /**
   * Get human-readable description of xpub type
   *
   * @param xpubType - Xpub prefix type
   * @returns Human-readable description
   */
  static getXpubDescription(xpubType: keyof typeof XPUB_PREFIXES): string {
    const { purpose, scriptType } = XPUB_TYPE_MAP[xpubType];
    const network = XPUB_PREFIXES[xpubType];

    const scriptTypeNames = {
      'p2pkh': 'Legacy (P2PKH)',
      'p2sh-p2wpkh': 'SegWit (P2SH-P2WPKH)',
      'p2wpkh': 'Native SegWit (P2WPKH)',
      'p2sh': 'Multisig Legacy (P2SH)',
      'p2sh-p2wsh': 'Multisig SegWit (P2SH-P2WSH)',
      'p2wsh': 'Multisig Native SegWit (P2WSH)',
    };

    const networkName = network === 'testnet' ? 'Testnet' : 'Mainnet';
    const purposeName = purpose === 48 ? 'BIP48' : `BIP${purpose}`;

    return `${networkName} ${purposeName} ${scriptTypeNames[scriptType]}`;
  }

  /**
   * Validate that xpub matches expected derivation path pattern
   *
   * This is useful when importing xpubs to ensure they're at the correct depth
   * (e.g., account level: m/44'/1'/0' not address level)
   *
   * @param xpubString - Extended public key string
   * @param network - Network
   * @param expectedDepth - Expected BIP32 depth (3 for account level, 4 for multisig)
   * @returns true if depth matches
   */
  static validateDepth(
    xpubString: string,
    network: 'testnet' | 'mainnet',
    expectedDepth: number
  ): boolean {
    try {
      // Detect xpub type and convert to standard format if needed
      const xpubType = this.detectXpubType(xpubString);
      if (!xpubType) {
        return false;
      }

      const standardXpub = this.convertToStandardFormat(xpubString, xpubType, network);
      const node = bip32.fromBase58(standardXpub, NETWORKS[network]);
      return node.depth === expectedDepth;
    } catch {
      return false;
    }
  }
}
