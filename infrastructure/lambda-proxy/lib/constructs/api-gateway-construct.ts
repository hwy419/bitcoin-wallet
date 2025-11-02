import * as cdk from 'aws-cdk-lib';
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
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 5000,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type'],
        maxAge: cdk.Duration.hours(1),
      },
    });

    const integration = new apigateway.LambdaIntegration(props.lambdaFunction, {
      proxy: true,
      allowTestInvoke: false,
    });

    const blockstream = this.api.root.addResource('blockstream');
    blockstream.addProxy({
      defaultIntegration: integration,
      anyMethod: true,
    });

    this.url = this.api.url + 'blockstream';
  }
}
