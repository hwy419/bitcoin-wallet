# Lambda Proxy Infrastructure

**Status**: ✅ Complete (v0.11.0)
**Last Updated**: 2025-10-28
**Owner**: Backend Developer

## Overview

AWS Lambda + API Gateway proxy infrastructure to secure the Blockstream API key before Chrome Web Store publication.

**Critical Security Fix**: Prevents users from extracting the Blockstream API key from the Chrome extension source code.

## Architecture

```
Chrome Extension → API Gateway → Lambda → Blockstream API
                                 (API key secure here!)
```

### Components

| Component | Purpose | Configuration |
|-----------|---------|---------------|
| **Lambda Function** | Proxies requests to Blockstream with secure API key injection | Node.js 20.x, 256MB RAM, 30s timeout |
| **API Gateway** | REST API endpoint with CORS, throttling, usage plans | 1000 req/sec rate limit, 5000 burst |
| **CloudWatch** | Monitoring, logging, alarms, dashboard | 7-day log retention, 4 alarms |
| **SNS** | Email alerts for operational issues | Optional email subscription |

### Infrastructure as Code

- **Tool**: AWS CDK (TypeScript)
- **Deployment**: `npm run deploy:dev`
- **Location**: `infrastructure/lambda-proxy/`

## Lambda Function

### Handler: `lambda/src/index.ts`

Main Lambda handler:

```typescript
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  // Handle OPTIONS for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(), body: '' };
  }

  // Extract path and network parameter
  const proxyPath = event.pathParameters?.proxy || '';
  const network = event.queryStringParameters?.network || 'testnet';

  // Proxy to Blockstream with API key
  const result = await proxyToBlockstream({
    method: event.httpMethod,
    path: proxyPath,
    body: event.body,
    network,
    requestId,
  });

  return {
    statusCode: result.statusCode,
    headers: corsHeaders(),
    body: result.body,
  };
};
```

### Proxy Logic: `lambda/src/blockstream-proxy.ts`

Forwards requests to Blockstream with secure API key injection:

```typescript
export async function proxyToBlockstream(
  request: ProxyRequest
): Promise<ProxyResult> {
  // Get API key from environment (secure!)
  const apiKey = request.network === 'testnet'
    ? process.env.BLOCKSTREAM_API_KEY_TESTNET
    : process.env.BLOCKSTREAM_API_KEY_MAINNET;

  const baseUrl = request.network === 'testnet'
    ? process.env.BLOCKSTREAM_BASE_URL_TESTNET
    : process.env.BLOCKSTREAM_BASE_URL_MAINNET;

  const targetUrl = `${baseUrl}/${request.path}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      'X-API-Key': apiKey,  // Add API key (SECURE!)
      'Content-Type': request.body ? 'application/json' : 'text/plain',
      'User-Agent': 'Bitcoin-Wallet-Chrome-Extension/1.0',
    },
    body: request.body || undefined,
    timeout: 25000,  // 25 second timeout
  });

  return {
    statusCode: response.status,
    body: await response.text(),
    duration: Date.now() - startTime,
  };
}
```

### Fee Estimate Caching

**Per Blockchain Expert recommendation**, fee estimates are cached for 60 seconds:

```typescript
let feeEstimateCache: { data: string; timestamp: number } | null = null;
const FEE_CACHE_TTL = 60000; // 60 seconds

// Check cache before proxying
if (request.method === 'GET' && request.path === 'fee-estimates') {
  const now = Date.now();
  if (feeEstimateCache && now - feeEstimateCache.timestamp < FEE_CACHE_TTL) {
    return { statusCode: 200, body: feeEstimateCache.data, duration: 0 };
  }
}

