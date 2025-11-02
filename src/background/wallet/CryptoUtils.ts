/**
 * CryptoUtils - Cryptographic Operations for Wallet Security
 *
 * This module provides secure encryption and decryption operations for protecting
 * the wallet seed phrase using industry-standard Web Crypto API.
 *
 * Security Standards:
 * - AES-256-GCM: Authenticated encryption with associated data (AEAD)
 * - PBKDF2-HMAC-SHA256: Password-based key derivation
 * - 100,000 iterations: OWASP recommended minimum
 * - Unique salt per wallet: Prevents rainbow table attacks
 * - Unique IV per encryption: Prevents pattern analysis
 *
 * CRITICAL SECURITY REQUIREMENTS:
 * - NEVER log passwords, keys, or decrypted data
 * - Use Web Crypto API exclusively (no external crypto libraries)
 * - Validate all inputs before cryptographic operations
 * - Clear sensitive data from memory when no longer needed
 * - Use constant-time comparison for authentication tags
 */

import {
  PBKDF2_ITERATIONS,
  PBKDF2_KEY_LENGTH,
  AES_ALGORITHM,
  AES_KEY_LENGTH,
} from '../../shared/constants';

/**
 * Result of encryption operation containing all data needed for decryption
 */
export interface EncryptionResult {
  encryptedData: string; // Base64 encoded ciphertext with auth tag
  salt: string; // Base64 encoded salt used for key derivation
  iv: string; // Base64 encoded initialization vector
}

/**
 * CryptoUtils class for wallet encryption operations
 *
 * All methods are static as this is a utility class with no state.
 * Uses Web Crypto API (crypto.subtle) for all cryptographic operations.
 */
export class CryptoUtils {
  /**
   * Generates a cryptographically secure random salt
   *
   * @param length - Salt length in bytes (default: 32 bytes / 256 bits)
   * @returns Uint8Array containing random bytes
   *
   * Security Notes:
   * - Uses crypto.getRandomValues() for CSPRNG
   * - Salt should be unique per wallet
   * - Salt does not need to be kept secret
   * - Default 32 bytes provides 256 bits of entropy
   */
  private static generateSalt(length: number = 32): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generates a cryptographically secure random initialization vector (IV)
   *
   * @param length - IV length in bytes (default: 12 bytes / 96 bits for GCM)
   * @returns Uint8Array containing random bytes
   *
   * Security Notes:
   * - Uses crypto.getRandomValues() for CSPRNG
   * - IV MUST be unique for each encryption operation
   * - IV reuse with same key completely breaks AES-GCM security
   * - 12 bytes (96 bits) is optimal for GCM mode
   * - IV does not need to be kept secret
   */
  private static generateIV(length: number = 12): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Derives an encryption key from a password using PBKDF2
   *
   * @param password - User's password (UTF-8 string)
   * @param salt - Cryptographic salt (must be unique per wallet)
   * @param iterations - Number of PBKDF2 iterations (default: 100,000)
   * @returns CryptoKey object suitable for AES-GCM encryption/decryption
   *
   * @throws {Error} If password is empty or key derivation fails
   *
   * PBKDF2 Parameters:
   * - Algorithm: PBKDF2-HMAC-SHA256
   * - Iterations: 100,000 (OWASP minimum, configurable for future increases)
   * - Key Length: 256 bits (32 bytes) for AES-256
   * - Salt: 256 bits (32 bytes), unique per wallet
   *
   * Security Notes:
   * - Higher iterations = slower brute force attacks (trade-off with UX)
   * - Password is never logged or stored
   * - Derived key exists in memory only during crypto operations
   * - Salt prevents rainbow table attacks
   *
   * Performance:
   * - 100,000 iterations typically takes 100-500ms on modern devices
   * - This is acceptable for unlock operations
   * - May increase iterations in future versions
   */
  public static async deriveKey(
    password: string,
    salt: Uint8Array,
    iterations: number = PBKDF2_ITERATIONS
  ): Promise<CryptoKey> {
    try {
      // Validate input
      if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
      }

      if (!salt || salt.length === 0) {
        throw new Error('Salt cannot be empty');
      }

      if (iterations < 100000) {
        throw new Error('Iteration count must be at least 100,000 for security');
      }

      // Convert password string to ArrayBuffer for Web Crypto API
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);

