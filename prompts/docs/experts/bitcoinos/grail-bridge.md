# Grail Bridge - Trustless Cross-Chain Bitcoin Transfers

**Last Updated**: 2025-10-26
**Status**: Testnet (launched Feb 2025), Mainnet Q2 2025
**Testnet Support**: ✅ Yes
**Mainnet Support**: ⏳ Coming Q2 2025

## Overview

Grail Bridge is BitcoinOS's trustless cross-chain bridge that enables secure asset transfers between Bitcoin and other blockchains (Ethereum, Cardano, Solana, etc.) using zk-SNARKs and the BitSNARK verification protocol. No trusted intermediaries or custodians required.

## Key Capabilities

### 1. Cross-Chain Asset Transfers

**Supported Chains** (Current & Planned):
- ✅ **Ethereum**: Testnet active, mainnet Q2 2025
- 🔜 **Cardano**: Planned for Q3 2025
- 🔜 **Solana**: Planned for Q3 2025
- 🔜 **Other EVM chains**: Polygon, BSC, Arbitrum, etc.

**Transfer Types**:
- **Bitcoin → Ethereum**: Lock BTC, mint wrapped BTC on Ethereum
- **Ethereum → Bitcoin**: Burn wrapped BTC, unlock native BTC
- **Multi-hop**: BTC → ETH → Solana (via bridge composition)

### 2. Trustless Architecture

**How It Works**:

**Deposit (BTC → ETH)**:
1. User locks Bitcoin in bridge contract on Bitcoin L1
2. Lock transaction generates zk-proof of deposit
3. Proof verified on Ethereum using BitSNARK verification
4. Wrapped BTC minted on Ethereum to user's address

**Withdrawal (ETH → BTC)**:
1. User burns wrapped BTC on Ethereum
2. Burn transaction generates zk-proof
3. Proof verified on Bitcoin using BitSNARK VM
4. Native BTC released to user's Bitcoin address

**Security Model**:
- **No Custodians**: No central party holds funds
- **Cryptographic Verification**: zk-proofs ensure correctness
- **Bitcoin-Native**: Leverages Bitcoin's security
- **Transparent**: All operations verifiable on-chain

### 3. PSBT Integration

Grail Bridge uses **Partially Signed Bitcoin Transactions (PSBT)** for coordination:

**Benefits**:
- Compatible with existing Bitcoin wallet infrastructure
- Hardware wallet support
- Multi-signature support
- Standard Bitcoin tooling

**Workflow**:
1. Bridge generates unsigned PSBT for lock/unlock
2. User reviews and signs with wallet
3. Signed PSBT broadcast to Bitcoin network
4. Bridge observes confirmation and proceeds

## Wallet Integration Architecture

### Frontend Components

**Cross-Chain Send Screen**:
```
┌─────────────────────────────────────┐
│ Send to Another Chain               │
├─────────────────────────────────────┤
│ From:    Bitcoin Mainnet            │
│ To:      Ethereum Mainnet           │
│                                     │
│ Amount:  [0.5] BTC                  │
│                                     │
│ Destination (ETH): [0x123...abc]    │
│                                     │
│ Bridge Fee: 0.001 BTC               │
│ Network Fee: 0.0002 BTC             │
│ You'll Receive: ~0.4988 WBTC        │
│                                     │
│ ⚠️  Bridge Time: ~30 minutes        │
│ ℹ️  Track status in Activity tab    │
│                                     │
│     [Cancel]    [Bridge Bitcoin]    │
└─────────────────────────────────────┘
```

**Bridge Status Tracker**:
```
┌─────────────────────────────────────┐
│ Bridge Transaction #4921            │
├─────────────────────────────────────┤
│ Status: ⏳ Pending (2/3 complete)   │
│                                     │
│ ✅ 1. Bitcoin Locked (6/6 confirms) │
│ ✅ 2. Proof Generated               │
│ ⏳ 3. Ethereum Verification...      │
│    ⏸  4. Wrapped BTC Mint           │
│                                     │
│ Est. Completion: ~15 minutes        │
│                                     │
│ Bitcoin TX: [bc1q...] 📋           │
│ Ethereum TX: Pending...             │
│                                     │
│     [View Details] [Get Support]    │
└─────────────────────────────────────┘
```

### Backend Integration

**Grail Bridge Client** (Background Service Worker):

