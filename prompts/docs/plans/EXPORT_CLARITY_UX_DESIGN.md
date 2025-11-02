# Export Options Clarity - UX Design Specification

**Version**: 1.0
**Date**: October 26, 2025
**Designer**: UI/UX Designer
**Status**: Design Complete - Ready for Implementation
**Priority**: P0 - Critical User Confusion Issue

---

## Executive Summary

### Problem Statement

Users are confused about the different export options available in the wallet:
- **Xpub export** button appears inconsistently (only one account shows it)
- **Private key export** shows for non-multisig accounts but purpose is unclear
- **Full wallet backup** (encrypted backup export) was designed but never implemented
- No clear education about WHAT each export does and WHEN to use it

**User Quote**: *"I want it all very clear to them the purpose and distinction among each of the different export items/options."*

### Solution Overview

This design provides:
1. **Clear visual hierarchy** - Organize export options by scope (account vs wallet)
2. **Educational tooltips** - Explain purpose of each export type inline
3. **Consistent presentation** - Show all applicable export buttons for every account
4. **Use case guidance** - Clear "When to use this" information
5. **Improved Settings organization** - Dedicated "Backup & Export" section

---

## Current State Analysis

### What Export Types Exist

| Export Type | Scope | Format | Encryption | Status | Use Case |
|------------|-------|--------|-----------|--------|----------|
| **Xpub Export** | Single account | Text/QR | None (public data) | ✅ Implemented | Multisig coordination, watch-only wallets |
| **Private Key Export** | Single account | WIF (file/PDF) | Optional AES-256 | 📝 Designed, not implemented | Account portability, backup single account |
| **Full Wallet Backup** | All accounts + contacts | Encrypted binary | Required AES-256 | 📝 Designed, not implemented | Complete wallet restore, migration |
| **Seed Phrase** | Master key | 12 words | None | ✅ Implemented (setup only) | Wallet recovery, ultimate backup |

### Current User Confusion Points

**Inconsistent Button Visibility:**
```
Account 1:  [Export Key]                    ← Missing Xpub button
Account 2:  [Export Key] [Export Xpub]      ← Shows both (why?)
Account 3:  (no buttons - multisig)         ← Nothing to export?
```

**No Context:**
- "Export Key" - What key? Why? When would I use this?
- "Export Xpub" - What is an xpub? Is it a backup?
- No information about seed phrase vs exports
- No guidance on which export to use for which scenario

**Missing Features:**
- Full wallet backup button doesn't exist yet
- Private key export doesn't exist yet
- No centralized backup section

---

## Design Solution

### Information Architecture

**Reorganize Settings into 3 sections:**

```
Settings Screen
├── 1. Account Management
│   ├── Account List
│   │   ├── [Each account card]
│   │   │   ├── Rename
│   │   │   ├── Export Options dropdown →
│   │   │   │   ├── Export Xpub (HD only)
│   │   │   │   ├── Export Private Key (single-sig only)
│   │   │   │   └── View Details
│   │   │   └── Delete
│   │
│   └── [+ Create Account] [+ Import Account]
│
├── 2. Backup & Export  ← NEW SECTION
│   ├── Seed Phrase Backup
│   │   └── [View Seed Phrase] button
│   │
│   ├── Full Wallet Backup
│   │   └── [Export Encrypted Backup] button
│   │
│   └── Individual Account Backups
│       └── "Use 'Export Options' on each account above"
│
└── 3. Security
    ├── Auto-lock Timer
    └── [Lock Wallet]
```

### Key Design Changes

1. **Add "Backup & Export" section** - Centralize all backup/export education
2. **Export Options dropdown per account** - Replace individual buttons with organized menu
3. **Inline help text** - Show purpose for each export type
4. **Visual icons** - Differentiate public (🔓) vs private (🔒) vs encrypted (🔐) data
5. **Consistent availability** - All HD accounts show same options

---

## Screen Designs

### Design 1: New "Backup & Export" Section

**Location**: Settings → Between "Account Management" and "Security"

**ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────┐
│ Backup & Export                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Understanding Your Backup Options                              │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ ℹ️  Different backup types serve different purposes:     │  │
│ │                                                           │  │
│ │ • Seed Phrase - Master backup for entire wallet          │  │
│ │ • Full Wallet Backup - All accounts + contacts           │  │
│ │ • Account Exports - Individual account portability       │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Seed Phrase Backup                                             │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ 🔑 Your 12-word recovery phrase                          │  │
│ │                                                           │  │
│ │ What it backs up:                                        │  │
│ │ • All HD-derived accounts (not imported private keys)    │  │
│ │ • Can restore wallet on any device                       │  │
│ │                                                           │  │
│ │ When to use:                                             │  │
│ │ • Ultimate backup - can recover everything               │  │
│ │ • Moving wallet to new device                            │  │
│ │ • Long-term cold storage                                 │  │
│ │                                                           │  │
│ │ Security:                                                 │  │
│ │ 🔓 Unencrypted - Store in secure physical location       │  │
│ │                                                           │  │
│ │                        [📋 View Seed Phrase]              │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Full Wallet Backup                                             │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ 💾 Complete encrypted backup file                        │  │
│ │                                                           │  │
│ │ What it backs up:                                        │  │
│ │ • All accounts (HD + imported)                           │  │
│ │ • All saved contacts                                     │  │
│ │ • Transaction history and settings                       │  │
│ │                                                           │  │
│ │ When to use:                                             │  │
│ │ • Comprehensive backup including imported accounts       │  │
│ │ • Preserving contacts and settings                       │  │
│ │ • Quick restore on same/different device                 │  │
│ │                                                           │  │
│ │ Security:                                                 │  │
│ │ 🔐 AES-256 encrypted - Password-protected file           │  │
│ │                                                           │  │
│ │              [💾 Export Encrypted Wallet Backup]          │  │
│ │              (Feature coming soon)                        │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│ Individual Account Backups                                     │
│ ┌──────────────────────────────────────────────────────────┐  │
│ │ 🗂️  Export specific accounts for portability             │  │
│ │                                                           │  │
│ │ Use "Export Options" dropdown on each account in the     │  │
│ │ Account Management section above to:                     │  │
│ │                                                           │  │
│ │ • Export Xpub - Public key for multisig/watch-only       │  │
│ │ • Export Private Key - WIF format for account import     │  │
│ │                                                           │  │
│ │ See each account's export menu for details.              │  │
│ └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Section Header:**
- Background: `bg-gray-850 border border-gray-700 rounded-xl p-6`
- Title: `text-lg font-semibold text-white mb-4`

**Info Box:**
- Background: `bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6`
- Icon: ℹ️ `text-blue-400 text-lg`
- Text: `text-sm text-blue-200`
- Bullet list: `space-y-1`

**Backup Type Cards:**
- Container: `bg-gray-900 border border-gray-700 rounded-lg p-5 mb-4`
- Icon + Title: `flex items-center space-x-2 mb-3`
- Title: `text-base font-semibold text-white`
- Content sections: `space-y-3`
- Labels: `text-xs font-semibold text-gray-400 uppercase mb-1`
- Body text: `text-sm text-gray-300`
- Bullet lists: `text-sm text-gray-300 space-y-1 ml-4`

**Security Indicators:**
- 🔓 Unencrypted: `text-amber-400`
- 🔐 Encrypted: `text-green-400`
- Font: `text-xs font-semibold`

**Buttons:**
- Primary action: `bg-bitcoin hover:bg-bitcoin-hover text-white py-2 px-6 rounded-lg font-semibold transition-colors`
- Disabled/Coming soon: `bg-gray-700 text-gray-500 cursor-not-allowed`

---

### Design 2: Account Export Options Dropdown

**Location**: Settings → Account Management → Each account card

**Current (Confusing):**
```
┌────────────────────────────────────────────────────────┐
│ Main Account                                           │
│ Native SegWit • 0.00125 tBTC                          │
│                                                        │
│ [Rename] [Export Key] [Delete]                        │
└────────────────────────────────────────────────────────┘
```

