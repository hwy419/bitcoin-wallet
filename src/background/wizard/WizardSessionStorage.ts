/**
 * WizardSessionStorage - Manages wizard session state
 *
 * This module manages persistent storage of wizard session data in chrome.storage.local.
 * It ensures only one wizard session can be active at a time and provides session recovery.
 *
 * Key Features:
 * - Single wizard session enforcement (stores active tab ID)
 * - Session recovery on page reload
 * - Auto-cleanup on completion or tab close
 * - Comprehensive session state management
 *
 * IMPORTANT: This is for wizard session state only, not wallet data.
 * Wallet data is managed by WalletStorage.
 */

import type { MultisigConfig, MultisigAddressType, Cosigner } from '../../shared/types';

/**
 * Storage key for wizard session data in chrome.storage.local
 */
const WIZARD_SESSION_KEY = 'wizardSession';

/**
 * Wizard session data structure
 */
export interface WizardSessionData {
  tabId: number;                                    // Active wizard tab ID
  currentStep: number;                              // Current step (1-7)
  state: {
    selectedConfig: MultisigConfig | null;         // Step 1: Config selection
    selectedAddressType: MultisigAddressType | null; // Step 2: Address type
    myXpub: string | null;                          // Step 3: Our xpub
    myFingerprint: string | null;                   // Step 3: Our fingerprint
    cosignerXpubs: Cosigner[];                      // Step 4: Imported cosigners
    firstAddress: string | null;                    // Step 5: Generated address
    accountName: string;                            // Step 6: Account name
    addressVerified: boolean;                       // Step 5: Address verified flag
  };
  createdAt: number;                                // Creation timestamp
  updatedAt: number;                                // Last update timestamp
}

/**
 * WizardSessionStorage class for managing wizard session persistence
 *
 * All methods are static as this is a storage utility class.
 */
