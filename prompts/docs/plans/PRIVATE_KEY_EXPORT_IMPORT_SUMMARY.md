# Private Key Export/Import - Implementation Summary

**Version**: 1.0
**Date**: 2025-10-19
**Status**: Ready for Implementation

---

## Overview

Complete frontend implementation plan for **per-account private key export and import**. Enables users to backup individual accounts in WIF format with optional password protection.

## Quick Reference

| Document | Purpose | Audience |
|----------|---------|----------|
| **PRD** | Product requirements, user stories, acceptance criteria | Product team |
| **Security Spec** | Threat model, encryption specs, security requirements | Security team |
| **UX Spec** | Complete UI/UX design with 10 component specifications | Design/Frontend |
| **Visual Guide** | ASCII wireframes, color charts, visual examples | Frontend/QA |
| **Frontend Plan** | Implementation-ready technical specifications | **Frontend team** |

---

## What's in the Frontend Plan

### 1. Component Architecture
- **10 new components** organized in feature-based folders
- **Component hierarchy** with clear presentational vs container separation
- **File organization** with ~2,000 lines of new code estimated

**Key Components:**
- 5 shared utilities (PasswordStrengthMeter, FileUploadArea, etc.)
- 4 export modals (warning → dialog → success flow)
- 1 import form (handles both setup and existing wallet)

### 2. State Management
- **Local component state** for all forms/modals (no new global state)
- **React Context integration** with existing WalletContext
- **Real-time validation** for passwords, WIF format, file uploads

**No Redux/Zustand needed** - feature is self-contained.

### 3. Message Passing to Backend
- **3 new message types**: EXPORT_PRIVATE_KEY, IMPORT_PRIVATE_KEY, VALIDATE_WIF
- **Complete TypeScript interfaces** for request/response
- **Error handling** with standardized error codes
- **Example implementations** for all message handlers

### 4. TypeScript Interfaces
- **Core types** for export metadata, validation, file content
- **Component props** for all 10 components
- **Form state types** for export and import flows
- **100% type-safe** implementation

### 5. PDF Generation
- **Library**: jsPDF + qrcode
- **Complete implementation** with ~200 lines of code
- **QR code generation** for paper wallet backups
- **Professional layout** matching design specs

### 6. File Upload/Download
- **Drag-and-drop** file upload with visual feedback
- **File validation** (type, size, content)
- **Download utilities** for text files and PDFs
- **Filename generation** with timestamps

### 7. Form Validation
- **Password strength** calculation (0-100 score)
- **WIF format validation** (client-side + backend)
- **Real-time feedback** with suggestions
- **Requirement checklists** with visual indicators

### 8. Integration Points
- **Settings screen**: Export button for each account
- **Wallet setup**: New "Import Private Key" tab
- **Sidebar/dropdown**: "Import Account" option
- **Toast notifications**: Success/error feedback

### 9. Dependencies
```bash
npm install jspdf qrcode
npm install --save-dev @types/qrcode
```

**Bundle impact**: ~180 KB (gzipped), medium impact

### 10. Testing Strategy
- **Unit tests** for all utilities and components (80%+ coverage)
- **Integration tests** for critical flows
- **Manual testing checklist** with 30+ test cases
- **Edge case coverage** (file corruption, network errors, etc.)

### 11. Implementation Timeline
**Total: 3 weeks / 120 hours**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| 1. Shared Components | 2 days | 5 utility components with tests |
| 2. Export Flow | 3 days | 4 modals, file export working |
| 3. PDF Generation | 2 days | PDF export with QR codes |
| 4. Import Flow | 3 days | Import form, file parsing |
| 5. Integration | 3 days | All integration points complete |
| 6. Testing & Polish | 2 days | Bug-free, documented, reviewed |

### 12. Code Examples
- **Complete ExportDialog** component (~350 lines)
- **Complete ImportPrivateKeyForm** component (~400 lines)
- **PDF generator function** with full implementation
- **All utility functions** with TypeScript types

---

## Key Features

### Export Features
✅ **File download** (.txt) with plaintext or encrypted WIF
✅ **PDF generation** with QR codes for paper wallet backup
✅ **Password protection** with AES-256-GCM encryption
✅ **Multiple security warnings** educating users about risks
✅ **Extra scary warning** for plaintext exports
✅ **Success confirmation** with post-export security reminders

### Import Features
✅ **File upload** with drag-and-drop support
✅ **Manual WIF entry** with real-time validation
✅ **Encrypted file detection** with password prompt
✅ **Preview before import** showing network, address, type
✅ **Network validation** (rejects mainnet keys)
✅ **Duplicate detection** prevents importing same key twice
✅ **Two integration points**: wallet setup + existing wallet

---

## Architecture Highlights

### Component Organization
```
src/tab/components/
├── shared/
│   ├── PasswordStrengthMeter.tsx       NEW
│   ├── PasswordRequirementsChecklist.tsx NEW
│   ├── FileUploadArea.tsx              NEW
│   ├── WarningBox.tsx                  NEW
│   └── ErrorMessage.tsx                NEW
├── PrivateKeyExport/
│   ├── ExportWarningModal.tsx          NEW
│   ├── ExportDialog.tsx                NEW
│   ├── PlaintextWarningModal.tsx       NEW
│   └── ExportSuccessModal.tsx          NEW
└── PrivateKeyImport/
    ├── ImportPrivateKeyForm.tsx        NEW
    └── ImportSecurityNotice.tsx        NEW
```

### State Flow
```
Export: Settings → Warning Modal → Export Dialog → [Plaintext Warning] → Success
Import: Upload/Paste → Validate → Preview → Import → Success Toast
```

