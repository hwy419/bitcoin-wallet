# Testnet Environment Setup Guide

**Time to Complete:** 1 hour (one-time setup)
**Prerequisites:** Chrome browser installed, internet connection
**What You'll Get:** Fully configured testing environment with testnet Bitcoin

---

## Overview

This guide walks you through setting up everything you need to test the Bitcoin Wallet Extension:

1. Install the wallet extension in Chrome
2. Get testnet Bitcoin from faucets
3. Set up Blockstream testnet explorer
4. Create test wallets and addresses
5. Verify your setup is working

**Why testnet?** Testnet Bitcoin has no real value, making it safe for testing. It works exactly like real Bitcoin but without financial risk.

---

## Step 1: Install Chrome Extension (15 minutes)

### 1.1 Navigate to Project Directory

**Open Terminal/Command Prompt** and navigate to the project:

```bash
cd /home/michael/code_projects/bitcoin_wallet
```

### 1.2 Build the Extension

**Run the build command:**

```bash
npm run build
```

**Expected output:**
```
✔ Building extension for production...
✔ Build complete! Extension files in dist/
```

**If build fails:**
- Check for errors in output
- Ensure `node_modules/` installed (`npm install` if needed)
- Report build errors to development team

### 1.3 Load Extension in Chrome

1. **Open Chrome** and navigate to:
   ```
   chrome://extensions/
   ```

2. **Enable Developer Mode:**
   - Toggle the "Developer mode" switch (top right)
   - Should turn blue when enabled

3. **Load the extension:**
   - Click "Load unpacked" button (top left)
   - Navigate to: `/home/michael/code_projects/bitcoin_wallet/dist/`
   - Click "Select Folder"

4. **Verify installation:**
   - Extension card should appear titled "Bitcoin Wallet"
   - Version should show "0.10.0"
   - No errors in extension card
   - Bitcoin "₿" icon should appear in Chrome toolbar

**Screenshot checkpoint:** Extension loaded successfully
![Extension card shows Bitcoin Wallet v0.10.0]

### 1.4 Open the Wallet

1. **Click the Bitcoin ₿ icon** in Chrome toolbar
   - Should open a NEW BROWSER TAB (not a popup)
   - URL should be: `chrome-extension://[random-id]/index.html`

2. **Verify wallet loads:**
   - You should see "Welcome to Bitcoin Wallet" screen
   - Options: "Create New Wallet" or "Import Seed Phrase"

**If extension doesn't load:**
- Check console for errors (F12)
- Try reloading extension: chrome://extensions/ → click reload
- Check dist/ folder exists and has files

---

## Step 2: Get Testnet Bitcoin (20 minutes)

### 2.1 Create Your First Wallet

**Follow these steps to create a test wallet:**

1. **Click "Create New Wallet"** tab
2. **Enter a password:**
   - Use a simple test password (this is testnet only!)
   - Example: `TestWallet123`
   - Confirm password
3. **Select address type:**
   - Choose "Native SegWit (Recommended)"
   - This gives you testnet addresses starting with `tb1`
4. **Save your seed phrase:**
   - Write down the 12 words (or screenshot - testnet only!)
   - Example: `abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about`
   - Click "I've backed up my seed phrase"
5. **Confirm seed phrase:**
   - Select words in correct order
   - Click "Create Wallet"

**Result:** Wallet created, now you'll be asked to unlock

6. **Unlock wallet:**
   - Enter your password (`TestWallet123`)
   - Click "Unlock"

**Screenshot checkpoint:** Dashboard shows 0.00000000 BTC balance

### 2.2 Get Your Receiving Address

1. **Navigate to Dashboard** (should be default view)
2. **Click "Receive" button**
3. **Copy your receiving address:**
   - Should start with `tb1q...`
   - Example: `tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx`
   - Click "Copy Address" button
   - Paste into notepad for next step

**Important:** This is your testnet address - no real Bitcoin can be sent here!

### 2.3 Request Testnet Bitcoin from Faucet

**Primary Faucet: Testnet Faucet Mempool**

1. **Open faucet:** https://testnet-faucet.mempool.co/

2. **Paste your address:**
   - Paste the `tb1q...` address you copied
   - Complete CAPTCHA

