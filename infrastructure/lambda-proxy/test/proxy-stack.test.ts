import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { BlockstreamProxyStack } from '../lib/proxy-stack';

describe('BlockstreamProxyStack', () => {
  let app: cdk.App;
  let stack: BlockstreamProxyStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new BlockstreamProxyStack(app, 'TestStack', {
      environment: 'dev',
      blockstreamApiKeyTestnet: 'test-key-testnet',
      blockstreamApiKeyMainnet: 'test-key-mainnet',
      alertEmail: 'test@example.com',
    });
    template = Template.fromStack(stack);
  });

  test('Lambda Function Created with Correct Configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      MemorySize: 256,
      Timeout: 30,
      ReservedConcurrentExecutions: 100,
      Environment: {
        Variables: {
          BLOCKSTREAM_API_KEY_TESTNET: 'test-key-testnet',
          BLOCKSTREAM_API_KEY_MAINNET: 'test-key-mainnet',
          BLOCKSTREAM_BASE_URL_TESTNET: 'https://blockstream.info/testnet/api',
          BLOCKSTREAM_BASE_URL_MAINNET: 'https://blockstream.info/api',
          LOG_LEVEL: 'DEBUG',
          NODE_ENV: 'dev',
        },
      },
    });
  });

  test('API Gateway Created with Correct Configuration', () => {
    template.hasResourceProperties('AWS::ApiGateway::RestApi', {
      Name: 'Blockstream Proxy API (dev)',
      Description: 'Secure proxy for Blockstream API with API key protection',
    });
  });

  test('API Gateway Deployment Stage Created', () => {
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      StageName: 'dev',
    });
  });

  test('Lambda Has CloudWatch Log Group', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  test('SNS Topic Created for Alerts', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'Blockstream Proxy Alerts (dev)',
    });
  });

  test('SNS Email Subscription Created', () => {
    template.hasResourceProperties('AWS::SNS::Subscription', {
      Protocol: 'email',
      Endpoint: 'test@example.com',
    });
  });

  test('CloudWatch Alarms Created', () => {
    // High error rate alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'dev-lambda-high-error-rate',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 10,
      EvaluationPeriods: 1,
      Statistic: 'Sum',
    });

    // High duration alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'dev-lambda-high-duration',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 5000,
      EvaluationPeriods: 2,
      ExtendedStatistic: 'p95',
    });

    // High invocation count alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'dev-lambda-high-invocation-count',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 100000,
      EvaluationPeriods: 1,
    });

    // API Gateway 5xx errors alarm
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      AlarmName: 'dev-api-5xx-errors',
      ComparisonOperator: 'GreaterThanThreshold',
      Threshold: 5,
    });
  });

  test('CloudWatch Dashboard Created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'BlockstreamProxy-dev',
    });
  });

  test('Lambda Permission for API Gateway', () => {
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 'apigateway.amazonaws.com',
    });
  });

  test('API Gateway Usage Plan Created', () => {
    template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
      UsagePlanName: 'dev-usage-plan',
      Throttle: {
        RateLimit: 1000,
        BurstLimit: 5000,
      },
      Quota: {
        Limit: 1000000,
        Period: 'MONTH',
      },
    });
  });

  test('Stack Outputs Created', () => {
    template.hasOutput('ApiEndpoint', {
      Description: 'Proxy API endpoint for wallet configuration',
      Export: {
        Name: 'dev-blockstream-proxy-url',
      },
    });

    template.hasOutput('LambdaFunctionName', {
      Description: 'Lambda function name',
      Export: {
        Name: 'dev-lambda-function-name',
      },
    });

    template.hasOutput('SnsTopicArn', {
      Description: 'SNS topic ARN for alerts',
      Export: {
        Name: 'dev-sns-topic-arn',
      },
    });

    template.hasOutput('DashboardName', {
      Description: 'CloudWatch dashboard name',
    });
  });

  test('Resources Have Correct Tags', () => {
    // Check Lambda function tags
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');
    const lambdaFunctionKey = Object.keys(lambdaFunctions)[0];
    expect(lambdaFunctions[lambdaFunctionKey].Properties.Tags).toContainEqual({
      Key: 'Environment',
      Value: 'dev',
    });
    expect(lambdaFunctions[lambdaFunctionKey].Properties.Tags).toContainEqual({
      Key: 'Application',
      Value: 'Bitcoin-Wallet',
    });
  });

  test('Minimum Required Resources Created', () => {
    // Should have at least:
    // 1 Lambda function (note: CDK may create additional SingletonFunction for log retention)
    const lambdaFunctions = template.findResources('AWS::Lambda::Function');
    expect(Object.keys(lambdaFunctions).length).toBeGreaterThanOrEqual(1);

    // 1 API Gateway
    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);

    // 1 SNS Topic
    template.resourceCountIs('AWS::SNS::Topic', 1);

    // 4 CloudWatch Alarms (error rate, duration, invocation count, api 5xx)
    template.resourceCountIs('AWS::CloudWatch::Alarm', 4);

    // 1 CloudWatch Dashboard
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);

    // 1 Usage Plan
    template.resourceCountIs('AWS::ApiGateway::UsagePlan', 1);

    // 1 Log Group
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
  });
});
