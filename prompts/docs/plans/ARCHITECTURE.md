# Technical Architecture Document
## Bitcoin Wallet Chrome Extension

## 1. Extension Structure (Manifest V3)

### 1.1 Components
```
bitcoin-wallet/
├── manifest.json                 # Extension manifest (V3)
├── src/
│   ├── popup/                   # Main wallet UI (React)
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── components/
│   │   │   ├── WalletSetup/    # Create/Import wallet
│   │   │   ├── UnlockWallet/   # Password entry
│   │   │   ├── Dashboard/      # Balance + accounts
│   │   │   ├── AccountList/    # MetaMask-style account switcher
│   │   │   ├── Send/           # Send transaction form
│   │   │   ├── Receive/        # Address display + QR
│   │   │   └── History/        # Transaction list
│   │   ├── hooks/
│   │   └── styles/
│   ├── background/              # Service worker
│   │   ├── index.ts            # Main background script
│   │   ├── wallet/             # Wallet operations
│   │   │   ├── KeyManager.ts   # Key generation, encryption
│   │   │   ├── HDWallet.ts     # BIP32/BIP44 implementation
│   │   │   └── AddressGenerator.ts
│   │   ├── bitcoin/            # Bitcoin operations
│   │   │   ├── TransactionBuilder.ts
│   │   │   ├── FeeEstimator.ts
│   │   │   └── Signer.ts
│   │   ├── api/                # Blockchain API client
│   │   │   └── BlockstreamClient.ts
│   │   └── messaging/          # Chrome message handlers
│   ├── shared/
│   │   ├── types/              # TypeScript interfaces
│   │   ├── constants.ts        # BIP44 paths, networks, etc.
│   │   └── utils/
│   └── assets/
│       ├── icons/
│       └── images/
├── public/
├── package.json
├── webpack.config.js
└── tsconfig.json
```

### 1.2 Chrome Extension Parts
- **Popup (popup.html)**: Main UI - 600x400px window
- **Background Service Worker**: Handles crypto operations, API calls, storage
- **Options Page** (future): Settings, advanced features
- **No content scripts needed** for MVP

## 2. Data Flow Architecture

### 2.1 Communication Pattern
```
Popup (React) <---> Background Service Worker <---> Blockstream API
                           |
                           v
                    chrome.storage.local
                    (encrypted data)
```

### 2.2 Message Passing (Chrome Runtime)
```typescript
// Popup -> Background
chrome.runtime.sendMessage({
  type: 'CREATE_WALLET',
  payload: { password, addressType }
})

// Background -> Popup
chrome.runtime.sendMessage({
  type: 'WALLET_CREATED',
  payload: { seedPhrase, firstAddress }
})
```

### 2.3 Message Types
- `CREATE_WALLET` - Generate new wallet
- `IMPORT_WALLET` - Import from seed/private key
- `UNLOCK_WALLET` - Verify password, decrypt keys
- `LOCK_WALLET` - Clear memory, lock UI
- `GET_BALANCE` - Fetch balance for account
- `GET_TRANSACTIONS` - Fetch transaction history
- `SEND_TRANSACTION` - Build, sign, broadcast
- `GENERATE_ADDRESS` - Create new receive address
- `CREATE_ACCOUNT` - Add new account (BIP44)
- `UPDATE_ACCOUNT_NAME` - Rename account
- `GET_FEE_ESTIMATES` - Get slow/medium/fast fees

## 3. Security Architecture

### 3.1 Key Storage Model
```typescript
// Stored in chrome.storage.local
interface StoredWallet {
  version: 1,
  encryptedSeed: string,        // AES-256-GCM encrypted
  salt: string,                 // For PBKDF2
  iv: string,                   // Initialization vector
  accounts: Account[],
  settings: WalletSettings
}

interface Account {
  index: number,                // BIP44 account index
  name: string,                 // User-friendly name
  addressType: 'legacy' | 'segwit' | 'native-segwit',
  externalIndex: number,        // Last used address index
  internalIndex: number,        // Change address index
  addresses: Address[]          // Address cache
}
```

### 3.2 Encryption Flow
```
User Password
  -> PBKDF2 (100,000 iterations, SHA-256)
  -> Encryption Key
  -> AES-256-GCM
  -> Encrypted Seed Phrase
  -> chrome.storage.local
```