3. **Click "Send" or "Get Testnet Bitcoin"**

4. **Wait for confirmation:**
   - Faucet should show "Transaction sent!"
   - Note the transaction ID (txid)
   - Example txid: `a1b2c3d4e5f6...` (64 characters)

**Expected wait time:** 30-60 seconds for wallet balance to update

### 2.4 Verify Funds Received

**In wallet:**
1. Wait 30-60 seconds
2. Refresh browser tab if needed (F5)
3. Check Dashboard balance
4. Should show 0.001 to 0.01 BTC (depending on faucet)

**If balance doesn't update after 2 minutes:**
- Check if transaction is on block explorer (Step 3 below)
- Check console for errors (F12)
- Faucet may be empty - try backup faucet

### 2.5 Backup Faucets (If Primary is Empty)

**Faucet 2: Coinfaucet**
- URL: https://coinfaucet.eu/en/btc-testnet/
- Amount: 0.00001-0.0001 BTC
- Wait time: Instant
- Note: Smaller amounts than primary

**Faucet 3: Bitcoin Testnet Faucet**
- URL: https://bitcoinfaucet.uo1.net/
- Amount: 0.001-0.01 BTC
- Wait time: 1-2 minutes
- Note: May require solving puzzles

**Tips for faucets:**
- Most have 24-hour cooldown per address
- Generate new address in wallet if rate-limited
- Try different faucets if one is empty
- Ask development team if all faucets empty

---

## Step 3: Setup Test Data for Filtering and Metadata (30 minutes)

### 3.1 Why Test Data?

For comprehensive testing of the wallet's filtering and metadata features, you need structured test data including:
- Multiple contacts with different characteristics
- Transactions with various metadata (tags, categories, notes)
- Mix of transactions with and without metadata

**Time Investment:** 30 minutes now saves hours of testing time later by having ready-to-use test scenarios.

---

### 3.2 Create Test Contacts

Create at least 3 contacts with different profiles for filter testing:

**Contact 1: Exchange Wallet**
1. Navigate to Contacts screen (sidebar)
2. Click "Add Contact" button
3. Fill in details:
   - **Name:** Exchange Wallet
   - **Address:** (Use an address from Wallet B or generate new one)
   - **Email:** exchange@testnet.local (optional)
   - **Category:** Exchange
   - **Custom Tags:**
     - Key: `service` → Value: `coinbase`
     - Key: `type` → Value: `exchange`
     - Key: `verified` → Value: `yes`
   - **Notes:** Test exchange wallet for receiving payments
4. Click "Save Contact"

**Contact 2: Alice (Friend)**
1. Click "Add Contact"
2. Fill in details:
   - **Name:** Alice Friend
   - **Address:** (Different address from Wallet B)
   - **Email:** alice@testnet.local
   - **Category:** Personal
   - **Custom Tags:**
     - Key: `name` → Value: `alice`
     - Key: `relationship` → Value: `friend`
     - Key: `location` → Value: `local`
   - **Notes:** Personal friend for P2P payments
3. Click "Save Contact"

**Contact 3: Coffee Shop**
1. Click "Add Contact"
2. Fill in details:
   - **Name:** Downtown Coffee Shop
   - **Address:** (Another unique address)
   - **Email:** orders@coffeeshop.local
   - **Category:** Business
   - **Custom Tags:**
     - Key: `business` → Value: `coffee_shop`
     - Key: `location` → Value: `downtown`
     - Key: `payment_method` → Value: `bitcoin`
   - **Notes:** Recurring coffee purchases
3. Click "Save Contact"

**Verify Contacts:**
- Navigate to Contacts screen
- Verify 3 contacts created with tags
- Test search: Type "alice" → should find Alice Friend
- Test search by tag: Type "location" → should show contacts with location tag

---

### 3.3 Create Test Transactions with Metadata

Now send transactions and add metadata to each for comprehensive filter testing.

**Transaction 1: Exchange Withdrawal**
1. Send 0.001 BTC to "Exchange Wallet" contact
2. Wait for transaction to appear in history
3. Click transaction to open detail pane
4. Expand "Tags & Notes" section
5. Add metadata:
   - **Category:** Withdrawal
   - **Tags:** #exchange, #important, #monthly
   - **Notes:** Monthly withdrawal from exchange to personal wallet
