#!/bin/bash

# Redeploy Lambda with Blockstream API keys
# Usage: ./redeploy-with-keys.sh

echo "================================="
echo "Redeploying Lambda Proxy with API Keys"
echo "================================="

# Check if API keys are set
if [ -z "$BLOCKSTREAM_API_KEY_TESTNET" ]; then
  echo "⚠️  Warning: BLOCKSTREAM_API_KEY_TESTNET not set"
  echo "   The Lambda will try to use Blockstream public API (rate-limited)"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    echo ""
    echo "To set your API key, run:"
    echo "  export BLOCKSTREAM_API_KEY_TESTNET=\"your_key_here\""
    echo "  ./redeploy-with-keys.sh"
    exit 1
  fi
fi

# Deploy
cd "$(dirname "$0")"
npm run build
cdk deploy --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Your Lambda function now has the following environment variables:"
echo "  - BLOCKSTREAM_API_KEY_TESTNET: ${BLOCKSTREAM_API_KEY_TESTNET:-(not set)}"
echo "  - BLOCKSTREAM_API_KEY_MAINNET: ${BLOCKSTREAM_API_KEY_MAINNET:-(not set)}"
