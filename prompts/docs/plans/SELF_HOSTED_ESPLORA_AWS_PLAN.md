# Self-Hosted Esplora Node on AWS - Infrastructure as Code Plan

**Status**: 📋 Planning (Future Scaling Option)
**Target Implementation**: When Lambda Proxy Reaches Limits (See Decision Criteria)
**Last Updated**: 2025-10-28
**Estimated Cost**: $50-200/month depending on configuration
**Implementation Time**: 4-5 days + sync time
**Prerequisites**: Lambda API Proxy already deployed (see `BLOCKSTREAM_API_PROXY_PLAN.md`)

---

## Executive Summary

### Architecture Evolution Path

The Bitcoin Wallet Chrome Extension uses a **three-phase architecture evolution**:

**Phase 1: AWS Lambda Proxy (CURRENT - PRIMARY APPROACH)**
- Lambda proxy secures Blockstream API key
- Uses Blockstream paid credits
- Cost: ~$5-10/month
- See: `BLOCKSTREAM_API_PROXY_PLAN.md`
- **Status**: ✅ Ready to implement (6-8 hours)

**Phase 2: Self-Hosted Esplora (THIS DOCUMENT - FUTURE)**
- Self-host full Bitcoin node + indexer
- No Blockstream API dependency
- Cost: ~$50-200/month
- **Status**: 📋 Planning for future scaling

**Phase 3: Hybrid Approach (OPTIONAL)**
- Primary: Self-hosted Esplora
- Fallback: Lambda → Blockstream API
- Best of both worlds

### Why Lambda Proxy First?

**Current Production Strategy: AWS Lambda Proxy**

For production launch and early growth, the Lambda proxy (Phase 1) is the optimal choice:

**✅ Benefits of Lambda Proxy:**
- **Security**: API key completely protected on backend
- **Cost**: ~$5-10/month (vs $50-200/month for self-hosted)
- **Speed**: 6-8 hours to implement (vs 4-5 days for self-hosted)
- **Maintenance**: Zero (serverless) vs ongoing (EC2, Docker, Bitcoin Core)
- **Scalability**: Auto-scales to 1000 concurrent requests
- **Risk**: Low (minimal infrastructure)

**❌ Limitations of Lambda Proxy:**
- Still dependent on Blockstream API availability
- Still costs Blockstream credits (per-request pricing)
- Limited customization options
- Can't add custom endpoints

**Decision**: Lambda proxy is perfect for **current scale** (0-1M requests/month).

### Why Self-Host Later?

Self-hosting becomes attractive when you hit Lambda proxy limitations:

**Benefits of Self-Hosted Esplora:**
- ✅ **Complete control** over API availability and performance
- ✅ **No rate limits** whatsoever - unlimited requests
- ✅ **Lower latency** for users in specific regions (can deploy multi-region)
- ✅ **Cost effective at scale** (fixed infrastructure vs per-request Blockstream credits)
- ✅ **Privacy** - no third-party sees your users' addresses
- ✅ **Custom features** - add endpoints, caching, analytics
- ✅ **Independence** - not affected by Blockstream API downtime
- ✅ **No per-request costs** - fixed monthly cost regardless of usage

**Drawbacks vs Lambda Proxy:**
- ❌ **Higher cost** ($50-200/month vs $5-10/month)
- ❌ **Slower to implement** (4-5 days vs 6-8 hours)
- ❌ **Maintenance required** (server updates, Bitcoin Core upgrades, monitoring)
- ❌ **Initial sync time** (6-48 hours depending on network)
- ❌ **More complex** (3 Docker services vs 1 Lambda function)

**When to Implement:**
- **Trigger 1**: Blockstream API credits exceed $100-200/month
- **Trigger 2**: Request volume exceeds 1-2 million/month consistently
- **Trigger 3**: Need sub-100ms latency (Blockstream adds ~150ms overhead)
- **Trigger 4**: Privacy becomes critical competitive advantage
- **Trigger 5**: Need custom features (analytics, caching, custom endpoints)

### Updated Cost Comparison

| Scenario | Blockstream Credits | Lambda Proxy | Self-Hosted | Recommendation |
|----------|---------------------|--------------|-------------|----------------|
| Development (<10k req/month) | $0-10 | $0-1 (free tier) | $50 | **Lambda Proxy** |
| Early Production (100k req/month) | $50 | $5-10 | $50 | **Lambda Proxy** |
| Growth (500k req/month) | $150 | $20-30 | $100 | **Lambda Proxy** |
| Scale (1-2M req/month) | $200-400 | $40-80 | $100-150 | **Break-even - Consider self-host** |
| High Scale (5M+ req/month) | $800+ | $200+ | $150-200 | **Self-Host** |

**Updated Decision Rule**:
1. **NOW**: Deploy Lambda proxy (secure, cheap, quick) ← **START HERE**
2. **Later**: Self-host when Lambda proxy + Blockstream credits exceed $150/month
3. **Optional**: Keep Lambda proxy as fallback even after self-hosting

---

## Current State vs Future State

### Phase 1: Lambda Proxy Architecture (CURRENT/NEXT)

```
┌──────────────────────────┐
│  Bitcoin Wallet Extension│
│  (Chrome/Edge)           │
│  No API keys stored      │
└────────┬─────────────────┘
         │ HTTPS
         │ https://api.yourdomain.com/blockstream/*
         │
┌────────▼─────────────────┐
│   AWS Lambda Proxy       │
│   API Gateway            │
│   • Has API key (secure) │
│   • Forwards to Blockstream│
└────────┬─────────────────┘
         │ HTTPS + API Key
         │
┌────────▼─────────────────┐
│  Blockstream Public API  │
│  https://blockstream.info│
│  (Your Paid Credits)     │
└──────────────────────────┘
```

