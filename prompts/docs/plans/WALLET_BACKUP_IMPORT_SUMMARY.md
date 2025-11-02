# Wallet Backup Import/Restore - Implementation Summary

**Feature:** Wallet Backup Import and Restore System
**Version:** 1.0
**Date:** October 26, 2025
**Status:** Design Complete - Ready for Implementation

---

## Quick Overview

This document provides a **quick summary** of the wallet backup import/restore feature design. For complete details, see the full specifications.

---

## Document Index

| Document | Purpose | Word Count | Status |
|----------|---------|------------|--------|
| **WALLET_BACKUP_IMPORT_UX_SPEC.md** | Complete UX specification with all modal designs, flows, and interactions | 18,000+ | ✅ Complete |
| **WALLET_BACKUP_IMPORT_VISUAL_GUIDE.md** | Visual reference guide with color charts, button styles, and code snippets | 5,000+ | ✅ Complete |
| **WALLET_BACKUP_IMPORT_SUMMARY.md** | This file - Quick reference and implementation checklist | 3,000+ | ✅ Complete |
| **WALLET_BACKUP_RESTORE_PRD.md** | Product requirements (already exists) | 85,000+ | ✅ Complete |
| **ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md** | Export flow UX (already exists) | 18,000+ | ✅ Complete |

---

## Feature Summary

### What We're Building

Allow users to **import encrypted wallet backup files** (.dat) to:
- Restore wallet on a new device
- Recover wallet after browser corruption
- Migrate wallet from old computer to new computer
- Restore exact wallet state (accounts, contacts, settings)

### Key Differentiators

| Feature | Seed Phrase Import | Private Key Import | **Backup Import** |
|---------|-------------------|-------------------|-------------------|
| Restores accounts | ✓ HD only | ✗ One account | ✓ All accounts |
| Restores contacts | ✗ Lost | ✗ Lost | ✓ All contacts |
| Restores settings | ✗ Lost | ✗ Lost | ✓ All settings |
| Restores multisig | ✗ Partial | ✗ Not supported | ✓ Complete |
| Restores imported keys | ✗ Lost | N/A | ✓ All keys |

---

## Two Import Scenarios

### Scenario A: Fresh Install (No Existing Wallet)

**Entry Point:** Wallet Setup Screen → "Import from Backup" tab

**Flow (5 modals):**
1. File Selection → Select .dat file
2. Backup Password → Enter password from export
3. Import Progress → Decrypt + restore (10-30 sec)
4. Set Wallet Password → Create NEW wallet password
5. Import Success → See what was restored

**User Journey:**
- User has backup file from another device
- No wallet exists yet
- Simple, straightforward import
- Create fresh wallet password
- Wallet ready to use

### Scenario B: Replace Existing Wallet

**Entry Point:** Settings Screen → Advanced → "Import Backup & Replace Wallet"

**Flow (6-7 modals):**
1. Replace Warning → Scary warning about deleting current wallet
2. Confirm Password → Re-authenticate with current password
3. File Selection → Select .dat file
4. Backup Password → Enter password from export
5. Import Progress → Decrypt + restore (10-30 sec)
6. [Network Mismatch Warning] → If backup network differs (optional)
7. Import Success → See what was restored

**User Journey:**
- User wants to replace current wallet
- Multiple warnings about data loss
- Option to export current wallet first
- Must confirm with password
- Old wallet deleted, backup wallet loaded
- Use existing password to unlock

---

## Modal Designs

### Modal 1: File Selection

**Purpose:** Select .dat backup file

**Key Features:**
- Drag & drop zone
- Browse files button
- File validation (type, size)
- Selected file display with remove option

**Visual:**
```
┌────────────────────────────────────────┐
│  📁  Import Wallet Backup              │
├────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐  │
│  │                                  │  │
│  │  📁  Drag & drop .dat file here │  │
│  │       or                         │  │
│  │  [Browse Files]                  │  │
│  │                                  │  │
│  │  Supported: .dat files only      │  │
│  │  Max size: 10 MB                 │  │
│  │                                  │  │
│  └─────────────────────────────────┘  │
│                                         │
│  [Cancel] [Continue →]                 │
└────────────────────────────────────────┘
```

---

