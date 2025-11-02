# Bitcoin Privacy Enhancement - Frontend Implementation Plan

**Version:** 1.0
**Created:** October 21, 2025
**Status:** Implementation-Ready
**Owner:** Frontend Developer
**Related Documents:**
- `BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md` - Technical overview
- `PRIVACY_ENHANCEMENT_PRD.md` - Product requirements
- `PRIVACY_UI_UX_DESIGN_SPEC.md` - Complete UI/UX design specification (50,000+ words)
- `PRIVACY_UI_VISUAL_GUIDE.md` - Visual reference guide
- `PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md` - Backend plan

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [New Shared Components](#new-shared-components)
4. [Settings Screen - Privacy Mode Section](#settings-screen---privacy-mode-section)
5. [Receive Screen - Privacy Indicators](#receive-screen---privacy-indicators)
6. [Contacts Privacy System](#contacts-privacy-system)
7. [Send Screen - Privacy Indicators](#send-screen---privacy-indicators)
8. [State Management Strategy](#state-management-strategy)
9. [Message Passing Integration](#message-passing-integration)
10. [Testing Strategy](#testing-strategy)
11. [Implementation Checklist](#implementation-checklist)

---

## Executive Summary

### Scope

This plan covers **all frontend/UI changes** required to implement privacy enhancements. The backend team has already implemented:
- Change address generation
- UTXO randomization
- Contacts privacy tracking (backend message handlers)
- Privacy settings storage

**Frontend Responsibilities:**
1. Create new shared components (PrivacyBadge, InfoBox, PrivacyTooltip, ToggleSwitch)
2. Add Privacy Mode section to SettingsScreen
3. Enhance ReceiveScreen with auto-generation and privacy indicators
4. Add contacts privacy warnings and badges
5. Add send screen privacy indicators
6. Integrate with backend via message passing

### Key Features

**Phase 2 (Default Privacy) - P0/P1:**
1. ✅ Receive screen auto-generation banner (3-second auto-dismiss)
2. ✅ Address list privacy badges (Fresh vs. Previously Used)
3. ✅ Contact card privacy badges (Rotation vs. Reuses Address)
4. ✅ Send screen contact warnings (single-address reuse)
5. ✅ Send screen contact success indicators (xpub rotation)

**Phase 3 (Optional Privacy Mode) - P2:**
6. ✅ Privacy Mode settings section (3 toggles)
7. ✅ Round number randomization indicator (send screen)

### Component Hierarchy

```
New Shared Components:
├─ PrivacyBadge.tsx (success/warning/info variants)
├─ InfoBox.tsx (info/success/warning variants)
├─ PrivacyTooltip.tsx (contextual help)
└─ ToggleSwitch.tsx (settings toggles)

Modified Components:
├─ SettingsScreen.tsx (+ Privacy Mode section)
├─ ReceiveScreen.tsx (+ privacy banner, address badges)
├─ ContactCard.tsx (+ privacy badges, reusage counter)
├─ ContactsScreen.tsx (+ privacy tip box)
├─ SendScreen.tsx (+ contact warnings, xpub success, change indicator)
└─ TransactionRow.tsx (+ contact privacy badges)
```

### Estimated Effort

| Component | Effort | Priority |
|-----------|--------|----------|
| **Shared Components** | 2 days | P0 |
| **Receive Screen** | 1 day | P1 |
| **Contact Privacy** | 2 days | P0 |
| **Send Screen** | 1 day | P1 |
| **Settings Screen** | 1 day | P2 |
| **Testing** | 1 day | All |
| **Total** | **8 days** | - |

---

## Architecture Overview

### Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│                         Shared Components                        │
│  (src/tab/components/shared/)                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PrivacyBadge.tsx                                               │
│  ├─ Props: variant, label, icon, size, tooltip                 │
│  └─ Used by: ContactCard, ReceiveScreen, TransactionRow        │
│                                                                  │
│  InfoBox.tsx                                                    │
│  ├─ Props: variant, title, content, icon, action               │
│  └─ Used by: ReceiveScreen, SendScreen, ContactsScreen,        │
│              SettingsScreen                                      │
│                                                                  │
│  PrivacyTooltip.tsx                                             │
│  ├─ Props: content, children, placement, maxWidth              │
│  └─ Used by: PrivacyBadge, InfoBox, SendScreen                 │
│                                                                  │
│  ToggleSwitch.tsx                                               │
│  ├─ Props: checked, onChange, label, description, disabled     │
│  └─ Used by: SettingsScreen (Privacy Mode section)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                │                 │                │
         ▼                ▼                 ▼                ▼
┌──────────────┐ ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
│ReceiveScreen │ │ContactCard    │ │SendScreen    │ │SettingsScreen│
│              │ │ContactsScreen │ │              │ │              │
│              │ │TransactionRow │ │              │ │              │
└──────────────┘ └───────────────┘ └──────────────┘ └──────────────┘
```

### Data Flow - Privacy Features

```
┌──────────────────────────────────────────────────────────────────┐
│                          Frontend                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SettingsScreen                                                   │
│  ├─ Fetch: GET_PRIVACY_SETTINGS                                  │
│  ├─ Display: 3 toggles (state from backend)                      │
│  └─ Update: UPDATE_PRIVACY_SETTINGS (on toggle change)           │
│                                                                   │
│  ReceiveScreen                                                    │
│  ├─ On mount: GENERATE_ADDRESS (auto-generate fresh address)     │
│  ├─ Show banner: "New address generated for privacy" (3s)        │
│  └─ Address list: Badge each address (fresh vs used)             │
│                                                                   │
│  ContactCard                                                      │
│  ├─ If xpub: Show "✓ Privacy: Rotation" badge (green)           │
│  ├─ If single-address: Show "⚠️ Reuses Address" badge (amber)   │
│  └─ If reusageCount >= 5: Show upgrade suggestion                │
│                                                                   │
│  SendScreen (Contact Selection)                                  │
│  ├─ If single-address contact selected:                          │
│  │  └─ Show amber warning box (reusage count, upgrade tip)       │
│  ├─ If xpub contact selected:                                    │
│  │  ├─ Fetch: GET_NEXT_CONTACT_ADDRESS                           │
│  │  └─ Show green success box (address rotation active)          │
│  └─ On send success: INCREMENT_CONTACT_USAGE                     │
│                                                                   │
│  TransactionRow                                                   │
│  ├─ Match contact by address (check cachedAddresses)             │
│  └─ Show small privacy badge next to contact name                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│  Background Worker   │   │  chrome.storage.local│
│  Message Handlers    │   │                      │
│                      │   │  - privacySettings   │
│  - GET_PRIVACY_...   │   │  - contacts (updated)│
│  - UPDATE_PRIVACY... │   │                      │
│  - GET_NEXT_CONTACT..│   │                      │
│  - INCREMENT_CONTACT.│   │                      │
└──────────────────────┘   └──────────────────────┘
```

---

## New Shared Components

### 1. PrivacyBadge Component

**File:** `src/tab/components/shared/PrivacyBadge.tsx` (NEW)

**Purpose:** Visual indicator for privacy status across all screens.

#### TypeScript Interface

```typescript
interface PrivacyBadgeProps {
  variant: 'success' | 'warning' | 'info';
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  tooltip?: string;
  className?: string;
}
```

#### Implementation

```typescript
import React from 'react';

interface PrivacyBadgeProps {
  variant: 'success' | 'warning' | 'info';
  label: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
  tooltip?: string;
  className?: string;
}

const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  variant,
  label,
  icon,
  size = 'md',
  tooltip,
  className = '',
}) => {
  // Variant styles
  const variantStyles = {
    success: 'bg-green-500/15 border-green-500/30 text-green-400',
    warning: 'bg-amber-500/12 border-amber-500/30 text-amber-300',
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  // Icon size
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3 h-3';

  const badge = (
    <span
      className={`inline-flex items-center gap-1 ${variantStyles[variant]} border ${sizeStyles[size]} rounded ${className}`}
      role="status"
      aria-label={tooltip || label}
    >
      {icon && <span className={iconSize}>{icon}</span>}
      {label}
    </span>
  );

  // Wrap in tooltip if provided
  if (tooltip) {
    return (
      <PrivacyTooltip content={tooltip} placement="top">
        {badge}
      </PrivacyTooltip>
    );
  }

  return badge;
};

export default PrivacyBadge;

// Helper icons (import from heroicons or use SVG)
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

export const ExclamationTriangleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);
```

#### Usage Examples

```typescript
// Success badge (xpub contact)
<PrivacyBadge
  variant="success"
  label="Privacy: Rotation"
  icon={<CheckCircleIcon />}
  tooltip="This contact uses address rotation for enhanced privacy"
/>

// Warning badge (single-address contact)
<PrivacyBadge
  variant="warning"
  label="Reuses Address"
  icon={<ExclamationTriangleIcon />}
  tooltip="This contact reuses the same address, reducing privacy"
/>

// Fresh address badge
<PrivacyBadge
  variant="success"
  label="Fresh"
  icon={<SparklesIcon />}
  size="sm"
/>

// Used address badge
<PrivacyBadge
  variant="warning"
  label="Previously Used"
  icon={<ExclamationTriangleIcon />}
  size="sm"
/>
```

---

### 2. InfoBox Component

**File:** `src/tab/components/shared/InfoBox.tsx` (NEW)

**Purpose:** Educational content, privacy tips, feature explanations.

#### TypeScript Interface

```typescript
interface InfoBoxProps {
  variant: 'info' | 'success' | 'warning';
  title: string;
  content: string | React.ReactNode;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}
```

#### Implementation

```typescript
import React from 'react';

interface InfoBoxProps {
  variant: 'info' | 'success' | 'warning';
  title: string;
  content: string | React.ReactNode;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const InfoBox: React.FC<InfoBoxProps> = ({
  variant,
  title,
  content,
  icon,
  action,
  dismissible = false,
  onDismiss,
  className = '',
}) => {
  // Variant styles
  const variantStyles = {
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      titleColor: 'text-blue-300',
      contentColor: 'text-blue-200',
      iconColor: 'text-blue-400',
      buttonColor: 'text-blue-300 hover:text-blue-200',
    },
    success: {
      bg: 'bg-green-500/15',
      border: 'border-green-500/30',
      titleColor: 'text-green-300',
      contentColor: 'text-green-200',
      iconColor: 'text-green-400',
      buttonColor: 'text-green-300 hover:text-green-200',
    },
    warning: {
      bg: 'bg-amber-500/12',
      border: 'border-amber-500/30',
      titleColor: 'text-amber-300',
      contentColor: 'text-amber-200',
      iconColor: 'text-amber-300',
      buttonColor: 'text-amber-300 hover:text-amber-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`p-4 ${styles.bg} border ${styles.border} rounded-lg ${className}`}
      role="region"
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        {icon && (
          <div className={`${styles.iconColor} flex-shrink-0 mt-0.5`}>
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="flex-1">
          <p className={`text-sm ${styles.titleColor} font-semibold`}>{title}</p>
          <div className={`text-sm ${styles.contentColor} mt-1`}>
            {typeof content === 'string' ? <p>{content}</p> : content}
          </div>

          {/* Action button */}
          {action && (
            <button
              onClick={action.onClick}
              className={`mt-3 text-sm ${styles.buttonColor} underline font-semibold transition-colors`}
            >
              {action.label}
            </button>
          )}
        </div>

        {/* Dismiss button */}
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className={`${styles.iconColor} transition-colors flex-shrink-0`}
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default InfoBox;

// Helper icon components
export const InformationCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
```

#### Usage Examples

```typescript
// Privacy active banner (success)
<InfoBox
  variant="success"
  title="Privacy Active"
  content="New address generated for privacy. Each transaction uses a unique address."
  icon={<CheckCircleIcon className="w-5 h-5" />}
/>

// Privacy notice (warning)
<InfoBox
  variant="warning"
  title="Privacy Notice"
  content="This contact uses a single address. Reusing addresses reduces privacy."
  icon={<ExclamationTriangleIcon className="w-5 h-5" />}
  action={{
    label: 'Learn More About Contact Privacy',
    onClick: () => openPrivacyGuide('contacts-privacy'),
  }}
/>

// Privacy tips (info, dismissible)
<InfoBox
  variant="info"
  title="Privacy Tip: Use Xpub Contacts"
  content="Xpub contacts automatically rotate addresses for each payment, preventing transaction linking."
  icon={<InformationCircleIcon className="w-5 h-5" />}
  dismissible={true}
  onDismiss={() => setShowTip(false)}
  action={{
    label: 'Learn How to Get an Xpub',
    onClick: () => openPrivacyGuide('xpub-contacts'),
  }}
/>
```

---

### 3. PrivacyTooltip Component

**File:** `src/tab/components/shared/PrivacyTooltip.tsx` (NEW)

**Purpose:** Contextual help for privacy indicators.

#### TypeScript Interface

```typescript
interface PrivacyTooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
  className?: string;
}
```

#### Implementation

```typescript
import React, { useState } from 'react';

interface PrivacyTooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
  className?: string;
}

const PrivacyTooltip: React.FC<PrivacyTooltipProps> = ({
  content,
  children,
  placement = 'top',
  maxWidth = '280px',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const placementStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`absolute z-50 ${placementStyles[placement]}`}
          role="tooltip"
          style={{ maxWidth }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
            <div className="text-sm text-gray-300">
              {typeof content === 'string' ? <p>{content}</p> : content}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyTooltip;
```

#### Usage Examples

```typescript
// Tooltip on icon
<PrivacyTooltip
  content="This contact uses address rotation. Each payment goes to a new address for enhanced privacy."
  placement="top"
>
  <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
</PrivacyTooltip>

// Tooltip on badge
<PrivacyTooltip
  content="This address has received funds before. Reusing it links your transactions publicly on the blockchain."
>
  <PrivacyBadge variant="warning" label="Previously Used" />
</PrivacyTooltip>
```

---

### 4. ToggleSwitch Component

**File:** `src/tab/components/shared/ToggleSwitch.tsx` (NEW)

**Purpose:** Privacy Mode settings toggles.

#### TypeScript Interface

```typescript
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  tradeoffWarning?: string;
  disabled?: boolean;
  className?: string;
}
```

#### Implementation

```typescript
import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  tradeoffWarning?: string;
  disabled?: boolean;
  className?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  tradeoffWarning,
  disabled = false,
  className = '',
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      className={`flex items-center justify-between p-4 bg-gray-850 border border-gray-700 rounded-lg ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Label and description */}
      <div className="flex-1 mr-4">
        <label
          htmlFor={`toggle-${label.replace(/\s/g, '-').toLowerCase()}`}
          className="text-sm font-semibold text-gray-300 cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
        {tradeoffWarning && (
          <div className="flex items-center gap-1 mt-2">
            <ExclamationTriangleIcon className="w-3 h-3 text-amber-300 flex-shrink-0" />
            <p className="text-xs text-amber-300">Trade-off: {tradeoffWarning}</p>
          </div>
        )}
      </div>

      {/* Toggle */}
      <button
        id={`toggle-${label.replace(/\s/g, '-').toLowerCase()}`}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`toggle-${label.replace(/\s/g, '-').toLowerCase()}-label`}
        onClick={handleToggle}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-950 ${
          checked ? 'bg-bitcoin' : 'bg-gray-700'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
```

#### Usage Examples

```typescript
// Randomize Round Amounts toggle
<ToggleSwitch
  checked={privacySettings.randomizeRoundAmounts}
  onChange={(checked) => handleUpdateSetting('randomizeRoundAmounts', checked)}
  label="Randomize Round Amounts"
  description="Add ±0.1% to round numbers (0.1 BTC → 0.10023 BTC) to prevent change address detection."
/>

// API Timing toggle with trade-off
<ToggleSwitch
  checked={privacySettings.randomizeApiTiming}
  onChange={(checked) => handleUpdateSetting('randomizeApiTiming', checked)}
  label="Randomize API Request Timing"
  description="Add 1-5s delays between blockchain queries to prevent timing-based address clustering."
  tradeoffWarning="Slower balance updates (5-20 seconds longer)"
/>
```

---

## Settings Screen - Privacy Mode Section

**File:** `src/tab/components/SettingsScreen.tsx`

**Location:** Add after "Accounts" section (line ~228), before "Security" section (line ~230)

### State Management

```typescript
// Add to existing state in SettingsScreen
const [privacySettings, setPrivacySettings] = useState({
  randomizeRoundAmounts: false,
  randomizeApiTiming: false,
  delayBroadcast: false,
});
const [privacySectionExpanded, setPrivacySectionExpanded] = useState(false);
const [isLoadingPrivacySettings, setIsLoadingPrivacySettings] = useState(true);
```

### Fetch Privacy Settings (useEffect)

```typescript
// Add to existing useEffects
useEffect(() => {
  const fetchPrivacySettings = async () => {
    try {
      const settings = await sendMessage<{
        randomizeRoundAmounts: boolean;
        randomizeApiTiming: boolean;
        delayBroadcast: boolean;
      }>(MessageType.GET_PRIVACY_SETTINGS);

      setPrivacySettings(settings);
    } catch (err) {
      console.error('Failed to fetch privacy settings:', err);
      // Use defaults
      setPrivacySettings({
        randomizeRoundAmounts: false,
        randomizeApiTiming: false,
        delayBroadcast: false,
      });
    } finally {
      setIsLoadingPrivacySettings(false);
    }
  };

  fetchPrivacySettings();
}, [sendMessage]);
```

### Update Privacy Setting Handler

```typescript
const handleUpdatePrivacySetting = async (
  key: keyof typeof privacySettings,
  value: boolean
) => {
  try {
    // Optimistic update
    setPrivacySettings((prev) => ({ ...prev, [key]: value }));

    // Send to backend
    await sendMessage(MessageType.UPDATE_PRIVACY_SETTINGS, {
      [key]: value,
    });
  } catch (err) {
    console.error('Failed to update privacy setting:', err);
    // Revert on error
    setPrivacySettings((prev) => ({ ...prev, [key]: !value }));
  }
};
```

### Privacy Mode Section JSX

```typescript
{/* Privacy Mode Section - Insert after Accounts section */}
<div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm mb-6">
  {/* Section Header (Collapsible) */}
  <button
    onClick={() => setPrivacySectionExpanded(!privacySectionExpanded)}
    className="w-full flex items-center justify-between p-6 hover:bg-gray-800 transition-colors rounded-xl"
  >
    <div className="flex items-center gap-3">
      {/* Shield icon */}
      <svg className="w-6 h-6 text-bitcoin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
      <div className="text-left">
        <h2 className="text-lg font-bold text-white">Privacy Mode</h2>
        <p className="text-xs text-gray-500">Optional advanced privacy features</p>
      </div>
    </div>
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform ${
        privacySectionExpanded ? 'rotate-180' : ''
      }`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  </button>

  {/* Section Content (Expanded) */}
  {privacySectionExpanded && (
    <div className="px-6 pb-6 space-y-4">
      {isLoadingPrivacySettings ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-700 border-t-bitcoin"></div>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">
            Individual Privacy Features:
          </p>

          {/* Toggle 1: Randomize Round Amounts */}
          <ToggleSwitch
            checked={privacySettings.randomizeRoundAmounts}
            onChange={(checked) => handleUpdatePrivacySetting('randomizeRoundAmounts', checked)}
            label="Randomize Round Amounts"
            description="Add ±0.1% to round numbers (0.1 BTC → 0.10023 BTC) to prevent change address detection."
          />

          {/* Toggle 2: Randomize API Timing */}
          <ToggleSwitch
            checked={privacySettings.randomizeApiTiming}
            onChange={(checked) => handleUpdatePrivacySetting('randomizeApiTiming', checked)}
            label="Randomize API Request Timing"
            description="Add 1-5s delays between blockchain queries to prevent timing-based address clustering."
            tradeoffWarning="Slower balance updates (5-20 seconds longer)"
          />

          {/* Toggle 3: Delay Broadcast */}
          <ToggleSwitch
            checked={privacySettings.delayBroadcast}
            onChange={(checked) => handleUpdatePrivacySetting('delayBroadcast', checked)}
            label="Delay Transaction Broadcast"
            description="Wait 5-30s before broadcasting transactions to prevent timing correlation."
            tradeoffWarning="Slower transaction sending (5-30 seconds delay)"
          />

          {/* Privacy Tips Info Box */}
          <InfoBox
            variant="info"
            title="Privacy Tips"
            content={
              <ul className="list-disc list-inside space-y-1">
                <li>Default protections always active (unique change addresses, randomized UTXO selection)</li>
                <li>Use Tor browser for maximum network privacy</li>
                <li>Avoid sending round amounts when possible</li>
                <li>Use new address for each transaction</li>
                <li>Use xpub contacts for address rotation</li>
              </ul>
            }
            icon={<InformationCircleIcon className="w-5 h-5" />}
            action={{
              label: 'Learn More About Bitcoin Privacy →',
              onClick: () => {
                // Open PRIVACY_GUIDE.md in new tab
                window.open('https://github.com/your-repo/PRIVACY_GUIDE.md', '_blank');
              },
            }}
          />
        </>
      )}
    </div>
  )}
</div>
```

---

## Receive Screen - Privacy Indicators

**File:** `src/tab/components/ReceiveScreen.tsx`

### State Management

```typescript
// Add to existing state
const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);
const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
const [generationError, setGenerationError] = useState<string | null>(null);
```

### Auto-Generate Address on Mount

```typescript
// Add useEffect for auto-generation
useEffect(() => {
  const generateFreshAddress = async () => {
    setIsGeneratingAddress(true);
    setGenerationError(null);

    try {
      // Generate new address
      await chrome.runtime.sendMessage({
        type: 'GENERATE_ADDRESS',
        payload: {
          accountIndex: account.index,
          isChange: false, // External (receive) address
        },
      });

      // Show privacy banner
      setShowPrivacyBanner(true);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setShowPrivacyBanner(false);
      }, 3000);

      // Trigger account refresh (parent component should handle)
      // This will update the addresses list
    } catch (err) {
      console.error('Failed to generate address:', err);
      setGenerationError(
        err instanceof Error ? err.message : 'Failed to generate address'
      );
    } finally {
      setIsGeneratingAddress(false);
    }
  };

  // Auto-generate on mount
  generateFreshAddress();
}, [account.index]); // Only run when account changes
```

### Privacy Banner JSX

```typescript
{/* Privacy Banner - Insert at top of main content */}
{showPrivacyBanner && (
  <div className="mb-6 p-4 bg-green-500/15 border border-green-500/30 rounded-lg animate-slideInFromTop">
    <div className="flex items-center gap-3">
      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm text-green-300 font-semibold">
          New address generated for privacy
        </p>
        <p className="text-xs text-green-200 mt-1">
          Using a fresh address for each transaction protects your financial privacy.
        </p>
      </div>
      <button
        onClick={() => setShowPrivacyBanner(false)}
        className="text-green-400 hover:text-green-300 transition-colors"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  </div>
)}

{/* Loading State */}
{isGeneratingAddress && (
  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="flex items-center gap-3">
      <div className="animate-spin">
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </div>
      <p className="text-sm text-blue-300">Generating new address...</p>
    </div>
  </div>
)}

{/* Error State */}
{generationError && (
  <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
    <div className="flex items-start gap-3">
      <svg className="w-5 h-5 text-red-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <div className="flex-1">
        <p className="text-sm text-red-300 font-semibold">Failed to generate address</p>
        <p className="text-xs text-red-200 mt-1">{generationError}</p>
        <p className="text-xs text-red-200 mt-2">
          Showing your most recent address instead. You can still use it, but generating a new one is recommended for privacy.
        </p>
        <button
          onClick={() => {
            // Retry generation
            setGenerationError(null);
            // Re-run generation (trigger useEffect or call function directly)
          }}
          className="mt-3 text-sm text-red-300 hover:text-red-200 underline font-semibold"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
)}
```

### Enhanced Address List with Privacy Badges

```typescript
{/* Replace existing address list (line ~175-202) */}
{receivingAddresses.length > 1 && (
  <div className={isModal ? "" : "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6"}>
    <h3 className="text-lg font-semibold text-white mb-4">All Receiving Addresses</h3>
    <div className="space-y-3">
      {receivingAddresses
        .slice()
        .reverse()
        .map((addr, index) => {
          const isCurrent = index === 0;
          const isUsed = addr.used;

          return (
            <div
              key={addr.address}
              className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Address number and badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs text-gray-500">
                      Address #{receivingAddresses.length - index}
                      {isCurrent && (
                        <span className="ml-2 text-bitcoin font-semibold">(Current)</span>
                      )}
                    </p>
                    {/* Privacy badge */}
                    {isUsed ? (
                      <PrivacyBadge
                        variant="warning"
                        label="Previously Used"
                        icon={<ExclamationTriangleIcon />}
                        size="sm"
                        tooltip="This address has received funds before. Reusing it links your transactions publicly on the blockchain."
                      />
                    ) : (
                      <PrivacyBadge
                        variant="success"
                        label="Fresh"
                        icon={<SparklesIcon />}
                        size="sm"
                        tooltip="This address has not been used yet. Using a fresh address for each transaction protects your privacy."
                      />
                    )}
                  </div>

                  {/* Address */}
                  <p className="text-sm font-mono text-gray-300 break-all">
                    {addr.address}
                  </p>

                  {/* Privacy warning for used addresses */}
                  {isUsed && (
                    <div className="mt-3 p-3 bg-amber-500/8 border border-amber-500/20 rounded-lg">
                      <p className="text-xs text-amber-200">
                        <strong className="font-semibold">Privacy Risk:</strong> This address has
                        received funds before. Reusing it links your transactions publicly on the
                        blockchain.{' '}
                        <button
                          onClick={() => {
                            // Open privacy guide
                            window.open('https://github.com/your-repo/PRIVACY_GUIDE.md#address-reuse', '_blank');
                          }}
                          className="text-amber-300 hover:text-amber-200 underline"
                        >
                          Learn why
                        </button>
                      </p>
                    </div>
                  )}
                </div>

                {/* Copy button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(addr.address);
                    // Show copied toast
                  }}
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Copy address"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
    </div>
  </div>
)}
```

### Animation for Banner (Add to CSS or Tailwind config)

```css
/* Add to your global CSS or Tailwind config */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideInFromTop {
  animation: slideInFromTop 300ms ease-out;
}
```

---

## Contacts Privacy System

### 1. ContactCard Component Updates

**File:** `src/tab/components/shared/ContactCard.tsx`

#### Add Privacy Badge to Contact Card

```typescript
// Add after contact name and category (around line 145-150)
{/* Privacy Badge */}
{hasXpub ? (
  <PrivacyBadge
    variant="success"
    label="Privacy: Rotation"
    icon={<CheckCircleIcon />}
    tooltip="This contact uses address rotation. Each payment goes to a new address for enhanced privacy."
  />
) : hasSingleAddress ? (
  <PrivacyBadge
    variant="warning"
    label="Reuses Address"
    icon={<ExclamationTriangleIcon />}
    tooltip="Address reuse reduces privacy. All payments to this contact are publicly linked on the blockchain. Consider asking for an xpub for automatic address rotation."
  />
) : null}
```

#### Add Reusage Counter for Single-Address Contacts

```typescript
// Add after transaction count (around line 204-220)
{/* Reusage counter for single-address contacts */}
{hasSingleAddress && contact.reusageCount !== undefined && contact.reusageCount > 0 && (
  <div className="mt-2">
    {contact.reusageCount >= 5 ? (
      <div className="flex items-center gap-2">
        <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
        <span className="text-xs text-amber-300">
          Sent {contact.reusageCount} times — high privacy risk
        </span>
      </div>
    ) : (
      <div className="text-xs text-gray-500">
        Sent {contact.reusageCount} time{contact.reusageCount === 1 ? '' : 's'} to this address
      </div>
    )}
  </div>
)}

{/* Upgrade suggestion for high reusage */}
{hasSingleAddress && contact.reusageCount !== undefined && contact.reusageCount >= 5 && (
  <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded">
    <div className="flex items-center gap-2">
      <span className="text-base">💡</span>
      <p className="text-xs text-blue-300">
        Consider upgrading to xpub contact for automatic address rotation
      </p>
    </div>
  </div>
)}
```

---

### 2. ContactsScreen Component Updates

**File:** `src/tab/components/ContactsScreen.tsx`

#### Add Privacy Tip Info Box

```typescript
// Add at the top of contacts list (before contact cards)
{/* Privacy Tip (Dismissible) */}
<InfoBox
  variant="info"
  title="Privacy Tip: Use Xpub Contacts"
  content={
    <>
      <p>
        Xpub contacts automatically rotate addresses for each payment, preventing
        transaction linking. Ask your contacts for an extended public key (xpub)
        instead of a single address.
      </p>
    </>
  }
  icon={<InformationCircleIcon className="w-5 h-5" />}
  dismissible={true}
  onDismiss={() => {
    // Store dismissal in localStorage
    localStorage.setItem('contactsPrivacyTipDismissed', 'true');
    setShowPrivacyTip(false);
  }}
  action={{
    label: 'Learn How to Get an Xpub',
    onClick: () => {
      window.open('https://github.com/your-repo/PRIVACY_GUIDE.md#xpub-contacts', '_blank');
    },
  }}
  className="mb-6"
/>
```

#### State for Tip Dismissal

```typescript
// Add state
const [showPrivacyTip, setShowPrivacyTip] = useState(
  !localStorage.getItem('contactsPrivacyTipDismissed')
);
```

---

### 3. SendScreen Component Updates

**File:** `src/tab/components/SendScreen.tsx`

#### State for Contact Privacy

```typescript
// Add to existing state
const [nextContactAddress, setNextContactAddress] = useState<{
  address: string;
  addressIndex: number;
} | null>(null);
```

#### Fetch Next Contact Address (for xpub contacts)

```typescript
// Add useEffect to fetch next address when xpub contact selected
useEffect(() => {
  const fetchNextContactAddress = async () => {
    if (selectedContact && selectedContact.xpub) {
      try {
        const result = await sendMessage<{
          address: string;
          addressIndex: number;
        }>(MessageType.GET_NEXT_CONTACT_ADDRESS, {
          contactId: selectedContact.id,
        });

        setNextContactAddress(result);
        setToAddress(result.address); // Auto-fill address field
      } catch (err) {
        console.error('Failed to get next contact address:', err);
        setNextContactAddress(null);
      }
    } else {
      setNextContactAddress(null);
    }
  };

  fetchNextContactAddress();
}, [selectedContact, sendMessage]);
```

#### Single-Address Contact Warning

```typescript
{/* Contact Warning - Insert after recipient address field */}
{selectedContact && selectedContact.address && !selectedContact.xpub && !addressError && (
  <div className="mt-4 p-4 bg-amber-500/12 border-l-4 border-amber-500 rounded-lg">
    <div className="flex items-start gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-amber-300 font-semibold">
          Privacy Notice: Address Reuse
        </p>
        <p className="text-sm text-amber-200 mt-1">
          This contact uses a single address. Sent {selectedContact.reusageCount || 0} time
          {selectedContact.reusageCount === 1 ? '' : 's'} before.
        </p>
        <p className="text-xs text-amber-200 mt-2">
          <strong>Why this matters:</strong> Reusing addresses links all your payments
          to this contact publicly on the blockchain, reducing your financial privacy.
        </p>

        {/* Nested tip box */}
        <div className="mt-3 flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <InformationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-300">
            <strong>Tip:</strong> Ask {selectedContact.name} for an extended public key (xpub)
            to enable automatic address rotation. Each payment will go to a new address.
          </p>
        </div>

        <button
          onClick={() => {
            window.open('https://github.com/your-repo/PRIVACY_GUIDE.md#contacts-privacy', '_blank');
          }}
          className="mt-3 text-sm text-amber-300 hover:text-amber-200 underline font-semibold"
        >
          Learn More About Contact Privacy
        </button>
      </div>
    </div>
  </div>
)}
```

#### Xpub Contact Success Indicator

```typescript
{/* Xpub Contact Success - Insert after recipient address field */}
{selectedContact && selectedContact.xpub && nextContactAddress && !addressError && (
  <div className="mt-4 p-4 bg-green-500/15 border-l-4 border-green-500 rounded-lg">
    <div className="flex items-start gap-3">
      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-green-300 font-semibold">
          Privacy Active: Address Rotation
        </p>
        <p className="text-sm text-green-200 mt-1">
          Sending to {selectedContact.name}'s address #{nextContactAddress.addressIndex + 1}.
          Each payment uses a new address for enhanced privacy.
        </p>
        <p className="font-mono text-xs text-green-100 mt-2 p-2 bg-green-500/10 rounded">
          {nextContactAddress.address}
        </p>
      </div>
    </div>
  </div>
)}
```

#### Increment Contact Usage After Send

```typescript
// Add to handleSend function after successful transaction
if (selectedContact) {
  try {
    await sendMessage(MessageType.INCREMENT_CONTACT_USAGE, {
      contactId: selectedContact.id,
      isXpub: !!selectedContact.xpub,
    });
  } catch (err) {
    console.error('Failed to increment contact usage:', err);
    // Non-critical, don't block UI
  }
}
```

---

### 4. TransactionRow Component Updates

**File:** `src/tab/components/shared/TransactionRow.tsx`

#### Add Privacy Badge Next to Contact Name

```typescript
// Update contact name display (find where contact name is rendered)
{contactMatch && (
  <div className="flex items-center gap-2">
    <span className="text-sm text-gray-300">{contactMatch.name}</span>
    {/* Privacy badge */}
    {contactMatch.xpub ? (
      <PrivacyBadge
        variant="success"
        label="✓"
        size="sm"
        tooltip={`Sent to ${contactMatch.name} using address rotation (privacy enabled)`}
      />
    ) : contactMatch.address ? (
      <PrivacyBadge
        variant="warning"
        label="⚠️"
        size="sm"
        tooltip={`Sent to ${contactMatch.name} using single address (reused ${
          contactMatch.reusageCount || 0
        } times)`}
      />
    ) : null}
  </div>
)}
```

#### Fix Contact Matching for Xpub Contacts

```typescript
// Update contact matching logic to check cachedAddresses
const findContactByAddress = (address: string): Contact | undefined => {
  return contacts.find((contact) => {
    // Match single address
    if (contact.address === address) {
      return true;
    }
    // Match xpub cached addresses
    if (contact.cachedAddresses && contact.cachedAddresses.includes(address)) {
      return true;
    }
    return false;
  });
};

// Use this function instead of simple address === contact.address check
```

---

## Send Screen - Privacy Indicators

**File:** `src/tab/components/SendScreen.tsx`

### Change Address Indicator

```typescript
{/* Change Address Indicator - Insert in transaction summary section */}
{amount && !amountError && !addressError && (
  <div className="mb-6 bg-gray-900 rounded-lg p-4">
    <h3 className="text-sm font-semibold text-gray-300 mb-3">Transaction Summary</h3>

    {/* ... existing summary content ... */}

    {/* Change address privacy indicator */}
    <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="w-4 h-4 text-green-400" />
        <p className="text-xs text-green-300">
          Using unique change address for privacy
        </p>
        <PrivacyTooltip
          content="Your change will go to a fresh address, preventing transaction linking. This is a Bitcoin best practice that protects your financial privacy by ensuring your transactions cannot be easily connected."
        >
          <InformationCircleIcon className="w-4 h-4 text-green-400 cursor-help" />
        </PrivacyTooltip>
      </div>
    </div>
  </div>
)}
```

### Round Number Randomization Indicator (Phase 3)

```typescript
// State for round number detection
const [isRoundNumber, setIsRoundNumber] = useState(false);
const [randomizedAmount, setRandomizedAmount] = useState<number | null>(null);

// Detect round numbers
useEffect(() => {
  if (amount) {
    const amountSats = parseInt(amount, 10);
    const amountStr = amountSats.toString();

    // Count trailing zeros
    let trailingZeros = 0;
    for (let i = amountStr.length - 1; i >= 0; i--) {
      if (amountStr[i] === '0') {
        trailingZeros++;
      } else {
        break;
      }
    }

    // Round if >= 3 trailing zeros
    const isRound = trailingZeros >= 3;
    setIsRoundNumber(isRound);

    // Generate randomized amount if privacy mode enabled
    if (isRound && privacySettings.randomizeRoundAmounts) {
      const variance = (Math.random() * 2 - 1) * 0.001; // ±0.1%
      const randomized = Math.round(amountSats * (1 + variance));
      setRandomizedAmount(randomized);
    } else {
      setRandomizedAmount(null);
    }
  } else {
    setIsRoundNumber(false);
    setRandomizedAmount(null);
  }
}, [amount, privacySettings.randomizeRoundAmounts]);

// JSX: Round Number Indicator
{isRoundNumber && randomizedAmount && (
  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
    <div className="flex items-start gap-2">
      <InformationCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-xs text-blue-300">
          Amount randomized for privacy: <strong className="font-mono">{randomizedAmount} sats</strong>
        </p>
        <p className="text-xs text-blue-200 mt-1">
          Small variance (+{((randomizedAmount - parseInt(amount, 10)) / parseInt(amount, 10) * 100).toFixed(2)}%) added to prevent change detection.
        </p>
        <button
          onClick={() => {
            // Disable randomization for this transaction
            setRandomizedAmount(null);
          }}
          className="mt-2 text-xs text-blue-300 hover:text-blue-200 underline"
        >
          Use exact amount instead
        </button>
      </div>
    </div>
  </div>
)}
```

---

## State Management Strategy

### Option 1: Local Component State (RECOMMENDED)

**Pros:**
- Simple, no extra boilerplate
- Privacy settings only used in SettingsScreen
- Contact privacy handled per-component

**Cons:**
- Settings need to be fetched in each component that uses them
- Slight duplication of fetch logic

**Implementation:**
Each component fetches what it needs:
- SettingsScreen: Fetches and manages privacy settings
- ReceiveScreen: Auto-generates address on mount
- ContactCard: Displays badges based on contact data
- SendScreen: Fetches next contact address when needed

**This is the recommended approach for this feature set.**

---

### Option 2: React Context (If Needed Later)

**Only use if:**
- Privacy settings are needed across many components
- Frequent updates to settings require real-time sync

**Implementation:**

```typescript
// src/tab/contexts/PrivacyContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType } from '../../shared/types';

interface PrivacySettings {
  randomizeRoundAmounts: boolean;
  randomizeApiTiming: boolean;
  delayBroadcast: boolean;
}

interface PrivacyContextValue {
  settings: PrivacySettings;
  updateSetting: (key: keyof PrivacySettings, value: boolean) => Promise<void>;
  isLoading: boolean;
}

const PrivacyContext = createContext<PrivacyContextValue | undefined>(undefined);

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sendMessage } = useBackgroundMessaging();
  const [settings, setSettings] = useState<PrivacySettings>({
    randomizeRoundAmounts: false,
    randomizeApiTiming: false,
    delayBroadcast: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await sendMessage<PrivacySettings>(MessageType.GET_PRIVACY_SETTINGS);
        setSettings(result);
      } catch (err) {
        console.error('Failed to fetch privacy settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [sendMessage]);

  const updateSetting = async (key: keyof PrivacySettings, value: boolean) => {
    // Optimistic update
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      await sendMessage(MessageType.UPDATE_PRIVACY_SETTINGS, { [key]: value });
    } catch (err) {
      console.error('Failed to update privacy setting:', err);
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !value }));
      throw err;
    }
  };

  return (
    <PrivacyContext.Provider value={{ settings, updateSetting, isLoading }}>
      {children}
    </PrivacyContext.Provider>
  );
};

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within PrivacyProvider');
  }
  return context;
};
```

**Usage:**

```typescript
// Wrap app in provider (src/tab/App.tsx)
import { PrivacyProvider } from './contexts/PrivacyContext';

<PrivacyProvider>
  <YourApp />
</PrivacyProvider>

// Use in components
import { usePrivacy } from '../contexts/PrivacyContext';

const { settings, updateSetting, isLoading } = usePrivacy();
```

**Note:** For this feature set, **Option 1 (local state) is sufficient**. Only implement Context if future features require shared privacy state.

---

## Message Passing Integration

### Message Types to Add

**File:** `src/shared/types/index.ts`

```typescript
export enum MessageType {
  // ... existing types ...

  // Privacy settings
  GET_PRIVACY_SETTINGS = 'GET_PRIVACY_SETTINGS',
  UPDATE_PRIVACY_SETTINGS = 'UPDATE_PRIVACY_SETTINGS',

  // Contact privacy
  GET_NEXT_CONTACT_ADDRESS = 'GET_NEXT_CONTACT_ADDRESS',
  INCREMENT_CONTACT_USAGE = 'INCREMENT_CONTACT_USAGE',
}
```

### Message Handler Usage Examples

#### Get Privacy Settings

```typescript
const settings = await sendMessage<{
  randomizeRoundAmounts: boolean;
  randomizeApiTiming: boolean;
  delayBroadcast: boolean;
}>(MessageType.GET_PRIVACY_SETTINGS);
```

#### Update Privacy Setting

```typescript
await sendMessage(MessageType.UPDATE_PRIVACY_SETTINGS, {
  randomizeRoundAmounts: true,
});

// Or update multiple
await sendMessage(MessageType.UPDATE_PRIVACY_SETTINGS, {
  randomizeRoundAmounts: true,
  randomizeApiTiming: false,
});
```

#### Get Next Contact Address (Xpub Rotation)

```typescript
const result = await sendMessage<{
  address: string;
  addressIndex: number;
}>(MessageType.GET_NEXT_CONTACT_ADDRESS, {
  contactId: contact.id,
});

console.log(`Next address: ${result.address} (index ${result.addressIndex})`);
```

#### Increment Contact Usage

```typescript
// After successful send
await sendMessage(MessageType.INCREMENT_CONTACT_USAGE, {
  contactId: selectedContact.id,
  isXpub: !!selectedContact.xpub,
});
```

### Error Handling Pattern

```typescript
try {
  const result = await sendMessage<ReturnType>(MessageType.SOME_ACTION, payload);
  // Handle success
} catch (err) {
  console.error('Failed to perform action:', err);
  const errorMessage = err instanceof Error ? err.message : 'Unknown error';

  // Show error to user
  setError(errorMessage);

  // Revert optimistic updates if needed
}
```

---

## Testing Strategy

### Unit Tests (React Testing Library)

**Test Files:**
- `src/tab/components/shared/__tests__/PrivacyBadge.test.tsx`
- `src/tab/components/shared/__tests__/InfoBox.test.tsx`
- `src/tab/components/shared/__tests__/PrivacyTooltip.test.tsx`
- `src/tab/components/shared/__tests__/ToggleSwitch.test.tsx`

**Key Test Cases:**

```typescript
describe('PrivacyBadge', () => {
  it('renders success variant correctly', () => {
    render(<PrivacyBadge variant="success" label="Privacy: Rotation" />);
    expect(screen.getByText('Privacy: Rotation')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveClass('bg-green-500/15');
  });

  it('shows tooltip on hover', async () => {
    render(
      <PrivacyBadge
        variant="success"
        label="Fresh"
        tooltip="This is a fresh address"
      />
    );

    fireEvent.mouseEnter(screen.getByText('Fresh'));
    expect(await screen.findByRole('tooltip')).toHaveTextContent('This is a fresh address');
  });
});

describe('ToggleSwitch', () => {
  it('calls onChange when toggled', () => {
    const handleChange = jest.fn();
    render(
      <ToggleSwitch
        checked={false}
        onChange={handleChange}
        label="Test Toggle"
      />
    );

    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('displays trade-off warning when provided', () => {
    render(
      <ToggleSwitch
        checked={false}
        onChange={() => {}}
        label="Test"
        tradeoffWarning="Slower performance"
      />
    );

    expect(screen.getByText(/Slower performance/)).toBeInTheDocument();
  });
});
```

---

### Integration Tests

**Test Files:**
- `src/tab/components/__tests__/SettingsScreen-privacy.test.tsx`
- `src/tab/components/__tests__/ReceiveScreen-privacy.test.tsx`
- `src/tab/components/__tests__/SendScreen-contacts-privacy.test.tsx`

**Key Test Flows:**

```typescript
describe('SettingsScreen - Privacy Mode', () => {
  it('fetches and displays privacy settings', async () => {
    // Mock backend response
    mockSendMessage.mockResolvedValue({
      randomizeRoundAmounts: true,
      randomizeApiTiming: false,
      delayBroadcast: false,
    });

    render(<SettingsScreen {...props} />);

    // Expand section
    fireEvent.click(screen.getByText('Privacy Mode'));

    // Verify settings loaded
    expect(await screen.findByText('Randomize Round Amounts')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Randomize Round Amounts/ })).toBeChecked();
  });

  it('updates privacy setting on toggle', async () => {
    render(<SettingsScreen {...props} />);

    fireEvent.click(screen.getByText('Privacy Mode'));

    const toggle = await screen.findByRole('switch', { name: /Randomize Round Amounts/ });
    fireEvent.click(toggle);

    // Verify backend called
    expect(mockSendMessage).toHaveBeenCalledWith(
      MessageType.UPDATE_PRIVACY_SETTINGS,
      { randomizeRoundAmounts: true }
    );
  });
});

describe('ReceiveScreen - Auto-Generation', () => {
  it('auto-generates address on mount', async () => {
    render(<ReceiveScreen account={mockAccount} onBack={() => {}} />);

    // Verify address generation called
    await waitFor(() => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: 'GENERATE_ADDRESS',
        payload: {
          accountIndex: mockAccount.index,
          isChange: false,
        },
      });
    });

    // Verify privacy banner shown
    expect(screen.getByText('New address generated for privacy')).toBeInTheDocument();
  });

  it('shows privacy badges on address list', () => {
    const accountWithAddresses = {
      ...mockAccount,
      addresses: [
        { address: 'addr1', used: false, index: 0 },
        { address: 'addr2', used: true, index: 1 },
      ],
    };

    render(<ReceiveScreen account={accountWithAddresses} onBack={() => {}} />);

    expect(screen.getByText('Fresh')).toBeInTheDocument();
    expect(screen.getByText('Previously Used')).toBeInTheDocument();
  });
});

describe('SendScreen - Contact Privacy', () => {
  it('shows warning for single-address contact', async () => {
    const singleAddressContact = {
      id: '1',
      name: 'Alice',
      address: 'tb1q...',
      reusageCount: 3,
    };

    render(<SendScreen {...props} />);

    // Select contact
    fireEvent.change(screen.getByPlaceholderText('tb1q...'), {
      target: { value: singleAddressContact.address },
    });

    // Verify warning shown
    expect(await screen.findByText('Privacy Notice: Address Reuse')).toBeInTheDocument();
    expect(screen.getByText(/Sent 3 times before/)).toBeInTheDocument();
  });

  it('shows success indicator for xpub contact', async () => {
    const xpubContact = {
      id: '2',
      name: 'Bob',
      xpub: 'tpub...',
      cachedAddresses: ['addr1', 'addr2'],
    };

    mockSendMessage.mockResolvedValue({
      address: 'addr1',
      addressIndex: 0,
    });

    render(<SendScreen {...props} />);

    // Select xpub contact (trigger via contact picker or direct state)
    // ... selection logic ...

    // Verify success indicator
    expect(await screen.findByText('Privacy Active: Address Rotation')).toBeInTheDocument();
  });
});
```

---

### Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('all interactive elements are keyboard accessible', () => {
    render(<SettingsScreen {...props} />);

    const toggle = screen.getByRole('switch');
    toggle.focus();
    expect(toggle).toHaveFocus();

    fireEvent.keyDown(toggle, { key: 'Enter' });
    // Verify toggle changed
  });

  it('privacy badges have descriptive aria-labels', () => {
    render(<PrivacyBadge variant="success" label="Fresh" tooltip="Fresh address" />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Fresh address');
  });

  it('tooltips are announced to screen readers', () => {
    render(
      <PrivacyTooltip content="This is helpful info">
        <span>Hover me</span>
      </PrivacyTooltip>
    );

    const trigger = screen.getByText('Hover me');
    fireEvent.focus(trigger);

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
  });
});
```

---

### User Interaction Tests

**Manual Testing Checklist:**

- [ ] Settings Screen
  - [ ] Privacy Mode section expands/collapses smoothly
  - [ ] Toggles respond immediately (no lag)
  - [ ] Optimistic updates work (toggle changes before backend confirms)
  - [ ] Revert on error works correctly
  - [ ] Privacy tips info box displays correctly
  - [ ] "Learn More" link opens in new tab

- [ ] Receive Screen
  - [ ] Privacy banner appears on mount
  - [ ] Banner auto-dismisses after 3 seconds
  - [ ] Manual dismiss (X button) works
  - [ ] Address list shows correct badges (Fresh vs Previously Used)
  - [ ] Privacy warning displays for used addresses
  - [ ] "Learn why" link works
  - [ ] Loading state displays during generation
  - [ ] Error state displays and "Try Again" works

- [ ] Contact Privacy
  - [ ] ContactCard shows correct badge (Rotation vs Reuses Address)
  - [ ] Reusage counter displays correctly
  - [ ] High reusage warning (>= 5) shows upgrade suggestion
  - [ ] Contacts screen privacy tip displays
  - [ ] Privacy tip dismissal persists across sessions

- [ ] Send Screen - Contact Warnings
  - [ ] Single-address contact warning displays
  - [ ] Reusage count shows in warning
  - [ ] Nested tip box displays
  - [ ] Xpub contact success indicator displays
  - [ ] Next address fetched correctly
  - [ ] Address index displayed correctly
  - [ ] Contact usage incremented after successful send
  - [ ] Change address indicator displays in summary
  - [ ] Round number indicator displays (if privacy mode ON)

- [ ] Transaction History
  - [ ] Contact privacy badges display next to names
  - [ ] Xpub contacts match all cached addresses
  - [ ] Badge tooltips work

---

## Implementation Checklist

### Phase 2: Default Privacy Features (6 days)

#### Day 1-2: Shared Components

- [ ] **PrivacyBadge Component** (4 hours)
  - [ ] Create `PrivacyBadge.tsx` with success/warning/info variants
  - [ ] Add icon components (CheckCircle, ExclamationTriangle, Sparkles)
  - [ ] Implement tooltip integration
  - [ ] Write unit tests
  - [ ] Test accessibility (keyboard, screen reader)

- [ ] **InfoBox Component** (3 hours)
  - [ ] Create `InfoBox.tsx` with info/success/warning variants
  - [ ] Implement dismissible functionality
  - [ ] Add action button support
  - [ ] Write unit tests
  - [ ] Test accessibility

- [ ] **PrivacyTooltip Component** (2 hours)
  - [ ] Create `PrivacyTooltip.tsx` with placement options
  - [ ] Implement hover/focus triggers
  - [ ] Add ESC key dismissal
  - [ ] Write unit tests
  - [ ] Test accessibility

- [ ] **ToggleSwitch Component** (3 hours)
  - [ ] Create `ToggleSwitch.tsx` with ON/OFF states
  - [ ] Add trade-off warning support
  - [ ] Implement disabled state
  - [ ] Write unit tests
  - [ ] Test accessibility (keyboard, role="switch")

#### Day 3: Receive Screen Privacy Indicators

- [ ] **Auto-Generation** (3 hours)
  - [ ] Add state for privacy banner, generation status
  - [ ] Implement useEffect for auto-generation on mount
  - [ ] Call GENERATE_ADDRESS message handler
  - [ ] Show privacy banner with 3-second auto-dismiss
  - [ ] Add manual dismiss button
  - [ ] Implement loading state
  - [ ] Implement error state with retry
  - [ ] Write integration tests

- [ ] **Address List Badges** (3 hours)
  - [ ] Update address list to use PrivacyBadge
  - [ ] Add "Fresh" badge for unused addresses
  - [ ] Add "Previously Used" badge with warning for used addresses
  - [ ] Add privacy warning box for used addresses
  - [ ] Add "Learn why" link to privacy guide
  - [ ] Write component tests
  - [ ] Test accessibility

#### Day 4-5: Contacts Privacy System

- [ ] **ContactCard Updates** (3 hours)
  - [ ] Add PrivacyBadge for xpub contacts (success)
  - [ ] Add PrivacyBadge for single-address contacts (warning)
  - [ ] Add reusage counter display
  - [ ] Add high reusage warning (>= 5 sends)
  - [ ] Add upgrade suggestion for high reusage
  - [ ] Write component tests
  - [ ] Test accessibility

- [ ] **ContactsScreen Updates** (2 hours)
  - [ ] Add privacy tip InfoBox at top
  - [ ] Implement dismissible state (localStorage)
  - [ ] Add "Learn How to Get an Xpub" link
  - [ ] Write integration tests
  - [ ] Test tip dismissal persistence

- [ ] **SendScreen - Contact Warnings** (4 hours)
  - [ ] Add state for nextContactAddress
  - [ ] Implement useEffect to fetch next address for xpub contacts
  - [ ] Add single-address contact warning box
  - [ ] Display reusage count in warning
  - [ ] Add nested tip box (upgrade to xpub)
  - [ ] Add "Learn More" link
  - [ ] Add xpub contact success indicator
  - [ ] Display next address and index
  - [ ] Implement INCREMENT_CONTACT_USAGE after send
  - [ ] Write integration tests
  - [ ] Test accessibility

- [ ] **TransactionRow Updates** (2 hours)
  - [ ] Update contact matching to check cachedAddresses
  - [ ] Add small PrivacyBadge next to contact name
  - [ ] Add tooltips to badges
  - [ ] Write component tests
  - [ ] Test xpub contact matching

#### Day 6: Send Screen Privacy Indicators

- [ ] **Change Address Indicator** (2 hours)
  - [ ] Add change address privacy indicator to transaction summary
  - [ ] Add tooltip with explanation
  - [ ] Style with green success colors
  - [ ] Write component tests
  - [ ] Test accessibility

- [ ] **Testing & Bug Fixes** (4 hours)
  - [ ] Run full integration test suite
  - [ ] Manual testing checklist (all Phase 2 features)
  - [ ] Fix any bugs found
  - [ ] Accessibility audit (keyboard, screen reader)
  - [ ] Cross-browser testing (Chrome, Firefox, Edge)

---

### Phase 3: Optional Privacy Mode (2 days)

#### Day 7: Settings Screen - Privacy Mode Section

- [ ] **Privacy Mode Section** (4 hours)
  - [ ] Add state for privacySettings, privacySectionExpanded
  - [ ] Implement useEffect to fetch GET_PRIVACY_SETTINGS
  - [ ] Add collapsible section header with shield icon
  - [ ] Add 3 ToggleSwitches (round amounts, API timing, broadcast delay)
  - [ ] Implement handleUpdatePrivacySetting with optimistic updates
  - [ ] Add Privacy Tips InfoBox with "Learn More" link
  - [ ] Add loading state for settings fetch
  - [ ] Write integration tests
  - [ ] Test accessibility

- [ ] **Round Number Randomization Indicator** (3 hours)
  - [ ] Add state for isRoundNumber, randomizedAmount
  - [ ] Implement useEffect to detect round numbers (>= 3 trailing zeros)
  - [ ] Generate randomized amount if privacy mode enabled
  - [ ] Display blue info box with randomized amount and variance
  - [ ] Add "Use exact amount instead" override button
  - [ ] Write component tests
  - [ ] Test integration with privacy settings

#### Day 8: Final Testing & Documentation

- [ ] **Integration Testing** (3 hours)
  - [ ] Test full privacy settings flow (Settings → SendScreen)
  - [ ] Test round number randomization with setting ON/OFF
  - [ ] Test settings persistence across page reloads
  - [ ] Test error handling and revert on failure
  - [ ] Verify all message passing works correctly

- [ ] **Documentation** (2 hours)
  - [ ] Update `frontend-developer-notes.md` with:
    - [ ] New shared components (PrivacyBadge, InfoBox, etc.)
    - [ ] Privacy feature implementations
    - [ ] Integration patterns
    - [ ] Known issues or limitations
  - [ ] Add inline code comments
  - [ ] Create component usage examples

- [ ] **Final Checklist** (2 hours)
  - [ ] Code review self-check
  - [ ] Accessibility final audit
  - [ ] Performance check (no unnecessary re-renders)
  - [ ] Browser compatibility check
  - [ ] User acceptance testing with 3-5 users

---

## Dependencies and Risks

### NPM Dependencies

**All dependencies already available in package.json:**
- React 18 ✅
- Tailwind CSS ✅
- TypeScript ✅
- React Testing Library ✅

**No new dependencies required.**

---

### Browser Compatibility

**Target Browsers:**
- Chrome 88+ (Manifest V3 support)
- Edge 88+
- Firefox 109+ (Manifest V3 support)

**Potential Issues:**
- **Tooltip positioning:** May need polyfill for `position: sticky` edge cases
- **Animations:** `prefers-reduced-motion` support varies (use CSS fallback)

**Mitigation:**
- Test on all three browsers
- Use CSS prefixes where needed
- Provide graceful degradation for animations

---

### Performance Considerations

**Potential Issues:**
1. **Auto-generation on every ReceiveScreen mount** - Could be slow if address generation is expensive
2. **Fetching next contact address** - Network delay when selecting xpub contact
3. **Privacy settings fetch** - Initial load delay in Settings screen

**Mitigation:**
1. Address generation is fast (<100ms) - acceptable
2. Show loading state while fetching, cache result in component state
3. Show loading spinner, fetch in useEffect (async, doesn't block render)

**Expected Impact:** Minimal - all features are async and non-blocking.

---

### Technical Risks

#### Risk 1: Privacy Banner Auto-Dismiss Timing

**Risk:** User might not see banner if they navigate away quickly.

**Mitigation:**
- 3-second timer is standard UX pattern
- Manual dismiss (X button) allows user control
- Banner is informational, not critical (doesn't block workflow)

---

#### Risk 2: Contact Matching Failure (Xpub)

**Risk:** Transaction history might not match xpub contacts if cachedAddresses incomplete.

**Mitigation:**
- Backend ensures cachedAddresses has sufficient coverage (50-100 addresses)
- Contact matching checks all cached addresses
- If match fails, transaction shows as "Unknown" (not critical)

---

#### Risk 3: Privacy Settings Not Synced

**Risk:** Settings updated in one tab, but not reflected in another open tab.

**Mitigation:**
- Settings are fetched from backend on component mount (always fresh)
- Chrome storage changes don't need cross-tab sync (backend is source of truth)
- If sync needed later, use chrome.storage.onChanged listener

---

## Conclusion

This frontend implementation plan provides **complete specifications** for all privacy UI features. The plan is:

✅ **Implementation-ready** - Detailed component code, state management, and integration patterns
✅ **Testable** - Comprehensive testing strategy with unit, integration, and accessibility tests
✅ **Accessible** - WCAG AA compliant with keyboard and screen reader support
✅ **Well-documented** - Inline comments, usage examples, and integration patterns
✅ **Risk-mitigated** - Identified risks with mitigation strategies

**Total Estimated Effort:** 8 days (Phase 2: 6 days, Phase 3: 2 days)

**Next Steps:**

1. ✅ Review and approve this plan
2. Begin Day 1-2: Create shared components (PrivacyBadge, InfoBox, PrivacyTooltip, ToggleSwitch)
3. Day 3: Implement Receive Screen privacy indicators
4. Day 4-5: Implement Contacts privacy system
5. Day 6: Implement Send Screen indicators + testing
6. Day 7: Implement Settings Screen Privacy Mode section
7. Day 8: Final testing and documentation

**Ready for implementation.** 🚀

---

**Document Owner:** Frontend Developer
**Last Updated:** October 21, 2025
**Version:** 1.0
**Status:** ✅ Implementation-Ready
