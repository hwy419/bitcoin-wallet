/**
 * XpubAddressDerivation Test Suite
 *
 * Comprehensive tests for HD address derivation from xpubs:
 * - Initial address derivation (20 addresses: 10 external + 10 internal)
 * - Address expansion (20 → 100 addresses)
 * - External vs internal (change) address derivation
 * - Gap limit enforcement
 * - BIP32 compliance
 * - Address format validation (P2PKH, P2SH-P2WPKH, P2WPKH)
 * - Derivation path correctness
 * - Edge cases and error handling
 *
 * Bitcoin protocol implementation - requires high coverage
 *
 * @jest-environment node
 */

import {
  XpubAddressDerivation,
  INITIAL_GAP_LIMIT,
  MAX_GAP_LIMIT,
} from '../XpubAddressDerivation';
import { DerivedAddress } from '../../../shared/types';

describe('XpubAddressDerivation', () => {
  // Test xpubs (valid BIP32 extended public keys)
  const VALID_TESTNET_TPUB =
    'tpubD6NzVbkrYhZ4XgiXtGrdW5XDAPFCL9h7we1vwNCpn8tGbBcgfVYjXyhWo4E1xkh56hjod1RhGjxbaTLV3X4FyWuejifB9jusQ46QzG87VKp';
  const VALID_TESTNET_UPUB =
    'upub5EFU65HtV5TeiSHmZZm7FUffBGy8UKeqp7vw43jYbvZPpoVsgU93oac7Wk3u6moKegAEWtGNF8DehrnHtv21XXEMYRUocHqguyjknFHYfgY';
  const VALID_TESTNET_VPUB =
    'vpub5Y6cjg78GGuNLsaPhmYsiw4gYX3HoQiRBiSwDaBXKUafCt9bNwWQiitDk5VZ5BVxYnQdwoTyXSs2JHRPAgjAvtbBrf8ZhDYe2jWAqvZVnsc';

  const VALID_MAINNET_XPUB =
    'xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8';
  const VALID_MAINNET_YPUB =
    'ypub6QqdH2c5z7967BioGSfAWFHM1EHzHPBZK7wrND3ZpEWFtzmCqvsD1bgpaE6pSAPkiSKhkuWPCJV6mZTSNMd2tK8xYTcJ48585pZecmSUzWp';
  const VALID_MAINNET_ZPUB =
    'zpub6jftahH18ngZxLmXaKw3GSZzZsszmt9WqedkyZdezFtWRFBZqsQH5hyUmb4pCEeZGmVfQuP5bedXTB8is6fTv19U1GQRyQUKQGUTzyHACMF';

  describe('constants', () => {
    it('should define INITIAL_GAP_LIMIT as 10', () => {
      expect(INITIAL_GAP_LIMIT).toBe(10);
    });

    it('should define MAX_GAP_LIMIT as 50', () => {
      expect(MAX_GAP_LIMIT).toBe(50);
    });
  });

  describe('deriveInitialAddresses', () => {
    it('should derive 20 addresses (10 external + 10 internal)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      expect(addresses).toHaveLength(20);

      const external = addresses.filter(a => !a.isChange);
      const internal = addresses.filter(a => a.isChange);

      expect(external).toHaveLength(10);
      expect(internal).toHaveLength(10);
    });

    it('should derive valid Bitcoin addresses', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      addresses.forEach(addr => {
        expect(addr.address).toBeDefined();
        expect(typeof addr.address).toBe('string');
        expect(addr.address.length).toBeGreaterThan(0);
      });
    });

    it('should derive addresses with correct derivation paths', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      // External addresses: .../0/0, .../0/1, ..., .../0/9
      const external = addresses.filter(a => !a.isChange);
      external.forEach((addr, i) => {
        expect(addr.derivationPath).toContain('/0/' + i);
        expect(addr.index).toBe(i);
      });

      // Internal addresses: .../1/0, .../1/1, ..., .../1/9
      const internal = addresses.filter(a => a.isChange);
      internal.forEach((addr, i) => {
        expect(addr.derivationPath).toContain('/1/' + i);
        expect(addr.index).toBe(i);
      });
    });

    it('should derive testnet addresses for testnet xpub', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      // Testnet legacy addresses start with 'm' or 'n'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('m') || addr.address.startsWith('n')).toBe(true);
      });
    });

    it('should throw error for invalid xpub', () => {
      expect(() => {
        XpubAddressDerivation.deriveInitialAddresses('invalid_xpub', 'testnet');
      }).toThrow();
    });

    it('should throw error for network mismatch', () => {
      expect(() => {
        XpubAddressDerivation.deriveInitialAddresses(VALID_TESTNET_TPUB, 'mainnet');
      }).toThrow(/testnet.*mainnet/);
    });
  });

  describe('deriveAddresses', () => {
    it('should derive addresses with custom gap limit', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        15
      );

      expect(addresses).toHaveLength(30); // 15 external + 15 internal
    });

    it('should derive addresses with gap limit of 1', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        1
      );

      expect(addresses).toHaveLength(2); // 1 external + 1 internal
    });

    it('should derive maximum addresses (50 per chain = 100 total)', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        MAX_GAP_LIMIT
      );

      expect(addresses).toHaveLength(100);
    });

    it('should default to INITIAL_GAP_LIMIT if not specified', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      expect(addresses).toHaveLength(20);
    });

    it('should derive unique addresses', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        20
      );

      const addressStrings = addresses.map(a => a.address);
      const uniqueAddresses = new Set(addressStrings);

      expect(uniqueAddresses.size).toBe(addressStrings.length);
    });

    it('should derive addresses with sequential indices', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        5
      );

      const external = addresses.filter(a => !a.isChange);
      const internal = addresses.filter(a => a.isChange);

      external.forEach((addr, i) => {
        expect(addr.index).toBe(i);
      });

      internal.forEach((addr, i) => {
        expect(addr.index).toBe(i);
      });
    });
  });

  describe('address format by xpub type', () => {
    it('should derive P2PKH addresses from tpub (testnet legacy)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      // Testnet P2PKH addresses start with 'm' or 'n'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('m') || addr.address.startsWith('n')).toBe(true);
      });
    });

    it('should derive P2SH-P2WPKH addresses from upub (testnet segwit)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_UPUB,
        'testnet'
      );

      // Testnet P2SH addresses start with '2'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('2')).toBe(true);
      });
    });

    it('should derive P2WPKH addresses from vpub (testnet native segwit)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_VPUB,
        'testnet'
      );

      // Testnet bech32 addresses start with 'tb1'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('tb1')).toBe(true);
      });
    });

    it('should derive P2PKH addresses from xpub (mainnet legacy)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_MAINNET_XPUB,
        'mainnet'
      );

      // Mainnet P2PKH addresses start with '1'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('1')).toBe(true);
      });
    });

    it('should derive P2SH-P2WPKH addresses from ypub (mainnet segwit)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_MAINNET_YPUB,
        'mainnet'
      );

      // Mainnet P2SH addresses start with '3'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('3')).toBe(true);
      });
    });

    it('should derive P2WPKH addresses from zpub (mainnet native segwit)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_MAINNET_ZPUB,
        'mainnet'
      );

      // Mainnet bech32 addresses start with 'bc1'
      addresses.forEach(addr => {
        expect(addr.address.startsWith('bc1')).toBe(true);
      });
    });
  });

  describe('expandAddresses', () => {
    it('should expand from 20 to 40 addresses', () => {
      const currentCount = 20;
      const newGapLimit = 20; // 20 per chain = 40 total

      const newAddresses = XpubAddressDerivation.expandAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        currentCount,
        newGapLimit
      );

      // Should return only the new 20 addresses (10 external + 10 internal)
      expect(newAddresses).toHaveLength(20);
    });

    it('should expand to maximum (100 addresses)', () => {
      const currentCount = 20;
      const newGapLimit = MAX_GAP_LIMIT;

      const newAddresses = XpubAddressDerivation.expandAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        currentCount,
        newGapLimit
      );

      // Should return 80 new addresses (100 total - 20 existing)
      expect(newAddresses).toHaveLength(80);
    });

    it('should return empty array if already at requested gap limit', () => {
      const currentCount = 40; // Already at gap limit 20
      const newGapLimit = 20;

      const newAddresses = XpubAddressDerivation.expandAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        currentCount,
        newGapLimit
      );

      expect(newAddresses).toHaveLength(0);
    });

    it('should return empty array if already above requested gap limit', () => {
      const currentCount = 60; // Gap limit 30
      const newGapLimit = 20; // Request lower gap limit

      const newAddresses = XpubAddressDerivation.expandAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        currentCount,
        newGapLimit
      );

      expect(newAddresses).toHaveLength(0);
    });

    it('should throw error if new gap limit exceeds maximum', () => {
      expect(() => {
        XpubAddressDerivation.expandAddresses(
          VALID_TESTNET_TPUB,
          'testnet',
          20,
          MAX_GAP_LIMIT + 1
        );
      }).toThrow(/Gap limit cannot exceed/);
    });

    it('should derive addresses with correct indices after expansion', () => {
      const currentCount = 20; // Indices 0-9 for each chain
      const newGapLimit = 15; // Expand to indices 0-14

      const newAddresses = XpubAddressDerivation.expandAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        currentCount,
        newGapLimit
      );

      const newExternal = newAddresses.filter(a => !a.isChange);
      const newInternal = newAddresses.filter(a => a.isChange);

      // External indices should be 10-14
      newExternal.forEach((addr, i) => {
        expect(addr.index).toBe(10 + i);
      });

      // Internal indices should be 10-14
      newInternal.forEach((addr, i) => {
        expect(addr.index).toBe(10 + i);
      });
    });
  });

  describe('deriveAddress (single)', () => {
    it('should derive single external address at index 0', () => {
      const address = XpubAddressDerivation.deriveAddress(
        VALID_TESTNET_TPUB,
        'testnet',
        0,
        false
      );

      expect(address.index).toBe(0);
      expect(address.isChange).toBe(false);
      expect(address.derivationPath).toContain('/0/0');
    });

    it('should derive single internal address at index 0', () => {
      const address = XpubAddressDerivation.deriveAddress(
        VALID_TESTNET_TPUB,
        'testnet',
        0,
        true
      );

      expect(address.index).toBe(0);
      expect(address.isChange).toBe(true);
      expect(address.derivationPath).toContain('/1/0');
    });

    it('should derive address at high index', () => {
      const address = XpubAddressDerivation.deriveAddress(
        VALID_TESTNET_TPUB,
        'testnet',
        99,
        false
      );

      expect(address.index).toBe(99);
      expect(address.derivationPath).toContain('/0/99');
    });

    it('should default to external address if isChange not specified', () => {
      const address = XpubAddressDerivation.deriveAddress(
        VALID_TESTNET_TPUB,
        'testnet',
        5
      );

      expect(address.isChange).toBe(false);
      expect(address.derivationPath).toContain('/0/5');
    });

    it('should throw error for invalid xpub', () => {
      expect(() => {
        XpubAddressDerivation.deriveAddress('invalid', 'testnet', 0);
      }).toThrow();
    });
  });

  describe('getExternalAddresses', () => {
    it('should filter only external addresses', () => {
      const allAddresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const external = XpubAddressDerivation.getExternalAddresses(allAddresses);

      expect(external).toHaveLength(10);
      external.forEach(addr => {
        expect(addr.isChange).toBe(false);
      });
    });

    it('should return empty array if no external addresses', () => {
      const internalOnly: DerivedAddress[] = [
        {
          address: 'tb1qtest',
          derivationPath: "m/84'/1'/0'/1/0",
          index: 0,
          isChange: true,
        },
      ];

      const external = XpubAddressDerivation.getExternalAddresses(internalOnly);
      expect(external).toHaveLength(0);
    });
  });

  describe('getInternalAddresses', () => {
    it('should filter only internal addresses', () => {
      const allAddresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const internal = XpubAddressDerivation.getInternalAddresses(allAddresses);

      expect(internal).toHaveLength(10);
      internal.forEach(addr => {
        expect(addr.isChange).toBe(true);
      });
    });

    it('should return empty array if no internal addresses', () => {
      const externalOnly: DerivedAddress[] = [
        {
          address: 'tb1qtest',
          derivationPath: "m/84'/1'/0'/0/0",
          index: 0,
          isChange: false,
        },
      ];

      const internal = XpubAddressDerivation.getInternalAddresses(externalOnly);
      expect(internal).toHaveLength(0);
    });
  });

  describe('findAddress', () => {
    it('should find address by address string', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const targetAddress = addresses[5].address;
      const found = XpubAddressDerivation.findAddress(addresses, targetAddress);

      expect(found).toBeDefined();
      expect(found?.address).toBe(targetAddress);
      expect(found?.index).toBe(addresses[5].index);
    });

    it('should return undefined if address not found', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const found = XpubAddressDerivation.findAddress(addresses, 'nonexistent_address');
      expect(found).toBeUndefined();
    });

    it('should find address in empty array', () => {
      const found = XpubAddressDerivation.findAddress([], 'any_address');
      expect(found).toBeUndefined();
    });
  });

  describe('validateAddressBelongsToXpub', () => {
    it('should validate address derived from xpub', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const addressToValidate = addresses[0].address;
      const belongs = XpubAddressDerivation.validateAddressBelongsToXpub(
        VALID_TESTNET_TPUB,
        'testnet',
        addressToValidate
      );

      expect(belongs).toBe(true);
    });

    it('should reject address not derived from xpub', () => {
      const randomAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
      const belongs = XpubAddressDerivation.validateAddressBelongsToXpub(
        VALID_TESTNET_TPUB,
        'testnet',
        randomAddress
      );

      expect(belongs).toBe(false);
    });

    it('should check up to custom gap limit', () => {
      // Derive address at index 25 (beyond default gap limit of 20)
      const address = XpubAddressDerivation.deriveAddress(
        VALID_TESTNET_TPUB,
        'testnet',
        25,
        false
      );

      // Should not find with default gap limit
      const belongsDefault = XpubAddressDerivation.validateAddressBelongsToXpub(
        VALID_TESTNET_TPUB,
        'testnet',
        address.address,
        INITIAL_GAP_LIMIT * 2
      );

      expect(belongsDefault).toBe(false);

      // Should find with larger gap limit
      const belongsLarge = XpubAddressDerivation.validateAddressBelongsToXpub(
        VALID_TESTNET_TPUB,
        'testnet',
        address.address,
        30
      );

      expect(belongsLarge).toBe(true);
    });

    it('should return false for invalid xpub', () => {
      const belongs = XpubAddressDerivation.validateAddressBelongsToXpub(
        'invalid_xpub',
        'testnet',
        'tb1qtest'
      );

      expect(belongs).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('should return correct summary for initial addresses', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const summary = XpubAddressDerivation.getSummary(addresses);

      expect(summary.total).toBe(20);
      expect(summary.external).toBe(10);
      expect(summary.internal).toBe(10);
      expect(summary.gapLimit).toBe(10);
    });

    it('should return correct summary for expanded addresses', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        25
      );

      const summary = XpubAddressDerivation.getSummary(addresses);

      expect(summary.total).toBe(50);
      expect(summary.external).toBe(25);
      expect(summary.internal).toBe(25);
      expect(summary.gapLimit).toBe(25);
    });

    it('should return zeros for empty array', () => {
      const summary = XpubAddressDerivation.getSummary([]);

      expect(summary.total).toBe(0);
      expect(summary.external).toBe(0);
      expect(summary.internal).toBe(0);
      expect(summary.gapLimit).toBe(0);
    });

    it('should handle unbalanced external/internal split', () => {
      const unbalanced: DerivedAddress[] = [
        { address: 'addr1', derivationPath: "m/84'/1'/0'/0/0", index: 0, isChange: false },
        { address: 'addr2', derivationPath: "m/84'/1'/0'/0/1", index: 1, isChange: false },
        { address: 'addr3', derivationPath: "m/84'/1'/0'/1/0", index: 0, isChange: true },
      ];

      const summary = XpubAddressDerivation.getSummary(unbalanced);

      expect(summary.total).toBe(3);
      expect(summary.external).toBe(2);
      expect(summary.internal).toBe(1);
      expect(summary.gapLimit).toBe(1); // Minimum of external and internal
    });
  });

  describe('edge cases', () => {
    it('should handle derivation at index 0', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        1
      );

      expect(addresses).toHaveLength(2);
      expect(addresses[0].index).toBe(0);
      expect(addresses[0].isChange).toBe(false);
      expect(addresses[1].index).toBe(0);
      expect(addresses[1].isChange).toBe(true);
    });

    it('should handle large gap limits efficiently', () => {
      const startTime = Date.now();
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        MAX_GAP_LIMIT
      );
      const endTime = Date.now();

      expect(addresses).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in < 5 seconds
    });

    it('should produce deterministic results for same xpub', () => {
      const addresses1 = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );
      const addresses2 = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      expect(addresses1.length).toBe(addresses2.length);
      addresses1.forEach((addr, i) => {
        expect(addr.address).toBe(addresses2[i].address);
        expect(addr.derivationPath).toBe(addresses2[i].derivationPath);
        expect(addr.index).toBe(addresses2[i].index);
        expect(addr.isChange).toBe(addresses2[i].isChange);
      });
    });

    it('should handle multiple networks for same xpub type', () => {
      const testnetAddresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );
      const mainnetAddresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_MAINNET_XPUB,
        'mainnet'
      );

      // Addresses should be different (different networks)
      expect(testnetAddresses[0].address).not.toBe(mainnetAddresses[0].address);

      // Testnet addresses start with 'm' or 'n'
      expect(testnetAddresses[0].address.startsWith('m') || testnetAddresses[0].address.startsWith('n')).toBe(true);

      // Mainnet addresses start with '1'
      expect(mainnetAddresses[0].address.startsWith('1')).toBe(true);
    });
  });

  describe('BIP32 compliance', () => {
    it('should follow BIP32 derivation path format', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      addresses.forEach(addr => {
        // Should match m/purpose'/coin'/account'/change/index
        expect(addr.derivationPath).toMatch(/^m\/\d+'\/\d+'\/\d+'\/[01]\/\d+$/);
      });
    });

    it('should use correct change index (0=external, 1=internal)', () => {
      const addresses = XpubAddressDerivation.deriveInitialAddresses(
        VALID_TESTNET_TPUB,
        'testnet'
      );

      const external = addresses.filter(a => !a.isChange);
      const internal = addresses.filter(a => a.isChange);

      external.forEach(addr => {
        expect(addr.derivationPath).toContain('/0/'); // External uses /0/
      });

      internal.forEach(addr => {
        expect(addr.derivationPath).toContain('/1/'); // Internal uses /1/
      });
    });

    it('should increment address indices sequentially', () => {
      const addresses = XpubAddressDerivation.deriveAddresses(
        VALID_TESTNET_TPUB,
        'testnet',
        15
      );

      const external = XpubAddressDerivation.getExternalAddresses(addresses);
      const internal = XpubAddressDerivation.getInternalAddresses(addresses);

      // Check external indices: 0, 1, 2, ..., 14
      external.forEach((addr, i) => {
        expect(addr.index).toBe(i);
      });

      // Check internal indices: 0, 1, 2, ..., 14
      internal.forEach((addr, i) => {
        expect(addr.index).toBe(i);
      });
    });
  });
});
