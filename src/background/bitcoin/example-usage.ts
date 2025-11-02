/**
 * TransactionBuilder Usage Example
 *
 * This file demonstrates how to use the TransactionBuilder class
 * to create, sign, and broadcast Bitcoin transactions.
 *
 * Note: This is for reference only. In production, these operations
 * would be integrated into the wallet service worker.
 */

import { TransactionBuilder } from './TransactionBuilder';
import { HDWallet } from '../wallet/HDWallet';
import { KeyManager } from '../wallet/KeyManager';
import { AddressGenerator } from '../wallet/AddressGenerator';
import type { UTXO, AddressType } from '../../shared/types';

/**
 * Example: Build and sign a transaction
 *
 * This example demonstrates the complete flow:
 * 1. Set up wallet with mnemonic
 * 2. Prepare UTXO data
 * 3. Build transaction
 * 4. Sign transaction
 * 5. Get transaction hex for broadcast
 */
async function buildTransactionExample() {
  // 1. Set up wallet (in production, this would come from encrypted storage)
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  const seed = KeyManager.mnemonicToSeed(mnemonic);
  const wallet = new HDWallet(seed, 'testnet');
  const addressGen = new AddressGenerator('testnet');

  // 2. Set up transaction builder
  const txBuilder = new TransactionBuilder('testnet');

  // 3. Mock UTXOs (in production, fetch from Blockstream API)
  const utxos: UTXO[] = [
    {
      txid: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      vout: 0,
      value: 100000, // 0.001 BTC
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // Example testnet address
      scriptPubKey: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
      confirmations: 6,
    },
    {
      txid: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1',
      vout: 1,
      value: 50000, // 0.0005 BTC
      address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
      scriptPubKey: '00201863143c14c5166804bd19203356da136c985678cd4d27a1b8c6329604903262',
      confirmations: 10,
    },
  ];

  // 4. Define recipient and amount
  const recipientAddress = 'tb1q9c0zqkc5k0zqkc5k0zqkc5k0zqkc5k0zqkc5k0'; // Example
  const amountToSend = 40000; // 0.0004 BTC

  // 5. Get change address (in production, generate new address from wallet)
  const changeAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'; // Example

  // 6. Get current fee rate (in production, fetch from API)
  const feeRate = 5; // 5 sat/vB

  // 7. Helper functions for transaction builder

  // Get private key for a derivation path
  const getPrivateKey = (derivationPath: string): Buffer => {
    const node = wallet.derivePath(derivationPath);
    if (!node.privateKey) {
      throw new Error('Failed to derive private key');
    }
    return node.privateKey;
  };

  // Get address type from address string
  const getAddressType = (address: string): AddressType => {
    const type = addressGen.getAddressType(address);
    if (!type) {
      throw new Error(`Unknown address type for ${address}`);
    }
    return type;
  };

  // Get derivation path for an address
  // In production, this would look up the path from wallet storage
  const getDerivationPath = (address: string): string => {
    // Mock implementation - in production, look up from wallet
    // This would be stored when the address was generated
    return "m/84'/1'/0'/0/0"; // Example: first Native SegWit receive address
  };

  try {
    // 8. Build and sign transaction
    const result = await txBuilder.buildTransaction({
      utxos,
      outputs: [
        {
          address: recipientAddress,
          amount: amountToSend,
        },
      ],
      changeAddress,
      feeRate,
      getPrivateKey,
      getAddressType,
      getDerivationPath,
    });

    // 9. Transaction is ready to broadcast
    console.log('Transaction built successfully!');
    console.log('Transaction ID:', result.txid);
    console.log('Transaction Hex:', result.txHex);
    console.log('Fee:', result.fee, 'satoshis');
    console.log('Size:', result.size, 'bytes');
    console.log('Virtual Size:', result.virtualSize, 'vBytes');
    console.log('Inputs used:', result.inputs.length);
    console.log('Outputs:', result.outputs.length);

    // 10. Broadcast transaction (pseudo-code)
    // const broadcastResult = await blockstreamClient.broadcastTransaction(result.txHex);
    // console.log('Transaction broadcast:', broadcastResult.txid);

    return result;
  } catch (error) {
    console.error('Transaction building failed:', error);
    throw error;
  }
}

