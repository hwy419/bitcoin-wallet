# BitcoinOS Integration Guide

**Last Updated**: 2025-10-26
**Audience**: Developers implementing BitcoinOS features
**Prerequisites**: Familiarity with Bitcoin wallet architecture, React, TypeScript, Chrome extensions

## Overview

This guide provides step-by-step instructions for integrating BitcoinOS technologies into the Bitcoin Wallet Chrome Extension. Start here when beginning implementation work.

## Prerequisites

### Knowledge Requirements

**Before starting, you should understand**:
- Bitcoin UTXO model and transaction structure
- Chrome Extension Manifest V3 architecture
- React + TypeScript development
- Async/await patterns and Promises
- Web Workers for background computation
- Basic cryptography concepts (hashing, signatures)

**BitcoinOS-Specific Knowledge**:
- Read [bitsnark.md](bitsnark.md) - Understand zk-SNARKs
- Read [grail-bridge.md](grail-bridge.md) - Understand cross-chain bridging
- Read [architecture.md](architecture.md) - Understand integration architecture

### Development Environment

**Tools Needed**:
- Node.js v20.17.0 (specific version required by BitSNARK)
- Python 3.12
- libsecp256k1-1
- Docker 26+
- npm (latest)
- Git
- Chrome browser (Developer mode)

**BitSNARK Library Setup**:
```bash
# Clone official BitSNARK library
git clone https://github.com/bitsnark/bitsnark-lib.git
cd bitsnark-lib

# Install dependencies
npm install

# Run demo to verify setup (takes ~15 minutes)
npm run e2e
```

**For Wallet Integration** (exploration phase):
```bash
# Study the repository structure
cd bitsnark-lib

# Key directories to examine:
# - python/bitsnark/core/  → Python implementation
# - src/agent/             → TypeScript agents
# - db/                    → Database schema
# - specs/                 → TLA+ specifications and diagrams
# - tests/                 → Test suites
```

**Note**: The BitSNARK library is currently a prover-verifier demo. Direct wallet integration will require:
1. Understanding the protocol flow (study `specs/` directory)
2. Adapting the prover or verifier role for wallet use case
3. Possibly porting Python logic to TypeScript for Chrome extension
4. Handling the 15-minute execution time in UX

## ⚠️ Critical Assessment: BitSNARK Library Readiness

