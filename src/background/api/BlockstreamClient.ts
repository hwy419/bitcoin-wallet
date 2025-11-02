/**
 * Blockstream API Client
 *
 * Provides a comprehensive interface to the Blockstream Esplora API for interacting
 * with the Bitcoin blockchain (testnet and mainnet).
 *
 * API Documentation: https://github.com/Blockstream/esplora/blob/master/API.md
 */

import type { UTXO, Transaction, Balance } from '../../shared/types';

/**
 * Fee estimates for different confirmation targets
 */
export interface FeeEstimates {
  slow: number;    // sat/vB - Low priority (6+ blocks)
  medium: number;  // sat/vB - Medium priority (3-6 blocks)
  fast: number;    // sat/vB - High priority (1-2 blocks)
}

/**
 * Raw address info response from Blockstream API
 */
interface BlockstreamAddressInfo {
  address: string;
  chain_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
  mempool_stats: {
    funded_txo_count: number;
    funded_txo_sum: number;
    spent_txo_count: number;
    spent_txo_sum: number;
    tx_count: number;
  };
}

/**
 * Raw UTXO response from Blockstream API
 */
interface BlockstreamUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

/**
 * Raw transaction response from Blockstream API
 */
interface BlockstreamTransaction {
  txid: string;
  version: number;
  locktime: number;
  vin: Array<{
    txid: string;
    vout: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address?: string;
      value: number;
    };
    scriptsig: string;
    scriptsig_asm: string;
    witness?: string[];
    is_coinbase: boolean;
    sequence: number;
  }>;
  vout: Array<{
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address?: string;
    value: number;
  }>;
  size: number;
  weight: number;
  fee: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
}

/**
 * Fee estimates response from Blockstream API
 * Maps block target to fee rate in sat/vB
 */
interface BlockstreamFeeEstimates {
  [blocks: string]: number;
}

/**
 * Custom error types for API operations
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  INVALID_ADDRESS = 'INVALID_ADDRESS',
  INVALID_TRANSACTION = 'INVALID_TRANSACTION',
  BROADCAST_FAILED = 'BROADCAST_FAILED',
  NOT_FOUND = 'NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  PROXY_ERROR = 'PROXY_ERROR', // Lambda proxy or backend service error
  UNKNOWN = 'UNKNOWN',
}

/**
 * API Error class with type information
 */
