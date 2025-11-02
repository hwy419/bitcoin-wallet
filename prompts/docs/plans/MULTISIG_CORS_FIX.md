# Multisig UI & CORS Fixes

## Summary

Fixed two issues reported during multisig wallet testing:
1. **UI Issue**: Missing margin below the purple "Multisig Transaction Process" info banner
2. **CORS Issue**: AWS Lambda proxy blocking requests from Chrome extension

---

## Fix 1: UI Spacing (COMPLETE ✅)

### Problem
The purple info banner in the Send screen had no margin-bottom when displayed in modal mode, causing it to touch the form fields below.

### Solution
Updated `src/tab/components/SendScreen.tsx` (line 640):

**Before:**
```tsx
<div className={isModal ? "flex gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg" : "mb-6 flex gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"}>
```

**After:**
```tsx
<div className={isModal ? "mb-6 flex gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg" : "mb-6 flex gap-3 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg"}>
```

**Result:** Added `mb-6` (margin-bottom: 1.5rem) to both modal and non-modal modes for consistent spacing.

---

## Fix 2: CORS Error (REQUIRES LAMBDA REDEPLOY ⚠️)

### Problem
Requests from the Chrome extension to the AWS Lambda proxy were being blocked with CORS errors:

```
Access to fetch at 'https://o785rls4nd.execute-api.us-east-1.amazonaws.com/dev/blockstream/...'
from origin 'chrome-extension://cngehecjinjgnjjanppimfekdmgghobj'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Causes

**Issue 1: Missing Chrome Extension Permission**
The extension manifest didn't include the Lambda proxy URL in `host_permissions`.

**Issue 2: Lambda CORS Headers**
The Lambda handler wasn't explicitly handling OPTIONS preflight requests and wasn't reflecting the origin header for Chrome extension requests.

### Solutions

#### A. Extension Manifest (COMPLETE ✅)
Updated `manifest.json` to add Lambda proxy URL to host_permissions:

```json
{
  "host_permissions": [
    "https://blockstream.info/*",
    "https://*.execute-api.us-east-1.amazonaws.com/*"  // ← ADDED
  ]
}
```

**Build Status:** ✅ Extension rebuilt with updated manifest

#### B. Lambda Handler (REQUIRES DEPLOYMENT ⚠️)
Updated `infrastructure/lambda-proxy/lambda/src/index.ts`:

**1. Added OPTIONS Request Handler:**
```typescript
// Handle OPTIONS requests for CORS preflight
if (event.httpMethod === 'OPTIONS') {
  return {
    statusCode: 200,
    headers: corsHeaders(event),
    body: '',
  };
}
```

**2. Enhanced CORS Headers Function:**
```typescript
function corsHeaders(event?: APIGatewayProxyEvent) {
  // Get origin from request headers to support Chrome extensions
  const origin = event?.headers?.origin || event?.headers?.Origin || '*';

  return {
    'Access-Control-Allow-Origin': origin,  // ← Reflects actual origin
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
    'Access-Control-Allow-Credentials': 'false',
  };
}
```

**Changes Made:**
- Now reflects the actual origin from the request (supports `chrome-extension://` origins)
- Explicitly handles OPTIONS requests
- Added `X-Requested-With` to allowed headers
- Uses origin header from event instead of hardcoded `*`

---

## Deployment Instructions

### 1. Extension (Already Done ✅)
The extension has been rebuilt with the updated manifest:
```bash
npm run build
# Load dist/ folder in chrome://extensions/
```

### 2. Lambda Proxy (REQUIRED ⚠️)

You need to redeploy the Lambda function with the updated CORS handling code.

#### Option A: Quick Redeploy (Recommended)

If you have the `redeploy-with-keys.sh` script:

```bash
cd infrastructure/lambda-proxy

# Make sure you have your API keys in environment
export BLOCKSTREAM_API_KEY_TESTNET="your-testnet-key"
export BLOCKSTREAM_API_KEY_MAINNET="your-mainnet-key"

# Run redeploy script
./redeploy-with-keys.sh
```

