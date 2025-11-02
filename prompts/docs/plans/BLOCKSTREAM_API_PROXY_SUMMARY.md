# Blockstream API Proxy - Executive Summary

**Status**: 📋 Ready for Implementation
**Priority**: P0 - CRITICAL (Blocks Chrome Web Store Publication)
**Created**: 2025-10-28
**Estimated Effort**: 6-8 hours
**Estimated Cost**: $5-10/month
**Risk Level**: LOW (well-understood technology, clear implementation path)

---

## TL;DR (30 Second Summary)

**Problem**: We can't publish to Chrome Web Store with Blockstream API key in extension code (anyone can extract it and steal our credits).

**Solution**: AWS Lambda proxy keeps API key secure on backend, wallet calls proxy instead of Blockstream directly.

**Impact**:
- ✅ Secure (API key protected)
- ✅ Quick (6-8 hours to implement)
- ✅ Cheap ($5-10/month)
- ✅ Unblocks Chrome Web Store publication

**Next Step**: Deploy Lambda proxy, rebuild extension, test, publish.

---

## The Critical Security Issue

### Current Development Setup (NOT Production-Ready)

```
Extension Code → Blockstream Public API
(No API key)     (Rate limited: 10 req/min)
```

**Problems**:
- Rate limiting too restrictive (10 requests/minute)
- Public API can be slow/unreliable
- No monitoring or control

---

### Attempted Solution (INSECURE - DO NOT USE)

```
Extension Code → Blockstream Paid API
(Has API key)    (Higher limits, uses credits)
```

**CRITICAL SECURITY FLAW**:

Chrome extensions are **client-side applications**. Anyone who installs the extension can:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" to view source files
4. Search `background.js` for API key
5. **STEAL YOUR API KEY** and use YOUR credits

**Real-World Impact**:
- ❌ Anyone can extract and steal your Blockstream API key
- ❌ They can consume YOUR paid credits (you pay for their usage)
- ❌ Potential cost: $100s-$1000s if abused
- ❌ No way to revoke without republishing extension
- ❌ **BLOCKS CHROME WEB STORE PUBLICATION**

**This is NOT a hypothetical threat** - it's a well-known attack vector in browser extensions.

---

### Production Solution (SECURE)

```
Extension Code → AWS Lambda Proxy → Blockstream Paid API
(No API key)     (Has key, secure)   (Credits protected)
```

**How it Works**:
1. Extension calls Lambda API: `https://api.yourdomain.com/blockstream/address/...`
2. Lambda receives request, adds API key from environment variables
3. Lambda forwards to Blockstream API
4. Lambda returns response to extension

**API key NEVER leaves AWS infrastructure** - completely secure.

**Benefits**:
- ✅ **Security**: API key hidden on backend (encrypted, never exposed)
- ✅ **Quick**: 6-8 hours to implement (well-understood pattern)
- ✅ **Cheap**: $5-10/month AWS costs + Blockstream credits
- ✅ **Scalable**: Auto-scales to 1000 concurrent requests
- ✅ **Maintainable**: Infrastructure as Code (AWS CDK)
- ✅ **Transparent**: Same API interface (minimal code changes)
- ✅ **Future-Proof**: Can switch to self-hosted Esplora later
- ✅ **Production-Ready**: Meets Chrome Web Store security requirements

---

## Architecture Overview