### 3.3 Runtime Security
- **In-memory only**: Decrypted seed phrase never persists
- **Session-based**: Auto-lock after 15 minutes of inactivity
- **Password required**: For unlock and every transaction
- **No clipboard**: Seed phrase never auto-copied
- **Clear on lock**: All sensitive data cleared from memory

### 3.4 Background Service Worker Lifecycle
- Service worker may terminate (Chrome limitation)
- Never store decrypted keys persistently
- Require password re-entry after worker restart

## 4. Bitcoin Implementation

### 4.1 HD Wallet (BIP Standards)
- **BIP39**: Mnemonic generation (12 or 24 words)
- **BIP32**: Hierarchical Deterministic wallets
- **BIP44**: Multi-account hierarchy
  - Legacy: `m/44'/1'/account'/change/index` (testnet coin type = 1)
  - SegWit: `m/49'/1'/account'/change/index`
  - Native SegWit: `m/84'/1'/account'/change/index`

### 4.2 Address Types
```typescript
enum AddressType {
  LEGACY = 'legacy',           // P2PKH - starts with 'm' or 'n' (testnet)
  SEGWIT = 'segwit',          // P2SH-P2WPKH - starts with '2'
  NATIVE_SEGWIT = 'native-segwit' // P2WPKH - starts with 'tb1'
}
```

### 4.3 Transaction Building
```typescript
// Flow:
1. Get UTXOs for account (Blockstream API)
2. Select UTXOs (coin selection algorithm)
3. Calculate fee based on user selection (slow/medium/fast)
4. Build transaction (bitcoinjs-lib)
5. Sign with private key
6. Broadcast (Blockstream API)
7. Monitor confirmations
```

### 4.4 Fee Estimation
```typescript
interface FeeEstimate {
  slow: number,      // sat/vB (e.g., 1-2 blocks)
  medium: number,    // sat/vB (e.g., 3-6 blocks)
  fast: number       // sat/vB (e.g., next block)
}

// Blockstream provides fee estimates
// Calculate total fee: (transaction size in vB) * (sat/vB rate)
```

## 5. API Integration Architecture

### 5.1 Production Architecture (AWS Lambda Proxy)

**Primary Approach for Production:**

```
┌──────────────────────────┐
│  Extension (Client-Side) │
│  • BlockstreamClient.ts  │
│  • No API keys           │
└────────┬─────────────────┘
         │ HTTPS
         │ https://api.yourdomain.com/blockstream/*
         │
┌────────▼─────────────────┐
│   AWS API Gateway        │
│   • CORS enabled         │
│   • Rate limiting        │
│   • Request validation   │
└────────┬─────────────────┘
         │ Lambda Proxy Integration
         │
┌────────▼─────────────────┐
│   AWS Lambda Function    │
│   • Has API key (secure) │
│   • Forwards to Blockstream│
│   • CloudWatch logging   │
└────────┬─────────────────┘
         │ HTTPS + X-API-Key header
         │
┌────────▼─────────────────┐
│   Blockstream API        │
│   (Paid Credits)         │
└──────────────────────────┘
```

**Why Lambda Proxy?**
- ✅ **Security**: API key stored on backend, never in client code
- ✅ **Cost**: ~$5-10/month + Blockstream credits
- ✅ **Scalability**: Auto-scales to 1000 concurrent requests
- ✅ **Maintenance**: Serverless (no servers to manage)

**See**: `prompts/docs/plans/BLOCKSTREAM_API_PROXY_PLAN.md` for full implementation guide

### 5.2 Future Scaling Option (Self-Hosted Esplora)

When request volume exceeds 1-2M/month or Blockstream costs exceed $150/month:

```
Extension → Lambda Proxy → Self-Hosted Esplora Node
                        ↓
                  (fallback) Blockstream API
```

**See**: `prompts/docs/plans/SELF_HOSTED_ESPLORA_AWS_PLAN.md` for self-hosting plan

### 5.3 API Endpoints

**BlockstreamClient Configuration:**
```typescript
// Production: Use Lambda proxy
const baseUrl = process.env.BLOCKSTREAM_PROXY_URL || 'https://blockstream.info/testnet/api';

// Endpoints (same interface for proxy or direct):
GET  /address/{address}                    # Address info + balance
GET  /address/{address}/txs                # Transaction history
GET  /address/{address}/utxo               # Unspent outputs
GET  /tx/{txid}                           # Transaction details
POST /tx                                   # Broadcast transaction
GET  /fee-estimates                        # Fee recommendations
```

