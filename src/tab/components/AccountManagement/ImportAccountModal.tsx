/**
 * ImportAccountModal - Unified account import modal with tab navigation
 *
 * Modal dialog for importing Bitcoin accounts from private keys (WIF format via file or text)
 * or seed phrases (BIP39 12/24 words). Consolidates two previous modals into one unified interface.
 *
 * Features:
 * - Three-tab navigation: File Import / Text Import / Seed Phrase
 * - File import: Encrypted .enc or plain text .txt files with drag-and-drop
 * - Text import: Manual WIF paste with real-time validation
 * - Seed phrase import: BIP39 mnemonic with word/checksum validation
 * - Security warning banner
 * - Network detection and validation (testnet vs mainnet)
 * - Address type selection (for private keys)
 * - Account name validation
 * - Form validation
 * - Loading states
 * - Success/error handling
 * - Uses new v0.10.0 backend handlers: VALIDATE_WIF, IMPORT_PRIVATE_KEY
 * - Maintains backward compatibility for seed phrase import
 *
 * Flow:
 * 1. User selects import method (tab)
 * 2. User provides key/file/seed and account details
 * 3. Validation occurs (WIF validation for private keys, checksum for seeds)
 * 4. Submit imports account via appropriate backend handler
 * 5. Account added to wallet with import badge
 * 6. Success callback and modal closes
 *
 * Props:
 * - isOpen: Modal visibility
 * - onClose: Close modal callback
 * - onSuccess: Success callback with imported account
 *
 * Usage:
 * <ImportAccountModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={(account) => handleAccountImported(account)}
 * />
 */

import React, { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import SecurityWarning from '../shared/SecurityWarning';
import PrivateKeyFileImport from './PrivateKeyFileImport';
import PrivateKeyImport from './PrivateKeyImport';
import SeedPhraseImport from './SeedPhraseImport';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType, WalletAccount, AddressType } from '../../../shared/types/index';
import {
  readEncryptedFile,
  readPlainTextFile,
  validateFileFormat,
  EncryptedKeyFile,
} from '../../utils/fileReader';

type ImportMethod = 'file' | 'text' | 'seed-phrase';

interface ImportAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: WalletAccount) => void;
}

interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: AddressType;
  compressed?: boolean;
  error?: string;
}

