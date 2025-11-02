import { useState, useEffect } from 'react';
import { MessageType, type BitcoinPrice } from '../../shared/types';

/**
 * Hook to fetch and manage Bitcoin price in USD
 *
 * Fetches the current BTC/USD price from CoinGecko API via the background service worker.
 * Price is cached for 5 minutes to minimize API calls.
 *
 * @param refreshInterval - Optional interval in milliseconds to refresh price (default: 5 minutes)
 * @returns Object containing price in USD, loading state, and error state
 */
export function useBitcoinPrice(refreshInterval: number = 5 * 60 * 1000) {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    let intervalId: number | null = null;

    async function fetchPrice() {
      if (!mounted) return;

      try {
        setLoading(true);
        setError(null);

        const response = await chrome.runtime.sendMessage({
          type: MessageType.GET_BTC_PRICE,
        });

        if (!mounted) return;

        if (response.success && response.data) {
          const priceData = response.data as BitcoinPrice;
          setPrice(priceData.usd);
          setLastUpdated(priceData.lastUpdated);
        } else {
          setError(response.error || 'Failed to fetch Bitcoin price');
        }
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch Bitcoin price');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchPrice();

    // Set up periodic refresh
    intervalId = window.setInterval(() => {
      fetchPrice();
    }, refreshInterval);

    // Cleanup
    return () => {
      mounted = false;
      if (intervalId !== null) {
        clearInterval(intervalId);
      }
    };
  }, [refreshInterval]);

  return { price, loading, error, lastUpdated };
}
