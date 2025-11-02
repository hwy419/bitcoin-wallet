/**
 * AddressVerification - Multisig address verification step
 *
 * Displays the first multisig address and guides users through verification.
 * CRITICAL: All co-signers must verify they see the exact same address.
 *
 * Features:
 * - QR code of first address
 * - Copy address functionality
 * - Verification checklist (interactive checkboxes)
 * - Configuration summary
 * - Critical warnings and safety information
 *
 * Props:
 * - config: Multisig configuration
 * - addressType: Address type
 * - myXpub: User's xpub
 * - cosigners: List of cosigners
 * - onAddressGenerated: Callback with generated address
 * - onVerified: Callback when user confirms verification
 *
 * Usage:
 * <AddressVerification
 *   config={wizard.state.selectedConfig}
 *   addressType={wizard.state.selectedAddressType}
 *   myXpub={wizard.state.myXpub}
 *   cosigners={wizard.state.cosignerXpubs}
 *   onAddressGenerated={wizard.setFirstAddress}
 *   onVerified={wizard.setAddressVerified}
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import { MultisigConfig, MultisigAddressType, Cosigner, MessageType } from '../../../shared/types';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { useQRCode } from '../../hooks/useQRCode';

interface AddressVerificationProps {
  config: MultisigConfig;
  addressType: MultisigAddressType;
  myXpub: string;
  cosigners: Cosigner[];
  onAddressGenerated: (address: string) => void;
  onVerified: (verified: boolean) => void;
}

export const AddressVerification: React.FC<AddressVerificationProps> = ({
  config,
  addressType,
  myXpub,
  cosigners,
  onAddressGenerated,
  onVerified,
}) => {
  const { sendMessage } = useBackgroundMessaging();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { generateQR } = useQRCode(canvasRef);

  const [firstAddress, setFirstAddress] = useState<string>('');
  const [derivationPath, setDerivationPath] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addressCopied, setAddressCopied] = useState(false);

  // Verification checklist state
  const [checklist, setChecklist] = useState({
    sameConfig: true, // Pre-validated
    sameAddressType: true, // Pre-validated
    fingerprintsVerified: false,
    addressMatches: false,
  });

  const [finalConfirmation, setFinalConfirmation] = useState(false);

  // Generate first multisig address on mount
  useEffect(() => {
    const generateAddress = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Call backend to generate first multisig address
        const response = await sendMessage<{
          address: string;
          derivationPath: string;
          redeemScript?: string;
          witnessScript?: string;
        }>(MessageType.GENERATE_MULTISIG_ADDRESS, {
          config,
          addressType,
          cosignerXpubs: cosigners.filter(c => !c.isSelf).map(c => ({
            name: c.name,
            xpub: c.xpub,
            fingerprint: c.fingerprint,
          })),
        });

        // sendMessage returns data directly (throws on error)
        const { address, derivationPath: path } = response;

        setFirstAddress(address);
        setDerivationPath(path);
        onAddressGenerated(address);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate address');
      } finally {
        setIsLoading(false);
      }
    };

    generateAddress();
  }, [config, addressType, myXpub, cosigners, sendMessage, onAddressGenerated]);

  // Separate effect for QR code generation after address is set
  useEffect(() => {
    if (!firstAddress || !canvasRef.current) return;

    const generateQRCode = async () => {
      try {
        console.log('[AddressVerification] Generating QR code for:', firstAddress);
        await generateQR(firstAddress, { width: 200 });
        console.log('[AddressVerification] QR code generated successfully');
      } catch (err) {
        console.error('[AddressVerification] Failed to generate QR code:', err);
        // Don't set error state - QR code is nice-to-have, not critical
      }
    };

    generateQRCode();
  }, [firstAddress, generateQR]);

  // Update verification status
  useEffect(() => {
    const allChecked =
      checklist.fingerprintsVerified && checklist.addressMatches && finalConfirmation;
    onVerified(allChecked);
  }, [checklist, finalConfirmation, onVerified]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(firstAddress);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy address');
    }
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
        <p className="text-gray-400">Generating multisig address...</p>
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
        <h2 className="text-2xl font-bold text-white mb-2">Verify Multisig Address</h2>
        <p className="text-gray-400">This is your first receiving address</p>
      </div>

      {/* Critical Warning */}
      <div className="p-4 bg-red-500/15 border-2 border-red-500 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-3xl">⚠️</span>
          <div>
            <p className="font-bold text-lg text-red-400 mb-2">CRITICAL STEP</p>
            <p className="text-sm text-red-300">
              All co-signers MUST see the <strong>EXACT SAME address</strong>. If addresses don't
              match, <strong>DO NOT proceed</strong>. Funds sent to mismatched addresses could be
              lost forever.
            </p>
          </div>
        </div>
      </div>

      {/* Address Display */}
      <div className="flex flex-col items-center">
        {/* QR Code */}
        <div className="mb-4 p-4 bg-white rounded-xl border-2 border-bitcoin-light shadow-lg">
          <canvas ref={canvasRef} width="200" height="200" />
        </div>

        {/* Address */}
        <div className="w-full mb-2">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            First Receiving Address
          </label>
          <div className="relative">
            <div className="p-4 bg-gray-850 border-2 border-bitcoin rounded-lg font-mono text-base text-bitcoin break-all pr-12">
              {firstAddress}
            </div>
            <button
              onClick={handleCopyAddress}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-750 text-gray-400 hover:text-white rounded transition-colors"
              title="Copy Address"
            >
              {addressCopied ? (
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

        {/* Metadata */}
        <div className="w-full space-y-1 text-sm text-gray-500">
          <p>
            Derivation Path: <span className="font-mono text-gray-400">{derivationPath}</span>
          </p>
          <p>
            Address Type: <span className="text-gray-400">{getAddressTypeLabel()}</span>
          </p>
          <p>
            Configuration: <span className="text-gray-400">{config} Multisig</span>
          </p>
        </div>
      </div>

      {/* Verification Checklist */}
      <div className="p-4 bg-gray-850 border border-gray-700 rounded-lg">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Verification Checklist
        </h3>

        <div className="space-y-3">
          {/* Pre-validated items */}
          <label className="flex items-start gap-3 opacity-60 cursor-not-allowed">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-sm text-gray-400">
              All co-signers selected <strong className="text-white">{config}</strong>{' '}
              configuration
            </span>
          </label>

          <label className="flex items-start gap-3 opacity-60 cursor-not-allowed">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-sm text-gray-400">
              All co-signers selected <strong className="text-white">{getAddressTypeLabel()}</strong>{' '}
              address type
            </span>
          </label>

          {/* User must verify */}
          <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-800 -mx-2 px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={checklist.fingerprintsVerified}
              onChange={(e) =>
                setChecklist({ ...checklist, fingerprintsVerified: e.target.checked })
              }
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-bitcoin focus:ring-bitcoin focus:ring-offset-gray-900"
            />
            <span className="text-sm text-gray-300">
              Verified all fingerprints match via phone/video call
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer hover:bg-gray-800 -mx-2 px-2 py-1 rounded transition-colors">
            <input
              type="checkbox"
              checked={checklist.addressMatches}
              onChange={(e) => setChecklist({ ...checklist, addressMatches: e.target.checked })}
              className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-bitcoin focus:ring-bitcoin focus:ring-offset-gray-900"
            />
            <span className="text-sm text-gray-300">
              First address matches on <strong>all co-signers' wallets</strong>
            </span>
          </label>
        </div>
      </div>

      {/* Verification Method */}
      <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
          <span className="text-xl">📞</span>
          Recommended Verification Method
        </h4>
        <p className="text-sm text-blue-400/80 mb-2">
          Call or video chat with each co-signer.
        </p>
        <ol className="text-sm text-blue-400/80 space-y-1 list-decimal list-inside">
          <li>Ask co-signer to navigate to address verification screen</li>
          <li>Read the first 8 characters of the address</li>
          <li>Read the last 8 characters of the address</li>
          <li>Confirm fingerprints match what you imported</li>
        </ol>
      </div>

      {/* Final Warning */}
      <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⛔</span>
          <div>
            <p className="font-semibold text-sm text-red-400 mb-1">DO NOT FUND THIS WALLET</p>
            <p className="text-sm text-red-400/80">
              until you verify the address with <strong>ALL co-signers</strong>! Funds sent to
              incorrect addresses cannot be recovered.
            </p>
          </div>
        </div>
      </div>

      {/* Final Confirmation */}
      <label className="flex items-start gap-3 p-4 bg-gray-850 border-2 border-bitcoin rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
        <input
          type="checkbox"
          checked={finalConfirmation}
          onChange={(e) => setFinalConfirmation(e.target.checked)}
          className="mt-1 w-4 h-4 rounded border-bitcoin bg-gray-800 text-bitcoin focus:ring-bitcoin focus:ring-offset-gray-900"
        />
        <span className="text-sm font-medium text-white">
          I have verified this address matches with{' '}
          <strong className="text-bitcoin">all co-signers</strong> via phone call or video chat
        </span>
      </label>
    </div>
  );
};

export default AddressVerification;
