# Wallet Backup/Restore Frontend Integration Guide

This guide shows how to integrate the wallet backup and restore UI into the existing application.

## Summary

All frontend components are complete (~2,600 lines):
- ✅ 3 Shared components (PasswordStrengthMeter, PasswordRequirementsChecklist, FileUploadArea)
- ✅ 5 Export flow modals
- ✅ 7 Import flow modals

## Integration Steps

### 1. Add Export Flow to SettingsScreen

File: `src/tab/components/SettingsScreen.tsx`

**Add imports:**
```typescript
import {
  ExportWarningModal,
  WalletPasswordConfirmModal,
  BackupPasswordCreateModal,
  ExportProgressModal,
  ExportSuccessModal,
} from './WalletBackup/Export';
```

**Add state:**
```typescript
// Export flow state
type ExportStep = 'warning' | 'wallet-password' | 'backup-password' | 'progress' | 'success';
const [exportStep, setExportStep] = useState<ExportStep | null>(null);
const [exportProgress, setExportProgress] = useState(0);
const [exportProgressText, setExportProgressText] = useState('');
const [backupDetails, setBackupDetails] = useState<any>(null);
```

**Add button in Security section (after "Lock Wallet" button):**
```tsx
{/* Export Encrypted Backup button */}
<button
  onClick={() => setExportStep('warning')}
  className="w-full bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
>
  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
  </svg>
  Export Encrypted Backup
</button>
```

**Add modal components at the end:**
```tsx
{/* Export Flow Modals */}
{exportStep === 'warning' && (
  <ExportWarningModal
    isOpen={true}
    onClose={() => setExportStep(null)}
    onContinue={() => setExportStep('wallet-password')}
  />
)}

{exportStep === 'wallet-password' && (
  <WalletPasswordConfirmModal
    isOpen={true}
    onClose={() => setExportStep(null)}
    onConfirm={async (password) => {
      // Verify password with backend
      await sendMessage(MessageType.UNLOCK_WALLET, { password });
      setExportStep('backup-password');
    }}
  />
)}

{exportStep === 'backup-password' && (
  <BackupPasswordCreateModal
    isOpen={true}
    onClose={() => setExportStep(null)}
    onBack={() => setExportStep('wallet-password')}
    onCreate={async (backupPassword) => {
      setExportStep('progress');
      // Call backend to export
      const result = await sendMessage(MessageType.EXPORT_WALLET_BACKUP, {
        backupPassword,
        onProgress: (percent, step) => {
          setExportProgress(percent);
          setExportProgressText(step);
        }
      });
      setBackupDetails(result);
      setExportStep('success');
    }}
  />
)}

{exportStep === 'progress' && (
  <ExportProgressModal
    isOpen={true}
    progress={exportProgress}
    currentStep={exportProgressText}
  />
)}

{exportStep === 'success' && backupDetails && (
  <ExportSuccessModal
    isOpen={true}
    onClose={() => {
      setExportStep(null);
      setBackupDetails(null);
    }}
    backupDetails={backupDetails}
  />
)}
```

### 2. Add Import Flow to WalletSetup (Fresh Install)

File: `src/tab/components/WalletSetup.tsx`

**Update SetupTab type:**
```typescript
type SetupTab = 'create' | 'import' | 'import-key' | 'import-backup';  // Add 'import-backup'
```

**Add imports:**
```typescript
import {
  FileSelectionModal,
  BackupPasswordEntryModal,
  ImportProgressModal,
  SetWalletPasswordModal,
  ImportSuccessModal,
} from './WalletBackup/Import';
```

**Add state:**
```typescript
// Import backup flow state
type ImportStep = 'file-select' | 'backup-password' | 'progress' | 'wallet-password' | 'success';
const [importStep, setImportStep] = useState<ImportStep | null>(null);
const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
const [importProgress, setImportProgress] = useState(0);
const [importProgressText, setImportProgressText] = useState('');
const [restoreDetails, setRestoreDetails] = useState<any>(null);
```

**Add fourth tab button:**
```tsx
<button
  onClick={() => {
    setActiveTab('import-backup');
    setError(null);
  }}
  className={`flex-1 py-3 text-sm font-semibold transition-colors ${
    activeTab === 'import-backup'
      ? 'text-bitcoin border-b-2 border-bitcoin'
      : 'text-gray-400 hover:text-gray-300'
  }`}
>
  Import Backup
</button>
```

**Add tab content:**
```tsx
{/* Import from Backup tab */}
{activeTab === 'import-backup' && (
  <div>
    <p className="text-sm text-gray-400 mb-6">
      Restore your wallet from an encrypted backup file (.dat) created on another device.
    </p>

    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-300 mb-3">This will restore:</h3>
      <ul className="text-sm text-gray-400 space-y-2 ml-4">
        <li>• All accounts (single-sig and multisig)</li>
        <li>• All contacts</li>
        <li>• All settings</li>
      </ul>
    </div>

    <button
      onClick={() => setImportStep('file-select')}
      className="w-full bg-bitcoin text-white py-3 rounded-lg font-semibold hover:bg-bitcoin-hover active:bg-bitcoin-active transition-all duration-200"
    >
      Select Backup File
    </button>
  </div>
)}
```

