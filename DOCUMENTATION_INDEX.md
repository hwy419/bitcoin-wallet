# Documentation Index

This file provides a comprehensive index of all documentation, planning documents, conversation history, and expert notes in the Bitcoin Wallet Chrome Extension project.

## Planning Documents

**Location**: `prompts/docs/plans/`

All planning documents, architecture designs, and technical specifications are stored here. When creating new plans or architectural documents, save them to this folder and update the list below.

### Current Plans

| Document | Description | Status |
|----------|-------------|--------|
| **ARCHITECTURE.md** | Complete system architecture, data flow diagrams, component interactions, security model | ✅ Complete |
| **BLOCKSTREAM_API_PROXY_PLAN.md** | **PRIMARY PRODUCTION ARCHITECTURE**: AWS Lambda + API Gateway proxy for secure Blockstream API access, Infrastructure as Code (AWS CDK), complete implementation guide (6-8 hours), cost analysis (~$5-10/month), security model (API key protection), monitoring & operations, prevents API key exposure in client-side code | ✅ Complete (Ready to Implement) |
| **SELF_HOSTED_ESPLORA_AWS_PLAN.md** | **FUTURE SCALING OPTION**: Self-hosted Bitcoin Esplora node on AWS for high-volume production (1M+ requests/month), Infrastructure as Code (AWS CDK), complete deployment guide (4-5 days), cost analysis ($50-200/month), triggers for implementation (when Lambda proxy reaches limits), hybrid approach with Lambda fallback | ✅ Complete (Planning) |
| **TRANSACTION_BUILDER_SUMMARY.md** | Bitcoin transaction builder implementation details, UTXO selection, fee estimation, PSBT construction | ✅ Complete |
| **TESTING.md** | Testing strategy, test plans, QA processes, coverage requirements | 📝 In Progress |
| **DARK_MODE_DESIGN_SPEC.md** | Dark mode design specifications, color palette, component styling guidelines | ✅ Complete |
| **DARK_MODE_IMPLEMENTATION_GUIDE.md** | Step-by-step dark mode implementation guide, Tailwind configuration, component updates | ✅ Complete |
| **DARK_MODE_VISUAL_EXAMPLES.md** | Visual examples and screenshots of dark mode implementation across components | ✅ Complete |
| **DARK_MODE_SUMMARY.md** | Summary of dark mode implementation, changes made, and final results | ✅ Complete |
| **DARK_MODE_COMPLETE.md** | Dark mode completion report and final checklist | ✅ Complete |
| **MULTISIG_UI_DESIGN_SPEC.md** | Original multisig UI design specifications and wireframes for popup-based wizard implementation | ✅ Complete |
| **MULTISIG_UI_IMPLEMENTATION_SUMMARY.md** | Implementation summary for multisig UI components, wizard flow, design decisions, component integration | ✅ Complete |
| **MULTISIG_SECURITY_AUDIT_REPORT.md** | Comprehensive security audit of multisig implementation, threat analysis, vulnerability assessment | ✅ Complete |
| **MULTISIG_COMPLIANCE_REPORT.md** | BIP compliance verification for multisig implementation (BIP32, BIP39, BIP44, BIP48, BIP67, BIP174) | ✅ Complete |
| **TAB_BASED_MULTISIG_WIZARD_PRD.md** | Product requirements document for tab-based multisig wizard, user stories, acceptance criteria, edge cases, implementation timeline | ✅ Complete |
| **MULTISIG_WIZARD_TAB_DESIGN_SPEC.md** | Complete UX design specification for tab-based wizard, ASCII wireframes, 800px centered layout, responsive breakpoints, testing checklist | ✅ Complete |
| **MULTISIG_WIZARD_TAB_VISUAL_SUMMARY.md** | Quick reference guide for tab-based wizard design with visual comparisons and implementation checklist | ✅ Complete |
| **SIDEBAR_ACCOUNT_SWITCHER_DESIGN_SPEC.md** | Complete design specification for enhanced sidebar account switcher, consolidating account management (switching, create, import, multisig) into dropdown panel | ✅ Complete |
| **SIDEBAR_ACCOUNT_SWITCHER_VISUAL_GUIDE.md** | Visual reference guide with ASCII diagrams for sidebar account switcher, component states, color chart, animation timelines, interaction flows | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_PRD.md** | Product requirements document for per-account private key export/import: WIF format, optional password protection, PDF export with QR codes, user stories, edge cases, success metrics | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_SECURITY_SPEC.md** | Comprehensive security analysis and specification for private key export/import: threat model, attack vectors, encryption specs (100K PBKDF2), validation requirements, secure coding rules, testing requirements | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_UX_SPEC.md** | Complete UX/UI design specification (25,000+ words) with 10 component specs, modal flows, security warnings, accessibility requirements | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_VISUAL_GUIDE.md** | Visual reference with ASCII wireframes, color charts, button styles, error messages, PDF layout examples | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_FRONTEND_PLAN.md** | Implementation-ready frontend plan (24,000+ words) with component architecture, state management, TypeScript interfaces, complete code examples | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_BACKEND_PLAN.md** | Implementation-ready backend plan (30,000+ words): WIFManager module, message handlers (EXPORT/IMPORT/VALIDATE), private key extraction, WIF encoding/decoding, encryption, network validation, duplicate detection, security implementation, complete code examples | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_BACKEND_SUMMARY.md** | Quick reference backend summary: architecture overview, implementation checklist, key details (WIF format, encryption params, network validation), security rules, integration points | ✅ Complete |
| **PRIVATE_KEY_EXPORT_IMPORT_SUMMARY.md** | Quick reference summary of all documents, development workflow, testing checklist, next steps | ✅ Complete |
| **ENCRYPTED_BACKUP_EXPORT_UX_SPEC.md** | Complete UX specification (18,000+ words) for encrypted wallet backup export: 5-modal security-first flow, password strength meter, progress tracking, accessibility guidelines | ✅ Complete |
| **ENCRYPTED_BACKUP_EXPORT_VISUAL_GUIDE.md** | Visual reference guide with ASCII wireframes for all 5 backup export modals, component specs, color charts, animation timings, responsive design patterns | ✅ Complete |
| **ENCRYPTED_BACKUP_EXPORT_SUMMARY.md** | Executive summary of encrypted backup export design: feature overview, design decisions, implementation phases, testing plan, success metrics | ✅ Complete |
| **SEND_RECEIVE_MODAL_DESIGN_FIX.md** | Design specification for fixing Send/Receive modal visual layering issues: conditional rendering solution, modal vs tab mode, component structure, implementation guide, testing checklist | ✅ Complete |
| **BITCOIN_PRIVACY_ENHANCEMENT_PLAN.md** | Comprehensive privacy enhancement plan based on Bitcoin Privacy wiki: fix change address reuse, randomized UTXO selection, auto-generate receive addresses, contacts privacy warnings, optional Privacy Mode toggles (round number randomization, API delays, broadcast delays) | ✅ Complete |
| **PRIVACY_ENHANCEMENT_PRD.md** | Product Requirements Document for Bitcoin Privacy Enhancement (v0.11.0): User stories with acceptance criteria, success metrics, priority validation (P0/P1/P2), product trade-offs, UX requirements, edge cases, testing requirements, Blockchain Expert audit handoff with specific questions and deliverables | ✅ Complete |
| **PRIVACY_ENHANCEMENT_SUMMARY.md** | Executive summary of privacy enhancement project: critical issues, solution architecture, product decisions, success metrics, implementation phases, Blockchain Expert handoff, risk assessment, release strategy | ✅ Complete |
| **PRIVACY_AUDIT_REPORT.md** | Privacy audit report from Blockchain/Security experts: vulnerability severity classifications, baseline privacy metrics, Bitcoin Privacy Wiki compliance scorecard, technical validation of proposed fixes, quantitative privacy analysis | ✅ Complete |
| **PRIVACY_UI_UX_DESIGN_SPEC.md** | Complete UI/UX design specification (25,000+ words) for privacy enhancement features: Privacy Mode settings section, Receive screen auto-generation banners, Contacts privacy badge system, privacy indicators & tooltips, education patterns, ASCII wireframes, accessibility requirements | ✅ Complete |
| **PRIVACY_BACKEND_IMPLEMENTATION_PLAN.md** | Implementation-ready backend plan (30,000+ words): Fix change address reuse (P0), randomized UTXO selection (P1), contacts privacy tracking, privacy settings storage, round number randomization, API timing delays, broadcast delays, message handler specs, storage schema, testing strategy, migration plan | ✅ Complete |
| **WALLET_RESTORE_FROM_PRIVATE_KEY_PRD.md** | Product Requirements Document (18,000+ words) for wallet restore from private key (WIF) during setup: User stories with acceptance criteria, success metrics, priority validation (P0/P1/P2), product trade-offs, UX requirements, edge cases, testing requirements, Blockchain Expert handoff | ✅ Complete |
| **WALLET_RESTORE_BLOCKCHAIN_TECHNICAL_REVIEW.md** | Blockchain Expert technical review (15,000+ words): Bitcoin protocol compliance, non-HD wallet architecture validation, address derivation from WIF, UTXO selection, change address handling, BIP compliance, verdict: APPROVED | ✅ Complete |
| **WALLET_RESTORE_SECURITY_HANDOFF.md** | Security Expert handoff (22,000+ words): 7 critical security questions, encryption strategy, attack vector analysis, memory handling, rate limiting, privacy warning levels, wallet structure validation, migration security | ⏳ Pending Security Review |
| **WALLET_RESTORE_UX_DESIGN_SPEC.md** | Complete UX design specification (30,000+ words): User flows with wireframes, 14 component specs, address type selector design, privacy warnings, error handling, accessibility (WCAG AA), animation specs, design tokens | ✅ Complete |
| **WALLET_RESTORE_BACKEND_PLAN.md** | Implementation-ready backend plan (26,000+ words): Message handler implementation, non-HD wallet structure, WIFManager enhancements, conditional transaction signing, wallet validation, rate limiting, error handling, testing requirements, security checklist | ✅ Complete |
| **WALLET_RESTORE_BACKEND_SUMMARY.md** | Backend quick reference (4,000+ words): Implementation checklist, code snippets, testing checklist, error codes, common pitfalls, non-HD wallet example, development workflow | ✅ Complete |
| **WALLET_RESTORE_COMPLETE_SUMMARY.md** | Complete feature summary: Document index (6 planning docs), architecture overview, implementation phases, key technical decisions, security considerations, success metrics, release plan, FAQ | ✅ Complete |
| **EXPORT_CLARITY_UX_DESIGN.md** | Complete UX redesign (32,000+ words) to clarify export options: Export Options dropdown (consistent UI), new Backup & Export section (education layer), enhanced modal headers (context), comparison table (quick reference), tooltips system, mobile responsive, accessibility (WCAG AA) | ✅ Complete |
| **EXPORT_CLARITY_VISUAL_GUIDE.md** | Visual reference guide for export clarity redesign: Before/after comparisons, color chart (security warnings), component specs (dropdowns, tooltips), icon legend, desktop/mobile layouts, CSS classes, animation timings, testing checklists, copy-paste component starters | ✅ Complete |
| **EXPORT_CLARITY_SUMMARY.md** | Executive summary of export clarity redesign: Problem statement (inconsistent buttons, zero context), solution overview (3 major changes), document structure, implementation timeline (3-4 weeks), success metrics (90% comprehension, 50% support reduction), phased rollout plan | ✅ Complete |
| **WALLET_BACKUP_RESTORE_PRD.md** | Product Requirements Document (85,000+ words) for complete wallet backup and restore system: EXPORT entire wallet (accounts, contacts, settings, multisig, imported keys) to encrypted .dat file with separate password (600K PBKDF2), IMPORT/RESTORE from backup (fresh install or replace existing wallet), encrypted file format specification (two-layer encryption), version migration (v1→v2), conflict resolution, edge cases, integration points (Settings + Setup screens), handoff documentation for all experts | ✅ Complete |
| **HD_WALLET_ENFORCEMENT_UX_SPEC.md** | Complete UX design specification (50,000+ words) for enforcing HD-only wallet creation and account segregation: Wallet Setup flow redesign (remove private key import at setup), account grouping with collapsible sections (Sidebar + Settings), context-aware export button logic (Xpub vs Key), visual badges (HD, Imported, Multisig), edge cases & empty states, accessibility (WCAG AA), implementation phases (13-16 hours), testing checklist | ✅ Complete |
| **HD_WALLET_ENFORCEMENT_VISUAL_GUIDE.md** | Visual reference guide with ASCII wireframes for HD wallet enforcement: Before/after comparisons (Wallet Setup, Sidebar, Settings), badge color chart (blue, amber, purple), section header specs, account card layout, empty state designs, user journey diagrams, copy-paste component starters, implementation quick reference | ✅ Complete |
| **HD_WALLET_ENFORCEMENT_SUMMARY.md** | Executive summary of HD wallet enforcement redesign: Problem statement (non-HD wallet creation, flat account lists, incorrect export buttons), solution overview (3-tab setup, grouped sections, context-aware buttons), key design decisions, user journey changes, implementation plan (3 days), success metrics, approval checklist | ✅ Complete |
| **BLOCKSTREAM_API_PROXY_PRD.md** | Product Requirements Document for Lambda proxy (40,000+ words): Problem statement (API key security vulnerability), product goals, 25+ user stories with acceptance criteria, success metrics, functional/non-functional requirements, edge cases, security requirements, risk assessment, questions for technical teams, 8-phase implementation plan, pre-deployment approval checklist | ✅ Complete |
| **BLOCKSTREAM_API_PROXY_SUMMARY.md** | Executive summary and quick reference guide for Lambda proxy project: TL;DR (30 second summary), critical security issue explanation, architecture overview, product validation, implementation plan (8 phases), cost breakdown, risk assessment, rollback plan, document index, quick start guide for all roles, pre-deployment checklist | ✅ Complete |
| **TRANSACTION_LIST_ENHANCEMENT_PRD.md** | Product Requirements Document for transaction list pagination and filtering (v0.12.0): Pagination system (10/35/50/100/500 items per page), search by sender address, filter by amount range, transaction hash search, combined filters, layout reorganization (transactions above addresses), newest-first sort order, user stories, success metrics, technical architecture, implementation plan (6 weeks) | ✅ Complete |
| **TRANSACTION_LIST_PAGINATION_FILTER_DESIGN_SPEC.md** | Complete UI/UX design specification for transaction list enhancement: Filter panel design (collapsible), pagination controls layout, active filter pills, empty states, accessibility (WCAG AA), responsive design (mobile/tablet/desktop), ASCII wireframes, component specs, interaction patterns, animation timings, testing checklist | ✅ Complete |
| **ADDRESS_LIST_ENHANCEMENT_PRD.md** | Product Requirements Document for address list enhancement (v0.12.0): Reverse chronological sort order (newest addresses first), visual "Most Recent" indicator, pagination system (10/35/50/100/500 items per page), consistent UX with transaction list, address type handling, user stories, success metrics, technical architecture, implementation plan (1.5 weeks), open questions for implementation | ✅ Complete |
| **ADDRESS_LIST_PAGINATION_DESIGN_SPEC.md** | Complete UI/UX design specification (25,000+ words) for address list pagination & creation order display: "Most Recent" badge design (3 options analyzed, badge + border pattern selected), reverse chronological sort (newest first, all types intermixed), pagination interface (10 items default, bottom-only placement), address row layout (type badge, balance, label, creation date), relative timestamp formatting, collapsible section, component states (loading, empty, error, single address), responsive behavior (desktop/tablet/mobile), accessibility (WCAG AA, ARIA, keyboard nav, screen readers), 5 design decisions with rationale, ASCII wireframes, testing checklist | ✅ Complete |