6. Click "Save"
7. Verify transaction row shows category badge and tag/notes icons

**Transaction 2: Personal Payment (Alice)**
1. Send 0.0005 BTC to "Alice Friend" contact
2. Click transaction in history
3. Add metadata:
   - **Category:** Gift
   - **Tags:** #payment, #personal, #friend
   - **Notes:** Birthday present for Alice
4. Save changes

**Transaction 3: Business Expense (Coffee)**
1. Send 0.0002 BTC to "Downtown Coffee Shop" contact
2. Add metadata:
   - **Category:** Expense
   - **Tags:** #business, #receipt, #food
   - **Notes:** Coffee meeting with client on Oct 30
3. Save changes

**Transaction 4: Test Transaction (No Contact)**
1. Send 0.0001 BTC to random testnet address (not in contacts)
2. Add metadata:
   - **Category:** Testing
   - **Tags:** #test, #demo, #development
   - **Notes:** Test transaction for QA validation
3. Save changes

**Transaction 5: Received from Faucet (No Metadata)**
1. Use your earlier faucet transaction (received)
2. **DO NOT add metadata** - leave empty
3. Purpose: Test empty state and "no metadata" scenarios

**Transaction 6: Personal Transfer (No Metadata)**
1. Send 0.00015 BTC to any address
2. **Leave metadata empty**
3. Purpose: Test filtering transactions without metadata

---

### 3.4 Verify Test Data Setup

**Checklist - Contacts:**
- [ ] 3 contacts created with unique names
- [ ] Each contact has Category assigned
- [ ] Each contact has 3+ custom tags (key-value pairs)
- [ ] Contact search by name works
- [ ] Contact search by tag key/value works

**Checklist - Transactions:**
- [ ] At least 6 transactions in history
- [ ] 4 transactions have metadata (categories, tags, notes)
- [ ] 2 transactions have NO metadata (empty state testing)
- [ ] Transactions associated with different contacts
- [ ] Mix of sent and received transactions
- [ ] Transaction rows show visual indicators (badges, icons)

