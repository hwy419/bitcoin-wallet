# Frontend Developer - Quick Reference

**Last Updated**: November 1, 2025
**Role**: Frontend Developer
**Purpose**: React components, state management, UI implementation, Tailwind styling

---

## Current Status

### Implemented ✅
- Tab-based architecture (full viewport with 240px sidebar)
- Account management sidebar with dropdown switcher
- Multisig wallet wizard (6-step flow)
- Dark mode support
- Transaction history with detail pane
- Balance charts and visualizations
- Private key import/export modals
- Contacts management V2
- Wallet restore from private key (WIF) during setup (v0.11.0)
- **Address list pagination with "Most Recent" indicator** - v0.12.0
- **Transaction list pagination and advanced filtering system** - v0.12.0
  - FilterPanel component with sender address, amount range, and transaction hash filters
  - Pagination with configurable items per page (10, 35, 50, 100, 500)
  - Transaction sorting (pending first, newest to oldest)
  - Combined filters with AND logic
  - Reorganized dashboard layout (transactions above addresses)
- **Privacy Mode Toggle (Balance Concealment)** - v0.12.0
  - PrivacyContext for global privacy state management
  - PrivacyBalance component with click-to-toggle functionality
  - Privacy section in Settings with toggle switch
  - Balance concealment in Dashboard and TransactionRow
  - Storage persistence across tabs
  - Keyboard accessibility support
- **Transaction Metadata and Contact Tagging UI** - NEW v0.12.0
  - TransactionDetailPane: Tags & Notes section with collapsible editor
    - Category autocomplete (free-form, max 30 chars)
    - TagInput component for transaction tags (max 10 tags, 30 chars each)
    - Notes textarea (max 500 chars)
    - Lock indicator when wallet locked
    - Fetch metadata and suggestions from background
  - ContactDetailPane: Right-side flyout (480px) for contact details
    - Avatar, name, email, category, notes inline editing
    - Custom tags editor (key-value pairs, add/edit/remove inline)
    - Statistics: transaction count, last activity
    - Recent transactions list (last 5)
    - Edit/Delete actions
  - ContactDetailPane Integration:
    - ContactsScreen: Click contact card to open detail pane
    - Dashboard: Click contact from transaction to open detail pane
  - AddEditContactModal: Custom Tags section
    - Add/edit/remove custom key-value tags
    - Max key length: 30 chars, max value length: 100 chars
    - No duplicate keys validation
  - ContactCard: Tag display
    - Show first 3 tags as colored badges
    - "+ X more" indicator when > 3 tags
    - Full tag list in expanded state
  - SendScreen: "Add to Contacts" functionality
    - Button in success screen when recipient not in contacts
    - Pre-fills address and category ("Payment")
    - Success message after adding

### In Progress ⏳
- None

### Planned 📋
- Hardware wallet connect flow
- Advanced coin control UI

---

## Documentation Map

- [**architecture.md**](./architecture.md) - Component hierarchy, routing, tab layout
- [**components.md**](./components.md) - Component library and specs
- [**state.md**](./state.md) - React Context, hooks, data flow
- [**styling.md**](./styling.md) - Tailwind, design tokens, responsive patterns
- [**decisions.md**](./decisions.md) - Frontend ADRs

---

## Recent Changes (Last 5)

1. **2025-11-01**: CSV Export/Import with Contact Tags Support - Base64-encoded tags in CSV format, ContactsStorage updates, CSVImportModal help text (v0.12.0)
2. **2025-11-01**: Transaction Metadata and Contact Tagging UI - ContactDetailPane, TransactionDetailPane metadata section, AddEditContactModal tags, ContactCard tag display, SendScreen "Add to Contacts" (v0.12.0)
3. **2025-10-30**: Privacy Mode Toggle implementation - PrivacyContext, PrivacyBalance component, Settings integration (v0.12.0)
4. **2025-10-30**: Transaction list pagination and filtering system - FilterPanel component, advanced search/filter (v0.12.0)
5. **2025-10-30**: Address list pagination component with "Most Recent" badge (v0.12.0)

---

## Quick Reference

### Component Hierarchy
```
App
├── Sidebar (Account switcher, navigation)
├── TabContent
│   ├── Dashboard
│   ├── SendScreen
│   ├── ReceiveScreen
│   ├── ContactsScreen
│   ├── SettingsScreen
│   └── AccountManagementScreen
└── Modals (Portal-rendered)
```

### Key Hooks
- `useWallet()` - Global wallet state
- `useBackgroundMessaging()` - Message passing
- `useBalanceUpdater()` - Auto-refresh balances
- `useTransactionHistory()` - Transaction list
- `usePrivacy()` - Privacy mode state (balancesHidden, togglePrivacy)

### Tailwind Conventions
- Spacing: 4px increments (p-4, m-2, etc.)
- Colors: Custom palette in tailwind.config.js
- Dark mode: `dark:` prefix
- Responsive: `sm:`, `md:`, `lg:` breakpoints

---

**Need detailed information?** Navigate to the specific documentation files linked above.