**Characteristics:**
- ✅ API key secured on backend (not in extension)
- ✅ Simple integration (~6-8 hours)
- ✅ Low cost (~$5-10/month + Blockstream credits)
- ✅ Auto-scales with usage
- ✅ No infrastructure maintenance
- ❌ Still uses Blockstream API (per-request costs)
- ❌ Dependent on Blockstream availability
- ❌ Third party still sees queries (but not your API key)

**Implementation**: See `BLOCKSTREAM_API_PROXY_PLAN.md`

### Phase 2: Self-Hosted Architecture (FUTURE)

```
┌──────────────────────────┐         ┌─────────────────────────┐
│  Bitcoin Wallet Extension│────────▶│  Custom Domain          │
│  (Chrome/Edge)           │  HTTPS  │  esplora.yourdomain.com │
└──────────────────────────┘         └──────────┬──────────────┘
                                                 │
                            ┌────────────────────▼────────────────────┐
                            │         AWS Infrastructure              │
                            │  ┌──────────────────────────────────┐  │
                            │  │  Application Load Balancer       │  │
                            │  │  (Optional - HTTPS termination)  │  │
                            │  └────────────┬─────────────────────┘  │
                            │               │                         │
                            │  ┌────────────▼─────────────────────┐  │
                            │  │   EC2 Instance (t3a.large)       │  │
                            │  │   Docker Compose Stack:          │  │
                            │  │   • bitcoind (Bitcoin Core)      │  │
                            │  │   • electrs (Indexer)            │  │
                            │  │   • esplora (API + Web UI)       │  │
                            │  └────────────┬─────────────────────┘  │
                            │               │                         │
                            │  ┌────────────▼─────────────────────┐  │
                            │  │   EBS gp3 Volume (200GB-1TB)     │  │
                            │  │   Blockchain + Index Storage     │  │
                            │  └──────────────────────────────────┘  │
                            │                                         │
                            │  ┌──────────────────────────────────┐  │
                            │  │   CloudWatch + SNS Alerting      │  │
                            │  │   Lambda Health Checker          │  │
                            │  └──────────────────────────────────┘  │
                            └─────────────────────────────────────────┘
```

**Characteristics:**
- Full control over infrastructure
- Fixed monthly cost regardless of request volume
- No rate limits
- Custom domain and HTTPS
- Private (no third party)
- Requires DevOps maintenance

---

## Architecture Design

### Network Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          AWS Region                             │
│                         (us-east-1)                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                        VPC                                 │ │
│  │                   10.0.0.0/16                              │ │
│  │                                                            │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │              Public Subnet                           │ │ │
│  │  │           10.0.1.0/24 (us-east-1a)                   │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌────────────────────────────────────────────────┐  │ │ │
│  │  │  │       EC2 Instance (Esplora Node)              │  │ │ │
│  │  │  │  • Public IP: Elastic IP (static)              │  │ │ │
│  │  │  │  • Security Group: esplora-sg                  │  │ │ │
│  │  │  │    - Port 3000 (HTTP API)                      │  │ │ │
│  │  │  │    - Port 22 (SSH) from admin IP only          │  │ │ │
│  │  │  │  • IAM Role: CloudWatch logs + metrics         │  │ │ │
│  │  │  └────────────────────────────────────────────────┘  │ │ │
│  │  │                                                       │ │ │
│  │  └───────────────────────────────────────────────────────┘ │ │
│  │                                                            │ │
│  │  Internet Gateway                                          │ │
│  │          │                                                 │ │
│  └──────────┼─────────────────────────────────────────────────┘ │
│             │                                                   │
└─────────────┼───────────────────────────────────────────────────┘
              │
      ┌───────▼────────┐
      │   Internet     │
      │   (Public)     │
      └────────────────┘
```

**Key Components:**
- **VPC**: Isolated network (10.0.0.0/16)
- **Public Subnet**: Single subnet in us-east-1a (cost optimization)
- **Internet Gateway**: Public internet access
- **Security Group**: Firewall rules
- **Elastic IP**: Static IP address for DNS

### Security Group Rules

**Inbound:**
- Port 3000 (HTTP): 0.0.0.0/0 (public API access)
- Port 22 (SSH): YOUR_ADMIN_IP/32 (restricted admin access)

**Outbound:**
- All traffic: 0.0.0.0/0 (Bitcoin P2P, package updates)

### Compute Resources

**Instance Type: t3a.large**
- **vCPU**: 2 cores
- **Memory**: 8 GB RAM
- **Network**: Up to 5 Gbps
- **EBS Optimized**: Yes
- **Cost**: ~$0.0752/hour on-demand (~$55/month)

**Spot Instance Optimization:**
- **Cost**: ~$0.0226/hour average (~$16/month) - 70% savings
- **Interruption Risk**: Low for t3a.large
- **Behavior**: Terminate on interruption, restart automatically
- **Max Price**: $0.05/hour (66% of on-demand)

**Why t3a.large?**
- Sufficient CPU for transaction indexing
- 8GB RAM handles electrs memory requirements
- AMD EPYC processors (lower cost than Intel t3)
- Burstable performance suitable for API workload
- Can upgrade to t3a.xlarge (16GB RAM) if needed

### Storage Architecture

**EBS Volume Specifications:**

| Network | Blockchain Size | Index Size | Total | Volume Size | Cost/Month |
|---------|----------------|------------|-------|-------------|------------|
| **Testnet** | ~50 GB | ~100 GB | ~150 GB | 200 GB | ~$16 |
| **Mainnet** | ~800 GB | ~600 GB | ~1400 GB | 1600 GB | ~$128 |

**EBS gp3 Configuration:**
- **Type**: gp3 (General Purpose SSD)
- **IOPS**: 3000 (baseline, can burst to 16000)
- **Throughput**: 125 MB/s (can increase to 1000 MB/s)
- **Cost**: $0.08/GB-month

**Why gp3?**
- 20% cheaper than gp2
- Predictable performance (no burst credits)
- Sufficient IOPS for blockchain sync and queries
- Can scale IOPS independently of size

### Docker Compose Stack

**Services:**

1. **bitcoind** (Bitcoin Core)
   - Image: `btcpayserver/bitcoin:27.0`
   - Function: Full Bitcoin node
   - Config: `txindex=1`, `server=1`, `rest=1`
   - Volume: `/mnt/blockchain/bitcoin`
   - Ports: 8332 (RPC), 8333/18333 (P2P)

2. **electrs** (Blockstream's Electrum Server)
   - Image: `blockstream/electrs:latest`
   - Function: Transaction indexer
   - Depends: bitcoind (waits for full sync)
   - Volume: `/mnt/blockchain/electrs`
   - Ports: 50001 (Electrum), 3002 (HTTP API)

3. **esplora** (Web UI + API)
   - Image: `blockstream/esplora:latest`
   - Function: Web explorer + REST API
   - Depends: electrs
   - Ports: 3000 (HTTP)
   - Proxies requests to electrs

**Container Communication:**
```
Internet → Port 3000 → Esplora → HTTP → Electrs → RPC → Bitcoind
                                                         ↓
                                                   Blockchain
                                                      Data
