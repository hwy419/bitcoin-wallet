# Interactive HTML Testing Guide

## Overview

The Interactive HTML Testing Guide provides a browser-based interface for navigating and executing all Bitcoin Wallet manual tests. It includes all testing documentation in a single, self-contained HTML file with advanced features.

## Features

✅ **Left-Side Navigation**
- Organized by category (Core Guides, Feature Tests, Workflows)
- Icons for quick visual identification
- Active guide highlighting

✅ **Hyperlinking**
- Internal links automatically converted to navigate between guides
- External links to testnet explorers and resources preserved

✅ **Search Functionality**
- Real-time search across all guide titles
- Filter navigation sidebar instantly

✅ **Progress Tracking**
- Interactive checkboxes for test cases
- Progress automatically saved to browser localStorage
- Persistent across sessions

✅ **Browser-Friendly**
- Responsive design (works on desktop, tablet, mobile)
- Print-friendly styles for PDF export
- No internet connection required (runs from filesystem)
- Clean, modern interface

## Usage

### Method 1: Open Directly
1. Navigate to the `TESTING_GUIDES/` directory
2. Double-click `testing-guide.html`
3. File opens in your default browser

### Method 2: Via Terminal
```bash
# Linux/Mac
xdg-open TESTING_GUIDES/testing-guide.html

# Mac
open TESTING_GUIDES/testing-guide.html

# Windows
start TESTING_GUIDES/testing-guide.html
```

### Method 3: Via Browser
1. Open your browser (Chrome, Firefox, Edge, Safari)
2. Press `Ctrl+O` (or `Cmd+O` on Mac)
3. Navigate to `bitcoin_wallet/TESTING_GUIDES/testing-guide.html`
4. Click "Open"

## Navigation

### Sidebar Navigation
- Click any guide title in the left sidebar to view that guide
- The active guide is highlighted in orange
- Scroll through the sidebar to access all guides

### Search
- Type in the search box at the top of the sidebar
- Navigation filters in real-time
- Clear search to see all guides again

### Internal Links
- Click blue hyperlinks within guides to jump to related sections
- Use browser back button to return to previous guide

### Checkboxes
- Click checkboxes next to test steps to track progress
- Progress is automatically saved in browser
- Clear browser data to reset progress

## Guide Structure

### Core Guides (10 guides)
Essential documentation for setting up and executing tests:
- Overview (README)
- Master Testing Guide (main workflow)
- Testnet Setup (environment configuration)
- Priority Tests (P0 smoke tests)
- Bug Reporting (bug documentation)
- Results Tracker (progress tracking)
- Visual Testing (UI/UX validation)
- Bitcoin Testing (protocol-specific tests)
- Extension Install (Chrome extension setup)
- Distribution (release checklist)

### Feature Tests (15 guides)
Detailed test procedures for each feature area:
- 01-13: Numbered feature test guides
- Covers: Tab architecture, wallet setup, authentication, accounts, transactions, multisig, security, settings, contacts, filtering, metadata, backup

### Workflows (1 guide)
Specialized workflow testing:
- PSBT Workflow (multisig transaction coordination)

## Keyboard Shortcuts

- `Ctrl+F` / `Cmd+F`: Focus search box
- `Ctrl+P` / `Cmd+P`: Print current view
- `Alt+Left Arrow`: Browser back
- `Alt+Right Arrow`: Browser forward

## Updating the Guide

If testing documentation is updated, regenerate the HTML file:

```bash
cd TESTING_GUIDES
python3 build-html-guide.py
```

This will create a new `testing-guide.html` file with the latest markdown content.

## File Locations

