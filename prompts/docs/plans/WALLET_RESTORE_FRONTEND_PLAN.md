# Wallet Restore from Private Key - Frontend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-22
**Target Release**: v0.11.0
**Status**: Implementation Ready
**Document Type**: Frontend Technical Implementation Guide

---

## Executive Summary

This document provides a complete, implementation-ready frontend plan for importing a wallet from a private key backup (WIF format) during initial wallet setup. This addresses the critical recovery gap where users who exported their private keys cannot restore their wallet without a seed phrase.

**Frontend Scope**:
1. New tab in WalletSetup: "Import Private Key"
2. Input method selector (Upload File / Paste WIF)
3. Address type selection with 3 radio cards
4. Password field organization (file password + wallet password)
5. Privacy warning system (3 touchpoints)
6. Comprehensive error handling
7. Success animation and account summary
8. Full accessibility (WCAG AA)

**Key Design Decisions** (from UI/UX Designer):
- ✅ Third tab layout (equal weight with Create and Import Seed)
- ✅ Address type selection REQUIRED (user must choose)
- ✅ Progressive disclosure (show complexity only when needed)
- ✅ Segmented control for Upload/Paste (not nested tabs)
- ✅ Mandatory privacy acknowledgment before import

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Component Hierarchy](#2-component-hierarchy)
3. [State Management](#3-state-management)
4. [WalletSetup.tsx Modifications](#4-walletsetuptsx-modifications)
5. [Component 1: ImportMethodSelector](#5-component-1-importmethodselector)
6. [Component 2: FileUploadZone](#6-component-2-fileuploadzone)
7. [Component 3: WIFTextarea](#7-component-3-wiftextarea)
8. [Component 4: AddressTypeSelector](#8-component-4-addresstypeselector)
9. [Component 5: AddressPreviewCard](#9-component-5-addresspreviewcard)
10. [Component 6: PasswordFieldGroup](#10-component-6-passwordfieldgroup)
11. [Component 7: PrivacyWarningBanner](#11-component-7-privacywarningbanner)
12. [Component 8: PrivacyAcknowledgment](#12-component-8-privacyacknowledgment)
13. [Validation Logic](#13-validation-logic)
14. [Message Passing](#14-message-passing)
15. [Error Handling](#15-error-handling)
16. [Success Flow](#16-success-flow)
17. [Accessibility](#17-accessibility)
18. [Testing Strategy](#18-testing-strategy)
19. [Implementation Phases](#19-implementation-phases)

---

## 1. Architecture Overview

### 1.1 Current WalletSetup Structure

**Existing tabs:**
- Create New
- Import Existing (Seed Phrase)

**New tab to add:**
- Import Private Key

### 1.2 Tab State Management

```typescript
type SetupTab = 'create' | 'import' | 'import-key';  // Add 'import-key'
```

### 1.3 Component Flow

```
User opens WalletSetup
      ↓
Selects "Import Private Key" tab
      ↓
Chooses input method (File or Paste)
      ↓
Provides WIF (upload file or paste)
      ↓
[If encrypted] Enters file password
      ↓
System validates WIF and shows address previews
      ↓
User selects address type
      ↓
User sets wallet password
      ↓
User acknowledges privacy warning
      ↓
User clicks "Import Wallet"
      ↓
Loading state → Success screen
      ↓
Redirect to unlock screen
```

---

## 2. Component Hierarchy

```
WalletSetup.tsx (modified)
├── Tab: "Create New Wallet"
├── Tab: "Import Seed Phrase"
└── Tab: "Import Private Key" (NEW)
    ├── ImportMethodSelector
    │   └── SegmentedControl
    ├── FileUploadZone (conditional: if method === 'file')
    │   ├── DragDropArea
    │   ├── FileInput
    │   └── FilePreview
    ├── WIFTextarea (conditional: if method === 'paste')
    │   ├── ValidationFeedback
    │   └── NetworkBadge
    ├── FilePasswordField (conditional: if encrypted)
    │   └── ShowHideToggle
    ├── AddressTypeSelector (conditional: if WIF valid)
    │   ├── AddressPreviewCard × 3 (or 1 for uncompressed)
    │   └── HelpAccordion
    ├── PasswordFieldGroup (conditional: if address type selected)
    │   ├── WalletPasswordField
    │   ├── PasswordStrengthMeter
    │   └── ConfirmPasswordField
    ├── AccountNameField
    ├── PrivacyWarningBanner (info)
    ├── PrivacyAcknowledgment (mandatory checkbox)
    ├── ErrorBanner
    └── ImportButton
```

---

## 3. State Management

### 3.1 State Structure

```typescript
// Add to WalletSetup component state
interface ImportPrivateKeyState {
  // Input method
  inputMethod: 'file' | 'paste';

  // File upload
  selectedFile: File | null;
  fileContent: string | null;
  fileError: string | null;

  // Paste WIF
  pastedWIF: string;

  // WIF detection
  isEncrypted: boolean;
  detectedNetwork: 'testnet' | 'mainnet' | null;
  detectedCompression: boolean | null;

  // Address type
  selectedAddressType: AddressType | null;
  previewAddresses: {
    legacy: string | null;
    segwit: string | null;
    nativeSegwit: string | null;
  };
  availableAddressTypes: AddressType[];

  // Passwords
  filePassword: string;
  filePasswordVisible: boolean;
  walletPassword: string;
  walletPasswordVisible: boolean;
  confirmPassword: string;
  confirmPasswordVisible: boolean;

  // Account
  accountName: string;

  // UI state
  isValidating: boolean;
  isImporting: boolean;
  validationError: string | null;
  importError: string | null;

  // Privacy
  privacyNoticeDismissed: boolean;
  privacyAcknowledged: boolean;
}
```

### 3.2 State Initialization

```typescript
const [importState, setImportState] = useState<ImportPrivateKeyState>({
  inputMethod: 'paste',
  selectedFile: null,
  fileContent: null,
  fileError: null,
  pastedWIF: '',
  isEncrypted: false,
  detectedNetwork: null,
  detectedCompression: null,
  selectedAddressType: null,
  previewAddresses: {
    legacy: null,
    segwit: null,
    nativeSegwit: null,
  },
  availableAddressTypes: [],
  filePassword: '',
  filePasswordVisible: false,
  walletPassword: '',
  walletPasswordVisible: false,
  confirmPassword: '',
  confirmPasswordVisible: false,
  accountName: 'Imported Account',
  isValidating: false,
  isImporting: false,
  validationError: null,
  importError: null,
  privacyNoticeDismissed: false,
  privacyAcknowledged: false,
});
```

### 3.3 State Update Helpers

```typescript
// Helper to update import state
const updateImportState = (updates: Partial<ImportPrivateKeyState>) => {
  setImportState(prev => ({ ...prev, ...updates }));
};

// Reset import state when switching tabs
const resetImportState = () => {
  setImportState({
    inputMethod: 'paste',
    selectedFile: null,
    fileContent: null,
    fileError: null,
    pastedWIF: '',
    isEncrypted: false,
    detectedNetwork: null,
    detectedCompression: null,
    selectedAddressType: null,
    previewAddresses: { legacy: null, segwit: null, nativeSegwit: null },
    availableAddressTypes: [],
    filePassword: '',
    filePasswordVisible: false,
    walletPassword: '',
    walletPasswordVisible: false,
    confirmPassword: '',
    confirmPasswordVisible: false,
    accountName: 'Imported Account',
    isValidating: false,
    isImporting: false,
    validationError: null,
    importError: null,
    privacyNoticeDismissed: false,
    privacyAcknowledged: false,
  });
};
```

---

## 4. WalletSetup.tsx Modifications

### 4.1 Add Third Tab

**Modify tab definition:**

```typescript
type SetupTab = 'create' | 'import' | 'import-key';
```

**Add tab button:**

```tsx
{/* Tab Navigation - Update to 3 tabs */}
<div className="flex border-b border-gray-800 mb-6">
  <button
    onClick={() => {
      setActiveTab('create');
      setError(null);
      resetImportState();
    }}
    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
      activeTab === 'create'
        ? 'text-bitcoin border-b-2 border-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Create New
  </button>
  <button
    onClick={() => {
      setActiveTab('import');
      setError(null);
      resetImportState();
    }}
    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
      activeTab === 'import'
        ? 'text-bitcoin border-b-2 border-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Import Seed
  </button>
  <button
    onClick={() => {
      setActiveTab('import-key');
      setError(null);
      setPasswordError('');
      setMnemonicError('');
    }}
    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
      activeTab === 'import-key'
        ? 'text-bitcoin border-b-2 border-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Import Private Key
  </button>
</div>
```

### 4.2 Add Tab Content

**Add after Import Wallet Form:**

```tsx
{/* Import Private Key Form */}
{activeTab === 'import-key' && (
  <ImportPrivateKeyTab
    importState={importState}
    updateImportState={updateImportState}
    onImportComplete={onSetupComplete}
  />
)}
```

---

## 5. Component 1: ImportMethodSelector

### 5.1 Component File

**Create:** `src/tab/components/WalletSetup/ImportMethodSelector.tsx`

### 5.2 Interface

```typescript
interface ImportMethodSelectorProps {
  value: 'file' | 'paste';
  onChange: (method: 'file' | 'paste') => void;
  disabled?: boolean;
}
```

### 5.3 Implementation

```tsx
import React from 'react';

const ImportMethodSelector: React.FC<ImportMethodSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Input Method
      </label>

      {/* Segmented Control */}
      <div className="inline-flex bg-gray-900 border border-gray-700 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onChange('file')}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${value === 'file'
              ? 'bg-bitcoin text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Upload File
        </button>
        <button
          type="button"
          onClick={() => onChange('paste')}
          disabled={disabled}
          className={`
            px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
            ${value === 'paste'
              ? 'bg-bitcoin text-white shadow-lg'
              : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          Paste WIF
        </button>
      </div>
    </div>
  );
};

export default ImportMethodSelector;
```

### 5.4 Usage

```tsx
<ImportMethodSelector
  value={importState.inputMethod}
  onChange={(method) => updateImportState({ inputMethod: method })}
  disabled={importState.isImporting}
/>
```

---

## 6. Component 2: FileUploadZone

### 6.1 Component File

**Create:** `src/tab/components/WalletSetup/FileUploadZone.tsx`

### 6.2 Interface

```typescript
interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  error: string | null;
  disabled?: boolean;
}
```

### 6.3 Implementation

```tsx
import React, { useRef, useState } from 'react';

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFile,
  error,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !selectedFile) {
      fileInputRef.current?.click();
    }
  };

  if (selectedFile) {
    return (
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Selected File
        </label>
        <div className="bg-gray-850 border border-gray-700 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                <p className="text-xs text-gray-400">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onFileRemove}
              disabled={disabled}
              className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Upload Private Key File
      </label>

      {/* Drag-Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
          ${isDragOver
            ? 'border-bitcoin bg-bitcoin/10'
            : error
            ? 'border-red-500 bg-red-500/5'
            : 'border-gray-700 bg-gray-900'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-600'}
        `}
      >
        <svg
          className={`mx-auto w-12 h-12 mb-3 ${
            error ? 'text-red-400' : 'text-gray-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-gray-300 mb-1">
          Drop file here or click to browse
        </p>
        <p className="text-xs text-gray-500">
          Supports .txt files
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,text/plain"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
};

export default FileUploadZone;
```

### 6.4 File Reading Logic

```typescript
const handleFileSelect = async (file: File) => {
  updateImportState({ selectedFile: file, fileError: null });

  // Validate file size (max 100KB)
  const MAX_SIZE = 100 * 1024; // 100KB
  if (file.size > MAX_SIZE) {
    updateImportState({
      fileError: 'File size exceeds 100KB limit',
      selectedFile: null,
    });
    return;
  }

  try {
    // Read file content
    const text = await file.text();

    // Detect encryption
    const isEncrypted = text.includes('Encrypted Private Key:') ||
                       text.includes('Bitcoin Account Private Key (Encrypted)');

    if (isEncrypted) {
      // Extract encrypted data
      const match = text.match(/Encrypted Private Key:\s*([^\n]+)/);
      const encryptedWIF = match ? match[1].trim() : '';

      updateImportState({
        fileContent: text,
        pastedWIF: encryptedWIF,
        isEncrypted: true,
      });
    } else {
      // Extract plaintext WIF
      const wifMatch = text.match(/Private Key \(WIF\):\s*([^\n]+)/);
      const wif = wifMatch ? wifMatch[1].trim() : text.trim();

      updateImportState({
        fileContent: text,
        pastedWIF: wif,
        isEncrypted: false,
      });

      // Validate WIF immediately
      await validateWIF(wif);
    }
  } catch (error) {
    updateImportState({
      fileError: error instanceof Error ? error.message : 'Failed to read file',
      selectedFile: null,
    });
  }
};
```

---

## 7. Component 3: WIFTextarea

### 7.1 Component File

**Create:** `src/tab/components/WalletSetup/WIFTextarea.tsx`

### 7.2 Interface

```typescript
interface WIFTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onValidate: (wif: string) => Promise<void>;
  validation: {
    isValidating: boolean;
    valid: boolean;
    network?: 'testnet' | 'mainnet';
    compressed?: boolean;
    error?: string;
  } | null;
  disabled?: boolean;
}
```

### 7.3 Implementation

```tsx
import React, { useEffect, useRef } from 'react';

const WIFTextarea: React.FC<WIFTextareaProps> = ({
  value,
  onChange,
  onValidate,
  validation,
  disabled = false,
}) => {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debounced validation (300ms after typing stops)
    if (value.trim().length > 0) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        onValidate(value.trim());
      }, 300);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, onValidate]);

  const getBorderColor = () => {
    if (!value.trim()) return 'border-gray-700';
    if (validation?.isValidating) return 'border-bitcoin/50';
    if (validation?.valid) return 'border-green-500';
    if (validation?.error) return 'border-red-500';
    return 'border-gray-700';
  };

  return (
    <div className="mb-6">
      <label
        htmlFor="wif-input"
        className="block text-sm font-medium text-gray-300 mb-2"
      >
        Paste WIF Private Key
      </label>

      <textarea
        id="wif-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        disabled={disabled}
        placeholder="cT1Y2Y... (paste your WIF key here)"
        className={`
          w-full px-4 py-3 bg-gray-900 text-white placeholder:text-gray-500
          rounded-lg font-mono text-sm resize-y transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-bitcoin/30
          disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed
          ${getBorderColor()}
        `}
        aria-describedby={validation?.error ? 'wif-error' : 'wif-help'}
        aria-invalid={validation?.error ? 'true' : 'false'}
      />

      {/* Help Text */}
      {!value.trim() && (
        <p id="wif-help" className="text-xs text-gray-500 mt-2">
          Enter your WIF private key (starts with 'c' or '9' for testnet)
        </p>
      )}

      {/* Validation Feedback */}
      {value.trim() && (
        <div className="mt-2">
          {validation?.isValidating && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Validating...</span>
            </div>
          )}

          {validation?.valid && (
            <div className="flex items-start gap-2 text-sm text-green-400">
              <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">Valid WIF detected</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Network: {validation.network} • Compression: {validation.compressed ? 'Compressed' : 'Uncompressed'}
                </p>
              </div>
            </div>
          )}

          {validation?.error && (
            <div id="wif-error" role="alert" className="flex items-start gap-2 text-sm text-red-400">
              <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium">{validation.error}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Verify you copied the entire key
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WIFTextarea;
```

### 7.4 Validation Handler

```typescript
const validateWIF = async (wif: string) => {
  updateImportState({ isValidating: true, validationError: null });

  try {
    const response = await sendMessage<{
      valid: boolean;
      network?: 'testnet' | 'mainnet';
      compressed?: boolean;
      availableAddressTypes?: AddressType[];
      error?: string;
    }>(MessageType.VALIDATE_WIF, { wif });

    if (response.valid) {
      updateImportState({
        isValidating: false,
        detectedNetwork: response.network || null,
        detectedCompression: response.compressed || null,
        availableAddressTypes: response.availableAddressTypes || [],
      });

      // Generate address previews
      if (response.availableAddressTypes) {
        await generateAddressPreviews(wif, response.availableAddressTypes);
      }
    } else {
      updateImportState({
        isValidating: false,
        validationError: response.error || 'Invalid WIF format',
      });
    }
  } catch (error) {
    updateImportState({
      isValidating: false,
      validationError: error instanceof Error ? error.message : 'Validation failed',
    });
  }
};
```

---

## 8. Component 4: AddressTypeSelector

### 8.1 Component File

**Create:** `src/tab/components/WalletSetup/AddressTypeSelector.tsx`

### 8.2 Interface

```typescript
interface AddressTypeSelectorProps {
  availableTypes: AddressType[];
  selectedType: AddressType | null;
  onSelect: (type: AddressType) => void;
  addresses: {
    legacy: string | null;
    segwit: string | null;
    nativeSegwit: string | null;
  };
  isUncompressed: boolean;
  disabled?: boolean;
}
```

### 8.3 Implementation

```tsx
import React, { useState } from 'react';
import AddressPreviewCard from './AddressPreviewCard';

const AddressTypeSelector: React.FC<AddressTypeSelectorProps> = ({
  availableTypes,
  selectedType,
  onSelect,
  addresses,
  isUncompressed,
  disabled = false,
}) => {
  const [helpExpanded, setHelpExpanded] = useState(false);

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Address Type
      </label>

      {/* Warning for Uncompressed Keys */}
      {isUncompressed && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-200">
                Uncompressed Private Key Detected
              </p>
              <p className="text-xs text-yellow-300 mt-1">
                This key can only be used with Legacy (P2PKH) addresses. SegWit addresses require compressed keys.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-sm text-gray-400 mb-4">
        Select the address type you originally used. Check your backup or transaction history.
      </p>

      {/* Address Type Cards */}
      <div className="space-y-3 mb-4">
        <AddressPreviewCard
          type="legacy"
          label="Legacy"
          technicalName="P2PKH"
          address={addresses.legacy || ''}
          prefix="m or n (testnet)"
          selected={selectedType === 'legacy'}
          disabled={!availableTypes.includes('legacy') || disabled}
          onSelect={() => onSelect('legacy')}
        />

        <AddressPreviewCard
          type="segwit"
          label="SegWit"
          technicalName="P2SH-P2WPKH"
          address={addresses.segwit || ''}
          prefix="2 (testnet)"
          selected={selectedType === 'segwit'}
          disabled={!availableTypes.includes('segwit') || disabled}
          onSelect={() => onSelect('segwit')}
          disabledReason={!availableTypes.includes('segwit') ? 'Requires compressed key' : undefined}
        />

        <AddressPreviewCard
          type="native-segwit"
          label="Native SegWit"
          technicalName="P2WPKH"
          address={addresses.nativeSegwit || ''}
          prefix="tb1 (testnet)"
          recommended
          selected={selectedType === 'native-segwit'}
          disabled={!availableTypes.includes('native-segwit') || disabled}
          onSelect={() => onSelect('native-segwit')}
          disabledReason={!availableTypes.includes('native-segwit') ? 'Requires compressed key' : undefined}
        />
      </div>

      {/* Help Accordion */}
      <button
        type="button"
        onClick={() => setHelpExpanded(!helpExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-left hover:bg-gray-850 transition-colors"
      >
        <span className="text-sm text-gray-300">
          Not sure which address type you used?
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            helpExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Help Content */}
      {helpExpanded && (
        <div className="mt-3 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-sm text-gray-300 space-y-3">
          <div>
            <p className="font-medium text-white mb-1">1. Check Your Backup File</p>
            <p className="text-xs text-gray-400">
              Look for the first address in your backup and compare the format to the previews above.
            </p>
          </div>

          <div>
            <p className="font-medium text-white mb-1">2. Check Your Transaction History</p>
            <p className="text-xs text-gray-400">
              Find a transaction on a block explorer and look at the address format you used.
            </p>
          </div>

          <div>
            <p className="font-medium text-white mb-1">3. Address Format Examples</p>
            <ul className="text-xs text-gray-400 list-disc list-inside space-y-1">
              <li>Legacy: Starts with "m" or "n" (testnet)</li>
              <li>SegWit: Starts with "2" (testnet)</li>
              <li>Native SegWit: Starts with "tb1" (testnet)</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-white mb-1">4. If Still Unsure</p>
            <p className="text-xs text-gray-400">
              Try Native SegWit first (most common). If balance shows 0, try another type. You can always re-import with a different address type.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddressTypeSelector;
```

---

## 9. Component 5: AddressPreviewCard

### 9.1 Component File

**Create:** `src/tab/components/WalletSetup/AddressPreviewCard.tsx`

### 9.2 Interface

```typescript
interface AddressPreviewCardProps {
  type: AddressType;
  label: string;
  technicalName: string;
  address: string;
  prefix: string;
  recommended?: boolean;
  selected: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onSelect: () => void;
}
```

### 9.3 Implementation

```tsx
import React from 'react';
import { AddressType } from '../../../shared/types';

const AddressPreviewCard: React.FC<AddressPreviewCardProps> = ({
  type,
  label,
  technicalName,
  address,
  prefix,
  recommended = false,
  selected,
  disabled = false,
  disabledReason,
  onSelect,
}) => {
  return (
    <div
      onClick={disabled ? undefined : onSelect}
      className={`
        relative border-2 rounded-xl p-4 transition-all duration-200
        ${selected
          ? 'border-bitcoin bg-bitcoin/5'
          : 'border-gray-700 bg-gray-900'
        }
        ${disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer hover:border-gray-600 hover:bg-gray-850'
        }
      `}
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      aria-labelledby={`${type}-label`}
      tabIndex={disabled ? -1 : 0}
    >
      {/* Radio Button + Content */}
      <div className="flex items-start gap-3">
        {/* Radio */}
        <div
          className={`
            mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
            ${selected ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'}
          `}
        >
          {selected && (
            <div className="w-2.5 h-2.5 bg-white rounded-full" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Label + Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span id={`${type}-label`} className="text-sm font-semibold text-white">
              {label}
            </span>
            {recommended && (
              <span className="px-2 py-0.5 bg-bitcoin/20 text-bitcoin text-xs font-medium rounded">
                Recommended
              </span>
            )}
          </div>

          {/* Technical Name */}
          <div className="text-xs text-gray-400 mb-2">
            {technicalName}
          </div>

          {/* Address Preview */}
          {address && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 mb-2">
              <div className="text-xs text-gray-500 mb-1">First address:</div>
              <div className="font-mono text-xs text-white break-all">
                {address}
              </div>
            </div>
          )}

          {/* Prefix Hint */}
          <div className="text-xs text-gray-400">
            Starts with: <span className="font-mono text-gray-300">{prefix}</span>
          </div>

          {/* Disabled Reason */}
          {disabled && disabledReason && (
            <div className="text-xs text-red-400 mt-2">
              {disabledReason}
            </div>
          )}
        </div>
      </div>

      {/* Checkmark Icon (Selected State) */}
      {selected && (
        <div className="absolute top-3 right-3">
          <svg className="w-5 h-5 text-bitcoin" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default AddressPreviewCard;
```

---

## 10. Component 6: PasswordFieldGroup

### 10.1 Component File

**Create:** `src/tab/components/WalletSetup/PasswordFieldGroup.tsx`

### 10.2 Interface

```typescript
interface PasswordFieldGroupProps {
  // File password (for encrypted WIF)
  showFilePassword: boolean;
  filePassword: string;
  filePasswordVisible: boolean;
  onFilePasswordChange: (password: string) => void;
  onFilePasswordVisibilityToggle: () => void;

  // Wallet password
  walletPassword: string;
  walletPasswordVisible: boolean;
  onWalletPasswordChange: (password: string) => void;
  onWalletPasswordVisibilityToggle: () => void;

  // Confirm password
  confirmPassword: string;
  confirmPasswordVisible: boolean;
  onConfirmPasswordChange: (password: string) => void;
  onConfirmPasswordVisibilityToggle: () => void;

  // Validation
  passwordError: string | null;
  passwordStrength: 'weak' | 'medium' | 'strong' | null;

  disabled?: boolean;
}
```

### 10.3 Implementation

```tsx
import React from 'react';
import PasswordStrengthMeter from './PasswordStrengthMeter';

const PasswordFieldGroup: React.FC<PasswordFieldGroupProps> = ({
  showFilePassword,
  filePassword,
  filePasswordVisible,
  onFilePasswordChange,
  onFilePasswordVisibilityToggle,
  walletPassword,
  walletPasswordVisible,
  onWalletPasswordChange,
  onWalletPasswordVisibilityToggle,
  confirmPassword,
  confirmPasswordVisible,
  onConfirmPasswordChange,
  onConfirmPasswordVisibilityToggle,
  passwordError,
  passwordStrength,
  disabled = false,
}) => {
  return (
    <div className="space-y-6">
      {/* File Password Section (Conditional) */}
      {showFilePassword && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-semibold text-white">Step 1: Decrypt Your Backup</h3>
          </div>

          <label htmlFor="file-password" className="block text-sm font-medium text-gray-300 mb-2">
            File Password
          </label>
          <div className="relative">
            <input
              id="file-password"
              type={filePasswordVisible ? 'text' : 'password'}
              value={filePassword}
              onChange={(e) => onFilePasswordChange(e.target.value)}
              disabled={disabled}
              placeholder="Enter file password"
              className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={onFilePasswordVisibilityToggle}
              disabled={disabled}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={filePasswordVisible ? 'Hide password' : 'Show password'}
            >
              {filePasswordVisible ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Enter the password used when exporting this key
          </p>
        </div>
      )}

      {/* Wallet Password Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-bitcoin" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
          </svg>
          <h3 className="text-sm font-semibold text-white">
            {showFilePassword ? 'Step 2: Secure Your New Wallet' : 'Set Wallet Password'}
          </h3>
        </div>

        <label htmlFor="wallet-password" className="block text-sm font-medium text-gray-300 mb-2">
          New Wallet Password
        </label>
        <div className="relative mb-2">
          <input
            id="wallet-password"
            type={walletPasswordVisible ? 'text' : 'password'}
            value={walletPassword}
            onChange={(e) => onWalletPasswordChange(e.target.value)}
            disabled={disabled}
            placeholder="Enter strong password"
            className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={onWalletPasswordVisibilityToggle}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={walletPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {walletPasswordVisible ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          You'll use this to unlock your wallet
        </p>

        {/* Password Strength Meter */}
        {walletPassword && (
          <PasswordStrengthMeter password={walletPassword} />
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
          Confirm Wallet Password
        </label>
        <div className="relative mb-2">
          <input
            id="confirm-password"
            type={confirmPasswordVisible ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            disabled={disabled}
            placeholder="Confirm password"
            className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={onConfirmPasswordVisibilityToggle}
            disabled={disabled}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={confirmPasswordVisible ? 'Hide password' : 'Show password'}
          >
            {confirmPasswordVisible ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Password Match Validation */}
        {confirmPassword && walletPassword && (
          <div className="text-xs mt-1">
            {confirmPassword === walletPassword ? (
              <span className="text-green-400">✓ Passwords match</span>
            ) : (
              <span className="text-red-400">✗ Passwords do not match</span>
            )}
          </div>
        )}

        {/* Password Error */}
        {passwordError && (
          <p className="text-xs text-red-400 mt-1">{passwordError}</p>
        )}
      </div>
    </div>
  );
};

export default PasswordFieldGroup;
```

### 10.4 Password Strength Meter

**Create:** `src/tab/components/WalletSetup/PasswordStrengthMeter.tsx`

```tsx
import React from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

const calculatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return 'weak';
  if (score <= 4) return 'medium';
  return 'strong';
};

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const strength = calculatePasswordStrength(password);

  const strengthConfig = {
    weak: { color: 'bg-red-500', text: 'text-red-400', label: 'Weak', percentage: 33 },
    medium: { color: 'bg-yellow-500', text: 'text-yellow-400', label: 'Medium', percentage: 66 },
    strong: { color: 'bg-green-500', text: 'text-green-400', label: 'Strong ✓', percentage: 100 },
  };

  const config = strengthConfig[strength];

  // Password requirements
  const requirements = [
    { met: password.length >= 8, label: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
    { met: /[a-z]/.test(password), label: 'One lowercase letter' },
    { met: /[0-9]/.test(password), label: 'One number' },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        {/* Progress Bar */}
        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${config.color}`}
            style={{ width: `${config.percentage}%` }}
          />
        </div>

        {/* Label */}
        <span className={`text-sm font-medium ${config.text}`}>
          {config.label}
        </span>
      </div>

      {/* Requirements */}
      {strength !== 'strong' && (
        <ul className="text-xs text-gray-500 space-y-1">
          {requirements.map((req, index) => (
            <li key={index} className={req.met ? 'text-green-400' : ''}>
              {req.met ? '✓' : '○'} {req.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PasswordStrengthMeter;
```

---

## 11. Component 7: PrivacyWarningBanner

### 11.1 Component File

**Create:** `src/tab/components/WalletSetup/PrivacyWarningBanner.tsx`

### 11.2 Interface

```typescript
interface PrivacyWarningBannerProps {
  onDismiss: () => void;
  onLearnMore: () => void;
  dismissed: boolean;
}
```

### 11.3 Implementation

```tsx
import React from 'react';

const PrivacyWarningBanner: React.FC<PrivacyWarningBannerProps> = ({
  onDismiss,
  onLearnMore,
  dismissed,
}) => {
  if (dismissed) return null;

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-200 mb-1">Privacy Notice</p>
          <p className="text-sm text-blue-300">
            Wallets imported from private keys use a single address for all transactions, which may reduce privacy compared to HD wallets with seed phrases.
          </p>
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={onLearnMore}
              className="text-sm text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              Learn More
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyWarningBanner;
```

---

## 12. Component 8: PrivacyAcknowledgment

### 12.1 Component File

**Create:** `src/tab/components/WalletSetup/PrivacyAcknowledgment.tsx`

### 12.2 Interface

```typescript
interface PrivacyAcknowledgmentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onCreateSeedWallet: () => void;
  disabled?: boolean;
}
```

### 12.3 Implementation

```tsx
import React from 'react';

const PrivacyAcknowledgment: React.FC<PrivacyAcknowledgmentProps> = ({
  checked,
  onChange,
  onCreateSeedWallet,
  disabled = false,
}) => {
  return (
    <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <svg className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <div>
          <h3 className="text-base font-semibold text-yellow-100 mb-2">Privacy Warning</h3>
          <p className="text-sm text-yellow-200 mb-3">
            This wallet will reuse the same address for all transactions. This means:
          </p>
          <ul className="text-sm text-yellow-200 space-y-1.5 mb-4">
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>All transactions are publicly linked</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>Your balance is visible to anyone</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>Privacy is significantly reduced</span>
            </li>
          </ul>
          <p className="text-sm text-yellow-200">
            For better privacy, consider creating a wallet with a seed phrase instead.
          </p>
        </div>
      </div>

      {/* Acknowledgment Checkbox */}
      <label className="flex items-start gap-3 mb-4 cursor-pointer group">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="mt-1 w-4 h-4 bg-gray-900 border-yellow-500 checked:bg-yellow-500 checked:border-yellow-500 rounded focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-850 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span className="text-sm text-yellow-100 group-hover:text-white transition-colors">
          I understand the privacy implications and want to continue with this import
        </span>
      </label>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCreateSeedWallet}
          disabled={disabled}
          className="flex-1 px-4 py-2 border-2 border-bitcoin text-bitcoin rounded-lg font-semibold hover:bg-bitcoin/10 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
        >
          Create Seed Phrase Wallet
        </button>
        <button
          type="button"
          onClick={() => {/* This will be handled by the import button */}}
          disabled={!checked || disabled}
          className="flex-1 px-4 py-2 bg-bitcoin text-white rounded-lg font-semibold hover:bg-bitcoin-hover active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};

export default PrivacyAcknowledgment;
```

---

## 13. Validation Logic

### 13.1 WIF Validation

```typescript
const validateWIF = async (wif: string) => {
  updateImportState({ isValidating: true, validationError: null });

  try {
    const response = await sendMessage<{
      valid: boolean;
      network?: 'testnet' | 'mainnet';
      compressed?: boolean;
      availableAddressTypes?: AddressType[];
      error?: string;
    }>(MessageType.VALIDATE_WIF, { wif });

    if (response.valid) {
      updateImportState({
        isValidating: false,
        detectedNetwork: response.network || null,
        detectedCompression: response.compressed || null,
        availableAddressTypes: response.availableAddressTypes || [],
      });

      // Generate address previews
      if (response.availableAddressTypes) {
        await generateAddressPreviews(wif, response.availableAddressTypes);
      }
    } else {
      updateImportState({
        isValidating: false,
        validationError: response.error || 'Invalid WIF format',
      });
    }
  } catch (error) {
    updateImportState({
      isValidating: false,
      validationError: error instanceof Error ? error.message : 'Validation failed',
    });
  }
};
```

### 13.2 Address Preview Generation

```typescript
const generateAddressPreviews = async (
  wif: string,
  availableTypes: AddressType[]
) => {
  try {
    const response = await sendMessage<{
      legacy?: string;
      segwit?: string;
      nativeSegwit?: string;
    }>(MessageType.GENERATE_ADDRESS_PREVIEWS, { wif });

    updateImportState({
      previewAddresses: {
        legacy: availableTypes.includes('legacy') ? response.legacy || null : null,
        segwit: availableTypes.includes('segwit') ? response.segwit || null : null,
        nativeSegwit: availableTypes.includes('native-segwit') ? response.nativeSegwit || null : null,
      },
    });
  } catch (error) {
    console.error('Failed to generate address previews:', error);
  }
};
```

### 13.3 Password Validation

```typescript
const validateWalletPassword = (password: string): boolean => {
  if (password.length < 8) {
    updateImportState({ importError: 'Password must be at least 8 characters' });
    return false;
  }
  if (!/[A-Z]/.test(password)) {
    updateImportState({ importError: 'Password must contain at least one uppercase letter' });
    return false;
  }
  if (!/[a-z]/.test(password)) {
    updateImportState({ importError: 'Password must contain at least one lowercase letter' });
    return false;
  }
  if (!/[0-9]/.test(password)) {
    updateImportState({ importError: 'Password must contain at least one number' });
    return false;
  }
  updateImportState({ importError: null });
  return true;
};
```

### 13.4 Form Validation

```typescript
const canImport = (): boolean => {
  // WIF must be valid
  if (!importState.pastedWIF || importState.validationError) return false;

  // If encrypted, file password required
  if (importState.isEncrypted && !importState.filePassword) return false;

  // Address type must be selected
  if (!importState.selectedAddressType) return false;

  // Wallet passwords must be valid and match
  if (!importState.walletPassword || !importState.confirmPassword) return false;
  if (importState.walletPassword !== importState.confirmPassword) return false;

  // Privacy must be acknowledged
  if (!importState.privacyAcknowledged) return false;

  // Not currently importing
  if (importState.isImporting) return false;

  return true;
};
```

---

## 14. Message Passing

### 14.1 Import Wallet Handler

```typescript
const handleImportFromPrivateKey = async () => {
  updateImportState({ importError: null, isImporting: true });

  try {
    let decryptedWIF = importState.pastedWIF;

    // If encrypted, decrypt first
    if (importState.isEncrypted) {
      if (!importState.filePassword) {
        updateImportState({
          importError: 'File password is required',
          isImporting: false,
        });
        return;
      }

      // Decrypt WIF using file password
      const decryptResponse = await sendMessage<{ wif: string }>(
        MessageType.DECRYPT_ENCRYPTED_WIF,
        {
          encryptedWIF: importState.pastedWIF,
          password: importState.filePassword,
        }
      );

      decryptedWIF = decryptResponse.wif;
    }

    // Validate wallet password
    if (!validateWalletPassword(importState.walletPassword)) {
      updateImportState({ isImporting: false });
      return;
    }

    if (importState.walletPassword !== importState.confirmPassword) {
      updateImportState({
        importError: 'Passwords do not match',
        isImporting: false,
      });
      return;
    }

    // Create wallet from private key
    const response = await sendMessage<{
      firstAddress: string;
      addressType: AddressType;
      network: 'testnet' | 'mainnet';
    }>(MessageType.CREATE_WALLET_FROM_PRIVATE_KEY, {
      wif: decryptedWIF,
      addressType: importState.selectedAddressType,
      accountName: importState.accountName,
      password: importState.walletPassword,
    });

    // Success - navigate to unlock screen
    onSetupComplete();

  } catch (error) {
    updateImportState({
      importError: error instanceof Error ? error.message : 'Failed to import wallet',
      isImporting: false,
    });
  }
};
```

### 14.2 Message Types

**Add to `src/shared/types/index.ts`:**

```typescript
export enum MessageType {
  // ... existing types ...
  VALIDATE_WIF = 'VALIDATE_WIF',
  GENERATE_ADDRESS_PREVIEWS = 'GENERATE_ADDRESS_PREVIEWS',
  DECRYPT_ENCRYPTED_WIF = 'DECRYPT_ENCRYPTED_WIF',
  CREATE_WALLET_FROM_PRIVATE_KEY = 'CREATE_WALLET_FROM_PRIVATE_KEY',
}
```

---

## 15. Error Handling

### 15.1 Error Banner Component

**Create:** `src/tab/components/WalletSetup/ErrorBanner.tsx`

```tsx
import React from 'react';

interface ErrorBannerProps {
  error: string;
  onDismiss?: () => void;
  dismissible?: boolean;
}

const ErrorBanner: React.FC<ErrorBannerProps> = ({
  error,
  onDismiss,
  dismissible = true,
}) => {
  return (
    <div className="mb-6 bg-red-500/15 border-l-4 border-red-500 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-200">{error}</p>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-300 transition-colors"
            aria-label="Dismiss error"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBanner;
```

### 15.2 Error Mapping

```typescript
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    // Map backend error codes to user-friendly messages
    const message = error.message;

    if (message.includes('INVALID_WIF')) {
      return 'Invalid WIF format. Please check your private key.';
    }
    if (message.includes('WRONG_NETWORK')) {
      return 'Wrong network: This is a mainnet key, testnet required.';
    }
    if (message.includes('WEAK_PASSWORD')) {
      return 'Password does not meet security requirements.';
    }
    if (message.includes('INCOMPATIBLE_ADDRESS_TYPE')) {
      return 'Address type incompatible with key. Uncompressed keys can only use legacy addresses.';
    }
    if (message.includes('WALLET_ALREADY_EXISTS')) {
      return 'Wallet already exists. Use Settings → Import Account to add private keys.';
    }
    if (message.includes('RATE_LIMIT_EXCEEDED')) {
      return message; // Already user-friendly
    }

    return message;
  }

  return 'An unexpected error occurred. Please try again.';
};
```

---

## 16. Success Flow

### 16.1 Success Screen Component

**This would typically redirect to unlock screen, but if we want a success animation:**

```tsx
const SuccessScreen: React.FC<{ address: string; onContinue: () => void }> = ({
  address,
  onContinue,
}) => {
  return (
    <div className="text-center">
      {/* Animated Checkmark */}
      <div className="mb-6 animate-bounce-in">
        <svg className="w-16 h-16 text-green-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      {/* Success Message */}
      <h2 className="text-2xl font-bold text-white mb-2">
        Wallet Imported Successfully!
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Your wallet has been created and is ready to use.
      </p>

      {/* Account Summary */}
      <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 mb-6 text-left">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-white">Imported Account</h3>
          <span className="px-2 py-1 bg-bitcoin/20 text-bitcoin text-xs font-medium rounded">
            Non-HD
          </span>
        </div>

        <div className="mb-3">
          <span className="text-sm text-gray-400">Address Type: </span>
          <span className="text-sm text-white font-medium">Native SegWit</span>
        </div>

        <div className="mb-3">
          <span className="text-sm text-gray-400 block mb-1">First Address</span>
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg p-3">
            <span className="flex-1 font-mono text-xs text-white break-all">
              {address}
            </span>
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="w-full bg-bitcoin text-white py-3 px-6 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
      >
        Unlock Wallet
      </button>
    </div>
  );
};
```

---

## 17. Accessibility

### 17.1 ARIA Labels

```tsx
{/* Tab Navigation */}
<div role="tablist" aria-label="Wallet setup options">
  <button
    role="tab"
    aria-selected={activeTab === 'import-key'}
    aria-controls="import-key-panel"
    id="import-key-tab"
  >
    Import Private Key
  </button>
</div>

<div
  role="tabpanel"
  id="import-key-panel"
  aria-labelledby="import-key-tab"
>
  {/* Tab content */}
</div>
```

### 17.2 Form Accessibility

```tsx
{/* WIF Input */}
<label htmlFor="wif-input" className="sr-only">
  WIF Private Key
</label>
<textarea
  id="wif-input"
  aria-describedby="wif-help wif-validation"
  aria-invalid={validationError ? 'true' : 'false'}
  aria-required="true"
/>
<div id="wif-help" className="text-xs text-gray-500">
  Paste your WIF private key here
</div>
<div id="wif-validation" role="alert" aria-live="polite">
  {validationError && `Error: ${validationError}`}
</div>
```

### 17.3 Keyboard Navigation

```typescript
// Tab key navigation
const handleTabKeyPress = (e: React.KeyboardEvent) => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const tabs: SetupTab[] = ['create', 'import', 'import-key'];
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowRight') {
      const nextIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[nextIndex]);
    } else {
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      setActiveTab(tabs[prevIndex]);
    }
  }
};
```

---

## 18. Testing Strategy

### 18.1 Component Tests

**Create:** `src/tab/components/WalletSetup/__tests__/ImportPrivateKey.test.tsx`

```typescript
describe('ImportPrivateKeyTab', () => {
  describe('Input Method Selection', () => {
    it('should toggle between file upload and paste WIF', () => {
      // Test segmented control functionality
    });

    it('should clear errors when switching input methods', () => {
      // Test error state reset
    });
  });

  describe('File Upload', () => {
    it('should accept .txt files', () => {
      // Test file input validation
    });

    it('should reject files > 100KB', () => {
      // Test file size validation
    });

    it('should detect encrypted WIF files', () => {
      // Test encryption detection
    });

    it('should read plaintext WIF files', () => {
      // Test plaintext WIF extraction
    });
  });

  describe('WIF Validation', () => {
    it('should validate WIF in real-time', () => {
      // Test debounced validation
    });

    it('should show validation feedback', () => {
      // Test success/error states
    });

    it('should detect network from WIF', () => {
      // Test network detection
    });
  });

  describe('Address Type Selection', () => {
    it('should show all 3 types for compressed key', () => {
      // Test compressed key handling
    });

    it('should show only legacy for uncompressed key', () => {
      // Test uncompressed key handling
    });

    it('should generate address previews', () => {
      // Test address preview generation
    });
  });

  describe('Privacy Warnings', () => {
    it('should show dismissible info banner', () => {
      // Test info banner
    });

    it('should require acknowledgment checkbox', () => {
      // Test mandatory acknowledgment
    });

    it('should disable import until acknowledged', () => {
      // Test button state
    });
  });

  describe('Import Flow', () => {
    it('should import plaintext WIF successfully', () => {
      // Test full flow
    });

    it('should decrypt and import encrypted WIF', () => {
      // Test encryption flow
    });

    it('should handle import errors gracefully', () => {
      // Test error handling
    });
  });
});
```

### 18.2 Integration Tests

```typescript
describe('WalletSetup Integration', () => {
  it('should show third tab for private key import', () => {
    // Test tab visibility
  });

  it('should complete full import flow', async () => {
    // 1. Select Import Private Key tab
    // 2. Paste valid WIF
    // 3. Select address type
    // 4. Set wallet password
    // 5. Acknowledge privacy warning
    // 6. Import wallet
    // 7. Verify redirect to unlock
  });

  it('should handle network mismatch error', async () => {
    // Test mainnet WIF on testnet wallet
  });
});
```

### 18.3 Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('should support keyboard navigation', () => {
    // Test Tab, Arrow keys
  });

  it('should have proper ARIA labels', () => {
    // Test ARIA attributes
  });

  it('should announce validation errors to screen readers', () => {
    // Test ARIA live regions
  });

  it('should have sufficient color contrast', () => {
    // Test WCAG AA compliance
  });
});
```

---

## 19. Implementation Phases

### Phase 1: Basic Structure (1 day)

**Tasks:**
- [ ] Add third tab to WalletSetup
- [ ] Create ImportPrivateKeyTab component
- [ ] Add state management
- [ ] Create ImportMethodSelector
- [ ] Test tab navigation

**Deliverables:**
- Tab structure complete
- Input method selector working
- State management implemented

### Phase 2: Input Components (1 day)

**Tasks:**
- [ ] Create FileUploadZone component
- [ ] Create WIFTextarea component
- [ ] Implement file reading logic
- [ ] Implement WIF validation
- [ ] Test file upload and paste

**Deliverables:**
- File upload working
- WIF textarea with validation
- Real-time validation feedback

### Phase 3: Address Selection (1 day)

**Tasks:**
- [ ] Create AddressTypeSelector component
- [ ] Create AddressPreviewCard component
- [ ] Implement address preview generation
- [ ] Handle uncompressed keys
- [ ] Test address type selection

**Deliverables:**
- Address type selector complete
- Address previews displaying
- Uncompressed key warning

### Phase 4: Password Fields (0.5 day)

**Tasks:**
- [ ] Create PasswordFieldGroup component
- [ ] Create PasswordStrengthMeter component
- [ ] Implement password validation
- [ ] Test password fields

**Deliverables:**
- Password fields complete
- Password strength meter working
- Validation implemented

### Phase 5: Privacy Warnings (0.5 day)

**Tasks:**
- [ ] Create PrivacyWarningBanner component
- [ ] Create PrivacyAcknowledgment component
- [ ] Implement acknowledgment logic
- [ ] Test privacy warnings

**Deliverables:**
- Privacy warnings complete
- Mandatory acknowledgment working

### Phase 6: Integration & Error Handling (1 day)

**Tasks:**
- [ ] Implement handleImportFromPrivateKey
- [ ] Add message passing logic
- [ ] Create ErrorBanner component
- [ ] Implement error handling
- [ ] Test full import flow

**Deliverables:**
- Message passing working
- Error handling complete
- Full import flow functional

### Phase 7: Testing & Polish (1 day)

**Tasks:**
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Accessibility testing
- [ ] Manual testing on testnet
- [ ] Fix bugs

**Deliverables:**
- All tests passing
- No accessibility issues
- Manual testing complete

---

## Summary and Next Steps

### Implementation Checklist

**Frontend Components:**
- [ ] WalletSetup.tsx modifications (add third tab)
- [ ] ImportMethodSelector.tsx
- [ ] FileUploadZone.tsx
- [ ] WIFTextarea.tsx
- [ ] AddressTypeSelector.tsx
- [ ] AddressPreviewCard.tsx
- [ ] PasswordFieldGroup.tsx
- [ ] PasswordStrengthMeter.tsx
- [ ] PrivacyWarningBanner.tsx
- [ ] PrivacyAcknowledgment.tsx
- [ ] ErrorBanner.tsx

**State Management:**
- [ ] Add ImportPrivateKeyState interface
- [ ] Add state initialization
- [ ] Add state update helpers

**Message Passing:**
- [ ] VALIDATE_WIF handler
- [ ] GENERATE_ADDRESS_PREVIEWS handler
- [ ] DECRYPT_ENCRYPTED_WIF handler
- [ ] CREATE_WALLET_FROM_PRIVATE_KEY handler

**Testing:**
- [ ] Component unit tests
- [ ] Integration tests
- [ ] Accessibility tests
- [ ] Manual testing on testnet

### Total Estimated Time: 6 days (1.5 sprints)

### Success Criteria

**Feature is ready when:**
- [ ] Third tab displays correctly
- [ ] File upload works (drag-drop + picker)
- [ ] WIF paste works with validation
- [ ] Address type selection works
- [ ] Password fields work with validation
- [ ] Privacy warnings display and require acknowledgment
- [ ] Import completes successfully
- [ ] Error handling works for all error types
- [ ] All tests pass (>80% coverage)
- [ ] WCAG AA accessibility verified
- [ ] Manual testing complete on testnet

---

**Document Version**: 1.0
**Status**: ✅ Ready for Implementation
**Next Step**: Begin Phase 1 (Basic Structure)
**Estimated Completion**: 6 days from start

---

**END OF FRONTEND IMPLEMENTATION PLAN**
