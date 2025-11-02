import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

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
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambda/dist')),
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
