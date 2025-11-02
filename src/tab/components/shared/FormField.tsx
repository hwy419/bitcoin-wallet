/**
 * FormField - Standardized form field wrapper
 *
 * Provides consistent styling and structure for form inputs with labels,
 * error messages, helper text, and required indicators.
 *
 * Features:
 * - Consistent label styling
 * - Error message display with icon
 * - Helper text display
 * - Required indicator (*)
 * - Accessible labels (htmlFor linking)
 *
 * Props:
 * - label: Field label text
 * - id: Input element ID (for label linking)
 * - error: Error message (if validation failed)
 * - helperText: Helper/hint text shown below input
 * - required: Show required indicator (default: false)
 * - children: Input element (textarea, select, etc.)
 *
 * Usage:
 * <FormField
 *   label="Account Name"
 *   id="account-name"
 *   error={errors.name}
 *   helperText="Enter a name to identify this account"
 *   required
 * >
 *   <input id="account-name" ... />
 * </FormField>
 */

import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  error,
  helperText,
  required = false,
  children,
}) => {
  return (
    <div className="flex flex-col gap-2">
      {/* Label */}
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-300 flex items-center gap-1"
      >
        <span>{label}</span>
        {required && <span className="text-bitcoin">*</span>}
      </label>

      {/* Input (passed as children) */}
      {children}

      {/* Error Message */}
      {error && (
        <div
          className="flex items-center gap-2 text-xs text-red-400"
          id={`${id}-error`}
          role="alert"
        >
          <svg
            className="w-4 h-4 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="text-xs text-gray-400" id={`${id}-helper`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default FormField;
