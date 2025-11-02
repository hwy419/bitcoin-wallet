import fetch from 'node-fetch';
import { logger } from './logger';
import { ProxyRequest, ProxyResult } from './types';

export async function proxyToBlockstream(request: ProxyRequest): Promise<ProxyResult> {
  const startTime = Date.now();

  const apiKey = request.network === 'testnet'
    ? process.env.BLOCKSTREAM_API_KEY_TESTNET
    : process.env.BLOCKSTREAM_API_KEY_MAINNET;

  const baseUrl = request.network === 'testnet'
    ? process.env.BLOCKSTREAM_BASE_URL_TESTNET
    : process.env.BLOCKSTREAM_BASE_URL_MAINNET;

  if (!baseUrl) {
    throw new Error(`Base URL missing for ${request.network}`);
  }

  // Log warning if API key is missing (will use public API with rate limits)
  if (!apiKey) {
    logger.warn('No API key configured, using public Blockstream API (rate-limited)', {
      requestId: request.requestId,
      network: request.network,
    });
  }

  const targetUrl = `${baseUrl}/${request.path}`;

  logger.debug('Proxying to Blockstream', {
    requestId: request.requestId,
    method: request.method,
    url: targetUrl,
    network: request.network,
  });

  try {
    const headers: Record<string, string> = {
      'Content-Type': request.body ? 'application/json' : 'text/plain',
      'User-Agent': 'Bitcoin-Wallet-Chrome-Extension/1.0',
    };

    // Only add API key header if key is available
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body || undefined,
      timeout: 25000,
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
