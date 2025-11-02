/**
 * TransactionBuilder - Bitcoin Transaction Construction and Signing
 *
 * Implements Bitcoin transaction building with:
 * - UTXO selection (coin selection algorithms)
 * - Transaction size estimation for all address types
 * - Fee calculation with configurable rates
 * - PSBT (Partially Signed Bitcoin Transaction) construction
 * - Multi-input signing for Legacy, SegWit, and Native SegWit
 *
 * Standards:
 * - BIP174: PSBT format (https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki)
 * - BIP141: SegWit transactions (https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki)
 * - BIP143: SegWit transaction signing (https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki)
 *
 * Transaction Structure:
 * - Inputs: Previous outputs (UTXOs) being spent
 * - Outputs: New outputs being created (recipient + optional change)
 * - Witness data: Signature data for SegWit transactions
 *
 * Security Notes:
 * - Always validate recipient addresses before building
 * - Verify transaction before extracting hex for broadcast
 * - Never log private keys during signing
 * - Double-check amounts and fees before signing
 */

import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface } from 'bip32';
import { ECPairFactory, ECPairInterface } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { NETWORKS, DUST_THRESHOLD, MIN_RELAY_FEE } from '../../shared/constants';
import type { UTXO, AddressType, MultisigAddressType, MultisigAddress } from '../../shared/types';
import { AddressGenerator } from '../wallet/AddressGenerator';
import { sortPublicKeys } from '../wallet/utils/bip67';

// Initialize ECPair with secp256k1
const ECPair = ECPairFactory(ecc);

/**
 * Selected UTXO with derivation information for signing
 */
export interface SelectedUTXO extends UTXO {
  derivationPath: string; // Full BIP44/49/84 path for this UTXO
  addressType: AddressType; // Type of address (determines signing method)
}

/**
 * Transaction output information
 */
export interface TxOutput {
  address: string;
  value: number; // satoshis
  isChange: boolean;
}

/**
 * Transaction building result
 */
export interface BuildTransactionResult {
  txHex: string; // Hex-encoded signed transaction ready for broadcast
  txid: string; // Transaction ID
  fee: number; // Fee in satoshis
  size: number; // Transaction size in bytes
  virtualSize: number; // Virtual size in vBytes (for SegWit)
  inputs: SelectedUTXO[]; // UTXOs used as inputs
  outputs: TxOutput[]; // Transaction outputs
}

/**
 * Parameters for building a transaction
 */
export interface BuildTransactionParams {
  utxos: UTXO[]; // Available UTXOs to select from
  outputs: { address: string; amount: number }[]; // Recipient outputs
  changeAddress: string; // Address to send change to
  feeRate: number; // Fee rate in sat/vB
  getPrivateKey: (derivationPath: string) => Buffer; // Function to retrieve private key
  getAddressType: (address: string) => AddressType; // Function to determine address type
  getDerivationPath: (address: string) => string; // Function to get derivation path for address
}

/**
 * UTXO selection result
 */
export interface UTXOSelectionResult {
  selectedUtxos: SelectedUTXO[];
  totalInput: number;
  fee: number;
  change: number;
}

/**
 * Transaction size estimation
 */
export interface SizeEstimate {
  size: number; // Raw size in bytes
  virtualSize: number; // Virtual size in vBytes (weight / 4)
}

/**
 * TransactionBuilder - Builds and signs Bitcoin transactions
 *
 * Responsibilities:
 * 1. Select optimal UTXOs for spending
 * 2. Estimate transaction size and calculate fees
 * 3. Build PSBT with inputs and outputs
 * 4. Sign transaction inputs with correct method per address type
 * 5. Finalize and extract transaction hex for broadcast
 */
export class TransactionBuilder {
  private network: bitcoin.Network;
  private networkName: 'testnet' | 'mainnet';
  private addressGenerator: AddressGenerator;

  /**
   * Creates a TransactionBuilder instance
   *
   * @param network - Bitcoin network ('testnet' or 'mainnet')
   */
  constructor(network: 'testnet' | 'mainnet' = 'testnet') {
    this.networkName = network;
    this.network = NETWORKS[network];
    this.addressGenerator = new AddressGenerator(network);
  }

