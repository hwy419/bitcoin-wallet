# Feature Test Guide: Multisig Wallets

**Feature Area:** Multisig Wallet Creation & Management
**Test Cases:** 30 tests
**Time to Execute:** 4-5 hours
**Priority:** P1-P2 (Advanced Feature)

---

## Overview

This feature validates multisig wallet creation, configuration (2-of-2, 2-of-3, 3-of-5), xpub export/import, PSBT (Partially Signed Bitcoin Transaction) workflow, and multisig transaction coordination. Multisig wallets require multiple signatures to spend funds, providing enhanced security.

**Why this matters:** Multisig is critical for securing large amounts of Bitcoin, business accounts, and shared wallets. The PSBT workflow must be reliable and user-friendly.

---

## Prerequisites

- [ ] Extension installed (v0.10.0)
- [ ] Wallet created and unlocked
- [ ] Chrome DevTools open (F12) for all tests
- [ ] **2-3 separate wallet instances** (different browsers or profiles) for co-signer testing
- [ ] Testnet faucets ready:
  - Primary: https://testnet-faucet.mempool.co/
  - Backup: https://coinfaucet.eu/en/btc-testnet/
- [ ] Block explorer: https://blockstream.info/testnet/
- [ ] Text editor or notes app for sharing xpubs between co-signers

**⚠️ IMPORTANT - Report Bugs with Screenshots:**
For ANY issue found during multisig testing:
1. Take screenshot of the error/issue (use Snipping Tool, Print Screen, or F12 screenshot)
2. Save console logs (F12 → Console → right-click → Save As)
3. Note exact steps to reproduce
4. File bug report (see section at end of this guide)

---

## Pre-Test Setup: Create 3 Accounts with Xpubs

**⚠️ CRITICAL SETUP STEP - DO THIS FIRST**

Before starting multisig tests, you must create 3 regular (single-signature) accounts in your wallet and export their xpubs. These xpubs will be used later during multisig wallet creation to simulate co-signers.

**Time:** 10-15 minutes
**Why:** Multisig wallets require xpubs from multiple co-signers. Creating 3 accounts now provides the xpubs you'll need for testing 2-of-2, 2-of-3, and 3-of-5 configurations without needing multiple browser instances.

### Steps to Create and Export Xpubs:

1. **Create First Account:**
   - Navigate to Dashboard
   - Click "+ New Account" button
   - Name it "Account 2 (for multisig xpub #1)"
   - Select address type: **Native SegWit (recommended)**
   - Click "Create Account"
   - **IMPORTANT:** Copy and save the **Account Xpub** shown in account details
     - Go to Settings → select "Account 2"
     - Find and copy the xpub (starts with "vpub" for Native SegWit testnet)
     - Save it in a text file as "XPUB_1.txt"

2. **Create Second Account:**
   - Click "+ New Account" again
   - Name it "Account 3 (for multisig xpub #2)"
   - Select address type: **Native SegWit (recommended)**
   - Click "Create Account"
   - Copy and save the xpub as "XPUB_2.txt"

3. **Create Third Account:**
   - Click "+ New Account" again
   - Name it "Account 4 (for multisig xpub #3)"
   - Select address type: **Native SegWit (recommended)**
   - Click "Create Account"
   - Copy and save the xpub as "XPUB_3.txt"

4. **Verify All Xpubs Saved:**
   - Check that you have 3 xpub text files
   - Each xpub should start with "vpub" (Native SegWit testnet)
   - Each xpub should be approximately 111 characters long
   - Keep these files open/accessible for multisig tests

### Expected Results After Setup:
- ✅ 3 new accounts created (total 4 accounts including the original)
- ✅ 3 xpubs copied and saved in text files
- ✅ Each xpub verified to start with "vpub"
- ✅ Wallet still unlocked and ready for testing

**📝 Note:** During multisig wallet creation (test MS-005), you'll paste these saved xpubs when the wizard asks for "co-signer xpubs". This simulates having multiple wallet instances without needing multiple browsers.

---

## Test Cases

### MS-001: Navigate to Multisig Wallet Creation

**Priority:** P1
**Time:** 2 minutes

**Purpose:** Verify multisig wallet creation is accessible

**Steps:**
1. Unlock wallet
2. Navigate to Multi-sig Wallets section (sidebar or dashboard)
3. Look for "Create Multisig Wallet" button
4. Click to start wizard

