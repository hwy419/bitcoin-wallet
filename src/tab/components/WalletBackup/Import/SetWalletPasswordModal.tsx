/**
 * SetWalletPasswordModal - Create wallet password after import
 *
 * Only shown in fresh install flow. User creates new wallet password
 * after backup has been successfully decrypted.
 *
 * Features:
 * - Password requirements (8+ chars, complexity)
 * - Confirm password field
 * - Real-time validation
 */

import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import PasswordRequirementsChecklist from '../../shared/PasswordRequirementsChecklist';

interface SetWalletPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (password: string) => Promise<void>;
}

export const SetWalletPasswordModal: React.FC<SetWalletPasswordModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const MIN_LENGTH = 8;
  const requirements = {
    minLength: MIN_LENGTH,
    requireUpper: true,
    requireLower: true,
    requireNumber: true,
    requireSpecial: false,
  };

  // Check if password meets requirements
  const meetsRequirements =
    password.length >= MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);

  const passwordsMatch = password === confirmPassword;
  const canSubmit = password && confirmPassword && meetsRequirements && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!meetsRequirements) {
      setError('Password must meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await onCreate(password);
      // Modal will close via parent component on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnBackdropClick={false} className="max-w-lg">
      <form onSubmit={handleSubmit} className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">🔐</span>
          <h2 className="text-xl font-bold text-white">Create Wallet Password</h2>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-300 mb-4">
          Your wallet backup has been decrypted successfully. Now create a password to unlock your wallet.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          This password can be different from the backup password you just entered.
        </p>

        {/* Password Input with Requirements */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Wallet Password
          </label>
          <div className="relative mb-3">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 bg-gray-950 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors pr-12"
              placeholder="Enter password"
              disabled={isLoading}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
          </div>

          {/* Requirements Checklist */}
          <PasswordRequirementsChecklist password={password} requirements={requirements} />
        </div>

        {/* Confirm Password Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Confirm Wallet Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors pr-12"
              placeholder="Confirm password"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              tabIndex={-1}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {showConfirmPassword ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300 flex items-start">
              <span className="mr-2">❌</span>
              <span>{error}</span>
            </p>
          </div>
        )}

        {/* Password Mismatch Warning */}
        {confirmPassword && !passwordsMatch && (
          <div role="alert" className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300 flex items-start">
              <span className="mr-2">❌</span>
              <span>Passwords do not match</span>
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 bg-gray-800 hover:bg-gray-750 disabled:bg-gray-700 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit || isLoading}
            className="flex-1 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              'Create Wallet →'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SetWalletPasswordModal;