```typescript
// Conceptual API (to be refined)
import { GrailBridge } from '@bitcoinos/grail-bridge';

class GrailBridgeClient {
  private bridge: GrailBridge;

  async deposit(
    amount: number,
    destinationChain: 'ethereum' | 'cardano' | 'solana',
    destinationAddress: string
  ): Promise<BridgeOperation> {
    // 1. Generate lock PSBT
    const psbt = await this.bridge.generateLockPSBT({
      amount,
      destinationChain,
      destinationAddress,
      changeAddress: await this.wallet.getChangeAddress()
    });

    // 2. Sign PSBT with wallet
    const signedPsbt = await this.wallet.signPSBT(psbt);

    // 3. Broadcast to Bitcoin network
    const txid = await this.bitcoinClient.broadcast(signedPsbt);

    // 4. Monitor bridge operation
    const operation = await this.bridge.trackOperation(txid);

    return operation;
  }

  async withdraw(
    amount: number,
    destinationAddress: string, // Bitcoin address
    sourceChain: 'ethereum' | 'cardano' | 'solana'
  ): Promise<BridgeOperation> {
    // 1. Initiate burn on source chain (via Web3)
    const burnTxHash = await this.web3Client.burnWrappedBTC(amount);

    // 2. Generate zk-proof of burn
    const proof = await this.bridge.generateBurnProof(burnTxHash);

    // 3. Submit proof to Bitcoin
    const unlockTx = await this.bridge.submitUnlockTransaction({
      proof,
      destinationAddress,
      amount
    });

    return this.bridge.trackOperation(unlockTx);
  }

  async trackOperation(operationId: string): Promise<BridgeStatus> {
    return await this.bridge.getStatus(operationId);
  }
}
```

**Bridge Operation State Machine**:

```
DEPOSIT (BTC → ETH):
1. INITIATED → User confirms deposit
2. LOCKING → Bitcoin transaction broadcast
3. CONFIRMING → Waiting for confirmations (6 blocks)
4. PROVING → Generating zk-proof
5. VERIFYING → Proof submitted to Ethereum
6. MINTING → Wrapped BTC being minted
7. COMPLETED → Funds available on Ethereum

WITHDRAWAL (ETH → BTC):
1. INITIATED → User confirms withdrawal
2. BURNING → Wrapped BTC burn transaction
3. PROOF_GEN → Generating burn proof
4. VERIFYING → Proof submitted to Bitcoin
5. UNLOCKING → Bitcoin release transaction
6. CONFIRMING → Waiting for Bitcoin confirmations
7. COMPLETED → BTC received
```

### Storage Schema

**Bridge Operations Storage**:

```typescript
interface BridgeOperation {
  id: string; // Unique operation ID
  type: 'deposit' | 'withdrawal';
  status: BridgeStatus;
  sourceChain: string; // 'bitcoin', 'ethereum', etc.
  destinationChain: string;
  amount: number;
  sourceAddress: string;
  destinationAddress: string;
  sourceTxHash: string;
  destinationTxHash?: string;
  proof?: string; // zk-proof data
  createdAt: number;
  updatedAt: number;
  estimatedCompletion?: number;
  error?: string;
}

// Store in chrome.storage.local
await chrome.storage.local.set({
  bridgeOperations: {
    [operationId]: operation
  }
});
```

## Wallet Features

### Feature 1: Cross-Chain Send

**User Story**:
> "As a user, I want to send my Bitcoin to Ethereum so I can use DeFi protocols."

**Requirements**:
- Support BTC → ETH, BTC → SOL, BTC → ADA
- Clear fee breakdown (bridge fee + network fees)
- Estimated time display
- Destination address validation
- Minimum/maximum amount limits
- Educational content for first-time users

**Edge Cases**:
- Insufficient balance for amount + fees
- Invalid destination address format
- Bridge maintenance or downtime
- Transaction stuck/delayed
- Orphaned transactions (lock without mint)

### Feature 2: Cross-Chain Activity Tracking

**User Story**:
> "As a user, I want to see the status of my cross-chain transfers in real-time."

**Requirements**:
- Real-time status updates
- Step-by-step progress visualization
- Transaction hashes for both chains
- Estimated completion time
- Support contact if stuck
- Notification on completion

**Display Information**:
- Operation ID
- Source and destination chains
- Amount and fees
- Current step (locking, proving, minting, etc.)
- Confirmations count
- Links to block explorers (both chains)

### Feature 3: Multi-Chain Balance View

**User Story**:
> "As a user, I want to see my Bitcoin balance across all connected chains."

**Dashboard Enhancement**:
```
┌─────────────────────────────────────┐
│ Total Bitcoin Holdings              │
├─────────────────────────────────────┤
│ Native BTC:         2.45 BTC        │
│ Wrapped BTC (ETH):  0.50 WBTC       │
│ Wrapped BTC (SOL):  0.10 WBTC       │
│ ────────────────────────────────    │
│ Total:              3.05 BTC        │
│                                     │
│ [Bridge Between Chains]             │
└─────────────────────────────────────┘
```

## Security Considerations

### Threat Model

**Potential Attack Vectors**:

1. **Bridge Operator Malfunction**
   - Risk: Bridge fails to mint after lock
   - Mitigation: Multi-operator redundancy
   - Mitigation: Emergency withdrawal mechanism
   - Mitigation: Insurance fund for stuck transactions

2. **Proof Manipulation**
   - Risk: Fake proof accepted, double-spend
   - Mitigation: BitSNARK cryptographic verification
   - Mitigation: Multiple independent verifiers
   - Mitigation: Audit all proof circuits

3. **Chain Reorganization**
   - Risk: Bitcoin reorg invalidates lock
   - Mitigation: Wait for deep confirmations (6+ blocks)
   - Mitigation: Monitor for reorgs, reverse mint if needed