**IMPORTANT**: After reviewing the official BitSNARK library repository (https://github.com/bitsnark/bitsnark-lib), we've identified critical considerations for wallet integration:

### Current State Analysis

**What the Library Provides**:
- ✅ Prover-verifier protocol implementation
- ✅ Transaction template system for Bitcoin
- ✅ Python and TypeScript components
- ✅ Working demo on Bitcoin regtest
- ✅ Formal verification (TLA+ specs)
- ✅ Multi-verifier support (in progress)

**What the Library Does NOT Provide**:
- ❌ Ready-to-use npm package for wallet integration
- ❌ Simple API for privacy transactions
- ❌ Fast proof generation (takes 15+ minutes)
- ❌ Standalone privacy features (requires verifier coordination)
- ❌ Production-ready mainnet deployment

### Integration Feasibility Assessment

**For "Private Send" Feature** (originally envisioned):
- **Expected**: 10-30 second proof generation, submit to Bitcoin, privacy achieved
- **Reality**: 15-minute multi-stage protocol requiring prover-verifier coordination
- **Verdict**: ⚠️ NOT SUITABLE for real-time wallet privacy transactions

**Why the Mismatch**:
The BitSNARK library implements a **proof verification protocol** (verifier challenges prover's claims), not a **proof generation library** for privacy transactions. It's designed for:
- Cross-chain bridges (prove event happened on one chain to another)
- Conditional payments (prove conditions met before release)
- Verifiable computation (prove program executed correctly)

NOT for:
- Quick privacy transactions (too slow)
- Standalone wallet features (requires counterparty)

### Realistic Use Cases for Our Wallet

**✅ FEASIBLE: Cross-Chain Bridge Integration**
- Use BitSNARK to prove Bitcoin lock for bridge to Ethereum
- 15-minute execution acceptable for bridge operations
- Aligns with library's design (conditional BTC transfers)
- Requires integration with Grail Bridge or similar

**Example Flow**:
```
User wants to bridge 1 BTC to Ethereum
    ↓
Wallet acts as Prover, Bridge operator acts as Verifier
    ↓
Setup phase: Agree on program (prove BTC locked)
    ↓
Execution phase: Prove BTC lock with BitSNARK (~15 min)
    ↓
Verifier validates proof, mints wrapped BTC on Ethereum
    ↓
Complete
```

**❌ NOT FEASIBLE: Standalone Privacy Transactions**
- Too slow for user experience (15+ minutes)
- Requires finding verifier for each transaction
- Not designed for this use case

**🔵 FUTURE: Verifiable Computation Features**
- Prove smart contract execution on Bitcoin
- Conditional payments with complex logic
- Requires mature multi-verifier network

### Revised Recommendations

**Immediate Actions** (Q4 2025):
1. **Study the library**: Clone repo, run demo, understand protocol
2. **Focus on bridge use case**: BitSNARK for cross-chain bridges makes sense
3. **Wait for ecosystem maturity**: Monitor BitSNARK development for wallet-friendly features

**Do NOT Pursue** (at this time):
1. Quick privacy transactions using BitSNARK (architecture mismatch)
2. Standalone wallet privacy features (wrong tool)
3. Production integration (library is demo stage)

**Alternative for Privacy Features**:
- Consider simpler Bitcoin privacy techniques (CoinJoin, PayJoin)
- Wait for future BitcoinOS developments specifically for wallet privacy
- Use BitSNARK for what it's designed for (verifiable cross-chain operations)

### Updated Integration Timeline

**2025 Q4**: Research phase
- Study BitSNARK library thoroughly
- Understand protocol mechanics
- Prototype bridge integration concept

**2026 Q1-Q2**: Testnet experimentation
- Implement bridge proof generation
- Test with simulated verifier
- Evaluate UX with 15-minute flow

**2026 Q3+**: Production consideration
- Integrate with mature Grail Bridge
- Deploy cross-chain features
- Monitor for wallet-specific BitSNARK developments

## Phase 1: BitSNARK Exploration (REVISED)

### Step 1.1: Study BitSNARK Library

**Research Phase** (Current):
```bash
# TODO: Confirm actual package names when available
# Check https://docs.bitcoinos.build/ for official installation

# Expected:
npm install @bitcoinos/bitsnark
```

**Verify Installation**:
```typescript
import { BitSNARK } from '@bitcoinos/bitsnark';

console.log('BitSNARK version:', BitSNARK.version);
```

### Step 1.2: Create Proof Generation Module

**File**: `src/background/bitcoinos/BitSNARKClient.ts`

```typescript
import { BitSNARK } from '@bitcoinos/bitsnark';
import type { UTXO, TransactionInputs } from '@/shared/types';

export interface ProofGenerationOptions {
  inputs: TransactionInputs;
  privacyLevel: 'full' | 'partial' | 'none';
  circuit: string;
}

export interface ZKProof {
  proof: string; // Serialized proof
  publicInputs: any[];
  proofSystem: 'groth16' | 'plonk';
}

export class BitSNARKClient {
  private bitsnark: BitSNARK;

  constructor() {
    this.bitsnark = new BitSNARK({
      network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    });
  }

  /**
   * Generate zk-SNARK proof for privacy transaction
   */
  async generateProof(
    options: ProofGenerationOptions
  ): Promise<ZKProof> {
    const { inputs, privacyLevel, circuit } = options;

    // Validate inputs
    this.validateInputs(inputs);

    // Select appropriate circuit
    const circuitName = this.getCircuit(privacyLevel);

    // Generate proof (this takes 10-60 seconds)
    const proof = await this.bitsnark.generateProof({
      circuit: circuitName,
      inputs: {
        utxos: inputs.utxos,
        recipients: inputs.recipients,
        changeAddress: inputs.changeAddress
      }
    });

    return {
      proof: proof.serialize(),
      publicInputs: proof.publicInputs,
      proofSystem: 'groth16'
    };
  }

  /**
   * Verify proof locally before broadcasting
   */
  async verifyProof(proof: ZKProof): Promise<boolean> {
    return await this.bitsnark.verifyProof(proof);
  }

  private validateInputs(inputs: TransactionInputs): void {
    if (!inputs.utxos || inputs.utxos.length === 0) {
      throw new Error('No UTXOs provided');
    }

    if (!inputs.recipients || inputs.recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    // Additional validation...
  }

  private getCircuit(privacyLevel: string): string {
    switch (privacyLevel) {
      case 'full':
        return 'bitcoin-full-privacy-v1';
      case 'partial':
        return 'bitcoin-amount-privacy-v1';
      default:
        throw new Error(`Unknown privacy level: ${privacyLevel}`);
    }
  }
}
```

### Step 1.3: Create Proof Generation Worker

**File**: `src/background/bitcoinos/ProofWorker.ts`

```typescript
/**
 * Web Worker for CPU-intensive proof generation
 * Runs in separate thread to avoid blocking main service worker
 */

import { BitSNARKClient } from './BitSNARKClient';

const client = new BitSNARKClient();

// Listen for proof generation requests
self.addEventListener('message', async (event) => {
  const { type, id, payload } = event.data;

  if (type === 'GENERATE_PROOF') {
    try {
      // Report progress (if supported by SDK)
      self.postMessage({ type: 'PROGRESS', id, progress: 0 });

      const proof = await client.generateProof(payload);

      self.postMessage({ type: 'PROGRESS', id, progress: 100 });
      self.postMessage({ type: 'COMPLETE', id, proof });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        id,
        error: error.message
      });
    }
  } else if (type === 'VERIFY_PROOF') {
    try {
      const isValid = await client.verifyProof(payload.proof);
      self.postMessage({ type: 'COMPLETE', id, isValid });
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        id,
        error: error.message
      });
    }
  }
});
```

### Step 1.4: Add Message Handlers

**File**: `src/background/messageHandlers.ts`

```typescript
// Add new message types
export enum MessageType {
  // ... existing types
  GENERATE_ZK_PROOF = 'GENERATE_ZK_PROOF',
  GET_PROOF_STATUS = 'GET_PROOF_STATUS',
  SEND_PRIVATE_TRANSACTION = 'SEND_PRIVATE_TRANSACTION',
}

// Add handler
async function handleGenerateZKProof(
  payload: any,
  sendResponse: (response: any) => void
) {
  try {
    // Spawn worker for proof generation
    const worker = new Worker('./bitcoinos/ProofWorker.js');

    const proofId = generateId();

    worker.postMessage({
      type: 'GENERATE_PROOF',
      id: proofId,
      payload: {
        inputs: payload.inputs,
        privacyLevel: payload.privacyLevel || 'partial',
        circuit: 'bitcoin-amount-privacy-v1'
      }
    });

    // Track progress
    worker.onmessage = (event) => {
      const { type, id, progress, proof, error } = event.data;

      if (type === 'PROGRESS') {
        // Store progress in chrome.storage for UI to query
        updateProofProgress(id, progress);
      } else if (type === 'COMPLETE') {
        // Cache proof
        cacheProof(id, proof);

        sendResponse({
          success: true,
          proofId: id,
          proof
        });

        worker.terminate();
      } else if (type === 'ERROR') {
        sendResponse({
          success: false,
          error
        });

        worker.terminate();
      }
    };

    // Return immediately, use async response
    return true; // Keep message channel open
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}
```

### Step 1.5: Frontend UI Component

**File**: `src/tab/components/BitcoinOS/PrivacySendModal.tsx`

```typescript
import React, { useState } from 'react';
import { Modal } from '../shared/Modal';

interface PrivacySendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (privacyLevel: 'partial' | 'full') => void;
}

export const PrivacySendModal: React.FC<PrivacySendModalProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [privacyLevel, setPrivacyLevel] = useState<'partial' | 'full'>('partial');
  const [understood, setUnderstood] = useState(false);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Private Send">
      <div className="space-y-4">
        {/* Educational content */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h4 className="font-semibold text-blue-900">About Privacy Mode</h4>
          <p className="text-sm text-blue-800 mt-2">
            Privacy mode uses zero-knowledge proofs (zk-SNARKs) to hide transaction
            details on the blockchain while proving the transaction is valid.
          </p>
        </div>

        {/* Privacy level selector */}
        <div className="space-y-2">
          <label className="block font-medium">Privacy Level:</label>

          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={privacyLevel === 'partial'}
                onChange={() => setPrivacyLevel('partial')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Partial Privacy (Recommended)</div>
                <div className="text-sm text-gray-600">
                  Hides transaction amount only
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                checked={privacyLevel === 'full'}
                onChange={() => setPrivacyLevel('full')}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Full Privacy</div>
                <div className="text-sm text-gray-600">
                  Hides amount, sender, and receiver (Coming Soon)
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Time warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-yellow-800">
            ⏱️ Generating privacy proof takes 15-30 seconds. You'll see a progress
            indicator.
          </p>
        </div>

        {/* Confirmation checkbox */}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => setUnderstood(e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm">
            I understand this transaction will use privacy features
          </span>
        </label>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(privacyLevel)}
            disabled={!understood}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue with Privacy
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

### Step 1.6: Testing Checklist

**Unit Tests**:
- [ ] `BitSNARKClient.generateProof()` with valid inputs
- [ ] `BitSNARKClient.verifyProof()` with valid proof
- [ ] Error handling for invalid inputs
- [ ] Worker spawning and termination
- [ ] Progress tracking

**Integration Tests**:
- [ ] End-to-end privacy transaction flow
- [ ] Proof generation on testnet
- [ ] Proof verification on-chain
- [ ] Transaction confirmation

**Manual Testing (Testnet)**:
- [ ] Generate proof and verify locally
- [ ] Broadcast privacy transaction
- [ ] Confirm on Blockstream explorer
- [ ] Verify amount is hidden
- [ ] Test cancellation during proof generation
- [ ] Test multiple privacy transactions

## Phase 2: Grail Bridge Integration

### Step 2.1: Install Grail Bridge SDK

```bash
# TODO: Confirm actual installation
npm install @bitcoinos/grail-bridge
```

### Step 2.2: Create Bridge Client Module

**File**: `src/background/bitcoinos/GrailBridgeClient.ts`

```typescript
// See grail-bridge.md for detailed implementation examples
import { GrailBridge } from '@bitcoinos/grail-bridge';

export class GrailBridgeClient {
  private bridge: GrailBridge;

  constructor() {
    this.bridge = new GrailBridge({
      network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet'
    });
  }

  async deposit(
    amount: number,
    destinationChain: 'ethereum' | 'solana' | 'cardano',
    destinationAddress: string
  ): Promise<BridgeOperation> {
    // Implementation...
  }

  async withdraw(/* ... */): Promise<BridgeOperation> {
    // Implementation...
  }

  async trackOperation(operationId: string): Promise<BridgeStatus> {
    // Implementation...
  }
}
```

### Step 2.3: Add Storage for Bridge Operations

```typescript
interface BridgeStorage {
  operations: {
    [operationId: string]: BridgeOperation;
  };
}

// Save operation
await chrome.storage.local.set({
  bridgeOperations: {
    ...existing,
    [operationId]: operation
  }
});
```

### Step 2.4: Build Bridge UI

**File**: `src/tab/components/BitcoinOS/CrossChainBridgeModal.tsx`

```typescript
// See grail-bridge.md for UI wireframes and implementation
export const CrossChainBridgeModal: React.FC = (/* ... */) => {
  // Implementation...
};
```

### Step 2.5: Testing Checklist (Bridge)

**Testnet Testing**:
- [ ] Initiate deposit (BTC → ETH)
- [ ] Monitor status through all stages
- [ ] Confirm wrapped BTC received on Ethereum
- [ ] Initiate withdrawal (ETH → BTC)
- [ ] Confirm native BTC received
- [ ] Test error scenarios (insufficient balance, invalid address)
- [ ] Test stuck transaction handling

## Common Issues & Solutions

### Issue 1: Proof Generation Timeout

**Problem**: Proof generation takes too long (>60 seconds)

**Solutions**:
- Check user's device CPU capability
- Use lighter circuit variant
- Batch operations instead of individual proofs
- Show clear progress indicator
- Allow cancellation

### Issue 2: Worker Communication Errors

**Problem**: Web Worker not receiving/sending messages

**Solutions**:
- Verify worker file path is correct
- Check worker is registered in manifest.json
- Use structured cloning for message data
- Add error handling for worker termination

### Issue 3: WASM Module Not Loading

**Problem**: BitcoinOS SDK uses WASM, not loading correctly

**Solutions**:
- Check Content-Security-Policy in manifest.json
- Verify WASM file included in build
- Check for CORS issues
- Use webpack configuration for WASM loading

## Performance Optimization

**Best Practices**:
- Cache generated proofs (with proper invalidation)
- Use Web Workers for all intensive computation
- Batch multiple operations when possible
- Show progress indicators for long operations
- Implement cancellation for user comfort

## Security Checklist

Before production deployment:
- [ ] Security expert reviewed all cryptographic code
- [ ] Blockchain expert validated Bitcoin integration
- [ ] No private keys logged anywhere
- [ ] Proof inputs sanitized
- [ ] Rate limiting on proof generation
- [ ] Error messages don't leak sensitive data
- [ ] HTTPS for all API calls
- [ ] Input validation on all user inputs
- [ ] Memory cleared after proof generation

## Resources

- **BitcoinOS Docs**: https://docs.bitcoinos.build/
- **GitHub**: https://github.com/bitcoinOS/bitcoinOS
- **Support**: [TBD - BitcoinOS support channel]
- **Internal Docs**:
  - [bitsnark.md](bitsnark.md)
  - [grail-bridge.md](grail-bridge.md)
  - [architecture.md](architecture.md)
  - [security.md](security.md)

## Next Steps

1. ✅ Read this integration guide
2. Set up development environment
3. Install BitcoinOS SDK (when available)
4. Start with Phase 1 (BitSNARK)
5. Build proof-of-concept on testnet
6. Iterate based on testing
7. Security review
8. Mainnet deployment

---

**Status**: Ready for implementation when BitcoinOS SDK is available.
