# Distribution Guide for Developers

**For Development Team**
**Last Updated:** 2025-10-29
**Purpose:** Package and distribute extension to human testers

---

## Quick Answer

**Yes, you can zip the `dist/` folder and send it to your tester!**

The build is **portable** and will work on any computer with Chrome installed. The tester just needs to:
1. Extract the zip
2. Load it as an unpacked extension in Chrome

---

## Creating the Distribution Package

### Step 1: Build the Extension

Make sure you have a production build:

```bash
# Navigate to project root
cd /home/michael/code_projects/bitcoin_wallet

# Install dependencies (if not already done)
npm install

# Create production build
npm run build
```

This creates the `dist/` folder with all necessary files.

### Step 2: Verify the Build

Check that these files exist in `dist/`:

```
dist/
├── manifest.json          ← Required
├── index.html             ← Required
├── background.js          ← Required (service worker)
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── assets/
│   └── [bundled JS/CSS files]
└── [other generated files]
```

**Critical check:**
```bash
# Verify manifest.json exists and is valid
cat dist/manifest.json | grep "version"
# Should show: "version": "0.10.0"
```

### Step 3: Create the ZIP File

#### Option A: Command Line (Linux/Mac/Git Bash)

```bash
# Navigate to project root
cd /home/michael/code_projects/bitcoin_wallet

# Create zip (excludes unnecessary files)
zip -r bitcoin-wallet-v0.10.0.zip dist/ \
  --exclude "*.map" \
  --exclude "*.DS_Store"

# Verify zip created
ls -lh bitcoin-wallet-v0.10.0.zip
```

#### Option B: Command Line (Windows PowerShell)

```powershell
# Navigate to project root
cd C:\path\to\bitcoin_wallet

# Create zip
Compress-Archive -Path dist\* -DestinationPath bitcoin-wallet-v0.10.0.zip

# Verify
Get-Item bitcoin-wallet-v0.10.0.zip
```

#### Option C: File Explorer / Finder

**Windows:**
1. Navigate to the `dist/` folder in File Explorer
2. Select ALL contents inside `dist/` (Ctrl+A)
3. Right-click → Send to → Compressed (zipped) folder
4. Rename to: `bitcoin-wallet-v0.10.0.zip`

**Mac:**
1. Navigate to the `dist/` folder in Finder
2. Select ALL contents inside `dist/` (Cmd+A)
3. Right-click → Compress X items
4. Rename to: `bitcoin-wallet-v0.10.0.zip`

**Linux:**
1. Navigate to the `dist/` folder
2. Select all contents
3. Right-click → Compress
4. Choose ZIP format
5. Name: `bitcoin-wallet-v0.10.0.zip`

### Step 4: Verify the ZIP

**Test the zip file yourself before sending:**

1. Create a test folder: `mkdir test-extraction`
2. Extract zip: `unzip bitcoin-wallet-v0.10.0.zip -d test-extraction/`
3. Verify `manifest.json` is in the extracted folder
4. Try loading it in Chrome:
   - Go to `chrome://extensions/`
   - Enable Developer mode
   - Click "Load unpacked"
   - Select the extracted folder
   - Verify extension loads without errors

**If it works for you, it will work for your tester!**

---

## What to Send to Your Tester

### Package Contents:

1. **bitcoin-wallet-v0.10.0.zip** (the extension)
2. **TESTING_GUIDES/** folder (all testing documentation)
   - Or send link to GitHub repository if public

### Recommended Email Template:

```
Subject: Bitcoin Wallet v0.10.0 - Ready for Testing

Hi [Tester Name],

The Bitcoin Wallet Chrome Extension v0.10.0 is ready for testing!

ATTACHMENTS:
1. bitcoin-wallet-v0.10.0.zip - The extension (extract and install in Chrome)
2. TESTING_GUIDES/ - Complete testing documentation

GETTING STARTED:
1. Follow EXTENSION_INSTALLATION_GUIDE.md to install the extension
2. Read README.md for an overview (5 minutes)
3. Start with MASTER_TESTING_GUIDE.md for the testing workflow

IMPORTANT:
- Use TESTNET ONLY (not real Bitcoin)
- Never import real wallet seed phrases
- Report bugs using the templates in BUG_REPORTING_GUIDE.md

Questions? Reply to this email or see the troubleshooting sections in each guide.

Thanks!
[Your Name]
```

---

## Alternative: Share via GitHub

If your repository is private, you can also:

1. **Create a GitHub Release:**
   ```bash
   # Tag the version
   git tag v0.10.0
   git push origin v0.10.0

   # Create release on GitHub
   # Upload bitcoin-wallet-v0.10.0.zip as release asset
   ```

2. **Share the download link:**
   ```
   Download: https://github.com/[your-repo]/releases/download/v0.10.0/bitcoin-wallet-v0.10.0.zip
   Documentation: https://github.com/[your-repo]/tree/main/TESTING_GUIDES
   ```

---

## Security Considerations

### What's Safe to Share:

✅ **The dist/ folder** - Contains only compiled/bundled code, no secrets
✅ **Testing guides** - Documentation for testers
✅ **Source code** (if you choose) - If your repo is open source

### What NOT to Include:

❌ **node_modules/** - Testers don't need this (huge, unnecessary)
❌ **.env files** - Never include environment files
❌ **API keys** - Should be configured separately
❌ **src/** folder - Testers only need the built `dist/`
❌ **Git history** (.git folder) - Not needed for testing

### Double Check:

Before sending, verify the zip doesn't contain:
```bash
# Extract and check contents
unzip -l bitcoin-wallet-v0.10.0.zip | grep -E "\\.env|node_modules|api.*key"

# Should return nothing (empty result = good)
```

---

## File Size

**Expected size:** 2-5 MB (typical for bundled extension)

If the zip is:
- **< 1 MB:** Might be missing files, verify build
- **1-10 MB:** ✅ Normal, good to send
- **> 10 MB:** Check if source maps or node_modules included

```bash
# Check zip size
ls -lh bitcoin-wallet-v0.10.0.zip

# If too large, check what's inside
unzip -l bitcoin-wallet-v0.10.0.zip | head -20
```

---

## Updating the Tester

When you make changes and need the tester to update:

### Option 1: Send New Zip
1. Increment version in `package.json` and `manifest.json`
2. Build: `npm run build`
3. Create new zip: `bitcoin-wallet-v0.10.1.zip`
4. Send to tester with update notes

**Tester updates by:**
- Removing old extension in `chrome://extensions/`
- Loading new zip as unpacked extension

### Option 2: Hot Reload (for minor changes)
If tester already has the extension:
1. Send just the changed files (e.g., updated `background.js`)
2. Tester replaces files in their extracted folder
3. Tester clicks "Reload" in `chrome://extensions/`

**Note:** Option 1 (new zip) is cleaner for major updates

---

## Common Questions

**Q: Will the extension work on Mac, Windows, and Linux?**
A: Yes! Chrome extensions are cross-platform. The same zip works everywhere.

**Q: Does the tester need Node.js or npm?**
A: No. They only need Chrome browser. The `dist/` folder is already built.

**Q: Can multiple testers use the same zip?**
A: Yes! Send the same zip to as many testers as needed.

**Q: What if the tester has a different Chrome version?**
A: Extension should work on Chrome 88+ (from 2021). Most users have much newer.

**Q: Can the extension auto-update?**
A: Not when loaded unpacked. For auto-updates, you need to publish to Chrome Web Store (production).

**Q: Is there a file size limit?**
A: Gmail allows up to 25 MB attachments. Your zip will be ~2-5 MB, well within limits.

**Q: Can I use Google Drive or Dropbox instead of email?**
A: Yes! Upload the zip and share a download link.

---

## Installation Testing

### Test Transaction Metadata (v0.12.0)

**Objective**: Verify transaction metadata works with fresh install

**Steps**:
1. Fresh install of extension
2. Create wallet and add testnet Bitcoin
3. Send a transaction
4. Open transaction detail pane
5. Expand "Tags & Notes" section
6. Add metadata:
   - Category: "Test"
   - Tags: #first, #demo
   - Notes: "Testing metadata feature"
7. Save metadata
8. Lock wallet
9. Reopen transaction - verify lock icon shown
10. Unlock wallet
11. Verify metadata visible and editable

**Expected Results**:
- Metadata saves successfully
- Metadata encrypted in chrome.storage.local
- Lock icon prevents editing when locked
- Metadata persists across wallet lock/unlock

**Pass Criteria**: All metadata operations work, encryption verified

---

### Test Contact Tags (v0.12.0)

**Objective**: Verify contact tags work with fresh install

**Steps**:
1. Fresh install of extension
2. Create wallet
3. Add contact with custom tags:
   - Name: "Test Contact"
   - Address: (any testnet address)
   - Tags: company=Test, type=demo
4. Save contact
5. Verify tags display in contact card
6. Search for "company" - verify contact found
7. Open ContactDetailPane
8. Edit tag value inline
9. Add new tag inline
10. Remove tag inline
11. Inspect chrome.storage.local
12. Verify tags encrypted in contact data

**Expected Results**:
- Tags save with contact
- Tags display as colored badges
- Search by tag key/value works
- Inline editing works in detail pane
- Tags encrypted in storage

**Pass Criteria**: All tag operations work, encryption verified

---

### Test Enhanced Filtering (v0.12.0)

**Objective**: Verify multi-select filtering with fresh install

**Steps**:
1. Fresh install with sample transactions (see TESTNET_SETUP_GUIDE)
2. Create test data:
   - 3 contacts
   - 5 transactions with various metadata
3. Open FilterPanel
4. Test contact filter:
   - Select 2 contacts
   - Verify filtered results
5. Test tag filter:
   - Select 2 tags
   - Verify OR logic (any tag matches)
6. Test category filter:
   - Select 1 category
   - Verify results
7. Test combined filters:
   - Select contact + tag
   - Verify AND logic (must match both)
8. Clear individual filter pill
9. Reset all filters

**Expected Results**:
- All filter types work correctly
- OR logic within filter type (tags, categories)
- AND logic across filter types
- Filter pills display and clear correctly
- "Reset All" clears all filters

**Pass Criteria**: All filtering combinations work as expected

---

### Test ContactDetailPane (v0.12.0)

**Objective**: Verify ContactDetailPane functionality

**Steps**:
1. Create contact with full data (name, email, category, notes, tags)
2. Open ContactDetailPane (click contact card)
3. Test inline editing:
   - Click name field, edit, save
   - Click email field, edit, save
   - Click category field, edit, save
4. Test tag management:
   - Add new tag inline
   - Edit existing tag
   - Remove tag
5. View recent transactions
6. Click "View All" transactions
7. Close pane (X button, ESC, backdrop)
8. Delete contact from pane

**Expected Results**:
- Pane opens smoothly
- All inline editing works
- Tag management works
- Recent transactions load
- "View All" applies contact filter
- Multiple close methods work
- Delete requires confirmation

**Pass Criteria**: All ContactDetailPane features functional

---

### Test "Add to Contacts" (v0.12.0)

**Objective**: Verify quick contact creation from transactions

**Steps**:
1. Send a transaction to a new address (not in contacts)
2. After success, verify "Save to Address Book" button shown
3. Click button
4. Verify:
   - Address pre-filled
   - Category suggested ("Exchange" or "Unknown")
   - Modal opens
5. Enter name and save
6. Verify contact created
7. Open a transaction in TransactionDetailPane
8. Find an output address not in contacts
9. Click "Add to Contacts" button next to address
10. Verify same pre-fill behavior

**Expected Results**:
- "Add to Contacts" buttons appear for non-contact addresses
- Address pre-filled correctly
- Category auto-suggested
- Contact saves successfully
- Buttons hidden for addresses already in contacts

**Pass Criteria**: Quick contact creation works from both locations

---

## Troubleshooting

### Problem: Zip file is 0 bytes or very small

**Cause:** Build failed or dist/ folder is empty

**Solution:**
```bash
# Check if dist exists and has files
ls -la dist/

# If empty, rebuild
npm run build

# Verify build succeeded
ls -la dist/
```

### Problem: Tester says "Failed to load extension"

**Likely causes:**
1. They selected the wrong folder (selected zip file instead of extracted folder)
2. Zip extraction failed/corrupted
3. Missing manifest.json

**Solution:**
- Ask them to send screenshot of error
- Verify they extracted the zip completely
- Verify they selected the folder containing `manifest.json`

### Problem: Extension loads but shows errors

**Cause:** Build configuration issue or missing dependencies

**Solution:**
1. Test the zip yourself first (see Step 4)
2. Check console errors in `chrome://extensions/`
3. Ensure production build is used (not development build)

---

## Checklist Before Sending

Before you send the zip to your tester:

- [ ] Production build created (`npm run build`)
- [ ] Manifest version updated (if new release)
- [ ] Zip file created successfully
- [ ] Zip size is reasonable (2-10 MB)
- [ ] Tested zip yourself (extract and load in Chrome)
- [ ] Extension loads without errors
- [ ] No sensitive data in zip (no .env, no API keys)
- [ ] Testing documentation included or linked
- [ ] Email or instructions prepared for tester

**All checked?** ✅ Ready to send!

---

## Advanced: Automated Build Script

For frequent distributions, create a build script:

```bash
#!/bin/bash
# File: build-and-package.sh

# Exit on error
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building Bitcoin Wallet Extension...${NC}"

# Clean previous build
rm -rf dist/

# Build extension
npm run build

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Create zip
ZIP_NAME="bitcoin-wallet-v${VERSION}.zip"
echo -e "${BLUE}Creating ${ZIP_NAME}...${NC}"

# Remove old zip if exists
rm -f "$ZIP_NAME"

# Create new zip
cd dist/
zip -r "../$ZIP_NAME" * -x "*.map"
cd ..

# Verify
if [ -f "$ZIP_NAME" ]; then
    SIZE=$(du -h "$ZIP_NAME" | cut -f1)
    echo -e "${GREEN}✅ Success! Created ${ZIP_NAME} (${SIZE})${NC}"
    echo -e "${GREEN}Ready to send to testers!${NC}"
else
    echo "❌ Error: Failed to create zip"
    exit 1
fi
```

Usage:
```bash
chmod +x build-and-package.sh
./build-and-package.sh
```

---

**Ready to distribute!** 🚀

For more questions, see the EXTENSION_INSTALLATION_GUIDE.md (what the tester sees).
