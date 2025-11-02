# Wallet Restore from Private Key - Product Requirements Document

**Version**: 1.0
**Date**: 2025-10-22
**Status**: Draft
**Feature Type**: Critical Gap - Wallet Recovery
**Priority**: P0 (Blocking - Recovery Feature)

---

## Executive Summary

**Problem:** Users who backed up their wallet account by exporting a private key file (WIF format) cannot restore their wallet if they lose access to the extension. The current wallet setup flow only supports creating a new wallet from a generated seed phrase or importing an existing seed phrase. There is NO option to initialize a wallet from a private key backup.

**Impact:** Users who followed best practices by backing up their private key are **locked out** and cannot access their funds. This is a critical recovery gap.

**Solution:** Add a third option to the wallet setup flow: "Import Private Key". This allows users to initialize a new wallet using only a private key (WIF), creating a **non-HD wallet** with a single imported account.

**Scope:** Initial wallet setup only. (The feature already exists for importing additional accounts into an existing wallet.)

---

## 1. Problem Statement

### Current State

**Wallet Setup Options (v0.10.0):**
1. **Create New Wallet** → Generates new seed phrase → Creates HD wallet
2. **Import Seed Phrase** → Imports seed phrase → Creates HD wallet

**Private Key Import (v0.10.0):**
- ✅ Works for adding accounts to an **existing** wallet
- ❌ Does NOT work for initial wallet creation
- ❌ No way to restore wallet from private key backup alone

### User Impact

**Scenario:** Alice's Recovery Attempt
1. Alice created a wallet and exported her account's private key (encrypted WIF file)
2. Alice's browser crashed, clearing all extension data
3. Alice tries to restore her wallet using the private key backup
4. **Alice is blocked:** No "Import Private Key" option exists during setup
5. Alice cannot access her funds despite having a valid backup

**Critical Gap:** The private key export feature exists, but the corresponding import-on-setup feature is missing, making the backup incomplete.

### Why This is P0 (Must-Have)

- **Recovery Failure:** Users with valid backups cannot recover funds
- **Trust Issue:** Export feature promises backup, but backup doesn't work for recovery
- **User Experience:** Frustration and potential loss of funds
- **Competitive Gap:** Most wallets support private key import during setup
- **Security Concern:** Users may resort to unsafe workarounds

---

## 2. Solution Overview

### Proposed Feature

Add a **third tab** to the wallet setup screen:

```
┌─────────────────────────────────────────┐
│  [ Create New ]  [ Import Seed ]       │
│  [ Import Private Key ] ← NEW           │
└─────────────────────────────────────────┘
```

**User Flow:**
1. User selects "Import Private Key"
2. User uploads private key file OR pastes WIF
3. System detects if file is encrypted
4. If encrypted, user enters file password
5. System validates WIF and extracts private key
6. User sets wallet password (for new wallet encryption)
7. User names the account (optional, default: "Imported Account")
8. System creates a **non-HD wallet** with this single account
9. User sees unlock screen → unlocks → accesses account

**Key Difference from Existing Feature:**
- **Existing:** Import private key into wallet WITH a seed phrase (account added to HD wallet)
- **New:** Import private key to CREATE wallet WITHOUT a seed phrase (non-HD wallet)

### Technical Approach

**Wallet Structure for Non-HD Wallet:**

```typescript
// StoredWalletV2 with NO HD seed
{
  version: 2,
  encryptedSeed: '',  // EMPTY - no HD seed
  salt: '{wallet_encryption_salt}',
  iv: '{wallet_encryption_iv}',
  accounts: [
    {
      accountType: 'single',
      index: 0,
      name: 'Imported Account',
      addressType: 'native-segwit',  // Detected from WIF
      importType: 'private-key',     // Mark as imported
      externalIndex: 0,
      internalIndex: 0,
      addresses: [ /* derived from private key */ ]
    }
  ],
  importedKeys: {
    0: {
      encryptedData: '{encrypted_private_key}',  // Store WIF encrypted
      salt: '{key_encryption_salt}',
      iv: '{key_encryption_iv}',
      type: 'private-key'
    }
  },
  pendingMultisigTxs: [],
  settings: {
    autoLockMinutes: 15,
    network: 'testnet'
  }
}
```

**Key Design Decisions:**

1. **No HD Seed:** `encryptedSeed` field is empty string (not null/undefined for type safety)
2. **Imported Key Storage:** Private key stored in `importedKeys[0]` with own encryption
3. **Account Marking:** `importType: 'private-key'` distinguishes from HD accounts
4. **Address Derivation:** Cannot derive new accounts (no seed), but can generate change addresses from the private key
5. **Migration Path:** If user later wants HD wallet, they can import a seed phrase and this becomes an imported account

---

## 3. User Stories with Acceptance Criteria

### Story 1: Import Wallet from Plaintext WIF During Setup

**As a** user who lost wallet access but has a plaintext WIF backup
**I want to** import my private key during wallet setup
**So that** I can restore access to my account without a seed phrase

**Acceptance Criteria:**

**AC1.1 - Setup Screen Options**
- GIVEN I open the wallet for the first time (no wallet exists)
- WHEN I view the setup screen
- THEN I should see three tabs:
  1. "Create New Wallet"
  2. "Import Seed Phrase"
  3. "Import Private Key" ← NEW
- AND all three options should be equally visible (same styling)

**AC1.2 - Import Private Key Tab UI**
- GIVEN I click "Import Private Key"
- WHEN the tab loads
- THEN I should see:
  - Title: "Import Wallet from Private Key"
  - Description: "Restore your wallet using a WIF private key backup"
  - Input method selector: ( ) Upload File  ( ) Paste WIF (radio buttons)
  - Account name input (default: "Imported Account")
  - Wallet password input (new wallet password)
  - Confirm password input
  - "Import Wallet" button (disabled until valid)
  - Help text: "What is WIF format?" (expandable)

