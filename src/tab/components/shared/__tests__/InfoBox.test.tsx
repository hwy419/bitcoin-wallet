/**
 * InfoBox Component Test Suite
 *
 * Tests for informational message box component:
 * - Variant rendering (success, warning, info)
 * - Title and content display
 * - Dismissible functionality
 * - onDismiss callback
 * - Accessibility (ARIA attributes, role)
 *
 * Priority: P1
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InfoBox } from '../InfoBox';

describe('InfoBox Component', () => {
  it('renders with title and content', () => {
    render(
      <InfoBox variant="info" title="Test Title">
        Test content
      </InfoBox>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders without title when not provided', () => {
    render(<InfoBox variant="info">Test content</InfoBox>);

    expect(screen.getByText('Test content')).toBeInTheDocument();
    // Should not render h3 when no title
    expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
  });

  it('renders success variant with correct styling and icon', () => {
    render(
      <InfoBox variant="success" title="Success">
        Success content
      </InfoBox>
    );

    const container = screen.getByRole('alert');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('bg-green-500/10');
    expect(container).toHaveClass('border-green-500/20');

    // Check for success icon
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('renders warning variant with correct styling and icon', () => {
    render(
      <InfoBox variant="warning" title="Warning">
        Warning content
      </InfoBox>
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('bg-amber-500/10');
    expect(container).toHaveClass('border-amber-500/20');

    // Check for warning icon
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('renders info variant with correct styling and icon', () => {
    render(
      <InfoBox variant="info" title="Info">
        Info content
      </InfoBox>
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('bg-blue-500/10');
    expect(container).toHaveClass('border-blue-500/20');

    // Check for info icon
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
  });

  it('does not show dismiss button when not dismissible', () => {
    render(
      <InfoBox variant="info" dismissible={false}>
        Test content
      </InfoBox>
    );

    expect(screen.queryByRole('button', { name: 'Dismiss' })).not.toBeInTheDocument();
  });

  it('shows dismiss button when dismissible', () => {
    render(
      <InfoBox variant="info" dismissible>
        Test content
      </InfoBox>
    );

    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument();
  });

  it('calls onDismiss when X button clicked', async () => {
    const user = userEvent.setup();
    const handleDismiss = jest.fn();

    render(
      <InfoBox variant="info" dismissible onDismiss={handleDismiss}>
        Test content
      </InfoBox>
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(dismissButton);

    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it('hides component after dismissal', async () => {
    const user = userEvent.setup();

    render(
      <InfoBox variant="info" dismissible>
        Test content
      </InfoBox>
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(dismissButton);

    // InfoBox should be removed from DOM
    expect(screen.queryByText('Test content')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <InfoBox variant="info" className="custom-class">
        Test content
      </InfoBox>
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveClass('custom-class');
    // Should also retain base styling
    expect(container).toHaveClass('bg-blue-500/10');
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(
      <InfoBox variant="warning" title="Warning">
        Test content
      </InfoBox>
    );

    const container = screen.getByRole('alert');
    expect(container).toHaveAttribute('aria-live', 'polite');
  });

  it('renders complex children correctly', () => {
    render(
      <InfoBox variant="info">
        <div>
          <p data-testid="paragraph">Complex content</p>
          <button data-testid="action-button">Action</button>
        </div>
      </InfoBox>
    );

    expect(screen.getByTestId('paragraph')).toBeInTheDocument();
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
  });

  it('dismiss button is keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleDismiss = jest.fn();

    render(
      <InfoBox variant="info" dismissible onDismiss={handleDismiss}>
        Test content
      </InfoBox>
    );

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });

    // Tab to button
    await user.tab();
    expect(dismissButton).toHaveFocus();

    // Press Enter to dismiss
    await user.keyboard('{Enter}');
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });
});
