import { Message, MessageResponse, MessageType, AddressType, Account, WalletAccount, Balance, Transaction, MultisigConfig, MultisigAddressType, MultisigAccount, Cosigner, PendingMultisigTx, ImportedKeyData, PrivateKeyErrorCode } from '../shared/types';
import { KeyManager } from './wallet/KeyManager';
import { HDWallet } from './wallet/HDWallet';
import { AddressGenerator } from './wallet/AddressGenerator';
import { WalletStorage } from './wallet/WalletStorage';
import { CryptoUtils } from './wallet/CryptoUtils';
import { ContactsStorage } from './wallet/ContactsStorage';
import { TransactionMetadataStorage } from './wallet/TransactionMetadataStorage';
import { WizardSessionStorage } from './wizard/WizardSessionStorage';
import { WIFManager } from './wallet/WIFManager';
import { BackupManager } from './wallet/BackupManager';
import { COIN_TYPES, DERIVATION_PATHS } from '../shared/constants';
import { blockstreamClient } from './api/BlockstreamClient';
import { TransactionBuilder } from './bitcoin/TransactionBuilder';
import { priceService } from './api/PriceService';
import { MultisigManager } from './wallet/MultisigManager';
import { PSBTManager } from './bitcoin/PSBTManager';
import * as bitcoin from 'bitcoinjs-lib';
import { BIP32Interface, BIP32Factory } from 'bip32';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';

console.log('Bitcoin Wallet - Background Service Worker Started');

// Initialize BIP32 for xpub parsing
const bip32 = BIP32Factory(ecc);

// Initialize ECPair for private key operations
const ECPair = ECPairFactory(ecc);

// Initialize transaction builder, multisig manager, and PSBT manager
const transactionBuilder = new TransactionBuilder('testnet');
const multisigManager = new MultisigManager('testnet');
const psbtManager = new PSBTManager(transactionBuilder['network']);

// In-memory wallet state (cleared when service worker terminates)
interface InMemoryState {
  isUnlocked: boolean;
  decryptedSeed: string | null;
  encryptionKey: CryptoKey | null; // Password-derived key for encrypting imported keys/seeds
  hdWallet: HDWallet | null;
  addressGenerator: AddressGenerator | null;
  lastActivity: number;
  autoLockTimer: number | null;
}

let state: InMemoryState = {
  isUnlocked: false,
  decryptedSeed: null,
  encryptionKey: null,
  hdWallet: null,
  addressGenerator: null,
  lastActivity: Date.now(),
  autoLockTimer: null,
};

// Rate limiting for import operations
interface RateLimitEntry {
  attempts: number[];
}

const importRateLimits: Map<string, RateLimitEntry> = new Map();
const IMPORT_RATE_LIMIT = 5; // Maximum 5 imports per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

// Rate limiting for wallet creation (to prevent brute force attacks)
const walletCreationAttempts: number[] = [];
const WALLET_CREATION_RATE_LIMIT = 3; // Maximum 3 attempts per 15 minutes
const WALLET_CREATION_RATE_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

// Load persisted lastActivity and session data on service worker start
Promise.all([
  chrome.storage.local.get(['lastActivity']),
  chrome.storage.session.get(['unlockSession'])
]).then(([localResult, sessionResult]) => {
  // Restore lastActivity
  if (localResult.lastActivity && typeof localResult.lastActivity === 'number') {
    state.lastActivity = localResult.lastActivity;
    console.log('Loaded lastActivity from storage:', new Date(localResult.lastActivity).toISOString());
  }

  // Restore unlock session if exists
  if (sessionResult.unlockSession) {
    restoreUnlockSession(sessionResult.unlockSession).catch(err => {
      console.error('Failed to restore unlock session:', err);
      // Clear invalid session
      chrome.storage.session.remove('unlockSession');
    });
  }
}).catch(err => {
  console.error('Failed to load persisted data:', err);
});

/**
 * Restore unlock session from persisted session storage
 * This allows the wallet to remain unlocked across service worker restarts
 */
async function restoreUnlockSession(session: any): Promise<void> {
  try {
    console.log('Attempting to restore unlock session...');

    const wallet = await WalletStorage.getWallet();

    // Restore encryption key from session
    const encryptionKeyBuffer = CryptoUtils.base64ToArrayBuffer(session.encryptionKey);
    const encryptionKey = await crypto.subtle.importKey(
      'raw',
      encryptionKeyBuffer,
      { name: 'AES-GCM' },
      true, // Extractable to allow session persistence
      ['encrypt', 'decrypt']
    );

    // Check if this is a non-HD wallet
    const isNonHDWallet = wallet.encryptedSeed === '';

    let hdWallet: HDWallet | null = null;
    let decryptedSeed: string | null = null;

    if (!isNonHDWallet && session.decryptedSeed) {
      // Restore HD wallet from seed
      decryptedSeed = session.decryptedSeed;
      const seed = KeyManager.mnemonicToSeed(decryptedSeed);
      hdWallet = new HDWallet(seed, 'testnet');
    }

    // Create address generator
    const addressGenerator = new AddressGenerator('testnet');

    // Update state
    state.isUnlocked = true;
    state.decryptedSeed = decryptedSeed;
    state.encryptionKey = encryptionKey;
    state.hdWallet = hdWallet;
    state.addressGenerator = addressGenerator;
    state.lastActivity = session.lastActivity || Date.now();

    // Start auto-lock timer
    startAutoLock();

    console.log('Unlock session restored successfully');
  } catch (error) {
    console.error('Failed to restore unlock session:', error);
    throw error;
  }
}

// Helper to check if wallet is unlocked
// For HD wallets: must have decryptedSeed and hdWallet
// For non-HD wallets: must have encryptionKey (decryptedSeed and hdWallet will be null)
function isWalletUnlocked(): boolean {
  if (!state.isUnlocked) return false;

  // For HD wallets, check for decrypted seed and HD wallet
  if (state.decryptedSeed !== null && state.hdWallet !== null) {
    return true;
  }

  // For non-HD wallets, check for encryption key (decryptedSeed will be empty string or null)
  if (state.encryptionKey !== null) {
    return true;
  }

  return false;
}

// Helper to update last activity timestamp
function updateActivity(): void {
  state.lastActivity = Date.now();
  // Persist to storage so it survives service worker restarts
  chrome.storage.local.set({ lastActivity: state.lastActivity }).catch(err => {
    console.error('Failed to persist lastActivity:', err);
  });
}

// Helper to get all addresses for an account
function getAllAddressesForAccount(account: WalletAccount): string[] {
  return account.addresses.map((a: any) => a.address);
}

/**
 * Generate BIP44 derivation path for an address
 *
 * @param addressType - Type of address (native-segwit, segwit, legacy)
 * @param accountIndex - Account index
 * @param change - Change index (0 = external/receiving, 1 = internal/change)
 * @param addressIndex - Address index
 * @returns Derivation path string (e.g., "m/84'/1'/0'/0/0")
 */
function getDerivationPath(
  addressType: AddressType,
  accountIndex: number,
  change: number,
  addressIndex: number
): string {
  // BIP44/49/84 coin type for testnet is 1
  const coinType = 1;

  // Purpose depends on address type:
  // - native-segwit (P2WPKH): 84' (BIP84)
  // - segwit (P2SH-P2WPKH): 49' (BIP49)
  // - legacy (P2PKH): 44' (BIP44)
  let purpose: number;
  if (addressType === 'native-segwit') {
    purpose = 84;
  } else if (addressType === 'segwit') {
    purpose = 49;
  } else {
    purpose = 44; // legacy
  }

  return `m/${purpose}'/${coinType}'/${accountIndex}'/${change}/${addressIndex}`;
}

/**
 * BIP44 Address Gap Limit Scanning
 *
 * Scans for used addresses in an HD account by checking the blockchain.
 * Implements BIP44 gap limit: stops after finding 20 consecutive unused addresses.
 *
 * This is critical for wallet restoration - without it, addresses generated and used
 * in a previous wallet instance will not be rediscovered.
 *
 * @param account - The wallet account to scan
 * @param isChange - Whether to scan change addresses (true) or external/receiving addresses (false)
 * @returns Array of discovered addresses with their used status
 */
async function scanAddressesWithGapLimit(
  account: WalletAccount,
  isChange: boolean = false
): Promise<{ address: string; index: number; used: boolean; isChange: boolean }[]> {
  const GAP_LIMIT = 20; // BIP44 standard gap limit
  const discoveredAddresses: { address: string; index: number; used: boolean; isChange: boolean }[] = [];

  // Only scan for single accounts (HD or imported seed), not multisig or imported private keys
  if (account.accountType === 'multisig') {
    console.log(`Skipping address scan for multisig account ${account.index}`);
    return [];
  }

  // Skip imported private key accounts
  if ('importType' in account && account.importType === 'private-key') {
    console.log(`Skipping address scan for imported private key account ${account.index}`);
    return [];
  }

  if (!state.hdWallet || !state.addressGenerator) {
    console.error('Cannot scan addresses: HD wallet or address generator not initialized');
    return [];
  }

  console.log(`Starting address scan for account ${account.index} (${isChange ? 'change' : 'external'} addresses)`);

  let consecutiveUnused = 0;
  let currentIndex = 0;

  // Always start from index 0 to discover all addresses from the beginning
  // This is critical for wallet restoration

  // TypeScript type narrowing: we've already filtered out multisig accounts
  const addressType = account.addressType as AddressType;

  while (consecutiveUnused < GAP_LIMIT) {
    try {
      // Derive address at current index
      const addressNode = state.hdWallet!.deriveAddressNode(
        addressType,
        account.index,
        isChange ? 1 : 0, // 0 = external, 1 = internal (change)
        currentIndex
      );

      const address = state.addressGenerator!.generateAddress(
        addressNode,
        addressType
      );

      // Check if address has any transactions
      const transactions = await blockstreamClient.getTransactions(address);
      const hasTransactions = transactions && transactions.length > 0;

      if (hasTransactions) {
        console.log(`Found used address at index ${currentIndex}: ${address} (${transactions.length} txs)`);
        discoveredAddresses.push({
          address,
          index: currentIndex,
          used: true,
          isChange
        });
        consecutiveUnused = 0; // Reset counter
      } else {
        // Unused address - only add a few unused addresses beyond the last used one
        if (discoveredAddresses.length > 0 || consecutiveUnused < 2) {
          discoveredAddresses.push({
            address,
            index: currentIndex,
            used: false,
            isChange
          });
        }
        consecutiveUnused++;
      }

      currentIndex++;

    } catch (error) {
      console.error(`Error scanning address at index ${currentIndex}:`, error);
      // Continue scanning despite errors
      consecutiveUnused++;
      currentIndex++;
    }
  }

  console.log(`Address scan complete for account ${account.index} (${isChange ? 'change' : 'external'}). Found ${discoveredAddresses.filter(a => a.used).length} used addresses, ${discoveredAddresses.length} total addresses.`);

  return discoveredAddresses;
}

/**
 * Perform address discovery for an account
 * Updates the account with newly discovered addresses and updates storage
 *
 * @param accountIndex - Index of the account to scan
 * @returns Updated account with discovered addresses
 */
async function performAddressDiscovery(accountIndex: number): Promise<WalletAccount> {
  console.log(`Starting address discovery for account ${accountIndex}`);

  // Get wallet from storage
  const wallet = await WalletStorage.getWallet();
  const account = wallet.accounts.find(a => a.index === accountIndex);

  if (!account) {
    throw new Error(`Account ${accountIndex} not found`);
  }

  // Skip address discovery for multisig accounts
  if (account.accountType === 'multisig') {
    console.log(`Skipping address discovery for multisig account ${accountIndex}`);
    return account;
  }

  // Skip address discovery for imported private key accounts
  if ('importType' in account && account.importType === 'private-key') {
    console.log(`Skipping address discovery for imported private key account ${accountIndex}`);
    return account;
  }

  // Scan external (receiving) addresses
  const externalAddresses = await scanAddressesWithGapLimit(account, false);

  // Scan internal (change) addresses
  const changeAddresses = await scanAddressesWithGapLimit(account, true);

  // TypeScript type narrowing: we've already filtered out multisig accounts
  const addressType = account.addressType as AddressType;

  // Merge discovered addresses with existing addresses, avoiding duplicates
  const existingAddressMap = new Map(
    account.addresses.map(addr => [addr.address, addr])
  );

  // Add newly discovered external addresses
  for (const discovered of externalAddresses) {
    if (!existingAddressMap.has(discovered.address)) {
      // Generate derivation path for this address
      const derivationPath = getDerivationPath(
        addressType,
        account.index,
        0,
        discovered.index
      );

      account.addresses.push({
        address: discovered.address,
        derivationPath,
        index: discovered.index,
        used: discovered.used,
        isChange: false
      });
    }
  }

  // Add newly discovered change addresses
  for (const discovered of changeAddresses) {
    if (!existingAddressMap.has(discovered.address)) {
      // Generate derivation path for this address
      const derivationPath = getDerivationPath(
        addressType,
        account.index,
        1,
        discovered.index
      );

      account.addresses.push({
        address: discovered.address,
        derivationPath,
        index: discovered.index,
        used: discovered.used,
        isChange: true
      });
    }
  }

  // Update indices
  if (externalAddresses.length > 0) {
    const maxExternalIndex = Math.max(...externalAddresses.map(a => a.index));
    account.externalIndex = maxExternalIndex + 1;
  }

  if (changeAddresses.length > 0) {
    const maxChangeIndex = Math.max(...changeAddresses.map(a => a.index));
    account.internalIndex = maxChangeIndex + 1;
  }

  // Update wallet in storage
  const accountArrayIndex = wallet.accounts.findIndex(a => a.index === account.index);
  wallet.accounts[accountArrayIndex] = account;
  await WalletStorage.updateAccounts(wallet.accounts);

  console.log(`Address discovery complete for account ${account.index}. Total addresses: ${account.addresses.length}`);

  return account;
}

// Helper to check rate limit for import operations
function checkImportRateLimit(operationType: string): { allowed: boolean; error?: string } {
  const now = Date.now();
  const key = operationType; // e.g., 'import-private-key' or 'import-seed'

  // Get or create rate limit entry
  let entry = importRateLimits.get(key);
  if (!entry) {
    entry = { attempts: [] };
    importRateLimits.set(key, entry);
  }

  // Remove attempts older than the rate limit window
  entry.attempts = entry.attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  // Check if rate limit exceeded
  if (entry.attempts.length >= IMPORT_RATE_LIMIT) {
    const oldestAttempt = entry.attempts[0];
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestAttempt)) / 1000);
    return {
      allowed: false,
      error: `Too many import attempts. Please wait ${waitTime} seconds before trying again.`,
    };
  }

  // Add current attempt
  entry.attempts.push(now);

  return { allowed: true };
}

// Helper to validate seed phrase entropy and detect weak/common seeds
function validateSeedEntropy(mnemonic: string): { valid: boolean; error?: string } {
  // Known weak/test seed phrases that should be rejected
  const knownWeakSeeds = [
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about',
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent',
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
    'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
    'bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin bitcoin',
    'test test test test test test test test test test test junk',
  ];

  // Check against known weak seeds
  const normalizedMnemonic = mnemonic.trim().toLowerCase();
  if (knownWeakSeeds.includes(normalizedMnemonic)) {
    return {
      valid: false,
      error: 'This seed phrase is publicly known and insecure. Please use a different seed phrase.',
    };
  }

  // Check for excessive word repetition (low entropy indicator)
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const uniqueRatio = uniqueWords.size / words.length;

  // If less than 75% of words are unique, likely weak entropy
  if (uniqueRatio < 0.75) {
    return {
      valid: false,
      error: 'This seed phrase has too much word repetition and may be weak. Please use a different seed phrase.',
    };
  }

  return { valid: true };
}

/**
 * Generate or get next change address for an account.
 * Uses BIP44 internal chain (m/.../1/index).
 *
 * PRIVACY: Every transaction must use a UNIQUE change address to prevent
 * transaction linking and wallet graph reconstruction.
 *
 * @param accountIndex - Index of account
 * @returns Change address for this transaction
 * @throws Error if generation fails
 */
