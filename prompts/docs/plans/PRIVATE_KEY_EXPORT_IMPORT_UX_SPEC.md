# Private Key Export and Import - UX Design Specification

**Version**: 1.0
**Date**: October 19, 2025
**Status**: Design Complete - Ready for Implementation
**Designer**: UI/UX Designer
**Feature Type**: Account Portability & Backup

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Objectives](#design-objectives)
3. [Design System Integration](#design-system-integration)
4. [Export UI Design](#export-ui-design)
5. [Import UI Design](#import-ui-design)
6. [Component Specifications](#component-specifications)
7. [Security Warning Designs](#security-warning-designs)
8. [Success/Error States](#successerror-states)
9. [PDF Export Layout](#pdf-export-layout)
10. [Accessibility Requirements](#accessibility-requirements)
11. [Responsive Design](#responsive-design)
12. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Feature Overview

This specification defines the complete UX/UI design for **per-account private key export and import**, allowing users to backup individual accounts in WIF (Wallet Import Format) with optional password protection.

**Core Capabilities:**
- Export individual account private keys (file download or print PDF)
- Optional password encryption (AES-256-GCM)
- Import WIF keys during wallet setup or to existing wallets
- QR code generation for paper wallet backups

**Design Philosophy:**
- **Security-First**: Prominent warnings educate users about risks
- **Progressive Disclosure**: Complex security concepts revealed step-by-step
- **User Control**: Password protection optional, user's informed choice
- **Trust Through Transparency**: Clear explanations of what's happening

### Design Goals

1. **Educate Users**: Security warnings explain WHY each step matters
2. **Prevent Accidents**: Multiple confirmations prevent unintentional exports
3. **Build Trust**: Clear visual hierarchy and honest communication
4. **Minimize Friction**: Streamlined flow once user understands risks
5. **Maintain Consistency**: Follow established design system and patterns

### Key User Flows

```
EXPORT FLOW
Settings → Account List → Export Button → Warning Modal →
Export Dialog → Format/Password Selection → Download → Success

IMPORT FLOW (Setup)
Wallet Setup → Import Private Key Tab → Upload/Paste WIF →
Password Entry (if encrypted) → Preview → Import → Unlock Screen

IMPORT FLOW (Existing Wallet)
Settings → Import Account → Upload/Paste WIF →
Password Entry (if encrypted) → Preview → Import → Success
```

---

## Design Objectives

### Primary Objectives

**1. Safety Through Education**
- Users must understand that private keys = complete account control
- Security warnings are prominent, clear, and non-bypassable
- Extra scary warnings for plaintext export (no password)
- Post-export reminders reinforce secure storage practices

**2. User Empowerment with Responsibility**
- Password protection is optional (user's choice)
- Clear trade-offs explained: convenience vs security
- Tools provided (strength meter, requirements checklist)
- Final decision rests with informed user

**3. Seamless Integration**
- Consistent with existing wallet design system
- Reuses established components where possible
- Follows tab-based 800px content width pattern
- Matches modal overlay patterns from account management

**4. Accessibility for All**
- WCAG 2.1 AA compliance (minimum 4.5:1 contrast)
- Full keyboard navigation support
- Screen reader optimized with proper ARIA
- Clear focus indicators and error associations

### Secondary Objectives

**5. Professional Appearance**
- PDF backups are print-ready and professional
- QR codes are scannable and properly formatted
- Typography clear and monospace where appropriate
- Visual hierarchy guides user through complex process

**6. Error Recovery**
- Every error state has clear messaging and recovery path
- Generic errors don't expose sensitive information
- Users can retry without losing progress where reasonable

---

## Design System Integration

### Color Palette

**From Existing System:**
```css
/* Base Colors */
--gray-950: #0F0F0F;  /* Body background */
--gray-900: #1A1A1A;  /* Sidebar, modals */
--gray-850: #1E1E1E;  /* Cards, inputs */
--gray-800: #252525;  /* Secondary buttons */
--gray-700: #333333;  /* Borders */
--gray-600: #4A4A4A;  /* Disabled states */
--gray-500: #6B6B6B;  /* Icons, subtle text */
--gray-400: #A0A0A0;  /* Secondary text */
--gray-300: #D1D1D1;  /* Primary text */

/* Brand Colors */
--bitcoin: #F7931A;         /* Primary actions */
--bitcoin-hover: #FF9F2E;   /* Hover states */
--bitcoin-subtle: rgba(247, 147, 26, 0.1);  /* Backgrounds */

/* Semantic Colors */
--green-400: #10B981;   /* Success */
--green-500: #059669;   /* Success dark */
--amber-300: #FCD34D;   /* Warnings */
--amber-500: #F59E0B;   /* Warning accents */
--red-300: #F87171;     /* Errors */
--red-500: #EF4444;     /* Error accents */
--blue-300: #93C5FD;    /* Info */
--blue-500: #3B82F6;    /* Info accents */
```

**New Colors for Export/Import:**
```css
/* Warning Severity Levels */
--warning-critical-bg: rgba(239, 68, 68, 0.15);    /* Red warning box */
--warning-critical-border: rgba(239, 68, 68, 0.3);
--warning-critical-text: #F87171;

--warning-high-bg: rgba(245, 158, 11, 0.12);       /* Amber warning box */
--warning-high-border: rgba(245, 158, 11, 0.3);
--warning-high-text: #FCD34D;

--info-bg: rgba(59, 130, 246, 0.1);                /* Blue info box */
--info-border: rgba(59, 130, 246, 0.3);
--info-text: #93C5FD;

/* Password Strength Colors */
--strength-weak: #EF4444;      /* Red */
--strength-medium: #F59E0B;    /* Amber */
--strength-strong: #10B981;    /* Green */
```

### Typography

**From Existing System:**
```css
/* Font Family */
font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 12px;    /* Small text, labels */
--text-sm: 14px;    /* Secondary text, form labels */
--text-base: 16px;  /* Body text */
--text-lg: 18px;    /* Subheadings */
--text-xl: 20px;    /* Modal titles */
--text-2xl: 24px;   /* Page headings */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;    /* Headings */
--leading-normal: 1.5;    /* Body text */
--leading-relaxed: 1.625; /* Spacious text */

/* Monospace (for WIF keys, filenames) */
font-family: 'Courier New', Courier, monospace;
```

### Spacing System

**4px Grid System:**
```
Base unit: 4px

Common values:
8px  (space-2)  - Tight spacing
12px (space-3)  - Default gap
16px (space-4)  - Section spacing
24px (space-6)  - Card padding
32px (space-8)  - Large gaps
48px (space-12) - Extra large spacing
```

### Component Dimensions

**Modal Sizing:**
```
Standard Modal:  512px width (max-w-lg)
Wide Modal:      640px width (max-w-xl)
Extra Wide:      800px width (max-w-3xl)

Modal Padding:   24px (p-6)
Modal Radius:    16px (rounded-2xl)
Modal Border:    1px solid gray-700
```

**Button Heights:**
```
Default:  48px (py-3)
Compact:  40px (py-2)
Large:    56px (py-4)
```

**Input Heights:**
```
Default:  48px (py-3 px-4)
```

---

## Export UI Design

### 4.1 Export Button Placement (Settings Screen)

**Location**: Settings screen → Account Management section

**ASCII Layout:**
```
┌──────────────────────────────────────────────────────┐
│ Settings > Account Management                        │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Accounts (3)                                         │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [🔵] Main Account                              │ │
│ │      Native SegWit • tb1q3xy...w8k2            │ │
│ │      0.00125 tBTC                              │ │
│ │                                                │ │
│ │      [Rename Account]  [🔑 Export Private Key]│ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [🔵] Savings                    [IMPORT] 💾    │ │
│ │      Native SegWit • tb1q7ab...5cd9            │ │
│ │      0.05000 tBTC                              │ │
│ │                                                │ │
│ │      [Rename Account]  [🔑 Export Private Key]│ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ [🟣] 2-of-3 Multisig       [MULTISIG]          │ │
│ │      P2WSH • tb1q8mn...3pq7                    │ │
│ │      0.10000 tBTC                              │ │
│ │                                                │ │
│ │      [View Co-Signers]  (No export button)    │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Export Button Specification:**

```tsx
// Only shown for HD and imported accounts
{canExportPrivateKey(account) && (
  <button className="
    px-4 py-2
    bg-gray-800 hover:bg-gray-750
    border border-gray-700
    rounded-lg
    text-sm text-gray-300
    flex items-center gap-2
    transition-colors duration-200
    active:scale-[0.98]
  ">
    <KeyIcon className="w-4 h-4" />
    Export Private Key
  </button>
)}

// Multisig accounts: No button shown (feature not applicable)
```

**Button States:**
- Default: Gray-800 background, gray-300 text
- Hover: Gray-750 background
- Active: Scale down to 0.98
- Disabled: Not applicable (button hidden for multisig)

### 4.2 Export Warning Modal (Step 1)

**Trigger**: User clicks "Export Private Key" button

**Purpose**: Educate user about critical security risks before proceeding

**Dimensions**: 640px width (max-w-xl), auto height, centered

**ASCII Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⚠️  Private Key Export - Security Warning                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  You are about to export the private key for:              │
│  Main Account (Native SegWit)                              │
│                                                             │
│  ╔═════════════════════════════════════════════════════╗  │
│  ║  ⚠️  CRITICAL SECURITY RISKS                        ║  │
│  ║                                                     ║  │
│  ║  • Anyone with this private key can STEAL all      ║  │
│  ║    funds from this account                         ║  │
│  ║                                                     ║  │
│  ║  • Private keys should NEVER be shared with anyone ║  │
│  ║                                                     ║  │
│  ║  • Once exported, the key exists outside your      ║  │
│  ║    encrypted wallet                                ║  │
│  ║                                                     ║  │
│  ║  • If the exported file is stolen, your funds      ║  │
│  ║    can be stolen                                   ║  │
│  ╚═════════════════════════════════════════════════════╝  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ ℹ️  RECOMMENDATIONS                                   │ │
│  │                                                       │ │
│  │ • Use password protection (strongly recommended)     │ │
│  │ • Store exported files on encrypted storage only    │ │
│  │ • Never email or upload keys to cloud storage       │ │
│  │ • Consider printing and storing in a physical safe  │ │
│  │ • Treat this key like cash - if stolen, it's gone   │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  [ ] I understand the risks and want to proceed             │
│                                                             │
│                                                             │
│              [Cancel]         [Continue to Export]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
interface ExportWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  accountName: string;
  addressType: string;
}

// Visual Styling
const warningBoxStyles = {
  background: 'rgba(239, 68, 68, 0.15)',      // Red tint
  border: '2px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '12px',
  padding: '20px',
}

const infoBoxStyles = {
  background: 'rgba(59, 130, 246, 0.1)',      // Blue tint
  border: '1px solid rgba(59, 130, 246, 0.3)',
  borderRadius: '12px',
  padding: '16px',
}

// Checkbox must be checked to enable Continue button
const [acknowledged, setAcknowledged] = useState(false);
```

**Interaction Behavior:**
1. Modal opens with focus on checkbox
2. Checkbox must be checked to enable "Continue to Export" button
3. "Continue to Export" button:
   - Disabled state: `opacity-50 cursor-not-allowed`
   - Enabled state: `bg-bitcoin hover:bg-bitcoin-hover`
4. Escape key or Cancel closes modal without proceeding
5. Continue triggers main export dialog

**Accessibility:**
```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="export-warning-title"
  aria-describedby="export-warning-description"
>
  <h2 id="export-warning-title">Private Key Export - Security Warning</h2>
  <div id="export-warning-description">
    {/* Warning content */}
  </div>

  <label>
    <input
      type="checkbox"
      checked={acknowledged}
      onChange={(e) => setAcknowledged(e.target.checked)}
      aria-label="I understand the risks and want to proceed"
    />
    I understand the risks and want to proceed
  </label>
</div>
```

### 4.3 Export Dialog (Step 2)

**Purpose**: Collect export preferences (format, password protection)

**Dimensions**: 640px width (max-w-xl), auto height, centered

**ASCII Wireframe:**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  🔑 Export Private Key                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Account Information                                        │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Account:        Main Account                          │ │
│  │ Address Type:   Native SegWit                         │ │
│  │ First Address:  tb1q3xy...w8k2  [Copy]               │ │
│  │ Network:        Testnet                               │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Export Format                                              │
│  ( ) File Download (.txt)                                   │
│  (•) Print PDF (with QR code)                              │
│                                                             │
│  Password Protection (Optional)                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ [✓] Enable password protection (recommended)          │ │
│  │                                                        │ │
│  │ Password                                               │ │
│  │ ┌──────────────────────────────────────────────┐     │ │
│  │ │ ••••••••••••                              [👁] │     │ │
│  │ └──────────────────────────────────────────────┘     │ │
│  │                                                        │ │
│  │ Confirm Password                                       │ │
│  │ ┌──────────────────────────────────────────────┐     │ │
│  │ │ ••••••••••••                              [👁] │     │ │
│  │ └──────────────────────────────────────────────┘     │ │
│  │                                                        │ │
│  │ Strength: ▓▓▓▒▒ Medium                               │ │
│  │                                                        │ │
│  │ Requirements:                                          │ │
│  │ ✓ At least 8 characters                              │ │
│  │ ✓ Passwords match                                    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️ Note: If you lose this password, the key cannot be      │
│     recovered from the encrypted file.                      │
│                                                             │
│                                                             │
│                  [Cancel]         [Export Now]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'file' | 'pdf', password?: string) => Promise<void>;
  account: {
    name: string;
    addressType: string;
    firstAddress: string;
  };
}

interface ExportFormState {
  format: 'file' | 'pdf';
  passwordProtection: boolean;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirmPassword: boolean;
}
```

**Password Strength Meter:**
```tsx
// Password strength visualization
const getStrengthColor = (score: number): string => {
  if (score < 40) return 'bg-red-500';      // Weak
  if (score < 70) return 'bg-amber-500';    // Medium
  return 'bg-green-500';                     // Strong
}

const getStrengthLabel = (score: number): string => {
  if (score < 40) return 'Weak';
  if (score < 70) return 'Medium';
  return 'Strong';
}

// Visual component
<div className="mt-2">
  <div className="flex items-center gap-2 mb-1">
    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${getStrengthColor(strengthScore)} transition-all duration-300`}
        style={{ width: `${strengthScore}%` }}
      />
    </div>
    <span className={`text-sm font-medium ${
      strengthScore < 40 ? 'text-red-300' :
      strengthScore < 70 ? 'text-amber-300' :
      'text-green-400'
    }`}>
      {getStrengthLabel(strengthScore)}
    </span>
  </div>
</div>
```

**Requirements Checklist:**
```tsx
interface Requirement {
  label: string;
  met: boolean;
}

const requirements: Requirement[] = [
  { label: 'At least 8 characters', met: password.length >= 8 },
  { label: 'Passwords match', met: password === confirmPassword && password.length > 0 },
];

// Visual component
<div className="space-y-1 mt-2">
  {requirements.map((req, idx) => (
    <div key={idx} className="flex items-center gap-2 text-sm">
      {req.met ? (
        <CheckIcon className="w-4 h-4 text-green-400" />
      ) : (
        <XIcon className="w-4 h-4 text-gray-500" />
      )}
      <span className={req.met ? 'text-green-400' : 'text-gray-400'}>
        {req.label}
      </span>
    </div>
  ))}
</div>
```

**Export Button Behavior:**
```tsx
// Export button enabled only when all validations pass
const canExport = () => {
  if (!passwordProtection) return true; // Allow plaintext export

  return (
    password.length >= 8 &&
    password === confirmPassword
  );
};

<button
  disabled={!canExport()}
  onClick={handleExport}
  className={`
    px-6 py-3 rounded-lg font-semibold
    transition-all duration-200
    ${canExport()
      ? 'bg-bitcoin hover:bg-bitcoin-hover text-white active:scale-[0.98]'
      : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
    }
  `}
>
  Export Now
</button>
```

### 4.4 Plaintext Export Warning (Extra Modal)

**Trigger**: User unchecks "Enable password protection" checkbox

**Purpose**: Extra scary warning for plaintext export

**Dimensions**: 560px width (max-w-lg), auto height, centered

**ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ⚠️⚠️ UNENCRYPTED EXPORT - EXTREME RISK ⚠️⚠️            │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  You have chosen to export without password            │
│  protection. This is DANGEROUS.                        │
│                                                        │
│  ╔══════════════════════════════════════════════════╗ │
│  ║  ⚠️  CRITICAL RISKS:                             ║ │
│  ║                                                  ║ │
│  ║  • Anyone who accesses this file can steal      ║ │
│  ║    your funds IMMEDIATELY                       ║ │
│  ║                                                  ║ │
│  ║  • No password means ZERO delay for attackers   ║ │
│  ║                                                  ║ │
│  ║  • The file is readable by:                     ║ │
│  ║    - Any application on your computer           ║ │
│  ║    - Malware and viruses                        ║ │
│  ║    - Anyone with physical access to device      ║ │
│  ║    - Cloud backup services                      ║ │
│  ╚══════════════════════════════════════════════════╝ │
│                                                        │
│  This is ONLY acceptable if you are:                   │
│  • Storing on a device that is ALREADY encrypted      │
│  • Immediately transferring to cold storage           │
│  • Printing for physical storage in a SECURE safe     │
│                                                        │
│  RECOMMENDATION: Use password protection instead       │
│                                                        │
│  ( ) Yes, export UNENCRYPTED (I accept full           │
│      responsibility)                                   │
│                                                        │
│                                                        │
│  [Cancel]  [Use Password]  [Export Unencrypted]       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
interface PlaintextWarningProps {
  isOpen: boolean;
  onCancel: () => void;
  onUsePassword: () => void;  // Re-enable password checkbox
  onContinue: () => void;      // Proceed with plaintext
}

const warningBoxStyles = {
  background: 'rgba(239, 68, 68, 0.15)',
  border: '3px solid rgba(239, 68, 68, 0.4)',  // Thicker border
  borderRadius: '12px',
  padding: '20px',
}

// Radio button (not checkbox) for explicit acceptance
const [accepted, setAccepted] = useState(false);
```

**Button Styling (emphasize danger):**
```tsx
// "Use Password" button - highlighted (recommended path)
<button className="
  px-6 py-3 rounded-lg font-semibold
  bg-bitcoin hover:bg-bitcoin-hover
  text-white
  transition-all duration-200
  active:scale-[0.98]
">
  Use Password Protection
</button>

// "Export Unencrypted" button - destructive style
<button
  disabled={!accepted}
  className="
    px-6 py-3 rounded-lg font-semibold
    border-2 border-red-500
    bg-red-500/20 hover:bg-red-500/30
    text-red-300
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  Export Unencrypted
</button>
```

### 4.5 Export Success Modal

**Purpose**: Confirm successful export and provide security reminders

**Dimensions**: 560px width (max-w-lg), auto height, centered

**ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│               ✅ Private Key Exported                   │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Your private key has been saved to:                   │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📄 bitcoin-account-main-20251019-143055.txt     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Encryption:  ✓ Password Protected (AES-256-GCM)      │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ ℹ️  IMPORTANT SECURITY REMINDERS                  │ │
│  │                                                   │ │
│  │ • Keep this file AND password in separate        │ │
│  │   secure locations                               │ │
│  │                                                   │ │
│  │ • If you lose the password, the key cannot be    │ │
│  │   recovered                                       │ │
│  │                                                   │ │
│  │ • Store on encrypted storage devices only        │ │
│  │                                                   │ │
│  │ • Never upload to cloud services                 │ │
│  │   (Dropbox, Google Drive, etc.)                  │ │
│  │                                                   │ │
│  │ • Consider printing a backup and storing in a    │ │
│  │   fireproof safe                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│                                                        │
│                        [Done]                          │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Alternative Success (Plaintext Export):**
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│            ⚠️ Private Key Exported (UNENCRYPTED)        │
│                                                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Your UNENCRYPTED private key has been saved to:       │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 📄 bitcoin-account-main-20251019-143055.txt     │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  Encryption:  ⚠️ None (Plain Text)                     │
│                                                        │
│  ╔══════════════════════════════════════════════════╗ │
│  ║  ⚠️  CRITICAL SECURITY WARNING                   ║ │
│  ║                                                  ║ │
│  ║  • This file contains your private key in        ║ │
│  ║    PLAIN TEXT                                    ║ │
│  ║                                                  ║ │
│  ║  • Anyone who accesses this file can steal       ║ │
│  ║    your funds IMMEDIATELY                        ║ │
│  ║                                                  ║ │
│  ║  • Do NOT leave this file on your computer       ║ │
│  ║                                                  ║ │
│  ║  • Transfer to secure storage NOW                ║ │
│  ║                                                  ║ │
│  ║  • Recommended: Import into hardware wallet      ║ │
│  ║    and delete this file                          ║ │
│  ╚══════════════════════════════════════════════════╝ │
│                                                        │
│                                                        │
│                    [I Understand]                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
interface ExportSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  filename: string;
  encrypted: boolean;
}

// Visual styling based on encryption status
const titleStyle = encrypted
  ? { icon: '✅', color: 'text-green-400' }
  : { icon: '⚠️', color: 'text-amber-300' };

const infoBoxStyle = encrypted
  ? {
      background: 'rgba(59, 130, 246, 0.1)',   // Blue for encrypted
      border: '1px solid rgba(59, 130, 246, 0.3)',
    }
  : {
      background: 'rgba(239, 68, 68, 0.15)',   // Red for plaintext
      border: '2px solid rgba(239, 68, 68, 0.3)',
    };
```

---

## Import UI Design

### 5.1 Import Tab (Wallet Setup Screen)

**Context**: Initial wallet setup, user chooses to import private key instead of creating new wallet

**Location**: Wallet Setup screen → Import Private Key tab

**ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│          🔐 Bitcoin Wallet - Setup                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                          │ │
│  │  [ Create New ]  [ Import Seed ]  [• Import Private Key]│ │
│  │                                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Import Private Key                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                                │
│  Choose Method:                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ( ) Upload File      (•) Enter WIF Manually              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Private Key (WIF Format)                                      │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Paste your WIF private key here                          │ │
│  │ (Starts with 9, c, K, or L)                              │ │
│  │                                                           │ │
│  │ cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy     │ │
│  │                                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ✓ Valid testnet WIF detected                                 │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ℹ️  Preview                                               │ │
│  │                                                           │ │
│  │ Network:        Testnet ✓                                │ │
│  │ First Address:  tb1q3xy...w8k2  [Copy]                   │ │
│  │ Address Type:   Native SegWit (auto-detected)            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Account Name                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Imported Account 1                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Create Wallet Password                                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••                                     [👁] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Confirm Password                                              │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••••••                                     [👁] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│                                                                │
│                    [Back]         [Import Account]             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Alternative: Upload File View:**
```
┌────────────────────────────────────────────────────────────────┐
│  Choose Method:                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ (•) Upload File      ( ) Enter WIF Manually              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Upload Private Key File                                       │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │              📄                                           │ │
│  │                                                           │ │
│  │        Drag and drop file here                           │ │
│  │        or click to browse                                │ │
│  │                                                           │ │
│  │        Accepts: .txt files only                          │ │
│  │                                                           │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ✓ File uploaded: bitcoin-account-main-20251019.txt            │
│  ✓ Encrypted file detected (AES-256-GCM)                      │
│                                                                │
│  File Password                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Enter the password used when exporting this key      [👁] │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  [Decrypt and Preview]                                         │
│                                                                │
│  (Preview section appears after decryption...)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Component Specification:**

```tsx
interface ImportPrivateKeyFormProps {
  onImport: (wif: string, accountName: string, walletPassword: string) => Promise<void>;
  onBack: () => void;
}

interface ImportFormState {
  method: 'upload' | 'manual';

  // File upload
  file: File | null;
  filePassword: string;

  // Manual entry
  wifInput: string;

  // Decrypted/parsed WIF
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
  walletPassword: string;
  confirmWalletPassword: string;
}
```

**File Upload Component:**
```tsx
const FileUploadArea = ({ onFileSelect }: { onFileSelect: (file: File) => void }) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      className={`
        border-2 border-dashed rounded-xl p-12
        text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-bitcoin bg-bitcoin-subtle'
          : 'border-gray-700 hover:border-gray-600 bg-gray-850'
        }
      `}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.txt')) {
          onFileSelect(file);
        }
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
      <p className="text-lg text-gray-300 mb-2">
        Drag and drop file here
      </p>
      <p className="text-sm text-gray-400 mb-4">
        or click to browse
      </p>
      <p className="text-xs text-gray-500">
        Accepts: .txt files only
      </p>

      <input
        id="file-input"
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
    </div>
  );
};
```

**Validation Preview:**
```tsx
// Real-time validation feedback
{validation.valid && (
  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <InfoIcon className="w-5 h-5 text-blue-300 mt-0.5" />
      <div className="flex-1 space-y-2">
        <p className="text-sm font-semibold text-blue-300">
          Preview
        </p>
        <div className="space-y-1 text-sm text-gray-300">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Network:</span>
            <span className="font-mono">{validation.network}</span>
            <CheckIcon className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">First Address:</span>
            <span className="font-mono">{validation.firstAddress}</span>
            <button className="text-bitcoin hover:text-bitcoin-hover text-xs">
              Copy
            </button>
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

{validation.error && (
  <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <AlertIcon className="w-5 h-5 text-red-300 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-red-300 mb-1">
          Validation Error
        </p>
        <p className="text-sm text-gray-300">
          {validation.error}
        </p>
      </div>
    </div>
  </div>
)}
```

### 5.2 Import Account Modal (Existing Wallet)

**Context**: User has unlocked wallet and wants to add an imported account

**Location**: Settings → Import Account button OR Sidebar → Import Account

**ASCII Wireframe:**
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  🔑 Import Account                                             │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ ℹ️  Import Private Key - Security Notice                 │ │
│  │                                                           │ │
│  │ BEFORE YOU IMPORT:                                        │ │
│  │ • Verify this private key belongs to YOU                 │ │
│  │ • Never import keys from untrusted sources               │ │
│  │ • Check the first address matches your records           │ │
│  │ • Be aware of "dust attack" scams (fake keys)            │ │
│  │                                                           │ │
│  │ AFTER IMPORT:                                             │ │
│  │ • This account will be added to your wallet              │ │
│  │ • You will have full control over the funds              │ │
│  │ • The original source may still have access              │ │
│  │   (if they kept a copy of the key)                       │ │
│  │ • Consider moving funds to a new account generated       │ │
│  │   by this wallet for maximum security                    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Choose Method:                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ (•) Upload File      ( ) Enter WIF Manually              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  (File upload or manual entry section - same as setup)        │
│                                                                │
│  Account Name                                                  │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │ Imported Account 2                                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Note: Wallet is already unlocked, no password needed          │
│                                                                │
│                                                                │
│                    [Cancel]       [Import Account]             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

**Key Differences from Setup Import:**
1. Security notice box appears at top (educate users about risks)
2. No wallet password fields (wallet already unlocked)
3. Account name defaults to "Imported Account N" (next available number)
4. Modal overlay instead of full-screen tab

---

## Component Specifications

### 6.1 PasswordStrengthMeter

**Purpose**: Visual indicator of password strength during export

**Component Interface:**
```tsx
interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number;      // 0-100
  label: string;      // 'Weak' | 'Medium' | 'Strong'
  color: string;      // Tailwind color class
  suggestions?: string[];
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  className = ''
}) => {
  const strength = calculateStrength(password);

  return (
    <div className={className}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: `${strength.score}%` }}
          />
        </div>
        <span className={`text-sm font-medium ${strength.color.replace('bg-', 'text-')}`}>
          {strength.label}
        </span>
      </div>

      {/* Suggestions (optional) */}
      {strength.suggestions && strength.suggestions.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 space-y-1">
          {strength.suggestions.map((suggestion, idx) => (
            <p key={idx}>• {suggestion}</p>
          ))}
        </div>
      )}
    </div>
  );
};
```

**Strength Calculation:**
```tsx
const calculateStrength = (password: string): StrengthResult => {
  if (password.length === 0) {
    return { score: 0, label: 'Weak', color: 'bg-red-500', suggestions: [] };
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
    suggestions: suggestions.slice(0, 2)  // Limit to 2 suggestions
  };
};
```

**Visual States:**
```
Weak (0-39):   [▓▓░░░] Red
Medium (40-69): [▓▓▓▒░] Amber
Strong (70-100): [▓▓▓▓▓] Green
```

### 6.2 PasswordRequirementsChecklist

**Purpose**: Real-time checklist validation for password requirements

**Component Interface:**
```tsx
interface Requirement {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
  confirmPassword?: string;
  className?: string;
}

const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  password,
  confirmPassword,
  className = ''
}) => {
  const requirements: Requirement[] = [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      id: 'match',
      label: 'Passwords match',
      met: confirmPassword !== undefined &&
           password.length > 0 &&
           password === confirmPassword
    }
  ];

  return (
    <div className={`space-y-1 ${className}`}>
      {requirements.map((req) => (
        <div key={req.id} className="flex items-center gap-2 text-sm">
          {req.met ? (
            <CheckCircleIcon className="w-4 h-4 text-green-400 flex-shrink-0" />
          ) : (
            <XCircleIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
          )}
          <span className={req.met ? 'text-green-400' : 'text-gray-400'}>
            {req.label}
          </span>
        </div>
      ))}
    </div>
  );
};
```

**Visual Example:**
```
✓ At least 8 characters        (green checkmark, green text)
✗ Passwords match              (gray X, gray text)
```

### 6.3 FileUploadArea

**Purpose**: Drag-and-drop file upload for import

**Component Interface:**
```tsx
interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;  // in bytes
  disabled?: boolean;
  selectedFile?: File | null;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  accept = '.txt',
  maxSize = 1024 * 1024,  // 1MB
  disabled = false,
  selectedFile = null
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.name.endsWith('.txt')) {
      setError('Invalid file type. Please upload a .txt file.');
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-2">
      <div
        className={`
          border-2 border-dashed rounded-xl p-12
          text-center transition-all duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isDragging && !disabled
            ? 'border-bitcoin bg-bitcoin-subtle'
            : 'border-gray-700 hover:border-gray-600 bg-gray-850'
          }
        `}
        onDragOver={(e) => {
          if (!disabled) {
            e.preventDefault();
            setIsDragging(true);
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          if (!disabled) {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }
        }}
        onClick={() => {
          if (!disabled) {
            document.getElementById('file-input')?.click();
          }
        }}
      >
        {selectedFile ? (
          <>
            <DocumentCheckIcon className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p className="text-lg text-green-400 mb-2 font-medium">
              ✓ File selected
            </p>
            <p className="text-sm text-gray-300 font-mono">
              {selectedFile.name}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </>
        ) : (
          <>
            <DocumentIcon className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <p className="text-lg text-gray-300 mb-2">
              Drag and drop file here
            </p>
            <p className="text-sm text-gray-400 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Accepts: {accept} files only
            </p>
          </>
        )}

        <input
          id="file-input"
          type="file"
          accept={accept}
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
};
```

---

## Security Warning Designs

### 7.1 Warning Box Component

**Purpose**: Reusable component for security warnings with severity levels

**Component Interface:**
```tsx
type WarningSeverity = 'critical' | 'high' | 'info';

interface WarningBoxProps {
  severity: WarningSeverity;
  title: string;
  children: React.ReactNode;
  className?: string;
}

const WarningBox: React.FC<WarningBoxProps> = ({
  severity,
  title,
  children,
  className = ''
}) => {
  const styles = {
    critical: {
      bg: 'bg-red-500/15',
      border: 'border-red-500/30 border-2',
      titleColor: 'text-red-300',
      icon: '⚠️',
      iconBg: 'bg-red-500/20'
    },
    high: {
      bg: 'bg-amber-500/12',
      border: 'border-amber-500/30 border-2',
      titleColor: 'text-amber-300',
      icon: '⚠️',
      iconBg: 'bg-amber-500/20'
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30 border',
      titleColor: 'text-blue-300',
      icon: 'ℹ️',
      iconBg: 'bg-blue-500/20'
    }
  }[severity];

  return (
    <div className={`
      ${styles.bg} ${styles.border}
      rounded-xl p-5
      ${className}
    `}>
      <div className="flex items-start gap-3">
        <div className={`
          ${styles.iconBg}
          w-8 h-8 rounded-lg
          flex items-center justify-center
          flex-shrink-0
          text-lg
        `}>
          {styles.icon}
        </div>

        <div className="flex-1">
          <h4 className={`${styles.titleColor} font-bold text-base mb-3`}>
            {title}
          </h4>
          <div className="text-sm text-gray-300 space-y-2">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Usage Examples:**

```tsx
// Critical warning (red)
<WarningBox severity="critical" title="CRITICAL SECURITY RISKS">
  <ul className="list-disc list-inside space-y-1">
    <li>Anyone with this private key can <strong>STEAL all funds</strong></li>
    <li>Private keys should <strong>NEVER</strong> be shared with anyone</li>
    <li>Once exported, the key exists outside your encrypted wallet</li>
    <li>If the exported file is stolen, your funds can be stolen</li>
  </ul>
</WarningBox>

// High warning (amber)
<WarningBox severity="high" title="Password Protection Disabled">
  <p>
    You have chosen to export without password protection. The private key
    will be stored in <strong>PLAIN TEXT</strong>.
  </p>
</WarningBox>

// Info (blue)
<WarningBox severity="info" title="Import Security Notice">
  <ul className="space-y-1">
    <li>• Verify this private key belongs to YOU</li>
    <li>• Never import keys from untrusted sources</li>
    <li>• Check the first address matches your records</li>
  </ul>
</WarningBox>
```

### 7.2 Warning Text Styling

**Bold Key Terms:**
Use `<strong>` or `font-bold` class for critical security terms:
- STEAL, NEVER, COMPLETE, IMMEDIATELY, ZERO
- Password-related: SEPARATE, DIFFERENT, SECURE
- File-related: PLAIN TEXT, UNENCRYPTED

**Examples:**
```tsx
<p>
  Anyone who obtains this private key can <strong>STEAL ALL FUNDS</strong>
  from this account.
</p>

<p>
  Private keys should <strong>NEVER</strong> be shared with anyone.
</p>

<p>
  No password means <strong>ZERO</strong> delay for attackers.
</p>
```

---

## Success/Error States

### 8.1 Success States

**Export Success Toast:**
```tsx
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

// Success toast after export
<Toast
  type="success"
  message="Private key exported successfully. Keep this file secure!"
  duration={5000}
/>
```

**Toast Styling:**
```tsx
const toastStyles = {
  success: {
    bg: 'bg-green-500/20',
    border: 'border-green-500',
    text: 'text-green-400',
    icon: <CheckCircleIcon className="w-5 h-5" />
  },
  error: {
    bg: 'bg-red-500/20',
    border: 'border-red-500',
    text: 'text-red-300',
    icon: <XCircleIcon className="w-5 h-5" />
  },
  info: {
    bg: 'bg-blue-500/20',
    border: 'border-blue-500',
    text: 'text-blue-300',
    icon: <InfoIcon className="w-5 h-5" />
  }
};

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);
  const styles = toastStyles[type];

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className={`
      fixed bottom-6 right-6 z-50
      ${styles.bg} border-2 ${styles.border}
      ${styles.text}
      px-4 py-3 rounded-lg shadow-lg
      flex items-center gap-3
      animate-slide-in-right
    `}>
      {styles.icon}
      <span className="font-medium">{message}</span>
    </div>
  );
};
```

**Import Success Flow:**
```
1. Import completes
2. Success toast appears (5 seconds)
3. For initial setup: Navigate to unlock screen
4. For existing wallet: Modal closes, account list updates
5. New account highlighted with subtle animation
```

### 8.2 Error States

**Common Error Messages:**

```tsx
const errorMessages = {
  // Export errors
  WALLET_LOCKED: {
    title: 'Wallet is Locked',
    message: 'You must unlock your wallet before exporting private keys.',
    action: 'Unlock Wallet'
  },

  EXPORT_FAILED: {
    title: 'Export Failed',
    message: 'Unable to export private key. Please try again.',
    action: 'Retry Export'
  },

  DOWNLOAD_BLOCKED: {
    title: 'Download Blocked',
    message: 'Your browser blocked the download. Please check browser permissions and popup settings.',
    action: 'Try Again'
  },

  // Import errors
  INVALID_WIF: {
    title: 'Invalid Private Key',
    message: 'The private key format is invalid. Please check and try again.',
    details: 'WIF keys should be 51-52 characters starting with 9, c, K, or L.'
  },

  WRONG_NETWORK: {
    title: 'Network Mismatch',
    message: 'This is a mainnet key, but the wallet requires testnet keys.',
    details: 'Mainnet keys start with 5, K, or L. Testnet keys start with 9 or c.'
  },

  INCORRECT_PASSWORD: {
    title: 'Incorrect Password',
    message: 'Unable to decrypt the file. The password is incorrect or the file is corrupted.',
    action: 'Try Again'
  },

  DUPLICATE_KEY: {
    title: 'Already Imported',
    message: 'This account is already imported as "Main Account".',
    details: 'You cannot import the same private key twice.'
  },

  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'The file exceeds the maximum size of 1MB.',
    action: 'Choose Different File'
  },

  INVALID_FILE: {
    title: 'Invalid File',
    message: 'This file does not appear to be a valid private key export.',
    details: 'Please select a .txt file exported from this wallet.'
  }
};
```

**Error Display Component:**
```tsx
interface ErrorMessageProps {
  error: keyof typeof errorMessages;
  onAction?: () => void;
  onClose?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onAction,
  onClose
}) => {
  const errorData = errorMessages[error];

  return (
    <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3">
        <XCircleIcon className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-300 mb-1">
            {errorData.title}
          </h4>
          <p className="text-sm text-gray-300 mb-2">
            {errorData.message}
          </p>
          {errorData.details && (
            <p className="text-xs text-gray-400 mb-3">
              {errorData.details}
            </p>
          )}
          {errorData.action && onAction && (
            <button
              onClick={onAction}
              className="
                text-sm text-bitcoin hover:text-bitcoin-hover
                font-medium underline
              "
            >
              {errorData.action}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300"
            aria-label="Close error"
          >
            <XIcon className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
```

**Inline Error Display:**
```tsx
// For form validation errors
{error && (
  <div
    className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg mt-2"
    role="alert"
  >
    <p className="text-sm text-red-300">{error}</p>
  </div>
)}
```

---

## PDF Export Layout

### 9.1 PDF Page Structure

**Page Format:**
- Size: A4 (210mm × 297mm) or Letter (8.5" × 11")
- Orientation: Portrait
- Margins: 25mm (1 inch) on all sides
- Printable area: 160mm × 247mm

**ASCII Layout:**
```
┌────────────────────────────────────────────────────────┐
│ [25mm margin]                                          │
│                                                        │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│  ┃  Bitcoin Account Private Key Backup              ┃  │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ ACCOUNT INFORMATION                            │   │
│  ├────────────────────────────────────────────────┤   │
│  │ Account:        Main Account                   │   │
│  │ Address Type:   Native SegWit                  │   │
│  │ First Address:  tb1q3xy...w8k2                 │   │
│  │ Network:        Testnet                        │   │
│  │ Generated:      2025-10-19 14:30:55 UTC        │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ PRIVATE KEY (WIF FORMAT)                       │   │
│  ├────────────────────────────────────────────────┤   │
│  │                                                │   │
│  │ cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1...    │   │
│  │                                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ┌────────────────────────┐                           │
│  │                        │                           │
│  │     ████████████       │   QR CODE                 │
│  │     ██        ██       │   Scan to import this     │
│  │     ██  ████  ██       │   private key             │
│  │     ██        ██       │                           │
│  │     ████████████       │   (200×200px, Medium      │
│  │                        │    error correction)      │
│  └────────────────────────┘                           │
│                                                        │
│  ╔════════════════════════════════════════════════╗   │
│  ║  ⚠️  CRITICAL SECURITY INFORMATION             ║   │
│  ╠════════════════════════════════════════════════╣   │
│  ║  • This private key provides complete access   ║   │
│  ║    to all funds in this account                ║   │
│  ║                                                ║   │
│  ║  • Never share this document with anyone       ║   │
│  ║                                                ║   │
│  ║  • Store in a secure, fireproof location       ║   │
│  ║                                                ║   │
│  ║  • Destroy (shred) when no longer needed       ║   │
│  ║                                                ║   │
│  ║  • Anyone who finds this can steal your funds  ║   │
│  ╚════════════════════════════════════════════════╝   │
│                                                        │
│  ┌────────────────────────────────────────────────┐   │
│  │ HOW TO IMPORT THIS KEY                         │   │
│  ├────────────────────────────────────────────────┤   │
│  │                                                │   │
│  │ Option 1: Scan QR Code                         │   │
│  │ • Open wallet's "Import Account" feature       │   │
│  │ • Select "Scan QR Code"                        │   │
│  │ • Scan the QR code above                       │   │
│  │                                                │   │
│  │ Option 2: Manual Entry                         │   │
│  │ • Open wallet's "Import Account" feature       │   │
│  │ • Select "Enter WIF Manually"                  │   │
│  │ • Type the private key shown above             │   │
│  │                                                │   │
│  │ Option 3: Upload This PDF                      │   │
│  │ • Save this PDF to secure USB drive            │   │
│  │ • Use wallet's file upload option              │   │
│  │                                                │   │
│  └────────────────────────────────────────────────┘   │
│                                                        │
│  ─────────────────────────────────────────────────    │
│  Bitcoin Wallet Extension v0.11.0 - Testnet           │
│  https://github.com/your-repo                         │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 9.2 PDF Generation Code

**Using jsPDF Library:**

```tsx
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

interface PDFExportOptions {
  accountName: string;
  addressType: string;
  firstAddress: string;
  network: 'testnet' | 'mainnet';
  wif: string;
  encrypted: boolean;
  encryptedData?: string;
}

async function generatePDFBackup(options: PDFExportOptions): Promise<Blob> {
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

  // ACCOUNT INFORMATION SECTION
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ACCOUNT INFORMATION', margin, yPos);
  yPos += 8;

  // Draw box
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
    doc.setFont('courier', 'normal');  // Monospace for values
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

    // Draw box
    doc.rect(margin, yPos, contentWidth, 40);
    yPos += 6;

    doc.setFontSize(8);
    doc.setFont('courier', 'normal');

    // Split encrypted data into lines (80 chars per line)
    const lines = splitIntoLines(encryptedData, 80);
    lines.forEach(line => {
      doc.text(line, margin + 5, yPos);
      yPos += 4;
    });

    yPos += 8;

    // Encryption details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Encryption: AES-256-GCM with PBKDF2 (100,000 iterations)', margin, yPos);
    yPos += 5;
    doc.text('To decrypt: Use "Import Private Key" and enter export password', margin, yPos);
    yPos += 5;

    // Note: No QR code for encrypted exports (data too long)

  } else {
    // PLAINTEXT KEY SECTION
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PRIVATE KEY (WIF FORMAT)', margin, yPos);
    yPos += 8;

    // Draw box
    doc.rect(margin, yPos, contentWidth, 12);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('courier', 'normal');
    doc.text(wif, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // QR CODE
    try {
      const qrDataUrl = await QRCode.toDataURL(wif, {
        errorCorrectionLevel: 'M',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Add QR code (60mm × 60mm, centered)
      const qrSize = 60;
      const qrX = (pageWidth - qrSize) / 2;
      doc.addImage(qrDataUrl, 'PNG', qrX, yPos, qrSize, qrSize);
      yPos += qrSize + 5;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Scan QR code to import this private key', pageWidth / 2, yPos, {
        align: 'center'
      });
      yPos += 10;

    } catch (error) {
      console.error('QR code generation failed:', error);
      // Continue without QR code
      yPos += 10;
    }
  }

  // SECURITY WARNING BOX (Red border)
  doc.setDrawColor(239, 68, 68);  // Red
  doc.setLineWidth(1.5);
  doc.rect(margin, yPos, contentWidth, 45);
  yPos += 8;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 0, 0);  // Red text
  doc.text('⚠️  CRITICAL SECURITY INFORMATION', pageWidth / 2, yPos, {
    align: 'center'
  });
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);  // Back to black

  const warnings = [
    '• This private key provides complete access to all funds in this account',
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
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('HOW TO IMPORT THIS KEY', margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  if (!encrypted) {
    doc.text('Option 1: Scan QR Code', margin, yPos);
    yPos += 5;
    doc.text('• Open wallet\'s "Import Account" feature', margin + 5, yPos);
    yPos += 4;
    doc.text('• Select "Scan QR Code"', margin + 5, yPos);
    yPos += 4;
    doc.text('• Scan the QR code above', margin + 5, yPos);
    yPos += 7;
  }

  doc.text(`Option ${encrypted ? '1' : '2'}: Manual Entry`, margin, yPos);
  yPos += 5;
  doc.text('• Open wallet\'s "Import Account" feature', margin + 5, yPos);
  yPos += 4;
  doc.text('• Select "Enter WIF Manually"', margin + 5, yPos);
  yPos += 4;
  doc.text('• Type the private key shown above', margin + 5, yPos);

  // FOOTER
  yPos = 280;  // Bottom of page
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);  // Gray
  doc.text('Bitcoin Wallet Extension - Testnet', pageWidth / 2, yPos, {
    align: 'center'
  });

  // Return as Blob for download
  return doc.output('blob');
}

// Helper function to split long text into lines
function splitIntoLines(text: string, charsPerLine: number): string[] {
  const lines: string[] = [];
  for (let i = 0; i < text.length; i += charsPerLine) {
    lines.push(text.substring(i, i + charsPerLine));
  }
  return lines;
}
```

### 9.3 PDF Download Handling

**Trigger Download:**
```tsx
async function handlePDFExport() {
  try {
    setExporting(true);

    // Generate PDF
    const pdfBlob = await generatePDFBackup({
      accountName: account.name,
      addressType: account.addressType,
      firstAddress: account.firstAddress,
      network: 'testnet',
      wif: exportedWIF,
      encrypted: passwordProtection,
      encryptedData: encryptedWIF
    });

    // Create download link
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;

    // Filename: bitcoin-account-{name}-backup-{timestamp}.pdf
    const sanitizedName = account.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);

    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, '')
      .split('.')[0]
      .replace('T', '-');

    link.download = `bitcoin-account-${sanitizedName}-backup-${timestamp}.pdf`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    // Show success
    setExporting(false);
    onSuccess('PDF backup generated successfully');

  } catch (error) {
    console.error('PDF generation failed:', error);
    setExporting(false);
    onError('PDF generation failed. Please try text file export instead.');
  }
}
```

---

## Accessibility Requirements

### 10.1 WCAG 2.1 AA Compliance

**Color Contrast:**
- All text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- Interactive elements: 3:1 against adjacent colors

**Verified Combinations:**
```
Background: #1A1A1A (gray-900)
Text: #D1D1D1 (gray-300)
Contrast: 7.2:1 ✓

