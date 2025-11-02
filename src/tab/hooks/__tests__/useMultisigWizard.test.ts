/**
 * Tests for useMultisigWizard hook
 *
 * Complex state management hook for the 7-step multisig wallet creation wizard.
 *
 * Test coverage:
 * - Initial state
 * - Step validation logic
 * - Navigation (next, previous, goToStep)
 * - Config selection and validation
 * - Address type selection
 * - Xpub management
 * - Cosigner management (add, remove, update)
 * - Address verification
 * - Account name management
 * - Error handling
 * - State reset
 * - Helper functions
 */

import { renderHook, act } from '@testing-library/react';
import { useMultisigWizard } from '../useMultisigWizard';
import { MultisigConfig, MultisigAddressType, Cosigner } from '../../../shared/types';

describe('useMultisigWizard', () => {
  /**
   * Test: Initial state
   */
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useMultisigWizard());

    expect(result.current.state.currentStep).toBe(1);
    expect(result.current.state.selectedConfig).toBeNull();
    expect(result.current.state.selectedAddressType).toBeNull();
    expect(result.current.state.myXpub).toBeNull();
    expect(result.current.state.myFingerprint).toBeNull();
    expect(result.current.state.cosignerXpubs).toEqual([]);
    expect(result.current.state.firstAddress).toBeNull();
    expect(result.current.state.accountName).toBe('');
    expect(result.current.state.addressVerified).toBe(false);
    expect(result.current.state.isCreating).toBe(false);
    expect(result.current.state.error).toBeNull();
  });

  /**
   * Test: Step 1 - Config selection
   */
  describe('Step 1 - Configuration Selection', () => {
    it('starts at step 1 and cannot proceed without config', () => {
      const { result } = renderHook(() => useMultisigWizard());

      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.canProceed()).toBe(false);
    });

    it('can proceed after selecting config', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      expect(result.current.state.selectedConfig).toBe('2-of-3');
      expect(result.current.canProceed()).toBe(true);
    });

    it('supports all config types', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const configs: MultisigConfig[] = ['2-of-2', '2-of-3', '3-of-5'];

      configs.forEach(config => {
        act(() => {
          result.current.setSelectedConfig(config);
        });
        expect(result.current.state.selectedConfig).toBe(config);
      });
    });

    it('clears error when setting config', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  /**
   * Test: Step 2 - Address type selection
   */
  describe('Step 2 - Address Type Selection', () => {
    it('cannot proceed to step 2 without config', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.nextStep();
      });

      // Should not advance
      expect(result.current.state.currentStep).toBe(1);
    });

    it('advances to step 2 after config selection', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(2);
    });

    it('cannot proceed from step 2 without address type', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.canProceed()).toBe(false);
    });

    it('can proceed after selecting address type', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
        result.current.nextStep();
        result.current.setSelectedAddressType('p2wsh');
      });

      expect(result.current.state.selectedAddressType).toBe('p2wsh');
      expect(result.current.canProceed()).toBe(true);
    });

    it('supports all address types', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const addressTypes: MultisigAddressType[] = ['p2sh', 'p2wsh', 'p2sh-p2wsh'];

      addressTypes.forEach(type => {
        act(() => {
          result.current.setSelectedAddressType(type);
        });
        expect(result.current.state.selectedAddressType).toBe(type);
      });
    });
  });

  /**
   * Test: Step 3 - Export user's xpub
   */
  describe('Step 3 - Export User Xpub', () => {
    it('step 3 is always valid (just viewing)', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      act(() => {
        result.current.nextStep();
      });

      act(() => {
        result.current.setSelectedAddressType('p2wsh');
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(3);
      expect(result.current.isStepValid(3)).toBe(true);
      expect(result.current.canProceed()).toBe(true);
    });

    it('can set user xpub and fingerprint', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const xpub = 'tpubD6NzVbkrYhZ4X...';
      const fingerprint = 'a1b2c3d4';

      act(() => {
        result.current.setMyXpub(xpub, fingerprint);
      });

      expect(result.current.state.myXpub).toBe(xpub);
      expect(result.current.state.myFingerprint).toBe(fingerprint);
    });
  });

  /**
   * Test: Step 4 - Import co-signer xpubs
   */
  describe('Step 4 - Import Cosigner Xpubs', () => {
    it('calculates required cosigners correctly for 2-of-2', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-2');
      });

      expect(result.current.getRequiredCosigners('2-of-2')).toBe(1);
    });

    it('calculates required cosigners correctly for 2-of-3', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      expect(result.current.getRequiredCosigners('2-of-3')).toBe(2);
    });

    it('calculates required cosigners correctly for 3-of-5', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('3-of-5');
      });

      expect(result.current.getRequiredCosigners('3-of-5')).toBe(4);
    });

    it('cannot proceed without all required cosigners', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
        result.current.goToStep(4);
      });

      expect(result.current.canProceed()).toBe(false);
    });

    it('can add cosigners', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const cosigner: Cosigner = {
        name: 'Alice',
        xpub: 'tpubD6NzVbkrYhZ4XAlice...',
        fingerprint: 'abc12345',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      act(() => {
        result.current.addCosigner(cosigner);
      });

      expect(result.current.state.cosignerXpubs).toHaveLength(1);
      expect(result.current.state.cosignerXpubs[0]).toEqual(cosigner);
    });

    it('can add multiple cosigners', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const cosigner1: Cosigner = {
        name: 'Alice',
        xpub: 'tpubD6NzVbkrYhZ4XAlice...',
        fingerprint: 'abc12345',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      const cosigner2: Cosigner = {
        name: 'Bob',
        xpub: 'tpubD6NzVbkrYhZ4XBob...',
        fingerprint: 'def67890',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      act(() => {
        result.current.addCosigner(cosigner1);
        result.current.addCosigner(cosigner2);
      });

      expect(result.current.state.cosignerXpubs).toHaveLength(2);
      expect(result.current.state.cosignerXpubs[0]).toEqual(cosigner1);
      expect(result.current.state.cosignerXpubs[1]).toEqual(cosigner2);
    });

    it('can proceed after adding all required cosigners', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-2');
        result.current.goToStep(4);
      });

      const cosigner: Cosigner = {
        name: 'Alice',
        xpub: 'tpubD6NzVbkrYhZ4XAlice...',
        fingerprint: 'abc12345',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      act(() => {
        result.current.addCosigner(cosigner);
      });

      expect(result.current.canProceed()).toBe(true);
    });

    it('can remove cosigner by fingerprint', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const cosigner1: Cosigner = {
        name: 'Alice',
        xpub: 'tpubD6NzVbkrYhZ4XAlice...',
        fingerprint: 'abc12345',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      const cosigner2: Cosigner = {
        name: 'Bob',
        xpub: 'tpubD6NzVbkrYhZ4XBob...',
        fingerprint: 'def67890',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      act(() => {
        result.current.addCosigner(cosigner1);
        result.current.addCosigner(cosigner2);
      });

      expect(result.current.state.cosignerXpubs).toHaveLength(2);

      act(() => {
        result.current.removeCosigner('abc12345');
      });

      expect(result.current.state.cosignerXpubs).toHaveLength(1);
      expect(result.current.state.cosignerXpubs[0].fingerprint).toBe('def67890');
    });

    it('can update cosigner name', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const cosigner: Cosigner = {
        name: 'Alice',
        xpub: 'tpubD6NzVbkrYhZ4XAlice...',
        fingerprint: 'abc12345',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      act(() => {
        result.current.addCosigner(cosigner);
      });

      act(() => {
        result.current.updateCosignerName('abc12345', 'Alice Smith');
      });

      expect(result.current.state.cosignerXpubs[0].name).toBe('Alice Smith');
    });

    it('does not modify other cosigners when updating name', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const cosigner1: Cosigner = {
        name: 'Alice',
        xpub: 'tpubD6NzVbkrYhZ4XAlice...',
        fingerprint: 'abc12345',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      const cosigner2: Cosigner = {
        name: 'Bob',
        xpub: 'tpubD6NzVbkrYhZ4XBob...',
        fingerprint: 'def67890',
        derivationPath: "m/48'/1'/0'/2'",
        isSelf: false
      };

      act(() => {
        result.current.addCosigner(cosigner1);
        result.current.addCosigner(cosigner2);
      });

      act(() => {
        result.current.updateCosignerName('abc12345', 'Alice Smith');
      });

      expect(result.current.state.cosignerXpubs[0].name).toBe('Alice Smith');
      expect(result.current.state.cosignerXpubs[1].name).toBe('Bob');
    });
  });

  /**
   * Test: Step 5 - Verify first address
   */
  describe('Step 5 - Verify First Address', () => {
    it('cannot proceed without address verification', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(5);
      });

      expect(result.current.canProceed()).toBe(false);
    });

    it('can set first address', () => {
      const { result } = renderHook(() => useMultisigWizard());

      const address = 'tb1qmultisigaddress...';

      act(() => {
        result.current.setFirstAddress(address);
      });

      expect(result.current.state.firstAddress).toBe(address);
    });

    it('can verify address', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setAddressVerified(true);
      });

      expect(result.current.state.addressVerified).toBe(true);
    });

    it('can proceed after verification', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(5);
        result.current.setAddressVerified(true);
      });

      expect(result.current.canProceed()).toBe(true);
    });
  });

  /**
   * Test: Step 6 - Name account and review
   */
  describe('Step 6 - Name Account', () => {
    it('cannot proceed without account name', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(6);
      });

      expect(result.current.canProceed()).toBe(false);
    });

    it('can set account name', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setAccountName('My Multisig Wallet');
      });

      expect(result.current.state.accountName).toBe('My Multisig Wallet');
    });

    it('cannot proceed with empty account name', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(6);
        result.current.setAccountName('   '); // Whitespace only
      });

      expect(result.current.canProceed()).toBe(false);
    });

    it('can proceed with valid account name', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(6);
        result.current.setAccountName('My Multisig');
      });

      expect(result.current.canProceed()).toBe(true);
    });

    it('generates default account name based on config', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      expect(result.current.getDefaultAccountName()).toBe('Multisig 2-of-3');
    });

    it('returns generic name when no config selected', () => {
      const { result } = renderHook(() => useMultisigWizard());

      expect(result.current.getDefaultAccountName()).toBe('Multisig Account');
    });
  });

  /**
   * Test: Step 7 - Success
   */
  describe('Step 7 - Success', () => {
    it('step 7 is always valid', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(7);
      });

      expect(result.current.isStepValid(7)).toBe(true);
      expect(result.current.canProceed()).toBe(true);
    });

    it('cannot advance past step 7', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(7);
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(7);
    });
  });

  /**
   * Test: Navigation
   */
  describe('Navigation', () => {
    it('can go to previous step', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      act(() => {
        result.current.nextStep();
      });

      expect(result.current.state.currentStep).toBe(2);

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.state.currentStep).toBe(1);
    });

    it('cannot go before step 1', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.state.currentStep).toBe(1);
    });

    it('can jump to specific step', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.goToStep(4);
      });

      expect(result.current.state.currentStep).toBe(4);
    });

    it('clears error when going to previous step', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });

      act(() => {
        result.current.nextStep();
      });

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.previousStep();
      });

      expect(result.current.state.error).toBeNull();
    });

    it('clears error when jumping to step', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.state.error).toBe('Test error');

      act(() => {
        result.current.goToStep(3);
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  /**
   * Test: Error handling
   */
  describe('Error Handling', () => {
    it('can set error', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.state.error).toBe('Something went wrong');
    });

    it('can clear error', () => {
      const { result } = renderHook(() => useMultisigWizard());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.state.error).toBe('Something went wrong');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.state.error).toBeNull();
    });
  });

  /**
   * Test: Loading state
   */
  describe('Loading State', () => {
    it('can set loading state', () => {
      const { result } = renderHook(() => useMultisigWizard());

      expect(result.current.state.isCreating).toBe(false);

      act(() => {
        result.current.setIsCreating(true);
      });

      expect(result.current.state.isCreating).toBe(true);

      act(() => {
        result.current.setIsCreating(false);
      });

      expect(result.current.state.isCreating).toBe(false);
    });
  });

  /**
   * Test: Reset functionality
   */
  describe('Reset', () => {
    it('resets to default state', () => {
      const { result } = renderHook(() => useMultisigWizard());

      // Modify all state
      act(() => {
        result.current.setSelectedConfig('2-of-3');
        result.current.nextStep();
        result.current.setSelectedAddressType('p2wsh');
        result.current.setMyXpub('tpubtest', 'fingerprint');
        result.current.addCosigner({
          name: 'Alice',
          xpub: 'tpubAlice',
          fingerprint: 'abc123',
          derivationPath: "m/48'/1'/0'/2'",
          isSelf: false
        });
        result.current.setFirstAddress('tb1qtest');
        result.current.setAccountName('Test Account');
        result.current.setAddressVerified(true);
        result.current.setIsCreating(true);
        result.current.setError('Test error');
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify all back to defaults
      expect(result.current.state.currentStep).toBe(1);
      expect(result.current.state.selectedConfig).toBeNull();
      expect(result.current.state.selectedAddressType).toBeNull();
      expect(result.current.state.myXpub).toBeNull();
      expect(result.current.state.myFingerprint).toBeNull();
      expect(result.current.state.cosignerXpubs).toEqual([]);
      expect(result.current.state.firstAddress).toBeNull();
      expect(result.current.state.accountName).toBe('');
      expect(result.current.state.addressVerified).toBe(false);
      expect(result.current.state.isCreating).toBe(false);
      expect(result.current.state.error).toBeNull();
    });
  });

  /**
   * Test: Complete workflow
   */
  describe('Complete Wizard Flow', () => {
    it('completes full 2-of-3 wizard flow', () => {
      const { result } = renderHook(() => useMultisigWizard());

      // Step 1: Select config
      act(() => {
        result.current.setSelectedConfig('2-of-3');
      });
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(2);

      // Step 2: Select address type
      act(() => {
        result.current.setSelectedAddressType('p2wsh');
      });
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(3);

      // Step 3: Set xpub
      act(() => {
        result.current.setMyXpub('tpubMyXpub', 'myfingerprint');
      });
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(4);

      // Step 4: Add cosigners (need 2 for 2-of-3)
      act(() => {
        result.current.addCosigner({
          name: 'Alice',
          xpub: 'tpubAlice',
          fingerprint: 'alice123',
          derivationPath: "m/48'/1'/0'/2'",
          isSelf: false
        });
      });
      act(() => {
        result.current.addCosigner({
          name: 'Bob',
          xpub: 'tpubBob',
          fingerprint: 'bob456',
          derivationPath: "m/48'/1'/0'/2'",
          isSelf: false
        });
      });
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(5);

      // Step 5: Verify address
      act(() => {
        result.current.setFirstAddress('tb1qmultisig');
      });
      act(() => {
        result.current.setAddressVerified(true);
      });
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(6);

      // Step 6: Name account
      act(() => {
        result.current.setAccountName('My 2-of-3 Wallet');
      });
      act(() => {
        result.current.nextStep();
      });
      expect(result.current.state.currentStep).toBe(7);

      // Verify final state
      expect(result.current.state.selectedConfig).toBe('2-of-3');
      expect(result.current.state.selectedAddressType).toBe('p2wsh');
      expect(result.current.state.cosignerXpubs).toHaveLength(2);
      expect(result.current.state.accountName).toBe('My 2-of-3 Wallet');
      expect(result.current.state.addressVerified).toBe(true);
    });
  });
});