### Convention

When creating new planning documents:
1. Save to `prompts/docs/plans/` directory
2. Use descriptive UPPERCASE names (e.g., `FEATURE_ROADMAP.md`)
3. Add an entry to this table with description and status
4. Reference the plan in relevant expert notes if applicable

## Conversation History

**Location**: `prompts/docs/chats/`

All Claude Code conversation exports are stored here for reference and context. These provide detailed history of implementation decisions, debugging sessions, and development progress.

**Naming Convention**: `YYYYMMDDHHMMSS-descriptive-title.txt`

### Current Chats

| Date | Filename | Topics Covered |
|------|----------|----------------|
| 2025-10-12 | `20251012101017-bitcoin-wallet-mvp-complete-implementation.txt` | Complete MVP implementation: Fixed WebAssembly CSP, implemented all UI screens (WalletSetup, Dashboard, Send, Receive, Settings), Blockstream API client, transaction builder, backend message handlers, documentation updates |

### Convention

When exporting conversations:
1. Use `/export prompts/docs/chats/YYYYMMDDHHMMSS-descriptive-title.md`
2. Add entry to this table with date, filename, and brief summary of topics
3. Use descriptive titles that summarize the main achievements or focus areas

## Expert Documentation

**New Segmented Structure** (migrated Oct 2025):

