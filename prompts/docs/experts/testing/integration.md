# Integration Testing & E2E Patterns

**Last Updated**: 2025-11-01
**Owner**: Testing Expert
**Related**: [unit-tests.md](./unit-tests.md), [infrastructure.md](./infrastructure.md)

---

## Quick Navigation
- [Wallet Backup/Restore Integration Tests](#wallet-backuprestore-integration-tests)
- [Multisig Integration Tests](#multisig-integration-tests)
- [Message Passing Tests](#message-passing-tests)
- [Tab-Based Architecture Tests](#tab-based-architecture-testing)
- [Privacy Enhancement Tests](#privacy-enhancement-integration-tests)
- [Manual Testing](#manual-testing-requirements)

---

## Wallet Backup/Restore Integration Tests

**Status**: ✅ Complete (v0.12.1)
**Location**: `src/__tests__/integration/WalletBackupRestore.integration.test.ts`
**Test Count**: 22 tests passing

### Test Coverage

**Test Suites**:

1. **Simple Wallet Backup/Restore** (2 tests):
   - Basic wallet with one account
   - Wallet settings preservation

2. **Complex Wallet with Multiple Accounts** (2 tests):
   - 3 accounts + 5 contacts backup/restore
   - All account metadata preservation

3. **Imported Private Keys** (2 tests):
   - Single imported key backup/restore
   - Multiple imported keys handling

4. **Multisig Wallets with PSBTs** (1 test):
   - Multisig account + pending PSBT backup/restore

5. **Network Validation** (1 test):
   - Network mismatch detection

6. **Corruption Detection** (2 tests):
   - Encrypted data corruption detection via checksum
   - Tampered checksum detection

7. **Password Requirements** (3 tests):
   - Same password rejection
   - Minimum length enforcement
   - Valid password acceptance

8. **Complete Workflow** (1 test):
   - All features combined (HD + multisig + imported + contacts)

9. **Transaction Metadata Backup/Restore** (4 tests - NEW v0.12.1):
   - ✅ Export wallet with transaction metadata
   - ✅ Import wallet with transaction metadata
   - ✅ Backward compatibility (import backup without metadata)
   - ✅ Round-trip metadata preservation

10. **Contact Tags Backup/Restore** (3 tests - NEW v0.12.0):
    - ✅ Export wallet with contact tags
    - ✅ Import wallet with contact tags
    - ✅ Backward compatibility (import contacts without tags)

11. **Complete Wallet Restoration** (1 test - COMPREHENSIVE):
    - ✅ All data types restoration (HD accounts + multisig + imported keys + contacts + metadata + settings)

### Critical Test Cases

**Transaction Metadata Tests**:

```typescript
describe('Transaction metadata backup and restore', () => {
  it('should export wallet with transaction metadata', async () => {
    // Creates 5 transactions with metadata (tags, categories, notes)
    // Verifies metadata included in backup payload
    // Validates metadata count in backup metadata section
  });

  it('should import wallet with transaction metadata', async () => {
    // Exports wallet with 5 transaction metadata entries
    // Imports into clean storage
    // Verifies all metadata restored correctly (tags, category, notes)
  });

  it('should handle backward compatibility', async () => {
    // Simulates v0.12.0 backup (no transactionMetadata field)
    // Imports successfully without errors
    // Wallet remains fully functional
  });

  it('should preserve metadata through round-trip', async () => {
    // Export → Import → Export again
    // Compares both exports - metadata identical
  });
});
```

**Contact Tags Tests**:

```typescript
describe('Contact tags backup and restore', () => {
  it('should export wallet with contact tags', async () => {
    // Creates contacts with tags field (key-value pairs)
    // Verifies tags encrypted in backup
  });

  it('should import wallet with contact tags', async () => {
    // Restores contacts with tags
    // Verifies tags decrypted correctly
  });

  it('should handle backward compatibility', async () => {
    // Contacts without tags field (v0.11.0 format)
    // Import succeeds, tags undefined
  });
});
```

**Comprehensive Restoration Test**:

```typescript
it('should restore complete wallet with all features and data', async () => {
  // Creates wallet with:
  // - 3 HD accounts (native-segwit, segwit, legacy) with specific indices
  // - 2 imported private keys
  // - 1 multisig account (2-of-3) with pending PSBT
  // - 5 contacts with tags
  // - 10 transaction metadata entries with UTF-8 notes
  // - Custom wallet settings

  // Exports → Clears storage → Imports

  // Verifies EVERYTHING restored:
  // ✓ All accounts with exact indices (critical for gap limit)
  // ✓ All imported keys
  // ✓ Multisig config + pending PSBTs + signature status
  // ✓ All contacts with tags
  // ✓ All transaction metadata with UTF-8 characters
  // ✓ Wallet settings
  // ✓ Seed phrase can be unlocked
});
```

### Test Data Patterns

**Realistic Transaction Metadata**:
```typescript
{
  [txid]: {
    tags: ['income', 'salary'],
    category: 'Salary',
    notes: 'Monthly salary payment',
  }
}
```

**Contact Tags**:
```typescript
{
  name: 'Alice',
  address: 'tb1q...',
  tags: {
    'payment-preference': 'Bitcoin only',
    'location': 'San Francisco',
    'met-date': '2024-01-15',
  }
}
```

**UTF-8 Support**:
- Transaction notes with emojis: `'Test note with UTF-8: 💰🎉'`
- Verifies encryption preserves special characters

### Backward Compatibility Strategy

**v0.12.0 → v0.12.1 Migration**:
1. Old backups WITHOUT `transactionMetadata` field → Import succeeds
2. `payload.metadata.totalTransactionMetadata` optional
3. Import gracefully handles missing metadata
4. No errors, wallet fully functional

**v0.11.0 → v0.12.0 Migration**:
1. Contacts WITHOUT `tags` field → Import succeeds
2. Tags remain undefined after import
3. No validation errors

### Coverage Metrics

| Test Suite | Tests | Status |
|------------|-------|--------|
| Simple Wallet | 2 | ✅ Pass |
| Complex Wallet | 2 | ✅ Pass |
| Imported Keys | 2 | ✅ Pass |
| Multisig | 1 | ✅ Pass |
| Network Validation | 1 | ✅ Pass |
| Corruption Detection | 2 | ✅ Pass |
| Password Requirements | 3 | ✅ Pass |
| Complete Workflow | 1 | ✅ Pass |
| **Transaction Metadata** | **4** | **✅ Pass** |
| **Contact Tags** | **3** | **✅ Pass** |
| **Comprehensive Restoration** | **1** | **✅ Pass** |
| **TOTAL** | **22** | **✅ Pass** |

### Integration Test Best Practices

**DO ✅**:
1. ✅ Test full export → import → export round-trips
2. ✅ Verify encrypted data decrypts correctly
3. ✅ Test backward compatibility with old backup formats
4. ✅ Use realistic test data (64-char txids, valid addresses)
5. ✅ Test UTF-8 character preservation
6. ✅ Verify optional fields handled gracefully
7. ✅ Test complete data restoration (all features combined)

**DON'T ❌**:
1. ❌ Skip backward compatibility tests
2. ❌ Use placeholder transaction IDs (must be 64-char hex)
3. ❌ Ignore optional field handling
4. ❌ Test only happy paths (test missing fields too)
5. ❌ Forget to verify decryption works after import

---

---

## Multisig Integration Tests

### Testing Pyramid for Multisig

```
                    /\
                   /  \
                  /E2E \        Manual testing on testnet
                 /------\
                /  Inte  \      Complete workflows, co-signer coordination
               /----------\
              /    Unit    \    BIP67, MultisigManager, PSBTManager
             /--------------\
```

**Level 1 - Unit Tests** (✅ BIP67 Complete, ⏳ Managers Pending):
- BIP67 key sorting functions (52 tests ✅)
- MultisigManager xpub export/import (35 tests ⏳)
- PSBTManager export/import/chunk operations (50 tests ⏳)
- Individual function correctness
- Error handling and edge cases

**Level 2 - Integration Tests** (⏳ Planned):
- Complete multisig setup workflow (xpub exchange → account creation)
- PSBT signing workflow (create → sign → combine → finalize)
- Address generation consistency across co-signers
- Transaction coordination (create → distribute → collect signatures → broadcast)
- QR code chunking round-trips with large PSBTs

**Level 3 - End-to-End Tests** (⏳ Manual Testing):
- Multi-wallet simulation (3 separate wallet instances)
- Testnet transaction creation and signing
- PSBT exchange via file export/import
- QR code scanning simulation
- Transaction broadcast and confirmation monitoring

### Complete Multisig Setup Workflow

**Priority 1 - Multisig Setup Integration Test**:

```typescript
describe('Multisig Setup Integration', () => {
  it('should complete full setup with 3 co-signers', () => {
    // Step 1: Create 3 separate wallets
    const wallet1 = new HDWallet(seed1, 'testnet');
    const wallet2 = new HDWallet(seed2, 'testnet');
    const wallet3 = new HDWallet(seed3, 'testnet');

    // Step 2: Each exports their xpub
    const xpub1 = manager.exportXpub(wallet1, '2-of-3', 'p2wsh', 0);
    const xpub2 = manager.exportXpub(wallet2, '2-of-3', 'p2wsh', 0);
    const xpub3 = manager.exportXpub(wallet3, '2-of-3', 'p2wsh', 0);

    // Step 3: Each validates all xpubs
    expect(manager.validateXpub(xpub1.xpub, '2-of-3', 'p2wsh').isValid).toBe(true);
    expect(manager.validateXpub(xpub2.xpub, '2-of-3', 'p2wsh').isValid).toBe(true);
    expect(manager.validateXpub(xpub3.xpub, '2-of-3', 'p2wsh').isValid).toBe(true);

    // Step 4: Each creates their local multisig account
    const account1 = manager.createMultisigAccount(wallet1, 'Shared', '2-of-3', 'p2wsh', [
      { ...xpub1, name: 'Alice', isSelf: true },
      { ...xpub2, name: 'Bob', isSelf: false },
      { ...xpub3, name: 'Charlie', isSelf: false },
    ], 0);

    // Step 5: Verify all co-signers generate same addresses
    const address1 = generateMultisigAddress(account1, 0); // From wallet1's perspective
    const address2 = generateMultisigAddress(account1, 0); // From wallet2's perspective
    expect(address1).toBe(address2); // CRITICAL: Must be identical!
  });
});
```

### PSBT Signing Workflow

**Priority 2 - PSBT Signing Integration Test**:

```typescript
describe('PSBT Signing Integration', () => {
  it('should complete 2-of-3 signing workflow', async () => {
    // Step 1: Cosigner 1 creates transaction
    const psbt = await builder.buildMultisigTransaction({
      utxos,
      outputs: [{ address: recipient, amount: 50000 }],
      changeAddress,
      feeRate: 5,
    });

    // Step 2: Export PSBT
    const exported = manager.exportPSBT(psbt);
    expect(exported.signatures[0]).toBe(0); // No signatures yet

    // Step 3: Cosigner 1 signs
    psbt.signInput(0, wallet1KeyPair);
    expect(manager.exportPSBT(psbt).signatures[0]).toBe(1);

    // Step 4: Transfer to Cosigner 2 (simulate via base64)
    const base64 = psbt.toBase64();
    const imported = manager.importPSBT(base64);
    expect(imported.isValid).toBe(true);

    // Step 5: Cosigner 2 signs
    imported.psbt.signInput(0, wallet2KeyPair);
    expect(manager.exportPSBT(imported.psbt).signatures[0]).toBe(2);

    // Step 6: Finalize (2 of 3 signatures collected)
    imported.psbt.finalizeAllInputs();
    expect(manager.exportPSBT(imported.psbt).finalized).toBe(true);

    // Step 7: Extract and broadcast
    const txHex = imported.psbt.extractTransaction().toHex();
    expect(txHex).toBeDefined();
  });
});
```

### QR Code Chunking Integration

**Priority 3 - QR Code Chunking Integration Test**:

```typescript
describe('QR Code Chunking Integration', () => {
  it('should handle large PSBT with QR code workflow', () => {
    // Step 1: Create large PSBT (50 inputs)
    const largePsbt = createLargePSBT(50);

    // Step 2: Split into QR code chunks (~2KB each)
    const chunks = manager.createPSBTChunks(largePsbt);
    expect(chunks.length).toBeGreaterThan(1);

    // Step 3: Simulate QR code transfer (chunks received in random order)
    const shuffledChunks = shuffleArray([...chunks]);

    // Step 4: Reassemble
    const reassembled = manager.reassemblePSBTChunks(shuffledChunks);
    expect(reassembled.toBase64()).toBe(largePsbt.toBase64());

    // Step 5: Sign and re-chunk
    reassembled.signInput(0, keyPair);
    const signedChunks = manager.createPSBTChunks(reassembled);

    // Step 6: Transfer back and reassemble
    const finalPsbt = manager.reassemblePSBTChunks(signedChunks);
    expect(manager.exportPSBT(finalPsbt).signatures[0]).toBeGreaterThan(0);
  });
});
```

---

## Message Passing Tests

### Background ↔ Popup Integration

```typescript
// Popup -> Background
const response = await chrome.runtime.sendMessage({
  type: 'SEND_TRANSACTION',
  payload: { to, amount, feeRate }
});

// Background handler
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SEND_TRANSACTION') {
    // Handle transaction...
    sendResponse({ success: true, txid });
  }
  return true; // Required for async
});
```

### Message Passing Integration Tests

**Location**: `src/background/__tests__/messageHandlers.*.test.ts`

```typescript
describe('Message Passing Integration', () => {
  it('should handle CREATE_ACCOUNT request', async () => {
    const mockWallet = await initializeWallet();

    const response = await chrome.runtime.sendMessage({
      type: 'CREATE_ACCOUNT',
      payload: { name: 'New Account', type: 'legacy' }
    });

    expect(response.success).toBe(true);
    expect(response.account.name).toBe('New Account');
  });

  it('should handle IMPORT_ACCOUNT_PRIVATE_KEY request', async () => {
    const mockWallet = await initializeWallet();
    const validWIF = 'cVt4o7BGAig1UXywgGSmARhxMdzP5qvQsxKkSsc1XEkw3tDTQFpy';

    const response = await chrome.runtime.sendMessage({
      type: 'IMPORT_ACCOUNT_PRIVATE_KEY',
      payload: { wif: validWIF, name: 'Imported Account' }
    });

    expect(response.success).toBe(true);
    expect(response.account.type).toBe('imported-key');
  });
});
```

---

## Tab-Based Architecture Testing

### Architecture Transition: Popup → Tab

**Effective Date**: v0.9.0 (2025-10-14)
**Migration**: Complete - All UI code moved from `src/popup/` to `src/tab/`
**Impact**: Test infrastructure remains unchanged, but component testing requires new patterns

### Testing Implications

**Same Testing Approach**:
- ✅ React Testing Library still used
- ✅ Component unit tests work identically
- ✅ Mock Chrome APIs same way
- ✅ Test behavior, not implementation (still applies)

**What Changed**:
- Import paths: `../popup/` → `../tab/`
- New component: `Sidebar.tsx` requires testing
- Full-screen layouts instead of 600x400 constraints
- No viewport size testing needed (always full browser)

### New Components to Test

**Sidebar Component** (High Priority):

```typescript
// src/tab/components/__tests__/Sidebar.test.tsx
describe('Sidebar', () => {
  it('should render navigation items');
  it('should highlight active navigation item in orange');
  it('should show account switcher at bottom');
  it('should call onNavigate when item clicked');
  it('should render Bitcoin logo at top');
  it('should show lock button');
  it('should be exactly 240px wide');

  // ~15-20 tests needed
});
```

**App Component Updates** (Medium Priority):

```typescript
// src/tab/__tests__/App.test.tsx
describe('Tab-based App', () => {
  it('should render sidebar when unlocked');
  it('should handle navigation between views');
  it('should show dashboard by default');
  it('should render full-screen layout');
  it('should handle account switching');

  // ~10-12 tests needed
});
```

### Security Testing for Tab Features

**1. Iframe Detection** (High Priority):

```typescript
describe('Clickjacking Prevention', () => {
  it('should detect when running in iframe');
  it('should prevent React initialization in iframe');
  it('should display security error message');
  it('should not expose wallet functionality in iframe');
});
```

**2. Tab Nabbing Prevention** (High Priority):

```typescript
describe('Tab Nabbing Prevention', () => {
  it('should monitor window.location every 1 second');
  it('should detect location tampering');
  it('should lock wallet on suspicious redirect');
  it('should show security alert');
});
```

**3. Single Tab Enforcement** (Critical):

```typescript
describe('Single Tab Enforcement', () => {
  it('should issue unique session token per tab');
  it('should revoke old session when new tab opens');
  it('should validate session token on interval');
  it('should handle session expiration gracefully');

  // NOTE: Full integration requires manual testing
  // Unit tests verify component behavior only
});
```

**4. Visibility-Based Auto-Lock** (Medium Priority):

```typescript
describe('Visibility Auto-Lock', () => {
  it('should start 5-minute timer when tab hidden');
  it('should cancel timer when tab becomes visible');
  it('should lock wallet after 5 minutes hidden');
  it('should work alongside 15-minute inactivity timer');
});
```

---

## Privacy Enhancement Integration Tests

### Message Passing Privacy Tests

**Location**: `src/background/__tests__/message-passing-privacy.test.ts`

```typescript
describe('Message Passing Privacy Integration', () => {
  it('should handle GET_NEXT_CONTACT_ADDRESS round-trip', async () => {
    const contact = await createXpubContact();

    const response = await chrome.runtime.sendMessage({
      type: 'GET_NEXT_CONTACT_ADDRESS',
      payload: { contactId: contact.id }
    });

    expect(response.success).toBe(true);
    expect(response.address).toMatch(/^tb1/); // Testnet address
  });

  it('should update contact usage after send', async () => {
    const contact = await createSingleAddressContact();

    const sendResponse = await chrome.runtime.sendMessage({
      type: 'SEND_TRANSACTION',
      payload: { to: contact.address, amount: 50000 }
    });

    const incrementResponse = await chrome.runtime.sendMessage({
      type: 'INCREMENT_CONTACT_USAGE',
      payload: { contactId: contact.id }
    });

    expect(incrementResponse.success).toBe(true);
    expect(incrementResponse.usageCount).toBe(1);
  });
});
```

### End-to-End Privacy Tests

**Location**: `src/background/__tests__/privacy-e2e.test.ts`

```typescript
describe('Privacy End-to-End', () => {
  it('should use unique change address for transaction', async () => {
    const account = await createTestAccount();
    const changeAddresses = new Set<string>();

    // Send 3 transactions
    for (let i = 0; i < 3; i++) {
      const tx = await sendTransaction(account, recipient, 10000);
      changeAddresses.add(tx.changeAddress);
    }

    // CRITICAL: All change addresses must be unique (0% reuse)
    expect(changeAddresses.size).toBe(3);
  });

  it('should randomize UTXO selection', async () => {
    const utxos = [
      createMockUTXO(100000, 0),
      createMockUTXO(200000, 1),
      createMockUTXO(150000, 2),
    ];

    const selections = new Map<string, number>();

    // Run 100 selections
    for (let i = 0; i < 100; i++) {
      const result = await selectUTXOs(utxos, 150000, 5);
      const key = result.selectedUtxos.map(u => u.txid).sort().join(',');
      selections.set(key, (selections.get(key) || 0) + 1);
    }

    // Should have multiple different selection patterns
    expect(selections.size).toBeGreaterThan(1);

    // Calculate Shannon entropy
    let entropy = 0;
    selections.forEach(count => {
      const p = count / 100;
      entropy -= p * Math.log2(p);
    });

    const theoreticalMax = Math.log2(selections.size);
    const entropyPercent = (entropy / theoreticalMax) * 100;

    // CRITICAL: Entropy must exceed 50%
    expect(entropyPercent).toBeGreaterThan(50);
  });

  it('should enforce gap limit at 20 addresses', async () => {
    const account = createAccountWithUnusedAddresses(20);

    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_ADDRESS',
      payload: { accountId: account.id }
    });

    expect(response.success).toBe(false);
    expect(response.error).toContain('Gap limit');
  });
});
```

---

## Manual Testing Requirements

### Automated Testing Limitations

- ❌ Cannot test actual Chrome tab opening behavior
- ❌ Cannot test tab focus switching
- ❌ Cannot test single tab enforcement cross-tab
- ❌ Cannot test window.open() behavior

### Manual Testing Guide

**Reference**: `TAB_ARCHITECTURE_TESTING_GUIDE.md`

**Phases**: 6 test phases with detailed checklists

**Critical Tests**:
- Single tab enforcement
- Security controls (iframe, tab nabbing)
- Session management
- Navigation and routing
- Visibility-based auto-lock

**When to Manual Test**:
- Before every release
- After security control changes
- After navigation/routing changes
- After session management updates

### Manual Testing Checklist

**Multisig E2E Testing**:

- [ ] Create 3 separate wallet instances
- [ ] Export xpubs from each wallet
- [ ] Exchange xpubs via QR code or file
- [ ] Create 2-of-3 multisig account in each wallet
- [ ] Verify all wallets generate same first address
- [ ] Fund multisig address on testnet
- [ ] Create transaction in wallet 1
- [ ] Export PSBT to file
- [ ] Import PSBT in wallet 2
- [ ] Sign in wallet 2
- [ ] Export signed PSBT
- [ ] Import back to wallet 1
- [ ] Finalize and broadcast
- [ ] Verify transaction on Blockstream explorer

**Privacy Enhancement Testing**:

- [ ] Send 10 transactions, verify 10 unique change addresses
- [ ] Send to xpub contact 5 times, verify address rotation
- [ ] Send to single-address contact 5 times, see warning
- [ ] Generate 20 unused receive addresses, verify gap limit enforcement
- [ ] Enable Privacy Mode, verify round number randomization
- [ ] Enable API delays, verify 1-5 second delays
- [ ] Enable broadcast delays, verify deferred broadcasting

---

## Test File Organization

```
src/
├─ __tests__/
│  ├─ setup/
│  │  ├─ setupEnv.ts
│  │  └─ setupTests.ts
│  ├─ __mocks__/
│  │  └─ chrome.ts
│  └─ utils/
│     ├─ testConstants.ts
│     ├─ testFactories.ts
│     └─ testHelpers.ts
├─ background/
│  ├─ __tests__/
│  │  ├─ messageHandlers.test.ts
│  │  ├─ messageHandlers.accountManagement.test.ts
│  │  ├─ messageHandlers.multisig.test.ts
│  │  ├─ psbtWorkflow.test.ts
│  │  ├─ message-passing-privacy.test.ts
│  │  └─ privacy-e2e.test.ts
│  └─ wallet/
│     └─ __tests__/
│        ├─ CryptoUtils.test.ts
│        ├─ KeyManager.test.ts
│        └─ HDWallet.test.ts
├─ tab/
│  └─ components/
│     └─ __tests__/
│        ├─ Dashboard.test.tsx
│        ├─ Sidebar.test.tsx
│        └─ SendScreen.test.tsx
└─ wizard/
   └─ __tests__/
      └─ WizardApp.test.tsx
```

---

## Best Practices

### DO ✅

1. ✅ Test complete workflows, not just individual functions
2. ✅ Verify message passing between components
3. ✅ Test order-independence (multisig)
4. ✅ Use realistic test data
5. ✅ Test error propagation across layers
6. ✅ Verify state changes persist correctly
7. ✅ Test security controls comprehensively

### DON'T ❌

1. ❌ Skip integration tests in favor of only unit tests
2. ❌ Use placeholder data instead of valid Bitcoin addresses
3. ❌ Ignore cross-component interactions
4. ❌ Skip manual testing for tab-specific features
5. ❌ Test implementation details instead of user flows
6. ❌ Forget to test unhappy paths
7. ❌ Assume popup tests work without path updates

---

## Coverage Goals

| Integration Test Category | Target Coverage | Current Status |
|---------------------------|----------------|----------------|
| Wallet Backup/Restore | 100% | ✅ 100% (22 tests) |
| Message Passing | 95%+ | 🔄 In Progress |
| Multisig Workflows | 90%+ | ⏳ Planned |
| Privacy Features | 95%+ | 🔄 In Progress |
| Tab Security Controls | 100% | ⏳ Planned |
| Account Management | 95%+ | 🔄 In Progress |

---

## Cross-References

- **Unit Tests**: See [unit-tests.md](./unit-tests.md)
- **Test Infrastructure**: See [infrastructure.md](./infrastructure.md)
- **Testing Decisions**: See [decisions.md](./decisions.md)
