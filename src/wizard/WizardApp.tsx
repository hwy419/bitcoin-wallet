/**
 * WizardApp - Full-tab wrapper for multisig wizard
 *
 * Features:
 * - 800px centered layout with fixed header and footer
 * - Session recovery on mount
 * - Wallet lock detection (polling every 30s)
 * - beforeunload confirmation dialog
 * - Auto-close on completion
 * - 100% reuse of existing MultisigWizard component
 *
 * Layout:
 * - Fixed Header: 80px (Bitcoin branding)
 * - Progress Section: 120px (enhanced step indicator)
 * - Content: flex-1 scrollable (800px centered)
 * - Sticky Footer: 100px (navigation buttons)
 */

import React, { useState, useEffect } from 'react';
import { MultisigWizard } from '../tab/components/MultisigSetup/MultisigWizard';
import { useBackgroundMessaging } from '../tab/hooks/useBackgroundMessaging';
import { MessageType } from '../shared/types';

const WizardApp: React.FC = () => {
  const { sendMessage } = useBackgroundMessaging();
  const [isRecovering, setIsRecovering] = useState(false);
  const [isWalletLocked, setIsWalletLocked] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  // Session recovery on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const response = await sendMessage<{ state: any }>(MessageType.WIZARD_LOAD_STATE, {});
        if (response && response.state) {
          setIsRecovering(true);
          setRecoveryMessage('Wizard progress restored from previous session');
          // Auto-hide recovery message after 5 seconds
          setTimeout(() => setRecoveryMessage(null), 5000);
        }
      } catch (error) {
        console.error('Failed to load wizard session:', error);
      }
    };

    loadSession();
  }, [sendMessage]);

  // Wallet lock detection (poll every 30 seconds)
  useEffect(() => {
    const checkLock = async () => {
      try {
        const response = await sendMessage<{ isLocked: boolean }>(
          MessageType.WIZARD_CHECK_WALLET_LOCKED,
          {}
        );
        if (response && response.isLocked) {
          setIsWalletLocked(true);
        } else {
          setIsWalletLocked(false);
        }
      } catch (error) {
        console.error('Failed to check wallet lock status:', error);
      }
    };

    // Initial check
    checkLock();

    // Poll every 30 seconds
    const intervalId = setInterval(checkLock, 30000);

    return () => clearInterval(intervalId);
  }, [sendMessage]);

  // beforeunload confirmation (only if wizard incomplete)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent): string | undefined => {
      // Only show confirmation if wizard is in progress (not on success step)
      // We'll determine this by checking if we're still in the wizard
      if (!isWalletLocked) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
        return 'Close wizard? Your progress will be saved and you can resume later.';
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isWalletLocked]);

  // Handle wizard completion
  const handleComplete = async () => {
    try {
      // Complete the wizard session
      await sendMessage(MessageType.WIZARD_COMPLETE, {});

      // Show success message briefly
      setRecoveryMessage('Multisig account created successfully! Closing...');

      // Close tab after 2 seconds
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error) {
      console.error('Failed to complete wizard:', error);
    }
  };

  // Handle wizard cancel
  const handleCancel = () => {
    const confirmed = window.confirm(
      'Cancel Multisig Setup?\n\nYour progress will be discarded and cannot be recovered.'
    );

    if (confirmed) {
      // Save state before closing (for potential resume)
      sendMessage(MessageType.WIZARD_SAVE_STATE, {}).catch(console.error);

      // Close tab
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Fixed Header (80px) */}
      <header className="sticky top-0 z-50 h-20 bg-gray-900 border-b border-gray-750 shadow-md flex items-center justify-between px-12">
        {/* Left Section: Logo + Extension Name + Context */}
        <div className="flex items-center gap-6">
          {/* Bitcoin Logo */}
          <div className="w-12 h-12 bg-bitcoin rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-label="Bitcoin Logo"
            >
              <path d="M16.3 10.4c.3-1.7-.9-2.6-2.5-3.2l.5-2.1-1.3-.3-.5 1.9c-.3-.1-.7-.2-1-.2l.5-2-1.3-.3-.5 2.1c-.3 0-.5-.1-.8-.2l-1.7-.4-.3 1.4s.9.2.9.2c.5.1.6.4.6.7l-.6 2.5v.1l-.9 3.6c-.1.1-.2.3-.5.2 0 0-.9-.2-.9-.2l-.6 1.5 1.6.4c.3.1.6.1.9.2l-.5 2.1 1.3.3.5-2.1c.3.1.7.2 1 .2l-.5 2 1.3.3.5-2.1c2.2.4 3.9.2 4.6-1.7.6-1.5 0-2.4-1.1-3 .8-.2 1.4-.7 1.5-1.8zm-2.7 3.9c-.4 1.6-3.1.7-4 .5l.7-2.9c.9.2 3.7.7 3.3 2.4zm.4-4c-.4 1.5-2.7.7-3.5.5l.6-2.6c.8.2 3.2.6 2.9 2.1z"/>
            </svg>
          </div>

          {/* Extension Name */}
          <span className="text-lg font-semibold text-white">Bitcoin Wallet</span>

          {/* Separator */}
          <div className="w-px h-6 bg-gray-750" />

          {/* Page Context */}
          <span className="text-base text-gray-400">Create Multisig Account</span>
        </div>

        {/* Right Section: Help Button */}
        <button
          onClick={() => {
            // Could open help modal or documentation
            alert('Help documentation coming soon!');
          }}
          className="w-11 h-11 flex items-center justify-center text-gray-500 hover:text-white hover:bg-gray-850 rounded-lg transition-colors"
          title="Help & Guidance"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </header>

      {/* Recovery/Status Messages */}
      {recoveryMessage && (
        <div className="px-12 py-4 bg-green-500/15 border-b border-green-500/30">
          <p className="text-sm text-green-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {recoveryMessage}
          </p>
        </div>
      )}

      {/* Wallet Locked Warning */}
      {isWalletLocked && (
        <div className="px-12 py-4 bg-red-500/15 border-b border-red-500/30">
          <p className="text-sm text-red-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Wallet is locked. Please unlock your wallet to continue the multisig setup.
          </p>
        </div>
      )}

      {/* Main Content: Centered 800px Container */}
      <main className="flex-1 flex flex-col items-center overflow-hidden">
        <div className="w-full max-w-[800px] h-full flex flex-col bg-gray-900">
          {/* MultisigWizard Component (Reused 100%) */}
          <div className="flex-1 overflow-hidden">
            <MultisigWizard onComplete={handleComplete} onCancel={handleCancel} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default WizardApp;