async function getOrGenerateChangeAddress(accountIndex: number): Promise<string> {
  try {
    // Generate next internal (change) address
    const response = await handleGenerateAddress({
      accountIndex,
      isChange: true,  // ✅ Use internal chain (m/.../1/index)
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to generate change address');
    }

    console.log(`Generated change address for account ${accountIndex}: ${response.data.address.address}`);

    return response.data.address.address;
  } catch (error) {
    console.error('Error generating change address:', error);
    throw new Error(`Failed to generate change address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * getOrGenerateMultisigChangeAddress - Generates a multisig change address
 *
 * This function is used during transaction building to generate a change address
 * for multisig transactions. It derives public keys from all co-signers and creates
 * a fresh change address on the internal chain (BIP48 chain 1).
 *
 * @param accountIndex - Index of the multisig account
 * @returns Change address string
 *
 * Derivation Path Structure:
 * - Base path: m/48'/1'/account'/2' (BIP48 for P2WSH, testnet coin type 1)
 * - Change path: m/48'/1'/account'/2'/1/index (chain 1 = internal/change)
 *
 * Process:
 * 1. Get next available internal index from multisigAccount.internalIndex
 * 2. For each co-signer (including ourselves):
 *    - If self: Derive from HD wallet at base_path/1/index
 *    - If cosigner: Derive from their xpub at chain/index
 * 3. Sort public keys per BIP67 (deterministic key ordering)
 * 4. Generate multisig address with metadata (includes redeem/witness scripts)
 * 5. Add address to account and increment internalIndex
 * 6. Save updated account to storage
 *
 * Note: This function is called automatically during multisig transaction building.
 * The change address is generated fresh each time to maintain privacy and avoid reuse.
 */
async function getOrGenerateMultisigChangeAddress(accountIndex: number): Promise<string> {
  try {
    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find multisig account
    const accountIdx = wallet.accounts.findIndex(a => a.index === accountIndex);
    if (accountIdx === -1) {
      throw new Error(`Account with index ${accountIndex} not found`);
    }

    const account = wallet.accounts[accountIdx];

    // Verify it's a multisig account
    if (account.accountType !== 'multisig') {
      throw new Error('Account is not a multisig account');
    }

    const multisigAccount = account as MultisigAccount;

    // Get next internal (change) index
    // This is the next unused change address index
    const nextChangeIndex = multisigAccount.internalIndex;

    // Get M and N from config (e.g., 2-of-3 -> M=2, N=3)
    const configDetails = multisigManager.getConfigDetails(multisigAccount.multisigConfig);

    // Get base derivation path for this multisig account
    // For P2WSH on testnet: m/48'/1'/account'/2'
    const basePath = multisigManager.getDerivationPath(
      multisigAccount.multisigConfig,
      multisigAccount.addressType,
      accountIndex
    );

    // Build full derivation path for change address
    // Format: base_path/chain/index where chain=1 (internal/change)
    const changeAddressPath = `${basePath}/1/${nextChangeIndex}`;

    console.log(`[getOrGenerateMultisigChangeAddress] Generating change address at ${changeAddressPath}`);

    // Validate cosigners (should match N from config)
    const expectedCosigners = configDetails.n;
    const actualCosigners = multisigAccount.cosigners.length;

    if (actualCosigners !== expectedCosigners) {
      throw new Error(`Invalid multisig configuration: Expected ${expectedCosigners} co-signers for ${multisigAccount.multisigConfig} config, but found ${actualCosigners}`);
    }

    // Use cosigners as-is from the account (they already include all N participants)
    const allXpubs = multisigAccount.cosigners.map(c => ({ ...c, isSelf: c.isSelf || false }));

    // Derive public keys at the change address level for all co-signers
    const publicKeys: Buffer[] = [];
    for (const cosigner of allXpubs) {
      let addressNode: BIP32Interface;

      if (cosigner.isSelf) {
        // For ourselves, derive from our HD wallet
        // Path: base_path -> chain 1 (internal) -> index
        const xpubNode = state.hdWallet!.derivePath(basePath);
        addressNode = xpubNode.derive(1).derive(nextChangeIndex); // Internal chain (1) / change index
      } else {
        // For cosigners, parse their xpub and derive from it
        // The xpub is already at the account level, so we just derive chain/index
        const cosignerXpubNode = bip32.fromBase58(cosigner.xpub, transactionBuilder['network']);
        addressNode = cosignerXpubNode.derive(1).derive(nextChangeIndex); // Internal chain (1) / change index
      }

      publicKeys.push(addressNode.publicKey);
    }

    // Generate multisig change address with metadata
    // This includes redeem/witness scripts needed for spending
    const changeAddress = state.addressGenerator!.generateMultisigAddressWithMetadata(
      publicKeys,
      configDetails.m,
      multisigAccount.addressType,
      changeAddressPath,
      nextChangeIndex,
      true // isChange: true indicates this is an internal/change address
    );

    // Update account: add the new change address and increment internalIndex
    multisigAccount.addresses.push(changeAddress);
    multisigAccount.internalIndex++;

    // Save updated account to storage
    await WalletStorage.updateAccount(accountIndex, multisigAccount);

    console.log(`[getOrGenerateMultisigChangeAddress] Generated change address for account ${accountIndex}: ${changeAddress.address}`);

    return changeAddress.address;
  } catch (error) {
    console.error('Error generating multisig change address:', error);
    throw new Error(`Failed to generate multisig change address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * ensureMultisigAddressPool - Ensures multisig account has a pool of addresses
 *
 * This function generates addresses for a multisig account until the gap limit is reached.
 * It derives public keys from ALL co-signers at each index and generates addresses for
 * both external (receiving) and internal (change) chains.
 *
 * @param accountIndex - Index of the multisig account
 * @param gapLimit - Number of unused addresses to maintain (default: 20)
 * @returns Updated multisig account with generated addresses
 *
 * Address Generation Process:
 * 1. For each address index (0 to gapLimit):
 *    - Derive public key from our HD wallet at: m/48'/1'/account'/2'/chain/index
 *    - Derive public key from each co-signer's xpub at: xpub/chain/index
 * 2. Sort public keys per BIP67
 * 3. Generate multisig address from sorted keys
 * 4. Store address with metadata (scripts, derivation path, etc.)
 *
 * This is called when:
 * - Multisig account is created
 * - Wallet is unlocked (to ensure pool is maintained)
 * - User requests a new address (to maintain gap)
 */
async function ensureMultisigAddressPool(accountIndex: number, gapLimit: number = 20): Promise<MultisigAccount> {
  try {
    console.log(`[ensureMultisigAddressPool] Starting for account ${accountIndex}, gap limit: ${gapLimit}`);

    // Check if wallet is unlocked (required for address derivation)
    if (!isWalletUnlocked()) {
      throw new Error('Wallet is locked. Cannot generate addresses.');
    }

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find multisig account
    const accountIdx = wallet.accounts.findIndex(a => a.index === accountIndex);
    if (accountIdx === -1) {
      throw new Error(`Account with index ${accountIndex} not found`);
    }

    const account = wallet.accounts[accountIdx];

    // Verify it's a multisig account
    if (account.accountType !== 'multisig') {
      throw new Error('Account is not a multisig account');
    }

    const multisigAccount = account as MultisigAccount;

    // Get M and N from config
    const configDetails = multisigManager.getConfigDetails(multisigAccount.multisigConfig);

    // Get base derivation path for this multisig account (e.g., "m/48'/1'/0'/2'")
    const basePath = multisigManager.getDerivationPath(
      multisigAccount.multisigConfig,
      multisigAccount.addressType,
      accountIndex
    );

    console.log(`[ensureMultisigAddressPool] Base path: ${basePath}, M=${configDetails.m}, N=${configDetails.n}`);

    // Validate cosigners array
    const expectedCosigners = configDetails.n;
    const actualCosigners = multisigAccount.cosigners.length;

    if (actualCosigners !== expectedCosigners) {
      const errorMsg = `Invalid multisig configuration for account ${accountIndex}: Expected ${expectedCosigners} co-signers for ${multisigAccount.multisigConfig} config, but found ${actualCosigners}. This account cannot generate addresses.`;
      console.error(`[ensureMultisigAddressPool] ${errorMsg}`);
      throw new Error(errorMsg);
    }

    console.log(`[ensureMultisigAddressPool] Validation passed: ${actualCosigners} co-signers (duplicates allowed for testing)`);

    // Use cosigners as-is from the account (they already include all N participants)
    // Mark which one is "self" based on whether we can derive from our HD wallet
    const allXpubs = multisigAccount.cosigners.map(c => ({ ...c, isSelf: c.isSelf || false }));

    console.log(`[ensureMultisigAddressPool] Co-signers: ${allXpubs.length}`);

    // Helper function to generate address at specific chain and index
    const generateAddressAtIndex = (chain: number, index: number): any => {
      // Derive public keys at this index for all co-signers
      const publicKeys: Buffer[] = [];

      for (const cosigner of allXpubs) {
        let addressNode: BIP32Interface;

        if (cosigner.isSelf) {
          // For ourselves, derive from our HD wallet
          const xpubNode = state.hdWallet!.derivePath(basePath);
          addressNode = xpubNode.derive(chain).derive(index);
        } else {
          // For cosigners, parse their xpub and derive from it
          const cosignerXpubNode = bip32.fromBase58(cosigner.xpub, transactionBuilder['network']);
          addressNode = cosignerXpubNode.derive(chain).derive(index);
        }

        publicKeys.push(addressNode.publicKey);
      }

      // Build derivation path for this address
      const fullPath = `${basePath}/${chain}/${index}`;

      // Generate multisig address with metadata (includes scripts)
      const addressMetadata = state.addressGenerator!.generateMultisigAddressWithMetadata(
        publicKeys,
        configDetails.m,
        multisigAccount.addressType,
        fullPath,
        index,
        chain === 1 // isChange: true for internal chain (1), false for external chain (0)
      );

      return addressMetadata;
    };

    // Track how many addresses we generate
    let generatedCount = 0;

    // Generate external (receiving) addresses up to gap limit
    const currentExternalIndex = multisigAccount.externalIndex;
    const targetExternalIndex = Math.max(gapLimit, currentExternalIndex);

    console.log(`[ensureMultisigAddressPool] External: current=${currentExternalIndex}, target=${targetExternalIndex}`);

    for (let i = currentExternalIndex; i < targetExternalIndex; i++) {
      // Check if address already exists
      const existingAddress = multisigAccount.addresses.find(
        addr => addr.index === i && !addr.isChange
      );

      if (!existingAddress) {
        const newAddress = generateAddressAtIndex(0, i); // 0 = external chain
        multisigAccount.addresses.push(newAddress);
        generatedCount++;
        console.log(`[ensureMultisigAddressPool] Generated external address ${i}: ${newAddress.address}`);
      }
    }

    // Update external index
    multisigAccount.externalIndex = targetExternalIndex;

    // Generate internal (change) addresses up to gap limit
    const currentInternalIndex = multisigAccount.internalIndex;
    const targetInternalIndex = Math.max(gapLimit, currentInternalIndex);

    console.log(`[ensureMultisigAddressPool] Internal: current=${currentInternalIndex}, target=${targetInternalIndex}`);

    for (let i = currentInternalIndex; i < targetInternalIndex; i++) {
      // Check if address already exists
      const existingAddress = multisigAccount.addresses.find(
        addr => addr.index === i && addr.isChange
      );

      if (!existingAddress) {
        const newAddress = generateAddressAtIndex(1, i); // 1 = internal chain
        multisigAccount.addresses.push(newAddress);
        generatedCount++;
        console.log(`[ensureMultisigAddressPool] Generated internal address ${i}: ${newAddress.address}`);
      }
    }

    // Update internal index
    multisigAccount.internalIndex = targetInternalIndex;

    // Save updated account to storage
    await WalletStorage.updateAccount(accountIndex, multisigAccount);

    console.log(`[ensureMultisigAddressPool] Complete. Generated ${generatedCount} new addresses. Total: ${multisigAccount.addresses.length}`);

    return multisigAccount;
  } catch (error) {
    console.error('Error ensuring multisig address pool:', error);
    throw new Error(`Failed to ensure multisig address pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * handleGetMultisigBalance - Get balance for a multisig account
 *
 * This function fetches UTXOs for all addresses in the multisig account,
 * aggregates the balances, and marks addresses as "used" if they have UTXOs.
 *
 * @param accountIndex - Index of the multisig account
 * @returns Balance with confirmed and unconfirmed amounts
 */
async function handleGetMultisigBalance(accountIndex: number): Promise<MessageResponse> {
  try {
    console.log(`[handleGetMultisigBalance] Fetching balance for multisig account ${accountIndex}`);

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find multisig account
    const account = wallet.accounts.find(a => a.index === accountIndex);
    if (!account) {
      throw new Error(`Account with index ${accountIndex} not found`);
    }

    if (account.accountType !== 'multisig') {
      throw new Error('Account is not a multisig account');
    }

    const multisigAccount = account as MultisigAccount;

    // Get all addresses for the account
    const addresses = multisigAccount.addresses.map(a => a.address);

    if (addresses.length === 0) {
      console.log(`[handleGetMultisigBalance] No addresses found for account ${accountIndex}`);
      return {
        success: true,
        data: {
          confirmed: 0,
          unconfirmed: 0,
        },
      };
    }

    console.log(`[handleGetMultisigBalance] Fetching UTXOs for ${addresses.length} addresses`);

    // Fetch UTXOs for each address
    const utxoPromises = addresses.map(addr => blockstreamClient.getUTXOs(addr));
    const utxoArrays = await Promise.all(utxoPromises);

    // Track which addresses have been used
    const usedAddresses = new Set<string>();

    // Aggregate UTXOs
    const allUtxos = utxoArrays.flat();

    // Calculate balances and track used addresses
    let confirmedBalance = 0;
    let unconfirmedBalance = 0;

    for (const utxo of allUtxos) {
      // Mark address as used
      usedAddresses.add(utxo.address);

      // Add to balance based on confirmations
      if (utxo.confirmations > 0) {
        confirmedBalance += utxo.value;
      } else {
        unconfirmedBalance += utxo.value;
      }
    }

    // Update "used" flag for addresses that have UTXOs
    let addressesUpdated = false;
    for (const addr of multisigAccount.addresses) {
      const shouldBeUsed = usedAddresses.has(addr.address);
      if (addr.used !== shouldBeUsed) {
        addr.used = shouldBeUsed;
        addressesUpdated = true;
      }
    }

    // Save updated account if any addresses were marked as used
    if (addressesUpdated) {
      await WalletStorage.updateAccount(accountIndex, multisigAccount);
      console.log(`[handleGetMultisigBalance] Updated used flags for addresses`);
    }

    console.log(`[handleGetMultisigBalance] Balance: confirmed=${confirmedBalance}, unconfirmed=${unconfirmedBalance}`);

    return {
      success: true,
      data: {
        confirmed: confirmedBalance,
        unconfirmed: unconfirmedBalance,
      },
    };
  } catch (error) {
    console.error('Failed to get multisig balance:', error);
    throw new Error(`Failed to get multisig balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * handleGetMultisigTransactions - Get transaction history for a multisig account
 *
 * This function fetches transactions for all addresses in the multisig account,
 * merges and deduplicates them by txid, and sorts by timestamp (most recent first).
 *
 * @param accountIndex - Index of the multisig account
 * @param limit - Optional limit on number of transactions to return
 * @returns Array of transactions
 */
async function handleGetMultisigTransactions(accountIndex: number, limit?: number): Promise<MessageResponse> {
  try {
    console.log(`[handleGetMultisigTransactions] Fetching transactions for multisig account ${accountIndex}`);

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find multisig account
    const account = wallet.accounts.find(a => a.index === accountIndex);
    if (!account) {
      throw new Error(`Account with index ${accountIndex} not found`);
    }

    if (account.accountType !== 'multisig') {
      throw new Error('Account is not a multisig account');
    }

    const multisigAccount = account as MultisigAccount;

    // Get all addresses for the account
    const addresses = multisigAccount.addresses.map(a => a.address);

    if (addresses.length === 0) {
      console.log(`[handleGetMultisigTransactions] No addresses found for account ${accountIndex}`);
      return {
        success: true,
        data: { transactions: [] },
      };
    }

    console.log(`[handleGetMultisigTransactions] Fetching transactions for ${addresses.length} addresses`);

    // Fetch transactions for each address
    const txPromises = addresses.map(addr => blockstreamClient.getTransactions(addr));
    const txArrays = await Promise.all(txPromises);

    // Merge and deduplicate by txid
    const txMap = new Map<string, Transaction>();
    for (const txArray of txArrays) {
      for (const tx of txArray) {
        if (!txMap.has(tx.txid)) {
          txMap.set(tx.txid, tx);
        }
      }
    }

    // Convert to array and sort by timestamp (newest first)
    let transactions = Array.from(txMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // Apply limit if provided
    if (limit && limit > 0) {
      transactions = transactions.slice(0, limit);
    }

    console.log(`[handleGetMultisigTransactions] Found ${transactions.length} transactions for account ${accountIndex}`);

    return {
      success: true,
      data: { transactions },
    };
  } catch (error) {
    console.error('Failed to get multisig transactions:', error);
    throw new Error(`Failed to get multisig transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Message listener
chrome.runtime.onMessage.addListener(
  (message: Message, _sender, sendResponse: (response: MessageResponse) => void) => {
    console.log('Received message:', message.type);

    // Handle messages
    handleMessage(message)
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        sendResponse({
          success: false,
          error: error.message || 'Unknown error',
        });
      });

    // Required for async sendResponse
    return true;
  }
);

async function handleMessage(message: Message): Promise<MessageResponse> {
  // Update activity timestamp for all messages
  updateActivity();

  switch (message.type) {
    case MessageType.GET_WALLET_STATE:
      return handleGetWalletState();

    case MessageType.CREATE_WALLET:
      return handleCreateWallet(message.payload);

    case MessageType.IMPORT_WALLET:
      return handleImportWallet(message.payload);

    case MessageType.UNLOCK_WALLET:
      return handleUnlockWallet(message.payload);

    case MessageType.LOCK_WALLET:
      return handleLockWallet();

    case MessageType.CREATE_ACCOUNT:
      return handleCreateAccount(message.payload);

    case MessageType.UPDATE_ACCOUNT_NAME:
      return handleUpdateAccountName(message.payload);

    case MessageType.DELETE_ACCOUNT:
      return handleDeleteAccount(message.payload);

    case MessageType.IMPORT_ACCOUNT_PRIVATE_KEY:
      return handleImportAccountPrivateKey(message.payload);

    case MessageType.IMPORT_ACCOUNT_SEED:
      return handleImportAccountSeed(message.payload);

    case MessageType.GENERATE_ADDRESS:
      return handleGenerateAddress(message.payload);

    case MessageType.GET_BALANCE:
      return handleGetBalance(message.payload);

    case MessageType.GET_TRANSACTIONS:
      return handleGetTransactions(message.payload);

    case MessageType.GET_BALANCE_HISTORY:
      return handleGetBalanceHistory(message.payload);

    case MessageType.GET_FEE_ESTIMATES:
      return handleGetFeeEstimates();

    case MessageType.SEND_TRANSACTION:
      return handleSendTransaction(message.payload);

    case MessageType.GET_BTC_PRICE:
      return handleGetBtcPrice();

    // Multisig operations
    case MessageType.CREATE_MULTISIG_ACCOUNT:
      return handleCreateMultisigAccount(message.payload);

    case MessageType.EXPORT_OUR_XPUB:
      return handleExportOurXpub(message.payload);

    case MessageType.IMPORT_COSIGNER_XPUB:
      return handleImportCosignerXpub(message.payload);

    case MessageType.BUILD_MULTISIG_TRANSACTION:
      return handleBuildMultisigTransaction(message.payload);

    case MessageType.SIGN_MULTISIG_TRANSACTION:
      return handleSignMultisigTransaction(message.payload);

    case MessageType.EXPORT_PSBT:
      return handleExportPSBT(message.payload);

    case MessageType.IMPORT_PSBT:
      return handleImportPSBT(message.payload);

    case MessageType.GET_PENDING_MULTISIG_TXS:
      return handleGetPendingMultisigTxs(message.payload);

    case MessageType.DELETE_PENDING_MULTISIG_TX:
      return handleDeletePendingMultisigTx(message.payload);

    case MessageType.SAVE_PENDING_MULTISIG_TX:
      return handleSavePendingMultisigTx(message.payload);

    case MessageType.BROADCAST_MULTISIG_TRANSACTION:
      return handleBroadcastMultisigTransaction(message.payload);

    case MessageType.GENERATE_MULTISIG_ADDRESS:
      return handleGenerateMultisigAddress(message.payload);

    // Contacts management
    case MessageType.GET_CONTACTS:
      return handleGetContacts(message.payload);

    case MessageType.GET_CONTACT_BY_ID:
      return handleGetContactById(message.payload);

    case MessageType.GET_CONTACT_BY_ADDRESS:
      return handleGetContactByAddress(message.payload);

    case MessageType.SEARCH_CONTACTS:
      return handleSearchContacts(message.payload);

    case MessageType.ADD_CONTACT:
      return handleAddContact(message.payload);

    case MessageType.UPDATE_CONTACT:
      return handleUpdateContact(message.payload);

    case MessageType.DELETE_CONTACT:
      return handleDeleteContact(message.payload);

    case MessageType.IMPORT_CONTACTS_CSV:
      return handleImportContactsCSV(message.payload);

    case MessageType.EXPORT_CONTACTS_CSV:
      return handleExportContactsCSV(message.payload);

    case MessageType.GET_TRANSACTIONS_FOR_CONTACT:
      return handleGetTransactionsForContact(message.payload);

    case MessageType.EXPAND_CONTACT_ADDRESSES:
      return handleExpandContactAddresses(message.payload);

    // Contacts privacy tracking
    case MessageType.GET_NEXT_CONTACT_ADDRESS:
      return handleGetNextContactAddress(message.payload);

    case MessageType.INCREMENT_CONTACT_USAGE:
      return handleIncrementContactUsage(message.payload);

    // Contacts migration (v1 → v2)
    case MessageType.GET_CONTACTS_MIGRATION_STATUS:
      return handleGetContactsMigrationStatus(message.payload);

    case MessageType.MIGRATE_CONTACTS_V1_TO_V2:
      return handleMigrateContactsV1ToV2(message.payload);

    case MessageType.VERIFY_CONTACTS_MIGRATION:
      return handleVerifyContactsMigration(message.payload);

    case MessageType.ROLLBACK_CONTACTS_MIGRATION:
      return handleRollbackContactsMigration(message.payload);

    case MessageType.DELETE_CONTACTS_BACKUP:
      return handleDeleteContactsBackup(message.payload);

    // Transaction metadata management
    case MessageType.GET_TRANSACTION_METADATA:
      return handleGetTransactionMetadata(message.payload);
    case MessageType.GET_ALL_TRANSACTION_METADATA:
      return handleGetAllTransactionMetadata(message.payload);
    case MessageType.SET_TRANSACTION_METADATA:
      return handleSetTransactionMetadata(message.payload);
    case MessageType.DELETE_TRANSACTION_METADATA:
      return handleDeleteTransactionMetadata(message.payload);
    case MessageType.GET_ALL_TRANSACTION_TAGS:
      return handleGetAllTransactionTags(message.payload);
    case MessageType.GET_ALL_TRANSACTION_CATEGORIES:
      return handleGetAllTransactionCategories(message.payload);
    case MessageType.SEARCH_TRANSACTIONS_BY_TAG:
      return handleSearchTransactionsByTag(message.payload);
    case MessageType.SEARCH_TRANSACTIONS_BY_CATEGORY:
      return handleSearchTransactionsByCategory(message.payload);

    // Wizard session management
    case MessageType.WIZARD_OPEN:
      return handleWizardOpen(message.payload);

    case MessageType.WIZARD_INIT:
      return handleWizardInit(message.payload);

    case MessageType.WIZARD_SAVE_STATE:
      return handleWizardSaveState(message.payload);

    case MessageType.WIZARD_LOAD_STATE:
      return handleWizardLoadState(message.payload);

    case MessageType.WIZARD_COMPLETE:
      return handleWizardComplete(message.payload);

    case MessageType.WIZARD_CHECK_WALLET_LOCKED:
      return handleWizardCheckWalletLocked(message.payload);

    // Private key export/import
    case MessageType.EXPORT_PRIVATE_KEY:
      return handleExportPrivateKey(message.payload);

    case MessageType.IMPORT_PRIVATE_KEY:
      return handleImportPrivateKey(message.payload);

    case MessageType.VALIDATE_WIF:
      return handleValidateWIF(message.payload);

    // Account xpub export
    case MessageType.EXPORT_ACCOUNT_XPUB:
      return handleExportAccountXpub(message.payload);

    // Wallet backup/restore
    case MessageType.EXPORT_WALLET_BACKUP:
      return handleExportWalletBackup(message.payload);

    case MessageType.IMPORT_WALLET_BACKUP:
      return handleImportWalletBackup(message.payload);

    case MessageType.VALIDATE_BACKUP_FILE:
      return handleValidateBackupFile(message.payload);

    default:
      return {
        success: false,
        error: `Unhandled message type: ${message.type}`,
      };
  }
}

async function handleGetWalletState(): Promise<MessageResponse> {
  try {
    const hasWallet = await WalletStorage.hasWallet();
    const isLocked = !state.isUnlocked;

    // If wallet is unlocked, include accounts and balance
    if (!isLocked && hasWallet) {
      let wallet = await WalletStorage.getWallet();

      // Fetch balance for the first account
      let balance: Balance = {
        confirmed: 0,
        unconfirmed: 0,
      };

      if (wallet.accounts.length > 0) {
        try {
          const balanceResult = await handleGetBalance({ accountIndex: 0 });
          if (balanceResult.success && balanceResult.data) {
            balance = balanceResult.data;
          }
        } catch (error) {
          console.warn('Failed to fetch initial balance:', error);
          // Continue with zero balance - not critical
        }

        // Reload wallet from storage to get updated addresses from address discovery
        wallet = await WalletStorage.getWallet();
      }

      return {
        success: true,
        data: {
          isInitialized: hasWallet,
          isLocked: false,
          accounts: wallet.accounts,
          balance,
        },
      };
    }

    return {
      success: true,
      data: {
        isInitialized: hasWallet,
        isLocked,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get wallet state',
    };
  }
}

/**
 * CREATE_WALLET - Generate new wallet, encrypt seed, create first account
 *
 * Payload: {
 *   password: string,
 *   addressType?: AddressType,
 *   mnemonicStrength?: 128 | 160 | 192 | 224 | 256  // Default: 128 (12 words)
 * }
 * Returns: { mnemonic: string, firstAddress: string }
 */
async function handleCreateWallet(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.password) {
      return {
        success: false,
        error: 'Password is required',
      };
    }

    const {
      password,
      addressType = 'native-segwit' as AddressType,
      mnemonicStrength = 128 // Default to 12 words (128 bits) if not specified
    } = payload;

    // Validate mnemonicStrength
    const validStrengths = [128, 160, 192, 224, 256];
    if (!validStrengths.includes(mnemonicStrength)) {
      return {
        success: false,
        error: `Invalid seed phrase strength. Must be one of: ${validStrengths.join(', ')} bits`,
      };
    }

    // Check if wallet already exists
    const exists = await WalletStorage.hasWallet();
    if (exists) {
      return {
        success: false,
        error: 'Wallet already exists. Please delete the existing wallet first.',
      };
    }

    // Generate new mnemonic with specified strength
    // 128 bits = 12 words, 160 bits = 15 words, 192 bits = 18 words,
    // 224 bits = 21 words, 256 bits = 24 words
    const mnemonic = KeyManager.generateMnemonic(mnemonicStrength);

    // Convert mnemonic to seed
    const seed = KeyManager.mnemonicToSeed(mnemonic);

    // Create HD wallet from seed
    const hdWallet = new HDWallet(seed, 'testnet');

    // Create address generator
    const addressGenerator = new AddressGenerator('testnet');

    // Create first account
    const firstAccount = hdWallet.createAccount(addressType, 0, 'Account 1');

    // Set importType to 'hd' for HD-derived accounts
    firstAccount.importType = 'hd';

    // Generate first receiving address for the account
    const addressNode = hdWallet.deriveAddressNode(addressType, 0, 0, 0);
    const coinType = COIN_TYPES['testnet'];
    const pathFunction = DERIVATION_PATHS[addressType as AddressType];
    const derivationPath = pathFunction(coinType, 0, 0, 0);

    const firstAddress = addressGenerator.generateAddressWithMetadata(
      addressNode,
      addressType,
      derivationPath,
      0,
      false // isChange = false (receiving address)
    );

    // Add address to account
    firstAccount.addresses.push(firstAddress);
    firstAccount.externalIndex = 1; // We've generated one external address

    // Create and save wallet to storage
    await WalletStorage.createWallet(mnemonic, password, firstAccount);

    console.log('Wallet created successfully with first account');

    return {
      success: true,
      data: {
        mnemonic,
        firstAddress: firstAddress.address,
      },
    };
  } catch (error) {
    console.error('Failed to create wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create wallet',
    };
  }
}

/**
 * IMPORT_WALLET - Import from mnemonic, encrypt seed, create first account
 *
 * Payload: { mnemonic: string, password: string, addressType?: AddressType }
 * Returns: { firstAddress: string }
 */
async function handleImportWallet(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.mnemonic || !payload.password) {
      return {
        success: false,
        error: 'Mnemonic and password are required',
      };
    }

    const { mnemonic, password, addressType = 'native-segwit' as AddressType } = payload;

    // Validate mnemonic
    if (!KeyManager.validateMnemonic(mnemonic)) {
      return {
        success: false,
        error: 'Invalid mnemonic phrase. Please check your seed phrase and try again.',
      };
    }

    // Check if wallet already exists
    const exists = await WalletStorage.hasWallet();
    if (exists) {
      return {
        success: false,
        error: 'Wallet already exists. Please delete the existing wallet first.',
      };
    }

    // Convert mnemonic to seed
    const seed = KeyManager.mnemonicToSeed(mnemonic);

    // Create HD wallet from seed
    const hdWallet = new HDWallet(seed, 'testnet');

    // Create address generator
    const addressGenerator = new AddressGenerator('testnet');

    // Create first account
    const firstAccount = hdWallet.createAccount(addressType, 0, 'Account 1');

    // Set importType to 'hd' for HD-derived accounts
    firstAccount.importType = 'hd';

    // Generate first receiving address for the account
    const addressNode = hdWallet.deriveAddressNode(addressType, 0, 0, 0);
    const coinType = COIN_TYPES['testnet'];
    const pathFunction = DERIVATION_PATHS[addressType as AddressType];
    const derivationPath = pathFunction(coinType, 0, 0, 0);

    const firstAddress = addressGenerator.generateAddressWithMetadata(
      addressNode,
      addressType,
      derivationPath,
      0,
      false // isChange = false (receiving address)
    );

    // Add address to account
    firstAccount.addresses.push(firstAddress);
    firstAccount.externalIndex = 1; // We've generated one external address

    // Create and save wallet to storage
    await WalletStorage.createWallet(mnemonic, password, firstAccount);

    console.log('Wallet imported successfully with first account');

    return {
      success: true,
      data: {
        firstAddress: firstAddress.address,
      },
    };
  } catch (error) {
    console.error('Failed to import wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import wallet',
    };
  }
}

/**
 * UNLOCK_WALLET - Decrypt seed, load HD wallet into memory
 *
 * Payload: { password: string }
 * Returns: { accounts: Account[], balance: Balance }
 */
async function handleUnlockWallet(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.password) {
      return {
        success: false,
        error: 'Password is required',
      };
    }

    const { password } = payload;

    // Get wallet to access salt
    const wallet = await WalletStorage.getWallet();

    // Validate that this is an HD wallet (all wallets must have seed phrase)
    if (!wallet.encryptedSeed || wallet.encryptedSeed.length === 0) {
      return {
        success: false,
        error: 'Invalid wallet: Non-HD wallets are no longer supported. Please restore from your seed phrase.',
      };
    }

    // Derive encryption key from password for encrypting imported keys
    // This key will be stored in memory and used for all imported key encryption
    const saltBuffer = new Uint8Array(
      CryptoUtils.base64ToArrayBuffer(wallet.salt) as ArrayBuffer
    );
    const encryptionKey = await CryptoUtils.deriveKey(password, saltBuffer);

    // Decrypt seed phrase from storage
    const mnemonic = await WalletStorage.unlockWallet(password);

    // Convert mnemonic to seed
    const seed = KeyManager.mnemonicToSeed(mnemonic);

    // Create HD wallet from seed
    const hdWallet = new HDWallet(seed, 'testnet');

    // Create address generator
    const addressGenerator = new AddressGenerator('testnet');

    // Update in-memory state
    state.isUnlocked = true;
    state.decryptedSeed = mnemonic;
    state.encryptionKey = encryptionKey; // Store password-derived key for imported key encryption
    state.hdWallet = hdWallet;
    state.addressGenerator = addressGenerator;
    state.lastActivity = Date.now();

    // Persist unlock session to survive service worker restarts
    try {
      const encryptionKeyBuffer = await crypto.subtle.exportKey('raw', encryptionKey);
      const sessionData = {
        encryptionKey: CryptoUtils.arrayBufferToBase64(encryptionKeyBuffer),
        decryptedSeed: mnemonic, // HD wallet seed phrase
        lastActivity: state.lastActivity,
        timestamp: Date.now()
      };
      await chrome.storage.session.set({ unlockSession: sessionData });
      console.log('Unlock session persisted to session storage');
    } catch (error) {
      console.warn('Failed to persist unlock session:', error);
      // Non-critical error - wallet is still unlocked in memory
    }

    // Start auto-lock timer
    startAutoLock();

    console.log('Wallet unlocked successfully');

    // Ensure address pools for all multisig accounts
    // This is done in the background and doesn't block wallet unlock
    const multisigAccounts = wallet.accounts.filter(a => a.accountType === 'multisig') as MultisigAccount[];
    if (multisigAccounts.length > 0) {
      console.log(`Found ${multisigAccounts.length} multisig accounts, ensuring address pools...`);
      // Run in background, don't await
      Promise.all(
        multisigAccounts.map(async (account) => {
          try {
            await ensureMultisigAddressPool(account.index, 20);
            console.log(`Address pool ensured for multisig account ${account.index}`);
          } catch (error) {
            console.error(`Failed to ensure address pool for account ${account.index}:`, error);
            // Non-critical - continue with other accounts
          }
        })
      ).catch(error => {
        console.error('Error ensuring multisig address pools:', error);
        // Non-critical error
      });
    }

    // Fetch real balance for the first account
    let balance: Balance = {
      confirmed: 0,
      unconfirmed: 0,
    };

    // Try to fetch balance for the first account (if it exists)
    if (wallet.accounts.length > 0) {
      try {
        const balanceResult = await handleGetBalance({ accountIndex: 0 });
        if (balanceResult.success && balanceResult.data) {
          balance = balanceResult.data;
        }
      } catch (error) {
        console.warn('Failed to fetch initial balance:', error);
        // Continue with zero balance - not critical for unlock
      }
    }

    return {
      success: true,
      data: {
        accounts: wallet.accounts,
        balance,
      },
    };
  } catch (error) {
    console.error('Failed to unlock wallet:', error);
    return {
      success: false,
      error: 'Incorrect password or failed to unlock wallet',
    };
  }
}

async function handleLockWallet(): Promise<MessageResponse> {
  try {
    // Clear sensitive data from memory
    if (state.decryptedSeed) {
      // Best effort to clear sensitive data
      state.decryptedSeed = '';
      state.decryptedSeed = null;
    }

    // Clear encryption key from memory
    state.encryptionKey = null;

    state.isUnlocked = false;
    state.hdWallet = null;
    state.addressGenerator = null;
    state.lastActivity = Date.now();

    // Stop auto-lock timer
    if (state.autoLockTimer) {
      clearTimeout(state.autoLockTimer);
      state.autoLockTimer = null;
    }

    // Clear session storage
    try {
      await chrome.storage.session.remove('unlockSession');
      console.log('Unlock session cleared from session storage');
    } catch (error) {
      console.warn('Failed to clear unlock session:', error);
    }

    console.log('Wallet locked successfully');

    return {
      success: true,
      data: { message: 'Wallet locked' },
    };
  } catch (error) {
    console.error('Failed to lock wallet:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to lock wallet',
    };
  }
}

/**
 * CREATE_ACCOUNT - Add new account to existing wallet
 *
 * Payload: { name?: string, addressType?: AddressType }
 * Returns: { account: Account, firstAddress: string }
 */
async function handleCreateAccount(payload: any): Promise<MessageResponse> {
  try {
    // Check rate limit first
    const rateLimitCheck = checkImportRateLimit('create-account');
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded',
      };
    }

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    const { name, addressType = 'native-segwit' as AddressType } = payload || {};

    // Get current wallet to determine next account index
    const wallet = await WalletStorage.getWallet();

    // Find next available account index (handles gaps from deleted accounts)
    const existingIndices = wallet.accounts.map(a => a.index);
    let nextAccountIndex = 0;
    while (existingIndices.includes(nextAccountIndex)) {
      nextAccountIndex++;
    }

    // Check maximum accounts limit (prevent storage exhaustion)
    const MAX_ACCOUNTS = 100;
    if (nextAccountIndex >= MAX_ACCOUNTS) {
      return {
        success: false,
        error: `Maximum number of accounts (${MAX_ACCOUNTS}) reached. Please delete unused accounts.`,
      };
    }

    // Create account name
    const accountName = name || `Account ${nextAccountIndex + 1}`;

    // Create new account using HD wallet
    const newAccount = state.hdWallet!.createAccount(
      addressType,
      nextAccountIndex,
      accountName
    );

    // Set importType to 'hd' for HD-derived accounts
    newAccount.importType = 'hd';

    // Generate first receiving address for the account
    const addressNode = state.hdWallet!.deriveAddressNode(
      addressType,
      nextAccountIndex,
      0,
      0
    );
    const coinType = COIN_TYPES['testnet'];
    const pathFunction = DERIVATION_PATHS[addressType as AddressType];
    const derivationPath = pathFunction(coinType, nextAccountIndex, 0, 0);

    const firstAddress = state.addressGenerator!.generateAddressWithMetadata(
      addressNode,
      addressType,
      derivationPath,
      0,
      false // isChange = false (receiving address)
    );

    // Add address to account
    newAccount.addresses.push(firstAddress);
    newAccount.externalIndex = 1; // We've generated one external address

    // Add account to storage
    await WalletStorage.addAccount(newAccount);

    console.log(`Created new account: ${accountName} (index: ${nextAccountIndex})`);

    return {
      success: true,
      data: {
        account: newAccount,
        firstAddress: firstAddress.address,
      },
    };
  } catch (error) {
    console.error('Failed to create account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create account',
    };
  }
}

/**
 * UPDATE_ACCOUNT_NAME - Rename an account
 *
 * Payload: { accountIndex: number, name: string }
 * Returns: { account: Account }
 */
async function handleUpdateAccountName(payload: any): Promise<MessageResponse> {
  try {
    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number' || !payload.name) {
      return {
        success: false,
        error: 'Account index and name are required',
      };
    }

    const { accountIndex, name } = payload;

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find account
    const accountIdx = wallet.accounts.findIndex(a => a.index === accountIndex);
    if (accountIdx === -1) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    // Update account name
    const updatedAccount = { ...wallet.accounts[accountIdx], name };

    // Save to storage
    await WalletStorage.updateAccount(accountIndex, updatedAccount);

    console.log(`Updated account name: ${name} (index: ${accountIndex})`);

    return {
      success: true,
      data: {
        account: updatedAccount,
      },
    };
  } catch (error) {
    console.error('Failed to update account name:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account name',
    };
  }
}

/**
 * DELETE_ACCOUNT - Delete an account from the wallet
 *
 * Payload: { accountIndex: number }
 * Returns: { success: boolean }
 */
async function handleDeleteAccount(payload: any): Promise<MessageResponse> {
  try {
    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    const { accountIndex } = payload;

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Prevent deleting the last account
    if (wallet.accounts.length === 1) {
      return {
        success: false,
        error: 'Cannot delete the last account. The wallet must have at least one account.',
      };
    }

    // Find account
    const accountIdx = wallet.accounts.findIndex(a => a.index === accountIndex);
    if (accountIdx === -1) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    // Remove account from array
    const updatedAccounts = wallet.accounts.filter(a => a.index !== accountIndex);

    // Remove imported key data if account is imported
    let updatedImportedKeys = wallet.importedKeys;
    if (wallet.importedKeys && wallet.importedKeys[accountIndex]) {
      updatedImportedKeys = { ...wallet.importedKeys };
      delete updatedImportedKeys[accountIndex];
    }

    // Update wallet storage
    const updatedWallet = {
      ...wallet,
      accounts: updatedAccounts,
      importedKeys: updatedImportedKeys,
    };

    await chrome.storage.local.set({ wallet: updatedWallet });

    console.log(`Deleted account with index: ${accountIndex}`);

    return {
      success: true,
      data: {
        message: 'Account deleted successfully',
      },
    };
  } catch (error) {
    console.error('Failed to delete account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete account',
    };
  }
}

/**
 * IMPORT_ACCOUNT_PRIVATE_KEY - Import account from WIF private key
 *
 * Payload: { privateKey: string, name: string }
 * Returns: { account: Account }
 */
async function handleImportAccountPrivateKey(payload: any): Promise<MessageResponse> {
  // Extract private key for cleanup
  let privateKey: string | null = null;

  try {
    // Check rate limit first (before unlocking check to prevent enumeration)
    const rateLimitCheck = checkImportRateLimit('import-private-key');
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded',
      };
    }

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.privateKey || !payload.name) {
      return {
        success: false,
        error: 'Private key and name are required',
      };
    }

    privateKey = payload.privateKey;
    const { name } = payload;

    // Validate WIF format
    if (!KeyManager.validateWIF(privateKey, 'testnet')) {
      // Check if it's a mainnet key (common mistake)
      if (KeyManager.validateWIF(privateKey, 'mainnet')) {
        return {
          success: false,
          error: 'This appears to be a MAINNET private key. This wallet only supports TESTNET. Do NOT import mainnet keys.',
        };
      }
      return {
        success: false,
        error: 'Invalid WIF private key format. Expected testnet key starting with "c".',
      };
    }

    // Decode WIF to get key info and derive address
    let keyInfo;
    let keyPair;
    try {
      keyInfo = KeyManager.decodeWIF(privateKey, 'testnet');
      keyPair = ECPair.fromWIF(privateKey, bitcoin.networks.testnet);
    } catch (err) {
      // SECURITY: Don't leak private key in error message
      return {
        success: false,
        error: 'Failed to decode private key. Please verify the key format.',
      };
    }

    // Detect address type based on key compression
    let addressType: AddressType;
    let address: string;

    if (keyInfo.compressed) {
      // Compressed keys: use Native SegWit (most modern)
      const { address: p2wpkhAddress } = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: bitcoin.networks.testnet,
      });
      if (!p2wpkhAddress) {
        throw new Error('Failed to generate Native SegWit address');
      }
      address = p2wpkhAddress;
      addressType = 'native-segwit';
    } else {
      // Uncompressed keys: use Legacy (P2PKH)
      const { address: p2pkhAddress } = bitcoin.payments.p2pkh({
        pubkey: Buffer.from(keyPair.publicKey),
        network: bitcoin.networks.testnet,
      });
      if (!p2pkhAddress) {
        throw new Error('Failed to generate Legacy address');
      }
      address = p2pkhAddress;
      addressType = 'legacy';
    }

    // Get current wallet to determine next account index
    const wallet = await WalletStorage.getWallet();

    // Find next available account index (handles gaps from deleted accounts)
    const existingIndices = wallet.accounts.map(a => a.index);
    let nextAccountIndex = 0;
    while (existingIndices.includes(nextAccountIndex)) {
      nextAccountIndex++;
    }

    // Check maximum accounts limit (prevent storage exhaustion)
    const MAX_ACCOUNTS = 100;
    if (nextAccountIndex >= MAX_ACCOUNTS) {
      return {
        success: false,
        error: `Maximum number of accounts (${MAX_ACCOUNTS}) reached. Please delete unused accounts.`,
      };
    }

    // Check for duplicate address
    for (const account of wallet.accounts) {
      const addresses = getAllAddressesForAccount(account);
      if (addresses.includes(address)) {
        return {
          success: false,
          error: `This private key has already been imported as "${account.name}"`,
        };
      }
    }

    // Encrypt the private key for storage using password-derived key
    // SECURITY: Use encryptionKey (derived from password), NOT decryptedSeed
    if (!state.encryptionKey) {
      throw new Error('Encryption key not available. Please unlock wallet first.');
    }

    const encryptionResult = await CryptoUtils.encryptWithKey(privateKey, state.encryptionKey);

    // Create imported key data
    const importedKeyData: ImportedKeyData = {
      encryptedData: encryptionResult.encryptedData,
      salt: encryptionResult.salt, // Empty for key-based encryption
      iv: encryptionResult.iv,
      type: 'private-key',
    };

    // Create account object
    const newAccount: Account = {
      accountType: 'single',
      index: nextAccountIndex,
      name,
      addressType,
      importType: 'private-key',
      externalIndex: 1, // We have one address
      internalIndex: 0,
      addresses: [
        {
          address,
          derivationPath: 'imported', // No derivation path for imported keys
          index: 0,
          isChange: false,
          used: false,
        },
      ],
    };

    // Store encrypted private key
    await WalletStorage.storeImportedKey(nextAccountIndex, importedKeyData);

    // Add account to storage
    await WalletStorage.addAccount(newAccount);

    console.log(`Imported account from private key: ${name} (index: ${nextAccountIndex})`);

    return {
      success: true,
      data: {
        account: newAccount,
      },
    };
  } catch (error) {
    // SECURITY: Log error without sensitive data, return generic message
    console.error('Failed to import account from private key');
    return {
      success: false,
      error: 'Failed to import account from private key. Please check the format and try again.',
    };
  } finally {
    // CRITICAL SECURITY: Always clear private key from memory
    if (privateKey) {
      CryptoUtils.clearSensitiveData(privateKey);
      privateKey = null;
    }
  }
}

/**
 * IMPORT_ACCOUNT_SEED - Import account from BIP39 seed phrase
 *
 * Payload: { mnemonic: string, accountIndex: number, addressType: AddressType, name: string }
 * Returns: { account: Account }
 */
async function handleImportAccountSeed(payload: any): Promise<MessageResponse> {
  // Extract sensitive data for cleanup
  let mnemonic: string | null = null;
  let seed: Buffer | null = null;

  try {
    // Check rate limit first (before unlocking check to prevent enumeration)
    const rateLimitCheck = checkImportRateLimit('import-seed');
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error || 'Rate limit exceeded',
      };
    }

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.mnemonic || !payload.name) {
      return {
        success: false,
        error: 'Mnemonic and name are required',
      };
    }

    mnemonic = payload.mnemonic;
    const {
      accountIndex = 0,
      addressType = 'native-segwit' as AddressType,
      name,
    } = payload;

    // Validate mnemonic format
    if (!KeyManager.validateMnemonic(mnemonic)) {
      return {
        success: false,
        error: 'Invalid BIP39 seed phrase. Please check and try again.',
      };
    }

    // Validate entropy and check for weak/common seeds
    const entropyCheck = validateSeedEntropy(mnemonic);
    if (!entropyCheck.valid) {
      return {
        success: false,
        error: entropyCheck.error || 'Seed phrase validation failed.',
      };
    }

    // Validate account index (BIP44 hardened range)
    if (accountIndex < 0 || accountIndex > 2147483647) {
      return {
        success: false,
        error: 'Account index must be between 0 and 2,147,483,647',
      };
    }

    // Convert mnemonic to seed
    seed = KeyManager.mnemonicToSeed(mnemonic);

    // Create HD wallet from imported seed
    const importedHdWallet = new HDWallet(seed, 'testnet');

    // Create account from imported seed
    const derivedAccount = importedHdWallet.createAccount(
      addressType,
      accountIndex,
      name
    );

    // Generate first receiving address
    const addressNode = importedHdWallet.deriveAddressNode(
      addressType,
      accountIndex,
      0,
      0
    );
    const coinType = COIN_TYPES['testnet'];
    const pathFunction = DERIVATION_PATHS[addressType as AddressType];
    const derivationPath = pathFunction(coinType, accountIndex, 0, 0);

    const addressGenerator = new AddressGenerator('testnet');
    const firstAddress = addressGenerator.generateAddressWithMetadata(
      addressNode,
      addressType,
      derivationPath,
      0,
      false // isChange = false
    );

    // Get current wallet to determine next account index for storage
    const wallet = await WalletStorage.getWallet();

    // Find next available account index (handles gaps from deleted accounts)
    const existingIndices = wallet.accounts.map(a => a.index);
    let nextAccountIndex = 0;
    while (existingIndices.includes(nextAccountIndex)) {
      nextAccountIndex++;
    }

    // Check maximum accounts limit (prevent storage exhaustion)
    const MAX_ACCOUNTS = 100;
    if (nextAccountIndex >= MAX_ACCOUNTS) {
      return {
        success: false,
        error: `Maximum number of accounts (${MAX_ACCOUNTS}) reached. Please delete unused accounts.`,
      };
    }

    // Check for duplicate address
    for (const account of wallet.accounts) {
      const addresses = getAllAddressesForAccount(account);
      if (addresses.includes(firstAddress.address)) {
        return {
          success: false,
          error: `An account with this address already exists as "${account.name}"`,
        };
      }
    }

    // Encrypt the seed phrase for storage using password-derived key
    // SECURITY: Use encryptionKey (derived from password), NOT decryptedSeed
    if (!state.encryptionKey) {
      throw new Error('Encryption key not available. Please unlock wallet first.');
    }

    const encryptionResult = await CryptoUtils.encryptWithKey(mnemonic, state.encryptionKey);

    // Create imported key data
    const importedKeyData: ImportedKeyData = {
      encryptedData: encryptionResult.encryptedData,
      salt: encryptionResult.salt, // Empty for key-based encryption
      iv: encryptionResult.iv,
      type: 'seed',
    };

    // Update account with correct index and add first address
    derivedAccount.index = nextAccountIndex;
    derivedAccount.importType = 'seed';
    derivedAccount.addresses.push(firstAddress);
    derivedAccount.externalIndex = 1; // We've generated one external address

    // Store encrypted seed
    await WalletStorage.storeImportedKey(nextAccountIndex, importedKeyData);

    // Add account to storage
    await WalletStorage.addAccount(derivedAccount);

    console.log(`Imported account from seed: ${name} (index: ${nextAccountIndex})`);

    return {
      success: true,
      data: {
        account: derivedAccount,
      },
    };
  } catch (error) {
    // SECURITY: Log error without sensitive data, return generic message
    console.error('Failed to import account from seed');
    return {
      success: false,
      error: 'Failed to import account from seed phrase. Please check the format and try again.',
    };
  } finally {
    // CRITICAL SECURITY: Always clear sensitive data from memory
    if (mnemonic) {
      CryptoUtils.clearSensitiveData(mnemonic);
      mnemonic = null;
    }
    if (seed) {
      // Clear buffer data
      seed.fill(0);
      seed = null;
    }
  }
}

/**
 * GENERATE_ADDRESS - Generate new receive address for account
 *
 * Payload: { accountIndex: number, isChange?: boolean }
 * Returns: { address: Address }
 */
async function handleGenerateAddress(payload: any): Promise<MessageResponse> {
  try {
    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    const { accountIndex, isChange = false } = payload;

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find account
    const accountIdx = wallet.accounts.findIndex(a => a.index === accountIndex);
    if (accountIdx === -1) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    const account = wallet.accounts[accountIdx];

    console.log('[handleGenerateAddress] Account details:', {
      index: account.index,
      name: account.name,
      accountType: account.accountType,
      importType: account.importType,
      addressCount: account.addresses.length,
      isChange,
      hdWalletExists: !!state.hdWallet,
      isNonHDWallet: wallet.encryptedSeed === '',
    });

    // Only works for single-signature accounts
    if (account.accountType !== 'single') {
      return {
        success: false,
        error: 'This operation is only supported for single-signature accounts',
      };
    }

    // CRITICAL SECURITY: Prevent generating new addresses for imported private key accounts
    // Imported private keys can only have ONE address - they cannot derive child keys
    if (account.importType === 'private-key') {
      return {
        success: false,
        error: 'Cannot generate new addresses for imported private key accounts. Imported keys can only have one address. To use multiple addresses, create an HD account from your seed phrase.',
      };
    }

    // Also prevent for imported seed accounts if they somehow don't have hdWallet
    // (should not happen in normal operation, but defensive check)
    if (account.importType === 'seed' && !state.hdWallet) {
      return {
        success: false,
        error: 'Cannot generate addresses - wallet state is inconsistent. Please re-import your seed phrase.',
      };
    }

    // Check if this is a non-HD wallet (wallet created from private key)
    // In this case, state.hdWallet will be null and we can't derive new addresses
    if (!state.hdWallet) {
      console.log('[handleGenerateAddress] Non-HD wallet detected - using existing address for change');
      // For change addresses in non-HD wallets, reuse the existing address
      if (isChange && account.addresses.length > 0) {
        console.log('[handleGenerateAddress] Returning existing address as change:', account.addresses[0].address);
        return {
          success: true,
          data: {
            address: account.addresses[0], // Use the existing address as change address
          },
        };
      }
      // For new receive addresses, cannot generate
      return {
        success: false,
        error: 'Cannot generate new addresses for wallets created from private keys',
      };
    }

    // Determine next address index
    const nextIndex = isChange ? account.internalIndex : account.externalIndex;

    // Derive address node
    const addressNode = state.hdWallet.deriveAddressNode(
      account.addressType as AddressType,
      accountIndex,
      isChange ? 1 : 0,
      nextIndex
    );

    // Build derivation path
    const coinType = COIN_TYPES['testnet'];
    const derivationPath = DERIVATION_PATHS[account.addressType](
      coinType,
      accountIndex,
      isChange ? 1 : 0,
      nextIndex
    );

    // Generate address with metadata
    const newAddress = state.addressGenerator!.generateAddressWithMetadata(
      addressNode,
      account.addressType,
      derivationPath,
      nextIndex,
      isChange
    );

    // Update account
    account.addresses.push(newAddress);
    if (isChange) {
      account.internalIndex++;
    } else {
      account.externalIndex++;
    }

    // Save to storage
    await WalletStorage.updateAccount(accountIndex, account);

    console.log(`Generated new ${isChange ? 'change' : 'receive'} address for account ${accountIndex}: ${newAddress.address}`);

    return {
      success: true,
      data: {
        address: newAddress,
      },
    };
  } catch (error) {
    console.error('Failed to generate address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate address',
    };
  }
}

/**
 * GET_BALANCE - Fetch balance for all addresses in account
 *
 * Payload: { accountIndex: number }
 * Returns: { confirmed: number, unconfirmed: number }
 */
async function handleGetBalance(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    const { accountIndex } = payload;

    // Get current wallet
    let wallet = await WalletStorage.getWallet();

    // Find account
    let account = wallet.accounts.find(a => a.index === accountIndex);
    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    // Route to multisig handler if this is a multisig account
    if (account.accountType === 'multisig') {
      console.log(`[handleGetBalance] Routing to multisig balance handler for account ${accountIndex}`);
      return await handleGetMultisigBalance(accountIndex);
    }

    // Perform address discovery if:
    // 1. Account is single (not multisig) and is HD or imported seed (not imported private key)
    // 2. Account only has 1 or 2 addresses (likely just the initial address)
    // 3. Wallet is unlocked (needed for address derivation)

    // Debug logging
    console.log(`[handleGetBalance] Account ${accountIndex} details:`, {
      accountType: account.accountType,
      hasImportType: 'importType' in account,
      importType: 'importType' in account ? (account as any).importType : 'N/A',
      addressCount: account.addresses.length,
      isUnlocked: isWalletUnlocked()
    });

    const shouldPerformDiscovery =
      account.accountType === 'single' &&
      (!('importType' in account) || account.importType !== 'private-key') &&
      account.addresses.length <= 2 &&
      isWalletUnlocked();

    console.log(`[handleGetBalance] shouldPerformDiscovery = ${shouldPerformDiscovery}`);

    if (shouldPerformDiscovery) {
      console.log(`Performing address discovery for account ${accountIndex} (has ${account.addresses.length} addresses)`);
      try {
        account = await performAddressDiscovery(accountIndex);
        // Reload wallet after discovery updates storage
        wallet = await WalletStorage.getWallet();
        account = wallet.accounts.find(a => a.index === accountIndex)!;
      } catch (error) {
        console.error('Address discovery failed, continuing with existing addresses:', error);
        // Continue with existing addresses even if discovery fails
      }
    }

    // Get all addresses for the account
    const addresses = getAllAddressesForAccount(account);

    if (addresses.length === 0) {
      return {
        success: true,
        data: {
          confirmed: 0,
          unconfirmed: 0,
        },
      };
    }

    // Fetch balance for each address
    const balancePromises = addresses.map(addr => blockstreamClient.getBalance(addr));
    const balances = await Promise.all(balancePromises);

    // Aggregate balances
    const totalBalance = balances.reduce(
      (acc, balance) => ({
        confirmed: acc.confirmed + balance.confirmed,
        unconfirmed: acc.unconfirmed + balance.unconfirmed,
      }),
      { confirmed: 0, unconfirmed: 0 }
    );

    console.log(`Balance for account ${accountIndex}:`, totalBalance);

    return {
      success: true,
      data: totalBalance,
    };
  } catch (error) {
    console.error('Failed to get balance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get balance',
    };
  }
}

/**
 * GET_TRANSACTIONS - Fetch transactions for all addresses in account
 *
 * Payload: { accountIndex: number, limit?: number }
 * Returns: { transactions: Transaction[] }
 */
async function handleGetTransactions(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    const { accountIndex, limit } = payload;

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find account
    const account = wallet.accounts.find(a => a.index === accountIndex);
    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    // Route to multisig handler if this is a multisig account
    if (account.accountType === 'multisig') {
      console.log(`[handleGetTransactions] Routing to multisig transactions handler for account ${accountIndex}`);
      return await handleGetMultisigTransactions(accountIndex, limit);
    }

    // Get all addresses for the account
    const addresses = getAllAddressesForAccount(account);

    if (addresses.length === 0) {
      return {
        success: true,
        data: { transactions: [] },
      };
    }

    // Fetch transactions for each address
    const txPromises = addresses.map(addr => blockstreamClient.getTransactions(addr));
    const txArrays = await Promise.all(txPromises);

    // Merge and deduplicate by txid
    const txMap = new Map<string, Transaction>();
    for (const txArray of txArrays) {
      for (const tx of txArray) {
        if (!txMap.has(tx.txid)) {
          txMap.set(tx.txid, tx);
        }
      }
    }

    // Convert to array and sort by timestamp (newest first)
    let transactions = Array.from(txMap.values()).sort(
      (a, b) => b.timestamp - a.timestamp
    );

    // Apply limit if provided
    if (limit && limit > 0) {
      transactions = transactions.slice(0, limit);
    }

    console.log(`Found ${transactions.length} transactions for account ${accountIndex}`);

    return {
      success: true,
      data: { transactions },
    };
  } catch (error) {
    console.error('Failed to get transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transactions',
    };
  }
}

/**
 * GET_BALANCE_HISTORY - Calculate balance history for charting
 *
 * Payload: { accountIndex: number, period: '7D' | '1M' | '3M' | '1Y' | 'ALL' }
 * Returns: BalanceHistory with points and summary stats
 */
async function handleGetBalanceHistory(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    const { accountIndex, period = '7D' } = payload;

    // Get transactions for the account
    const txResponse = await handleGetTransactions({ accountIndex, limit: undefined });
    if (!txResponse.success || !txResponse.data) {
      return {
        success: false,
        error: 'Failed to get transactions for balance history',
      };
    }

    const transactions: Transaction[] = txResponse.data.transactions;

    // If no transactions, return empty history
    if (transactions.length === 0) {
      return {
        success: true,
        data: {
          points: [],
          period,
          summary: {
            periodChange: 0,
            percentChange: 0,
            highest: 0,
            highestTimestamp: 0,
            lowest: 0,
            lowestTimestamp: 0,
          },
        },
      };
    }

    // Get wallet to determine account addresses
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts.find(a => a.index === accountIndex);
    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    const myAddresses = getAllAddressesForAccount(account);

    // Calculate time range based on period
    const now = Math.floor(Date.now() / 1000);
    let startTime: number;
    let intervalSeconds: number;

    switch (period) {
      case '7D':
        startTime = now - 7 * 24 * 60 * 60;
        intervalSeconds = 6 * 60 * 60; // 6 hours
        break;
      case '1M':
        startTime = now - 30 * 24 * 60 * 60;
        intervalSeconds = 24 * 60 * 60; // 1 day
        break;
      case '3M':
        startTime = now - 90 * 24 * 60 * 60;
        intervalSeconds = 3 * 24 * 60 * 60; // 3 days
        break;
      case '1Y':
        startTime = now - 365 * 24 * 60 * 60;
        intervalSeconds = 7 * 24 * 60 * 60; // 1 week
        break;
      case 'ALL':
      default:
        // Get earliest transaction timestamp
        const earliestTx = transactions[transactions.length - 1];
        startTime = earliestTx.timestamp;
        const totalDays = (now - startTime) / (24 * 60 * 60);
        // Adaptive interval based on total time span
        if (totalDays <= 30) {
          intervalSeconds = 24 * 60 * 60; // 1 day
        } else if (totalDays <= 90) {
          intervalSeconds = 3 * 24 * 60 * 60; // 3 days
        } else {
          intervalSeconds = 7 * 24 * 60 * 60; // 1 week
        }
        break;
    }

    // Sort transactions by timestamp (oldest first for balance calculation)
    const sortedTxs = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    // Calculate balance at each time point
    const points: BalanceHistoryPoint[] = [];
    let currentBalance = 0;
    let txIndex = 0;

    for (let timestamp = startTime; timestamp <= now; timestamp += intervalSeconds) {
      // Process all transactions up to this timestamp
      while (txIndex < sortedTxs.length && sortedTxs[txIndex].timestamp <= timestamp) {
        const tx = sortedTxs[txIndex];

        // Calculate net change for this transaction
        let netChange = 0;

        // Add outputs to our addresses
        for (const output of tx.outputs) {
          if (myAddresses.includes(output.address)) {
            netChange += output.value;
          }
        }

        // Subtract inputs from our addresses
        for (const input of tx.inputs) {
          if (myAddresses.includes(input.address)) {
            netChange -= input.value;
          }
        }

        // Subtract fee if we're sending (have inputs from our addresses)
        const hasMyInputs = tx.inputs.some(input => myAddresses.includes(input.address));
        if (hasMyInputs) {
          netChange -= tx.fee;
        }

        currentBalance += netChange;
        txIndex++;
      }

      // Add point
      points.push({
        timestamp,
        balance: currentBalance,
        confirmed: currentBalance, // Simplified - treating all as confirmed for history
        unconfirmed: 0,
      });
    }

    // Calculate summary statistics
    let highest = currentBalance;
    let highestTimestamp = now;
    let lowest = currentBalance;
    let lowestTimestamp = now;

    for (const point of points) {
      if (point.balance > highest) {
        highest = point.balance;
        highestTimestamp = point.timestamp;
      }
      if (point.balance < lowest) {
        lowest = point.balance;
        lowestTimestamp = point.timestamp;
      }
    }

    const startBalance = points.length > 0 ? points[0].balance : 0;
    const endBalance = currentBalance;
    const periodChange = endBalance - startBalance;
    const percentChange = startBalance !== 0 ? (periodChange / startBalance) * 100 : 0;

    console.log(`Balance history calculated: ${points.length} points for period ${period}`);

    return {
      success: true,
      data: {
        points,
        period,
        summary: {
          periodChange,
          percentChange,
          highest,
          highestTimestamp,
          lowest,
          lowestTimestamp,
        },
      },
    };
  } catch (error) {
    console.error('Failed to calculate balance history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate balance history',
    };
  }
}

/**
 * GET_FEE_ESTIMATES - Get current fee estimates from network
 *
 * Payload: none
 * Returns: { slow: number, medium: number, fast: number }
 */
async function handleGetFeeEstimates(): Promise<MessageResponse> {
  try {
    const feeEstimates = await blockstreamClient.getFeeEstimates();

    console.log('Fee estimates:', feeEstimates);

    return {
      success: true,
      data: feeEstimates,
    };
  } catch (error) {
    console.error('Failed to get fee estimates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get fee estimates',
    };
  }
}

/**
 * SEND_TRANSACTION - Build, sign, and broadcast transaction
 *
 * Payload: { accountIndex: number, toAddress: string, amount: number, feeRate: number }
 * Returns: { txid: string, fee: number, size: number }
 */
async function handleSendTransaction(payload: any): Promise<MessageResponse> {
  try {
    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    if (!payload.toAddress || typeof payload.toAddress !== 'string') {
      return {
        success: false,
        error: 'Recipient address is required',
      };
    }

    if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0) {
      return {
        success: false,
        error: 'Valid amount is required',
      };
    }

    if (!payload.feeRate || typeof payload.feeRate !== 'number' || payload.feeRate <= 0) {
      return {
        success: false,
        error: 'Valid fee rate is required',
      };
    }

    const { accountIndex, toAddress, amount, feeRate } = payload;

    // Get current wallet
    const wallet = await WalletStorage.getWallet();

    // Find account
    const account = wallet.accounts.find(a => a.index === accountIndex);
    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    // Get all addresses for the account
    const addresses = getAllAddressesForAccount(account);

    if (addresses.length === 0) {
      return {
        success: false,
        error: 'No addresses found in account',
      };
    }

    // Fetch UTXOs for all addresses
    console.log(`Fetching UTXOs for ${addresses.length} addresses...`);
    const utxoArrays = await Promise.all(
      addresses.map(addr => blockstreamClient.getUTXOs(addr))
    );
    const allUtxos = utxoArrays.flat();

    console.log(`Found ${allUtxos.length} UTXOs`);

    if (allUtxos.length === 0) {
      return {
        success: false,
        error: 'No UTXOs available for spending',
      };
    }

    // PRIVACY FIX: Generate unique change address for this transaction
    // Uses internal chain (m/.../1/x) to prevent transaction linking
    const changeAddress = await getOrGenerateChangeAddress(accountIndex);

    // Build and sign transaction
    console.log(`Building transaction: ${amount} sats to ${toAddress}, fee rate: ${feeRate} sat/vB`);
    console.log(`Change address: ${changeAddress} (internal chain)`);

    // Track private key buffers for cleanup
    const privateKeyBuffers: Buffer[] = [];

    // Check if this is an HD wallet account or imported key account
    const isHDAccount = account.accountType === 'single' && (account.importType === 'hd' || !account.importType);
    const isImportedAccount = account.accountType === 'single' && (account.importType === 'private-key' || account.importType === 'seed');

    // For imported accounts, decrypt the private key once
    let decryptedWIF: string | null = null;
    if (isImportedAccount && wallet.version === 2) {
      if (!wallet.importedKeys || !wallet.importedKeys[accountIndex]) {
        throw new Error('Imported key data not found for account');
      }

      if (!state.encryptionKey) {
        throw new Error('Wallet must be unlocked to sign transactions');
      }

      const importedKeyData = wallet.importedKeys[accountIndex];

      // Decrypt the imported private key using the CryptoKey
      try {
        decryptedWIF = await CryptoUtils.decryptWithKey(
          importedKeyData.encryptedData,
          state.encryptionKey,
          importedKeyData.iv
        );
      } catch (error) {
        throw new Error('Failed to decrypt imported private key');
      }
    }

    try {
      const result = await transactionBuilder.buildTransaction({
        utxos: allUtxos,
        outputs: [{ address: toAddress, amount }],
        changeAddress,
        feeRate,
        getPrivateKey: (derivationPath: string) => {
          if (isHDAccount) {
            // HD wallet: derive private key from path
            if (!state.hdWallet) {
              throw new Error('HD wallet not available');
            }
            const node = state.hdWallet.derivePath(derivationPath);
            if (!node.privateKey) {
              throw new Error(`Failed to derive private key for path: ${derivationPath}`);
            }
            // Track for cleanup
            privateKeyBuffers.push(node.privateKey);
            return node.privateKey;
          } else if (isImportedAccount) {
            // Imported account: use the decrypted WIF
            if (!decryptedWIF) {
              throw new Error('Decrypted WIF not available');
            }
            // Decode WIF to get private key buffer
            const keyPair = ECPair.fromWIF(decryptedWIF, transactionBuilder['network']);
            if (!keyPair.privateKey) {
              throw new Error('Failed to extract private key from WIF');
            }
            // Convert Uint8Array to Buffer
            const privateKeyBuffer = Buffer.from(keyPair.privateKey);
            // Track for cleanup
            privateKeyBuffers.push(privateKeyBuffer);
            return privateKeyBuffer;
          } else {
            throw new Error(`Unknown account import type: ${account.importType}`);
          }
        },
        getAddressType: (address: string) => {
          // All addresses in the account use the same address type
          // Safe cast: we've already verified this is a single-sig account
          return account.addressType as AddressType;
        },
        getDerivationPath: (address: string) => {
          // Find derivation path for address
          const addrObj = account.addresses.find(a => a.address === address);
          if (!addrObj) {
            throw new Error(`Address ${address} not found in account`);
          }
          return addrObj.derivationPath;
        },
      });

      console.log(`Transaction built successfully: ${result.txid}, fee: ${result.fee} sats`);

      // Broadcast transaction
      console.log('Broadcasting transaction...');
      const txid = await blockstreamClient.broadcastTransaction(result.txHex);

      console.log(`Transaction broadcast successful: ${txid}`);

      return {
        success: true,
        data: {
          txid,
          fee: result.fee,
          size: result.virtualSize,
        },
      };
    } finally {
      // SECURITY FIX HIGH-1: Clear private keys from memory
      for (const keyBuffer of privateKeyBuffers) {
        if (keyBuffer) {
          keyBuffer.fill(0);
        }
      }
      privateKeyBuffers.length = 0;

      // Clear decrypted WIF if it was used
      if (decryptedWIF) {
        // Overwrite string in memory (best effort)
        decryptedWIF = '';
      }
    }
  } catch (error) {
    console.error('Failed to send transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send transaction',
    };
  }
}

/**
 * GET_BTC_PRICE - Get current Bitcoin price in USD
 *
 * Payload: none
 * Returns: { usd: number, lastUpdated: number }
 */
async function handleGetBtcPrice(): Promise<MessageResponse> {
  try {
    const price = await priceService.getPrice();

    console.log('Bitcoin price:', price);

    return {
      success: true,
      data: price,
    };
  } catch (error) {
    console.error('Failed to get Bitcoin price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get Bitcoin price',
    };
  }
}

// ============================================================================
// MULTISIG MESSAGE HANDLERS
// ============================================================================

/**
 * CREATE_MULTISIG_ACCOUNT - Create new multisig account
 *
 * Payload: {
 *   config: MultisigConfig,
 *   addressType: MultisigAddressType,
 *   name: string,
 *   accountIndex: number,
 *   cosignerXpubs: Array<{ name: string, xpub: string, fingerprint: string }>
 * }
 * Returns: { account: MultisigAccount }
 */
async function handleCreateMultisigAccount(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleCreateMultisigAccount called with payload:', payload);

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.config || !payload.addressType || !payload.name) {
      return {
        success: false,
        error: 'Config, addressType, and name are required',
      };
    }

    if (!Array.isArray(payload.cosignerXpubs)) {
      return {
        success: false,
        error: 'cosignerXpubs must be an array',
      };
    }

    const { config, addressType, name, cosignerXpubs } = payload;

    // Get current wallet to determine next account index
    const wallet = await WalletStorage.getWallet();

    // Find next available account index (handles gaps from deleted accounts)
    const existingIndices = wallet.accounts.map(a => a.index);
    let nextAccountIndex = 0;
    while (existingIndices.includes(nextAccountIndex)) {
      nextAccountIndex++;
    }

    // Export our xpub for this multisig configuration
    const masterNode = state.hdWallet!.getMasterNode();
    const { xpub: ourXpub, fingerprint: ourFingerprint } = multisigManager.exportOurXpub(
      masterNode,
      config,
      addressType,
      nextAccountIndex
    );

    // Create the multisig account
    const multisigAccount = multisigManager.createMultisigAccount({
      config,
      addressType,
      name,
      accountIndex: nextAccountIndex,
      ourXpub,
      ourFingerprint,
      cosignerXpubs,
    });

    // Add account to storage (WalletStorage supports both Account and MultisigAccount)
    await WalletStorage.addAccount(multisigAccount);

    console.log(`Created multisig account: ${name} (${config}, index: ${nextAccountIndex})`);

    // Generate initial address pool (20 addresses for receiving and change)
    console.log(`Generating initial address pool for multisig account ${nextAccountIndex}...`);
    try {
      await ensureMultisigAddressPool(nextAccountIndex, 20);
      console.log(`Successfully generated address pool for multisig account ${nextAccountIndex}`);
    } catch (error) {
      console.error('Failed to generate address pool:', error);
      // Don't fail the account creation, but log the error
      // The pool can be generated later when needed
    }

    // Reload account after address pool generation
    const updatedWallet = await WalletStorage.getWallet();
    const updatedAccount = updatedWallet.accounts.find(a => a.index === nextAccountIndex);

    return {
      success: true,
      data: { account: updatedAccount || multisigAccount },
    };
  } catch (error) {
    console.error('Failed to create multisig account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create multisig account',
    };
  }
}

/**
 * EXPORT_OUR_XPUB - Export our xpub for sharing with co-signers
 *
 * Payload: { config: MultisigConfig, addressType: MultisigAddressType, accountIndex: number }
 * Returns: { xpub: string, fingerprint: string }
 */
async function handleExportOurXpub(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleExportOurXpub called with payload:', payload);

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.config || !payload.addressType) {
      return {
        success: false,
        error: 'Config and addressType are required',
      };
    }

    const { config, addressType, accountIndex = 0 } = payload;

    // Get master node
    const masterNode = state.hdWallet!.getMasterNode();

    // Export xpub
    const { xpub, fingerprint, derivationPath } = multisigManager.exportOurXpub(
      masterNode,
      config,
      addressType,
      accountIndex
    );

    console.log(`Exported xpub for ${config} account ${accountIndex}: ${xpub.substring(0, 20)}...`);

    return {
      success: true,
      data: { xpub, fingerprint, derivationPath },
    };
  } catch (error) {
    console.error('Failed to export xpub:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export xpub',
    };
  }
}

/**
 * IMPORT_COSIGNER_XPUB - Import co-signer's xpub
 *
 * Payload: { xpub: string, name?: string }
 * Returns: { fingerprint: string, derivationPath: string, valid: boolean }
 */
async function handleImportCosignerXpub(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleImportCosignerXpub called');

    // Validate payload
    if (!payload || !payload.xpub) {
      return {
        success: false,
        error: 'xpub is required',
      };
    }

    const { xpub, name = '' } = payload;

    // Import and validate the xpub
    const cosignerData = multisigManager.importCosignerXpub(xpub, name);

    console.log(`Imported cosigner xpub: ${name || '(no name)'} (${cosignerData.fingerprint})`);

    return {
      success: true,
      data: {
        fingerprint: cosignerData.fingerprint,
        valid: true,
      },
    };
  } catch (error) {
    console.error('Failed to import cosigner xpub:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import cosigner xpub',
    };
  }
}

/**
 * BUILD_MULTISIG_TRANSACTION - Create unsigned PSBT for multisig transaction
 *
 * Payload: {
 *   accountIndex: number,
 *   toAddress: string,
 *   amount: number,
 *   feeRate: number
 * }
 * Returns: { psbtBase64: string, txid: string }
 */
async function handleBuildMultisigTransaction(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleBuildMultisigTransaction called with payload:', payload);

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    if (!payload.toAddress || typeof payload.toAddress !== 'string') {
      return {
        success: false,
        error: 'Recipient address is required',
      };
    }

    if (!payload.amount || typeof payload.amount !== 'number' || payload.amount <= 0) {
      return {
        success: false,
        error: 'Valid amount is required',
      };
    }

    if (!payload.feeRate || typeof payload.feeRate !== 'number' || payload.feeRate <= 0) {
      return {
        success: false,
        error: 'Valid fee rate is required',
      };
    }

    const { accountIndex, toAddress, amount, feeRate } = payload;

    // Get wallet and find the multisig account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts.find(a => a.index === accountIndex);

    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    if (account.accountType !== 'multisig') {
      return {
        success: false,
        error: 'Account is not a multisig account',
      };
    }

    const multisigAccount = account as MultisigAccount;

    // Get all addresses for the account
    const addresses = multisigAccount.addresses.map(a => a.address);

    if (addresses.length === 0) {
      return {
        success: false,
        error: 'No addresses found in multisig account',
      };
    }

    // Fetch UTXOs for all addresses
    console.log(`Fetching UTXOs for ${addresses.length} multisig addresses...`);
    const utxoArrays = await Promise.all(
      addresses.map(addr => blockstreamClient.getUTXOs(addr))
    );
    const allUtxos = utxoArrays.flat();

    console.log(`Found ${allUtxos.length} UTXOs`);

    if (allUtxos.length === 0) {
      return {
        success: false,
        error: 'No UTXOs available for spending',
      };
    }

    // PRIVACY FIX: Generate unique change address for this transaction
    // Uses internal chain (m/.../1/x) to prevent transaction linking
    const changeAddress = await getOrGenerateMultisigChangeAddress(accountIndex);

    // Get M and N from config
    const configDetails = multisigManager.getConfigDetails(multisigAccount.multisigConfig);

    // Build unsigned PSBT
    console.log(`Building multisig transaction: ${amount} sats to ${toAddress}, fee rate: ${feeRate} sat/vB`);

    const psbt = await transactionBuilder.buildMultisigPSBT({
      multisigAddresses: multisigAccount.addresses,
      utxos: allUtxos,
      outputs: [{ address: toAddress, amount }],
      changeAddress,
      feeRate,
      m: configDetails.m,
      n: configDetails.n,
      addressType: multisigAccount.addressType,
    });

    // Export PSBT
    const exported = psbtManager.exportPSBT(psbt);

    console.log(`Built multisig PSBT: ${exported.txid}, fee: ${exported.fee} sats`);

    return {
      success: true,
      data: {
        psbtBase64: exported.base64,
        txid: exported.txid,
      },
    };
  } catch (error) {
    console.error('Failed to build multisig transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to build multisig transaction',
    };
  }
}

/**
 * SIGN_MULTISIG_TRANSACTION - Sign a PSBT with our key
 *
 * Payload: { psbtBase64: string, accountIndex: number }
 * Returns: { psbtBase64: string, signaturesAdded: number }
 */
async function handleSignMultisigTransaction(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleSignMultisigTransaction called');

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.psbtBase64 || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'psbtBase64 and accountIndex are required',
      };
    }

    const { psbtBase64, accountIndex } = payload;

    // Import PSBT
    const importResult = psbtManager.importPSBT(psbtBase64);
    if (!importResult.isValid) {
      return {
        success: false,
        error: `Invalid PSBT: ${importResult.warnings.join(', ')}`,
      };
    }

    const psbt = importResult.psbt;

    // Get wallet and find the multisig account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts.find(a => a.index === accountIndex);

    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    if (account.accountType !== 'multisig') {
      return {
        success: false,
        error: 'Account is not a multisig account',
      };
    }

    const multisigAccount = account as MultisigAccount;

    // Get all cosigner public keys (sorted)
    const configDetails = multisigManager.getConfigDetails(multisigAccount.multisigConfig);
    const cosignerPubkeys: Buffer[] = [];

    for (const cosigner of multisigAccount.cosigners) {
      // Derive public key from xpub
      // For simplicity, we derive from the account-level xpub
      const xpubNode = state.hdWallet!.derivePath(cosigner.derivationPath);
      cosignerPubkeys.push(xpubNode.publicKey);
    }

    // Get our private key
    const ourCosigner = multisigAccount.cosigners.find(c => c.isSelf);
    if (!ourCosigner) {
      return {
        success: false,
        error: 'Could not find our cosigner info in account',
      };
    }

    const ourNode = state.hdWallet!.derivePath(ourCosigner.derivationPath);
    if (!ourNode.privateKey) {
      return {
        success: false,
        error: 'Failed to derive private key',
      };
    }

    // Track private key for cleanup
    const privateKeyBuffer = ourNode.privateKey;

    try {
      // Sign the PSBT
      console.log('Signing multisig PSBT...');
      const signedPsbt = await transactionBuilder.signMultisigPSBT(
        psbt,
        cosignerPubkeys,
        privateKeyBuffer
      );

      // Count signatures added
      const signatureCounts = TransactionBuilder.countSignatures(signedPsbt);
      const totalSignatures = signatureCounts.reduce((sum, count) => sum + count, 0);

      console.log(`Signed multisig PSBT. Total signatures: ${totalSignatures}`);

      // Export signed PSBT
      const exported = psbtManager.exportPSBT(signedPsbt);

      return {
        success: true,
        data: {
          psbtBase64: exported.base64,
          signaturesAdded: totalSignatures,
        },
      };
    } finally {
      // SECURITY FIX HIGH-2: Clear private key from memory
      if (privateKeyBuffer) {
        privateKeyBuffer.fill(0);
      }
    }
  } catch (error) {
    console.error('Failed to sign multisig transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign multisig transaction',
    };
  }
}

/**
 * EXPORT_PSBT - Export PSBT in various formats
 *
 * Payload: { psbtBase64: string, format: 'base64' | 'hex' | 'qr' }
 * Returns: { export: PSBTExport }
 */
async function handleExportPSBT(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleExportPSBT called');

    // Validate payload
    if (!payload || !payload.psbtBase64) {
      return {
        success: false,
        error: 'psbtBase64 is required',
      };
    }

    const { psbtBase64, format = 'base64' } = payload;

    // Import PSBT
    const importResult = psbtManager.importPSBT(psbtBase64);
    if (!importResult.isValid) {
      return {
        success: false,
        error: `Invalid PSBT: ${importResult.warnings.join(', ')}`,
      };
    }

    const psbt = importResult.psbt;

    // Export based on format
    let exportData: any;

    switch (format) {
      case 'base64':
      case 'hex':
        exportData = psbtManager.exportPSBT(psbt);
        break;

      case 'qr':
        // For QR codes, split into chunks
        const chunks = psbtManager.createPSBTChunks(psbt);
        exportData = {
          ...psbtManager.exportPSBT(psbt),
          chunks,
        };
        break;

      default:
        return {
          success: false,
          error: `Unsupported export format: ${format}`,
        };
    }

    console.log(`Exported PSBT in ${format} format`);

    return {
      success: true,
      data: { export: exportData },
    };
  } catch (error) {
    console.error('Failed to export PSBT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export PSBT',
    };
  }
}

/**
 * IMPORT_PSBT - Import PSBT from external source
 *
 * Payload: { psbtString: string }
 * Returns: { psbt: PSBTImportResult }
 */
async function handleImportPSBT(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleImportPSBT called');

    // Validate payload
    if (!payload || !payload.psbtString) {
      return {
        success: false,
        error: 'psbtString is required',
      };
    }

    const { psbtString } = payload;

    // Import and validate PSBT
    const importResult = psbtManager.importPSBT(psbtString);

    console.log(`Imported PSBT: ${importResult.txid}, valid: ${importResult.isValid}`);

    if (importResult.warnings.length > 0) {
      console.warn('PSBT import warnings:', importResult.warnings);
    }

    return {
      success: true,
      data: {
        psbt: {
          txid: importResult.txid,
          isValid: importResult.isValid,
          warnings: importResult.warnings,
        },
      },
    };
  } catch (error) {
    console.error('Failed to import PSBT:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import PSBT',
    };
  }
}

/**
 * GET_PENDING_MULTISIG_TXS - Get all pending multisig transactions
 *
 * Payload: { accountIndex?: number, password: string }
 * Returns: { pendingTxs: PendingMultisigTx[] }
 */
async function handleGetPendingMultisigTxs(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleGetPendingMultisigTxs called');

    // Validate password for decryption
    if (!payload || !payload.password || typeof payload.password !== 'string') {
      return {
        success: false,
        error: 'Password is required to decrypt PSBTs',
      };
    }

    const { CryptoUtils } = await import('./wallet/CryptoUtils');

    // Get wallet
    const wallet = await WalletStorage.getWallet();

    // Check if wallet supports multisig (v2)
    if (wallet.version !== 2) {
      return {
        success: true,
        data: { pendingTxs: [] },
      };
    }

    const walletV2 = wallet as any; // StoredWalletV2
    let pendingTxs = walletV2.pendingMultisigTxs || [];

    // Filter by account index if provided
    if (payload && typeof payload.accountIndex === 'number') {
      pendingTxs = pendingTxs.filter((tx: any) => tx.accountId === payload.accountIndex);
    }

    // SECURITY FIX HIGH-4: Decrypt PSBTs before returning
    const decryptedTxs = await Promise.all(
      pendingTxs.map(async (tx: any) => {
        try {
          // Decrypt PSBT if encrypted (check for salt and IV)
          if (tx.psbtSalt && tx.psbtIv) {
            const decryptedPsbt = await CryptoUtils.decrypt(
              tx.psbtBase64,
              payload.password,
              tx.psbtSalt,
              tx.psbtIv
            );
            // Return with decrypted PSBT, remove encryption metadata
            const { psbtSalt, psbtIv, ...rest } = tx;
            return { ...rest, psbtBase64: decryptedPsbt };
          }
          // Return as-is if not encrypted (backward compatibility)
          return tx;
        } catch (error) {
          console.error(`Failed to decrypt PSBT ${tx.id}:`, error);
          // Return tx with error indicator
          return { ...tx, decryptionError: true };
        }
      })
    );

    console.log(`Found ${decryptedTxs.length} pending multisig transactions`);

    return {
      success: true,
      data: { pendingTxs: decryptedTxs },
    };
  } catch (error) {
    console.error('Failed to get pending multisig transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pending multisig transactions',
    };
  }
}

/**
 * SAVE_PENDING_MULTISIG_TX - Save PSBT for later
 *
 * Payload: { psbtBase64: string, accountIndex: number, metadata: { amount: number, recipient: string, fee: number } }
 * Returns: { pendingTx: PendingMultisigTx }
 */
async function handleSavePendingMultisigTx(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleSavePendingMultisigTx called');

    // Validate payload
    if (!payload || !payload.psbtBase64 || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'psbtBase64 and accountIndex are required',
      };
    }

    if (!payload.metadata || !payload.metadata.amount || !payload.metadata.recipient) {
      return {
        success: false,
        error: 'metadata with amount and recipient is required',
      };
    }

    const { psbtBase64, accountIndex, metadata, password } = payload;

    // Validate password for encryption
    if (!password || typeof password !== 'string') {
      return {
        success: false,
        error: 'Password is required to encrypt PSBT',
      };
    }

    // Import PSBT to validate and get txid
    const importResult = psbtManager.importPSBT(psbtBase64);
    if (!importResult.isValid) {
      return {
        success: false,
        error: `Invalid PSBT: ${importResult.warnings.join(', ')}`,
      };
    }

    // Get wallet and account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts.find(a => a.index === accountIndex);

    if (!account) {
      return {
        success: false,
        error: `Account with index ${accountIndex} not found`,
      };
    }

    if (account.accountType !== 'multisig') {
      return {
        success: false,
        error: 'Account is not a multisig account',
      };
    }

    const multisigAccount = account as MultisigAccount;
    const configDetails = multisigManager.getConfigDetails(multisigAccount.multisigConfig);

    // Get signature status for each cosigner
    const signatureCounts = TransactionBuilder.countSignatures(importResult.psbt);
    const signatureStatus: PendingMultisigTx['signatureStatus'] = {};

    for (const cosigner of multisigAccount.cosigners) {
      signatureStatus[cosigner.fingerprint] = {
        signed: false, // We'll need to check if their signature is present
        cosignerName: cosigner.name,
      };
    }

    // SECURITY FIX HIGH-4: Encrypt PSBT before storage
    const { CryptoUtils } = await import('./wallet/CryptoUtils');
    const encryptedPsbtData = await CryptoUtils.encrypt(psbtBase64, password);

    // Create pending transaction record with encrypted PSBT
    const pendingTx: PendingMultisigTx = {
      id: importResult.txid,
      accountId: accountIndex,
      psbtBase64: encryptedPsbtData.encryptedData,
      // Store encryption metadata for decryption
      psbtSalt: encryptedPsbtData.salt,
      psbtIv: encryptedPsbtData.iv,
      created: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      multisigConfig: multisigAccount.multisigConfig,
      signaturesCollected: Math.max(...signatureCounts, 0),
      signaturesRequired: configDetails.m,
      signatureStatus,
      metadata: {
        amount: metadata.amount,
        recipient: metadata.recipient,
        fee: metadata.fee || 0,
      },
    } as any; // Cast to any to allow additional fields

    // Check if wallet supports multisig (v2)
    if (wallet.version !== 2) {
      return {
        success: false,
        error: 'Wallet does not support multisig transactions',
      };
    }

    const walletV2 = wallet as any; // StoredWalletV2

    // Initialize pending transactions array if needed
    if (!walletV2.pendingMultisigTxs) {
      walletV2.pendingMultisigTxs = [];
    }

    // Check if transaction already exists
    const existingIndex = walletV2.pendingMultisigTxs.findIndex(
      (tx: PendingMultisigTx) => tx.id === pendingTx.id
    );

    if (existingIndex >= 0) {
      // Update existing transaction
      walletV2.pendingMultisigTxs[existingIndex] = pendingTx;
    } else {
      // Add new transaction
      walletV2.pendingMultisigTxs.push(pendingTx);
    }

    // Save updated wallet
    await chrome.storage.local.set({ wallet: walletV2 });

    console.log(`Saved pending multisig transaction: ${pendingTx.id}`);

    return {
      success: true,
      data: { pendingTx },
    };
  } catch (error) {
    console.error('Failed to save pending multisig transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save pending multisig transaction',
    };
  }
}

/**
 * DELETE_PENDING_MULTISIG_TX - Remove pending transaction
 *
 * Payload: { txid: string }
 * Returns: { success: boolean }
 */
async function handleDeletePendingMultisigTx(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleDeletePendingMultisigTx called');

    // Validate payload
    if (!payload || !payload.txid) {
      return {
        success: false,
        error: 'txid is required',
      };
    }

    const { txid } = payload;

    // Get wallet
    const wallet = await WalletStorage.getWallet();

    // Check if wallet supports multisig (v2)
    if (wallet.version !== 2) {
      return {
        success: false,
        error: 'Wallet does not support multisig transactions',
      };
    }

    const walletV2 = wallet as any; // StoredWalletV2

    // Find and remove the transaction
    const initialLength = walletV2.pendingMultisigTxs?.length || 0;
    walletV2.pendingMultisigTxs = (walletV2.pendingMultisigTxs || []).filter(
      (tx: PendingMultisigTx) => tx.id !== txid
    );

    const removed = initialLength > (walletV2.pendingMultisigTxs?.length || 0);

    if (!removed) {
      return {
        success: false,
        error: `Pending transaction with txid ${txid} not found`,
      };
    }

    // Save updated wallet
    await chrome.storage.local.set({ wallet: walletV2 });

    console.log(`Deleted pending multisig transaction: ${txid}`);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error('Failed to delete pending multisig transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete pending multisig transaction',
    };
  }
}

/**
 * BROADCAST_MULTISIG_TRANSACTION - Broadcast finalized transaction
 *
 * Payload: { txHex: string }
 * Returns: { txid: string }
 */
async function handleBroadcastMultisigTransaction(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleBroadcastMultisigTransaction called');

    // Validate payload
    if (!payload || !payload.txHex) {
      return {
        success: false,
        error: 'txHex is required',
      };
    }

    const { txHex } = payload;

    // Broadcast the transaction
    console.log('Broadcasting multisig transaction...');
    const txid = await blockstreamClient.broadcastTransaction(txHex);

    console.log(`Multisig transaction broadcast successful: ${txid}`);

    return {
      success: true,
      data: { txid },
    };
  } catch (error) {
    console.error('Failed to broadcast multisig transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to broadcast multisig transaction',
    };
  }
}

/**
 * GENERATE_MULTISIG_ADDRESS - Generate first multisig receiving address
 *
 * Payload: {
 *   config: MultisigConfig,
 *   addressType: MultisigAddressType,
 *   cosignerXpubs: Array<{ name: string, xpub: string, fingerprint: string }>
 * }
 * Returns: { address: string, derivationPath: string, redeemScript?: string, witnessScript?: string }
 */
async function handleGenerateMultisigAddress(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleGenerateMultisigAddress called with payload:', payload);

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.config || !payload.addressType) {
      return {
        success: false,
        error: 'Config and addressType are required',
      };
    }

    if (!Array.isArray(payload.cosignerXpubs)) {
      return {
        success: false,
        error: 'cosignerXpubs must be an array',
      };
    }

    const { config, addressType, cosignerXpubs } = payload;

    console.log(`[DEBUG] Config: ${config}, AddressType: ${addressType}`);
    console.log(`[DEBUG] Cosigner xpubs received:`, cosignerXpubs);

    // Get M and N from config
    const configDetails = multisigManager.getConfigDetails(config);

    // Export our xpub (using temp account index 0 since account not created yet)
    const masterNode = state.hdWallet!.getMasterNode();
    const { xpub: ourXpub, fingerprint: ourFingerprint } = multisigManager.exportOurXpub(
      masterNode,
      config,
      addressType,
      0 // Temporary account index for preview
    );

    console.log(`[DEBUG] Our xpub: ${ourXpub.substring(0, 20)}..., fingerprint: ${ourFingerprint}`);

    // CRITICAL VALIDATION: Check if user accidentally imported their own xpub as a cosigner
    for (const cosigner of cosignerXpubs) {
      if (cosigner.fingerprint === ourFingerprint) {
        console.error(`[ERROR] Duplicate fingerprint detected: ${cosigner.fingerprint}`);
        console.error(`[ERROR] Cosigner "${cosigner.name}" has the same fingerprint as your wallet!`);
        return {
          success: false,
          error: `Cannot use your own xpub as a cosigner. Cosigner "${cosigner.name}" (fingerprint: ${cosigner.fingerprint}) matches your wallet's fingerprint. Please import xpubs from other co-signers only.`,
        };
      }
    }

    // Get derivation path for first address (external, index 0)
    const basePath = multisigManager.getDerivationPath(config, addressType, 0);

    console.log(`[DEBUG] Base derivation path: ${basePath}`);

    // Derive the first address: base_path/0/0 (external chain, index 0)
    const firstAddressPath = `${basePath}/0/0`;

    // Collect all public keys (ours + cosigners)
    const allXpubs = [
      { xpub: ourXpub, fingerprint: ourFingerprint, name: 'You', isSelf: true },
      ...cosignerXpubs,
    ];

    console.log(`[DEBUG] Total xpubs to process: ${allXpubs.length}`);
    console.log(`[DEBUG] All xpubs:`, allXpubs.map(x => ({ name: x.name, fingerprint: x.fingerprint, xpub: x.xpub.substring(0, 20) + '...' })));

    // Derive public keys at the address level for all co-signers
    const publicKeys: Buffer[] = [];
    for (const cosigner of allXpubs) {
      let addressNode: BIP32Interface;

      console.log(`[DEBUG] Processing cosigner: ${cosigner.name}, isSelf: ${cosigner.isSelf}`);
      console.log(`[DEBUG] Cosigner xpub: ${cosigner.xpub.substring(0, 20)}...`);

      if (cosigner.isSelf) {
        // For ourselves, derive from our HD wallet
        const xpubNode = state.hdWallet!.derivePath(basePath);
        addressNode = xpubNode.derive(0).derive(0); // External/index 0
      } else {
        // For cosigners, parse their xpub and derive from it
        const cosignerXpubNode = bip32.fromBase58(cosigner.xpub, transactionBuilder['network']);
        addressNode = cosignerXpubNode.derive(0).derive(0); // External/index 0
      }

      const pubkeyHex = addressNode.publicKey.toString('hex');
      console.log(`[DEBUG] Derived public key: ${pubkeyHex.substring(0, 20)}...${pubkeyHex.substring(pubkeyHex.length - 20)}`);
      publicKeys.push(addressNode.publicKey);
    }

    console.log(`[DEBUG] Total public keys collected: ${publicKeys.length}`);
    console.log(`[DEBUG] All pubkeys: ${publicKeys.map(pk => pk.toString('hex').substring(0, 16) + '...').join(', ')}`);

    // Generate multisig address with metadata using AddressGenerator
    const multisigAddress = state.addressGenerator!.generateMultisigAddressWithMetadata(
      publicKeys,
      configDetails.m,
      addressType,
      firstAddressPath,
      0, // address index 0
      false // not change address
    );

    console.log(`Generated first multisig address: ${multisigAddress.address}`);

    return {
      success: true,
      data: {
        address: multisigAddress.address,
        derivationPath: firstAddressPath,
        redeemScript: multisigAddress.redeemScript,
        witnessScript: multisigAddress.witnessScript,
      },
    };
  } catch (error) {
    console.error('Failed to generate multisig address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate multisig address',
    };
  }
}

// ============================================================================
// CONTACTS MESSAGE HANDLERS
// ============================================================================

/**
 * GET_CONTACTS - Get all contacts with optional sorting
 *
 * Payload: { sortBy?: 'name' | 'date' | 'transactionCount' }
 * Returns: { contacts: Contact[] }
 */
async function handleGetContacts(payload: any): Promise<MessageResponse> {
  try {
    const { sortBy } = payload || {};

    // Get password from unlocked wallet (required for v2 encrypted contacts)
    const password = state.encryptionKey;

    const contacts = await ContactsStorage.getContacts(password, sortBy);

    console.log(`Retrieved ${contacts.length} contacts`);

    return {
      success: true,
      data: { contacts },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get contacts';

    // Expected error when wallet is locked (password required) - use debug level
    if (errorMessage.includes('Password required to decrypt contacts')) {
      console.debug('Failed to get contacts (wallet locked):', errorMessage);
    } else {
      // Unexpected errors (corruption, crypto failures) - use error level
      console.error('Failed to get contacts:', error);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * GET_CONTACT_BY_ID - Get a single contact by ID
 *
 * Payload: { id: string }
 * Returns: { contact: Contact }
 */
async function handleGetContactById(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.id) {
      return {
        success: false,
        error: 'Contact ID is required',
      };
    }

    const { id } = payload;

    // Get password from unlocked wallet (required for v2 encrypted contacts)
    const password = state.encryptionKey;

    const contact = await ContactsStorage.getContactById(id, password);

    if (!contact) {
      return {
        success: false,
        error: `Contact with ID ${id} not found`,
      };
    }

    console.log(`Retrieved contact: ${contact.name}`);

    return {
      success: true,
      data: { contact },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get contact';

    // Expected error when wallet is locked (password required) - use debug level
    if (errorMessage.includes('Password required to decrypt contacts')) {
      console.debug('Failed to get contact by ID (wallet locked):', errorMessage);
    } else {
      // Unexpected errors (corruption, crypto failures) - use error level
      console.error('Failed to get contact by ID:', error);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * GET_CONTACT_BY_ADDRESS - Get contact by Bitcoin address
 *
 * Payload: { address: string }
 * Returns: { contact: Contact | null }
 */
async function handleGetContactByAddress(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.address) {
      return {
        success: false,
        error: 'Bitcoin address is required',
      };
    }

    const { address } = payload;

    // Get password from unlocked wallet (required for v2 encrypted contacts)
    const password = state.encryptionKey;

    const contact = await ContactsStorage.getContactByAddress(address, password);

    if (contact) {
      console.log(`Found contact for address ${address}: ${contact.name}`);
    } else {
      console.log(`No contact found for address ${address}`);
    }

    return {
      success: true,
      data: { contact },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get contact';

    // Expected error when wallet is locked (password required) - use debug level
    if (errorMessage.includes('Password required to decrypt contacts')) {
      console.debug('Failed to get contact by address (wallet locked):', errorMessage);
    } else {
      // Unexpected errors (corruption, crypto failures) - use error level
      console.error('Failed to get contact by address:', error);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * SEARCH_CONTACTS - Search contacts by name
 *
 * Payload: { query: string }
 * Returns: { contacts: Contact[] }
 */
async function handleSearchContacts(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.query) {
      return {
        success: false,
        error: 'Search query is required',
      };
    }

    const { query } = payload;

    // Get password from unlocked wallet (required for v2 encrypted contacts)
    const password = state.encryptionKey;

    const contacts = await ContactsStorage.searchContacts(query, password);

    console.log(`Found ${contacts.length} contacts matching "${query}"`);

    return {
      success: true,
      data: { contacts },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to search contacts';

    // Expected error when wallet is locked (password required) - use debug level
    if (errorMessage.includes('Password required to decrypt contacts')) {
      console.debug('Failed to search contacts (wallet locked):', errorMessage);
    } else {
      // Unexpected errors (corruption, crypto failures) - use error level
      console.error('Failed to search contacts:', error);
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * ADD_CONTACT - Add a new contact to address book
 *
 * Payload: {
 *   name: string,
 *   address?: string,
 *   xpub?: string,
 *   email?: string,
 *   notes?: string,
 *   category?: string,
 *   color?: ContactColor
 * }
 * Note: At least one of address or xpub must be provided
 * Returns: { contact: Contact }
 */
async function handleAddContact(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload - name is required, and at least one of address or xpub
    if (!payload || !payload.name) {
      return {
        success: false,
        error: 'Contact name is required',
      };
    }

    if (!payload.address && !payload.xpub) {
      return {
        success: false,
        error: 'Either address or xpub is required',
      };
    }

    const { name, address, xpub, email, notes, category, color } = payload;

    // Get password from unlocked wallet (required for v2 encryption)
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to add contacts',
      };
    }

    // Get network from wallet settings
    const wallet = await WalletStorage.getWallet();
    const network = wallet.settings.network;

    // Add contact using ContactsStorage (includes validation)
    const newContact = await ContactsStorage.addContact(
      {
        name: String(name),
        address: address ? String(address) : undefined,
        xpub: xpub ? String(xpub) : undefined,
        email: email ? String(email) : undefined,
        notes: notes ? String(notes) : undefined,
        category: category ? String(category) : undefined,
        color: color || 'blue',
      },
      password,
      network
    );

    console.log(`Added contact: ${newContact.name} (${newContact.address || newContact.xpub})`);

    return {
      success: true,
      data: { contact: newContact },
    };
  } catch (error) {
    console.error('Failed to add contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add contact',
    };
  }
}

/**
 * UPDATE_CONTACT - Update existing contact
 *
 * Payload: { id: string, updates: Partial<Contact> }
 * Returns: { contact: Contact }
 */
async function handleUpdateContact(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.id || !payload.updates) {
      return {
        success: false,
        error: 'Contact ID and updates are required',
      };
    }

    const { id, updates } = payload;

    // Get password from unlocked wallet (required for v2 encryption)
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to update contacts',
      };
    }

    // Get network from wallet settings
    const wallet = await WalletStorage.getWallet();
    const network = wallet.settings.network;

    // Update contact using ContactsStorage (includes validation)
    const updatedContact = await ContactsStorage.updateContact(id, updates, password, network);

    console.log(`Updated contact: ${updatedContact.name} (${updatedContact.id})`);

    return {
      success: true,
      data: { contact: updatedContact },
    };
  } catch (error) {
    console.error('Failed to update contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    };
  }
}

/**
 * DELETE_CONTACT - Delete contact by ID
 *
 * Payload: { id: string }
 * Returns: { success: boolean }
 */
async function handleDeleteContact(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.id) {
      return {
        success: false,
        error: 'Contact ID is required',
      };
    }

    const { id } = payload;

    await ContactsStorage.deleteContact(id);

    console.log(`Deleted contact: ${id}`);

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error('Failed to delete contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete contact',
    };
  }
}

/**
 * IMPORT_CONTACTS_CSV - Import contacts from CSV data
 *
 * Payload: { csvData: string, options?: ImportOptions }
 * Returns: { result: ImportResult }
 */
async function handleImportContactsCSV(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.csvData) {
      return {
        success: false,
        error: 'CSV data is required',
      };
    }

    const { csvData, options } = payload;

    // Get network from wallet settings
    const wallet = await WalletStorage.getWallet();
    const network = wallet.settings.network;

    // Get password from unlocked wallet (required for v2 encryption)
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to import contacts',
      };
    }

    // Import contacts using ContactsStorage (includes validation)
    const result = await ContactsStorage.importFromCSV(csvData, password, network, options);

    console.log(
      `CSV import complete: ${result.imported} imported, ${result.skipped} skipped, ${result.failed} failed`
    );

    return {
      success: true,
      data: { result },
    };
  } catch (error) {
    console.error('Failed to import contacts from CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import contacts',
    };
  }
}

/**
 * EXPORT_CONTACTS_CSV - Export contacts to CSV format
 *
 * Payload: none
 * Returns: { csvData: string, filename: string }
 */
async function handleExportContactsCSV(payload: any): Promise<MessageResponse> {
  try {
    // Get password from unlocked wallet (required for v2 decryption)
    const password = state.encryptionKey;

    const csvData = await ContactsStorage.exportToCSV(password);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `bitcoin-wallet-contacts-${timestamp}.csv`;

    console.log(`Exported ${csvData.split('\n').length - 1} contacts to CSV`);

    return {
      success: true,
      data: { csvData, filename },
    };
  } catch (error) {
    console.error('Failed to export contacts to CSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export contacts',
    };
  }
}

/**
 * GET_TRANSACTIONS_FOR_CONTACT - Get all transactions involving a contact's address
 *
 * Payload: { contactId: string, accountIndex: number, limit?: number }
 * Returns: { transactions: Transaction[] }
 */
async function handleGetTransactionsForContact(payload: any): Promise<MessageResponse> {
  try {
    // Validate payload
    if (!payload || !payload.contactId || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Contact ID and account index are required',
      };
    }

    const { contactId, accountIndex, limit } = payload;

    // Get the contact
    const contact = await ContactsStorage.getContactById(contactId);
    if (!contact) {
      return {
        success: false,
        error: `Contact with ID ${contactId} not found`,
      };
    }

    // Get all transactions for the account
    const txResponse = await handleGetTransactions({ accountIndex, limit: undefined });
    if (!txResponse.success || !txResponse.data) {
      return {
        success: false,
        error: 'Failed to get transactions',
      };
    }

    const allTransactions = txResponse.data.transactions;

    // Filter transactions that involve the contact's address
    const contactTransactions = allTransactions.filter((tx: Transaction) => {
      // Check if contact address appears in inputs or outputs
      const inInputs = tx.inputs.some(input => input.address === contact.address);
      const inOutputs = tx.outputs.some(output => output.address === contact.address);

      return inInputs || inOutputs;
    });

    // Apply limit if provided
    let filteredTransactions = contactTransactions;
    if (limit && limit > 0) {
      filteredTransactions = contactTransactions.slice(0, limit);
    }

    console.log(
      `Found ${filteredTransactions.length} transactions for contact ${contact.name} (${contact.address})`
    );

    return {
      success: true,
      data: { transactions: filteredTransactions },
    };
  } catch (error) {
    console.error('Failed to get transactions for contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transactions for contact',
    };
  }
}

/**
 * EXPAND_CONTACT_ADDRESSES - Expand cached addresses for xpub contact (20 → 100)
 *
 * Payload: { contactId: string, newGapLimit?: number }
 * Returns: { contact: Contact }
 */
async function handleExpandContactAddresses(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.contactId) {
      return {
        success: false,
        error: 'Contact ID is required',
      };
    }

    const { contactId, newGapLimit = 50 } = payload;

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet is locked',
      };
    }

    // Get network from wallet settings
    const wallet = await WalletStorage.getWallet();
    const network = wallet.settings.network;

    // Expand addresses
    const contact = await ContactsStorage.expandContactAddresses(
      contactId,
      password,
      network,
      newGapLimit
    );

    console.log(`Expanded addresses for contact ${contact.name} to ${contact.cachedAddresses?.length} total addresses`);

    return {
      success: true,
      data: { contact },
    };
  } catch (error) {
    console.error('Failed to expand contact addresses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to expand addresses',
    };
  }
}

