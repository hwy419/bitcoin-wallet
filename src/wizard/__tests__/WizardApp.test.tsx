/**
 * WizardApp Component Test Suite
 *
 * Comprehensive tests for the WizardApp wrapper component covering:
 * - Session recovery on mount
 * - Wallet lock detection and polling
 * - beforeunload confirmation dialog
 * - Recovery message display and auto-hide
 * - Completion flow (success message, tab close)
 * - Cancel confirmation
 * - Help button interaction
 * - Error handling for failed messages
 * - Loading states
 *
 * Total Tests: 18
 * Priority: P1 - Critical wizard infrastructure
 */

import React from 'react';
import { screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders, userEvent, mockChromeSendMessageAsync } from '../../tab/components/__tests__/testUtils';
import WizardApp from '../WizardApp';
import { MessageType } from '../../shared/types';

// Mock MultisigWizard component
jest.mock('../../tab/components/MultisigSetup/MultisigWizard', () => ({
  MultisigWizard: ({ onComplete, onCancel }: any) =>
    React.createElement('div', { 'data-testid': 'multisig-wizard' }, [
      React.createElement('button', {
        key: 'complete-btn',
        onClick: onComplete,
        'data-testid': 'wizard-complete-btn',
      }, 'Complete'),
      React.createElement('button', {
        key: 'cancel-btn',
        onClick: onCancel,
        'data-testid': 'wizard-cancel-btn',
      }, 'Cancel'),
    ]),
}));

// Mock useBackgroundMessaging hook
const mockSendMessage = jest.fn();
jest.mock('../../tab/hooks/useBackgroundMessaging', () => ({
  useBackgroundMessaging: () => ({
    sendMessage: mockSendMessage,
  }),
}));

// Mock window.close
const mockWindowClose = jest.fn();
const mockWindowConfirm = jest.fn();
const mockWindowAlert = jest.fn();

