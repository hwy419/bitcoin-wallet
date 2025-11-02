/**
 * Tests for Bitcoin Price Utilities
 *
 * Tests the price conversion and formatting functions:
 * - Satoshis to USD conversion
 * - BTC to USD conversion
 * - USD formatting for display
 * - Combined satoshis to formatted USD
 */

import {
  satoshisToUSD,
  btcToUSD,
  formatUSD,
  formatSatoshisAsUSD,
} from '../price';

describe('price utilities', () => {
  describe('satoshisToUSD', () => {
    it('converts satoshis to USD correctly', () => {
      const pricePerBtc = 50000; // $50,000 per BTC
      const satoshis = 100_000_000; // 1 BTC

      const result = satoshisToUSD(satoshis, pricePerBtc);

      expect(result).toBe(50000);
    });

    it('converts partial BTC amounts', () => {
      const pricePerBtc = 50000;
      const satoshis = 50_000_000; // 0.5 BTC

      const result = satoshisToUSD(satoshis, pricePerBtc);

      expect(result).toBe(25000);
    });

    it('converts small satoshi amounts', () => {
      const pricePerBtc = 50000;
      const satoshis = 1000; // 0.00001 BTC

      const result = satoshisToUSD(satoshis, pricePerBtc);

      expect(result).toBe(0.5);
    });

    it('handles zero satoshis', () => {
      const pricePerBtc = 50000;
      const satoshis = 0;

      const result = satoshisToUSD(satoshis, pricePerBtc);

      expect(result).toBe(0);
    });

    it('handles very large satoshi amounts', () => {
      const pricePerBtc = 100000;
      const satoshis = 2_100_000_000_000_000; // 21 million BTC (max supply)

      const result = satoshisToUSD(satoshis, pricePerBtc);

      // JavaScript number precision limit
      expect(result).toBe(2_100_000_000_000);
    });

    it('handles fractional results', () => {
      const pricePerBtc = 50000;
      const satoshis = 1; // 0.00000001 BTC

      const result = satoshisToUSD(satoshis, pricePerBtc);

      expect(result).toBe(0.0005);
    });

    it('handles different BTC prices', () => {
      const satoshis = 10_000_000; // 0.1 BTC

      expect(satoshisToUSD(satoshis, 30000)).toBe(3000);
      expect(satoshisToUSD(satoshis, 60000)).toBe(6000);
      expect(satoshisToUSD(satoshis, 100000)).toBe(10000);
    });
  });

  describe('btcToUSD', () => {
    it('converts BTC to USD correctly', () => {
      const pricePerBtc = 50000;
      const btc = 1;

      const result = btcToUSD(btc, pricePerBtc);

      expect(result).toBe(50000);
    });

    it('converts partial BTC amounts', () => {
      const pricePerBtc = 50000;
      const btc = 0.5;

      const result = btcToUSD(btc, pricePerBtc);

      expect(result).toBe(25000);
    });

    it('converts small BTC amounts', () => {
      const pricePerBtc = 50000;
      const btc = 0.001; // 1 mBTC

      const result = btcToUSD(btc, pricePerBtc);

      expect(result).toBe(50);
    });

    it('handles zero BTC', () => {
      const pricePerBtc = 50000;
      const btc = 0;

      const result = btcToUSD(btc, pricePerBtc);

      expect(result).toBe(0);
    });

    it('handles very large BTC amounts', () => {
      const pricePerBtc = 100000;
      const btc = 21_000_000; // Max supply

      const result = btcToUSD(btc, pricePerBtc);

      expect(result).toBe(2_100_000_000_000);
    });

    it('handles different BTC prices', () => {
      const btc = 0.1;

      expect(btcToUSD(btc, 30000)).toBe(3000);
      expect(btcToUSD(btc, 60000)).toBe(6000);
      expect(btcToUSD(btc, 100000)).toBe(10000);
    });
  });

  describe('formatUSD', () => {
    it('formats whole dollar amounts with 2 decimals', () => {
      expect(formatUSD(100)).toBe('$100.00');
      expect(formatUSD(1000)).toBe('$1,000.00');
      expect(formatUSD(1234567.89)).toBe('$1,234,567.89');
    });

    it('formats amounts with cents', () => {
      expect(formatUSD(1.5)).toBe('$1.50');
      expect(formatUSD(99.99)).toBe('$99.99');
      expect(formatUSD(0.5)).toBe('$0.50');
    });

    it('formats small amounts under $1', () => {
      expect(formatUSD(0.12)).toBe('$0.12');
      expect(formatUSD(0.9999)).toBe('$0.9999'); // Shows up to 4 decimals for sub-dollar
      expect(formatUSD(0.001)).toBe('<$0.01'); // Less than a cent
      expect(formatUSD(0.0001)).toBe('<$0.01'); // Less than a cent
    });

    it('formats very small amounts as <$0.01', () => {
      expect(formatUSD(0.009)).toBe('<$0.01');
      expect(formatUSD(0.001)).toBe('<$0.01');
      expect(formatUSD(0.00001)).toBe('<$0.01');
    });

    it('formats zero as $0.00', () => {
      expect(formatUSD(0)).toBe('$0.00');
    });

    it('formats negative amounts', () => {
      expect(formatUSD(-100)).toBe('-$100.00');
      expect(formatUSD(-0.5)).toBe('-$0.50');
      expect(formatUSD(-1234.56)).toBe('-$1,234.56');
    });

    it('adds thousand separators', () => {
      expect(formatUSD(1000)).toBe('$1,000.00');
      expect(formatUSD(1000000)).toBe('$1,000,000.00');
      expect(formatUSD(999999.99)).toBe('$999,999.99');
    });

    it('omits symbol when includeSymbol is false', () => {
      expect(formatUSD(100, false)).toBe('100.00');
      expect(formatUSD(1234.56, false)).toBe('1,234.56');
      expect(formatUSD(0.5, false)).toBe('0.50');
    });

    it('handles very small amounts without symbol', () => {
      expect(formatUSD(0.005, false)).toBe('<0.01');
    });

    it('formats amounts with up to 4 decimal places for sub-dollar amounts', () => {
      expect(formatUSD(0.1234)).toBe('$0.1234');
      expect(formatUSD(0.9999)).toBe('$0.9999'); // Doesn't round to $1
      expect(formatUSD(0.12345)).toBe('$0.1235'); // Rounds to 4 decimals
    });

    it('always uses 2 decimals for amounts >= $1', () => {
      expect(formatUSD(1)).toBe('$1.00');
      expect(formatUSD(1.1)).toBe('$1.10');
      expect(formatUSD(1.999)).toBe('$2.00'); // Rounds to 2 decimals
    });

    it('handles large amounts', () => {
      expect(formatUSD(1_000_000_000)).toBe('$1,000,000,000.00');
      expect(formatUSD(999_999_999.99)).toBe('$999,999,999.99');
    });
  });

  describe('formatSatoshisAsUSD', () => {
    it('converts and formats satoshis in one call', () => {
      const pricePerBtc = 50000;
      const satoshis = 100_000_000; // 1 BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      expect(result).toBe('$50,000.00');
    });

    it('handles small satoshi amounts', () => {
      const pricePerBtc = 50000;
      const satoshis = 100_000; // 0.001 BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      expect(result).toBe('$50.00');
    });

    it('handles very small satoshi amounts', () => {
      const pricePerBtc = 50000;
      const satoshis = 100; // 0.000001 BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      expect(result).toBe('$0.05');
    });

    it('handles zero satoshis', () => {
      const pricePerBtc = 50000;
      const satoshis = 0;

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      expect(result).toBe('$0.00');
    });

    it('omits symbol when includeSymbol is false', () => {
      const pricePerBtc = 50000;
      const satoshis = 50_000_000; // 0.5 BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc, false);

      expect(result).toBe('25,000.00');
    });

    it('handles different BTC prices', () => {
      const satoshis = 10_000_000; // 0.1 BTC

      expect(formatSatoshisAsUSD(satoshis, 30000)).toBe('$3,000.00');
      expect(formatSatoshisAsUSD(satoshis, 60000)).toBe('$6,000.00');
      expect(formatSatoshisAsUSD(satoshis, 100000)).toBe('$10,000.00');
    });

    it('formats sub-cent amounts correctly', () => {
      const pricePerBtc = 50000;
      const satoshis = 10; // Very small amount

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      // 10 satoshis * $50k = $0.005, which is < $0.01
      expect(result).toBe('<$0.01');
    });

    it('handles large satoshi amounts', () => {
      const pricePerBtc = 100000;
      const satoshis = 2_100_000_000_000_000; // 21 million BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      // JavaScript precision limits
      expect(result).toBe('$2,100,000,000,000.00');
    });
  });

  describe('edge cases and integration', () => {
    it('handles Bitcoin price of $0 (hypothetical)', () => {
      expect(satoshisToUSD(100_000_000, 0)).toBe(0);
      expect(btcToUSD(1, 0)).toBe(0);
      expect(formatSatoshisAsUSD(100_000_000, 0)).toBe('$0.00');
    });

    it('handles extremely high BTC prices', () => {
      const pricePerBtc = 10_000_000; // $10M per BTC
      const satoshis = 100_000_000; // 1 BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      expect(result).toBe('$10,000,000.00');
    });

    it('maintains precision for typical transaction amounts', () => {
      const pricePerBtc = 45678.90;
      const satoshis = 12_345_678; // 0.12345678 BTC

      const usd = satoshisToUSD(satoshis, pricePerBtc);
      const formatted = formatUSD(usd);

      // 0.12345678 * 45678.90 = 5639.37...
      expect(formatted).toBe('$5,639.37');
    });

    it('handles dust amounts (1 satoshi)', () => {
      const pricePerBtc = 50000;
      const satoshis = 1;

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      // 1 satoshi = 0.00000001 BTC * $50,000 = $0.0005, which is < $0.01
      expect(result).toBe('<$0.01');
    });

    it('handles typical wallet balance display', () => {
      const pricePerBtc = 62345.67;
      const satoshis = 5_432_100; // 0.054321 BTC

      const result = formatSatoshisAsUSD(satoshis, pricePerBtc);

      // 0.054321 * 62345.67 = 3386.68...
      expect(result).toBe('$3,386.68');
    });
  });
});
