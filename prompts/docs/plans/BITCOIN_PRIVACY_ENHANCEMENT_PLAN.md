# Bitcoin Wallet Privacy Enhancement Plan

**Version:** 1.0  
**Created:** October 22, 2025  
**Status:** Approved - Ready for Implementation  
**Related:** Bitcoin Privacy Wiki (https://en.bitcoin.it/wiki/Privacy)

---

## Executive Summary

This plan addresses privacy vulnerabilities in the Bitcoin wallet based on best practices from the Bitcoin Privacy wiki. Critical issues include change address reuse, fingerprinting UTXO selection, and contacts-driven address reuse. The plan implements privacy-by-default features and adds optional Privacy Mode toggles for advanced privacy features.

---

## Phase 1: Privacy Audit & Expert Review (Week 1)

### 1.1 Engage Expert Team for Privacy Assessment

**Blockchain Expert** - Audit transaction privacy:
- Review UTXO selection (greedy algorithm reveals wallet patterns)
- Audit change address handling (CRITICAL: line 1766 reuses first address)
- Assess Contacts feature address reuse implications
- Review transaction graph exposure

**Security Expert** - Audit network privacy:
- Review Blockstream API patterns (IP exposure, address clustering)
- Assess transaction broadcasting privacy
- Evaluate wallet fingerprinting vectors
- Review contacts privacy architecture

**Backend Developer** - Document current privacy state:
- Map all address-linking API calls
- Document change address reuse pattern
- Analyze contacts address reuse issue
- Identify privacy leaks

### 1.2 Create Privacy Audit Report

Create `prompts/docs/plans/PRIVACY_AUDIT_REPORT.md` with:
- Current privacy strengths vs. Bitcoin wiki best practices
- Critical/high/medium/low severity privacy issues
- Contacts feature privacy analysis (address reuse by design)
- Prioritized roadmap

---

## Phase 2: Default Privacy Improvements (Week 2-4)

**These features are ALWAYS ENABLED (not optional):**

### 2.1 Fix Change Address Reuse (P0 - CRITICAL)

**Current Issue:**  
`src/background/index.ts` line 1766 reuses `account.addresses[0].address`

Every transaction sends change back to the same address, enabling transaction graph analysis and revealing wallet structure.

**Fix:**
- Generate fresh change address for EVERY transaction
- Use internal chain: `handleGenerateAddress({ accountIndex, isChange: true })`
- Add helper: `getOrGenerateChangeAddress(accountIndex)` 
- Update both single-sig (line 1766) and multisig (line 2147) handlers

**Files to Modify:**
- `src/background/index.ts` (handleSendTransaction, handleBuildMultisigTransaction)

**Testing:**
- Verify unique change address per transaction
- Verify internalIndex increments correctly

### 2.2 Randomized UTXO Selection (P1 - HIGH)

**Current Issue:**  
Greedy/largest-first in `TransactionBuilder.ts` line 289 creates fingerprint. Wallet balance patterns revealed through consistent UTXO selection strategy.

**Fix (DEFAULT algorithm):**
- Replace greedy with randomized selection
- Shuffle eligible UTXOs before selection
- Still respect dust limits and fee requirements
- Keep greedy as fallback for edge cases only

**Files to Modify:**
- `src/background/bitcoin/TransactionBuilder.ts` (selectUTXOs method)

**Privacy Benefit:** Prevents wallet fingerprinting through spending patterns

### 2.3 Auto-Generate Fresh Receive Addresses (P2 - MEDIUM)

**Current Issue:**  
ReceiveScreen shows same address repeatedly, encouraging reuse.

**Fix (DEFAULT behavior):**
- Auto-generate new address on each ReceiveScreen mount
- Show banner: "New address generated for privacy"
- Display used addresses with warning icon: "⚠️ Previously used"
- Tooltip: "Bitcoin best practice: New address per transaction"

**Files to Modify:**
- `src/tab/components/ReceiveScreen.tsx` (useEffect to auto-generate)
- `src/tab/components/Dashboard.tsx` (address list visual indicators)

### 2.4 Contacts Address Reuse - Privacy Analysis & Mitigation (P0 - CRITICAL)

**Privacy Issue:**

Contacts feature fundamentally enables address reuse:
- Contact "Alice" stored with single address → Every send to Alice reuses same address
- Transaction graph links all payments to Alice
- Contact matching reveals sender identity across transactions

**Current Contact Lookup Issues:**
- `TransactionRow.tsx` line 59-62: Only checks `contact.address` (misses xpub cached addresses)
- Xpub contacts not leveraged for address rotation
- No warnings about address reuse when sending to contacts

**Required Fixes:**

**A. Xpub Contact Address Rotation:**
1. Add `lastUsedAddressIndex` field to Contact type
2. When sending to xpub contact, automatically suggest NEXT unused cached address
3. Show: "Sending to Alice's address #5 (privacy: address rotation)"
4. Allow manual address selection but warn if reusing

**B. Single Address Contact Warnings:**
1. Add privacy risk badge: "⚠️ Reuses Address" on contact cards
2. SendScreen shows warning when selecting single-address contact
3. Display counter: "Sent 5 times to this address (privacy risk)"
4. Suggest: "Upgrade to xpub contact for address rotation"

**C. Fix Transaction History Contact Matching:**
1. Update `TransactionRow.tsx` to check `contact.cachedAddresses` array (not just single address)
2. Xpub contacts should match ANY cached address
3. Show contact name with privacy indicator

**Files to Modify:**
- `src/shared/types/index.ts` (Contact.lastUsedAddressIndex field)
- `src/background/wallet/ContactsStorage.ts` (track last used index)
- `src/tab/components/SendScreen.tsx` (address rotation logic, warnings)
- `src/tab/components/shared/ContactCard.tsx` (privacy warning badge)
- `src/tab/components/shared/TransactionRow.tsx` (fix contact matching)

---

## Phase 3: Optional Privacy Mode Settings (Week 5-6)

**These features are TOGGLEABLE in Settings > Privacy Mode:**

### 3.1 Privacy Mode Settings UI

**Settings Screen - New Section:**
```
Settings
├─ Privacy Mode                      (Collapsible section)
│  
│  Individual Privacy Features:
│  ├─ [ ] Randomize Round Amounts
│  │      Add ±0.1% to round numbers (0.1 BTC → 0.10023 BTC)
│  │      Prevents change address detection
│  │
│  ├─ [ ] Randomize API Request Timing  
│  │      Add 1-5s delays between blockchain queries
│  │      Prevents timing-based address clustering
│  │      Trade-off: Slower balance updates
│  │
│  └─ [ ] Delay Transaction Broadcast
│         Wait 5-30s before broadcasting
│         Prevents timing correlation
│         Trade-off: Slower transaction sending
│
│  Privacy Tips:
│  • Default protections always active (change addresses, UTXO randomization)
│  • Use Tor browser for maximum network privacy
│  • Avoid sending round amounts
│  • Use new address for each transaction
│  
│  [Learn More About Bitcoin Privacy]
```

**Files to Create/Modify:**
- `src/tab/components/SettingsScreen.tsx` (add Privacy Mode section)
- `src/shared/types/index.ts` (PrivacySettings interface)
- `src/background/wallet/WalletStorage.ts` (store privacy preferences)

### 3.2 Round Number Randomization (Optional Toggle)

**When Enabled:**
- Detect round numbers in SendScreen: 0.1, 0.5, 1.0 BTC, etc.
- Auto-add random satoshis (±0.1%): 0.1 BTC → 0.10023 BTC
- Show tooltip: "Amount randomized for privacy (+0.1%)"
- User can disable for exact amounts

**Implementation:**
- `src/shared/utils/privacy.ts` - `detectRoundNumber()`, `randomizeAmount()`
- `src/tab/components/SendScreen.tsx` - Apply randomization if setting enabled
- `src/background/index.ts` - Check setting before building transaction

### 3.3 API Request Timing Randomization (Optional Toggle)

**When Enabled:**
- Add 1-5 second random delays between address queries
- Randomize query order (don't fetch addresses sequentially)
- Batch requests with delays between batches

**Implementation:**
- `src/background/api/BlockstreamClient.ts` - Add `privacyMode` parameter
- Add `delayBetweenRequests(1000-5000ms)` method
- `src/background/index.ts` - Pass privacy setting to API client

**Trade-off:** Balance updates 5-20 seconds slower

### 3.4 Transaction Broadcast Delay (Optional Toggle)

**When Enabled:**
- Random delay 5-30 seconds before broadcasting
- Show countdown in UI: "Broadcasting in 12 seconds... [Cancel]"
- User can skip delay by clicking "Broadcast Now"

**Implementation:**
- `src/background/api/BlockstreamClient.ts` - Add delay before POST /tx
- `src/tab/components/SendScreen.tsx` - Show countdown UI
- Allow cancel during countdown

**Trade-off:** Transactions take 5-30 seconds longer

---

## Phase 4: Documentation & User Education (Week 7)

### 4.1 Create Privacy Documentation

**Create `PRIVACY_GUIDE.md`:**
- Bitcoin privacy principles explained
- How our wallet protects privacy (defaults + optional features)
- Tor setup instructions for maximum privacy
- Contacts address reuse guidance
- When to use Privacy Mode toggles
- Trade-offs explained (privacy vs. convenience)

**Update Existing Docs:**
- `prompts/docs/plans/ARCHITECTURE.md` - Add Privacy Architecture section
- `CLAUDE.md` - Reference privacy documentation
- `README.md` - Add Privacy section

### 4.2 Add Privacy Education to UI

**In-App Privacy Tips:**
- Receive screen: "Using new address for privacy ✓"
- Send screen: "Using unique change address for privacy ✓"
- Contacts warning: "⚠️ Address reuse reduces privacy. Use xpub contacts for rotation."
- Settings: Link to privacy guide

---

## Implementation Summary

### Default Features (Always Active):
1. **Unique change addresses** - Every transaction uses fresh change address (P0)
2. **Randomized UTXO selection** - Prevents fingerprinting (P1)
3. **Auto-generate receive addresses** - Discourages address reuse (P2)
4. **Contacts privacy warnings** - Educate about address reuse risks (P0)
5. **Xpub contact address rotation** - Auto-rotate through cached addresses (P0)

### Optional Privacy Mode Features (User Toggleable):
1. **Round number randomization** - Add variance to amounts
2. **API request delays** - Random timing between queries
3. **Broadcast delays** - Random delay before sending transaction

### Settings UI Structure:
```
Privacy Mode (Collapsible Section)
├─ Individual Toggles:
│  ├─ [ ] Randomize Round Amounts
│  ├─ [ ] Randomize API Timing
│  └─ [ ] Delay Broadcast
└─ Privacy Tips + Learn More Link
```

---

## Critical Privacy Issues Identified

**CRITICAL (P0) - Must Fix:**
1. Change address reuse (line 1766, 2147) - every transaction leaks info
2. Contacts address reuse - fundamental design issue requiring warnings + xpub rotation

**HIGH (P1) - Should Fix:**
1. UTXO selection fingerprinting (largest-first reveals wallet state)

**MEDIUM (P2) - Nice to Have:**
1. Receive screen address reuse encouragement

---

## Estimated Timeline

- Phase 1 (Audit): 3-5 days
- Phase 2 (Default Improvements): 7-10 days
- Phase 3 (Optional Privacy Mode): 5-7 days  
- Phase 4 (Documentation): 3-5 days

**Total: 3-5 weeks**

---

## Privacy Principles Compliance

**Will Address (with this plan):**
- ✓ Avoid address reuse (change addresses, auto-generate receive addresses)
- ✓ Avoid change address detection (unique change addresses, optional randomization)
- ✓ Avoid UTXO fingerprinting (randomized selection)
- ✓ Network privacy guidance (Tor documentation, optional delays)

**Contacts Feature Approach:**
- Cannot eliminate address reuse (inherent to address book design)
- Mitigate with: xpub rotation, privacy warnings, usage counters
- Educate users about trade-off: convenience vs. privacy

**Out of Scope:**
- CoinJoin/PayJoin (future advanced feature)
- Lightning Network (Phase 3 roadmap)
- Full node (resource intensive)

---

**Document Status:** ✅ Approved - Ready for Implementation  
**Next Steps:** Begin Phase 1 with expert team privacy audits



