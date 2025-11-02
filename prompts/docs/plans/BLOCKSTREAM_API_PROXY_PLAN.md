# AWS Lambda API Proxy for Secure Blockstream API Access

**Status**: 📋 Ready to Implement
**Priority**: P0 - Critical for Production
**Target Implementation**: Before Chrome Web Store publication
**Last Updated**: 2025-10-28
**Estimated Cost**: $5-10/month (within AWS Free Tier first year)
**Implementation Time**: 6-8 hours

**📋 Product Requirements Document**: See `BLOCKSTREAM_API_PROXY_PRD.md` for complete product validation, requirements, success metrics, and approval checklist

---

## Executive Summary

### The Security Problem

Chrome extensions are **client-side applications** - their source code is downloaded and stored on users' computers. Any API keys or secrets bundled in the extension can be extracted in seconds:

```bash
# How anyone can steal your API key:
1. Install extension from Chrome Web Store
2. Navigate to chrome://extensions/
3. Enable Developer mode
4. View extension files (they're just JavaScript)
5. Search for API key in background.js
6. Use YOUR key for THEIR projects (you pay)
```

**Impact if API key is exposed:**
- ❌ Anyone can steal your Blockstream API key
- ❌ They can consume YOUR paid credits
- ❌ You pay for their usage (could be $100s-$1000s)
- ❌ Blockstream may revoke your key if abused
- ❌ No way to revoke access without republishing extension

**This is why client-side API keys are NEVER acceptable in production.**

### The Solution: Backend Proxy

Place an AWS Lambda function between your extension and Blockstream:

```
┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  Extension   │────▶│  Lambda Proxy  │────▶│  Blockstream │
│  No secrets  │ HTTPS│  Has API key   │ HTTPS│     API      │
└──────────────┘     └────────────────┘     └──────────────┘
```

**How it works:**
1. Extension calls your Lambda API (e.g., `https://api.yourdomain.com/blockstream/address/...`)
2. Lambda receives request, adds Blockstream API key from environment variables
3. Lambda forwards request to Blockstream
4. Lambda returns response to extension

**API key never leaves your AWS infrastructure** - completely secure.

### Why Lambda Proxy is the Right Choice

**Compared to Direct Blockstream API:**
- ✅ Secure (API key hidden)
- ✅ Uses your Blockstream credits
- ✅ No rate limit changes
- ✅ Minimal latency overhead (~50ms)
- ✅ Quick to implement (6-8 hours)

**Compared to Self-Hosted Esplora:**
- ✅ Much cheaper ($10/month vs $50-200/month)
- ✅ Much faster to implement (6-8 hours vs 4-5 days)
- ✅ No infrastructure maintenance
- ✅ Auto-scales with usage
- ❌ Still costs Blockstream credits
- ❌ Dependent on Blockstream availability

**Decision:** Lambda Proxy is perfect for current scale. Self-hosting can be added later when volume justifies the cost.

---

## Architecture

### High-Level Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Side                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         Bitcoin Wallet Chrome Extension                    │ │
│  │                                                            │ │
│  │  • No API keys stored                                      │ │
│  │  • BlockstreamClient.ts points to proxy                   │ │
│  │  • Makes HTTPS requests to API Gateway                    │ │
│  └─────────────────────┬──────────────────────────────────────┘ │
└────────────────────────┼───────────────────────────────────────────┘
                         │
                         │ HTTPS (TLS 1.3)
                         │ https://api.yourdomain.com/blockstream/*
                         │
┌────────────────────────▼───────────────────────────────────────────┐
│                        AWS Cloud                                   │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Amazon API Gateway                          │ │
│  │                                                              │ │
│  │  REST API Configuration:                                     │ │
│  │  • Custom domain: api.yourdomain.com                        │ │
│  │  • CORS: Enabled for extension origin                       │ │
│  │  • Rate limiting: 10,000 req/sec (burst: 5,000)            │ │
│  │  • Throttling: 1,000 req/sec per IP (anti-abuse)           │ │
│  │  • Request validation: Path parameters                      │ │
│  │  • Caching: Optional (TTL: 30 seconds for GET requests)    │ │
│  │                                                              │ │
│  │  Routes:                                                     │ │
│  │  • GET  /blockstream/{proxy+}  → Lambda                     │ │
│  │  • POST /blockstream/tx        → Lambda (broadcast)         │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                        │
│                           │ Proxy Integration                      │
│                           │                                        │
│  ┌────────────────────────▼─────────────────────────────────────┐ │
│  │              AWS Lambda Function                             │ │
│  │              Runtime: Node.js 20.x                           │ │
│  │                                                              │ │
│  │  Configuration:                                              │ │
│  │  • Memory: 256 MB (sufficient for proxying)                 │ │
│  │  • Timeout: 30 seconds (API calls + overhead)               │ │
│  │  • Concurrency: 1000 (default, can increase)                │ │
│  │  • Environment Variables:                                    │ │
│  │    - BLOCKSTREAM_API_KEY_TESTNET (encrypted)                │ │
│  │    - BLOCKSTREAM_API_KEY_MAINNET (encrypted)                │ │
│  │    - BLOCKSTREAM_BASE_URL_TESTNET                           │ │
│  │    - BLOCKSTREAM_BASE_URL_MAINNET                           │ │
│  │    - LOG_LEVEL=INFO                                         │ │
│  │                                                              │ │
│  │  Handler Logic:                                              │ │
│  │  1. Extract path from API Gateway event                     │ │
│  │  2. Determine network (testnet vs mainnet)                  │ │
│  │  3. Build Blockstream API URL                               │ │
│  │  4. Add API key to headers                                  │ │
│  │  5. Forward request (with body for POST)                    │ │
│  │  6. Return response (with CORS headers)                     │ │
│  │  7. Log metrics (sanitized, no sensitive data)              │ │
│  └────────────────────────┬─────────────────────────────────────┘ │
│                           │                                        │
│                           │ HTTPS with API Key                     │
│                           │                                        │
│  ┌────────────────────────▼─────────────────────────────────────┐ │
│  │              CloudWatch Logs & Metrics                       │ │
│  │                                                              │ │
│  │  Logs:                                                       │ │
│  │  • Request logs (method, path, status, duration)            │ │
│  │  • Error logs (stack traces, sanitized)                     │ │
│  │  • Retention: 7 days (configurable)                         │ │
│  │                                                              │ │
│  │  Metrics:                                                    │ │
│  │  • Invocation count                                         │ │
│  │  • Error count                                              │ │
│  │  • Duration (p50, p95, p99)                                 │ │
│  │  • Throttles                                                │ │
│  │                                                              │ │
│  │  Alarms:                                                     │ │
│  │  • Error rate > 5% for 5 minutes                            │ │
│  │  • Duration p95 > 5 seconds                                 │ │
│  │  • Estimated costs > $50/month                              │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS + X-API-Key header
                         │