// Cache successful fee estimates
if (request.path === 'fee-estimates' && response.ok) {
  feeEstimateCache = { data: responseBody, timestamp: Date.now() };
}
```

### Structured Logging: `lambda/src/logger.ts`

Logs with automatic sanitization:

```typescript
class Logger {
  private sanitizeContext(context?: Record<string, any>) {
    if (!context) return undefined;

    const sanitized = { ...context };

    // Never log API keys
    delete sanitized.apiKey;
    delete sanitized.BLOCKSTREAM_API_KEY_TESTNET;
    delete sanitized.BLOCKSTREAM_API_KEY_MAINNET;

    // Mask Bitcoin addresses in production
    if (process.env.NODE_ENV === 'production' && sanitized.path) {
      sanitized.path = sanitized.path.replace(
        /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g,
        '***ADDRESS***'
      );
      sanitized.path = sanitized.path.replace(/tb1[a-z0-9]{39,87}/g, '***ADDRESS***');
      sanitized.path = sanitized.path.replace(/bc1[a-z0-9]{39,87}/g, '***ADDRESS***');
    }

    return sanitized;
  }
}
```

**Logs are JSON-structured** for CloudWatch Insights queries.

## CDK Infrastructure

### Main Stack: `lib/proxy-stack.ts`

```typescript
export class BlockstreamProxyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProxyStackProps) {
    super(scope, id, props);

    // Lambda function
    const lambda = new LambdaConstruct(this, 'ProxyLambda', {
      environment: props.environment,
      apiKeyTestnet: props.blockstreamApiKeyTestnet,
      apiKeyMainnet: props.blockstreamApiKeyMainnet,
    });

    // API Gateway
    const apiGateway = new ApiGatewayConstruct(this, 'ProxyApi', {
      lambdaFunction: lambda.function,
      environment: props.environment,
    });

    // Monitoring
    const monitoring = new MonitoringConstruct(this, 'ProxyMonitoring', {
      lambdaFunction: lambda.function,
      apiGateway: apiGateway.api,
      environment: props.environment,
      alertEmail: props.alertEmail,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.url,
      description: 'Proxy API endpoint for wallet configuration',
    });
  }
}
```

### Lambda Construct: `lib/constructs/lambda-construct.ts`

```typescript
export class LambdaConstruct extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    this.function = new lambda.Function(this, 'ProxyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/dist'),
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      environment: {
        BLOCKSTREAM_API_KEY_TESTNET: props.apiKeyTestnet,
        BLOCKSTREAM_API_KEY_MAINNET: props.apiKeyMainnet,
        BLOCKSTREAM_BASE_URL_TESTNET: 'https://blockstream.info/testnet/api',
        BLOCKSTREAM_BASE_URL_MAINNET: 'https://blockstream.info/api',
        LOG_LEVEL: props.environment === 'production' ? 'INFO' : 'DEBUG',
        NODE_ENV: props.environment,
      },
      logRetention: logs.RetentionDays.ONE_WEEK,
      reservedConcurrentExecutions: 100,
    });
  }
}
```

### API Gateway Construct: `lib/constructs/api-gateway-construct.ts`

```typescript
export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'BlockstreamProxyApi', {
      restApiName: `Blockstream Proxy API (${props.environment})`,
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 5000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['chrome-extension://*'],
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
      },
    });

    const integration = new apigateway.LambdaIntegration(props.lambdaFunction, {
      proxy: true,
    });

    const blockstream = this.api.root.addResource('blockstream');
    blockstream.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    // Usage plan for rate limiting
    const plan = this.api.addUsagePlan('UsagePlan', {
      throttle: { rateLimit: 1000, burstLimit: 5000 },
      quota: { limit: 1000000, period: apigateway.Period.MONTH },
    });
    plan.addApiStage({ stage: this.api.deploymentStage });
  }
}
```

### Monitoring Construct: `lib/constructs/monitoring-construct.ts`

```typescript
export class MonitoringConstruct extends Construct {
  public readonly snsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    this.snsTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `Blockstream Proxy Alerts (${props.environment})`,
    });

    if (props.alertEmail) {
      this.snsTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alertEmail)
      );
    }

    // Alarm: High error rate
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
      metric: props.lambdaFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
    });
    errorAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    // ... 3 more alarms ...

    // Dashboard
    new cloudwatch.Dashboard(this, 'ProxyDashboard', {
      dashboardName: `BlockstreamProxy-${props.environment}`,
      widgets: [
        // Lambda invocations, errors, duration, throttles
        // API Gateway requests, errors, latency
      ],
    });
  }
}
```

## Deployment

### Prerequisites

- AWS CLI configured with credentials
- Node.js 20+ and npm installed
- AWS CDK installed globally: `npm install -g aws-cdk`
- Blockstream API keys (testnet and mainnet)

### Deploy to Development

```bash
cd infrastructure/lambda-proxy