### High-Level Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      Client Side (Chrome Extension)              │
│                                                                  │
│  • No API keys stored                                            │
│  • BlockstreamClient.ts points to proxy                         │
│  • Makes HTTPS requests to API Gateway                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ HTTPS (TLS 1.3)
                         │ https://api.yourdomain.com/blockstream/*
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│                         AWS Cloud                                │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │          Amazon API Gateway                              │   │
│  │  • CORS: chrome-extension://*                           │   │
│  │  • Rate limiting: 1000 req/sec per IP                   │   │
│  │  • Routes: GET/POST /blockstream/{proxy+}                │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │         AWS Lambda Function (Node.js 20.x)              │   │
│  │  • Memory: 256 MB                                        │   │
│  │  • Timeout: 30 seconds                                   │   │
│  │  • Environment Variables (encrypted):                    │   │
│  │    - BLOCKSTREAM_API_KEY_TESTNET                        │   │
│  │    - BLOCKSTREAM_API_KEY_MAINNET                        │   │
│  │  • Adds X-API-Key header to Blockstream requests        │   │
│  └────────────────────────┬─────────────────────────────────┘   │
│                           │                                      │
│  ┌────────────────────────▼─────────────────────────────────┐   │
│  │         CloudWatch Logs & Metrics                        │   │
│  │  • Dashboard: Invocations, errors, duration              │   │
│  │  • Alarms: Error rate, slow responses, abuse detection   │   │
│  │  • 7-day log retention                                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS + X-API-Key header
                         │