**Expected Results:**
- ✅ Multi-sig section accessible from sidebar
- ✅ "Create Multisig Wallet" button visible
- ✅ Button opens multisig wizard/modal
- ✅ Introduction screen explains multisig concept
- ✅ No console errors

**Screenshot Points:**
- Multi-sig wallet section in sidebar
- Create button

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-002: Configuration Selection - 2-of-2

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify 2-of-2 multisig configuration can be selected

**Steps:**
1. Start multisig wallet creation wizard
2. Observe configuration options
3. Click "2-of-2 Multisig" card
4. Expand "Learn more" section
5. Read warnings and use cases
6. Click "Continue"

**Expected Results:**
- ✅ Configuration selection screen shows 3 options
- ✅ 2-of-2 card displays:
  - Title: "2-of-2 Multisig"
  - Icon: 👥 or similar
  - Description: "Both signatures required"
  - Badge: "⚠️ Higher Risk if Key Lost"
- ✅ "Learn more" expands to show:
  - Use cases: "Laptop + Phone", "Desktop + Hardware wallet"
  - Warning: "If you lose ONE key, funds are PERMANENTLY LOST"
  - Recommendation: "Only use if you can securely back up both keys"
- ✅ Selection highlights card (orange border)
- ✅ "Continue" button enabled after selection

**Screenshot Points:**
- Configuration selection screen
- 2-of-2 expanded details

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-003: Configuration Selection - 2-of-3 (Recommended)

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify 2-of-3 multisig configuration (recommended option)

**Steps:**
1. Start multisig wizard
2. Observe "Recommended" badge on 2-of-3 option
3. Click "2-of-3 Multisig" card
4. Expand "Learn more"
5. Click "Continue"

**Expected Results:**
- ✅ 2-of-3 card has "✨ Recommended" badge (green or prominent)
- ✅ Card displays:
  - Title: "2-of-3 Multisig"
  - Description: "Any 2 of 3 signatures required"
  - Badge: "Low Risk" (green)
- ✅ "Learn more" shows:
  - Use cases: "Business partnerships", "Family accounts", "Personal security"
  - Benefit: "Can lose 1 key and still access funds"
  - Recovery: "Need only 2 keys to spend"
- ✅ Selection confirmed

**Screenshot Points:**
- 2-of-3 card with "Recommended" badge
- Expanded details

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-004: Configuration Selection - 3-of-5

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify 3-of-5 multisig configuration for organizations

**Steps:**
1. Start multisig wizard
2. Click "3-of-5 Multisig" card
3. Expand "Learn more"
4. Review details

**Expected Results:**
- ✅ 3-of-5 card displays:
  - Title: "3-of-5 Multisig"
  - Icon: 🏢 or organization symbol
  - Description: "Any 3 of 5 signatures required"
  - Badge: "Very Low Risk"
- ✅ "Learn more" shows:
  - Use cases: "Organizations", "DAOs", "Boards of directors"
  - Benefit: "Can lose 2 keys and still access funds"
  - Warning: "Higher coordination complexity and fees"
- ✅ Selection works correctly

**Screenshot Points:**
- 3-of-5 card details

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-005: Address Type Selection for Multisig

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify address type selection for multisig accounts

**Steps:**
1. Select 2-of-3 configuration, click "Continue"
2. Observe address type selection screen
3. Review options: P2WSH (Native SegWit), P2SH-P2WSH (SegWit), P2SH (Legacy)
4. Select "P2WSH (Native SegWit) - Recommended"
5. Click "Continue"

**Expected Results:**
- ✅ Address type screen displays 3 options
- ✅ P2WSH (Native SegWit):
  - Recommended badge
  - Description: "Lowest fees, modern format"
  - Prefix: "tb1..." (testnet)
- ✅ P2SH-P2WSH (Wrapped SegWit):
  - Description: "Good compatibility, medium fees"
  - Prefix: "2..."
- ✅ P2SH (Legacy):
  - Description: "Maximum compatibility, highest fees"
  - Prefix: "2..."
- ✅ Selection confirmed

**Screenshot Points:**
- Address type selection screen

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-006: Export Own Xpub

**Priority:** P0
**Time:** 5 minutes

**Purpose:** Verify extended public key export for sharing

**Steps:**
1. After selecting configuration and address type
2. Reach xpub export screen
3. Observe displayed xpub
4. Note fingerprint
5. Click "Copy to Clipboard"
6. Paste into text editor
7. Observe QR code
8. Save xpub for later use