# Install dependencies
npm install
cd lambda && npm install && cd ..

# Build Lambda code
cd lambda && npm run build && cd ..

# Set environment variables
export BLOCKSTREAM_API_KEY_TESTNET="your_testnet_key"
export BLOCKSTREAM_API_KEY_MAINNET="your_mainnet_key"
export ALERT_EMAIL="your_email@example.com"

# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/us-east-1

# Deploy
npm run deploy:dev
```

**Deployment outputs:**

```
Outputs:
BlockstreamProxyStack-dev.ApiEndpoint = https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream/
BlockstreamProxyStack-dev.LambdaFunctionName = BlockstreamProxyStack-dev-ProxyLambdaProxyFunction...
BlockstreamProxyStack-dev.SnsTopicArn = arn:aws:sns:us-east-1:123456789012:blockstream-proxy-alerts-dev
BlockstreamProxyStack-dev.DashboardName = BlockstreamProxy-dev
```

**Save the API endpoint** for extension configuration!

### Update Lambda Code

```bash
cd lambda
npm run build
cd ..
npm run deploy:dev
```

### Rotate API Keys

```bash
export BLOCKSTREAM_API_KEY_TESTNET="new_testnet_key"
export BLOCKSTREAM_API_KEY_MAINNET="new_mainnet_key"
npm run deploy:dev
```

### Destroy Infrastructure

```bash
npm run destroy:dev
```

## Testing

### CDK Infrastructure Tests

```bash
cd infrastructure/lambda-proxy
npm test
```

**Tests verify:**
- Lambda function created with correct runtime (nodejs20.x)
- API Gateway created with correct configuration
- CloudWatch alarms created (4 alarms)
- SNS topic and email subscription
- CloudWatch dashboard
- Usage plan for rate limiting
- Stack outputs

### Functional Tests

```bash
export API_URL="https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream/"

# Test block height (testnet)
curl "${API_URL}blocks/tip/height?network=testnet"
# Expected: 2800000 (or current testnet block height)

# Test address lookup (testnet)
curl "${API_URL}address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx?network=testnet"
# Expected: JSON with address info

# Test fee estimates (cached for 60 seconds)
curl "${API_URL}fee-estimates?network=testnet"
# Expected: {"1":20,"2":18,"3":16,...}

# Test mainnet
curl "${API_URL}blocks/tip/height?network=mainnet"
# Expected: 870000 (or current mainnet block height)
```

### View Logs

```bash
aws logs tail /aws/lambda/BlockstreamProxyStack-dev-ProxyLambdaProxyFunction... --follow
```

## Monitoring

### CloudWatch Dashboard

**Location**: AWS Console → CloudWatch → Dashboards → `BlockstreamProxy-dev`

**Widgets:**
- Lambda invocations (count over time)
- Lambda errors (count over time)
- Lambda duration (p50/p95/p99)
- Lambda throttles
- API Gateway requests (count over time)
- API Gateway errors (4xx, 5xx)
- API Gateway latency (p50/p95/p99)

### CloudWatch Alarms

Four alarms send emails to `ALERT_EMAIL` via SNS:

| Alarm | Threshold | Period | Action |
|-------|-----------|--------|--------|
| **High Error Rate** | >10 errors | 5 minutes | SNS email |
| **High Duration** | p95 >5 seconds | 2 periods (10 min) | SNS email |
| **High Invocation Count** | >100k requests | 1 hour | SNS email (abuse detection) |
| **API Gateway 5xx Errors** | >5 errors | 5 minutes | SNS email |

### Log Insights Queries

**Query: Error rate by hour**

```
fields @timestamp, level, message, context.requestId
| filter level = "ERROR"
| stats count() by bin(1h)
```

**Query: Slow requests (>3 seconds)**

```
fields @timestamp, context.duration, context.path, context.requestId
| filter context.duration > 3000
| sort context.duration desc
```

**Query: Most requested endpoints**

```
fields context.path
| stats count() by context.path
| sort count desc
```

## Cost Estimate

**Expected monthly cost**: $5-10 (within AWS Free Tier first year)

### Breakdown (100,000 requests/month)

| Service | Pricing | Monthly Cost |
|---------|---------|--------------|
| **Lambda Requests** | $0.20 per 1M requests | $0.02 |
| **Lambda Compute** | $0.0000166667 per GB-second | $0.21 |
| **API Gateway** | $3.50 per 1M requests | $0.35 |
| **CloudWatch Logs** | $0.50/GB ingested | ~$0.50 |
| **CloudWatch Alarms** | $0.10 per alarm | $0.40 |
| **SNS** | $0.50 per 1M requests | <$0.01 |
| **Total** | | **~$1.50/month** |

### Free Tier (First 12 Months)

- Lambda: 1M requests/month + 400,000 GB-seconds/month
- API Gateway: 1M requests/month
- CloudWatch: 10 custom metrics + 10 alarms
- SNS: 1000 emails/month

**Most usage will be FREE for the first year!**

### Cost Optimization

1. **Fee estimate caching** (60 seconds) reduces API calls by ~50%
2. **Reserved concurrency** (100) prevents runaway costs
3. **API Gateway throttling** (1000/sec) prevents abuse
4. **CloudWatch alarm** triggers at >100k requests/hour

### View Current Costs

```bash
# AWS Console → Billing → Cost Explorer
aws ce get-cost-and-usage \
  --time-period Start=2025-10-01,End=2025-10-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://filter.json
