# Wallet Restore from Private Key - Security Expert Handoff

**Version**: 1.0
**Date**: 2025-10-22
**From**: Blockchain Expert
**To**: Security Expert
**Feature**: Wallet Restore from Private Key (v0.11.0)
**Status**: ⏳ Awaiting Security Review

---

## Overview

The Product Manager has proposed adding wallet restore from private key backup (WIF format) during initial wallet setup. This enables users who exported their private keys to restore wallet access without a seed phrase.

**Related Documents**:
- **PRD**: [WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md](./WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md)
- **Blockchain Review**: [WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md](./WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md)

**Blockchain Expert Verdict**: ✅ **APPROVED** - Architecture is sound from Bitcoin protocol perspective

**Security Expert Review Required**: The following security aspects need expert validation before implementation.

---

## What Changed: Blockchain Expert Review Summary

### Architecture Decisions (Approved)

1. **Non-HD Wallet Structure**: ✅ Valid
   - Use `encryptedSeed = ''` (empty string) for non-HD wallets
   - Store imported key in `importedKeys[0]`
   - Mark account with `importType: 'private-key'`

2. **Change Address Strategy**: ✅ Reuse same address (MVP)
   - Privacy tradeoff accepted
   - Users will be warned
   - Migration path to HD wallet available

3. **Address Type Selection**: ✅ User must specify
   - Cannot auto-detect from WIF
   - UI shows preview of all 3 types
   - User confirms which they used

4. **Transaction Signing**: ✅ Conditional branching
   - HD accounts: Derive from seed
   - Non-HD accounts: Decrypt imported key
   - Same signing algorithm

5. **BIP Compliance**: ✅ No violations
   - Non-HD wallets are standard Bitcoin
   - WIF format compliant
   - All Bitcoin protocols supported

---

## Critical Security Questions for Expert Review

### Question 1: Non-HD Wallet Encryption Strategy

**Current Approach**:
- HD wallets: `encryptedSeed` encrypted with wallet password (PBKDF2 + AES-256-GCM)
- Non-HD wallets: `importedKeys[0]` encrypted with wallet password (same method)
- **Single password** protects everything

**Proposed Storage**:
```typescript
// StoredWalletV2 for non-HD wallet
{
  encryptedSeed: '',  // Empty (no HD seed)
  salt: '{wallet_salt}',  // For wallet-level encryption
  iv: '{wallet_iv}',
  importedKeys: {
    0: {
      encryptedData: '{encrypted_WIF}',  // Private key encrypted
      salt: '{key_salt}',  // Separate salt for imported key
      iv: '{key_iv}',
      type: 'private-key'
    }
  }
}
```

**Security Questions**:

1. **Is single-password encryption acceptable for non-HD wallets?**
   - Pro: User simplicity (one password to remember)
   - Con: If password compromised, everything is exposed
   - Con: No defense-in-depth for imported keys

2. **Should imported keys use a separate encryption password?**
   - Option A: Same wallet password (simpler UX)
   - Option B: Separate "import password" (better security)
   - Consideration: User must remember 2 passwords

3. **Should we enforce stronger password requirements for non-HD wallets?**
   - Non-HD wallets have higher risk (no seed phrase backup diversity)
   - Should minimum password strength be higher?
   - Should we require 2FA or additional security measures?

4. **Is the encryption method sufficient?**
   - Current: PBKDF2 (100,000 iterations) + AES-256-GCM
   - Same as HD wallet encryption
   - Is this adequate for non-HD wallets?

**Recommendation Needed**:
- [ ] Approve single-password encryption (same as HD wallets)
- [ ] Require separate password for imported keys
- [ ] Enforce higher password strength requirements
- [ ] Other: ___________

---

### Question 2: Wallet Structure Validation

**Proposed Validation Rules**:

```typescript
function validateWalletStructure(wallet: StoredWalletV2): void {
  const isNonHD = wallet.encryptedSeed === '';
  const hasImportedKeys = wallet.importedKeys && Object.keys(wallet.importedKeys).length > 0;

  if (isNonHD) {
    // Non-HD wallet MUST have imported keys
    if (!hasImportedKeys) {
      throw new Error('Non-HD wallet must have imported keys');
    }

    // Non-HD wallet MUST have at least one account
    if (wallet.accounts.length === 0) {
      throw new Error('Non-HD wallet must have at least one account');
    }

    // All accounts MUST be imported type
    const allImported = wallet.accounts.every(
      (acc) => acc.accountType === 'single' && acc.importType === 'private-key'
    );
    if (!allImported) {
      throw new Error('Non-HD wallet cannot have HD-derived accounts');
    }
  } else {
    // HD wallet MUST have encrypted seed
    if (wallet.encryptedSeed.length < 64) {
      throw new Error('HD wallet must have valid encrypted seed');
    }
  }
}
```

**When to Run Validation**:
- On wallet unlock
- On wallet creation
- Before critical operations (send transaction, export keys)

**Security Questions**:

1. **Are these validation rules sufficient?**
   - Do they prevent all invalid wallet states?
   - Are there edge cases we're missing?

2. **What happens if validation fails?**
   - Lock wallet immediately?
   - Display error and prevent operations?
   - Log security event?

3. **Should we perform validation on every unlock?**
   - Performance: Adds validation overhead on every unlock
   - Security: Ensures integrity before allowing access
   - Tradeoff: Speed vs security

4. **Should we add checksum validation to encrypted data?**
   - Current: AES-GCM provides authenticated encryption
   - Additional checksum: Redundant or defense-in-depth?

**Recommendation Needed**:
- [ ] Approve validation rules as-is
- [ ] Add additional validations: ___________
- [ ] Run validation on: [ ] Unlock [ ] Create [ ] Before operations [ ] All
- [ ] Validation failure action: [ ] Lock [ ] Error [ ] Log [ ] Other: ___________

---

### Question 3: Migration Security (Non-HD to HD Wallet)

**Proposed Migration Flow**:

```
1. User has non-HD wallet with funds
   └─ Account: "Imported Account" (0.5 BTC)

2. User initiates migration
   ├─ Create NEW HD wallet (separate from non-HD wallet)
   ├─ Generate new seed phrase
   └─ User backs up seed phrase

3. System offers to transfer funds
   ├─ Build transaction: All UTXOs → First HD address
   ├─ User reviews: Amount, Fee, Destination
   └─ User confirms and broadcasts

4. Wait for confirmation (6 blocks)

5. After confirmation, offer cleanup
   ├─ "Funds successfully transferred!"
   ├─ "Delete old non-HD wallet?"
   └─ User confirms or keeps both

6. Migration complete
   └─ User now has HD wallet
```

**Security Questions**:

1. **Is automatic fund sweeping safe?**
   - Pro: User-friendly (one-click migration)
   - Con: What if transaction fails or gets stuck?
   - Con: What if user loses HD seed phrase during migration?

2. **Should we keep non-HD wallet until user manually confirms deletion?**
   - Option A: Keep both wallets (safer, but confusing UX)
   - Option B: Auto-delete after confirmation (cleaner, but risky)
   - Option C: Wait 30 days before offering deletion (safest)

3. **What happens if migration transaction fails?**
   - Insufficient fee (stuck in mempool)
   - Network error (broadcast failed)
   - User navigates away mid-migration
   - **How do we recover?**

4. **Should we prevent HD wallet usage until migration transaction confirms?**
   - Lock HD wallet until funds arrive?
   - Allow concurrent usage of both wallets?
   - Risk: User sends to wrong wallet

5. **What if user tries to migrate with insufficient funds for fee?**
   - Detect this before starting migration?
   - Show warning and minimum balance required?
   - Block migration until balance sufficient?

6. **Should migration be resumable?**
   - If user closes browser mid-migration, can they resume?
   - Store migration state?
   - Timeout for abandoned migrations?