  /**
   * Builds and signs a complete Bitcoin transaction
   *
   * This is the main entry point for transaction creation.
   * It orchestrates UTXO selection, fee calculation, PSBT building,
   * signing, and finalization.
   *
   * @param params - Transaction building parameters
   * @returns Complete transaction ready for broadcast
   *
   * @throws {Error} If insufficient funds, invalid addresses, or signing fails
   *
   * Process:
   * 1. Validate recipient addresses
   * 2. Calculate total output amount
   * 3. Select UTXOs to cover amount + estimated fee
   * 4. Build PSBT with inputs and outputs
   * 5. Sign all inputs
   * 6. Finalize PSBT
   * 7. Extract and verify transaction
   */
  async buildTransaction(
    params: BuildTransactionParams
  ): Promise<BuildTransactionResult> {
    try {
      // 1. Validate inputs
      this.validateBuildParams(params);

      // 2. Calculate total amount to send
      const totalOutputAmount = params.outputs.reduce(
        (sum, output) => sum + output.amount,
        0
      );

      // Validate amounts
      if (totalOutputAmount <= 0) {
        throw new Error('Total output amount must be greater than 0');
      }

      // Validate each output is above dust threshold
      for (const output of params.outputs) {
        if (output.amount < DUST_THRESHOLD) {
          throw new Error(
            `Output amount ${output.amount} is below dust threshold (${DUST_THRESHOLD} satoshis)`
          );
        }
      }

      // 3. Validate recipient addresses
      for (const output of params.outputs) {
        if (!this.addressGenerator.validateAddress(output.address)) {
          throw new Error(`Invalid recipient address: ${output.address}`);
        }
      }

      // Validate change address
      if (!this.addressGenerator.validateAddress(params.changeAddress)) {
        throw new Error(`Invalid change address: ${params.changeAddress}`);
      }

      // 4. Select UTXOs
      // First, enrich UTXOs with derivation information
      const enrichedUtxos: SelectedUTXO[] = params.utxos.map((utxo) => ({
        ...utxo,
        derivationPath: params.getDerivationPath(utxo.address),
        addressType: params.getAddressType(utxo.address),
      }));

      // Select UTXOs using coin selection algorithm
      const selection = this.selectUTXOs({
        utxos: enrichedUtxos,
        targetAmount: totalOutputAmount,
        feeRate: params.feeRate,
        changeAddress: params.changeAddress,
      });

      // 5. Build PSBT
      const psbt = await this.buildPSBT({
        inputs: selection.selectedUtxos,
        outputs: params.outputs,
        changeAddress: params.changeAddress,
        changeAmount: selection.change,
      });

      // 6. Sign all inputs
      await this.signPSBT(psbt, selection.selectedUtxos, params.getPrivateKey);

      // 7. Finalize PSBT
      psbt.finalizeAllInputs();

      // 8. Extract transaction
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();
      const txid = tx.getId();

      // 9. Verify transaction
      this.verifyTransaction(tx, selection);

      // 10. Prepare outputs for result
      const txOutputs: TxOutput[] = params.outputs.map((output) => ({
        address: output.address,
        value: output.amount,
        isChange: false,
      }));

      // Add change output if exists
      if (selection.change > 0) {
        txOutputs.push({
          address: params.changeAddress,
          value: selection.change,
          isChange: true,
        });
      }

      return {
        txHex,
        txid,
        fee: selection.fee,
        size: tx.byteLength(),
        virtualSize: tx.virtualSize(),
        inputs: selection.selectedUtxos,
        outputs: txOutputs,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to build transaction: ${message}`);
    }
  }

  /**
   * Selects optimal UTXOs for the transaction
   *
   * Uses a greedy algorithm (largest-first) for MVP.
   * Future: Implement Branch and Bound for optimal selection.
   *
   * Algorithm:
   * 1. Sort UTXOs by value (largest first)
   * 2. Iteratively add UTXOs until target + fee is met
   * 3. Recalculate fee as inputs increase
   * 4. Calculate change amount
   * 5. If change is dust, add to fee instead
   *
   * @param params - UTXO selection parameters
   * @returns Selected UTXOs, fee, and change amount
   *
   * @throws {Error} If insufficient funds
   */
  selectUTXOs(params: {
    utxos: SelectedUTXO[];
    targetAmount: number;
    feeRate: number;
    changeAddress: string;
  }): UTXOSelectionResult {
    try {
      const { utxos, targetAmount, feeRate, changeAddress } = params;

      // Validate we have UTXOs
      if (!utxos || utxos.length === 0) {
        throw new Error('No UTXOs available');
      }

      // PRIVACY FIX: Randomize UTXO selection using Fisher-Yates shuffle
      // This prevents wallet fingerprinting through deterministic selection patterns
      const randomizedUtxos = this.shuffleUtxos([...utxos]);

      const selected: SelectedUTXO[] = [];
      let totalInput = 0;

      // Determine if we'll need a change output
      // Assume yes initially, will verify later
      const changeAddressType = this.addressGenerator.getAddressType(changeAddress);
      if (!changeAddressType) {
        throw new Error('Invalid change address type');
      }

      // Iteratively select UTXOs (randomized order for privacy)
      for (const utxo of randomizedUtxos) {
        selected.push(utxo);
        totalInput += utxo.value;

        // Estimate transaction size with current inputs
        // Try with 2 outputs (recipient + change)
        const sizeWithChange = this.estimateSize({
          numInputs: selected.length,
          numOutputs: 2,
          inputTypes: selected.map((u) => u.addressType),
        });

        const feeWithChange = Math.ceil(sizeWithChange.virtualSize * feeRate);
        const changeWithChange = totalInput - targetAmount - feeWithChange;

        // If change is above dust, we're done
        if (changeWithChange >= DUST_THRESHOLD) {
          return {
            selectedUtxos: selected,
            totalInput,
            fee: feeWithChange,
            change: changeWithChange,
          };
        }

        // Try with 1 output (no change)
        const sizeNoChange = this.estimateSize({
          numInputs: selected.length,
          numOutputs: 1,
          inputTypes: selected.map((u) => u.addressType),
        });

        const feeNoChange = Math.ceil(sizeNoChange.virtualSize * feeRate);
        const changeNoChange = totalInput - targetAmount - feeNoChange;

        // If we have enough without change output, we're done
        if (changeNoChange >= 0) {
          return {
            selectedUtxos: selected,
            totalInput,
            fee: feeNoChange + changeNoChange, // Add dust to fee
            change: 0,
          };
        }

        // Continue adding more UTXOs
      }

      // If we get here, we don't have enough funds
      throw new Error(
        `Insufficient funds. Have ${totalInput} satoshis, need ${targetAmount} satoshis plus fees`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`UTXO selection failed: ${message}`);
    }
  }

  /**
   * Estimates transaction size based on inputs and outputs
   *
   * Size calculation varies by address type due to different witness data.
   *
   * Approximations:
   * - Base overhead: 10 bytes
   * - Legacy input: ~148 bytes
   * - P2SH-P2WPKH input: ~91 vBytes
   * - P2WPKH input: ~68 vBytes
   * - Output: ~34 bytes (Legacy), ~32 bytes (SegWit), ~31 bytes (Native SegWit)
   *
   * For SegWit:
   * - Weight = base_size * 3 + total_size
   * - vBytes = weight / 4
   *
   * @param params - Transaction structure parameters
   * @returns Size and virtual size estimates
   */
  estimateSize(params: {
    numInputs: number;
    numOutputs: number;
    inputTypes: AddressType[];
  }): SizeEstimate {
    const { numInputs, numOutputs, inputTypes } = params;

    // Validate inputs match input types
    if (inputTypes.length !== numInputs) {
      throw new Error('Input types length must match number of inputs');
    }

    // Base transaction overhead
    // Version (4 bytes) + locktime (4 bytes) + input count (1 byte) + output count (1 byte)
    let baseSize = 10;

    // Check if any inputs are SegWit
    const hasSegWit = inputTypes.some(
      (type) => type === 'segwit' || type === 'native-segwit'
    );

    // SegWit marker and flag (2 bytes if any SegWit inputs)
    if (hasSegWit) {
      baseSize += 2;
    }

    // Calculate input sizes
    let totalInputSize = 0;
    let totalWitnessSize = 0;

    for (const inputType of inputTypes) {
      switch (inputType) {
        case 'legacy':
          // Legacy P2PKH input
          // txid (32) + vout (4) + scriptSig length (1) + scriptSig (~107) + sequence (4)
          totalInputSize += 148;
          break;

        case 'segwit':
          // P2SH-P2WPKH input
          // Base: txid (32) + vout (4) + scriptSig length (1) + scriptSig (23 for P2SH redeem) + sequence (4)
          totalInputSize += 64;
          // Witness: stack items (1) + signature length (1) + signature (~72) + pubkey length (1) + pubkey (33)
          totalWitnessSize += 108;
          break;

        case 'native-segwit':
          // P2WPKH input
          // Base: txid (32) + vout (4) + scriptSig length (1, empty) + sequence (4)
          totalInputSize += 41;
          // Witness: stack items (1) + signature length (1) + signature (~72) + pubkey length (1) + pubkey (33)
          totalWitnessSize += 108;
          break;

        default:
          throw new Error(`Unsupported input type: ${inputType}`);
      }
    }

    // Calculate output sizes
    // Output: value (8) + script length (1) + script
    // Legacy/SegWit: 25-byte script = 34 bytes per output
    // Native SegWit: 22-byte script = 31 bytes per output
    const outputSize = hasSegWit ? 31 : 34;
    const totalOutputSize = numOutputs * outputSize;

    // Calculate total sizes
    const totalBaseSize = baseSize + totalInputSize + totalOutputSize;
    const totalSize = totalBaseSize + totalWitnessSize;

    // Calculate weight and virtual size for SegWit
    // Weight = base_size * 3 + total_size
    // vBytes = weight / 4
    const weight = totalBaseSize * 3 + totalSize;
    const virtualSize = Math.ceil(weight / 4);

    return {
      size: totalSize,
      virtualSize: hasSegWit ? virtualSize : totalSize,
    };
  }

  /**
   * Estimates transaction fee
   *
   * @param params - Fee estimation parameters
   * @returns Estimated fee in satoshis
   */
  estimateFee(params: {
    numInputs: number;
    numOutputs: number;
    inputTypes: AddressType[];
    feeRate: number;
  }): number {
    const { numInputs, numOutputs, inputTypes, feeRate } = params;

    const sizeEstimate = this.estimateSize({
      numInputs,
      numOutputs,
      inputTypes,
    });

    const fee = Math.ceil(sizeEstimate.virtualSize * feeRate);

    // Ensure minimum relay fee
    return Math.max(fee, MIN_RELAY_FEE * sizeEstimate.virtualSize);
  }

  /**
   * Builds a PSBT (Partially Signed Bitcoin Transaction)
   *
   * PSBT allows for transaction construction separate from signing,
   * which is useful for hardware wallets and multi-sig.
   *
   * @param params - PSBT construction parameters
   * @returns Unsigned PSBT
   *
   * @throws {Error} If PSBT construction fails
   */
  private async buildPSBT(params: {
    inputs: SelectedUTXO[];
    outputs: { address: string; amount: number }[];
    changeAddress: string;
    changeAmount: number;
  }): Promise<bitcoin.Psbt> {
    try {
      const { inputs, outputs, changeAddress, changeAmount } = params;

      // Create PSBT
      const psbt = new bitcoin.Psbt({ network: this.network });

      // Add inputs
      for (const utxo of inputs) {
        await this.addInputToPSBT(psbt, utxo);
      }

      // Add recipient outputs
      for (const output of outputs) {
        psbt.addOutput({
          address: output.address,
          value: output.amount,
        });
      }

      // Add change output if needed
      if (changeAmount >= DUST_THRESHOLD) {
        psbt.addOutput({
          address: changeAddress,
          value: changeAmount,
        });
      }

      return psbt;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to build PSBT: ${message}`);
    }
  }