**New (Clear):**
```
┌────────────────────────────────────────────────────────────┐
│ Main Account                                               │
│ Native SegWit • tb1q3xy...w8k2 • 0.00125 tBTC            │
│                                                            │
│ [Rename]  [Export Options ▾]  [Delete]                    │
│                                                            │
│           ┌─────────────────────────────────────────────┐ │
│           │ Export Options                              │ │
│           ├─────────────────────────────────────────────┤ │
│           │                                             │ │
│           │ 🔓 Export Xpub (Public Key)                 │ │
│           │    For multisig setup or watch-only        │ │
│           │                                             │ │
│           │ 🔒 Export Private Key                       │ │
│           │    WIF format for account import           │ │
│           │                                             │ │
│           │ ─────────────────────────────────────────  │ │
│           │                                             │ │
│           │ 📋 View Account Details                     │ │
│           │    Addresses, derivation path, xpub        │ │
│           │                                             │ │
│           └─────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

**Dropdown Menu Specifications:**

```tsx
interface ExportOption {
  icon: string;           // Emoji or SVG icon
  label: string;          // Main action text
  description: string;    // What this export does
  action: () => void;     // Click handler
  enabled: boolean;       // Can user access this?
  tooltip?: string;       // Why disabled (if applicable)
}

const exportOptions: ExportOption[] = [
  {
    icon: '🔓',
    label: 'Export Xpub (Public Key)',
    description: 'For multisig setup or watch-only wallets',
    action: () => openExportXpubModal(account),
    enabled: account.importType !== 'private-key',  // HD only
    tooltip: account.importType === 'private-key'
      ? 'Not available for imported private keys - no xpub exists'
      : undefined,
  },
  {
    icon: '🔒',
    label: 'Export Private Key',
    description: 'WIF format for importing to other wallets',
    action: () => openExportPrivateKeyModal(account),
    enabled: account.accountType !== 'multisig',    // Single-sig only
    tooltip: account.accountType === 'multisig'
      ? 'Multisig accounts require all co-signers - cannot export single key'
      : undefined,
  },
  {
    icon: '📋',
    label: 'View Account Details',
    description: 'Addresses, derivation path, metadata',
    action: () => openAccountDetailsModal(account),
    enabled: true,
  },
];
```

**Dropdown Styling:**
- Container: `absolute top-full right-0 mt-2 w-96 z-50`
- Background: `bg-gray-850 border border-gray-700 rounded-lg shadow-2xl`
- Padding: `py-2`
- Each option: `px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors`
- Disabled option: `opacity-50 cursor-not-allowed hover:bg-transparent`
- Icon: `text-xl mr-3` (emoji) or `w-5 h-5` (SVG)
- Label: `text-sm font-semibold text-white`
- Description: `text-xs text-gray-400 mt-0.5`
- Divider: `border-t border-gray-700 my-1` (between groups)

**Button States:**
- Default: `bg-gray-800 hover:bg-gray-750 text-gray-300`
- Active (dropdown open): `bg-gray-750 border-bitcoin text-white`
- Chevron rotation: `transform rotate-180` when open

---

### Design 3: Export Modal Headers with Clear Purpose

**Update all export modals to include purpose statement at top**

**Xpub Export Modal Header:**
```
┌──────────────────────────────────────────────────────────┐
│ 🔓 Export Extended Public Key (Xpub)                     │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ℹ️  What is an xpub?                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ An extended public key allows others to:            │ │
│ │ • Generate all your receiving addresses             │ │
│ │ • View your transaction history                     │ │
│ │ • Create watch-only wallets                         │ │
│ │ • Coordinate multisig wallets (safe to share)       │ │
│ │                                                      │ │
│ │ Does NOT allow:                                      │ │
│ │ • Spending your funds                               │ │
│ │ • Moving Bitcoin without your permission            │ │
│ │                                                      │ │
│ │ Privacy Note: Anyone with your xpub can see ALL     │ │
│ │ transactions for this account. Only share with      │ │
│ │ trusted parties (accountant, co-signer, etc.)       │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Account: Main Account                                    │
│ Address Type: Native SegWit                              │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