      // Import password as base key for PBKDF2
      const baseKey = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false, // Not extractable
        ['deriveKey']
      );

      // Derive AES-GCM key using PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt.buffer as ArrayBuffer,
          iterations: iterations,
          hash: 'SHA-256',
        },
        baseKey,
        {
          name: AES_ALGORITHM,
          length: AES_KEY_LENGTH,
        },
        true, // Extractable to allow session persistence across service worker restarts
        ['encrypt', 'decrypt']
      );

      // Clear password buffer from memory (best effort in JavaScript)
      passwordBuffer.fill(0);

      return derivedKey;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to derive encryption key: ${message}`);
    }
  }

  /**
   * Converts ArrayBuffer to Base64 string for storage
   *
   * @param buffer - ArrayBuffer to encode
   * @returns Base64 encoded string
   *
   * Note: Base64 is used for storing binary data as strings in chrome.storage
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Converts Base64 string to ArrayBuffer
   *
   * @param base64 - Base64 encoded string
   * @returns ArrayBuffer containing decoded bytes
   *
   * @throws {Error} If base64 string is invalid
   */
  public static base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      throw new Error('Invalid base64 string');
    }
  }

  /**
   * Encrypts plaintext data using AES-256-GCM
   *
   * @param plaintext - Data to encrypt (typically seed phrase)
   * @param password - User's password for encryption
   * @returns EncryptionResult containing encrypted data, salt, and IV
   *
   * @throws {Error} If encryption fails or inputs are invalid
   *
   * Encryption Process:
   * 1. Generate unique salt (32 bytes)
   * 2. Derive AES-256 key from password using PBKDF2
   * 3. Generate unique IV (12 bytes)
   * 4. Encrypt plaintext using AES-256-GCM
   * 5. Return encrypted data with salt and IV (all Base64 encoded)
   *
   * AES-GCM Features:
   * - Authenticated encryption (provides both confidentiality and integrity)
   * - Detects tampering or corruption
   * - Includes 128-bit authentication tag
   * - No padding oracle vulnerabilities
   *
   * Security Notes:
   * - New salt generated for each wallet (stored in plaintext)
   * - New IV generated for each encryption (must be unique)
   * - IV reuse is catastrophic for GCM - always generate new IV
   * - Plaintext and password are never logged
   * - Authentication tag prevents tampering
   *
   * Storage Format:
   * - All values Base64 encoded for chrome.storage compatibility
   * - Salt and IV stored alongside encrypted data
   * - Salt and IV do not need to be secret
   */
  static async encrypt(
    plaintext: string,
    password: string
  ): Promise<EncryptionResult> {
    try {
      // Validate inputs
      if (!plaintext || plaintext.length === 0) {
        throw new Error('Plaintext cannot be empty');
      }

      if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
      }

      // Generate unique salt for this wallet
      const salt = this.generateSalt(32); // 256 bits

      // Derive encryption key from password
      const key = await this.deriveKey(password, salt, PBKDF2_ITERATIONS);

      // Generate unique IV for this encryption operation
      // CRITICAL: Never reuse IV with the same key!
      const iv = this.generateIV(12); // 96 bits (optimal for GCM)

      // Convert plaintext to ArrayBuffer
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(plaintext);

      // Encrypt using AES-256-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: AES_ALGORITHM,
          iv: iv.buffer as ArrayBuffer,
        },
        key,
        plaintextBuffer
      );

      // Clear plaintext buffer from memory (best effort)
      plaintextBuffer.fill(0);

      // Convert binary data to Base64 for storage
      const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
      const saltBase64 = this.arrayBufferToBase64(salt.buffer as ArrayBuffer);
      const ivBase64 = this.arrayBufferToBase64(iv.buffer as ArrayBuffer);

      return {
        encryptedData,
        salt: saltBase64,
        iv: ivBase64,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      // Do not include plaintext or password in error message
      throw new Error(`Encryption failed: ${message}`);
    }
  }

  /**
   * Decrypts data encrypted with AES-256-GCM
   *
   * @param encryptedData - Base64 encoded ciphertext (from EncryptionResult)
   * @param password - User's password for decryption
   * @param salt - Base64 encoded salt (from EncryptionResult)
   * @param iv - Base64 encoded IV (from EncryptionResult)
   * @returns Decrypted plaintext string
   *
   * @throws {Error} If decryption fails (wrong password, corrupted data, tampering)
   *
   * Decryption Process:
   * 1. Decode Base64 strings to binary data
   * 2. Derive AES-256 key from password using same salt and parameters
   * 3. Decrypt ciphertext using AES-256-GCM with provided IV
   * 4. Verify authentication tag (automatic in GCM mode)
   * 5. Return decrypted plaintext
   *
   * Error Cases:
   * - Wrong password: Key derivation succeeds but decryption fails
   * - Corrupted data: Authentication tag verification fails
   * - Tampered data: Authentication tag verification fails
   * - Wrong salt/IV: Decryption produces garbage or fails
   *
   * Security Notes:
   * - GCM automatically verifies authentication tag
   * - Tampering or corruption causes immediate failure
   * - Wrong password results in decryption failure (indistinguishable from tampering)
   * - Do not leak information about failure reason (timing attacks)
   * - Decrypted data should be cleared from memory when no longer needed
   *
   * Error Messages:
   * - Generic "Decryption failed" for all errors
   * - Do not distinguish between wrong password and other errors
   * - Prevents information leakage to attackers
   */
  static async decrypt(
    encryptedData: string,
    password: string,
    salt: string,
    iv: string
  ): Promise<string> {
    try {
      // Validate inputs
      if (!encryptedData || encryptedData.length === 0) {
        throw new Error('Encrypted data cannot be empty');
      }

      if (!password || password.length === 0) {
        throw new Error('Password cannot be empty');
      }

      if (!salt || salt.length === 0) {
        throw new Error('Salt cannot be empty');
      }

      if (!iv || iv.length === 0) {
        throw new Error('IV cannot be empty');
      }

      // Decode Base64 strings to binary data
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const saltBuffer = new Uint8Array(this.base64ToArrayBuffer(salt) as ArrayBuffer);
      const ivBuffer = new Uint8Array(this.base64ToArrayBuffer(iv) as ArrayBuffer);

      // Derive same key from password using stored salt
      const key = await this.deriveKey(password, saltBuffer, PBKDF2_ITERATIONS);

      // Decrypt using AES-256-GCM
      // This will automatically verify the authentication tag
      // and throw an error if decryption fails or data was tampered with
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: AES_ALGORITHM,
          iv: ivBuffer.buffer as ArrayBuffer,
        },
        key,
        encryptedBuffer
      );

      // Convert decrypted ArrayBuffer back to string
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);

      return plaintext;
    } catch (error) {
      // Generic error message for all decryption failures
      // Do not distinguish between wrong password, corruption, or tampering
      // This prevents information leakage to attackers
      throw new Error(
        'Decryption failed: incorrect password or corrupted data'
      );
    }
  }

  /**
   * Encrypts plaintext data using AES-256-GCM with a provided CryptoKey
   *
   * @param plaintext - Data to encrypt
   * @param cryptoKey - Pre-derived CryptoKey for encryption
   * @returns EncryptionResult containing encrypted data and IV (no salt, as key is pre-derived)
   *
   * @throws {Error} If encryption fails or inputs are invalid
   *
   * Security Notes:
   * - This method uses a pre-derived CryptoKey, NOT a password
   * - Caller is responsible for deriving the key securely
   * - New IV generated for each encryption (critical for GCM security)
   * - Returns IV and encrypted data (salt not needed as key is already derived)
   * - Use this for encrypting imported keys with password-derived key
   */
  static async encryptWithKey(
    plaintext: string,
    cryptoKey: CryptoKey
  ): Promise<EncryptionResult> {
    try {
      // Validate inputs
      if (!plaintext || plaintext.length === 0) {
        throw new Error('Plaintext cannot be empty');
      }

      if (!cryptoKey) {
        throw new Error('CryptoKey cannot be null');
      }

      // Generate unique IV for this encryption operation
      const iv = this.generateIV(12); // 96 bits (optimal for GCM)

      // Convert plaintext to ArrayBuffer
      const encoder = new TextEncoder();
      const plaintextBuffer = encoder.encode(plaintext);

      // Encrypt using AES-256-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: AES_ALGORITHM,
          iv: iv.buffer as ArrayBuffer,
        },
        cryptoKey,
        plaintextBuffer
      );

      // Clear plaintext buffer from memory (best effort)
      plaintextBuffer.fill(0);

      // Convert binary data to Base64 for storage
      const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
      const ivBase64 = this.arrayBufferToBase64(iv.buffer as ArrayBuffer);

      // Return with empty salt (not used when encrypting with pre-derived key)
      return {
        encryptedData,
        salt: '', // Salt not used with pre-derived key
        iv: ivBase64,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Encryption with key failed: ${message}`);
    }
  }

  /**
   * Decrypts data encrypted with AES-256-GCM using a provided CryptoKey
   *
   * @param encryptedData - Base64 encoded ciphertext
   * @param cryptoKey - Pre-derived CryptoKey for decryption
   * @param iv - Base64 encoded IV
   * @returns Decrypted plaintext string
   *
   * @throws {Error} If decryption fails
   *
   * Security Notes:
   * - This method uses a pre-derived CryptoKey, NOT a password
   * - Caller is responsible for providing the correct key
   * - GCM automatically verifies authentication tag
   * - Decrypted data should be cleared when no longer needed
   */
  static async decryptWithKey(
    encryptedData: string,
    cryptoKey: CryptoKey,
    iv: string
  ): Promise<string> {
    // Validate inputs BEFORE try-catch to preserve error messages
    if (!encryptedData || encryptedData.length === 0) {
      throw new Error('Encrypted data cannot be empty');
    }

    if (!cryptoKey) {
      throw new Error('CryptoKey cannot be null');
    }

    if (!iv || iv.length === 0) {
      throw new Error('IV cannot be empty');
    }

    try {
      // Decode Base64 strings to binary data
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const ivBuffer = new Uint8Array(this.base64ToArrayBuffer(iv) as ArrayBuffer);

      // Decrypt using AES-256-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: AES_ALGORITHM,
          iv: ivBuffer.buffer as ArrayBuffer,
        },
        cryptoKey,
        encryptedBuffer
      );

      // Convert decrypted ArrayBuffer back to string
      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);

      return plaintext;
    } catch (error) {
      // Only crypto operations get generic error
      throw new Error(
        'Decryption failed: incorrect key or corrupted data'
      );
    }
  }

  /**
   * Securely clears sensitive string data from memory (best effort)
   *
   * @param sensitiveData - String to clear
   *
   * Note: JavaScript does not provide guaranteed memory clearing.
   * This is a best-effort approach that overwrites the string.
   * For production use, ensure auto-lock clears all references.
   *
   * Security Note:
   * - JavaScript strings are immutable, so this creates a new string
   * - Original string may remain in memory until garbage collected
   * - Best practice: minimize lifetime of decrypted data in memory
   * - Use auto-lock to force garbage collection
   */
  static clearSensitiveData(sensitiveData: string): string {
    // Overwrite with zeros (creates new string, old one may remain in memory)
    return ''.padStart(sensitiveData.length, '\0');
  }

  /**
   * Validates encryption result structure
   *
   * @param result - Object to validate
   * @returns true if valid EncryptionResult, false otherwise
   *
   * Validates:
   * - All required fields present
   * - All fields are non-empty strings
   * - All fields are valid Base64
   */
  static isValidEncryptionResult(result: any): result is EncryptionResult {
    if (!result || typeof result !== 'object') {
      return false;
    }

    // Check required fields
    if (
      typeof result.encryptedData !== 'string' ||
      typeof result.salt !== 'string' ||
      typeof result.iv !== 'string'
    ) {
      return false;
    }

    // Check non-empty
    if (
      result.encryptedData.length === 0 ||
      result.salt.length === 0 ||
      result.iv.length === 0
    ) {
      return false;
    }

    // Validate Base64 format (basic check)
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (
      !base64Regex.test(result.encryptedData) ||
      !base64Regex.test(result.salt) ||
      !base64Regex.test(result.iv)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Tests encryption and decryption with a sample message
   *
   * @param password - Password to test with
   * @returns true if encryption and decryption work correctly
   *
   * Note: For testing purposes only. Do not use in production code.
   */
  static async testEncryption(password: string): Promise<boolean> {
    try {
      const testMessage = 'Test encryption message';
      const encrypted = await this.encrypt(testMessage, password);
      const decrypted = await this.decrypt(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      );
      return decrypted === testMessage;
    } catch (error) {
      return false;
    }
  }
}
