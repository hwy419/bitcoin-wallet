/**
 * ExportXpubModal - Extended public key export modal
 *
 * Modal dialog for exporting account-level extended public keys (xpub).
 * Xpubs are public information but can reveal all addresses in an account,
 * so privacy warnings are included.
 *
 * Features:
 * - Display xpub with metadata
 * - Copy to clipboard
 * - Download as text file
 * - QR code generation
 * - Privacy warnings
 * - Dark mode support
 *
 * Security:
 * - Only works with HD-derived accounts (not imported private keys)
 * - Not available for multisig accounts (use EXPORT_OUR_XPUB)
 * - Requires wallet to be unlocked
 * - Displays privacy implications
 *
 * Props:
 * - isOpen: Modal visibility
 * - onClose: Close modal callback
 * - accountIndex: Account to export from
 * - accountName: Account name for display
 * - addressType: Address type (legacy/segwit/native-segwit)
 *
 * Usage:
 * <ExportXpubModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   accountIndex={0}
 *   accountName="Account 1"
 *   addressType="native-segwit"
 * />
 */

import React, { useState, useEffect } from 'react';
import Modal from './shared/Modal';
import SecurityWarning from './shared/SecurityWarning';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { MessageType, AddressType } from '../../shared/types/index';
import QRCode from 'qrcode';

interface ExportXpubModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountIndex: number;
  accountName: string;
  addressType: AddressType;
}

