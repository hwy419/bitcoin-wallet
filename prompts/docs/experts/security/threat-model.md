# Threat Model

**Last Updated**: October 22, 2025
**Status**: Comprehensive - Covers Single-sig, Multisig, and Tab Architecture
**Quick Nav**: [INDEX](./_INDEX.md) | [Encryption](./encryption.md) | [Key Management](./key-management.md)

---

## Table of Contents

1. [Asset Classification](#1-asset-classification)
2. [Attack Vectors - Single-Signature Wallets](#2-attack-vectors---single-signature-wallets)
3. [Threat Prioritization Matrix](#3-threat-prioritization-matrix)
4. [Multisig-Specific Threats](#4-multisig-specific-threats)
5. [Tab Architecture Threats](#5-tab-architecture-threats)
6. [Mitigation Strategies](#6-mitigation-strategies)
7. [Security Testing Scenarios](#7-security-testing-scenarios)

---

## 1. Asset Classification

### 1.1 Critical Assets (Loss = Permanent Fund Loss)

**Assets**:
- Private keys (in memory)
- Seed phrases (12/24 word BIP39 mnemonics)
- Encrypted seed phrase (in chrome.storage.local)
- Encryption keys (derived from password, in memory)
- Imported private keys (WIF format, encrypted in storage)

**Impact of Compromise**: Complete and permanent loss of all wallet funds

**Protection Level**: Maximum
- Encrypted at rest (AES-256-GCM)
- In-memory only when unlocked
- Auto-lock after 15 minutes
- Manual lock always available

### 1.2 High-Value Assets (Loss = User Privacy/Security)

**Assets**:
- User passwords
- Account balances
- Transaction history
- Bitcoin addresses
- UTXO data
- Extended public keys (xpub) for multisig

**Impact of Compromise**:
- Privacy loss
- Transaction tracking
- Balance exposure
- Address clustering

**Protection Level**: Moderate
- Not encrypted (public blockchain data)
- Stored in isolated chrome.storage.local
- No external transmission except necessary API calls

### 1.3 Medium-Value Assets (Loss = User Inconvenience)

**Assets**:
- Account names
- Wallet settings
- UI preferences
- Contact list (future feature)

**Impact of Compromise**: Minor inconvenience, no security or financial impact

**Protection Level**: Basic
- Isolated storage
- No encryption needed

---

## 2. Attack Vectors - Single-Signature Wallets

### 2.1 Private Key/Seed Phrase Exposure

**Threat**: Unauthorized access to private keys or seed phrases leads to permanent loss of all funds.

#### Attack 1: Console Logging

- **Severity**: CRITICAL
- **Likelihood**: Medium (developer error)
- **Impact**: Complete fund loss
- **Description**: Accidentally logging sensitive data to browser console during development
- **Detection**: Code review, automated linting, secure logging wrapper
- **Mitigation**:
  - Secure logging wrapper with keyword filtering
  - ESLint rules to detect console.log with sensitive variables
  - Pre-commit hooks to scan for leaks
  - Code review checklist item

#### Attack 2: Error Message Leakage

- **Severity**: CRITICAL
- **Likelihood**: Low
- **Impact**: Complete fund loss
- **Description**: Including seed phrases or private keys in error messages
- **Detection**: Error handling audit, code review
- **Mitigation**:
  - Generic error messages only
  - No sensitive data in error objects
  - Sanitize all error messages
  - Catch and wrap all exceptions

#### Attack 3: Memory Inspection

- **Severity**: CRITICAL
- **Likelihood**: Low (requires local access)
- **Impact**: Complete fund loss
- **Description**: Using browser DevTools or memory dumps to extract keys from service worker memory
- **Detection**: Runtime protection, auto-lock, user education
- **Mitigation**:
  - Auto-lock after 15 minutes
  - Clear sensitive data on lock
  - Manual lock always available
  - Service worker termination clears memory

#### Attack 4: Clipboard Hijacking

- **Severity**: HIGH
- **Likelihood**: Medium
- **Impact**: Seed phrase theft
- **Description**: Malicious extension or malware monitoring clipboard for seed phrases or private keys
- **Detection**: User education, minimal clipboard usage
- **Mitigation**:
  - Never auto-copy seed phrases
  - Require manual reveal before copy
  - Time-limited clipboard (auto-clear after 60 seconds)
  - Warning when copying sensitive data

#### Attack 5: Screen Recording/Shoulder Surfing

- **Severity**: HIGH
- **Likelihood**: Low
- **Impact**: Seed phrase theft
- **Description**: Physical access, screen recording software, or shoulder surfing during wallet setup
- **Detection**: User warnings, masked display
- **Mitigation**:
  - Masked seed phrase display (click to reveal)
  - Warning to ensure privacy before revealing
  - Screen recording detection (future)
  - User education on physical security

### 2.2 Encryption Weaknesses

**Threat**: Weak encryption allows attacker to decrypt stored seed phrase through offline attacks.

#### Attack 1: Weak Password

- **Severity**: HIGH
- **Likelihood**: High (user behavior)
- **Impact**: Offline brute force success
- **Description**: Users choosing weak passwords (e.g., "password123") that can be brute-forced
- **Detection**: Password strength validation
- **Mitigation**:
  - Minimum 8 characters enforced
  - Character diversity requirement (3 types)
  - Common password blacklist (top 10,000)
  - Password strength indicator
  - User education on strong passwords

#### Attack 2: Insufficient PBKDF2 Iterations

- **Severity**: HIGH
- **Likelihood**: Low (design decision)
- **Impact**: Faster brute force attacks
- **Description**: Too few iterations make brute force feasible on modern hardware
- **Detection**: Code review, security audit
- **Mitigation**:
  - 100,000 iterations minimum (OWASP 2025 standard)
  - Configurable for future increases
  - Version field allows algorithm migration

#### Attack 3: IV Reuse

- **Severity**: CRITICAL
- **Likelihood**: Low (implementation error)
- **Impact**: Cryptographic failure, key recovery possible
- **Description**: Reusing initialization vectors with same key completely breaks AES-GCM security
- **Detection**: Code review, automated testing, IV uniqueness tests
- **Mitigation**:
  - Generate new IV for each encryption
  - crypto.getRandomValues() for IV generation
  - Test suite verifies IV uniqueness
  - Code review checklist item

#### Attack 4: Weak Random Number Generation

- **Severity**: CRITICAL
- **Likelihood**: Low (design decision)
- **Impact**: Predictable keys, complete compromise
- **Description**: Using Math.random() instead of crypto.getRandomValues() produces predictable values
- **Detection**: Code review, automated linting
- **Mitigation**:
  - Always use crypto.getRandomValues()
  - ESLint rule to ban Math.random() in crypto code
  - Type system enforces Uint8Array for randomness
  - Code review verification

#### Attack 5: Timing Attacks

- **Severity**: MEDIUM
- **Likelihood**: Very Low (requires sophisticated attacker)
- **Impact**: Password or key recovery through timing analysis
- **Description**: Using timing differences in comparisons to extract secrets
- **Detection**: Constant-time comparison functions
- **Mitigation**:
  - Rely on Web Crypto API (has timing protections)
  - Constant-time comparison for manual checks
  - Generic error messages (no early returns)

### 2.3 Storage Attacks

**Threat**: Direct access to chrome.storage.local exposes encrypted data for offline attacks.

#### Attack 1: Local Storage Access

- **Severity**: MEDIUM
- **Likelihood**: Medium (malware/physical access)
- **Impact**: Encrypted seed exposure (requires password cracking)
- **Description**: Malware or physical access reads chrome.storage.local to steal encrypted wallet
- **Detection**: Strong encryption, password strength requirements
- **Mitigation**:
  - AES-256-GCM encryption
  - 100,000 PBKDF2 iterations
  - Password strength enforcement
  - User education on device security

#### Attack 2: Backup/Sync Exposure

- **Severity**: MEDIUM
- **Likelihood**: Low
- **Impact**: Encrypted data in cloud backups or Chrome sync
- **Description**: Chrome sync or system backups containing encrypted wallet data
- **Detection**: User education, secure deletion
- **Mitigation**:
  - Encrypted seed phrase safe even in backups
  - Password still required
  - User education: backup seed phrase separately
  - Consider disabling sync for sensitive data

#### Attack 3: Forensic Recovery

- **Severity**: MEDIUM
- **Likelihood**: Low (requires physical access)
- **Impact**: Recovery of deleted encrypted data from disk
- **Description**: File recovery tools retrieving deleted storage data after wallet deletion
- **Detection**: Secure deletion practices
- **Mitigation**:
  - Overwrite encrypted data before deletion
  - Multiple passes (future enhancement)
  - User education on secure device disposal

### 2.4 Transaction Manipulation

**Threat**: Attacker modifies transaction details before signing, stealing funds.

#### Attack 1: Address Swap Attack

- **Severity**: CRITICAL
- **Likelihood**: Medium
- **Impact**: Funds sent to attacker's address
- **Description**: Malware or malicious extension swaps recipient address in UI or during signing
- **Detection**: Transaction confirmation UI, address verification
- **Mitigation**:
  - Clear confirmation dialog with full address
  - Highlight first/last characters for verification
  - QR code display for verification
  - No auto-confirm feature
  - Clipboard monitoring warnings

#### Attack 2: Amount Modification

- **Severity**: CRITICAL
- **Likelihood**: Low
- **Impact**: Sending more than intended
- **Description**: Modifying amount in transaction before signing
- **Detection**: Clear confirmation dialog
- **Mitigation**:
  - Display amount in both BTC and fiat
  - Require explicit confirmation
  - Show remaining balance after transaction
  - Warn on large transactions

#### Attack 3: Fee Manipulation

- **Severity**: MEDIUM
- **Likelihood**: Low
- **Impact**: Overpaying fees, dust attacks
- **Description**: Manipulating fee estimation to extract more funds or create dust
- **Detection**: Fee reasonability checks, multiple sources
- **Mitigation**:
  - Get fee estimates from Blockstream API
  - Warn if fee > 10% of amount
  - Show fee in both sat/vB and total BTC
  - Allow fee customization (with warnings)

### 2.5 Phishing & Social Engineering

**Threat**: User tricked into revealing credentials or seed phrase through deception.

#### Attack 1: Fake Wallet Interface

- **Severity**: CRITICAL
- **Likelihood**: Medium
- **Impact**: Credentials or seed phrase theft
- **Description**: Phishing website mimicking wallet interface to steal password and seed
- **Detection**: User education, domain verification, extension icon
- **Mitigation**:
  - Consistent branding and design
  - Extension-only interface (no website)
  - User education on phishing
  - "Verify you're using the official extension" message

#### Attack 2: Seed Phrase Phishing

- **Severity**: CRITICAL
- **Likelihood**: Medium
- **Impact**: Complete fund loss
- **Description**: Fake "support" or "upgrade" requesting seed phrase
- **Detection**: Clear warnings throughout UI
- **Mitigation**:
  - "NEVER share your seed phrase" warnings
  - "No support will ask for seed phrase" message
  - Phishing awareness tips in settings
  - Report phishing feature

#### Attack 3: Password Theft

- **Severity**: HIGH
- **Likelihood**: Medium
- **Impact**: Wallet access while unlocked, not permanent if user locks
- **Description**: Keyloggers or fake password prompts stealing password
- **Detection**: User education, auto-lock
- **Mitigation**:
  - Auto-lock after 15 minutes
  - User education on keylogger risks
  - Consider virtual keyboard (future)
  - Biometric auth (future)

### 2.6 Browser-Based Attacks

**Threat**: Exploitation of browser or extension vulnerabilities.

#### Attack 1: Cross-Site Scripting (XSS)

- **Severity**: HIGH
- **Likelihood**: Low (Manifest V3 CSP protections)
- **Impact**: Code injection, data theft
- **Description**: Injecting malicious scripts into extension UI
- **Detection**: CSP enforcement, input sanitization
- **Mitigation**:
  - Manifest V3 CSP (no eval, no inline scripts)
  - React JSX auto-escaping
  - Input sanitization for all user inputs
  - No dangerouslySetInnerHTML usage

#### Attack 2: Extension Conflicts

- **Severity**: MEDIUM
- **Likelihood**: Medium
- **Impact**: Data interception, UI manipulation
- **Description**: Malicious extensions accessing our extension's data or interfering with UI
- **Detection**: Message source validation, isolation
- **Mitigation**:
  - Validate message sender (chrome.runtime.id)
  - No content scripts (no DOM access)
  - Isolated service worker
  - Extension sandbox enforced by Chrome

#### Attack 3: Browser Vulnerabilities

- **Severity**: HIGH
- **Likelihood**: Low (browser updates)
- **Impact**: Sandbox escape, memory access
- **Description**: Zero-day browser vulnerabilities allowing sandbox escape
- **Detection**: Regular browser updates, security advisories
- **Mitigation**:
  - Require latest Chrome version (user education)
  - Subscribe to Chrome security bulletins
  - Defense in depth (multiple layers)
  - Rapid response plan for zero-days

### 2.7 Denial of Service

**Threat**: Wallet becomes unusable, blocking access to funds (not fund loss).

#### Attack 1: Service Worker Termination

- **Severity**: MEDIUM
- **Likelihood**: High (Chrome behavior)
- **Impact**: Temporary loss of access (requires re-unlock)
- **Description**: Chrome terminates inactive service workers, clearing in-memory state
- **Detection**: Proper state management, re-authentication flow
- **Mitigation**:
  - Expected behavior (by design)
  - Graceful re-authentication flow
  - Encrypted seed persists in storage
  - User education on unlock requirement

#### Attack 2: Storage Quota Exhaustion

- **Severity**: LOW
- **Likelihood**: Very Low
- **Impact**: Cannot save new data
- **Description**: Filling storage quota prevents updates
- **Detection**: Storage monitoring, cleanup
- **Mitigation**:
  - Monitor chrome.storage.local usage
  - Transaction cache cleanup
  - Quota: 10MB (very generous for wallet)
  - Warn at 80% capacity

#### Attack 3: API Rate Limiting

- **Severity**: MEDIUM
- **Likelihood**: Medium
- **Impact**: Cannot check balance or send transactions temporarily
- **Description**: Blockstream API rate limiting blocks requests
- **Detection**: Request throttling, caching, error handling
- **Mitigation**:
  - Client-side request throttling
  - Cache balance and UTXOs (5 min TTL)
  - Exponential backoff on errors
  - Consider backup API provider (future)

---

## 3. Threat Prioritization Matrix

| Threat Category | Severity | Likelihood | Priority | Status |
|-----------------|----------|------------|----------|--------|
| Private Key Exposure | CRITICAL | Medium | P0 | ✅ Mitigated |
| Weak Encryption | HIGH | High | P0 | ✅ Mitigated |
| Transaction Manipulation | CRITICAL | Medium | P0 | ✅ Mitigated |
| Phishing Attacks | CRITICAL | High | P1 | ⚠️ Ongoing (education) |
| Storage Attacks | MEDIUM | Medium | P1 | ✅ Mitigated |
| Browser Attacks | HIGH | Low | P2 | ✅ Mitigated |
| DoS Attacks | MEDIUM | Medium | P2 | ✅ Mitigated |

**Legend**:
- P0 = Blocks release, must fix
- P1 = High priority, fix before mainnet
- P2 = Medium priority, acceptable risk

---

## 4. Multisig-Specific Threats

### 4.1 Co-signer Collusion

**Scenario**: M out of N co-signers collude to steal funds

**Severity**: CRITICAL
**Likelihood**: Low (depends on co-signer trust)
**Impact**: Complete fund theft
**Risk Level**: INHERENT TO MULTISIG (by design)

**Mitigation**:
- ✅ Choose trustworthy co-signers
- ✅ For high-value wallets, use institutions
- ✅ Consider 3-of-5 instead of 2-of-3 (harder to collude)
- ✅ Geographic distribution of co-signers
- ✅ Regular auditing of wallet activity
- ✅ Legal agreements for institutional co-signers

**Status**: ACCEPTED RISK (fundamental to multisig model)

### 4.2 Lost Key Recovery

**Scenario**: (N - M + 1) keys are lost, wallet unrecoverable

**Severity**: CRITICAL
**Likelihood**: Medium (depends on backup practices)
**Impact**: Permanent fund loss

**Example**:
- 2-of-3 wallet: Lose 2 keys → funds lost forever
- 3-of-5 wallet: Lose 3 keys → funds lost forever

**Mitigation**:
- ✅ User education on key backup
- ✅ Multiple backup locations per key
- ✅ Hardware wallets for key storage
- ✅ Regular "liveness tests" (verify keys accessible)
- ⚠️ Shamir's Secret Sharing for backups (future)

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

### 4.3 Social Engineering on Multisig Setup

**Scenario**: Attacker tricks user during setup phase

**Attack Vectors**:

#### xpub Substitution Attack

**Description**: Attacker swaps co-signer's xpub during exchange

**Severity**: CRITICAL
**Likelihood**: Medium (depends on verification)
**Impact**: Attacker controls multisig, funds stolen

**Attack Flow**:
```
1. User requests co-signer's xpub via email
   ↓
2. Attacker intercepts email (MITM)
   ↓
3. Attacker replaces co-signer's xpub with their own
   ↓
4. User creates multisig with attacker's xpub
   ↓
5. User funds wallet thinking it's secure
   ↓
6. Attacker steals funds (has 2 of 3 keys)
```

**Mitigation**:
- ✅ **Fingerprint Verification Protocol**:
  - Exchange fingerprints via secure channel (video call, Signal)
  - All co-signers independently verify fingerprints match
  - Never trust xpubs from untrusted sources
- ✅ **Test Address Verification**:
  - Generate first address independently
  - Compare addresses out-of-band
  - Send test transaction before funding
  - Test spending before real funds

**Status**: ✅ MITIGATED (with verification protocol)

#### Fake Co-signer Attack

**Description**: Attacker poses as legitimate co-signer

**Severity**: CRITICAL
**Likelihood**: Low (requires social engineering)
**Impact**: Attacker controls multisig

**Mitigation**:
- ✅ Verify co-signer identity via multiple channels
- ✅ Video call verification
- ✅ Check identity documents for institutions
- ✅ Never use unknown co-signers

### 4.4 PSBT Manipulation

**Scenario**: Attacker modifies PSBT before or during signing

**Attack Vectors**:

#### Output Address Substitution

**Description**: Attacker changes output address in PSBT

**Severity**: CRITICAL
**Likelihood**: Low (validation catches it)
**Impact**: Funds sent to attacker

**Mitigation**:
- ✅ PSBT validation on import
- ✅ Display all outputs clearly before signing
- ✅ Address verification in UI
- ✅ Compare PSBT hash before/after export

#### Multisig Parameter Tampering

**Description**: Attacker changes M-of-N parameters in redeem script

**Severity**: CRITICAL
**Likelihood**: Low (validation catches it)
**Impact**: Security downgrade (2-of-3 becomes 1-of-3)

**Mitigation**:
- ✅ `validateMultisigPSBT()` checks M and N values
- ✅ Per-input validation
- ✅ Reject if parameters don't match expected

#### Fee Manipulation in PSBT

**Description**: Attacker increases fee to excessive amount

**Severity**: MEDIUM
**Likelihood**: Low
**Impact**: Overpayment of fees

**Mitigation**:
- ✅ Calculate and display total fee
- ✅ Warn if fee > 10% of amount
- ✅ Show fee in sat/vB for verification

### 4.5 Coordinator Attack

**Scenario**: Malicious coordinator in multisig setup

**Severity**: HIGH
**Likelihood**: Medium (depends on trust)
**Impact**: Theft or fund locking

**Attack Vectors**:
1. Provides wrong xpubs to different parties
2. Creates multisig with attacker's keys
3. Social engineering to collect signatures

**Mitigation**:
- ✅ Don't trust coordinator blindly
- ✅ Verify all xpubs and fingerprints directly with co-signers
- ✅ Independent address generation and verification
- ✅ Test transactions before real funding

---

## 5. Tab Architecture Threats

### 5.1 Long-Lived Sessions

**Scenario**: Tab remains open for extended periods, increasing exposure window

**Severity**: MEDIUM
**Likelihood**: High (user behavior)
**Impact**: Extended window for attacks

**Mitigation**:
- ✅ Auto-lock after 15 minutes (unchanged from popup)
- ✅ Lock on tab visibility loss
- ✅ Clear warnings about leaving tab open
- ✅ Manual lock button always visible

### 5.2 Multiple Browser Windows

**Scenario**: User opens wallet in multiple tabs/windows simultaneously

**Severity**: MEDIUM
**Likelihood**: Medium
**Impact**: Confused state, potential double-spending

**Mitigation**:
- ✅ Single tab enforcement via service worker
- ✅ New tab closes previous tab automatically
- ✅ Warning message if user tries to open multiple tabs
- ✅ Lock previous tab before opening new one

### 5.3 Tab Duplication

**Scenario**: User duplicates tab (Ctrl+Shift+D), creating multiple instances

**Severity**: MEDIUM
**Likelihood**: Low
**Impact**: State confusion, potential issues

**Mitigation**:
- ✅ Each tab gets unique registration on load
- ✅ Service worker tracks active tab
- ✅ Duplicate tabs show "Another tab is active" message
- ✅ Force lock on duplicate tab detection

### 5.4 Browser History Sniffing

**Scenario**: Malware inspects browser history to detect wallet usage

**Severity**: LOW
**Likelihood**: Low
**Impact**: Privacy loss (attacker knows user has wallet)

**Mitigation**:
- ⚠️ Extension URLs visible in history (Chrome limitation)
- ⚠️ No sensitive data in URLs
- ⚠️ User education on privacy mode for sensitive operations
- ⚠️ Future: Consider clearing history on lock

### 5.5 Tab Restoration After Crash

**Scenario**: Browser restores tab after crash with sensitive data

**Severity**: MEDIUM
**Likelihood**: Low
**Impact**: Sensitive data visible after crash

**Mitigation**:
- ✅ Service worker terminates on crash (auto-lock)
- ✅ Restored tab requires re-unlock
- ✅ No sensitive data in session storage
- ✅ React state resets on load

### 5.6 Clickjacking (Tab-Specific)

**Scenario**: Malicious site iframes wallet tab to steal clicks

**Severity**: HIGH
**Likelihood**: Very Low (extension isolation)
**Impact**: Unauthorized actions

**Mitigation**:
- ✅ X-Frame-Options: DENY in CSP
- ✅ frame-ancestors: 'none' in CSP
- ✅ Extension pages cannot be iframed (Chrome protection)
- ✅ Tab opens in new window (not iframe-able)

### 5.7 Tab Nabbing

**Scenario**: Malicious page opened from wallet tab navigates back to steal data

**Severity**: MEDIUM
**Likelihood**: Very Low (we don't open external links)
**Impact**: Phishing, data theft

**Mitigation**:
- ✅ All external links open with rel="noopener noreferrer"
- ✅ No window.opener reference available
- ✅ Minimal external link usage
- ✅ Warning before opening external links

---

## 6. Mitigation Strategies

### 6.1 Defense in Depth Layers

**Layer 1: Browser Security**
- ✅ Chrome extension sandbox
- ✅ Manifest V3 security features
- ✅ Content Security Policy (CSP)

**Layer 2: Encryption at Rest**
- ✅ AES-256-GCM encrypted seed phrase
- ✅ Strong password requirements
- ✅ Secure key derivation (PBKDF2, 100k iterations)

**Layer 3: Runtime Protection**
- ✅ In-memory only decrypted keys
- ✅ Auto-lock after 15 minutes inactivity
- ✅ No persistent decrypted data
- ✅ Memory clearing on lock

**Layer 4: Communication Security**
- ✅ Message source validation
- ✅ HTTPS for all API calls
- ✅ Input validation and sanitization

**Layer 5: User Education**
- ✅ Clear security warnings
- ✅ Seed phrase backup instructions
- ✅ Phishing awareness tips
- ✅ Best practices documentation

### 6.2 Transaction Security Controls

**Confirmation Dialog Requirements**:
- ✅ Show full recipient address
- ✅ Show exact amount in BTC and fiat
- ✅ Show estimated fee (sat/vB and total)
- ✅ Show remaining balance after transaction
- ✅ Require explicit confirmation (no auto-confirm)
- ✅ No timeout auto-confirm

**Address Validation**:
- ✅ Validate format before accepting
- ✅ Checksum verification
- ✅ Network matching (testnet vs mainnet)
- ✅ Warn if address previously used (privacy)

**Amount Validation**:
- ✅ Check for positive amounts
- ✅ Verify sufficient balance (including fee)
- ✅ Warn on large transactions (>0.1 BTC)
- ✅ Prevent dust outputs

**Fee Reasonability**:
- ✅ Compare against Blockstream API estimates
- ✅ Warn if fee > 10% of amount
- ✅ Show fee in multiple units (sat/vB, BTC, fiat)
- ✅ Allow fee customization with warnings

### 6.3 Phishing Protection Controls

**User Education**:
- ✅ "NEVER share seed phrase" warning on setup
- ✅ "No support will ask for seed phrase" message
- ✅ Phishing awareness tips in settings
- ✅ Report phishing feature (future)

**UI Consistency**:
- ✅ Consistent branding and design
- ✅ No external links in critical flows
- ✅ Clear extension identity
- ✅ Extension icon always visible

**Seed Phrase Handling**:
- ✅ Never auto-copy to clipboard
- ✅ Manual reveal required (click each word)
- ✅ Confirmation checkbox: "I wrote down my seed phrase"
- ✅ Warning about screenshots and screen recording

---

## 7. Security Testing Scenarios

### 7.1 Penetration Test Scenarios

**Scenario 1: Encrypted Storage Extraction**
- Objective: Extract and decrypt seed phrase from chrome.storage.local
- Method: Access storage, attempt offline brute force
- Success Criteria: Cannot decrypt within 1 week with modern GPU
- Status: ✅ PASS (100k PBKDF2 iterations + strong password)

**Scenario 2: Memory Extraction**
- Objective: Extract seed phrase from service worker memory
- Method: Browser DevTools, memory dumps, heap inspection
- Success Criteria: Seed phrase not found 15 min after last activity
- Status: ✅ PASS (auto-lock clears memory)

**Scenario 3: Message Injection**
- Objective: Send malicious messages to service worker
- Method: Malicious extension, console commands
- Success Criteria: Messages rejected or sanitized
- Status: ✅ PASS (sender validation)

**Scenario 4: Transaction Manipulation**
- Objective: Modify transaction before signing
- Method: Intercept and modify message payloads
- Success Criteria: Manipulation detected and prevented
- Status: ✅ PASS (confirmation dialog, validation)

**Scenario 5: XSS Injection**
- Objective: Inject malicious scripts into UI
- Method: Crafted addresses, amounts, account names
- Success Criteria: Scripts not executed
- Status: ✅ PASS (CSP, React escaping, input sanitization)

**Scenario 6: Phishing Simulation**
- Objective: Trick user into revealing seed phrase
- Method: Fake UI, social engineering
- Success Criteria: User educated and suspicious
- Status: ⚠️ ONGOING (user education)

### 7.2 Fuzzing Targets

**Password Input**:
- Special characters, very long strings (>1000 chars)
- Unicode characters, emoji
- SQL injection attempts
- Script injection attempts

**Address Input**:
- Malformed addresses
- Wrong network addresses
- SQL/XSS injection attempts
- Very long strings

**Amount Input**:
- Scientific notation
- Negative numbers
- Very large numbers (overflow)
- Non-numeric inputs

**Message Payloads**:
- Malformed JSON
- Very large payloads (>1MB)
- Missing required fields
- Type mismatches

---

## Cross-References

- [Encryption](./encryption.md) - Encryption implementation details
- [Key Management](./key-management.md) - Key storage and lifecycle
- [Audits](./audits.md) - Security audit findings
- [Decisions](./decisions.md) - Security architecture decisions

---

**Document Changelog:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-22 | 1.0 | Initial threat-model.md segmentation from security-expert-notes.md | Security Expert |
