# Wallet Restore from Private Key - Complete UX Design Specification

**Version**: 1.0
**Date**: 2025-10-22
**Designer**: UI/UX Expert
**Status**: Ready for Frontend Implementation
**Feature**: Import Private Key During Wallet Setup (v0.11.0)

---

## Executive Summary

This document provides comprehensive UX design specifications for importing a wallet from a private key backup during initial wallet setup. The design addresses critical user needs for wallet recovery while maintaining security, clarity, and accessibility.

**Design Philosophy:**
- **Recovery-First**: Optimize for users who lost access and need to restore funds
- **Security-Conscious**: Clear warnings about privacy implications
- **Guided Experience**: Step-by-step flow with progressive disclosure
- **Error-Tolerant**: Helpful validation and recovery suggestions

**Key Design Decisions:**
1. ✅ **Third Tab** (not sub-option) - Clearest separation from seed import
2. ✅ **Address Type Selection Required** - User confirms which type they used
3. ✅ **Progressive Disclosure** - Show complexity only when needed
4. ✅ **Inline Validation** - Real-time feedback as user types
5. ✅ **Educational Warnings** - Privacy implications explained clearly

---

## Table of Contents

1. [Flow Design](#1-flow-design)
2. [Tab Layout Architecture](#2-tab-layout-architecture)
3. [Address Type Selection Component](#3-address-type-selection-component)
4. [Upload File vs Paste WIF Selector](#4-upload-file-vs-paste-wif-selector)
5. [Password Fields Organization](#5-password-fields-organization)
6. [Privacy Warnings](#6-privacy-warnings)
7. [Error Handling](#7-error-handling)
8. [Success Flow](#8-success-flow)
9. [Component Specifications](#9-component-specifications)
10. [Accessibility](#10-accessibility)
11. [Responsive Design](#11-responsive-design)
12. [Animation & Transitions](#12-animation--transitions)
13. [Design Tokens](#13-design-tokens)
14. [Implementation Priorities](#14-implementation-priorities)

---

## 1. Flow Design

### 1.1 Overall User Journey

```
User Opens Extension (No Wallet Exists)
         ↓
┌────────────────────────────────────────┐
│  WalletSetup Screen                     │
│  [Create New] [Import Seed]             │
│  [Import Private Key] ← NEW TAB         │
└────────────────────────────────────────┘
         ↓
User Selects "Import Private Key" Tab
         ↓
┌────────────────────────────────────────┐
│  Step 1: Select Input Method            │
│  ( ) Upload File                         │
│  (•) Paste WIF                           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 2: Provide WIF                    │
│  [Textarea or File Picker]              │
│  ✓ Valid WIF detected                   │
│  Network: Testnet                        │
│  Compression: Compressed                 │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 3: File Password (if encrypted)   │
│  [Enter file password to decrypt]       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 4: Select Address Type            │
│  ○ Legacy (P2PKH): m2zBc4XE...          │
│  ○ SegWit (P2SH-P2WPKH): 2MzQwS...     │
│  ● Native SegWit (P2WPKH): tb1qw50...   │
│  ℹ️ Select the type you originally used  │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 5: Set Wallet Password            │
│  [New wallet password]                   │
│  [Confirm password]                      │
│  Password strength: Strong ✓            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 6: Account Name (Optional)        │
│  [Account name: "Imported Account"]     │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 7: Privacy Warning                │
│  ⚠️ Non-HD wallet privacy implications   │
│  [ ] I understand the privacy risks     │
└────────────────────────────────────────┘
         ↓
User Clicks "Import Wallet"
         ↓
┌────────────────────────────────────────┐
│  Step 8: Creating Wallet...             │
│  [Loading spinner]                       │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│  Step 9: Success Screen                 │
│  ✓ Wallet imported successfully!        │
│  First address: tb1q...                  │
│  [Unlock Wallet]                         │
└────────────────────────────────────────┘
         ↓
Unlock Screen → Dashboard
```

### 1.2 Progressive Disclosure Strategy

**Design Principle**: Show complexity only when necessary.

**Conditional Steps:**
1. **File Password Field**: Only shown if encrypted WIF detected
2. **Address Type Selection**: Only shown for compressed keys (uncompressed = legacy only)
3. **Privacy Warning**: Always shown before final import
4. **Account Name**: Pre-filled with "Imported Account" (editable)

**Visual Hierarchy:**
- **Primary Action**: WIF input (most important)
- **Secondary Action**: Address type selection (critical for correctness)
- **Tertiary Action**: Account naming (optional customization)

---

## 2. Tab Layout Architecture

### 2.1 Design Decision: Third Tab vs Sub-Option

**✅ SELECTED APPROACH: Third Tab (Equal Weight)**

**Reasoning:**
- **Clarity**: Distinct import method deserves separate tab
- **Discoverability**: User sees all options immediately
- **No Nesting**: Avoids "Import → Private Key" sub-navigation
- **Consistency**: Matches "Create" and "Import Seed" as peer options

**Rejected Alternative:** Sub-option under "Import Existing"
- ❌ Adds extra navigation layer
- ❌ Hides private key import from first glance
- ❌ Confusing UX (user must click "Import" → then "Private Key")

### 2.2 Tab Navigation Component

**Layout:**
```
┌────────────────────────────────────────────────────┐
│  [  Create New  ] [  Import Seed  ]                 │
│  [  Import Private Key  ] ← NEW TAB                 │
│  ───────────────  (active tab underline)            │
└────────────────────────────────────────────────────┘
```

**Tab States:**

| State | Background | Text Color | Border | Cursor |
|-------|-----------|-----------|--------|--------|
| **Active** | `bg-transparent` | `text-bitcoin` | `border-b-2 border-bitcoin` | `cursor-default` |
| **Inactive** | `bg-transparent` | `text-gray-400` | `border-b-0` | `cursor-pointer` |
| **Hover (Inactive)** | `bg-gray-800/30` | `text-gray-300` | `border-b-0` | `cursor-pointer` |
| **Focus** | N/A | N/A | `ring-2 ring-bitcoin ring-offset-2` | N/A |

**Tab Content:**

```tsx
// Tab labels with icons (optional)
const tabs = [
  { id: 'create', label: 'Create New', icon: PlusCircleIcon },
  { id: 'import-seed', label: 'Import Seed', icon: KeyIcon },
  { id: 'import-key', label: 'Import Private Key', icon: LockIcon }
];
```

**Visual Spacing:**
- Tab height: `48px` (h-12)
- Tab padding: `16px horizontal` (px-4)
- Gap between tabs: `8px` (gap-2)
- Active indicator: `2px thick` orange underline

### 2.3 Tab Switching Behavior

**Interaction:**
1. User clicks inactive tab
2. Tab transitions to active state (underline animates in)
3. Form content cross-fades (fade out → fade in, 200ms)
4. Focus moves to first input in new tab
5. Error states clear on tab switch

**Accessibility:**
- Arrow keys navigate between tabs
- Tab/Shift+Tab moves focus within tab content
- Enter/Space activates focused tab
- ARIA labels: `role="tablist"`, `role="tab"`, `aria-selected="true"`

---

## 3. Address Type Selection Component

### 3.1 Design Requirements

**Critical Constraint from Blockchain Expert:**
> A single private key can generate 3 different addresses (for compressed keys). User MUST select which type they originally used, as we cannot auto-detect reliably.

**UX Challenge:**
- Most users don't understand address types
- Wrong selection = 0 balance (funds inaccessible)
- Must guide user to correct choice

**Solution:**
- Show ALL 3 address previews
- Visual differentiation (radio cards, not dropdown)
- Help text explaining how to identify
- Recommended option highlighted

### 3.2 Address Type Selector Wireframe

```
┌────────────────────────────────────────────────────┐
│  Address Type                                       │
│  ───────────────────────────────────────────────   │
│                                                     │
│  ℹ️ Select the address type you originally used.   │
│     Check your backup or transaction history.      │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ○  Legacy (P2PKH)                           │  │
│  │    First address: mzBc4XEFSdzCDcTxAgW...     │  │
│  │    Starts with: m or n (testnet)            │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ○  SegWit (P2SH-P2WPKH)                     │  │
│  │    First address: 2MzQwSSnBHWHqSAqtTVQ6v...  │  │
│  │    Starts with: 2 (testnet)                 │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │ ●  Native SegWit (P2WPKH) - Recommended     │  │
│  │    First address: tb1qw508d6qejxtdg4y5r... │  │
│  │    Starts with: tb1 (testnet)               │  │
│  │    ✓ Lower fees, better privacy             │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  [Continue]                                        │
└────────────────────────────────────────────────────┘
```

### 3.3 Radio Card Component Specification

**Component Name:** `AddressTypeRadioCard`

**Props:**
```typescript
interface AddressTypeRadioCardProps {
  type: 'legacy' | 'segwit' | 'native-segwit';
  label: string;
  technicalName: string;  // e.g., "P2PKH", "P2SH-P2WPKH"
  address: string;        // Generated preview address
  prefix: string;         // e.g., "m or n", "2", "tb1"
  recommended?: boolean;  // Show "Recommended" badge
  selected: boolean;
  disabled?: boolean;     // For uncompressed keys (SegWit disabled)
  onSelect: (type: AddressType) => void;
}
```

**States:**

| State | Border | Background | Radio | Cursor |
|-------|--------|-----------|-------|--------|
| **Unselected** | `border-gray-700` | `bg-gray-900` | `border-gray-600` | `cursor-pointer` |
| **Selected** | `border-bitcoin` | `bg-bitcoin/5` | `border-bitcoin bg-bitcoin` | `cursor-default` |
| **Hover (Unselected)** | `border-gray-600` | `bg-gray-850` | `border-gray-500` | `cursor-pointer` |
| **Disabled** | `border-gray-800` | `bg-gray-950` | `border-gray-700` | `cursor-not-allowed` |
| **Focus** | `ring-2 ring-bitcoin` | N/A | N/A | N/A |

**Layout:**
```tsx
<div className={`
  relative border-2 rounded-xl p-4 transition-all duration-200
  ${selected
    ? 'border-bitcoin bg-bitcoin/5'
    : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-850'
  }
  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
`}>
  {/* Radio button */}
  <div className="flex items-start gap-3">
    <div className={`
      mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center
      ${selected ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'}
    `}>
      {selected && (
        <div className="w-2.5 h-2.5 bg-white rounded-full" />
      )}
    </div>

    {/* Content */}
    <div className="flex-1">
      {/* Label + Badge */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm font-semibold text-white">
          {label}
        </span>
        {recommended && (
          <span className="px-2 py-0.5 bg-bitcoin/20 text-bitcoin text-xs font-medium rounded">
            Recommended
          </span>
        )}
      </div>

      {/* Technical name */}
      <div className="text-xs text-gray-400 mb-2">
        {technicalName}
      </div>

      {/* Address preview */}
      <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 mb-2">
        <div className="text-xs text-gray-500 mb-1">First address:</div>
        <div className="font-mono text-xs text-white break-all">
          {address}
        </div>
      </div>

      {/* Prefix hint */}
      <div className="text-xs text-gray-400">
        Starts with: <span className="font-mono text-gray-300">{prefix}</span>
      </div>
    </div>
  </div>

  {/* Checkmark icon (selected state) */}
  {selected && (
    <div className="absolute top-3 right-3">
      <svg className="w-5 h-5 text-bitcoin" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  )}
</div>
```

### 3.4 Uncompressed Key Handling

**Scenario:** User imports uncompressed WIF → Only legacy address type available

**UI Behavior:**
1. Detect uncompressed key from WIF validation
2. Show only Legacy option (radio card)
3. Disable SegWit and Native SegWit cards
4. Show warning banner

**Warning Banner:**
```
┌────────────────────────────────────────────────────┐
│  ⚠️ Uncompressed Private Key Detected              │
│  ───────────────────────────────────────────────   │
│  This key can only be used with Legacy (P2PKH)     │
│  addresses. SegWit addresses require compressed    │
│  keys.                                              │
│                                                     │
│  First address: mzBc4XEFSdzCDcTxAgW...             │
└────────────────────────────────────────────────────┘
```

**Layout:**
- Background: `bg-yellow-500/10`
- Border: `border border-yellow-500/30`
- Icon: `text-yellow-500`
- Text: `text-yellow-200`

### 3.5 Help Content: "How to Identify Your Address Type"

**Expandable Help Section:**

```
┌────────────────────────────────────────────────────┐
│  ❓ Not sure which address type you used?          │
│  [Click to expand]                                  │
└────────────────────────────────────────────────────┘
         ↓ (Expands on click)
┌────────────────────────────────────────────────────┐
│  How to Identify Your Address Type                 │
│  ───────────────────────────────────────────────   │
│                                                     │
│  1. Check Your Backup File                         │
│     - Look for the first address in your backup    │
│     - Compare the address format to the previews   │
│                                                     │
│  2. Check Your Transaction History                 │
│     - Find a transaction on a block explorer       │
│     - Look at the address format you used          │
│                                                     │
│  3. Address Format Examples:                       │
│     • Legacy: Starts with "m" or "n" (testnet)     │
│     • SegWit: Starts with "2" (testnet)            │
│     • Native SegWit: Starts with "tb1" (testnet)   │
│                                                     │
│  4. If Still Unsure                                │
│     - Try Native SegWit first (most common)        │
│     - If balance shows 0, try another type         │
│     - You can always re-import with a different    │
│       address type                                  │
│                                                     │
│  [Hide Help]                                       │
└────────────────────────────────────────────────────┘
```

**Component:**
- Accordion/Collapsible pattern
- Chevron icon rotates on expand/collapse
- Smooth height transition (300ms ease)
- ARIA: `aria-expanded="true/false"`

---

## 4. Upload File vs Paste WIF Selector

### 4.1 Design Decision: Radio Buttons vs Tabs

**✅ SELECTED APPROACH: Radio Buttons (Horizontal Toggle)**

**Reasoning:**
- **Simpler**: Only 2 options (not worthy of tabs)
- **Visual Hierarchy**: Less prominent than main tabs
- **Toggle Pattern**: Common for binary choices
- **No Nesting**: Avoids tab-within-tab confusion

**Rejected Alternative:** Tabs (nested under "Import Private Key")
- ❌ Too many tab levels (main tabs → import method tabs)
- ❌ Overkill for binary choice
- ❌ Confusion with main tab navigation

### 4.2 Input Method Selector Wireframe

```
┌────────────────────────────────────────────────────┐
│  Import Private Key                                 │
│  ───────────────────────────────────────────────   │
│                                                     │
│  Input Method                                       │
│  ┌──────────────┬──────────────┐                   │
│  │  Upload File │  Paste WIF   │ ← Radio Toggle    │
│  └──────────────┴──────────────┘                   │
│    Selected ^    Unselected                         │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  (Content changes based on selection)        │  │
│  │                                               │  │
│  │  [File Picker] OR [Textarea]                 │  │
│  └─────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

### 4.3 Radio Toggle Component Specification

**Component Name:** `SegmentedControl` (iOS-style)

**Props:**
```typescript
interface SegmentedControlProps {
  options: Array<{
    value: string;
    label: string;
    icon?: React.ComponentType;
  }>;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}
```

**Visual Design:**
```tsx
<div className="inline-flex bg-gray-900 border border-gray-700 rounded-lg p-1">
  {options.map(option => (
    <button
      key={option.value}
      onClick={() => onChange(option.value)}
      className={`
        px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
        ${value === option.value
          ? 'bg-bitcoin text-white shadow-lg'
          : 'text-gray-400 hover:text-gray-300'
        }
      `}
    >
      {option.icon && <option.icon className="w-4 h-4 mr-2 inline" />}
      {option.label}
    </button>
  ))}
</div>
```

**States:**

| State | Background | Text Color | Shadow | Cursor |
|-------|-----------|-----------|--------|--------|
| **Selected** | `bg-bitcoin` | `text-white` | `shadow-lg` | `cursor-default` |
| **Unselected** | `bg-transparent` | `text-gray-400` | `none` | `cursor-pointer` |
| **Hover (Unselected)** | `bg-gray-800/50` | `text-gray-300` | `none` | `cursor-pointer` |
| **Focus** | N/A | N/A | `ring-2 ring-bitcoin` | N/A |

### 4.4 Upload File Option

**File Picker Component:**

```
┌────────────────────────────────────────────────────┐
│  Upload Private Key File                            │
│  ───────────────────────────────────────────────   │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  📁  Drop file here or click to browse       │  │
│  │                                               │  │
│  │      Supports .txt files                     │  │
│  └─────────────────────────────────────────────┘  │
│       ↑ Drag-drop zone (dashed border)             │
│                                                     │
│  OR                                                 │
│                                                     │
│  [Choose File]  No file selected                   │
│                                                     │
└────────────────────────────────────────────────────┘
```

**After File Selected:**

```
┌────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────┐  │
│  │  ✓  bitcoin-account-savings.txt              │  │
│  │      2.1 KB • Selected                       │  │
│  │      [×] Remove                               │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ✓ Valid encrypted WIF detected                   │
│                                                     │
│  (File Password field appears below)               │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface FileUploadProps {
  accept: string;  // '.txt'
  maxSize: number; // 100KB
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  disabled?: boolean;
}
```

**Drag-Drop Zone States:**

| State | Border | Background | Cursor |
|-------|--------|-----------|--------|
| **Default** | `border-2 border-dashed border-gray-700` | `bg-gray-900` | `cursor-pointer` |
| **Drag Over** | `border-2 border-dashed border-bitcoin` | `bg-bitcoin/10` | `cursor-copy` |
| **File Selected** | `border border-gray-700` | `bg-gray-850` | `cursor-default` |
| **Error** | `border-2 border-dashed border-red-500` | `bg-red-500/5` | `cursor-pointer` |

**File Validation:**
- Max size: 100 KB
- Accepted types: `.txt`, `text/plain`
- Read as UTF-8 text
- Auto-detect encryption (check for "Encrypted Private Key:" header)

### 4.5 Paste WIF Option

**Textarea Component:**

```
┌────────────────────────────────────────────────────┐
│  Paste WIF Private Key                              │
│  ───────────────────────────────────────────────   │
│                                                     │
│  ┌─────────────────────────────────────────────┐  │
│  │  cT1Y2Y...                                    │  │
│  │  (Paste your WIF key here)                   │  │
│  │                                               │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ✓ Valid WIF detected                             │
│  Network: Testnet                                  │
│  Compression: Compressed                           │
│                                                     │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface WIFTextareaProps {
  value: string;
  onChange: (value: string) => void;
  validation: WIFValidationResult | null;
  disabled?: boolean;
}

interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  compressed?: boolean;
  encrypted?: boolean;
  error?: string;
}
```

**Validation Feedback:**

**Valid WIF:**
```
✓ Valid WIF detected
Network: Testnet
Compression: Compressed
```

**Invalid WIF:**
```
✗ Invalid WIF format
Please check your private key
```

**Wrong Network:**
```
✗ Network mismatch
This is a mainnet key, but testnet is required
```

**States:**

| State | Border | Background | Icon | Color |
|-------|--------|-----------|------|-------|
| **Empty** | `border-gray-700` | `bg-gray-900` | None | `text-gray-500` |
| **Typing** | `border-bitcoin/50` | `bg-gray-900` | Loading | `text-gray-300` |
| **Valid** | `border-green-500` | `bg-gray-900` | ✓ | `text-green-400` |
| **Invalid** | `border-red-500` | `bg-gray-900` | ✗ | `text-red-400` |
| **Focus** | `ring-2 ring-bitcoin` | `bg-gray-900` | N/A | N/A |

**Real-Time Validation:**
- Debounced input (300ms delay after typing stops)
- Show loading spinner during validation
- Display results immediately after validation completes

### 4.6 Auto-Detection of Encryption

**Plaintext WIF Detected:**
```
✓ Valid plaintext WIF detected
Network: Testnet
Compression: Compressed

(Skip file password field, go to address type selection)
```

**Encrypted WIF Detected:**
```
🔒 Encrypted WIF detected

Please enter the password used when exporting this key.

┌─────────────────────────────────────────────┐
│  File Password                               │
│  [••••••••]  👁️ Show                         │
└─────────────────────────────────────────────┘
```

**Auto-Detection Logic:**
```typescript
function detectEncryption(content: string): boolean {
  // Check for encryption header
  if (content.includes('Bitcoin Account Private Key (Encrypted)')) {
    return true;
  }

  // Check for encrypted data marker
  if (content.includes('Encrypted Private Key:')) {
    return true;
  }

  // Otherwise, assume plaintext
  return false;
}
```

---

## 5. Password Fields Organization

### 5.1 Password Field Scenarios

**Scenario A: Plaintext WIF**
- File Password: ❌ NOT SHOWN
- New Wallet Password: ✅ SHOWN
- Confirm Password: ✅ SHOWN

**Scenario B: Encrypted WIF**
- File Password: ✅ SHOWN (decryption)
- New Wallet Password: ✅ SHOWN (wallet encryption)
- Confirm Password: ✅ SHOWN (confirmation)

**Scenario C: User Confusion Risk**
- Two different passwords
- Must clearly label each

### 5.2 File Password Field (Encrypted WIF Only)

**Conditional Rendering:**
```typescript
{isEncrypted && (
  <div className="mb-6">
    <FilePasswordField
      value={filePassword}
      onChange={setFilePassword}
      onDecrypt={handleDecrypt}
    />
  </div>
)}
```

**Wireframe:**
```
┌────────────────────────────────────────────────────┐
│  🔒 Encrypted Private Key                          │
│  ───────────────────────────────────────────────   │
│                                                     │
│  File Password                                      │
│  ┌─────────────────────────────────────────────┐  │
│  │  [••••••••••]  👁️ Show                       │  │
│  └─────────────────────────────────────────────┘  │
│  ℹ️ Enter the password used when exporting this    │
│     key                                             │
│                                                     │
│  [Decrypt]                                         │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface FilePasswordFieldProps {
  value: string;
  onChange: (value: string) => void;
  onDecrypt: () => Promise<void>;
  error?: string;
  disabled?: boolean;
}
```

**Visual Design:**
- Label: `text-sm font-medium text-gray-300`
- Help text: `text-xs text-gray-500`
- Input: `bg-gray-900 border-gray-700 text-white`
- Show/Hide toggle: `text-gray-400 hover:text-gray-300`

### 5.3 New Wallet Password Fields

**Sequential Display:**
1. After WIF validated (plaintext) OR file decrypted (encrypted)
2. Show wallet password + confirm
3. Include password strength meter

**Wireframe:**
```
┌────────────────────────────────────────────────────┐
│  Set Wallet Password                                │
│  ───────────────────────────────────────────────   │
│                                                     │
│  New Wallet Password                                │
│  ┌─────────────────────────────────────────────┐  │
│  │  [••••••••••]  👁️ Show                       │  │
│  └─────────────────────────────────────────────┘  │
│  Password strength: ████████░░ Strong ✓            │
│                                                     │
│  ℹ️ This password will be used to unlock your       │
│     wallet                                          │
│                                                     │
│  Confirm Wallet Password                            │
│  ┌─────────────────────────────────────────────┐  │
│  │  [••••••••••]  👁️ Show                       │  │
│  └─────────────────────────────────────────────┘  │
│  ✓ Passwords match                                 │
│                                                     │
└────────────────────────────────────────────────────┘
```

### 5.4 Password Strength Meter

**Component Specification:**

```typescript
interface PasswordStrengthMeterProps {
  password: string;
  showLabel?: boolean;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

function calculatePasswordStrength(password: string): PasswordStrength {
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
}
```

**Visual Design:**

**Weak:**
```
Password strength: ███░░░░░░░ Weak
                   ↑ Red (#EF4444)
```

**Medium:**
```
Password strength: ██████░░░░ Medium
                   ↑ Yellow (#F59E0B)
```

**Strong:**
```
Password strength: █████████░ Strong ✓
                   ↑ Green (#10B981)
```

**Layout:**
```tsx
<div className="mt-2">
  <div className="flex items-center gap-2">
    {/* Progress bar */}
    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${strengthColor}`}
        style={{ width: `${strengthPercentage}%` }}
      />
    </div>

    {/* Label */}
    <span className={`text-sm font-medium ${strengthTextColor}`}>
      {strengthLabel}
      {strength === 'strong' && ' ✓'}
    </span>
  </div>

  {/* Requirements */}
  {strength !== 'strong' && (
    <ul className="mt-2 text-xs text-gray-500 space-y-1">
      <li className={lengthMet ? 'text-green-400' : ''}>
        {lengthMet ? '✓' : '○'} At least 8 characters
      </li>
      <li className={uppercaseMet ? 'text-green-400' : ''}>
        {uppercaseMet ? '✓' : '○'} One uppercase letter
      </li>
      <li className={lowercaseMet ? 'text-green-400' : ''}>
        {lowercaseMet ? '✓' : '○'} One lowercase letter
      </li>
      <li className={numberMet ? 'text-green-400' : ''}>
        {numberMet ? '✓' : '○'} One number
      </li>
    </ul>
  )}
</div>
```

### 5.5 Clear Visual Separation

**Two Password Types:**
1. **File Password** (decrypt exported key)
2. **Wallet Password** (encrypt new wallet)

**Visual Separation Strategy:**

```
┌────────────────────────────────────────────────────┐
│  Step 1: Decrypt Your Backup                       │
│  ───────────────────────────────────────────────   │
│  File Password                                      │
│  [••••••••]                                        │
│  ℹ️ Password from when you exported the key        │
└────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│  Step 2: Secure Your New Wallet                    │
│  ───────────────────────────────────────────────   │
│  New Wallet Password                                │
│  [••••••••]                                        │
│  ℹ️ You'll use this to unlock your wallet          │
│                                                     │
│  Confirm Wallet Password                            │
│  [••••••••]                                        │
└────────────────────────────────────────────────────┘
```

**Design Elements:**
- Different section headers ("Decrypt Backup" vs "Secure Wallet")
- Different help text colors
- Visual divider between sections (optional dashed line)
- Icon differentiation (🔒 vs 🔐)

---

## 6. Privacy Warnings

### 6.1 Warning Placement Strategy

**Three Warning Touchpoints:**
1. **During Import**: Dismissible info banner
2. **Before Final Import**: Mandatory acknowledgment checkbox
3. **After Import**: Persistent dashboard banner

### 6.2 Warning 1: During Import (Info Banner)

**Placement:** After address type selection, before wallet password

**Wireframe:**
```
┌────────────────────────────────────────────────────┐
│  ℹ️ Privacy Notice                                  │
│  ───────────────────────────────────────────────   │
│  Wallets imported from private keys use a single   │
│  address for all transactions, which may reduce    │
│  privacy compared to HD wallets with seed phrases. │
│                                                     │
│  [Learn More] [Dismiss]                            │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface PrivacyNoticeBannerProps {
  onLearnMore: () => void;
  onDismiss: () => void;
  dismissible?: boolean;
}
```

**Visual Design:**
- Background: `bg-blue-500/10`
- Border: `border border-blue-500/30`
- Icon: `text-blue-400`
- Text: `text-blue-200`
- Buttons: `text-blue-400 hover:text-blue-300`

**Behavior:**
- Dismissible (user can close)
- Reappears if user navigates away and returns
- "Learn More" opens modal with detailed explanation

### 6.3 Warning 2: Mandatory Acknowledgment (Before Import)

**Placement:** Immediately before "Import Wallet" button

**Wireframe:**
```
┌────────────────────────────────────────────────────┐
│  ⚠️ Privacy Warning                                 │
│  ───────────────────────────────────────────────   │
│  This wallet will reuse the same address for all   │
│  transactions. This means:                          │
│                                                     │
│  • All transactions are publicly linked            │
│  • Your balance is visible to anyone               │
│  • Privacy is significantly reduced                 │
│                                                     │
│  For better privacy, consider creating a wallet    │
│  with a seed phrase instead.                        │
│                                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ [ ] I understand the privacy implications    │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  [Create Seed Phrase Wallet] [Continue Anyway]     │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface PrivacyAcknowledgmentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onCreateSeedWallet: () => void;
  onContinue: () => void;
}
```

**Visual Design:**
- Background: `bg-yellow-500/10`
- Border: `border-2 border-yellow-500/40`
- Icon: `text-yellow-400`
- Text: `text-yellow-100`
- Checkbox: `border-yellow-500 checked:bg-yellow-500`
- Primary CTA: `bg-bitcoin text-white` (Continue Anyway)
- Secondary CTA: `border-bitcoin text-bitcoin` (Create Seed Phrase)

**Behavior:**
- "Import Wallet" button DISABLED until checkbox checked
- Checkbox must be clicked (cannot be keyboard-bypassed without focus)
- "Create Seed Phrase Wallet" redirects to "Create New" tab

### 6.4 Warning 3: Persistent Dashboard Banner

**Placement:** Top of Dashboard, after successful import

**Wireframe:**
```
┌────────────────────────────────────────────────────┐
│  ℹ️ This wallet uses a single address              │
│  ───────────────────────────────────────────────   │
│  For better privacy, you may want to migrate to a  │
│  seed phrase wallet.                                │
│                                                     │
│  [Migrate Now] [Learn More] [Dismiss]              │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface NonHDWalletBannerProps {
  onMigrate: () => void;
  onLearnMore: () => void;
  onDismiss: () => void;
  dismissed: boolean;
}
```

**Visual Design:**
- Background: `bg-gray-800/50`
- Border: `border-l-4 border-yellow-500`
- Icon: `text-yellow-400`
- Text: `text-gray-300`
- Buttons: `text-bitcoin hover:text-bitcoin-hover`

**Behavior:**
- Dismissible (stored in wallet settings)
- Reappears after 7 days if still using non-HD wallet
- "Migrate Now" opens migration wizard
- "Learn More" opens help article

### 6.5 Educational Modal: "Learn More" Content

**Modal Title:** Understanding Non-HD Wallet Privacy

**Content:**
```
┌──────────────────────────────────────────────────────┐
│  Understanding Non-HD Wallet Privacy          [×]    │
├──────────────────────────────────────────────────────┤
│                                                       │
│  What are Non-HD Wallets?                            │
│  ────────────────────────────────────────────────    │
│  Non-HD (Hierarchical Deterministic) wallets use a   │
│  single private key and address, rather than         │
│  generating new addresses from a seed phrase.        │
│                                                       │
│  Privacy Implications                                 │
│  ────────────────────────────────────────────────    │
│  • Address Reuse: All transactions use the same      │
│    address, making it easy to track your activity    │
│                                                       │
│  • Balance Visibility: Anyone who knows your         │
│    address can see your full balance on blockchain   │
│    explorers                                          │
│                                                       │
│  • Transaction Linkability: All transactions are     │
│    linked to the same address, revealing spending    │
│    patterns                                           │
│                                                       │
│  HD Wallet Advantages                                 │
│  ────────────────────────────────────────────────    │
│  • New addresses for each transaction (privacy)      │
│  • Change addresses hide your balance                │
│  • Single seed phrase backs up all addresses         │
│                                                       │
│  Recommendations                                      │
│  ────────────────────────────────────────────────    │
│  ✓ Use non-HD wallets only for wallet recovery       │
│  ✓ Migrate to seed phrase wallet for long-term use  │
│  ✓ Avoid sending large amounts to single address     │
│                                                       │
│  [Create Seed Phrase Wallet] [Close]                 │
└──────────────────────────────────────────────────────┘
```

**Design:**
- Modal width: `max-w-2xl`
- Sections: Clearly divided with horizontal rules
- Icons: ⚠️ for warnings, ✓ for recommendations
- Scrollable if content exceeds viewport height

---

## 7. Error Handling

### 7.1 Error Types and Messages

**Comprehensive Error Matrix:**

| Error Code | User Message | Recovery Action |
|-----------|--------------|----------------|
| `INVALID_WIF_FORMAT` | "Invalid WIF format. Please check your private key." | "Verify you copied the entire WIF string" |
| `NETWORK_MISMATCH` | "Wrong network: This is a mainnet key, testnet required." | "Use a testnet private key (starts with 9 or c)" |
| `WRONG_FILE_PASSWORD` | "Incorrect file password. Unable to decrypt." | "Check your password and try again" |
| `FILE_CORRUPTED` | "File is corrupted or invalid format." | "Use the original exported file" |
| `FILE_TOO_LARGE` | "File size exceeds 100KB limit." | "Ensure you're uploading a text file" |
| `FILE_EMPTY` | "File is empty or unreadable." | "Choose a valid private key backup file" |
| `INCOMPATIBLE_ADDRESS_TYPE` | "Uncompressed keys can only use legacy addresses." | "Select Legacy address type" |
| `WALLET_EXISTS` | "Wallet already exists." | "Use Settings → Import Account to add keys" |
| `WEAK_PASSWORD` | "Password must meet security requirements." | "Use at least 8 chars, uppercase, lowercase, number" |
| `PASSWORDS_MISMATCH` | "Passwords do not match." | "Re-enter your password confirmation" |
| `RATE_LIMIT_EXCEEDED` | "Too many attempts. Please try again in 15 minutes." | "Wait before trying again" |

### 7.2 Inline Validation (Real-Time Feedback)

**WIF Input Validation:**

**As User Types:**
```
┌────────────────────────────────────────────────────┐
│  Paste WIF Private Key                              │
│  ┌─────────────────────────────────────────────┐  │
│  │  cT1Y2Y... (typing)                          │  │
│  └─────────────────────────────────────────────┘  │
│  ⏳ Validating...                                  │
└────────────────────────────────────────────────────┘
```

**Valid Input:**
```
┌────────────────────────────────────────────────────┐
│  Paste WIF Private Key                              │
│  ┌─────────────────────────────────────────────┐  │
│  │  cT1Y2Y... (complete)                        │  │
│  └─────────────────────────────────────────────┘  │
│  ✓ Valid WIF detected                             │
│  Network: Testnet • Compression: Compressed        │
└────────────────────────────────────────────────────┘
```

**Invalid Input:**
```
┌────────────────────────────────────────────────────┐
│  Paste WIF Private Key                              │
│  ┌─────────────────────────────────────────────┐  │
│  │  cT1Y2Y... (invalid checksum)                │  │
│  └─────────────────────────────────────────────┘  │
│  ✗ Invalid WIF checksum                           │
│  Verify you copied the entire key                  │
└────────────────────────────────────────────────────┘
```

**Validation States:**

| State | Border Color | Icon | Text Color |
|-------|-------------|------|-----------|
| **Empty** | `border-gray-700` | None | `text-gray-500` |
| **Validating** | `border-bitcoin/50` | ⏳ Spinner | `text-gray-400` |
| **Valid** | `border-green-500` | ✓ | `text-green-400` |
| **Error** | `border-red-500` | ✗ | `text-red-400` |

### 7.3 Error Notification Component

**Component Name:** `ErrorBanner`

**Wireframe:**
```
┌────────────────────────────────────────────────────┐
│  ✗ Invalid WIF format                              │
│  ───────────────────────────────────────────────   │
│  Please check your private key and ensure you      │
│  copied the entire WIF string.                      │
│                                                     │
│  💡 Need help? [View WIF format guide]             │
│                                                     │
│  [Dismiss]                                         │
└────────────────────────────────────────────────────┘
```

**Component Specification:**

```typescript
interface ErrorBannerProps {
  title: string;
  message: string;
  suggestion?: string;
  helpLink?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
  dismissible?: boolean;
}
```

**Visual Design:**
- Background: `bg-red-500/15`
- Border: `border-l-4 border-red-500`
- Icon: `text-red-400`
- Title: `text-red-200 font-semibold`
- Message: `text-red-100`
- Suggestion: `text-red-200/80`
- Help link: `text-red-300 hover:text-red-200 underline`

**Animation:**
- Slide in from top (300ms ease-out)
- Auto-dismiss after 10 seconds (if dismissible)
- Shake animation on critical errors

### 7.4 Field-Level Error Messages

**Password Field Error:**
```
┌────────────────────────────────────────────────────┐
│  Password                                           │
│  ┌─────────────────────────────────────────────┐  │
│  │  [••••]  👁️ Show                             │  │
│  └─────────────────────────────────────────────┘  │
│  ✗ Password must be at least 8 characters          │
└────────────────────────────────────────────────────┘
```

**Mnemonic Field Error:**
```
┌────────────────────────────────────────────────────┐
│  Seed Phrase                                        │
│  ┌─────────────────────────────────────────────┐  │
│  │  word1 word2 word3 word4 word5              │  │
│  └─────────────────────────────────────────────┘  │
│  ✗ Seed phrase must be 12, 15, 18, 21, or 24 words│
└────────────────────────────────────────────────────┘
```

**Visual Design:**
- Error text: `text-xs text-red-400 mt-1`
- Icon: `text-red-400` (inline with message)
- Input border: `border-red-500` when error present

### 7.5 Network Mismatch Error (Special Case)

**Critical Error:** User imports mainnet WIF into testnet wallet

**Full-Screen Error Modal:**
```
┌──────────────────────────────────────────────────────┐
│  ⚠️ Network Mismatch                                 │
├──────────────────────────────────────────────────────┤
│                                                       │
│  This private key is for Bitcoin mainnet, but this   │
│  wallet is configured for testnet.                    │
│                                                       │
│  What would you like to do?                          │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Option 1: Use a Testnet Private Key         │   │
│  │  Get a testnet WIF key starting with:        │   │
│  │  • "9" (uncompressed)                         │   │
│  │  • "c" (compressed)                           │   │
│  │                                                │   │
│  │  [Go Back]                                    │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Option 2: Switch to Mainnet (Not Available) │   │
│  │  Mainnet support coming soon.                 │   │
│  │                                                │   │
│  │  [Learn More]                                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Design:**
- Modal: Full-screen overlay with backdrop blur
- Title: `text-yellow-400`
- Options: Card-style layout with clear CTAs
- Disabled option: Greyed out with explanation

---

## 8. Success Flow

### 8.1 Success Screen After Import

**Transition:** Loading → Success → Unlock

**Success Screen Wireframe:**
```
┌────────────────────────────────────────────────────┐
│                                                     │
│         ✓                                           │
│    (checkmark icon)                                 │
│                                                     │
│  Wallet Imported Successfully!                      │
│  ───────────────────────────────────────────────   │
│                                                     │
│  Your wallet has been created and is ready to use. │
│                                                     │
│  Account Details                                    │
│  ┌─────────────────────────────────────────────┐  │
│  │  Account Name: Imported Account              │  │
│  │  Address Type: Native SegWit                 │  │
│  │  First Address: tb1qw508d6qejxtdg4y5r3za... │  │
│  │  [Copy Address]                               │  │
│  └─────────────────────────────────────────────┘  │
│                                                     │
│  ⏳ Fetching balance...                            │
│                                                     │
│  [Unlock Wallet]                                   │
│                                                     │
└────────────────────────────────────────────────────┘
```

### 8.2 Success Animation

**Animation Sequence:**
1. **Loading state** (2-5 seconds)
   - Spinner with "Creating wallet..." text

2. **Success reveal** (500ms)
   - Checkmark scales in with bounce effect
   - Background shifts to subtle green tint

3. **Content fade-in** (300ms)
   - Account details slide up and fade in
   - Staggered animation for each detail line

**CSS Animation:**
```tsx
// Checkmark animation
<div className="animate-bounce-in">
  <svg className="w-16 h-16 text-green-400">
    {/* Checkmark path with stroke animation */}
  </svg>
</div>

// Tailwind config
{
  'bounce-in': 'bounce-in 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}

@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

### 8.3 Account Summary Card

**Component Specification:**

```typescript
interface AccountSummaryCardProps {
  accountName: string;
  addressType: AddressType;
  firstAddress: string;
  balance?: string;  // Optional, shown if already fetched
  balanceLoading?: boolean;
}
```

**Visual Design:**
```tsx
<div className="bg-gray-850 border border-gray-700 rounded-xl p-6">
  {/* Account Name */}
  <div className="flex items-center gap-2 mb-4">
    <h3 className="text-lg font-semibold text-white">
      {accountName}
    </h3>
    <span className="px-2 py-1 bg-bitcoin/20 text-bitcoin text-xs font-medium rounded">
      Non-HD
    </span>
  </div>

  {/* Address Type */}
  <div className="mb-3">
    <span className="text-sm text-gray-400">Address Type: </span>
    <span className="text-sm text-white font-medium">{addressType}</span>
  </div>

  {/* First Address */}
  <div className="mb-3">
    <span className="text-sm text-gray-400 block mb-1">First Address</span>
    <div className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-lg p-3">
      <span className="flex-1 font-mono text-xs text-white break-all">
        {firstAddress}
      </span>
      <button
        onClick={handleCopyAddress}
        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <ClipboardIcon className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  </div>

  {/* Balance */}
  {balanceLoading ? (
    <div className="flex items-center gap-2 text-sm text-gray-400">
      <Spinner className="w-4 h-4" />
      <span>Fetching balance...</span>
    </div>
  ) : balance !== undefined ? (
    <div>
      <span className="text-sm text-gray-400">Balance: </span>
      <span className="text-lg text-white font-semibold">{balance} tBTC</span>
    </div>
  ) : null}
</div>
```

### 8.4 Unlock Wallet Button

**Primary CTA:**
```tsx
<button
  onClick={handleUnlockWallet}
  className="w-full bg-bitcoin text-white py-3 px-6 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
>
  Unlock Wallet
</button>
```

**Behavior:**
- Redirects to UnlockScreen component
- Pre-focuses password input
- After unlock, navigates to Dashboard

### 8.5 First-Time User Guidance

**Dashboard Banner (After First Unlock):**
```
┌────────────────────────────────────────────────────┐
│  👋 Welcome to Your Wallet!                        │
│  ───────────────────────────────────────────────   │
│  Your wallet has been imported successfully. Here's│
│  what you can do:                                   │
│                                                     │
│  • Receive Bitcoin to your address                 │
│  • Send Bitcoin to others                          │
│  • View your transaction history                   │
│  • Export your private key for backup              │
│                                                     │
│  ⚠️ Remember: This wallet uses a single address.    │
│     Consider migrating to a seed phrase wallet for │
│     better privacy.                                 │
│                                                     │
│  [Got It]                                          │
└────────────────────────────────────────────────────┘
```

**Visual Design:**
- Background: `bg-blue-500/10`
- Border: `border border-blue-500/30`
- Icon: `text-blue-400`
- Bullet points: `text-blue-200`
- Warning: `text-yellow-300`
- Dismissible: Stored in settings (shown once)

---

## 9. Component Specifications

### 9.1 Main Component: `PrivateKeyImportTab`

**Component Architecture:**

```typescript
interface PrivateKeyImportTabProps {
  onSetupComplete: () => void;
}

const PrivateKeyImportTab: React.FC<PrivateKeyImportTabProps> = ({
  onSetupComplete
}) => {
  // State management
  const [importMethod, setImportMethod] = useState<'file' | 'paste'>('paste');
  const [wifString, setWifString] = useState('');
  const [wifFile, setWifFile] = useState<File | null>(null);
  const [filePassword, setFilePassword] = useState('');
  const [walletPassword, setWalletPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountName, setAccountName] = useState('Imported Account');
  const [selectedAddressType, setSelectedAddressType] = useState<AddressType | null>(null);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  // Validation state
  const [wifValidation, setWifValidation] = useState<WIFValidationResult | null>(null);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [decryptedWIF, setDecryptedWIF] = useState<string | null>(null);

  // UI state
  const [currentStep, setCurrentStep] = useState<ImportStep>('input-method');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handlers
  const handleFileUpload = async (file: File) => { /* ... */ };
  const handleWIFPaste = (value: string) => { /* ... */ };
  const handleFileDecrypt = async () => { /* ... */ };
  const handleImportWallet = async () => { /* ... */ };

  // Render logic
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <ImportStepIndicator currentStep={currentStep} />

      {/* Input method selector */}
      <SegmentedControl
        options={[
          { value: 'file', label: 'Upload File' },
          { value: 'paste', label: 'Paste WIF' }
        ]}
        value={importMethod}
        onChange={setImportMethod}
      />

      {/* Conditional content based on import method */}
      {importMethod === 'file' ? (
        <FileUpload /* ... */ />
      ) : (
        <WIFTextarea /* ... */ />
      )}

      {/* File password (if encrypted) */}
      {isEncrypted && !decryptedWIF && (
        <FilePasswordField /* ... */ />
      )}

      {/* Address type selection (if WIF validated) */}
      {wifValidation?.valid && decryptedWIF && (
        <AddressTypeSelector /* ... */ />
      )}

      {/* Wallet password fields */}
      {selectedAddressType && (
        <>
          <WalletPasswordField /* ... */ />
          <PasswordStrengthMeter password={walletPassword} />
          <ConfirmPasswordField /* ... */ />
        </>
      )}

      {/* Account name */}
      {selectedAddressType && (
        <AccountNameField /* ... */ />
      )}

      {/* Privacy warning */}
      {selectedAddressType && (
        <PrivacyAcknowledgment /* ... */ />
      )}

      {/* Error display */}
      {error && <ErrorBanner /* ... */ />}

      {/* Import button */}
      <button
        onClick={handleImportWallet}
        disabled={!canImport()}
        className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Importing Wallet...' : 'Import Wallet'}
      </button>
    </div>
  );
};
```

### 9.2 Sub-Components

**Component Hierarchy:**
```
PrivateKeyImportTab/
├── ImportStepIndicator
├── SegmentedControl (Input Method Selector)
├── FileUpload
│   ├── DropZone
│   └── FilePreview
├── WIFTextarea
│   ├── ValidationFeedback
│   └── NetworkBadge
├── FilePasswordField
│   └── ShowHideToggle
├── AddressTypeSelector
│   ├── AddressTypeRadioCard (×3)
│   └── HelpAccordion
├── WalletPasswordField
│   └── ShowHideToggle
├── PasswordStrengthMeter
│   ├── ProgressBar
│   └── RequirementsList
├── ConfirmPasswordField
├── AccountNameField
├── PrivacyAcknowledgment
│   ├── WarningIcon
│   ├── CheckboxInput
│   └── LearnMoreLink
├── ErrorBanner
└── ImportButton
```

### 9.3 TypeScript Interfaces

```typescript
// Enums
type ImportMethod = 'file' | 'paste';
type ImportStep =
  | 'input-method'
  | 'provide-wif'
  | 'file-password'
  | 'address-type'
  | 'wallet-password'
  | 'privacy-warning'
  | 'importing';

// Validation
interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  compressed?: boolean;
  encrypted?: boolean;
  availableAddressTypes?: AddressType[];
  error?: string;
}

// Address previews
interface AddressPreview {
  type: AddressType;
  address: string;
  prefix: string;
  recommended: boolean;
}

// Form state
interface PrivateKeyImportFormState {
  importMethod: ImportMethod;
  wifString: string;
  wifFile: File | null;
  filePassword: string;
  walletPassword: string;
  confirmPassword: string;
  accountName: string;
  selectedAddressType: AddressType | null;
  privacyAcknowledged: boolean;
}

// Component props
interface PrivateKeyImportTabProps {
  onSetupComplete: () => void;
}

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  selectedFile: File | null;
  disabled?: boolean;
  error?: string;
}

interface WIFTextareaProps {
  value: string;
  onChange: (value: string) => void;
  validation: WIFValidationResult | null;
  disabled?: boolean;
}

interface AddressTypeSelectorProps {
  wif: string;
  network: 'testnet' | 'mainnet';
  compressed: boolean;
  selectedType: AddressType | null;
  onSelect: (type: AddressType) => void;
  addresses: AddressPreview[];
}

interface PrivacyAcknowledgmentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onLearnMore: () => void;
  onCreateSeedWallet: () => void;
}
```

### 9.4 State Management

**Local State (useState):**
- Form inputs (passwords, WIF, file)
- Validation results
- UI state (loading, errors, steps)

**No Global State Required:**
- Component is isolated within WalletSetup
- No need for context or Redux
- All state resets when component unmounts

**State Persistence:**
- None required (setup is one-time)
- Do NOT persist sensitive data (WIF, passwords)

---

## 10. Accessibility

### 10.1 ARIA Labels and Roles

**Tab Navigation:**
```tsx
<div role="tablist" aria-label="Wallet setup options">
  <button
    role="tab"
    aria-selected={activeTab === 'create'}
    aria-controls="create-panel"
    id="create-tab"
  >
    Create New
  </button>
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

**Form Fields:**
```tsx
<label htmlFor="wif-input" className="sr-only">
  WIF Private Key
</label>
<textarea
  id="wif-input"
  aria-describedby="wif-help wif-validation"
  aria-invalid={wifValidation?.valid === false}
  aria-required="true"
/>
<div id="wif-help" className="text-xs text-gray-500">
  Paste your WIF private key here
</div>
<div id="wif-validation" role="alert" aria-live="polite">
  {wifValidation?.error && `Error: ${wifValidation.error}`}
</div>
```

**Radio Cards:**
```tsx
<fieldset>
  <legend className="text-sm font-medium text-gray-300 mb-2">
    Address Type
  </legend>
  <div role="radiogroup" aria-labelledby="address-type-label">
    <div
      role="radio"
      aria-checked={selectedType === 'legacy'}
      aria-labelledby="legacy-label"
      tabIndex={selectedType === 'legacy' ? 0 : -1}
    >
      <span id="legacy-label">Legacy (P2PKH)</span>
    </div>
    {/* ... */}
  </div>
</fieldset>
```

### 10.2 Keyboard Navigation

**Focus Management:**
- Tab order follows visual flow (top to bottom)
- Focus trap within modal dialogs
- Auto-focus first input when tab activates
- Focus returns to trigger element when modal closes

**Keyboard Shortcuts:**
| Key | Action |
|-----|--------|
| `Tab` | Move focus forward |
| `Shift+Tab` | Move focus backward |
| `Arrow Left/Right` | Navigate between main tabs |
| `Arrow Up/Down` | Navigate between radio options |
| `Enter` / `Space` | Activate button or toggle checkbox |
| `Esc` | Close modal or cancel operation |

**Focus Indicators:**
```css
/* Tailwind focus ring */
.focus:outline-none
.focus:ring-2
.focus:ring-bitcoin
.focus:ring-offset-2
.focus:ring-offset-gray-850
```

### 10.3 Screen Reader Support

**Announcements:**
```tsx
// Success announcement
<div role="status" aria-live="polite" className="sr-only">
  {successMessage && `Success: ${successMessage}`}
</div>

// Error announcement
<div role="alert" aria-live="assertive" className="sr-only">
  {error && `Error: ${error}`}
</div>

// Loading announcement
<div role="status" aria-live="polite" aria-busy={isLoading} className="sr-only">
  {isLoading && 'Importing wallet, please wait'}
</div>
```

**Screen Reader Only Text:**
```tsx
// For icon-only buttons
<button aria-label="Show password">
  <EyeIcon className="w-5 h-5" aria-hidden="true" />
  <span className="sr-only">Show password</span>
</button>

// For decorative icons
<svg aria-hidden="true" focusable="false">
  {/* Icon content */}
</svg>
```

### 10.4 Color Contrast

**WCAG AA Compliance** (minimum 4.5:1 for text):

| Element | Text | Background | Ratio |
|---------|------|-----------|-------|
| **Primary text** | `#FFFFFF` | `#111827` (gray-900) | 15.3:1 ✓ |
| **Secondary text** | `#9CA3AF` (gray-400) | `#111827` | 7.1:1 ✓ |
| **Bitcoin orange** | `#F7931A` | `#FFFFFF` | 3.8:1 ⚠️ |
| **Bitcoin on dark** | `#F7931A` | `#111827` | 4.2:1 ⚠️ |
| **Success** | `#10B981` (green-500) | `#111827` | 4.9:1 ✓ |
| **Error** | `#EF4444` (red-500) | `#111827` | 4.7:1 ✓ |
| **Warning** | `#F59E0B` (yellow-500) | `#111827` | 5.3:1 ✓ |

**Fix for Bitcoin Orange:**
- Use `#FFA726` (lighter orange) for text on dark backgrounds (4.5:1 ratio)
- Keep `#F7931A` for buttons and large elements (3:1 minimum for large text)

### 10.5 Error Message Accessibility

**Requirements:**
- Error messages must be programmatically associated with inputs
- Use `aria-describedby` to link error to field
- Use `aria-invalid="true"` when field has error
- Errors announced via `aria-live="assertive"`

**Example:**
```tsx
<div>
  <label htmlFor="password">Password</label>
  <input
    id="password"
    type="password"
    aria-describedby="password-error password-requirements"
    aria-invalid={passwordError ? 'true' : 'false'}
  />
  <div id="password-requirements" className="text-xs text-gray-500">
    Must be at least 8 characters
  </div>
  {passwordError && (
    <div id="password-error" role="alert" className="text-xs text-red-400">
      {passwordError}
    </div>
  )}
</div>
```

---

## 11. Responsive Design

### 11.1 Breakpoints

**Tailwind Breakpoints:**
| Breakpoint | Min Width | Target Device |
|-----------|-----------|--------------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Desktops |
| `xl` | 1280px | Large desktops |
| `2xl` | 1536px | XL desktops |

**Extension Target:**
- Primary: 600px × 400px (Chrome extension popup)
- Secondary: 800px × 600px (tab view)
- Mobile: Not applicable (desktop extension)

### 11.2 Responsive Layout

**Popup View (600×400):**
```
┌────────────────────────────────────┐ 600px
│  [Create] [Import Seed]             │
│  [Import Private Key]               │
│  ─────────────────                  │
│                                     │
│  (Scrollable content)               │
│                                     │
│  Input fields                       │
│  Address selection                  │
│  Password fields                    │
│                                     │
│  [Import Wallet]                   │
└────────────────────────────────────┘
  ↑                                 ↑
  16px padding                  16px
```

**Tab View (800×600):**
```
┌──────────────────────────────────────────┐ 800px
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │  [Create] [Import Seed]              │ │
│  │  [Import Private Key]                │ │
│  │  ─────────────────                   │ │
│  │                                      │ │
│  │  (More spacious layout)              │ │
│  │                                      │ │
│  │  Wider input fields                  │ │
│  │  Side-by-side address cards          │ │
│  │                                      │ │
│  │  [Import Wallet]                    │ │
│  └─────────────────────────────────────┘ │
│                                           │
└──────────────────────────────────────────┘
```

### 11.3 Responsive Components

**Address Type Cards:**

**Popup (600px):** Stacked vertically
```
┌──────────────────────────┐
│ ○ Legacy                  │
│   mzBc4XE...             │
└──────────────────────────┘
┌──────────────────────────┐
│ ○ SegWit                  │
│   2MzQwS...              │
└──────────────────────────┘
┌──────────────────────────┐
│ ● Native SegWit           │
│   tb1qw50...             │
└──────────────────────────┘
```

**Tab (800px):** Side-by-side grid
```
┌─────────────┬─────────────┬─────────────┐
│ ○ Legacy    │ ○ SegWit    │ ● Native SW │
│   mzBc4X... │   2MzQw...  │   tb1qw5... │
└─────────────┴─────────────┴─────────────┘
```

**CSS:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {addressTypes.map(type => (
    <AddressTypeRadioCard key={type} {...type} />
  ))}
</div>
```

### 11.4 Scrolling Behavior

**Popup View:**
- Enable vertical scroll when content exceeds 400px height
- Sticky "Import Wallet" button at bottom
- Scroll shadows to indicate more content

**CSS:**
```tsx
<div className="h-full overflow-y-auto pb-20">
  {/* Scrollable content */}
</div>

<div className="fixed bottom-0 left-0 right-0 bg-gray-850 border-t border-gray-700 p-4">
  <button>Import Wallet</button>
</div>
```

---

## 12. Animation & Transitions

### 12.1 Page Transitions

**Tab Switching:**
```css
/* Fade out current tab */
.tab-exit {
  opacity: 1;
}
.tab-exit-active {
  opacity: 0;
  transition: opacity 200ms ease-out;
}

/* Fade in new tab */
.tab-enter {
  opacity: 0;
}
.tab-enter-active {
  opacity: 1;
  transition: opacity 200ms ease-in 100ms;
}
```

**Step Progression:**
```css
/* Slide up animation for new content */
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.step-enter {
  animation: slide-up 300ms ease-out;
}
```

### 12.2 Micro-Interactions

**Button Hover:**
```css
.btn-primary {
  transition: all 200ms ease;
}
.btn-primary:hover {
  background-color: #E88517; /* Darker orange */
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(247, 147, 26, 0.3);
}
.btn-primary:active {
  transform: scale(0.98);
}
```

**Validation Feedback:**
```css
/* Border pulse on valid input */
@keyframes border-pulse {
  0%, 100% { border-color: #10B981; }
  50% { border-color: #34D399; }
}

.input-valid {
  animation: border-pulse 1s ease-in-out;
}
```

**Success Checkmark:**
```css
@keyframes checkmark-draw {
  0% {
    stroke-dashoffset: 100;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

.checkmark-path {
  stroke-dasharray: 100;
  animation: checkmark-draw 0.5s ease-out forwards;
}
```

### 12.3 Loading States

**Spinner:**
```tsx
<svg className="animate-spin h-5 w-5 text-bitcoin" viewBox="0 0 24 24">
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
```

**Progress Bar (for file upload):**
```tsx
<div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
  <div
    className="h-full bg-bitcoin transition-all duration-300 ease-out"
    style={{ width: `${progress}%` }}
  />
</div>
```

**Skeleton Loading (for address preview):**
```tsx
<div className="animate-pulse">
  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
  <div className="h-3 bg-gray-700 rounded w-1/2" />
</div>
```

---

## 13. Design Tokens

### 13.1 Color Palette

**Brand Colors:**
```css
--bitcoin: #F7931A;
--bitcoin-hover: #E88517;
--bitcoin-active: #D97714;
--bitcoin-light: #FFA726;
```

**Neutral Colors:**
```css
--gray-950: #0A0A0A;
--gray-900: #111827;
--gray-850: #1A1F2E;
--gray-800: #1F2937;
--gray-700: #374151;
--gray-600: #4B5563;
--gray-500: #6B7280;
--gray-400: #9CA3AF;
--gray-300: #D1D5DB;
--gray-200: #E5E7EB;
--gray-100: #F3F4F6;
--white: #FFFFFF;
```

**Semantic Colors:**
```css
/* Success */
--success: #10B981;
--success-bg: rgba(16, 185, 129, 0.1);
--success-border: rgba(16, 185, 129, 0.3);

/* Error */
--error: #EF4444;
--error-bg: rgba(239, 68, 68, 0.15);
--error-border: rgba(239, 68, 68, 0.3);

/* Warning */
--warning: #F59E0B;
--warning-bg: rgba(245, 158, 11, 0.1);
--warning-border: rgba(245, 158, 11, 0.3);

/* Info */
--info: #3B82F6;
--info-bg: rgba(59, 130, 246, 0.1);
--info-border: rgba(59, 130, 246, 0.3);
```

### 13.2 Typography

**Font Family:**
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'Roboto Mono', 'Courier New', monospace;
```

**Font Sizes:**
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
```

**Font Weights:**
```css
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

**Line Heights:**
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 13.3 Spacing

**Spacing Scale:**
```css
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
```

**Component Spacing:**
```css
/* Form fields */
--field-gap: 1rem;           /* gap-4 between fields */
--field-padding-x: 1rem;     /* px-4 inside inputs */
--field-padding-y: 0.75rem;  /* py-3 inside inputs */

/* Sections */
--section-gap: 1.5rem;       /* gap-6 between sections */
--section-padding: 2rem;     /* p-8 inside cards */

/* Buttons */
--button-padding-x: 1.5rem;  /* px-6 */
--button-padding-y: 0.75rem; /* py-3 */
```

### 13.4 Border Radius

```css
--radius-sm: 0.375rem;   /* 6px - small elements */
--radius-md: 0.5rem;     /* 8px - inputs */
--radius-lg: 0.75rem;    /* 12px - cards */
--radius-xl: 1rem;       /* 16px - modals */
--radius-2xl: 1.5rem;    /* 24px - large cards */
--radius-full: 9999px;   /* Pills, circles */
```

### 13.5 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

/* Bitcoin glow */
--shadow-bitcoin: 0 0 0 4px rgba(247, 147, 26, 0.12);
```

---

## 14. Implementation Priorities

### 14.1 Phase 1: Core Import Flow (MVP)

**Priority:** P0 (Must-Have)

**Components:**
- ✅ Third tab in WalletSetup
- ✅ Upload File / Paste WIF selector
- ✅ WIF textarea with validation
- ✅ File upload component
- ✅ Address type selector (3 radio cards)
- ✅ Wallet password fields
- ✅ Import button
- ✅ Success screen

**Features:**
- ✅ Real-time WIF validation
- ✅ Auto-detect encryption
- ✅ File password decryption
- ✅ Address preview for all 3 types
- ✅ Network validation
- ✅ Error handling

**Testing:**
- Unit tests for validation logic
- Integration tests for import flow
- Manual testing on testnet

---

### 14.2 Phase 2: Enhanced UX (Post-MVP)

**Priority:** P1 (Should-Have)

**Components:**
- ✅ Password strength meter
- ✅ Privacy warning banner
- ✅ Mandatory privacy acknowledgment
- ✅ Help accordion (address type guide)
- ✅ Account name field
- ✅ Dashboard banner for non-HD wallets

**Features:**
- ✅ Drag-drop file upload
- ✅ Show/hide password toggles
- ✅ Copy address button
- ✅ Loading states with animations
- ✅ Success animation (checkmark)

**Testing:**
- Accessibility testing
- UX testing with users
- Edge case testing

---

### 14.3 Phase 3: Polish & Optimization (Nice-to-Have)

**Priority:** P2 (Enhancement)

**Components:**
- 📋 Step indicator (progress bar)
- 📋 QR code display for first address
- 📋 Balance preview before import
- 📋 Migration wizard UI

**Features:**
- 📋 Auto-save form progress (localStorage)
- 📋 Keyboard shortcuts
- 📋 Animations for all transitions
- 📋 Dark mode refinements

**Testing:**
- Performance testing
- Cross-browser testing
- Responsive design testing

---

## 15. Design Handoff Checklist

**For Frontend Developer:**

- [ ] All wireframes reviewed and approved
- [ ] Component specifications documented
- [ ] TypeScript interfaces defined
- [ ] Color palette and design tokens provided
- [ ] Accessibility requirements understood
- [ ] Error handling strategy clear
- [ ] Animation specifications provided
- [ ] Responsive breakpoints defined

**Assets Needed:**
- [ ] SVG icons (checkmark, warning, info, error)
- [ ] Loading spinner SVG
- [ ] Font files (if custom fonts)

**Backend Integration:**
- [ ] Message types defined (`CREATE_WALLET_FROM_PRIVATE_KEY`)
- [ ] Validation endpoints identified
- [ ] Error codes mapped to user messages
- [ ] Success response format agreed

**Testing:**
- [ ] Accessibility testing plan
- [ ] Manual QA test cases
- [ ] Unit test requirements
- [ ] Integration test scenarios

---

## Conclusion

This UX design specification provides a complete, implementation-ready blueprint for the "Import Private Key" feature during wallet setup. The design prioritizes:

1. **User Recovery**: Optimized for users who lost access and need to restore funds
2. **Security**: Clear warnings about privacy implications and non-HD wallet limitations
3. **Clarity**: Step-by-step guided flow with progressive disclosure
4. **Accessibility**: WCAG AA compliant with full keyboard navigation
5. **Error Tolerance**: Helpful validation and recovery suggestions

**Next Steps:**
1. Frontend Developer implements components per specification
2. UI/UX Designer updates expert notes with design decisions
3. Security Expert reviews privacy warnings for adequacy
4. QA Engineer tests implementation against design spec

---

**Document Version**: 1.0
**Status**: ✅ Ready for Implementation
**Estimated Implementation Time**: 2-3 sprints
**Designer**: UI/UX Expert
**Date**: 2025-10-22

---

**END OF UX DESIGN SPECIFICATION**
