import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';
import { PrivacyProvider } from './contexts/PrivacyContext';

// ============================================================================
// SECURITY: CLICKJACKING PREVENTION
// ============================================================================

/**
 * Detect and block iframe embedding to prevent clickjacking attacks
 * This check runs immediately on page load, before React initialization
 *
 * Security Context:
 * - Clickjacking: Attacker embeds wallet in hidden iframe, tricks user into clicking
 * - Defense-in-depth: This check complements CSP frame-ancestors 'none'
 * - Critical for tab-based architecture where UI is always visible
 */
if (window !== window.top) {
  // Wallet is embedded in iframe - this is a security violation
  console.error('[SECURITY] Clickjacking attempt detected: Wallet running in iframe');

  // Replace entire page with error message
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0F0F0F;
      color: #EF4444;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
          🛡️ Security Error
        </h1>
        <p style="font-size: 16px; color: #D4D4D4; max-width: 500px; margin: 0 auto;">
          This wallet cannot run in an iframe for security reasons.
          Please open the wallet directly from the extension icon.
        </p>
      </div>
    </div>
  `;

  // Throw error to stop React initialization
  throw new Error('Clickjacking prevention: iframe detected');
}

// ============================================================================
// SECURITY: TAB NABBING PREVENTION
// ============================================================================

/**
 * Prevent tab nabbing attacks by monitoring location changes
 *
 * Security Context:
 * - Tab Nabbing: Malicious script redirects wallet tab to phishing site
 * - Attack vector: window.location = 'https://evil.com'
 * - Defense: Monitor location and lock wallet immediately on suspicious changes
 *
 * Implementation:
 * - Check location every 1 second
 * - If location differs from extension URL, lock wallet and show warning
 * - Critical for tab-based architecture where tab persists
 */

// Store the expected location (extension URL)
const EXPECTED_ORIGIN = chrome.runtime.getURL('');
const EXPECTED_PATHNAME = chrome.runtime.getURL('index.html');

// Flag to track if we've detected tampering
let locationTampered = false;

/**
 * Check if current location matches expected extension URL
 */
function checkLocationIntegrity(): boolean {
  const currentUrl = window.location.href;

  // Validate that we're still on the extension URL
  if (!currentUrl.startsWith(EXPECTED_ORIGIN)) {
    return false;
  }

  // For extension URLs, the pathname should be /index.html
  // (URL parameters and hash are allowed)
  const url = new URL(currentUrl);
  if (!url.pathname.endsWith('/index.html')) {
    return false;
  }

  return true;
}

/**
 * Handle location tampering detection
 */
function handleLocationTampering(): void {
  if (locationTampered) {
    return; // Already handled
  }

  locationTampered = true;
  console.error('[SECURITY] Tab nabbing attempt detected: Location changed');

  // Lock wallet immediately by sending message to background
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' }).catch(err => {
    console.error('Failed to lock wallet:', err);
  });

  // Replace page with security warning
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0F0F0F;
      color: #EF4444;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
          🛡️ Security Alert: Tab Nabbing Detected
        </h1>
        <p style="font-size: 16px; color: #D4D4D4; max-width: 500px; margin: 0 auto 16px;">
          A suspicious redirect was detected. Your wallet has been locked for security.
        </p>
        <p style="font-size: 14px; color: #A3A3A3; max-width: 500px; margin: 0 auto;">
          Please close this tab and open the wallet again from the extension icon.
        </p>
      </div>
    </div>
  `;
}

// Monitor location every second
setInterval(() => {
  if (!checkLocationIntegrity()) {
    handleLocationTampering();
  }
}, 1000);

// Also check on visibility change (when tab becomes visible)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !checkLocationIntegrity()) {
    handleLocationTampering();
  }
});

// ============================================================================
// SECURITY: SINGLE TAB ENFORCEMENT
// ============================================================================

/**
 * Single Tab Session Management (Client Side)
 *
 * Security Context:
 * - Ensures only one wallet tab can be active at a time
 * - Prevents state confusion and session hijacking
 * - Automatically locks or closes duplicate tabs
 *
 * Implementation:
 * - Request session token from background on load
 * - Validate token every 5 seconds
 * - Handle session revocation from other tabs
 * - Request new token on visibility change (tab switching)
 */

// Session state
let sessionToken: string | null = null;
let sessionValid = false;
let validationInterval: number | null = null;

/**
 * Request session token from background
 */
async function requestSessionToken(): Promise<boolean> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REQUEST_TAB_TOKEN'
    });

    if (response.granted && response.token) {
      sessionToken = response.token;
      sessionValid = true;
      console.log('[TAB SESSION] Token granted');
      return true;
    } else {
      // Token denial is expected when wallet is locked or another tab is active
      console.debug('[TAB SESSION] Token request denied:', response.error);
      return false;
    }
  } catch (error) {
    // Network/communication errors are unexpected - keep as error
    console.error('[TAB SESSION] Failed to request token:', error);
    return false;
  }
}

/**
 * Validate current session token
 */
async function validateSessionToken(): Promise<boolean> {
  if (!sessionToken) {
    return false;
  }

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'VALIDATE_TAB_TOKEN',
      token: sessionToken
    });

    if (response.valid) {
      sessionValid = true;
      return true;
    } else {
      // Expected failures (wallet locked, tab session lost) - use debug level
      const isExpectedFailure =
        response.reason === 'No active session' ||
        response.reason === 'Invalid token' ||
        response.reason === 'Token belongs to different tab';

      if (isExpectedFailure) {
        console.debug('[TAB SESSION] Token validation failed (expected):', response.reason);
      } else {
        // Unexpected failures - use warning level
        console.warn('[TAB SESSION] Token validation failed:', response.reason);
      }

      sessionValid = false;
      handleSessionRevoked(response.reason || 'Token validation failed');
      return false;
    }
  } catch (error) {
    // Network/communication errors are unexpected - keep as error
    console.error('[TAB SESSION] Failed to validate token:', error);
    sessionValid = false;
    return false;
  }
}

