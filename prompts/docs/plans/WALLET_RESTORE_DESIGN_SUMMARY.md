# Wallet Restore from Private Key - Design Summary

**Version**: 1.0
**Date**: 2025-10-22
**Status**: ✅ Design Complete - Ready for Implementation

---

## Quick Reference

**What This Feature Does:**
Enables users to restore their wallet from a private key backup during initial setup. Currently, users who exported their private keys cannot restore wallet access - this feature fills that critical recovery gap.

**Design Documents:**
1. **Full Specification**: [WALLET_RESTORE_UX_DESIGN_SPEC.md](./WALLET_RESTORE_UX_DESIGN_SPEC.md) - 30,000+ words, complete component specs
2. **Visual Guide**: [WALLET_RESTORE_VISUAL_GUIDE.md](./WALLET_RESTORE_VISUAL_GUIDE.md) - ASCII wireframes, color charts
3. **PRD**: [WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md](./WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md) - Product requirements
4. **Technical Review**: [WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md](./WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md) - Blockchain expert validation
5. **Security Handoff**: [WALLET_RESTORE_SECURITY_HANDOFF.md](./WALLET_RESTORE_SECURITY_HANDOFF.md) - Security questions

---

## User Flow (11 Steps)

```
1. User opens extension (no wallet)
2. Sees 3 tabs: [Create New] [Import Seed] [Import Private Key] ← NEW
3. Clicks "Import Private Key"
4. Selects input method: Upload File OR Paste WIF
5. Provides WIF (auto-detects encrypted vs plaintext)
6. If encrypted: Enters file password to decrypt
7. Selects address type (sees 3 previews, picks the one they used)
8. Sets new wallet password
9. Confirms wallet password
10. Acknowledges privacy warning (checkbox required)
11. Clicks "Import Wallet" → Success screen → Unlock → Dashboard
```

---

## Key Design Decisions

### 1. Third Tab (Not Sub-Option)
**Decision**: Add "Import Private Key" as a third tab, equal to "Create New" and "Import Seed"
**Why**: Recovery is a primary use case. Hiding it as a sub-option adds friction and reduces discoverability.

### 2. Upload File OR Paste WIF (Segmented Control)
**Decision**: iOS-style toggle between two input methods
**Why**: Simple binary choice, no nested navigation needed

### 3. Address Type Selection (3 Radio Cards with Previews)
**Decision**: Show ALL 3 address types with actual address previews, user picks one
**Critical Constraint**: A single private key generates 3 different addresses. We CANNOT auto-detect which type the user originally used.
**Why**: User must SEE the addresses to recognize the correct one. Visual comparison prevents "import success but 0 balance" errors.

### 4. Progressive Disclosure
**Decision**: Show complexity only when needed
- File password field: Only if encrypted WIF detected
- Address type selection: All 3 options for compressed keys, auto-select Legacy for uncompressed
- Account name: Pre-filled with "Imported Account" (editable)

### 5. Three-Tier Privacy Warnings
**Decision**: Warn users about non-HD wallet privacy implications at three touchpoints
1. **Info banner** (during import): Dismissible, educational
2. **Mandatory acknowledgment** (before import): Checkbox required, explains risks
3. **Dashboard banner** (after import): Persistent reminder to migrate

---

## Components to Build

### Core Components (Phase 1 - MVP)

1. **PrivateKeyImportTab**
   - Main container with state management
   - File: `src/tab/components/WalletSetup.tsx` (add third tab)

2. **SegmentedControl**
   - iOS-style toggle: Upload File / Paste WIF
   - Reusable component for binary choices

3. **FileUpload**
   - Drag-drop zone with file picker
   - States: Empty → Drag over → Selected → Error
   - Max 100KB, .txt files only

4. **WIFTextarea**
   - Paste input with real-time validation
   - Debounced 300ms, shows network/compression/encryption status

5. **AddressTypeRadioCard** (×3)
   - Visual cards showing address previews
   - States: Unselected, Selected (orange border), Disabled
   - Recommended badge on Native SegWit

