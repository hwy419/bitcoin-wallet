# AWS Lambda Proxy - Deployment Guide

This guide walks you through deploying the Blockstream API proxy infrastructure for the Bitcoin wallet Chrome extension.

## 🎯 Prerequisites Checklist

Before deploying, ensure you have:

- [ ] **AWS Account** with Administrator access
- [ ] **AWS CLI** installed and configured
- [ ] **Node.js 20+** and npm installed
- [ ] **AWS CDK** installed globally: `npm install -g aws-cdk`
- [ ] **Blockstream API keys** (testnet and mainnet) - Contact Blockstream or use public endpoints
- [ ] **Email address** for CloudWatch alerts (optional but recommended)
- [ ] **~15 minutes** for deployment

## 📋 Step-by-Step Deployment

### Step 1: Verify AWS CLI Configuration

```bash
# Check AWS CLI is installed
aws --version
# Output: aws-cli/2.x.x ...

# Verify credentials are configured
aws sts get-caller-identity
# Output: {
#   "UserId": "...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/YourUser"
# }

# Set region (if not already set)
export AWS_DEFAULT_REGION=us-east-1
```

### Step 2: Clone and Navigate to Infrastructure Directory

```bash
cd /home/michael/code_projects/bitcoin_wallet/infrastructure/lambda-proxy
```

### Step 3: Install Dependencies

```bash
# Install CDK dependencies
npm install

# Install Lambda dependencies
cd lambda
npm install
cd ..
```

**Expected output:**
```
added 150 packages, and audited 151 packages in 12s
```

### Step 4: Build Lambda Function

```bash
cd lambda
npm run build
cd ..
```

**Expected output:**
```
webpack 5.x.x compiled successfully in 2345 ms
```

**Verify build:**
```bash
ls -lh lambda/dist/
# Should show: index.js (bundled Lambda code)
```

### Step 5: Set Environment Variables

```bash
# Required: Blockstream API keys
export BLOCKSTREAM_API_KEY_TESTNET="your_testnet_api_key_here"
export BLOCKSTREAM_API_KEY_MAINNET="your_mainnet_api_key_here"

# Optional: Email for alerts
export ALERT_EMAIL="your_email@example.com"

# Optional: Specific AWS profile (if you have multiple)
export AWS_PROFILE="your_aws_profile_name"
```

**⚠️ IMPORTANT**: Keep API keys secure! Never commit them to Git.

### Step 6: Bootstrap CDK (First Time Only)

```bash
# Get your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Bootstrap CDK
cdk bootstrap aws://${AWS_ACCOUNT_ID}/us-east-1
```

**Expected output:**
```
✅  Environment aws://123456789012/us-east-1 bootstrapped.
```

**Note**: This only needs to be done once per AWS account/region. If you've used CDK before, you can skip this step.

### Step 7: Review Infrastructure (Dry Run)

```bash
# Synthesize CloudFormation template
npm run synth
```

**Review the output:**
- Lambda function with correct runtime (nodejs20.x)
- API Gateway REST API
- CloudWatch log groups
- SNS topic (if ALERT_EMAIL set)
- CloudWatch alarms and dashboard

**Example output:**
```
Resources:
  ProxyLambdaProxyFunction... (AWS::Lambda::Function)
  ProxyApiBlockstreamProxyApi... (AWS::ApiGateway::RestApi)
  ProxyMonitoringAlertTopic... (AWS::SNS::Topic)
  ...
```

### Step 8: Preview Changes

```bash
# Show what will be deployed
npm run diff
```

**Expected output:**
```
Stack BlockstreamProxyStack-dev
Resources
[+] AWS::Lambda::Function ProxyLambda/ProxyFunction
[+] AWS::ApiGateway::RestApi ProxyApi/BlockstreamProxyApi
[+] AWS::SNS::Topic ProxyMonitoring/AlertTopic
[+] AWS::CloudWatch::Alarm ProxyMonitoring/HighErrorRate
...
```

### Step 9: Deploy to AWS

```bash
npm run deploy:dev
```

**Expected output:**
```
✨  Synthesis time: 3.45s

BlockstreamProxyStack-dev: deploying...
BlockstreamProxyStack-dev: creating CloudFormation changeset...

 ✅  BlockstreamProxyStack-dev

✨  Deployment time: 95.67s

Outputs:
BlockstreamProxyStack-dev.ApiEndpoint = https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream/
BlockstreamProxyStack-dev.LambdaFunctionName = BlockstreamProxyStack-dev-ProxyLambdaProxyFunction...
BlockstreamProxyStack-dev.SnsTopicArn = arn:aws:sns:us-east-1:123456789012:blockstream-proxy-alerts-dev
BlockstreamProxyStack-dev.DashboardName = BlockstreamProxy-dev

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/BlockstreamProxyStack-dev/...
```