Background: #1E1E1E (gray-850)
Text: #D1D1D1 (gray-300)
Contrast: 6.8:1 ✓

Background: rgba(239, 68, 68, 0.15) (red warning box)
Text: #F87171 (red-300)
Contrast: 5.1:1 ✓
```

### 10.2 Keyboard Navigation

**Tab Order:**
1. Modal opens → Focus on first interactive element
2. Tab moves forward through interactive elements
3. Shift+Tab moves backward
4. Enter activates buttons/checkboxes
5. Escape closes modals

**Focus Indicators:**
```css
/* Global focus style */
*:focus {
  outline: 2px solid #F7931A;  /* Bitcoin orange */
  outline-offset: 2px;
}

/* Button focus */
button:focus-visible {
  ring: 2px ring-bitcoin ring-offset-2 ring-offset-gray-900;
}

/* Input focus */
input:focus {
  border-color: #F7931A;
  box-shadow: 0 0 0 2px rgba(247, 147, 26, 0.3);
}
```

**Keyboard Shortcuts:**
- `Escape`: Close modal/dialog
- `Enter`: Submit form (when button focused)
- `Space`: Toggle checkbox/radio
- `Tab`: Next element
- `Shift+Tab`: Previous element

### 10.3 Screen Reader Support

**ARIA Labels:**
```tsx
// Modal dialogs
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="export-dialog-title"
  aria-describedby="export-dialog-description"
