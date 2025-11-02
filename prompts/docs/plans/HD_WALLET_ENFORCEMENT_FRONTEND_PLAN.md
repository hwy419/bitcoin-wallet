# HD Wallet Enforcement - Frontend Implementation Plan

**Version**: 1.0
**Date**: 2025-10-27
**Status**: Implementation Ready
**Depends On**: HD_WALLET_ENFORCEMENT_UX_DESIGN.md (pending)

---

## Table of Contents

1. [Current Code Analysis](#1-current-code-analysis)
2. [Export Xpub Button Bug Fix](#2-export-xpub-button-bug-fix)
3. [Account Grouping Utilities](#3-account-grouping-utilities)
4. [Component Changes Required](#4-component-changes-required)
5. [Styling Approach](#5-styling-approach)
6. [Implementation Checklist](#6-implementation-checklist)
7. [Testing Strategy](#7-testing-strategy)

---

## 1. Current Code Analysis

### 1.1 Account Data Structure

**File**: `/src/shared/types/index.ts` (Lines 6-40)

```typescript
// Single-signature account
export interface Account {
  accountType: 'single';
  index: number;
  name: string;
  addressType: AddressType;
  importType?: 'hd' | 'private-key' | 'seed'; // How account was created/imported
  externalIndex: number;
  internalIndex: number;
  addresses: Address[];
}

// Multi-signature account
export interface MultisigAccount {
  accountType: 'multisig';
  index: number;
  name: string;
  multisigConfig: MultisigConfig;
  addressType: MultisigAddressType;
  cosigners: Cosigner[];
  externalIndex: number;
  internalIndex: number;
  addresses: MultisigAddress[];
}

// Union type for all account types
export type WalletAccount = Account | MultisigAccount;
```

**Key Observations**:
- `importType` field exists on `Account` type (single-sig only)
- Values: `'hd'` (HD-derived), `'private-key'` (imported from WIF), `'seed'` (imported from seed phrase)
- `undefined` value means legacy account (created before v0.10.0, treated as HD-derived)
- `MultisigAccount` does NOT have `importType` field (all multisig accounts are HD-derived by design)

### 1.2 Account Switcher Component

**File**: `/src/tab/components/Sidebar.tsx` (Lines 131-228)

**Current Implementation**:
```typescript
{/* Account List */}
<div className="max-h-[320px] overflow-y-auto py-2">
  {accounts.map((account, index) => (
    <button
      key={account.index}
      onClick={() => {
        onAccountSwitch(index);
        setIsDropdownOpen(false);
      }}
      className={`w-full px-4 py-3 text-left transition-all duration-200
        ${currentAccountIndex === index
          ? 'bg-bitcoin-subtle border-l-2 border-bitcoin'
          : 'hover:bg-gray-750'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
            flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white text-sm truncate">
                {account.name}
              </span>
              {account.accountType === 'multisig' && (
                <MultisigBadge config={account.multisigConfig} size="sm" />
              )}
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {account.accountType === 'multisig'
                ? account.addressType.toUpperCase()
                : account.addressType.replace('-', ' ')
              }
            </div>
          </div>
        </div>
        {currentAccountIndex === index && (
          <svg className="w-5 h-5 text-bitcoin flex-shrink-0 ml-2"
            fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  ))}
</div>
```

**Issues**:
- No grouping - all accounts rendered in a flat list
- No HD-derived vs imported distinction visible
- No section headers
- Multisig badge shown, but no import badge for imported accounts

### 1.3 Settings Screen Component

**File**: `/src/tab/components/SettingsScreen.tsx` (Lines 326-396)

**Current Implementation**:
```typescript
{/* Account List */}
<div className="space-y-3">
  {accounts.map((account) => (
    <div
      key={account.index}
      className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 hover:border-gray-700 transition-colors"
    >
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-white">{account.name}</p>
          {/* Derivation type badge */}
          {account.accountType === 'single' && (
            <>
              {account.importType === 'hd' || account.importType === undefined ? (
                <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded">
                  HD-derived
                </span>
              ) : (
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded">
                  Imported Key
                </span>
              )}
            </>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {account.accountType === 'multisig'
            ? getMultisigAddressTypeLabel(account.addressType)
            : getAddressTypeLabel(account.addressType)}
        </p>
      </div>
      <div className="flex space-x-2">
        {/* Export xpub button - for HD-derived accounts (single-sig and multisig) */}
        {account.importType !== 'private-key' && (
          <button
            onClick={() => openExportXpubModal(account)}
            className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
            title="Export extended public key"
          >
            Export Xpub
          </button>
        )}
        {/* Export private key button - only for non-multisig accounts */}
        {account.accountType !== 'multisig' && (
          <button
            onClick={() => openExportModal(account)}
            className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
            title="Export private key"
          >
            Export Key
          </button>
        )}
        {/* ... Rename and Delete buttons ... */}
      </div>
    </div>
  ))}
</div>
```

**Issues**:
- **CRITICAL BUG** (Line 359): `{account.importType !== 'private-key' && ...}` is insufficient
  - This condition allows Export Xpub button for:
    - `importType === 'hd'` ✅ Correct
    - `importType === undefined` ✅ Correct (legacy HD accounts)
    - `importType === 'seed'` ❌ **INCORRECT** - Should NOT show Export Xpub for seed-imported accounts
  - Multisig accounts don't have `importType`, so condition passes ❌ **INCORRECT** - Should use EXPORT_OUR_XPUB instead
- No grouping - all accounts rendered in a flat list
- Custom badges for HD-derived vs Imported (should use standardized components)

### 1.4 Export Xpub Modal

**File**: `/src/tab/components/ExportXpubModal.tsx` (Lines 116-158)

**Backend Handler**:
```typescript
const response = await sendMessage<{
  xpub: string;
  fingerprint: string;
  derivationPath: string;
  metadata: any;
}>(MessageType.EXPORT_ACCOUNT_XPUB, { accountIndex });
```

**Error Handling** (Lines 146-154):
```typescript
if (errorMsg.includes('multisig')) {
  setError('Cannot export xpub for multisig accounts. Use the multisig wizard to export xpubs.');
} else if (errorMsg.includes('private key')) {
  setError('Cannot export xpub for accounts imported from private keys. Only HD-derived accounts have extended public keys.');
}
```

**Observations**:
- Backend already rejects multisig and imported accounts
- Error messages are helpful but shouldn't be necessary (button shouldn't appear)
- Modal is **ONLY** for single-sig HD-derived accounts

---

## 2. Export Xpub Button Bug Fix

### 2.1 Root Cause Analysis

**Current Condition** (`SettingsScreen.tsx` Line 359):
```typescript
{account.importType !== 'private-key' && (
  <button onClick={() => openExportXpubModal(account)}>
    Export Xpub
  </button>
)}
```

**Problem**:
| Account Type | `importType` Value | Current Behavior | Expected Behavior |
|--------------|-------------------|------------------|-------------------|
| HD-derived (new) | `'hd'` | ✅ Shows button | ✅ Shows button |
| HD-derived (legacy) | `undefined` | ✅ Shows button | ✅ Shows button |
| Imported from private key | `'private-key'` | ✅ Hides button | ✅ Hides button |
| Imported from seed phrase | `'seed'` | ❌ **Shows button** | ✅ **Hides button** |
| Multisig | N/A (no `importType` field) | ❌ **Shows button** | ✅ **Hides button** |

### 2.2 Correct Condition

**Updated Condition**:
```typescript
{account.accountType === 'single' &&
 (account.importType === 'hd' || account.importType === undefined) && (
  <button onClick={() => openExportXpubModal(account)}>
    Export Xpub
  </button>
)}
```

**Logic**:
1. `account.accountType === 'single'` - Only single-sig accounts (excludes multisig)
2. `account.importType === 'hd' || account.importType === undefined` - Only HD-derived accounts (excludes `'private-key'` and `'seed'`)

**Truth Table**:
| Account Type | `accountType` | `importType` | Shows Button? |
|--------------|---------------|--------------|---------------|
| HD-derived (new) | `'single'` | `'hd'` | ✅ Yes |
| HD-derived (legacy) | `'single'` | `undefined` | ✅ Yes |
| Imported from private key | `'single'` | `'private-key'` | ❌ No |
| Imported from seed phrase | `'single'` | `'seed'` | ❌ No |
| Multisig | `'multisig'` | N/A | ❌ No |

### 2.3 Implementation

**File**: `/src/tab/components/SettingsScreen.tsx`

**Change**:
```diff
<div className="flex space-x-2">
-  {/* Export xpub button - for HD-derived accounts (single-sig and multisig) */}
-  {account.importType !== 'private-key' && (
+  {/* Export xpub button - ONLY for HD-derived single-sig accounts */}
+  {account.accountType === 'single' &&
+   (account.importType === 'hd' || account.importType === undefined) && (
    <button
      onClick={() => openExportXpubModal(account)}
      className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
      title="Export extended public key"
    >
      Export Xpub
    </button>
  )}
  {/* Export private key button - only for non-multisig accounts */}
  {account.accountType !== 'multisig' && (
    <button
      onClick={() => openExportModal(account)}
      className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
      title="Export private key"
    >
      Export Key
    </button>
  )}
  {/* ... rest of buttons ... */}
</div>
```

**Line Numbers**: Lines 357-367

**Testing**:
1. Create HD-derived account → Export Xpub button appears ✅
2. Import account from private key → Export Xpub button hidden ✅
3. Import account from seed phrase → Export Xpub button hidden ✅
4. Create multisig account → Export Xpub button hidden ✅

---

## 3. Account Grouping Utilities

### 3.1 Utility Functions Specification

**File**: `/src/shared/utils/accountUtils.ts` (NEW)

```typescript
/**
 * Account utility functions for grouping and categorization
 *
 * Provides helper functions to group accounts by derivation type and account type.
 * Used by Sidebar and Settings components for visual grouping.
 */

import { WalletAccount, Account, MultisigAccount } from '../types/index';

/**
 * Get all HD-derived single-sig accounts
 *
 * Returns accounts where:
 * - accountType === 'single'
 * - importType === 'hd' OR importType === undefined (legacy)
 *
 * @param accounts - Array of all wallet accounts
 * @returns Array of HD-derived single-sig accounts
 */
export function getHDAccounts(accounts: WalletAccount[]): Account[] {
  return accounts.filter(
    (account): account is Account =>
      account.accountType === 'single' &&
      (account.importType === 'hd' || account.importType === undefined)
  );
}

/**
 * Get all imported single-sig accounts
 *
 * Returns accounts where:
 * - accountType === 'single'
 * - importType === 'private-key' OR importType === 'seed'
 *
 * @param accounts - Array of all wallet accounts
 * @returns Array of imported single-sig accounts
 */
export function getImportedAccounts(accounts: WalletAccount[]): Account[] {
  return accounts.filter(
    (account): account is Account =>
      account.accountType === 'single' &&
      (account.importType === 'private-key' || account.importType === 'seed')
  );
}

/**
 * Get all multisig accounts
 *
 * Returns accounts where:
 * - accountType === 'multisig'
 *
 * @param accounts - Array of all wallet accounts
 * @returns Array of multisig accounts
 */
export function getMultisigAccounts(accounts: WalletAccount[]): MultisigAccount[] {
  return accounts.filter(
    (account): account is MultisigAccount => account.accountType === 'multisig'
  );
}

/**
 * Get grouped accounts for rendering
 *
 * Returns an object with all three account groups, each with a count.
 * Useful for rendering section headers with counts.
 *
 * @param accounts - Array of all wallet accounts
 * @returns Object with grouped accounts and counts
 */
export interface AccountGroups {
  hdAccounts: Account[];
  importedAccounts: Account[];
  multisigAccounts: MultisigAccount[];
  counts: {
    hd: number;
    imported: number;
    multisig: number;
    total: number;
  };
}

export function getAccountGroups(accounts: WalletAccount[]): AccountGroups {
  const hdAccounts = getHDAccounts(accounts);
  const importedAccounts = getImportedAccounts(accounts);
  const multisigAccounts = getMultisigAccounts(accounts);

  return {
    hdAccounts,
    importedAccounts,
    multisigAccounts,
    counts: {
      hd: hdAccounts.length,
      imported: importedAccounts.length,
      multisig: multisigAccounts.length,
      total: accounts.length,
    },
  };
}

/**
 * Check if an account is HD-derived
 *
 * @param account - Account to check
 * @returns true if account is HD-derived (single-sig or multisig)
 */
export function isHDAccount(account: WalletAccount): boolean {
  if (account.accountType === 'multisig') {
    return true; // All multisig accounts are HD-derived by design
  }
  return account.importType === 'hd' || account.importType === undefined;
}

/**
 * Check if an account was imported (from private key or seed)
 *
 * @param account - Account to check
 * @returns true if account was imported
 */
export function isImportedAccount(account: WalletAccount): boolean {
  if (account.accountType === 'multisig') {
    return false; // Multisig accounts are never imported
  }
  return account.importType === 'private-key' || account.importType === 'seed';
}

/**
 * Get a human-readable label for an account's derivation type
 *
 * @param account - Account to get label for
 * @returns Label string (e.g., "HD-derived", "Imported from private key")
 */
export function getDerivationTypeLabel(account: WalletAccount): string {
  if (account.accountType === 'multisig') {
    return 'Multi-signature (HD)';
  }

  switch (account.importType) {
    case 'hd':
    case undefined:
      return 'HD-derived';
    case 'private-key':
      return 'Imported from private key';
    case 'seed':
      return 'Imported from seed phrase';
    default:
      return 'Unknown';
  }
}
```

### 3.2 Unit Tests Specification

**File**: `/src/shared/utils/__tests__/accountUtils.test.ts` (NEW)

```typescript
import {
  getHDAccounts,
  getImportedAccounts,
  getMultisigAccounts,
  getAccountGroups,
  isHDAccount,
  isImportedAccount,
  getDerivationTypeLabel,
} from '../accountUtils';
import { WalletAccount, Account, MultisigAccount } from '../../types/index';

describe('accountUtils', () => {
  const mockHDAccount: Account = {
    accountType: 'single',
    index: 0,
    name: 'HD Account 1',
    addressType: 'native-segwit',
    importType: 'hd',
    externalIndex: 0,
    internalIndex: 0,
    addresses: [],
  };

  const mockLegacyHDAccount: Account = {
    accountType: 'single',
    index: 1,
    name: 'Legacy HD Account',
    addressType: 'native-segwit',
    importType: undefined, // Legacy account (pre-v0.10.0)
    externalIndex: 0,
    internalIndex: 0,
    addresses: [],
  };

  const mockImportedPrivateKeyAccount: Account = {
    accountType: 'single',
    index: 2,
    name: 'Imported Private Key',
    addressType: 'native-segwit',
    importType: 'private-key',
    externalIndex: 0,
    internalIndex: 0,
    addresses: [],
  };

  const mockImportedSeedAccount: Account = {
    accountType: 'single',
    index: 3,
    name: 'Imported Seed',
    addressType: 'native-segwit',
    importType: 'seed',
    externalIndex: 0,
    internalIndex: 0,
    addresses: [],
  };

  const mockMultisigAccount: MultisigAccount = {
    accountType: 'multisig',
    index: 4,
    name: 'Multisig Account',
    multisigConfig: '2-of-3',
    addressType: 'p2wsh',
    cosigners: [],
    externalIndex: 0,
    internalIndex: 0,
    addresses: [],
  };

  const allAccounts: WalletAccount[] = [
    mockHDAccount,
    mockLegacyHDAccount,
    mockImportedPrivateKeyAccount,
    mockImportedSeedAccount,
    mockMultisigAccount,
  ];

  describe('getHDAccounts', () => {
    it('should return HD-derived single-sig accounts', () => {
      const result = getHDAccounts(allAccounts);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockHDAccount);
      expect(result).toContainEqual(mockLegacyHDAccount);
    });

    it('should exclude imported accounts', () => {
      const result = getHDAccounts(allAccounts);
      expect(result).not.toContainEqual(mockImportedPrivateKeyAccount);
      expect(result).not.toContainEqual(mockImportedSeedAccount);
    });

    it('should exclude multisig accounts', () => {
      const result = getHDAccounts(allAccounts);
      expect(result).not.toContainEqual(mockMultisigAccount);
    });

    it('should return empty array when no HD accounts', () => {
      const result = getHDAccounts([mockImportedPrivateKeyAccount, mockMultisigAccount]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getImportedAccounts', () => {
    it('should return imported single-sig accounts', () => {
      const result = getImportedAccounts(allAccounts);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockImportedPrivateKeyAccount);
      expect(result).toContainEqual(mockImportedSeedAccount);
    });

    it('should exclude HD-derived accounts', () => {
      const result = getImportedAccounts(allAccounts);
      expect(result).not.toContainEqual(mockHDAccount);
      expect(result).not.toContainEqual(mockLegacyHDAccount);
    });

    it('should exclude multisig accounts', () => {
      const result = getImportedAccounts(allAccounts);
      expect(result).not.toContainEqual(mockMultisigAccount);
    });

    it('should return empty array when no imported accounts', () => {
      const result = getImportedAccounts([mockHDAccount, mockMultisigAccount]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getMultisigAccounts', () => {
    it('should return multisig accounts', () => {
      const result = getMultisigAccounts(allAccounts);
      expect(result).toHaveLength(1);
      expect(result).toContainEqual(mockMultisigAccount);
    });

    it('should exclude single-sig accounts', () => {
      const result = getMultisigAccounts(allAccounts);
      expect(result).not.toContainEqual(mockHDAccount);
      expect(result).not.toContainEqual(mockImportedPrivateKeyAccount);
    });

    it('should return empty array when no multisig accounts', () => {
      const result = getMultisigAccounts([mockHDAccount, mockImportedPrivateKeyAccount]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAccountGroups', () => {
    it('should group accounts correctly', () => {
      const result = getAccountGroups(allAccounts);

      expect(result.hdAccounts).toHaveLength(2);
      expect(result.importedAccounts).toHaveLength(2);
      expect(result.multisigAccounts).toHaveLength(1);

      expect(result.counts.hd).toBe(2);
      expect(result.counts.imported).toBe(2);
      expect(result.counts.multisig).toBe(1);
      expect(result.counts.total).toBe(5);
    });

    it('should handle empty account array', () => {
      const result = getAccountGroups([]);

      expect(result.hdAccounts).toHaveLength(0);
      expect(result.importedAccounts).toHaveLength(0);
      expect(result.multisigAccounts).toHaveLength(0);

      expect(result.counts.hd).toBe(0);
      expect(result.counts.imported).toBe(0);
      expect(result.counts.multisig).toBe(0);
      expect(result.counts.total).toBe(0);
    });
  });

  describe('isHDAccount', () => {
    it('should return true for HD-derived single-sig accounts', () => {
      expect(isHDAccount(mockHDAccount)).toBe(true);
      expect(isHDAccount(mockLegacyHDAccount)).toBe(true);
    });

    it('should return false for imported accounts', () => {
      expect(isHDAccount(mockImportedPrivateKeyAccount)).toBe(false);
      expect(isHDAccount(mockImportedSeedAccount)).toBe(false);
    });

    it('should return true for multisig accounts', () => {
      expect(isHDAccount(mockMultisigAccount)).toBe(true);
    });
  });

  describe('isImportedAccount', () => {
    it('should return true for imported single-sig accounts', () => {
      expect(isImportedAccount(mockImportedPrivateKeyAccount)).toBe(true);
      expect(isImportedAccount(mockImportedSeedAccount)).toBe(true);
    });

    it('should return false for HD-derived accounts', () => {
      expect(isImportedAccount(mockHDAccount)).toBe(false);
      expect(isImportedAccount(mockLegacyHDAccount)).toBe(false);
    });

    it('should return false for multisig accounts', () => {
      expect(isImportedAccount(mockMultisigAccount)).toBe(false);
    });
  });

  describe('getDerivationTypeLabel', () => {
    it('should return correct label for HD accounts', () => {
      expect(getDerivationTypeLabel(mockHDAccount)).toBe('HD-derived');
      expect(getDerivationTypeLabel(mockLegacyHDAccount)).toBe('HD-derived');
    });

    it('should return correct label for imported private key', () => {
      expect(getDerivationTypeLabel(mockImportedPrivateKeyAccount)).toBe('Imported from private key');
    });

    it('should return correct label for imported seed', () => {
      expect(getDerivationTypeLabel(mockImportedSeedAccount)).toBe('Imported from seed phrase');
    });

    it('should return correct label for multisig', () => {
      expect(getDerivationTypeLabel(mockMultisigAccount)).toBe('Multi-signature (HD)');
    });
  });
});
```

---

## 4. Component Changes Required

### 4.1 Sidebar Component Changes

**File**: `/src/tab/components/Sidebar.tsx`

**Current Lines**: 176-227 (Account List)

**Changes**:

#### A. Import Utility Functions

```diff
import React, { useState, useEffect, useRef } from 'react';
import { WalletAccount } from '../../shared/types';
import { ImportBadge } from './shared/ImportBadge';
import { MultisigBadge } from './shared/MultisigBadge';
+import { getAccountGroups, AccountGroups } from '../../shared/utils/accountUtils';
```

#### B. Group Accounts in Component

```typescript
const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  accounts,
  currentAccountIndex,
  onAccountSwitch,
  onCreateAccount,
  onImportAccount,
  onCreateMultisig,
  onLock,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentAccount = accounts[currentAccountIndex] || accounts[0];

+  // Group accounts by derivation type
+  const accountGroups = getAccountGroups(accounts);
```

#### C. Replace Account List with Grouped Sections

**OLD CODE** (Lines 176-227):
```typescript
{/* Account List */}
<div className="max-h-[320px] overflow-y-auto py-2">
  {accounts.map((account, index) => (
    {/* ... account button ... */}
  ))}
</div>
```

**NEW CODE** (placeholder - actual styling from UX design):
```typescript
{/* Account List - Grouped by Derivation Type */}
<div className="max-h-[320px] overflow-y-auto">
  {/* HD-Derived Accounts Section */}
  {accountGroups.hdAccounts.length > 0 && (
    <div className="py-2">
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          HD-Derived Accounts ({accountGroups.counts.hd})
        </h3>
      </div>
      {accountGroups.hdAccounts.map((account) => {
        const accountIndex = accounts.findIndex(a => a.index === account.index);
        return (
          <AccountButton
            key={account.index}
            account={account}
            accountIndex={accountIndex}
            currentAccountIndex={currentAccountIndex}
            onAccountSwitch={onAccountSwitch}
            setIsDropdownOpen={setIsDropdownOpen}
          />
        );
      })}
    </div>
  )}

  {/* Imported Accounts Section */}
  {accountGroups.importedAccounts.length > 0 && (
    <div className="py-2 border-t border-gray-700">
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Imported Accounts ({accountGroups.counts.imported})
        </h3>
      </div>
      {accountGroups.importedAccounts.map((account) => {
        const accountIndex = accounts.findIndex(a => a.index === account.index);
        return (
          <AccountButton
            key={account.index}
            account={account}
            accountIndex={accountIndex}
            currentAccountIndex={currentAccountIndex}
            onAccountSwitch={onAccountSwitch}
            setIsDropdownOpen={setIsDropdownOpen}
            showImportBadge
          />
        );
      })}
    </div>
  )}

  {/* Multisig Accounts Section */}
  {accountGroups.multisigAccounts.length > 0 && (
    <div className="py-2 border-t border-gray-700">
      <div className="px-4 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Multi-Signature Accounts ({accountGroups.counts.multisig})
        </h3>
      </div>
      {accountGroups.multisigAccounts.map((account) => {
        const accountIndex = accounts.findIndex(a => a.index === account.index);
        return (
          <AccountButton
            key={account.index}
            account={account}
            accountIndex={accountIndex}
            currentAccountIndex={currentAccountIndex}
            onAccountSwitch={onAccountSwitch}
            setIsDropdownOpen={setIsDropdownOpen}
          />
        );
      })}
    </div>
  )}
</div>
```

#### D. Extract Account Button Component

**NEW COMPONENT** (add at bottom of file before export):
```typescript
interface AccountButtonProps {
  account: WalletAccount;
  accountIndex: number;
  currentAccountIndex: number;
  onAccountSwitch: (index: number) => void;
  setIsDropdownOpen: (open: boolean) => void;
  showImportBadge?: boolean;
}

const AccountButton: React.FC<AccountButtonProps> = ({
  account,
  accountIndex,
  currentAccountIndex,
  onAccountSwitch,
  setIsDropdownOpen,
  showImportBadge = false,
}) => {
  return (
    <button
      onClick={() => {
        onAccountSwitch(accountIndex);
        setIsDropdownOpen(false);
      }}
      className={`w-full px-4 py-3 text-left transition-all duration-200
        ${currentAccountIndex === accountIndex
          ? 'bg-bitcoin-subtle border-l-2 border-bitcoin'
          : 'hover:bg-gray-750'
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
            flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white text-sm truncate">
                {account.name}
              </span>
              {showImportBadge && account.accountType === 'single' && account.importType && (
                <ImportBadge type={account.importType} size="sm" />
              )}
              {account.accountType === 'multisig' && (
                <MultisigBadge config={account.multisigConfig} size="sm" />
              )}
            </div>
            <div className="text-xs text-gray-400 capitalize">
              {account.accountType === 'multisig'
                ? account.addressType.toUpperCase()
                : account.addressType.replace('-', ' ')
              }
            </div>
          </div>
        </div>
        {currentAccountIndex === accountIndex && (
          <svg className="w-5 h-5 text-bitcoin flex-shrink-0 ml-2"
            fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </button>
  );
};
```

**Notes**:
- Section headers will be styled according to UX design spec (pending)
- Import badges only shown for imported accounts
- Multisig badges shown for multisig accounts
- Dividers between sections use `border-t border-gray-700`

### 4.2 Settings Screen Component Changes

**File**: `/src/tab/components/SettingsScreen.tsx`

**Current Lines**: 306-397 (Accounts Section)

**Changes**:

#### A. Import Utility Functions

```diff
import React, { useState } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType, Account, WalletAccount, AddressType, MultisigAddressType, EncryptedBackupFile } from '../../shared/types';
import ExportPrivateKeyModal from './ExportPrivateKeyModal';
import ExportXpubModal from './ExportXpubModal';
import ImportAccountModal from './AccountManagement/ImportAccountModal';
+import { getAccountGroups, AccountGroups } from '../../shared/utils/accountUtils';
+import { ImportBadge } from './shared/ImportBadge';
+import { MultisigBadge } from './shared/MultisigBadge';
```

#### B. Group Accounts in Component

```typescript
const SettingsScreen: React.FC<SettingsScreenProps> = ({ accounts, onBack, onAccountsUpdate, onLock }) => {
  const { sendMessage } = useBackgroundMessaging();

+  // Group accounts by derivation type
+  const accountGroups = getAccountGroups(accounts);

  // ... rest of component state ...
```

#### C. Replace Account List with Grouped Sections

**OLD CODE** (Lines 326-396):
```typescript
{/* Account List */}
<div className="space-y-3">
  {accounts.map((account) => (
    {/* ... account card ... */}
  ))}
</div>
```

**NEW CODE** (placeholder - actual styling from UX design):
```typescript
{/* Account List - Grouped by Derivation Type */}
<div className="space-y-6">
  {/* HD-Derived Accounts Section */}
  {accountGroups.hdAccounts.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span>HD-Derived Accounts</span>
        <span className="text-xs text-gray-500 font-normal">({accountGroups.counts.hd})</span>
      </h3>
      <div className="space-y-3">
        {accountGroups.hdAccounts.map((account) => (
          <AccountCard
            key={account.index}
            account={account}
            onRename={() => openRenameModal(account)}
            onExport={() => openExportModal(account)}
            onExportXpub={() => openExportXpubModal(account)}
            onDelete={() => openDeleteModal(account)}
            canDelete={accounts.length > 1}
            showExportXpub
          />
        ))}
      </div>
    </div>
  )}

  {/* Imported Accounts Section */}
  {accountGroups.importedAccounts.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span>Imported Accounts</span>
        <span className="text-xs text-gray-500 font-normal">({accountGroups.counts.imported})</span>
      </h3>
      <div className="space-y-3">
        {accountGroups.importedAccounts.map((account) => (
          <AccountCard
            key={account.index}
            account={account}
            onRename={() => openRenameModal(account)}
            onExport={() => openExportModal(account)}
            onExportXpub={() => openExportXpubModal(account)}
            onDelete={() => openDeleteModal(account)}
            canDelete={accounts.length > 1}
            showExportXpub={false}
            showImportBadge
          />
        ))}
      </div>
    </div>
  )}

  {/* Multisig Accounts Section */}
  {accountGroups.multisigAccounts.length > 0 && (
    <div>
      <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
        <span>Multi-Signature Accounts</span>
        <span className="text-xs text-gray-500 font-normal">({accountGroups.counts.multisig})</span>
      </h3>
      <div className="space-y-3">
        {accountGroups.multisigAccounts.map((account) => (
          <AccountCard
            key={account.index}
            account={account}
            onRename={() => openRenameModal(account)}
            onExport={() => openExportModal(account)}
            onExportXpub={() => openExportXpubModal(account)}
            onDelete={() => openDeleteModal(account)}
            canDelete={accounts.length > 1}
            showExportXpub={false}
            showExportKey={false}
          />
        ))}
      </div>
    </div>
  )}
</div>
```

#### D. Extract Account Card Component

**NEW COMPONENT** (add at bottom of file before export):
```typescript
interface AccountCardProps {
  account: WalletAccount;
  onRename: () => void;
  onExport: () => void;
  onExportXpub: () => void;
  onDelete: () => void;
  canDelete: boolean;
  showExportXpub?: boolean;
  showExportKey?: boolean;
  showImportBadge?: boolean;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onRename,
  onExport,
  onExportXpub,
  onDelete,
  canDelete,
  showExportXpub = false,
  showExportKey = true,
  showImportBadge = false,
}) => {
  // Address type labels
  const getAddressTypeLabel = (type: AddressType): string => {
    const labels: Record<AddressType, string> = {
      legacy: 'Legacy (P2PKH)',
      segwit: 'SegWit (P2SH)',
      'native-segwit': 'Native SegWit (Bech32)',
    };
    return labels[type];
  };

  const getMultisigAddressTypeLabel = (type: MultisigAddressType): string => {
    const labels: Record<MultisigAddressType, string> = {
      'p2wsh': 'P2WSH (Native SegWit)',
      'p2sh-p2wsh': 'P2SH-P2WSH (Wrapped SegWit)',
      'p2sh': 'P2SH (Legacy)',
    };
    return labels[type];
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 hover:border-gray-700 transition-colors">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-white">{account.name}</p>
          {/* Import badge for imported accounts */}
          {showImportBadge && account.accountType === 'single' && account.importType && (
            <ImportBadge type={account.importType} size="sm" />
          )}
          {/* Multisig badge for multisig accounts */}
          {account.accountType === 'multisig' && (
            <MultisigBadge config={account.multisigConfig} size="sm" />
          )}
        </div>
        <p className="text-sm text-gray-500">
          {account.accountType === 'multisig'
            ? getMultisigAddressTypeLabel(account.addressType)
            : getAddressTypeLabel(account.addressType)}
        </p>
      </div>
      <div className="flex space-x-2">
        {/* Export xpub button - ONLY for HD-derived single-sig accounts */}
        {showExportXpub && (
          <button
            onClick={onExportXpub}
            className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
            title="Export extended public key"
          >
            Export Xpub
          </button>
        )}
        {/* Export private key button - only for non-multisig accounts */}
        {showExportKey && (
          <button
            onClick={onExport}
            className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
            title="Export private key"
          >
            Export Key
          </button>
        )}
        <button
          onClick={onRename}
          className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
        >
          Rename
        </button>
        {/* Delete button - disabled if this is the last account */}
        <button
          onClick={onDelete}
          disabled={!canDelete}
          className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={!canDelete ? 'Cannot delete the last account' : 'Delete account'}
        >
          Delete
        </button>
      </div>
    </div>
  );
};
```

**Notes**:
- Export Xpub button controlled by `showExportXpub` prop (only true for HD-derived accounts)
- Export Key button controlled by `showExportKey` prop (false for multisig accounts)
- Import badge controlled by `showImportBadge` prop (only true for imported accounts)
- Section headers will be styled according to UX design spec (pending)

---

## 5. Styling Approach

### 5.1 Section Headers

**Placeholder Styling** (to be replaced by UX design):

```typescript
{/* Section Header - HD-Derived */}
<div className="px-4 py-2">
  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
    HD-Derived Accounts (2)
  </h3>
</div>

{/* Section Header - Imported */}
<div className="px-4 py-2">
  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
    Imported Accounts (1)
  </h3>
</div>

{/* Section Header - Multisig */}
<div className="px-4 py-2">
  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
    Multi-Signature Accounts (1)
  </h3>
</div>
```

**Design Considerations** (for UX designer):
- Font size: 10-12px (text-xs)
- Font weight: Semi-bold (600)
- Color: Gray-400 (#9CA3AF)
- Text transform: Uppercase
- Letter spacing: Wider tracking
- Padding: 8px vertical, 16px horizontal
- Background: Transparent or subtle gray
- Count display: In parentheses or badge

### 5.2 Section Dividers

**Current Approach**:
```typescript
<div className="py-2 border-t border-gray-700">
  {/* Section content */}
</div>
```

**Design Considerations** (for UX designer):
- Divider color: Gray-700 (#374151)
- Divider thickness: 1px
- Spacing: 8px top/bottom padding
- Alternative: Use margin instead of padding for tighter spacing

### 5.3 Badge Styling

**Import Badge** (already exists in `ImportBadge.tsx`):
- Blue download arrow icon
- Size: 16px (sm) or 20px (md)
- Tooltip on hover

**Multisig Badge** (already exists in `MultisigBadge.tsx`):
- Configuration display (2-of-2, 2-of-3, etc.)
- Teal/cyan color scheme
- Size variants

**Design Considerations** (for UX designer):
- Should import badge be replaced with inline text badge (like Settings screen)?
- Should section grouping eliminate the need for inline badges?
- Color scheme for visual hierarchy

### 5.4 Visual Hierarchy

**Three-Level Hierarchy**:

1. **Section Level**: Group header with count
   - Font size: Small (text-xs)
   - Color: Muted (text-gray-400)
   - Background: Subtle or transparent

2. **Account Level**: Account name and type
   - Font size: Medium (text-sm)
   - Color: White (account name) + Gray (address type)
   - Background: Dark card (bg-gray-900)

3. **Badge Level**: Derivation type indicator
   - Font size: Extra small (text-xs)
   - Color: Contextual (blue for import, teal for multisig)
   - Background: Subtle background with border

**Design Considerations** (for UX designer):
- Should badges be shown if accounts are already grouped?
- Visual weight balance between sections
- Spacing between sections (6px vs 12px vs 16px)

---

## 6. Implementation Checklist

### 6.1 Immediate Fixes (Can Do Now)

- [ ] **Fix Export Xpub button visibility in SettingsScreen.tsx** (Section 2.3)
  - File: `/src/tab/components/SettingsScreen.tsx`
  - Lines: 357-367
  - Change condition from `account.importType !== 'private-key'` to `account.accountType === 'single' && (account.importType === 'hd' || account.importType === undefined)`
  - Test with all account types
  - Expected result: Export Xpub button ONLY appears for HD-derived single-sig accounts

### 6.2 Utility Functions (No UX Design Required)

- [ ] **Create account grouping utility file** (Section 3.1)
  - File: `/src/shared/utils/accountUtils.ts`
  - Implement all 7 utility functions
  - Add JSDoc comments
  - Export `AccountGroups` interface

- [ ] **Create unit tests for utilities** (Section 3.2)
  - File: `/src/shared/utils/__tests__/accountUtils.test.ts`
  - Test all 7 functions with mock data
  - Test edge cases (empty arrays, legacy accounts)
  - Aim for 100% coverage

- [ ] **Run tests and verify**
  - Command: `npm test accountUtils`
  - All tests should pass
  - No type errors

### 6.3 Component Changes (WAIT for UX Design Spec)

**DO NOT IMPLEMENT until UX design spec is complete. The following are placeholders:**

- [ ] **Update Sidebar component** (Section 4.1)
  - File: `/src/tab/components/Sidebar.tsx`
  - Import utility functions and badges
  - Group accounts using `getAccountGroups()`
  - Replace flat list with grouped sections
  - Extract `AccountButton` component
  - Apply UX design styling to section headers
  - Apply UX design styling to dividers
  - Test dropdown functionality

- [ ] **Update Settings screen component** (Section 4.2)
  - File: `/src/tab/components/SettingsScreen.tsx`
  - Import utility functions and badges
  - Group accounts using `getAccountGroups()`
  - Replace flat list with grouped sections
  - Extract `AccountCard` component
  - Apply UX design styling to section headers
  - Apply UX design styling to spacing
  - Test all CRUD operations (create, rename, delete)

- [ ] **Update badge usage** (if needed)
  - Review UX design decisions on badge display
  - Update `showImportBadge` prop usage
  - Ensure badges don't duplicate section information

### 6.4 Integration Testing

- [ ] **Test account grouping logic**
  - Create HD-derived account → Appears in "HD-Derived Accounts" section ✅
  - Import account from private key → Appears in "Imported Accounts" section ✅
  - Import account from seed phrase → Appears in "Imported Accounts" section ✅
  - Create multisig account → Appears in "Multi-Signature Accounts" section ✅
  - Verify section counts update correctly

- [ ] **Test Export Xpub button visibility**
  - HD-derived single-sig account → Export Xpub button appears ✅
  - Imported private key account → Export Xpub button hidden ✅
  - Imported seed account → Export Xpub button hidden ✅
  - Multisig account → Export Xpub button hidden ✅
  - Legacy account (importType undefined) → Export Xpub button appears ✅

- [ ] **Test Export Private Key button visibility**
  - Single-sig accounts (all types) → Export Key button appears ✅
  - Multisig accounts → Export Key button hidden ✅

- [ ] **Test section visibility**
  - Wallet with only HD accounts → Only "HD-Derived Accounts" section shown ✅
  - Wallet with only imported accounts → Only "Imported Accounts" section shown ✅
  - Wallet with only multisig accounts → Only "Multi-Signature Accounts" section shown ✅
  - Wallet with mixed accounts → All relevant sections shown with correct counts ✅

- [ ] **Test UI interactions**
  - Account switching from dropdown ✅
  - Account creation from Settings ✅
  - Account import from Settings ✅
  - Account renaming ✅
  - Account deletion ✅
  - Export Xpub modal opens correctly ✅
  - Export Private Key modal opens correctly ✅

### 6.5 Visual Regression Testing

- [ ] **Compare before/after screenshots**
  - Sidebar dropdown (collapsed state)
  - Sidebar dropdown (expanded state)
  - Settings screen (accounts section)
  - Settings screen (scrolling behavior)
  - Verify visual hierarchy is clear
  - Verify spacing is consistent

### 6.6 Documentation Updates

- [ ] **Update CLAUDE.md**
  - Document account grouping utilities
  - Document component changes
  - Document Export Xpub button logic

- [ ] **Update frontend-developer-notes.md**
  - Document `accountUtils.ts` functions
  - Document `AccountButton` component
  - Document `AccountCard` component
  - Document section grouping patterns

---

## 7. Testing Strategy

### 7.1 Unit Tests

**File**: `/src/shared/utils/__tests__/accountUtils.test.ts`

**Coverage**:
- All 7 utility functions
- Edge cases (empty arrays, undefined values)
- Type safety (TypeScript guards)
- Legacy account handling (importType undefined)

**Test Data**:
- Mock HD-derived account
- Mock legacy HD account (importType undefined)
- Mock imported private key account
- Mock imported seed account
- Mock multisig account

**Expected Coverage**: 100%

### 7.2 Integration Tests

**Scenarios**:

1. **Account Grouping**
   - Create wallet with all account types
   - Verify grouping in Sidebar dropdown
   - Verify grouping in Settings screen
   - Verify counts are accurate

2. **Export Button Visibility**
   - Create HD-derived account → Export Xpub appears
   - Import private key account → Export Xpub hidden
   - Import seed account → Export Xpub hidden
   - Create multisig account → Export Xpub hidden
   - Test all account types → Export Key appears (except multisig)

3. **Section Headers**
   - Create first HD account → "HD-Derived Accounts (1)" appears
   - Create second HD account → "HD-Derived Accounts (2)" appears
   - Import first account → "Imported Accounts (1)" appears
   - Create first multisig → "Multi-Signature Accounts (1)" appears
   - Delete last account in section → Section disappears

4. **Badges**
   - HD-derived account in Sidebar → No import badge
   - Imported account in Sidebar → Import badge appears
   - Multisig account in Sidebar → Multisig badge appears
   - Same behavior in Settings screen

### 7.3 Manual Testing Checklist

**Sidebar Dropdown**:
- [ ] Open dropdown → Sections appear in order (HD, Imported, Multisig)
- [ ] Section headers show correct counts
- [ ] Accounts appear in correct sections
- [ ] Badges display correctly
- [ ] Current account is highlighted
- [ ] Clicking account switches view
- [ ] Dropdown closes after selection
- [ ] Scrolling works with many accounts

**Settings Screen**:
- [ ] Sections appear in order (HD, Imported, Multisig)
- [ ] Section headers show correct counts
- [ ] Accounts appear in correct sections
- [ ] Badges display correctly
- [ ] Export Xpub button only on HD-derived single-sig accounts
- [ ] Export Key button on all single-sig accounts
- [ ] Rename button works for all accounts
- [ ] Delete button disabled for last account
- [ ] Create Account button works
- [ ] Import Account button works
- [ ] Account list updates after create/import/delete

**Edge Cases**:
- [ ] Wallet with 0 accounts (should not be possible, but test)
- [ ] Wallet with 1 account (delete button disabled)
- [ ] Wallet with 20+ accounts (scrolling behavior)
- [ ] Legacy wallet (all accounts have importType undefined)
- [ ] Mixed wallet (HD + Imported + Multisig)

**Visual**:
- [ ] Sections have clear visual separation
- [ ] Headers are readable and distinct
- [ ] Badges don't overlap text
- [ ] Spacing is consistent
- [ ] Hover states work correctly
- [ ] Active states work correctly
- [ ] Colors match design system

### 7.4 Error Scenarios

**Export Xpub Error Handling**:
- [ ] Click Export Xpub on imported account → Error modal (should not be possible if button is hidden)
- [ ] Click Export Xpub on multisig account → Error modal (should not be possible if button is hidden)
- [ ] Click Export Xpub when wallet locked → "Wallet locked" error
- [ ] Backend error → Generic error message

**Account Grouping Edge Cases**:
- [ ] Account with invalid `importType` value → Grouped as "Unknown" or handled gracefully
- [ ] Account with missing `accountType` field → Handled gracefully (should not happen with TypeScript)

---

## Appendix A: File Paths Reference

### Files to Create

1. `/src/shared/utils/accountUtils.ts` - Account grouping utilities
2. `/src/shared/utils/__tests__/accountUtils.test.ts` - Utility unit tests

### Files to Modify

1. `/src/tab/components/Sidebar.tsx` - Account switcher dropdown
2. `/src/tab/components/SettingsScreen.tsx` - Settings accounts section

### Files to Reference

1. `/src/shared/types/index.ts` - Type definitions
2. `/src/tab/components/shared/ImportBadge.tsx` - Import badge component
3. `/src/tab/components/shared/MultisigBadge.tsx` - Multisig badge component
4. `/src/tab/components/ExportXpubModal.tsx` - Xpub export modal

---

## Appendix B: Migration Notes

### Backward Compatibility

**Legacy Accounts** (created before v0.10.0):
- Have `importType: undefined`
- Should be treated as HD-derived accounts
- Grouping logic: `account.importType === 'hd' || account.importType === undefined`

**Multisig Accounts**:
- Do NOT have `importType` field
- Always HD-derived by design
- Should NOT show Export Xpub button (use EXPORT_OUR_XPUB instead)

### Type Safety

All utility functions use TypeScript type guards:
```typescript
export function getHDAccounts(accounts: WalletAccount[]): Account[] {
  return accounts.filter(
    (account): account is Account =>  // Type guard
      account.accountType === 'single' &&
      (account.importType === 'hd' || account.importType === undefined)
  );
}
```

This ensures type safety when mapping over grouped accounts.

---

## Appendix C: Component Props Summary

### AccountButton Component (Sidebar)

```typescript
interface AccountButtonProps {
  account: WalletAccount;
  accountIndex: number;
  currentAccountIndex: number;
  onAccountSwitch: (index: number) => void;
  setIsDropdownOpen: (open: boolean) => void;
  showImportBadge?: boolean;  // Default: false
}
```

### AccountCard Component (Settings)

```typescript
interface AccountCardProps {
  account: WalletAccount;
  onRename: () => void;
  onExport: () => void;
  onExportXpub: () => void;
  onDelete: () => void;
  canDelete: boolean;
  showExportXpub?: boolean;   // Default: false
  showExportKey?: boolean;    // Default: true
  showImportBadge?: boolean;  // Default: false
}
```

---

**End of Document**
