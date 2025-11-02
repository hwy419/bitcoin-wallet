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

  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders(event),
      body: '',
    };
  }

  try {
    const proxyPath = event.pathParameters?.proxy || '';

    const network = event.queryStringParameters?.network || 'testnet';
    if (network !== 'testnet' && network !== 'mainnet') {
      return {
        statusCode: 400,
        headers: corsHeaders(event),
        body: JSON.stringify({ error: 'Invalid network. Must be "testnet" or "mainnet"' }),
      };
    }

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
        ...corsHeaders(event),
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
      headers: corsHeaders(event),
      body: JSON.stringify({
        error: 'Internal server error',
        requestId,
      }),
    };
  }
};

function corsHeaders(event?: APIGatewayProxyEvent) {
  // Get origin from request headers to support Chrome extensions
  const origin = event?.headers?.origin || event?.headers?.Origin || '*';

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Allow-Credentials': 'false',
  };
}