```

---

## Infrastructure as Code (AWS CDK)

### Technology Choice: AWS CDK with TypeScript

**Why AWS CDK?**
- ✅ Write infrastructure in TypeScript (same language as wallet)
- ✅ Type safety and IDE autocomplete
- ✅ Reusable constructs (composable components)
- ✅ Built-in best practices and security
- ✅ Generates CloudFormation templates
- ✅ Great testing support

**Alternatives Considered:**
- **Terraform**: More popular but HCL is another language
- **Pulumi**: Similar to CDK but smaller ecosystem
- **CloudFormation**: Verbose YAML/JSON

### Project Structure

```
bitcoin_wallet/
├── infrastructure/                    # NEW: AWS CDK app
│   ├── bin/
│   │   └── esplora.ts                # CDK app entry point
│   ├── lib/
│   │   ├── esplora-stack.ts          # Main stack (orchestrates all constructs)
│   │   ├── constructs/
│   │   │   ├── network-construct.ts          # VPC, subnets, IGW, security groups
│   │   │   ├── compute-construct.ts          # EC2, Spot Fleet, user data
│   │   │   ├── storage-construct.ts          # EBS volumes, snapshots
│   │   │   ├── monitoring-construct.ts       # CloudWatch, SNS, Lambda health check
│   │   │   └── optional-alb-construct.ts     # Load balancer (if HTTPS needed)
│   │   └── config/
│   │       ├── environments.ts               # Dev, staging, prod configs
│   │       └── constants.ts                  # Shared constants
│   ├── assets/
│   │   ├── docker-compose.yml                # Esplora services definition
│   │   ├── bitcoind.conf                     # Bitcoin Core configuration
│   │   ├── electrs.toml                      # Electrs indexer configuration
│   │   ├── nginx.conf                        # Reverse proxy (optional)
│   │   └── health-check.py                   # Lambda function code
│   ├── scripts/
│   │   ├── user-data.sh                      # EC2 bootstrap script
│   │   ├── backup-blockchain.sh              # Backup script (cron)
│   │   └── restore-blockchain.sh             # Restore from snapshot
│   ├── test/
│   │   └── esplora-stack.test.ts             # CDK stack tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── cdk.json                              # CDK configuration
│   ├── cdk.context.json                      # CDK context (gitignored)
│   └── README.md                             # Deployment instructions
├── src/
│   └── background/api/
│       └── BlockstreamClient.ts              # UPDATE: Make API URL configurable
└── ... (existing wallet code)
```

### Reusable Constructs

**1. Network Construct** (`lib/constructs/network-construct.ts`)
```typescript
export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly publicSubnet: ec2.ISubnet;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    // Creates VPC, subnet, IGW, security group
    // Exports outputs for use by other constructs
  }
}
```

**2. Compute Construct** (`lib/constructs/compute-construct.ts`)
```typescript
export class ComputeConstruct extends Construct {
  public readonly instance: ec2.Instance;
  public readonly elasticIp: ec2.CfnEIP;

  constructor(scope: Construct, id: string, props: ComputeProps) {
    // Creates EC2 launch template
    // Configures user data script
    // Requests Spot instance or on-demand
    // Attaches Elastic IP
    // Assigns IAM role for CloudWatch
  }
}
```

**3. Storage Construct** (`lib/constructs/storage-construct.ts`)
```typescript
export class StorageConstruct extends Construct {
  public readonly volume: ec2.Volume;

  constructor(scope: Construct, id: string, props: StorageProps) {
    // Creates EBS gp3 volume
    // Attaches to EC2 instance
    // Configures automatic snapshots
    // Sets retention policy
  }
}
```

**4. Monitoring Construct** (`lib/constructs/monitoring-construct.ts`)
```typescript
export class MonitoringConstruct extends Construct {
  public readonly snsTopic: sns.Topic;
  public readonly healthCheckLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: MonitoringProps) {
    // Creates SNS topic for alerts
    // Subscribes email endpoint
    // Creates CloudWatch alarms (disk, CPU, network)
    // Deploys Lambda health check function
    // Creates EventBridge schedule (every 5 minutes)
  }
}
```

**5. Main Stack** (`lib/esplora-stack.ts`)
```typescript
export class EsploraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create network infrastructure
    const network = new NetworkConstruct(this, 'Network', { ... });

    // Create storage
    const storage = new StorageConstruct(this, 'Storage', { ... });

    // Create compute with user data
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: network.vpc,
      securityGroup: network.securityGroup,
      volume: storage.volume,
      ...
    });

    // Create monitoring
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      instance: compute.instance,
      ...
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `http://${compute.elasticIp.ref}:3000/api`,
      description: 'Esplora API endpoint',
    });
  }
}
```

### Multi-Environment Support

**Environment Configurations** (`lib/config/environments.ts`)
```typescript
export interface EsploraConfig {
  network: 'testnet' | 'mainnet';
  instanceType: ec2.InstanceType;
  useSpot: boolean;
  volumeSize: number;
  alertEmail: string;
  deployAlb: boolean;
}

