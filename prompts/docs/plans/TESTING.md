# Testing Guide - Phase 2: Wallet Core

This guide will help you test the HD wallet functionality that was just implemented.

## Setup

1. **Rebuild the extension:**
   ```bash
   npm run build
   ```

2. **Reload the extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find "Bitcoin Wallet"
   - Click the refresh icon

3. **Open DevTools:**
   - Click the extension icon (orange B)
   - Right-click in the popup → "Inspect"
   - This opens popup DevTools

4. **Open Background Service Worker Console:**
   - Go to `chrome://extensions/`
   - Find "Bitcoin Wallet"
   - Click "Inspect views: service worker"
   - This opens background console

## Test Scenarios

### Test 1: Create New Wallet

**In popup console**, run:

```javascript
// Create a new wallet with password
const response = await chrome.runtime.sendMessage({
  type: 'CREATE_WALLET',
  payload: {
    password: 'testPassword123',
    addressType: 'native-segwit' // optional, defaults to native-segwit
  }
});

console.log('Response:', response);

// Should return:
// {
//   success: true,
//   data: {
//     mnemonic: '12 word seed phrase...',
//     firstAddress: 'tb1q...' (testnet native segwit address)
//   }
// }

// IMPORTANT: Save the mnemonic somewhere for Test 2!
```

**Expected Results:**
- ✅ `success: true`
- ✅ Mnemonic is 12 words
- ✅ First address starts with `tb1q` (testnet native segwit)
- ✅ No errors in background console

**In background console:**
- Should see: "Wallet created successfully with first account"

---

### Test 2: Get Wallet State

```javascript
// Check if wallet exists and is locked
const state = await chrome.runtime.sendMessage({
  type: 'GET_WALLET_STATE'
});

console.log('Wallet State:', state);

// Should return:
// {
//   success: true,
//   data: {
//     isInitialized: true,
//     isLocked: true
//   }
// }
```

**Expected Results:**
- ✅ `isInitialized: true` (wallet exists)
- ✅ `isLocked: true` (wallet is locked after creation)

---

### Test 3: Unlock Wallet

```javascript
// Unlock wallet with password
const unlockResponse = await chrome.runtime.sendMessage({
  type: 'UNLOCK_WALLET',
  payload: {
    password: 'testPassword123'
  }
});

console.log('Unlock Response:', unlockResponse);

// Should return:
// {
//   success: true,
//   data: {
//     accounts: [...],
//     balance: { confirmed: 0, unconfirmed: 0 }
//   }
// }
```

**Expected Results:**
- ✅ `success: true`
- ✅ `accounts` array has 1 account (Account 1)
- ✅ Account has `addressType: 'native-segwit'`
- ✅ Account has 1 address in `addresses` array
- ✅ Balance is 0 (API not implemented yet)

**In background console:**
- Should see: "Wallet unlocked successfully"

---

### Test 4: Create Additional Account

```javascript
// Wallet must be unlocked first (Test 3)
const newAccount = await chrome.runtime.sendMessage({
  type: 'CREATE_ACCOUNT',
  payload: {
    name: 'Savings',
    addressType: 'segwit' // Try a different address type
  }
});

console.log('New Account:', newAccount);

// Should return:
// {
//   success: true,
//   data: {
//     account: {...},
//     firstAddress: '2...' (testnet segwit address starts with '2')
//   }
// }
```

**Expected Results:**
- ✅ `success: true`
- ✅ New account has `name: 'Savings'`
- ✅ New account has `index: 1`
- ✅ First address starts with `2` (testnet P2SH-P2WPKH)

---

### Test 5: Generate New Address

```javascript
// Generate additional receiving address for account 0
const newAddress = await chrome.runtime.sendMessage({
  type: 'GENERATE_ADDRESS',
  payload: {
    accountIndex: 0,
    isChange: false // false = receiving, true = change
  }
});

console.log('New Address:', newAddress);

// Should return:
// {
//   success: true,
//   data: {
//     address: {
//       address: 'tb1q...',
//       derivationPath: 'm/84\'/1\'/0\'/0/1',
//       index: 1,
//       isChange: false,
//       used: false
//     }
//   }
// }
```

**Expected Results:**
- ✅ `success: true`
- ✅ New address has `index: 1` (second address)
- ✅ Derivation path ends with `/0/1` (external chain, index 1)
- ✅ Address starts with `tb1q`

---

### Test 6: Update Account Name

```javascript
// Rename account 0
const renamed = await chrome.runtime.sendMessage({
  type: 'UPDATE_ACCOUNT_NAME',
  payload: {
    accountIndex: 0,
    name: 'Main Spending'
  }
});

console.log('Renamed Account:', renamed);
```

**Expected Results:**
- ✅ `success: true`
- ✅ Account name updated to "Main Spending"

---

### Test 7: Lock Wallet

```javascript
// Lock the wallet
const locked = await chrome.runtime.sendMessage({
  type: 'LOCK_WALLET'
});

console.log('Lock Response:', locked);

// Should return:
// {
//   success: true,
//   data: { message: 'Wallet locked' }
// }
```

**Expected Results:**
- ✅ `success: true`
- ✅ Wallet is now locked