**AC1.3 - File Upload Method**
- GIVEN I select "Upload File"
- WHEN I click "Choose File"
- THEN I should see a file picker accepting .txt files
- AND after selecting a file, the filename should display
- AND the system should auto-detect file format:
  - Plaintext WIF (starts with valid WIF characters)
  - Encrypted WIF (contains "Encrypted Private Key:" header)
  - Invalid (show error)

**AC1.4 - Paste WIF Method**
- GIVEN I select "Paste WIF"
- WHEN the textarea appears
- THEN I should be able to paste a WIF string directly
- AND real-time validation should occur:
  - ✅ Green check: Valid WIF detected
  - ✅ Network: Testnet
  - ✅ First address: tb1q...
  - ❌ Red X: Invalid WIF format

**AC1.5 - Wallet Password Setup**
- GIVEN I provide a valid WIF
- WHEN I enter wallet password fields
- THEN I should see:
  - Password strength meter (weak/medium/strong)
  - Password requirements (8+ chars, uppercase, lowercase, number)
  - Confirm password field
  - Validation: "Passwords do not match" if mismatch
- AND "Import Wallet" button should be disabled until:
  - Valid WIF provided
  - Strong password entered
  - Passwords match

**AC1.6 - Import Success (Plaintext WIF)**
- GIVEN all validation passes
- WHEN I click "Import Wallet"
- THEN:
  - Loading state: "Importing wallet..."
  - Wallet created with account index 0
  - Account type: 'private-key' (not HD)
  - Address type auto-detected from WIF
  - Wallet transitions to unlock screen
  - Success message: "Wallet imported successfully. Unlock to continue."
- AND I should be able to unlock with the new wallet password
- AND the dashboard should show my imported account with correct balance

**AC1.7 - Error Handling**
- GIVEN an error occurs during import
- WHEN the operation fails
- THEN I should see specific error messages:
  - "Invalid WIF format. Please check your private key."
  - "Wrong network: This is a mainnet key, testnet required."
  - "Unable to create wallet. Please try again."
  - "This private key is already imported." (if wallet exists)
- AND the form should remain editable (allow retry)
- AND no partial wallet should be created

---

### Story 2: Import Wallet from Encrypted WIF During Setup

**As a** user who exported an encrypted private key file
**I want to** import it during wallet setup by providing the file password
**So that** I can restore my account securely

**Acceptance Criteria:**

**AC2.1 - Encrypted File Detection**
- GIVEN I upload a file with encrypted WIF
- WHEN the system reads the file
- THEN it should detect the encryption header:
  - "Bitcoin Account Private Key (Encrypted)"
  - "Encrypted Private Key:" section present
- AND show a new field: "File Password"

**AC2.2 - File Password Input**
- GIVEN an encrypted file is detected
- WHEN the file password field appears
- THEN I should see:
  - Label: "File Password"
  - Help text: "Enter the password used when exporting this key"
  - Show/hide password toggle (eye icon)
  - Input type: password (masked)
- AND "Import Wallet" should be disabled until file password is entered

**AC2.3 - Decryption Process**
- GIVEN I provide the correct file password
- WHEN I click "Import Wallet"
- THEN:
  - System decrypts the file using AES-256-GCM
  - System extracts the WIF private key
  - System validates the WIF (network, format, checksum)
  - System shows preview: "First address: tb1q..."
  - System creates wallet (same flow as plaintext)

**AC2.4 - Wrong File Password**
- GIVEN I provide an incorrect file password
- WHEN I click "Import Wallet"
- THEN:
  - Error message: "Incorrect file password. Unable to decrypt."
  - Form remains editable
  - User can retry with different password
  - No wallet created

**AC2.5 - Corrupted Encrypted File**
- GIVEN the encrypted file is corrupted (edited manually)
- WHEN I attempt to import
- THEN:
  - Error message: "File is corrupted or invalid format."
  - Suggestion: "Please use the original exported file."
  - No decryption attempted
  - Form remains editable

---

### Story 3: Handle Edge Cases and Errors

**As a** user
**I want to** receive clear error messages for edge cases
**So that** I understand what went wrong and how to fix it

**Acceptance Criteria:**

**AC3.1 - Network Mismatch**
- GIVEN I import a mainnet WIF into testnet wallet
- WHEN validation occurs
- THEN:
  - Error: "Network mismatch: This is a mainnet private key, but this wallet requires testnet keys."
  - Suggestion: "Please use a testnet private key (starts with 9 or c)."
  - Import blocked

**AC3.2 - Invalid WIF Checksum**
- GIVEN I paste a WIF with incorrect checksum
- WHEN validation occurs
- THEN:
  - Error: "Invalid private key checksum. The key may be corrupted."
  - Suggestion: "Please verify you copied the entire WIF string."
  - Import blocked

**AC3.3 - Uncompressed Key Handling**
- GIVEN I import an uncompressed WIF (starts with 9)
- WHEN import succeeds
- THEN:
  - System detects: compressed = false
  - Address type forced to: 'legacy' (P2PKH)
  - Warning: "Uncompressed key detected. Using legacy addresses."
  - Account created successfully

**AC3.4 - Compressed Key Handling**
- GIVEN I import a compressed WIF (starts with c)
- WHEN import succeeds
- THEN:
  - System detects: compressed = true
  - Address type defaults to: 'native-segwit' (P2WPKH)
  - User can optionally change to: 'segwit' or 'legacy'
  - Account created successfully

