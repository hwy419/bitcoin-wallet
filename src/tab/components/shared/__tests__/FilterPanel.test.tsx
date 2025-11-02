/**
 * FilterPanel Component Tests
 *
 * Tests the transaction filter panel component with:
 * - Render collapsed/expanded states
 * - Filter controls (address, amount, hash, contact, tag, category)
 * - Active filter badges and pills
 * - Clear individual and all filters
 * - Validation and error states
 * - Loading states
 */

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel, TransactionFilters } from '../FilterPanel';
import { renderWithProviders, mockChromeSendMessageAsync } from '../../__tests__/testUtils';
import { MessageType, Contact } from '../../../../shared/types';

describe('FilterPanel', () => {
  const mockContacts: Contact[] = [
    {
      id: 'contact-1',
      name: 'Alice',
      address: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      category: 'Friend',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'contact-2',
      name: 'Bob',
      address: 'tb1q9l0rk0gkgn73d0gc57smn8atv38wvc7vlhqhj5',
      category: 'Business',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const emptyFilters: TransactionFilters = {
    senderAddress: '',
    amountMin: null,
    amountMax: null,
    transactionHash: '',
    contactIds: [],
    tags: [],
    categories: [],
  };

  const mockOnFiltersChange = jest.fn();
  const mockOnToggleExpanded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock chrome.runtime.sendMessage for all tests
    mockChromeSendMessageAsync({
      [MessageType.GET_ALL_TRANSACTION_TAGS]: { tags: [] },
      [MessageType.GET_ALL_TRANSACTION_CATEGORIES]: { categories: [] },
    });
  });

  // ==================== RENDERING ====================

  describe('Rendering', () => {
    it('renders collapsed state with toggle button', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        const button = screen.queryByText(/Search & Filter/i);
        expect(button).toBeInTheDocument();
      });
    });

    it('renders expanded state with all filter inputs', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sender Address')).toBeInTheDocument();
        expect(screen.getByText('Amount Range (BTC)')).toBeInTheDocument();
        expect(screen.getByText('Transaction Hash')).toBeInTheDocument();
        expect(screen.getByText('Filter by Contact')).toBeInTheDocument();
        expect(screen.getByText('Filter by Tags')).toBeInTheDocument();
        expect(screen.getByText('Filter by Category')).toBeInTheDocument();
      });
    });

    it('shows "Active" badge when filters are applied', async () => {
      const activeFilters: TransactionFilters = {
        ...emptyFilters,
        senderAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      renderWithProviders(
        <FilterPanel
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('does not show "Active" badge when no filters are applied', () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      expect(screen.queryByText('Active')).not.toBeInTheDocument();
    });
  });

  // ==================== TOGGLE EXPAND/COLLAPSE ====================

  describe('Toggle Expand/Collapse', () => {
    it('calls onToggleExpanded when header is clicked', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        const header = screen.getByText(/Search & Filter/i).closest('button');
        expect(header).toBeInTheDocument();
      });

      const header = screen.getByText(/Search & Filter/i).closest('button');
      if (header) {
        await userEvent.click(header);
        expect(mockOnToggleExpanded).toHaveBeenCalledTimes(1);
      }
    });
  });

  // ==================== SENDER ADDRESS FILTER ====================

  describe('Sender Address Filter', () => {
    it('updates sender address filter on input', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Sender Address')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Sender Address') as HTMLInputElement;
      await userEvent.type(input, 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx');

      // Wait for debounce
      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('shows error for invalid Bitcoin address', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Sender Address')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Sender Address') as HTMLInputElement;
      await userEvent.type(input, 'invalid-address');

      await waitFor(() => {
        expect(screen.getByText('Invalid Bitcoin address format')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  // ==================== AMOUNT RANGE FILTER ====================

  describe('Amount Range Filter', () => {
    it('updates minimum amount filter', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Minimum amount')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Minimum amount') as HTMLInputElement;
      await userEvent.type(input, '0.001');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('shows error when min > max', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Minimum amount')).toBeInTheDocument();
      });

      const minInput = screen.getByLabelText('Minimum amount') as HTMLInputElement;
      const maxInput = screen.getByLabelText('Maximum amount') as HTMLInputElement;

      await userEvent.type(minInput, '1.0');
      await userEvent.type(maxInput, '0.5');

      await waitFor(() => {
        expect(screen.getByText('Minimum amount cannot be greater than maximum')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  // ==================== TRANSACTION HASH FILTER ====================

  describe('Transaction Hash Filter', () => {
    it('updates transaction hash filter', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Transaction Hash')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Transaction Hash') as HTMLInputElement;
      await userEvent.type(input, '1a2b3c4d5e6f7890');

      await waitFor(() => {
        expect(mockOnFiltersChange).toHaveBeenCalled();
      }, { timeout: 500 });
    });

    it('shows error for hash less than 8 characters', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText('Transaction Hash')).toBeInTheDocument();
      });

      const input = screen.getByLabelText('Transaction Hash') as HTMLInputElement;
      await userEvent.type(input, '1a2b3c');

      await waitFor(() => {
        expect(screen.getByText('Transaction hash must be at least 8 characters')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  // ==================== CONTACT FILTER ====================

  describe('Contact Filter', () => {
    it('renders contact filter dropdown', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={mockContacts}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Filter by Contact')).toBeInTheDocument();
      });
    });

    it('shows help text for contact filter', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={mockContacts}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Show only transactions involving selected contacts')).toBeInTheDocument();
      });
    });
  });

  // ==================== TAG FILTER ====================

  describe('Tag Filter', () => {
    it('fetches tags when panel expands', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_ALL_TRANSACTION_TAGS]: {
          tags: [
            { tag: 'payment', count: 5 },
            { tag: 'donation', count: 3 },
          ],
        },
        [MessageType.GET_ALL_TRANSACTION_CATEGORIES]: { categories: [] },
      });

      const { rerender } = renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      // Expand panel
      rerender(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Show transactions with any of the selected tags')).toBeInTheDocument();
      });
    });

    it('shows empty state when no tags exist', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No tags found')).toBeInTheDocument();
      });
    });
  });

  // ==================== CATEGORY FILTER ====================

  describe('Category Filter', () => {
    it('fetches categories when panel expands', async () => {
      mockChromeSendMessageAsync({
        [MessageType.GET_ALL_TRANSACTION_TAGS]: { tags: [] },
        [MessageType.GET_ALL_TRANSACTION_CATEGORIES]: {
          categories: [
            { category: 'Shopping', count: 10 },
            { category: 'Services', count: 7 },
          ],
        },
      });

      const { rerender } = renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={false}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      // Expand panel
      rerender(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Show transactions with the selected categories')).toBeInTheDocument();
      });
    });

    it('shows empty state when no categories exist', async () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No categories found')).toBeInTheDocument();
      });
    });
  });

  // ==================== ACTIVE FILTER PILLS ====================

  describe('Active Filter Pills', () => {
    it('displays sender address pill when filter is active', async () => {
      const activeFilters: TransactionFilters = {
        ...emptyFilters,
        senderAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      renderWithProviders(
        <FilterPanel
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Sender:')).toBeInTheDocument();
      });
    });

    it('displays amount range pill when filter is active', async () => {
      const activeFilters: TransactionFilters = {
        ...emptyFilters,
        amountMin: 0.001,
        amountMax: 1.0,
      };

      renderWithProviders(
        <FilterPanel
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Amount:')).toBeInTheDocument();
      });
    });

    it('displays contact count pill when contacts are selected', async () => {
      const activeFilters: TransactionFilters = {
        ...emptyFilters,
        contactIds: ['contact-1', 'contact-2'],
      };

      renderWithProviders(
        <FilterPanel
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={mockContacts}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Active Filters:')).toBeInTheDocument();
      });

      // The pill shows "Contacts:" and "2 selected" as separate spans
      const pillElements = screen.getAllByText(/selected/);
      const hasTwoSelected = pillElements.some(el => el.textContent === '2 selected');
      expect(hasTwoSelected).toBe(true);
    });
  });

  // ==================== RESET ALL FILTERS ====================

  describe('Reset All Filters', () => {
    it('shows "Reset All Filters" button when filters are active', async () => {
      const activeFilters: TransactionFilters = {
        ...emptyFilters,
        senderAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      };

      renderWithProviders(
        <FilterPanel
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
      });
    });

    it('does not show "Reset All Filters" button when no filters are active', () => {
      renderWithProviders(
        <FilterPanel
          filters={emptyFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={[]}
        />
      );

      expect(screen.queryByText('Reset All Filters')).not.toBeInTheDocument();
    });

    it('clears all filters when "Reset All Filters" is clicked', async () => {
      const activeFilters: TransactionFilters = {
        senderAddress: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
        amountMin: 0.001,
        amountMax: 1.0,
        transactionHash: '1a2b3c4d5e6f7890',
        contactIds: ['contact-1'],
        tags: ['payment'],
        categories: ['Shopping'],
      };

      renderWithProviders(
        <FilterPanel
          filters={activeFilters}
          onFiltersChange={mockOnFiltersChange}
          isExpanded={true}
          onToggleExpanded={mockOnToggleExpanded}
          network="testnet"
          contacts={mockContacts}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Reset All Filters')).toBeInTheDocument();
      });

      const resetButton = screen.getByText('Reset All Filters');
      await userEvent.click(resetButton);

      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        senderAddress: '',
        amountMin: null,
        amountMax: null,
        transactionHash: '',
        contactIds: [],
        tags: [],
        categories: [],
      });
    });
  });
});
