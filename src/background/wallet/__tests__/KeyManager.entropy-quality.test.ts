/**
 * KeyManager Entropy Quality Test Suite (Optional)
 *
 * Statistical tests to verify the quality of random number generation
 * in mnemonic generation. These tests provide extra assurance that the
 * RNG produces uniformly distributed entropy.
 *
 * Note: These tests are OPTIONAL for production. The actual RNG used
 * (crypto.getRandomValues via @noble/hashes) is audited and proven secure.
 * These tests are for defense-in-depth and documentation purposes.
 *
 * Based on NIST SP 800-22 Statistical Test Suite principles.
 *
 * @jest-environment node
 */

import { KeyManager } from '../KeyManager';

describe('KeyManager - Entropy Quality (Statistical Tests)', () => {
  // Skip these tests in CI by default (they're slow and optional)
  const describeOrSkip = process.env.RUN_ENTROPY_TESTS === 'true' ? describe : describe.skip;

  describeOrSkip('Uniqueness at Scale', () => {
    it('should generate 1,000 unique mnemonics with no collisions', () => {
      const iterations = 1000;
      const mnemonics = new Set<string>();

      for (let i = 0; i < iterations; i++) {
        const mnemonic = KeyManager.generateMnemonic();
        mnemonics.add(mnemonic);
      }

      // All should be unique (probability of collision: ~2^-107)
      expect(mnemonics.size).toBe(iterations);
    }, 30000); // 30 second timeout

    it('should generate 1,000 unique entropy values with no collisions', () => {
      const iterations = 1000;
      const entropySet = new Set<string>();

      for (let i = 0; i < iterations; i++) {
        const mnemonic = KeyManager.generateMnemonic();
        const entropy = KeyManager.mnemonicToEntropy(mnemonic);
        entropySet.add(entropy);
      }

      expect(entropySet.size).toBe(iterations);
    }, 30000);
  });

  describeOrSkip('Uniform Distribution (Chi-Square Test)', () => {
    it('should produce uniformly distributed hex digits in entropy', () => {
      const iterations = 1000;
      const digitCounts = new Map<string, number>();

      // Initialize counts for hex digits 0-F
      for (let i = 0; i < 16; i++) {
        digitCounts.set(i.toString(16), 0);
      }

      // Generate mnemonics and count hex digit frequencies
      for (let i = 0; i < iterations; i++) {
        const mnemonic = KeyManager.generateMnemonic(128); // 12 words = 32 hex chars
        const entropy = KeyManager.mnemonicToEntropy(mnemonic);

        for (const digit of entropy) {
          digitCounts.set(digit, (digitCounts.get(digit) || 0) + 1);
        }
      }

      // Chi-square goodness-of-fit test
      const totalDigits = iterations * 32; // 32 hex chars per 128-bit entropy
      const expectedPerDigit = totalDigits / 16; // Each of 16 hex digits should appear 1/16 of the time

      let chiSquare = 0;
      digitCounts.forEach((observed) => {
        chiSquare += Math.pow(observed - expectedPerDigit, 2) / expectedPerDigit;
      });

      // Chi-square critical value for df=15, p=0.01: 30.58
      // If chi-square > 30.58, distribution is non-uniform at 99% confidence
      // We use p=0.001 (critical value ~37) for stricter test
      expect(chiSquare).toBeLessThan(37);

      // Additional check: no digit should deviate by more than 3 standard deviations
      const stdDev = Math.sqrt(expectedPerDigit);
      digitCounts.forEach((observed, digit) => {
        const deviation = Math.abs(observed - expectedPerDigit);
        const zScore = deviation / stdDev;
        expect(zScore).toBeLessThan(3); // 99.7% of values should be within 3σ
      });
    }, 60000); // 60 second timeout
  });

  describeOrSkip('Bit Distribution', () => {
    it('should have roughly 50% ones and 50% zeros in entropy bits', () => {
      const iterations = 500;
      let totalOnes = 0;
      let totalBits = 0;

      for (let i = 0; i < iterations; i++) {
        const mnemonic = KeyManager.generateMnemonic(128);
        const entropy = KeyManager.mnemonicToEntropy(mnemonic);
        const entropyBuffer = Buffer.from(entropy, 'hex');

        // Count ones in each byte
        for (const byte of entropyBuffer) {
          for (let bit = 0; bit < 8; bit++) {
            if ((byte >> bit) & 1) {
              totalOnes++;
            }
            totalBits++;
          }
        }
      }

      const ratio = totalOnes / totalBits;

      // Should be close to 0.5 (50% ones, 50% zeros)
      // Allow deviation of ±2% (0.48 to 0.52)
      expect(ratio).toBeGreaterThan(0.48);
      expect(ratio).toBeLessThan(0.52);

      // Statistical significance: binomial test
      // For large n, binomial distribution approximates normal distribution
      // Expected: μ = n/2, σ = sqrt(n/4)
      const expected = totalBits / 2;
      const stdDev = Math.sqrt(totalBits / 4);
      const zScore = Math.abs(totalOnes - expected) / stdDev;

      // z-score should be < 3 (99.7% confidence interval)
      expect(zScore).toBeLessThan(3);
    }, 60000);
  });

  describeOrSkip('Runs Test (Sequential Patterns)', () => {
    it('should not have excessive runs of consecutive identical bits', () => {
      const iterations = 100;
      const runLengths: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const mnemonic = KeyManager.generateMnemonic(128);
        const entropy = KeyManager.mnemonicToEntropy(mnemonic);
        const entropyBuffer = Buffer.from(entropy, 'hex');

        // Convert to bit string
        let bitString = '';
        for (const byte of entropyBuffer) {
          bitString += byte.toString(2).padStart(8, '0');
        }

        // Count runs (sequences of consecutive identical bits)
        let currentRun = 1;
        for (let j = 1; j < bitString.length; j++) {
          if (bitString[j] === bitString[j - 1]) {
            currentRun++;
          } else {
            runLengths.push(currentRun);
            currentRun = 1;
          }
        }
        runLengths.push(currentRun);
      }

      // Calculate average run length
      const avgRunLength = runLengths.reduce((sum, len) => sum + len, 0) / runLengths.length;

      // For truly random bits, expected average run length is ~2
      // Allow deviation of ±1
      expect(avgRunLength).toBeGreaterThan(1);
      expect(avgRunLength).toBeLessThan(3);

      // Check for suspicious long runs (e.g., 20+ consecutive identical bits)
      const maxRunLength = Math.max(...runLengths);
      expect(maxRunLength).toBeLessThan(20);
    }, 60000);
  });

  describeOrSkip('Entropy Across Strengths', () => {
    it('should produce quality entropy for all BIP39 strengths', () => {
      const strengths = [128, 160, 192, 224, 256];
      const expectedBitLengths = [128, 160, 192, 224, 256];

      strengths.forEach((strength, index) => {
        const mnemonics = new Set<string>();
        const iterations = 100;

        for (let i = 0; i < iterations; i++) {
          const mnemonic = KeyManager.generateMnemonic(strength);
          mnemonics.add(mnemonic);

          // Verify entropy length
          const entropy = KeyManager.mnemonicToEntropy(mnemonic);
          const entropyBits = Buffer.from(entropy, 'hex').length * 8;
          expect(entropyBits).toBe(expectedBitLengths[index]);
        }

        // All should be unique
        expect(mnemonics.size).toBe(iterations);
      });
    }, 60000);
  });

  describeOrSkip('Entropy Independence', () => {
    it('should generate independent entropy (no correlation between successive calls)', () => {
      const iterations = 100;
      const entropyPairs: Array<{ first: Buffer; second: Buffer }> = [];

      // Generate pairs of consecutive mnemonics
      for (let i = 0; i < iterations; i++) {
        const mnemonic1 = KeyManager.generateMnemonic();
        const mnemonic2 = KeyManager.generateMnemonic();

        const entropy1 = Buffer.from(KeyManager.mnemonicToEntropy(mnemonic1), 'hex');
        const entropy2 = Buffer.from(KeyManager.mnemonicToEntropy(mnemonic2), 'hex');

        entropyPairs.push({ first: entropy1, second: entropy2 });
      }

      // Calculate Hamming distance (number of differing bits)
      const hammingDistances: number[] = [];
      entropyPairs.forEach(({ first, second }) => {
        let distance = 0;
        for (let i = 0; i < first.length; i++) {
          const xor = first[i] ^ second[i];
          // Count set bits in XOR result
          for (let bit = 0; bit < 8; bit++) {
            if ((xor >> bit) & 1) distance++;
          }
        }
        hammingDistances.push(distance);
      });

      // Average Hamming distance should be ~50% of total bits (64 out of 128)
      const avgHammingDistance = hammingDistances.reduce((sum, d) => sum + d, 0) / hammingDistances.length;
      const expectedDistance = 128 / 2; // 64 bits

      // Allow deviation of ±10% (57.6 to 70.4 bits)
      expect(avgHammingDistance).toBeGreaterThan(57.6);
      expect(avgHammingDistance).toBeLessThan(70.4);

      // No pair should have suspiciously low Hamming distance (< 30% different)
      const minHammingDistance = Math.min(...hammingDistances);
      expect(minHammingDistance).toBeGreaterThan(38); // At least 30% of bits should differ
    }, 60000);
  });
});

/**
 * How to run these tests:
 *
 * npm test -- KeyManager.entropy-quality.test.ts
 *
 * Or to enable them in CI:
 * RUN_ENTROPY_TESTS=true npm test
 *
 * Expected Results:
 * - All tests should pass with high confidence
 * - If any test fails, investigate potential RNG issues
 * - Note: False positives can occur ~1% of the time due to statistical variance
 *
 * Interpretation:
 * - Uniqueness Test: Verifies no collisions in 1,000 generations
 * - Chi-Square Test: Verifies uniform distribution of hex digits
 * - Bit Distribution: Verifies ~50% ones, ~50% zeros
 * - Runs Test: Verifies no excessive patterns in bit sequences
 * - Independence Test: Verifies successive calls are uncorrelated
 *
 * Security Note:
 * These tests do NOT prove cryptographic security (that's proven by using
 * crypto.getRandomValues, an audited CSPRNG). These tests only verify that
 * the implementation correctly uses the secure RNG without introducing biases.
 */
