export interface ProxyRequest {
  method: string;
  path: string;
  body: string | null;
  network: 'testnet' | 'mainnet';
  requestId: string;
}

export interface ProxyResult {
  statusCode: number;
  body: string;
  duration: number;
}