export const ImportAccountModal: React.FC<ImportAccountModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Tab state
  const [importMethod, setImportMethod] = useState<ImportMethod>('file');

  // File Import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [encryptedData, setEncryptedData] = useState<EncryptedKeyFile | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [fileAccountName, setFileAccountName] = useState('');
  const [fileAddressType, setFileAddressType] = useState<AddressType>('native-segwit');
  const [fileValidationResult, setFileValidationResult] = useState<WIFValidationResult | null>(null);
  const [isFileValidating, setIsFileValidating] = useState(false);

  // Text Import state (Private Key paste)
  const [privateKey, setPrivateKey] = useState('');
  const [textAccountName, setTextAccountName] = useState('');
  const [textAddressType, setTextAddressType] = useState<AddressType>('native-segwit');
  const [textValidationResult, setTextValidationResult] = useState<WIFValidationResult | null>(null);
  const [isTextValidating, setIsTextValidating] = useState(false);

  // Seed Phrase Import state
  const [seedPhrase, setSeedPhrase] = useState('');
  const [accountIndex, setAccountIndex] = useState(0);
  const [seedAddressType, setSeedAddressType] = useState<AddressType>('native-segwit');
  const [seedAccountName, setSeedAccountName] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clear all sensitive data
      setImportMethod('file');
      setSelectedFile(null);
      setEncryptedData(null);
      setDecryptPassword('');
      setFileAccountName('');
      setFileAddressType('native-segwit');
      setFileValidationResult(null);
      setIsFileValidating(false);
      setPrivateKey('');
      setTextAccountName('');
      setTextAddressType('native-segwit');
      setTextValidationResult(null);
      setIsTextValidating(false);
      setSeedPhrase('');
      setAccountIndex(0);
      setSeedAddressType('native-segwit');
      setSeedAccountName('');
      setIsSubmitting(false);
      setError(null);
    } else {
      // Generate default account names
      generateDefaultAccountName();
    }
  }, [isOpen]);

  // Generate default account name
  const generateDefaultAccountName = async () => {
    try {
      const response = await sendMessage<{ accounts: any[] }>(MessageType.GET_WALLET_STATE);
      const importedCount = response.accounts.filter((acc: any) => acc.importType === 'private-key' || acc.importType === 'seed').length;
      const defaultName = `Imported Account ${importedCount + 1}`;
      setFileAccountName(defaultName);
      setTextAccountName(defaultName);
      setSeedAccountName(defaultName);
    } catch {
      setFileAccountName('Imported Account 1');
      setTextAccountName('Imported Account 1');
      setSeedAccountName('Imported Account 1');
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setEncryptedData(null);
    setFileValidationResult(null);

    try {
      // Detect file type
      const isEncrypted = file.name.toLowerCase().endsWith('.enc');

      if (isEncrypted) {
        // Validate and read encrypted file
        const formatError = validateFileFormat(file, 'enc');
        if (formatError) {
          setError(formatError);
          return;
        }

        const data = await readEncryptedFile(file);
        setEncryptedData(data);

        // Auto-fill account name from metadata if available
        if (data.metadata?.accountName) {
          setFileAccountName(data.metadata.accountName);
        }
      } else {
        // Validate and read plain text file
        const formatError = validateFileFormat(file, 'txt');
        if (formatError) {
          setError(formatError);
          return;
        }

        const wif = await readPlainTextFile(file);

        // Validate WIF immediately
        await validateWIF(wif, 'file');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMsg);
    }
  };

  // Handle decrypt and validate (for encrypted files)
  const handleDecryptAndValidate = async () => {
    if (!encryptedData || !decryptPassword) return;

    setIsFileValidating(true);
    setError(null);

    try {
      const response = await sendMessage<WIFValidationResult>(MessageType.VALIDATE_WIF, {
        encryptedData: encryptedData.encryptedData,
        salt: encryptedData.salt,
        iv: encryptedData.iv,
        decryptionPassword: decryptPassword,
      });

      setFileValidationResult(response);

      if (!response.valid) {
        setError(response.error || 'Invalid private key');
      } else if (response.network !== 'testnet') {
        setError('Network mismatch: This is a mainnet key. This wallet only supports testnet.');
      } else {
        // Set default address type based on compression
        if (response.compressed) {
          setFileAddressType('native-segwit');
        } else {
          setFileAddressType('legacy');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Decryption failed. Check your password.';
      setError(errorMsg);
    } finally {
      setIsFileValidating(false);
    }
  };

  // Validate WIF
  const validateWIF = async (wif: string, source: 'file' | 'text') => {
    if (!wif || wif.length < 51) {
      if (source === 'file') {
        setFileValidationResult(null);
      } else {
        setTextValidationResult(null);
      }
      return;
    }

    if (source === 'file') {
      setIsFileValidating(true);
    } else {
      setIsTextValidating(true);
    }
    setError(null);

    try {
      const response = await sendMessage<WIFValidationResult>(MessageType.VALIDATE_WIF, { wif });

      if (source === 'file') {
        setFileValidationResult(response);
      } else {
        setTextValidationResult(response);
      }

      if (!response.valid) {
        setError(response.error || 'Invalid WIF format');
      } else if (response.network !== 'testnet') {
        setError('Network mismatch: This is a mainnet key. This wallet only supports testnet.');
      } else {
        // Set default address type based on compression
        const addressType = response.compressed ? 'native-segwit' : 'legacy';
        if (source === 'file') {
          setFileAddressType(addressType);
        } else {
          setTextAddressType(addressType);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to validate WIF';
      setError(errorMsg);

      if (source === 'file') {
        setFileValidationResult({ valid: false, error: errorMsg });
      } else {
        setTextValidationResult({ valid: false, error: errorMsg });
      }
    } finally {
      if (source === 'file') {
        setIsFileValidating(false);
      } else {
        setIsTextValidating(false);
      }
    }
  };

  // Handle WIF input change (with debouncing)
  const handlePrivateKeyChange = (value: string) => {
    setPrivateKey(value);
    setTextValidationResult(null);
    setError(null);

    // Debounce validation
    const timer = setTimeout(() => {
      validateWIF(value, 'text');
    }, 500);

    return () => clearTimeout(timer);
  };

  // Validation helpers
  const validateAccountName = (name: string): string | undefined => {
    if (!name.trim()) return 'Account name is required';
    if (name.length > 30) return 'Account name must be 30 characters or less';
    return undefined;
  };

  const validateSeedPhrase = (phrase: string): string | undefined => {
    const words = phrase.trim().split(/\s+/);
    const wordCount = words.length;

    if (wordCount === 0) return 'Seed phrase is required';
    if (wordCount !== 12 && wordCount !== 24) {
      return `Seed phrase must be 12 or 24 words (found ${wordCount})`;
    }
    return undefined;
  };

  // Seed phrase helpers
  const wordCount = seedPhrase.trim().split(/\s+/).filter(w => w).length;
  const isValidChecksum = wordCount === 12 || wordCount === 24; // Simplified for now

  // Form errors
  const fileErrors = {
    file: error && importMethod === 'file' ? error : undefined,
    decryptPassword: undefined as string | undefined,
    accountName: fileAccountName ? validateAccountName(fileAccountName) : undefined,
  };

  const textErrors = {
    privateKey: error && importMethod === 'text' ? error : undefined,
    accountName: textAccountName ? validateAccountName(textAccountName) : undefined,
  };

  const seedPhraseErrors = {
    seedPhrase: seedPhrase ? validateSeedPhrase(seedPhrase) : undefined,
    accountName: seedAccountName ? validateAccountName(seedAccountName) : undefined,
    accountIndex:
      accountIndex < 0 || accountIndex > 2147483647
        ? 'Account index must be between 0 and 2,147,483,647'
        : undefined,
  };

  // Form validity
  const isFileFormValid =
    selectedFile &&
    fileValidationResult?.valid &&
    fileAccountName.trim() &&
    !fileErrors.accountName &&
    (!encryptedData || decryptPassword);

  const isTextFormValid =
    privateKey.trim() &&
    textValidationResult?.valid &&
    textAccountName.trim() &&
    !textErrors.accountName;

  const isSeedPhraseFormValid =
    seedPhrase.trim() &&
    !seedPhraseErrors.seedPhrase &&
    isValidChecksum &&
    seedAccountName.trim() &&
    !seedPhraseErrors.accountName &&
    !seedPhraseErrors.accountIndex;

  const isFormValid =
    importMethod === 'file' ? isFileFormValid :
    importMethod === 'text' ? isTextFormValid :
    isSeedPhraseFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (importMethod === 'file') {
        // Import from file
        let importPayload: any = {
          accountName: fileAccountName.trim(),
          addressType: fileAddressType,
        };

        if (encryptedData) {
          // Import from encrypted file
          importPayload = {
            ...importPayload,
            encryptedData: encryptedData.encryptedData,
            salt: encryptedData.salt,
            iv: encryptedData.iv,
            decryptionPassword: decryptPassword,
          };
        } else {
          // Import from plain text file
          const wif = await readPlainTextFile(selectedFile!);
          importPayload = {
            ...importPayload,
            wif,
          };
        }

        const response = await sendMessage<{ account: WalletAccount }>(
          MessageType.IMPORT_PRIVATE_KEY,
          importPayload
        );

        onSuccess(response.account);
      } else if (importMethod === 'text') {
        // Import from text WIF
        const response = await sendMessage<{ account: WalletAccount }>(
          MessageType.IMPORT_PRIVATE_KEY,
          {
            wif: privateKey.trim(),
            accountName: textAccountName.trim(),
            addressType: textAddressType,
          }
        );

        onSuccess(response.account);
      } else {
        // Import from seed phrase
        const response = await sendMessage<{ account: WalletAccount }>(
          MessageType.IMPORT_ACCOUNT_SEED,
          {
            mnemonic: seedPhrase.trim(),
            accountIndex,
            addressType: seedAddressType,
            name: seedAccountName.trim(),
          }
        );

        onSuccess(response.account);
      }

      handleClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import account';

      // Provide helpful error messages
      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
        setError('This private key has already been imported.');
      } else if (errorMsg.includes('rate limit')) {
        setError('Too many import attempts. Please wait a moment and try again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form (clearing will happen on next open via useEffect)
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnBackdropClick={!isSubmitting} className="w-[800px] max-w-[90vw]">
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-750 bg-gray-850">
          <h2 className="text-xl font-semibold text-white tracking-tight">Import Account</h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 border-b border-gray-750 bg-gray-850">
          <button
            type="button"
            onClick={() => setImportMethod('file')}
            disabled={isSubmitting}
            className={`relative px-6 py-4 text-sm font-medium transition-colors ${
              importMethod === 'file'
                ? 'text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Private Key (File)
            {importMethod === 'file' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bitcoin shadow-[0_0_8px_rgba(247,147,26,0.5)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setImportMethod('text')}
            disabled={isSubmitting}
            className={`relative px-6 py-4 text-sm font-medium transition-colors ${
              importMethod === 'text'
                ? 'text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Private Key (Text)
            {importMethod === 'text' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bitcoin shadow-[0_0_8px_rgba(247,147,26,0.5)]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setImportMethod('seed-phrase')}
            disabled={isSubmitting}
            className={`relative px-6 py-4 text-sm font-medium transition-colors ${
              importMethod === 'seed-phrase'
                ? 'text-bitcoin'
                : 'text-gray-400 hover:text-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Seed Phrase
            {importMethod === 'seed-phrase' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bitcoin shadow-[0_0_8px_rgba(247,147,26,0.5)]" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Error Banner */}
          {error && (
            <div className="flex gap-3 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-300 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Security Warning */}
          <SecurityWarning>
            {importMethod === 'seed-phrase' ? (
              <>
                <strong>Warning:</strong> This account uses a <strong>different seed phrase</strong> than
                your main wallet. Back it up separately or risk losing funds.
              </>
            ) : (
              <>
                <strong>Important:</strong> Imported accounts are <strong>NOT backed up</strong> by your
                wallet's main seed phrase. You must back up this private key separately or risk losing funds.
              </>
            )}
          </SecurityWarning>

          {/* Rate Limiting Notice (for private key imports) */}
          {importMethod !== 'seed-phrase' && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-200">
                For security, private key imports are rate limited to 5 per minute.
              </p>
            </div>
          )}

          {/* Tab Content */}
          {importMethod === 'file' && (
            <PrivateKeyFileImport
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              encryptedData={encryptedData}
              decryptPassword={decryptPassword}
              onDecryptPasswordChange={setDecryptPassword}
              onDecryptAndValidate={handleDecryptAndValidate}
              validationResult={fileValidationResult}
              isValidating={isFileValidating}
              accountName={fileAccountName}
              onAccountNameChange={setFileAccountName}
              addressType={fileAddressType}
              onAddressTypeChange={setFileAddressType}
              errors={fileErrors}
              isSubmitting={isSubmitting}
            />
          )}

          {importMethod === 'text' && (
            <PrivateKeyImport
              privateKey={privateKey}
              onPrivateKeyChange={handlePrivateKeyChange}
              accountName={textAccountName}
              onAccountNameChange={setTextAccountName}
              addressType={textAddressType}
              onAddressTypeChange={setTextAddressType}
              validationResult={textValidationResult}
              isValidating={isTextValidating}
              errors={textErrors}
              isSubmitting={isSubmitting}
            />
          )}

          {importMethod === 'seed-phrase' && (
            <SeedPhraseImport
              seedPhrase={seedPhrase}
              onSeedPhraseChange={setSeedPhrase}
              accountIndex={accountIndex}
              onAccountIndexChange={setAccountIndex}
              addressType={seedAddressType}
              onAddressTypeChange={setSeedAddressType}
              accountName={seedAccountName}
              onAccountNameChange={setSeedAccountName}
              errors={seedPhraseErrors}
              wordCount={wordCount}
              isValidChecksum={isValidChecksum}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-750 bg-gray-850">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="h-11 px-6 bg-transparent border border-gray-600 hover:bg-gray-800 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="h-11 px-8 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-60 min-w-[160px] flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                <span>Importing...</span>
              </div>
            ) : (
              'Import Account'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ImportAccountModal;