All experts maintain detailed, topic-segmented documentation in `prompts/docs/experts/{domain}/`:

| Expert Domain | Directory | Quick Start | Detailed Topics |
|--------------|-----------|-------------|-----------------|
| **Blockchain Expert** | `experts/blockchain/` | [_INDEX.md](prompts/docs/experts/blockchain/_INDEX.md) | architecture, addresses, transactions, utxo, multisig, decisions |
| **BitcoinOS Expert** | `experts/bitcoinos/` | [_INDEX.md](prompts/docs/experts/bitcoinos/_INDEX.md) | bitsnark, grail-bridge, merkle-mesh, architecture, use-cases, security, integration-guide, roadmap, decisions |
| **Security Expert** | `experts/security/` | [_INDEX.md](prompts/docs/experts/security/_INDEX.md) | encryption, key-management, threat-model, audits, decisions |
| **Frontend Developer** | `experts/frontend/` | [_INDEX.md](prompts/docs/experts/frontend/_INDEX.md) | architecture, components, state, styling, decisions |
| **Backend Developer** | `experts/backend/` | [_INDEX.md](prompts/docs/experts/backend/_INDEX.md) | service-worker, messages, storage, api, decisions |
| **UI/UX Designer** | `experts/design/` | [_INDEX.md](prompts/docs/experts/design/_INDEX.md) | design-system, components, user-flows, accessibility, decisions |
| **Product Manager** | `experts/product/` | [_INDEX.md](prompts/docs/experts/product/_INDEX.md) | roadmap, requirements, features, decisions |
| **QA Engineer** | `experts/qa/` | [_INDEX.md](prompts/docs/experts/qa/_INDEX.md) | test-plans, test-cases, bugs, decisions |
| **Testing Expert** | `experts/testing/` | [_INDEX.md](prompts/docs/experts/testing/_INDEX.md) | unit-tests, integration, infrastructure, decisions |

