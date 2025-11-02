# Bitcoin Wallet Testing Guides - Complete Index

## 🚀 Start Here: Interactive HTML Guide

**⭐ NEW: Open `testing-guide.html` for the best testing experience!**

### Quick Launch
```bash
# Double-click this file:
📂 testing-guide.html

# Or use launcher:
./open-guide.sh       # Linux/Mac
open-guide.bat        # Windows
```

**Features:**
- ✅ Left-side navigation with search
- ✅ Interactive checkboxes (auto-saved)
- ✅ Hyperlinking between guides
- ✅ Responsive design (mobile-friendly)
- ✅ Single 871KB file (works offline)

**Documentation:**
- 📖 [HTML_GUIDE_README.md](HTML_GUIDE_README.md) - Full documentation
- 🚀 [QUICK_START.md](QUICK_START.md) - 5-minute quick start
- 📊 [HTML_TESTING_GUIDE_SUMMARY.md](HTML_TESTING_GUIDE_SUMMARY.md) - Implementation details

---

## 📚 All Testing Guides

### Core Testing Guides
| Guide | Purpose | Format |
|-------|---------|--------|
| [README.md](README.md) | Testing overview | Markdown |
| [MASTER_TESTING_GUIDE.md](MASTER_TESTING_GUIDE.md) | Main workflow (6 phases) | Markdown |
| [TESTNET_SETUP_GUIDE.md](TESTNET_SETUP_GUIDE.md) | Environment setup | Markdown |
| [PRIORITY_TEST_EXECUTION_GUIDE.md](PRIORITY_TEST_EXECUTION_GUIDE.md) | P0 smoke tests | Markdown |
| [BUG_REPORTING_GUIDE.md](BUG_REPORTING_GUIDE.md) | Bug documentation | Markdown |
| [TEST_RESULTS_TRACKER.md](TEST_RESULTS_TRACKER.md) | Progress tracking | Markdown |
| [VISUAL_TESTING_REFERENCE.md](VISUAL_TESTING_REFERENCE.md) | UI/UX validation | Markdown |
| [BITCOIN_SPECIFIC_TESTING.md](BITCOIN_SPECIFIC_TESTING.md) | Bitcoin protocol | Markdown |
| [EXTENSION_INSTALLATION_GUIDE.md](EXTENSION_INSTALLATION_GUIDE.md) | Chrome setup | Markdown |
| [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md) | Release checklist | Markdown |

### Feature Test Guides (Detailed Procedures)
| # | Guide | Test Cases | Time |
|---|-------|------------|------|
| 01 | [TAB_ARCHITECTURE.md](FEATURE_TESTS/01_TAB_ARCHITECTURE.md) | 16 | 1-2h |
| 02 | [WALLET_SETUP.md](FEATURE_TESTS/02_WALLET_SETUP.md) | 15 | 2h |
| 03 | [AUTHENTICATION.md](FEATURE_TESTS/03_AUTHENTICATION.md) | 10 | 1h |
| 04 | [ACCOUNT_MANAGEMENT.md](FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md) | 18 | 2-3h |
| 05 | [SEND_TRANSACTIONS.md](FEATURE_TESTS/05_SEND_TRANSACTIONS.md) | 12 | 2h |
| 06 | [RECEIVE_TRANSACTIONS.md](FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md) | 8 | 1h |
| 07 | [TRANSACTION_HISTORY.md](FEATURE_TESTS/07_TRANSACTION_HISTORY.md) | 8 | 1h |
| 08 | [MULTISIG_WALLETS.md](FEATURE_TESTS/08_MULTISIG_WALLETS.md) | 30 | 4h |
| 09 | [SECURITY_FEATURES.md](FEATURE_TESTS/09_SECURITY_FEATURES.md) | 10 | 1-2h |
| 10 | [SETTINGS_PREFERENCES.md](FEATURE_TESTS/10_SETTINGS_PREFERENCES.md) | 8 | 1h |
| 10 | [CONTACT_MANAGEMENT.md](FEATURE_TESTS/10_CONTACT_MANAGEMENT.md) | TBD | 1h |
| 11 | [ACCESSIBILITY_PERFORMANCE.md](FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md) | 12 | 2h |
| 11 | [TRANSACTION_FILTERING.md](FEATURE_TESTS/11_TRANSACTION_FILTERING.md) | TBD | 1h |
| 12 | [TRANSACTION_METADATA.md](FEATURE_TESTS/12_TRANSACTION_METADATA.md) | TBD | 1h |
| 13 | [ENCRYPTED_BACKUP.md](FEATURE_TESTS/13_ENCRYPTED_BACKUP.md) | TBD | 1h |

