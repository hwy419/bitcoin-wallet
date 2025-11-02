/**
 * useMultisigWizard - Custom hook for multisig wizard state management
 *
 * Manages the 7-step wizard state for creating a multisig account:
 * 1. Configuration selection (2-of-2, 2-of-3, 3-of-5)
 * 2. Address type selection (P2WSH, P2SH-P2WSH, P2SH)
 * 3. Export user's xpub
 * 4. Import co-signer xpubs
 * 5. Verify first multisig address
 * 6. Name account and review
 * 7. Success screen
 *
 * Usage:
 * const wizard = useMultisigWizard();
 * wizard.setSelectedConfig('2-of-3');
 * wizard.nextStep();
 */

import { useState, useCallback } from 'react';
import { MultisigConfig, MultisigAddressType, Cosigner } from '../../shared/types';

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface WizardState {
  currentStep: WizardStep;
  selectedConfig: MultisigConfig | null;
  selectedAddressType: MultisigAddressType | null;
  myXpub: string | null;
  myFingerprint: string | null;
  cosignerXpubs: Cosigner[];
  firstAddress: string | null;
  accountName: string;
  addressVerified: boolean;
  isCreating: boolean;
  error: string | null;
}

const DEFAULT_STATE: WizardState = {
  currentStep: 1,
  selectedConfig: null,
  selectedAddressType: null,
  myXpub: null,
  myFingerprint: null,
  cosignerXpubs: [],
  firstAddress: null,
  accountName: '',
  addressVerified: false,
  isCreating: false,
  error: null,
};

export const useMultisigWizard = () => {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);

  // Helper to get required number of co-signers based on config
  const getRequiredCosigners = useCallback((config: MultisigConfig | null): number => {
    if (!config) return 0;
    const [, total] = config.split('-of-').map(Number);
    return total - 1; // Subtract 1 for user's own key
  }, []);

  // Validation for each step
  const isStepValid = useCallback(
    (step: WizardStep): boolean => {
      switch (step) {
        case 1:
          return state.selectedConfig !== null;
        case 2:
          return state.selectedAddressType !== null;
        case 3:
          // Just viewing, always valid (xpub will be fetched on mount)
          return true;
        case 4:
          return state.cosignerXpubs.length === getRequiredCosigners(state.selectedConfig);
        case 5:
          return state.addressVerified;
        case 6:
          return state.accountName.trim().length > 0;
        case 7:
          // Final step, always valid
          return true;
        default:
          return false;
      }
    },
    [state, getRequiredCosigners]
  );

  // Can proceed to next step?
  const canProceed = useCallback((): boolean => {
    return isStepValid(state.currentStep);
  }, [state.currentStep, isStepValid]);

  // Navigation
  const nextStep = useCallback(() => {
    if (!canProceed()) return;
    if (state.currentStep < 7) {
      setState((prev) => ({ ...prev, currentStep: (prev.currentStep + 1) as WizardStep }));
    }
  }, [state.currentStep, canProceed]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 1) {
      setState((prev) => ({
        ...prev,
        currentStep: (prev.currentStep - 1) as WizardStep,
        error: null,
      }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: WizardStep) => {
    setState((prev) => ({ ...prev, currentStep: step, error: null }));
  }, []);

  // State setters
  const setSelectedConfig = useCallback((config: MultisigConfig) => {
    setState((prev) => ({ ...prev, selectedConfig: config, error: null }));
  }, []);

  const setSelectedAddressType = useCallback((addressType: MultisigAddressType) => {
    setState((prev) => ({ ...prev, selectedAddressType: addressType, error: null }));
  }, []);

  const setMyXpub = useCallback((xpub: string, fingerprint: string) => {
    setState((prev) => ({ ...prev, myXpub: xpub, myFingerprint: fingerprint, error: null }));
  }, []);

  const addCosigner = useCallback((cosigner: Cosigner) => {
    setState((prev) => ({
      ...prev,
      cosignerXpubs: [...prev.cosignerXpubs, cosigner],
      error: null,
    }));
  }, []);

  const removeCosigner = useCallback((fingerprint: string) => {
    setState((prev) => ({
      ...prev,
      cosignerXpubs: prev.cosignerXpubs.filter((c) => c.fingerprint !== fingerprint),
      error: null,
    }));
  }, []);

  const updateCosignerName = useCallback((fingerprint: string, name: string) => {
    setState((prev) => ({
      ...prev,
      cosignerXpubs: prev.cosignerXpubs.map((c) =>
        c.fingerprint === fingerprint ? { ...c, name } : c
      ),
      error: null,
    }));
  }, []);

  const setFirstAddress = useCallback((address: string) => {
    setState((prev) => ({ ...prev, firstAddress: address, error: null }));
  }, []);

  const setAccountName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, accountName: name, error: null }));
  }, []);

  const setAddressVerified = useCallback((verified: boolean) => {
    setState((prev) => ({ ...prev, addressVerified: verified, error: null }));
  }, []);

  const setIsCreating = useCallback((isCreating: boolean) => {
    setState((prev) => ({ ...prev, isCreating }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const reset = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  // Get default account name based on config
  const getDefaultAccountName = useCallback((): string => {
    if (!state.selectedConfig) return 'Multisig Account';
    return `Multisig ${state.selectedConfig}`;
  }, [state.selectedConfig]);

  return {
    // State
    state,

    // Computed
    canProceed,
    isStepValid,
    getRequiredCosigners,
    getDefaultAccountName,

    // Navigation
    nextStep,
    previousStep,
    goToStep,

    // Setters
    setSelectedConfig,
    setSelectedAddressType,
    setMyXpub,
    addCosigner,
    removeCosigner,
    updateCosignerName,
    setFirstAddress,
    setAccountName,
    setAddressVerified,
    setIsCreating,
    setError,
    reset,
  };
};

export default useMultisigWizard;