// ============================================================================
// CONTACTS PRIVACY TRACKING HANDLERS
// ============================================================================

/**
 * GET_NEXT_CONTACT_ADDRESS - Get next unused address for an xpub contact
 *
 * Payload: { contactId: string }
 * Returns: { address: string, index: number }
 */
async function handleGetNextContactAddress(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.contactId) {
      return {
        success: false,
        error: 'Contact ID is required',
      };
    }

    const { contactId } = payload;

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet is locked',
      };
    }

    // Get contact
    const contacts = await ContactsStorage.getContacts(password);
    const contact = contacts.find(c => c.id === contactId);

    if (!contact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }

    // Verify it's an xpub contact
    if (!contact.xpub || !contact.cachedAddresses) {
      return {
        success: false,
        error: 'Contact is not an xpub contact',
      };
    }

    // Get next unused address index
    const nextIndex = (contact.lastUsedAddressIndex ?? -1) + 1;

    // Check if we have cached addresses at this index
    if (nextIndex >= contact.cachedAddresses.length) {
      return {
        success: false,
        error: `No cached address at index ${nextIndex}. Cache exhausted. Please expand addresses.`,
      };
    }

    const nextAddress = contact.cachedAddresses[nextIndex];

    console.log(`Next unused address for contact ${contact.name}: ${nextAddress} (index ${nextIndex})`);

    return {
      success: true,
      data: {
        address: nextAddress,
        index: nextIndex,
      },
    };
  } catch (error) {
    console.error('Failed to get next contact address:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get next address',
    };
  }
}

