/**
 * Test Data Factories
 *
 * Factory functions for creating mock data objects used in tests.
 * These factories provide realistic, type-safe test data with sensible defaults
 * that can be overridden as needed.
 *
 * Usage:
 *   const utxo = createMockUTXO({ value: 100000 });
 *   const tx = createMockTransaction({ confirmations: 6 });
 */

import {
  Account,
  Address,
  Transaction,
  TransactionInput,
  TransactionOutput,
  UTXO,
  Balance,
  StoredWallet,
  WalletSettings,
  BitcoinPrice,
  AddressType,
} from '../../shared/types';
import {
  TEST_ADDRESS_NATIVE_SEGWIT_1,
  TEST_ADDRESS_NATIVE_SEGWIT_2,
  TEST_TXID_1,
  TEST_TXID_2,
  SATOSHI_VALUES,
  TIMESTAMPS,
  BLOCK_HEIGHTS,
  DERIVATION_PATHS,
  getTestDerivationPath,
} from './testConstants';

// =============================================================================
// Address Factories
// =============================================================================

/**
 * Create a mock Address object
 */
export function createMockAddress(overrides: Partial<Address> = {}): Address {
  return {
    address: TEST_ADDRESS_NATIVE_SEGWIT_1,
    derivationPath: DERIVATION_PATHS.NATIVE_SEGWIT_EXTERNAL_0,
    index: 0,
    isChange: false,
    used: false,
    ...overrides,
  };
}

/**
 * Create multiple mock addresses
 */
export function createMockAddresses(count: number, overrides: Partial<Address> = {}): Address[] {
  return Array.from({ length: count }, (_, i) =>
    createMockAddress({
      index: i,
      derivationPath: getTestDerivationPath('native-segwit', 0, 0, i),
      ...overrides,
    })
  );
}

// =============================================================================
// Account Factories
// =============================================================================

/**
 * Create a mock Account object
 */
export function createMockAccount(overrides: Partial<Account> = {}): Account {
  return {
    index: 0,
    name: 'Account 1',
    accountType: 'single',
    addressType: 'native-segwit',
    externalIndex: 0,
    internalIndex: 0,
    addresses: [],
    ...overrides,
  };
}

/**
 * Create multiple mock accounts
 */
export function createMockAccounts(count: number): Account[] {
  const addressTypes: AddressType[] = ['legacy', 'segwit', 'native-segwit'];

  return Array.from({ length: count }, (_, i) =>
    createMockAccount({
      index: i,
      name: `Account ${i + 1}`,
      addressType: addressTypes[i % addressTypes.length],
    })
  );
}

// =============================================================================
// UTXO Factories
// =============================================================================

/**
 * Create a mock UTXO object
 */
export function createMockUTXO(overrides: Partial<UTXO> = {}): UTXO {
  return {
    txid: TEST_TXID_1,
    vout: 0,
    value: SATOSHI_VALUES.MEDIUM,
    address: TEST_ADDRESS_NATIVE_SEGWIT_1,
    scriptPubKey: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
    confirmations: 6,
    ...overrides,
  };
}

/**
 * Create multiple mock UTXOs with varying values
 */
export function createMockUTXOs(count: number, baseValue: number = SATOSHI_VALUES.MEDIUM): UTXO[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUTXO({
      txid: `${TEST_TXID_1.slice(0, -2)}${i.toString().padStart(2, '0')}`,
      vout: i,
      value: baseValue + i * 10000,
      confirmations: i + 1,
    })
  );
}

/**
 * Create confirmed UTXOs (6+ confirmations)
 */
export function createConfirmedUTXOs(count: number, value: number = SATOSHI_VALUES.MEDIUM): UTXO[] {
  return createMockUTXOs(count, value).map(utxo => ({
    ...utxo,
    confirmations: 6,
  }));
}

/**
 * Create unconfirmed UTXOs (0 confirmations)
 */
export function createUnconfirmedUTXOs(count: number, value: number = SATOSHI_VALUES.MEDIUM): UTXO[] {
  return createMockUTXOs(count, value).map(utxo => ({
    ...utxo,
    confirmations: 0,
  }));
}

// =============================================================================
// Transaction Input/Output Factories
// =============================================================================

/**
 * Create a mock TransactionInput object
 */
export function createMockTransactionInput(overrides: Partial<TransactionInput> = {}): TransactionInput {
  return {
    txid: TEST_TXID_1,
    vout: 0,
    address: TEST_ADDRESS_NATIVE_SEGWIT_1,
    value: SATOSHI_VALUES.MEDIUM,
    ...overrides,
  };
}

