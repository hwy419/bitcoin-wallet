import * as cdk from 'aws-cdk-lib';
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

    this.snsTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: `Blockstream Proxy Alerts (${props.environment})`,
    });

    if (props.alertEmail) {
      this.snsTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alertEmail)
      );
    }

    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
      alarmName: `${props.environment}-lambda-high-error-rate`,
      metric: props.lambdaFunction.metricErrors({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Lambda function error rate is too high',
    });
    errorAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    const durationAlarm = new cloudwatch.Alarm(this, 'HighDuration', {
      alarmName: `${props.environment}-lambda-high-duration`,
      metric: props.lambdaFunction.metricDuration({
        statistic: 'p95',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5000,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Lambda p95 duration is too high',
    });
    durationAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    const invocationAlarm = new cloudwatch.Alarm(this, 'HighInvocationCount', {
      alarmName: `${props.environment}-lambda-high-invocation-count`,
      metric: props.lambdaFunction.metricInvocations({
        statistic: 'Sum',
        period: cdk.Duration.hours(1),
      }),
      threshold: 100000,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'Unusually high request volume',
    });
    invocationAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

    const api5xxAlarm = new cloudwatch.Alarm(this, 'Api5xxErrors', {
      alarmName: `${props.environment}-api-5xx-errors`,
      metric: props.apiGateway.metricServerError({
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmDescription: 'API Gateway 5xx error rate is too high',
    });
    api5xxAlarm.addAlarmAction(new actions.SnsAction(this.snsTopic));

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
              props.apiGateway.metricClientError(),
              props.apiGateway.metricServerError(),
            ],
            width: 12,
          }),
        ],
      ],
    });
  }
}