┌────────────────────────▼───────────────────────────────────────────┐
│                  Blockstream Esplora API                           │
│                  https://blockstream.info/                         │
│                                                                    │
│  • Testnet: https://blockstream.info/testnet/api                  │
│  • Mainnet: https://blockstream.info/api                          │
│  • Uses your paid API credits                                     │
│  • Rate limits apply per your plan                                │
└────────────────────────────────────────────────────────────────────┘
```

### Request Flow Example

**User clicks "Send" in wallet:**

```
1. Extension (BlockstreamClient.ts):
   GET https://api.yourdomain.com/blockstream/address/tb1q.../utxo
   Headers: { Origin: chrome-extension://... }

2. API Gateway:
   • CORS check: Allow (extension origin whitelisted)
   • Rate limit check: OK (within limit)
   • Route to Lambda: /blockstream/address/{address}/utxo

3. Lambda Function:
   • Receive event: { path: "/address/tb1q.../utxo", httpMethod: "GET" }
   • Extract path: "/address/tb1q.../utxo"
   • Get API key: process.env.BLOCKSTREAM_API_KEY_TESTNET
   • Build URL: https://blockstream.info/testnet/api/address/tb1q.../utxo
   • Fetch with headers: { "X-API-Key": "your_key_here" }
   • Receive response: [{ txid: "...", vout: 0, value: 50000, ... }]
   • Return to API Gateway

4. API Gateway:
   • Add CORS headers
   • Return to extension

5. Extension:
   • Receives UTXO array
   • Builds transaction
   • Displays confirmation UI
```

**Total roundtrip time:** ~200-400ms
- Extension → API Gateway: ~20-50ms
- API Gateway → Lambda: ~5-10ms (warm) or ~100-200ms (cold start)
- Lambda → Blockstream: ~100-200ms
- Blockstream processing: ~50-100ms
- Return path: ~50-100ms

### Security Model

**API Key Protection:**
- ✅ Stored in Lambda environment variables (encrypted at rest with KMS)
- ✅ Never transmitted to client
- ✅ Never logged in CloudWatch
- ✅ Rotatable without redeploying extension
- ✅ Separate keys for testnet/mainnet
- ✅ Access controlled via IAM roles

**Network Security:**
- ✅ HTTPS only (TLS 1.3)
- ✅ CORS configured for extension origin only
- ✅ Rate limiting per IP
- ✅ API Gateway throttling
- ✅ Lambda concurrency limits

**Abuse Prevention:**
- ✅ Rate limiting: 1000 req/sec per IP
- ✅ Burst limiting: 5000 requests
- ✅ CloudWatch alarms for anomalies
- ✅ Can add API key authentication for extension (optional)
- ✅ Can add request signing (optional)

**Data Privacy:**
- ✅ No user data stored (stateless proxy)
- ✅ Logs sanitized (no addresses or sensitive info in production)
- ✅ 7-day log retention (adjustable)
- ✅ GDPR compliant (no PII)

---

## Infrastructure as Code (AWS CDK)

### Technology Stack

**AWS CDK (TypeScript):**
- Infrastructure defined in TypeScript (same language as wallet)
- Type-safe configuration
- Reusable constructs
- Best practices built-in

**Alternative Considered:**
- AWS SAM: Simpler but less flexible
- Serverless Framework: Third-party dependency
- Terraform: Different language (HCL)

**Decision:** AWS CDK for consistency with wallet codebase and TypeScript expertise.

### Project Structure

```
bitcoin_wallet/
├── infrastructure/
│   └── lambda-proxy/                    # NEW: Lambda proxy infrastructure
│       ├── bin/
│       │   └── proxy.ts                 # CDK app entry point
│       ├── lib/
│       │   ├── proxy-stack.ts           # Main CDK stack
│       │   ├── constructs/
│       │   │   ├── lambda-construct.ts          # Lambda function + IAM role
│       │   │   ├── api-gateway-construct.ts     # API Gateway + custom domain
│       │   │   └── monitoring-construct.ts      # CloudWatch alarms + dashboard
│       │   └── config/
│       │       ├── environments.ts              # Dev/staging/prod configs
│       │       └── constants.ts                 # Shared constants
│       ├── lambda/
│       │   ├── src/
│       │   │   ├── index.ts             # Lambda handler
│       │   │   ├── blockstream-proxy.ts # Proxy logic
│       │   │   ├── logger.ts            # Structured logging
│       │   │   └── types.ts             # TypeScript types
│       │   ├── package.json             # Lambda dependencies
│       │   ├── tsconfig.json
│       │   └── webpack.config.js        # Bundle Lambda code
│       ├── test/
│       │   ├── proxy-stack.test.ts      # CDK snapshot tests
│       │   └── lambda.test.ts           # Lambda unit tests
│       ├── package.json                 # CDK dependencies
│       ├── tsconfig.json
│       ├── cdk.json                     # CDK configuration
│       └── README.md                    # Deployment instructions
├── src/
│   └── background/api/
│       └── BlockstreamClient.ts         # UPDATE: Change baseUrl to proxy
└── ... (existing wallet code)
```

### CDK Stack Definition

**Main Stack** (`lib/proxy-stack.ts`):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';

export interface ProxyStackProps extends cdk.StackProps {
  environment: 'dev' | 'staging' | 'production';
  blockstreamApiKeyTestnet: string;
  blockstreamApiKeyMainnet: string;
  domainName?: string;  // Optional custom domain
}

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
      domainName: props.domainName,
      environment: props.environment,
    });

    // Monitoring
    const monitoring = new MonitoringConstruct(this, 'ProxyMonitoring', {
      lambdaFunction: lambda.function,
      apiGateway: apiGateway.api,
      environment: props.environment,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.url,
      description: 'Proxy API endpoint for wallet configuration',
      exportName: `${props.environment}-blockstream-proxy-url`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambda.function.functionName,
      description: 'Lambda function name for debugging',
    });
  }
}
```

### Lambda Construct

**Lambda Configuration** (`lib/constructs/lambda-construct.ts`):

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface LambdaConstructProps {
  environment: string;
  apiKeyTestnet: string;
  apiKeyMainnet: string;
}

export class LambdaConstruct extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaConstructProps) {
    super(scope, id);

