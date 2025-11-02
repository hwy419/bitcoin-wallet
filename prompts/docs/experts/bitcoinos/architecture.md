# BitcoinOS Integration Architecture

**Last Updated**: 2025-10-26
**Status**: Planning Phase

## Overview

This document defines the architectural integration of BitcoinOS technologies (BitSNARK, Grail Bridge, Merkle Mesh) into the Bitcoin Wallet Chrome Extension.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Chrome Extension                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐          ┌────────────────────────┐    │
│  │  Tab UI       │◄────────►│  Background Worker     │    │
│  │  (React App)  │  Runtime │  (Service Worker)      │    │
│  │               │  Messages│                        │    │
│  │  - Dashboard  │          │  - Wallet Management   │    │
│  │  - Send/Recv  │          │  - BitcoinOS Client ←──┼────┼─→ BitcoinOS SDK
│  │  - Bridge UI  │          │  - Proof Generation    │    │   - BitSNARK
│  │  - Settings   │          │  - Bridge Operations   │    │   - Grail Bridge
│  └───────────────┘          └────────────────────────┘    │   - Merkle Mesh
│                                      ▲                      │
│                                      │                      │
│                                      ▼                      │
│                          ┌──────────────────────┐          │
│                          │  Chrome Storage      │          │
│                          │  - Wallet Data       │          │
│                          │  - Bridge Operations │          │
│                          │  - Proof Cache       │          │
│                          └──────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
                                   ▲
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
            ┌──────────────┐            ┌─────────────────┐
            │  Bitcoin     │            │  Other Chains   │
            │  Network     │            │  (ETH/SOL/ADA)  │
            │              │            │                 │
            │  - Mainnet   │            │  - Ethereum     │
            │  - Testnet   │            │  - Cardano      │
            └──────────────┘            │  - Solana       │
                                        └─────────────────┘
```

### Component Architecture

#### 1. Frontend Layer (Tab UI)

**New Components**:
```
src/tab/components/
├── BitcoinOS/
│   ├── PrivacySendModal.tsx        # zk-SNARK privacy send
│   ├── CrossChainBridgeModal.tsx   # Grail Bridge UI
│   ├── BridgeStatusTracker.tsx     # Bridge operation tracking
│   ├── ProofGenerator.tsx          # Proof generation UI
│   └── BitcoinOSSettings.tsx       # BitcoinOS preferences
├── Dashboard.tsx                   # Update with cross-chain balances
└── SendScreen.tsx                  # Add privacy toggle
```

**State Management**:
```typescript
interface BitcoinOSState {
  // Bridge operations
  bridgeOperations: Map<string, BridgeOperation>;

  // Proof generation
  activeProofs: Map<string, ProofGeneration>;

  // Cross-chain balances
  crossChainBalances: {
    ethereum?: number;
    solana?: number;
    cardano?: number;
  };

  // Feature flags
  features: {
    privacyTransactions: boolean;
    crossChainBridge: boolean;
    merkleAggregation: boolean;
  };
}
```

#### 2. Background Worker Layer

**New Modules**:
```
src/background/
├── bitcoinos/
│   ├── BitSNARKClient.ts          # zk-proof generation & verification
│   ├── GrailBridgeClient.ts       # Cross-chain bridge operations
│   ├── MerkleMeshClient.ts        # Aggregation layer (future)
│   ├── ProofWorker.ts             # Web Worker for intensive computation
│   └── CrossChainSync.ts          # Multi-chain state synchronization
├── messageHandlers.ts             # Add BitcoinOS message types
└── index.ts                       # Initialize BitcoinOS clients
```

**Message Types**:
```typescript
// Privacy transactions
GENERATE_ZK_PROOF
SEND_PRIVATE_TRANSACTION
GET_PROOF_STATUS

// Cross-chain bridge
INITIATE_BRIDGE_DEPOSIT
INITIATE_BRIDGE_WITHDRAWAL
GET_BRIDGE_STATUS
GET_CROSS_CHAIN_BALANCE

// Proof verification
VERIFY_ZK_PROOF
BATCH_VERIFY_PROOFS
```

#### 3. Storage Layer

**New Storage Schema**:
```typescript
interface BitcoinOSStorage {
  // Bridge operations history
  bridgeOperations: {
    [operationId: string]: {
      id: string;
      type: 'deposit' | 'withdrawal';
      status: BridgeStatus;
      sourceChain: string;
      destinationChain: string;
      amount: number;
      createdAt: number;
      updatedAt: number;
      txHashes: {
        source?: string;
        destination?: string;
      };
      proof?: string;
    };
  };

