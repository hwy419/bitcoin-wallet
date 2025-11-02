/**
 * Generate Test Xpub Files for Multisig Wallet Testing
 *
 * This script generates valid testnet extended public keys (xpubs) with fingerprints
 * for testing multisig wallet import functionality.
 *
 * BIP Standards:
 * - BIP39: Mnemonic generation (12 words, 128 bits entropy)
 * - BIP32: HD key derivation
 * - BIP48: Multisig derivation paths
 *
 * Derivation Paths (BIP48 for testnet, coin_type = 1):
 * - P2WSH (Native SegWit):   m/48'/1'/0'/2'
 * - P2SH-P2WSH (Wrapped):    m/48'/1'/0'/1'
 * - P2SH (Legacy):           m/48'/1'/0'/1'
 *
 * Output Format (matches XpubExport.tsx):
 * {
 *   "xpub": "tpubD...",
 *   "fingerprint": "A1B2C3D4",
 *   "configuration": "2-of-3",
 *   "addressType": "p2wsh",
 *   "derivationPath": "m/48'/1'/0'/2'",
 *   "createdAt": "2025-10-13T..."
 * }
 *
 * Generates files for testing:
 * - 2-of-2: 1 additional cosigner (total 2 xpubs)
 * - 2-of-3: 2 additional cosigners (total 3 xpubs)
 * - 3-of-5: 4 additional cosigners (total 5 xpubs)
 */

const bip39 = require('bip39');
const { BIP32Factory } = require('bip32');
const bitcoin = require('bitcoinjs-lib');
const ecc = require('tiny-secp256k1');
const fs = require('fs');
const path = require('path');

// Initialize BIP32 with tiny-secp256k1
const bip32 = BIP32Factory(ecc);

// Use Bitcoin testnet network
const NETWORK = bitcoin.networks.testnet;

/**
 * Get BIP48 derivation path for multisig based on address type
 *
 * @param {string} addressType - Address type: 'p2wsh', 'p2sh-p2wsh', or 'p2sh'
 * @returns {string} BIP48 derivation path
 */
function getDerivationPath(addressType) {
  const accountIndex = 0; // Using account 0 for all test xpubs
  const coinType = 1; // Testnet

  // Script type based on BIP48
  let scriptType;
  switch (addressType) {
    case 'p2wsh':
      scriptType = 2; // Native SegWit
      break;
    case 'p2sh-p2wsh':
      scriptType = 1; // Wrapped SegWit
      break;
    case 'p2sh':
      scriptType = 1; // Legacy multisig (uses same script type as wrapped)
      break;
    default:
      throw new Error(`Unknown address type: ${addressType}`);
  }

  return `m/48'/${coinType}'/${accountIndex}'/${scriptType}'`;
}

/**
 * Generate a valid testnet xpub with fingerprint
 *
 * @param {string} mnemonic - BIP39 mnemonic (12 or 24 words)
 * @param {string} addressType - Address type for derivation path
 * @returns {Object} Object containing xpub and fingerprint
 */
function generateXpub(mnemonic, addressType) {
  // Validate mnemonic
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic');
  }

  // Convert mnemonic to seed
  const seed = bip39.mnemonicToSeedSync(mnemonic);

  // Create root key for testnet
  const root = bip32.fromSeed(seed, NETWORK);

  // Get master fingerprint (first 4 bytes of root public key hash160)
  const fingerprint = root.fingerprint.toString('hex').toUpperCase();

  // Derive to BIP48 path
  const derivationPath = getDerivationPath(addressType);
  const pathComponents = derivationPath
    .split('/')
    .slice(1) // Remove 'm'
    .map(c => c.replace("'", ''));

  let node = root;
  for (const component of pathComponents) {
    const index = parseInt(component);
    const hardened = derivationPath.includes(`${component}'`);
    node = node.derive(hardened ? index + 0x80000000 : index);
  }

  // Export xpub (neutered key - public only)
  const xpub = node.neutered().toBase58();

  return { xpub, fingerprint, derivationPath };
}

