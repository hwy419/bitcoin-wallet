# Wallet Restore Testing - Quick Reference

**Version**: 1.0
**Date**: 2025-10-22
**Target Release**: v0.11.0

---

## Test Coverage Targets

| Category | Target | Critical |
|----------|--------|----------|
| **New Code Overall** | 90% | - |
| **WIF Validation** | 100% | ✅ |
| **Encryption** | 100% | ✅ |
| **Transaction Signing** | 100% | ✅ |
| **Message Handler** | 95% | ✅ |
| **Frontend Components** | 85% | - |

---

## Critical Test Scenarios (Top 10)

1. ✅ **Import Plaintext WIF** (Compressed, Native SegWit)
2. ✅ **Import Encrypted WIF File** (AES-256-GCM decryption)
3. ✅ **Compressed vs Uncompressed Keys** (Address type compatibility)
4. ✅ **Wrong Network Error** (Mainnet WIF on testnet)
5. ✅ **Address Type Selection** (Legacy, SegWit, Native SegWit)
6. ✅ **Rate Limiting** (3 attempts per 15 minutes)
7. ✅ **Transaction Signing** (Non-HD account signing)
8. ✅ **Wallet Already Exists** (Error handling)
9. ✅ **Account Creation Restriction** (Non-HD limitation)
10. ✅ **Service Worker Restart** (Persistence validation)

---

## Test Suite Breakdown

### Unit Tests (~40 tests)
- **WIFManager.deriveAddress()**: 15 tests
- **CREATE_WALLET_FROM_PRIVATE_KEY**: 20 tests
- **Wallet Validation**: 10 tests
- **Transaction Signing**: 8 tests
- **Frontend Components**: 12 tests

### Integration Tests (~10 tests)
- **E2E Wallet Restore**: 5 tests
- **Transaction Flow**: 5 tests

### Manual Tests (10 scenarios)
- All critical scenarios validated on testnet

**Total**: ~60-80 tests

---

## Sample Test Data

### Testnet WIF Keys

**Compressed** (all address types):
```
WIF: cT1NR9q1V5Yqz9WzKUBbJ8UXFKPBm3Y5Y7bJRpUPZ4xQyYb7S3Yg
Addresses:
  Legacy: mhEi9gQNjVzJT3h7YqBPNRZN4V4WUvfPgK
  SegWit: 2N8hwP1WmJrFF5QWABn38y63uYLhnJYJYTF
  Native: tb1q3cdwq0z4mhqt5s5t9qykzu58kkp35hnqv2y0gr
```

**Uncompressed** (legacy only):
```
WIF: 92Pg46rUhgTT7romnV7iGW6W1gbGdeezqdbJCzShkCsYNzyyNcc
Address:
  Legacy: mhDR7X2bLqQjL9FLx5zvscuUvKUd8Y7yL6
```

---

## Quick Commands

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test
npm test -- WIFManager.test.ts

# Watch mode
npm test -- --watch

# View coverage report
open coverage/lcov-report/index.html
```

---

## Success Criteria

**Ready for release when:**

- [ ] All 60-80 tests passing (100%)
- [ ] Coverage ≥ 90% for new code
- [ ] Coverage = 100% for critical paths
- [ ] 10/10 critical scenarios pass on testnet
- [ ] Zero P0/P1 bugs
- [ ] Test report generated and approved

---

## Time Estimates

- **Unit Test Development**: 2 days
- **Integration Test Development**: 1 day
- **Manual Testing**: 1 day
- **Total**: 4 days

---

## Key Test Files

**Backend:**
- `src/background/wallet/__tests__/WIFManager.test.ts`
- `src/background/__tests__/CreateWalletFromPrivateKey.test.ts`
- `src/background/__tests__/WalletValidation.test.ts`
- `src/background/__tests__/NonHDTransactionSigning.test.ts`

**Frontend:**
- `src/tab/components/AccountManagement/__tests__/PrivateKeyImport.test.tsx`

**Integration:**
- `src/__tests__/integration/WalletRestoreFlow.test.ts`
- `src/__tests__/integration/NonHDTransactionFlow.test.ts`

---

**Full Details**: See `WALLET_RESTORE_TEST_PLAN.md`
