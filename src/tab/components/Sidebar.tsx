import React, { useState, useEffect, useRef } from 'react';
import { WalletAccount } from '../../shared/types';
import { ImportBadge } from './shared/ImportBadge';
import { MultisigBadge } from './shared/MultisigBadge';
import { groupAccounts } from '../../shared/utils/accountUtils';

interface SidebarProps {
  currentView: 'dashboard' | 'multisig' | 'contacts' | 'settings';
  onNavigate: (view: 'dashboard' | 'multisig' | 'contacts' | 'settings') => void;
  accounts: WalletAccount[];
  currentAccountIndex: number;
  onAccountSwitch: (index: number) => void;
  onCreateAccount: () => void;
  onImportAccount: () => void;
  onCreateMultisig: () => void;
  onLock?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  accounts,
  currentAccountIndex,
  onAccountSwitch,
  onCreateAccount,
  onImportAccount,
  onCreateMultisig,
  onLock,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const currentAccount = accounts[currentAccountIndex] || accounts[0];

  // Click outside detection
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen]);

  // Main navigation items
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Digital Treasury',
      icon: '₿',
      description: 'View your Bitcoin holdings'
    },
    {
      id: 'contacts' as const,
      label: 'Address Book',
      icon: '👥',
      description: 'Manage your saved Bitcoin addresses'
    },
  ];

  return (
    <div className="w-60 h-full bg-gray-900 border-r border-gray-750 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-750">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-bitcoin to-bitcoin-active flex items-center justify-center text-gray-950 font-bold text-lg">
            ₿
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">Bitcoin Wallet</h1>
            <p className="text-gray-400 text-xs">Testnet</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${isActive
                  ? 'bg-bitcoin text-gray-950 shadow-glow-bitcoin font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }
              `}
              title={item.description}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gray-950"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Account Switcher */}
      <div className="border-t border-gray-750 p-4">
        <div className="relative">
          {/* Trigger Button */}
          <button
            ref={triggerRef}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup="true"
            aria-label="Account switcher"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
              bg-gray-800 hover:bg-gray-750 transition-all duration-200
              border border-gray-700 hover:border-bitcoin/30"
            title="Switch account"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
              flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
              {currentAccount?.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-sm font-medium truncate">{currentAccount?.name}</p>
              <p className="text-gray-400 text-xs">Click to switch</p>
            </div>
            <svg
              className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Panel */}
          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              role="menu"
              aria-label="Account management menu"
              className="absolute bottom-full left-0 ml-2 mb-2 w-64
                bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50
                py-2"
            >
              {/* Grouped Account List */}
              <div className="max-h-[320px] overflow-y-auto py-2">
                {(() => {
                  const { hdAccounts, importedAccounts, multisigAccounts } = groupAccounts(accounts);

                  // Render account button helper
                  const renderAccountButton = (account: WalletAccount, index: number) => (
                    <button
                      key={account.index}
                      onClick={() => {
                        onAccountSwitch(index);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left transition-all duration-200
                        ${currentAccountIndex === index
                          ? 'bg-bitcoin-subtle border-l-2 border-bitcoin'
                          : 'hover:bg-gray-750'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-bitcoin-light to-bitcoin
                            flex items-center justify-center text-gray-950 font-bold text-sm flex-shrink-0">
                            {account.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-white text-sm truncate">
                                {account.name}
                              </span>
                              {account.accountType === 'multisig' && (
                                <MultisigBadge config={account.multisigConfig} size="sm" />
                              )}
                            </div>
                            <div className="text-xs text-gray-400 capitalize">
                              {account.accountType === 'multisig'
                                ? account.addressType.toUpperCase()
                                : account.addressType.replace('-', ' ')
                              }
                            </div>
                          </div>
                        </div>
                        {currentAccountIndex === index && (
                          <svg className="w-5 h-5 text-bitcoin flex-shrink-0 ml-2"
                            fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </button>
                  );

                  return (
                    <>
                      {/* HD Accounts Section */}
                      {hdAccounts.length > 0 && (
                        <>
                          <div className="px-4 py-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              HD Accounts
                            </h3>
                          </div>
                          {hdAccounts.map((account) => {
                            const index = accounts.findIndex(a => a.index === account.index);
                            return renderAccountButton(account, index);
                          })}
                        </>
                      )}

                      {/* Imported Accounts Section */}
                      {importedAccounts.length > 0 && (
                        <>
                          {hdAccounts.length > 0 && <div className="border-t border-gray-700 my-2"></div>}
                          <div className="px-4 py-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Imported Accounts
                            </h3>
                          </div>
                          {importedAccounts.map((account) => {
                            const index = accounts.findIndex(a => a.index === account.index);
                            return renderAccountButton(account, index);
                          })}
                        </>
                      )}

                      {/* Multisig Accounts Section */}
                      {multisigAccounts.length > 0 && (
                        <>
                          {(hdAccounts.length > 0 || importedAccounts.length > 0) &&
                            <div className="border-t border-gray-700 my-2"></div>}
                          <div className="px-4 py-2">
                            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                              Multisig Accounts
                            </h3>
                          </div>
                          {multisigAccounts.map((account) => {
                            const index = accounts.findIndex(a => a.index === account.index);
                            return renderAccountButton(account, index);
                          })}
                        </>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Divider */}
              <div className="border-t border-gray-700 my-2"></div>

              {/* Action Buttons */}
              <div className="px-2 space-y-2">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onCreateAccount();
                  }}
                  className="w-full px-4 py-3 bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active
                    text-white rounded-lg font-semibold transition-all duration-200
                    flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onImportAccount();
                  }}
                  className="w-full px-4 py-3 bg-gray-850 hover:bg-gray-800
                    text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600
                    rounded-lg font-semibold transition-colors duration-200
                    flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Import Account</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onCreateMultisig();
                  }}
                  className="w-full px-4 py-3 bg-gray-850 hover:bg-gray-800
                    text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600
                    rounded-lg font-semibold transition-colors duration-200
                    flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Multisig Account</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help and Lock buttons */}
        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-400
              hover:text-white hover:bg-gray-800 transition-all duration-200
              border border-gray-750 hover:border-gray-700"
            title="Help & Documentation"
          >
            Help
          </button>
          <button
            onClick={onLock}
            className="flex-1 px-3 py-2 rounded-lg text-xs text-gray-400
              hover:text-white hover:bg-gray-800 transition-all duration-200
              border border-gray-750 hover:border-gray-700"
            title="Lock wallet"
          >
            🔒 Lock
          </button>
        </div>

        {/* Settings button */}
        <button
          onClick={() => onNavigate('settings')}
          className={`
            w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg mt-2
            text-xs transition-all duration-200
            border border-gray-750 hover:border-gray-700
            ${currentView === 'settings'
              ? 'text-white bg-gray-800'
              : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }
          `}
          title="Wallet preferences"
        >
          <span>⚙️</span>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
