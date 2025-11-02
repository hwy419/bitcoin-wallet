# HD Wallet Enforcement - Backup Restoration Update Summary

**Version**: 1.1
**Updated**: October 27, 2025
**Status**: Design Complete - Ready for Implementation

---

## Executive Summary

The HD Wallet Enforcement UX design has been updated to include **encrypted backup restoration** as a third wallet creation option. This provides users with three equal-weight methods to initialize their HD wallet:

1. **Create Wallet** - Generate new 12-word seed phrase
2. **Import Wallet** - Restore from existing seed phrase
3. **Restore from Backup** - Import encrypted .dat backup file

All three options result in HD wallet creation, maintaining the core goal of enforcing HD-only wallet initialization.

---

## What Changed

### 1. Wallet Setup Screen Redesign

**BEFORE (2 Tabs):**
- Create Wallet
- Import Wallet

**AFTER (3 Options):**
- Create Wallet
- Import Wallet
- **Restore from Backup** ← NEW

### 2. Card-Based Layout

The initial screen now displays three equal-weight cards in a horizontal row, giving each option equal visual priority.

**Design Pattern:**
```
┌─────────────┐  ┌─────────────┐  ┌───────────────┐
│  📝 CREATE  │  │  📥 IMPORT  │  │  💾 BACKUP    │
│             │  │             │  │               │
│  Generate   │  │  Restore    │  │  Import .dat  │
│  12 words   │  │  from seed  │  │  backup file  │
│             │  │             │  │               │
│  [Start]    │  │  [Start]    │  │  [Start]      │
└─────────────┘  └─────────────┘  └───────────────┘
```

---

## New Feature: Backup Restoration Flow

### 4-Step Process

#### Step 1: File Selection
- **Drag-and-drop** area for .dat files
- **File picker** button as fallback
- **Validation**: Extension (.dat), size (max 10MB)
- **Visual feedback**: File info display with checkmark
- **Error handling**: Invalid extension, file too large, corrupted file

#### Step 2: Password Entry
- **Backup password** input (NOT wallet password)
- **Password toggle** (show/hide)
- **Important note** explaining password distinction
- **Error handling**: Wrong password with attempt counter (3 attempts)
- **Rate limiting**: 30-second lockout after 3 failed attempts

#### Step 3: Progress & Validation
- **3-stage progress** indicator:
  - Decrypting (0-50%)
  - Validating (51-75%)
  - Restoring (76-100%)
- **Animated progress bar** (Bitcoin orange fill)
- **Spinner** with status text
- **Error handling**: Corrupted file, version incompatibility

#### Step 4: Success Confirmation
- **Success icon** (✅ with bounce animation)
- **Restoration summary**:
  - Accounts restored (HD, imported, multisig breakdown)
  - Contacts restored (count)
  - Settings restored (checkmark)
  - Transaction history (checkmark)
  - Backup date and version
- **Info box** reminding to update backup
- **Continue button** (full-width, Bitcoin orange)

---

## Design Specifications Added

### New Components

1. **FileUploadArea.tsx**
   - Drag-and-drop zone with dashed border
   - Hover state (Bitcoin orange border)
   - Drop state (solid border, orange background)
   - File picker button
   - Validation logic (extension, size)
   - Selected file display with "Change File" button

2. **BackupPasswordInput.tsx**
   - Password field with eye toggle
   - Important note info box (blue)
   - Error message display (red)
   - Attempt counter logic

3. **RestorationProgress.tsx**
   - Progress bar (8px height, Bitcoin orange)
   - 3 stages with icons (⏳🔍📦)
   - Animated spinner (rotate)
   - Status text updates

4. **RestorationSummary.tsx**
   - Success icon (64px, bounce animation)
   - Summary card (gray-800 background)
   - Stats breakdown with checkmarks
   - Backup metadata (date, version)
   - Reminder info box (blue)

5. **RestoreFromBackup.tsx** (Parent Component)
   - State management (4 steps)
   - File handling
   - Backend integration (RESTORE_FROM_BACKUP message)
   - Error handling and recovery

---

## Visual Design System

### Color Palette

**File Upload States:**
- Idle: `border-gray-700 (dashed)`
- Hover: `border-bitcoin (dashed)`
- Drop: `border-bitcoin (solid) + bg-bitcoin/10`
- Error: `border-red-500/30 + bg-red-500/5`