**AC3.5 - Empty Balance Warning**
- GIVEN I import a private key with 0 balance
- WHEN import succeeds
- THEN:
  - Success message shown
  - Warning: "This account has 0 balance. Verify the address is correct."
  - Display first address for user verification
  - Allow user to proceed

---

## 4. Technical Requirements

### 4.1 Backend Changes (Message Handlers)

**New Message Type:**

```typescript
MessageType.CREATE_WALLET_FROM_PRIVATE_KEY = 'CREATE_WALLET_FROM_PRIVATE_KEY'
```

**Message Payload:**

```typescript
interface CreateWalletFromPrivateKeyRequest {
  wif: string;              // Decrypted WIF (plaintext)
  walletPassword: string;   // New wallet password
  accountName?: string;     // Optional account name
}

interface CreateWalletFromPrivateKeyResponse {
  success: true;
  data: {
    firstAddress: string;
    addressType: AddressType;
    network: 'testnet' | 'mainnet';
  };
}
```

**Handler Implementation:**

```typescript
// In src/background/index.ts

case MessageType.CREATE_WALLET_FROM_PRIVATE_KEY: {
  const { wif, walletPassword, accountName } = msg.payload;

  // 1. Validate WIF
  if (!KeyManager.validateWIF(wif, 'testnet')) {
    return { success: false, error: 'Invalid WIF format', code: 'INVALID_WIF_FORMAT' };
  }

  // 2. Check if wallet already exists
  const existingWallet = await chrome.storage.local.get('wallet');
  if (existingWallet.wallet) {
    return { success: false, error: 'Wallet already exists', code: 'WALLET_EXISTS' };
  }

  // 3. Decode WIF to get key info
  const keyInfo = KeyManager.decodeWIF(wif, 'testnet');

  // 4. Determine address type from compression
  const addressType = keyInfo.compressed ? 'native-segwit' : 'legacy';

  // 5. Derive first address from private key
  const firstAddress = deriveAddressFromPrivateKey(keyInfo.privateKey, addressType, 0, false);

  // 6. Create wallet structure
  const walletSalt = generateRandomBytes(32);
  const walletIv = generateRandomBytes(16);

  // 7. Encrypt the private key for storage
  const keySalt = generateRandomBytes(32);
  const keyIv = generateRandomBytes(16);
  const encryptedKey = await encryptData(wif, walletPassword, keySalt, keyIv);

  // 8. Create non-HD wallet
  const wallet: StoredWalletV2 = {
    version: 2,
    encryptedSeed: '',  // NO HD SEED
    salt: bufferToHex(walletSalt),
    iv: bufferToHex(walletIv),
    accounts: [{
      accountType: 'single',
      index: 0,
      name: accountName || 'Imported Account',
      addressType,
      importType: 'private-key',
      externalIndex: 0,
      internalIndex: 0,
      addresses: [{
        address: firstAddress,
        derivationPath: 'imported',  // No derivation path
        index: 0,
        isChange: false,
        used: false
      }]
    }],
    importedKeys: {
      0: {
        encryptedData: encryptedKey,
        salt: bufferToHex(keySalt),
        iv: bufferToHex(keyIv),
        type: 'private-key'
      }
    },
    pendingMultisigTxs: [],
    settings: {
      autoLockMinutes: 15,
      network: 'testnet'
    }
  };

  // 9. Save wallet to storage
  await chrome.storage.local.set({ wallet });

  // 10. Return success
  return {
    success: true,
    data: {
      firstAddress,
      addressType,
      network: 'testnet'
    }
  };
}
```

### 4.2 Frontend Changes

**New Component:** `PrivateKeyImportTab` (within WalletSetup.tsx)

**State Management:**

```typescript
// Additional state for private key import
const [importMethod, setImportMethod] = useState<'file' | 'paste'>('paste');
const [wifFile, setWifFile] = useState<File | null>(null);
const [wifString, setWifString] = useState('');
const [filePassword, setFilePassword] = useState('');
const [accountName, setAccountName] = useState('Imported Account');
const [isEncrypted, setIsEncrypted] = useState(false);
const [wifValidation, setWifValidation] = useState<{
  valid: boolean;
  network?: string;
  firstAddress?: string;
  error?: string;
} | null>(null);
```

**File Upload Handler:**

```typescript
const handleFileUpload = async (file: File) => {
  const text = await file.text();

  // Detect encryption
  if (text.includes('Encrypted Private Key:')) {
    setIsEncrypted(true);
    // Extract encrypted data
    const encryptedDataMatch = text.match(/Encrypted Private Key:\s*([^\n]+)/);
    if (encryptedDataMatch) {
      setWifString(encryptedDataMatch[1]);
    }
  } else {
    setIsEncrypted(false);
    // Extract plaintext WIF
    const wifMatch = text.match(/Private Key \(WIF\):\s*([^\n]+)/);
    if (wifMatch) {
      setWifString(wifMatch[1]);
      // Validate immediately
      await validateWIF(wifMatch[1]);
    } else {
      // Assume entire file is just WIF
      setWifString(text.trim());
      await validateWIF(text.trim());
    }
  }
};
```

**WIF Validation:**

```typescript
const validateWIF = async (wif: string) => {
  try {
    const response = await sendMessage<ValidateWIFResponse>(
      MessageType.VALIDATE_WIF,
      { wif }
    );

    setWifValidation(response.data);
  } catch (err) {
    setWifValidation({
      valid: false,
      error: err instanceof Error ? err.message : 'Validation failed'
    });
  }
};
```

**Import Handler:**

