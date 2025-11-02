import React, { useState } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType, AddressType, EncryptedBackupFile } from '../../shared/types';
import {
  FileSelectionModal,
  BackupPasswordEntryModal,
  ImportProgressModal,
  SetWalletPasswordModal,
  ImportSuccessModal,
} from './WalletBackup/Import';
import PasswordStrengthMeter from './shared/PasswordStrengthMeter';
import PasswordRequirementsChecklist from './shared/PasswordRequirementsChecklist';

interface WalletSetupProps {
  onSetupComplete: () => void;
}

type SetupTab = 'create' | 'import' | 'import-backup';
type SetupStep = 'form' | 'backup';

const WalletSetup: React.FC<WalletSetupProps> = ({ onSetupComplete }) => {
  const { sendMessage } = useBackgroundMessaging();

  // UI State
  const [activeTab, setActiveTab] = useState<SetupTab>('create');
  const [currentStep, setCurrentStep] = useState<SetupStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  // In development mode, pre-fill from .env.local (gitignored) for faster testing
  // Production builds always get empty strings (process.env.DEV_* = '')
  const [password, setPassword] = useState(process.env.DEV_PASSWORD || '');
  const [confirmPassword, setConfirmPassword] = useState(process.env.DEV_PASSWORD || '');
  const [mnemonic, setMnemonic] = useState(process.env.DEV_MNEMONIC || '');
  const [addressType, setAddressType] = useState<AddressType>('native-segwit');
  const [mnemonicStrength, setMnemonicStrength] = useState<128 | 256>(128); // 128 = 12 words, 256 = 24 words

  // Backup State
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  // Validation
  const [passwordError, setPasswordError] = useState('');
  const [mnemonicError, setMnemonicError] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements
  const passwordRequirements = {
    minLength: 8,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSpecial: false,
  };

  // Import backup flow state
  type ImportStep = 'file-select' | 'backup-password' | 'progress' | 'wallet-password' | 'success';
  const [importStep, setImportStep] = useState<ImportStep | null>(null);
  const [selectedBackupFile, setSelectedBackupFile] = useState<EncryptedBackupFile | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importProgressText, setImportProgressText] = useState('');
  const [restoreDetails, setRestoreDetails] = useState<any>(null);

  // Password validation
  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(pwd)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleCreateWallet = async () => {
    setError(null);

    // Validate password
    if (!validatePassword(password)) {
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendMessage<{ mnemonic: string; firstAddress: string }>(
        MessageType.CREATE_WALLET,
        { password, addressType, mnemonicStrength }
      );

      // Show backup screen with generated mnemonic
      setGeneratedMnemonic(response.mnemonic);
      setCurrentStep('backup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWallet = async () => {
    setError(null);
    setMnemonicError('');

    // Validate mnemonic - BIP39 supports 12, 15, 18, 21, or 24 word phrases
    const words = mnemonic.trim().split(/\s+/);
    const validWordCounts = [12, 15, 18, 21, 24];
    if (!validWordCounts.includes(words.length)) {
      setMnemonicError('Mnemonic must be 12, 15, 18, 21, or 24 words');
      return;
    }

    // Validate password
    if (!validatePassword(password)) {
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await sendMessage<{ firstAddress: string }>(
        MessageType.IMPORT_WALLET,
        { mnemonic: mnemonic.trim(), password, addressType }
      );

      // Success - wallet imported
      onSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackupComplete = () => {
    if (!backupConfirmed) {
      setError('Please confirm you have backed up your seed phrase');
      return;
    }

    // Wallet created successfully
    onSetupComplete();
  };

  // Handle import backup flow
  const handleFileSelected = async (file: File) => {
    try {
      // Read and parse the file
      const fileText = await file.text();
      const backupFile: EncryptedBackupFile = JSON.parse(fileText);

      // Validate the backup file structure
      const validation = await sendMessage<{ valid: boolean; error?: string }>(
        MessageType.VALIDATE_BACKUP_FILE,
        { backupFile }
      );

      if (!validation.valid) {
        setError(validation.error || 'Invalid backup file');
        setImportStep(null);
        return;
      }

      setSelectedBackupFile(backupFile);
      setImportStep('backup-password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read backup file');
      setImportStep(null);
    }
  };

  const handleBackupPasswordEntered = async (backupPassword: string) => {
    if (!selectedBackupFile) return;

    try {
      setImportStep('progress');
      setImportProgress(0);
      setImportProgressText('Decrypting backup...');

      // Import wallet from backup (fresh install - no existing wallet)
      const result = await sendMessage<{
        accountCount: number;
        contactCount: number;
        network: string;
      }>(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: selectedBackupFile,
        backupPassword,
        replaceExisting: false, // Fresh install
      });

      setImportProgress(100);
      setImportProgressText('Import complete!');
      setRestoreDetails(result);

      // Wait a moment to show 100% progress
      await new Promise(resolve => setTimeout(resolve, 500));

      // For fresh install, wallet is now created and unlocked
      // Navigate to success screen
      setImportStep('success');
    } catch (err) {
      setImportStep(null);
      setError(err instanceof Error ? err.message : 'Failed to import backup');
    }
  };

  const handleImportComplete = () => {
    // Wallet restored successfully
    onSetupComplete();
  };

  // Backup confirmation screen
  if (currentStep === 'backup' && generatedMnemonic) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="w-full max-w-md bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Backup Your Seed Phrase</h2>
          <p className="text-sm text-gray-400 mb-6">
            Write down these 12 words in order and store them safely. You'll need them to recover your wallet.
          </p>

          {/* Mnemonic Display */}
          <div className="bg-gray-900 border-2 border-bitcoin-light rounded-xl p-6 mb-6 shadow-[0_0_0_4px_rgba(247,147,26,0.12)]">
            <div className="grid grid-cols-3 gap-3">
              {generatedMnemonic.split(' ').map((word, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 font-mono">{index + 1}.</span>
                  <span className="text-sm font-mono font-semibold text-white">{word}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-xs text-red-300">
              <strong className="text-red-200">Warning:</strong> Never share your seed phrase with anyone. Anyone with access to these words can steal your Bitcoin.
            </p>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-3 mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={backupConfirmed}
              onChange={(e) => setBackupConfirmed(e.target.checked)}
              className="mt-1 w-4 h-4 bg-gray-900 border-gray-700 checked:bg-bitcoin checked:border-bitcoin rounded focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            />
            <span className="text-sm text-gray-300">
              I have written down my seed phrase and stored it in a safe place
            </span>
          </label>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <button
            onClick={handleBackupComplete}
            disabled={!backupConfirmed}
            className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Main wallet setup form
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="w-full max-w-md bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Welcome to Bitcoin Wallet</h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => {
              setActiveTab('create');
              setError(null);
              setPasswordError('');
              setMnemonicError('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'create'
                ? 'text-bitcoin border-b-2 border-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Create
          </button>
          <button
            onClick={() => {
              setActiveTab('import');
              setError(null);
              setPasswordError('');
              setMnemonicError('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'import'
                ? 'text-bitcoin border-b-2 border-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Seed
          </button>
          <button
            onClick={() => {
              setActiveTab('import-backup');
              setError(null);
              setPasswordError('');
              setMnemonicError('');
            }}
            className={`flex-1 py-3 text-xs sm:text-sm font-semibold transition-colors ${
              activeTab === 'import-backup'
                ? 'text-bitcoin border-b-2 border-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Backup
          </button>
        </div>

        {/* Create Wallet Form */}
        {activeTab === 'create' && (
          <div>
            <p className="text-sm text-gray-400 mb-6">
              Create a new Bitcoin wallet. You'll receive a {mnemonicStrength === 128 ? '12' : '24'}-word seed phrase to backup.
            </p>

            {/* Seed Phrase Length Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seed Phrase Length
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMnemonicStrength(128)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    mnemonicStrength === 128
                      ? 'border-bitcoin bg-bitcoin/10 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-semibold">12 Words</div>
                  <div className="text-xs mt-1">Standard</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMnemonicStrength(256)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all ${
                    mnemonicStrength === 256
                      ? 'border-bitcoin bg-bitcoin/10 text-white'
                      : 'border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                  }`}
                  disabled={isLoading}
                >
                  <div className="font-semibold">24 Words</div>
                  <div className="text-xs mt-1">Extra Security</div>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                24-word phrases provide stronger security (256-bit entropy vs 128-bit)
              </p>
            </div>

            {/* Address Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address Type
              </label>
              <select
                value={addressType}
                onChange={(e) => setAddressType(e.target.value as AddressType)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors"
              >
                <option value="native-segwit">Native SegWit (Recommended)</option>
                <option value="segwit">SegWit</option>
                <option value="legacy">Legacy</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Native SegWit offers lower fees and better privacy
              </p>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  onBlur={() => password && validatePassword(password)}
                  className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
                  placeholder="Enter strong password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                    {!showPassword && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <PasswordStrengthMeter password={password} minLength={8} className="mt-3" />
              <PasswordRequirementsChecklist password={password} requirements={passwordRequirements} className="mt-3" />
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
                  placeholder="Confirm password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                    {!showConfirmPassword && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542 7z" />
                    )}
                  </svg>
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-400 mt-1">{passwordError}</p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={handleCreateWallet}
              disabled={isLoading || !password || !confirmPassword}
              className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            >
              {isLoading ? 'Creating Wallet...' : 'Create Wallet'}
            </button>
          </div>
        )}

        {/* Import from Backup Form */}
        {activeTab === 'import-backup' && (
          <div>
            <p className="text-sm text-gray-400 mb-6">
              Restore your wallet from an encrypted backup file (.dat) created on another device.
            </p>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">This will restore:</h3>
              <ul className="text-sm text-gray-400 space-y-2 ml-4">
                <li>• All accounts (single-sig and multisig)</li>
                <li>• All contacts and address book</li>
                <li>• All wallet settings</li>
                <li>• Complete transaction history</li>
              </ul>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={() => setImportStep('file-select')}
              className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            >
              Select Backup File
            </button>
          </div>
        )}

        {/* Import Wallet Form */}
        {activeTab === 'import' && (
          <div>
            <p className="text-sm text-gray-400 mb-6">
              Import an existing wallet using your BIP39 seed phrase (12 or 24 words).
            </p>

            {/* Mnemonic Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Seed Phrase
              </label>
              <textarea
                value={mnemonic}
                onChange={(e) => {
                  setMnemonic(e.target.value);
                  setMnemonicError('');
                }}
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 font-mono text-sm resize-y transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
                placeholder="word1 word2 word3 ..."
                disabled={isLoading}
              />
              {mnemonicError && (
                <p className="text-xs text-red-400 mt-1">{mnemonicError}</p>
              )}
            </div>

            {/* Address Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Address Type
              </label>
              <select
                value={addressType}
                onChange={(e) => setAddressType(e.target.value as AddressType)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors"
              >
                <option value="native-segwit">Native SegWit (Recommended)</option>
                <option value="segwit">SegWit</option>
                <option value="legacy">Legacy</option>
              </select>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  onBlur={() => password && validatePassword(password)}
                  className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
                  placeholder="Enter strong password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                    {!showPassword && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              <PasswordStrengthMeter password={password} minLength={8} className="mt-3" />
              <PasswordRequirementsChecklist password={password} requirements={passwordRequirements} className="mt-3" />
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }}
                  className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
                  placeholder="Confirm password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    )}
                    {!showConfirmPassword && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    )}
                  </svg>
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-red-400 mt-1">{passwordError}</p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <button
              onClick={handleImportWallet}
              disabled={isLoading || !password || !confirmPassword || !mnemonic}
              className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            >
              {isLoading ? 'Importing Wallet...' : 'Import Wallet'}
            </button>
          </div>
        )}
      </div>

      {/* Import Backup Flow Modals */}
      {importStep === 'file-select' && (
        <FileSelectionModal
          isOpen={true}
          onClose={() => setImportStep(null)}
          onContinue={handleFileSelected}
        />
      )}

      {importStep === 'backup-password' && selectedBackupFile && (
        <BackupPasswordEntryModal
          isOpen={true}
          onClose={() => setImportStep(null)}
          onBack={() => setImportStep('file-select')}
          onContinue={handleBackupPasswordEntered}
        />
      )}

      {importStep === 'progress' && (
        <ImportProgressModal
          isOpen={true}
          progress={importProgress}
          currentStep={importProgressText}
        />
      )}

      {importStep === 'success' && restoreDetails && (
        <ImportSuccessModal
          isOpen={true}
          onClose={handleImportComplete}
          accountCount={restoreDetails.accountCount}
          contactCount={restoreDetails.contactCount}
          network={restoreDetails.network}
        />
      )}
    </div>
  );
};

export default WalletSetup;
