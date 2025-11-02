/**
 * ExportPrivateKeyModal - Private key export modal with security warnings
 *
 * Modal dialog for exporting private keys from Bitcoin accounts. Supports both
 * encrypted file export (recommended) and plain text export (dangerous).
 *
 * Features:
 * - Two export modes: Encrypted file and Plain text
 * - Password-protected encryption for secure exports
 * - Password strength validation
 * - Prominent security warnings
 * - File download functionality
 * - Copy to clipboard for plain text
 * - Risk acknowledgment checkbox for plain text export
 * - Dark mode support
 *
 * Security:
 * - Only works with single-signature accounts (not multisig)
 * - Requires wallet to be unlocked
 * - Clears sensitive data on close
 * - Multiple warnings about private key security
 *
 * Props:
 * - isOpen: Modal visibility
 * - onClose: Close modal callback
 * - accountIndex: Account to export from
 * - accountName: Account name for display
 * - firstAddress: First receiving address for display
 * - addressType: Address type (legacy/segwit/native-segwit)
 *
 * Usage:
 * <ExportPrivateKeyModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   accountIndex={0}
 *   accountName="Account 1"
 *   firstAddress="tb1q..."
 *   addressType="native-segwit"
 * />
 */

import React, { useState, useEffect } from 'react';
import Modal from './shared/Modal';
import FormField from './shared/FormField';
import SecurityWarning from './shared/SecurityWarning';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType } from '../../shared/types/index';
import {
  downloadEncryptedKey,
  downloadPlainKey,
  generateSafeFilename,
} from '../utils/fileDownload';

type ExportMode = 'encrypted' | 'plaintext';
type AddressTypeDisplay = 'legacy' | 'segwit' | 'native-segwit';

interface ExportPrivateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountIndex: number;
  accountName: string;
  firstAddress: string;
  addressType: AddressTypeDisplay;
}

