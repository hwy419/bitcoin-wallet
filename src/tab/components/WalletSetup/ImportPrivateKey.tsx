import React, { useState } from 'react';
import { useBackgroundMessaging } from '../../hooks/useBackgroundMessaging';
import { MessageType, AddressType } from '../../../shared/types';

interface ImportPrivateKeyProps {
  onSetupComplete: () => void;
}

interface WIFValidationResult {
  valid: boolean;
  network?: 'testnet' | 'mainnet';
  compressed?: boolean;
  error?: string;
}

interface AddressPreview {
  legacy: string | null;
  segwit: string | null;
  nativeSegwit: string | null;
}

const ImportPrivateKey: React.FC<ImportPrivateKeyProps> = ({ onSetupComplete }) => {
  const { sendMessage } = useBackgroundMessaging();

  // Input method
  const [inputMethod, setInputMethod] = useState<'file' | 'paste'>('paste');

  // WIF state
  const [pastedWIF, setPastedWIF] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);

  // Validation state
  const [wifValidation, setWIFValidation] = useState<WIFValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Address type selection
  const [selectedAddressType, setSelectedAddressType] = useState<AddressType | null>(null);
  const [addressPreviews, setAddressPreviews] = useState<AddressPreview>({
    legacy: null,
    segwit: null,
    nativeSegwit: null
  });

  // Password fields
  const [walletPassword, setWalletPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [walletPasswordVisible, setWalletPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Account name
  const [accountName, setAccountName] = useState('Imported Account');

  // Privacy
  const [privacyNoticeDismissed, setPrivacyNoticeDismissed] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  // UI state
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // File upload handler
  const handleFileSelect = async (file: File) => {
    setError(null);
    setSelectedFile(file);

    // Validate file size (max 100KB)
    const MAX_SIZE = 100 * 1024;
    if (file.size > MAX_SIZE) {
      setError('File size exceeds 100KB limit');
      setSelectedFile(null);
      return;
    }

    try {
      const text = await file.text();
      setFileContent(text);

      console.log('[ImportPrivateKey] File content length:', text.length);
      console.log('[ImportPrivateKey] First 200 chars:', text.substring(0, 200));

      // Extract WIF from file (handles both plain and formatted exports)
      // Format: "# Private Key (WIF):\n<wif>" or just "<wif>" on its own line
      const primaryMatch = text.match(/#\s*Private Key \(WIF\):\s*\n\s*([^\n\s]+)/);
      const fallbackMatch = text.match(/^([c9][a-zA-Z0-9]{50,51})\s*$/m);

      console.log('[ImportPrivateKey] Primary regex match:', primaryMatch);
      console.log('[ImportPrivateKey] Fallback regex match:', fallbackMatch);

      const wifMatch = primaryMatch || fallbackMatch;

      if (wifMatch) {
        const wif = wifMatch[1].trim();
        console.log('[ImportPrivateKey] Extracted WIF:', wif.substring(0, 10) + '...');
        console.log('[ImportPrivateKey] WIF length:', wif.length);
        setPastedWIF(wif);
        await validateWIF(wif);
      } else {
        console.error('[ImportPrivateKey] No WIF match found in file');
        setError('Could not find valid WIF in file');
        setSelectedFile(null);
      }
    } catch (err) {
      console.error('[ImportPrivateKey] File read error:', err);
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setSelectedFile(null);
    }
  };

  // Validate WIF
  const validateWIF = async (wif: string) => {
    console.log('[validateWIF] Starting validation for WIF:', wif.substring(0, 10) + '...');
    console.log('[validateWIF] WIF length:', wif.length);
    console.log('[validateWIF] First char:', wif[0]);

    if (!wif.trim()) {
      console.log('[validateWIF] Empty WIF, clearing validation');
      setWIFValidation(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Basic WIF format check (testnet starts with 'c' or '9')
      // WIF can be 51 chars (uncompressed) or 52 chars (compressed)
      const testnetWIFRegex = /^[c9][a-zA-Z0-9]{50,51}$/;
      const formatTest = testnetWIFRegex.test(wif.trim());
      console.log('[validateWIF] Format test result:', formatTest);

      if (!formatTest) {
        console.error('[validateWIF] Format test failed');
        setWIFValidation({
          valid: false,
          error: 'Invalid WIF format. Testnet WIF keys start with "c" or "9"'
        });
        setIsValidating(false);
        return;
      }

      // Import bitcoinjs-lib dynamically for validation
      const bitcoin = await import('bitcoinjs-lib');
      const { ECPairFactory } = await import('ecpair');
      const ecc = await import('tiny-secp256k1');
      const ECPair = ECPairFactory(ecc);

      try {
        console.log('[validateWIF] Attempting to decode WIF with bitcoinjs-lib...');
        const keyPair = ECPair.fromWIF(wif.trim(), bitcoin.networks.testnet);
        const compressed = keyPair.compressed;
        console.log('[validateWIF] WIF decoded successfully. Compressed:', compressed);

        // Generate address previews for all types
        const previews: AddressPreview = {
          legacy: null,
          segwit: null,
          nativeSegwit: null
        };

        // Legacy address
        const { address: legacyAddr } = bitcoin.payments.p2pkh({
          pubkey: Buffer.from(keyPair.publicKey),
          network: bitcoin.networks.testnet
        });
        previews.legacy = legacyAddr || null;

        // Only compressed keys can use SegWit
        if (compressed) {
          // SegWit (P2SH-P2WPKH)
          const { address: segwitAddr } = bitcoin.payments.p2sh({
            redeem: bitcoin.payments.p2wpkh({
              pubkey: Buffer.from(keyPair.publicKey),
              network: bitcoin.networks.testnet
            }),
            network: bitcoin.networks.testnet
          });
          previews.segwit = segwitAddr || null;

          // Native SegWit (P2WPKH)
          const { address: nativeSegwitAddr } = bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(keyPair.publicKey),
            network: bitcoin.networks.testnet
          });
          previews.nativeSegwit = nativeSegwitAddr || null;
        }

        setAddressPreviews(previews);
        console.log('[validateWIF] Address previews generated:', previews);

        setWIFValidation({
          valid: true,
          network: 'testnet',
          compressed
        });
        console.log('[validateWIF] Validation successful!');

        // Auto-select Native SegWit if available, otherwise Legacy
        if (compressed) {
          console.log('[validateWIF] Auto-selecting Native SegWit');
          setSelectedAddressType('native-segwit');
        } else {
          console.log('[validateWIF] Auto-selecting Legacy');
          setSelectedAddressType('legacy');
        }
      } catch (err) {
        console.error('[validateWIF] Bitcoin library validation error:', err);
        setWIFValidation({
          valid: false,
          error: 'Invalid WIF key or wrong network'
        });
      }
    } catch (err) {
      console.error('[validateWIF] Outer validation error:', err);
      setWIFValidation({
        valid: false,
        error: err instanceof Error ? err.message : 'Validation failed'
      });
    } finally {
      console.log('[validateWIF] Validation complete, setting isValidating=false');
      setIsValidating(false);
    }
  };

  // Password validation
  const validatePassword = (pwd: string): boolean => {
    if (pwd.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/[A-Z]/.test(pwd)) {
      setPasswordError('Password must contain at least one uppercase letter');
      return false;
    }
    if (!/[a-z]/.test(pwd)) {
      setPasswordError('Password must contain at least one lowercase letter');
      return false;
    }
    if (!/[0-9]/.test(pwd)) {
      setPasswordError('Password must contain at least one number');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  // Import wallet
  const handleImportWallet = async () => {
    setError(null);
    setPasswordError(null);

    // Validate WIF
    if (!pastedWIF || !wifValidation?.valid) {
      setError('Please provide a valid WIF private key');
      return;
    }

    // Validate address type
    if (!selectedAddressType) {
      setError('Please select an address type');
      return;
    }

    // Validate wallet password
    if (!validatePassword(walletPassword)) {
      return;
    }

    if (walletPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    // Validate privacy acknowledgment
    if (!privacyAcknowledged) {
      setError('Please acknowledge the privacy implications');
      return;
    }

    setIsImporting(true);

    try {
      await sendMessage<{ account: any; firstAddress: string }>(
        MessageType.CREATE_WALLET_FROM_PRIVATE_KEY,
        {
          wif: pastedWIF.trim(),
          addressType: selectedAddressType,
          password: walletPassword,
          accountName: accountName.trim()
        }
      );

      // Success - wallet created
      onSetupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
    } finally {
      setIsImporting(false);
    }
  };

  // Can import check
  const canImport = (): boolean => {
    return !!(
      pastedWIF &&
      wifValidation?.valid &&
      selectedAddressType &&
      walletPassword &&
      confirmPassword &&
      walletPassword === confirmPassword &&
      privacyAcknowledged &&
      !isImporting
    );
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  };

  const passwordStrength = walletPassword ? calculatePasswordStrength(walletPassword) : null;

  return (
    <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-2 -mr-2">
      <p className="text-sm text-gray-400 mb-6">
        Import a wallet from a WIF private key backup. This creates a single-address wallet.
      </p>

      {/* Input Method Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Input Method
        </label>
        <div className="inline-flex bg-gray-900 border border-gray-700 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setInputMethod('file')}
            disabled={isImporting}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${inputMethod === 'file'
                ? 'bg-bitcoin text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }
              ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('paste')}
            disabled={isImporting}
            className={`
              px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
              ${inputMethod === 'paste'
                ? 'bg-bitcoin text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              }
              ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            Paste WIF
          </button>
        </div>
      </div>

      {/* File Upload */}
      {inputMethod === 'file' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Upload Private Key File
          </label>
          {selectedFile ? (
            <div className="bg-gray-850 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                    <p className="text-xs text-gray-400">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setFileContent(null);
                    setPastedWIF('');
                    setWIFValidation(null);
                  }}
                  disabled={isImporting}
                  className="text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block">
                <input
                  type="file"
                  accept=".txt,text/plain"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  disabled={isImporting}
                  className="block w-full text-sm text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border file:border-gray-700
                    file:text-sm file:font-medium
                    file:bg-gray-900 file:text-gray-300
                    hover:file:bg-gray-800
                    file:cursor-pointer
                    cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Supports .txt files exported from this wallet
              </p>
            </div>
          )}
        </div>
      )}

      {/* Paste WIF */}
      {inputMethod === 'paste' && (
        <div className="mb-6">
          <label htmlFor="wif-input" className="block text-sm font-medium text-gray-300 mb-2">
            Paste WIF Private Key
          </label>
          <textarea
            id="wif-input"
            value={pastedWIF}
            onChange={(e) => {
              setPastedWIF(e.target.value);
              setWIFValidation(null);
            }}
            onBlur={() => pastedWIF && validateWIF(pastedWIF)}
            rows={3}
            disabled={isImporting}
            placeholder="cT1Y2Y... (paste your WIF key here)"
            className={`
              w-full px-4 py-3 bg-gray-900 text-white placeholder:text-gray-500
              rounded-lg font-mono text-sm resize-y transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-bitcoin/30
              disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed
              ${!pastedWIF.trim()
                ? 'border-gray-700'
                : isValidating
                  ? 'border-bitcoin/50'
                  : wifValidation?.valid
                    ? 'border-green-500'
                    : wifValidation?.error
                      ? 'border-red-500'
                      : 'border-gray-700'
              }
            `}
          />

          {/* Validation Feedback */}
          {pastedWIF.trim() && (
            <div className="mt-2">
              {isValidating && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Validating...</span>
                </div>
              )}

              {wifValidation?.valid && (
                <div className="flex items-start gap-2 text-sm text-green-400">
                  <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">Valid WIF detected</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Network: {wifValidation.network} • Compression: {wifValidation.compressed ? 'Compressed' : 'Uncompressed'}
                    </p>
                  </div>
                </div>
              )}

              {wifValidation?.error && (
                <div className="flex items-start gap-2 text-sm text-red-400">
                  <svg className="w-5 h-5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">{wifValidation.error}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Verify you copied the entire key</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Address Type Selection */}
      {wifValidation?.valid && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Address Type
          </label>

          {/* Uncompressed Key Warning */}
          {!wifValidation.compressed && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-200">Uncompressed Private Key Detected</p>
                  <p className="text-xs text-yellow-300 mt-1">
                    This key can only be used with Legacy (P2PKH) addresses. SegWit requires compressed keys.
                  </p>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-400 mb-4">
            Select the address type you originally used. Check your backup or transaction history.
          </p>

          {/* Address Type Cards */}
          <div className="space-y-3">
            {/* Legacy */}
            <button
              type="button"
              onClick={() => setSelectedAddressType('legacy')}
              disabled={isImporting}
              className={`
                relative w-full border-2 rounded-xl p-4 text-left transition-all duration-200
                ${selectedAddressType === 'legacy'
                  ? 'border-bitcoin bg-bitcoin/5'
                  : 'border-gray-700 bg-gray-900 hover:border-gray-600 hover:bg-gray-850'
                }
                ${isImporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAddressType === 'legacy' ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'}`}>
                  {selectedAddressType === 'legacy' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">Legacy</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">P2PKH</div>
                  {addressPreviews.legacy && (
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 mb-2">
                      <div className="text-xs text-gray-500 mb-1">First address:</div>
                      <div className="font-mono text-xs text-white break-all">{addressPreviews.legacy}</div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Starts with: <span className="font-mono text-gray-300">m or n (testnet)</span>
                  </div>
                </div>
              </div>
            </button>

            {/* SegWit */}
            <button
              type="button"
              onClick={() => wifValidation.compressed && setSelectedAddressType('segwit')}
              disabled={!wifValidation.compressed || isImporting}
              className={`
                relative w-full border-2 rounded-xl p-4 text-left transition-all duration-200
                ${selectedAddressType === 'segwit'
                  ? 'border-bitcoin bg-bitcoin/5'
                  : 'border-gray-700 bg-gray-900'
                }
                ${!wifValidation.compressed
                  ? 'opacity-50 cursor-not-allowed'
                  : isImporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-gray-600 hover:bg-gray-850'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAddressType === 'segwit' ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'}`}>
                  {selectedAddressType === 'segwit' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">SegWit</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">P2SH-P2WPKH</div>
                  {addressPreviews.segwit && (
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 mb-2">
                      <div className="text-xs text-gray-500 mb-1">First address:</div>
                      <div className="font-mono text-xs text-white break-all">{addressPreviews.segwit}</div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Starts with: <span className="font-mono text-gray-300">2 (testnet)</span>
                  </div>
                  {!wifValidation.compressed && (
                    <div className="text-xs text-red-400 mt-2">Requires compressed key</div>
                  )}
                </div>
              </div>
            </button>

            {/* Native SegWit */}
            <button
              type="button"
              onClick={() => wifValidation.compressed && setSelectedAddressType('native-segwit')}
              disabled={!wifValidation.compressed || isImporting}
              className={`
                relative w-full border-2 rounded-xl p-4 text-left transition-all duration-200
                ${selectedAddressType === 'native-segwit'
                  ? 'border-bitcoin bg-bitcoin/5'
                  : 'border-gray-700 bg-gray-900'
                }
                ${!wifValidation.compressed
                  ? 'opacity-50 cursor-not-allowed'
                  : isImporting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-gray-600 hover:bg-gray-850'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedAddressType === 'native-segwit' ? 'border-bitcoin bg-bitcoin' : 'border-gray-600'}`}>
                  {selectedAddressType === 'native-segwit' && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-white">Native SegWit</span>
                    {wifValidation.compressed && (
                      <span className="px-2 py-0.5 bg-bitcoin/20 text-bitcoin text-xs font-medium rounded">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">P2WPKH</div>
                  {addressPreviews.nativeSegwit && (
                    <div className="bg-gray-950 border border-gray-800 rounded-lg p-2 mb-2">
                      <div className="text-xs text-gray-500 mb-1">First address:</div>
                      <div className="font-mono text-xs text-white break-all">{addressPreviews.nativeSegwit}</div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    Starts with: <span className="font-mono text-gray-300">tb1 (testnet)</span>
                  </div>
                  {!wifValidation.compressed && (
                    <div className="text-xs text-red-400 mt-2">Requires compressed key</div>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Password Fields */}
      {selectedAddressType && (
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="wallet-password" className="block text-sm font-medium text-gray-300 mb-2">
              New Wallet Password
            </label>
            <div className="relative">
              <input
                id="wallet-password"
                type={walletPasswordVisible ? 'text' : 'password'}
                value={walletPassword}
                onChange={(e) => {
                  setWalletPassword(e.target.value);
                  setPasswordError(null);
                }}
                onBlur={() => walletPassword && validatePassword(walletPassword)}
                disabled={isImporting}
                placeholder="Enter strong password"
                className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setWalletPasswordVisible(!walletPasswordVisible)}
                disabled={isImporting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {walletPasswordVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You'll use this to unlock your wallet
            </p>

            {/* Password Strength Meter */}
            {walletPassword && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength === 'weak' ? 'bg-red-500 w-1/3' :
                        passwordStrength === 'medium' ? 'bg-yellow-500 w-2/3' :
                        'bg-green-500 w-full'
                      }`}
                    />
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordStrength === 'weak' ? 'text-red-400' :
                    passwordStrength === 'medium' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>
                    {passwordStrength === 'weak' ? 'Weak' :
                     passwordStrength === 'medium' ? 'Medium' :
                     'Strong ✓'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Wallet Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={confirmPasswordVisible ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordError(null);
                }}
                disabled={isImporting}
                placeholder="Confirm password"
                className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                disabled={isImporting}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                {confirmPasswordVisible ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Match Validation */}
            {confirmPassword && walletPassword && (
              <div className="text-xs mt-1">
                {confirmPassword === walletPassword ? (
                  <span className="text-green-400">✓ Passwords match</span>
                ) : (
                  <span className="text-red-400">✗ Passwords do not match</span>
                )}
              </div>
            )}

            {passwordError && <p className="text-xs text-red-400 mt-1">{passwordError}</p>}
          </div>

          {/* Account Name */}
          <div>
            <label htmlFor="account-name" className="block text-sm font-medium text-gray-300 mb-2">
              Account Name (Optional)
            </label>
            <input
              id="account-name"
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              disabled={isImporting}
              placeholder="Imported Account"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30 transition-colors disabled:bg-gray-950 disabled:text-gray-600 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      {selectedAddressType && !privacyNoticeDismissed && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-200 mb-1">Privacy Notice</p>
              <p className="text-sm text-blue-300">
                Wallets imported from private keys use a single address for all transactions, which may reduce privacy compared to HD wallets with seed phrases.
              </p>
              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setPrivacyNoticeDismissed(true)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Acknowledgment */}
      {selectedAddressType && (
        <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-xl p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <svg className="w-6 h-6 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-base font-semibold text-yellow-100 mb-2">Privacy Warning</h3>
              <p className="text-sm text-yellow-200 mb-3">
                This wallet will reuse the same address for all transactions. This means:
              </p>
              <ul className="text-sm text-yellow-200 space-y-1.5 mb-4">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>All transactions are publicly linked</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Your balance is visible to anyone</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400 mt-0.5">•</span>
                  <span>Privacy is significantly reduced</span>
                </li>
              </ul>
              <p className="text-sm text-yellow-200">
                For better privacy, consider creating a wallet with a seed phrase instead.
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={privacyAcknowledged}
              onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
              disabled={isImporting}
              className="mt-1 w-4 h-4 bg-gray-900 border-yellow-500 checked:bg-yellow-500 checked:border-yellow-500 rounded focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-850 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-sm text-yellow-100 group-hover:text-white transition-colors">
              I understand the privacy implications and want to continue with this import
            </span>
          </label>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-500/15 border-l-4 border-red-500 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm font-medium text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Import Button */}
      <button
        onClick={handleImportWallet}
        disabled={!canImport()}
        className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
      >
        {isImporting ? 'Importing Wallet...' : 'Import Wallet'}
      </button>
    </div>
  );
};

export default ImportPrivateKey;
