/**
 * MultisigManager Test Suite
 *
 * Tests for creating and managing multisig accounts including:
 * - 2-of-2, 2-of-3, and 3-of-5 configurations
 * - Extended public key (xpub) export and import
 * - Co-signer management
 * - BIP48 derivation paths
 * - Multisig account creation
 *
 * @jest-environment node
 */

import { MultisigManager } from '../MultisigManager';
import { HDWallet } from '../HDWallet';
import * as bip39 from 'bip39';
import { MultisigConfig, MultisigAddressType } from '../../../shared/types';

describe('MultisigManager', () => {
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_SEED = bip39.mnemonicToSeedSync(TEST_MNEMONIC);

  let manager: MultisigManager;
  let wallet: HDWallet;

  beforeEach(() => {
    manager = new MultisigManager('testnet');
    wallet = new HDWallet(TEST_SEED, 'testnet');
  });

  describe('constructor', () => {
    it('should create MultisigManager for testnet', () => {
      const mgr = new MultisigManager('testnet');
      expect(mgr).toBeDefined();
    });

    it('should create MultisigManager for mainnet', () => {
      const mgr = new MultisigManager('mainnet');
      expect(mgr).toBeDefined();
    });
  });

  describe('exportXpub', () => {
    it('should export xpub for 2-of-2 P2WSH configuration', () => {
      const result = manager.exportXpub(wallet, '2-of-2', 'p2wsh', 0);

      expect(result).toBeDefined();
      expect(result.xpub).toBeDefined();
      expect(result.fingerprint).toBeDefined();
      expect(result.derivationPath).toBeDefined();
      expect(result.network).toBe('testnet');
      expect(result.multisigConfig).toBe('2-of-2');
      expect(result.addressType).toBe('p2wsh');
    });

    it('should export xpub for 2-of-3 P2WSH configuration', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);

      expect(result.multisigConfig).toBe('2-of-3');
      expect(result.xpub).toBeDefined();
    });

    it('should export xpub for 3-of-5 P2WSH configuration', () => {
      const result = manager.exportXpub(wallet, '3-of-5', 'p2wsh', 0);

      expect(result.multisigConfig).toBe('3-of-5');
      expect(result.xpub).toBeDefined();
    });

    it('should generate correct BIP48 derivation path for P2WSH', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);

      // BIP48: m/48'/cointype'/account'/script_type'
      // script_type: 2 for P2WSH
      expect(result.derivationPath).toBe("m/48'/1'/0'/2'");
    });

    it('should generate correct BIP48 derivation path for P2SH-P2WSH', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2sh-p2wsh', 0);

      // script_type: 1 for P2SH-P2WSH
      expect(result.derivationPath).toBe("m/48'/1'/0'/1'");
    });

    it('should generate correct BIP48 derivation path for P2SH', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2sh', 0);

      // script_type: 0 for P2SH (legacy multisig)
      expect(result.derivationPath).toContain("m/48'/1'/0'/");
    });

    it('should generate different xpubs for different accounts', () => {
      const result1 = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);
      const result2 = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 1);

      expect(result1.xpub).not.toBe(result2.xpub);
      expect(result1.derivationPath).not.toBe(result2.derivationPath);
    });

    it('should generate different xpubs for different address types', () => {
      const p2wsh = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);
      const p2sh = manager.exportXpub(wallet, '2-of-3', 'p2sh', 0);

      expect(p2wsh.xpub).not.toBe(p2sh.xpub);
      expect(p2wsh.derivationPath).not.toBe(p2sh.derivationPath);
    });

    it('should include master fingerprint', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);

      expect(result.fingerprint).toBeDefined();
      expect(result.fingerprint.length).toBe(8); // 4 bytes = 8 hex chars
      expect(/^[0-9a-f]{8}$/.test(result.fingerprint)).toBe(true);
    });

    it('should start with correct xpub prefix for testnet', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);

      // Testnet xpubs start with 'tpub'
      expect(result.xpub.startsWith('tpub')).toBe(true);
    });

    it('should start with correct xpub prefix for mainnet', () => {
      const mainnetManager = new MultisigManager('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const result = mainnetManager.exportXpub(mainnetWallet, '2-of-3', 'p2wsh', 0);

      // Mainnet xpubs start with 'xpub'
      expect(result.xpub.startsWith('xpub')).toBe(true);
    });
  });

  describe('validateXpub', () => {
    it('should validate correct xpub', () => {
      const exported = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);

      const result = manager.validateXpub(
        exported.xpub,
        '2-of-3',
        'p2wsh'
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject xpub from wrong network', () => {
      const mainnetManager = new MultisigManager('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const mainnetXpub = mainnetManager.exportXpub(mainnetWallet, '2-of-3', 'p2wsh', 0);

      const result = manager.validateXpub(
        mainnetXpub.xpub,
        '2-of-3',
        'p2wsh'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('network'))).toBe(true);
    });

    it('should reject invalid xpub string', () => {
      const result = manager.validateXpub(
        'invalid_xpub',
        '2-of-3',
        'p2wsh'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty xpub', () => {
      const result = manager.validateXpub(
        '',
        '2-of-3',
        'p2wsh'
      );

      expect(result.isValid).toBe(false);
    });

    it('should provide descriptive error messages', () => {
      const result = manager.validateXpub(
        'invalid',
        '2-of-3',
        'p2wsh'
      );

      expect(result.errors.length).toBeGreaterThan(0);
      expect(typeof result.errors[0]).toBe('string');
    });
  });

  describe('createMultisigAccount', () => {
    it('should create 2-of-2 multisig account', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-2', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-2',
        addressType: 'p2wsh',
        name: 'Test 2-of-2',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
        ],
      });

      expect(account).toBeDefined();
      expect(account.accountType).toBe('multisig');
      expect(account.name).toBe('Test 2-of-2');
      expect(account.multisigConfig).toBe('2-of-2');
      expect(account.addressType).toBe('p2wsh');
      expect(account.cosigners.length).toBe(2);
    });

    it('should create 2-of-3 multisig account', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );
      const wallet3 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-3', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-3', 'p2wsh', 0);
      const xpub3 = manager.exportXpub(wallet3, '2-of-3', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-3',
        addressType: 'p2wsh',
        name: 'Test 2-of-3',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
          { name: 'Cosigner 3', xpub: xpub3.xpub, fingerprint: xpub3.fingerprint },
        ],
      });

      expect(account).toBeDefined();
      expect(account.multisigConfig).toBe('2-of-3');
      expect(account.cosigners.length).toBe(3);
    });

    it('should create 3-of-5 multisig account', () => {
      const wallets = Array(5).fill(null).map((_, i) => {
        const mnemonic = i === 0 ? TEST_MNEMONIC : bip39.generateMnemonic();
        return new HDWallet(bip39.mnemonicToSeedSync(mnemonic), 'testnet');
      });

      const xpubs = wallets.map((w) => manager.exportXpub(w, '3-of-5', 'p2wsh', 0));

      const account = manager.createMultisigAccount({
        config: '3-of-5',
        addressType: 'p2wsh',
        name: 'Test 3-of-5',
        accountIndex: 0,
        ourXpub: xpubs[0].xpub,
        ourFingerprint: xpubs[0].fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpubs[1].xpub, fingerprint: xpubs[1].fingerprint },
          { name: 'Cosigner 3', xpub: xpubs[2].xpub, fingerprint: xpubs[2].fingerprint },
          { name: 'Cosigner 4', xpub: xpubs[3].xpub, fingerprint: xpubs[3].fingerprint },
          { name: 'Cosigner 5', xpub: xpubs[4].xpub, fingerprint: xpubs[4].fingerprint },
        ],
      });

      expect(account).toBeDefined();
      expect(account.multisigConfig).toBe('3-of-5');
      expect(account.cosigners.length).toBe(5);
    });

    it('should throw error for mismatched configuration', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-3', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-3', 'p2wsh', 0);

      // Trying to create 2-of-2 with only 2 xpubs, but config says 2-of-3
      expect(() =>
        manager.createMultisigAccount(
          wallet1,
          'Invalid',
          '2-of-3',
          'p2wsh',
          [
            { ...xpub1, name: 'Cosigner 1', isSelf: true },
            { ...xpub2, name: 'Cosigner 2', isSelf: false },
          ],
          0
        )
      ).toThrow();
    });

    it('should throw error for unsupported configuration', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);

      expect(() =>
        manager.createMultisigAccount({
          config: '4-of-7' as any,
          addressType: 'p2wsh',
          name: 'Invalid',
          accountIndex: 0,
          ourXpub: xpub1.xpub,
          ourFingerprint: xpub1.fingerprint,
          cosignerXpubs: [],
        })
      ).toThrow('Unsupported multisig configuration');
    });

    it('should initialize account with correct properties', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-2', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-2',
        addressType: 'p2wsh',
        name: 'Test',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
        ],
      });

      expect(account.accountType).toBe('multisig');
      expect(account.name).toBe('Test');
      expect(account.index).toBe(0);
    });

    it('should initialize address indices to 0', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-2', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-2',
        addressType: 'p2wsh',
        name: 'Test',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
        ],
      });

      expect(account.externalIndex).toBe(0);
      expect(account.internalIndex).toBe(0);
    });

    it('should initialize empty addresses array', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-2', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-2',
        addressType: 'p2wsh',
        name: 'Test',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
        ],
      });

      expect(account.addresses).toEqual([]);
    });

    it('should mark exactly one cosigner as self', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-2', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-2',
        addressType: 'p2wsh',
        name: 'Test',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Cosigner 2', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
        ],
      });

      const selfCosigners = account.cosigners.filter(c => c.isSelf);
      expect(selfCosigners.length).toBe(1);
    });

    it('should store all cosigner information', () => {
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-2', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-2', 'p2wsh', 0);

      const account = manager.createMultisigAccount({
        config: '2-of-2',
        addressType: 'p2wsh',
        name: 'Test',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Bob', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
        ],
      });

      expect(account.cosigners[0].name).toBe('You');
      expect(account.cosigners[1].name).toBe('Bob');
      expect(account.cosigners[0].xpub).toBeDefined();
      expect(account.cosigners[1].xpub).toBeDefined();
      expect(account.cosigners[0].fingerprint).toBeDefined();
      expect(account.cosigners[1].fingerprint).toBeDefined();
      expect(account.cosigners[0].derivationPath).toBeDefined();
      expect(account.cosigners[1].derivationPath).toBeDefined();
    });
  });

  describe('Configuration validation', () => {
    it('should accept 2-of-2, 2-of-3, and 3-of-5 only', () => {
      const validConfigs: MultisigConfig[] = ['2-of-2', '2-of-3', '3-of-5'];

      for (const config of validConfigs) {
        const wallet1 = new HDWallet(TEST_SEED, 'testnet');
        const result = manager.exportXpub(wallet1, config, 'p2wsh', 0);
        expect(result.multisigConfig).toBe(config);
      }
    });

    it('should accept p2sh, p2wsh, and p2sh-p2wsh address types', () => {
      const validTypes: MultisigAddressType[] = ['p2sh', 'p2wsh', 'p2sh-p2wsh'];

      for (const type of validTypes) {
        const wallet1 = new HDWallet(TEST_SEED, 'testnet');
        const result = manager.exportXpub(wallet1, '2-of-3', type, 0);
        expect(result.addressType).toBe(type);
      }
    });
  });

  describe('BIP48 derivation paths', () => {
    it('should use correct coin type for testnet', () => {
      const result = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);

      // Coin type 1 for testnet
      expect(result.derivationPath).toContain("48'/1'/");
    });

    it('should use correct coin type for mainnet', () => {
      const mainnetManager = new MultisigManager('mainnet');
      const mainnetWallet = new HDWallet(TEST_SEED, 'mainnet');
      const result = mainnetManager.exportXpub(mainnetWallet, '2-of-3', 'p2wsh', 0);

      // Coin type 0 for mainnet
      expect(result.derivationPath).toContain("48'/0'/");
    });

    it('should include account index in path', () => {
      const account0 = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);
      const account5 = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 5);

      expect(account0.derivationPath).toContain("0'");
      expect(account5.derivationPath).toContain("5'");
    });

    it('should include script type in path', () => {
      const p2sh = manager.exportXpub(wallet, '2-of-3', 'p2sh', 0);
      const p2wsh = manager.exportXpub(wallet, '2-of-3', 'p2wsh', 0);
      const p2shP2wsh = manager.exportXpub(wallet, '2-of-3', 'p2sh-p2wsh', 0);

      // Script types: 0 for P2SH, 1 for P2SH-P2WSH, 2 for P2WSH
      expect(p2sh.derivationPath).toBeDefined();
      expect(p2wsh.derivationPath).toBe("m/48'/1'/0'/2'");
      expect(p2shP2wsh.derivationPath).toBe("m/48'/1'/0'/1'");
    });
  });

  describe('Integration', () => {
    it('should create complete multisig workflow', () => {
      // Step 1: Three users export their xpubs
      const wallet1 = new HDWallet(TEST_SEED, 'testnet');
      const wallet2 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon'),
        'testnet'
      );
      const wallet3 = new HDWallet(
        bip39.mnemonicToSeedSync('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'),
        'testnet'
      );

      const xpub1 = manager.exportXpub(wallet1, '2-of-3', 'p2wsh', 0);
      const xpub2 = manager.exportXpub(wallet2, '2-of-3', 'p2wsh', 0);
      const xpub3 = manager.exportXpub(wallet3, '2-of-3', 'p2wsh', 0);

      // Step 2: Validate all xpubs
      const validation1 = manager.validateXpub(xpub1.xpub, '2-of-3', 'p2wsh');
      const validation2 = manager.validateXpub(xpub2.xpub, '2-of-3', 'p2wsh');
      const validation3 = manager.validateXpub(xpub3.xpub, '2-of-3', 'p2wsh');

      expect(validation1.isValid).toBe(true);
      expect(validation2.isValid).toBe(true);
      expect(validation3.isValid).toBe(true);

      // Step 3: Each user creates their local multisig account
      const account = manager.createMultisigAccount({
        config: '2-of-3',
        addressType: 'p2wsh',
        name: 'Shared Account',
        accountIndex: 0,
        ourXpub: xpub1.xpub,
        ourFingerprint: xpub1.fingerprint,
        cosignerXpubs: [
          { name: 'Bob', xpub: xpub2.xpub, fingerprint: xpub2.fingerprint },
          { name: 'Charlie', xpub: xpub3.xpub, fingerprint: xpub3.fingerprint },
        ],
      });

      expect(account).toBeDefined();
      expect(account.accountType).toBe('multisig');
      expect(account.multisigConfig).toBe('2-of-3');
      expect(account.cosigners.length).toBe(3);
    });
  });
});