**Environment Variables:**
```bash
# Production (Lambda proxy - API key on backend)
BLOCKSTREAM_PROXY_URL=https://api.yourdomain.com/blockstream

# Development (Direct Blockstream - API key in extension, LOCAL ONLY)
# DO NOT PUBLISH TO CHROME WEB STORE WITH API KEY IN CODE
```

### 5.4 Rate Limiting & Caching

**API Gateway Level:**
- 1000 requests/second per IP
- Burst limit: 5000 requests
- Throttling: Automatic

**Lambda Level:**
- Concurrent execution limit: 100 (prevents runaway costs)
- Timeout: 30 seconds

**Client Level (BlockstreamClient.ts):**
- Exponential backoff: 1s, 2s, 4s
- Retry logic for transient failures
- Request deduplication

**Future Enhancement:**
- Add Redis/ElastiCache for response caching
- TTL: 30-60 seconds for address lookups
- Reduces Blockstream API calls by 80-90%

### 5.5 Error Handling

```typescript
enum ApiErrorType {
  NETWORK_ERROR,      // No internet or Lambda unreachable
  RATE_LIMITED,       // Too many requests (shouldn't happen with proxy)
  INVALID_ADDRESS,    // Bad address format
  INSUFFICIENT_FUNDS, // Not enough balance
  BROADCAST_FAILED,   // Transaction rejected by network
  PROXY_ERROR,        // Lambda proxy error (502 Bad Gateway)
}
```

**Error Flow:**
```
Extension → API Gateway → Lambda → Blockstream
                         ↓
                   (if error)
                         ↓
           Lambda returns 502 Bad Gateway
                         ↓
         Extension shows user-friendly error
```

### 5.6 Security Considerations

**API Key Protection:**
- ❌ **NEVER** bundle API keys in extension code (can be extracted)
- ✅ **ALWAYS** use Lambda proxy for production
- ✅ Store API key in Lambda environment variables (encrypted at rest)
- ✅ Rotate API keys every 90 days
- ✅ Separate keys for testnet and mainnet

**Rate Limit Protection:**
- API Gateway throttling prevents abuse
- CloudWatch alarms for unusual traffic
- Can add API key authentication between extension and Lambda (optional)

**Privacy:**
- Lambda logs sanitized (no Bitcoin addresses in production logs)
- CloudWatch log retention: 7 days (configurable)
- No user data persisted

## 6. State Management

### 6.1 React State (Popup)
```typescript
interface WalletState {
  isLocked: boolean,
  isInitialized: boolean,
  currentAccount: number,
  accounts: Account[],
  balance: {
    confirmed: number,
    unconfirmed: number
  },
  transactions: Transaction[],
  isLoading: boolean,
  error: string | null
}
```

### 6.2 State Management Strategy
- **React Context** for global wallet state
- **Local state** for form inputs
- **Background service worker** as source of truth
- **Periodic sync** (every 30 seconds when unlocked)

## 7. User Flows

### 7.1 First Time Setup
1. User installs extension
2. Click extension icon -> Welcome screen
3. Choose "Create Wallet" or "Import Wallet"
4. If Create:
   - Choose address type
   - Set password
   - Display seed phrase (12 words)
   - Confirm seed phrase (select words in order)
   - Wallet created, show first account
5. If Import:
   - Choose import method (seed phrase or private key)
   - Choose address type
   - Set password
   - Wallet imported, show account(s)

### 7.2 Unlock Wallet
1. Open popup -> Unlock screen
2. Enter password
3. Background decrypts seed phrase
4. Load accounts and balances
5. Show dashboard

### 7.3 Send Transaction
1. Click "Send"
2. Enter recipient address
3. Enter amount (BTC)
4. Select fee speed (slow/medium/fast)
5. Review transaction details
6. Confirm password
7. Sign and broadcast
8. Show confirmation / txid

### 7.4 Receive
1. Click "Receive"
2. Show current address + QR code
3. Copy button
4. Option: "Generate new address"

### 7.5 Account Management
1. Click account dropdown (MetaMask-style)
2. List of accounts with balances
3. Select account to switch
4. "Create Account" button
5. Edit icon to rename