**Recommendation Needed**:
- [ ] Approve automatic sweeping with safeguards
- [ ] Require manual fund transfer (no automation)
- [ ] Wallet deletion policy: [ ] Manual [ ] Auto after confirmation [ ] 30-day delay
- [ ] Migration failure handling: ___________
- [ ] Concurrent wallet usage: [ ] Allow [ ] Prevent [ ] Warn
- [ ] Resumable migrations: [ ] Yes [ ] No

---

### Question 4: Rate Limiting for Wallet Creation

**Context**:
- Existing `IMPORT_ACCOUNT_PRIVATE_KEY` has rate limiting (3 attempts / 15 minutes)
- New `CREATE_WALLET_FROM_PRIVATE_KEY` does NOT have rate limiting yet

**Proposed Rate Limiting**:

```typescript
// Rate limit configuration
const WALLET_CREATION_RATE_LIMIT = {
  maxAttempts: 3,
  windowMs: 15 * 60 * 1000,  // 15 minutes
  lockoutMs: 60 * 60 * 1000   // 1 hour lockout after exceeding
};

// Track failed attempts
const walletCreationAttempts = new Map<string, {
  count: number;
  firstAttempt: number;
  locked: boolean;
  lockExpires: number;
}>();

function checkWalletCreationRateLimit(): {
  allowed: boolean;
  error?: string;
  remainingAttempts?: number;
} {
  // Implementation...
}
```

**Attack Scenarios**:

1. **Brute Force WIF Import**:
   - Attacker tries multiple WIF strings
   - Goal: Find valid WIF that unlocks funds
   - Rate limiting prevents rapid attempts

2. **Password Brute Force**:
   - Attacker tries multiple wallet passwords during creation
   - Goal: Find weak password pattern
   - Rate limiting slows down attack

3. **Resource Exhaustion**:
   - Attacker creates many wallets rapidly
   - Goal: Consume storage or memory
   - Rate limiting prevents DoS

**Security Questions**:

1. **Is rate limiting necessary for wallet creation?**
   - Pro: Prevents brute force and DoS attacks
   - Con: Legitimate users may hit limit (e.g., typos)
   - Context: Wallet creation is less frequent than account import

2. **What are appropriate rate limits?**
   - 3 attempts per 15 minutes? (same as account import)
   - 5 attempts per hour? (more lenient)
   - Different limits for failed vs successful attempts?

3. **Should we differentiate between failure types?**
   - Invalid WIF format: Shouldn't count against limit?
   - Wrong password: Should count against limit?
   - Network error: Shouldn't count against limit?

4. **What happens when rate limit exceeded?**
   - Show error: "Too many attempts. Please try again in 15 minutes."
   - Lock out completely for 1 hour?
   - Require CAPTCHA or additional verification?

5. **Should rate limits persist across browser restarts?**
   - Store in chrome.storage.local (persists)
   - Store in memory only (resets on restart)
   - Security vs usability tradeoff

**Recommendation Needed**:
- [ ] Implement rate limiting for CREATE_WALLET_FROM_PRIVATE_KEY
- [ ] Rate limit: _____ attempts per _____ minutes
- [ ] Lockout duration: _____ minutes/hours
- [ ] Count failures: [ ] Invalid WIF [ ] Wrong password [ ] All errors
- [ ] Persist limits: [ ] Yes (storage) [ ] No (memory) [ ] Other: ___________

---

### Question 5: Address Reuse Privacy Warning Severity

**Context**:
- Non-HD wallets reuse the same address for all transactions (receive + change)
- This is a **significant privacy degradation** compared to HD wallets
- Users may not understand the implications

**Privacy Impact**:
- 🔴 **High**: All transactions linked to single address
- 🔴 **High**: Chain analysis trivial (no address rotation)
- 🔴 **High**: Balance publicly visible on blockchain explorers
- 🟡 **Medium**: Transaction graph analysis easy
- 🟠 **Low**: If user only transacts with trusted parties

**Proposed Warning Levels**:

**Option A: Soft Warning (Dismissible Banner)**

```
┌────────────────────────────────────────────┐
│ ℹ️ Privacy Notice                           │
├────────────────────────────────────────────┤
│ This wallet uses a single address for all  │
│ transactions, which may reduce privacy.     │
│                                             │
│ [Learn More] [Dismiss]                      │
└────────────────────────────────────────────┘
```

