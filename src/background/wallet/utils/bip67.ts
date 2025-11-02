/**
 * BIP67 - Deterministic Pay-to-script-hash multi-signature addresses
 *
 * This module implements BIP67 lexicographic key sorting to ensure that
 * all co-signers in a multisig wallet generate identical addresses.
 *
 * BIP67 Standard: https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
 *
 * Key Principle:
 * Public keys in a multisig redeem script must be sorted in lexicographic order
 * (ascending order by comparing the bytes of the public keys).
 * This ensures that all participants create the same address regardless of
 * the order in which they add the public keys.
 *
 * Security Benefits:
 * - Deterministic address generation
 * - No coordination needed for key ordering
 * - All co-signers can independently verify the multisig address
 * - Prevents attacks based on key ordering
 *
 * Example:
 * ```typescript
 * const pubkeys = [Buffer.from('02...'), Buffer.from('03...'), Buffer.from('02...')];
 * const sorted = sortPublicKeys(pubkeys);
 * // sorted will always be in the same order regardless of input order
 * ```
 */

/**
 * Sorts public keys in lexicographic order per BIP67
 *
 * Lexicographic ordering means comparing keys byte-by-byte,
 * treating them as unsigned integers.
 *
 * @param publicKeys - Array of public keys as Buffers
 * @returns Sorted array of public keys
 *
 * @throws {Error} If any public key is invalid
 *
 * Algorithm:
 * 1. Validate all public keys
 * 2. Convert to hex strings for comparison
 * 3. Sort lexicographically (ascending)
 * 4. Return sorted Buffer array
 *
 * Note: Public keys can be either compressed (33 bytes) or uncompressed (65 bytes)
 * BIP67 works with both, but compressed is standard practice.
 */
export function sortPublicKeys(publicKeys: Buffer[]): Buffer[] {
  // 1. Validate inputs
  if (!publicKeys || publicKeys.length === 0) {
    throw new Error('No public keys provided');
  }

  if (publicKeys.length < 2) {
    // If only one key, no sorting needed
    return [...publicKeys];
  }

  // 2. Validate each public key
  for (let i = 0; i < publicKeys.length; i++) {
    const key = publicKeys[i];

    if (!Buffer.isBuffer(key)) {
      throw new Error(`Public key at index ${i} is not a Buffer`);
    }

    // Compressed public keys are 33 bytes, uncompressed are 65 bytes
    if (key.length !== 33 && key.length !== 65) {
      throw new Error(
        `Public key at index ${i} has invalid length: ${key.length}. ` +
          `Expected 33 (compressed) or 65 (uncompressed) bytes`
      );
    }

    // Validate key prefix for compressed keys
    if (key.length === 33) {
      const prefix = key[0];
      if (prefix !== 0x02 && prefix !== 0x03) {
        throw new Error(
          `Public key at index ${i} has invalid prefix: 0x${prefix.toString(16)}. ` +
            `Expected 0x02 or 0x03 for compressed keys`
        );
      }
    }

    // Validate key prefix for uncompressed keys
    if (key.length === 65) {
      const prefix = key[0];
      if (prefix !== 0x04) {
        throw new Error(
          `Public key at index ${i} has invalid prefix: 0x${prefix.toString(16)}. ` +
            `Expected 0x04 for uncompressed keys`
        );
      }
    }
  }

  // 3. Create array of keys with hex representations for sorting
  const keysWithHex = publicKeys.map((key) => ({
    buffer: key,
    hex: key.toString('hex'),
  }));

  // 4. Sort lexicographically by hex string
  // This is equivalent to byte-by-byte comparison
  keysWithHex.sort((a, b) => {
    if (a.hex < b.hex) return -1;
    if (a.hex > b.hex) return 1;
    return 0;
  });

  // 5. Extract sorted Buffer array
  return keysWithHex.map((k) => k.buffer);
}

/**
 * Checks if public keys are already sorted per BIP67
 *
 * @param publicKeys - Array of public keys to check
 * @returns true if already sorted, false otherwise
 */
export function areKeysSorted(publicKeys: Buffer[]): boolean {
  if (publicKeys.length < 2) {
    return true; // Single key or empty is considered sorted
  }

  try {
    const sorted = sortPublicKeys(publicKeys);

    // Compare with original
    for (let i = 0; i < publicKeys.length; i++) {
      if (!publicKeys[i].equals(sorted[i])) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that public keys match after sorting
 *
 * Used to verify that all co-signers are using the same set of public keys.
 * This is critical for ensuring all parties generate the same multisig address.
 *
 * @param keys1 - First set of public keys
 * @param keys2 - Second set of public keys
 * @returns true if both sets contain the same keys (regardless of order)
 */
export function publicKeysMatch(keys1: Buffer[], keys2: Buffer[]): boolean {
  if (keys1.length !== keys2.length) {
    return false;
  }

  try {
    const sorted1 = sortPublicKeys(keys1);
    const sorted2 = sortPublicKeys(keys2);

    for (let i = 0; i < sorted1.length; i++) {
      if (!sorted1[i].equals(sorted2[i])) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the position of a public key in the sorted order
 *
 * Useful for determining which co-signer's key corresponds to
 * which position in the multisig redeem script.
 *
 * @param publicKey - Public key to find
 * @param allPublicKeys - All public keys in the multisig
 * @returns Index of the public key in sorted order, or -1 if not found
 */
export function getKeyPosition(publicKey: Buffer, allPublicKeys: Buffer[]): number {
  try {
    const sorted = sortPublicKeys(allPublicKeys);

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].equals(publicKey)) {
        return i;
      }
    }

    return -1;
  } catch {
    return -1;
  }
}

/**
 * Compares two public keys lexicographically
 *
 * @param key1 - First public key
 * @param key2 - Second public key
 * @returns -1 if key1 < key2, 0 if equal, 1 if key1 > key2
 */
export function comparePublicKeys(key1: Buffer, key2: Buffer): number {
  const hex1 = key1.toString('hex');
  const hex2 = key2.toString('hex');

  if (hex1 < hex2) return -1;
  if (hex1 > hex2) return 1;
  return 0;
}

/**
 * Validates that a set of public keys is ready for multisig use
 *
 * Checks:
 * - Minimum 2 keys (multisig requires at least 2)
 * - Maximum 15 keys (Bitcoin protocol limit for standard multisig)
 * - All keys are valid
 * - No duplicate keys
 *
 * @param publicKeys - Public keys to validate
 * @param minKeys - Minimum required keys (default: 2)
 * @param maxKeys - Maximum allowed keys (default: 15)
 * @throws {Error} If validation fails
 */
export function validateMultisigKeys(
  publicKeys: Buffer[],
  minKeys: number = 2,
  maxKeys: number = 15
): void {
  // Check count
  if (publicKeys.length < minKeys) {
    throw new Error(
      `Insufficient public keys: ${publicKeys.length}. Minimum required: ${minKeys}`
    );
  }

  if (publicKeys.length > maxKeys) {
    throw new Error(
      `Too many public keys: ${publicKeys.length}. Maximum allowed: ${maxKeys}`
    );
  }

  // Validate each key (will throw if invalid)
  sortPublicKeys(publicKeys);

  // Check for duplicates
  const hexSet = new Set<string>();
  for (const key of publicKeys) {
    const hex = key.toString('hex');
    if (hexSet.has(hex)) {
      throw new Error('Duplicate public key detected');
    }
    hexSet.add(hex);
  }
}
