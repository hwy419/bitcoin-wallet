# Wallet Restore Frontend - Quick Reference Summary

**Version**: 1.0
**Date**: 2025-10-22
**Companion Document**: [WALLET_RESTORE_FRONTEND_PLAN.md](./WALLET_RESTORE_FRONTEND_PLAN.md)

---

## Overview

Quick reference guide for implementing the "Import Private Key" feature in WalletSetup.

**What**: Add third tab to WalletSetup for importing wallets from private keys (WIF format)

**Why**: Users who exported private keys cannot restore without seed phrase (critical recovery gap)

**How**: New tab with upload/paste options, address type selection, password fields, privacy warnings

---

## Component Checklist

**11 Components to Create:**

- [ ] **WalletSetup.tsx** (modify existing) - Add third tab
- [ ] **ImportMethodSelector.tsx** - Upload/Paste toggle
- [ ] **FileUploadZone.tsx** - Drag-drop file upload
- [ ] **WIFTextarea.tsx** - WIF input with validation
- [ ] **AddressTypeSelector.tsx** - Radio cards for address types
- [ ] **AddressPreviewCard.tsx** - Individual address preview
- [ ] **PasswordFieldGroup.tsx** - Grouped password fields
- [ ] **PasswordStrengthMeter.tsx** - Visual password strength
- [ ] **PrivacyWarningBanner.tsx** - Dismissible info banner
- [ ] **PrivacyAcknowledgment.tsx** - Mandatory checkbox
- [ ] **ErrorBanner.tsx** - Error display component

---

## State Structure

```typescript
interface ImportPrivateKeyState {
  // Input
  inputMethod: 'file' | 'paste';
  selectedFile: File | null;
  pastedWIF: string;

  // WIF Detection
  isEncrypted: boolean;
  detectedNetwork: 'testnet' | 'mainnet' | null;
  detectedCompression: boolean | null;

  // Address Type
  selectedAddressType: AddressType | null;
  previewAddresses: {
    legacy: string | null;
    segwit: string | null;
    nativeSegwit: string | null;
  };
  availableAddressTypes: AddressType[];

  // Passwords
  filePassword: string;
  walletPassword: string;
  confirmPassword: string;

  // Account
  accountName: string;

  // UI State
  isValidating: boolean;
  isImporting: boolean;
  validationError: string | null;
  importError: string | null;

  // Privacy
  privacyNoticeDismissed: boolean;
  privacyAcknowledged: boolean;
}
```

---

## Implementation Flow

### Step 1: Tab Structure
1. Add `'import-key'` to `SetupTab` type
2. Add third tab button to WalletSetup
3. Add conditional rendering for ImportPrivateKeyTab
4. Test tab navigation

### Step 2: Input Method
1. Create ImportMethodSelector (segmented control)
2. Create FileUploadZone (drag-drop + picker)
3. Create WIFTextarea (with validation feedback)
4. Implement file reading logic
5. Test both input methods

### Step 3: WIF Validation
1. Add validateWIF function (debounced 300ms)
2. Call VALIDATE_WIF message handler
3. Display validation feedback (success/error)
4. Extract network and compression info
5. Test validation flow

### Step 4: Address Previews
1. Create AddressTypeSelector component
2. Create AddressPreviewCard component
3. Call GENERATE_ADDRESS_PREVIEWS message handler
4. Display 3 cards (or 1 for uncompressed)
5. Implement address type selection
6. Test preview generation

### Step 5: Password Fields
1. Create PasswordFieldGroup component
2. Create PasswordStrengthMeter component
3. Implement password validation
4. Add show/hide toggles
5. Test password fields

### Step 6: Privacy Warnings
1. Create PrivacyWarningBanner (dismissible info)
2. Create PrivacyAcknowledgment (mandatory checkbox)
3. Implement acknowledgment logic
4. Disable import button until checked
5. Test privacy flow

### Step 7: Import Logic
1. Implement handleImportFromPrivateKey
2. Add decryption logic (if encrypted)
3. Call CREATE_WALLET_FROM_PRIVATE_KEY message handler
4. Handle success/error states
5. Redirect to unlock screen
6. Test full import flow

---

## Message Handlers

**Backend message types needed:**

