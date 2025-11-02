/**
 * XpubImport - Import extended public keys from co-signers
 *
 * Allows importing co-signer xpubs via paste, QR scan, or file upload.
 * Validates xpubs and tracks import progress.
 *
 * Features:
 * - Multiple import methods (paste, QR scan, file upload)
 * - Xpub validation and duplicate detection
 * - Optional nickname assignment for each co-signer
 * - Progress tracking (X of Y co-signers added)
 * - Remove/edit imported xpubs
 *
 * Props:
 * - config: Multisig configuration (determines how many co-signers needed)
 * - myXpub: User's own xpub (to prevent importing own key)
 * - myFingerprint: User's fingerprint
 * - cosigners: Already imported cosigners
 * - onAddCosigner: Callback when cosigner is added
 * - onRemoveCosigner: Callback when cosigner is removed
 * - onUpdateCosignerName: Callback when cosigner name is updated
 *
 * Usage:
 * <XpubImport
 *   config={wizard.state.selectedConfig}
 *   myXpub={wizard.state.myXpub}
 *   myFingerprint={wizard.state.myFingerprint}
 *   cosigners={wizard.state.cosignerXpubs}
 *   onAddCosigner={wizard.addCosigner}
 *   onRemoveCosigner={wizard.removeCosigner}
 *   onUpdateCosignerName={wizard.updateCosignerName}
 * />
 */