    this.function = new lambda.Function(this, 'ProxyFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/dist'),  // Webpack bundle
      memorySize: 256,  // MB
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
      reservedConcurrentExecutions: 100,  // Prevent runaway costs
    });

    // Grant permissions (if needed)
    // this.function.addToRolePolicy(...);
  }
}
```

### API Gateway Construct

**API Gateway Configuration** (`lib/constructs/api-gateway-construct.ts`):

```typescript
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ApiGatewayConstructProps {
  lambdaFunction: lambda.Function;
  domainName?: string;
  environment: string;
}

export class ApiGatewayConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly url: string;

  constructor(scope: Construct, id: string, props: ApiGatewayConstructProps) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'BlockstreamProxyApi', {
      restApiName: `Blockstream Proxy API (${props.environment})`,
      description: 'Secure proxy for Blockstream API',
      deployOptions: {
        stageName: props.environment,
        throttlingRateLimit: 1000,  // Requests per second
        throttlingBurstLimit: 5000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,  // Don't log request/response bodies (privacy)
      },
      defaultCorsPreflightOptions: {
        allowOrigins: ['chrome-extension://*'],  // Allow all extension origins
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    // Add Lambda integration
    const integration = new apigateway.LambdaIntegration(props.lambdaFunction, {
      proxy: true,  // Pass through all request data
      allowTestInvoke: false,  // Disable test button in console (security)
    });

    // Add routes
    const blockstream = this.api.root.addResource('blockstream');
    blockstream.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    this.url = this.api.url + 'blockstream/';
  }
}
```

### Monitoring Construct

**CloudWatch Configuration** (`lib/constructs/monitoring-construct.ts`):

```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  lambdaFunction: lambda.Function;
  apiGateway: apigateway.RestApi;
  environment: string;
  alertEmail?: string;
}