**Pros**: Not intrusive, user can proceed quickly
**Cons**: User may dismiss without understanding

---

**Option B: Mandatory Acknowledgment**

```
┌────────────────────────────────────────────┐
│ ⚠️ Privacy Warning                          │
├────────────────────────────────────────────┤
│ Wallets imported from private keys will    │
│ reuse the same address for all             │
│ transactions. This means:                   │
│                                             │
│ • All transactions are publicly linked      │
│ • Your balance is visible to anyone         │
│ • Privacy is significantly reduced          │
│                                             │
│ For better privacy, consider creating a     │
│ wallet with a seed phrase.                  │
│                                             │
│ [ ] I understand the privacy implications   │
│                                             │
│ [Continue Anyway] [Create Seed Phrase]      │
└────────────────────────────────────────────┘
```

**Pros**: Forces user to acknowledge, educates about risks
**Cons**: May frustrate users who just want to recover funds

---

**Option C: Repeated Warnings (Every Transaction)**

```
// Show warning before EVERY send transaction

┌────────────────────────────────────────────┐
│ ⚠️ Address Reuse Warning                    │
├────────────────────────────────────────────┤
│ This transaction will reuse your address    │
│ for change, which reduces privacy.          │
│                                             │
│ [Continue Anyway] [Learn More] [Cancel]     │
└────────────────────────────────────────────┘
```

**Pros**: Constant reminder of privacy implications
**Cons**: Warning fatigue, user may ignore

---

**Option D: Block Non-HD Wallets Entirely**

```
┌────────────────────────────────────────────┐
│ 🔒 Non-HD Wallets Not Supported             │
├────────────────────────────────────────────┤
│ For security and privacy reasons, this      │
│ wallet only supports HD wallets with seed   │
│ phrases.                                    │
│                                             │
│ To recover your funds, please:              │
│ 1. Create a seed phrase wallet              │
│ 2. Import your private key as an account    │
│ 3. Transfer funds to HD wallet              │
│                                             │
│ [Create HD Wallet]                          │
└────────────────────────────────────────────┘
```

**Pros**: Forces best practice, no privacy compromise
**Cons**: Users cannot restore wallet from private key backup

---

**Security Questions**:

1. **Which warning level is appropriate for MVP?**
   - Balance usability (recovery use case) vs privacy education
   - How strongly should we discourage non-HD wallets?

2. **Should we prevent non-HD wallet creation entirely?**
   - Force users to use HD wallets only (Option D)
   - Allow non-HD but with strong warnings (Option B)
   - Allow non-HD with minimal friction (Option A)

3. **How do we balance recovery use case vs privacy best practices?**
   - User lost access, ONLY has private key backup
   - Blocking them entirely prevents fund recovery
   - But allowing it sets bad privacy precedent

4. **Should warnings be different for 0-balance accounts?**
   - If user imports key with 0 balance, less privacy risk
   - Allow without warning for 0-balance imports?
   - Or warn regardless of balance?

5. **Should we sunset non-HD wallet support eventually?**
   - Implement now, deprecate in 6 months?
   - Notify users to migrate to HD wallets?
   - Eventually remove feature?

**Recommendation Needed**:
- [ ] Warning level: [ ] Option A (Soft) [ ] Option B (Mandatory) [ ] Option C (Repeated) [ ] Option D (Block)
- [ ] Different warnings based on balance: [ ] Yes [ ] No
- [ ] Deprecation plan: [ ] 6 months [ ] 1 year [ ] Never [ ] Other: ___________
- [ ] Additional user education: ___________

---

### Question 6: Memory Handling and Key Clearing

**Current Key Lifecycle**:

```typescript
// 1. User provides WIF during import
const wif = payload.wif;  // In memory (plain text)

// 2. Validate WIF
const validation = WIFManager.validateWIF(wif, 'testnet');

// 3. Decode WIF to get private key
const keyInfo = KeyManager.decodeWIF(wif, network);
const privateKey = Buffer.from(keyInfo.privateKey, 'hex');  // In memory

// 4. Encrypt private key for storage
const encrypted = await CryptoUtils.encryptData(wif, password, salt, iv);

// 5. Store encrypted key
await WalletStorage.storeImportedKey(accountIndex, {
  encryptedData: encrypted,
  salt, iv, type: 'private-key'
});

// 6. Clear sensitive data
CryptoUtils.clearSensitiveData(wif);       // Zero out WIF string
CryptoUtils.clearSensitiveData(privateKey); // Zero out private key buffer
wif = null;
privateKey = null;
```

**Security Questions**:

1. **Is buffer zeroing effective in JavaScript?**
   - JavaScript strings are immutable (cannot truly "zero out")
   - Buffers CAN be zeroed: `buffer.fill(0)`
   - Does this actually prevent memory snooping?
   - Are there better methods?

2. **How long do private keys remain in memory?**
   - During import: ~2-5 seconds (validation + encryption)
   - During signing: ~1 second per transaction
   - Is this exposure time acceptable?

3. **Should we use Web Crypto API instead of in-memory key handling?**
   - `crypto.subtle.importKey()` keeps keys in isolated memory
   - `crypto.subtle.sign()` signs without exposing private key
   - More secure but more complex implementation

4. **What about JavaScript garbage collection?**
   - Cleared buffers may remain in memory until GC runs
   - Attacker could dump memory before GC
   - Can we force immediate GC? (Not reliably in JavaScript)

5. **Should we add additional protections?**
   - Encrypt private keys even in memory (decrypt only for signing)?
   - Use Web Workers for key operations (isolated context)?
   - Implement memory wiping library (e.g., libsodium.js)?

6. **What about Chrome DevTools memory snapshots?**
   - Developer can take memory snapshot while wallet unlocked
   - Private keys may be visible in snapshot
   - Should we detect DevTools open and lock wallet?

**Recommendation Needed**:
- [ ] Current approach (buffer zeroing) is sufficient
- [ ] Migrate to Web Crypto API for better isolation
- [ ] Implement additional memory protections: ___________
- [ ] Detect DevTools and lock wallet: [ ] Yes [ ] No
- [ ] Force garbage collection after key operations: [ ] Yes (if possible) [ ] No
- [ ] Other: ___________

---

### Question 7: Wallet Creation Attack Vectors

**Potential Attack Scenarios**:

#### Attack 1: Malicious WIF Injection

**Scenario**:
1. Attacker convinces user to import attacker's private key
2. User imports key, attacker controls the funds
3. User sends Bitcoin to imported address
4. Attacker drains funds

**Current Mitigation**:
- Show first address preview during import
- User must verify address matches their backup
- Warning: "Verify this address matches your backup"

**Question**: Is this mitigation sufficient?
- Should we require users to verify address with balance lookup?
- Should we block imports if address has existing balance (potential honeypot)?

---

#### Attack 2: WIF Format Confusion

**Scenario**:
1. User has WIF from different network (mainnet vs testnet)
2. User imports mainnet WIF into testnet wallet (or vice versa)
3. User doesn't notice (addresses look similar)
4. Funds sent to wrong network, effectively lost

**Current Mitigation**:
- WIF validation checks network prefix
- Error: "Wrong network: This is a mainnet key, testnet required"
- Import blocked automatically

**Question**: Is this mitigation sufficient?
- Should we show more prominent network mismatch warnings?
- Should we offer to switch networks if mismatch detected?

---

#### Attack 3: Address Type Mismatch

**Scenario**:
1. User imports WIF with compressed key
2. User selects wrong address type (e.g., legacy instead of native-segwit)
3. Import succeeds but shows 0 balance (funds on different address)
4. User thinks funds are lost

**Current Mitigation**:
- UI shows preview of all 3 address types
- User must select correct type
- Warning: "Select the address type you originally used"

**Question**: Is this mitigation sufficient?
- Should we check balance on all 3 addresses and warn if mismatch?
- Should we auto-select the address type with highest balance?
- Privacy tradeoff: 3 API calls to blockchain