export const environments: Record<string, EsploraConfig> = {
  dev: {
    network: 'testnet',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.LARGE),
    useSpot: true,  // Save 70%
    volumeSize: 200,  // GB
    alertEmail: 'dev-alerts@example.com',
    deployAlb: false,  // Save $16/month
  },

  staging: {
    network: 'testnet',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.XLARGE),
    useSpot: false,  // More reliable
    volumeSize: 250,
    alertEmail: 'staging-alerts@example.com',
    deployAlb: true,  // Test HTTPS
  },

  production: {
    network: 'mainnet',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3A, ec2.InstanceSize.XLARGE),
    useSpot: false,
    volumeSize: 1600,  // GB for mainnet
    alertEmail: 'production-alerts@example.com',
    deployAlb: true,  // HTTPS required
  },
};
```

**Deployment Commands:**
```bash
# Deploy to dev (testnet, spot instance)
cdk deploy EsploraStack-dev --profile=aws-profile

# Deploy to staging (testnet, on-demand)
cdk deploy EsploraStack-staging --profile=aws-profile

# Deploy to production (mainnet, on-demand, ALB)
cdk deploy EsploraStack-production --profile=aws-profile

# Deploy all environments
cdk deploy --all --profile=aws-profile
```

---

## Deployment Options & Cost Analysis

### Option 1: Testnet Only (Development)

**Use Case**: Development, testing, early users (testnet only)

**Specifications:**
- Instance: t3a.large Spot (~$16/month)
- Storage: 200GB gp3 (~$16/month)
- Network: ~100GB/month (~$9/month)
- CloudWatch: ~$3/month
- **Total: ~$44/month**

**Sync Time**: 6-12 hours

**When to Use:**
- Current development phase
- Testing new features
- Early beta users on testnet

### Option 2: Mainnet Only (Production)

**Use Case**: Production launch with real Bitcoin

**Specifications:**
- Instance: t3a.xlarge On-Demand (~$110/month)
- Storage: 1600GB gp3 (~$128/month)
- Network: ~200GB/month (~$18/month)
- ALB: ~$16/month (HTTPS)
- CloudWatch: ~$5/month
- **Total: ~$277/month**

**Sync Time**: 24-48 hours (faster with more CPU/RAM)

**Cost Optimization:**
- Use Spot for ~$100/month savings → **~$177/month**
- Skip ALB, use HTTPS via reverse proxy → **~$161/month**
- **Optimized Total: ~$161/month**

**When to Use:**
- Production launch
- 100k+ requests/month (break-even vs API credits)
- Need privacy and control

### Option 3: Both Networks (Full Coverage)

**Use Case**: Production mainnet + development testnet

**Specifications:**
- 2x instances (testnet + mainnet)
- Testnet: $44/month (Spot, no ALB)
- Mainnet: $161/month (Spot, no ALB)
- **Total: ~$205/month**

**When to Use:**
- Ongoing development while in production
- A/B testing new features on testnet
- Multiple wallet versions (stable + beta)

### Cost Comparison Table

| Monthly Requests | Blockstream Credits | Self-Host Testnet | Self-Host Mainnet | Break-Even |
|------------------|--------------------|--------------------|-------------------|------------|
| 10k | $10 | $44 | $161 | ❌ Not worth it |
| 50k | $30 | $44 | $161 | ⚠️ Close |
| 100k | $60 | $44 | $161 | ✅ Testnet |
| 500k | $150 | $44 | $161 | ✅ Both |
| 1M | $250 | $44 | $161 | ✅ Both |
| 5M+ | $800+ | $44 | $161 | ✅ Major savings |

**Decision Matrix:**
- **< 50k requests/month**: Use Blockstream API credits
- **50k-100k requests/month**: Consider testnet self-host
- **> 100k requests/month**: Self-host is cost-effective
- **Privacy critical**: Self-host regardless of cost

---

## Implementation Phases

### Phase 1: CDK Infrastructure Setup (Day 1)

**Tasks:**
1. Initialize CDK project
   ```bash
   mkdir infrastructure
   cd infrastructure
   npx cdk init app --language=typescript
   npm install @aws-cdk/aws-ec2 @aws-cdk/aws-sns @aws-cdk/aws-lambda
   ```

2. Create network construct
   - VPC (10.0.0.0/16)
   - Public subnet (10.0.1.0/24)
   - Internet Gateway
   - Route table
   - Security group with rules

3. Create compute construct
   - Launch template with user data
   - Spot instance request (t3a.large)
   - Elastic IP allocation
   - IAM role for CloudWatch

4. Test stack synthesis
   ```bash
   cdk synth
   cdk diff
   ```

**Deliverables:**
- ✅ CDK project initialized
- ✅ Network construct tested
- ✅ Compute construct tested
- ✅ CloudFormation template generated

### Phase 2: Storage & Docker Configuration (Day 2)

**Tasks:**
1. Create storage construct
   - EBS gp3 volume (200GB for testnet)
   - Volume attachment to EC2
   - Snapshot schedule

2. Write Docker Compose file
   - bitcoind service definition
   - electrs service definition
   - esplora service definition
   - Volume mounts
   - Network configuration

3. Write configuration files
   - `bitcoind.conf` (testnet settings)
   - `electrs.toml` (indexer config)
   - Environment variables

4. Write user data script
   - Install Docker & Docker Compose
   - Mount EBS volume
   - Download configs from S3
   - Start Docker services
   - Configure log rotation

**Deliverables:**
- ✅ Storage construct complete
- ✅ Docker Compose tested locally
- ✅ User data script written
- ✅ Configuration files ready

### Phase 3: Monitoring & Alerting (Day 3)

**Tasks:**
1. Create monitoring construct
   - SNS topic
   - Email subscription
   - CloudWatch alarms:
     - Disk usage > 80%
     - CPU usage > 90% for 10 min
     - Instance unreachable for 5 min

2. Write Lambda health check
   - Python function
   - Check API endpoint
   - Compare block height with public API
   - Send SNS alert if behind or unreachable
   - EventBridge schedule (every 5 min)

3. Create CloudWatch dashboard
   - Instance metrics
   - Disk usage chart
   - Block sync progress
   - API request rate (if available)

**Deliverables:**
- ✅ Monitoring construct complete
- ✅ Lambda health check deployed
- ✅ Alarms configured
- ✅ Dashboard created

### Phase 4: Wallet Integration (Day 3-4)

**Tasks:**
1. Update BlockstreamClient.ts
   - Make baseUrl configurable
   - Add constructor parameter for custom URL
   - Keep default as Blockstream API

2. Update webpack config
   - Add `ESPLORA_API_URL` environment variable
   - Inject into build

3. Update .env.local.example
   ```bash
   # Custom Esplora endpoint (optional)
   ESPLORA_API_URL=http://YOUR_EC2_IP:3000/api
   ```

4. Testing
   - Deploy CDK stack
   - Wait for sync to complete
   - Update `.env.local` with EC2 IP
   - Rebuild extension
   - Test all API calls
   - Verify no rate limiting

**Deliverables:**
- ✅ BlockstreamClient supports custom URL
- ✅ Environment variable configuration
- ✅ Documentation updated
- ✅ End-to-end testing passed

### Phase 5: Testing & Cutover (Day 4-5)

**Tasks:**
1. Initial deployment
   ```bash
   cdk deploy EsploraStack-dev
   ```

2. Monitor sync progress
   - SSH to instance: `ssh ec2-user@<elastic-ip>`
   - Check logs: `docker logs -f bitcoind`
   - Watch progress: `tail -f /mnt/blockchain/bitcoin/testnet3/debug.log`
   - Wait for 100% sync (6-12 hours)

3. Verify API functionality
   - Test all endpoints:
     - `/api/blocks/tip/height`
     - `/api/address/<address>`
     - `/api/address/<address>/txs`
     - `/api/address/<address>/utxo`
     - `/api/fee-estimates`
   - Compare responses with Blockstream API
   - Test transaction broadcasting

4. Performance testing
   - Load test with 1000 requests
   - Measure latency
   - Check for errors or rate limits (should be none)

5. Cutover to self-hosted
   - Update production build with EC2 IP
   - Deploy new extension version
   - Monitor for errors
   - Keep Blockstream API as fallback

**Deliverables:**
- ✅ Full blockchain sync complete
- ✅ API endpoints tested
- ✅ Performance benchmarks recorded
- ✅ Production cutover successful

---

## Resource Requirements

### Testnet Requirements

**Blockchain Data:**
- Size: ~50 GB (as of 2025)
- Growth: ~500 MB/month
- Sync Time: 6-12 hours (t3a.large)

**Index Data (electrs):**
- Size: ~100 GB
- Index Time: 4-6 hours after blockchain sync
- Memory: 4-8 GB RAM during indexing

**Total Storage: 200 GB EBS volume**
- Buffer for growth: 50 GB
- Lifecycle: 12+ months before resize needed

### Mainnet Requirements

**Blockchain Data:**
- Size: ~800 GB (as of 2025)
- Growth: ~5-8 GB/month
- Sync Time: 24-48 hours (t3a.xlarge recommended)

**Index Data (electrs):**
- Size: ~600 GB (with compaction)
- Index Time: 12-24 hours after blockchain sync
- Memory: 8-16 GB RAM required

**Total Storage: 1600 GB EBS volume**
- Buffer for growth: 200 GB
- Lifecycle: 18-24 months before resize needed

### Network Bandwidth

**Initial Sync:**
- Testnet: ~50 GB download
- Mainnet: ~800 GB download
- Time: Depends on AWS network speed (typically hours)

**Ongoing:**
- Block updates: ~10 MB/block (~1 MB/min avg)
- P2P traffic: ~1-5 GB/day
- API responses: Depends on wallet usage

### CPU & Memory

**During Sync:**
- CPU: 100-200% usage (2 cores)
- Memory: 6-8 GB (electrs indexing)

**Steady State:**
- CPU: 10-30% usage
- Memory: 4-6 GB
- Bursty during API queries

---

## Monitoring & Operations

### Health Checks & Alerting

**Automated Checks (Lambda - Every 5 minutes):**
1. **API Availability**
   - Ping `/api/blocks/tip/height`
   - Timeout: 10 seconds
   - Alert if unreachable

2. **Sync Status**
   - Compare node height vs public API
   - Alert if >10 blocks behind
   - Alert if no new blocks in 30 minutes

3. **Service Health**
   - Check Docker containers running
   - Alert if any container stopped

**CloudWatch Alarms:**
- Disk usage > 80% → Warning
- Disk usage > 90% → Critical
- CPU usage > 90% for 10 min → Warning
- Instance status check failed → Critical
- Network unreachable for 5 min → Critical

**SNS Alert Channels:**
- Email: Immediate delivery
- SMS (optional): Critical alerts only (+$0.50/SMS)
- Slack (optional): Via webhook integration

### Backup & Disaster Recovery

**Strategy 1: EBS Snapshots (Recommended)**
- Daily automated snapshots via AWS Backup
- Retention: 7 days (rolling)
- Recovery: Launch new instance with snapshot
- RTO: 30 minutes
- Cost: ~$0.05/GB-month (~$8/month for 200GB)

**Strategy 2: Full Resync**
- No backups (cheapest)
- Recovery: Resync from network (6-48 hours)
- RTO: Hours to days
- Cost: $0

**Strategy 3: S3 Backup (For mainnet)**
- Weekly tar.gz of blockchain + index
- Upload to S3 Standard-IA
- Lifecycle to Glacier after 30 days
- Cost: ~$20-40/month
- RTO: 2-4 hours

**Recommended Approach:**
- **Testnet**: Full resync (fast enough, cost = $0)
- **Mainnet**: Daily EBS snapshots (balance cost/RTO)

### Scaling Strategy

**Vertical Scaling (More Power):**
- Upgrade instance type: t3a.large → t3a.xlarge
- Increase EBS IOPS: 3000 → 6000
- Add more RAM: 8GB → 16GB
- Use case: Higher API load, faster queries

**Horizontal Scaling (More Nodes):**
- Deploy multiple EC2 instances
- Add Application Load Balancer
- Distribute API requests
- Use case: High availability, global users

**Caching Layer:**
- Add Redis/ElastiCache in front
- Cache frequent queries (addresses, UTXOs)
- TTL: 30-60 seconds
- Cost: +$15/month (cache.t3.micro)

### Maintenance Windows

**Planned Maintenance:**
- OS updates: Monthly (Saturday 2-4 AM UTC)
- Docker image updates: Quarterly
- Bitcoin Core upgrades: As released (test first)
- CDK stack updates: As needed

**Zero-Downtime Strategy:**
- Deploy second node
- Switch DNS/load balancer
- Update first node
- Switch back
- Update second node

**Expected Downtime:**
- Typical: <5 minutes/month
- Major upgrades: 15-30 minutes

---

## Security Considerations

### Network Isolation

**VPC Security:**
- Dedicated VPC (no shared resources)
- Private subnets for future expansion
- Network ACLs (default allow)
- Flow logs enabled (optional, +$5/month)

**Security Group Rules:**
```
Inbound:
  - Port 3000: 0.0.0.0/0 (or restrict to CloudFlare IPs)
  - Port 22: YOUR_ADMIN_IP/32 only

