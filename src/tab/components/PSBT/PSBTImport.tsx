/**
 * PSBTImport - Import Partially Signed Bitcoin Transaction
 *
 * Allows users to import a PSBT from co-signers to add more signatures.
 * Supports 2 import methods:
 * - Paste (text area for base64/hex input)
 * - File Upload (JSON file with PSBT)
 *
 * Props:
 * - onImported: Callback when PSBT is successfully imported
 * - onCancel: Callback when user cancels import
 *
 * Usage:
 * <PSBTImport
 *   onImported={(result) => handlePSBTImported(result)}
 *   onCancel={() => setShowImport(false)}
 * />
 */

import React, { useState, useRef } from 'react';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType } from '../../../shared/types';

export interface PSBTImportResult {
  psbtBase64: string;
  txid: string;
  signaturesCollected: number;
  signaturesRequired: number;
  metadata: {
    amount: number;
    recipient: string;
    fee: number;
  };
}

interface PSBTImportProps {
  onImported: (result: PSBTImportResult) => void;
  onCancel: () => void;
}

type ImportMethod = 'paste' | 'file';

export const PSBTImport: React.FC<PSBTImportProps> = ({ onImported, onCancel }) => {
  const { sendMessage } = useBackgroundMessaging();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>('paste');
  const [psbtInput, setPsbtInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate and import PSBT
  const handleImport = async (psbtBase64: string) => {
    setError(null);
    setIsValidating(true);

    try {
      // Validate PSBT with background service
      const result = await sendMessage<PSBTImportResult>(MessageType.IMPORT_PSBT, {
        psbtBase64,
      });

      // Success - call parent callback
      onImported(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import PSBT');
    } finally {
      setIsValidating(false);
    }
  };

  // Handle paste import
  const handlePasteImport = async () => {
    if (!psbtInput.trim()) {
      setError('Please paste a PSBT');
      return;
    }

    // Try to detect format and normalize to base64
    let psbtBase64 = psbtInput.trim();

    // If it looks like hex (even length, only hex chars), convert to base64
    if (/^[0-9a-fA-F]+$/.test(psbtBase64) && psbtBase64.length % 2 === 0) {
      try {
        // Convert hex to base64
        const bytes = psbtBase64.match(/.{2}/g)!.map((byte) => String.fromCharCode(parseInt(byte, 16)));
        psbtBase64 = btoa(bytes.join(''));
      } catch {
        setError('Invalid hex format');
        return;
      }
    }

    await handleImport(psbtBase64);
  };

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.psbt) {
        setError('Invalid file format: missing "psbt" field');
        return;
      }

      await handleImport(data.psbt);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON file');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to read file');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gray-850 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Import PSBT</h2>
            <p className="text-sm text-gray-400 mt-1">Import a partially signed transaction from your co-signers</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Method Selector */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setSelectedMethod('paste')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedMethod === 'paste'
                  ? 'bg-bitcoin text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              Paste PSBT
            </button>
            <button
              onClick={() => setSelectedMethod('file')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                selectedMethod === 'file'
                  ? 'bg-bitcoin text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              Upload File
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Paste Method */}
          {selectedMethod === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Paste PSBT (Base64 or Hex)
                </label>
                <textarea
                  value={psbtInput}
                  onChange={(e) => {
                    setPsbtInput(e.target.value);
                    setError(null);
                  }}
                  placeholder="Paste your PSBT here (base64 or hex format)"
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-bitcoin resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Accepts both base64 and hex formats. The format will be auto-detected.
                </p>
              </div>

              <button
                onClick={handlePasteImport}
                disabled={isValidating || !psbtInput.trim()}
                className="w-full py-3 bg-bitcoin hover:bg-bitcoin-hover disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Import PSBT</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* File Upload Method */}
          {selectedMethod === 'file' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-bitcoin rounded-lg p-12 text-center cursor-pointer transition-colors group"
              >
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-800 group-hover:bg-bitcoin-subtle rounded-full flex items-center justify-center mb-4 transition-colors">
                    <svg
                      className="w-8 h-8 text-gray-400 group-hover:text-bitcoin transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Click to upload a file</p>
                  <p className="text-sm text-gray-500">JSON files only</p>
                </div>
              </div>

              <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">
                  Upload a JSON file containing a PSBT. The file should have a "psbt" field with the base64-encoded
                  transaction.
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-2xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-semibold text-sm text-blue-400 mb-1">Importing PSBTs</p>
              <p className="text-xs text-blue-400/80">
                After importing, you'll be able to review the transaction details and add your signature. The PSBT
                will be validated to ensure it matches your multisig configuration.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-4 flex justify-end">
          <button
            onClick={onCancel}
            disabled={isValidating}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-750 disabled:bg-gray-800 disabled:cursor-not-allowed text-gray-300 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PSBTImport;