  /**
   * Adds an input to a PSBT with correct witness/redeem data
   *
   * Different address types require different PSBT input data:
   * - Legacy: nonWitnessUtxo (full previous transaction)
   * - SegWit: witnessUtxo + redeemScript
   * - Native SegWit: witnessUtxo only
   *
   * For simplicity in MVP, we use witnessUtxo for all SegWit types.
   * This requires the UTXO value and scriptPubKey.
   *
   * @param psbt - PSBT to add input to
   * @param utxo - UTXO to add as input
   */
  private async addInputToPSBT(
    psbt: bitcoin.Psbt,
    utxo: SelectedUTXO
  ): Promise<void> {
    try {
      const scriptPubKey = Buffer.from(utxo.scriptPubKey, 'hex');

      // For SegWit and Native SegWit, use witnessUtxo
      if (utxo.addressType === 'segwit' || utxo.addressType === 'native-segwit') {
        const inputData: any = {
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: scriptPubKey,
            value: utxo.value,
          },
        };

        // For P2SH-P2WPKH (SegWit wrapped), we need the redeemScript
        if (utxo.addressType === 'segwit') {
          // Create the P2WPKH payment to get the redeemScript
          const payment = this.addressGenerator.getPayment(utxo.address);

          // For P2SH, we need to provide the redeemScript (the inner P2WPKH)
          // The payment object for P2SH contains the redeem script
          if (payment.redeem && payment.redeem.output) {
            inputData.redeemScript = payment.redeem.output;
          } else {
            // If we can't get it from the payment, we need to reconstruct it
            // For P2SH-P2WPKH, the redeem script is OP_0 + 20-byte pubkey hash
            // We need to derive this from the address
            // For now, throw error - this should be provided in the UTXO data
            throw new Error(
              'P2SH-P2WPKH requires redeemScript - cannot be derived from address alone'
            );
          }
        }

        psbt.addInput(inputData);
      } else {
        // Legacy - we would need the full previous transaction (nonWitnessUtxo)
        // For simplicity, we'll use witnessUtxo which is accepted by most nodes
        // In production, fetching the full transaction would be more robust
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: scriptPubKey,
            value: utxo.value,
          },
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add input to PSBT: ${message}`);
    }
  }

  /**
   * Signs all inputs in a PSBT
   *
   * Each input is signed with its corresponding private key.
   * The signing method depends on the address type:
   * - Legacy: P2PKH signature
   * - SegWit: P2SH-P2WPKH signature
   * - Native SegWit: P2WPKH signature
   *
   * @param psbt - PSBT to sign
   * @param inputs - Input UTXOs with derivation paths
   * @param getPrivateKey - Function to retrieve private key for a derivation path
   *
   * @throws {Error} If signing fails or signature validation fails
   */
  private async signPSBT(
    psbt: bitcoin.Psbt,
    inputs: SelectedUTXO[],
    getPrivateKey: (derivationPath: string) => Buffer
  ): Promise<void> {
    try {
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        // Get private key for this input
        const privateKeyBuffer = getPrivateKey(input.derivationPath);

        // Create ECPair from private key
        const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, {
          network: this.network,
        });

        // Create a signer compatible with PSBT
        // We need to ensure publicKey is a Buffer
        const signer = {
          publicKey: Buffer.from(keyPair.publicKey),
          sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
        };

        // Sign input
        psbt.signInput(i, signer);

        // Validate signature
        const isValid = psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
          return ECPair.fromPublicKey(pubkey, { network: this.network }).verify(
            msghash,
            signature
          );
        });

        if (!isValid) {
          throw new Error(`Signature validation failed for input ${i}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sign PSBT: ${message}`);
    }
  }

  /**
   * Verifies a transaction before broadcast
   *
   * Verification checks:
   * 1. No dust outputs
   * 2. Fee is reasonable (not negative, not excessive)
   * 3. No duplicate inputs
   * 4. Output total + fee = input total
   *
   * @param tx - Finalized transaction
   * @param selection - UTXO selection used
   *
   * @throws {Error} If verification fails
   */
  private verifyTransaction(
    tx: bitcoin.Transaction,
    selection: UTXOSelectionResult
  ): void {
    try {
      // 1. Verify no dust outputs
      for (const output of tx.outs) {
        if (output.value < DUST_THRESHOLD && output.value !== 0) {
          throw new Error(`Dust output detected: ${output.value} satoshis`);
        }
      }

      // 2. Calculate output sum
      const outputSum = tx.outs.reduce((sum, output) => sum + output.value, 0);

      // 3. Verify fee calculation
      const inputSum = selection.totalInput;
      const calculatedFee = inputSum - outputSum;

      if (calculatedFee < 0) {
        throw new Error('Negative fee detected (outputs exceed inputs)');
      }

      if (calculatedFee !== selection.fee) {
        throw new Error(
          `Fee mismatch: calculated ${calculatedFee}, expected ${selection.fee}`
        );
      }

      // 4. Verify no duplicate inputs
      const inputKeys = new Set<string>();
      for (const input of tx.ins) {
        const key = `${input.hash.reverse().toString('hex')}:${input.index}`;
        if (inputKeys.has(key)) {
          throw new Error('Duplicate input detected');
        }
        inputKeys.add(key);
      }

      // 5. Verify fee is reasonable (not more than 10% of transaction amount)
      const maxReasonableFee = outputSum * 0.1;
      if (calculatedFee > maxReasonableFee) {
        console.warn(
          `Warning: Fee ${calculatedFee} is more than 10% of transaction amount ${outputSum}`
        );
      }

      // 6. Verify minimum relay fee
      const minFee = MIN_RELAY_FEE * tx.virtualSize();
      if (calculatedFee < minFee) {
        throw new Error(
          `Fee ${calculatedFee} is below minimum relay fee ${minFee}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Transaction verification failed: ${message}`);
    }
  }

  /**
   * Validates transaction building parameters
   *
   * @param params - Parameters to validate
   * @throws {Error} If parameters are invalid
   */
  private validateBuildParams(params: BuildTransactionParams): void {
    if (!params.utxos || params.utxos.length === 0) {
      throw new Error('No UTXOs provided');
    }

    if (!params.outputs || params.outputs.length === 0) {
      throw new Error('No outputs provided');
    }

    if (!params.changeAddress) {
      throw new Error('Change address not provided');
    }

    if (params.feeRate <= 0) {
      throw new Error('Fee rate must be greater than 0');
    }

    if (params.feeRate > 1000) {
      throw new Error(
        'Fee rate too high (>1000 sat/vB) - possible mistake'
      );
    }

    if (!params.getPrivateKey) {
      throw new Error('Private key retrieval function not provided');
    }

    if (!params.getAddressType) {
      throw new Error('Address type function not provided');
    }

    if (!params.getDerivationPath) {
      throw new Error('Derivation path function not provided');
    }
  }

  /**
   * Gets the current network
   *
   * @returns Network name
   */
  getNetwork(): 'testnet' | 'mainnet' {
    return this.networkName;
  }

  // ========================================================================
  // MULTISIG TRANSACTION SUPPORT
  // ========================================================================

  /**
   * Builds an unsigned multisig PSBT for export to co-signers
   *
   * @param params - Multisig transaction parameters
   * @returns Unsigned PSBT ready for signing
   *
   * This creates a PSBT with all inputs and outputs but no signatures.
   * The PSBT can be exported and shared with co-signers for signing.
   */
  async buildMultisigPSBT(params: {
    multisigAddresses: MultisigAddress[];
    utxos: UTXO[];
    outputs: { address: string; amount: number }[];
    changeAddress: string;
    feeRate: number;
    m: number; // Required signatures
    n: number; // Total co-signers
    addressType: MultisigAddressType;
  }): Promise<bitcoin.Psbt> {
    try {
      const { utxos, outputs, changeAddress, feeRate, multisigAddresses, m, n, addressType } = params;

      // 1. Calculate total output amount
      const totalOutputAmount = outputs.reduce((sum, output) => sum + output.amount, 0);

      // 2. Validate amounts
      if (totalOutputAmount <= 0) {
        throw new Error('Total output amount must be greater than 0');
      }

      for (const output of outputs) {
        if (output.amount < DUST_THRESHOLD) {
          throw new Error(
            `Output amount ${output.amount} is below dust threshold (${DUST_THRESHOLD} satoshis)`
          );
        }
      }

      // 3. Validate addresses
      for (const output of outputs) {
        if (!this.addressGenerator.validateAddress(output.address)) {
          throw new Error(`Invalid recipient address: ${output.address}`);
        }
      }

      if (!this.addressGenerator.validateAddress(changeAddress)) {
        throw new Error(`Invalid change address: ${params.changeAddress}`);
      }

      // 4. Select UTXOs
      // For multisig, we need to estimate size differently
      const selected: UTXO[] = [];
      let totalInput = 0;

      // Sort by value (largest first)
      const sortedUtxos = [...utxos].sort((a, b) => b.value - a.value);

      for (const utxo of sortedUtxos) {
        selected.push(utxo);
        totalInput += utxo.value;

        // Estimate size for multisig
        const estimatedSize = this.estimateMultisigSize({
          numInputs: selected.length,
          numOutputs: 2, // recipient + change
          m,
          n,
          addressType,
        });

        const fee = Math.ceil(estimatedSize.virtualSize * feeRate);
        const change = totalInput - totalOutputAmount - fee;

        if (change >= DUST_THRESHOLD) {
          // Build PSBT
          const psbt = new bitcoin.Psbt({ network: this.network });

          // Add multisig inputs
          for (const utxo of selected) {
            await this.addMultisigInputToPSBT(psbt, utxo, multisigAddresses, m, n, addressType);
          }

          // Add outputs
          for (const output of outputs) {
            psbt.addOutput({
              address: output.address,
              value: output.amount,
            });
          }

          // Add change
          psbt.addOutput({
            address: changeAddress,
            value: change,
          });

          return psbt;
        }
      }

      throw new Error('Insufficient funds for multisig transaction');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to build multisig PSBT: ${message}`);
    }
  }

  /**
   * Adds a multisig input to a PSBT with proper redeem/witness scripts
   *
   * @param psbt - PSBT to add input to
   * @param utxo - UTXO to spend
   * @param multisigAddresses - Array of multisig addresses with scripts
   * @param m - Required signatures
   * @param n - Total co-signers
   * @param addressType - Multisig address type
   */
  private async addMultisigInputToPSBT(
    psbt: bitcoin.Psbt,
    utxo: UTXO,
    multisigAddresses: MultisigAddress[],
    m: number,
    n: number,
    addressType: MultisigAddressType
  ): Promise<void> {
    try {
      // Find the MultisigAddress object for this UTXO
      const multisigAddr = multisigAddresses.find((addr) => addr.address === utxo.address);

      if (!multisigAddr) {
        throw new Error(`No multisig address found for UTXO address: ${utxo.address}`);
      }

      const scriptPubKey = Buffer.from(utxo.scriptPubKey, 'hex');

      const inputData: any = {
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
          script: scriptPubKey,
          value: utxo.value,
        },
      };

      // Add appropriate scripts based on address type
      if (addressType === 'p2sh') {
        // P2SH multisig - add redeemScript
        if (!multisigAddr.redeemScript) {
          throw new Error('P2SH multisig requires redeemScript');
        }
        inputData.redeemScript = Buffer.from(multisigAddr.redeemScript, 'hex');
      } else if (addressType === 'p2wsh') {
        // P2WSH multisig - add witnessScript
        if (!multisigAddr.witnessScript) {
          throw new Error('P2WSH multisig requires witnessScript');
        }
        inputData.witnessScript = Buffer.from(multisigAddr.witnessScript, 'hex');
      } else if (addressType === 'p2sh-p2wsh') {
        // P2SH-P2WSH multisig - add both
        if (!multisigAddr.redeemScript || !multisigAddr.witnessScript) {
          throw new Error('P2SH-P2WSH multisig requires both redeemScript and witnessScript');
        }
        inputData.redeemScript = Buffer.from(multisigAddr.redeemScript, 'hex');
        inputData.witnessScript = Buffer.from(multisigAddr.witnessScript, 'hex');
      }

      psbt.addInput(inputData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to add multisig input to PSBT: ${message}`);
    }
  }

  /**
   * Signs a multisig PSBT with one co-signer's key
   *
   * @param psbt - PSBT to sign (can be unsigned or partially signed)
   * @param publicKeys - All co-signer public keys (sorted per BIP67)
   * @param privateKey - This co-signer's private key
   * @returns Updated PSBT with this co-signer's signatures added
   *
   * Note: This adds one signature to each input. The PSBT will need
   * M total signatures before it can be finalized and broadcast.
   */
  async signMultisigPSBT(
    psbt: bitcoin.Psbt,
    publicKeys: Buffer[],
    privateKey: Buffer
  ): Promise<bitcoin.Psbt> {
    try {
      // Sort public keys per BIP67
      const sortedPubkeys = sortPublicKeys(publicKeys);

      // Create ECPair from private key
      const keyPair = ECPair.fromPrivateKey(privateKey, {
        network: this.network,
      });

      // Find which public key index this private key corresponds to
      const ourPubkey = keyPair.publicKey;
      const ourIndex = sortedPubkeys.findIndex((pk) => pk.equals(ourPubkey));

      if (ourIndex === -1) {
        throw new Error('Private key does not correspond to any co-signer public key');
      }

      // Create signer
      const signer = {
        publicKey: Buffer.from(keyPair.publicKey),
        sign: (hash: Buffer) => Buffer.from(keyPair.sign(hash)),
      };

      // Sign all inputs
      for (let i = 0; i < psbt.data.inputs.length; i++) {
        try {
          // Try to sign this input
          psbt.signInput(i, signer);

          // Validate the signature we just added
          const isValid = psbt.validateSignaturesOfInput(i, (pubkey, msghash, signature) => {
            return ECPair.fromPublicKey(pubkey, { network: this.network }).verify(
              msghash,
              signature
            );
          });

          if (!isValid) {
            throw new Error(`Signature validation failed for input ${i}`);
          }
        } catch (error) {
          // If input already signed by this key, skip
          if (error instanceof Error && error.message.includes('already')) {
            continue;
          }
          throw error;
        }
      }

      return psbt;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sign multisig PSBT: ${message}`);
    }
  }

  /**
   * Merges multiple signed PSBTs into one
   *
   * @param psbts - Array of PSBTs (unsigned or partially signed)
   * @returns Merged PSBT with all signatures combined
   *
   * This is used to combine signatures from multiple co-signers.
   * All PSBTs must be for the same transaction.
   */
  static mergePSBTs(psbts: bitcoin.Psbt[]): bitcoin.Psbt {
    try {
      if (psbts.length === 0) {
        throw new Error('No PSBTs provided to merge');
      }

      if (psbts.length === 1) {
        return psbts[0];
      }

      // Start with the first PSBT
      const merged = psbts[0].clone();

      // Merge each subsequent PSBT
      for (let i = 1; i < psbts.length; i++) {
        merged.combine(psbts[i]);
      }

      return merged;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to merge PSBTs: ${message}`);
    }
  }

  /**
   * Counts the number of signatures for each input in a PSBT
   *
   * @param psbt - PSBT to analyze
   * @returns Array of signature counts (one per input)
   */
  static countSignatures(psbt: bitcoin.Psbt): number[] {
    const counts: number[] = [];

    for (let i = 0; i < psbt.data.inputs.length; i++) {
      const input = psbt.data.inputs[i];
      let sigCount = 0;

      // Count partial signatures
      if (input.partialSig) {
        sigCount = input.partialSig.length;
      }

      counts.push(sigCount);
    }

    return counts;
  }

  /**
   * Checks if a multisig PSBT has enough signatures to finalize
   *
   * @param psbt - PSBT to check
   * @param m - Required number of signatures
   * @returns true if all inputs have at least M signatures
   */
  static hasEnoughSignatures(psbt: bitcoin.Psbt, m: number): boolean {
    const counts = this.countSignatures(psbt);
    return counts.every((count) => count >= m);
  }

  /**
   * Finalizes a multisig PSBT once it has enough signatures
   *
   * @param psbt - PSBT with M or more signatures per input
   * @param m - Required signatures
   * @returns Transaction hex ready for broadcast
   *
   * @throws {Error} If not enough signatures or finalization fails
   */
  async finalizeMultisigPSBT(psbt: bitcoin.Psbt, m: number): Promise<string> {
    try {
      // Check if we have enough signatures
      if (!TransactionBuilder.hasEnoughSignatures(psbt, m)) {
        const counts = TransactionBuilder.countSignatures(psbt);
        throw new Error(
          `Not enough signatures. Required: ${m} per input. ` +
            `Current: ${JSON.stringify(counts)}`
        );
      }

      // Finalize all inputs
      psbt.finalizeAllInputs();

      // Extract transaction
      const tx = psbt.extractTransaction();

      return tx.toHex();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to finalize multisig PSBT: ${message}`);
    }
  }

  /**
   * Estimates the size of a multisig transaction
   *
   * @param params - Transaction parameters
   * @returns Size estimate
   *
   * Multisig transactions are larger than single-sig due to multiple signatures
   */
  estimateMultisigSize(params: {
    numInputs: number;
    numOutputs: number;
    m: number; // Required signatures
    n: number; // Total co-signers
    addressType: MultisigAddressType;
  }): SizeEstimate {
    const { numInputs, numOutputs, m, n, addressType } = params;

    // Base transaction overhead
    let baseSize = 10;

    // Multisig always has witness data for P2WSH and P2SH-P2WSH
    const hasSegWit = addressType !== 'p2sh';
    if (hasSegWit) {
      baseSize += 2; // marker + flag
    }

    // Calculate input sizes
    let totalInputSize = 0;
    let totalWitnessSize = 0;

    for (let i = 0; i < numInputs; i++) {
      if (addressType === 'p2sh') {
        // P2SH multisig
        // txid (32) + vout (4) + scriptSig length (varies) + sequence (4)
        // scriptSig contains signatures + redeemScript
        // Each signature: ~73 bytes, redeemScript: ~(m+n)*34 bytes
        const scriptSigSize = m * 73 + (n * 34 + 3); // rough estimate
        totalInputSize += 32 + 4 + 1 + scriptSigSize + 4;
      } else if (addressType === 'p2wsh') {
        // P2WSH multisig
        // Base: txid (32) + vout (4) + empty scriptSig (1) + sequence (4)
        totalInputSize += 41;
        // Witness: stack items + signatures + witnessScript
        totalWitnessSize += m * 73 + (n * 34 + 3) + 8; // rough estimate
      } else if (addressType === 'p2sh-p2wsh') {
        // P2SH-P2WSH multisig
        // Base: txid (32) + vout (4) + scriptSig (34 for redeemScript) + sequence (4)
        totalInputSize += 32 + 4 + 34 + 4;
        // Witness: similar to P2WSH
        totalWitnessSize += m * 73 + (n * 34 + 3) + 8;
      }
    }

    // Calculate output sizes
    const outputSize = hasSegWit ? 43 : 32; // Multisig outputs are larger
    const totalOutputSize = numOutputs * outputSize;

    // Calculate total sizes
    const totalBaseSize = baseSize + totalInputSize + totalOutputSize;
    const totalSize = totalBaseSize + totalWitnessSize;

    // Calculate weight and virtual size
    const weight = totalBaseSize * 3 + totalSize;
    const virtualSize = Math.ceil(weight / 4);

    return {
      size: totalSize,
      virtualSize: hasSegWit ? virtualSize : totalSize,
    };
  }

  /**
   * Shuffle UTXOs using Fisher-Yates algorithm with cryptographically secure randomness
   * This prevents wallet fingerprinting through deterministic UTXO selection
   *
   * @param utxos - Array of UTXOs to shuffle
   * @returns Shuffled array of UTXOs
   */
  private shuffleUtxos(utxos: SelectedUTXO[]): SelectedUTXO[] {
    const shuffled = [...utxos];

    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      // Use crypto.getRandomValues for cryptographically secure randomness
      const randomBytes = new Uint32Array(1);
      crypto.getRandomValues(randomBytes);

      // Generate random index between 0 and i (inclusive)
      const j = randomBytes[0] % (i + 1);

      // Swap elements
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }
}