/**
 * INCREMENT_CONTACT_USAGE - Track contact address usage for privacy warnings
 *
 * Payload: { contactId: string }
 * Returns: { contact: Contact }
 */
async function handleIncrementContactUsage(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.contactId) {
      return {
        success: false,
        error: 'Contact ID is required',
      };
    }

    const { contactId } = payload;

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet is locked',
      };
    }

    // Get contact
    const contacts = await ContactsStorage.getContacts(password);
    const contact = contacts.find(c => c.id === contactId);

    if (!contact) {
      return {
        success: false,
        error: 'Contact not found',
      };
    }

    // Update privacy tracking fields
    if (contact.xpub) {
      // For xpub contacts: increment lastUsedAddressIndex
      const currentIndex = contact.lastUsedAddressIndex ?? -1;
      contact.lastUsedAddressIndex = currentIndex + 1;
      console.log(`Incremented xpub contact ${contact.name} address index to ${contact.lastUsedAddressIndex}`);
    } else {
      // For single-address contacts: increment reusageCount
      contact.reusageCount = (contact.reusageCount ?? 0) + 1;
      console.log(`Incremented single-address contact ${contact.name} reusage count to ${contact.reusageCount}`);
    }

    // Update timestamp
    contact.updatedAt = Date.now();

    // Save updated contact
    await ContactsStorage.updateContact(contactId, contact, password);

    return {
      success: true,
      data: { contact },
    };
  } catch (error) {
    console.error('Failed to increment contact usage:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update contact',
    };
  }
}

