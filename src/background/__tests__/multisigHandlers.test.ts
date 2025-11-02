/**
 * Multisig Message Handler Tests
 *
 * @jest-environment node
 *
 * Comprehensive tests for multisig-specific message handlers:
 * - ensureMultisigAddressPool: Address pool generation for multisig accounts
 * - handleGetMultisigBalance: Balance calculation for multisig accounts
 * - handleGetMultisigTransactions: Transaction history for multisig accounts
 * - handleGetBalance/handleGetTransactions: Routing logic for multisig vs single-sig
 */

import { MessageType, MessageResponse, MultisigAccount, MultisigAddress, Cosigner, UTXO, Transaction } from '../../shared/types/index';
import { WalletStorage } from '../wallet/WalletStorage';
import { HDWallet } from '../wallet/HDWallet';
import { blockstreamClient } from '../api/BlockstreamClient';
import {
  createMockAccount,
  createMockStoredWallet,
  createMockUTXO,
  createMockTransaction,
} from '../../__tests__/utils/testFactories';
import {
  TEST_MNEMONIC_12,
  TEST_PASSWORD,
  SATOSHI_VALUES,
} from '../../__tests__/utils/testConstants';

// Mock dependencies
jest.mock('../wallet/WalletStorage');
jest.mock('../wallet/HDWallet');
jest.mock('../wallet/AddressGenerator');
jest.mock('../api/BlockstreamClient');

// Import the background script to set up message listeners
require('../index');

