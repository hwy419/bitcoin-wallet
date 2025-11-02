# AWS Lambda Proxy Deployment - Step by Step

## Current Status

✅ **Infrastructure Code Complete**
✅ **Lambda Function Built**
⏳ **Ready for AWS Deployment**

---

## Prerequisites

Before deploying, ensure you have:

1. **AWS Account**: Active AWS account with programmatic access
2. **AWS CLI**: Installed and configured (`aws configure`)
3. **Blockstream API Key**: Get from https://blockstream.info/api/
4. **Permissions**: IAM permissions for Lambda, API Gateway, CloudWatch, IAM roles

### Check AWS Configuration

```bash
# Verify AWS CLI is configured
aws sts get-caller-identity

# Should output:
# {
#   "UserId": "...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::..."
# }
```

---

## Step 1: Set Environment Variables

```bash
# Required: Blockstream API key for testnet
export BLOCKSTREAM_API_KEY_TESTNET="your_testnet_api_key_here"

# Optional: Mainnet key (for future use)
export BLOCKSTREAM_API_KEY_MAINNET="your_mainnet_api_key_here"

# Verify
echo $BLOCKSTREAM_API_KEY_TESTNET
```

**⚠️ IMPORTANT**: Keep these keys secret! Never commit them to Git.

---

## Step 2: Bootstrap AWS CDK (First Time Only)

```bash
cd infrastructure/lambda-proxy

# Bootstrap CDK in your AWS account/region
npx cdk bootstrap

# Expected output:
#  ✅  Environment aws://123456789012/us-east-1 bootstrapped.
```

This creates necessary S3 buckets and IAM roles for CDK deployments.

---

## Step 3: Synthesize CloudFormation Template

```bash
# Generate CloudFormation template
npx cdk synth

# Review the generated template
# Look for sensitive data leaks (there should be none)
```

---

## Step 4: Deploy to Development Environment

```bash
# Deploy to dev environment
npx cdk deploy

# You'll be asked to approve security changes:
#   IAM Statement Changes
#   ┌───┬─────────────────┬────────┬────────────────┐
#   │   │ Resource        │ Effect │ Action         │
#   ├───┼─────────────────┼────────┼────────────────┤
#   │ + │ Lambda          │ Allow  │ sts:AssumeRole │
#   └───┴─────────────────┴────────┴────────────────┘
#
# Type 'y' to approve and deploy

# Deployment takes 2-3 minutes
# Progress shown:
#  0/6 | CREATE_IN_PROGRESS  | AWS::IAM::Role
#  1/6 | CREATE_COMPLETE     | AWS::IAM::Role
#  ...
#  6/6 | CREATE_COMPLETE     | AWS::CloudFormation::Stack
```

---

## Step 5: Save API Endpoint

After deployment completes, CDK outputs the API endpoint:

```
Outputs:
BlockstreamProxy-dev.ApiEndpoint = https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream
BlockstreamProxy-dev.LambdaFunctionName = BlockstreamProxy-dev-ProxyLambdaProxyFunction12345678-Abc123
```

**SAVE THIS URL** - you'll need it for the extension configuration.

---

## Step 6: Test the Deployed Proxy

```bash
# Test with a testnet address lookup
curl "https://YOUR_API_ENDPOINT/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx?network=testnet"

# Expected: JSON response with address details
# {
#   "address": "tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
#   "chain_stats": {...},
#   "mempool_stats": {...}
# }
```

---

## Step 7: Configure Extension

Update the extension to use the deployed proxy:

```bash
cd /home/michael/code_projects/bitcoin_wallet

# Add proxy URL to .env.local
echo "BLOCKSTREAM_PROXY_URL=https://YOUR_API_ENDPOINT" >> .env.local

# Rebuild extension
npm run build
```

---

## Step 8: Load Extension and Test

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `bitcoin_wallet/dist/` folder
5. Open the extension
6. Create or unlock wallet
7. Check console for proxy usage:
   ```
   [BlockstreamClient] Using Lambda proxy for testnet: https://YOUR_API_ENDPOINT
   ```

---

## Monitoring

### CloudWatch Dashboard

1. Go to AWS Console → CloudWatch → Dashboards
2. Open "BlockstreamProxy-dev"
3. View:
   - Lambda invocations
   - Error rates
   - Response times
   - API Gateway metrics

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/BlockstreamProxy-dev-ProxyLambdaProxyFunction --follow

# Filter for errors
aws logs tail /aws/lambda/BlockstreamProxy-dev-ProxyLambdaProxyFunction --follow --filter-pattern "ERROR"
```

---

## Deploying to Staging/Production

```bash
# Staging deployment
npx cdk deploy -c environment=staging

# Production deployment
export BLOCKSTREAM_API_KEY_TESTNET="your_production_key"
npx cdk deploy -c environment=production
```

**Different Outputs**:
- Dev: `BlockstreamProxy-dev.ApiEndpoint`
- Staging: `BlockstreamProxy-staging.ApiEndpoint`
- Production: `BlockstreamProxy-production.ApiEndpoint`

---

## Troubleshooting

### Error: "No stacks match the name..."

**Solution**: Run `npx cdk bootstrap` first.

### Error: "Unable to resolve AWS account..."

**Solution**: Run `aws configure` and set credentials.

### Error: "Configuration missing for testnet"

**Solution**: Set `export BLOCKSTREAM_API_KEY_TESTNET="..."`

### Error: "Rate limit exceeded"

**Solution**: 
1. Check CloudWatch for unusual traffic
2. Verify Lambda concurrency limit (100)
3. Check for infinite loops in extension

### Extension can't connect to proxy

**Solution**:
1. Verify proxy URL in `.env.local`
2. Check CORS configuration (should allow `chrome-extension://*`)
3. View browser console for network errors
4. Check Lambda logs for incoming requests

---

## Cost Monitoring

```bash
# Check current month costs
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=SERVICE

# Set budget alert (optional)
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget BudgetName=LambdaProxy,BudgetLimit={Amount=10,Unit=USD}
```

---

## Security Checklist

Before production deployment:

- [ ] API keys NOT in Git
- [ ] API keys NOT in extension code
- [ ] API keys NOT in CloudWatch logs
- [ ] CORS configured for extension origins only
- [ ] Lambda concurrency limit set (100)
- [ ] CloudWatch alarms configured
- [ ] IAM roles follow least privilege
- [ ] CloudFormation template reviewed for secrets

---

## Rollback Plan

If deployment fails or issues arise:

```bash
# Delete the stack
npx cdk destroy

# Redeploy previous version
git checkout PREVIOUS_COMMIT
npx cdk deploy

# Or revert extension to direct Blockstream API
# (Remove BLOCKSTREAM_PROXY_URL from .env.local)
```

---

## Next Steps After Deployment

1. ✅ Test all extension features (send, receive, balance)
2. ✅ Monitor CloudWatch for 24 hours
3. ✅ Verify costs are within budget
4. ✅ Test error handling (network issues, rate limits)
5. ✅ Production deployment (when ready)
6. ✅ Chrome Web Store submission

---

## Support

- **AWS Issues**: Check CloudWatch logs
- **Extension Issues**: Check browser console
- **API Issues**: Check Blockstream status page
- **Documentation**: See `/prompts/docs/plans/BLOCKSTREAM_API_PROXY_*.md`

---

**Status**: Ready for AWS Deployment ✅
**Next Command**: `npx cdk deploy`