export const ExportXpubModal: React.FC<ExportXpubModalProps> = ({
  isOpen,
  onClose,
  accountIndex,
  accountName,
  addressType,
}) => {
  const { sendMessage } = useBackgroundMessaging();

  // Export state
  const [xpub, setXpub] = useState('');
  const [fingerprint, setFingerprint] = useState('');
  const [derivationPath, setDerivationPath] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedXpub, setCopiedXpub] = useState(false);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setXpub('');
      setFingerprint('');
      setDerivationPath('');
      setQrCodeDataUrl('');
      setIsLoading(false);
      setError(null);
      setCopiedXpub(false);
      setCopiedFingerprint(false);
    }
  }, [isOpen]);

  // Load xpub when modal opens
  useEffect(() => {
    if (isOpen && !xpub) {
      handleLoadXpub();
    }
  }, [isOpen]);

  // Address type display names
  const addressTypeDisplayName: Record<AddressType, string> = {
    'legacy': 'Legacy (P2PKH)',
    'segwit': 'SegWit (P2SH-P2WPKH)',
    'native-segwit': 'Native SegWit (P2WPKH)',
  };

  // Get xpub prefix info
  const getXpubInfo = () => {
    const prefixes: Record<AddressType, { testnet: string; description: string }> = {
      'legacy': { testnet: 'tpub', description: 'Testnet Legacy' },
      'segwit': { testnet: 'upub', description: 'Testnet SegWit' },
      'native-segwit': { testnet: 'vpub', description: 'Testnet Native SegWit' },
    };
    return prefixes[addressType];
  };

  const xpubInfo = getXpubInfo();

  // Load xpub from background
  const handleLoadXpub = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessage<{
        xpub: string;
        fingerprint: string;
        derivationPath: string;
        metadata: any;
      }>(MessageType.EXPORT_ACCOUNT_XPUB, { accountIndex });

      setXpub(response.xpub);
      setFingerprint(response.fingerprint);
      setDerivationPath(response.derivationPath);

      // Generate QR code
      const qrDataUrl = await QRCode.toDataURL(response.xpub, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to export xpub';

      // Provide helpful error messages
      if (errorMsg.includes('locked')) {
        setError('Wallet is locked. Please unlock your wallet first.');
      } else if (errorMsg.includes('multisig')) {
        setError('Cannot export xpub for multisig accounts. Use the multisig wizard to export xpubs.');
      } else if (errorMsg.includes('private key')) {
        setError('Cannot export xpub for accounts imported from private keys. Only HD-derived accounts have extended public keys.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy xpub to clipboard
  const handleCopyXpub = async () => {
    if (!xpub) return;

    try {
      await navigator.clipboard.writeText(xpub);
      setCopiedXpub(true);
      setTimeout(() => setCopiedXpub(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Copy fingerprint to clipboard
  const handleCopyFingerprint = async () => {
    if (!fingerprint) return;

    try {
      await navigator.clipboard.writeText(fingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  // Download xpub as text file
  const handleDownload = () => {
    if (!xpub) return;

    const content = `Extended Public Key (xpub) Export
============================================

Account Name: ${accountName}
Address Type: ${addressTypeDisplayName[addressType]}
Derivation Path: ${derivationPath}
Fingerprint: ${fingerprint}
Network: Testnet
Exported: ${new Date().toISOString()}

Extended Public Key:
${xpub}

PRIVACY WARNING:
This extended public key can be used to derive all public addresses
in this account. Anyone with this xpub can see all your receiving
addresses and monitor all transactions to these addresses.

DO NOT share this xpub unless you understand the privacy implications.

Use cases:
- Watch-only wallets
- Sharing with contacts for address rotation (privacy enhancement)
- Hardware wallet integration
- Accounting and auditing
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xpub-${accountName.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl w-full"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-white">Export Extended Public Key</h2>
        </div>

        {/* Privacy Warning */}
        <SecurityWarning>
          <strong>Privacy Implications:</strong> Your extended public key (xpub) can be used to derive all receiving addresses in this account. Anyone with your xpub can monitor all transactions to these addresses.
        </SecurityWarning>

        {/* Account Info */}
        <div className="bg-gray-850 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Account Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Account:</span>
              <span className="text-white font-mono">{accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Address Type:</span>
              <span className="text-white">{addressTypeDisplayName[addressType]}</span>
            </div>
            {derivationPath && (
              <div className="flex justify-between">
                <span className="text-gray-400">Derivation Path:</span>
                <span className="text-white font-mono">{derivationPath}</span>
              </div>
            )}
            {fingerprint && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Fingerprint:</span>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono">{fingerprint}</span>
                  <button
                    onClick={handleCopyFingerprint}
                    className="text-xs text-bitcoin hover:text-bitcoin-hover"
                    title="Copy fingerprint"
                  >
                    {copiedFingerprint ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
            {xpubInfo && (
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="text-white">{xpubInfo.description} ({xpubInfo.testnet}...)</span>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bitcoin"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Xpub Display */}
        {!isLoading && !error && xpub && (
          <>
            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img src={qrCodeDataUrl} alt="Extended Public Key QR Code" className="w-64 h-64" />
                </div>
              </div>
            )}

            {/* Extended Public Key */}
            <div className="bg-gray-850 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-300">Extended Public Key</h3>
                <button
                  onClick={handleCopyXpub}
                  className="text-sm text-bitcoin hover:text-bitcoin-hover font-semibold"
                >
                  {copiedXpub ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded p-3 break-all font-mono text-sm text-white">
                {xpub}
              </div>
            </div>

            {/* Use Cases */}
            <div className="bg-gray-850 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Common Use Cases</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-bitcoin mt-1">•</span>
                  <span><strong className="text-white">Watch-only wallets:</strong> Monitor balances and transactions without exposing private keys</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-bitcoin mt-1">•</span>
                  <span><strong className="text-white">Address rotation:</strong> Share with contacts to automatically generate fresh addresses for each transaction (privacy enhancement)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-bitcoin mt-1">•</span>
                  <span><strong className="text-white">Hardware wallets:</strong> Export to hardware wallet for address verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-bitcoin mt-1">•</span>
                  <span><strong className="text-white">Accounting:</strong> Track all account transactions for tax or audit purposes</span>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Close
          </button>
          {xpub && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors"
            >
              Download as Text File
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExportXpubModal;
