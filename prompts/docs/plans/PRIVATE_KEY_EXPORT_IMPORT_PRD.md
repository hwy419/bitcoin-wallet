# Private Key Export and Import - Product Requirements Document

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Draft
**Feature Type**: Account Portability & Backup

---

## Executive Summary

This feature enables users to export individual account private keys in WIF (Wallet Import Format) for backup/transfer and import them into new or existing wallets. This is a **simplified alternative** to full wallet backup, focusing on per-account portability rather than entire wallet recovery.

**Key Distinctions:**
- **Scope**: Individual accounts, not entire wallet
- **Format**: WIF (standard, interoperable with other Bitcoin wallets)
- **Security**: Optional password protection (user's choice)
- **Use Cases**: Account migration, backup, sharing keys between wallets

---

## 1. User Stories with Acceptance Criteria

### Story 1: Export Account Private Key (File Download)

**As a** wallet user
**I want to** export an individual account's private key as a downloadable file
**So that** I can back it up securely or import it into another wallet

**Acceptance Criteria:**

**AC1.1 - Account Selection**
- GIVEN I am on the Settings screen
- WHEN I view the account list
- THEN I should see an "Export Private Key" button/action for each account
- AND multisig accounts should NOT show the export option (or show disabled with tooltip)

**AC1.2 - Export Dialog**
- GIVEN I click "Export Private Key" for a valid account
- WHEN the export dialog appears
- THEN I should see:
  - Account name and address type
  - First receiving address for verification
  - Warning message about private key security
  - Optional password protection checkbox (unchecked by default)
  - Password input fields (only visible if checkbox is checked)
  - "Export as File" button
  - "Cancel" button

**AC1.3 - File Export (No Password)**
- GIVEN I choose to export without password protection
- WHEN I click "Export as File"
- THEN a .txt file should download immediately
- AND the filename should be `bitcoin-account-{accountName}-{timestamp}.txt`
- AND the file should contain:
  ```
  Bitcoin Account Private Key
  ===========================
  Account: {accountName}
  Address Type: {addressType}
  First Address: {firstReceivingAddress}
  Network: Testnet

  Private Key (WIF):
  {wifPrivateKey}

  SECURITY WARNING:
  - This private key provides full access to this account's funds
  - Never share this key with anyone
  - Store this file in a secure location
  - Consider encrypting this file with strong password protection

  Generated: {ISO timestamp}
  ```

**AC1.4 - File Export (With Password)**
- GIVEN I enable password protection and enter a strong password
- WHEN I click "Export as File"
- THEN the file should contain:
  ```
  Bitcoin Account Private Key (Encrypted)
  =======================================
  Account: {accountName}
  Address Type: {addressType}
  First Address: {firstReceivingAddress}
  Network: Testnet

  Encrypted Private Key:
  {encryptedData}

  Encryption: AES-256-GCM
  Format: base64

  TO DECRYPT:
  Use this wallet's "Import Private Key" feature and provide the password
  you used during export.

  SECURITY WARNING:
  - If you lose the password, the private key cannot be recovered
  - This encryption provides additional protection during storage/transfer
  - Keep this file and password in separate secure locations

  Generated: {ISO timestamp}
  ```

**AC1.5 - Password Validation**
- GIVEN I enable password protection
- WHEN I enter passwords
- THEN I should see validation for:
  - Minimum 8 characters
  - Password and confirm password match
  - Password strength indicator (weak/medium/strong)
- AND the "Export as File" button should be disabled until validation passes

**AC1.6 - Success Feedback**
- GIVEN the file exports successfully
- WHEN the download completes
- THEN I should see a success toast/notification
- AND the export dialog should remain open (allowing PDF export)

**AC1.7 - Error Handling**
- GIVEN an error occurs during export
- WHEN the operation fails
- THEN I should see a specific error message:
  - "Unable to access account private key"
  - "Encryption failed. Please try again"
  - "Browser blocked download. Check permissions"

---

### Story 2: Export Account Private Key (PDF)

**As a** wallet user
**I want to** export an account's private key as a printable PDF
**So that** I can create a physical backup with QR code for easy import

**Acceptance Criteria:**

**AC2.1 - PDF Export Option**
- GIVEN I am in the export dialog
- WHEN I view export options
- THEN I should see an "Export as PDF" button
- AND it should be available for both password-protected and unprotected exports

**AC2.2 - PDF Content Layout**
- GIVEN I click "Export as PDF"
- WHEN the PDF generates
- THEN it should contain:
  - **Header**: "Bitcoin Account Private Key Backup"
  - **Account Information Section**:
    - Account Name
    - Address Type (Native SegWit/SegWit/Legacy)
    - First Receiving Address
    - Network (Testnet)
    - Generated Date/Time
  - **Private Key Section**:
    - Text: "Private Key (WIF Format)"
    - The WIF private key in monospace font
    - QR code of the WIF private key (200x200px minimum)
  - **Security Warning Box** (highlighted):
    - "⚠️ CRITICAL SECURITY INFORMATION"
    - Bullet points on key security
  - **Import Instructions Section**:
    - Step-by-step guide to import this key
    - Instructions for this wallet and other wallets
  - **Footer**: Generated timestamp, wallet version

**AC2.3 - PDF Format Requirements**
- PDF should be A4/Letter size
- Print-friendly (black text, high contrast)
- QR code should be scannable at 150 DPI print resolution
- Margins: 1 inch on all sides
- Professional layout with clear section headers

**AC2.4 - Password-Protected Export PDF**
- GIVEN the private key is password-protected
- WHEN I export as PDF
- THEN the PDF should show:
  - Encrypted private key (base64)
  - Encryption method (AES-256-GCM)
  - Decryption instructions
  - NO QR code (encrypted data too long)
  - Warning about password requirement

**AC2.5 - PDF Generation and Download**
- GIVEN I click "Export as PDF"
- WHEN generation completes
- THEN the PDF should download with filename: `bitcoin-account-{accountName}-backup-{timestamp}.pdf`
- AND I should see a success notification
- AND the export dialog should remain open

**AC2.6 - QR Code Specifications**
- Size: 200x200px minimum (scalable)
- Error correction: Medium (M) level
- Format: Black on white background
- Border: 4 modules quiet zone
- Should encode full WIF string

---

### Story 3: Import Private Key (Initial Wallet Setup)

**As a** new user setting up a wallet
**I want to** import a private key from a file during initial setup
**So that** I can access an existing account without creating a new wallet

**Acceptance Criteria:**

**AC3.1 - Import Option Visibility**
- GIVEN I am on the initial wallet setup screen
- WHEN I view import options
- THEN I should see three tabs/options:
  1. "Create New Wallet"
  2. "Import Seed Phrase"
  3. "Import Private Key" (NEW)

**AC3.2 - Import Private Key Screen**
- GIVEN I select "Import Private Key"
- WHEN the import screen loads
- THEN I should see:
  - Upload file button ("Choose File" or drag-and-drop)
  - OR manual WIF entry textarea
  - Account name input field (with default: "Imported Account 1")
  - Password input (for wallet encryption, NOT file decryption)
  - Confirm password input
  - "Import Account" button (disabled until valid)
  - Help text explaining WIF format

**AC3.3 - File Upload and Detection**
- GIVEN I click "Choose File"
- WHEN I select a .txt file
- THEN the file should be read automatically
- AND the system should detect:
  - If it's encrypted (has "Encrypted Private Key:" header)
  - If it's plain WIF (has "Private Key (WIF):" header)
  - If it's raw WIF text (starts with valid WIF characters)

**AC3.4 - Encrypted File Handling**
- GIVEN the file is password-protected
- WHEN the system detects encryption
- THEN I should see an additional input field:
  - "File Password" (required)
  - Help text: "Enter the password used when exporting this key"
- AND the import button should remain disabled until file password is entered

**AC3.5 - WIF Validation**
- GIVEN I provide a private key (file or manual)
- WHEN the system validates it
- THEN it should:
  - Verify WIF format (Base58Check)
  - Verify network match (testnet for this wallet)
  - Verify checksum
  - Extract and validate the private key
- AND show real-time validation feedback

**AC3.6 - Account Information Preview**
- GIVEN a valid WIF is provided
- WHEN validation succeeds
- THEN I should see a preview:
  - "First address: {derivedAddress}"
  - Address type auto-detected from WIF
  - "Network: Testnet" (confirmed)

**AC3.7 - Import Success**
- GIVEN all validation passes
- WHEN I click "Import Account"
- THEN:
  - A new wallet should be created
  - The imported account should be added as Account 0
  - I should see the unlock screen (wallet is now locked)
  - Success message: "Account imported successfully. Unlock wallet to continue."

**AC3.8 - Error Handling**
- GIVEN an error occurs
- WHEN import fails
- THEN I should see specific error messages:
  - "Invalid private key format"
  - "Wrong network (this is a mainnet key, testnet required)"
  - "Incorrect file password"
  - "File is corrupted or invalid format"
  - "This private key is already imported"

---

### Story 4: Import Private Key (Add to Existing Wallet)

**As a** wallet user with existing accounts
**I want to** import an additional private key into my wallet
**So that** I can manage multiple accounts from different sources

**Acceptance Criteria:**

**AC4.1 - Import Access Point**
- GIVEN I have an unlocked wallet with existing accounts
- WHEN I navigate to account management (Settings or sidebar)
- THEN I should see an "Import Account" button/option
- AND it should be separate from "Create Account"

**AC4.2 - Import Account Dialog**
- GIVEN I click "Import Account"
- WHEN the dialog opens
- THEN I should see:
  - Tab/option selector: "Generate New" | "Import Private Key"
  - (Rest of UI same as AC3.2 for Import Private Key)

**AC4.3 - Duplicate Detection**
- GIVEN I attempt to import a private key
- WHEN the wallet already has this private key
- THEN I should see an error:
  - "This account is already imported as '{existingAccountName}'"
  - Option to cancel or rename existing account
- AND the import should be blocked

**AC4.4 - Account Numbering**
- GIVEN I successfully import a private key
- WHEN the account is added
- THEN it should:
  - Get the next available account index
  - Be marked as "imported" in metadata
  - NOT affect existing HD account derivation
  - Default name: "Imported Account {N}"

**AC4.5 - Account Type Handling**
- GIVEN I import a private key
- WHEN the account is created
- THEN:
  - Address type should be detected from WIF (compressed/uncompressed)
  - If compressed, default to native-segwit
  - If uncompressed, use legacy addresses only
  - User should be shown the detected type (not editable)

**AC4.6 - Success and Navigation**
- GIVEN import succeeds
- WHEN the account is added
- THEN:
  - Dialog closes
  - Account list updates immediately
  - Success notification shows
  - User is navigated to the new account's dashboard (optional)

---

## 2. Edge Cases and Requirements

### Edge Case Matrix

| Edge Case | Requirement | Priority |
|-----------|-------------|----------|
| **Export multisig account** | Show disabled button with tooltip: "Multisig accounts cannot be exported as a single private key. Export all co-signer xpubs instead." | P0 |
| **Export imported vs HD account** | No difference - both export the same way. File metadata could indicate "imported" vs "HD-derived" for reference | P1 |
| **Password strength requirements** | Minimum 8 chars, recommend 12+. Show strength meter (weak/medium/strong). No maximum length. | P0 |
| **Very long account names** | Truncate in filename to 50 chars. Full name in file content. Use sanitization: remove special chars, spaces to dashes | P0 |
| **File naming collisions** | Add timestamp with milliseconds: `bitcoin-account-name-20251019-143055-123.txt` | P1 |
| **Import wrong network key** | Detect network from WIF prefix. Show error: "Network mismatch: This is a {detected} key, but wallet requires testnet keys" | P0 |
| **Import duplicate key** | Check all existing accounts. Show which account already has this key. Prevent duplicate import. | P0 |
| **Import corrupted encrypted file** | Detect decryption failure. Show: "Unable to decrypt. Check password or file integrity" | P0 |
| **Import raw WIF (no file structure)** | Support pasting just the WIF string. Auto-detect and extract. | P1 |
| **QR code too large for display** | WIF is ~51 chars, QR should handle easily. Use medium error correction. Max size: 300x300px. | P1 |
| **PDF generation fails** | Fallback: offer to copy text to clipboard. Error message: "PDF generation failed. Copy content manually?" | P2 |
| **Browser blocks download** | Show error with instructions to check browser permissions/popup blockers. Offer "Copy to Clipboard" fallback. | P1 |
| **Import uncompressed key** | Accept both compressed and uncompressed WIF. Force legacy addresses for uncompressed. Warn user about address type. | P1 |
| **Password field visibility** | Show/hide password toggle for all password fields. Prevents typos. | P1 |
| **Mobile/tablet PDF printing** | PDF should be optimized for sharing to print services. Consider "Share" API on mobile. | P2 |
| **Concurrent exports** | Allow multiple exports from different accounts. No locks needed (read-only operation). | P2 |
| **Export during transaction** | Allow exports anytime wallet is unlocked. Doesn't interfere with transactions. | P2 |
| **Re-import after deletion** | Allowed. Treat as new account with new index. Lost transaction history remains lost. | P1 |
| **Import key with no funds** | Allowed. Show warning: "This account has 0 balance. Verify address is correct." | P1 |

### Password Protection Details

**When Password Protection is ENABLED:**
- Encryption: AES-256-GCM
- Key Derivation: PBKDF2 (100,000 iterations, same as wallet encryption)
- Salt: Random 32 bytes, stored in file
- Output format: `{salt}:{iv}:{authTag}:{ciphertext}` (all base64)
- File extension: Still `.txt` (human-readable metadata + encrypted blob)

**When Password Protection is DISABLED:**
- Plain text WIF
- Clear security warnings in file and UI
- No encryption overhead
- Instant export (no derivation time)

**Password Strength Requirements:**
- Minimum: 8 characters (enforced)
- Recommended: 12+ characters
- Strength meter:
  - Weak: 8-11 chars, no complexity
  - Medium: 12+ chars OR 8+ with mixed case/numbers
  - Strong: 12+ chars with mixed case + numbers + symbols
- No maximum length (but practical limit ~256 chars)

---

## 3. MVP Scope Definition

### ✅ IN SCOPE (MVP v1.0)

**Export Features:**
- Export individual account private keys (file + PDF)
- WIF format (standard, interoperable)
- Optional password protection (AES-256-GCM)
- Security warnings in UI and exported files
- Account metadata (name, address type, first address)
- QR codes in PDF (for plain WIF only)
- Testnet network only

**Import Features:**
- Import from file (.txt format)
- Import raw WIF (paste/type)
- Detect encrypted vs plain files
- Password-protected file decryption
- Add to new wallet (initial setup)
- Add to existing wallet (account management)
- Network validation (testnet only)
- Duplicate detection

**Security Features:**
- Password strength validation
- Wallet unlock required for export
- Clear security warnings
- No logging of private keys
- Secure memory handling (clear after use)

**UI/UX:**
- Export dialog in Settings screen
- Import option in wallet setup
- Import option in account management
- Success/error notifications
- Real-time validation feedback
- Help text and tooltips

### ❌ OUT OF SCOPE (Future/Deferred)

**Deferred to v1.1+:**
- Mainnet support (requires mainnet toggle first)
- Batch export (multiple accounts at once)
- Cloud backup integration
- QR scanning for import (requires camera permissions)
- Advanced encryption options (different algorithms)
- Export transaction history with key
- Export watch-only addresses (xpubs)
- Import from QR camera scan
- Import from hardware wallets
- BIP38 password-encrypted private keys (different standard)

**Explicitly Out of Scope:**
- Exporting multisig account private keys (N/A - multisig uses xpubs)
- Exporting seed phrases (separate feature, already exists)
- Auto-backup to cloud (privacy concern)
- Social recovery mechanisms
- Splitting keys (Shamir's Secret Sharing)

### 🎯 Must-Have vs Nice-to-Have

**MUST HAVE (P0 - Blocking MVP):**
- ✅ Export single account WIF to file
- ✅ Import single WIF from file
- ✅ Optional password protection
- ✅ Network validation (testnet)
- ✅ Duplicate detection
- ✅ Security warnings
- ✅ Basic error handling

**SHOULD HAVE (P1 - Strongly Recommended):**
- ✅ PDF export with QR code
- ✅ Import raw WIF (no file)
- ✅ Password strength meter
- ✅ Account metadata in export
- ✅ File naming with timestamp
- ✅ Show/hide password toggles

**NICE TO HAVE (P2 - Enhancement):**
- 📋 Copy to clipboard fallback
- 📋 Drag-and-drop file upload
- 📋 Import preview (show address before confirm)
- 📋 Mobile-optimized PDF sharing
- 📋 Export history log (audit trail)

---

## 4. Success Metrics

### Adoption Metrics

**Target Adoption Rate:**
- **30% of users** export at least one private key within 30 days of feature release
- **15% of users** import a private key (setup or add account)

**Leading Indicators:**
- Export dialog views (vs accounts managed)
- Import option clicks (vs wallet setups)
- Password protection usage rate (target: 60%+ enable it)

### Usage Patterns

**Healthy Usage:**
- Export-to-import ratio: 2:1 (more exports than imports)
  - Suggests users backing up keys, not just migrating
- PDF vs file export: 40/60 split (both used)
- Password protection adoption: >50%

**Warning Signs:**
- Very low export rate (<10% users) = feature not discoverable
- Very high import rate (>50% exports) = users leaving wallet
- Low password protection (<30%) = users not understanding security

### Quality Metrics

**Error Rates:**
- Export failure rate: <1%
- Import failure rate: <5% (higher ok, user error likely)
- Decryption failures: <2% (wrong password)

**Support Impact:**
- <5% of support tickets related to export/import
- No critical security incidents (key exposure)
- No data loss reports (successful import after export)

### User Behavior Indicators

**Feature Value Signals:**
- Users export multiple accounts (engaged users)
- Users export before major updates (trust in feature)
- Users import from other wallets (acquisition)
- PDF exports printed (physical backup adoption)

**Feature Problems Signals:**
- Repeated export attempts (errors not clear)
- Imports attempted but abandoned (UX issues)
- Same key imported multiple times (confusion)
- High rate of "skip password" (don't understand risk)

### Technical Metrics

**Performance:**
- Export operation: <500ms (no password) / <2s (with password)
- Import operation: <1s (plain) / <3s (encrypted)
- PDF generation: <5s

**Reliability:**
- 100% of exported keys must be importable
- 100% of password-protected exports must decrypt correctly
- 0% data corruption rate

---

## 5. User Flow Requirements

### 5.1 Export Flow (Detailed)

```
[Settings Screen - Account List]
        |
        | Click "Export Private Key" button for Account X
        v
[Export Dialog - Account X]
┌─────────────────────────────────────┐
│ Export Private Key: Account Name    │
│─────────────────────────────────────│
│ Account Details:                    │
│  • Address Type: Native SegWit      │
│  • First Address: tb1q...           │
│                                     │
│ ⚠️ WARNING:                         │
│ This private key provides full      │
│ access to account funds             │
│                                     │
│ ☐ Password Protection (Optional)   │
│   [____Password____] [👁️]          │
│   [__Confirm Pass__] [👁️]          │
│   Strength: ▓▓▓▒▒ Medium           │
│                                     │
│ [Export as File] [Export as PDF]   │
│ [Cancel]                            │
└─────────────────────────────────────┘
        |
        | Choose export format
        v
[File Download Initiated]
        |
        v
[Success Notification]
"Private key exported successfully. Keep this file secure!"
        |
        v
[Dialog Remains Open] (allow PDF export too)
```

**Flow Decision Points:**
1. **Multisig Account?** → Show disabled button with tooltip (exit flow)
2. **Password Protection?** → Show/hide password fields
3. **Password Valid?** → Enable/disable export buttons
4. **Export Success?** → Show success, keep dialog open
5. **Export Failed?** → Show error, allow retry

### 5.2 Import Flow - Initial Setup (Detailed)

```
[Wallet Setup Screen]
┌─────────────────────────────────────┐
│ [ Create ]  [ Import Seed ]         │
│ [ Import Private Key ] ← NEW        │
└─────────────────────────────────────┘
        |
        | Click "Import Private Key"
        v
[Import Private Key Screen]
┌─────────────────────────────────────┐
│ Import Private Key                  │
│─────────────────────────────────────│
│ Choose Method:                      │
│  ( ) Upload File  (•) Enter WIF     │
│                                     │
│ If Upload:                          │
│  [Choose File] or drag file here    │
│  Selected: bitcoin-account-...txt   │
│                                     │
│ If Enter WIF:                       │
│  ┌─────────────────────────────┐  │
│  │ Paste WIF private key here  │  │
│  │ (starts with 9, c, K, L...) │  │
│  └─────────────────────────────┘  │
│                                     │
│ ✓ Valid WIF detected                │
│   Network: Testnet                  │
│   First Address: tb1q...            │
│                                     │
│ File Password (if encrypted):       │
│  [___________________] [👁️]        │
│                                     │
│ Account Name:                       │
│  [Imported Account 1________]       │
│                                     │
│ Wallet Password:                    │
│  [___________________] [👁️]        │
│  [Confirm Password___] [👁️]        │
│                                     │
│ [Import Account] [Cancel]           │
└─────────────────────────────────────┘
        |
        | Validation & Processing
        v
[Wallet Created with Imported Account]
        |
        v
[Unlock Screen]
"Account imported successfully. Unlock wallet to continue."
```

**Flow Decision Points:**
1. **File or Manual Entry?** → Show appropriate input
2. **File Encrypted?** → Show/hide file password field
3. **WIF Valid?** → Show preview or error
4. **Network Match?** → Allow continue or block
5. **Duplicate Key?** → Block with error message

### 5.3 Import Flow - Add to Existing Wallet (Detailed)

```
[Settings Screen or Sidebar]
        |
        | Click "Import Account"
        v
[Import Account Dialog]
┌─────────────────────────────────────┐
│ Import Account                      │
│─────────────────────────────────────│
│ [ Generate New HD Account ]         │
│ [ Import Private Key ]              │
└─────────────────────────────────────┘
        |
        | Click "Import Private Key"
        v
[Import Private Key Form]
(Same UI as 5.2, but without wallet password)
┌─────────────────────────────────────┐
│ Import Private Key                  │
│─────────────────────────────────────│
│ [Upload File] or [Enter WIF]        │
│                                     │
│ File Password (if encrypted):       │
│  [___________________]              │
│                                     │
│ ✓ Valid WIF detected                │
│   First Address: tb1q...            │
│                                     │
│ Account Name:                       │
│  [Imported Account 2________]       │
│                                     │
│ [Import Account] [Cancel]           │
└─────────────────────────────────────┘
        |
        | Validation & Processing
        v
[Account List Updated]
        |
        v
[Success Notification]
"Account 'Imported Account 2' added successfully"
        |
        v
[Navigate to New Account Dashboard] (optional)
```

**Flow Decision Points:**
1. **Generate or Import?** → Show appropriate form
2. **File Encrypted?** → Request file password
3. **Duplicate Key?** → Block with error
4. **Import Success?** → Update UI, show success

---

## 6. Technical Requirements Summary

### Data Format Specifications

**Plain WIF File Structure:**
```
Bitcoin Account Private Key
===========================
Account: {name}
Address Type: {type}
First Address: {address}
Network: Testnet

Private Key (WIF):
{wif_string}

SECURITY WARNING: [warnings text]

Generated: {iso_timestamp}
```

**Encrypted WIF File Structure:**
```
Bitcoin Account Private Key (Encrypted)
=======================================
Account: {name}
Address Type: {type}
First Address: {address}
Network: Testnet

Encrypted Private Key:
{encryption_format}:{encrypted_data}

Encryption: AES-256-GCM
Format: base64

TO DECRYPT: [instructions]

SECURITY WARNING: [warnings text]

Generated: {iso_timestamp}
```

**Encryption Format:**
```
{salt_base64}:{iv_base64}:{authTag_base64}:{ciphertext_base64}
```

### API/Message Types Needed

**New Message Types:**
```typescript
// Export private key
MessageType.EXPORT_PRIVATE_KEY
Payload: { accountIndex: number, password?: string }
Response: { wif: string, encrypted: boolean, metadata: AccountMetadata }

// Import private key
MessageType.IMPORT_PRIVATE_KEY
Payload: { wif: string, name: string, filePassword?: string }
Response: { account: Account, firstAddress: string }

// Validate WIF
MessageType.VALIDATE_WIF
Payload: { wif: string, filePassword?: string }
Response: { valid: boolean, network: string, firstAddress?: string, error?: string }
```

### Security Requirements

**Must Implement:**
- Clear private keys from memory after export/import
- Never log WIF strings or private keys
- Validate network before import
- Require wallet unlock for export
- Show clear security warnings (not dismissible during flow)
- Use secure random for encryption salts
- Implement PBKDF2 with 100k iterations

**Must NOT Implement:**
- Auto-upload to cloud
- Sending private keys over network
- Storing exported keys in extension storage
- Pre-filling password fields from history

---

## 7. Design Requirements

### UI Components Needed

**New Components:**
1. **ExportPrivateKeyDialog** (Settings)
2. **ImportPrivateKeyForm** (Setup & Account Management)
3. **PasswordStrengthMeter** (shared utility)
4. **FileUploadArea** (drag-drop or button)
5. **PrivateKeyPDFTemplate** (PDF generation)

**Component Specifications:**

**ExportPrivateKeyDialog:**
- Modal overlay (darkened background)
- 600px width, auto height
- Sections: Account info, warning, password (optional), actions
- Two-column button layout: [File] [PDF] on left, [Cancel] on right
- Checkbox for password toggle (unchecked default)

**ImportPrivateKeyForm:**
- Full-width form (within modal or page)
- Tab/toggle: Upload vs Manual entry
- Real-time validation feedback (green check / red X)
- Collapsible help section: "What is WIF format?"
- Preview area: Shows first address when valid WIF detected

**PasswordStrengthMeter:**
- Linear strength bar (5 segments)
- Color coding: Red → Yellow → Green
- Text label: Weak / Medium / Strong
- Real-time update on input
- Below password field, subtle styling

**FileUploadArea:**
- Drag-and-drop zone: Dashed border, icon
- Or button: "Choose File"
- Show selected filename below
- Accept: `.txt` files only
- Max size: 1MB (way more than needed)

### Visual Design

**Color Palette (Extend existing):**
- Warning yellow: `#FFA500` (security warnings)
- Success green: `#10B981` (validation success)
- Error red: `#EF4444` (validation errors)
- Info blue: `#3B82F6` (help text)

**Typography:**
- WIF keys: `font-mono` (Courier or monospace)
- Warnings: `font-semibold` (slightly bolder)
- File content: Monospace, 10-12pt
- PDF content: Sans-serif for body, mono for keys

**Icons Needed:**
- 🔑 Key icon (export/import buttons)
- ⚠️ Warning icon (security messages)
- 📄 File icon (upload area)
- 🖨️ Print icon (PDF export)
- 👁️ Eye icon (show/hide password)
- ✓ Check icon (validation success)
- ✗ Cross icon (validation error)

### Accessibility

**Requirements:**
- ARIA labels on all form fields
- Keyboard navigation support (tab order)
- Screen reader announcements for validation
- High contrast mode support
- Focus indicators on all interactive elements
- Error messages associated with inputs (aria-describedby)

---

## 8. Testing Requirements

### Unit Tests

**Must Test:**
- WIF validation (valid/invalid formats)
- Network detection from WIF
- Encryption/decryption (password-protected)
- File parsing (plain and encrypted)
- Password strength calculation
- Duplicate key detection

### Integration Tests

**Must Test:**
- Export → Import roundtrip (plain)
- Export → Import roundtrip (encrypted)
- Import during wallet setup
- Import to existing wallet
- Export multiple accounts sequentially

### Manual Testing (QA)

**Test Scenarios:**
1. Export account, import in new wallet, verify same address
2. Export with password, import with wrong password, verify error
3. Export with password, import with correct password, verify success
4. Try importing mainnet key (should fail with network error)
5. Try importing duplicate key (should fail with duplicate error)
6. Export as PDF, print, scan QR code, import (end-to-end)
7. Export multisig account (should be disabled/blocked)

**Edge Case Testing:**
- Very long account names (truncation)
- Special characters in account names (sanitization)
- Concurrent exports from multiple accounts
- Import interrupted (close browser mid-import)
- File corrupted manually (edited)

---

## 9. Documentation Requirements

### User Documentation

**In-App Help:**
- Tooltip on "Export Private Key" button
- Help modal: "What is a private key?"
- Help modal: "What is WIF format?"
- Security best practices guide

**Help Content Needed:**

**"What is a Private Key?" Modal:**
```
A private key is a secret number that controls access to your Bitcoin.

- It's like a master password for one account
- Anyone with the private key can spend your funds
- Never share your private key with anyone
- Store backups in a secure, offline location

WIF Format:
- WIF stands for "Wallet Import Format"
- It's a standard way to encode private keys
- Compatible with most Bitcoin wallets
- Looks like: cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
```

**"Password Protection" Help:**
```
Optional password protection adds encryption to your exported key.

Without Password:
- Faster export (no encryption step)
- Anyone who finds the file can use the key
- Suitable only for very secure storage (encrypted drives)

With Password:
- File is encrypted with AES-256
- Requires password to decrypt and import
- Protects key during transfer or storage
- Must remember password (cannot be recovered)

Recommendation: Use password protection unless storing on already-encrypted media.
```

### Developer Documentation

**Backend Implementation:**
- Add message handlers for EXPORT/IMPORT/VALIDATE
- Implement encryption/decryption functions
- Update KeyManager with WIF methods (already exists)
- Add account metadata to storage format

**Frontend Implementation:**
- Create export dialog component
- Create import form component
- Add PDF generation library (jsPDF or similar)
- Implement QR code generation (qrcode.react)
- Add file reading utilities

---

## 10. Release Plan

### Phase 1: MVP Implementation (Sprint 1-2)

**Week 1:**
- Backend: Message handlers for export/import/validate
- Backend: Encryption/decryption functions
- Frontend: ExportPrivateKeyDialog component (file only)
- Frontend: ImportPrivateKeyForm component (setup only)

**Week 2:**
- Frontend: PDF export functionality
- Frontend: Import to existing wallet
- Testing: Unit tests for crypto functions
- Testing: Integration tests for export/import

### Phase 2: Polish & Testing (Sprint 3)

**Week 3:**
- UX: Password strength meter
- UX: Drag-and-drop file upload
- UX: Enhanced error messages
- Security: Code review by security expert
- Testing: QA manual testing on testnet

### Phase 3: Documentation & Release (Sprint 4)

**Week 4:**
- Documentation: In-app help modals
- Documentation: User guide updates
- Documentation: Developer notes update
- Release: Merge to main, publish version

### Rollout Strategy

**Beta Testing:**
- Internal testing: 1 week (team members)
- Limited beta: 2 weeks (10-20 users)
- Collect feedback on UX and security concerns

**Production Release:**
- Soft launch: Announce in release notes, no promotion
- Monitor error rates and support tickets
- Hard launch: Promote feature after 1 week of stability

**Rollback Plan:**
- Feature flag to disable export/import UI
- Keep backend handlers (don't break existing exports)
- Document recovery process if issues found

---

## 11. Open Questions & Decisions Needed

### Questions for Product Team

1. **Should we support BIP38 password-encrypted private keys?**
   - BIP38 is a standard for password-encrypted WIF
   - Different from our AES encryption (file-level vs key-level)
   - More compatible with other wallets, but more complex
   - Decision: OUT OF SCOPE for MVP, consider for v1.1

2. **Should we log export/import actions for audit trail?**
   - Privacy concern: Logging that a key was exported
   - Security benefit: Detect unauthorized exports
   - Decision: Log ACTION (export/import occurred) but NOT key data

3. **Should we allow exporting uncompressed keys?**
   - HD wallets typically use compressed keys
   - Uncompressed keys are larger and less common
   - Decision: Support both for import, only export compressed

4. **Should PDF include seed phrase too (if HD account)?**
   - Adds redundancy (seed can recover all HD accounts)
   - But private key alone is enough for single account
   - Decision: NO, keep export focused on single account

### Questions for Security Team

1. **Is PBKDF2 with 100k iterations sufficient for file encryption?**
   - Same as wallet encryption for consistency
   - Industry standard is 100k-600k iterations
   - Decision: APPROVED, use 100k for consistency

2. **Should we require password protection by default?**
   - Safer: Force users to set password
   - More friction: Users may abandon export
   - Decision: OPTIONAL, but show strong warning if disabled

3. **Should we allow export while wallet has pending transactions?**
   - No security risk (read-only operation)
   - Could confuse users (think export includes pending)
   - Decision: ALLOWED, no restriction needed

### Questions for UX Team

1. **Where should "Export Private Key" button be located?**
   - Option A: Settings screen, account list (per-account button)
   - Option B: Individual account dashboard (account-specific)
   - Decision: OPTION A (Settings), more discoverable

2. **Should import be a separate wizard or inline form?**
   - Wizard: Multi-step, more guided
   - Inline: Single form, faster
   - Decision: INLINE for existing wallet, WIZARD for setup

3. **Should we show QR code in export dialog (before download)?**
   - Benefit: Quick scanning without file
   - Risk: Screen capture could expose key
   - Decision: NO in dialog, only in PDF (user controls print)

---

## 12. Compliance & Security Audit

### Security Checklist

**Before Release:**
- [ ] Security expert reviews all crypto code
- [ ] Blockchain expert reviews WIF handling
- [ ] No private keys logged or persisted unencrypted
- [ ] Encryption uses audited libraries (Web Crypto API)
- [ ] All user inputs sanitized (XSS prevention)
- [ ] File uploads validated (type, size, content)
- [ ] Password requirements enforced
- [ ] Security warnings clearly displayed
- [ ] Export requires wallet unlock
- [ ] Import validates network and format

### Privacy Considerations

**Data Collection:**
- DO NOT collect exported file contents
- DO collect (anonymized): Export count, import count, password usage rate
- DO collect: Error types (for debugging)
- DO NOT collect: Private keys, WIF strings, passwords

**Third-Party Libraries:**
- jsPDF: License MIT, no data collection
- qrcode.react: License MIT, no data collection
- Verify all dependencies before use

---

## 13. Success Criteria for MVP Release

### Definition of Done

**Feature is ready for release when:**

1. **Functionality:**
   - [ ] Can export any HD account as plain WIF file
   - [ ] Can export any HD account with password protection
   - [ ] Can export any HD account as PDF with QR code
   - [ ] Can import WIF during wallet setup
   - [ ] Can import WIF to existing wallet
   - [ ] Multisig accounts show disabled export

2. **Security:**
   - [ ] Security expert approval obtained
   - [ ] No private keys logged
   - [ ] Encryption tested (export/import roundtrip)
   - [ ] Network validation prevents wrong network imports
   - [ ] Duplicate detection prevents key collisions

3. **Testing:**
   - [ ] Unit tests: >80% coverage for crypto functions
   - [ ] Integration tests: All export/import flows pass
   - [ ] Manual QA: All test scenarios pass on testnet
   - [ ] No P0/P1 bugs open

4. **Documentation:**
   - [ ] User help content written and reviewed
   - [ ] Developer notes updated
   - [ ] CHANGELOG entry added
   - [ ] README updated with feature description

5. **Performance:**
   - [ ] Export completes in <2s (encrypted)
   - [ ] Import completes in <3s (encrypted)
   - [ ] PDF generation completes in <5s
   - [ ] No memory leaks (private keys cleared)

6. **UX:**
   - [ ] All error messages are clear and actionable
   - [ ] Success notifications provide next steps
   - [ ] Keyboard navigation works
   - [ ] Screen reader tested (basic accessibility)

**If ALL checkboxes are checked, feature is ready to ship.**

---

## Appendix A: File Naming Conventions

**Export File Naming:**
```
Pattern: bitcoin-account-{sanitized_name}-{timestamp}.txt

Examples:
- bitcoin-account-savings-20251019-143055.txt
- bitcoin-account-trading-account-20251019-143112.txt

Sanitization Rules:
- Replace spaces with hyphens
- Remove special chars (keep alphanumeric and hyphens)
- Lowercase all letters
- Truncate to 50 chars max (before timestamp)
```

**PDF File Naming:**
```
Pattern: bitcoin-account-{sanitized_name}-backup-{timestamp}.pdf

Examples:
- bitcoin-account-savings-backup-20251019-143055.pdf
- bitcoin-account-trading-account-backup-20251019-143112.pdf
```

**Timestamp Format:**
```
Format: YYYYMMDD-HHMMSS
Timezone: UTC
Example: 20251019-143055 (Oct 19, 2025, 2:30:55 PM UTC)
```

---

## Appendix B: Example User Flows (Narratives)

### Narrative 1: Alice Backs Up Her Savings Account

Alice has been using the wallet for 6 months and has accumulated significant testnet Bitcoin in her "Savings" account. She wants to create a backup in case she loses access to her computer.

**Alice's Journey:**

1. Alice opens the wallet and unlocks it
2. She navigates to Settings → Account Management
3. She sees her three accounts: "Main", "Savings", and "Trading"
4. She clicks the "Export Private Key" button next to "Savings"
5. The export dialog opens, showing:
   - Account: Savings
   - Address Type: Native SegWit
   - First Address: tb1q3xy...
   - A big warning box about private key security
6. Alice reads the warning and decides to use password protection
7. She checks the "Password Protection" checkbox
8. Password fields appear
9. She enters a strong password: "MyS3cur3Backup!2025"
10. The strength meter shows "Strong" in green
11. She confirms the password
12. She clicks "Export as PDF" (wants to print it)
13. After 3 seconds, a PDF downloads: `bitcoin-account-savings-backup-20251019-143055.pdf`
14. She also clicks "Export as File" for digital backup
15. A .txt file downloads: `bitcoin-account-savings-20251019-143055.txt`
16. Success message appears: "Private key exported successfully"
17. She closes the dialog
18. She opens the PDF and prints it to her home printer
19. She stores the printed backup in a fireproof safe
20. She stores the .txt file on an encrypted USB drive

**Outcome:** Alice now has two backups (printed and digital), both password-protected. She feels secure knowing she can recover her funds even if she loses access to the wallet.

### Narrative 2: Bob Migrates from Another Wallet

Bob has been using a different Bitcoin wallet (Electrum) for testing, and he wants to try this wallet extension. He has a private key from Electrum that he wants to import.

**Bob's Journey:**

1. Bob installs the wallet extension
2. He clicks the extension icon
3. The wallet setup screen appears with three options:
   - Create New Wallet
   - Import Seed Phrase
   - Import Private Key ← Bob clicks this
4. The import screen loads
5. Bob has his WIF key from Electrum: `cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy`
6. He selects the "Enter WIF" tab (vs Upload File)
7. He pastes his WIF key into the text area
8. The wallet validates it in real-time:
   - ✓ Valid WIF detected
   - Network: Testnet
   - First Address: tb1q7xy...
9. Bob recognizes the address (matches Electrum), so he knows it's correct
10. He enters an account name: "My Electrum Account"
11. He sets a new wallet password (different from Electrum)
12. He confirms the password
13. He clicks "Import Account"
14. After 2 seconds, success:
    - "Account imported successfully. Unlock wallet to continue."
15. The unlock screen appears
16. Bob unlocks the wallet with his new password
17. He sees the dashboard with his imported account
18. His balance matches what he had in Electrum: 0.15 tBTC
19. Transaction history loads from the blockchain

**Outcome:** Bob successfully migrated his account from Electrum to this wallet. The import process was smooth, and he verified the account by recognizing the first address and balance.

### Narrative 3: Carol Recovers from Lost Extension

Carol's browser crashed and lost all extension data. She had previously exported her "Main" account private key as a password-protected file. Now she needs to recover her account.

**Carol's Journey:**

1. Carol reinstalls the wallet extension
2. The setup screen appears
3. She doesn't have her seed phrase (it was only in the extension), but she has her exported private key file
4. She clicks "Import Private Key"
5. She clicks "Upload File"
6. She navigates to her USB backup and selects: `bitcoin-account-main-20251001-120000.txt`
7. The wallet reads the file and detects:
   - ✓ Encrypted file detected
8. A "File Password" field appears
9. Carol enters the password she used when exporting: "MyS3cur3Backup!2025"
10. The wallet decrypts the file:
    - ✓ Decryption successful
    - ✓ Valid WIF detected
    - Network: Testnet
    - First Address: tb1q3xy...
11. Carol recognizes the address (it's her main account)
12. She names the account: "Main" (same as before)
13. She sets a new wallet password (she decides to change it)
14. She confirms the password
15. She clicks "Import Account"
16. Success: "Account imported successfully"
17. She unlocks the wallet
18. Her "Main" account is restored with the correct balance

**Outcome:** Carol successfully recovered her account using the exported private key file. Even though she lost her seed phrase and extension data, the password-protected backup allowed her to restore access to her funds.

---

## Document Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-19 | Product Manager | Initial PRD created with comprehensive requirements |

---

## Stakeholder Sign-Off

**Required Approvals Before Implementation:**

- [ ] Product Manager: Requirements complete and accurate
- [ ] Security Expert: Security requirements adequate
- [ ] Blockchain Expert: Bitcoin/WIF implementation correct
- [ ] UI/UX Designer: User flows and design specs approved
- [ ] Frontend Developer: Frontend requirements clear
- [ ] Backend Developer: Backend requirements feasible
- [ ] Testing Expert: Testing requirements comprehensive
- [ ] QA Engineer: QA plan sufficient

**Approval Date:** _______________

---

**END OF DOCUMENT**