**Expected Results:**
- ✅ Xpub displayed in monospace font
- ✅ Xpub format correct:
  - Testnet: starts with "tpub" (P2WSH) or "upub/vpub" (other formats)
  - Length: ~111 characters
- ✅ Fingerprint shown (8-character hex, e.g., "A1B2C3D4")
- ✅ "Copy to Clipboard" button works
- ✅ Visual feedback: "Copied!" message
- ✅ Clipboard contains exact xpub
- ✅ QR code generated and scannable
- ✅ Derivation path shown: m/48'/1'/0'/2' (for P2WSH)
- ✅ Help text: "Safe to share - cannot spend funds"
- ✅ Warning: "NEVER share your seed phrase or private keys"

**Save Your Xpub:**
```
My Xpub (Co-signer 1):
tpub_________________________________________________
_____________________________________________________

Fingerprint: ________

Derivation Path: m/48'/1'/0'/2'
```

**Screenshot Points:**
- Xpub export screen
- QR code

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-007: Import Co-signer Xpubs (2-of-3)

**Priority:** P0
**Time:** 10 minutes (with co-signers)

**Prerequisites:** Have xpubs from 2 co-signers ready

**Purpose:** Verify co-signer xpub import

**Setup:**
This requires coordination with 2 other testers or using 2 other browser profiles:
1. Co-signer 1 (you): Export xpub from step MS-006
2. Co-signer 2: Create separate wallet in Chrome Incognito, export xpub
3. Co-signer 3: Create separate wallet in Firefox, export xpub

**Steps:**
1. Continue from xpub export screen
2. Click "Continue" or "Import Co-signer Xpubs"
3. Observe import form
4. Import first co-signer:
   - Enter name: "Alice"
   - Paste Alice's xpub
   - Click "Import" or "Add"
5. Observe progress: "1 of 2 co-signers imported"
6. Import second co-signer:
   - Enter name: "Bob"
   - Paste Bob's xpub
   - Click "Import"
7. Observe progress: "2 of 2 co-signers imported"
8. Click "Create Multisig Account"

**Expected Results:**
- ✅ Import form displays clearly
- ✅ Fields: Name (required), Xpub (required)
- ✅ Validation works:
  - Valid xpub format accepted
  - Invalid format rejected with error
  - Duplicate xpub rejected: "This xpub is already imported"
  - Own xpub rejected: "Cannot import your own xpub as co-signer"
  - Wrong network rejected: "Mainnet xpub detected - this wallet uses testnet"
- ✅ Progress indicator updates: "X of Y co-signers imported"
- ✅ Fingerprint extracted and displayed for each co-signer
- ✅ Can remove imported xpub if mistake
- ✅ "Create Account" button enabled when all co-signers imported
- ✅ Multisig account created successfully

**Co-signer Xpubs for Testing:**
```
Co-signer 2 (Alice):
tpub_________________________________________________

Co-signer 3 (Bob):
tpub_________________________________________________
```

**Screenshot Points:**
- Import form
- Progress indicator
- All co-signers imported

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-007b: Verify Co-Signer Card UI Display

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify the horizontal card-based Co-Signers section displays correctly in Dashboard

**Prerequisites:** Multisig account created with 2-3 co-signers

**Steps:**
1. After creating multisig account, navigate to Dashboard
2. Scroll to "Co-Signers" section (below balance/chart)
3. Observe co-signer cards displayed horizontally
4. Verify each card shows:
   - Avatar with color or contact icon
   - Co-signer name
   - "You" badge on your own key (orange Bitcoin color)
   - Fingerprint (formatted: `a4b3 c2d1`)
   - Derivation path (e.g., `m/48'/1'/0'/2'`)
   - Collapsed xpub preview (e.g., `tpubD6N...xyz123`)
5. Click on a card to expand xpub details
6. Verify quick action buttons appear:
   - "Copy Xpub" button
   - Link to Contact button (chain icon)
   - QR Code button
7. Click "Copy Xpub" and verify clipboard feedback ("✓ Copied")
8. Click collapse to hide xpub details
9. Test horizontal scrolling if 6+ cosigners (optional)

**Expected Results:**
- ✅ Cards displayed in horizontal row
- ✅ 2-5 cosigners: Cards take full width (~20% each with gap)
- ✅ 6+ cosigners: Cards maintain 20% width, horizontal scroll enabled
- ✅ Avatar displays with unique color per cosigner
- ✅ "You" badge appears on your own cosigner card only
- ✅ Fingerprint formatted with space (e.g., `a4b3 c2d1`)
- ✅ Derivation path shows correctly (e.g., `m/48'/1'/0'/2'`)
- ✅ Xpub truncated by default, expandable on click
- ✅ Quick action buttons functional:
  - Copy Xpub copies full xpub to clipboard
  - Copy feedback displays ("✓ Copied" for 2 seconds)
  - Link to Contact button opens contact modal
  - QR Code button displays cosigner details
