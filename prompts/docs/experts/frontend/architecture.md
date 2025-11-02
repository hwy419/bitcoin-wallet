# Frontend Architecture

**Last Updated**: October 22, 2025
**Quick Nav**: [Index](./_INDEX.md) | [Components](./components.md) | [State](./state.md) | [Styling](./styling.md) | [Decisions](./decisions.md)

---

## Overview

The Bitcoin wallet frontend uses a **tab-based architecture** with a fixed sidebar and main content area. This replaced the original 600x400px popup design to accommodate complex multisig workflows and provide a professional desktop wallet experience.

### Tab-Based Architecture (v0.9.0+)

**Major Change**: Complete conversion from popup-based to full browser tab with persistent sidebar navigation.

**Why the Change?**
- **UX Improvement**: Constrained 600x400 popup was too small for multisig workflows
- **Professional Design**: Full-window layout with sidebar matches modern crypto wallets
- **Better Navigation**: Persistent sidebar provides clearer information architecture
- **More Space**: Full viewport allows complex UIs (PSBT review, multisig wizard)
- **Security Benefits**: Easier to implement tab-based security controls

**Architecture Pattern**: Sidebar + Main Content Layout

```
┌──────────────────────────────────────────────────────┐
│ Browser Tab - Full Viewport (100vw x 100vh)         │
├────────────┬─────────────────────────────────────────┤
│  Sidebar   │  Main Content Area                      │
│  240px     │  Flex-1 (remaining width)               │
│  Fixed     │  Scrollable                             │
│            │                                          │
│  [Logo]    │  ┌───────────────────────────────┐     │
│            │  │ Content depends on view:       │     │
│  Assets    │  │ - Dashboard (balance, txs)     │     │
│  Multisig  │  │ - SendScreen                   │     │
│  Contacts  │  │ - ReceiveScreen                │     │
│  Settings  │  │ - SettingsScreen               │     │
│            │  │ - ContactsScreen               │     │
│  [Account] │  └───────────────────────────────┘     │
│  [Lock]    │                                          │
└────────────┴─────────────────────────────────────────┘
```

---

## Directory Structure

### Current Structure (Tab-Based)

```
src/tab/
├── index.tsx (with security controls)
├── index.html (100vw x 100vh)
├── App.tsx (with Sidebar)
├── components/
│   ├── Sidebar.tsx (NEW)
│   ├── Dashboard.tsx
│   ├── SendScreen.tsx
│   ├── ReceiveScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── ContactsScreen.tsx
│   ├── AccountManagement/
│   │   ├── AccountCreationModal.tsx
│   │   ├── ImportAccountModal.tsx
│   │   ├── PrivateKeyImport.tsx
│   │   ├── PrivateKeyFileImport.tsx
│   │   └── SeedPhraseImport.tsx
│   ├── modals/
│   │   ├── SendModal.tsx
│   │   ├── ReceiveModal.tsx
│   │   └── ... (other modals)
│   └── shared/
│       ├── ImportBadge.tsx
│       ├── SecurityWarning.tsx
│       ├── FormField.tsx
│       ├── ContactCard.tsx
│       ├── BalanceChart.tsx
│       └── TransactionDetailPane.tsx
├── hooks/
│   ├── useBackgroundMessaging.ts
│   ├── useWallet.ts
│   ├── useBalanceUpdater.ts
│   └── useTransactionHistory.ts
└── styles/
    └── index.css
```

### Migration from Popup (v0.9.0)

**Before:**
```
src/popup/
├── index.tsx
├── popup.html (600x400)
├── App.tsx
├── components/
├── hooks/
└── styles/
```

**Key Changes:**
- All references to `popup` replaced with `tab` throughout codebase
- Entry point: `src/tab/index.tsx` (was `src/popup/index.tsx`)
- HTML template: `src/tab/index.html` (was `src/popup/popup.html`)
- Webpack output: `index.js` (was `popup.js`)
- Build size increased to accommodate sidebar and security controls

---

## Component Hierarchy

