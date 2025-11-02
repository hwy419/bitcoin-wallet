# Phase 2 Visual Guide: Multisig UI Integration

This guide shows the visual changes made in Phase 2 to integrate multisig accounts into the Bitcoin wallet dashboard.

---

## 1. Sidebar - Account List

### ✅ Already Complete (No Changes Needed)

The Sidebar already groups accounts by type and displays multisig badges.

```
┌─────────────────────────────────┐
│  Bitcoin Wallet                 │
│  Testnet                        │
├─────────────────────────────────┤
│  Treasury                       │ ← Active
│  Multi-sig Wallets              │
│  Address Book                   │
├─────────────────────────────────┤
│  [Account Dropdown ▼]           │
│                                 │
│  HD ACCOUNTS                    │
│  ₿ Account 1                    │
│  ₿ Savings                      │
│                                 │
│  IMPORTED ACCOUNTS              │
│  🔑 Trading Wallet              │
│                                 │
│  MULTISIG ACCOUNTS              │ ← NEW SECTION
│  🔐 Treasury (2-of-3) ✓        │ ← Multisig badge
│  🔐 Cold Storage (3-of-5)       │
│                                 │
│  [+ Create Account]             │
│  [Import Account]               │
│  [+ Create Multisig Account]    │
└─────────────────────────────────┘
```

**Key Features:**
- Three distinct account sections
- Purple multisig badge with config
- Lock icon (🔐) for multisig accounts

---

## 2. Dashboard - Header

### Before:
```
┌─────────────────────────────────────────────────────────────┐
│ Treasury                                                    │
│ Account 1 • 5 accounts                                      │
└─────────────────────────────────────────────────────────────┘
```

### After (Multisig Account):
```
┌─────────────────────────────────────────────────────────────┐
│ Treasury  [2-of-3 Multisig] ← NEW BADGE                    │
│ Treasury • 5 accounts                                       │
└─────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Multisig badge appears next to title
- Instant visual confirmation of account type

---

## 3. Dashboard - Multisig Info Banner

### Before:
```
┌─────────────────────────────────────────────────────────────┐
│ [Balance Card]              [Balance History Chart]         │
│                                                             │
│ [Transaction History]                                       │
└─────────────────────────────────────────────────────────────┘
```

### After (Multisig Account):
```
┌─────────────────────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════════════════════╗  │
│ ║ 🔐  Multisig Account                                 ║  │ ← NEW BANNER
│ ║                                                        ║  │
│ ║  This is a 2-of-3 multisig account. Transactions     ║  │
│ ║  require 2 signatures to spend funds.                ║  │
│ ║                                                        ║  │
│ ║  [P2WSH] • 3 Co-signers                              ║  │
│ ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
│ [Balance Card]              [Balance History Chart]         │
│                                                             │
│ [Co-Signers Section] ← NEW SECTION                         │
│                                                             │
│ [Transaction History]                                       │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Purple gradient banner
- Explains multisig configuration
- Shows signature requirements
- Displays address type and co-signer count

---

## 4. Dashboard - Co-Signers Section

### NEW Section (Multisig Only):

```
┌─────────────────────────────────────────────────────────────┐
│ Co-Signers (3)                                              │
├─────────────────────────────────────────────────────────────┤
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ Alice                                          [You] ┃ │ ← Self
│ ┃                                                       ┃ │
│ ┃ Fingerprint:     a4b3 c2d1                           ┃ │
│ ┃ Extended Public: tpub...abc123                       ┃ │
│ ┃ Derivation Path: m/48'/1'/0'/2'                      ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Bob                                                   │ │
│ │                                                       │ │
│ │ Fingerprint:     5e6f 7a8b                           │ │
│ │ Extended Public: tpub...def456                       │ │
│ │ Derivation Path: m/48'/1'/1'/2'                      │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Charlie                                               │ │
│ │                                                       │ │
│ │ Fingerprint:     9c0d 1e2f                           │ │
│ │ Extended Public: tpub...ghi789                       │ │
│ │ Derivation Path: m/48'/1'/2'/2'                      │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Full co-signer details
- Highlights current user ("You")
- Shows fingerprints for verification
- Displays xpubs and derivation paths

---

## 5. Receive Screen - Multisig Support

### Before (Single-Sig):
```
┌─────────────────────────────────────────────────────────────┐
│ Receive Bitcoin                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                   [QR Code]                                 │
│                                                             │
│  tb1q...abc123                                              │
│                                                             │
│  [Copy Address]                                             │
└─────────────────────────────────────────────────────────────┘
```

### After (Multisig):
```
┌─────────────────────────────────────────────────────────────┐
│ Receive Bitcoin                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Multisig Account  [2-of-3 Multisig] ← BADGE                │
│                                                             │
│ ╔═══════════════════════════════════════════════════════╗  │
│ ║ This is a 2-of-3 multisig address. Funds sent to     ║  │ ← INFO
│ ║ this address will require 2 signatures to spend.     ║  │
│ ╚═══════════════════════════════════════════════════════╝  │
│                                                             │
│ Co-Signers: Alice (You) • Bob • Charlie ← COMPACT LIST     │
│                                                             │
│                   [QR Code]                                 │
│                                                             │
│  tb1q...abc123  [2-of-3] [P2WSH]                           │
│                                                             │
│  Derivation Path: m/48'/1'/0'/2'/0/0 ← VERIFICATION        │
│                                                             │
│  [Copy Address]                                             │
│  [Generate New Address] ← NEW BUTTON (purple)              │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- Purple info banner
- Co-signers list (compact view)
- Derivation path for verification
- New "Generate New Address" button (purple)
- Loading state during generation