```typescript
const handleImportFromPrivateKey = async () => {
  setError(null);
  setIsLoading(true);

  try {
    let decryptedWIF = wifString;

    // If encrypted, decrypt first
    if (isEncrypted) {
      if (!filePassword) {
        setError('File password is required');
        return;
      }

      // Decrypt using AES-256-GCM
      decryptedWIF = await decryptEncryptedWIF(wifString, filePassword);
    }

    // Validate wallet password
    if (!validatePassword(password)) {
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Create wallet from private key
    const response = await sendMessage<CreateWalletFromPrivateKeyResponse>(
      MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
      {
        wif: decryptedWIF,
        walletPassword: password,
        accountName
      }
    );

    // Success - navigate to unlock screen
    onSetupComplete();

  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to import wallet');
  } finally {
    setIsLoading(false);
  }
};
```

### 4.3 Wallet Manager Changes

**Non-HD Wallet Support:**

The `WalletManager` class needs to handle wallets without an HD seed:

```typescript
class WalletManager {
  // Existing fields
  private hdWallet: BIP32Interface | null = null;

  // NEW: Support for imported private keys
  private importedKeys: Map<number, string> = new Map(); // accountIndex -> privateKeyHex

  async unlockWallet(password: string): Promise<boolean> {
    const stored = await this.getStoredWallet();

    // If no HD seed (non-HD wallet), don't try to derive from seed
    if (stored.encryptedSeed === '') {
      // This is a non-HD wallet, only has imported keys
      this.hdWallet = null;

      // Decrypt imported keys
      if (stored.importedKeys) {
        for (const [accountIndex, importedKey] of Object.entries(stored.importedKeys)) {
          const decryptedWIF = await this.decryptData(
            importedKey.encryptedData,
            password,
            importedKey.salt,
            importedKey.iv
          );

          const keyInfo = KeyManager.decodeWIF(decryptedWIF);
          this.importedKeys.set(Number(accountIndex), keyInfo.privateKey);
        }
      }
    } else {
      // Normal HD wallet flow
      const decryptedSeed = await this.decryptData(...);
      this.hdWallet = BIP32.fromSeed(decryptedSeed);
      // ... existing code
    }

    return true;
  }

  async signTransaction(accountIndex: number, ...): Promise<Transaction> {
    const account = this.accounts[accountIndex];

    if (account.importType === 'private-key') {
      // Use imported private key
      const privateKeyHex = this.importedKeys.get(accountIndex);
      if (!privateKeyHex) {
        throw new Error('Private key not found for imported account');
      }

      // Sign using private key directly (not HD derivation)
      return signWithPrivateKey(privateKeyHex, ...);
    } else {
      // Use HD wallet derivation
      return this.signWithHDWallet(accountIndex, ...);
    }
  }

  async generateAddress(accountIndex: number, isChange: boolean): Promise<string> {
    const account = this.accounts[accountIndex];

    if (account.importType === 'private-key') {
      // Derive change address from private key
      const privateKeyHex = this.importedKeys.get(accountIndex);
      const index = isChange ? account.internalIndex : account.externalIndex;

      // Use private key + index to derive address
      // Note: Cannot create new accounts, but can create change addresses
      return deriveAddressFromPrivateKey(privateKeyHex, account.addressType, index, isChange);
    } else {
      // Normal HD derivation
      return this.deriveAddress(accountIndex, isChange);
    }
  }
}
```

---

## 5. Edge Cases and Requirements

### Edge Case Matrix

| Edge Case | Requirement | Priority |
|-----------|-------------|----------|
| **Import mainnet key on testnet wallet** | Detect network from WIF prefix. Block with error: "Network mismatch: This is a mainnet key, testnet required" | P0 |
| **Import testnet key on mainnet wallet** | Detect network mismatch. Block with error: "Network mismatch: This is a testnet key, mainnet required" | P0 |
| **Import uncompressed WIF** | Accept both compressed and uncompressed. Force legacy addresses for uncompressed. Show warning. | P1 |
| **Import key with 0 balance** | Allow import. Show warning: "This account has 0 balance. Verify address." | P1 |
| **Import corrupted encrypted file** | Detect decryption failure. Show error: "Unable to decrypt. Check password or file integrity." | P0 |
| **Import wrong file password** | Show clear error: "Incorrect file password." Allow retry. | P0 |
| **Import duplicate key (wallet exists)** | Block with error: "Wallet already exists. Use 'Import Account' from Settings to add accounts." | P0 |
| **Import raw WIF (no file structure)** | Accept plain WIF string. Auto-detect and validate. | P1 |
| **Very long account names** | Truncate to 50 characters. Sanitize special characters. | P1 |
| **Browser blocks file picker** | Show error with instructions. Offer "Paste WIF" fallback. | P1 |
| **Password field visibility** | Show/hide toggle for all password fields (wallet password, file password). | P1 |
| **Incomplete file upload** | Detect empty/invalid file. Show error: "File is empty or corrupted." | P1 |
| **User cancels file picker** | Gracefully handle cancel. No error shown. Form remains editable. | P2 |
| **Multiple rapid import attempts** | Prevent concurrent imports. Disable button during processing. | P2 |

---

## 6. MVP Scope Definition

### ✅ IN SCOPE (MVP v1.0)

**Import Features:**
- Import from plaintext WIF file
- Import from encrypted WIF file
- Import from pasted WIF string
- File password decryption (AES-256-GCM)
- Network validation (testnet only for now)
- Address type auto-detection
- Account naming
- Wallet password setup
- Non-HD wallet creation
- Support both compressed and uncompressed keys

**UI/UX:**
- Third tab in wallet setup: "Import Private Key"
- File upload OR paste WIF (radio button selector)
- Real-time WIF validation with preview
- Password strength meter for wallet password
- Show/hide toggles for passwords
- Success/error notifications
- Help text explaining WIF format