```

## Security

### API Key Protection

- API keys stored as Lambda environment variables
- Environment variables encrypted at rest by AWS KMS
- Keys **never exposed** to client code
- Keys **never logged** (automatic sanitization)

### Address Masking in Logs

In production, Bitcoin addresses are masked:

```typescript
// Before masking:
/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx

// After masking:
/address/***ADDRESS***
```

Patterns masked:
- Legacy: `[13][a-km-zA-HJ-NP-Z1-9]{25,34}`
- Testnet legacy: `[mn2][a-km-zA-HJ-NP-Z1-9]{25,34}`
- Testnet bech32: `tb1[a-z0-9]{39,87}`
- Mainnet bech32: `bc1[a-z0-9]{39,87}`

### CORS Policy

API Gateway only allows requests from Chrome extensions:

```typescript
allowOrigins: ['chrome-extension://*']
```

**Chrome extension must add permission** in manifest.json:

```json
{
  "permissions": [
    "https://abc123xyz.execute-api.us-east-1.amazonaws.com/*"
  ]
}
```

### Rate Limiting

- **API Gateway**: 1000 requests/sec, burst 5000
- **Usage Plan**: 1M requests/month quota
- **Lambda**: 100 reserved concurrent executions
- **Alarm**: >100k requests/hour triggers abuse detection

### Secrets Management (Production)

**Current**: Environment variables (encrypted at rest)

**Recommended for production**: AWS Secrets Manager

```typescript
// In lambda-construct.ts
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const apiKeySecret = secretsmanager.Secret.fromSecretNameV2(
  this,
  'BlockstreamApiKey',
  'prod/blockstream/api-key'
);

this.function.addEnvironment(
  'BLOCKSTREAM_API_KEY_TESTNET',
  apiKeySecret.secretValueFromJson('testnet').toString()
);
```

## Chrome Extension Integration

### Update BlockstreamClient

**File**: `src/background/api/BlockstreamClient.ts`

```typescript
class BlockstreamClient {
  private baseUrl: string;

  constructor(network: 'testnet' | 'mainnet') {
    // Use Lambda proxy URL
    this.baseUrl = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream/';
    this.networkSuffix = `?network=${network}`;
  }

  async getAddress(address: string): Promise<AddressInfo> {
    const url = `${this.baseUrl}address/${address}${this.networkSuffix}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch address: ${response.statusText}`);
    }

    return response.json();
  }

  async getUTXOs(address: string): Promise<UTXO[]> {
    const url = `${this.baseUrl}address/${address}/utxo${this.networkSuffix}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
    }

    return response.json();
  }

  async getFeeEstimates(): Promise<FeeEstimates> {
    // Fee estimates are cached for 60 seconds in Lambda
    const url = `${this.baseUrl}fee-estimates${this.networkSuffix}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch fee estimates: ${response.statusText}`);
    }

    return response.json();
  }

  async broadcastTransaction(txHex: string): Promise<string> {
    const url = `${this.baseUrl}tx${this.networkSuffix}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: txHex,
    });

    if (!response.ok) {
      throw new Error(`Failed to broadcast transaction: ${response.statusText}`);
    }

    return response.text(); // Returns txid
  }
}
```

### Update manifest.json

```json
{
  "name": "Bitcoin Wallet",
  "version": "0.11.0",
  "permissions": [
    "storage",
    "https://abc123xyz.execute-api.us-east-1.amazonaws.com/*"
  ]
}
```

### Remove Blockstream API Key

**CRITICAL**: Before publishing to Chrome Web Store, remove any hardcoded Blockstream API keys from:

- `src/background/api/BlockstreamClient.ts`
- Any configuration files
- Environment variable defaults

The API key is now **secure in Lambda** and will never be exposed to extension users.

## Production Deployment

### Deploy Production Stack

```bash
# Uncomment in bin/proxy.ts
cdk deploy BlockstreamProxyStack-production
```

### Production Recommendations

- [ ] Use separate AWS account for production
- [ ] Enable AWS CloudTrail for audit logging
- [ ] Set up AWS Config for compliance monitoring
- [ ] Use AWS Secrets Manager for API keys
- [ ] Enable API Gateway access logs
- [ ] Add AWS WAF for DDoS protection
- [ ] Use custom domain with Route 53 and ACM
- [ ] Set up AWS Budgets with alerts ($50/month)
- [ ] Enable AWS CloudWatch anomaly detection
- [ ] Implement API key rotation schedule (quarterly)
- [ ] Set up multi-region failover (optional)
- [ ] Enable AWS X-Ray for distributed tracing

### Custom Domain Setup

```typescript
// In api-gateway-construct.ts
const certificate = acm.Certificate.fromCertificateArn(
  this,
  'Certificate',
  'arn:aws:acm:us-east-1:123456789012:certificate/...'
);

const domainName = new apigateway.DomainName(this, 'CustomDomain', {
  domainName: 'api.yourwallet.com',
  certificate,
});

domainName.addBasePathMapping(this.api, { basePath: 'blockstream' });
```

**Extension would use**: `https://api.yourwallet.com/blockstream/`

## Troubleshooting

### Lambda Returns 502 Bad Gateway

**Check logs:**

```bash
aws logs tail /aws/lambda/BlockstreamProxyStack-dev-ProxyLambdaProxyFunction... --follow
```

**Common causes:**
- Invalid Blockstream API key (check environment variables)
- Blockstream API unreachable (check https://blockstream.info status)
- Lambda timeout (increase timeout in `lib/constructs/lambda-construct.ts`)

### API Returns 403 Forbidden (CORS)

**Solution**: Add API Gateway URL to Chrome extension manifest permissions

### High Error Rate

**Check CloudWatch alarms** for root cause

**Query logs for errors:**

```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/BlockstreamProxyStack-dev-ProxyLambdaProxyFunction... \
  --filter-pattern "ERROR"
```

### Deployment Fails

**Error**: `No bucket named 'cdk-hnb659fds-assets-...'`

**Solution**: Run CDK bootstrap

```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Known Issues

None currently.

## Future Enhancements

- [ ] Add AWS X-Ray for distributed tracing
- [ ] Implement request caching in API Gateway (reduce Lambda invocations)
- [ ] Add AWS WAF rules for DDoS protection
- [ ] Set up multi-region deployment for high availability
- [ ] Implement API key rotation automation
- [ ] Add CloudWatch anomaly detection
- [ ] Create staging environment
- [ ] Add integration tests (automated API testing)
- [ ] Implement circuit breaker pattern for Blockstream API failures
- [ ] Add request/response compression

## Documentation

- **README**: `infrastructure/lambda-proxy/README.md`
- **Deployment Guide**: `infrastructure/lambda-proxy/DEPLOYMENT_GUIDE.md`
- **CDK Tests**: `infrastructure/lambda-proxy/test/proxy-stack.test.ts`

## Related Documentation

- [API Client](./api.md) - BlockstreamClient implementation
- [Service Worker](./service-worker.md) - Background script architecture
- [Decisions](./decisions.md) - Architectural decision records

---

**Last Review**: 2025-10-28
**Next Review**: Before production deployment
**Maintained By**: Backend Developer
