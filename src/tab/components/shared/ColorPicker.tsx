/**
 * ColorPicker - 4×4 grid color selector for contact avatars
 *
 * Displays a 16-color palette in a 4×4 grid layout for selecting contact colors.
 * Supports keyboard navigation and accessibility features.
 *
 * Features:
 * - 16 WCAG AA compliant colors
 * - 4×4 grid layout (~184px × 184px)
 * - Visual selection indicator (white ring)
 * - Hover and focus states
 * - Full keyboard navigation (Tab, Enter, Space)
 * - ARIA radiogroup for screen readers
 *
 * @see prompts/docs/plans/CONTACTS_V2_UI_UX_DESIGN.md
 */

import React from 'react';
import type { ContactColor } from '../../../shared/types';

// Color order for 4×4 grid (row by row)
const COLORS: ContactColor[] = [
  'blue',
  'purple',
  'pink',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'cyan',
  'indigo',
  'violet',
  'magenta',
  'amber',
  'lime',
  'emerald',
  'sky',
];

// Background color classes for each color
const COLOR_BG: Record<ContactColor, string> = {
  blue: 'bg-blue-500',
  purple: 'bg-purple-600',
  pink: 'bg-pink-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  magenta: 'bg-fuchsia-500',
  amber: 'bg-amber-500',
  lime: 'bg-lime-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
};

// Human-readable color names
const COLOR_NAMES: Record<ContactColor, string> = {
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  teal: 'Teal',
  cyan: 'Cyan',
  indigo: 'Indigo',
  violet: 'Violet',
  magenta: 'Magenta',
  amber: 'Amber',
  lime: 'Lime',
  emerald: 'Emerald',
  sky: 'Sky',
};

export interface ColorPickerProps {
  selectedColor?: ContactColor;
  onColorSelect: (color: ContactColor) => void;
  className?: string;
}

/**
 * ColorPicker Component
 *
 * Renders a 4×4 grid of color swatches for selection
 *
 * @example
 * const [color, setColor] = useState<ContactColor>('blue');
 * <ColorPicker selectedColor={color} onColorSelect={setColor} />
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor = 'blue',
  onColorSelect,
  className = '',
}) => {
  return (
    <div
      className={`grid grid-cols-4 gap-2 ${className}`}
      role="radiogroup"
      aria-label="Contact color selection"
    >
      {COLORS.map((color) => {
        const isSelected = color === selectedColor;
        const colorBg = COLOR_BG[color];
        const colorName = COLOR_NAMES[color];

        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Select ${colorName} color`}
            onClick={() => onColorSelect(color)}
            className={`
              w-10 h-10 rounded-full flex items-center justify-center
              transition-all duration-150 ease-in-out
              hover:scale-110 hover:shadow-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isSelected ? 'ring-3 ring-white ring-offset-2 ring-offset-gray-200' : ''}
            `}
          >
            <div className={`w-8 h-8 rounded-full ${colorBg}`} />
          </button>
        );
      })}
    </div>
  );
};
