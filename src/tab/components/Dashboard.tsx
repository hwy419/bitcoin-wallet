import React, { useState, useEffect } from 'react';
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import { useBitcoinPrice } from '../hooks/useBitcoinPrice';
import { useContacts } from '../hooks/useContacts';
import { MessageType, WalletAccount, Balance, Address, Transaction, Contact } from '../../shared/types';
import { formatSatoshisAsUSD } from '../../shared/utils/price';
import SendScreen from './SendScreen';
import ReceiveScreen from './ReceiveScreen';
import SettingsScreen from './SettingsScreen';
import ContactsScreen from './ContactsScreen';
import PendingTransactionList from './PendingTransactions/PendingTransactionList';
import MultisigTransactionDetail from './PendingTransactions/MultisigTransactionDetail';
import { MultisigBadge } from './shared/MultisigBadge';
import { CoSignerList } from './shared/CoSignerList';
import { TransactionRow } from './shared/TransactionRow';
import { ImportBadge } from './shared/ImportBadge';
import AccountCreationModal from './AccountManagement/AccountCreationModal';
import ImportAccountModal from './AccountManagement/ImportAccountModal';
import Toast, { ToastType } from './shared/Toast';
import { BalanceChart } from './shared/BalanceChart';
import { TransactionDetailPane } from './shared/TransactionDetailPane';
import { SendModal } from './modals/SendModal';
import { ReceiveModal } from './modals/ReceiveModal';
import { LoadingState } from './shared/LoadingState';
import { ErrorDisplay } from './shared/ErrorDisplay';
import { Pagination } from './shared/Pagination';
import { FilterPanel, TransactionFilters } from './shared/FilterPanel';
import { PrivacyBalance } from './shared/PrivacyBalance';
import { ContactDetailPane } from './shared/ContactDetailPane';
import { AddEditContactModal } from './shared/AddEditContactModal';
import PSBTImport, { PSBTImportResult } from './PSBT/PSBTImport';
import PSBTReview from './PSBT/PSBTReview';

interface DashboardProps {
  accounts: WalletAccount[];
  currentAccountIndex: number;
  balance: Balance;
  onLock: () => void;
  onAccountsUpdate: (accounts: WalletAccount[]) => void;
  onNavigate: (view: 'dashboard' | 'multisig' | 'contacts' | 'settings') => void;
}

type DashboardView = 'main' | 'send' | 'receive' | 'settings' | 'contacts' | 'pending-tx-detail';