**⭐ SAVE THE API ENDPOINT!** You'll need this URL for the Chrome extension configuration.

### Step 10: Verify Deployment

#### Check CloudFormation Stack

```bash
aws cloudformation describe-stacks \
  --stack-name BlockstreamProxyStack-dev \
  --query 'Stacks[0].StackStatus' \
  --output text
```

**Expected output:** `CREATE_COMPLETE` or `UPDATE_COMPLETE`

#### Check Lambda Function

```bash
aws lambda get-function \
  --function-name $(aws cloudformation describe-stacks \
    --stack-name BlockstreamProxyStack-dev \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text)
```

**Expected output:** JSON with Lambda configuration

#### Check API Gateway

```bash
aws apigateway get-rest-apis \
  --query 'items[?name==`Blockstream Proxy API (dev)`]'
```

**Expected output:** JSON with API Gateway details

### Step 11: Test the API

```bash
# Save API endpoint to variable
export API_URL=$(aws cloudformation describe-stacks \
  --stack-name BlockstreamProxyStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

echo "API URL: $API_URL"

# Test 1: Get testnet block height
curl "${API_URL}blocks/tip/height?network=testnet"
# Expected: 2800000 (or current testnet block height)

# Test 2: Get testnet address info
curl "${API_URL}address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx?network=testnet"
# Expected: JSON with address balance and transaction count

# Test 3: Get fee estimates (cached for 60 seconds)
curl "${API_URL}fee-estimates?network=testnet"
# Expected: {"1":20,"2":18,"3":16,...}

# Test 4: Get mainnet block height
curl "${API_URL}blocks/tip/height?network=mainnet"
# Expected: 870000 (or current mainnet block height)
```

**✅ If all tests pass, deployment is successful!**

### Step 12: Confirm Email Subscription (If Configured)

If you set `ALERT_EMAIL`, check your inbox:

1. Look for email from AWS Notifications: **"AWS Notification - Subscription Confirmation"**
2. Click **"Confirm subscription"** link
3. You'll receive CloudWatch alarm emails to this address

### Step 13: View CloudWatch Dashboard

```bash
# Open CloudWatch dashboard in browser
echo "Dashboard URL: https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=BlockstreamProxy-dev"
```

**Or manually:**
1. Go to AWS Console → CloudWatch
2. Navigate to Dashboards
3. Click **BlockstreamProxy-dev**

**You should see:**
- Lambda invocations graph
- Lambda errors graph
- Lambda duration (p50/p95/p99) graph
- API Gateway requests graph
- API Gateway errors graph
- API Gateway latency graph

### Step 14: Configure Chrome Extension

Update the Chrome extension to use the Lambda proxy URL:

**File**: `src/background/api/BlockstreamClient.ts`

```typescript
// Replace Blockstream direct URL with Lambda proxy URL
const BASE_URL = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream/';
const TESTNET_SUFFIX = '?network=testnet';
const MAINNET_SUFFIX = '?network=mainnet';
```

**⚠️ IMPORTANT**: Remove Blockstream API key from extension code before publishing!

## 🎉 Deployment Complete!

Your Lambda proxy is now live and serving requests. Next steps:

1. **Update Chrome extension** to use Lambda proxy URL
2. **Remove Blockstream API key** from extension code
3. **Test extension** with Lambda proxy
4. **Monitor CloudWatch dashboard** for the first few days
5. **Review costs** in AWS Billing console after 1 week

## 🔄 Updating Deployment

### Update Lambda Code

```bash
cd lambda
npm run build
cd ..
npm run deploy:dev
```

### Update Infrastructure (Add Resources)

```bash
# Edit lib/proxy-stack.ts or constructs
npm run deploy:dev
```

### Rotate API Keys

```bash
export BLOCKSTREAM_API_KEY_TESTNET="new_testnet_key"
export BLOCKSTREAM_API_KEY_MAINNET="new_mainnet_key"
npm run deploy:dev
```

## 🗑️ Destroying Deployment

**WARNING**: This deletes all resources (Lambda, API Gateway, logs, alarms).

```bash
npm run destroy:dev
```

**Confirm deletion when prompted.**

## 🐛 Troubleshooting

### Issue: CDK Bootstrap Fails