┌────────────────────────▼─────────────────────────────────────────┐
│               Blockstream Esplora API                            │
│  • Testnet: https://blockstream.info/testnet/api                │
│  • Mainnet: https://blockstream.info/api                        │
│  • Uses your paid API credits (protected)                       │
└──────────────────────────────────────────────────────────────────┘
```

---

## Why Lambda Proxy is the Right Choice

### Compared to Direct Blockstream API (with exposed key)

| Aspect | Direct API | Lambda Proxy |
|--------|-----------|--------------|
| **Security** | ❌ API key exposed | ✅ API key hidden |
| **Implementation Time** | 5 minutes | 6-8 hours |
| **Monthly Cost** | Blockstream credits | $5-10 + credits |
| **Rate Limits** | Same | Same |
| **User Experience** | Same | Same |
| **Chrome Web Store** | ❌ INSECURE | ✅ APPROVED |

**Verdict**: Lambda proxy is the ONLY secure solution for production.

---

### Compared to Self-Hosted Bitcoin Node

| Aspect | Self-Hosted Esplora | Lambda Proxy |
|--------|---------------------|--------------|
| **Implementation Time** | 4-5 days | 6-8 hours |
| **Monthly Cost (Testnet)** | $44-50/month | $5-10/month |
| **Monthly Cost (Mainnet)** | $150-200/month | $5-10/month + credits |
| **Maintenance** | High (server, updates) | Low (serverless) |
| **Scalability** | Manual | Auto-scales |
| **Latency** | Lower (<100ms) | Slightly higher (~200-400ms) |
| **When to Use** | >1M req/month | <1M req/month |

**Verdict**: Lambda proxy is perfect for **current scale**. Self-hosting is for **future scaling** (when volume justifies cost).

**Migration Path**: Lambda proxy can switch to self-hosted Esplora later (no extension changes needed).

---

## Product Validation

### P0 Requirements (Must Have Before Publication)

1. **Security: API Key Protection** ✅
   - API key stored on backend (Lambda environment variables)
   - Key encrypted at rest with AWS KMS
   - Key never transmitted to client
   - Key rotatable without extension update
   - **Acceptance**: Manual inspection - no API key in extension files

2. **Performance: User Experience Maintained** ✅
   - p95 latency ≤500ms for address lookups
   - No user-visible degradation
   - Extension loading time ≤2 seconds
   - **Acceptance**: CloudWatch metrics show p95 <500ms sustained over 24 hours

3. **Reliability: Production Uptime** ✅
   - >99% uptime over first 30 days (excludes Blockstream API issues)
   - All critical operations functional (balance, transactions, broadcast)
   - **Acceptance**: CloudWatch alarms configured, no sustained errors

4. **Cost: Budget Compliance** ✅
   - AWS costs ≤$10/month for first 3 months
   - No unexpected cost spikes (alarm if >$50/day)
   - **Acceptance**: AWS Cost Explorer shows costs within budget

---

### Success Metrics

**Critical Success Criteria** (Must Achieve):
- ✅ 0 API keys found in extension files (100% pass rate)
- ✅ Security expert approves implementation (sign-off required)
- ✅ p95 latency ≤500ms (CloudWatch metrics)
- ✅ Error rate <1% under normal load (CloudWatch metrics)
- ✅ AWS costs ≤$10/month average (Cost Explorer)

**Key Performance Indicators** (Ongoing):
- 📊 Mean time to detect (MTTD): <5 minutes (CloudWatch alarms)
- 📊 Mean time to resolve (MTTR): <30 minutes (documented procedures)
- 📊 Zero security incidents (API key leaks, unauthorized access)
- 📊 Average cost per user: <$0.10/month (100 active users)

---

## User Stories (Top 5)

### 1. As a wallet user, my API usage should be protected

**Acceptance Criteria**:
- [ ] API key NOT in extension code (manual inspection)
- [ ] API key stored in Lambda environment variables (encrypted)
- [ ] API key never logged in CloudWatch
- [ ] API key can be rotated without extension rebuild
- [ ] Security expert approves implementation

---

### 2. As a wallet user, API calls should be fast and reliable

**Acceptance Criteria**:
- [ ] p95 latency <500ms for address lookups
- [ ] Extension loading time ≤2 seconds (no regression)
- [ ] Error rate <1% under normal load
- [ ] All critical operations work (balance, transactions, broadcast)

---

### 3. As a developer, I need Infrastructure as Code for reproducibility

**Acceptance Criteria**:
- [ ] All infrastructure defined in AWS CDK (TypeScript)
- [ ] `cdk deploy` creates complete working proxy in <10 minutes
- [ ] `cdk destroy` cleanly removes all resources
- [ ] Documentation enables new developer to deploy successfully

---

### 4. As a DevOps engineer, I need monitoring for proactive issue detection

**Acceptance Criteria**:
- [ ] CloudWatch Dashboard shows: invocations, errors, duration, costs
- [ ] CloudWatch Alarms configured for: errors, slow responses, abuse
- [ ] SNS topic sends email alerts
- [ ] 7-day log retention for debugging
- [ ] Test alert triggered successfully

---

### 5. As a product owner, I need rate limiting to prevent abuse

**Acceptance Criteria**:
- [ ] API Gateway throttling: 1000 req/sec per IP
- [ ] Lambda concurrency limit: 100 (prevents runaway costs)
- [ ] CloudWatch alarm for unusual traffic (>100k req/hour)
- [ ] Load test: 2000 rapid requests → some throttled (429), no crashes
- [ ] Extension handles 429 gracefully (exponential backoff)

---

## Implementation Plan (8 Phases)

### Phase 1: Infrastructure Setup (2 hours)
- Create directory structure
- Initialize CDK and Lambda projects
- Install dependencies
- Configure TypeScript and Webpack

**Deliverable**: Projects initialized, ready for code

---

### Phase 2: Lambda Implementation (3 hours)
- Write Lambda handler (parse events, call proxy logic)
- Write proxy logic (forward to Blockstream, add API key)
- Write logger (structured JSON, sanitize sensitive data)
- Test locally with mock events

**Deliverable**: Lambda code ready to deploy

---

### Phase 3: CDK Infrastructure (2 hours)
- Create Lambda construct (function + IAM role)
- Create API Gateway construct (REST API + CORS)
- Create monitoring construct (dashboard + alarms)
- Assemble main stack
- Test CDK synthesis

**Deliverable**: Infrastructure defined, CloudFormation template generated

---

### Phase 4: Deployment to Staging (1 hour)
- Configure AWS credentials
- Bootstrap CDK (first time only)
- Deploy stack to staging
- Test deployed API manually
- Verify CloudWatch logs and metrics

**Deliverable**: Staging proxy deployed and working

---

### Phase 5: Extension Integration (1 hour)
- Update BlockstreamClient.ts (add proxy URL logic)
- Update webpack.config.js (inject environment variables)
- Update .env.local.example (document proxy URL)
- Rebuild extension
- Test in Chrome (verify proxy calls work)

**Deliverable**: Extension integrated with proxy, tested locally

---

### Phase 6: Testing & Validation (2 hours)
- Functional testing (all API endpoints)
- Security testing (no API key in files, logs sanitized)
- Performance testing (measure latency, load test)
- Cost validation (AWS Cost Explorer)

**Deliverable**: Test report, all acceptance criteria met

---

### Phase 7: Documentation (1 hour)
- Create deployment runbook (step-by-step instructions)
- Update project documentation (CLAUDE.md, ARCHITECTURE.md)
- Document monitoring (CloudWatch usage, alarms)
- Document rollback procedure

**Deliverable**: Complete documentation for deployment and operations

---

### Phase 8: Production Deployment (30 minutes)
- Review pre-deployment checklist
- Deploy to production
- Update extension with production proxy URL
- Rebuild and package for Chrome Web Store
- Monitor CloudWatch for 24 hours

**Deliverable**: Production proxy deployed, extension ready to publish

---

## Cost Breakdown

### AWS Free Tier (First 12 Months)
- **Lambda**: 1M requests/month FREE + 400,000 GB-seconds FREE
- **API Gateway**: 1M requests/month FREE (first year only)
- **CloudWatch**: 10 custom metrics FREE + 5 GB logs FREE

### Monthly Cost Estimate (After Free Tier)

**Light Usage (10k requests/month)**: ~$0.08/month
**Moderate Usage (100k requests/month)**: ~$0.83/month ← **EXPECTED**
**Heavy Usage (500k requests/month)**: ~$4.14/month
**Very Heavy Usage (1M requests/month)**: ~$8.28/month

**Target Budget**: $5-10/month for typical wallet usage (100k-500k requests/month)

**Cost Optimization** (if costs exceed $10/month):
1. Add response caching (ElastiCache Redis)
2. Increase Lambda memory (faster = lower compute cost)
3. Reduce log retention (7 days → 3 days)

**Future Scaling** (if costs exceed $50/month):
- Implement self-hosted Esplora node
- Lambda proxy can switch to self-hosted (no extension changes)

---

## Risk Assessment

### High Risk → Mitigated

#### Risk 1: API Key Exposure
- **Likelihood**: Medium (common mistake)
- **Impact**: Critical (financial loss)
- **Mitigation**:
  - Code review by security expert
  - Automated test: `grep -r "BLOCKSTREAM_API_KEY" dist/` in CI/CD
  - Clear documentation
- **Residual Risk**: LOW

#### Risk 2: Lambda Deployment Failure
- **Likelihood**: Medium (first-time issues)
- **Impact**: High (blocks publication)
- **Mitigation**:
  - Staging deployment first
  - Comprehensive documentation
  - Rollback plan (direct Blockstream API)
- **Residual Risk**: LOW

#### Risk 3: Unexpectedly High Costs
- **Likelihood**: Low (rate limiting prevents abuse)
- **Impact**: High (financial, but capped)
- **Mitigation**:
  - Lambda concurrency limit: 100 (max ~$150/month)
  - CloudWatch alarm: >100k req/hour
  - AWS budget alert: >$50/month
- **Residual Risk**: LOW

---

### Medium Risk → Monitor

#### Risk 4: Latency Regression
- **Likelihood**: Low (design targets <500ms)
- **Impact**: Medium (poor UX)
- **Mitigation**: Performance testing, monitoring, optimization
- **Residual Risk**: LOW

---

### Low Risk → Accept

#### Risk 5: AWS Service Outage
- **Likelihood**: Very Low (AWS SLA >99.95%)
- **Impact**: High (wallet unavailable)
- **Mitigation**: Accept risk, rollback plan exists
- **Residual Risk**: LOW

---

## Rollback Plan

### When to Rollback

**Trigger conditions** (any one):
1. Error rate >10% sustained for >15 minutes
2. p95 latency >2000ms sustained for >15 minutes
3. AWS service outage in our region
4. Critical bug discovered
5. Unexpectedly high costs (>$50/day)

### Rollback Steps (10 minutes)

1. **Revert to Direct Blockstream API**:
   ```bash
   # Remove BLOCKSTREAM_PROXY_URL from .env.local
   npm run build
   ```

2. **Reload Extension**: Go to `chrome://extensions/` → Reload

