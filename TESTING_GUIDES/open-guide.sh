#!/bin/bash
# Launch the Interactive HTML Testing Guide in the default browser

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HTML_FILE="$SCRIPT_DIR/testing-guide.html"

if [ ! -f "$HTML_FILE" ]; then
    echo "❌ Error: testing-guide.html not found!"
    echo "Run: python3 build-html-guide.py"
    exit 1
fi

echo "🚀 Opening Bitcoin Wallet Testing Guide..."
echo "📂 File: $HTML_FILE"

# Detect OS and open with appropriate command
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "$HTML_FILE" 2>/dev/null || sensible-browser "$HTML_FILE" 2>/dev/null || firefox "$HTML_FILE" 2>/dev/null
    echo "✅ Opened in browser (Linux)"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$HTML_FILE"
    echo "✅ Opened in browser (macOS)"
elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start "$HTML_FILE"
    echo "✅ Opened in browser (Windows)"
else
    echo "⚠️  Unknown OS: $OSTYPE"
    echo "📂 Open manually: file://$HTML_FILE"
fi

echo ""
echo "💡 Tip: Bookmark this page for quick access!"
echo "🔍 Use the search box in the sidebar to find guides quickly"
echo "✅ Click checkboxes to track your testing progress"