Outbound:
  - All traffic: 0.0.0.0/0 (for Bitcoin P2P and updates)
```

**Recommendations:**
- ✅ Use bastion host for SSH (production)
- ✅ Enable VPC Flow Logs for audit
- ✅ Restrict API port to CloudFlare IPs if using CDN

### Access Control

**SSH Access:**
- Key-based authentication only (no passwords)
- Use AWS Systems Manager Session Manager (no SSH keys in cloud)
- Multi-factor authentication for AWS console
- Rotate access keys every 90 days

**API Authentication (Optional):**
- Add API key authentication layer
- Rate limiting per key
- IP allowlisting for wallet servers
- Monitor for abuse

**IAM Roles:**
- EC2 instance role: CloudWatch write-only
- Lambda role: SNS publish, EC2 describe
- Principle of least privilege

### DDoS Protection

**Basic (Included):**
- AWS Shield Standard (automatic)
- Protects against common DDoS attacks
- No additional cost

**Advanced (Optional, +$3000/month):**
- AWS Shield Advanced
- 24/7 DDoS response team
- Cost protection
- Only if serving millions of users

**CloudFlare (Recommended, Free):**
- Free tier includes basic DDoS protection
- CDN caching reduces load
- Rate limiting
- Analytics and monitoring

### Data Privacy

**What's Logged:**
- CloudWatch: Instance metrics (CPU, disk, network)
- Docker logs: Container stdout/stderr
- Bitcoin Core: Peer connections, block sync
- electrs: Indexing progress, API requests

**What's NOT Logged:**
- User IP addresses (configure nginx)
- Request payloads (addresses, transactions)
- Sensitive data

**Compliance:**
- No user data stored (stateless API)
- Logs retained 7 days (configurable)
- GDPR compliant (no PII)

---

## Migration Plan

### Cutover Strategy: Blue-Green Deployment

**Current State (Blue):**
- Wallet uses Blockstream API with credits
- API URL: `https://blockstream.info/testnet/api`