**Security:**
- Wallet unlock required (after creation)
- Clear security warnings
- No logging of private keys
- Secure memory handling
- Encrypted storage of imported key

### ❌ OUT OF SCOPE (Future/Deferred)

**Deferred to v1.1+:**
- Mainnet support (wait for mainnet toggle)
- Multi-key import (importing multiple private keys at once)
- QR code scanning for WIF import (requires camera permissions)
- BIP38 password-encrypted keys (different standard)
- Hybrid wallets (HD seed + imported keys in one wallet)
- Migration from non-HD to HD wallet

**Explicitly Out of Scope:**
- Exporting private keys during setup (already exists in Settings)
- Importing seed phrase AND private key simultaneously
- Auto-backup to cloud
- Hardware wallet import

### 🎯 Must-Have vs Nice-to-Have

**MUST HAVE (P0 - Blocking MVP):**
- ✅ Import from plaintext WIF file
- ✅ Import from encrypted WIF file
- ✅ Network validation (testnet)
- ✅ Non-HD wallet creation
- ✅ Wallet password setup
- ✅ Basic error handling
- ✅ Security warnings

**SHOULD HAVE (P1 - Strongly Recommended):**
- ✅ Paste WIF option (no file)
- ✅ Password strength meter
- ✅ Real-time WIF validation with preview
- ✅ Show/hide password toggles
- ✅ Account name customization
- ✅ Uncompressed key support

**NICE TO HAVE (P2 - Enhancement):**
- 📋 Drag-and-drop file upload
- 📋 Address balance preview before import
- 📋 QR code display of first address
- 📋 Copy first address to clipboard

---

## 7. Success Metrics

### Adoption Metrics

**Target Adoption Rate:**
- **80% of users** who exported a private key should be able to restore wallet from it
- **<5% failure rate** for valid WIF imports during setup

**Leading Indicators:**
- "Import Private Key" tab clicks during setup (vs other options)
- File password decrypt success rate (target: >95%)
- Wallet creation success rate from private key (target: >95%)

### Usage Patterns

**Healthy Usage:**
- Import-from-private-key rate: 5-10% of all wallet setups
  - Suggests users are restoring from backups, not overusing
- File upload vs paste WIF: 70/30 split
  - Most users have exported files, some copy/paste
- Encrypted vs plaintext: 60/40 split
  - Many users enable password protection

**Warning Signs:**
- Very high import rate (>30% of setups) = users leaving/losing wallets frequently
- Very low import rate (<1% of setups) = feature not discoverable
- High decryption failure rate (>10%) = users forgetting file passwords

### Quality Metrics

**Error Rates:**
- Import failure rate: <5% (user error acceptable)
- Decryption failures: <10% (wrong password)
- Network mismatch errors: <2% (clear messaging helps)

**Support Impact:**
- <5% of support tickets related to private key import
- No critical security incidents (key exposure)
- No data loss reports (successful recovery)

### User Behavior Indicators

**Feature Value Signals:**
- Users successfully restore after extension data loss (recovery works!)
- Users migrate from other wallets using WIF import (acquisition)
- Users report confidence in backup strategy (trust)

**Feature Problems Signals:**
- Repeated import attempts (errors not clear)
- Imports attempted but abandoned (UX issues)
- High rate of "wallet already exists" errors (confusion about when to use)

### Technical Metrics

**Performance:**
- Import operation: <2s (plaintext) / <5s (encrypted)
- File decryption: <3s (100k PBKDF2 iterations)
- WIF validation: <500ms

**Reliability:**
- 100% of valid WIF exports must be importable
- 100% of encrypted WIFs must decrypt with correct password
- 0% wallet corruption rate

---

## 8. Questions for Blockchain Expert

### Critical Technical Questions

**Q1: Non-HD Wallet Structure**
- Can we create a wallet with ONLY an imported private key (no HD seed)?
- What should the `encryptedSeed` field be? (Empty string '' or null/undefined?)
- Type safety: Does `StoredWalletV2` need changes to support this?

**Expected Answer:**
- YES, we can create non-HD wallet (many wallets support this)
- Use empty string '' for `encryptedSeed` (better for type safety)
- No type changes needed, but add validation to handle empty seed

**Q2: Address Generation for Non-HD Accounts**
- How do we generate change addresses without an HD seed?
- Can we derive addresses from a single private key + index?
- What's the cryptographic approach? (ECDSA + BIP32-like derivation?)

**Expected Answer:**
- For private key imports, we typically only use a SINGLE address
- Change addresses: Either use the same address OR derive from private key + deterministic nonce
- Recommendation: Use the same address for change (simpler, still secure)
- Alternative: Implement BIP32 derivation from a single key (more complex)

**Q3: Transaction Signing for Imported Keys**
- How do we sign transactions without HD derivation?
- Do we need separate signing logic for `importType: 'private-key'` accounts?
- What's the impact on `TransactionBuilder`?

**Expected Answer:**
- YES, need separate signing path
- Use `ECPair.fromPrivateKey()` instead of HD derivation
- TransactionBuilder needs conditional logic: if imported, use private key directly

**Q4: Future Migration Path**
- If user later imports a seed phrase, can this account coexist?
- Do we convert to HD wallet or keep as imported account?
- What's the upgrade path?

**Expected Answer:**
- User cannot import seed phrase into non-HD wallet
- If user wants HD wallet, they must create new wallet and transfer funds
- Alternative: Support hybrid wallets (HD + imported accounts), but more complex

