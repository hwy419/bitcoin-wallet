# Quick Redeploy Guide

## What Changed

The Lambda function now works **without requiring API keys** for testing. It will:
- Use Blockstream's public API (rate-limited but free)
- Log a warning when no API key is configured
- Work immediately without additional setup

## Redeploy Steps

### Option 1: Quick Redeploy (No API Key Needed)

```bash
# Navigate to infrastructure directory
cd /home/michael/code_projects/bitcoin_wallet/infrastructure/lambda-proxy

# Set empty API keys to suppress warnings during deployment
export BLOCKSTREAM_API_KEY_TESTNET=""
export BLOCKSTREAM_API_KEY_MAINNET=""

# Build and deploy
npm run build
cdk deploy --require-approval never
```

### Option 2: Deploy with Your API Keys (Recommended for Production)

If you have Blockstream API keys, set them first:

```bash
# Set your actual API keys
export BLOCKSTREAM_API_KEY_TESTNET="your_testnet_key"
export BLOCKSTREAM_API_KEY_MAINNET="your_mainnet_key"

# Build and deploy
cd /home/michael/code_projects/bitcoin_wallet/infrastructure/lambda-proxy
npm run build
cdk deploy --require-approval never
```

## After Deployment

Your wallet extension will work immediately using the public Blockstream API through your Lambda proxy.

### CloudWatch Logs

You can monitor requests in AWS CloudWatch:
- Go to: https://console.aws.amazon.com/cloudwatch/
- Find your Lambda function logs
- You'll see warnings like: "No API key configured, using public Blockstream API (rate-limited)"

### Getting API Keys (Optional)

For production or heavy usage, get API keys from:
- Blockstream: Contact them or check their website for paid API tiers
- Then redeploy with Option 2 above

## Troubleshooting

If deployment fails:
1. Check you're in the right directory: `/home/michael/code_projects/bitcoin_wallet/infrastructure/lambda-proxy`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Check CDK bootstrap: `cdk bootstrap`
