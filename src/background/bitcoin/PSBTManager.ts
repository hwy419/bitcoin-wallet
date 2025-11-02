/**
 * PSBTManager - Manages PSBT (Partially Signed Bitcoin Transaction) lifecycle
 *
 * This class handles the complete workflow for multisig transactions using PSBTs:
 * 1. Create unsigned PSBT for distribution to co-signers
 * 2. Export PSBT in various formats (base64, file, QR-compatible chunks)
 * 3. Import PSBT from co-signers
 * 4. Merge signatures from multiple PSBTs
 * 5. Track pending multisig transactions
 * 6. Validate PSBT integrity and signatures
 *
 * BIP174 Reference: https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki
 *
 * Typical Workflow:
 * ```
 * // Initiator creates PSBT
 * const psbt = await txBuilder.buildMultisigPSBT(...);
 * const exported = psbtManager.exportPSBT(psbt);
 *
 * // Share base64 string with co-signers
 * // Co-signer 1 signs
 * const psbt1 = psbtManager.importPSBT(exported);
 * await txBuilder.signMultisigPSBT(psbt1, pubkeys, privateKey);
 *
 * // Co-signer 2 signs
 * const psbt2 = psbtManager.importPSBT(exported);
 * await txBuilder.signMultisigPSBT(psbt2, pubkeys, privateKey);
 *
 * // Merge all signatures
 * const merged = TransactionBuilder.mergePSBTs([psbt1, psbt2]);
 *
 * // Finalize and broadcast
 * if (TransactionBuilder.hasEnoughSignatures(merged, m)) {
 *   const txHex = await txBuilder.finalizeMultisigPSBT(merged, m);
 *   await broadcast(txHex);
 * }
 * ```
 */

import * as bitcoin from 'bitcoinjs-lib';
import { PendingMultisigTx } from '../../shared/types';

export interface PSBTExport {
  /** Base64-encoded PSBT string (standard format) */
  base64: string;
  /** Hex-encoded PSBT string (alternative format) */
  hex: string;
  /** Transaction ID (for tracking) */
  txid: string;
  /** Number of inputs */
  numInputs: number;
  /** Number of outputs */
  numOutputs: number;
  /** Total output amount in satoshis */
  totalOutput: number;
  /** Fee in satoshis */
  fee: number;
  /** Current signature count per input */
  signatures: number[];
  /** Whether PSBT is finalized */
  finalized: boolean;
}

export interface PSBTImportResult {
  /** Parsed PSBT object */
  psbt: bitcoin.Psbt;
  /** Transaction ID */
  txid: string;
  /** Validation warnings (if any) */
  warnings: string[];
  /** Whether PSBT is valid */
  isValid: boolean;
}

export interface PSBTChunk {
  /** Chunk number (1-based) */
  index: number;
  /** Total number of chunks */
  total: number;
  /** Base64 chunk data */
  data: string;
  /** Transaction ID for reassembly */
  txid: string;
}

/**
 * Maximum recommended size for QR codes (bytes)
 * Standard QR codes can hold ~2953 bytes in binary mode
 * We use 2500 for safety margin
 */
const QR_CHUNK_SIZE = 2500;

export class PSBTManager {
  private network: bitcoin.Network;

  constructor(network: bitcoin.Network) {
    this.network = network;
  }

  /**
   * Exports a PSBT with full metadata
   *
   * @param psbt - PSBT to export
   * @returns Export object with multiple format options
   */
  exportPSBT(psbt: bitcoin.Psbt): PSBTExport {
    // Get base64 and hex representations
    const base64 = psbt.toBase64();
    const hex = psbt.toHex();

    // Extract transaction for analysis (use __CACHE.__TX to avoid "Not finalized" error)
    const tx = (psbt as any).__CACHE.__TX || psbt.extractTransaction();
    const txid = tx.getId();

    // Calculate total output and fee
    let totalOutput = 0;
    for (const output of tx.outs) {
      totalOutput += output.value;
    }

    // Calculate fee (inputs - outputs)
    let totalInput = 0;
    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const input = psbt.data.inputs[i];
      if (input.witnessUtxo) {
        totalInput += input.witnessUtxo.value;
      } else if (input.nonWitnessUtxo) {
        const inputTx = bitcoin.Transaction.fromBuffer(input.nonWitnessUtxo);
        const prevOut = inputTx.outs[psbt.txInputs[i].index];
        totalInput += prevOut.value;
      }
    }