---

## 6. Color Scheme Reference

### Single-Sig Accounts
- **Primary:** Bitcoin Orange (`#F7931A`)
- **Accents:** Orange/Gold gradients
- **Icons:** ₿ (Bitcoin symbol) or 🔑 (key)

### Multisig Accounts
- **Primary:** Purple (`#8b5cf6`)
- **Accents:** Purple gradients
- **Icons:** 🔐 (lock with key)

### Color Classes
```css
/* Multisig Badge */
bg-purple-500/15 text-purple-400 border-purple-500/30

/* Multisig Banner */
bg-gradient-to-r from-purple-500/10 to-purple-700/10 border border-purple-500/30

/* Multisig Button */
bg-purple-600 hover:bg-purple-700 active:bg-purple-800

/* Highlighted Co-Signer (Self) */
bg-bitcoin-subtle border-bitcoin-light/30 text-bitcoin-light
```

---

## 7. User Flow: Creating and Using Multisig

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Create Multisig Account                                  │
│    Click "Create Multisig Account" in Sidebar               │
│                           ↓                                  │
│ 2. Multisig Wizard                                          │
│    - Select configuration (2-of-3, 3-of-5, etc.)           │
│    - Import co-signer xpubs                                │
│    - Verify addresses                                       │
│                           ↓                                  │
│ 3. Account Created                                          │
│    Appears in "Multisig Accounts" section                  │
│                           ↓                                  │
│ 4. Switch to Multisig Account                              │
│    - Purple banner explains configuration                   │
│    - Co-signers section shows participants                 │
│    - Balance and transactions load normally                │
│                           ↓                                  │
│ 5. Receive Funds                                           │
│    - Click "Receive" → Modal shows multisig address        │
│    - Co-signers listed for verification                    │
│    - Can generate new addresses manually                   │
│                           ↓                                  │
│ 6. Send Funds (PSBT Flow)                                  │
│    - Click "Send" → Creates PSBT                           │
│    - PSBT appears in "Pending Transactions"                │
│    - Export PSBT to co-signers                             │
│    - Import signed PSBTs                                   │
│    - Broadcast when enough signatures collected            │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Mobile/Responsive Considerations

All components are designed to be responsive:

- **Sidebar:** Already responsive with dropdown on mobile
- **Dashboard Banner:** Stacks vertically on small screens
- **Co-Signers:** Card layout adjusts to screen width
- **Receive Modal:** Full-height on mobile devices

---

## 9. Accessibility Features

- **Color Contrast:** All text meets WCAG AA standards
- **Keyboard Navigation:** All interactive elements are keyboard accessible
- **Screen Reader Support:** Proper ARIA labels on badges and buttons
- **Focus Indicators:** Clear focus states on all buttons
- **Error Messages:** Clear error feedback for failed operations

---

## 10. Animation & Transitions

- **Badge Appearance:** Fade in smoothly
- **Banner:** Subtle gradient animation
- **Buttons:** Scale animation on click (0.98x)
- **Loading States:** Spinner animation during generation
- **Error Messages:** Slide in from top

---

**Visual Design Completion:** November 1, 2025
**Consistent with:** Bitcoin Wallet Design System v0.11.0