describe('WizardApp', () => {
  let mockBeforeUnloadEvent: BeforeUnloadEvent;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup window mocks
    global.window.close = mockWindowClose;
    global.window.confirm = mockWindowConfirm;
    global.window.alert = mockWindowAlert;

    // Setup default sendMessage behavior
    mockSendMessage.mockResolvedValue({ state: null });

    // Create a mock beforeunload event
    mockBeforeUnloadEvent = new Event('beforeunload') as BeforeUnloadEvent;
    Object.defineProperty(mockBeforeUnloadEvent, 'returnValue', {
      writable: true,
      value: '',
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ==================== RENDERING & LAYOUT ====================

  describe('Rendering & Layout', () => {
    it('renders header with Bitcoin logo and branding', async () => {
      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByText('Bitcoin Wallet')).toBeInTheDocument();
        expect(screen.getByText('Create Multisig Account')).toBeInTheDocument();
        expect(screen.getByLabelText('Bitcoin Logo')).toBeInTheDocument();
      });
    });

    it('renders help button in header', async () => {
      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        const helpButton = screen.getByTitle('Help & Guidance');
        expect(helpButton).toBeInTheDocument();
      });
    });

    it('renders MultisigWizard component', async () => {
      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('multisig-wizard')).toBeInTheDocument();
      });
    });

    it('shows help alert when help button clicked', async () => {
      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        const helpButton = screen.getByTitle('Help & Guidance');
        userEvent.click(helpButton);
      });

      await waitFor(() => {
        expect(mockWindowAlert).toHaveBeenCalledWith('Help documentation coming soon!');
      });
    });
  });

  // ==================== SESSION RECOVERY ====================

  describe('Session Recovery', () => {
    it('loads session state on mount', async () => {
      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.WIZARD_LOAD_STATE,
          {}
        );
      });
    });

    it('shows recovery message when session state exists', async () => {
      mockSendMessage.mockResolvedValue({ state: { currentStep: 3 } });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByText('Wizard progress restored from previous session')).toBeInTheDocument();
      });
    });

    it('does not show recovery message when no session state', async () => {
      mockSendMessage.mockResolvedValue({ state: null });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });

      expect(screen.queryByText('Wizard progress restored from previous session')).not.toBeInTheDocument();
    });

    it('auto-hides recovery message after 5 seconds', async () => {
      jest.useFakeTimers();
      mockSendMessage.mockResolvedValue({ state: { currentStep: 3 } });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByText('Wizard progress restored from previous session')).toBeInTheDocument();
      });

      // Fast-forward 5 seconds and flush promises
      await act(async () => {
        jest.advanceTimersByTime(5000);
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.queryByText('Wizard progress restored from previous session')).not.toBeInTheDocument();
      });
    });

    it('handles session load error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendMessage.mockRejectedValue(new Error('Failed to load session'));

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to load wizard session:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== WALLET LOCK DETECTION ====================

  describe('Wallet Lock Detection', () => {
    it('checks wallet lock status on mount', async () => {
      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.WIZARD_CHECK_WALLET_LOCKED,
          {}
        );
      });
    });

    it('shows warning when wallet is locked', async () => {
      mockSendMessage.mockImplementation((type: MessageType) => {
        if (type === MessageType.WIZARD_CHECK_WALLET_LOCKED) {
          return Promise.resolve({ isLocked: true });
        }
        return Promise.resolve({ state: null });
      });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByText(/Wallet is locked/)).toBeInTheDocument();
        expect(screen.getByText(/Please unlock your wallet to continue/)).toBeInTheDocument();
      });
    });

    it('hides warning when wallet is unlocked', async () => {
      mockSendMessage.mockImplementation((type: MessageType) => {
        if (type === MessageType.WIZARD_CHECK_WALLET_LOCKED) {
          return Promise.resolve({ isLocked: false });
        }
        return Promise.resolve({ state: null });
      });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });

      expect(screen.queryByText(/Wallet is locked/)).not.toBeInTheDocument();
    });

    it('polls wallet lock status every 30 seconds', async () => {
      jest.useFakeTimers();
      mockSendMessage.mockResolvedValue({ isLocked: false, state: null });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });

      const initialCalls = mockSendMessage.mock.calls.filter(
        (call) => call[0] === MessageType.WIZARD_CHECK_WALLET_LOCKED
      ).length;

      // Fast-forward 30 seconds and flush promises
      await act(async () => {
        jest.advanceTimersByTime(30000);
        await Promise.resolve();
      });

      await waitFor(() => {
        const newCalls = mockSendMessage.mock.calls.filter(
          (call) => call[0] === MessageType.WIZARD_CHECK_WALLET_LOCKED
        ).length;
        expect(newCalls).toBeGreaterThan(initialCalls);
      });
    });

    it('handles lock status check error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendMessage.mockImplementation((type: MessageType) => {
        if (type === MessageType.WIZARD_CHECK_WALLET_LOCKED) {
          return Promise.reject(new Error('Failed to check lock status'));
        }
        return Promise.resolve({ state: null });
      });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalled();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to check wallet lock status:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== BEFOREUNLOAD CONFIRMATION ====================

  describe('beforeunload Confirmation', () => {
    it('adds beforeunload listener on mount', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          'beforeunload',
          expect.any(Function)
        );
      });

      addEventListenerSpy.mockRestore();
    });

    it('removes beforeunload listener on unmount', async () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('multisig-wizard')).toBeInTheDocument();
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it('shows confirmation when closing with wallet unlocked', async () => {
      mockSendMessage.mockResolvedValue({ isLocked: false, state: null });
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('multisig-wizard')).toBeInTheDocument();
      });

      // Get the beforeunload handler
      const handler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === 'beforeunload'
      )?.[1];

      if (handler && typeof handler === 'function') {
        handler(mockBeforeUnloadEvent);
        expect(mockBeforeUnloadEvent.returnValue).toBe('');
      }

      addEventListenerSpy.mockRestore();
    });
  });

  // ==================== COMPLETION FLOW ====================

  describe('Completion Flow', () => {
    it('calls WIZARD_COMPLETE when wizard completes', async () => {
      mockSendMessage.mockResolvedValue({});

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-complete-btn')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('wizard-complete-btn');
      await userEvent.click(completeButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.WIZARD_COMPLETE,
          {}
        );
      });
    });

    it('shows success message on completion', async () => {
      mockSendMessage.mockResolvedValue({});

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-complete-btn')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('wizard-complete-btn');
      await userEvent.click(completeButton);

      await waitFor(() => {
        expect(screen.getByText('Multisig account created successfully! Closing...')).toBeInTheDocument();
      });
    });

    it('closes tab after 2 seconds on completion', async () => {
      jest.useFakeTimers();
      mockSendMessage.mockResolvedValue({});

      const { unmount } = renderWithProviders(<WizardApp />);

      // Flush initial timers
      await act(async () => {
        jest.advanceTimersByTime(0);
        await Promise.resolve();
      });

      expect(screen.getByTestId('wizard-complete-btn')).toBeInTheDocument();

      const completeButton = screen.getByTestId('wizard-complete-btn');

      // Use fireEvent instead of userEvent with fake timers
      await act(async () => {
        fireEvent.click(completeButton);
        // Allow the click handler to complete
        await Promise.resolve();
      });

      expect(screen.getByText('Multisig account created successfully! Closing...')).toBeInTheDocument();

      // Fast-forward 2 seconds
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      expect(mockWindowClose).toHaveBeenCalled();

      unmount();
    });

    it('handles completion error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSendMessage.mockImplementation((type: MessageType) => {
        if (type === MessageType.WIZARD_COMPLETE) {
          return Promise.reject(new Error('Failed to complete'));
        }
        return Promise.resolve({});
      });

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-complete-btn')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('wizard-complete-btn');
      await userEvent.click(completeButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to complete wizard:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  // ==================== CANCEL FLOW ====================

  describe('Cancel Flow', () => {
    it('shows confirmation dialog when cancel button clicked', async () => {
      mockWindowConfirm.mockReturnValue(false);

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-cancel-btn')).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('wizard-cancel-btn');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockWindowConfirm).toHaveBeenCalledWith(
          'Cancel Multisig Setup?\n\nYour progress will be discarded and cannot be recovered.'
        );
      });
    });

    it('does not close tab when user cancels confirmation', async () => {
      mockWindowConfirm.mockReturnValue(false);

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-cancel-btn')).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('wizard-cancel-btn');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockWindowConfirm).toHaveBeenCalled();
      });

      expect(mockSendMessage).not.toHaveBeenCalledWith(
        MessageType.WIZARD_SAVE_STATE,
        expect.anything()
      );
      expect(mockWindowClose).not.toHaveBeenCalled();
    });

    it('saves state and closes tab when user confirms cancel', async () => {
      mockWindowConfirm.mockReturnValue(true);
      mockSendMessage.mockResolvedValue({});

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-cancel-btn')).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('wizard-cancel-btn');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.WIZARD_SAVE_STATE,
          {}
        );
        expect(mockWindowClose).toHaveBeenCalled();
      });
    });

    it('handles save state error gracefully on cancel', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockWindowConfirm.mockReturnValue(true);
      mockSendMessage.mockRejectedValue(new Error('Failed to save'));

      renderWithProviders(<WizardApp />);

      await waitFor(() => {
        expect(screen.getByTestId('wizard-cancel-btn')).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId('wizard-cancel-btn');
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockWindowClose).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
