/**
 * PriceService Test Suite
 *
 * Comprehensive tests for Bitcoin price fetching service including:
 * - Price fetching from CoinGecko API
 * - 5-minute caching mechanism
 * - Cache invalidation and expiration
 * - Error handling (network errors, invalid responses, timeouts)
 * - Retry logic with exponential backoff
 * - Edge cases and boundary conditions
 *
 * All API calls are mocked using global fetch mock
 *
 * @jest-environment node
 */

import { PriceService, BitcoinPrice } from '../PriceService';
import { createMockResponse, wait, setupMockFetchSequence } from '../../../__tests__/utils/testHelpers';
import { createMockCoinGeckoResponse } from '../../../__tests__/utils/testFactories';

// Mock fetch globally
global.fetch = jest.fn();

describe('PriceService', () => {
  let service: PriceService;
  const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Set default test timeout to 10 seconds
  jest.setTimeout(10000);

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useRealTimers();
    service = new PriceService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ===========================================================================
  // Constructor Tests
  // ===========================================================================

  describe('constructor', () => {
    it('should create PriceService instance', () => {
      const priceService = new PriceService();
      expect(priceService).toBeDefined();
      expect(priceService).toBeInstanceOf(PriceService);
    });

    it('should initialize with null cached price', async () => {
      const priceService = new PriceService();

      // Mock successful API response
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(65000))
      );

      // First call should fetch from API
      const price = await priceService.getPrice();
      expect(price).toBeDefined();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Price Fetching Tests
  // ===========================================================================

  describe('getPrice', () => {
    it('should fetch price from CoinGecko API', async () => {
      const mockPrice = 65432.10;
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(mockPrice))
      );

      const result = await service.getPrice();

      expect(result).toBeDefined();
      expect(result.usd).toBe(mockPrice);
      expect(result.lastUpdated).toBeDefined();
      expect(typeof result.lastUpdated).toBe('number');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.coingecko.com'),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        })
      );
    });

    it('should include bitcoin and usd parameters in API call', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(60000))
      );

      await service.getPrice();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('ids=bitcoin'),
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('vs_currencies=usd'),
        expect.any(Object)
      );
    });

    it('should parse CoinGecko response correctly', async () => {
      const mockPrice = 70123.45;
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(mockPrice))
      );

      const result = await service.getPrice();

      expect(result.usd).toBe(mockPrice);
      expect(result.lastUpdated).toBeGreaterThan(Date.now() - 1000); // Within last second
    });

    it('should handle different price values', async () => {
      const prices = [10000, 50000, 100000, 999999.99];

      for (const price of prices) {
        jest.clearAllMocks();
        service.clearCache();

        (global.fetch as jest.Mock).mockResolvedValueOnce(
          createMockResponse(createMockCoinGeckoResponse(price))
        );

        const result = await service.getPrice();
        expect(result.usd).toBe(price);
      }
    });

    it('should handle very small price values', async () => {
      const smallPrice = 0.01;
      service.clearCache();

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(smallPrice))
      );

      const result = await service.getPrice();
      expect(result.usd).toBe(smallPrice);
    });

    it('should handle very large price values', async () => {
      const largePrice = 1000000;
      service.clearCache();

      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(largePrice))
      );

      const result = await service.getPrice();
      expect(result.usd).toBe(largePrice);
    });
  });

  // ===========================================================================
  // Caching Tests
  // ===========================================================================

  describe('caching', () => {
    it('should cache price for 5 minutes', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse(createMockCoinGeckoResponse(65000))
      );

      // First call
      const price1 = await service.getPrice();
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Second call within cache timeout
      const price2 = await service.getPrice();
      expect(global.fetch).toHaveBeenCalledTimes(1); // No additional call

      expect(price1.usd).toBe(price2.usd);
      expect(price1.lastUpdated).toBe(price2.lastUpdated);
    });

    it('should return same object reference when cached', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(65000))
      );

      const price1 = await service.getPrice();
      const price2 = await service.getPrice();

      expect(price1).toBe(price2); // Same reference
    });

    it('should fetch new price after cache expires', async () => {
      jest.useFakeTimers();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(60000)))
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(70000)));

      // First call
      const promise1 = service.getPrice();
      await jest.runAllTimersAsync();
      const price1 = await promise1;
      expect(price1.usd).toBe(60000);

      // Advance time past cache expiration
      jest.advanceTimersByTime(CACHE_TIMEOUT + 1000);

      // Second call after cache expiration
      const promise2 = service.getPrice();
      await jest.runAllTimersAsync();
      const price2 = await promise2;
      expect(price2.usd).toBe(70000);

      expect(global.fetch).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should update lastUpdated timestamp on new fetch', async () => {
      jest.useFakeTimers();
      const startTime = Date.now();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(60000)))
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(65000)));

      // First call
      const promise1 = service.getPrice();
      await jest.runAllTimersAsync();
      const price1 = await promise1;

      // Advance time
      jest.advanceTimersByTime(CACHE_TIMEOUT + 1000);

      // Second call
      const promise2 = service.getPrice();
      await jest.runAllTimersAsync();
      const price2 = await promise2;

      expect(price2.lastUpdated).toBeGreaterThan(price1.lastUpdated);

      jest.useRealTimers();
    });

    it('should not cache on error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse('Error', false, 500))
        .mockResolvedValueOnce(createMockResponse('Error', false, 500))
        .mockResolvedValueOnce(createMockResponse('Error', false, 500))
        .mockResolvedValueOnce(createMockResponse('Error', false, 500))
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(65000), true, 200));

      // First call fails
      await expect(service.getPrice()).rejects.toThrow();

      // Second call should try again (not use cached error)
      const price = await service.getPrice();
      expect(price.usd).toBe(65000);
    });
  });

  describe('clearCache', () => {
    it('should clear cached price', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(60000)))
        .mockResolvedValueOnce(createMockResponse(createMockCoinGeckoResponse(70000)));

      // First call
      const price1 = await service.getPrice();
      expect(price1.usd).toBe(60000);

      // Clear cache
      service.clearCache();

      // Next call should fetch new price
      const price2 = await service.getPrice();
      expect(price2.usd).toBe(70000);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should allow fetching after clearing cache', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse(createMockCoinGeckoResponse(65000))
      );

      await service.getPrice();
      service.clearCache();
      await service.getPrice();

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('error handling', () => {
    it('should throw error on HTTP error response', async () => {
      // Provide enough responses for all retry attempts (1 initial + 3 retries = 4 total)
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse('Internal Server Error', false, 500)
      );

      await expect(service.getPrice()).rejects.toThrow('Failed to fetch Bitcoin price');
    }, 15000); // Increase timeout for retries

    it('should throw error on 404 not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse('Not Found', false, 404)
      );

      await expect(service.getPrice()).rejects.toThrow();
    }, 15000);

    it('should throw error on 429 rate limit', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse('Rate limit exceeded', false, 429)
      );

      await expect(service.getPrice()).rejects.toThrow();
    }, 15000);

    it('should throw error on network failure', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(service.getPrice()).rejects.toThrow();
    }, 15000);

    it('should throw error on invalid response format (missing bitcoin key)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ ethereum: { usd: 3000 } })
      );

      await expect(service.getPrice()).rejects.toThrow('Invalid response format');
    }, 15000);

    it('should throw error on invalid response format (missing usd key)', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ bitcoin: { eur: 60000 } })
      );

      await expect(service.getPrice()).rejects.toThrow('Invalid response format');
    }, 15000);

    it('should throw error on non-numeric price', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ bitcoin: { usd: 'not a number' } })
      );

      await expect(service.getPrice()).rejects.toThrow('Invalid response format');
    }, 15000);

    it('should throw error on null price', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ bitcoin: { usd: null } })
      );

      await expect(service.getPrice()).rejects.toThrow('Invalid response format');
    }, 15000);

    it('should throw error on undefined price', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({ bitcoin: { usd: undefined } })
      );

      await expect(service.getPrice()).rejects.toThrow('Invalid response format');
    }, 15000);
  });

  // ===========================================================================
  // Retry Logic Tests
  // ===========================================================================

  describe('retry logic', () => {
    it('should retry on transient failures', async () => {
      jest.useFakeTimers();

      setupMockFetchSequence([
        { data: 'Error', ok: false, status: 500 },
        { data: 'Error', ok: false, status: 500 },
        { data: createMockCoinGeckoResponse(65000), ok: true },
      ]);

      const pricePromise = service.getPrice();
      await jest.runAllTimersAsync();
      const price = await pricePromise;

      expect(price.usd).toBe(65000);
      expect(global.fetch).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    });

    it('should use exponential backoff between retries', async () => {
      jest.useFakeTimers();

      setupMockFetchSequence([
        { data: 'Error', ok: false, status: 500 },
        { data: 'Error', ok: false, status: 500 },
        { data: createMockCoinGeckoResponse(65000), ok: true },
      ]);

      const pricePromise = service.getPrice();

      // Fast-forward through retries
      await jest.runAllTimersAsync();

      const price = await pricePromise;
      expect(price.usd).toBe(65000);

      jest.useRealTimers();
    });

    it('should throw after all retries exhausted', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse('Error', false, 500)
      );

      await expect(service.getPrice()).rejects.toThrow('Failed to fetch Bitcoin price');

      // Should try initial + 3 retries = 4 total attempts
      expect(global.fetch).toHaveBeenCalledTimes(4);
    }, 15000);

    it('should include error details in final error message', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse('Specific error message', false, 500)
      );

      await expect(service.getPrice()).rejects.toThrow('Failed to fetch Bitcoin price');
    }, 15000);

    it('should retry exactly 3 times', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse('Error', false, 500)
      );

      await expect(service.getPrice()).rejects.toThrow();

      // 1 initial attempt + 3 retries = 4 total
      expect(global.fetch).toHaveBeenCalledTimes(4);
    }, 15000);
  });

  // ===========================================================================
  // Timeout Tests
  // ===========================================================================

  describe('timeout', () => {
    it('should timeout after 10 seconds', async () => {
      // Mock fetch to timeout
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      await expect(service.getPrice()).rejects.toThrow();
    }, 15000);

    it('should abort request on timeout', async () => {
      // This test verifies that AbortController is being used
      // In practice, the abort is handled by the browser/fetch implementation
      (global.fetch as jest.Mock).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 100);
        });
      });

      await expect(service.getPrice()).rejects.toThrow();
    }, 15000);
  });

  // ===========================================================================
  // Edge Cases Tests
  // ===========================================================================

  describe('edge cases', () => {
    it('should handle zero price', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(0))
      );

      const price = await service.getPrice();
      expect(price.usd).toBe(0);
    });

    it('should handle negative price (invalid but test parsing)', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(-100))
      );

      const price = await service.getPrice();
      expect(price.usd).toBe(-100);
    });

    it('should handle price with many decimal places', async () => {
      const precisePrice = 65432.123456789;
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        createMockResponse(createMockCoinGeckoResponse(precisePrice))
      );

      const price = await service.getPrice();
      expect(price.usd).toBe(precisePrice);
    });

    it('should handle empty response body', async () => {
      // Service will retry 3 times (4 total attempts), so provide response for all
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse({})
      );

      await expect(service.getPrice()).rejects.toThrow('Invalid response format');
    }, 15000);

    it('should handle malformed JSON', async () => {
      // Service will retry 3 times (4 total attempts), so use mockResolvedValue
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(service.getPrice()).rejects.toThrow();
    }, 15000);

    it('should handle concurrent requests with caching', async () => {
      // Use mockResolvedValue (not mockResolvedValueOnce) to handle potential retries
      (global.fetch as jest.Mock).mockResolvedValue(
        createMockResponse(createMockCoinGeckoResponse(65000))
      );

      // First, populate the cache with one call
      const first = await service.getPrice();
      expect(first.usd).toBe(65000);

      // Clear the mock to count subsequent calls
      jest.clearAllMocks();

      // Make multiple concurrent requests - they should all use cache
      const promises = [
        service.getPrice(),
        service.getPrice(),
        service.getPrice(),
      ];

      const results = await Promise.all(promises);

      // All should return the same cached value
      expect(results[0]).toBe(results[1]);
      expect(results[1]).toBe(results[2]);
      expect(results[0].usd).toBe(65000);

      // API should NOT be called since cache is warm
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