  // Proof cache (avoid regeneration)
  proofCache: {
    [proofId: string]: {
      proof: string;
      inputs: any;
      createdAt: number;
      verified: boolean;
    };
  };

  // BitcoinOS preferences
  bitcoinosPreferences: {
    privacyMode: boolean;
    defaultPrivacyLevel: 'full' | 'partial' | 'none';
    bridgeEnabled: boolean;
    supportedChains: string[];
  };
}
```

### Integration Layers

#### Layer 1: BitSNARK Integration

**Purpose**: Privacy-preserving transactions using zk-SNARKs

**Components**:
- `BitSNARKClient`: Proof generation and verification
- `ProofWorker`: Web Worker for computation-intensive proof generation
- `PrivacySendModal`: UI for privacy transactions
- Proof caching layer

**Data Flow**:
```
User initiates privacy send
    ↓
Frontend validates inputs
    ↓
Background worker generates zk-proof (Web Worker)
    ↓
Proof verified locally
    ↓
Bitcoin transaction constructed with proof
    ↓
Transaction broadcast to Bitcoin network
    ↓
BitSNARK VM verifies proof on-chain
    ↓
Transaction confirmed
```

#### Layer 2: Grail Bridge Integration

**Purpose**: Cross-chain asset transfers

**Components**:
- `GrailBridgeClient`: Bridge operation coordination
- `CrossChainSync`: Multi-chain state synchronization
- `BridgeStatusTracker`: Real-time operation monitoring
- PSBT generation and signing

**Data Flow (Deposit)**:
```
User initiates BTC → ETH bridge
    ↓
Grail Bridge generates lock PSBT
    ↓
Wallet signs PSBT
    ↓
Bitcoin transaction broadcast (lock BTC)
    ↓
Wait for confirmations (6 blocks)
    ↓
Generate zk-proof of lock
    ↓
Submit proof to Ethereum
    ↓
Ethereum verifies proof (BitSNARK)
    ↓
Wrapped BTC minted on Ethereum
    ↓
Operation complete
```

#### Layer 3: Merkle Mesh Integration (Future)

**Purpose**: Scalable proof aggregation

**Components**:
- `MerkleMeshClient`: Proof submission and verification
- Batch proof coordination
- Ecosystem-wide analytics

**Data Flow**:
```
Multiple proofs generated (batch)
    ↓
Submit to Merkle Mesh
    ↓
Merkle tree constructed
    ↓
Root hash verified on Bitcoin
    ↓
All proofs in tree valid
```

## Security Architecture

### Proof Generation Security

**Threat Model**:
- Malicious proof generation
- Proof forgery attempts
- Resource exhaustion (DoS)
- Private key exposure during proof gen

**Mitigations**:
- Use Web Worker isolation for proof generation
- Validate all proof inputs before generation
- Rate limit proof generation requests
- Clear sensitive memory after proof gen
- Timeout long-running proofs (>60 seconds)

### Cross-Chain Bridge Security

**Threat Model**:
- Bridge operator malfunction
- Fake proof acceptance
- Chain reorganization
- Man-in-the-middle address substitution

**Mitigations**:
- Wait for deep confirmations (6+ blocks)
- Multi-operator verification
- Cryptographic proof verification
- Address confirmation UI
- Emergency withdrawal mechanism

### Storage Security

**Encryption**:
- Bridge operations: Not encrypted (public data)
- Proof cache: Encrypted if contains sensitive inputs
- Private keys: Never stored (existing wallet encryption)

**Access Control**:
- All BitcoinOS operations require wallet unlock
- Cross-chain operations require explicit user confirmation
- Large transfers require password re-entry

## Performance Considerations

### Proof Generation Performance

**Challenges**:
- zk-proof generation can take 10-60 seconds
- CPU-intensive operations
- Memory usage (100-500 MB)

**Optimizations**:
- Use Web Worker to avoid blocking UI
- Show progress indicator
- Allow user to cancel long operations
- Cache proofs when possible
- Batch multiple operations

**UX Impact**:
```
User clicks "Send with Privacy"
    ↓
[Show: "Generating privacy proof... 0%"]
    ↓
[Progress bar updates: 25%, 50%, 75%]
    ↓
[Show: "Proof generated! ✓"]
    ↓