4. **Smart Contract Bugs**
   - Risk: Ethereum contract vulnerability
   - Mitigation: Extensive audits before mainnet
   - Mitigation: Gradual rollout with amount limits
   - Mitigation: Emergency pause mechanism

5. **Man-in-the-Middle**
   - Risk: User sent to wrong destination address
   - Mitigation: Address validation and confirmation
   - Mitigation: Copy-paste attack detection
   - Mitigation: Clear address display with checksum

### Security Requirements

**MANDATORY Before Mainnet**:
- [ ] Third-party security audit of all bridge contracts
- [ ] BitSNARK proof circuit audit
- [ ] Testnet validation with 1000+ bridge operations
- [ ] Stress testing with large amounts
- [ ] Chain reorganization scenario testing
- [ ] Emergency response procedures documented
- [ ] Insurance fund or safety net established
- [ ] Multi-signature controls for critical operations
- [ ] Real-time monitoring and alerting
- [ ] User education on bridge risks

## Performance & Economics

### Bridge Performance

**Deposit (BTC → ETH)**:
- Bitcoin lock: ~10 minutes (1 block + confirmations)
- Proof generation: ~30-60 seconds
- Ethereum verification: ~15 seconds
- Total time: **~30-45 minutes** (6 confirmations)

**Withdrawal (ETH → BTC)**:
- Ethereum burn: ~15 seconds
- Proof generation: ~30-60 seconds
- Bitcoin unlock: ~10 minutes
- Total time: **~15-20 minutes** (fewer BTC confirmations needed)

### Fee Structure

**Bridge Fees** (estimated):
- Protocol fee: 0.1% of bridged amount
- Bitcoin network fee: Standard BTC transaction
- Destination chain fee: ETH gas or equivalent
- Total cost: ~0.15% + network fees

**Example**:
```
Bridging 1.0 BTC to Ethereum:
- Amount: 1.0 BTC
- Protocol fee: 0.001 BTC (0.1%)
- Bitcoin fee: 0.0002 BTC
- Ethereum gas: ~0.0001 BTC equivalent
- You receive: ~0.9987 WBTC
```

### Limits

**Initial Mainnet Limits** (likely):
- Minimum: 0.001 BTC per transaction
- Maximum: 10 BTC per transaction (early days)
- Daily limit: 100 BTC total volume
- Gradual increase as security confidence grows

## Implementation Roadmap

### Phase 1: Testnet Integration (Q1 2025)
- [ ] Integrate Grail Bridge SDK (testnet)
- [ ] Implement deposit flow (BTC → ETH testnet)
- [ ] Build bridge status tracker
- [ ] Testnet user testing
- [ ] Iterate on UX based on feedback

### Phase 2: Mainnet Preparation (Q2 2025)
- [ ] Security audit of integration
- [ ] Mainnet SDK integration
- [ ] Production monitoring setup
- [ ] User education materials
- [ ] Support process for stuck transactions

### Phase 3: Mainnet Launch (Q2 2025)
- [ ] Limited beta (small amounts only)
- [ ] Gradual limit increases
- [ ] Monitor all operations closely
- [ ] Expand to more chains (Cardano, Solana)

### Phase 4: Advanced Features (Q3+ 2025)
- [ ] Withdrawal flow (ETH → BTC)
- [ ] Multi-hop bridging (BTC → ETH → SOL)
- [ ] Liquidity optimization
- [ ] Cross-chain swaps (BTC → ETH in one step)

## Known Limitations

**Current Limitations** (as of Oct 2025):
- Mainnet not yet launched (Q2 2025 target)
- Limited to testnet operations currently
- Slow bridging times (~30-45 minutes)
- High fees during congestion
- Limited chain support initially (Ethereum first)

**UX Challenges**:
- Cross-chain concepts complex for users
- Managing addresses on multiple chains
- Explaining bridge security model
- Handling stuck transactions gracefully
- Tracking operations across chains

## Future Enhancements

**Potential Future Features**:
- Instant bridging with liquidity pools
- Cross-chain atomic swaps
- Aggregated DEX trading (best price across chains)
- Lightning Network integration for fast bridges
- Privacy-preserving cross-chain transfers

## Resources

- **Grail Bridge Testnet Announcement**: Feb 2025
- **Expected Mainnet Launch**: Q2 2025
- **Supported Chains (Initial)**: Ethereum
- **Supported Chains (Planned)**: Cardano, Solana, BSC, Polygon
- **Technical Docs**: https://docs.bitcoinos.build/
- **GitHub**: https://github.com/bitcoinOS/bitcoinOS

## Cross-References

- **BitSNARK Protocol**: See [bitsnark.md](bitsnark.md)
- **Security Analysis**: See [security.md](security.md)
- **Integration Guide**: See [integration-guide.md](integration-guide.md)
- **Feature Roadmap**: See [roadmap.md](roadmap.md)

---

**Status**: Testnet ready, mainnet Q2 2025. Recommend planning integration now, but wait for mainnet launch before production deployment.
