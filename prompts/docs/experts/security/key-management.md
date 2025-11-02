# Key Management

**Last Updated**: October 22, 2025
**Status**: Production Ready - v0.10.0
**Quick Nav**: [INDEX](./_INDEX.md) | [Encryption](./encryption.md) | [Threat Model](./threat-model.md)

---

## Table of Contents

1. [Key Hierarchy](#1-key-hierarchy)
2. [Storage Model](#2-storage-model)
3. [In-Memory State Management](#3-in-memory-state-management)
4. [Auto-Lock Mechanism](#4-auto-lock-mechanism)
5. [Password Policy](#5-password-policy)
6. [Key Rotation & Migration](#6-key-rotation--migration)
7. [Private Key Protection](#7-private-key-protection)

---

## 1. Key Hierarchy

### 1.1 Hierarchical Key Structure

```
User Password (never stored)
    ↓ (PBKDF2 with salt, 100k iterations)
Encryption Key (AES-256, in-memory only, short-lived)
    ↓ (decrypts)
Seed Phrase (BIP39, 12/24 words, in-memory only while unlocked)
    ↓ (BIP32)
Master Private Key (extended key, derived on-demand)
    ↓ (BIP44/BIP48 derivation paths)
Account Private Keys (m/84'/1'/0'/0/0, m/84'/1'/1'/0/0, etc.)
    ↓ (ECDSA)
Bitcoin Addresses (public, stored unencrypted)
```

### 1.2 Key Lifecycle

**1. Wallet Creation:**
```
Generate seed phrase (BIP39) → Encrypt with password → Store encrypted seed
```

**2. Wallet Unlock:**
```
User enters password → Derive encryption key → Decrypt seed → Keep in memory
```

**3. Transaction Signing:**
```
Derive private key from seed → Sign transaction → Clear private key
```

**4. Wallet Lock:**
```
Clear seed from memory → Clear encryption key → User must re-authenticate
```

**5. Wallet Deletion:**
```
Secure deletion from storage → Clear all in-memory keys → Irreversible
```

### 1.3 Key Storage Locations

| Key Type | Storage Location | Encryption | Lifetime |
|----------|-----------------|------------|----------|
| User Password | Never stored | N/A | Entered per session |
| Encryption Key | Memory only | N/A | 15 min or until lock |
| Seed Phrase (encrypted) | chrome.storage.local | AES-256-GCM | Permanent |
| Seed Phrase (decrypted) | Memory only | None | 15 min or until lock |
| Master Private Key | Never stored | N/A | Derived on-demand |
| Account Private Keys | Never stored | N/A | Derived on-demand |
| Extended Public Keys (xpub) | chrome.storage.local | None | Permanent (for multisig) |
| Bitcoin Addresses | chrome.storage.local | None | Permanent |

---

## 2. Storage Model

### 2.1 chrome.storage.local Structure

```json
{
  "wallet": {
    "version": 1,
    "encryptedSeed": "base64_encoded_ciphertext",
    "salt": "base64_encoded_salt",
    "iv": "base64_encoded_iv",
    "createdAt": 1728737280000,
    "accounts": [
      {
        "index": 0,
        "name": "Account 1",
        "type": "single",
        "addressType": "native-segwit",
        "externalIndex": 5,
        "internalIndex": 2,
        "addresses": [
          {
            "index": 0,
            "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
            "path": "m/84'/1'/0'/0/0",
            "used": true
          }
        ]
      },
      {
        "index": 1,
        "name": "Imported Key 1",
        "type": "imported",
        "encryptedPrivateKey": "base64_encoded_encrypted_wif",
        "iv": "base64_encoded_iv",
        "addressType": "native-segwit",
        "address": "tb1q...",
        "importedAt": 1728737300000
      }
    ],
    "settings": {
      "autoLockMinutes": 15,
      "network": "testnet"
    }
  }
}
```

### 2.2 What's Encrypted vs. Plaintext

**ENCRYPTED (Critical Assets):**
- ✅ Seed phrases (12/24 word BIP39 mnemonics)
- ✅ Imported private keys (WIF format)

**NOT ENCRYPTED (No security risk):**
- ❌ Account metadata (names, indices, types)
- ❌ Bitcoin addresses (public on blockchain anyway)
- ❌ Transaction history (public on blockchain)
- ❌ Settings and preferences
- ❌ Extended public keys (xpub for multisig - public by design)
- ❌ Address derivation indices

**Rationale**: Only encrypt data that could lead to fund loss if exposed. Everything else is either public information or doesn't compromise security.

### 2.3 Storage Security Properties

**Isolation:**
- chrome.storage.local is isolated per extension
- Other extensions cannot access our storage
- User data sandboxed per Chrome profile

**Persistence:**
- Data survives browser restarts
- Data survives extension updates
- Data cleared only on extension uninstall (unless manually deleted)

**Quota:**
- chrome.storage.local quota: 10MB (generous for wallet data)
- Monitor usage to prevent quota exhaustion
- Implement cleanup for old transaction cache

**Backup Considerations:**
- Chrome sync can backup extension data (if user enables)
- Encrypted seed phrase safe even in cloud backups
- Seed phrase still required for recovery
- User education: backup seed phrase separately

---

## 3. In-Memory State Management

### 3.1 Service Worker In-Memory State

**State Structure:**
```typescript
interface InMemoryState {
  decryptedSeed: string | null;      // Cleared on lock
  encryptionKey: CryptoKey | null;   // Cleared on lock
  unlockedUntil: number;              // Timestamp for auto-lock
  lastActivity: number;               // For inactivity detection
}
```

**Security Rules:**

1. **Never persist decrypted keys**
   - Seed phrase only in memory while unlocked
   - Private keys derived on-demand, cleared immediately
   - Encryption key cleared on lock

2. **Clear on service worker termination**
   - Chrome can terminate service worker anytime
   - State lost on termination = automatic lock
   - User must re-authenticate after termination

3. **No caching of sensitive data**
   - Don't cache private keys for performance
   - Derive fresh for each transaction
   - Accept computational cost for security

4. **Auto-lock enforcement**
   - 15 minutes of inactivity = automatic lock
   - Manual lock always available
   - Lock on browser close (service worker termination)

### 3.2 Memory Clearing Best Practices

```typescript
const lockWallet = () => {
  if (inMemoryState?.decryptedSeed) {
    // Overwrite with zeros (best effort in JavaScript)
    inMemoryState.decryptedSeed = '';
    delete inMemoryState.decryptedSeed;
  }

  if (inMemoryState?.encryptionKey) {
    // Can't zero out CryptoKey, but can remove reference
    delete inMemoryState.encryptionKey;
  }

  inMemoryState = null;

  // Notify UI to show lock screen
  chrome.runtime.sendMessage({ type: 'WALLET_LOCKED' });

  // Clear any cached transaction data
  clearTransactionCache();
};
```

**JavaScript Memory Management Limitations:**

- JavaScript doesn't guarantee secure memory deletion
- Garbage collector controls memory reclamation
- String interning may keep copies in memory
- Best effort: overwrite with empty string, delete reference

**Mitigations:**
- Auto-lock limits exposure window
- Service worker termination clears memory
- User education on device security
- Consider Web Assembly for future versions (more control)

### 3.3 Sensitive Operations Require Recent Authentication

**Operations that require unlocked wallet:**
- Sending transactions (signing required)
- Revealing seed phrase
- Exporting private keys (WIF format)
- Creating new accounts (seed derivation)
- Importing accounts (encryption required)
- Deleting wallet

**Re-authentication Triggers:**
- Wallet locked (15 min inactivity)
- Service worker terminated
- Manual lock by user
- Browser restart

---

## 4. Auto-Lock Mechanism

### 4.1 Trigger Conditions

**Automatic Lock Triggers:**

1. **Inactivity timeout (15 minutes)**
   - Configurable in settings (future)
   - Resets on any wallet interaction
   - Background operations don't count as activity

2. **Service worker termination**
   - Chrome terminates inactive service workers
   - Automatic with no user interaction needed
   - In-memory state lost = wallet locked

3. **Browser close/restart**
   - Service worker terminated on browser close
   - Must unlock on next browser session

4. **Extension reload/update**
   - Service worker restarted
   - All in-memory state cleared

**Manual Lock:**
- Lock button always visible in UI
- Immediate lock on click
- No delay or confirmation required

### 4.2 Lock Implementation

```typescript
// Auto-lock timer management
let autoLockTimer: NodeJS.Timeout | null = null;

const resetAutoLockTimer = () => {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
  }

  const autoLockMinutes = 15; // From settings
  autoLockTimer = setTimeout(() => {
    lockWallet();
  }, autoLockMinutes * 60 * 1000);
};

// Reset timer on activity
chrome.runtime.onMessage.addListener((message) => {
  if (isWalletUnlocked()) {
    resetAutoLockTimer();
  }
});
```

### 4.3 Lock Procedure

**Complete Lock Sequence:**

```typescript
const lockWallet = () => {
  // 1. Clear decrypted seed phrase
  if (inMemoryState?.decryptedSeed) {
    inMemoryState.decryptedSeed = '';
    delete inMemoryState.decryptedSeed;
  }

  // 2. Clear encryption key
  if (inMemoryState?.encryptionKey) {
    delete inMemoryState.encryptionKey;
  }

  // 3. Clear all derived keys (if any cached)
  clearDerivedKeys();

  // 4. Clear transaction cache
  clearTransactionCache();

  // 5. Reset state
  inMemoryState = null;

  // 6. Clear auto-lock timer
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }

  // 7. Notify UI
  chrome.runtime.sendMessage({ type: 'WALLET_LOCKED' });

  // 8. Force garbage collection (if available)
  if (global.gc) {
    global.gc();
  }
};
```

### 4.4 Unlock Requirements

**To unlock wallet after lock:**

1. User must enter password
2. Password derives encryption key via PBKDF2
3. Encryption key decrypts seed phrase
4. Seed phrase stored in memory
5. Auto-lock timer started
6. UI notified of unlock success

**No "remember me" or persistent unlock:**
- Security over convenience
- 15 minutes is balance between UX and security
- User can manually lock anytime

---

## 5. Password Policy

### 5.1 Requirements (Enforced)

**Minimum Password Requirements:**

1. **Length**: Minimum 8 characters
2. **Complexity**: At least 3 of the following:
   - Lowercase letters (a-z)
   - Uppercase letters (A-Z)
   - Numbers (0-9)
   - Special characters (!@#$%^&*()_+-=[]{}|;:',.<>?/)
3. **Blacklist**: Not in top 10,000 common passwords
4. **Confirmation**: Must match confirmation field

**Validation Implementation:**
```typescript
const validatePassword = (password: string): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const typeCount = [hasLower, hasUpper, hasNumber, hasSpecial]
    .filter(Boolean).length;

  if (typeCount < 3) {
    errors.push('Password must include at least 3 character types');
  }

  if (isCommonPassword(password)) {
    errors.push('This password is too common. Please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
```

### 5.2 Recommendations (Encouraged)

**Best Practices (shown to user):**

- ✅ Use 12+ characters for strong security
- ✅ Use passphrase (multiple words with spaces)
  - Example: "correct horse battery staple"
  - Easier to remember, harder to crack
- ✅ Avoid personal information (name, birthday, etc.)
- ✅ Use password manager (LastPass, 1Password, Bitwarden)
- ✅ Don't reuse passwords from other services
- ✅ Consider using diceware for strong passphrases

### 5.3 Password Strength Indicator

```typescript
enum PasswordStrength {
  WEAK = 'weak',       // 8-11 chars, 2-3 types
  MEDIUM = 'medium',   // 12-15 chars, 3 types
  STRONG = 'strong'    // 16+ chars, 4 types
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  const typeCount = [hasLower, hasUpper, hasNumber, hasSpecial]
    .filter(Boolean).length;

  if (length >= 16 && typeCount === 4) {
    return PasswordStrength.STRONG;
  } else if (length >= 12 && typeCount >= 3) {
    return PasswordStrength.MEDIUM;
  } else {
    return PasswordStrength.WEAK;
  }
};
```

### 5.4 Password Storage and Handling

**CRITICAL SECURITY RULES:**

1. **Never store password anywhere**
   - Not in memory after key derivation
   - Not in storage (local or cloud)
   - Not in logs or error messages

2. **Clear password immediately after use**
   ```typescript
   const unlockWallet = async (password: string) => {
     try {
       const key = await deriveKey(password);
       const seed = await decrypt(encryptedSeed, key);
       return { success: true };
     } finally {
       password = '';  // Clear immediately
     }
   };
   ```

3. **No password recovery**
   - No "forgot password" feature (by design)
   - Only seed phrase can recover wallet
   - Password is for encryption only, not authentication
   - Clear warning during wallet setup

4. **No password hints**
   - Hints can leak information
   - Reduces password strength
   - Users must remember or use password manager

---

## 6. Key Rotation & Migration

### 6.1 Current Version

**Version 1 Specification:**
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2-HMAC-SHA256
- Iterations: 100,000
- Salt: 32 bytes
- IV: 12 bytes

### 6.2 Version Migration Strategy

**Migration Architecture:**

```typescript
interface EncryptedWallet {
  version: number;  // Allows algorithm upgrades
  encryptedSeed: string;
  salt: string;
  iv: string;
  // ... other fields
}

const migrateWalletVersion = async (
  oldWallet: EncryptedWallet,
  password: string
): Promise<EncryptedWallet> => {
  // 1. Decrypt with old version algorithm
  const seed = await decryptWithVersion(oldWallet, password);

  // 2. Re-encrypt with new version algorithm
  const newWallet = await encryptWithNewVersion(seed, password);

  // 3. Update version field
  newWallet.version = 2;

  return newWallet;
};
```

**Migration Trigger:**
- Automatic prompt on wallet unlock
- "Your wallet encryption can be upgraded. Upgrade now?"
- Requires password re-entry
- Old version support maintained for users who decline

**Backward Compatibility:**
- Always support decrypting old versions
- Never break existing wallets
- Gradual migration over time
- No forced upgrades (user choice)

### 6.3 Future Upgrade Paths

**Potential Version 2 (Post-MVP):**
- Increase PBKDF2 iterations to 250,000
- Larger salt (64 bytes)
- Additional authenticated data (account metadata)

**Potential Version 3 (Mainnet):**
- Upgrade to Argon2id
- Better ASIC resistance
- Memory-hard algorithm
- Industry trend toward Argon2

**Potential Version 4 (Long-term):**
- Post-quantum cryptography
- When NIST standards finalized
- Hybrid classical + post-quantum
- Future-proof against quantum computers

### 6.4 Password Change Flow

**Change Password (Re-encryption Required):**

```
1. User enters old password
   ↓
2. Decrypt seed with old password
   ↓
3. User enters new password
   ↓
4. Re-encrypt seed with new password
   - New salt generated
   - New IV generated
   - Same algorithm (unless upgrading version)
   ↓
5. Replace encrypted wallet in storage
   ↓
6. Clear old and new passwords from memory
   ↓
7. Auto-lock wallet (require new password to unlock)
```

**Security Considerations:**
- Old password required (proof of ownership)
- New password validated against policy
- Atomic update (all or nothing)
- Old encrypted seed securely overwritten
- User warned: backup new wallet after password change

---

## 7. Private Key Protection

### 7.1 Secure Logging Wrapper

**CRITICAL: Prevent accidental logging of sensitive data**

```typescript
const SENSITIVE_KEYWORDS = [
  'seed', 'mnemonic', 'private', 'password', 'priv', 'key',
  'wif', 'xprv', 'secret'
];

const sanitizeObject = (obj: any, keywords: string[]): any => {
  if (typeof obj === 'string') {
    for (const keyword of keywords) {
      if (obj.toLowerCase().includes(keyword)) {
        return '[REDACTED]';
      }
    }
    return obj;
  }

  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = Array.isArray(obj) ? [] : {};
    for (const key in obj) {
      if (keywords.some(kw => key.toLowerCase().includes(kw))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeObject(obj[key], keywords);
      }
    }
    return sanitized;
  }

  return obj;
};

const secureLog = (message: string, data?: any) => {
  const sanitized = sanitizeObject(data, SENSITIVE_KEYWORDS);
  console.log(message, sanitized);
};
```

### 7.2 Memory Clearing Utilities

```typescript
const clearSensitiveData = (data: any): void => {
  if (typeof data === 'string') {
    // Best effort in JavaScript
    data = '';
  } else if (data instanceof Uint8Array || data instanceof Buffer) {
    // Zero out binary buffers
    data.fill(0);
  } else if (typeof data === 'object' && data !== null) {
    for (const key in data) {
      clearSensitiveData(data[key]);
      delete data[key];
    }
  }
};

// Use in try-finally to guarantee cleanup
const signTransaction = async (seed: string, tx: Transaction) => {
  let privateKey: Buffer | null = null;
  try {
    privateKey = derivePrivateKey(seed, path);
    const signature = createSignature(privateKey, tx);
    return signature;
  } finally {
    if (privateKey) {
      clearSensitiveData(privateKey);
      privateKey = null;
    }
  }
};
```

### 7.3 UI Masking

**Seed Phrase Display:**
- Words masked by default (shown as "••••••")
- Click individual word to reveal
- "Reveal All" button requires confirmation
- Warning: "Never share your seed phrase"
- Screenshot detection warning (future)

**Private Key Export:**
- Require password confirmation
- Show strong warnings
- Mask WIF by default
- Copy button for convenience
- Auto-clear clipboard after 60 seconds (future)

### 7.4 Error Message Security

**Generic Error Messages:**

```typescript
// WRONG: Leaks sensitive information
throw new Error(`Invalid seed phrase: ${seed}`);
throw new Error(`Decryption failed with key ${key.substring(0, 10)}`);

// CORRECT: Generic, no information leakage
throw new Error('Invalid seed phrase');
throw new Error('Incorrect password or corrupted data');
```

**Error Handling Best Practices:**
- Never include sensitive data in errors
- No stack traces with sensitive variables
- Generic user-facing messages
- Detailed technical errors only in secure logs (if any)

---

## Cross-References

- [Encryption](./encryption.md) - AES-256-GCM encryption implementation
- [Threat Model](./threat-model.md) - Key management attack vectors
- [Audits](./audits.md) - Key management audit findings
- [Decisions](./decisions.md) - Auto-lock duration, password requirements

---

**Document Changelog:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-22 | 1.0 | Initial key-management.md segmentation from security-expert-notes.md | Security Expert |
