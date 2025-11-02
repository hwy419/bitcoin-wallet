/**
 * PrivacyBadge Component Test Suite
 *
 * Tests for privacy status badge component:
 * - Variant rendering (success, warning, info)
 * - Styling and colors
 * - Accessibility (ARIA labels, role)
 * - Custom className support
 *
 * Priority: P1
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrivacyBadge } from '../PrivacyBadge';

describe('PrivacyBadge Component', () => {
  it('renders success variant with correct styling', () => {
    render(<PrivacyBadge variant="success">✓ Fresh</PrivacyBadge>);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('✓ Fresh');

    // Check for success styling classes
    expect(badge).toHaveClass('bg-green-500/10');
    expect(badge).toHaveClass('text-green-400');
    expect(badge).toHaveClass('border-green-500/20');
  });

  it('renders warning variant with correct styling', () => {
    render(<PrivacyBadge variant="warning">⚠️ Previously used</PrivacyBadge>);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('⚠️ Previously used');

    // Check for warning styling classes
    expect(badge).toHaveClass('bg-amber-500/10');
    expect(badge).toHaveClass('text-amber-400');
    expect(badge).toHaveClass('border-amber-500/20');
  });

  it('renders info variant with correct styling', () => {
    render(<PrivacyBadge variant="info">Address Rotation</PrivacyBadge>);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Address Rotation');

    // Check for info styling classes
    expect(badge).toHaveClass('bg-blue-500/10');
    expect(badge).toHaveClass('text-blue-400');
    expect(badge).toHaveClass('border-blue-500/20');
  });

  it('applies custom className', () => {
    render(
      <PrivacyBadge variant="success" className="custom-class">
        Test
      </PrivacyBadge>
    );

    const badge = screen.getByRole('status');
    expect(badge).toHaveClass('custom-class');
    // Should also retain base styling
    expect(badge).toHaveClass('bg-green-500/10');
  });

  it('renders with ARIA label when provided', () => {
    render(
      <PrivacyBadge variant="success" ariaLabel="Privacy status indicator">
        ✓ Fresh
      </PrivacyBadge>
    );

    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Privacy status indicator');
  });

  it('renders without ARIA label when not provided', () => {
    render(<PrivacyBadge variant="success">✓ Fresh</PrivacyBadge>);

    const badge = screen.getByRole('status');
    expect(badge).not.toHaveAttribute('aria-label');
  });

  it('is accessible with role="status"', () => {
    render(<PrivacyBadge variant="success">Test</PrivacyBadge>);

    const badge = screen.getByRole('status');
    expect(badge).toBeInTheDocument();
  });

  it('renders children correctly', () => {
    render(
      <PrivacyBadge variant="success">
        <span data-testid="child-element">Complex child</span>
      </PrivacyBadge>
    );

    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Complex child')).toBeInTheDocument();
  });
});
