/**
 * Test Constants
 *
 * Shared test data used across multiple test files including:
 * - BIP39 test mnemonics
 * - Test addresses for all address types
 * - Test private keys
 * - Test transaction IDs
 * - Common test values
 *
 * IMPORTANT: These are TEST VALUES ONLY - never use in production
 */

import * as bip39 from 'bip39';

// =============================================================================
// BIP39 Mnemonics (from official BIP39 test vectors)
// =============================================================================

/**
 * Standard 12-word mnemonic from BIP39 test vectors
 * Used for deterministic testing
 */
export const TEST_MNEMONIC_12 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

/**
 * Alternative 12-word mnemonic for variety
 */
export const TEST_MNEMONIC_12_ALT = 'legal winner thank year wave sausage worth useful legal winner thank yellow';

/**
 * 24-word mnemonic for testing longer seed phrases
 */
export const TEST_MNEMONIC_24 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art';

// Derive test seeds
export const TEST_SEED_12 = bip39.mnemonicToSeedSync(TEST_MNEMONIC_12);
export const TEST_SEED_12_ALT = bip39.mnemonicToSeedSync(TEST_MNEMONIC_12_ALT);
export const TEST_SEED_24 = bip39.mnemonicToSeedSync(TEST_MNEMONIC_24);

// =============================================================================
// Test Addresses (Bitcoin Testnet)
// =============================================================================

/**
 * Testnet Legacy (P2PKH) addresses
 * Start with 'm' or 'n'
 */
export const TEST_ADDRESS_LEGACY_1 = 'n1LKejAadN6hg2FrBXoU1KrwX4uK16mco9';
export const TEST_ADDRESS_LEGACY_2 = 'mkHS9ne12qx9pS9VojpwU5xtRd4T7X7ZUt';
export const TEST_ADDRESS_LEGACY_3 = 'mzBc4XEFSdzCDkonDbTOpFjLSyQNWkdh6S';

/**
 * Testnet SegWit (P2SH-P2WPKH) addresses
 * Start with '2'
 */
export const TEST_ADDRESS_SEGWIT_1 = '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc';
export const TEST_ADDRESS_SEGWIT_2 = '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF';
export const TEST_ADDRESS_SEGWIT_3 = '2NAZJDtFxKqXdRAeFvdU2KK8yQ9xQjw8MLu';

/**
 * Testnet Native SegWit (P2WPKH, Bech32) addresses
 * Start with 'tb1'
 */
export const TEST_ADDRESS_NATIVE_SEGWIT_1 = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
export const TEST_ADDRESS_NATIVE_SEGWIT_2 = 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7';
export const TEST_ADDRESS_NATIVE_SEGWIT_3 = 'tb1q9pvjd5667v7lse93azvyr0nmvva9f2j3zddqgr';

/**
 * Invalid addresses for testing validation
 */
export const TEST_ADDRESS_INVALID_CHECKSUM = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzxx';
export const TEST_ADDRESS_INVALID_PREFIX = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'; // Mainnet address
export const TEST_ADDRESS_MALFORMED = 'not_a_bitcoin_address';

// =============================================================================
// Test Transaction IDs
// =============================================================================

export const TEST_TXID_1 = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';
export const TEST_TXID_2 = 'def456abc123def456abc123def456abc123def456abc123def456abc123def4';
export const TEST_TXID_3 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

// =============================================================================
// Test Passwords
// =============================================================================

export const TEST_PASSWORD = 'TestPassword123'; // Default test password
export const TEST_PASSWORD_WEAK = 'test123';
export const TEST_PASSWORD_STRONG = 'MySecureP@ssw0rd!2024';
export const TEST_PASSWORD_UNICODE = 'パスワード123!';
export const TEST_PASSWORD_EMPTY = '';

// =============================================================================
// Common Test Values
// =============================================================================

/**
 * Satoshi amounts for testing
 * 1 BTC = 100,000,000 satoshis
 */
export const SATOSHI_VALUES = {
  DUST: 546, // Dust threshold
  SMALL: 10000, // 0.0001 BTC
  MEDIUM: 100000, // 0.001 BTC
  LARGE: 10000000, // 0.1 BTC
  ONE_BTC: 100000000, // 1 BTC
  TEN_BTC: 1000000000, // 10 BTC
};

/**
 * Fee rates in satoshis per byte
 */
export const FEE_RATES = {
  SLOW: 1,
  MEDIUM: 5,
  FAST: 10,
  VERY_FAST: 20,
};

/**
 * Block heights for testing confirmations
 */