- ✅ Purple multisig theming consistent (border, scrollbar)
- ✅ Hover effects work (cards brighten on hover)
- ✅ Cards have consistent spacing and alignment

**Visual Verification:**
```
Expected Layout (3 cosigners):
┌──────────────┬──────────────┬──────────────┐
│  [Avatar]    │  [Avatar]    │  [Avatar]    │
│  Alice       │  You  [You]  │  Bob         │
│  a4b3 c2d1   │  5f6e 7d8c   │  9a0b 1c2d   │
│  m/48'/1'/…  │  m/48'/1'/…  │  m/48'/1'/…  │
│  tpubD6N...  │  tpubE7M...  │  tpubF8N...  │
│  [Actions]   │  [Actions]   │  [Actions]   │
└──────────────┴──────────────┴──────────────┘
```

**Contact Integration Test (Optional):**
1. If cosigner matches a saved contact (by xpub):
   - ✅ Avatar shows contact's color
   - ✅ "Linked Contact" indicator appears
2. If no contact match:
   - ✅ Avatar shows auto-generated color based on fingerprint
   - ✅ "Link to Contact" button available

**Screenshot Points:**
- Co-Signers section with all cards visible
- Expanded card showing full xpub
- Copy feedback ("✓ Copied")
- Contact link modal (if tested)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-008: Verify First Multisig Address Matches (All Co-signers)

**Priority:** P0 (Critical - Fund Safety)
**Time:** 10 minutes

**Purpose:** Verify all co-signers generate IDENTICAL first receiving address

**Prerequisites:** All 3 co-signers have created the multisig account with same configuration and xpubs

**Steps (Each Co-signer Performs):**
1. After creating multisig account
2. Navigate to Receive screen for multisig account
3. Note first receiving address

**Co-signer 1 (You):**
Address: tb1q_________________________________________

**Co-signer 2 (Alice):**
Address: tb1q_________________________________________

**Co-signer 3 (Bob):**
Address: tb1q_________________________________________

**Comparison:**
Do all 3 addresses match? [ ] YES [ ] NO

**Expected Results:**
- ✅ ALL 3 co-signers see IDENTICAL first address
- ✅ Address starts with "tb1" (P2WSH, testnet)
- ✅ Address length ~62 characters
- ✅ BIP67 key sorting ensures order independence

**If addresses DON'T match:**
🚨 **CRITICAL BUG** - DO NOT USE WALLET
- File bug report immediately with screenshots from all co-signers
- Do not send funds to mismatched address
- This indicates derivation or key sorting error

**Screenshot Points:**
- First address from each co-signer (CRITICAL for bug report if mismatch)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-009: Receive Bitcoin to Multisig Address

**Priority:** P0
**Time:** 15-30 minutes (including faucet wait)

**Prerequisites:** MS-008 passed (addresses match)

**Purpose:** Verify receiving Bitcoin to multisig address

**Steps:**
1. Get multisig receiving address: tb1q___________
2. Open testnet faucet: https://testnet-faucet.mempool.co/
3. Paste multisig address
4. Request testnet Bitcoin (0.001-0.01 BTC)
5. Complete CAPTCHA
6. Wait for transaction broadcast
7. Observe in wallet (all co-signers should see)
8. Wait for confirmations

**If primary faucet is empty, use backup:**
- https://coinfaucet.eu/en/btc-testnet/

**Expected Results:**
- ✅ Faucet accepts multisig address format
- ✅ Transaction broadcasts successfully
- ✅ ALL co-signers see transaction appear (0 conf)
- ✅ Balance updates for all co-signers
- ✅ Confirmation count increments
- ✅ After 1+ confirmations, balance confirmed

**Transaction Log:**
```
Multisig Address: tb1q_______________________
Amount Received:  __________ BTC
TX ID: __________________________________________
Block Explorer: https://blockstream.info/testnet/tx/[TX_ID]
Confirmations: 0 → 1 → 2 → ... → 6
```

**Verification (All Co-signers):**
- Co-signer 1 balance: ________ BTC
- Co-signer 2 balance: ________ BTC
- Co-signer 3 balance: ________ BTC
- All match? [ ] YES [ ] NO