**Target State (Green):**
- Wallet uses self-hosted Esplora
- API URL: `https://esplora.yourdomain.com/api`

**Migration Steps:**

1. **Deploy self-hosted node (no traffic yet)**
   ```bash
   cdk deploy EsploraStack-dev
   ```
   - Wait for full sync
   - Test API endpoints
   - Monitor for 24 hours

2. **Add configuration flag**
   ```typescript
   // BlockstreamClient.ts
   const useCustomEndpoint = process.env.USE_CUSTOM_ESPLORA === 'true';
   const baseUrl = useCustomEndpoint
     ? process.env.ESPLORA_API_URL
     : 'https://blockstream.info/testnet/api';
   ```

3. **Canary deployment (10% of users)**
   - Release extension version with custom endpoint enabled
   - Mark as beta channel
   - Monitor error rates
   - Collect feedback

4. **Gradual rollout**
   - 10% → 25% → 50% → 100%
   - Monitor metrics at each stage
   - Rollback if error rate increases

5. **Full cutover**
   - All users on self-hosted endpoint
   - Keep Blockstream as fallback
   - Remove fallback after 30 days

### Rollback Plan

**Trigger Conditions:**
- API error rate > 5%
- Latency > 3 seconds (p95)
- Block sync lagging > 10 blocks
- Instance terminated (Spot interruption)

**Rollback Steps:**
1. Immediately revert to Blockstream API
   ```bash
   # Update environment variable
   USE_CUSTOM_ESPLORA=false
   npm run build
   # Publish emergency update
   ```

2. Investigate root cause
3. Fix issue
4. Test thoroughly
5. Retry migration

**Rollback Time: 15 minutes** (assuming emergency build process)