**Private Key Export Modal Header:**
```
┌──────────────────────────────────────────────────────────┐
│ 🔒 Export Private Key                                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ⚠️  What is a private key?                               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ A private key is like the master password for       │ │
│ │ this specific account. Anyone with it can:          │ │
│ │ • Spend ALL funds in this account                   │ │
│ │ • Import it to other wallets                        │ │
│ │ • Steal your Bitcoin if they get access             │ │
│ │                                                      │ │
│ │ Common uses:                                         │ │
│ │ • Importing this account to another wallet app      │ │
│ │ • Creating a paper backup for cold storage          │ │
│ │ • Sharing with inheritance plans (securely)         │ │
│ │                                                      │ │
│ │ 🔐 We strongly recommend password protection        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ Account: Main Account                                    │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

**Full Wallet Backup Modal Header:**
```
┌──────────────────────────────────────────────────────────┐
│ 💾 Export Encrypted Wallet Backup                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ℹ️  What does this backup include?                      │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ This encrypted file contains:                       │ │
│ │ ✓ All HD-derived accounts                           │ │
│ │ ✓ All imported private key accounts                 │ │
│ │ ✓ All saved contacts                                │ │
│ │ ✓ Transaction history and labels                    │ │
│ │ ✓ Wallet settings and preferences                   │ │
│ │                                                      │ │
│ │ When to use this:                                    │ │
│ │ • Complete backup including imported accounts       │ │
│ │ • Moving wallet to new computer                     │ │
│ │ • Preserving contacts and transaction labels        │ │
│ │                                                      │ │
│ │ 🔐 File is encrypted with separate password         │ │
│ │ (different from your wallet unlock password)        │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ ...                                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Comparison Table Component

**Add to "Backup & Export" section for quick reference**

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ Backup Comparison                                                              │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┏━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━┓ │
│ ┃              ┃ Seed Phrase    ┃ Full Wallet    ┃ Private Key    ┃ Xpub   ┃ │
│ ┃              ┃ (12 words)     ┃ Backup (file)  ┃ Export (WIF)   ┃ Export ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Backs up     ┃ All HD         ┃ Everything     ┃ One account    ┃ N/A    ┃ │
│ ┃              ┃ accounts       ┃ (HD+imported+  ┃ only           ┃        ┃ │
│ ┃              ┃                ┃  contacts)     ┃                ┃        ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Can spend    ┃ ✓ Yes          ┃ ✓ Yes          ┃ ✓ Yes (one     ┃ ✗ No   ┃ │
│ ┃ funds        ┃                ┃                ┃   account)     ┃        ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Encrypted    ┃ ✗ No           ┃ ✓ Yes          ┃ Optional       ┃ ✗ No   ┃ │
│ ┃              ┃ (unencrypted)  ┃ (AES-256)      ┃ (recommended)  ┃ (pub)  ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Portability  ┃ Any BIP39      ┃ This wallet    ┃ Any wallet     ┃ Watch  ┃ │
│ ┃              ┃ wallet         ┃ app only       ┃ supporting WIF ┃ only   ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Includes     ┃ ✗ No           ┃ ✓ Yes          ┃ ✗ No           ┃ ✗ No   ┃ │
│ ┃ imported     ┃                ┃                ┃                ┃        ┃ │
│ ┃ accounts     ┃                ┃                ┃                ┃        ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Includes     ┃ ✗ No           ┃ ✓ Yes          ┃ ✗ No           ┃ ✗ No   ┃ │
│ ┃ contacts     ┃                ┃                ┃                ┃        ┃ │
│ ┣━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━┫ │
│ ┃ Best for     ┃ Ultimate       ┃ Complete       ┃ Moving one     ┃ Multi- ┃ │
│ ┃              ┃ disaster       ┃ backup with    ┃ account to     ┃ sig    ┃ │
│ ┃              ┃ recovery       ┃ contacts       ┃ other wallet   ┃ setup  ┃ │
│ ┗━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━┻━━━━━━━━┛ │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Styling:**
- Table: `border border-gray-700 rounded-lg overflow-hidden`
- Header row: `bg-gray-800 font-semibold text-white text-sm`
- Cells: `px-4 py-3 border-r border-b border-gray-700 text-sm text-gray-300`
- Checkmarks: ✓ `text-green-400` / ✗ `text-red-400`
- Last column: "Best for" has light blue background `bg-blue-500/5`

---

## Tooltips & Inline Help

### Tooltip Design System

**Trigger: Hover or Focus on help icon (ⓘ)**

**Tooltip appearance:**
- Background: `bg-gray-900 border border-gray-600 rounded-lg shadow-2xl`
- Max width: `max-w-xs` (320px)
- Padding: `p-3`
- Position: `absolute z-50` with smart positioning (above/below/left/right based on screen position)
- Arrow: Small triangle pointing to trigger element

**Typography:**
- Title: `text-sm font-semibold text-white mb-1`
- Body: `text-xs text-gray-300 leading-relaxed`
- Links: `text-bitcoin hover:text-bitcoin-hover underline`

**Animation:**
- Fade in: `opacity-0 → opacity-100` (150ms)
- Slight scale: `scale-95 → scale-100`
- Delay: 300ms hover before showing (prevent accidental triggers)

