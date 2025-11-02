# Export Options Clarity - Visual Reference Guide

**Version**: 1.0
**Date**: October 26, 2025
**Type**: Quick Reference for Developers
**Companion to**: EXPORT_CLARITY_UX_DESIGN.md

---

## Quick Navigation

1. [Before/After Comparison](#beforeafter-comparison)
2. [Color Chart](#color-chart)
3. [Component Specs](#component-specs)
4. [Icon Legend](#icon-legend)
5. [Desktop Layouts](#desktop-layouts)
6. [Mobile Layouts](#mobile-layouts)
7. [Implementation Shortcuts](#implementation-shortcuts)

---

## Before/After Comparison

### Current State (Confusing)

```
┌──────────────────────────────────────────────────────────┐
│ Settings → Account Management                            │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ Account 1                                                │
│ Native SegWit • 0.001 tBTC                              │
│ [Rename] [Export Key] [Delete]                          │
│          └─ What key? Why?                              │
│                                                           │
│ Account 2 (Imported)                                     │
│ Native SegWit • 0.05 tBTC                               │
│ [Rename] [Export Key] [Export Xpub] [Delete]            │
│          └─ Why does THIS one have xpub button?         │
│                                                           │
│ Account 3 (Multisig)                                     │
│ P2WSH • 0.1 tBTC                                        │
│ [View Co-Signers] [Delete]                              │
│ └─ Can't export anything? Why not?                      │
│                                                           │
│ NO EXPLANATION ANYWHERE ❌                               │
└──────────────────────────────────────────────────────────┘
```

**Problems:**
- ❌ Inconsistent buttons (why Export Xpub on only some accounts?)
- ❌ No explanation of what "Export Key" does
- ❌ No guidance on when to use each export type
- ❌ Missing full wallet backup entirely
- ❌ Users confused about seed phrase vs exports

---

### New State (Clear)

```
┌──────────────────────────────────────────────────────────────────┐
│ Settings                                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│ Account Management                                               │
│ ├─ Account 1                                                     │
│ │  Native SegWit • 0.001 tBTC                                   │
│ │  [Rename] [Export Options ▾] [Delete]                         │
│ │                └─ Consistent on ALL accounts ✓                │
│ │                                                                │
│ ├─ Account 2 (Imported)                                          │
│ │  Native SegWit • 0.05 tBTC                                    │
│ │  [Rename] [Export Options ▾] [Delete]                         │
│ │                └─ Same button, different options inside       │
│ │                                                                │
│ └─ Account 3 (Multisig)                                          │
│    P2WSH • 0.1 tBTC                                             │
│    [Rename] [Export Options ▾] [Delete]                         │
│                └─ Shows "why disabled" in dropdown              │
│                                                                   │
│ Backup & Export  ← NEW SECTION ✓                                │
│ ├─ ℹ️  Understanding Your Backup Options                        │
│ │  Clear explanation of 4 backup types                          │
│ │                                                                │
│ ├─ 🔑 Seed Phrase Backup                                        │
│ │  • What: 12 words                                             │
│ │  • Backs up: All HD accounts                                  │
│ │  • When: Ultimate disaster recovery                           │
│ │  [View Seed Phrase] ⓘ                                         │
│ │                                                                │
│ ├─ 💾 Full Wallet Backup                                        │
│ │  • What: Encrypted file                                       │
│ │  • Backs up: Everything (HD + imported + contacts)            │
│ │  • When: Complete backup, preserving contacts                 │
│ │  [Export Encrypted Backup] ⓘ (Coming soon)                   │
│ │                                                                │
│ └─ 🗂️  Individual Account Backups                               │
│    • See "Export Options" on each account above                │
│    • Xpub: Multisig setup, watch-only                          │
│    • Private Key: Moving account to other wallet               │
│                                                                   │
│ ├─ 📊 Backup Comparison Table                                   │
│ │  Side-by-side: Seed | Full | PrivKey | Xpub                  │
│ │  Shows: What backs up, encryption, portability                │
│ │                                                                │
│ Security                                                         │
│ └─ Auto-lock, Lock Wallet                                       │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Solutions:**
- ✅ Consistent "Export Options" button on every account
- ✅ Dropdown shows what's available + why others disabled
- ✅ Dedicated "Backup & Export" section explains everything
- ✅ Comparison table shows differences clearly
- ✅ Help icons (ⓘ) provide tooltips on hover
- ✅ Use cases listed for each export type

---

## Color Chart

### Security Warning Colors

```
┌──────────────────────────────────────────────────────────┐
│ Critical (Red)                                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │ bg-red-500/15 border-red-500/30 text-red-300       │  │
│ │ ⚠️  Private keys can spend funds - never share     │  │
│ └────────────────────────────────────────────────────┘  │
│ Use for: Private key exports, destructive actions       │
│                                                           │
│ High Warning (Amber)                                     │
│ ┌────────────────────────────────────────────────────┐  │
│ │ bg-amber-500/12 border-amber-500/30 text-amber-300 │  │
│ │ ⚠️  Unencrypted - store in secure location         │  │
│ └────────────────────────────────────────────────────┘  │
│ Use for: Seed phrase, unencrypted exports               │
│                                                           │
│ Informational (Blue)                                     │
│ ┌────────────────────────────────────────────────────┐  │
│ │ bg-blue-500/10 border-blue-500/30 text-blue-200    │  │
│ │ ℹ️  Xpub is public data - safe for watch-only      │  │
│ └────────────────────────────────────────────────────┘  │
│ Use for: Explanations, xpub exports, general info       │
│                                                           │
│ Success (Green)                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ bg-green-500/10 border-green-500/30 text-green-300 │  │
│ │ ✓ Backup created successfully                      │  │
│ └────────────────────────────────────────────────────┘  │
│ Use for: Success messages, enabled states               │
└──────────────────────────────────────────────────────────┘
```

### Security Level Indicators

```
🔓 Unencrypted (Amber)     Seed phrase, xpub
   └─ bg-amber-400 text-amber-400

🔒 Optionally Encrypted    Private key export
   └─ bg-gray-400 text-gray-400

🔐 Always Encrypted (Green) Full wallet backup
   └─ bg-green-400 text-green-400
```

---

## Component Specs

### Export Options Dropdown

**Closed State:**
```
┌────────────────────────────────────────────┐
│ Main Account                               │
│ Native SegWit • 0.001 tBTC                │
│                                            │
│ [Export Options ▾]                         │
│  └─ bg-gray-800 hover:bg-gray-750         │
│     text-gray-300                          │
│     px-4 py-2 rounded-lg                   │
└────────────────────────────────────────────┘
```

**Open State (HD Account):**
```
┌────────────────────────────────────────────────────────┐
│ [Export Options ▴]  ← Active state (gray-750)          │
│                                                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Export Options                     [×]             │ │
│ ├────────────────────────────────────────────────────┤ │
│ │                                                    │ │
│ │ 🔓 Export Xpub (Public Key)                        │ │
│ │    For multisig setup or watch-only wallets       │ │
│ │    ├─ Hover: bg-gray-800                          │ │
│ │    └─ px-4 py-3 cursor-pointer                    │ │
│ │                                                    │ │
│ │ 🔒 Export Private Key                              │ │
│ │    WIF format for importing to other wallets      │ │
│ │    ├─ Hover: bg-gray-800                          │ │
│ │    └─ px-4 py-3 cursor-pointer                    │ │
│ │                                                    │ │
│ │ ─────────────────────────────────────────         │ │
│ │                                                    │ │
│ │ 📋 View Account Details                            │ │
│ │    Addresses, derivation path, xpub info          │ │
│ │    └─ Hover: bg-gray-800                          │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
│                                                         │
│ Container:                                              │
│ └─ bg-gray-850 border-gray-700 rounded-lg shadow-2xl  │
│    w-96 absolute z-50 top-full right-0 mt-2           │
└────────────────────────────────────────────────────────┘
```

**Open State (Multisig Account):**
```
┌────────────────────────────────────────────────────────┐
│ ┌────────────────────────────────────────────────────┐ │
│ │                                                    │ │
│ │ 🔓 Export Xpub (Public Key)   [Disabled]          │ │
│ │    Not available - use multisig wizard            │ │
│ │    ├─ opacity-50 cursor-not-allowed               │ │
│ │    └─ Hover: Show tooltip explaining why          │ │
│ │                                                    │ │
│ │ 🔒 Export Private Key   [Disabled]                 │ │
│ │    Multisig accounts require all co-signers       │ │
│ │    └─ opacity-50 cursor-not-allowed               │ │
│ │                                                    │ │
│ │ ─────────────────────────────────────────         │ │
│ │                                                    │ │
│ │ 📋 View Account Details                            │ │
│ │    Addresses, co-signers, quorum info             │ │
│ │    └─ Enabled (hover: bg-gray-800)                │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Tooltip Component

**Appearance:**
```
              ┌───────────────────────────────────┐
              │ bg-gray-900 border-gray-600       │
              │ rounded-lg shadow-2xl p-3         │
              │ max-w-xs (320px)                  │
              │                                   │
              │ Extended Public Key (Xpub)        │
              │ ───────────────────────────────   │
              │                                   │
              │ A public key that generates all   │
              │ receiving addresses. Safe to      │
              │ share for watch-only wallets.     │
              │ Does NOT allow spending.          │
              │                                   │
              │ Learn more →                      │
              │                                   │
              └────────▼──────────────────────────┘
                       │
                       │ (Arrow points to trigger)
                      ⓘ
```

**Trigger Element:**
```html
<button class="ml-1 text-gray-500 hover:text-gray-300 transition-colors">
  ⓘ  <!-- or SVG info icon -->
</button>
```

**Positioning logic:**
- Default: Above trigger (bottom arrow)
- If too close to top: Below trigger (top arrow)
- If too close to sides: Shift left/right
- Always visible in viewport

---

## Icon Legend

### Security Level Icons

```
🔓  Public Data (No encryption)
    Use for: Xpub exports
    Color: text-blue-400
    Example: "🔓 Xpub is public - safe to share"

🔒  Private Data (Optional encryption)
    Use for: Private key exports
    Color: text-amber-400
    Example: "🔒 Private key - password protection recommended"

🔐  Encrypted Data (Required encryption)
    Use for: Full wallet backups
    Color: text-green-400
    Example: "🔐 AES-256 encrypted backup file"

🔑  Master Key
    Use for: Seed phrase
    Color: text-amber-400
    Example: "🔑 12-word recovery phrase"
```

### Action Icons

```
💾  Backup/Save
    Use for: Export buttons, backup actions
    Example: "💾 Export Encrypted Backup"

📋  View/Copy
    Use for: Clipboard, view details
    Example: "📋 View Account Details"

🗂️   Organize/Manage
    Use for: Account management
    Example: "🗂️  Individual Account Backups"

ℹ️   Information
    Use for: Info boxes, help content
    Example: "ℹ️  Understanding Your Backup Options"

⚠️   Warning
    Use for: Security warnings
    Example: "⚠️  CRITICAL SECURITY RISKS"

✓  Enabled/Included
    Color: text-green-400
    Example: "✓ All HD accounts"

✗  Disabled/Not Included
    Color: text-red-400
    Example: "✗ No spending permission"
```

---

## Desktop Layouts

### Backup & Export Section - Full Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Backup & Export                                      [Collapse ▴]       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ Understanding Your Backup Options                                       │
│ ┌───────────────────────────────────────────────────────────────────┐  │
│ │ ℹ️  Different backup types serve different purposes:             │  │
│ │                                                                    │  │
│ │ • Seed Phrase - Master backup for entire wallet                  │  │
│ │ • Full Wallet Backup - All accounts + contacts                   │  │
│ │ • Account Exports - Individual account portability               │  │
│ └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────┐    │
│ │ 🔑 Seed Phrase Backup                                    ⓘ      │    │
│ │                                                                  │    │
│ │ What it backs up:                                                │    │
│ │ • All HD-derived accounts (not imported private keys)            │    │
│ │ • Can restore wallet on any BIP39-compatible device              │    │
│ │                                                                  │    │
│ │ When to use:                                                     │    │
│ │ • Ultimate backup - can recover all HD accounts                  │    │
│ │ • Moving wallet to new device or different wallet app            │    │
│ │ • Long-term cold storage (fire safe, safety deposit box)         │    │
│ │                                                                  │    │
│ │ Security:  🔓 Unencrypted - Store in secure physical location    │    │
│ │                                                                  │    │
│ │                              [📋 View Seed Phrase]                │    │
│ └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ 💾 Full Wallet Backup                                     ⓘ      │   │
│ │                                                                   │   │
│ │ What it backs up:                                                 │   │
│ │ • All accounts (HD-derived AND imported from private keys)       │   │
│ │ • All saved contacts with labels                                 │   │
│ │ • Transaction history and custom labels                          │   │
│ │ • Wallet settings and preferences                                │   │
│ │                                                                   │   │
│ │ When to use:                                                      │   │
│ │ • Comprehensive backup including imported accounts               │   │
│ │ • Preserving contacts and transaction labels                     │   │
│ │ • Quick restore on same or different device                      │   │
│ │ • Migrating to new computer while keeping all data               │   │
│ │                                                                   │   │
│ │ Security:  🔐 AES-256 encrypted - Requires backup password       │   │
│ │            (separate from wallet unlock password)                │   │
│ │                                                                   │   │
│ │                    [💾 Export Encrypted Wallet Backup]            │   │
│ │                    (Feature coming soon)                          │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ 🗂️  Individual Account Backups                            ⓘ      │   │
│ │                                                                   │   │
│ │ Use "Export Options" dropdown on each account in the Account     │   │
│ │ Management section above to export individual accounts:          │   │
│ │                                                                   │   │
│ │ 🔓 Export Xpub - Public key for multisig coordination or         │   │
│ │    watch-only wallet setup. Safe to share with co-signers.       │   │
│ │    Cannot spend funds.                                           │   │
│ │                                                                   │   │
│ │ 🔒 Export Private Key - WIF format for importing account to      │   │
│ │    other wallet apps. Optional password protection. Anyone       │   │
│ │    with this can spend funds.                                    │   │
│ │                                                                   │   │
│ │ See each account's export menu for available options.            │   │
│ └───────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│ Backup Comparison                                           [Expand ▾]  │
│ (Table collapsed by default - click to expand)                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘

Dimensions:
└─ Section: max-w-4xl (896px) or full width if in 800px content area
   Card padding: p-5 (20px)
   Card spacing: mb-4 (16px)
   Button height: py-2 px-6 (32px total)
```

### Comparison Table - Expanded

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ Backup Comparison                                                     [Collapse ▴]  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│ ┏━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━┳━━━━━━━━━━┓ │
│ ┃               ┃ Seed Phrase    ┃ Full Wallet    ┃ Private Key    ┃ Xpub     ┃ │
│ ┃               ┃ (12 words)     ┃ Backup (file)  ┃ Export (WIF)   ┃ Export   ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Backs up      ┃ All HD         ┃ Everything     ┃ One account    ┃ N/A      ┃ │
│ ┃               ┃ accounts       ┃ (HD+imported+  ┃ only           ┃          ┃ │
│ ┃               ┃                ┃  contacts)     ┃                ┃          ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Can spend     ┃ ✓ Yes          ┃ ✓ Yes          ┃ ✓ Yes (one     ┃ ✗ No     ┃ │
│ ┃ funds         ┃                ┃                ┃   account)     ┃          ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Encrypted     ┃ ✗ No           ┃ ✓ Yes          ┃ Optional       ┃ ✗ No     ┃ │
│ ┃               ┃ (plaintext)    ┃ (AES-256)      ┃ (recommended)  ┃ (public) ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Portability   ┃ Any BIP39      ┃ This wallet    ┃ Any wallet     ┃ Watch-   ┃ │
│ ┃               ┃ wallet         ┃ app only       ┃ (WIF support)  ┃ only     ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Includes      ┃ ✗ No           ┃ ✓ Yes          ┃ ✗ No           ┃ ✗ No     ┃ │
│ ┃ imported      ┃                ┃                ┃                ┃          ┃ │
│ ┃ accounts      ┃                ┃                ┃                ┃          ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Includes      ┃ ✗ No           ┃ ✓ Yes          ┃ ✗ No           ┃ ✗ No     ┃ │
│ ┃ contacts      ┃                ┃                ┃                ┃          ┃ │
│ ┣━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━╋━━━━━━━━━━┫ │
│ ┃ Best for      ┃ Ultimate       ┃ Complete       ┃ Moving one     ┃ Multisig ┃ │
│ ┃               ┃ disaster       ┃ backup with    ┃ account to     ┃ setup,   ┃ │
│ ┃               ┃ recovery       ┃ contacts       ┃ other wallet   ┃ watch-   ┃ │
│ ┃               ┃                ┃                ┃                ┃ only     ┃ │
│ ┗━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━┻━━━━━━━━━━┛ │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘

Styling:
├─ Table container: border border-gray-700 rounded-lg overflow-hidden
├─ Header cells: bg-gray-800 text-white font-semibold text-sm px-4 py-3
├─ Data cells: bg-gray-850 text-gray-300 text-sm px-4 py-3 border-r border-b
├─ Checkmarks: text-green-400 font-semibold
├─ X marks: text-red-400 font-semibold
└─ "Best for" row: bg-blue-500/5 (light blue tint)
```

---

## Mobile Layouts

### Backup & Export Section (Mobile <768px)

```
┌──────────────────────────────┐
│ Backup & Export              │
├──────────────────────────────┤
│                               │
│ [▼] Understanding Options    │  ← Accordion collapsed by default
│                               │
│ [▶] 🔑 Seed Phrase Backup     │  ← Tap to expand
│                               │
│ [▼] 💾 Full Wallet Backup     │  ← Expanded
│ │ What it backs up:           │
│ │ • All accounts              │
│ │ • All contacts              │
│ │ • Settings                  │
│ │                             │
│ │ When to use:                │
│ │ • Complete backup           │
│ │ • Preserving contacts       │
│ │                             │
│ │ Security: 🔐 Encrypted      │
│ │                             │
│ │ [Export Backup]             │  ← Full width button
│ │ (Coming soon)               │
│ └─────────────────────────────┘
│                               │
│ [▶] 🗂️  Individual Backups    │  ← Collapsed
│                               │
│ [▶] 📊 Comparison Table       │  ← Collapsed
│                               │
└───────────────────────────────┘

Behavior:
├─ Tap header to expand/collapse
├─ Chevron rotates: ▶ (collapsed) / ▼ (expanded)
├─ Smooth height transition (300ms)
├─ Multiple sections can be open simultaneously
└─ Mobile buttons: w-full py-3 (full width, larger tap target)
```

### Export Options Dropdown (Mobile)

```
┌──────────────────────────────┐
│ Main Account                  │
│ Native SegWit                 │
│ 0.001 tBTC                    │
│                               │
│ [Rename Account]       (full width, py-3)
│                               │
│ [Export Options ▾]     (full width, py-3)
│                               │
│ ┌────────────────────────┐   │
│ │ Export Options    [×] │   │
│ ├────────────────────────┤   │
│ │                        │   │
│ │ 🔓 Export Xpub         │   │
│ │    Public Key          │   │
│ │    For multisig setup  │   │
│ │                        │   │  ← Each item py-4 (larger)
│ │ 🔒 Export Private Key  │   │
│ │    WIF Format          │   │
│ │    Account import      │   │
│ │                        │   │
│ │ ───────────────        │   │
│ │                        │   │
│ │ 📋 View Details        │   │
│ │    Addresses, paths    │   │
│ │                        │   │
│ └────────────────────────┘   │
│                               │
│ [Delete Account]       (full width, py-3)
│                               │
└───────────────────────────────┘

Dropdown positioning:
├─ Mobile: w-full (not w-96)
├─ Centered below button (not right-aligned)
├─ Fixed to viewport width with mx-4 (margins)
└─ Larger text: text-base (not text-sm)
```

### Comparison Table (Mobile)

**Option 1: Vertical Cards (Recommended)**
```
┌──────────────────────────────┐
│ Backup Comparison            │
├──────────────────────────────┤
│                               │
│ [▼] 🔑 Seed Phrase            │
│ │ Backs up: All HD accounts   │
│ │ Can spend: ✓ Yes            │
│ │ Encrypted: ✗ No             │
│ │ Portability: Any BIP39      │
│ │ Best for: Disaster recovery │
│ └─────────────────────────────┘
│                               │
│ [▶] 💾 Full Wallet Backup     │
│                               │
│ [▶] 🔒 Private Key Export     │
│                               │
│ [▶] 🔓 Xpub Export            │
│                               │
└───────────────────────────────┘
```

**Option 2: Horizontal Scroll Table**
```
┌──────────────────────────────────────────────┐
│ Backup Comparison                             │
├──────────────────────────────────────────────┤
│                                               │
│ ← Swipe to see more →                        │
│                                               │
│ ┌───────────────────────────────────────►    │
│ │ Type  │ Seed │ Full │ Key  │ Xpub │        │
│ ├───────┼──────┼──────┼──────┼──────┤        │
│ │ Backs │ HD   │ All  │ One  │ N/A  │        │
│ │ Spend │ Yes  │ Yes  │ Yes  │ No   │        │
│ │ ...   │      │      │      │      │        │
│ └───────────────────────────────────────►    │
│                                               │
└───────────────────────────────────────────────┘
```

---

## Implementation Shortcuts

### Copy-Paste Component Starters

**1. Export Options Button**
```tsx
<button
  onClick={() => setDropdownOpen(!dropdownOpen)}
  className="px-4 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm text-gray-300 font-semibold transition-colors active:scale-[0.98] flex items-center gap-2"
  aria-label={`Export options for ${accountName}`}
  aria-haspopup="true"
  aria-expanded={dropdownOpen}
>
  Export Options
  <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
    {/* Chevron down icon */}
  </svg>
</button>
```

**2. Backup Info Card**
```tsx
<div className="bg-gray-900 border border-gray-700 rounded-lg p-5 mb-4">
  <div className="flex items-center space-x-2 mb-3">
    <span className="text-xl">🔑</span>
    <h3 className="text-base font-semibold text-white">Seed Phrase Backup</h3>
    <button className="ml-auto text-gray-500 hover:text-gray-300">ⓘ</button>
  </div>

  <div className="space-y-3">
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">What it backs up:</p>
      <ul className="text-sm text-gray-300 space-y-1 ml-4 list-disc">
        <li>All HD-derived accounts</li>
        <li>Can restore on any device</li>
      </ul>
    </div>

    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase mb-1">When to use:</p>
      <ul className="text-sm text-gray-300 space-y-1 ml-4 list-disc">
        <li>Ultimate disaster recovery</li>
        <li>Long-term cold storage</li>
      </ul>
    </div>

    <div className="flex items-center space-x-2 text-xs font-semibold">
      <span className="text-amber-400">🔓</span>
      <span className="text-gray-300">Unencrypted - Store securely</span>
    </div>
  </div>

  <button className="mt-4 w-full bg-bitcoin hover:bg-bitcoin-hover text-white py-2 px-6 rounded-lg font-semibold transition-colors">
    📋 View Seed Phrase
  </button>
</div>
```

**3. Warning Info Box**
```tsx
<div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
  <div className="flex items-start space-x-2">
    <span className="text-blue-400 text-lg">ℹ️</span>
    <div>
      <p className="text-sm font-semibold text-blue-300 mb-2">
        Understanding Your Backup Options
      </p>
      <ul className="text-sm text-blue-200 space-y-1">
        <li>• Seed Phrase - Master backup for entire wallet</li>
        <li>• Full Wallet Backup - All accounts + contacts</li>
        <li>• Account Exports - Individual account portability</li>
      </ul>
    </div>
  </div>
</div>
```

**4. Tooltip Component**
```tsx
const Tooltip: React.FC<{ content: string; title?: string }> = ({ content, title, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
      >
        {children}
      </div>

      {show && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 max-w-xs">
          <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl p-3">
            {title && (
              <p className="text-sm font-semibold text-white mb-1">{title}</p>
            )}
            <p className="text-xs text-gray-300 leading-relaxed">{content}</p>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## CSS Class Reference

### Common Patterns

**Section Container:**
```css
bg-gray-850 border border-gray-700 rounded-xl p-6 mb-6
```

**Card Container:**
```css
bg-gray-900 border border-gray-700 rounded-lg p-5 mb-4
```

**Info Box (Blue):**
```css
bg-blue-500/10 border border-blue-500/30 rounded-lg p-4
```

**Warning Box (Amber):**
```css
bg-amber-500/12 border border-amber-500/30 rounded-lg p-4
```

**Critical Warning (Red):**
```css
bg-red-500/15 border border-red-500/30 rounded-lg p-4
```

**Primary Button:**
```css
bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-2 px-6 rounded-lg font-semibold transition-colors
```

**Secondary Button:**
```css
bg-gray-800 hover:bg-gray-750 text-gray-300 py-2 px-4 rounded-lg font-semibold transition-colors
```

**Dropdown Menu:**
```css
bg-gray-850 border border-gray-700 rounded-lg shadow-2xl py-2 w-96
```

**Dropdown Item:**
```css
px-4 py-3 hover:bg-gray-800 cursor-pointer transition-colors
```

**Dropdown Item (Disabled):**
```css
px-4 py-3 opacity-50 cursor-not-allowed
```

---

## Animation Timings

```
Button hover:      200ms  (transition-colors)
Button active:     100ms  (scale transform)
Dropdown open:     200ms  (fade + slide)
Dropdown close:    150ms  (fade out)
Chevron rotate:    200ms  (transform rotate)
Accordion expand:  300ms  (height transition)
Tooltip appear:    150ms  (fade + scale) + 300ms delay
```

---

## Testing Checklist

### Visual Testing

- [ ] Export Options button shows on ALL HD accounts
- [ ] Export Options button shows on ALL imported accounts
- [ ] Export Options button shows on ALL multisig accounts
- [ ] Dropdown shows correct options based on account type
- [ ] Disabled options have explanatory text
- [ ] Tooltips appear on hover (desktop)
- [ ] Tooltips appear on tap (mobile)
- [ ] Info boxes use correct colors (blue/amber/red)
- [ ] Icons display correctly (not broken emojis)
- [ ] Table is readable on mobile (scrollable or stacked)

### Functional Testing

- [ ] Clicking "Export Xpub" opens xpub modal
- [ ] Clicking "Export Private Key" opens private key modal
- [ ] Clicking "View Details" opens details modal
- [ ] Dropdown closes when clicking outside
- [ ] Dropdown closes when pressing Escape
- [ ] Accordion sections expand/collapse on click
- [ ] Tooltips dismiss when clicking away
- [ ] Buttons have correct disabled states
- [ ] Tab order is logical (keyboard navigation)

### Content Testing

- [ ] All tooltips have clear, concise content
- [ ] All descriptions use 8th grade reading level
- [ ] No technical jargon without explanation
- [ ] Security warnings are prominent but not alarmist
- [ ] Use cases are relatable and practical
- [ ] Comparison table is accurate
- [ ] Icons match their semantic meaning

---

## Final Implementation Notes

**Priority Order:**
1. Export Options Dropdown (most critical - fixes inconsistency)
2. Backup & Export Section (education layer)
3. Enhanced Modal Headers (context when exporting)
4. Tooltips & Help Icons (progressive disclosure)
5. Comparison Table (nice-to-have reference)

**Dependencies:**
- Private Key Export feature (not yet implemented)
- Full Wallet Backup feature (not yet implemented)
- Both should be added as "Coming Soon" placeholders

**Estimated Effort:**
- Dropdown: 2 days
- Backup Section: 3 days
- Modal Headers: 1 day
- Tooltips: 2 days
- Comparison Table: 1 day
- **Total: 9 days (1.8 weeks)**

---

**Document Status**: ✅ Complete
**Ready for**: Frontend Implementation
**Last Updated**: October 26, 2025
**Version**: 1.0
