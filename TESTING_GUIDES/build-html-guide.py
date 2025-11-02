#!/usr/bin/env python3
"""
Bitcoin Wallet Testing Guide - HTML Builder (Markdown Renderer Version)
Embeds markdown content and renders with marked.js for natural presentation
"""

import os
import json
from pathlib import Path
from datetime import datetime

# Guide structure and metadata
GUIDES = {
    "core": [
        {"file": "README.md", "title": "Overview", "icon": "📋"},
        {"file": "MASTER_TESTING_GUIDE.md", "title": "Master Testing Guide", "icon": "🎯"},
        {"file": "TESTNET_SETUP_GUIDE.md", "title": "Testnet Setup", "icon": "⚙️"},
        {"file": "PRIORITY_TEST_EXECUTION_GUIDE.md", "title": "Priority Tests (P0)", "icon": "🚀"},
        {"file": "BUG_REPORTING_GUIDE.md", "title": "Bug Reporting", "icon": "🐛"},
        {"file": "TEST_RESULTS_TRACKER.md", "title": "Results Tracker", "icon": "📊"},
        {"file": "VISUAL_TESTING_REFERENCE.md", "title": "Visual Testing", "icon": "🎨"},
        {"file": "BITCOIN_SPECIFIC_TESTING.md", "title": "Bitcoin Testing", "icon": "₿"},
        {"file": "EXTENSION_INSTALLATION_GUIDE.md", "title": "Extension Install", "icon": "📦"},
        {"file": "DISTRIBUTION_GUIDE.md", "title": "Distribution", "icon": "🌐"},
    ],
    "feature_tests": [
        {"file": "FEATURE_TESTS/01_TAB_ARCHITECTURE.md", "title": "01. Tab Architecture", "icon": "🪟"},
        {"file": "FEATURE_TESTS/02_WALLET_SETUP.md", "title": "02. Wallet Setup", "icon": "💼"},
        {"file": "FEATURE_TESTS/03_AUTHENTICATION.md", "title": "03. Authentication", "icon": "🔐"},
        {"file": "FEATURE_TESTS/04_ACCOUNT_MANAGEMENT.md", "title": "04. Account Management", "icon": "👤"},
        {"file": "FEATURE_TESTS/05_SEND_TRANSACTIONS.md", "title": "05. Send Transactions", "icon": "📤"},
        {"file": "FEATURE_TESTS/06_RECEIVE_TRANSACTIONS.md", "title": "06. Receive Transactions", "icon": "📥"},
        {"file": "FEATURE_TESTS/07_TRANSACTION_HISTORY.md", "title": "07. Transaction History", "icon": "📜"},
        {"file": "FEATURE_TESTS/08_MULTISIG_WALLETS.md", "title": "08. Multisig Wallets", "icon": "🔑"},
        {"file": "FEATURE_TESTS/09_SECURITY_FEATURES.md", "title": "09. Security Features", "icon": "🛡️"},
        {"file": "FEATURE_TESTS/10_SETTINGS_PREFERENCES.md", "title": "10. Settings", "icon": "⚙️"},
        {"file": "FEATURE_TESTS/10_CONTACT_MANAGEMENT.md", "title": "10. Contact Management", "icon": "📇"},
        {"file": "FEATURE_TESTS/11_ACCESSIBILITY_PERFORMANCE.md", "title": "11. Accessibility", "icon": "♿"},
        {"file": "FEATURE_TESTS/11_TRANSACTION_FILTERING.md", "title": "11. Transaction Filtering", "icon": "🔍"},
        {"file": "FEATURE_TESTS/12_TRANSACTION_METADATA.md", "title": "12. Transaction Metadata", "icon": "🏷️"},
        {"file": "FEATURE_TESTS/13_ENCRYPTED_BACKUP.md", "title": "13. Encrypted Backup", "icon": "💾"},
    ],
    "workflows": [
        {"file": "PSBT_WORKFLOW_TESTING_GUIDE.md", "title": "PSBT Workflow", "icon": "🔄"},
    ]
}


