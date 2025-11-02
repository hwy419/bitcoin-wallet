/**
 * ContactAvatar - Colored circle avatar with contact initials
 *
 * Displays a colored circle with 1-2 character initials extracted from contact name.
 * Supports 16 predefined colors for visual customization and quick recognition.
 *
 * Features:
 * - 16 WCAG AA compliant colors
 * - Automatic initials extraction (first letter of first 2 words, or first 2 letters)
 * - 4 size variants: sm (32px), md (40px), lg (48px), xl (80px)
 * - Accessible with aria-label
 *
 * @see prompts/docs/plans/CONTACTS_V2_UI_UX_DESIGN.md
 */

import React from 'react';
import type { ContactColor } from '../../../shared/types';

// Tailwind classes for 16-color palette (WCAG AA compliant)
const CONTACT_COLORS: Record<ContactColor, string> = {
  blue: 'bg-blue-500 text-white',
  purple: 'bg-purple-600 text-white',
  pink: 'bg-pink-500 text-white',
  red: 'bg-red-500 text-white',
  orange: 'bg-orange-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  green: 'bg-green-500 text-white',
  teal: 'bg-teal-500 text-white',
  cyan: 'bg-cyan-500 text-white',
  indigo: 'bg-indigo-500 text-white',
  violet: 'bg-violet-500 text-white',
  magenta: 'bg-fuchsia-500 text-white',
  amber: 'bg-amber-500 text-white',
  lime: 'bg-lime-500 text-white',
  emerald: 'bg-emerald-500 text-white',
  sky: 'bg-sky-500 text-white',
};

// Size mapping (width/height + font size)
const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-20 h-20 text-2xl',
};

export interface ContactAvatarProps {
  name: string;
  color?: ContactColor;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Extract initials from contact name
 *
 * Rules:
 * - 2+ words: First letter of first word + first letter of second word
 * - 1 word: First 2 letters
 * - Empty/invalid: "?"
 * - Handles Unicode characters (e.g., Chinese, Arabic)
 *
 * @param name - Contact name
 * @returns 1-2 uppercase initials
 *
 * @example
 * getInitials("Alice Cooper") // "AC"
 * getInitials("Satoshi") // "SA"
 * getInitials("山田太郎") // "山田"
 * getInitials("") // "?"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) {
    return '?';
  }

  // Remove non-letter characters except spaces, keep Unicode letters
  const cleaned = name.trim().replace(/[^\p{L}\s]/gu, '');
  const words = cleaned.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    // No valid letters found, use first character of original
    return name.charAt(0).toUpperCase();
  }

  if (words.length === 1) {
    // Single word: take first 2 letters
    return words[0].substring(0, 2).toUpperCase();
  }

  // Multiple words: take first letter of first 2 words
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}

/**
 * ContactAvatar Component
 *
 * Renders a colored circle with contact initials
 *
 * @example
 * <ContactAvatar name="Alice Cooper" color="purple" size="lg" />
 * <ContactAvatar name="Satoshi Nakamoto" color="blue" size="md" />
 */
export const ContactAvatar: React.FC<ContactAvatarProps> = ({
  name,
  color = 'blue',
  size = 'md',
  className = '',
}) => {
  const initials = getInitials(name);
  const colorClass = CONTACT_COLORS[color];
  const sizeClass = SIZE_CLASSES[size];

  return (
    <div
      className={`${colorClass} ${sizeClass} rounded-full flex items-center justify-center font-semibold ${className}`}
      aria-label={`Avatar for ${name}`}
      role="img"
    >
      {initials}
    </div>
  );
};