### Benefits of Segmented Structure

- **Faster navigation** - find specific info quickly
- **Better organization** - related content grouped logically
- **Easier maintenance** - update specific topics without scrolling through thousands of lines
- **Clearer cross-references** - explicit links between related topics
- **Smaller context windows** - read only what you need

**Legacy Files:** Original monolithic `*-notes.md` files remain in `prompts/docs/` for reference during transition.

## UI Design References

Visual design examples and inspiration in `docs/ui-examples/`:
- `home_main_screen.png` - Main dashboard layout
- `send.png` & `receive.png` - Transaction flows
- `account_dropdown.png` - Account switcher
- `Tokens.png` & `token_detail.png` - Asset management
- `settings.png` - Settings and preferences
- `Activity_account_history.png` - Transaction history
- And more...

💡 **Design inspiration**: These UI examples inform the design system. See UI/UX Designer notes for how they're being adapted for our extension.

## How Documentation is Organized

1. **Quick Reference**: `CLAUDE.md` - Start here for project overview and agent quick reference
2. **Agent Usage**: `AGENT_USAGE_GUIDE.md` - Detailed guide on when and how to use specialized agents
3. **Planning Documents**: `prompts/docs/plans/` - Architecture, specifications, technical plans
4. **Expert Notes**: `prompts/docs/experts/{domain}/` - Domain-specific implementation details (segmented by topic)
5. **Visual Reference**: `docs/ui-examples/` - Design inspiration
6. **User Documentation**: `README.md` and `CHANGELOG.md` - User guide and version history
7. **Development Tips**: `DEVELOPMENT_TIPS.md` - Developer experience enhancements
8. **This Index**: `DOCUMENTATION_INDEX.md` - Complete documentation catalog