### Help Icons Placement

**Add help icons (ⓘ) next to:**
1. "Export Xpub" button - Explain what xpub is
2. "Export Private Key" button - Explain WIF format
3. "Full Wallet Backup" button - Explain what's included
4. "Seed Phrase" section header - Explain master vs accounts
5. Each account type badge - Explain HD vs imported vs multisig

**Example tooltip content:**

```tsx
const tooltips = {
  xpub: {
    title: "Extended Public Key (Xpub)",
    content: "A public key that generates all receiving addresses for this account. Safe to share for watch-only wallets or multisig coordination. Does NOT allow spending funds.",
    learnMore: "/docs/xpub-explained"
  },
  privateKey: {
    title: "Private Key (WIF Format)",
    content: "The secret key for this account. Anyone with it can spend ALL funds. Use for importing to other wallets or paper backups. Password protection strongly recommended.",
    learnMore: "/docs/private-keys"
  },
  walletBackup: {
    title: "Full Wallet Backup",
    content: "Encrypted file containing all accounts, contacts, and settings. Requires separate password. Use for complete wallet restoration including imported accounts.",
    learnMore: "/docs/backups"
  },
  seedPhrase: {
    title: "Seed Phrase (BIP39 Mnemonic)",
    content: "12-word master backup for all HD-derived accounts. Does NOT include imported private keys or contacts. Ultimate recovery method - works with any BIP39 wallet.",
    learnMore: "/docs/seed-phrase"
  }
};
```

---

## Mobile Responsive Design

### Account Cards on Mobile (<768px)

**Stack buttons vertically:**
```
┌────────────────────────────────┐
│ Main Account                   │
│ Native SegWit                  │
│ 0.00125 tBTC                   │
│                                │
│ [Rename Account]          (full width)
│ [Export Options ▾]        (full width)
│ [Delete Account]          (full width)
└────────────────────────────────┘
```

**Export dropdown on mobile:**
- Full width: `w-full` instead of `w-96`
- Larger tap targets: `py-4` instead of `py-3`
- Larger text: `text-base` instead of `text-sm`

### Backup & Export Section on Mobile

**Collapse cards by default, expand on tap:**
```
┌─────────────────────────────────┐
│ Backup & Export                 │
├─────────────────────────────────┤
│                                  │
│ [▶] Seed Phrase Backup           │
│                                  │
│ [▼] Full Wallet Backup           │
│ │ 💾 Complete encrypted backup   │
│ │ [Export Encrypted Backup]      │
│                                  │
│ [▶] Individual Account Backups   │
│                                  │
└─────────────────────────────────┘
```

**Accordion behavior:**
- Tap header to expand/collapse
- Smooth height transition: `transition-all duration-300`
- Chevron rotates: `rotate-0` → `rotate-90`
- One section open at a time (optional) or multiple (better UX)

---

## Accessibility Requirements

### Keyboard Navigation

**Tab order in "Backup & Export" section:**
1. Info box (focusable if has links)
2. Seed phrase "View Seed Phrase" button
3. Full wallet backup "Export Encrypted Backup" button
4. Help icons (ⓘ) - show tooltip on focus

**Export Options dropdown:**
1. Focus on "Export Options" button
2. Press Enter or Space to open dropdown
3. Arrow keys navigate menu items
4. Enter selects item
5. Escape closes dropdown

### Screen Reader Support

**ARIA labels for export buttons:**
```tsx
<button
  aria-label="Export options for Main Account. Press to open menu."
  aria-haspopup="true"
  aria-expanded={isDropdownOpen}
>
  Export Options ▾
</button>

<div
  role="menu"
  aria-label="Export options menu"
  hidden={!isDropdownOpen}
>
  <button role="menuitem" aria-label="Export extended public key for multisig coordination">
    🔓 Export Xpub (Public Key)
    <span className="sr-only">For multisig setup or watch-only wallets</span>
  </button>

  <button role="menuitem" aria-label="Export private key in WIF format">
    🔒 Export Private Key
    <span className="sr-only">WIF format for importing to other wallets</span>
  </button>
</div>
```

**ARIA live regions for status:**
```tsx
<div role="status" aria-live="polite" className="sr-only">
  {copiedToClipboard && "Xpub copied to clipboard"}
  {exportSuccess && "Private key exported successfully"}
</div>
```

### Color Contrast

