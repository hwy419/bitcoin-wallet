/**
 * PasswordRequirementsChecklist - Real-time password requirements validation
 *
 * Displays a checklist of password requirements with live validation feedback.
 * Shows checkmarks for met requirements and X marks for unmet ones.
 *
 * Features:
 * - Real-time validation
 * - Visual feedback (green checkmarks, gray X marks)
 * - Configurable requirements
 * - Accessible markup
 *
 * Props:
 * - password: Password string to validate
 * - requirements: Configuration for what to require
 * - className: Optional className for container
 */

import React from 'react';

export interface PasswordRequirementsConfig {
  minLength: number;
  requireUpper: boolean;
  requireLower: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

interface PasswordRequirementsChecklistProps {
  password: string;
  requirements: PasswordRequirementsConfig;
  className?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export const PasswordRequirementsChecklist: React.FC<PasswordRequirementsChecklistProps> = ({
  password,
  requirements,
  className = '',
}) => {
  const checks: Requirement[] = [
    {
      label: `At least ${requirements.minLength} characters`,
      met: password.length >= requirements.minLength,
    },
  ];

  if (requirements.requireUpper) {
    checks.push({
      label: 'Contains uppercase letters (A-Z)',
      met: /[A-Z]/.test(password),
    });
  }

  if (requirements.requireLower) {
    checks.push({
      label: 'Contains lowercase letters (a-z)',
      met: /[a-z]/.test(password),
    });
  }

  if (requirements.requireNumber) {
    checks.push({
      label: 'Contains numbers (0-9)',
      met: /[0-9]/.test(password),
    });
  }

  if (requirements.requireSpecial) {
    checks.push({
      label: 'Contains special characters (!@#$%^&*)',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    });
  }

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-400 mb-2">Requirements:</p>
      <ul role="list" aria-label="Password requirements" className="space-y-1">
        {checks.map((check, index) => (
          <li
            key={index}
            className="flex items-center space-x-2"
            aria-label={check.met ? 'Requirement met' : 'Requirement not met'}
          >
            <span className={check.met ? 'text-green-400' : 'text-gray-600'}>
              {check.met ? '✓' : '✗'}
            </span>
            <span className="text-xs text-gray-300">{check.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordRequirementsChecklist;