**Q5: Security Considerations**
- Are there any security risks with non-HD wallets?
- Should we warn users about limitations?
- Is key reuse a concern? (same address for receive and change)

**Expected Answer:**
- Security: Non-HD wallets are secure, just less flexible
- Warning: Users should know they can't create new accounts without seed
- Key reuse: Yes, concern for privacy. Recommend using same address OR deriving change addresses
- Best practice: Encourage users to eventually migrate to HD wallet

---

## 9. Questions for Security Expert

### Critical Security Questions

**Q1: Non-HD Wallet Security**
- Is storing a single private key less secure than an HD seed?
- Should we apply additional encryption for imported keys?
- Any specific threat vectors for non-HD wallets?

**Expected Answer:**
- Security equivalence: Single private key is equally secure IF properly encrypted
- Encryption: Use same AES-256-GCM as wallet encryption (consistent approach)
- Threat vector: If private key is exposed, only ONE account is compromised (vs HD seed exposes ALL accounts)
- Recommendation: Store imported key with own salt/IV for defense-in-depth

**Q2: File Decryption Security**
- Should we rate-limit file password attempts?
- Any risk of timing attacks during decryption?
- Should we enforce minimum file password strength?

**Expected Answer:**
- Rate limiting: Not critical for local operation, but nice to have (prevent brute force)
- Timing attacks: Use constant-time comparison for PBKDF2 (library handles this)
- Password strength: We cannot enforce (user chose it during export), but can recommend

**Q3: Memory Handling**
- How do we ensure private keys are cleared from memory?
- Should we use secure memory wiping techniques?
- What's the lifetime of decrypted WIF in memory?

**Expected Answer:**
- Clear private keys immediately after wallet creation
- Use `crypto.subtle` for encryption (browser handles memory securely)
- Lifetime: Only during import flow, not persisted in plaintext
- Recommendation: Zero out buffers after use (JavaScript limitation, best effort)

**Q4: Warning Messages**
- What security warnings should we show during import?
- Should we warn about non-HD wallet limitations?
- Any specific user education needed?

**Expected Answer:**
- Warnings needed:
  1. "This wallet does not have a seed phrase. Back up your private key."
  2. "You cannot create additional accounts without a seed phrase."
  3. "Never share your private key with anyone."
- Education: Explain difference between HD and non-HD wallets
- Recommendation: Link to help article on wallet recovery options

---

## 10. Questions for UI/UX Designer

### Critical UX Questions

**Q1: Tab Layout**
- Should "Import Private Key" be a third tab or a sub-option under "Import"?
- How do we visually distinguish it from "Import Seed Phrase"?
- Any risk of user confusion?

**Expected Answer:**
- Recommendation: Third tab (clearest separation)
- Visual: Use different icon (key icon vs seed phrase icon)
- Confusion risk: Minimal if labels are clear ("Import Seed Phrase" vs "Import Private Key")

**Q2: Import Method Selector**
- Should "Upload File" vs "Paste WIF" be radio buttons or tabs?
- Default selection: Which method should be pre-selected?
- Any accessibility concerns?

**Expected Answer:**
- Recommendation: Radio buttons (simpler than nested tabs)
- Default: "Paste WIF" (faster for power users, no file picker permission)
- Accessibility: Ensure keyboard navigation works, labels clear

**Q3: Password Fields**
- How many password fields appear on screen?
  - File password (if encrypted)
  - Wallet password
  - Confirm wallet password
- Should we collapse some fields?
- Any risk of user confusion?

**Expected Answer:**
- Fields shown sequentially:
  1. File password (only if encrypted, shown first)
  2. After valid WIF, show: Wallet password + Confirm