```
App.tsx (Root)
├── WalletContext.Provider
│   ├── WalletSetup/ (First-time flow)
│   │   ├── Welcome.tsx
│   │   ├── CreateWallet.tsx
│   │   │   ├── SetPassword.tsx
│   │   │   └── AddressTypeSelector.tsx
│   │   ├── SeedPhrase.tsx
│   │   ├── ConfirmSeed.tsx
│   │   └── ImportWallet.tsx
│   │
│   ├── UnlockScreen.tsx (Locked state)
│   │
│   └── MainApp/ (Unlocked state)
│       ├── Sidebar
│       │   ├── Logo & Title
│       │   ├── Navigation Items
│       │   ├── Account Switcher
│       │   └── Lock Button
│       │
│       └── MainContent (based on currentView)
│           ├── Dashboard.tsx
│           │   ├── BalanceCard.tsx
│           │   ├── BalanceChart.tsx
│           │   └── TransactionList.tsx
│           ├── SendScreen.tsx
│           │   ├── RecipientInput.tsx
│           │   ├── AmountInput.tsx
│           │   ├── FeeSelector.tsx
│           │   └── TransactionPreview.tsx
│           ├── ReceiveScreen.tsx
│           │   ├── AddressDisplay.tsx
│           │   └── QRCode.tsx
│           ├── ContactsScreen.tsx
│           │   └── ContactCard.tsx (multiple)
│           └── SettingsScreen.tsx
│               └── AccountManagement
└── Modals (Portal-rendered)
    ├── SendModal
    ├── ReceiveModal
    ├── AccountCreationModal
    └── ImportAccountModal
```

---

## Tab Opening & Security

### How Tab Opening Works

**User Flow:**
1. User clicks extension icon in Chrome toolbar
2. `chrome.action.onClicked` handler fires in background service worker
3. Background checks if wallet tab already exists
4. If exists: Focus existing tab
5. If not: Create new tab with `chrome-extension://[id]/index.html`

**Implementation:**
```typescript
// src/background/index.ts
chrome.action.onClicked.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  const walletUrl = chrome.runtime.getURL('index.html');
  const existingTab = tabs.find(tab => tab.url?.startsWith(walletUrl));

  if (existingTab && existingTab.id) {
    await chrome.tabs.update(existingTab.id, { active: true });
  } else {
    await chrome.tabs.create({ url: 'index.html' });
  }
});
```

### Security Controls

#### 1. Single Tab Enforcement

**Problem**: Multiple wallet tabs could cause state confusion or session hijacking.

**Solution**: Token-based session management where only one tab can be active at a time.

**Background Worker** (`src/background/index.ts`):
```typescript
interface TabSession {
  tabId: number;
  token: string;
  grantedAt: number;
}

let activeTabSession: TabSession | null = null;

// Generate cryptographically secure token (256-bit)
function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// REQUEST_TAB_TOKEN handler
case MessageType.REQUEST_TAB_TOKEN:
  const token = generateToken();
  const tabId = sender.tab?.id;

  // Revoke existing session if any
  if (activeTabSession && activeTabSession.tabId !== tabId) {
    chrome.tabs.sendMessage(activeTabSession.tabId, {
      type: 'SESSION_REVOKED',
      reason: 'Another wallet tab was opened'
    });
  }

  activeTabSession = { tabId, token, grantedAt: Date.now() };
  sendResponse({ granted: true, token });
  break;
```

**Tab Client** (`src/tab/index.tsx`):
```typescript
let sessionToken: string | null = null;
let validationInterval: number | null = null;

// Request session token on page load
async function requestSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({
    type: 'REQUEST_TAB_TOKEN'
  });

  if (response.granted && response.token) {
    sessionToken = response.token;
    return true;
  }
  return false;
}

// Validate token every 5 seconds
async function validateSessionToken(): Promise<boolean> {
  const response = await chrome.runtime.sendMessage({
    type: 'VALIDATE_TAB_TOKEN',
    token: sessionToken
  });

  if (!response.valid) {
    handleSessionRevoked('Token validation failed');
    return false;
  }
  return true;
}

// Start validation loop
function startSessionValidation(): void {
  validateSessionToken();
  validationInterval = setInterval(validateSessionToken, 5000);
}

// Handle session revocation
function handleSessionRevoked(reason: string): void {
  clearInterval(validationInterval);
  sessionToken = null;

  // Lock wallet
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });

  // Show warning UI
  document.body.innerHTML = `
    <div>Wallet Tab Closed: ${reason}</div>
    <button onclick="window.close()">Close This Tab</button>
  `;
}
```

**User Experience:**
- First tab: Gets session token, wallet works normally
- Second tab: Gets new session token, becomes active
- First tab: Shows orange "Wallet Tab Closed" message with button to close
- User can only use one tab at a time

#### 2. Clickjacking Prevention

