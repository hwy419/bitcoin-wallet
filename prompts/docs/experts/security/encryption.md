# Encryption Implementation

**Last Updated**: October 22, 2025
**Status**: Production Ready - v0.10.0
**Quick Nav**: [INDEX](./_INDEX.md) | [Key Management](./key-management.md) | [Threat Model](./threat-model.md)

---

## Table of Contents

1. [Encryption Specification](#1-encryption-specification)
2. [Implementation Architecture](#2-implementation-architecture)
3. [Encryption/Decryption Flows](#3-encryptiondecryption-flows)
4. [Security Considerations](#4-security-considerations)
5. [Implementation Status](#5-implementation-status)
6. [Audit Results](#6-audit-results)

---

## 1. Encryption Specification

### 1.1 Algorithm Choice

**Algorithm**: AES-256-GCM (Galois/Counter Mode)

**Why AES-256-GCM:**
- Authenticated encryption with associated data (AEAD)
- Provides both confidentiality and integrity
- Resistant to padding oracle attacks
- Native browser support via Web Crypto API
- Industry standard for wallet encryption

**Key Derivation**: PBKDF2-HMAC-SHA256

**Parameters:**
- Iterations: 100,000 (OWASP minimum, adjustable based on performance)
- Salt: 32 bytes (256 bits), cryptographically random
- Output: 256-bit AES key

**Initialization Vector (IV):**
- Size: 12 bytes (96 bits) for GCM mode
- Must be unique for each encryption operation
- Generated using crypto.getRandomValues()
- Stored alongside ciphertext

### 1.2 Encryption Parameters

```
Algorithm: AES-256-GCM
Key Derivation: PBKDF2
- Iterations: 100,000
- Hash: SHA-256
- Salt: 32 bytes (random)
IV: 12 bytes (random per encryption)
Auth Tag: 16 bytes (GCM authentication tag)
```

### 1.3 Random Number Generation

**CRITICAL SECURITY REQUIREMENT:**

```typescript
// CORRECT: Cryptographically secure random number generation
const salt = crypto.getRandomValues(new Uint8Array(32));
const iv = crypto.getRandomValues(new Uint8Array(12));

// WRONG: NEVER use Math.random() for cryptography!
// const insecure = Math.random(); // ❌ ABSOLUTELY FORBIDDEN
```

**Why crypto.getRandomValues():**
- Cryptographically Secure Pseudo-Random Number Generator (CSPRNG)
- Uses OS-level entropy sources
- Meets cryptographic randomness requirements
- Unpredictable and non-repeating

**Why NOT Math.random():**
- Predictable linear congruential generator
- Can be reverse-engineered
- Not cryptographically secure
- NEVER suitable for security operations

---

## 2. Implementation Architecture

### 2.1 TypeScript Interfaces

```typescript
// File: src/background/crypto/Encryption.ts

interface EncryptionResult {
  encryptedData: string;  // Base64 encoded ciphertext
  salt: string;           // Base64 encoded salt (32 bytes)
  iv: string;             // Base64 encoded IV (12 bytes)
  version: number;        // For future algorithm migrations
}

interface DecryptionInput {
  encryptedData: string;  // Base64 encoded ciphertext
  salt: string;           // Base64 encoded salt
  iv: string;             // Base64 encoded IV
  password: string;       // User password (never stored)
  version: number;        // Algorithm version identifier
}
```

### 2.2 CryptoUtils Class

**File**: `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/CryptoUtils.ts`

**Key Methods:**

1. **deriveKey(password, salt, iterations)**: PBKDF2 key derivation
2. **encrypt(plaintext, password)**: AES-256-GCM encryption
3. **decrypt(ciphertext, password, salt, iv)**: AES-256-GCM decryption
4. **encryptWithKey(plaintext, key)**: Direct encryption with derived key
5. **decryptWithKey(ciphertext, key, iv)**: Direct decryption with derived key
6. **clearSensitiveData(data)**: Memory clearing utility

### 2.3 Storage Format

**chrome.storage.local Structure:**
```json
{
  "wallet": {
    "version": 1,
    "encryptedSeed": "base64_encoded_ciphertext",
    "salt": "base64_encoded_salt",
    "iv": "base64_encoded_iv",
    "createdAt": 1728737280000
  }
}
```

**What's Encrypted**:
- Seed phrases (12/24 word BIP39 mnemonics)
- Imported private keys (WIF format)

**What's NOT Encrypted**:
- Account metadata
- Bitcoin addresses (public information)
- Transaction history (public on blockchain)
- Settings and preferences

---

## 3. Encryption/Decryption Flows

### 3.1 Encryption Flow

```
1. User enters password
   ↓
2. Generate random salt (32 bytes)
   - Use crypto.getRandomValues(new Uint8Array(32))
   ↓
3. Derive encryption key from password
   - PBKDF2(password, salt, 100000, SHA-256) → AES-256 key
   ↓
4. Generate random IV (12 bytes)
   - Use crypto.getRandomValues(new Uint8Array(12))
   ↓
5. Encrypt seed phrase
   - AES-256-GCM(seed_phrase, key, iv) → ciphertext + auth_tag
   ↓
6. Store encryption result
   - {encryptedData, salt, iv, version: 1} → chrome.storage.local
   ↓
7. Clear sensitive data from memory
   - Clear key, seed phrase, password
   - Use fill(0) for binary buffers
```

### 3.2 Decryption Flow

```
1. User enters password
   ↓
2. Retrieve encryption data from storage
   - Read {encryptedData, salt, iv, version} from chrome.storage.local
   ↓
3. Derive encryption key from password
   - PBKDF2(password, salt, 100000, SHA-256) → AES-256 key
   ↓
4. Attempt decryption
   - AES-256-GCM-Decrypt(encryptedData, key, iv)
   ↓
5. Handle result
   - If error: "Incorrect password" (generic message)
   - If success: Return seed phrase (in-memory only)
   ↓
6. Start auto-lock timer
   - 15 minute inactivity timeout
   ↓
7. Clear encryption key from memory
   - Keep seed in memory for wallet operations
   - Clear password immediately
```

### 3.3 Memory Clearing Best Practices

```typescript
// Clear sensitive strings (best effort in JavaScript)
const clearSensitiveData = (data: any) => {
  if (typeof data === 'string') {
    data = '';
  } else if (data instanceof Uint8Array || data instanceof Buffer) {
    data.fill(0);  // Zero out binary buffers
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      clearSensitiveData(data[key]);
    }
  }
};

// Use in try-finally blocks to guarantee cleanup
try {
  const privateKey = derivePrivateKey(seed);
  const signature = signTransaction(privateKey, tx);
  return signature;
} finally {
  clearSensitiveData(privateKey);
}
```

---

## 4. Security Considerations

### 4.1 PBKDF2 Iteration Count

**Current: 100,000 iterations**

**Why 100,000:**
- OWASP minimum recommendation as of 2025
- Balances security and performance
- Makes brute force attacks computationally expensive
- Unlock time: ~500-1000ms (acceptable UX)

**Trade-offs:**
| Iterations | Security | Unlock Time | Brute Force Cost |
|-----------|----------|-------------|------------------|
| 10,000    | LOW      | ~100ms      | Low             |
| 100,000   | MEDIUM   | ~500ms      | Medium          |
| 250,000   | HIGH     | ~1.2s       | High            |
| 500,000   | VERY HIGH| ~2.5s       | Very High       |

**Recommendation**: Start with 100,000, consider increasing to 250,000 in future versions based on performance analysis.

**Future Migration Path**: Version field allows algorithm upgrades without breaking existing wallets.

### 4.2 IV Management

**CRITICAL SECURITY RULE: Never Reuse IVs**

**Why IV reuse is catastrophic:**
- Breaks AES-GCM security completely
- Allows key recovery attacks
- Compromises all data encrypted with reused IV

**Implementation Requirements:**
- Generate new IV for each encryption operation
- Use crypto.getRandomValues() for IV generation
- Store IV alongside ciphertext (plaintext storage is OK)
- Verify IV uniqueness in tests

**IV Properties:**
- Does not need to be secret
- Must be unique for each encryption with same key
- 12 bytes (96 bits) for GCM mode
- Transmitted/stored in plaintext with ciphertext

### 4.3 Salt Management

**Purpose**: Prevent rainbow table attacks on password-based encryption

**Salt Properties:**
- Unique per wallet (not per encryption operation)
- 32 bytes (256 bits) - larger than minimum for extra security
- Generated once during wallet creation
- Stored in plaintext alongside encrypted data
- Does not need to be secret

**Why per-wallet instead of per-encryption:**
- We derive the same encryption key for the entire wallet
- Salt randomizes the key derivation output
- Different wallets with same password get different keys
- Prevents precomputation attacks

### 4.4 Password Requirements

**Enforced Requirements:**
- Minimum length: 8 characters
- At least 3 character types:
  - Lowercase letters (a-z)
  - Uppercase letters (A-Z)
  - Numbers (0-9)
  - Special characters (!@#$%^&*, etc.)
- Not in common password list (top 10,000 passwords blocked)

**Recommended Best Practices:**
- 12+ characters for strong security
- Use passphrase (multiple words with spaces)
- Avoid personal information
- Use password manager
- Don't reuse passwords from other services

**Password Strength Indicator:**
```typescript
enum PasswordStrength {
  WEAK = 'weak',       // 8-11 chars, 2-3 types
  MEDIUM = 'medium',   // 12-15 chars, 3 types
  STRONG = 'strong'    // 16+ chars, 4 types
}
```

### 4.5 Timing Attack Prevention

**Constant-Time Comparison for Secrets:**

```typescript
// WRONG: Variable-time comparison (vulnerable to timing attacks)
if (password1 === password2) { /* ... */ }

// CORRECT: Constant-time comparison
const constantTimeEqual = (a: Buffer, b: Buffer): boolean => {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
};
```

**Note**: For password verification, we rely on Web Crypto API's decryption failure, which includes timing attack resistance. Manual comparison not needed for our use case.

### 4.6 Error Message Security

**CRITICAL: Never leak information in error messages**

```typescript
// WRONG: Leaks information
throw new Error(`Decryption failed for seed: ${seed.substring(0, 10)}...`);
throw new Error(`Invalid password: expected hash ${hash}`);

// CORRECT: Generic error messages
throw new Error('Incorrect password or corrupted data');
throw new Error('Decryption failed');
```

**Why:**
- Error messages can leak sensitive data
- Stack traces may be logged or displayed
- Generic errors prevent information disclosure
- User only needs to know "password wrong" not technical details

---

## 5. Implementation Status

### 5.1 Implementation Checklist

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| Web Crypto API wrapper | ✅ Complete | P0 | CryptoUtils class implemented |
| PBKDF2 key derivation | ✅ Complete | P0 | 100,000 iterations with SHA-256 |
| AES-GCM encryption | ✅ Complete | P0 | Full encrypt() method with validation |
| AES-GCM decryption | ✅ Complete | P0 | Full decrypt() method with error handling |
| Random number generation | ✅ Complete | P0 | Using crypto.getRandomValues() |
| Base64 encoding/decoding | ✅ Complete | P0 | ArrayBuffer ↔ Base64 conversion |
| Error handling | ✅ Complete | P0 | Generic messages, no info leakage |
| Memory clearing utilities | ✅ Complete | P0 | clearSensitiveData() implemented |
| encryptWithKey/decryptWithKey | ✅ Complete | P0 | For imported account encryption |
| Performance testing | Not Started | P1 | Iteration count tuning |

### 5.2 Implementation Files

**Core Files:**
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/CryptoUtils.ts` - Encryption utilities
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/WalletStorage.ts` - Storage management
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/WIFManager.ts` - WIF key encryption

**Test Files:**
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/__tests__/CryptoUtils.test.ts`

### 5.3 Version Migration Strategy

**Current Version**: v1 (AES-256-GCM, PBKDF2-SHA256, 100k iterations)

**Migration Architecture:**
- Version field in storage allows algorithm upgrades
- Migration requires password re-entry (can't decrypt without password)
- Old version support maintained for backward compatibility
- Prompt users to upgrade on wallet unlock

**Potential Future Upgrades:**
- v2: Increase PBKDF2 iterations to 250,000
- v3: Upgrade to Argon2id (better ASIC resistance)
- v4: Post-quantum cryptography (when standardized)

---

## 6. Audit Results

### 6.1 October 12, 2025 - Initial CryptoUtils Audit

**Auditor**: Security Expert
**Scope**: CryptoUtils and WalletStorage implementation
**Status**: ✅ PASSED - All security requirements met
**Findings**: 0 critical, 0 high, 0 medium, 0 low

**Security Verification Results:**

✅ **Encryption Algorithm** - PASSED
- Uses AES-256-GCM (authenticated encryption with AEAD)
- Correct algorithm parameters (12-byte IV, 256-bit key)
- No deprecated or weak algorithms

✅ **Key Derivation** - PASSED
- PBKDF2-HMAC-SHA256 with 100,000 iterations
- Meets OWASP minimum requirements
- Unique 32-byte salt per wallet
- Salt properly passed as ArrayBuffer (type-safe)

✅ **Random Number Generation** - PASSED
- Uses crypto.getRandomValues() for CSPRNG
- No Math.random() usage detected
- Proper entropy for salt (32 bytes) and IV (12 bytes)
- Unique IV generated for each encryption operation

✅ **Input Validation** - PASSED
- All inputs validated before cryptographic operations
- Empty string checks for password, plaintext, salt, IV
- Minimum iteration count enforced (100,000)
- Type checking with TypeScript strict mode

✅ **Error Handling** - PASSED
- Generic error messages that don't leak sensitive information
- No password, plaintext, or keys in error messages
- Consistent error response for all decryption failures

### 6.2 October 18, 2025 - Account Import Encryption Re-Audit

**Auditor**: Security Expert
**Scope**: WIF private key import encryption
**Status**: ✅ APPROVED FOR RELEASE

**Critical Fixes Verified:**
- ✅ CRITICAL-1 FIXED: Password-derived encryption key now used for imported keys
  - `encryptWithKey()` method implemented in CryptoUtils
  - Encryption key derived via PBKDF2-HMAC-SHA256 (100k iterations)
  - Key stored in memory during unlock, cleared on lock
  - No cascading compromise if main seed leaked

- ✅ CRITICAL-2 FIXED: Memory cleanup implemented
  - Try-finally blocks ensure cleanup in all handlers
  - `CryptoUtils.clearSensitiveData()` called after use
  - Buffer.fill(0) for binary data
  - Cleanup guaranteed even on error

**Implementation Quality:**
- Professional, security-focused code
- Defense in depth approach
- Comprehensive error handling
- Well-documented decisions
- No new vulnerabilities introduced

### 6.3 Security Posture Summary

**Overall Risk Assessment**: LOW - Production Ready

**Strengths:**
- Industry-standard algorithms (AES-256-GCM, PBKDF2)
- Web Crypto API (browser-native, audited)
- Proper IV and salt management
- Strong input validation
- Comprehensive error handling
- Memory clearing on lock

**Acceptable Risks:**
- JavaScript memory management limitations (no guaranteed secure deletion)
- 100k PBKDF2 iterations (acceptable, upgradable)
- No hardware security module (HSM) integration
- No biometric authentication (future enhancement)

**Mitigations in Place:**
- Auto-lock after 15 minutes
- Manual lock always available
- Password strength requirements
- Common password blocking
- User education on security

---

## Cross-References

- [Key Management](./key-management.md) - Key storage, lifecycle, auto-lock
- [Threat Model](./threat-model.md) - Encryption-related threats and attack vectors
- [Audits](./audits.md) - Complete audit history and findings
- [Decisions](./decisions.md) - Encryption algorithm selection rationale

---

**Document Changelog:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-22 | 1.0 | Initial encryption.md segmentation from security-expert-notes.md | Security Expert |