### Modal 2: Backup Password Entry

**Purpose:** Decrypt backup file

**Key Features:**
- Password input with visibility toggle
- Hint explaining difference from wallet password
- Error handling for wrong password
- Back button (return to file selection)

**Visual:**
```
┌────────────────────────────────────────┐
│  🔑  Enter Backup Password             │
├────────────────────────────────────────┤
│                                         │
│  Enter the password you created when   │
│  exporting this backup.                │
│                                         │
│  Password: [••••••••••] [👁]          │
│                                         │
│  💡 This is the BACKUP password, not   │
│     your wallet password.              │
│                                         │
│  [Back] [Cancel] [Decrypt & Import →] │
└────────────────────────────────────────┘
```

---

### Modal 3: Import Progress

**Purpose:** Show decryption and import progress

**Key Features:**
- Non-dismissible modal
- Spinner animation
- Progress bar (0-100%)
- Step-by-step status updates
- Warning not to close window

**Progress Steps:**
1. Validating backup file... (0-10%)
2. Decrypting backup... (11-25%)
3. Validating wallet data... (26-40%)
4. Migrating backup format... (41-50%) [if needed]
5. Restoring accounts... (51-75%)
6. Restoring contacts... (76-90%)
7. Finalizing import... (91-100%)

**Visual:**
```
┌────────────────────────────────────────┐
│  🔐  Importing Wallet Backup...        │
├────────────────────────────────────────┤
│                                         │
│         [Spinner Animation]             │
│                                         │
│  Progress: [█████████░░] 75%           │
│                                         │
│  Current step:                          │
│  Restoring contacts...                  │
│                                         │
│  ⚠️  Do not close this window          │
└────────────────────────────────────────┘
```

---

### Modal 4: Set Wallet Password (Fresh Install Only)

**Purpose:** Create new wallet password after successful import

**Key Features:**
- Password input with requirements checklist
- Confirm password input
- Same validation as wallet setup
- Explains this can differ from backup password

**Visual:**
```
┌────────────────────────────────────────┐
│  🔐  Create Wallet Password            │
├────────────────────────────────────────┤
│                                         │
│  Create a password to unlock your      │
│  wallet. This can be different from    │
│  the backup password.                  │
│                                         │
│  Password: [••••••••] [👁]            │
│                                         │
│  Requirements:                          │
│  ✓ At least 8 characters               │
│  ✓ Contains uppercase letters          │
│  ✗ Contains lowercase letters          │
│  ✗ Contains numbers                    │
│                                         │
│  Confirm:  [••••••••] [👁]            │
│                                         │
│  [Cancel] [Create Wallet →]            │
└────────────────────────────────────────┘
```

---

### Modal 5: Import Success

**Purpose:** Confirm successful import and show what was restored

**Key Features:**
- Large success icon with animation
- Detailed summary of restored data
- Backup metadata (network, date)
- Clear next steps
- Different variants for fresh install vs replace

**Visual:**
```
┌────────────────────────────────────────┐
│  ✅  Wallet Successfully Restored      │
├────────────────────────────────────────┤
│                                         │
│              ✅                         │
│                                         │
│  Your wallet has been restored from    │
│  the backup file.                      │
│                                         │
│  ┌─────────────────────────────────┐  │
│  │ 📊 Restored Data                │  │
│  │                                  │  │
│  │ • 5 Single-Sig Accounts          │  │
│  │ • 2 Multisig Accounts (2-of-3)   │  │
│  │ • 12 Contacts                    │  │
│  │ • All Settings                   │  │
│  │                                  │  │
│  │ 🌐 Network: Testnet              │  │
│  │ 📅 Created: Oct 20, 2025         │  │
│  └─────────────────────────────────┘  │
│                                         │
│  You can now unlock your wallet with   │
│  the password you just created.        │
│                                         │
│         [Get Started]                   │
└────────────────────────────────────────┘
```

---

## Additional Modals

### Replace Warning Modal (Scenario B Only)

**Purpose:** Warn about deleting current wallet

**Key Features:**
- Red warning colors (destructive action)
- Show current wallet stats
- Critical warning box
- Option to export current wallet first
- Scary "I Understand, Replace Wallet" button

---

