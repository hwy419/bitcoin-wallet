# Development Tips

This guide provides developer experience enhancements and productivity tips for working on the Bitcoin Wallet Chrome Extension.

## Password and Mnemonic Pre-fill for Development

To speed up development, you can configure test values that auto-fill when unlocking or importing the wallet. This eliminates the need to manually type your password and mnemonic on every reload.

### Setup

1. Copy the example configuration:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and set your test values:
   ```bash
   DEV_PASSWORD=YourTestPassword123
   DEV_MNEMONIC=abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about
   ```

3. Rebuild in development mode:
   ```bash
   npm run dev
   ```

### What Gets Pre-filled

- **UnlockScreen**: Password field automatically filled
- **WalletSetup (Import tab)**: Mnemonic, password, and confirm password fields automatically filled
- **WalletSetup (Create tab)**: Password and confirm password fields automatically filled

### Important Security Notes

- `.env.local` is gitignored and will **NEVER** be committed
- Pre-fill **only works in development builds** (`npm run dev`)
- Production builds (`npm run build`) always have empty fields
- Use simple test values, not your real wallet credentials
- For `DEV_MNEMONIC`, use any valid BIP39 phrase (12, 15, 18, 21, or 24 words)

### How It Works

- Webpack reads `.env.local` during development builds
- Injects `process.env.DEV_PASSWORD` and `process.env.DEV_MNEMONIC` only in dev mode
- Components use these values to pre-fill form fields
- Saves you ~30 seconds per test cycle when repeatedly testing import/unlock flows

## Testing on Testnet

### Getting Testnet Bitcoin

1. Use a testnet faucet: https://testnet-faucet.mempool.co/
2. Request small amounts for testing (usually 0.001-0.01 BTC)
3. Wait for confirmation (usually 10-30 minutes)

### Verifying Transactions

1. Use Blockstream testnet explorer: https://blockstream.info/testnet/
2. Search for your address or transaction ID
3. Verify transaction details, confirmations, and UTXO state
4. Check mempool for pending transactions

### Common Testnet Issues

**Problem**: Faucet not working or empty
**Solution**: Try alternative faucets:
- https://coinfaucet.eu/en/btc-testnet/
- https://testnet.help/en/btcfaucet/testnet

**Problem**: Transactions not confirming
**Solution**: Check mempool congestion at https://mempool.space/testnet
- Increase fee rate if stuck
- Wait for next block (average 10 minutes)

**Problem**: Balance not updating
**Solution**:
- Wait for at least 1 confirmation
- Refresh the wallet
- Check Blockstream explorer to verify transaction was broadcast

## Debugging Tips

### Chrome Extension Debugging

1. **View Background Service Worker Logs**:
   - Go to `chrome://extensions/`
   - Find "Bitcoin Wallet" extension
   - Click "service worker" link
   - Opens DevTools for background script

2. **View Popup Logs**:
   - Right-click extension icon
   - Select "Inspect popup"
   - Opens DevTools for popup UI

3. **Check Storage**:
   - In DevTools, go to Application tab
   - Expand "Storage" → "Local Storage"
   - View encrypted wallet data and settings

### Common Issues

**Problem**: Service worker keeps restarting
**Solution**: This is normal Manifest V3 behavior. Ensure you're not relying on persistent state.

**Problem**: Message passing not working
**Solution**:
- Check you're returning `true` from message listeners
- Verify message types match exactly
- Check for typos in message type strings

**Problem**: Storage quota exceeded
**Solution**:
- Check data size before storing
- Clear old transaction history
- Use chrome.storage.local.QUOTA_BYTES to check limits

### Performance Profiling

1. **Profile React Components**:
   ```bash
   # Install React DevTools extension
   # Open popup DevTools
   # Go to "Profiler" tab
   # Record and analyze renders
   ```

2. **Profile Service Worker**:
   ```javascript
   // Add performance marks in code
   performance.mark('start-operation');
   // ... your code ...
   performance.mark('end-operation');
   performance.measure('operation-time', 'start-operation', 'end-operation');
   console.log(performance.getEntriesByName('operation-time'));
   ```

## Development Workflow

### Recommended Workflow

1. **Start development build**:
   ```bash
   npm run dev
   ```

2. **Load extension in Chrome**:
   - Go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Make code changes**:
   - Webpack watches for changes
   - Automatic rebuild on save

4. **Reload extension**:
   - Click reload icon in `chrome://extensions/`
   - Or use keyboard shortcut: `Ctrl+R` (Windows/Linux) or `Cmd+R` (Mac)

5. **Test changes**:
   - Click extension icon to open popup
   - Check DevTools for errors

### Hot Reload Limitations

**What auto-reloads**:
- UI components (React)
- Styling (Tailwind)
- TypeScript compilation

**What requires manual reload**:
- manifest.json changes
- Background service worker changes
- Content script changes
- Icon/asset changes

**After changing these files**: Go to `chrome://extensions/` and click the reload icon.

## Creating Tester Distribution Package

When you need to distribute the extension to manual testers or QA engineers:

### Quick Package Creation

```bash
# 1. Build extension first
npm run build

# 2. Create tester package
python3 create-tester-package.py

# Output: bitcoin-wallet-v0.12.0-testing-package-[DATE].zip (2.1 MB)
```

### What Gets Packaged

The script automatically bundles:
- ✅ **Extension** (`dist/` → `extension/`) - Ready to install
- ✅ **Testing Guide** (`testing-guide.html`) - Interactive HTML with 26+ guides
- ✅ **Launchers** (`open-guide.sh`, `open-guide.bat`) - One-click guide access
- ✅ **Documentation** (`TESTER_README.md`, `QUICK_START.md`, etc.)

### Distribution

```bash
# Email the zip (2.1 MB - email-friendly)
# OR upload to file sharing (Google Drive, Dropbox, etc.)
# OR attach to GitHub release

# Testers receive:
# 1. Extract zip
# 2. Read TESTER_README.md
# 3. Install extension from extension/ folder
# 4. Open testing-guide.html in browser
# 5. Start testing with interactive guide
```

### Regenerating After Updates

```bash
# If code changed
npm run build

# If testing guide markdown changed
cd TESTING_GUIDES
python3 build-html-guide.py
cd ..

# Create new package
python3 create-tester-package.py
```

### Testing Guide Features

The HTML guide includes:
- Left-side navigation with search
- Interactive checkboxes (auto-saved progress)
- GitHub-style markdown rendering
- 127+ test cases across 15 feature areas
- 5-day, 16-hour systematic testing plan
- Works completely offline

See `TESTER_PACKAGE_INFO.md` for complete package documentation.

## Code Quality Tools

### Type Checking

Run TypeScript type checker:
```bash
npm run type-check
```

Fix common type errors:
- Add proper type annotations
- Fix `any` types
- Resolve missing property errors

### Linting (Future)

When ESLint is configured:
```bash
npm run lint
npm run lint:fix
```

### Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Useful Chrome URLs

- `chrome://extensions/` - Manage extensions
- `chrome://inspect/#service-workers` - Inspect service workers
- `chrome://inspect/#extensions` - Inspect extension pages
- `chrome://system/` - System information
- `chrome://quota-internals/` - Storage quota details

## VS Code Extensions

Recommended extensions for development:

1. **ESLint** - JavaScript/TypeScript linting
2. **Prettier** - Code formatting
3. **Tailwind CSS IntelliSense** - Tailwind autocomplete
4. **TypeScript Error Translator** - Better TypeScript errors
5. **Chrome Extension Developer Tools** - Extension debugging helpers

## Git Workflow

### Branch Naming

```
feature/short-description
fix/bug-description
refactor/what-changed
docs/what-updated
```

### Commit Messages

Follow conventional commits:
```
feat: add transaction history filtering
fix: resolve service worker crash on lock
refactor: extract UTXO selection to separate module
docs: update architecture diagram
test: add integration tests for send flow
```

### Before Committing

1. Run type check: `npm run type-check`
2. Run tests: `npm test`
3. Test manually in extension
4. Update relevant documentation

## Troubleshooting

### Build Issues

**Problem**: Build fails with module not found
**Solution**:
```bash
rm -rf node_modules
npm install
npm run build
```

**Problem**: TypeScript compilation errors
**Solution**:
```bash
npm run type-check
# Fix errors shown
npm run build
```

**Problem**: Webpack errors
**Solution**: Check `webpack.config.js` for syntax errors

### Extension Loading Issues

**Problem**: Extension won't load
**Solution**:
- Check `dist/manifest.json` exists
- Verify all files in manifest are present
- Check console for CSP errors

**Problem**: Service worker errors
**Solution**:
- Check `dist/background.js` exists
- Look for runtime errors in service worker console
- Verify message handlers are registered

### Runtime Issues

**Problem**: Storage not persisting
**Solution**:
- Check if you're using chrome.storage.local (not localStorage)
- Verify data is being stringified correctly
- Check storage quota isn't exceeded

**Problem**: API calls failing
**Solution**:
- Check network tab in DevTools
- Verify API endpoint URLs
- Check for CORS issues (shouldn't occur with Blockstream API)

## Performance Tips

1. **Optimize Bundle Size**:
   - Use dynamic imports for large libraries
   - Tree-shake unused code
   - Minimize dependencies

2. **Optimize React Rendering**:
   - Use `React.memo()` for expensive components
   - Implement `useMemo()` for expensive calculations
   - Use `useCallback()` for event handlers

3. **Optimize Storage**:
   - Only store essential data
   - Compress data if needed
   - Clean up old data periodically

4. **Optimize API Calls**:
   - Cache responses when appropriate
   - Batch requests when possible
   - Implement request debouncing

## Additional Resources

- **Chrome Extension Docs**: https://developer.chrome.com/docs/extensions/
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/migrating/
- **React DevTools**: https://react.dev/learn/react-developer-tools
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **bitcoinjs-lib Docs**: https://github.com/bitcoinjs/bitcoinjs-lib