### Workflow Guides
| Guide | Purpose |
|-------|---------|
| [PSBT_WORKFLOW_TESTING_GUIDE.md](../PSBT_WORKFLOW_TESTING_GUIDE.md) | Multisig PSBT coordination |

---

## 🛠️ Tools & Scripts

| File | Purpose | Usage |
|------|---------|-------|
| `testing-guide.html` | Interactive HTML guide | Open in browser |
| `build-html-guide.py` | HTML generator | `python3 build-html-guide.py` |
| `open-guide.sh` | Linux/Mac launcher | `./open-guide.sh` |
| `open-guide.bat` | Windows launcher | Double-click |

---

## 📖 Documentation

| File | Purpose |
|------|---------|
| `HTML_GUIDE_README.md` | HTML guide full documentation |
| `QUICK_START.md` | 5-minute quick start guide |
| `HTML_TESTING_GUIDE_SUMMARY.md` | Implementation summary |
| `INDEX.md` | This file - complete index |

---

## 🎯 Recommended Testing Workflow

### New Tester? Start Here:

1. **📂 Open Interactive Guide**
   ```bash
   # Double-click or run:
   ./open-guide.sh  # Linux/Mac
   open-guide.bat   # Windows
   ```

2. **📋 Read Master Guide**
   - Click "🎯 Master Testing Guide" in sidebar
   - Understand 6-phase workflow
   - Review 5-day testing plan

3. **⚙️ Setup Environment**
   - Click "⚙️ Testnet Setup" in sidebar
   - Follow setup steps (1 hour)
   - Get testnet Bitcoin
   - Create test wallets

4. **🚀 Run Smoke Tests**
   - Click "🚀 Priority Tests (P0)" in sidebar
   - Execute 20 quick smoke tests (30 min)
   - Verify wallet basics work

5. **🧪 Feature Testing**
   - Click through Feature Tests 01-13
   - Follow step-by-step procedures
   - Check boxes as you complete tests
   - Document bugs using Bug Reporting guide

6. **📊 Track Progress**
   - Your checkbox progress auto-saves
   - Update Test Results Tracker
   - Generate final report

---

## 🌐 Format Comparison

### HTML Guide (Recommended)
✅ Single file, easy to share
✅ Navigation sidebar
✅ Search functionality
✅ Interactive checkboxes
✅ Auto-save progress
✅ Responsive design
✅ Print to PDF

**Best for:** Manual testers, QA engineers, remote teams

### Markdown Guides (Source)
✅ Version control friendly
✅ Edit in any text editor
✅ Generate HTML from source
✅ Git-friendly diffs

**Best for:** Documentation updates, version control

---

## 💡 Pro Tips

### Multi-Monitor Setup
```
Monitor 1: testing-guide.html (reference)
Monitor 2: Bitcoin Wallet extension (testing)
```

### Progress Tracking
```
✅ Check boxes in HTML guide as you test
→ Progress automatically saved
→ Resume testing anytime
```

### Export to PDF
```
1. Open testing-guide.html in browser
2. Ctrl+P (or Cmd+P)
3. Save as PDF
4. Share with team or print
```

### Regenerate HTML
```bash
# After updating markdown files:
cd TESTING_GUIDES
python3 build-html-guide.py
# → testing-guide.html updated!
```

---

## 📞 Getting Help

**For Testing Questions:**
- See Master Testing Guide
- Check Testnet Setup Guide
- Review Bitcoin Specific Testing

**For HTML Guide Help:**
- See HTML_GUIDE_README.md
- Check QUICK_START.md
- Try different browser

**For Technical Issues:**
- Regenerate: `python3 build-html-guide.py`
- Clear browser cache
- Check console (F12)

---

## 📊 Testing Statistics

**Total Guides:** 26+ markdown files
**HTML Guide Size:** 871 KB
**Total Test Cases:** 127+ (across all features)
**Estimated Time:** 16-20 hours (full test suite)
**Quick Smoke Test:** 30 minutes (20 P0 tests)

---

## ✨ What's New

**November 1, 2025:**
- ✅ Interactive HTML testing guide created
- ✅ Left-side navigation with search
- ✅ Interactive checkboxes with auto-save
- ✅ Hyperlinking between guides
- ✅ Responsive mobile-friendly design
- ✅ Single-file 871KB offline guide
- ✅ Launch scripts for all platforms
- ✅ Comprehensive documentation

---

## 🎉 Ready to Test!

```
┌──────────────────────────────────────┐
│                                      │
│   🚀 GET STARTED IN 3 STEPS:        │
│                                      │
│   1. Open testing-guide.html        │
│   2. Click "Master Testing Guide"   │
│   3. Start testing! ✅              │
│                                      │
└──────────────────────────────────────┘
```

**Questions?** See [HTML_GUIDE_README.md](HTML_GUIDE_README.md)

**Happy Testing! 🧪**
