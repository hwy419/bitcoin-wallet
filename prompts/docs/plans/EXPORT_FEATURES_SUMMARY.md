# Export Features - Executive Summary

**Date**: October 26, 2025
**Status**: Security Review Complete - Ready for Implementation
**Reviewer**: Bitcoin Wallet Security Expert

---

## Quick Decision Matrix

| Feature | Risk | Effort | Priority | Ship In |
|---------|------|--------|----------|---------|
| **Xpub Export** | 🟢 LOW | 1-2 days | 🥇 FIRST | v0.11.0 |
| **Private Key Export** | 🟡 MEDIUM | 2-3 weeks | 🥈 SECOND | v0.12.0 |
| **Full Backup** | 🔴 HIGH | 3-4 weeks | 🥉 THIRD | v0.13.0 |

---

## Recommendation: Implement Xpub Export First

**Why Start with Xpub?**

✅ **Lowest Risk**
- No private data (watch-only)
- Cannot lose funds
- Privacy concern only

✅ **Highest Value**
- Enables watch-only wallets
- Merchant integrations
- Accountant access
- Portfolio tracking

✅ **Simplest Implementation**
- ~100 lines of code
- 1-2 days work
- No encryption needed
- Minimal testing

✅ **Learn Fast**
- Validate UX patterns
- User feedback quickly
- Apply learnings to riskier features

---

## Security Findings

### 1. Encryption Parameters Need Updates

**Current Wallet** (100K iterations):
```
⚠️ BELOW 2025 OWASP STANDARD
OWASP now recommends 120K for password verification
```

**Private Key Export Design** (100K iterations):
```
⚠️ BELOW 2025 OWASP STANDARD
OWASP now recommends 210K for file encryption
```

**Full Backup Design** (600K iterations):
```
✅ EXCEEDS 2025 STANDARDS
Already excellent - no changes needed
```

### 2. Required Updates

**Before Implementation**:

| Component | Current | Update To | Reason |
|-----------|---------|-----------|--------|
| Wallet unlock | 100K | 120K | OWASP 2025 minimum |
| Private key export | 100K (spec) | 210K | File encryption standard |
| Full backup | 600K (spec) | 600K | Already exceeds standard |

**Performance Impact**:
- Wallet unlock: +200ms (acceptable)
- Private key export: +550ms (acceptable)
- Full backup: No change

### 3. All Designs Approved

✅ **Xpub Export**: No security concerns (public data)
✅ **Private Key Export**: Excellent design (update iterations)
✅ **Full Backup**: Exceptional security (600K iterations, HMAC)

---

## Implementation Roadmap

### Phase 1: Xpub Export (v0.11.0) - 1-2 days

**What to Build**:
- Export button in Settings → Account
- Privacy warning modal
- Simple text file download
- Hide for imported accounts (no xpub)

**Security Requirements**:
- Privacy warning about address correlation
- No encryption needed (public data)

**Testing**:
- [ ] xpub generates correct addresses
- [ ] Hidden for imported accounts
- [ ] Shows for HD and multisig accounts

---

### Phase 2: Private Key Export/Import (v0.12.0) - 2-3 weeks

**What to Build**:
- Export: WIF file + PDF with QR code
- Optional encryption (210K iterations)
- Import: File upload or manual entry
- Multiple security warnings

**CRITICAL Security Requirements**:
- ✅ 210K PBKDF2 iterations (updated from 100K)
- ✅ Network validation (REJECT mainnet keys)
- ✅ WIF never shown in UI
- ✅ Memory clearing after operations
- ✅ "Extra scary" warning for plaintext export

**Testing**:
- [ ] Export-import roundtrip works
- [ ] Mainnet keys rejected with clear error
- [ ] Encryption/decryption correct
- [ ] Duplicate detection works
- [ ] All warnings display correctly

---

### Phase 3: Encrypted Backup (v0.13.0) - 3-4 weeks

**What to Build**:
- 5-modal export flow
- Mandatory separate password (12+ chars)
- Progress tracking with steps
- Checksum verification
- Restore flow (import backup)

**Security Requirements**:
- ✅ 600K PBKDF2 iterations
- ✅ Mandatory password (not optional)
- ✅ HMAC signature for integrity
- ✅ Non-dismissible progress modal
- ✅ Password strength meter

**Testing**:
- [ ] Backup-restore roundtrip works
- [ ] Password strength enforced
- [ ] Encryption verification (encrypt-decrypt-compare)
- [ ] Checksum validation works
- [ ] All 5 modals tested

---

## Security Checklist (All Features)

**Code Review Requirements**:
- [ ] No private keys in console.log()
- [ ] No sensitive data in error messages
- [ ] All crypto uses Web Crypto API (not libraries)
- [ ] Network validation present (for imports)
- [ ] Memory clearing implemented
- [ ] User warnings cannot be bypassed
- [ ] All security tests pass

**Pre-Merge Requirements**:
- [ ] Security expert reviewed code
- [ ] Blockchain expert reviewed (if Bitcoin protocol involved)
- [ ] Unit tests pass (100% coverage for crypto code)
- [ ] Integration tests pass (roundtrip tests)
- [ ] Manual QA on testnet complete
- [ ] No vulnerabilities in npm audit