**Screenshot Points:**
- Transaction in wallet (0 conf)
- Confirmed balance

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-010: Create Unsigned PSBT (Co-signer 1)

**Priority:** P0
**Time:** 10 minutes

**Prerequisites:** Multisig account has confirmed balance

**Purpose:** Verify unsigned PSBT creation

**Steps (Co-signer 1 Performs):**
1. Navigate to Send screen
2. Enter recipient address (use regular testnet address or burn address)
3. Recipient: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
4. Enter amount: 0.0001 BTC
5. Select fee: Medium
6. Click "Preview Transaction"
7. Review details
8. Enter password
9. Click "Create Transaction" or "Sign"
10. Observe unsigned PSBT created

**Expected Results:**
- ✅ Send form same as single-sig
- ✅ Indicator shows "Requires 2 of 3 signatures"
- ✅ Transaction preview shows all details
- ✅ Password required
- ✅ PSBT created (not broadcast yet)
- ✅ Status: "1 of 2 signatures" or "1 of 3 signatures collected"
- ✅ PSBT export options visible:
  - Copy as Base64
  - Copy as Hex
  - Show QR code
  - Save as file

**Save PSBT for Sharing:**
```
PSBT (Base64):
cHNidP8BAH____________________________________
________________________________________________
(Copy entire Base64 string)
```

**Screenshot Points:**
- PSBT created confirmation
- Export options
- Signature progress (1 of 2)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-011: Export PSBT - Base64 Format

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify PSBT export in Base64 format

**Steps:**
1. After creating PSBT
2. Click "Copy as Base64"
3. Paste into text editor
4. Send to co-signer 2 (via secure channel: email, Signal, etc.)

**Expected Results:**
- ✅ "Copy as Base64" button works
- ✅ Clipboard contains Base64 string
- ✅ String starts with "cHNidP8" (PSBT magic bytes)
- ✅ Visual feedback: "Copied!"
- ✅ Can be pasted and shared

**Screenshot Points:**
- Copied Base64 PSBT

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-012: Import and Add Second Signature (Co-signer 2)

**Priority:** P0
**Time:** 10 minutes

**Prerequisites:** PSBT from MS-011 received by co-signer 2

**Purpose:** Verify PSBT import and second signature

**Steps (Co-signer 2 Performs):**
1. Open multisig wallet
2. Navigate to Pending Transactions or PSBT Import
3. Click "Import PSBT"
4. Paste Base64 PSBT from co-signer 1
5. Click "Import"
6. Review transaction details
7. Verify: Recipient, amount, fee all correct
8. Enter password
9. Click "Sign Transaction"
10. Observe second signature added

**Expected Results:**
- ✅ Import PSBT option visible
- ✅ Paste area accepts Base64
- ✅ PSBT validates and imports
- ✅ Transaction details display correctly
- ✅ Shows "1 of 2 signatures present"
- ✅ Can add second signature
- ✅ After signing: "2 of 2 signatures" (for 2-of-3, meets threshold)
- ✅ "Broadcast Transaction" button enabled (threshold met)
- ✅ Can export updated PSBT with 2 signatures

**Screenshot Points:**
- Import PSBT screen
- Transaction details
- Signature progress (2 of 3, ready to broadcast)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-013: Broadcast Multisig Transaction (Co-signer 2)

**Priority:** P0
**Time:** 15-30 minutes (including confirmations)

**Prerequisites:** PSBT has 2 of 3 signatures (threshold met)

**Purpose:** Verify transaction broadcast after threshold reached

**Steps (Co-signer 2 or any co-signer with fully-signed PSBT):**
1. Verify PSBT has 2 signatures (meets 2-of-3 threshold)
2. Click "Broadcast Transaction"
3. Confirm broadcast
4. Observe transaction sent to network
5. Note transaction ID
6. Check on block explorer
7. Wait for confirmations

**Expected Results:**
- ✅ "Broadcast" button enabled when threshold met
- ✅ Confirmation prompt: "Broadcast this transaction?"
- ✅ Transaction successfully broadcast
- ✅ Transaction ID displayed
- ✅ Success message shown
- ✅ Transaction appears in history for ALL co-signers
- ✅ Balance deducted for all co-signers
- ✅ Status: Pending → Confirming → Confirmed

**Transaction Log:**
```
Multisig Transaction:
From: 2-of-3 multisig account
To: tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
Amount: 0.0001 BTC
Fee: _________ BTC
TX ID: __________________________________________
Block Explorer: https://blockstream.info/testnet/tx/[TX_ID]
Signatures: 2 of 3 (Threshold met)
Broadcast By: Co-signer 2
Status: Confirmed ✅
```