/**
 * Handle session revocation
 */
function handleSessionRevoked(reason: string): void {
  // Expected session revocations (use debug level)
  const isExpectedRevocation =
    reason === 'No active session' ||
    reason === 'Invalid token' ||
    reason === 'Token belongs to different tab' ||
    reason === 'Token validation failed';

  if (isExpectedRevocation) {
    console.debug('[TAB SESSION] Session revoked (expected):', reason);
  } else {
    // Unexpected revocations (another tab opened, security event)
    console.warn('[TAB SESSION] Session revoked:', reason);
  }

  // Stop validation
  if (validationInterval) {
    clearInterval(validationInterval);
    validationInterval = null;
  }

  // Clear session
  sessionToken = null;
  sessionValid = false;

  // Lock wallet
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' }).catch(err => {
    console.error('Failed to lock wallet:', err);
  });

  // Show warning to user
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #0F0F0F;
      color: #F7931A;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 20px;
      text-align: center;
    ">
      <div>
        <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">
          🔒 Wallet Tab Closed
        </h1>
        <p style="font-size: 16px; color: #D4D4D4; max-width: 500px; margin: 0 auto 16px;">
          ${reason}
        </p>
        <p style="font-size: 14px; color: #A3A3A3; max-width: 500px; margin: 0 auto 24px;">
          Your wallet has been locked for security. Please close this tab and open the wallet again from the extension icon.
        </p>
        <button
          onclick="window.close()"
          style="
            background: #F7931A;
            color: #0F0F0F;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          "
        >
          Close This Tab
        </button>
      </div>
    </div>
  `;
}

/**
 * Start session validation loop
 */
function startSessionValidation(): void {
  // Validate immediately
  validateSessionToken();

  // Then validate every 5 seconds
  validationInterval = window.setInterval(() => {
    validateSessionToken();
  }, 5000);
}

/**
 * Handle visibility change - request new token when tab becomes visible
 */
document.addEventListener('visibilitychange', async () => {
  if (!document.hidden) {
    // Tab became visible - request new token
    console.log('[TAB SESSION] Tab visible, requesting token');
    const granted = await requestSessionToken();

    if (!granted) {
      handleSessionRevoked('Failed to acquire session token');
    }
  }
});

/**
 * Listen for session revocation messages from background
 */
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SESSION_REVOKED') {
    handleSessionRevoked(message.reason || 'Session revoked by another tab');
  }
});

/**
 * Initialize session on page load
 */
(async function initializeSession() {
  console.log('[TAB SESSION] Initializing session...');

  const granted = await requestSessionToken();

  if (granted) {
    // Start validation loop
    startSessionValidation();
    console.log('[TAB SESSION] Session initialized successfully');
  } else {
    // Failed to get token
    handleSessionRevoked('Failed to initialize session token');
  }
})();

// ============================================================================
// SECURITY: AUTO-LOCK ON VISIBILITY CHANGE
// ============================================================================

/**
 * Auto-lock wallet when tab is hidden for extended period
 *
 * Security Context:
 * - User switches away from wallet tab, may forget to lock
 * - Tab remains open but invisible - still vulnerable if device stolen
 * - Auto-lock after 5 minutes of tab being hidden reduces attack window
 *
 * Implementation:
 * - Track when tab becomes hidden
 * - If hidden for 5 minutes, automatically lock wallet
 * - Reset timer when tab becomes visible
 * - Complements the existing 15-minute inactivity timer
 */

const VISIBILITY_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds
let visibilityLockTimer: number | null = null;

/**
 * Lock wallet due to extended hidden state
 */
function lockWalletForVisibility(): void {
  console.log('[VISIBILITY LOCK] Tab hidden for 5 minutes - locking wallet');

  // Send lock command to background
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' }).catch(err => {
    console.error('Failed to lock wallet:', err);
  });

  // Clear the timer
  visibilityLockTimer = null;
}

/**
 * Start visibility lock timer when tab becomes hidden
 */
function startVisibilityLockTimer(): void {
  // Clear any existing timer
  if (visibilityLockTimer) {
    clearTimeout(visibilityLockTimer);
  }

  // Set new timer for 5 minutes
  visibilityLockTimer = window.setTimeout(() => {
    lockWalletForVisibility();
  }, VISIBILITY_LOCK_TIMEOUT);

  console.log('[VISIBILITY LOCK] Timer started - will lock in 5 minutes if tab stays hidden');
}

/**
 * Cancel visibility lock timer when tab becomes visible
 */
function cancelVisibilityLockTimer(): void {
  if (visibilityLockTimer) {
    clearTimeout(visibilityLockTimer);
    visibilityLockTimer = null;
    console.log('[VISIBILITY LOCK] Timer cancelled - tab is visible');
  }
}

/**
 * Monitor visibility changes
 */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Tab became hidden - start lock timer
    startVisibilityLockTimer();
  } else {
    // Tab became visible - cancel lock timer
    cancelVisibilityLockTimer();
  }
});

// Also start timer on initial load if tab is already hidden
if (document.hidden) {
  startVisibilityLockTimer();
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <PrivacyProvider>
      <App />
    </PrivacyProvider>
  </React.StrictMode>
);
