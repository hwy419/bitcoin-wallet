/**
 * ImportPrivateKeyModal - Private key import modal with multiple import methods
 *
 * Modal dialog for importing private keys into Bitcoin accounts. Supports three
 * import methods: encrypted file upload, plain text file upload, and direct paste.
 *
 * Features:
 * - Three import methods: Encrypted file, plain text file, manual paste
 * - File drag-and-drop support
 * - Real-time WIF validation
 * - Password decryption for encrypted files
 * - Network detection and validation
 * - Address type selection (for compressed keys)
 * - Duplicate key detection
 * - Account name customization
 * - Security warnings and rate limiting notices
 * - Dark mode support
 *
 * Security:
 * - Validates WIF format before import
 * - Checks network compatibility (testnet vs mainnet)
 * - Detects duplicate keys
 * - Clears sensitive data on close
 * - Obfuscates WIF in preview
 * - Shows security warnings
 *
 * Props:
 * - isOpen: Modal visibility
 * - onClose: Close modal callback
 * - onSuccess: Success callback with account name
 *
 * Usage:
 * <ImportPrivateKeyModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={(accountName) => console.log(`Imported: ${accountName}`)}
 * />
 */

import React, { useState, useEffect, useRef } from 'react';
import Modal from './shared/Modal';
import FormField from './shared/FormField';
import SecurityWarning from './shared/SecurityWarning';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType, AddressType } from '../../shared/types/index';
import {
  readEncryptedFile,
  readPlainTextFile,
  validateFileFormat,
  detectFileType,
  EncryptedKeyFile,
} from '../utils/fileReader';

type ImportMethod = 'encrypted-file' | 'plain-file' | 'paste';

interface ImportPrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (accountName: string) => void;
}

interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  firstAddress?: string;
  addressType?: AddressType;
  compressed?: boolean;
  error?: string;
}