// ============================================================================
// CONTACTS MIGRATION HANDLERS (v1 → v2)
// ============================================================================

/**
 * GET_CONTACTS_MIGRATION_STATUS - Check if contacts need migration
 *
 * Payload: none
 * Returns: { needsMigration: boolean, currentVersion: 1 | 2, contactCount: number, hasBackup: boolean }
 */
async function handleGetContactsMigrationStatus(payload: any): Promise<MessageResponse> {
  try {
    const status = await ContactsStorage.getMigrationStatus();

    console.log('Contacts migration status:', status);

    return {
      success: true,
      data: status,
    };
  } catch (error) {
    console.error('Failed to get migration status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get migration status',
    };
  }
}

/**
 * MIGRATE_CONTACTS_V1_TO_V2 - Migrate contacts from v1 (plaintext) to v2 (encrypted)
 *
 * Payload: none (uses unlocked wallet password)
 * Returns: { success: boolean, contactsProcessed: number, errors: string[] }
 */
async function handleMigrateContactsV1ToV2(payload: any): Promise<MessageResponse> {
  try {
    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to migrate contacts',
      };
    }

    console.log('Starting contacts v1 → v2 migration...');

    const result = await ContactsStorage.migrateV1ToV2(password);

    console.log(
      `Migration complete: ${result.contactsProcessed} contacts processed, ${result.errors.length} errors`
    );

    if (result.errors.length > 0) {
      console.error('Migration errors:', result.errors);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
    };
  }
}