6. **FilePasswordField**
   - Conditional: Only shown if encrypted WIF
   - Show/hide toggle

7. **WalletPasswordField**
   - New wallet password input
   - Show/hide toggle

8. **PasswordStrengthMeter**
   - Visual indicator: Red (weak) → Yellow (medium) → Green (strong)
   - Requirements checklist

9. **PrivacyAcknowledgment**
   - Yellow warning banner
   - Checkbox: Required to enable import button

10. **ErrorBanner**
    - Field-level and page-level error display
    - Auto-dismiss after 10s (if not critical)

11. **SuccessScreen**
    - Animated checkmark
    - Account summary card
    - "Unlock Wallet" CTA

### Enhanced Components (Phase 2 - Post-MVP)

- Help accordion (address type guide)
- Account name field
- Dashboard banner for non-HD wallets
- Copy address button
- Loading animations

---

## Color Palette

**Primary Colors:**
- Bitcoin Orange: `#F7931A` (buttons, accents)
- Bitcoin Hover: `#E88517`
- Bitcoin Active: `#D97714`

**State Colors:**
- Success: `#10B981` (green) - Valid states
- Error: `#EF4444` (red) - Invalid states
- Warning: `#F59E0B` (yellow) - Privacy warnings
- Info: `#3B82F6` (blue) - File password section

**Backgrounds:**
- Main: `#111827` (gray-900)
- Cards: `#1A1F2E` (gray-850)
- Inputs: `#111827` (gray-900)

---

## Error Messages

| Error Code | User Message | Recovery Action |
|-----------|--------------|----------------|
| INVALID_WIF_FORMAT | "Invalid WIF format. Please check your private key." | "Verify you copied the entire WIF string" |
| NETWORK_MISMATCH | "Wrong network: This is a mainnet key, testnet required." | "Use a testnet private key (starts with 9 or c)" |
| WRONG_FILE_PASSWORD | "Incorrect file password. Unable to decrypt." | "Check your password and try again" |
| FILE_CORRUPTED | "File is corrupted or invalid format." | "Use the original exported file" |
| INCOMPATIBLE_ADDRESS_TYPE | "Uncompressed keys can only use legacy addresses." | "Select Legacy address type" |
| PASSWORDS_MISMATCH | "Passwords do not match." | "Re-enter your password confirmation" |

---

## Privacy Warnings Text

### Warning 1: Info Banner (During Import)
```
ℹ️ Privacy Notice

Wallets imported from private keys use a single address for all
transactions, which may reduce privacy compared to HD wallets with
seed phrases.

[Learn More] [Dismiss]
```

### Warning 2: Mandatory Acknowledgment (Before Import)
```
⚠️ Privacy Warning

This wallet will reuse the same address for all transactions. This means:

• All transactions are publicly linked
• Your balance is visible to anyone
• Privacy is significantly reduced

For better privacy, consider creating a wallet with a seed phrase instead.

[ ] I understand the privacy implications

[Create Seed Phrase Wallet] [Continue Anyway]
```

### Warning 3: Dashboard Banner (After Import)
```
ℹ️ This wallet uses a single address

For better privacy, you may want to migrate to a seed phrase wallet.

[Migrate Now] [Learn More] [Dismiss]
```

---

## Accessibility Requirements

**ARIA Labels:**
- Tabs: `role="tablist"`, `role="tab"`, `aria-selected`
- Radio cards: `role="radiogroup"`, `role="radio"`, `aria-checked`
- Form fields: `aria-describedby`, `aria-invalid`, `aria-required`
- Errors: `role="alert"`, `aria-live="assertive"`

**Keyboard Navigation:**
- Tab/Shift+Tab: Move focus
- Arrow Left/Right: Navigate tabs
- Arrow Up/Down: Navigate radio options
- Enter/Space: Activate button or checkbox
- Esc: Close modal