export const BLOCK_HEIGHTS = {
  GENESIS: 0,
  RECENT: 2000000,
  CURRENT: 2500000,
};

/**
 * Timestamps for testing (Unix timestamps in seconds)
 */
export const TIMESTAMPS = {
  PAST: 1640000000, // 2021-12-20
  RECENT: 1700000000, // 2023-11-14
  NOW: 1730000000, // 2024-10-27
};

// =============================================================================
// BIP32 Derivation Paths
// =============================================================================

export const DERIVATION_PATHS = {
  // Legacy (P2PKH) - BIP44
  LEGACY_MASTER: "m/44'/1'/0'",
  LEGACY_EXTERNAL_0: "m/44'/1'/0'/0/0",
  LEGACY_EXTERNAL_1: "m/44'/1'/0'/0/1",
  LEGACY_CHANGE_0: "m/44'/1'/0'/1/0",

  // SegWit (P2SH-P2WPKH) - BIP49
  SEGWIT_MASTER: "m/49'/1'/0'",
  SEGWIT_EXTERNAL_0: "m/49'/1'/0'/0/0",
  SEGWIT_EXTERNAL_1: "m/49'/1'/0'/0/1",
  SEGWIT_CHANGE_0: "m/49'/1'/0'/1/0",

  // Native SegWit (P2WPKH) - BIP84
  NATIVE_SEGWIT_MASTER: "m/84'/1'/0'",
  NATIVE_SEGWIT_EXTERNAL_0: "m/84'/1'/0'/0/0",
  NATIVE_SEGWIT_EXTERNAL_1: "m/84'/1'/0'/0/1",
  NATIVE_SEGWIT_CHANGE_0: "m/84'/1'/0'/1/0",

  // Mainnet paths (coin type 0)
  MAINNET_LEGACY: "m/44'/0'/0'/0/0",
  MAINNET_SEGWIT: "m/49'/0'/0'/0/0",
  MAINNET_NATIVE_SEGWIT: "m/84'/0'/0'/0/0",
};

// =============================================================================
// Test Networks
// =============================================================================

export const NETWORKS = {
  TESTNET: 'testnet' as const,
  MAINNET: 'mainnet' as const,
};

// =============================================================================
// Mock API Responses
// =============================================================================

/**
 * Mock Blockstream API response for address info
 */
export const MOCK_ADDRESS_INFO = {
  address: TEST_ADDRESS_NATIVE_SEGWIT_1,
  chain_stats: {
    funded_txo_count: 5,
    funded_txo_sum: 1000000, // 0.01 BTC
    spent_txo_count: 2,
    spent_txo_sum: 400000, // 0.004 BTC
    tx_count: 7,
  },
  mempool_stats: {
    funded_txo_count: 1,
    funded_txo_sum: 100000, // 0.001 BTC
    spent_txo_count: 0,
    spent_txo_sum: 0,
    tx_count: 1,
  },
};

/**
 * Mock CoinGecko API response for BTC price
 */
export const MOCK_COINGECKO_RESPONSE = {
  bitcoin: {
    usd: 65432.10,
  },
};

// =============================================================================
// Chrome Extension Mock Data
// =============================================================================

/**
 * Mock wallet state
 */
export const MOCK_WALLET_STATE = {
  isUnlocked: true,
  hasWallet: true,
  accounts: [],
  currentAccountIndex: 0,
  network: NETWORKS.TESTNET,
};

/**
 * Mock account names
 */
export const ACCOUNT_NAMES = [
  'Main Account',
  'Savings',
  'Trading',
  'Test Account',
];

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Generate a test derivation path for a given address type and indices
 */
export function getTestDerivationPath(
  addressType: 'legacy' | 'segwit' | 'native-segwit',
  accountIndex: number,
  change: 0 | 1,
  addressIndex: number,
  network: 'testnet' | 'mainnet' = 'testnet'
): string {
  const coinType = network === 'testnet' ? 1 : 0;
  let purpose: number;

  switch (addressType) {
    case 'legacy':
      purpose = 44;
      break;
    case 'segwit':
      purpose = 49;
      break;
    case 'native-segwit':
      purpose = 84;
      break;
  }

  return `m/${purpose}'/${coinType}'/${accountIndex}'/${change}/${addressIndex}`;
}

/**
 * Convert BTC to satoshis
 */
export function btcToSatoshis(btc: number): number {
  return Math.round(btc * 100000000);
}

/**
 * Convert satoshis to BTC
 */
export function satoshisToBtc(satoshis: number): number {
  return satoshis / 100000000;
}