- Collapsing: Use conditional rendering (don't show wallet password until WIF is valid)
- Confusion: Clearly label each field ("File Password" vs "Wallet Password")

**Q4: Error Messaging**
- Where should errors appear? (inline vs toast)
- How specific should error messages be?
- Should we provide recovery suggestions?

**Expected Answer:**
- Errors: Inline for field-specific (below input), banner for general
- Specificity: Very specific (help user debug)
- Recovery suggestions: YES (e.g., "Check file password" or "Verify WIF string")

**Q5: Success Flow**
- After successful import, where does user go?
- Should we show a success screen or go straight to unlock?
- Any onboarding needed for non-HD wallets?

**Expected Answer:**
- Flow: Success message → Unlock screen (same as seed import)
- Success screen: Brief message explaining next step
- Onboarding: Show one-time tip: "This wallet was imported from a private key. You cannot create additional accounts without a seed phrase."

---

## 11. Open Questions & Decisions Needed

### Product Decisions

**Decision 1: Should we support hybrid wallets? (HD seed + imported keys)**
- **Option A:** NO - Non-HD wallet OR HD wallet (mutually exclusive)
  - Pros: Simpler logic, clearer UX
  - Cons: Users cannot add imported keys to HD wallet created from seed
- **Option B:** YES - Allow both in one wallet
  - Pros: Flexibility, matches existing "import account" feature
  - Cons: Complex wallet structure, confusing UX
- **Recommendation:** OPTION A for MVP. If user wants both, they can import seed phrase, which creates HD wallet, then use existing "import account" feature to add private key accounts.

**Decision 2: Should we allow creating additional accounts in non-HD wallet?**
- **Option A:** NO - Only the single imported account
  - Pros: Accurate (can't derive without seed), simpler
  - Cons: User stuck with one account
- **Option B:** YES - Allow importing more private keys as accounts
  - Pros: Flexibility
  - Cons: Misleading (not truly HD), complex UI
- **Recommendation:** OPTION A for MVP. User can import additional keys using "Import Account" from Settings.

**Decision 3: Address reuse for change addresses in non-HD wallet?**
- **Option A:** Reuse the same address for change
  - Pros: Simple, works
  - Cons: Privacy concern (address reuse)
- **Option B:** Derive change addresses from private key + deterministic index
  - Pros: Better privacy
  - Cons: More complex, non-standard
- **Recommendation:** OPTION A for MVP. Add warning: "This wallet reuses addresses for change. Consider migrating to an HD wallet for better privacy."

**Decision 4: Should we encourage migration to HD wallet?**
- **Option A:** YES - Show banner suggesting seed phrase import
  - Pros: User education, encourages best practices
  - Cons: May annoy users who prefer simple setup
- **Option B:** NO - Let users decide
  - Pros: Less nagging
  - Cons: Users may not know about HD advantages
- **Recommendation:** OPTION A (subtle banner, dismissible)

---

## 12. Implementation Plan

### Phase 1: Backend Implementation (Sprint 1)

**Week 1-2:**
- [ ] Add `MessageType.CREATE_WALLET_FROM_PRIVATE_KEY`
- [ ] Implement handler in `src/background/index.ts`
- [ ] Support non-HD wallet structure (empty `encryptedSeed`)
- [ ] Add private key storage in `importedKeys`
- [ ] Update `WalletManager` to handle non-HD wallets
- [ ] Add signing logic for imported private keys
- [ ] Unit tests for non-HD wallet creation
- [ ] Integration tests for import flow

**Deliverables:**
- Non-HD wallet creation works
- Private key stored securely
- Transactions can be signed with imported key

### Phase 2: Frontend Implementation (Sprint 2)

**Week 3-4:**
- [ ] Add "Import Private Key" tab to `WalletSetup.tsx`
- [ ] Implement file upload handler
- [ ] Implement paste WIF handler
- [ ] Add file decryption (AES-256-GCM)
- [ ] Real-time WIF validation with preview
- [ ] Password strength meter
- [ ] Error handling and messaging
- [ ] Success flow and navigation

**Deliverables:**
- UI complete and functional
- File upload and paste work
- Encrypted and plaintext import work
- Validation provides helpful feedback

### Phase 3: Testing & Polish (Sprint 3)

**Week 5:**
- [ ] QA manual testing on testnet
- [ ] Test all edge cases (wrong network, wrong password, corrupted files)
- [ ] Security review by Security Expert
- [ ] Blockchain implementation review by Blockchain Expert
- [ ] Accessibility testing (keyboard navigation, screen readers)
- [ ] Error message refinement
- [ ] Performance testing (encryption/decryption speed)

**Deliverables:**
- All edge cases handled
- Security approved
- Performance meets targets
- No P0/P1 bugs

### Phase 4: Documentation & Release (Sprint 4)

**Week 6:**
- [ ] Update user documentation (README)
- [ ] Update developer notes (backend, frontend)
- [ ] Create help article: "Restoring Wallet from Private Key"
- [ ] Update CHANGELOG
- [ ] Create release notes for v0.11.0
- [ ] Final security audit
- [ ] Merge to main and tag release

**Deliverables:**
- Documentation complete
- Release notes published
- Feature ready for production

---

## 13. Testing Requirements

### Unit Tests

**Must Test:**
- Non-HD wallet creation
- WIF validation (valid/invalid formats)
- Network detection from WIF (testnet/mainnet)
- File decryption (correct/incorrect password)
- Private key storage encryption
- Account creation with imported key

### Integration Tests

**Must Test:**
- Full import flow (file upload → decrypt → validate → create wallet)
- Import from plaintext WIF → unlock → send transaction
- Import from encrypted WIF → unlock → generate address
- Error handling (wrong network, wrong password, corrupt file)

### Manual Testing (QA)

**Test Scenarios:**
1. Export private key from existing wallet → Clear extension data → Import during setup → Verify balance matches
2. Export encrypted private key → Import with correct password → Success
3. Export encrypted private key → Import with wrong password → Error
4. Paste raw WIF string → Import → Verify address matches
5. Try importing mainnet WIF on testnet wallet → Error
6. Import uncompressed WIF → Verify legacy address type
7. Import WIF with 0 balance → Warning shown but import succeeds
8. Import corrupted file → Clear error message

---

## 14. Success Criteria for MVP Release

### Definition of Done

**Feature is ready for release when:**

1. **Functionality:**
   - [ ] Can import plaintext WIF during wallet setup
   - [ ] Can import encrypted WIF during wallet setup
   - [ ] Can paste WIF directly (no file)
   - [ ] Non-HD wallet created correctly
   - [ ] Wallet can be unlocked and used normally
   - [ ] Transactions can be sent from imported account
   - [ ] Change addresses generated correctly

2. **Security:**
   - [ ] Security Expert approval obtained
   - [ ] No private keys logged
   - [ ] Encryption tested (export → import roundtrip)
   - [ ] Network validation prevents wrong network imports
   - [ ] Memory handling verified (keys cleared after use)

3. **Testing:**
   - [ ] Unit tests: >80% coverage for new code
   - [ ] Integration tests: All import flows pass
   - [ ] Manual QA: All test scenarios pass on testnet
   - [ ] No P0/P1 bugs open

4. **Documentation:**
   - [ ] User help content written and reviewed
   - [ ] Developer notes updated (backend and frontend)
   - [ ] CHANGELOG entry added
   - [ ] README updated with new setup option

5. **Performance:**
   - [ ] Import completes in <5s (encrypted)
   - [ ] Wallet creation completes in <2s
   - [ ] No memory leaks (private keys cleared)

6. **UX:**
   - [ ] All error messages are clear and actionable
   - [ ] Success flow is smooth (setup → unlock → dashboard)
   - [ ] Keyboard navigation works
   - [ ] Screen reader tested (basic accessibility)

**If ALL checkboxes are checked, feature is ready to ship.**

---

## 15. Risks and Mitigations

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Users confuse "Import Seed" with "Import Private Key"** | Medium | Medium | Clear labeling, different icons, help text |
| **Non-HD wallet limitations surprise users** | High | Medium | Show warning banner, link to help article |
| **File decryption failures frustrate users** | Medium | High | Clear error messages, suggest password reset (if available) |
| **Users lose private key backup** | Low | Critical | Encourage seed phrase creation, show migration path |
| **Network mismatch errors block legitimate imports** | Low | Low | Clear error messages with network info |
| **Uncompressed keys force legacy addresses** | Low | Low | Show warning, explain address type limitation |
| **Users import mainnet key on testnet** | Medium | Low | Strong validation, block with clear error |

---

## Appendix A: Comparison with Existing Feature

### Existing Feature: Import Account into Wallet

**Current Behavior (v0.10.0):**
- **When:** Wallet already exists (has seed phrase)
- **Where:** Settings → Import Account
- **What:** Import private key as an ADDITIONAL account
- **Result:** Account added to existing HD wallet, stored in `importedKeys`

**New Feature: Import Wallet from Private Key**

**New Behavior (v0.11.0):**
- **When:** No wallet exists (initial setup)
- **Where:** Wallet Setup → Import Private Key tab
- **What:** Import private key to CREATE wallet (no seed phrase)
- **Result:** Non-HD wallet created with single imported account

**Key Differences:**

| Aspect | Existing Feature | New Feature |
|--------|------------------|-------------|
| **Wallet State** | Wallet exists | No wallet exists |
| **Seed Phrase** | Required (HD wallet) | NOT required (non-HD) |
| **Account Type** | Additional account | Primary account (index 0) |
| **Wallet Structure** | `encryptedSeed` populated | `encryptedSeed` empty |
| **Use Case** | Add account to wallet | Restore wallet from backup |
| **Entry Point** | Settings | Wallet Setup |

---

## Appendix B: Example User Flow (Narrative)

### Narrative: Alice Restores from Private Key Backup

**Context:** Alice backed up her wallet by exporting her account's private key as an encrypted file. Her browser crashed, and she needs to restore access.

**Alice's Journey:**

1. **Reinstall Extension**
   - Alice reinstalls the Bitcoin Wallet extension
   - She clicks the extension icon
   - Wallet setup screen appears

2. **Choose Import Method**
   - Alice sees three tabs:
     - "Create New Wallet"
     - "Import Seed Phrase"
     - "Import Private Key" ← She clicks this
   - She doesn't have her seed phrase (it was only in the extension), but she has her private key backup

3. **Upload Private Key File**
   - Screen shows: "Import Wallet from Private Key"
   - Two options: ( ) Upload File  (•) Paste WIF
   - Alice selects "Upload File"
   - She clicks "Choose File"
   - She navigates to her backup USB drive
   - She selects: `bitcoin-account-savings-20251001-120000.txt`
   - Filename appears: "bitcoin-account-savings-20251001-120000.txt"

4. **File Detected as Encrypted**
   - System reads the file and detects:
     - Header: "Bitcoin Account Private Key (Encrypted)"
     - Encrypted data present
   - New field appears: "File Password"
   - Help text: "Enter the password used when exporting this key"

5. **Enter File Password**
   - Alice enters her file password: "MyS3cur3Backup!2025"
   - Show password toggle: She clicks the eye icon to verify
   - Password looks correct

6. **WIF Validation**
   - System decrypts the file
   - Success: "✓ Valid WIF detected"
   - Network: "Testnet"
   - First address: "tb1q3xy..." (Alice recognizes this address!)
   - Address type: "Native SegWit"

7. **Set Wallet Password**
   - Alice enters a new wallet password: "NewSecurePassword2025!"
   - Password strength meter shows: "Strong" (green)
   - She confirms the password: "NewSecurePassword2025!"
   - Passwords match ✓

8. **Account Name**
   - Default name: "Imported Account"
   - Alice changes it to: "Savings" (her original account name)

9. **Import Wallet**
   - Alice clicks "Import Wallet"
   - Loading state: "Importing wallet..."
   - Progress: 2 seconds

10. **Success**
    - Success message: "Wallet imported successfully. Unlock to continue."
    - Screen transitions to unlock screen

11. **Unlock and Verify**
    - Alice enters her new wallet password: "NewSecurePassword2025!"
    - Wallet unlocks
    - Dashboard loads
    - Account name: "Savings"
    - Balance: 0.15 tBTC (matches her expected balance!)
    - First address: tb1q3xy... (confirmed correct)
    - Transaction history loads from blockchain

12. **Alice is Happy**
    - Her funds are safe
    - The backup worked as expected
    - She can now use her wallet normally

**Outcome:** Alice successfully restored her wallet from a private key backup. The import process was smooth, and she verified her account by recognizing the address and balance.

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-22 | Product Manager | Initial PRD created |

---

## Stakeholder Sign-Off

**Required Approvals Before Implementation:**

- [ ] Product Manager: Requirements complete and accurate
- [ ] Blockchain Expert: Technical feasibility and wallet structure approved
- [ ] Security Expert: Security requirements adequate, non-HD wallet approved
- [ ] UI/UX Designer: User flows and design specs approved
- [ ] Frontend Developer: Frontend requirements clear and feasible
- [ ] Backend Developer: Backend requirements clear and feasible
- [ ] Testing Expert: Testing requirements comprehensive

**Approval Date:** _______________

---

**END OF DOCUMENT**
