# Product Manager - Quick Reference

**Last Updated**: November 1, 2025
**Role**: Product Manager
**Purpose**: Requirements, features, roadmap, user stories, scope decisions

---

## Current Status

### Current Version: v0.12.0

### Completed Features ✅
- Wallet creation & import (seed phrase, private key)
- Multiple accounts with custom names
- All address types (Legacy, SegWit, Native SegWit)
- Send/receive Bitcoin (testnet)
- Transaction history with details
- Fee selection (slow/medium/fast)
- Multisig wallets (2-of-2, 2-of-3, 3-of-5)
- PSBT coordination for multisig
- Private key export/import with WIF
- Dark mode
- Contacts management V2
- Tab-based architecture
- **NEW: Transaction metadata (tags, category, notes) with encryption**
- **NEW: Contact custom tags (key-value pairs) with encryption**
- **NEW: Enhanced filtering (multi-select, combined filters)**
- **NEW: ContactDetailPane (inline editing, tag management)**
- **NEW: "Add to Contacts" quick workflow**

### Next Release: v0.13.0 - Privacy Enhancements ⏳
- Change address rotation (P0)
- Randomized UTXO selection (P1)
- Privacy mode settings (P2)
- Contact privacy tracking (P1)

### Roadmap 📋
- v0.13.0: Privacy enhancements
- v0.14.0: Address list pagination
- v0.15.0: Transaction list pagination
- v0.16.0: Hardware wallet integration
- v1.0.0: Mainnet launch

---

## Documentation Map

- [**roadmap.md**](./roadmap.md) - Feature prioritization, release planning
- [**requirements.md**](./requirements.md) - User stories, acceptance criteria
- [**features.md**](./features.md) - Feature specifications, future enhancement ideas
- [**decisions.md**](./decisions.md) - Product ADRs

---

## Recent Changes (Last 5)

1. **2025-11-01**: v0.12.0 Released - Transaction metadata, contact tags, enhanced filtering, ContactDetailPane, "Add to Contacts"
2. **2025-11-01**: Updated CHANGELOG.md, README.md, DISTRIBUTION_GUIDE.md for v0.12.0 release
3. **2025-10-30**: Address List Enhancement PRD (v0.14.0) - Pagination, creation order sort, newest address indicator
4. **2025-10-30**: Transaction List Enhancement PRD (v0.15.0) - Pagination, filtering, search, and layout improvements
5. **2025-10-30**: Added "Future UI/UX Enhancement Ideas" section to features.md with Enhancement Idea 1 (Larger Bitcoin Icon)

---

## Quick Reference

### Feature Priority Framework
- **P0 (Must-have)**: Security, core wallet functionality
- **P1 (Should-have)**: UX improvements, privacy features
- **P2 (Nice-to-have)**: Advanced features, optimizations

### User Segments
1. **Beginners**: Simple send/receive, guided flows
2. **Power Users**: Multisig, coin control, privacy tools
3. **Developers**: xpub coordination, PSBT workflows

### Success Metrics
- Wallet creation success rate: >95%
- Transaction success rate: >98%
- User onboarding time: <5 minutes
- Security incident rate: 0%

---

**Need detailed information?** Navigate to the specific documentation files linked above.