---

#### Attack 4: Encrypted File Tampering

**Scenario**:
1. User exports encrypted private key file
2. Attacker modifies encrypted file (changes encrypted data)
3. User imports tampered file
4. Decryption fails OR decrypts to attacker's key

**Current Mitigation**:
- AES-GCM provides authenticated encryption (tamper detection)
- Decryption will fail if ciphertext modified
- Error: "Unable to decrypt. File may be corrupted."

**Question**: Is this mitigation sufficient?
- Should we add additional file integrity checks (HMAC)?
- Should we version encrypted files to detect downgrades?
- Should we include metadata checksum?

---

#### Attack 5: Clipboard Hijacking

**Scenario**:
1. User copies WIF from backup file
2. Malware on user's computer monitors clipboard
3. Malware detects WIF pattern, steals private key
4. Attacker drains funds

**Current Mitigation**:
- NONE (cannot prevent clipboard monitoring)
- User must have secure computer

**Question**: Should we add protections?
- Clear clipboard after WIF paste detected?
- Warn users about clipboard security risks?
- Offer QR code scanning instead of paste? (requires camera permission)

---

**Recommendation Needed**:

For each attack scenario, recommend:
- [ ] Current mitigation sufficient
- [ ] Add additional protection: ___________
- [ ] Accept risk and document in user warnings
- [ ] Block this attack vector entirely

---

## Implementation Security Requirements

Based on Security Expert recommendations, the implementation MUST include:

### Required Security Controls

- [ ] **Encryption**: Approved encryption method for non-HD wallets
- [ ] **Validation**: Wallet structure validation on unlock
- [ ] **Rate Limiting**: Wallet creation rate limits implemented
- [ ] **Privacy Warnings**: Approved warning level for address reuse
- [ ] **Memory Clearing**: Private key zeroing after operations
- [ ] **Network Validation**: WIF network prefix enforcement
- [ ] **Address Type Verification**: User confirms address type
- [ ] **Migration Safety**: Safe fund transfer during migration

### Required Security Testing

- [ ] **Encryption roundtrip**: Import → Export → Import (verify integrity)
- [ ] **Invalid WIF handling**: Test malformed WIF rejection
- [ ] **Network mismatch**: Test mainnet/testnet WIF rejection
- [ ] **Rate limit bypass**: Test rapid wallet creation blocking
- [ ] **Concurrent operations**: Test race conditions in wallet creation
- [ ] **Memory inspection**: Verify private keys cleared after use
- [ ] **Migration failure**: Test transaction failure recovery

### Required Documentation

- [ ] **Security warnings**: User-facing privacy warnings documented
- [ ] **Threat model**: Non-HD wallet attack vectors documented
- [ ] **Incident response**: Recovery procedures for migration failures
- [ ] **Best practices**: User guidance for secure WIF handling

---

## Security Expert Deliverables

Please provide:

1. **Security Audit Report**
   - Threat assessment of non-HD wallet architecture
   - Attack vector analysis
   - Risk ratings for each scenario

2. **Encryption Specifications**
   - Approved encryption method for non-HD wallets
   - Password strength requirements
   - Key derivation parameters

3. **Validation Requirements**
   - Approved wallet structure validations
   - Frequency of validation checks
   - Failure handling procedures

4. **User Warning Recommendations**
   - Approved warning level for address reuse
   - Warning text and placement
   - User education materials

5. **Testing Requirements**
   - Security test cases for non-HD wallets
   - Migration security tests
   - Rate limiting tests

6. **Implementation Approval**
   - ✅ / ❌ Approve implementation with recommended changes
   - List of blocking issues
   - List of recommended enhancements

---

## Timeline

**Target Review Completion**: Within 3 business days
**Expected Implementation Start**: After security approval

---

## Contact

**Questions or Clarifications**:
- Blockchain Expert: Available for technical questions
- Product Manager: Available for scope/UX questions

**Review Status**: ⏳ Pending Security Expert Review

---

**END OF HANDOFF DOCUMENT**
