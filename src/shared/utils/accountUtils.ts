/**
 * Account Utilities
 *
 * Utility functions for grouping, filtering, and categorizing wallet accounts
 * based on their derivation type and account type.
 *
 * Used by Sidebar and Settings screen for account segregation.
 */

import { WalletAccount, Account, MultisigAccount } from '../types';

/**
 * Type guard to check if account is single-sig
 */
export function isSingleSigAccount(account: WalletAccount): account is Account {
  return account.accountType === 'single';
}

/**
 * Type guard to check if account is multisig
 */
export function isMultisigAccount(account: WalletAccount): account is MultisigAccount {
  return account.accountType === 'multisig';
}

/**
 * Check if a single-sig account is HD-derived
 *
 * HD-derived accounts have importType === 'hd' or undefined (legacy HD accounts)
 */
export function isHDDerivedAccount(account: Account): boolean {
  return account.importType === 'hd' || account.importType === undefined;
}

/**
 * Check if a single-sig account is imported (from private key or seed phrase)
 *
 * Imported accounts have importType === 'private-key' or 'seed'
 */
export function isImportedAccount(account: Account): boolean {
  return account.importType === 'private-key' || account.importType === 'seed';
}

/**
 * Get all HD-derived single-sig accounts
 *
 * Returns accounts that:
 * - Are single-sig (accountType === 'single')
 * - Have importType === 'hd' or undefined
 */
export function getHDAccounts(accounts: WalletAccount[]): Account[] {
  return accounts.filter((account): account is Account =>
    isSingleSigAccount(account) && isHDDerivedAccount(account)
  );
}

/**
 * Get all imported single-sig accounts
 *
 * Returns accounts that:
 * - Are single-sig (accountType === 'single')
 * - Have importType === 'private-key' or 'seed'
 */
export function getImportedAccounts(accounts: WalletAccount[]): Account[] {
  return accounts.filter((account): account is Account =>
    isSingleSigAccount(account) && isImportedAccount(account)
  );
}

/**
 * Get all multisig accounts
 *
 * Returns accounts that:
 * - Have accountType === 'multisig'
 */
export function getMultisigAccounts(accounts: WalletAccount[]): MultisigAccount[] {
  return accounts.filter((account): account is MultisigAccount =>
    isMultisigAccount(account)
  );
}

/**
 * Group accounts by type
 *
 * Returns an object with three arrays:
 * - hdAccounts: HD-derived single-sig accounts
 * - importedAccounts: Imported single-sig accounts
 * - multisigAccounts: Multisig accounts
 */
export interface GroupedAccounts {
  hdAccounts: Account[];
  importedAccounts: Account[];
  multisigAccounts: MultisigAccount[];
}

export function groupAccounts(accounts: WalletAccount[]): GroupedAccounts {
  return {
    hdAccounts: getHDAccounts(accounts),
    importedAccounts: getImportedAccounts(accounts),
    multisigAccounts: getMultisigAccounts(accounts),
  };
}

/**
 * Check if account can export xpub
 *
 * Only HD-derived single-sig accounts can export xpub
 * Multisig accounts use EXPORT_OUR_XPUB instead
 */
export function canExportXpub(account: WalletAccount): boolean {
  return isSingleSigAccount(account) && isHDDerivedAccount(account);
}

/**
 * Check if account can export private key
 *
 * All single-sig accounts (HD and imported) can export private keys
 * Multisig accounts cannot export private keys (no single private key)
 */
export function canExportPrivateKey(account: WalletAccount): boolean {
  return isSingleSigAccount(account);
}

/**
 * Get account type label for display
 *
 * Returns human-readable label:
 * - "HD-derived" for HD single-sig accounts
 * - "Imported Key" for imported single-sig accounts
 * - "Multisig" for multisig accounts
 */
export function getAccountTypeLabel(account: WalletAccount): string {
  if (isMultisigAccount(account)) {
    return 'Multisig';
  }

  if (isSingleSigAccount(account)) {
    return isHDDerivedAccount(account) ? 'HD-derived' : 'Imported Key';
  }

  return 'Unknown';
}

/**
 * Get account derivation info for tooltip
 *
 * Returns detailed description for tooltips
 */
export function getAccountDerivationInfo(account: WalletAccount): string {
  if (isMultisigAccount(account)) {
    return `Multisig account (${account.multisigConfig})`;
  }

  if (isSingleSigAccount(account)) {
    if (isHDDerivedAccount(account)) {
      return 'HD-derived account (can export xpub)';
    } else {
      return 'Imported account (cannot export xpub)';
    }
  }

  return 'Unknown account type';
}

/**
 * Check if wallet has only imported accounts (no HD accounts)
 *
 * Returns true if wallet has zero HD accounts but has imported accounts
 * Used to detect non-HD wallets
 */
export function isNonHDWallet(accounts: WalletAccount[]): boolean {
  const hdAccounts = getHDAccounts(accounts);
  const importedAccounts = getImportedAccounts(accounts);

  return hdAccounts.length === 0 && importedAccounts.length > 0;
}

/**
 * Count accounts by type
 */
export interface AccountCounts {
  total: number;
  hd: number;
  imported: number;
  multisig: number;
}

export function countAccounts(accounts: WalletAccount[]): AccountCounts {
  const grouped = groupAccounts(accounts);

  return {
    total: accounts.length,
    hd: grouped.hdAccounts.length,
    imported: grouped.importedAccounts.length,
    multisig: grouped.multisigAccounts.length,
  };
}