**Icons:**
- File: 📦 (gray-500)
- Success: ✅ (green-400)
- Error: ❌ (red-400)
- Warning: ⚠️ (amber-400)
- Info: ℹ️ (blue-400)

**Progress Bar:**
- Filled: #F7931A (bitcoin orange)
- Empty: #242424 (gray-800)
- Height: 8px
- Border radius: 4px

**Info Boxes:**
- Blue: `bg-blue-500/10 + border-blue-500/30 + text-blue-300`
- Red: `bg-red-500/10 + border-red-500/30 + text-red-300`
- Amber: `bg-amber-500/10 + border-amber-500/30 + text-amber-300`

---

## Accessibility

### Keyboard Support
- **Tab**: Navigate to file picker button
- **Enter/Space**: Open file picker
- **Tab**: Navigate through password field, buttons
- **Escape**: Cancel operation (if applicable)

### ARIA Labels
- Drag-and-drop zone: `aria-label="Select backup file for restoration"`
- File input: `accept=".dat"` with screen reader announcement
- Password field: `aria-label="Backup Password"`
- Progress bar: `role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100"`
- Error messages: `role="alert"` for immediate announcement

### Screen Reader Support
- File selection announced: "File selected: bitcoin-wallet-backup-2025-10-27.dat, 842 kilobytes"
- Progress updates announced: "Decrypting backup file, 50% complete"
- Error messages announced immediately
- Success summary stats read sequentially

### Visual Considerations
- Minimum touch target: 44x44px (all buttons)
- Color contrast: WCAG AA compliant (4.5:1 text, 3:1 UI)
- Focus indicators: 2px Bitcoin orange outline
- Error states: Not relying on color alone (icons + text)

---

## Backend Integration

### New Message Type

**Request:**
```typescript
interface RestoreFromBackupRequest {
  type: 'RESTORE_FROM_BACKUP';
  payload: {
    fileData: ArrayBuffer;
    password: string;
  };
}
```

**Response:**
```typescript
interface RestoreFromBackupResponse {
  success: boolean;
  summary?: {
    accountsRestored: number;
    hdAccounts: number;
    importedAccounts: number;
    multisigAccounts: number;
    contactsRestored: number;
    backupDate: string;
    backupVersion: string;
  };
  error?: {
    code: string; // E001-E010
    message: string;
  };
}
```

### Error Codes

| Code | Error | User Action |
|------|-------|-------------|
| E001 | Invalid file extension | Choose .dat file |
| E002 | File too large | Choose smaller backup |
| E003 | File read error | Try different file |
| E004 | Invalid backup format | Verify file source |
| E005 | Wrong password | Re-enter password |
| E006 | Password attempts exceeded | Wait 30 seconds |
| E007 | Decryption failed | Try different file |
| E008 | Version incompatible | Update wallet |
| E009 | Validation failed | Try different file |
| E010 | Restoration failed | Contact support |

---

## Empty States & Guidance

### Help Content

**What are encrypted backups?**
- Restores complete wallet (accounts, contacts, settings)
- Protected with password (600,000 PBKDF2 iterations)
- Can be used across devices

**Where do I find my backup file?**
- Created from: Settings > Backup & Export > Export Encrypted Backup
- Filename format: `bitcoin-wallet-backup-YYYY-MM-DD.dat`
- Check Downloads folder

**Don't have a backup?**
- Create a new wallet
- Import from 12-word seed phrase

---

## Implementation Plan

### Phase 1: Component Creation (6-8 hours)
1. Create `FileUploadArea.tsx` (2 hours)
   - Drag-and-drop handlers
   - File picker integration
   - Validation logic
   - States (idle, hover, drop, selected, error)

2. Create `BackupPasswordInput.tsx` (1.5 hours)
   - Password field with toggle
   - Info box
   - Error display
   - Attempt counter

3. Create `RestorationProgress.tsx` (1.5 hours)
   - Progress bar component
   - Stage indicators
   - Animated spinner
   - Status text

4. Create `RestorationSummary.tsx` (1.5 hours)
   - Success icon with animation
   - Summary card
   - Stats breakdown
   - Info box

5. Create `RestoreFromBackup.tsx` (1.5 hours)
   - 4-step state machine
   - Component composition
   - Error handling

### Phase 2: Backend Integration (4-5 hours)
1. Add `RESTORE_FROM_BACKUP` message handler
2. Implement file decryption (existing BackupManager)
3. Validate backup data
4. Generate restoration summary
5. Error handling and recovery