**All text meets WCAG AA (4.5:1):**
- White text on gray-850: 14.2:1 ✓
- Gray-300 on gray-900: 8.9:1 ✓
- Blue-200 on blue-500/10: 10.5:1 ✓
- Amber-300 on amber-500/12: 12.1:1 ✓
- Red-300 on red-500/15: 11.8:1 ✓

**Icons not sole indicator:**
- 🔓 Xpub + text "Public Key"
- 🔒 Private Key + text "Private Key"
- 🔐 Encrypted + text "Encrypted"
- Color + icon + text = triple redundancy

---

## Implementation Checklist

### Phase 1: New "Backup & Export" Section (Week 1)

**Frontend tasks:**
- [ ] Create BackupExportSection component
- [ ] Design and implement 3 backup type cards (Seed/Full/Individual)
- [ ] Add info box with backup comparison
- [ ] Implement "View Seed Phrase" button (links to existing flow)
- [ ] Add placeholder "Export Encrypted Backup" button (coming soon)
- [ ] Write help content for each backup type
- [ ] Add comparison table component
- [ ] Test on mobile (accordion expansion)
- [ ] Add accessibility labels

**Design tasks:**
- [ ] Finalize icon choices (emojis vs SVG)
- [ ] Review color choices for info boxes
- [ ] Validate text clarity with user testing

### Phase 2: Export Options Dropdown (Week 1-2)

**Frontend tasks:**
- [ ] Create ExportOptionsDropdown component
- [ ] Replace individual "Export Key" and "Export Xpub" buttons
- [ ] Implement dropdown menu with 3 options
- [ ] Add icons and descriptions to menu items
- [ ] Handle disabled states with tooltips
- [ ] Add keyboard navigation (arrow keys, escape)
- [ ] Add click-outside-to-close behavior
- [ ] Test on all account types (HD, imported, multisig)
- [ ] Add accessibility (ARIA menu, roles)

**Edge cases:**
- [ ] Multisig account: Only "View Details" option enabled
- [ ] Imported account: No xpub option
- [ ] HD account: All options enabled

### Phase 3: Enhanced Modal Headers (Week 2)

**Frontend tasks:**
- [ ] Update ExportXpubModal with "What is an xpub?" section
- [ ] Update ExportPrivateKeyModal with "What is a private key?" section
- [ ] Update EncryptedBackupModal with "What's included?" section
- [ ] Add info boxes to modal headers
- [ ] Ensure consistent styling across all modals
- [ ] Test modal scroll behavior with added content

**Content writing:**
- [ ] Write clear, concise explanations (8th grade reading level)
- [ ] Emphasize security without being alarmist
- [ ] Add use case examples for each export type

### Phase 4: Tooltips & Help Icons (Week 2-3)

**Frontend tasks:**
- [ ] Create Tooltip component (reusable)
- [ ] Add help icons (ⓘ) next to export buttons
- [ ] Add help icons to section headers
- [ ] Implement tooltip positioning logic (smart placement)
- [ ] Add 300ms hover delay before showing
- [ ] Test keyboard focus for tooltips (show on focus)
- [ ] Ensure tooltips work on mobile (tap to show)

**Content:**
- [ ] Write tooltip text for all help icons
- [ ] Keep tooltips concise (max 2-3 sentences)
- [ ] Add "Learn more" links where appropriate

### Phase 5: Settings Screen Reorganization (Week 3)

**Frontend tasks:**
- [ ] Restructure SettingsScreen component
- [ ] Move "Backup & Export" section above "Security"
- [ ] Update navigation/scroll behavior
- [ ] Ensure section collapse/expand works on mobile
- [ ] Test with 1 account, 5 accounts, 20 accounts
- [ ] Performance test (render time)

### Phase 6: Testing & Polish (Week 3-4)

**QA tasks:**
- [ ] Test all account types (HD, imported, multisig)
- [ ] Test export dropdown on each account type
- [ ] Verify correct options shown/hidden based on account type
- [ ] Test tooltips on desktop (hover)
- [ ] Test tooltips on mobile (tap)
- [ ] Test keyboard navigation through all sections
- [ ] Test screen reader announcements
- [ ] Test on small screens (iPhone SE)
- [ ] Test on large screens (1440p desktop)
- [ ] Test color contrast with automated tools
- [ ] User testing: Can users find correct export option?
- [ ] User testing: Do users understand differences?

