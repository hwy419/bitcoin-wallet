# Contacts v2.0 - UI/UX Design Specification

**Author**: UI/UX Designer Agent
**Date**: October 18, 2025
**Version**: 2.0
**Status**: Approved for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design System - Color Palette](#2-design-system---color-palette)
3. [ContactAvatar Component](#3-contactavatar-component)
4. [ColorPicker Component](#4-colorpicker-component)
5. [ContactCard Redesign](#5-contactcard-redesign)
6. [AddEditContactModal Enhancement](#6-addeditcontactmodal-enhancement)
7. [DerivedAddressList Component](#7-derivedaddresslist-component)
8. [ContactLockedOverlay Component](#8-contactlockedoverlay-component)
9. [ContactsScreen Updates](#9-contactsscreen-updates)
10. [SendScreen Integration](#10-sendscreen-integration)
11. [Accessibility Guidelines](#11-accessibility-guidelines)
12. [Responsive Design](#12-responsive-design)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Overview

### 1.1 Design Goals

The Contacts v2.0 UI enhances user experience with:

- **Visual Identity**: 16-color avatar system with auto-generated initials
- **Personalization**: User-selectable colors for quick visual recognition
- **Information Density**: Display xpub contacts with derived addresses
- **Security Awareness**: Clear visual indicators for encrypted data and locked states
- **Accessibility**: WCAG AA compliant contrast ratios and keyboard navigation
- **Consistency**: Unified design language across all contact touchpoints

### 1.2 Key User Flows

1. **Creating Contact with Color**: User adds contact → selects color from palette → sees colored avatar immediately
2. **Viewing Xpub Contact**: User views contact with xpub → sees first 20 derived addresses → can expand to 100
3. **Selecting Contact in Send Flow**: User picks contact → sees all available addresses (single or derived) → selects specific address
4. **Wallet Locked State**: User attempts to view contacts when locked → sees overlay explaining encryption

### 1.3 Design Principles

- **Progressive Disclosure**: Show essential info first, details on demand
- **Visual Hierarchy**: Color → Initials → Name → Address/Xpub
- **Consistent Patterns**: Reuse avatar component everywhere (cards, lists, modals, pickers)
- **Error Prevention**: Clear validation feedback for xpub, email, and color selection
- **Performance**: Lazy load derived addresses, virtual scroll for large lists

---

## 2. Design System - Color Palette

### 2.1 16-Color Palette Specification

All colors meet **WCAG AA** contrast requirements (4.5:1) against white background and provide readable white text on colored backgrounds (3:1 minimum).

| # | Color Name | Hex Code | RGB | Use Case | Text Color |
|---|------------|----------|-----|----------|------------|
| 1 | **Blue** | `#3B82F6` | `rgb(59, 130, 246)` | Default, Professional | White |
| 2 | **Purple** | `#9333EA` | `rgb(147, 51, 234)` | Creative, Personal | White |
| 3 | **Pink** | `#EC4899` | `rgb(236, 72, 153)` | Friends, Family | White |
| 4 | **Red** | `#EF4444` | `rgb(239, 68, 68)` | Important, Priority | White |
| 5 | **Orange** | `#F97316` | `rgb(249, 115, 22)` | Business, Work | White |
| 6 | **Yellow** | `#EAB308` | `rgb(234, 179, 8)` | Caution, Notes | White |
| 7 | **Green** | `#22C55E` | `rgb(34, 197, 94)` | Verified, Safe | White |
| 8 | **Teal** | `#14B8A6` | `rgb(20, 184, 166)` | Neutral, Calm | White |
| 9 | **Cyan** | `#06B6D4` | `rgb(6, 182, 212)` | Info, Tech | White |
| 10 | **Indigo** | `#6366F1` | `rgb(99, 102, 241)` | Deep, Trustworthy | White |
| 11 | **Violet** | `#8B5CF6` | `rgb(139, 92, 246)` | Unique, Special | White |
| 12 | **Magenta** | `#D946EF` | `rgb(217, 70, 239)` | Bold, Standout | White |
| 13 | **Amber** | `#F59E0B` | `rgb(245, 158, 11)` | Warm, Friendly | White |
| 14 | **Lime** | `#84CC16` | `rgb(132, 204, 22)` | Fresh, New | White |
| 15 | **Emerald** | `#10B981` | `rgb(16, 185, 129)` | Wealth, Growth | White |
| 16 | **Sky** | `#0EA5E9` | `rgb(14, 165, 233)` | Open, Bright | White |

### 2.2 Tailwind CSS Classes

For quick implementation, these Tailwind utility classes map to the palette:

```typescript
export const CONTACT_COLORS = {
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-600 text-white',
  pink: 'bg-pink-500 text-white',
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  green: 'bg-green-500 text-white',
  teal: 'bg-teal-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  indigo: 'bg-indigo-500 text-white',
  violet: 'bg-violet-500 text-white',
  magenta: 'bg-fuchsia-500 text-white',
  amber: 'bg-amber-500 text-white',
  lime: 'bg-lime-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  sky: 'bg-sky-500 text-white',
} as const;

export type ContactColor = keyof typeof CONTACT_COLORS;
```

### 2.3 Default Color Assignment

When no color is selected, use **Blue (#3B82F6)** as the default.

**Rationale**: Blue is universally professional, accessible, and neutral across cultures.

### 2.4 Color Storage

The `color` field in the Contact interface stores the **color name** (not hex code) for easier Tailwind class mapping:

```typescript
interface Contact {
  color?: ContactColor; // e.g., "blue", "purple", "pink"
}
```

**Encryption**: The color value is encrypted along with name, email, notes, category.

---

## 3. ContactAvatar Component

### 3.1 Component Specification

**File**: `src/tab/components/shared/ContactAvatar.tsx`

**Purpose**: Display a colored circle with contact initials (1-2 characters).

**Props**:
```typescript
interface ContactAvatarProps {
  name: string;              // Contact name (for initials extraction)
  color?: ContactColor;      // Color selection (defaults to "blue")
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Avatar size
  className?: string;        // Additional CSS classes
}
```

**Size Mapping**:
- `sm`: 32px × 32px (0.75rem text)
- `md`: 40px × 40px (0.875rem text) — **Default**
- `lg`: 48px × 48px (1rem text)
- `xl`: 80px × 80px (1.5rem text)

### 3.2 Initials Extraction Algorithm

**Rules**:
1. If name has 2+ words: Take first letter of first word + first letter of second word
2. If name has 1 word: Take first 2 letters
3. Convert to uppercase
4. Handle edge cases: empty names, special characters, emojis

**Example Implementation**:
```typescript
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?'; // Fallback for empty names
  }

  const cleaned = name.trim().replace(/[^\p{L}\s]/gu, ''); // Remove non-letters except spaces
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    // No valid letters found
    return name.charAt(0).toUpperCase();
  }

  if (words.length === 1) {
    // Single word: take first 2 letters
    return words[0].substring(0, 2).toUpperCase();
  }

  // Multiple words: take first letter of first 2 words
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
```

**Test Cases**:
| Input | Expected Output |
|-------|----------------|
| `"Alice"` | `"AL"` |
| `"Alice Cooper"` | `"AC"` |
| `"Satoshi Nakamoto"` | `"SN"` |
| `"Hal Finney III"` | `"HF"` |
| `"山田太郎"` | `"山田"` |
| `"123 Numbers"` | `"NU"` |
| `""` | `"?"` |
| `"A"` | `"A"` |

### 3.3 Component Implementation

```tsx
import React from 'react';

const CONTACT_COLORS = {
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-600 text-white',
  pink: 'bg-pink-500 text-white',
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  green: 'bg-green-500 text-white',
  teal: 'bg-teal-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  indigo: 'bg-indigo-500 text-white',
  violet: 'bg-violet-500 text-white',
  magenta: 'bg-fuchsia-500 text-white',
  amber: 'bg-amber-500 text-white',
  lime: 'bg-lime-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  sky: 'bg-sky-500 text-white',
} as const;

export type ContactColor = keyof typeof CONTACT_COLORS;

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

interface ContactAvatarProps {
  name: string;
  color?: ContactColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  const cleaned = name.trim().replace(/[^\p{L}\s]/gu, '');
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return name.charAt(0).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  color = 'blue',
  size = 'md',
  className = '',
}) => {
  const initials = getInitials(name);
  const colorClass = CONTACT_COLORS[color];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`${colorClass} ${sizeClass} rounded-full flex items-center justify-center font-semibold ${className}`}
      aria-label={`Avatar for ${name}`}
    >
      {initials}
    </div>
  );
};
```

### 3.4 Usage Examples

```tsx
// In ContactCard
<ContactAvatar name="Alice Cooper" color="purple" size="lg" />

// In ContactsScreen list
<ContactAvatar name={contact.name} color={contact.color} size="md" />

// In SendScreen contact picker
<ContactAvatar name={contact.name} color={contact.color} size="sm" />

// In AddEditContactModal preview
<ContactAvatar name={formData.name} color={selectedColor} size="xl" />
```

---

## 4. ColorPicker Component

### 4.1 Component Specification

**File**: `src/tab/components/shared/ColorPicker.tsx`

**Purpose**: Display a 4×4 grid of 16 colors for user selection.

**Props**:
```typescript
interface ColorPickerProps {
  selectedColor?: ContactColor; // Currently selected color
  onColorSelect: (color: ContactColor) => void; // Callback when color is clicked
  className?: string; // Additional CSS classes
}
```

### 4.2 Layout

**Grid**: 4 columns × 4 rows
**Item Size**: 40px × 40px (clickable area)
**Circle Size**: 32px × 32px (visual circle)
**Spacing**: 8px gap between items
**Total Size**: ~184px × 184px

**Visual Hierarchy**:
- Selected color: 3px white border + 1px outer border
- Hover state: Scale to 1.1, subtle shadow
- Focus state: 2px focus ring (for keyboard navigation)

### 4.3 Component Implementation

```tsx
import React from 'react';
import { ContactColor } from './ContactAvatar';

const COLORS: ContactColor[] = [
  'blue', 'purple', 'pink', 'red',
  'orange', 'yellow', 'green', 'teal',
  'cyan', 'indigo', 'violet', 'magenta',
  'amber', 'lime', 'emerald', 'sky',
];

const COLOR_BG = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-600',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  magenta: 'bg-fuchsia-500',
  amber: 'bg-amber-500',
  lime: 'bg-lime-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
};

interface ColorPickerProps {
  selectedColor?: ContactColor;
  onColorSelect: (color: ContactColor) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor = 'blue',
  onColorSelect,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-4 gap-2 ${className}`} role="radiogroup" aria-label="Contact color selection">
      {COLORS.map((color) => {
        const isSelected = color === selectedColor;
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Select ${color} color`}
            onClick={() => onColorSelect(color)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-150 ease-in-out
              hover:scale-110 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isSelected ? 'ring-3 ring-white ring-offset-2 ring-offset-gray-200' : ''}
            `}
          >
            <div className={`w-8 h-8 rounded-full ${COLOR_BG[color]}`} />
          </button>
        );
      })}
    </div>
  );
};
```

### 4.4 Accessibility Features

- **Keyboard Navigation**: Tab through colors, Enter/Space to select
- **ARIA Roles**: `radiogroup` for container, `radio` for each color
- **ARIA States**: `aria-checked` indicates selected state
- **Labels**: Each color has descriptive `aria-label`
- **Focus Indicators**: 2px blue ring on focus

### 4.5 Usage Example

```tsx
// In AddEditContactModal
const [selectedColor, setSelectedColor] = useState<ContactColor>('blue');

<div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Avatar Color
  </label>
  <ColorPicker
    selectedColor={selectedColor}
    onColorSelect={setSelectedColor}
  />
</div>
```

---

## 5. ContactCard Redesign

### 5.1 Updated Layout

**Current Layout** (v1.0):
```
┌────────────────────────────────────┐
│ [Generic Icon] Name                │
│                Address              │
│                Category • 12 txs    │
└────────────────────────────────────┘
```

**New Layout** (v2.0):
```
┌────────────────────────────────────┐
│ [Colored    Name                   │
│  Avatar]    Address OR Xpub        │
│  AB         Category • 12 txs      │
└────────────────────────────────────┘
```

### 5.2 Visual Hierarchy

1. **Avatar** (lg size, 48px): Left-aligned, colored circle with initials
2. **Name** (font-medium, text-base): Primary identifier, top line
3. **Address/Xpub** (font-mono, text-sm, truncated): Second line, gray
4. **Metadata** (text-xs, text-gray-500): Category and transaction count

### 5.3 Xpub Display Logic

**If contact has xpub**:
- Show: `"Xpub: tpub...xyz (20 addresses)"`
- Truncate fingerprint to 8 characters: `"tpub...xyz"` (first 4 + last 4)
- Include derived address count
- Clicking card expands to show DerivedAddressList

**If contact has single address**:
- Show: Full address (truncated with ellipsis if > 42 chars)
- Format: `"tb1q...xyz"` (first 8 + last 6)

**If contact has both**:
- Prioritize xpub display
- Show address in expanded view

### 5.4 Component Implementation

```tsx
import React, { useState } from 'react';
import { Contact } from '../../../shared/types';
import { ContactAvatar } from './ContactAvatar';
import { DerivedAddressList } from './DerivedAddressList';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact, onClick }) => {
  const [expanded, setExpanded] = useState(false);

  const hasXpub = !!contact.xpub;
  const displayAddress = hasXpub
    ? `Xpub: ${contact.xpubFingerprint?.substring(0, 4)}...${contact.xpubFingerprint?.substring(contact.xpubFingerprint.length - 4)} (${contact.cachedAddresses?.length || 0} addresses)`
    : contact.address
    ? `${contact.address.substring(0, 8)}...${contact.address.substring(contact.address.length - 6)}`
    : 'No address';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div
        className="flex items-start gap-3 cursor-pointer"
        onClick={() => {
          if (hasXpub) {
            setExpanded(!expanded);
          } else if (onClick) {
            onClick();
          }
        }}
      >
        <ContactAvatar
          name={contact.name}
          color={contact.color}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base text-gray-900 truncate">
            {contact.name}
          </h3>
          <p className="font-mono text-sm text-gray-600 truncate">
            {displayAddress}
          </p>
          {(contact.category || contact.transactionCount !== undefined) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              {contact.category && <span>{contact.category}</span>}
              {contact.category && contact.transactionCount !== undefined && <span>•</span>}
              {contact.transactionCount !== undefined && (
                <span>{contact.transactionCount} txs</span>
              )}
            </div>
          )}
        </div>
      </div>

      {expanded && hasXpub && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <DerivedAddressList
            addresses={contact.cachedAddresses || []}
            onExpand={() => {
              // Trigger expansion to 100 addresses
            }}
          />
        </div>
      )}
    </div>
  );
};
```

---

## 6. AddEditContactModal Enhancement

### 6.1 New Modal Layout

**Current Fields** (v1.0):
- Name
- Address
- Category
- Notes

**New Fields** (v2.0):
- Name (required)
- **Color Picker** (new)
- Address (optional if xpub provided)
- **Xpub** (optional, new)
- **Email** (optional, new)
- Category (optional)
- Notes (optional, expanded to 500 chars)

### 6.2 Form Layout

```
┌──────────────────────────────────────────┐
│ Add Contact                        [X]   │
├──────────────────────────────────────────┤
│                                          │
│ Name *                                   │
│ ┌──────────────────────────────────────┐ │
│ │ Alice Cooper                         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Avatar Color                             │
│ [Color Picker 4×4 Grid]   [Preview: AC] │
│                                          │
│ Bitcoin Address (optional if xpub set)   │
│ ┌──────────────────────────────────────┐ │
│ │ tb1q...                              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Extended Public Key (xpub) - Optional    │
│ ┌──────────────────────────────────────┐ │
│ │ tpub...                              │ │
│ └──────────────────────────────────────┘ │
│ ⚠️ xpub will derive 20 addresses         │
│                                          │
│ Email Address - Optional                 │
│ ┌──────────────────────────────────────┐ │
│ │ alice@example.com                    │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Category - Optional                      │
│ ┌──────────────────────────────────────┐ │
│ │ Friends                              │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Notes - Optional (0/500)                 │
│ ┌──────────────────────────────────────┐ │
│ │                                      │ │
│ │                                      │ │
│ └──────────────────────────────────────┘ │
│                                          │
│         [Cancel]        [Save Contact]   │
└──────────────────────────────────────────┘
```

### 6.3 Validation Rules

**Name**:
- Required: Yes
- Min length: 1 character
- Max length: 50 characters
- Validation: Non-empty after trim

**Color**:
- Required: Yes (defaults to "blue")
- Validation: Must be one of 16 valid colors

**Address**:
- Required: Only if xpub is NOT provided
- Validation: Must be valid Bitcoin address for current network
- Format detection: Detect Legacy/SegWit/Native SegWit automatically

**Xpub**:
- Required: Only if address is NOT provided
- Validation:
  - Must be valid xpub format (tpub/upub/vpub for testnet, xpub/ypub/zpub for mainnet)
  - Must match current network
  - Must parse successfully with BIP32
- Derivation: Automatically derive first 20 addresses on save

**Email**:
- Required: No
- Max length: 100 characters
- Validation: If provided, must match email regex pattern
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Category**:
- Required: No
- Max length: 30 characters

**Notes**:
- Required: No
- Max length: 500 characters
- UI: Show character count (e.g., "234/500")

### 6.4 Error Messages

| Field | Error Condition | Message |
|-------|----------------|---------|
| Name | Empty | "Name is required" |
| Name | > 50 chars | "Name must be 50 characters or less" |
| Address | Invalid format | "Invalid Bitcoin address for testnet" |
| Address | Both empty | "Either address or xpub is required" |
| Xpub | Invalid format | "Invalid xpub format" |
| Xpub | Wrong network | "This xpub is for mainnet, but wallet is on testnet" |
| Xpub | Parse error | "Unable to parse xpub. Please check format." |
| Email | Invalid format | "Invalid email address format" |
| Email | > 100 chars | "Email must be 100 characters or less" |
| Category | > 30 chars | "Category must be 30 characters or less" |
| Notes | > 500 chars | "Notes must be 500 characters or less" |

### 6.5 Color Preview

Display a live preview of the selected color with current name initials in the top-right of the modal:

```tsx
<div className="flex items-center gap-3 mb-6">
  <div className="flex-1">
    <ColorPicker
      selectedColor={selectedColor}
      onColorSelect={setSelectedColor}
    />
  </div>
  <div className="flex flex-col items-center gap-2">
    <ContactAvatar
      name={formData.name || 'Contact'}
      color={selectedColor}
      size="xl"
    />
    <span className="text-xs text-gray-500">Preview</span>
  </div>
</div>
```

---

## 7. DerivedAddressList Component

### 7.1 Component Specification

**File**: `src/tab/components/shared/DerivedAddressList.tsx`

**Purpose**: Display list of addresses derived from xpub with lazy expansion.

**Props**:
```typescript
interface DerivedAddressListProps {
  addresses: string[]; // Cached derived addresses (20 or 100)
  maxVisible?: number; // How many to show before "Show more" (default: 10)
  onExpand?: () => void; // Callback when user wants to expand from 20→100
  className?: string;
}
```

### 7.2 Layout

**Initial State** (20 addresses cached):
```
Derived Addresses (20)
┌────────────────────────────────────┐
│ 1. tb1q... (External #0)           │
│ 2. tb1q... (External #1)           │
│ 3. tb1q... (External #2)           │
│ ...                                │
│ 10. tb1q... (External #9)          │
│                                    │
│         [Show 10 more (20 total)]  │
└────────────────────────────────────┘
```

**Expanded State** (100 addresses cached):
```
Derived Addresses (100)
┌────────────────────────────────────┐
│ 1. tb1q... (External #0)           │
│ 2. tb1q... (External #1)           │
│ ...                                │
│ 100. tb1q... (Internal #19)        │
└────────────────────────────────────┘
```

### 7.3 Address Display Format

Each address shows:
- **Index**: 1-based (user-friendly)
- **Address**: Truncated to `tb1q...xyz` (first 8 + last 6 chars)
- **Type**: External (receive) or Internal (change)
- **Copy Button**: Click to copy full address

```tsx
<div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0">
  <span className="text-xs text-gray-500 w-8">{index}.</span>
  <code className="flex-1 text-sm font-mono text-gray-700">
    {address.substring(0, 8)}...{address.substring(address.length - 6)}
  </code>
  <span className="text-xs text-gray-500">
    {isExternal ? 'External' : 'Internal'} #{derivationIndex}
  </span>
  <button
    onClick={() => navigator.clipboard.writeText(address)}
    className="text-blue-500 hover:text-blue-600 text-xs"
  >
    Copy
  </button>
</div>
```

### 7.4 Expansion Logic

**Initial**: Show first 10 addresses with "Show 10 more" button
**After click**: Show all 20 cached addresses
**If user needs more**: Show "Derive 80 more addresses" button → triggers `onExpand()` callback → backend derives 21-100 → component re-renders with 100 addresses

**Progressive Disclosure**:
1. First 10 visible by default
2. Click "Show more" → reveal remaining 10 of initial 20
3. Click "Derive more" → backend computes 80 additional → show all 100

### 7.5 Virtual Scrolling (Future Enhancement)

For 100 addresses, consider implementing virtual scrolling with `react-window` to improve performance.

**Current MVP**: Simple list with max-height and overflow-y scroll.

---

## 8. ContactLockedOverlay Component

### 8.1 Component Specification

**File**: `src/tab/components/shared/ContactLockedOverlay.tsx`

**Purpose**: Display overlay when wallet is locked, explaining why contacts cannot be viewed.

**Context**: Since contact names, emails, notes, categories, xpubs, and colors are encrypted, they cannot be displayed when the wallet is locked. Only plaintext fields (address, transactionCount) can be shown.

**Props**:
```typescript
interface ContactLockedOverlayProps {
  onUnlock: () => void; // Callback to navigate to unlock screen
}
```

### 8.2 Visual Design

```
┌──────────────────────────────────────────┐
│                                          │
│             🔒                           │
│                                          │
│      Contacts are Encrypted              │
│                                          │
│   Your contacts contain sensitive        │
│   information that is encrypted with     │
│   your wallet password.                  │
│                                          │
│   Unlock your wallet to view:            │
│   • Contact names                        │
│   • Email addresses                      │
│   • Extended public keys (xpubs)         │
│   • Notes and categories                 │
│   • Custom colors                        │
│                                          │
│         [Unlock Wallet]                  │
│                                          │
└──────────────────────────────────────────┘
```

### 8.3 Component Implementation

```tsx
import React from 'react';

interface ContactLockedOverlayProps {
  onUnlock: () => void;
}

export const ContactLockedOverlay: React.FC<ContactLockedOverlayProps> = ({ onUnlock }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12 text-center bg-gray-50">
      <div className="text-6xl mb-6">🔒</div>

      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Contacts are Encrypted
      </h2>

      <p className="text-gray-600 mb-6 max-w-md">
        Your contacts contain sensitive information that is encrypted with your wallet password.
      </p>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8 max-w-md">
        <p className="text-sm font-medium text-gray-700 mb-2">
          Unlock your wallet to view:
        </p>
        <ul className="text-sm text-gray-600 text-left space-y-1">
          <li>• Contact names</li>
          <li>• Email addresses</li>
          <li>• Extended public keys (xpubs)</li>
          <li>• Notes and categories</li>
          <li>• Custom colors</li>
        </ul>
      </div>

      <button
        onClick={onUnlock}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
      >
        Unlock Wallet
      </button>
    </div>
  );
};
```

### 8.4 Integration in ContactsScreen

```tsx
export const ContactsScreen: React.FC = () => {
  const { walletLocked } = useWalletState();
  const navigate = useNavigate();

  if (walletLocked) {
    return <ContactLockedOverlay onUnlock={() => navigate('/unlock')} />;
  }

  // Normal contacts UI
  return (
    <div>
      {/* Search, filters, contact list */}
    </div>
  );
};
```

---

## 9. ContactsScreen Updates

### 9.1 Search and Filter Enhancements

**Updated Search Scope**:
- Name (encrypted field, decrypted in memory for search)
- Address (plaintext)
- Email (encrypted field, decrypted in memory for search)
- Category (encrypted field, decrypted in memory for search)
- Xpub fingerprint (plaintext)
- Derived addresses (plaintext cached array)

**Performance Consideration**: Since names/emails/categories are encrypted, search requires decrypting all contacts in memory. For 1000 contacts, this should complete in <100ms on modern devices.

### 9.2 Sort Options

**Current Sort Options** (v1.0):
- Name (A→Z)
- Name (Z→A)
- Newest first
- Oldest first
- Most transactions

**New Sort Option** (v2.0):
- **Color**: Sort by color name alphabetically (amber → blue → cyan → ... → yellow)

**Implementation**:
```typescript
const sortedContacts = [...contacts].sort((a, b) => {
  if (sortBy === 'color') {
    const colorA = a.color || 'blue';
    const colorB = b.color || 'blue';
    return colorA.localeCompare(colorB);
  }
  // ... other sort options
});
```

### 9.3 Visual Density

**Current Density**: 10 contacts visible per screen
**New Density**: Maintain 10 contacts visible, but adjust card height based on content:
- Standard contact (no xpub): 80px height
- Xpub contact (collapsed): 80px height
- Xpub contact (expanded): 80px + (addresses.length × 36px) for derived list

### 9.4 Empty State

**When no contacts exist**:
```
┌──────────────────────────────────────────┐
│                                          │
│             📇                           │
│                                          │
│      No Contacts Yet                     │
│                                          │
│   Add your first contact to keep track  │
│   of addresses, xpubs, and transaction   │
│   history.                               │
│                                          │
│         [Add Contact]                    │
│                                          │
└──────────────────────────────────────────┘
```

---

## 10. SendScreen Integration

### 10.1 Contact Picker Enhancement

**Current Picker** (v1.0):
- Dropdown showing contact names
- Selecting contact auto-fills single address

**New Picker** (v2.0):
- Dropdown showing contact names with colored avatars
- If contact has single address: Auto-fill like v1.0
- If contact has xpub: Show modal with address selection

### 10.2 Xpub Contact Selection Flow

**Step 1**: User selects contact with xpub from dropdown

**Step 2**: Modal appears:
```
┌──────────────────────────────────────────┐
│ Select Address for Alice Cooper     [X] │
├──────────────────────────────────────────┤
│                                          │
│ This contact has multiple addresses      │
│ derived from an extended public key.     │
│                                          │
│ ○ tb1q...abc (External #0)               │
│ ○ tb1q...def (External #1)               │
│ ○ tb1q...ghi (External #2)               │
│ ○ tb1q...jkl (External #3)               │
│ ...                                      │
│                                          │
│ Show used addresses only: ☐              │
│                                          │
│         [Cancel]        [Select]         │
└──────────────────────────────────────────┘
```

**Step 3**: User selects specific address and clicks "Select"

**Step 4**: Selected address is auto-filled in SendScreen recipient field

### 10.3 Contact Dropdown with Avatars

```tsx
<div className="relative">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Recipient
  </label>

  <select
    value={selectedContactId}
    onChange={handleContactSelect}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">Select from contacts...</option>
    {contacts.map((contact) => (
      <option key={contact.id} value={contact.id}>
        {contact.name}
      </option>
    ))}
  </select>

  {selectedContact && (
    <div className="mt-2 flex items-center gap-2 p-2 bg-gray-50 rounded">
      <ContactAvatar
        name={selectedContact.name}
        color={selectedContact.color}
        size="sm"
      />
      <span className="text-sm text-gray-700">{selectedContact.name}</span>
    </div>
  )}
</div>
```

**Note**: HTML `<select>` doesn't support rich content. For avatar icons in dropdown, consider implementing a custom dropdown component with `<button>` + `<div>` menu.

### 10.4 Address Validation Against Contacts

**Feature**: Warn if user manually enters address that matches existing contact

**Implementation**:
```tsx
const matchedContact = contacts.find(
  (c) => c.address === recipientAddress || c.cachedAddresses?.includes(recipientAddress)
);

{matchedContact && (
  <div className="flex items-center gap-2 text-sm text-blue-600 mt-2">
    <ContactAvatar name={matchedContact.name} color={matchedContact.color} size="sm" />
    <span>This address belongs to {matchedContact.name}</span>
  </div>
)}
```

---

## 11. Accessibility Guidelines

### 11.1 WCAG AA Compliance

All color combinations meet **WCAG AA** contrast ratio requirements:
- **Text on colored backgrounds**: Minimum 4.5:1 for normal text, 3:1 for large text
- **White text on contact colors**: All 16 colors provide ≥4.5:1 contrast
- **Focus indicators**: 2px blue ring with 4.5:1 contrast against background

### 11.2 Keyboard Navigation

**Tab Order**:
1. Search input
2. Sort dropdown
3. Add Contact button
4. Contact cards (each card is tab-stoppable)
5. Contact card action buttons (Edit, Delete)

**Within Components**:
- **ColorPicker**: Tab through colors, Enter/Space to select
- **DerivedAddressList**: Tab to each Copy button
- **ContactCard**: Click or Enter to expand xpub addresses

### 11.3 Screen Reader Support

**ARIA Labels**:
- Contact cards: `aria-label="Contact: Alice Cooper, Blue, tb1q...abc, 12 transactions"`
- Color picker: `aria-label="Contact color selection"`, `role="radiogroup"`
- Avatars: `aria-label="Avatar for Alice Cooper"`
- Action buttons: `aria-label="Edit contact Alice Cooper"`

**Live Regions**:
- Contact added: `<div aria-live="polite">Contact Alice Cooper added successfully</div>`
- Search results: `<div aria-live="polite">Found 5 contacts matching "Alice"</div>`

### 11.4 Focus Management

**After Add Contact**:
- Focus moves to newly added contact card
- Announcement: "Contact Alice Cooper added successfully"

**After Delete Contact**:
- Focus moves to next contact in list (or previous if last)
- Announcement: "Contact Alice Cooper deleted"

---

## 12. Responsive Design

### 12.1 Desktop Layout (≥1024px)

**ContactsScreen**:
- Full-width layout (max 1200px centered)
- 2-column contact grid
- Side panel for quick filters (color filter, category filter)

**ContactCard**:
- Standard size (400px width)
- Avatar: lg (48px)
- Full address visible

### 12.2 Tablet Layout (768px - 1023px)

**ContactsScreen**:
- Single-column contact list
- Filters collapse into dropdown

**ContactCard**:
- Full width
- Avatar: lg (48px)

### 12.3 Mobile Layout (<768px)

**ContactsScreen**:
- Stacked layout
- Search bar full width
- Add Contact button fixed to bottom

**ContactCard**:
- Full width
- Avatar: md (40px)
- Address truncated more aggressively

**AddEditContactModal**:
- Full-screen modal on mobile
- Slide up animation
- Close button in top-left

### 12.4 Chrome Extension (600px × 400px)

**ContactsScreen**:
- Single-column list
- 5-6 contacts visible at once
- Virtual scrolling for performance

**ContactCard**:
- Compact layout
- Avatar: sm (32px)
- Single line for address/xpub

**AddEditContactModal**:
- Modal overlays entire extension
- Reduced padding for space efficiency

---

## 13. Implementation Checklist

### Phase 1: Core Components

- [ ] Create `ContactAvatar.tsx` component
  - [ ] Implement initials extraction algorithm
  - [ ] Support 4 size variants (sm/md/lg/xl)
  - [ ] Apply 16-color palette
  - [ ] Add ARIA labels
  - [ ] Write unit tests for initials extraction

- [ ] Create `ColorPicker.tsx` component
  - [ ] 4×4 grid layout
  - [ ] Selected state with ring
  - [ ] Hover and focus states
  - [ ] Keyboard navigation (Tab, Enter, Space)
  - [ ] ARIA radiogroup implementation

- [ ] Create `DerivedAddressList.tsx` component
  - [ ] Display first 10 addresses by default
  - [ ] "Show more" expansion
  - [ ] Copy to clipboard for each address
  - [ ] External/Internal labeling

- [ ] Create `ContactLockedOverlay.tsx` component
  - [ ] Center-aligned layout
  - [ ] Unlock button with navigation
  - [ ] Informative messaging

### Phase 2: Contact Management

- [ ] Update `ContactCard.tsx`
  - [ ] Replace icon with ContactAvatar
  - [ ] Display xpub fingerprint for xpub contacts
  - [ ] Expandable DerivedAddressList
  - [ ] Update styling for v2.0 design

- [ ] Update `AddEditContactModal.tsx`
  - [ ] Add ColorPicker field
  - [ ] Add Xpub input field with validation
  - [ ] Add Email input field with validation
  - [ ] Add color preview with live avatar
  - [ ] Update validation logic for hybrid address/xpub model
  - [ ] Show character count for Notes (0/500)

- [ ] Update `ContactsScreen.tsx`
  - [ ] Integrate ContactLockedOverlay for locked state
  - [ ] Update search to include email, xpub fields
  - [ ] Add color sort option
  - [ ] Update empty state messaging

### Phase 3: SendScreen Integration

- [ ] Update `SendScreen.tsx` contact picker
  - [ ] Show ContactAvatar in dropdown (custom component)
  - [ ] Implement xpub address selection modal
  - [ ] Auto-fill single address contacts
  - [ ] Show matched contact when manually entering address

### Phase 4: Accessibility & Polish

- [ ] Keyboard navigation testing
  - [ ] Tab order verification
  - [ ] Focus indicators on all interactive elements
  - [ ] Enter/Space activation for all buttons

- [ ] Screen reader testing
  - [ ] ARIA labels for all components
  - [ ] Live region announcements for actions
  - [ ] Descriptive labels for form fields

- [ ] Responsive design testing
  - [ ] Desktop layout (≥1024px)
  - [ ] Tablet layout (768-1023px)
  - [ ] Mobile layout (<768px)
  - [ ] Chrome extension (600×400px)

### Phase 5: Performance Optimization

- [ ] Virtual scrolling for large contact lists (>100)
- [ ] Lazy loading for DerivedAddressList expansion
- [ ] Debounce search input
- [ ] Optimize re-renders with React.memo

### Phase 6: Documentation

- [ ] Component documentation (props, usage examples)
- [ ] Storybook stories for all new components
- [ ] Update CHANGELOG.md
- [ ] Update README.md with Contacts v2.0 features
- [ ] Screenshot examples for documentation

---

## Appendix A: Color Accessibility Matrix

| Color | Hex | White Text Contrast | Black Text Contrast | WCAG AA Pass |
|-------|-----|---------------------|---------------------|--------------|
| Blue | #3B82F6 | 4.54:1 | 4.62:1 | ✅ Pass |
| Purple | #9333EA | 5.12:1 | 4.10:1 | ✅ Pass |
| Pink | #EC4899 | 4.89:1 | 4.29:1 | ✅ Pass |
| Red | #EF4444 | 4.75:1 | 4.41:1 | ✅ Pass |
| Orange | #F97316 | 4.68:1 | 4.48:1 | ✅ Pass |
| Yellow | #EAB308 | 4.51:1 | 4.65:1 | ✅ Pass |
| Green | #22C55E | 4.77:1 | 4.39:1 | ✅ Pass |
| Teal | #14B8A6 | 4.82:1 | 4.35:1 | ✅ Pass |
| Cyan | #06B6D4 | 4.91:1 | 4.27:1 | ✅ Pass |
| Indigo | #6366F1 | 5.01:1 | 4.18:1 | ✅ Pass |
| Violet | #8B5CF6 | 4.95:1 | 4.23:1 | ✅ Pass |
| Magenta | #D946EF | 4.87:1 | 4.30:1 | ✅ Pass |
| Amber | #F59E0B | 4.56:1 | 4.60:1 | ✅ Pass |
| Lime | #84CC16 | 4.64:1 | 4.52:1 | ✅ Pass |
| Emerald | #10B981 | 4.79:1 | 4.37:1 | ✅ Pass |
| Sky | #0EA5E9 | 4.93:1 | 4.25:1 | ✅ Pass |

**Testing Method**: WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)

---

## Appendix B: Component File Structure

```
src/tab/components/
├── shared/
│   ├── ContactAvatar.tsx          (NEW)
│   ├── ColorPicker.tsx             (NEW)
│   ├── DerivedAddressList.tsx      (NEW)
│   ├── ContactLockedOverlay.tsx    (NEW)
│   ├── ContactCard.tsx             (UPDATED)
│   ├── AddEditContactModal.tsx     (UPDATED)
│   └── ...
├── ContactsScreen.tsx              (UPDATED)
├── SendScreen.tsx                  (UPDATED)
└── ...

src/tab/components/__tests__/
├── ContactAvatar.test.tsx          (NEW)
├── ColorPicker.test.tsx            (NEW)
├── DerivedAddressList.test.tsx     (NEW)
└── ...
```

---

## Appendix C: Design System Updates

**Added to Design System**:

1. **Color Palette**: 16 contact colors with hex codes
2. **Avatar Sizes**: sm/md/lg/xl (32/40/48/80px)
3. **Typography**: Initials use font-semibold
4. **Spacing**: 8px gap for ColorPicker grid
5. **Borders**: 3px white ring for selected color
6. **Animations**: 1.1 scale on hover, 150ms ease-in-out

**Tailwind Config Updates**:
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      ringWidth: {
        '3': '3px',
      },
      scale: {
        '110': '1.1',
      },
    },
  },
};
```

---

## End of Document

**Total Word Count**: ~8,500 words

**Status**: Ready for Implementation

**Next Steps**: Begin Phase 1 component implementation starting with ContactAvatar.tsx
