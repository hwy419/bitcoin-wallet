# Tester Distribution Workflow

**Quick Reference:** How to create and distribute the testing package to manual testers

---

## 🚀 Quick Start (5 Minutes)

```bash
# Build extension
npm run build

# Create tester package
python3 create-tester-package.py

# Output: bitcoin-wallet-v0.12.0-testing-package-[DATE].zip (2.1 MB)
```

**Send to testers** via email, file sharing, or GitHub release.

---

## 📋 Complete Workflow

### Step 1: Prepare the Package

```bash
# Navigate to project root
cd /home/michael/code_projects/bitcoin_wallet

# Build extension (required)
npm run build

# Verify dist/ exists
ls dist/

# Create package
python3 create-tester-package.py
```

**Expected Output:**
```
📦 Creating tester package: bitcoin-wallet-v0.12.0-testing-package-20251101

1️⃣  Copying Chrome extension (dist/)...
   ✅ Copied extension (21 files)
2️⃣  Copying testing guide...
   ✅ Copied testing-guide.html (661 KB)
3️⃣  Copying launcher scripts...
   ✅ Copied open-guide.sh
   ✅ Copied open-guide.bat
4️⃣  Copying documentation...
   ✅ Copied QUICK_START.md
   ✅ Copied HTML_GUIDE_README.md
   ✅ Copied PROJECT_README.md
   ✅ Copied CHANGELOG.md
5️⃣  Creating tester instructions...
   ✅ Created TESTER_README.md
6️⃣  Creating zip archive...
   ✅ Created bitcoin-wallet-v0.12.0-testing-package-20251101.zip (2.11 MB)
7️⃣  Cleaning up...
   ✅ Removed temporary directory

============================================================
✅ TESTER PACKAGE CREATED SUCCESSFULLY!
============================================================
```

### Step 2: Verify Package

```bash
# Check file size (should be ~2.1 MB)
ls -lh bitcoin-wallet-v0.12.0-testing-package-*.zip

# List contents
unzip -l bitcoin-wallet-v0.12.0-testing-package-*.zip | head -20

# Optional: Extract and verify manually
unzip bitcoin-wallet-v0.12.0-testing-package-*.zip -d test-extraction
ls -la test-extraction/bitcoin-wallet-v0.12.0-testing-package-*/
```

**Verify:**
- ✅ `extension/` folder with 21 files
- ✅ `testing-guide.html` (661 KB)
- ✅ `TESTER_README.md` present
- ✅ Launcher scripts present

### Step 3: Distribute to Testers

**Option A: Email**
```
To: tester@example.com
Subject: Bitcoin Wallet v0.12.0 - Testing Package Ready
Attachment: bitcoin-wallet-v0.12.0-testing-package-20251101.zip (2.11 MB)

Body:
Hi [Tester Name],

The Bitcoin Wallet v0.12.0 testing package is ready!

📦 Attached: bitcoin-wallet-v0.12.0-testing-package-20251101.zip (2.11 MB)

Quick Start:
1. Extract the zip file
2. Read TESTER_README.md for complete instructions
3. Install extension from extension/ folder
4. Open testing-guide.html to begin testing

Testing Overview:
- Total time: 16-20 hours over 5 days
- Test cases: 127+ across 15 feature areas
- Network: Bitcoin Testnet (no real funds needed)

The testing guide is interactive with:
- Left-side navigation and search
- Interactive checkboxes (progress auto-saved)
- Complete step-by-step test procedures

Let me know if you have any questions!

Best regards,
[Your Name]
```

**Option B: File Sharing**
```bash
# Upload to Google Drive, Dropbox, OneDrive, etc.
# Generate shareable link
# Send link to testers

Example message:
"Bitcoin Wallet v0.12.0 testing package is ready!
Download: [SHARE_LINK]
Instructions: Extract zip and read TESTER_README.md"
```

**Option C: GitHub Release**
```bash
# Create release on GitHub
# Upload zip as release asset
# Testers download from Releases page

gh release create v0.12.0 \
  --title "Bitcoin Wallet v0.12.0 - Testing Package" \
  --notes "Complete testing package for manual testers" \
  bitcoin-wallet-v0.12.0-testing-package-20251101.zip
```

---

## 🔄 Updating After Changes

### When Code Changes

```bash
# Rebuild extension
npm run build

# Create new package
python3 create-tester-package.py

# New zip created with updated extension
```

### When Testing Guides Change

```bash
# Regenerate HTML guide
cd TESTING_GUIDES
python3 build-html-guide.py

# Return to root
cd ..

# Create new package
python3 create-tester-package.py

# New zip created with updated guide
```

### When Both Change

```bash
# Rebuild extension
npm run build

# Regenerate testing guide
cd TESTING_GUIDES
python3 build-html-guide.py
cd ..

# Create new package
python3 create-tester-package.py
```

---

## 📊 Package Specifications

### File Structure
```
bitcoin-wallet-v0.12.0-testing-package-[DATE].zip (2.11 MB)
│
├── extension/                         # 21 files, 3.8 MB
│   ├── manifest.json
│   ├── index.js (1.3 MB)
│   ├── background.js (1.2 MB)
│   ├── *.wasm (1.2 MB)
│   └── assets/
│
├── testing-guide.html (661 KB)        # Interactive testing guide
├── open-guide.sh                      # Linux/Mac launcher
├── open-guide.bat                     # Windows launcher
│
├── TESTER_README.md                   # Primary instructions
├── QUICK_START.md                     # 5-minute quick start
├── HTML_GUIDE_README.md               # Guide documentation
├── PROJECT_README.md                  # Project overview
└── CHANGELOG.md                       # Version history
```