```typescript
MessageType.VALIDATE_WIF
  Request: { wif: string }
  Response: {
    valid: boolean;
    network?: 'testnet' | 'mainnet';
    compressed?: boolean;
    availableAddressTypes?: AddressType[];
    error?: string;
  }

MessageType.GENERATE_ADDRESS_PREVIEWS
  Request: { wif: string }
  Response: {
    legacy?: string;
    segwit?: string;
    nativeSegwit?: string;
  }

MessageType.DECRYPT_ENCRYPTED_WIF
  Request: { encryptedWIF: string; password: string }
  Response: { wif: string }

MessageType.CREATE_WALLET_FROM_PRIVATE_KEY
  Request: {
    wif: string;
    addressType: AddressType;
    accountName: string;
    password: string;
  }
  Response: {
    firstAddress: string;
    addressType: AddressType;
    network: 'testnet' | 'mainnet';
  }
```

---

## Validation Rules

### WIF Validation
- Must be valid Base58Check
- Must match network (testnet only for MVP)
- Checksum must be valid
- Network detected from first character

### File Validation
- Max size: 100KB
- Allowed types: .txt, text/plain
- Must contain valid WIF (encrypted or plaintext)

### Password Validation
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- Passwords must match

### Address Type Validation
- Uncompressed keys → Legacy only
- Compressed keys → All 3 types
- Must select address type before import

### Privacy Validation
- Must acknowledge privacy warning (checkbox)
- Cannot proceed without acknowledgment

---

## Error Handling

**Error types and user messages:**

| Error Code | User Message |
|-----------|--------------|
| INVALID_WIF | "Invalid WIF format. Please check your private key." |
| WRONG_NETWORK | "Wrong network: This is a mainnet key, testnet required." |
| WEAK_PASSWORD | "Password does not meet security requirements." |
| INCOMPATIBLE_ADDRESS_TYPE | "Address type incompatible with key. Uncompressed keys can only use legacy addresses." |
| WALLET_ALREADY_EXISTS | "Wallet already exists. Use Settings → Import Account to add private keys." |
| RATE_LIMIT_EXCEEDED | "Too many wallet creation attempts. Please wait X minutes." |
| STORAGE_FAILED | "Failed to save wallet to storage." |

**Error display locations:**
1. Inline field errors (below input)
2. Banner errors (top of form)
3. Modal errors (for critical failures)

---

## Accessibility Checklist

**WCAG AA Compliance:**

- [ ] All form fields have labels (visible or sr-only)
- [ ] All form fields have aria-describedby
- [ ] All errors have aria-invalid="true"
- [ ] All errors have role="alert" aria-live="polite"
- [ ] Tab navigation works (Tab, Shift+Tab)
- [ ] Arrow key navigation for tabs
- [ ] Focus indicators visible (outline)
- [ ] Color contrast ≥ 4.5:1
- [ ] Screen reader announcements for validation
- [ ] Keyboard-only operation possible

---

## Testing Checklist

**Unit Tests:**
- [ ] ImportMethodSelector toggle
- [ ] FileUploadZone file selection/removal
- [ ] WIFTextarea validation feedback
- [ ] AddressTypeSelector card selection
- [ ] PasswordFieldGroup validation
- [ ] PrivacyAcknowledgment checkbox

**Integration Tests:**
- [ ] Full import flow (paste WIF → import)
- [ ] Full import flow (upload file → import)
- [ ] Encrypted WIF decryption flow
- [ ] Error handling for all error types
- [ ] Privacy warning flow

**Accessibility Tests:**
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
- [ ] ARIA label verification
- [ ] Color contrast verification

**Manual Tests (Testnet):**
- [ ] Import plaintext WIF (compressed key)
- [ ] Import plaintext WIF (uncompressed key)
- [ ] Import encrypted WIF
- [ ] Upload file with WIF
- [ ] Select each address type
- [ ] Verify address previews correct
- [ ] Test password validation
- [ ] Test privacy acknowledgment
- [ ] Verify success redirect to unlock

---

## Implementation Timeline

**Total: 6 days (1.5 sprints)**

**Phase 1: Basic Structure** (1 day)
- Add third tab
- Create ImportPrivateKeyTab
- Add state management
- Create ImportMethodSelector

**Phase 2: Input Components** (1 day)
- Create FileUploadZone
- Create WIFTextarea
- Implement file reading
- Implement WIF validation

**Phase 3: Address Selection** (1 day)
- Create AddressTypeSelector
- Create AddressPreviewCard
- Implement address previews
- Handle uncompressed keys

