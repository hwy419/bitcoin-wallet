/**
 * CosignerCard - Horizontal card for displaying multisig cosigner information
 *
 * Features:
 * - Auto-matches to contacts by xpub/fingerprint for avatar personalization
 * - Expandable to show full xpub details
 * - Quick actions: Copy xpub, Copy fingerprint, Link to contact, QR code
 * - Visual indicator for "You" (isSelf)
 * - Optimized for horizontal scrolling layout (~240px width)
 */

import React, { useState } from 'react';
import type { Cosigner, Contact } from '../../../shared/types';
import { ContactAvatar } from './ContactAvatar';
import { getCosignerDisplayInfo } from '../../utils/cosignerContactMatcher';

export interface CosignerCardProps {
  cosigner: Cosigner;
  contacts: Contact[];
  onLinkContact?: (cosigner: Cosigner) => void;
  onShowQRCode?: (cosigner: Cosigner) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Format fingerprint with space separator for readability
 * Example: "a4b3c2d1" -> "a4b3 c2d1"
 */
function formatFingerprint(fingerprint: string): string {
  if (fingerprint.length !== 8) return fingerprint;
  return `${fingerprint.slice(0, 4)} ${fingerprint.slice(4)}`;
}

/**
 * Truncate xpub for compact display
 * Example: "tpubD6NzVbkrY...xyz123" -> "tpubD6N...xyz123"
 */
function truncateXpub(xpub: string, prefixLen = 7, suffixLen = 6): string {
  if (xpub.length <= prefixLen + suffixLen + 3) return xpub;
  return `${xpub.slice(0, prefixLen)}...${xpub.slice(-suffixLen)}`;
}

/**
 * Copy text to clipboard with fallback
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * CosignerCard Component
 */
export const CosignerCard: React.FC<CosignerCardProps> = ({
  cosigner,
  contacts,
  onLinkContact,
  onShowQRCode,
  className = '',
  style,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const displayInfo = getCosignerDisplayInfo(cosigner, contacts);

  const handleCopy = async (text: string, fieldName: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div
      className={`
        bg-gray-850 border border-purple-500/30 rounded-xl p-4
        hover:bg-gray-800 hover:border-purple-500/50
        transition-all duration-200
        ${className}
      `}
      style={style}
    >
      {/* Header: Avatar + Name + "You" Badge */}
      <div className="flex items-start gap-3 mb-3">
        <ContactAvatar
          name={displayInfo.name}
          color={displayInfo.color}
          size="lg"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white truncate">
              {displayInfo.name}
            </h4>
            {cosigner.isSelf && (
              <span className="px-1.5 py-0.5 bg-bitcoin text-white text-xs font-medium rounded">
                You
              </span>
            )}
          </div>
          {displayInfo.hasContact && (
            <p className="text-xs text-purple-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Linked Contact
            </p>
          )}
        </div>
      </div>

      {/* Fingerprint */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Fingerprint</span>
          <button
            onClick={() => handleCopy(cosigner.fingerprint, 'fingerprint')}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            title="Copy fingerprint"
          >
            {copiedField === 'fingerprint' ? (
              <span className="text-green-400">✓ Copied</span>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <p className="font-mono text-sm text-bitcoin">
          {formatFingerprint(cosigner.fingerprint)}
        </p>
      </div>

      {/* Derivation Path */}
      <div className="mb-3">
        <span className="text-xs text-gray-400 block mb-1">Derivation Path</span>
        <p className="font-mono text-xs text-gray-300">
          {cosigner.derivationPath}
        </p>
      </div>

      {/* Expandable Xpub Section */}
      <div className="mb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left flex items-center justify-between mb-1 hover:text-white transition-colors"
        >
          <span className="text-xs text-gray-400">Extended Public Key</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded ? (
          <div className="flex items-start gap-2">
            <p className="font-mono text-xs text-gray-300 break-all flex-1">
              {cosigner.xpub}
            </p>
            <button
              onClick={() => handleCopy(cosigner.xpub, 'xpub')}
              className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0"
              title="Copy xpub"
            >
              {copiedField === 'xpub' ? (
                <span className="text-green-400 text-xs">✓</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          <p className="font-mono text-xs text-gray-400">
            {truncateXpub(cosigner.xpub)}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-700">
        {/* Copy Xpub Button */}
        <button
          onClick={() => handleCopy(cosigner.xpub, 'xpub-action')}
          className="flex-1 px-2 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1"
          title="Copy extended public key"
        >
          {copiedField === 'xpub-action' ? (
            <>
              <span className="text-green-400">✓</span>
              Copied
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Xpub
            </>
          )}
        </button>

        {/* Link to Contact Button */}
        {onLinkContact && (
          <button
            onClick={() => onLinkContact(cosigner)}
            className="px-2 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 text-xs font-medium rounded transition-colors"
            title={displayInfo.hasContact ? 'Manage contact link' : 'Link to contact'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        )}

        {/* QR Code Button */}
        {onShowQRCode && (
          <button
            onClick={() => onShowQRCode(cosigner)}
            className="px-2 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 text-xs font-medium rounded transition-colors"
            title="Show QR code"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