### Phase 3: Testing (4-5 hours)
1. Unit tests for new components
2. Integration tests for restoration flow
3. Error scenario testing
4. Accessibility testing
5. Visual regression testing

### Phase 4: Documentation (2 hours)
1. Update component documentation
2. Add backend API docs
3. Update user guide
4. Add troubleshooting section

**Total Estimated Effort: 16-20 hours (2-3 days)**

---

## Testing Checklist

### File Selection
- [ ] Drag-and-drop works
- [ ] File picker button opens system dialog
- [ ] .dat files accepted
- [ ] Non-.dat files rejected with error
- [ ] Files > 10MB rejected with error
- [ ] Corrupted files detected early
- [ ] Selected file displays correctly
- [ ] Change file button works
- [ ] Continue button enables when file selected

### Password Entry
- [ ] Password field accepts input
- [ ] Eye toggle shows/hides password
- [ ] Important note box displays
- [ ] Back button returns to file selection
- [ ] Restore button disabled until password entered
- [ ] Wrong password shows error
- [ ] Attempt counter decrements correctly
- [ ] 3 failed attempts triggers 30s lockout
- [ ] Countdown displays during lockout

### Progress & Validation
- [ ] Progress bar animates smoothly
- [ ] Stage 1 (Decrypt) displays correctly
- [ ] Stage 2 (Validate) displays correctly
- [ ] Stage 3 (Restore) displays correctly
- [ ] Spinner animates continuously
- [ ] Corrupted file error displays
- [ ] Version incompatible error displays
- [ ] Try Different File button works
- [ ] Cancel button works

### Success Confirmation
- [ ] Success icon displays with bounce
- [ ] Restoration summary accurate
- [ ] Account breakdown correct
- [ ] Contact count correct
- [ ] Settings restored checkmark
- [ ] Transaction history checkmark
- [ ] Backup date displays correctly
- [ ] Backup version displays correctly
- [ ] Update backup reminder displays
- [ ] Continue button navigates to dashboard

### Accessibility
- [ ] Keyboard navigation works
- [ ] Tab order logical
- [ ] ARIA labels correct
- [ ] Screen reader announces file selection
- [ ] Screen reader announces progress
- [ ] Error messages announced
- [ ] Focus management correct
- [ ] Color contrast meets WCAG AA

### Edge Cases
- [ ] Empty .dat file handled
- [ ] Very large (but < 10MB) files work
- [ ] Special characters in filename handled
- [ ] Network interruption handled (if applicable)
- [ ] Browser close during restoration (data safety)

---

## Updated Documents

1. **HD_WALLET_ENFORCEMENT_UX_SPEC.md**
   - Section 3.4 added: "Backup Restoration Flow"
   - 4-step process documented with wireframes
   - Error codes table added
   - Component integration specs
   - Backend message type defined

2. **HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md**
   - Section 13 added: "Backup Restoration Visual Flow"
   - All screens wireframed (file selection, password, progress, success)
   - Error states visualized
   - Color chart for backup restoration
   - Component breakdown
   - Animation timing reference
   - 3-card layout comparison (horizontal vs 2+1)

3. **HD_WALLET_ENFORCEMENT_BACKUP_UPDATE_SUMMARY.md** (this document)
   - Executive summary of changes
   - Implementation plan
   - Testing checklist
   - Design decisions

---

## Design Decisions & Rationale

### Why Card-Based Layout?

**Decision**: Use 3 equal-weight cards instead of tabs

**Rationale**:
- Equal visual hierarchy (no option appears "less important")
- Clearer intent (each card is self-contained)
- Better mobile responsiveness
- Reduces cognitive load (see all options at once)
- Industry standard (MetaMask, Ledger, Trust Wallet use similar patterns)

### Why 4-Step Flow?

**Decision**: Break restoration into 4 distinct steps

**Rationale**:
- **Step 1 (File Selection)**: Validate early, prevent wasted time
- **Step 2 (Password)**: Security checkpoint, attempt limiting
- **Step 3 (Progress)**: User feedback, manage expectations
- **Step 4 (Success)**: Confirmation, education (backup reminder)

**Alternative Considered**: 2-step flow (file + password in one screen)
- **Rejected**: Too much visual clutter, harder to handle errors gracefully

### Why Drag-and-Drop?

**Decision**: Primary interaction is drag-and-drop

**Rationale**:
- Modern UX expectation
- Faster than file picker for many users
- Clear visual affordance (dashed border, "drop here" text)
- Accessibility maintained (file picker button as fallback)

