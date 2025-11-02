/**
 * MultisigWizard - Main container orchestrating 7-step multisig setup
 *
 * Step flow:
 * 1. Configuration (2-of-2, 2-of-3, 3-of-5)
 * 2. Address Type (P2WSH, P2SH-P2WSH, P2SH)
 * 3. Export Xpub (user's extended public key)
 * 4. Import Xpubs (co-signer keys)
 * 5. Verify Address (first multisig address verification)
 * 6. Name Account (review and name)
 * 7. Success (account created)
 *
 * Features:
 * - Progress indicator with 7 steps
 * - Header with back button and help
 * - Footer with navigation buttons
 * - Step validation before proceeding
 * - Smooth transitions between steps
 *
 * Usage:
 * <MultisigWizard onComplete={() => navigate('/dashboard')} onCancel={() => navigate(-1)} />
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMultisigWizard, WizardStep } from '../../hooks/useMultisigWizard';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType } from '../../../shared/types';
import ConfigSelector from './ConfigSelector';
import AddressTypeSelector from './AddressTypeSelector';
import XpubExport from './XpubExport';
import XpubImport from './XpubImport';
import AddressVerification from './AddressVerification';
import MultisigAccountSummary from './MultisigAccountSummary';

interface MultisigWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

interface StepConfig {
  number: number;
  label: string;
  key: string;
}

const STEPS: StepConfig[] = [
  { number: 1, label: 'Config', key: 'configuration' },
  { number: 2, label: 'Address', key: 'addressType' },
  { number: 3, label: 'Export', key: 'exportXpub' },
  { number: 4, label: 'Import', key: 'importXpubs' },
  { number: 5, label: 'Verify', key: 'verifyAddress' },
  { number: 6, label: 'Name', key: 'nameAccount' },
  { number: 7, label: 'Done', key: 'success' },
];

export const MultisigWizard: React.FC<MultisigWizardProps> = ({ onComplete, onCancel }) => {
  const wizard = useMultisigWizard();
  const { sendMessage } = useBackgroundMessaging();
  const contentAreaRef = useRef<HTMLDivElement>(null);

  // Unlock wallet modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState(process.env.DEV_PASSWORD || '');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Scroll to top when step changes
  useEffect(() => {
    if (contentAreaRef.current) {
      contentAreaRef.current.scrollTop = 0;
    }
  }, [wizard.state.currentStep]);

  const handleNext = async () => {
    // Step 6 (Name Account) -> Create account before advancing to success
    if (wizard.state.currentStep === 6) {
      await handleCreateAccount();
      return; // handleCreateAccount will advance to step 7 on success
    }

    // Step 7 (Success) -> Complete wizard
    if (wizard.state.currentStep === 7) {
      onComplete();
      return;
    }

    // All other steps -> Just advance
    wizard.nextStep();
  };

  const handleCreateAccount = async () => {
    // Set creating state
    wizard.setIsCreating(true);
    wizard.setError(null);

    try {
      // Prepare payload for CREATE_MULTISIG_ACCOUNT
      const payload = {
        config: wizard.state.selectedConfig!,
        addressType: wizard.state.selectedAddressType!,
        name: wizard.state.accountName.trim(),
        cosignerXpubs: wizard.state.cosignerXpubs.map(c => ({
          name: c.name,
          xpub: c.xpub,
          fingerprint: c.fingerprint,
        })),
      };

      // Call backend to create the account
      const response = await sendMessage<{ account: any }>(
        MessageType.CREATE_MULTISIG_ACCOUNT,
        payload
      );

      if (!response.account) {
        throw new Error('No account returned from backend');
      }

      console.log('Multisig account created successfully:', response.account);

      // Success - advance to step 7 (success screen)
      wizard.nextStep();
    } catch (error) {
      console.error('Failed to create multisig account:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create multisig account';

      // If wallet is locked, show unlock modal
      if (errorMessage.includes('Wallet is locked')) {
        setShowUnlockModal(true);
        wizard.setIsCreating(false);
        return;
      }

      wizard.setError(errorMessage);
    } finally {
      wizard.setIsCreating(false);
    }
  };

  // Handle unlock wallet
  const handleUnlock = async () => {
    setUnlockError(null);
    setIsUnlocking(true);

    try {
      // Unlock wallet
      await sendMessage(MessageType.UNLOCK_WALLET, {
        password: unlockPassword,
      });

      // Close modal and reset
      setShowUnlockModal(false);
      setUnlockPassword(process.env.DEV_PASSWORD || '');

      // Retry account creation
      await handleCreateAccount();
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      setUnlockError(
        error instanceof Error ? error.message : 'Failed to unlock wallet'
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleBack = () => {
    if (wizard.state.currentStep === 1) {
      onCancel();
    } else {
      wizard.previousStep();
    }
  };

  const getNextButtonText = (): string => {
    switch (wizard.state.currentStep) {
      case 6:
        return 'Create Account';
      case 7:
        return 'Done';
      default:
        return 'Next';
    }
  };

  const getCancelButtonText = (): string => {
    return wizard.state.currentStep === 1 ? 'Cancel' : 'Back';
  };

  const renderStepContent = () => {
    switch (wizard.state.currentStep) {
      case 1:
        return (
          <ConfigSelector
            selectedConfig={wizard.state.selectedConfig || undefined}
            onSelect={wizard.setSelectedConfig}
            onContinue={handleNext}
            showContinueButton={false}
          />
        );
      case 2:
        return (
          <AddressTypeSelector
            selectedAddressType={wizard.state.selectedAddressType || undefined}
            onSelect={wizard.setSelectedAddressType}
            onContinue={handleNext}
            showContinueButton={false}
          />
        );
      case 3:
        return (
          <XpubExport
            config={wizard.state.selectedConfig!}
            addressType={wizard.state.selectedAddressType!}
            onXpubReady={wizard.setMyXpub}
          />
        );
      case 4:
        return (
          <XpubImport
            config={wizard.state.selectedConfig!}
            myXpub={wizard.state.myXpub!}
            myFingerprint={wizard.state.myFingerprint!}
            cosigners={wizard.state.cosignerXpubs}
            onAddCosigner={wizard.addCosigner}
            onRemoveCosigner={wizard.removeCosigner}
            onUpdateCosignerName={wizard.updateCosignerName}
          />
        );
      case 5:
        return (
          <AddressVerification
            config={wizard.state.selectedConfig!}
            addressType={wizard.state.selectedAddressType!}
            myXpub={wizard.state.myXpub!}
            cosigners={wizard.state.cosignerXpubs}
            onAddressGenerated={wizard.setFirstAddress}
            onVerified={wizard.setAddressVerified}
          />
        );
      case 6:
        return (
          <MultisigAccountSummary
            config={wizard.state.selectedConfig!}
            addressType={wizard.state.selectedAddressType!}
            cosigners={wizard.state.cosignerXpubs}
            accountName={wizard.state.accountName}
            onNameChange={wizard.setAccountName}
            defaultName={wizard.getDefaultAccountName()}
            isCreating={wizard.state.isCreating}
            onCreateAccount={handleNext}
          />
        );
      case 7:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {/* Success Icon */}
            <div className="mb-6 w-24 h-24 bg-green-500/15 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">Multisig Account Created!</h2>
            <p className="text-base text-gray-400 mb-2">
              Your {wizard.state.selectedConfig} multisig account has been successfully created.
            </p>
            <p className="text-sm text-gray-500">
              You can now send and receive Bitcoin with enhanced security.
            </p>

            {/* Account Details */}
            <div className="mt-8 p-4 bg-gray-850 border border-gray-700 rounded-lg text-left w-full max-w-md">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account Name:</span>
                  <span className="text-white font-semibold">{wizard.state.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Configuration:</span>
                  <span className="text-white font-semibold">{wizard.state.selectedConfig}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Address Type:</span>
                  <span className="text-white font-semibold capitalize">
                    {wizard.state.selectedAddressType?.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Co-Signers:</span>
                  <span className="text-white font-semibold">{wizard.state.cosignerXpubs.length}</span>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-gray-950 flex flex-col">
      {/* Progress Indicator */}
      <div className="py-5 px-6 bg-gray-850 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((step, index) => {
            const isActive = wizard.state.currentStep === step.number;
            const isComplete = wizard.state.currentStep > step.number;

            return (
              <React.Fragment key={step.number}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full border-3 flex items-center justify-center transition-all duration-300 ${
                      isComplete
                        ? 'border-green-500 bg-green-500'
                        : isActive
                        ? 'border-bitcoin bg-bitcoin'
                        : 'border-gray-750 bg-transparent'
                    }`}
                  >
                    {isComplete ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-sm font-semibold ${
                          isActive ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {step.number}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-1 text-xs font-medium ${
                      isActive ? 'text-bitcoin' : isComplete ? 'text-green-500' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting Line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1 bg-gray-750 rounded-full mx-1 mt-[-20px]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        wizard.state.currentStep > step.number
                          ? 'bg-gradient-to-r from-bitcoin to-bitcoin-light'
                          : 'bg-transparent'
                      }`}
                      style={{
                        width:
                          wizard.state.currentStep > step.number
                            ? '100%'
                            : wizard.state.currentStep === step.number
                            ? '50%'
                            : '0%',
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content Area (scrollable) */}
      <div ref={contentAreaRef} className="flex-1 overflow-y-auto p-6 bg-gray-950">
        {wizard.state.error && (
          <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{wizard.state.error}</p>
          </div>
        )}

        <div className="transition-all duration-300">{renderStepContent()}</div>
      </div>

      {/* Footer - Full Width, Sticky to Bottom */}
      <div className="sticky bottom-0 w-full flex items-center justify-between px-12 py-5 bg-gray-900 border-t border-gray-700 flex-shrink-0">
        <button
          onClick={handleBack}
          className="px-8 py-3 bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 rounded-lg font-medium transition-colors text-base"
        >
          {getCancelButtonText()}
        </button>

        <button
          onClick={handleNext}
          disabled={wizard.state.currentStep !== 7 && (!wizard.canProceed() || wizard.state.isCreating)}
          className={`px-8 py-3 rounded-lg font-medium transition-colors text-base ${
            (wizard.state.currentStep === 7 || (wizard.canProceed() && !wizard.state.isCreating))
              ? 'bg-bitcoin hover:bg-bitcoin-hover text-white shadow-lg'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          {wizard.state.isCreating ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-white"></div>
              Creating...
            </span>
          ) : (
            getNextButtonText()
          )}
        </button>
      </div>

      {/* Unlock Wallet Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-xl p-6 w-80 mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Unlock Wallet</h2>
            <p className="text-sm text-gray-400 mb-6">
              Your wallet is locked. Please enter your password to create the multisig account.
            </p>

            {/* Error Message */}
            {unlockError && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{unlockError}</p>
              </div>
            )}

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && unlockPassword) {
                    handleUnlock();
                  }
                }}
                placeholder="Enter your password"
                autoFocus
                className="w-full px-4 py-3 bg-gray-900 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitcoin focus:border-bitcoin"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockPassword(process.env.DEV_PASSWORD || '');
                  setUnlockError(null);
                }}
                disabled={isUnlocking}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || !unlockPassword}
                className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isUnlocking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Unlocking...
                  </>
                ) : (
                  'Unlock'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultisigWizard;