/**
 * VERIFY_CONTACTS_MIGRATION - Verify migration integrity
 *
 * Payload: none
 * Returns: { valid: boolean }
 */
async function handleVerifyContactsMigration(payload: any): Promise<MessageResponse> {
  try {
    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to verify migration',
      };
    }

    const isValid = await ContactsStorage.verifyMigrationIntegrity(password);

    console.log(`Migration integrity check: ${isValid ? 'PASSED' : 'FAILED'}`);

    return {
      success: true,
      data: { valid: isValid },
    };
  } catch (error) {
    console.error('Failed to verify migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
  }
}

/**
 * ROLLBACK_CONTACTS_MIGRATION - Rollback migration (restore v1 backup)
 *
 * Payload: none
 * Returns: { success: boolean, contactsRestored: number, error?: string }
 */
async function handleRollbackContactsMigration(payload: any): Promise<MessageResponse> {
  try {
    console.log('Rolling back contacts migration...');

    const result = await ContactsStorage.rollbackMigration();

    if (result.success) {
      console.log(`Rollback successful: ${result.contactsRestored} contacts restored`);
    } else {
      console.error(`Rollback failed: ${result.error}`);
    }

    return {
      success: result.success,
      data: result,
    };
  } catch (error) {
    console.error('Failed to rollback migration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Rollback failed',
    };
  }
}

