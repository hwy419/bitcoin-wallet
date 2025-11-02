# Wallet Backup Import/Restore - Complete UX Design Specification

**Feature:** Wallet Backup Import and Restore System
**Version:** 1.0
**Date:** October 26, 2025
**Designer:** UI/UX Designer
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [User Flow Diagrams](#user-flow-diagrams)
3. [Import Scenarios](#import-scenarios)
4. [Modal Specifications](#modal-specifications)
5. [Integration Points](#integration-points)
6. [Visual Design System](#visual-design-system)
7. [Interaction Design](#interaction-design)
8. [Error Handling UX](#error-handling-ux)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Responsive Design](#responsive-design)
11. [Implementation Checklist](#implementation-checklist)

---

## 1. Overview

### 1.1 Feature Purpose

Allow users to import encrypted wallet backup files to:
- Restore wallet on a new device
- Recover wallet after browser corruption
- Migrate wallet from old computer to new computer
- Restore exact wallet state (accounts, contacts, settings)

### 1.2 Two Import Scenarios

**Scenario A: Fresh Install** (No existing wallet)
- User is setting up wallet for first time
- Choose "Import from Backup" during setup
- Simple flow: Select File → Enter Password → Create Wallet Password → Success

**Scenario B: Replace Existing Wallet** (Wallet already exists)
- User wants to replace current wallet with backup
- Initiated from Settings screen
- Scary warnings about deleting current wallet
- Flow: Warning → Confirm → Select File → Enter Password → Success

### 1.3 Design Philosophy

**Security-First UX:**
- Prominent warnings for destructive actions (replace wallet)
- Clear explanations at each step
- Progress transparency (show what's happening)
- Success confirmation with details

**Progressive Disclosure:**
- One concept per modal
- Clear "what happens next" guidance
- Step-by-step validation

**Trust & Transparency:**
- Show what was restored
- Explain network changes
- Provide verification details

### 1.4 Key Differences from Export

| Aspect | Export | Import |
|--------|--------|--------|
| **Entry Points** | Settings only | Wallet Setup + Settings |
| **Scenarios** | One (always creates backup) | Two (fresh vs replace) |
| **Warnings** | Security best practices | Destructive action warnings |
| **Passwords** | Create backup password | Enter backup password + create wallet password |
| **Outcome** | File download | Wallet restored |

---

## 2. User Flow Diagrams

### 2.1 Scenario A: Fresh Install (No Existing Wallet)

```
Wallet Setup Screen
    │
    ├── [Create New] tab
    ├── [Import Seed] tab
    └── [Import from Backup] tab  ← NEW
            │
            ▼
┌────────────────────────────────────────┐
│ MODAL 1: File Selection                │
│ 📁 Import Wallet Backup                │
│                                         │
│ Drag & drop .dat file here or browse   │
│                                         │
│ [Browse Files]                          │
│                                         │
│ Supported: .dat files only              │
│ Max size: 10 MB                         │
│                                         │
│ [Cancel]                                │
└────────────────────────────────────────┘
    │ (file selected)
    ▼
┌────────────────────────────────────────┐
│ MODAL 2: Backup Password                │
│ 🔑 Enter Backup Password                │
│                                         │
│ Enter the password you created when     │
│ exporting this backup.                  │
│                                         │
│ Password: [••••••••••] [👁]            │
│                                         │
│ [Back] [Cancel] [Decrypt & Import →]   │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 3: Import Progress                │
│ 🔐 Importing Wallet Backup...           │
│                                         │
│ [Spinner Animation]                     │
│                                         │
│ Progress: [█████████░░] 75%            │
│                                         │
│ Current step:                           │
│ "Restoring contacts..."                 │
│                                         │
│ ⚠️  Do not close this window            │
└────────────────────────────────────────┘
    │ (automatic progression)
    ▼
┌────────────────────────────────────────┐
│ MODAL 4: Set Wallet Password            │
│ 🔐 Create Wallet Password               │
│                                         │
│ This password will unlock your wallet.  │
│ It can be different from the backup     │
│ password you just entered.              │
│                                         │
│ Password: [••••••••] [👁]              │
│ Confirm:  [••••••••] [👁]              │
│                                         │
│ [Cancel] [Create Wallet →]              │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ MODAL 5: Import Success                 │
│ ✅ Wallet Successfully Restored         │
│                                         │
│ Your wallet has been restored from the  │
│ backup file.                            │
│                                         │
│ ┌──────────────────────────────────┐   │
│ │ 📊 Restored:                     │   │
│ │    • 5 Single-Sig Accounts       │   │
│ │    • 2 Multisig Accounts         │   │
│ │    • 12 Contacts                 │   │
│ │    • All Settings                │   │
│ │                                  │   │
│ │ 🌐 Network: Testnet              │   │
│ │ 📅 Backup Created: Oct 20, 2025  │   │
│ └──────────────────────────────────┘   │
│                                         │
│ You can now unlock your wallet with the │
│ password you just created.              │
│                                         │
│           [Get Started]                 │
└────────────────────────────────────────┘
```

### 2.2 Scenario B: Replace Existing Wallet

```
Settings Screen (Advanced Section)
    │
    ▼
[📥 Import Backup & Replace Wallet] button
    │
    ▼
┌────────────────────────────────────────┐
│ ⚠️  WARNING: Replace Existing Wallet   │
│                                         │
│ Importing a backup will PERMANENTLY    │
│ replace your current wallet.            │
│                                         │
│ Your current wallet has:                │
│ • 3 Accounts                            │
│ • 8 Contacts                            │
│ • Created: Oct 15, 2025                 │
│                                         │
│ ⚠️  This action CANNOT be undone!      │
│                                         │
│ Recommended: Export your current wallet │
│ before importing a backup.              │
│                                         │
│ [Export Current Wallet First]           │
│ [Cancel]                                │
│ [I Understand, Replace Wallet →]       │
└────────────────────────────────────────┘
    │
    ▼
┌────────────────────────────────────────┐
│ 🔐 Confirm Current Wallet Password      │
│                                         │
│ To prevent accidental deletion, please  │
│ confirm your current wallet password.   │
│                                         │
│ Password: [••••••••••] [👁]            │
│                                         │
│ [Cancel] [Confirm →]                    │
└────────────────────────────────────────┘
    │
    ▼
[Continue with same flow as Scenario A: File Selection → Backup Password → Import Progress → Success]
    │
    │ (Note: Skip "Create Wallet Password" step - use current password)
    ▼
┌────────────────────────────────────────┐
│ MODAL: Import Success (Replace Variant) │
│ ✅ Wallet Successfully Replaced         │
│                                         │
│ Your old wallet has been replaced with  │
│ the imported backup.                    │
│                                         │
│ ┌──────────────────────────────────┐   │
│ │ 📊 Restored:                     │   │
│ │    • 5 Single-Sig Accounts       │   │
│ │    • 2 Multisig Accounts         │   │
│ │    • 12 Contacts                 │   │
│ │    • All Settings                │   │
│ │                                  │   │
│ │ 🌐 Network: Testnet              │   │
│ │ 📅 Backup Created: Oct 20, 2025  │   │
│ └──────────────────────────────────┘   │
│                                         │
│ Your wallet is now unlocked with your   │
│ existing password.                      │
│                                         │
│           [Done]                        │
└────────────────────────────────────────┘
```

### 2.3 Navigation Map

**Scenario A (Fresh Install):**
1. File Selection → [Cancel] returns to Wallet Setup | File selected proceeds to 2
2. Backup Password → [Back] to 1 | [Cancel] to Setup | [Decrypt] proceeds to 3
3. Import Progress → Automatic progression (no user controls)
4. Set Wallet Password → [Cancel] aborts import | [Create] proceeds to 5
5. Import Success → [Get Started] closes modal and unlocks wallet

**Scenario B (Replace Existing):**
1. Replace Warning → [Cancel] returns to Settings | [Export First] opens export flow | [Replace] proceeds to 2
2. Confirm Password → [Cancel] returns to Settings | [Confirm] proceeds to 3
3. File Selection → Same as Scenario A
4. Backup Password → Same as Scenario A
5. Import Progress → Same as Scenario A
6. Import Success → [Done] returns to Settings (wallet replaced)

---

## 3. Import Scenarios

### 3.1 Scenario A: Fresh Install Details

**Context:**
- User has no wallet yet
- Wallet Setup screen is showing
- User has backup file from another device

**Entry Point:**
- Wallet Setup Screen → "Import from Backup" tab

**User Journey:**
1. Click "Import from Backup" tab
2. Drag-drop .dat file or browse files
3. Enter backup password
4. Wait for import (10-30 seconds)
5. Create new wallet password
6. See success confirmation
7. Wallet is ready to use

**Success Criteria:**
- All accounts restored with correct balances
- All contacts restored
- Settings restored (network, auto-lock)
- User can unlock wallet with new password
- No data loss

### 3.2 Scenario B: Replace Existing Wallet Details

**Context:**
- User already has a wallet
- Wants to replace it with backup (device migration, restore old wallet)
- Initiated from Settings screen

**Entry Point:**
- Settings Screen → Advanced Section → "Import Backup & Replace Wallet"

**User Journey:**
1. Click "Import Backup & Replace Wallet"
2. See scary warning about deleting current wallet
3. Option to export current wallet first (recommended)
4. Confirm current wallet password
5. Drag-drop .dat file or browse files
6. Enter backup password
7. Wait for import (10-30 seconds)
8. See success confirmation
9. Current wallet replaced, use same password

**Success Criteria:**
- Old wallet completely replaced
- New wallet data loaded correctly
- User can still unlock with existing password
- Clear confirmation of what was replaced

### 3.3 Network Mismatch Scenario

**Context:**
- Backup is for different network than current setting
- Example: Backup is mainnet, wallet is set to testnet

**Additional Modal Shown:**

```
┌────────────────────────────────────────┐
│ ⚠️  Network Mismatch Warning            │
│                                         │
│ This backup is for MAINNET but your     │
│ wallet is set to TESTNET.               │
│                                         │
│ Importing will change your network      │
│ setting to MAINNET.                     │
│                                         │
│ Are you sure you want to continue?      │
│                                         │
│ [Cancel] [Change to Mainnet & Import]   │
└────────────────────────────────────────┘
```

**Placement:** Shown after backup password validation, before import progress

---

## 4. Modal Specifications

### 4.1 Modal 1A: File Selection (Fresh Install)

**Purpose:** Allow user to select backup file

**Modal Dimensions:**
- **Width:** `max-w-lg` (512px)
- **Padding:** `p-6`
- **Background:** `bg-gray-850 border border-gray-700`

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  📁  Import Wallet Backup                              │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Select your encrypted wallet backup file to restore   │
│  your accounts, contacts, and settings.                │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │            [Drag & Drop Zone]                   │  │
│  │                                                  │  │
│  │    📁                                           │  │
│  │    Drag & drop your .dat file here              │  │
│  │    or                                            │  │
│  │    [Browse Files]                               │  │
│  │                                                  │  │
│  │    Supported: .dat files only                   │  │
│  │    Max size: 10 MB                              │  │
│  │                                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [File selected: bitcoin-wallet-backup-2025-10-20.dat] │
│  24.3 KB • Selected Oct 26, 2025                       │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │     Cancel      │  │     Continue  →             │ │
│  └─────────────────┘  └─────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: 📁 (folder)
- Title: "Import Wallet Backup"
- Typography: `text-xl font-bold text-white`
- Spacing: `mb-4`

**Instructions:**
- Text: `text-sm text-gray-300 mb-6`

**Drag & Drop Zone:**
- Container: `border-2 border-dashed border-gray-700 rounded-xl p-8 mb-4`
- Hover state: `border-bitcoin bg-bitcoin-subtle`
- Active (dragging): `border-bitcoin bg-bitcoin-subtle scale-[1.02]`
- Center content: `flex flex-col items-center justify-center text-center`
- Min height: `min-h-[240px]`

**Zone Content:**
- Icon: 📁 `text-6xl mb-4 text-gray-600`
- Text: "Drag & drop your .dat file here" `text-base text-gray-400 mb-2`
- "or" `text-sm text-gray-500 mb-3`
- Browse button: `bg-gray-800 hover:bg-gray-750 text-white px-6 py-2 rounded-lg font-semibold`
- Help text: `text-xs text-gray-500 mt-4`

**File Selected State:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4`
- File icon: 📄 `text-bitcoin`
- Filename: `text-sm font-mono text-white`
- File info: `text-xs text-gray-500`
- Remove button: `text-xs text-red-400 hover:text-red-300`

**Buttons:**
- Container: `flex space-x-3 mt-6`
- Cancel: `flex-1 bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold`
- Continue: `flex-1 bg-bitcoin hover:bg-bitcoin-hover text-white py-3 px-6 rounded-lg font-semibold`
  - Disabled if no file selected: `disabled:bg-gray-700 disabled:cursor-not-allowed`

**File Validation:**
- Accept only `.dat` files
- Max size: 10 MB
- Show error if wrong file type: `bg-red-500/15 border border-red-500/30 text-red-300`

---

### 4.2 Modal 1B: Replace Warning (Existing Wallet)

**Purpose:** Warn user about destructive action

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  ⚠️  WARNING: Replace Existing Wallet                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Importing a backup will PERMANENTLY replace your      │
│  current wallet. This action cannot be undone.         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Your Current Wallet                            │  │
│  │                                                  │  │
│  │  • 3 Single-Sig Accounts                        │  │
│  │  • 1 Multisig Account (2-of-3)                  │  │
│  │  • 8 Contacts                                   │  │
│  │  • Created: October 15, 2025                    │  │
│  │  • Network: Testnet                             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ⚠️  CRITICAL WARNING                           │  │
│  │                                                  │  │
│  │  • All current accounts will be DELETED         │  │
│  │  • All contacts will be DELETED                 │  │
│  │  • This action CANNOT be undone                 │  │
│  │  • Make sure you have backups of current wallet │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Recommended: Export your current wallet before        │
│  importing a backup.                                   │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  💾 Export Current Wallet First              │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │     Cancel      │  │  I Understand, Replace  →   │ │
│  └─────────────────┘  └─────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: ⚠️ (red warning triangle)
- Title: "WARNING: Replace Existing Wallet"
- Typography: `text-xl font-bold text-red-300`
- Background: Add red accent `border-t-4 border-red-500`

**Intro Text:**
- `text-base text-gray-300 mb-6`
- Bold "PERMANENTLY" and "cannot be undone"

**Current Wallet Info Box:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6`
- Title: "Your Current Wallet" `text-sm font-bold text-white mb-3`
- Bullet list: `text-sm text-gray-300 space-y-2`
- Each bullet uses icon (•) and data

**Critical Warning Box:**
- Background: `bg-red-500/15 border border-red-500/30 rounded-lg p-4 mb-6`
- Icon: ⚠️ `text-red-400`
- Title: "CRITICAL WARNING" `text-xs font-bold text-red-300 mb-3`
- Bullets: `text-xs text-red-200 space-y-2`
- Bold key terms: DELETED, CANNOT be undone

**Recommendation:**
- `text-sm text-gray-400 mb-4`

**Export Button:**
- Full width: `w-full`
- Style: `bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 py-3 px-6 rounded-lg font-semibold mb-6`
- Icon: 💾

**Action Buttons:**
- Cancel: Standard gray button
- Replace: `bg-red-500 hover:bg-red-600 text-white` (dangerous action)
- Replace text: "I Understand, Replace Wallet →"

---

### 4.3 Modal 2: Confirm Current Wallet Password (Replace Only)

**Purpose:** Re-authenticate before allowing destructive action

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔐  Confirm Current Wallet Password                  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  To prevent accidental deletion, please confirm your   │
│  current wallet password.                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Current Wallet Password                        │  │
│  │  ┌───────────────────────────────────────────┐  │  │
│  │  │ •••••••••                          [👁]  │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [ERROR STATE - if wrong password:]                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ❌ Incorrect password. Please try again.       │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │     Cancel      │  │       Confirm  →            │ │
│  └─────────────────┘  └─────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

Same as export flow's wallet password modal (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 3.3).

**Key Points:**
- Lock icon: 🔐
- Clear explanation of why password is needed
- Password input with toggle visibility
- Error handling for incorrect password
- Non-blocking: User can retry immediately

---

### 4.4 Modal 3: Backup Password Entry

**Purpose:** Decrypt backup file with backup password

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔑  Enter Backup Password                            │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Enter the password you created when exporting this    │
│  backup file.                                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Backup Password                                │  │
│  │  ┌───────────────────────────────────────────┐  │  │
│  │  │ •••••••••••••                      [👁]  │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  💡 This is the password you created during export,    │
│     NOT your wallet password.                          │
│                                                         │
│  [ERROR STATE - if wrong password:]                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ❌ Incorrect backup password. Please try again.│  │
│  │     Make sure you're using the password you     │  │
│  │     created when exporting this backup.         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────┐  ┌─────────┐  ┌──────────────────────┐   │
│  │  Back  │  │ Cancel  │  │  Decrypt & Import →  │   │
│  └────────┘  └─────────┘  └──────────────────────┘   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: 🔑 (key)
- Title: "Enter Backup Password"
- Typography: `text-xl font-bold text-white`

**Instructions:**
- `text-sm text-gray-300 mb-6`

**Password Input:**
- Same styling as wallet password input
- Label: "Backup Password"
- Placeholder: "Enter backup password"
- Toggle visibility: Eye icon

**Hint Box:**
- Background: `bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4`
- Icon: 💡 `text-blue-400`
- Text: `text-xs text-blue-200`
- Explains difference between backup password and wallet password

**Error Message (Wrong Password):**
- Background: `bg-red-500/15 border border-red-500/30 rounded-lg p-3 mb-4`
- Icon: ❌
- Text: `text-sm text-red-300`
- Multi-line explanation
- Helpful recovery hint

**Buttons:**
- Three-button layout: `flex space-x-2`
- Back: `bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-4 rounded-lg font-semibold`
- Cancel: `bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-4 rounded-lg font-semibold`
- Decrypt: `flex-1 bg-bitcoin hover:bg-bitcoin-hover text-white py-3 px-6 rounded-lg font-semibold`
  - Disabled if password empty

---

### 4.5 Modal 4: Import Progress

**Purpose:** Show progress during decryption and import (10-30 seconds)

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔐  Importing Wallet Backup...                       │
├────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌───────────────┐                     │
│                  │               │                     │
│                  │   [SPINNER]   │                     │
│                  │               │                     │
│                  └───────────────┘                     │
│                                                         │
│             Restoring your wallet from backup...        │
│                                                         │
│                  This may take 10-30 seconds            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ██████████████░░░░░░░░░░░░░░░  75%             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Current step: Restoring contacts...                   │
│                                                         │
│                                                         │
│  ⚠️  Do not close this window                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

Same structure as export progress modal, different steps.

**Progress Steps:**

| Progress % | Step Description | Backend Operation |
|-----------|-----------------|-------------------|
| 0-10% | "Validating backup file..." | File validation, checksum |
| 11-25% | "Decrypting backup..." | PBKDF2 + AES-256-GCM |
| 26-40% | "Validating wallet data..." | JSON validation |
| 41-50% | "Migrating backup format..." | Version migration (if needed) |
| 51-75% | "Restoring accounts..." | Write accounts to storage |
| 76-90% | "Restoring contacts..." | Write contacts to storage |
| 91-100% | "Finalizing import..." | Complete setup |

**Modal Properties:**
- Non-dismissible: No close button, no escape key, no click outside
- `closeOnBackdropClick={false}`

**Styling:**
- Same as export progress modal (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 3.5)
- Different step messages

---

### 4.6 Modal 5A: Network Mismatch Warning (Conditional)

**Purpose:** Warn if backup network differs from current setting

**When Shown:** After backup decryption, if `backup.network !== currentNetwork`

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  ⚠️  Network Mismatch Warning                         │
├────────────────────────────────────────────────────────┤
│                                                         │
│  This backup is for MAINNET but your wallet is set to  │
│  TESTNET.                                              │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Backup Information                             │  │
│  │  • Network: Mainnet                             │  │
│  │  • Created: October 20, 2025                    │  │
│  │  • Accounts: 5                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ⚠️  What Will Happen                           │  │
│  │                                                  │  │
│  │  • Your network setting will change to MAINNET  │  │
│  │  • All addresses will be mainnet addresses      │  │
│  │  • You'll interact with Bitcoin MAINNET         │  │
│  │  • This uses REAL Bitcoin (not testnet coins)   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Are you sure you want to continue?                    │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │     Cancel      │  │  Change to Mainnet & Import │ │
│  └─────────────────┘  └─────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: ⚠️ (amber warning)
- Title: "Network Mismatch Warning"
- Typography: `text-xl font-bold text-amber-300`

**Explanation:**
- `text-base text-gray-300 mb-6`
- Bold network names (MAINNET, TESTNET)

**Backup Info Box:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6`
- Title: "Backup Information"
- Bullet list with backup details

**What Will Happen Box:**
- Background: `bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6`
- Icon: ⚠️ `text-amber-400`
- Title: "What Will Happen" `text-xs font-bold text-amber-300 mb-3`
- Bullets: `text-xs text-amber-200 space-y-2`
- Special warning if mainnet: "This uses REAL Bitcoin (not testnet coins)" in bold

**Confirmation:**
- `text-sm text-gray-300 mb-6`

**Buttons:**
- Cancel: Standard gray button
- Continue: `bg-amber-500 hover:bg-amber-600 text-white` (caution action)
- Continue text: "Change to {network} & Import"

---

### 4.7 Modal 5B: Set Wallet Password (Fresh Install Only)

**Purpose:** Create new wallet password after successful import

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔐  Create Wallet Password                           │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Your wallet backup has been decrypted successfully.   │
│  Now create a password to unlock your wallet.          │
│                                                         │
│  This password can be different from the backup        │
│  password you just entered.                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Wallet Password                                │  │
│  │  ┌───────────────────────────────────────────┐  │  │
│  │  │ •••••••••                          [👁]  │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  │                                                  │  │
│  │  Requirements:                                  │  │
│  │  ✓ At least 8 characters                       │  │
│  │  ✓ Contains uppercase letters                  │  │
│  │  ✓ Contains lowercase letters                  │  │
│  │  ✗ Contains numbers                            │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Confirm Wallet Password                        │  │
│  │  ┌───────────────────────────────────────────┐  │  │
│  │  │ •••••••••                          [👁]  │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [ERROR STATE - if passwords don't match:]             │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ❌ Passwords do not match                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │     Cancel      │  │  Create Wallet  →           │ │
│  └─────────────────┘  └─────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: 🔐 (lock)
- Title: "Create Wallet Password"
- Typography: `text-xl font-bold text-white`

**Instructions:**
- `text-sm text-gray-300 mb-4`
- Explain backup is decrypted
- Explain this password can be different

**Password Input Container:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4`

**Password Requirements:**
- Same as wallet setup screen
- Minimum 8 characters (less strict than backup password)
- Uppercase, lowercase, numbers required
- Real-time validation with checkmarks

**Confirm Password Input:**
- Separate container below password
- Same styling
- Match validation

**Error Messages:**
- Password mismatch: `bg-red-500/15 border border-red-500/30 text-red-300`

**Buttons:**
- Cancel: Aborts import (show confirmation?)
- Create Wallet: Completes import and unlocks wallet
  - Disabled until requirements met and passwords match

---

### 4.8 Modal 6: Import Success

**Purpose:** Confirm successful import and show what was restored

**ASCII Wireframe (Fresh Install Variant):**

```
┌────────────────────────────────────────────────────────┐
│  ✅  Wallet Successfully Restored                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌───────────────┐                     │
│                  │       ✅       │                     │
│                  └───────────────┘                     │
│                                                         │
│  Your wallet has been restored from the backup file.   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  📊 Restored Data                               │  │
│  │                                                  │  │
│  │  • 5 Single-Sig Accounts                        │  │
│  │  • 2 Multisig Accounts (1× 2-of-3, 1× 3-of-5)   │  │
│  │  • 12 Contacts                                  │  │
│  │  • All Settings                                 │  │
│  │                                                  │  │
│  │  🌐 Network: Testnet                            │  │
│  │  📅 Backup Created: October 20, 2025 at 2:30 PM │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  You can now unlock your wallet with the password you  │
│  just created.                                         │
│                                                         │
│              ┌─────────────────────────┐               │
│              │      Get Started        │               │
│              └─────────────────────────┘               │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**ASCII Wireframe (Replace Existing Variant):**

```
┌────────────────────────────────────────────────────────┐
│  ✅  Wallet Successfully Replaced                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌───────────────┐                     │
│                  │       ✅       │                     │
│                  └───────────────┘                     │
│                                                         │
│  Your old wallet has been replaced with the imported   │
│  backup.                                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  📊 Restored Data                               │  │
│  │                                                  │  │
│  │  • 5 Single-Sig Accounts                        │  │
│  │  • 2 Multisig Accounts (1× 2-of-3, 1× 3-of-5)   │  │
│  │  • 12 Contacts                                  │  │
│  │  • All Settings                                 │  │
│  │                                                  │  │
│  │  🌐 Network: Testnet                            │  │
│  │  📅 Backup Created: October 20, 2025 at 2:30 PM │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Your wallet is now unlocked with your existing        │
│  password.                                             │
│                                                         │
│              ┌─────────────────────────┐               │
│              │         Done            │               │
│              └─────────────────────────┘               │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: ✅ (green checkmark) - Large, animated (scale in)
- Title: "Wallet Successfully Restored" or "Wallet Successfully Replaced"
- Typography: `text-xl font-bold text-white`

**Success Icon:**
- Large checkmark circle: 80px
- Background: `bg-green-500/20 border-2 border-green-500 rounded-full`
- Icon: ✅ `text-green-400`
- Center aligned with scale-in animation
- Margin: `my-6`

**Success Message:**
- `text-base text-gray-300 text-center mb-6`

**Restored Data Card:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6`
- Title: "Restored Data" `text-sm font-semibold text-white mb-3`
- Each detail row:
  - Icon + Text
  - Layout: `flex items-start space-x-2 mb-2`
  - Icon: `text-gray-500`
  - Text: `text-sm text-white`

**Detail Rows:**
1. **Single-Sig Accounts:**
   - Icon: •
   - Text: "{count} Single-Sig Accounts"

2. **Multisig Accounts (if any):**
   - Icon: •
   - Text: "{count} Multisig Accounts ({breakdown})"
   - Example: "2 Multisig Accounts (1× 2-of-3, 1× 3-of-5)"

3. **Contacts:**
   - Icon: •
   - Text: "{count} Contacts"

4. **Settings:**
   - Icon: •
   - Text: "All Settings"

5. **Network:**
   - Icon: 🌐
   - Text: "Network: {network}"

6. **Backup Date:**
   - Icon: 📅
   - Text: "Backup Created: {date}"

**Next Steps Text:**
- `text-sm text-gray-400 text-center mb-6`
- Different text for fresh install vs replace

**Action Button:**
- Center aligned: `w-auto px-12`
- Fresh install: "Get Started" (closes modal, unlocks wallet)
- Replace existing: "Done" (returns to Settings)
- Style: `bg-bitcoin hover:bg-bitcoin-hover text-white py-3 rounded-lg font-semibold`

---

## 5. Integration Points

### 5.1 Wallet Setup Screen Integration

**Location:** Wallet Setup Screen (when no wallet exists)

**New Tab Added:**

```
┌──────────────────────────────────────────────────────┐
│  [Create New] [Import Seed] [Import Private Key] [Import Backup] │  ← NEW TAB
├──────────────────────────────────────────────────────┤
│                                                       │
│  Import from Backup File                              │
│                                                       │
│  Restore your wallet from an encrypted backup file    │
│  (.dat) created on another device.                    │
│                                                       │
│  This will restore:                                   │
│  • All accounts (single-sig and multisig)             │
│  • All contacts                                       │
│  • All settings                                       │
│                                                       │
│  ┌───────────────────────────────────────────────┐   │
│  │  📁                                           │   │
│  │  Drag & drop .dat file or browse files        │   │
│  │  [Browse Files]                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Tab Specifications:**
- Tab button: Same styling as other tabs
- Text: "Import Backup"
- Order: Last tab (after "Import Private Key")

**Tab Content:**
- Title: "Import from Backup File"
- Instructions explaining what gets restored
- Embedded file selector (not modal for initial view)
- Click file selector opens file browser or starts drag-drop
- After file selected, opens Modal 2 (Backup Password)

**Code Changes Required:**
```typescript
// WalletSetup.tsx
type SetupTab = 'create' | 'import' | 'import-key' | 'import-backup';  // Add new tab
```

---

### 5.2 Settings Screen Integration (Replace Existing)

**Location:** Settings Screen → Advanced Section (new section)

**New Section Added:**

```
┌─────────────────────────────────────────────────────┐
│ Advanced                                             │  ← NEW SECTION
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │  📥 Import Backup & Replace Wallet           │   │  ← NEW BUTTON
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │  🗑️ Delete Wallet                            │   │  ← Existing
│ └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Button Specifications:**
- Background: `bg-gray-800 hover:bg-gray-750`
- Text: `text-gray-300` with icon (📥)
- Height: `py-3` (48px total)
- Full width: `w-full`
- Font: `font-semibold text-base`
- Border radius: `rounded-lg`
- Margin bottom: `mb-3` (spacing from Delete Wallet button)

**Placement:**
- After Security section
- Before About section
- New "Advanced" section header

**Code Changes Required:**
```typescript
// SettingsScreen.tsx - Add new section after Security
```

---

### 5.3 Backend Integration

**New Message Types:**

```typescript
export enum MessageType {
  // ... existing types ...

  // Wallet backup/restore
  IMPORT_WALLET_BACKUP = 'IMPORT_WALLET_BACKUP',
  VALIDATE_BACKUP_FILE = 'VALIDATE_BACKUP_FILE',
  DECRYPT_BACKUP = 'DECRYPT_BACKUP',
}
```

**Message Payloads:**

```typescript
// VALIDATE_BACKUP_FILE
{
  file: File;  // Backup file to validate
}

// Response:
{
  valid: boolean;
  version: number;
  network: 'testnet' | 'mainnet';
  created: number;  // Unix timestamp
  accountCount: number;
  contactCount: number;
  error?: string;
}

// DECRYPT_BACKUP
{
  file: File;
  backupPassword: string;
}

// Response:
{
  decrypted: BackupPayload;
}

// IMPORT_WALLET_BACKUP
{
  backupPayload: BackupPayload;
  walletPassword: string;  // New wallet password (fresh install)
  replaceExisting: boolean;  // True for scenario B
}

// Response:
{
  success: boolean;
  accounts: WalletAccount[];
  contacts: Contact[];
  network: 'testnet' | 'mainnet';
}
```

**New Files to Create:**

```
src/tab/components/modals/ImportBackupModals.tsx  # All import modals
src/tab/components/modals/ReplaceWalletWarning.tsx
src/tab/components/shared/FileSelector.tsx  # Drag-drop file selector
```

---

## 6. Visual Design System

### 6.1 Color Palette Usage

**Same as export flow**, plus:

**Destructive Actions (Replace Wallet):**
```css
/* Red - Destructive actions */
bg-red-500              /* Primary button background */
hover:bg-red-600        /* Hover state */
border-red-500/30       /* Border for warning boxes */
bg-red-500/15           /* Background for warning boxes */
text-red-300            /* Warning text */
```

**Network Warnings:**
```css
/* Amber - Network mismatch */
bg-amber-500            /* Primary button for network change */
hover:bg-amber-600      /* Hover state */
```

**File Selector:**
```css
/* Drag-drop zone */
border-gray-700         /* Default border */
hover:border-bitcoin    /* Hover state */
bg-bitcoin-subtle       /* Active (dragging) */
```

### 6.2 Typography

Same as export flow (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 5.2).

### 6.3 Iconography

**Import-Specific Icons:**
- 📁 Folder - File selection
- 📥 Download (inward) - Import action
- 🔄 Circular arrows - Restore/replace action
- 📊 Chart - Restored data summary
- 🌐 Globe - Network indicator

**All Other Icons:**
Same as export flow.

### 6.4 Spacing & Layout

Same as export flow (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 5.4).

### 6.5 Border Radius

Same as export flow.

### 6.6 Shadows & Elevation

Same as export flow.

---

## 7. Interaction Design

### 7.1 File Selection Interactions

**Drag & Drop:**

```
1. User drags .dat file over zone
   → Border changes to bitcoin orange
   → Background changes to bitcoin-subtle
   → Scale increases slightly (1.02)

2. User drops file
   → Zone resets to default
   → File validation occurs
   → If valid: Show file selected state
   → If invalid: Show error message

3. User drops wrong file type
   → Show error: "Please select a .dat backup file"
   → Zone resets
```

**Browse Files:**

```
1. User clicks "Browse Files" button
   → Opens native file picker
   → Filter: .dat files only

2. User selects file
   → File validation occurs
   → If valid: Show file selected state
   → If invalid: Show error message

3. User cancels file picker
   → No change to UI
```

**File Selected State:**

```
Selected file display:
┌──────────────────────────────────────────────┐
│ 📄 bitcoin-wallet-backup-2025-10-20.dat     │
│ 24.3 KB • Selected Oct 26, 2025             │
│                               [Remove]  [×]  │
└──────────────────────────────────────────────┘

Actions:
- Click filename: No action (not clickable)
- Click [Remove]: Clear selection, return to drag-drop zone
- Click [×]: Same as Remove
```

### 7.2 Button States

**Same as export flow**, plus:

**Destructive Button (Replace Wallet):**

```css
/* Default */
bg-red-500 text-white py-3 px-6 rounded-lg font-semibold

/* Hover */
hover:bg-red-600

/* Active/Click */
active:bg-red-700 active:scale-[0.98]

/* Focus (keyboard) */
focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2

/* Disabled */
disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
```

### 7.3 Form Validation Timing

**File Validation:**
- **On Selection:**
  - Immediate validation of file type (.dat only)
  - Immediate validation of file size (< 10 MB)
  - Show error if invalid, don't proceed

**Backup Password Validation:**
- **On Submit Only:**
  - Don't validate while typing
  - Only show error after submit if incorrect
  - Allow unlimited retries

**Wallet Password Validation (Fresh Install):**
- **On Input (Real-time):**
  - Requirements checklist updates
  - Visual feedback immediate
- **On Blur:**
  - Check if minimum requirements met
- **On Submit:**
  - Final validation
  - Focus first invalid field if error

### 7.4 Progress Feedback

**Import Progress Steps:**

See Modal 4.5 for detailed progress steps.

**Key Differences from Export:**
- Decryption instead of encryption
- Validation of imported data
- Migration step (if version upgrade)
- Restoration to storage

**Progress Bar Animation:**
Same as export flow.

### 7.5 Success State

**Success Modal Animation:**

```
1. Modal appears: Fade in + scale in (300ms)
2. Success icon: Scale in from 0.8 to 1.0 (400ms, delay 100ms)
3. Restored data card: Fade in + slide up (300ms, delay 200ms)
4. Next steps text: Fade in (200ms, delay 300ms)
5. Action button: Fade in (200ms, delay 400ms)
```

**Button Click:**
- Fresh install: Closes modal, unlocks wallet, shows Dashboard
- Replace existing: Closes modal, returns to Settings

### 7.6 Modal Transitions

Same as export flow (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 6.5).

---

## 8. Error Handling UX

### 8.1 Error States & Recovery

**Invalid File Format:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Invalid File Type                           │
│                                                  │
│  This file is not a valid wallet backup.        │
│  Please select a .dat backup file created by    │
│  this extension.                                │
│                                                  │
│  File selected: document.pdf                    │
│                                                  │
│  [Try Different File]                           │
└─────────────────────────────────────────────────┘
```

- Background: `bg-red-500/15 border border-red-500/30`
- Icon: ❌
- Clear explanation
- Show filename
- Action button to retry

**Recovery:**
1. Error message appears in file selector
2. Selected file removed
3. User can select different file
4. Error clears when valid file selected

---

**Corrupted Backup File:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Corrupted Backup File                       │
│                                                  │
│  This backup file appears to be corrupted.      │
│  The file checksum doesn't match.               │
│                                                  │
│  Possible causes:                               │
│  • File was modified or damaged                 │
│  • File transfer was incomplete                 │
│  • File is not a valid backup                   │
│                                                  │
│  Please try a different backup file or          │
│  create a new backup from your source wallet.   │
│                                                  │
│  [Try Different File] [Cancel]                  │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Show error after file validation
2. Explain what checksum mismatch means
3. Provide actionable next steps
4. Allow retry with different file

---

**Wrong Backup Password:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Incorrect Backup Password                   │
│                                                  │
│  The password you entered is incorrect.         │
│                                                  │
│  Please try again with the password you created │
│  when exporting this backup.                    │
│                                                  │
│  💡 Hint: This is the BACKUP password, not your │
│     wallet password. They may be different.     │
│                                                  │
│  [Try Again]                                    │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Error shown below password input
2. Input field keeps entered value
3. Focus remains on input
4. User can immediately retry
5. Error clears when user starts typing
6. No hard limit on retries (user may have forgotten)

---

**File Too Large:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ⚠️  File Too Large                             │
│                                                  │
│  This file is larger than expected for a wallet │
│  backup (152 MB).                               │
│                                                  │
│  Maximum size: 10 MB                            │
│                                                  │
│  This may not be a valid backup file.           │
│                                                  │
│  [Select Different File]                        │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Reject file immediately
2. Explain size limit
3. Suggest file may be wrong type
4. Allow selecting different file

---

**Version Incompatibility (Backup Too New):**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ⚠️  Backup Version Not Supported               │
│                                                  │
│  This backup was created with a newer version   │
│  of the extension.                              │
│                                                  │
│  Backup version: 3.0                            │
│  Current version: 2.0                           │
│                                                  │
│  Please update the extension to import this     │
│  backup.                                        │
│                                                  │
│  [Update Extension] [Cancel]                    │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Show error during validation
2. Explain version mismatch
3. Show both versions
4. Link to extension update
5. Cannot import until updated

---

**Import Failed (General Error):**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Import Failed                                │
│                                                  │
│  An error occurred while importing your backup: │
│  [Error message from backend]                   │
│                                                  │
│  Your current wallet is safe and unchanged.     │
│                                                  │
│  You can try again or contact support if the    │
│  problem persists.                              │
│                                                  │
│  [Try Again] [Cancel]                           │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Show clear error message
2. Reassure current wallet is safe (if replace scenario)
3. Provide retry option
4. Log error details for debugging
5. Return to beginning of flow if retry

---

### 8.2 Error Message Guidelines

**Tone:**
- Clear and specific
- Non-technical language (but explain technical terms when needed)
- Actionable (tell user what to do)
- Reassuring when appropriate

**Structure:**
1. What happened (brief)
2. Why it happened (if relevant and helpful)
3. What to do next (action)

**Examples:**

**Good:**
- ✓ "Incorrect backup password. Please try again with the password you created when exporting this backup."
- ✓ "This backup file is corrupted. The file may have been modified or damaged. Please try a different backup file."
- ✓ "This backup is for MAINNET but your wallet is set to TESTNET. Importing will change your network setting."

**Bad:**
- ✗ "Decryption failed" (too vague)
- ✗ "Error: INVALID_CHECKSUM_0x42" (too technical)
- ✗ "Wrong" (not helpful)

### 8.3 Validation Error Summary

| Error Condition | When Shown | Recovery Action |
|----------------|------------|-----------------|
| Invalid file type | On file selection | Select .dat file |
| File too large | On file selection | Select smaller file |
| Corrupted file (checksum) | After file validation | Try different backup |
| Wrong backup password | On decrypt attempt | Re-enter correct password |
| Version too new | After file validation | Update extension |
| Network mismatch | After decryption | Cancel or accept network change |
| Import failed (general) | During import | Retry from beginning |
| Storage quota exceeded | During import | Clear browser data |

---

## 9. Accessibility Guidelines

### 9.1 Keyboard Navigation

**Tab Order:**

**File Selection Modal:**
1. File selector / drag-drop zone (focusable)
2. Browse Files button
3. Remove file button (if file selected)
4. Cancel button
5. Continue button

**Backup Password Modal:**
1. Password input (auto-focus)
2. Eye icon toggle
3. Back button
4. Cancel button
5. Decrypt & Import button

**Set Wallet Password Modal:**
1. Password input (auto-focus)
2. Eye icon toggle
3. Confirm password input
4. Eye icon toggle
5. Cancel button
6. Create Wallet button

**Import Success Modal:**
1. Done / Get Started button (auto-focus)

### 9.2 Screen Reader Support

**ARIA Labels:**

```html
<!-- File selector -->
<div
  role="button"
  tabindex="0"
  aria-label="Select wallet backup file. Drag and drop or press Enter to browse files"
  onDrop={handleDrop}
  onKeyDown={handleKeyboardOpen}
>
  ...
</div>

<!-- File selected state -->
<div role="status" aria-live="polite">
  File selected: bitcoin-wallet-backup-2025-10-20.dat, 24.3 kilobytes
</div>

<!-- Import progress -->
<div role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
  <div style={{ width: `${progress}%` }} />
</div>
<div role="status" aria-live="polite">
  {currentStep}
</div>

<!-- Success message -->
<div role="alert" aria-live="assertive">
  Wallet successfully restored
</div>
```

**Live Regions:**
- File selection: `aria-live="polite"`
- Error messages: `role="alert"` (assertive)
- Success messages: `role="alert"` (assertive)
- Progress updates: `aria-live="polite"`

**Hidden Content for Screen Readers:**
```html
<span className="sr-only">
  Import progress: {progress}%. Current step: {currentStep}
</span>
```

### 9.3 Focus Management

**Same as export flow** (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 7.3).

**Auto-Focus Rules:**
- File Selection: Drag-drop zone
- Backup Password: Password input
- Set Wallet Password: Password input
- Progress: No focus (non-interactive)
- Success: Action button

### 9.4 Color Contrast

**WCAG AA Compliance:**

Same as export flow, plus:

**Destructive Actions:**
- Red-500 button text on red-500 background: Use white text (14.2:1 ✓)
- Red-300 text on red-500/15 background: 11.8:1 ✓

**File Selector:**
- Gray-700 border on gray-850 background: 3.1:1 ✓
- Bitcoin orange border on gray-850 (hover): 4.2:1 ✓

### 9.5 Touch Targets

**Minimum Size:** 44×44px (WCAG 2.1 AAA)

**Implementation:**
- All buttons: 48px height ✓
- File selector: Full width, 240px min height ✓
- Browse button: 44px height ✓
- Remove file button: 44px tap area ✓

---

## 10. Responsive Design

### 10.1 Breakpoints

Same as export flow (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 9.1).

### 10.2 Modal Responsive Behavior

Same as export flow.

### 10.3 Component Adaptations for Mobile

**File Selector:**

**Desktop:**
```
Min height: 240px
Drag & drop fully functional
```

**Mobile:**
```
Min height: 180px (reduced)
Tap to open file picker (drag-drop less reliable on mobile)
Larger tap target for browse button
```

**Restored Data Card:**

**Desktop:**
```
Full detail display
All bullet points visible
```

**Mobile:**
```
Condensed view
May wrap long multisig descriptions
Smaller font sizes (text-xs instead of text-sm)
```

**Button Groups:**

Same as export flow (see ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md Section 9.3).

---

## 11. Implementation Checklist

### 11.1 Component Development

- [ ] Create FileSelector component (drag-drop + browse)
- [ ] Create ImportBackupModals.tsx
  - [ ] FileSelectionModal
  - [ ] BackupPasswordModal
  - [ ] ImportProgressModal
  - [ ] SetWalletPasswordModal
  - [ ] ImportSuccessModal
- [ ] Create ReplaceWalletWarningModal component
- [ ] Create ConfirmWalletPasswordModal component
- [ ] Create NetworkMismatchWarningModal component

### 11.2 Wallet Setup Screen Integration

- [ ] Add "Import from Backup" tab
- [ ] Wire up tab content
- [ ] Integrate FileSelector
- [ ] Implement modal flow for fresh install
- [ ] Handle successful import (unlock wallet)

### 11.3 Settings Screen Integration

- [ ] Add Advanced section
- [ ] Add "Import Backup & Replace Wallet" button
- [ ] Wire up replace wallet flow
- [ ] Integrate all replace-specific modals

### 11.4 Backend Integration

- [ ] Create VALIDATE_BACKUP_FILE message handler
- [ ] Create DECRYPT_BACKUP message handler
- [ ] Create IMPORT_WALLET_BACKUP message handler
- [ ] Implement file validation logic
- [ ] Implement decryption logic
- [ ] Implement import logic
- [ ] Implement version migration logic
- [ ] Handle network mismatch
- [ ] Add progress callbacks

### 11.5 File Handling

- [ ] Implement drag & drop functionality
- [ ] Implement file browser
- [ ] Implement file validation (type, size)
- [ ] Implement file reading
- [ ] Handle file selection state
- [ ] Handle file removal

### 11.6 Password Validation

- [ ] Backup password entry (no validation, just decrypt)
- [ ] Wallet password validation (fresh install)
- [ ] Password match validation
- [ ] Real-time feedback
- [ ] Accessibility labels

### 11.7 Progress Tracking

- [ ] Implement progress percentage tracking
- [ ] Implement step-by-step status updates
- [ ] Add smooth progress bar animation
- [ ] Add step text transitions
- [ ] Test timing (should be 10-30 seconds)

### 11.8 Success Handling

- [ ] Format restored data summary
- [ ] Display network information
- [ ] Display backup creation date
- [ ] Show account breakdown (single-sig vs multisig)
- [ ] Show contact count
- [ ] Implement success animation
- [ ] Implement action button (Get Started / Done)

### 11.9 Error Handling

- [ ] Implement file validation errors
- [ ] Handle wrong backup password
- [ ] Handle corrupted file errors
- [ ] Handle version incompatibility
- [ ] Handle network mismatch warning
- [ ] Handle general import errors
- [ ] Implement retry logic

### 11.10 Accessibility

- [ ] Add ARIA labels to all modals
- [ ] Add ARIA labels to file selector
- [ ] Implement focus trap in modals
- [ ] Add keyboard navigation for file selector
- [ ] Add screen reader announcements
- [ ] Test with screen reader
- [ ] Verify color contrast
- [ ] Verify touch target sizes

### 11.11 Visual Polish

- [ ] Implement modal animations
- [ ] Add success icon animation
- [ ] Add progress bar transitions
- [ ] Add button hover/active states
- [ ] Add focus indicators
- [ ] Test on different screen sizes
- [ ] Test on touch devices
- [ ] Implement drag-drop visual feedback

### 11.12 Testing

- [ ] Test fresh install flow (happy path)
- [ ] Test replace existing flow (happy path)
- [ ] Test network mismatch scenario
- [ ] Test all error scenarios
- [ ] Test file validation edge cases
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Test accessibility with keyboard only
- [ ] Test with screen reader
- [ ] Performance test import timing

---

## 12. Design Decisions & Rationale

### 12.1 Why Two Import Scenarios?

**Decision:** Separate flows for fresh install vs replace existing

**Rationale:**
- Replacing wallet is destructive and scary
- Fresh install is simple and safe
- Different entry points (Wallet Setup vs Settings)
- Different user mindsets (getting started vs migrating)
- Different warnings needed

**Alternative Considered:** Single unified flow
**Rejected Because:** Would dilute critical warnings for replace scenario

---

### 12.2 Why No "Merge" Option?

**Decision:** Import replaces entire wallet (no selective merge)

**Rationale:**
- Merging is complex (what happens with duplicate accounts?)
- MVP should be simple all-or-nothing
- Avoids edge cases and conflicts
- Clear mental model for users
- Can add selective restore in Post-MVP

**Alternative Considered:** Allow importing only contacts or only accounts
**Rejected Because:** Adds complexity, risk of partial state, MVP bloat

---

### 12.3 Why Separate Wallet Password Step?

**Decision:** Fresh install requires creating NEW wallet password after import

**Rationale:**
- Backup password is for file encryption (persistent threat)
- Wallet password is for daily unlock (ephemeral threat)
- User may want different passwords
- Allows using existing password when replacing wallet
- Matches user's existing mental model from wallet setup

**Alternative Considered:** Reuse backup password as wallet password
**Rejected Because:** Forces same password, reduces flexibility

---

### 12.4 Why Show Network Mismatch Warning?

**Decision:** Explicit warning if backup network differs from current setting

**Rationale:**
- Mainnet vs testnet is CRITICAL difference
- Real Bitcoin vs test Bitcoin
- User must consciously confirm network change
- Prevents accidental mainnet/testnet confusion
- Safety-first approach

**Alternative Considered:** Silently change network
**Rejected Because:** Too dangerous, user could lose funds on wrong network

---

### 12.5 Why Recommend Export Before Replace?

**Decision:** Suggest exporting current wallet before importing backup

**Rationale:**
- Defense in depth
- User might change mind
- User might select wrong backup file
- Easy to recover if mistake made
- Builds user confidence

**Alternative Considered:** Don't mention export option
**Rejected Because:** Missed opportunity to prevent data loss

---

### 12.6 Why Drag & Drop File Selector?

**Decision:** Use drag-drop zone instead of simple file input

**Rationale:**
- Modern, expected UX pattern
- Visual feedback during drag
- Clear target area
- Fallback to browse button
- Works on desktop and mobile (with browse fallback)

**Alternative Considered:** Just a file input button
**Rejected Because:** Less discoverable, less visual feedback

---

## 13. Future Enhancements

### 13.1 Post-MVP Features

**Selective Restore:**
- Import only contacts
- Import only accounts
- Choose which accounts to import
- Merge vs replace options

**Backup Verification:**
- Test restore without actually importing
- Verify backup integrity
- Compare backup to current wallet

**Multiple Backups:**
- Import history (track imported backups)
- Compare multiple backups
- Choose which backup to restore

**Cloud Integration:**
- Import from cloud storage (Dropbox, Google Drive)
- Direct restore from cloud
- Automatic cloud sync

---

## 14. Cross-References

**Related Documentation:**
- `WALLET_BACKUP_RESTORE_PRD.md` - Product requirements
- `ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md` - Export flow design
- `ENCRYPTED_BACKUP_EXPORT_VISUAL_GUIDE.md` - Visual reference
- `prompts/docs/security-expert-notes.md` - Security specs
- `prompts/docs/ui-ux-designer-notes.md` - Design system

**Related Components:**
- `src/tab/components/WalletSetup.tsx` - Integration point (fresh install)
- `src/tab/components/SettingsScreen.tsx` - Integration point (replace)
- `src/tab/components/shared/Modal.tsx` - Base modal component
- `src/tab/components/modals/ExportBackupModals.tsx` - Export modal reference

**Backend:**
- `src/background/wallet/BackupManager.ts` - Import logic
- `src/background/crypto/Encryption.ts` - Decryption implementation
- `src/background/messageHandlers.ts` - Add import handlers

---

## 15. Success Criteria

**Import flow is successful if:**
- ✓ User can import backup from Wallet Setup screen (fresh install)
- ✓ User can replace wallet from Settings screen
- ✓ Clear warnings for destructive actions
- ✓ All accounts restored correctly
- ✓ All contacts restored correctly
- ✓ All settings restored correctly
- ✓ Network mismatch handled gracefully
- ✓ All error scenarios handled with clear messages
- ✓ Import completes in <30 seconds
- ✓ Accessibility compliant (WCAG AA)
- ✓ Works on mobile and desktop
- ✓ No data loss scenarios

---

**End of UX Specification**

This document provides complete UX specifications for implementing the wallet backup import/restore feature. All user flows, modal designs, interactions, accessibility requirements, and error handling are defined and ready for frontend implementation.

**Next Steps:**
1. Frontend Developer reviews and implements components
2. Backend Developer implements import logic and message handlers
3. Testing Expert writes unit tests for validation logic
4. QA Engineer creates test plan for import scenarios
5. Security Expert reviews password handling
6. Blockchain Expert reviews address restoration logic
