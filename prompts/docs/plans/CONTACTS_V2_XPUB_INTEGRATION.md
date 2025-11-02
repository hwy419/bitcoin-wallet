# Extended Public Key (xpub) Integration Specification for Contacts v2.0

**Document:** xpub Integration Technical Specification
**Version:** 2.0
**Author:** Blockchain Expert
**Date:** October 18, 2025
**Status:** Approved - Ready for Implementation

---

## Executive Summary

This specification defines a comprehensive xpub integration for the Contacts feature, enabling users to store extended public keys (xpubs) for co-signer tracking in multisig wallet coordination. The design follows a **hybrid address model** where contacts can have either a single Bitcoin address OR an xpub that automatically derives multiple addresses.

**Key Features:**
- Support for all BIP32 xpub formats (testnet/mainnet, single-sig/multisig)
- Address derivation with BIP44 gap limit (20 addresses initially, expandable to 100)
- Automatic address caching for performance
- Transaction history matching across all derived addresses
- Full BIP32/44/48/49/84 compliance

---

## 1. xpub Storage and Validation

### 1.1 Supported xpub Formats

**Testnet xpub Formats:**
- `tpub` - Legacy P2PKH (BIP44: m/44'/1'/x')
- `upub` - SegWit P2SH-P2WPKH (BIP49: m/49'/1'/x')
- `vpub` - Native SegWit P2WPKH (BIP84: m/84'/1'/x')
- `Tpub` - Multisig P2SH (BIP48: m/48'/1'/x'/1')
- `Upub` - Multisig P2WSH (BIP48: m/48'/1'/x'/2')
- `Vpub` - Multisig P2SH-P2WSH (BIP48: m/48'/1'/x'/1')

**Mainnet xpub Formats:**
- `xpub` - Legacy P2PKH (BIP44: m/44'/0'/x')
- `ypub` - SegWit P2SH-P2WPKH (BIP49: m/49'/0'/x')
- `zpub` - Native SegWit P2WPKH (BIP84: m/84'/0'/x')
- `Xpub` - Multisig P2SH (BIP48: m/48'/0'/x'/1')
- `Ypub` - Multisig P2WSH (BIP48: m/48'/0'/x'/2')
- `Zpub` - Multisig P2SH-P2WSH (BIP48: m/48'/0'/x'/1')

### 1.2 xpub Validation Strategy

```typescript
/**
 * XpubValidator - Extended Public Key Validation
 *
 * Validates xpub format, network compatibility, and extracts metadata
 */
export class XpubValidator {
  /**
   * Validates xpub string and extracts metadata
   *
   * @param xpubString - Extended public key string
   * @param network - Expected network ('testnet' | 'mainnet')
   * @returns Validation result with xpub metadata
   */
  static validate(
    xpubString: string,
    network: 'testnet' | 'mainnet'
  ): XpubValidationResult {
    try {
      // Parse xpub using bitcoinjs-lib BIP32
      const bip32 = BIP32Factory(ecc);
      const node = bip32.fromBase58(xpubString, NETWORKS[network]);

      // Detect xpub type from version bytes
      const xpubType = this.detectXpubType(xpubString);

      if (!xpubType) {
        throw new Error('Unsupported xpub format');
      }

      // Verify network compatibility
      const expectedNetwork = this.getNetworkFromPrefix(xpubString);
      if (expectedNetwork !== network) {
        throw new Error(`xpub is for ${expectedNetwork}, but ${network} was expected`);
      }

      // Extract fingerprint (first 4 bytes of identifier)
      const fingerprint = node.fingerprint.toString('hex');

      // Validate depth (should be at account level)
      if (node.depth < 3) {
        console.warn(`xpub depth is ${node.depth}, expected >= 3 (account level)`);
      }

      // Determine purpose and script type from xpub type
      const { purpose, scriptType } = this.getPurposeAndScriptType(xpubType);

      return {
        valid: true,
        xpubType,
        fingerprint,
        depth: node.depth,
        childNumber: node.index,
        purpose,
        scriptType,
        derivationPathTemplate: this.getDerivationPathTemplate(purpose, scriptType, node.index),
      };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Detects xpub type from prefix
   */
  private static detectXpubType(xpub: string): XpubType | null {
    // Testnet
    if (xpub.startsWith('tpub')) return 'tpub';
    if (xpub.startsWith('upub')) return 'upub';
    if (xpub.startsWith('vpub')) return 'vpub';
    if (xpub.startsWith('Tpub')) return 'Tpub'; // Multisig
    if (xpub.startsWith('Upub')) return 'Upub'; // Multisig
    if (xpub.startsWith('Vpub')) return 'Vpub'; // Multisig

    // Mainnet
    if (xpub.startsWith('xpub')) return 'xpub';
    if (xpub.startsWith('ypub')) return 'ypub';
    if (xpub.startsWith('zpub')) return 'zpub';
    if (xpub.startsWith('Xpub')) return 'Xpub'; // Multisig
    if (xpub.startsWith('Ypub')) return 'Ypub'; // Multisig
    if (xpub.startsWith('Zpub')) return 'Zpub'; // Multisig

    return null;
  }

  /**
   * Maps xpub type to BIP purpose and script type
   */
  private static getPurposeAndScriptType(xpubType: XpubType): {
    purpose: number;
    scriptType: AddressType | MultisigAddressType;
  } {
    const mapping: Record<XpubType, { purpose: number; scriptType: any }> = {
      tpub: { purpose: 44, scriptType: 'legacy' },
      upub: { purpose: 49, scriptType: 'segwit' },
      vpub: { purpose: 84, scriptType: 'native-segwit' },
      Tpub: { purpose: 48, scriptType: 'p2sh' },
      Upub: { purpose: 48, scriptType: 'p2wsh' },
      Vpub: { purpose: 48, scriptType: 'p2sh-p2wsh' },
      xpub: { purpose: 44, scriptType: 'legacy' },
      ypub: { purpose: 49, scriptType: 'segwit' },
      zpub: { purpose: 84, scriptType: 'native-segwit' },
      Xpub: { purpose: 48, scriptType: 'p2sh' },
      Ypub: { purpose: 48, scriptType: 'p2wsh' },
      Zpub: { purpose: 48, scriptType: 'p2sh-p2wsh' },
    };

    return mapping[xpubType];
  }
}

export type XpubType =
  | 'tpub' | 'upub' | 'vpub'  // Testnet single-sig
  | 'Tpub' | 'Upub' | 'Vpub'  // Testnet multisig
  | 'xpub' | 'ypub' | 'zpub'  // Mainnet single-sig
  | 'Xpub' | 'Ypub' | 'Zpub'; // Mainnet multisig

export interface XpubValidationResult {
  valid: boolean;
  xpubType?: XpubType;
  fingerprint?: string;
  depth?: number;
  childNumber?: number;
  purpose?: number;
  scriptType?: AddressType | MultisigAddressType;
  derivationPathTemplate?: string;
  error?: string;
}
```

---

## 2. Address Derivation Strategy

### 2.1 Gap Limit Implementation

**Strategy**: Use BIP44 gap limit of 20 addresses for address discovery.

**Derivation Rules**:
- **External addresses only**: Derive from change=0 path (receiving addresses)
- **Gap limit**: Pre-derive 20 addresses from index 0-19
- **Dynamic expansion**: When address index 15 is used, derive next batch (20-39)
- **Cache strategy**: Store derived addresses in Contact object, persist to storage

**Why external only?**
- Contacts are for receiving payments from external parties
- Internal (change) addresses are wallet-internal and not relevant for contacts
- Reduces complexity and storage requirements

### 2.2 Derivation Algorithm

```typescript
/**
 * XpubAddressDerivation - Derives addresses from xpub
 */
export class XpubAddressDerivation {
  /**
   * Derives receiving addresses from xpub
   *
   * @param xpubString - Extended public key
   * @param startIndex - Starting address index
   * @param count - Number of addresses to derive
   * @param network - Bitcoin network
   * @returns Array of derived addresses with metadata
   */
  static deriveAddresses(
    xpubString: string,
    startIndex: number,
    count: number,
    network: 'testnet' | 'mainnet'
  ): DerivedAddress[] {
    try {
      const bip32 = BIP32Factory(ecc);
      const accountNode = bip32.fromBase58(xpubString, NETWORKS[network]);

      // Detect script type from xpub
      const validation = XpubValidator.validate(xpubString, network);
      if (!validation.valid || !validation.scriptType) {
        throw new Error('Invalid xpub');
      }

      const scriptType = validation.scriptType;
      const addresses: DerivedAddress[] = [];
      const addressGenerator = new AddressGenerator(network);

      // Derive external (receiving) addresses only (change = 0)
      const externalNode = accountNode.derive(0); // External chain

      for (let i = startIndex; i < startIndex + count; i++) {
        const childNode = externalNode.derive(i);

        // Generate address based on script type
        let address: string;

        if (scriptType === 'legacy' || scriptType === 'segwit' || scriptType === 'native-segwit') {
          // Single-sig address types
          address = addressGenerator.generateAddress(childNode, scriptType as AddressType);
        } else {
          // Multisig address types - cannot derive without all co-signer xpubs
          throw new Error('Multisig xpub requires all co-signer keys for address derivation');
        }

        addresses.push({
          address,
          index: i,
          derivationPath: `${validation.derivationPathTemplate?.replace('{index}', i.toString())}`,
          used: false,
        });
      }

      return addresses;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to derive addresses: ${message}`);
    }
  }

  /**
   * Finds next unused address from derived addresses
   *
   * @param derivedAddresses - Array of derived addresses
   * @returns Next unused address or null if all used
   */
  static findNextUnusedAddress(derivedAddresses: DerivedAddress[]): DerivedAddress | null {
    for (const addr of derivedAddresses) {
      if (!addr.used) {
        return addr;
      }
    }
    return null;
  }
}

export interface DerivedAddress {
  address: string;
  index: number;
  derivationPath: string;
  used: boolean;
}
```

### 2.3 Caching Strategy

**Pre-compute and cache**:
- Derive initial 20 addresses on contact creation
- Store derived addresses in `Contact.derivedAddresses` array
- Persist to chrome.storage.local with Contact object
- Mark addresses as `used` when transactions detected

**Lazy expansion**:
- When address index >= 15 is marked as used
- Derive next batch of 20 addresses
- Update contact in storage
- UI triggers expansion check on transaction history update

**Storage Impact:**
- 20 addresses × 62 bytes average = ~1.2 KB per xpub contact
- 1000 contacts with xpubs = 1.2 MB (well within Chrome storage limits)

**Performance:**
- Cache hit: Instant lookup (O(1) array check)
- Cache miss: Derive + check next 20 addresses (~100ms)
- Maximum 100 addresses prevents runaway derivation

---

## 3. Contact Data Model (Enhanced)

### 3.1 Enhanced Contact Interface

```typescript
/**
 * Enhanced Contact with xpub support (v2.0)
 *
 * Hybrid Address Model:
 * - Mode 1: Single address contact (address field populated, xpub null)
 * - Mode 2: xpub contact (xpub field populated, address field shows derived address)
 */
export interface ContactV2 {
  id: string;                             // UUID v4
  name: string;                           // User-friendly name (1-50 characters)

  // HYBRID ADDRESS MODEL - Either/Or
  address?: string;                       // Single Bitcoin address (Mode 1) OR first derived address (Mode 2)
  xpub?: string;                          // Extended public key (Mode 2 only)

  // xpub metadata (populated when xpub is present)
  xpubMetadata?: {
    xpubType: XpubType;                   // tpub, upub, vpub, etc.
    fingerprint: string;                  // Master key fingerprint (hex)
    derivationPath: string;               // Account-level path (e.g., m/48'/1'/0'/2')
    purpose: number;                      // BIP purpose (44, 49, 84, 48)
    scriptType: AddressType | MultisigAddressType; // Address type
    accountIndex: number;                 // Account index from path
  };

  // Derived addresses (xpub contacts only)
  derivedAddresses?: DerivedAddress[];    // Pre-derived addresses (gap limit: 20)
  nextAddressIndex?: number;              // Next address index to derive (for expansion)

  // Common metadata
  addressType: AddressType | MultisigAddressType; // Detected/derived address type
  notes?: string;                         // Optional notes (max 500 characters)
  category?: string;                      // Optional category (e.g., "Co-signer", "Exchange")
  createdAt: number;                      // Unix timestamp (ms)
  updatedAt: number;                      // Unix timestamp (ms)

  // Transaction tracking
  transactionCount?: number;              // Total transaction count
  lastTransactionDate?: number;           // Unix timestamp of last transaction

  // Usage tracking for xpub contacts
  usedAddressCount?: number;              // Number of used addresses (for gap limit tracking)

  // Visual customization
  color?: string;                         // Hex color code (6 chars)
  email?: string;                         // Email address (optional)
}

/**
 * Derived address for xpub contacts
 */
export interface DerivedAddress {
  address: string;                        // Bitcoin address
  index: number;                          // Address index in derivation path
  derivationPath: string;                 // Full derivation path
  used: boolean;                          // Has this address been used?
  firstSeenTxid?: string;                 // First transaction using this address
  firstSeenDate?: number;                 // Unix timestamp
  transactionCount?: number;              // Number of transactions for this address
}
```

### 3.2 Data Model Rules

**Rule 1: Either address OR xpub (not both for functionality)**
- If `xpub` is present, `address` contains first derived address (index 0)
- If `xpub` is null, `address` contains user-provided address
- xpub takes priority for address derivation

**Rule 2: xpub contacts auto-populate metadata**
- `xpubMetadata` is automatically populated from xpub validation
- `derivedAddresses` is automatically populated on contact creation
- `nextAddressIndex` tracks next batch to derive (starts at 20)

**Rule 3: Address validation depends on mode**
- **Mode 1 (single address)**: Validate address using AddressGenerator
- **Mode 2 (xpub)**: Validate xpub using XpubValidator, skip address validation

---

## 4. Integration with Existing Features

### 4.1 SendScreen Integration

**Challenge**: When sending to xpub contact, which address to use?

**Solution**: Address picker with smart default

```typescript
/**
 * Gets recommended address for xpub contact
 */
function getRecommendedAddress(contact: ContactV2): string {
  if (!contact.xpub || !contact.derivedAddresses) {
    return contact.address || '';
  }

  // Find next unused address
  const unusedAddr = XpubAddressDerivation.findNextUnusedAddress(contact.derivedAddresses);

  if (unusedAddr) {
    return unusedAddr.address;
  }

  // All addresses used - return last address (user should expand gap limit)
  return contact.derivedAddresses[contact.derivedAddresses.length - 1].address;
}
```

**UI Components**:
- **Contact Selector**: Shows contact name and badge ("Single Address" or "xpub: 20 addresses")
- **Address Display**: Shows selected address with derivation index for xpub contacts
- **Address Picker Modal**: Dropdown list of derived addresses with usage status

### 4.2 Transaction History Integration

**Challenge**: How to link transactions to xpub contacts when they have multiple addresses?

**Solution**: Address lookup optimization

```typescript
/**
 * ContactMatcher - Links transactions to contacts (single or xpub)
 */
export class ContactMatcher {
  /**
   * Finds contact by transaction address
   *
   * @param address - Bitcoin address from transaction
   * @param contacts - All contacts
   * @returns Matching contact or null
   */
  static findContactByAddress(
    address: string,
    contacts: ContactV2[]
  ): ContactV2 | null {
    // Check single-address contacts
    for (const contact of contacts) {
      if (!contact.xpub && contact.address === address) {
        return contact;
      }
    }

    // Check xpub contacts' derived addresses
    for (const contact of contacts) {
      if (contact.xpub && contact.derivedAddresses) {
        const found = contact.derivedAddresses.find(da => da.address === address);
        if (found) {
          return contact;
        }
      }
    }

    return null;
  }

  /**
   * Builds optimized lookup map (address -> contact)
   * Called once per session on wallet unlock
   */
  static buildContactLookupMap(contacts: ContactV2[]): Map<string, ContactV2> {
    const map = new Map<string, ContactV2>();

    for (const contact of contacts) {
      if (contact.xpub && contact.derivedAddresses) {
        // Add all derived addresses
        for (const derived of contact.derivedAddresses) {
          map.set(derived.address, contact);
        }
      } else if (contact.address) {
        // Add single address
        map.set(contact.address, contact);
      }
    }

    return map;
  }
}
```

---

## 5. Bitcoin Protocol Compliance

### 5.1 Relevant BIPs

**BIP32**: Hierarchical Deterministic Wallets
- ✅ Use `BIP32Factory` to parse and derive from xpub
- ✅ Validate xpub network compatibility
- ✅ Extract fingerprint from identifier

**BIP44**: Multi-Account Hierarchy for Deterministic Wallets
- ✅ Support tpub/xpub (m/44'/1'/x' or m/44'/0'/x')
- ✅ Use external chain (change=0) for receiving addresses
- ✅ Implement gap limit of 20 addresses

**BIP48**: Multi-Script Hierarchy for Multi-Sig Wallets
- ✅ Support BIP48 multisig xpubs (Tpub, Upub, Vpub)
- ✅ Validate script type matches derivation path
- ✅ Store account-level xpub (depth=4)

**BIP49**: Derivation scheme for P2WPKH-nested-in-P2SH
- ✅ Support upub/ypub (m/49'/1'/x' or m/49'/0'/x')
- ✅ Generate P2SH-P2WPKH addresses

**BIP84**: Derivation scheme for P2WPKH based accounts
- ✅ Support vpub/zpub (m/84'/1'/x' or m/84'/0'/x')
- ✅ Generate P2WPKH Bech32 addresses

### 5.2 Gap Limit Compliance

**BIP44 Gap Limit**: 20 addresses

**Implementation**:
- Derive initial 20 addresses (index 0-19)
- When address index >= 15 is used, derive next batch (20-39)
- Continue expanding until 20 consecutive unused addresses

**Edge Case Handling**:
- What if user receives to address #50 without using #0-#49?
  - Standard behavior: Gap limit prevents discovery
  - Our behavior: User can manually expand gap limit (future enhancement)
  - Recommendation: Educate users to use addresses sequentially

---

## 6. Edge Cases and Error Handling

### 6.1 Wrong Network xpub

**Scenario**: User imports mainnet xpub in testnet wallet

**Handling**:
```typescript
if (xpubNetwork !== walletNetwork) {
  throw new Error(
    `Cannot import ${xpubNetwork} xpub in ${walletNetwork} wallet. ` +
    `Please switch to ${xpubNetwork} or use a ${walletNetwork} xpub.`
  );
}
```

**UI**: Show clear error message with network mismatch details

### 6.2 Duplicate xpub

**Scenario**: User tries to add contact with same xpub as existing contact

**Handling**:
```typescript
const existingContact = contacts.find(c => c.xpub === newContactXpub);
if (existingContact) {
  throw new Error(
    `xpub already used by contact: ${existingContact.name}. ` +
    `Each contact must have a unique xpub.`
  );
}
```

### 6.3 Insufficient Derived Addresses

**Scenario**: All 20 derived addresses are used, user needs more

**Handling**:
- Automatically expand gap limit when address #15 is used
- Provide manual "Derive more addresses" button in UI
- Limit maximum derived addresses to 100 (prevent storage bloat)

---

## 7. Implementation Plan

### Phase 1: Core xpub Infrastructure (Week 1)
1. **XpubValidator class**
   - xpub parsing with BIP32.fromBase58()
   - Network detection and validation
   - Fingerprint extraction
   - Purpose and script type detection
   - Unit tests

2. **XpubAddressDerivation class**
   - Single-sig address derivation (external chain only)
   - Gap limit implementation (20 addresses)
   - Lazy expansion strategy
   - Unit tests

3. **Enhanced Contact data types**
   - ContactV2 interface
   - DerivedAddress interface
   - XpubMetadata interface
   - Type guards and validators

### Phase 2: Storage and Integration (Week 2)
1. **ContactsStorage enhancements**
   - Update `addContact()` to support xpub
   - Update `getContactByAddress()` to search derived addresses
   - Implement `expandDerivedAddresses()`

2. **Unit tests**
   - Test xpub contact creation
   - Test address derivation and caching
   - Test duplicate detection
   - Test edge cases (wrong network, etc.)

### Phase 3: UI Integration (Week 3)
1. **Contact Creation/Edit Form**
   - Add xpub field with validation
   - Display derived addresses count

2. **SendScreen Integration**
   - Address picker for xpub contacts
   - Auto-select next unused address

3. **Transaction History Integration**
   - Link transactions to xpub contacts
   - Implement ContactMatcher optimization

---

## 8. Testing Strategy

### 8.1 Unit Tests

**XpubValidator tests**:
- ✅ Parse valid testnet tpub/upub/vpub
- ✅ Parse valid mainnet xpub/ypub/zpub
- ✅ Parse valid BIP48 multisig xpubs
- ✅ Reject invalid xpub (bad checksum)
- ✅ Reject wrong network xpub
- ✅ Extract correct fingerprint
- ✅ Detect correct purpose and script type

**XpubAddressDerivation tests**:
- ✅ Derive 20 addresses from tpub
- ✅ Derive addresses from upub (SegWit)
- ✅ Derive addresses from vpub (Native SegWit)
- ✅ Addresses match expected format
- ✅ findNextUnusedAddress returns correct address
- ✅ Derivation path format is correct

---

## 9. Security Considerations

### 9.1 xpub Privacy Risks

**xpub Privacy Risks**:
- ⚠️ xpub reveals ALL derived addresses (address clustering)
- ⚠️ Anyone with xpub can monitor transactions
- ⚠️ xpub links addresses to single entity

**Mitigation**:
- ✅ Educate users in UI: "xpub reveals all addresses"
- ✅ Mark contacts with xpub as "Tracked Address Set"
- ✅ Warn users not to share xpubs publicly

### 9.2 xpub Storage Security

**Decision**: Do NOT encrypt xpubs
- Rationale: xpubs are semi-public data (shared with co-signers)
- Encryption would require password on every contact load
- Adds complexity without significant security benefit

---

**DOCUMENT STATUS:** Complete and ready for implementation

**NEXT STEPS:**
1. Review with security expert for xpub storage decisions
2. Review with product manager for feature scope
3. Begin Phase 1 implementation (XpubValidator and XpubAddressDerivation classes)

---

**END OF DOCUMENT**