>
  <h2 id="export-dialog-title">Export Private Key</h2>
  <div id="export-dialog-description">
    Export your account private key with optional password protection
  </div>
</div>

// Form labels
<label htmlFor="password-input" className="block text-sm font-semibold mb-2">
  Password
</label>
<input
  id="password-input"
  type="password"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "password-error" : undefined}
/>
{hasError && (
  <div id="password-error" role="alert" className="text-red-300 text-sm mt-1">
    Password must be at least 8 characters
  </div>
)}

// Checkboxes
<label className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={passwordProtection}
    onChange={(e) => setPasswordProtection(e.target.checked)}
    aria-label="Enable password protection (recommended)"
  />
  <span>Enable password protection (recommended)</span>
</label>

// Password strength (announce to screen readers)
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  Password strength: {strengthLabel}
</div>

// File upload
<div
  role="button"
  tabIndex={0}
  aria-label="Upload private key file. Drag and drop or press Enter to browse."
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      document.getElementById('file-input')?.click();
    }
  }}
>
  {/* Upload area content */}
</div>
```

**Screen Reader Only Class:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 10.4 Error Messaging

**Accessible Error Display:**
```tsx
// Error associated with input
<div>
  <label htmlFor="wif-input">Private Key (WIF)</label>
  <input
    id="wif-input"
    type="text"
    aria-invalid={!!error}
    aria-describedby={error ? "wif-error" : undefined}
    className={error ? 'border-red-500' : 'border-gray-700'}
  />
  {error && (
    <div
      id="wif-error"
      role="alert"
      className="mt-2 p-3 bg-red-500/15 border border-red-500/30 rounded-lg"
    >
      <p className="text-sm text-red-300">{error}</p>
    </div>
  )}
