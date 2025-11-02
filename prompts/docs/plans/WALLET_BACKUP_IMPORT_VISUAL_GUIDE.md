# Wallet Backup Import/Restore - Visual Reference Guide

**Feature:** Wallet Backup Import and Restore System
**Version:** 1.0
**Date:** October 26, 2025
**Designer:** UI/UX Designer
**Status:** Visual Reference Complete

---

## Quick Reference

This document provides **visual quick reference** for the wallet backup import/restore UI. For complete specifications, see `WALLET_BACKUP_IMPORT_UX_SPEC.md`.

---

## Table of Contents

1. [Modal Overview](#modal-overview)
2. [Color Chart](#color-chart)
3. [Button Styles](#button-styles)
4. [Icon Reference](#icon-reference)
5. [File Selector States](#file-selector-states)
6. [Error Message Styles](#error-message-styles)
7. [Progress Steps](#progress-steps)
8. [Success Summary Formats](#success-summary-formats)
9. [Component Spacing](#component-spacing)
10. [Animation Timings](#animation-timings)

---

## 1. Modal Overview

### 1.1 Scenario A: Fresh Install (5 Modals)

```
┌──────────────────────────────────────┐
│ Flow: Fresh Install                   │
├──────────────────────────────────────┤
│                                       │
│ 1. File Selection                     │
│    ↓                                  │
│ 2. Backup Password                    │
│    ↓                                  │
│ 3. Import Progress                    │
│    ↓                                  │
│ 4. Set Wallet Password                │
│    ↓                                  │
│ 5. Import Success                     │
│                                       │
└──────────────────────────────────────┘
```

**Entry Point:** Wallet Setup → "Import from Backup" tab

### 1.2 Scenario B: Replace Existing (7 Modals)

```
┌──────────────────────────────────────┐
│ Flow: Replace Existing Wallet         │
├──────────────────────────────────────┤
│                                       │
│ 1. Replace Warning                    │
│    ↓                                  │
│ 2. Confirm Current Password           │
│    ↓                                  │
│ 3. File Selection                     │
│    ↓                                  │
│ 4. Backup Password                    │
│    ↓                                  │
│ 5. Import Progress                    │
│    ↓                                  │
│ 6. [Network Mismatch Warning]         │  ← Optional
│    ↓                                  │
│ 7. Import Success (Replace Variant)   │
│                                       │
└──────────────────────────────────────┘
```

**Entry Point:** Settings → Advanced → "Import Backup & Replace Wallet" button

---

## 2. Color Chart

### 2.1 Warning Colors (Replace Wallet)

```
┌───────────────────────────────────────────────────┐
│ Destructive Action Colors                         │
├───────────────────────────────────────────────────┤
│                                                    │
│ ███ bg-red-500              #EF4444               │
│ ███ hover:bg-red-600        #DC2626               │
│ ███ bg-red-500/15           rgba(239,68,68,0.15)  │
│ ███ border-red-500/30       rgba(239,68,68,0.3)   │
│ ███ text-red-300            #FCA5A5               │
│ ███ text-red-400            #F87171               │
│                                                    │
└───────────────────────────────────────────────────┘
```

### 2.2 Network Mismatch Colors

```
┌───────────────────────────────────────────────────┐
│ Network Warning Colors                            │
├───────────────────────────────────────────────────┤
│                                                    │
│ ███ bg-amber-500            #F59E0B               │
│ ███ hover:bg-amber-600      #D97706               │
│ ███ bg-amber-500/10         rgba(245,158,11,0.1)  │
│ ███ border-amber-500/30     rgba(245,158,11,0.3)  │
│ ███ text-amber-300          #FCD34D               │
│ ███ text-amber-200          #FDE68A               │
│                                                    │
└───────────────────────────────────────────────────┘
```

### 2.3 File Selector Colors

```
┌───────────────────────────────────────────────────┐
│ Drag & Drop Zone Colors                          │
├───────────────────────────────────────────────────┤
│                                                    │
│ Default:                                          │
│ ███ border-gray-700         #374151               │
│ ███ bg-gray-850             #1a1d24               │
│                                                    │
│ Hover:                                            │
│ ███ border-bitcoin          #F7931A               │
│ ███ bg-bitcoin-subtle       rgba(247,147,26,0.05) │
│                                                    │
│ Active (dragging):                                │
│ ███ border-bitcoin          #F7931A               │
│ ███ bg-bitcoin-subtle       rgba(247,147,26,0.1)  │
│ Scale: 1.02                                       │
│                                                    │
└───────────────────────────────────────────────────┘
```

### 2.4 Success Colors

```
┌───────────────────────────────────────────────────┐
│ Import Success Colors                             │
├───────────────────────────────────────────────────┤
│                                                    │
│ ███ bg-green-500/20         rgba(34,197,94,0.2)   │
│ ███ border-green-500        #22C55E               │
│ ███ text-green-400          #4ADE80               │
│                                                    │
└───────────────────────────────────────────────────┘
```

---

## 3. Button Styles

### 3.1 Primary Button (Bitcoin Orange)

```
┌────────────────────────────────────┐
│  Decrypt & Import  →               │  ← Default
└────────────────────────────────────┘
bg-bitcoin text-white py-3 px-6 rounded-lg font-semibold

┌────────────────────────────────────┐
│  Decrypt & Import  →               │  ← Hover
└────────────────────────────────────┘
hover:bg-bitcoin-hover

┌────────────────────────────────────┐
│  Decrypt & Import  →               │  ← Disabled
└────────────────────────────────────┘
disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed
```

### 3.2 Destructive Button (Red)

```
┌────────────────────────────────────┐
│  I Understand, Replace Wallet  →   │  ← Default
└────────────────────────────────────┘
bg-red-500 text-white py-3 px-6 rounded-lg font-semibold

┌────────────────────────────────────┐
│  I Understand, Replace Wallet  →   │  ← Hover
└────────────────────────────────────┘
hover:bg-red-600

┌────────────────────────────────────┐
│  I Understand, Replace Wallet  →   │  ← Active
└────────────────────────────────────┘
active:bg-red-700 active:scale-[0.98]
```

### 3.3 Warning Button (Amber)

```
┌────────────────────────────────────┐
│  Change to Mainnet & Import        │  ← Default
└────────────────────────────────────┘
bg-amber-500 text-white py-3 px-6 rounded-lg font-semibold

┌────────────────────────────────────┐
│  Change to Mainnet & Import        │  ← Hover
└────────────────────────────────────┘
hover:bg-amber-600
```

### 3.4 Secondary Button (Gray)

```
┌────────────────────────────────────┐
│            Cancel                  │  ← Default
└────────────────────────────────────┘
bg-gray-800 text-gray-300 py-3 px-6 rounded-lg font-semibold

┌────────────────────────────────────┐
│            Cancel                  │  ← Hover
└────────────────────────────────────┘
hover:bg-gray-750
```

### 3.5 Special Export Button

```
┌──────────────────────────────────────────────────┐
│  💾 Export Current Wallet First                  │
└──────────────────────────────────────────────────┘
w-full bg-blue-500/10 border border-blue-500/30
text-blue-300 hover:bg-blue-500/20
py-3 px-6 rounded-lg font-semibold
```

---

## 4. Icon Reference

### 4.1 Import-Specific Icons

```
📁  Folder           - File selection modal header, drag-drop zone
📥  Download arrow   - Import button icon
🔄  Circular arrows  - Replace/restore action
📊  Chart bars       - Restored data summary
🌐  Globe            - Network indicator
📄  Document         - File selected state
```

### 4.2 Shared Icons (from export flow)

```
⚠️  Warning triangle - Warnings (amber or red)
🔐  Lock             - Password entry, encryption
🔑  Key              - Backup password
✅  Checkmark        - Success state
❌  X mark           - Errors
👁  Eye              - Password visibility toggle
💡  Light bulb       - Hints and tips
🛡️  Shield           - Security reminders
📅  Calendar         - Dates
```

---

## 5. File Selector States

### 5.1 Empty State (Default)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│                      📁                          │
│                                                  │
│       Drag & drop your .dat file here            │
│                      or                          │
│                [Browse Files]                    │
│                                                  │
│            Supported: .dat files only            │
│                  Max size: 10 MB                 │
│                                                  │
└─────────────────────────────────────────────────┘

border-2 border-dashed border-gray-700
bg-transparent
min-h-[240px]
text-center
```

### 5.2 Hover State

```
┌─────────────────────────────────────────────────┐
│                                                  │
│                      📁                          │
│                                                  │
│       Drag & drop your .dat file here            │
│                      or                          │
│                [Browse Files]                    │
│                                                  │
│            Supported: .dat files only            │
│                  Max size: 10 MB                 │
│                                                  │
└─────────────────────────────────────────────────┘

border-2 border-dashed border-bitcoin
bg-bitcoin-subtle
cursor-pointer
```

### 5.3 Active State (Dragging File Over)

```
┌─────────────────────────────────────────────────┐
│                                                  │
│                      📁                          │
│                                                  │
│              Drop file to import                 │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘

border-2 border-dashed border-bitcoin
bg-bitcoin-subtle
scale-[1.02]
transition-transform duration-200
```

### 5.4 File Selected State

```
┌─────────────────────────────────────────────────┐
│  📄  bitcoin-wallet-backup-2025-10-20.dat       │
│      24.3 KB • Selected Oct 26, 2025            │
│                                      [Remove] × │
└─────────────────────────────────────────────────┘

bg-gray-900 border border-gray-700 rounded-lg p-4
flex items-center justify-between
```

### 5.5 Error State (Wrong File Type)

```
┌─────────────────────────────────────────────────┐
│  ❌ Invalid File Type                           │
│                                                  │
│  This file is not a valid wallet backup.        │
│  Please select a .dat backup file.              │
│                                                  │
│  File selected: document.pdf                    │
│                                                  │
│               [Try Different File]              │
└─────────────────────────────────────────────────┘

bg-red-500/15 border border-red-500/30 rounded-lg p-4
text-red-300
```

---

## 6. Error Message Styles

### 6.1 Wrong Password Error

```
┌─────────────────────────────────────────────────┐
│  ❌ Incorrect backup password. Please try again.│
│     Make sure you're using the password you     │
│     created when exporting this backup.         │
└─────────────────────────────────────────────────┘

bg-red-500/15 border border-red-500/30 rounded-lg p-3
text-sm text-red-300
```

### 6.2 Corrupted File Error

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
└─────────────────────────────────────────────────┘

bg-red-500/15 border border-red-500/30 rounded-lg p-4
text-sm text-red-300
```

### 6.3 Network Mismatch Warning

```
┌─────────────────────────────────────────────────┐
│  ⚠️  Network Mismatch                           │
│                                                  │
│  This backup is for MAINNET but your wallet is  │
│  set to TESTNET. Importing will change your     │
│  network setting to MAINNET.                    │
└─────────────────────────────────────────────────┘

bg-amber-500/10 border border-amber-500/30 rounded-lg p-3
text-xs text-amber-200
```

### 6.4 Version Incompatibility Error

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
└─────────────────────────────────────────────────┘

bg-amber-500/10 border border-amber-500/30 rounded-lg p-4
text-sm text-amber-300
```

---

## 7. Progress Steps

### 7.1 Import Progress Timeline

```
┌────────────────────────────────────────────────────┐
│  0%    ▌                                    10%    │
│        Validating backup file...                   │
│                                                     │
│  10%   ██▌                                  25%    │
│        Decrypting backup...                        │
│                                                     │
│  25%   ██████▌                              40%    │
│        Validating wallet data...                   │
│                                                     │
│  40%   ██████████▌                          50%    │
│        Migrating backup format...                  │
│                                                     │
│  50%   ████████████▌                        75%    │
│        Restoring accounts...                       │
│                                                     │
│  75%   ███████████████████▌                 90%    │
│        Restoring contacts...                       │
│                                                     │
│  90%   ██████████████████████▌             100%    │
│        Finalizing import...                        │
│                                                     │
└────────────────────────────────────────────────────┘

Progress bar: bg-bitcoin h-full transition-all duration-500
Container: bg-gray-800 rounded-full h-3 overflow-hidden
```

### 7.2 Progress Bar Component

```
┌─────────────────────────────────────────────────┐
│ ████████████████░░░░░░░░░░░░  75%              │
└─────────────────────────────────────────────────┘

Container: w-full bg-gray-800 rounded-full h-3 mb-3
Fill: bg-bitcoin h-full rounded-full transition-all duration-500
Percentage: text-sm text-gray-400 text-right font-mono
```

---

## 8. Success Summary Formats

### 8.1 Restored Data Summary (Standard)

```
┌──────────────────────────────────────┐
│  📊 Restored Data                    │
│                                       │
│  • 5 Single-Sig Accounts              │
│  • 2 Multisig Accounts (breakdown)    │
│  • 12 Contacts                        │
│  • All Settings                       │
│                                       │
│  🌐 Network: Testnet                 │
│  📅 Backup Created: Oct 20, 2025     │
└──────────────────────────────────────┘

bg-gray-900 border border-gray-700 rounded-lg p-4
text-sm text-white
```

### 8.2 Multisig Breakdown Formats

**Multiple Multisig Types:**
```
• 3 Multisig Accounts (1× 2-of-2, 1× 2-of-3, 1× 3-of-5)
```

**Single Type:**
```
• 2 Multisig Accounts (2-of-3)
```

**No Multisig:**
```
[Line not shown if no multisig accounts]
```

### 8.3 Network Display

```
🌐 Network: Testnet     ← Testnet
🌐 Network: Mainnet     ← Mainnet (shown in bitcoin orange color)
```

### 8.4 Backup Date Format

```
📅 Backup Created: October 20, 2025 at 2:30 PM

Format: {Month DD, YYYY at HH:MM AM/PM}
```

---

## 9. Component Spacing

### 9.1 Modal Structure

```
┌────────────────────────────────────────────────────────┐
│  [Icon] Title                        ← mb-4            │
├────────────────────────────────────────────────────────┤
│                                      ← p-6 padding      │
│  Instructions paragraph              ← mb-6            │
│                                                         │
│  ┌─────────────────────────────┐   ← mb-4 or mb-6    │
│  │  Main Content Area          │                       │
│  └─────────────────────────────┘                       │
│                                                         │
│  [Optional info box]              ← mb-4               │
│                                                         │
│  [Error message if any]           ← mb-4               │
│                                                         │
│  ┌─────────┐  ┌──────────────┐   ← mt-6 (button row) │
│  │ Button  │  │   Button     │                         │
│  └─────────┘  └──────────────┘                         │
│                                      ← p-6 padding      │
└────────────────────────────────────────────────────────┘

Modal width: max-w-lg (512px)
Modal padding: p-6 (24px)
Border radius: rounded-2xl (16px)
```

### 9.2 Section Spacing

```
Section spacing:          mb-6 (24px)
Related elements:         mb-4 (16px)
Tight groups:             mb-2 (8px)
Button container:         mt-6 (24px from content)
Button gaps:              space-x-3 (12px between buttons)
```

### 9.3 Input Field Spacing

```
Label to input:           mb-2 (8px)
Input padding:            px-4 py-3 (16px horizontal, 12px vertical)
Input height:             48px total
Error message:            mt-1 (4px below input)
```

---

## 10. Animation Timings

### 10.1 Modal Open Animation

```
Backdrop:
  opacity: 0 → 1
  duration: 200ms
  easing: ease-out

Modal content:
  scale: 0.95 → 1.0
  opacity: 0 → 1
  duration: 200ms
  easing: ease-out
```

### 10.2 Success Modal Animation Sequence

```
Timeline:
  0ms     Modal appears (fade + scale)
  100ms   Success icon starts (scale in)
  200ms   Restored data card starts (fade + slide up)
  300ms   Next steps text starts (fade in)
  400ms   Action button starts (fade in)
  600ms   All animations complete
```

### 10.3 File Selector Interactions

```
Hover state:
  border-color: gray-700 → bitcoin
  duration: 200ms
  easing: ease-in-out

Drag over (active):
  scale: 1.0 → 1.02
  duration: 200ms
  easing: ease-out

Drop:
  scale: 1.02 → 1.0
  duration: 150ms
  easing: ease-in
```

### 10.4 Progress Bar Animation

```
Progress fill:
  width: dynamic (0% → 100%)
  duration: 500ms
  easing: ease-out

Step text transition:
  Fade out: 200ms
  Fade in: 200ms
  Total: 400ms per step change
```

### 10.5 Button Interactions

```
Hover:
  background-color change
  duration: 200ms
  easing: ease-in-out

Active (click):
  scale: 1.0 → 0.98
  duration: 100ms
  easing: ease-out

Release:
  scale: 0.98 → 1.0
  duration: 100ms
  easing: ease-in
```

---

## 11. Responsive Breakpoints

### 11.1 Desktop (1024px+)

```
Modal:        max-w-lg (512px)
Padding:      p-6 (24px)
Buttons:      Horizontal layout
File selector: min-h-[240px]
Font sizes:   Base (text-sm, text-base)
```

### 11.2 Tablet (768-1023px)

```
Modal:        max-w-lg (512px)
Padding:      p-6 (24px)
Buttons:      Horizontal layout
File selector: min-h-[240px]
Font sizes:   Base (text-sm, text-base)
```

### 11.3 Mobile (<768px)

```
Modal:        max-w-full mx-4
Padding:      p-4 (16px)
Buttons:      Stack vertically if 3+ buttons
File selector: min-h-[180px]
Font sizes:   Reduced (text-xs, text-sm)
```

---

## 12. Integration Points

### 12.1 Wallet Setup Tab

```
┌──────────────────────────────────────────────────────┐
│  Tab Navigation:                                      │
│  [Create New] [Import Seed] [Import Private Key]     │
│  [Import from Backup] ← NEW TAB                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  Tab content shows file selector inline              │
│  (not a modal for first view)                        │
│                                                       │
└──────────────────────────────────────────────────────┘

Tab button style:
  Active: text-bitcoin border-b-2 border-bitcoin
  Inactive: text-gray-400 hover:text-gray-300
```

### 12.2 Settings Advanced Section

```
┌─────────────────────────────────────────────────────┐
│ Advanced                          ← NEW SECTION      │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │  📥 Import Backup & Replace Wallet           │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │  🗑️ Delete Wallet                            │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘

Button style:
  bg-gray-800 hover:bg-gray-750
  text-gray-300 py-3 px-6
  w-full rounded-lg font-semibold
```

---

## 13. Quick Copy-Paste Snippets

### 13.1 File Selector Component

```tsx
<div
  className="border-2 border-dashed border-gray-700 rounded-xl p-8
             hover:border-bitcoin hover:bg-bitcoin-subtle
             transition-all duration-200 cursor-pointer min-h-[240px]
             flex flex-col items-center justify-center text-center"
  onDragOver={handleDragOver}
  onDrop={handleDrop}
  onClick={handleBrowse}
>
  <div className="text-6xl mb-4 text-gray-600">📁</div>
  <p className="text-base text-gray-400 mb-2">
    Drag & drop your .dat file here
  </p>
  <p className="text-sm text-gray-500 mb-3">or</p>
  <button className="bg-gray-800 hover:bg-gray-750 text-white px-6 py-2 rounded-lg font-semibold">
    Browse Files
  </button>
  <p className="text-xs text-gray-500 mt-4">
    Supported: .dat files only • Max size: 10 MB
  </p>
</div>
```

### 13.2 Restored Data Card

```tsx
<div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
  <p className="text-sm font-semibold text-white mb-3">📊 Restored Data</p>

  <div className="space-y-2 text-sm text-white">
    <p>• {singleSigCount} Single-Sig Accounts</p>
    {multisigCount > 0 && (
      <p>• {multisigCount} Multisig Accounts ({multisigBreakdown})</p>
    )}
    <p>• {contactCount} Contacts</p>
    <p>• All Settings</p>
  </div>

  <div className="border-t border-gray-700 mt-3 pt-3 space-y-1 text-sm">
    <p className="text-gray-400">
      🌐 Network: <span className="text-bitcoin">{network}</span>
    </p>
    <p className="text-gray-400">
      📅 Backup Created: {formatDate(backupDate)}
    </p>
  </div>
</div>
```

### 13.3 Error Message

```tsx
<div className="bg-red-500/15 border border-red-500/30 rounded-lg p-3 mb-4">
  <p className="text-sm text-red-300">
    ❌ {errorMessage}
  </p>
</div>
```

### 13.4 Warning Box (Replace Wallet)

```tsx
<div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4 mb-6">
  <p className="text-xs font-bold text-red-300 mb-3">⚠️ CRITICAL WARNING</p>
  <div className="space-y-2 text-xs text-red-200">
    <p>• All current accounts will be <strong>DELETED</strong></p>
    <p>• All contacts will be <strong>DELETED</strong></p>
    <p>• This action <strong>CANNOT</strong> be undone</p>
    <p>• Make sure you have backups of current wallet</p>
  </div>
</div>
```

### 13.5 Progress Modal

```tsx
<div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50">
  <div className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-lg mx-4">
    <h2 className="text-xl font-bold text-white mb-4 flex items-center">
      <span className="mr-3">🔐</span>
      Importing Wallet Backup...
    </h2>

    {/* Spinner */}
    <div className="flex justify-center mb-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-bitcoin"></div>
    </div>

    {/* Status text */}
    <p className="text-base text-gray-300 text-center mb-2">
      Restoring your wallet from backup...
    </p>
    <p className="text-sm text-gray-500 text-center mb-6">
      This may take 10-30 seconds
    </p>

    {/* Progress bar */}
    <div className="bg-gray-800 rounded-full h-3 overflow-hidden mb-3">
      <div
        className="bg-bitcoin h-full transition-all duration-500"
        style={{ width: `${progress}%` }}
      />
    </div>
    <p className="text-sm text-gray-400 text-right font-mono">{progress}%</p>

    {/* Current step */}
    <p className="text-sm text-gray-400 text-center italic mb-6">
      {currentStep}
    </p>

    {/* Warning */}
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
      <p className="text-sm text-amber-300 text-center flex items-center justify-center">
        <span className="mr-2">⚠️</span>
        Do not close this window
      </p>
    </div>
  </div>
</div>
```

---

## 14. Common Patterns

### 14.1 Modal Header Pattern

```tsx
<div className="flex items-center mb-4">
  <span className="text-2xl mr-3">{icon}</span>
  <h2 className="text-xl font-bold text-white">{title}</h2>
</div>
```

### 14.2 Two-Button Layout

```tsx
<div className="flex space-x-3 mt-6">
  <button className="flex-1 bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold">
    Cancel
  </button>
  <button className="flex-1 bg-bitcoin hover:bg-bitcoin-hover text-white py-3 px-6 rounded-lg font-semibold">
    Continue →
  </button>
</div>
```

### 14.3 Three-Button Layout

```tsx
<div className="flex space-x-2 mt-6">
  <button className="bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-4 rounded-lg font-semibold">
    Back
  </button>
  <button className="bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-4 rounded-lg font-semibold">
    Cancel
  </button>
  <button className="flex-1 bg-bitcoin hover:bg-bitcoin-hover text-white py-3 px-6 rounded-lg font-semibold">
    Decrypt & Import →
  </button>
</div>
```

---

**End of Visual Reference Guide**

Use this guide for quick reference during implementation. For complete specifications, behavior, and rationale, see `WALLET_BACKUP_IMPORT_UX_SPEC.md`.
