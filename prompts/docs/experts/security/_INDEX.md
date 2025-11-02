# Security Expert - Quick Reference

**Last Updated**: October 22, 2025
**Role**: Security Expert
**Purpose**: Encryption, key management, threat modeling, security audits

---

## Current Status

### Implemented ✅
- AES-256-GCM encryption for seed phrases
- PBKDF2 key derivation (100,000 iterations)
- Auto-lock after 15 minutes inactivity
- WIF private key encryption (optional password protection)
- Chrome storage encryption
- Secure memory handling (clear sensitive data)

### In Progress ⏳
- Privacy enhancement security review

### Planned 📋
- Hardware wallet integration
- Biometric authentication
- Multi-device sync with E2E encryption

---

## Documentation Map

- [**encryption.md**](./encryption.md) - AES-256-GCM, PBKDF2, key derivation
- [**key-management.md**](./key-management.md) - Storage, handling, lifecycle
- [**threat-model.md**](./threat-model.md) - Attack vectors, mitigations
- [**audits.md**](./audits.md) - Security audit reports
- [**decisions.md**](./decisions.md) - Security ADRs

---

## Recent Changes (Last 5)

1. **2025-10-26**: Export features security review (xpub, private key, full backup)
2. **2025-10-26**: PBKDF2 iteration count updates (OWASP 2025 compliance)
3. **2025-10-22**: Privacy enhancement security review
4. **2025-10-18**: WIF export encryption implementation
5. **2025-10-15**: Multisig PSBT security audit

---

## Quick Reference

### Encryption Parameters
```
Algorithm: AES-256-GCM
Key Derivation: PBKDF2-HMAC-SHA256

Current (v1):
- Wallet unlock: 100,000 iterations
- Private key export: 100,000 iterations (spec)
- Salt: 16-32 bytes (random)

Recommended Updates (v2) - OWASP 2025:
- Wallet unlock: 120,000 iterations (+20K)
- Private key export: 210,000 iterations (+110K)
- Full backup: 600,000 iterations (already exceeds standard)

IV: 12 bytes (random per encryption)
Auth Tag: 16 bytes
```

### Critical Security Rules
1. NEVER log private keys or seed phrases
2. NEVER implement custom cryptography
3. ALWAYS validate addresses before transactions
4. ALWAYS clear sensitive data from memory
5. ALWAYS use Web Crypto API (not libraries)

---

**Need detailed information?** Navigate to the specific documentation files linked above.