**Verification (All Co-signers):**
- All co-signers see transaction in history: [ ] YES [ ] NO
- All balances updated correctly: [ ] YES [ ] NO

**Screenshot Points:**
- Broadcast confirmation
- Transaction ID
- Block explorer confirmation

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-014: PSBT Export - QR Code Format

**Priority:** P2
**Time:** 5 minutes

**Purpose:** Verify PSBT can be exported as QR code

**Steps:**
1. Create new unsigned PSBT
2. Click "Show QR Code" or "Export as QR"
3. Observe QR code chunks (PSBT may be too large for single QR)
4. Use phone to scan QR code (if possible)

**Expected Results:**
- ✅ QR code generation works
- ✅ If PSBT > 1000 bytes, shows multiple QR chunks
- ✅ Pagination: "QR 1 of 3", "QR 2 of 3", etc.
- ✅ Each QR scannable
- ✅ Can navigate between chunks

**Screenshot Points:**
- QR code display
- Multiple chunks (if applicable)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-015: Reject PSBT with Insufficient Signatures

**Priority:** P1
**Time:** 5 minutes

**Purpose:** Verify transaction cannot broadcast without meeting threshold

**Steps:**
1. Create unsigned PSBT (1 signature only)
2. Attempt to broadcast
3. Observe error

**Expected Results:**
- ✅ "Broadcast" button DISABLED
- ✅ Message: "Need 2 of 3 signatures to broadcast"
- ✅ Progress indicator shows: "1 of 2 required signatures"
- ✅ Cannot proceed without threshold

**Screenshot Points:**
- Disabled broadcast button
- Signature requirement message

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-016: Multisig Account Badge in Account List

**Priority:** P1
**Time:** 2 minutes

**Purpose:** Verify multisig accounts are clearly labeled

**Steps:**
1. Navigate to Settings → Account Management
2. Observe account list

**Expected Results:**
- ✅ Multisig accounts have badge: "🔐 Multisig" or "2-of-3"
- ✅ Badge color: Purple or distinct from HD/Imported
- ✅ Configuration shown: "2-of-3", "3-of-5", etc.
- ✅ Address type shown: "P2WSH", "P2SH", etc.

**Visual Example:**
```
Account List:
┌─────────────────────────────────┐
│ Account 1   [HD] [Native SegWit]│
├─────────────────────────────────┤
│ Business    [🔐 2-of-3] [P2WSH] │ ← Multisig
└─────────────────────────────────┘
```

**Screenshot Points:**
- Account list with multisig badge

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-017: Cannot Generate New Addresses for Multisig (Correct Behavior)

**Priority:** P1
**Time:** 3 minutes

**Purpose:** Verify multisig address generation behavior

**Note:** Multisig accounts CAN generate new addresses using coordinated derivation. This test verifies the UI handles this correctly.

**Steps:**
1. Switch to multisig account
2. Navigate to Receive screen
3. Look for "Generate New Address" button

**Expected Results (Implementation-Dependent):**

**Option A: Can Generate (if all co-signers use same derivation):**
- ✅ "Generate New Address" button enabled
- ✅ New address generated
- ✅ All co-signers must use same address index
- ✅ Warning: "Co-signers must also generate address #X"

**Option B: Cannot Generate (simpler, safer):**
- ✅ "Generate New Address" button disabled
- ✅ Explanation: "Multisig addresses require coordination"
- ✅ Suggests using same address for multiple receives

**Document which approach is used:**
- Approach: [ ] Can Generate [ ] Cannot Generate

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-018: View Co-signer Xpubs in Account Details

**Priority:** P2
**Time:** 3 minutes

**Purpose:** Verify can view co-signer xpubs after account creation

**Steps:**
1. Navigate to multisig account settings/details
2. Look for "View Co-signers" or similar
3. Observe co-signer list

**Expected Results:**
- ✅ Co-signer information accessible
- ✅ Shows for each co-signer:
  - Name (e.g., "Alice", "Bob")
  - Fingerprint
  - Xpub (full or truncated with "Show Full" option)
- ✅ Can copy xpubs again if needed
- ✅ Cannot edit/remove co-signers (immutable after creation)

**Screenshot Points:**
- Co-signer list

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-019: Multisig Configuration Immutable

**Priority:** P1
**Time:** 2 minutes