### Network Mismatch Warning (Conditional)

**Purpose:** Warn if backup network differs from current setting

**When Shown:** After backup decryption, if networks don't match

**Key Features:**
- Amber warning colors
- Explain what will change
- Show both networks
- User must explicitly confirm network change

**Example:**
```
⚠️  This backup is for MAINNET but your wallet
    is set to TESTNET. Importing will change your
    network setting to MAINNET.

    [Cancel] [Change to Mainnet & Import]
```

---

## Error Scenarios

| Error | When | Recovery |
|-------|------|----------|
| **Invalid file type** | File selection | Select .dat file |
| **File too large** | File selection | Select smaller file |
| **Corrupted file** | After validation | Try different backup |
| **Wrong password** | Decryption | Re-enter password |
| **Version too new** | Validation | Update extension |
| **Network mismatch** | After decryption | Cancel or accept change |
| **Import failed** | During import | Retry from beginning |

**Error Message Pattern:**
1. What happened (clear, non-technical)
2. Why it happened (if helpful)
3. What to do next (actionable)

---

## Design System

### Color Palette

**Destructive Actions (Replace Wallet):**
- `bg-red-500` - Button background
- `bg-red-500/15` - Warning box background
- `border-red-500/30` - Warning box border
- `text-red-300` - Warning text

**Network Warnings:**
- `bg-amber-500` - Button background
- `bg-amber-500/10` - Warning box background
- `border-amber-500/30` - Warning box border
- `text-amber-300` - Warning text

**File Selector:**
- `border-gray-700` - Default border
- `border-bitcoin` - Hover/active border
- `bg-bitcoin-subtle` - Hover/active background

**Success:**
- `bg-green-500/20` - Success icon background
- `border-green-500` - Success icon border
- `text-green-400` - Success text

### Typography

- Modal titles: `text-xl font-bold text-white`
- Body text: `text-base text-gray-300`
- Small text: `text-sm text-gray-400`
- Labels: `text-sm font-semibold text-gray-300`

### Button Styles

**Primary (Bitcoin Orange):**
```css
bg-bitcoin hover:bg-bitcoin-hover text-white
py-3 px-6 rounded-lg font-semibold
```

**Destructive (Red):**
```css
bg-red-500 hover:bg-red-600 text-white
py-3 px-6 rounded-lg font-semibold
```

**Warning (Amber):**
```css
bg-amber-500 hover:bg-amber-600 text-white
py-3 px-6 rounded-lg font-semibold
```

**Secondary (Gray):**
```css
bg-gray-800 hover:bg-gray-750 text-gray-300
py-3 px-6 rounded-lg font-semibold
```

---

## Integration Points

### Wallet Setup Screen

**New Tab:** "Import from Backup"

**Location:** After "Import Private Key" tab

**Content:**
- Brief explanation of what gets restored
- Inline file selector (not modal initially)
- After file selection, opens backup password modal

**Code Changes:**
```typescript
// WalletSetup.tsx
type SetupTab = 'create' | 'import' | 'import-key' | 'import-backup';  // Add new tab
```

---

### Settings Screen

**New Section:** "Advanced" (after Security, before About)

**New Button:** "Import Backup & Replace Wallet"

**Button Specs:**
- Full width
- Gray background (not prominent - dangerous action)
- Icon: 📥
- Opens replace warning modal

**Code Changes:**
```typescript
// SettingsScreen.tsx - Add Advanced section
// Add state for import modals
```

---

## Implementation Checklist

### Phase 1: Components (Week 1)

**File Selector:**
- [ ] Drag & drop functionality
- [ ] Browse files button
- [ ] File validation (type, size)
- [ ] Selected file display
- [ ] Error states

**Modals:**
- [ ] FileSelectionModal
- [ ] BackupPasswordModal
- [ ] ImportProgressModal
- [ ] SetWalletPasswordModal
- [ ] ImportSuccessModal
- [ ] ReplaceWarningModal (scenario B)
- [ ] NetworkMismatchWarningModal (conditional)

---

### Phase 2: Integration (Week 1-2)

**Wallet Setup:**
- [ ] Add "Import from Backup" tab
- [ ] Wire up tab content
- [ ] Implement modal flow
- [ ] Handle success (unlock wallet)