const Dashboard: React.FC<DashboardProps> = ({ accounts, currentAccountIndex: initialAccountIndex, balance: initialBalance, onLock, onAccountsUpdate, onNavigate }) => {
  const { sendMessage } = useBackgroundMessaging();
  const { price: btcPrice } = useBitcoinPrice();
  const { contacts, getContacts } = useContacts();

  const [currentAccountIndex, setCurrentAccountIndex] = useState(initialAccountIndex);
  const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Account Management Modal state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showImportAccountModal, setShowImportAccountModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  // Navigation state
  const [view, setView] = useState<DashboardView>('main');
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(undefined);

  // Balance state (managed locally to refresh independently)
  const [balance, setBalance] = useState<Balance>(initialBalance);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState<{ type: string; message: string } | null>(null);
  const [showSlowBalanceWarning, setShowSlowBalanceWarning] = useState(false);

  // Transaction history state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [transactionsError, setTransactionsError] = useState<{ type: string; message: string } | null>(null);
  const [showSlowTransactionsWarning, setShowSlowTransactionsWarning] = useState(false);

  // Removed old contact filter (now integrated in FilterPanel)

  // Pending transaction detail state
  const [selectedPendingTxId, setSelectedPendingTxId] = useState<string | null>(null);

  // Transaction detail pane state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailPaneOpen, setIsDetailPaneOpen] = useState(false);

  // Contact detail pane state
  const [selectedContactForPane, setSelectedContactForPane] = useState<Contact | null>(null);
  const [isContactDetailOpen, setIsContactDetailOpen] = useState(false);

  // Modal state for Send/Receive
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);

  // PSBT import state
  const [showPSBTImport, setShowPSBTImport] = useState(false);
  const [importedPSBT, setImportedPSBT] = useState<PSBTImportResult | null>(null);
  const [showPSBTReview, setShowPSBTReview] = useState(false);

  // Cosigner actions state
  const [showCosignerContactModal, setShowCosignerContactModal] = useState(false);
  const [cosignerForLinking, setCosignerForLinking] = useState<any | null>(null);
  const [cosignerQRData, setCosignerQRData] = useState<any | null>(null);

  // Address list pagination state
  const [addressCurrentPage, setAddressCurrentPage] = useState(1);
  const [addressItemsPerPage, setAddressItemsPerPage] = useState(10);

  // Transaction list pagination state
  const [transactionCurrentPage, setTransactionCurrentPage] = useState(1);
  const [transactionItemsPerPage, setTransactionItemsPerPage] = useState(10);

  // Transaction filter state
  const [filters, setFilters] = useState<TransactionFilters>({
    senderAddress: '',
    amountMin: null,
    amountMax: null,
    transactionHash: '',
    contactIds: [],
    tags: [],
    categories: [],
  });
  const [filterPanelExpanded, setFilterPanelExpanded] = useState(false);

  // Transaction metadata state
  const [transactionMetadata, setTransactionMetadata] = useState<{ [txid: string]: import('../../shared/types').TransactionMetadata }>({});

  const currentAccount = accounts[currentAccountIndex] || accounts[0];
  const isMultisigAccount = currentAccount?.accountType === 'multisig';

  // Sync currentAccountIndex with prop
  useEffect(() => {
    setCurrentAccountIndex(initialAccountIndex);
  }, [initialAccountIndex]);

  // Guard: If no current account, show loading or error
  if (!currentAccount) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <p className="text-white text-lg mb-2">Loading account...</p>
          <p className="text-gray-400 text-sm">If this persists, try unlocking your wallet again.</p>
        </div>
      </div>
    );
  }

  // Fetch balance when component mounts or account changes
  useEffect(() => {
    let slowWarningTimer: NodeJS.Timeout;

    const fetchBalance = async () => {
      if (!currentAccount) return;

      setIsLoadingBalance(true);
      setBalanceError(null);
      setShowSlowBalanceWarning(false);

      // Show "slow connection" warning after 3 seconds
      slowWarningTimer = setTimeout(() => {
        setShowSlowBalanceWarning(true);
      }, 3000);

      try {
        const newBalance = await sendMessage<Balance>(MessageType.GET_BALANCE, {
          accountIndex: currentAccount.index,
        });
        setBalance(newBalance);
        setBalanceError(null);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';

        // Map errors to user-friendly messages
        if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
          setBalanceError({
            type: 'PROXY_ERROR',
            message: 'Blockchain service temporarily unavailable. Please try again in a moment.'
          });
        } else if (errorMessage.includes('429')) {
          setBalanceError({
            type: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment and try again.'
          });
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          setBalanceError({
            type: 'TIMEOUT',
            message: 'Request timed out. Please check your internet connection and try again.'
          });
        } else {
          setBalanceError({
            type: 'NETWORK_ERROR',
            message: 'Network error. Please check your internet connection.'
          });
        }
      } finally {
        clearTimeout(slowWarningTimer);
        setIsLoadingBalance(false);
        setShowSlowBalanceWarning(false);
      }
    };

    fetchBalance();

    return () => clearTimeout(slowWarningTimer);
  }, [currentAccount, sendMessage]);

  // Fetch transactions when component mounts or account changes
  useEffect(() => {
    let slowWarningTimer: NodeJS.Timeout;

    const fetchTransactions = async () => {
      if (!currentAccount) return;

      setIsLoadingTransactions(true);
      setTransactionsError(null);
      setShowSlowTransactionsWarning(false);

      // Show "slow connection" warning after 3 seconds
      slowWarningTimer = setTimeout(() => {
        setShowSlowTransactionsWarning(true);
      }, 3000);

      try {
        const response = await sendMessage<{ transactions: Transaction[] }>(MessageType.GET_TRANSACTIONS, {
          accountIndex: currentAccount.index,
        });
        setTransactions(response.transactions || []);
        setTransactionsError(null);
      } catch (err) {
        console.error('Failed to fetch transactions:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';

        // Map errors to user-friendly messages
        if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
          setTransactionsError({
            type: 'PROXY_ERROR',
            message: 'Blockchain service temporarily unavailable. Please try again in a moment.'
          });
        } else if (errorMessage.includes('429')) {
          setTransactionsError({
            type: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment and try again.'
          });
        } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
          setTransactionsError({
            type: 'TIMEOUT',
            message: 'Request timed out. Please check your internet connection and try again.'
          });
        } else {
          setTransactionsError({
            type: 'NETWORK_ERROR',
            message: 'Network error. Please check your internet connection.'
          });
        }
        setTransactions([]);
      } finally {
        clearTimeout(slowWarningTimer);
        setIsLoadingTransactions(false);
        setShowSlowTransactionsWarning(false);
      }
    };

    fetchTransactions();

    return () => clearTimeout(slowWarningTimer);
  }, [currentAccount, sendMessage]);

  // Fetch contacts on mount
  useEffect(() => {
    getContacts();
  }, [getContacts]);

  // Fetch transaction metadata on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await sendMessage<{ metadata: { [txid: string]: import('../../shared/types').TransactionMetadata } }>(
          MessageType.GET_ALL_TRANSACTION_METADATA,
          {}
        );
        setTransactionMetadata(response.metadata || {});
      } catch (err) {
        console.error('Failed to fetch transaction metadata:', err);
        setTransactionMetadata({});
      }
    };

    fetchMetadata();
  }, [sendMessage]);

  // Reset address pagination when account changes
  useEffect(() => {
    setAddressCurrentPage(1);
  }, [currentAccount]);

  // Reset transaction pagination when filters change or account changes
  useEffect(() => {
    setTransactionCurrentPage(1);
  }, [filters, currentAccount]);

  // Retry balance fetch
  const retryBalanceFetch = async () => {
    if (!currentAccount) return;

    setIsLoadingBalance(true);
    setBalanceError(null);
    setShowSlowBalanceWarning(false);

    try {
      const newBalance = await sendMessage<Balance>(MessageType.GET_BALANCE, {
        accountIndex: currentAccount.index,
      });
      setBalance(newBalance);
      setBalanceError(null);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance';

      if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
        setBalanceError({
          type: 'PROXY_ERROR',
          message: 'Blockchain service temporarily unavailable. Please try again in a moment.'
        });
      } else if (errorMessage.includes('429')) {
        setBalanceError({
          type: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment and try again.'
        });
      } else {
        setBalanceError({
          type: 'NETWORK_ERROR',
          message: 'Network error. Please check your internet connection.'
        });
      }
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Retry transactions fetch
  const retryTransactionsFetch = async () => {
    if (!currentAccount) return;

    setIsLoadingTransactions(true);
    setTransactionsError(null);
    setShowSlowTransactionsWarning(false);

    try {
      const response = await sendMessage<{ transactions: Transaction[] }>(MessageType.GET_TRANSACTIONS, {
        accountIndex: currentAccount.index,
      });
      setTransactions(response.transactions || []);
      setTransactionsError(null);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions';

      if (errorMessage.includes('502') || errorMessage.includes('503') || errorMessage.includes('504')) {
        setTransactionsError({
          type: 'PROXY_ERROR',
          message: 'Blockchain service temporarily unavailable. Please try again in a moment.'
        });
      } else if (errorMessage.includes('429')) {
        setTransactionsError({
          type: 'RATE_LIMITED',
          message: 'Too many requests. Please wait a moment and try again.'
        });
      } else {
        setTransactionsError({
          type: 'NETWORK_ERROR',
          message: 'Network error. Please check your internet connection.'
        });
      }
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Refresh balance and transactions after successful send
  const handleSendSuccess = async () => {
    setIsLoadingBalance(true);
    setIsLoadingTransactions(true);
    try {
      const [newBalance, txResponse] = await Promise.all([
        sendMessage<Balance>(MessageType.GET_BALANCE, {
          accountIndex: currentAccount.index,
        }),
        sendMessage<{ transactions: Transaction[] }>(MessageType.GET_TRANSACTIONS, {
          accountIndex: currentAccount.index,
        }),
      ]);
      setBalance(newBalance);
      setTransactions(txResponse.transactions || []);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsLoadingBalance(false);
      setIsLoadingTransactions(false);
    }
  };

  // Handle navigation back to main view
  const handleBackToMain = () => {
    setView('main');
    setSelectedPendingTxId(null);
    setSelectedContactId(undefined);
  };

  // Handle contact click from transaction - open detail pane instead of navigating
  const handleContactClick = (contact: Contact) => {
    setSelectedContactForPane(contact);
    setIsContactDetailOpen(true);
  };

  // Handle close contact detail pane
  const handleCloseContactDetail = () => {
    setIsContactDetailOpen(false);
    setTimeout(() => setSelectedContactForPane(null), 300);
  };

  // Handle update contact from detail pane
  const handleUpdateContactFromPane = async (contact: Contact) => {
    try {
      await sendMessage(MessageType.UPDATE_CONTACT, {
        id: contact.id,
        updates: {
          name: contact.name,
          email: contact.email,
          notes: contact.notes,
          category: contact.category,
          tags: contact.tags,
        },
      });

      // Refresh contacts
      await getContacts();

      // Update selected contact
      const updatedContact = contacts.find(c => c.id === contact.id);
      if (updatedContact) {
        setSelectedContactForPane(updatedContact);
      }
    } catch (err) {
      console.error('Failed to update contact:', err);
      throw err;
    }
  };

  // Handle delete contact from detail pane
  const handleDeleteContactFromPane = async (contactId: string) => {
    try {
      await sendMessage(MessageType.DELETE_CONTACT, { id: contactId });
      setIsContactDetailOpen(false);
      setSelectedContactForPane(null);
      await getContacts();
    } catch (err) {
      console.error('Failed to delete contact:', err);
      throw err;
    }
  };

  // Handle cosigner link to contact
  const handleCosignerLinkContact = (cosigner: any) => {
    setCosignerForLinking(cosigner);
    setShowCosignerContactModal(true);
  };

  // Handle cosigner QR code display
  const handleCosignerShowQRCode = (cosigner: any) => {
    setCosignerQRData(cosigner);
    // TODO: Implement QR code modal
    alert(`QR Code for ${cosigner.name}\n\nFingerprint: ${cosigner.fingerprint}\nXpub: ${cosigner.xpub}\nDerivation: ${cosigner.derivationPath}`);
  };

  // Handle saving contact from cosigner link
  const handleSaveCosignerContact = async (contact: Contact) => {
    try {
      await sendMessage(MessageType.SAVE_CONTACT, contact);
      await getContacts();
      setShowCosignerContactModal(false);
      setCosignerForLinking(null);
      showToast('Contact saved successfully', 'success');
    } catch (err) {
      console.error('Failed to save contact:', err);
      showToast('Failed to save contact', 'error');
    }
  };

  // Handle transaction click to open detail pane
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailPaneOpen(true);
  };

  // Handle closing transaction detail pane
  const handleCloseTransactionDetail = () => {
    setIsDetailPaneOpen(false);
    // Delay clearing the transaction to allow animation to complete
    setTimeout(() => setSelectedTransaction(null), 300);
  };

  // Calculate paginated addresses
  const sortedAddresses = React.useMemo(() => {
    if (!currentAccount) return [];
    return currentAccount.addresses
      .filter((addr) => !addr.isChange) // Only show receiving addresses
      .slice()
      .reverse(); // Show newest first
  }, [currentAccount]);

  const paginatedAddresses = React.useMemo(() => {
    const startIndex = (addressCurrentPage - 1) * addressItemsPerPage;
    const endIndex = startIndex + addressItemsPerPage;
    return sortedAddresses.slice(startIndex, endIndex);
  }, [sortedAddresses, addressCurrentPage, addressItemsPerPage]);

  // Sort transactions: pending first, then newest to oldest
  const sortedTransactions = React.useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    return [...transactions].sort((a, b) => {
      // Pending transactions first (0 confirmations)
      const aPending = a.confirmations === 0;
      const bPending = b.confirmations === 0;

      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      // Both pending or both confirmed: sort by timestamp (newest first)
      return b.timestamp - a.timestamp;
    });
  }, [transactions]);

  // Filter transactions based on active filters
  const filteredTransactions = React.useMemo(() => {
    let result = sortedTransactions;
    const myAddresses = currentAccount?.addresses.map(a => a.address) || [];

    // Filter by sender address (exact match, case-insensitive)
    if (filters.senderAddress) {
      const searchAddress = filters.senderAddress.toLowerCase();
      result = result.filter((tx) => {
        return tx.inputs.some((input) => input.address.toLowerCase() === searchAddress);
      });
    }

    // Filter by amount range (absolute value)
    if (filters.amountMin !== null || filters.amountMax !== null) {
      result = result.filter((tx) => {
        const absoluteValue = Math.abs(tx.value);
        const btcValue = absoluteValue / 100000000; // Convert satoshis to BTC

        if (filters.amountMin !== null && btcValue < filters.amountMin) {
          return false;
        }
        if (filters.amountMax !== null && btcValue > filters.amountMax) {
          return false;
        }
        return true;
      });
    }

    // Filter by transaction hash (partial match, case-insensitive)
    if (filters.transactionHash) {
      const searchHash = filters.transactionHash.toLowerCase();
      result = result.filter((tx) => tx.txid.toLowerCase().includes(searchHash));
    }

    // Filter by contact IDs
    if (filters.contactIds.length > 0) {
      // Build a map of contact addresses (including cached addresses for xpub contacts)
      const contactAddressMap = new Map<string, string>(); // address -> contactId
      contacts.forEach(contact => {
        if (filters.contactIds.includes(contact.id)) {
          if (contact.address) {
            contactAddressMap.set(contact.address, contact.id);
          }
          if (contact.cachedAddresses) {
            contact.cachedAddresses.forEach(addr => {
              contactAddressMap.set(addr, contact.id);
            });
          }
        }
      });

      result = result.filter(tx => {
        // Check if any input or output involves a selected contact
        const hasContactInput = tx.inputs.some(input => contactAddressMap.has(input.address));
        const hasContactOutput = tx.outputs.some(output =>
          contactAddressMap.has(output.address) && !myAddresses.includes(output.address)
        );
        return hasContactInput || hasContactOutput;
      });
    }

    // Filter by tags (transaction must have at least one of the selected tags)
    if (filters.tags.length > 0) {
      result = result.filter(tx => {
        const metadata = transactionMetadata[tx.txid];
        if (!metadata || !metadata.tags) return false;
        return metadata.tags.some(tag => filters.tags.includes(tag));
      });
    }

    // Filter by categories (transaction must have one of the selected categories)
    if (filters.categories.length > 0) {
      result = result.filter(tx => {
        const metadata = transactionMetadata[tx.txid];
        if (!metadata || !metadata.category) return false;
        return filters.categories.includes(metadata.category);
      });
    }

    return result;
  }, [sortedTransactions, filters, contacts, currentAccount, transactionMetadata]);

  const finalFilteredTransactions = filteredTransactions;

  // Paginate filtered transactions
  const paginatedTransactions = React.useMemo(() => {
    const startIndex = (transactionCurrentPage - 1) * transactionItemsPerPage;
    const endIndex = startIndex + transactionItemsPerPage;
    return finalFilteredTransactions.slice(startIndex, endIndex);
  }, [finalFilteredTransactions, transactionCurrentPage, transactionItemsPerPage]);

  // Removed clearContactFilter (now handled by FilterPanel)

  // Handle account creation success
  const handleAccountCreated = (account: WalletAccount) => {
    // Add account to list
    const updatedAccounts = [...accounts, account];
    onAccountsUpdate(updatedAccounts);

    // Select the new account
    setCurrentAccountIndex(updatedAccounts.length - 1);

    // Show success toast
    setToast({
      message: `Account "${account.name}" created successfully`,
      type: 'success',
    });

    // Refresh balance and transactions for new account
    handleSendSuccess();
  };

  // Handle account import success
  const handleAccountImported = (account: WalletAccount) => {
    // Add account to list
    const updatedAccounts = [...accounts, account];
    onAccountsUpdate(updatedAccounts);

    // Select the imported account
    setCurrentAccountIndex(updatedAccounts.length - 1);

    // Show success toast with import reminder
    setToast({
      message: `Account "${account.name}" imported successfully. Remember to back up this account separately!`,
      type: 'success',
    });

    // Refresh balance and transactions for imported account
    handleSendSuccess();
  };

  // Handle selecting a pending transaction
  const handleSelectPendingTx = (txid: string) => {
    setSelectedPendingTxId(txid);
    setView('pending-tx-detail');
  };

  // Handle PSBT imported
  const handlePSBTImported = async (result: PSBTImportResult) => {
    setImportedPSBT(result);
    setShowPSBTImport(false);
    setShowPSBTReview(true);
  };

  // Handle PSBT review complete
  const handlePSBTReviewComplete = () => {
    setShowPSBTReview(false);
    setImportedPSBT(null);
    // Refresh balance and transactions
    handleSendSuccess();
  };

  const handleGenerateAddress = async () => {
    setError(null);
    setIsGeneratingAddress(true);

    try {
      const response = await sendMessage<{ address: Address }>(
        MessageType.GENERATE_ADDRESS,
        { accountIndex: currentAccount.index }
      );

      // Update accounts with new address
      const updatedAccounts = accounts.map((account) => {
        if (account.index === currentAccount.index) {
          return {
            ...account,
            addresses: [...account.addresses, response.address],
            externalIndex: account.externalIndex + 1,
          };
        }
        return account;
      });

      onAccountsUpdate(updatedAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate address');
    } finally {
      setIsGeneratingAddress(false);
    }
  };

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      setError('Failed to copy address');
    }
  };

  const formatBTC = (satoshis: number): string => {
    return (satoshis / 100000000).toFixed(8);
  };

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const getTransactionType = (tx: Transaction): 'receive' | 'send' => {
    const myAddresses = currentAccount?.addresses.map(a => a.address) || [];

    // If any inputs belong to our addresses, we're spending (sending)
    const hasMyInputs = tx.inputs.some(input => myAddresses.includes(input.address));

    if (hasMyInputs) {
      return 'send';
    }

    // No inputs from us, but outputs to us means we're receiving
    return 'receive';
  };

  const shortTxid = (txid: string): string => {
    return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
  };

  // Conditional rendering for different views

  // Pending Transaction Detail
  if (view === 'pending-tx-detail' && selectedPendingTxId) {
    return (
      <MultisigTransactionDetail
        txid={selectedPendingTxId}
        onBack={handleBackToMain}
        onDeleted={handleBackToMain}
      />
    );
  }

  if (view === 'send') {
    return (
      <SendScreen
        account={currentAccount}
        balance={balance}
        onBack={handleBackToMain}
        onSendSuccess={handleSendSuccess}
      />
    );
  }

  if (view === 'receive') {
    return <ReceiveScreen account={currentAccount} onBack={handleBackToMain} />;
  }

  if (view === 'settings') {
    return (
      <SettingsScreen
        accounts={accounts}
        onBack={handleBackToMain}
        onAccountsUpdate={onAccountsUpdate}
        onLock={onLock}
      />
    );
  }

  if (view === 'contacts') {
    return (
      <ContactsScreen
        onBack={handleBackToMain}
        selectedContactId={selectedContactId}
        currentAccount={currentAccount}
      />
    );
  }

  // Main dashboard view
  return (
    <div className="w-full h-full bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white">Digital Treasury</h1>
              {isMultisigAccount && (
                <MultisigBadge config={currentAccount.multisigConfig} size="md" />
              )}
            </div>
            <p className="text-sm text-gray-500">
              {currentAccount?.name || 'Account 1'} • {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
        {/* Multisig Info Banner */}
        {isMultisigAccount && (
          <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-purple-700/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-white mb-1">Multisig Account</h3>
                <p className="text-sm text-purple-300/80 mb-3">
                  This is a {currentAccount.multisigConfig} multisig account. Transactions require {currentAccount.multisigConfig.split('-of-')[0]} signatures to spend funds.
                </p>
                <div className="flex items-center gap-2 text-xs text-purple-400">
                  <span className="px-2 py-1 bg-purple-500/15 border border-purple-500/30 rounded font-mono">
                    {currentAccount.addressType.toUpperCase()}
                  </span>
                  <span>•</span>
                  <span>{currentAccount.cosigners.length} Co-signers</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Card and Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 mb-6">
          {/* Balance Card - 40% on large screens */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-gray-850 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg h-full flex flex-col">
              {/* Balance Info */}
              <div className="flex-1 flex flex-col justify-center text-center">
                {/* Bitcoin Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-36 h-36 rounded-full bg-bitcoin/10 flex items-center justify-center">
                    <svg className="w-20 h-20 text-bitcoin" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z"/>
                    </svg>
                  </div>
                </div>

                <p className="text-sm text-gray-400 mb-2">Total Balance</p>
                {isLoadingBalance ? (
                  <div className="py-4">
                    <LoadingState message="Fetching balance..." showSlowWarning={showSlowBalanceWarning} />
                  </div>
                ) : balanceError ? (
                  <div className="py-2">
                    <ErrorDisplay
                      type={balanceError.type as any}
                      message={balanceError.message}
                      onRetry={retryBalanceFetch}
                      showReassurance={false}
                    />
                  </div>
                ) : (
                  <>
                    <PrivacyBalance
                      amount={balance.confirmed / 100000000}
                      usdValue={btcPrice !== null ? (balance.confirmed / 100000000) * btcPrice : undefined}
                      showUsd={btcPrice !== null}
                      size="lg"
                      clickable={true}
                      className="mb-1"
                    />
                    {balance.unconfirmed !== 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {balance.unconfirmed > 0 ? '+' : ''}{formatBTC(balance.unconfirmed)} BTC {balance.unconfirmed > 0 ? 'incoming' : 'pending'}
                      </p>
                    )}
                    <p className="text-xs text-bitcoin mt-2 font-medium">Testnet</p>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setShowSendModal(true)}
                  className="bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
                >
                  Send
                </button>
                <button
                  onClick={() => setShowReceiveModal(true)}
                  className="bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200"
                >
                  Receive
                </button>
              </div>
            </div>
          </div>

          {/* Balance History Chart - 60% on large screens */}
          <div className="lg:col-span-6">
            <BalanceChart
              accountIndex={currentAccount.index}
              currentBalance={balance.confirmed}
              btcPrice={btcPrice}
            />
          </div>
        </div>

        {/* Co-Signers Section (Multisig Only) */}
        {isMultisigAccount && (
          <div className="mb-6 bg-gray-850 border border-gray-700 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Co-Signers</h3>
              <button
                onClick={() => setShowPSBTImport(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg font-semibold transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-8" />
                </svg>
                Import PSBT to Sign
              </button>
            </div>
            <CoSignerList
              cosigners={currentAccount.cosigners}
              layout="horizontal"
              contacts={contacts}
              onLinkContact={handleCosignerLinkContact}
              onShowQRCode={handleCosignerShowQRCode}
            />
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-gray-850 border border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Transaction History</h3>
          </div>

          {/* Filter Panel */}
          <div className="mb-4">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              isExpanded={filterPanelExpanded}
              onToggleExpanded={() => setFilterPanelExpanded(!filterPanelExpanded)}
              network={currentAccount?.network || 'testnet'}
              contacts={contacts}
            />
          </div>

          {/* Transaction List */}
          {isLoadingTransactions ? (
            <LoadingState message="Fetching transactions..." showSlowWarning={showSlowTransactionsWarning} />
          ) : transactionsError ? (
            <ErrorDisplay
              type={transactionsError.type as any}
              message={transactionsError.message}
              onRetry={retryTransactionsFetch}
              showReassurance={false}
            />
          ) : finalFilteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              {filters.senderAddress || filters.transactionHash || filters.amountMin !== null || filters.amountMax !== null || filters.contactIds.length > 0 || filters.tags.length > 0 || filters.categories.length > 0 ? (
                <>
                  <p className="text-sm text-gray-500 mb-2">
                    No transactions found. Try adjusting your filters.
                  </p>
                  {(filters.senderAddress || filters.transactionHash || filters.amountMin !== null || filters.amountMax !== null) && (
                    <button
                      onClick={() => setFilters({ senderAddress: '', amountMin: null, amountMax: null, transactionHash: '' })}
                      className="text-sm text-bitcoin hover:text-bitcoin-hover transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No transactions yet. Receive Bitcoin to get started.</p>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedTransactions.map((tx) => (
                  <TransactionRow
                    key={tx.txid}
                    transaction={tx}
                    currentAddresses={currentAccount?.addresses.map(a => a.address) || []}
                    contacts={contacts}
                    onClick={handleTransactionClick}
                    onContactClick={handleContactClick}
                    btcPrice={btcPrice}
                    metadata={transactionMetadata[tx.txid]}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              <Pagination
                totalItems={finalFilteredTransactions.length}
                itemsPerPage={transactionItemsPerPage}
                currentPage={transactionCurrentPage}
                onPageChange={setTransactionCurrentPage}
                onItemsPerPageChange={setTransactionItemsPerPage}
                itemType="transactions"
              />
            </>
          )}
        </div>

        {/* Addresses Section */}
        <div className="mt-6 bg-gray-850 border border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Addresses</h3>
            {currentAccount?.importType === 'private-key' ? (
              <div className="text-xs text-gray-500 bg-gray-900 px-3 py-1.5 rounded border border-gray-700">
                Single address only
              </div>
            ) : (
              <button
                onClick={handleGenerateAddress}
                disabled={isGeneratingAddress}
                className="text-sm text-bitcoin hover:text-bitcoin-hover font-semibold disabled:opacity-50 transition-colors"
              >
                {isGeneratingAddress ? 'Generating...' : '+ Generate New'}
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Info message for imported private key accounts */}
          {currentAccount?.importType === 'private-key' && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm text-yellow-200 font-semibold mb-1">Imported Private Key</p>
                  <p className="text-xs text-yellow-300/80">
                    This account was imported from a private key and can only have one address.
                    To use multiple addresses for better privacy, create an HD account from your seed phrase.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Address List */}
          <div className="space-y-3">
            {paginatedAddresses.map((addr, index) => {
              // First address on page 1 is the most recent
              const isMostRecent = index === 0 && addressCurrentPage === 1;

              return (
                <div
                  key={addr.address}
                  className={`relative flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                    isMostRecent
                      ? 'bg-gray-850 border-l-4 border-bitcoin ring-1 ring-bitcoin/20'
                      : 'bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-gray-500">
                        Address #{sortedAddresses.length - ((addressCurrentPage - 1) * addressItemsPerPage + index)}
                      </p>
                      {isMostRecent && (
                        <span className="inline-flex items-center gap-1 bg-bitcoin/15 border border-bitcoin/40 text-bitcoin-light text-xs font-semibold px-2.5 py-1 rounded-full">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Most Recent
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-mono text-gray-300 truncate">{addr.address}</p>
                    {addr.used && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-bitcoin-subtle text-bitcoin-light border border-bitcoin-light/30 text-xs rounded">
                        Used
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopyAddress(addr.address)}
                    className="ml-3 p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
                    title="Copy Address"
                    aria-label={`Copy address ${addr.address}`}
                  >
                    {copiedAddress === addr.address ? (
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
              );
            })}

            {sortedAddresses.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">No addresses yet</p>
            )}
          </div>

          {/* Pagination Controls */}
          <Pagination
            totalItems={sortedAddresses.length}
            itemsPerPage={addressItemsPerPage}
            currentPage={addressCurrentPage}
            onPageChange={setAddressCurrentPage}
            onItemsPerPageChange={setAddressItemsPerPage}
            itemType="addresses"
          />
        </div>

        {/* Pending Multisig Transactions (only for multisig accounts) */}
        {isMultisigAccount && (
          <div className="mt-6 bg-gray-850 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Pending Transactions</h3>
            <PendingTransactionList
              accountIndex={currentAccount.index}
              onSelectTransaction={handleSelectPendingTx}
            />
          </div>
        )}
      </div>

      {/* Account Creation Modal */}
      <AccountCreationModal
        isOpen={showCreateAccountModal}
        onClose={() => setShowCreateAccountModal(false)}
        onSuccess={handleAccountCreated}
      />

      {/* Import Account Modal */}
      <ImportAccountModal
        isOpen={showImportAccountModal}
        onClose={() => setShowImportAccountModal(false)}
        onSuccess={handleAccountImported}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={toast.type === 'success' ? 5000 : 7000}
        />
      )}

      {/* Transaction Detail Pane */}
      <TransactionDetailPane
        transaction={selectedTransaction}
        isOpen={isDetailPaneOpen}
        onClose={handleCloseTransactionDetail}
        btcPrice={btcPrice}
        contacts={contacts}
      />

      {/* Send Modal */}
      <SendModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        account={currentAccount}
        balance={balance}
        onSendSuccess={handleSendSuccess}
      />

      {/* Receive Modal */}
      <ReceiveModal
        isOpen={showReceiveModal}
        onClose={() => setShowReceiveModal(false)}
        account={currentAccount}
      />

      {/* Contact Detail Pane */}
      <ContactDetailPane
        contact={selectedContactForPane}
        isOpen={isContactDetailOpen}
        onClose={handleCloseContactDetail}
        onUpdate={handleUpdateContactFromPane}
        onDelete={handleDeleteContactFromPane}
        currentAccount={currentAccount}
      />

      {/* PSBT Import Modal */}
      {showPSBTImport && (
        <PSBTImport
          onImported={handlePSBTImported}
          onCancel={() => setShowPSBTImport(false)}
        />
      )}

      {/* Cosigner Contact Link Modal */}
      {showCosignerContactModal && cosignerForLinking && (
        <AddEditContactModal
          isOpen={showCosignerContactModal}
          onClose={() => {
            setShowCosignerContactModal(false);
            setCosignerForLinking(null);
          }}
          contact={{
            id: '',
            name: cosignerForLinking.name,
            xpub: cosignerForLinking.xpub,
            xpubFingerprint: cosignerForLinking.fingerprint,
            xpubDerivationPath: cosignerForLinking.derivationPath,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          } as Contact}
          onSave={handleSaveCosignerContact}
        />
      )}

      {/* PSBT Review Modal */}
      {showPSBTReview && importedPSBT && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-gray-850 border border-gray-700 rounded-xl shadow-2xl max-w-3xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 bg-gray-850 border-b border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-white">Review Imported PSBT</h2>
                <p className="text-sm text-gray-400 mt-1">Review and sign this transaction</p>
              </div>
              <button
                onClick={() => {
                  setShowPSBTReview(false);
                  setImportedPSBT(null);
                }}
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
              <PSBTReview
                psbtBase64={importedPSBT.psbtBase64}
                accountIndex={currentAccount.index}
                signaturesCollected={importedPSBT.signaturesCollected}
                signaturesRequired={importedPSBT.signaturesRequired}
                metadata={importedPSBT.metadata}
                signatureStatus={{}}
                onComplete={handlePSBTReviewComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
