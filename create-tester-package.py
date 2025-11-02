#!/usr/bin/env python3
"""
Bitcoin Wallet - Create Tester Distribution Package
Packages the extension and testing guides for distribution to testers
"""

import os
import shutil
import zipfile
from pathlib import Path
from datetime import datetime

def create_tester_package():
    """Create a distribution package for testers"""

    # Directories
    project_root = Path(__file__).parent
    dist_dir = project_root / 'dist'
    testing_guides_dir = project_root / 'TESTING_GUIDES'

    # Create temporary package directory
    timestamp = datetime.now().strftime('%Y%m%d')
    package_name = f'bitcoin-wallet-v0.12.0-testing-package-{timestamp}'
    package_dir = project_root / package_name

    print(f"📦 Creating tester package: {package_name}")
    print(f"")

    # Clean up if exists
    if package_dir.exists():
        shutil.rmtree(package_dir)

    package_dir.mkdir()

    # 1. Copy dist/ folder (the extension)
    print("1️⃣  Copying Chrome extension (dist/)...")
    if not dist_dir.exists():
        print("   ❌ Error: dist/ folder not found!")
        print("   Run 'npm run build' first to build the extension")
        return None

    shutil.copytree(dist_dir, package_dir / 'extension')
    print(f"   ✅ Copied extension ({sum(1 for _ in (package_dir / 'extension').rglob('*'))} files)")

    # 2. Copy testing guide HTML
    print("2️⃣  Copying testing guide...")
    testing_guide_html = testing_guides_dir / 'testing-guide.html'
    if testing_guide_html.exists():
        shutil.copy(testing_guide_html, package_dir / 'testing-guide.html')
        print(f"   ✅ Copied testing-guide.html ({testing_guide_html.stat().st_size // 1024} KB)")
    else:
        print("   ⚠️  Warning: testing-guide.html not found - run build-html-guide.py")

    # 3. Copy launcher scripts
    print("3️⃣  Copying launcher scripts...")
    launchers = [
        'open-guide.sh',
        'open-guide.bat'
    ]

    for launcher in launchers:
        src = testing_guides_dir / launcher
        if src.exists():
            shutil.copy(src, package_dir / launcher)
            # Make shell script executable
            if launcher.endswith('.sh'):
                os.chmod(package_dir / launcher, 0o755)
            print(f"   ✅ Copied {launcher}")

    # 4. Copy key documentation
    print("4️⃣  Copying documentation...")
    docs = [
        ('TESTING_GUIDES/QUICK_START.md', 'QUICK_START.md'),
        ('TESTING_GUIDES/HTML_GUIDE_README.md', 'HTML_GUIDE_README.md'),
        ('README.md', 'PROJECT_README.md'),
        ('CHANGELOG.md', 'CHANGELOG.md'),
    ]

    for src_path, dest_name in docs:
        src = project_root / src_path
        if src.exists():
            shutil.copy(src, package_dir / dest_name)
            print(f"   ✅ Copied {dest_name}")

    # 5. Create TESTER_README.md
    print("5️⃣  Creating tester instructions...")
    tester_readme = f"""# Bitcoin Wallet v0.12.0 - Testing Package

**Package Date:** {datetime.now().strftime('%B %d, %Y')}
**For:** Manual Testers / QA Engineers

---

## 📦 What's Included

```
{package_name}/
├── extension/                    # Chrome extension to install
│   ├── manifest.json
│   ├── background.js
│   ├── index.html
│   └── ... (all extension files)
│
├── testing-guide.html           # ⭐ Interactive testing guide
├── open-guide.sh                # Linux/Mac launcher
├── open-guide.bat               # Windows launcher
│
├── QUICK_START.md               # 5-minute quick start
├── HTML_GUIDE_README.md         # Full guide documentation
├── PROJECT_README.md            # Project overview
├── CHANGELOG.md                 # Version history
└── TESTER_README.md            # This file
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install the Extension (2 minutes)

**Chrome / Edge:**

1. Open browser and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension/` folder from this package
5. Verify "Bitcoin Wallet" appears (version 0.12.0)
6. Click the ₿ icon in toolbar to open wallet

**Verify Installation:**
- Extension opens in a new browser tab (not popup)
- URL: `chrome-extension://[id]/index.html`
- Welcome screen shows "Create New Wallet" or "Import Seed Phrase"

### Step 2: Open Testing Guide (1 minute)

**Option 1: Double-Click (Easiest)**
```
📂 Double-click: testing-guide.html
→ Opens in your default browser
```

**Option 2: Use Launcher**
```bash
# Linux/Mac
./open-guide.sh

# Windows
open-guide.bat
```

**Option 3: Browser**
```
1. Open browser
2. Press Ctrl+O (or Cmd+O on Mac)
3. Select testing-guide.html
4. Click Open
```

### Step 3: Start Testing (2 minutes)

**In the Testing Guide:**

1. Click "🎯 Master Testing Guide" in the left sidebar
2. Read the 6-phase testing workflow
3. Click "⚙️ Testnet Setup" to configure your environment
4. Click "🚀 Priority Tests (P0)" to run smoke tests (30 min)
5. Check boxes ✅ as you complete tests (auto-saved!)

---

## 📋 Testing Workflow

```
┌─────────────────────────────────────────────────────┐
│  RECOMMENDED 5-DAY TESTING PLAN                     │
├─────────────────────────────────────────────────────┤
│  Day 1 (3h):  Setup + Priority Smoke Tests          │
│  Day 2 (4h):  Core Features (Send/Receive)          │
│  Day 3 (4h):  Advanced Features (Multisig/History)  │
│  Day 4 (3h):  UI/UX + Security Testing              │
│  Day 5 (2h):  Regression + Sign-off                 │
├─────────────────────────────────────────────────────┤
│  Total: 16 hours over 5 days                        │
└─────────────────────────────────────────────────────┘
```

**Total Test Cases:** 127+ across 15 feature areas

---

## 🎯 Your First 30 Minutes

1. **Install Extension** (Step 1 above)
2. **Open Testing Guide** (Step 2 above)
3. **Navigate to:** "⚙️ Testnet Setup" in sidebar
4. **Get Testnet Bitcoin:**
   - Create wallet in extension
   - Copy your receiving address (starts with `tb1`)
   - Visit: https://testnet-faucet.mempool.co/
   - Paste address and get free testnet BTC
5. **Run Smoke Tests:**
   - Navigate to: "🚀 Priority Tests (P0)"
   - Execute 20 quick tests (30 minutes)
   - Check boxes as you complete each test

---

## ✨ Testing Guide Features

**Interactive HTML Guide:**
- ✅ Left-side navigation with search
- ✅ Interactive checkboxes (progress auto-saved)
- ✅ GitHub-style markdown rendering
- ✅ Hyperlinking between guides
- ✅ Works offline (no internet required)
- ✅ Mobile-friendly responsive design

**Navigation Tips:**
- Search: Type in search box to filter guides
- Checkboxes: Click to mark tests complete (saved automatically)
- Links: Click blue links to jump between guides
- Progress: Your checkbox state persists across sessions

---

## 📚 Key Documentation

| File | Purpose | When to Use |
|------|---------|-------------|
| `QUICK_START.md` | 5-min onboarding | First time using guide |
| `HTML_GUIDE_README.md` | Full guide docs | Detailed help needed |
| `PROJECT_README.md` | Project overview | Understand architecture |
| `CHANGELOG.md` | Version history | See what changed |

---

## 🌐 Important Links

**Testnet Resources:**
- Faucet: https://testnet-faucet.mempool.co/
- Explorer: https://blockstream.info/testnet/
- BIP39 Tool: https://iancoleman.io/bip39/

**Support:**
- Questions: Add to "Questions Log" in testing guide
- Bugs: Use "🐛 Bug Reporting" guide for templates

---

## ⚠️ Important Notes

**This is TESTNET ONLY:**
- ❌ Do NOT use real Bitcoin
- ❌ Do NOT send real funds to testnet addresses
- ❌ Do NOT use your real wallet seed phrases
- ✅ Only use testnet Bitcoin (has no value)
- ✅ Get testnet BTC from faucets (free)

**Testnet Addresses:**
- Native SegWit: `tb1q...`
- SegWit: `2...`
- Legacy: `m...` or `n...`

**NOT Mainnet Addresses:**
- `bc1...` ❌ (mainnet Native SegWit)
- `3...` ❌ (mainnet SegWit)
- `1...` ❌ (mainnet Legacy)

---

## 🐛 Found a Bug?

1. Navigate to "🐛 Bug Reporting" in testing guide
2. Use the bug report template
3. Include:
   - Steps to reproduce
   - Expected vs actual result
   - Screenshots (Win+Shift+S or Cmd+Shift+4)
   - Console logs (F12 → Console)
4. Document in bug tracker section

**Bug Severity:**
- **P0 (Critical):** Wallet unusable, security issue, data loss
- **P1 (High):** Major feature broken
- **P2 (Medium):** Minor feature issue
- **P3 (Low):** Cosmetic, nice-to-have

---

## 💡 Pro Tips

**Multi-Monitor Setup:**
```
Monitor 1: testing-guide.html (reference)
Monitor 2: Bitcoin Wallet extension (testing)
→ Follow test steps on one screen while testing on the other
```

**Keyboard Shortcuts:**
- `F12` - Open DevTools (check for errors)
- `Ctrl+F` - Search in guide
- `Ctrl+Shift+D` - Duplicate tab (test single-tab enforcement)
- `Ctrl+P` - Print guide to PDF

**Save Time:**
- Bookmark testing-guide.html for quick access
- Use same password for all test wallets: `TestWallet123`
- Keep faucet tab open for easy testnet BTC requests
- Take screenshots as you go (Win+Shift+S)

---

## 🎉 You're Ready!

**Next Steps:**

1. ✅ Install extension from `extension/` folder
2. ✅ Open `testing-guide.html` in browser
3. ✅ Bookmark the guide
4. ✅ Start with "🎯 Master Testing Guide"
5. ✅ Set up testnet environment
6. ✅ Run 30-min smoke test
7. ✅ Begin systematic feature testing

---

## 📞 Questions?

**During Testing:**
- Check relevant guide sections first
- See QUICK_START.md for fast answers
- See HTML_GUIDE_README.md for detailed help

**Technical Issues:**
- Extension won't load? Check chrome://extensions/
- Guide won't open? Try different browser
- Testnet BTC not arriving? Wait 2-3 minutes, check explorer

---

**Happy Testing! 🧪**

Thank you for helping ensure the Bitcoin Wallet is secure, reliable, and user-friendly!

---

**Package Information:**
- Extension Version: 0.12.0
- Package Date: {datetime.now().strftime('%Y-%m-%d')}
- Testing Guide Version: 1.0 (Markdown Renderer)
- Network: Bitcoin Testnet Only
"""

    with open(package_dir / 'TESTER_README.md', 'w', encoding='utf-8') as f:
        f.write(tester_readme)
    print(f"   ✅ Created TESTER_README.md")

    # 6. Create .gitignore for the package
    gitignore_content = """# Testing package - for distribution
*.log
.DS_Store
Thumbs.db
"""
    with open(package_dir / '.gitignore', 'w') as f:
        f.write(gitignore_content)

    # 7. Create zip archive
    print("6️⃣  Creating zip archive...")
    zip_filename = f'{package_name}.zip'
    zip_path = project_root / zip_filename

    # Remove old zip if exists
    if zip_path.exists():
        os.remove(zip_path)

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = Path(root) / file
                arcname = file_path.relative_to(package_dir.parent)
                zipf.write(file_path, arcname)

    zip_size_mb = zip_path.stat().st_size / (1024 * 1024)
    print(f"   ✅ Created {zip_filename} ({zip_size_mb:.2f} MB)")

    # 8. Cleanup temporary directory
    print("7️⃣  Cleaning up...")
    shutil.rmtree(package_dir)
    print(f"   ✅ Removed temporary directory")

    # Summary
    print("")
    print("=" * 60)
    print("✅ TESTER PACKAGE CREATED SUCCESSFULLY!")
    print("=" * 60)
    print(f"")
    print(f"📦 Package: {zip_filename}")
    print(f"📂 Location: {zip_path}")
    print(f"💾 Size: {zip_size_mb:.2f} MB")
    print(f"")
    print(f"📋 Contents:")
    print(f"   • Chrome Extension (dist/ → extension/)")
    print(f"   • Interactive Testing Guide (testing-guide.html)")
    print(f"   • Launcher Scripts (open-guide.sh, open-guide.bat)")
    print(f"   • Documentation (README, Quick Start, etc.)")
    print(f"   • Tester Instructions (TESTER_README.md)")
    print(f"")
    print(f"🚀 Distribution:")
    print(f"   1. Send {zip_filename} to testers")
    print(f"   2. Testers extract and read TESTER_README.md")
    print(f"   3. Testers install extension from extension/ folder")
    print(f"   4. Testers open testing-guide.html and start testing")
    print(f"")
    print(f"💡 Pro Tip: Upload to file sharing service or email directly")
    print(f"")

    return zip_path


if __name__ == '__main__':
    try:
        zip_path = create_tester_package()
        if zip_path:
            print(f"✨ Success! Package ready for distribution.")
    except Exception as e:
        print(f"❌ Error creating package: {e}")
        import traceback
        traceback.print_exc()