**Problem**: Attacker could embed wallet in hidden iframe and trick user into clicking.

**Solution**: Multi-layer defense with CSP and runtime checks.

**Layer 1 - CSP** (Content Security Policy):
```json
// manifest.json
"content_security_policy": {
  "extension_pages": "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self'; object-src 'self'; frame-ancestors 'none'; form-action 'none'; base-uri 'self'"
}
```
- `frame-ancestors 'none'` prevents embedding in any iframe

**Layer 2 - Runtime Detection**:
```typescript
// src/tab/index.tsx (runs before React initialization)
if (window !== window.top) {
  console.error('[SECURITY] Clickjacking attempt detected');
  document.body.innerHTML = `
    <div>🛡️ Security Error: Wallet cannot run in iframe</div>
  `;
  throw new Error('Clickjacking prevention: iframe detected');
}
```

**Result**: Wallet cannot be embedded in iframes, protecting against clickjacking.

#### 3. Tab Nabbing Prevention

**Problem**: Malicious script could redirect wallet tab to phishing site.

**Solution**: Monitor window.location every second and lock wallet on suspicious changes.

**Implementation**:
```typescript
// src/tab/index.tsx
const EXPECTED_ORIGIN = chrome.runtime.getURL('');

function checkLocationIntegrity(): boolean {
  const currentUrl = window.location.href;

  // Validate still on extension URL
  if (!currentUrl.startsWith(EXPECTED_ORIGIN)) {
    return false;
  }

  // Pathname should be /index.html
  const url = new URL(currentUrl);
  if (!url.pathname.endsWith('/index.html')) {
    return false;
  }

  return true;
}

function handleLocationTampering(): void {
  console.error('[SECURITY] Tab nabbing detected');

  // Lock wallet immediately
  chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });

  // Show security warning
  document.body.innerHTML = `
    <div>🛡️ Security Alert: Tab Nabbing Detected</div>
    <div>Wallet has been locked for security</div>
  `;
}

// Check every 1 second
setInterval(() => {
  if (!checkLocationIntegrity()) {
    handleLocationTampering();
  }
}, 1000);

// Also check on visibility change
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !checkLocationIntegrity()) {
    handleLocationTampering();
  }
});
```

**Protection**: If `window.location` is changed (e.g., `window.location = 'https://evil.com'`), wallet locks within 1 second.

#### 4. Auto-Lock on Hidden Tab

**Problem**: User switches away from wallet tab and forgets to lock. Device could be stolen.

**Solution**: Automatically lock wallet after 5 minutes when tab is hidden.

**Implementation**:
```typescript
// src/tab/index.tsx
const VISIBILITY_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes
let visibilityLockTimer: number | null = null;

function startVisibilityLockTimer(): void {
  if (visibilityLockTimer) {
    clearTimeout(visibilityLockTimer);
  }

  visibilityLockTimer = setTimeout(() => {
    console.log('[VISIBILITY LOCK] Tab hidden for 5 minutes - locking');
    chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
  }, VISIBILITY_LOCK_TIMEOUT);
}

function cancelVisibilityLockTimer(): void {
  if (visibilityLockTimer) {
    clearTimeout(visibilityLockTimer);
    visibilityLockTimer = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    startVisibilityLockTimer(); // Start 5-minute countdown
  } else {
    cancelVisibilityLockTimer(); // Cancel countdown
  }
});

// Start timer if page loads hidden
if (document.hidden) {
  startVisibilityLockTimer();
}
```

**Behavior:**
- Tab visible: No timer, wallet stays unlocked
- Tab hidden: 5-minute timer starts
- After 5 minutes hidden: Wallet locks automatically
- Tab becomes visible: Timer resets

**Combined with Inactivity Lock:**
- Inactivity lock: 15 minutes (background worker tracks user activity)
- Visibility lock: 5 minutes (tab-specific)
- Whichever triggers first will lock the wallet

#### Security Controls Summary

| Control | Trigger | Response | Detection Time |
|---------|---------|----------|----------------|
| Single Tab | 2nd tab opens | Revoke 1st tab session | Immediate |
| Clickjacking | Iframe embedding | Block initialization | Immediate |
| Tab Nabbing | Location change | Lock wallet + warning | ≤1 second |
| Visibility Lock | Tab hidden 5min | Lock wallet | 5 minutes |
| Inactivity Lock | No activity 15min | Lock wallet | 15 minutes |

**Defense in Depth**: Multiple layers protect against different attack vectors.