**Color Contrast (WCAG AA):**
- All text meets 4.5:1 minimum ratio
- Exception: Bitcoin orange on dark (4.2:1) - use `#FFA726` for text

---

## Implementation Checklist

### Phase 1: Core Import Flow (MVP)
- [ ] Add third tab to WalletSetup component
- [ ] Create SegmentedControl component
- [ ] Create FileUpload component
- [ ] Create WIFTextarea component
- [ ] Create AddressTypeRadioCard component (×3)
- [ ] Create FilePasswordField component
- [ ] Create WalletPasswordField component
- [ ] Create PasswordStrengthMeter component
- [ ] Create PrivacyAcknowledgment component
- [ ] Create ErrorBanner component
- [ ] Create SuccessScreen component
- [ ] Implement WIF validation (real-time)
- [ ] Implement auto-detect encryption
- [ ] Implement file password decryption
- [ ] Implement address type selection logic
- [ ] Implement network validation
- [ ] Implement comprehensive error handling
- [ ] Add backend message handler: `CREATE_WALLET_FROM_PRIVATE_KEY`

### Phase 2: Enhanced UX
- [ ] Add password strength meter
- [ ] Add all 3 privacy warning banners
- [ ] Add help accordion (address type guide)
- [ ] Add account name field
- [ ] Add dashboard banner for non-HD wallets
- [ ] Add drag-drop file upload
- [ ] Add show/hide password toggles
- [ ] Add copy address button
- [ ] Add loading animations
- [ ] Add success checkmark animation

### Phase 3: Polish
- [ ] Add step indicator (progress bar)
- [ ] Add QR code display for address
- [ ] Add balance preview before import
- [ ] Add migration wizard UI
- [ ] Accessibility testing
- [ ] Cross-browser testing
- [ ] Performance optimization

---

## Testing Requirements

### Unit Tests
- WIF validation logic
- File encryption/decryption
- Network detection
- Address type determination
- Password validation
- Form state management

### Integration Tests
- Full import flow (plaintext WIF)
- Full import flow (encrypted WIF)
- Error handling scenarios
- Network mismatch detection
- Address type selection correctness

### Manual QA
- Export private key → Clear extension → Import during setup → Verify balance matches
- Import encrypted WIF with correct password → Success
- Import encrypted WIF with wrong password → Error
- Paste raw WIF string → Import → Verify address matches
- Try importing mainnet WIF on testnet wallet → Error
- Import uncompressed WIF → Verify legacy address forced
- Import WIF with 0 balance → Warning shown but import succeeds

---

## Design Validation

- ✅ Blockchain Expert: Approved architecture, address type selection approach
- ⏳ Security Expert: Pending review of privacy warnings
- ✅ Product Manager: Approved requirements and user flows
- ⏳ Frontend Developer: Pending implementation review
- ⏳ QA Engineer: Pending testing

---

## Next Steps

1. **Frontend Developer**: Implement Phase 1 components
2. **Backend Developer**: Add `CREATE_WALLET_FROM_PRIVATE_KEY` message handler
3. **Security Expert**: Review and approve privacy warnings
4. **QA Engineer**: Create test plan and test cases
5. **UI/UX Designer**: Support implementation and review designs

---

## Questions?

**For detailed specifications**, see:
- [WALLET_RESTORE_UX_DESIGN_SPEC.md](./WALLET_RESTORE_UX_DESIGN_SPEC.md) - Complete 30,000+ word spec
- [WALLET_RESTORE_VISUAL_GUIDE.md](./WALLET_RESTORE_VISUAL_GUIDE.md) - ASCII wireframes

**For product requirements**, see:
- [WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md](./WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md)

**For technical details**, see:
- [WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md](./WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md)

**For security questions**, see:
- [WALLET_RESTORE_SECURITY_HANDOFF.md](./WALLET_RESTORE_SECURITY_HANDOFF.md)

---

**Document Version**: 1.0
**Status**: ✅ Ready for Implementation
**Estimated Time**: 2-3 sprints
**Date**: 2025-10-22

---

**END OF SUMMARY**