**Phase 4: Password Fields** (0.5 day)
- Create PasswordFieldGroup
- Create PasswordStrengthMeter
- Implement password validation

**Phase 5: Privacy Warnings** (0.5 day)
- Create PrivacyWarningBanner
- Create PrivacyAcknowledgment
- Implement acknowledgment logic

**Phase 6: Integration** (1 day)
- Implement import handler
- Add message passing
- Error handling
- Test full flow

**Phase 7: Testing** (1 day)
- Unit tests
- Integration tests
- Accessibility tests
- Manual testing

---

## Quick Reference: Component Props

**ImportMethodSelector:**
```typescript
value: 'file' | 'paste'
onChange: (method) => void
disabled?: boolean
```

**FileUploadZone:**
```typescript
onFileSelect: (file: File) => void
onFileRemove: () => void
selectedFile: File | null
error: string | null
disabled?: boolean
```

**WIFTextarea:**
```typescript
value: string
onChange: (value: string) => void
onValidate: (wif: string) => Promise<void>
validation: { isValidating, valid, network, compressed, error } | null
disabled?: boolean
```

**AddressTypeSelector:**
```typescript
availableTypes: AddressType[]
selectedType: AddressType | null
onSelect: (type: AddressType) => void
addresses: { legacy, segwit, nativeSegwit }
isUncompressed: boolean
disabled?: boolean
```

**PasswordFieldGroup:**
```typescript
showFilePassword: boolean
filePassword, walletPassword, confirmPassword: string
onFilePasswordChange, onWalletPasswordChange, onConfirmPasswordChange: (pwd) => void
filePasswordVisible, walletPasswordVisible, confirmPasswordVisible: boolean
onFilePasswordVisibilityToggle, etc.: () => void
passwordError: string | null
passwordStrength: 'weak' | 'medium' | 'strong' | null
disabled?: boolean
```

**PrivacyAcknowledgment:**
```typescript
checked: boolean
onChange: (checked: boolean) => void
onCreateSeedWallet: () => void
disabled?: boolean
```

---

## File Structure

```
src/tab/components/WalletSetup/
├── WalletSetup.tsx (modify)
├── ImportMethodSelector.tsx (new)
├── FileUploadZone.tsx (new)
├── WIFTextarea.tsx (new)
├── AddressTypeSelector.tsx (new)
├── AddressPreviewCard.tsx (new)
├── PasswordFieldGroup.tsx (new)
├── PasswordStrengthMeter.tsx (new)
├── PrivacyWarningBanner.tsx (new)
├── PrivacyAcknowledgment.tsx (new)
├── ErrorBanner.tsx (new)
└── __tests__/
    └── ImportPrivateKey.test.tsx (new)
```

---

## Success Criteria

**Feature complete when:**
- ✅ Third tab displays in WalletSetup
- ✅ File upload works (drag-drop + picker)
- ✅ WIF paste works with real-time validation
- ✅ Address type selection works
- ✅ Password fields work with strength meter
- ✅ Privacy warnings display correctly
- ✅ Privacy acknowledgment required before import
- ✅ Import completes successfully
- ✅ Error handling works for all error types
- ✅ All tests pass (>80% coverage)
- ✅ WCAG AA accessibility verified
- ✅ Manual testing complete on testnet

---

## Next Steps

1. **Review this summary** with team
2. **Start Phase 1** (Basic Structure)
3. **Create components** following plan
4. **Test incrementally** after each phase
5. **Update documentation** as you go
6. **Manual testing** on testnet before release

---

**For detailed implementation guides, see:**
- [WALLET_RESTORE_FRONTEND_PLAN.md](./WALLET_RESTORE_FRONTEND_PLAN.md) - Complete implementation guide
- [WALLET_RESTORE_UX_DESIGN_SPEC.md](./WALLET_RESTORE_UX_DESIGN_SPEC.md) - UX/UI specifications
- [WALLET_RESTORE_VISUAL_GUIDE.md](./WALLET_RESTORE_VISUAL_GUIDE.md) - ASCII wireframes
- [WALLET_RESTORE_BACKEND_PLAN.md](./WALLET_RESTORE_BACKEND_PLAN.md) - Backend integration

---

**Document Version**: 1.0
**Status**: ✅ Ready for Implementation
**Estimated Time**: 6 days
**Complexity**: Medium

---

**END OF SUMMARY**
