import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { WalletAccount, MessageType } from '../../shared/types';
import { MultisigBadge } from './shared/MultisigBadge';
import { CoSignerList } from './shared/CoSignerList';
import { PrivacyBadge } from './shared/PrivacyBadge';
import { InfoBox } from './shared/InfoBox';

interface ReceiveScreenProps {
  account: WalletAccount;
  onBack: () => void;
  isModal?: boolean;
}

const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ account, onBack, isModal = false }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isMultisigAccount = account.accountType === 'multisig';

  // Get the most recent external (receiving) address
  const receivingAddresses = account.addresses.filter((addr) => !addr.isChange);
  const currentAddress = receivingAddresses[receivingAddresses.length - 1]?.address || '';

  // PRIVACY FEATURE: Auto-generate fresh address on mount
  useEffect(() => {
    const autoGenerateAddress = async () => {
      // Only auto-generate for single-sig accounts (multisig uses different flow)
      if (isMultisigAccount) {
        return;
      }

      setIsGenerating(true);
      try {
        const response = await chrome.runtime.sendMessage({
          type: MessageType.GENERATE_ADDRESS,
          payload: {
            accountIndex: account.index,
            isChange: false, // Receiving address (external chain)
          },
        });

        if (response.success) {
          console.log('Auto-generated fresh receiving address for privacy');
          setShowPrivacyBanner(true);
          // Auto-dismiss banner after 3 seconds
          setTimeout(() => setShowPrivacyBanner(false), 3000);
        }
      } catch (error) {
        console.error('Failed to auto-generate address:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    autoGenerateAddress();
  }, [account.index, isMultisigAccount]);

  // Generate QR code
  useEffect(() => {
    if (currentAddress && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        currentAddress,
        {
          width: 240,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        },
        (error) => {
          if (error) {
            setQrError('Failed to generate QR code');
            console.error('QR Code generation error:', error);
          }
        }
      );
    }
  }, [currentAddress]);

  const handleCopyAddress = async () => {
    if (!currentAddress) return;

    try {
      await navigator.clipboard.writeText(currentAddress);
      setCopiedAddress(currentAddress);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  // Generate new multisig address manually
  const handleGenerateMultisigAddress = async () => {
    if (!isMultisigAccount) return;

    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await chrome.runtime.sendMessage({
        type: MessageType.GENERATE_MULTISIG_ADDRESS,
        payload: {
          accountIndex: account.index,
          isChange: false, // Receiving address (external chain)
        },
      });

      if (response.success) {
        console.log('Generated new multisig address');
        // Show success message
        setShowPrivacyBanner(true);
        setTimeout(() => setShowPrivacyBanner(false), 3000);

        // Reload the page to fetch updated account data
        // In a real app, you'd update the account state properly
        window.location.reload();
      } else {
        setGenerateError(response.error || 'Failed to generate address');
      }
    } catch (error) {
      console.error('Failed to generate multisig address:', error);
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate address');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
      {/* Header - Only render in tab mode */}
      {!isModal && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-1 text-gray-400 hover:text-white transition-colors"
              title="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Receive Bitcoin</h1>
              <p className="text-sm text-gray-500">{account.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
        {!currentAddress ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No receiving address available</p>
            <p className="text-sm text-gray-500 mt-2">Generate an address to receive Bitcoin</p>
          </div>
        ) : (
          <>
            {/* Privacy Banner - Auto-generated Address */}
            {showPrivacyBanner && !isGenerating && (
              <div className="mb-4">
                <InfoBox
                  variant="success"
                  title="Fresh Address Generated"
                  dismissible
                  onDismiss={() => setShowPrivacyBanner(false)}
                >
                  New address generated for privacy. Using fresh addresses helps protect your transaction history.
                </InfoBox>
              </div>
            )}

            {/* Multisig Badge and Info */}
            {isMultisigAccount && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white">Multisig Account</h3>
                  <MultisigBadge config={account.multisigConfig} size="md" />
                </div>
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg mb-4">
                  <p className="text-sm text-purple-300">
                    This is a {account.multisigConfig} multisig address. Funds sent to this address will require{' '}
                    {account.multisigConfig.split('-of-')[0]} signatures to spend.
                  </p>
                </div>
                {/* Error Display */}
                {generateError && (
                  <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">{generateError}</p>
                  </div>
                )}
                {/* Co-signers */}
                <CoSignerList cosigners={account.cosigners} compact={true} />
              </div>
            )}

            {/* QR Code Section */}
            <div className={isModal ? "mb-6" : "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6 mb-6"}>
              <div className="flex flex-col items-center">
                {qrError ? (
                  <div className="p-4 bg-red-500/15 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-300">{qrError}</p>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border-2 border-bitcoin-light">
                    <canvas ref={canvasRef} />
                  </div>
                )}

                {/* Address Display */}
                <div className="mt-6 w-full">
                  <p className="text-xs text-gray-500 text-center mb-2">Your Bitcoin Address</p>
                  <div className="bg-gray-900 rounded-lg p-4 break-all">
                    <p className="text-sm font-mono text-gray-300 text-center">{currentAddress}</p>
                  </div>

                  {/* Derivation Path (for multisig verification) */}
                  {isMultisigAccount && currentAddress && receivingAddresses.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 mb-1">Derivation Path (for verification)</p>
                      <p className="text-xs font-mono text-gray-400">
                        {receivingAddresses[receivingAddresses.length - 1].derivationPath}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 gap-3 mt-4">
                    {/* Copy Address Button */}
                    <button
                      onClick={handleCopyAddress}
                      className="w-full bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                    >
                      {copiedAddress ? (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Copy Address
                        </>
                      )}
                    </button>

                    {/* Generate New Address Button (Multisig Only) */}
                    {isMultisigAccount && (
                      <button
                        onClick={handleGenerateMultisigAddress}
                        disabled={isGenerating}
                        className="w-full bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:bg-gray-700 disabled:cursor-not-allowed active:scale-[0.98] text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
                      >
                        {isGenerating ? (
                          <>
                            <svg className="animate-spin w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Generate New Address
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* All Receiving Addresses */}
            {receivingAddresses.length > 1 && (
              <div className={isModal ? "" : "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6"}>
                <h3 className="text-lg font-semibold text-white mb-4">All Receiving Addresses</h3>
                <div className="space-y-3">
                  {receivingAddresses
                    .slice()
                    .reverse()
                    .map((addr, index) => (
                      <div
                        key={addr.address}
                        className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs text-gray-500">
                              Address #{receivingAddresses.length - index}
                              {index === 0 && <span className="ml-2 text-bitcoin font-semibold">(Current)</span>}
                            </p>
                            {/* Privacy Badge */}
                            {addr.used ? (
                              <PrivacyBadge variant="warning" ariaLabel="Address has been used">
                                ⚠️ Previously used
                              </PrivacyBadge>
                            ) : (
                              <PrivacyBadge variant="success" ariaLabel="Fresh unused address">
                                ✓ Fresh
                              </PrivacyBadge>
                            )}
                          </div>
                          <p className="text-sm font-mono text-gray-300 truncate">{addr.address}</p>
                          {addr.used && (
                            <p className="text-xs text-gray-500 mt-1">
                              Reusing addresses reduces privacy. Use a fresh address for each transaction.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReceiveScreen;