```
TESTING_GUIDES/
├── testing-guide.html          # ← Interactive HTML guide (open this!)
├── build-html-guide.py         # Generator script
├── HTML_GUIDE_README.md        # This file
├── README.md                   # Testing guides overview
├── MASTER_TESTING_GUIDE.md     # Master guide (markdown)
├── PRIORITY_TEST_EXECUTION_GUIDE.md
├── TESTNET_SETUP_GUIDE.md
├── ... (other markdown files)
└── FEATURE_TESTS/
    ├── 01_TAB_ARCHITECTURE.md
    ├── 02_WALLET_SETUP.md
    └── ... (feature test markdown files)
```

## Tips

**Bookmark the Guide**
- Bookmark `testing-guide.html` in your browser for quick access
- Create a browser shortcut for rapid testing sessions

**Print to PDF**
- Open `testing-guide.html` in browser
- Press `Ctrl+P` / `Cmd+P`
- Select "Save as PDF"
- Now you have a portable PDF version

**Multi-Monitor Setup**
- Open HTML guide on one monitor
- Open wallet extension on another monitor
- Reference test steps while executing tests

**Progress Tracking**
- Use checkboxes to track completed tests
- Progress saves automatically
- To reset progress: Clear browser data (localStorage)

**Offline Testing**
- HTML guide works completely offline
- No internet connection required (except for external links)
- All styles and scripts embedded

## Browser Compatibility

✅ **Fully Supported:**
- Google Chrome 90+
- Microsoft Edge 90+
- Firefox 88+
- Safari 14+

⚠️ **Limited Support:**
- Internet Explorer (not recommended)
- Older browsers (may have styling issues)

## Troubleshooting

### Guide won't open
- **Solution**: Ensure file has `.html` extension
- **Solution**: Try opening with different browser
- **Solution**: Check file permissions (should be readable)

### Checkboxes not saving
- **Solution**: Ensure browser allows localStorage
- **Solution**: Check browser privacy settings
- **Solution**: Disable "Block third-party cookies" for file:// protocol

### Sidebar not showing
- **Solution**: Refresh page (F5)
- **Solution**: Try different browser
- **Solution**: Check browser console for errors (F12)

### Search not working
- **Solution**: Click in search box and type
- **Solution**: Clear search box and try again
- **Solution**: Refresh page

### Links not working
- **Solution**: Internal links should work (start with #)
- **Solution**: External links require internet connection
- **Solution**: Right-click → "Open in new tab"

## Advanced Usage

### Embed in Internal Wiki
The HTML file is self-contained and can be:
- Uploaded to internal wiki/documentation platform
- Hosted on web server
- Embedded in iframe

### Customize Styling
To customize colors/fonts:
1. Open `build-html-guide.py`
2. Edit CSS variables in the `:root` section
3. Run `python3 build-html-guide.py`
4. New `testing-guide.html` generated with custom styles

### Export to PDF with Table of Contents
1. Open `testing-guide.html` in Chrome
2. Print → Save as PDF
3. Enable "Headers and footers"
4. PDF includes navigation structure

## Benefits Over Markdown

| Feature | Markdown | HTML Guide |
|---------|----------|------------|
| Navigation | Manual file switching | Click sidebar links |
| Search | File-by-file | Search all guides |
| Progress Tracking | Manual notes | Interactive checkboxes (saved) |
| Hyperlinking | Requires IDE/editor | Native browser links |
| Mobile Access | Requires Markdown viewer | Any browser |
| Offline Access | Yes | Yes |
| Print Layout | Basic | Optimized |
| File Size | ~300KB total | 871KB (all-in-one) |

## Support

**Questions?**
- Check [MASTER_TESTING_GUIDE.md](./MASTER_TESTING_GUIDE.md) for testing workflow
- See [TESTNET_SETUP_GUIDE.md](./TESTNET_SETUP_GUIDE.md) for environment setup
- Review original markdown files for additional context

**Found a Bug in HTML Guide?**
- Report to development team
- Include browser version and screenshot
- Specify which guide/section has the issue

---

**Happy Testing! 🧪**

Open `testing-guide.html` in your browser and start validating the Bitcoin Wallet on testnet.
