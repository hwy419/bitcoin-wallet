# Extension Installation Guide

**For Human Testers**
**Version:** 1.0
**Last Updated:** 2025-10-29
**Time Required:** 5-10 minutes

---

## Overview

This guide walks you through installing the Bitcoin Wallet Chrome Extension from the zipped dist folder. You'll load it as an "unpacked extension" which allows testing without publishing to the Chrome Web Store.

**What you'll need:**
- Windows, Mac, or Linux computer
- Google Chrome browser (version 88 or newer)
- The `bitcoin-wallet-extension.zip` file (provided by development team)
- Basic computer skills (extract files, navigate folders)

---

## Step 1: Extract the ZIP File

### Windows:
1. Locate the `bitcoin-wallet-extension.zip` file (usually in your Downloads folder)
2. Right-click on the zip file
3. Select "Extract All..."
4. Choose a location (e.g., `C:\BitcoinWallet\` or `Desktop\BitcoinWallet\`)
5. Click "Extract"
6. You should now see a folder containing `manifest.json` and other files

### Mac:
1. Locate the `bitcoin-wallet-extension.zip` file (usually in Downloads)
2. Double-click the zip file to extract
3. A folder will be created in the same location
4. Optional: Move the extracted folder to a permanent location (e.g., `~/Documents/BitcoinWallet/`)

### Linux:
1. Locate the zip file in your Downloads folder
2. Right-click → "Extract Here" or use command:
   ```bash
   unzip bitcoin-wallet-extension.zip -d ~/BitcoinWallet/
   ```

**⚠️ IMPORTANT:**
- **Do NOT delete this folder** after installation - Chrome needs these files to run the extension
- Keep the folder in a permanent location (not Desktop or Downloads if you clean these regularly)
- If you delete the folder, the extension will stop working

---

## Step 2: Open Chrome Extensions Page

1. Open Google Chrome browser
2. In the address bar, type: `chrome://extensions/` and press Enter
3. OR: Click the three-dot menu (⋮) → More Tools → Extensions

**You should see the Chrome Extensions management page.**

---

## Step 3: Enable Developer Mode

1. On the Extensions page, look for the **"Developer mode"** toggle in the top-right corner
2. Click the toggle to turn it **ON** (it should turn blue/green)
3. After enabling, you'll see new buttons appear: "Load unpacked", "Pack extension", "Update"

**Why Developer Mode?**
- Developer mode allows you to load extensions that aren't from the Chrome Web Store
- This is necessary for testing pre-release versions
- It's safe - you're only installing the extension you received from the development team

**Screenshot Point:** Developer mode toggle in ON position (blue/green)

---

## Step 4: Load the Unpacked Extension

1. Click the **"Load unpacked"** button (top-left area)
2. A file browser window will open
3. Navigate to the folder where you extracted the zip file
4. Select the **folder itself** (the one containing `manifest.json`)
   - **Correct:** Select the folder `bitcoin-wallet-extension/` or `dist/`
   - **Wrong:** Don't select individual files inside
5. Click **"Select Folder"** (Windows/Linux) or **"Open"** (Mac)

**What happens next:**
- Chrome will load the extension
- The Bitcoin Wallet extension card will appear in your extensions list
- You should see:
  - Extension name: "Bitcoin Wallet"
  - Version: v0.10.0
  - Status: "On" (blue toggle)
  - Bitcoin icon

**Screenshot Point:** Extension successfully loaded and showing in extensions list

---

## Step 5: Verify Installation

### Check Extension is Loaded:
1. Look for the Bitcoin (₿) icon in your Chrome toolbar (top-right)
2. If you don't see it:
   - Click the puzzle piece icon (Extensions menu)
   - Find "Bitcoin Wallet"
   - Click the pin icon to pin it to the toolbar

### Test Extension Opens:
1. Click the Bitcoin Wallet icon in the toolbar
2. A new tab should open (not a popup)
3. You should see the wallet setup screen
4. Title should be "Bitcoin Wallet"

**Expected:**
- ✅ New tab opens (not a small popup window)
- ✅ URL: `chrome-extension://[random-id]/index.html`
- ✅ Wallet setup screen displayed
- ✅ No error messages

**If you see errors:**
- Take a screenshot
- Note the exact error message
- Contact the development team
- See "Troubleshooting" section below

---

## Step 6: Pin Extension to Toolbar (Optional but Recommended)

1. Click the puzzle piece icon (Extensions) in Chrome toolbar
2. Find "Bitcoin Wallet" in the list
3. Click the pin icon next to it
4. The Bitcoin (₿) icon will now stay visible in your toolbar

**Why pin it?**
- Quick access during testing
- Don't have to search for it in the extensions menu
- Makes testing faster

---

## Verification Checklist

Before starting testing, verify:

- [ ] Extension appears in `chrome://extensions/` with version v0.10.0
- [ ] Extension toggle is **ON** (blue)
- [ ] Bitcoin icon visible in toolbar
- [ ] Clicking icon opens wallet in new **TAB** (not popup)
- [ ] No error messages in the extension card
- [ ] No console errors (press F12 to check)

**If all checked:** ✅ Installation successful! Proceed to [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)

---

## Troubleshooting

### Problem: "Load unpacked" button is grayed out

**Solution:**
- Developer mode is not enabled
- Go back to Step 3 and toggle Developer mode ON

---

### Problem: "Failed to load extension" error

**Possible Causes:**
1. Selected the wrong folder
2. The zip file was corrupted during download
3. Files are missing from the extracted folder

**Solutions:**
1. Make sure you selected the folder containing `manifest.json` (not a parent folder)
2. Re-download the zip file and extract again
3. Verify these files exist in the folder:
   - `manifest.json`
   - `index.html`
   - `background.js` (or similar)
   - `icons/` folder

**Still not working?**
- Take a screenshot of the error
- Contact development team with:
  - Exact error message
  - Your operating system (Windows/Mac/Linux)
  - Chrome version (found at `chrome://version/`)

---

### Problem: Extension loads but shows errors

**Error: "This extension may have been corrupted"**

**Solutions:**
1. Remove the extension:
   - Go to `chrome://extensions/`
   - Click "Remove" on Bitcoin Wallet
2. Re-extract the zip file to a new folder
3. Try loading again

**Error: Console shows red errors when opening extension**

**What to do:**
1. Press F12 to open Chrome DevTools
2. Go to Console tab
3. Take a screenshot of the errors
4. Send to development team with:
   - Screenshot of console errors
   - Steps you took before the error appeared

---

### Problem: Extension icon not appearing

**Solution:**
1. Go to `chrome://extensions/`
2. Verify extension is enabled (toggle is ON)
3. Check "Details" for any errors
4. Try reloading the extension:
   - Click the reload icon (circular arrow) on the extension card
   - OR: Click "Remove" then re-load the extension

---

### Problem: "Manifest version 2 is deprecated" warning

**Don't worry:** This is just a warning, not an error
- Chrome is transitioning from Manifest V2 to V3
- This extension uses Manifest V3 (latest standard)
- The warning may appear for other extensions you have installed
- Bitcoin Wallet should not show this warning

---

### Problem: Extension works on my computer but not on another computer

**Possible Causes:**
1. Different Chrome version
2. Operating system compatibility
3. Missing files in the zip

**Solutions:**
1. Both computers need Chrome version 88 or newer
   - Check at `chrome://version/`
2. Ensure the zip file was transferred completely (check file size)
3. Re-extract the zip on the new computer (don't copy the extracted folder)

---

## Updating the Extension

If the development team provides a new version:

### Method 1: Reload (for minor updates)
1. Go to `chrome://extensions/`
2. Find Bitcoin Wallet
3. Click the reload icon (circular arrow)
4. Extension will reload with latest changes

### Method 2: Replace (for major updates)
1. Click "Remove" on the old version
2. Extract the new zip file to a new folder
3. Follow installation steps again (Load unpacked)

**⚠️ Warning:** Removing the extension may clear your test wallet data. If you need to preserve test data, consult with the development team about migration.

---

## Uninstalling the Extension

When testing is complete:

1. Go to `chrome://extensions/`
2. Find Bitcoin Wallet
3. Click **"Remove"**
4. Confirm removal
5. Delete the extracted folder from your computer (optional)

**⚠️ Important:**
- This will delete all test wallet data
- Make sure you've backed up any test results or screenshots
- If you have testnet Bitcoin in the wallet and want to keep it, export your seed phrase first

---

## Security Notes for Testers

### Is this safe?
- ✅ YES, as long as the zip file came from the trusted development team
- ✅ This is the official testing version
- ✅ Only use with Bitcoin TESTNET (not real Bitcoin)

### Important Security Rules:
1. **NEVER use real Bitcoin** with this test extension
2. **NEVER import real wallet seed phrases** into the test extension
3. **Use TESTNET ONLY** - get testnet Bitcoin from faucets (free)
4. **Don't share your test seed phrases** with anyone
5. **Report any security issues** immediately to the development team

### What permissions does this extension have?

The extension requests these Chrome permissions:
- **Storage:** To save your encrypted wallet data
- **Tabs:** To open the wallet interface in a tab
- No access to:
  - Your browsing history
  - Other websites
  - Personal files
  - Other extensions

You can verify this in `chrome://extensions/` → Details → Permissions

---

## Next Steps

✅ **Installation complete!**

**What's next:**
1. **Read** [README.md](./README.md) - Quick overview (5 minutes)
2. **Setup testnet** [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) - Get testnet Bitcoin (30 min)
3. **Start testing** [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md) - Follow the testing workflow

---

## FAQ

**Q: Can I use this on multiple computers?**
A: Yes! Just extract the zip on each computer and follow these installation steps.

**Q: Will this affect my regular Chrome browsing?**
A: No. The extension only activates when you click the Bitcoin icon. It doesn't affect other websites or extensions.

**Q: Can I test this in Chrome Incognito mode?**
A: Yes, but you need to enable it:
1. Go to `chrome://extensions/`
2. Click "Details" on Bitcoin Wallet
3. Enable "Allow in Incognito"

**Q: How do I report bugs or issues?**
A: See [BUG_REPORTING_GUIDE.md](./BUG_REPORTING_GUIDE.md) for detailed instructions and templates.

**Q: The extension ID changed when I reinstalled. Is this normal?**
A: Yes! Each unpacked extension gets a unique ID. This is normal and doesn't affect functionality.

**Q: Can I use Firefox or Edge instead of Chrome?**
A: This extension is built for Chrome. It may work on Edge (Chromium-based), but Chrome is recommended for testing.

**Q: How much disk space does this need?**
A: The extension is very small - typically 2-5 MB. Wallet data adds minimal storage (~1 MB).

---

## Getting Help

**If you're stuck:**

1. **Check this guide** - Most issues are covered in Troubleshooting
2. **Check the README** - [TESTING_GUIDES/README.md](./README.md)
3. **Contact the development team**:
   - Email: [your-email@example.com]
   - GitHub Issues: https://github.com/[REPOSITORY]/issues
   - Include:
     - Your operating system
     - Chrome version
     - Screenshots of any errors
     - Steps you followed

**For testing questions:**
- See [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md)
- All testing guides have troubleshooting sections

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-10-29 | Initial installation guide for v0.10.0 testing |

---

**Ready to start testing?** → Go to [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md)
