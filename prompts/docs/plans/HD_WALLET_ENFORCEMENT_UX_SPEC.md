# HD Wallet Enforcement - UX Design Specification

**Version**: 1.0
**Created**: October 27, 2025
**Designer**: UI/UX Designer (Claude Code)
**Status**: Draft - Ready for Review

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Design Goals](#design-goals)
4. [Wallet Setup Flow Redesign](#wallet-setup-flow-redesign)
5. [Account Grouping - Sidebar](#account-grouping---sidebar)
6. [Account Grouping - Settings Screen](#account-grouping---settings-screen)
7. [Export Button Logic](#export-button-logic)
8. [Edge Cases & Empty States](#edge-cases--empty-states)
9. [User Journey Diagrams](#user-journey-diagrams)
10. [Component Specifications](#component-specifications)
11. [Accessibility](#accessibility)
12. [Implementation Notes](#implementation-notes)

---

## Executive Summary

This specification enforces HD-only wallet creation while maintaining support for imported private key accounts. The design introduces clear visual segregation between HD-derived accounts and imported accounts across all UI surfaces (Wallet Setup, Sidebar, Settings).

**Key Changes:**
1. **Wallet Setup**: Remove "Key" tab, replace with "Create" and "Import Seed" only
2. **Account Grouping**: Visual segregation with collapsible sections in Sidebar and Settings
3. **Export Logic**: Context-aware button visibility (Xpub for HD, Key for both)
4. **Post-Setup Import**: Add "Import Private Key" option in Account Switcher dropdown and Settings

**Design Principle**: Progressive disclosure - hide complexity until needed, educate when relevant.

---

## Problem Statement

### Current Issues

1. **Wallet Setup allows private key import as initial wallet creation**
   - Confusing for users - private keys should be for single account import
   - Creates non-HD wallets from the start, defeating the purpose of HD wallet architecture
   - Inconsistent with industry standards (MetaMask, Ledger, etc.)

2. **Account Switcher shows flat list with no grouping**
   - HD-derived and imported accounts appear identical
   - No visual indication of account derivation type
   - Difficult to understand wallet structure

3. **Settings screen mixes all accounts together**
   - Export Xpub button appears for imported accounts (incorrect)
   - No clear distinction between account types
   - Confusing for users trying to understand their wallet structure

4. **Inconsistent export button logic**
   - Export Xpub shows for accounts that don't have xpubs (imported keys)
   - No clear rules for when each export option should appear

### User Impact

- **Confusion**: Users don't understand the difference between HD-derived and imported accounts
- **Security risk**: Accidental exposure of private keys vs xpubs (different threat models)
- **Poor UX**: Cluttered interface with no clear organization
- **Technical debt**: Inconsistent wallet structure from day one

---

## Design Goals

### Primary Goals

1. **Enforce HD wallet creation**
   - Only allow seed-based wallet creation at setup
   - Private key import is a post-setup feature for adding individual accounts

2. **Clear visual segregation**
   - Users can immediately distinguish HD-derived from imported accounts
   - Consistent grouping across all UI surfaces (Sidebar, Settings)

3. **Context-aware export buttons**
   - Show correct export options based on account derivation type
   - Educate users on the difference between xpub and private key exports

4. **Maintain flexibility**
   - Still support private key imports (just not at initial setup)
   - Don't remove existing functionality, just reorganize it

### Secondary Goals

5. **Progressive disclosure**
   - Hide advanced features (private key import) until user needs them
   - Provide clear pathways to advanced features when needed

6. **Education without judgment**
   - Explain why HD-derived accounts are recommended
   - Don't shame users for importing private keys
   - Clear tooltips and help text

---

## Wallet Setup Flow Redesign

### Current State (4 Tabs)

```
┌────────────────────────────────────────────────────────┐
│  Welcome to Bitcoin Wallet                             │
├────────────────────────────────────────────────────────┤
│  [Create] [Seed] [Key] [Backup]                        │
│  ───────  ─────  ────  ───────                         │
│                                                         │
│  (Active tab content)                                  │
└────────────────────────────────────────────────────────┘
```

**PROBLEM**: "Key" tab at setup encourages creating non-HD wallets

---

### New State (3 Options)

## [UPDATED - Backup Restoration]

```
┌────────────────────────────────────────────────────────────┐
│  Welcome to Bitcoin Wallet                                 │
├────────────────────────────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐       │
│  │   Create   │  │   Import   │  │    Restore     │       │
│  │   Wallet   │  │   Wallet   │  │  from Backup   │       │
│  └────────────┘  └────────────┘  └────────────────┘       │
│                                                             │
│  (Active option content)                                   │
└────────────────────────────────────────────────────────────┘
```

**SOLUTION**: Three equal-weight options for HD wallet creation. Private key import happens post-setup.

---

### Tab 1: Create Wallet

**Purpose**: Generate new HD wallet from fresh mnemonic

```
┌────────────────────────────────────────────────────────┐
│  [Create Wallet]  Import Wallet                        │
│  ──────────────                                        │
│                                                         │
│  Create a New Wallet                                   │
│                                                         │
│  You'll receive a 12-word seed phrase to back up your  │
│  wallet. This seed phrase can generate unlimited       │
│  accounts and is the only way to recover your wallet.  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Address Type                                     │ │
│  │ [Native SegWit (Recommended) ▼]                  │ │
│  │                                                   │ │
│  │ Native SegWit offers lower fees and better       │ │
│  │ privacy.                                          │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Password *                                        │ │
│  │ [••••••••••••••••••]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Confirm Password *                                │ │
│  │ [••••••••••••••••••]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  [Create Wallet]                                       │
└────────────────────────────────────────────────────────┘
```

**No Changes from Current Design** - This tab works perfectly as-is.

---

### Tab 2: Import Wallet

**Purpose**: Import existing HD wallet from mnemonic

```
┌────────────────────────────────────────────────────────┐
│  Create Wallet  [Import Wallet]                        │
│                 ──────────────                         │
│                                                         │
│  Import Existing Wallet                                │
│                                                         │
│  Restore your wallet using your BIP39 seed phrase      │
│  (12, 15, 18, 21, or 24 words). This will restore      │
│  all accounts derived from this seed.                  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Seed Phrase *                                     │ │
│  │ ┌──────────────────────────────────────────────┐ │ │
│  │ │ word1 word2 word3 word4 word5 word6...       │ │ │
│  │ │                                               │ │ │
│  │ └──────────────────────────────────────────────┘ │ │
│  │ Must be 12, 15, 18, 21, or 24 words              │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Address Type                                     │ │
│  │ [Native SegWit (Recommended) ▼]                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Password *                                        │ │
│  │ [••••••••••••••••••]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Confirm Password *                                │ │
│  │ [••••••••••••••••••]                             │ │
│  └──────────────────────────────────────────────────┘ │
│                                                         │
│  [Import Wallet]                                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ℹ️  Need to import a single private key?          │ │
│  │                                                   │ │
│  │ First create or import a wallet above, then      │ │
│  │ use "Import Account" from the account switcher   │ │
│  │ or Settings to add individual private keys.      │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Changes from Current Design:**
1. **Renamed from "Seed"** → **"Import Wallet"** (clearer intent)
2. **Added info box** at bottom explaining where private key import happens
3. **Educational copy** emphasizes this restores all HD-derived accounts

---

### Option 3: Restore from Backup

## [UPDATED - Backup Restoration]

**Purpose**: Restore from encrypted .dat backup file

**Design**: Card-based layout with visual hierarchy

```
┌────────────────────────────────────────────────────────────────┐
│  Create Wallet  Import Wallet  [Restore from Backup]           │
│                                ────────────────────             │
│                                                                 │
│  Restore from Encrypted Backup                                 │
│                                                                 │
│  Restore your complete wallet from an encrypted backup file.   │
│  This includes all accounts, contacts, and settings.           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📦  What will be restored?                             │   │
│  │                                                         │   │
│  │  ✓ All accounts (single-sig and multisig)              │   │
│  │  ✓ All contacts and address book                       │   │
│  │  ✓ All wallet settings and preferences                 │   │
│  │  ✓ Complete transaction history                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📄  Select Backup File (.dat)                          │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  Drag & drop your backup file here             │   │   │
│  │  │               or                                │   │   │
│  │  │     [Choose File from Computer]                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │  No file selected                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Continue]  (disabled until file selected)                    │
└────────────────────────────────────────────────────────────────┘
```

**NEW: Multi-Step Restoration Flow**

This design introduces a comprehensive 4-step restoration process.

---

## 3.4 Backup Restoration Flow

## [UPDATED - Backup Restoration]

This section details the complete user experience for restoring a wallet from an encrypted backup file.

### Overview

The backup restoration flow consists of 4 screens:
1. **File Selection** - Choose and validate backup file
2. **Password Entry** - Authenticate with backup password
3. **Progress & Validation** - Decrypt and verify wallet data
4. **Success Confirmation** - Show restoration summary

---

### Step 1: File Selection Screen

**Layout**: Drag-and-drop area with file picker fallback

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  Select your encrypted wallet backup file                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                      📦                                 │   │
│  │                                                         │   │
│  │         Drag & drop your backup file here              │   │
│  │                      or                                │   │
│  │          [Choose File from Computer]                   │   │
│  │                                                         │   │
│  │         Accepted format: .dat (max 10MB)               │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ℹ️  Where do I find my backup file?                    │   │
│  │                                                         │   │
│  │ Your backup file was created from Settings > Backup    │   │
│  │ & Export > Export Encrypted Backup. It has a .dat      │   │
│  │ extension and a name like "bitcoin-wallet-backup-      │   │
│  │ 2025-10-27.dat"                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Continue]  (disabled)                                        │
└────────────────────────────────────────────────────────────────┘
```

**Specifications:**

**Drag-and-Drop Area:**
```css
Background:     #1E1E1E (gray-850)
Border:         2px dashed #3A3A3A (gray-700)
Border Radius:  12px (rounded-xl)
Padding:        48px 24px (py-12 px-6)
Min Height:     200px
Text Align:     Center
Hover State:    Border → #F7931A (bitcoin orange)
              Background → rgba(247, 147, 26, 0.05)
Active Drop:    Border → solid 2px #F7931A
              Background → rgba(247, 147, 26, 0.1)
```

**File Icon:**
- Icon: 📦 (or file icon SVG)
- Size: 48px (w-12 h-12)
- Color: #808080 (gray-500)

**Accepted File Types:**
- Extension: `.dat`
- Max Size: 10MB
- MIME Type: `application/octet-stream`

---

### Step 1a: File Selected State

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  Select your encrypted wallet backup file                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │  ✓  bitcoin-wallet-backup-2025-10-27.dat              │   │
│  │     842 KB                                             │   │
│  │                                                         │   │
│  │     [Change File]                                      │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Continue]  (enabled, Bitcoin orange)                         │
└────────────────────────────────────────────────────────────────┘
```

**File Display Card:**
```css
Background:     #242424 (gray-800)
Border:         1px solid #3A3A3A (gray-700)
Border Radius:  8px (rounded-lg)
Padding:        24px (p-6)
```

**File Info Display:**
- Checkmark: ✓ (green-400, text-lg)
- Filename: 16px, Semibold, white
- File size: 14px, Regular, gray-400

**Change File Button:**
- Style: Secondary button (gray-700 border)
- Hover: gray-600 border

---

### Step 1b: File Validation Errors

**Error: Invalid File Extension**

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ❌  wallet-backup.zip                                  │   │
│  │      Invalid file format                               │   │
│  │                                                         │   │
│  │  ⚠️  Only .dat backup files are supported              │   │
│  │                                                         │   │
│  │     [Choose Different File]                            │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Error: File Too Large**

```
┌────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ❌  large-backup.dat                                   │   │
│  │      15.2 MB                                           │   │
│  │                                                         │   │
│  │  ⚠️  File exceeds maximum size of 10MB                 │   │
│  │                                                         │   │
│  │     [Choose Different File]                            │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Error: Corrupted File (Early Detection)**

```
┌────────────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────────┐   │
│  │  ❌  backup.dat                                         │   │
│  │      File appears corrupted                            │   │
│  │                                                         │   │
│  │  ⚠️  Unable to read file. The backup file may be       │   │
│  │     corrupted or not a valid wallet backup.            │   │
│  │                                                         │   │
│  │     [Choose Different File]                            │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

**Error State Styling:**
- Border: `border-red-500/30`
- Background: `bg-red-500/5`
- Icon: ❌ (red-400)
- Warning icon: ⚠️ (amber-400)
- Text: gray-300

---

### Step 2: Password Entry Screen

**Purpose**: Authenticate with backup password (NOT wallet password)

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  Enter Backup Password                                         │
│                                                                 │
│  This is the password you used when creating the backup        │
│  (this may be different from your wallet password).            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Backup Password *                                       │   │
│  │ [••••••••••••••••••••••••]  👁                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 💡  Important Note                                      │   │
│  │                                                         │   │
│  │ This is the password you entered when exporting the    │   │
│  │ backup, not your current wallet password. If you       │   │
│  │ forgot this password, the backup cannot be restored.   │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Back]  [Restore Wallet]                                      │
└────────────────────────────────────────────────────────────────┘
```

**Password Field Specifications:**

**Container:**
```css
Background:     #242424 (gray-800)
Border:         1px solid #3A3A3A (gray-700)
Border Radius:  8px (rounded-lg)
Padding:        12px 16px (py-3 px-4)
Font Size:      16px
Focus Border:   2px solid #F7931A (bitcoin orange)
```

**Password Toggle (Eye Icon):**
- Position: Absolute right, centered vertically
- Icon: 👁 (eye) or SVG eye icon
- Hover: Opacity 0.7 → 1.0
- Click: Toggle password visibility

**Important Note Box:**
- Background: `bg-blue-500/10`
- Border: `border-blue-500/30`
- Icon: 💡 (blue-400)
- Text: blue-300

**Restore Wallet Button:**
- Style: Primary (Bitcoin orange)
- Disabled until password entered (min 8 chars)
- Hover: bitcoin-hover
- Active: bitcoin-active

---

### Step 2a: Wrong Password Error

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  Enter Backup Password                                         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ Backup Password *                                       │   │
│  │ [••••••••••••••••••••••••]  👁                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ❌  Incorrect password                                  │   │
│  │                                                         │   │
│  │ The password you entered is incorrect. Please try      │   │
│  │ again. (2 attempts remaining)                          │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Back]  [Restore Wallet]                                      │
└────────────────────────────────────────────────────────────────┘
```

**Error Message Styling:**
- Border: `border-red-500/30`
- Background: `bg-red-500/10`
- Text: red-300
- Icon: ❌ (red-400)

**Attempt Counter:**
- Show attempts remaining: "X attempts remaining"
- After 3 failed attempts: Disable for 30 seconds
- Show countdown: "Try again in 30 seconds..."

---

### Step 3: Progress & Validation Screen

**Purpose**: Show decryption and validation progress

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  Restoring Your Wallet...                                      │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                     ⏳  ⟳                              │   │
│  │                                                         │   │
│  │           Decrypting backup file...                    │   │
│  │                                                         │   │
│  │  ████████████████████░░░░░░░░░░  75%                  │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Please wait while we restore your wallet. This may take       │
│  a few moments.                                                │
└────────────────────────────────────────────────────────────────┘
```

**Progress States:**

**State 1: Decrypting (0-50%)**
```
⏳  ⟳  Decrypting backup file...
████████████░░░░░░░░░░░░░░  50%
```

**State 2: Validating (51-75%)**
```
🔍  ⟳  Validating wallet data...
██████████████████░░░░░░  75%
```

**State 3: Restoring (76-100%)**
```
📦  ⟳  Restoring accounts and contacts...
████████████████████████  100%
```

**Progress Bar Specifications:**
```css
Background:     #242424 (gray-800)
Filled:         #F7931A (bitcoin orange)
Height:         8px
Border Radius:  4px (rounded)
Animation:      Smooth transition 200ms
```

**Spinner Icon:**
- Icon: ⟳ (rotating)
- Animation: `animate-spin`
- Duration: 1s linear infinite

---

### Step 3a: Validation Error States

**Error: Corrupted Backup File**

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  │                      ❌                                 │   │
│  │                                                         │   │
│  │              Backup File Corrupted                     │   │
│  │                                                         │   │
│  │  The backup file appears to be corrupted or damaged.   │   │
│  │  It cannot be restored.                                │   │
│  │                                                         │   │
│  │  Please try a different backup file or contact         │   │
│  │  support if this problem persists.                     │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Try Different File]  [Cancel]                                │
└────────────────────────────────────────────────────────────────┘
```

**Error: Version Incompatibility**

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                      ⚠️                                 │   │
│  │                                                         │   │
│  │           Incompatible Backup Version                  │   │
│  │                                                         │   │
│  │  This backup was created with a newer version of the   │   │
│  │  wallet (v0.15.0) that is not compatible with your     │   │
│  │  current version (v0.10.0).                            │   │
│  │                                                         │   │
│  │  Please update your wallet to the latest version and   │   │
│  │  try again.                                            │   │
│  │                                                         │   │
│  │  [Check for Updates]                                   │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Try Different File]  [Cancel]                                │
└────────────────────────────────────────────────────────────────┘
```

---

### Step 4: Success Confirmation Screen

**Purpose**: Show restoration summary and allow user to continue

```
┌────────────────────────────────────────────────────────────────┐
│                                                                 │
│                          ✅                                     │
│                                                                 │
│                Wallet Restored Successfully!                   │
│                                                                 │
│  Your wallet has been completely restored from the backup.     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📊  Restoration Summary                                 │   │
│  │                                                         │   │
│  │  Accounts Restored:     5 accounts                     │   │
│  │  • HD-derived:          3 accounts                     │   │
│  │  • Imported:            1 account                      │   │
│  │  • Multisig:            1 account                      │   │
│  │                                                         │   │
│  │  Contacts Restored:     12 contacts                    │   │
│  │  Settings Restored:     ✓                              │   │
│  │  Transaction History:   ✓                              │   │
│  │                                                         │   │
│  │  Backup Date:           October 27, 2025               │   │
│  │  Backup Version:        v0.10.0                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ℹ️  Important: Update Your Backup                      │   │
│  │                                                         │   │
│  │ Your wallet is now active. Remember to create a new    │   │
│  │ backup after making any changes to keep your backup    │   │
│  │ up to date.                                            │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Continue to Wallet]                                          │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Success Icon:**
- Icon: ✅ (green-400)
- Size: 64px (w-16 h-16)
- Animation: Scale up with bounce (animate-bounce-once)

**Summary Card Styling:**
```css
Background:     #242424 (gray-800)
Border:         1px solid #3A3A3A (gray-700)
Border Radius:  8px (rounded-lg)
Padding:        24px (p-6)
```

**Summary Layout:**
- Section title: 16px, Semibold, white
- Main stats: 15px, Medium, white
- Sub-stats: 14px, Regular, gray-400
- Bullet indentation: 16px (ml-4)
- Checkmarks: ✓ (green-400)

**Info Box (Backup Reminder):**
- Background: `bg-blue-500/10`
- Border: `border-blue-500/30`
- Icon: ℹ️ (blue-400)
- Text: blue-300

**Continue Button:**
- Style: Primary (Bitcoin orange, full width)
- Size: Large (py-3 px-6)
- Font: 16px, Semibold
- Hover: bitcoin-hover

---

### Empty State & Guidance

**If User Closes Wizard Without Selecting File:**

```
┌────────────────────────────────────────────────────────────────┐
│  Restore from Backup                                           │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ℹ️  What are encrypted backups?                        │   │
│  │                                                         │   │
│  │ Encrypted wallet backups allow you to restore your     │   │
│  │ complete wallet (accounts, contacts, settings) on      │   │
│  │ another device or after reinstalling the extension.    │   │
│  │                                                         │   │
│  │ Backups are protected with a password you choose       │   │
│  │ during export and use 600,000 PBKDF2 iterations for    │   │
│  │ maximum security.                                      │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 🔍  Where do I find my backup file?                    │   │
│  │                                                         │   │
│  │ Your backup file was created from:                     │   │
│  │ Settings > Backup & Export > Export Encrypted Backup   │   │
│  │                                                         │   │
│  │ The file has a .dat extension and a name like:         │   │
│  │ "bitcoin-wallet-backup-2025-10-27.dat"                 │   │
│  │                                                         │   │
│  │ Check your Downloads folder or wherever you saved it.  │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ 📚  Don't have a backup?                               │   │
│  │                                                         │   │
│  │ If you don't have a backup file, you can:              │   │
│  │ • Create a new wallet                                  │   │
│  │ • Import from 12-word seed phrase                      │   │
│  │                                                         │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

### Accessibility Requirements

**File Input:**
- Keyboard accessible: Tab to focus, Enter/Space to open
- ARIA labels: `aria-label="Select backup file for restoration"`
- File type restriction announced: "Only .dat files accepted"

**Drag & Drop:**
- Keyboard alternative provided (file picker button)
- Drop zone has clear visual feedback
- ARIA live region announces file selection

**Password Field:**
- Label: "Backup Password"
- Autocomplete: off
- Password manager compatible
- Show/hide toggle accessible via keyboard

**Progress Screen:**
- ARIA live region: `aria-live="polite" aria-atomic="true"`
- Status announced: "Decrypting backup file, 75% complete"
- Spinner has `role="status"` and `aria-label="Loading"`

**Error Messages:**
- `role="alert"` for immediate announcement
- Clear, actionable error text
- Focus moved to error message on display

**Success Screen:**
- Success icon has `aria-label="Success"`
- Summary stats announced to screen readers
- Continue button receives focus automatically

---

### Error Code Reference

| Code | Error | Cause | User Action |
|------|-------|-------|-------------|
| `E001` | Invalid file extension | User selected non-.dat file | Choose .dat file |
| `E002` | File too large | File exceeds 10MB | Choose smaller backup |
| `E003` | File read error | Corrupted or inaccessible file | Try different file |
| `E004` | Invalid backup format | Not a valid wallet backup | Verify file source |
| `E005` | Wrong password | Incorrect backup password | Re-enter password |
| `E006` | Password attempts exceeded | 3 failed password attempts | Wait 30 seconds |
| `E007` | Decryption failed | Crypto operation failed | Try different file |
| `E008` | Version incompatible | Backup from newer version | Update wallet |
| `E009` | Validation failed | Backup data invalid | Try different file |
| `E010` | Restoration failed | Unknown error during restore | Contact support |

---

### Component Integration

**WalletSetup.tsx Changes:**

1. Add new tab state: `'restore-backup'`
2. Create `<RestoreFromBackup />` component
3. Integrate file picker (HTML5 File API)
4. Implement drag-and-drop event handlers
5. Add validation logic (extension, size)
6. Connect to backup restoration backend handler

**New Components Needed:**

- `FileUploadArea.tsx` - Drag-and-drop + file picker
- `BackupPasswordInput.tsx` - Password field with toggle
- `RestorationProgress.tsx` - Progress bar with stages
- `RestorationSummary.tsx` - Success screen with stats

**Backend Integration:**

Message type: `RESTORE_FROM_BACKUP`

```typescript
interface RestoreFromBackupRequest {
  type: 'RESTORE_FROM_BACKUP';
  payload: {
    fileData: ArrayBuffer;
    password: string;
  };
}

interface RestoreFromBackupResponse {
  success: boolean;
  summary?: {
    accountsRestored: number;
    hdAccounts: number;
    importedAccounts: number;
    multisigAccounts: number;
    contactsRestored: number;
    backupDate: string;
    backupVersion: string;
  };
  error?: {
    code: string;
    message: string;
  };
}
```

---

### Removed: "Key" Tab

**What happens to private key import?**

Private key import moves to **post-setup**, accessible via:
1. **Account Switcher** dropdown → "Import Account" button
2. **Settings Screen** → "+ Import Account" button

**Rationale:**
- Private key import is for adding **individual accounts**, not creating **wallets**
- Aligns with industry standards (MetaMask, Ledger)
- Reduces cognitive load during wallet setup
- Progressive disclosure: advanced feature revealed when user has context

---

### User Guidance Flow

**Scenario**: User wants to import a single private key

**Current (Confusing) Flow:**
```
1. User opens wallet for first time
2. Sees "Key" tab, clicks it
3. Imports private key
4. Now has NON-HD wallet (can't derive accounts, no xpub, etc.)
5. User confused why "Create Account" doesn't work as expected
```

**New (Clear) Flow:**
```
1. User opens wallet for first time
2. Sees "Create Wallet" and "Import Wallet" (seed-based)
3. Reads info box: "Need to import private key? Create wallet first"
4. Creates HD wallet (or imports seed)
5. Opens account switcher → "Import Account"
6. Imports private key as additional account
7. Now has: HD wallet (primary) + imported account (clearly labeled)
```

**Result**: Clear separation of concerns. HD wallet is the foundation, imported keys are additions.

---

## Account Grouping - Sidebar

### Current State (Flat List)

```
┌──────────────────────────────────┐
│ Account Switcher                 │
├──────────────────────────────────┤
│ ● Main Account                   │
│   Native SegWit                  │
│                                  │
│ ○ Savings                        │
│   Native SegWit                  │
│                                  │
│ ○ Trading Account                │
│   Legacy                         │
│                                  │
│ ○ Imported Ledger                │
│   Native SegWit                  │
│                                  │
│ ○ 2-of-3 Safe                    │
│   P2WSH  🔐2/3                   │
├──────────────────────────────────┤
│ [+ Create Account]               │
│ [↓ Import Account]               │
│ [🔐 Create Multisig Account]     │
└──────────────────────────────────┘
```

**PROBLEM**: Can't tell HD-derived from imported. All look the same.

---

### New State (Grouped with Sections)

```
┌──────────────────────────────────────────┐
│ Account Switcher                         │
├──────────────────────────────────────────┤
│ HD-DERIVED ACCOUNTS                      │
│ ▼                                        │
│ ● Main Account                           │
│   Native SegWit                          │
│   [HD]                                   │
│                                          │
│ ○ Savings                                │
│   Native SegWit                          │
│   [HD]                                   │
│                                          │
│ ○ Trading Account                        │
│   Legacy                                 │
│   [HD]                                   │
├──────────────────────────────────────────┤
│ IMPORTED ACCOUNTS                        │
│ ▼                                        │
│ ○ Imported Ledger                        │
│   Native SegWit                          │
│   [🔑 Imported]                          │
├──────────────────────────────────────────┤
│ MULTISIG ACCOUNTS                        │
│ ▼                                        │
│ ○ 2-of-3 Safe                            │
│   P2WSH                                  │
│   [🔐 2/3]                               │
├──────────────────────────────────────────┤
│ [+ Create Account]                       │
│ [↓ Import Account]                       │
│ [🔐 Create Multisig Account]             │
└──────────────────────────────────────────┘
```

**SOLUTION**: Three collapsible sections with clear labels and badges.

---

### Section Header Specifications

#### HD-Derived Accounts Header

```css
Font:           12px, Medium (text-xs font-medium)
Color:          #808080 (text-gray-500)
Spacing:        12px top padding, 8px bottom padding
Letter Spacing: 0.05em (tracking-wider)
Background:     Transparent
```

**Tailwind Classes:**
```tsx
<div className="
  px-4 pt-3 pb-2
  text-xs font-medium text-gray-500 uppercase tracking-wider
  flex items-center justify-between
">
  <span>HD-Derived Accounts</span>
  <button className="text-gray-400 hover:text-white transition-colors">
    {/* Chevron icon for collapse/expand */}
  </button>
</div>
```

**Collapsed State:**
```
┌──────────────────────────────────────────┐
│ HD-DERIVED ACCOUNTS           ▶ (3)      │
├──────────────────────────────────────────┤
```

**Expanded State:**
```
┌──────────────────────────────────────────┐
│ HD-DERIVED ACCOUNTS           ▼ (3)      │
│ ● Main Account                           │
│   Native SegWit                          │
│   [HD]                                   │
│ ○ Savings                                │
│ ○ Trading Account                        │
├──────────────────────────────────────────┤
```

**Behavior:**
- Click header to toggle collapse/expand
- Chevron icon rotates (▶ → ▼)
- Count badge shows number of accounts in section
- Remembers state in localStorage

---

#### Imported Accounts Header

**Same styling as HD header, different label:**

```tsx
<div className="
  px-4 pt-3 pb-2
  text-xs font-medium text-gray-500 uppercase tracking-wider
  flex items-center justify-between
">
  <span>Imported Accounts</span>
  <button className="text-gray-400 hover:text-white transition-colors">
    {/* Chevron icon */}
  </button>
</div>
```

---

#### Multisig Accounts Header

**Same styling, different label:**

```tsx
<div className="
  px-4 pt-3 pb-2
  text-xs font-medium text-gray-500 uppercase tracking-wider
  flex items-center justify-between
">
  <span>Multisig Accounts</span>
  <button className="text-gray-400 hover:text-white transition-colors">
    {/* Chevron icon */}
  </button>
</div>
```

---

### Account Item Badges

#### HD Badge

```
[HD]
```

**Specifications:**
```css
Background:     rgba(59, 130, 246, 0.15) (blue-500/15)
Border:         1px solid rgba(59, 130, 246, 0.3) (blue-500/30)
Text:           #93BBFD (blue-300)
Font:           11px, Semibold (text-xs font-semibold)
Padding:        2px 8px (px-2 py-0.5)
Border Radius:  4px (rounded)
```

**Tailwind Implementation:**
```tsx
<span className="
  px-2 py-0.5
  text-xs font-semibold
  bg-blue-500/15 text-blue-300 border border-blue-500/30
  rounded
">
  HD
</span>
```

**Tooltip on hover:**
```
"HD-derived account from your seed phrase"
```

---

#### Imported Badge

```
[🔑 Imported]
```

**Specifications:**
```css
Background:     rgba(245, 158, 11, 0.12) (amber-500/12)
Border:         1px solid rgba(245, 158, 11, 0.3) (amber-500/30)
Text:           #FCD34D (amber-300)
Icon:           🔑 (Key emoji)
Font:           11px, Semibold
Padding:        2px 8px
Border Radius:  4px
```

**Tailwind Implementation:**
```tsx
<span className="
  px-2 py-0.5
  text-xs font-semibold
  bg-amber-500/12 text-amber-300 border border-amber-500/30
  rounded
  flex items-center gap-1
">
  🔑 Imported
</span>
```

**Tooltip on hover:**
```
"Account imported from private key (WIF)"
```

---

### Complete Sidebar Account Item

```
┌──────────────────────────────────────────────────────┐
│  ●  [A]  Main Account                    [HD]        │
│          Native SegWit                               │
│          ✓                                           │
└──────────────────────────────────────────────────────┘
```

**Breakdown:**
- **●**: Active indicator (Bitcoin Orange dot)
- **[A]**: Account avatar (first letter, gradient background)
- **Name**: Account name (white, semibold)
- **Badge**: [HD] or [🔑 Imported] or [🔐 2/3]
- **Address Type**: Secondary text (gray-400)
- **Checkmark**: Active account indicator

**Hover State:**
```css
Background:     #242424 (bg-gray-800)
Border Left:    2px solid transparent → 2px solid Bitcoin Orange
```

**Active State:**
```css
Background:     rgba(247, 147, 26, 0.1) (bg-bitcoin-subtle)
Border Left:    2px solid #F7931A (border-bitcoin)
```

---

### Section Dividers

**Visual Specification:**
```css
Height:         1px
Background:     #2E2E2E (gray-750)
Margin:         12px 0 (my-3)
```

**Tailwind:**
```tsx
<div className="border-t border-gray-750 my-3"></div>
```

---

### Collapsible Behavior

**States:**
1. **All Expanded** (default on first use)
2. **User Collapses Section** → Save state to localStorage
3. **Restore State** on next dropdown open

**localStorage Key:**
```typescript
interface AccountSectionState {
  hdDerived: boolean; // true = expanded
  imported: boolean;
  multisig: boolean;
}

localStorage.setItem('account-section-state', JSON.stringify({
  hdDerived: true,
  imported: true,
  multisig: false
}));
```

**Animation:**
```css
transition: max-height 200ms ease-in-out;
```

---

### Empty Section States

#### No Imported Accounts (Section Hidden)

**Behavior**: If there are zero imported accounts, don't show the "IMPORTED ACCOUNTS" section at all.

**Rationale**: Reduce visual clutter. Show sections only when relevant.

---

#### No Multisig Accounts (Section Hidden)

**Same behavior**: Hide section if empty.

---

#### Only Imported Accounts (No HD Accounts)

**Edge Case**: User created wallet with seed, but then deleted all HD accounts and only has imported accounts.

**Behavior**: Show "IMPORTED ACCOUNTS" section, hide "HD-DERIVED ACCOUNTS" section.

**Warning Message** (optional):
```
┌──────────────────────────────────────────────────────┐
│ ℹ️  You have no HD-derived accounts                   │
│                                                       │
│ Consider creating an HD account for easier backup    │
│ and multi-account management.                        │
│                                                       │
│ [+ Create HD Account]                                │
└──────────────────────────────────────────────────────┘
```

---

## Account Grouping - Settings Screen

### Current State (Flat List)

```
┌─────────────────────────────────────────────────────────┐
│ Accounts                          + Import   + Create   │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Main Account                                        │ │
│ │ Native SegWit (Bech32)                              │ │
│ │                                                     │ │
│ │ [Export Xpub] [Export Key] [Rename] [Delete]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Savings                                             │ │
│ │ Native SegWit (Bech32)                              │ │
│ │                                                     │ │
│ │ [Export Xpub] [Export Key] [Rename] [Delete]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Imported Ledger  [🔑 Imported]                      │ │
│ │ Native SegWit (Bech32)                              │ │
│ │                                                     │ │
│ │ [Export Xpub] [Export Key] [Rename] [Delete]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2-of-3 Safe  [🔐 2/3]                               │ │
│ │ P2WSH (Native SegWit)                               │ │
│ │                                                     │ │
│ │ [Export Xpub] [Rename] [Delete]                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**PROBLEM**:
- Export Xpub shows for imported accounts (incorrect)
- No visual grouping
- All accounts look the same

---

### New State (Grouped Sections)

```
┌─────────────────────────────────────────────────────────┐
│ Accounts                                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ HD-DERIVED ACCOUNTS                    + Create     ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ These accounts are derived from your seed phrase.      │
│ You can create unlimited accounts and restore them     │
│ using your 12-word seed phrase.                        │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Main Account                           [HD]          │ │
│ │ Native SegWit (Bech32)                              │ │
│ │                                                     │ │
│ │ [Export Xpub] [Export Key] [Rename] [Delete]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Savings                                [HD]          │ │
│ │ Native SegWit (Bech32)                              │ │
│ │                                                     │ │
│ │ [Export Xpub] [Export Key] [Rename] [Delete]       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ IMPORTED ACCOUNTS                      + Import     ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ These accounts were imported from private keys (WIF).  │
│ They are NOT derived from your seed phrase and must    │
│ be backed up separately.                               │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Imported Ledger                   [🔑 Imported]      │ │
│ │ Native SegWit (Bech32)                              │ │
│ │                                                     │ │
│ │ [Export Key] [Rename] [Delete]                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ MULTISIG ACCOUNTS              + Create Multisig   ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ Multi-signature accounts require multiple signatures  │
│ to spend funds. These can be HD-derived or imported.   │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2-of-3 Safe                       [🔐 2/3]           │ │
│ │ P2WSH (Native SegWit)                               │ │
│ │                                                     │ │
│ │ [Export Xpub] [Rename] [Delete]                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**SOLUTION**:
- Three distinct sections with headers
- Educational descriptions under each header
- Context-aware action buttons in headers
- Export buttons respect account type

---

### Section Header Specifications (Settings)

**Visual Design:**

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ HD-DERIVED ACCOUNTS                    + Create     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Specifications:**
```css
Background:     #1E1E1E (gray-850)
Border:         2px solid #3A3A3A (gray-700)
Border Radius:  8px (rounded-lg)
Padding:        16px 20px (px-5 py-4)
Font:           14px, Semibold (text-sm font-semibold)
Text Color:     #FFFFFF (white)
Letter Spacing: 0.02em
Margin Bottom:  12px
```

**Tailwind Implementation:**
```tsx
<div className="
  bg-gray-850 border-2 border-gray-700 rounded-lg
  px-5 py-4 mb-3
  flex items-center justify-between
">
  <h3 className="text-sm font-semibold text-white tracking-wide">
    HD-DERIVED ACCOUNTS
  </h3>
  <button className="
    text-sm font-semibold text-bitcoin hover:text-bitcoin-hover
    transition-colors
  ">
    + Create
  </button>
</div>
```

**Variations:**

1. **HD-Derived Accounts** → "+ Create" button
2. **Imported Accounts** → "+ Import" button
3. **Multisig Accounts** → "+ Create Multisig" button

---

### Section Description

**Purpose**: Educate users on account type differences

**Specifications:**
```css
Font:           13px, Regular (text-sm)
Color:          #B4B4B4 (text-gray-400)
Line Height:    1.5
Padding:        0 20px 16px 20px (px-5 pb-4)
Max Width:      100% (wraps at container width)
```

**Tailwind:**
```tsx
<p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">
  These accounts are derived from your seed phrase.
  You can create unlimited accounts and restore them
  using your 12-word seed phrase.
</p>
```

**Copy Guidelines:**
- **HD-Derived**: Emphasize seed phrase backup, unlimited accounts
- **Imported**: Warn about separate backup, not tied to seed
- **Multisig**: Explain multi-signature, mention HD vs imported xpubs

---

### Account Card Specifications

**Card Container:**
```css
Background:     #242424 (gray-800)
Border:         1px solid #3A3A3A (gray-700)
Border Radius:  8px (rounded-lg)
Padding:        16px 20px (px-5 py-4)
Margin Bottom:  12px (mb-3)
Hover:          Border color → #4A4A4A
```

**Tailwind:**
```tsx
<div className="
  bg-gray-800 border border-gray-700 rounded-lg
  px-5 py-4 mb-3
  hover:border-gray-600 transition-colors
">
  {/* Card content */}
</div>
```

---

### Account Card Layout

```
┌─────────────────────────────────────────────────────┐
│ Main Account                           [HD]          │
│ Native SegWit (Bech32)                              │
│                                                     │
│ [Export Xpub] [Export Key] [Rename] [Delete]       │
└─────────────────────────────────────────────────────┘
```

**Structure:**

**Row 1: Name and Badge**
```tsx
<div className="flex items-center justify-between mb-1">
  <p className="font-semibold text-white text-base">
    Main Account
  </p>
  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded">
    HD
  </span>
</div>
```

**Row 2: Address Type**
```tsx
<p className="text-sm text-gray-500 mb-4">
  Native SegWit (Bech32)
</p>
```

**Row 3: Action Buttons**
```tsx
<div className="flex flex-wrap gap-2">
  <button className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors">
    Export Xpub
  </button>
  <button className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors">
    Export Key
  </button>
  <button className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors">
    Rename
  </button>
  <button className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-semibold transition-colors">
    Delete
  </button>
</div>
```

---

### Section Ordering

**Priority:**
1. **HD-Derived Accounts** (first, most common)
2. **Imported Accounts** (second)
3. **Multisig Accounts** (third)

**Rationale**: HD accounts are the primary wallet structure. Most users will only have HD accounts. Imported and multisig are advanced features.

---

## Export Button Logic

### Decision Matrix

| Account Type | Import Type | Export Xpub | Export Key |
|--------------|-------------|-------------|------------|
| Single-sig   | HD          | ✅ YES      | ✅ YES     |
| Single-sig   | Private Key | ❌ NO       | ✅ YES     |
| Multisig     | HD          | ✅ YES      | ❌ NO      |
| Multisig     | Imported    | ✅ YES      | ❌ NO      |

**Logic:**

**Export Xpub:**
- Show if: `account.accountType === 'single' && account.importType !== 'private-key'`
- Show if: `account.accountType === 'multisig'` (multisig always has xpubs)
- Hide if: `account.importType === 'private-key'` (no xpub exists)

**Export Key:**
- Show if: `account.accountType === 'single'` (all single-sig, regardless of import type)
- Hide if: `account.accountType === 'multisig'` (multisig has multiple keys, no single "export key")

---

### Button Specifications

#### Export Xpub Button (When Visible)

**Visual:**
```css
Background:     #242424 (gray-900)
Border:         1px solid #3A3A3A (gray-700)
Text:           #B4B4B4 (gray-300)
Padding:        8px 16px (px-4 py-2)
Font:           14px, Semibold (text-sm font-semibold)
Border Radius:  8px (rounded-lg)
```

**States:**
```css
Hover:      bg-gray-800 border-gray-600
Active:     bg-gray-750
```

**Tailwind:**
```tsx
<button className="
  px-4 py-2 text-sm
  bg-gray-900 hover:bg-gray-800
  border border-gray-700 hover:border-gray-600
  text-gray-300 hover:text-white
  rounded-lg font-semibold
  transition-colors duration-200
" title="Export extended public key">
  Export Xpub
</button>
```

---

#### Export Key Button (When Visible)

**Same styling as Export Xpub**

**Tailwind:**
```tsx
<button className="
  px-4 py-2 text-sm
  bg-gray-900 hover:bg-gray-800
  border border-gray-700 hover:border-gray-600
  text-gray-300 hover:text-white
  rounded-lg font-semibold
  transition-colors duration-200
" title="Export private key (WIF)">
  Export Key
</button>
```

---

### Tooltip Guidance

**Export Xpub Tooltip:**
```
"Export extended public key (xpub) for watch-only wallets or multisig coordination. This does NOT expose your private keys."
```

**Export Key Tooltip:**
```
"Export private key (WIF format) for importing into other wallets. Keep this secure - it controls your funds."
```

**Disabled Export Xpub Tooltip** (if button were disabled, which it won't be - we hide it):
```
"This account was imported from a private key and does not have an extended public key."
```

---

### Implementation Strategy

**Option A: Conditional Rendering (RECOMMENDED)**

```tsx
{account.importType !== 'private-key' && (
  <button>Export Xpub</button>
)}

{account.accountType === 'single' && (
  <button>Export Key</button>
)}
```

**Rationale**: Cleaner UI. No disabled buttons cluttering the interface.

---

**Option B: Disabled with Tooltip (NOT RECOMMENDED)**

```tsx
<button
  disabled={account.importType === 'private-key'}
  title={account.importType === 'private-key' ? 'No xpub available for imported accounts' : ''}
>
  Export Xpub
</button>
```

**Rationale**: More verbose, cluttered UI. Users don't need to see unavailable options.

---

### Code Example (Settings Account Card)

```tsx
interface AccountCardProps {
  account: WalletAccount;
  onExportXpub: () => void;
  onExportKey: () => void;
  onRename: () => void;
  onDelete: () => void;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onExportXpub,
  onExportKey,
  onRename,
  onDelete
}) => {
  // Determine if Export Xpub should show
  const showExportXpub = account.accountType === 'multisig' ||
    (account.accountType === 'single' && account.importType !== 'private-key');

  // Determine if Export Key should show
  const showExportKey = account.accountType === 'single';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-5 py-4 mb-3 hover:border-gray-600 transition-colors">
      {/* Row 1: Name and Badge */}
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-white text-base">
          {account.name}
        </p>
        {/* Badge based on account type */}
        {account.accountType === 'single' && (
          <>
            {account.importType === 'private-key' ? (
              <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/12 text-amber-300 border border-amber-500/30 rounded">
                🔑 Imported
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded">
                HD
              </span>
            )}
          </>
        )}
        {account.accountType === 'multisig' && (
          <MultisigBadge config={account.multisigConfig} />
        )}
      </div>

      {/* Row 2: Address Type */}
      <p className="text-sm text-gray-500 mb-4">
        {getAddressTypeLabel(account)}
      </p>

      {/* Row 3: Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {showExportXpub && (
          <button
            onClick={onExportXpub}
            className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg font-semibold transition-colors"
            title="Export extended public key"
          >
            Export Xpub
          </button>
        )}

        {showExportKey && (
          <button
            onClick={onExportKey}
            className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg font-semibold transition-colors"
            title="Export private key (WIF)"
          >
            Export Key
          </button>
        )}

        <button
          onClick={onRename}
          className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg font-semibold transition-colors"
        >
          Rename
        </button>

        <button
          onClick={onDelete}
          disabled={/* only account logic */}
          className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Delete
        </button>
      </div>
    </div>
  );
};
```

---

## Edge Cases & Empty States

### Edge Case 1: Only Imported Accounts (No HD Accounts)

**Scenario**: User imported wallet from seed, then deleted all HD accounts, leaving only imported accounts.

**Sidebar Behavior:**
```
┌──────────────────────────────────────────┐
│ Account Switcher                         │
├──────────────────────────────────────────┤
│ IMPORTED ACCOUNTS           ▼ (1)        │
│ ○ Imported Ledger                        │
│   Native SegWit                          │
│   [🔑 Imported]                          │
├──────────────────────────────────────────┤
│ ℹ️  No HD-derived accounts                │
│                                          │
│ Create an HD account for easier backup   │
│ and multi-account management.            │
│                                          │
│ [+ Create Account]                       │
├──────────────────────────────────────────┤
│ [↓ Import Account]                       │
│ [🔐 Create Multisig Account]             │
└──────────────────────────────────────────┘
```

**Settings Behavior:**
```
┌─────────────────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ HD-DERIVED ACCOUNTS                    + Create     ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ℹ️  No HD-derived accounts                           │ │
│ │                                                     │ │
│ │ You don't have any accounts derived from your seed  │ │
│ │ phrase. Create an HD account for easier backup and  │ │
│ │ multi-account management.                           │ │
│ │                                                     │ │
│ │ [+ Create HD Account]                               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Design Decision**: Show empty state with educational messaging and clear CTA to create HD account.

---

### Edge Case 2: Only HD Accounts (No Imported, No Multisig)

**Scenario**: Most common case - user created wallet and only uses HD accounts.

**Sidebar Behavior:**
```
┌──────────────────────────────────────────┐
│ Account Switcher                         │
├──────────────────────────────────────────┤
│ HD-DERIVED ACCOUNTS           ▼ (3)      │
│ ● Main Account                           │
│   Native SegWit                          │
│   [HD]                                   │
│ ○ Savings                                │
│ ○ Trading Account                        │
├──────────────────────────────────────────┤
│ [+ Create Account]                       │
│ [↓ Import Account]                       │
│ [🔐 Create Multisig Account]             │
└──────────────────────────────────────────┘
```

**Settings Behavior:**
```
┌─────────────────────────────────────────────────────────┐
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ HD-DERIVED ACCOUNTS                    + Create     ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                         │
│ These accounts are derived from your seed phrase...    │
│                                                         │
│ (HD accounts listed here)                              │
└─────────────────────────────────────────────────────────┘
```

**Design Decision**: Only show HD section. Don't show empty states for Imported/Multisig sections - keep it clean.

---

### Edge Case 3: Only Multisig Accounts (Rare)

**Scenario**: User created wallet, deleted all single-sig accounts, only has multisig.

**Behavior**: Same as Edge Case 2 - only show populated sections.

---

### Edge Case 4: Mixed Accounts (HD + Imported + Multisig)

**Scenario**: Power user with complex wallet structure.

**Sidebar Behavior:**
```
┌──────────────────────────────────────────┐
│ Account Switcher                         │
├──────────────────────────────────────────┤
│ HD-DERIVED ACCOUNTS           ▼ (2)      │
│ ● Main Account                           │
│ ○ Savings                                │
├──────────────────────────────────────────┤
│ IMPORTED ACCOUNTS             ▼ (1)      │
│ ○ Imported Ledger                        │
├──────────────────────────────────────────┤
│ MULTISIG ACCOUNTS             ▼ (1)      │
│ ○ 2-of-3 Safe                            │
├──────────────────────────────────────────┤
│ [+ Create Account]                       │
│ [↓ Import Account]                       │
│ [🔐 Create Multisig Account]             │
└──────────────────────────────────────────┘
```

**Settings Behavior:**
```
All three sections visible with appropriate accounts listed.
```

**Design Decision**: Show all sections. This is the full experience.

---

### Empty State Specifications

**Empty State Container:**
```css
Background:     #242424 (gray-800)
Border:         1px dashed #3A3A3A (gray-700)
Border Radius:  8px (rounded-lg)
Padding:        24px (p-6)
Text Align:     Center
```

**Tailwind:**
```tsx
<div className="
  bg-gray-800 border border-dashed border-gray-700 rounded-lg
  p-6 text-center
">
  <div className="flex items-center justify-center mb-3">
    <svg className="w-12 h-12 text-gray-600" /* Info icon */>
  </div>
  <p className="text-sm text-gray-400 mb-4">
    No HD-derived accounts found. Create an HD account for easier
    backup and multi-account management.
  </p>
  <button className="
    px-4 py-2 bg-bitcoin hover:bg-bitcoin-hover
    text-white rounded-lg font-semibold text-sm
    transition-colors
  ">
    + Create HD Account
  </button>
</div>
```

---

## User Journey Diagrams

### Journey 1: First-Time Wallet Creation (HD)

```
┌─────────────────────┐
│ Open Extension      │
│ (First Time)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Wallet Setup Screen │
│                     │
│ [Create] [Import]   │ ◄── ONLY SEED OPTIONS
└──────────┬──────────┘
           │
           │ User clicks "Create Wallet"
           ▼
┌─────────────────────┐
│ Choose Address Type │
│ Enter Password      │
└──────────┬──────────┘
           │
           │ Click "Create Wallet"
           ▼
┌─────────────────────┐
│ Backup Seed Phrase  │
│ (12 words)          │
└──────────┬──────────┘
           │
           │ Confirm backup checkbox
           │ Click "Continue"
           ▼
┌─────────────────────┐
│ Wallet Unlocked     │
│ Dashboard View      │
│                     │
│ 1 HD Account (Main) │
└─────────────────────┘
```

**Result**: User has HD wallet with 1 HD-derived account.

---

### Journey 2: Import Existing Wallet (Seed)

```
┌─────────────────────┐
│ Open Extension      │
│ (First Time)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Wallet Setup Screen │
│                     │
│ Create [Import]     │ ◄── Click "Import Wallet"
└──────────┬──────────┘
           │
           │ User enters seed phrase
           ▼
┌─────────────────────┐
│ Enter Seed Phrase   │
│ Choose Address Type │
│ Enter Password      │
└──────────┬──────────┘
           │
           │ Click "Import Wallet"
           ▼
┌─────────────────────┐
│ Wallet Unlocked     │
│ Dashboard View      │
│                     │
│ 1 HD Account (Main) │
│ (Restored)          │
└─────────────────────┘
```

**Result**: User has imported HD wallet with previously created accounts restored.

---

### Journey 3: User Wants to Import Private Key

**Scenario**: User has a private key from another wallet and wants to import it.

```
┌─────────────────────┐
│ Open Extension      │
│ (First Time)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Wallet Setup Screen │
│                     │
│ [Create] [Import]   │ ◄── NO "KEY" TAB
└──────────┬──────────┘
           │
           │ User looks for private key import
           │ Sees info box in "Import Wallet" tab
           ▼
┌─────────────────────┐
│ Import Wallet Tab   │
│                     │
│ ℹ️  Need to import  │
│ a private key?      │
│                     │
│ Create or import a  │
│ wallet first, then  │
│ use "Import Account"│
└──────────┬──────────┘
           │
           │ User creates or imports HD wallet
           ▼
┌─────────────────────┐
│ Wallet Unlocked     │
│ Dashboard View      │
└──────────┬──────────┘
           │
           │ Open Account Switcher
           ▼
┌─────────────────────┐
│ Account Switcher    │
│                     │
│ [↓ Import Account]  │ ◄── Click here
└──────────┬──────────┘
           │
           │ Import Account Modal opens
           ▼
┌─────────────────────┐
│ Import Account      │
│                     │
│ [Private Key]       │ ◄── Enter WIF
│ [File Upload]       │
└──────────┬──────────┘
           │
           │ Import successful
           ▼
┌─────────────────────┐
│ Account Switcher    │
│                     │
│ HD ACCOUNTS (1)     │
│ • Main Account      │
│                     │
│ IMPORTED (1)        │
│ • Imported Account  │ ◄── NEW
└─────────────────────┘
```

**Result**: User has HD wallet (primary) + imported account (clearly labeled).

---

### Journey 4: Adding More Accounts (HD)

```
┌─────────────────────┐
│ Dashboard View      │
│ (Wallet Unlocked)   │
└──────────┬──────────┘
           │
           │ Open Account Switcher
           ▼
┌─────────────────────┐
│ Account Switcher    │
│                     │
│ [+ Create Account]  │ ◄── Click here
└──────────┬──────────┘
           │
           │ Create Account Modal opens
           ▼
┌─────────────────────┐
│ Create Account      │
│                     │
│ Name: [Savings]     │
│ Type: [Native SW]   │
└──────────┬──────────┘
           │
           │ Click "Create"
           ▼
┌─────────────────────┐
│ Account Switcher    │
│                     │
│ HD ACCOUNTS (2)     │
│ • Main Account      │
│ • Savings           │ ◄── NEW
└─────────────────────┘
```

**Result**: New HD-derived account created and grouped with existing HD accounts.

---

### Journey 5: Exporting Xpub (HD Account)

```
┌─────────────────────┐
│ Settings Screen     │
└──────────┬──────────┘
           │
           │ Scroll to "HD Accounts" section
           ▼
┌─────────────────────┐
│ HD ACCOUNTS         │
│                     │
│ Main Account [HD]   │
│ [Export Xpub]       │ ◄── Click here
└──────────┬──────────┘
           │
           │ Export Xpub Modal opens
           ▼
┌─────────────────────┐
│ Export Xpub Modal   │
│                     │
│ Warning: Public key │
│ Xpub: [zpub...]     │
│ [Copy] [QR Code]    │
└─────────────────────┘
```

**Result**: User exports xpub for watch-only wallet or multisig coordination.

---

### Journey 6: Exporting Private Key (Imported Account)

```
┌─────────────────────┐
│ Settings Screen     │
└──────────┬──────────┘
           │
           │ Scroll to "Imported Accounts" section
           ▼
┌─────────────────────┐
│ IMPORTED ACCOUNTS   │
│                     │
│ Imported [🔑]       │
│ [Export Key]        │ ◄── ONLY "Export Key" shows
│ (NO "Export Xpub")  │
└──────────┬──────────┘
           │
           │ Export Key Modal opens
           ▼
┌─────────────────────┐
│ Export Private Key  │
│                     │
│ Password: [•••]     │
│ WIF: [L4rK9y...]    │
│ [Copy] [PDF]        │
└─────────────────────┘
```

**Result**: User exports private key for imported account. No xpub option (because none exists).

---

## Component Specifications

### 1. Wallet Setup Tabs Component

**Component Name**: `WalletSetupTabs`

**Props:**
```typescript
interface WalletSetupTabsProps {
  activeTab: 'create' | 'import' | 'restore-backup';
  onTabChange: (tab: 'create' | 'import' | 'restore-backup') => void;
}
```

**Implementation:**
```tsx
<div className="flex border-b border-gray-800 mb-6">
  <button
    onClick={() => onTabChange('create')}
    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
      activeTab === 'create'
        ? 'text-bitcoin border-b-2 border-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Create Wallet
  </button>
  <button
    onClick={() => onTabChange('import')}
    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
      activeTab === 'import'
        ? 'text-bitcoin border-b-2 border-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Import Wallet
  </button>
  <button
    onClick={() => onTabChange('restore-backup')}
    className={`flex-1 py-3 text-sm font-semibold transition-colors ${
      activeTab === 'restore-backup'
        ? 'text-bitcoin border-b-2 border-bitcoin'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    Restore from Backup
  </button>
</div>
```

---

### 2. Account Section Header Component

**Component Name**: `AccountSectionHeader`

**Props:**
```typescript
interface AccountSectionHeaderProps {
  title: string;
  count: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  actionLabel?: string;
  onAction?: () => void;
}
```

**Implementation (Sidebar):**
```tsx
const AccountSectionHeader: React.FC<AccountSectionHeaderProps> = ({
  title,
  count,
  isCollapsed,
  onToggleCollapse,
  actionLabel,
  onAction
}) => {
  return (
    <div
      onClick={onToggleCollapse}
      className="px-4 pt-3 pb-2 text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center justify-between cursor-pointer hover:text-gray-400 transition-colors"
    >
      <span>{title}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">({count})</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            isCollapsed ? '' : 'rotate-90'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};
```

**Implementation (Settings):**
```tsx
const AccountSectionHeaderSettings: React.FC<AccountSectionHeaderProps> = ({
  title,
  actionLabel,
  onAction
}) => {
  return (
    <div className="bg-gray-850 border-2 border-gray-700 rounded-lg px-5 py-4 mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-white tracking-wide uppercase">
        {title}
      </h3>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="text-sm font-semibold text-bitcoin hover:text-bitcoin-hover transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
```

---

### 3. Account Badge Component

**Component Name**: `AccountTypeBadge`

**Props:**
```typescript
interface AccountTypeBadgeProps {
  type: 'hd' | 'imported' | 'multisig';
  multisigConfig?: { requiredSignatures: number; totalSigners: number };
}
```

**Implementation:**
```tsx
const AccountTypeBadge: React.FC<AccountTypeBadgeProps> = ({ type, multisigConfig }) => {
  if (type === 'hd') {
    return (
      <span
        className="px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded"
        title="HD-derived account from your seed phrase"
      >
        HD
      </span>
    );
  }

  if (type === 'imported') {
    return (
      <span
        className="px-2 py-0.5 text-xs font-semibold bg-amber-500/12 text-amber-300 border border-amber-500/30 rounded flex items-center gap-1"
        title="Account imported from private key (WIF)"
      >
        🔑 Imported
      </span>
    );
  }

  if (type === 'multisig' && multisigConfig) {
    return (
      <span
        className="px-2 py-0.5 text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 rounded flex items-center gap-1"
        title={`${multisigConfig.requiredSignatures}-of-${multisigConfig.totalSigners} multisig`}
      >
        🔐 {multisigConfig.requiredSignatures}/{multisigConfig.totalSigners}
      </span>
    );
  }

  return null;
};
```

---

### 4. Account Card Component (Settings)

**Component Name**: `AccountCardSettings`

**Props:**
```typescript
interface AccountCardSettingsProps {
  account: WalletAccount;
  onExportXpub?: () => void;
  onExportKey?: () => void;
  onRename: () => void;
  onDelete: () => void;
  isOnlyAccount: boolean;
}
```

**Implementation:** See [Export Button Logic](#export-button-logic) section for full code example.

---

### 5. Import Account Info Box (Wallet Setup)

**Component Name**: `ImportKeyInfoBox`

**Implementation:**
```tsx
const ImportKeyInfoBox: React.FC = () => {
  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
      <div className="flex items-start gap-3">
        <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-blue-300 mb-1">
            Need to import a single private key?
          </p>
          <p className="text-xs text-blue-300/80 leading-relaxed">
            First create or import a wallet above, then use "Import Account"
            from the account switcher or Settings to add individual private keys.
          </p>
        </div>
      </div>
    </div>
  );
};
```

**Usage:** Place at bottom of "Import Wallet" tab content.

---

## Accessibility

### Keyboard Navigation

**Tab Order (Wallet Setup):**
1. Tab 1: "Create Wallet"
2. Tab 2: "Import Wallet"
3. Tab 3: "Restore from Backup"
4. Form fields (address type, password, etc.)
5. Submit button

**Tab Order (Account Switcher):**
1. Account Switcher trigger button
2. Section headers (collapsible)
3. Account items
4. Action buttons (Create, Import, Multisig)

**Keyboard Shortcuts:**
- `Enter` / `Space`: Toggle section collapse
- `Escape`: Close account switcher dropdown
- `Arrow Up/Down`: Navigate between accounts (when dropdown open)
- `Tab`: Navigate through action buttons

---

### ARIA Labels

**Account Switcher:**
```tsx
<button
  ref={triggerRef}
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  aria-expanded={isDropdownOpen}
  aria-haspopup="true"
  aria-label="Account switcher"
  aria-controls="account-dropdown"
>
  {/* Trigger content */}
</button>

<div
  ref={dropdownRef}
  id="account-dropdown"
  role="menu"
  aria-label="Account management menu"
  className={/* ... */}
>
  {/* Dropdown content */}
</div>
```

**Section Headers (Collapsible):**
```tsx
<button
  onClick={onToggleCollapse}
  aria-expanded={!isCollapsed}
  aria-label={`${title}, ${count} accounts, ${isCollapsed ? 'collapsed' : 'expanded'}`}
  aria-controls={`section-${sectionId}`}
>
  {/* Header content */}
</button>

<div
  id={`section-${sectionId}`}
  role="group"
  aria-labelledby={`header-${sectionId}`}
  className={/* ... */}
>
  {/* Section content */}
</div>
```

**Account Items:**
```tsx
<button
  role="menuitem"
  aria-label={`Switch to ${account.name}, ${getAccountTypeLabel(account)}, ${isActive ? 'currently active' : 'not active'}`}
  onClick={() => onAccountSwitch(index)}
>
  {/* Account item content */}
</button>
```

---

### Screen Reader Announcements

**When Section Collapses:**
```
"HD-Derived Accounts section collapsed, 3 accounts"
```

**When Section Expands:**
```
"HD-Derived Accounts section expanded, showing 3 accounts"
```

**When Switching Accounts:**
```
"Switched to Savings account, HD-derived, Native SegWit"
```

**When Creating Account:**
```
"New account created: Trading Account, HD-derived"
```

---

### Focus Management

**Modal Open:**
- Focus first interactive element (usually first input field)

**Modal Close:**
- Return focus to trigger element (button that opened modal)

**Account Switch:**
- Focus remains in dropdown (for quick switching)
- After dropdown closes, focus returns to trigger button

**Section Collapse/Expand:**
- Focus remains on section header button

---

### Color Contrast (WCAG AA)

**Badges:**
- HD Badge (blue-300 on blue-500/15): 8.5:1 ✅
- Imported Badge (amber-300 on amber-500/12): 7.2:1 ✅
- Multisig Badge (purple-300 on purple-500/15): 8.1:1 ✅

**Section Headers:**
- gray-500 on gray-950: 4.8:1 ✅ (meets AA for UI components)

**Buttons:**
- Bitcoin orange on gray-950: 12:1 ✅
- Gray-300 on gray-900: 7.5:1 ✅

---

## Implementation Notes

### Phase 1: Wallet Setup (Priority 1)

**Files to Modify:**
- `src/tab/components/WalletSetup.tsx`

**Changes:**
1. Remove "Key" tab (`'import-key'` state)
2. Rename "Seed" → "Import Wallet"
3. Rename "Backup" → "Restore from Backup"
4. Add `<ImportKeyInfoBox />` component to "Import Wallet" tab
5. Remove `<ImportPrivateKey />` component import and rendering

**Estimated Effort:** 2-3 hours

---

### Phase 2: Sidebar Account Grouping (Priority 2)

**Files to Modify:**
- `src/tab/components/Sidebar.tsx`

**New Components:**
- `AccountSectionHeader.tsx`
- `AccountTypeBadge.tsx`

**Changes:**
1. Group accounts by type (`hdAccounts`, `importedAccounts`, `multisigAccounts`)
2. Render three collapsible sections with headers
3. Add badges to account items
4. Implement collapse/expand state management
5. Add localStorage persistence for collapse state

**Estimated Effort:** 4-5 hours

---

### Phase 3: Settings Account Grouping (Priority 3)

**Files to Modify:**
- `src/tab/components/SettingsScreen.tsx`

**New Components:**
- `AccountSectionHeaderSettings.tsx` (or reuse with variant)
- `AccountCardSettings.tsx` (refactor existing account card)

**Changes:**
1. Group accounts by type (same logic as Sidebar)
2. Render section headers with descriptions
3. Add badges to account cards
4. Implement conditional export button logic
5. Add empty states for each section

**Estimated Effort:** 5-6 hours

---

### Phase 4: Export Button Logic (Priority 4)

**Files to Modify:**
- `src/tab/components/SettingsScreen.tsx`
- `src/tab/components/Sidebar.tsx` (if export buttons are added there)

**Changes:**
1. Add conditional rendering for Export Xpub button
2. Add conditional rendering for Export Key button
3. Add tooltips to export buttons
4. Update button titles/aria-labels

**Estimated Effort:** 2 hours

---

### Total Estimated Effort

**Implementation**: 13-16 hours
**Testing**: 4-5 hours
**Documentation**: 2 hours
**Total**: **19-23 hours** (approx. 3 days)

---

### Testing Checklist

**Wallet Setup:**
- [ ] "Create Wallet" tab works (generates HD wallet)
- [ ] "Import Wallet" tab works (imports from seed)
- [ ] "Restore from Backup" tab works (restores .dat file)
- [ ] "Key" tab is removed
- [ ] Info box appears in "Import Wallet" tab
- [ ] Info box text is readable and helpful

**Sidebar:**
- [ ] HD accounts grouped under "HD-DERIVED ACCOUNTS"
- [ ] Imported accounts grouped under "IMPORTED ACCOUNTS"
- [ ] Multisig accounts grouped under "MULTISIG ACCOUNTS"
- [ ] Section headers show correct count
- [ ] Sections collapse/expand on click
- [ ] Collapse state persists on dropdown close/reopen
- [ ] Chevron icon rotates correctly
- [ ] Badges show correct type (HD, Imported, Multisig)
- [ ] Empty sections are hidden (not shown)
- [ ] Active account highlighted correctly
- [ ] Account switching works within sections

**Settings:**
- [ ] HD accounts section renders with header
- [ ] Imported accounts section renders with header
- [ ] Multisig accounts section renders with header
- [ ] Section descriptions are clear and helpful
- [ ] Export Xpub shows for HD single-sig accounts
- [ ] Export Xpub shows for multisig accounts
- [ ] Export Xpub hidden for imported accounts
- [ ] Export Key shows for all single-sig accounts
- [ ] Export Key hidden for multisig accounts
- [ ] Rename button works for all account types
- [ ] Delete button works (with confirmation)
- [ ] Empty states show when appropriate
- [ ] "+ Create" / "+ Import" buttons in section headers work

**Edge Cases:**
- [ ] Only HD accounts: Imported/Multisig sections hidden
- [ ] Only imported accounts: HD section shows empty state
- [ ] Only multisig accounts: Other sections hidden
- [ ] Mixed accounts: All sections visible
- [ ] Zero accounts (shouldn't happen, but test): Appropriate messaging

**Accessibility:**
- [ ] Keyboard navigation works (Tab, Enter, Space, Arrows)
- [ ] Screen reader announces section state changes
- [ ] ARIA labels correct on all interactive elements
- [ ] Focus management correct (modals, dropdowns)
- [ ] Color contrast meets WCAG AA
- [ ] Tooltips accessible on keyboard focus

**Visual:**
- [ ] Badges use correct colors (blue, amber, purple)
- [ ] Section headers styled consistently
- [ ] Dividers between sections visible
- [ ] Hover states work on all buttons
- [ ] Active states clear
- [ ] Dark theme colors consistent

---

## Appendix: Color Reference

### Badge Colors

**HD Badge:**
```css
bg-blue-500/15     /* rgba(59, 130, 246, 0.15) */
border-blue-500/30 /* rgba(59, 130, 246, 0.30) */
text-blue-300      /* #93BBFD */
```

**Imported Badge:**
```css
bg-amber-500/12    /* rgba(245, 158, 11, 0.12) */
border-amber-500/30 /* rgba(245, 158, 11, 0.30) */
text-amber-300     /* #FCD34D */
```

**Multisig Badge:**
```css
bg-purple-500/15   /* rgba(168, 85, 247, 0.15) */
border-purple-500/30 /* rgba(168, 85, 247, 0.30) */
text-purple-300    /* #D8B4FE */
```

---

### Section Header Colors

```css
text-gray-500      /* #808080 */
text-gray-400      /* #B4B4B4 (hover) */
text-gray-600      /* #666666 (count badge) */
```

---

### Background Colors

```css
bg-gray-950        /* #0F0F0F (body) */
bg-gray-900        /* #1A1A1A (sidebar) */
bg-gray-850        /* #1E1E1E (cards) */
bg-gray-800        /* #242424 (secondary bg) */
bg-gray-750        /* #2E2E2E (borders, dividers) */
bg-gray-700        /* #3A3A3A (elevated) */
```

---

## Document Control

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | UI/UX Designer | Initial specification |

**Reviewers:**
- [ ] Product Manager (requirements validation)
- [ ] Frontend Developer (feasibility check)
- [ ] Backend Developer (data structure compatibility)
- [ ] Security Expert (private key handling review)

**Approval:**
- [ ] Approved for implementation

---

**End of Specification**
