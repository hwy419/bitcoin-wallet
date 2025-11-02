# Dark Mode Implementation Guide
## Quick Start for Frontend Developer

**Purpose:** Fast-track guide to implement dark mode in Bitcoin Wallet
**Time Estimate:** 4-6 hours for complete implementation
**Difficulty:** Medium

---

## Prerequisites

- [ ] Read `DARK_MODE_DESIGN_SPEC.md` (15 minutes)
- [ ] Review `DARK_MODE_VISUAL_EXAMPLES.md` (10 minutes)
- [ ] Backup current codebase or create feature branch
- [ ] Have Chrome DevTools ready for testing

---

## Step-by-Step Implementation

### Phase 1: Tailwind Configuration (15 minutes)

**File:** `/home/michael/code_projects/bitcoin_wallet/tailwind.config.js`

1. **Update the entire file with this configuration:**

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/popup/popup.html',
  ],
  darkMode: 'class', // Enable dark mode via class strategy
  theme: {
    extend: {
      colors: {
        // Bitcoin brand colors
        bitcoin: {
          DEFAULT: '#F7931A',
          hover: '#FF9E2D',
          active: '#E88711',
          light: '#FFA43D',
          subtle: 'rgba(247, 147, 26, 0.12)',
          muted: 'rgba(247, 147, 26, 0.24)',
        },

        // Extended gray scale for dark mode
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D4D4D4',   // text-secondary in dark mode
          400: '#A3A3A3',   // text-tertiary in dark mode
          500: '#737373',   // text-quaternary in dark mode
          600: '#525252',   // border-hover in dark mode
          650: '#323232',   // Custom - surface-active
          700: '#404040',   // border-default in dark mode
          750: '#2E2E2E',   // Custom - surface-hover, border-subtle
          800: '#242424',   // bg-tertiary in dark mode
          850: '#1E1E1E',   // Custom - surface-default (cards)
          900: '#1A1A1A',   // bg-secondary in dark mode
          950: '#0F0F0F',   // bg-primary in dark mode
        },

        // Semantic colors optimized for dark mode
        green: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
        },
        red: {
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
        },
        amber: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        blue: {
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
        },
      },

      // Dark mode shadows
      boxShadow: {
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.5)',
        'md': '0 4px 12px -2px rgba(0, 0, 0, 0.6)',
        'lg': '0 10px 24px -4px rgba(0, 0, 0, 0.7)',
        'xl': '0 20px 40px -8px rgba(0, 0, 0, 0.8)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
      },

      width: {
        'popup': '600px',
      },
      height: {
        'popup': '400px',
      },

      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
};
```

2. **Save the file**
3. **Restart your dev server** (`npm run dev`)
4. **Verify no build errors**

---

### Phase 2: Enable Dark Mode by Default (5 minutes)

**File:** `/home/michael/code_projects/bitcoin_wallet/src/popup/App.tsx`

Add this `useEffect` hook at the top of your `App` component:

```tsx
const App: React.FC = () => {
  const { sendMessage } = useBackgroundMessaging();

  // ... existing state declarations ...

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // ... rest of component ...
};
```

**What this does:** Adds the `dark` class to the `<html>` element, activating Tailwind's dark mode.

---

### Phase 3: Component Migration (3-4 hours)

Now migrate each component one by one. Use this find-and-replace strategy:

#### Global Find & Replace (Use with caution!)

**Search for:** → **Replace with:**

| Current Class | New Class | Notes |
|--------------|-----------|-------|
| `bg-gray-50` | `bg-gray-950` | Main backgrounds |
| `bg-gray-100` | `bg-gray-900` | Secondary backgrounds |
| `bg-white` | `bg-gray-850` | Cards (may need border added) |
| `text-gray-900` | `text-white` | Primary text |
| `text-gray-600` | `text-gray-300` | Secondary text |
| `text-gray-500` | `text-gray-400` | Tertiary text |
| `border-gray-200` | `border-gray-700` | Borders |
| `border-gray-300` | `border-gray-700` | Input borders |
| `hover:bg-gray-100` | `hover:bg-gray-800` | Hover states |
| `hover:bg-gray-200` | `hover:bg-gray-700` | Stronger hovers |

**Important:** Don't do a blind find-replace! Migrate component by component.

---

#### Component-by-Component Checklist

##### 1. App.tsx - Loading & Error States

**File:** `/home/michael/code_projects/bitcoin_wallet/src/popup/App.tsx`

**Lines 71-79: Loading State**

Replace:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
    <p className="text-gray-600">Loading wallet...</p>
  </div>
</div>
```

With:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-3 border-gray-700 border-t-bitcoin mx-auto mb-4"></div>
    <p className="text-gray-400">Loading wallet...</p>
  </div>
</div>
```

**Lines 84-99: Error State**

Replace:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-6">
  <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
    <h2 className="text-xl font-bold text-red-800 mb-4">Error</h2>
    <p className="text-gray-700 mb-6">{error}</p>
    <button
      onClick={...}
      className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
    >
      Retry
    </button>
  </div>
</div>
```

With:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
  <div className="bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8 max-w-md">
    <h2 className="text-xl font-bold text-red-400 mb-4">Error</h2>
    <p className="text-gray-300 mb-6">{error}</p>
    <button
      onClick={...}
      className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 active:bg-red-700 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-850"
    >
      Retry
    </button>
  </div>
</div>
```

---

##### 2. WalletSetup.tsx - Complete Redesign

**File:** `/home/michael/code_projects/bitcoin_wallet/src/popup/components/WalletSetup.tsx`

This is a large component. Here are the key sections to update:

**Lines 142-196: Backup Screen Outer Container**

Replace line 142:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-6">
```

With:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
```

**Line 143: Backup Screen Card**

Replace:
```tsx
<div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
```

With:
```tsx
<div className="w-full max-w-md bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8">
```

**Line 144: Title**

Replace:
```tsx
<h2 className="text-2xl font-bold text-gray-900 mb-4">Backup Your Seed Phrase</h2>
```

With:
```tsx
<h2 className="text-2xl font-bold text-white mb-4">Backup Your Seed Phrase</h2>
```

**Line 145: Description**

Replace:
```tsx
<p className="text-sm text-gray-600 mb-6">
```

With:
```tsx
<p className="text-sm text-gray-400 mb-6">
```

**Lines 150-160: Mnemonic Display**

Replace:
```tsx
<div className="bg-gray-50 border-2 border-orange-200 rounded-lg p-4 mb-6">
  <div className="grid grid-cols-3 gap-3">
    {generatedMnemonic.split(' ').map((word, index) => (
      <div key={index} className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 font-mono">{index + 1}.</span>
        <span className="text-sm font-mono font-semibold text-gray-900">{word}</span>
      </div>
    ))}
  </div>
</div>
```

With:
```tsx
<div className="bg-gray-900 border-2 border-bitcoin-light rounded-xl p-6 mb-6 shadow-[0_0_0_4px_rgba(247,147,26,0.12)]">
  <div className="grid grid-cols-3 gap-3">
    {generatedMnemonic.split(' ').map((word, index) => (
      <div key={index} className="flex items-center space-x-2">
        <span className="text-xs text-gray-500 font-mono">{index + 1}.</span>
        <span className="text-sm font-mono font-semibold text-white">{word}</span>
      </div>
    ))}
  </div>
</div>
```

**Lines 162-166: Warning Box**

Replace:
```tsx
<div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
  <p className="text-xs text-red-800">
    <strong>Warning:</strong> Never share your seed phrase with anyone. Anyone with access to these words can steal your Bitcoin.
  </p>
</div>
```

With:
```tsx
<div className="bg-red-500/15 border border-red-500/30 rounded-lg p-4 mb-6">
  <p className="text-xs text-red-300">
    <strong className="text-red-200">Warning:</strong> Never share your seed phrase with anyone. Anyone with access to these words can steal your Bitcoin.
  </p>
</div>
```

**Lines 169-179: Checkbox**

Replace:
```tsx
<label className="flex items-start space-x-3 mb-6 cursor-pointer">
  <input
    type="checkbox"
    checked={backupConfirmed}
    onChange={(e) => setBackupConfirmed(e.target.checked)}
    className="mt-1 w-4 h-4 text-orange-500 focus:ring-orange-500"
  />
  <span className="text-sm text-gray-700">
    I have written down my seed phrase and stored it in a safe place
  </span>