### Security Layers
1. **Warning modal** - Initial education
2. **Password strength meter** - Encourage strong passwords
3. **Plaintext warning** - Extra scary for unencrypted
4. **Success modal** - Post-export reminders
5. **Import validation** - Prevent wrong network, duplicates

---

## Developer Workflow

### Getting Started
1. **Read this summary** to understand scope
2. **Review Frontend Plan** for technical details
3. **Check Visual Guide** for UI references
4. **Install dependencies**: `npm install jspdf qrcode`
5. **Start with Phase 1**: Shared components

### Development Order
1. Build shared utilities first (no dependencies)
2. Build export modals (use shared utilities)
3. Add PDF generation (parallel to modals)
4. Build import form (reuse shared utilities)
5. Integrate into Settings/WalletSetup
6. Test end-to-end flows
7. Security review and polish

### Code Style
- Follow existing patterns (Modal, Toast, SecurityWarning)
- Use TypeScript strictly (no `any`)
- Write unit tests for all utilities
- Document complex logic
- Add Storybook stories for components

---

## Testing Checklist

### Export Flow
- [ ] Export button shows for HD/imported accounts
- [ ] Export button hidden for multisig accounts
- [ ] Warning modal prevents proceeding without checkbox
- [ ] Password strength updates in real-time
- [ ] Requirements checklist updates correctly
- [ ] Plaintext warning shows when unchecking password
- [ ] File downloads with correct name/format
- [ ] PDF generates with QR code
- [ ] Success modal shows correct encryption status

### Import Flow
- [ ] File upload drag-and-drop works
- [ ] Manual WIF entry validates in real-time
- [ ] Encrypted file detection works
- [ ] Password field appears for encrypted files
- [ ] Preview shows correct information
- [ ] Network validation rejects mainnet keys
- [ ] Duplicate detection prevents re-import
- [ ] Account successfully imported
- [ ] Account appears in list with import badge

### Edge Cases
- [ ] Very long account names (truncation)
- [ ] Special characters in names (sanitization)
- [ ] Browser download blocking (error message)
- [ ] Corrupted files (graceful error)
- [ ] Wrong password (clear error message)
- [ ] Invalid WIF format (helpful error)

---

## Security Considerations

### User Education
- **Progressive disclosure** - Information revealed step-by-step
- **Bold key terms** - STEAL, NEVER, IMMEDIATELY emphasized
- **Color-coded warnings** - Red (critical), Amber (high), Blue (info)
- **Post-export reminders** - Reinforce secure storage practices

### Technical Safeguards
- **Password strength enforcement** - Minimum 8 characters
- **Network validation** - Reject mainnet keys (testnet wallet)
- **Duplicate detection** - Prevent importing same key twice
- **No key display** - Keys never shown in UI after entry
- **Client-side only** - No keys sent to external servers

### Attack Mitigation
- **Social engineering** - Multiple warnings educate users
- **Accidental export** - Confirmation required at each step
- **Weak passwords** - Strength meter encourages complexity
- **Wrong network** - Validation prevents mainnet imports
- **Malicious files** - File validation and error handling

---

## Success Metrics

### Completion Criteria
✅ All 10 components implemented with tests
✅ Export flow working (file + PDF)
✅ Import flow working (setup + existing wallet)
✅ >80% test coverage on new code
✅ All manual test cases passing
✅ Security expert review approved
✅ No console errors or warnings

### Quality Standards
- **Type safety**: 100% TypeScript, no `any`
- **Test coverage**: 80%+ on utilities and components
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: No lag during password validation
- **Error handling**: Every error has clear recovery path

---

## Resources

### Design References
- **UX Spec**: Complete component specifications
- **Visual Guide**: ASCII wireframes and color charts
- **Existing Components**: Modal, Toast, SecurityWarning

### Code References
- **ExportDialog**: Complete implementation (~350 lines)
- **ImportPrivateKeyForm**: Complete implementation (~400 lines)
- **PDF Generator**: Full jsPDF + qrcode implementation
- **Validation Utilities**: Password strength, WIF format

### External Libraries
- **jsPDF**: https://github.com/parallax/jsPDF
- **qrcode**: https://github.com/soldair/node-qrcode
- **TypeScript Types**: @types/qrcode

---

## Next Steps

### Immediate Actions
1. ✅ Review this summary
2. ✅ Read Frontend Plan document
3. ✅ Get security team approval
4. ✅ Install dependencies
5. → **Start Phase 1**: Build shared components

### Phase 1 (Week 1, Days 1-2)
**Goal**: Build 5 shared utility components

**Components to build:**
1. PasswordStrengthMeter
2. PasswordRequirementsChecklist
3. FileUploadArea
4. WarningBox
5. ErrorMessage

**Deliverables:**
- 5 components with TypeScript props
- Unit tests for each component
- Storybook stories (optional)

**Next phase**: Export flow modals

---

## Questions?

**Architecture questions**: See "Component Architecture" section in Frontend Plan
**State management**: See "State Management" section in Frontend Plan
**Message passing**: See "Message Passing to Backend" section in Frontend Plan
**Validation logic**: See "Form Validation" section in Frontend Plan
**PDF generation**: See "PDF Generation Implementation" section in Frontend Plan
**Testing strategy**: See "Testing Approach" section in Frontend Plan

**Still unclear?** Ask the product manager or review the UX Spec for design details.

---

**Document Status**: ✅ Complete - Ready for Development
**Last Updated**: 2025-10-19
**Maintained By**: Frontend Development Team