User confirms transaction
```

### Bridge Operation Performance

**Timing**:
- BTC lock: ~10 minutes (1 block)
- Confirmations: ~60 minutes (6 blocks)
- Proof generation: ~30-60 seconds
- ETH verification: ~15 seconds
- **Total: 70-75 minutes**

**UX Impact**:
- Clear time estimates upfront
- Real-time progress tracking
- Background operation support
- Push notifications on completion (future)

## Deployment Strategy

### Phase 1: Development Environment (Current)

**Goals**:
- Set up BitcoinOS SDK in development
- Create proof-of-concept integrations
- Validate architecture decisions

**Tasks**:
- [ ] Research BitcoinOS SDK installation
- [ ] Set up development canisters (Internet Computer)
- [ ] Create example proof generation
- [ ] Test bridge flow on testnet

### Phase 2: Testnet Integration

**Goals**:
- Fully functional testnet features
- User testing and feedback
- Performance optimization

**Tasks**:
- [ ] Deploy BitSNARK integration to testnet
- [ ] Implement Grail Bridge testnet flow
- [ ] Extensive testing (100+ test transactions)
- [ ] Iterate on UX based on user feedback

### Phase 3: Mainnet Preparation

**Goals**:
- Production-ready code
- Security audits complete
- Mainnet deployment plan

**Tasks**:
- [ ] Security audit of all BitcoinOS code
- [ ] Blockchain expert review
- [ ] Performance benchmarking
- [ ] User documentation
- [ ] Support processes

### Phase 4: Mainnet Launch

**Goals**:
- Safe, gradual rollout
- Close monitoring
- Rapid incident response

**Tasks**:
- [ ] Limited beta (whitelisted users)
- [ ] Small amount limits initially
- [ ] Real-time monitoring dashboard
- [ ] Gradual expansion of limits
- [ ] Full feature rollout

## Feature Flags

**BitcoinOS Features**:
```typescript
const BITCOINOS_FEATURES = {
  // Privacy transactions
  PRIVACY_SEND: {
    enabled: process.env.BITCOINOS_PRIVACY === 'true',
    testnetOnly: true,
    requiresVersion: '0.12.0'
  },

  // Cross-chain bridge
  GRAIL_BRIDGE: {
    enabled: process.env.BITCOINOS_BRIDGE === 'true',
    testnetOnly: true,
    chains: ['ethereum'], // Start with ETH only
    requiresVersion: '0.13.0'
  },

  // Merkle Mesh (future)
  MERKLE_MESH: {
    enabled: false,
    testnetOnly: true,
    requiresVersion: '0.14.0'
  }
};
```

## Monitoring & Observability

### Metrics to Track

**BitSNARK Metrics**:
- Proof generation time (p50, p95, p99)
- Proof generation success rate
- Proof size distribution
- Verification success rate

**Grail Bridge Metrics**:
- Bridge operation count (deposits, withdrawals)
- Average operation duration
- Success rate
- Stuck operation count
- Fee amounts

**Error Tracking**:
- Proof generation failures
- Bridge operation failures
- Network errors (Bitcoin, Ethereum)
- SDK errors

### Logging

**Log Levels**:
```typescript
// Development: Verbose logging
console.log('[BitcoinOS] Generating proof for tx:', txId);

// Production: Error logging only
console.error('[BitcoinOS] Proof generation failed:', error);

// Never log sensitive data
// ❌ console.log('Private key:', privateKey);
// ❌ console.log('Proof inputs:', inputs);
```

## Testing Strategy

### Unit Tests
- BitSNARK client proof generation
- Grail Bridge operation state machine
- Proof validation logic
- Storage operations

### Integration Tests
- End-to-end privacy transaction flow
- End-to-end bridge operation flow
- Multi-chain synchronization
- Error handling and recovery

### Manual Tests
- Testnet privacy sends
- Testnet bridge operations (BTC → ETH → BTC)
- Performance under load
- UI/UX validation

## Resources

- **SDK Documentation**: https://docs.bitcoinos.build/
- **GitHub**: https://github.com/bitcoinOS/bitcoinOS
- **Example Projects**: [TBD - look for example integrations]

## Cross-References

- **BitSNARK**: [bitsnark.md](bitsnark.md)
- **Grail Bridge**: [grail-bridge.md](grail-bridge.md)
- **Merkle Mesh**: [merkle-mesh.md](merkle-mesh.md)
- **Security**: [security.md](security.md)
- **Roadmap**: [roadmap.md](roadmap.md)

---

**Status**: Architecture defined, ready for implementation planning.