export const ExportPrivateKeyModal: React.FC<ExportPrivateKeyModalProps> = ({
  isOpen,
  onClose,
  accountIndex,
  accountName,
  firstAddress,
  addressType,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Export mode state
  const [exportMode, setExportMode] = useState<ExportMode>('encrypted');

  // Encrypted export state
  const [encryptPassword, setEncryptPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Plain text export state
  const [showPlainWIF, setShowPlainWIF] = useState(false);
  const [plainWIF, setPlainWIF] = useState('');
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  // UI state
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedWIF, setCopiedWIF] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clear all sensitive data
      setExportMode('encrypted');
      setEncryptPassword('');
      setConfirmPassword('');
      setShowPlainWIF(false);
      setPlainWIF('');
      setRiskAcknowledged(false);
      setIsExporting(false);
      setError(null);
      setCopiedWIF(false);
    }
  }, [isOpen]);

  // Password strength validation
  const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    if (password.length < 8) return 'weak';

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (password.length >= 12 && criteriaCount >= 3) return 'strong';
    if (password.length >= 8 && criteriaCount >= 2) return 'medium';
    return 'weak';
  };

  const passwordStrength = encryptPassword ? getPasswordStrength(encryptPassword) : null;

  const strengthColors = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500',
  };

  const strengthLabels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
  };

  // Validation
  const passwordsMatch = encryptPassword && encryptPassword === confirmPassword;
  const isEncryptedFormValid =
    encryptPassword.length >= 8 &&
    passwordsMatch &&
    passwordStrength !== 'weak';

  const isPlainTextFormValid = riskAcknowledged;

  // Address type display names
  const addressTypeDisplayName = {
    'legacy': 'Legacy (P2PKH)',
    'segwit': 'SegWit (P2SH-P2WPKH)',
    'native-segwit': 'Native SegWit (P2WPKH)',
  }[addressType];

  // Handle encrypted export
  const handleEncryptedExport = async () => {
    if (!isEncryptedFormValid) return;

    setIsExporting(true);
    setError(null);

    try {
      const response = await sendMessage<{
        wif: string;
        encrypted: boolean;
        encryptedData: string;
        salt: string;
        iv: string;
        metadata: { accountName: string; addressType: string; timestamp: string };
      }>(
        MessageType.EXPORT_PRIVATE_KEY,
        { accountIndex, password: encryptPassword }
      );

      if (!response.encrypted || !response.encryptedData) {
        throw new Error('Failed to encrypt private key');
      }

      // Download encrypted file
      const filename = generateSafeFilename(accountName);
      downloadEncryptedKey(
        {
          encryptedData: response.encryptedData,
          salt: response.salt,
          iv: response.iv,
          metadata: response.metadata,
        },
        filename
      );

      // Close modal on success
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export private key';

      // Provide helpful error messages
      if (errorMsg.includes('locked')) {
        setError('Wallet is locked. Please unlock your wallet first.');
      } else if (errorMsg.includes('multisig')) {
        setError('Cannot export private keys from multisig accounts.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Handle plain text reveal
  const handleRevealPlainText = async () => {
    if (!isPlainTextFormValid) return;

    setIsExporting(true);
    setError(null);

    try {
      const response = await sendMessage<{
        wif: string;
        encrypted: boolean;
        metadata: { accountName: string; addressType: string; timestamp: string };
      }>(
        MessageType.EXPORT_PRIVATE_KEY,
        { accountIndex }
      );

      setPlainWIF(response.wif);
      setShowPlainWIF(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export private key';

      if (errorMsg.includes('locked')) {
        setError('Wallet is locked. Please unlock your wallet first.');
      } else if (errorMsg.includes('multisig')) {
        setError('Cannot export private keys from multisig accounts.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Handle download plain text
  const handleDownloadPlainText = () => {
    if (!plainWIF) return;

    const filename = generateSafeFilename(accountName);
    downloadPlainKey(plainWIF, filename, accountName, addressTypeDisplayName);
  };

  // Handle copy WIF
  const handleCopyWIF = async () => {
    if (!plainWIF) return;

    try {
      await navigator.clipboard.writeText(plainWIF);
      setCopiedWIF(true);
      setTimeout(() => setCopiedWIF(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="w-full max-w-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Export Private Key</h2>
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

        {/* Top Security Warning */}
        <SecurityWarning>
          <strong>Critical Security Warning:</strong> Your private key gives complete access to
          your funds. Never share it with anyone. Anyone who obtains this key can steal all your
          Bitcoin.
        </SecurityWarning>

        {/* Account Information */}
        <div className="mt-6 p-4 bg-gray-850 border border-gray-700 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Account Information</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Account Name:</span>
              <span className="text-sm font-medium text-white">{accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-400">Address Type:</span>
              <span className="text-sm font-medium text-white">{addressTypeDisplayName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">First Address:</span>
              <span className="text-xs font-mono text-gray-300 truncate ml-4 max-w-[300px]">
                {firstAddress}
              </span>
            </div>
          </div>
        </div>

        {/* Export Mode Selection */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Export Method</h3>
          <div className="space-y-3">
            {/* Encrypted Option */}
            <label
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                exportMode === 'encrypted'
                  ? 'bg-bitcoin-subtle border-bitcoin'
                  : 'bg-gray-850 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="exportMode"
                value="encrypted"
                checked={exportMode === 'encrypted'}
                onChange={(e) => setExportMode(e.target.value as ExportMode)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">Encrypted File</span>
                  <span className="px-2 py-0.5 bg-green-500/20 border border-green-500/30 text-green-400 text-xs rounded">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  Download an encrypted .enc file protected by a password. Safer for backups and
                  storage.
                </p>
              </div>
            </label>

            {/* Plain Text Option */}
            <label
              className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                exportMode === 'plaintext'
                  ? 'bg-red-500/10 border-red-500'
                  : 'bg-gray-850 border-gray-700 hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="exportMode"
                value="plaintext"
                checked={exportMode === 'plaintext'}
                onChange={(e) => setExportMode(e.target.value as ExportMode)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-white">Plain Text</span>
                  <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded">
                    Dangerous
                  </span>
                </div>
                <p className="text-sm text-gray-400">
                  View or download the private key as plain text. Extremely risky - only use if
                  absolutely necessary.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Encrypted Export Form */}
        {exportMode === 'encrypted' && (
          <div className="mt-6 space-y-4">
            <FormField
              label="Encryption Password"
              id="encrypt-password"
              required
              helperText="Choose a strong password to protect your private key"
            >
              <input
                type="password"
                id="encrypt-password"
                value={encryptPassword}
                onChange={(e) => setEncryptPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent"
                placeholder="Enter encryption password"
                autoComplete="new-password"
              />
            </FormField>

            {/* Password Strength Indicator */}
            {passwordStrength && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Password Strength</span>
                  <span
                    className={`font-semibold ${
                      passwordStrength === 'strong'
                        ? 'text-green-400'
                        : passwordStrength === 'medium'
                        ? 'text-yellow-400'
                        : 'text-red-400'
                    }`}
                  >
                    {strengthLabels[passwordStrength]}
                  </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strengthColors[passwordStrength]}`}
                    style={{
                      width:
                        passwordStrength === 'strong'
                          ? '100%'
                          : passwordStrength === 'medium'
                          ? '66%'
                          : '33%',
                    }}
                  />
                </div>
                {passwordStrength === 'weak' && (
                  <p className="text-xs text-red-400">
                    Password is too weak. Use at least 8 characters with a mix of letters, numbers,
                    and symbols.
                  </p>
                )}
              </div>
            )}

            <FormField
              label="Confirm Password"
              id="confirm-password"
              required
              error={
                confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined
              }
            >
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-transparent"
                placeholder="Re-enter encryption password"
                autoComplete="new-password"
              />
            </FormField>

            <button
              onClick={handleEncryptedExport}
              disabled={!isEncryptedFormValid || isExporting}
              className="w-full mt-4 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
            >
              {isExporting ? 'Exporting...' : 'Export Encrypted File'}
            </button>
          </div>
        )}

        {/* Plain Text Export Form */}
        {exportMode === 'plaintext' && (
          <div className="mt-6 space-y-4">
            {/* Danger Warning */}
            <div className="p-4 bg-red-500/10 border-2 border-red-500 rounded-lg">
              <div className="flex gap-3">
                <svg
                  className="w-6 h-6 text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <h4 className="font-bold text-red-300 mb-2">EXTREME DANGER</h4>
                  <p className="text-sm text-red-200 leading-relaxed">
                    Exporting an unencrypted private key is extremely dangerous. If anyone obtains
                    this key, they can steal all your Bitcoin. Only export if you fully understand
                    the risks and have a secure method to store or use this key.
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Acknowledgment */}
            <label className="flex items-start gap-3 p-4 bg-gray-850 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                checked={riskAcknowledged}
                onChange={(e) => setRiskAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-gray-300">
                I understand the risks of exporting an unencrypted private key and will store it
                securely.
              </span>
            </label>

            {/* Show Private Key Button */}
            {!showPlainWIF && (
              <button
                onClick={handleRevealPlainText}
                disabled={!isPlainTextFormValid || isExporting}
                className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-colors"
              >
                {isExporting ? 'Loading...' : 'Show Private Key'}
              </button>
            )}

            {/* Display Private Key */}
            {showPlainWIF && plainWIF && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-400">
                      Private Key (WIF Format)
                    </span>
                    <button
                      onClick={handleCopyWIF}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:text-white transition-colors"
                    >
                      {copiedWIF ? (
                        <>
                          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-gray-900 border border-gray-800 rounded font-mono text-sm text-bitcoin break-all">
                    {plainWIF}
                  </div>
                </div>

                <button
                  onClick={handleDownloadPlainText}
                  className="w-full bg-gray-700 hover:bg-gray-650 active:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Download as .txt File
                </button>
              </div>
            )}
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
      </div>
    </Modal>
  );
};

export default ExportPrivateKeyModal;
