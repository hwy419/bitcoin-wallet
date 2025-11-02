/**
 * ExportSuccessModal - Success confirmation with backup details
 *
 * Step 5 in export flow. Shows success message with backup file details
 * and security reminders.
 *
 * Features:
 * - Success animation
 * - Backup file details (name, size, checksum)
 * - Copy checksum functionality
 * - Security reminders
 */

import React, { useState } from 'react';
import Modal from '../../shared/Modal';

interface BackupDetails {
  filename: string;
  size: string; // e.g., "24.3 KB"
  checksum: string; // SHA-256 hash
  created: string; // Formatted date string
}

interface ExportSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  backupDetails: BackupDetails;
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
  isOpen,
  onClose,
  backupDetails,
}) => {
  const [checksumCopied, setChecksumCopied] = useState(false);

  const handleCopyChecksum = async () => {
    try {
      await navigator.clipboard.writeText(backupDetails.checksum);
      setChecksumCopied(true);
      setTimeout(() => setChecksumCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy checksum:', err);
    }
  };

  const truncatedChecksum = `${backupDetails.checksum.substring(0, 11)}...`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">✅</span>
          <h2 className="text-xl font-bold text-white">Backup Successfully Created</h2>
        </div>

        {/* Success Icon */}
        <div className="flex justify-center my-6">
          <div className="w-20 h-20 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center animate-scale-in">
            <span className="text-4xl">✅</span>
          </div>
        </div>

        {/* Success Message */}
        <p className="text-base text-gray-300 text-center mb-6">
          Your encrypted wallet backup has been saved to your Downloads folder.
        </p>

        {/* Backup Details Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">Backup Details</h3>

          {/* Filename */}
          <div className="flex items-start mb-3">
            <span className="text-gray-500 mr-2">📄</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Filename:</p>
              <p className="text-sm text-white font-mono truncate">{backupDetails.filename}</p>
            </div>
          </div>

          {/* Size */}
          <div className="flex items-start mb-3">
            <span className="text-gray-500 mr-2">📊</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Size:</p>
              <p className="text-sm text-gray-300">{backupDetails.size}</p>
            </div>
          </div>

          {/* Checksum */}
          <div className="flex items-start mb-3">
            <span className="text-gray-500 mr-2">🔐</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">SHA-256 Checksum:</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-white font-mono truncate flex-1" title={backupDetails.checksum}>
                  {truncatedChecksum}
                </p>
                <button
                  onClick={handleCopyChecksum}
                  className="text-xs text-bitcoin hover:text-bitcoin-hover font-semibold whitespace-nowrap"
                >
                  {checksumCopied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* Created Date */}
          <div className="flex items-start">
            <span className="text-gray-500 mr-2">📅</span>
            <div className="flex-1">
              <p className="text-xs text-gray-500">Created:</p>
              <p className="text-sm text-gray-300">{backupDetails.created}</p>
            </div>
          </div>
        </div>

        {/* Security Reminders */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start mb-3">
            <span className="text-blue-400 mr-2">🛡️</span>
            <h3 className="text-xs font-bold text-blue-300">IMPORTANT SECURITY REMINDERS</h3>
          </div>

          <ul className="space-y-2 ml-6 text-xs text-blue-200/90">
            <li className="flex items-start">
              <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">✓</span>
              <span>
                Store this backup file in a <strong>secure location</strong> (encrypted USB drive, password manager)
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">✓</span>
              <span>
                Keep your backup password <strong>safe and separate</strong> from the backup file
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">✓</span>
              <span>
                Test your backup by attempting to restore in a test environment
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">✓</span>
              <span>
                <strong>Never share</strong> the backup file or password with anyone
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2 flex-shrink-0 mt-0.5">✓</span>
              <span>
                Keep <strong>multiple backups</strong> in different secure locations
              </span>
            </li>
          </ul>
        </div>

        {/* Done Button */}
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="w-auto px-12 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
            autoFocus
          >
            Done
          </button>
        </div>

        {/* Announce success to screen readers */}
        <div role="alert" aria-live="assertive" className="sr-only">
          Backup successfully created
        </div>
      </div>
    </Modal>
  );
};

export default ExportSuccessModal;
