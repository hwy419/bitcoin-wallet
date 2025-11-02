import React, { useState, useEffect } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType, Account, Balance } from '../../shared/types';

interface UnlockScreenProps {
  onUnlock: (accounts: Account[], balance: Balance) => void;
}

const UnlockScreen: React.FC<UnlockScreenProps> = ({ onUnlock }) => {
  const { sendMessage } = useBackgroundMessaging();

  // In development mode, pre-fill password from .env.local (gitignored)
  // This saves developers from typing password on every reload
  // Production builds always get empty string (process.env.DEV_PASSWORD = '')
  const [password, setPassword] = useState(process.env.DEV_PASSWORD || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-focus password input on mount
  useEffect(() => {
    const input = document.getElementById('password-input') as HTMLInputElement;
    if (input) {
      input.focus();
    }
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await sendMessage<{ accounts: Account[]; balance: Balance }>(
        MessageType.UNLOCK_WALLET,
        { password }
      );

      // Success - notify parent
      onUnlock(response.accounts, response.balance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock wallet');
      setPassword(''); // Clear password on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && password) {
      handleUnlock(e as any);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="w-full max-w-md bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8">
        {/* Logo/Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-bitcoin/10 border-2 border-bitcoin/30 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-bitcoin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Lock icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 text-center">Welcome Back</h1>
        <p className="text-sm text-gray-400 mb-6 text-center">
          Enter your password to unlock your wallet
        </p>

        <form onSubmit={handleUnlock}>
          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password-input" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
              {/* Show/Hide Password Toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 focus:outline-none transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Unlock Button */}
          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Unlocking...
              </span>
            ) : (
              'Unlock Wallet'
            )}
          </button>
        </form>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Forgot your password? Your wallet cannot be recovered without it.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnlockScreen;
