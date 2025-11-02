# Quick Start - Interactive HTML Testing Guide

## 🚀 How to Open

**Option 1: Double-Click (Easiest)**
```
📂 Navigate to: bitcoin_wallet/TESTING_GUIDES/
🖱️ Double-click: testing-guide.html
```

**Option 2: Launcher Script**
```bash
# Linux/Mac
cd TESTING_GUIDES
./open-guide.sh

# Windows
cd TESTING_GUIDES
open-guide.bat
```

**Option 3: Browser**
```
1. Open browser (Chrome/Firefox/Edge/Safari)
2. Press Ctrl+O (or Cmd+O on Mac)
3. Select: bitcoin_wallet/TESTING_GUIDES/testing-guide.html
4. Click Open
```

---

## 📱 Interface Overview

```
┌──────────────────────────────────────────────────────────┐
│  ₿ Bitcoin Wallet                                        │
│  Testing Guides                                          │
│                                                          │
│  🔍 [Search guides...]                                   │
│                                                          │
│  Core Guides                                             │
│    📋 Overview                                           │
│    🎯 Master Testing Guide                               │
│    ⚙️ Testnet Setup                                      │
│    🚀 Priority Tests (P0)                                │
│    🐛 Bug Reporting                                      │
│    📊 Results Tracker                                    │
│    🎨 Visual Testing                                     │
│    ₿ Bitcoin Testing                                     │
│    📦 Extension Install                                  │
│    🌐 Distribution                                       │
│                                                          │
│  Feature Tests                                           │
│    🪟 01. Tab Architecture                               │
│    💼 02. Wallet Setup                                   │
│    🔐 03. Authentication                                 │
│    👤 04. Account Management                             │
│    📤 05. Send Transactions                              │
│    📥 06. Receive Transactions                           │
│    📜 07. Transaction History                            │
│    🔑 08. Multisig Wallets                               │
│    🛡️ 09. Security Features                             │
│    ⚙️ 10. Settings                                       │
│    📇 10. Contact Management                             │
│    ♿ 11. Accessibility                                  │
│    🔍 11. Transaction Filtering                          │
│    🏷️ 12. Transaction Metadata                          │
│    💾 13. Encrypted Backup                               │
│                                                          │
│  Workflows                                               │
│    🔄 PSBT Workflow                                      │
└──────────────────────────────────────────────────────────┘
                    ↑
                SIDEBAR
                (Fixed)

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  MAIN CONTENT AREA                                           │
│                                                              │
│  # Bitcoin Wallet Testing Guides                             │
│  ─────────────────────────────────────────────────────       │
│                                                              │
│  Welcome to the Interactive Testing Guide!                   │
│                                                              │
│  This is a comprehensive manual testing guide for the        │
│  Bitcoin Wallet Chrome Extension v0.12.0.                    │
│                                                              │
│  Quick Start                                                 │
│  1. Read the Overview                                        │
│  2. Start with Master Testing Guide                          │
│  3. Set up environment using Testnet Setup                   │
│  4. Run Priority Tests (30 min smoke test)                   │
│  5. Execute feature tests systematically                     │
│                                                              │
│  Features                                                    │
│  ✅ Interactive checkboxes to track progress                │
│  🔍 Search across all guides                                │
│  📱 Responsive design                                        │
│  🔗 Hyperlinked navigation                                  │
│  💾 Progress saved in localStorage                          │
│                                                              │
│  [Click any guide in the sidebar to get started]            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 1. Left-Side Navigation
- **Organized Categories**: Core Guides, Feature Tests, Workflows
- **Visual Icons**: Quick identification of guide types
- **Active Highlighting**: Current guide highlighted in orange
- **Always Visible**: Fixed sidebar, scrolls independently

### 2. Search Functionality
- **Real-Time Filter**: Type to filter sidebar
- **Instant Results**: No page reload needed
- **Clear to Reset**: Empty search shows all guides

### 3. Progress Tracking
- **Interactive Checkboxes**: Click to check/uncheck test steps
- **Auto-Save**: Progress saved to browser localStorage
- **Persistent**: Maintains state across sessions
- **Per-Device**: Saved locally in browser

### 4. Hyperlinking
- **Internal Links**: Click to jump between guides
- **External Links**: Open testnet explorers, resources
- **Hash Navigation**: URL updates with current guide (#guide-name)
- **Browser History**: Use back/forward buttons

### 5. Browser-Friendly
- **Responsive Design**: Works on desktop, tablet, mobile
- **Print Optimized**: Clean PDF export via browser print
- **Offline Ready**: No internet required (self-contained HTML)
- **Fast Loading**: Single 871KB file

---

## 🎯 Recommended Workflow

```
DAY 1 (3 hours) - Foundation
├─ 1. Open testing-guide.html in browser
├─ 2. Bookmark the page
├─ 3. Navigate to: 🎯 Master Testing Guide
├─ 4. Read workflow overview (10 min)
├─ 5. Navigate to: ⚙️ Testnet Setup
├─ 6. Complete environment setup (1 hour)
├─ 7. Navigate to: 🚀 Priority Tests
└─ 8. Run smoke tests (30 min)

