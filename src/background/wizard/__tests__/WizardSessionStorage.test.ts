/**
 * Tests for WizardSessionStorage
 *
 * Manages wizard session state with persistence in chrome.storage.local.
 * Critical security feature: ensures only one wizard session can be active
 * and provides automatic cleanup.
 *
 * Test coverage:
 * - Session creation and validation
 * - Session retrieval and updates
 * - Session expiration (24 hours)
 * - Data isolation between sessions
 * - Concurrent session prevention
 * - Tab lifecycle management
 * - Session cleanup mechanisms
 * - Invalid session handling
 * - Storage error handling
 * - Session validation edge cases
 */

import { WizardSessionStorage, WizardSessionData } from '../WizardSessionStorage';
import { MultisigConfig, MultisigAddressType } from '../../../shared/types';

describe('WizardSessionStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear storage before each test
    (chrome.storage.local as any).__clear();
    jest.clearAllTimers();

    // Reset chrome.tabs.get mock to default behavior (tab not found)
    (chrome.tabs.get as jest.Mock).mockRejectedValue(new Error('Tab not found'));
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  // ============================================================================
  // SESSION CREATION
  // ============================================================================

  describe('createSession', () => {
    /**
     * Test: Creates session with valid initial state
     */
    it('creates new session with correct initial state', async () => {
      const tabId = 12345;
      const session = await WizardSessionStorage.createSession(tabId);

      expect(session.tabId).toBe(tabId);
      expect(session.currentStep).toBe(1);
      expect(session.state.selectedConfig).toBeNull();
      expect(session.state.selectedAddressType).toBeNull();
      expect(session.state.myXpub).toBeNull();
      expect(session.state.myFingerprint).toBeNull();
      expect(session.state.cosignerXpubs).toEqual([]);
      expect(session.state.firstAddress).toBeNull();
      expect(session.state.accountName).toBe('');
      expect(session.state.addressVerified).toBe(false);
      expect(session.createdAt).toBeGreaterThan(0);
      expect(session.updatedAt).toBeGreaterThan(0);
      expect(session.createdAt).toBe(session.updatedAt);
    });

    /**
     * Test: Persists session to chrome.storage.local
     */
    it('persists session to storage', async () => {
      const tabId = 12345;
      await WizardSessionStorage.createSession(tabId);

      const stored = await chrome.storage.local.get('wizardSession');
      expect(stored.wizardSession).toBeDefined();
      expect(stored.wizardSession.tabId).toBe(tabId);
    });

    /**
     * Test: Prevents creating duplicate sessions for open tabs
     */
    it('prevents creating duplicate session when tab is still open', async () => {
      const tabId1 = 12345;

      // Mock chrome.tabs.get to simulate tab exists
      (chrome.tabs.get as jest.Mock).mockResolvedValue({ id: tabId1 });

      // Create first session
      await WizardSessionStorage.createSession(tabId1);

      // Try to create second session - should fail
      await expect(
        WizardSessionStorage.createSession(67890)
      ).rejects.toThrow('A wizard session is already active in another tab');
    });

    /**
     * Test: Allows creating new session when old tab is closed
     */
    it('allows creating new session when previous tab is closed', async () => {
      const tabId1 = 12345;
      const tabId2 = 67890;

      // Create first session
      await WizardSessionStorage.createSession(tabId1);

      // Mock chrome.tabs.get to simulate tab closed (throws error)
      (chrome.tabs.get as jest.Mock).mockRejectedValue(new Error('Tab not found'));

      // Should allow creating new session
      const session = await WizardSessionStorage.createSession(tabId2);
      expect(session.tabId).toBe(tabId2);
    });

    /**
     * Test: Error handling when storage fails
     */
    it('handles storage errors during creation', async () => {
      (chrome.storage.local as any).__setError('set', new Error('Storage quota exceeded'));

      await expect(
        WizardSessionStorage.createSession(12345)
      ).rejects.toThrow('Failed to create wizard session: Storage quota exceeded');
    });
  });

  // ============================================================================
  // SESSION RETRIEVAL
  // ============================================================================

  describe('getSession', () => {
    /**
     * Test: Retrieves existing session
     */
    it('retrieves existing session', async () => {
      const tabId = 12345;
      const created = await WizardSessionStorage.createSession(tabId);

      const retrieved = await WizardSessionStorage.getSession();
      expect(retrieved).toEqual(created);
    });

    /**
     * Test: Returns null when no session exists
     */
    it('returns null when no session exists', async () => {
      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Validates session structure
     */
    it('clears invalid session structure', async () => {
      // Store invalid session
      await chrome.storage.local.set({
        wizardSession: {
          tabId: 'not-a-number', // Invalid type
          currentStep: 1,
        },
      });

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();

      // Should have been deleted
      const stored = await chrome.storage.local.get('wizardSession');
      expect(stored.wizardSession).toBeUndefined();
    });

    /**
     * Test: Handles storage errors gracefully
     */
    it('handles storage errors gracefully', async () => {
      (chrome.storage.local as any).__setError('get', new Error('Storage error'));

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });
  });

  // ============================================================================
  // SESSION UPDATES
  // ============================================================================

  describe('updateSession', () => {
    /**
     * Test: Updates session with partial data
     */
    it('updates session with partial data', async () => {
      const tabId = 12345;
      await WizardSessionStorage.createSession(tabId);

      const config: MultisigConfig = { m: 2, n: 3 };
      await WizardSessionStorage.updateSession({
        currentStep: 2,
        state: {
          selectedConfig: config,
        } as any,
      });

      const session = await WizardSessionStorage.getSession();
      expect(session?.currentStep).toBe(2);
      expect(session?.state.selectedConfig).toEqual(config);
      // Other state fields should remain unchanged
      expect(session?.state.selectedAddressType).toBeNull();
    });

    /**
     * Test: Updates timestamp on update
     */
    it('updates timestamp on update', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      await WizardSessionStorage.createSession(12345);

      // Advance time
      jest.setSystemTime(now + 5000);

      await WizardSessionStorage.updateSession({ currentStep: 2 });

      const session = await WizardSessionStorage.getSession();
      expect(session?.updatedAt).toBe(now + 5000);
      expect(session?.createdAt).toBe(now);

      jest.useRealTimers();
    });

    /**
     * Test: Deep merges state object
     */
    it('deep merges state object', async () => {
      await WizardSessionStorage.createSession(12345);

      // Update some state fields
      await WizardSessionStorage.updateSession({
        state: {
          selectedConfig: { m: 2, n: 3 },
          myXpub: 'xpub123',
        } as any,
      });

      // Update different state fields
      await WizardSessionStorage.updateSession({
        state: {
          selectedAddressType: 'P2WSH' as MultisigAddressType,
        } as any,
      });

      const session = await WizardSessionStorage.getSession();
      // All state fields should be present
      expect(session?.state.selectedConfig).toEqual({ m: 2, n: 3 });
      expect(session?.state.myXpub).toBe('xpub123');
      expect(session?.state.selectedAddressType).toBe('P2WSH');
    });

    /**
     * Test: Throws error when no session exists
     */
    it('throws error when no session exists', async () => {
      await expect(
        WizardSessionStorage.updateSession({ currentStep: 2 })
      ).rejects.toThrow('No wizard session to update');
    });

    /**
     * Test: Handles storage errors
     */
    it('handles storage errors during update', async () => {
      await WizardSessionStorage.createSession(12345);

      (chrome.storage.local as any).__setError('set', new Error('Storage error'));

      await expect(
        WizardSessionStorage.updateSession({ currentStep: 2 })
      ).rejects.toThrow('Failed to update wizard session: Storage error');
    });
  });

  // ============================================================================
  // SESSION DELETION
  // ============================================================================

  describe('deleteSession', () => {
    /**
     * Test: Deletes session from storage
     */
    it('deletes session from storage', async () => {
      await WizardSessionStorage.createSession(12345);

      await WizardSessionStorage.deleteSession();

      const stored = await chrome.storage.local.get('wizardSession');
      expect(stored.wizardSession).toBeUndefined();
    });

    /**
     * Test: Handles deletion when no session exists
     */
    it('handles deletion when no session exists', async () => {
      await expect(WizardSessionStorage.deleteSession()).resolves.not.toThrow();
    });

    /**
     * Test: Handles storage errors during deletion
     */
    it('handles storage errors during deletion', async () => {
      (chrome.storage.local as any).__setError('remove', new Error('Storage error'));

      await expect(WizardSessionStorage.deleteSession()).rejects.toThrow(
        'Failed to delete wizard session: Storage error'
      );
    });
  });

  // ============================================================================
  // ACTIVE SESSION MANAGEMENT
  // ============================================================================

  describe('getActiveSession', () => {
    /**
     * Test: Returns session when tab is still open
     */
    it('returns session when tab is still open', async () => {
      const tabId = 12345;
      await WizardSessionStorage.createSession(tabId);

      // Mock tab exists
      (chrome.tabs.get as jest.Mock).mockResolvedValue({ id: tabId });

      const session = await WizardSessionStorage.getActiveSession();
      expect(session).not.toBeNull();
      expect(session?.tabId).toBe(tabId);
    });

    /**
     * Test: Cleans up and returns null when tab is closed
     */
    it('cleans up and returns null when tab is closed', async () => {
      const tabId = 12345;
      await WizardSessionStorage.createSession(tabId);

      // Mock tab closed
      (chrome.tabs.get as jest.Mock).mockRejectedValue(new Error('Tab not found'));

      const session = await WizardSessionStorage.getActiveSession();
      expect(session).toBeNull();

      // Session should be deleted
      const stored = await chrome.storage.local.get('wizardSession');
      expect(stored.wizardSession).toBeUndefined();
    });

    /**
     * Test: Returns null when no session exists
     */
    it('returns null when no session exists', async () => {
      const session = await WizardSessionStorage.getActiveSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Handles errors gracefully
     */
    it('handles errors gracefully', async () => {
      // Set up storage error
      (chrome.storage.local as any).__setError('get', new Error('Storage error'));

      const session = await WizardSessionStorage.getActiveSession();
      expect(session).toBeNull();
    });
  });

  // ============================================================================
  // TAB-BASED SESSION CLEANUP
  // ============================================================================

  describe('deleteSessionByTabId', () => {
    /**
     * Test: Deletes session for matching tab ID
     */
    it('deletes session for matching tab ID', async () => {
      const tabId = 12345;
      await WizardSessionStorage.createSession(tabId);

      await WizardSessionStorage.deleteSessionByTabId(tabId);

      const stored = await chrome.storage.local.get('wizardSession');
      expect(stored.wizardSession).toBeUndefined();
    });

    /**
     * Test: Does not delete session for non-matching tab ID
     */
    it('does not delete session for non-matching tab ID', async () => {
      const tabId = 12345;
      await WizardSessionStorage.createSession(tabId);

      await WizardSessionStorage.deleteSessionByTabId(67890);

      const session = await WizardSessionStorage.getSession();
      expect(session).not.toBeNull();
      expect(session?.tabId).toBe(tabId);
    });

    /**
     * Test: Handles case when no session exists
     */
    it('handles case when no session exists', async () => {
      await expect(
        WizardSessionStorage.deleteSessionByTabId(12345)
      ).resolves.not.toThrow();
    });

    /**
     * Test: Handles errors gracefully
     */
    it('handles errors gracefully', async () => {
      await WizardSessionStorage.createSession(12345);

      (chrome.storage.local as any).__setError('get', new Error('Storage error'));

      // Should not throw
      await expect(
        WizardSessionStorage.deleteSessionByTabId(12345)
      ).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // SESSION EXPIRATION (24 HOURS)
  // ============================================================================

  describe('cleanupExpiredSessions', () => {
    /**
     * Test: Deletes sessions older than 24 hours
     */
    it('deletes sessions older than 24 hours', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      await WizardSessionStorage.createSession(12345);

      // Advance time by 25 hours
      jest.setSystemTime(now + 25 * 60 * 60 * 1000);

      await WizardSessionStorage.cleanupExpiredSessions();

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();

      jest.useRealTimers();
    });

    /**
     * Test: Keeps sessions younger than 24 hours
     */
    it('keeps sessions younger than 24 hours', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      await WizardSessionStorage.createSession(12345);

      // Advance time by 23 hours
      jest.setSystemTime(now + 23 * 60 * 60 * 1000);

      await WizardSessionStorage.cleanupExpiredSessions();

      const session = await WizardSessionStorage.getSession();
      expect(session).not.toBeNull();

      jest.useRealTimers();
    });

    /**
     * Test: Uses updatedAt timestamp for expiration check
     */
    it('uses updatedAt timestamp for expiration check', async () => {
      jest.useFakeTimers();
      const now = Date.now();
      jest.setSystemTime(now);

      await WizardSessionStorage.createSession(12345);

      // Advance time by 23 hours
      jest.setSystemTime(now + 23 * 60 * 60 * 1000);

      // Update session (resets updatedAt)
      await WizardSessionStorage.updateSession({ currentStep: 2 });

      // Advance time by another 2 hours (25 hours total from creation)
      jest.setSystemTime(now + 25 * 60 * 60 * 1000);

      // Should NOT be deleted (only 2 hours since last update)
      await WizardSessionStorage.cleanupExpiredSessions();

      const session = await WizardSessionStorage.getSession();
      expect(session).not.toBeNull();

      jest.useRealTimers();
    });

    /**
     * Test: Handles case when no session exists
     */
    it('handles case when no session exists', async () => {
      await expect(
        WizardSessionStorage.cleanupExpiredSessions()
      ).resolves.not.toThrow();
    });

    /**
     * Test: Handles errors gracefully
     */
    it('handles errors gracefully', async () => {
      await WizardSessionStorage.createSession(12345);

      (chrome.storage.local as any).__setError('get', new Error('Storage error'));

      // Should not throw
      await expect(
        WizardSessionStorage.cleanupExpiredSessions()
      ).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // SESSION VALIDATION
  // ============================================================================

  describe('session validation', () => {
    /**
     * Test: Rejects session with missing fields
     */
    it('rejects session with missing tabId', async () => {
      await chrome.storage.local.set({
        wizardSession: {
          currentStep: 1,
          state: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Rejects session with invalid step number
     */
    it('rejects session with invalid step number (too low)', async () => {
      await chrome.storage.local.set({
        wizardSession: {
          tabId: 12345,
          currentStep: 0, // Invalid: must be 1-7
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
        },
      });

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Rejects session with invalid step number (too high)
     */
    it('rejects session with invalid step number (too high)', async () => {
      await chrome.storage.local.set({
        wizardSession: {
          tabId: 12345,
          currentStep: 8, // Invalid: must be 1-7
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
        },
      });

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Rejects session with missing state fields
     */
    it('rejects session with missing state fields', async () => {
      await chrome.storage.local.set({
        wizardSession: {
          tabId: 12345,
          currentStep: 1,
          state: {
            selectedConfig: null,
            // Missing other fields
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Rejects session with invalid state field types
     */
    it('rejects session with invalid cosignerXpubs type', async () => {
      await chrome.storage.local.set({
        wizardSession: {
          tabId: 12345,
          currentStep: 1,
          state: {
            selectedConfig: null,
            selectedAddressType: null,
            myXpub: null,
            myFingerprint: null,
            cosignerXpubs: 'not-an-array', // Invalid
            firstAddress: null,
            accountName: '',
            addressVerified: false,
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      const session = await WizardSessionStorage.getSession();
      expect(session).toBeNull();
    });

    /**
     * Test: Accepts valid session at each step (1-7)
     */
    it('accepts valid session at all steps (1-7)', async () => {
      for (let step = 1; step <= 7; step++) {
        // Clear storage
        (chrome.storage.local as any).__clear();

        const session = await WizardSessionStorage.createSession(12345 + step);
        await WizardSessionStorage.updateSession({ currentStep: step });

        const retrieved = await WizardSessionStorage.getSession();
        expect(retrieved).not.toBeNull();
        expect(retrieved?.currentStep).toBe(step);
      }
    });
  });

  // ============================================================================
  // DATA ISOLATION
  // ============================================================================

  describe('data isolation', () => {
    /**
     * Test: Session data is completely replaced on new session
     */
    it('completely replaces session data on new session', async () => {
      // Create first session with data
      await WizardSessionStorage.createSession(12345);
      await WizardSessionStorage.updateSession({
        currentStep: 5,
        state: {
          selectedConfig: { m: 2, n: 3 },
          myXpub: 'xpub123',
        } as any,
      });

      // Simulate tab closed
      (chrome.tabs.get as jest.Mock).mockRejectedValue(new Error('Tab closed'));

      // Create new session
      const newSession = await WizardSessionStorage.createSession(67890);

      // Should have fresh initial state
      expect(newSession.currentStep).toBe(1);
      expect(newSession.state.selectedConfig).toBeNull();
      expect(newSession.state.myXpub).toBeNull();
    });

    /**
     * Test: Updates do not leak data between sessions
     */
    it('does not leak data between sequential sessions', async () => {
      // Create and populate first session
      await WizardSessionStorage.createSession(12345);
      const sensitiveData = 'xpub123_sensitive';
      await WizardSessionStorage.updateSession({
        state: { myXpub: sensitiveData } as any,
      });

      // Delete session
      await WizardSessionStorage.deleteSession();

      // Create new session
      await WizardSessionStorage.createSession(67890);

      const newSession = await WizardSessionStorage.getSession();
      expect(newSession?.state.myXpub).toBeNull();
      expect(newSession?.state.myXpub).not.toBe(sensitiveData);
    });
  });
});