### Why Password Attempts Limiting?

**Decision**: 3 attempts, then 30-second lockout

**Rationale**:
- **Security**: Prevents brute force attacks
- **Balance**: 3 attempts allows for typos, 30s not too punitive
- **Standard**: Common pattern in wallet applications
- **Alternative Considered**: Unlimited attempts with rate limiting
  - **Rejected**: Less secure, harder to implement correctly

### Why Show Restoration Summary?

**Decision**: Display detailed breakdown before entering wallet

**Rationale**:
- **Verification**: User can confirm correct backup restored
- **Transparency**: Clear what was imported
- **Education**: Reinforces backup best practices
- **Trust**: Shows system working correctly

---

## Success Metrics

**Post-Implementation KPIs:**

1. **Backup Restoration Success Rate**: Target > 95%
   - Metric: Successful restorations / total attempts
   - Includes: Successful file selection, password entry, data restoration

2. **User Errors (File Selection)**: Target < 5%
   - Wrong file type selected
   - File too large
   - Corrupted file

3. **Password Errors (First Attempt)**: Target < 30%
   - Users entering wrong password on first try
   - Indicates need for better password hint/reminder

4. **Time to Complete**: Target < 2 minutes
   - From file selection to wallet dashboard
   - Excludes user decision time

5. **Support Tickets**: Target < 2% of restorations
   - Users needing help with restoration process
   - Indicates clarity of UX and error messages

---

## Future Enhancements (Not in Scope)

1. **Cloud Sync Integration**
   - Auto-detect backup files from cloud storage
   - Google Drive, Dropbox, iCloud integration

2. **QR Code Backup**
   - Export backup as QR code (for small wallets)
   - Scan QR to restore

3. **Multi-Device Sync**
   - Continuous sync between devices
   - Real-time backup updates

4. **Backup Scheduling**
   - Auto-backup on interval (daily, weekly)
   - Reminder to create backup after X transactions

5. **Partial Restoration**
   - Choose specific accounts to restore
   - Merge with existing wallet

---

## Risks & Mitigations

### Risk 1: File Upload Security
**Risk**: Malicious files could exploit vulnerabilities
**Mitigation**:
- Validate file extension AND magic bytes
- Limit file size (10MB)
- Decrypt in isolated context
- Validate all JSON structures after decryption

### Risk 2: Password Reset Not Possible
**Risk**: User forgets backup password, cannot restore
**Mitigation**:
- Clear warning in password entry screen
- Suggest password manager
- No recovery mechanism (by design for security)

### Risk 3: Version Incompatibility
**Risk**: Old backups not compatible with new wallet versions
**Mitigation**:
- Version field in backup file
- Migration logic for old versions
- Clear error message with update instructions

### Risk 4: Large Wallets (> 100 Accounts)
**Risk**: Restoration takes too long, user closes window
**Mitigation**:
- Optimize restoration algorithm
- Progress feedback (per-account if needed)
- Warning if restoration takes > 30s

---

## Next Steps

1. **Review** this summary with Product Manager
2. **Validate** design decisions with Security Expert
3. **Estimate** backend work with Backend Developer
4. **Schedule** implementation sprint
5. **Create** Jira tickets with links to updated specs
6. **Begin** Phase 1 (component creation)

---

## Questions for Reviewers

**Product Manager:**
- Does 3-option layout align with user research?
- Is 30-second lockout appropriate?
- Should we add telemetry for restoration success rate?

**Security Expert:**
- Are error messages revealing too much information?
- Is password attempt limiting sufficient?
- Should we add CSRF protection for file upload?

**Frontend Developer:**
- Is 4-step flow over-engineered? Could it be 3 steps?
- Are new components reusable for other features?
- Should we use existing FileUploadArea component or create new?

**Backend Developer:**
- Is ArrayBuffer the right format for file data?
- Should decryption be streamed for large files?
- How do we handle version migration in BackupManager?

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-27 | UI/UX Designer | Initial HD Wallet Enforcement design |
| 1.1 | 2025-10-27 | UI/UX Designer | Added backup restoration as 3rd option |

---

**End of Summary**

For complete specifications:
- **UX Spec**: [HD_WALLET_ENFORCEMENT_UX_SPEC.md](./HD_WALLET_ENFORCEMENT_UX_SPEC.md)
- **Visual Guide**: [HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md](./HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md)