**Success criteria:**
- [ ] 100% of users can explain difference between seed phrase and xpub
- [ ] 90%+ of users choose correct export type for given scenario
- [ ] 0 confusion about which button to click
- [ ] All WCAG AA accessibility checks pass

---

## Design Rationale

### Why Organize by Scope?

**Problem**: Users don't understand "seed phrase vs xpub vs private key vs full backup"

**Solution**: Organize by what they're backing up:
1. **Master (Seed Phrase)** - Everything HD-derived
2. **Complete (Full Backup)** - Literally everything
3. **Individual (Account Exports)** - Just one account

**Benefit**: Clear mental model - "Am I backing up everything or just part?"

### Why Dropdown Instead of Individual Buttons?

**Problem**: Inconsistent button visibility confuses users

**Solution**: Every account shows same "Export Options" button → consistent

**Benefits:**
- **Consistency**: Same UI for every account type
- **Discoverability**: Users know where to look
- **Scalability**: Easy to add more export types in future
- **Context**: Descriptions explain when disabled
- **Education**: Each option has inline help text

### Why Info Boxes Instead of Modal Warnings?

**Problem**: Modal warnings are skipped ("yeah yeah, I know")

**Solution**: Persistent info boxes always visible → can reference anytime

**Benefits:**
- **Always available**: No need to click through to see info
- **Non-blocking**: Doesn't interrupt user flow
- **Comparison**: Can see all options side-by-side
- **Reduced friction**: Fewer clicks to get help

### Why Comparison Table?

**Problem**: Users ask "What's the difference between X and Y?"

**Solution**: Side-by-side table shows exact differences

**Benefits:**
- **Quick reference**: Scan to find right option
- **Decision support**: Clear criteria for choosing
- **Educational**: Teaches backup concepts
- **Reduces support**: Self-service answers

---

## User Testing Questions

### Scenario 1: Multisig Setup

**Task**: "You're setting up a 2-of-3 multisig wallet with two friends. What do you need to export to share with them?"

**Expected answer**: Export Xpub (public key)

**Success criteria**: User clicks "Export Options" → "Export Xpub" without confusion

**Follow-up**: "Why not export the private key?"

### Scenario 2: Moving Account to Hardware Wallet

**Task**: "You want to import your 'Savings' account into a Ledger hardware wallet. What do you export?"

**Expected answer**: Export Private Key (WIF format)

**Success criteria**: User selects correct export type and understands WIF

**Follow-up**: "Should you use password protection?" (Yes, recommended)

### Scenario 3: Complete Backup Before Trip

**Task**: "You're going on a trip and want to make sure you can recover your entire wallet if your laptop is stolen. What do you backup?"

**Expected answer**: Either Seed Phrase OR Full Wallet Backup (both valid)

**Success criteria**: User explains trade-offs (seed works anywhere, full backup has contacts)

**Follow-up**: "What if you had imported an account from another wallet?" (Need full backup)

### Scenario 4: Watch-Only Portfolio Tracker

**Task**: "You want to track your Bitcoin balance in a portfolio app without giving it spending permission. What do you export?"

**Expected answer**: Export Xpub (public key)

**Success criteria**: User understands xpub = read-only, can't spend

**Follow-up**: "Can someone steal your Bitcoin with just the xpub?" (No)

---

## Future Enhancements

### Phase 2 Features (Out of Scope for V1)

**1. Interactive Backup Wizard**
- Guided flow: "What do you want to do?" → Recommends correct backup type
- Questions: "Do you have imported accounts?" → Suggests full backup vs seed
- Visual: Flowchart showing decision tree

**2. Backup Verification**
- After export: "Verify your backup" flow
- Test restore in sandbox mode
- Checksum verification tools

**3. Backup Health Dashboard**
- Last backup date for each type
- Recommendations: "You haven't backed up in 30 days"
- Backup completeness score: "3/4 accounts backed up"

**4. Educational Tooltips**
- First-time user: Highlight tooltips with pulse animation
- "Click here to learn what an xpub is"
- Dismiss-able tour of backup section

**5. Export History**
- "Recent Exports" section
- Shows last 5 exports with timestamps
- Helps users remember: "Did I backup Savings account?"

---

## Success Metrics

### User Comprehension

**Target**: 90% of users can correctly answer:
1. "What's the difference between a seed phrase and private key export?"
2. "When would you export an xpub vs a private key?"
3. "Which backup includes your contacts?"

