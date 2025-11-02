/**
 * PSBTExport - Export Partially Signed Bitcoin Transaction
 *
 * Allows users to export a PSBT in multiple formats for sharing with co-signers.
 * Supports 4 export formats:
 * - Base64 (default, compact text format)
 * - Hex (alternative text format)
 * - QR Code (for scanning with mobile wallets)
 * - File Download (JSON file with metadata)
 *
 * Props:
 * - psbtBase64: PSBT in base64 format
 * - onClose: Callback when user closes the modal
 *
 * Usage:
 * <PSBTExport
 *   psbtBase64={psbtBase64}
 *   onClose={() => setShowExport(false)}
 * />
 */

import React, { useState, useRef } from 'react';
import { useQRCode } from '../../hooks/useQRCode';

interface PSBTExportProps {
  psbtBase64: string;
  onClose: () => void;
}

type ExportFormat = 'base64' | 'hex' | 'qr' | 'file';

export const PSBTExport: React.FC<PSBTExportProps> = ({ psbtBase64, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { generateQR } = useQRCode(canvasRef);

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('base64');
  const [copied, setCopied] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Convert base64 to hex
  const psbtHex = (() => {
    try {
      const binary = atob(psbtBase64);
      return Array.from(binary, (char) => char.charCodeAt(0).toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  })();

  // Generate QR code for selected format
  const handleGenerateQR = async () => {
    setQrError(null);
    setQrGenerated(false);

    try {
      // QR code data - use base64 as it's more compact
      await generateQR(psbtBase64, { width: 300 });
      setQrGenerated(true);
    } catch (err) {
      setQrError('Failed to generate QR code. PSBT may be too large for QR format.');
    }
  };

  // Auto-generate QR when switching to QR tab
  React.useEffect(() => {
    if (selectedFormat === 'qr' && !qrGenerated && !qrError) {
      handleGenerateQR();
    }
  }, [selectedFormat]);

  // Copy text to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download as JSON file
  const handleDownload = () => {
    const data = {
      psbt: psbtBase64,
      format: 'base64',
      createdAt: new Date().toISOString(),
      note: 'Import this PSBT into your Bitcoin wallet to review and sign the transaction',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `psbt-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDisplayText = (): string => {
    switch (selectedFormat) {
      case 'base64':
        return psbtBase64;
      case 'hex':
        return psbtHex;
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div data-testid="psbt-export-modal" className="bg-gray-850 border border-gray-700 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-850 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Export PSBT</h2>
            <p className="text-sm text-gray-400 mt-1">Share this with your co-signers to collect signatures</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Format Selector */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setSelectedFormat('base64')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                selectedFormat === 'base64'
                  ? 'bg-bitcoin text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              Base64
            </button>
            <button
              onClick={() => setSelectedFormat('hex')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                selectedFormat === 'hex'
                  ? 'bg-bitcoin text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              Hex
            </button>
            <button
              onClick={() => setSelectedFormat('qr')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                selectedFormat === 'qr'
                  ? 'bg-bitcoin text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              QR Code
            </button>
            <button
              onClick={() => setSelectedFormat('file')}
              className={`py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                selectedFormat === 'file'
                  ? 'bg-bitcoin text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-750 hover:text-white'
              }`}
            >
              File
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-6 pb-6">
          {/* Base64 / Hex Display */}
          {(selectedFormat === 'base64' || selectedFormat === 'hex') && (
            <div className="space-y-3">
              <div className="relative">
                <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg font-mono text-xs text-gray-300 break-all max-h-64 overflow-y-auto">
                  {getDisplayText()}
                </div>
              </div>
              <button
                onClick={() => handleCopy(getDisplayText())}
                className="w-full py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                {selectedFormat === 'base64'
                  ? 'Most compact text format. Recommended for most wallets.'
                  : 'Alternative format. Some wallets may require hex format.'}
              </p>
            </div>
          )}

          {/* QR Code Display */}
          {selectedFormat === 'qr' && (
            <div className="space-y-4">
              {qrError ? (
                <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-lg">
                  <p className="text-sm text-amber-400">{qrError}</p>
                  <p className="text-xs text-amber-400/70 mt-2">
                    Try using Base64 or File format instead for large PSBTs.
                  </p>
                </div>
              ) : !qrGenerated ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin mb-4"></div>
                  <p className="text-gray-400">Generating QR code...</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-white rounded-xl border-2 border-bitcoin-light shadow-glow-bitcoin">
                      <canvas ref={canvasRef} />
                    </div>
                    <p className="mt-3 text-xs text-gray-500 text-center">
                      Scan with your co-signer's wallet app
                    </p>
                  </div>
                  <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                    <p className="text-xs text-gray-400">
                      Note: QR codes work best for smaller transactions. Large PSBTs may not fit in a single QR
                      code.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* File Download */}
          {selectedFormat === 'file' && (
            <div className="space-y-4">
              <div className="p-6 bg-gray-900 border border-gray-700 rounded-lg text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-bitcoin-subtle rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-bitcoin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Download as JSON File</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Save the PSBT as a JSON file to share via email or messaging apps
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors"
                >
                  Download File
                </button>
              </div>
              <div className="p-3 bg-gray-900 border border-gray-700 rounded-lg">
                <p className="text-xs text-gray-400">
                  The JSON file contains the PSBT in base64 format along with metadata. Share this file securely
                  with your co-signers.
                </p>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 flex gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <span className="text-2xl flex-shrink-0">ℹ️</span>
            <div>
              <p className="font-semibold text-sm text-blue-400 mb-1">What is a PSBT?</p>
              <p className="text-xs text-blue-400/80">
                A Partially Signed Bitcoin Transaction (PSBT) allows multiple parties to review and sign a
                transaction. Share this with your co-signers to collect the required signatures before
                broadcasting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PSBTExport;