**Checklist - Metadata Variety:**
- [ ] Multiple categories used: Withdrawal, Gift, Expense, Testing
- [ ] Multiple tags used: #exchange, #payment, #business, #test, etc.
- [ ] Tag overlap: Some transactions share tags (#payment appears multiple times)
- [ ] Notes added to transactions with meaningful content

---

### 3.5 Sample Data Summary Table

Use this table to track your test data:

| Transaction # | Contact | Amount | Type | Category | Tags | Notes |
|--------------|---------|--------|------|----------|------|-------|
| TX1 | Exchange Wallet | 0.001 | Sent | Withdrawal | #exchange, #important, #monthly | Monthly withdrawal |
| TX2 | Alice Friend | 0.0005 | Sent | Gift | #payment, #personal, #friend | Birthday present |
| TX3 | Coffee Shop | 0.0002 | Sent | Expense | #business, #receipt, #food | Coffee meeting |
| TX4 | (none) | 0.0001 | Sent | Testing | #test, #demo, #development | QA validation |
| TX5 | (faucet) | 0.001+ | Received | (none) | (none) | (none) |
| TX6 | (none) | 0.00015 | Sent | (none) | (none) | (none) |

**Document Your Addresses:**
```
Exchange Wallet: tb1q_______________________________
Alice Friend:    tb1q_______________________________
Coffee Shop:     tb1q_______________________________
Random Address:  tb1q_______________________________
```

---

### 3.6 Test Your Setup - Quick Validation

**Test Contact Filters:**
1. Navigate to Dashboard → Transaction History
2. Click "Filter" button
3. Expand "Contact" section
4. Verify all 3 contacts appear with transaction counts
5. Select "Exchange Wallet"
6. Verify only TX1 (Exchange) shown
7. Clear filter

**Test Tag Filters:**
1. Open FilterPanel again
2. Expand "Tags" section
3. Verify all tags appear: #exchange, #payment, #business, #test, etc.
4. Select "#payment" tag
5. Verify TX2 (Alice) and any others with #payment shown
6. Select multiple tags: #payment, #business
7. Verify OR logic (shows either tag)
8. Clear filters

**Test Category Filters:**
1. Open FilterPanel
2. Expand "Category" section
3. Verify categories: Withdrawal, Gift, Expense, Testing
4. Select "Gift"
5. Verify only TX2 (Alice) shown
6. Clear filter

**Test Combined Filters:**
1. Select Contact: "Coffee Shop"
2. Select Category: "Expense"
3. Select Tag: "#business"
4. Verify only TX3 (Coffee) shown (matches all filters)
5. Verify filter pills show: Contact: Coffee Shop, Category: Expense, Tag: #business
6. Click "Reset All Filters"
7. Verify all transactions shown again

**If any test fails:**
- Review test data creation steps
- Verify contacts saved correctly
- Verify metadata saved on transactions
- Check console for errors (F12)
- Re-do test data setup if needed

---

### 3.7 Optional: Create More Test Data

For more comprehensive testing (optional but recommended):

**Additional Contacts:**
- Hardware Wallet (Category: Wallet, Tags: cold_storage, secure)
- Mining Pool (Category: Mining, Tags: pool, rewards)
- Friend 2 (Category: Personal, Tags: name=bob, relationship=colleague)

**Additional Transactions:**
- 5-10 more transactions with various metadata combinations
- Test large note (400+ characters)
- Test maximum tags (10 tags on one transaction)
- Test Unicode in notes: "☕ Coffee ₿ 0.0002"
- Test special characters in category: "Bills & Utilities"

**Advanced Test Scenarios:**
- Transaction with ALL 10 tags (test UI display)
- Transaction with 500 character note (test limit)
- 20+ transactions (test pagination)
- Multiple transactions to same contact (test contact filtering)

---

### 3.8 Save Your Test Data

**Create Test Data Reference File:**

In a text editor, save this information for future reference:

```markdown
# Bitcoin Wallet Test Data

## Test Contacts (Created: [DATE])

### Exchange Wallet
- Address: tb1q...
- Category: Exchange
- Tags: service=coinbase, type=exchange, verified=yes

### Alice Friend
- Address: tb1q...
- Category: Personal
- Tags: name=alice, relationship=friend, location=local

### Downtown Coffee Shop
- Address: tb1q...
- Category: Business
- Tags: business=coffee_shop, location=downtown, payment_method=bitcoin

## Test Transactions

1. TX1: 0.001 BTC → Exchange Wallet
   - Category: Withdrawal
   - Tags: #exchange, #important, #monthly
   - Notes: Monthly withdrawal

2. TX2: 0.0005 BTC → Alice Friend
   - Category: Gift
   - Tags: #payment, #personal, #friend
   - Notes: Birthday present

[Continue for all transactions...]

## Filter Test Scenarios

- Contact filter: "Exchange Wallet" → Should show TX1
- Tag filter: "#payment" → Should show TX2
- Category filter: "Expense" → Should show TX3
- Combined: Contact=Coffee + Category=Expense + Tag=#business → TX3

## Notes
- All test data is on TESTNET ONLY
- Safe to delete and recreate anytime
- Addresses have no real value
```

**Save as:** `TESTING_GUIDES/TEST_DATA.md`

---

**Test data setup complete! You're now ready for comprehensive feature testing.**

**Next:** Proceed to Step 4 (Blockstream Explorer Setup)

---

## Step 4: Set Up Blockstream Explorer (10 minutes)

### 4.1 Bookmark Testnet Explorer

**Open Blockstream Testnet Explorer:**
```
https://blockstream.info/testnet/
```

**Bookmark this page** - you'll use it frequently for:
- Verifying transactions
- Checking address balances
- Viewing UTXOs
- Debugging transaction issues

### 4.2 Verify Your First Transaction

**Using the transaction ID (txid) from the faucet:**

1. **Navigate to transaction page:**
   ```
   https://blockstream.info/testnet/tx/[YOUR-TXID]
   ```
   Replace `[YOUR-TXID]` with actual txid

2. **Verify transaction details:**
   - **Status:** Should say "Unconfirmed" or "Confirmed"
   - **Outputs:** Should include your `tb1q...` address
   - **Amount:** Should match faucet amount (0.001-0.01 BTC)

3. **Wait for confirmation:**
   - Testnet blocks are mined every 10-30 minutes (average)
   - 1 confirmation = included in 1 block
   - Transaction considered final after 6+ confirmations

**Screenshot checkpoint:** Transaction shows your address as output with correct amount

### 4.3 Check Your Address Balance

**Navigate to address page:**
```
https://blockstream.info/testnet/address/[YOUR-ADDRESS]
```
Replace `[YOUR-ADDRESS]` with your `tb1q...` address

**Verify:**
- **Chain Stats → Total Received:** Shows amount received from faucet
- **Mempool Stats:** Shows pending transactions (if any)
- **Unspent Outputs:** Lists UTXOs available to spend
- **Transaction History:** Shows faucet transaction

**Save this URL** - you'll use it to verify transactions during testing

---

## Step 5: Create Additional Test Wallets (10 minutes)

### 5.1 Why Multiple Wallets?

You'll need 2-3 test wallets for:
- **Wallet A (Primary):** Main testing wallet
- **Wallet B (Secondary):** Receive transactions from Wallet A
- **Wallet C (Multisig):** For multisig testing (optional)

### 5.2 Create Wallet B

**Option 1: Use Import Seed Phrase**

1. **Lock current wallet** (Settings → Lock Wallet)
2. **Click "Import Seed Phrase" tab**
3. **Use a different test seed:**
   - Generate new seed at: https://iancoleman.io/bip39/ (Testnet only!)
4. **Complete import** following same steps as wallet creation

**Option 2: Use Chrome Profile**

1. **Create new Chrome profile:**
   - Go to chrome://settings/people
   - Click "Add person" or "Add"
   - Name: "Test Wallet B"
2. **Load extension in new profile** (repeat Step 1.3)
3. **Create new wallet** (repeat Step 2.1 with different seed)

**Document your test wallets:**

| Wallet | Seed Phrase | First Address | Purpose |
|--------|-------------|---------------|---------|
| Wallet A | `[your seed]` | `tb1q...` | Primary testing |
| Wallet B | `[different seed]` | `tb1q...` | Receiving test transactions |
| Wallet C | `[optional]` | `tb1q...` | Multisig testing |

**Save this table** - you'll reference it throughout testing

---

## Step 6: Prepare Test Data (5 minutes)

### 6.1 Create Test Data Document

**Create a file:** `TEST_DATA.md` in `/TESTING_GUIDES/`

**Include:**
```markdown
# Test Data for Bitcoin Wallet Testing

## Test Wallets

### Wallet A (Primary)
- Seed Phrase: [your 12-word seed]
- Password: TestWallet123
- First Address (Native SegWit): tb1q...
- First Address (SegWit): 2...
- First Address (Legacy): m... or n...

### Wallet B (Secondary)
- Seed Phrase: [different 12-word seed]
- Password: TestWallet123
- First Address: tb1q...

## Test Addresses (For Send Testing)
- Valid testnet address 1: tb1q... (from Wallet B)
- Valid testnet address 2: 2... (SegWit from Wallet B)
- Invalid mainnet address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

## Test WIF Keys (For Private Key Import)
- Valid testnet WIF: cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy
- Network: Testnet
- Address Type: Native SegWit

## Faucet Transactions
- Faucet TX 1: [txid] - Amount: 0.01 BTC - Date: [date]
- Faucet TX 2: [txid] - Amount: 0.001 BTC - Date: [date]

## Testnet Resources
- Primary Faucet: https://testnet-faucet.mempool.co/
- Explorer: https://blockstream.info/testnet/
- BIP39 Tool: https://iancoleman.io/bip39/
```

**⚠️ SECURITY WARNING:**
- This file contains seed phrases for TEST WALLETS ONLY
- NEVER add real wallet seed phrases to this file
- NEVER commit this file to public repositories
- These seed phrases have NO REAL VALUE (testnet only)

### 6.2 Bookmark Essential Resources

**Add these bookmarks to a "Bitcoin Testing" folder:**

| Name | URL |
|------|-----|
| Testnet Faucet | https://testnet-faucet.mempool.co/ |
| Blockstream Explorer | https://blockstream.info/testnet/ |
| My Wallet A Address | https://blockstream.info/testnet/address/tb1q... |
| My Wallet B Address | https://blockstream.info/testnet/address/tb1q... |
| BIP39 Tool | https://iancoleman.io/bip39/ |
| Chrome Extensions | chrome://extensions/ |

---

## Step 7: Verify Setup is Working (10 minutes)

### 7.1 Smoke Test Checklist

**Complete this checklist to verify setup:**

- [ ] Extension loads in Chrome (version 0.10.0)
- [ ] Can click extension icon, opens in new tab
- [ ] Created Wallet A with seed phrase
- [ ] Wallet A has testnet Bitcoin (≥0.001 BTC)
- [ ] Can unlock wallet with password
- [ ] Dashboard shows correct balance
- [ ] Can view receiving address (starts with `tb1q`)
- [ ] Transaction visible on Blockstream explorer
- [ ] Created Wallet B (or second Chrome profile)
- [ ] Wallet B has different receiving address
- [ ] Bookmarked testnet explorer
- [ ] Created TEST_DATA.md with wallet info
- [ ] DevTools (F12) opens and shows console

**If all checked ✅ → Setup complete! Proceed to testing.**

**If any failed ❌ → See Troubleshooting section below**

### 7.2 Quick Functionality Test

**Test send transaction (optional but recommended):**

1. **In Wallet A, click "Send" button**
2. **Enter Wallet B's address**
3. **Amount:** 0.0001 BTC (100,000 satoshis)
4. **Fee:** Medium
5. **Review transaction**
6. **Confirm and enter password**
7. **Wait 30-60 seconds**
8. **Verify on explorer:** Transaction should appear

**If this works → Setup is fully functional!**

---

## Troubleshooting

### Extension Won't Load

**Problem:** Extension card shows errors or doesn't appear

**Solutions:**
1. Check `dist/` folder exists with files
2. Run `npm run build` again
3. Check for build errors in terminal
4. Try reloading extension: chrome://extensions/ → reload button
5. Restart Chrome browser
6. Check Chrome version (must be 88+)

### Can't Get Testnet Bitcoin

**Problem:** Faucet says "No funds" or "Rate limited"

**Solutions:**
1. Try backup faucets (listed in Step 2.5)
2. Wait 24 hours if rate-limited
3. Generate new address in wallet, try with new address
4. Ask development team for testnet Bitcoin
5. Use different browser/network if IP-banned

### Balance Not Updating

**Problem:** Faucet sent transaction but wallet shows 0 BTC

**Solutions:**
1. Wait 2-3 minutes (API delay)
2. Refresh browser tab (F5)
3. Check transaction on explorer:
   - If not on explorer → faucet didn't actually send
   - If on explorer → wallet not detecting it (bug or API issue)
4. Check console for errors (F12)
5. Try unlocking wallet again
6. Report as potential bug if persistent

### Transaction Not Confirming

**Problem:** Transaction shows "Unconfirmed" for >1 hour

**Solutions:**
1. **Check on explorer** - Is transaction there?
2. **Check fee** - Testnet requires ≥1 sat/vB
3. **Wait longer** - Testnet blocks can be 30-60 min apart
4. **Check testnet status** - Sometimes mining stops temporarily
5. **Not a bug** - Testnet is naturally slower than mainnet

### Multisig Address Mismatch

**Problem:** Co-signers generate different addresses

**Causes:**
1. Different configurations (2-of-2 vs 2-of-3)
2. Different address types (P2SH vs P2WSH)
3. Different xpub order
4. Wrong xpubs imported

**Solutions:**
1. Verify all use same configuration
2. Verify all use same address type
3. Re-import xpubs in correct order
4. Verify xpub fingerprints match exactly
5. See [FEATURE_TESTS/08_MULTISIG_WALLETS.md](./FEATURE_TESTS/08_MULTISIG_WALLETS.md) for detailed troubleshooting

---

## Network Validation Important Notes

### What is Testnet?

**Testnet Bitcoin:**
- Has NO REAL VALUE (cannot be sold or traded)
- Used for testing Bitcoin software
- Works exactly like Bitcoin but on separate network
- Addresses look different (tb1, m, n, 2 prefixes)

**Mainnet Bitcoin:**
- Has REAL VALUE (this is actual Bitcoin)
- Used for real transactions
- Addresses: bc1, 1, 3 prefixes
- **THIS WALLET DOES NOT SUPPORT MAINNET (v0.10.0)**

### Never Mix Testnet and Mainnet!

**❌ NEVER:**
- Send real Bitcoin to testnet address
- Use mainnet addresses in testnet wallet
- Use real seed phrases for testing
- Test with real Bitcoin

**✅ ALWAYS:**
- Verify addresses start with testnet prefix (tb1, m, n, 2)
- Use testnet faucets only
- Keep test seed phrases separate from real wallets
- Verify URLs contain "/testnet/"

**If you accidentally:**
- Sent real Bitcoin to testnet address → Funds are LOST (unrecoverable)
- Used real seed phrase in test wallet → CREATE NEW REAL WALLET IMMEDIATELY, transfer funds

---

## Testnet-Specific Quirks to Know

### 1. Slow Block Times
**Expected:** Blocks every 10-30 minutes (sometimes 60+ min)
**Reason:** Less mining power on testnet
**Impact:** Transactions take longer to confirm
**Solution:** Be patient, wait up to 2 hours for confirmation

### 2. Fee Estimates Can Be Wrong
**Expected:** Wallet suggests 1 sat/vB (too low)
**Reason:** Testnet fee market is unpredictable
**Impact:** Low-fee transactions may not confirm
**Solution:** Use minimum 5 sat/vB on testnet

### 3. Faucets Run Out
**Expected:** "No funds available" errors
**Reason:** Popular faucets get depleted
**Impact:** Can't get testnet BTC easily
**Solution:** Try backup faucets, wait for refill, ask dev team

### 4. Chain Reorganizations (Reorgs)
**Expected:** Transaction with 1 confirmation becomes unconfirmed
**Reason:** Testnet has less mining power, easier to reorg
**Impact:** Transactions may disappear temporarily
**Solution:** Wait for 6+ confirmations for critical tests

### 5. Testnet "Resets" Periodically
**Expected:** Entire testnet chain restarted (every ~2-3 years)
**Reason:** Blockchain gets too large, cleaned up by community
**Impact:** All testnet Bitcoin lost when this happens
**Solution:** Don't worry - it's testnet! Get new coins from faucet

---

## Quick Reference Card

**Save this for daily testing:**

```
=== QUICK REFERENCE ===

Extension Version: 0.10.0
Network: TESTNET ONLY

Wallet A Address: tb1q... [your address]
Wallet B Address: tb1q... [your address]

Faucet: https://testnet-faucet.mempool.co/
Explorer: https://blockstream.info/testnet/

Wallet A Seed: [your 12 words]
Wallet A Password: TestWallet123

Chrome Extensions: chrome://extensions/
DevTools: F12
Reload Extension: chrome://extensions/ → reload button

Need testnet BTC?
1. Copy receive address
2. Visit faucet
3. Paste address, complete CAPTCHA
4. Wait 1-2 minutes
5. Check balance

Transaction not confirming?
1. Check explorer: https://blockstream.info/testnet/tx/[txid]
2. Wait 30-60 min for testnet blocks
3. Not a bug - testnet is slow!
```

---

## You're Ready to Test!

**Setup complete! Next steps:**

1. ✅ Return to [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)
2. → Execute [PRIORITY_TEST_EXECUTION_GUIDE.md](./PRIORITY_TEST_EXECUTION_GUIDE.md) (smoke tests)
3. → Begin feature testing with [FEATURE_TESTS/01_TAB_ARCHITECTURE.md](./FEATURE_TESTS/01_TAB_ARCHITECTURE.md)

**Questions?**
- Check troubleshooting section above
- Document in [TEST_RESULTS_TRACKER.md](./TEST_RESULTS_TRACKER.md) questions log
- Ask development team in daily sync

---

**Happy testing! You're now ready to validate the Bitcoin Wallet on testnet.**