</label>
```

With:
```tsx
<label className="flex items-start gap-3 mb-6 cursor-pointer">
  <input
    type="checkbox"
    checked={backupConfirmed}
    onChange={(e) => setBackupConfirmed(e.target.checked)}
    className="mt-1 w-4 h-4 bg-gray-900 border-gray-700 checked:bg-bitcoin checked:border-bitcoin rounded focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
  />
  <span className="text-sm text-gray-300">
    I have written down my seed phrase and stored it in a safe place
  </span>
</label>
```

**Lines 181-185: Error Message**

Replace:
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-800">{error}</p>
  </div>
)}
```

With:
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
    <p className="text-sm text-red-300">{error}</p>
  </div>
)}
```

**Lines 187-193: Continue Button**

Replace:
```tsx
<button
  onClick={handleBackupComplete}
  disabled={!backupConfirmed}
  className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  Continue
</button>
```

With:
```tsx
<button
  onClick={handleBackupComplete}
  disabled={!backupConfirmed}
  className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-bitcoin focus:ring-offset-2 focus:ring-offset-gray-850"
>
  Continue
</button>
```

**Lines 200-202: Main Setup Form Outer Container**

Replace:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-6">
  <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
    <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Welcome to Bitcoin Wallet</h1>
```

With:
```tsx
<div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
  <div className="w-full max-w-md bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8">
    <h1 className="text-2xl font-bold text-white mb-6 text-center">Welcome to Bitcoin Wallet</h1>
```

**Lines 206-221: Tabs**

Replace the tab border line:
```tsx
<div className="flex border-b border-gray-200 mb-6">
```

With:
```tsx
<div className="flex border-b border-gray-800 mb-6">
```

Replace tab button classes (around lines 213-219 and 228-234):
```tsx
className={`flex-1 py-3 text-sm font-semibold transition-colors ${
  activeTab === 'create'
    ? 'text-orange-500 border-b-2 border-orange-500'
    : 'text-gray-500 hover:text-gray-700'
}`}
```

With:
```tsx
className={`flex-1 py-3 text-sm font-semibold transition-colors ${
  activeTab === 'create'
    ? 'text-bitcoin border-b-2 border-bitcoin'
    : 'text-gray-400 hover:text-gray-300'
}`}
```

**Continue this pattern for remaining elements...**

Due to length, I'll provide a simplified checklist for remaining elements in WalletSetup:

- [ ] Line 243: Description text → `text-gray-400`
- [ ] Line 248: Label → `text-gray-300`
- [ ] Line 254: Select input → Add `bg-gray-900 border-gray-700 text-white` + focus classes
- [ ] Line 261: Helper text → `text-gray-500`
- [ ] Line 268: Label → `text-gray-300`
- [ ] Line 272-280: Password input → Add dark classes
- [ ] Line 286: Label → `text-gray-300`
- [ ] Line 292-298: Confirm password → Add dark classes
- [ ] Line 300: Error text → `text-red-400`
- [ ] Lines 305-309: Error box → Use red/15 background pattern
- [ ] Lines 311-317: Create button → Use bitcoin colors
- [ ] Lines 325, 332: Description text → `text-gray-400`
- [ ] Lines 329-347: Mnemonic textarea → Add dark input classes
- [ ] Lines 344-346: Mnemonic error → `text-red-400`
- [ ] Lines 350-362: Address type select → Add dark classes
- [ ] Lines 366-382: Password inputs → Add dark classes
- [ ] Lines 385-403: Confirm password → Add dark classes
- [ ] Lines 405-409: Error box → Dark error styling
- [ ] Lines 411-417: Import button → Bitcoin colors

**Pro tip:** Use search and replace in your editor:
- Search for: `bg-white `
- Replace with: `bg-gray-850 border border-gray-700 `

---

##### 3. UnlockScreen.tsx

**File:** `/home/michael/code_projects/bitcoin_wallet/src/popup/components/UnlockScreen.tsx`

I don't have this file's contents, but apply these patterns:

```tsx
// Outer container
className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6"

// Card
className="w-full max-w-md bg-gray-850 border border-gray-700 rounded-2xl shadow-2xl p-8 text-center"

// Title
className="text-2xl font-bold text-white mb-6"

// Input
className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white placeholder:text-gray-500 rounded-lg focus:outline-none focus:border-bitcoin focus:ring-2 focus:ring-bitcoin/30"

// Button
className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] transition-all duration-200"

// Link
className="text-sm text-gray-400 hover:text-bitcoin"
```

---

##### 4. Dashboard.tsx - Most Complex Component