/**
 * Create a mock TransactionOutput object
 */
export function createMockTransactionOutput(overrides: Partial<TransactionOutput> = {}): TransactionOutput {
  return {
    address: TEST_ADDRESS_NATIVE_SEGWIT_2,
    value: SATOSHI_VALUES.SMALL,
    scriptPubKey: '0014751e76e8199196d454941c45d1b3a323f1433bd6',
    ...overrides,
  };
}

// =============================================================================
// Transaction Factories
// =============================================================================

/**
 * Create a mock Transaction object
 */
export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    txid: TEST_TXID_1,
    confirmations: 6,
    timestamp: TIMESTAMPS.RECENT,
    value: SATOSHI_VALUES.SMALL,
    fee: 1000,
    inputs: [createMockTransactionInput()],
    outputs: [createMockTransactionOutput()],
    ...overrides,
  };
}

/**
 * Create a received transaction (positive value)
 */
export function createReceivedTransaction(value: number = SATOSHI_VALUES.MEDIUM): Transaction {
  return createMockTransaction({
    value: Math.abs(value),
    inputs: [
      createMockTransactionInput({
        address: TEST_ADDRESS_NATIVE_SEGWIT_2, // From someone else
      }),
    ],
    outputs: [
      createMockTransactionOutput({
        address: TEST_ADDRESS_NATIVE_SEGWIT_1, // To our address
        value,
      }),
    ],
  });
}

/**
 * Create a sent transaction (negative value)
 */
export function createSentTransaction(value: number = SATOSHI_VALUES.MEDIUM): Transaction {
  return createMockTransaction({
    value: -Math.abs(value),
    inputs: [
      createMockTransactionInput({
        address: TEST_ADDRESS_NATIVE_SEGWIT_1, // From our address
      }),
    ],
    outputs: [
      createMockTransactionOutput({
        address: TEST_ADDRESS_NATIVE_SEGWIT_2, // To someone else
        value,
      }),
    ],
  });
}

/**
 * Create an unconfirmed transaction
 */
export function createUnconfirmedTransaction(value: number = SATOSHI_VALUES.SMALL): Transaction {
  return createMockTransaction({
    confirmations: 0,
    value,
  });
}

/**
 * Create multiple mock transactions
 */
export function createMockTransactions(count: number): Transaction[] {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      txid: `${TEST_TXID_1.slice(0, -2)}${i.toString().padStart(2, '0')}`,
      confirmations: i + 1,
      timestamp: TIMESTAMPS.RECENT + i * 3600, // 1 hour apart
      value: i % 2 === 0 ? SATOSHI_VALUES.SMALL : -SATOSHI_VALUES.SMALL, // Alternate between received/sent
    })
  );
}

// =============================================================================
// Balance Factories
// =============================================================================

/**
 * Create a mock Balance object
 */
export function createMockBalance(overrides: Partial<Balance> = {}): Balance {
  return {
    confirmed: SATOSHI_VALUES.LARGE,
    unconfirmed: 0,
    ...overrides,
  };
}

/**
 * Create a zero balance
 */
export function createZeroBalance(): Balance {
  return {
    confirmed: 0,
    unconfirmed: 0,
  };
}

/**
 * Create a balance with unconfirmed funds
 */
export function createBalanceWithUnconfirmed(
  confirmed: number = SATOSHI_VALUES.LARGE,
  unconfirmed: number = SATOSHI_VALUES.SMALL
): Balance {
  return {
    confirmed,
    unconfirmed,
  };
}

// =============================================================================
// Wallet Factories
// =============================================================================

/**
 * Create mock WalletSettings
 */
export function createMockWalletSettings(overrides: Partial<WalletSettings> = {}): WalletSettings {
  return {
    autoLockMinutes: 15,
    network: 'testnet',
    ...overrides,
  };
}

/**
 * Create a mock StoredWallet object
 */
export function createMockStoredWallet(overrides: Partial<StoredWallet> = {}): StoredWallet {
  return {
    version: 1,
    encryptedSeed: 'mock_encrypted_seed_base64_string',
    salt: 'mock_salt_base64_string',
    iv: 'mock_iv_base64_string',
    accounts: [createMockAccount()],
    settings: createMockWalletSettings(),
    ...overrides,
  };
}

// =============================================================================
// Price Factories
// =============================================================================

/**
 * Create a mock BitcoinPrice object
 */
export function createMockBitcoinPrice(overrides: Partial<BitcoinPrice> = {}): BitcoinPrice {
  return {
    usd: 65432.10,
    lastUpdated: Date.now(),
    ...overrides,
  };
}

/**
 * Create an expired price (cache expired)
 */
