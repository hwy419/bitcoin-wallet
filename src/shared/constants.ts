import * as bitcoin from 'bitcoinjs-lib';

// Bitcoin networks
export const NETWORKS = {
  testnet: bitcoin.networks.testnet,
  mainnet: bitcoin.networks.bitcoin,
};

// BIP44 coin types
export const COIN_TYPES = {
  mainnet: 0,
  testnet: 1,
};

// BIP44 derivation path templates
export const DERIVATION_PATHS = {
  legacy: (coinType: number, account: number, change: number, index: number) =>
    `m/44'/${coinType}'/${account}'/${change}/${index}`,
  segwit: (coinType: number, account: number, change: number, index: number) =>
    `m/49'/${coinType}'/${account}'/${change}/${index}`,
  'native-segwit': (coinType: number, account: number, change: number, index: number) =>
    `m/84'/${coinType}'/${account}'/${change}/${index}`,
};

// Blockstream API endpoints
export const API_BASE_URL = {
  testnet: 'https://blockstream.info/testnet/api',
  mainnet: 'https://blockstream.info/api',
};

// Wallet settings
export const DEFAULT_AUTO_LOCK_MINUTES = 15;
export const DEFAULT_NETWORK = 'testnet';

// Encryption settings
export const PBKDF2_ITERATIONS = 100000;
export const PBKDF2_KEY_LENGTH = 32;
export const AES_ALGORITHM = 'AES-GCM';
export const AES_KEY_LENGTH = 256;

// Transaction settings
export const DUST_THRESHOLD = 546; // satoshis
export const MIN_RELAY_FEE = 1; // sat/vB

// Address gap limit (BIP44)
export const GAP_LIMIT = 20;