**Error**: `AccessDenied: User is not authorized to perform: cloudformation:CreateStack`

**Solution**: Ensure your AWS user has Administrator access or the required IAM permissions:
- `cloudformation:*`
- `lambda:*`
- `apigateway:*`
- `iam:*` (for creating Lambda execution roles)
- `logs:*`
- `sns:*`
- `cloudwatch:*`

### Issue: Lambda Build Fails

**Error**: `Cannot find module 'node-fetch'`

**Solution**: Install Lambda dependencies

```bash
cd lambda
rm -rf node_modules package-lock.json
npm install
npm run build
cd ..
```

### Issue: Deployment Fails with "No Such Bucket"

**Error**: `No bucket named 'cdk-hnb659fds-assets-...'`

**Solution**: Run CDK bootstrap

```bash
cdk bootstrap aws://$(aws sts get-caller-identity --query Account --output text)/us-east-1
```

### Issue: API Returns 502 Bad Gateway

**Check Lambda logs:**

```bash
aws logs tail /aws/lambda/$(aws cloudformation describe-stacks \
  --stack-name BlockstreamProxyStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
  --output text) --follow
```

**Common causes:**
- Invalid Blockstream API key (check environment variables)
- Blockstream API unreachable (check https://blockstream.info status)
- Lambda timeout (increase timeout in `lib/constructs/lambda-construct.ts`)

### Issue: API Returns 403 Forbidden (CORS)

**Solution**: Add API Gateway URL to Chrome extension manifest permissions:

```json
{
  "permissions": [
    "https://abc123xyz.execute-api.us-east-1.amazonaws.com/*"
  ]
}
```

### Issue: Deployment Takes >10 Minutes

**Normal**: First deployment can take 5-10 minutes (creating all resources).

**If stuck**: Check CloudFormation console for errors:

```bash
aws cloudformation describe-stack-events \
  --stack-name BlockstreamProxyStack-dev \
  --query 'StackEvents[?ResourceStatus==`CREATE_FAILED`]'
```

## 📊 Cost Monitoring

### Set Up AWS Budget

```bash
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget '{
    "BudgetName": "Lambda-Proxy-Monthly",
    "BudgetLimit": {
      "Amount": "10",
      "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "BudgetType": "COST"
  }'
```

### View Current Costs

```bash
# Go to AWS Console → Billing → Cost Explorer
echo "https://console.aws.amazon.com/billing/home#/costexplorer"
```

**Filter by:**
- Service: Lambda, API Gateway, CloudWatch
- Tag: Application = Bitcoin-Wallet

## 🚀 Scaling to Production

### Deploy Production Stack

1. Uncomment production stack in `bin/proxy.ts`
2. Deploy:

```bash
cdk deploy BlockstreamProxyStack-production
```

### Production Recommendations

- [ ] Use separate AWS account for production
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Set up AWS Config for compliance monitoring
- [ ] Use AWS Secrets Manager for API keys (instead of environment variables)
- [ ] Enable API Gateway access logs
- [ ] Add AWS WAF for DDoS protection
- [ ] Use custom domain with Route 53 and ACM
- [ ] Set up AWS Budgets with alerts
- [ ] Enable AWS CloudWatch anomaly detection
- [ ] Implement API key rotation schedule

## 📞 Support

- **AWS Support**: https://console.aws.amazon.com/support/
- **CDK Issues**: https://github.com/aws/aws-cdk/issues
- **Backend Developer**: See `prompts/docs/experts/backend/`

## ✅ Deployment Checklist

- [ ] AWS CLI configured and tested
- [ ] Node.js 20+ installed
- [ ] CDK installed globally
- [ ] Dependencies installed (CDK and Lambda)
- [ ] Lambda code built successfully
- [ ] Environment variables set (API keys, email)
- [ ] CDK bootstrapped (first time only)
- [ ] Infrastructure synthesized and reviewed
- [ ] Deployed to AWS successfully
- [ ] API endpoint saved
- [ ] API tested (block height, address, fee estimates)
- [ ] Email subscription confirmed (if configured)
- [ ] CloudWatch dashboard verified
- [ ] Chrome extension updated with proxy URL
- [ ] Blockstream API key removed from extension
- [ ] Extension tested with proxy
- [ ] Cost monitoring configured (AWS Budget)

---

**Deployment Date**: ________________

**API Endpoint**: ________________

**Lambda Function Name**: ________________

**SNS Topic ARN**: ________________

**Dashboard Name**: BlockstreamProxy-dev

**Deployed By**: ________________
