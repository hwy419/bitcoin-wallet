# Private Key Export/Import - Frontend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Implementation Ready
**Audience**: Frontend Development Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [Message Passing to Backend](#message-passing-to-backend)
5. [TypeScript Interfaces](#typescript-interfaces)
6. [PDF Generation Implementation](#pdf-generation-implementation)
7. [File Upload/Download](#file-uploaddownload)
8. [Form Validation](#form-validation)
9. [Integration Points](#integration-points)
10. [Dependencies](#dependencies)
11. [Testing Approach](#testing-approach)
12. [Implementation Timeline](#implementation-timeline)
13. [Code Examples](#code-examples)

---

## Executive Summary

This document provides a complete, implementation-ready frontend plan for per-account private key export and import. The feature allows users to backup individual accounts in WIF format with optional password protection.

### Key Deliverables

- **10 new components** (5 shared utilities, 5 feature-specific)
- **3 modal flows** (export warning → export dialog → success)
- **2 import integration points** (wallet setup + existing wallet)
- **PDF generation** with QR codes for paper wallet backups
- **File upload/download** with drag-and-drop support

### Architecture Decisions

1. **Component Organization**: Feature-based folder structure under `src/tab/components/`
2. **State Management**: Local component state + React Context for wallet state
3. **Message Passing**: Chrome runtime messaging with TypeScript types
4. **File Handling**: Client-side only (no backend storage)
5. **Security**: Multiple confirmation modals, clear warnings, no key display in UI

---

## Component Architecture

### Component Hierarchy

```
src/tab/components/
│
├── shared/                              (Reusable utilities)
│   ├── PasswordStrengthMeter.tsx       NEW - Password strength visualization
│   ├── PasswordRequirementsChecklist.tsx NEW - Requirements validation
│   ├── FileUploadArea.tsx              NEW - Drag-and-drop file upload
│   ├── WarningBox.tsx                  NEW - Security warning component
│   ├── ErrorMessage.tsx                NEW - Standardized error display
│   ├── Modal.tsx                       EXISTING - Reuse
│   ├── Toast.tsx                       EXISTING - Reuse
│   └── SecurityWarning.tsx             EXISTING - Reuse
│
├── PrivateKeyExport/                    (Export feature)
│   ├── ExportWarningModal.tsx          Initial security warning
│   ├── ExportDialog.tsx                Main export configuration
│   ├── PlaintextWarningModal.tsx       Extra warning for unencrypted export
│   └── ExportSuccessModal.tsx          Post-export confirmation
│
├── PrivateKeyImport/                    (Import feature)
│   ├── ImportPrivateKeyForm.tsx        Main import form component
│   └── ImportSecurityNotice.tsx        Security notice for existing wallet
│
├── SettingsScreen.tsx                   MODIFY - Add export button
└── WalletSetup.tsx                      MODIFY - Add import tab
```

### Component Types

**Presentational Components** (Pure, no side effects):
- `PasswordStrengthMeter`
- `PasswordRequirementsChecklist`
- `FileUploadArea`
- `WarningBox`
- `ErrorMessage`

**Container Components** (Handle logic, state, API calls):
- `ExportWarningModal`
- `ExportDialog`
- `PlaintextWarningModal`
- `ExportSuccessModal`
- `ImportPrivateKeyForm`
- `ImportSecurityNotice`

**Page Components** (Top-level screens):
- `SettingsScreen` (modified)
- `WalletSetup` (modified)

### File Organization

```
src/tab/components/
├── shared/
│   ├── PasswordStrengthMeter.tsx       (150 lines)
│   ├── PasswordRequirementsChecklist.tsx (80 lines)
│   ├── FileUploadArea.tsx              (180 lines)
│   ├── WarningBox.tsx                  (120 lines)
│   └── ErrorMessage.tsx                (100 lines)
│
├── PrivateKeyExport/
│   ├── index.ts                         (Export all components)
│   ├── ExportWarningModal.tsx          (200 lines)
│   ├── ExportDialog.tsx                (350 lines - most complex)
│   ├── PlaintextWarningModal.tsx       (180 lines)
│   └── ExportSuccessModal.tsx          (150 lines)
│
└── PrivateKeyImport/
    ├── index.ts                         (Export all components)
    ├── ImportPrivateKeyForm.tsx        (400 lines - most complex)
    └── ImportSecurityNotice.tsx        (100 lines)
```

**Total Estimated Lines**: ~2,000 lines of new code

---

## State Management

### Local Component State

Each modal/form manages its own state. No global state needed for export/import flows.

**ExportDialog State:**
```typescript
interface ExportDialogState {
  // Format selection
  format: 'file' | 'pdf';

  // Password protection
  passwordProtection: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;

  // Validation
  passwordStrength: number; // 0-100
  requirementsMet: boolean;

  // UI state
  isExporting: boolean;
  error: string | null;
}
```

**ImportPrivateKeyForm State:**
```typescript
interface ImportFormState {
  // Method selection
  method: 'upload' | 'manual';

  // File upload
  file: File | null;
  filePassword: string;
  showFilePassword: boolean;

  // Manual entry
  wifInput: string;

  // Decrypted/validated WIF
  wif: string | null;
  validation: {
    valid: boolean;
    network?: 'testnet' | 'mainnet';
    firstAddress?: string;
    addressType?: string;
    error?: string;
  };

  // Account creation
  accountName: string;

  // Wallet setup specific (initial setup only)
  walletPassword?: string;
  confirmWalletPassword?: string;

  // UI state
  isImporting: boolean;
  error: string | null;
}
```

### React Context Integration

**Use existing WalletContext** for:
- Current account list (duplicate detection)
- Wallet lock status (export requires unlocked wallet)
- Account creation callback (refresh account list after import)

**No new context needed** - all feature state is local to components.

### State Flow

**Export Flow:**
```
1. User clicks "Export Private Key" in Settings
   → Opens ExportWarningModal (no state yet)

2. User acknowledges warning, clicks Continue
   → Opens ExportDialog
   → State: { format: 'file', passwordProtection: true, ... }

3. User configures export, clicks Export
   → If no password: Opens PlaintextWarningModal
   → If password: Calls backend EXPORT_PRIVATE_KEY
   → On success: Opens ExportSuccessModal
   → State includes: filename, encrypted status

4. User clicks Done
   → All modals close, state cleared
```

**Import Flow:**
```
1. User uploads file or pastes WIF
   → State: { method: 'upload'/'manual', wifInput/file: ... }

2. Real-time validation
   → State: { validation: { valid: true, firstAddress: ..., ... } }

3. User enters account name, clicks Import
   → Calls backend IMPORT_PRIVATE_KEY
   → On success: Close modal, show toast

4. Modal closes
   → State cleared, account list refreshed
```

### Form Validation State

**Real-time validation** for:
- Password strength (recalculate on every keystroke)
- Password match (check on every keystroke)
- WIF format (validate as user types)
- File upload (validate on file select)

**Submit validation** for:
- All fields filled
- All requirements met
- No active errors

```typescript
const canSubmit = () => {
  if (passwordProtection) {
    return (
      password.length >= 8 &&
      password === confirmPassword &&
      accountName.trim().length > 0
    );
  }
  return accountName.trim().length > 0;
};
```

---

## Message Passing to Backend

### New Message Types

Add to `src/shared/types/index.ts`:

```typescript
export enum MessageType {
  // Existing messages...

  // Private Key Export/Import
  EXPORT_PRIVATE_KEY = 'EXPORT_PRIVATE_KEY',
  IMPORT_PRIVATE_KEY = 'IMPORT_PRIVATE_KEY',
  VALIDATE_WIF = 'VALIDATE_WIF',
}
```

### Message Definitions

**EXPORT_PRIVATE_KEY:**
```typescript
// Request
interface ExportPrivateKeyRequest {
  type: MessageType.EXPORT_PRIVATE_KEY;
  payload: {
    accountIndex: number;
    password?: string; // If password protection enabled
  };
}

// Response
interface ExportPrivateKeyResponse {
  success: boolean;
  data?: {
    wif?: string;             // If plaintext
    encryptedData?: string;   // If password-protected
    metadata: {
      accountName: string;
      addressType: string;
      firstAddress: string;
      network: 'testnet' | 'mainnet';
      timestamp: number;
      encrypted: boolean;
    };
  };
  error?: string;
}
```

**IMPORT_PRIVATE_KEY:**
```typescript
// Request
interface ImportPrivateKeyRequest {
  type: MessageType.IMPORT_PRIVATE_KEY;
  payload: {
    wif: string;               // Decrypted WIF
    name: string;              // Account name
    walletPassword?: string;   // Only for initial wallet setup
  };
}

// Response
interface ImportPrivateKeyResponse {
  success: boolean;
  data?: {
    account: WalletAccount;    // Newly created account
    firstAddress: string;      // For verification
  };
  error?: string;
}
```

**VALIDATE_WIF:**
```typescript
// Request
interface ValidateWIFRequest {
  type: MessageType.VALIDATE_WIF;
  payload: {
    wif: string;
    filePassword?: string;     // If encrypted file
  };
}

// Response
interface ValidateWIFResponse {
  success: boolean;
  data?: {
    valid: boolean;
    network?: 'testnet' | 'mainnet';
    firstAddress?: string;
    addressType?: string;
    compressed?: boolean;
  };
  error?: string;
}
```

### Usage Examples

**Export:**
```typescript
const handleExport = async () => {
  setIsExporting(true);
  setError(null);

  try {
    const response = await sendMessage<ExportPrivateKeyResponse>(
      MessageType.EXPORT_PRIVATE_KEY,
      {
        accountIndex: account.index,
        password: passwordProtection ? password : undefined
      }
    );

    if (response.success && response.data) {
      // Generate file content
      const fileContent = generateFileContent(response.data);

      // Trigger download
      downloadTextFile(fileContent, generateFilename(response.data.metadata));

      // Show success modal
      setExportResult({
        filename: generateFilename(response.data.metadata),
        encrypted: response.data.metadata.encrypted
      });
    } else {
      setError(response.error || 'Export failed');
    }
  } catch (err) {
    setError('Failed to export private key. Please try again.');
  } finally {
    setIsExporting(false);
  }
};
```

**Import:**
```typescript
const handleImport = async () => {
  setIsImporting(true);
  setError(null);

  try {
    const response = await sendMessage<ImportPrivateKeyResponse>(
      MessageType.IMPORT_PRIVATE_KEY,
      {
        wif: wif!,
        name: accountName.trim(),
        walletPassword: isInitialSetup ? walletPassword : undefined
      }
    );

    if (response.success && response.data) {
      onSuccess(response.data.account);
      onClose();
    } else {
      setError(response.error || 'Import failed');
    }
  } catch (err) {
    setError('Failed to import private key. Please try again.');
  } finally {
    setIsImporting(false);
  }
};
```

**Validation:**
```typescript
const validateWIF = async (wif: string) => {
  try {
    const response = await sendMessage<ValidateWIFResponse>(
      MessageType.VALIDATE_WIF,
      { wif }
    );

    if (response.success && response.data) {
      setValidation(response.data);
    } else {
      setValidation({
        valid: false,
        error: response.error || 'Invalid private key'
      });
    }
  } catch (err) {
    setValidation({
      valid: false,
      error: 'Validation failed'
    });
  }
};

// Debounced validation on input change
useEffect(() => {
  const timer = setTimeout(() => {
    if (wifInput.length > 40) {
      validateWIF(wifInput);
    }
  }, 500);

  return () => clearTimeout(timer);
}, [wifInput]);
```

### Error Handling

**Standard Error Response:**
```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string; // Optional error code for specific handling
}
```

**Error Codes:**
```typescript
const ErrorCodes = {
  WALLET_LOCKED: 'WALLET_LOCKED',
  INVALID_WIF: 'INVALID_WIF',
  WRONG_NETWORK: 'WRONG_NETWORK',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  ENCRYPTION_FAILED: 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED: 'DECRYPTION_FAILED',
} as const;
```

**Error Handling Example:**
```typescript
if (!response.success) {
  switch (response.code) {
    case ErrorCodes.WALLET_LOCKED:
      setError('Wallet is locked. Please unlock to export private keys.');
      break;
    case ErrorCodes.WRONG_NETWORK:
      setError('This is a mainnet key. Wallet requires testnet keys.');
      break;
    case ErrorCodes.DUPLICATE_KEY:
      setError('This account is already imported.');
      break;
    default:
      setError(response.error || 'Operation failed. Please try again.');
  }
}
```

---

## TypeScript Interfaces

### Core Types

```typescript
// src/shared/types/privateKeyExport.ts

export interface ExportMetadata {
  accountName: string;
  addressType: string;
  firstAddress: string;
  network: 'testnet' | 'mainnet';
  timestamp: number;
  encrypted: boolean;
}

export interface ExportFileContent {
  metadata: ExportMetadata;
  wif?: string;              // If plaintext
  encryptedData?: string;    // If encrypted
  encryptionMethod?: string; // 'AES-256-GCM'
  instructions?: string;     // How to decrypt
}

export interface ImportValidation {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: 'legacy' | 'segwit' | 'native-segwit';
  compressed?: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number;      // 0-100
  label: string;      // 'Weak' | 'Medium' | 'Strong'
  color: string;      // Tailwind color class
  suggestions?: string[];
}

export type WarningSeverity = 'critical' | 'high' | 'info';
export type ExportFormat = 'file' | 'pdf';
export type ImportMethod = 'upload' | 'manual';
```

### Component Props

```typescript
// PasswordStrengthMeter.tsx
export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

// PasswordRequirementsChecklist.tsx
export interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

export interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
  className?: string;
}

// FileUploadArea.tsx
export interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  selectedFile?: File | null;
}

// WarningBox.tsx
export interface WarningBoxProps {
  severity: WarningSeverity;
  title: string;
  children: React.ReactNode;
  className?: string;
}

// ErrorMessage.tsx
export type ErrorType =
  | 'WALLET_LOCKED'
  | 'EXPORT_FAILED'
  | 'DOWNLOAD_BLOCKED'
  | 'INVALID_WIF'
  | 'WRONG_NETWORK'
  | 'INCORRECT_PASSWORD'
  | 'DUPLICATE_KEY'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE';

export interface ErrorMessageProps {
  error: ErrorType;
  onAction?: () => void;
  onClose?: () => void;
}

// ExportDialog.tsx
export interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: ExportFormat, password?: string) => Promise<void>;
  account: {
    index: number;
    name: string;
    addressType: string;
    firstAddress: string;
  };
}

// ImportPrivateKeyForm.tsx
export interface ImportPrivateKeyFormProps {
  onImport: (wif: string, accountName: string) => Promise<void>;
  onBack?: () => void;
  isInitialSetup?: boolean; // true if wallet setup, false if adding to existing
}
```

### Form State Types

```typescript
// ExportDialog form state
export interface ExportFormState {
  format: ExportFormat;
  passwordProtection: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

// ImportPrivateKeyForm state
export interface ImportFormState {
  method: ImportMethod;

  // File upload
  file: File | null;
  filePassword: string;
  showFilePassword: boolean;

  // Manual entry
  wifInput: string;

  // Validated WIF
  wif: string | null;
  validation: ImportValidation;

  // Account creation
  accountName: string;

  // Wallet setup (initial setup only)
  walletPassword?: string;
  confirmWalletPassword?: string;

  // UI state
  isImporting: boolean;
  error: string | null;
}
```

---

## PDF Generation Implementation

### Library Selection

**Chosen Library**: `jspdf` + `qrcode`

**Rationale:**
- ✅ Client-side only (no server processing)
- ✅ MIT license, widely used
- ✅ No external dependencies
- ✅ Works well with QR code generation
- ✅ Good TypeScript support

### Installation

```bash
npm install jspdf qrcode
npm install --save-dev @types/qrcode
```

### PDF Generator Function

```typescript
// src/tab/utils/pdfGenerator.ts

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

export interface PDFExportOptions {
  accountName: string;
  addressType: string;
  firstAddress: string;
  network: 'testnet' | 'mainnet';
  wif: string;
  encrypted: boolean;
  encryptedData?: string;
}

export async function generatePDFBackup(
  options: PDFExportOptions
): Promise<Blob> {
  const {
    accountName,
    addressType,
    firstAddress,
    network,
    wif,
    encrypted,
    encryptedData
  } = options;

  // Initialize PDF (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const margin = 25;
  const contentWidth = pageWidth - (margin * 2);

  let yPos = margin;

  // HEADER
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Bitcoin Account Private Key Backup', pageWidth / 2, yPos, {
    align: 'center'
  });
  yPos += 15;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // ACCOUNT INFORMATION
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT INFORMATION', margin, yPos);
  yPos += 8;

  // Draw info box
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos, contentWidth, 35);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  yPos += 6;

  const info = [
    ['Account:', accountName],
    ['Address Type:', addressType],
    ['First Address:', firstAddress],
    ['Network:', network],
    ['Generated:', new Date().toISOString().replace('T', ' ').split('.')[0] + ' UTC']
  ];

  info.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 5, yPos);
    doc.setFont('courier', 'normal');
    doc.text(value, margin + 35, yPos);
    yPos += 6;
  });

  yPos += 10;

  if (encrypted && encryptedData) {
    // ENCRYPTED KEY SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ENCRYPTED PRIVATE KEY', margin, yPos);
    yPos += 8;

    doc.rect(margin, yPos, contentWidth, 40);
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('courier', 'normal');

    // Split encrypted data into lines
    const lines = splitIntoLines(encryptedData, 80);
    lines.forEach(line => {
      doc.text(line, margin + 5, yPos);
      yPos += 4;
    });

    yPos += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Encryption: AES-256-GCM with PBKDF2 (100,000 iterations)', margin, yPos);
    yPos += 5;
    doc.text('To decrypt: Use "Import Private Key" and enter export password', margin, yPos);
    yPos += 10;

  } else {
    // PLAINTEXT KEY SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRIVATE KEY (WIF FORMAT)', margin, yPos);
    yPos += 8;

    doc.rect(margin, yPos, contentWidth, 12);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    doc.text(wif, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // QR CODE (only for plaintext)
    const qrDataUrl = await QRCode.toDataURL(wif, {
      errorCorrectionLevel: 'M',
      width: 200,
      margin: 2
    });

    doc.addImage(qrDataUrl, 'PNG', margin, yPos, 60, 60);

    doc.setFontSize(8);
    doc.text('Scan QR code to import', margin, yPos + 65);
    doc.text('this private key', margin, yPos + 69);

    yPos += 80;
  }

  // SECURITY WARNING BOX
  doc.setDrawColor(255, 0, 0);
  doc.setLineWidth(1);
  doc.rect(margin, yPos, contentWidth, 50);

  doc.setFontSize(12);
  doc.setTextColor(255, 0, 0);
  doc.text('⚠️ CRITICAL SECURITY INFORMATION', pageWidth / 2, yPos + 8, {
    align: 'center'
  });

  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  yPos += 15;

  const warnings = [
    '• This private key provides complete access to account funds',
    '• Never share this document with anyone',
    '• Store in a secure, fireproof location',
    '• Destroy (shred) when no longer needed',
    '• Anyone who finds this can steal your funds'
  ];

  warnings.forEach(warning => {
    doc.text(warning, margin + 5, yPos);
    yPos += 6;
  });

  yPos += 10;

  // IMPORT INSTRUCTIONS
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('HOW TO IMPORT THIS KEY', margin, yPos);
  yPos += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (!encrypted) {
    doc.text('Option 1: Scan QR Code', margin, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.text('• Open wallet "Import Account" feature', margin + 5, yPos);
    yPos += 4;
    doc.text('• Select "Scan QR Code"', margin + 5, yPos);
    yPos += 4;
    doc.text('• Scan the QR code above', margin + 5, yPos);
    yPos += 7;

    doc.setFontSize(9);
    doc.text('Option 2: Manual Entry', margin, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.text('• Open wallet "Import Account" feature', margin + 5, yPos);
    yPos += 4;
    doc.text('• Select "Enter WIF Manually"', margin + 5, yPos);
    yPos += 4;
    doc.text('• Type the private key shown above', margin + 5, yPos);
  } else {
    doc.text('To import this encrypted key:', margin, yPos);
    yPos += 5;
    doc.setFontSize(8);
    doc.text('• Save this PDF to secure USB drive', margin + 5, yPos);
    yPos += 4;
    doc.text('• Open wallet "Import Account" feature', margin + 5, yPos);
    yPos += 4;
    doc.text('• Upload this PDF file', margin + 5, yPos);
    yPos += 4;
    doc.text('• Enter the export password when prompted', margin + 5, yPos);
  }

  // FOOTER
  yPos = 285; // Bottom of page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Bitcoin Wallet Extension v0.11.0 - Testnet', pageWidth / 2, yPos, {
    align: 'center'
  });

  // Return as Blob
  return doc.output('blob');
}

// Helper function
function splitIntoLines(text: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.substring(i, i + charsPerLine));
  }
  return lines;
}
```

### Usage in ExportDialog

```typescript
const handlePDFExport = async () => {
  setIsExporting(true);

  try {
    // Get WIF from backend
    const response = await sendMessage<ExportPrivateKeyResponse>(
      MessageType.EXPORT_PRIVATE_KEY,
      {
        accountIndex: account.index,
        password: passwordProtection ? password : undefined
      }
    );

    if (!response.success || !response.data) {
      throw new Error('Export failed');
    }

    // Generate PDF
    const pdfBlob = await generatePDFBackup({
      accountName: response.data.metadata.accountName,
      addressType: response.data.metadata.addressType,
      firstAddress: response.data.metadata.firstAddress,
      network: response.data.metadata.network,
      wif: response.data.wif || '',
      encrypted: response.data.metadata.encrypted,
      encryptedData: response.data.encryptedData
    });

    // Trigger download
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bitcoin-account-${sanitizeFilename(account.name)}-backup-${getTimestamp()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Show success
    setExportResult({
      filename: a.download,
      encrypted: response.data.metadata.encrypted
    });
  } catch (err) {
    setError('PDF generation failed. Please try text file export instead.');
  } finally {
    setIsExporting(false);
  }
};
```

### QR Code Generation

```typescript
// Separate utility for QR code generation
import QRCode from 'qrcode';

export async function generateQRCode(
  data: string,
  options?: {
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  }
): Promise<string> {
  return await QRCode.toDataURL(data, {
    errorCorrectionLevel: options?.errorCorrectionLevel || 'M',
    width: options?.width || 200,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });
}
```

---

## File Upload/Download

### File Download Implementation

```typescript
// src/tab/utils/fileDownload.ts

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Trigger download
  document.body.appendChild(a);
  a.click();

  // Cleanup
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

export function getTimestamp(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const hours = String(now.getUTCHours()).padStart(2, '0');
  const minutes = String(now.getUTCMinutes()).padStart(2, '0');
  const seconds = String(now.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

export function generateFilename(
  accountName: string,
  type: 'txt' | 'pdf'
): string {
  const sanitized = sanitizeFilename(accountName);
  const timestamp = getTimestamp();
  const suffix = type === 'pdf' ? '-backup' : '';

  return `bitcoin-account-${sanitized}${suffix}-${timestamp}.${type}`;
}
```

### File Content Generation

```typescript
// src/tab/utils/exportFileContent.ts

import { ExportMetadata } from '../../shared/types/privateKeyExport';

export function generatePlaintextFile(
  metadata: ExportMetadata,
  wif: string
): string {
  return `Bitcoin Account Private Key
===========================
Account: ${metadata.accountName}
Address Type: ${metadata.addressType}
First Address: ${metadata.firstAddress}
Network: ${metadata.network}

Private Key (WIF):
${wif}

SECURITY WARNING:
- This private key provides full access to this account's funds
- Never share this key with anyone
- Store this file in a secure location
- Consider encrypting this file with strong password protection

Generated: ${new Date(metadata.timestamp).toISOString()}
`;
}

export function generateEncryptedFile(
  metadata: ExportMetadata,
  encryptedData: string
): string {
  return `Bitcoin Account Private Key (Encrypted)
=======================================
Account: ${metadata.accountName}
Address Type: ${metadata.addressType}
First Address: ${metadata.firstAddress}
Network: ${metadata.network}

Encrypted Private Key:
${encryptedData}

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

Generated: ${new Date(metadata.timestamp).toISOString()}
`;
}
```

### File Upload Implementation

```typescript
// src/tab/utils/fileUpload.ts

export interface FileReadResult {
  content: string;
  filename: string;
  size: number;
}

export async function readTextFile(file: File): Promise<FileReadResult> {
  // Validate file
  if (file.size > 1024 * 1024) {
    throw new Error('File too large. Maximum size: 1MB');
  }

  if (!file.name.endsWith('.txt')) {
    throw new Error('Invalid file type. Only .txt files supported.');
  }

  // Read file
  const content = await file.text();

  if (content.length > 10000) {
    throw new Error('File content too large');
  }

  return {
    content,
    filename: file.name,
    size: file.size
  };
}

export interface ParsedImportFile {
  encrypted: boolean;
  wif?: string;
  encryptedData?: string;
  accountName?: string;
  addressType?: string;
  firstAddress?: string;
}

export function parseImportFile(fileContent: string): ParsedImportFile {
  // Detect file type
  const isEncrypted = fileContent.includes('Encrypted Private Key:');
  const isPlaintext = fileContent.includes('Private Key (WIF):');

  if (!isEncrypted && !isPlaintext) {
    // Try as raw WIF
    const trimmed = fileContent.trim();
    if (isValidWIFFormat(trimmed)) {
      return { encrypted: false, wif: trimmed };
    }
    throw new Error('Invalid file format. Expected WIF or exported account file.');
  }

  // Extract metadata
  const accountName = extractField(fileContent, 'Account:');
  const addressType = extractField(fileContent, 'Address Type:');
  const firstAddress = extractField(fileContent, 'First Address:');

  // Extract key data
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
  // WIF regex: starts with specific chars, 51-52 chars total
  const wifRegex = /^[9c5KL][1-9A-HJ-NP-Za-km-z]{50,51}$/;
  return wifRegex.test(str);
}
```

---

## Form Validation

### Password Strength Validation

```typescript
// src/tab/utils/passwordStrength.ts

export interface PasswordStrength {
  score: number;      // 0-100
  label: string;      // 'Weak' | 'Medium' | 'Strong'
  color: string;      // Tailwind color class
  suggestions: string[];
}

export function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) {
    return {
      score: 0,
      label: 'Weak',
      color: 'bg-red-500',
      suggestions: []
    };
  }

  let score = 0;
  const suggestions: string[] = [];

  // Length scoring (max 50 points)
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 15;
  else if (password.length < 12) {
    suggestions.push('Use at least 12 characters for stronger protection');
  }

  // Character variety (max 50 points)
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);

  if (hasLower && hasUpper) score += 15;
  else suggestions.push('Add both uppercase and lowercase letters');

  if (hasNumber) score += 15;
  else suggestions.push('Add numbers');

  if (hasSpecial) score += 20;
  else suggestions.push('Add special characters (!@#$%^&*) for best security');

  // Determine label and color
  let label: string;
  let color: string;

  if (score < 40) {
    label = 'Weak';
    color = 'bg-red-500';
  } else if (score < 70) {
    label = 'Medium';
    color = 'bg-amber-500';
  } else {
    label = 'Strong';
    color = 'bg-green-500';
  }

  return {
    score: Math.min(score, 100),
    label,
    color,
    suggestions: suggestions.slice(0, 2)
  };
}

export function meetsMinimumRequirements(password: string): boolean {
  return password.length >= 8;
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password.length > 0 && password === confirmPassword;
}
```

### WIF Validation

```typescript
// src/tab/utils/wifValidation.ts

export function validateWIFFormat(wif: string): string | null {
  // Must be Base58Check format
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (!base58Regex.test(wif)) {
    return 'Invalid WIF format. Must be Base58-encoded.';
  }

  // Must be correct length (51-52 chars)
  if (wif.length < 51 || wif.length > 52) {
    return 'Invalid WIF length. Must be 51-52 characters.';
  }

  return null;
}

export function detectNetwork(wif: string): 'testnet' | 'mainnet' | 'invalid' {
  const firstChar = wif[0];

  // Testnet prefixes
  if (firstChar === '9' || firstChar === 'c') {
    return 'testnet';
  }

  // Mainnet prefixes
  if (firstChar === '5' || firstChar === 'K' || firstChar === 'L') {
    return 'mainnet';
  }

  return 'invalid';
}

export function validateWIFNetwork(wif: string): string | null {
  const network = detectNetwork(wif);

  if (network === 'invalid') {
    return 'Invalid WIF prefix.';
  }

  if (network !== 'testnet') {
    return `Wrong network: This is a ${network} key, but wallet requires testnet keys`;
  }

  return null;
}
```

### Form Validation Hook

```typescript
// src/tab/hooks/useFormValidation.ts

import { useState, useEffect } from 'react';

interface ValidationRule<T> {
  validate: (value: T) => string | null;
  message?: string;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  rules: Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = (field: keyof T, value: T[keyof T]): string | null => {
    const fieldRules = rules[field];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const error = rule.validate(value);
      if (error) return error;
    }

    return null;
  };

  const handleChange = (field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));

    // Validate on change if field has been touched
    if (touched[field]) {
      const error = validate(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  const handleBlur = (field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    const error = validate(field, values[field]);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  };

  const isValid = () => {
    return Object.keys(rules).every(field => {
      const error = validate(field as keyof T, values[field as keyof T]);
      return !error;
    });
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    isValid,
    reset
  };
}
```

---

## Integration Points

### Settings Screen Integration

**Location**: `src/tab/components/SettingsScreen.tsx`

**Modification**: Add export button to each account row

```typescript
// In account list rendering
{accounts.map(account => (
  <div key={account.index} className="border-b border-gray-800 last:border-0">
    {/* Existing account info */}
    <div className="p-4">
      <h3>{account.name}</h3>
      <p>{account.addressType}</p>
      {/* ... */}
    </div>

    {/* Action buttons */}
    <div className="px-4 pb-4 flex gap-2">
      <button onClick={() => handleRename(account)}>
        Rename Account
      </button>

      {/* NEW: Export button (only for HD and imported accounts) */}
      {canExportPrivateKey(account) && (
        <button
          onClick={() => handleExportPrivateKey(account)}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2"
        >
          <KeyIcon className="w-4 h-4" />
          Export Private Key
        </button>
      )}
    </div>
  </div>
))}

{/* Export warning modal */}
<ExportWarningModal
  isOpen={showExportWarning}
  onClose={() => setShowExportWarning(false)}
  onContinue={() => {
    setShowExportWarning(false);
    setShowExportDialog(true);
  }}
  accountName={selectedAccount?.name || ''}
  addressType={selectedAccount?.addressType || ''}
/>

{/* Export dialog */}
<ExportDialog
  isOpen={showExportDialog}
  onClose={() => setShowExportDialog(false)}
  onExport={handleExport}
  account={selectedAccount}
/>
```

**Helper Functions:**
```typescript
function canExportPrivateKey(account: WalletAccount): boolean {
  // Only HD and imported accounts can export
  // Multisig accounts cannot (no single private key)
  return account.type === 'hd' || account.type === 'imported';
}

const handleExportPrivateKey = (account: WalletAccount) => {
  setSelectedAccount(account);
  setShowExportWarning(true);
};

const handleExport = async (format: ExportFormat, password?: string) => {
  // Implementation in next section
};
```

### Wallet Setup Integration

**Location**: `src/tab/components/WalletSetup.tsx`

**Modification**: Add "Import Private Key" tab

```typescript
// Tab state
type SetupTab = 'create' | 'import-seed' | 'import-private-key';
const [activeTab, setActiveTab] = useState<SetupTab>('create');

// Tab navigation
<div className="flex gap-4 mb-6 border-b border-gray-700">
  <button
    onClick={() => setActiveTab('create')}
    className={`pb-3 px-1 ${
      activeTab === 'create'
        ? 'border-b-2 border-bitcoin text-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Create New
  </button>

  <button
    onClick={() => setActiveTab('import-seed')}
    className={`pb-3 px-1 ${
      activeTab === 'import-seed'
        ? 'border-b-2 border-bitcoin text-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Import Seed
  </button>

  {/* NEW: Import Private Key tab */}
  <button
    onClick={() => setActiveTab('import-private-key')}
    className={`pb-3 px-1 ${
      activeTab === 'import-private-key'
        ? 'border-b-2 border-bitcoin text-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Import Private Key
  </button>
</div>

{/* Tab content */}
{activeTab === 'create' && (
  <CreateWalletForm onSuccess={handleWalletCreated} />
)}

{activeTab === 'import-seed' && (
  <ImportSeedForm onSuccess={handleWalletImported} />
)}

{activeTab === 'import-private-key' && (
  <ImportPrivateKeyForm
    isInitialSetup={true}
    onImport={handlePrivateKeyImport}
    onBack={() => setActiveTab('create')}
  />
)}
```

**Import Handler:**
```typescript
const handlePrivateKeyImport = async (wif: string, accountName: string, walletPassword: string) => {
  try {
    const response = await sendMessage<ImportPrivateKeyResponse>(
      MessageType.IMPORT_PRIVATE_KEY,
      {
        wif,
        name: accountName,
        walletPassword
      }
    );

    if (response.success && response.data) {
      // Wallet created with imported account
      navigate('/unlock');
    } else {
      throw new Error(response.error || 'Import failed');
    }
  } catch (err) {
    console.error('Import error:', err);
    throw err;
  }
};
```

### Sidebar/Account Dropdown Integration

**Location**: `src/tab/components/Sidebar.tsx` or account dropdown

**Modification**: Add "Import Account" option

```typescript
// In account dropdown menu
<div className="py-2">
  <button
    onClick={handleCreateAccount}
    className="w-full px-4 py-2 text-left hover:bg-gray-800"
  >
    Create New Account
  </button>

  {/* NEW: Import Account option */}
  <button
    onClick={() => setShowImportAccountModal(true)}
    className="w-full px-4 py-2 text-left hover:bg-gray-800"
  >
    Import Account
  </button>
</div>

{/* Import Account Modal */}
<ImportAccountModal
  isOpen={showImportAccountModal}
  onClose={() => setShowImportAccountModal(false)}
  onSuccess={handleAccountImported}
/>
```

**Import Account Modal (Existing Wallet):**
```typescript
// This is a simplified version of ImportPrivateKeyForm
// but wrapped in a modal and without wallet password fields

interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: WalletAccount) => void;
}

export const ImportAccountModal: React.FC<ImportAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const handleImport = async (wif: string, accountName: string) => {
    const response = await sendMessage<ImportPrivateKeyResponse>(
      MessageType.IMPORT_PRIVATE_KEY,
      { wif, name: accountName }
    );

    if (response.success && response.data) {
      onSuccess(response.data.account);
      onClose();
    } else {
      throw new Error(response.error || 'Import failed');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl w-full">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Import Account</h2>

        {/* Security notice */}
        <ImportSecurityNotice className="mb-6" />

        {/* Import form */}
        <ImportPrivateKeyForm
          isInitialSetup={false}
          onImport={handleImport}
        />
      </div>
    </Modal>
  );
};
```

---

## Dependencies

### New npm Packages

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "qrcode": "^1.5.3"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.5"
  }
}
```

### Installation Command

```bash
npm install jspdf qrcode
npm install --save-dev @types/qrcode
```

### Bundle Size Impact

| Package | Size (gzipped) | Impact |
|---------|---------------|--------|
| jsPDF | ~150 KB | Medium (PDF generation only used on demand) |
| qrcode | ~30 KB | Low |
| **Total** | **~180 KB** | **Medium impact** |

**Optimization Strategy:**
- Consider lazy loading: Import jsPDF/qrcode only when export dialog opens
- Tree-shake unused features from jsPDF

```typescript
// Lazy load PDF generator
const handlePDFExport = async () => {
  const { generatePDFBackup } = await import('../utils/pdfGenerator');
  // ... rest of export logic
};
```

### Version Compatibility

**Current Project Stack:**
- React: 18.x ✅
- TypeScript: 5.x ✅
- Tailwind CSS: 3.x ✅

**Package Compatibility:**
- jsPDF: Compatible with React 18, TypeScript 5 ✅
- qrcode: Compatible with React 18, TypeScript 5 ✅

**No conflicts expected.**

---

## Testing Approach

### Unit Tests

**Test Files Structure:**
```
src/tab/components/
├── shared/
│   ├── __tests__/
│   │   ├── PasswordStrengthMeter.test.tsx
│   │   ├── PasswordRequirementsChecklist.test.tsx
│   │   ├── FileUploadArea.test.tsx
│   │   ├── WarningBox.test.tsx
│   │   └── ErrorMessage.test.tsx
│
├── PrivateKeyExport/
│   └── __tests__/
│       ├── ExportWarningModal.test.tsx
│       ├── ExportDialog.test.tsx
│       ├── PlaintextWarningModal.test.tsx
│       └── ExportSuccessModal.test.tsx
│
└── PrivateKeyImport/
    └── __tests__/
        ├── ImportPrivateKeyForm.test.tsx
        └── ImportSecurityNotice.test.tsx
```

**Test Coverage Requirements:**
- Utility functions: 100%
- Components: 80%+
- Integration flows: All critical paths

**Example Unit Tests:**

```typescript
// PasswordStrengthMeter.test.tsx
describe('PasswordStrengthMeter', () => {
  it('shows weak for short passwords', () => {
    const { getByText } = render(<PasswordStrengthMeter password="weak" />);
    expect(getByText('Weak')).toBeInTheDocument();
  });

  it('shows strong for complex passwords', () => {
    const { getByText } = render(<PasswordStrengthMeter password="MyP@ssw0rd123!" />);
    expect(getByText('Strong')).toBeInTheDocument();
  });

  it('shows suggestions for improvement', () => {
    const { getByText } = render(<PasswordStrengthMeter password="password" />);
    expect(getByText(/Add special characters/)).toBeInTheDocument();
  });
});

// ExportDialog.test.tsx
describe('ExportDialog', () => {
  it('renders account information', () => {
    const account = {
      index: 0,
      name: 'Main Account',
      addressType: 'Native SegWit',
      firstAddress: 'tb1q...'
    };

    const { getByText } = render(
      <ExportDialog
        isOpen={true}
        onClose={jest.fn()}
        onExport={jest.fn()}
        account={account}
      />
    );

    expect(getByText('Main Account')).toBeInTheDocument();
    expect(getByText('Native SegWit')).toBeInTheDocument();
  });

  it('enables password fields when checkbox checked', () => {
    const { getByLabelText, getByPlaceholderText } = render(<ExportDialog {...props} />);

    const checkbox = getByLabelText(/Enable password protection/);
    fireEvent.click(checkbox);

    expect(getByPlaceholderText('Password')).toBeEnabled();
  });

  it('disables export button when password requirements not met', () => {
    const { getByText, getByPlaceholderText } = render(<ExportDialog {...props} />);

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.change(passwordInput, { target: { value: 'short' } });

    expect(getByText('Export Now')).toBeDisabled();
  });
});

// FileUploadArea.test.tsx
describe('FileUploadArea', () => {
  it('calls onFileSelect when file dropped', () => {
    const onFileSelect = jest.fn();
    const { container } = render(<FileUploadArea onFileSelect={onFileSelect} />);

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const dropZone = container.firstChild;

    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows error for invalid file type', () => {
    const { container, getByText } = render(<FileUploadArea onFileSelect={jest.fn()} />);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const dropZone = container.firstChild;

    fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });

    expect(getByText(/Invalid file type/)).toBeInTheDocument();
  });
});
```

### Integration Tests

**Test Critical Flows:**

```typescript
// export-import-flow.test.tsx
describe('Export-Import Flow', () => {
  it('successfully exports and imports private key', async () => {
    // 1. Export
    const { getByText } = render(<SettingsScreen />);

    fireEvent.click(getByText('Export Private Key'));

    // Acknowledge warning
    fireEvent.click(getByLabelText(/I understand the risks/));
    fireEvent.click(getByText('Continue to Export'));

    // Configure export
    fireEvent.change(getByPlaceholderText('Account Name'), {
      target: { value: 'Test Account' }
    });

    fireEvent.click(getByText('Export as File'));

    await waitFor(() => {
      expect(getByText(/Private key exported/)).toBeInTheDocument();
    });

    // 2. Import
    const { getByText: getByTextImport } = render(<ImportAccountModal isOpen={true} />);

    // TODO: Simulate file upload
    // TODO: Verify account imported
  });
});
```

### Manual Testing Checklist

**Export Flow:**
- [ ] Export button appears for HD/imported accounts
- [ ] Export button hidden for multisig accounts
- [ ] Warning modal displays correctly
- [ ] Cannot proceed without acknowledging checkbox
- [ ] Password strength meter updates in real-time
- [ ] Requirements checklist updates correctly
- [ ] Plaintext warning shows when unchecking password
- [ ] File downloads with correct name
- [ ] PDF generates without errors
- [ ] QR code is scannable
- [ ] Success modal shows correct information

**Import Flow:**
- [ ] Import tab appears in wallet setup
- [ ] File upload drag-and-drop works
- [ ] Manual WIF entry works
- [ ] Encrypted file detection works
- [ ] Password field appears for encrypted files
- [ ] Real-time validation works
- [ ] Preview shows correct information
- [ ] Network validation rejects mainnet keys
- [ ] Duplicate detection works
- [ ] Account successfully imported
- [ ] Account appears in account list

**Edge Cases:**
- [ ] Very long account names (truncation)
- [ ] Special characters in account names (sanitization)
- [ ] Browser download blocking (error message)
- [ ] Corrupted files (error handling)
- [ ] Wrong password (error message)
- [ ] Invalid WIF format (error message)

---

## Implementation Timeline

### Phase 1: Shared Components (Week 1 - Days 1-2)

**Components:**
- PasswordStrengthMeter
- PasswordRequirementsChecklist
- FileUploadArea
- WarningBox
- ErrorMessage

**Deliverables:**
- 5 components with unit tests
- Storybook stories for each
- TypeScript interfaces

**Estimated Hours:** 16 hours

### Phase 2: Export Flow (Week 1 - Days 3-5)

**Components:**
- ExportWarningModal
- ExportDialog
- PlaintextWarningModal
- ExportSuccessModal

**Backend Integration:**
- EXPORT_PRIVATE_KEY message handler
- File generation utilities
- File download implementation

**Deliverables:**
- 4 modal components with tests
- File export working end-to-end
- Integration with Settings screen

**Estimated Hours:** 24 hours

### Phase 3: PDF Generation (Week 2 - Days 1-2)

**Tasks:**
- PDF generator utility
- QR code generation
- PDF layout implementation
- Testing printed output

**Deliverables:**
- PDF export fully functional
- QR codes scannable
- Print-friendly layout

**Estimated Hours:** 16 hours

### Phase 4: Import Flow (Week 2 - Days 3-5)

**Components:**
- ImportPrivateKeyForm
- ImportSecurityNotice

**Backend Integration:**
- IMPORT_PRIVATE_KEY message handler
- VALIDATE_WIF message handler
- File parsing utilities
- Duplicate detection

**Deliverables:**
- Import form component with tests
- File upload working
- Integration with WalletSetup
- Integration with account modal

**Estimated Hours:** 24 hours

### Phase 5: Integration & Polish (Week 3 - Days 1-3)

**Tasks:**
- Settings screen integration
- Wallet setup integration
- Sidebar/dropdown integration
- Error handling polish
- Loading states
- Animations

**Deliverables:**
- All integration points complete
- Smooth user experience
- Proper error handling

**Estimated Hours:** 24 hours

### Phase 6: Testing & Documentation (Week 3 - Days 4-5)

**Tasks:**
- Manual testing on testnet
- Bug fixes
- Integration tests
- Documentation updates
- Code review

**Deliverables:**
- All tests passing
- Bug-free experience
- Updated documentation

**Estimated Hours:** 16 hours

### Total Timeline

**Total Estimated Hours:** 120 hours (3 weeks)

**Breakdown:**
- Shared components: 16 hours
- Export flow: 24 hours
- PDF generation: 16 hours
- Import flow: 24 hours
- Integration: 24 hours
- Testing: 16 hours

**Team Allocation:**
- 1 senior frontend developer (full-time)
- 1 QA engineer (testing phase)
- 1 security expert (code review)

---

## Code Examples

### Complete ExportDialog Component

```typescript
// src/tab/components/PrivateKeyExport/ExportDialog.tsx

import React, { useState } from 'react';
import Modal from '../shared/Modal';
import PasswordStrengthMeter from '../shared/PasswordStrengthMeter';
import PasswordRequirementsChecklist from '../shared/PasswordRequirementsChecklist';
import WarningBox from '../shared/WarningBox';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType } from '../../../shared/types';
import { ExportFormat } from '../../../shared/types/privateKeyExport';
import { downloadTextFile, generateFilename } from '../../utils/fileDownload';
import { generatePlaintextFile, generateEncryptedFile } from '../../utils/exportFileContent';
import { generatePDFBackup } from '../../utils/pdfGenerator';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (filename: string, encrypted: boolean) => void;
  account: {
    index: number;
    name: string;
    addressType: string;
    firstAddress: string;
  };
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  account
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Form state
  const [format, setFormat] = useState<ExportFormat>('file');
  const [passwordProtection, setPasswordProtection] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPlaintextWarning, setShowPlaintextWarning] = useState(false);

  // Validation
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const meetsMinLength = password.length >= 8;
  const canExport = passwordProtection
    ? (meetsMinLength && passwordsMatch)
    : true;

  const handlePasswordProtectionChange = (checked: boolean) => {
    setPasswordProtection(checked);
    if (!checked) {
      setShowPlaintextWarning(true);
    }
  };

  const handleExport = async () => {
    if (!canExport) return;

    setIsExporting(true);
    setError(null);

    try {
      // Request export from backend
      const response = await sendMessage<{
        wif?: string;
        encryptedData?: string;
        metadata: any;
      }>(
        MessageType.EXPORT_PRIVATE_KEY,
        {
          accountIndex: account.index,
          password: passwordProtection ? password : undefined
        }
      );

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Export failed');
      }

      if (format === 'file') {
        // Generate text file
        const fileContent = passwordProtection
          ? generateEncryptedFile(response.data.metadata, response.data.encryptedData!)
          : generatePlaintextFile(response.data.metadata, response.data.wif!);

        const filename = generateFilename(account.name, 'txt');
        downloadTextFile(fileContent, filename);

        onSuccess(filename, passwordProtection);
      } else {
        // Generate PDF
        const pdfBlob = await generatePDFBackup({
          accountName: account.name,
          addressType: account.addressType,
          firstAddress: account.firstAddress,
          network: 'testnet',
          wif: response.data.wif || '',
          encrypted: passwordProtection,
          encryptedData: response.data.encryptedData
        });

        const filename = generateFilename(account.name, 'pdf');
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        onSuccess(filename, passwordProtection);
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl w-full">
        <div className="p-6">
          {/* Header */}
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <svg className="w-6 h-6" /* Key icon */ />
            Export Private Key
          </h2>

          {/* Account Information */}
          <div className="mb-6 p-4 bg-gray-850 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">
              Account Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Account:</span>
                <span className="text-gray-300 font-medium">{account.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Address Type:</span>
                <span className="text-gray-300">{account.addressType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">First Address:</span>
                <span className="text-gray-300 font-mono text-xs">
                  {account.firstAddress}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network:</span>
                <span className="text-gray-300">Testnet</span>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Export Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                <input
                  type="radio"
                  name="format"
                  value="file"
                  checked={format === 'file'}
                  onChange={() => setFormat('file')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="text-sm font-medium text-gray-300">
                    File Download (.txt)
                  </div>
                  <div className="text-xs text-gray-500">
                    Download as text file for digital storage
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
                <input
                  type="radio"
                  name="format"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                  className="w-4 h-4"
                />
                <div>
                  <div className="text-sm font-medium text-gray-300">
                    Print PDF (with QR code)
                  </div>
                  <div className="text-xs text-gray-500">
                    Generate PDF for paper wallet backup
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Password Protection */}
          <div className="mb-6">
            <label className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                checked={passwordProtection}
                onChange={(e) => handlePasswordProtectionChange(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-300">
                Enable password protection (recommended)
              </span>
            </label>

            {passwordProtection && (
              <div className="p-4 bg-gray-850 rounded-lg border border-gray-700 space-y-4">
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
                      placeholder="Enter export password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {/* Eye icon */}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {/* Eye icon */}
                    </button>
                  </div>
                </div>

                {/* Password Strength */}
                {password.length > 0 && (
                  <PasswordStrengthMeter password={password} />
                )}

                {/* Requirements Checklist */}
                <PasswordRequirementsChecklist
                  password={password}
                  confirmPassword={confirmPassword}
                />
              </div>
            )}

            {!passwordProtection && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300">
                ⚠️ Private key will be exported in plain text (not recommended)
              </div>
            )}
          </div>

          {/* Note */}
          {passwordProtection && (
            <div className="mb-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
              ℹ️ If you lose this password, the key cannot be recovered from the encrypted file.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-sm text-red-300">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg font-semibold text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!canExport || isExporting}
              className={`
                flex-1 px-6 py-3 rounded-lg font-semibold transition-all
                ${canExport && !isExporting
                  ? 'bg-bitcoin hover:bg-bitcoin-hover text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                }
              `}
            >
              {isExporting ? 'Exporting...' : 'Export Now'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Plaintext Warning Modal */}
      {showPlaintextWarning && (
        <PlaintextWarningModal
          isOpen={showPlaintextWarning}
          onClose={() => {
            setShowPlaintextWarning(false);
            setPasswordProtection(true);
          }}
          onContinue={() => {
            setShowPlaintextWarning(false);
          }}
        />
      )}
    </>
  );
};
```

### Complete ImportPrivateKeyForm Component

```typescript
// src/tab/components/PrivateKeyImport/ImportPrivateKeyForm.tsx

import React, { useState, useEffect } from 'react';
import FileUploadArea from '../shared/FileUploadArea';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType } from '../../../shared/types';
import { readTextFile, parseImportFile } from '../../utils/fileUpload';
import { validateWIFFormat, validateWIFNetwork } from '../../utils/wifValidation';

interface ImportPrivateKeyFormProps {
  onImport: (wif: string, accountName: string, walletPassword?: string) => Promise<void>;
  onBack?: () => void;
  isInitialSetup?: boolean;
}

export const ImportPrivateKeyForm: React.FC<ImportPrivateKeyFormProps> = ({
  onImport,
  onBack,
  isInitialSetup = false
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Method selection
  const [method, setMethod] = useState<'upload' | 'manual'>('manual');

  // File upload
  const [file, setFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState('');
  const [showFilePassword, setShowFilePassword] = useState(false);

  // Manual entry
  const [wifInput, setWifInput] = useState('');

  // Validated WIF
  const [wif, setWif] = useState<string | null>(null);
  const [validation, setValidation] = useState<any>({
    valid: false,
    error: null
  });

  // Account creation
  const [accountName, setAccountName] = useState('Imported Account 1');

  // Wallet setup (initial setup only)
  const [walletPassword, setWalletPassword] = useState('');
  const [confirmWalletPassword, setConfirmWalletPassword] = useState('');

  // UI state
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload handler
  const handleFileSelect = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setError(null);

      const result = await readTextFile(selectedFile);
      const parsed = parseImportFile(result.content);

      if (parsed.encrypted) {
        // Show password field
        setShowFilePassword(true);
      } else {
        // Validate WIF immediately
        if (parsed.wif) {
          await validateWIF(parsed.wif);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setFile(null);
    }
  };

  // WIF validation
  const validateWIF = async (wifToValidate: string) => {
    // Client-side validation
    const formatError = validateWIFFormat(wifToValidate);
    if (formatError) {
      setValidation({ valid: false, error: formatError });
      return;
    }

    const networkError = validateWIFNetwork(wifToValidate);
    if (networkError) {
      setValidation({ valid: false, error: networkError });
      return;
    }

    // Backend validation
    try {
      const response = await sendMessage<any>(
        MessageType.VALIDATE_WIF,
        { wif: wifToValidate }
      );

      if (response.success && response.data) {
        setValidation(response.data);
        setWif(wifToValidate);
      } else {
        setValidation({
          valid: false,
          error: response.error || 'Invalid private key'
        });
        setWif(null);
      }
    } catch (err) {
      setValidation({
        valid: false,
        error: 'Validation failed'
      });
      setWif(null);
    }
  };

  // Real-time WIF validation on manual entry
  useEffect(() => {
    const timer = setTimeout(() => {
      if (method === 'manual' && wifInput.length > 40) {
        validateWIF(wifInput);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [wifInput, method]);

  // Form validation
  const canSubmit = () => {
    if (!validation.valid || !wif) return false;
    if (!accountName.trim()) return false;
    if (isInitialSetup) {
      return (
        walletPassword.length >= 8 &&
        walletPassword === confirmWalletPassword
      );
    }
    return true;
  };

  // Handle import
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit()) return;

    setIsImporting(true);
    setError(null);

    try {
      await onImport(
        wif!,
        accountName.trim(),
        isInitialSetup ? walletPassword : undefined
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <form onSubmit={handleImport} className="space-y-6">
      {/* Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Choose Method
        </label>
        <div className="flex gap-4">
          <label className="flex-1 flex items-center gap-3 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
            <input
              type="radio"
              name="method"
              value="upload"
              checked={method === 'upload'}
              onChange={() => setMethod('upload')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-300">Upload File</span>
          </label>

          <label className="flex-1 flex items-center gap-3 p-4 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600">
            <input
              type="radio"
              name="method"
              value="manual"
              checked={method === 'manual'}
              onChange={() => setMethod('manual')}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-300">Enter WIF Manually</span>
          </label>
        </div>
      </div>

      {/* File Upload */}
      {method === 'upload' && (
        <FileUploadArea
          onFileSelect={handleFileSelect}
          selectedFile={file}
          accept=".txt"
        />
      )}

      {/* Manual Entry */}
      {method === 'manual' && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Private Key (WIF Format)
          </label>
          <textarea
            value={wifInput}
            onChange={(e) => setWifInput(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm resize-none"
            placeholder="Paste your WIF private key here (starts with 9, c, K, or L)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Testnet keys start with '9' or 'c'
          </p>
        </div>
      )}

      {/* Validation Preview */}
      {validation.valid && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-300 mt-0.5" /* Info icon */ />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold text-blue-300">Preview</p>
              <div className="space-y-1 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Network:</span>
                  <span className="font-mono">{validation.network}</span>
                  <svg className="w-4 h-4 text-green-400" /* Check icon */ />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">First Address:</span>
                  <span className="font-mono text-xs">{validation.firstAddress}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Address Type:</span>
                  <span>{validation.addressType}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation Error */}
      {validation.error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-sm text-red-300">
          {validation.error}
        </div>
      )}

      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Account Name
        </label>
        <input
          type="text"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
          placeholder="My Imported Account"
        />
      </div>

      {/* Wallet Password (Initial Setup Only) */}
      {isInitialSetup && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Create Wallet Password
            </label>
            <input
              type="password"
              value={walletPassword}
              onChange={(e) => setWalletPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
              placeholder="Enter wallet password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmWalletPassword}
              onChange={(e) => setConfirmWalletPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300"
              placeholder="Confirm password"
            />
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg font-semibold text-gray-300"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!canSubmit() || isImporting}
          className={`
            flex-1 px-6 py-3 rounded-lg font-semibold transition-all
            ${canSubmit() && !isImporting
              ? 'bg-bitcoin hover:bg-bitcoin-hover text-white'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
            }
          `}
        >
          {isImporting ? 'Importing...' : 'Import Account'}
        </button>
      </div>
    </form>
  );
};
```

---

## Conclusion

This frontend implementation plan provides:

✅ **Complete component architecture** with clear hierarchy
✅ **Detailed state management** strategy
✅ **TypeScript interfaces** for type safety
✅ **Message passing patterns** for backend communication
✅ **PDF generation** with QR code support
✅ **File upload/download** implementations
✅ **Form validation** with real-time feedback
✅ **Integration points** for Settings, WalletSetup, and Sidebar
✅ **Testing strategy** with unit and integration tests
✅ **3-week timeline** with phase-by-phase breakdown
✅ **Code examples** for critical components

**Next Steps:**
1. Review plan with product and security teams
2. Set up development environment
3. Install dependencies (jsPDF, qrcode)
4. Begin Phase 1: Shared components
5. Follow timeline through to completion

**Success Criteria:**
- All 10 components implemented and tested
- Export flow working end-to-end (file + PDF)
- Import flow working end-to-end (setup + existing wallet)
- All integration points complete
- All tests passing (>80% coverage)
- Manual testing complete on testnet
- Security expert review approved

---

**Document Status**: Implementation Ready ✅
**Last Updated**: 2025-10-19
**Maintained By**: Frontend Development Team
