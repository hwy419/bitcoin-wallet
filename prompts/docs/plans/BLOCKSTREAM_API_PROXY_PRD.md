# Blockstream API Proxy - Product Requirements Document

**Status**: 📋 Ready for Implementation
**Priority**: P0 - CRITICAL (Blocks Chrome Web Store publication)
**Version**: 1.0
**Created**: 2025-10-28
**Product Manager**: Bitcoin Wallet Product Manager
**Target Release**: Before Chrome Web Store publication

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Problem Statement](#problem-statement)
3. [Product Goals](#product-goals)
4. [User Stories & Acceptance Criteria](#user-stories--acceptance-criteria)
5. [Success Metrics](#success-metrics)
6. [Product Requirements](#product-requirements)
7. [Non-Functional Requirements](#non-functional-requirements)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)
9. [Security Requirements](#security-requirements)
10. [User Experience Impact](#user-experience-impact)
11. [Rollback Plan](#rollback-plan)
12. [Risk Assessment](#risk-assessment)
13. [Questions for Technical Teams](#questions-for-technical-teams)
14. [Implementation Phases](#implementation-phases)
15. [Approval Checklist](#approval-checklist)

---

## Executive Summary

### The Critical Issue

We have purchased Blockstream API credits to resolve rate limiting issues, but **bundling the API key in the extension code creates a CRITICAL SECURITY VULNERABILITY**:

- Anyone can install the extension from the Chrome Web Store
- Extract the extension files from `chrome://extensions/`
- Search the JavaScript bundle for the API key
- Use OUR API key for THEIR projects
- We pay for their usage (potentially thousands of dollars)

**This is NOT a hypothetical threat** - it's a well-known attack vector in browser extensions. Chrome extension source code is inherently public.

### The Solution

Implement an AWS Lambda proxy that:
1. **Secures the API key on the backend** (never exposed to client)
2. **Acts as a transparent proxy** between extension and Blockstream
3. **Maintains the same API interface** (minimal code changes)
4. **Adds monitoring and rate limiting** (abuse prevention)
5. **Enables future scaling** (can switch to self-hosted Esplora later)

### Why This is P0 (Must Have Before Publication)

- ❌ **Cannot publish to Chrome Web Store with API key in code** - Security requirement
- ❌ **Cannot ship without API credits** - Public API has restrictive rate limits
- ✅ **Lambda proxy is the ONLY secure solution** for this architecture
- ✅ **Quick to implement** - 6-8 hours total
- ✅ **Cheap to operate** - $5-10/month + Blockstream credits
- ✅ **Production-ready** - Industry standard pattern

---

## Problem Statement

### Current State (v0.10.0 - Development Only)

**Architecture:**
```
Extension → Blockstream Public API
(No key)    (Rate limited: 10 req/min)
```

**Problems:**
1. **Rate Limiting**: Public API limited to 10 requests/minute - insufficient for production
2. **Reliability**: Public API can be slow or unavailable
3. **No Monitoring**: Cannot track API usage or errors
4. **No Control**: Cannot implement custom caching or optimization

### Attempted Solution (NOT VIABLE)

**Architecture:**
```
Extension → Blockstream Paid API
(Has key)   (Higher limits, credits)
```

**CRITICAL FLAW:**
- ❌ API key stored in extension code (easily extractable)
- ❌ Anyone can steal the key and use our credits
- ❌ No way to revoke key without republishing extension
- ❌ Financial risk: Unlimited unauthorized usage
- ❌ Security best practice violation
- ❌ **BLOCKS CHROME WEB STORE PUBLICATION**

### Target State (Production-Ready)

**Architecture:**
```
Extension → AWS Lambda Proxy → Blockstream Paid API
(No key)    (Has key, secure)   (Credits protected)
```

**Benefits:**
- ✅ API key secured on backend (encrypted, never exposed)
- ✅ Can rotate key anytime without extension update
- ✅ Rate limiting and abuse prevention
- ✅ CloudWatch monitoring and alerting
- ✅ Scales automatically (1000 concurrent requests)
- ✅ Low latency (~200-400ms total)
- ✅ Low cost (~$5-10/month)
- ✅ Future-proof (can switch to self-hosted Esplora)
- ✅ **ENABLES CHROME WEB STORE PUBLICATION**

---

## Product Goals

### Primary Goals

1. **Secure API Key Protection**
   - API key never exposed in client-side code
   - Key stored in Lambda environment variables (encrypted at rest)
   - Key rotatable without extension updates
   - Separate keys for testnet and mainnet

2. **Transparent User Experience**
   - No visible changes for end users
   - Same or better API performance
   - Seamless transition from development to production
   - No additional authentication required

3. **Production Readiness**
   - Enable Chrome Web Store publication
   - Meet security best practices
   - Comply with Chrome extension policies
   - Production-grade monitoring and alerting

4. **Cost Efficiency**
   - Stay within budget ($5-10/month target)
   - Optimize API usage (caching where appropriate)
   - Prevent runaway costs (rate limiting, concurrency limits)
   - Track and alert on cost anomalies

### Secondary Goals

5. **Scalability & Future-Proofing**
   - Support 1000+ concurrent users
   - Easy migration path to self-hosted Esplora
   - Abstraction layer for future API changes
   - Infrastructure as Code (reproducible deployments)

6. **Observability & Operations**
   - Real-time monitoring (CloudWatch)
   - Error alerting (SNS/email)
   - Request logging (sanitized for privacy)
   - Performance metrics (latency, throughput)

### Non-Goals (Out of Scope)

- ❌ Self-hosted Bitcoin node (future feature)
- ❌ Custom caching layer (can add later)
- ❌ API key authentication for extension (optional enhancement)
- ❌ Multi-region deployment (single region sufficient)
- ❌ Custom domain name (API Gateway URL acceptable for MVP)

---

## User Stories & Acceptance Criteria

### Epic 1: Secure API Key Management

#### US-1.1: As a wallet user, my API usage should be protected so my funds remain secure

**User Value**: Users should never worry that the wallet's API infrastructure could be compromised or abused by third parties.

**Acceptance Criteria:**
- [ ] API key is NOT present in any client-side code (extension bundle)
- [ ] API key is stored in Lambda environment variables (encrypted at rest with AWS KMS)
- [ ] API key is never logged in CloudWatch or any logs
- [ ] API key can be rotated without rebuilding/republishing the extension
- [ ] Separate API keys exist for testnet and mainnet environments
- [ ] Manual testing: Inspect extension files - no API key found
- [ ] Security testing: grep through entire `dist/` folder - no secrets found

**Definition of Done:**
- Security expert has reviewed and approved the key management implementation
- Documentation exists for API key rotation procedure
- Test demonstrates key can be rotated via AWS console without extension changes

---

#### US-1.2: As a developer, I need to rotate API keys without downtime

**User Value**: Enables security best practices (90-day key rotation) without service interruption.

**Acceptance Criteria:**
- [ ] Key rotation can be performed via AWS Lambda console
- [ ] Key rotation does not require extension rebuild or republish
- [ ] Documentation includes step-by-step key rotation procedure
- [ ] Rotation can be completed in <5 minutes
- [ ] Extension continues working immediately after rotation
- [ ] Manual test: Rotate testnet key, verify wallet still functions
- [ ] Manual test: Invalid key causes graceful error (not crash)

**Definition of Done:**
- Key rotation runbook exists in `/infrastructure/lambda-proxy/README.md`
- QA engineer has successfully rotated keys in development environment
- Error handling tested: Invalid key returns user-friendly error message

---

### Epic 2: Transparent API Proxy

#### US-2.1: As a wallet user, API calls should be fast and reliable

**User Value**: Users expect instant balance updates and quick transaction confirmations. Slow API = bad UX.

**Acceptance Criteria:**
- [ ] 95th percentile (p95) latency <500ms for address lookups
- [ ] 99th percentile (p99) latency <1000ms for address lookups
- [ ] Cold start latency <1500ms (acceptable for first call after idle)
- [ ] No user-visible degradation compared to direct Blockstream API
- [ ] Error rate <1% under normal conditions
- [ ] Extension loading time unchanged (<2 seconds to Dashboard)
- [ ] Performance test: 100 concurrent address lookups complete successfully

**Definition of Done:**
- CloudWatch metrics show p95 < 500ms sustained over 24 hours
- Load testing demonstrates 100 concurrent requests succeed
- QA engineer confirms no noticeable delay in Dashboard loading

---

#### US-2.2: As a developer, the proxy should maintain the same API interface

**User Value**: Minimal code changes reduce bugs and speed up deployment.

**Acceptance Criteria:**
- [ ] BlockstreamClient.ts requires <50 lines of code changes
- [ ] All existing API methods work without signature changes
- [ ] Same request/response formats as Blockstream API
- [ ] Configuration change only (environment variable)
- [ ] Development mode continues to work (direct Blockstream API)
- [ ] Unit tests pass without modification
- [ ] Integration tests pass without modification

**Definition of Done:**
- Code review confirms BlockstreamClient changes are minimal and backward-compatible
- All existing tests pass with proxy enabled
- Documentation updated to reflect configuration options

---

### Epic 3: Production-Grade Infrastructure

#### US-3.1: As a DevOps engineer, I need Infrastructure as Code for reproducibility

**User Value**: Enables disaster recovery, multi-environment deployment, and version control of infrastructure.

**Acceptance Criteria:**
- [ ] All infrastructure defined in AWS CDK (TypeScript)
- [ ] `cdk deploy` creates complete working proxy in <10 minutes
- [ ] `cdk destroy` cleanly removes all resources
- [ ] Infrastructure version controlled in Git
- [ ] Clear documentation for deployment and updates
- [ ] Separate stacks for dev/staging/production environments
- [ ] No manual AWS console configuration required (except API keys)

**Definition of Done:**
- New AWS account can deploy proxy following documented steps
- Backend developer successfully deploys proxy to clean AWS account
- Infrastructure code reviewed and approved by backend expert

---

#### US-3.2: As a DevOps engineer, I need monitoring and alerting for proactive issue detection

**User Value**: Catch and fix issues before users report them. Enable data-driven optimization.

**Acceptance Criteria:**
- [ ] CloudWatch Dashboard shows: invocations, errors, duration, costs
- [ ] CloudWatch Alarms configured:
  - [ ] Error rate >5% for 5 minutes → SNS alert
  - [ ] p95 duration >5 seconds → SNS alert
  - [ ] Invocations >100k/hour (potential abuse) → SNS alert
- [ ] SNS topic configured for email alerts
- [ ] 7-day log retention for debugging
- [ ] Structured JSON logging with sanitized data (no addresses in prod)
- [ ] AWS Cost Explorer shows Lambda/API Gateway costs

**Definition of Done:**
- CloudWatch Dashboard is live and showing real-time metrics
- Test alert triggered successfully (email received)
- Cost tracking verified in AWS Cost Explorer
- Log sanitization tested: Bitcoin addresses masked in production logs

---

### Epic 4: Security & Abuse Prevention

#### US-4.1: As a product owner, I need rate limiting to prevent abuse and cost overruns

**User Value**: Protects against malicious usage that could drain API credits or cause service degradation.

**Acceptance Criteria:**
- [ ] API Gateway throttling: 1000 requests/second per IP
- [ ] API Gateway burst limit: 5000 requests
- [ ] Lambda concurrency limit: 100 (prevents runaway costs)
- [ ] CloudWatch alarm for unusual traffic (>100k requests/hour)
- [ ] 429 (rate limited) responses handled gracefully by extension
- [ ] Documentation for adjusting rate limits if needed
- [ ] Load test: 2000 rapid requests → some throttled (429), no crashes

**Definition of Done:**
- Load testing confirms rate limiting works as configured
- Extension handles 429 errors gracefully (exponential backoff)
- Documentation includes rate limit adjustment procedure
- Security expert approves rate limiting strategy

---

#### US-4.2: As a security engineer, I need secure logging that doesn't leak user data

**User Value**: Protects user privacy while enabling debugging and monitoring.

**Acceptance Criteria:**
- [ ] API keys NEVER logged (checked in code review)
- [ ] Bitcoin addresses sanitized in production logs (masked as `***ADDRESS***`)
- [ ] Transaction IDs logged for debugging (public data, OK)
- [ ] Request IDs for tracing end-to-end flows
- [ ] Log level configurable per environment (DEBUG in dev, INFO in prod)
- [ ] 7-day log retention (adjustable, GDPR compliant)
- [ ] Manual test: Review production logs → no private data

**Definition of Done:**
- Security expert reviews logging implementation
- Privacy audit confirms no PII in logs
- Log sanitization tested in staging environment

---

### Epic 5: Deployment & Operations

#### US-5.1: As a developer, I can deploy the proxy with clear, step-by-step instructions

**User Value**: Reduces deployment friction and enables non-AWS-experts to deploy confidently.

**Acceptance Criteria:**
- [ ] Deployment runbook in `/infrastructure/lambda-proxy/README.md`
- [ ] Prerequisites clearly documented (AWS account, CLI, CDK, Node.js)
- [ ] Step-by-step deployment instructions with example commands
- [ ] Troubleshooting section for common issues
- [ ] Screenshots or ASCII diagrams for AWS console steps
- [ ] First-time deployment completes in <30 minutes (including setup)
- [ ] Manual test: Non-AWS-expert follows docs and successfully deploys

**Definition of Done:**
- Frontend developer (minimal AWS experience) successfully deploys proxy
- Deployment documentation reviewed and approved
- Video walkthrough recorded (optional but nice to have)

---

#### US-5.2: As a DevOps engineer, I need a rollback plan for deployment failures

**User Value**: Enables quick recovery if Lambda proxy has issues. Minimizes downtime.

**Acceptance Criteria:**
- [ ] Rollback procedure documented (revert to Blockstream direct)
- [ ] Environment variable toggle: `BLOCKSTREAM_PROXY_URL` (if set: use proxy, if not: direct)
- [ ] Rollback can be performed by changing `.env.local` and rebuilding extension
- [ ] Rollback time <10 minutes (rebuild + reload extension)
- [ ] CloudWatch retention ensures logs available for post-mortem
- [ ] Manual test: Simulate proxy failure, rollback, verify wallet works

**Definition of Done:**
- Rollback procedure tested in staging
- QA engineer confirms rollback completes in <10 minutes
- Post-deployment communication plan defined

---

## Success Metrics

### Critical Success Criteria (Must Achieve)

1. **Security: API Key Protection**
   - ✅ 0 API keys found in extension files (100% pass rate)
   - ✅ Security expert approves implementation (sign-off required)

2. **Performance: User Experience Maintained**
   - ✅ p95 latency ≤500ms for address lookups
   - ✅ Extension loading time ≤2 seconds (no regression)
   - ✅ Error rate <1% under normal load

3. **Reliability: Production Uptime**
   - ✅ >99% uptime over first 30 days (excludes Blockstream API issues)
   - ✅ All critical API operations functional (balance, transactions, broadcast)

4. **Cost: Budget Compliance**
   - ✅ AWS costs ≤$10/month for first 3 months (average)
   - ✅ No unexpected cost spikes (>$50 in single day triggers investigation)

### Key Performance Indicators (Ongoing)

5. **Operational Excellence**
   - 📊 Mean time to detect (MTTD): <5 minutes (CloudWatch alarms)
   - 📊 Mean time to resolve (MTTR): <30 minutes for critical issues
   - 📊 Zero security incidents (API key leaks, unauthorized access)

6. **User Satisfaction (Proxy Performance)**
   - 📊 p50 latency: <300ms (feels instant)
   - 📊 p95 latency: <500ms (acceptable)
   - 📊 p99 latency: <1000ms (rare slow cases)
   - 📊 Cold start latency: <1500ms (first call after idle)

7. **Cost Efficiency**
   - 📊 Lambda invocations: Track monthly (predict scaling costs)
   - 📊 Blockstream API credits used: Monitor via Blockstream dashboard
   - 📊 Average cost per user: <$0.10/month (for 100 active users)

8. **Abuse Prevention**
   - 📊 Rate limiting triggers: <10/day (normal traffic shouldn't hit limits)
   - 📊 Cost anomaly alarms: 0 false positives (well-tuned thresholds)

### Leading Indicators (Early Warning)

9. **Deployment Health**
   - First deployment succeeds without manual intervention ✅
   - Zero rollbacks in first 7 days ✅
   - Documentation clarity: New developer deploys successfully ✅

10. **Infrastructure Quality**
    - CDK stack synthesizes without warnings ✅
    - All security best practices applied (IAM, encryption, logging) ✅
    - Code review approval from backend + security experts ✅

---

## Product Requirements

### Functional Requirements

#### FR-1: AWS Lambda Proxy Function

**Priority**: P0 (Critical)

**Description**: Lambda function that proxies requests from the extension to Blockstream API.

**Requirements**:
- Runtime: Node.js 20.x
- Memory: 256 MB (sufficient for proxying)
- Timeout: 30 seconds (covers API calls + overhead)
- Concurrency: 100 (prevents runaway costs)
- Environment variables:
  - `BLOCKSTREAM_API_KEY_TESTNET` (encrypted)
  - `BLOCKSTREAM_API_KEY_MAINNET` (encrypted)
  - `BLOCKSTREAM_BASE_URL_TESTNET`
  - `BLOCKSTREAM_BASE_URL_MAINNET`
  - `LOG_LEVEL` (INFO in prod, DEBUG in dev)
  - `NODE_ENV` (production/development/staging)

**Handler Logic**:
1. Extract path from API Gateway event (`/blockstream/{proxy+}`)
2. Determine network (testnet vs mainnet) from query parameter or default
3. Build target Blockstream API URL
4. Add `X-API-Key` header (from environment variable)
5. Forward request (preserve method, body for POST)
6. Return response (add CORS headers)
7. Log request metadata (method, path, status, duration, requestId)

**Error Handling**:
- Invalid network parameter → 400 Bad Request
- Blockstream unreachable → 502 Bad Gateway
- Timeout (>25s) → 502 Bad Gateway (Lambda has 30s total)
- Any error → Structured JSON error with `requestId` for tracing

---

#### FR-2: API Gateway REST API

**Priority**: P0 (Critical)

**Description**: HTTPS endpoint for the extension to call the Lambda proxy.

**Requirements**:
- REST API (not HTTP API, need more control)
- CORS enabled for `chrome-extension://*` origins
- Stage: `dev` / `staging` / `production`
- Throttling: 1000 requests/second per IP
- Burst limit: 5000 requests
- Request validation: Path parameters must be valid
- Logging: INFO level, no request/response bodies (privacy)
- Routes:
  - `GET /blockstream/{proxy+}` → Lambda (all GET requests)
  - `POST /blockstream/tx` → Lambda (broadcast transactions)
  - `OPTIONS /blockstream/{proxy+}` → CORS preflight

**Response Headers** (all responses):
```
Access-Control-Allow-Origin: chrome-extension://*
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

#### FR-3: Extension Configuration

**Priority**: P0 (Critical)

**Description**: Update extension to call Lambda proxy instead of Blockstream directly.

**Requirements**:
- Environment variable: `BLOCKSTREAM_PROXY_URL`
- If set: Use proxy (production)
- If not set: Use Blockstream direct (development)
- BlockstreamClient.ts changes:
  ```typescript
  constructor(network: 'mainnet' | 'testnet' = 'testnet') {
    this.network = network;

    const proxyUrl = process.env.BLOCKSTREAM_PROXY_URL;

    if (proxyUrl) {
      // Production: Use proxy (network passed as query param)
      this.baseUrl = `${proxyUrl}?network=${network}`;
    } else {
      // Development: Use Blockstream direct
      this.baseUrl = network === 'mainnet'
        ? 'https://blockstream.info/api'
        : 'https://blockstream.info/testnet/api';
    }
  }
  ```
- Webpack DefinePlugin injects `process.env.BLOCKSTREAM_PROXY_URL` at build time
- `.env.local.example` updated with proxy URL example

**Backward Compatibility**:
- Development builds (no proxy URL) continue to work with direct Blockstream API
- Existing tests pass without modification

---

#### FR-4: CloudWatch Monitoring

**Priority**: P1 (High)

**Description**: Real-time monitoring dashboard and logs.

**Requirements**:
- CloudWatch Dashboard: `BlockstreamProxy-{environment}`
- Metrics displayed:
  - Lambda invocations (requests/second)
  - Lambda errors (count, percentage)
  - Lambda duration (p50, p95, p99 in milliseconds)
  - API Gateway requests (count)
  - API Gateway 4xx errors (count)
  - API Gateway 5xx errors (count)
- Auto-refresh: 1 minute
- Time range: Last 3 hours (adjustable)

**CloudWatch Logs**:
- Log group: `/aws/lambda/BlockstreamProxyStack-{env}-ProxyLambda...`
- Retention: 7 days (configurable, balances cost vs debugging needs)
- Log format: Structured JSON (easy to parse with CloudWatch Insights)
- Log levels: DEBUG (dev), INFO (staging/prod)

**Log Entry Structure**:
```json
{
  "timestamp": "2025-10-28T14:32:15.123Z",
  "level": "INFO",
  "message": "Request completed",
  "context": {
    "requestId": "abc-123-def-456",
    "method": "GET",
    "path": "/address/tb1q.../utxo",
    "network": "testnet",
    "statusCode": 200,
    "duration": 234
  }
}
```

---

#### FR-5: CloudWatch Alarms & Alerts

**Priority**: P1 (High)

**Description**: Automated alerts for anomalies and failures.

**Requirements**:

**Alarm 1: High Error Rate**
- Metric: Lambda Errors (Sum)
- Threshold: >10 errors in 5 minutes
- Evaluation: 1 period
- Action: Send SNS email alert
- Description: "Lambda function error rate is too high"

**Alarm 2: High Duration (Slow Responses)**
- Metric: Lambda Duration (p95)
- Threshold: >5000ms (5 seconds)
- Evaluation: 2 consecutive periods
- Action: Send SNS email alert
- Description: "Lambda p95 duration is too high (slow Blockstream API?)"

**Alarm 3: High Invocation Count (Potential Abuse)**
- Metric: Lambda Invocations (Sum)
- Threshold: >100,000 requests/hour
- Evaluation: 1 period
- Action: Send SNS email alert
- Description: "Unusually high request volume (check for abuse or traffic spike)"

**SNS Topic**:
- Name: `BlockstreamProxyAlerts-{environment}`
- Subscriptions: Email (configurable during deployment)

---

#### FR-6: Infrastructure as Code (AWS CDK)

**Priority**: P0 (Critical)

**Description**: All infrastructure defined in TypeScript using AWS CDK.

**Requirements**:
- CDK v2.x
- Language: TypeScript (same as wallet codebase)
- Stack: `BlockstreamProxyStack-{environment}`
- Environments: dev, staging, production
- Constructs (modular design):
  - `LambdaConstruct`: Lambda function + IAM role
  - `ApiGatewayConstruct`: API Gateway + CORS
  - `MonitoringConstruct`: CloudWatch dashboard + alarms
- Outputs:
  - `ApiEndpoint`: Proxy URL for extension configuration
  - `LambdaFunctionName`: For debugging and log access
- Deployment:
  - `cdk deploy BlockstreamProxyStack-dev` (dev environment)
  - `cdk deploy BlockstreamProxyStack-prod` (production environment)

**Directory Structure**:
```
infrastructure/lambda-proxy/
├── bin/proxy.ts                    # CDK app entry point
├── lib/
│   ├── proxy-stack.ts              # Main stack
│   ├── constructs/
│   │   ├── lambda-construct.ts     # Lambda + IAM
│   │   ├── api-gateway-construct.ts # API Gateway + CORS
│   │   └── monitoring-construct.ts  # CloudWatch
│   └── config/
│       ├── environments.ts          # Dev/staging/prod configs
│       └── constants.ts             # Shared constants
├── lambda/
│   ├── src/
│   │   ├── index.ts                # Handler
│   │   ├── blockstream-proxy.ts    # Proxy logic
│   │   ├── logger.ts               # Structured logging
│   │   └── types.ts                # TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js           # Bundle Lambda
├── test/
│   ├── proxy-stack.test.ts         # CDK snapshot tests
│   └── lambda.test.ts              # Lambda unit tests
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md                       # Deployment guide
```

---

### Non-Functional Requirements

#### NFR-1: Performance

- **Latency**:
  - p50: <300ms (feels instant)
  - p95: <500ms (acceptable)
  - p99: <1000ms (rare slow cases)
  - Cold start: <1500ms (first call after idle)
- **Throughput**:
  - Support 1000 concurrent requests
  - Handle 100,000 requests/day without issues
- **Availability**:
  - Target: 99% uptime (excludes Blockstream API downtime)
  - Graceful degradation: If Blockstream down, return 502 with clear error

#### NFR-2: Security

- **Key Management**:
  - API keys encrypted at rest (AWS KMS)
  - Keys stored in Lambda environment variables (not in code)
  - Keys never logged or transmitted to client
  - Separate keys for testnet and mainnet
- **Network Security**:
  - HTTPS only (TLS 1.3)
  - CORS limited to `chrome-extension://*`
  - Rate limiting per IP (prevent abuse)
- **Data Privacy**:
  - No PII stored (stateless proxy)
  - Bitcoin addresses sanitized in production logs
  - 7-day log retention (GDPR compliant)

#### NFR-3: Scalability

- **Auto-Scaling**:
  - Lambda concurrency: 100 (can increase if needed)
  - API Gateway: Auto-scales to 10,000 req/sec
  - No manual intervention required for traffic spikes
- **Cost Optimization**:
  - Lambda memory: 256 MB (right-sized)
  - CloudWatch log retention: 7 days (balance cost vs debugging)
  - Reserved concurrency prevents runaway costs

#### NFR-4: Maintainability

- **Infrastructure as Code**:
  - All resources defined in CDK
  - Version controlled in Git
  - Reproducible deployments
- **Documentation**:
  - Deployment runbook
  - Troubleshooting guide
  - Architecture diagrams
  - API key rotation procedure
- **Monitoring**:
  - Real-time metrics
  - Automated alerts
  - Structured logs for debugging

#### NFR-5: Testability

- **Unit Tests**:
  - Lambda handler logic
  - Proxy logic (mocked Blockstream API)
  - Logger sanitization
- **Integration Tests**:
  - End-to-end API calls (staging environment)
  - Error handling (invalid addresses, network failures)
  - Rate limiting behavior
- **Load Tests**:
  - 100 concurrent requests
  - Measure p95/p99 latency
  - Verify rate limiting works

---

## Edge Cases & Error Handling

### Edge Case 1: Lambda Cold Start

**Scenario**: First request after Lambda has been idle for >15 minutes.

**Expected Behavior**:
- Latency: 1000-1500ms (vs normal 200-400ms)
- Extension shows loading indicator
- Request succeeds (may be slow but not error)

**Mitigation**:
- Acceptable for MVP (cold starts are rare with active users)
- Future: Provisioned concurrency (keeps Lambda warm, +$10/month)
- Extension: Implement timeout handling (retry after 30s)

**Acceptance Criteria**:
- Cold start latency <1500ms (measured in CloudWatch)
- Extension doesn't show error during cold start
- QA testing: Idle 20 minutes, then send transaction (should work)

---

### Edge Case 2: Blockstream API Unavailable

**Scenario**: Blockstream API is down or slow (>25 seconds).

**Expected Behavior**:
- Lambda returns 502 Bad Gateway
- Error message: "Failed to reach Blockstream API"
- Extension shows user-friendly error: "Blockchain service temporarily unavailable. Please try again."

**Mitigation**:
- Lambda timeout: 30 seconds (includes Blockstream call + overhead)
- Blockstream fetch timeout: 25 seconds (leaves 5s for Lambda processing)
- Retry logic in Lambda: 1 retry with 2-second delay
- Extension retry logic: Exponential backoff (1s, 2s, 4s)

**Acceptance Criteria**:
- Simulated Blockstream downtime returns 502 (not 500)
- Extension handles 502 gracefully (shows error message, no crash)
- CloudWatch alarm triggers for sustained errors (>5% for 5 min)

---

### Edge Case 3: Rate Limiting (Abuse Detection)

**Scenario**: Malicious actor floods proxy with requests.

**Expected Behavior**:
- API Gateway throttles: 1000 req/sec per IP
- Excess requests return 429 Too Many Requests
- Extension handles 429 with exponential backoff
- CloudWatch alarm triggers for >100k req/hour

**Mitigation**:
- API Gateway throttling: 1000 req/sec per IP
- Lambda concurrency limit: 100 (prevents cost overrun)
- CloudWatch alarm for anomalies
- Can add IP blocklisting if specific IPs abuse

**Acceptance Criteria**:
- Load test: 2000 rapid requests → some return 429
- Extension handles 429 without crashing (retries with backoff)
- CloudWatch alarm sent when threshold exceeded
- Manual test: Simulate abuse, verify throttling works

---

### Edge Case 4: Invalid API Key (Rotated or Expired)

**Scenario**: API key in Lambda is invalid (expired, revoked, typo during rotation).

**Expected Behavior**:
- Blockstream returns 401 Unauthorized or 403 Forbidden
- Lambda returns 502 Bad Gateway (Blockstream error)
- CloudWatch shows high error rate immediately
- Alarm triggers within 5 minutes
- DevOps team investigates and fixes key

**Mitigation**:
- Document key rotation procedure clearly
- Test key rotation in staging before production
- CloudWatch alarm for >5% error rate (catches immediately)
- Rollback plan: Revert to previous key or direct Blockstream

**Acceptance Criteria**:
- Simulated invalid key: Returns 502 (not crash)
- CloudWatch alarm triggers within 5 minutes
- QA testing: Rotate to invalid key, verify alarm works
- Rollback test: Invalid key → revert to valid key → wallet works

---

### Edge Case 5: Wallet Switches Networks (Testnet ↔ Mainnet)

**Scenario**: User switches from testnet to mainnet (future feature).

**Expected Behavior**:
- Extension passes `?network=mainnet` query parameter
- Lambda uses `BLOCKSTREAM_API_KEY_MAINNET` and `BLOCKSTREAM_BASE_URL_MAINNET`
- All API calls route to mainnet
- No extension restart required

**Mitigation**:
- Lambda checks `network` query parameter on every request
- Default to testnet if parameter missing (backward compatible)
- Validate network parameter: Must be "testnet" or "mainnet" (return 400 if invalid)

**Acceptance Criteria**:
- Unit test: `?network=mainnet` uses mainnet key
- Unit test: `?network=testnet` uses testnet key
- Unit test: `?network=invalid` returns 400 Bad Request
- Integration test: Switch networks, verify correct API called

---

### Edge Case 6: AWS Service Outage (Lambda/API Gateway Down)

**Scenario**: AWS region outage (rare but possible).

**Expected Behavior**:
- Extension shows error: "Service temporarily unavailable"
- No data loss (wallet stored locally, transactions re-broadcast after recovery)
- CloudWatch unavailable (AWS outage)
- Manual monitoring via AWS status page

**Mitigation**:
- Accept downtime during AWS outage (rare, usually <1 hour)
- Future: Multi-region deployment (adds complexity, cost)
- Rollback: Revert to direct Blockstream API in emergency

**Acceptance Criteria**:
- Extension handles network errors gracefully (no crash)
- Post-recovery: Wallet syncs automatically (no user action)
- Documentation includes rollback procedure for AWS outage

---

## Security Requirements

### SR-1: API Key Protection (CRITICAL)

**Requirement**: API keys MUST NEVER be exposed in client-side code.

**Implementation**:
- [ ] Keys stored in Lambda environment variables (AWS KMS encrypted)
- [ ] Keys never logged in CloudWatch (sanitize before logging)
- [ ] Keys never transmitted to client (Lambda adds header, not client)
- [ ] Keys never committed to Git (use parameter store or secrets manager)
- [ ] Separate keys for testnet and mainnet (key compromise isolation)

**Validation**:
- Manual inspection: Review extension files, search for "X-API-Key"
- Automated test: `grep -r "BLOCKSTREAM_API_KEY" dist/` returns 0 results
- Security audit: Security expert reviews Lambda environment variable configuration

**Threat Model**:
- Threat: Attacker installs extension, extracts files, searches for API key
- Mitigation: Key is on backend, not in extension files
- Residual Risk: None (API key physically not present in client code)

---

### SR-2: Rate Limiting & Abuse Prevention

**Requirement**: Prevent malicious usage that could drain API credits.

**Implementation**:
- [ ] API Gateway throttling: 1000 req/sec per IP
- [ ] API Gateway burst limit: 5000 requests
- [ ] Lambda concurrency limit: 100 (prevents cost overrun if throttling bypassed)
- [ ] CloudWatch alarm: >100k req/hour triggers investigation
- [ ] Extension handles 429 gracefully (exponential backoff, no infinite retries)

**Validation**:
- Load test: 2000 rapid requests → some throttled (429), no crashes
- Cost test: Simulate high load, verify Lambda concurrency limit prevents >$50/day cost
- Extension test: Trigger 429, verify backoff logic works

**Threat Model**:
- Threat: Attacker floods proxy with requests to consume credits
- Mitigation: Rate limiting per IP, concurrency limit
- Residual Risk: Low (attacker needs many IPs to bypass rate limiting)

---

### SR-3: Secure Logging (Privacy)

**Requirement**: Logs must not leak user data or API keys.

**Implementation**:
- [ ] API keys never logged (code review: No `console.log(apiKey)`)
- [ ] Bitcoin addresses sanitized in production logs (masked as `***ADDRESS***`)
- [ ] Transaction IDs logged (public data, useful for debugging)
- [ ] Request IDs for tracing (UUID, not sensitive)
- [ ] Log level: INFO in production (DEBUG only in dev)
- [ ] 7-day retention (GDPR compliant, not excessive)

**Validation**:
- Code review: Logger sanitizes sensitive data before logging
- Manual test: Review production logs, verify no Bitcoin addresses visible
- Privacy audit: Confirm GDPR compliance (no PII stored >7 days)

**Threat Model**:
- Threat: Attacker gains access to CloudWatch logs, extracts user addresses
- Mitigation: Addresses sanitized in production logs
- Residual Risk: Low (addresses not considered highly sensitive, but best to sanitize)

---

### SR-4: HTTPS & Transport Security

**Requirement**: All communication must be encrypted in transit.

**Implementation**:
- [ ] API Gateway requires HTTPS (HTTP not supported)
- [ ] TLS 1.3 (latest, most secure)
- [ ] Extension uses `https://` for all API calls (no `http://`)
- [ ] CORS limited to `chrome-extension://*` (no public access)

**Validation**:
- Code review: All API calls use `https://`
- Manual test: Attempt `http://` call → fails (API Gateway rejects)
- Network inspection: Verify TLS 1.3 used (Chrome DevTools)

**Threat Model**:
- Threat: Man-in-the-middle (MITM) attack intercepts API calls
- Mitigation: HTTPS with TLS 1.3
- Residual Risk: None (HTTPS with proper TLS eliminates MITM)

---

### SR-5: IAM Least Privilege

**Requirement**: Lambda function has minimal IAM permissions.

**Implementation**:
- [ ] Lambda execution role:
  - `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` (CloudWatch)
  - No access to S3, DynamoDB, or other AWS services (not needed)
- [ ] API Gateway has permission to invoke Lambda (managed by CDK)
- [ ] No overly broad permissions (e.g., `*` actions)

**Validation**:
- IAM policy review: Security expert approves Lambda role
- CDK snapshot test: Verify generated IAM policy is correct
- Principle of least privilege: Function can only log and respond to API Gateway

**Threat Model**:
- Threat: Lambda compromised, attacker uses permissions to access other AWS resources
- Mitigation: Minimal permissions (only CloudWatch logs)
- Residual Risk: Low (Lambda has no access to sensitive AWS resources)

---

## User Experience Impact

### Positive Impacts

1. **Faster & More Reliable API Calls**
   - Using paid Blockstream API (higher rate limits)
   - No more "rate limit exceeded" errors
   - Better SLA than public API

2. **Transparent Migration**
   - Users don't see any changes (same UI, same features)
   - No new authentication or configuration required
   - Seamless deployment via Chrome Web Store update

3. **Future-Proof Architecture**
   - Easy to switch to self-hosted Esplora later
   - Proxy can add caching for instant responses
   - Abstraction layer hides API complexity

### Potential Negative Impacts (Mitigated)

1. **Latency Increase (~50-200ms)**
   - **Impact**: API calls now go through Lambda (adds ~50-200ms)
   - **Mitigation**:
     - Lambda in same region as Blockstream API
     - Optimized Lambda runtime (Node.js 20.x, 256MB memory)
     - p95 latency <500ms (acceptable for wallet operations)
   - **Acceptance**: Users don't notice <500ms delays

2. **Cold Start Delays (1000-1500ms)**
   - **Impact**: First call after idle has higher latency
   - **Mitigation**:
     - Cold starts rare with active users
     - Extension shows loading indicator
     - Future: Provisioned concurrency if needed
   - **Acceptance**: Rare occurrence, acceptable tradeoff

3. **Dependency on AWS**
   - **Impact**: Wallet requires AWS infrastructure (Lambda, API Gateway)
   - **Mitigation**:
     - AWS has high SLA (99.95% for Lambda, 99.95% for API Gateway)
     - Rollback plan: Revert to direct Blockstream API
     - Future: Multi-region deployment if needed
   - **Acceptance**: AWS outages rare, rollback plan exists

### UX Testing Plan

**Pre-Deployment (Staging)**:
1. Compare latency: Direct API vs Proxy (measure p50/p95/p99)
2. Test all user flows: Create wallet, send, receive, view transactions
3. Test error scenarios: Network offline, Blockstream down, invalid address
4. Test cold start: Idle 20 minutes, then send transaction

**Post-Deployment (Production)**:
1. Monitor CloudWatch metrics: Duration, errors, invocations
2. User feedback: Any reported slowness or errors?
3. A/B test (optional): 50% proxy, 50% direct (measure perceived performance)

**Success Criteria**:
- No user-reported performance degradation
- p95 latency <500ms sustained over 7 days
- Error rate <1% under normal load

---

## Rollback Plan

### When to Rollback

**Trigger conditions** (any one of these):
1. Error rate >10% sustained for >15 minutes
2. p95 latency >2000ms sustained for >15 minutes
3. AWS service outage in our region
4. Critical bug discovered (data loss, security vulnerability)
5. Unexpectedly high costs (>$50/day)

### Rollback Procedure (Emergency)

**Time to Complete**: <10 minutes

**Steps**:

1. **Revert to Direct Blockstream API** (No Lambda)
   ```bash
   # In bitcoin_wallet/.env.local
   # Comment out or delete BLOCKSTREAM_PROXY_URL
   # BLOCKSTREAM_PROXY_URL=https://...  # <-- Remove this line

   # Rebuild extension
   npm run build
   ```

2. **Reload Extension in Chrome**
   - Go to `chrome://extensions/`
   - Click "Reload" on Bitcoin Wallet extension
   - Verify: Open extension, check Network tab → should call `blockstream.info` directly

3. **Verify Wallet Functionality**
   - Open Dashboard → balance loads
   - View transaction history → transactions displayed
   - Test send transaction (testnet) → broadcasts successfully

4. **Notify Users** (if extension already published)
   - Post update on GitHub: "Temporarily using public API due to Lambda issue"
   - Inform users rate limits are lower (10 req/min)
   - ETA for Lambda fix

5. **Post-Mortem**
   - Review CloudWatch logs (what went wrong?)
   - Fix Lambda issue in staging
   - Test extensively before redeploying
   - Update rollback documentation with lessons learned

---

### Rollback Procedure (Planned Maintenance)

**Use Case**: Need to make breaking changes to Lambda, want zero downtime.

**Steps**:

1. **Deploy Rollback Build** (uses direct API)
   ```bash
   # Remove BLOCKSTREAM_PROXY_URL from .env.local
   npm run build
   # Publish to Chrome Web Store as v0.10.1
   ```

2. **Wait for Users to Update** (~24-48 hours)
   - Chrome auto-updates extensions
   - Monitor: Check number of extension installs on old version

3. **Make Lambda Changes**
   - Deploy breaking Lambda changes
   - Test extensively in staging

4. **Deploy Proxy Build** (uses Lambda again)
   ```bash
   # Add BLOCKSTREAM_PROXY_URL back to .env.local
   npm run build
   # Publish to Chrome Web Store as v0.10.2
   ```

**Downside**: Requires 2 extension releases. **Upside**: Zero downtime, no user impact.

---

## Risk Assessment

### High Risk (P0 - Must Mitigate Before Launch)

#### Risk 1: API Key Exposure

**Description**: API key accidentally committed to Git or bundled in extension.

**Likelihood**: Medium (common mistake)
**Impact**: Critical (financial loss, security breach)

**Mitigation**:
- [ ] Code review: Security expert checks for API keys in code
- [ ] Automated test: `grep -r "BLOCKSTREAM_API_KEY" dist/` in CI/CD
- [ ] Documentation: Clear instructions for key management
- [ ] `.gitignore`: Ensure `.env.local` and AWS config files excluded

**Residual Risk**: Low (multiple safeguards in place)

---

#### Risk 2: Lambda Deployment Failure

**Description**: CDK deployment fails, proxy unavailable at launch.

**Likelihood**: Medium (first-time deployment issues common)
**Impact**: High (blocks Chrome Web Store publication)

**Mitigation**:
- [ ] Staging deployment: Deploy to dev environment first
- [ ] Deployment runbook: Step-by-step instructions tested by QA
- [ ] Pre-deployment checklist: Verify AWS account, IAM permissions, CDK installed
- [ ] Backup plan: Rollback to direct Blockstream API if deployment fails

**Residual Risk**: Low (comprehensive testing and documentation)

---

#### Risk 3: Unexpectedly High Costs

**Description**: Lambda usage exceeds budget (abuse or traffic spike).

**Likelihood**: Low (rate limiting prevents most abuse)
**Impact**: High (financial, but capped by concurrency limit)

**Mitigation**:
- [ ] Lambda concurrency limit: 100 (max ~$150/month)
- [ ] CloudWatch alarm: >100k req/hour triggers investigation
- [ ] AWS budget alert: >$50/month triggers email
- [ ] Rate limiting: 1000 req/sec per IP

**Residual Risk**: Low (multiple cost safeguards, hard cap at 100 concurrency)

---

### Medium Risk (P1 - Monitor and Mitigate)

#### Risk 4: Latency Regression

**Description**: Lambda proxy adds latency, users complain wallet is slow.

**Likelihood**: Low (design targets <500ms p95)
**Impact**: Medium (poor UX, negative reviews)

**Mitigation**:
- [ ] Performance testing: Load test in staging before launch
- [ ] Monitoring: CloudWatch tracks p95/p99 latency
- [ ] Optimization: Increase Lambda memory if needed (faster CPU)
- [ ] Future: Add caching layer (ElastiCache) if latency issues

**Residual Risk**: Low (design accounts for latency, monitoring catches issues early)

---

#### Risk 5: Blockstream API Changes

**Description**: Blockstream changes API endpoints or authentication.

**Likelihood**: Low (stable API, public documentation)
**Impact**: Medium (proxy breaks, requires Lambda update)

**Mitigation**:
- [ ] Monitor Blockstream API changelog
- [ ] Integration tests: Detect API changes early
- [ ] Lambda update process: CDK makes updates easy (deploy new version)
- [ ] Rollback: Direct Blockstream API if Lambda breaks

**Residual Risk**: Low (proxy is thin layer, easy to update)

---

### Low Risk (P2 - Accept or Monitor)

#### Risk 6: AWS Service Outage

**Description**: AWS Lambda or API Gateway unavailable (region outage).

**Likelihood**: Very Low (AWS SLA >99.95%)
**Impact**: High (wallet unavailable during outage)

**Mitigation**:
- [ ] Accept risk: AWS outages rare (2-3 times/year, <1 hour each)
- [ ] Rollback plan: Revert to direct Blockstream API in emergency
- [ ] Future: Multi-region deployment (adds complexity, cost)

**Residual Risk**: Low (outages rare, rollback plan exists)

---

#### Risk 7: CORS Misconfiguration

**Description**: CORS headers incorrect, extension cannot call Lambda.

**Likelihood**: Very Low (CDK configures CORS automatically)
**Impact**: Medium (wallet non-functional, but easy to fix)

**Mitigation**:
- [ ] Integration test: Extension calls proxy in staging before production
- [ ] CDK template: CORS headers verified in code review
- [ ] Rollback: Easy to redeploy Lambda with corrected CORS

**Residual Risk**: Very Low (CDK handles CORS, tested before production)

---

## Questions for Technical Teams

### For Backend Developer

1. **Lambda Implementation**:
   - Q: Should we use Node.js 20.x or 18.x runtime? (Recommendation: 20.x for latest features)
   - Q: Is 256MB memory sufficient, or should we benchmark with 512MB? (256MB likely fine for proxying)
   - Q: Should we bundle Lambda with Webpack or deploy raw TypeScript? (Webpack for smaller bundle, faster cold starts)

2. **API Gateway Configuration**:
   - Q: REST API or HTTP API? (Recommendation: REST API for more control, throttling)
   - Q: Should we use custom domain (e.g., `api.bitcoinwallet.com`) or API Gateway URL? (API Gateway URL acceptable for MVP)
   - Q: What stage name? (Recommendation: `dev`, `staging`, `production`)

3. **Error Handling**:
   - Q: Should Lambda retry Blockstream calls internally, or let extension handle retries? (Recommendation: Lambda retries once, extension retries with backoff)
   - Q: How should Lambda handle malformed requests (e.g., invalid network parameter)? (Return 400 Bad Request)

4. **Deployment**:
   - Q: Should we use CDK Pipelines for CI/CD, or manual `cdk deploy`? (Manual for MVP, CI/CD later)
   - Q: How do we manage API keys across environments? (Pass as parameters during `cdk deploy`, store in Parameter Store for automation)

---

### For Security Expert

1. **Key Management**:
   - Q: Should we use Lambda environment variables or AWS Secrets Manager for API keys? (Recommendation: Environment variables for MVP, Secrets Manager for production-grade)
   - Q: How often should we rotate API keys? (Recommendation: 90 days)
   - Q: Should we encrypt Lambda environment variables with custom KMS key or default AWS key? (Default key sufficient for MVP)

2. **Logging & Privacy**:
   - Q: Should we log Bitcoin addresses at all, even sanitized? (Recommendation: Sanitize in production, log in dev for debugging)
   - Q: What log retention period balances debugging needs and privacy? (Recommendation: 7 days)
   - Q: Should we implement request signing (HMAC) between extension and Lambda? (Not needed for MVP, optional enhancement)

3. **Rate Limiting**:
   - Q: Is 1000 req/sec per IP sufficient, or too restrictive? (Recommendation: Start with 1000, adjust based on usage)
   - Q: Should we implement API key authentication for the extension? (Not needed for MVP, Chrome extension origin is sufficient)

4. **Threat Model**:
   - Q: Are there any attack vectors we're missing in the threat model? (Security expert should review)
   - Q: Should we implement additional abuse prevention (e.g., CAPTCHA, IP allowlisting)? (Not needed for MVP)

---

### For Frontend Developer

1. **Extension Configuration**:
   - Q: Should `BLOCKSTREAM_PROXY_URL` be required or optional? (Optional - enables dev builds without proxy)
   - Q: How should extension handle 502 errors (Blockstream down)? (Show user-friendly error, retry with exponential backoff)
   - Q: Should we add a "Proxy Status" indicator in settings? (Nice to have, not MVP)

2. **Error Handling**:
   - Q: What user-facing error messages for different failure modes? (See UX Designer for copy)
   - Q: Should we implement request queuing if proxy is slow/down? (Not needed for MVP, exponential backoff sufficient)

3. **Testing**:
   - Q: Should unit tests mock the proxy, or test against real proxy? (Mock for unit tests, integration tests against staging proxy)
   - Q: How do we test cold start behavior in staging? (Manual test: Idle 20 min, then send transaction)

---

### For UI/UX Designer

1. **Error Messages**:
   - Q: What copy should we show for different error types? (Designer should provide user-friendly error messages)
   - Q: Should we add a "Retry" button in error states? (Yes, good UX)
   - Q: Should we show technical details (e.g., request ID) in error messages? (Optional, for advanced users/debugging)

2. **Loading States**:
   - Q: Should we show a loading indicator for API calls >1 second? (Yes, improves perceived performance)
   - Q: Should we show different loading messages for different operations (e.g., "Broadcasting transaction...")? (Nice to have, not MVP)

3. **Settings Screen**:
   - Q: Should we add a "Network Status" section showing proxy health? (Nice to have, not MVP)
   - Q: Should we show API latency metrics to users? (No, not useful for most users)

---

### For Blockchain Expert

1. **API Compatibility**:
   - Q: Does Lambda proxy maintain full compatibility with Blockstream Esplora API? (Should be transparent, verify with integration tests)
   - Q: Are there any Bitcoin-specific edge cases we need to handle (e.g., reorgs during proxy call)? (Blockstream handles reorgs, proxy is transparent)

2. **Transaction Broadcasting**:
   - Q: Should Lambda validate transaction hex before forwarding to Blockstream? (No, Blockstream validates - Lambda just proxies)
   - Q: Should Lambda implement transaction caching/deduplication? (Not needed for MVP, Blockstream handles duplicates)

3. **Future Enhancements**:
   - Q: When should we migrate to self-hosted Esplora? (When costs >$100/month or need lower latency)
   - Q: Should Lambda support multiple blockchain APIs (e.g., fallback to Mempool.space)? (Nice to have, not MVP)

---

### For QA Engineer

1. **Testing Environments**:
   - Q: Should we deploy separate proxies for dev, staging, production? (Yes, isolate environments)
   - Q: How do we test Lambda without affecting production metrics? (Use staging environment)

2. **Test Cases**:
   - Q: What are the critical test cases for proxy? (See Test Plan section below)
   - Q: Should we implement automated load testing? (Yes, before production deployment)

3. **Monitoring**:
   - Q: What CloudWatch metrics should QA monitor during testing? (Invocations, errors, duration)
   - Q: How do we simulate different failure modes (e.g., Blockstream down)? (Mock Blockstream API in tests)

---

## Implementation Phases

### Phase 1: Infrastructure Setup (2 hours)

**Owner**: Backend Developer

**Tasks**:
1. Create `infrastructure/lambda-proxy/` directory structure
2. Initialize CDK project (`cdk init app --language=typescript`)
3. Install dependencies (CDK, AWS SDK, TypeScript)
4. Initialize Lambda project (`cd lambda && npm init`)
5. Install Lambda dependencies (`node-fetch`, `typescript`, `webpack`)
6. Configure TypeScript (`tsconfig.json` for both CDK and Lambda)
7. Configure Webpack for Lambda bundling

**Deliverables**:
- ✅ CDK project initialized
- ✅ Lambda project initialized
- ✅ All dependencies installed
- ✅ TypeScript compiling without errors
- ✅ Webpack bundling Lambda code successfully

**Acceptance Criteria**:
- `npm run build` succeeds in CDK project
- `npm run build` succeeds in Lambda project
- No TypeScript errors

---

### Phase 2: Lambda Implementation (3 hours)

**Owner**: Backend Developer

**Tasks**:
1. Write Lambda handler (`lambda/src/index.ts`)
   - Parse API Gateway event
   - Extract path and network parameter
   - Call proxy logic
   - Return response with CORS headers
   - Error handling
2. Write proxy logic (`lambda/src/blockstream-proxy.ts`)
   - Build Blockstream URL
   - Add API key header
   - Fetch from Blockstream
   - Handle timeouts
   - Return result
3. Write logger (`lambda/src/logger.ts`)
   - Structured JSON logging
   - Log level filtering
   - Sensitive data sanitization
4. Write TypeScript types (`lambda/src/types.ts`)
5. Test Lambda locally (mock API Gateway event)

**Deliverables**:
- ✅ Lambda handler implemented
- ✅ Proxy logic tested with mock Blockstream API
- ✅ Logger sanitizes API keys and addresses
- ✅ Webpack bundle <1MB

**Acceptance Criteria**:
- Unit tests pass (80% coverage minimum)
- Local test: Mock API Gateway event → Lambda returns correct response
- Code review: Security expert approves logging implementation

---

### Phase 3: CDK Infrastructure (2 hours)

**Owner**: Backend Developer

**Tasks**:
1. Create Lambda construct (`lib/constructs/lambda-construct.ts`)
   - Function configuration (runtime, memory, timeout)
   - Environment variables
   - IAM role (CloudWatch logs only)
   - Log retention (7 days)
2. Create API Gateway construct (`lib/constructs/api-gateway-construct.ts`)
   - REST API definition
   - CORS configuration
   - Lambda integration
   - Throttling settings
3. Create monitoring construct (`lib/constructs/monitoring-construct.ts`)
   - CloudWatch dashboard
   - Alarms (errors, duration, invocations)
   - SNS topic
4. Assemble main stack (`lib/proxy-stack.ts`)
   - Instantiate all constructs
   - Define outputs (API URL, Lambda name)
5. Test CDK synthesis (`cdk synth`)

**Deliverables**:
- ✅ All CDK constructs implemented
- ✅ Stack synthesizes without errors
- ✅ CloudFormation template generated (`cdk.out/`)
- ✅ CDK snapshot tests pass

**Acceptance Criteria**:
- `cdk synth` succeeds
- Generated CloudFormation template reviewed
- IAM policy follows least privilege (security expert approval)

---

### Phase 4: Deployment to Staging (1 hour)

**Owner**: Backend Developer + QA Engineer

**Tasks**:
1. Configure AWS credentials (`aws configure`)
2. Bootstrap CDK (first time only): `cdk bootstrap`
3. Deploy stack to staging:
   ```bash
   cdk deploy BlockstreamProxyStack-staging \
     --parameters BlockstreamApiKeyTestnet=YOUR_KEY_HERE
   ```
4. Note API Gateway URL from outputs
5. Test deployed API manually:
   ```bash
   curl https://YOUR_API_URL/blocks/tip/height
   ```
6. Verify CloudWatch logs and metrics

**Deliverables**:
- ✅ Stack deployed to AWS
- ✅ API Gateway URL retrieved
- ✅ API responding correctly
- ✅ CloudWatch logs visible
- ✅ CloudWatch dashboard showing metrics

**Acceptance Criteria**:
- API returns correct data (matches Blockstream direct)
- CloudWatch shows invocations and duration
- No deployment errors

---

### Phase 5: Extension Integration (1 hour)

**Owner**: Frontend Developer

**Tasks**:
1. Update BlockstreamClient.ts:
   ```typescript
   const proxyUrl = process.env.BLOCKSTREAM_PROXY_URL;
   if (proxyUrl) {
     this.baseUrl = `${proxyUrl}?network=${network}`;
   } else {
     this.baseUrl = network === 'mainnet'
       ? 'https://blockstream.info/api'
       : 'https://blockstream.info/testnet/api';
   }
   ```
2. Update webpack.config.js:
   ```javascript
   new webpack.DefinePlugin({
     'process.env.BLOCKSTREAM_PROXY_URL': JSON.stringify(process.env.BLOCKSTREAM_PROXY_URL),
   }),
   ```
3. Update `.env.local.example`:
   ```bash
   # Production: Lambda proxy (API key secure on backend)
   BLOCKSTREAM_PROXY_URL=https://YOUR_API_URL
   ```
4. Rebuild extension: `npm run build`
5. Test in Chrome:
   - Load unpacked extension
   - Open Dashboard
   - Check Network tab → should call proxy URL
   - Verify balance loads correctly
   - Test send transaction

**Deliverables**:
- ✅ BlockstreamClient updated
- ✅ Environment variables configured
- ✅ Extension rebuilt with proxy URL
- ✅ Extension tested in Chrome (dev environment)

**Acceptance Criteria**:
- Extension loads Dashboard in <2 seconds
- Network tab shows calls to proxy URL (not Blockstream direct)
- Send transaction works (testnet)
- No JavaScript errors in console

---

### Phase 6: Testing & Validation (2 hours)

**Owner**: QA Engineer + Testing Expert

**Tasks**:

1. **Functional Testing**:
   - Test all API endpoints through proxy (address, UTXOs, transactions, broadcast, fees)
   - Compare responses: Proxy vs Blockstream direct (should match exactly)
   - Test error handling: Invalid address, network error, timeout
   - Test transaction broadcasting (testnet)

2. **Security Testing**:
   - Inspect extension files: Search for API key (should not be found)
   - Check CloudWatch logs: No API key logged
   - Test CORS: Direct browser call to proxy (should fail)
   - Test rate limiting: 2000 rapid requests (some throttled)

3. **Performance Testing**:
   - Measure latency: 100 consecutive address lookups
   - Calculate p50, p95, p99 latency
   - Test cold start: Idle 20 minutes, then call API (latency <1500ms)
   - Load test: 100 concurrent requests (all succeed)

4. **Cost Validation**:
   - Check AWS Cost Explorer (should be <$1 for testing)
   - Verify Lambda invocation count in CloudWatch
   - Estimate monthly cost based on expected usage

**Deliverables**:
- ✅ All functional tests passed
- ✅ Security verified (API key protected)
- ✅ Performance acceptable (p95 <500ms)
- ✅ Cost estimate confirmed (<$10/month)
- ✅ Test report documented

**Acceptance Criteria**:
- All critical user flows work through proxy
- No API key found in extension files
- p95 latency <500ms
- Error rate <1%
- Load test: 100 concurrent requests succeed

---

### Phase 7: Documentation (1 hour)

**Owner**: Backend Developer + Product Manager

**Tasks**:
1. Create deployment runbook (`infrastructure/lambda-proxy/README.md`):
   - Prerequisites (AWS account, CLI, CDK, Node.js)
   - Step-by-step deployment instructions
   - Configuration guide (API keys, environment variables)
   - Troubleshooting section
2. Update project documentation:
   - `CLAUDE.md`: Reference Lambda proxy
   - `ARCHITECTURE.md`: Add proxy architecture diagram
   - `README.md`: Note that proxy is required for production
3. Document monitoring:
   - CloudWatch dashboard usage
   - Alarm interpretation
   - SNS alert configuration
4. Document rollback procedure:
   - When to rollback
   - Rollback steps
   - Post-rollback verification

**Deliverables**:
- ✅ Deployment runbook complete
- ✅ Project documentation updated
- ✅ Monitoring guide documented
- ✅ Rollback procedure documented

**Acceptance Criteria**:
- New developer can deploy proxy following documentation (tested by QA)
- All architecture documents reference proxy
- Troubleshooting guide covers common issues

---

### Phase 8: Production Deployment (30 minutes)

**Owner**: Backend Developer + Product Manager

**Tasks**:
1. Review pre-deployment checklist (see Approval Checklist below)
2. Deploy to production:
   ```bash
   cdk deploy BlockstreamProxyStack-production \
     --parameters BlockstreamApiKeyTestnet=PROD_TESTNET_KEY \
     --parameters BlockstreamApiKeyMainnet=PROD_MAINNET_KEY \
     --require-approval never
   ```
3. Note production API Gateway URL
4. Update extension `.env.local`:
   ```bash
   BLOCKSTREAM_PROXY_URL=https://PROD_API_URL
   ```
5. Rebuild extension: `npm run build`
6. Test in Chrome (final verification):
   - Load extension
   - Test all critical flows
   - Verify proxy URL in Network tab
7. Package extension for Chrome Web Store:
   ```bash
   cd dist && zip -r ../bitcoin-wallet-v0.10.1.zip . && cd ..
   ```
8. Monitor CloudWatch for first 24 hours

**Deliverables**:
- ✅ Production stack deployed
- ✅ Extension built with production proxy URL
- ✅ Extension packaged for Chrome Web Store
- ✅ Monitoring active (CloudWatch + alarms)

**Acceptance Criteria**:
- Production deployment succeeds
- Extension works with production proxy
- CloudWatch shows successful requests
- No alarms triggered

---

## Approval Checklist

### Pre-Implementation Approval

**Required Sign-Offs:**
- [ ] Product Manager: Requirements approved
- [ ] Security Expert: Security requirements approved
- [ ] Backend Developer: Technical approach feasible
- [ ] Frontend Developer: Extension changes feasible
- [ ] UI/UX Designer: Error messages reviewed
- [ ] Blockchain Expert: API compatibility verified

**Documentation:**
- [ ] PRD reviewed by all stakeholders
- [ ] Technical implementation plan reviewed
- [ ] Cost estimate approved (<$10/month target)

---

### Pre-Deployment Approval (Staging)

**Security Checklist:**
- [ ] API keys NOT in extension code (manual inspection)
- [ ] API keys NOT in Git repository (`.gitignore` verified)
- [ ] Lambda environment variables encrypted (KMS)
- [ ] CloudWatch logs sanitized (no API keys, addresses masked)
- [ ] IAM policy follows least privilege
- [ ] CORS configured correctly (extension origin only)

**Testing Checklist:**
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] Load testing completed (100 concurrent requests)
- [ ] Performance testing completed (p95 <500ms)
- [ ] Security testing completed (no API key found)
- [ ] Cost validation completed (within budget)

**Infrastructure Checklist:**
- [ ] CDK stack deploys successfully
- [ ] CloudWatch dashboard shows metrics
- [ ] CloudWatch alarms configured and tested
- [ ] SNS topic configured (email received)
- [ ] 7-day log retention configured

**Documentation Checklist:**
- [ ] Deployment runbook complete
- [ ] Rollback procedure documented
- [ ] Monitoring guide documented
- [ ] Troubleshooting guide documented

---

### Pre-Production Approval

**Final Verification:**
- [ ] Staging deployment stable for 48 hours (no errors)
- [ ] QA sign-off (all test cases passed)
- [ ] Security expert sign-off (final audit)
- [ ] Backend developer sign-off (infrastructure ready)
- [ ] Frontend developer sign-off (extension integration tested)
- [ ] Product manager sign-off (requirements met)

**Chrome Web Store Readiness:**
- [ ] Extension built with production proxy URL
- [ ] Extension packaged for Chrome Web Store
- [ ] API key NOT in extension bundle (final check)
- [ ] Privacy policy updated (if needed)
- [ ] Chrome Web Store listing updated (screenshots, description)

**Monitoring & Alerts:**
- [ ] CloudWatch alarms configured for production
- [ ] SNS topic configured with team email
- [ ] On-call schedule defined (who responds to alarms?)
- [ ] Runbook accessible (where to find documentation?)

**Rollback Plan:**
- [ ] Rollback procedure tested in staging
- [ ] Rollback decision criteria defined
- [ ] Emergency contact list available

---

## Final Approval

**Product Manager Approval:**
- [ ] All requirements met (functional, non-functional, security)
- [ ] Success metrics defined and measurable
- [ ] Risk assessment complete and acceptable
- [ ] Implementation plan approved

**Ready for Production:** ✅ / ❌

**Approved By**: ______________________ Date: __________

**Notes**:

---

**End of Product Requirements Document**

---

## Appendix A: Test Plan (Detailed)

### Unit Tests (Lambda)

**File**: `infrastructure/lambda-proxy/lambda/test/handler.test.ts`

**Test Cases**:
1. Test handler with valid GET request → returns 200
2. Test handler with valid POST request (broadcast) → returns 200
3. Test handler with invalid network parameter → returns 400
4. Test handler with missing path parameter → returns 400
5. Test handler with Blockstream timeout → returns 502
6. Test handler with Blockstream 404 → returns 502
7. Test logger sanitizes API keys → no keys in log output
8. Test logger sanitizes Bitcoin addresses (production) → addresses masked
9. Test CORS headers added to all responses

**Coverage Target**: >80%

---

### Integration Tests (End-to-End)

**File**: `infrastructure/lambda-proxy/test/integration.test.ts`

**Test Cases**:
1. Call proxy: GET `/address/{testnet_address}` → returns valid balance
2. Call proxy: GET `/address/{testnet_address}/txs` → returns transactions
3. Call proxy: GET `/address/{testnet_address}/utxo` → returns UTXOs
4. Call proxy: POST `/tx` with valid hex → returns txid
5. Call proxy: POST `/tx` with invalid hex → returns 400
6. Call proxy: GET `/fee-estimates` → returns fee object
7. Call proxy with invalid network → returns 400
8. Call proxy with malformed path → returns 400

**Environment**: Staging (real AWS infrastructure)

**Prerequisites**:
- Staging stack deployed
- Test Bitcoin addresses with known balances/transactions
- Test transaction hex (pre-signed, testnet)

---

### Load Tests (Performance)

**Tool**: Apache Bench or Artillery

**Test Case 1: Sustained Load**
- Requests: 1000 total
- Concurrency: 10
- Endpoint: GET `/address/{testnet_address}`
- Success Criteria: All requests succeed, p95 <500ms

**Test Case 2: Burst Load**
- Requests: 2000 rapid
- Concurrency: 100
- Endpoint: GET `/fee-estimates`
- Success Criteria: Some throttled (429), no crashes, p95 <1000ms

**Test Case 3: Cold Start**
- Idle Lambda for 20 minutes
- Send single request: GET `/blocks/tip/height`
- Success Criteria: Latency <1500ms

---

### Security Tests

**Test Case 1: API Key Extraction**
```bash
# Build extension with proxy URL
npm run build

# Inspect extension files
cd dist
grep -r "BLOCKSTREAM_API_KEY" .
grep -r "X-API-Key" .

# Expected: 0 results
```

**Test Case 2: CloudWatch Log Inspection**
```bash
# Trigger test requests (address lookups, broadcasts)
# View CloudWatch logs
aws logs tail /aws/lambda/BlockstreamProxyStack-staging-ProxyLambda...

# Expected: No API keys, addresses masked in production
```

**Test Case 3: CORS Validation**
```javascript
// Direct browser call (should fail due to CORS)
fetch('https://YOUR_API_URL/blocks/tip/height')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);

// Expected: CORS error (blocked by browser)
```

**Test Case 4: Rate Limiting**
```bash
# Send 2000 rapid requests
for i in {1..2000}; do
  curl https://YOUR_API_URL/fee-estimates &
done

# Expected: Some return 429 (rate limited)
```

---

## Appendix B: Cost Breakdown (Detailed)

### AWS Free Tier (First 12 Months)

**Lambda**:
- 1 million requests/month FREE
- 400,000 GB-seconds compute time FREE
- After free tier: $0.20 per 1 million requests
- Compute: $0.0000166667 per GB-second

**API Gateway**:
- 1 million API calls/month FREE (first 12 months only)
- After free tier: $3.50 per 1 million requests

**CloudWatch**:
- 10 custom metrics FREE
- 5 GB log ingestion FREE
- 1 dashboard with up to 50 metrics FREE
- After free tier: Minimal for this use case

---

### Monthly Cost Estimate (After Free Tier)

**Scenario 1: Light Usage (10k requests/month)**
```
Lambda Invocations:
  10,000 × $0.20 / 1M = $0.002

Lambda Compute (256 MB, 500ms avg):
  10,000 × 0.5s × 0.25 GB × $0.0000166667 = $0.021

API Gateway:
  10,000 × $3.50 / 1M = $0.035

CloudWatch Logs (50 MB):
  50 MB × $0.50/GB = $0.025

Total: ~$0.08/month
```

---

**Scenario 2: Moderate Usage (100k requests/month)** ← **EXPECTED**
```
Lambda Invocations:
  100,000 × $0.20 / 1M = $0.02

Lambda Compute (256 MB, 500ms avg):
  100,000 × 0.5s × 0.25 GB × $0.0000166667 = $0.21

API Gateway:
  100,000 × $3.50 / 1M = $0.35

CloudWatch Logs (500 MB):
  500 MB × $0.50/GB = $0.25

Total: ~$0.83/month
```

---

**Scenario 3: Heavy Usage (500k requests/month)**
```
Lambda Invocations:
  500,000 × $0.20 / 1M = $0.10

Lambda Compute:
  500,000 × 0.5s × 0.25 GB × $0.0000166667 = $1.04

API Gateway:
  500,000 × $3.50 / 1M = $1.75

CloudWatch Logs (2.5 GB):
  2.5 GB × $0.50/GB = $1.25

Total: ~$4.14/month
```

---

**Scenario 4: Very Heavy Usage (1M requests/month)** ← **MAX BEFORE OPTIMIZATION**
```
Lambda Invocations:
  1,000,000 × $0.20 / 1M = $0.20

Lambda Compute:
  1,000,000 × 0.5s × 0.25 GB × $0.0000166667 = $2.08

API Gateway:
  1,000,000 × $3.50 / 1M = $3.50

CloudWatch Logs (5 GB):
  5 GB × $0.50/GB = $2.50

Total: ~$8.28/month
```

---

### Cost Optimization Strategies

**If costs exceed $10/month:**
1. Add response caching (ElastiCache Redis): Reduce Blockstream API calls by 80-90%
2. Increase Lambda memory (faster execution = lower compute cost)
3. Reduce CloudWatch log retention (7 days → 3 days)
4. Optimize Lambda code (reduce cold starts, faster processing)

**If costs exceed $50/month:**
1. Implement self-hosted Esplora (see `SELF_HOSTED_ESPLORA_AWS_PLAN.md`)
2. Lambda proxy can switch to self-hosted (no extension changes)

---

## Appendix C: Useful CloudWatch Insights Queries

### Query 1: Find All Errors
```
fields @timestamp, message, context.error, context.stack
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

### Query 2: Slow Requests (>2 seconds)
```
fields @timestamp, context.path, context.duration, context.requestId
| filter context.duration > 2000
| sort context.duration desc
| limit 50
```

### Query 3: Requests by Network
```
fields @timestamp, context.network
| stats count() by context.network
```

### Query 4: Average Duration by Endpoint
```
fields context.path, context.duration
| filter context.path not like ""
| stats avg(context.duration) as avg_ms, max(context.duration) as max_ms by context.path
| sort avg_ms desc
```

### Query 5: Error Rate Over Time
```
fields @timestamp
| stats count(*) as total, sum(level = "ERROR") as errors by bin(5m)
| fields bin, total, errors, (errors / total * 100) as error_rate
```

---

**END OF DOCUMENT**
