/**
 * ContactLockedOverlay - Overlay displayed when wallet is locked
 *
 * Shows when user tries to access encrypted contacts while wallet is locked.
 * Explains why contacts cannot be viewed and provides an unlock action.
 *
 * Features:
 * - Lock icon with clear messaging
 * - List of encrypted fields
 * - Call-to-action unlock button
 * - Accessible and informative
 *
 * @see prompts/docs/plans/CONTACTS_V2_UI_UX_DESIGN.md
 */

import React from 'react';

export interface ContactLockedOverlayProps {
  onUnlock: () => void; // Callback to navigate to unlock screen
}

/**
 * ContactLockedOverlay Component
 *
 * Renders a full-screen overlay explaining that contacts are encrypted
 *
 * @example
 * if (walletLocked) {
 *   return <ContactLockedOverlay onUnlock={() => navigate('/unlock')} />;
 * }
 */
export const ContactLockedOverlay: React.FC<ContactLockedOverlayProps> = ({ onUnlock }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] px-6 py-12 text-center bg-gray-50">
      {/* Lock Icon */}
      <div className="text-6xl mb-6">🔒</div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contacts are Encrypted</h2>

      {/* Description */}
      <p className="text-gray-600 mb-6 max-w-md">
        Your contacts contain sensitive information that is encrypted with your wallet password.
      </p>

      {/* Encrypted Fields List */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-8 max-w-md">
        <p className="text-sm font-medium text-gray-700 mb-2">Unlock your wallet to view:</p>
        <ul className="text-sm text-gray-600 text-left space-y-1">
          <li>• Contact names</li>
          <li>• Email addresses</li>
          <li>• Extended public keys (xpubs)</li>
          <li>• Notes and categories</li>
          <li>• Custom colors</li>
        </ul>
      </div>

      {/* Unlock Button */}
      <button
        onClick={onUnlock}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Unlock Wallet
      </button>
    </div>
  );
};
