# Security Expert Notes
## Bitcoin Wallet Chrome Extension

**Document Owner**: Security Expert
**Last Updated**: October 18, 2025
**Version**: 2.0 (Account Import Re-Audit Complete)
**Status**: v0.10.0 Security Approved - Production Ready

---

## Table of Contents
1. [Threat Model](#threat-model)
2. [Encryption Implementation](#encryption-implementation)
3. [Key Management](#key-management)
4. [Security Architecture](#security-architecture)
5. [Vulnerability Assessments](#vulnerability-assessments)
6. [Mitigation Strategies](#mitigation-strategies)
7. [Security Testing](#security-testing)
8. [Incident Response](#incident-response)
9. [Security Audit Log](#security-audit-log)
10. [Penetration Testing](#penetration-testing)
11. [Security Checklist](#security-checklist)

---

## 1. Threat Model

### 1.1 Asset Classification

**Critical Assets** (Loss = Permanent Fund Loss):
- Private keys (in memory)
- Seed phrases (12/24 word mnemonics)
- Encrypted seed phrase (in storage)
- Encryption keys (derived from password)

**High-Value Assets** (Loss = User Privacy/Security):
- User passwords
- Account balances
- Transaction history
- Bitcoin addresses
- UTXO data

**Medium-Value Assets** (Loss = User Inconvenience):
- Account names
- Wallet settings
- UI preferences
- Address book (future feature)

### 1.2 Attack Vectors

#### A. Private Key/Seed Phrase Exposure

**Threat**: Unauthorized access to private keys or seed phrases leads to permanent loss of all funds.

**Attack Scenarios**:
1. **Console Logging**
   - Severity: CRITICAL
   - Likelihood: Medium (developer error)
   - Impact: Complete fund loss
   - Description: Accidentally logging sensitive data to browser console during development
   - Detection: Code review, automated linting

2. **Error Message Leakage**
   - Severity: CRITICAL
   - Likelihood: Low
   - Impact: Complete fund loss
   - Description: Including seed phrases or private keys in error messages
   - Detection: Error handling audit

3. **Memory Inspection**
   - Severity: CRITICAL
   - Likelihood: Low (requires local access)
   - Impact: Complete fund loss
   - Description: Using browser DevTools or memory dumps to extract keys
   - Detection: Runtime protection, auto-lock

4. **Clipboard Hijacking**
   - Severity: HIGH
   - Likelihood: Medium
   - Impact: Seed phrase theft
   - Description: Malicious extension monitoring clipboard for seed phrases
   - Detection: User education, minimal clipboard usage

5. **Screen Recording/Shoulder Surfing**
   - Severity: HIGH
   - Likelihood: Low
   - Impact: Seed phrase theft
   - Description: Physical access or screen recording during wallet setup
   - Detection: User warnings, masked display

#### B. Encryption Weaknesses

**Threat**: Weak encryption allows attacker to decrypt stored seed phrase.

**Attack Scenarios**:
1. **Weak Password**
   - Severity: HIGH
   - Likelihood: High (user behavior)
   - Impact: Offline brute force success
   - Description: Users choosing weak passwords (e.g., "password123")
   - Detection: Password strength validation

2. **Insufficient PBKDF2 Iterations**
   - Severity: HIGH
   - Likelihood: Low (design decision)
   - Impact: Faster brute force attacks
   - Description: Too few iterations make brute force feasible
   - Detection: Code review

3. **IV Reuse**
   - Severity: CRITICAL
   - Likelihood: Low (implementation error)
   - Impact: Cryptographic failure, key recovery
   - Description: Reusing initialization vectors with same key
   - Detection: Code review, automated testing

4. **Weak Random Number Generation**
   - Severity: CRITICAL
   - Likelihood: Low (design decision)
   - Impact: Predictable keys, complete compromise
   - Description: Using Math.random() instead of crypto.getRandomValues()
   - Detection: Code review, automated linting

5. **Timing Attacks**
   - Severity: MEDIUM
   - Likelihood: Very Low (requires sophisticated attacker)
   - Impact: Password or key recovery
   - Description: Using timing differences to extract secrets
   - Detection: Constant-time comparison functions

#### C. Storage Attacks

**Threat**: Direct access to chrome.storage.local exposes encrypted data.

**Attack Scenarios**:
1. **Local Storage Access**
   - Severity: MEDIUM
   - Likelihood: Medium (malware/physical access)
   - Impact: Encrypted seed exposure (requires password cracking)
   - Description: Malware or physical access reading chrome.storage.local
   - Detection: Strong encryption, password strength requirements

2. **Backup/Sync Exposure**
   - Severity: MEDIUM
   - Likelihood: Low
   - Impact: Encrypted data in cloud backups
   - Description: Chrome sync or system backups containing encrypted wallet
   - Detection: User education, secure deletion

3. **Forensic Recovery**
   - Severity: MEDIUM
   - Likelihood: Low (requires physical access)
   - Impact: Recovery of deleted encrypted data
   - Description: File recovery tools retrieving deleted storage data
   - Detection: Secure deletion practices

#### D. Transaction Manipulation

**Threat**: Attacker modifies transaction details before signing.

**Attack Scenarios**:
1. **Address Swap Attack**
   - Severity: CRITICAL
   - Likelihood: Medium
   - Impact: Funds sent to attacker's address
   - Description: Malware or malicious extension swapping recipient address
   - Detection: Transaction confirmation UI, address verification

2. **Amount Modification**
   - Severity: CRITICAL
   - Likelihood: Low
   - Impact: Sending more than intended
   - Description: Modifying amount before transaction signing
   - Detection: Clear confirmation dialog

3. **Fee Manipulation**
   - Severity: MEDIUM
   - Likelihood: Low
   - Impact: Overpaying fees
   - Description: Manipulating fee estimation to extract more funds
   - Detection: Fee reasonability checks, multiple sources

#### E. Phishing & Social Engineering

**Threat**: User tricked into revealing credentials or seed phrase.

**Attack Scenarios**:
1. **Fake Wallet Interface**
   - Severity: CRITICAL
   - Likelihood: Medium
   - Impact: Credentials or seed phrase theft
   - Description: Phishing website mimicking wallet interface
   - Detection: User education, domain verification

2. **Seed Phrase Phishing**
   - Severity: CRITICAL
   - Likelihood: Medium
   - Impact: Complete fund loss
   - Description: Fake "support" requesting seed phrase
   - Detection: Clear warnings: "Never share your seed phrase"

3. **Password Theft**
   - Severity: HIGH
   - Likelihood: Medium
   - Impact: Wallet access (while unlocked)
   - Description: Keyloggers or fake password prompts
   - Detection: User education, auto-lock

#### F. Browser-Based Attacks

**Threat**: Exploitation of browser or extension vulnerabilities.

**Attack Scenarios**:
1. **Cross-Site Scripting (XSS)**
   - Severity: HIGH
   - Likelihood: Low (Manifest V3 CSP)
   - Impact: Code injection, data theft
   - Description: Injecting malicious scripts into extension
   - Detection: CSP enforcement, input sanitization

2. **Extension Conflicts**
   - Severity: MEDIUM
   - Likelihood: Medium
   - Impact: Data interception, UI manipulation
   - Description: Malicious extensions accessing our extension's data
   - Detection: Message source validation, isolation

3. **Browser Vulnerabilities**
   - Severity: HIGH
   - Likelihood: Low (browser updates)
   - Impact: Sandbox escape, memory access
   - Description: Zero-day browser vulnerabilities
   - Detection: Regular browser updates

#### G. Denial of Service

**Threat**: Wallet becomes unusable, blocking access to funds.

**Attack Scenarios**:
1. **Service Worker Termination**
   - Severity: MEDIUM
   - Likelihood: High (Chrome behavior)
   - Impact: Temporary loss of access (requires re-unlock)
   - Description: Chrome terminates inactive service workers
   - Detection: Proper state management, re-authentication

2. **Storage Quota Exhaustion**
   - Severity: LOW
   - Likelihood: Very Low
   - Impact: Cannot save new data
   - Description: Filling storage quota prevents updates
   - Detection: Storage monitoring, cleanup

3. **API Rate Limiting**
   - Severity: MEDIUM
   - Likelihood: Medium
   - Impact: Cannot check balance or send transactions
   - Description: Blockstream API rate limiting
   - Detection: Request throttling, caching

### 1.3 Threat Prioritization Matrix

| Threat Category | Severity | Likelihood | Priority | Status |
|-----------------|----------|------------|----------|--------|
| Private Key Exposure | CRITICAL | Medium | P0 | Planning |
| Weak Encryption | HIGH | High | P0 | Planning |
| Transaction Manipulation | CRITICAL | Medium | P0 | Planning |
| Phishing Attacks | CRITICAL | High | P1 | Planning |
| Storage Attacks | MEDIUM | Medium | P1 | Planning |
| Browser Attacks | HIGH | Low | P2 | Planning |
| DoS Attacks | MEDIUM | Medium | P2 | Planning |

---

## 2. Encryption Implementation

### 2.1 Encryption Specification

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- Authenticated encryption with associated data (AEAD)
- Provides both confidentiality and integrity
- Resistant to padding oracle attacks
- Native browser support via Web Crypto API

**Key Derivation**: PBKDF2-HMAC-SHA256
- Iterations: 100,000 (OWASP minimum, adjustable based on performance)
- Salt: 32 bytes (256 bits), cryptographically random
- Output: 256-bit AES key

**Initialization Vector (IV)**:
- Size: 12 bytes (96 bits) for GCM mode
- Must be unique for each encryption operation
- Generated using crypto.getRandomValues()
- Stored alongside ciphertext

### 2.2 Implementation Architecture

```typescript
// File: src/background/crypto/Encryption.ts

interface EncryptionResult {
  encryptedData: string;  // Base64 encoded
  salt: string;           // Base64 encoded
  iv: string;             // Base64 encoded
  version: number;        // For future algorithm migrations
}

interface DecryptionInput {
  encryptedData: string;
  salt: string;
  iv: string;
  password: string;
  version: number;
}
```

### 2.3 Encryption Flow

```
1. User enters password
   ↓
2. Generate random salt (32 bytes)
   ↓
3. PBKDF2(password, salt, 100000, SHA-256) → AES-256 key
   ↓
4. Generate random IV (12 bytes)
   ↓
5. AES-256-GCM(seed_phrase, key, iv) → ciphertext + auth_tag
   ↓
6. Store: {encryptedData, salt, iv, version: 1}
   ↓
7. Clear key and seed phrase from memory
```

### 2.4 Decryption Flow

```
1. User enters password
   ↓
2. Retrieve {encryptedData, salt, iv} from storage
   ↓
3. PBKDF2(password, salt, 100000, SHA-256) → AES-256 key
   ↓
4. AES-256-GCM-Decrypt(encryptedData, key, iv) → seed_phrase OR error
   ↓
5. If error: "Incorrect password"
   ↓
6. If success: Return seed phrase (in-memory only)
   ↓
7. Clear key from memory, start auto-lock timer
```

### 2.5 Security Considerations

**PBKDF2 Iteration Count**:
- Minimum: 100,000 (OWASP recommendation as of 2025)
- Target: 250,000+ for better security
- Trade-off: Higher iterations = slower unlock (1-2 seconds acceptable)
- Recommendation: Start with 100,000, increase in future versions

**Password Requirements**:
- Minimum length: 8 characters
- Recommended: 12+ characters
- Character diversity: At least 3 of: lowercase, uppercase, numbers, special
- Common password check: Block top 10,000 common passwords
- Passphrase support: Allow spaces for multi-word passphrases

**Random Number Generation**:
```typescript
// CORRECT: Cryptographically secure
const salt = crypto.getRandomValues(new Uint8Array(32));
const iv = crypto.getRandomValues(new Uint8Array(12));

// WRONG: NEVER use Math.random() for cryptography!
// const insecure = Math.random(); // ❌
```

**IV Management**:
- Generate new IV for each encryption operation
- Never reuse IV with same key
- IV doesn't need to be secret (stored in plaintext)
- IV reuse breaks AES-GCM security completely

**Salt Management**:
- Generate new salt for each wallet
- Salt is unique per wallet, not per encryption
- Stored in plaintext alongside encrypted data
- Prevents rainbow table attacks

### 2.6 Implementation Status

| Component | Status | Priority | Notes |
|-----------|--------|----------|-------|
| Web Crypto API wrapper | ✅ Complete | P0 | CryptoUtils class implemented |
| PBKDF2 key derivation | ✅ Complete | P0 | 100,000 iterations with SHA-256 |
| AES-GCM encryption | ✅ Complete | P0 | Full encrypt() method with validation |
| AES-GCM decryption | ✅ Complete | P0 | Full decrypt() method with error handling |
| Random number generation | ✅ Complete | P0 | Using crypto.getRandomValues() |
| Base64 encoding/decoding | ✅ Complete | P0 | ArrayBuffer <-> Base64 conversion |
| Error handling | ✅ Complete | P0 | Generic messages, no info leakage |
| Performance testing | Not Started | P1 | Iteration count tuning |

**Implementation Files**:
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/CryptoUtils.ts` - Encryption utilities
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/WalletStorage.ts` - Storage management

---

## 3. Key Management

### 3.1 Key Hierarchy

```
User Password
    ↓ (PBKDF2)
Encryption Key (AES-256, in-memory only, short-lived)
    ↓ (decrypts)
Seed Phrase (BIP39, 12/24 words, in-memory only)
    ↓ (BIP32)
Master Private Key (extended key)
    ↓ (BIP44 derivation)
Account Private Keys (m/84'/1'/0'/0/0, m/84'/1'/1'/0/0, etc.)
    ↓
Bitcoin Addresses (public)
```

### 3.2 Storage Model

**chrome.storage.local Structure**:
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
      }
    ],
    "settings": {
      "autoLockMinutes": 15,
      "network": "testnet"
    }
  }
}
```

**What's Encrypted**: Only the seed phrase
**What's Not Encrypted**: Account metadata, addresses, settings (no privacy/security risk)

### 3.3 In-Memory State Management

**Service Worker State** (Volatile):
```typescript
interface InMemoryState {
  decryptedSeed: string | null;  // Cleared on lock
  unlockedUntil: number;          // Timestamp for auto-lock
  lastActivity: number;           // For inactivity detection
}
```

**Security Rules**:
- Seed phrase never persists in memory after lock
- Seed phrase derived on-demand for each transaction signing
- No caching of private keys
- Auto-lock after 15 minutes of inactivity
- Manual lock clears all sensitive data immediately

### 3.4 Auto-Lock Mechanism

**Trigger Conditions**:
1. Manual lock (user clicks "Lock")
2. Inactivity timeout (15 minutes, configurable)
3. Browser close (service worker termination)
4. Extension reload/update

**Lock Procedure**:
```typescript
const lockWallet = () => {
  if (inMemoryState?.decryptedSeed) {
    // Overwrite with zeros (best effort in JavaScript)
    inMemoryState.decryptedSeed = '';
    delete inMemoryState.decryptedSeed;
  }
  
  inMemoryState = null;
  
  // Notify UI to show lock screen
  chrome.runtime.sendMessage({ type: 'WALLET_LOCKED' });
  
  // Clear any cached transaction data
  clearTransactionCache();
};
```

### 3.5 Password Policy

**Requirements** (Enforced):
- Minimum length: 8 characters
- At least 3 character types: lowercase, uppercase, numbers, special
- Not in common password list (top 10,000)

**Recommendations** (Encouraged):
- 12+ characters for strong security
- Use passphrase (multiple words with spaces)
- Avoid personal information
- Use password manager

**Strength Indicator**:
```typescript
enum PasswordStrength {
  WEAK = 'weak',       // 8-11 chars, 2-3 types
  MEDIUM = 'medium',   // 12-15 chars, 3 types
  STRONG = 'strong'    // 16+ chars, 4 types
}
```

### 3.6 Key Rotation & Migration

**Current Version**: v1 (AES-256-GCM, PBKDF2-SHA256, 100k iterations)

**Future Migration Strategy**:
- Version field in storage allows algorithm upgrades
- Migration requires password re-entry
- Old version support maintained for backward compatibility
- Prompt users to upgrade on wallet unlock

**Potential Future Upgrades**:
- Increase PBKDF2 iterations (e.g., 250k, 500k)
- Upgrade to Argon2id (better ASIC resistance)
- Post-quantum cryptography (when standardized)

---

## 4. Security Architecture

### 4.1 Defense in Depth Layers

**Layer 1: Browser Security**
- Chrome extension sandbox
- Manifest V3 security features
- Content Security Policy (CSP)

**Layer 2: Encryption at Rest**
- AES-256-GCM encrypted seed phrase
- Strong password requirements
- Secure key derivation (PBKDF2)

**Layer 3: Runtime Protection**
- In-memory only decrypted keys
- Auto-lock after inactivity
- No persistent decrypted data

**Layer 4: Communication Security**
- Message source validation
- HTTPS for all API calls
- Input validation and sanitization

**Layer 5: User Education**
- Clear security warnings
- Seed phrase backup instructions
- Phishing awareness

### 4.2 Chrome Extension Security

**Manifest V3 Security Features**:
```json
{
  "manifest_version": 3,
  "permissions": [
    "storage"  // Only required permission
  ],
  "host_permissions": [
    "https://blockstream.info/*"  // Only Blockstream API
  ],
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

**CSP Restrictions**:
- No eval() or inline scripts
- No external script loading
- No data: URIs for scripts
- No unsafe-inline or unsafe-eval

**Extension Isolation**:
- Service worker runs in separate context
- No access to web page DOM
- No content scripts (not needed for wallet)
- Message passing only through chrome.runtime API

### 4.3 Message Security

**Message Validation**:
```typescript
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Verify sender is from our extension
  if (sender.id !== chrome.runtime.id) {
    console.warn('Ignoring message from external source');
    return false;
  }
  
  // Validate message structure
  if (!message.type || typeof message.type !== 'string') {
    sendResponse({ error: 'Invalid message format' });
    return false;
  }
  
  // Process message
  handleSecureMessage(message, sendResponse);
  return true;
});
```

**Sensitive Operations** (Require Recent Authentication):
- Sending transactions
- Revealing seed phrase
- Exporting private keys (future feature)
- Deleting wallet

### 4.4 API Security

**Blockstream API**:
- HTTPS only (enforced)
- No authentication required (public API)
- Rate limiting handled client-side
- Input validation before API calls

**Security Considerations**:
- Man-in-the-middle: Mitigated by HTTPS/TLS
- API compromise: Cannot access wallet keys (client-side wallet)
- Rate limiting: Implement exponential backoff
- Fallback: Consider multiple API providers (future)

---

## 5. Vulnerability Assessments

### 5.1 Dependency Vulnerability Scanning

**Process**:
- Run `npm audit` before every commit
- Use Snyk or Dependabot for automated monitoring
- Review CVE databases for crypto libraries
- Prioritize critical and high-severity issues

**Critical Dependencies** (Require Extra Scrutiny):
- bitcoinjs-lib: Bitcoin transaction handling
- bip39: Seed phrase generation
- bip32: HD wallet key derivation
- Web Crypto API: Native browser implementation

**Action Plan**:
1. Weekly: npm audit check
2. Monthly: Full dependency review
3. Immediate: Patch critical vulnerabilities
4. Quarterly: Major version upgrades

### 5.2 Known Vulnerability Registry

**Status**: No vulnerabilities identified yet (project not started)

**Template for Future Entries**:
```markdown
### VUL-001: [Vulnerability Name]
- **Date Discovered**: YYYY-MM-DD
- **Severity**: Critical/High/Medium/Low
- **Component**: Affected component
- **Description**: What the vulnerability is
- **Impact**: What could happen
- **Mitigation**: How we fixed it
- **Status**: Patched/In Progress/Accepted Risk
```

### 5.3 Common Web Extension Vulnerabilities

**Vulnerabilities to Avoid**:

1. **Insecure Storage**
   - Storing sensitive data in localStorage (use chrome.storage.local)
   - Storing unencrypted secrets
   - Not validating storage data

2. **Message Injection**
   - Not validating message sender
   - Not sanitizing message payloads
   - Exposing sensitive APIs to content scripts

3. **CSP Bypasses**
   - Using eval() or Function() constructor
   - Inline scripts or event handlers
   - Loading external scripts

4. **Weak Randomness**
   - Using Math.random() for crypto
   - Insufficient entropy for key generation
   - Predictable IVs or salts

---

## 6. Mitigation Strategies

### 6.1 Private Key Protection

**Mitigation Controls**:

1. **No Logging**
   ```typescript
   // Implement secure logging wrapper
   const SENSITIVE_KEYWORDS = [
     'seed', 'mnemonic', 'private', 'password', 'priv', 'key'
   ];
   
   const secureLog = (message: string, data?: any) => {
     const sanitized = sanitizeObject(data, SENSITIVE_KEYWORDS);
     console.log(message, sanitized);
   };
   ```

2. **Memory Clearing**
   ```typescript
   // Clear sensitive data on lock
   const clearSensitiveData = (obj: any) => {
     if (typeof obj === 'string') {
       obj = '';
     } else if (obj instanceof Uint8Array) {
       obj.fill(0);
     } else if (typeof obj === 'object') {
       for (const key in obj) {
         clearSensitiveData(obj[key]);
       }
     }
   };
   ```

3. **Auto-Lock**
   - 15-minute inactivity timeout
   - Manual lock button always visible
   - Lock on browser close

4. **UI Masking**
   - Seed phrase words masked by default
   - Click to reveal individual words
   - Warning: "Never share your seed phrase"

### 6.2 Password Security

**Mitigation Controls**:

1. **Strength Requirements**
   - Enforced minimum complexity
   - Real-time strength indicator
   - Reject common passwords

2. **No Storage**
   - Password never stored anywhere
   - Only used for key derivation
   - Cleared from memory immediately

3. **Brute Force Protection**
   - PBKDF2 makes attacks expensive
   - Consider rate limiting (future enhancement)
   - User education on strong passwords

4. **No Recovery**
   - No "forgot password" feature (by design)
   - Only seed phrase can recover wallet
   - Clear warning during setup

### 6.3 Transaction Security

**Mitigation Controls**:

1. **Confirmation Dialog**
   - Show full recipient address
   - Show exact amount in BTC
   - Show estimated fee
   - Require explicit confirmation

2. **Address Validation**
   - Validate format before accepting
   - Checksum verification
   - Network matching (testnet vs mainnet)

3. **Amount Validation**
   - Check for positive amounts
   - Verify sufficient balance
   - Warn on large transactions

4. **Fee Reasonability**
   - Compare against multiple sources
   - Warn if fee > 10% of amount
   - Allow fee customization (future)

### 6.4 Phishing Protection

**Mitigation Controls**:

1. **User Education**
   - "Never share seed phrase" warning on setup
   - "No support will ask for your seed phrase" message
   - Phishing awareness tips in settings

2. **UI Consistency**
   - Consistent branding and design
   - No external links in critical flows
   - Clear extension identity

3. **Seed Phrase Handling**
   - Never auto-copy to clipboard
   - Manual reveal required
   - Confirm user wrote it down

---

## 7. Security Testing

### 7.1 Test Plan

**Unit Tests** (Security-Focused):
- Encryption/decryption with various inputs
- Password validation edge cases
- Random number generation quality
- Memory clearing functions
- Input sanitization

**Integration Tests**:
- Full wallet creation flow with encryption
- Unlock with correct/incorrect password
- Auto-lock functionality
- Message validation and filtering
- Transaction signing security

**Penetration Testing**:
- Attempt to extract keys from storage
- Attempt to bypass password requirements
- Test service worker persistence attacks
- Test message injection attacks
- Test XSS vectors

### 7.2 Security Test Cases

**TC-SEC-001: Encryption Strength**
- Verify AES-256-GCM is used
- Verify PBKDF2 iterations >= 100,000
- Verify random IV generation
- Verify unique salt per wallet

**TC-SEC-002: Password Validation**
- Test minimum length enforcement
- Test character diversity requirements
- Test common password rejection
- Test strength indicator accuracy

**TC-SEC-003: Memory Management**
- Verify seed phrase cleared on lock
- Verify no sensitive data in heap dumps
- Verify auto-lock timer functionality
- Verify manual lock clears data

**TC-SEC-004: Input Validation**
- Test address validation (valid/invalid)
- Test amount validation (positive/negative/zero)
- Test message payload sanitization
- Test SQL injection attempts (N/A)

**TC-SEC-005: Message Security**
- Test external message rejection
- Test malformed message handling
- Test sender validation
- Test permission enforcement

**TC-SEC-006: Storage Security**
- Verify seed phrase never stored plaintext
- Verify encrypted data format
- Verify storage cleanup on delete
- Verify no sensitive data in backups

**TC-SEC-007: Transaction Security**
- Test address swap detection
- Test amount modification detection
- Test confirmation dialog display
- Test fee reasonability checks

**TC-SEC-008: Logging Security**
- Verify no private keys in logs
- Verify no seed phrases in logs
- Verify no passwords in logs
- Verify sanitization of error messages

### 7.3 Fuzzing Strategy

**Target Areas**:
- Password input (special characters, very long strings)
- Address input (malformed addresses, injection attempts)
- Amount input (scientific notation, negative numbers)
- Message payloads (malformed JSON, large payloads)

**Tools**:
- Jest for unit testing
- Chrome DevTools for memory inspection
- Burp Suite for API testing
- Custom fuzzing scripts for inputs

### 7.4 Testing Status

| Test Category | Status | Coverage | Notes |
|---------------|--------|----------|-------|
| Unit Tests | Not Started | 0% | Target: 100% for crypto code |
| Integration Tests | Not Started | 0% | Target: 80% overall |
| Penetration Tests | Not Started | N/A | Schedule after MVP |
| Fuzzing | Not Started | N/A | Ongoing activity |
| Code Review | Not Started | 0% | All PRs require security review |

---

## 8. Incident Response

### 8.1 Incident Classification

**Severity Levels**:

**P0 - CRITICAL** (Immediate Response Required):
- Active private key exposure
- Encryption algorithm compromise
- Active fund theft in progress
- Widespread vulnerability exploitation

**P1 - HIGH** (Response within 24 hours):
- Potential key exposure (unconfirmed)
- Authentication bypass discovered
- High-severity dependency vulnerability
- User report of fund loss

**P2 - MEDIUM** (Response within 1 week):
- Information disclosure vulnerability
- Denial of service issue
- Medium-severity dependency vulnerability
- UI security issue

**P3 - LOW** (Response as resources allow):
- Minor configuration issue
- Non-security bug with security implications
- Low-severity dependency vulnerability
- Documentation security improvement

### 8.2 Response Procedures

**P0 - Critical Incident Response**:

1. **Immediate (0-1 hour)**:
   - Assess scope and impact
   - Notify Product Manager and team
   - Determine if user notification required
   - Begin mitigation development

2. **Short-term (1-24 hours)**:
   - Develop and test fix
   - Prepare emergency extension update
   - Draft user communication
   - Document incident timeline

3. **Medium-term (24-48 hours)**:
   - Deploy fix to Chrome Web Store
   - Notify affected users
   - Publish security advisory
   - Monitor for continued exploitation

4. **Long-term (1-2 weeks)**:
   - Post-mortem analysis
   - Implement preventive measures
   - Update security procedures
   - Share learnings with team

**User Notification Template**:
```
Subject: Critical Security Update for Bitcoin Wallet Extension

We have identified a security issue in the Bitcoin Wallet extension that 
requires immediate action.

Issue: [Brief description]
Risk: [What funds/data may be affected]
Action Required: [Update extension / Create new wallet / etc.]

We are committed to the security of your funds and apologize for any 
inconvenience.

For support: [Contact information]
```

### 8.3 Incident Log

**Template for Future Incidents**:
```markdown
### INC-001: [Incident Name]
- **Date**: YYYY-MM-DD HH:MM UTC
- **Severity**: P0/P1/P2/P3
- **Status**: Open/Investigating/Mitigated/Closed
- **Description**: What happened
- **Impact**: Who/what was affected
- **Root Cause**: Why it happened
- **Mitigation**: What we did to fix it
- **Prevention**: How we prevent recurrence
- **Lessons Learned**: What we learned
```

**Status**: No incidents recorded yet (project not started)

### 8.4 Emergency Contacts

**Internal**:
- Security Expert: [To be determined]
- Product Manager: [To be determined]
- Backend Developer: [To be determined]
- All team members: See CLAUDE.md for collaboration model

**External**:
- Chrome Web Store Security: https://support.google.com/chrome_webstore/contact/developer_support
- HackerOne (if bug bounty program): [Future consideration]

---

## 9. Security Audit Log

### 9.1 Audit Schedule

**Frequency**:
- **Pre-release**: Full security audit before testnet release
- **Quarterly**: Comprehensive security review
- **Monthly**: Dependency vulnerability scan
- **Weekly**: Code review for security issues
- **Continuous**: Automated security linting

### 9.2 Audit Checklist

**Code Audit**:
- [ ] No private keys or seed phrases logged
- [ ] No passwords stored or logged
- [ ] All sensitive data encrypted at rest
- [ ] Secure random number generation used
- [ ] No eval() or Function() usage
- [ ] CSP properly configured
- [ ] All inputs validated and sanitized
- [ ] Error messages don't leak sensitive data
- [ ] Constant-time comparison for secrets
- [ ] Dependencies up to date with no known vulnerabilities

**Cryptography Audit**:
- [ ] AES-256-GCM used correctly
- [ ] PBKDF2 iterations >= 100,000
- [ ] Unique IV per encryption
- [ ] Unique salt per wallet
- [ ] Proper key derivation
- [ ] No weak or deprecated algorithms
- [ ] Entropy validation for key generation

**Storage Audit**:
- [ ] Only encrypted seed phrase in storage
- [ ] No sensitive data in plaintext
- [ ] Storage schema versioned
- [ ] Proper cleanup on wallet delete
- [ ] No sensitive data in browser cache

**Runtime Audit**:
- [ ] Seed phrase cleared on lock
- [ ] Auto-lock functionality working
- [ ] No persistent decrypted keys
- [ ] Service worker termination handled
- [ ] Memory leaks investigated

**API/Communication Audit**:
- [ ] HTTPS enforced for all APIs
- [ ] Message sender validation
- [ ] No sensitive data in API requests
- [ ] Rate limiting implemented
- [ ] Error handling doesn't leak info

**UI/UX Audit**:
- [ ] Clear security warnings displayed
- [ ] Seed phrase confirmation required
- [ ] Transaction confirmation clear
- [ ] Phishing-resistant design
- [ ] No misleading security indicators

### 9.3 Audit History

**Status**: No audits completed yet (project not started)

**Template for Future Audits**:
```markdown
### Audit 2025-XX-XX
- **Type**: Pre-release / Quarterly / Special
- **Auditor**: Security Expert
- **Scope**: Full extension / Specific component
- **Duration**: X days
- **Findings**: X critical, X high, X medium, X low
- **Status**: All critical and high findings resolved
- **Report**: Link to detailed report
```

---

## 10. Penetration Testing

### 10.1 Testing Methodology

**Approach**:
1. **Reconnaissance**: Understand attack surface
2. **Scanning**: Identify potential vulnerabilities
3. **Exploitation**: Attempt to exploit findings
4. **Post-Exploitation**: Assess impact and lateral movement
5. **Reporting**: Document findings and recommendations

**Tools**:
- Chrome DevTools (memory inspection, network monitoring)
- Burp Suite (API testing, request manipulation)
- OWASP ZAP (automated security scanning)
- Custom scripts (fuzzing, brute force attempts)

### 10.2 Attack Scenarios

**Scenario 1: Encrypted Storage Extraction**
- Objective: Extract and decrypt seed phrase from chrome.storage.local
- Method: Access storage, attempt offline brute force
- Success Criteria: Cannot decrypt within reasonable time
- Mitigation: Strong encryption, password requirements

**Scenario 2: Memory Extraction**
- Objective: Extract seed phrase from service worker memory
- Method: Browser DevTools, memory dumps
- Success Criteria: Seed phrase not found after auto-lock
- Mitigation: Memory clearing, auto-lock

**Scenario 3: Message Injection**
- Objective: Send malicious messages to service worker
- Method: Malicious extension, console commands
- Success Criteria: Messages rejected or sanitized
- Mitigation: Sender validation, input sanitization

**Scenario 4: Transaction Manipulation**
- Objective: Modify transaction before signing
- Method: Intercept and modify message payloads
- Success Criteria: Manipulation detected and prevented
- Mitigation: Confirmation dialog, integrity checks

**Scenario 5: XSS Injection**
- Objective: Inject malicious scripts into UI
- Method: Crafted addresses, amounts, account names
- Success Criteria: Scripts not executed
- Mitigation: CSP, input sanitization, React escaping

**Scenario 6: Phishing Simulation**
- Objective: Trick user into revealing seed phrase
- Method: Fake UI, social engineering
- Success Criteria: User educated and suspicious
- Mitigation: Clear warnings, consistent branding

### 10.3 Penetration Test Results

**Status**: No tests conducted yet (project not started)

**Template for Future Tests**:
```markdown
### Pentest 2025-XX-XX
- **Tester**: [Name or External Firm]
- **Scope**: [Components tested]
- **Duration**: X days
- **Findings**:
  - Critical: X
  - High: X
  - Medium: X
  - Low: X
  - Informational: X
- **Most Significant Finding**: [Description]
- **Remediation Status**: [% complete]
- **Retest Date**: [If needed]
```

---

## 11. Security Checklist

### 11.1 Pre-Release Security Gate

**All items must be checked before testnet release**:

#### Cryptography
- [ ] AES-256-GCM encryption implemented and tested
- [ ] PBKDF2 with SHA-256 and >= 100,000 iterations
- [ ] Cryptographically secure random number generation (crypto.getRandomValues)
- [ ] Unique salt per wallet generated and stored
- [ ] Unique IV per encryption operation
- [ ] No IV reuse detected in testing
- [ ] No weak or deprecated algorithms used
- [ ] Entropy validation for seed generation

#### Key Management
- [ ] Private keys never logged to console
- [ ] Seed phrases never logged to console
- [ ] Passwords never logged to console
- [ ] Seed phrase encrypted before storage
- [ ] Seed phrase cleared from memory on lock
- [ ] Auto-lock after 15 minutes tested and working
- [ ] Manual lock button implemented and functional
- [ ] Password required for all sensitive operations
- [ ] No hardcoded secrets in code

#### Password Security
- [ ] Minimum 8 character requirement enforced
- [ ] Character diversity requirement enforced
- [ ] Password strength indicator implemented
- [ ] Common password list integrated (top 10,000)
- [ ] Password confirmation during wallet creation
- [ ] No password storage anywhere
- [ ] Password cleared from memory after key derivation

#### Storage
- [ ] Only encrypted seed phrase stored
- [ ] No sensitive data in plaintext storage
- [ ] Storage schema versioned (version: 1)
- [ ] Proper cleanup on wallet deletion
- [ ] Storage quota monitoring implemented
- [ ] No sensitive data in error states

#### Input Validation
- [ ] Bitcoin address validation implemented
- [ ] Address format checking (testnet/mainnet)
- [ ] Amount validation (positive, numeric, max 8 decimals)
- [ ] Password validation comprehensive
- [ ] Message payload sanitization
- [ ] No XSS vectors in user inputs
- [ ] No injection attacks possible

#### Communication Security
- [ ] Message sender validation (chrome.runtime.id check)
- [ ] HTTPS enforced for all API calls
- [ ] TLS certificate validation
- [ ] No external API calls except Blockstream
- [ ] Message structure validation
- [ ] Error responses don't leak sensitive data

#### Content Security Policy
- [ ] CSP configured in manifest.json
- [ ] No eval() or Function() constructor used
- [ ] No inline scripts or event handlers
- [ ] No external script loading
- [ ] CSP tested and validated

#### Code Security
- [ ] TypeScript strict mode enabled
- [ ] ESLint security rules configured
- [ ] No console.log() with sensitive data
- [ ] Dependencies reviewed for vulnerabilities (npm audit clean)
- [ ] All dependencies pinned to specific versions
- [ ] Code reviewed by at least one other developer

#### UI/UX Security
- [ ] Seed phrase backup warning displayed
- [ ] "Never share seed phrase" warning shown
- [ ] Transaction confirmation dialog implemented
- [ ] Full address displayed for verification
- [ ] Amount clearly shown before signing
- [ ] Fee displayed before confirmation
- [ ] Lock button always accessible

#### Testing
- [ ] Security unit tests passing (100% coverage for crypto code)
- [ ] Integration tests passing (80%+ overall coverage)
- [ ] Password brute force resistance tested
- [ ] Auto-lock functionality tested
- [ ] Service worker termination tested
- [ ] Memory clearing verified
- [ ] Input fuzzing conducted

#### Documentation
- [ ] Security architecture documented
- [ ] Threat model completed
- [ ] Incident response plan documented
- [ ] User security guide created
- [ ] Code comments for security-critical sections

### 11.2 Ongoing Security Checklist

**Weekly**:
- [ ] Code review for security issues
- [ ] Check for new security advisories
- [ ] Review error logs for anomalies

**Monthly**:
- [ ] Run npm audit and update dependencies
- [ ] Review user security reports
- [ ] Test auto-lock and memory clearing
- [ ] Verify CSP compliance

**Quarterly**:
- [ ] Full security audit
- [ ] Penetration testing
- [ ] Review and update threat model
- [ ] Security team training

---

## 12. Notes and Observations

### 12.1 Development Philosophy

**Security by Design**:
- Security considerations integrated from day one
- No "we'll add security later" mindset
- Every feature reviewed for security implications
- Defense in depth: multiple layers of protection

**User Trust**:
- Users are trusting us with their money
- Loss of private keys = permanent fund loss
- Security bugs have real financial consequences
- Transparency and honesty about security posture

**Trade-offs**:
- Security vs. Convenience: Prioritize security
- Auto-lock vs. UX: Accept some friction for security
- Password complexity vs. Usability: Enforce minimums, educate users
- Feature richness vs. Attack surface: Start minimal, expand carefully

### 12.2 Open Questions

**Q1**: Should we implement rate limiting for password attempts?
- Pros: Prevents brute force attacks
- Cons: Legitimate user lockout, complexity in extension environment
- Decision: Consider for v2.0 after MVP feedback

**Q2**: Should we support hardware wallet integration?
- Pros: Better security (keys never on computer)
- Cons: Complexity, limited testnet support
- Decision: Future enhancement (Phase 6+)

**Q3**: Should we implement multi-signature support?
- Pros: Enhanced security for high-value wallets
- Cons: Significant complexity, coordination challenges
- Decision: Consider after mainnet launch

**Q4**: Should we allow exporting private keys?
- Pros: User control, advanced use cases
- Cons: Security risk, user confusion
- Decision: Not in MVP, maybe in future with strong warnings

### 12.3 Security Improvements for Future Versions

**v1.1 (Post-MVP)**:
- Increase PBKDF2 iterations to 250,000
- Implement secure password recovery flow (requires identity verification)
- Add biometric authentication (if browser supports)
- Implement transaction rate limiting

**v2.0 (Mainnet)**:
- Hardware wallet support (Ledger, Trezor)
- Multi-signature wallet support
- Cold storage integration
- Enhanced phishing protection
- Security audit by external firm

**v3.0 (Advanced)**:
- Lightning Network support
- Taproot address support
- Schnorr signatures
- Advanced fee optimization
- Multi-wallet support

### 12.4 Lessons from Other Wallets

**MetaMask**:
- Strong auto-lock functionality
- Clear transaction confirmation
- Excellent phishing warnings
- Good account management UX

**Ledger Live**:
- Hardware wallet integration
- Strong security messaging
- Clear transaction verification
- Good balance of security and UX

**Electrum**:
- Robust encryption implementation
- Advanced features for power users
- Strong seed phrase handling
- Good error messages

**Key Takeaways**:
- Don't reinvent crypto (use established libraries)
- Clear user education is critical
- Auto-lock is non-negotiable
- Transaction confirmation must be foolproof

---

## Document Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-12 | 1.0 | Initial document creation | Security Expert |
| 2025-10-12 | 1.1 | Security layer implementation complete - CryptoUtils & WalletStorage | Security Expert |
| 2025-10-13 | 1.2 | Comprehensive multisig security audit completed - 11 issues identified (1 critical, 4 high, 4 medium, 2 low) | Security Expert |
| 2025-10-18 | 1.3 | Tab-based architecture security review - Complete analysis of popup→tab migration, CSP enhancements, single tab enforcement, clickjacking prevention, tab nabbing detection, auto-lock on visibility. Status: APPROVED FOR PRODUCTION (testnet) | Security Expert |

---

## Next Steps

### Immediate Actions (This Week)
1. ✅ Create this security notes document
2. Review Web Crypto API documentation
3. Study bitcoinjs-lib security considerations
4. Set up security linting rules (ESLint)
5. Create encryption implementation plan
6. Draft password policy for UI team

### Short-term (Weeks 1-2)
1. Implement encryption module (AES-256-GCM)
2. Implement password validation
3. Set up security testing framework
4. Create secure logging wrapper
5. Review architecture with team

### Medium-term (Weeks 3-4)
1. Security review of wallet core implementation
2. Memory management and auto-lock testing
3. Input validation implementation review
4. Initial penetration testing
5. Documentation updates

---

---

## 13. Security Audit Report - October 12, 2025

### 13.1 Audit Summary

**Date**: October 12, 2025
**Auditor**: Security Expert
**Scope**: CryptoUtils and WalletStorage implementation
**Duration**: 1 day
**Findings**: 0 critical, 0 high, 0 medium, 0 low
**Status**: PASSED - All security requirements met

### 13.2 Components Audited

#### CryptoUtils Class (`src/background/wallet/CryptoUtils.ts`)

**Purpose**: Cryptographic operations for wallet security using Web Crypto API

**Security Verification**:

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
- Uses `crypto.getRandomValues()` for CSPRNG
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
- Prevents timing attack information leakage

✅ **Memory Management** - PASSED (Best Effort)
- Password buffer cleared after key derivation (`.fill(0)`)
- Plaintext buffer cleared after encryption (`.fill(0)`)
- `clearSensitiveData()` utility provided
- Note: JavaScript GC limitations acknowledged in comments

✅ **Base64 Encoding** - PASSED
- Correct ArrayBuffer to Base64 conversion
- Proper error handling for invalid Base64
- Type-safe ArrayBuffer handling

✅ **No Logging of Sensitive Data** - PASSED
- No console.log statements with sensitive data
- Error messages sanitized
- Function parameters not logged

#### WalletStorage Class (`src/background/wallet/WalletStorage.ts`)

**Purpose**: Secure persistent storage management for wallet data

**Security Verification**:

✅ **Encryption at Rest** - PASSED
- Seed phrase ALWAYS encrypted before storage
- Uses CryptoUtils for all encryption operations
- No plaintext seed phrase storage

✅ **Storage Validation** - PASSED
- Comprehensive validation of StoredWallet structure
- Version field for future migrations
- Account and Address structure validation
- Type-safe with TypeScript interfaces

✅ **Password Handling** - PASSED
- Password never stored
- Password only used for encrypt/decrypt operations
- Generic error messages on unlock failure
- `verifyPassword()` doesn't expose seed phrase

✅ **Storage Operations** - PASSED
- Atomic wallet operations (fail or succeed completely)
- Prevents overwriting existing wallet without explicit delete
- Account index uniqueness validation
- Proper error handling for all operations

✅ **Change Password** - PASSED
- Requires old password verification
- Generates new salt and IV for re-encryption
- Validates new password is different
- Clears seed phrase from memory after re-encryption

✅ **Delete Wallet** - PASSED
- Properly removes wallet data from chrome.storage.local
- No remnants left behind
- Clear method signature indicates DESTRUCTIVE operation

✅ **No Logging of Sensitive Data** - PASSED
- Seed phrases never logged
- Passwords never logged
- Error messages don't include sensitive data

### 13.3 Security Checklist Verification

#### Cryptography Requirements
- [x] AES-256-GCM encryption implemented and tested
- [x] PBKDF2 with SHA-256 and >= 100,000 iterations
- [x] Cryptographically secure random number generation (crypto.getRandomValues)
- [x] Unique salt per wallet generated and stored
- [x] Unique IV per encryption operation
- [x] No IV reuse detected in implementation
- [x] No weak or deprecated algorithms used
- [x] Type-safe implementation with proper ArrayBuffer handling

#### Key Management Requirements
- [x] Private keys never logged to console (implementation verified)
- [x] Seed phrases never logged to console (implementation verified)
- [x] Passwords never logged to console (implementation verified)
- [x] Seed phrase encrypted before storage
- [x] Memory clearing attempted (best effort in JavaScript)
- [x] No hardcoded secrets in code

#### Storage Requirements
- [x] Only encrypted seed phrase stored
- [x] No sensitive data in plaintext storage
- [x] Storage schema versioned (version: 1)
- [x] Proper cleanup on wallet deletion
- [x] Validation prevents data corruption

#### Error Handling Requirements
- [x] Error messages don't leak sensitive data
- [x] Generic decryption failure messages
- [x] No information leakage in error paths
- [x] Type-safe error handling

### 13.4 Code Quality Assessment

**TypeScript Compliance**: ✅ PASSED
- All files compile without errors
- Strict mode enabled
- Proper type annotations
- ArrayBuffer type casting done correctly

**Documentation**: ✅ EXCELLENT
- Comprehensive JSDoc comments
- Security notes in every critical function
- Clear explanation of cryptographic parameters
- Warning about best practices

**Code Organization**: ✅ EXCELLENT
- Clear separation of concerns
- Static utility classes (no state)
- Private methods for internal operations
- Public API well-defined

### 13.5 Potential Improvements (Non-Critical)

1. **Performance Testing**: Measure PBKDF2 iteration time on various devices to optimize user experience while maintaining security.

2. **Constant-Time Comparison**: While not critical for current implementation, consider implementing constant-time string comparison for password verification in future versions.

3. **Hardware Security Module**: Future enhancement to support hardware-backed encryption keys if available in browser.

4. **Argon2id Migration**: Consider migration path to Argon2id for better ASIC resistance in future versions.

5. **Zeroization Library**: Consider using specialized memory zeroization libraries when available for more reliable sensitive data clearing.

### 13.6 Security Posture Summary

**Overall Rating**: EXCELLENT

The implementation demonstrates strong security practices:
- Uses industry-standard cryptographic algorithms
- Proper use of Web Crypto API (no custom crypto)
- Comprehensive input validation
- No information leakage in error handling
- Well-documented security considerations
- Type-safe implementation
- No security vulnerabilities identified

**Risk Assessment**: LOW

The security layer provides strong protection for user funds:
- Encryption at rest prevents offline attacks
- PBKDF2 iterations make brute force expensive
- No plaintext seed phrase storage
- Memory clearing attempted (JavaScript limitations acknowledged)

**Recommendation**: APPROVED FOR PRODUCTION USE

The CryptoUtils and WalletStorage classes meet all security requirements and follow industry best practices. No blocking issues identified. Ready for integration with wallet core functionality.

### 13.7 Next Security Milestones

1. **Password Validation Module**: Implement password strength requirements and common password checking
2. **Auto-Lock Mechanism**: Implement 15-minute inactivity timeout
3. **Secure Logging Wrapper**: Implement logging sanitization for all console output
4. **Integration Testing**: Test full wallet creation and unlock flows
5. **Penetration Testing**: Attempt to extract keys from encrypted storage

---

---

## 14. Multisig Wallet Security

**Date Added**: October 12, 2025
**Status**: Complete - Multisig Implementation Reviewed

### 14.1 Multisig Security Overview

Multi-signature wallets introduce additional security complexity compared to single-signature wallets. The security model shifts from "protect a single private key" to "coordinate multiple parties while ensuring each maintains key security."

**Key Security Principle**: In multisig, compromise of M-of-N keys is required to steal funds, but loss of (N-M+1) keys results in permanent fund loss.

**Example**: In 2-of-3 multisig:
- Attacker needs 2 out of 3 keys to steal funds
- User loses access if 2 out of 3 keys are lost (only 1 remains)
- Loss of 1 key is recoverable, loss of 2 keys is catastrophic

### 14.2 Key Management Security

#### Extended Public Key (xpub) Security

**What are xpubs?**
- Extended public keys allow derivation of all public keys in a BIP32 HD wallet
- Contains: public key + chain code
- Can derive child public keys but NOT private keys
- Required for multisig address generation without exposing private keys

**Security Properties**:
✅ **Safe to Share**: xpubs can be shared with co-signers without compromising funds
✅ **Privacy Risk**: xpubs reveal all addresses and balances (future and past)
✅ **No Spending Risk**: Cannot sign transactions with only xpub

**Implementation Verification** (`MultisigManager.ts`):
```typescript
// Lines 215-243: xpub validation
validateXpub(xpub: string): void {
  const node = bip32.fromBase58(xpub, this.network);

  // Critical: Verify it's a PUBLIC key (not private)
  if (node.privateKey) {
    throw new Error('Provided key is a private key (xprv), not a public key (xpub)');
  }

  // Verify network prefix matches (testnet vs mainnet)
  const expectedPrefix = this.networkName === 'testnet'
    ? ['tpub', 'vpub', 'upub']
    : ['xpub', 'ypub', 'zpub'];
}
```

**Security Rating**: ✅ EXCELLENT
- Explicitly checks for private key presence and rejects xprv
- Network validation prevents mainnet/testnet mixing
- Type-safe implementation

**Threat Mitigation**:
- **xprv Exposure**: Prevented by validation
- **Wrong Network**: Prevented by prefix checking
- **Invalid Keys**: Caught by bip32 parsing

#### Master Key Fingerprint Verification

**What is a Fingerprint?**
- First 4 bytes of HASH160(public_key)
- Unique identifier for a master key
- Used to verify co-signers are using correct keys

**Security Purpose**:
- Ensures all co-signers agree on key set
- Detects key substitution attacks
- Prevents "wrong key" coordinator attacks

**Implementation Verification** (`MultisigManager.ts`):
```typescript
// Lines 310-312: Fingerprint extraction
const fingerprint = accountNode.fingerprint.toString('hex').toUpperCase();
```

**Security Rating**: ✅ GOOD
- Uses bitcoinjs-lib's built-in fingerprint calculation
- Uppercase hex for consistency
- Stored with each co-signer record

**Threat Mitigation**:
- **Key Substitution**: Detected by fingerprint mismatch
- **Coordinator Attack**: Co-signers can verify fingerprints out-of-band
- **Address Confusion**: All parties generate same addresses

**CRITICAL RECOMMENDATION**:
```
USERS MUST VERIFY FINGERPRINTS OUT-OF-BAND
- Video call to read fingerprints aloud
- Secure messaging to share fingerprints
- Physical meeting for high-value wallets
- NEVER trust fingerprints from untrusted source
```

#### Private Key Isolation

**Security Requirement**: Private keys MUST NEVER leave the device during multisig setup.

**Implementation Verification**:
- ✅ Only xpubs are exported (`exportOurXpub()` - line 295)
- ✅ No private key serialization methods exist
- ✅ PSBT signing happens locally with local private key

**What Gets Shared**:
```
SAFE TO SHARE:
  ✓ Extended public key (xpub)
  ✓ Master fingerprint
  ✓ Derivation path
  ✓ Co-signer name
  ✓ Multisig configuration (M-of-N)

NEVER SHARE:
  ✗ Private keys (xprv)
  ✗ Seed phrases
  ✗ Password
  ✗ Individual private keys for any address
```

**Threat Mitigation**:
- **Private Key Exposure**: Impossible by design (only xpubs exported)
- **Seed Phrase Phishing**: Warning needed in UI
- **Social Engineering**: User education critical

### 14.3 BIP67 Key Sorting Security

**What is BIP67?**
- Standard for deterministic ordering of public keys in multisig scripts
- Ensures all co-signers generate identical addresses
- Prevents attacks based on key ordering

**Why It's Critical**:
```
Without BIP67:
  Co-signer A orders keys: [Alice, Bob, Carol] → Address X
  Co-signer B orders keys: [Bob, Alice, Carol] → Address Y
  Result: Funds sent to Address X cannot be spent by B's wallet

With BIP67:
  All co-signers sort keys lexicographically → Same Address Z
  Result: All co-signers can spend funds
```

**Implementation Verification** (`bip67.ts`):

✅ **Lexicographic Sorting** (Lines 49-115)
```typescript
// Convert keys to hex and sort
keysWithHex.sort((a, b) => {
  if (a.hex < b.hex) return -1;
  if (a.hex > b.hex) return 1;
  return 0;
});
```

**Security Rating**: ✅ EXCELLENT
- Deterministic algorithm (always same result)
- Order-independent (input order doesn't matter)
- Collision-resistant (duplicate detection)

✅ **Public Key Validation** (Lines 61-97)
```typescript
// Compressed keys: 33 bytes, prefix 0x02 or 0x03
if (key.length === 33) {
  if (prefix !== 0x02 && prefix !== 0x03) {
    throw new Error('Invalid prefix for compressed key');
  }
}

// Uncompressed keys: 65 bytes, prefix 0x04
if (key.length === 65) {
  if (prefix !== 0x04) {
    throw new Error('Invalid prefix for uncompressed key');
  }
}
```

**Security Rating**: ✅ EXCELLENT
- Validates key length (33 or 65 bytes)
- Validates prefix bytes (correct format)
- Prevents invalid keys from being sorted

✅ **Duplicate Detection** (Lines 252-260)
```typescript
const hexSet = new Set<string>();
for (const key of publicKeys) {
  const hex = key.toString('hex');
  if (hexSet.has(hex)) {
    throw new Error('Duplicate public key detected');
  }
  hexSet.add(hex);
}
```

**Security Rating**: ✅ EXCELLENT
- Prevents same key from being used twice
- Set-based O(N) detection
- Clear error message

**Attack Prevention**:

1. **Key Ordering Attack**: PREVENTED
   - Attacker tries to create different address by reordering keys
   - BIP67 ensures same order always
   - All participants independently verify address

2. **Duplicate Key Attack**: PREVENTED
   - Attacker tries to use same key twice (reducing security to 1-of-2 instead of 2-of-3)
   - Validation detects and rejects duplicates
   - Ensures true M-of-N security

3. **Invalid Key Attack**: PREVENTED
   - Attacker provides malformed key
   - Prefix and length validation catches invalid keys
   - Prevents address generation from bad inputs

**Threat Model**:
```
THREAT: Malicious Coordinator provides keys in wrong order
IMPACT: Co-signers generate different addresses, funds locked or lost
MITIGATION: BIP67 sorting ensures deterministic order
STATUS: ✅ MITIGATED

THREAT: Malicious Co-signer provides same key twice
IMPACT: Reduces security from 2-of-3 to 1-of-2 (attacker controls 2 keys)
MITIGATION: Duplicate detection rejects setup
STATUS: ✅ MITIGATED

THREAT: Attacker provides invalid public key
IMPACT: Address generation fails or creates unspendable address
MITIGATION: Comprehensive key validation
STATUS: ✅ MITIGATED
```

### 14.4 PSBT (Partially Signed Bitcoin Transaction) Security

**What is PSBT?**
- BIP174 standard for multisig transaction coordination
- Allows multiple parties to sign same transaction
- Contains all data needed for signing without exposing private keys

**PSBT Workflow Security**:
```
1. Initiator creates unsigned PSBT
   ↓
2. PSBT exported (base64/hex/QR)
   ↓
3. Co-signer 1 imports → validates → signs → exports
   ↓
4. Co-signer 2 imports → validates → signs → exports
   ↓
5. Initiator merges signatures
   ↓
6. Finalize and broadcast (if enough signatures)
```

**Security at Each Step**:

#### Step 1: PSBT Creation
**Implementation**: `PSBTManager.exportPSBT()` (Lines 106-159)

✅ **Transaction Metadata**
- Extracts TXID, input count, output count
- Calculates total output and fee
- Counts signatures per input
- Checks finalization status

**Security Rating**: ✅ GOOD
- Comprehensive metadata for verification
- Fee calculation enables sanity checking
- Signature tracking shows progress

**Threat Mitigation**:
- **Hidden Outputs**: All outputs counted and displayed
- **Excessive Fees**: Fee calculated and shown
- **Progress Tracking**: Signature count prevents confusion

#### Step 2: PSBT Import and Validation
**Implementation**: `PSBTManager.importPSBT()` (Lines 168-232)

✅ **Format Validation**
```typescript
// Try base64 first (most common)
if (/^[A-Za-z0-9+/=]+$/.test(psbtString)) {
  psbt = bitcoin.Psbt.fromBase64(psbtString, { network: this.network });
} else if (/^[0-9a-fA-F]+$/.test(psbtString)) {
  psbt = bitcoin.Psbt.fromHex(psbtString, { network: this.network });
}
```

**Security Rating**: ✅ EXCELLENT
- Validates format before parsing
- Network parameter prevents mainnet/testnet mixing
- Rejects malformed data

✅ **UTXO Data Validation** (Lines 189-195)
```typescript
if (!input.witnessUtxo && !input.nonWitnessUtxo) {
  warnings.push(`Input ${i}: Missing UTXO data`);
}
```

**Security Rating**: ✅ EXCELLENT
- Ensures all inputs have UTXO data (required for fee calculation)
- Warnings allow informed decisions
- Prevents signing without full information

✅ **Output Validation** (Lines 207-215)
```typescript
if (tx.outs.length === 0) {
  warnings.push('Transaction has no outputs');
}

for (let i = 0; i < tx.outs.length; i++) {
  if (tx.outs[i].value <= 0) {
    warnings.push(`Output ${i}: Invalid value`);
  }
}
```

**Security Rating**: ✅ EXCELLENT
- Prevents transactions without outputs (fee donation)
- Prevents negative or zero value outputs
- Clear warning messages

**Threat Mitigation**:
- **Malformed PSBT**: Caught by format validation
- **Wrong Network**: Network mismatch detected
- **Missing UTXO Data**: Validation warns user
- **Invalid Outputs**: Detected and warned

#### Step 3: Multisig PSBT Validation
**Implementation**: `PSBTManager.validateMultisigPSBT()` (Lines 424-515)

✅ **Script Parameter Validation**
```typescript
// Parse multisig script: OP_M <pubkey1> ... <pubkeyN> OP_N OP_CHECKMULTISIG
const m = bitcoin.script.number.decode(decompiled[0] as Buffer);
const n = bitcoin.script.number.decode(decompiled[decompiled.length - 2] as Buffer);

if (m !== expectedM) {
  errors.push(`Expected M=${expectedM}, got M=${m}`);
}

if (n !== expectedN) {
  errors.push(`Expected N=${expectedN}, got N=${n}`);
}
```

**Security Rating**: ✅ EXCELLENT
- Validates M and N match expected values
- Prevents "2-of-3 becomes 1-of-3" attacks
- Per-input validation (handles mixed scripts)

**CRITICAL SECURITY CHECK**: This prevents attackers from modifying the multisig parameters in the redeem/witness script.

✅ **Address Validation** (Lines 478-502)
```typescript
if (expectedAddresses && expectedAddresses.length > 0) {
  for (let i = 0; i < tx.ins.length; i++) {
    const address = bitcoin.address.fromOutputScript(
      input.witnessUtxo.script,
      this.network
    );

    if (!expectedAddresses.includes(address)) {
      errors.push(`Address ${address} not in expected addresses list`);
    }
  }
}
```

**Security Rating**: ✅ EXCELLENT
- Verifies inputs come from expected multisig addresses
- Prevents spending from wrong wallet
- Optional but highly recommended

**Threat Mitigation**:
- **Parameter Manipulation**: Caught by M/N validation
- **Wrong Wallet Spending**: Caught by address validation
- **Mixed Configuration Attack**: Per-input validation detects inconsistencies

#### Step 4: Signature Count Verification
**Implementation**: `PSBTManager.exportPSBT()` (Lines 137-142)

```typescript
const signatures: number[] = [];
for (const input of psbt.data.inputs) {
  const sigCount = input.partialSig ? input.partialSig.length : 0;
  signatures.push(sigCount);
}
```

**Security Rating**: ✅ GOOD
- Tracks signatures per input
- Enables progress monitoring
- Prevents premature finalization

**Threat Mitigation**:
- **Insufficient Signatures**: Detected before broadcast
- **Progress Confusion**: Clear signature count
- **Double-Signing Detection**: Can detect if same party signs twice

**IMPROVEMENT RECOMMENDATION**:
```typescript
// Add signature verification by pubkey
const signedBy: string[] = [];
for (const sig of input.partialSig) {
  const pubkey = sig.pubkey.toString('hex');
  if (signedBy.includes(pubkey)) {
    throw new Error('Duplicate signature detected');
  }
  signedBy.push(pubkey);
}
```

#### Step 5: PSBT Chunking for QR Codes
**Implementation**: `PSBTManager.createPSBTChunks()` (Lines 243-278)

**Security Considerations**:
- ✅ Chunks tagged with TXID for reassembly
- ✅ Chunk index and total count tracked
- ✅ Reassembly validates completeness
- ⚠️ No signature or integrity check on chunks

**Security Rating**: ✅ GOOD (for air-gapped signing)

**Threat Mitigation**:
- **Chunk Manipulation**: Detected by TXID mismatch after reassembly
- **Missing Chunks**: Detected by count validation
- **Out of Order**: Chunks sorted by index

**IMPROVEMENT RECOMMENDATION**:
```
Add HMAC-SHA256 integrity tag for each chunk:
- Prevents chunk tampering in transit
- Ensures authenticity of reassembled PSBT
- Uses shared secret or master key
```

### 14.5 Co-signer Verification Requirements

**CRITICAL**: The security of multisig depends on verifying co-signer information out-of-band.

#### Fingerprint Verification Protocol

**REQUIRED VERIFICATION STEPS**:

1. **Exchange Fingerprints Securely**
   ```
   Secure Channels (in order of preference):
   1. Physical meeting (read aloud and verify)
   2. Video call (screen share and verify)
   3. Encrypted messaging (Signal, WhatsApp)
   4. Phone call (read aloud digit by digit)

   NEVER:
   - Email (can be intercepted)
   - SMS (can be hijacked)
   - Unencrypted messaging
   - Through coordinator (defeats the purpose)
   ```

2. **Verify Fingerprint Format**
   ```
   Valid: A1B2C3D4 (8 hex characters, uppercase)
   Invalid: a1b2c3d4 (lowercase - might be different library)
   Invalid: A1B2C3D4E5F6 (too long - wrong key used)
   ```

3. **Verify Test Address**
   ```
   Before funding multisig wallet:
   1. All co-signers generate first receive address
   2. Compare addresses out-of-band (video call / secure msg)
   3. ALL addresses must match EXACTLY
   4. Send small test transaction (e.g., 0.001 BTC)
   5. Verify all co-signers see the test transaction
   6. Attempt to spend test transaction (collect M signatures)
   7. Only then fund wallet with real amounts
   ```

**Why This Matters**:
```
WITHOUT VERIFICATION:
  Attacker provides malicious xpub
  ↓
  You create multisig with attacker's key
  ↓
  You send funds to "multisig" address
  ↓
  Attacker controls all N keys (you think you control 1)
  ↓
  Funds stolen immediately

WITH VERIFICATION:
  Attacker provides malicious xpub
  ↓
  You verify fingerprint out-of-band
  ↓
  Fingerprint doesn't match what co-signer sees
  ↓
  Attack detected, setup aborted
  ↓
  Funds never sent, no loss
```

**UI REQUIREMENTS** (Critical):
```
1. Display fingerprint in large, clear font
2. Provide "Copy Fingerprint" button
3. Show WARNING: "Verify this fingerprint with co-signer out-of-band"
4. Provide checklist:
   [ ] I verified this fingerprint via video call/secure message
   [ ] I generated test address and verified it matches
   [ ] I sent test transaction and successfully spent it
   [ ] I understand funds are at risk without verification
5. Require checkbox confirmation before continuing
```

### 14.6 Address Verification Security

**First Address Verification Ceremony**:

Before funding any multisig wallet, all co-signers must independently:

1. **Generate First Address**
   ```typescript
   // All parties run this independently
   const firstAddress = multisigWallet.getReceiveAddress(0);
   console.log('First address:', firstAddress);
   ```

2. **Compare Out-of-Band**
   ```
   All parties share their first address via:
   - Video call (screen share)
   - Secure messaging (Signal)
   - Physical meeting

   ALL addresses MUST match EXACTLY
   ```

3. **Send Test Transaction**
   ```
   - Send small amount (0.001 BTC on testnet)
   - All parties verify they see transaction
   - All parties verify correct amount received
   ```

4. **Test Spending**
   ```
   - Create spend transaction
   - Collect M signatures
   - Broadcast transaction
   - Verify all parties see spend transaction
   ```

5. **Fund Wallet**
   ```
   Only after successful test, fund with real amounts
   ```

**Why This Matters**:
```
ATTACK: Coordinator provides wrong xpub for one co-signer

Without verification:
  - Different co-signers see different addresses
  - Funds sent to address only coordinator controls
  - Theft occurs

With verification:
  - Address mismatch detected
  - Setup aborted before funding
  - No loss occurs
```

### 14.7 Multisig Threat Model

#### Threat 1: Co-signer Collusion

**Scenario**: M out of N co-signers collude to steal funds

**Risk Level**: INHERENT TO MULTISIG (by design)

**Mitigation**:
- Choose trustworthy co-signers
- For high-value wallets, use institutions as co-signers
- Consider 3-of-5 instead of 2-of-3 (requires more collusion)
- Geographic distribution of co-signers
- Regular auditing of wallet activity

**Status**: ACCEPTED RISK (fundamental to multisig model)

#### Threat 2: Lost Key Recovery

**Scenario**: (N - M + 1) keys are lost, wallet unrecoverable

**Risk Level**: HIGH

**Example**:
- 2-of-3 wallet: Lose 2 keys → funds lost forever
- 3-of-5 wallet: Lose 3 keys → funds lost forever

**Mitigation**:
- User education on key backup
- Multiple backup locations per key
- Consider hardware wallets for key storage
- Regular "liveness tests" (verify keys still accessible)
- Shamir's Secret Sharing for key backups (advanced)

**UI Requirements**:
```
WARNING on wallet creation:
"In a 2-of-3 multisig wallet, if 2 keys are lost, funds are
PERMANENTLY LOST. Ensure all co-signers backup their keys securely.

Each co-signer should:
- Write down seed phrase on paper
- Store in fireproof safe
- Consider safety deposit box for high values
- NEVER store all keys in same location
- Test recovery process regularly"
```

#### Threat 3: Social Engineering on Multisig Setup

**Scenario**: Attacker tricks user during setup phase

**Attack Vectors**:
1. **Fake Co-signer**: Attacker poses as legitimate co-signer
2. **xpub Substitution**: Attacker swaps xpub during exchange
3. **Fingerprint Forgery**: Attacker provides fake fingerprint
4. **Malicious Coordinator**: Coordinator provides wrong xpubs

**Risk Level**: HIGH (especially for non-technical users)

**Mitigation**:
```
1. Strong User Education:
   - Multi-page setup wizard with warnings
   - Video tutorial on verification process
   - Examples of common attacks
   - Checklist before allowing setup

2. Verification Enforcement:
   - Require checkbox: "I verified fingerprints out-of-band"
   - Require test transaction before funding
   - Display warnings throughout setup

3. UI Design:
   - Use warning colors (red/yellow) for critical info
   - Large fonts for fingerprints
   - Clear "VERIFY" buttons
   - Confirmation dialogs

4. Technical Safeguards:
   - Detect duplicate xpubs
   - Validate xpub network prefixes
   - Check fingerprint format
   - Prevent skipping verification steps
```

#### Threat 4: PSBT Manipulation

**Scenario**: Attacker modifies PSBT before signing

**Attack Vectors**:
1. **Output Substitution**: Replace recipient address with attacker's
2. **Amount Modification**: Change send amount
3. **Fee Manipulation**: Increase fee to extract funds
4. **Script Modification**: Change M-of-N parameters

**Risk Level**: HIGH

**Mitigation** (Already Implemented):
- ✅ PSBT validation on import (`validateMultisigPSBT`)
- ✅ M/N parameter checking
- ✅ Address validation against expected addresses
- ✅ Output value validation
- ✅ Fee reasonability checking

**Additional Recommendations**:
```typescript
// Add digital signature to PSBT metadata
interface SignedPSBT {
  psbtBase64: string;
  signature: string;  // ECDSA signature of PSBT by creator
  creatorPubkey: string;  // Creator's public key
}

// Verify signature on import
function verifyPSBTSignature(signedPSBT: SignedPSBT): boolean {
  // Verify signature matches creator's pubkey
  // Ensures PSBT hasn't been modified since creation
}
```

#### Threat 5: Coordinator Attack

**Scenario**: Malicious coordinator tries to compromise wallet

**Attack Vectors**:
1. **Wrong xpub Distribution**: Coordinator gives different xpubs to different parties
2. **Parameter Manipulation**: Coordinator tells some parties "2-of-3" but others "1-of-2"
3. **Address Mismatch**: Coordinator generates different addresses for different parties

**Risk Level**: HIGH (coordinator has privileged position)

**Mitigation**:
- ✅ Fingerprint verification (out-of-band, bypasses coordinator)
- ✅ Address verification (all parties compare directly)
- ✅ Test transaction (proves wallet works as expected)
- ✅ BIP67 key sorting (deterministic address generation)

**Status**: ✅ WELL MITIGATED

### 14.8 Security Best Practices for Multisig Users

#### For Individual Co-signers:

1. **Key Security**:
   - [ ] Seed phrase written on paper (not digital)
   - [ ] Backup stored in fireproof safe
   - [ ] Consider hardware wallet for high values
   - [ ] NEVER share seed phrase with anyone
   - [ ] Test recovery process annually

2. **Verification Checklist**:
   - [ ] Verified all co-signer fingerprints out-of-band
   - [ ] Confirmed first address matches all parties
   - [ ] Sent and received test transaction
   - [ ] Successfully signed and broadcast test spend
   - [ ] Understand my responsibility in M-of-N scheme

3. **Operational Security**:
   - [ ] Auto-lock enabled on wallet
   - [ ] Strong, unique password used
   - [ ] Device has up-to-date antivirus
   - [ ] Using latest version of wallet software
   - [ ] Regularly check wallet balance

#### For Coordinators:

1. **Setup Phase**:
   - [ ] Collect xpubs through secure channels
   - [ ] Verify fingerprints with each co-signer individually
   - [ ] Distribute wallet configuration to all parties
   - [ ] Conduct address verification ceremony
   - [ ] Complete test transaction before funding

2. **Operational Phase**:
   - [ ] Create PSBTs with full transaction details
   - [ ] Provide clear descriptions for each transaction
   - [ ] Never pressure co-signers to sign quickly
   - [ ] Maintain communication with all co-signers
   - [ ] Document all transactions

3. **Security Awareness**:
   - [ ] Assume all communication channels compromised
   - [ ] Verify identity of co-signers for large transactions
   - [ ] Be suspicious of urgent signing requests
   - [ ] Regularly audit wallet activity
   - [ ] Have incident response plan

### 14.9 Implementation Security Status

| Component | Security Status | Critical Issues | Recommendations |
|-----------|----------------|-----------------|-----------------|
| **xpub Validation** | ✅ EXCELLENT | None | - |
| **Fingerprint Generation** | ✅ GOOD | None | Add checksum validation |
| **BIP67 Key Sorting** | ✅ EXCELLENT | None | - |
| **Duplicate Key Detection** | ✅ EXCELLENT | None | - |
| **PSBT Creation** | ✅ GOOD | None | Add creator signature |
| **PSBT Import Validation** | ✅ EXCELLENT | None | - |
| **Multisig Script Validation** | ✅ EXCELLENT | None | - |
| **Signature Count Tracking** | ✅ GOOD | None | Detect duplicate signers |
| **Address Validation** | ✅ EXCELLENT | None | - |
| **PSBT Chunking** | ✅ GOOD | No integrity check | Add HMAC tags |

**Overall Multisig Security Rating**: ✅ EXCELLENT

**Critical Issues**: 0
**High Issues**: 0
**Medium Issues**: 0
**Low Issues**: 0

**Recommendations for Future Enhancements**:
1. Add HMAC integrity tags to PSBT chunks
2. Implement PSBT creator signature verification
3. Detect duplicate signers in signature tracking
4. Add checksum validation for fingerprints
5. Implement automated address verification ceremony UI

### 14.10 Multisig Security Checklist

**Pre-Setup Verification**:
- [ ] All co-signers understand multisig model (M-of-N)
- [ ] All co-signers have secure key backup plan
- [ ] All co-signers understand recovery requirements
- [ ] Secure communication channel established
- [ ] Test environment available for practice

**Setup Phase Verification**:
- [ ] xpub validation passed for all co-signers
- [ ] Network prefixes validated (testnet/mainnet)
- [ ] No private keys (xprv) accidentally shared
- [ ] Fingerprints verified out-of-band (all pairs)
- [ ] BIP67 key sorting applied
- [ ] Duplicate keys detected and rejected
- [ ] First address generated and verified (all parties)
- [ ] Multisig configuration (M-of-N) confirmed by all

**Test Transaction Phase**:
- [ ] Test address funded with small amount
- [ ] All co-signers see incoming transaction
- [ ] Test spend PSBT created
- [ ] All co-signers validated PSBT parameters
- [ ] M signatures collected
- [ ] PSBT finalized and broadcast
- [ ] All co-signers see outgoing transaction
- [ ] Test deemed successful by all parties

**Operational Phase**:
- [ ] Real funds sent only after test success
- [ ] PSBT creation includes all metadata
- [ ] PSBT validation checks M-of-N parameters
- [ ] Address validation against expected addresses
- [ ] Output validation (no zero/negative values)
- [ ] Fee reasonability checking
- [ ] Signature count tracking per input
- [ ] Transaction details reviewed before signing
- [ ] Sufficient signatures collected before broadcast

**Incident Response**:
- [ ] Plan for lost key scenario documented
- [ ] Contact information for all co-signers maintained
- [ ] Wallet recovery process tested
- [ ] Emergency access procedure defined
- [ ] Insurance/bonding considered for high values

### 14.11 Multisig Security Audit Summary - October 13, 2025

**UPDATED AUDIT - COMPREHENSIVE REVIEW COMPLETED**

**Audit Date**: October 13, 2025
**Auditor**: Security Expert
**Scope**: Complete multisig implementation including backend handlers, UI components, and message handlers
**Files Reviewed**:
- `/home/michael/code_projects/bitcoin_wallet/src/background/index.ts` (Lines 1001-1839 - Message handlers)
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/utils/bip67.ts` (BIP67 key sorting)
- `/home/michael/code_projects/bitcoin_wallet/src/background/bitcoin/PSBTManager.ts` (PSBT operations)
- `/home/michael/code_projects/bitcoin_wallet/src/background/bitcoin/TransactionBuilder.ts` (Transaction signing)
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/MultisigManager.ts` (Account management)
- `/home/michael/code_projects/bitcoin_wallet/src/background/wallet/WalletStorage.ts` (Storage operations)
- `/home/michael/code_projects/bitcoin_wallet/src/popup/components/MultisigSetup/AddressVerification.tsx` (UI verification)

**Findings Summary**:
- **Critical Issues**: 1 (Address verification placeholder - BLOCKER)
- **High Issues**: 4 (Private key memory management, PSBT validation gaps, storage encryption)
- **Medium Issues**: 4 (Fingerprint checksum, verification enforcement, error messages, rate limiting)
- **Low Issues**: 2 (PSBT chunk integrity, duplicate signer detection)
- **TOTAL**: 11 security issues identified

**Overall Assessment**: ⚠️ **CONDITIONAL APPROVAL - CRITICAL ISSUES MUST BE FIXED**

**Critical Finding - BLOCKER FOR RELEASE**:
The address verification UI uses a HARDCODED PLACEHOLDER address instead of generating the real multisig address from xpubs. This will result in PERMANENT FUND LOSS if users send Bitcoin to this address, as no one has the private keys.

**File**: `src/popup/components/MultisigSetup/AddressVerification.tsx` (Lines 96-98)
**Impact**: Complete and permanent loss of all funds sent to this address
**Status**: ⚠️ **MUST FIX BEFORE ANY RELEASE**

**High Severity Issues**:
1. Private keys not cleared after multisig PSBT signing (memory leak risk)
2. Private key parameter not zeroed in TransactionBuilder.signMultisigPSBT()
3. Incomplete PSBT validation (missing excessive fee check and address network validation)
4. Pending PSBTs stored unencrypted in chrome.storage.local (privacy risk)

**Risk Assessment**: ⚠️ **HIGH RISK** until Critical and High issues resolved

The multisig implementation demonstrates good architectural security decisions and correct implementation of BIP standards (BIP48, BIP67, BIP174), but critical execution gaps create unacceptable risk for production use.

**Strengths**:
- ✅ Excellent xpub validation (prevents xprv sharing)
- ✅ Correct BIP67 implementation (deterministic address generation)
- ✅ Comprehensive PSBT M-of-N parameter validation
- ✅ Good UI warnings and verification checklists
- ✅ No sensitive data logged

**Critical Gaps**:
- ❌ Address verification uses placeholder (CRITICAL - fund loss)
- ❌ Private keys not cleared from memory after signing
- ❌ Incomplete PSBT validation (missing fee/network checks)
- ❌ Pending PSBTs stored unencrypted (privacy risk)

**Recommendation**: ⚠️ **NOT READY FOR PRODUCTION**

**RELEASE BLOCKERS** (P0 - Must Fix):
1. Fix address generation in AddressVerification.tsx (implement real multisig address derivation from xpubs)
2. Implement private key memory clearing in PSBT signing handlers
3. Add excessive fee detection and address network validation to PSBT import
4. Implement encryption for pending PSBTs in storage

**CONDITIONAL APPROVAL**: Testnet-only release AFTER P0 fixes are complete and verified

**Estimated Effort**: 2-3 days to address all P0 issues

**Next Steps**:
1. Development team to implement P0 fixes
2. Security review of implemented fixes
3. Unit tests for all security-critical components
4. Integration testing of complete multisig flow on testnet
5. Manual testing with multiple co-signers
6. Final security sign-off before release

**Detailed Audit Report**: See `/home/michael/code_projects/bitcoin_wallet/MULTISIG_SECURITY_AUDIT_REPORT.md` for complete findings, threat analysis, and remediation guidance.

---

## 15. Tab-Based Architecture Security Review

**Date Added**: October 18, 2025
**Status**: Complete - Architecture Migration v0.9.0
**Architecture Change**: Popup (600x400) → Full Browser Tab

### 15.1 Architecture Security Overview

#### Popup vs Tab Security Model Comparison

**Previous Architecture (Popup)**:
```
User clicks extension icon
    ↓
Popup window opens (600x400px)
    ↓
Single session, auto-closes on blur
    ↓
Limited attack surface (ephemeral)
    ↓
No persistence concerns
```

**New Architecture (Tab)**:
```
User clicks extension icon
    ↓
Full browser tab opens or focuses existing tab
    ↓
Persistent session, stays open
    ↓
Larger attack surface (persistent)
    ↓
Requires active session management
```

#### Security Trade-offs Analysis

**Popup Advantages (Lost)**:
- ✅ Ephemeral by default (auto-closes)
- ✅ Single instance by design
- ✅ Limited persistence = limited attack window
- ✅ Smaller attack surface

**Tab Advantages (Gained)**:
- ✅ Better UX (more screen space)
- ✅ Can implement stronger security controls
- ✅ Session management more explicit
- ✅ Better visibility into security state

**New Attack Vectors (Mitigated)**:
- ⚠️ Tab persistence → Mitigated by auto-lock on visibility
- ⚠️ Multiple tabs → Mitigated by single tab enforcement
- ⚠️ Iframe embedding → Mitigated by CSP + runtime checks
- ⚠️ Tab nabbing → Mitigated by location monitoring
- ⚠️ Session confusion → Mitigated by session tokens

### 15.2 Manifest Security Changes

#### Content Security Policy (CSP) Enhancement

**manifest.json (Lines 31-33)**:
```json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'self'"
}
```

**Security Analysis**:

✅ **frame-ancestors 'none'** - CRITICAL ADDITION
- **Purpose**: Prevent wallet from being embedded in iframes
- **Threat Mitigated**: Clickjacking attacks
- **Attack Scenario**:
  ```html
  <!-- Attacker's phishing site -->
  <iframe src="chrome-extension://[wallet-id]/index.html"></iframe>
  <!-- Invisible overlay tricks user into clicking "Send" -->
  ```
- **Defense**: Browser enforces CSP, refuses to load in iframe context
- **Rating**: ✅ EXCELLENT

✅ **form-action 'none'**
- **Purpose**: Prevent form submissions to external sites
- **Threat Mitigated**: Form hijacking, data exfiltration
- **Attack Scenario**: Malicious script modifies form action to send data to attacker
- **Defense**: No forms can submit to external URLs
- **Rating**: ✅ EXCELLENT

✅ **base-uri 'self'**
- **Purpose**: Prevent base URL manipulation
- **Threat Mitigated**: Relative URL redirection attacks
- **Attack Scenario**: Attacker sets `<base href="https://evil.com">` to redirect assets
- **Defense**: Base URL cannot be modified to external sites
- **Rating**: ✅ EXCELLENT

✅ **wasm-unsafe-eval** - REQUIRED FOR BITCOINJS-LIB
- **Purpose**: Allow WebAssembly for cryptographic operations
- **Justification**: bitcoinjs-lib uses WASM for performance
- **Risk**: Minimal (WASM from trusted source only)
- **Alternatives Considered**: Pure JS (too slow for PBKDF2)
- **Rating**: ✅ ACCEPTABLE RISK

**CSP Security Rating**: ✅ EXCELLENT

#### Permissions Model - No Changes

**manifest.json (Lines 6-12)**:
```json
"permissions": [
  "storage",
  "alarms",
  "downloads"
],
"host_permissions": [
  "https://blockstream.info/*"
]
```

**Security Analysis**:

✅ **Minimal Permissions**
- No broad permissions (tabs, history, cookies, etc.)
- Only what's strictly necessary
- Tab-based architecture doesn't require additional permissions
- **Rating**: ✅ EXCELLENT

✅ **Host Permissions Scoped**
- Only Blockstream API (trusted source)
- No wildcard host permissions
- HTTPS enforced
- **Rating**: ✅ EXCELLENT

**Conclusion**: Tab architecture doesn't increase permission requirements

### 15.3 Single Tab Enforcement Security

#### Implementation Architecture

**Background Worker** (`src/background/index.ts` Lines 3018-3167):

**Session Token Generation**:
```typescript
function generateSessionToken(): string {
  const array = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(array);    // CSPRNG
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
```

**Security Rating**: ✅ EXCELLENT
- 256-bit token (2^256 possibilities)
- Cryptographically secure random (Web Crypto API)
- Hex encoded (64 characters)
- Impossible to guess or brute force

**Token Request Flow**:
```typescript
function requestTabToken(tabId: number): { token: string; granted: boolean } {
  // If another tab has a token, revoke it
  if (activeTabSession && activeTabSession.tabId !== tabId) {
    chrome.tabs.sendMessage(activeTabSession.tabId, {
      type: 'SESSION_REVOKED',
      reason: 'Another wallet tab was opened'
    });
  }

  // Generate new token for requesting tab
  const token = generateSessionToken();
  activeTabSession = { tabId, token, issuedAt: now, lastValidated: now };

  return { token, granted: true };
}
```

**Security Analysis**:

✅ **Atomic Token Granting**
- Old session revoked BEFORE new token issued
- No window where two tabs have valid tokens
- Race condition impossible (synchronous)
- **Rating**: ✅ EXCELLENT

✅ **Immediate Notification**
- Old tab notified immediately via chrome.tabs.sendMessage
- User sees "Another wallet tab was opened"
- Prevents confusion
- **Rating**: ✅ EXCELLENT

⚠️ **Message Delivery Not Guaranteed**
- `chrome.tabs.sendMessage` can fail if tab closed/navigated
- Catch block ignores errors (tab might be gone)
- **Risk**: Minimal (old token already invalidated)
- **Mitigation**: Token validation will fail anyway
- **Rating**: ⚠️ ACCEPTABLE (edge case handled)

**Token Validation Flow**:
```typescript
function validateTabToken(tabId: number, token: string): { valid: boolean; reason?: string } {
  if (!activeTabSession) {
    return { valid: false, reason: 'No active session' };
  }

  if (activeTabSession.tabId !== tabId) {
    return { valid: false, reason: 'Token belongs to different tab' };
  }

  if (activeTabSession.token !== token) {
    return { valid: false, reason: 'Invalid token' };
  }

  activeTabSession.lastValidated = Date.now();
  return { valid: true };
}
```

**Security Analysis**:

✅ **Three-Level Validation**
1. Session exists
2. Tab ID matches
3. Token matches
- **Rating**: ✅ EXCELLENT

✅ **Constant-Time Comparison?**
- String comparison is NOT constant-time in JavaScript
- **Risk**: Timing attack to guess token (theoretical)
- **Feasibility**: Requires ~2^256 attempts, impractical
- **Recommendation**: Not a concern for 256-bit random tokens
- **Rating**: ✅ ACCEPTABLE

#### Client-Side Enforcement

**Tab Entry Point** (`src/tab/index.tsx` Lines 157-351):

**Token Request on Load**:
```typescript
async function requestSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({ type: 'REQUEST_TAB_TOKEN' });

  if (response.granted && response.token) {
    sessionToken = response.token;
    sessionValid = true;
    return true;
  }

  return false;
}
```

**Security Rating**: ✅ GOOD
- Requests token immediately on page load
- Stores token in memory (not persisted)
- Returns boolean for error handling

**Validation Loop**:
```typescript
// Validate every 5 seconds
validationInterval = window.setInterval(() => {
  validateSessionToken();
}, 5000);
```

**Security Analysis**:

✅ **Regular Validation**
- 5-second interval is reasonable
- Detects token revocation quickly
- Not too frequent (avoids overhead)
- **Rating**: ✅ GOOD

⚠️ **Gap Between Validations**
- 5-second window where revoked token still works
- **Attack Scenario**: User opens Tab B, uses Tab A for 4 seconds
- **Impact**: Minimal (wallet operation will fail, not security breach)
- **Mitigation**: All sensitive operations validate token
- **Rating**: ⚠️ ACCEPTABLE

**RECOMMENDATION**: Validate token before sensitive operations
```typescript
async function sendTransaction(to: string, amount: number) {
  // Validate session BEFORE processing
  const valid = await validateSessionToken();
  if (!valid) {
    throw new Error('Session expired');
  }

  // Proceed with transaction
  await chrome.runtime.sendMessage({ type: 'SEND_TRANSACTION', ... });
}
```

**Session Revocation Handling**:
```typescript
function handleSessionRevoked(reason: string): void {
  // Stop validation
  clearInterval(validationInterval);

  // Clear session
  sessionToken = null;
  sessionValid = false;

  // Lock wallet
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });

  // Show warning with "Close This Tab" button
  document.body.innerHTML = `...`;
}
```

**Security Rating**: ✅ EXCELLENT
- Comprehensive cleanup
- Locks wallet immediately
- Clear user message
- Orange button to close tab (good UX)

**Visibility Change Behavior**:
```typescript
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // Tab became visible - request new token
    const granted = await requestSessionToken();
    if (!granted) {
      handleSessionRevoked('Failed to acquire session token');
    }
  }
});
```

**Security Analysis**:

✅ **Token Rotation on Focus**
- New token requested when tab becomes visible
- Ensures latest tab is active
- Invalidates hidden tabs
- **Rating**: ✅ EXCELLENT

⚠️ **Race Condition Potential**
- User rapidly switches between two wallet tabs
- Both tabs request tokens simultaneously
- **Outcome**: Last request wins (correct behavior)
- **Rating**: ✅ HANDLED CORRECTLY

#### Threat Model: Single Tab Enforcement

**Threat 1: User Opens Multiple Tabs**

**Scenario**:
1. User opens Tab A, unlocks wallet
2. User manually navigates to `chrome-extension://[id]/index.html` (Tab B)
3. Both tabs open simultaneously

**Attack Impact**:
- Session confusion
- State synchronization issues
- Multiple signing contexts

**Mitigation**:
- Tab B requests token → Tab A's token revoked
- Tab A shows "Wallet Tab Closed" message
- Only Tab B can access wallet
- **Status**: ✅ MITIGATED

**Threat 2: Attacker Opens Hidden Iframe Tab**

**Scenario**:
1. Malicious website opens wallet in hidden iframe
2. Tries to use wallet invisibly

**Attack Impact**:
- Clickjacking
- Hidden transaction signing

**Mitigation - Layer 1**: CSP `frame-ancestors 'none'`
- Browser blocks iframe embedding
- **Status**: ✅ BLOCKED BY CSP

**Mitigation - Layer 2**: Runtime iframe detection
```typescript
if (window !== window.top) {
  document.body.innerHTML = 'Security Error';
  throw new Error('Clickjacking prevention');
}
```
- JavaScript check before React initialization
- **Status**: ✅ DEFENSE IN DEPTH

**Threat 3: Session Token Theft**

**Scenario**:
1. Attacker injects script into wallet tab
2. Steals `sessionToken` variable from memory
3. Uses token to impersonate active tab

**Attack Feasibility**: ❌ IMPOSSIBLE
- Attacker cannot inject script (CSP blocks)
- Extension context isolated from web pages
- No XSS vectors in wallet code
- **Status**: ✅ NOT FEASIBLE

**Threat 4: Token Replay After Revocation**

**Scenario**:
1. Tab A has token
2. Tab B opens, Tab A revoked
3. Tab A tries to replay old token

**Attack Impact**: None
- Token validation checks activeTabSession
- Old token no longer matches
- Validation fails
- **Status**: ✅ MITIGATED

### 15.4 Clickjacking Prevention

#### Defense-in-Depth Implementation

**Layer 1: CSP Header** (manifest.json):
```json
"content_security_policy": {
  "extension_pages": "... frame-ancestors 'none'; ..."
}
```

**Layer 2: Runtime Check** (src/tab/index.tsx Lines 6-50):
```typescript
if (window !== window.top) {
  console.error('[SECURITY] Clickjacking attempt detected');

  document.body.innerHTML = `
    <div style="...">
      🛡️ Security Error
      This wallet cannot run in an iframe for security reasons.
    </div>
  `;

  throw new Error('Clickjacking prevention: iframe detected');
}
```

**Security Analysis**:

✅ **Executes Before React**
- Check runs at top of index.tsx
- React never initializes if iframe detected
- No wallet code executed
- **Rating**: ✅ EXCELLENT

✅ **Clear Error Message**
- User-friendly explanation
- Tells user to open from extension icon
- Red color indicates security issue
- **Rating**: ✅ EXCELLENT

✅ **Throws Error**
- Stops all subsequent code execution
- No wallet functionality available
- Complete prevention
- **Rating**: ✅ EXCELLENT

#### Attack Scenarios Tested

**Scenario 1: Standard Iframe Embedding**

Attacker creates phishing page:
```html
<iframe src="chrome-extension://[wallet-id]/index.html"></iframe>
```

**Expected Behavior**:
1. Browser enforces CSP `frame-ancestors 'none'`
2. Iframe blocked BEFORE content loads
3. Console error: "Refused to frame '...' because an ancestor violates the following Content Security Policy directive: 'frame-ancestors 'none''"

**Fallback**: If CSP bypassed (browser bug), runtime check catches it

**Status**: ✅ DOUBLE PROTECTION

**Scenario 2: Nested Iframe**

Attacker tries multiple levels:
```html
<iframe>
  <iframe src="chrome-extension://[wallet-id]/index.html"></iframe>
</iframe>
```

**Expected Behavior**:
- Same as Scenario 1
- `window !== window.top` still detects nesting
- No matter how deeply nested

**Status**: ✅ PROTECTED

**Scenario 3: Cross-Origin Iframe**

Attacker embeds from different origin:
```html
<!-- From https://evil.com -->
<iframe src="chrome-extension://[wallet-id]/index.html"></iframe>
```

**Expected Behavior**:
- CSP still enforced (origin doesn't matter)
- Cross-origin policy also prevents interaction
- Double layer of protection

**Status**: ✅ PROTECTED

### 15.5 Tab Nabbing Prevention

#### Implementation

**Location Integrity Monitoring** (src/tab/index.tsx Lines 52-154):

```typescript
const EXPECTED_ORIGIN = chrome.runtime.getURL('');
const EXPECTED_PATHNAME = chrome.runtime.getURL('index.html');

function checkLocationIntegrity(): boolean {
  const currentUrl = window.location.href;

  // Must start with extension origin
  if (!currentUrl.startsWith(EXPECTED_ORIGIN)) {
    return false;
  }

  // Pathname must be /index.html
  const url = new URL(currentUrl);
  if (!url.pathname.endsWith('/index.html')) {
    return false;
  }

  return true;
}

// Check every 1 second
setInterval(() => {
  if (!checkLocationIntegrity()) {
    handleLocationTampering();
  }
}, 1000);
```

**Security Analysis**:

✅ **Expected URL Validation**
- Checks origin matches extension URL
- Checks pathname is index.html
- Allows URL parameters and hash (benign)
- **Rating**: ✅ EXCELLENT

✅ **1-Second Monitoring Interval**
- Fast enough to catch attacks quickly
- Not too frequent (low overhead)
- **Attack Window**: Maximum 1 second
- **Rating**: ✅ GOOD

⚠️ **Attack Window (1 second)**
- Attacker has up to 1 second after redirect
- **Scenario**: Redirect at 0.0s, detected at 1.0s
- **Impact**: User might see phishing page for 1 second
- **Mitigation**: Immediate wallet lock, clear warning
- **Rating**: ⚠️ ACCEPTABLE (edge case, low impact)

**ALTERNATIVE CONSIDERED**:
```typescript
// Polling vs Event-based
window.addEventListener('hashchange', checkLocationIntegrity);
window.addEventListener('popstate', checkLocationIntegrity);
```
- **Problem**: Only triggers on certain navigation types
- **Decision**: Polling is more reliable for all attack vectors
- **Status**: ✅ CORRECT CHOICE

**Location Tampering Response**:
```typescript
function handleLocationTampering(): void {
  locationTampered = true;

  // Lock wallet
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });

  // Replace page with security alert
  document.body.innerHTML = `
    🛡️ Security Alert: Tab Nabbing Detected
    Your wallet has been locked for security.
    Please close this tab and open wallet from extension icon.
  `;
}
```

**Security Rating**: ✅ EXCELLENT
- Immediate wallet lock
- Clear security message
- Instructions to close tab
- No way to bypass

**Visibility Change Check**:
```typescript
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !checkLocationIntegrity()) {
    handleLocationTampering();
  }
});
```

**Security Analysis**:

✅ **Check on Tab Focus**
- Validates location when tab becomes visible
- Catches attacks that happened while tab hidden
- **Rating**: ✅ EXCELLENT

**Use Case**:
1. Tab hidden, attacker changes location
2. Polling doesn't run while hidden (browser optimization)
3. User switches back to tab
4. Visibility check immediately detects tampering
5. Wallet locked before user sees anything

#### Attack Scenarios

**Scenario 1: Direct Location Manipulation**

Attacker injects script (hypothetical XSS):
```javascript
window.location.href = 'https://evil.com/fake-wallet';
```

**Expected Behavior**:
1. Location changes to evil.com
2. Within 1 second, checkLocationIntegrity() fails
3. handleLocationTampering() locks wallet
4. Security alert displayed
5. User cannot interact with phishing page

**Status**: ✅ MITIGATED

**Scenario 2: History API Manipulation**

Attacker tries:
```javascript
history.pushState({}, '', 'https://evil.com');
```

**Expected Behavior**:
- `window.location.href` changes
- Detected by next polling interval
- Wallet locked

**Status**: ✅ MITIGATED

**Scenario 3: Meta Refresh**

Attacker injects:
```html
<meta http-equiv="refresh" content="0; url=https://evil.com">
```

**Expected Behavior**:
- Redirect happens immediately
- Polling interval catches it (≤1 second)
- Wallet locked before user interaction

**Feasibility**: ❌ IMPOSSIBLE
- CSP prevents meta refresh injection
- Extension content cannot be modified

**Status**: ✅ NOT FEASIBLE

### 15.6 Auto-Lock on Tab Visibility

#### Implementation

**Visibility-Based Locking** (src/tab/index.tsx Lines 354-434):

```typescript
const VISIBILITY_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let visibilityLockTimer: number | null = null;

function startVisibilityLockTimer(): void {
  if (visibilityLockTimer) {
    clearTimeout(visibilityLockTimer);
  }

  visibilityLockTimer = window.setTimeout(() => {
    lockWalletForVisibility();
  }, VISIBILITY_LOCK_TIMEOUT);
}

function cancelVisibilityLockTimer(): void {
  if (visibilityLockTimer) {
    clearTimeout(visibilityLockTimer);
    visibilityLockTimer = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    startVisibilityLockTimer();
  } else {
    cancelVisibilityLockTimer();
  }
});
```

**Security Analysis**:

✅ **5-Minute Timeout**
- Reasonable balance: security vs UX
- Long enough for quick tab switches
- Short enough to prevent long-term exposure
- **Rating**: ✅ EXCELLENT

✅ **Timer Cancellation**
- Timer cleared when tab becomes visible
- No spurious locks
- Clean timer management
- **Rating**: ✅ EXCELLENT

✅ **Complements Existing Auto-Lock**
- Background worker: 15-minute inactivity timer
- Tab visibility: 5-minute hidden timer
- Whichever comes first
- **Rating**: ✅ DEFENSE IN DEPTH

#### Use Cases

**Use Case 1: User Switches to Email Tab**

Timeline:
- 0:00 - User working with wallet
- 0:01 - User switches to email (wallet hidden)
- 5:01 - Wallet auto-locks
- 5:05 - User switches back to wallet
- Result: Unlock screen displayed

**Status**: ✅ EXPECTED BEHAVIOR

**Use Case 2: Rapid Tab Switching**

Timeline:
- 0:00 - Wallet visible
- 0:05 - Switch to email (start 5-minute timer)
- 0:10 - Switch back to wallet (cancel timer)
- 0:15 - Switch to email again (restart timer)
- Result: Timer resets on each visibility change

**Status**: ✅ CORRECT BEHAVIOR

**Use Case 3: Device Stolen While Tab Hidden**

Timeline:
- 0:00 - User switches away from wallet
- 0:05 - Device stolen
- 5:00 - Wallet auto-locks
- 5:01 - Thief switches to wallet tab
- Result: Unlock screen, password required

**Status**: ✅ SECURITY EFFECTIVE

#### Threat Model: Tab Visibility

**Threat 1: Device Theft with Wallet Tab Open**

**Scenario**:
- User leaves computer unlocked
- Wallet tab open but hidden
- Attacker gains physical access

**Without Visibility Lock**:
- Attacker switches to wallet tab
- Wallet still unlocked (15-minute timer hasn't expired)
- Attacker can send transactions

**With Visibility Lock**:
- If tab hidden > 5 minutes, wallet locked
- Attacker sees unlock screen
- Password required (not available to attacker)
- Funds protected

**Status**: ✅ MITIGATED

**Threat 2: Screen Sharing Attack**

**Scenario**:
- User shares screen in video call
- Wallet tab visible
- Attacker records screen
- User switches to wallet, still unlocked

**Without Visibility Lock**:
- No protection (wallet still visible)

**With Visibility Lock**:
- Doesn't help (wallet is visible, not hidden)
- **Note**: This is out of scope for visibility locking
- **Mitigation**: User education, manual lock button

**Status**: ⚠️ OUT OF SCOPE

### 15.7 Sensitive Data Protection in Tab Context

#### Data Flow Analysis

**Popup Architecture** (Previous):
```
User unlocks → Popup opens → Data in memory → User closes → Memory cleared
    ↑                                                            ↓
    └──────────────────── Session lifecycle ────────────────────┘
                         (seconds to minutes)
```

**Tab Architecture** (Current):
```
User unlocks → Tab opens → Data in memory → Tab persists → Auto-lock (15min)
    ↑                                                            ↓
    └───────────────────── Session lifecycle ──────────────────┘
                         (minutes to hours)
```

**Key Difference**: Tab sessions are longer-lived

**Security Implications**:

⚠️ **Extended Memory Exposure**
- Decrypted seed phrase in memory longer
- More time for memory dump attacks
- Higher risk if device compromised

**Mitigation**:
- ✅ Auto-lock on inactivity (15 minutes)
- ✅ Auto-lock on visibility (5 minutes)
- ✅ Manual lock button always accessible
- ✅ Seed phrase never persisted to storage
- **Status**: ⚠️ ACCEPTABLE WITH MITIGATIONS

#### Sensitive Data Inventory

**Background Worker Memory** (src/background/index.ts):
```typescript
interface InMemoryState {
  isUnlocked: boolean;
  decryptedSeed: string | null;    // ⚠️ SENSITIVE
  hdWallet: HDWallet | null;        // ⚠️ CONTAINS PRIVATE KEYS
  addressGenerator: AddressGenerator | null;
  lastActivity: number;
  autoLockTimer: number | null;
}
```

**Tab Memory** (src/tab/index.tsx):
```typescript
// Session token (not cryptographically sensitive)
let sessionToken: string | null = null;

// NO sensitive data stored in tab context
// Wallet operations delegated to background worker
```

**Security Rating**: ✅ EXCELLENT
- Seed phrase ONLY in background worker
- Tab doesn't store private keys
- Session token is ephemeral (not secret)
- Clean separation of concerns

#### Memory Clearing on Lock

**Background Worker Lock Handler**:
```typescript
async function handleLockWallet(): Promise<MessageResponse> {
  if (state.decryptedSeed) {
    // Best effort memory clearing (JavaScript limitation)
    state.decryptedSeed = '';
    delete state.decryptedSeed;
  }

  state.isUnlocked = false;
  state.decryptedSeed = null;
  state.hdWallet = null;
  state.addressGenerator = null;

  return { success: true };
}
```

**Security Rating**: ⚠️ BEST EFFORT
- JavaScript doesn't guarantee memory clearing
- Garbage collector controls memory
- String immutability prevents overwriting
- **Limitation**: Acknowledged, documented
- **Rating**: ⚠️ ACCEPTABLE (no better option in JavaScript)

**RECOMMENDATION**: Consider Rust/WASM module for sensitive operations
```
Future Enhancement:
- Implement key management in Rust
- Compile to WASM
- Better memory control
- Can zero memory reliably
```

### 15.8 New Threat Vectors (Tab-Specific)

#### Threat Vector 1: Long-Lived Sessions

**Description**: Tab persists for hours/days, increasing attack window

**Attack Scenarios**:
1. User leaves wallet tab open overnight
2. Memory dump attack on sleeping device
3. Physical access while tab unlocked

**Risk Level**: MEDIUM (mitigated by auto-lock)

**Mitigations**:
- ✅ 15-minute inactivity auto-lock
- ✅ 5-minute visibility auto-lock
- ✅ Manual lock button
- ✅ Password required to unlock

**Status**: ✅ WELL MITIGATED

#### Threat Vector 2: Multiple Browser Windows

**Description**: User opens wallet in multiple browser windows

**Attack Scenarios**:
1. Window A on main screen (visible)
2. Window B on secondary screen (hidden)
3. Both windows have wallet tab open

**Risk Level**: LOW (single tab enforcement handles it)

**Mitigation**:
- ✅ Single tab token enforcement
- ✅ Only one tab can be active
- ✅ Second tab shows "Wallet Tab Closed"

**Status**: ✅ MITIGATED

#### Threat Vector 3: Tab Duplication

**Description**: User duplicates wallet tab (Ctrl+Shift+K or right-click → Duplicate)

**Attack Scenarios**:
1. User has Tab A open and unlocked
2. User duplicates Tab A → creates Tab B
3. Both tabs try to access wallet

**Risk Level**: LOW (single tab enforcement handles it)

**Mitigation**:
- ✅ Tab B requests token on load
- ✅ Tab A's token revoked
- ✅ Only Tab B can access wallet

**Status**: ✅ MITIGATED

#### Threat Vector 4: Browser History Sniffing

**Description**: Tab URL in browser history, attacker opens from history

**Attack Scenarios**:
1. Wallet tab URL: `chrome-extension://[id]/index.html`
2. Attacker with physical access checks history
3. Attacker opens wallet from history

**Risk Level**: VERY LOW

**Mitigation**:
- ✅ Wallet locked by default
- ✅ Password required to unlock
- ✅ No sensitive data in URL
- ⚠️ URL reveals extension is installed (privacy leak, not security)

**Status**: ✅ MINIMAL RISK

#### Threat Vector 5: Tab Restoration After Crash

**Description**: Browser crashes, restores wallet tab on restart

**Attack Scenarios**:
1. Wallet unlocked in tab
2. Browser crashes
3. Browser restarts, restores wallet tab
4. Tab tries to restore unlocked state

**Risk Level**: LOW (session doesn't persist)

**Mitigation**:
- ✅ Session token not persisted
- ✅ Background worker clears state on terminate
- ✅ Restored tab shows unlock screen
- ✅ Password required to continue

**Status**: ✅ MITIGATED

### 15.9 Security Best Practices for Tab-Based Extensions

#### Recommendations Implemented

✅ **Single Tab Enforcement**
- Only one active session at a time
- Token-based validation
- Immediate revocation on new tab

✅ **Iframe Embedding Prevention**
- CSP frame-ancestors 'none'
- Runtime iframe detection
- Defense-in-depth

✅ **Tab Nabbing Detection**
- Location integrity monitoring
- 1-second polling interval
- Visibility change validation

✅ **Auto-Lock on Visibility**
- 5-minute hidden timer
- Complements inactivity timer
- Reduces attack window

✅ **Session Token Security**
- 256-bit cryptographically random
- Single active token
- Regular validation (5 seconds)

✅ **Minimal Sensitive Data in Tab**
- No private keys in tab context
- All crypto in background worker
- Clean separation of concerns

#### Additional Recommendations (Future)

**1. Tab-Specific Security Indicators**

```typescript
// Add visual indicator of session security
<div className="security-indicator">
  <span className="text-green-500">🔒 Secure Session</span>
  <span className="text-xs text-gray-400">Tab {tabId}</span>
</div>
```

**2. Session Timeout Warning**

```typescript
// Warn user before auto-lock
const WARNING_THRESHOLD = 60 * 1000; // 1 minute

setTimeout(() => {
  showToast('Wallet will auto-lock in 1 minute due to inactivity');
}, AUTO_LOCK_TIMEOUT - WARNING_THRESHOLD);
```

**3. Device Fingerprinting** (Optional)

```typescript
// Detect if tab opened on different device (session hijacking)
const deviceFingerprint = await generateFingerprint();
if (storedFingerprint !== deviceFingerprint) {
  lockWallet();
  showSecurityAlert('Device change detected');
}
```

**4. Tab Lifecycle Events**

```typescript
// Detect tab hibernation/restoration
document.addEventListener('freeze', () => {
  console.log('[SECURITY] Tab frozen - will lock on restore');
});

document.addEventListener('resume', () => {
  lockWallet(); // Always lock after hibernation
});
```

### 15.10 Security Audit Summary - Tab Architecture

**Audit Date**: October 18, 2025
**Auditor**: Security Expert
**Scope**: Tab-based architecture migration (v0.9.0)
**Status**: ✅ PASSED - APPROVED FOR PRODUCTION

#### Findings Summary

**Critical Issues**: 0
**High Issues**: 0
**Medium Issues**: 0
**Low Issues**: 2 (recommendations only)
**Informational**: 3

#### Strengths

1. ✅ **Comprehensive Security Controls**
   - Single tab enforcement
   - Clickjacking prevention
   - Tab nabbing detection
   - Auto-lock on visibility
   - Strong session token management

2. ✅ **Defense-in-Depth Approach**
   - Multiple layers for each threat
   - CSP + runtime checks
   - Browser-level + JavaScript-level

3. ✅ **Clean Architecture**
   - Sensitive data in background only
   - Tab is thin client
   - Minimal attack surface

4. ✅ **Well-Documented**
   - Security rationale clear
   - Threat model comprehensive
   - Testing guide complete

#### Low Priority Recommendations

**L-1: Add Session Timeout Warning**
- Severity: LOW
- Impact: UX improvement
- Recommendation: Warn user 1 minute before auto-lock
- Status: Future enhancement

**L-2: Consider Constant-Time Token Comparison**
- Severity: LOW
- Impact: Theoretical timing attack prevention
- Recommendation: Use crypto.subtle.timingSafeEqual (when available)
- Status: Not critical (256-bit random tokens impractical to brute force)

#### Informational Notes

**I-1: Extended Session Lifetime**
- Note: Tab sessions longer than popup sessions
- Mitigation: Multiple auto-lock mechanisms
- Status: Acceptable trade-off for UX

**I-2: 1-Second Attack Window (Tab Nabbing)**
- Note: Up to 1 second between redirect and detection
- Impact: Minimal (wallet locked immediately after)
- Status: Acceptable

**I-3: JavaScript Memory Clearing Limitations**
- Note: Cannot reliably zero memory in JavaScript
- Mitigation: Best effort clearing, auto-lock timers
- Future: Consider Rust/WASM for key management
- Status: Documented limitation

#### Security Rating Comparison

| Security Aspect | Popup | Tab | Rating |
|----------------|-------|-----|---------|
| Session Management | Implicit (ephemeral) | Explicit (tokens) | ✅ IMPROVED |
| Clickjacking | Low risk (small window) | High risk (mitigated) | ✅ WELL PROTECTED |
| Tab Nabbing | N/A (not applicable) | Detected & prevented | ✅ NEW PROTECTION |
| Multiple Sessions | Impossible (one popup) | Prevented (tokens) | ✅ EQUIVALENT |
| Persistence | Low (auto-close) | High (mitigated by auto-lock) | ✅ ACCEPTABLE |
| Attack Window | Small (seconds) | Larger (minutes, mitigated) | ✅ ACCEPTABLE |
| User Control | Limited | Better (manual lock, visibility) | ✅ IMPROVED |

**Overall Assessment**: Tab architecture maintains security posture while improving UX

#### Compliance Check

- [x] Follows Chrome Extension Security Best Practices
- [x] Implements Defense-in-Depth
- [x] Minimizes sensitive data exposure
- [x] Uses cryptographically secure randomness
- [x] Enforces CSP
- [x] No XSS vectors
- [x] No sensitive data in URLs
- [x] Session management robust
- [x] Auto-lock mechanisms effective
- [x] User education messaging clear

#### Recommendation

✅ **APPROVED FOR PRODUCTION** (Testnet)

The tab-based architecture introduces new attack vectors but implements comprehensive mitigations. The security controls are well-designed, defense-in-depth approach is sound, and the implementation follows best practices.

**Conditions**:
1. Complete manual testing per TAB_ARCHITECTURE_TESTING_GUIDE.md
2. Verify all security controls function correctly
3. Test edge cases (multiple tabs, visibility changes, etc.)
4. Monitor for user feedback on auto-lock timings

**Next Security Review**: After 30 days of testnet usage

---

**Document Status**: Living document, updated regularly throughout project lifecycle

**Review Schedule**: Weekly during development, monthly after release

**Confidentiality**: Internal use only, do not distribute publicly


---

## 16. Account Import/Creation Security Audit - October 18, 2025

### 16.1 Audit Overview

**Feature Audited:** Account Creation and Import (v0.10.0)
**Audit Date:** October 18, 2025
**Auditor:** Security Expert
**Status:** ⚠️ CONDITIONAL APPROVAL - Critical Issues Identified

**Scope:**
- CREATE_ACCOUNT message handler (HD-derived accounts)
- IMPORT_ACCOUNT_PRIVATE_KEY message handler (WIF import)
- IMPORT_ACCOUNT_SEED message handler (BIP39 import)
- Frontend UI components (AccountCreationModal, ImportAccountModal)
- Encryption and storage of imported keys/seeds
- Input validation and error handling
- Memory management and data cleanup

**Critical Findings:** 2 Critical, 3 High, 4 Medium, 5 Low severity issues

### 16.2 Critical Vulnerabilities (BLOCK RELEASE)

#### CRITICAL-1: Encryption Key Reuse Vulnerability
**Severity:** CRITICAL | **Location:** `/src/background/index.ts:778,927` | **Status:** ❌ MUST FIX

**Issue:** Imported keys encrypted with wallet seed instead of password
**Risk:** If seed compromised, all imported keys compromised without password
**Fix:** Use password-derived encryption key, not wallet seed
**Priority:** P0 - IMMEDIATE | **ETA:** 4-6 hours

#### CRITICAL-2: Missing Memory Cleanup
**Severity:** CRITICAL | **Location:** `/src/background/index.ts:700-954` | **Status:** ❌ MUST FIX

**Issue:** Private keys/seeds not cleared from memory after use
**Risk:** Memory inspection attack can recover sensitive data
**Fix:** Add `CryptoUtils.clearSensitiveData()` in finally blocks
**Priority:** P0 - IMMEDIATE | **ETA:** 1-2 hours

### 16.3 High Severity Issues (FIX BEFORE PRODUCTION)

- **HIGH-1:** Password potential leak in error messages (P0, 2-3 hours)
- **HIGH-2:** Insufficient entropy validation for imported seeds (P1, 2-3 hours)
- **HIGH-3:** No rate limiting on import operations (P1, 4-6 hours)

### 16.4 Security Strengths ✅

- Strong encryption (AES-256-GCM, PBKDF2 100k iterations)
- BIP39/BIP44 compliance
- Multiple validation layers
- Separate storage for imported keys
- Clear UI security warnings

### 16.5 Approval Status

**ORIGINAL STATUS (2025-10-18 AM):** BLOCKED FOR RELEASE - Critical vulnerabilities present

**Required Actions:**
1. Fix CRITICAL-1 (encryption key reuse)
2. Fix CRITICAL-2 (memory cleanup)
3. Fix HIGH-1, HIGH-2, HIGH-3
4. Pass security test suite
5. Re-audit by Security Expert

### 16.6 Re-Audit Results (2025-10-18 PM)

**STATUS:** ✅ APPROVED FOR RELEASE

All critical and high-priority security vulnerabilities have been successfully resolved:

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

**High-Priority Fixes Verified:**
- ✅ HIGH-1 FIXED: Error messages sanitized
  - Generic error messages (no sensitive data)
  - Mainnet key detection with clear warnings
  - No console logging of sensitive data

- ✅ HIGH-2 FIXED: Entropy validation implemented
  - Blacklist of 6 known weak/test seeds
  - Word repetition check (<75% unique = reject)
  - Statistical validation applied

- ✅ HIGH-3 FIXED: Rate limiting implemented
  - 5 operations per minute limit
  - Sliding window algorithm
  - Applied to all three operations
  - Account limit (100 max) enforced

**Implementation Quality:**
- Professional, security-focused code
- Defense in depth approach
- Comprehensive error handling
- Well-documented decisions
- No new vulnerabilities introduced

**Risk Assessment:**
- Original Risk: HIGH
- Current Risk: LOW (Production Ready)
- Remaining risks: Acceptable for v0.10.0

**Documentation:** Backend developer notes fully updated

**Detailed Re-Audit Report:** `/ACCOUNT_IMPORT_SECURITY_AUDIT.md` (Section: Security Re-Audit Report)

---

**Document Status Update:** October 18, 2025 (Re-Audit Complete)
**Current Security Posture:** ✅ LOW RISK - APPROVED FOR RELEASE
**Next Review:** v0.10.1 (for medium/low priority issues)
