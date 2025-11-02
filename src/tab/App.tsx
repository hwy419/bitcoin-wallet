import React, { useState, useEffect } from 'react';
import { useBackgroundMessaging } from './hooks/useBackgroundMessaging';
import { MessageType, WalletAccount, Balance } from '../shared/types';
import WalletSetup from './components/WalletSetup';
import UnlockScreen from './components/UnlockScreen';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import ContactsScreen from './components/ContactsScreen';
import SettingsScreen from './components/SettingsScreen';
import { MultisigWizard } from './components/MultisigSetup/MultisigWizard';
import AccountCreationModal from './components/AccountManagement/AccountCreationModal';
import ImportAccountModal from './components/AccountManagement/ImportAccountModal';

type AppState = 'loading' | 'setup' | 'locked' | 'unlocked';
type AppView = 'dashboard' | 'multisig' | 'contacts' | 'settings';

const App: React.FC = () => {
  const { sendMessage } = useBackgroundMessaging();

  const [appState, setAppState] = useState<AppState>('loading');
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [balance, setBalance] = useState<Balance>({ confirmed: 0, unconfirmed: 0 });
  const [error, setError] = useState<string | null>(null);

  // Account management modal state
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [showImportAccountModal, setShowImportAccountModal] = useState(false);

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Check wallet state on mount
  useEffect(() => {
    checkWalletState();
  }, []);

  const checkWalletState = async () => {
    try {
      const response = await sendMessage<{
        isInitialized: boolean;
        isLocked: boolean;
        accounts?: WalletAccount[];
        balance?: Balance;
      }>(
        MessageType.GET_WALLET_STATE
      );

      if (!response.isInitialized) {
        setAppState('setup');
      } else if (response.isLocked) {
        setAppState('locked');
      } else {
        // Wallet is unlocked (can happen when tab is refreshed while wallet is unlocked)
        if (response.accounts) {
          setAccounts(response.accounts);
        }
        if (response.balance) {
          setBalance(response.balance);
        }
        setAppState('unlocked');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check wallet state');
      setAppState('setup'); // Default to setup on error
    }
  };

  const handleSetupComplete = () => {
    // Wallet created/imported, now locked
    setAppState('locked');
  };

  const handleUnlock = (unlockedAccounts: WalletAccount[], unlockedBalance: Balance) => {
    setAccounts(unlockedAccounts);
    setBalance(unlockedBalance);
    setAppState('unlocked');
  };

  const handleLock = async () => {
    try {
      await sendMessage(MessageType.LOCK_WALLET);
      setAccounts([]);
      setBalance({ confirmed: 0, unconfirmed: 0 });
      setAppState('locked');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to lock wallet');
    }
  };

  const handleAccountsUpdate = (updatedAccounts: WalletAccount[]) => {
    setAccounts(updatedAccounts);
  };

  const handleAccountSwitch = (index: number) => {
    setCurrentAccountIndex(index);
  };

  const handleCreateAccount = () => {
    setShowCreateAccountModal(true);
  };

  const handleImportAccount = () => {
    setShowImportAccountModal(true);
  };

  const handleCreateMultisig = () => {
    setCurrentView('multisig');
  };

  const handleAccountCreated = (account: WalletAccount) => {
    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    setCurrentAccountIndex(updatedAccounts.length - 1);
    setShowCreateAccountModal(false);
  };

  const handleAccountImported = (account: WalletAccount) => {
    const updatedAccounts = [...accounts, account];
    setAccounts(updatedAccounts);
    setCurrentAccountIndex(updatedAccounts.length - 1);
    setShowImportAccountModal(false);
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading wallet...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
        <div className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => {
              setError(null);
              checkWalletState();
            }}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 active:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-850"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Setup: Wallet not initialized
  if (appState === 'setup') {
    return <WalletSetup onSetupComplete={handleSetupComplete} />;
  }

  // Locked: Wallet initialized but locked
  if (appState === 'locked') {
    return <UnlockScreen onUnlock={handleUnlock} />;
  }

  // Unlocked: Show sidebar layout with current view
  return (
    <div className="w-full h-full flex bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        accounts={accounts}
        currentAccountIndex={currentAccountIndex}
        onAccountSwitch={handleAccountSwitch}
        onCreateAccount={handleCreateAccount}
        onImportAccount={handleImportAccount}
        onCreateMultisig={handleCreateMultisig}
        onLock={handleLock}
      />

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        {currentView === 'dashboard' && (
          <Dashboard
            accounts={accounts}
            currentAccountIndex={currentAccountIndex}
            balance={balance}
            onLock={handleLock}
            onAccountsUpdate={handleAccountsUpdate}
            onNavigate={setCurrentView}
          />
        )}
        {currentView === 'multisig' && (
          <MultisigWizard
            onComplete={() => {
              // Refresh accounts and navigate back to dashboard
              setCurrentView('dashboard');
              // TODO: Refresh accounts list
            }}
            onCancel={() => setCurrentView('dashboard')}
          />
        )}
        {currentView === 'contacts' && (
          <ContactsScreen
            onBack={() => setCurrentView('dashboard')}
            currentAccount={accounts[0]}
          />
        )}
        {currentView === 'settings' && (
          <SettingsScreen
            accounts={accounts}
            onBack={() => setCurrentView('dashboard')}
            onAccountsUpdate={handleAccountsUpdate}
            onLock={handleLock}
          />
        )}
      </div>

      {/* Account Management Modals */}
      <AccountCreationModal
        isOpen={showCreateAccountModal}
        onClose={() => setShowCreateAccountModal(false)}
        onSuccess={handleAccountCreated}
      />

      <ImportAccountModal
        isOpen={showImportAccountModal}
        onClose={() => setShowImportAccountModal(false)}
        onSuccess={handleAccountImported}
      />
    </div>
  );
};

export default App;
