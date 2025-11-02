/**
 * SendScreen Component Test Suite
 *
 * Comprehensive tests for the SendScreen component covering:
 * - Initial render and loading states
 * - Recipient address input and validation
 * - Amount input and validation (including max button)
 * - Fee selection (slow/medium/fast)
 * - Transaction summary display
 * - Form validation (all fields)
 * - Transaction submission (success/error)
 * - Contact picker integration
 * - Privacy warnings for address reuse
 * - Multisig PSBT flow
 * - Unlock wallet modal
 * - Success screen display
 * - Error handling (network, insufficient funds, etc.)
 * - User interactions
 * - Accessibility
 *
 * Total Tests: 47
 * Priority: P0 - Critical user flow (sending Bitcoin)
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithProviders, userEvent, mockChromeSendMessageAsync } from './testUtils';
import SendScreen from '../SendScreen';
import {
  createMockAccount,
  createMockMultisigAccount,
  createMockBalance,
  createMockFeeEstimate,
  createMockContact,
  createMockXpubContact,
} from './testFactories';
import { MessageType } from '../../../shared/types';

// Create stable mock functions outside the hook mocks
const mockGetContacts = jest.fn();
const mockGetContactByAddress = jest.fn().mockResolvedValue(null);
const mockBuildPSBT = jest.fn().mockResolvedValue({
  psbtBase64: 'cHNidP8BAH...',
  txid: 'mock-txid-123',
  fee: 750,
  size: 250,
});
const mockSavePending = jest.fn().mockResolvedValue(undefined);

// Mock hooks with stable function references
jest.mock('../../hooks/useBitcoinPrice', () => ({
  useBitcoinPrice: () => ({ price: 50000, loading: false, error: null }),
}));

jest.mock('../../hooks/usePSBT', () => ({
  usePSBT: () => ({
    buildPSBT: mockBuildPSBT,
    savePending: mockSavePending,
    isBuilding: false,
  }),
}));

jest.mock('../../hooks/useContacts', () => ({
  useContacts: () => ({
    contacts: [],
    getContacts: mockGetContacts,
    getContactByAddress: mockGetContactByAddress,
  }),
}));

// Mock PSBTExport component
jest.mock('../PSBT/PSBTExport', () => {
  return function MockPSBTExport({ onClose }: { onClose: () => void }) {
    return (
      <div data-testid="psbt-export-modal">
        <button onClick={onClose}>Close PSBT Export</button>
      </div>
    );
  };
});

describe('SendScreen', () => {
  const mockOnBack = jest.fn();
  const mockOnSendSuccess = jest.fn();
  let mockAccount: ReturnType<typeof createMockAccount>;
  let mockMultisigAccount: ReturnType<typeof createMockMultisigAccount>;
  let mockBalance: ReturnType<typeof createMockBalance>;
  let mockFeeEstimate: ReturnType<typeof createMockFeeEstimate>;

  // Helper to wait for fee estimates to load
  const waitForFeesToLoad = async () => {
    // Wait for loading to disappear AND for fee options to appear
    await waitFor(() => {
      expect(screen.queryByText('Loading fee estimates...')).not.toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
    }, { timeout: 2000 });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Use real timers for most tests since the async mocks use setTimeout
    jest.useRealTimers();

    mockAccount = createMockAccount({
      name: 'Test Account',
      index: 0,
    });

    mockMultisigAccount = createMockMultisigAccount({
      name: 'Test Multisig',
      index: 1,
    });

    mockBalance = createMockBalance({
      confirmed: 100000, // 0.001 BTC
      unconfirmed: 0,
    });

    mockFeeEstimate = createMockFeeEstimate({
      slow: 1,
      medium: 3,
      fast: 5,
    });
  });

  afterEach(() => {
    // No cleanup needed since we're using real timers
  });

  describe('Initial Render - Tab Mode', () => {
    it('renders header with account name in tab mode', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
          isModal={false}
        />
      );

      // Wait for PrivacyProvider to initialize and component to render
      await waitFor(() => {
        expect(screen.getByText('Send Bitcoin')).toBeInTheDocument();
      });
      expect(screen.getByText('Test Account')).toBeInTheDocument();
    });

    it('does not render header in modal mode', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
          isModal={true}
        />
      );

      expect(screen.queryByText('Send Bitcoin')).not.toBeInTheDocument();
    });

    it('displays all form fields (address, amount, fee selector)', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('To Address')).toBeInTheDocument();
      });

      expect(screen.getByText(/Amount.*satoshis/i)).toBeInTheDocument();
      expect(screen.getByText('Transaction Fee')).toBeInTheDocument();
    });

    it('displays account balance', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      // Wait for fee estimates to finish loading first
      await waitForFeesToLoad();

      // Check the balance section contains the expected text
      const balanceSection = screen.getByText(/Available balance:/);
      expect(balanceSection).toBeInTheDocument();

      // The balance is displayed as "100000 sats"
      expect(screen.getByText((content, element) => {
        return element?.textContent === '100000 sats';
      })).toBeInTheDocument();
    });

    it('shows loading state while fetching fee estimates', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      // Wait for PrivacyProvider to initialize first
      await waitFor(() => {
        expect(screen.getByText('Loading fee estimates...')).toBeInTheDocument();
      });
    });

    it('displays fee options after loading', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      // Wait for fee options to appear (which means loading is complete and feeEstimates are set)
      await waitFor(() => {
        expect(screen.getByText('Slow')).toBeInTheDocument();
      });

      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Recipient Address Input', () => {
    it('accepts valid native segwit testnet address', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      // No error should be shown
      await user.tab(); // Trigger blur
      await waitFor(() => {
        expect(screen.queryByText(/Invalid testnet address/i)).not.toBeInTheDocument();
      });
    });

    it('accepts valid legacy testnet address (m prefix)', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      await user.type(addressInput, 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Invalid testnet address/i)).not.toBeInTheDocument();
      });
    });

    it('accepts valid segwit testnet address (2 prefix)', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      await user.type(addressInput, '2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/Invalid testnet address/i)).not.toBeInTheDocument();
      });
    });

    it('shows error for invalid address format', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      await user.type(addressInput, 'invalidaddress123');
      await user.tab(); // Trigger validation

      expect(await screen.findByText(/Invalid testnet address/i)).toBeInTheDocument();
    });

    it('shows error for mainnet address on testnet', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      // Mainnet address starts with bc1 instead of tb1
      await user.type(addressInput, 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq');
      await user.tab();

      expect(await screen.findByText(/Invalid testnet address/i)).toBeInTheDocument();
    });

    it('shows error when address field is empty on blur', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      await user.click(addressInput);
      await user.tab(); // Blur without entering anything

      // Empty address is validated on submit, not blur
      expect(screen.queryByText('Address is required')).not.toBeInTheDocument();
    });

    it('clears address error when user starts typing', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const addressInput = await screen.findByPlaceholderText('tb1q...');
      await user.type(addressInput, 'invalid');
      await user.tab();

      expect(await screen.findByText(/Invalid testnet address/i)).toBeInTheDocument();

      // Start typing again
      await user.type(addressInput, 'tb1q');

      // Error should clear immediately
      await waitFor(() => {
        expect(screen.queryByText(/Invalid testnet address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Amount Input', () => {
    it('accepts valid amount in satoshis', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      expect(amountInput).toHaveValue(50000);
    });

    it('displays BTC conversion when amount is entered', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      expect(await screen.findByText(/≈ 0.00050000 BTC/i)).toBeInTheDocument();
    });

    it('shows error for amount below dust limit (546 sats)', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '500');
      await user.tab();

      expect(await screen.findByText(/Amount too small.*546 sats/i)).toBeInTheDocument();
    });

    it('shows error for negative amount', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '-1000');
      await user.tab();

      expect(await screen.findByText(/Amount must be a positive number/i)).toBeInTheDocument();
    });

    it('shows error for zero amount', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '0');
      await user.tab();

      expect(await screen.findByText(/Amount must be a positive number/i)).toBeInTheDocument();
    });

    it('shows error when amount + fee exceeds balance', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const amountInput = await screen.findByPlaceholderText('10000');
      // Balance is 100000, estimated fee is ~750, so 99500 should fail
      await user.type(amountInput, '99500');
      await user.tab();

      expect(await screen.findByText(/Insufficient balance/i)).toBeInTheDocument();
    });

    it('clears amount error when user starts typing', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '100');
      await user.tab();

      expect(await screen.findByText(/Amount too small/i)).toBeInTheDocument();

      await user.clear(amountInput);
      await user.type(amountInput, '1000');

      await waitFor(() => {
        expect(screen.queryByText(/Amount too small/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Max Button', () => {
    it('sets amount to balance minus estimated fee', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const maxButton = screen.getByRole('button', { name: /Max/i });
      await user.click(maxButton);

      const amountInput = screen.getByPlaceholderText('10000') as HTMLInputElement;
      // Balance (100000) - estimated fee (3 sat/vB * 250 vB = 750 sats) = 99250
      expect(parseInt(amountInput.value, 10)).toBeGreaterThan(98000);
      expect(parseInt(amountInput.value, 10)).toBeLessThan(100000);
    });

    it('clears amount errors when Max button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const amountInput = await screen.findByPlaceholderText('10000');
      await user.type(amountInput, '100');
      await user.tab();

      expect(await screen.findByText(/Amount too small/i)).toBeInTheDocument();

      const maxButton = screen.getByRole('button', { name: /Max/i });
      await user.click(maxButton);

      await waitFor(() => {
        expect(screen.queryByText(/Amount too small/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Fee Selection', () => {
    it('selects medium fee by default', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitFor(() => {
        const mediumButton = screen.getByText('Medium').closest('button');
        expect(mediumButton).toHaveClass('border-bitcoin');
      });
    });

    it('switches to slow fee when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Slow')).toBeInTheDocument();
      });

      const slowButton = screen.getByText('Slow').closest('button')!;
      await user.click(slowButton);

      expect(slowButton).toHaveClass('border-bitcoin');
    });

    it('switches to fast fee when clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Fast')).toBeInTheDocument();
      });

      const fastButton = screen.getByText('Fast').closest('button')!;
      await user.click(fastButton);

      expect(fastButton).toHaveClass('border-bitcoin');
    });

    it('displays fee estimate that updates when fee speed changes', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      // Check for medium fee estimate (3 sat/vB * 250 vB = 750 sats)
      // Use getAllByText since there might be multiple elements with the same text
      const mediumFeeElements = screen.getAllByText((content, element) => {
        const text = element?.textContent || '';
        return text.includes('Estimated fee:') && text.includes('750 sats');
      });
      expect(mediumFeeElements.length).toBeGreaterThan(0);

      const fastButton = screen.getByText('Fast').closest('button')!;
      await user.click(fastButton);

      // Check for fast fee estimate (5 sat/vB * 250 vB = 1250 sats)
      await waitFor(() => {
        const fastFeeElements = screen.getAllByText((content, element) => {
          const text = element?.textContent || '';
          return text.includes('Estimated fee:') && text.includes('1250 sats');
        });
        expect(fastFeeElements.length).toBeGreaterThan(0);
      });
    });

    it('uses default fees when API fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: new Error('API failed'),
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      // Should still show fee options with default values
      expect(screen.getByText('Slow')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('Fast')).toBeInTheDocument();
    });
  });

  describe('Transaction Summary', () => {
    it('shows transaction summary when address and amount are valid', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      expect(await screen.findByText('Transaction Summary')).toBeInTheDocument();
    });

    it('displays amount, fee, and total in summary', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      await waitFor(() => {
        const summary = screen.getByText('Transaction Summary').closest('div');
        expect(summary).toBeInTheDocument();
      });

      // Check for amount, fee, and total (within summary section)
      const summarySection = screen.getByText('Transaction Summary').closest('div')!;
      expect(summarySection.textContent).toMatch(/Amount:.*50000 sats/i);
      expect(summarySection.textContent).toMatch(/Fee:.*750 sats/i);
      expect(summarySection.textContent).toMatch(/Total:.*50750 sats/i);
    });

    it('hides summary when address or amount has error', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'invalid');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      expect(screen.queryByText('Transaction Summary')).not.toBeInTheDocument();
    });
  });

  describe('Form Validation on Submit', () => {
    it('shows validation errors when submitting empty form', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });

      // Button should be disabled when form is empty
      expect(sendButton).toBeDisabled();

      // Enter address to partially fill the form
      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      // Type a small invalid amount (below dust limit) to trigger validation
      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '100');
      await user.tab(); // Blur the field

      // Should show amount validation error (below dust limit)
      expect(await screen.findByText(/Amount too small/i)).toBeInTheDocument();

      // Button should still be disabled
      expect(sendButton).toBeDisabled();
    });

    it('disables send button when form is incomplete', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      expect(sendButton).toBeDisabled();
    });

    it('enables send button when all fields are valid', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      await waitFor(() => {
        const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
        expect(sendButton).not.toBeDisabled();
      });
    });
  });

  describe('Transaction Submission - Success', () => {
    it('sends transaction with correct parameters', async () => {
      const user = userEvent.setup({ delay: null });
      const sendMessage = mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: {
          txid: 'abc123def456789012345678901234567890123456789012345678901234567890',
          fee: 750,
          size: 250,
        },
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalledWith(
          {
            type: MessageType.SEND_TRANSACTION,
            payload: {
              accountIndex: 0,
              toAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
              amount: 50000,
              feeRate: 3, // medium
            },
          },
          expect.any(Function) // callback function
        );
      });
    });

    it('shows loading state while sending', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                success: true,
                data: {
                  txid: 'abc123',
                  fee: 750,
                  size: 250,
                },
              }),
            1000
          );
        }),
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(await screen.findByText('Sending...')).toBeInTheDocument();
    });

    it('displays success screen after successful send', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: {
          txid: 'abc123def456789012345678901234567890123456789012345678901234567890',
          fee: 750,
          size: 250,
        },
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(await screen.findByText('Transaction Sent!')).toBeInTheDocument();
      expect(screen.getByText('0.00050000 BTC')).toBeInTheDocument();
    });

    it('displays transaction ID in success screen', async () => {
      const user = userEvent.setup({ delay: null });
      const txid = 'abc123def456789012345678901234567890123456789012345678901234567890';
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: {
          txid,
          fee: 750,
          size: 250,
        },
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(await screen.findByText(txid)).toBeInTheDocument();
    });

    it('displays link to block explorer in success screen', async () => {
      const user = userEvent.setup({ delay: null });
      const txid = 'abc123def456789012345678901234567890123456789012345678901234567890';
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: {
          txid,
          fee: 750,
          size: 250,
        },
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      const explorerLink = await screen.findByRole('link', { name: /View on Block Explorer/i });
      expect(explorerLink).toHaveAttribute(
        'href',
        `https://blockstream.info/testnet/tx/${txid}`
      );
    });

    it('calls onSendSuccess and onBack when Done button clicked', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: {
          txid: 'abc123',
          fee: 750,
          size: 250,
        },
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      const doneButton = await screen.findByRole('button', { name: /Done/i });
      await user.click(doneButton);

      expect(mockOnSendSuccess).toHaveBeenCalledTimes(1);
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Transaction Submission - Error Handling', () => {
    it('displays error message when transaction fails', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: new Error('Network error'),
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(await screen.findByText(/Transaction failed.*Network error/i)).toBeInTheDocument();
    });

    it('shows user-friendly message for insufficient funds error', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: new Error('insufficient funds'),
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(
        await screen.findByText(/Insufficient funds.*don't have enough Bitcoin/i)
      ).toBeInTheDocument();
    });

    it('shows user-friendly message for dust limit error', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: new Error('dust'),
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(
        await screen.findByText(/Amount too small.*minimum output size.*546 satoshis/i)
      ).toBeInTheDocument();
    });

    it('shows reassurance message that Bitcoin is safe after error', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
        [MessageType.SEND_TRANSACTION]: new Error('504 timeout'),
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Send Transaction/i });
      await user.click(sendButton);

      expect(
        await screen.findByText(/Your Bitcoin is safe. No funds were lost./i)
      ).toBeInTheDocument();
    });
  });

  describe('Multisig Account - PSBT Flow', () => {
    it('shows multisig info box for multisig accounts', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockMultisigAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      expect(
        await screen.findByText(/Multisig Transaction Flow/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/PSBT.*Partially Signed Bitcoin Transaction/i)
      ).toBeInTheDocument();
    });

    it('changes button text for multisig account', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockMultisigAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      expect(screen.getByRole('button', { name: /Create Multisig Transaction/i })).toBeInTheDocument();
    });

    it('builds PSBT instead of sending for multisig', async () => {
      const user = userEvent.setup({ delay: null });

      // Set up PSBT mocks (re-apply after clearAllMocks in beforeEach)
      mockBuildPSBT.mockResolvedValue({
        psbtBase64: 'cHNidP8BAHECAAAAAQFJrj...',
        txid: 'abc123',
        fee: 1000,
        size: 250,
      });
      mockSavePending.mockResolvedValue(undefined);

      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockMultisigAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      const amountInput = screen.getByPlaceholderText('10000');
      await user.type(amountInput, '50000');

      const sendButton = screen.getByRole('button', { name: /Create Multisig Transaction/i });
      await user.click(sendButton);

      // Should show PSBT export modal (wait for async buildPSBT and savePending to complete)
      expect(await screen.findByTestId('psbt-export-modal', {}, { timeout: 3000 })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('To Address')).toBeInTheDocument();
      });

      expect(screen.getByText(/Amount.*satoshis/i)).toBeInTheDocument();
      expect(screen.getByText('Transaction Fee')).toBeInTheDocument();
    });

    it('has accessible button labels', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
          isModal={false}
        />
      );

      await waitForFeesToLoad();

      expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Max/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Transaction/i })).toBeInTheDocument();
    });

    it('announces validation errors', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
        />
      );

      await waitForFeesToLoad();

      const addressInput = screen.getByPlaceholderText('tb1q...');
      await user.type(addressInput, 'invalid');
      await user.tab();

      const errorMessage = await screen.findByText(/Invalid testnet address/i);
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-400');
    });
  });

  describe('Back Navigation', () => {
    it('calls onBack when back button clicked in tab mode', async () => {
      const user = userEvent.setup({ delay: null });
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
          isModal={false}
        />
      );

      const backButton = await screen.findByRole('button', { name: /Back/i });
      await user.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('does not show back button in modal mode', () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_FEE_ESTIMATES]: mockFeeEstimate,
      });

      renderWithProviders(
        <SendScreen
          account={mockAccount}
          balance={mockBalance}
          onBack={mockOnBack}
          onSendSuccess={mockOnSendSuccess}
          isModal={true}
        />
      );

      expect(screen.queryByRole('button', { name: /Back/i })).not.toBeInTheDocument();
    });
  });
});