/**
 * DELETE_CONTACTS_BACKUP - Delete v1 backup after successful migration
 *
 * Payload: none
 * Returns: { success: boolean }
 */
async function handleDeleteContactsBackup(payload: any): Promise<MessageResponse> {
  try {
    await ContactsStorage.deleteBackup();

    console.log('Deleted contacts v1 backup');

    return {
      success: true,
      data: {},
    };
  } catch (error) {
    console.error('Failed to delete backup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete backup',
    };
  }
}

// ============================================================================
// TRANSACTION METADATA MANAGEMENT HANDLERS
// ============================================================================

/**
 * GET_TRANSACTION_METADATA - Get metadata for a single transaction
 *
 * Payload: { txid: string }
 * Returns: { metadata: TransactionMetadata | null }
 */
async function handleGetTransactionMetadata(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.txid) {
      return {
        success: false,
        error: 'Transaction ID is required',
      };
    }

    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction metadata',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction metadata',
      };
    }

    const metadata = await TransactionMetadataStorage.getMetadata(payload.txid, password);

    return {
      success: true,
      data: { metadata },
    };
  } catch (error) {
    console.error('Failed to get transaction metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction metadata',
    };
  }
}

/**
 * GET_ALL_TRANSACTION_METADATA - Get all transaction metadata (bulk fetch)
 *
 * Payload: none
 * Returns: { metadata: { [txid: string]: TransactionMetadata } }
 */
async function handleGetAllTransactionMetadata(payload: any): Promise<MessageResponse> {
  try {
    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction metadata',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction metadata',
      };
    }

    const metadata = await TransactionMetadataStorage.getAllMetadata(password);

    return {
      success: true,
      data: { metadata },
    };
  } catch (error) {
    console.error('Failed to get all transaction metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all transaction metadata',
    };
  }
}

/**
 * SET_TRANSACTION_METADATA - Set or update metadata for a transaction
 *
 * Payload: { txid: string, tags: string[], category?: string, notes?: string }
 * Returns: { success: boolean }
 */
async function handleSetTransactionMetadata(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.txid) {
      return {
        success: false,
        error: 'Transaction ID is required',
      };
    }

    if (!payload.tags || !Array.isArray(payload.tags)) {
      return {
        success: false,
        error: 'Tags array is required',
      };
    }

    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to edit transaction metadata',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to edit transaction metadata',
      };
    }

    const { txid, tags, category, notes } = payload;

    await TransactionMetadataStorage.setMetadata(
      txid,
      { tags, category, notes },
      password
    );

    console.log(`Updated metadata for transaction ${txid}`);

    return {
      success: true,
      data: {},
    };
  } catch (error) {
    console.error('Failed to set transaction metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to set transaction metadata',
    };
  }
}

/**
 * DELETE_TRANSACTION_METADATA - Delete metadata for a transaction
 *
 * Payload: { txid: string }
 * Returns: { success: boolean }
 */
async function handleDeleteTransactionMetadata(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.txid) {
      return {
        success: false,
        error: 'Transaction ID is required',
      };
    }

    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to delete transaction metadata',
      };
    }

    await TransactionMetadataStorage.deleteMetadata(payload.txid);

    console.log(`Deleted metadata for transaction ${payload.txid}`);

    return {
      success: true,
      data: {},
    };
  } catch (error) {
    console.error('Failed to delete transaction metadata:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete transaction metadata',
    };
  }
}

/**
 * GET_ALL_TRANSACTION_TAGS - Get all unique tags across all transactions
 *
 * Payload: none
 * Returns: { tags: Array<{ tag: string, count: number }> }
 */
async function handleGetAllTransactionTags(payload: any): Promise<MessageResponse> {
  try {
    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction tags',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction tags',
      };
    }

    const tags = await TransactionMetadataStorage.getAllTags(password);

    return {
      success: true,
      data: { tags },
    };
  } catch (error) {
    console.error('Failed to get all transaction tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all transaction tags',
    };
  }
}

/**
 * GET_ALL_TRANSACTION_CATEGORIES - Get all unique categories across all transactions
 *
 * Payload: none
 * Returns: { categories: Array<{ category: string, count: number }> }
 */
async function handleGetAllTransactionCategories(payload: any): Promise<MessageResponse> {
  try {
    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction categories',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to view transaction categories',
      };
    }

    const categories = await TransactionMetadataStorage.getAllCategories(password);

    return {
      success: true,
      data: { categories },
    };
  } catch (error) {
    console.error('Failed to get all transaction categories:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get all transaction categories',
    };
  }
}

/**
 * SEARCH_TRANSACTIONS_BY_TAG - Search transactions by tag
 *
 * Payload: { tag: string }
 * Returns: { txids: string[] }
 */
async function handleSearchTransactionsByTag(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.tag) {
      return {
        success: false,
        error: 'Tag is required',
      };
    }

    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to search transactions',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to search transactions',
      };
    }

    const txids = await TransactionMetadataStorage.searchByTag(payload.tag, password);

    return {
      success: true,
      data: { txids },
    };
  } catch (error) {
    console.error('Failed to search transactions by tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search transactions by tag',
    };
  }
}

/**
 * SEARCH_TRANSACTIONS_BY_CATEGORY - Search transactions by category
 *
 * Payload: { category: string }
 * Returns: { txids: string[] }
 */
async function handleSearchTransactionsByCategory(payload: any): Promise<MessageResponse> {
  try {
    if (!payload || !payload.category) {
      return {
        success: false,
        error: 'Category is required',
      };
    }

    // Check wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet must be unlocked to search transactions',
      };
    }

    // Get password from unlocked wallet
    const password = state.encryptionKey;
    if (!password) {
      return {
        success: false,
        error: 'Wallet must be unlocked to search transactions',
      };
    }

    const txids = await TransactionMetadataStorage.searchByCategory(payload.category, password);

    return {
      success: true,
      data: { txids },
    };
  } catch (error) {
    console.error('Failed to search transactions by category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search transactions by category',
    };
  }
}

// ============================================================================
// WIZARD SESSION MANAGEMENT HANDLERS
// ============================================================================

/**
 * WIZARD_OPEN - Open wizard in new tab or focus existing wizard tab
 *
 * Payload: none
 * Returns: { success: boolean }
 */
async function handleWizardOpen(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleWizardOpen called');

    // Check for existing session
    const existingSession = await WizardSessionStorage.getActiveSession();

    if (existingSession && existingSession.tabId) {
      // Existing wizard tab - try to focus it
      try {
        await chrome.tabs.update(existingSession.tabId, { active: true });
        console.log('Focused existing wizard tab:', existingSession.tabId);
        return {
          success: true,
          data: { message: 'Focused existing wizard tab' },
        };
      } catch (error) {
        // Tab might have been closed but session wasn't cleaned up
        // Clean up the stale session and create new tab
        console.warn('Failed to focus existing tab, creating new one:', error);
        await WizardSessionStorage.deleteSession();
      }
    }

    // No existing session or failed to focus - create new wizard tab
    const tab = await chrome.tabs.create({
      url: chrome.runtime.getURL('wizard.html'),
      active: true,
    });

    console.log('Created new wizard tab:', tab.id);

    return {
      success: true,
      data: { message: 'Opened new wizard tab', tabId: tab.id },
    };
  } catch (error) {
    console.error('Failed to open wizard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open wizard',
    };
  }
}

/**
 * WIZARD_INIT - Initialize wizard session or recover existing session
 *
 * Payload: { tabId: number }
 * Returns: { session: WizardSessionData | null, isRecovery: boolean }
 */
async function handleWizardInit(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleWizardInit called with payload:', payload);

    // Validate payload
    if (!payload || typeof payload.tabId !== 'number') {
      return {
        success: false,
        error: 'Tab ID is required',
      };
    }

    const { tabId } = payload;

    // Check for existing session
    const existingSession = await WizardSessionStorage.getActiveSession();

    if (existingSession) {
      // Check if it's the same tab
      if (existingSession.tabId === tabId) {
        console.log('Recovering existing wizard session for same tab');
        return {
          success: true,
          data: {
            session: existingSession,
            isRecovery: true,
          },
        };
      } else {
        // Different tab - session already active elsewhere
        return {
          success: false,
          error: 'A wizard session is already active in another tab. Please complete or close it first.',
        };
      }
    }

    // No existing session - create new one
    const newSession = await WizardSessionStorage.createSession(tabId);

    console.log('Created new wizard session for tab', tabId);

    return {
      success: true,
      data: {
        session: newSession,
        isRecovery: false,
      },
    };
  } catch (error) {
    console.error('Failed to initialize wizard session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize wizard session',
    };
  }
}

/**
 * WIZARD_SAVE_STATE - Update wizard session with partial state
 *
 * Payload: Partial<WizardSessionData> - Any partial session data to update
 * Returns: { success: boolean }
 */
async function handleWizardSaveState(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleWizardSaveState called with payload:', payload);

    // Validate payload
    if (!payload) {
      return {
        success: false,
        error: 'Updates are required',
      };
    }

    // Update session with partial data
    await WizardSessionStorage.updateSession(payload);

    console.log('Wizard session state saved successfully');

    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error('Failed to save wizard state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save wizard state',
    };
  }
}

/**
 * WIZARD_LOAD_STATE - Load current wizard session state
 *
 * Payload: { tabId?: number } - Optional tab ID to verify
 * Returns: { session: WizardSessionData | null }
 */
async function handleWizardLoadState(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleWizardLoadState called');

    // Get active session
    const session = await WizardSessionStorage.getActiveSession();

    if (!session) {
      console.log('No active wizard session found');
      return {
        success: true,
        data: { session: null },
      };
    }

    // If tabId provided, verify it matches
    if (payload && typeof payload.tabId === 'number') {
      if (session.tabId !== payload.tabId) {
        return {
          success: false,
          error: 'Session belongs to a different tab',
        };
      }
    }

    console.log('Loaded wizard session:', session.currentStep);

    return {
      success: true,
      data: { session },
    };
  } catch (error) {
    console.error('Failed to load wizard state:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load wizard state',
    };
  }
}

/**
 * WIZARD_COMPLETE - Create multisig account from wizard data and cleanup session
 *
 * Payload: { accountName: string, config: MultisigConfig, addressType: MultisigAddressType, cosignerXpubs: Cosigner[] }
 * Returns: { account: MultisigAccount }
 */
async function handleWizardComplete(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleWizardComplete called with payload:', payload);

    // Check if wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock first.',
      };
    }

    // Validate payload
    if (!payload || !payload.accountName || !payload.config || !payload.addressType) {
      return {
        success: false,
        error: 'Account name, config, and addressType are required',
      };
    }

    if (!Array.isArray(payload.cosignerXpubs)) {
      return {
        success: false,
        error: 'cosignerXpubs must be an array',
      };
    }

    const { accountName, config, addressType, cosignerXpubs } = payload;

    // Create the multisig account using existing handler
    const createResult = await handleCreateMultisigAccount({
      name: accountName,
      config,
      addressType,
      cosignerXpubs,
    });

    if (!createResult.success) {
      return createResult;
    }

    // Delete the wizard session now that account is created
    try {
      await WizardSessionStorage.deleteSession();
      console.log('Wizard session cleaned up after successful account creation');
    } catch (cleanupError) {
      // Log but don't fail - account was created successfully
      console.warn('Failed to cleanup wizard session:', cleanupError);
    }

    console.log('Wizard completed successfully, multisig account created');

    return {
      success: true,
      data: {
        account: createResult.data?.account,
      },
    };
  } catch (error) {
    console.error('Failed to complete wizard:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete wizard',
    };
  }
}

/**
 * WIZARD_CHECK_WALLET_LOCKED - Check if wallet is locked (for wizard validation)
 *
 * Payload: none
 * Returns: { isLocked: boolean }
 */
async function handleWizardCheckWalletLocked(payload: any): Promise<MessageResponse> {
  try {
    console.log('handleWizardCheckWalletLocked called');

    const isLocked = !isWalletUnlocked();

    console.log('Wallet locked status:', isLocked);

    return {
      success: true,
      data: { isLocked },
    };
  } catch (error) {
    console.error('Failed to check wallet lock status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check wallet lock status',
    };
  }
}

/**
 * Auto-lock functionality
 * Locks wallet after 15 minutes of inactivity
 */
function startAutoLock(): void {
  // Clear existing timer if any
  if (state.autoLockTimer) {
    clearTimeout(state.autoLockTimer);
  }

  // Set up new timer (15 minutes = 900000 ms)
  const autoLockMs = 15 * 60 * 1000;

  state.autoLockTimer = setTimeout(() => {
    if (state.isUnlocked) {
      console.log('Auto-locking wallet due to inactivity');
      handleLockWallet();
    }
  }, autoLockMs) as unknown as number;
}

/**
 * Check for inactivity and auto-lock if needed
 * This runs periodically via chrome.alarms
 */
function checkInactivity(): void {
  if (!state.isUnlocked) {
    return;
  }

  const now = Date.now();
  const inactiveMs = now - state.lastActivity;
  const autoLockMs = 15 * 60 * 1000; // 15 minutes

  if (inactiveMs >= autoLockMs) {
    console.log('Auto-locking wallet due to inactivity');
    handleLockWallet();
  }
}

// Set up periodic alarm to check for inactivity
chrome.alarms.create('checkInactivity', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkInactivity') {
    checkInactivity();
  }
});

// ============================================================================
// TAB LIFECYCLE MANAGEMENT
// ============================================================================

/**
 * Clean up wizard session when tab is closed
 */
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab closed:', tabId);

  // Clean up wizard session if it belongs to this tab
  WizardSessionStorage.deleteSessionByTabId(tabId).catch((error) => {
    console.error('Failed to cleanup wizard session for closed tab:', error);
  });
});

/**
 * Periodically clean up expired wizard sessions (24 hours old)
 */
chrome.alarms.create('cleanupExpiredWizardSessions', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupExpiredWizardSessions') {
    WizardSessionStorage.cleanupExpiredSessions().catch((error) => {
      console.error('Failed to cleanup expired wizard sessions:', error);
    });
  }
});

// Note: Service workers don't have reliable termination events like 'beforeunload'
// The in-memory state will be automatically cleared when the service worker terminates
// Users must manually lock the wallet or wait for the auto-lock timer (15 minutes)

// ============================================================================
// TAB-BASED ARCHITECTURE: ACTION CLICK HANDLER
// ============================================================================

/**
 * Handle extension icon click - Open or focus wallet tab
 * Replaces popup with full tab-based interface
 */
chrome.action.onClicked.addListener(async () => {
  console.log('Extension icon clicked - opening/focusing wallet tab');

  try {
    // Check if wallet tab already exists
    const walletUrl = chrome.runtime.getURL('index.html');
    const tabs = await chrome.tabs.query({ url: walletUrl });

    if (tabs.length > 0) {
      // Wallet tab exists - focus it
      const walletTab = tabs[0];
      await chrome.tabs.update(walletTab.id!, { active: true });

      // Also focus the window containing the tab
      if (walletTab.windowId) {
        await chrome.windows.update(walletTab.windowId, { focused: true });
      }

      console.log('Focused existing wallet tab:', walletTab.id);
    } else {
      // No wallet tab - create new one
      const newTab = await chrome.tabs.create({
        url: walletUrl,
        active: true
      });

      console.log('Created new wallet tab:', newTab.id);
    }
  } catch (error) {
    console.error('Failed to open/focus wallet tab:', error);
  }
});

// ============================================================================
// PRIVATE KEY EXPORT/IMPORT
// ============================================================================

/**
 * Helper: Extract private key from HD or imported account
 *
 * @param account - Account to extract private key from
 * @returns Private key in hex format
 * @throws Error if account is multisig or wallet is locked
 */
async function extractPrivateKey(account: WalletAccount): Promise<string> {
  // Check account type
  if (account.accountType === 'multisig') {
    throw new Error('Cannot export multisig accounts. Multisig accounts have multiple co-signer keys.');
  }

  // Extract based on import status
  if ('importType' in account && account.importType && account.importType !== 'hd') {
    // Imported account - retrieve from encrypted storage
    if (!state.encryptionKey) {
      throw new Error('Wallet must be unlocked to export imported account');
    }

    const importedData = await WalletStorage.getImportedKey(account.index);
    if (!importedData) {
      throw new Error(`No imported key found for account ${account.index}`);
    }

    // Decrypt imported key
    const decrypted = await CryptoUtils.decryptWithKey(
      importedData.encryptedData,
      state.encryptionKey,
      importedData.iv
    );

    // If imported key is already WIF, decode to hex
    if (KeyManager.validateWIF(decrypted, 'testnet')) {
      const decoded = KeyManager.decodeWIF(decrypted, 'testnet');
      return decoded.privateKey; // Hex format
    }

    return decrypted; // Already hex
  } else {
    // HD account - derive from seed
    if (!state.decryptedSeed || !state.hdWallet) {
      throw new Error('Wallet is locked. Please unlock to export private keys.');
    }

    // Derive private key for FIRST RECEIVING ADDRESS (not account level)
    // This ensures the exported WIF can restore access to the actual address with funds
    const addressType = account.addressType as AddressType;
    const coinType = COIN_TYPES['testnet'];

    let derivationPath: string;
    switch (addressType) {
      case 'legacy':
        derivationPath = `m/44'/${coinType}'/${account.index}'/0/0`; // First receiving address
        break;
      case 'segwit':
        derivationPath = `m/49'/${coinType}'/${account.index}'/0/0`; // First receiving address
        break;
      case 'native-segwit':
        derivationPath = `m/84'/${coinType}'/${account.index}'/0/0`; // First receiving address
        break;
      default:
        throw new Error(`Unsupported address type: ${addressType}`);
    }

    const node = state.hdWallet.derivePath(derivationPath);
    if (!node.privateKey) {
      throw new Error('Failed to derive private key');
    }

    return node.privateKey.toString('hex');
  }
}

/**
 * Helper: Encrypt WIF with optional password protection
 *
 * @param wif - WIF format private key
 * @param password - Optional password for encryption
 * @returns Encrypted WIF or plaintext WIF
 */
async function encryptWIF(
  wif: string,
  password?: string
): Promise<{
  encrypted: boolean;
  wif?: string;
  encryptedData?: string;
  salt?: string;
  iv?: string;
}> {
  if (!password) {
    // No encryption - return plaintext
    return {
      encrypted: false,
      wif: wif
    };
  }

  // Encrypt WIF using existing CryptoUtils
  const encryptionResult = await CryptoUtils.encrypt(wif, password);

  return {
    encrypted: true,
    encryptedData: encryptionResult.encryptedData,
    salt: encryptionResult.salt,
    iv: encryptionResult.iv
  };
}

/**
 * Helper: Check if WIF private key is already imported
 *
 * @param wif - WIF private key to check
 * @param accounts - Existing wallet accounts
 * @returns Duplicate check result
 */
async function checkDuplicateWIF(
  wif: string,
  accounts: WalletAccount[]
): Promise<{
  isDuplicate: boolean;
  existingAccountName?: string;
  existingAccountIndex?: number;
}> {
  try {
    // Derive first address from WIF
    const addressInfo = WIFManager.deriveFirstAddress(wif, 'testnet');
    const derivedAddress = addressInfo.address;

    // Check all accounts for matching first address
    for (const account of accounts) {
      // Skip multisig accounts
      if (account.accountType === 'multisig') {
        continue;
      }

      // Check if any address matches
      for (const addr of account.addresses) {
        if (addr.address === derivedAddress) {
          return {
            isDuplicate: true,
            existingAccountName: account.name,
            existingAccountIndex: account.index
          };
        }
      }
    }

    return { isDuplicate: false };

  } catch (error) {
    // If we can't derive address, allow import (user will notice if duplicate)
    console.error('[checkDuplicateWIF] Error:', error);
    return { isDuplicate: false };
  }
}

