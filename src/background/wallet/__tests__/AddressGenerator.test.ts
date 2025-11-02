/**
 * AddressGenerator Test Suite
 *
 * Comprehensive tests for Bitcoin address generation including:
 * - Legacy P2PKH address generation (testnet/mainnet)
 * - SegWit P2SH-P2WPKH address generation
 * - Native SegWit P2WPKH (Bech32) address generation
 * - Address validation
 * - Address type detection
 * - scriptPubKey generation
 * - Address prefix validation
 *
 * Uses known test vectors and derived keys for validation
 *
 * @jest-environment node
 */

import { AddressGenerator } from '../AddressGenerator';
import { HDWallet } from '../HDWallet';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';

describe('AddressGenerator', () => {
  // Test mnemonic and seed for consistent address generation
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_SEED = bip39.mnemonicToSeedSync(TEST_MNEMONIC);

  describe('constructor', () => {
    it('should create AddressGenerator for testnet', () => {
      const generator = new AddressGenerator('testnet');
      expect(generator).toBeDefined();
      expect(generator.getNetworkName()).toBe('testnet');
    });

    it('should create AddressGenerator for mainnet', () => {
      const generator = new AddressGenerator('mainnet');
      expect(generator).toBeDefined();
      expect(generator.getNetworkName()).toBe('mainnet');
    });

    it('should default to testnet when no network specified', () => {
      const generator = new AddressGenerator();
      expect(generator.getNetworkName()).toBe('testnet');
    });
  });

  describe('generateAddress - Legacy (P2PKH)', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate valid legacy address for testnet', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address = generator.generateAddress(node, 'legacy');

      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      // Testnet legacy addresses start with 'm' or 'n'
      expect(address.startsWith('m') || address.startsWith('n')).toBe(true);
    });

    it('should generate consistent addresses for same node', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address1 = generator.generateAddress(node, 'legacy');
      const address2 = generator.generateAddress(node, 'legacy');

      expect(address1).toBe(address2);
    });

    it('should generate different addresses for different nodes', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);

      const address1 = generator.generateAddress(node1, 'legacy');
      const address2 = generator.generateAddress(node2, 'legacy');

      expect(address1).not.toBe(address2);
    });

    it('should generate mainnet legacy addresses starting with 1', () => {
      const mainnetGenerator = new AddressGenerator('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const node = mainnetWallet.deriveAddressNode('legacy', 0, 0, 0);

      const address = mainnetGenerator.generateAddress(node, 'legacy');

      expect(address.startsWith('1')).toBe(true);
    });

    it('should throw error for invalid node (missing public key)', () => {
      const invalidNode = { publicKey: null } as any;
      expect(() => generator.generateAddress(invalidNode, 'legacy')).toThrow('Invalid BIP32 node');
    });

    it('should generate valid Base58 addresses', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address = generator.generateAddress(node, 'legacy');

      // Base58 regex (Bitcoin addresses use Base58Check)
      const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/;
      expect(base58Regex.test(address)).toBe(true);
    });
  });

  describe('generateAddress - SegWit (P2SH-P2WPKH)', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate valid SegWit address for testnet', () => {
      const node = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'segwit');

      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      // Testnet SegWit addresses start with '2'
      expect(address.startsWith('2')).toBe(true);
    });

    it('should generate consistent addresses for same node', () => {
      const node = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const address1 = generator.generateAddress(node, 'segwit');
      const address2 = generator.generateAddress(node, 'segwit');

      expect(address1).toBe(address2);
    });

    it('should generate different addresses for different nodes', () => {
      const node1 = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('segwit', 0, 0, 1);

      const address1 = generator.generateAddress(node1, 'segwit');
      const address2 = generator.generateAddress(node2, 'segwit');

      expect(address1).not.toBe(address2);
    });

    it('should generate mainnet SegWit addresses starting with 3', () => {
      const mainnetGenerator = new AddressGenerator('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const node = mainnetWallet.deriveAddressNode('segwit', 0, 0, 0);

      const address = mainnetGenerator.generateAddress(node, 'segwit');

      expect(address.startsWith('3')).toBe(true);
    });
  });

  describe('generateAddress - Native SegWit (P2WPKH/Bech32)', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate valid Native SegWit address for testnet', () => {
      const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'native-segwit');

      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      // Testnet Native SegWit addresses start with 'tb1'
      expect(address.startsWith('tb1')).toBe(true);
    });

    it('should generate consistent addresses for same node', () => {
      const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const address1 = generator.generateAddress(node, 'native-segwit');
      const address2 = generator.generateAddress(node, 'native-segwit');

      expect(address1).toBe(address2);
    });

    it('should generate different addresses for different nodes', () => {
      const node1 = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('native-segwit', 0, 0, 1);

      const address1 = generator.generateAddress(node1, 'native-segwit');
      const address2 = generator.generateAddress(node2, 'native-segwit');

      expect(address1).not.toBe(address2);
    });

    it('should generate mainnet Native SegWit addresses starting with bc1', () => {
      const mainnetGenerator = new AddressGenerator('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const node = mainnetWallet.deriveAddressNode('native-segwit', 0, 0, 0);

      const address = mainnetGenerator.generateAddress(node, 'native-segwit');

      expect(address.startsWith('bc1')).toBe(true);
    });

    it('should generate lowercase Bech32 addresses', () => {
      const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'native-segwit');

      // Bech32 addresses are case-insensitive but typically lowercase
      expect(address).toBe(address.toLowerCase());
    });
  });

  describe('generateAddress - Error Handling', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should throw error for unsupported address type', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      expect(() => generator.generateAddress(node, 'unsupported' as any)).toThrow('Unsupported address type');
    });

    it('should throw error for null node', () => {
      expect(() => generator.generateAddress(null as any, 'legacy')).toThrow('Invalid BIP32 node');
    });

    it('should throw error for undefined node', () => {
      expect(() => generator.generateAddress(undefined as any, 'legacy')).toThrow('Invalid BIP32 node');
    });
  });

  describe('generateAddressWithMetadata', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate address with full metadata', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const derivationPath = "m/44'/1'/0'/0/0";

      const addressObj = generator.generateAddressWithMetadata(
        node,
        'legacy',
        derivationPath,
        0,
        false
      );

      expect(addressObj).toBeDefined();
      expect(addressObj.address).toBeDefined();
      expect(addressObj.derivationPath).toBe(derivationPath);
      expect(addressObj.index).toBe(0);
      expect(addressObj.isChange).toBe(false);
      expect(addressObj.used).toBe(false);
    });

    it('should mark change addresses correctly', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const derivationPath = "m/44'/1'/0'/1/0";

      const addressObj = generator.generateAddressWithMetadata(
        node,
        'legacy',
        derivationPath,
        0,
        true
      );

      expect(addressObj.isChange).toBe(true);
    });

    it('should handle different address indices', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 5);
      const derivationPath = "m/44'/1'/0'/0/5";

      const addressObj = generator.generateAddressWithMetadata(
        node,
        'legacy',
        derivationPath,
        5,
        false
      );

      expect(addressObj.index).toBe(5);
    });

    it('should initialize used flag as false', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const addressObj = generator.generateAddressWithMetadata(
        node,
        'legacy',
        "m/44'/1'/0'/0/0",
        0,
        false
      );

      expect(addressObj.used).toBe(false);
    });
  });

  describe('validateAddress', () => {
    let generator: AddressGenerator;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
    });

    it('should validate correct testnet legacy address', () => {
      // Known testnet address
      const validAddress = 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef';
      expect(generator.validateAddress(validAddress)).toBe(true);
    });

    it('should validate correct testnet SegWit address', () => {
      // Known testnet P2SH address
      const validAddress = '2N3oefVeg6stiTb5Kh3ozCSkaqmx91FDbsm';
      expect(generator.validateAddress(validAddress)).toBe(true);
    });

    it('should validate correct testnet Native SegWit address', () => {
      // Known testnet bech32 address
      const validAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      expect(generator.validateAddress(validAddress)).toBe(true);
    });

    it('should reject invalid address', () => {
      const invalidAddress = 'invalid_address';
      expect(generator.validateAddress(invalidAddress)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(generator.validateAddress('')).toBe(false);
    });

    it('should reject mainnet address for testnet generator', () => {
      const mainnetAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // Bitcoin genesis address
      expect(generator.validateAddress(mainnetAddress)).toBe(false);
    });

    it('should reject address with invalid checksum', () => {
      // Valid format but wrong checksum
      const invalidChecksum = 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhe0';
      expect(generator.validateAddress(invalidChecksum)).toBe(false);
    });

    it('should reject null', () => {
      expect(generator.validateAddress(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(generator.validateAddress(undefined as any)).toBe(false);
    });
  });

  describe('getAddressType', () => {
    let testnetGenerator: AddressGenerator;
    let mainnetGenerator: AddressGenerator;

    beforeEach(() => {
      testnetGenerator = new AddressGenerator('testnet');
      mainnetGenerator = new AddressGenerator('mainnet');
    });

    it('should detect testnet legacy address type', () => {
      const address = 'mzBc4XEFSdzCDcTxAgf6EZXgsZWpztRhef'; // starts with 'm'
      expect(testnetGenerator.getAddressType(address)).toBe('legacy');
    });

    it('should detect testnet legacy address type (n prefix)', () => {
      const address = 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF'; // starts with 'n'
      expect(testnetGenerator.getAddressType(address)).toBe('legacy');
    });

    it('should detect testnet SegWit address type', () => {
      const address = '2N3oefVeg6stiTb5Kh3ozCSkaqmx91FDbsm'; // starts with '2'
      expect(testnetGenerator.getAddressType(address)).toBe('segwit');
    });

    it('should detect testnet Native SegWit address type', () => {
      const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'; // starts with 'tb1'
      expect(testnetGenerator.getAddressType(address)).toBe('native-segwit');
    });

    it('should detect mainnet legacy address type', () => {
      const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'; // starts with '1'
      expect(mainnetGenerator.getAddressType(address)).toBe('legacy');
    });

    it('should detect mainnet SegWit address type', () => {
      const address = '3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy'; // starts with '3'
      // First verify it's valid for mainnet
      if (!mainnetGenerator.validateAddress(address)) {
        // Use a known valid mainnet P2SH address
        const validP2SH = '3Cbq7aT1tY8kMxWLbitaG7yT6bPbKChq64';
        expect(mainnetGenerator.getAddressType(validP2SH)).toBe('segwit');
      } else {
        expect(mainnetGenerator.getAddressType(address)).toBe('segwit');
      }
    });

    it('should detect mainnet Native SegWit address type', () => {
      const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'; // starts with 'bc1'
      expect(mainnetGenerator.getAddressType(address)).toBe('native-segwit');
    });

    it('should return null for invalid address', () => {
      expect(testnetGenerator.getAddressType('invalid')).toBeNull();
    });

    it('should return null for wrong network address', () => {
      const mainnetAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      expect(testnetGenerator.getAddressType(mainnetAddress)).toBeNull();
    });
  });

  describe('getScriptPubKey', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate scriptPubKey for legacy address', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address = generator.generateAddress(node, 'legacy');
      const scriptPubKey = generator.getScriptPubKey(address);

      expect(scriptPubKey).toBeDefined();
      expect(typeof scriptPubKey).toBe('string');
      expect(scriptPubKey.length).toBeGreaterThan(0);
      // Legacy P2PKH script is 25 bytes = 50 hex chars
      expect(scriptPubKey.length).toBe(50);
    });

    it('should generate scriptPubKey for SegWit address', () => {
      const node = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'segwit');
      const scriptPubKey = generator.getScriptPubKey(address);

      expect(scriptPubKey).toBeDefined();
      expect(typeof scriptPubKey).toBe('string');
      expect(scriptPubKey.length).toBeGreaterThan(0);
    });

    it('should generate scriptPubKey for Native SegWit address', () => {
      const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'native-segwit');
      const scriptPubKey = generator.getScriptPubKey(address);

      expect(scriptPubKey).toBeDefined();
      expect(typeof scriptPubKey).toBe('string');
      expect(scriptPubKey.length).toBeGreaterThan(0);
    });

    it('should generate valid hex string', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address = generator.generateAddress(node, 'legacy');
      const scriptPubKey = generator.getScriptPubKey(address);

      // Check if valid hex
      const hexRegex = /^[0-9a-f]+$/i;
      expect(hexRegex.test(scriptPubKey)).toBe(true);
    });

    it('should throw error for invalid address', () => {
      expect(() => generator.getScriptPubKey('invalid_address')).toThrow('Failed to get scriptPubKey');
    });

    it('should generate consistent scriptPubKey for same address', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address = generator.generateAddress(node, 'legacy');

      const scriptPubKey1 = generator.getScriptPubKey(address);
      const scriptPubKey2 = generator.getScriptPubKey(address);

      expect(scriptPubKey1).toBe(scriptPubKey2);
    });
  });

  describe('getPayment', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should get payment object for legacy address', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const address = generator.generateAddress(node, 'legacy');
      const payment = generator.getPayment(address);

      expect(payment).toBeDefined();
      expect(payment.output).toBeDefined();
      expect(payment.address).toBe(address);
    });

    it('should get payment object for SegWit address', () => {
      const node = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'segwit');
      const payment = generator.getPayment(address);

      expect(payment).toBeDefined();
      expect(payment.output).toBeDefined();
    });

    it('should get payment object for Native SegWit address', () => {
      const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const address = generator.generateAddress(node, 'native-segwit');
      const payment = generator.getPayment(address);

      expect(payment).toBeDefined();
      expect(payment.output).toBeDefined();
    });

    it('should throw error for invalid address', () => {
      expect(() => generator.getPayment('invalid_address')).toThrow('Failed to get payment object');
    });
  });

  describe('getNetwork', () => {
    it('should return correct bitcoinjs-lib network for testnet', () => {
      const generator = new AddressGenerator('testnet');
      const network = generator.getNetwork();

      expect(network).toBeDefined();
      expect(network.bech32).toBe('tb');
      expect(network.pubKeyHash).toBe(0x6f);
    });

    it('should return correct bitcoinjs-lib network for mainnet', () => {
      const generator = new AddressGenerator('mainnet');
      const network = generator.getNetwork();

      expect(network).toBeDefined();
      expect(network.bech32).toBe('bc');
      expect(network.pubKeyHash).toBe(0x00);
    });
  });

  describe('Address generation consistency across all types', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate unique addresses for each address type', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 0);

      // Generate addresses from different paths
      const legacyNode = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const segwitNode = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const nativeSegwitNode = wallet.deriveAddressNode('native-segwit', 0, 0, 0);

      const legacyAddr = generator.generateAddress(legacyNode, 'legacy');
      const segwitAddr = generator.generateAddress(segwitNode, 'segwit');
      const nativeSegwitAddr = generator.generateAddress(nativeSegwitNode, 'native-segwit');

      // All should be different
      expect(legacyAddr).not.toBe(segwitAddr);
      expect(segwitAddr).not.toBe(nativeSegwitAddr);
      expect(legacyAddr).not.toBe(nativeSegwitAddr);
    });

    it('should validate all generated address types', () => {
      const legacyNode = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const segwitNode = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const nativeSegwitNode = wallet.deriveAddressNode('native-segwit', 0, 0, 0);

      const legacyAddr = generator.generateAddress(legacyNode, 'legacy');
      const segwitAddr = generator.generateAddress(segwitNode, 'segwit');
      const nativeSegwitAddr = generator.generateAddress(nativeSegwitNode, 'native-segwit');

      expect(generator.validateAddress(legacyAddr)).toBe(true);
      expect(generator.validateAddress(segwitAddr)).toBe(true);
      expect(generator.validateAddress(nativeSegwitAddr)).toBe(true);
    });

    it('should correctly identify all generated address types', () => {
      const legacyNode = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const segwitNode = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const nativeSegwitNode = wallet.deriveAddressNode('native-segwit', 0, 0, 0);

      const legacyAddr = generator.generateAddress(legacyNode, 'legacy');
      const segwitAddr = generator.generateAddress(segwitNode, 'segwit');
      const nativeSegwitAddr = generator.generateAddress(nativeSegwitNode, 'native-segwit');

      expect(generator.getAddressType(legacyAddr)).toBe('legacy');
      expect(generator.getAddressType(segwitAddr)).toBe('segwit');
      expect(generator.getAddressType(nativeSegwitAddr)).toBe('native-segwit');
    });
  });

  describe('Edge cases', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should handle high address indices', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 0, 1000);
      const address = generator.generateAddress(node, 'legacy');

      expect(address).toBeDefined();
      expect(generator.validateAddress(address)).toBe(true);
    });

    it('should generate addresses for multiple accounts', () => {
      const addresses = [];
      for (let i = 0; i < 5; i++) {
        const node = wallet.deriveAddressNode('legacy', i, 0, 0);
        const address = generator.generateAddress(node, 'legacy');
        addresses.push(address);
      }

      // All should be unique
      const uniqueAddresses = new Set(addresses);
      expect(uniqueAddresses.size).toBe(5);
    });

    it('should handle change addresses', () => {
      const externalNode = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);

      const externalAddr = generator.generateAddress(externalNode, 'legacy');
      const changeAddr = generator.generateAddress(changeNode, 'legacy');

      expect(externalAddr).not.toBe(changeAddr);
      expect(generator.validateAddress(externalAddr)).toBe(true);
      expect(generator.validateAddress(changeAddr)).toBe(true);
    });
  });

  // ========================================================================
  // MULTISIG ADDRESS GENERATION TESTS
  // ========================================================================

  describe('generateMultisigAddress - P2SH', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate P2SH multisig address (2-of-2)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 2, 'p2sh');

      expect(address).toBeDefined();
      expect(typeof address).toBe('string');
      expect(address.startsWith('2')).toBe(true); // Testnet P2SH
    });

    it('should generate P2SH multisig address (2-of-3)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const node3 = wallet.deriveAddressNode('legacy', 0, 0, 2);
      const publicKeys = [node1.publicKey, node2.publicKey, node3.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 2, 'p2sh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true);
    });

    it('should generate P2SH multisig address (3-of-5)', () => {
      const publicKeys = [];
      for (let i = 0; i < 5; i++) {
        const node = wallet.deriveAddressNode('legacy', 0, 0, i);
        publicKeys.push(node.publicKey);
      }

      const address = generator.generateMultisigAddress(publicKeys, 3, 'p2sh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true);
    });

    it('should generate consistent addresses for same keys (BIP67 sorting)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);

      // Same keys in different order should produce same address
      const address1 = generator.generateMultisigAddress([node1.publicKey, node2.publicKey], 2, 'p2sh');
      const address2 = generator.generateMultisigAddress([node2.publicKey, node1.publicKey], 2, 'p2sh');

      expect(address1).toBe(address2);
    });

    it('should throw error for invalid M value (M > N)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      expect(() => generator.generateMultisigAddress(publicKeys, 3, 'p2sh')).toThrow('Invalid M value');
    });

    it('should throw error for invalid M value (M < 1)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      expect(() => generator.generateMultisigAddress(publicKeys, 0, 'p2sh')).toThrow('Invalid M value');
    });

    it('should generate mainnet P2SH multisig starting with 3', () => {
      const mainnetGenerator = new AddressGenerator('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const node1 = mainnetWallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = mainnetWallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const address = mainnetGenerator.generateMultisigAddress(publicKeys, 2, 'p2sh');

      expect(address.startsWith('3')).toBe(true);
    });
  });

  describe('generateMultisigAddress - P2WSH', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate P2WSH multisig address (2-of-2)', () => {
      const node1 = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 2, 'p2wsh');

      expect(address).toBeDefined();
      expect(address.startsWith('tb1')).toBe(true); // Testnet Bech32
    });

    it('should generate P2WSH multisig address (2-of-3)', () => {
      const node1 = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const node3 = wallet.deriveAddressNode('native-segwit', 0, 0, 2);
      const publicKeys = [node1.publicKey, node2.publicKey, node3.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 2, 'p2wsh');

      expect(address).toBeDefined();
      expect(address.startsWith('tb1')).toBe(true);
    });

    it('should generate consistent addresses for same keys', () => {
      const node1 = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('native-segwit', 0, 0, 1);

      const address1 = generator.generateMultisigAddress([node1.publicKey, node2.publicKey], 2, 'p2wsh');
      const address2 = generator.generateMultisigAddress([node2.publicKey, node1.publicKey], 2, 'p2wsh');

      expect(address1).toBe(address2);
    });

    it('should generate mainnet P2WSH multisig starting with bc1', () => {
      const mainnetGenerator = new AddressGenerator('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const node1 = mainnetWallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = mainnetWallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const address = mainnetGenerator.generateMultisigAddress(publicKeys, 2, 'p2wsh');

      expect(address.startsWith('bc1')).toBe(true);
    });
  });

  describe('generateMultisigAddress - P2SH-P2WSH', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate P2SH-P2WSH multisig address (2-of-2)', () => {
      const node1 = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('segwit', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 2, 'p2sh-p2wsh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true); // Testnet P2SH wrapper
    });

    it('should generate P2SH-P2WSH multisig address (2-of-3)', () => {
      const node1 = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('segwit', 0, 0, 1);
      const node3 = wallet.deriveAddressNode('segwit', 0, 0, 2);
      const publicKeys = [node1.publicKey, node2.publicKey, node3.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 2, 'p2sh-p2wsh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true);
    });

    it('should generate consistent addresses for same keys', () => {
      const node1 = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('segwit', 0, 0, 1);

      const address1 = generator.generateMultisigAddress([node1.publicKey, node2.publicKey], 2, 'p2sh-p2wsh');
      const address2 = generator.generateMultisigAddress([node2.publicKey, node1.publicKey], 2, 'p2sh-p2wsh');

      expect(address1).toBe(address2);
    });

    it('should throw error for unsupported multisig type', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      expect(() => generator.generateMultisigAddress(publicKeys, 2, 'invalid' as any)).toThrow('Unsupported multisig address type');
    });
  });

  describe('generateMultisigAddressWithMetadata', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate P2SH multisig with full metadata including redeemScript', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];
      const derivationPath = "m/48'/1'/0'/1'";

      const metadata = generator.generateMultisigAddressWithMetadata(
        publicKeys,
        2,
        'p2sh',
        derivationPath,
        0,
        false
      );

      expect(metadata.address).toBeDefined();
      expect(metadata.address.startsWith('2')).toBe(true);
      expect(metadata.derivationPath).toBe(derivationPath);
      expect(metadata.index).toBe(0);
      expect(metadata.isChange).toBe(false);
      expect(metadata.used).toBe(false);
      expect(metadata.redeemScript).toBeDefined();
      expect(typeof metadata.redeemScript).toBe('string');
      expect(metadata.redeemScript!.length).toBeGreaterThan(0);
    });

    it('should generate P2WSH multisig with witnessScript', () => {
      const node1 = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const metadata = generator.generateMultisigAddressWithMetadata(
        publicKeys,
        2,
        'p2wsh',
        "m/48'/1'/0'/2'",
        0,
        false
      );

      expect(metadata.address).toBeDefined();
      expect(metadata.witnessScript).toBeDefined();
      expect(typeof metadata.witnessScript).toBe('string');
      expect(metadata.redeemScript).toBeUndefined();
    });

    it('should generate P2SH-P2WSH multisig with both scripts', () => {
      const node1 = wallet.deriveAddressNode('segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('segwit', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const metadata = generator.generateMultisigAddressWithMetadata(
        publicKeys,
        2,
        'p2sh-p2wsh',
        "m/48'/1'/0'/1'",
        0,
        false
      );

      expect(metadata.address).toBeDefined();
      expect(metadata.redeemScript).toBeDefined();
      expect(metadata.witnessScript).toBeDefined();
      expect(typeof metadata.redeemScript).toBe('string');
      expect(typeof metadata.witnessScript).toBe('string');
    });

    it('should handle change addresses correctly', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const metadata = generator.generateMultisigAddressWithMetadata(
        publicKeys,
        2,
        'p2sh',
        "m/48'/1'/0'/1'/1/0",
        0,
        true
      );

      expect(metadata.isChange).toBe(true);
    });

    it('should handle different address indices', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const metadata = generator.generateMultisigAddressWithMetadata(
        publicKeys,
        2,
        'p2sh',
        "m/48'/1'/0'/1'/0/5",
        5,
        false
      );

      expect(metadata.index).toBe(5);
    });

    it('should generate consistent addresses for same keys (BIP67)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);

      const metadata1 = generator.generateMultisigAddressWithMetadata(
        [node1.publicKey, node2.publicKey],
        2,
        'p2sh',
        "m/48'/1'/0'/1'",
        0,
        false
      );

      const metadata2 = generator.generateMultisigAddressWithMetadata(
        [node2.publicKey, node1.publicKey],
        2,
        'p2sh',
        "m/48'/1'/0'/1'",
        0,
        false
      );

      expect(metadata1.address).toBe(metadata2.address);
      expect(metadata1.redeemScript).toBe(metadata2.redeemScript);
    });
  });

  describe('getMultisigRedeemScript', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate redeem script for multisig', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const redeemScript = generator.getMultisigRedeemScript(publicKeys, 2);

      expect(redeemScript).toBeDefined();
      expect(typeof redeemScript).toBe('string');
      expect(redeemScript.length).toBeGreaterThan(0);
      // Valid hex
      expect(/^[0-9a-f]+$/i.test(redeemScript)).toBe(true);
    });

    it('should generate consistent redeem scripts for same keys', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);

      const script1 = generator.getMultisigRedeemScript([node1.publicKey, node2.publicKey], 2);
      const script2 = generator.getMultisigRedeemScript([node2.publicKey, node1.publicKey], 2);

      expect(script1).toBe(script2);
    });

    it('should generate different redeem scripts for different M values', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const node3 = wallet.deriveAddressNode('legacy', 0, 0, 2);
      const publicKeys = [node1.publicKey, node2.publicKey, node3.publicKey];

      const script2of3 = generator.getMultisigRedeemScript(publicKeys, 2);
      const script3of3 = generator.getMultisigRedeemScript(publicKeys, 3);

      expect(script2of3).not.toBe(script3of3);
    });
  });

  describe('getMultisigWitnessScript', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should generate witness script for multisig', () => {
      const node1 = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const witnessScript = generator.getMultisigWitnessScript(publicKeys, 2);

      expect(witnessScript).toBeDefined();
      expect(typeof witnessScript).toBe('string');
      expect(witnessScript.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/i.test(witnessScript)).toBe(true);
    });

    it('should match redeem script (witness script is same structure)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const redeemScript = generator.getMultisigRedeemScript(publicKeys, 2);
      const witnessScript = generator.getMultisigWitnessScript(publicKeys, 2);

      expect(redeemScript).toBe(witnessScript);
    });
  });

  describe('Multisig validation and edge cases', () => {
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should handle maximum number of cosigners (15)', () => {
      const publicKeys = [];
      for (let i = 0; i < 15; i++) {
        const node = wallet.deriveAddressNode('legacy', 0, 0, i);
        publicKeys.push(node.publicKey);
      }

      const address = generator.generateMultisigAddress(publicKeys, 10, 'p2sh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true);
    });

    it('should generate 1-of-2 multisig', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 1, 'p2sh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true);
    });

    it('should generate N-of-N multisig (all signatures required)', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const node3 = wallet.deriveAddressNode('legacy', 0, 0, 2);
      const publicKeys = [node1.publicKey, node2.publicKey, node3.publicKey];

      const address = generator.generateMultisigAddress(publicKeys, 3, 'p2sh');

      expect(address).toBeDefined();
      expect(address.startsWith('2')).toBe(true);
    });

    it('should validate generated multisig addresses', () => {
      const node1 = wallet.deriveAddressNode('legacy', 0, 0, 0);
      const node2 = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const publicKeys = [node1.publicKey, node2.publicKey];

      const p2shAddr = generator.generateMultisigAddress(publicKeys, 2, 'p2sh');
      const p2wshAddr = generator.generateMultisigAddress(publicKeys, 2, 'p2wsh');
      const p2shp2wshAddr = generator.generateMultisigAddress(publicKeys, 2, 'p2sh-p2wsh');

      expect(generator.validateAddress(p2shAddr)).toBe(true);
      expect(generator.validateAddress(p2wshAddr)).toBe(true);
      expect(generator.validateAddress(p2shp2wshAddr)).toBe(true);
    });
  });
});