export const ImportPrivateKeyModal: React.FC<ImportPrivateKeyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Import method state
  const [importMethod, setImportMethod] = useState<ImportMethod>('encrypted-file');

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Encrypted file state
  const [encryptedData, setEncryptedData] = useState<EncryptedKeyFile | null>(null);
  const [decryptPassword, setDecryptPassword] = useState('');

  // Plain text / paste state
  const [wifInput, setWifInput] = useState('');
  const [validationResult, setValidationResult] = useState<WIFValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Account details state
  const [accountName, setAccountName] = useState('');
  const [selectedAddressType, setSelectedAddressType] = useState<AddressType>('native-segwit');

  // UI state
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<'method' | 'validate' | 'details' | 'complete'>('method');

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clear all sensitive data
      setImportMethod('encrypted-file');
      setSelectedFile(null);
      setEncryptedData(null);
      setDecryptPassword('');
      setWifInput('');
      setValidationResult(null);
      setAccountName('');
      setSelectedAddressType('native-segwit');
      setIsImporting(false);
      setIsValidating(false);
      setError(null);
      setSuccess(false);
      setCurrentStep('method');
    } else {
      // Generate default account name
      generateDefaultAccountName();
    }
  }, [isOpen]);

  // Generate default account name
  const generateDefaultAccountName = async () => {
    try {
      const response = await sendMessage<{ accounts: any[] }>(MessageType.GET_WALLET_STATE);
      const importedCount = response.accounts.filter((acc: any) => acc.importType === 'private-key').length;
      setAccountName(`Imported Account ${importedCount + 1}`);
    } catch {
      setAccountName('Imported Account 1');
    }
  };

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);
    setEncryptedData(null);
    setWifInput('');
    setValidationResult(null);

    try {
      if (importMethod === 'encrypted-file') {
        // Validate file format
        const formatError = validateFileFormat(file, 'enc');
        if (formatError) {
          setError(formatError);
          return;
        }

        // Read encrypted file
        const data = await readEncryptedFile(file);
        setEncryptedData(data);

        // Auto-fill account name from metadata if available
        if (data.metadata?.accountName) {
          setAccountName(data.metadata.accountName);
        }
      } else if (importMethod === 'plain-file') {
        // Validate file format
        const formatError = validateFileFormat(file, 'txt');
        if (formatError) {
          setError(formatError);
          return;
        }

        // Read plain text file
        const wif = await readPlainTextFile(file);
        setWifInput(wif);

        // Validate WIF
        await validateWIF(wif);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMsg);
    }
  };

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Validate WIF
  const validateWIF = async (wif: string) => {
    if (!wif || wif.length < 51) {
      setValidationResult(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await sendMessage<WIFValidationResult>(MessageType.VALIDATE_WIF, { wif });

      setValidationResult(response);

      if (!response.valid) {
        setError(response.error || 'Invalid WIF format');
      } else if (response.network !== 'testnet') {
        setError('Network mismatch: This is a mainnet key. This wallet only supports testnet.');
      } else {
        // Set default address type based on compression
        if (response.compressed) {
          setSelectedAddressType('native-segwit');
        } else {
          setSelectedAddressType('legacy');
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to validate WIF';
      setError(errorMsg);
      setValidationResult({ valid: false, error: errorMsg });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle WIF input change (with debouncing)
  const handleWifInputChange = (value: string) => {
    setWifInput(value);
    setValidationResult(null);
    setError(null);

    // Debounce validation
    const timer = setTimeout(() => {
      validateWIF(value);
    }, 500);

    return () => clearTimeout(timer);
  };

  // Handle decrypt and validate (for encrypted files)
  const handleDecryptAndValidate = async () => {
    if (!encryptedData || !decryptPassword) return;

    setIsValidating(true);
    setError(null);

    try {
      // Import the encrypted key data with decryption
      const response = await sendMessage<WIFValidationResult>(MessageType.VALIDATE_WIF, {
        encryptedData: encryptedData.encryptedData,
        salt: encryptedData.salt,
        iv: encryptedData.iv,
        decryptionPassword: decryptPassword,
      });

      setValidationResult(response);

      if (!response.valid) {
        setError(response.error || 'Invalid private key');
      } else if (response.network !== 'testnet') {
        setError('Network mismatch: This is a mainnet key. This wallet only supports testnet.');
      } else {
        // Set default address type based on compression
        if (response.compressed) {
          setSelectedAddressType('native-segwit');
        } else {
          setSelectedAddressType('legacy');
        }
        // Move to details step
        setCurrentStep('details');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Decryption failed. Check your password.';
      setError(errorMsg);
    } finally {
      setIsValidating(false);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!validationResult?.valid || !accountName) return;

    setIsImporting(true);
    setError(null);

    try {
      let importPayload: any = {
        accountName,
        addressType: selectedAddressType,
      };

      if (importMethod === 'encrypted-file' && encryptedData) {
        // Import from encrypted file
        importPayload = {
          ...importPayload,
          encryptedData: encryptedData.encryptedData,
          salt: encryptedData.salt,
          iv: encryptedData.iv,
          decryptionPassword: decryptPassword,
        };
      } else {
        // Import from plain text WIF
        importPayload = {
          ...importPayload,
          wif: wifInput,
        };
      }

      const response = await sendMessage<{ account: any; firstAddress: string }>(
        MessageType.IMPORT_PRIVATE_KEY,
        importPayload
      );

      // Success
      setSuccess(true);
      setCurrentStep('complete');

      // Call success callback
      if (onSuccess) {
        onSuccess(accountName);
      }

      // Auto-close after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to import private key';

      // Provide helpful error messages
      if (errorMsg.includes('duplicate') || errorMsg.includes('already exists')) {
        setError('This private key has already been imported.');
      } else if (errorMsg.includes('rate limit')) {
        setError('Too many import attempts. Please wait a moment and try again.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Obfuscate WIF for display
  const obfuscateWIF = (wif: string): string => {
    if (wif.length <= 12) return wif;
    return `${wif.slice(0, 6)}...${wif.slice(-6)}`;
  };

  // Address type display names
  const addressTypeDisplayName = {
    legacy: 'Legacy (P2PKH)',
    segwit: 'SegWit (P2SH-P2WPKH)',
    'native-segwit': 'Native SegWit (P2WPKH)',
  };

  // Check if form is valid
  const isFormValid = () => {
    if (!validationResult?.valid) return false;
    if (!accountName.trim()) return false;
    if (importMethod === 'encrypted-file' && !decryptPassword) return false;
    return true;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-3xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Import Private Key</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Security Warning */}
        <SecurityWarning>
          <strong>Important:</strong> Imported accounts are NOT backed up by your wallet's main
          seed phrase. You must back up this private key separately. Keep it secure and never share
          it with anyone.
        </SecurityWarning>

        {/* Rate Limiting Notice */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-200">
            For security, private key imports are rate limited to 5 per minute.
          </p>
        </div>

        {/* Import Method Selection */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Import Method</h3>
          <div className="space-y-3">
            {/* Encrypted File Option */}
            <label
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                importMethod === 'encrypted-file'
                  ? 'bg-bitcoin-subtle border-bitcoin'
                  : 'bg-gray-850 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="importMethod"
                value="encrypted-file"
                checked={importMethod === 'encrypted-file'}
                onChange={(e) => {
                  setImportMethod(e.target.value as ImportMethod);
                  setSelectedFile(null);
                  setEncryptedData(null);
                  setWifInput('');
                  setValidationResult(null);
                  setError(null);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">Upload Encrypted File</span>
                  <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Import a password-protected .enc file exported from this wallet.
                </p>
              </div>
            </label>

            {/* Plain Text File Option */}
            <label
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                importMethod === 'plain-file'
                  ? 'bg-yellow-500/10 border-yellow-500'
                  : 'bg-gray-850 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="importMethod"
                value="plain-file"
                checked={importMethod === 'plain-file'}
                onChange={(e) => {
                  setImportMethod(e.target.value as ImportMethod);
                  setSelectedFile(null);
                  setEncryptedData(null);
                  setWifInput('');
                  setValidationResult(null);
                  setError(null);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">Upload Plain Text File</span>
                  <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs rounded">
                    Caution
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Import a .txt file containing a private key in WIF format.
                </p>
              </div>
            </label>

            {/* Paste Option */}
            <label
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                importMethod === 'paste'
                  ? 'bg-yellow-500/10 border-yellow-500'
                  : 'bg-gray-850 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="importMethod"
                value="paste"
                checked={importMethod === 'paste'}
                onChange={(e) => {
                  setImportMethod(e.target.value as ImportMethod);
                  setSelectedFile(null);
                  setEncryptedData(null);
                  setWifInput('');
                  setValidationResult(null);
                  setError(null);
                }}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">Paste Private Key</span>
                  <span className="px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs rounded">
                    Caution
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Directly paste a private key in WIF format.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Encrypted File Upload */}
        {importMethod === 'encrypted-file' && (
          <div className="mt-6 space-y-4">
            {/* File Drop Zone */}
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-bitcoin bg-bitcoin-subtle'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-850'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".enc"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-white mb-1">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    Drop encrypted file here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">Accepts .enc files only</p>
                </div>
              )}
            </div>

            {/* Decryption Password */}
            {encryptedData && (
              <div className="space-y-4">
                <FormField
                  label="Decryption Password"
                  id="decrypt-password"
                  required
                  helperText="Enter the password used to encrypt this private key"
                >
                  <input
                    type="password"
                    id="decrypt-password"
                    value={decryptPassword}
                    onChange={(e) => setDecryptPassword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && decryptPassword) {
                        handleDecryptAndValidate();
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent"
                    placeholder="Enter decryption password"
                    autoComplete="off"
                  />
                </FormField>

                <button
                  onClick={handleDecryptAndValidate}
                  disabled={!decryptPassword || isValidating}
                  className="w-full bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  {isValidating ? 'Decrypting...' : 'Decrypt and Validate'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Plain Text File Upload */}
        {importMethod === 'plain-file' && (
          <div className="mt-6">
            <div
              ref={dropZoneRef}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragging
                  ? 'border-bitcoin bg-bitcoin-subtle'
                  : 'border-gray-700 hover:border-gray-600 bg-gray-850'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-white mb-1">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">
                    Drop text file here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">Accepts .txt files only</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paste WIF */}
        {importMethod === 'paste' && (
          <div className="mt-6">
            <FormField
              label="Private Key (WIF Format)"
              id="wif-input"
              required
              helperText="Paste your private key in Wallet Import Format (WIF)"
            >
              <textarea
                id="wif-input"
                value={wifInput}
                onChange={(e) => handleWifInputChange(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent font-mono text-sm resize-none"
                placeholder="Paste WIF here (e.g., cT1Y...ABC)"
                spellCheck={false}
              />
            </FormField>

            {/* Validation Status */}
            {isValidating && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Validating...
              </div>
            )}

            {validationResult && !isValidating && (
              <div className="mt-3">
                {validationResult.valid ? (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Valid WIF - {validationResult.network}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-red-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Invalid WIF format
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Preview / Validation Results */}
        {validationResult && validationResult.valid && (importMethod !== 'encrypted-file' || currentStep === 'details') && (
          <div className="mt-6 p-4 bg-gray-850 border border-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Preview</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Network:</span>
                <span className="text-sm font-medium text-white capitalize">
                  {validationResult.network}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Key Type:</span>
                <span className="text-sm font-medium text-white">
                  {validationResult.compressed ? 'Compressed' : 'Uncompressed'}
                </span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-sm text-gray-400">First Address:</span>
                <span className="text-xs font-mono text-gray-300 break-all text-right ml-4 max-w-[300px]">
                  {validationResult.firstAddress}
                </span>
              </div>
              {importMethod !== 'encrypted-file' && wifInput && (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Private Key:</span>
                  <span className="text-xs font-mono text-gray-500">
                    {obfuscateWIF(wifInput)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Details Form */}
        {validationResult && validationResult.valid && (importMethod !== 'encrypted-file' || currentStep === 'details') && (
          <div className="mt-6 space-y-4">
            <FormField
              label="Account Name"
              id="account-name"
              required
              helperText="Choose a name to identify this account"
            >
              <input
                type="text"
                id="account-name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent"
                placeholder="e.g., Imported Account 1"
                maxLength={50}
              />
            </FormField>

            {/* Address Type Selection (only for compressed keys) */}
            {validationResult.compressed && (
              <FormField
                label="Address Type"
                id="address-type"
                required
                helperText="Choose the address format for this account"
              >
                <select
                  id="address-type"
                  value={selectedAddressType}
                  onChange={(e) => setSelectedAddressType(e.target.value as AddressType)}
                  className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent"
                >
                  <option value="legacy">Legacy (P2PKH) - Slower, higher fees</option>
                  <option value="segwit">SegWit (P2SH-P2WPKH) - Moderate fees</option>
                  <option value="native-segwit">
                    Native SegWit (P2WPKH) - Recommended, lowest fees
                  </option>
                </select>
              </FormField>
            )}

            {/* Uncompressed key notice */}
            {!validationResult.compressed && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  This is an uncompressed private key. Only Legacy (P2PKH) addresses are supported.
                </p>
              </div>
            )}

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={!isFormValid() || isImporting}
              className="w-full mt-4 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isImporting ? 'Importing...' : 'Import Account'}
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-red-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mt-4 p-4 bg-green-500/15 border border-green-500/30 rounded-lg">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-green-400 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-green-300">
                Successfully imported private key as "{accountName}"!
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportPrivateKeyModal;
