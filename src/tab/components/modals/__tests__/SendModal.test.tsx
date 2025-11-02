/**
 * SendModal Component Tests
 *
 * Tests for the SendModal wrapper component. This is a thin wrapper around SendScreen
 * that adds modal functionality including:
 * - Modal open/close behavior
 * - ESC key handling
 * - Backdrop click handling
 * - Focus trap
 * - Body scroll prevention
 * - Accessibility
 * - Props pass-through
 */

import React from 'react';
import { render, screen, userEvent, waitFor, act } from '../../__tests__/testUtils';
import { createMockAccount, createMockBalance } from '../../__tests__/testFactories';
import { SendModal } from '../SendModal';

// Mock PrivacyContext to avoid async initialization issues in tests
jest.mock('../../../contexts/PrivacyContext', () => ({
  PrivacyProvider: ({ children }: any) => <>{children}</>,
  usePrivacy: () => ({ balancesHidden: false, togglePrivacy: jest.fn(), setBalancesHidden: jest.fn() })
}));

// Mock SendScreen component since it's already tested at 100%
jest.mock('../../SendScreen', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ account, balance, onBack, onSendSuccess, isModal }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-send-screen' },
        React.createElement('div', null, 'Mock SendScreen'),
        React.createElement('div', { 'data-testid': 'account-name' }, account.name),
        React.createElement('div', { 'data-testid': 'balance-confirmed' }, balance.confirmed),
        React.createElement('div', { 'data-testid': 'is-modal' }, isModal ? 'true' : 'false'),
        React.createElement('button', { onClick: onBack, 'data-testid': 'back-button' }, 'Back'),
        React.createElement('button', { onClick: onSendSuccess, 'data-testid': 'send-success-button' }, 'Complete Send')
      )
  };
});