### Size Breakdown
| Component | Size | % of Total |
|-----------|------|------------|
| Extension | 1.9 MB | 90% |
| Testing Guide | 180 KB | 8.5% |
| Documentation | 30 KB | 1.4% |
| Scripts | 2 KB | 0.1% |
| **Total (compressed)** | **2.11 MB** | **100%** |

---

## ✅ Pre-Distribution Checklist

Before sending package to testers:

### Build Verification
- [ ] `npm run build` completed successfully
- [ ] No TypeScript errors
- [ ] No build warnings
- [ ] `dist/` folder contains all files

### Package Verification
- [ ] Package script ran successfully
- [ ] Zip file size ~2.1 MB
- [ ] Can extract zip without errors
- [ ] `extension/` folder has 21 files
- [ ] `testing-guide.html` exists (661 KB)
- [ ] `TESTER_README.md` exists

### Manual Testing
- [ ] Load extension from `extension/` folder in Chrome
- [ ] Extension loads without errors
- [ ] Can create/unlock wallet
- [ ] Open `testing-guide.html` in browser
- [ ] Guide renders correctly
- [ ] Navigation works
- [ ] Search works
- [ ] Checkboxes are interactive

### Documentation
- [ ] `TESTER_README.md` has correct version number
- [ ] All file references are accurate
- [ ] Links work (internal guides)
- [ ] Instructions are clear

---

## 🐛 Troubleshooting

### Package Creation Fails

**Problem:** `dist/ folder not found`
```bash
# Solution: Build extension first
npm run build
python3 create-tester-package.py
```

**Problem:** `testing-guide.html not found`
```bash
# Solution: Generate HTML guide first
cd TESTING_GUIDES
python3 build-html-guide.py
cd ..
python3 create-tester-package.py
```

**Problem:** Python script errors
```bash
# Solution: Check Python version (3.6+)
python3 --version

# Check script exists
ls -la create-tester-package.py

# Check permissions
chmod +x create-tester-package.py
python3 create-tester-package.py
```

### Package Size Issues

**Problem:** Zip is too large (>5 MB)
```bash
# Check what's included
unzip -l bitcoin-wallet-v0.12.0-testing-package-*.zip

# Possible causes:
# - node_modules accidentally included (shouldn't happen)
# - Extra files in dist/ folder
# - Large test data files

# Solution: Clean rebuild
rm -rf dist/
npm run build
python3 create-tester-package.py
```

### Distribution Issues

**Problem:** Email rejects attachment (too large)
```bash
# Solution: Use file sharing instead
# Google Drive, Dropbox, OneDrive, etc.

# Or use 7-Zip for better compression
7z a bitcoin-wallet-testing.7z bitcoin-wallet-v0.12.0-testing-package-*.zip
# Results in ~1.8 MB file
```

**Problem:** Testers can't extract zip
```bash
# Solution: Verify zip integrity
unzip -t bitcoin-wallet-v0.12.0-testing-package-*.zip

# If corrupted, regenerate:
python3 create-tester-package.py
```

---

## 📞 Support for Testers

### Common Tester Questions

**Q:** "Extension won't load"
**A:**
```
1. Check chrome://extensions/
2. Enable "Developer mode"
3. "Load unpacked"
4. Select the extension/ folder (not the zip)
5. Verify manifest.json exists in extension/
```

**Q:** "Testing guide won't open"
**A:**
```
1. Double-click testing-guide.html
2. Or right-click → "Open with" → Browser
3. Try different browser (Chrome recommended)
4. File should be 661 KB
```

**Q:** "Where do I start?"
**A:**
```
1. Read TESTER_README.md first
2. Install extension from extension/ folder
3. Open testing-guide.html in browser
4. Click "Master Testing Guide" in sidebar
5. Follow 5-day testing plan
```

**Q:** "How do I get testnet Bitcoin?"
**A:**
```
1. Create wallet in extension
2. Copy receiving address
3. Visit https://testnet-faucet.mempool.co/
4. Paste address and request BTC
5. Wait 2-3 minutes for coins to arrive
```

---

## 🎯 Success Metrics

Package distribution is successful when:

✅ Testers can extract zip without issues
✅ Extension loads in Chrome without errors
✅ Testing guide opens and renders correctly
✅ Testers can navigate guides using sidebar
✅ Testers can check off test cases (progress saves)
✅ Testers complete smoke tests (30 min, 20 tests)
✅ Testers can find testnet faucets and get BTC
✅ Testers submit bug reports using provided templates

---

## 📚 Related Documentation

- **TESTER_PACKAGE_INFO.md** - Complete package documentation
- **TESTING_GUIDES/MASTER_TESTING_GUIDE.md** - Testing workflow
- **TESTING_GUIDES/QUICK_START.md** - Tester quick start
- **CLAUDE.md** - Development guide (includes tester package section)
- **README.md** - Project overview (includes testing section)
- **DEVELOPMENT_TIPS.md** - Developer productivity tips

---

## 🎉 Summary

**Creating Package:**
```bash
npm run build && python3 create-tester-package.py
```

**Distributing Package:**
- Email (2.11 MB zip)
- File sharing (Google Drive, etc.)
- GitHub release

**Tester Experience:**
1. Extract → 2. Read → 3. Install → 4. Test

**Package Contents:**
- Extension ready to install
- Interactive testing guide
- Complete documentation
- Cross-platform launchers

**Time Investment:**
- Create package: 2 minutes
- Distribute: 5 minutes
- Tester setup: 5 minutes
- Tester testing: 16-20 hours over 5 days

---

**Questions?** See `TESTER_PACKAGE_INFO.md` for detailed information.