**Verify lock:**
```javascript
const state = await chrome.runtime.sendMessage({
  type: 'GET_WALLET_STATE'
});

console.log(state.data.isLocked); // Should be true
```

---

### Test 8: Verify Password Protection

```javascript
// Try to unlock with wrong password
const wrongPassword = await chrome.runtime.sendMessage({
  type: 'UNLOCK_WALLET',
  payload: {
    password: 'wrongPassword'
  }
});

console.log('Wrong Password:', wrongPassword);

// Should return:
// {
//   success: false,
//   error: 'Incorrect password or failed to unlock wallet'
// }
```

**Expected Results:**
- ✅ `success: false`
- ✅ Generic error message (doesn't reveal if wallet exists)

---

### Test 9: Import Wallet (Clean Slate)

**First, delete existing wallet:**

```javascript
// Open IndexedDB and delete wallet data
// In popup console:
await chrome.storage.local.clear();

console.log('Storage cleared');
```

**Then import using the mnemonic from Test 1:**

```javascript
const imported = await chrome.runtime.sendMessage({
  type: 'IMPORT_WALLET',
  payload: {
    mnemonic: 'paste your 12 word mnemonic here',
    password: 'newPassword123',
    addressType: 'native-segwit'
  }
});

console.log('Import Response:', imported);
```

**Expected Results:**
- ✅ `success: true`
- ✅ First address matches the one from Test 1 (same mnemonic = same addresses)
- ✅ Account 1 is created

---

### Test 10: Auto-Lock (15 minute timeout)

**Note**: This test requires waiting 15 minutes.

```javascript
// 1. Unlock wallet
await chrome.runtime.sendMessage({
  type: 'UNLOCK_WALLET',
  payload: { password: 'testPassword123' }
});

// 2. Wait 15 minutes without sending any messages

// 3. After 15 minutes, check wallet state
const state = await chrome.runtime.sendMessage({
  type: 'GET_WALLET_STATE'
});

console.log('After 15 min:', state.data.isLocked); // Should be true
```

**Expected Results:**
- ✅ Wallet auto-locks after 15 minutes of inactivity
- ✅ Background console shows: "Auto-locking wallet due to inactivity"

---

## Verification Checklist

After running all tests:

- [ ] Wallet creation works with encrypted storage
- [ ] Password protection prevents unauthorized access
- [ ] Mnemonic import produces same addresses (deterministic)
- [ ] Multiple accounts can be created
- [ ] All 3 address types work (legacy, segwit, native-segwit)
- [ ] Address generation follows BIP44 correctly
- [ ] Lock/unlock works properly
- [ ] Auto-lock triggers after 15 minutes
- [ ] No sensitive data logged in console
- [ ] Account names can be updated

---

## Address Validation

You can validate generated addresses on a testnet block explorer:

**Testnet Explorers:**
- Blockstream: https://blockstream.info/testnet/
- Mempool.space: https://mempool.space/testnet

**Test Address Format:**
- Native SegWit (tb1q...): Paste into explorer search
- SegWit (2...): Paste into explorer search
- Legacy (m... or n...): Paste into explorer search

All addresses should be valid testnet addresses even though they have 0 balance.

---

## Testing Different Address Types

Create wallets with different address types:

```javascript
// Legacy (P2PKH)
await chrome.runtime.sendMessage({
  type: 'CREATE_WALLET',
  payload: {
    password: 'test',
    addressType: 'legacy'
  }
});
// Address should start with 'm' or 'n'

// SegWit (P2SH-P2WPKH)
await chrome.runtime.sendMessage({
  type: 'CREATE_WALLET',
  payload: {
    password: 'test',
    addressType: 'segwit'
  }
});
// Address should start with '2'

// Native SegWit (P2WPKH) - Default
await chrome.runtime.sendMessage({
  type: 'CREATE_WALLET',
  payload: {
    password: 'test',
    addressType: 'native-segwit'
  }
});
// Address should start with 'tb1q'
```

---

## Troubleshooting

**Issue: "Wallet already exists" error**
- Solution: Clear storage first: `await chrome.storage.local.clear()`

**Issue: "Wallet is locked" error**
- Solution: Unlock wallet with `UNLOCK_WALLET` message

**Issue: Service worker not responding**
- Solution: Reload extension in chrome://extensions/

**Issue: No response from message**
- Solution: Check background console for errors

**Issue: Build errors**
- Solution: Run `npm install` then `npm run build`

---

## Next Phase Preview

Once Phase 2 testing is complete, Phase 3 will add:

- **Blockstream API integration** - Fetch real balances
- **Transaction history** - View past transactions
- **UTXO management** - Select inputs for spending
- **Transaction building** - Create Bitcoin transactions
- **Transaction signing** - Sign with derived keys
- **Broadcasting** - Send to network

---

## Security Notes

**During Testing:**
- ⚠️ Only use testnet addresses
- ⚠️ Never use real Bitcoin (mainnet)
- ⚠️ Don't store real funds in development wallet
- ⚠️ Passwords are for testing only
- ⚠️ Keep mnemonics private (even testnet)

**Production Warnings:**
- Never log passwords or mnemonics to console
- Always use strong passwords in production
- Back up seed phrases offline
- Test thoroughly before using with real funds
