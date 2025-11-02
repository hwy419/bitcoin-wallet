/**
 * XpubExport - Extended public key export component for multisig setup
 *
 * Displays and exports the user's extended public key (xpub) for sharing with co-signers.
 * The xpub is PUBLIC information and safe to share - it cannot be used to spend funds.
 *
 * Features:
 * - QR code generation for easy scanning
 * - Copy to clipboard with feedback
 * - Download as JSON file
 * - Displays fingerprint and configuration
 * - Safety and warning messages
 *
 * Props:
 * - config: Multisig configuration (2-of-2, 2-of-3, 3-of-5)
 * - addressType: Address type (p2wsh, p2sh-p2wsh, p2sh)
 * - onXpubReady: Callback when xpub is fetched from background
 *
 * Usage:
 * <XpubExport
 *   config={wizard.state.selectedConfig}
 *   addressType={wizard.state.selectedAddressType}
 *   onXpubReady={(xpub, fingerprint) => setMyXpub(xpub, fingerprint)}
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import { MultisigConfig, MultisigAddressType, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { useQRCode } from '../../hooks/useQRCode';

interface XpubExportProps {
  config: MultisigConfig;
  addressType: MultisigAddressType;
  onXpubReady: (xpub: string, fingerprint: string) => void;
}

export const XpubExport: React.FC<XpubExportProps> = ({ config, addressType, onXpubReady }) => {
  const { sendMessage } = useBackgroundMessaging();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { generateQR } = useQRCode(canvasRef);

  const [xpub, setXpub] = useState<string>('');
  const [fingerprint, setFingerprint] = useState<string>('');
  const [derivationPath, setDerivationPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedXpub, setCopiedXpub] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Fetch xpub from background on mount
  useEffect(() => {
    const fetchXpub = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendMessage<{
          xpub: string;
          fingerprint: string;
          derivationPath: string;
        }>(MessageType.EXPORT_OUR_XPUB, {
          config,
          addressType,
        });

        setXpub(response.xpub);
        setFingerprint(response.fingerprint);
        setDerivationPath(response.derivationPath);
        onXpubReady(response.xpub, response.fingerprint);

        // Generate QR code - wait for canvas to be available
        const qrData = JSON.stringify({
          xpub: response.xpub,
          fingerprint: response.fingerprint,
          config,
          addressType,
          derivationPath: response.derivationPath,
        });

        // Small delay to ensure canvas is mounted
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check if canvas ref is available before generating QR
        if (canvasRef.current) {
          await generateQR(qrData, { width: 240 });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export xpub');
      } finally {
        setIsLoading(false);
      }
    };

    fetchXpub();
  }, [config, addressType, sendMessage, onXpubReady, generateQR]);

  const handleCopyXpub = async () => {
    try {
      await navigator.clipboard.writeText(xpub);
      setCopiedXpub(true);
      setTimeout(() => setCopiedXpub(false), 2000);
    } catch (err) {
      setError('Failed to copy xpub');
    }
  };

  const handleCopyFingerprint = async () => {
    try {
      await navigator.clipboard.writeText(fingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    } catch (err) {
      setError('Failed to copy fingerprint');
    }
  };

  const handleDownload = () => {
    const data = {
      xpub,
      fingerprint,
      configuration: config,
      addressType,
      derivationPath,
      createdAt: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const filename = `multisig-xpub-${config}-${new Date().toISOString().split('T')[0]}.json`;

    // Use chrome.downloads API - saveAs: false to prevent popup closing
    // File will download directly to Downloads folder
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      {
        url: url,
        filename: filename,
        saveAs: false, // Download directly without file picker dialog
      },
      (downloadId) => {
        if (downloadId) {
          console.log(`Download started: ${filename}`);
        }
        // Clean up the blob URL after download starts
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    );
  };

  const getAddressTypeLabel = (): string => {
    switch (addressType) {
      case 'p2wsh':
        return 'P2WSH (Native SegWit)';
      case 'p2sh-p2wsh':
        return 'P2SH-P2WSH (Wrapped SegWit)';
      case 'p2sh':
        return 'P2SH (Legacy)';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin mb-4"></div>
        <p className="text-gray-400">Generating your extended public key...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Export Your Extended Public Key</h2>
        <p className="text-gray-400">Share this with your co-signers to set up the multisig wallet</p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <div className="p-4 bg-white rounded-xl border-2 border-bitcoin-light shadow-glow-bitcoin">
          <canvas ref={canvasRef} width="240" height="240" />
        </div>
        <p className="mt-2 text-xs text-gray-500">Scan this QR code with your co-signer's wallet</p>
      </div>

      {/* Xpub Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Your Extended Public Key (xpub)</label>
        <div className="relative">
          <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg font-mono text-sm text-gray-300 break-all overflow-x-auto pr-12">
            {xpub}
          </div>
          <button
            onClick={handleCopyXpub}
            className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white rounded transition-colors"
            title="Copy xpub"
          >
            {copiedXpub ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Fingerprint Display */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-400">Your Key Fingerprint</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-gray-850 border border-gray-700 rounded-lg font-mono text-lg font-semibold text-bitcoin">
            {fingerprint}
          </div>
          <button
            onClick={handleCopyFingerprint}
            className="p-3 bg-gray-850 hover:bg-gray-800 border border-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
            title="Copy fingerprint"
          >
            {copiedFingerprint ? (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500">Use this to verify your key with co-signers</p>
      </div>

      {/* Configuration Details */}
      <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Configuration:</span>
          <span className="text-white font-semibold">{config} Multisig</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Address Type:</span>
          <span className="text-white font-semibold">{getAddressTypeLabel()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Derivation Path:</span>
          <span className="text-white font-mono text-xs">{derivationPath}</span>
        </div>
      </div>

      {/* Safe to Share Box */}
      <div className="flex gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
        <span className="text-2xl flex-shrink-0">🔒</span>
        <div>
          <p className="font-semibold text-sm text-green-400 mb-1">Safe to Share</p>
          <p className="text-sm text-green-400/80">
            This is your PUBLIC key only. It cannot be used to spend funds. It's safe to share with
            co-signers.
          </p>
        </div>
      </div>

      {/* Important Warnings Box */}
      <div className="flex gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div>
          <p className="font-semibold text-sm text-amber-400 mb-2">Important</p>
          <ul className="space-y-1 text-sm text-amber-400/80">
            <li>• All co-signers must use the SAME configuration ({config})</li>
            <li>• All co-signers must use the SAME address type ({getAddressTypeLabel()})</li>
            <li>• Verify fingerprint with co-signers via phone/video call</li>
            <li>• NEVER share your 12-word seed phrase or private keys</li>
          </ul>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="w-full py-3 bg-gray-850 hover:bg-gray-800 border border-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>Download as File</span>
      </button>
    </div>
  );
};

export default XpubExport;