## 8. Development Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Project setup (React + TypeScript + Webpack)
- Manifest V3 configuration
- Basic UI shell with Tailwind
- Chrome storage and messaging setup
- Background service worker scaffold

### Phase 2: Wallet Core (Week 3-4)
- BIP39 seed generation
- BIP32/BIP44 HD wallet implementation
- Key encryption/decryption
- Password management
- Address generation (all 3 types)

### Phase 3: Bitcoin Operations (Week 5-6)
- Blockstream API client
- Balance fetching
- Transaction history
- UTXO management
- Transaction building and signing

### Phase 4: UI Implementation (Week 7-8)
- Wallet setup flow
- Unlock/lock UI
- Dashboard with accounts
- Send transaction form
- Receive address display
- Transaction history view

### Phase 5: Polish & Testing (Week 9-10)
- Error handling
- Loading states
- Form validation
- Testnet testing
- Security audit
- Documentation

## 9. Key Libraries

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "bitcoinjs-lib": "^6.x",
    "bip32": "^4.x",
    "bip39": "^3.x",
    "crypto-js": "^4.x",
    "qrcode.react": "^3.x",
    "tailwindcss": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "webpack": "^5.x",
    "webpack-cli": "^5.x",
    "@types/chrome": "^0.0.x",
    "@types/react": "^18.x"
  }
}
```

## 10. Security Checklist

- [ ] Never log private keys or seed phrases
- [ ] Use well-tested crypto libraries (no custom implementations)
- [ ] Encrypt all sensitive data at rest
- [ ] Clear sensitive data from memory on lock
- [ ] Validate all user inputs (addresses, amounts)
- [ ] Use HTTPS for all API calls
- [ ] Implement CSP (Content Security Policy)
- [ ] Test on testnet extensively before mainnet
- [ ] Add warnings about seed phrase backup
- [ ] Rate limit transaction signing requests
- [ ] Validate transaction outputs before signing
- [ ] Use proper BIP44 derivation paths

## 11. Testing Strategy

### Unit Tests
- Key generation and encryption
- Address derivation
- Transaction building
- Fee calculation
- Input validation

### Integration Tests
- Wallet create/import flow
- Send/receive transactions
- Account management
- API error handling

### Manual Testing
- Complete user flows on testnet
- Edge cases (empty wallet, insufficient funds)
- Browser compatibility (Chrome, Edge)
- Service worker lifecycle
- Auto-lock functionality

## 12. Multi-Signature Wallet Support

### 12.1 Overview
Multi-signature (multisig) wallets require multiple co-signers to approve transactions, providing enhanced security for shared funds and business accounts.

**Supported Configurations:**
- **2-of-2**: Both signatures required (Personal security/Couples)
- **2-of-3**: Any 2 of 3 signatures required (Recommended - Business partnerships)
- **3-of-5**: Any 3 of 5 signatures required (Organizations)

### 12.2 Architecture Components

```
src/
├── background/
│   ├── wallet/
│   │   ├── MultisigManager.ts         # Multisig account creation and management
│   │   └── utils/
│   │       └── bip67.ts              # BIP67 deterministic key sorting
│   └── bitcoin/
│       ├── TransactionBuilder.ts      # Extended with multisig PSBT support
│       └── PSBTManager.ts             # PSBT import/export and tracking
├── popup/
│   ├── components/
│   │   └── MultisigSetup/
│   │       └── ConfigSelector.tsx     # Multisig configuration UI
│   └── content/
│       └── multisig-help.ts           # User education content
└── shared/
    └── types/
        └── index.ts                   # Multisig type definitions
