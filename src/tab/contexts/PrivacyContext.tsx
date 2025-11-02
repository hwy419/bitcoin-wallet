/**
 * PrivacyContext - Global privacy mode state management
 *
 * Provides privacy mode toggle for concealing sensitive financial information
 * (balances, amounts) throughout the application.
 *
 * Features:
 * - Global privacy state persisted in chrome.storage.local
 * - Syncs across tabs using chrome.storage.onChanged
 * - Default: balances visible (balancesHidden: false)
 * - Accessible via usePrivacy() hook
 *
 * Storage:
 * - Key: privacy_settings
 * - Value: { balancesHidden: boolean }
 *
 * Usage:
 * // Wrap app
 * <PrivacyProvider>
 *   <App />
 * </PrivacyProvider>
 *
 * // Use in components
 * const { balancesHidden, togglePrivacy, setBalancesHidden } = usePrivacy();
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface PrivacySettings {
  balancesHidden: boolean;
}

interface PrivacyContextType {
  balancesHidden: boolean;
  togglePrivacy: () => void;
  setBalancesHidden: (hidden: boolean) => void;
}

// ============================================================================
// Context
// ============================================================================

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

// ============================================================================
// Storage Constants
// ============================================================================

const STORAGE_KEY = 'privacy_settings';
const DEFAULT_SETTINGS: PrivacySettings = {
  balancesHidden: false,
};

// ============================================================================
// Provider Component
// ============================================================================

interface PrivacyProviderProps {
  children: React.ReactNode;
}

export const PrivacyProvider: React.FC<PrivacyProviderProps> = ({ children }) => {
  const [balancesHidden, setBalancesHiddenState] = useState<boolean>(DEFAULT_SETTINGS.balancesHidden);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load privacy settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        const settings = result[STORAGE_KEY] as PrivacySettings | undefined;

        if (settings) {
          setBalancesHiddenState(settings.balancesHidden);
        }
      } catch (error) {
        console.error('[PrivacyContext] Failed to load privacy settings:', error);
        // Fallback to default
        setBalancesHiddenState(DEFAULT_SETTINGS.balancesHidden);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSettings();
  }, []);

  // Save privacy settings to storage whenever they change
  const saveSettings = useCallback(async (hidden: boolean) => {
    try {
      const settings: PrivacySettings = {
        balancesHidden: hidden,
      };
      await chrome.storage.local.set({ [STORAGE_KEY]: settings });
    } catch (error) {
      console.error('[PrivacyContext] Failed to save privacy settings:', error);
    }
  }, []);

  // Update local state and persist to storage
  const setBalancesHidden = useCallback((hidden: boolean) => {
    setBalancesHiddenState(hidden);
    saveSettings(hidden);
  }, [saveSettings]);

  // Toggle privacy mode
  const togglePrivacy = useCallback(() => {
    setBalancesHidden(!balancesHidden);
  }, [balancesHidden, setBalancesHidden]);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName !== 'local') return;

      const change = changes[STORAGE_KEY];
      if (change && change.newValue) {
        const settings = change.newValue as PrivacySettings;
        setBalancesHiddenState(settings.balancesHidden);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Don't render children until settings are loaded
  if (!isInitialized) {
    return null;
  }

  const value: PrivacyContextType = {
    balancesHidden,
    togglePrivacy,
    setBalancesHidden,
  };

  return (
    <PrivacyContext.Provider value={value}>
      {children}
    </PrivacyContext.Provider>
  );
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access privacy context
 *
 * @throws Error if used outside PrivacyProvider
 * @returns Privacy context with balancesHidden state and toggle functions
 */
export const usePrivacy = (): PrivacyContextType => {
  const context = useContext(PrivacyContext);

  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }

  return context;
};
