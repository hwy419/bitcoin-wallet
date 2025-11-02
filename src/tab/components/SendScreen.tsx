import React, { useState, useEffect } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { useBitcoinPrice } from '../hooks/useBitcoinPrice';
import { usePSBT } from '../hooks/usePSBT';
import { useContacts } from '../hooks/useContacts';
import { MessageType, WalletAccount, Balance, FeeEstimate, Contact } from '../../shared/types';
import { formatSatoshisAsUSD } from '../../shared/utils/price';
import PSBTExport from './PSBT/PSBTExport';
import { InfoBox } from './shared/InfoBox';
import { PrivacyBadge } from './shared/PrivacyBadge';
import { AddEditContactModal } from './shared/AddEditContactModal';

interface SendScreenProps {
  account: WalletAccount;
  balance: Balance;
  onBack: () => void;
  onSendSuccess: () => void;
  isModal?: boolean;
}

type FeeSpeed = 'slow' | 'medium' | 'fast';

const SendScreen: React.FC<SendScreenProps> = ({ account, balance, onBack, onSendSuccess, isModal = false }) => {
  const { sendMessage } = useBackgroundMessaging();
  const { price: btcPrice } = useBitcoinPrice();
  const { buildPSBT, savePending, isBuilding } = usePSBT();
  const { contacts, getContacts, getContactByAddress } = useContacts();

  const isMultisigAccount = account.accountType === 'multisig';

  // Form state
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedFeeSpeed, setSelectedFeeSpeed] = useState<FeeSpeed>('medium');

  // Contact picker state
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [selectedXpubContact, setSelectedXpubContact] = useState<Contact | null>(null);
  const [showXpubAddressPicker, setShowXpubAddressPicker] = useState(false);
  const [xpubAddressSearchQuery, setXpubAddressSearchQuery] = useState('');

  // Privacy warning state
  const [showPrivacyWarning, setShowPrivacyWarning] = useState(false);
  const [showXpubSuccess, setShowXpubSuccess] = useState(false);

  // Fee estimates
  const [feeEstimates, setFeeEstimates] = useState<FeeEstimate | null>(null);
  const [estimatedFee, setEstimatedFee] = useState(0);

  // UI state
  const [isLoadingFees, setIsLoadingFees] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  // Unlock state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState(process.env.DEV_PASSWORD || '');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Success state
  const [txid, setTxid] = useState<string | null>(null);
  const [actualFee, setActualFee] = useState<number | null>(null);
  const [recipientAddedToContacts, setRecipientAddedToContacts] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // Multisig PSBT state
  const [psbtBase64, setPsbtBase64] = useState<string | null>(null);
  const [showPSBTExport, setShowPSBTExport] = useState(false);

  // Fetch fee estimates and contacts on mount
  useEffect(() => {
    const fetchFeeEstimates = async () => {
      setIsLoadingFees(true);
      try {
        const fees = await sendMessage<FeeEstimate>(MessageType.GET_FEE_ESTIMATES);
        setFeeEstimates(fees);
      } catch (err) {
        console.error('Failed to fetch fee estimates:', err);
        // Use default values if API fails
        setFeeEstimates({ slow: 1, medium: 3, fast: 5 });
      } finally {
        setIsLoadingFees(false);
      }
    };

    fetchFeeEstimates();
    getContacts('name'); // Fetch contacts for picker
  }, [sendMessage, getContacts]);

  // Check if entered address matches a contact
  useEffect(() => {
    const checkContact = async () => {
      if (toAddress.trim()) {
        const contact = await getContactByAddress(toAddress.trim());
        setSelectedContact(contact);
      } else {
        setSelectedContact(null);
      }
    };

    checkContact();
  }, [toAddress, getContactByAddress]);

  // Estimate transaction fee (rough estimate: ~250 vBytes for typical transaction)
  useEffect(() => {
    if (feeEstimates) {
      const feeRate = feeEstimates[selectedFeeSpeed];
      const estimatedSize = 250; // Typical transaction size in vBytes
      setEstimatedFee(Math.ceil(feeRate * estimatedSize));
    }
  }, [feeEstimates, selectedFeeSpeed]);

  // Validate Bitcoin testnet address
  const validateAddress = (address: string): boolean => {
    if (!address) {
      setAddressError('Address is required');
      return false;
    }

    // Testnet address validation
    const isLegacy = address.startsWith('m') || address.startsWith('n');
    const isSegwit = address.startsWith('2');
    const isNativeSegwit = address.startsWith('tb1');

    if (!isLegacy && !isSegwit && !isNativeSegwit) {
      setAddressError('Invalid testnet address (must start with m, n, 2, or tb1)');
      return false;
    }

    // Basic length checks
    if (isNativeSegwit && (address.length < 42 || address.length > 62)) {
      setAddressError('Invalid native SegWit address length');
      return false;
    }

    if ((isLegacy || isSegwit) && (address.length < 26 || address.length > 35)) {
      setAddressError('Invalid address length');
      return false;
    }

    setAddressError(null);
    return true;
  };

  // Validate amount
  const validateAmount = (amountStr: string): boolean => {
    if (!amountStr) {
      setAmountError('Amount is required');
      return false;
    }

    const amountSats = parseInt(amountStr, 10);

    if (isNaN(amountSats) || amountSats <= 0) {
      setAmountError('Amount must be a positive number');
      return false;
    }

    if (amountSats < 546) {
      setAmountError('Amount too small (min 546 sats for dust limit)');
      return false;
    }

    const totalWithFee = amountSats + estimatedFee;
    if (totalWithFee > balance.confirmed) {
      setAmountError(`Insufficient balance (need ${totalWithFee} sats including fee)`);
      return false;
    }

    setAmountError(null);
    return true;
  };

  // Handle address input change
  const handleAddressChange = (value: string) => {
    setToAddress(value);
    if (addressError) {
      setAddressError(null);
    }
  };

  // Handle contact selection from picker
  const handleSelectContact = async (contact: Contact) => {
    // If contact has a single address, use it directly but show privacy warning
    if (contact.address) {
      setToAddress(contact.address);
      setSelectedContact(contact);
      setShowContactPicker(false);
      setContactSearchQuery('');
      setShowPrivacyWarning(true); // Show warning for single-address contacts
      setShowXpubSuccess(false);
      if (addressError) {
        setAddressError(null);
      }
    }
    // If contact has xpub, get next unused address automatically
    else if (contact.xpub && contact.cachedAddresses && contact.cachedAddresses.length > 0) {
      try {
        // Get next unused address for xpub contact
        const response = await sendMessage<{ address: string; index: number }>(
          MessageType.GET_NEXT_CONTACT_ADDRESS,
          { contactId: contact.id }
        );

        setToAddress(response.address);
        setSelectedContact(contact);
        setShowContactPicker(false);
        setContactSearchQuery('');
        setShowPrivacyWarning(false);
        setShowXpubSuccess(true); // Show success for xpub contacts
        if (addressError) {
          setAddressError(null);
        }
      } catch (err) {
        console.error('Failed to get next contact address:', err);
        // Fallback to address picker if auto-selection fails
        setSelectedXpubContact(contact);
        setShowXpubAddressPicker(true);
      }
    }
  };

  // Handle address selection from xpub contact's cached addresses
  const handleSelectXpubAddress = (address: string, contact: Contact) => {
    setToAddress(address);
    setSelectedContact(contact);
    setShowContactPicker(false);
    setShowXpubAddressPicker(false);
    setSelectedXpubContact(null);
    setContactSearchQuery('');
    setXpubAddressSearchQuery('');
    if (addressError) {
      setAddressError(null);
    }
  };

  // Filter contacts for picker
  const filteredContacts = contactSearchQuery.trim()
    ? contacts.filter((c) => {
        const query = contactSearchQuery.toLowerCase();
        // Search by name
        if (c.name.toLowerCase().includes(query)) return true;
        // Search by single address
        if (c.address?.toLowerCase().includes(query)) return true;
        // Search by email
        if (c.email?.toLowerCase().includes(query)) return true;
        // Search by category
        if (c.category?.toLowerCase().includes(query)) return true;
        // Search by xpub fingerprint
        if (c.xpubFingerprint?.toLowerCase().includes(query)) return true;
        // Search through cached addresses
        if (c.cachedAddresses?.some((addr) => addr.toLowerCase().includes(query))) return true;
        return false;
      })
    : contacts;

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    setAmount(value);
    if (amountError) {
      setAmountError(null);
    }
  };

  // Set max amount (balance minus estimated fee)
  const handleSetMax = () => {
    const maxAmount = Math.max(0, balance.confirmed - estimatedFee);
    setAmount(maxAmount.toString());
    setAmountError(null);
  };

  // Format satoshis to BTC
  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  // Get fee speed label and estimated time
  const getFeeInfo = (speed: FeeSpeed): { label: string; time: string } => {
    const info = {
      slow: { label: 'Slow', time: '~60 min' },
      medium: { label: 'Medium', time: '~30 min' },
      fast: { label: 'Fast', time: '~10 min' },
    };
    return info[speed];
  };

  // Handle send transaction
  const handleSend = async () => {
    setError(null);

    // Validate inputs
    const isAddressValid = validateAddress(toAddress);
    const isAmountValid = validateAmount(amount);

    if (!isAddressValid || !isAmountValid) {
      return;
    }

    if (!feeEstimates) {
      setError('Fee estimates not loaded');
      return;
    }

    setIsSending(true);

    try {
      // Multisig: Build PSBT instead of sending
      if (isMultisigAccount) {
        const result = await buildPSBT({
          accountIndex: account.index,
          toAddress,
          amount: parseInt(amount, 10),
          feeRate: feeEstimates[selectedFeeSpeed],
        });

        // Save to pending transactions
        await savePending({
          accountIndex: account.index,
          psbtBase64: result.psbtBase64,
          metadata: {
            amount: parseInt(amount, 10),
            recipient: toAddress,
            fee: result.fee,
          },
        });

        // Show PSBT export modal
        setPsbtBase64(result.psbtBase64);
        setActualFee(result.fee);
        setShowPSBTExport(true);
      } else {
        // Single-sig: Send transaction directly
        const result = await sendMessage<{ txid: string; fee: number; size: number }>(
          MessageType.SEND_TRANSACTION,
          {
            accountIndex: account.index,
            toAddress,
            amount: parseInt(amount, 10),
            feeRate: feeEstimates[selectedFeeSpeed],
          }
        );

        setTxid(result.txid);
        setActualFee(result.fee);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send transaction';

      // If wallet is locked, show unlock modal
      if (errorMessage.includes('Wallet is locked')) {
        setShowUnlockModal(true);
        setIsSending(false);
        return;
      }

      // Map errors to user-friendly messages with context
      if (errorMessage.includes('bad-txns-inputs-missingorspent')) {
        setError(
          'Transaction failed: One or more inputs have already been spent. Your balance may have changed. Please refresh and try again.'
        );
      } else if (errorMessage.includes('bad-txns-inputs-duplicate')) {
        setError(
          'Transaction failed: Duplicate inputs detected. Please refresh your balance and try again.'
        );
      } else if (errorMessage.includes('insufficient fee') || errorMessage.includes('min relay fee')) {
        setError(
          'Transaction fee too low for current network conditions. Try selecting a higher fee speed (Medium or Fast).'
        );
      } else if (errorMessage.includes('504') || errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        setError(
          'Transaction status unknown: The request timed out. Your transaction may or may not have been broadcast. Please check your transaction history or a blockchain explorer before retrying.'
        );
      } else if (errorMessage.includes('502') || errorMessage.includes('503')) {
        setError(
          'Blockchain service temporarily unavailable. Your transaction was NOT sent. Please try again in a moment.'
        );
      } else if (errorMessage.includes('429')) {
        setError(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('Insufficient balance')) {
        setError(
          'Insufficient funds: You don\'t have enough Bitcoin to complete this transaction (including the fee).'
        );
      } else if (errorMessage.includes('dust')) {
        setError(
          'Amount too small: Bitcoin transactions have a minimum output size (546 satoshis) to prevent dust spam.'
        );
      } else {
        // Generic error with the original message
        setError(`Transaction failed: ${errorMessage}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle unlock wallet
  const handleUnlock = async () => {
    setUnlockError(null);
    setIsUnlocking(true);

    try {
      // Unlock wallet
      await sendMessage(MessageType.UNLOCK_WALLET, {
        password: unlockPassword,
      });

      // Close modal
      setShowUnlockModal(false);

      // Retry the send transaction
      setIsSending(true);
      try {
        const result = await sendMessage<{ txid: string; fee: number; size: number }>(
          MessageType.SEND_TRANSACTION,
          {
            accountIndex: account.index,
            toAddress,
            amount: parseInt(amount, 10),
            feeRate: feeEstimates![selectedFeeSpeed],
          }
        );

        setTxid(result.txid);
        setActualFee(result.fee);
      } catch (sendErr) {
        setError(sendErr instanceof Error ? sendErr.message : 'Failed to send transaction');
      } finally {
        setIsSending(false);
      }
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Incorrect password');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Handle done after successful send
  const handleDone = () => {
    onSendSuccess();
    onBack();
  };

  // Handle add to contacts
  const handleAddToContacts = () => {
    setShowAddContactModal(true);
  };

  // Handle save contact
  const handleSaveContact = async (contact: Contact) => {
    try {
      await sendMessage(MessageType.ADD_CONTACT, {
        name: contact.name,
        address: contact.address,
        email: contact.email,
        notes: contact.notes,
        category: contact.category,
        color: contact.color,
        tags: contact.tags,
      });

      setRecipientAddedToContacts(true);
      setShowAddContactModal(false);
      await getContacts('name');
    } catch (err) {
      console.error('Failed to add contact:', err);
      throw err;
    }
  };

  // Check if recipient is already in contacts
  const isRecipientInContacts = selectedContact !== null;

  // Success view
  if (txid) {
    return (
      <div className={isModal ? "" : "w-full h-full bg-gray-950 flex flex-col"}>
        {/* Header - Only in tab mode */}
        {!isModal && (
          <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
            <h1 className="text-xl font-bold text-white">Transaction Sent!</h1>
          </div>
        )}

        {/* Success Content */}
        <div className={isModal ? "" : "flex-1 overflow-y-auto p-6"}>
          <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6">
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            {/* Transaction Details */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                {formatBTC(parseInt(amount, 10))} BTC
              </h2>
              {btcPrice !== null && (
                <p className="text-sm text-gray-400">
                  ≈ {formatSatoshisAsUSD(parseInt(amount, 10), btcPrice)}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-3">Sent to</p>
              <p className="text-sm font-mono text-gray-400 break-all mt-1">{toAddress}</p>
            </div>

            {/* Transaction Info */}
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <div className="text-right">
                    <span className="font-semibold text-white">{amount} sats</span>
                    {btcPrice !== null && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatSatoshisAsUSD(parseInt(amount, 10), btcPrice)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <div className="text-right">
                    <span className="font-semibold text-white">{actualFee} sats</span>
                    {btcPrice !== null && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatSatoshisAsUSD(actualFee || 0, btcPrice)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-600">Total:</span>
                  <div className="text-right">
                    <span className="font-bold text-white">{parseInt(amount, 10) + (actualFee || 0)} sats</span>
                    {btcPrice !== null && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatSatoshisAsUSD(parseInt(amount, 10) + (actualFee || 0), btcPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction ID */}
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-1">Transaction ID:</p>
              <p className="text-xs font-mono text-gray-400 bg-gray-900 p-3 rounded break-all">{txid}</p>
            </div>

            {/* Add to Contacts */}
            {!isRecipientInContacts && !recipientAddedToContacts && (
              <button
                onClick={handleAddToContacts}
                className="w-full text-center bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 py-3 px-6 rounded-lg font-semibold transition-colors mb-3 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Save to Address Book
              </button>
            )}

            {recipientAddedToContacts && (
              <div className="w-full text-center bg-green-500/15 border border-green-500/30 text-green-400 py-3 px-6 rounded-lg mb-3 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added to Address Book
              </div>
            )}

            {/* View on Explorer */}
            <a
              href={`https://blockstream.info/testnet/tx/${txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors mb-3"
            >
              View on Block Explorer
            </a>

            {/* Done Button */}
            <button
              onClick={handleDone}
              className="w-full bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Send form view
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
              <h1 className="text-xl font-bold text-white">Send Bitcoin</h1>
              <p className="text-sm text-gray-500">{account.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={isModal ? "space-y-6" : "flex-1 overflow-y-auto p-6"}>
        <div className={isModal ? "" : "bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6"}>
          {/* Multisig Info Banner */}
          {isMultisigAccount && (
            <div className={isModal ? "mb-6 flex gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg" : "mb-6 flex gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"}>
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-purple-200 mb-1">Multisig Transaction Process</p>
                <p className="text-xs text-purple-300/80 mb-2">
                  This will create a PSBT (Partially Signed Bitcoin Transaction) that requires{' '}
                  <span className="font-semibold text-purple-200">{account.multisigConfig.split('-of-')[0]} of {account.multisigConfig.split('-of-')[1]}</span>{' '}
                  signatures. After creating, you'll export it to share with co-signers.
                </p>
                <div className="flex items-center gap-1 text-xs text-purple-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Your signature will be automatically added</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className={isModal ? "space-y-3" : "mb-4 space-y-3"}>
              <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
              {/* Reassurance message for transaction errors */}
              {!error.includes('NOT sent') && (
                <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Your Bitcoin is safe. No funds were lost.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Recipient Address */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-300">To Address</label>
              {contacts.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowContactPicker(!showContactPicker)}
                  className="text-sm text-bitcoin hover:text-bitcoin-hover font-semibold flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {showContactPicker ? 'Hide Address Book' : 'Select from Address Book'}
                </button>
              )}
            </div>

            {/* Contact Picker */}
            {showContactPicker && (
              <div className="mb-3 bg-gray-900 border border-gray-700 rounded-lg p-3 max-h-60 overflow-y-auto">
                {/* Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full px-3 py-2 bg-gray-850 border border-gray-700 rounded text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-bitcoin"
                  />
                </div>

                {/* Contact List */}
                {filteredContacts.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    {contactSearchQuery ? 'No contacts found' : 'No contacts yet'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredContacts.map((contact) => {
                      const hasXpub = !!contact.xpub;
                      const hasSingleAddress = !!contact.address;
                      const hasFingerprint = !!contact.xpubFingerprint;

                      return (
                        <button
                          key={contact.id}
                          type="button"
                          onClick={() => handleSelectContact(contact)}
                          className="w-full text-left px-3 py-2 bg-gray-850 hover:bg-gray-800 border border-gray-700 hover:border-bitcoin rounded transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">
                                {contact.name}
                              </p>
                              {hasSingleAddress ? (
                                <p className="text-xs font-mono text-gray-500 truncate">
                                  {contact.address!.slice(0, 12)}...{contact.address!.slice(-8)}
                                </p>
                              ) : hasXpub && hasFingerprint ? (
                                <p className="text-xs text-gray-500">
                                  🔑 Xpub: {contact.xpubFingerprint?.substring(0, 4)}...{contact.xpubFingerprint?.substring((contact.xpubFingerprint?.length || 0) - 4)} ({contact.cachedAddresses?.length || 0} addresses)
                                </p>
                              ) : hasXpub ? (
                                <p className="text-xs text-gray-500">
                                  🔑 Xpub contact ({contact.cachedAddresses?.length || 0} addresses)
                                </p>
                              ) : null}
                            </div>
                            {contact.category && (
                              <span className="ml-2 px-2 py-0.5 bg-blue-500/15 text-blue-400 text-xs rounded flex-shrink-0">
                                {contact.category}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <input
              type="text"
              value={toAddress}
              onChange={(e) => handleAddressChange(e.target.value)}
              onBlur={() => toAddress && validateAddress(toAddress)}
              placeholder="tb1q..."
              className={`w-full px-4 py-3 bg-gray-900 border rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 ${
                addressError
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
              }`}
            />
            {addressError && <p className="mt-1 text-sm text-red-400">{addressError}</p>}

            {/* Show contact name if address matches */}
            {selectedContact && !addressError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Sending to: {selectedContact.name}
                {selectedContact.category && ` (${selectedContact.category})`}
              </div>
            )}

            {/* Privacy Warning: Single-address contact */}
            {showPrivacyWarning && selectedContact && selectedContact.address && (
              <div className="mt-3">
                <InfoBox
                  variant="warning"
                  title="Privacy Notice"
                  dismissible
                  onDismiss={() => setShowPrivacyWarning(false)}
                >
                  <p className="mb-2">
                    This contact uses a single address. Reusing the same address for multiple transactions reduces your privacy.
                  </p>
                  {selectedContact.reusageCount !== undefined && selectedContact.reusageCount > 0 && (
                    <p className="text-sm">
                      You've sent to this address <strong>{selectedContact.reusageCount} {selectedContact.reusageCount === 1 ? 'time' : 'times'}</strong> before.
                    </p>
                  )}
                  <p className="text-sm mt-2">
                    💡 <strong>Tip:</strong> Ask {selectedContact.name} for an xpub to enable address rotation for better privacy.
                  </p>
                </InfoBox>
              </div>
            )}

            {/* Privacy Success: Xpub contact with address rotation */}
            {showXpubSuccess && selectedContact && selectedContact.xpub && (
              <div className="mt-3">
                <InfoBox
                  variant="success"
                  title="Address Rotation Enabled"
                  dismissible
                  onDismiss={() => setShowXpubSuccess(false)}
                >
                  <p>
                    Using fresh address for <strong>{selectedContact.name}</strong>. Address rotation helps protect your transaction privacy.
                  </p>
                </InfoBox>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Amount (satoshis)</label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={() => amount && validateAmount(amount)}
                placeholder="10000"
                min="546"
                className={`flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                  amountError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850'
                }`}
              />
              <button
                onClick={handleSetMax}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-750 text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Max
              </button>
            </div>
            {amount && !amountError && (
              <div className="mt-1 text-sm text-gray-500">
                <p>≈ {formatBTC(parseInt(amount, 10))} BTC</p>
                {btcPrice !== null && (
                  <p>≈ {formatSatoshisAsUSD(parseInt(amount, 10), btcPrice)}</p>
                )}
              </div>
            )}
            {amountError && <p className="mt-1 text-sm text-red-600">{amountError}</p>}
          </div>

          {/* Fee Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-3">Transaction Fee</label>
            {isLoadingFees ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                <p className="text-sm text-gray-500 mt-2">Loading fee estimates...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {(['slow', 'medium', 'fast'] as FeeSpeed[]).map((speed) => {
                    const feeInfo = getFeeInfo(speed);
                    const feeRate = feeEstimates?.[speed] || 0;
                    return (
                      <button
                        key={speed}
                        onClick={() => setSelectedFeeSpeed(speed)}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedFeeSpeed === speed
                            ? 'border-bitcoin bg-bitcoin-subtle'
                            : 'border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-white">{feeInfo.label}</p>
                        <p className="text-xs text-gray-600 mt-1">{feeRate} sat/vB</p>
                        <p className="text-xs text-gray-500">{feeInfo.time}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    Estimated fee: <span className="font-semibold text-white">{estimatedFee} sats</span>
                    {btcPrice !== null && (
                      <span className="text-gray-500 text-xs ml-2">
                        (≈ {formatSatoshisAsUSD(estimatedFee, btcPrice)})
                      </span>
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Transaction Summary */}
          {amount && !amountError && !addressError && (
            <div className="mb-6 bg-gray-900 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Transaction Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <div className="text-right">
                    <span className="font-semibold text-white">{amount} sats</span>
                    {btcPrice !== null && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatSatoshisAsUSD(parseInt(amount, 10), btcPrice)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fee:</span>
                  <div className="text-right">
                    <span className="font-semibold text-white">{estimatedFee} sats</span>
                    {btcPrice !== null && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatSatoshisAsUSD(estimatedFee, btcPrice)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-t border-gray-700 pt-2">
                  <span className="text-gray-300 font-semibold">Total:</span>
                  <div className="text-right">
                    <span className="font-bold text-white">
                      {parseInt(amount, 10) + estimatedFee} sats
                    </span>
                    {btcPrice !== null && (
                      <p className="text-xs text-gray-500">
                        ≈ {formatSatoshisAsUSD(parseInt(amount, 10) + estimatedFee, btcPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={
              isSending ||
              isLoadingFees ||
              !toAddress ||
              !amount ||
              !!addressError ||
              !!amountError ||
              isBuilding
            }
            className="w-full bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] disabled:bg-gray-700 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
          >
            {isSending || isBuilding ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {isMultisigAccount ? 'Building PSBT...' : 'Sending...'}
              </>
            ) : (
              isMultisigAccount ? 'Create Multisig Transaction' : 'Send Transaction'
            )}
          </button>

          {/* Balance Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Available balance: <span className="font-semibold">{balance.confirmed} sats</span>
              {btcPrice !== null && (
                <span> (≈ {formatSatoshisAsUSD(balance.confirmed, btcPrice)})</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-xl p-6 w-80 mx-4">
            <h2 className="text-xl font-bold text-white mb-4">Unlock Wallet</h2>
            <p className="text-sm text-gray-400 mb-6">
              Your wallet is locked. Please enter your password to continue sending the transaction.
            </p>

            {/* Error Message */}
            {unlockError && (
              <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">{unlockError}</p>
              </div>
            )}

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && unlockPassword) {
                    handleUnlock();
                  }
                }}
                placeholder="Enter your password"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
              />
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockPassword(process.env.DEV_PASSWORD || '');
                  setUnlockError(null);
                }}
                disabled={isUnlocking}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnlock}
                disabled={isUnlocking || !unlockPassword}
                className="flex-1 px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors flex items-center justify-center"
              >
                {isUnlocking ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Unlocking...
                  </>
                ) : (
                  'Unlock'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PSBT Export Modal (for multisig) */}
      {showPSBTExport && psbtBase64 && (
        <PSBTExport
          psbtBase64={psbtBase64}
          onClose={() => {
            setShowPSBTExport(false);
            onSendSuccess();
            onBack();
          }}
        />
      )}

      {/* Xpub Address Picker Modal */}
      {showXpubAddressPicker && selectedXpubContact && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-xl p-6 w-[500px] max-h-[600px] mx-4 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-2">
              Select Address from {selectedXpubContact.name}
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Choose which address to send Bitcoin to from this contact's extended public key.
            </p>

            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                value={xpubAddressSearchQuery}
                onChange={(e) => setXpubAddressSearchQuery(e.target.value)}
                placeholder="Search addresses..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-bitcoin"
              />
            </div>

            {/* Address List */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {selectedXpubContact.cachedAddresses
                ?.filter((addr) =>
                  xpubAddressSearchQuery.trim()
                    ? addr.toLowerCase().includes(xpubAddressSearchQuery.toLowerCase())
                    : true
                )
                .map((address, index) => {
                  // Determine if address is external (receive) or internal (change)
                  const halfLength = selectedXpubContact.cachedAddresses!.length / 2;
                  const isExternal = index < halfLength;
                  const derivationIndex = isExternal ? index : index - halfLength;

                  return (
                    <button
                      key={address}
                      type="button"
                      onClick={() => handleSelectXpubAddress(address, selectedXpubContact)}
                      className="w-full text-left px-3 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-bitcoin rounded transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          #{index + 1} - {isExternal ? 'Receive' : 'Change'} #{derivationIndex}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-white break-all">{address}</p>
                    </button>
                  );
                })}
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => {
                setShowXpubAddressPicker(false);
                setSelectedXpubContact(null);
                setXpubAddressSearchQuery('');
              }}
              className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <AddEditContactModal
          isOpen={showAddContactModal}
          onClose={() => setShowAddContactModal(false)}
          onSave={handleSaveContact}
          contact={{
            id: '',
            name: '',
            address: toAddress,
            category: 'Payment',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }}
        />
      )}
    </div>
  );
};

export default SendScreen;