**File:** `/home/michael/code_projects/bitcoin_wallet/src/popup/components/Dashboard.tsx`

**Line 150: Main container**

Replace:
```tsx
<div className="w-full h-full bg-gray-50 flex flex-col">
```

With:
```tsx
<div className="w-full h-full bg-gray-950 flex flex-col">
```

**Line 152: Header**

Replace:
```tsx
<div className="bg-white border-b border-gray-200 px-6 py-4">
```

With:
```tsx
<div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
```

**Lines 156-164: Account selector button**

Replace:
```tsx
<button
  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
  className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
>
  <span className="font-semibold text-gray-900">{currentAccount?.name || 'Account 1'}</span>
  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

With:
```tsx
<button
  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
  className="flex items-center gap-2 px-4 py-2.5 bg-gray-850 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors duration-200"
>
  <span className="font-semibold text-white">{currentAccount?.name || 'Account 1'}</span>
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

**Lines 167-200: Account dropdown**

Replace:
```tsx
<div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
```

With:
```tsx
<div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 py-2">
```

**Account dropdown items (lines 171-197):**

Replace:
```tsx
<button
  key={account.index}
  onClick={...}
  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
    currentAccountIndex === index ? 'bg-orange-50' : ''
  }`}
>
  <div className="flex items-center justify-between">
    <div>
      <div className="font-semibold text-gray-900">{account.name}</div>
      <div className="text-xs text-gray-500 capitalize">{account.addressType.replace('-', ' ')}</div>
    </div>
    {currentAccountIndex === index && (
      <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
```

With:
```tsx
<button
  key={account.index}
  onClick={...}
  className={`w-full px-4 py-3 text-left hover:bg-gray-750 rounded-lg transition-colors ${
    currentAccountIndex === index ? 'bg-bitcoin-subtle' : ''
  }`}
>
  <div className="flex items-center justify-between">
    <div>
      <div className="font-semibold text-white">{account.name}</div>
      <div className="text-xs text-gray-400 capitalize">{account.addressType.replace('-', ' ')}</div>
    </div>
    {currentAccountIndex === index && (
      <svg className="w-5 h-5 text-bitcoin" fill="currentColor" viewBox="0 0 20 20">
```

**Lines 204-218: Lock button**

Replace:
```tsx
<button
  onClick={onLock}
  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
  title="Lock Wallet"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

With:
```tsx
<button
  onClick={onLock}
  className="p-2 text-gray-400 hover:text-white hover:bg-gray-850 rounded-lg transition-colors"
  title="Lock Wallet"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
```

**Line 222: Main content**

Replace:
```tsx
<div className="flex-1 overflow-y-auto p-6">
```

With:
```tsx
<div className="flex-1 overflow-y-auto p-6 bg-gray-950">
```

**Lines 224: Balance card**

Replace:
```tsx
<div className="bg-white rounded-lg shadow-sm p-6 mb-6">
```

With:
```tsx
<div className="bg-gradient-to-br from-gray-850 to-gray-800 border border-gray-700 rounded-xl p-8 mb-6 text-center shadow-lg">
```

**Lines 225-244: Balance card content**

Replace:
```tsx
<div className="text-center">
  <p className="text-sm text-gray-600 mb-2">Total Balance</p>
  {isLoadingBalance ? (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  ) : (
    <>
      <h2 className="text-3xl font-bold text-gray-900 mb-1">
        {formatBTC(balance.confirmed)} BTC
      </h2>
      {balance.unconfirmed > 0 && (
        <p className="text-xs text-gray-500">
          +{formatBTC(balance.unconfirmed)} BTC unconfirmed
        </p>
      )}
    </>
  )}
  <p className="text-xs text-orange-600 mt-2">Testnet</p>
</div>
```

With:
```tsx
<>
  <p className="text-sm text-gray-400 mb-2">Total Balance</p>
  {isLoadingBalance ? (
    <div className="flex items-center justify-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-3 border-gray-700 border-t-bitcoin"></div>
    </div>
  ) : (
    <>
      <h2 className="text-4xl font-bold text-white mb-1">
        {formatBTC(balance.confirmed)} BTC
      </h2>
      {balance.unconfirmed > 0 && (
        <p className="text-xs text-gray-500">
          +{formatBTC(balance.unconfirmed)} BTC unconfirmed
        </p>
      )}
    </>
  )}
  <p className="text-xs text-bitcoin mt-2 font-medium">Testnet</p>
</>
```

**Lines 248-266: Action buttons**

Replace:
```tsx
<div className="grid grid-cols-3 gap-4 mb-6">
  <button
    onClick={() => setView('send')}
    className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
  >
    Send
  </button>
  <button
    onClick={() => setView('receive')}
    className="bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-colors"
  >
    Receive
  </button>
  <button
    onClick={() => setView('settings')}
    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
  >
    Settings
  </button>
</div>
```

With:
```tsx
<div className="grid grid-cols-3 gap-4 mb-6">
  <button
    onClick={() => setView('send')}
    className="bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 rounded-lg font-semibold transition-all duration-200"
  >
    Send
  </button>
  <button
    onClick={() => setView('receive')}
    className="bg-bitcoin hover:bg-bitcoin-hover active:bg-bitcoin-active active:scale-[0.98] text-white py-3 rounded-lg font-semibold transition-all duration-200"
  >
    Receive
  </button>
  <button
    onClick={() => setView('settings')}
    className="bg-gray-850 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-700 py-3 rounded-lg font-semibold transition-colors duration-200"
  >
    Settings
  </button>
</div>
```

**Lines 270: Addresses section**

Replace:
```tsx
<div className="bg-white rounded-lg shadow-sm p-6">
```

With:
```tsx
<div className="bg-gray-850 border border-gray-700 rounded-xl p-6 shadow-sm">
```

**Lines 271-272: Section title**

Replace:
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold text-gray-900">Addresses</h3>
```

With:
```tsx
<div className="flex items-center justify-between mb-4">
  <h3 className="text-lg font-semibold text-white">Addresses</h3>
```

**Lines 274-279: Generate button**

Replace:
```tsx
<button
  onClick={handleGenerateAddress}
  disabled={isGeneratingAddress}
  className="text-sm text-orange-500 hover:text-orange-600 font-semibold disabled:opacity-50"
>
```

With:
```tsx
<button
  onClick={handleGenerateAddress}
  disabled={isGeneratingAddress}
  className="text-sm text-bitcoin hover:text-bitcoin-hover font-semibold disabled:opacity-50 transition-colors"
>
```

**Lines 282-286: Error message**

Replace:
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-800">{error}</p>
  </div>
)}
```

With:
```tsx
{error && (
  <div className="mb-4 p-3 bg-red-500/15 border border-red-500/30 rounded-lg">
    <p className="text-sm text-red-300">{error}</p>
  </div>
)}
```

**Lines 295-334: Address list items**

Replace:
```tsx
<div
  key={addr.address}
  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
>
  <div className="flex-1 min-w-0">
    <p className="text-xs text-gray-500 mb-1">
      Address #{currentAccount.addresses.filter((a) => !a.isChange).length - index}
    </p>
    <p className="text-sm font-mono text-gray-900 truncate">{addr.address}</p>
    {addr.used && (
      <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
        Used
      </span>
    )}
  </div>
  <button
    onClick={() => handleCopyAddress(addr.address)}
    className="ml-3 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
```

With:
```tsx
<div
  key={addr.address}
  className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 hover:bg-gray-800 hover:border-gray-700 rounded-lg transition-colors duration-200"
>
  <div className="flex-1 min-w-0">
    <p className="text-xs text-gray-500 mb-1">
      Address #{currentAccount.addresses.filter((a) => !a.isChange).length - index}
    </p>
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
```

**Lines 337: Empty state**

Replace:
```tsx
<p className="text-center text-sm text-gray-500 py-4">No addresses yet</p>
```

With:
```tsx
<p className="text-center text-sm text-gray-500 py-4">No addresses yet</p>
```
(This one is fine as-is!)

**Lines 344-349: Recent activity section**

Replace:
```tsx
<div className="mt-6 bg-white rounded-lg shadow-sm p-6">
  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
  <p className="text-center text-sm text-gray-500 py-8">
    Transaction history coming in Phase 3
  </p>
</div>
```

With:
```tsx
<div className="mt-6 bg-gray-850 border border-gray-700 rounded-xl p-6">
  <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
  <p className="text-center text-sm text-gray-500 py-8">
    Transaction history coming in Phase 3
  </p>
</div>
```

---

##### 5. SendScreen.tsx, ReceiveScreen.tsx, SettingsScreen.tsx

For these remaining screens, apply the same patterns:

**Common patterns:**
- Main container: `bg-gray-950`
- Headers: `bg-gray-900 border-b border-gray-800`
- Content area: `bg-gray-950`
- Cards: `bg-gray-850 border border-gray-700`
- Labels: `text-gray-300`
- Input fields: `bg-gray-900 border-gray-700 text-white`
- Buttons: See button patterns above
- Error boxes: `bg-red-500/15 border-red-500/30 text-red-300`
- Success messages: `bg-green-500/15 border-green-500/30 text-green-400`

---

### Phase 4: Testing (30 minutes)

1. **Visual inspection:**
   - [ ] Load each screen
   - [ ] Check all colors match spec
   - [ ] Verify hover states work
   - [ ] Check focus indicators visible

2. **Functional testing:**
   - [ ] Complete wallet setup flow
   - [ ] Lock and unlock
   - [ ] Switch accounts
   - [ ] Generate addresses
   - [ ] Navigate all screens

3. **Accessibility testing:**
   - [ ] Tab through all interactive elements
   - [ ] Verify focus indicators visible
   - [ ] Check contrast with axe DevTools

---

## Quick Reference: Common Class Mappings

```
OLD (Light)              → NEW (Dark)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
bg-gray-50               → bg-gray-950
bg-gray-100              → bg-gray-900
bg-white                 → bg-gray-850 + border-gray-700
text-gray-900            → text-white
text-gray-600            → text-gray-300
text-gray-500            → text-gray-400
border-gray-200          → border-gray-700
border-gray-300          → border-gray-700
hover:bg-gray-100        → hover:bg-gray-800
bg-orange-500            → bg-bitcoin
hover:bg-orange-600      → hover:bg-bitcoin-hover
text-orange-500          → text-bitcoin
bg-red-50                → bg-red-500/15
border-red-200           → border-red-500/30
text-red-800             → text-red-300
```

---

## Troubleshooting

### Colors not showing up?
- Did you restart dev server after Tailwind config change?
- Did you add `dark` class to html element?
- Check browser console for Tailwind JIT warnings

### Text hard to read?
- Verify background is dark (950/900)
- Text should be white/300/400, not darker grays

### Borders invisible?
- Use `border-gray-700` not 200/300
- Always add `border` class when using `border-gray-700`

### Focus states not visible?
- Add `focus:ring-2 focus:ring-bitcoin` classes
- Add `focus:ring-offset-2 focus:ring-offset-gray-[BG]`

---

## Time Estimates

- Tailwind config: **15 min**
- Enable dark mode: **5 min**
- App.tsx: **15 min**
- WalletSetup.tsx: **60 min** (largest component)
- UnlockScreen.tsx: **20 min**
- Dashboard.tsx: **60 min** (most complex)
- SendScreen.tsx: **30 min**
- ReceiveScreen.tsx: **20 min**
- SettingsScreen.tsx: **20 min**
- Testing & fixes: **30 min**

**Total: ~4-5 hours**

---

## Final Checklist

Before marking as complete:

- [ ] All screens load without errors
- [ ] All text is readable (white/300/400)
- [ ] All borders are visible (700)
- [ ] All buttons have correct colors (bitcoin, not orange-500)
- [ ] All hover states work correctly
- [ ] All focus states are visible
- [ ] QR codes still have white background
- [ ] Loading spinners use bitcoin color
- [ ] Error messages use red-400 text
- [ ] Success messages use green-400 text
- [ ] All cards have borders added
- [ ] Input fields have dark backgrounds
- [ ] Modals have backdrop blur
- [ ] No pure white (#FFF) backgrounds except QR codes
- [ ] No pure black (#000) backgrounds
- [ ] All semantic colors use /15 backgrounds for badges

---

## Need Help?

**Reference Documents:**
- `DARK_MODE_DESIGN_SPEC.md` - Complete technical spec
- `DARK_MODE_VISUAL_EXAMPLES.md` - Before/after examples
- `ui-ux-designer-notes.md` - Design system docs

**Common Issues:**
- If stuck, compare against examples in VISUAL_EXAMPLES.md
- Use DevTools color picker to verify exact colors
- Test one component at a time, don't batch all changes

---

**Good luck! The dark mode will look amazing with Bitcoin orange. 🟠**
