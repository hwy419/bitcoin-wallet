# Blockstream API Proxy - AWS Lambda + CDK

Secure AWS Lambda proxy for Blockstream API to protect API keys in production.

## Overview

This proxy sits between the Bitcoin Wallet Chrome Extension and the Blockstream API, keeping API keys secure on the backend.

```
Extension → Lambda Proxy → Blockstream API
(No API key)  (Has key)     (Protected)
```

## Quick Start

### Prerequisites

- Node.js 20.x
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Blockstream API key (testnet and/or mainnet)

### 1. Install Dependencies

```bash
# CDK dependencies
cd infrastructure/lambda-proxy
npm install

# Lambda dependencies
cd lambda
npm install
cd ..
```

### 2. Build Lambda Function

```bash
cd lambda
npm run build
cd ..
```

### 3. Set Environment Variables

```bash
export BLOCKSTREAM_API_KEY_TESTNET="your_testnet_key"
export BLOCKSTREAM_API_KEY_MAINNET="your_mainnet_key"  # Optional
```

### 4. Deploy to AWS

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy to dev environment
cdk deploy

# Deploy to staging
cdk deploy -c environment=staging

# Deploy to production
cdk deploy -c environment=production
```

### 5. Get API Endpoint

After deployment, CDK will output the API Gateway URL:

```
Outputs:
BlockstreamProxy-dev.ApiEndpoint = https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/blockstream
```

### 6. Configure Extension

Update your extension's `.env.local`:

```bash
BLOCKSTREAM_PROXY_URL=https://xxxxxxxx.execute-api.us-east-1.amazonaws.com/dev/blockstream
```

Rebuild the extension:

```bash
cd ../../..  # Back to bitcoin_wallet root
npm run build
```

## Project Structure

```
lambda-proxy/
├── bin/                    # CDK app entry point
│   └── proxy.ts
├── lib/                    # CDK stack and constructs
│   ├── proxy-stack.ts
│   └── constructs/
│       ├── lambda-construct.ts
│       ├── api-gateway-construct.ts
│       └── monitoring-construct.ts
├── lambda/                 # Lambda function code
│   ├── src/
│   │   ├── index.ts       # Handler
│   │   ├── blockstream-proxy.ts
│   │   ├── logger.ts
│   │   └── types.ts
│   ├── package.json
│   └── webpack.config.js
├── package.json
├── tsconfig.json
└── cdk.json
```

## Useful Commands

```bash
# CDK Commands
npm run build       # Compile TypeScript
npm run cdk synth   # Generate CloudFormation template
npm run cdk diff    # Compare deployed vs local
npm run deploy      # Deploy stack
npm run destroy     # Delete stack

# Lambda Commands
cd lambda
npm run build       # Build Lambda bundle
npm run dev         # Watch mode
```

## Monitoring

View CloudWatch dashboard: AWS Console → CloudWatch → Dashboards → BlockstreamProxy-{env}

Metrics include:
- Lambda invocations
- Error rate
- Duration (p50, p95, p99)
- API Gateway requests

## Cost Estimates

- Dev: ~$0-5/month (within free tier)
- Production: ~$5-10/month (100k-500k req/month)

## Security

- API keys stored in Lambda environment variables (encrypted with KMS)
- Keys never transmitted to client
- Logs sanitized (no API keys logged)
- CORS restricted to extension origins
- Rate limiting enabled

## Troubleshooting

### Deployment fails with "No stack named..."

Run `cdk bootstrap` first.

### "Configuration missing for testnet"

Set `BLOCKSTREAM_API_KEY_TESTNET` environment variable before deploying.

### Extension can't connect to proxy

1. Check API Gateway URL in extension's `.env.local`
2. Verify CORS allows `chrome-extension://*`
3. Check Lambda logs in CloudWatch

## Rollback

To rollback to direct Blockstream API (emergency):

```bash
# Remove proxy URL from .env.local
# Rebuild extension
npm run build
```

## Documentation

- **Architecture**: See `../../prompts/docs/plans/BLOCKSTREAM_API_PROXY_PLAN.md`
- **PRD**: See `../../prompts/docs/plans/BLOCKSTREAM_API_PROXY_PRD.md`
- **Summary**: See `../../prompts/docs/plans/BLOCKSTREAM_API_PROXY_SUMMARY.md`
