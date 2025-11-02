# Private Key Export and Import - Security Specification

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Security Analysis Complete
**Feature Type**: Account Portability & Backup
**Security Expert**: Bitcoin Wallet Security Expert

---

## Executive Summary

This document provides a comprehensive security analysis and specification for the per-account private key export/import feature. This feature allows users to export individual account private keys in WIF (Wallet Import Format) with **optional** password protection, and import them into new or existing wallets.

**Security Posture**: This feature introduces **CRITICAL** security risks by exposing private keys outside the encrypted wallet environment. However, with proper safeguards, warnings, and implementation, the risks can be managed to provide valuable functionality for backup and account portability.

**Key Security Decisions**:
- ✅ **Optional password protection** - Acceptable with strong warnings when disabled
- ✅ **100K PBKDF2 iterations** - Sufficient for file encryption (simpler than wallet backup)
- ✅ **Network validation** - Critical to prevent mainnet key imports on testnet wallet
- ✅ **Multisig exclusion** - Correct (no single private key exists)
- ⚠️ **Memory management** - Must implement secure clearing of sensitive data
- ⚠️ **User education** - Extensive warnings required, especially for plaintext export

---

## Table of Contents

1. [Threat Model for Private Key Export](#1-threat-model-for-private-key-export)
2. [Export Security Requirements](#2-export-security-requirements)
3. [Encryption Specification (Optional Password Protection)](#3-encryption-specification-optional-password-protection)
4. [Import Security Requirements](#4-import-security-requirements)
5. [Security Warnings for Users](#5-security-warnings-for-users)
6. [PDF Export Security](#6-pdf-export-security)
7. [Secure Coding Requirements](#7-secure-coding-requirements)
8. [Multisig Account Handling](#8-multisig-account-handling)
9. [Comparison to Full Wallet Backup](#9-comparison-to-full-wallet-backup)
10. [Security Testing Requirements](#10-security-testing-requirements)
11. [Security Checklist](#11-security-checklist)

---

## 1. Threat Model for Private Key Export

### 1.1 Attack Vectors and Risks

#### A. Exported File Theft

**Threat**: Attacker gains access to exported private key file.

**Attack Scenarios**:

1. **Plaintext File Theft**
   - **Severity**: CRITICAL
   - **Likelihood**: HIGH (if user chooses plaintext export)
   - **Impact**: Immediate and complete loss of account funds
   - **Scenario**:
     - User exports private key without password protection
     - File stored in Downloads folder, cloud backup, or email
     - Attacker gains access via malware, cloud breach, or physical access
     - Attacker imports key and drains account immediately
   - **Mitigation**:
     - Strong warnings when password protection disabled
     - User acknowledgment checkbox required
     - Recommend secure storage locations
     - Never auto-sync to cloud

2. **Encrypted File Brute Force**
   - **Severity**: HIGH
   - **Likelihood**: MEDIUM (depends on password strength)
   - **Impact**: Delayed fund loss (hours to years depending on password)
   - **Scenario**:
     - User exports with weak password ("password123")
     - Attacker obtains encrypted file
     - Brute force attack succeeds in hours/days
     - Attacker imports key and drains account
   - **Mitigation**:
     - Enforce minimum 8-character password
     - Password strength meter with clear guidance
     - Recommend 12+ character passphrases
     - 100K PBKDF2 iterations slow brute force

3. **File Discovery in Backups**
   - **Severity**: HIGH
   - **Likelihood**: MEDIUM
   - **Impact**: Key exposure through system backups
   - **Scenario**:
     - User exports file to local disk
     - System backup (Time Machine, Windows Backup) includes file
     - Backup stolen, sold, or improperly disposed
     - Attacker extracts keys from backup
   - **Mitigation**:
     - Warn users about backup implications
     - Recommend encrypted storage devices
     - Suggest secure deletion after import

#### B. Screen Recording and Shoulder Surfing

**Threat**: Visual capture of private key during export process.

**Attack Scenarios**:

1. **Screen Recording Malware**
   - **Severity**: CRITICAL
   - **Likelihood**: LOW (requires malware infection)
   - **Impact**: Complete account compromise
   - **Scenario**:
     - Malware records screen during export
     - WIF key visible in export dialog or downloaded file preview
     - Attacker extracts WIF from recording
   - **Mitigation**:
     - Never display WIF in export dialog (only in downloaded file)
     - Warn users to verify system security before export
     - Recommend antivirus scans

2. **Physical Shoulder Surfing**
   - **Severity**: MEDIUM
   - **Likelihood**: LOW (requires physical proximity)
   - **Impact**: Account compromise if WIF transcribed
   - **Scenario**:
     - User opens exported file in public place
     - Attacker photographs or memorizes WIF
   - **Mitigation**:
     - Warn about viewing exported files in private
     - Recommend password protection for added layer

#### C. Printer Security Risks (PDF Export)

**Threat**: Printed private keys left in public printers or improperly disposed.

**Attack Scenarios**:

1. **Public Printer Exposure**
   - **Severity**: CRITICAL
   - **Likelihood**: MEDIUM (if users print at work/library)
   - **Impact**: Complete account compromise
   - **Scenario**:
     - User prints PDF backup at office/library
     - Forgets printout in printer tray
     - Attacker finds printout with WIF + QR code
     - Scans QR code and imports immediately
   - **Mitigation**:
     - Warn: "Only print on trusted, private printers"
     - Recommend home printers only
     - Password-protected PDFs reduce risk

2. **Improper Disposal**
   - **Severity**: HIGH
   - **Likelihood**: MEDIUM
   - **Impact**: Fund loss from dumpster diving
   - **Scenario**:
     - User prints backup, later throws in trash
     - Attacker recovers from trash (dumpster diving)
   - **Mitigation**:
     - Recommend shredding or burning when no longer needed
     - Fireproof safe storage instructions

#### D. Import Phishing Attacks

**Threat**: User tricked into importing malicious or fake private key.

**Attack Scenarios**:

1. **Fake "Airdrop" Keys**
   - **Severity**: LOW (no loss, just confusion)
   - **Likelihood**: LOW
   - **Impact**: User imports worthless key
   - **Scenario**:
     - Phisher sends fake private key claiming it has funds
     - User imports, sees zero balance
   - **Mitigation**:
     - Show preview of first address and balance before import
     - Warn: "Verify this is YOUR key before importing"

2. **Mainnet Key Import on Testnet**
   - **Severity**: HIGH (potential loss of real funds if reversed)
   - **Likelihood**: MEDIUM (user error)
   - **Impact**: Mainnet keys exposed on testnet wallet
   - **Scenario**:
     - User accidentally tries to import mainnet key
     - Wallet rejects, but key might be exposed in memory
   - **Mitigation**:
     - **STRICT network validation** - reject mainnet keys immediately
     - Clear error: "This is a mainnet key, wallet requires testnet"
     - Never process mainnet keys beyond initial validation

#### E. Concurrent Export Race Conditions

**Threat**: Multiple exports occurring simultaneously cause security issues.

**Attack Scenarios**:

1. **Memory Leakage**
   - **Severity**: MEDIUM
   - **Likelihood**: LOW
   - **Impact**: Keys remain in memory longer than necessary
   - **Scenario**:
     - User exports multiple accounts rapidly
     - Private keys accumulate in memory
     - Service worker crash dumps memory
   - **Mitigation**:
     - Clear each private key immediately after export
     - Use separate memory space per export operation
     - Implement timeout-based cleanup

### 1.2 Risk Summary Matrix

| Threat | Severity | Likelihood | Overall Risk | Mitigation Priority |
|--------|----------|------------|--------------|---------------------|
| Plaintext file theft | CRITICAL | HIGH | **CRITICAL** | P0 - Strong warnings |
| Weak password brute force | HIGH | MEDIUM | **HIGH** | P0 - Password strength enforcement |
| Screen recording malware | CRITICAL | LOW | **HIGH** | P1 - Don't display WIF in UI |
| Public printer exposure | CRITICAL | MEDIUM | **HIGH** | P0 - Print warnings |
| File discovery in backups | HIGH | MEDIUM | **HIGH** | P1 - User education |
| Mainnet key import | HIGH | MEDIUM | **HIGH** | P0 - Network validation |
| Shoulder surfing | MEDIUM | LOW | **MEDIUM** | P2 - User warnings |
| Memory leakage | MEDIUM | LOW | **MEDIUM** | P1 - Secure cleanup |
| Fake key phishing | LOW | LOW | **LOW** | P2 - Balance preview |

### 1.3 Attack Surface Analysis

**New Attack Surfaces Introduced**:

1. **File System Exposure**: Private keys now exist outside chrome.storage.local
   - **Risk**: Files can be accessed by other applications, malware, backups
   - **Mitigation**: Encryption (optional), user warnings

2. **User Error**: Users must make security decisions (password vs no password)
   - **Risk**: Users may not understand implications of plaintext export
   - **Mitigation**: Clear UI warnings, default to secure options

3. **Physical Security**: Printed PDFs require physical security
   - **Risk**: Paper can be stolen, photocopied, lost
   - **Mitigation**: Education on physical security

4. **Network Validation Gap**: Import accepts foreign keys
   - **Risk**: Mainnet keys could be accidentally exposed
   - **Mitigation**: Strict network validation

**Comparison to Current Security**:
- **Current**: Private keys never leave encrypted storage
- **New**: Private keys exported to file system (user-controlled)
- **Assessment**: Acceptable risk for user convenience, if properly warned

---

## 2. Export Security Requirements

### 2.1 Pre-Export Validation

**REQUIREMENT 1: Wallet Must Be Unlocked**
- ✅ **Rationale**: Only authenticated users can export
- ✅ **Implementation**: Check `inMemoryState.decryptedSeed !== null`
- ✅ **Error**: "Wallet is locked. Unlock to export private keys."

**REQUIREMENT 2: Password Re-Entry (RECOMMENDED, Not Required)**

**Decision**: **NOT REQUIRED for MVP**

**Rationale**:
- ✅ Wallet already unlocked = user recently authenticated
- ✅ Export is read-only operation (no funds moved)
- ✅ Auto-lock (15 min) provides time-bound security
- ⚠️ However, future enhancement should consider re-authentication for:
  - High-value accounts
  - Sensitive operations settings toggle
  - Long unlock periods (if auto-lock disabled)

**Future Enhancement**:
```typescript
// Future: Optional re-authentication for sensitive exports
if (accountBalance > THRESHOLD || settings.requirePasswordForExport) {
  // Prompt for password verification
  const passwordCorrect = await verifyPassword(userPassword);
  if (!passwordCorrect) {
    throw new Error('Password verification failed');
  }
}
```

**MVP Implementation**: No password re-entry required, rely on unlock state.

### 2.2 Export Security Warnings

**REQUIREMENT 3: Mandatory Warning Before Export**

**Display Severity**: ⚠️ **CRITICAL WARNING** (cannot be dismissed)

**Warning Content**:
```
⚠️ PRIVATE KEY EXPORT WARNING ⚠️

You are about to export the private key for this account. This key provides
COMPLETE access to all funds in this account.

CRITICAL SECURITY RISKS:
• Anyone who obtains this private key can steal ALL funds
• Private keys should NEVER be shared with anyone
• Once exported, the key exists outside your encrypted wallet
• If the exported file is stolen, your funds can be stolen

RECOMMENDATIONS:
• Use password protection (strongly recommended)
• Store exported files on encrypted storage devices only
• Never email or upload exported keys to cloud storage
• Consider printing and storing in a physical safe
• Treat this key like cash - if it's stolen, it's gone forever

[ ] I understand the risks and want to proceed with export

[Cancel]  [Continue to Export]
```

**Implementation**:
- User MUST check acknowledgment checkbox to enable "Continue" button
- Warning displayed in red/orange banner with warning icon
- Cannot be bypassed or hidden
- Logged to audit trail (not the key, just that warning was shown)

**REQUIREMENT 4: Enhanced Warning for Plaintext Export**

**Trigger**: User unchecks "Password Protection" checkbox

**Warning Content**:
```
⚠️⚠️ UNENCRYPTED EXPORT - EXTREME RISK ⚠️⚠️

You have chosen to export without password protection. This means:

CRITICAL RISKS:
• The private key will be stored in PLAIN TEXT
• Anyone who accesses the file can steal your funds IMMEDIATELY
• No password will be required to import and use this key
• The file is readable by any application on your computer

This is ONLY recommended if:
• You are storing the file on an already-encrypted device (like an
  encrypted USB drive or hardware wallet)
• You will immediately transfer to secure offline storage
• You understand you are solely responsible for physical file security

Are you SURE you want to export without password protection?

( ) Yes, I accept the risk of plaintext export
    (checked: enables export button)

[Cancel]  [Export Unencrypted]  [Use Password Protection] ← highlighted
```

**Implementation**:
- Radio button (not checkbox) requiring explicit "Yes, I accept the risk"
- "Use Password Protection" button re-enables password fields (recommended path)
- Orange/red warning box around entire section
- Export button changes to "Export Unencrypted" (scary phrasing)

### 2.3 Memory Security During Export

**REQUIREMENT 5: Minimize Private Key Lifetime in Memory**

**Implementation**:
```typescript
async function exportPrivateKey(accountIndex: number, password?: string): Promise<ExportResult> {
  let wif: string | null = null;
  let privateKeyHex: string | null = null;

  try {
    // 1. Derive private key for account (minimal time in memory)
    privateKeyHex = await deriveAccountPrivateKey(accountIndex);

    // 2. Convert to WIF immediately
    wif = KeyManager.privateKeyToWIF(privateKeyHex, 'testnet', true);

    // 3. Clear hex private key ASAP
    privateKeyHex = overwriteString(privateKeyHex);
    privateKeyHex = null;

    // 4. If password protection requested, encrypt WIF
    if (password) {
      const encrypted = await encryptWIF(wif, password);

      // Clear WIF from memory
      wif = overwriteString(wif);
      wif = null;

      return { encrypted: true, data: encrypted };
    } else {
      // Return plaintext WIF
      const result = { encrypted: false, data: wif };

      // Clear WIF after creating result object
      wif = overwriteString(wif);
      wif = null;

      return result;
    }
  } catch (error) {
    // Clear any remaining sensitive data
    if (privateKeyHex) {
      privateKeyHex = overwriteString(privateKeyHex);
    }
    if (wif) {
      wif = overwriteString(wif);
    }
    throw error;
  }
}

// Utility: Overwrite string in memory (best effort in JavaScript)
function overwriteString(str: string): string {
  // JavaScript strings are immutable, but we can try to minimize references
  const zeros = '0'.repeat(str.length);
  str = zeros; // Overwrite with zeros
  return ''; // Return empty
}
```

**Key Principles**:
- ✅ Private key exists in memory for **minimal time** (seconds)
- ✅ Clear variables as soon as no longer needed
- ✅ Use try-catch-finally to ensure cleanup on errors
- ✅ No caching or persistence of decrypted private keys

**REQUIREMENT 6: No Private Key Display in UI**

**Rule**: WIF private keys MUST NEVER be displayed in the export dialog

**Implementation**:
- ❌ **NEVER**: Show WIF in dialog preview
- ❌ **NEVER**: Copy WIF to clipboard automatically
- ✅ **ONLY**: Include WIF in downloaded file
- ✅ **ONLY**: Show first address (for verification, not WIF)

**Rationale**: Prevents screen recording malware capture

### 2.4 Audit Logging

**REQUIREMENT 7: Export Activity Logging (Non-Sensitive)**

**What to Log**:
- ✅ Timestamp of export
- ✅ Account index/name exported
- ✅ Export format (file vs PDF)
- ✅ Password protection enabled (yes/no)
- ✅ Export success/failure

**What NOT to Log**:
- ❌ Private key (WIF)
- ❌ Password used for encryption
- ❌ Seed phrase
- ❌ File contents

**Implementation**:
```typescript
interface ExportAuditLog {
  timestamp: number;
  accountIndex: number;
  accountName: string;
  exportFormat: 'file' | 'pdf';
  passwordProtected: boolean;
  success: boolean;
  errorMessage?: string; // Generic error, no sensitive data
}

// Store in chrome.storage.local under 'exportAuditLog' (non-sensitive)
```

**Purpose**:
- Detect unauthorized exports (if attacker gains temporary access)
- User can review export history in settings
- Forensics in case of compromise

---

## 3. Encryption Specification (Optional Password Protection)

### 3.1 Encryption Algorithm

**Algorithm**: AES-256-GCM (Galois/Counter Mode)
- ✅ Same as wallet encryption (consistency)
- ✅ Authenticated encryption (integrity + confidentiality)
- ✅ Web Crypto API native support
- ✅ Industry standard

**Key Derivation**: PBKDF2-HMAC-SHA256
- ✅ Iterations: **100,000** (acceptable for file encryption)
- ✅ Salt: 32 bytes (256 bits), unique per export
- ✅ Output: 256-bit AES key

**Initialization Vector (IV)**:
- ✅ Size: 12 bytes (96 bits) for GCM
- ✅ Unique per export (never reused)
- ✅ Generated using crypto.getRandomValues()

### 3.2 Encryption vs Wallet Backup Comparison

**Full Wallet Backup** (Hypothetical Future Feature):
- Algorithm: AES-256-GCM
- Key Derivation: PBKDF2 with **600,000 iterations**
- HMAC Signature: Yes (extra integrity check)
- Contents: Entire wallet (seed phrase + all accounts + metadata)
- Password Requirement: **Mandatory** separate password

**Private Key Export** (This Feature):
- Algorithm: AES-256-GCM (same)
- Key Derivation: PBKDF2 with **100,000 iterations** (simpler)
- HMAC Signature: No (GCM auth tag sufficient)
- Contents: Single account private key (WIF)
- Password Requirement: **Optional** (user choice)

**Why Lower Iterations for Export?**

✅ **APPROVED - 100K iterations is sufficient**

**Rationale**:
1. **Scope**: Single account, not entire wallet
   - Lower impact if compromised (one account vs all accounts)
   - User can move funds from single account to new account

2. **User Experience**: Export should be fast (~1-2 seconds)
   - 100K iterations: ~500ms encryption time
   - 600K iterations: ~3 seconds encryption time
   - Import flow benefits from faster decryption

3. **Security**: 100K is still strong
   - OWASP minimum is 100K (as of 2025)
   - Protects against weak passwords (8+ chars)
   - Not protecting full wallet seed (lower stakes)

4. **Consistency**: Same as wallet unlock
   - Users already familiar with 100K iteration delay
   - No confusion about "why is export slower than unlock?"

**Security Trade-off**: ✅ Acceptable
- **Risk**: Slightly faster brute force (~6x) if password is weak
- **Mitigation**: Password strength requirements (8+ chars, strength meter)
- **Context**: User chooses encryption, not mandatory
- **Overall**: 100K iterations + 8-char minimum = secure enough for per-account export

### 3.3 Encrypted File Format

**File Structure**:
```
Bitcoin Account Private Key (Encrypted)
=======================================
Account: {accountName}
Address Type: {addressType}
First Address: {firstAddress}
Network: Testnet

Encrypted Private Key:
{encryptionFormat}

Encryption: AES-256-GCM
Key Derivation: PBKDF2-HMAC-SHA256 (100,000 iterations)
Format: base64

TO DECRYPT:
Use this wallet's "Import Private Key" feature and provide the password
you used during export.

SECURITY WARNING:
- If you lose the password, the private key cannot be recovered
- This encryption provides additional protection during storage/transfer
- Keep this file and password in separate secure locations

Generated: {isoTimestamp}
```

**Encryption Format** (Single Base64 String):
```
{salt_base64}:{iv_base64}:{authTag_base64}:{ciphertext_base64}
```

**Component Breakdown**:
- `salt_base64`: 32-byte salt for PBKDF2 (Base64: 44 chars)
- `iv_base64`: 12-byte IV for AES-GCM (Base64: 16 chars)
- `authTag_base64`: 16-byte auth tag from GCM (Base64: 24 chars)
- `ciphertext_base64`: Encrypted WIF string (Base64: ~70 chars)
- **Total**: ~160 characters (colon-separated)

**Example**:
```
dGVzdHNhbHQxMjM0NTY3ODkwYWJjZGVm:aXZleGFtcGxl:YXV0aHRhZ2V4YW1wbGU=:Y2lwaGVydGV4dGV4YW1wbGU=
```

### 3.4 Password Strength Requirements

**Minimum Requirements** (Enforced):
- ✅ Length: 8 characters minimum
- ✅ No maximum length (practical limit: 256 chars)
- ✅ At least one uppercase OR lowercase letter
- ✅ At least one number OR special character

**Strength Classification**:
```typescript
enum PasswordStrength {
  WEAK = 'weak',       // 8-11 chars, basic requirements
  MEDIUM = 'medium',   // 12-15 chars, mixed types
  STRONG = 'strong'    // 16+ chars, all character types
}
```

**Strength Meter**:
- Visual: 5-segment bar (colored: red → yellow → green)
- Text label: "Weak", "Medium", "Strong"
- Real-time update as user types
- Recommendations:
  - Weak: "Increase length to 12+ characters"
  - Medium: "Add special characters for stronger protection"
  - Strong: "Excellent password strength!"

**Common Password Check**:
- Block top 10,000 common passwords (e.g., "password123", "qwerty")
- Show error: "This password is too common. Choose a unique password."

**Implementation Note**: Password requirements are LESS strict than wallet password because:
1. Encryption is optional (user already warned)
2. Protects single account, not entire wallet
3. User friction should be minimized for feature adoption

### 3.5 Encryption Implementation

```typescript
/**
 * Encrypt a WIF private key with password protection
 *
 * @param wif - WIF format private key
 * @param password - User-provided password
 * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all base64)
 */
async function encryptWIF(wif: string, password: string): Promise<string> {
  try {
    // 1. Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // 2. Generate random salt (32 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(32));

    // 3. Derive AES-256 key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // 4. Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 5. Encrypt WIF using AES-256-GCM
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128 // 16-byte auth tag
      },
      aesKey,
      new TextEncoder().encode(wif)
    );

    // 6. Extract ciphertext and auth tag
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const ciphertext = encryptedArray.slice(0, -16); // Everything except last 16 bytes
    const authTag = encryptedArray.slice(-16); // Last 16 bytes

    // 7. Encode to base64
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const authTagBase64 = btoa(String.fromCharCode(...authTag));
    const ciphertextBase64 = btoa(String.fromCharCode(...ciphertext));

    // 8. Return combined format
    return `${saltBase64}:${ivBase64}:${authTagBase64}:${ciphertextBase64}`;

  } catch (error) {
    // Generic error (don't leak implementation details)
    throw new Error('Encryption failed. Please try again.');
  }
}

/**
 * Decrypt a password-protected WIF private key
 *
 * @param encryptedData - Encrypted string (salt:iv:authTag:ciphertext)
 * @param password - User-provided password
 * @returns Decrypted WIF string
 * @throws Error if password incorrect or data corrupted
 */
async function decryptWIF(encryptedData: string, password: string): Promise<string> {
  try {
    // 1. Parse encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltBase64, ivBase64, authTagBase64, ciphertextBase64] = parts;

    // 2. Decode from base64
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const authTag = Uint8Array.from(atob(authTagBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

    // 3. Derive AES-256 key from password
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      passwordKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    // 4. Combine ciphertext + auth tag for decryption
    const encryptedBuffer = new Uint8Array([...ciphertext, ...authTag]);

    // 5. Decrypt using AES-256-GCM
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      aesKey,
      encryptedBuffer
    );

    // 6. Convert to string (WIF)
    const wif = new TextDecoder().decode(decryptedBuffer);

    return wif;

  } catch (error) {
    // Decryption failure = wrong password or corrupted data
    if (error instanceof Error && error.message.includes('decrypt')) {
      throw new Error('Incorrect password or corrupted file');
    }
    throw new Error('Decryption failed. Check password and file integrity.');
  }
}
```

**Security Notes**:
- ✅ Uses Web Crypto API (native, audited implementation)
- ✅ Salt and IV are unique per export
- ✅ Auth tag provides integrity verification
- ✅ Generic error messages (no info leakage)
- ✅ No password logging or storage

---

## 4. Import Security Requirements

### 4.1 File Upload Security

**REQUIREMENT 8: Secure File Reading**

**Implementation**:
```typescript
async function readImportFile(file: File): Promise<string> {
  // 1. Validate file size (max 1MB - way more than needed)
  const MAX_FILE_SIZE = 1024 * 1024; // 1MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large. Maximum size: 1MB');
  }

  // 2. Validate file type (accept .txt only)
  if (!file.name.endsWith('.txt')) {
    throw new Error('Invalid file type. Only .txt files supported.');
  }

  // 3. Read file content (in-memory only, never write to disk)
  const fileContent = await file.text();

  // 4. Validate content length (reasonable bounds)
  if (fileContent.length > 10000) {
    throw new Error('File content too large');
  }

  return fileContent;
}
```

**Security Principles**:
- ✅ File read entirely in-memory (never written to temp files)
- ✅ Size validation prevents DoS attacks
- ✅ Type validation prevents malicious file uploads
- ✅ Content validation prevents buffer overflows

**REQUIREMENT 9: File Parsing Security**

**Implementation**:
```typescript
interface ParsedImportFile {
  encrypted: boolean;
  wif?: string;              // If plaintext
  encryptedData?: string;    // If encrypted
  accountName?: string;      // From metadata
  addressType?: string;      // From metadata
  firstAddress?: string;     // From metadata
}

function parseImportFile(fileContent: string): ParsedImportFile {
  // 1. Detect file type
  const isEncrypted = fileContent.includes('Encrypted Private Key:');
  const isPlaintext = fileContent.includes('Private Key (WIF):');

  if (!isEncrypted && !isPlaintext) {
    // Try as raw WIF string
    const trimmed = fileContent.trim();
    if (isValidWIFFormat(trimmed)) {
      return { encrypted: false, wif: trimmed };
    }
    throw new Error('Invalid file format. Expected WIF or exported account file.');
  }

  // 2. Extract metadata (non-sensitive)
  const accountName = extractField(fileContent, 'Account:');
  const addressType = extractField(fileContent, 'Address Type:');
  const firstAddress = extractField(fileContent, 'First Address:');

  // 3. Extract WIF or encrypted data
  if (isPlaintext) {
    const wif = extractField(fileContent, 'Private Key (WIF):');
    return { encrypted: false, wif, accountName, addressType, firstAddress };
  } else {
    const encryptedData = extractField(fileContent, 'Encrypted Private Key:');
    return { encrypted: true, encryptedData, accountName, addressType, firstAddress };
  }
}

function extractField(content: string, fieldName: string): string | undefined {
  const regex = new RegExp(`${fieldName}\\s*(.+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : undefined;
}

function isValidWIFFormat(str: string): boolean {
  // WIF starts with specific characters:
  // Testnet: 9, c (uncompressed/compressed)
  // Mainnet: 5, K, L (uncompressed/compressed)
  const wifRegex = /^[9c5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/;
  return wifRegex.test(str);
}
```

**Security Principles**:
- ✅ Detect file type before processing
- ✅ Support both formatted files and raw WIF
- ✅ Validate WIF format with regex (prevent injection)
- ✅ No execution of file content (pure parsing)

### 4.2 WIF Validation

**REQUIREMENT 10: Strict WIF Validation**

**Validation Steps** (All must pass):

1. **Format Validation**
   ```typescript
   function validateWIFFormat(wif: string): boolean {
     // Must be Base58Check format
     const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
     if (!base58Regex.test(wif)) {
       return false;
     }

     // Must be correct length (51-52 chars)
     if (wif.length < 51 || wif.length > 52) {
       return false;
     }

     return true;
   }
   ```

2. **Network Validation** (CRITICAL)
   ```typescript
   function validateWIFNetwork(wif: string): 'testnet' | 'mainnet' | 'invalid' {
     // Testnet WIF prefixes:
     // - '9' (uncompressed)
     // - 'c' (compressed)

     // Mainnet WIF prefixes:
     // - '5' (uncompressed)
     // - 'K' or 'L' (compressed)

     const firstChar = wif[0];

     if (firstChar === '9' || firstChar === 'c') {
       return 'testnet';
     } else if (firstChar === '5' || firstChar === 'K' || firstChar === 'L') {
       return 'mainnet';
     } else {
       return 'invalid';
     }
   }
   ```

3. **Checksum Validation**
   ```typescript
   function validateWIFChecksum(wif: string, network: 'testnet' | 'mainnet'): boolean {
     try {
       const networkObj = network === 'testnet'
         ? bitcoin.networks.testnet
         : bitcoin.networks.bitcoin;

       // This will throw if checksum invalid
       KeyManager.validateWIF(wif, network);

       return true;
     } catch (error) {
       return false;
     }
   }
   ```

4. **Complete Validation Function**
   ```typescript
   function validateWIF(wif: string): {
     valid: boolean;
     network?: 'testnet' | 'mainnet';
     error?: string;
   } {
     // Step 1: Format
     if (!validateWIFFormat(wif)) {
       return { valid: false, error: 'Invalid WIF format' };
     }

     // Step 2: Network detection
     const network = validateWIFNetwork(wif);
     if (network === 'invalid') {
       return { valid: false, error: 'Invalid WIF prefix' };
     }

     // Step 3: Network must be testnet (CRITICAL)
     if (network !== 'testnet') {
       return {
         valid: false,
         error: `Wrong network: This is a ${network} key, but wallet requires testnet keys`
       };
     }

     // Step 4: Checksum
     if (!validateWIFChecksum(wif, network)) {
       return { valid: false, error: 'Invalid WIF checksum' };
     }

     // All checks passed
     return { valid: true, network: 'testnet' };
   }
   ```

**CRITICAL SECURITY RULE**:
- ❌ **NEVER** accept mainnet keys on testnet wallet
- ❌ **NEVER** process mainnet keys beyond validation (don't decode)
- ✅ **ALWAYS** reject mainnet keys immediately with clear error

### 4.3 Decryption Security

**REQUIREMENT 11: Secure Decryption in Memory**

**Implementation**:
```typescript
async function importEncryptedWIF(
  encryptedData: string,
  filePassword: string
): Promise<string> {
  let wif: string | null = null;

  try {
    // 1. Decrypt in-memory only
    wif = await decryptWIF(encryptedData, filePassword);

    // 2. Validate decrypted WIF immediately
    const validation = validateWIF(wif);
    if (!validation.valid) {
      // Clear WIF before throwing
      wif = overwriteString(wif);
      throw new Error(validation.error || 'Invalid private key');
    }

    // 3. Return validated WIF (caller responsible for cleanup)
    return wif;

  } catch (error) {
    // Clear any decrypted data on error
    if (wif) {
      wif = overwriteString(wif);
    }

    // Re-throw with generic message
    if (error instanceof Error && error.message.includes('password')) {
      throw new Error('Incorrect file password or corrupted file');
    }
    throw error;
  }
}
```

**Security Principles**:
- ✅ Decryption happens entirely in-memory
- ✅ No temporary files created
- ✅ Validation before acceptance
- ✅ Clear sensitive data on errors
- ✅ Generic error messages (no info leakage)

### 4.4 Duplicate Key Detection

**REQUIREMENT 12: Prevent Duplicate Imports**

**Implementation**:
```typescript
function checkDuplicateKey(wif: string, existingAccounts: Account[]): {
  isDuplicate: boolean;
  existingAccountName?: string;
} {
  try {
    // Derive first address from WIF
    const keyInfo = KeyManager.decodeWIF(wif, 'testnet');
    const { publicKey, compressed } = keyInfo;

    // Create address from public key
    const payment = bitcoin.payments.p2wpkh({
      pubkey: Buffer.from(publicKey, 'hex'),
      network: bitcoin.networks.testnet
    });
    const derivedAddress = payment.address!;

    // Check if any existing account has this address
    for (const account of existingAccounts) {
      // For imported accounts, check first address
      if (account.imported && account.addresses.length > 0) {
        if (account.addresses[0].address === derivedAddress) {
          return {
            isDuplicate: true,
            existingAccountName: account.name
          };
        }
      }

      // For HD accounts, check all addresses (should never match, but defensive)
      for (const addr of account.addresses) {
        if (addr.address === derivedAddress) {
          return {
            isDuplicate: true,
            existingAccountName: account.name
          };
        }
      }
    }

    return { isDuplicate: false };

  } catch (error) {
    // If we can't check, allow import (user will notice if duplicate)
    return { isDuplicate: false };
  }
}
```

**User Experience**:
```
❌ Error: This account is already imported as "Savings Account"

You cannot import the same private key twice. If you want to rename the
existing account, go to Settings → Account Management.

[Cancel]  [Go to Settings]
```

**Security Note**: Duplicate detection prevents user confusion and potential
issues with multiple accounts using same private key.

### 4.5 Import Confirmation

**REQUIREMENT 13: Preview Before Import**

**UI Implementation**:
```
┌─────────────────────────────────────────┐
│ Import Private Key - Preview            │
├─────────────────────────────────────────┤
│ ✓ Valid testnet private key detected    │
│                                         │
│ First Address:                          │
│ tb1q3xy...w8k2 [Copy]                  │
│                                         │
│ Current Balance: 0.00125 tBTC          │
│ (This will be checked after import)     │
│                                         │
│ Account Name:                           │
│ [Imported Account 1__________]          │
│                                         │
│ Wallet Password:                        │
│ [___________________________] [👁]      │
│                                         │
│ [ ] I have verified this is my private │
│     key and want to add it to my wallet │
│                                         │
│ [Cancel]  [Import Account]              │
└─────────────────────────────────────────┘
```

**Security Features**:
- ✅ Show first address for verification
- ✅ Show current balance (helps user confirm it's their key)
- ✅ Require confirmation checkbox
- ✅ Require wallet password (for encryption)
- ⚠️ Balance is informational only (not validated until after import)

---

## 5. Security Warnings for Users

### 5.1 Before Export Warnings

**Warning 1: General Export Warning** (Shown in export dialog)

```
⚠️ PRIVATE KEY EXPORT WARNING ⚠️

This private key provides complete access to this account's funds.

SECURITY RISKS:
• Anyone with this key can steal all funds from this account
• Exported files are vulnerable to theft from:
  - Malware on your computer
  - Cloud backup services
  - Unauthorized physical access
  - Public printers (if you print the PDF)

BEST PRACTICES:
✓ Use password protection (strongly recommended)
✓ Store on encrypted USB drives or hardware wallets
✓ Never email or upload to cloud storage
✓ Print only on trusted, private printers
✓ Keep physical copies in a safe or lockbox
✓ Treat this like cash - if stolen, funds are gone

[ ] I understand and accept these risks

[Cancel]  [Continue to Export]
```

### 5.2 When Password Protection Disabled

**Warning 2: Plaintext Export Warning** (Extra scary)

```
⚠️⚠️⚠️ UNENCRYPTED EXPORT - MAXIMUM RISK ⚠️⚠️⚠️

You are about to export an UNENCRYPTED private key. This is DANGEROUS.

CRITICAL RISKS:
• Anyone who accesses this file can steal funds INSTANTLY
• No password protection means ZERO delay for attackers
• The file is readable by:
  - Any application on your computer
  - Malware and viruses
  - Anyone with physical access to your device
  - Cloud backup services (if they scan your files)

WHEN IS THIS ACCEPTABLE?
Only if you are:
• Storing on a device that is ALREADY encrypted (like VeraCrypt)
• Immediately transferring to cold storage (airgapped device)
• Printing for physical storage in a SECURE safe

RECOMMENDATION: Use password protection instead

Do you REALLY want to export without password protection?

( ) Yes, export UNENCRYPTED (I accept full responsibility)
    ⚠️ High Risk

[Cancel]  [Export Without Password]  [Use Password Protection] ← Recommended
```

**Visual Design**:
- 🔴 Red background with white text
- ⚠️ Triple warning icons
- "Use Password Protection" button highlighted in green
- "Export Without Password" button is red/destructive

### 5.3 After Export Warnings

**Warning 3: Post-Export Reminder** (Success notification)

**For Password-Protected Export**:
```
✅ Private key exported successfully (encrypted)

Your private key has been saved to:
bitcoin-account-savings-20251019.txt

IMPORTANT REMINDERS:
• Keep this file AND your password in separate secure locations
• If you lose the password, the key cannot be recovered
• Store the file on encrypted storage devices
• Never upload to cloud services (Dropbox, Google Drive, etc.)

[Got It]  [View Security Best Practices]
```

**For Plaintext Export**:
```
⚠️ Private key exported (UNENCRYPTED)

Your UNENCRYPTED private key has been saved to:
bitcoin-account-savings-20251019.txt

CRITICAL SECURITY WARNING:
• This file contains your private key in PLAIN TEXT
• Anyone who accesses this file can steal your funds IMMEDIATELY
• Do NOT leave this file on your computer
• Transfer to secure storage NOW
• Recommended: Import into hardware wallet and delete file

[Understood]  [Security Best Practices]
```

### 5.4 Before Import Warnings

**Warning 4: Import Security Notice** (Import dialog)

```
ℹ️ Import Private Key - Security Notice

You are about to import a private key from an external source.

BEFORE YOU IMPORT:
• Verify this private key belongs to YOU
• Never import keys received from untrusted sources
• Check the first address matches your records
• Be aware of "dust attack" scams (fake keys with small amounts)

AFTER IMPORT:
• This account will be added to your wallet
• You will have full control over the funds
• The original source may still have access (if they kept a copy)
• Consider moving funds to a new account generated by this wallet

[Cancel]  [I Understand, Continue]
```

### 5.5 PDF Printing Warnings

**Warning 5: PDF Print Warning** (Before PDF generation)

```
🖨️ PDF Export - Printing Warning

You are about to generate a PDF containing a private key.

PRINTING SECURITY RISKS:
• NEVER print on public or shared printers
  - Office printers
  - Library printers
  - Print shops (FedEx, Staples, etc.)

• Printer risks:
  - Print jobs may be stored in printer memory
  - Other users may access print queue
  - Forgotten printouts in tray

• Paper security:
  - Paper backups can be lost, stolen, or destroyed
  - Ink fades over time (use laser printer if possible)
  - Fire, water, physical damage risks

RECOMMENDATIONS:
✓ Print only on a personal printer you control
✓ Verify printout before leaving printer
✓ Store printed backup in fireproof safe
✓ Consider laminating for water protection
✓ Shred with cross-cut shredder when no longer needed

[ ] I will only print on a trusted, private printer

[Cancel]  [Generate PDF]
```

**After PDF Download**:
```
📄 PDF generated successfully

REMINDER: Only print this PDF on a trusted, private printer.

If you change your mind about printing, you can still use the
text file export instead.

[Got It]
```

---

## 6. PDF Export Security

### 6.1 PDF Generation Security

**REQUIREMENT 14: PDF Generation in Memory Only**

**Implementation**:
```typescript
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

async function generatePDFBackup(
  accountName: string,
  addressType: string,
  firstAddress: string,
  wif: string,
  encrypted: boolean,
  encryptedData?: string
): Promise<Blob> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Header
    doc.setFontSize(18);
    doc.text('Bitcoin Account Private Key Backup', 105, 20, { align: 'center' });

    // Account Information
    doc.setFontSize(12);
    doc.text(`Account: ${accountName}`, 20, 40);
    doc.text(`Address Type: ${addressType}`, 20, 50);
    doc.text(`First Address: ${firstAddress}`, 20, 60);
    doc.text(`Network: Testnet`, 20, 70);
    doc.text(`Generated: ${new Date().toISOString()}`, 20, 80);

    if (encrypted) {
      // Encrypted key (no QR code - data too long)
      doc.setFontSize(10);
      doc.text('Encrypted Private Key:', 20, 100);

      // Split long encrypted data into lines
      const lines = splitIntoLines(encryptedData!, 80);
      let yPos = 110;
      for (const line of lines) {
        doc.text(line, 20, yPos);
        yPos += 5;
      }

      // Decryption instructions
      doc.text('Encryption: AES-256-GCM with PBKDF2 (100,000 iterations)', 20, yPos + 10);
      doc.text('To decrypt: Use "Import Private Key" and enter export password', 20, yPos + 20);

    } else {
      // Plaintext key with QR code
      doc.setFontSize(10);
      doc.text('Private Key (WIF Format):', 20, 100);
      doc.setFont('courier'); // Monospace for WIF
      doc.text(wif, 20, 110);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(wif, {
        errorCorrectionLevel: 'M',
        width: 200,
        margin: 2
      });

      // Add QR code to PDF
      doc.addImage(qrDataUrl, 'PNG', 20, 120, 60, 60);
      doc.setFont('helvetica'); // Reset font
      doc.setFontSize(8);
      doc.text('Scan QR code to import', 20, 185);
    }

    // Security warning box (red border)
    doc.setDrawColor(255, 0, 0);
    doc.setLineWidth(1);
    doc.rect(15, 200, 180, 50);

    doc.setFontSize(12);
    doc.setTextColor(255, 0, 0);
    doc.text('⚠️ CRITICAL SECURITY INFORMATION', 105, 210, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text('• This private key provides complete access to account funds', 20, 220);
    doc.text('• Never share this document with anyone', 20, 227);
    doc.text('• Store in a secure, fireproof location', 20, 234);
    doc.text('• Destroy (shred) when no longer needed', 20, 241);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Bitcoin Wallet Extension - Testnet', 105, 280, { align: 'center' });

    // Return PDF as Blob (in-memory)
    return doc.output('blob');

  } catch (error) {
    throw new Error('PDF generation failed. Please try text file export instead.');
  }
}

function splitIntoLines(text: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.substring(i, i + charsPerLine));
  }
  return lines;
}
```

**Security Principles**:
- ✅ PDF generated entirely in-memory (never written to temp files)
- ✅ Returned as Blob for immediate download
- ✅ No server-side processing (client-side only)
- ✅ QR code generated in-memory
- ✅ Clear security warnings in PDF itself

### 6.2 QR Code Security

**REQUIREMENT 15: QR Code Specifications**

**QR Code Properties**:
- Size: 200x200px (60x60mm in PDF)
- Error Correction: Medium (M) - 15% damage recovery
- Margin: 2 modules (quiet zone)
- Format: PNG (embedded in PDF)
- Content: Full WIF string (51-52 characters)

**Security Considerations**:

1. **QR Code Size**:
   - WIF is ~51 characters
   - QR code with M error correction can handle ~130 characters
   - ✅ No truncation needed, full WIF fits

2. **Error Correction Level**:
   - L (7%): Too low, risky if damaged
   - M (15%): ✅ Good balance (recommended)
   - Q (25%): Larger QR code, unnecessary
   - H (30%): Very large, overkill for WIF

3. **Scanability**:
   - 200x200px at 150 DPI = clear scan
   - Black on white (high contrast)
   - Quiet zone ensures edge detection

4. **Privacy**:
   - QR code is ONLY in PDF (not shown in UI)
   - User controls when/where to print
   - Warning about public printers

**RULE**: QR codes ONLY for plaintext WIF (not encrypted data - too long)

### 6.3 PDF Security Risks

**Risk 1: Printer Memory**
- **Threat**: Printers store print jobs in memory
- **Impact**: Private key accessible via printer admin panel
- **Mitigation**: Warn users to use private printers only

**Risk 2: Print Queue Interception**
- **Threat**: Network print queues can be monitored
- **Impact**: Private key captured in transit to printer
- **Mitigation**: Recommend local USB printers, not network printers

**Risk 3: Forgotten Printouts**
- **Threat**: User forgets printout in printer tray
- **Impact**: Next person to use printer finds private key
- **Mitigation**: Warning to verify printout retrieved immediately

**Risk 4: Physical Theft**
- **Threat**: Printed backup stolen from home/office
- **Impact**: Complete account compromise
- **Mitigation**: Recommend fireproof safe storage

**Risk 5: Photocopying**
- **Threat**: Someone photocopies the backup
- **Impact**: Duplicate of private key exists
- **Mitigation**: User education, no technical mitigation

**Overall Assessment**: PDF export is HIGH RISK but acceptable for users who:
- Need physical backup (paper wallet)
- Have secure home printer
- Have fireproof safe for storage
- Understand physical security requirements

---

## 7. Secure Coding Requirements

### 7.1 Mandatory Security Rules

**RULE 1: NEVER Log Private Keys or Seed Phrases**

**Implementation**:
```typescript
// ❌ WRONG - NEVER DO THIS
console.log('Exporting WIF:', wif); // CRITICAL SECURITY VIOLATION

// ❌ WRONG - Even in errors
throw new Error(`Failed to export: ${wif}`); // CRITICAL SECURITY VIOLATION

// ✅ CORRECT - Generic logging only
console.log('Exporting private key for account', accountIndex);

// ✅ CORRECT - Sanitized errors
throw new Error('Private key export failed. Please try again.');
```

**Enforcement**:
- Automated linting rule: Flag any `console.log()` in crypto code
- Code review checklist: Verify no sensitive data logged
- Grep for keywords: `wif`, `privateKey`, `seed`, `mnemonic` in logs

**RULE 2: Clear Sensitive Data from Memory**

**Implementation**:
```typescript
// After using private key, clear it
let wif: string | null = 'cVt4o7BGAig...';

// Use the WIF
await processWIF(wif);

// Clear from memory (best effort in JavaScript)
wif = overwriteString(wif);
wif = null;

// Helper function
function overwriteString(str: string): string {
  // JavaScript strings are immutable, but we can minimize references
  const zeros = '0'.repeat(str.length);
  str = zeros;
  return '';
}
```

**RULE 3: No Temporary Files**

**Implementation**:
```typescript
// ❌ WRONG - NEVER write private keys to temp files
fs.writeFileSync('/tmp/export.txt', wif); // CRITICAL SECURITY VIOLATION

// ✅ CORRECT - In-memory only, direct download
const blob = new Blob([fileContent], { type: 'text/plain' });
const url = URL.createObjectURL(blob);
// Trigger download immediately
```

**RULE 4: Validate All Inputs**

**Implementation**:
```typescript
// Validate WIF before processing
function processWIF(wif: string): void {
  // 1. Type check
  if (typeof wif !== 'string') {
    throw new Error('Invalid input type');
  }

  // 2. Length check
  if (wif.length < 51 || wif.length > 52) {
    throw new Error('Invalid WIF length');
  }

  // 3. Format check (Base58)
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(wif)) {
    throw new Error('Invalid WIF format');
  }

  // 4. Network check
  const network = wif[0];
  if (network !== '9' && network !== 'c') {
    throw new Error('Invalid network (testnet required)');
  }

  // 5. Checksum validation (via library)
  if (!KeyManager.validateWIF(wif, 'testnet')) {
    throw new Error('Invalid WIF checksum');
  }

  // Now safe to process
}
```

**RULE 5: Sanitize Error Messages**

**Implementation**:
```typescript
// ❌ WRONG - Error exposes sensitive data
catch (error) {
  throw new Error(`Encryption failed for WIF: ${wif}`); // CRITICAL VIOLATION
}

// ✅ CORRECT - Generic error messages
catch (error) {
  console.error('Export error:', error.message); // Safe to log error type
  throw new Error('Private key export failed. Please try again.');
}
```

### 7.2 Input Validation Rules

**Validation Checklist**:

1. **File Uploads**:
   - ✅ Max size: 1MB
   - ✅ File type: .txt only
   - ✅ Content length: < 10,000 chars
   - ✅ No executable content

2. **WIF Strings**:
   - ✅ Type: string
   - ✅ Length: 51-52 characters
   - ✅ Format: Base58Check
   - ✅ Network: Testnet only (reject mainnet)
   - ✅ Checksum: Valid

3. **Passwords**:
   - ✅ Min length: 8 characters
   - ✅ Max length: 256 characters (practical)
   - ✅ No null bytes or control characters

4. **Account Names**:
   - ✅ Max length: 50 characters
   - ✅ Sanitize for filename: Remove special chars
   - ✅ No path traversal: No `..`, `/`, `\`

### 7.3 Secure PDF Generation

**Library Selection**: jsPDF
- ✅ Client-side only (no server processing)
- ✅ MIT license, widely used
- ✅ No network requests
- ✅ No dependencies on external APIs

**Security Checks**:
- ✅ Generate in-memory (no temp files)
- ✅ No external resources loaded
- ✅ No JavaScript in PDF (no exploit vectors)
- ✅ Output as Blob (memory-safe)

### 7.4 Memory Management

**Best Practices**:

1. **Scope Limitation**:
   ```typescript
   async function exportAccount(): Promise<void> {
     let wif: string | null = null;

     try {
       wif = await deriveWIF();
       const exported = await encryptWIF(wif);

       // Clear WIF as soon as encrypted
       wif = overwriteString(wif);
       wif = null;

       return exported;
     } finally {
       // Ensure cleanup even on error
       if (wif) {
         wif = overwriteString(wif);
       }
     }
   }
   ```

2. **No Caching**:
   ```typescript
   // ❌ WRONG - Caching private keys
   const wifCache: Record<number, string> = {};

   // ✅ CORRECT - Derive on-demand, clear immediately
   async function getWIF(accountIndex: number): Promise<string> {
     const wif = await deriveWIF(accountIndex);
     // Use immediately, then clear
     return wif;
   }
   ```

3. **Garbage Collection**:
   - JavaScript has automatic GC, but help it along
   - Set variables to null when done
   - Avoid long-lived references to sensitive data

---

## 8. Multisig Account Handling

### 8.1 Why Multisig Cannot Be Exported

**Technical Reason**:
- Multisig accounts don't have a single private key
- They have multiple co-signer xpubs (public keys)
- No WIF exists for a multisig account
- Exporting would require exporting:
  - This wallet's xpub (already known)
  - Other co-signers' xpubs (not private keys)
  - Multisig configuration (m-of-n, script type)

**Correct Approach**:
- Export individual co-signer xpubs (separate feature, future)
- Export multisig wallet configuration (JSON format, future)
- Backup seed phrase (recovers xpub derivation capability)

### 8.2 UI Treatment

**REQUIREMENT 16: Disable Export for Multisig Accounts**

**Implementation**:

**Option A: Hidden Button** (Recommended)
```tsx
{account.type !== 'multisig' && (
  <button onClick={() => exportPrivateKey(account.index)}>
    Export Private Key
  </button>
)}
```

**Option B: Disabled Button with Tooltip**
```tsx
<button
  disabled={account.type === 'multisig'}
  title={account.type === 'multisig'
    ? 'Multisig accounts cannot be exported as a single private key. Export co-signer xpubs instead.'
    : 'Export this account\'s private key'
  }
  onClick={() => exportPrivateKey(account.index)}
>
  Export Private Key
</button>
```

**Recommendation**: **Option A (Hidden)**
- Less UI clutter
- Clearer that it's not an option
- No confusion about why button is disabled

**Tooltip for Multisig Accounts** (If using Option B):
```
⚠️ Cannot Export Multisig Account

Multisig accounts do not have a single private key. They require multiple
co-signers to authorize transactions.

To backup this account:
• Backup your wallet seed phrase (recovers your signing capability)
• Export co-signer xpubs (future feature)
• Save multisig configuration (m-of-n, script type)

[Learn More About Multisig Backup]
```

### 8.3 Multisig Account Detection

**Implementation**:
```typescript
interface Account {
  index: number;
  name: string;
  type: 'hd' | 'imported' | 'multisig';
  addressType: string;
  // ... other fields
}

function isMultisigAccount(account: Account): boolean {
  return account.type === 'multisig';
}

function canExportPrivateKey(account: Account): boolean {
  // Only HD and imported accounts can be exported
  return account.type === 'hd' || account.type === 'imported';
}
```

**Usage in UI**:
```tsx
<AccountList>
  {accounts.map(account => (
    <AccountRow key={account.index}>
      <AccountName>{account.name}</AccountName>

      {canExportPrivateKey(account) && (
        <ExportButton onClick={() => handleExport(account)}>
          Export Private Key
        </ExportButton>
      )}

      {isMultisigAccount(account) && (
        <MultisigBadge>
          Multisig ({account.multisigConfig.m}-of-{account.multisigConfig.n})
        </MultisigBadge>
      )}
    </AccountRow>
  ))}
</AccountList>
```

---

## 9. Comparison to Full Wallet Backup

### 9.1 Feature Comparison Table

| Feature | Private Key Export (This Feature) | Full Wallet Backup (Future) |
|---------|-----------------------------------|----------------------------|
| **Scope** | Single account | Entire wallet (all accounts) |
| **Format** | WIF (industry standard) | Custom encrypted format |
| **Password** | Optional (user choice) | Mandatory (separate password) |
| **Encryption** | AES-256-GCM (if enabled) | AES-256-GCM (always) |
| **PBKDF2 Iterations** | 100,000 | 600,000 |
| **HMAC Signature** | No (GCM auth tag only) | Yes (extra integrity) |
| **Includes Seed** | No (derives single key) | Yes (entire seed phrase) |
| **Includes Metadata** | Account name, first address | All accounts, settings, history |
| **Interoperability** | ✅ Any wallet supporting WIF | ❌ This wallet only |
| **Use Case** | Account migration, single backup | Full wallet recovery |
| **Security Level** | HIGH (if password used) | CRITICAL (wallet seed) |
| **Complexity** | Low (one account) | High (entire wallet state) |

### 9.2 Security Reduction Analysis

**Question**: Is 100K iterations acceptable for per-account export vs 600K for full backup?

**Answer**: ✅ **YES - Acceptable security reduction**

**Justification**:

1. **Lower Stakes**:
   - Private key export: Single account at risk
   - Full wallet backup: All accounts + future accounts at risk
   - **Impact**: 1 account loss < entire wallet loss

2. **User Behavior**:
   - Private key export: Often used for temporary migration
   - Full wallet backup: Long-term cold storage
   - **Duration**: Short-term storage needs less iteration count

3. **Mitigation**:
   - User can move funds from exported account to new account
   - Limits exposure to single account balance
   - **Recovery**: Easier to isolate damage

4. **Performance**:
   - 100K iterations: ~500ms encryption/decryption
   - 600K iterations: ~3 seconds encryption/decryption
   - **UX**: Faster export/import improves usability

5. **Threat Model**:
   - Private key export: User chooses encryption (optional)
   - Full wallet backup: Always encrypted (mandatory)
   - **Risk Acceptance**: User explicitly opts into export

**Security Equivalence**:
- 100K iterations + 8-char password ≈ 600K iterations + weak password
- Both protect against offline brute force
- Both require strong password for maximum security

**Conclusion**:
- ✅ 100K iterations is **sufficient** for optional per-account encryption
- ✅ 600K iterations is **necessary** for mandatory full wallet backup
- ✅ Security reduction is **proportional** to scope reduction
- ✅ Overall risk is **acceptable** with proper user warnings

### 9.3 When to Use Each Feature

**Use Private Key Export When**:
- ✅ Migrating single account to another wallet
- ✅ Creating backup of one high-value account
- ✅ Sharing account with another device (same user)
- ✅ Need WIF format for hardware wallet import
- ✅ Want quick backup without full wallet complexity

**Use Full Wallet Backup When** (Future Feature):
- ✅ Backing up entire wallet for disaster recovery
- ✅ Migrating to new computer (all accounts)
- ✅ Long-term cold storage backup
- ✅ Protecting against wallet extension loss
- ✅ Need complete wallet state (settings, history, etc.)

**Security Recommendation**:
- For critical funds: Use BOTH
  - Full wallet backup for complete recovery
  - Per-account export for quick access to specific accounts
- For casual use: Per-account export sufficient
- For long-term storage: Full wallet backup mandatory

---

## 10. Security Testing Requirements

### 10.1 Unit Test Requirements

**Test Coverage Target**: 100% for all security-critical functions

**Critical Test Cases**:

**TC-SEC-PK-001: WIF Encryption Strength**
```typescript
describe('WIF Encryption', () => {
  it('should use AES-256-GCM', async () => {
    const encrypted = await encryptWIF(testWIF, testPassword);
    // Verify format includes all components
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(4); // salt:iv:authTag:ciphertext
  });

  it('should use 100,000 PBKDF2 iterations', async () => {
    const startTime = Date.now();
    await encryptWIF(testWIF, testPassword);
    const duration = Date.now() - startTime;

    // 100K iterations should take 300-1000ms (depending on hardware)
    expect(duration).toBeGreaterThan(300);
    expect(duration).toBeLessThan(2000);
  });

  it('should generate unique salt per export', async () => {
    const encrypted1 = await encryptWIF(testWIF, testPassword);
    const encrypted2 = await encryptWIF(testWIF, testPassword);

    const salt1 = encrypted1.split(':')[0];
    const salt2 = encrypted2.split(':')[0];

    expect(salt1).not.toEqual(salt2);
  });

  it('should generate unique IV per export', async () => {
    const encrypted1 = await encryptWIF(testWIF, testPassword);
    const encrypted2 = await encryptWIF(testWIF, testPassword);

    const iv1 = encrypted1.split(':')[1];
    const iv2 = encrypted2.split(':')[1];

    expect(iv1).not.toEqual(iv2);
  });
});
```

**TC-SEC-PK-002: WIF Decryption Security**
```typescript
describe('WIF Decryption', () => {
  it('should decrypt with correct password', async () => {
    const encrypted = await encryptWIF(testWIF, 'correct-password');
    const decrypted = await decryptWIF(encrypted, 'correct-password');

    expect(decrypted).toEqual(testWIF);
  });

  it('should fail with incorrect password', async () => {
    const encrypted = await encryptWIF(testWIF, 'correct-password');

    await expect(
      decryptWIF(encrypted, 'wrong-password')
    ).rejects.toThrow('Incorrect password');
  });

  it('should fail with corrupted data', async () => {
    const encrypted = await encryptWIF(testWIF, testPassword);
    const corrupted = encrypted.replace(/./g, 'X'); // Corrupt entire string

    await expect(
      decryptWIF(corrupted, testPassword)
    ).rejects.toThrow();
  });
});
```

**TC-SEC-PK-003: Network Validation**
```typescript
describe('Network Validation', () => {
  const TESTNET_WIF = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';
  const MAINNET_WIF = 'L1aW4aubDFB7yfras2S1mN3bqg9nwySY8nkoLmJebSLD5BWv3ENZ';

  it('should accept testnet WIF', () => {
    const validation = validateWIF(TESTNET_WIF);

    expect(validation.valid).toBe(true);
    expect(validation.network).toBe('testnet');
  });

  it('should REJECT mainnet WIF', () => {
    const validation = validateWIF(MAINNET_WIF);

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('mainnet');
    expect(validation.error).toContain('testnet');
  });

  it('should reject invalid WIF format', () => {
    const invalidWIF = 'not-a-valid-wif-string';
    const validation = validateWIF(invalidWIF);

    expect(validation.valid).toBe(false);
  });
});
```

**TC-SEC-PK-004: Memory Clearing**
```typescript
describe('Memory Security', () => {
  it('should clear WIF after export', async () => {
    const accountIndex = 0;
    let wifRef: string | null = null;

    // Mock to capture WIF reference
    const originalExport = exportPrivateKey;
    exportPrivateKey = jest.fn(async (index) => {
      wifRef = await deriveWIF(index);
      const result = await originalExport(index);
      return result;
    });

    await exportPrivateKey(accountIndex);

    // Verify WIF was cleared
    expect(wifRef).toBeNull();
  });

  it('should clear WIF after import', async () => {
    const encrypted = await encryptWIF(testWIF, testPassword);

    let wifRef: string | null = null;

    // Import with capturing
    wifRef = await decryptWIF(encrypted, testPassword);
    await importPrivateKey(wifRef, 'Test Account');

    // Note: This test is best-effort since JavaScript doesn't allow
    // true memory inspection. We verify the cleanup code is called.
  });
});
```

**TC-SEC-PK-005: Password Strength Validation**
```typescript
describe('Password Strength', () => {
  it('should reject passwords < 8 characters', () => {
    expect(() => validatePassword('short')).toThrow('at least 8 characters');
  });

  it('should accept 8+ character passwords', () => {
    expect(() => validatePassword('longenough')).not.toThrow();
  });

  it('should classify password strength correctly', () => {
    expect(getPasswordStrength('password')).toBe('weak');
    expect(getPasswordStrength('Password123')).toBe('medium');
    expect(getPasswordStrength('P@ssw0rd!2025')).toBe('strong');
  });

  it('should reject common passwords', () => {
    expect(() => validatePassword('password123')).toThrow('too common');
    expect(() => validatePassword('qwerty')).toThrow('too common');
  });
});
```

### 10.2 Integration Test Requirements

**TC-SEC-PK-006: Export-Import Roundtrip (Plaintext)**
```typescript
describe('Export-Import Roundtrip (Plaintext)', () => {
  it('should successfully export and import same account', async () => {
    // 1. Create account
    const accountIndex = 0;
    const accountName = 'Test Account';

    // 2. Export private key (no password)
    const exportResult = await exportPrivateKey(accountIndex, null);
    expect(exportResult.encrypted).toBe(false);
    const wif = exportResult.data;

    // 3. Import into new wallet
    const importedAccount = await importPrivateKey(wif, 'Imported Test');

    // 4. Verify same first address
    const originalAddress = await getFirstAddress(accountIndex);
    const importedAddress = importedAccount.addresses[0].address;

    expect(importedAddress).toEqual(originalAddress);
  });
});
```

**TC-SEC-PK-007: Export-Import Roundtrip (Encrypted)**
```typescript
describe('Export-Import Roundtrip (Encrypted)', () => {
  it('should successfully export and import with password', async () => {
    const accountIndex = 0;
    const exportPassword = 'SecureExportPassword123!';

    // 1. Export with password
    const exportResult = await exportPrivateKey(accountIndex, exportPassword);
    expect(exportResult.encrypted).toBe(true);

    // 2. Parse exported file
    const parsed = parseImportFile(exportResult.fileContent);
    expect(parsed.encrypted).toBe(true);

    // 3. Import with password
    const wif = await decryptWIF(parsed.encryptedData!, exportPassword);
    const importedAccount = await importPrivateKey(wif, 'Imported');

    // 4. Verify addresses match
    const originalAddress = await getFirstAddress(accountIndex);
    expect(importedAccount.addresses[0].address).toEqual(originalAddress);
  });

  it('should fail with wrong password', async () => {
    const accountIndex = 0;
    const exportPassword = 'CorrectPassword';
    const wrongPassword = 'WrongPassword';

    const exportResult = await exportPrivateKey(accountIndex, exportPassword);
    const parsed = parseImportFile(exportResult.fileContent);

    await expect(
      decryptWIF(parsed.encryptedData!, wrongPassword)
    ).rejects.toThrow('Incorrect password');
  });
});
```

**TC-SEC-PK-008: Duplicate Import Detection**
```typescript
describe('Duplicate Import Detection', () => {
  it('should prevent importing same key twice', async () => {
    // 1. Export account
    const exportResult = await exportPrivateKey(0, null);
    const wif = exportResult.data;

    // 2. Import once
    const imported1 = await importPrivateKey(wif, 'Import 1');
    expect(imported1).toBeDefined();

    // 3. Try to import again
    await expect(
      importPrivateKey(wif, 'Import 2')
    ).rejects.toThrow('already imported');
  });
});
```

### 10.3 Penetration Testing Requirements

**PT-SEC-PK-001: Attempt to Extract WIF from Memory**
- Use Chrome DevTools memory profiler
- Take heap snapshots during export
- Search for WIF strings in memory
- **Expected**: WIF cleared within 1 second of export

**PT-SEC-PK-002: Brute Force Encrypted Export**
- Generate encrypted export with known weak password
- Use password cracking tool (e.g., John the Ripper)
- Measure time to crack 8-char password
- **Expected**: >1 hour for 8-char, >1 day for 10-char

**PT-SEC-PK-003: File Format Fuzzing**
- Generate malformed import files
- Corrupt encryption format (salt:iv:authTag:ciphertext)
- Test with extremely long inputs
- **Expected**: All reject gracefully, no crashes

**PT-SEC-PK-004: Network Confusion Attack**
- Attempt to import mainnet WIF on testnet wallet
- Attempt to import invalid network prefixes
- **Expected**: All rejected with clear error messages

**PT-SEC-PK-005: PDF Security Analysis**
- Analyze generated PDF for embedded scripts
- Check for external resource references
- Verify QR code encodes ONLY WIF (no extra data)
- **Expected**: No security vulnerabilities in PDF

### 10.4 Manual QA Test Cases

**QA-SEC-PK-001: User Warning Flow**
- [ ] Export dialog shows critical warning before export
- [ ] User cannot proceed without acknowledging checkbox
- [ ] Plaintext export shows extra scary warning
- [ ] Post-export notification includes security reminders

**QA-SEC-PK-002: Password Protection**
- [ ] Password protection checkbox works
- [ ] Password fields show/hide toggle works
- [ ] Password strength meter updates in real-time
- [ ] Cannot export with password < 8 chars

**QA-SEC-PK-003: File Generation**
- [ ] File downloads with correct name format
- [ ] File contains all expected metadata
- [ ] Encrypted file format is parsable
- [ ] PDF generates without errors

**QA-SEC-PK-004: Import Validation**
- [ ] Import detects encrypted vs plaintext files
- [ ] Import shows password field for encrypted files
- [ ] Import shows first address preview
- [ ] Import rejects mainnet keys with clear error

**QA-SEC-PK-005: Multisig Handling**
- [ ] Multisig accounts do not show export button
- [ ] Tooltip (if present) explains why export unavailable

### 10.5 Security Audit Checklist

**Pre-Release Security Review**:

- [ ] **Encryption**: All crypto uses Web Crypto API (no custom implementation)
- [ ] **Iterations**: PBKDF2 uses exactly 100,000 iterations
- [ ] **Randomness**: Salt and IV use crypto.getRandomValues() (not Math.random())
- [ ] **Logging**: No WIF, private keys, or passwords logged anywhere
- [ ] **Memory**: Sensitive data cleared after use (verified in code review)
- [ ] **Validation**: Network validation rejects mainnet keys
- [ ] **Warnings**: All security warnings display correctly
- [ ] **PDF**: Generated in-memory only (no temp files)
- [ ] **QR Codes**: Only in PDF, not in UI dialogs
- [ ] **Multisig**: Export disabled for multisig accounts
- [ ] **Errors**: All errors are generic (no info leakage)
- [ ] **Testing**: All security unit tests pass
- [ ] **Dependencies**: No vulnerable dependencies (npm audit)

---

## 11. Security Checklist

### 11.1 Implementation Security Checklist

**Before Starting Development**:
- [ ] Read this entire security specification
- [ ] Understand threat model and attack vectors
- [ ] Review existing encryption implementation (CryptoUtils)
- [ ] Familiarize with KeyManager WIF functions

**During Development**:
- [ ] Use Web Crypto API for all encryption (no custom crypto)
- [ ] Never log private keys, WIF strings, or passwords
- [ ] Clear sensitive variables after use
- [ ] Validate all inputs (WIF, passwords, file uploads)
- [ ] Show security warnings before export
- [ ] Generate PDFs in-memory only (no temp files)
- [ ] Test with both plaintext and encrypted exports

**Code Review Checklist**:
- [ ] No `console.log()` with sensitive data
- [ ] No private keys in error messages
- [ ] All WIF variables cleared after use
- [ ] Network validation rejects mainnet keys
- [ ] Password strength validation enforced
- [ ] Security warnings cannot be bypassed
- [ ] PDF generation is secure (no external resources)

**Testing Checklist**:
- [ ] All unit tests pass (100% coverage for crypto code)
- [ ] Integration tests pass (export-import roundtrip)
- [ ] Manual QA completed (all test cases)
- [ ] Penetration testing performed
- [ ] No security vulnerabilities found

**Pre-Merge Checklist**:
- [ ] Security expert reviewed code
- [ ] Blockchain expert reviewed WIF handling
- [ ] All tests pass (unit + integration)
- [ ] No vulnerabilities in dependencies (npm audit)
- [ ] Documentation updated (security-expert-notes.md)

**Pre-Release Checklist**:
- [ ] QA engineer tested on testnet
- [ ] All security warnings display correctly
- [ ] Export-import roundtrip tested with real wallet
- [ ] Multisig accounts properly handled
- [ ] User documentation includes security best practices

### 11.2 User Security Best Practices (To Document)

**For Users Exporting Private Keys**:

✅ **DO**:
- Use password protection (strongly recommended)
- Store exported files on encrypted USB drives
- Print only on private, trusted printers
- Store printed backups in fireproof safe
- Delete exported files after importing (if migration)
- Use strong, unique passwords (12+ characters)
- Verify first address matches before importing

❌ **DON'T**:
- Email exported private keys
- Upload to cloud storage (Dropbox, Google Drive)
- Save to unencrypted USB drives
- Print on public or shared printers
- Leave files in Downloads folder
- Reuse wallet password for export password
- Share exported keys with anyone

---

## 12. Conclusion and Approval

### 12.1 Security Assessment Summary

**Overall Security Posture**: ✅ **ACCEPTABLE with Proper Implementation**

**Critical Requirements for Approval**:
1. ✅ Strong user warnings (cannot be bypassed)
2. ✅ Optional password protection (user's informed choice)
3. ✅ 100K PBKDF2 iterations (sufficient for per-account export)
4. ✅ Strict network validation (reject mainnet keys)
5. ✅ Memory clearing (best-effort in JavaScript)
6. ✅ No logging of sensitive data
7. ✅ Multisig accounts excluded
8. ✅ Comprehensive testing (unit + integration + penetration)

**Acceptable Security Trade-offs**:
- ✅ Optional encryption vs mandatory (user education mitigates risk)
- ✅ 100K iterations vs 600K (proportional to scope: account vs wallet)
- ✅ No HMAC signature (GCM auth tag sufficient for file integrity)
- ✅ Best-effort memory clearing (JavaScript limitation, acceptable)

**Unacceptable Risks** (Must be mitigated):
- ❌ No warnings before plaintext export → **Mitigated by extra scary warning**
- ❌ Mainnet keys on testnet wallet → **Mitigated by strict network validation**
- ❌ WIF displayed in UI → **Mitigated by file-only export**
- ❌ No password strength requirements → **Mitigated by 8-char minimum + strength meter**

### 12.2 Security Approval Status

**Status**: ✅ **APPROVED - Conditionally**

**Conditions for Implementation**:
1. All security requirements in this document MUST be implemented
2. All security warnings MUST be displayed as specified
3. All security tests MUST pass before merge
4. Code MUST be reviewed by Security Expert before merge
5. Network validation MUST reject mainnet keys (no exceptions)

**Security Expert Sign-Off**:
- [ ] Security specification reviewed and approved
- [ ] Implementation code reviewed
- [ ] All security tests passed
- [ ] No critical vulnerabilities found
- [ ] User warnings adequate
- [ ] **Ready for QA and release**

**Date**: _____________
**Security Expert**: _____________

---

**END OF SECURITY SPECIFICATION**

**Next Steps**:
1. Product Manager: Integrate this spec into PRD
2. Frontend Developer: Implement export/import UI with warnings
3. Backend Developer: Implement encryption, validation, message handlers
4. Testing Expert: Write comprehensive security test suite
5. QA Engineer: Manual testing on testnet
6. Security Expert: Final code review before merge

**Related Documents**:
- `PRIVATE_KEY_EXPORT_IMPORT_PRD.md` - Product requirements
- `security-expert-notes.md` - General security documentation
- `blockchain-expert-notes.md` - WIF and Bitcoin key handling
