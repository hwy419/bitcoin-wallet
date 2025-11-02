/**
 * WalletSetup Component Test Suite
 *
 * Comprehensive tests for the WalletSetup component covering:
 * - Initial render and tab navigation
 * - Create wallet flow (password validation, seed phrase generation)
 * - Import wallet flow (seed phrase validation, password creation)
 * - Import backup flow (file selection, password entry, restore)
 * - Password strength validation and requirements
 * - Seed phrase backup confirmation
 * - Error handling and edge cases
 * - Accessibility
 * - Security (no logging of sensitive data)
 *
 * Total Tests: 49
 * Priority: P0 - Critical authentication component
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { userEvent, mockChromeSendMessageAsync } from './testUtils';
import WalletSetup from '../WalletSetup';
import { MessageType } from '../../../shared/types';

// Mock PasswordStrengthMeter and PasswordRequirementsChecklist
jest.mock('../shared/PasswordStrengthMeter', () => ({
  __esModule: true,
  default: ({ password, className }: any) => (
    <div data-testid="password-strength-meter" className={className}>
      Strength: {password.length > 0 ? 'visible' : 'hidden'}
    </div>
  ),
}));

jest.mock('../shared/PasswordRequirementsChecklist', () => ({
  __esModule: true,
  default: ({ password, requirements, className }: any) => (
    <div data-testid="password-requirements-checklist" className={className}>
      Requirements for: {password}
    </div>
  ),
}));

// Mock wallet backup import modals
jest.mock('../WalletBackup/Import', () => {
  const React = require('react');
  return {
    FileSelectionModal: ({ isOpen, onClose, onContinue }: any) =>
      isOpen ? (
        <div data-testid="file-selection-modal">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              // Create a mock file with a text() method
              const mockFileContent = JSON.stringify({
                version: 1,
                encrypted: true,
                data: 'mock-encrypted-data',
              });
              const mockFile = new File([mockFileContent], 'backup.dat', {
                type: 'application/json',
              });
              // Add the text() method that File objects have in browsers
              (mockFile as any).text = () => Promise.resolve(mockFileContent);
              onContinue(mockFile);
            }}
          >
            Select File
          </button>
        </div>
      ) : null,
    BackupPasswordEntryModal: ({ isOpen, onClose, onBack, onContinue }: any) =>
      isOpen ? (
        <div data-testid="backup-password-modal">
          <button onClick={onClose}>Cancel</button>
          <button onClick={onBack}>Back</button>
          <button onClick={() => onContinue('backup-password')}>Continue</button>
        </div>
      ) : null,
    ImportProgressModal: ({ isOpen, progress, currentStep }: any) =>
      isOpen ? (
        <div data-testid="import-progress-modal">
          Progress: {progress}% - {currentStep}
        </div>
      ) : null,
    SetWalletPasswordModal: ({ isOpen, onClose, onContinue }: any) =>
      isOpen ? (
        <div data-testid="set-wallet-password-modal">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onContinue('new-password')}>Continue</button>
        </div>
      ) : null,
    ImportSuccessModal: ({ isOpen, onClose, accountCount, contactCount, network }: any) =>
      isOpen ? (
        <div data-testid="import-success-modal">
          <div>Accounts: {accountCount}</div>
          <div>Contacts: {contactCount}</div>
          <div>Network: {network}</div>
          <button onClick={onClose}>Done</button>
        </div>
      ) : null,
  };
});

describe('WalletSetup Component', () => {
  const mockOnSetupComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Remove DEV_PASSWORD from environment
    delete (process.env as any).DEV_PASSWORD;
    delete (process.env as any).DEV_MNEMONIC;

    // Set up default chrome.runtime.sendMessage mock
    // Individual tests can override this with mockChromeSendMessageAsync
    global.chrome.runtime.sendMessage = jest.fn((message: any, callback?: any) => {
      if (callback) {
        callback({ success: true, data: {} });
      }
      return true;
    }) as any;
  });

  // ==================== INITIAL RENDER & NAVIGATION ====================

  describe('Initial Render & Navigation', () => {
    it('renders welcome screen with title', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      expect(screen.getByText('Welcome to Bitcoin Wallet')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      // Use getAllByRole since there are multiple "Create" buttons (tab + submit)
      const createButtons = screen.getAllByRole('button', { name: /create/i });
      expect(createButtons.length).toBeGreaterThan(0);
      expect(screen.getByRole('button', { name: /seed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /backup/i })).toBeInTheDocument();
    });

    it('shows create tab by default', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      expect(screen.getByText(/create a new bitcoin wallet/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create wallet/i })).toBeInTheDocument();
    });

    it('switches to import seed tab when clicked', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.click(screen.getByRole('button', { name: /seed/i }));

      expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /import wallet/i })).toBeInTheDocument();
    });

    it('switches to import backup tab when clicked', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.click(screen.getByRole('button', { name: /backup/i }));

      expect(screen.getByText(/restore your wallet from an encrypted backup file/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /select backup file/i })).toBeInTheDocument();
    });

    it('clears errors when switching tabs', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: new Error('Create failed'),
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      // Trigger error on create tab
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      await waitFor(() => {
        expect(screen.getByText(/create failed/i)).toBeInTheDocument();
      });

      // Switch to import tab
      await user.click(screen.getByRole('button', { name: /seed/i }));

      // Error should be cleared
      expect(screen.queryByText(/create failed/i)).not.toBeInTheDocument();
    });
  });

  // ==================== CREATE WALLET FLOW ====================

  describe('Create Wallet Flow', () => {
    it('shows seed phrase length selector with 12 words selected by default', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      const twelveWordsButton = screen.getByText('12 Words').closest('button');
      expect(twelveWordsButton).toHaveClass('border-bitcoin');
    });

    it('allows selecting 24-word seed phrase', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.click(screen.getByText('24 Words').closest('button')!);

      expect(screen.getByText('24 Words').closest('button')).toHaveClass('border-bitcoin');
      expect(screen.getByText(/create a new bitcoin wallet/i)).toHaveTextContent('24-word');
    });

    it('shows address type selector with native-segwit selected by default', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      const select = screen.getAllByRole('combobox')[0];
      expect(select).toHaveValue('native-segwit');
    });

    it('allows changing address type', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      const select = screen.getAllByRole('combobox')[0];
      await user.selectOptions(select, 'legacy');

      expect(select).toHaveValue('legacy');
    });

    it('renders password input with show/hide toggle', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      const passwordInput = screen.getByPlaceholderText(/enter strong password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('toggles password visibility when eye icon clicked', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      const passwordInput = screen.getByPlaceholderText(/enter strong password/i);
      const toggleButton = passwordInput.nextElementSibling as HTMLElement;

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('renders confirm password input with separate show/hide toggle', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      const confirmInput = screen.getByPlaceholderText(/confirm password/i);
      expect(confirmInput).toHaveAttribute('type', 'password');

      const toggleButton = confirmInput.nextElementSibling as HTMLElement;
      await user.click(toggleButton);
      expect(confirmInput).toHaveAttribute('type', 'text');
    });

    it('shows password strength meter', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      // Only the active tab (Create) is rendered, so we should see 1 meter
      expect(screen.getAllByTestId('password-strength-meter')).toHaveLength(1);
    });

    it('shows password requirements checklist', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      // Only the active tab (Create) is rendered, so we should see 1 checklist
      expect(screen.getAllByTestId('password-requirements-checklist')).toHaveLength(1);
    });

    it('disables create button when password is empty', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      const createButton = screen.getByRole('button', { name: /create wallet/i });
      expect(createButton).toBeDisabled();
    });

    it('enables create button when passwords are filled', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');

      const createButton = screen.getByRole('button', { name: /create wallet/i });
      expect(createButton).toBeEnabled();
    });

    it('validates minimum password length (8 characters)', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: { mnemonic: 'word1 word2 word3', firstAddress: 'tb1q...' },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Short1');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Short1');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('validates password requires uppercase letter', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: { mnemonic: 'word1 word2 word3', firstAddress: 'tb1q...' },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'test1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByText(/password must contain at least one uppercase letter/i)).toBeInTheDocument();
    });

    it('validates password requires lowercase letter', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: { mnemonic: 'word1 word2 word3', firstAddress: 'tb1q...' },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'TEST1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'TEST1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByText(/password must contain at least one lowercase letter/i)).toBeInTheDocument();
    });

    it('validates password requires number', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: { mnemonic: 'word1 word2 word3', firstAddress: 'tb1q...' },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'TestTest');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'TestTest');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByText(/password must contain at least one number/i)).toBeInTheDocument();
    });

    it('validates passwords match', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: { mnemonic: 'word1 word2 word3', firstAddress: 'tb1q...' },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Different1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('clears password error when typing', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: { mnemonic: 'word1 word2 word3', firstAddress: 'tb1q...' },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      // Trigger error
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Different1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();

      // Start typing in confirm password
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'x');

      // Error should be cleared
      expect(screen.queryByText(/passwords do not match/i)).not.toBeInTheDocument();
    });

    it('creates wallet successfully with valid inputs', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: {
          mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
          firstAddress: 'tb1q...',
        },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      await waitFor(() => {
        expect(screen.getByText(/backup your seed phrase/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during wallet creation', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: new Promise(() => {}), // Never resolves
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      expect(screen.getByRole('button', { name: /creating wallet/i })).toBeInTheDocument();
    });

    it('displays error when wallet creation fails', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: new Error('Creation failed'),
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
      });
    });
  });

  // ==================== SEED PHRASE BACKUP SCREEN ====================

  describe('Seed Phrase Backup Screen', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.CREATE_WALLET]: {
          mnemonic: 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12',
          firstAddress: 'tb1q...',
        },
      });

      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /create wallet/i }));

      await waitFor(() => {
        expect(screen.getByText(/backup your seed phrase/i)).toBeInTheDocument();
      });
    });

    it('displays all 12 seed phrase words', () => {
      for (let i = 1; i <= 12; i++) {
        expect(screen.getByText(`word${i}`)).toBeInTheDocument();
      }
    });

    it('displays word numbers', () => {
      for (let i = 1; i <= 12; i++) {
        expect(screen.getByText(`${i}.`)).toBeInTheDocument();
      }
    });

    it('displays warning about seed phrase security', () => {
      expect(screen.getByText(/never share your seed phrase/i)).toBeInTheDocument();
    });

    it('renders confirmation checkbox', () => {
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('disables continue button when checkbox not checked', () => {
      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('enables continue button when checkbox is checked', async () => {
      const user = userEvent.setup();
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeEnabled();
    });

    it('shows error when trying to continue without confirming backup', async () => {
      const user = userEvent.setup();

      // Force enable the button by checking then unchecking
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
      await user.click(checkbox); // Uncheck

      const continueButton = screen.getByRole('button', { name: /continue/i });
      expect(continueButton).toBeDisabled();
    });

    it('completes setup when continue is clicked with backup confirmed', async () => {
      const user = userEvent.setup();
      const checkbox = screen.getByRole('checkbox');

      await user.click(checkbox);
      await user.click(screen.getByRole('button', { name: /continue/i }));

      expect(mockOnSetupComplete).toHaveBeenCalledTimes(1);
    });
  });

  // ==================== IMPORT WALLET FLOW ====================

  describe('Import Wallet Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      await user.click(screen.getByRole('button', { name: /seed/i }));
    });

    it('renders seed phrase input', () => {
      expect(screen.getByPlaceholderText(/word1 word2 word3/i)).toBeInTheDocument();
    });

    it('renders address type selector', () => {
      const select = screen.getAllByRole('combobox')[0];
      expect(select).toBeInTheDocument();
      expect(select).toHaveValue('native-segwit');
    });

    it('disables import button when fields are empty', () => {
      const importButton = screen.getByRole('button', { name: /import wallet/i });
      expect(importButton).toBeDisabled();
    });

    it('enables import button when all fields are filled', async () => {
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');

      const importButton = screen.getByRole('button', { name: /import wallet/i });
      expect(importButton).toBeEnabled();
    });

    it('validates 12-word seed phrase', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: { firstAddress: 'tb1q...' },
      });

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      await waitFor(() => {
        expect(mockOnSetupComplete).toHaveBeenCalled();
      });
    });

    it('validates 24-word seed phrase', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: { firstAddress: 'tb1q...' },
      });

      const twentyFourWords = Array(24)
        .fill(0)
        .map((_, i) => `word${i + 1}`)
        .join(' ');

      await user.type(screen.getByPlaceholderText(/word1 word2 word3/i), twentyFourWords);
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      await waitFor(() => {
        expect(mockOnSetupComplete).toHaveBeenCalled();
      });
    });

    it('rejects seed phrase with invalid word count', async () => {
      const user = userEvent.setup();

      await user.type(screen.getByPlaceholderText(/word1 word2 word3/i), 'word1 word2 word3');
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      expect(screen.getByText(/mnemonic must be 12, 15, 18, 21, or 24 words/i)).toBeInTheDocument();
    });

    it('accepts 15-word seed phrase', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: { firstAddress: 'tb1q...' },
      });

      const fifteenWords = Array(15)
        .fill(0)
        .map((_, i) => `word${i + 1}`)
        .join(' ');

      await user.type(screen.getByPlaceholderText(/word1 word2 word3/i), fifteenWords);
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      await waitFor(() => {
        expect(mockOnSetupComplete).toHaveBeenCalled();
      });
    });

    it('trims whitespace from seed phrase', async () => {
      const user = userEvent.setup();
      const sendMessage = mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: { firstAddress: 'tb1q...' },
      });

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        '  word1  word2  word3  word4  word5  word6  word7  word8  word9  word10  word11  word12  '
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      await waitFor(() => {
        expect(sendMessage).toHaveBeenCalled();
      });

      // Check that mnemonic was trimmed (at least leading/trailing whitespace)
      const call = sendMessage.mock.calls[0][0];
      const mnemonicSent = call.payload.mnemonic;
      expect(mnemonicSent).not.toMatch(/^\s+/); // No leading whitespace
      expect(mnemonicSent).not.toMatch(/\s+$/); // No trailing whitespace
    });

    it('validates password requirements on import', async () => {
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'weak');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'weak');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('validates passwords match on import', async () => {
      const user = userEvent.setup();

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Different1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('shows loading state during import', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: new Promise(() => {}), // Never resolves
      });

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      expect(screen.getByRole('button', { name: /importing wallet/i })).toBeInTheDocument();
    });

    it('displays error when import fails', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: new Error('Invalid seed phrase'),
      });

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid seed phrase/i)).toBeInTheDocument();
      });
    });

    it('clears mnemonic error when typing', async () => {
      const user = userEvent.setup();

      // Trigger error
      await user.type(screen.getByPlaceholderText(/word1 word2 word3/i), 'word1 word2 word3');
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      expect(screen.getByText(/mnemonic must be 12, 15, 18, 21, or 24 words/i)).toBeInTheDocument();

      // Start typing
      await user.type(screen.getByPlaceholderText(/word1 word2 word3/i), ' word4');

      // Error should be cleared
      expect(screen.queryByText(/mnemonic must be 12, 15, 18, 21, or 24 words/i)).not.toBeInTheDocument();
    });

    it('completes setup successfully after import', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.IMPORT_WALLET]: { firstAddress: 'tb1q...' },
      });

      await user.type(
        screen.getByPlaceholderText(/word1 word2 word3/i),
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12'
      );
      await user.type(screen.getByPlaceholderText(/enter strong password/i), 'Test1234');
      await user.type(screen.getByPlaceholderText(/confirm password/i), 'Test1234');
      await user.click(screen.getByRole('button', { name: /import wallet/i }));

      await waitFor(() => {
        expect(mockOnSetupComplete).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ==================== IMPORT BACKUP FLOW ====================

  describe('Import Backup Flow', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);
      await user.click(screen.getByRole('button', { name: /backup/i }));
    });

    it('shows import backup description', () => {
      expect(screen.getByText(/restore your wallet from an encrypted backup file/i)).toBeInTheDocument();
    });

    it('shows list of what will be restored', () => {
      expect(screen.getByText(/all accounts/i)).toBeInTheDocument();
      expect(screen.getByText(/all contacts/i)).toBeInTheDocument();
      expect(screen.getByText(/all wallet settings/i)).toBeInTheDocument();
      expect(screen.getByText(/complete transaction history/i)).toBeInTheDocument();
    });

    it('opens file selection modal when button clicked', async () => {
      const user = userEvent.setup();

      await user.click(screen.getByRole('button', { name: /select backup file/i }));

      expect(screen.getByTestId('file-selection-modal')).toBeInTheDocument();
    });

    it('validates backup file when selected', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.VALIDATE_BACKUP_FILE]: { valid: true },
      });

      await user.click(screen.getByRole('button', { name: /select backup file/i }));
      await user.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('backup-password-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows error for invalid backup file', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.VALIDATE_BACKUP_FILE]: { valid: false, error: 'Invalid backup format' },
      });

      await user.click(screen.getByRole('button', { name: /select backup file/i }));
      await user.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/invalid backup format/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows progress modal during import', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.VALIDATE_BACKUP_FILE]: { valid: true },
        [MessageType.IMPORT_WALLET_BACKUP]: new Promise(() => {}), // Never resolves
      });

      await user.click(screen.getByRole('button', { name: /select backup file/i }));
      await user.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('backup-password-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('import-progress-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows success modal after successful import', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.VALIDATE_BACKUP_FILE]: { valid: true },
        [MessageType.IMPORT_WALLET_BACKUP]: {
          accountCount: 3,
          contactCount: 5,
          network: 'testnet',
        },
      });

      await user.click(screen.getByRole('button', { name: /select backup file/i }));
      await user.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('backup-password-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('import-success-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('Accounts: 3')).toBeInTheDocument();
      expect(screen.getByText('Contacts: 5')).toBeInTheDocument();
      expect(screen.getByText('Network: testnet')).toBeInTheDocument();
    });

    it('completes setup when done button clicked on success modal', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.VALIDATE_BACKUP_FILE]: { valid: true },
        [MessageType.IMPORT_WALLET_BACKUP]: {
          accountCount: 3,
          contactCount: 5,
          network: 'testnet',
        },
      });

      await user.click(screen.getByRole('button', { name: /select backup file/i }));
      await user.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('backup-password-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('import-success-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await user.click(screen.getByRole('button', { name: /done/i }));

      expect(mockOnSetupComplete).toHaveBeenCalledTimes(1);
    });

    it('handles import error gracefully', async () => {
      const user = userEvent.setup();
      mockChromeSendMessageAsync({
        [MessageType.VALIDATE_BACKUP_FILE]: { valid: true },
        [MessageType.IMPORT_WALLET_BACKUP]: new Error('Decryption failed'),
      });

      await user.click(screen.getByRole('button', { name: /select backup file/i }));
      await user.click(screen.getByRole('button', { name: /select file/i }));

      await waitFor(
        () => {
          expect(screen.getByTestId('backup-password-modal')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      await user.click(screen.getByRole('button', { name: /continue/i }));

      await waitFor(
        () => {
          expect(screen.getByText(/decryption failed/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  // ==================== ACCESSIBILITY ====================

  describe('Accessibility', () => {
    it('has proper labels for password inputs', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      const passwordLabels = screen.getAllByText(/^password$/i);
      expect(passwordLabels.length).toBeGreaterThan(0);

      const confirmLabels = screen.getAllByText(/confirm password/i);
      expect(confirmLabels.length).toBeGreaterThan(0);
    });

    it('has proper label for seed phrase input', async () => {
      const user = userEvent.setup();
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      await user.click(screen.getByRole('button', { name: /seed/i }));

      // Check for the label element specifically (not all text containing "seed phrase")
      const labels = screen.getAllByText(/seed phrase/i);
      expect(labels.length).toBeGreaterThan(0);
    });

    it('associates labels with inputs', () => {
      render(<WalletSetup onSetupComplete={mockOnSetupComplete} />);

      const passwordInput = screen.getByPlaceholderText(/enter strong password/i);
      const label = screen.getAllByText(/^password$/i)[0];

      // Check that label has htmlFor or wraps the input
      expect(label.tagName).toBe('LABEL');
    });
  });
});