3. **Verify Functionality**: Test balance, transactions, send

4. **Notify Users** (if published): Post GitHub update

5. **Post-Mortem**: Review logs, fix issue, redeploy to staging

---

## Questions for Technical Teams

### For Backend Developer
1. Should we use Node.js 20.x or 18.x runtime? (Recommendation: 20.x)
2. Is 256MB memory sufficient? (Recommendation: Yes, benchmark if needed)
3. Webpack bundle or raw TypeScript? (Recommendation: Webpack for smaller bundle)
4. REST API or HTTP API? (Recommendation: REST API for throttling control)

### For Security Expert
1. Environment variables or AWS Secrets Manager? (Recommendation: Env vars for MVP, Secrets Manager for production-grade)
2. Key rotation frequency? (Recommendation: 90 days)
3. Log Bitcoin addresses at all? (Recommendation: Sanitize in production)
4. Request signing (HMAC)? (Recommendation: Not needed for MVP)

### For Frontend Developer
1. How to handle 502 errors? (Recommendation: User-friendly message, retry with backoff)
2. Should unit tests mock proxy? (Recommendation: Yes, integration tests use real staging proxy)

### For UI/UX Designer
1. Error message copy for different failures? (Designer provides user-friendly messages)
2. Show "Retry" button? (Recommendation: Yes)