describe('SendModal', () => {
  // Test data
  const mockAccount = createMockAccount({ name: 'Test Account' });
  const mockBalance = createMockBalance({ confirmed: 100000, unconfirmed: 0 });
  const mockOnClose = jest.fn();
  const mockOnSendSuccess = jest.fn();

  // Default props
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    account: mockAccount,
    balance: mockBalance,
    onSendSuccess: mockOnSendSuccess,
  };

  // Helper function: render and wait for PrivacyProvider to initialize
  const renderModal = async (props: typeof defaultProps) => {
    const result = render(<SendModal {...props} />);

    // Wait for PrivacyProvider to initialize (it returns null until initialized)
    if (props.isOpen) {
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      }, { timeout: 1000 });
    }

    return result;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style
    document.body.style.overflow = '';
  });

  afterEach(() => {
    // Cleanup: reset body overflow
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('renders modal when isOpen is true', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for PrivacyProvider to initialize and modal to render
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('mock-send-screen')).toBeInTheDocument();
      });
    });

    it('does not render when isOpen is false', async () => {
      render(<SendModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-send-screen')).not.toBeInTheDocument();
    });

    it('displays modal title', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Send Bitcoin')).toBeInTheDocument();
      });
    });

    it('displays account name in subtitle', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        // Account name appears in subtitle (p element) - use getAllByText since it appears twice
        const accountNames = screen.getAllByText('Test Account');
        expect(accountNames.length).toBeGreaterThan(0);
        // Verify at least one is the subtitle
        const subtitle = accountNames.find(el => el.tagName === 'P');
        expect(subtitle).toBeInTheDocument();
      });
    });

    it('renders close button', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close send modal');
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('renders backdrop', async () => {
      const { container } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Wait for rendering
      await waitFor(() => {
        const backdrop = container.querySelector('[aria-hidden="true"]');
        expect(backdrop).toBeInTheDocument();
      });

      // Backdrop has aria-hidden="true" and fixed positioning
      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA role', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'send-modal-title');
    });

    it('has accessible title', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const title = screen.getByText('Send Bitcoin');
      expect(title).toHaveAttribute('id', 'send-modal-title');
    });

    it('close button has aria-label', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close send modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('backdrop has aria-hidden', async () => {
      const { container } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Props Pass-through to SendScreen', () => {
    it('passes account prop to SendScreen', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('account-name')).toHaveTextContent('Test Account');
      });
    });

    it('passes balance prop to SendScreen', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('balance-confirmed')).toHaveTextContent('100000');
      });
    });

    it('passes isModal=true to SendScreen', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('is-modal')).toHaveTextContent('true');
      });
    });

    it('passes different balance values', async () => {
      const customBalance = createMockBalance({ confirmed: 250000 });
      render(<SendModal {...defaultProps} balance={customBalance} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('balance-confirmed')).toHaveTextContent('250000');
      });
    });

    it('passes different account values', async () => {
      const customAccount = createMockAccount({ name: 'Custom Account' });
      render(<SendModal {...defaultProps} account={customAccount} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('account-name')).toHaveTextContent('Custom Account');
      });
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close send modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when ESC key pressed', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when modal content clicked', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('mock-send-screen')).toBeInTheDocument();
      });

      const modalContent = screen.getByTestId('mock-send-screen');
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when SendScreen back button clicked', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      const backButton = screen.getByTestId('back-button');
      await user.click(backButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not respond to ESC when modal is closed', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} isOpen={false} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Send Success Handling', () => {
    it('calls onSendSuccess when send completes', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('send-success-button')).toBeInTheDocument();
      });

      const sendButton = screen.getByTestId('send-success-button');
      await user.click(sendButton);

      expect(mockOnSendSuccess).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after successful send', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('send-success-button')).toBeInTheDocument();
      });

      const sendButton = screen.getByTestId('send-success-button');
      await user.click(sendButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls both onSendSuccess and onClose on successful send', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('send-success-button')).toBeInTheDocument();
      });

      const sendButton = screen.getByTestId('send-success-button');
      await user.click(sendButton);

      expect(mockOnSendSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Body Scroll Prevention', () => {
    it('prevents body scroll when modal is open', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not prevent scroll when modal is closed', async () => {
      render(<SendModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('restores scroll when modal closes', async () => {
      const { rerender } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<SendModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('restores scroll when modal unmounts', async () => {
      const { unmount } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Event Listener Cleanup', () => {
    it('removes ESC key listener on unmount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      unmount();

      // Try to press ESC after unmount - should not call onClose
      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('removes ESC key listener when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      rerender(<SendModal {...defaultProps} isOpen={false} />);

      // Try ESC - should not call onClose again
      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('cleans up properly on rapid open/close', async () => {
      const { rerender } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Rapid open/close cycles
      rerender(<SendModal {...defaultProps} isOpen={false} />);
      rerender(<SendModal {...defaultProps} isOpen={true} />);
      rerender(<SendModal {...defaultProps} isOpen={false} />);
      rerender(<SendModal {...defaultProps} isOpen={true} />);

      // Should still work correctly
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Focus Management', () => {
    it('contains focusable elements when open', async () => {
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByLabelText('Close send modal')).toBeInTheDocument();
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
        expect(screen.getByTestId('send-success-button')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close send modal');
      const backButton = screen.getByTestId('back-button');
      const sendButton = screen.getByTestId('send-success-button');

      expect(closeButton).toBeInTheDocument();
      expect(backButton).toBeInTheDocument();
      expect(sendButton).toBeInTheDocument();
    });

    it('handles Tab key within modal', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close send modal');

      // Focus close button
      closeButton.focus();
      expect(document.activeElement).toBe(closeButton);

      // Tab should move focus within modal
      await user.keyboard('{Tab}');

      // Focus should still be within modal (not escaped to body)
      const dialog = screen.getByRole('dialog');
      const activeElement = document.activeElement;
      expect(dialog.contains(activeElement)).toBe(true);
    });

    it('handles Shift+Tab within modal', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      const backButton = screen.getByTestId('back-button');

      // Focus a button
      backButton.focus();

      // Shift+Tab should move focus backward within modal
      await user.keyboard('{Shift>}{Tab}{/Shift}');

      // Focus should still be within modal
      const dialog = screen.getByRole('dialog');
      const activeElement = document.activeElement;
      expect(dialog.contains(activeElement)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('handles missing onClose callback gracefully', async () => {
      // This shouldn't happen in practice, but test defensive code
      const propsWithoutClose = { ...defaultProps, onClose: undefined as any };

      // Should not throw
      expect(() => {
        render(<SendModal {...propsWithoutClose} />);
      }).not.toThrow();
    });

    it('handles rapid ESC key presses', async () => {
      const user = userEvent.setup();
      render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Press ESC multiple times rapidly
      await user.keyboard('{Escape}{Escape}{Escape}');

      // Should call onClose at least once (may be called multiple times before state updates)
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles modal reopening after close', async () => {
      const { rerender } = render(<SendModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<SendModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('handles account change while modal is open', async () => {
      const { rerender } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Test Account');
      });

      const newAccount = createMockAccount({ name: 'Updated Account' });
      rerender(<SendModal {...defaultProps} account={newAccount} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Updated Account');
      });
    });

    it('handles balance update while modal is open', async () => {
      const { rerender } = render(<SendModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByTestId('balance-confirmed')).toHaveTextContent('100000');
      });

      const newBalance = createMockBalance({ confirmed: 500000 });
      rerender(<SendModal {...defaultProps} balance={newBalance} />);

      await waitFor(() => {
        expect(screen.getByTestId('balance-confirmed')).toHaveTextContent('500000');
      });
    });
  });

  describe('Multiple Instances', () => {
    it('handles multiple modals with different accounts', async () => {
      const account1 = createMockAccount({ name: 'Account 1' });
      const account2 = createMockAccount({ name: 'Account 2' });

      const { rerender } = render(
        <SendModal {...defaultProps} account={account1} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Account 1');
      });

      rerender(<SendModal {...defaultProps} account={account2} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Account 2');
      });
    });
  });
});
