/**
 * ImportPrivateKey Component Test Suite
 *
 * COMPREHENSIVE TESTS for Private Key Import during Wallet Setup:
 * - Component rendering and UI state
 * - WIF input validation (paste)
 * - Password validation and strength
 * - Privacy warnings and acknowledgment
 * - Form submission and error handling
 *
 * Priority: P0 - CRITICAL for wallet setup security
 *
 * NOTE: Some tests are simplified due to async dynamic import of bitcoinjs-lib
 * File upload tests are limited due to complex File API mocking requirements
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ImportPrivateKey from '../ImportPrivateKey';
import { MessageType } from '../../../../shared/types';

// Mock bitcoinjs-lib
jest.mock('bitcoinjs-lib', () => {
  const mockKeyPair = (wif: string, compressed: boolean) => ({
    compressed,
    publicKey: Buffer.from('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798', 'hex'),
  });

  return {
    ECPair: {
      fromWIF: jest.fn((wif: string, network: any) => {
        // Valid compressed testnet WIF
        if (wif === 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm') {
          return mockKeyPair(wif, true);
        }
        // Valid uncompressed testnet WIF (51 chars)
        if (wif.startsWith('92') && wif.length === 51) {
          return mockKeyPair(wif, false);
        }
        // Mainnet WIF
        if (wif.startsWith('L') || wif.startsWith('K')) {
          return mockKeyPair(wif, true);
        }
        // Invalid WIF
        throw new Error('Invalid WIF');
      }),
    },
    networks: {
      testnet: { name: 'testnet' },
    },
    payments: {
      p2pkh: jest.fn(() => ({ address: 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk' })),
      p2sh: jest.fn(() => ({ address: '2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF' })),
      p2wpkh: jest.fn(() => ({ address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx' })),
    },
  };
});

// Mock useBackgroundMessaging hook
const mockSendMessage = jest.fn();
jest.mock('../../../hooks/useBackgroundMessaging', () => ({
  useBackgroundMessaging: () => ({
    sendMessage: mockSendMessage,
  }),
}));

describe('ImportPrivateKey Component', () => {
  const mockOnSetupComplete = jest.fn();
  const VALID_WIF = 'cNJFgo1driFnPcBdBX8BrJrpxchBWXwXCvNH5SoSkdcF6JXXwHMm';
  const VALID_PASSWORD = 'StrongPass123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendMessage.mockReset();
  });

  describe('Initial Rendering', () => {
    it('renders with all initial elements', () => {
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      expect(screen.getByText(/Import a wallet from a WIF private key backup/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Upload File/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Paste WIF/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Import Wallet/i })).toBeInTheDocument();
    });

    it('renders with paste input method selected by default', () => {
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const pasteButton = screen.getByRole('button', { name: /Paste WIF/i });
      expect(pasteButton).toHaveClass('bg-bitcoin');
      expect(screen.getByPlaceholderText(/paste your WIF key here/i)).toBeInTheDocument();
    });

    it('import button is disabled initially', () => {
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const importButton = screen.getByRole('button', { name: /Import Wallet/i });
      expect(importButton).toBeDisabled();
    });

    it('address type selection is not visible initially', () => {
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      expect(screen.queryByText('Address Type')).not.toBeInTheDocument();
    });
  });

  describe('Input Method Selection', () => {
    it('switches to file upload method when clicking Upload File', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const uploadButton = screen.getByRole('button', { name: /Upload File/i });
      await user.click(uploadButton);

      expect(uploadButton).toHaveClass('bg-bitcoin');
      expect(screen.getByText(/Upload Private Key File/i)).toBeInTheDocument();
    });

    it('switches back to paste method when clicking Paste WIF', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      // Switch to file upload
      await user.click(screen.getByRole('button', { name: /Upload File/i }));

      // Switch back to paste
      await user.click(screen.getByRole('button', { name: /Paste WIF/i }));

      const pasteButton = screen.getByRole('button', { name: /Paste WIF/i });
      expect(pasteButton).toHaveClass('bg-bitcoin');
      expect(screen.getByPlaceholderText(/paste your WIF key here/i)).toBeInTheDocument();
    });
  });

  describe('WIF Paste Input Validation', () => {
    it('validates a valid compressed testnet WIF on blur', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Valid WIF detected/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      expect(screen.getByText(/Compressed/i)).toBeInTheDocument();
    });

    it('shows error for invalid WIF format', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, 'invalid_wif_string');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Invalid WIF format/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('shows error for mainnet WIF (testnet expected)', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, 'L5oLkpV3aqBjhki6LmvChTCV6odsp4SXM6FfU2Gppt5kFLaHLuZ9');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Invalid WIF format/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('handles empty WIF validation', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.click(textarea);
      await user.tab(); // Blur without typing

      // Should not show error for empty field
      expect(screen.queryByText(/Invalid WIF format/i)).not.toBeInTheDocument();
    });
  });

  describe('Address Type Selection', () => {
    it('shows address type selection after valid WIF', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Address Type')).toBeInTheDocument();
      }, { timeout: 5000 });

      // Should show all 3 types for compressed key
      expect(screen.getByText('Legacy')).toBeInTheDocument();
      expect(screen.getByText('SegWit')).toBeInTheDocument();
      expect(screen.getByText('Native SegWit')).toBeInTheDocument();
    });

    it('shows Recommended badge for Native SegWit', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Recommended')).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Password Fields', () => {
    async function setupWithValidWIF(user: ReturnType<typeof userEvent.setup>) {
      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByLabelText(/New Wallet Password/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    }

    it('shows password fields after address type selection', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      expect(screen.getByLabelText(/New Wallet Password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Wallet Password/i)).toBeInTheDocument();
    });

    it('validates password too short', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      await user.type(passwordInput, 'Short1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('validates password missing uppercase', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      await user.type(passwordInput, 'lowercase123');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one uppercase letter/i)).toBeInTheDocument();
      });
    });

    it('validates password missing number', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      await user.type(passwordInput, 'NoNumbersHere');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must contain at least one number/i)).toBeInTheDocument();
      });
    });

    it('shows password strength meter', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      await user.type(passwordInput, 'WeakPass1');

      await waitFor(() => {
        expect(screen.getByText('Weak')).toBeInTheDocument();
      });
    });

    it('shows strong password strength', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      await user.type(passwordInput, 'VeryStr0ng!Pass123');

      await waitFor(() => {
        expect(screen.getByText(/Strong/i)).toBeInTheDocument();
      });
    });

    it('validates password mismatch', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      const confirmInput = screen.getByLabelText(/Confirm Wallet Password/i);

      await user.type(passwordInput, VALID_PASSWORD);
      await user.type(confirmInput, 'DifferentPass123');

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('shows passwords match indicator', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupWithValidWIF(user);

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      const confirmInput = screen.getByLabelText(/Confirm Wallet Password/i);

      await user.type(passwordInput, VALID_PASSWORD);
      await user.type(confirmInput, VALID_PASSWORD);

      await waitFor(() => {
        expect(screen.getByText(/✓ Passwords match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Privacy Warnings', () => {
    async function setupToPrivacyWarning(user: ReturnType<typeof userEvent.setup>) {
      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Privacy Warning/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    }

    it('shows privacy acknowledgment checkbox', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupToPrivacyWarning(user);

      expect(screen.getByText(/I understand the privacy implications/i)).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('enables import button after full form completion', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupToPrivacyWarning(user);

      // Fill password
      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      const confirmInput = screen.getByLabelText(/Confirm Wallet Password/i);
      await user.type(passwordInput, VALID_PASSWORD);
      await user.type(confirmInput, VALID_PASSWORD);

      // Import button should still be disabled without privacy acknowledgment
      let importButton = screen.getByRole('button', { name: /Import Wallet/i });
      expect(importButton).toBeDisabled();

      // Check privacy acknowledgment
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);

      // Import button should now be enabled
      importButton = screen.getByRole('button', { name: /Import Wallet/i });
      expect(importButton).toBeEnabled();
    });
  });

  describe('Form Submission', () => {
    async function setupCompleteForm(user: ReturnType<typeof userEvent.setup>) {
      // Valid WIF
      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByLabelText(/New Wallet Password/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      // Valid password
      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      const confirmInput = screen.getByLabelText(/Confirm Wallet Password/i);
      await user.type(passwordInput, VALID_PASSWORD);
      await user.type(confirmInput, VALID_PASSWORD);

      // Privacy acknowledgment
      const checkbox = screen.getByRole('checkbox');
      await user.click(checkbox);
    }

    it('submits valid form successfully', async () => {
      const user = userEvent.setup();
      mockSendMessage.mockResolvedValue({
        account: {},
        firstAddress: 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk'
      });

      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupCompleteForm(user);

      const importButton = screen.getByRole('button', { name: /Import Wallet/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
          expect.objectContaining({
            wif: VALID_WIF,
            addressType: 'native-segwit',
            password: VALID_PASSWORD,
            accountName: 'Imported Account',
          })
        );
        expect(mockOnSetupComplete).toHaveBeenCalled();
      }, { timeout: 5000 });
    });

    it('handles import error gracefully', async () => {
      const user = userEvent.setup();
      mockSendMessage.mockRejectedValue(new Error('Import failed: Invalid key'));

      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupCompleteForm(user);

      const importButton = screen.getByRole('button', { name: /Import Wallet/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/Import failed: Invalid key/i)).toBeInTheDocument();
      }, { timeout: 5000 });
    });

    it('uses custom account name when provided', async () => {
      const user = userEvent.setup();
      mockSendMessage.mockResolvedValue({
        account: {},
        firstAddress: 'mxVFsFW5N4mu1HPkxPttorvocvzeZ7KZyk'
      });

      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      await setupCompleteForm(user);

      // Change account name
      const accountNameInput = screen.getByLabelText(/Account Name/i);
      await user.clear(accountNameInput);
      await user.type(accountNameInput, 'My Custom Account');

      const importButton = screen.getByRole('button', { name: /Import Wallet/i });
      await user.click(importButton);

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith(
          MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
          expect.objectContaining({
            accountName: 'My Custom Account',
          })
        );
      }, { timeout: 5000 });
    });
  });

  describe('Edge Cases', () => {
    it('prevents submission without valid WIF', () => {
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      const importButton = screen.getByRole('button', { name: /Import Wallet/i });
      expect(importButton).toBeDisabled();
    });

    it('clears password error on input change', async () => {
      const user = userEvent.setup();
      render(<ImportPrivateKey onSetupComplete={mockOnSetupComplete} />);

      // Setup valid WIF
      const textarea = screen.getByPlaceholderText(/paste your WIF key here/i);
      await user.type(textarea, VALID_WIF);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByLabelText(/New Wallet Password/i)).toBeInTheDocument();
      }, { timeout: 5000 });

      const passwordInput = screen.getByLabelText(/New Wallet Password/i);
      await user.type(passwordInput, 'Short1');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
      });

      // Type more to fix password
      await user.type(passwordInput, '23456789Abc');

      expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
  });
});
