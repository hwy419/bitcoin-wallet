# Import Private Key Modal - Usage Example

## How to Use in Dashboard/Settings Component

### 1. Import the Component

```typescript
import ImportPrivateKeyModal from './ImportPrivateKeyModal';
```

### 2. Add State Management

```typescript
const [showImportModal, setShowImportModal] = useState(false);
```

### 3. Add Button to Trigger Modal

```typescript
<button
  onClick={() => setShowImportModal(true)}
  className="px-4 py-2 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold"
>
  Import Private Key
</button>
```

### 4. Render the Modal

```typescript
<ImportPrivateKeyModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  onSuccess={(accountName) => {
    console.log(`Successfully imported: ${accountName}`);
    // Refresh wallet state to show new account
    // ...
  }}
/>
```

### Complete Example

```typescript
import React, { useState } from 'react';
import ImportPrivateKeyModal from './components/ImportPrivateKeyModal';

export const Settings: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleImportSuccess = (accountName: string) => {
    console.log(`Successfully imported account: ${accountName}`);
    
    // Show success toast
    // toast.success(`Imported ${accountName} successfully!`);
    
    // Refresh wallet state
    // fetchWalletState();
    
    // Navigate to the new account
    // setCurrentAccountIndex(newIndex);
  };

  return (
    <div>
      <h1>Account Management</h1>
      
      {/* Import Button */}
      <button
        onClick={() => setShowImportModal(true)}
        className="px-4 py-2 bg-bitcoin hover:bg-bitcoin-hover text-white rounded-lg font-semibold transition-colors"
      >
        Import Private Key
      </button>

      {/* Import Modal */}
      <ImportPrivateKeyModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};
```

## Integration with Account Switcher Dropdown

If you want to add the import button to the account dropdown panel:

```typescript
{/* In Sidebar.tsx or AccountSwitcher component */}
<div className="p-3 border-t border-gray-700">
  <button
    onClick={() => setShowImportModal(true)}
    className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
  >
    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
    Import Private Key
  </button>
</div>
```

## Testing the Modal

### Test with Encrypted File

1. First export a private key using ExportPrivateKeyModal with encryption
2. Save the .enc file
3. Open ImportPrivateKeyModal
4. Select "Upload Encrypted File"
5. Upload the .enc file
6. Enter the decryption password
7. Verify import succeeds

### Test with Plain Text File

1. Create a .txt file with a WIF:
```
# Bitcoin Wallet Private Key Export
# Account Name: Test Account
# Address Type: Native SegWit (P2WPKH)
#
# Private Key (WIF):
cT1Yt8k9Z1X2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t1U2v3W4x5Y6z7A8
```
2. Upload in modal
3. Verify auto-validation works
4. Import successfully

### Test with Paste

1. Copy a valid testnet WIF
2. Open modal
3. Select "Paste Private Key"
4. Paste WIF into textarea
5. Verify real-time validation
6. Import successfully

## Error Scenarios to Test

- Wrong network (mainnet WIF to testnet wallet)
- Duplicate key (import same key twice)
- Invalid WIF format
- Wrong decryption password
- File too large (>100 KB)
- Empty file
- Wallet locked state
- Rate limiting (import >5 times in 1 minute)