### Testing Requirements

**Pre-Migration Testing:**
- [ ] All API endpoints return valid data
- [ ] Block height matches public API
- [ ] Transaction history complete
- [ ] UTXO set accurate
- [ ] Fee estimates reasonable
- [ ] Transaction broadcast works
- [ ] Handles wallet with 30+ addresses
- [ ] Load test: 100 requests/second
- [ ] Latency < 500ms (p95)

**Post-Migration Monitoring:**
- Error rates (compare blue vs green)
- Latency percentiles (p50, p95, p99)
- API availability (uptime %)
- Block sync status
- User-reported issues

### User Impact Assessment

**During Migration:**
- No user action required
- Transparent backend switch
- No data loss or corruption
- Same API interface

**Potential Issues:**
- Slight latency increase (if node is slower)
- Downtime if Spot instance interrupted
- Sync lag if node falls behind

**Mitigation:**
- Keep Blockstream API as fallback
- Automatic failover on errors
- User notification if using fallback
- Health monitoring and alerts

---

## Decision Criteria

### When to Implement Self-Hosting

**Trigger Conditions (Any ONE triggers implementation):**

1. **Cost Threshold**
   - Blockstream API credits > $100/month for 3 consecutive months
   - Projected savings > 50% with self-hosting

2. **Request Volume**
   - > 500k API requests/month
   - > 1000 active daily users

3. **Privacy Requirements**
   - Users request privacy (no third-party sees addresses)
   - Competitive advantage (privacy-focused wallet)

4. **Feature Requirements**
   - Need custom API endpoints
   - Need faster response times
   - Need higher rate limits than Blockstream offers

5. **Business Requirements**
   - Production launch to mainnet
   - Enterprise customers
   - Regulatory compliance (data sovereignty)

### Metrics to Track

**Financial Metrics:**
- Monthly Blockstream API credit costs
- Projected AWS costs (calculator)
- Break-even analysis

**Usage Metrics:**
- Total API requests per month
- Active users per day
- Average requests per user
- Peak requests per second

**Performance Metrics:**
- API latency (Blockstream vs self-hosted)
- Error rates
- Availability / uptime

**Business Metrics:**
- Total wallet installations
- User growth rate
- Revenue (if applicable)

### Success Criteria

**After Implementation:**

✅ **Cost Reduction**: AWS costs < previous API credit costs
✅ **Performance**: Latency ≤ Blockstream API
✅ **Reliability**: Uptime ≥ 99.5%
✅ **No Rate Limits**: Unlimited API requests
✅ **Sync Status**: Node always within 5 blocks of tip
✅ **User Experience**: No complaints about API performance
✅ **Maintenance**: < 2 hours/month ops overhead

**KPIs to Monitor:**
- Monthly AWS bill vs Blockstream credits (savings %)
- API p95 latency (target: <500ms)
- API error rate (target: <1%)
- Uptime (target: 99.5%+)
- Block sync lag (target: <5 blocks)

---

## Future Enhancements (Beyond MVP)

### Phase 2: Production Hardening

**Multi-AZ Deployment:**
- Deploy instances in 2+ availability zones
- Application Load Balancer with health checks
- Automatic failover (RTO: <1 minute)
- Cost: +$100/month

**Auto-Scaling:**
- Auto Scaling Group with min/max instances
- Scale based on CPU or request rate
- Handle traffic spikes automatically
- Cost: Variable (+$50-200/month under load)

**Enhanced Monitoring:**
- Custom CloudWatch metrics (block sync, mempool, API requests)
- Prometheus + Grafana for detailed metrics
- PagerDuty integration for on-call alerts
- Cost: +$20/month

### Phase 3: Global Distribution

**CloudFront CDN:**
- Cache static API responses
- Distribute globally (low latency worldwide)
- DDoS protection included
- Cost: +$10-50/month depending on traffic

**Multi-Region Deployment:**
- Deploy Esplora nodes in multiple AWS regions
- Route53 geolocation routing
- Lowest latency for users globally
- Cost: 2-3x single region cost

### Phase 4: Advanced Features

**Custom API Endpoints:**
- Aggregate balance across multiple addresses
- Transaction history with enrichment
- Address labeling and categories
- Analytics and insights

**Mempool Monitoring:**
- Real-time mempool statistics
- Fee estimation improvements
- Transaction acceleration recommendations

**Lightning Network:**
- Add Lightning node (lnd or c-lightning)
- Lightning invoice generation
- Payment channel management
- Cost: Minimal (same hardware)

### Phase 5: Optimization

**Read Replicas:**
- ElastiCache Redis for hot data
- PostgreSQL for indexed queries
- Reduce load on primary node
- Cost: +$15-50/month

**Batch Operations:**
- Bulk address lookups
- Batch UTXO queries
- Reduce API round-trips
- Improve wallet performance

**Pruned Nodes (Cost Optimization):**
- Run pruned Bitcoin node (reduce blockchain storage)
- Keep full index in electrs
- Trade-off: Can't serve full history
- Savings: ~$50/month on mainnet storage

---

## Implementation Checklist

### Prerequisites
- [ ] AWS account with billing enabled
- [ ] AWS CLI configured (`aws configure`)
- [ ] AWS CDK CLI installed (`npm install -g aws-cdk`)
- [ ] Node.js 18+ and npm installed
- [ ] Docker installed locally (for testing)
- [ ] Domain name (optional, for HTTPS)

### Phase 1: Infrastructure (Day 1)
- [ ] Initialize CDK project: `cdk init`
- [ ] Create network construct (VPC, subnet, SG)
- [ ] Create compute construct (EC2, Spot, IAM role)
- [ ] Create storage construct (EBS volume)
- [ ] Test synthesis: `cdk synth`
- [ ] Review CloudFormation template