**Purpose:** Verify multisig configuration cannot be changed after creation

**Steps:**
1. View multisig account details
2. Attempt to change configuration (2-of-3 to 2-of-2, etc.)
3. Attempt to remove co-signer
4. Attempt to add new co-signer

**Expected Results:**
- ✅ Configuration is READ-ONLY
- ✅ Cannot change threshold
- ✅ Cannot add/remove co-signers
- ✅ Cannot change address type
- ✅ Clear message: "Multisig configuration is immutable for security"

**Rationale:** Changing multisig config after creation could lead to loss of funds

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-020: 2-of-2 Multisig - Both Signatures Required

**Priority:** P1
**Time:** 20 minutes

**Purpose:** Verify 2-of-2 requires BOTH signatures (no threshold flexibility)

**Setup:**
Create new 2-of-2 multisig account with 2 co-signers

**Steps:**
1. Receive testnet Bitcoin to 2-of-2 address
2. Create PSBT with signature from co-signer 1 only
3. Attempt to broadcast with 1 signature
4. Add signature from co-signer 2
5. Broadcast with 2 signatures

**Expected Results:**
- ✅ PSBT with 1 signature: Cannot broadcast
- ✅ Message: "Need 2 of 2 signatures"
- ✅ PSBT with 2 signatures: Can broadcast
- ✅ Transaction succeeds

**Screenshot Points:**
- Signature requirement (2 of 2)
- Successful broadcast

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Edge Case Tests

### MS-EDGE-01: Import Invalid Co-signer Xpub

**Priority:** P1
**Time:** 5 minutes

**Steps:**
1. During xpub import
2. Paste invalid xpub: "xpub123456INVALID"
3. Click "Import"

**Expected:**
- ✅ Error: "Invalid xpub format"
- ✅ Import rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-02: Import Mainnet Xpub on Testnet Wallet

**Priority:** P1
**Time:** 5 minutes

**Steps:**
1. Paste mainnet xpub (starts with "xpub" instead of "tpub")
2. Click "Import"

**Expected:**
- ✅ Error: "Wrong network - mainnet xpub detected"
- ✅ Import rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-03: Import Own Xpub as Co-signer

**Priority:** P1
**Time:** 3 minutes

**Steps:**
1. Copy your own xpub
2. Try to import it as co-signer

**Expected:**
- ✅ Error: "Cannot import your own xpub as co-signer"
- ✅ Import rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-04: Import Duplicate Xpub

**Priority:** P1
**Time:** 3 minutes

**Steps:**
1. Import co-signer 1 xpub successfully
2. Try to import SAME xpub again as co-signer 2

**Expected:**
- ✅ Error: "This xpub is already imported"
- ✅ Import rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-05: PSBT Import with Wrong Multisig Account

**Priority:** P1
**Time:** 5 minutes

**Prerequisites:** Have 2 different multisig accounts

**Steps:**
1. Create PSBT in Multisig Account A
2. Switch to Multisig Account B
3. Try to import PSBT from Account A

**Expected:**
- ✅ Error: "PSBT does not match this multisig account"
- ✅ Import rejected

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-06: Sign PSBT Twice from Same Co-signer

**Priority:** P2
**Time:** 5 minutes

**Steps:**
1. Sign PSBT as co-signer 1
2. Export PSBT
3. Re-import same PSBT as co-signer 1
4. Try to sign again

**Expected:**
- ✅ Detects signature already present
- ✅ Message: "You have already signed this transaction"
- ✅ Signature count doesn't increment
- ✅ OR: No-op (idempotent signing)

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-07: Broadcast PSBT from Non-participating Co-signer

**Priority:** P2
**Time:** 5 minutes (if applicable)

**Prerequisites:** 2-of-3 multisig, PSBT signed by co-signer 1 and 2

**Steps:**
1. Co-signer 3 (did not sign) imports fully-signed PSBT
2. Co-signer 3 attempts to broadcast

**Expected:**
- ✅ Can broadcast (any co-signer can broadcast once threshold met)
- ✅ OR: Error if policy restricts broadcasting to signers only

**Document behavior:**
- Can broadcast? [ ] YES [ ] NO

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-08: Create Multisig with Missing Co-signer

**Priority:** P1
**Time:** 3 minutes

**Steps:**
1. Start 2-of-3 multisig creation
2. Import only 1 co-signer (need 2)
3. Try to click "Create Account"

