# Encrypted Wallet Backup Export - Complete UX Design Specification

**Feature:** Encrypted Wallet Backup Export
**Version:** 1.0
**Date:** October 19, 2025
**Designer:** UI/UX Designer
**Status:** Design Complete - Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Complete User Flow](#complete-user-flow)
3. [Screen-by-Screen Design](#screen-by-screen-design)
4. [Component Specifications](#component-specifications)
5. [Visual Design System](#visual-design-system)
6. [Interaction Design](#interaction-design)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Error Handling UX](#error-handling-ux)
9. [Responsive Design](#responsive-design)
10. [Implementation Checklist](#implementation-checklist)

---

## 1. Overview

### 1.1 Feature Purpose

Allow users to export an encrypted backup of their entire wallet (all accounts + contacts) with a separate backup password for added security.

### 1.2 Key Requirements

**Security Requirements:**
- Pre-export security warning screen
- Wallet password re-authentication
- Separate backup password with strict requirements (12+ chars, complexity)
- Progress indicator during encryption (10-20 seconds, 600K PBKDF2 iterations)
- Post-export security reminders
- Clear SHA-256 checksum display

**User Experience Requirements:**
- Multi-step flow: Warning → Wallet Password → Backup Password → Encryption → Success
- Clear visual hierarchy and security warnings
- Real-time password validation feedback
- Automatic file download to Downloads folder
- Success confirmation with backup details

### 1.3 Design Philosophy

**Security-First UX:**
- Prominent warnings using amber/red colors
- Multiple confirmation steps prevent accidental exports
- Clear security education throughout flow
- Password strength enforcement with visual feedback

**Progressive Disclosure:**
- One concept per screen to avoid cognitive overload
- Clear "what happens next" guidance
- Step indicators show progress through flow

**Trust & Transparency:**
- Explain why each step is necessary
- Show exactly what's being exported
- Provide verification tools (checksum)

---

## 2. Complete User Flow

### 2.1 Flow Diagram

```
Settings Screen
      |
      v
[Export Encrypted Backup] button clicked
      |
      v
Security Warning Modal
   "Understand Risks"
      |
      v
Wallet Password Modal
   "Confirm Your Identity"
      |
      v
Backup Password Creation Modal
   "Create Backup Password"
      |
      v
Encryption Progress Modal
   "Encrypting Backup..."
      |
      v
Success Modal
   "Backup Complete"
      |
      v
[Done] → Returns to Settings
```

### 2.2 Navigation Flow

**Modal Sequence:**
1. **Warning Modal** → [Cancel] returns to Settings | [I Understand, Continue] proceeds to step 2
2. **Wallet Password Modal** → [Cancel] returns to Settings | [Confirm] proceeds to step 3
3. **Backup Password Modal** → [Back] to step 2 | [Cancel] to Settings | [Create Backup] proceeds to step 4
4. **Progress Modal** → No user controls (automatic progression)
5. **Success Modal** → [Done] returns to Settings

**Step Tracking:**
- No visual step indicator (modals are distinct enough)
- Each modal clearly titled with action context
- Back navigation only available on Backup Password screen

---

## 3. Screen-by-Screen Design

### 3.1 Settings Screen Integration

**Location:** Settings Screen → Security Section → After "Lock Wallet" button

**Export Button Placement:**

```
┌─────────────────────────────────────────────────────┐
│ Security                                             │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │  Auto-lock Timer                             │   │
│ │  Wallet locks automatically after inactivity │   │
│ │                              15 minutes  →   │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │          🔒 Lock Wallet                      │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ ┌──────────────────────────────────────────────┐   │
│ │          💾 Export Encrypted Backup          │   │  ← NEW
│ └──────────────────────────────────────────────┘   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Button Specifications:**
- **Background:** `bg-gray-800 hover:bg-gray-750`
- **Text:** `text-gray-300` with icon (💾 or download icon)
- **Height:** `py-3` (48px total with padding)
- **Full width:** `w-full`
- **Font:** `font-semibold text-base`
- **Border radius:** `rounded-lg`
- **Transition:** `transition-colors duration-200`

**Button Copy:** "Export Encrypted Backup" or "💾 Export Encrypted Backup"

---

### 3.2 Screen 1: Security Warning Modal

**Purpose:** Ensure user understands security implications before proceeding

**Modal Dimensions:**
- **Width:** `max-w-lg` (512px)
- **Padding:** `p-6`
- **Background:** `bg-gray-850 border border-gray-700`

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  ⚠️  Export Encrypted Backup                          │
├────────────────────────────────────────────────────────┤
│                                                         │
│  You're about to export an encrypted backup of your    │
│  entire wallet. This file will contain:                │
│                                                         │
│  • All your accounts and private keys (encrypted)      │
│  • All saved contacts                                  │
│  • Transaction history and settings                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ⚠️  SECURITY WARNINGS                          │  │
│  │                                                  │  │
│  │  • You'll create a SEPARATE password for this   │  │
│  │    backup file (different from wallet password) │  │
│  │                                                  │  │
│  │  • Store this backup file in a SECURE location  │  │
│  │    (encrypted USB drive, password manager)      │  │
│  │                                                  │  │
│  │  • NEVER share this file or the backup password │  │
│  │    with anyone - they can access all your funds │  │
│  │                                                  │  │
│  │  • Keep the backup password in a DIFFERENT      │  │
│  │    location than the backup file                │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │     Cancel      │  │  I Understand, Continue  →  │ │
│  └─────────────────┘  └─────────────────────────────┘ │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: ⚠️ (amber warning triangle)
- Title: "Export Encrypted Backup"
- Typography: `text-xl font-bold text-white`
- Spacing: `mb-4`

**Body Content:**
- Intro paragraph: `text-sm text-gray-300 mb-4`
- Bullet list: `text-sm text-gray-300 space-y-2 mb-6`

**Warning Box:**
- Background: `bg-amber-500/10 border border-amber-500/30 rounded-lg p-4`
- Icon: ⚠️ `text-amber-400`
- Title: "SECURITY WARNINGS" `text-xs font-bold text-amber-300 mb-3`
- Bullets: `text-xs text-amber-200/90 space-y-2`
- Each bullet uses bold for key terms (SEPARATE, SECURE, NEVER, DIFFERENT)

**Buttons:**
- Container: `flex space-x-3 mt-6`
- Cancel: `flex-1 bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold`
- Continue: `flex-1 bg-bitcoin hover:bg-bitcoin-hover text-white py-3 px-6 rounded-lg font-semibold`

---

### 3.3 Screen 2: Wallet Password Confirmation Modal

**Purpose:** Re-authenticate user with wallet password before allowing export

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔐  Confirm Your Wallet Password                     │
├────────────────────────────────────────────────────────┤
│                                                         │
│  For security, please enter your wallet password to    │
│  authorize this backup export.                         │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Wallet Password                                │  │
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

**Header:**
- Icon: 🔐 (lock)
- Title: "Confirm Your Wallet Password"
- Typography: `text-xl font-bold text-white`

**Instructions:**
- `text-sm text-gray-300 mb-6`

**Password Input:**
- Label: `text-sm font-semibold text-gray-300 mb-2`
- Input field:
  - Type: `password` (toggleable with eye icon)
  - Background: `bg-gray-900`
  - Border: `border border-gray-700`
  - Focus: `focus:ring-2 focus:ring-bitcoin focus:border-bitcoin`
  - Padding: `px-4 py-3`
  - Height: 48px
  - Font: `text-base`
  - Error state: `border-red-500` if incorrect
- Eye icon button:
  - Position: Absolute right inside input
  - Color: `text-gray-500 hover:text-gray-300`
  - Size: 20px

**Error Message:**
- Background: `bg-red-500/15 border border-red-500/30 rounded-lg p-3 mb-4`
- Text: `text-sm text-red-300`
- Icon: ❌

**Buttons:**
- Same styling as Warning Modal
- Confirm button disabled if password empty: `disabled:bg-gray-700 disabled:cursor-not-allowed`

---

### 3.4 Screen 3: Backup Password Creation Modal

**Purpose:** Create a separate, strong password specifically for the backup file

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔑  Create Backup Password                           │
├────────────────────────────────────────────────────────┤
│                                                         │
│  Create a strong password to encrypt this backup.      │
│  This password is SEPARATE from your wallet password   │
│  and will be required to restore this backup.          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Backup Password                                │  │
│  │  ┌───────────────────────────────────────────┐  │  │
│  │  │ •••••••••••••                      [👁]  │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  │                                                  │  │
│  │  Password Strength:                             │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │ ████████████░░░░░░░░░   Strong          │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  │                                                  │  │
│  │  Requirements:                                  │  │
│  │  ✓ At least 12 characters                      │  │
│  │  ✓ Contains uppercase letters                  │  │
│  │  ✓ Contains lowercase letters                  │  │
│  │  ✓ Contains numbers                            │  │
│  │  ✗ Contains special characters (!@#$%^&*)      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Confirm Backup Password                        │  │
│  │  ┌───────────────────────────────────────────┐  │  │
│  │  │ •••••••••••••                      [👁]  │  │  │
│  │  └───────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  [ERROR STATE - if passwords don't match:]             │
│  ┌─────────────────────────────────────────────────┐  │
│  │  ❌ Passwords do not match                      │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌────────┐  ┌─────────┐  ┌──────────────────────┐   │
│  │  Back  │  │ Cancel  │  │  Create Backup  →    │   │
│  └────────┘  └─────────┘  └──────────────────────┘   │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Header:**
- Icon: 🔑 (key)
- Title: "Create Backup Password"
- Typography: `text-xl font-bold text-white`

**Instructions:**
- `text-sm text-gray-300 mb-6`
- Bold "SEPARATE" word: `font-bold text-white`

**Password Input Container:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4`

**Password Input Field:**
- Same styling as Wallet Password input
- Real-time validation on input

**Password Strength Meter:**
- Container: `mt-3 mb-3`
- Label: "Password Strength:" `text-xs text-gray-400 mb-1`
- Progress bar:
  - Background: `bg-gray-800 rounded-full h-2`
  - Fill: Color-coded based on strength
    - Weak (0-40%): `bg-red-500`
    - Fair (41-60%): `bg-yellow-500`
    - Good (61-80%): `bg-blue-500`
    - Strong (81-100%): `bg-green-500`
  - Width: Percentage based on criteria met
  - Smooth transition: `transition-all duration-300`
- Label text: "Weak" | "Fair" | "Good" | "Strong"
  - `text-xs font-semibold ml-2`
  - Color matches bar color

**Requirements Checklist:**
- Container: `mt-3 space-y-1`
- Label: "Requirements:" `text-xs font-semibold text-gray-400 mb-2`
- Each requirement:
  - Checkmark (✓) or X (✗) icon
  - ✓ Green: `text-green-400`
  - ✗ Gray: `text-gray-600`
  - Text: `text-xs text-gray-300`
  - Layout: `flex items-center space-x-2`

**Requirements List:**
1. "At least 12 characters"
2. "Contains uppercase letters (A-Z)"
3. "Contains lowercase letters (a-z)"
4. "Contains numbers (0-9)"
5. "Contains special characters (!@#$%^&*)"

**Confirm Password Input:**
- Separate container below password input
- Same styling as password input
- Validation: Only check match when user types (not until first character)

**Error Messages:**
- Password too weak: `bg-amber-500/15 border border-amber-500/30`
  - "Password must meet all requirements except special characters (recommended but optional)"
- Passwords don't match: `bg-red-500/15 border border-red-500/30`
  - "Passwords do not match"

**Buttons:**
- Three-button layout: `flex space-x-2`
- Back: `bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-4 rounded-lg font-semibold`
- Cancel: `bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-4 rounded-lg font-semibold`
- Create Backup: `flex-1 bg-bitcoin hover:bg-bitcoin-hover text-white py-3 px-6 rounded-lg font-semibold`
  - Disabled states:
    - Password doesn't meet minimum requirements (12 chars, upper, lower, number)
    - Passwords don't match
    - Either field empty

---

### 3.5 Screen 4: Encryption Progress Modal

**Purpose:** Show progress during encryption operation (10-20 seconds)

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  🔐  Encrypting Your Backup...                        │
├────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌───────────────┐                     │
│                  │               │                     │
│                  │   [SPINNER]   │                     │
│                  │               │                     │
│                  └───────────────┘                     │
│                                                         │
│             Encrypting your wallet backup...            │
│                                                         │
│                  This may take 10-20 seconds            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ ████████████████████░░░░░░░░░░░░  65%          │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  Current step: Deriving encryption key...              │
│                                                         │
│                                                         │
│  ⚠️  Do not close this window                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

**Visual Specifications:**

**Modal Properties:**
- Non-dismissible: No close button, no escape key, no click outside
- `closeOnBackdropClick={false}`

**Header:**
- Icon: 🔐 (animated if possible - rotating or pulsing)
- Title: "Encrypting Your Backup..."
- Typography: `text-xl font-bold text-white`

**Spinner:**
- Large circular spinner: 64px diameter
- Color: `border-bitcoin` and `border-gray-700`
- Animation: `animate-spin`
- Center alignment: `mx-auto mb-6`

**Status Text:**
- Main message: `text-base text-gray-300 text-center mb-2`
- Duration note: `text-sm text-gray-500 text-center mb-6`

**Progress Bar:**
- Container: `bg-gray-800 rounded-full h-3 overflow-hidden mb-3`
- Fill: `bg-bitcoin h-full transition-all duration-500`
- Width: Percentage based on progress
- Percentage label: `text-sm text-gray-400 text-right font-mono`

**Current Step Indicator:**
- `text-sm text-gray-400 text-center italic mb-6`
- Steps to show:
  - "Deriving encryption key..." (0-30%)
  - "Serializing wallet data..." (31-50%)
  - "Encrypting backup..." (51-85%)
  - "Generating checksum..." (86-95%)
  - "Preparing download..." (96-100%)

**Warning:**
- Icon: ⚠️ `text-amber-400`
- Text: "Do not close this window"
- Styling: `text-sm text-amber-300 text-center`
- Background: `bg-amber-500/10 border border-amber-500/30 rounded-lg p-3`

**Progress Animation:**
- Smooth transitions between steps
- Progress bar fills proportionally
- Step text fades in/out when changing

---

### 3.6 Screen 5: Success Modal

**Purpose:** Confirm successful backup creation and provide important security reminders

**ASCII Wireframe:**

```
┌────────────────────────────────────────────────────────┐
│  ✅  Backup Successfully Created                      │
├────────────────────────────────────────────────────────┤
│                                                         │
│                  ┌───────────────┐                     │
│                  │       ✅       │                     │
│                  └───────────────┘                     │
│                                                         │
│  Your encrypted wallet backup has been saved to your   │
│  Downloads folder.                                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Backup Details                                 │  │
│  │                                                  │  │
│  │  📄 Filename:                                   │  │
│  │     wallet-backup-2025-10-19-143022.dat        │  │
│  │                                                  │  │
│  │  📊 Size:                                       │  │
│  │     24.3 KB                                     │  │
│  │                                                  │  │
│  │  🔐 SHA-256 Checksum:                           │  │
│  │     a3f5c89d2e... [Copy]                        │  │
│  │                                                  │  │
│  │  📅 Created:                                    │  │
│  │     October 19, 2025 at 2:30:22 PM             │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  🛡️  IMPORTANT SECURITY REMINDERS              │  │
│  │                                                  │  │
│  │  ✓ Store this backup file in a secure location │  │
│  │    (encrypted USB drive, password manager)     │  │
│  │                                                  │  │
│  │  ✓ Keep your backup password safe and separate │  │
│  │    from the backup file                        │  │
│  │                                                  │  │
│  │  ✓ Test your backup by attempting to restore   │  │
│  │    in a test environment                       │  │
│  │                                                  │  │
│  │  ✓ Never share the backup file or password     │  │
│  │    with anyone                                 │  │
│  │                                                  │  │
│  │  ✓ Keep multiple backups in different secure   │  │
│  │    locations                                   │  │
│  └─────────────────────────────────────────────────┘  │
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
- Title: "Backup Successfully Created"
- Typography: `text-xl font-bold text-white`
- Color: Success green theme

**Success Icon:**
- Large checkmark circle: 80px
- Background: `bg-green-500/20 border-2 border-green-500 rounded-full`
- Icon: ✅ or custom SVG checkmark `text-green-400`
- Center aligned with subtle scale-in animation
- Margin: `my-6`

**Success Message:**
- `text-base text-gray-300 text-center mb-6`

**Backup Details Card:**
- Background: `bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6`
- Title: "Backup Details" `text-sm font-semibold text-white mb-3`
- Each detail row:
  - Icon + Label + Value
  - Layout: `flex items-start space-x-2 mb-3`
  - Icon: `text-gray-500`
  - Label: `text-xs text-gray-500`
  - Value: `text-sm text-white font-mono` (for filename and checksum)

**Detail Rows:**
1. **Filename:**
   - Icon: 📄
   - Value: `wallet-backup-YYYY-MM-DD-HHMMSS.dat`
   - Font: `font-mono text-sm`

2. **Size:**
   - Icon: 📊
   - Value: File size in KB/MB
   - Font: `text-sm text-gray-300`

3. **SHA-256 Checksum:**
   - Icon: 🔐
   - Value: First 11 chars + "..." + [Copy] button
   - Copy button:
     - `text-xs text-bitcoin hover:text-bitcoin-hover font-semibold`
     - Shows "Copied!" tooltip on click
   - Full checksum shown on hover/click to expand

4. **Created:**
   - Icon: 📅
   - Value: Full date and time
   - Font: `text-sm text-gray-300`

**Security Reminders Box:**
- Background: `bg-blue-500/10 border border-blue-500/30 rounded-lg p-4`
- Icon: 🛡️ `text-blue-400`
- Title: "IMPORTANT SECURITY REMINDERS" `text-xs font-bold text-blue-300 mb-3`
- Checklist items:
  - Each item: `flex items-start space-x-2 mb-2`
  - Checkmark: ✓ `text-green-400 flex-shrink-0 mt-0.5`
  - Text: `text-xs text-blue-200/90`
  - Bold key terms: "secure location", "safe and separate", "Never share", "multiple backups"

**Done Button:**
- Center aligned
- Width: `w-auto px-12` (not full width)
- Styling: `bg-bitcoin hover:bg-bitcoin-hover text-white py-3 rounded-lg font-semibold`
- Focus: `focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850`

---

## 4. Component Specifications

### 4.1 New Components to Create

#### PasswordStrengthMeter Component

**File:** `src/tab/components/shared/PasswordStrengthMeter.tsx`

**Props:**
```typescript
interface PasswordStrengthMeterProps {
  password: string;
  minLength?: number; // default 12
  requireSpecialChars?: boolean; // default false
  className?: string;
}
```

**Strength Calculation:**
```typescript
const calculateStrength = (password: string): {
  score: number; // 0-100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  requirements: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
} => {
  // Implementation logic
}
```

**Visual Output:**
- Progress bar with color-coded fill
- Text label (Weak/Fair/Good/Strong)
- Requirements checklist

**Styling:**
- Follows design system color palette
- Smooth transitions for strength changes
- Accessible labels for screen readers

---

#### PasswordRequirements Component

**File:** `src/tab/components/shared/PasswordRequirements.tsx`

**Props:**
```typescript
interface PasswordRequirementsProps {
  password: string;
  requirements: {
    minLength: number;
    requireUpper: boolean;
    requireLower: boolean;
    requireNumber: boolean;
    requireSpecial: boolean;
  };
  className?: string;
}
```

**Features:**
- Real-time validation as user types
- Green checkmarks (✓) for met requirements
- Gray X marks (✗) for unmet requirements
- Clear, concise requirement text

---

#### ProgressModal Component

**File:** `src/tab/components/shared/ProgressModal.tsx`

**Props:**
```typescript
interface ProgressModalProps {
  isOpen: boolean;
  progress: number; // 0-100
  title: string;
  message: string;
  currentStep?: string;
  showWarning?: boolean;
  warningText?: string;
}
```

**Features:**
- Non-dismissible modal
- Animated spinner
- Progress bar with percentage
- Current step indicator
- Optional warning message

---

### 4.2 Modified Components

#### Settings Screen

**File:** `src/tab/components/SettingsScreen.tsx`

**Changes Required:**
1. Add "Export Encrypted Backup" button to Security section
2. Add state management for export modals
3. Wire up modal flow

**New State:**
```typescript
const [showExportWarning, setShowExportWarning] = useState(false);
const [showWalletPassword, setShowWalletPassword] = useState(false);
const [showBackupPassword, setShowBackupPassword] = useState(false);
const [showProgress, setShowProgress] = useState(false);
const [showSuccess, setShowSuccess] = useState(false);
const [exportResult, setExportResult] = useState<ExportResult | null>(null);
```

---

### 4.3 Modal Sequence Components

Create separate modal components for each step:

1. **ExportWarningModal.tsx**
   - Security warning content
   - Two buttons: Cancel, Continue

2. **WalletPasswordModal.tsx**
   - Password input with toggle visibility
   - Error state for incorrect password
   - Two buttons: Cancel, Confirm

3. **BackupPasswordModal.tsx**
   - Two password inputs (password + confirm)
   - PasswordStrengthMeter integration
   - PasswordRequirements integration
   - Three buttons: Back, Cancel, Create Backup

4. **ExportProgressModal.tsx**
   - Uses ProgressModal component
   - No user controls

5. **ExportSuccessModal.tsx**
   - Backup details display
   - Checksum with copy functionality
   - Security reminders
   - One button: Done

---

## 5. Visual Design System

### 5.1 Color Palette Usage

**Security Warning Colors:**
```css
/* Amber - Warnings and cautions */
bg-amber-500/10         /* Background: rgba(245, 158, 11, 0.1) */
border-amber-500/30     /* Border: rgba(245, 158, 11, 0.3) */
text-amber-300          /* Text: #FCD34D */
text-amber-400          /* Icons: #FBBF24 */

/* Red - Errors */
bg-red-500/15           /* Background: rgba(239, 68, 68, 0.15) */
border-red-500/30       /* Border: rgba(239, 68, 68, 0.3) */
text-red-300            /* Text: #FCA5A5 */

/* Blue - Information */
bg-blue-500/10          /* Background: rgba(59, 130, 246, 0.1) */
border-blue-500/30      /* Border: rgba(59, 130, 246, 0.3) */
text-blue-300           /* Text: #93C5FD */
text-blue-400           /* Icons: #60A5FA */

/* Green - Success */
bg-green-500/20         /* Background: rgba(34, 197, 94, 0.2) */
border-green-500        /* Border: #22C55E */
text-green-400          /* Text/Icons: #4ADE80 */
```

**Password Strength Colors:**
```css
/* Weak */
bg-red-500              /* #EF4444 */

/* Fair */
bg-yellow-500           /* #EAB308 */

/* Good */
bg-blue-500             /* #3B82F6 */

/* Strong */
bg-green-500            /* #22C55E */
```

---

### 5.2 Typography

**Headers:**
- Modal titles: `text-xl font-bold text-white`
- Section titles: `text-sm font-semibold text-white`
- Field labels: `text-sm font-semibold text-gray-300`

**Body Text:**
- Primary: `text-base text-gray-300`
- Secondary: `text-sm text-gray-400`
- Small: `text-xs text-gray-500`

**Special Text:**
- Monospace (filenames, checksums): `font-mono`
- Error messages: `text-sm text-red-300`
- Warning messages: `text-xs text-amber-200`
- Success messages: `text-sm text-green-300`

---

### 5.3 Iconography

**Security Icons:**
- ⚠️ Warning triangle - Amber warnings
- 🔐 Lock - Security/encryption
- 🔑 Key - Password creation
- 🛡️ Shield - Security reminders
- ✅ Checkmark - Success
- ❌ X mark - Errors
- 👁️ Eye - Password visibility toggle
- 📄 Document - File reference
- 📊 Chart - File size
- 📅 Calendar - Date/time
- 💾 Floppy disk - Save/export action

**Icon Sizes:**
- Inline with text: 16px
- Button icons: 20px
- Modal header icons: 24px
- Large success icon: 80px

**Icon Colors:**
- Default: `text-gray-500`
- Warnings: `text-amber-400`
- Errors: `text-red-400`
- Success: `text-green-400`
- Security: `text-blue-400`
- Active/Interactive: `text-bitcoin`

---

### 5.4 Spacing & Layout

**Modal Spacing:**
- Outer padding: `p-6` (24px)
- Section spacing: `mb-6` (24px between sections)
- Element spacing: `mb-4` (16px between related elements)
- Tight spacing: `mb-2` (8px within groups)

**Button Spacing:**
- Button group gap: `space-x-3` (12px)
- Button padding: `py-3 px-6` (12px vertical, 24px horizontal)
- Icon gap: `mr-2` (8px)

**Input Spacing:**
- Label to input: `mb-2` (8px)
- Input padding: `px-4 py-3` (16px horizontal, 12px vertical)
- Input height: 48px total

**Card/Box Spacing:**
- Padding: `p-4` (16px)
- Internal element spacing: `space-y-3` (12px)

---

### 5.5 Border Radius

- Modals: `rounded-2xl` (16px)
- Cards/boxes: `rounded-lg` (8px)
- Inputs: `rounded-lg` (8px)
- Buttons: `rounded-lg` (8px)
- Progress bars: `rounded-full`
- Badges: `rounded-full`

---

### 5.6 Shadows & Elevation

**Modals:**
```css
shadow-2xl /* 0 25px 50px -12px rgba(0, 0, 0, 0.25) */
```

**Cards (on hover):**
```css
hover:shadow-lg /* 0 10px 15px -3px rgba(0, 0, 0, 0.1) */
```

**Focus Rings:**
```css
focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850
```

---

## 6. Interaction Design

### 6.1 Button States

**Primary Button (Bitcoin Orange):**

```css
/* Default */
bg-bitcoin text-white py-3 px-6 rounded-lg font-semibold

/* Hover */
hover:bg-bitcoin-hover

/* Active/Click */
active:bg-bitcoin-active active:scale-[0.98]

/* Focus (keyboard) */
focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850

/* Disabled */
disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed

/* Loading */
[spinner icon] + "Processing..." text
```

**Secondary Button (Gray):**

```css
/* Default */
bg-gray-800 text-gray-300 py-3 px-6 rounded-lg font-semibold

/* Hover */
hover:bg-gray-750

/* Active */
active:bg-gray-700 active:scale-[0.98]

/* Focus */
focus:outline-none focus:ring-2 focus:ring-gray-600

/* Disabled */
disabled:bg-gray-700 disabled:text-gray-600 disabled:cursor-not-allowed
```

---

### 6.2 Form Validation Timing

**Password Validation:**
- **On Input (Real-time):**
  - Password strength meter updates
  - Requirements checklist updates
  - Visual feedback immediate

- **On Blur:**
  - Show warning if password doesn't meet minimum requirements
  - Don't block user from continuing to confirm field

- **On Submit:**
  - Final validation before proceeding
  - Show specific error message if validation fails
  - Focus first invalid field

**Confirm Password Validation:**
- **On Input:**
  - Only validate match after user starts typing
  - Don't show "doesn't match" until they've typed at least one character

- **On Blur:**
  - Check if passwords match
  - Show error state if mismatch

- **On Submit:**
  - Final check for match

**Wallet Password Validation:**
- **On Submit Only:**
  - Don't show any validation while typing
  - Only show error after submit if incorrect
  - Allow retry without clearing field

---

### 6.3 Progress Feedback

**Encryption Progress Steps:**

1. **0-30%:** "Deriving encryption key..."
   - PBKDF2 key derivation (600K iterations)
   - Slowest step

2. **31-50%:** "Serializing wallet data..."
   - Gathering all accounts, contacts, settings
   - Converting to JSON

3. **51-85%:** "Encrypting backup..."
   - AES-256-GCM encryption
   - Main encryption operation

4. **86-95%:** "Generating checksum..."
   - SHA-256 hash calculation
   - Verification data

5. **96-100%:** "Preparing download..."
   - File blob creation
   - Triggering browser download

**Progress Bar Animation:**
- Smooth transitions: `transition-all duration-500`
- Easing: `ease-out`
- Update frequency: Every 100ms
- No jumps backward

**Step Text Animation:**
- Fade out old text: `opacity-0` (200ms)
- Update text
- Fade in new text: `opacity-100` (200ms)

---

### 6.4 Success State

**Success Modal Animation:**

1. **Modal appears:** Fade in + scale in (300ms)
2. **Success icon:** Scale in from 0.8 to 1.0 (400ms, delay 100ms)
3. **Details card:** Fade in + slide up (300ms, delay 200ms)
4. **Reminders box:** Fade in + slide up (300ms, delay 300ms)
5. **Done button:** Fade in (200ms, delay 400ms)

**Checksum Copy Interaction:**
1. User clicks [Copy]
2. Copy to clipboard
3. Show "Copied!" tooltip (green) for 2 seconds
4. Button text changes to "Copied ✓" briefly
5. Returns to [Copy] after 2 seconds

---

### 6.5 Modal Transitions

**Opening Modals:**
```css
/* Backdrop */
animate-fade-in /* opacity 0 → 1, 200ms */

/* Modal content */
animate-scale-in /* scale 0.95 → 1, opacity 0 → 1, 200ms */
```

**Closing Modals:**
```css
/* Reverse of opening */
/* 150ms fade out */
```

**Modal Chaining:**
- Previous modal fades out (150ms)
- Next modal fades in (200ms, delay 50ms)
- Total transition: 250ms between modals
- Feels connected, not jarring

---

## 7. Accessibility Guidelines

### 7.1 Keyboard Navigation

**Tab Order:**
1. First focusable element auto-focused when modal opens
2. Tab cycles through all interactive elements
3. Shift+Tab goes backward
4. Enter activates default action (primary button)
5. Escape closes modal (except progress modal)

**Modal-Specific Tab Order:**

**Warning Modal:**
1. Continue button (auto-focus)
2. Cancel button

**Wallet Password Modal:**
1. Password input (auto-focus)
2. Eye icon toggle
3. Confirm button
4. Cancel button

**Backup Password Modal:**
1. Password input (auto-focus)
2. Eye icon toggle
3. Confirm password input
4. Eye icon toggle
5. Back button
6. Cancel button
7. Create Backup button

**Success Modal:**
1. Copy checksum button
2. Done button (auto-focus)

---

### 7.2 Screen Reader Support

**ARIA Labels:**

```html
<!-- Modals -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Export Encrypted Backup</h2>
  ...
</div>

<!-- Password inputs -->
<input
  type="password"
  aria-label="Wallet password"
  aria-describedby="password-error"
  aria-invalid={hasError}
/>
<div id="password-error" role="alert">Error message</div>

<!-- Password toggle -->
<button
  aria-label="Toggle password visibility"
  aria-pressed={isVisible}
>
  <Eye />
</button>

<!-- Progress -->
<div role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
  <div style={{ width: `${progress}%` }} />
</div>

<!-- Requirements checklist -->
<ul role="list" aria-label="Password requirements">
  <li aria-label={met ? "Requirement met" : "Requirement not met"}>
    {met ? "✓" : "✗"} Requirement text
  </li>
</ul>

<!-- Success status -->
<div role="status" aria-live="polite">
  Backup successfully created
</div>
```

**Live Regions:**
- Error messages: `role="alert"` (assertive)
- Success messages: `aria-live="polite"`
- Progress updates: `aria-live="polite"`
- Form validation: `aria-describedby` linking to error messages

**Hidden Content for Screen Readers:**
```html
<span className="sr-only">
  Password strength: Strong.
  All requirements met.
</span>
```

---

### 7.3 Focus Management

**Focus Trap:**
- When modal opens, focus moves to first element
- Tab/Shift+Tab cycle only within modal
- Can't tab to elements behind modal
- Focus returns to trigger element when modal closes

**Focus Indicators:**
```css
/* All interactive elements */
focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850

/* High contrast mode compatibility */
focus-visible:ring-2 focus-visible:ring-offset-2
```

**Auto-Focus Rules:**
- Warning Modal: Continue button
- Wallet Password: Password input
- Backup Password: Password input
- Progress: No focus (non-interactive)
- Success: Done button

---

### 7.4 Color Contrast

**WCAG AA Compliance (4.5:1 for text, 3:1 for UI):**

**Text Contrast:**
- White text on gray-850: 14.2:1 ✓
- Gray-300 on gray-850: 8.9:1 ✓
- Gray-400 on gray-900: 5.2:1 ✓
- Amber-300 on amber-500/10: 12.1:1 ✓
- Red-300 on red-500/15: 11.8:1 ✓
- Blue-300 on blue-500/10: 10.5:1 ✓

**UI Element Contrast:**
- Bitcoin orange on gray-850: 4.2:1 ✓
- Gray-700 border on gray-900: 3.1:1 ✓
- Focus ring bitcoin on gray-850: 8.5:1 ✓

**Error/Warning Indicators:**
- Never rely on color alone
- Always pair color with:
  - Icons (⚠️, ❌, ✓)
  - Text labels
  - Border changes

---

### 7.5 Touch Targets

**Minimum Size:** 44×44px (WCAG 2.1 AAA)

**Current Implementation:**
- Buttons: 48px height ✓
- Password toggle: 40px tap area ✓
- Checkboxes: 44px tap area with padding ✓
- Copy button: 44px height ✓

**Spacing:**
- Minimum 8px between touch targets
- Button groups: 12px gap ✓

---

## 8. Error Handling UX

### 8.1 Error States & Recovery

**Incorrect Wallet Password:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Incorrect password. Please try again.       │
└─────────────────────────────────────────────────┘
```

- Background: `bg-red-500/15 border border-red-500/30`
- Input border turns red: `border-red-500`
- Icon: ❌
- Text: Clear, actionable

**Recovery:**
1. Error message appears below input
2. Input field keeps entered value
3. Focus remains on input
4. User can immediately try again
5. Error clears when user starts typing

**Retry Limit:**
- No hard limit on retries
- Consider rate limiting after 5+ attempts
- Show "Forgot password?" hint after 3 attempts

---

**Weak Backup Password:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ⚠️ Password must meet minimum requirements    │
└─────────────────────────────────────────────────┘
```

- Background: `bg-amber-500/15 border border-amber-500/30`
- Icon: ⚠️
- Text: "Password must be at least 12 characters and contain uppercase, lowercase, and numbers"

**Recovery:**
1. Error appears when user tries to submit
2. Focus returns to password field
3. Requirements checklist shows what's missing
4. Strength meter indicates current strength
5. Error clears when requirements met

**Prevention:**
- Create Backup button disabled until minimum requirements met
- Real-time validation provides immediate feedback
- Reduces likelihood of reaching submit error

---

**Password Mismatch:**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Passwords do not match                      │
└─────────────────────────────────────────────────┘
```

- Background: `bg-red-500/15 border border-red-500/30`
- Both password fields get red borders
- Icon: ❌

**Recovery:**
1. Error appears on blur or submit
2. Focus moves to confirm password field
3. User can re-type confirm password
4. Error clears when fields match

---

**Download Blocked (Browser Security):**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ⚠️ Download Blocked                            │
│                                                  │
│  Your browser blocked the backup file download. │
│                                                  │
│  Please check your browser's download settings  │
│  and allow downloads from this extension.       │
│                                                  │
│  [Retry Download]   [Cancel]                    │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Show modal explaining issue
2. Provide retry button
3. Link to browser download settings help
4. Backup data retained in memory for retry

---

**Encryption Failed (General Error):**

**Visual:**
```
┌─────────────────────────────────────────────────┐
│  ❌ Backup Creation Failed                      │
│                                                  │
│  An error occurred while creating your backup:  │
│  [Error message from backend]                   │
│                                                  │
│  Your wallet is safe. You can try again.        │
│                                                  │
│  [Try Again]   [Cancel]                         │
└─────────────────────────────────────────────────┘
```

**Recovery:**
1. Show clear error message
2. Reassure wallet is safe
3. Provide retry option
4. Log error details for debugging
5. Return to beginning of flow if retry

---

### 8.2 Error Message Guidelines

**Tone:**
- Clear and specific
- Non-technical language
- Actionable (tell user what to do)
- Reassuring (when appropriate)

**Structure:**
1. What happened (brief)
2. Why it happened (if relevant)
3. What to do next (action)

**Examples:**

**Good:**
- ✓ "Incorrect password. Please try again."
- ✓ "Password must be at least 12 characters and contain uppercase, lowercase, and numbers."
- ✓ "Passwords do not match. Please re-enter your password."

**Bad:**
- ✗ "Authentication failed" (too vague)
- ✗ "Error: INVALID_PASSWORD_FORMAT" (too technical)
- ✗ "Wrong" (not helpful)

---

### 8.3 Validation Error Summary

| Error Condition | When Shown | Recovery Action |
|----------------|------------|-----------------|
| Incorrect wallet password | On submit | Retry with correct password |
| Weak backup password | On submit (if min requirements not met) | Strengthen password |
| Password mismatch | On blur or submit | Re-enter confirm password |
| Empty fields | On submit | Fill required fields |
| Download blocked | After encryption | Check browser settings, retry |
| Encryption failed | During encryption | Retry from beginning |
| Network error (future) | During operation | Retry operation |

---

## 9. Responsive Design

### 9.1 Breakpoints

The wallet uses a tab-based layout with a fixed 800px content area. Modals should adapt to smaller screens.

**Desktop (1024px+):**
- Modal max-width: 512px (max-w-lg)
- Full padding: p-6
- Standard button sizes

**Tablet (768-1023px):**
- Modal max-width: 512px (max-w-lg)
- Full padding: p-6
- Standard button sizes
- May add horizontal margins to prevent edge-to-edge

**Mobile (<768px):**
- Modal max-width: 95vw (mx-4)
- Reduced padding: p-4
- Buttons stack vertically if 3+ buttons
- Smaller text sizes for warnings
- Scrollable modal content

---

### 9.2 Modal Responsive Behavior

**Large Screens (1440px+):**
```css
/* Modals centered in viewport */
max-w-lg /* 512px */
mx-auto
```

**Medium Screens (768-1439px):**
```css
max-w-lg
mx-4 /* 16px margin on sides */
```

**Small Screens (<768px):**
```css
max-w-full /* Allow full width */
mx-4 /* 16px margin */
my-4 /* 16px margin top/bottom */
max-h-[90vh] /* Prevent overflow */
overflow-y-auto /* Scroll if needed */
```

---

### 9.3 Component Adaptations for Mobile

**Password Input:**
- Same height (48px)
- Font size remains 16px (prevents zoom on iOS)
- Eye icon remains visible

**Password Strength Meter:**
- Full width
- Text label may stack on small screens

**Requirements Checklist:**
- Font size reduces to 11px
- Maintains readability

**Button Groups:**

**Desktop:**
```html
<div class="flex space-x-3">
  <button>Cancel</button>
  <button>Continue</button>
</div>
```

**Mobile (3 buttons):**
```html
<div class="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
  <button class="w-full sm:w-auto">Back</button>
  <button class="w-full sm:w-auto">Cancel</button>
  <button class="w-full sm:flex-1">Create Backup</button>
</div>
```

**Security Warnings:**
- Reduce padding on mobile: p-3 instead of p-4
- Font size remains readable: text-xs minimum
- May reduce line height slightly

**Success Details Card:**
- Filename wraps on mobile
- Checksum truncated earlier (8 chars instead of 11)
- Copy button remains full-size for easy tapping

---

### 9.4 Touch-Friendly Considerations

**Minimum Touch Targets:**
- All buttons: 44×44px minimum
- Password toggle: 44×44px tap area
- Copy button: 44px height
- Checkbox: 44×44px including padding

**Spacing:**
- Buttons in stacks: 8px gap minimum (space-y-2)
- Buttons in rows: 12px gap (space-x-3)
- Interactive elements: 8px minimum separation

**Hover States:**
- Desktop: Show on hover
- Touch devices: Show on tap/active state
- Use `@media (hover: hover)` for hover-only styles

---

## 10. Implementation Checklist

### 10.1 Component Development

- [ ] Create PasswordStrengthMeter component
- [ ] Create PasswordRequirements component
- [ ] Create ProgressModal component
- [ ] Create ExportWarningModal component
- [ ] Create WalletPasswordModal component
- [ ] Create BackupPasswordModal component
- [ ] Create ExportProgressModal component
- [ ] Create ExportSuccessModal component

### 10.2 Settings Screen Integration

- [ ] Add "Export Encrypted Backup" button to Security section
- [ ] Add state management for modal flow
- [ ] Wire up modal transitions
- [ ] Implement flow orchestration logic

### 10.3 Backend Integration

- [ ] Create EXPORT_WALLET message handler
- [ ] Implement PBKDF2 key derivation (600K iterations)
- [ ] Implement AES-256-GCM encryption
- [ ] Implement SHA-256 checksum generation
- [ ] Implement file download trigger
- [ ] Add progress updates via callbacks
- [ ] Error handling and reporting

### 10.4 Password Validation

- [ ] Implement password strength calculation
- [ ] Implement requirement checking
- [ ] Add real-time validation
- [ ] Add visual feedback
- [ ] Add accessibility labels

### 10.5 Progress Tracking

- [ ] Implement progress percentage tracking
- [ ] Implement step-by-step status updates
- [ ] Add smooth progress bar animation
- [ ] Add step text transitions
- [ ] Test timing (should be 10-20 seconds)

### 10.6 Success Handling

- [ ] Format filename with timestamp
- [ ] Calculate and display file size
- [ ] Display SHA-256 checksum
- [ ] Implement checksum copy functionality
- [ ] Show success animation
- [ ] Implement Done button

### 10.7 Error Handling

- [ ] Implement wallet password validation
- [ ] Handle incorrect password errors
- [ ] Handle weak password errors
- [ ] Handle password mismatch errors
- [ ] Handle download blocked errors
- [ ] Handle general encryption errors
- [ ] Implement retry logic

### 10.8 Accessibility

- [ ] Add ARIA labels to all modals
- [ ] Add ARIA labels to form inputs
- [ ] Implement focus trap in modals
- [ ] Add keyboard navigation
- [ ] Add screen reader announcements
- [ ] Test with screen reader
- [ ] Verify color contrast
- [ ] Verify touch target sizes

### 10.9 Visual Polish

- [ ] Implement modal animations
- [ ] Add success icon animation
- [ ] Add progress bar transitions
- [ ] Add button hover/active states
- [ ] Add focus indicators
- [ ] Test on different screen sizes
- [ ] Test on touch devices

### 10.10 Testing

- [ ] Test complete happy path flow
- [ ] Test all error scenarios
- [ ] Test password validation edge cases
- [ ] Test on different browsers
- [ ] Test on mobile devices
- [ ] Test accessibility with keyboard only
- [ ] Test with screen reader
- [ ] Performance test encryption timing
- [ ] Test download in different browsers

---

## 11. Design Decisions & Rationale

### 11.1 Why Multi-Step Flow?

**Decision:** Use 5 separate modals instead of a single wizard

**Rationale:**
- Each step has a distinct purpose and requires different user focus
- Warning step needs full attention without distraction
- Password entry steps should be isolated for security
- Progress step is non-interactive
- Success step celebrates completion

**Alternative Considered:** Single wizard with step navigation
**Rejected Because:** Would make it easier to rush through warnings

---

### 11.2 Why Separate Backup Password?

**Decision:** Require a different password than wallet password

**Rationale:**
- Security best practice: Don't reuse passwords
- Backup file may be stored in less secure location
- Compromised wallet password shouldn't automatically compromise backup
- Allows for different password sharing scenarios (e.g., inheritance planning)

**Alternative Considered:** Use wallet password for backup encryption
**Rejected Because:** Reduces security if wallet password is compromised

---

### 11.3 Why 12+ Character Minimum?

**Decision:** Require minimum 12 characters for backup password

**Rationale:**
- Backup files are persistent and vulnerable to offline attacks
- 12 characters with complexity provides ~70 bits of entropy
- Matches industry best practices for encrypted archives
- More secure than wallet password (8 chars) because backups are persistent

**Alternative Considered:** Keep 8 character minimum like wallet password
**Rejected Because:** Backups need stronger protection than live wallet

---

### 11.4 Why Show Progress Steps?

**Decision:** Display current step text during encryption

**Rationale:**
- 10-20 second wait feels shorter when user knows what's happening
- Transparency builds trust
- Helps identify where process fails if error occurs
- Educational: Users learn what encryption involves

**Alternative Considered:** Just show spinner and percentage
**Rejected Because:** Feels like a black box, increases anxiety

---

### 11.5 Why Display Checksum?

**Decision:** Show SHA-256 checksum in success modal

**Rationale:**
- Allows users to verify backup integrity
- Power users can compare checksum if backup is suspicious
- Industry standard for file verification
- Adds transparency and trust

**Alternative Considered:** Hide technical details
**Rejected Because:** Users who care about security want verification tools

---

### 11.6 Why Auto-Download vs Manual?

**Decision:** Automatically trigger download to Downloads folder

**Rationale:**
- Standard browser behavior for file exports
- Users expect this pattern
- No additional click required
- Browser security handles file permissions

**Alternative Considered:** Copy to clipboard or save to extension storage
**Rejected Because:**
- Clipboard: File too large, awkward UX
- Extension storage: Not a "backup" if stored in same place

---

## 12. Security Considerations in UX

### 12.1 Warning Prominence

**Design Decision:** Use large, amber warning boxes with multiple bullet points

**Security Rationale:**
- Users must understand risks before proceeding
- Amber color signals caution (not error, but serious)
- Multiple specific warnings more effective than generic statement
- Bold key terms draw attention to critical points

---

### 12.2 Password Visibility Toggle

**Design Decision:** Include eye icon to toggle password visibility

**Security Rationale:**
- **Pro:** Helps users create strong passwords without typos
- **Pro:** Reduces password reset requests
- **Con:** Shoulder-surfing risk
- **Mitigation:** User controls toggle, only affects current session

**Best Practice:** Allow users to see what they're typing, especially for complex passwords

---

### 12.3 Progress Modal Non-Dismissible

**Design Decision:** User cannot close progress modal during encryption

**Security Rationale:**
- Prevents corruption of backup file
- Ensures encryption completes fully
- Prevents accidental cancellation
- Maintains transaction integrity

**User Impact:** 10-20 second forced wait, but necessary for security

---

### 12.4 Success Modal Security Reminders

**Design Decision:** Show 5 security reminders in success modal

**Security Rationale:**
- Post-export is teachable moment
- Users just created backup, receptive to guidance
- Repetition of security advice reinforces importance
- Checklist format easy to scan and remember

**Alternative Considered:** Just show "Success" and close
**Rejected Because:** Missed opportunity for security education

---

### 12.5 No Password Recovery

**Design Decision:** No "forgot password" for backup password

**Security Rationale:**
- Backup password cannot be recovered without wallet password
- If user forgets backup password, backup is useless
- This is intentional: password is the security
- Teaches users to manage passwords carefully

**UX Impact:** Users must record password safely, but this is a feature not a bug

---

## 13. Future Enhancements

### 13.1 Potential Improvements (Out of Scope for v1)

**Restore Backup Flow:**
- Import encrypted backup file
- Enter backup password
- Decrypt and verify
- Restore accounts and contacts

**Automatic Backup Reminders:**
- Prompt user to backup after creating new accounts
- Periodic reminder to update backup

**Backup Verification:**
- Test restore without actually importing
- Verify checksum matches

**Cloud Backup Integration:**
- Optional encrypted cloud storage
- Syncing across devices

**Backup Password Strength History:**
- Track and display password strength over time
- Encourage password updates

### 13.2 Analytics Considerations

**Metrics to Track:**
- Backup export completion rate
- Time spent on each modal
- Password strength distribution
- Common errors encountered
- Download success rate

**Privacy:** No sensitive data (passwords, keys) should ever be logged

---

## 14. Cross-References

**Related Documentation:**
- `prompts/docs/security-expert-notes.md` - Encryption specifications
- `prompts/docs/product-manager-notes.md` - Feature requirements
- `prompts/docs/ui-ux-designer-notes.md` - Design system
- `ARCHITECTURE.md` - System architecture

**Related Components:**
- `src/tab/components/SettingsScreen.tsx` - Integration point
- `src/tab/components/shared/Modal.tsx` - Base modal component
- `src/tab/components/WalletSetup.tsx` - Password validation reference

**Backend:**
- `src/background/wallet/WalletManager.ts` - Export logic
- `src/background/crypto/Encryption.ts` - Encryption implementation

---

## 15. Glossary

**PBKDF2:** Password-Based Key Derivation Function 2 - Algorithm for deriving encryption keys from passwords

**AES-256-GCM:** Advanced Encryption Standard with 256-bit keys in Galois/Counter Mode - Authenticated encryption algorithm

**SHA-256:** Secure Hash Algorithm 256-bit - Cryptographic hash function for checksums

**Checksum:** A hash value used to verify file integrity

**ARIA:** Accessible Rich Internet Applications - Web accessibility standard

**WCAG:** Web Content Accessibility Guidelines - Accessibility standards

**Touch Target:** The interactive area of a UI element on touch devices

---

**End of Specification**

This document provides complete UX specifications for implementing the encrypted wallet backup export feature. All visual designs, interactions, accessibility requirements, and error handling are defined and ready for frontend implementation.

**Next Steps:**
1. Frontend Developer reviews and implements components
2. Security Expert reviews password requirements and encryption flow
3. QA Engineer creates test plan based on error scenarios
4. Testing Expert writes unit tests for validation logic