**Add modal components:**
```tsx
{/* Import Backup Flow Modals */}
{importStep === 'file-select' && (
  <FileSelectionModal
    isOpen={true}
    onClose={() => setImportStep(null)}
    onContinue={(file) => {
      setSelectedBackupFile(file);
      setImportStep('backup-password');
    }}
  />
)}

{importStep === 'backup-password' && (
  <BackupPasswordEntryModal
    isOpen={true}
    onClose={() => setImportStep(null)}
    onBack={() => setImportStep('file-select')}
    onDecrypt={async (backupPassword) => {
      setImportStep('progress');
      // Call backend to import
      const result = await sendMessage(MessageType.IMPORT_WALLET_BACKUP, {
        backupFile: selectedBackupFile,
        backupPassword,
        onProgress: (percent, step) => {
          setImportProgress(percent);
          setImportProgressText(step);
        }
      });
      setRestoreDetails(result);
      setImportStep('wallet-password');
    }}
  />
)}

{importStep === 'progress' && (
  <ImportProgressModal
    isOpen={true}
    progress={importProgress}
    currentStep={importProgressText}
  />
)}

{importStep === 'wallet-password' && (
  <SetWalletPasswordModal
    isOpen={true}
    onClose={() => setImportStep(null)}
    onCreate={async (password) => {
      // Finalize wallet with password
      await sendMessage(MessageType.FINALIZE_WALLET_IMPORT, { password });
      setImportStep('success');
    }}
  />
)}

{importStep === 'success' && restoreDetails && (
  <ImportSuccessModal
    isOpen={true}
    onClose={() => {
      setImportStep(null);
      onSetupComplete(); // Wallet is ready, proceed to unlock
    }}
    restoreDetails={restoreDetails}
    isFreshInstall={true}
  />
)}
```

### 3. Add Replace Wallet Flow to SettingsScreen

**Add new Advanced section (after Security section, before About):**
```tsx
{/* Advanced Section */}
<div className="bg-gray-850 border border-gray-700 rounded-xl shadow-sm p-6 mb-6">
  <h2 className="text-lg font-semibold text-white mb-4">Advanced</h2>

  <div className="space-y-4">
    {/* Import Backup & Replace Wallet button */}
    <button
      onClick={() => setReplaceStep('warning')}
      className="w-full bg-gray-800 hover:bg-gray-750 text-gray-300 py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center"
    >
      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      Import Backup & Replace Wallet
    </button>
  </div>
</div>
```

**Add replace flow state:**
```typescript
// Replace wallet flow state
type ReplaceStep = 'warning' | 'confirm-password' | 'file-select' | 'backup-password' | 'progress' | 'success';
const [replaceStep, setReplaceStep] = useState<ReplaceStep | null>(null);
const [currentWalletInfo, setCurrentWalletInfo] = useState<any>(null);
```

**Add replace flow modals:**
```tsx
{/* Replace Wallet Flow Modals */}
{replaceStep === 'warning' && (
  <ReplaceWalletWarningModal
    isOpen={true}
    onClose={() => setReplaceStep(null)}
    onContinue={() => setReplaceStep('confirm-password')}
    onExportFirst={() => {
      setReplaceStep(null);
      setExportStep('warning'); // Open export flow
    }}
    currentWallet={currentWalletInfo}
  />
)}

{replaceStep === 'confirm-password' && (
  <WalletPasswordConfirmModal
    isOpen={true}
    onClose={() => setReplaceStep(null)}
    onConfirm={async (password) => {
      await sendMessage(MessageType.UNLOCK_WALLET, { password });
      setReplaceStep('file-select');
    }}
  />
)}

{/* File select, backup password, progress modals same as fresh install */}
{/* But use replaceStep state instead of importStep */}
{/* And skip wallet-password step since keeping existing password */}
```

## Backend Message Types Needed

Add these to `src/shared/types/index.ts`:

```typescript
export enum MessageType {
  // ... existing types ...

  // Wallet backup/restore
  EXPORT_WALLET_BACKUP = 'EXPORT_WALLET_BACKUP',
  IMPORT_WALLET_BACKUP = 'IMPORT_WALLET_BACKUP',
  FINALIZE_WALLET_IMPORT = 'FINALIZE_WALLET_IMPORT',
}
```

## Testing Checklist

- [ ] Export flow - all 5 steps work correctly
- [ ] Import flow (fresh install) - all 5 steps work correctly
- [ ] Import flow (replace) - warning → file → import works
- [ ] Network mismatch modal shows when needed
- [ ] Password validation works (strength meter, requirements)
- [ ] File drag-drop and browse work
- [ ] Progress bars animate smoothly
- [ ] Success modals show correct information
- [ ] All error states display properly
- [ ] Keyboard navigation works
- [ ] Screen reader accessibility works

## File Locations

All components created:

```
src/tab/components/
├── shared/
│   ├── PasswordStrengthMeter.tsx (new)
│   ├── PasswordRequirementsChecklist.tsx (new)
│   └── FileUploadArea.tsx (new)
├── WalletBackup/
│   ├── Export/
│   │   ├── index.tsx
│   │   ├── ExportWarningModal.tsx
│   │   ├── WalletPasswordConfirmModal.tsx
│   │   ├── BackupPasswordCreateModal.tsx
│   │   ├── ExportProgressModal.tsx
│   │   └── ExportSuccessModal.tsx
│   └── Import/
│       ├── index.tsx
│       ├── FileSelectionModal.tsx
│       ├── BackupPasswordEntryModal.tsx
│       ├── ImportProgressModal.tsx
│       ├── SetWalletPasswordModal.tsx
│       ├── ImportSuccessModal.tsx
│       ├── ReplaceWalletWarningModal.tsx
│       └── NetworkMismatchWarningModal.tsx
```

## Next Steps

1. Integrate export flow into SettingsScreen (follow guide above)
2. Integrate import flow into WalletSetup (follow guide above)
3. Add message type definitions
4. Test each flow end-to-end
5. Verify backend integration works
6. Test error scenarios
7. Verify accessibility
8. Update frontend-developer-notes.md

---

**All frontend UI components are complete and ready for integration!**

Total Lines of Code: ~2,600
- Shared components: ~460 lines
- Export modals: ~760 lines
- Import modals: ~1,380 lines