---

## Sidebar Component

### Purpose

Fixed left navigation panel providing persistent access to main sections.

### Structure

```typescript
interface SidebarProps {
  currentView: 'dashboard' | 'multisig' | 'contacts' | 'settings';
  onNavigate: (view: string) => void;
  currentAccount: string;
  onAccountClick?: () => void;
  onLock?: () => void;
}
```

### Layout

```
┌─────────────────────┐
│  ┌───┐              │  Header Section
│  │ ₿ │ Bitcoin      │  (Logo + Title)
│  └───┘ Wallet       │
│        Testnet      │
├─────────────────────┤
│                     │
│  ₿  Assets          │  Navigation Items
│  🔐 Multi-sig       │  (Icons + Labels)
│  👥 Contacts        │
│  ⚙️  Settings       │
│                     │
│       (flex-1)      │  Spacer (pushes content down)
│                     │
├─────────────────────┤
│  ┌─┐                │  Account Switcher
│  │A│ Account 1      │  (Avatar + Name)
│  └─┘ Click to ···   │
│                     │
│  [Help]  [🔒Lock]   │  Action Buttons
└─────────────────────┘
```

### Dimensions

- Width: Fixed 240px (w-60 in Tailwind)
- Height: 100vh (full viewport height)
- Position: Fixed left
- Background: gray-900 (#1A1A1A)
- Border: 1px right border gray-750

### Navigation Items

```typescript
const navItems = [
  { id: 'dashboard', label: 'Assets', icon: '₿', description: 'View Bitcoin holdings' },
  { id: 'multisig', label: 'Multi-sig Wallets', icon: '🔐', description: 'Manage multisig' },
  { id: 'contacts', label: 'Contacts', icon: '👥', description: 'Address book' },
  { id: 'settings', label: 'Settings', icon: '⚙️', description: 'Preferences' },
];
```

### Active State Styling

- Background: Bitcoin orange (#F7931A)
- Text color: gray-950 (nearly black for contrast)
- Shadow: Orange glow effect (`shadow-glow-bitcoin`)
- Font weight: Semibold
- Indicator dot: Small circular dot on right edge

### Implementation Details

- Uses flexbox column layout
- Navigation section is `flex-1` to fill space
- Account switcher and buttons are at bottom
- Smooth transitions (200ms) on hover/active
- Click handlers passed as props from parent (App.tsx)

---

## Main Content Area

### Layout

- Position: Right of sidebar (flex-1)
- Width: Calculated (100vw - 240px)
- Height: 100vh
- Overflow: Auto (scrollable independently from sidebar)
- Background: gray-950 (#0F0F0F)

### View Routing

App.tsx manages which screen to display based on `currentView` state:

```typescript
type AppView = 'dashboard' | 'multisig' | 'contacts' | 'settings';

// In App.tsx render:
<div className="flex-1 overflow-auto">
  {currentView === 'dashboard' && <Dashboard {...props} />}
  {currentView === 'multisig' && <MultisigScreen {...props} />}
  {currentView === 'contacts' && <ContactsScreen {...props} />}
  {currentView === 'settings' && <SettingsScreen {...props} />}
</div>
```

### Screen Components

All screens render in the main content area and share common patterns:
- Full width of content area
- Padding: p-6 to p-8 (24px to 32px)
- Background: gray-950 or transparent (inherits from parent)
- Cards: gray-850 with gray-700 borders
- Scrollable content with proper overflow handling

---

## Routing Strategy

**Decision**: No React Router

**Rationale**:
- Single-page tab with view state management
- No URL navigation needed
- Simpler state machine approach
- Reduced bundle size

**Implementation**: View state in context
```typescript
type View = 'dashboard' | 'send' | 'receive' | 'history' | 'settings';
const [currentView, setCurrentView] = useState<View>('dashboard');
```

---

## React Architecture Patterns

### Component Design Principles

1. **Single Responsibility**: Each component does one thing well
2. **Composition Over Inheritance**: Build complex UIs from simple components
3. **Props Interface**: Every component has a TypeScript interface for props
4. **Default Props**: Provide sensible defaults where applicable
5. **Error Boundaries**: Wrap risky operations in error boundaries
6. **Accessibility**: ARIA labels, keyboard navigation, focus management

### Component Documentation Template

```typescript
/**
 * ComponentName
 *
 * Description: What this component does
 *
 * Props:
 * - propName: type - description
 *
 * Usage:
 * <ComponentName prop="value" />
 *
 * Notes:
 * - Any special considerations
 */
```

---

## Chrome Extension Integration

### Manifest V3 Configuration

**index.html** - Entry point
```html
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bitcoin Wallet</title>
  <style>
    /* Tab-based architecture - Full viewport */
    html, body {
      width: 100vw;
      height: 100vh;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #0F0F0F; /* Dark background */
    }
    #root {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="index.js"></script>
</body>
</html>
```

**Viewport Dimensions**
- Width: 100vw (full browser width)
- Height: 100vh (full browser height)
- Design: Responsive with sidebar + content layout

### Message Passing Pattern

See [State Management](./state.md#chrome-message-passing) for details on communication with background worker.

---

## Migration Guide (Popup → Tab)

### File Migration Map

**Directory Rename:**
```
src/popup/  → src/tab/
```

**All files moved 1:1 with same directory structure:**
```
src/popup/index.tsx                        → src/tab/index.tsx (+ security controls)
src/popup/popup.html                       → src/tab/index.html (+ full viewport)
src/popup/App.tsx                          → src/tab/App.tsx (+ Sidebar integration)
src/popup/components/Dashboard.tsx         → src/tab/components/Dashboard.tsx
src/popup/components/WalletSetup.tsx       → src/tab/components/WalletSetup.tsx
src/popup/components/UnlockScreen.tsx      → src/tab/components/UnlockScreen.tsx
src/popup/components/SendScreen.tsx        → src/tab/components/SendScreen.tsx
src/popup/components/ReceiveScreen.tsx     → src/tab/components/ReceiveScreen.tsx
src/popup/components/SettingsScreen.tsx    → src/tab/components/SettingsScreen.tsx
src/popup/components/ContactsScreen.tsx    → src/tab/components/ContactsScreen.tsx
... (all other components, hooks, and styles)
```

**New Files Created:**
```
src/tab/components/Sidebar.tsx  - New sidebar navigation component (240px fixed)
TAB_ARCHITECTURE_TESTING_GUIDE.md  - Comprehensive testing guide for tab architecture
```

**Configuration Files Updated:**
```
webpack.config.js
├─ entry.popup → entry.index
├─ HtmlWebpackPlugin template: popup.html → index.html
└─ output filename: popup.js → index.js

manifest.json
├─ action.default_popup REMOVED
└─ content_security_policy updated with frame-ancestors 'none'

tailwind.config.js
└─ content paths updated: src/popup/** → src/tab/**
```

### Code Migration Patterns

**Import Path Updates**

No import path changes needed because we did a complete directory rename maintaining structure. All relative imports continued to work.

**Before:**
```typescript
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import Dashboard from './components/Dashboard';
```

**After:**
```typescript
// Same relative paths - all worked automatically after directory rename
import { useBackgroundMessaging } from '../hooks/useBackgroundMessaging';
import Dashboard from './components/Dashboard';
```

---

## Performance Considerations

### Bundle Size Optimization

**Target**: < 2MB total for tab bundle

**Strategies**:
- Tree shaking (Webpack production mode)
- Code splitting (React.lazy for heavy components)
- Minimize dependencies
- Use Tailwind purge for unused styles

### Render Optimization

**Techniques**:
- React.memo for expensive components
- useMemo for expensive computations
- useCallback for stable function references
- Avoid inline functions in render (except trivial ones)
- Virtualize long lists (if transaction list >100 items)

### QR Code Optimization

**Issue**: QR code generation can be expensive

**Solution**:
- Lazy load QR component
- Memoize QR code generation
- Only render when receive screen is visible

```typescript
const QRCode = React.lazy(() => import('./QRCode'));

// In Receive component
{showQR && (
  <Suspense fallback={<Spinner />}>
    <QRCode value={address} />
  </Suspense>
)}
```

### Image Optimization

- Use SVG for icons (smaller, scalable)
- Optimize PNG logos (tinypng.com)
- Lazy load non-critical images

### Debouncing & Throttling

**Use Cases**:
- Address validation input (debounce 300ms)
- Balance refresh button (throttle 5s)
- Transaction list scroll (throttle 100ms)

---

**Related Documentation**:
- [Component Library](./components.md) - Detailed component specs
- [State Management](./state.md) - React Context and hooks
- [Styling System](./styling.md) - Tailwind and design tokens
- [Implementation Decisions](./decisions.md) - Frontend ADRs