    const fee = totalInput - totalOutput;

    // Count signatures per input
    const signatures: number[] = [];
    for (const input of psbt.data.inputs) {
      const sigCount = input.partialSig ? input.partialSig.length : 0;
      signatures.push(sigCount);
    }

    // Check if finalized
    const finalized = psbt.data.inputs.every((input) => {
      return input.finalScriptSig !== undefined || input.finalScriptWitness !== undefined;
    });

    return {
      base64,
      hex,
      txid,
      numInputs: psbt.txInputs.length,
      numOutputs: tx.outs.length,
      totalOutput,
      fee,
      signatures,
      finalized,
    };
  }

  /**
   * Imports and validates a PSBT from base64 or hex string
   *
   * @param psbtString - Base64 or hex encoded PSBT
   * @returns Import result with validation info
   * @throws {Error} If PSBT format is invalid
   */
  importPSBT(psbtString: string): PSBTImportResult {
    const warnings: string[] = [];
    let psbt: bitcoin.Psbt;

    try {
      // Try to detect format: hex uses only 0-9a-f, base64 uses a wider character set
      if (/^[0-9a-fA-F]+$/.test(psbtString)) {
        // Hex format (only hex characters)
        psbt = bitcoin.Psbt.fromHex(psbtString, { network: this.network });
      } else if (/^[A-Za-z0-9+/=]+$/.test(psbtString)) {
        // Base64 format (includes letters beyond a-f, or +/= characters)
        psbt = bitcoin.Psbt.fromBase64(psbtString, { network: this.network });
      } else {
        throw new Error('Invalid PSBT format. Expected base64 or hex string.');
      }
    } catch (error) {
      throw new Error(`Failed to parse PSBT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Validate PSBT structure
    try {
      // Check that all inputs have required data
      for (let i = 0; i < psbt.data.inputs.length; i++) {
        const input = psbt.data.inputs[i];

        // Check for UTXO data
        if (!input.witnessUtxo && !input.nonWitnessUtxo) {
          warnings.push(`Input ${i}: Missing UTXO data (witnessUtxo or nonWitnessUtxo)`);
        }

        // Check for redeem script (if P2SH)
        // Check for witness script (if P2WSH or P2SH-P2WSH)
        // These are optional during import but good to warn about
      }

      // Check that transaction is properly constructed (use __CACHE.__TX to avoid "Not finalized" error)
      const tx = (psbt as any).__CACHE.__TX || psbt.extractTransaction();
      const txid = tx.getId();

      // Validate outputs
      if (tx.outs.length === 0) {
        warnings.push('Transaction has no outputs');
      }

      for (let i = 0; i < tx.outs.length; i++) {
        if (tx.outs[i].value <= 0) {
          warnings.push(`Output ${i}: Invalid value (${tx.outs[i].value})`);
        }
      }

      // SECURITY FIX HIGH-3: Validate network and excessive fees
      // Check address network prefixes
      for (let i = 0; i < tx.outs.length; i++) {
        try {
          const address = bitcoin.address.fromOutputScript(tx.outs[i].script, this.network);
          // Validate network prefix
          const isTestnet = this.network === bitcoin.networks.testnet;
          if (isTestnet) {
            // Testnet addresses should start with: m, n, 2, tb1
            if (!address.match(/^(m|n|2|tb1)/)) {
              warnings.push(`Output ${i}: Address ${address} does not match expected testnet format`);
            }
          } else {
            // Mainnet addresses should start with: 1, 3, bc1
            if (!address.match(/^(1|3|bc1)/)) {
              warnings.push(`Output ${i}: Address ${address} does not match expected mainnet format`);
            }
          }
        } catch {
          // Skip if we can't parse the address
        }
      }

      // Calculate fee and check for excessive fee (> 10% of total input)
      let totalInput = 0;
      for (let i = 0; i < psbt.data.inputs.length; i++) {
        const input = psbt.data.inputs[i];
        if (input.witnessUtxo) {
          totalInput += input.witnessUtxo.value;
        } else if (input.nonWitnessUtxo) {
          const inputTx = bitcoin.Transaction.fromBuffer(input.nonWitnessUtxo);
          const prevOut = inputTx.outs[psbt.txInputs[i].index];
          totalInput += prevOut.value;
        }
      }

      let totalOutput = 0;
      for (const output of tx.outs) {
        totalOutput += output.value;
      }

      const fee = totalInput - totalOutput;
      const feePercentage = totalInput > 0 ? (fee / totalInput) * 100 : 0;

      if (feePercentage > 10) {
        warnings.push(
          `Excessive fee detected: ${fee} sats (${feePercentage.toFixed(2)}% of inputs). ` +
          `This may indicate an error or attack.`
        );
      }

      return {
        psbt,
        txid,
        warnings,
        isValid: warnings.length === 0,
      };
    } catch (error) {
      warnings.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        psbt,
        txid: 'unknown',
        warnings,
        isValid: false,
      };
    }
  }

  /**
   * Splits a PSBT into chunks for QR code sharing
   *
   * Useful for air-gapped signing devices that can only communicate via QR codes.
   * Each chunk is small enough to fit in a standard QR code.
   *
   * @param psbt - PSBT to split
   * @returns Array of chunks with metadata
   */
  createPSBTChunks(psbt: bitcoin.Psbt): PSBTChunk[] {
    const base64 = psbt.toBase64();
    const tx = (psbt as any).__CACHE.__TX || psbt.extractTransaction();
    const txid = tx.getId();

    // Calculate number of chunks needed
    const totalChunks = Math.ceil(base64.length / QR_CHUNK_SIZE);

    if (totalChunks === 1) {
      // No splitting needed
      return [
        {
          index: 1,
          total: 1,
          data: base64,
          txid,
        },
      ];
    }

    const chunks: PSBTChunk[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * QR_CHUNK_SIZE;
      const end = Math.min(start + QR_CHUNK_SIZE, base64.length);
      const data = base64.slice(start, end);

      chunks.push({
        index: i + 1,
        total: totalChunks,
        data,
        txid,
      });
    }

    return chunks;
  }

  /**
   * Reassembles a PSBT from chunks
   *
   * @param chunks - Array of PSBT chunks (can be in any order)
   * @returns Reassembled PSBT
   * @throws {Error} If chunks are invalid or incomplete
   */
  reassemblePSBTChunks(chunks: PSBTChunk[]): bitcoin.Psbt {
    if (chunks.length === 0) {
      throw new Error('No chunks provided');
    }

    // Validate all chunks have same txid and total
    const txid = chunks[0].txid;
    const total = chunks[0].total;

    for (const chunk of chunks) {
      if (chunk.txid !== txid) {
        throw new Error(`Chunk ${chunk.index} has mismatched txid: ${chunk.txid} vs ${txid}`);
      }
      if (chunk.total !== total) {
        throw new Error(`Chunk ${chunk.index} has mismatched total: ${chunk.total} vs ${total}`);
      }
    }

    // Check we have all chunks
    if (chunks.length !== total) {
      throw new Error(`Missing chunks. Expected ${total}, got ${chunks.length}`);
    }

    // Sort by index
    const sorted = [...chunks].sort((a, b) => a.index - b.index);

    // Check for duplicates and gaps
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].index !== i + 1) {
        throw new Error(`Missing chunk ${i + 1}`);
      }
    }

    // Reassemble base64 string
    const base64 = sorted.map((chunk) => chunk.data).join('');

    // Parse PSBT
    return bitcoin.Psbt.fromBase64(base64, { network: this.network });
  }

  /**
   * Creates a pending multisig transaction record
   *
   * Used to track PSBTs that are awaiting signatures from co-signers.
   *
   * NOTE: This method is deprecated. Use the handler in background/index.ts instead
   * which creates PendingMultisigTx records that match the current type definition.
   *
   * @deprecated Use handleSavePendingMultisigTx() in background service worker
   */
  createPendingTransaction(
    psbt: bitcoin.Psbt,
    accountId: number,
    multisigConfig: string,
    m: number,
    signatureStatus: any
  ): PendingMultisigTx {
    const exported = this.exportPSBT(psbt);
    const tx = (psbt as any).__CACHE.__TX || psbt.extractTransaction();

    // Find recipient address and amount (first non-change output)
    let recipientAddress = '';
    let amount = 0;

    if (tx.outs.length > 0) {
      // Assume first output is recipient (simplified)
      try {
        recipientAddress = bitcoin.address.fromOutputScript(tx.outs[0].script, this.network);
        amount = tx.outs[0].value;
      } catch {
        recipientAddress = 'Unknown';
      }
    }

    return {
      id: exported.txid,
      accountId,
      psbtBase64: exported.base64,
      created: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      multisigConfig: multisigConfig as any,
      signaturesCollected: Math.max(...exported.signatures, 0),
      signaturesRequired: m,
      signatureStatus,
      metadata: {
        amount,
        recipient: recipientAddress,
        fee: exported.fee,
      },
    };
  }

  /**
   * Updates a pending transaction with new signature data
   *
   * NOTE: This method is deprecated. Pending transactions should be updated
   * directly in storage by the service worker handlers.
   *
   * @deprecated Update PendingMultisigTx directly in storage
   */
  updatePendingTransaction(
    pending: PendingMultisigTx,
    signedPsbt: bitcoin.Psbt
  ): PendingMultisigTx {
    const exported = this.exportPSBT(signedPsbt);

    return {
      ...pending,
      psbtBase64: exported.base64,
      signaturesCollected: Math.max(...exported.signatures, 0),
    };
  }

  /**
   * Generates a filename for saving a PSBT
   *
   * @param txid - Transaction ID
   * @param signed - Whether PSBT is signed
   * @returns Suggested filename
   */
  generateFilename(txid: string, signed: boolean): string {
    const prefix = signed ? 'signed' : 'unsigned';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}-psbt-${txid.slice(0, 8)}-${timestamp}.psbt`;
  }

  /**
   * Validates that a PSBT matches expected multisig parameters
   *
   * @param psbt - PSBT to validate
   * @param expectedM - Expected required signatures
   * @param expectedN - Expected total co-signers
   * @param expectedAddresses - Expected input addresses
   * @returns Validation result with detailed error messages
   */
  validateMultisigPSBT(
    psbt: bitcoin.Psbt,
    expectedM: number,
    expectedN: number,
    expectedAddresses?: string[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check each input has proper multisig scripts
      for (let i = 0; i < psbt.data.inputs.length; i++) {
        const input = psbt.data.inputs[i];

        // Check for redeem script or witness script
        let script: Buffer | undefined;

        if (input.redeemScript) {
          script = input.redeemScript;
        } else if (input.witnessScript) {
          script = input.witnessScript;
        }

        if (!script) {
          errors.push(`Input ${i}: Missing redeem script or witness script`);
          continue;
        }

        // Parse multisig script to check M and N
        try {
          const decompiled = bitcoin.script.decompile(script);
          if (!decompiled) {
            errors.push(`Input ${i}: Failed to decompile multisig script`);
            continue;
          }

          // Multisig script format: OP_M <pubkey1> <pubkey2> ... <pubkeyN> OP_N OP_CHECKMULTISIG
          let m: number;
          let n: number;

          const firstElement = decompiled[0];
          const secondToLast = decompiled[decompiled.length - 2];

          // Decode M (OP_1 to OP_16 are 0x51 to 0x60)
          if (typeof firstElement === 'number' && firstElement >= 0x51 && firstElement <= 0x60) {
            m = firstElement - 0x50;
          } else if (Buffer.isBuffer(firstElement)) {
            m = bitcoin.script.number.decode(firstElement);
          } else {
            errors.push(`Input ${i}: Invalid M value in multisig script`);
            continue;
          }

          // Decode N
          if (typeof secondToLast === 'number' && secondToLast >= 0x51 && secondToLast <= 0x60) {
            n = secondToLast - 0x50;
          } else if (Buffer.isBuffer(secondToLast)) {
            n = bitcoin.script.number.decode(secondToLast);
          } else {
            errors.push(`Input ${i}: Invalid N value in multisig script`);
            continue;
          }

          if (m !== expectedM) {
            errors.push(`Input ${i}: Expected M=${expectedM}, got M=${m}`);
          }

          if (n !== expectedN) {
            errors.push(`Input ${i}: Expected N=${expectedN}, got N=${n}`);
          }
        } catch (error) {
          errors.push(
            `Input ${i}: Failed to parse multisig parameters: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      }

      // Validate input addresses if provided
      if (expectedAddresses && expectedAddresses.length > 0) {
        const tx = (psbt as any).__CACHE.__TX || psbt.extractTransaction();

        for (let i = 0; i < tx.ins.length; i++) {
          // Try to derive address from input
          const input = psbt.data.inputs[i];

          if (input.witnessUtxo) {
            try {
              const address = bitcoin.address.fromOutputScript(
                input.witnessUtxo.script,
                this.network
              );

              if (!expectedAddresses.includes(address)) {
                errors.push(
                  `Input ${i}: Address ${address} not in expected addresses list`
                );
              }
            } catch {
              // Skip if can't derive address
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      errors.push(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        valid: false,
        errors,
      };
    }
  }

  /**
   * Gets a human-readable summary of a PSBT
   *
   * @param psbt - PSBT to summarize
   * @returns Summary object
   */
  getPSBTSummary(psbt: bitcoin.Psbt): {
    txid: string;
    numInputs: number;
    numOutputs: number;
    totalOutput: number;
    fee: number;
    signatures: { input: number; count: number; required?: number }[];
    finalized: boolean;
  } {
    const exported = this.exportPSBT(psbt);

    // Try to determine required signatures from first input
    let requiredSignatures: number | undefined;
    if (psbt.data.inputs.length > 0) {
      const input = psbt.data.inputs[0];
      let script: Buffer | undefined;

      if (input.redeemScript) {
        script = input.redeemScript;
      } else if (input.witnessScript) {
        script = input.witnessScript;
      }

      if (script) {
        try {
          const decompiled = bitcoin.script.decompile(script);
          if (decompiled && decompiled.length > 0) {
            const firstElement = decompiled[0];
            // Multisig scripts start with OP_M (0x51-0x60 for M=1-16)
            if (typeof firstElement === 'number') {
              // OP_1 = 0x51 (81), OP_2 = 0x52 (82), etc.
              if (firstElement >= 0x51 && firstElement <= 0x60) {
                requiredSignatures = firstElement - 0x50;
              }
            } else if (Buffer.isBuffer(firstElement)) {
              // For encoded numbers
              requiredSignatures = bitcoin.script.number.decode(firstElement);
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    return {
      txid: exported.txid,
      numInputs: exported.numInputs,
      numOutputs: exported.numOutputs,
      totalOutput: exported.totalOutput,
      fee: exported.fee,
      signatures: exported.signatures.map((count, i) => ({
        input: i,
        count,
        required: requiredSignatures,
      })),
      finalized: exported.finalized,
    };
  }
}

export default PSBTManager;
