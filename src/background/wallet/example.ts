/**
 * Example: Bitcoin HD Wallet Integration
 *
 * This file demonstrates how to use KeyManager, HDWallet, and AddressGenerator
 * together to create a complete Bitcoin wallet flow.
 *
 * NOTE: This is for reference/testing only - NOT part of production code.
 */

import { KeyManager } from './KeyManager';
import { HDWallet } from './HDWallet';
import { AddressGenerator } from './AddressGenerator';

/**
 * Example 1: Create a new wallet and generate addresses
 */
export function exampleCreateWallet() {
  console.log('=== Example: Create New Wallet ===\n');

  // Step 1: Generate a new 12-word mnemonic
  const mnemonic = KeyManager.generateMnemonic(128);
  console.log('Mnemonic (12 words):', mnemonic);
  console.log('⚠️  BACKUP THIS MNEMONIC SECURELY!\n');

  // Step 2: Validate the mnemonic (should always be true for generated)
  const isValid = KeyManager.validateMnemonic(mnemonic);
  console.log('Mnemonic valid:', isValid, '\n');

  // Step 3: Convert mnemonic to seed
  const seed = KeyManager.mnemonicToSeed(mnemonic);
  console.log('Seed (hex):', seed.toString('hex'));
  console.log('Seed length:', seed.length, 'bytes\n');

  // Step 4: Create HD wallet from seed
  const wallet = new HDWallet(seed, 'testnet');
  console.log('HD Wallet created for testnet\n');

  // Step 5: Create address generator
  const addressGen = new AddressGenerator('testnet');

  // Step 6: Generate addresses for all three types
  console.log('=== Address Generation ===\n');

  // Legacy (P2PKH) - Account 0, first receiving address
  const legacyNode = wallet.deriveAddressNode('legacy', 0, 0, 0);
  const legacyAddress = addressGen.generateAddress(legacyNode, 'legacy');
  console.log('Legacy Address (P2PKH):');
  console.log('  Path: m/44\'/1\'/0\'/0/0');
  console.log('  Address:', legacyAddress);
  console.log('  Should start with: m or n (testnet)\n');

  // SegWit (P2SH-P2WPKH) - Account 0, first receiving address
  const segwitNode = wallet.deriveAddressNode('segwit', 0, 0, 0);
  const segwitAddress = addressGen.generateAddress(segwitNode, 'segwit');
  console.log('SegWit Address (P2SH-P2WPKH):');
  console.log('  Path: m/49\'/1\'/0\'/0/0');
  console.log('  Address:', segwitAddress);
  console.log('  Should start with: 2 (testnet)\n');

  // Native SegWit (P2WPKH) - Account 0, first receiving address
  const nativeSegwitNode = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
  const nativeSegwitAddress = addressGen.generateAddress(nativeSegwitNode, 'native-segwit');
  console.log('Native SegWit Address (P2WPKH):');
  console.log('  Path: m/84\'/1\'/0\'/0/0');
  console.log('  Address:', nativeSegwitAddress);
  console.log('  Should start with: tb1 (testnet)\n');

  // Step 7: Generate change addresses
  console.log('=== Change Addresses ===\n');

  const changeNode = wallet.deriveAddressNode('native-segwit', 0, 1, 0);
  const changeAddress = addressGen.generateAddress(changeNode, 'native-segwit');
  console.log('First change address (Native SegWit):');
  console.log('  Path: m/84\'/1\'/0\'/1/0');
  console.log('  Address:', changeAddress, '\n');

  // Step 8: Create account metadata
  const account = wallet.createAccount('native-segwit', 0, 'Main Account');
  console.log('Account created:', JSON.stringify(account, null, 2), '\n');

  return {
    mnemonic,
    seed,
    wallet,
    addresses: {
      legacy: legacyAddress,
      segwit: segwitAddress,
      nativeSegwit: nativeSegwitAddress,
      change: changeAddress,
    },
  };
}

/**
 * Example 2: Import existing wallet from mnemonic
 */
