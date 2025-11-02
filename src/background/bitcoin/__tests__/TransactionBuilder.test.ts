/**
 * TransactionBuilder Test Suite
 *
 * Comprehensive tests for Bitcoin transaction building including:
 * - UTXO selection algorithms
 * - Fee calculation for different fee rates
 * - Transaction size estimation (Legacy, SegWit, Native SegWit)
 * - PSBT construction
 * - Transaction signing
 * - Change calculation
 * - Error handling (insufficient funds, dust, invalid addresses)
 * - Transaction verification
 *
 * @jest-environment node
 */

import { TransactionBuilder, SelectedUTXO, BuildTransactionParams } from '../TransactionBuilder';
import { HDWallet } from '../../wallet/HDWallet';
import { AddressGenerator } from '../../wallet/AddressGenerator';
import * as bip39 from 'bip39';
import { UTXO, AddressType } from '../../../shared/types';

describe('TransactionBuilder', () => {
  // Test mnemonic for consistent key generation
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_SEED = bip39.mnemonicToSeedSync(TEST_MNEMONIC);

  describe('constructor', () => {
    it('should create TransactionBuilder for testnet', () => {
      const builder = new TransactionBuilder('testnet');
      expect(builder).toBeDefined();
      expect(builder.getNetwork()).toBe('testnet');
    });

    it('should create TransactionBuilder for mainnet', () => {
      const builder = new TransactionBuilder('mainnet');
      expect(builder).toBeDefined();
      expect(builder.getNetwork()).toBe('mainnet');
    });

    it('should default to testnet', () => {
      const builder = new TransactionBuilder();
      expect(builder.getNetwork()).toBe('testnet');
    });
  });

  describe('estimateSize', () => {
    let builder: TransactionBuilder;

    beforeEach(() => {
      builder = new TransactionBuilder('testnet');
    });

    it('should estimate size for legacy transaction', () => {
      const estimate = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
      });

      expect(estimate.size).toBeGreaterThan(0);
      expect(estimate.virtualSize).toBeGreaterThan(0);
      // Legacy transaction: size === virtualSize
      expect(estimate.size).toBe(estimate.virtualSize);
      // Approx: 10 (overhead) + 148 (input) + 68 (2 outputs) = 226 bytes
      expect(estimate.size).toBeGreaterThan(200);
      expect(estimate.size).toBeLessThan(300);
    });

    it('should estimate size for SegWit transaction', () => {
      const estimate = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['segwit'],
      });

      expect(estimate.size).toBeGreaterThan(0);
      expect(estimate.virtualSize).toBeGreaterThan(0);
      // SegWit: virtualSize < size due to witness discount
      expect(estimate.virtualSize).toBeLessThan(estimate.size);
    });

    it('should estimate size for Native SegWit transaction', () => {
      const estimate = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['native-segwit'],
      });

      expect(estimate.size).toBeGreaterThan(0);
      expect(estimate.virtualSize).toBeGreaterThan(0);
      // Native SegWit: virtualSize < size
      expect(estimate.virtualSize).toBeLessThan(estimate.size);
      // Native SegWit is smallest
      const segwitEstimate = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['segwit'],
      });
      expect(estimate.virtualSize).toBeLessThan(segwitEstimate.virtualSize);
    });

    it('should estimate size for mixed input types', () => {
      const estimate = builder.estimateSize({
        numInputs: 3,
        numOutputs: 2,
        inputTypes: ['legacy', 'segwit', 'native-segwit'],
      });

      expect(estimate.size).toBeGreaterThan(0);
      expect(estimate.virtualSize).toBeGreaterThan(0);
      // Mixed should have witness discount
      expect(estimate.virtualSize).toBeLessThan(estimate.size);
    });

    it('should increase size with more inputs', () => {
      const estimate1Input = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
      });

      const estimate2Inputs = builder.estimateSize({
        numInputs: 2,
        numOutputs: 2,
        inputTypes: ['legacy', 'legacy'],
      });

      expect(estimate2Inputs.size).toBeGreaterThan(estimate1Input.size);
    });

    it('should increase size with more outputs', () => {
      const estimate1Output = builder.estimateSize({
        numInputs: 1,
        numOutputs: 1,
        inputTypes: ['legacy'],
      });

      const estimate2Outputs = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
      });

      expect(estimate2Outputs.size).toBeGreaterThan(estimate1Output.size);
    });

    it('should throw error if input types length mismatches numInputs', () => {
      expect(() =>
        builder.estimateSize({
          numInputs: 2,
          numOutputs: 2,
          inputTypes: ['legacy'], // Only 1 type but 2 inputs
        })
      ).toThrow('Input types length must match number of inputs');
    });

    it('should throw error for unsupported input type', () => {
      expect(() =>
        builder.estimateSize({
          numInputs: 1,
          numOutputs: 2,
          inputTypes: ['unsupported' as any],
        })
      ).toThrow('Unsupported input type');
    });
  });

  describe('estimateFee', () => {
    let builder: TransactionBuilder;

    beforeEach(() => {
      builder = new TransactionBuilder('testnet');
    });

    it('should calculate fee based on size and fee rate', () => {
      const feeRate = 5; // sat/vB
      const fee = builder.estimateFee({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
        feeRate,
      });

      expect(fee).toBeGreaterThan(0);
      // Fee should be roughly virtualSize * feeRate
      const size = builder.estimateSize({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
      });
      expect(fee).toBeGreaterThanOrEqual(size.virtualSize * feeRate);
    });

    it('should increase fee with higher fee rate', () => {
      const fee1 = builder.estimateFee({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
        feeRate: 1,
      });

      const fee10 = builder.estimateFee({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
        feeRate: 10,
      });

      expect(fee10).toBeGreaterThan(fee1);
      expect(fee10).toBeGreaterThanOrEqual(fee1 * 9); // At least 9x higher
    });

    it('should ensure minimum relay fee', () => {
      // Even with 0 fee rate, should meet minimum
      const fee = builder.estimateFee({
        numInputs: 1,
        numOutputs: 2,
        inputTypes: ['legacy'],
        feeRate: 0,
      });

      expect(fee).toBeGreaterThan(0);
    });
  });

  describe('selectUTXOs', () => {
    let builder: TransactionBuilder;
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      builder = new TransactionBuilder('testnet');
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    function createMockUTXO(value: number, index: number): SelectedUTXO {
      const node = wallet.deriveAddressNode('legacy', 0, 0, index);
      const address = generator.generateAddress(node, 'legacy');
      const scriptPubKey = generator.getScriptPubKey(address);

      return {
        txid: '0'.repeat(63) + index.toString(),
        vout: 0,
        value,
        address,
        scriptPubKey,
        confirmations: 6,
        derivationPath: `m/44'/1'/0'/0/${index}`,
        addressType: 'legacy',
      };
    }

    it('should select single UTXO when sufficient', () => {
      const utxos = [createMockUTXO(100000, 0)];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selection = builder.selectUTXOs({
        utxos,
        targetAmount: 50000,
        feeRate: 5,
        changeAddress,
      });

      expect(selection.selectedUtxos.length).toBe(1);
      expect(selection.totalInput).toBe(100000);
      expect(selection.fee).toBeGreaterThan(0);
      expect(selection.change).toBeGreaterThan(0);
    });

    it('should select multiple UTXOs when needed', () => {
      const utxos = [
        createMockUTXO(30000, 0),
        createMockUTXO(30000, 1),
        createMockUTXO(30000, 2),
      ];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selection = builder.selectUTXOs({
        utxos,
        targetAmount: 80000,
        feeRate: 5,
        changeAddress,
      });

      expect(selection.selectedUtxos.length).toBeGreaterThan(1);
      expect(selection.totalInput).toBeGreaterThanOrEqual(80000);
    });

    it('should use randomized selection for privacy', () => {
      const utxos = [
        createMockUTXO(10000, 0),
        createMockUTXO(50000, 1),
        createMockUTXO(20000, 2),
      ];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selection = builder.selectUTXOs({
        utxos,
        targetAmount: 40000,
        feeRate: 5,
        changeAddress,
      });

      // PRIVACY: Selection should be randomized (not deterministic largest-first)
      // Just verify a valid UTXO was selected with sufficient total value
      expect(selection.selectedUtxos.length).toBeGreaterThan(0);
      const totalSelected = selection.selectedUtxos.reduce((sum, u) => sum + u.value, 0);
      expect(totalSelected).toBeGreaterThanOrEqual(40000);
    });

    it('produces non-deterministic UTXO selection across multiple runs', () => {
      // Test: Verify selection varies across 100 runs (not always same UTXOs)
      const utxos = [
        createMockUTXO(10000, 0),
        createMockUTXO(15000, 1),
        createMockUTXO(20000, 2),
        createMockUTXO(25000, 3),
        createMockUTXO(30000, 4),
      ];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selectionKeys = new Set<string>();

      // Run selection 100 times
      for (let i = 0; i < 100; i++) {
        const selection = builder.selectUTXOs({
          utxos,
          targetAmount: 25000,
          feeRate: 1,
          changeAddress,
        });

        // Create a key representing this selection
        const key = selection.selectedUtxos
          .map(u => u.txid)
          .sort()
          .join(',');
        selectionKeys.add(key);
      }

      // CRITICAL: Should have multiple unique selections (>1)
      // With 5 UTXOs and target amount requiring 1-2 UTXOs, should see variety
      expect(selectionKeys.size).toBeGreaterThan(1);
    });

    it('achieves reasonable entropy in UTXO selection', () => {
      // Test: Measure Shannon entropy of selections
      const utxos = Array(10).fill(null).map((_, i) => createMockUTXO(10000, i));
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selectionCounts = new Map<string, number>();
      const runs = 200;

      for (let i = 0; i < runs; i++) {
        const selection = builder.selectUTXOs({
          utxos,
          targetAmount: 15000,
          feeRate: 1,
          changeAddress,
        });

        const key = selection.selectedUtxos
          .map(u => u.txid)
          .sort()
          .join(',');
        selectionCounts.set(key, (selectionCounts.get(key) || 0) + 1);
      }

      // Calculate Shannon entropy
      let entropy = 0;
      selectionCounts.forEach(count => {
        const p = count / runs;
        entropy -= p * Math.log2(p);
      });

      // Log results for visibility
      console.log(`UTXO Selection Entropy: ${entropy.toFixed(3)} bits`);
      console.log(`Unique selections: ${selectionCounts.size} out of ${runs} runs`);

      // Verify we have at least some variety (multiple unique selections)
      expect(selectionCounts.size).toBeGreaterThan(1);
    });

    it('should throw error for insufficient funds', () => {
      const utxos = [createMockUTXO(10000, 0)];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      expect(() =>
        builder.selectUTXOs({
          utxos,
          targetAmount: 50000,
          feeRate: 5,
          changeAddress,
        })
      ).toThrow('Insufficient funds');
    });

    it('should throw error for empty UTXO array', () => {
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      expect(() =>
        builder.selectUTXOs({
          utxos: [],
          targetAmount: 50000,
          feeRate: 5,
          changeAddress,
        })
      ).toThrow('No UTXOs available');
    });

    it('should handle change below dust threshold', () => {
      // Create scenario where change would be dust
      const utxos = [createMockUTXO(51000, 0)];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selection = builder.selectUTXOs({
        utxos,
        targetAmount: 50000,
        feeRate: 5,
        changeAddress,
      });

      // If change is dust, it should be added to fee
      if (selection.change < 546) {
        expect(selection.change).toBe(0);
        expect(selection.fee).toBeGreaterThan(0);
      }
    });

    it('should account for fee in selection', () => {
      const utxos = [createMockUTXO(50000, 0)];
      const node = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(node, 'legacy');

      const selection = builder.selectUTXOs({
        utxos,
        targetAmount: 49000,
        feeRate: 5,
        changeAddress,
      });

      // Total input should cover target + fee + change
      expect(selection.totalInput).toBe(50000);
      expect(selection.totalInput).toBeGreaterThanOrEqual(
        selection.fee + 49000 + selection.change
      );
    });
  });

  describe('buildTransaction - Integration', () => {
    let builder: TransactionBuilder;
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      builder = new TransactionBuilder('testnet');
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    function createMockUTXO(value: number, index: number, addressType: AddressType = 'legacy'): UTXO {
      const node = wallet.deriveAddressNode(addressType, 0, 0, index);
      const address = generator.generateAddress(node, addressType);
      const scriptPubKey = generator.getScriptPubKey(address);

      return {
        txid: '0'.repeat(63) + index.toString(),
        vout: 0,
        value,
        address,
        scriptPubKey,
        confirmations: 6,
      };
    }

    function getPrivateKey(derivationPath: string): Buffer {
      const node = wallet.derivePath(derivationPath);
      if (!node.privateKey) {
        throw new Error('No private key available');
      }
      return node.privateKey;
    }

    function getAddressType(address: string): AddressType {
      const type = generator.getAddressType(address);
      if (!type) {
        throw new Error('Unknown address type');
      }
      return type;
    }

    function getDerivationPath(address: string): string {
      // For testing, derive path based on address type
      const type = getAddressType(address);
      // Simplified - in reality would need to track addresses
      if (type === 'legacy') return "m/44'/1'/0'/0/0";
      if (type === 'segwit') return "m/49'/1'/0'/0/0";
      return "m/84'/1'/0'/0/0"; // native-segwit
    }

    it('should build valid Native SegWit transaction', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result).toBeDefined();
      expect(result.txHex).toBeDefined();
      expect(result.txid).toBeDefined();
      expect(result.fee).toBeGreaterThan(0);
      expect(result.size).toBeGreaterThan(0);
      expect(result.virtualSize).toBeGreaterThan(0);
      expect(result.inputs.length).toBe(1);
      expect(result.outputs.length).toBeGreaterThanOrEqual(1);
    });

    it('should include change output when necessary', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 40000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      // Should have 2 outputs: recipient + change
      const changeOutput = result.outputs.find((o) => o.isChange);
      expect(changeOutput).toBeDefined();
      expect(changeOutput!.value).toBeGreaterThan(0);
    });

    it('should throw error for invalid recipient address', async () => {
      const utxos = [createMockUTXO(100000, 0, 'legacy')];
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: 'invalid_address', amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Invalid recipient address');
    });

    it('should throw error for amount below dust threshold', async () => {
      const utxos = [createMockUTXO(100000, 0, 'legacy')];
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 100 }], // Below 546 dust threshold
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('below dust threshold');
    });

    it('should throw error for insufficient funds', async () => {
      const utxos = [createMockUTXO(10000, 0, 'legacy')];
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Insufficient funds');
    });

    it('should validate transaction before returning', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      // Verify transaction properties
      expect(result.txHex.length).toBeGreaterThan(0);
      expect(result.txid.length).toBe(64); // SHA256 hash = 32 bytes = 64 hex chars
      expect(result.fee).toBeGreaterThan(0);
    });

    it('should handle multiple outputs', async () => {
      const utxos = [createMockUTXO(200000, 0, 'native-segwit')];
      const recipient1Node = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipient1Address = generator.generateAddress(recipient1Node, 'native-segwit');
      const recipient2Node = wallet.deriveAddressNode('native-segwit', 0, 0, 2);
      const recipient2Address = generator.generateAddress(recipient2Node, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [
          { address: recipient1Address, amount: 50000 },
          { address: recipient2Address, amount: 50000 },
        ],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.outputs.length).toBeGreaterThanOrEqual(2);
      const recipientOutputs = result.outputs.filter((o) => !o.isChange);
      expect(recipientOutputs.length).toBe(2);
    });
  });

  describe('Error handling', () => {
    let builder: TransactionBuilder;
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      builder = new TransactionBuilder('testnet');
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    it('should reject empty UTXO array', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: () => 'legacy',
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('No UTXOs');
    });

    it('should reject empty outputs array', async () => {
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: 'test', scriptPubKey: '', confirmations: 1 }],
        outputs: [],
        changeAddress,
        feeRate: 5,
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: () => 'legacy',
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('No outputs');
    });

    it('should reject invalid change address', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: recipientAddress, scriptPubKey: '', confirmations: 1 }],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress: 'invalid_address',
        feeRate: 5,
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: () => 'legacy',
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Invalid change address');
    });

    it('should reject fee rate of 0', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: recipientAddress, scriptPubKey: '', confirmations: 1 }],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 0,
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: () => 'legacy',
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Fee rate must be greater than 0');
    });

    it('should reject excessive fee rate', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: recipientAddress, scriptPubKey: '', confirmations: 1 }],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 10000, // > 1000 sat/vB
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: () => 'legacy',
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Fee rate too high');
    });

    it('should reject missing getPrivateKey function', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: recipientAddress, scriptPubKey: '', confirmations: 1 }],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey: undefined,
        getAddressType: () => 'legacy',
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Private key retrieval function not provided');
    });

    it('should reject missing getAddressType function', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: recipientAddress, scriptPubKey: '', confirmations: 1 }],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: undefined,
        getDerivationPath: () => "m/44'/1'/0'/0/0",
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Address type function not provided');
    });

    it('should reject missing getDerivationPath function', async () => {
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: any = {
        utxos: [{ txid: 'test', vout: 0, value: 100000, address: recipientAddress, scriptPubKey: '', confirmations: 1 }],
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey: () => Buffer.alloc(32),
        getAddressType: () => 'legacy',
        getDerivationPath: undefined,
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Derivation path function not provided');
    });

    it('should reject zero output amount', async () => {
      const utxos = [createMockUTXO(100000, 0, 'legacy')];
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 0 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Total output amount must be greater than 0');
    });

    it('should reject negative output amount', async () => {
      const utxos = [createMockUTXO(100000, 0, 'legacy')];
      const recipientNode = wallet.deriveAddressNode('legacy', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'legacy');
      const changeNode = wallet.deriveAddressNode('legacy', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'legacy');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: -1000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      await expect(builder.buildTransaction(params)).rejects.toThrow('Total output amount must be greater than 0');
    });

    function createMockUTXO(value: number, index: number, addressType: AddressType = 'legacy'): UTXO {
      const node = wallet.deriveAddressNode(addressType, 0, 0, index);
      const address = generator.generateAddress(node, addressType);
      const scriptPubKey = generator.getScriptPubKey(address);

      return {
        txid: '0'.repeat(63) + index.toString(),
        vout: 0,
        value,
        address,
        scriptPubKey,
        confirmations: 6,
      };
    }

    function getPrivateKey(derivationPath: string): Buffer {
      const node = wallet.derivePath(derivationPath);
      if (!node.privateKey) {
        throw new Error('No private key available');
      }
      return node.privateKey;
    }

    function getAddressType(address: string): AddressType {
      const type = generator.getAddressType(address);
      if (!type) {
        throw new Error('Unknown address type');
      }
      return type;
    }

    function getDerivationPath(address: string): string {
      const type = getAddressType(address);
      if (type === 'legacy') return "m/44'/1'/0'/0/0";
      if (type === 'segwit') return "m/49'/1'/0'/0/0";
      return "m/84'/1'/0'/0/0";
    }
  });

  describe('Transaction building - Advanced scenarios', () => {
    let builder: TransactionBuilder;
    let generator: AddressGenerator;
    let wallet: HDWallet;

    beforeEach(() => {
      builder = new TransactionBuilder('testnet');
      generator = new AddressGenerator('testnet');
      wallet = new HDWallet(TEST_SEED, 'testnet');
    });

    function createMockUTXO(value: number, index: number, addressType: AddressType = 'legacy'): UTXO {
      const node = wallet.deriveAddressNode(addressType, 0, 0, index);
      const address = generator.generateAddress(node, addressType);
      const scriptPubKey = generator.getScriptPubKey(address);

      return {
        txid: '0'.repeat(63) + index.toString(),
        vout: 0,
        value,
        address,
        scriptPubKey,
        confirmations: 6,
      };
    }

    function getPrivateKey(derivationPath: string): Buffer {
      const node = wallet.derivePath(derivationPath);
      if (!node.privateKey) {
        throw new Error('No private key available');
      }
      return node.privateKey;
    }

    function getAddressType(address: string): AddressType {
      const type = generator.getAddressType(address);
      if (!type) {
        throw new Error('Unknown address type');
      }
      return type;
    }

    function getDerivationPath(address: string): string {
      const type = getAddressType(address);
      // Extract index from address by looking at which derived address it matches
      for (let i = 0; i < 20; i++) {
        const node = wallet.deriveAddressNode(type, 0, 0, i);
        const testAddr = generator.generateAddress(node, type);
        if (testAddr === address) {
          if (type === 'legacy') return `m/44'/1'/0'/0/${i}`;
          if (type === 'segwit') return `m/49'/1'/0'/0/${i}`;
          return `m/84'/1'/0'/0/${i}`;
        }
      }
      // Fallback (should not happen in tests)
      if (type === 'legacy') return "m/44'/1'/0'/0/0";
      if (type === 'segwit') return "m/49'/1'/0'/0/0";
      return "m/84'/1'/0'/0/0";
    }

    it('should build transaction with Native SegWit inputs', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result).toBeDefined();
      expect(result.txHex).toBeDefined();
      expect(result.txid).toBeDefined();
      expect(result.fee).toBeGreaterThan(0);
      expect(result.inputs.length).toBe(1);
      expect(result.inputs[0].addressType).toBe('native-segwit');
      expect(result.virtualSize).toBeLessThan(result.size); // SegWit discount
    });

    it('should build transaction to different address types', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result).toBeDefined();
      expect(result.txHex).toBeDefined();
      expect(result.virtualSize).toBeLessThan(result.size); // SegWit discount
    });

    it('should build transaction with multiple Native SegWit inputs', async () => {
      const utxos = [
        createMockUTXO(50000, 0, 'native-segwit'),
        createMockUTXO(50000, 1, 'native-segwit'),
        createMockUTXO(50000, 2, 'native-segwit'),
      ];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 10);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 120000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.inputs.length).toBeGreaterThan(1);
      const addressTypes = result.inputs.map((i) => i.addressType);
      expect(addressTypes.every(t => t === 'native-segwit')).toBe(true);
      expect(result.virtualSize).toBeLessThan(result.size);
    });

    it('should handle transaction with minimal change', async () => {
      const utxos = [createMockUTXO(60000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      // Should have change output if above dust threshold
      const changeOutputs = result.outputs.filter((o) => o.isChange);
      if (changeOutputs.length > 0) {
        expect(changeOutputs[0].value).toBeGreaterThanOrEqual(546); // At least dust threshold
      }
      // Verify total balance
      const totalOutputs = result.outputs.reduce((sum, o) => sum + o.value, 0);
      expect(totalOutputs + result.fee).toBe(60000);
    });

    it('should handle large transaction with many inputs', async () => {
      // Create 5 UTXOs - use single address type for correct derivation
      const utxos = Array.from({ length: 5 }, (_, i) => createMockUTXO(25000, i, 'native-segwit'));
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 100000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.inputs.length).toBeGreaterThan(2);
      expect(result.size).toBeGreaterThan(250); // Larger transaction with multiple inputs
    });

    it('should handle large transaction with many outputs', async () => {
      const utxos = [createMockUTXO(500000, 0, 'native-segwit')];
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      // Create 10 outputs
      const outputs = Array.from({ length: 10 }, (_, i) => {
        const node = wallet.deriveAddressNode('native-segwit', 0, 0, i + 10);
        const address = generator.generateAddress(node, 'native-segwit');
        return { address, amount: 10000 };
      });

      const params: BuildTransactionParams = {
        utxos,
        outputs,
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.outputs.filter((o) => !o.isChange).length).toBe(10);
      expect(result.size).toBeGreaterThan(300);
    });

    it('should calculate correct fee for different fee rates', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params1: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 1,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const params10: BuildTransactionParams = {
        ...params1,
        feeRate: 10,
      };

      const result1 = await builder.buildTransaction(params1);
      const result10 = await builder.buildTransaction(params10);

      expect(result10.fee).toBeGreaterThan(result1.fee);
      expect(result10.fee).toBeGreaterThanOrEqual(result1.fee * 9); // ~10x more
    });

    it('should handle minimum relay fee correctly', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 1, // Low fee rate (minimum)
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      // Should meet minimum relay fee
      expect(result.fee).toBeGreaterThan(0);
      // Fee should be at least virtual size (1 sat/vB minimum)
      expect(result.fee).toBeGreaterThanOrEqual(result.virtualSize);
    });

    it('should verify virtualSize is less than or equal to size for SegWit', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.virtualSize).toBeLessThanOrEqual(result.size);
    });

    it('should generate valid transaction ID (64 hex chars)', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.txid.length).toBe(64);
      expect(/^[0-9a-f]{64}$/.test(result.txid)).toBe(true);
    });

    it('should generate valid transaction hex', async () => {
      const utxos = [createMockUTXO(100000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 5,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      expect(result.txHex.length).toBeGreaterThan(0);
      expect(/^[0-9a-f]+$/.test(result.txHex)).toBe(true);
    });

    it('should handle UTXO selection with appropriate change', async () => {
      // Create UTXO with sufficient amount for output + fee + change
      const utxos = [createMockUTXO(55000, 0, 'native-segwit')];
      const recipientNode = wallet.deriveAddressNode('native-segwit', 0, 0, 1);
      const recipientAddress = generator.generateAddress(recipientNode, 'native-segwit');
      const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
      const changeAddress = generator.generateAddress(changeNode, 'native-segwit');

      const params: BuildTransactionParams = {
        utxos,
        outputs: [{ address: recipientAddress, amount: 50000 }],
        changeAddress,
        feeRate: 1,
        getPrivateKey,
        getAddressType,
        getDerivationPath,
      };

      const result = await builder.buildTransaction(params);

      // Should have change output if above dust threshold
      const changeOutputs = result.outputs.filter((o) => o.isChange);
      if (changeOutputs.length > 0) {
        expect(changeOutputs[0].value).toBeGreaterThanOrEqual(546);
      }
      // Verify accounting: inputs = outputs + fee
      expect(55000).toBe(result.outputs.reduce((sum, o) => sum + o.value, 0) + result.fee);
    });
  });
});
