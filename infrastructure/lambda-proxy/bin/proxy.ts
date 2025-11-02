#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { BlockstreamProxyStack } from '../lib/proxy-stack';

const app = new cdk.App();

const environment = app.node.tryGetContext('environment') || 'dev';
const blockstreamApiKeyTestnet = process.env.BLOCKSTREAM_API_KEY_TESTNET || '';
const blockstreamApiKeyMainnet = process.env.BLOCKSTREAM_API_KEY_MAINNET || '';

if (!blockstreamApiKeyTestnet) {
  console.warn('Warning: BLOCKSTREAM_API_KEY_TESTNET not set');
}

new BlockstreamProxyStack(app, `BlockstreamProxy-${environment}`, {
  environment,
  blockstreamApiKeyTestnet,
  blockstreamApiKeyMainnet,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
