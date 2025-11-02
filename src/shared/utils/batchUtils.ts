/**
 * Batch Utilities for API Request Optimization
 *
 * Provides utilities for batching API requests to avoid rate limiting
 * and improve performance when querying multiple addresses.
 *
 * Why batch requests?
 * - Prevents rate limiting (429 errors) from Blockstream API
 * - Reduces server load on both proxy and Blockstream
 * - Improves perceived performance (progressive results)
 * - Better error handling (failures don't block entire operation)
 *
 * Configuration:
 * - BATCH_SIZE: 5 addresses per batch (conservative to avoid rate limits)
 * - BATCH_DELAY_MS: 500ms delay between batches (allows rate limit window to reset)
 *
 * Usage:
 * const results = await fetchInBatches(
 *   addresses,
 *   (addr) => blockstreamClient.getBalance(addr)
 * );
 */

/**
 * Configuration for batch processing
 */
const BATCH_SIZE = 5; // Process 5 addresses at a time
const BATCH_DELAY_MS = 500; // Wait 500ms between batches

/**
 * Result type for batched operations
 */
export interface BatchResult<T> {
  success: Map<string, T>;
  errors: Map<string, Error>;
  total: number;
  successCount: number;
  errorCount: number;
}

/**
 * Fetch data in batches with delays between batches
 *
 * This function processes an array of items in small batches, waiting
 * between each batch to avoid rate limiting. Failed requests are tracked
 * separately and don't block the entire operation.
 *
 * @param items - Array of items to process (e.g., addresses)
 * @param fetchFunction - Async function to fetch data for each item
 * @param batchSize - Number of items per batch (default: 5)
 * @param batchDelay - Delay in ms between batches (default: 500)
 * @returns BatchResult with successful results and errors
 *
 * @example
 * const result = await fetchInBatches(
 *   ['addr1', 'addr2', 'addr3'],
 *   (addr) => blockstreamClient.getBalance(addr)
 * );
 * console.log(`Success: ${result.successCount}, Errors: ${result.errorCount}`);
 */
export async function fetchInBatches<T>(
  items: string[],
  fetchFunction: (item: string) => Promise<T>,
  batchSize: number = BATCH_SIZE,
  batchDelay: number = BATCH_DELAY_MS
): Promise<BatchResult<T>> {
  const success = new Map<string, T>();
  const errors = new Map<string, Error>();

  // Process items in batches
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // Fetch batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map((item) => fetchFunction(item))
    );

    // Process results
    batch.forEach((item, idx) => {
      const result = batchResults[idx];
      if (result.status === 'fulfilled') {
        success.set(item, result.value);
      } else {
        errors.set(item, result.reason);
      }
    });

    // Delay before next batch (unless this was the last batch)
    if (i + batchSize < items.length) {
      await sleep(batchDelay);
    }
  }

  return {
    success,
    errors,
    total: items.length,
    successCount: success.size,
    errorCount: errors.size,
  };
}

/**
 * Sleep utility for delays
 * @param ms Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a failed operation with exponential backoff
 *
 * Useful for transient errors like network timeouts or 502 proxy errors.
 *
 * @param operation - Async function to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelay - Initial delay in ms before first retry (default: 1000)
 * @returns Result of the operation
 * @throws Last error if all retries fail
 *
 * @example
 * const balance = await retryWithBackoff(
 *   () => blockstreamClient.getBalance(address),
 *   3,
 *   1000
 * );
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on final attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff: 1s, 2s, 4s, ...
      const delay = initialDelay * Math.pow(2, attempt);
      console.warn(
        `[retryWithBackoff] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`,
        error
      );

      await sleep(delay);
    }
  }

  // All retries exhausted
  throw lastError || new Error('Operation failed after retries');
}