#### Option B: Full CDK Deploy

```bash
cd infrastructure/lambda-proxy

# Install dependencies if needed
npm install

# Deploy the stack
cdk deploy \
  --context blockstreamApiKeyTestnet="your-testnet-key" \
  --context blockstreamApiKeyMainnet="your-mainnet-key"
```

#### Option C: Lambda Console (Manual)

1. Go to AWS Lambda Console
2. Find your function: `BlockstreamProxyStack-LambdaFunction-*`
3. Update the code:
   - Replace `index.ts` with the updated version
   - Ensure TypeScript is compiled to JavaScript
4. Click "Deploy"

**Note:** API keys must be set as environment variables in the Lambda function configuration.

---

## Verification Steps

After deploying both changes:

### 1. Verify Extension Permissions
1. Open Chrome and go to `chrome://extensions/`
2. Find "Bitcoin Wallet"
3. Click "Details"
4. Under "Permissions", verify you see:
   ```
   Read and change data on blockstream.info
   Read and change data on *.execute-api.us-east-1.amazonaws.com
   ```

### 2. Verify CORS Fix
1. Open the extension
2. Switch to a multisig account
3. Open Chrome DevTools Console (F12)
4. Refresh the account
5. **No CORS errors should appear**

You should see successful requests like:
```
[BlockstreamClient] GET https://o785rls4nd.execute-api.us-east-1.amazonaws.com/dev/blockstream/address/tb1q...?network=testnet
Status: 200 OK
```

### 3. Verify UI Fix
1. Open the extension
2. Switch to a multisig account
3. Click "Send"
4. Verify there's proper spacing below the purple info banner
5. The "To Address" field should have clear separation from the banner

---

## Testing Checklist

- [ ] Extension rebuilt with updated manifest
- [ ] Extension loaded in Chrome
- [ ] Lambda function redeployed with CORS fixes
- [ ] Multisig account loads without CORS errors
- [ ] Balance displays correctly
- [ ] Transaction history loads
- [ ] Send screen shows proper spacing
- [ ] Can create PSBT transaction
- [ ] All API requests succeed (no CORS errors in console)

---

## Technical Details

### Why Chrome Extensions Need Special CORS Handling

Chrome extensions have unique origins in the format `chrome-extension://<extension-id>`. Standard CORS policies that use `Access-Control-Allow-Origin: *` don't always work correctly for these origins.

**Best Practice:**
- Reflect the actual origin from the request header
- Explicitly handle OPTIONS (preflight) requests
- Add the Lambda proxy URL to extension manifest `host_permissions`

### Lambda Proxy CORS Flow

```
1. Chrome Extension makes request
   Origin: chrome-extension://cngehecjinjgnjjanppimfekdmgghobj

2. Browser sends OPTIONS preflight (if needed)
   Request: OPTIONS /blockstream/address/...

3. Lambda handler responds to OPTIONS
   Access-Control-Allow-Origin: chrome-extension://cngehecjinjgnjjanppimfekdmgghobj
   Access-Control-Allow-Methods: GET, POST, OPTIONS

4. Browser allows actual request
   Request: GET /blockstream/address/...

5. Lambda proxies to Blockstream and returns response with CORS headers
   Access-Control-Allow-Origin: chrome-extension://cngehecjinjgnjjanppimfekdmgghobj
```

---

## Files Modified

### Extension (Deployed ✅)
1. `src/tab/components/SendScreen.tsx` - Added margin-bottom to info banner
2. `manifest.json` - Added Lambda proxy URL to host_permissions

### Lambda Proxy (Needs Deployment ⚠️)
1. `infrastructure/lambda-proxy/lambda/src/index.ts` - Enhanced CORS handling

---

## Status

✅ **Extension Fixes:** Complete and built
⚠️ **Lambda Fixes:** Code updated, deployment required

**Next Step:** Deploy the Lambda function using one of the methods above to complete the CORS fix.