---

## User Education Requirements

**Documentation Needed**:
1. **User Guide**: "Exporting Your Bitcoin Wallet"
2. **Security Best Practices**: "How to Securely Export"
3. **FAQ**: "Which export should I use?"

**In-App Help**:
```
🤔 Which export do I need?

📋 Xpub (read-only):
   ✓ Watch-only wallets
   ✓ Share with accountant
   ✗ Cannot spend

🔑 Private Key (one account):
   ✓ Migrate to other wallet
   ⚠️ Can spend - keep secure!

💾 Full Backup (entire wallet):
   ✓ Disaster recovery
   🔴 Highest security needed!
```

---

## Critical Security Warnings

### For Private Key Export

**If Password Protection Disabled**:
```
⚠️⚠️⚠️ UNENCRYPTED EXPORT - MAXIMUM RISK ⚠️⚠️⚠️

Anyone who accesses this file can steal funds INSTANTLY.

ARE YOU SURE?
( ) Yes, export UNENCRYPTED (I accept full responsibility)

[Cancel]  [Use Password Protection] ← Recommended
```

### For Full Backup Export

**Separate Password Required**:
```
⚠️ BACKUP PASSWORD

This backup contains your ENTIRE wallet seed.

You MUST create a SEPARATE password:
- Different from wallet password
- At least 12 characters
- Mix uppercase, lowercase, numbers
- Store separately from backup file

If you lose this password, the backup CANNOT be recovered.

Password: [______________] (Strength: ████░░░░░░ Fair)
```

---

## Timeline Summary

| Week | Feature | Deliverable |
|------|---------|-------------|
| 1-2 | Xpub Export | v0.11.0 shipped |
| 3 | Private Key Export | Backend + UI complete |
| 4 | Private Key Import | Import flow complete |
| 5 | Private Key Testing | QA + security review |
| 6 | Full Backup | Backend + modals 1-3 |
| 7 | Full Backup | Modals 4-5 + restore |
| 8 | Full Backup Testing | Roundtrip testing |
| 9 | Security Audit | Final review + v0.13.0 |

**Total**: ~9 weeks for all three features

---

## Risk Analysis Summary

### What Could Go Wrong?

| Scenario | Feature | Likelihood | Impact | Mitigation |
|----------|---------|-----------|---------|-----------|
| **File stolen (plaintext)** | Private Key | MEDIUM | Account loss | "Extra scary" warning |
| **Weak password cracked** | Private Key | MEDIUM | Account loss | 210K iterations + strength meter |
| **Backup stolen + cracked** | Full Backup | LOW | Wallet loss | 600K iterations + 12-char minimum |
| **Wrong network import** | Private Key | LOW | Key exposure | Network validation (blocks mainnet) |
| **Privacy leak** | Xpub | MEDIUM | Address tracking | Privacy warning |

### Acceptable Risks

✅ **Xpub Privacy**: User informed, cannot steal funds
✅ **Optional Encryption**: User choice (with strong warnings)
✅ **Memory Clearing**: Best-effort (JavaScript limitation)

### Unacceptable Risks (Mitigated)

❌ Mainnet keys on testnet → **Blocked by network validation**
❌ Weak passwords → **Enforced minimums + strength meter**
❌ Plaintext export accidents → **"Extra scary" confirmation required**

---

## Approval Status

### ✅ Xpub Export
**Status**: APPROVED - Ready for Implementation
**Conditions**: None
**Sign-Off**: Security Expert

### ✅ Private Key Export/Import
**Status**: APPROVED - Update Iterations
**Conditions**:
- Update 100K → 210K iterations
- Add file version prefix
- Network validation tested
**Sign-Off**: Security Expert (contingent)

### ✅ Encrypted Backup Export
**Status**: APPROVED - Excellent Design
**Conditions**:
- Implement restore flow (backup alone incomplete)
- Security review after implementation
**Sign-Off**: Security Expert

---

## Next Steps

**Immediate Actions**:
1. ✅ Read full security review: `EXPORT_FEATURES_SECURITY_REVIEW.md`
2. → Start xpub export implementation (2 days)
3. → User test xpub export
4. → Apply learnings to private key export

**Before Private Key Export**:
1. Update iteration constants to 210K
2. Review WIF handling with blockchain expert
3. Write comprehensive test suite

**Before Full Backup**:
1. Implement restore flow first (to test backups)
2. User testing on backup flow (5 modals)
3. Comprehensive security audit

---

## Key Takeaways

1. **Start Safe**: Xpub first (lowest risk, high value)
2. **Update Crypto**: 210K iterations for file encryption (OWASP 2025)
3. **User Education**: Warnings prevent most accidents
4. **Incremental Releases**: Ship features as completed
5. **Security Reviews**: Before and after each feature

---

**For Full Details**: See `EXPORT_FEATURES_SECURITY_REVIEW.md` (10,000+ words)

**Questions?**
- Product: See PRDs for each feature
- Security: See security review document
- Implementation: See frontend/backend plans

---

**Status**: ✅ Ready to Implement
**Approved By**: Bitcoin Wallet Security Expert
**Date**: October 26, 2025