export class WizardSessionStorage {
  /**
   * Creates a new wizard session
   *
   * @param tabId - Chrome tab ID where wizard is running
   * @returns Created session data
   *
   * @throws {Error} If a wizard session already exists with an open tab
   */
  static async createSession(tabId: number): Promise<WizardSessionData> {
    try {
      // Check for existing active session
      const existingSession = await this.getSession();

      if (existingSession) {
        // Check if the tab is still open
        const tabExists = await this.isTabOpen(existingSession.tabId);

        if (tabExists) {
          throw new Error('A wizard session is already active in another tab');
        }

        // Old session with closed tab - clean it up
        await this.deleteSession();
      }

      // Create new session with initial state
      const session: WizardSessionData = {
        tabId,
        currentStep: 1,
        state: {
          selectedConfig: null,
          selectedAddressType: null,
          myXpub: null,
          myFingerprint: null,
          cosignerXpubs: [],
          firstAddress: null,
          accountName: '',
          addressVerified: false,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Save to storage
      await chrome.storage.local.set({ [WIZARD_SESSION_KEY]: session });

      console.log('Created wizard session for tab', tabId);

      return session;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to create wizard session: ${message}`);
    }
  }

  /**
   * Retrieves the current wizard session
   *
   * @returns Session data if exists, null otherwise
   */
  static async getSession(): Promise<WizardSessionData | null> {
    try {
      const result = await chrome.storage.local.get(WIZARD_SESSION_KEY);
      const session = result[WIZARD_SESSION_KEY];

      if (!session) {
        return null;
      }

      // Validate session structure
      if (!this.isValidSession(session)) {
        console.warn('Invalid wizard session structure, clearing');
        await this.deleteSession();
        return null;
      }

      return session as WizardSessionData;
    } catch (error) {
      console.error('Failed to get wizard session:', error);
      return null;
    }
  }

  /**
   * Updates wizard session with partial state
   *
   * @param updates - Partial session data to update
   *
   * @throws {Error} If session doesn't exist or update fails
   */
  static async updateSession(updates: Partial<WizardSessionData>): Promise<void> {
    try {
      const session = await this.getSession();

      if (!session) {
        throw new Error('No wizard session to update');
      }

      // Merge updates
      const updatedSession: WizardSessionData = {
        ...session,
        ...updates,
        // Always update the timestamp
        updatedAt: Date.now(),
        // Deep merge the state object if provided
        state: updates.state ? { ...session.state, ...updates.state } : session.state,
      };

      // Save updated session
      await chrome.storage.local.set({ [WIZARD_SESSION_KEY]: updatedSession });

      console.log('Updated wizard session, step:', updatedSession.currentStep);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to update wizard session: ${message}`);
    }
  }

  /**
   * Deletes the wizard session
   *
   * @throws {Error} If deletion fails
   */
  static async deleteSession(): Promise<void> {
    try {
      await chrome.storage.local.remove(WIZARD_SESSION_KEY);
      console.log('Deleted wizard session');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete wizard session: ${message}`);
    }
  }

  /**
   * Gets the active session if it exists and the tab is still open
   *
   * @returns Session data if active, null otherwise
   */
  static async getActiveSession(): Promise<WizardSessionData | null> {
    try {
      const session = await this.getSession();

      if (!session) {
        return null;
      }

      // Check if tab is still open
      const tabExists = await this.isTabOpen(session.tabId);

      if (!tabExists) {
        // Tab was closed, clean up session
        await this.deleteSession();
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to get active wizard session:', error);
      return null;
    }
  }

  /**
   * Deletes session by tab ID (used when tab closes)
   *
   * @param tabId - Tab ID to check
   */
  static async deleteSessionByTabId(tabId: number): Promise<void> {
    try {
      const session = await this.getSession();

      if (session && session.tabId === tabId) {
        await this.deleteSession();
        console.log('Cleaned up wizard session for closed tab', tabId);
      }
    } catch (error) {
      console.error('Failed to delete wizard session by tab ID:', error);
    }
  }

  /**
   * Checks if a Chrome tab is still open
   *
   * @param tabId - Tab ID to check
   * @returns true if tab exists and is open, false otherwise
   */
  private static async isTabOpen(tabId: number): Promise<boolean> {
    try {
      await chrome.tabs.get(tabId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates wizard session structure
   *
   * @param session - Object to validate
   * @returns true if valid, false otherwise
   */
  private static isValidSession(session: any): session is WizardSessionData {
    if (!session || typeof session !== 'object') {
      return false;
    }

    // Check required fields
    if (
      typeof session.tabId !== 'number' ||
      typeof session.currentStep !== 'number' ||
      typeof session.createdAt !== 'number' ||
      typeof session.updatedAt !== 'number'
    ) {
      return false;
    }

    // Check state object
    if (!session.state || typeof session.state !== 'object') {
      return false;
    }

    // Check state has required fields (can be null, but must exist)
    const state = session.state;
    if (
      !('selectedConfig' in state) ||
      !('selectedAddressType' in state) ||
      !('myXpub' in state) ||
      !('myFingerprint' in state) ||
      !Array.isArray(state.cosignerXpubs) ||
      !('firstAddress' in state) ||
      typeof state.accountName !== 'string' ||
      typeof state.addressVerified !== 'boolean'
    ) {
      return false;
    }

    // Check step is in valid range
    if (session.currentStep < 1 || session.currentStep > 7) {
      return false;
    }

    return true;
  }

  /**
   * Cleans up expired sessions (older than 24 hours)
   *
   * This should be called periodically by the background service worker
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const session = await this.getSession();

      if (!session) {
        return;
      }

      const age = Date.now() - session.updatedAt;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (age > maxAge) {
        console.log('Cleaning up expired wizard session');
        await this.deleteSession();
      }
    } catch (error) {
      console.error('Failed to cleanup expired wizard sessions:', error);
    }
  }
}
