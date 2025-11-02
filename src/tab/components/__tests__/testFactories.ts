/**
 * Test Factories for React Component Tests
 *
 * Factory functions to create mock data for testing:
 * - WalletAccount (single-sig and multisig)
 * - Address
 * - Transaction
 * - Contact
 * - Balance
 * - FeeEstimate
 *
 * Usage:
 * const account = createMockAccount({ name: 'Test Account' });
 * const transaction = createMockTransaction({ value: 50000 });
 */

import {
  WalletAccount,
  Account,
  MultisigAccount,
  Address,
  MultisigAddress,
  Transaction,
  TransactionInput,
  TransactionOutput,
  Contact,
  Balance,
  FeeEstimate,
  Cosigner,
  AddressType,
  MultisigAddressType,
  MultisigConfig,
} from '../../../shared/types';

/**
 * Create a mock single-sig account
 */
export function createMockAccount(overrides?: Partial<Account>): Account {
  const defaultAccount: Account = {
    accountType: 'single',
    index: 0,
    name: 'Test Account',
    addressType: 'native-segwit' as AddressType,
    importType: 'hd',
    externalIndex: 1,
    internalIndex: 0,
    addresses: [
      createMockAddress({
        address: 'tb1qtest123456789abcdefghijklmnop',
        index: 0,
        isChange: false,
        used: false,
      }),
    ],
  };

  return { ...defaultAccount, ...overrides };
}

/**
 * Create a mock multisig account
 */
export function createMockMultisigAccount(
  overrides?: Partial<MultisigAccount>
): MultisigAccount {
  const defaultAccount: MultisigAccount = {
    accountType: 'multisig',
    index: 0,
    name: 'Test Multisig Account',
    multisigConfig: '2-of-3' as MultisigConfig,
    addressType: 'p2wsh' as MultisigAddressType,
    cosigners: [
      createMockCosigner({ name: 'Alice', isSelf: true }),
      createMockCosigner({ name: 'Bob', isSelf: false }),
      createMockCosigner({ name: 'Charlie', isSelf: false }),
    ],
    externalIndex: 1,
    internalIndex: 0,
    addresses: [
      createMockMultisigAddress({
        address: 'tb1qmultisig123456789abcdefghijklmnop',
        index: 0,
        isChange: false,
      }),
    ],
  };

  return { ...defaultAccount, ...overrides };
}

/**
 * Create a mock cosigner
 */
export function createMockCosigner(overrides?: Partial<Cosigner>): Cosigner {
  const defaultCosigner: Cosigner = {
    name: 'Cosigner',
    xpub: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
    fingerprint: 'abcd1234',
    derivationPath: "m/48'/1'/0'/2'",
    isSelf: false,
  };

  return { ...defaultCosigner, ...overrides };
}

/**
 * Create a mock address
 */
export function createMockAddress(overrides?: Partial<Address>): Address {
  const defaultAddress: Address = {
    address: 'tb1qdefault123456789abcdefghijklmnop',
    derivationPath: "m/84'/1'/0'/0/0",
    index: 0,
    isChange: false,
    used: false,
  };

  return { ...defaultAddress, ...overrides };
}

/**
 * Create a mock multisig address
 */
export function createMockMultisigAddress(
  overrides?: Partial<MultisigAddress>
): MultisigAddress {
  const defaultAddress: MultisigAddress = {
    address: 'tb1qmultisig123456789abcdefghijklmnop',
    derivationPath: "m/48'/1'/0'/2'/0/0",
    index: 0,
    isChange: false,
    used: false,
    witnessScript: '5221030123...',
  };

  return { ...defaultAddress, ...overrides };
}

/**
 * Create a mock transaction
 */
export function createMockTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  const defaultTx: Transaction = {
    txid: 'abc123def456789012345678901234567890123456789012345678901234567890',
    confirmations: 3,
    timestamp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    value: 50000, // Positive = received, Negative = sent
    fee: 500,
    inputs: [
      {
        txid: 'input123',
        vout: 0,
        address: 'tb1qsender123456789abcdefghijklmnop',
        value: 100000,
      },
    ],
    outputs: [
      {
        address: 'tb1qreceiver123456789abcdefghijklmnop',
        value: 50000,
        scriptPubKey: '0014...',
      },
      {
        address: 'tb1qchange123456789abcdefghijklmnop',
        value: 49500,
        scriptPubKey: '0014...',
      },
    ],
  };

  return { ...defaultTx, ...overrides };
}