/**
 * EXPORT_PRIVATE_KEY - Export account private key in WIF format
 *
 * Payload: { accountIndex: number, password?: string }
 * Returns: { wif?, encryptedData?, salt?, iv?, metadata }
 */
async function handleExportPrivateKey(payload: any): Promise<MessageResponse> {
  let privateKeyHex: string | null = null;
  let wif: string | null = null;

  try {
    // 1. Validate wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock to export private keys.',
        code: PrivateKeyErrorCode.WALLET_LOCKED
      };
    }

    // 2. Get wallet and account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts[payload.accountIndex];

    if (!account) {
      return {
        success: false,
        error: `Account with index ${payload.accountIndex} not found.`,
        code: PrivateKeyErrorCode.ACCOUNT_NOT_FOUND
      };
    }

    // 3. Validate account type
    if (account.accountType === 'multisig') {
      return {
        success: false,
        error: 'Cannot export multisig accounts. Multisig accounts have multiple co-signer keys. Export co-signer xpubs instead.',
        code: PrivateKeyErrorCode.MULTISIG_NOT_SUPPORTED
      };
    }

    // 4. Extract private key (hex format)
    privateKeyHex = await extractPrivateKey(account);

    // 5. Convert to WIF (always compressed)
    wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

    // 6. Clear private key hex from memory
    CryptoUtils.clearSensitiveData(privateKeyHex);
    privateKeyHex = null;

    // 7. Optionally encrypt WIF
    const encrypted = await encryptWIF(wif, payload.password);

    // 8. Clear WIF from memory if encrypted
    if (encrypted.encrypted && wif) {
      CryptoUtils.clearSensitiveData(wif);
      wif = null;
    }

    // 9. Build metadata
    const metadata = {
      accountName: account.name,
      addressType: account.addressType,
      firstAddress: account.addresses[0]?.address || '',
      network: 'testnet' as const,
      timestamp: Date.now(),
      encrypted: encrypted.encrypted
    };

    // 10. Return result
    return {
      success: true,
      data: {
        wif: encrypted.wif,
        encryptedData: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        metadata
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EXPORT_PRIVATE_KEY] Error:', message);

    return {
      success: false,
      error: message,
      code: PrivateKeyErrorCode.EXPORT_FAILED
    };

  } finally {
    // Cleanup sensitive data
    if (privateKeyHex) {
      CryptoUtils.clearSensitiveData(privateKeyHex);
    }
    if (wif) {
      CryptoUtils.clearSensitiveData(wif);
    }
  }
}

/**
 * IMPORT_PRIVATE_KEY - Import WIF private key as a new account
 *
 * Payload: { wif: string, name: string, walletPassword?: string }
 * Returns: { account: WalletAccount, firstAddress: string }
 */
async function handleImportPrivateKey(payload: any): Promise<MessageResponse> {
  let privateKeyHex: string | null = null;

  try {
    // 1. Rate limit check
    const rateLimitCheck = checkImportRateLimit('import-private-key');
    if (!rateLimitCheck.allowed) {
      return {
        success: false,
        error: rateLimitCheck.error!,
        code: PrivateKeyErrorCode.RATE_LIMIT_EXCEEDED
      };
    }

    // 2. Decrypt WIF if encrypted data is provided
    let wif: string;
    if (payload.encryptedData && payload.salt && payload.iv && payload.decryptionPassword) {
      try {
        wif = await CryptoUtils.decrypt(
          payload.encryptedData,
          payload.decryptionPassword,
          payload.salt,
          payload.iv
        );
      } catch (error) {
        return {
          success: false,
          error: 'Decryption failed. Please check your password.',
          code: PrivateKeyErrorCode.DECRYPTION_FAILED
        };
      }
    } else if (payload.wif) {
      wif = payload.wif;
    } else {
      return {
        success: false,
        error: 'Either WIF or encrypted data must be provided',
        code: PrivateKeyErrorCode.IMPORT_FAILED
      };
    }

    // 3. Validate WIF
    const validation = WIFManager.validateWIF(wif, 'testnet');
    if (!validation.valid) {
      const code = validation.error?.includes('network')
        ? PrivateKeyErrorCode.WRONG_NETWORK
        : PrivateKeyErrorCode.INVALID_WIF_FORMAT;

      return {
        success: false,
        error: validation.error || 'Invalid private key',
        code
      };
    }

    // 4. Check for duplicate
    const walletExists = await WalletStorage.hasWallet();
    if (walletExists) {
      const wallet = await WalletStorage.getWallet();
      const duplicate = await checkDuplicateWIF(wif, wallet.accounts);

      if (duplicate.isDuplicate) {
        return {
          success: false,
          error: `This account is already imported as "${duplicate.existingAccountName}"`,
          code: PrivateKeyErrorCode.DUPLICATE_KEY,
          details: {
            existingAccountIndex: duplicate.existingAccountIndex
          }
        };
      }
    }

    // 5. Decode WIF to private key
    const decoded = KeyManager.decodeWIF(wif, 'testnet');
    privateKeyHex = decoded.privateKey;

    // 6. Create new account
    const isInitialSetup = !walletExists;

    if (isInitialSetup) {
      // Creating new wallet with imported key as first account
      if (!payload.walletPassword) {
        return {
          success: false,
          error: 'Wallet password required for initial setup',
          code: PrivateKeyErrorCode.IMPORT_FAILED
        };
      }

      // Create wallet with dummy seed (not used for imported account)
      const dummySeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

      await WalletStorage.createWallet(
        dummySeed,
        payload.walletPassword,
        undefined, // No initial account
        { network: 'testnet', autoLockMinutes: 15 }
      );

      // Unlock wallet to get encryption key
      await handleUnlockWallet({ password: payload.walletPassword });
    }

    // 7. Check if wallet is unlocked
    if (!state.encryptionKey) {
      return {
        success: false,
        error: 'Wallet must be unlocked to import private key',
        code: PrivateKeyErrorCode.WALLET_LOCKED
      };
    }

    // 8. Get wallet and create account
    const wallet = await WalletStorage.getWallet();
    const nextIndex = wallet.accounts.length;

    // Check maximum accounts limit
    const MAX_ACCOUNTS = 100;
    if (nextIndex >= MAX_ACCOUNTS) {
      return {
        success: false,
        error: `Maximum number of accounts (${MAX_ACCOUNTS}) reached.`,
        code: PrivateKeyErrorCode.IMPORT_FAILED
      };
    }

    const account: Account = {
      accountType: 'single',
      index: nextIndex,
      name: payload.accountName,
      addressType: payload.addressType || validation.addressType!,
      importType: 'private-key',
      externalIndex: 1,
      internalIndex: 0,
      addresses: [
        {
          address: validation.firstAddress!,
          derivationPath: 'imported',
          index: 0,
          isChange: false,
          used: false
        }
      ]
    };

    // 9. Encrypt and store imported private key
    const encryptedImportedKey = await CryptoUtils.encryptWithKey(
      wif,
      state.encryptionKey
    );

    const importedKeyData: ImportedKeyData = {
      encryptedData: encryptedImportedKey.encryptedData,
      salt: encryptedImportedKey.salt,
      iv: encryptedImportedKey.iv,
      type: 'private-key'
    };

    await WalletStorage.storeImportedKey(nextIndex, importedKeyData);

    // 10. Add account to wallet
    await WalletStorage.addAccount(account);

    // 11. Clear private key and WIF from memory
    CryptoUtils.clearSensitiveData(privateKeyHex);
    CryptoUtils.clearSensitiveData(wif);
    privateKeyHex = null;

    console.log(`Imported account from WIF: ${payload.accountName} (index: ${nextIndex})`);

    return {
      success: true,
      data: {
        account,
        firstAddress: validation.firstAddress!
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[IMPORT_PRIVATE_KEY] Error:', message);

    return {
      success: false,
      error: message,
      code: PrivateKeyErrorCode.IMPORT_FAILED
    };

  } finally {
    // Cleanup sensitive data
    if (privateKeyHex) {
      CryptoUtils.clearSensitiveData(privateKeyHex);
    }
  }
}

/**
 * VALIDATE_WIF - Validate WIF format and return preview information
 *
 * Payload: { wif: string }
 * Returns: { valid, network?, firstAddress?, addressType?, compressed?, error? }
 */
async function handleValidateWIF(payload: any): Promise<MessageResponse> {
  try {
    let wif: string;

    // Check if encrypted data is provided (for encrypted file import)
    if (payload.encryptedData && payload.salt && payload.iv && payload.decryptionPassword) {
      // Decrypt the WIF using provided password
      try {
        wif = await CryptoUtils.decrypt(
          payload.encryptedData,
          payload.decryptionPassword,
          payload.salt,
          payload.iv
        );
      } catch (error) {
        return {
          success: false,
          error: 'Decryption failed. Please check your password.',
          code: PrivateKeyErrorCode.DECRYPTION_FAILED
        };
      }
    } else if (payload.wif) {
      // Plain WIF provided
      wif = payload.wif;
    } else {
      return {
        success: false,
        error: 'Either WIF or encrypted data must be provided',
        code: PrivateKeyErrorCode.VALIDATION_FAILED
      };
    }

    // Validate WIF
    const validation = WIFManager.validateWIF(wif, 'testnet');

    return {
      success: true,
      data: validation
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VALIDATE_WIF] Error:', message);

    return {
      success: false,
      error: message,
      code: PrivateKeyErrorCode.VALIDATION_FAILED
    };
  }
}

/**
 * EXPORT_ACCOUNT_XPUB - Export account-level extended public key
 *
 * Payload: { accountIndex: number }
 * Returns: { xpub: string, fingerprint: string, derivationPath: string, metadata }
 */
async function handleExportAccountXpub(payload: any): Promise<MessageResponse> {
  try {
    // 1. Validate wallet is unlocked
    if (!isWalletUnlocked()) {
      return {
        success: false,
        error: 'Wallet is locked. Please unlock to export xpub.',
      };
    }

    // 2. Validate payload
    if (!payload || typeof payload.accountIndex !== 'number') {
      return {
        success: false,
        error: 'Account index is required',
      };
    }

    // 3. Get wallet and account
    const wallet = await WalletStorage.getWallet();
    const account = wallet.accounts[payload.accountIndex];

    if (!account) {
      return {
        success: false,
        error: `Account with index ${payload.accountIndex} not found.`,
      };
    }

    // 4. Validate account type
    if (account.accountType === 'multisig') {
      return {
        success: false,
        error: 'Cannot export xpub for multisig accounts. Use EXPORT_OUR_XPUB for multisig accounts.',
      };
    }

    // 5. Validate account is HD-derived (not imported)
    if (account.importType === 'private-key') {
      return {
        success: false,
        error: 'Cannot export xpub for accounts imported from private keys. Only HD-derived accounts have extended public keys.',
      };
    }

    // 5b. Check if wallet is a non-HD wallet (created from private key)
    // This can happen if:
    // - Wallet was created from imported private key (wallet.encryptedSeed === '')
    // - Account doesn't have importType field set properly
    if (!state.hdWallet) {
      return {
        success: false,
        error: 'Cannot export xpub for non-HD wallets. Only HD-derived accounts have extended public keys.',
      };
    }

    // 6. Derive account-level node
    const accountNode = state.hdWallet.deriveAccountNode(
      account.addressType,
      account.index
    );

    // 7. Get account-level xpub (neutered key - public only)
    const xpub = accountNode.neutered().toBase58();

    // 8. Calculate fingerprint (first 4 bytes of hash160 of public key, as hex)
    const hash = require('crypto').createHash('sha256').update(accountNode.publicKey).digest();
    const hash160 = require('crypto').createHash('ripemd160').update(hash).digest();
    const fingerprint = hash160.slice(0, 4).toString('hex');

    // 9. Build derivation path
    const coinType = COIN_TYPES['testnet'];
    const derivationPath = DERIVATION_PATHS[account.addressType](
      coinType,
      account.index,
      0,
      0
    ).split('/').slice(0, 4).join('/'); // Get up to account level: m/purpose'/coin'/account'

    // 10. Build metadata
    const metadata = {
      accountName: account.name,
      accountIndex: account.index,
      addressType: account.addressType,
      network: 'testnet' as const,
      derivationPath,
      fingerprint,
      timestamp: Date.now(),
    };

    console.log(`Exported xpub for account ${account.index} (${account.name}): ${xpub.substring(0, 20)}...`);

    // 11. Return result
    return {
      success: true,
      data: {
        xpub,
        fingerprint,
        derivationPath,
        metadata
      }
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EXPORT_ACCOUNT_XPUB] Error:', message);

    return {
      success: false,
      error: `Failed to export xpub: ${message}`,
    };
  }
}

/**
 * EXPORT_WALLET_BACKUP - Export complete encrypted wallet backup
 *
 * Payload: { walletPassword: string, backupPassword: string, onProgress?: (progress: number, step: string) => void }
 * Returns: { backupFile: EncryptedBackupFile, filename: string, fileSize: number }
 */
async function handleExportWalletBackup(payload: any): Promise<MessageResponse> {
  try {
    console.log('[EXPORT_WALLET_BACKUP] Starting export operation...');

    // 1. Validate wallet is unlocked
    const walletUnlocked = isWalletUnlocked();
    console.log('[EXPORT_WALLET_BACKUP] Wallet unlocked:', walletUnlocked);

    if (!walletUnlocked) {
      console.error('[EXPORT_WALLET_BACKUP] Wallet is locked - cannot export');
      return {
        success: false,
        error: 'Wallet is locked. Please unlock to export backup.',
      };
    }

    // 2. Validate payload
    if (!payload || typeof payload.walletPassword !== 'string') {
      console.error('[EXPORT_WALLET_BACKUP] Missing wallet password');
      return {
        success: false,
        error: 'Wallet password is required',
      };
    }

    if (!payload.backupPassword || typeof payload.backupPassword !== 'string') {
      console.error('[EXPORT_WALLET_BACKUP] Missing backup password');
      return {
        success: false,
        error: 'Backup password is required',
      };
    }

    console.log('[EXPORT_WALLET_BACKUP] Payload validated, calling BackupManager.exportWallet...');

    // 3. Export wallet using BackupManager
    const backupFile = await BackupManager.exportWallet(
      payload.walletPassword,
      payload.backupPassword,
      payload.onProgress
    );

    console.log('[EXPORT_WALLET_BACKUP] Backup file created successfully');

    // 4. Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const network = backupFile.header.network;
    const filename = `bitcoin-wallet-backup-${network}-${timestamp}.dat`;

    // 5. Calculate file size
    const fileJSON = JSON.stringify(backupFile);
    const fileSize = new Blob([fileJSON]).size;

    console.log(`[EXPORT_WALLET_BACKUP] Created backup: ${filename} (${fileSize} bytes)`);

    // 6. Return result
    return {
      success: true,
      data: {
        backupFile,
        filename,
        fileSize,
        checksum: backupFile.checksum.hash,
        network: backupFile.header.network,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[EXPORT_WALLET_BACKUP] Error:', message);

    return {
      success: false,
      error: `Failed to export wallet backup: ${message}`,
    };
  }
}

/**
 * VALIDATE_BACKUP_FILE - Validate backup file structure without decrypting
 *
 * Payload: { backupFile: EncryptedBackupFile }
 * Returns: { valid: boolean, version?: number, network?: string, created?: number, error?: string }
 */
async function handleValidateBackupFile(payload: any): Promise<MessageResponse> {
  try {
    // 1. Validate payload
    if (!payload || !payload.backupFile) {
      return {
        success: false,
        error: 'Backup file is required',
      };
    }

    // 2. Validate backup file using BackupManager
    const validation = await BackupManager.validateBackupFile(payload.backupFile);

    // 3. Return validation result
    return {
      success: true,
      data: validation,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[VALIDATE_BACKUP_FILE] Error:', message);

    return {
      success: false,
      error: `Failed to validate backup file: ${message}`,
    };
  }
}

/**
 * IMPORT_WALLET_BACKUP - Import and restore wallet from encrypted backup
 *
 * Payload: { backupFile: EncryptedBackupFile, backupPassword: string, walletPassword: string, replaceExisting: boolean, onProgress?: (progress: number, step: string) => void }
 * Returns: { accountCount: number, contactCount: number, network: string, backupCreated: number }
 *
 * WARNING: This replaces the current wallet if replaceExisting is true
 */
async function handleImportWalletBackup(payload: any): Promise<MessageResponse> {
  try {
    // 1. Validate payload
    if (!payload || !payload.backupFile) {
      return {
        success: false,
        error: 'Backup file is required',
      };
    }

    if (!payload.backupPassword || typeof payload.backupPassword !== 'string') {
      return {
        success: false,
        error: 'Backup password is required',
      };
    }

    // 2. If replacing existing wallet, verify wallet is unlocked
    if (payload.replaceExisting) {
      if (!isWalletUnlocked()) {
        return {
          success: false,
          error: 'Wallet is locked. Please unlock to replace existing wallet.',
        };
      }

      // 3. Verify wallet password before destructive operation
      if (!payload.walletPassword || typeof payload.walletPassword !== 'string') {
        return {
          success: false,
          error: 'Wallet password is required to replace existing wallet',
        };
      }

      const isValid = await WalletStorage.verifyPassword(payload.walletPassword);
      if (!isValid) {
        return {
          success: false,
          error: 'Incorrect wallet password',
        };
      }
    }

    // 4. Import wallet using BackupManager
    const importResult = await BackupManager.importWallet(
      payload.backupFile,
      payload.backupPassword,
      payload.onProgress
    );

    // 5. Lock wallet after import (for security)
    await lockWallet();

    console.log(`[IMPORT_WALLET_BACKUP] Successfully imported backup: ${importResult.accountCount} accounts, ${importResult.contactCount} contacts`);

    // 6. Return result
    return {
      success: true,
      data: importResult,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[IMPORT_WALLET_BACKUP] Error:', message);

    return {
      success: false,
      error: `Failed to import wallet backup: ${message}`,
    };
  }
}

// ============================================================================
// TAB-BASED ARCHITECTURE: SINGLE TAB ENFORCEMENT
// ============================================================================

/**
 * Single Tab Enforcement System
 *
 * Security Context:
 * - Multiple wallet tabs = multiple attack surfaces
 * - Prevents session confusion and state synchronization issues
 * - Ensures only one tab can access unlocked wallet at a time
 *
 * Implementation:
 * - Active tab receives unique session token
 * - Token validated every 5 seconds
 * - Duplicate tabs automatically closed or locked
 * - Token rotates on tab visibility changes
 */

interface TabSession {
  tabId: number;
  token: string;
  issuedAt: number;
  lastValidated: number;
}

// Active tab session (null if no tab is active)
let activeTabSession: TabSession | null = null;

/**
 * Generate cryptographically secure session token
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Request session token for a tab
 * Only one tab can hold a valid token at a time
 */
function requestTabToken(tabId: number): { token: string; granted: boolean } {
  const now = Date.now();

  // If there's an active session for a different tab, invalidate it
  if (activeTabSession && activeTabSession.tabId !== tabId) {
    console.log(`[TAB SESSION] Invalidating previous session for tab ${activeTabSession.tabId}`);

    // Notify the old tab that it's been superseded
    chrome.tabs.sendMessage(activeTabSession.tabId, {
      type: 'SESSION_REVOKED',
      reason: 'Another wallet tab was opened'
    }).catch(() => {
      // Tab might be closed, ignore error
    });
  }

  // Generate new token for requesting tab
  const token = generateSessionToken();
  activeTabSession = {
    tabId,
    token,
    issuedAt: now,
    lastValidated: now
  };

  console.log(`[TAB SESSION] Granted token to tab ${tabId}`);

  return { token, granted: true };
}

/**
 * Validate tab session token
 */
function validateTabToken(tabId: number, token: string): { valid: boolean; reason?: string } {
  // No active session
  if (!activeTabSession) {
    return { valid: false, reason: 'No active session' };
  }

  // Token is for different tab
  if (activeTabSession.tabId !== tabId) {
    return { valid: false, reason: 'Token belongs to different tab' };
  }

  // Token mismatch
  if (activeTabSession.token !== token) {
    return { valid: false, reason: 'Invalid token' };
  }

  // Token is valid - update last validated time
  activeTabSession.lastValidated = Date.now();

  return { valid: true };
}

/**
 * Revoke tab session (when tab closes or user switches tabs)
 */
function revokeTabToken(tabId: number): void {
  if (activeTabSession && activeTabSession.tabId === tabId) {
    console.log(`[TAB SESSION] Revoked token for tab ${tabId}`);
    activeTabSession = null;
  }
}

// Listen for tab removal to clean up sessions
chrome.tabs.onRemoved.addListener((tabId) => {
  revokeTabToken(tabId);
});

// Add message handlers for tab session management
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Request session token
  if (message.type === 'REQUEST_TAB_TOKEN') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ granted: false, error: 'No tab ID' });
      return;
    }

    const result = requestTabToken(tabId);
    sendResponse(result);
    return;
  }

  // Validate session token
  if (message.type === 'VALIDATE_TAB_TOKEN') {
    const tabId = sender.tab?.id;
    if (!tabId) {
      sendResponse({ valid: false, reason: 'No tab ID' });
      return;
    }

    const result = validateTabToken(tabId, message.token);
    sendResponse(result);
    return;
  }

  // Revoke session token
  if (message.type === 'REVOKE_TAB_TOKEN') {
    const tabId = sender.tab?.id;
    if (tabId) {
      revokeTabToken(tabId);
    }
    sendResponse({ success: true });
    return;
  }
});
