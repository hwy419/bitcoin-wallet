import React, { useState } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType, Account, WalletAccount, AddressType, MultisigAddressType, EncryptedBackupFile } from '../../shared/types';
import ExportPrivateKeyModal from './ExportPrivateKeyModal';
import ExportXpubModal from './ExportXpubModal';
import ImportAccountModal from './AccountManagement/ImportAccountModal';
import {
  ExportWarningModal,
  WalletPasswordConfirmModal,
  BackupPasswordCreateModal,
  ExportProgressModal,
  ExportSuccessModal,
} from './WalletBackup/Export';
import { groupAccounts } from '../../shared/utils/accountUtils';
import { usePrivacy } from '../contexts/PrivacyContext';

interface SettingsScreenProps {
  accounts: WalletAccount[];
  onBack: () => void;
  onAccountsUpdate: (accounts: WalletAccount[]) => void;
  onLock: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ accounts, onBack, onAccountsUpdate, onLock }) => {
  const { sendMessage } = useBackgroundMessaging();
  const { balancesHidden, togglePrivacy } = usePrivacy();

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showExportXpubModal, setShowExportXpubModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAccountIndex, setEditingAccountIndex] = useState<number | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<WalletAccount | null>(null);
  const [exportingAccount, setExportingAccount] = useState<WalletAccount | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Form state
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountType, setNewAccountType] = useState<AddressType>('native-segwit');
  const [renameValue, setRenameValue] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wallet backup export flow state
  type ExportStep = 'warning' | 'wallet-password' | 'backup-password' | 'progress' | 'success';
  const [exportStep, setExportStep] = useState<ExportStep | null>(null);
  const [walletPassword, setWalletPassword] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportProgressText, setExportProgressText] = useState('');
  const [backupFile, setBackupFile] = useState<EncryptedBackupFile | null>(null);
  const [backupMetadata, setBackupMetadata] = useState<any>(null);

  // Handle create account
  const handleCreateAccount = async () => {
    if (!newAccountName.trim()) {
      setError('Account name is required');
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      const result = await sendMessage<{ account: Account; firstAddress: string }>(
        MessageType.CREATE_ACCOUNT,
        {
          name: newAccountName.trim(),
          addressType: newAccountType,
        }
      );

      // Update accounts list
      onAccountsUpdate([...accounts, result.account]);

      // Close modal and reset form
      setShowCreateModal(false);
      setNewAccountName('');
      setNewAccountType('native-segwit');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsCreating(false);
    }
  };

  // Handle rename account
  const handleRenameAccount = async () => {
    if (editingAccountIndex === null) return;

    if (!renameValue.trim()) {
      setError('Account name is required');
      return;
    }

    setError(null);
    setIsRenaming(true);

    try {
      await sendMessage(MessageType.UPDATE_ACCOUNT_NAME, {
        accountIndex: editingAccountIndex,
        name: renameValue.trim(),
      });

      // Update accounts list
      const updatedAccounts = accounts.map((account) =>
        account.index === editingAccountIndex
          ? { ...account, name: renameValue.trim() }
          : account
      );
      onAccountsUpdate(updatedAccounts);

      // Close modal and reset
      setShowRenameModal(false);
      setEditingAccountIndex(null);
      setRenameValue('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename account');
    } finally {
      setIsRenaming(false);
    }
  };

  // Open rename modal
  const openRenameModal = (account: WalletAccount) => {
    setEditingAccountIndex(account.index);
    setRenameValue(account.name);
    setError(null);
    setShowRenameModal(true);
  };

  // Open export modal
  const openExportModal = (account: WalletAccount) => {
    setExportingAccount(account);
    setShowExportModal(true);
  };

  // Open export xpub modal
  const openExportXpubModal = (account: WalletAccount) => {
    setExportingAccount(account);
    setShowExportXpubModal(true);
  };

  // Open delete modal
  const openDeleteModal = (account: WalletAccount) => {
    setDeletingAccount(account);
    setDeleteConfirmation('');
    setError(null);
    setShowDeleteModal(true);
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!deletingAccount) return;

    if (deleteConfirmation !== 'delete') {
      setError('Please type "delete" to confirm');
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      await sendMessage(MessageType.DELETE_ACCOUNT, {
        accountIndex: deletingAccount.index,
      });

      // Remove account from list
      const updatedAccounts = accounts.filter((acc) => acc.index !== deletingAccount.index);
      onAccountsUpdate(updatedAccounts);

      // Close modal
      setShowDeleteModal(false);
      setDeletingAccount(null);
      setDeleteConfirmation('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle wallet backup export flow
  const handleWalletPasswordConfirm = async (password: string) => {
    try {
      // Verify password with backend (this will throw if incorrect)
      await sendMessage(MessageType.UNLOCK_WALLET, { password });
      setWalletPassword(password);
      setExportStep('backup-password');
    } catch (err) {
      throw new Error('Incorrect password');
    }
  };

  const handleBackupPasswordCreate = async (backupPassword: string) => {
    try {
      setExportStep('progress');
      setExportProgress(0);
      setExportProgressText('Starting export...');

      // Call backend to export wallet
      const result = await sendMessage<{
        backupFile: EncryptedBackupFile;
        metadata: any;
      }>(MessageType.EXPORT_WALLET_BACKUP, {
        walletPassword,
        backupPassword,
      });

      // Update progress to 100%
      setExportProgress(100);
      setExportProgressText('Export complete!');

      // Store backup file and metadata
      setBackupFile(result.backupFile);
      setBackupMetadata(result.metadata);

      // Wait a moment to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // Move to success screen
      setExportStep('success');
      setWalletPassword(''); // Clear password from memory
    } catch (err) {
      setExportStep(null);
      setWalletPassword(''); // Clear password from memory
      setError(err instanceof Error ? err.message : 'Failed to export wallet backup');
    }
  };

  const handleExportComplete = () => {
    setExportStep(null);
    setBackupFile(null);
    setBackupMetadata(null);
    setWalletPassword('');
    setExportProgress(0);
    setExportProgressText('');
  };

  // Close modals
  const closeModals = () => {
    setShowCreateModal(false);
    setShowRenameModal(false);
    setShowExportModal(false);
    setShowExportXpubModal(false);
    setShowImportModal(false);
    setShowDeleteModal(false);
    setEditingAccountIndex(null);
    setExportingAccount(null);
    setDeletingAccount(null);
    setDeleteConfirmation('');
    setNewAccountName('');
    setRenameValue('');
    setError(null);
    // Also close export flow
    setExportStep(null);
    setWalletPassword('');
    setBackupFile(null);
    setBackupMetadata(null);
  };

  // Get address type label for single-sig accounts
  const getAddressTypeLabel = (type: AddressType): string => {
    const labels: Record<AddressType, string> = {
      legacy: 'Legacy (P2PKH)',
      segwit: 'SegWit (P2SH)',
      'native-segwit': 'Native SegWit (Bech32)',
    };
    return labels[type];
  };

  // Get address type label for multisig accounts
  const getMultisigAddressTypeLabel = (type: MultisigAddressType): string => {
    const labels: Record<MultisigAddressType, string> = {
      'p2wsh': 'P2WSH (Native SegWit)',
      'p2sh-p2wsh': 'P2SH-P2WSH (Wrapped SegWit)',
      'p2sh': 'P2SH (Legacy)',
    };
    return labels[type];
  };

  return (
    <div className="w-full h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-1 text-gray-400 hover:text-white transition-colors"
            title="Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Settings</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Accounts Section */}
        <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Accounts</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="text-sm text-gray-400 hover:text-bitcoin font-semibold"
              >
                + Import Account
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-sm text-bitcoin hover:text-bitcoin-hover font-semibold"
              >
                + Create Account
              </button>
            </div>
          </div>

          {/* Grouped Account List */}
          <div className="space-y-6">
            {(() => {
              const { hdAccounts, importedAccounts, multisigAccounts } = groupAccounts(accounts);

              // Render account card helper
              const renderAccountCard = (account: WalletAccount) => (
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
                    {/* Export xpub button - ONLY for HD-derived single-sig accounts */}
                    {account.accountType === 'single' && (account.importType === 'hd' || account.importType === undefined) && (
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
                    <button
                      onClick={() => openRenameModal(account)}
                      className="px-4 py-2 text-sm bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-lg font-semibold transition-colors"
                    >
                      Rename
                    </button>
                    {/* Delete button - disabled if this is the last account */}
                    <button
                      onClick={() => openDeleteModal(account)}
                      disabled={accounts.length === 1}
                      className="px-4 py-2 text-sm bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={accounts.length === 1 ? 'Cannot delete the last account' : 'Delete account'}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );

              return (
                <>
                  {/* HD Accounts Section */}
                  {hdAccounts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        HD Accounts
                      </h3>
                      <div className="space-y-3">
                        {hdAccounts.map(renderAccountCard)}
                      </div>
                    </div>
                  )}

                  {/* Imported Accounts Section */}
                  {importedAccounts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Imported Accounts
                      </h3>
                      <div className="space-y-3">
                        {importedAccounts.map(renderAccountCard)}
                      </div>
                    </div>
                  )}

                  {/* Multisig Accounts Section */}
                  {multisigAccounts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Multisig Accounts
                      </h3>
                      <div className="space-y-3">
                        {multisigAccounts.map(renderAccountCard)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Security</h2>

          <div className="space-y-4">
            {/* Auto-lock info */}
            <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div>
                <p className="font-semibold text-white">Auto-lock Timer</p>
                <p className="text-sm text-gray-500">Wallet locks automatically after inactivity</p>
              </div>
              <span className="text-sm font-semibold text-bitcoin">15 minutes</span>
            </div>

            {/* Lock wallet button */}
            <button
              onClick={onLock}
              className="w-full bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Lock Wallet
            </button>

            {/* Export Encrypted Backup button */}
            <button
              onClick={() => setExportStep('warning')}
              className="w-full bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              Export Encrypted Backup
            </button>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Privacy</h2>

          <div className="space-y-4">
            {/* Hide Balances Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-white">Hide Balances</p>
                  {balancesHidden && (
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Conceal financial information for screen privacy
                </p>
              </div>
              <button
                onClick={togglePrivacy}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850 ${
                  balancesHidden ? 'bg-bitcoin' : 'bg-gray-700'
                }`}
                role="switch"
                aria-checked={balancesHidden}
                aria-label="Toggle hide balances"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    balancesHidden ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Quick Toggle Info */}
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm text-blue-300 font-semibold mb-1">Quick Toggle</p>
                <p className="text-xs text-blue-200/80">
                  Click any balance to quickly toggle privacy mode
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-white mb-4">About</h2>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Version</span>
              <span className="font-semibold text-white">0.12.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Network</span>
              <span className="font-semibold text-bitcoin">Testnet</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Author</span>
              <span className="font-semibold text-white">Michael Jones (delegateDev)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Tester</span>
              <span className="font-semibold text-white">Aeonous</span>
            </div>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <a
                href="https://github.com/hwy419/bitcoin-wallet"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-bitcoin hover:text-bitcoin-hover mb-2"
              >
                GitHub Repository
              </a>
              <a
                href="https://github.com/hwy419/bitcoin-wallet#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-bitcoin hover:text-bitcoin-hover"
              >
                Support & Documentation
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Create New Account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Account Name */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Account Name</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="My Account"
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
                autoFocus
              />
            </div>

            {/* Address Type */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Address Type</label>
              <div className="space-y-2">
                {(['native-segwit', 'segwit', 'legacy'] as AddressType[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      newAccountType === type
                        ? 'border-bitcoin bg-bitcoin-subtle'
                        : 'border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={type}
                      checked={newAccountType === type}
                      onChange={(e) => setNewAccountType(e.target.value as AddressType)}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-semibold text-white">{getAddressTypeLabel(type)}</p>
                      <p className="text-xs text-gray-500">
                        {type === 'native-segwit' && 'Recommended - Lower fees, tb1 addresses'}
                        {type === 'segwit' && 'Compatible - Addresses starting with 2'}
                        {type === 'legacy' && 'Traditional - Addresses starting with m/n'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={closeModals}
                disabled={isCreating}
                className="flex-1 bg-gray-800 hover:bg-gray-750 disabled:bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAccount}
                disabled={isCreating}
                className="flex-1 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] disabled:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Account Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Rename Account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Account Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">New Name</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Account name"
                className="w-full px-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
                autoFocus
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={closeModals}
                disabled={isRenaming}
                className="flex-1 bg-gray-800 hover:bg-gray-750 disabled:bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRenameAccount}
                disabled={isRenaming}
                className="flex-1 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] disabled:bg-gray-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isRenaming ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Private Key Modal */}
      {showExportModal && exportingAccount && exportingAccount.accountType !== 'multisig' && (
        <ExportPrivateKeyModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setExportingAccount(null);
          }}
          accountIndex={exportingAccount.index}
          accountName={exportingAccount.name}
          firstAddress={exportingAccount.addresses[0]?.address || ''}
          addressType={exportingAccount.addressType as AddressType}
        />
      )}

      {/* Export Xpub Modal */}
      {showExportXpubModal && exportingAccount && exportingAccount.accountType === 'single' && (
        <ExportXpubModal
          isOpen={showExportXpubModal}
          onClose={() => {
            setShowExportXpubModal(false);
            setExportingAccount(null);
          }}
          accountIndex={exportingAccount.index}
          accountName={exportingAccount.name}
          addressType={exportingAccount.addressType as AddressType}
        />
      )}

      {/* Import Account Modal */}
      {showImportModal && (
        <ImportAccountModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={(account) => {
            // Close modal on successful import
            // Parent component will handle account list refresh
            setShowImportModal(false);
          }}
        />
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && deletingAccount && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-850 border border-red-500/30 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Delete Account</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-4">
                Are you sure you want to delete <span className="font-semibold text-white">"{deletingAccount.name}"</span>?
              </p>
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <p className="text-sm text-red-300 font-semibold mb-2">⚠️ Warning</p>
                <p className="text-xs text-red-300">
                  This action cannot be undone. Make sure you have backed up this account's private keys or seed phrase before deleting.
                </p>
              </div>
              <p className="text-sm text-gray-400 mb-2">
                Type <span className="font-mono font-semibold text-white">delete</span> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="delete"
                className="w-full px-4 py-3 border border-gray-700 bg-gray-900 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-850"
                autoFocus
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={closeModals}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmation !== 'delete'}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Backup Export Flow Modals */}
      {exportStep === 'warning' && (
        <ExportWarningModal
          isOpen={true}
          onClose={closeModals}
          onContinue={() => setExportStep('wallet-password')}
        />
      )}

      {exportStep === 'wallet-password' && (
        <WalletPasswordConfirmModal
          isOpen={true}
          onClose={closeModals}
          onConfirm={handleWalletPasswordConfirm}
        />
      )}

      {exportStep === 'backup-password' && (
        <BackupPasswordCreateModal
          isOpen={true}
          onClose={closeModals}
          onBack={() => setExportStep('wallet-password')}
          onCreate={handleBackupPasswordCreate}
        />
      )}

      {exportStep === 'progress' && (
        <ExportProgressModal
          isOpen={true}
          progress={exportProgress}
          currentStep={exportProgressText}
        />
      )}

      {exportStep === 'success' && backupFile && backupMetadata && (
        <ExportSuccessModal
          isOpen={true}
          onClose={handleExportComplete}
          backupFile={backupFile}
          metadata={backupMetadata}
        />
      )}
    </div>
  );
};

export default SettingsScreen;