export class MonitoringConstruct extends Construct {
  public readonly snsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // SNS Topic for alerts
    this.snsTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `Blockstream Proxy Alerts (${props.environment})`,
    });

    // Email subscription (if provided)
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
      threshold: 10,  // More than 10 errors in 5 minutes
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Lambda function error rate is too high',
    });
    errorAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    // Alarm: High duration (slow responses)
    const durationAlarm = new cloudwatch.Alarm(this, 'HighDuration', {
      metric: props.lambdaFunction.metricDuration({
        statistic: 'p95',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5000,  // 5 seconds (p95)
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Lambda p95 duration is too high',
    });
    durationAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    // Alarm: Cost anomaly
    const invocationAlarm = new cloudwatch.Alarm(this, 'HighInvocationCount', {
      metric: props.lambdaFunction.metricInvocations({
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 100000,  // 100k requests/hour (potential abuse)
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Unusually high request volume (potential abuse or attack)',
    });
    invocationAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    // Dashboard
    new cloudwatch.Dashboard(this, 'ProxyDashboard', {
      dashboardName: `BlockstreamProxy-${props.environment}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Invocations',
            left: [props.lambdaFunction.metricInvocations()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Errors',
            left: [props.lambdaFunction.metricErrors()],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Duration',
            left: [
              props.lambdaFunction.metricDuration({ statistic: 'p50' }),
              props.lambdaFunction.metricDuration({ statistic: 'p95' }),
              props.lambdaFunction.metricDuration({ statistic: 'p99' }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'API Gateway Requests',
            left: [
              props.apiGateway.metricCount(),
              props.apiGateway.metric4xxError(),
              props.apiGateway.metric5xxError(),
            ],
            width: 12,
          }),
        ],
      ],
    });
  }
}
```

---

## Lambda Function Implementation

### Handler Code (`lambda/src/index.ts`)

```typescript
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { proxyToBlockstream } from './blockstream-proxy';
import { logger } from './logger';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const requestId = event.requestContext.requestId;

  logger.info('Received request', {
    requestId,
    method: event.httpMethod,
    path: event.path,
    sourceIp: event.requestContext.identity.sourceIp,
  });

  try {
    // Extract the path after /blockstream/
    const proxyPath = event.pathParameters?.proxy || '';

    // Determine network from path or query parameter
    const network = event.queryStringParameters?.network || 'testnet';
    if (network !== 'testnet' && network !== 'mainnet') {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: 'Invalid network. Must be "testnet" or "mainnet"' }),
      };
    }

    // Proxy the request
    const result = await proxyToBlockstream({
      method: event.httpMethod,
      path: proxyPath,
      body: event.body,
      network,
      requestId,
    });

    logger.info('Request completed', {
      requestId,
      statusCode: result.statusCode,
      duration: result.duration,
    });

    return {
      statusCode: result.statusCode,
      headers: {
        ...corsHeaders(),
        'Content-Type': 'application/json',
      },
      body: result.body,
    };
  } catch (error) {
    logger.error('Request failed', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: 'Internal server error',
        requestId,
      }),
    };
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',  // Or specific extension origin
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
```

### Proxy Logic (`lambda/src/blockstream-proxy.ts`)

```typescript
import fetch from 'node-fetch';
import { logger } from './logger';

interface ProxyRequest {
  method: string;
  path: string;
  body: string | null;
  network: 'testnet' | 'mainnet';
  requestId: string;
}

interface ProxyResult {
  statusCode: number;
  body: string;
  duration: number;
}

export async function proxyToBlockstream(
  request: ProxyRequest
): Promise<ProxyResult> {
  const startTime = Date.now();

  // Get configuration from environment
  const apiKey = request.network === 'testnet'
    ? process.env.BLOCKSTREAM_API_KEY_TESTNET
    : process.env.BLOCKSTREAM_API_KEY_MAINNET;

  const baseUrl = request.network === 'testnet'
    ? process.env.BLOCKSTREAM_BASE_URL_TESTNET
    : process.env.BLOCKSTREAM_BASE_URL_MAINNET;

  if (!apiKey || !baseUrl) {
    throw new Error(`Configuration missing for ${request.network}`);
  }

  // Build target URL
  const targetUrl = `${baseUrl}/${request.path}`;

  logger.debug('Proxying to Blockstream', {
    requestId: request.requestId,
    method: request.method,
    url: targetUrl,
    network: request.network,
  });

  try {
    // Forward request to Blockstream
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'X-API-Key': apiKey,  // Add API key (SECURE!)
        'Content-Type': request.body ? 'application/json' : 'text/plain',
        'User-Agent': 'Bitcoin-Wallet-Chrome-Extension/1.0',
      },
      body: request.body || undefined,
      timeout: 25000,  // 25 second timeout (Lambda has 30s total)
    });

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    logger.debug('Blockstream response received', {
      requestId: request.requestId,
      statusCode: response.status,
      duration,
    });

    return {
      statusCode: response.status,
      body: responseBody,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('Blockstream request failed', {
      requestId: request.requestId,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });

    // Return 502 Bad Gateway if Blockstream is unreachable
    return {
      statusCode: 502,
      body: JSON.stringify({
        error: 'Failed to reach Blockstream API',
        requestId: request.requestId,
      }),
      duration,
    };
  }
}
```

### Structured Logging (`lambda/src/logger.ts`)

```typescript
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private level: LogLevel;

  constructor() {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase() as LogLevel;
    this.level = envLevel || 'INFO';
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>) {
    const levels: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    if (levels.indexOf(level) < levels.indexOf(this.level)) {
      return;  // Skip if below current log level
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
    };

    console.log(JSON.stringify(entry));  // CloudWatch receives as JSON
  }

  private sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
    if (!context) return undefined;

    // Remove sensitive data from logs
    const sanitized = { ...context };

    // Never log API keys
    delete sanitized.apiKey;
    delete sanitized.BLOCKSTREAM_API_KEY_TESTNET;
    delete sanitized.BLOCKSTREAM_API_KEY_MAINNET;

    // Mask Bitcoin addresses in production (optional privacy)
    if (process.env.NODE_ENV === 'production' && sanitized.path) {
      sanitized.path = sanitized.path.replace(
        /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/g,
        '***ADDRESS***'
      );
    }

    return sanitized;
  }

  debug(message: string, context?: Record<string, any>) {
    this.log('DEBUG', message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: Record<string, any>) {
    this.log('ERROR', message, context);
  }
}

export const logger = new Logger();
```

---

## Cost Analysis

### AWS Free Tier (First 12 Months)

**Lambda:**
- 1 million requests per month FREE
- 400,000 GB-seconds compute time FREE
- After free tier: $0.20 per 1 million requests
- Compute: $0.0000166667 per GB-second

**API Gateway:**
- 1 million API calls per month FREE (first 12 months)
- After free tier: $3.50 per 1 million requests

**CloudWatch:**
- 10 custom metrics FREE
- 5 GB log ingestion FREE
- After free tier: Minimal cost for this use case

### Cost Estimate (After Free Tier)

**Assumptions:**
- 100k requests/month (moderate usage)
- Average Lambda duration: 500ms
- Lambda memory: 256 MB

**Calculation:**
```
Lambda Invocations:
  100,000 requests × $0.20 / 1M = $0.02

Lambda Compute:
  100,000 × 0.5 seconds × 0.25 GB × $0.0000166667 = $0.21

API Gateway:
  100,000 requests × $3.50 / 1M = $0.35

CloudWatch Logs:
  ~500 MB/month × $0.50/GB = $0.25

Total: ~$0.83/month
```

**Scaled Usage:**

| Monthly Requests | Lambda | API Gateway | CloudWatch | Total |
|------------------|--------|-------------|------------|-------|
| 10k | $0.002 | $0.04 | $0.05 | **$0.09** |
| 100k | $0.21 | $0.35 | $0.25 | **$0.81** |
| 500k | $1.05 | $1.75 | $1.00 | **$3.80** |
| 1M | $2.10 | $3.50 | $2.00 | **$7.60** |
| 5M | $10.50 | $17.50 | $8.00 | **$36.00** |

**Real-World Estimate: $5-10/month** for typical wallet usage (100k-500k requests/month)

### Cost Comparison

| Solution | Setup Cost | Monthly Cost | Notes |
|----------|------------|--------------|-------|
| **Direct Blockstream (Exposed Key)** | $0 | Blockstream credits | ❌ INSECURE |
| **Lambda Proxy** | ~8 hours | $5-10 | ✅ Secure, scalable |
| **Self-Hosted Esplora (Testnet)** | ~4-5 days | $44-50 | Overkill for now |
| **Self-Hosted Esplora (Mainnet)** | ~4-5 days | $150-200 | Future option |

**Winner:** Lambda Proxy is the sweet spot for current scale.

---

## Implementation Phases

### Phase 1: Project Setup (1 hour)

**Tasks:**
1. Create infrastructure directory structure
   ```bash
   mkdir -p infrastructure/lambda-proxy/{bin,lib/{constructs,config},lambda/src,test}
   cd infrastructure/lambda-proxy
   ```

2. Initialize CDK project
   ```bash
   npx cdk init app --language=typescript
   ```

3. Install dependencies
   ```bash
   npm install @aws-cdk/aws-lambda @aws-cdk/aws-apigateway @aws-cdk/aws-cloudwatch
   npm install --save-dev @types/node @types/aws-lambda
   ```

4. Initialize Lambda project
   ```bash
   cd lambda
   npm init -y
   npm install node-fetch
   npm install --save-dev typescript webpack webpack-cli ts-loader
   ```

**Deliverables:**
- ✅ CDK project initialized
- ✅ Lambda project initialized
- ✅ Dependencies installed
- ✅ TypeScript configured

### Phase 2: Lambda Implementation (2 hours)

**Tasks:**
1. Write Lambda handler (`lambda/src/index.ts`)
   - API Gateway event handling
   - Path extraction
   - Error handling
   - CORS headers

2. Write proxy logic (`lambda/src/blockstream-proxy.ts`)
   - Fetch from Blockstream
   - Add API key header
   - Handle timeouts
   - Return responses

3. Write logger (`lambda/src/logger.ts`)
   - Structured JSON logging
   - Log level filtering
   - Sensitive data sanitization

4. Configure webpack to bundle Lambda code
   ```javascript
   // lambda/webpack.config.js
   module.exports = {
     entry: './src/index.ts',
     target: 'node',
     mode: 'production',
     module: {
       rules: [{ test: /\.ts$/, use: 'ts-loader' }],
     },
     resolve: {
       extensions: ['.ts', '.js'],
     },
     output: {
       path: __dirname + '/dist',
       filename: 'index.js',
       libraryTarget: 'commonjs2',
     },
   };
   ```

5. Test Lambda locally
   ```bash
   cd lambda
   npm run build
   node -e "require('./dist/index').handler({ ... })"
   ```

**Deliverables:**
- ✅ Lambda handler implemented
- ✅ Proxy logic tested
- ✅ Logger working
- ✅ Webpack bundling successful

### Phase 3: CDK Infrastructure (2 hours)

**Tasks:**
1. Create Lambda construct (`lib/constructs/lambda-construct.ts`)
   - Function configuration
   - Environment variables
   - IAM role
   - CloudWatch logs

2. Create API Gateway construct (`lib/constructs/api-gateway-construct.ts`)
   - REST API definition
   - CORS configuration
   - Lambda integration
   - Throttling settings

3. Create monitoring construct (`lib/constructs/monitoring-construct.ts`)
   - CloudWatch alarms
   - SNS topic
   - Dashboard

4. Assemble main stack (`lib/proxy-stack.ts`)
   - Instantiate all constructs
   - Wire them together
   - Define outputs

5. Test CDK synthesis
   ```bash
   cdk synth
   ```

**Deliverables:**
- ✅ All constructs implemented
- ✅ Stack synthesizes without errors
- ✅ CloudFormation template generated
- ✅ Stack tested with snapshot tests

### Phase 4: Deployment (1 hour)

**Tasks:**
1. Configure AWS credentials
   ```bash
   aws configure
   ```

2. Bootstrap CDK (first time only)
   ```bash
   cdk bootstrap aws://ACCOUNT-ID/us-east-1
   ```

3. Deploy stack
   ```bash
   cdk deploy BlockstreamProxyStack-dev \
     --parameters BlockstreamApiKeyTestnet=your_testnet_key \
     --parameters BlockstreamApiKeyMainnet=your_mainnet_key
   ```

4. Note API Gateway URL from outputs
   ```
   Outputs:
   BlockstreamProxyStack-dev.ApiEndpoint = https://abc123.execute-api.us-east-1.amazonaws.com/dev/blockstream/
   ```

5. Test deployed API
   ```bash
   curl https://abc123.execute-api.us-east-1.amazonaws.com/dev/blockstream/blocks/tip/height
   ```

**Deliverables:**
- ✅ Stack deployed to AWS
- ✅ API Gateway URL retrieved
- ✅ API responding correctly
- ✅ CloudWatch logs visible

### Phase 5: Wallet Integration (1 hour)

**Tasks:**
1. Update BlockstreamClient.ts
   ```typescript
   // src/background/api/BlockstreamClient.ts
   constructor(network: 'mainnet' | 'testnet' = 'testnet') {
     this.network = network;

     // Use Lambda proxy if configured, otherwise Blockstream direct
     const proxyUrl = process.env.BLOCKSTREAM_PROXY_URL;

     if (proxyUrl) {
       // Production: Use proxy
       this.baseUrl = `${proxyUrl}?network=${network}`;
     } else {
       // Development: Use Blockstream direct (with local API key)
       this.baseUrl = network === 'mainnet'
         ? 'https://blockstream.info/api'
         : 'https://blockstream.info/testnet/api';
     }

     console.log(`[BlockstreamClient] Using ${proxyUrl ? 'proxy' : 'direct'} API: ${this.baseUrl}`);
   }
   ```

2. Update webpack config
   ```javascript
   // webpack.config.js
   new webpack.DefinePlugin({
     'process.env.BLOCKSTREAM_PROXY_URL': JSON.stringify(process.env.BLOCKSTREAM_PROXY_URL),
   }),
   ```

3. Update .env.local.example
   ```bash
   # Production: Lambda proxy URL (API key on backend - secure!)
   BLOCKSTREAM_PROXY_URL=https://your-api-gateway-url.amazonaws.com/dev/blockstream

   # Development: Direct Blockstream API (API key in extension - local only!)
   BLOCKSTREAM_API_KEY_TESTNET=your_testnet_key_here
   ```

4. Rebuild extension
   ```bash
   npm run build
   ```

5. Test in Chrome
   - Load unpacked extension
   - Open Dashboard
   - Check Network tab (should call proxy URL)
   - Verify no errors

**Deliverables:**
- ✅ BlockstreamClient updated
- ✅ Environment variables configured
- ✅ Extension rebuilt
- ✅ End-to-end test passed

### Phase 6: Testing & Validation (1-2 hours)

**Tasks:**
1. Functional testing
   - Test all API endpoints through proxy
   - Verify responses match Blockstream direct
   - Test transaction broadcasting
   - Test error handling

2. Security testing
   - Verify API key not in extension files
   - Check CloudWatch logs (no API key logged)
   - Test CORS (only extension can call)
   - Test rate limiting

3. Performance testing
   - Measure latency (cold start vs warm)
   - Load test with 100 parallel requests
   - Check Lambda concurrency
   - Monitor CloudWatch metrics

4. Cost validation
   - Check AWS Cost Explorer
   - Verify within free tier
   - Estimate monthly cost

**Deliverables:**
- ✅ All functional tests passed
- ✅ Security verified (API key protected)
- ✅ Performance acceptable (<500ms p95)
- ✅ Cost estimate confirmed

### Phase 7: Documentation (1 hour)

**Tasks:**
1. Create deployment runbook
   - Prerequisites
   - Deployment steps
   - Configuration
   - Troubleshooting

2. Update project documentation
   - CLAUDE.md (reference proxy)
   - ARCHITECTURE.md (proxy architecture)
   - README.md (for infrastructure/)

3. Document monitoring
   - CloudWatch dashboard
   - Alarm thresholds
   - SNS alert configuration

4. Document rollback procedure
   - Revert to Blockstream direct
   - Emergency configuration change

**Deliverables:**
- ✅ Deployment runbook complete
- ✅ Project docs updated
- ✅ Monitoring documented
- ✅ Rollback procedure documented

---

## Deployment Instructions

### Prerequisites

1. **AWS Account**
   - Active AWS account
   - Billing enabled
   - Programmatic access (IAM user or SSO)

2. **AWS CLI**
   ```bash
   # Install
   pip install awscli

   # Configure
   aws configure
   AWS Access Key ID: YOUR_KEY
   AWS Secret Access Key: YOUR_SECRET
   Default region: us-east-1
   Default output format: json
   ```

3. **AWS CDK CLI**
   ```bash
   npm install -g aws-cdk
   cdk --version  # Should be 2.x
   ```

4. **Node.js & npm**
   - Node.js 18+ (recommend 20 LTS)
   - npm 9+

5. **Blockstream API Keys**
   - Get keys from https://blockstream.com/api/
   - One for testnet
   - One for mainnet (if needed)

### Step-by-Step Deployment

**1. Navigate to infrastructure project**
```bash
cd bitcoin_wallet/infrastructure/lambda-proxy
```

**2. Install dependencies**
```bash
npm install
cd lambda && npm install && npm run build && cd ..
```

**3. Bootstrap CDK (first time only)**
```bash
cdk bootstrap aws://YOUR-ACCOUNT-ID/us-east-1
```

**4. Review changes**
```bash
cdk diff BlockstreamProxyStack-dev
```

**5. Deploy**
```bash
cdk deploy BlockstreamProxyStack-dev \
  --parameters BlockstreamApiKeyTestnet=your_testnet_key_here \
  --parameters BlockstreamApiKeyMainnet=your_mainnet_key_here \
  --require-approval never
```

**6. Note outputs**
```
✅  BlockstreamProxyStack-dev

Outputs:
BlockstreamProxyStack-dev.ApiEndpoint = https://abc123xyz.execute-api.us-east-1.amazonaws.com/dev/blockstream/
BlockstreamProxyStack-dev.LambdaFunctionName = BlockstreamProxyStack-dev-ProxyLambda12345678-ABCDEF

Stack ARN:
arn:aws:cloudformation:us-east-1:123456789012:stack/BlockstreamProxyStack-dev/...
```

**7. Test API**
```bash
# Test block height
curl https://YOUR_API_URL/blocks/tip/height

# Test address lookup
curl https://YOUR_API_URL/address/tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx
```

**8. Update wallet configuration**
```bash
# In bitcoin_wallet/.env.local
echo 'BLOCKSTREAM_PROXY_URL=https://YOUR_API_URL' >> .env.local
```

**9. Rebuild and test extension**
```bash
cd ../..  # Back to bitcoin_wallet root
npm run build
# Load extension in Chrome and test
```

**10. Monitor in AWS Console**
- CloudWatch Logs: `/aws/lambda/BlockstreamProxyStack-dev-ProxyLambda...`
- CloudWatch Dashboard: `BlockstreamProxy-dev`
- API Gateway: `Blockstream Proxy API (dev)`

### Updating the Stack

**After code changes:**
```bash
cd infrastructure/lambda-proxy/lambda
npm run build  # Rebuild Lambda code
cd ..
cdk deploy BlockstreamProxyStack-dev
```

**After infrastructure changes:**
```bash
cd infrastructure/lambda-proxy
cdk diff   # Review changes
cdk deploy BlockstreamProxyStack-dev
```

### Destroying the Stack

**To remove all resources:**
```bash
cdk destroy BlockstreamProxyStack-dev
```

**⚠️ Warning:** This deletes Lambda, API Gateway, CloudWatch logs, and all configurations.

---

## Monitoring & Operations

### CloudWatch Dashboard

**Access:** AWS Console → CloudWatch → Dashboards → `BlockstreamProxy-dev`

**Metrics Displayed:**
- Lambda invocations (requests/second)
- Lambda errors (count)
- Lambda duration (p50, p95, p99)
- API Gateway requests (count)
- API Gateway 4xx/5xx errors

**How to Use:**
- Check dashboard daily during first week
- Investigate spikes or anomalies
- Compare with expected usage patterns

### CloudWatch Alarms

**Configured Alarms:**

1. **High Error Rate**
   - Trigger: >10 errors in 5 minutes
   - Action: Send SNS alert
   - Response: Check Lambda logs for stack traces

2. **High Duration**
   - Trigger: p95 duration >5 seconds for 2 periods
   - Action: Send SNS alert
   - Response: Check Blockstream API status, investigate slow queries

3. **High Invocation Count**
   - Trigger: >100k requests/hour
   - Action: Send SNS alert
   - Response: Check for abuse or unexpected traffic spike

**SNS Alert Email Format:**
```
Subject: ALARM: HighErrorRate in us-east-1

You are receiving this email because your Amazon CloudWatch Alarm
"HighErrorRate" in the US East (N. Virginia) region has entered the
ALARM state, because "Threshold Crossed: 1 datapoint [12.0 (22/10/24 10:15:00)]
was greater than the threshold (10.0)."

View this alarm in the AWS Management Console:
https://console.aws.amazon.com/cloudwatch/...
```

### Logging

**Log Location:**
- AWS Console → CloudWatch → Log groups → `/aws/lambda/BlockstreamProxyStack-dev-ProxyLambda...`

**Log Format (JSON):**
```json
{
  "timestamp": "2025-10-28T14:32:15.123Z",
  "level": "INFO",
  "message": "Request completed",
  "context": {
    "requestId": "abc-123-def-456",
    "statusCode": 200,
    "duration": 234
  }
}
```

**Useful Queries (CloudWatch Insights):**

**1. Find errors:**
```
fields @timestamp, message, context.error
| filter level = "ERROR"
| sort @timestamp desc
| limit 100
```

**2. Slow requests (>2 seconds):**
```
fields @timestamp, message, context.duration
| filter context.duration > 2000
| sort context.duration desc
| limit 50
```

**3. Requests by network:**
```
fields @timestamp, context.network
| stats count() by context.network
```

**4. Average duration:**
```
fields context.duration
| stats avg(context.duration) as avg_ms, max(context.duration) as max_ms
```

### Cost Monitoring

**AWS Cost Explorer:**
- AWS Console → Cost Management → Cost Explorer
- Filter by Service: Lambda, API Gateway, CloudWatch
- Time Range: Last 7 days

**Budget Alert (Recommended):**
```bash
aws budgets create-budget \
  --account-id YOUR_ACCOUNT_ID \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

**budget.json:**
```json
{
  "BudgetName": "BlockstreamProxyMonthlyBudget",
  "BudgetLimit": {
    "Amount": "20",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}
```

### Troubleshooting

**Problem: Extension can't reach API**

Symptoms:
- Extension shows "Failed to fetch transactions"
- Network tab shows CORS error

Diagnosis:
```bash
# Test API directly
curl -v https://YOUR_API_URL/blocks/tip/height

# Check CORS headers in response
```

Solutions:
- Verify API Gateway CORS configuration
- Check Security Group allows port 443
- Verify API Gateway deployed correctly

**Problem: Lambda returning 502 errors**

Symptoms:
- API calls fail intermittently
- CloudWatch shows "Failed to reach Blockstream API"

Diagnosis:
```bash
# Check Lambda logs
aws logs tail /aws/lambda/BlockstreamProxyStack-dev-ProxyLambda... --follow

# Test Blockstream API directly
curl https://blockstream.info/testnet/api/blocks/tip/height
```

Solutions:
- Check Blockstream API status
- Increase Lambda timeout
- Check Lambda has internet access (NAT Gateway if in VPC)

**Problem: High latency**

Symptoms:
- Extension feels slow
- CloudWatch shows high p95 duration

Diagnosis:
```bash
# Check Lambda cold starts
aws logs filter-pattern "REPORT Duration" --log-group-name /aws/lambda/...

# Measure Blockstream API latency
time curl https://blockstream.info/testnet/api/blocks/tip/height
```

Solutions:
- Increase Lambda memory (faster CPU)
- Enable API Gateway caching
- Consider provisioned concurrency for Lambda

**Problem: Unexpectedly high costs**

Symptoms:
- AWS bill higher than expected
- Budget alert triggered

Diagnosis:
```bash
# Check invocation count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=BlockstreamProxyStack-dev-ProxyLambda... \
  --start-time 2025-10-20T00:00:00Z \
  --end-time 2025-10-28T00:00:00Z \
  --period 86400 \
  --statistics Sum
```

Solutions:
- Check for abuse (unusual traffic)
- Implement API key authentication for extension
- Add stricter rate limiting
- Review CloudWatch logs for anomalies

---

## Security Best Practices

### API Key Management

✅ **DO:**
- Store API keys in Lambda environment variables
- Use separate keys for testnet and mainnet
- Rotate keys every 90 days
- Use AWS Secrets Manager for production (more secure than env vars)
- Never log API keys

❌ **DON'T:**
- Commit API keys to Git
- Include API keys in CloudWatch logs
- Share API keys across environments
- Use same key for dev and production

**Key Rotation Process:**
1. Generate new API key from Blockstream
2. Update Lambda environment variable:
   ```bash
   aws lambda update-function-configuration \
     --function-name BlockstreamProxyStack-dev-ProxyLambda... \
     --environment Variables={BLOCKSTREAM_API_KEY_TESTNET=new_key_here}
   ```
3. Test extension still works
4. Revoke old API key from Blockstream
5. Document rotation in runbook

### Rate Limiting

**Current Protection:**
- API Gateway: 1000 req/sec per IP
- API Gateway burst: 5000 requests
- Lambda concurrency: 100 (prevents runaway costs)

**Additional Options:**

1. **Usage Plans (API Gateway)**
   ```typescript
   const plan = api.addUsagePlan('UsagePlan', {
     throttle: {
       rateLimit: 100,   // 100 req/sec
       burstLimit: 200,
     },
     quota: {
       limit: 100000,    // 100k per month
       period: apigateway.Period.MONTH,
     },
   });
   ```

2. **API Key Authentication**
   - Issue API keys to wallet installations
   - Track usage per key
   - Revoke if abused

3. **IP Allowlisting**
   - If wallet server has static IPs
   - Block all other IPs

### Monitoring for Abuse

**Red Flags:**
- Sudden spike in requests (>10x normal)
- Requests from unexpected geographies
- High error rates (probing for vulnerabilities)
- Unusual request patterns (automated scanning)

**Response Plan:**
1. Check CloudWatch metrics and logs
2. Identify source IP addresses
3. Temporarily block abusive IPs in API Gateway
4. Investigate root cause
5. Add additional rate limiting if needed

---

## Migration Plan

### From Blockstream Direct to Lambda Proxy

**Current State:**
- Extension calls Blockstream API directly
- API key bundled in extension (INSECURE)
- Works but not production-ready

**Target State:**
- Extension calls Lambda proxy
- API key secured in Lambda environment
- Production-ready

**Migration Steps:**

**1. Deploy Lambda proxy (no traffic yet)**
```bash
cd infrastructure/lambda-proxy
cdk deploy BlockstreamProxyStack-dev
# Note API URL from outputs
```

**2. Test proxy manually**
```bash
curl https://YOUR_API_URL/blocks/tip/height
# Verify response matches Blockstream direct
```

**3. Update extension (configuration only)**
```bash
# .env.local
BLOCKSTREAM_PROXY_URL=https://YOUR_API_URL
```

**4. Rebuild and test extension**
```bash
npm run build
# Load in Chrome
# Test all features (send, receive, transactions)
```

**5. Monitor for 24 hours**
- Check CloudWatch logs
- Verify no errors
- Check latency acceptable
- Confirm API key not exposed (inspect extension files)

**6. Publish to Chrome Web Store**
- Package extension
- Upload to Chrome Web Store
- Submit for review
- Users automatically get secure version

**Rollback:** If issues found, revert `.env.local` to remove `BLOCKSTREAM_PROXY_URL` and rebuild.

### From Lambda Proxy to Self-Hosted Esplora (Future)

**When to Migrate:**
- API costs exceed $100/month
- Request volume >1M/month
- Need lower latency (<100ms)
- Privacy requirements increase

**Migration Strategy:**
Lambda proxy remains as abstraction layer, just change the target:

**Current:**
```
Extension → Lambda → Blockstream API
```

**Future:**
```
Extension → Lambda → Self-Hosted Esplora
                  ↓
           (fallback) Blockstream API
```

**Implementation:**
1. Deploy Esplora node (see SELF_HOSTED_ESPLORA_AWS_PLAN.md)
2. Wait for full sync
3. Update Lambda proxy to point to Esplora:
   ```typescript
   const baseUrl = process.env.ESPLORA_SELF_HOSTED_URL || process.env.BLOCKSTREAM_BASE_URL;
   ```
4. **No extension changes needed** - still calls same proxy URL
5. Monitor performance and cost savings

**This is why the Lambda proxy is valuable long-term** - it's an abstraction layer that can evolve.

---

## Summary

### What We Built

**Secure API Proxy Architecture:**
- ✅ AWS Lambda function to proxy Blockstream API
- ✅ API Gateway for HTTPS endpoint
- ✅ CloudWatch monitoring and alerting
- ✅ Infrastructure as Code (AWS CDK)
- ✅ API key secured on backend (never exposed)

### Benefits

**Security:**
- API key completely protected
- No risk of theft or abuse
- Rotatable without extension update

**Cost:**
- ~$5-10/month (well within budget)
- Predictable costs
- Scales automatically

**Performance:**
- Low latency (~200-400ms total)
- Auto-scales to 1000 concurrent requests
- Optional API Gateway caching

**Maintainability:**
- Serverless (no servers to patch)
- Infrastructure as Code (reproducible)
- Comprehensive monitoring

### Next Steps

**Immediate (Before Production):**
1. Implement Lambda proxy (6-8 hours)
2. Deploy to AWS
3. Test thoroughly
4. Update extension configuration
5. Publish secure version to Chrome Web Store

**Short-term (First Month):**
1. Monitor CloudWatch metrics
2. Optimize Lambda performance if needed
3. Tune rate limiting
4. Set up budget alerts

**Long-term (As You Scale):**
1. Track API costs monthly
2. When costs justify (~$100/month), implement self-hosted Esplora
3. Lambda proxy can switch to self-hosted (no extension changes)

### Key Takeaways

✅ **Lambda proxy is the right solution RIGHT NOW**
- Quick to implement
- Cheap to run
- Completely secure
- Production-ready

✅ **Self-hosted Esplora is for LATER**
- When volume justifies cost
- When you need more control
- Lambda proxy makes migration easy

✅ **Never ship client-side API keys**
- Always use backend proxy
- This is non-negotiable for production

---

**Document Version**: 1.0
**Last Updated**: 2025-10-28
**Implementation Status**: 📋 Ready to Implement
**Estimated Effort**: 6-8 hours
**Estimated Cost**: $5-10/month
**Security Level**: ✅ Production-Ready
