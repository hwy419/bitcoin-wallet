# Security Architecture Decisions

**Last Updated**: October 22, 2025
**Status**: Active - Ongoing Documentation
**Quick Nav**: [INDEX](./_INDEX.md) | [Encryption](./encryption.md) | [Threat Model](./threat-model.md)

---

## Table of Contents

1. [Decision Records (ADRs)](#1-decision-records-adrs)
2. [Cryptography Decisions](#2-cryptography-decisions)
3. [Architecture Decisions](#3-architecture-decisions)
4. [Security vs UX Trade-offs](#4-security-vs-ux-trade-offs)
5. [Open Questions](#5-open-questions)
6. [Future Enhancements](#6-future-enhancements)

---

## 1. Decision Records (ADRs)

### ADR-001: AES-256-GCM for Seed Phrase Encryption

**Status**: ACCEPTED
**Date**: 2025-10-12
**Deciders**: Security Expert, Backend Developer

**Context**:
Need to encrypt seed phrases for storage. Multiple encryption algorithms available (AES-CBC, AES-GCM, ChaCha20-Poly1305).

**Decision**:
Use AES-256-GCM (Galois/Counter Mode) for all wallet encryption.

**Rationale**:
1. **Authenticated Encryption**: Provides both confidentiality and integrity
2. **Browser Native**: Web Crypto API has native support (no external dependencies)
3. **Industry Standard**: Widely used and audited
4. **Performance**: Hardware acceleration on most platforms
5. **Padding Oracle Resistance**: GCM mode immune to padding oracle attacks
6. **AEAD**: Authentication tag prevents tampering

**Alternatives Considered**:
- **AES-CBC**: Rejected (no authentication, vulnerable to padding oracle)
- **ChaCha20-Poly1305**: Rejected (no Web Crypto API support, requires library)
- **AES-SIV**: Rejected (no Web Crypto API support)

**Consequences**:
- ✅ Strong security guarantees
- ✅ No external crypto dependencies
- ✅ Good performance
- ⚠️ IV reuse is catastrophic (mitigated by unique IV per operation)

**References**:
- [encryption.md](./encryption.md) - Full implementation details
- NIST SP 800-38D (GCM specification)

---

### ADR-002: PBKDF2 with 100,000 Iterations

**Status**: ACCEPTED
**Date**: 2025-10-12
**Deciders**: Security Expert

**Context**:
Need to derive encryption key from user password. Must balance security (iterations) with performance (unlock speed).

**Decision**:
Use PBKDF2-HMAC-SHA256 with 100,000 iterations.

**Rationale**:
1. **OWASP Minimum**: 100,000 iterations is OWASP minimum recommendation as of 2025
2. **Acceptable UX**: ~500-1000ms unlock time on modern hardware
3. **Web Crypto API**: Native browser support
4. **Proven Security**: PBKDF2 is well-studied and trusted
5. **Upgradeable**: Version field allows future iteration increases

**Alternatives Considered**:
- **Argon2id**: Rejected for MVP (no Web Crypto API support, requires library)
- **scrypt**: Rejected (no Web Crypto API support)
- **250,000+ iterations**: Considered for future versions (better security, slower unlock)

**Trade-offs**:
| Iterations | Security | Unlock Time | Decision |
|-----------|----------|-------------|----------|
| 10,000    | LOW      | ~100ms      | Too weak |
| 100,000   | MEDIUM   | ~500ms      | ✅ Chosen |
| 250,000   | HIGH     | ~1.2s       | Future upgrade |
| 500,000   | VERY HIGH| ~2.5s       | Too slow for MVP |

**Consequences**:
- ✅ Meets current security standards
- ✅ Acceptable user experience
- ✅ Upgradeable via version field
- ⚠️ Not as resistant to GPU attacks as Argon2id

**Migration Path**:
- v1: 100,000 iterations (current)
- v2: 250,000 iterations (planned)
- v3: Argon2id (when Web Crypto API supports it)

**References**:
- [encryption.md](./encryption.md) - Key derivation implementation
- OWASP Password Storage Cheat Sheet

---

### ADR-003: 15-Minute Auto-Lock Timeout

**Status**: ACCEPTED
**Date**: 2025-10-12
**Deciders**: Security Expert, Product Manager, UI/UX Designer

**Context**:
Wallet must auto-lock after inactivity to prevent unauthorized access. Need to balance security (shorter timeout) with UX (longer timeout).

**Decision**:
Auto-lock after 15 minutes of inactivity. Configurable in settings (future).

**Rationale**:
1. **Security**: 15 minutes limits exposure window
2. **UX Balance**: Long enough for typical tasks, short enough for security
3. **Industry Standard**: Similar to MetaMask and other wallets
4. **User Control**: Manual lock always available

**Alternatives Considered**:
- **5 minutes**: Rejected (too frequent, poor UX)
- **30 minutes**: Rejected (too long, security risk)
- **No auto-lock**: Rejected (unacceptable security risk)

**User Scenarios**:
| Scenario | 5 min | 15 min | 30 min |
|----------|-------|--------|--------|
| Quick transaction | ✅ Good | ✅ Good | ✅ Good |
| Multiple transactions | ❌ Annoying | ✅ Good | ✅ Good |
| Wallet left open | ✅ Good | ⚠️ OK | ❌ Risk |

**Consequences**:
- ✅ Acceptable security/UX balance
- ✅ Industry-standard behavior
- ✅ User can manually lock anytime
- ⚠️ 15 min exposure if wallet left open (mitigated by user education)

**Future Enhancement**:
- Make timeout configurable (5, 15, 30, 60 minutes)
- Add "lock on system sleep" option
- Add biometric unlock for convenience

**References**:
- [key-management.md](./key-management.md) - Auto-lock implementation

---

### ADR-004: No Password Recovery Mechanism

**Status**: ACCEPTED
**Date**: 2025-10-12
**Deciders**: Security Expert, Product Manager

**Context**:
Users may forget passwords. Need to decide: implement password recovery or require seed phrase for recovery.

**Decision**:
NO password recovery mechanism. Only seed phrase can recover wallet.

**Rationale**:
1. **Security First**: Password recovery = security backdoor
2. **No Centralization**: No server to store recovery data
3. **Self-Custody**: Users fully responsible (no intermediary)
4. **Industry Standard**: Bitcoin wallets don't have password recovery
5. **Clear Warning**: Users warned during setup

**Alternatives Considered**:
- **Email Recovery**: Rejected (introduces centralized attack vector)
- **Security Questions**: Rejected (weak, easily guessed/phished)
- **SMS Recovery**: Rejected (SIM swapping attacks)
- **Social Recovery**: Considered for future (Shamir's Secret Sharing)

**Consequences**:
- ✅ No password recovery backdoor
- ✅ True self-custody
- ✅ No centralized attack vector
- ⚠️ Users MUST backup seed phrase (user education critical)

**User Education Required**:
```
WARNING on wallet creation:
"If you forget your password, the ONLY way to recover your wallet is
with your seed phrase. Write it down and store it securely.

WITHOUT your seed phrase, your funds are PERMANENTLY LOST."
```

**References**:
- [key-management.md](./key-management.md) - Password policy

---

### ADR-005: Tab-Based Architecture (Migration from Popup)

**Status**: ACCEPTED
**Date**: 2025-10-18
**Deciders**: Security Expert, Frontend Developer, UI/UX Designer, Product Manager

**Context**:
Original 600x400 popup too small for multisig UI. Need to decide: stay with popup or migrate to full tab.

**Decision**:
Migrate to full browser tab architecture with single tab enforcement.

**Rationale**:
1. **UX Improvement**: More screen space for complex UIs (multisig, charts, detailed transaction views)
2. **Security Enhancement**: Can implement stronger controls (session tokens, visibility-based locking)
3. **Maintainability**: Single codebase (no popup vs tab variants)
4. **Feature Enablement**: Enables future features (charts, contacts, advanced settings)

**Security Considerations**:

**New Attack Vectors**:
- ⚠️ Tab persistence → Mitigated by auto-lock on visibility
- ⚠️ Multiple tabs → Mitigated by single tab enforcement
- ⚠️ Iframe embedding → Mitigated by CSP + runtime checks
- ⚠️ Tab nabbing → Mitigated by noopener/noreferrer
- ⚠️ Session confusion → Mitigated by session tokens

**Enhanced CSP**:
- Added `frame-ancestors 'none'` (clickjacking prevention)
- Added `form-action 'none'` (form hijacking prevention)
- Added `base-uri 'self'` (URL manipulation prevention)

**Single Tab Enforcement**:
- 256-bit session tokens (cryptographically secure)
- Automatic revocation of old tab sessions
- Validation every 5 seconds
- Lock on visibility change

**Alternatives Considered**:
- **Stay with Popup**: Rejected (UX limitations)
- **Popup + Tab Hybrid**: Rejected (complexity, confusion)
- **Multiple Tabs Allowed**: Rejected (state synchronization nightmare)

**Consequences**:
- ✅ Better UX (more space)
- ✅ Stronger security controls
- ✅ Enables advanced features
- ✅ Simpler codebase
- ⚠️ Larger attack surface (mitigated)
- ⚠️ Users may leave tab open longer (auto-lock mitigates)

**Security Audit Result**: ✅ APPROVED (see audits.md)

**References**:
- [audits.md](./audits.md) - Tab architecture security review
- [threat-model.md](./threat-model.md) - Tab-specific threats

---

### ADR-006: Password-Derived Encryption for Imported Accounts

**Status**: ACCEPTED
**Date**: 2025-10-18
**Deciders**: Security Expert, Backend Developer

**Context**:
Imported accounts (via WIF or seed phrase) need encryption. Initial implementation used seed-derived key (CRITICAL vulnerability if main seed compromised).

**Decision**:
Use password-derived encryption key (same PBKDF2 as main wallet) for all imported accounts.

**Rationale**:
1. **No Cascading Compromise**: If main seed leaked, imported accounts still protected by password
2. **Consistent Security Model**: All accounts protected by same password barrier
3. **Defense in Depth**: Password must still be cracked even if seed compromised
4. **Already Implemented**: PBKDF2 key derivation already exists for main wallet

**Original Approach (REJECTED)**:
```typescript
// WRONG: Derived key from main seed
const key = deriveKeyFromSeed(mainSeed);
const encrypted = encrypt(importedPrivateKey, key);
```

**Problem**: If main seed compromised (e.g., phishing), ALL imported accounts immediately compromised.

**New Approach (CORRECT)**:
```typescript
// CORRECT: Derived key from password
const key = deriveKeyFromPassword(password, salt, 100000);
const encrypted = encrypt(importedPrivateKey, key);
```

**Benefit**: If main seed compromised, imported accounts still require password cracking (100k PBKDF2 iterations).

**Consequences**:
- ✅ No cascading compromise
- ✅ Consistent security model
- ✅ Same unlock flow (password required)
- ⚠️ Encryption key in memory while unlocked (mitigated by auto-lock)

**Security Audit Result**: ✅ CRITICAL FIX APPROVED

**References**:
- [audits.md](./audits.md) - Account import security audit
- [encryption.md](./encryption.md) - encryptWithKey implementation

---

### ADR-007: Export Features Security Architecture

**Status**: ACCEPTED
**Date**: 2025-10-26
**Deciders**: Security Expert, Product Manager, UI/UX Designer

**Context**:
Need to implement three export features (xpub, private key, full backup) with different security/risk profiles. Must balance user control with fund security.

**Decision**:
Implement three-tiered export system with risk-appropriate security measures:
1. **Xpub Export**: No encryption (public data), privacy warnings only
2. **Private Key Export**: Optional encryption (210K iterations), comprehensive warnings
3. **Full Backup Export**: Mandatory encryption (600K iterations), highest security

**Rationale**:
1. **Risk-Based Security**: Security measures proportional to risk (privacy < account < wallet)
2. **User Choice**: Allow users to choose appropriate tool for their needs
3. **Standards Compliance**: Meet OWASP 2025 recommendations
4. **Interoperability**: xpub and WIF are industry standards

**Implementation Priority**:
1. **Phase 1**: Xpub export (2 days, lowest risk, highest value)
2. **Phase 2**: Private key export/import (3 weeks, medium risk)
3. **Phase 3**: Full backup export/restore (4 weeks, highest security)

**Security Measures by Feature**:

**Xpub Export**:
- No encryption (public data by design)
- Privacy warning (address correlation risk)
- Simple text file format
- Hidden for imported accounts (no xpub)

**Private Key Export**:
- Optional encryption (user choice with strong warnings)
- 210K PBKDF2 iterations (updated from 100K)
- Network validation (REJECT mainnet keys on testnet wallet)
- "Extra scary" warning for plaintext export
- WIF never displayed in UI (only in downloaded file)
- Memory clearing after operations

**Full Backup Export**:
- Mandatory separate password (12+ characters)
- 600K PBKDF2 iterations (exceeds standards)
- HMAC signature for integrity (defense in depth)
- Non-dismissible progress modal
- 5-step confirmation flow
- Checksum verification

**Alternatives Considered**:
- **Single Export Type**: Rejected (doesn't meet all use cases)
- **All Mandatory Encryption**: Rejected (xpub is public data, over-engineering)
- **All Optional Encryption**: Rejected (backup too critical, users make poor choices)

**Consequences**:
- ✅ Flexible (users choose appropriate tool)
- ✅ Standards-compliant (OWASP 2025)
- ✅ Risk-appropriate security
- ✅ Interoperable (xpub, WIF are standards)
- ⚠️ More features to test and maintain

**Security Reviews**:
- [x] Threat analysis completed
- [x] Encryption parameters reviewed
- [x] User education requirements defined
- [x] Implementation priority established

**References**:
- `prompts/docs/plans/EXPORT_FEATURES_SECURITY_REVIEW.md` - Full security analysis (10,000+ words)
- `prompts/docs/plans/EXPORT_FEATURES_SUMMARY.md` - Executive summary
- `prompts/docs/plans/PRIVATE_KEY_EXPORT_IMPORT_SECURITY_SPEC.md` - Private key security spec

---

### ADR-008: PBKDF2 Iteration Count Updates (2025)

**Status**: ACCEPTED
**Date**: 2025-10-26
**Deciders**: Security Expert

**Context**:
OWASP updated PBKDF2 recommendations in January 2025. Current implementation uses 100K iterations (2023 recommendation). Need to update to current standards.

**Decision**:
Update PBKDF2 iterations to meet OWASP 2025 standards:
- **Wallet unlock**: 100K → 120K iterations
- **Private key export**: 100K (spec) → 210K iterations
- **Full backup export**: 600K iterations (already exceeds standard)

**Rationale**:

**OWASP 2025 Guidance**:
- Password verification: 120,000 iterations (minimum)
- File encryption: 210,000 iterations (recommended)
- High-security backups: 600,000+ iterations (maximum security)

**Why Update**:
1. **GPU Performance**: Modern GPUs significantly faster than 2023
2. **Standards Compliance**: Meet current industry best practices
3. **Future-Proofing**: Won't need update for 2-3 years
4. **Proportional Security**: Higher iterations for higher-risk operations

**Performance Impact**:

| Operation | Old | New | Impact | Acceptable? |
|-----------|-----|-----|--------|-------------|
| Wallet unlock | 100K (~500ms) | 120K (~600ms) | +100ms | ✅ Yes (frequent but acceptable) |
| Private key export | 100K (~500ms) | 210K (~1,050ms) | +550ms | ✅ Yes (infrequent operation) |
| Full backup | 600K (~3s) | 600K (~3s) | None | ✅ Already sufficient |

**Trade-offs**:

**Benefits**:
- ✅ Stronger brute force protection (2.1x for file encryption)
- ✅ Standards-compliant with OWASP 2025
- ✅ Better resistance to GPU cracking
- ✅ Future-proof for 2-3 years

**Costs**:
- ⚠️ Slightly slower unlock (~100ms additional)
- ⚠️ Slightly slower export (~550ms additional)
- ⚠️ Migration needed for existing wallets (future)

**Migration Strategy**:
- New wallets: Use updated iterations immediately
- Existing wallets: Keep current iterations (backward compatibility)
- Future: Optional "upgrade security" flow to re-encrypt with higher iterations

**Version Field**:
All encrypted data includes version field for crypto agility:
```typescript
interface EncryptedData {
  version: 1;        // v1: 100K iterations
  // version: 2;     // v2: 120K/210K iterations (future)
  salt: string;
  iv: string;
  ciphertext: string;
}
```

**Consequences**:
- ✅ Meet 2025 security standards
- ✅ Proportional security (unlock < export < backup)
- ✅ Crypto agility (version field allows future upgrades)
- ⚠️ Slightly longer unlock time (acceptable trade-off)

**Alternatives Considered**:
- **No update**: Rejected (below current standards)
- **Update to 500K for all**: Rejected (too slow for wallet unlock)
- **Argon2id**: Rejected (no Web Crypto API support yet)

**References**:
- OWASP Password Storage Cheat Sheet (January 2025)
- `EXPORT_FEATURES_SECURITY_REVIEW.md` - Iteration count analysis

---

## 2. Cryptography Decisions

### 2.1 Why Web Crypto API (Not Libraries)

**Decision**: Use Web Crypto API for all cryptographic operations

**Rationale**:
- ✅ Browser-native (no dependencies)
- ✅ Hardware-accelerated
- ✅ Audited by browser vendors
- ✅ Mandatory in all modern browsers
- ✅ Type-safe with TypeScript

**Rejected Alternatives**:
- CryptoJS: Deprecated, pure JavaScript (slow)
- node-crypto: Node.js only, not browser
- TweetNaCl: Good library but adds dependency

**Exception**: bitcoinjs-lib uses WASM for Bitcoin operations (acceptable - trusted library)

### 2.2 Why 32-byte Salt and 12-byte IV

**Salt Size Decision**: 32 bytes (256 bits)

**Rationale**:
- Exceeds minimum recommendation (16 bytes)
- Matches key size (256 bits)
- Extra security margin
- No performance penalty

**IV Size Decision**: 12 bytes (96 bits)

**Rationale**:
- Recommended size for AES-GCM
- NIST SP 800-38D specification
- Optimal performance
- Unique per operation (never reused)

### 2.3 Why Not Custom Cryptography

**Decision**: NEVER implement custom crypto

**Rationale**:
- "Don't roll your own crypto" - security maxim
- Easy to make mistakes
- Existing implementations audited
- No security benefit, only risk

**Policy**: All crypto operations use Web Crypto API or trusted libraries (bitcoinjs-lib, bip39, bip32)

---

## 3. Architecture Decisions

### 3.1 Service Worker vs Background Page

**Decision**: Use Service Worker (Manifest V3 requirement)

**Rationale**:
- Manifest V3 mandatory (Chrome requirement)
- Service workers more secure (isolated)
- Forces proper state management (no persistence)
- Better for battery life (terminates when idle)

**Trade-off**: Service worker can terminate anytime (requires state reconstruction)

**Mitigation**: Encrypted seed in storage, re-decrypt on unlock

### 3.2 Storage: chrome.storage.local vs IndexedDB

**Decision**: Use chrome.storage.local for all wallet data

**Rationale**:
- ✅ Extension-isolated (other extensions can't access)
- ✅ Simple API (get/set/remove)
- ✅ Automatic sync to disk
- ✅ Quota: 10MB (generous for wallet)
- ✅ No SQL injection risk

**Rejected Alternative**:
- IndexedDB: More complex, not needed for wallet size

### 3.3 React for UI vs Vanilla JavaScript

**Decision**: Use React for all UI components

**Rationale**:
- ✅ Automatic XSS protection (JSX escaping)
- ✅ Component reusability
- ✅ State management (Context)
- ✅ Developer productivity
- ✅ Large ecosystem

**Security Benefit**: React automatically escapes content, preventing XSS

**Policy**: NEVER use dangerouslySetInnerHTML

---

## 4. Security vs UX Trade-offs

### 4.1 Security Prioritization Framework

When security and UX conflict, use this framework:

**P0 - Security Wins** (No Compromise):
- Private key/seed phrase protection
- Encryption strength
- Password requirements (minimum)
- Auto-lock (must exist, timeout debatable)

**P1 - Balance** (Optimize Both):
- Auto-lock timeout (15 min chosen)
- Password strength indicator (help without forcing)
- Transaction confirmation (clear but not excessive)

**P2 - UX Wins** (Security Acceptable):
- Number of confirmation clicks
- UI polish and animations
- Feature richness (as long as security maintained)

### 4.2 Specific Trade-off Decisions

#### Auto-Lock vs Always Available

**Trade-off**: Auto-lock (security) vs always-unlocked (convenience)
**Decision**: Auto-lock wins (15 min timeout)
**Rationale**: Security > convenience for financial app

#### Password Strength vs Ease of Entry

**Trade-off**: Strong password requirement vs easy password
**Decision**: Minimum requirements + recommendations
**Rationale**: Enforce minimums, educate for better

#### Transaction Confirmation vs Speed

**Trade-off**: Confirmation dialog vs instant send
**Decision**: Always confirm
**Rationale**: User error prevention critical

#### Seed Phrase Backup vs Quick Setup

**Trade-off**: Mandatory backup vs skip for later
**Decision**: Mandatory confirmation checkbox
**Rationale**: Fund loss prevention critical

### 4.3 UX Improvements That Maintain Security

**Acceptable UX Enhancements**:
- ✅ Password strength indicator (helps users choose better passwords)
- ✅ Copy buttons for addresses (convenience, no security risk)
- ✅ QR codes for addresses (convenience, public data anyway)
- ✅ Transaction history (public blockchain data)
- ✅ Dark mode (no security impact)

**Rejected UX Requests**:
- ❌ "Remember me" / persistent unlock (defeats auto-lock)
- ❌ Seed phrase auto-copy (clipboard hijacking risk)
- ❌ Skip seed phrase backup (fund loss risk)
- ❌ Biometric unlock without password (future consideration)

---

## 5. Open Questions

### 5.1 Rate Limiting for Password Attempts

**Question**: Should we implement rate limiting for password attempts?

**Arguments For**:
- ✅ Prevents brute force attacks on unlock
- ✅ Industry best practice
- ✅ Minimal UX impact (rare to fail multiple times)

**Arguments Against**:
- ⚠️ Legitimate user lockout (forgot password)
- ⚠️ Complexity in extension environment (no server)
- ⚠️ Can be bypassed (user can reload extension)

**Current Status**: NOT IMPLEMENTED
**Future Consideration**: v2.0 after MVP feedback

**Possible Implementation**:
```typescript
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

interface FailedAttempts {
  count: number;
  lockedUntil: number | null;
}
```

### 5.2 Hardware Wallet Integration

**Question**: Should we support hardware wallets (Ledger, Trezor)?

**Arguments For**:
- ✅ Better security (keys never on computer)
- ✅ User demand (common request)
- ✅ Industry standard for high-value wallets

**Arguments Against**:
- ⚠️ Complexity (device communication, drivers)
- ⚠️ Limited testnet support
- ⚠️ Not all users have hardware wallets
- ⚠️ Maintenance burden

**Current Status**: NOT PLANNED FOR MVP
**Future Consideration**: Phase 6+ (mainnet focus)

### 5.3 Multi-Device Sync with E2E Encryption

**Question**: Should we support wallet sync across devices?

**Arguments For**:
- ✅ User convenience (desktop + mobile)
- ✅ Backup benefit
- ✅ Competitive feature

**Arguments Against**:
- ⚠️ Complexity (sync protocol, conflict resolution)
- ⚠️ Security risk (encrypted data in cloud)
- ⚠️ Seed phrase already provides portability
- ⚠️ Attack surface expansion

**Current Status**: NOT PLANNED
**Alternative**: User manually imports seed phrase on new device

### 5.4 Private Key Export Feature

**Question**: Should we allow exporting individual private keys?

**Arguments For**:
- ✅ User control (their keys)
- ✅ Advanced use cases (sweep to other wallet)
- ✅ Migration flexibility

**Arguments Against**:
- ⚠️ Security risk (key exposure)
- ⚠️ User confusion (which key?)
- ⚠️ Seed phrase already provides this

**Current Decision**: IMPLEMENTED (v0.10.0)
- WIF export per account
- Strong warnings in UI
- Password confirmation required
- Optional password protection on export

**Status**: ✅ IMPLEMENTED with security safeguards

---

## 6. Future Enhancements

### 6.1 Short-term (v1.1 - Post-MVP)

**Increase PBKDF2 Iterations**:
- From: 100,000
- To: 250,000
- Why: Better security, hardware is faster
- Impact: ~1.2s unlock time (acceptable)

**Biometric Authentication**:
- Fingerprint/Face unlock (if browser supports)
- Password still required for backup
- Convenience feature, not security replacement

**Transaction Rate Limiting**:
- Prevent rapid transaction spam
- User education on suspicious activity

### 6.2 Medium-term (v2.0 - Mainnet)

**Hardware Wallet Support**:
- Ledger integration
- Trezor integration
- Keys never on computer

**Multi-Signature Enhancements**:
- 3-of-5, 4-of-7 configurations
- Institutional co-signer support
- Hardware wallet co-signers

**Cold Storage Integration**:
- Watch-only wallets
- PSBT signing on air-gapped device

**Enhanced Phishing Protection**:
- Domain verification
- Anti-phishing codes
- Transaction fingerprinting

**External Security Audit**:
- Hire professional security firm
- Penetration testing
- Bug bounty program

### 6.3 Long-term (v3.0 - Advanced)

**Argon2id Migration**:
- Upgrade from PBKDF2 to Argon2id
- Better ASIC resistance
- Memory-hard algorithm

**Post-Quantum Cryptography**:
- When NIST standards finalized
- Hybrid classical + post-quantum
- Future-proof against quantum computers

**Lightning Network Support**:
- Layer 2 scaling
- Instant transactions
- Enhanced privacy

**Taproot Support**:
- Schnorr signatures
- Advanced scripting
- Privacy improvements

**Advanced Fee Optimization**:
- CPFP (Child Pays For Parent)
- RBF (Replace-By-Fee)
- Coin selection optimization

**Multi-Wallet Support**:
- Multiple wallets in one extension
- Wallet switching
- Separate passwords per wallet

---

## Cross-References

- [Encryption](./encryption.md) - Cryptographic decisions implementation
- [Key Management](./key-management.md) - Key storage decisions
- [Threat Model](./threat-model.md) - Security decisions rationale
- [Audits](./audits.md) - Decision validation through audits

---

**Document Changelog:**

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-22 | 1.0 | Initial decisions.md segmentation from security-expert-notes.md | Security Expert |
