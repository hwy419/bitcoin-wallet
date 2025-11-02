/**
 * Bitcoin Price Utilities
 *
 * Functions for converting between BTC/satoshis and USD,
 * and formatting USD values for display.
 */

/**
 * Convert satoshis to USD
 * @param satoshis Amount in satoshis
 * @param pricePerBtc Bitcoin price in USD
 * @returns USD value
 */
export function satoshisToUSD(satoshis: number, pricePerBtc: number): number {
  // 1 BTC = 100,000,000 satoshis
  const btc = satoshis / 100_000_000;
  return btc * pricePerBtc;
}

/**
 * Convert BTC to USD
 * @param btc Amount in BTC
 * @param pricePerBtc Bitcoin price in USD
 * @returns USD value
 */
export function btcToUSD(btc: number, pricePerBtc: number): number {
  return btc * pricePerBtc;
}

/**
 * Format USD value for display
 *
 * Examples:
 * - $1,234.56 (for larger amounts)
 * - $0.12 (for cents)
 * - $0.0012 (for small amounts)
 * - <$0.01 (for very small amounts)
 *
 * @param usdValue USD value to format
 * @param includeSymbol Whether to include $ symbol (default: true)
 * @returns Formatted USD string
 */
export function formatUSD(usdValue: number, includeSymbol: boolean = true): string {
  const symbol = includeSymbol ? '$' : '';

  // Handle very small amounts (less than 1 cent)
  if (usdValue > 0 && usdValue < 0.01) {
    return `<${symbol}0.01`;
  }

  // Handle zero
  if (usdValue === 0) {
    return `${symbol}0.00`;
  }

  // Handle negative values
  const isNegative = usdValue < 0;
  const absoluteValue = Math.abs(usdValue);

  // Format with appropriate decimal places
  let formatted: string;

  if (absoluteValue >= 1) {
    // For $1 and above, show 2 decimal places with thousand separators
    formatted = absoluteValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } else {
    // For amounts less than $1, show up to 4 decimal places
    formatted = absoluteValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  }

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Format satoshis as USD with BTC price
 * Convenience function that combines satoshisToUSD and formatUSD
 *
 * @param satoshis Amount in satoshis
 * @param pricePerBtc Bitcoin price in USD
 * @param includeSymbol Whether to include $ symbol (default: true)
 * @returns Formatted USD string
 */
export function formatSatoshisAsUSD(
  satoshis: number,
  pricePerBtc: number,
  includeSymbol: boolean = true
): string {
  const usd = satoshisToUSD(satoshis, pricePerBtc);
  return formatUSD(usd, includeSymbol);
}