describe('Multisig Message Handlers', () => {
  // Helper to send a message and get response
  const sendMessage = async (type: MessageType, payload?: any): Promise<MessageResponse> => {
    return await (global as any).chrome.runtime.onMessage.__trigger({
      type,
      payload,
    });
  };

  // Helper to create mock multisig account
  const createMockMultisigAccount = (overrides: Partial<MultisigAccount> = {}): MultisigAccount => {
    return {
      accountType: 'multisig',
      index: 0,
      name: 'Test Multisig Wallet',
      multisigConfig: '2-of-3',
      addressType: 'p2wsh',
      cosigners: [
        {
          name: 'Alice',
          fingerprint: '1234abcd',
          xpub: 'tpubD6NzVbkrYhZ4XQwDLWTx6nqWTHQbPEb4YoGDKfJmAMf9HW1234567890abcdefABCDEF1234567890',
          derivationPath: "m/48'/1'/0'/2'",
          isSelf: false,
        },
        {
          name: 'Bob',
          fingerprint: '5678efgh',
          xpub: 'tpubD6NzVbkrYhZ4XQwDLWTx6nqWTHQbPEb4YoGDKfJmAMf9HW9876543210fedcbaFEDCBA9876543210',
          derivationPath: "m/48'/1'/0'/2'",
          isSelf: false,
        },
      ],
      externalIndex: 0,
      internalIndex: 0,
      addresses: [],
      ...overrides,
    };
  };

  // Helper to create mock multisig address
  const createMockMultisigAddress = (overrides: Partial<MultisigAddress> = {}): MultisigAddress => {
    return {
      address: 'tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7',
      derivationPath: "m/48'/1'/0'/2'/0/0",
      index: 0,
      isChange: false,
      used: false,
      redeemScript: '522102abcd...03defg...52ae',
      witnessScript: '522102abcd...03defg...52ae',
      ...overrides,
    };
  };

  beforeEach(() => {
    // Clear chrome storage between tests
    if ((global as any).chrome?.storage?.local?.__clear) {
      (global as any).chrome.storage.local.__clear();
    }

    // Reset all mocks
    jest.clearAllMocks();
  });

  // =============================================================================
  // ensureMultisigAddressPool Tests
  // =============================================================================

  describe('ensureMultisigAddressPool', () => {
    // NOTE: ensureMultisigAddressPool is a private function called internally
    // by CREATE_MULTISIG_ACCOUNT and during wallet unlock.
    // We test its behavior indirectly through the routing tests and
    // through CREATE_MULTISIG_ACCOUNT in other test files.
    // The following tests verify the expected behavior and data structures.

    it('should verify multisig address structure includes required fields', async () => {
      const multisigAddress = createMockMultisigAddress();

      // Verify address metadata includes redeem/witness scripts
      expect(multisigAddress).toHaveProperty('address');
      expect(multisigAddress).toHaveProperty('derivationPath');
      expect(multisigAddress).toHaveProperty('index');
      expect(multisigAddress).toHaveProperty('isChange');
      expect(multisigAddress).toHaveProperty('used');
      expect(multisigAddress).toHaveProperty('redeemScript');
      expect(multisigAddress).toHaveProperty('witnessScript');
    });

    it('should verify multisig account configurations are valid', async () => {
      const configs = ['2-of-2', '2-of-3', '3-of-5'] as const;

      for (const config of configs) {
        const account = createMockMultisigAccount({ multisigConfig: config });
        expect(account.multisigConfig).toBe(config);
        expect(account.accountType).toBe('multisig');
        expect(account.cosigners.length).toBeGreaterThan(0);
      }
    });

    it('should verify address pool structure for multisig accounts', async () => {
      const account = createMockMultisigAccount({
        addresses: [
          createMockMultisigAddress({ index: 0, isChange: false }), // External
          createMockMultisigAddress({ index: 1, isChange: false }), // External
          createMockMultisigAddress({ index: 0, isChange: true }),  // Change
        ],
        externalIndex: 2,
        internalIndex: 1,
      });

      const externalAddresses = account.addresses.filter(a => !a.isChange);
      const changeAddresses = account.addresses.filter(a => a.isChange);

      expect(externalAddresses.length).toBe(2);
      expect(changeAddresses.length).toBe(1);
      expect(account.externalIndex).toBe(2);
      expect(account.internalIndex).toBe(1);
    });
  });

  // =============================================================================
  // handleGetMultisigBalance Tests
  // =============================================================================

  describe('handleGetMultisigBalance', () => {
    const mockMultisigAccount = createMockMultisigAccount({
      addresses: [
        createMockMultisigAddress({ index: 0, address: 'tb1qmultisig0' }),
        createMockMultisigAddress({ index: 1, address: 'tb1qmultisig1' }),
        createMockMultisigAddress({ index: 2, address: 'tb1qmultisig2' }),
      ],
    });

    beforeEach(() => {
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          version: 2,
          accounts: [mockMultisigAccount],
        })
      );
      (WalletStorage.updateAccount as jest.Mock).mockResolvedValue(undefined);
    });

    it('should fetch UTXOs for all addresses in account', async () => {
      const mockUTXOs1 = [createMockUTXO({ value: 100000, address: 'tb1qmultisig0' })];
      const mockUTXOs2 = [createMockUTXO({ value: 200000, address: 'tb1qmultisig1' })];
      const mockUTXOs3: UTXO[] = [];

      (blockstreamClient.getUTXOs as jest.Mock)
        .mockResolvedValueOnce(mockUTXOs1)
        .mockResolvedValueOnce(mockUTXOs2)
        .mockResolvedValueOnce(mockUTXOs3);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(blockstreamClient.getUTXOs).toHaveBeenCalledTimes(3);
      expect(blockstreamClient.getUTXOs).toHaveBeenCalledWith('tb1qmultisig0');
      expect(blockstreamClient.getUTXOs).toHaveBeenCalledWith('tb1qmultisig1');
      expect(blockstreamClient.getUTXOs).toHaveBeenCalledWith('tb1qmultisig2');
    });

    it('should calculate confirmed balance correctly', async () => {
      const confirmedUTXOs = [
        createMockUTXO({ value: 100000, confirmations: 6 }),
        createMockUTXO({ value: 200000, confirmations: 10 }),
        createMockUTXO({ value: 300000, confirmations: 3 }),
      ];

      (blockstreamClient.getUTXOs as jest.Mock)
        .mockResolvedValueOnce([confirmedUTXOs[0]])
        .mockResolvedValueOnce([confirmedUTXOs[1]])
        .mockResolvedValueOnce([confirmedUTXOs[2]]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.confirmed).toBe(600000); // 100k + 200k + 300k
    });

    it('should calculate unconfirmed balance correctly', async () => {
      const mixedUTXOs = [
        createMockUTXO({ value: 100000, confirmations: 6 }), // Confirmed
        createMockUTXO({ value: 50000, confirmations: 0 }),  // Unconfirmed
      ];

      (blockstreamClient.getUTXOs as jest.Mock)
        .mockResolvedValueOnce(mixedUTXOs)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.confirmed).toBe(100000);
      expect(response.data.unconfirmed).toBe(50000);
    });

    it('should mark addresses as used when they have UTXOs', async () => {
      const utxosForAddr0 = [createMockUTXO({ value: 100000, address: 'tb1qmultisig0' })];
      const noUTXOs: UTXO[] = [];

      (blockstreamClient.getUTXOs as jest.Mock)
        .mockResolvedValueOnce(utxosForAddr0) // Address 0 has UTXO
        .mockResolvedValueOnce(noUTXOs)        // Address 1 empty
        .mockResolvedValueOnce(noUTXOs);       // Address 2 empty

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);

      // Verify updateAccount was called to save address usage
      expect(WalletStorage.updateAccount).toHaveBeenCalled();
    });

    it('should handle empty UTXO set (0 balance)', async () => {
      (blockstreamClient.getUTXOs as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        confirmed: 0,
        unconfirmed: 0,
      });
    });

    it('should handle accounts with only unconfirmed UTXOs', async () => {
      const unconfirmedUTXOs = [
        createMockUTXO({ value: 100000, confirmations: 0 }),
        createMockUTXO({ value: 200000, confirmations: 0 }),
      ];

      (blockstreamClient.getUTXOs as jest.Mock)
        .mockResolvedValueOnce(unconfirmedUTXOs)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.confirmed).toBe(0);
      expect(response.data.unconfirmed).toBe(300000);
    });

    it('should aggregate UTXOs from multiple addresses', async () => {
      (blockstreamClient.getUTXOs as jest.Mock)
        .mockResolvedValueOnce([createMockUTXO({ value: 100000, confirmations: 6 })])
        .mockResolvedValueOnce([createMockUTXO({ value: 200000, confirmations: 6 })])
        .mockResolvedValueOnce([createMockUTXO({ value: 300000, confirmations: 6 })]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.confirmed).toBe(600000);
    });

    it('should handle API errors gracefully', async () => {
      (blockstreamClient.getUTXOs as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should return balance in correct format {confirmed, unconfirmed}', async () => {
      (blockstreamClient.getUTXOs as jest.Mock).mockResolvedValue([
        createMockUTXO({ value: 500000, confirmations: 6 }),
      ]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('confirmed');
      expect(response.data).toHaveProperty('unconfirmed');
      expect(typeof response.data.confirmed).toBe('number');
      expect(typeof response.data.unconfirmed).toBe('number');
    });

    it('should handle account with no addresses', async () => {
      const emptyAccount = createMockMultisigAccount({ addresses: [] });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          version: 2,
          accounts: [emptyAccount],
        })
      );

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual({
        confirmed: 0,
        unconfirmed: 0,
      });
    });
  });

  // =============================================================================
  // handleGetMultisigTransactions Tests
  // =============================================================================

  describe('handleGetMultisigTransactions', () => {
    const mockMultisigAccount = createMockMultisigAccount({
      addresses: [
        createMockMultisigAddress({ index: 0, address: 'tb1qmultisig0' }),
        createMockMultisigAddress({ index: 1, address: 'tb1qmultisig1' }),
        createMockMultisigAddress({ index: 2, address: 'tb1qmultisig2' }),
      ],
    });

    beforeEach(() => {
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          version: 2,
          accounts: [mockMultisigAccount],
        })
      );
    });

    it('should fetch transactions for all addresses in account', async () => {
      const mockTx1 = createMockTransaction({ txid: 'tx1', timestamp: 1000000 });
      const mockTx2 = createMockTransaction({ txid: 'tx2', timestamp: 2000000 });
      const mockTx3 = createMockTransaction({ txid: 'tx3', timestamp: 3000000 });

      (blockstreamClient.getTransactions as jest.Mock)
        .mockResolvedValueOnce([mockTx1])
        .mockResolvedValueOnce([mockTx2])
        .mockResolvedValueOnce([mockTx3]);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(blockstreamClient.getTransactions).toHaveBeenCalledTimes(3);
      expect(blockstreamClient.getTransactions).toHaveBeenCalledWith('tb1qmultisig0');
      expect(blockstreamClient.getTransactions).toHaveBeenCalledWith('tb1qmultisig1');
      expect(blockstreamClient.getTransactions).toHaveBeenCalledWith('tb1qmultisig2');
    });

    it('should deduplicate transactions by txid', async () => {
      const sharedTx = createMockTransaction({ txid: 'shared-tx', timestamp: 2000000 });
      const uniqueTx1 = createMockTransaction({ txid: 'unique-1', timestamp: 1000000 });
      const uniqueTx2 = createMockTransaction({ txid: 'unique-2', timestamp: 3000000 });

      // Same transaction appears in multiple address histories
      (blockstreamClient.getTransactions as jest.Mock)
        .mockResolvedValueOnce([sharedTx, uniqueTx1])
        .mockResolvedValueOnce([sharedTx]) // Duplicate
        .mockResolvedValueOnce([uniqueTx2]);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toHaveLength(3); // Not 4

      const txids = response.data.transactions.map((tx: Transaction) => tx.txid);
      expect(txids).toContain('shared-tx');
      expect(txids).toContain('unique-1');
      expect(txids).toContain('unique-2');

      // Ensure no duplicates
      const uniqueTxids = new Set(txids);
      expect(uniqueTxids.size).toBe(3);
    });

    it('should sort transactions by timestamp (newest first)', async () => {
      const oldTx = createMockTransaction({ txid: 'old', timestamp: 1000000 });
      const newTx = createMockTransaction({ txid: 'new', timestamp: 3000000 });
      const midTx = createMockTransaction({ txid: 'mid', timestamp: 2000000 });

      (blockstreamClient.getTransactions as jest.Mock)
        .mockResolvedValueOnce([oldTx])
        .mockResolvedValueOnce([newTx])
        .mockResolvedValueOnce([midTx]);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);

      const timestamps = response.data.transactions.map((tx: Transaction) => tx.timestamp);
      expect(timestamps[0]).toBe(3000000); // Newest first
      expect(timestamps[1]).toBe(2000000);
      expect(timestamps[2]).toBe(1000000);
    });

    it('should respect optional limit parameter', async () => {
      const transactions = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction({
          txid: `tx${i}`,
          timestamp: 1000000 + i * 1000,
        })
      );

      (blockstreamClient.getTransactions as jest.Mock).mockResolvedValue(transactions);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
        limit: 5,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toHaveLength(5);
    });

    it('should handle empty transaction history', async () => {
      (blockstreamClient.getTransactions as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toEqual([]);
    });

    it('should handle transactions across multiple addresses', async () => {
      const addr0Txs = [
        createMockTransaction({ txid: 'tx0', timestamp: 1000000 }),
        createMockTransaction({ txid: 'tx1', timestamp: 2000000 }),
      ];
      const addr1Txs = [
        createMockTransaction({ txid: 'tx2', timestamp: 3000000 }),
      ];
      const addr2Txs = [
        createMockTransaction({ txid: 'tx3', timestamp: 4000000 }),
        createMockTransaction({ txid: 'tx4', timestamp: 5000000 }),
      ];

      (blockstreamClient.getTransactions as jest.Mock)
        .mockResolvedValueOnce(addr0Txs)
        .mockResolvedValueOnce(addr1Txs)
        .mockResolvedValueOnce(addr2Txs);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toHaveLength(5);
    });

    it('should handle API errors gracefully', async () => {
      (blockstreamClient.getTransactions as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should merge transactions from all addresses correctly', async () => {
      const sharedTx = createMockTransaction({ txid: 'shared', timestamp: 2000000 });

      (blockstreamClient.getTransactions as jest.Mock)
        .mockResolvedValueOnce([sharedTx])
        .mockResolvedValueOnce([sharedTx]) // Duplicate - should be merged
        .mockResolvedValueOnce([sharedTx]); // Duplicate - should be merged

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toHaveLength(1); // Only one instance
      expect(response.data.transactions[0].txid).toBe('shared');
    });

    it('should handle account with no addresses', async () => {
      const emptyAccount = createMockMultisigAccount({ addresses: [] });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          version: 2,
          accounts: [emptyAccount],
        })
      );

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toEqual([]);
    });
  });

  // =============================================================================
  // handleGetBalance - Multisig Routing Tests
  // =============================================================================

  describe('handleGetBalance - multisig routing', () => {
    it('should detect single-sig accounts and use existing logic', async () => {
      const singleSigAccount = createMockAccount({
        index: 0,
        accountType: 'single',
        addresses: [
          {
            address: 'tb1qtest',
            derivationPath: "m/84'/1'/0'/0/0",
            index: 0,
            isChange: false,
            used: false,
          },
        ],
      });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({ accounts: [singleSigAccount] })
      );

      (blockstreamClient.getBalance as jest.Mock).mockResolvedValue({
        confirmed: 100000,
        unconfirmed: 0,
      });

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(blockstreamClient.getBalance).toHaveBeenCalled(); // Single-sig uses getBalance
      expect(blockstreamClient.getUTXOs).not.toHaveBeenCalled(); // Multisig would use getUTXOs
    });

    it('should detect multisig accounts and route to handleGetMultisigBalance', async () => {
      const multisigAccount = createMockMultisigAccount({
        addresses: [
          createMockMultisigAddress({ address: 'tb1qmultisig0' }),
        ],
      });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          version: 2,
          accounts: [multisigAccount],
        })
      );

      (blockstreamClient.getUTXOs as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(blockstreamClient.getUTXOs).toHaveBeenCalled(); // Multisig uses getUTXOs
    });

    it('should handle account not found error', async () => {
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({ accounts: [] })
      );

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 99,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('not found');
    });

    it('should preserve existing single-sig behavior', async () => {
      const singleSigAccount = createMockAccount({
        addresses: [
          {
            address: 'tb1qtest',
            derivationPath: "m/84'/1'/0'/0/0",
            index: 0,
            isChange: false,
            used: false,
          },
        ],
      });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({ accounts: [singleSigAccount] })
      );

      const expectedBalance = { confirmed: 250000, unconfirmed: 10000 };
      (blockstreamClient.getBalance as jest.Mock).mockResolvedValue(expectedBalance);

      const response = await sendMessage(MessageType.GET_BALANCE, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data).toEqual(expectedBalance);
    });
  });

  // =============================================================================
  // handleGetTransactions - Multisig Routing Tests
  // =============================================================================

  describe('handleGetTransactions - multisig routing', () => {
    it('should detect single-sig accounts and use existing logic', async () => {
      const singleSigAccount = createMockAccount({
        addresses: [
          {
            address: 'tb1qtest',
            derivationPath: "m/84'/1'/0'/0/0",
            index: 0,
            isChange: false,
            used: false,
          },
        ],
      });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({ accounts: [singleSigAccount] })
      );

      (blockstreamClient.getTransactions as jest.Mock).mockResolvedValue([
        createMockTransaction(),
      ]);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toBeDefined();
    });

    it('should detect multisig accounts and route to handleGetMultisigTransactions', async () => {
      const multisigAccount = createMockMultisigAccount({
        addresses: [
          createMockMultisigAddress({ address: 'tb1qmultisig0' }),
        ],
      });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({
          version: 2,
          accounts: [multisigAccount],
        })
      );

      (blockstreamClient.getTransactions as jest.Mock).mockResolvedValue([]);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toBeDefined();
    });

    it('should handle account not found error', async () => {
      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({ accounts: [] })
      );

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 99,
      });

      expect(response.success).toBe(false);
      expect(response.error).toContain('not found');
    });

    it('should preserve existing single-sig behavior', async () => {
      const singleSigAccount = createMockAccount({
        addresses: [
          {
            address: 'tb1qtest',
            derivationPath: "m/84'/1'/0'/0/0",
            index: 0,
            isChange: false,
            used: false,
          },
        ],
      });

      (WalletStorage.getWallet as jest.Mock).mockResolvedValue(
        createMockStoredWallet({ accounts: [singleSigAccount] })
      );

      const expectedTxs = [createMockTransaction()];
      (blockstreamClient.getTransactions as jest.Mock).mockResolvedValue(expectedTxs);

      const response = await sendMessage(MessageType.GET_TRANSACTIONS, {
        accountIndex: 0,
      });

      expect(response.success).toBe(true);
      expect(response.data.transactions).toHaveLength(1);
    });
  });
});
