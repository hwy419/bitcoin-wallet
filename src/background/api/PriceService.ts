/**
 * Bitcoin Price Service
 *
 * Fetches BTC/USD spot price from CoinGecko API with caching to minimize API calls.
 * Price data is cached for 5 minutes before refreshing.
 */

export interface BitcoinPrice {
  usd: number;
  lastUpdated: number;
}

/**
 * Response from CoinGecko simple price API
 */
interface CoinGeckoResponse {
  bitcoin: {
    usd: number;
  };
}

/**
 * Price Service for fetching Bitcoin spot prices
 *
 * Features:
 * - Fetches BTC/USD price from CoinGecko API
 * - 5-minute cache to avoid excessive API calls
 * - Automatic retry with exponential backoff
 * - Fallback error handling
 */
export class PriceService {
  private readonly apiUrl = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private readonly timeout = 10000; // 10 seconds
  private readonly retryDelays = [1000, 2000, 4000]; // Exponential backoff

  private cachedPrice: BitcoinPrice | null = null;

  constructor() {
    console.log('[PriceService] Initialized');
  }

  /**
   * Get current BTC/USD price
   * Returns cached price if still valid, otherwise fetches fresh data
   * @returns Bitcoin price in USD with last updated timestamp
   */
  async getPrice(): Promise<BitcoinPrice> {
    // Return cached price if still valid
    if (this.isCacheValid()) {
      console.log('[PriceService] Returning cached price:', this.cachedPrice);
      return this.cachedPrice!;
    }

    // Fetch fresh price
    console.log('[PriceService] Cache expired or empty, fetching fresh price');
    const price = await this.fetchPrice();

    // Update cache
    this.cachedPrice = {
      usd: price,
      lastUpdated: Date.now(),
    };

    console.log('[PriceService] Price updated:', this.cachedPrice);
    return this.cachedPrice;
  }

  /**
   * Check if cached price is still valid
   * @returns true if cache is valid, false if expired or empty
   */
  private isCacheValid(): boolean {
    if (!this.cachedPrice) {
      return false;
    }

    const age = Date.now() - this.cachedPrice.lastUpdated;
    return age < this.cacheTimeout;
  }

  /**
   * Fetch fresh price from CoinGecko API with retry logic
   * @returns Bitcoin price in USD
   */
  private async fetchPrice(): Promise<number> {
    let lastError: Error | null = null;

    // Try the request with retries
    for (let i = 0; i <= this.retryDelays.length; i++) {
      try {
        const response = await this.fetchWithTimeout(this.apiUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json() as CoinGeckoResponse;

        if (!data.bitcoin || typeof data.bitcoin.usd !== 'number') {
          throw new Error('Invalid response format from CoinGecko API');
        }

        console.log('[PriceService] Fetched price:', data.bitcoin.usd);
        return data.bitcoin.usd;
      } catch (error) {
        lastError = error as Error;

        // If we have more retries, wait and try again
        if (i < this.retryDelays.length) {
          const delay = this.retryDelays[i];
          console.warn(`[PriceService] Request failed, retrying in ${delay}ms:`, error);
          await this.sleep(delay);
          continue;
        }
      }
    }

    // All retries exhausted
    console.error(`[PriceService] Failed to fetch price after ${this.retryDelays.length + 1} attempts:`, lastError);
    throw new Error(`Failed to fetch Bitcoin price: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Fetch with timeout
   * @param url URL to fetch
   * @returns Response
   */
  private async fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
      });
      return response;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeout}ms`);
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

  /**
   * Clear cached price (useful for testing)
   */
  clearCache(): void {
    console.log('[PriceService] Cache cleared');
    this.cachedPrice = null;
  }
}

/**
 * Singleton instance for price service
 */
export const priceService = new PriceService();
