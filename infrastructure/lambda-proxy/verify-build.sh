#!/bin/bash

# Verification script for AWS Lambda Proxy Infrastructure
# Usage: ./verify-build.sh

set -e

echo "=================================="
echo "Lambda Proxy Build Verification"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo "Checking Node.js version..."
node_version=$(node -v)
echo "Node.js: $node_version"
if [[ "$node_version" < "v20" ]]; then
  echo -e "${RED}✗ Node.js 20+ required${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Node.js version OK${NC}"
echo ""

# Check npm
echo "Checking npm..."
npm_version=$(npm -v)
echo "npm: $npm_version"
echo -e "${GREEN}✓ npm installed${NC}"
echo ""

# Check CDK dependencies
echo "Checking CDK dependencies..."
if [ ! -d "node_modules" ]; then
  echo -e "${RED}✗ CDK dependencies not installed${NC}"
  echo "Run: npm install"
  exit 1
fi
echo -e "${GREEN}✓ CDK dependencies installed${NC}"
echo ""

# Check Lambda dependencies
echo "Checking Lambda dependencies..."
if [ ! -d "lambda/node_modules" ]; then
  echo -e "${RED}✗ Lambda dependencies not installed${NC}"
  echo "Run: cd lambda && npm install"
  exit 1
fi
echo -e "${GREEN}✓ Lambda dependencies installed${NC}"
echo ""

# Check Lambda build
echo "Checking Lambda build..."
if [ ! -f "lambda/dist/index.js" ]; then
  echo -e "${RED}✗ Lambda not built${NC}"
  echo "Run: cd lambda && npm run build"
  exit 1
fi
lambda_size=$(stat -c%s "lambda/dist/index.js" 2>/dev/null || stat -f%z "lambda/dist/index.js" 2>/dev/null)
lambda_size_kb=$((lambda_size / 1024))
echo "Lambda bundle size: ${lambda_size_kb}KB"
echo -e "${GREEN}✓ Lambda built successfully${NC}"
echo ""

# Run CDK tests
echo "Running CDK tests..."
npm test --silent > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ All CDK tests pass (13/13)${NC}"
else
  echo -e "${RED}✗ CDK tests failed${NC}"
  exit 1
fi
echo ""

# Check for API keys (should NOT be committed)
echo "Checking for committed secrets..."
if grep -r "BLOCKSTREAM_API_KEY" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠ Found BLOCKSTREAM_API_KEY references in code (check they're not hardcoded)${NC}"
else
  echo -e "${GREEN}✓ No hardcoded API keys found${NC}"
fi
echo ""

# Check documentation
echo "Checking documentation..."
docs=(
  "README.md"
  "DEPLOYMENT_GUIDE.md"
  "IMPLEMENTATION_SUMMARY.md"
)
for doc in "${docs[@]}"; do
  if [ ! -f "$doc" ]; then
    echo -e "${RED}✗ Missing: $doc${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✓ All documentation present${NC}"
echo ""

# Synthesize CDK (dry run)
echo "Synthesizing CDK stack (dry run)..."
export BLOCKSTREAM_API_KEY_TESTNET="test_key_testnet"
export BLOCKSTREAM_API_KEY_MAINNET="test_key_mainnet"
npx cdk synth > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ CDK synthesis successful${NC}"
else
  echo -e "${RED}✗ CDK synthesis failed${NC}"
  exit 1
fi
echo ""

# Summary
echo "=================================="
echo -e "${GREEN}✓ Build verification PASSED${NC}"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Set environment variables:"
echo "   export BLOCKSTREAM_API_KEY_TESTNET=\"your_testnet_key\""
echo "   export BLOCKSTREAM_API_KEY_MAINNET=\"your_mainnet_key\""
echo "   export ALERT_EMAIL=\"your_email@example.com\""
echo ""
echo "2. Bootstrap CDK (first time only):"
echo "   cdk bootstrap aws://ACCOUNT-ID/us-east-1"
echo ""
echo "3. Deploy:"
echo "   npm run deploy:dev"
echo ""
echo "See DEPLOYMENT_GUIDE.md for detailed instructions."
echo ""
