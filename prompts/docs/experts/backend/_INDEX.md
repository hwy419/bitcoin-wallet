# Backend Developer - Quick Reference

**Last Updated**: November 1, 2025
**Role**: Backend Developer
**Purpose**: Service worker, API integration, message passing, Chrome storage, AWS infrastructure

---

## Current Status

### Implemented ✅
- Service worker with wallet state management
- Message handler system (33+ handlers)
- Blockstream API client with rate limiting
- Price service (CoinGecko integration)
- Chrome storage encryption
- Auto-lock timer
- PSBT management for multisig
- WIF import/export handlers
- **AWS Lambda proxy infrastructure (v0.11.0)**
- **Transaction metadata management (v0.12.0)**
- **Contact tags support (v0.12.0)**
- **Transaction metadata backup/restore (v0.12.1)**

### In Progress ⏳
- Privacy enhancement backend (randomized UTXO, change rotation)
- Chrome extension integration with Lambda proxy

### Planned 📋
- Webhook notifications
- Transaction monitoring
- Hardware wallet protocol

---

## Documentation Map

- [**service-worker.md**](./service-worker.md) - Architecture, lifecycle, state management
- [**messages.md**](./messages.md) - Message handlers, patterns, types
- [**storage.md**](./storage.md) - Chrome storage patterns, encryption
- [**api.md**](./api.md) - Blockstream client, price service, rate limiting
- [**lambda-proxy.md**](./lambda-proxy.md) - AWS Lambda + API Gateway proxy infrastructure
- [**backup-system.md**](./backup-system.md) - Wallet backup/restore, encryption, transaction metadata
- [**decisions.md**](./decisions.md) - Backend ADRs

---

## Recent Changes (Last 5)

1. **2025-11-01**: Transaction metadata backup support in BackupManager (v0.12.1)
2. **2025-11-01**: Transaction metadata message handlers (8 handlers) + contact tags support
3. **2025-10-28**: AWS Lambda proxy infrastructure implemented (CRITICAL SECURITY FIX)
4. **2025-10-22**: Fixed ADD_CONTACT handler to support xpub-only contacts
5. **2025-10-22**: Migrated notes to segmented structure (7 files total)

---

## Quick Reference

### Message Handler Pattern
```typescript
async function handleMessage(
  msg: Message,
  sender: chrome.runtime.MessageSender
): Promise<Response> {
  const { type, payload } = msg;

  switch (type) {
    case 'SEND_TRANSACTION':
      return await sendTransaction(payload);
    // ...
  }
}
```

### Storage Keys
```
walletData: Encrypted wallet seed, accounts
walletState: Lock status, current account
contacts: Contact list (v2 - encrypted with tags support)
transaction_metadata: Transaction tags, categories, notes (encrypted)
settings: User preferences

Backup Format (v1.1):
- Wallet data (encrypted with wallet password)
- Contacts (encrypted with wallet password)
- Transaction metadata (encrypted with wallet password) - v0.12.1+
- Complete payload (encrypted with backup password - 600K PBKDF2)
```

### API Clients
- **BlockstreamClient**: Blockchain data, UTXOs, broadcast
- **PriceService**: BTC/USD pricing (cached 60s)
- **Lambda Proxy**: AWS infrastructure securing Blockstream API key

### Lambda Proxy Quick Facts
- **Infrastructure**: AWS CDK (TypeScript)
- **Runtime**: Node.js 20.x, 256MB RAM, 30s timeout
- **API Gateway**: 1000 req/sec throttle, 5000 burst
- **Cost**: $5-10/month (free tier eligible)
- **Monitoring**: CloudWatch dashboard, 4 alarms, SNS alerts
- **Security**: API key protected, address masking, CORS restricted

---

**Need detailed information?** Navigate to the specific documentation files linked above.