/**
 * Generate test xpub file
 *
 * @param {string} filename - Output filename
 * @param {string} mnemonic - BIP39 mnemonic
 * @param {string} config - Multisig configuration (e.g., '2-of-3')
 * @param {string} addressType - Address type
 * @param {string} outputDir - Output directory path
 */
function generateXpubFile(filename, mnemonic, config, addressType, outputDir) {
  console.log(`\nGenerating ${filename}...`);
  console.log(`Mnemonic: ${mnemonic.split(' ').slice(0, 3).join(' ')}... (truncated)`);

  const { xpub, fingerprint, derivationPath } = generateXpub(mnemonic, addressType);

  const data = {
    xpub,
    fingerprint,
    configuration: config,
    addressType,
    derivationPath,
    createdAt: new Date().toISOString(),
  };

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`✓ Generated: ${filename}`);
  console.log(`  Fingerprint: ${fingerprint}`);
  console.log(`  Xpub: ${xpub.substring(0, 20)}...${xpub.substring(xpub.length - 10)}`);
  console.log(`  Path: ${derivationPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('='.repeat(80));
  console.log('Generating Test Xpub Files for Multisig Wallet Testing');
  console.log('='.repeat(80));

  const outputDir = path.join(__dirname, '../test-data/multisig-xpubs');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const addressType = 'p2wsh'; // Using Native SegWit for all test files

  // Generate test mnemonics (deterministic for reproducibility)
  // Using BIP39 test vectors and generated mnemonics
  const testMnemonics = [
    // Cosigner 1 (from BIP39 test vector)
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',

    // Cosigner 2
    'legal winner thank year wave sausage worth useful legal winner thank yellow',

    // Cosigner 3
    'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',

    // Cosigner 4
    'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',

    // Cosigner 5
    'void come effort suffer camp survey warrior heavy shoot primary clutch crush open amazing screen patrol group space point ten exist slush involve unfold',
  ];

  console.log('\nUsing P2WSH (Native SegWit) address type for all test files');
  console.log(`Output directory: ${outputDir}`);
  console.log(`Generating files for configurations: 2-of-2, 2-of-3, 3-of-5\n`);

  // Generate files for different multisig configurations

  console.log('\n' + '-'.repeat(80));
  console.log('2-of-2 Multisig Configuration');
  console.log('-'.repeat(80));
  generateXpubFile(
    'cosigner-1-2of2-p2wsh.json',
    testMnemonics[0],
    '2-of-2',
    addressType,
    outputDir
  );

  console.log('\n' + '-'.repeat(80));
  console.log('2-of-3 Multisig Configuration');
  console.log('-'.repeat(80));
  generateXpubFile(
    'cosigner-1-2of3-p2wsh.json',
    testMnemonics[0],
    '2-of-3',
    addressType,
    outputDir
  );
  generateXpubFile(
    'cosigner-2-2of3-p2wsh.json',
    testMnemonics[1],
    '2-of-3',
    addressType,
    outputDir
  );

  console.log('\n' + '-'.repeat(80));
  console.log('3-of-5 Multisig Configuration');
  console.log('-'.repeat(80));
  generateXpubFile(
    'cosigner-1-3of5-p2wsh.json',
    testMnemonics[0],
    '3-of-5',
    addressType,
    outputDir
  );
  generateXpubFile(
    'cosigner-2-3of5-p2wsh.json',
    testMnemonics[1],
    '3-of-5',
    addressType,
    outputDir
  );
  generateXpubFile(
    'cosigner-3-3of5-p2wsh.json',
    testMnemonics[2],
    '3-of-5',
    addressType,
    outputDir
  );
  generateXpubFile(
    'cosigner-4-3of5-p2wsh.json',
    testMnemonics[3],
    '3-of-5',
    addressType,
    outputDir
  );

  console.log('\n' + '='.repeat(80));
  console.log('Generation Complete!');
  console.log('='.repeat(80));
  console.log(`\nGenerated ${fs.readdirSync(outputDir).length} xpub files in:`);
  console.log(`${outputDir}\n`);
  console.log('Files ready for testing multisig wallet import functionality.');
  console.log('\nNote: These are TEST xpubs using well-known BIP39 test vectors.');
  console.log('      NEVER use these for real Bitcoin transactions!\n');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { generateXpub, getDerivationPath };
