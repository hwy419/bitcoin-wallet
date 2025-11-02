/**
 * MultiSelectDropdown Component Tests
 *
 * Tests the reusable multi-select dropdown component with:
 * - Render closed/open states
 * - Display options with subtitles and counts
 * - Select/deselect with checkboxes
 * - Search functionality
 * - "Select all" / "Clear all" buttons
 * - Display selected count
 * - Pills with remove buttons
 * - Max display limit
 * - Empty state
 * - onChange callback
 * - Close on outside click
 * - Close on ESC key
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelectDropdown, MultiSelectOption } from '../MultiSelectDropdown';

describe('MultiSelectDropdown', () => {
  const mockOptions: MultiSelectOption[] = [
    { value: '1', label: 'Alice', subtitle: 'alice@example.com', count: 5 },
    { value: '2', label: 'Bob', subtitle: 'bob@example.com', count: 3 },
    { value: '3', label: 'Charlie', subtitle: 'charlie@example.com', count: 8 },
    { value: '4', label: 'David', subtitle: 'david@example.com', count: 2 },
  ];

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== RENDERING ====================

  describe('Rendering', () => {
    it('renders closed state with placeholder', () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Select Items')).toBeInTheDocument();
      expect(screen.getByText('Choose items...')).toBeInTheDocument();
    });

    it('shows selected count when items are selected', () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={['1', '2']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('displays selected items as pills', () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={['1', '2']}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });

    it('limits displayed pills to maxDisplay', () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={['1', '2', '3', '4']}
          onChange={mockOnChange}
          maxDisplay={2}
        />
      );

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });
  });

  // ==================== TOGGLE OPEN/CLOSE ====================

  describe('Toggle Open/Close', () => {
    it('opens dropdown when button is clicked', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          showSearch={true}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });
    });

    it('closes dropdown on ESC key', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          showSearch={true}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      });

      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== OPTIONS DISPLAY ====================

  describe('Options Display', () => {
    it('displays all options when opened', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getAllByRole('checkbox').length).toBe(mockOptions.length);
      });

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('(5)')).toBeInTheDocument();
    });

    it('shows empty state when no options match search', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          showSearch={true}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const searchInput = await screen.findByPlaceholderText('Search...');
      await userEvent.type(searchInput, 'xyz');

      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });
    });
  });

  // ==================== SEARCH FUNCTIONALITY ====================

  describe('Search Functionality', () => {
    it('filters options by label', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          showSearch={true}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const searchInput = await screen.findByPlaceholderText('Search...');
      await userEvent.type(searchInput, 'ali');

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      });
    });

    it('filters options by subtitle', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
          showSearch={true}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const searchInput = await screen.findByPlaceholderText('Search...');
      await userEvent.type(searchInput, 'bob@');

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument();
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      });
    });
  });

  // ==================== SELECT/DESELECT ====================

  describe('Select/Deselect', () => {
    it('selects option when checkbox is clicked', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const checkboxes = await screen.findAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith(['1']);
    });

    it('deselects option when already selected checkbox is clicked', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={['1']}
          onChange={mockOnChange}
        />
      );

      // Get all buttons, the first one is the dropdown toggle (the pill remove button is second)
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      const checkboxes = await screen.findAllByRole('checkbox');
      await userEvent.click(checkboxes[0]);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });

    it('selects all options when "Select All" is clicked', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      const selectAllButton = await screen.findByText('Select All');
      await userEvent.click(selectAllButton);

      expect(mockOnChange).toHaveBeenCalledWith(['1', '2', '3', '4']);
    });

    it('clears all selections when "Clear All" is clicked', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={['1', '2']}
          onChange={mockOnChange}
        />
      );

      // Get all buttons, the first one is the dropdown toggle
      const buttons = screen.getAllByRole('button');
      await userEvent.click(buttons[0]);

      const clearAllButton = await screen.findByText('Clear All');
      await userEvent.click(clearAllButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  // ==================== PILL REMOVAL ====================

  describe('Pill Removal', () => {
    it('removes item when pill X button is clicked', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={['1', '2']}
          onChange={mockOnChange}
        />
      );

      const removeButton = screen.getByLabelText('Remove Alice');
      await userEvent.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith(['2']);
    });
  });

  // ==================== ACCESSIBILITY ====================

  describe('Accessibility', () => {
    it('has proper aria-expanded attribute', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button', { expanded: false });
      expect(button).toHaveAttribute('aria-expanded', 'false');

      await userEvent.click(button);

      await waitFor(() => {
        const expandedButton = screen.getByRole('button', { expanded: true });
        expect(expandedButton).toHaveAttribute('aria-expanded', 'true');
      });
    });

    it('has proper aria-haspopup attribute', () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={mockOptions}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button', { expanded: false });
      expect(button).toHaveAttribute('aria-haspopup', 'listbox');
    });
  });

  // ==================== EMPTY OPTIONS ====================

  describe('Empty Options', () => {
    it('shows empty state when no options provided', async () => {
      render(
        <MultiSelectDropdown
          label="Select Items"
          placeholder="Choose items..."
          options={[]}
          selected={[]}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('No options found')).toBeInTheDocument();
      });
    });
  });
});