export function createExpiredBitcoinPrice(ageMinutes: number = 10): BitcoinPrice {
  return {
    usd: 60000.0,
    lastUpdated: Date.now() - ageMinutes * 60 * 1000,
  };
}

// =============================================================================
// Blockstream API Response Factories
// =============================================================================

/**
 * Create mock Blockstream address info response
 */
export function createMockBlockstreamAddressInfo(address: string, confirmed: number, unconfirmed: number = 0) {
  return {
    address,
    chain_stats: {
      funded_txo_count: 1,
      funded_txo_sum: confirmed,
      spent_txo_count: 0,
      spent_txo_sum: 0,
      tx_count: 1,
    },
    mempool_stats: {
      funded_txo_count: unconfirmed > 0 ? 1 : 0,
      funded_txo_sum: unconfirmed,
      spent_txo_count: 0,
      spent_txo_sum: 0,
      tx_count: unconfirmed > 0 ? 1 : 0,
    },
  };
}

/**
 * Create mock Blockstream UTXO response
 */
export function createMockBlockstreamUTXO(txid: string, vout: number, value: number, confirmed: boolean = true) {
  return {
    txid,
    vout,
    value,
    status: confirmed
      ? {
          confirmed: true,
          block_height: BLOCK_HEIGHTS.RECENT,
          block_hash: '0000000000000001234567890abcdef0000000000000001234567890abcdef',
          block_time: TIMESTAMPS.RECENT,
        }
      : {
          confirmed: false,
        },
  };
}

/**
 * Create mock Blockstream transaction response
 */
export function createMockBlockstreamTransaction(
  txid: string,
  fromAddress: string,
  toAddress: string,
  value: number,
  fee: number = 1000,
  confirmed: boolean = true
) {
  return {
    txid,
    version: 2,
    locktime: 0,
    vin: [
      {
        txid: TEST_TXID_2,
        vout: 0,
        prevout: {
          scriptpubkey: '0014...',
          scriptpubkey_asm: 'OP_0 OP_PUSHBYTES_20 ...',
          scriptpubkey_type: 'v0_p2wpkh',
          scriptpubkey_address: fromAddress,
          value: value + fee,
        },
        scriptsig: '',
        scriptsig_asm: '',
        witness: ['304402...', '03...'],
        is_coinbase: false,
        sequence: 4294967293,
      },
    ],
    vout: [
      {
        scriptpubkey: '0014...',
        scriptpubkey_asm: 'OP_0 OP_PUSHBYTES_20 ...',
        scriptpubkey_type: 'v0_p2wpkh',
        scriptpubkey_address: toAddress,
        value,
      },
    ],
    size: 234,
    weight: 561,
    fee,
    status: confirmed
      ? {
          confirmed: true,
          block_height: BLOCK_HEIGHTS.RECENT,
          block_hash: '0000000000000001234567890abcdef0000000000000001234567890abcdef',
          block_time: TIMESTAMPS.RECENT,
        }
      : {
          confirmed: false,
        },
  };
}

/**
 * Create mock CoinGecko price response
 */
export function createMockCoinGeckoResponse(usdPrice: number = 65432.10) {
  return {
    bitcoin: {
      usd: usdPrice,
    },
  };
}

// =============================================================================
// Chrome Message Factories
// =============================================================================

/**
 * Create a mock successful message response
 */
export function createSuccessResponse<T>(data: T) {
  return {
    success: true,
    data,
  };
}

/**
 * Create a mock error message response
 */
export function createErrorResponse(error: string) {
  return {
    success: false,
    error,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a batch of UTXOs with specific total value
 * Useful for testing UTXO selection algorithms
 */
export function createUTXOsWithTotalValue(totalValue: number, utxoCount: number = 3): UTXO[] {
  const valuePerUTXO = Math.floor(totalValue / utxoCount);
  const remainder = totalValue % utxoCount;

  return Array.from({ length: utxoCount }, (_, i) =>
    createMockUTXO({
      txid: `${TEST_TXID_1.slice(0, -2)}${i.toString().padStart(2, '0')}`,
      vout: i,
      value: valuePerUTXO + (i === utxoCount - 1 ? remainder : 0), // Add remainder to last UTXO
      confirmations: 6,
    })
  );
}

/**
 * Create insufficient UTXOs (total value less than needed)
 */
export function createInsufficientUTXOs(targetValue: number): UTXO[] {
  const insufficientValue = Math.floor(targetValue * 0.5); // 50% of target
  return [
    createMockUTXO({
      value: insufficientValue,
      confirmations: 6,
    }),
  ];
}