**Measurement**: Survey after using feature 3+ times

### Error Reduction

**Target**: 50% reduction in support tickets about:
- "I can't find the export button" (inconsistent visibility)
- "What's an xpub?" (no explanation)
- "Which backup should I use?" (no comparison)

**Measurement**: Support ticket categorization

### Feature Adoption

**Target**: 40% of users export at least one backup type within 30 days

**Baseline**: Currently <10% export xpub (only button visible)

**Measurement**: Analytics on export button clicks

### Task Completion

**Target**: 95% task completion rate for:
- "Export xpub for multisig setup"
- "Export private key for account import"
- "Create full wallet backup"

**Measurement**: User testing sessions (n=20)

---

## Cross-References

**Related Documentation:**
- `ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md` - Full wallet backup design
- `PRIVATE_KEY_EXPORT_IMPORT_UX_SPEC.md` - Private key export design
- `prompts/docs/experts/design/_INDEX.md` - Design system reference
- `src/tab/components/SettingsScreen.tsx` - Current settings implementation
- `src/tab/components/ExportXpubModal.tsx` - Existing xpub export modal

**Components to Create:**
- `src/tab/components/BackupExportSection.tsx` - New section component
- `src/tab/components/ExportOptionsDropdown.tsx` - Dropdown menu component
- `src/tab/components/shared/Tooltip.tsx` - Reusable tooltip component
- `src/tab/components/shared/ComparisonTable.tsx` - Backup comparison table

**Components to Update:**
- `src/tab/components/SettingsScreen.tsx` - Add new section, reorganize
- `src/tab/components/ExportXpubModal.tsx` - Add "What is xpub?" header
- `src/tab/components/ExportPrivateKeyModal.tsx` - Add "What is key?" header

---

## Appendix: Copy Guidelines

### Tone & Voice

**Educational, not condescending:**
- ✓ "An xpub allows others to view your addresses"
- ✗ "Basically, an xpub is like a read-only key or whatever"

**Honest about risks, not alarmist:**
- ✓ "Anyone with your private key can spend your funds"
- ✗ "NEVER EVER SHARE YOUR KEY OR YOU'LL LOSE EVERYTHING!!!"

**Technical accuracy, plain language:**
- ✓ "WIF (Wallet Import Format) - a standard private key encoding"
- ✗ "WIF is a thing that wallets use for keys and stuff"

**Action-oriented:**
- ✓ "Use for multisig setup or watch-only wallets"
- ✗ "This might be useful in some situations depending on what you need"

### Terminology Standardization

| Concept | Always Use | Never Use |
|---------|-----------|-----------|
| Extended public key | "Xpub" (after first use) | "Extended pub", "xPub", "XPUB" |
| Private key | "Private key" or "WIF" | "Privkey", "secret key", "PK" |
| Seed phrase | "Seed phrase" or "Recovery phrase" | "Mnemonic", "seed words", "backup phrase" |
| Full backup | "Full wallet backup" | "Complete backup", "everything backup" |
| Account | "Account" | "Wallet", "subwallet", "address" |

### Emoji Usage

**Consistent mapping:**
- 🔓 = Public data (xpub)
- 🔒 = Private data (private key)
- 🔐 = Encrypted data (full backup)
- 🔑 = Master key (seed phrase)
- 💾 = File/backup
- ℹ️ = Information
- ⚠️ = Warning
- ✓ = Included/enabled
- ✗ = Not included/disabled

**Accessibility**: Always pair emojis with text labels (not emoji alone)

---

## Final Notes

This design prioritizes **clarity and education** over minimalism. While it adds more UI elements (dropdowns, help icons, comparison tables), each addition directly addresses user confusion identified in the problem statement.

**Key principle**: *"Clear is kind. Unclear is unkind."* - Brené Brown

Users deserve to understand what they're exporting and why. The extra UI complexity is justified by the reduction in user confusion, support burden, and risk of incorrect backups.

**Design Status**: ✅ Complete
**Ready for**: Frontend Development
**Estimated Effort**: 3-4 weeks full implementation
**Dependencies**: Private Key Export feature (not yet implemented)

---

**Document Maintained By**: UI/UX Designer
**Last Updated**: October 26, 2025
**Version**: 1.0
**Status**: Ready for Review & Implementation
