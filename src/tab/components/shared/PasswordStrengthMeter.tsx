/**
 * PasswordStrengthMeter - Visual password strength indicator
 *
 * Shows a color-coded progress bar and text label indicating password strength.
 * Calculates strength based on length, character diversity, and complexity.
 *
 * Features:
 * - Real-time strength calculation
 * - Color-coded visual feedback (weak/fair/good/strong)
 * - Percentage-based or label-based display
 * - Smooth transitions
 *
 * Props:
 * - password: Password string to evaluate
 * - minLength: Minimum required password length (default: 12)
 * - className: Optional className for container
 */

import React, { useMemo } from 'react';

export interface PasswordStrength {
  score: number; // 0-100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  requirements: {
    minLength: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

interface PasswordStrengthMeterProps {
  password: string;
  minLength?: number;
  className?: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  minLength = 12,
  className = '',
}) => {
  const strength = useMemo(() => calculateStrength(password, minLength), [password, minLength]);

  if (!password) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-400">Password Strength:</span>
        <span className={`text-xs font-semibold ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${strength.color.replace('text-', 'bg-')}`}
          style={{ width: `${strength.score}%` }}
        />
      </div>
    </div>
  );
};

export const calculateStrength = (password: string, minLength: number): PasswordStrength => {
  const requirements = {
    minLength: password.length >= minLength,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Calculate score (0-100)
  let score = 0;

  // Length contributes up to 40 points
  if (password.length >= minLength) {
    score += 20;
  }
  if (password.length >= minLength + 4) {
    score += 10;
  }
  if (password.length >= minLength + 8) {
    score += 10;
  }

  // Character diversity (15 points each)
  if (requirements.hasUpper) score += 15;
  if (requirements.hasLower) score += 15;
  if (requirements.hasNumber) score += 15;
  if (requirements.hasSpecial) score += 15;

  // Ensure score doesn't exceed 100
  score = Math.min(100, score);

  // Determine label and color based on score
  let label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  let color: string;

  if (score <= 40) {
    label = 'Weak';
    color = 'text-red-500';
  } else if (score <= 60) {
    label = 'Fair';
    color = 'text-yellow-500';
  } else if (score <= 80) {
    label = 'Good';
    color = 'text-blue-500';
  } else {
    label = 'Strong';
    color = 'text-green-500';
  }

  return {
    score,
    label,
    color,
    requirements,
  };
};

export default PasswordStrengthMeter;