### Phase 2: Configuration (Day 2)
- [ ] Write `docker-compose.yml`
- [ ] Write `bitcoind.conf`
- [ ] Write `electrs.toml`
- [ ] Write user data script (`user-data.sh`)
- [ ] Test Docker Compose locally
- [ ] Upload assets to S3 (or inline in user data)

### Phase 3: Monitoring (Day 3)
- [ ] Create monitoring construct (SNS, CloudWatch)
- [ ] Write Lambda health check function
- [ ] Create CloudWatch alarms
- [ ] Test SNS alerts
- [ ] Create CloudWatch dashboard

### Phase 4: Deployment (Day 3-4)
- [ ] Bootstrap CDK: `cdk bootstrap`
- [ ] Deploy stack: `cdk deploy EsploraStack-dev`
- [ ] Note outputs (Elastic IP, instance ID)
- [ ] SSH to instance: `ssh ec2-user@<elastic-ip>`
- [ ] Verify Docker containers running: `docker ps`
- [ ] Monitor sync: `docker logs -f bitcoind`

### Phase 5: Wallet Integration (Day 4)
- [ ] Update `BlockstreamClient.ts` (configurable URL)
- [ ] Update `webpack.config.js` (environment variables)
- [ ] Update `.env.local` with EC2 IP
- [ ] Rebuild extension: `npm run build`
- [ ] Load extension in Chrome
- [ ] Test API calls in Dashboard
- [ ] Verify no rate limit errors

### Phase 6: Testing & Validation (Day 4-5)
- [ ] Wait for blockchain sync (6-12 hours)
- [ ] Test all API endpoints
- [ ] Compare responses with Blockstream API
- [ ] Load test: 100 requests
- [ ] Check CloudWatch metrics
- [ ] Test alert notifications
- [ ] Document EC2 IP in team wiki

### Phase 7: Production Readiness (Week 2)
- [ ] Set up automated EBS snapshots
- [ ] Configure custom domain (Route53)
- [ ] Set up HTTPS (ALB + ACM or Let's Encrypt)
- [ ] Load test with realistic traffic
- [ ] Document runbooks (restart, scale, rollback)
- [ ] Train team on monitoring and alerts
- [ ] Plan gradual rollout (canary → 100%)

---

## Summary

### Quick Decision Guide

**Should I self-host NOW?**

```
┌──────────────────────────────────────────────────────┐
│  Are you in production with real users?              │
│  ├─ No  → Use Blockstream API (current approach)     │
│  └─ Yes → Continue below                             │
│                                                       │
│  Is your API cost > $100/month?                      │
│  ├─ No  → Wait, keep using Blockstream API           │
│  └─ Yes → Continue below                             │
│                                                       │
│  Do you need privacy (hide user addresses)?          │
│  ├─ No  → Evaluate cost/benefit                      │
│  └─ Yes → Self-host NOW                              │
│                                                       │
│  Do you have 4-5 days for implementation?            │
│  ├─ No  → Wait for better timing                     │
│  └─ Yes → Proceed with self-hosting                  │
└──────────────────────────────────────────────────────┘
```

### Key Takeaways

✅ **Self-hosting is NOT urgent** - Current Blockstream paid API works fine
✅ **Cost-effective at scale** - Break-even at 100k+ requests/month
✅ **Infrastructure as Code** - AWS CDK makes deployment repeatable
✅ **Testnet first** - Start small (~$44/month), scale to mainnet later
✅ **4-5 day implementation** - Plus 6-48 hours sync time
✅ **Monitoring included** - SNS alerts and health checks
✅ **Gradual migration** - Canary rollout with Blockstream fallback

### Next Steps

**Immediate (Current Phase):**
1. Continue using Blockstream API with paid credits ✅
2. Track API costs and request volume monthly
3. Monitor user growth and usage patterns

**When Ready (Production Launch):**
1. Review this document
2. Update cost/volume projections
3. Allocate 1 week for implementation
4. Deploy to testnet first
5. Gradual rollout to production

**This document will be ready when you need it.**

---

## Appendix: Useful Commands

### AWS CDK Commands
```bash
# Install CDK CLI globally
npm install -g aws-cdk

# Initialize new CDK project
cdk init app --language=typescript

# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Preview changes
cdk diff

# Deploy stack
cdk deploy EsploraStack-dev

# Deploy all stacks
cdk deploy --all

# Destroy stack (cleanup)
cdk destroy EsploraStack-dev

# List all stacks
cdk list
```

### Docker Commands (on EC2)
```bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs
docker logs bitcoind
docker logs electrs
docker logs esplora

# Follow logs (real-time)
docker logs -f bitcoind

# Restart container
docker restart bitcoind

# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d

# Rebuild and restart
docker-compose up -d --build
```

### Bitcoin Core Commands
```bash
# Check sync status
docker exec bitcoind bitcoin-cli -testnet getblockchaininfo

# Get block count
docker exec bitcoind bitcoin-cli -testnet getblockcount

# Get peer info
docker exec bitcoind bitcoin-cli -testnet getpeerinfo

# Check mempool
docker exec bitcoind bitcoin-cli -testnet getmempoolinfo
```

### Monitoring Commands
```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check CPU usage
top

# Check Docker resource usage
docker stats

# View CloudWatch logs
aws logs tail /aws/ec2/esplora --follow

# Test API endpoint
curl http://localhost:3000/api/blocks/tip/height
```

### Backup & Restore
```bash
# Create EBS snapshot (replace volume ID)
aws ec2 create-snapshot --volume-id vol-xxxxx --description "Esplora testnet backup"

# List snapshots
aws ec2 describe-snapshots --owner-ids self

# Restore from snapshot
# 1. Create volume from snapshot
# 2. Attach to instance
# 3. Mount at /mnt/blockchain
```

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Next Review**: Production launch decision point
**Owner**: Backend Developer + DevOps Team
**Status**: 📋 Planning (Ready for implementation when needed)