/**
 * Create a mock transaction input
 */
export function createMockTransactionInput(
  overrides?: Partial<TransactionInput>
): TransactionInput {
  const defaultInput: TransactionInput = {
    txid: 'inputtxid123',
    vout: 0,
    address: 'tb1qinput123456789abcdefghijklmnop',
    value: 100000,
  };

  return { ...defaultInput, ...overrides };
}

/**
 * Create a mock transaction output
 */
export function createMockTransactionOutput(
  overrides?: Partial<TransactionOutput>
): TransactionOutput {
  const defaultOutput: TransactionOutput = {
    address: 'tb1qoutput123456789abcdefghijklmnop',
    value: 50000,
    scriptPubKey: '0014...',
  };

  return { ...defaultOutput, ...overrides };
}

/**
 * Create a mock contact (single address)
 */
export function createMockContact(overrides?: Partial<Contact>): Contact {
  const defaultContact: Contact = {
    id: 'contact-123',
    name: 'Test Contact',
    address: 'tb1qcontact123456789abcdefghijklmnop',
    email: 'test@example.com',
    notes: 'Test notes',
    category: 'Personal',
    reusageCount: 0,
    createdAt: Date.now() - 86400000, // 1 day ago
    updatedAt: Date.now(),
  };

  return { ...defaultContact, ...overrides };
}

/**
 * Create a mock xpub contact
 */
export function createMockXpubContact(
  overrides?: Partial<Contact>
): Contact {
  const cachedAddresses = Array(20)
    .fill(null)
    .map((_, i) => `tb1qxpub${i}123456789abcdefghijklmnop`);

  const defaultContact: Contact = {
    id: 'xpub-contact-123',
    name: 'Xpub Contact',
    address: '',
    xpub:
      'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz',
    xpubFingerprint: 'abcd1234',
    cachedAddresses,
    lastUsedAddressIndex: 0,
    email: 'xpub@example.com',
    notes: 'Xpub test notes',
    category: 'Business',
    reusageCount: 0,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
  };

  return { ...defaultContact, ...overrides };
}

/**
 * Create a mock balance
 */
export function createMockBalance(overrides?: Partial<Balance>): Balance {
  const defaultBalance: Balance = {
    confirmed: 100000, // 0.001 BTC
    unconfirmed: 0,
  };

  return { ...defaultBalance, ...overrides };
}

/**
 * Create mock fee estimates
 */
export function createMockFeeEstimate(
  overrides?: Partial<FeeEstimate>
): FeeEstimate {
  const defaultFees: FeeEstimate = {
    slow: 1,
    medium: 3,
    fast: 5,
  };

  return { ...defaultFees, ...overrides };
}

/**
 * Create multiple mock addresses for an account
 */
export function createMockAddresses(
  count: number,
  isChange: boolean = false
): Address[] {
  return Array(count)
    .fill(null)
    .map((_, i) =>
      createMockAddress({
        address: `tb1q${isChange ? 'change' : 'receive'}${i}123456789abcdefghijklmnop`,
        derivationPath: `m/84'/1'/0'/${isChange ? 1 : 0}/${i}`,
        index: i,
        isChange,
        used: i < Math.floor(count / 2), // First half are used
      })
    );
}

/**
 * Create multiple mock transactions
 */
export function createMockTransactions(count: number): Transaction[] {
  return Array(count)
    .fill(null)
    .map((_, i) =>
      createMockTransaction({
        txid: `tx${i}${'0'.repeat(62 - String(i).length)}`,
        timestamp: Math.floor(Date.now() / 1000) - i * 3600, // Each hour apart
        value: i % 2 === 0 ? 50000 : -30000, // Alternate between received/sent
        confirmations: i === 0 ? 0 : 3 + i, // First tx is pending
      })
    );
}

/**
 * Create multiple mock contacts
 */
export function createMockContacts(count: number): Contact[] {
  return Array(count)
    .fill(null)
    .map((_, i) =>
      createMockContact({
        id: `contact-${i}`,
        name: `Contact ${i}`,
        address: `tb1qcontact${i}123456789abcdefghijklmnop`,
      })
    );
}