```

### 12.3 BIP Standards
- **BIP48**: Derivation paths for multisig wallets
  - Format: `m/48'/coin_type'/account'/script_type'`
  - Script types: 1 (P2SH), 2 (P2WSH), 1 (P2SH-P2WSH)
- **BIP67**: Deterministic key sorting for multisig addresses
  - Ensures all co-signers generate identical addresses
  - Lexicographic sorting of public keys
- **BIP174**: Partially Signed Bitcoin Transactions (PSBT)
  - Enables transaction coordination between co-signers
  - Support for base64/hex export and QR code chunking

### 12.4 Address Types
```typescript
enum MultisigAddressType {
  P2SH = 'p2sh',           // Legacy multisig
  P2WSH = 'p2wsh',         // Native SegWit multisig (recommended)
  P2SH_P2WSH = 'p2sh-p2wsh' // Wrapped SegWit multisig
}
```

### 12.5 Multisig Workflow

**Setup Phase:**
1. Each co-signer exports their xpub for the chosen configuration
2. All co-signers share xpubs (with fingerprints for verification)
3. Each co-signer imports others' xpubs
4. Each creates local multisig account with all xpubs
5. All co-signers verify the first receive address matches

**Transaction Phase:**
1. Initiator creates unsigned PSBT
2. Export PSBT (base64, QR chunks, or file)
3. Each co-signer imports PSBT
4. Each co-signer signs PSBT with their key
5. Merge signed PSBTs
6. Once M signatures collected, finalize and broadcast

### 12.6 Key Management

**Extended Public Key (xpub) Export:**
```typescript
interface XpubExport {
  xpub: string;              // Base58-encoded extended public key
  fingerprint: string;       // Master key fingerprint (8 hex chars)
  derivationPath: string;    // BIP48 path
  network: 'testnet' | 'mainnet';
  multisigConfig: MultisigConfig;
  addressType: MultisigAddressType;
}
```

**Co-signer Information:**
```typescript
interface Cosigner {
  name: string;              // User-friendly name
  xpub: string;             // Extended public key
  fingerprint: string;       // Master key fingerprint
  derivationPath: string;    // BIP48 derivation path
  isSelf: boolean;          // Whether this is our key
}
```

### 12.7 PSBT Management

**PSBT Export Formats:**
- **Base64**: Standard format for copy/paste or file export
- **Hex**: Alternative format
- **QR Chunks**: Split large PSBTs into ~2500 byte chunks for air-gapped signing

**Pending Transaction Tracking:**
```typescript
interface PendingMultisigTx {
  txid: string;
  psbtBase64: string;
  multisigAccountId: string;
  requiredSignatures: number;
  totalCosigners: number;
  currentSignatures: number[];  // Signatures per input
  recipientAddress: string;
  amount: number;
  fee: number;
  createdAt: number;
  updatedAt: number;
  status: 'pending' | 'ready';
  description?: string;
}
```

### 12.8 Security Considerations

**Key Sorting (BIP67):**
- All co-signers must sort public keys identically
- Lexicographic ordering prevents address generation mismatches
- Validates key prefixes (0x02/0x03 for compressed, 0x04 for uncompressed)

**PSBT Validation:**
- Verify M-of-N parameters match configuration
- Validate all inputs have required witness/redeem scripts
- Count existing signatures before adding more
- Prevent signing same PSBT twice

**Co-signer Verification:**
- Always verify fingerprints in person or via trusted channel
- Check first address matches across all co-signers before funding
- Store co-signer information securely with wallet data

### 12.9 User Education

The implementation includes extensive help content covering:
- What multisig wallets are and how they work
- Step-by-step setup guides
- Configuration comparisons (2-of-2 vs 2-of-3 vs 3-of-5)
- Address type explanations
- PSBT workflow tutorials
- Security warnings and best practices
- Troubleshooting guides
- Glossary of terms (xpub, fingerprint, PSBT, etc.)

### 12.10 Storage Schema Extension

```typescript
interface MultisigAccount {
  accountType: 'multisig';
  index: number;
  name: string;
  multisigConfig: MultisigConfig;
  addressType: MultisigAddressType;
  cosigners: Cosigner[];
  externalIndex: number;
  internalIndex: number;
  addresses: MultisigAddress[];
  balance?: number;
  transactions?: string[];
}

interface MultisigAddress {
  address: string;
  derivationPath: string;
  index: number;
  isChange: boolean;
  used: boolean;
  redeemScript?: string;      // For P2SH and P2SH-P2WSH
  witnessScript?: string;      // For P2WSH and P2SH-P2WSH
}
```

## 13. Future Enhancements (Post-MVP)

- Bitcoin mainnet support
- Connect to personal Bitcoin node
- Address book
- Advanced fee customization (manual sat/vB)
- Multiple wallets
- Watch-only addresses
- Hardware wallet support (Ledger, Trezor)
- Lightning Network support
- Export transaction history (CSV)
- Additional multisig configurations (e.g., 2-of-4, 4-of-7)
- Multisig descriptor export/import