**Expected:**
- ✅ "Create Account" button DISABLED
- ✅ Message: "Import 1 more co-signer to continue"
- ✅ Progress shows: "1 of 2 co-signers imported"

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-09: Very Large PSBT (Many Inputs)

**Priority:** P2
**Time:** 10 minutes (if testable)

**Prerequisites:** Multisig address with many small UTXOs

**Steps:**
1. Receive 10+ small amounts to multisig address
2. Create transaction that spends all UTXOs
3. Observe PSBT size

**Expected:**
- ✅ PSBT created successfully even with many inputs
- ✅ QR code chunking works (if too large)
- ✅ Export/import still functional

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

### MS-EDGE-10: Multisig Transaction with Change

**Priority:** P1
**Time:** 10 minutes

**Steps:**
1. Multisig account has 0.01 BTC
2. Send 0.001 BTC (change = 0.009 - fee)
3. After confirmation, verify change returned

**Expected:**
- ✅ Transaction has 2 outputs (recipient + change)
- ✅ Change goes back to multisig address (same account)
- ✅ Change address is different (new multisig address)
- ✅ All co-signers see change in balance

**Mark Result:** [ ] PASS [ ] FAIL (Bug #___ - screenshot saved: ☐)

---

## Test Summary

**Total Tests:** 20 core + 10 edge cases = 30 tests
**P0 Tests:** 6 (MS-003, MS-006, MS-007, MS-008, MS-009, MS-010, MS-012, MS-013)
**P1 Tests:** 14 (MS-001, MS-002, MS-004, MS-005, MS-011, MS-015, MS-016, MS-017, MS-019, MS-020, edges)
**P2 Tests:** 10 (MS-014, MS-018, edges)

**Critical Tests:**
- MS-008: Address matching (CRITICAL - fund safety)
- MS-009: Receive to multisig
- MS-010-013: PSBT workflow (create, export, import, sign, broadcast)

**If MS-008 fails:** 🚨 CRITICAL - File bug immediately, do not send funds

---

## Common Issues & Troubleshooting

### Issue: Addresses don't match between co-signers
**Cause:** Xpub order mismatch or derivation error
**Solution:** Verify all co-signers imported xpubs in exact same order, check BIP67 sorting
**Report As:** P0 CRITICAL BUG - Include screenshots from ALL co-signers

### Issue: Cannot import co-signer xpub
**Cause:** Network mismatch, format error, or validation bug
**Solution:** Verify xpub format and network
**Report As:** P1 bug

### Issue: PSBT import fails
**Cause:** Format error, wrong account, or parsing bug
**Solution:** Verify Base64 format and multisig account match
**Report As:** P1 bug

### Issue: Cannot broadcast with enough signatures
**Cause:** Threshold counting error
**Solution:** Check signature verification logic
**Report As:** P0 bug

---

## Filing Bug Reports for Multisig Issues

**When you find a bug during multisig testing:**

1. **Take Screenshots:**
   - The error message or unexpected behavior
   - Console logs (F12 → Console → screenshot)
   - Network logs if applicable (F12 → Network)

2. **Gather Information:**
   - Exact test case number (e.g., MS-008)
   - Exact steps you performed
   - Expected vs actual behavior
   - Configuration: 2-of-2, 2-of-3, or 3-of-5
   - Address type: P2WSH, P2SH-P2WSH, or P2SH
   - Which co-signer encountered issue

3. **File GitHub Issue:**
   - Go to: https://github.com/[REPOSITORY]/issues
   - Click "New Issue"
   - Title: "[Multisig] Brief description (Test MS-XXX)"
   - Use bug report template
   - Attach screenshots
   - Paste console logs as code block

**Example Bug Report Title:**
```
[Multisig] Addresses don't match between co-signers (Test MS-008) - P0 CRITICAL
```

4. **Mark test result:**
   - In this guide, mark test as FAIL
   - Note bug number: Bug #123
   - Check screenshot saved: ☑

---

## Multisig Coordination Tips

**For multi-tester coordination:**

1. **Use secure communication:**
   - Email, Signal, or encrypted chat for xpub sharing
   - Share xpubs via secure channel (not public)

2. **Synchronize testing:**
   - Agree on configuration (2-of-3, P2WSH, etc.) before starting
   - Share xpubs in same order
   - Verify addresses match before sending funds

3. **Document everything:**
   - Save all xpubs
   - Save all PSBTs
   - Save transaction IDs
   - Take screenshots at each step

---

**Testing complete! Return to [MASTER_TESTING_GUIDE.md](../MASTER_TESTING_GUIDE.md) for next feature.**