/**
 * Example: Estimate transaction fee before building
 */
function estimateFeeExample() {
  const txBuilder = new TransactionBuilder('testnet');

  // Estimate fee for 2 inputs, 2 outputs (recipient + change)
  // All inputs are Native SegWit
  const fee = txBuilder.estimateFee({
    numInputs: 2,
    numOutputs: 2,
    inputTypes: ['native-segwit', 'native-segwit'],
    feeRate: 5, // 5 sat/vB
  });

  console.log('Estimated fee:', fee, 'satoshis');
  // Expected: ~208 vBytes * 5 sat/vB = ~1040 satoshis

  return fee;
}

/**
 * Example: Estimate transaction size
 */
function estimateSizeExample() {
  const txBuilder = new TransactionBuilder('testnet');

  // Estimate size for different input types
  const sizeNativeSegWit = txBuilder.estimateSize({
    numInputs: 1,
    numOutputs: 2,
    inputTypes: ['native-segwit'],
  });

  const sizeSegWit = txBuilder.estimateSize({
    numInputs: 1,
    numOutputs: 2,
    inputTypes: ['segwit'],
  });

  const sizeLegacy = txBuilder.estimateSize({
    numInputs: 1,
    numOutputs: 2,
    inputTypes: ['legacy'],
  });

  console.log('Native SegWit:', sizeNativeSegWit.virtualSize, 'vBytes');
  console.log('SegWit (P2SH):', sizeSegWit.virtualSize, 'vBytes');
  console.log('Legacy:', sizeLegacy.virtualSize, 'vBytes');

  // Expected results (approximate):
  // Native SegWit: ~140 vBytes
  // SegWit (P2SH): ~165 vBytes
  // Legacy: ~226 bytes

  return { sizeNativeSegWit, sizeSegWit, sizeLegacy };
}

/**
 * Example: Handle insufficient funds scenario
 */
async function insufficientFundsExample() {
  const txBuilder = new TransactionBuilder('testnet');

  // Mock: Only 10,000 satoshis available
  const utxos: UTXO[] = [
    {
      txid: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      vout: 0,
      value: 10000,
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      scriptPubKey: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
      confirmations: 6,
    },
  ];

  // Try to send 50,000 satoshis (more than available)
  try {
    const selection = txBuilder.selectUTXOs({
      utxos: utxos.map((u) => ({
        ...u,
        derivationPath: "m/84'/1'/0'/0/0",
        addressType: 'native-segwit' as AddressType,
      })),
      targetAmount: 50000,
      feeRate: 5,
      changeAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    });

    console.log('Selection:', selection);
  } catch (error) {
    console.error('Expected error:', error);
    // Should throw: "Insufficient funds. Have 10000 satoshis, need 50000 satoshis plus fees"
  }
}

/**
 * Example: Dust handling
 */
function dustHandlingExample() {
  const txBuilder = new TransactionBuilder('testnet');

  // Mock: UTXO with 1,000 satoshis
  const utxos = [
    {
      txid: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      vout: 0,
      value: 1000,
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      scriptPubKey: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
      confirmations: 6,
      derivationPath: "m/84'/1'/0'/0/0",
      addressType: 'native-segwit' as AddressType,
    },
  ];

  // Send 850 satoshis at 1 sat/vB
  // Change would be: 1000 - 850 - ~109 = ~41 satoshis (below dust limit of 546)
  // Should add change to fee instead
  const selection = txBuilder.selectUTXOs({
    utxos,
    targetAmount: 850,
    feeRate: 1,
    changeAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  });

  console.log('Selection with dust handling:');
  console.log('Total input:', selection.totalInput);
  console.log('Fee:', selection.fee);
  console.log('Change:', selection.change);
  // Change should be 0 (added to fee)
  // Fee should be higher than estimated

  return selection;
}

// Export examples for testing
export {
  buildTransactionExample,
  estimateFeeExample,
  estimateSizeExample,
  insufficientFundsExample,
  dustHandlingExample,
};