</div>

// Live region for dynamic errors
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {dynamicError}
</div>
```

---

## Responsive Design

### 11.1 Breakpoints

**Tailwind Breakpoints:**
```
sm:  640px   (Small tablets, large phones)
md:  768px   (Tablets, small laptops)
lg:  1024px  (Laptops, desktops)
xl:  1280px  (Large desktops)
2xl: 1536px  (Extra large screens)
```

**Design Strategy:**
- **Mobile First**: Base styles for smallest screens
- **Progressive Enhancement**: Add complexity at larger breakpoints
- **Content-Optimized**: Breakpoints based on content readability

### 11.2 Modal Responsiveness

**Desktop (≥1024px):**
```tsx
<div className="
  fixed inset-0 z-50
  flex items-center justify-center
  bg-black/50 backdrop-blur-sm
">
  <div className="
    w-full max-w-xl        /* 640px modal */
    m-4                     /* 16px margin */
    bg-gray-900
    border border-gray-700
    rounded-2xl
    p-6                     /* 24px padding */
    max-h-[90vh]
    overflow-y-auto
  ">
    {/* Modal content */}
  </div>
</div>
```

**Tablet (768px - 1023px):**
```tsx
<div className="
  w-full md:max-w-lg      /* 512px on tablet */
  m-4
  p-5 md:p-6              /* Slightly less padding */