export class ApiError extends Error {
  constructor(
    public type: ApiErrorType,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Blockstream API Client
 *
 * Handles all interactions with the Blockstream Esplora API including:
 * - Address lookups and balance queries
 * - Transaction history retrieval
 * - UTXO fetching
 * - Transaction broadcasting
 * - Fee estimation
 */
export class BlockstreamClient {
  private readonly baseUrl: string;
  private readonly network: 'mainnet' | 'testnet';
  private readonly timeout: number = 10000; // 10 seconds
  private readonly retryDelays: number[] = [1000, 2000, 4000]; // Exponential backoff
  private readonly isUsingProxy: boolean;

  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.network = network;

    // Use Lambda proxy if configured (production), otherwise Blockstream direct (development)
    const proxyUrl = process.env.BLOCKSTREAM_PROXY_URL;

    if (proxyUrl) {
      // Production: Use Lambda proxy
      // Network will be appended as query parameter to each request
      this.baseUrl = proxyUrl;
      this.isUsingProxy = true;
      console.log(`[BlockstreamClient] Using Lambda proxy for ${network}: ${proxyUrl}`);
    } else {
      // Development: Use Blockstream API directly
      // In development, you can optionally use local API keys (never commit them!)
      this.baseUrl = network === 'mainnet'
        ? 'https://blockstream.info/api'
        : 'https://blockstream.info/testnet/api';
      this.isUsingProxy = false;
      console.log(`[BlockstreamClient] Using direct Blockstream API for ${network}: ${this.baseUrl}`);
    }
  }

  /**
   * Get address information including balance
   * @param address Bitcoin address
   * @returns Address info with chain and mempool stats
   */
  async getAddressInfo(address: string): Promise<BlockstreamAddressInfo> {
    console.log(`[BlockstreamClient] Fetching address info for: ${address}`);

    return this.fetchWithRetry<BlockstreamAddressInfo>(
      `/address/${address}`,
      'Failed to fetch address info'
    );
  }

  /**
   * Get confirmed and unconfirmed balance for an address
   * @param address Bitcoin address
   * @returns Balance object with confirmed and unconfirmed amounts in satoshis
   */
  async getBalance(address: string): Promise<Balance> {
    const info = await this.getAddressInfo(address);

    const confirmed = info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum;
    const unconfirmed = info.mempool_stats.funded_txo_sum - info.mempool_stats.spent_txo_sum;

    console.log(`[BlockstreamClient] Balance for ${address}: ${confirmed} confirmed, ${unconfirmed} unconfirmed`);

    return {
      confirmed,
      unconfirmed,
    };
  }

  /**
   * Get transaction history for an address
   * @param address Bitcoin address
   * @returns Array of transactions involving the address
   */
  async getTransactions(address: string): Promise<Transaction[]> {
    console.log(`[BlockstreamClient] Fetching transactions for: ${address}`);

    const rawTxs = await this.fetchWithRetry<BlockstreamTransaction[]>(
      `/address/${address}/txs`,
      'Failed to fetch transactions'
    );

    // If no transactions, return empty array without fetching block height
    if (rawTxs.length === 0) {
      console.log(`[BlockstreamClient] No transactions found for ${address}`);
      return [];
    }

    // Get current block height for calculating confirmations
    const currentHeight = await this.getCurrentBlockHeight();

    // Transform raw API response to our Transaction type
    const transactions: Transaction[] = rawTxs.map(tx => this.parseTransaction(tx, address, currentHeight));

    console.log(`[BlockstreamClient] Found ${transactions.length} transactions for ${address}`);

    return transactions;
  }

  /**
   * Get unspent transaction outputs (UTXOs) for an address
   * @param address Bitcoin address
   * @returns Array of UTXOs available for spending
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    console.log(`[BlockstreamClient] Fetching UTXOs for: ${address}`);

    const rawUtxos = await this.fetchWithRetry<BlockstreamUTXO[]>(
      `/address/${address}/utxo`,
      'Failed to fetch UTXOs'
    );

    // Get current block height for calculating confirmations
    const currentHeight = await this.getCurrentBlockHeight();

    // For each UTXO, fetch the transaction to get scriptPubKey
    const utxos: UTXO[] = await Promise.all(
      rawUtxos.map(async (utxo) => {
        // Fetch the transaction to get scriptPubKey
        const tx = await this.fetchWithRetry<BlockstreamTransaction>(
          `/tx/${utxo.txid}`,
          `Failed to fetch transaction ${utxo.txid}`
        );

        // Get the scriptPubKey from the correct output
        const vout = tx.vout[utxo.vout];
        if (!vout) {
          throw new Error(`Output ${utxo.vout} not found in transaction ${utxo.txid}`);
        }

        return {
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          address,
          scriptPubKey: vout.scriptpubkey, // Get from transaction output
          confirmations: utxo.status.confirmed && utxo.status.block_height
            ? currentHeight - utxo.status.block_height + 1
            : 0,
        };
      })
    );

    console.log(`[BlockstreamClient] Found ${utxos.length} UTXOs for ${address}`);

    return utxos;
  }

  /**
   * Broadcast a signed transaction to the network
   * @param txHex Raw transaction in hexadecimal format
   * @returns Transaction ID (txid) if successful
   */
  async broadcastTransaction(txHex: string): Promise<string> {
    console.log(`[BlockstreamClient] Broadcasting transaction (${txHex.length} bytes hex)`);

    try {
      // Build URL with network query parameter if using proxy
      let txUrl = `${this.baseUrl}/tx`;
      if (this.isUsingProxy) {
        txUrl = `${txUrl}?network=${this.network}`;
      }

      const response = await this.fetchWithTimeout(txUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: txHex,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[BlockstreamClient] Broadcast failed: ${response.status} ${errorText}`);

        if (response.status === 400) {
          throw new ApiError(
            ApiErrorType.INVALID_TRANSACTION,
            `Invalid transaction: ${errorText}`
          );
        }

        throw new ApiError(
          ApiErrorType.BROADCAST_FAILED,
          `Failed to broadcast transaction: ${response.status} ${errorText}`
        );
      }

      const txid = await response.text();
      console.log(`[BlockstreamClient] Transaction broadcast successful: ${txid}`);

      return txid;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      console.error('[BlockstreamClient] Broadcast error:', error);
      throw new ApiError(
        ApiErrorType.BROADCAST_FAILED,
        'Failed to broadcast transaction',
        error as Error
      );
    }
  }

  /**
   * Get current fee estimates for different confirmation targets
   * @returns Fee estimates in sat/vB for slow, medium, and fast confirmations
   */
  async getFeeEstimates(): Promise<FeeEstimates> {
    console.log('[BlockstreamClient] Fetching fee estimates');

    const estimates = await this.fetchWithRetry<BlockstreamFeeEstimates>(
      '/fee-estimates',
      'Failed to fetch fee estimates'
    );

    console.log('[BlockstreamClient] Raw API estimates:', estimates);

    // Parse fee estimates from the API response
    // The API returns estimates for different block targets (e.g., "1", "2", "3", "6", "10", etc.)
    // We map these to our slow/medium/fast categories
    let feeEstimates: FeeEstimates = {
      fast: estimates['1'] || estimates['2'] || 5,    // Next 1-2 blocks
      medium: estimates['3'] || estimates['6'] || 3,  // 3-6 blocks
      slow: estimates['10'] || estimates['12'] || 1,  // 10+ blocks
    };

    // TESTNET FIX: Cap fee rates at reasonable values
    // Testnet API sometimes returns unrealistic values due to irregular block production
    const MAX_TESTNET_FEE = 50; // sat/vB - reasonable maximum for testnet
    const MIN_TESTNET_FEE = 1;  // sat/vB - minimum

    if (this.network === 'testnet') {
      feeEstimates = {
        fast: Math.min(Math.max(feeEstimates.fast, MIN_TESTNET_FEE), MAX_TESTNET_FEE),
        medium: Math.min(Math.max(feeEstimates.medium, MIN_TESTNET_FEE), MAX_TESTNET_FEE),
        slow: Math.min(Math.max(feeEstimates.slow, MIN_TESTNET_FEE), MAX_TESTNET_FEE),
      };
      console.log('[BlockstreamClient] Capped testnet fee estimates:', feeEstimates);
    }

    console.log('[BlockstreamClient] Final fee estimates:', feeEstimates);

    return feeEstimates;
  }

  /**
   * Get current blockchain height
   * @returns Current block height
   */
  private async getCurrentBlockHeight(): Promise<number> {
    try {
      // Build URL with network query parameter if using proxy
      let tipHashUrl = `${this.baseUrl}/blocks/tip/hash`;
      if (this.isUsingProxy) {
        tipHashUrl = `${tipHashUrl}?network=${this.network}`;
      }

      // Fetch tip hash (returns plain text, not JSON)
      const tipHashResponse = await this.fetchWithTimeout(tipHashUrl);

      if (!tipHashResponse.ok) {
        throw new Error(`Failed to fetch tip hash: ${tipHashResponse.status}`);
      }

      const tipHash = await tipHashResponse.text();

      // Fetch block info (returns JSON)
      const block = await this.fetchWithRetry<{ height: number }>(
        `/block/${tipHash}`,
        'Failed to fetch block info'
      );

      return block.height;
    } catch (error) {
      console.warn('[BlockstreamClient] Failed to get block height, using 0:', error);
      return 0;
    }
  }

  /**
   * Parse raw transaction from Blockstream API to our Transaction type
   * @param tx Raw transaction from API
   * @param address Address to calculate value for
   * @param currentHeight Current blockchain height for calculating confirmations
   * @returns Parsed transaction
   */
  private parseTransaction(tx: BlockstreamTransaction, address: string, currentHeight: number): Transaction {
    // Calculate the value change for this address
    let value = 0;

    // Add up outputs to this address
    for (const vout of tx.vout) {
      if (vout.scriptpubkey_address === address) {
        value += vout.value;
      }
    }

    // Subtract inputs from this address
    for (const vin of tx.vin) {
      if (vin.prevout.scriptpubkey_address === address) {
        value -= vin.prevout.value;
      }
    }

    return {
      txid: tx.txid,
      confirmations: tx.status.confirmed && tx.status.block_height
        ? currentHeight - tx.status.block_height + 1
        : 0,
      timestamp: tx.status.block_time || Date.now() / 1000,
      value,
      fee: tx.fee,
      inputs: tx.vin.map(vin => ({
        txid: vin.txid,
        vout: vin.vout,
        address: vin.prevout.scriptpubkey_address || '',
        value: vin.prevout.value,
      })),
      outputs: tx.vout.map(vout => ({
        address: vout.scriptpubkey_address || '',
        value: vout.value,
        scriptPubKey: vout.scriptpubkey,
      })),
    };
  }

  /**
   * Fetch with retry logic and exponential backoff
   * @param endpoint API endpoint
   * @param errorMessage Error message prefix
   * @returns Parsed JSON response
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    errorMessage: string
  ): Promise<T> {
    let lastError: Error | null = null;

    // Try the request with retries
    for (let i = 0; i <= this.retryDelays.length; i++) {
      try {
        // Build URL with network query parameter if using proxy
        let url = `${this.baseUrl}${endpoint}`;
        if (this.isUsingProxy) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}network=${this.network}`;
        }

        const response = await this.fetchWithTimeout(url);

        if (!response.ok) {
          // Handle specific HTTP error codes
          if (response.status === 404) {
            throw new ApiError(
              ApiErrorType.NOT_FOUND,
              `${errorMessage}: Resource not found`
            );
          }

          if (response.status === 429) {
            throw new ApiError(
              ApiErrorType.RATE_LIMITED,
              'Rate limit exceeded, please try again later'
            );
          }

          if (response.status === 400) {
            throw new ApiError(
              ApiErrorType.INVALID_ADDRESS,
              `${errorMessage}: Invalid request`
            );
          }

          if (response.status === 502 || response.status === 503 || response.status === 504) {
            throw new ApiError(
              ApiErrorType.PROXY_ERROR,
              'Blockchain service temporarily unavailable. Please try again in a moment.'
            );
          }

          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json() as T;
        return data;
      } catch (error) {
        lastError = error as Error;

        // Don't retry on specific errors
        if (error instanceof ApiError) {
          if ([
            ApiErrorType.NOT_FOUND,
            ApiErrorType.INVALID_ADDRESS,
            ApiErrorType.INVALID_TRANSACTION,
          ].includes(error.type)) {
            throw error;
          }
        }

        // If we have more retries, wait and try again
        if (i < this.retryDelays.length) {
          const delay = this.retryDelays[i];
          console.warn(`[BlockstreamClient] Request failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries exhausted
    console.error(`[BlockstreamClient] ${errorMessage} after ${this.retryDelays.length + 1} attempts:`, lastError);

    throw new ApiError(
      ApiErrorType.NETWORK_ERROR,
      `${errorMessage}: ${lastError?.message || 'Unknown error'}`,
      lastError || undefined
    );
  }

  /**
   * Fetch with timeout
   * @param url URL to fetch
   * @param options Fetch options
   * @returns Response
   */
  private async fetchWithTimeout(
    url: string,
    options?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new ApiError(
          ApiErrorType.TIMEOUT,
          `Request timed out after ${this.timeout}ms`
        );
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sleep for a specified duration
   * @param ms Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Singleton instance for testnet (default)
 */
export const blockstreamClient = new BlockstreamClient('testnet');