def read_file(filepath):
    """Read markdown file content"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"Warning: File not found: {filepath}")
        return None


def escape_for_js(content):
    """Escape content for embedding in JavaScript"""
    if content is None:
        return ""
    # Escape backslashes first, then quotes, then newlines
    content = content.replace('\\', '\\\\')
    content = content.replace('`', '\\`')
    content = content.replace('${', '\\${')
    return content


def generate_nav_html(guides):
    """Generate navigation sidebar HTML"""
    nav_html = '''<nav id="sidebar">
  <div class="sidebar-header">
    <h2>₿ Bitcoin Wallet</h2>
    <p>Testing Guides</p>
  </div>

  <div class="search-box">
    <input type="text" id="search-input" placeholder="Search guides..." />
  </div>

  <div class="nav-section">
    <h3>Core Guides</h3>
    <ul>
'''

    for guide in guides['core']:
        guide_id = guide['file'].replace('.md', '').replace('/', '-').lower()
        nav_html += f'      <li><a href="#{guide_id}" class="nav-link" data-guide="{guide_id}">{guide["icon"]} {guide["title"]}</a></li>\n'

    nav_html += '''    </ul>
  </div>

  <div class="nav-section">
    <h3>Feature Tests</h3>
    <ul>
'''

    for guide in guides['feature_tests']:
        guide_id = guide['file'].replace('.md', '').replace('FEATURE_TESTS/', 'feature-').replace('/', '-').lower()
        nav_html += f'      <li><a href="#{guide_id}" class="nav-link" data-guide="{guide_id}">{guide["icon"]} {guide["title"]}</a></li>\n'

    nav_html += '''    </ul>
  </div>

  <div class="nav-section">
    <h3>Workflows</h3>
    <ul>
'''

    for guide in guides['workflows']:
        guide_id = guide['file'].replace('../', '').replace('.md', '').replace('/', '-').lower()
        nav_html += f'      <li><a href="#{guide_id}" class="nav-link" data-guide="{guide_id}">{guide["icon"]} {guide["title"]}</a></li>\n'

    nav_html += '''    </ul>
  </div>
</nav>
'''
    return nav_html


def generate_markdown_data(guides, base_dir):
    """Generate JavaScript object containing all markdown content"""
    markdown_data = "const markdownContent = {\n"

    # Process all guides
    all_guides = []
    all_guides.extend([('core', g) for g in guides['core']])
    all_guides.extend([('feature', g) for g in guides['feature_tests']])
    all_guides.extend([('workflow', g) for g in guides['workflows']])

    for category, guide in all_guides:
        guide_id = guide['file'].replace('.md', '').replace('../', '').replace('./', '').replace('/', '-').lower()
        if category == 'feature':
            guide_id = guide_id.replace('feature_tests', 'feature')

        file_path = os.path.join(base_dir, guide['file'])
        content = read_file(file_path)

        if content:
            escaped_content = escape_for_js(content)
            markdown_data += f'  "{guide_id}": `{escaped_content}`,\n'

    markdown_data += "};\n"
    return markdown_data


def generate_html():
    """Generate complete HTML file with markdown renderer"""
    base_dir = Path(__file__).parent

    html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bitcoin Wallet - Testing Guide</title>

    <!-- Marked.js - Markdown Renderer -->
    <script src="https://cdn.jsdelivr.net/npm/marked@9.1.6/marked.min.js"></script>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --primary-color: #f7931a;
            --secondary-color: #4a90e2;
            --dark-bg: #1a1a2e;
            --sidebar-bg: #16213e;
            --content-bg: #fafafa;
            --text-primary: #24292f;
            --text-secondary: #57606a;
            --border-color: #d0d7de;
            --success-color: #10b981;
            --warning-color: #f59e0b;
            --error-color: #ef4444;
            --code-bg: #f6f8fa;
            --link-color: #0969da;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-primary);
            display: flex;
            min-height: 100vh;
            background: var(--content-bg);
        }

        /* Sidebar Styles */
        #sidebar {
            width: 280px;
            background: var(--sidebar-bg);
            color: white;
            padding: 16px;
            overflow-y: auto;
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 100;
            border-right: 1px solid #30363d;
        }

        .sidebar-header {
            margin-bottom: 20px;
            padding-bottom: 16px;
            border-bottom: 2px solid var(--primary-color);
        }

        .sidebar-header h2 {
            font-size: 20px;
            color: var(--primary-color);
            margin-bottom: 4px;
            font-weight: 600;
        }

        .sidebar-header p {
            font-size: 13px;
            color: #8b949e;
        }

        .search-box {
            margin-bottom: 16px;
        }

        #search-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #30363d;
            border-radius: 6px;
            background: #0d1117;
            color: white;
            font-size: 14px;
        }

        #search-input::placeholder {
            color: #6e7681;
        }

        #search-input:focus {
            outline: 2px solid var(--primary-color);
            background: #161b22;
        }

        .nav-section {
            margin-bottom: 20px;
        }

        .nav-section h3 {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6e7681;
            margin-bottom: 8px;
            font-weight: 600;
        }

        .nav-section ul {
            list-style: none;
        }

        .nav-section li {
            margin-bottom: 2px;
        }

        .nav-link {
            display: block;
            padding: 6px 10px;
            color: #c9d1d9;
            text-decoration: none;
            border-radius: 6px;
            transition: all 0.15s;
            font-size: 13px;
        }

        .nav-link:hover {
            background: rgba(255, 255, 255, 0.08);
            color: var(--primary-color);
        }

        .nav-link.active {
            background: var(--primary-color);
            color: white;
            font-weight: 500;
        }

        /* Main Content Styles */
        #content {
            margin-left: 280px;
            padding: 32px 48px;
            max-width: 1280px;
            width: 100%;
            background: white;
            min-height: 100vh;
        }

        .guide-section {
            display: none;
        }

        .guide-section.active {
            display: block;
            animation: fadeIn 0.2s ease-in;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        /* GitHub-style Markdown Rendering */
        .markdown-body {
            font-size: 16px;
            line-height: 1.6;
        }

        .markdown-body h1 {
            font-size: 32px;
            font-weight: 600;
            padding-bottom: 0.3em;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 16px;
            margin-top: 24px;
        }

        .markdown-body h1:first-child {
            margin-top: 0;
        }

        .markdown-body h2 {
            font-size: 24px;
            font-weight: 600;
            padding-bottom: 0.3em;
            border-bottom: 1px solid var(--border-color);
            margin-top: 24px;
            margin-bottom: 16px;
        }

        .markdown-body h3 {
            font-size: 20px;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 16px;
        }

        .markdown-body h4 {
            font-size: 16px;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 16px;
        }

        .markdown-body p {
            margin-bottom: 16px;
        }

        .markdown-body a {
            color: var(--link-color);
            text-decoration: none;
        }

        .markdown-body a:hover {
            text-decoration: underline;
        }

        .markdown-body code {
            background: var(--code-bg);
            padding: 0.2em 0.4em;
            border-radius: 6px;
            font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, 'Courier New', monospace;
            font-size: 85%;
        }

        .markdown-body pre {
            background: var(--code-bg);
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 16px 0;
            border: 1px solid var(--border-color);
        }

        .markdown-body pre code {
            background: none;
            padding: 0;
            font-size: 85%;
        }

        .markdown-body ul,
        .markdown-body ol {
            padding-left: 2em;
            margin-bottom: 16px;
        }

        .markdown-body li {
            margin-bottom: 0.25em;
        }

        .markdown-body li > p {
            margin-bottom: 0.5em;
        }

        .markdown-body input[type="checkbox"] {
            margin-right: 0.5em;
            cursor: pointer;
            width: 16px;
            height: 16px;
            vertical-align: middle;
        }

        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            margin: 16px 0;
            display: block;
            overflow-x: auto;
        }

        .markdown-body table th {
            background: var(--code-bg);
            padding: 6px 13px;
            border: 1px solid var(--border-color);
            font-weight: 600;
            text-align: left;
        }

        .markdown-body table td {
            padding: 6px 13px;
            border: 1px solid var(--border-color);
        }

        .markdown-body table tr:nth-child(even) {
            background: var(--code-bg);
        }

        .markdown-body blockquote {
            padding: 0 1em;
            color: var(--text-secondary);
            border-left: 0.25em solid var(--border-color);
            margin: 16px 0;
        }

        .markdown-body hr {
            height: 0.25em;
            padding: 0;
            margin: 24px 0;
            background-color: var(--border-color);
            border: 0;
        }

        .markdown-body img {
            max-width: 100%;
            border-radius: 6px;
            margin: 16px 0;
        }

        /* Welcome Section */
        .welcome-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px;
            border-radius: 12px;
            margin-bottom: 24px;
        }

        .welcome-section h1 {
            color: white;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            padding-bottom: 16px;
            margin-bottom: 20px;
        }

        .welcome-section h3 {
            color: white;
            margin-top: 20px;
        }

        .welcome-section a {
            color: var(--primary-color);
            font-weight: 600;
        }

        .welcome-section .tip-box {
            background: rgba(255,255,255,0.15);
            border-left: 4px solid var(--primary-color);
            padding: 16px;
            margin-top: 20px;
            border-radius: 6px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
            #sidebar {
                width: 100%;
                position: relative;
                height: auto;
            }

            #content {
                margin-left: 0;
                padding: 16px;
            }
        }

        /* Print Styles */
        @media print {
            #sidebar {
                display: none;
            }

            #content {
                margin-left: 0;
                max-width: 100%;
            }

            .guide-section {
                display: block !important;
                page-break-before: always;
            }

            .guide-section:first-child {
                page-break-before: avoid;
            }
        }

        /* Scrollbar Styling */
        #sidebar::-webkit-scrollbar {
            width: 8px;
        }

        #sidebar::-webkit-scrollbar-track {
            background: #0d1117;
        }

        #sidebar::-webkit-scrollbar-thumb {
            background: #30363d;
            border-radius: 4px;
        }

        #sidebar::-webkit-scrollbar-thumb:hover {
            background: #484f58;
        }
    </style>
</head>
<body>
'''

    html += generate_nav_html(GUIDES)

    html += '''
    <main id="content">
        <section id="welcome" class="guide-section active">
            <div class="welcome-section markdown-body">
                <h1>Bitcoin Wallet Testing Guides</h1>
                <p><strong>Welcome to the Interactive Testing Guide!</strong></p>
                <p>This is a comprehensive manual testing guide for the Bitcoin Wallet Chrome Extension v0.12.0.</p>

                <h3>Quick Start</h3>
                <ol>
                    <li>📋 Read the <a href="#readme">Overview</a> to understand the structure</li>
                    <li>🎯 Start with the <a href="#master-testing-guide">Master Testing Guide</a></li>
                    <li>⚙️ Set up your environment using <a href="#testnet-setup-guide">Testnet Setup</a></li>
                    <li>🚀 Run <a href="#priority-test-execution-guide">Priority Tests</a> (30 min smoke test)</li>
                    <li>🔍 Execute feature tests systematically</li>
                </ol>

                <h3>Features</h3>
                <ul>
                    <li>✅ Interactive checkboxes to track progress</li>
                    <li>🔍 Search across all guides</li>
                    <li>📱 Responsive design for mobile/tablet</li>
                    <li>🔗 Hyperlinked navigation between guides</li>
                    <li>💾 Progress saved in browser localStorage</li>
                </ul>

                <div class="tip-box">
                    <strong>💡 Tip:</strong> Use the sidebar to navigate between guides. Your checkbox progress is automatically saved!
                </div>
            </div>
        </section>
'''

    # Add empty sections for each guide (will be filled by JavaScript)
    all_guides = []
    all_guides.extend([('core', g) for g in GUIDES['core']])
    all_guides.extend([('feature', g) for g in GUIDES['feature_tests']])
    all_guides.extend([('workflow', g) for g in GUIDES['workflows']])

    for category, guide in all_guides:
        guide_id = guide['file'].replace('.md', '').replace('../', '').replace('./', '').replace('/', '-').lower()
        if category == 'feature':
            guide_id = guide_id.replace('feature_tests', 'feature')

        html += f'        <section id="{guide_id}" class="guide-section"><div class="markdown-body"></div></section>\n'

    html += '''    </main>

    <script>
'''

    # Embed markdown content
    html += generate_markdown_data(GUIDES, base_dir)

    html += '''
        // Configure marked options
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        });

        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        const sections = document.querySelectorAll('.guide-section');

        function renderMarkdown(sectionId) {
            const section = document.getElementById(sectionId);
            if (!section || sectionId === 'welcome') return;

            const container = section.querySelector('.markdown-body');
            if (!container) return;

            // Check if already rendered
            if (container.innerHTML.trim() !== '') return;

            const markdown = markdownContent[sectionId];
            if (markdown) {
                container.innerHTML = marked.parse(markdown);

                // Make checkboxes interactive
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                checkboxes.forEach((checkbox, index) => {
                    const checkboxId = `${sectionId}-checkbox-${index}`;

                    // Load saved state
                    const saved = localStorage.getItem(checkboxId);
                    if (saved === 'true') {
                        checkbox.checked = true;
                    }

                    // Save on change
                    checkbox.addEventListener('change', () => {
                        localStorage.setItem(checkboxId, checkbox.checked);
                    });
                });

                // Handle internal links
                const links = container.querySelectorAll('a');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    if (href && href.startsWith('#')) {
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            let targetId = href.substring(1);
                            // Try to find matching section
                            if (document.getElementById(targetId)) {
                                showSection(targetId);
                            }
                        });
                    } else if (href && href.endsWith('.md')) {
                        // Convert markdown links to section links
                        link.addEventListener('click', (e) => {
                            e.preventDefault();
                            let targetId = href.replace('.md', '').replace('../', '').replace('./', '').replace('/', '-').toLowerCase();
                            targetId = targetId.replace('feature_tests', 'feature');
                            if (document.getElementById(targetId)) {
                                showSection(targetId);
                            }
                        });
                    }
                });
            }
        }

        function showSection(sectionId) {
            sections.forEach(section => section.classList.remove('active'));
            navLinks.forEach(link => link.classList.remove('active'));

            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                // Render markdown if not already rendered
                renderMarkdown(sectionId);

                targetSection.classList.add('active');
                document.querySelector(`[data-guide="${sectionId}"]`)?.classList.add('active');
                window.scrollTo(0, 0);

                // Update URL hash
                window.location.hash = sectionId;
            }
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const guideId = link.getAttribute('data-guide');
                showSection(guideId);
            });
        });

        // Handle hash navigation
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.substring(1);
            if (hash) showSection(hash);
        });

        // Initialize
        window.addEventListener('DOMContentLoaded', () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                showSection(hash);
            } else {
                showSection('welcome');
            }
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();

            navLinks.forEach(link => {
                const text = link.textContent.toLowerCase();
                const listItem = link.parentElement;

                if (text.includes(query)) {
                    listItem.style.display = 'block';
                } else {
                    listItem.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>'''

    # Write HTML file
    output_path = os.path.join(base_dir, 'testing-guide.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html)

    print(f"✅ HTML Testing Guide generated: {output_path}")
    print(f"📂 Open in browser: file://{os.path.abspath(output_path)}")
    print(f"")
    print(f"✨ New features:")
    print(f"   • Markdown rendered with marked.js (GitHub-style)")
    print(f"   • Compact, natural spacing")
    print(f"   • Better typography and readability")
    print(f"   • All interactive features preserved")
    return output_path


if __name__ == '__main__':
    generate_html()
