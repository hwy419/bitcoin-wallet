/**
 * ReceiveModal Component Tests
 *
 * Tests for the ReceiveModal wrapper component. This is a thin wrapper around ReceiveScreen
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
import { render, screen, userEvent, waitFor } from '../../__tests__/testUtils';
import { createMockAccount } from '../../__tests__/testFactories';
import { ReceiveModal } from '../ReceiveModal';

// Mock PrivacyContext to avoid async initialization issues in tests
jest.mock('../../../contexts/PrivacyContext', () => ({
  PrivacyProvider: ({ children }: any) => <>{children}</>,
  usePrivacy: () => ({ balancesHidden: false, togglePrivacy: jest.fn(), setBalancesHidden: jest.fn() })
}));

// Mock ReceiveScreen component since it's already tested at 100%
jest.mock('../../ReceiveScreen', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ account, onBack, isModal }: any) =>
      React.createElement(
        'div',
        { 'data-testid': 'mock-receive-screen' },
        React.createElement('div', null, 'Mock ReceiveScreen'),
        React.createElement('div', { 'data-testid': 'account-name' }, account.name),
        React.createElement('div', { 'data-testid': 'is-modal' }, isModal ? 'true' : 'false'),
        React.createElement('button', { onClick: onBack, 'data-testid': 'back-button' }, 'Back')
      )
  };
});

describe('ReceiveModal', () => {
  // Test data
  const mockAccount = createMockAccount({ name: 'Test Account' });
  const mockOnClose = jest.fn();

  // Default props
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    account: mockAccount,
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
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('mock-receive-screen')).toBeInTheDocument();
      });
    });

    it('does not render when isOpen is false', () => {
      render(<ReceiveModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-receive-screen')).not.toBeInTheDocument();
    });

    it('displays modal title', () => {
      render(<ReceiveModal {...defaultProps} />);

      expect(screen.getByText('Receive Bitcoin')).toBeInTheDocument();
    });

    it('displays account name in subtitle', async () => {
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        // Account name appears in subtitle (p element) - use getAllByText since it appears twice
        const accountNames = screen.getAllByText('Test Account');
        expect(accountNames.length).toBeGreaterThan(0);
        // Verify at least one is the subtitle
        const subtitle = accountNames.find(el => el.tagName === 'P');
        expect(subtitle).toBeInTheDocument();
      });
    });

    it('renders close button', () => {
      render(<ReceiveModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close receive modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('renders backdrop', () => {
      const { container } = render(<ReceiveModal {...defaultProps} />);

      // Backdrop has aria-hidden="true" and fixed positioning
      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('fixed', 'inset-0');
    });
  });

  describe('Accessibility', () => {
    it('has correct ARIA role', () => {
      render(<ReceiveModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'receive-modal-title');
    });

    it('has accessible title', () => {
      render(<ReceiveModal {...defaultProps} />);

      const title = screen.getByText('Receive Bitcoin');
      expect(title).toHaveAttribute('id', 'receive-modal-title');
    });

    it('close button has aria-label', () => {
      render(<ReceiveModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close receive modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('backdrop has aria-hidden', () => {
      const { container } = render(<ReceiveModal {...defaultProps} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('Props Pass-through to ReceiveScreen', () => {
    it('passes account prop to ReceiveScreen', async () => {
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Test Account');
      });
    });

    it('passes isModal=true to ReceiveScreen', async () => {
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('is-modal')).toHaveTextContent('true');
      });
    });

    it('passes different account values', async () => {
      const customAccount = createMockAccount({ name: 'Custom Account' });
      render(<ReceiveModal {...defaultProps} account={customAccount} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Custom Account');
      });
    });

    it('passes onBack callback to ReceiveScreen', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      const backButton = screen.getByTestId('back-button');
      await user.click(backButton);

      // onBack should trigger onClose
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close receive modal');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when ESC key pressed', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(<ReceiveModal {...defaultProps} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      expect(backdrop).toBeInTheDocument();

      await user.click(backdrop!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not close when modal content clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-receive-screen')).toBeInTheDocument();
      });

      const modalContent = screen.getByTestId('mock-receive-screen');
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('calls onClose when ReceiveScreen back button clicked', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      const backButton = screen.getByTestId('back-button');
      await user.click(backButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not respond to ESC when modal is closed', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} isOpen={false} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Body Scroll Prevention', () => {
    it('prevents body scroll when modal is open', () => {
      render(<ReceiveModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('does not prevent scroll when modal is closed', () => {
      render(<ReceiveModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('restores scroll when modal closes', () => {
      const { rerender } = render(<ReceiveModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      rerender(<ReceiveModal {...defaultProps} isOpen={false} />);

      expect(document.body.style.overflow).toBe('');
    });

    it('restores scroll when modal unmounts', () => {
      const { unmount } = render(<ReceiveModal {...defaultProps} />);

      expect(document.body.style.overflow).toBe('hidden');

      unmount();

      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Event Listener Cleanup', () => {
    it('removes ESC key listener on unmount', async () => {
      const user = userEvent.setup();
      const { unmount } = render(<ReceiveModal {...defaultProps} />);

      unmount();

      // Try to press ESC after unmount - should not call onClose
      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('removes ESC key listener when modal closes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<ReceiveModal {...defaultProps} />);

      // Close modal
      rerender(<ReceiveModal {...defaultProps} isOpen={false} />);

      // Try ESC - should not call onClose again
      await user.keyboard('{Escape}');

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('cleans up properly on rapid open/close', () => {
      const { rerender } = render(<ReceiveModal {...defaultProps} />);

      // Rapid open/close cycles
      rerender(<ReceiveModal {...defaultProps} isOpen={false} />);
      rerender(<ReceiveModal {...defaultProps} isOpen={true} />);
      rerender(<ReceiveModal {...defaultProps} isOpen={false} />);
      rerender(<ReceiveModal {...defaultProps} isOpen={true} />);

      // Should still work correctly
      expect(document.body.style.overflow).toBe('hidden');
    });
  });

  describe('Focus Management', () => {
    it('contains focusable elements when open', async () => {
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Close receive modal')).toBeInTheDocument();
        expect(screen.getByTestId('back-button')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText('Close receive modal');
      const backButton = screen.getByTestId('back-button');

      expect(closeButton).toBeInTheDocument();
      expect(backButton).toBeInTheDocument();
    });

    it('handles Tab key within modal', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close receive modal');

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
      render(<ReceiveModal {...defaultProps} />);

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
    it('handles missing onClose callback gracefully', () => {
      // This shouldn't happen in practice, but test defensive code
      const propsWithoutClose = { ...defaultProps, onClose: undefined as any };

      // Should not throw
      expect(() => {
        render(<ReceiveModal {...propsWithoutClose} />);
      }).not.toThrow();
    });

    it('handles rapid ESC key presses', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      // Press ESC multiple times rapidly
      await user.keyboard('{Escape}{Escape}{Escape}');

      // Should call onClose at least once (may be called multiple times before state updates)
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles modal reopening after close', () => {
      const { rerender } = render(<ReceiveModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      rerender(<ReceiveModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('handles account change while modal is open', async () => {
      const { rerender } = render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Test Account');
      });

      const newAccount = createMockAccount({ name: 'Updated Account' });
      rerender(<ReceiveModal {...defaultProps} account={newAccount} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Updated Account');
      });
    });
  });

  describe('Multiple Instances', () => {
    it('handles multiple modals with different accounts', async () => {
      const account1 = createMockAccount({ name: 'Account 1' });
      const account2 = createMockAccount({ name: 'Account 2' });

      const { rerender } = render(
        <ReceiveModal {...defaultProps} account={account1} />
      );

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Account 1');
      });

      rerender(<ReceiveModal {...defaultProps} account={account2} />);

      await waitFor(() => {
        expect(screen.getByTestId('account-name')).toHaveTextContent('Account 2');
      });
    });
  });

  describe('Comparison with SendModal Structure', () => {
    it('has similar DOM structure to SendModal', async () => {
      render(<ReceiveModal {...defaultProps} />);

      await waitFor(() => {
        // Should have dialog role
        expect(screen.getByRole('dialog')).toBeInTheDocument();

        // Should have title
        expect(screen.getByText('Receive Bitcoin')).toBeInTheDocument();

        // Should have close button
        expect(screen.getByLabelText('Close receive modal')).toBeInTheDocument();

        // Should have account name (appears twice - in subtitle and mock)
        const accountNames = screen.getAllByText('Test Account');
        expect(accountNames.length).toBeGreaterThan(0);
      });
    });

    it('has similar accessibility attributes', () => {
      render(<ReceiveModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'receive-modal-title');
    });
  });

  describe('No Balance Prop Required', () => {
    it('does not require balance prop unlike SendModal', () => {
      // ReceiveModal only needs account, not balance
      const minimalProps = {
        isOpen: true,
        onClose: mockOnClose,
        account: mockAccount,
      };

      // Should render successfully
      expect(() => {
        render(<ReceiveModal {...minimalProps} />);
      }).not.toThrow();

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Modal Overlay Click Behavior', () => {
    it('prevents click propagation on modal content', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      // Click on the modal content area (not backdrop)
      const title = screen.getByText('Receive Bitcoin');
      await user.click(title);

      // Should not close
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('closes when clicking outside modal content', async () => {
      const user = userEvent.setup();
      const { container } = render(<ReceiveModal {...defaultProps} />);

      const backdrop = container.querySelector('[aria-hidden="true"]');
      await user.click(backdrop!);

      // Should close
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('does not interfere with other key presses', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      // Press various keys that should not close modal
      await user.keyboard('a');
      await user.keyboard('{Enter}');
      await user.keyboard('{Space}');

      // Should not close
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('only closes on Escape key', async () => {
      const user = userEvent.setup();
      render(<ReceiveModal {...defaultProps} />);

      await user.keyboard('{Escape}');

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