**Settings:**
- [ ] Add Advanced section
- [ ] Add import button
- [ ] Wire up replace flow
- [ ] Handle success (return to Settings)

---

### Phase 3: Backend (Week 2)

**Message Handlers:**
- [ ] VALIDATE_BACKUP_FILE
- [ ] DECRYPT_BACKUP
- [ ] IMPORT_WALLET_BACKUP

**Logic:**
- [ ] File validation
- [ ] Decryption (PBKDF2 + AES-256-GCM)
- [ ] Version migration
- [ ] Network validation
- [ ] Data restoration
- [ ] Progress callbacks

---

### Phase 4: Testing (Week 2-3)

**Happy Paths:**
- [ ] Fresh install import
- [ ] Replace existing import
- [ ] Network mismatch acceptance

**Error Scenarios:**
- [ ] Invalid file type
- [ ] Corrupted file
- [ ] Wrong password
- [ ] Version incompatibility
- [ ] Network mismatch rejection

**Edge Cases:**
- [ ] Large wallet (100+ accounts)
- [ ] Empty contacts
- [ ] Multisig accounts
- [ ] Imported private keys

---

### Phase 5: Polish (Week 3)

**Visual:**
- [ ] Modal animations
- [ ] Success icon animation
- [ ] Progress bar transitions
- [ ] Drag-drop visual feedback

**Accessibility:**
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Focus management

**Responsive:**
- [ ] Mobile layout
- [ ] Tablet layout
- [ ] Desktop layout

---

## Key Design Decisions

### Why Two Scenarios?

**Fresh install** is simple and safe. **Replace existing** is destructive and scary. They need different entry points, warnings, and flows.

### Why No Merge?

All-or-nothing import is simpler, clearer, and avoids complex conflict resolution. Selective restore can be added in Post-MVP.

### Why Separate Wallet Password?

Backup password is for file encryption. Wallet password is for daily unlock. They serve different purposes and user may want different passwords.

### Why Drag & Drop?

Modern UX pattern, clear visual feedback, works well with fallback browse button. Expected by users.

### Why Network Mismatch Warning?

Mainnet vs testnet is CRITICAL. User must consciously confirm network change to prevent accidental loss of funds.

---

## Success Criteria

Import flow is successful if:

- ✓ User can import backup from Wallet Setup (fresh install)
- ✓ User can replace wallet from Settings
- ✓ Clear warnings for destructive actions
- ✓ All accounts restored correctly
- ✓ All contacts restored correctly
- ✓ All settings restored correctly
- ✓ Network mismatch handled gracefully
- ✓ All error scenarios have clear messages
- ✓ Import completes in <30 seconds
- ✓ Accessibility compliant (WCAG AA)
- ✓ Works on mobile and desktop
- ✓ No data loss scenarios

---

## Next Steps

1. **Frontend Developer**: Review UX spec, implement modals and integration points
2. **Backend Developer**: Implement import message handlers and logic
3. **Testing Expert**: Write unit tests for validation and import logic
4. **QA Engineer**: Create manual test plan for both scenarios
5. **Security Expert**: Review password handling and decryption
6. **Blockchain Expert**: Review address restoration (already approved in PRD)

---

## Quick Links

**Full Documentation:**
- Complete UX Spec: `WALLET_BACKUP_IMPORT_UX_SPEC.md`
- Visual Guide: `WALLET_BACKUP_IMPORT_VISUAL_GUIDE.md`
- Product Requirements: `WALLET_BACKUP_RESTORE_PRD.md`
- Export UX (reference): `ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md`

**Related Code:**
- Wallet Setup: `src/tab/components/WalletSetup.tsx`
- Settings: `src/tab/components/SettingsScreen.tsx`
- Export Modals (reference): `src/tab/components/modals/ExportBackupModals.tsx`

**Backend:**
- Backup Manager: `src/background/wallet/BackupManager.ts`
- Message Handlers: `src/background/messageHandlers.ts`

---

**Document Status:** ✅ Complete - Ready for Implementation

**Total Design Documentation:** 26,000+ words across 3 documents

**Estimated Implementation Time:** 3-4 weeks (parallel with backend development)

---

**End of Summary**