export function exampleImportWallet() {
  console.log('=== Example: Import Wallet from Mnemonic ===\n');

  // Use BIP39 test vector mnemonic
  const mnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  console.log('Importing mnemonic:', mnemonic, '\n');

  // Validate before import
  const isValid = KeyManager.validateMnemonic(mnemonic);
  if (!isValid) {
    throw new Error('Invalid mnemonic - cannot import');
  }
  console.log('✓ Mnemonic valid\n');

  // Convert to seed
  const seed = KeyManager.mnemonicToSeed(mnemonic);

  // Create wallet
  const wallet = new HDWallet(seed, 'testnet');
  const addressGen = new AddressGenerator('testnet');

  // Generate first address
  const node = wallet.deriveAddressNode('native-segwit', 0, 0, 0);
  const address = addressGen.generateAddress(node, 'native-segwit');

  console.log('First address:', address);
  console.log('This should be deterministic - always the same for this mnemonic\n');

  return { wallet, address };
}

/**
 * Example 3: Multi-account wallet
 */
export function exampleMultiAccount() {
  console.log('=== Example: Multi-Account Wallet ===\n');

  const mnemonic = KeyManager.generateMnemonic(128);
  const seed = KeyManager.mnemonicToSeed(mnemonic);
  const wallet = new HDWallet(seed, 'testnet');
  const addressGen = new AddressGenerator('testnet');

  // Create 3 accounts
  const accounts = [
    { index: 0, name: 'Main Account', type: 'native-segwit' as const },
    { index: 1, name: 'Savings', type: 'native-segwit' as const },
    { index: 2, name: 'Trading', type: 'segwit' as const },
  ];

  accounts.forEach(({ index, name, type }) => {
    const account = wallet.createAccount(type, index, name);
    const node = wallet.deriveAddressNode(type, index, 0, 0);
    const address = addressGen.generateAddress(node, type);

    console.log(`Account ${index} (${name}):`);
    console.log(`  Type: ${type}`);
    console.log(`  Address: ${address}\n`);
  });

  return { wallet, accounts };
}

/**
 * Example 4: Address validation and type detection
 */
export function exampleAddressValidation() {
  console.log('=== Example: Address Validation ===\n');

  const addressGen = new AddressGenerator('testnet');

  // Test addresses
  const testAddresses = [
    'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn', // Legacy testnet
    '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc', // SegWit testnet
    'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx', // Native SegWit testnet
    '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Mainnet (should fail)
    'invalid_address', // Invalid
  ];

  testAddresses.forEach((addr) => {
    const isValid = addressGen.validateAddress(addr);
    const type = addressGen.getAddressType(addr);

    console.log(`Address: ${addr}`);
    console.log(`  Valid for testnet: ${isValid}`);
    console.log(`  Type: ${type || 'unknown'}\n`);
  });
}

/**
 * Example 5: Extended public key (xpub) export
 */
export function exampleXpubExport() {
  console.log('=== Example: Extended Public Key Export ===\n');

  const mnemonic = KeyManager.generateMnemonic(128);
  const seed = KeyManager.mnemonicToSeed(mnemonic);
  const wallet = new HDWallet(seed, 'testnet');

  // Master xpub (can derive all addresses)
  const masterXpub = wallet.getExtendedPublicKey();
  console.log('Master Extended Public Key:');
  console.log(masterXpub, '\n');

  // Account-level xpub (safer - only exposes one account)
  const accountXpub = wallet.getAccountExtendedPublicKey('native-segwit', 0);
  console.log('Account 0 Extended Public Key (Native SegWit):');
  console.log(accountXpub, '\n');

  console.log('⚠️  xpub can be used for watch-only wallets');
  console.log('⚠️  Anyone with xpub can see all addresses/balances');
  console.log('⚠️  But cannot spend (no private keys)\n');

  return { masterXpub, accountXpub };
}

// Uncomment to run examples:
// exampleCreateWallet();
// exampleImportWallet();
// exampleMultiAccount();
// exampleAddressValidation();
// exampleXpubExport();