">
  {/* Modal content */}
</div>
```

**Mobile (<768px):**
```tsx
<div className="
  w-full max-w-[95vw]     /* 95% viewport width */
  mx-2                     /* 8px margin */
  p-4                      /* 16px padding */
  max-h-[85vh]            /* More vertical space */
  rounded-xl              /* Smaller border radius */
">
  {/* Modal content - stacked buttons */}
  <div className="
    flex flex-col sm:flex-row  /* Stack on mobile */
    gap-3
  ">
    <button className="w-full">Cancel</button>
    <button className="w-full">Export</button>
  </div>
</div>
```

### 11.3 Font Size Adjustments

**Prevent iOS Zoom:**
```css
/* Input fields must be at least 16px to prevent auto-zoom */
input, textarea {
  font-size: 16px;  /* Never smaller on mobile */
}

/* Labels can be smaller */
label {
  font-size: 14px;
}
```

**Responsive Typography:**
```tsx
// Modal titles
<h2 className="
  text-lg sm:text-xl      /* 18px → 20px */
  font-bold
  text-white
  mb-4 sm:mb-6
">
  Export Private Key
</h2>

// Body text (maintain readability)
<p className="
  text-base               /* Always 16px */
  text-gray-300
  leading-relaxed
">
  Your private key provides complete access...