### For Blockchain Expert
1. Does Lambda maintain full Blockstream API compatibility? (Recommendation: Yes, verify with integration tests)
2. Should Lambda validate transaction hex? (Recommendation: No, Blockstream validates)

### For QA Engineer
1. Separate proxies for dev/staging/production? (Recommendation: Yes)
2. Critical test cases? (See PRD Test Plan section)
3. Automated load testing? (Recommendation: Yes)

---

## Pre-Deployment Checklist

### Security
- [ ] API keys NOT in extension code (manual inspection)
- [ ] API keys NOT in Git (`.gitignore` verified)
- [ ] Lambda environment variables encrypted (KMS)
- [ ] CloudWatch logs sanitized (no API keys, addresses masked)
- [ ] IAM policy follows least privilege
- [ ] CORS configured correctly

### Testing
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass
- [ ] Load testing completed (100 concurrent requests)
- [ ] Performance testing (p95 <500ms)
- [ ] Security testing (no API key found)
- [ ] Cost validation (within budget)

### Infrastructure
- [ ] CDK stack deploys successfully
- [ ] CloudWatch dashboard shows metrics
- [ ] CloudWatch alarms configured and tested
- [ ] SNS alerts working (email received)
- [ ] 7-day log retention configured

### Documentation
- [ ] Deployment runbook complete
- [ ] Rollback procedure documented
- [ ] Monitoring guide documented
- [ ] Troubleshooting guide documented

### Final Approval
- [ ] QA sign-off (all tests passed)
- [ ] Security expert sign-off (audit complete)
- [ ] Backend developer sign-off (infrastructure ready)
- [ ] Frontend developer sign-off (extension tested)
- [ ] Product manager sign-off (requirements met)

**Ready for Production**: ✅ / ❌

---

## Document Index

### Planning Documents

1. **BLOCKSTREAM_API_PROXY_SUMMARY.md** (this document)
   - Executive summary for quick reference
   - Problem statement, solution overview, key decisions
   - Implementation phases, cost estimates, risk assessment

2. **BLOCKSTREAM_API_PROXY_PRD.md** (40,000+ words)
   - Complete Product Requirements Document
   - 25+ user stories with acceptance criteria
   - Success metrics, functional/non-functional requirements
   - Edge cases, security requirements, risk assessment
   - Questions for technical teams
   - 8-phase implementation plan
   - Pre-deployment approval checklist

