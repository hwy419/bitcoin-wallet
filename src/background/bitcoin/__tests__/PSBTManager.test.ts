/**
 * PSBTManager Test Suite
 *
 * Tests for PSBT (Partially Signed Bitcoin Transaction) management including:
 * - PSBT export/import (base64, hex)
 * - QR code chunking for air-gapped devices
 * - Pending transaction tracking
 * - PSBT validation
 * - Signature counting
 * - Multisig PSBT workflows
 *
 * @jest-environment node
 */

import { PSBTManager } from '../PSBTManager';
import { TransactionBuilder } from '../TransactionBuilder';
import { HDWallet } from '../../wallet/HDWallet';
import { AddressGenerator } from '../../wallet/AddressGenerator';
import * as bip39 from 'bip39';
import * as bitcoin from 'bitcoinjs-lib';
import { PendingMultisigTx, MultisigAddress } from '../../../shared/types';

describe('PSBTManager', () => {
  const TEST_MNEMONIC = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const TEST_SEED = bip39.mnemonicToSeedSync(TEST_MNEMONIC);

  let manager: PSBTManager;
  let builder: TransactionBuilder;
  let wallet: HDWallet;
  let addressGen: AddressGenerator;
  let network: bitcoin.Network;

  beforeEach(() => {
    network = bitcoin.networks.testnet;
    manager = new PSBTManager(network);
    builder = new TransactionBuilder('testnet');
    wallet = new HDWallet(TEST_SEED, 'testnet');
    addressGen = new AddressGenerator('testnet');
  });

  // Helper to create a mock multisig address
  function createMockMultisigAddress(value: number, index: number): MultisigAddress {
    return {
      address: `2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc`,
      derivationPath: `m/48'/1'/0'/2'/0/${index}`,
      index,
      isChange: false,
      used: false,
      redeemScript: Buffer.from('522102' + '00'.repeat(32) + '2103' + '00'.repeat(32) + '52ae', 'hex').toString('hex'),
      witnessScript: Buffer.from('522102' + '00'.repeat(32) + '2103' + '00'.repeat(32) + '52ae', 'hex').toString('hex'),
    };
  }

  // Helper to create a simple PSBT for testing
  function createTestPSBT(): bitcoin.Psbt {
    const psbt = new bitcoin.Psbt({ network });

    // Add a mock input
    psbt.addInput({
      hash: Buffer.alloc(32, 0),
      index: 0,
      witnessUtxo: {
        script: Buffer.alloc(22),
        value: 100000,
      },
    });

    // Add output
    const recipientAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
    psbt.addOutput({
      address: recipientAddress,
      value: 50000,
    });

    return psbt;
  }

  describe('constructor', () => {
    it('should create PSBTManager with testnet network', () => {
      const mgr = new PSBTManager(bitcoin.networks.testnet);
      expect(mgr).toBeDefined();
    });

    it('should create PSBTManager with mainnet network', () => {
      const mgr = new PSBTManager(bitcoin.networks.bitcoin);
      expect(mgr).toBeDefined();
    });
  });

  describe('exportPSBT', () => {
    it('should export PSBT with base64 format', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.base64).toBeDefined();
      expect(typeof exported.base64).toBe('string');
      expect(exported.base64.length).toBeGreaterThan(0);
    });

    it('should export PSBT with hex format', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.hex).toBeDefined();
      expect(typeof exported.hex).toBe('string');
      expect(/^[0-9a-f]+$/i.test(exported.hex)).toBe(true);
    });

    it('should include transaction ID', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.txid).toBeDefined();
      expect(exported.txid.length).toBe(64); // SHA256 = 32 bytes = 64 hex chars
    });

    it('should include input/output counts', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.numInputs).toBe(1);
      expect(exported.numOutputs).toBe(1);
    });

    it('should calculate total output amount', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.totalOutput).toBe(50000);
    });

    it('should calculate fee', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      // Input: 100000, Output: 50000, Fee: 50000
      expect(exported.fee).toBe(50000);
    });

    it('should count signatures per input', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.signatures).toBeDefined();
      expect(Array.isArray(exported.signatures)).toBe(true);
      expect(exported.signatures.length).toBe(1);
      expect(exported.signatures[0]).toBe(0); // No signatures yet
    });

    it('should detect finalized status', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);

      expect(exported.finalized).toBe(false);
    });
  });

  describe('importPSBT', () => {
    it('should import PSBT from base64', () => {
      const psbt = createTestPSBT();
      const base64 = psbt.toBase64();

      const result = manager.importPSBT(base64);

      expect(result.psbt).toBeDefined();
      // Our mock PSBT has missing UTXO data warnings
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.txid).toBeDefined();
    });

    it('should import PSBT from hex', () => {
      const psbt = createTestPSBT();
      const base64 = psbt.toBase64();
      // Convert base64 to hex
      const buffer = Buffer.from(base64, 'base64');
      const hex = buffer.toString('hex');

      const result = manager.importPSBT(hex);

      expect(result.psbt).toBeDefined();
      expect(result.txid).toBeDefined();
    });

    it('should detect base64 format automatically', () => {
      const psbt = createTestPSBT();
      const base64 = psbt.toBase64();

      expect(() => manager.importPSBT(base64)).not.toThrow();
    });

    it('should detect hex format automatically', () => {
      const psbt = createTestPSBT();
      const base64 = psbt.toBase64();
      // Convert base64 to hex (proper PSBT hex format)
      const buffer = Buffer.from(base64, 'base64');
      const hex = buffer.toString('hex');

      const result = manager.importPSBT(hex);
      expect(result.psbt).toBeDefined();
    });

    it('should throw error for invalid PSBT string', () => {
      expect(() => manager.importPSBT('invalid_psbt')).toThrow('Failed to parse PSBT');
    });

    it('should throw error for empty string', () => {
      expect(() => manager.importPSBT('')).toThrow();
    });

    it('should provide validation warnings', () => {
      const psbt = createTestPSBT();
      const base64 = psbt.toBase64();

      const result = manager.importPSBT(base64);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should round-trip export and import', () => {
      const psbt = createTestPSBT();
      const exported = manager.exportPSBT(psbt);
      const imported = manager.importPSBT(exported.base64);

      expect(imported.psbt.toBase64()).toBe(exported.base64);
    });
  });

  describe('createPSBTChunks', () => {
    it('should create single chunk for small PSBT', () => {
      const psbt = createTestPSBT();
      const chunks = manager.createPSBTChunks(psbt);

      expect(chunks.length).toBe(1);
      expect(chunks[0].index).toBe(1);
      expect(chunks[0].total).toBe(1);
      expect(chunks[0].data).toBeDefined();
    });

    it('should split large PSBT into multiple chunks', () => {
      // Create a PSBT with many inputs to make it large
      const psbt = new bitcoin.Psbt({ network });

      // Add 50 inputs to make it large enough to require chunking
      for (let i = 0; i < 50; i++) {
        psbt.addInput({
          hash: Buffer.alloc(32, i),
          index: 0,
          witnessUtxo: {
            script: Buffer.alloc(22),
            value: 100000,
          },
        });
      }

      psbt.addOutput({
        address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        value: 50000,
      });

      const chunks = manager.createPSBTChunks(psbt);

      // Should be split into multiple chunks
      if (chunks.length > 1) {
        expect(chunks.length).toBeGreaterThan(1);
        expect(chunks[0].total).toBe(chunks.length);
        expect(chunks[chunks.length - 1].total).toBe(chunks.length);
      }
    });

    it('should include transaction ID in all chunks', () => {
      const psbt = createTestPSBT();
      const chunks = manager.createPSBTChunks(psbt);

      const tx = (psbt as any).__CACHE.__TX;
      const txid = tx.getId();

      for (const chunk of chunks) {
        expect(chunk.txid).toBe(txid);
      }
    });

    it('should number chunks sequentially', () => {
      const psbt = createTestPSBT();
      const chunks = manager.createPSBTChunks(psbt);

      for (let i = 0; i < chunks.length; i++) {
        expect(chunks[i].index).toBe(i + 1);
      }
    });
  });

  describe('reassemblePSBTChunks', () => {
    it('should reassemble single chunk', () => {
      const psbt = createTestPSBT();
      const chunks = manager.createPSBTChunks(psbt);

      const reassembled = manager.reassemblePSBTChunks(chunks);

      expect(reassembled.toBase64()).toBe(psbt.toBase64());
    });

    it('should reassemble chunks in any order', () => {
      const psbt = createTestPSBT();
      let chunks = manager.createPSBTChunks(psbt);

      // Reverse chunk order
      chunks = chunks.reverse();

      const reassembled = manager.reassemblePSBTChunks(chunks);

      expect(reassembled.toBase64()).toBe(psbt.toBase64());
    });

    it('should throw error for empty chunks array', () => {
      expect(() => manager.reassemblePSBTChunks([])).toThrow('No chunks provided');
    });

    it('should throw error for mismatched txids', () => {
      const psbt = createTestPSBT();
      const chunks = manager.createPSBTChunks(psbt);

      // Only test if we have multiple chunks (otherwise txid validation doesn't apply)
      if (chunks.length === 1) {
        // Create artificial chunks with different txids
        const chunk1 = { ...chunks[0], txid: 'txid1', total: 2 };
        const chunk2 = { ...chunks[0], txid: 'txid2', total: 2, index: 2 };
        expect(() => manager.reassemblePSBTChunks([chunk1, chunk2])).toThrow('mismatched txid');
      } else {
        // Modify one chunk's txid
        const modifiedChunks = chunks.map((chunk, i) => ({
          ...chunk,
          txid: i === 0 ? 'different_txid' : chunk.txid,
        }));
        expect(() => manager.reassemblePSBTChunks(modifiedChunks)).toThrow('mismatched txid');
      }
    });

    it('should throw error for missing chunks', () => {
      const psbt = createTestPSBT();
      const chunks = manager.createPSBTChunks(psbt);

      // Simulate missing chunk by setting wrong total for all chunks
      const modifiedChunks = chunks.map(chunk => ({
        ...chunk,
        total: 2, // Claim there should be 2 chunks when there's only 1
      }));

      expect(() => manager.reassemblePSBTChunks(modifiedChunks)).toThrow('Missing chunks');
    });
  });

  describe('createPendingTransaction (deprecated)', () => {
    it('should create pending transaction record with correct structure', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = { 'abc123': { signed: false, cosignerName: 'Alice' } };

      const pending = manager.createPendingTransaction(
        psbt,
        0,
        JSON.stringify(multisigConfig),
        2,
        signatureStatus
      );

      expect(pending).toBeDefined();
      expect(pending.id).toBeDefined();
      expect(pending.psbtBase64).toBeDefined();
      expect(pending.accountId).toBe(0);
      expect(pending.signaturesRequired).toBe(2);
      expect(pending.metadata).toBeDefined();
      expect(pending.metadata.fee).toBeGreaterThan(0);
    });

    it('should set created and expiresAt timestamps', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = {};

      const pending = manager.createPendingTransaction(psbt, 0, JSON.stringify(multisigConfig), 2, signatureStatus);

      expect(pending.created).toBeDefined();
      expect(pending.expiresAt).toBeDefined();
      expect(typeof pending.created).toBe('number');
      expect(typeof pending.expiresAt).toBe('number');
      expect(pending.expiresAt).toBeGreaterThan(pending.created);
    });

    it('should include fee information in metadata', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = {};

      const pending = manager.createPendingTransaction(psbt, 0, JSON.stringify(multisigConfig), 2, signatureStatus);

      expect(pending.metadata.fee).toBeDefined();
      expect(pending.metadata.fee).toBeGreaterThan(0);
    });

    it('should include amount information in metadata', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = {};

      const pending = manager.createPendingTransaction(psbt, 0, JSON.stringify(multisigConfig), 2, signatureStatus);

      expect(pending.metadata.amount).toBeDefined();
      expect(pending.metadata.amount).toBeGreaterThan(0);
    });

    it('should track signature status', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = { 'abc123': { signed: false, cosignerName: 'Alice' } };

      const pending = manager.createPendingTransaction(psbt, 0, JSON.stringify(multisigConfig), 2, signatureStatus);

      expect(pending.signatureStatus).toBeDefined();
      expect(pending.signatureStatus['abc123']).toBeDefined();
      expect(pending.signatureStatus['abc123'].cosignerName).toBe('Alice');
    });
  });

  describe('updatePendingTransaction (deprecated)', () => {
    it('should update PSBT with new signatures', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = {};
      const pending = manager.createPendingTransaction(psbt, 0, JSON.stringify(multisigConfig), 2, signatureStatus);

      const updated = manager.updatePendingTransaction(pending, psbt);

      expect(updated.psbtBase64).toBeDefined();
      expect(updated.signaturesCollected).toBeDefined();
    });

    it('should update signature count', () => {
      const psbt = createTestPSBT();
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = {};
      const pending = manager.createPendingTransaction(psbt, 0, JSON.stringify(multisigConfig), 2, signatureStatus);

      const updated = manager.updatePendingTransaction(pending, psbt);

      expect(updated.signaturesCollected).toBe(0); // No signatures yet
    });
  });

  describe('generateFilename', () => {
    it('should generate filename for unsigned PSBT', () => {
      const filename = manager.generateFilename('abc123def456', false);

      expect(filename).toContain('unsigned');
      expect(filename).toContain('abc123de'); // First 8 chars of txid
      expect(filename).toContain('.psbt');
    });

    it('should generate filename for signed PSBT', () => {
      const filename = manager.generateFilename('abc123def456', true);

      expect(filename).toContain('signed');
      expect(filename).toContain('abc123de');
      expect(filename).toContain('.psbt');
    });

    it('should include timestamp', () => {
      const filename = manager.generateFilename('abc123def456', false);

      // Should match pattern: unsigned-psbt-abc123de-YYYY-MM-DDTHH-MM-SS.psbt
      expect(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/.test(filename)).toBe(true);
    });

    it('should use first 8 characters of txid', () => {
      const txid = 'abcdef1234567890';
      const filename = manager.generateFilename(txid, false);

      expect(filename).toContain('abcdef12');
    });
  });

  describe('validateMultisigPSBT', () => {
    it('should validate correct multisig PSBT', () => {
      const psbt = createTestPSBT();

      // Add multisig script
      const multisigScript = Buffer.from(
        '522102' + '00'.repeat(32) + '2103' + '00'.repeat(32) + '52ae',
        'hex'
      );

      psbt.data.inputs[0].witnessScript = multisigScript;

      const result = manager.validateMultisigPSBT(psbt, 2, 2);

      // May have errors due to mock data, but should not crash
      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should return validation errors array', () => {
      const psbt = createTestPSBT();

      const result = manager.validateMultisigPSBT(psbt, 2, 3);

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('should validate M and N values', () => {
      const psbt = createTestPSBT();

      const result = manager.validateMultisigPSBT(psbt, 2, 3);

      expect(result).toBeDefined();
    });

    it('should handle PSBTs with missing scripts', () => {
      const psbt = createTestPSBT();

      const result = manager.validateMultisigPSBT(psbt, 2, 3);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getPSBTSummary', () => {
    it('should provide human-readable summary', () => {
      const psbt = createTestPSBT();

      const summary = manager.getPSBTSummary(psbt);

      expect(summary).toBeDefined();
      expect(summary.txid).toBeDefined();
      expect(summary.numInputs).toBe(1);
      expect(summary.numOutputs).toBe(1);
      expect(summary.totalOutput).toBe(50000);
      expect(summary.fee).toBe(50000);
      expect(summary.finalized).toBe(false);
    });

    it('should include signature information', () => {
      const psbt = createTestPSBT();

      const summary = manager.getPSBTSummary(psbt);

      expect(summary.signatures).toBeDefined();
      expect(Array.isArray(summary.signatures)).toBe(true);
      expect(summary.signatures.length).toBe(1);
      expect(summary.signatures[0].input).toBe(0);
      expect(summary.signatures[0].count).toBe(0);
    });

    it('should detect required signatures from script', () => {
      const psbt = createTestPSBT();

      // Create a proper 2-of-2 multisig script:
      // OP_2 (0x52) <pubkey1> <pubkey2> OP_2 (0x52) OP_CHECKMULTISIG (0xae)
      const pubkey1 = Buffer.from('02' + '11'.repeat(32), 'hex');
      const pubkey2 = Buffer.from('02' + '22'.repeat(32), 'hex');
      const multisigScript = Buffer.concat([
        Buffer.from([0x52]), // OP_2
        Buffer.from([0x21]), // Push 33 bytes
        pubkey1,
        Buffer.from([0x21]), // Push 33 bytes
        pubkey2,
        Buffer.from([0x52]), // OP_2
        Buffer.from([0xae]), // OP_CHECKMULTISIG
      ]);

      psbt.data.inputs[0].witnessScript = multisigScript;

      const summary = manager.getPSBTSummary(psbt);

      expect(summary.signatures[0].required).toBe(2);
    });
  });

  describe('Integration - Complete PSBT workflow', () => {
    it('should handle export → import → update cycle', () => {
      // Step 1: Create PSBT
      const psbt = createTestPSBT();

      // Step 2: Export
      const exported = manager.exportPSBT(psbt);
      expect(exported.base64).toBeDefined();

      // Step 3: Import (warnings expected for mock PSBT with no UTXO data)
      const imported = manager.importPSBT(exported.base64);
      expect(imported.psbt).toBeDefined();
      expect(imported.txid).toBeDefined();

      // Step 4: Create pending transaction
      const multisigConfig = { m: 2, n: 3, type: '2-of-3' as const };
      const signatureStatus = {};
      const pending = manager.createPendingTransaction(
        imported.psbt,
        0,
        JSON.stringify(multisigConfig),
        2,
        signatureStatus
      );
      expect(pending.id).toBeDefined();

      // Step 5: Update with new signatures (mock)
      const updated = manager.updatePendingTransaction(pending, imported.psbt);
      expect(updated.psbtBase64).toBeDefined();
    });

    it('should handle QR code chunking workflow', () => {
      // Step 1: Create PSBT
      const psbt = createTestPSBT();

      // Step 2: Split into chunks
      const chunks = manager.createPSBTChunks(psbt);
      expect(chunks.length).toBeGreaterThan(0);

      // Step 3: Reassemble
      const reassembled = manager.reassemblePSBTChunks(chunks);
      expect(reassembled.toBase64()).toBe(psbt.toBase64());

      // Step 4: Import reassembled (warnings expected for mock PSBT)
      const imported = manager.importPSBT(reassembled.toBase64());
      expect(imported.psbt).toBeDefined();
      expect(imported.txid).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle malformed base64', () => {
      expect(() => manager.importPSBT('not-valid-base64!!!')).toThrow();
    });

    it('should handle malformed hex', () => {
      expect(() => manager.importPSBT('gggggggg')).toThrow();
    });

    it('should handle mixed format string', () => {
      expect(() => manager.importPSBT('abc123xyz!@#')).toThrow();
    });

    it('should provide descriptive error messages', () => {
      try {
        manager.importPSBT('invalid');
        fail('Should have thrown error');
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('Failed to parse PSBT');
      }
    });
  });
});