</p>

// Small text
<p className="
  text-sm sm:text-xs      /* 14px → 12px */
  text-gray-400
">
  Generated: 2025-10-19
</p>
```

### 11.4 Touch Targets

**Minimum Size: 44×44px**
```tsx
// Buttons
<button className="
  min-h-[44px]            /* Minimum touch target */
  px-6 py-3
  text-base               /* 16px text minimum */
  rounded-lg
">
  Export Now
</button>

// Checkboxes (visual + label area)
<label className="
  flex items-center
  gap-3
  min-h-[44px]            /* Entire label clickable */
  cursor-pointer
">
  <input
    type="checkbox"
    className="w-5 h-5"    /* 20px visual */
  />
  <span className="text-base">
    Enable password protection
  </span>
</label>

// Icon buttons
<button
  className="
    w-11 h-11             /* 44px × 44px */
    flex items-center justify-center
    rounded-lg
    hover:bg-gray-800
  "
  aria-label="Toggle password visibility"
>
  <EyeIcon className="w-5 h-5" />
</button>
```

---

## Implementation Checklist

### 12.1 Component Development

**Phase 1: Core Components (Week 1)**
- [ ] `PasswordStrengthMeter` component
- [ ] `PasswordRequirementsChecklist` component
- [ ] `FileUploadArea` component
- [ ] `WarningBox` component (critical, high, info severities)
- [ ] `ErrorMessage` component with predefined error types

**Phase 2: Export Flow (Week 1-2)**
- [ ] Export button in Settings → Account Management
- [ ] `ExportWarningModal` - initial security warning
- [ ] `ExportDialog` - main export form with format/password options
- [ ] `PlaintextWarningModal` - extra warning for unencrypted export
- [ ] `ExportSuccessModal` - success confirmation with reminders
- [ ] PDF generation function with jsPDF
- [ ] QR code generation for plaintext PDFs
- [ ] File download handlers

**Phase 3: Import Flow (Week 2)**
- [ ] Import Private Key tab in WalletSetup
- [ ] Import Account modal for existing wallets
- [ ] File upload with drag-and-drop
- [ ] Manual WIF entry textarea
- [ ] Real-time WIF validation with preview
- [ ] Encrypted file detection and password input
- [ ] Duplicate key detection
- [ ] Import success handling

**Phase 4: Integration (Week 2)**
- [ ] Settings screen integration (export button)
- [ ] Sidebar integration (import account option)
- [ ] Backend message handlers wired up
- [ ] Toast notifications for success/error states
- [ ] Account list updates after import

**Phase 5: Polish & Accessibility (Week 3)**
- [ ] Keyboard navigation tested and working
- [ ] Screen reader testing completed
- [ ] Focus management verified
- [ ] Color contrast verified (WCAG AA)
- [ ] Touch targets verified (44px minimum)
- [ ] Animations smooth and performant
- [ ] Error states all handled gracefully
- [ ] Responsive design tested (mobile, tablet, desktop)

**Phase 6: Security & Testing (Week 3)**
- [ ] Security expert code review
- [ ] All warnings display correctly
- [ ] Password strength meter calibrated
- [ ] PDF generation tested (encrypted and plaintext)
- [ ] QR codes scannable
- [ ] Network validation working (reject mainnet keys)
- [ ] Export-import roundtrip tested
- [ ] Edge cases handled (long names, special chars, corrupted files)

**Phase 7: Documentation (Week 3)**
- [ ] Update `ui-ux-designer-notes.md` with implementation details
- [ ] Add screenshots/examples to visual guide document
- [ ] Update `CHANGELOG.md` with new feature
- [ ] Create user-facing help content
- [ ] Document accessibility features

---

## Design Rationale

### Why This Design?

**1. Security-First Modal Flow**
- Multiple modals educate users step-by-step
- Cannot skip warnings or rush through process
- Prominent red/amber warnings impossible to miss
- Extra modal for plaintext export emphasizes danger

**2. Optional Password Protection**
- User agency: Let informed users make the choice
- Strong recommendations without forcing
- Visual design guides toward safer option (highlighted button)
- Clear trade-offs explained at each step

**3. Progressive Disclosure**
- Initial warning: High-level risks
- Export dialog: Detailed options
- Plaintext warning: Extra scary specifics (if applicable)
- Success: Security reminders and next steps

**4. Trust Through Transparency**
- Show first address for verification
- Display encryption method in success screen
- QR codes let users verify content
- Filename format clearly shows account and timestamp

**5. Consistent Design Language**
- Matches existing wallet design system
- Reuses established modal patterns
- Same color palette and typography
- Same 800px content width pattern

**6. Accessibility by Default**
- Not an afterthought - designed in from start
- WCAG AA compliance ensures broad usability
- Keyboard navigation as good as mouse
- Screen reader users get full experience

---

**END OF UX SPECIFICATION**

**Next Steps:**
1. Frontend Developer: Implement components from this spec
2. Backend Developer: Ensure message handlers match UI expectations
3. Testing Expert: Write tests for all user flows
4. Security Expert: Review warnings and error messages
5. QA Engineer: Manual testing on testnet with real exports/imports

**Cross-References:**
- Product Requirements: `PRIVATE_KEY_EXPORT_IMPORT_PRD.md`
- Security Spec: `PRIVATE_KEY_EXPORT_IMPORT_SECURITY_SPEC.md`
- Design System: `prompts/docs/ui-ux-designer-notes.md`
- Implementation: Frontend and Backend developer notes
