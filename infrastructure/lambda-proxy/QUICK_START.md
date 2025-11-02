# Lambda Proxy - Quick Start Guide

## TL;DR

```bash
# 1. Set API key
export BLOCKSTREAM_API_KEY_TESTNET="your_key"

# 2. Deploy
cd infrastructure/lambda-proxy
npx cdk bootstrap  # First time only
npx cdk deploy

# 3. Configure extension
cd ../..
echo "BLOCKSTREAM_PROXY_URL=https://YOUR_ENDPOINT" >> .env.local
npm run build

# 4. Test
# Load extension in Chrome and test wallet functions
```

---

## What Gets Deployed?

- **AWS Lambda**: Node.js 20.x function that proxies API requests
- **API Gateway**: REST API endpoint with CORS enabled
- **CloudWatch**: Logs, metrics, dashboard, and alarms
- **IAM Roles**: Lambda execution role with minimal permissions

---

## Key Files

| File | Purpose |
|------|---------|
| `bin/proxy.ts` | CDK app entry point |
| `lib/proxy-stack.ts` | Main CloudFormation stack |
| `lib/constructs/` | Reusable CDK constructs |
| `lambda/src/index.ts` | Lambda handler |
| `lambda/dist/index.js` | Compiled Lambda bundle |

---

## Common Commands

```bash
# View what will be deployed
npx cdk synth

# Deploy to dev
npx cdk deploy

# Deploy to staging
npx cdk deploy -c environment=staging

# Deploy to production
npx cdk deploy -c environment=production

# View differences
npx cdk diff

# Delete stack
npx cdk destroy

# View Lambda logs
aws logs tail /aws/lambda/FUNCTION_NAME --follow
```

---

## Cost Estimate

- **Dev**: $0-1/month (within free tier)
- **Production**: $5-10/month for typical usage (100k-500k requests/month)
- **Breakdown**:
  - Lambda: ~$0.20 per 1M requests + compute time
  - API Gateway: ~$3.50 per 1M requests
  - CloudWatch: ~$0.50/month for logs and metrics
  - Data transfer: ~$0.09/GB

**Free Tier (first 12 months)**:
- 1M Lambda requests/month
- 1M API Gateway requests/month
- 5GB CloudWatch logs

---

## Security Notes

✅ API keys stored in Lambda environment (encrypted with KMS)
✅ Keys never sent to client
✅ CORS restricted to `chrome-extension://*`
✅ Rate limiting: 1000 req/sec
✅ Concurrency limit: 100 (prevents runaway costs)
✅ Logs sanitized (no API keys logged)

---

## Monitoring

**CloudWatch Dashboard**: `BlockstreamProxy-{env}`

Metrics:
- Invocations per minute
- Error rate (target <1%)
- Duration p95 (target <500ms)
- API Gateway 4xx/5xx errors

**Alarms**:
- Error rate >10 errors in 5 min
- Duration p95 >5 seconds
- Traffic spike >100k requests/hour

---

## Troubleshooting

### Deployment Fails

1. Check AWS credentials: `aws sts get-caller-identity`
2. Bootstrap CDK: `npx cdk bootstrap`
3. Check IAM permissions
4. Review error in CloudFormation console

### Extension Can't Connect

1. Check proxy URL in `.env.local`
2. Verify CORS allows extension origin
3. Check Lambda logs for incoming requests
4. Test with curl: `curl https://YOUR_ENDPOINT/address/tb1q.../utxo?network=testnet`

### High Costs

1. Check Lambda invocations in CloudWatch
2. Look for infinite loops in extension
3. Verify concurrency limit is set (100)
4. Add caching if needed

---

## Next Steps

1. ✅ Deploy to dev: `npx cdk deploy`
2. ✅ Test extension with proxy
3. ✅ Monitor for 24-48 hours
4. ✅ Deploy to production
5. ✅ Submit extension to Chrome Web Store

---

**Status**: Infrastructure Ready ✅
**Estimated Deploy Time**: 2-3 minutes
**Estimated Test Time**: 15 minutes
**Total Time to Production**: ~30 minutes

---

For detailed instructions, see `DEPLOYMENT_STEPS.md`
For implementation details, see `README.md`
For architecture, see `../../prompts/docs/plans/BLOCKSTREAM_API_PROXY_PLAN.md`