3. **BLOCKSTREAM_API_PROXY_PLAN.md** (35,000+ words)
   - Complete technical implementation guide
   - Architecture diagrams (ASCII and descriptions)
   - AWS CDK infrastructure code (complete examples)
   - Lambda function implementation (complete code)
   - API Gateway configuration
   - CloudWatch monitoring setup
   - Deployment instructions (step-by-step)
   - Cost analysis (detailed breakdown)
   - Troubleshooting guide
   - Migration plan (direct API → proxy → self-hosted)

### Related Documentation

4. **ARCHITECTURE.md** (Section 5: API Integration Architecture)
   - High-level architecture overview
   - Integration with wallet components
   - API endpoints and data flow

5. **CLAUDE.md** (Blockstream API Integration section)
   - Quick reference for developers
   - Configuration examples
   - Security requirements

6. **SELF_HOSTED_ESPLORA_AWS_PLAN.md** (future scaling)
   - Self-hosted Esplora node deployment
   - For when costs exceed $100/month or need <100ms latency
   - Lambda proxy can switch to self-hosted (no extension changes)

---

## Quick Start Guide

### For Product Manager
1. Read: **BLOCKSTREAM_API_PROXY_SUMMARY.md** (this document)
2. Review: **BLOCKSTREAM_API_PROXY_PRD.md** (requirements, user stories)
3. Approve: Pre-deployment checklist

### For Backend Developer
1. Read: **BLOCKSTREAM_API_PROXY_PLAN.md** (technical implementation)
2. Clone: CDK code examples from plan
3. Deploy: Follow deployment instructions
4. Test: Integration tests in staging

### For Security Expert
1. Read: Security Requirements sections in PRD
2. Review: Lambda environment variable configuration
3. Audit: Logging implementation (no API keys logged)
4. Approve: Final security sign-off

### For QA Engineer
1. Read: Test Plan in PRD (Appendix A)
2. Execute: Functional, security, performance tests
3. Validate: All acceptance criteria met
4. Approve: QA sign-off for production

### For Frontend Developer
1. Read: Extension Integration section in Plan
2. Update: BlockstreamClient.ts (minimal changes)
3. Test: Extension with proxy in staging
4. Verify: Network tab shows proxy calls

---

## Conclusion

### Key Takeaways

1. **Lambda Proxy is REQUIRED for Production**
   - Chrome Web Store cannot accept extensions with API keys in code
   - Lambda proxy is the industry-standard solution
   - Quick to implement (6-8 hours), cheap to operate ($5-10/month)

2. **Security is Non-Negotiable**
   - API key protection is a P0 requirement
   - Multiple safeguards: encryption, sanitization, monitoring
   - Security expert approval required before deployment

3. **Implementation is Low-Risk**
   - Well-understood technology (Lambda, API Gateway, CDK)
   - Comprehensive testing strategy
   - Clear rollback plan (revert to direct Blockstream API)
   - Detailed documentation for all teams

4. **Future-Proof Architecture**
   - Lambda proxy is an abstraction layer
   - Easy to switch to self-hosted Esplora later (no extension changes)
   - Scales automatically (1000 concurrent requests)
   - Low maintenance (serverless)

### Next Steps

**Immediate Actions**:
1. Product Manager: Review and approve PRD ✅
2. Security Expert: Review security requirements ✅
3. Backend Developer: Deploy to staging ⏳
4. QA Engineer: Execute test plan ⏳
5. All Teams: Final approval checklist ⏳

**Timeline**:
- Week 1: Implementation and staging deployment (6-8 hours)
- Week 2: Testing and validation (2 hours)
- Week 3: Production deployment and monitoring (1 hour + 24h monitoring)

**Approval Required**: Product Manager, Security Expert, Backend Developer, QA Engineer

**Ready for Implementation**: ✅

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Status**: Ready for Approval
**Next Review**: After staging deployment
