import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaConstruct } from './constructs/lambda-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';

export interface ProxyStackProps extends cdk.StackProps {
  environment: string;
  blockstreamApiKeyTestnet: string;
  blockstreamApiKeyMainnet: string;
  domainName?: string;
  alertEmail?: string;
}

export class BlockstreamProxyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ProxyStackProps) {
    super(scope, id, props);

    const lambda = new LambdaConstruct(this, 'ProxyLambda', {
      environment: props.environment,
      apiKeyTestnet: props.blockstreamApiKeyTestnet,
      apiKeyMainnet: props.blockstreamApiKeyMainnet,
    });

    const apiGateway = new ApiGatewayConstruct(this, 'ProxyApi', {
      lambdaFunction: lambda.function,
      domainName: props.domainName,
      environment: props.environment,
    });

    const monitoring = new MonitoringConstruct(this, 'ProxyMonitoring', {
      lambdaFunction: lambda.function,
      apiGateway: apiGateway.api,
      environment: props.environment,
      alertEmail: props.alertEmail,
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.url,
      description: 'Proxy API endpoint for wallet configuration',
      exportName: `${props.environment}-blockstream-proxy-url`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambda.function.functionName,
      description: 'Lambda function name for debugging',
      exportName: `${props.environment}-lambda-function-name`,
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: monitoring.snsTopic.topicArn,
      description: 'SNS topic ARN for alerts',
      exportName: `${props.environment}-sns-topic-arn`,
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: `BlockstreamProxy-${props.environment}`,
      description: 'CloudWatch dashboard name',
    });
  }
}