import React, { useState, useRef } from 'react';
import { MultisigConfig, Cosigner, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import Modal from '../shared/Modal';

interface XpubImportProps {
  config: MultisigConfig;
  myXpub: string;
  myFingerprint: string;
  cosigners: Cosigner[];
  onAddCosigner: (cosigner: Cosigner) => void;
  onRemoveCosigner: (fingerprint: string) => void;
  onUpdateCosignerName: (fingerprint: string, name: string) => void;
}

type ImportMethod = 'paste' | 'file';

export const XpubImport: React.FC<XpubImportProps> = ({
  config,
  myXpub,
  myFingerprint,
  cosigners,
  onAddCosigner,
  onRemoveCosigner,
  onUpdateCosignerName,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  const [showImportModal, setShowImportModal] = useState(false);
  const [importMethod, setImportMethod] = useState<ImportMethod>('paste');
  const [pasteInput, setPasteInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate how many co-signers we need
  const getRequiredCosigners = (): number => {
    const [, total] = config.split('-of-').map(Number);
    return total - 1; // Subtract 1 for user's own key
  };

  const requiredCosigners = getRequiredCosigners();
  const progress = cosigners.length;
  const isComplete = progress === requiredCosigners;

  const truncateXpub = (xpub: string): string => {
    return `${xpub.slice(0, 12)}...${xpub.slice(-8)}`;
  };

  const formatFingerprint = (fingerprint: string): string => {
    return fingerprint.match(/.{1,4}/g)?.join(' ') || fingerprint;
  };

  // Validate and import xpub
  const handleImport = async () => {
    setImportError(null);
    setIsImporting(true);

    try {
      // Get xpub data based on import method
      let xpubData: string;

      if (importMethod === 'paste') {
        if (!pasteInput.trim()) {
          setImportError('Please paste an extended public key');
          setIsImporting(false);
          return;
        }
        xpubData = pasteInput.trim();
      } else {
        // File upload
        if (!selectedFile) {
          setImportError('Please select a file to import');
          setIsImporting(false);
          return;
        }

        const fileContent = await selectedFile.text();
        try {
          const json = JSON.parse(fileContent);
          if (!json.xpub) {
            setImportError('Invalid file format: missing xpub field');
            setIsImporting(false);
            return;
          }
          xpubData = json.xpub;
        } catch (err) {
          setImportError('Invalid JSON file');
          setIsImporting(false);
          return;
        }
      }

      // Basic validation
      if (!xpubData.match(/^tpub[a-zA-Z0-9]+$/)) {
        setImportError('Invalid xpub format (must start with tpub for testnet)');
        setIsImporting(false);
        return;
      }

      if (xpubData.length < 100) {
        setImportError('Xpub is too short to be valid');
        setIsImporting(false);
        return;
      }

      // Check if it's the user's own xpub
      if (xpubData === myXpub) {
        setImportError('Cannot import your own xpub as a co-signer');
        setIsImporting(false);
        return;
      }

      // Check for duplicates
      if (cosigners.some(c => c.xpub === xpubData)) {
        setImportError('This xpub has already been imported');
        setIsImporting(false);
        return;
      }

      // Call backend to validate and extract fingerprint
      const response = await sendMessage<{
        fingerprint: string;
        derivationPath: string;
        valid: boolean;
      }>(MessageType.IMPORT_COSIGNER_XPUB, {
        xpub: xpubData,
      });

      if (!response.valid) {
        setImportError('Invalid xpub: backend validation failed');
        setIsImporting(false);
        return;
      }

      // Create cosigner object
      const newCosigner: Cosigner = {
        name: '',  // User can add nickname later
        xpub: xpubData,
        fingerprint: response.fingerprint,
        derivationPath: response.derivationPath,
        isSelf: false,
      };

      onAddCosigner(newCosigner);

      // Reset form
      setPasteInput('');
      setSelectedFile(null);
      setImportError(null);
      setShowImportModal(false);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Failed to import xpub');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.json')) {
      setSelectedFile(file);
      setImportError(null);
    } else {
      setImportError('Please drop a valid JSON file');
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Import Co-Signer Extended Public Keys
        </h2>
        <p className="text-gray-400">
          You need {requiredCosigners} xpub{requiredCosigners > 1 ? 's' : ''} from co-signers
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Import Progress</span>
          <span className={`text-sm font-semibold ${isComplete ? 'text-green-500' : 'text-bitcoin'}`}>
            {progress} of {requiredCosigners}
          </span>
        </div>
        <div className="h-2 bg-gray-750 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isComplete
                ? 'bg-gradient-to-r from-green-500 to-green-400'
                : 'bg-gradient-to-r from-bitcoin to-bitcoin-light'
            }`}
            style={{ width: `${(progress / requiredCosigners) * 100}%` }}
          />
        </div>
      </div>

      {/* Imported Co-Signers List */}
      <div className="space-y-4">
        {Array.from({ length: requiredCosigners }).map((_, index) => {
          const cosigner = cosigners[index];

          return (
            <div key={index} className="space-y-3">
              <h3 className="text-base font-semibold text-white">
                Co-Signer {index + 1}
              </h3>

              {!cosigner ? (
                // Empty state - show import button
                <button
                  onClick={() => setShowImportModal(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 bg-gray-850 hover:bg-gray-800 border-2 border-gray-700 hover:border-bitcoin rounded-lg transition-all duration-200 group"
                >
                  <svg
                    className="w-5 h-5 text-gray-500 group-hover:text-bitcoin transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-400 group-hover:text-bitcoin transition-colors">
                    Import Xpub
                  </span>
                </button>
              ) : (
                // Filled state - show imported xpub
                <div className="p-4 bg-gray-850 border border-green-500/30 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <svg
                      className="w-6 h-6 text-green-500 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <button
                      onClick={() => onRemoveCosigner(cosigner.fingerprint)}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Extended Public Key</p>
                      <p className="text-sm font-mono text-gray-300 break-all">
                        {truncateXpub(cosigner.xpub)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fingerprint</p>
                      <p className="text-sm font-mono font-semibold text-bitcoin">
                        {formatFingerprint(cosigner.fingerprint)}
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        Nickname (Optional)
                      </label>
                      <input
                        type="text"
                        value={cosigner.name}
                        onChange={(e) =>
                          onUpdateCosignerName(cosigner.fingerprint, e.target.value)
                        }
                        placeholder="e.g., Alice's Key"
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-bitcoin"
                        maxLength={32}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning Box */}
      <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div>
          <p className="font-semibold text-sm text-amber-400 mb-1">Verify Fingerprints!</p>
          <p className="text-sm text-amber-400/80">
            Contact each co-signer via <strong>phone call or video chat</strong> to verbally confirm
            their fingerprint matches. This prevents impersonation attacks.
          </p>
        </div>
      </div>

      {/* Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)}>
        <div className="w-[500px] p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Import Extended Public Key</h2>

          {/* Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-3">Import Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setImportMethod('paste')}
                className={`
                  flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors
                  ${
                    importMethod === 'paste'
                      ? 'bg-bitcoin/10 border-bitcoin text-bitcoin'
                      : 'bg-gray-850 border-gray-700 text-gray-400 hover:border-gray-600'
                  }
                `}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Paste</span>
              </button>

              <button
                onClick={() => setImportMethod('file')}
                className={`
                  flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-colors
                  ${
                    importMethod === 'file'
                      ? 'bg-bitcoin/10 border-bitcoin text-bitcoin'
                      : 'bg-gray-850 border-gray-700 text-gray-400 hover:border-gray-600'
                  }
                `}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium">File</span>
              </button>
            </div>
          </div>

          {/* Method Content */}
          {importMethod === 'paste' && (
            <div className="mb-6">
              <label className="block text-sm text-gray-400 mb-2">Paste Xpub from Co-Signer</label>
              <textarea
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder="tpubD6NzVbkr..."
                rows={4}
                className="w-full px-4 py-3 bg-gray-850 border border-gray-700 rounded-lg font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-bitcoin resize-none"
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-500">{pasteInput.length} characters</p>
                {pasteInput.length > 0 && (
                  <button
                    onClick={() => setPasteInput('')}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {importMethod === 'file' && (
            <div className="mb-6">
              <div
                onDrop={handleFileDrop}
                onDragOver={handleDragOver}
                className="p-8 bg-gray-850 border-2 border-dashed border-gray-700 rounded-lg text-center cursor-pointer hover:border-bitcoin hover:bg-gray-800 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <svg
                  className="w-16 h-16 text-gray-500 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-gray-400 mb-2">Drag & drop JSON file here</p>
                <p className="text-xs text-gray-600 mb-4">or</p>
                <span className="inline-block px-6 py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-medium transition-colors">
                  Choose File
                </span>
              </div>

              {selectedFile && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    File loaded: <span className="font-mono">{selectedFile.name}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {importError && (
            <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-400 mb-1">Import Error</p>
                  <p className="text-sm text-red-400/80">{importError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowImportModal(false);
                setPasteInput('');
                setSelectedFile(null);
                setImportError(null);
              }}
              className="flex-1 px-4 py-3 bg-gray-850 hover:bg-gray-800 text-white border border-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={
                isImporting ||
                (importMethod === 'paste' && !pasteInput.trim()) ||
                (importMethod === 'file' && !selectedFile)
              }
              className={`
                flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2
                ${
                  isImporting ||
                  (importMethod === 'paste' && !pasteInput.trim()) ||
                  (importMethod === 'file' && !selectedFile)
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-bitcoin hover:bg-bitcoin-hover text-white'
                }
              `}
            >
              {isImporting && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-white" />
              )}
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default XpubImport;
