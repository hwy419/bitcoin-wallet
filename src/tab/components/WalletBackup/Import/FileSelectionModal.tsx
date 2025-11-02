/**
 * FileSelectionModal - Select backup file for import
 *
 * First step in fresh install import flow. User selects .dat backup file.
 *
 * Features:
 * - Drag-and-drop file selection
 * - Browse button fallback
 * - File validation (type, size)
 * - Selected file display
 */

import React, { useState } from 'react';
import Modal from '../../shared/Modal';
import FileUploadArea from '../../shared/FileUploadArea';

interface FileSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (file: File) => void;
}

export const FileSelectionModal: React.FC<FileSelectionModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const handleContinue = () => {
    if (selectedFile) {
      onContinue(selectedFile);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📁</span>
          <h2 className="text-xl font-bold text-white">Import Wallet Backup</h2>
        </div>

        {/* Instructions */}
        <p className="text-sm text-gray-300 mb-6">
          Select your encrypted wallet backup file to restore your accounts, contacts, and settings.
        </p>

        {/* File Upload Area */}
        <FileUploadArea
          onFileSelect={setSelectedFile}
          acceptedTypes={['.dat']}
          maxSizeMB={10}
          className="mb-6"
        />

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedFile}
            className="flex-1 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            Continue →
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default FileSelectionModal;