DAY 2-4 (12 hours) - Feature Testing
├─ Navigate through Feature Tests 01-13
├─ Check off completed test cases
├─ Document bugs using 🐛 Bug Reporting guide
└─ Update 📊 Results Tracker

DAY 5 (2 hours) - Regression & Sign-Off
├─ Run regression tests from 🚀 Priority Tests
├─ Review all checked items
└─ Complete 📊 Results Tracker
```

---

## 💡 Pro Tips

**Bookmark for Quick Access**
```
Chrome: Ctrl+D (or Cmd+D)
→ Bookmark as: "Bitcoin Wallet Testing"
→ Create bookmark folder: "Testing"
```

**Multi-Monitor Setup**
```
Monitor 1: HTML testing guide (reference)
Monitor 2: Bitcoin Wallet extension (testing)
→ Reference steps while executing tests side-by-side
```

**Track Progress**
```
✅ Check boxes as you complete tests
→ Progress automatically saved
→ Return anytime to continue where you left off
```

**Export to PDF**
```
1. Open testing-guide.html
2. Ctrl+P (or Cmd+P)
3. Destination: "Save as PDF"
4. Save → Now you have portable PDF version
```

**Reset Progress**
```
Want to start fresh?
→ Browser → Settings → Clear browsing data
→ Select "Cookies and site data"
→ Checkboxes reset to unchecked
```

**Use Search Effectively**
```
Search for:
- "multisig" → Find all multisig-related guides
- "PSBT" → Jump to PSBT workflow
- "security" → Find security testing
- "P0" → Find priority tests
```

---

## 📂 File Structure

```
TESTING_GUIDES/
├── testing-guide.html          ★ OPEN THIS FILE ★
├── build-html-guide.py         (Generator script)
├── open-guide.sh               (Linux/Mac launcher)
├── open-guide.bat              (Windows launcher)
├── HTML_GUIDE_README.md        (Detailed documentation)
├── QUICK_START.md              (This file)
│
├── README.md                   (Markdown guides overview)
├── MASTER_TESTING_GUIDE.md     (Markdown source)
├── PRIORITY_TEST_EXECUTION_GUIDE.md
├── TESTNET_SETUP_GUIDE.md
├── ... (other markdown files)
│
└── FEATURE_TESTS/
    ├── 01_TAB_ARCHITECTURE.md
    ├── 02_WALLET_SETUP.md
    └── ... (feature test markdown files)
```

---

## ⚠️ Troubleshooting

**Guide won't open?**
```
→ Ensure file ends with .html extension
→ Try opening with different browser
→ Right-click file → "Open with" → Select browser
```

**Sidebar not showing?**
```
→ Refresh page (F5)
→ Try different browser (Chrome recommended)
→ Check browser console (F12) for errors
```

**Checkboxes not saving?**
```
→ Browser may block localStorage for file:// protocol
→ Settings → Privacy → Allow localStorage
→ Try different browser
```

**Search not working?**
```
→ Click in search box at top of sidebar
→ Type guide name (e.g., "multisig")
→ Clear search to see all guides again
```

---

## 🌐 Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully supported |
| Edge | 90+ | ✅ Fully supported |
| Firefox | 88+ | ✅ Fully supported |
| Safari | 14+ | ✅ Fully supported |
| IE | Any | ❌ Not supported |

---

## 📞 Need Help?

**For Testing Questions:**
→ See 🎯 Master Testing Guide
→ Check 🐛 Bug Reporting Guide
→ Review ⚙️ Testnet Setup

**For HTML Guide Issues:**
→ See HTML_GUIDE_README.md
→ Try different browser
→ Regenerate: `python3 build-html-guide.py`

---

## 🎉 You're Ready!

```
1. Open testing-guide.html in your browser
2. Bookmark the page
3. Navigate to 🎯 Master Testing Guide
4. Start testing!
```

**Happy Testing! 🧪**
